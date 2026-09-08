'use strict';

// Tuulenhuippu: Vuorisaaren vartija. Tasohyppely lumihuipulla: rotkoja ja
// tuulenpuuskia. Lippu ja lentävät lehdet varoittavat sekunnin, sitten tuuli
// työntää prinsessaa (ilmassa enemmän) – isot kivet suojaavat. Kolme tehtäväkaarta
// ja kuusi jääkidettä; Tuulen henki rauhoittuu ja ovi aukeaa, kun kaikki on tehty.
// Sydämet käytössä.

var SUM_CRYSTALS = 6;
var sumCrystals = [], sumRocks = [], sumWinds = [], sumLeaves = [];
var sumGround = [[0.0, 0.16], [0.19, 0.37], [0.40, 0.58], [0.61, 0.79], [0.82, 1.0]];
var sumDoor = { fx: 0.955, x: 0, open: false };
var scrystalDefs = [
  { fx: 0.08, fy: 0.30 }, { fx: 0.30, fy: 0.42 }, { fx: 0.36, fy: 0.30 },
  { fx: 0.51, fy: 0.42 }, { fx: 0.68, fy: 0.30 }, { fx: 0.885, fy: 0.42 }
];
var sumRockDefs = [0.27, 0.46, 0.66, 0.90];
var sumWindDefs = [{ zA: 0.19, zB: 0.58, dir: 1 }, { zA: 0.61, zB: 1.0, dir: -1 }];
var WIND_WARN = 1.0, WIND_BLOW = 1.3;

function sumWindCalm() { return 2.4 + Math.random() * 1.4; }

function layoutSummit() {
  var g = groundTop, i, seg;
  platforms = [];
  for (i = 0; i < sumGround.length; i++) {
    seg = sumGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: g, w: (seg[1] - seg[0]) * worldW });
  }
  platforms.push({ kind: 'ledge', x: worldW * 0.28, y: g - viewH * 0.2, w: worldW * 0.045 });
  platforms.push({ kind: 'ledge', x: worldW * 0.49, y: g - viewH * 0.2, w: worldW * 0.045 });
  platforms.push({ kind: 'ledge', x: worldW * 0.865, y: g - viewH * 0.2, w: worldW * 0.045 });
  sumRocks = [];
  for (i = 0; i < sumRockDefs.length; i++) sumRocks.push({ x: sumRockDefs[i] * worldW, w: viewH * 0.14 });
  sumDoor.x = sumDoor.fx * worldW;
}

function initSummit() {
  var i;
  layoutSummit();
  tasks = [makeTask(0.24, 'order'), makeTask(0.50, 'dots'), makeTask(0.72, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.43, 0.64, 0.85]);
  sumCrystals = [];
  for (i = 0; i < SUM_CRYSTALS; i++) {
    sumCrystals.push({ ax: scrystalDefs[i].fx * worldW, ay: groundTop - scrystalDefs[i].fy * viewH, collected: false, phase: Math.random() * Math.PI * 2, color: CRYSTAL_COLORS[i % CRYSTAL_COLORS.length] });
  }
  sumWinds = [];
  for (i = 0; i < sumWindDefs.length; i++) sumWinds.push({ zA: sumWindDefs[i].zA, zB: sumWindDefs[i].zB, dir: sumWindDefs[i].dir, state: 'calm', t: 3 + i * 1.5 });
  sumLeaves = [];
  sumDoor.open = false;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(587, 0.15, 0.3, 'sine', 0.3);
  playNote(784, 0.3, 0.45, 'triangle', 0.3);
}

function respawnSummit() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function respawnSummitPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < sumGround.length; i++) {
    var end = sumGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  resetPrincess(best > 0 ? best - viewH * 0.09 : checkpoint.x, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffffff');
}

function resizeSummit(ratio) {
  var i;
  princess.x *= ratio;
  layoutSummit();
  for (i = 0; i < sumCrystals.length; i++) {
    sumCrystals[i].ax = scrystalDefs[i].fx * worldW;
    sumCrystals[i].ay = groundTop - scrystalDefs[i].fy * viewH;
  }
}

function sumTasksSolved() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return n;
}

