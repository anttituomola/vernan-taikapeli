'use strict';

// Kuumailmapallo: uusi verbi, korkeuden valinta. Pidä pohjassa sormea kohti:
// sormi pallon yläpuolella = poltin päällä (nousu), alapuolella = venttiili
// (lasku). Tuulikerrokset vievät palloa sivulle eri suuntiin — oikea korkeus
// vie oikealle, väärä taaksepäin. Kerää kahdeksan juhlailmapalloa, väistä
// leijoja ja laskeudu lopuksi laskeutumisalustalle. Sydämet ja lyhdyt käytössä.

var BAL_COUNT = 8;
var bal = { x: 0, y: 0, vx: 0, vy: 0, burn: 0, tilt: 0, wheelA: 0, bumpT: 0 };
var balItems = [];
var balKites = [];
var balPad = { fx: 0.94, x: 0, ready: false };
// Tuulikerrokset: y0–y1 osuus ruudusta, w = tuuli (osuus ruudun leveydestä / s)
var BAL_BANDS = [
  { y0: 0.05, y1: 0.28, w: 0.26 },
  { y0: 0.28, y1: 0.47, w: -0.11 },
  { y0: 0.47, y1: 0.64, w: 0.17 },
  { y0: 0.64, y1: 0.75, w: -0.08 }
];
var balItemDefs = [
  { fx: 0.12, fy: 0.55, c: '#ff5f7e' }, { fx: 0.22, fy: 0.18, c: '#ffd23e' }, { fx: 0.31, fy: 0.38, c: '#7fd4ff' },
  { fx: 0.42, fy: 0.68, c: '#5fd36b' }, { fx: 0.53, fy: 0.15, c: '#c9a0ff' }, { fx: 0.63, fy: 0.40, c: '#ff9d5c' },
  { fx: 0.74, fy: 0.58, c: '#ff7bac' }, { fx: 0.84, fy: 0.22, c: '#ffe94f' }
];
var balKiteDefs = [
  { fx: 0.27, fy: 0.16, amp: 0.05, f: 0.8, c: '#ff5f7e' },
  { fx: 0.38, fy: 0.55, amp: 0.06, f: 1.1, c: '#5fd36b' },
  { fx: 0.48, fy: 0.20, amp: 0.07, f: 0.7, c: '#7fd4ff' },
  { fx: 0.58, fy: 0.52, amp: 0.05, f: 1.0, c: '#ffd23e' },
  { fx: 0.69, fy: 0.24, amp: 0.06, f: 0.9, c: '#c9a0ff' },
  { fx: 0.80, fy: 0.55, amp: 0.05, f: 1.2, c: '#ff9d5c' }
];

function balR() { return viewH * 0.085; }
function balBasketY(y) { return y + balR() * 1.55; }
function balWheelPos() { return { x: worldW * 0.5, y: groundTop - viewH * 0.24, r: viewH * 0.17 }; }

function balWindAt(x, y) {
  var i, fy = y / viewH;
  if (x < worldW * 0.05 || x > worldW * 0.885) return 0;
  for (i = 0; i < BAL_BANDS.length; i++) {
    if (fy >= BAL_BANDS[i].y0 && fy < BAL_BANDS[i].y1) return BAL_BANDS[i].w * viewW;
  }
  return 0;
}

