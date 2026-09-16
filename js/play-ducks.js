'use strict';

// Ankkaonginta: kiireetön kenttä ilman sydämiä ja liikkumista. Lammessa
// lipuu kymmenen numeroankkaa kolmella kaistalla eri suuntiin. Napauta
// lampeen: koukku sukeltaa napautuskohtaan (0,35 s) — ennakoi ankan liike.
// Ankat pyydetään numerojärjestyksessä 1…10: seuraava numero näkyy kuplassa.
// Väärä ankka pärskähtää takaisin lampeen. Tehtävät avautuvat 4 ja 8 ankan jälkeen.

var DUCK_COUNT = 10;
var DUCK_LANES = [
  { fy: 0.50, sp: 0.10 },
  { fy: 0.63, sp: -0.13 },
  { fy: 0.76, sp: 0.16 }
];
var ducks = {
  list: [], next: 1,
  hook: { x: 0, y: 0, state: 'rest', t: 0, tx: 0, ty: 0, caught: null },
  wrongT: 0, taskDelay: 0, finishT: 0, splashes: []
};

function duckRestPos() { return { x: viewW * 0.5, y: viewH * 0.3 }; }
function duckRodTip() { return { x: viewW * 0.17, y: viewH * 0.22 }; }
function duckShelfPos(n) { return { x: viewW * (0.3 + (n - 1) * 0.072), y: viewH * 0.1 }; }
function duckPondTop() { return viewH * 0.42; }