function collectSumCrystal(cr) {
  cr.collected = true;
  registerCollected(cr);
  spawnSparkles(cr.ax, cr.ay, 14, cr.color);
  playNote(880 + countCollected(sumCrystals) * 55, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(sumCrystals) * 55, 0.08, 0.3, 'sine', 0.3);
}

function sumFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.1, 14, '#ffffff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) respawnSummitPitEdge();
}

// Onko prinsessa ison kiven suojassa?
function sumSheltered() {
  var i;
  if (!princess.onGround) return false;
  for (i = 0; i < sumRocks.length; i++) {
    if (Math.abs(princess.x - sumRocks[i].x) < viewW * 0.08) return true;
  }
  return false;
}

function sumWindAt(x) {
  var i, w;
  for (i = 0; i < sumWinds.length; i++) {
    w = sumWinds[i];
    if (x >= w.zA * worldW && x <= w.zB * worldW) return w;
  }
  return null;
}

function updateSummit(dt) {
  var i, w, lf;
  updateTasks(dt);
  var busy = puzzleBusy();

  platformerStep(dt, {
    runSp: viewW * 0.22,
    fallY: groundTop + viewH * 0.14,
    onFall: function () { sumFell(); }
  });

  // Tuulenpuuskat: tyyni -> varoitus -> puhuri
  for (i = 0; i < sumWinds.length; i++) {
    w = sumWinds[i];
    if (busy || celebrating || sumDoor.open) continue;
    w.t -= dt;
    if (w.t <= 0) {
      if (w.state === 'calm') {
        w.state = 'warn';
        w.t = WIND_WARN;
        if (sumWindAt(princess.x) === w) { playNote(196, 0, 0.5, 'sine', 0.18); playNote(247, 0.2, 0.5, 'sine', 0.14); }
      } else if (w.state === 'warn') {
        w.state = 'blow';
        w.t = WIND_BLOW;
        if (sumWindAt(princess.x) === w) { playNote(110, 0, 1.0, 'sawtooth', 0.06); playNote(165, 0.1, 0.9, 'triangle', 0.1); }
      } else {
        w.state = 'calm';
        w.t = sumWindCalm();
      }
    }
  }
  w = sumWindAt(princess.x);
  if (w && w.state === 'blow' && !busy && !celebrating && !sumSheltered()) {
    var push = viewW * 0.15 * (princess.onGround ? 1 : 1.6);
    princess.x += w.dir * push * dt;
    princess.x = Math.min(Math.max(princess.x, viewH * 0.045), worldW - viewH * 0.045);
    blockPrincessAtTasks();
    if (Math.random() < dt * 10) spawnSparkles(princess.x - w.dir * viewH * 0.05, princess.y - viewH * 0.1, 1, '#ffffff');
  }
  // Lehdet ja lumi lentävät puuskan mukana (ruutukoordinaatit)
  if (w && (w.state === 'warn' || w.state === 'blow') && !busy) {
    var rate = w.state === 'blow' ? 40 : 14;
    if (Math.random() < dt * rate && sumLeaves.length < 60) {
      sumLeaves.push({ x: w.dir > 0 ? -20 : viewW + 20, y: viewH * (0.1 + Math.random() * 0.75), vx: w.dir * viewW * (0.5 + Math.random() * 0.4) * (w.state === 'blow' ? 1 : 0.5), ph: Math.random() * 6, s: 2 + Math.random() * 3, c: Math.random() < 0.6 ? 0 : 1 });
    }
  }
  for (i = sumLeaves.length - 1; i >= 0; i--) {
    lf = sumLeaves[i];
    lf.x += lf.vx * dt;
    lf.ph += dt * 6;
    lf.y += Math.sin(lf.ph) * viewH * 0.15 * dt;
    if (lf.x < -40 || lf.x > viewW + 40) sumLeaves.splice(i, 1);
  }

  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < sumCrystals.length; i++) {
    var cr = sumCrystals[i];
    if (cr.collected) continue;
    cr.phase += dt * 2;
    var dx = cr.ax - princess.x, dy = (cr.ay + Math.sin(cr.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectSumCrystal(cr);
  }

  if (!sumDoor.open && sumTasksSolved() === tasks.length && countCollected(sumCrystals) === SUM_CRYSTALS) {
    sumDoor.open = true;
    for (i = 0; i < sumWinds.length; i++) { sumWinds[i].state = 'calm'; sumWinds[i].t = 999; }
    playNote(523, 0.2, 0.3, 'triangle', 0.4);
    playNote(659, 0.4, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.3, 'triangle', 0.4);
    playNote(1047, 0.8, 0.6, 'triangle', 0.45);
  }
  if (sumDoor.open && !celebrating && Math.abs(princess.x - sumDoor.x) < viewH * 0.08) startCelebration();

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderSummitBg(b, w, h) {
  var i, x, seg;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#6fa8ff');
  sky.addColorStop(0.5, '#cfe6ff');
  sky.addColorStop(1, '#ffffff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 14; i++) cloudShape(b, w * (0.02 + i * 0.075), h * (0.12 + (i % 3) * 0.08), h * 0.03);
  // Kaukaiset huiput
  b.fillStyle = '#9fb8dc';
  for (i = 0; i < 16; i++) {
    x = w * (i / 15) + (i % 2) * h * 0.1;
    b.beginPath(); b.moveTo(x - h * 0.3, groundTop); b.lineTo(x, groundTop - h * (0.28 + (i % 3) * 0.06)); b.lineTo(x + h * 0.3, groundTop); b.closePath(); b.fill();
    b.fillStyle = '#ffffff';
    b.beginPath(); b.moveTo(x - h * 0.08, groundTop - h * (0.2 + (i % 3) * 0.06)); b.lineTo(x, groundTop - h * (0.28 + (i % 3) * 0.06)); b.lineTo(x + h * 0.08, groundTop - h * (0.2 + (i % 3) * 0.06)); b.closePath(); b.fill();
    b.fillStyle = '#9fb8dc';
  }
  // Lumiset kielekkeet (maa) rotkoineen
  for (i = 0; i < sumGround.length; i++) {
    seg = sumGround[i];
    drawSnowBank(b, seg[0] * w, groundTop, (seg[1] - seg[0]) * w, h);
  }
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'ledge') drawSnowLedge(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05);
  }
  for (i = 0; i < 18; i++) {
    x = (i * 311.7) % w;
    if (sumOnGround(x, w)) drawPine(b, x, groundTop + h * 0.01, h * (0.12 + (i % 3) * 0.04), i % 2 ? '#2f6a4f' : '#3a7f5a');
  }
  for (i = 0; i < sumRocks.length; i++) drawSumRock(b, sumRocks[i].x, groundTop, sumRocks[i].w);
  for (i = 0; i < sumWindDefs.length; i++) drawFlagPole(b, sumWindDefs[i].zA * w + h * 0.06, groundTop, h);
  drawSummitDoorFrame(b, sumDoor.x, groundTop, h);
}

function sumOnGround(x, w) {
  var i;
  for (i = 0; i < sumGround.length; i++) if (x > sumGround[i][0] * w + w * 0.01 && x < sumGround[i][1] * w - w * 0.01) return true;
  return false;
}

function drawSnowBank(b, x, y, w, h) {
  var g = b.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, '#e6f0ff');
  g.addColorStop(1, '#8fa8c8');
  b.fillStyle = g;
  b.beginPath();
  b.moveTo(x, h);
  b.lineTo(x, y + h * 0.01);
  b.quadraticCurveTo(x + w * 0.5, y - h * 0.015, x + w, y + h * 0.01);
  b.lineTo(x + w, h);
  b.closePath();
  b.fill();
  b.fillStyle = 'rgba(120,140,180,0.25)';
  var i;
  for (i = 0; i < Math.max(1, Math.round(w / (h * 0.3))); i++) {
    b.beginPath(); b.arc(x + h * 0.15 + i * h * 0.3, y + h * 0.12 + (i % 2) * h * 0.06, h * 0.03, 0, Math.PI * 2); b.fill();
  }
}