function initBalloon() {
  var i;
  tasks = [makeTask(0.33, 'route'), makeTask(0.66, 'clock')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.36, 0.69]);
  balItems = [];
  for (i = 0; i < BAL_COUNT; i++) {
    balItems.push({ ax: balItemDefs[i].fx * worldW, ay: balItemDefs[i].fy * viewH, c: balItemDefs[i].c, collected: false, phase: Math.random() * Math.PI * 2 });
  }
  balKites = [];
  for (i = 0; i < balKiteDefs.length; i++) {
    balKites.push({ fx: balKiteDefs[i].fx, x: balKiteDefs[i].fx * worldW, baseY: balKiteDefs[i].fy * viewH, y: 0, amp: balKiteDefs[i].amp * viewH, f: balKiteDefs[i].f, t: i * 1.7, c: balKiteDefs[i].c });
  }
  balPad.x = balPad.fx * worldW;
  balPad.ready = false;
  bal.x = viewW * 0.12;
  bal.y = viewH * 0.5;
  bal.vx = 0; bal.vy = 0; bal.burn = 0; bal.tilt = 0; bal.bumpT = 0;
  princess.x = bal.x;
  princess.y = balBasketY(bal.y);
  princess.facing = 1;
  checkpoint.x = bal.x;
  checkpoint.y = bal.y;
  renderBackground();
  playNote(392, 0, 0.25, 'sine', 0.35);
  playNote(587, 0.15, 0.35, 'triangle', 0.35);
}

function respawnBalloon() {
  bal.x = checkpoint.x;
  bal.y = viewH * 0.5;
  bal.vx = 0; bal.vy = 0;
  camX = Math.min(Math.max(bal.x - viewW * 0.3, 0), Math.max(0, worldW - viewW));
  spawnSparkles(bal.x, bal.y, 14, '#ffe27a');
}

function resizeBalloon(ratio) {
  var i;
  bal.x *= ratio;
  for (i = 0; i < balItems.length; i++) { balItems[i].ax = balItemDefs[i].fx * worldW; balItems[i].ay = balItemDefs[i].fy * viewH; }
  for (i = 0; i < balKites.length; i++) { balKites[i].x = balKites[i].fx * worldW; balKites[i].baseY = balKiteDefs[i].fy * viewH; balKites[i].amp = balKiteDefs[i].amp * viewH; }
  balPad.x = balPad.fx * worldW;
}

function balCollect(it) {
  it.collected = true;
  registerCollected(it);
  spawnSparkles(it.ax, it.ay, 14, it.c);
  playNote(600 + countCollected(balItems) * 50, 0, 0.25, 'sine', 0.4);
  playNote(900 + countCollected(balItems) * 50, 0.08, 0.3, 'triangle', 0.3);
  if (countCollected(balItems) === BAL_COUNT && !balPad.ready) {
    balPad.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleBalloonTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < balItems.length; i++) {
    if (balItems[i].collected) continue;
    dx = wx - balItems[i].ax; dy = py - balItems[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06 && Math.abs(balItems[i].ax - bal.x) < balR() * 3 && Math.abs(balItems[i].ay - bal.y) < balR() * 3) {
      balCollect(balItems[i]);
      return;
    }
  }
}

