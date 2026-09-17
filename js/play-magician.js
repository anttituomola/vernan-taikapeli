'use strict';

// Taikurin teltta: Tivolisaaren vartija. Taikuripupu piilottaa kultatähden
// kupin alle ja sekoittaa kupit — seuraa silmillä ja napauta oikeaa kuppia.
// Kolme kierrosta: 3 kuppia / 3 vaihtoa, 3 kuppia / 5 vaihtoa, 4 kuppia /
// 6 vaihtoa nopeammin. Väärä kuppi vie sydämen ja tähti näytetään uudestaan.
// Kierrosten välissä tehtäväportit. Lopuksi taikuri nostaa kultatähden hatusta
// ja ilotulitus alkaa: tähti kruunaa saaristokartan sateenkaaren.

var MAG_ROUNDS = [
  { cups: 3, swaps: 3, sp: 0.75 },
  { cups: 3, swaps: 5, sp: 0.5 },
  { cups: 4, swaps: 6, sp: 0.42 }
];
var MAG_CUP_COLORS = ['#ff5f7e', '#5fa8ff', '#5fd36b', '#ffd23e'];
var mag = {
  round: 0, state: 'show', t: 0, cups: [], starCup: 0, swapsLeft: 0,
  swapA: -1, swapB: -1, picked: -1, taskDelay: 0, fw: [], fwT: 0, hopT: 0, wandT: 0
};

function magSlotX(slot, n) {
  return viewW / 2 + (slot - (n - 1) / 2) * Math.min(viewW * 0.2, viewH * 0.26);
}
function magTableY() { return viewH * 0.64; }

function magSetupRound() {
  var r = MAG_ROUNDS[mag.round], i;
  mag.cups = [];
  for (i = 0; i < r.cups; i++) mag.cups.push({ slot: i, fromSlot: i, x: magSlotX(i, r.cups), lift: 1, arc: 0 });
  mag.starCup = randInt(r.cups);
  mag.swapsLeft = r.swaps;
  mag.swapA = -1; mag.swapB = -1;
  mag.picked = -1;
  mag.state = 'show';
  mag.t = 0;
}

function initMagician() {
  var i;
  tasks = [makeTask(-5, 'jigsaw', { pieces: 6 }), makeTask(-5, 'clock')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  mag.round = 0;
  mag.taskDelay = 0;
  mag.fw = [];
  mag.fwT = 0;
  mag.hopT = 0;
  mag.wandT = 0;
  magSetupRound();
  princess.x = viewW * 0.16;
  princess.y = viewH * 0.84;
  princess.facing = 1;
  renderBackground();
  playNote(392, 0, 0.3, 'triangle', 0.35);
  playNote(494, 0.15, 0.3, 'triangle', 0.35);
  playNote(587, 0.3, 0.5, 'triangle', 0.4);
}

function respawnMagician() {
  magSetupRound();
  spawnSparkles(viewW / 2, magTableY(), 14, '#ffe27a');
}

function resizeMagician() {
  var i, n = mag.cups.length;
  for (i = 0; i < n; i++) mag.cups[i].x = magSlotX(mag.cups[i].slot, n);
  princess.x = viewW * 0.16;
  princess.y = viewH * 0.84;
}

function magCupY(cup) {
  return magTableY() - cup.lift * viewH * 0.16 - cup.arc;
}

function handleMagicianTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, cup, dx, dy;
  if (mag.state !== 'pick') return;
  for (i = 0; i < mag.cups.length; i++) {
    cup = mag.cups[i];
    dx = px - cup.x; dy = py - (magCupY(cup) - viewH * 0.06);
    if (Math.abs(dx) < viewH * 0.09 && Math.abs(dy) < viewH * 0.12) {
      mag.picked = i;
      mag.state = 'reveal';
      mag.t = 0;
      playNote(660, 0, 0.12, 'sine', 0.3);
      return;
    }
  }
}

function magStartSwap() {
  var n = mag.cups.length, a = randInt(n), b = (a + 1 + randInt(n - 1)) % n, i;
  mag.swapA = -1; mag.swapB = -1;
  for (i = 0; i < n; i++) {
    if (mag.cups[i].slot === a) mag.swapA = i;
    if (mag.cups[i].slot === b) mag.swapB = i;
  }
  for (i = 0; i < n; i++) mag.cups[i].fromSlot = mag.cups[i].slot;
  mag.cups[mag.swapA].slot = b;
  mag.cups[mag.swapB].slot = a;
  mag.t = 0;
  mag.wandT = 0.3;
  playNote(520 + randInt(4) * 60, 0, 0.08, 'sine', 0.18);
}