function drawSnowLedge(b, x, y, w, hh) {
  b.fillStyle = '#8fa8c8';
  roundRect(b, x, y + hh * 0.3, w, hh * 0.7, hh * 0.3);
  b.fill();
  b.fillStyle = '#ffffff';
  roundRect(b, x - hh * 0.1, y - hh * 0.1, w + hh * 0.2, hh * 0.55, hh * 0.3);
  b.fill();
}

function drawSumRock(c, x, baseY, w) {
  c.fillStyle = '#6b6478';
  c.beginPath();
  c.moveTo(x - w * 0.5, baseY + w * 0.05);
  c.quadraticCurveTo(x - w * 0.45, baseY - w * 0.55, x - w * 0.1, baseY - w * 0.62);
  c.quadraticCurveTo(x + w * 0.4, baseY - w * 0.7, x + w * 0.5, baseY + w * 0.05);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(x - w * 0.38, baseY - w * 0.42);
  c.quadraticCurveTo(x - w * 0.1, baseY - w * 0.66, x + w * 0.35, baseY - w * 0.6);
  c.quadraticCurveTo(x + w * 0.1, baseY - w * 0.5, x - w * 0.38, baseY - w * 0.42);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.2)';
  c.beginPath(); c.arc(x - w * 0.15, baseY - w * 0.25, w * 0.1, 0, Math.PI * 2); c.fill();
}