function updateBalloon(dt) {
  var i, R = balR();
  updateTasks(dt);
  var busy = puzzleBusy();
  bal.wheelA += dt * 0.35;
  if (bal.bumpT > 0) bal.bumpT -= dt;

  var burning = false;
  if (!celebrating && holding && !busy) {
    if (lastPY < bal.y - viewH * 0.04) { bal.vy -= viewH * 0.8 * dt; burning = true; }
    else if (lastPY > bal.y + viewH * 0.06) bal.vy += viewH * 0.55 * dt;
    var sx = holdWorldX - bal.x;
    if (Math.abs(sx) > viewH * 0.05) bal.vx += (sx > 0 ? 1 : -1) * viewW * 0.09 * dt;
  } else {
    bal.vy += viewH * 0.3 * dt;
  }
  bal.burn += ((burning ? 1 : 0) - bal.burn) * Math.min(1, dt * 8);
  var wind = balWindAt(bal.x, bal.y);
  bal.vx += (wind - bal.vx) * Math.min(1, dt * 0.9);
  if (bal.vy > viewH * 0.3) bal.vy = viewH * 0.3;
  if (bal.vy < -viewH * 0.36) bal.vy = -viewH * 0.36;
  if (!busy && !celebrating) {
    bal.x += bal.vx * dt;
    bal.y += bal.vy * dt;
  }
  bal.x = Math.min(Math.max(bal.x, R * 1.2), worldW - R * 1.2);
  if (bal.y < viewH * 0.05 + R) { bal.y = viewH * 0.05 + R; bal.vy = Math.max(0, bal.vy); }
  var floorY = groundTop - R * 1.75;
  if (bal.y > floorY) {
    bal.y = floorY;
    if (bal.vy > viewH * 0.05 && bal.bumpT <= 0) { bal.bumpT = 0.5; playNote(200, 0, 0.15, 'triangle', 0.2); }
    bal.vy = Math.min(0, -bal.vy * 0.3);
    // Laskeutuminen alustalle
    if (balPad.ready && !celebrating && Math.abs(bal.x - balPad.x) < viewW * 0.07) {
      bal.vx = 0;
      startCelebration();
    }
  }
  bal.tilt += ((bal.vx / (viewW * 0.3)) * 0.18 - bal.tilt) * Math.min(1, dt * 3);
  // Tehtäväkaaret pysäyttävät pallon
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && bal.x > tasks[i].x - viewH * 0.1) {
      bal.x = tasks[i].x - viewH * 0.1;
      if (bal.vx > 0) bal.vx = 0;
    }
  }
  princess.x = bal.x;
  princess.y = balBasketY(bal.y);
  updateCheckpoints(bal.x, bal.y);

  // Juhlailmapallot: kerätään koskettamalla (tai napauttamalla läheltä)
  for (i = 0; i < balItems.length; i++) {
    var it = balItems[i];
    if (it.collected) continue;
    it.phase += dt * 1.5;
    var dx = it.ax - bal.x, dy = it.ay - bal.y, dy2 = it.ay - balBasketY(bal.y);
    if (!busy && !celebrating && (dx * dx + dy * dy < R * 1.4 * R * 1.4 || dx * dx + dy2 * dy2 < R * R)) balCollect(it);
  }
  // Leijat
  for (i = 0; i < balKites.length; i++) {
    var k = balKites[i];
    k.t += dt;
    k.y = k.baseY + Math.sin(k.t * k.f) * k.amp;
    var kdx = k.x - bal.x, kdy = k.y - bal.y;
    if (!celebrating && !busy && kdx * kdx + kdy * kdy < (R + viewH * 0.04) * (R + viewH * 0.04)) {
      if (loseHeart()) {
        bal.vx = (kdx > 0 ? -1 : 1) * viewW * 0.22;
        bal.vy = viewH * 0.25;
        spawnSparkles(bal.x, bal.y, 12, k.c);
      }
    }
  }
  if (burning && Math.random() < dt * 30) spawnSparkles(bal.x + (Math.random() - 0.5) * R * 0.3, bal.y + R * 1.05, 1, Math.random() < 0.5 ? '#ffb300' : '#ffe27a');
  followCam(bal.x, dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderBalloonBg(b, w, h) {
  var i, x, y;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#1a1050');
  sky.addColorStop(0.35, '#5a3a8a');
  sky.addColorStop(0.7, '#e06a7a');
  sky.addColorStop(1, '#ffd27a');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 120; i++) {
    x = (i * 173.3) % w; y = (i * 97.1) % (h * 0.4);
    b.globalAlpha = 0.3 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.7, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  // Laskeva aurinko horisontissa
  var sg = b.createRadialGradient(w * 0.3, groundTop, h * 0.02, w * 0.3, groundTop, h * 0.25);
  sg.addColorStop(0, 'rgba(255,240,180,0.9)');
  sg.addColorStop(1, 'rgba(255,200,120,0)');
  b.fillStyle = sg;
  b.beginPath(); b.arc(w * 0.3, groundTop, h * 0.25, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff1b0';
  b.beginPath(); b.arc(w * 0.3, groundTop, h * 0.08, Math.PI, 0); b.fill();
  // Kaukaiset kukkulat
  b.fillStyle = '#4a2a6a';
  b.beginPath(); b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) b.lineTo(x, groundTop - h * 0.05 - Math.sin(x * 0.0025) * h * 0.04 - Math.sin(x * 0.007) * h * 0.015);
  b.lineTo(w, groundTop); b.closePath(); b.fill();
  // Tivolin siluetti: teltat, karuselli, maailmanpyörän runko
  var tents = [0.08, 0.2, 0.36, 0.62, 0.72, 0.86];
  for (i = 0; i < tents.length; i++) drawFairTent(b, w * tents[i], groundTop + h * 0.005, h * (0.13 + (i % 2) * 0.03), i % 2 ? '#c8323c' : '#7a3cb8');
  drawCarousel(b, w * 0.28, groundTop + h * 0.005, h * 0.14);
  var wp = balWheelPos();
  b.strokeStyle = '#3a2a5a';
  b.lineWidth = h * 0.012;
  b.beginPath(); b.moveTo(wp.x - wp.r * 0.6, groundTop); b.lineTo(wp.x, wp.y); b.lineTo(wp.x + wp.r * 0.6, groundTop); b.stroke();
  // Maa
  var gr = b.createLinearGradient(0, groundTop, 0, h);
  gr.addColorStop(0, '#2f6a3a');
  gr.addColorStop(1, '#173a22');
  b.fillStyle = gr;
  b.fillRect(0, groundTop, w, h - groundTop);
  // Valosarja maan yllä
  var cols = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#5fd36b', '#c9a0ff'];
  b.strokeStyle = 'rgba(255,255,255,0.3)';
  b.lineWidth = Math.max(1, h * 0.002);
  b.beginPath();
  for (x = 0; x <= w; x += h * 0.4) { b.moveTo(x, groundTop + h * 0.04); b.quadraticCurveTo(x + h * 0.2, groundTop + h * 0.08, x + h * 0.4, groundTop + h * 0.04); }
  b.stroke();
  for (i = 0, x = h * 0.03; x < w; i++, x += h * 0.05) {
    y = groundTop + h * 0.04 + Math.sin(((x % (h * 0.4)) / (h * 0.4)) * Math.PI) * h * 0.02;
    b.fillStyle = cols[i % 5];
    b.beginPath(); b.arc(x, y, h * 0.006, 0, Math.PI * 2); b.fill();
  }
  // Laskeutumisalusta
  var px = balPad.x, pw = w * 0.05;
  b.fillStyle = '#8a5a30';
  roundRect(b, px - pw, groundTop - h * 0.02, pw * 2, h * 0.035, h * 0.01);
  b.fill();
  b.fillStyle = '#ffd24f';
  for (i = -2; i <= 2; i++) b.fillRect(px + i * pw * 0.4 - pw * 0.08, groundTop - h * 0.015, pw * 0.16, h * 0.025);
  b.strokeStyle = '#fff';
  b.lineWidth = h * 0.006;
  b.beginPath(); b.moveTo(px - pw * 0.9, groundTop - h * 0.02); b.lineTo(px - pw * 0.9, groundTop - h * 0.22); b.stroke();
  b.fillStyle = '#ff7bac';
  b.beginPath(); b.moveTo(px - pw * 0.9, groundTop - h * 0.22); b.lineTo(px - pw * 0.9 + h * 0.07, groundTop - h * 0.19); b.lineTo(px - pw * 0.9, groundTop - h * 0.16); b.closePath(); b.fill();
}

function drawFairTent(b, x, baseY, s, color) {
  var i;
  b.fillStyle = color;
  b.fillRect(x - s * 0.7, baseY - s * 0.55, s * 1.4, s * 0.55);
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 4; i++) b.fillRect(x - s * 0.7 + i * s * 0.35, baseY - s * 0.55, s * 0.17, s * 0.55);
  b.fillStyle = color;
  b.beginPath(); b.moveTo(x - s * 0.85, baseY - s * 0.55); b.lineTo(x + s * 0.85, baseY - s * 0.55); b.lineTo(x, baseY - s * 1.1); b.closePath(); b.fill();
  b.fillStyle = '#ffd24f';
  b.beginPath(); b.moveTo(x, baseY - s * 1.1); b.lineTo(x, baseY - s * 1.3); b.lineTo(x + s * 0.18, baseY - s * 1.24); b.lineTo(x, baseY - s * 1.18); b.closePath(); b.fill();
}