function magSpawnFirework() {
  var x = viewW * (0.15 + Math.random() * 0.7), y = viewH * (0.12 + Math.random() * 0.3), i, a, sp;
  var col = maneColors[randInt(maneColors.length)];
  for (i = 0; i < 26; i++) {
    a = (i / 26) * Math.PI * 2 + Math.random() * 0.2;
    sp = viewH * (0.18 + Math.random() * 0.12);
    mag.fw.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 1.1 + Math.random() * 0.4, c: col });
  }
  playNote(150 + Math.random() * 100, 0, 0.25, 'triangle', 0.25);
  playNote(1200 + Math.random() * 600, 0.05, 0.4, 'sine', 0.12);
}

function updateMagician(dt) {
  var i, cup, n = mag.cups.length, r = MAG_ROUNDS[mag.round] || MAG_ROUNDS[2], f;
  updateTasks(dt);
  var busy = puzzleBusy();
  if (mag.wandT > 0) mag.wandT -= dt;
  if (mag.hopT > 0) mag.hopT -= dt;
  if (mag.taskDelay > 0 && !busy) {
    mag.taskDelay -= dt;
    if (mag.taskDelay <= 0) {
      if (mag.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (mag.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (!busy && !celebrating) mag.t += dt;

  if (busy) {
    // ei etene tehtävän aikana
  } else if (mag.state === 'show') {
    for (i = 0; i < n; i++) mag.cups[i].lift = 1;
    if (mag.t > 1.3) { mag.state = 'cover'; mag.t = 0; }
  } else if (mag.state === 'cover') {
    f = Math.min(1, mag.t / 0.6);
    for (i = 0; i < n; i++) mag.cups[i].lift = 1 - f;
    if (f >= 1) {
      mag.state = 'shuffle';
      mag.t = 0;
      magStartSwap();
      playNote(330, 0, 0.1, 'triangle', 0.2);
    }
  } else if (mag.state === 'shuffle') {
    f = Math.min(1, mag.t / r.sp);
    for (i = 0; i < n; i++) {
      cup = mag.cups[i];
      var fx = magSlotX(cup.fromSlot, n), tx = magSlotX(cup.slot, n);
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      cup.x = fx + (tx - fx) * e;
      cup.arc = (i === mag.swapA ? 1 : (i === mag.swapB ? -1 : 0)) * Math.sin(f * Math.PI) * viewH * 0.06;
    }
    if (f >= 1) {
      for (i = 0; i < n; i++) { mag.cups[i].fromSlot = mag.cups[i].slot; mag.cups[i].arc = 0; mag.cups[i].x = magSlotX(mag.cups[i].slot, n); }
      mag.swapsLeft--;
      if (mag.swapsLeft > 0) magStartSwap();
      else { mag.state = 'pick'; mag.t = 0; playNote(784, 0, 0.15, 'triangle', 0.3); playNote(988, 0.12, 0.2, 'triangle', 0.3); }
    }
  } else if (mag.state === 'reveal') {
    f = Math.min(1, mag.t / 0.5);
    mag.cups[mag.picked].lift = f;
    if (f >= 1) {
      if (mag.picked === mag.starCup) {
        mag.state = 'win';
        mag.t = 0;
        mag.hopT = 1.2;
        spawnSparkles(mag.cups[mag.picked].x, magTableY() - viewH * 0.05, 24, '#ffe27a');
        playNote(523, 0, 0.2, 'triangle', 0.4);
        playNote(659, 0.12, 0.2, 'triangle', 0.4);
        playNote(784, 0.24, 0.2, 'triangle', 0.4);
        playNote(1047, 0.36, 0.5, 'triangle', 0.45);
      } else {
        mag.state = 'miss';
        mag.t = 0;
        loseHeart();
      }
    }
  } else if (mag.state === 'miss') {
    f = Math.min(1, mag.t / 0.5);
    for (i = 0; i < n; i++) mag.cups[i].lift = Math.max(mag.cups[i].lift, f);
    if (mag.t > 1.6) {
      mag.swapsLeft = r.swaps;
      mag.state = 'cover';
      mag.t = 0;
    }
  } else if (mag.state === 'win') {
    if (mag.t > 1.4) {
      mag.round++;
      if (mag.round >= MAG_ROUNDS.length) {
        mag.state = 'finale';
        mag.t = 0;
        mag.fwT = 0.2;
      } else {
        magSetupRound();
        mag.taskDelay = 0.3;
      }
    }
  } else if (mag.state === 'finale') {
    mag.fwT -= dt;
    if (mag.fwT <= 0) { magSpawnFirework(); mag.fwT = 0.45 + Math.random() * 0.4; }
    if (mag.t > 2.2 && !celebrating) startCelebration();
  }
  if (celebrating) {
    mag.fwT -= dt;
    if (mag.fwT <= 0) { magSpawnFirework(); mag.fwT = 0.5 + Math.random() * 0.4; }
  }
  for (i = mag.fw.length - 1; i >= 0; i--) {
    var p = mag.fw[i];
    p.age += dt;
    if (p.age >= p.life) { mag.fw.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += viewH * 0.12 * dt;
    p.vx *= Math.max(0, 1 - dt * 1.2);
    p.vy *= Math.max(0, 1 - dt * 1.2);
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function magicianLayers() {
  return [
    { speed: 0.22, render: renderMagicianFar },
    { speed: 0.55, render: renderMagicianMid },
    { speed: 1, render: renderMagicianNear }
  ];
}
function renderMagicianBg(b, w, h) {
  renderMagicianFar(b, w, h);
  renderMagicianMid(b, w, h);
  renderMagicianNear(b, w, h);
}
function renderMagicianFar(b, w, h) {
  var vw = viewW, i, x, y;
  var back = b.createLinearGradient(0, 0, 0, h);
  back.addColorStop(0, '#0f0a2e');
  back.addColorStop(1, '#2a1a5a');
  b.fillStyle = back;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.5, h * 0.16, h * 0.06, 0.22, '#c8d4ff', '#ffffff', '#ffe08a');
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 70; i++) {
    x = (i * 173.3) % vw; y = (i * 97.1) % (h * 0.6);
    b.globalAlpha = 0.3 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
}
function renderMagicianMid(b, w, h) {
  var vw = viewW, i, x;
  var cg = b.createLinearGradient(0, 0, vw * 0.14, 0);
  cg.addColorStop(0, '#7a1020');
  cg.addColorStop(0.5, '#c8323c');
  cg.addColorStop(1, '#8a1a2a');
  b.fillStyle = cg;
  for (i = 0; i < 4; i++) {
    b.beginPath();
    b.moveTo(i * vw * 0.035, 0); b.lineTo(i * vw * 0.035 + vw * 0.035, 0);
    b.quadraticCurveTo(i * vw * 0.035 + vw * 0.05, h * 0.4, i * vw * 0.035 + vw * 0.02, h * 0.72);
    b.lineTo(i * vw * 0.035 - vw * 0.01, h * 0.72);
    b.closePath(); b.fill();
    b.beginPath();
    b.moveTo(vw - i * vw * 0.035, 0); b.lineTo(vw - i * vw * 0.035 - vw * 0.035, 0);
    b.quadraticCurveTo(vw - i * vw * 0.035 - vw * 0.05, h * 0.4, vw - i * vw * 0.035 - vw * 0.02, h * 0.72);
    b.lineTo(vw - i * vw * 0.035 + vw * 0.01, h * 0.72);
    b.closePath(); b.fill();
  }
  b.fillStyle = '#c8323c';
  b.fillRect(0, 0, w, h * 0.07);
  for (x = h * 0.05; x < vw + h * 0.1; x += h * 0.1) { b.beginPath(); b.arc(x, h * 0.07, h * 0.05, 0, Math.PI); b.fill(); }
  b.fillStyle = '#ffd24f';
  for (x = h * 0.05; x < vw + h * 0.1; x += h * 0.1) { b.beginPath(); b.arc(x, h * 0.115, h * 0.012, 0, Math.PI * 2); b.fill(); }
}
function renderMagicianNear(b, w, h) {
  var vw = viewW, x, ty = magTableY();
  // Lava
  var fl = b.createLinearGradient(0, h * 0.7, 0, h);
  fl.addColorStop(0, '#b98a5a');
  fl.addColorStop(1, '#6b4a2a');
  b.fillStyle = fl;
  b.fillRect(0, h * 0.7, w, h * 0.3);
  b.fillStyle = 'rgba(0,0,0,0.15)';
  for (x = 0; x < vw; x += h * 0.09) b.fillRect(x, h * 0.7, 2, h * 0.3);
  b.fillStyle = '#ffd24f';
  b.fillRect(0, h * 0.7, w, h * 0.012);
  // Rampin valot
  for (x = h * 0.04; x < vw; x += h * 0.08) {
    var g = b.createRadialGradient(x, h * 0.985, 1, x, h * 0.985, h * 0.03);
    g.addColorStop(0, 'rgba(255,240,180,0.9)');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    b.fillStyle = g;
    b.beginPath(); b.arc(x, h * 0.985, h * 0.03, 0, Math.PI * 2); b.fill();
  }
  // Pöytä
  var tw = Math.min(vw * 0.82, h * 1.2);
  b.fillStyle = '#5a3a8a';
  roundRect(b, vw / 2 - tw / 2, ty - h * 0.02, tw, h * 0.09, h * 0.02);
  b.fill();
  b.fillStyle = '#8a5cb8';
  roundRect(b, vw / 2 - tw / 2, ty - h * 0.02, tw, h * 0.035, h * 0.015);
  b.fill();
  b.fillStyle = '#ffd24f';
  for (x = vw / 2 - tw / 2 + h * 0.04; x < vw / 2 + tw / 2; x += h * 0.08) drawStar(b, x, ty + h * 0.05, h * 0.012, 0, 0);
  b.fillStyle = '#3a2560';
  b.fillRect(vw / 2 - tw * 0.4, ty + h * 0.07, h * 0.03, h * 0.63 - ty);
  b.fillRect(vw / 2 + tw * 0.4 - h * 0.03, ty + h * 0.07, h * 0.03, h * 0.63 - ty);
}

function drawMagicCup(c, x, y, s, color, shake) {
  c.save();
  c.translate(x + shake, y);
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, s * 0.05, s * 0.95, s * 0.2, 0, 0, Math.PI * 2); else c.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  c.fill();
  var g = c.createLinearGradient(-s * 0.9, 0, s * 0.9, 0);
  g.addColorStop(0, color);
  g.addColorStop(0.45, '#ffffff');
  g.addColorStop(0.55, color);
  g.addColorStop(1, color);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-s * 0.9, 0);
  c.lineTo(-s * 0.65, -s * 1.7);
  c.lineTo(s * 0.65, -s * 1.7);
  c.lineTo(s * 0.9, 0);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.moveTo(-s * 0.55, -s * 0.1); c.lineTo(-s * 0.38, -s * 1.6); c.lineTo(-s * 0.2, -s * 1.6); c.lineTo(-s * 0.3, -s * 0.1); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.9, s * 0.16, 0, 0, Math.PI); else c.arc(0, 0, s * 0.5, 0, Math.PI);
  c.fill();
  drawStar(c, 0, -s * 0.85, s * 0.28, 0, 0);
  c.restore();
}

function drawMagicianBunny(c, x, y, s, t) {
  var hop = mag.hopT > 0 ? Math.abs(Math.sin(t * 10)) * s * 0.4 : 0;
  var wave = mag.wandT > 0 || mag.state === 'shuffle' ? Math.sin(t * 14) * 0.6 : Math.sin(t * 1.5) * 0.1;
  // Viitta
  c.fillStyle = '#5a2a9a';
  c.beginPath();
  c.moveTo(x - s * 0.5, y - hop - s * 1.3);
  c.quadraticCurveTo(x - s * 1.3, y - hop - s * 0.3, x - s * 1.1, y - hop + s * 0.05);
  c.lineTo(x + s * 1.1, y - hop + s * 0.05);
  c.quadraticCurveTo(x + s * 1.3, y - hop - s * 0.3, x + s * 0.5, y - hop - s * 1.3);
  c.closePath(); c.fill();
  drawBunny(c, x, y, s, hop, t * 2, false);
  // Rusetti
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.moveTo(x, y - hop - s * 0.98); c.lineTo(x - s * 0.22, y - hop - s * 1.1); c.lineTo(x - s * 0.22, y - hop - s * 0.86); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x, y - hop - s * 0.98); c.lineTo(x + s * 0.22, y - hop - s * 1.1); c.lineTo(x + s * 0.22, y - hop - s * 0.86); c.closePath(); c.fill();
  // Silinteri korvien välissä
  var hy = y - hop - s * 1.05 - s * 0.42;
  c.fillStyle = '#1a1030';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, hy, s * 0.62, s * 0.14, 0, 0, Math.PI * 2); else c.arc(x, hy, s * 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - s * 0.4, hy - s * 0.75, s * 0.8, s * 0.75);
  c.fillStyle = '#8a4dff';
  c.fillRect(x - s * 0.4, hy - s * 0.25, s * 0.8, s * 0.14);
  c.fillStyle = '#1a1030';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, hy - s * 0.75, s * 0.4, s * 0.09, 0, 0, Math.PI * 2); else c.arc(x, hy - s * 0.75, s * 0.4, 0, Math.PI * 2);
  c.fill();
  // Taikasauva kädessä
  c.save();
  c.translate(x + s * 0.7, y - hop - s * 0.6);
  c.rotate(-0.8 + wave);
  c.strokeStyle = '#1a1030';
  c.lineWidth = Math.max(2, s * 0.1);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.9); c.stroke();
  c.strokeStyle = '#fff';
  c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, -s * 1.15); c.stroke();
  drawStar(c, 0, -s * 1.3, s * 0.16, t * 3, 0.6);
  c.restore();
}