function drawFlagPole(b, x, baseY, h) {
  b.fillStyle = '#5a4a3a';
  b.fillRect(x - h * 0.006, baseY - h * 0.3, h * 0.012, h * 0.3);
  b.beginPath(); b.arc(x, baseY - h * 0.3, h * 0.012, 0, Math.PI * 2); b.fill();
}

function drawSummitDoorFrame(b, x, baseY, h) {
  var s = h * 0.12;
  b.fillStyle = '#8fa8c8';
  b.fillRect(x - s * 0.8, baseY - s * 1.7, s * 0.28, s * 1.7);
  b.fillRect(x + s * 0.52, baseY - s * 1.7, s * 0.28, s * 1.7);
  b.beginPath(); b.arc(x, baseY - s * 1.7, s * 0.8, Math.PI, 0); b.lineTo(x + s * 0.52, baseY - s * 1.7); b.arc(x, baseY - s * 1.7, s * 0.52, 0, Math.PI, true); b.closePath(); b.fill();
  b.fillStyle = '#ffffff';
  b.beginPath(); b.arc(x, baseY - s * 1.7, s * 0.9, Math.PI * 1.1, Math.PI * 1.9); b.lineTo(x + s * 0.8, baseY - s * 1.55); b.arc(x, baseY - s * 1.7, s * 0.8, 0, Math.PI, true); b.closePath(); b.fill();
}

// Liput heiluvat tuulen tilan mukaan
function drawFlags(c) {
  var i, w, x, y, s = viewH * 0.06, amp, k;
  for (i = 0; i < sumWinds.length; i++) {
    w = sumWinds[i];
    x = w.zA * worldW + viewH * 0.06 - camX;
    if (x < -s * 3 || x > viewW + s * 3) continue;
    y = groundTop - viewH * 0.29;
    amp = w.state === 'calm' ? 0.15 : (w.state === 'warn' ? 0.6 : 1);
    c.fillStyle = w.state === 'blow' ? '#ff5f7e' : (w.state === 'warn' ? '#ffb84f' : '#ffe27a');
    c.beginPath();
    c.moveTo(x, y);
    for (k = 0; k <= 6; k++) {
      c.lineTo(x + w.dir * (k / 6) * s * 1.4 * (0.35 + amp * 0.65), y + Math.sin(globalT * (6 + amp * 10) + k) * s * 0.12 * amp + (k / 6) * s * (0.1 - amp * 0.1));
    }
    for (k = 6; k >= 0; k--) {
      c.lineTo(x + w.dir * (k / 6) * s * 1.4 * (0.35 + amp * 0.65), y + s * 0.6 + Math.sin(globalT * (6 + amp * 10) + k) * s * 0.12 * amp + (k / 6) * s * (0.4 * (1 - amp)));
    }
    c.closePath();
    c.fill();
  }
}