function drawCarousel(b, x, baseY, s) {
  var i, cols = ['#ff7bac', '#ffd24f', '#7fd4ff', '#c9a0ff'];
  b.fillStyle = '#fff3e0';
  b.beginPath();
  if (b.ellipse) b.ellipse(x, baseY - s * 0.05, s * 0.9, s * 0.12, 0, 0, Math.PI * 2); else b.arc(x, baseY, s * 0.5, 0, Math.PI * 2);
  b.fill();
  b.strokeStyle = '#ffd24f';
  b.lineWidth = Math.max(1.5, s * 0.03);
  for (i = 0; i < 5; i++) {
    var px = x + (i - 2) * s * 0.4;
    b.beginPath(); b.moveTo(px, baseY - s * 0.1); b.lineTo(px, baseY - s * 0.75); b.stroke();
    b.fillStyle = cols[i % 4];
    b.beginPath(); b.arc(px, baseY - s * 0.35, s * 0.09, 0, Math.PI * 2); b.fill();
  }
  b.fillStyle = '#c8323c';
  b.beginPath(); b.moveTo(x - s * 0.95, baseY - s * 0.75); b.lineTo(x + s * 0.95, baseY - s * 0.75); b.lineTo(x, baseY - s * 1.15); b.closePath(); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.4)';
  for (i = -3; i <= 3; i += 2) { b.beginPath(); b.moveTo(x + i * s * 0.25 - s * 0.08, baseY - s * 0.75); b.lineTo(x + i * s * 0.25 + s * 0.08, baseY - s * 0.75); b.lineTo(x, baseY - s * 1.15); b.closePath(); b.fill(); }
}