function initDucks() {
  var i, lane, k, perLane = [4, 3, 3], idx = 0;
  var nums = shuffleNums([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  tasks = [makeTask(-5, 'route'), makeTask(-5, 'pay')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  ducks.list = [];
  for (lane = 0; lane < 3; lane++) {
    for (k = 0; k < perLane[lane]; k++) {
      ducks.list.push({ n: nums[idx++], lane: lane, fx: (k + 0.5) / perLane[lane] + (Math.random() - 0.5) * 0.08, phase: Math.random() * Math.PI * 2, caught: false, dropT: -1, dropX: 0 });
    }
  }
  ducks.next = 1;
  ducks.hook.state = 'rest';
  ducks.hook.t = 0;
  ducks.hook.caught = null;
  ducks.hook.x = duckRestPos().x;
  ducks.hook.y = duckRestPos().y;
  ducks.wrongT = 0;
  ducks.taskDelay = 0;
  ducks.finishT = 0;
  ducks.splashes = [];
  princess.x = viewW * 0.1;
  princess.y = viewH * 0.43;
  princess.facing = 1;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnDucks() {}
function resizeDucks() {
  princess.x = viewW * 0.1;
  princess.y = viewH * 0.43;
  if (ducks.hook.state === 'rest') { ducks.hook.x = duckRestPos().x; ducks.hook.y = duckRestPos().y; }
}

function duckPos(d) {
  return { x: d.fx * viewW, y: DUCK_LANES[d.lane].fy * viewH + Math.sin(d.phase) * viewH * 0.008 };
}

function handleDucksTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var h = ducks.hook;
  if (h.state !== 'rest') return;
  if (py < duckPondTop()) return;
  h.tx = Math.min(Math.max(px, viewW * 0.06), viewW * 0.96);
  h.ty = Math.min(Math.max(py, duckPondTop() + viewH * 0.04), viewH * 0.82);
  h.state = 'drop';
  h.t = 0;
  playNote(880, 0, 0.08, 'sine', 0.2);
  playNote(660, 0.06, 0.1, 'sine', 0.2);
}

function duckCaughtRight(d) {
  d.caught = true;
  ducks.next++;
  var sp = duckShelfPos(d.n);
  spawnSparkles(sp.x, sp.y, 14, '#ffe27a');
  playNote(600 + d.n * 50, 0, 0.2, 'triangle', 0.4);
  playNote(900 + d.n * 50, 0.1, 0.3, 'triangle', 0.35);
  if (ducks.next === 5 || ducks.next === 9) ducks.taskDelay = 0.8;
  if (ducks.next > DUCK_COUNT) ducks.finishT = 1.0;
}

function updateDucks(dt) {
  var i, d, h = ducks.hook, rp = duckRestPos(), f;
  updateTasks(dt);
  var busy = puzzleBusy();
  if (ducks.wrongT > 0) ducks.wrongT -= dt;
  if (ducks.taskDelay > 0 && !busy) {
    ducks.taskDelay -= dt;
    if (ducks.taskDelay <= 0) {
      if (ducks.next === 5 && !tasks[0].opened) taskStart(tasks[0]);
      else if (ducks.next === 9 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (ducks.finishT > 0 && !celebrating && !busy) {
    ducks.finishT -= dt;
    if (ducks.finishT <= 0) startCelebration();
  }
  // Ankat lipuvat kaistoillaan
  for (i = 0; i < ducks.list.length; i++) {
    d = ducks.list[i];
    d.phase += dt * 2.5;
    if (d.caught || h.caught === d) continue;
    if (d.dropT >= 0) {
      d.dropT += dt;
      if (d.dropT > 0.5) d.dropT = -1;
      continue;
    }
    if (busy || celebrating) continue;
    d.fx += DUCK_LANES[d.lane].sp * dt;
    if (d.fx > 1.1) d.fx -= 1.2;
    if (d.fx < -0.1) d.fx += 1.2;
  }
  // Koukku
  if (h.state === 'drop') {
    h.t += dt;
    f = Math.min(1, h.t / 0.35);
    h.x = rp.x + (h.tx - rp.x) * f;
    h.y = rp.y + (h.ty - rp.y) * (f * f);
    if (f >= 1) {
      var best = null, bd = 1e9;
      for (i = 0; i < ducks.list.length; i++) {
        d = ducks.list[i];
        if (d.caught || d.dropT >= 0) continue;
        var p = duckPos(d), dx = p.x - h.x, dy = p.y - h.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < viewH * 0.065 && dist < bd) { bd = dist; best = d; }
      }
      h.caught = best;
      h.state = 'rise';
      h.t = 0;
      ducks.splashes.push({ x: h.x, y: h.y, t: 0 });
      playNote(best ? 500 : 300, 0, 0.12, 'triangle', best ? 0.3 : 0.15);
    }
  } else if (h.state === 'rise') {
    h.t += dt;
    f = Math.min(1, h.t / 0.55);
    h.x = h.tx + (rp.x - h.tx) * f;
    h.y = h.ty + (rp.y - h.ty) * f;
    if (f >= 1) {
      d = h.caught;
      h.caught = null;
      h.state = 'rest';
      if (d) {
        if (d.n === ducks.next) duckCaughtRight(d);
        else {
          d.dropT = 0;
          d.fx = rp.x / viewW;
          ducks.wrongT = 0.6;
          playNote(300, 0, 0.1, 'square', 0.15);
          playNote(240, 0.1, 0.15, 'square', 0.15);
        }
      }
    }
  } else {
    h.x = rp.x + Math.sin(globalT * 1.5) * viewW * 0.004;
    h.y = rp.y + Math.sin(globalT * 2) * viewH * 0.006;
  }
  for (i = ducks.splashes.length - 1; i >= 0; i--) {
    ducks.splashes[i].t += dt;
    if (ducks.splashes[i].t > 0.6) ducks.splashes.splice(i, 1);
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderDucksBg(b, w, h) {
  var vw = viewW, i, x, y, pt = duckPondTop();
  var sky = b.createLinearGradient(0, 0, 0, pt);
  sky.addColorStop(0, '#8ed3ff');
  sky.addColorStop(1, '#e6f6ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, pt);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, vw * 0.55, h * 0.2, h * 0.028);
  cloudShape(b, vw * 0.85, h * 0.27, h * 0.022);
  // Kojun katos ja kyltti ylhäällä: ankkahylly
  b.fillStyle = '#ffb300';
  b.fillRect(vw * 0.24, h * 0.02, vw * 0.74, h * 0.055);
  b.fillStyle = '#fff';
  for (x = vw * 0.24; x < vw * 0.98; x += h * 0.09) b.fillRect(x, h * 0.02, h * 0.045, h * 0.055);
  b.fillStyle = '#ffb300';
  for (x = vw * 0.24 + h * 0.0225; x < vw * 0.98; x += h * 0.045) { b.beginPath(); b.arc(x, h * 0.075, h * 0.0225, 0, Math.PI); b.fill(); }
  b.fillStyle = '#8a5a30';
  roundRect(b, vw * 0.26, h * 0.145, vw * 0.7, h * 0.02, h * 0.006);
  b.fill();
  for (i = 1; i <= DUCK_COUNT; i++) {
    var sp = duckShelfPos(i);
    b.fillStyle = 'rgba(255,255,255,0.55)';
    b.beginPath(); b.arc(sp.x, sp.y + h * 0.012, h * 0.03, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgba(120,80,40,0.5)';
    b.font = 'bold ' + Math.round(h * 0.03) + 'px ' + TASK_FONT;
    b.textAlign = 'center';
    b.textBaseline = 'middle';
    b.fillText(String(i), sp.x, sp.y + h * 0.014);
  }
  // Nurmi ja laituri
  var gr = b.createLinearGradient(0, pt - h * 0.05, 0, pt);
  gr.addColorStop(0, '#9fdc7f');
  gr.addColorStop(1, '#6fbb60');
  b.fillStyle = gr;
  b.fillRect(0, pt - h * 0.05, w, h * 0.05);
  // Lampi
  var water = b.createLinearGradient(0, pt, 0, h);
  water.addColorStop(0, '#5fc7e8');
  water.addColorStop(1, '#1f6fa8');
  b.fillStyle = water;
  b.fillRect(0, pt, w, h - pt);
  b.strokeStyle = 'rgba(255,255,255,0.22)';
  b.lineWidth = Math.max(1, h * 0.004);
  for (y = pt + h * 0.03; y < h; y += h * 0.045) {
    b.beginPath();
    for (x = -10; x <= w + 10; x += 12) { var wy = y + Math.sin(x / (h * 0.07) + y) * h * 0.004; if (x === -10) b.moveTo(x, wy); else b.lineTo(x, wy); }
    b.stroke();
  }
  // Lumpeet ja kaislat reunoilla
  for (i = 0; i < 6; i++) {
    x = vw * (0.05 + i * 0.185) + (i % 2) * vw * 0.03;
    y = h * (0.86 + (i % 3) * 0.035);
    b.fillStyle = '#4fb356';
    b.beginPath();
    if (b.ellipse) b.ellipse(x, y, h * 0.035, h * 0.016, 0, 0, Math.PI * 2); else b.arc(x, y, h * 0.02, 0, Math.PI * 2);
    b.fill();
    if (i % 2) { b.fillStyle = '#ff7bac'; b.beginPath(); b.arc(x, y - h * 0.008, h * 0.009, 0, Math.PI * 2); b.fill(); }
  }
  b.strokeStyle = '#3f9a44';
  b.lineWidth = Math.max(2, h * 0.006);
  b.lineCap = 'round';
  for (i = 0; i < 5; i++) {
    x = vw * (0.9 + (i % 3) * 0.03);
    b.beginPath(); b.moveTo(x, pt + h * 0.02); b.quadraticCurveTo(x + h * 0.02, pt - h * 0.06, x + h * 0.01, pt - h * 0.14 - (i % 2) * h * 0.03); b.stroke();
  }
  // Laituri prinsessalle
  b.fillStyle = '#a97a4a';
  b.fillRect(0, pt - h * 0.02, vw * 0.2, h * 0.035);
  b.fillStyle = '#8a5a30';
  b.fillRect(vw * 0.04, pt + h * 0.015, h * 0.02, h * 0.1);
  b.fillRect(vw * 0.16, pt + h * 0.015, h * 0.02, h * 0.1);
}

function drawRubberDuck(c, x, y, s, n, dir, dim) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.globalAlpha = dim ? 0.6 : 1;
  // Heijastus
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, s * 0.5, s * 1.1, s * 0.22, 0, 0, Math.PI * 2); else c.arc(0, s * 0.5, s * 0.8, 0, Math.PI * 2);
  c.fill();
  // Vartalo
  var g = c.createRadialGradient(-s * 0.2, -s * 0.3, s * 0.1, 0, 0, s * 1.1);
  g.addColorStop(0, '#fff3a0');
  g.addColorStop(1, '#ffc832');
  c.fillStyle = g;
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.95, s * 0.6, 0, 0, Math.PI * 2); else c.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  c.fill();
  // Pyrstö
  c.beginPath(); c.moveTo(-s * 0.8, -s * 0.1); c.lineTo(-s * 1.25, -s * 0.55); c.lineTo(-s * 0.6, -s * 0.45); c.closePath(); c.fill();
  // Pää
  c.beginPath(); c.arc(s * 0.55, -s * 0.65, s * 0.42, 0, Math.PI * 2); c.fill();
  // Nokka
  c.fillStyle = '#ff8f3a';
  c.beginPath();
  if (c.ellipse) c.ellipse(s * 1.0, -s * 0.6, s * 0.26, s * 0.14, 0.1, 0, Math.PI * 2); else c.arc(s * 1.0, -s * 0.6, s * 0.18, 0, Math.PI * 2);
  c.fill();
  // Silmä
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 0.68, -s * 0.75, s * 0.06, 0, Math.PI * 2); c.fill();
  // Siipi
  c.fillStyle = 'rgba(255,190,60,0.9)';
  c.beginPath();
  if (c.ellipse) c.ellipse(-s * 0.25, 0.05 * s, s * 0.45, s * 0.25, -0.3, 0, Math.PI * 2); else c.arc(-s * 0.25, 0, s * 0.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Numero valkoisessa pallossa (ei peilattu)
  c.globalAlpha = dim ? 0.6 : 1;
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - dir * s * 0.1, y, s * 0.34, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#5a3a8a';
  c.font = 'bold ' + Math.round(s * 0.5) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), x - dir * s * 0.1, y + s * 0.02);
  c.globalAlpha = 1;
}

function drawFishingRod(c) {
  var tip = duckRodTip(), h = ducks.hook, s = viewH * 0.03;
  var handX = princess.x + viewH * 0.03, handY = princess.y - viewH * 0.09;
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2.5, viewH * 0.008);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(handX, handY); c.quadraticCurveTo(tip.x - viewW * 0.02, handY - viewH * 0.1, tip.x, tip.y); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, viewH * 0.002);
  c.beginPath(); c.moveTo(tip.x, tip.y); c.quadraticCurveTo((tip.x + h.x) / 2, Math.min(tip.y, h.y) - viewH * 0.02, h.x, h.y - s * 0.6); c.stroke();
  // Koukku ja koho
  c.fillStyle = '#ff5f5f';
  c.beginPath(); c.arc(h.x, h.y - s * 0.9, s * 0.35, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(h.x, h.y - s * 1.0, s * 0.35, Math.PI, 0); c.fill();
  c.strokeStyle = '#d0d4e0';
  c.lineWidth = Math.max(2, s * 0.15);
  c.beginPath(); c.moveTo(h.x, h.y - s * 0.55); c.lineTo(h.x, h.y); c.arc(h.x + s * 0.2, h.y, s * 0.2, Math.PI, Math.PI * 2.3); c.stroke();
  c.lineCap = 'butt';
}

function drawDucksBubble(c) {
  var x = viewW * 0.1, y = viewH * 0.2, s = viewH * 0.045;
  if (ducks.next > DUCK_COUNT) return;
  drawPromptBubble(c, x, y, s * 3.2, s * 2.6);
  drawRubberDuck(c, x - s * 0.8, y + s * 0.15, s * 0.5, ducks.next, 1, false);
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(s * 1.5) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(ducks.next), x + s * 0.7, y + s * 0.05);
}

function drawDucks() {
  var i, d, p, sp, h = ducks.hook;
  if (!drawWorldBg()) return;
  // Hyllyllä pyydetyt ankat
  for (i = 0; i < ducks.list.length; i++) {
    d = ducks.list[i];
    if (!d.caught) continue;
    sp = duckShelfPos(d.n);
    drawRubberDuck(ctx, sp.x, sp.y + viewH * 0.005, viewH * 0.02, d.n, 1, false);
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 560, 1, 0, false, globalT);
  // Ankat lammessa (takakaista ensin)
  for (i = 0; i < ducks.list.length; i++) {
    d = ducks.list[i];
    if (d.caught || h.caught === d) continue;
    p = duckPos(d);
    var jy = 0, dim = false;
    if (d.dropT >= 0) { jy = -Math.sin(Math.min(1, d.dropT * 2) * Math.PI) * viewH * 0.06; dim = true; }
    drawRubberDuck(ctx, p.x, p.y + jy, viewH * 0.032, d.n, DUCK_LANES[d.lane].sp > 0 ? 1 : -1, dim);
  }
  // Pärskeet
  for (i = 0; i < ducks.splashes.length; i++) {
    var spl = ducks.splashes[i], f = spl.t / 0.6;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - f)) + ')';
    ctx.lineWidth = Math.max(1.5, viewH * 0.004);
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(spl.x, spl.y, viewH * 0.02 + f * viewH * 0.07, viewH * 0.008 + f * viewH * 0.028, 0, 0, Math.PI * 2); else ctx.arc(spl.x, spl.y, viewH * 0.02 + f * viewH * 0.05, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawFishingRod(ctx);
  if (h.caught) drawRubberDuck(ctx, h.x, h.y + viewH * 0.02, viewH * 0.032, h.caught.n, 1, false);
  drawDucksBubble(ctx);
  if (ducks.wrongT > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, ducks.wrongT * 2) + ')';
    ctx.font = 'bold ' + Math.round(viewH * 0.05) + 'px ' + TASK_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', duckRestPos().x + viewH * 0.07, duckRestPos().y - viewH * 0.03 - (0.6 - ducks.wrongT) * viewH * 0.05);
  }
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawTaskOverlay(ctx);
}