function drawLeaves(c) {
  var i, lf;
  for (i = 0; i < sumLeaves.length; i++) {
    lf = sumLeaves[i];
    c.fillStyle = lf.c === 0 ? 'rgba(255,255,255,0.9)' : '#8fd97a';
    c.save();
    c.translate(lf.x, lf.y);
    c.rotate(lf.ph);
    c.beginPath();
    if (c.ellipse) c.ellipse(0, 0, lf.s * 2, lf.s * 0.7, 0, 0, Math.PI * 2);
    else c.arc(0, 0, lf.s, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

// Tuulen henki: pilvikasvot oven yllä. Puhaltaa posket pullollaan puuskan aikana,
// hymyilee rauhoittuneena.
function drawWindSpirit(c) {
  var x = sumDoor.x - camX - viewH * 0.22, y = viewH * 0.26, r = viewH * 0.11, w = sumWinds[sumWinds.length - 1];
  if (x < -r * 3 || x > viewW + r * 3) return;
  var blowing = !sumDoor.open && w && w.state === 'blow';
  var calm = sumDoor.open;
  c.fillStyle = calm ? 'rgba(255,255,255,0.97)' : 'rgba(235,240,250,0.95)';
  cloudShape(c, x, y, r * 0.55);
  c.strokeStyle = '#6b6a90';
  c.lineWidth = Math.max(2, r * 0.06);
  c.lineCap = 'round';
  // Silmät
  var e;
  for (e = -1; e <= 1; e += 2) {
    if (calm) { c.beginPath(); c.arc(x + e * r * 0.3, y - r * 0.1, r * 0.12, 0.15, Math.PI - 0.15); c.stroke(); }
    else {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x + e * r * 0.3, y - r * 0.12, r * 0.13, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3a3a5a';
      c.beginPath(); c.arc(x + e * r * 0.3 + (blowing ? -r * 0.03 : 0), y - r * 0.1, r * 0.06, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x + e * r * 0.45, y - r * 0.32); c.lineTo(x + e * r * 0.15, y - r * 0.26); c.stroke();
    }
  }
  // Suu ja posket
  if (calm) {
    c.beginPath(); c.arc(x, y + r * 0.18, r * 0.25, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = 'rgba(255,150,180,0.5)';
    c.beginPath(); c.arc(x - r * 0.42, y + r * 0.15, r * 0.1, 0, Math.PI * 2); c.arc(x + r * 0.42, y + r * 0.15, r * 0.1, 0, Math.PI * 2); c.fill();
  } else if (blowing) {
    c.fillStyle = 'rgba(200,210,235,0.9)';
    c.beginPath(); c.arc(x - r * 0.5, y + r * 0.1, r * 0.22, 0, Math.PI * 2); c.arc(x + r * 0.5, y + r * 0.1, r * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a3a5a';
    c.beginPath(); c.arc(x - r * 0.12, y + r * 0.22, r * 0.08, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(2, r * 0.05);
    var k;
    for (k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(x - r * 0.3, y + r * 0.2 + (k - 1) * r * 0.12);
      c.quadraticCurveTo(x - r * 0.9, y + r * 0.1 + (k - 1) * r * 0.2 + Math.sin(globalT * 8 + k) * r * 0.05, x - r * (1.3 + k * 0.15), y + r * 0.25 + (k - 1) * r * 0.25);
      c.stroke();
    }
  } else {
    c.beginPath(); c.moveTo(x - r * 0.2, y + r * 0.25); c.lineTo(x + r * 0.2, y + r * 0.25); c.stroke();
  }
}

function drawSummitDoorGlow(c) {
  var x = sumDoor.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = sumDoor.open ? 'rgba(255,245,200,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')' : 'rgba(40,50,90,0.85)';
  c.beginPath(); c.arc(x, groundTop - s * 1.7, s * 0.52, Math.PI, 0); c.lineTo(x + s * 0.52, groundTop); c.lineTo(x - s * 0.52, groundTop); c.closePath(); c.fill();
  if (sumDoor.open) drawStar(c, x, groundTop - s * 2.9, h * 0.035, globalT, 1);
}

function drawSummit() {
  var i;
  if (!drawWorldBg()) return;
  drawWindSpirit(ctx);
  drawSummitDoorGlow(ctx);
  drawFlags(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < sumCrystals.length; i++) {
    if (sumCrystals[i].collected) continue;
    drawCrystal(ctx, sumCrystals[i].ax - camX, sumCrystals[i].ay + Math.sin(sumCrystals[i].phase) * viewH * 0.012, viewH * 0.026, sumCrystals[i].color);
  }
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawLeaves(ctx);
  drawParticlesLayer(ctx);
  if (sumDoor.open && !celebrating) drawEdgeArrow(ctx, sumDoor.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, SUM_CRYSTALS, function (i2) { return sumCrystals[i2] && sumCrystals[i2].collected; },
    function (c, x, y, s) { drawCrystal(c, x, y, s * 0.8, '#8fd3ff'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