function drawFerrisWheel(c) {
  var wp = balWheelPos(), x = wp.x - camX, y = wp.y, r = wp.r, i, a;
  if (x < -r * 1.5 || x > viewW + r * 1.5) return;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.lineWidth = Math.max(1, viewH * 0.003);
  for (i = 0; i < 8; i++) {
    a = bal.wheelA + i * Math.PI / 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke();
    var gx = x + Math.cos(a) * r, gy = y + Math.sin(a) * r + viewH * 0.02;
    c.fillStyle = maneColors[i % maneColors.length];
    roundRect(c, gx - viewH * 0.016, gy - viewH * 0.012, viewH * 0.032, viewH * 0.028, viewH * 0.006);
    c.fill();
  }
  for (i = 0; i < 16; i++) {
    a = -bal.wheelA * 0.5 + i * Math.PI / 8;
    c.fillStyle = Math.sin(globalT * 6 + i) > 0 ? '#ffe27a' : '#ff9ec6';
    c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, viewH * 0.005, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#ffd24f';
  c.beginPath(); c.arc(x, y, viewH * 0.012, 0, Math.PI * 2); c.fill();
}

function drawWindStreaks(c) {
  var i, k, band, y, x, len, dir, sp, off;
  for (k = 0; k < BAL_BANDS.length; k++) {
    band = BAL_BANDS[k];
    dir = band.w > 0 ? 1 : -1;
    sp = Math.abs(band.w) * viewW;
    for (i = 0; i < 7; i++) {
      y = viewH * (band.y0 + (band.y1 - band.y0) * ((i * 0.37 + 0.1) % 1));
      len = viewH * (0.04 + (i % 3) * 0.02);
      off = (globalT * sp * 1.6 * dir + i * viewW * 0.29 - camX * 0.3);
      x = ((off % (viewW + len * 2)) + viewW + len * 2) % (viewW + len * 2) - len;
      c.strokeStyle = 'rgba(255,255,255,' + (0.14 + (i % 2) * 0.08) + ')';
      c.lineWidth = Math.max(1.5, viewH * 0.004);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len * dir, y - len * 0.08); c.stroke();
      c.beginPath(); c.moveTo(x + len * dir, y - len * 0.08); c.lineTo(x + len * dir - dir * len * 0.25, y - len * 0.3); c.stroke();
    }
  }
  c.lineCap = 'butt';
}