function drawMagician() {
  var i, cup, n = mag.cups.length, ty = magTableY(), starX = -1;
  if (!beginPlayWorld()) return;
  // Valokeila pöydälle
  var g = ctx.createRadialGradient(viewW / 2, ty - viewH * 0.1, viewH * 0.05, viewW / 2, ty - viewH * 0.1, viewH * 0.5);
  g.addColorStop(0, 'rgba(255,240,200,0.18)');
  g.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(viewW / 2, ty - viewH * 0.1, viewH * 0.5, 0, Math.PI * 2); ctx.fill();
  // Tähti kupin alla (näkyy kun kuppi on nostettu)
  if (mag.cups[mag.starCup]) {
    cup = mag.cups[mag.starCup];
    if (cup.lift > 0.15 && mag.state !== 'finale' && !celebrating) {
      drawStar(ctx, cup.x, ty - viewH * 0.035, viewH * 0.03, globalT * 2, cup.lift);
    }
  }
  // Kupit: liikkuva kaari-kuppi päällimmäisenä
  for (i = 0; i < n; i++) {
    cup = mag.cups[i];
    if (mag.state === 'finale' || celebrating) break;
    if (mag.state === 'shuffle' && i === mag.swapA) continue;
    drawMagicCup(ctx, cup.x, magCupY(cup), viewH * 0.06, MAG_CUP_COLORS[i % MAG_CUP_COLORS.length], 0);
  }
  if (mag.state === 'shuffle' && mag.swapA >= 0 && mag.cups[mag.swapA]) {
    cup = mag.cups[mag.swapA];
    drawMagicCup(ctx, cup.x, magCupY(cup), viewH * 0.06, MAG_CUP_COLORS[mag.swapA % MAG_CUP_COLORS.length], 0);
  }
  // Kysymysmerkki kun saa valita
  if (mag.state === 'pick') {
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold ' + Math.round(viewH * 0.09 * (1 + Math.sin(globalT * 5) * 0.05)) + 'px ' + TASK_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', viewW / 2, viewH * 0.3);
  }
  // Kierrospallot
  for (i = 0; i < MAG_ROUNDS.length; i++) {
    var rx = viewW / 2 + (i - 1) * viewH * 0.06, ry = viewH * 0.17;
    ctx.fillStyle = i < mag.round ? '#ffe27a' : 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(rx, ry, viewH * 0.014, 0, Math.PI * 2); ctx.fill();
  }
  // Taikuri ja prinsessa
  drawMagicianBunny(ctx, viewW * 0.82, viewH * 0.7, viewH * 0.075, globalT);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, globalT * 8, mag.hopT > 0, globalT);
  // Finaali: kultatähti nousee hatusta
  if (mag.state === 'finale' || celebrating) {
    var f = Math.min(1, mag.t / 2.0);
    var sx = viewW * 0.82, sy = viewH * 0.7 - viewH * 0.075 * 2.2 - f * viewH * 0.3;
    drawStar(ctx, sx, sy, viewH * (0.03 + f * 0.05), globalT * 1.5, 1);
  }
  // Ilotulitus
  for (i = 0; i < mag.fw.length; i++) {
    var p = mag.fw[i], a = 1 - p.age / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, viewH * 0.006 * (0.5 + a), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