function drawPartyBalloon(c, x, y, s, color, phase) {
  var sway = Math.sin(phase) * s * 0.15;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(x, y + s * 1.15); c.quadraticCurveTo(x + sway * 2, y + s * 1.8, x - sway, y + s * 2.4); c.stroke();
  c.fillStyle = color;
  c.beginPath(); c.moveTo(x, y + s * 1.15); c.lineTo(x - s * 0.15, y + s * 1.32); c.lineTo(x + s * 0.15, y + s * 1.32); c.closePath(); c.fill();
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 0.85, s, 0, 0, Math.PI * 2); else c.arc(x, y, s * 0.9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x - s * 0.3, y - s * 0.4, s * 0.18, s * 0.3, -0.4, 0, Math.PI * 2); else c.arc(x - s * 0.3, y - s * 0.4, s * 0.2, 0, Math.PI * 2);
  c.fill();
}

function drawKite(c, k) {
  var x = k.x - camX, y = k.y, s = viewH * 0.045, i;
  if (x < -s * 6 || x > viewW + s * 6) return;
  c.strokeStyle = k.c;
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y + s * 1.2);
  for (i = 1; i <= 5; i++) c.lineTo(x - i * s * 0.5 + Math.sin(k.t * 5 + i) * s * 0.25, y + s * 1.2 + i * s * 0.55);
  c.stroke();
  c.fillStyle = k.c;
  c.beginPath(); c.moveTo(x, y - s * 1.2); c.lineTo(x + s * 0.85, y); c.lineTo(x, y + s * 1.2); c.lineTo(x - s * 0.85, y); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.moveTo(x, y - s * 1.2); c.lineTo(x, y + s * 1.2); c.moveTo(x - s * 0.85, y); c.lineTo(x + s * 0.85, y); c.stroke();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - s * 0.25, y - s * 0.2, s * 0.12, 0, Math.PI * 2); c.arc(x + s * 0.25, y - s * 0.2, s * 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(x - s * 0.22, y - s * 0.18, s * 0.06, 0, Math.PI * 2); c.arc(x + s * 0.28, y - s * 0.18, s * 0.06, 0, Math.PI * 2); c.fill();
  c.lineCap = 'butt';
}

function drawHotAirBalloon(c, x, y, R, tilt, burn, t) {
  var i;
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  // Korin köydet ja kori
  var by = R * 1.55;
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(1.5, R * 0.03);
  c.beginPath();
  c.moveTo(-R * 0.55, R * 0.75); c.lineTo(-R * 0.3, by - R * 0.2);
  c.moveTo(R * 0.55, R * 0.75); c.lineTo(R * 0.3, by - R * 0.2);
  c.stroke();
  // Poltin
  if (burn > 0.05) {
    var fg = c.createRadialGradient(0, R * 1.05, R * 0.02, 0, R * 1.05, R * 0.3 * burn);
    fg.addColorStop(0, 'rgba(255,255,220,0.95)');
    fg.addColorStop(0.5, 'rgba(255,180,60,0.8)');
    fg.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = fg;
    c.beginPath(); c.arc(0, R * 1.05, R * 0.3 * burn, 0, Math.PI * 2); c.fill();
  }
  // Pallo: sateenkaariraidat
  for (i = 0; i < 6; i++) {
    c.fillStyle = maneColors[i];
    c.beginPath();
    c.moveTo(0, R * 0.95);
    c.ellipse ? c.ellipse(0, 0, R, R * 1.05, 0, (i / 6) * Math.PI * 2 - Math.PI / 2, ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2)
              : c.arc(0, 0, R, (i / 6) * Math.PI * 2 - Math.PI / 2, ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2);
    c.closePath(); c.fill();
  }
  var sh = c.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R * 1.05);
  sh.addColorStop(0, 'rgba(255,255,255,0.45)');
  sh.addColorStop(0.6, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(60,20,60,0.35)');
  c.fillStyle = sh;
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, R, R * 1.05, 0, 0, Math.PI * 2); else c.arc(0, 0, R, 0, Math.PI * 2);
  c.fill();
  // Suu
  c.fillStyle = '#5a3a1e';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, R * 0.98, R * 0.3, R * 0.08, 0, 0, Math.PI * 2); else c.arc(0, R, R * 0.2, 0, Math.PI * 2);
  c.fill();
  // Prinsessa korissa (yläosa)
  c.save();
  c.beginPath(); c.rect(-R * 0.6, by - R * 0.9, R * 1.2, R * 0.72); c.clip();
  drawPrincessFree(c, 0, by + R * 0.08, R / 44, 1, 0, false, t);
  c.restore();
  // Kori
  var bg = c.createLinearGradient(-R * 0.45, 0, R * 0.45, 0);
  bg.addColorStop(0, '#8a5a30');
  bg.addColorStop(0.5, '#c98b4a');
  bg.addColorStop(1, '#8a5a30');
  c.fillStyle = bg;
  roundRect(c, -R * 0.42, by - R * 0.2, R * 0.84, R * 0.42, R * 0.08);
  c.fill();
  c.strokeStyle = 'rgba(90,58,30,0.6)';
  c.lineWidth = Math.max(1, R * 0.02);
  for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-R * 0.42, by - R * 0.2 + i * R * 0.105); c.lineTo(R * 0.42, by - R * 0.2 + i * R * 0.105); c.stroke(); }
  c.restore();
}

function drawBalloon() {
  var i, R = balR();
  if (!drawWorldBg()) return;
  drawWindStreaks(ctx);
  drawFerrisWheel(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  if (balPad.ready) {
    var gx = balPad.x - camX, gy = groundTop - viewH * 0.1;
    var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.22);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.7 + Math.sin(globalT * 5) * 0.2) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.22, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < balItems.length; i++) {
    if (balItems[i].collected) continue;
    drawPartyBalloon(ctx, balItems[i].ax - camX + Math.sin(balItems[i].phase * 0.7) * viewH * 0.01, balItems[i].ay + Math.sin(balItems[i].phase) * viewH * 0.015, viewH * 0.03, balItems[i].c, balItems[i].phase);
  }
  for (i = 0; i < balKites.length; i++) drawKite(ctx, balKites[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawHotAirBalloon(ctx, bal.x - camX, bal.y, R, bal.tilt, bal.burn, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (!celebrating) {
    if (balPad.ready) drawEdgeArrow(ctx, balPad.x);
    else {
      var bd = 1e9, tx = null;
      for (i = 0; i < balItems.length; i++) {
        if (balItems[i].collected) continue;
        var d = Math.abs(balItems[i].ax - bal.x);
        if (d < bd) { bd = d; tx = balItems[i].ax; }
      }
      if (tx !== null) drawEdgeArrow(ctx, tx);
    }
  }
  drawCelebrateLayer();
  drawPickupHud(ctx, BAL_COUNT, function (k) { return balItems[k] && balItems[k].collected; },
    function (c, x, y, s) { drawPartyBalloon(c, x, y - s * 0.3, s * 0.7, '#ff7bac', 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
