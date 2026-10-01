'use strict';

// Kuumailmapallo: uusi verbi, korkeuden valinta. Pidä pohjassa sormea kohti:
// sormi pallon yläpuolella = poltin päällä (nousu), alapuolella = venttiili
// (lasku). Tuulikerrokset vievät palloa sivulle eri suuntiin — oikea korkeus
// vie oikealle, väärä taaksepäin. Kerää kahdeksan juhlailmapalloa, väistä
// leijoja ja laskeudu lopuksi laskeutumisalustalle. Sydämet ja lyhdyt käytössä.

var BAL_COUNT = 8;
var bal = { x: 0, y: 0, vx: 0, vy: 0, burn: 0, tilt: 0, wheelA: 0, bumpT: 0, wheelBoost: 0 };
var balItems = [];
var balKites = [];
var balPad = { fx: 0.94, x: 0, ready: false };
// Tuulikerrokset: y0–y1 osuus ruudusta, w = tuuli (osuus ruudun leveydestä / s).
// Kolme kerrosta: ylhäällä ja alhaalla eteenpäin, keskellä taaksepäin. Jokaisessa
// kerroksessa ajelehtii isoja nuolia tuulen suuntaan, ja keskikerros on
// sävytetty sinertäväksi, jotta "väärä" kerros erottuu yhdellä silmäyksellä.
var BAL_BANDS = [
  { y0: 0.05, y1: 0.30, w: 0.24, tint: null },
  { y0: 0.30, y1: 0.54, w: -0.12, tint: 'rgba(90,140,255,0.22)' },
  { y0: 0.54, y1: 0.75, w: 0.16, tint: null }
];
var balItemDefs = [
  { fx: 0.12, fy: 0.62, c: '#ff5f7e' }, { fx: 0.22, fy: 0.18, c: '#ffd23e' }, { fx: 0.31, fy: 0.42, c: '#7fd4ff' },
  { fx: 0.42, fy: 0.66, c: '#5fd36b' }, { fx: 0.53, fy: 0.15, c: '#c9a0ff' }, { fx: 0.63, fy: 0.44, c: '#ff9d5c' },
  { fx: 0.74, fy: 0.62, c: '#ff7bac' }, { fx: 0.84, fy: 0.22, c: '#ffe94f' }
];
var balKiteDefs = [
  { fx: 0.27, fy: 0.16, amp: 0.05, f: 0.8, c: '#ff5f7e' },
  { fx: 0.38, fy: 0.62, amp: 0.05, f: 1.1, c: '#5fd36b' },
  { fx: 0.48, fy: 0.20, amp: 0.07, f: 0.7, c: '#7fd4ff' },
  { fx: 0.58, fy: 0.60, amp: 0.05, f: 1.0, c: '#ffd23e' },
  { fx: 0.69, fy: 0.24, amp: 0.06, f: 0.9, c: '#c9a0ff' },
  { fx: 0.80, fy: 0.62, amp: 0.05, f: 1.2, c: '#ff9d5c' }
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
    balKites.push({ fx: balKiteDefs[i].fx, x: balKiteDefs[i].fx * worldW, baseY: balKiteDefs[i].fy * viewH, y: 0, amp: balKiteDefs[i].amp * viewH, f: balKiteDefs[i].f, t: i * 1.7, c: balKiteDefs[i].c, pokeT: 0 });
  }
  balPad.x = balPad.fx * worldW;
  balPad.ready = false;
  balSetupProps();
  bal.x = viewW * 0.12;
  bal.y = viewH * 0.5;
  bal.vx = 0; bal.vy = 0; bal.burn = 0; bal.tilt = 0; bal.bumpT = 0; bal.wheelBoost = 0;
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
  balSetupProps();
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
  var wx = px + camX, i, dx, dy, k, wp;
  for (i = 0; i < balItems.length; i++) {
    if (balItems[i].collected) continue;
    dx = wx - balItems[i].ax; dy = py - balItems[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06 && Math.abs(balItems[i].ax - bal.x) < balR() * 3 && Math.abs(balItems[i].ay - bal.y) < balR() * 3) {
      balCollect(balItems[i]);
      return;
    }
  }
  // Koristeet reagoivat vain, kun napautus ei osunut keräiltävään; poltin-
  // ja venttiiliohjaus (sormen paikka) toimii silti ennallaan.
  // Leija heilahtaa ja räpäyttää silmiä
  for (i = 0; i < balKites.length; i++) {
    k = balKites[i];
    dx = wx - k.x; dy = py - k.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      k.pokeT = 0.8;
      spawnSparkles(k.x, k.y, 6, k.c);
      playNote(1100 + i * 60, 0, 0.08, 'sine', 0.18);
      playNote(1400 + i * 60, 0.07, 0.1, 'sine', 0.14);
      return;
    }
  }
  // Maailmanpyörä pyörähtää hetken vauhdikkaammin
  wp = balWheelPos();
  dx = wx - wp.x; dy = py - wp.y;
  if (dx * dx + dy * dy < wp.r * wp.r) {
    bal.wheelBoost = 3;
    spawnSparkles(wx, py, 5, '#ffe27a');
    playNote(988, 0, 0.08, 'triangle', 0.12);
    return;
  }
  // Maan koristeet: ilmapallokimput ja karkkikärry
  propsTap(wx, py);
}

function updateBalloon(dt) {
  var i, R = balR();
  updateTasks(dt);
  var busy = puzzleBusy();
  bal.wheelA += dt * (0.35 + bal.wheelBoost);
  if (bal.wheelBoost > 0) bal.wheelBoost = Math.max(0, bal.wheelBoost - dt * 2.5);
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
    if (k.pokeT > 0) k.pokeT -= dt;
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
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function balloonLayers() {
  return [
    { speed: 0.22, render: renderBalloonFar },
    { speed: 0.55, render: renderBalloonMid },
    { speed: 1, render: renderBalloonNear }
  ];
}
function renderBalloonBg(b, w, h) {
  renderBalloonFar(b, w, h);
  renderBalloonMid(b, w, h);
  renderBalloonNear(b, w, h);
}
function renderBalloonFar(b, w, h) {
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
  drawBgSun(b, w * 0.3, groundTop, h * 0.08, 0.22, '#fff4c8', '#fffdf0', '#ffb45a');
}
function renderBalloonMid(b, w, h) {
  var i, x;
  fillHillBand(b, w, h, groundTop + h * 0.02, '#4a2a6a', function (px) {
    return groundTop - h * 0.05 - Math.sin(px * 0.0025) * h * 0.04 - Math.sin(px * 0.007) * h * 0.015;
  });
  // Teltat ja karuselli keskikerroksessa: ei reunaviivaa, sävy kohti horisontin keltaista
  var tents = [0.08, 0.2, 0.36, 0.62, 0.72, 0.86], haze = '#ffd27a';
  for (i = 0; i < tents.length; i++) drawFairTent(b, w * tents[i], groundTop + h * 0.005, h * (0.13 + (i % 2) * 0.03), i % 2 ? '#c8323c' : '#7a3cb8', haze);
  drawCarousel(b, w * 0.28, groundTop + h * 0.005, h * 0.14, haze);
  // (Maailmanpyörän jalat piirretään pyörän kanssa joka ruudulla, jotta ne pysyvät
  // sen alla kameran liikkuessa.)
}
function renderBalloonNear(b, w, h) {
  var i, x, y;
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
  // Laskeutumisalusta ja tuulipussi
  var px = balPad.x, pw = w * 0.05, lw = Math.max(1.2, h * 0.003);
  artRoundRect(b, px - pw, groundTop - h * 0.02, pw * 2, h * 0.035, h * 0.01, '#8a5a30', { lineColor: '#4a2a10', line: lw });
  b.fillStyle = '#ffd24f';
  for (i = -2; i <= 2; i++) { roundRect(b, px + i * pw * 0.4 - pw * 0.08, groundTop - h * 0.015, pw * 0.16, h * 0.025, h * 0.004); b.fill(); }
  artLimb(b, px - pw * 0.9, groundTop - h * 0.02, px - pw * 0.9, groundTop - h * 0.22, h * 0.007, '#fff6e8', '#9a8a7a');
  b.beginPath(); b.moveTo(px - pw * 0.9, groundTop - h * 0.22); b.lineTo(px - pw * 0.9 + h * 0.07, groundTop - h * 0.19); b.lineTo(px - pw * 0.9, groundTop - h * 0.16); b.closePath();
  artFillPath(b, '#ff7bac', groundTop - h * 0.22, groundTop - h * 0.16, h * 0.03, { lineColor: '#a8405f', line: lw });
}

// Tivoliteltta keskikerrokseen: ei reunaviivaa; haze-väri sävyttää kaukaiseksi
// (ilmaperspektiivi). Käytössä myös Jäätelökojun taustalla.
function drawFairTent(b, x, baseY, s, color, haze) {
  var i, col = haze ? artMix(color, haze, 0.25) : color;
  var lite = haze ? artMix('#fff6e8', haze, 0.25) : '#fff6e8', gold = haze ? artMix('#ffd24f', haze, 0.25) : '#ffd24f';
  // Seinä raitoineen
  roundRect(b, x - s * 0.7, baseY - s * 0.55, s * 1.4, s * 0.6, s * 0.05);
  artFillPath(b, col, baseY - s * 0.55, baseY, s * 0.6, { line: false });
  b.fillStyle = artRGBA(lite, 0.45);
  for (i = 0; i < 4; i++) b.fillRect(x - s * 0.7 + i * s * 0.35, baseY - s * 0.55, s * 0.17, s * 0.55);
  // Katto ja viiri
  b.beginPath(); b.moveTo(x - s * 0.85, baseY - s * 0.55); b.lineTo(x + s * 0.85, baseY - s * 0.55); b.lineTo(x, baseY - s * 1.1); b.closePath();
  artFillPath(b, col, baseY - s * 1.1, baseY - s * 0.55, s * 0.5, { line: false });
  b.fillStyle = artRGBA(lite, 0.25);
  b.beginPath(); b.moveTo(x - s * 0.2, baseY - s * 0.55); b.lineTo(x + s * 0.2, baseY - s * 0.55); b.lineTo(x, baseY - s * 1.1); b.closePath(); b.fill();
  b.fillStyle = gold;
  b.beginPath(); b.moveTo(x, baseY - s * 1.1); b.lineTo(x, baseY - s * 1.3); b.lineTo(x + s * 0.18, baseY - s * 1.24); b.lineTo(x, baseY - s * 1.18); b.closePath(); b.fill();
}

// Karuselli keskikerrokseen (ei reunaviivaa, hazeen sävytetty)
function drawCarousel(b, x, baseY, s, haze) {
  var i, px, cols = ['#ff7bac', '#ffd24f', '#7fd4ff', '#c9a0ff'], t = haze ? 0.25 : 0, hz = haze || '#ffffff';
  artBlob(b, x, baseY - s * 0.05, s * 0.9, s * 0.12, artMix('#fff3e0', hz, t), { line: false });
  b.strokeStyle = artMix('#ffd24f', hz, t);
  b.lineWidth = Math.max(1.5, s * 0.03);
  for (i = 0; i < 5; i++) {
    px = x + (i - 2) * s * 0.4;
    b.beginPath(); b.moveTo(px, baseY - s * 0.1); b.lineTo(px, baseY - s * 0.75); b.stroke();
    artCircle(b, px, baseY - s * 0.35, s * 0.09, artMix(cols[i % 4], hz, t), { line: false });
  }
  b.beginPath(); b.moveTo(x - s * 0.95, baseY - s * 0.75); b.lineTo(x + s * 0.95, baseY - s * 0.75); b.lineTo(x, baseY - s * 1.15); b.closePath();
  artFillPath(b, artMix('#c8323c', hz, t), baseY - s * 1.15, baseY - s * 0.75, s * 0.5, { line: false });
  b.fillStyle = 'rgba(255,255,255,0.4)';
  for (i = -3; i <= 3; i += 2) { b.beginPath(); b.moveTo(x + i * s * 0.25 - s * 0.08, baseY - s * 0.75); b.lineTo(x + i * s * 0.25 + s * 0.08, baseY - s * 0.75); b.lineTo(x, baseY - s * 1.15); b.closePath(); b.fill(); }
}

function drawFerrisWheel(c) {
  var wp = balWheelPos(), x = wp.x - camX, y = wp.y, r = wp.r, i, a, col;
  if (x < -r * 1.5 || x > viewW + r * 1.5) return;
  // Jalat (joka ruudulla pyörän kanssa, jotta ne pysyvät sen alla)
  c.strokeStyle = '#3a2a5a';
  c.lineWidth = viewH * 0.012;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - r * 0.6, groundTop); c.lineTo(x, y); c.lineTo(x + r * 0.6, groundTop); c.stroke();
  c.lineCap = 'butt';
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.lineWidth = Math.max(1, viewH * 0.003);
  for (i = 0; i < 8; i++) {
    a = bal.wheelA + i * Math.PI / 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke();
    var gx = x + Math.cos(a) * r, gy = y + Math.sin(a) * r + viewH * 0.02;
    col = maneColors[i % maneColors.length];
    artRoundRect(c, gx - viewH * 0.016, gy - viewH * 0.012, viewH * 0.032, viewH * 0.028, viewH * 0.006, col, { flat: true, lineColor: artShade(col, -0.45), line: 1.2 });
    c.lineWidth = Math.max(1, viewH * 0.003);
    c.strokeStyle = 'rgba(255,255,255,0.7)';
  }
  for (i = 0; i < 16; i++) {
    a = -bal.wheelA * 0.5 + i * Math.PI / 8;
    c.fillStyle = Math.sin(globalT * 6 + i) > 0 ? '#ffe27a' : '#ff9ec6';
    c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, viewH * 0.005, 0, Math.PI * 2); c.fill();
  }
  artCircle(c, x, y, viewH * 0.012, '#ffd24f', { lineColor: '#d98a00', line: 1.2 });
}

// Iso pehmeä nuoli tuulen suuntaan
function drawWindArrow(c, x, y, s, dir, alpha) {
  c.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  c.beginPath();
  c.moveTo(x + dir * s * 1.1, y);
  c.lineTo(x + dir * s * 0.35, y - s * 0.55);
  c.lineTo(x + dir * s * 0.35, y - s * 0.22);
  c.lineTo(x - dir * s * 1.1, y - s * 0.22);
  c.lineTo(x - dir * s * 1.1, y + s * 0.22);
  c.lineTo(x + dir * s * 0.35, y + s * 0.22);
  c.lineTo(x + dir * s * 0.35, y + s * 0.55);
  c.closePath();
  c.fill();
}

// Tuulikerrokset: sävy, kerrosrajat ja ajelehtivat nuolet (vain tuulialueella)
function drawWindStreaks(c) {
  var i, k, band, y, x, dir, sp, off, s, calmL = worldW * 0.05 - camX, calmR = worldW * 0.885 - camX;
  var x0 = Math.max(0, calmL), x1 = Math.min(viewW, calmR);
  if (x1 <= x0) return;
  for (k = 0; k < BAL_BANDS.length; k++) {
    band = BAL_BANDS[k];
    var by0 = viewH * band.y0, by1 = viewH * band.y1;
    if (band.tint) { c.fillStyle = band.tint; c.fillRect(x0, by0, x1 - x0, by1 - by0); }
    if (k > 0) {
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = Math.max(1.5, viewH * 0.004);
      c.setLineDash([viewH * 0.02, viewH * 0.02]);
      c.beginPath(); c.moveTo(x0, by0); c.lineTo(x1, by0); c.stroke();
      c.setLineDash([]);
    }
    dir = band.w > 0 ? 1 : -1;
    sp = Math.abs(band.w) * viewW;
    s = viewH * 0.034;
    c.save();
    c.beginPath(); c.rect(x0, by0, x1 - x0, by1 - by0); c.clip();
    for (i = 0; i < 6; i++) {
      y = by0 + (by1 - by0) * (0.18 + ((i * 0.31 + 0.07) % 1) * 0.64);
      off = globalT * sp * 1.4 * dir + i * viewW * 0.23 - camX * 0.5;
      x = ((off % (viewW + s * 4)) + viewW + s * 4) % (viewW + s * 4) - s * 2;
      drawWindArrow(c, x, y, s, dir, 0.45 + Math.sin(globalT * 3 + i) * 0.12);
    }
    c.restore();
  }
  // Tyynet alueet: ei tuulta -> ei nuolia; pieni pilvimerkki kertoo tyynen
  c.lineCap = 'butt';
}

// Juhlailmapallo: glow päälle maailmassa (keräiltävä), HUDissa ilman
function drawPartyBalloon(c, x, y, s, color, phase, glow) {
  var sway = Math.sin(phase) * s * 0.15, line = artShade(color, -0.45);
  if (glow) artGlow(c, x, y, s * 1.9, color, 0.35);
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(x, y + s * 1.15); c.quadraticCurveTo(x + sway * 2, y + s * 1.8, x - sway, y + s * 2.4); c.stroke();
  c.beginPath(); c.moveTo(x, y + s * 1.1); c.lineTo(x - s * 0.17, y + s * 1.34); c.lineTo(x + s * 0.17, y + s * 1.34); c.closePath();
  artFillPath(c, color, y + s * 1.1, y + s * 1.34, s * 0.2, { lineColor: line, line: Math.max(1, s * 0.07) });
  artBlob(c, x, y, s * 0.85, s, color, { lineColor: line, hi: 0.5 });
}

// Leija: tökättäessä heilahtaa ja räpäyttää silmiä (k.pokeT)
function drawKite(c, k) {
  var x = k.x - camX, y = k.y, s = viewH * 0.045, i, line = artShade(k.c, -0.45);
  var wig = k.pokeT > 0 ? Math.sin(k.pokeT * 25) * 0.35 * k.pokeT : 0, blink = k.pokeT > 0.5;
  if (x < -s * 6 || x > viewW + s * 6) return;
  // Häntä
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y + s * 1.2);
  for (i = 1; i <= 5; i++) c.lineTo(x - i * s * 0.5 + Math.sin(k.t * 5 + i) * s * 0.25, y + s * 1.2 + i * s * 0.55);
  c.strokeStyle = line;
  c.lineWidth = Math.max(3, s * 0.16);
  c.stroke();
  c.strokeStyle = k.c;
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.stroke();
  c.save();
  c.translate(x, y);
  c.rotate(wig);
  c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s * 0.85, 0); c.lineTo(0, s * 1.2); c.lineTo(-s * 0.85, 0); c.closePath();
  artFillPath(c, k.c, -s * 1.2, s * 1.2, s * 0.85, { lineColor: line });
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(0, s * 1.2); c.moveTo(-s * 0.85, 0); c.lineTo(s * 0.85, 0); c.stroke();
  artHighlight(c, -s * 0.32, -s * 0.55, s * 0.18, s * 0.1, 0.35);
  artEye(c, -s * 0.25, -s * 0.2, s * 0.13, 0.8, blink);
  artEye(c, s * 0.25, -s * 0.2, s * 0.13, 0.8, blink);
  c.restore();
  c.lineCap = 'butt';
}

function drawHotAirBalloon(c, x, y, R, tilt, burn, t) {
  var i;
  // Viiri korin kyljessä liehuu tuulen suuntaan: näyttää missä tuulessa ollaan
  var wind = balWindAt(bal.x, bal.y), wdir = wind > 0 ? 1 : (wind < 0 ? -1 : 0);
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  if (wdir !== 0) {
    var fl = R * (0.5 + Math.min(1, Math.abs(wind) / (viewW * 0.25)) * 0.5);
    c.beginPath();
    c.moveTo(0, -R * 1.05);
    c.quadraticCurveTo(wdir * fl * 0.5, -R * 1.05 - fl * 0.2 + Math.sin(t * 9) * fl * 0.08, wdir * fl, -R * 1.05 - fl * 0.1 + Math.sin(t * 9 + 1) * fl * 0.1);
    c.lineTo(wdir * fl * 0.9, -R * 1.05 + fl * 0.16 + Math.sin(t * 9 + 1) * fl * 0.1);
    c.quadraticCurveTo(wdir * fl * 0.5, -R * 1.05 + fl * 0.16, 0, -R * 1.05 + fl * 0.22);
    c.closePath();
    artFillPath(c, '#ffd24f', -R * 1.3, -R * 0.8, fl * 0.3, { lineColor: '#d98a00', line: Math.max(1, R * 0.025) });
    c.fillStyle = '#5a3a1e';
    c.fillRect(-R * 0.02, -R * 1.3, R * 0.04, R * 0.3);
  }
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
  // Reunaviiva ja kiilto (tarrakirja)
  c.strokeStyle = '#6a2a5a';
  c.lineWidth = Math.max(1.5, R * 0.05);
  c.lineJoin = 'round';
  c.stroke();
  artHighlight(c, -R * 0.38, -R * 0.42, R * 0.26, R * 0.16, 0.45);
  // Suu
  artBlob(c, 0, R * 0.98, R * 0.3, R * 0.08, '#5a3a1e', { lineColor: '#2a1a0a', line: Math.max(1, R * 0.025) });
  // Prinsessa korissa (yläosa)
  c.save();
  c.beginPath(); c.rect(-R * 0.6, by - R * 0.9, R * 1.2, R * 0.72); c.clip();
  drawPrincessFree(c, 0, by + R * 0.08, R / 44, 1, 0, false, t);
  c.restore();
  // Kori: kaksisävyinen punos reunaviivalla
  artRoundRect(c, -R * 0.42, by - R * 0.2, R * 0.84, R * 0.42, R * 0.08, '#b07a40', { lineColor: '#5a3a1e', line: Math.max(1.5, R * 0.04) });
  c.strokeStyle = 'rgba(90,58,30,0.6)';
  c.lineWidth = Math.max(1, R * 0.02);
  for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-R * 0.4, by - R * 0.2 + i * R * 0.105); c.lineTo(R * 0.4, by - R * 0.2 + i * R * 0.105); c.stroke(); }
  artHighlight(c, -R * 0.28, by - R * 0.1, R * 0.1, R * 0.04, 0.25);
  c.restore();
}

// ---------- Tökättävät koristeet (tivolin maa) ----------
var BAL_BUNCH_OFF = [[-1.1, -3.4], [0.9, -3.9], [-0.1, -4.9], [1.7, -2.9]];
var BAL_BUNCH_COLS = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#c9a0ff'];

// Kaksi ilmapallokimppua ja karkkikärry nurmella; ei tehtäväkaarten (0.33, 0.66)
// eikä laskeutumisalustan (0.94) kohdalle. Rakennetaan uudestaan resize-koukussa.
function balSetupProps() {
  var gy = groundTop;
  propsReset();
  propAdd({ x: worldW * 0.18, y: gy, s: viewH * 0.04, r: viewH * 0.11, hy: viewH * 0.15, color: '#ff9ec6', note: 1047, gone: -1, flyT: 0, faceT: 0, ci: 0, draw: balDrawBunch, poke: balPokeBunch, update: balUpdateBunch });
  propAdd({ x: worldW * 0.56, y: gy, s: viewH * 0.04, r: viewH * 0.11, hy: viewH * 0.15, color: '#7fd4ff', note: 1175, gone: -1, flyT: 0, faceT: 0, ci: 2, draw: balDrawBunch, poke: balPokeBunch, update: balUpdateBunch });
  propAdd({ x: worldW * 0.78, y: gy, s: viewH * 0.05, r: viewH * 0.1, hy: viewH * 0.09, color: '#ffb3d9', note: 784, draw: balDrawCart, poke: balPokeCart });
}

// Ilmapallokimppu: tökkäys keinuttaa kimppua ja päästää yhden pallon karkuun;
// kolmannella tökkäyksellä suurin pallo saa kasvot ja iskee silmää (yllätys)
function balDrawBunch(c, p) {
  var s = p.s, i, bx, by, col, t = p.t, fly, a;
  var bob = t >= 0 ? Math.sin(t * 7) * Math.exp(-t * 2) * s * 0.5 : Math.sin(globalT * 1.3 + p.x) * s * 0.12;
  artShadow(c, 0, 0, s * 0.8, s * 0.16, 0.16);
  artLimb(c, 0, 0, 0, -s * 1.5, s * 0.14, '#8a6a44', '#4a3418');
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath();
  for (i = 0; i < 4; i++) {
    if (i === p.gone) continue;
    c.moveTo(0, -s * 1.5);
    c.lineTo(BAL_BUNCH_OFF[i][0] * s, (BAL_BUNCH_OFF[i][1] + 1.0) * s + bob * (i % 2 ? 1 : -1));
  }
  c.stroke();
  for (i = 0; i < 4; i++) {
    col = BAL_BUNCH_COLS[(i + p.ci) % 4];
    bx = BAL_BUNCH_OFF[i][0] * s;
    by = BAL_BUNCH_OFF[i][1] * s + bob * (i % 2 ? 1 : -1);
    if (i === p.gone) {
      // Karannut pallo nousee, ajelehtii ja haalistuu
      fly = p.flyT;
      a = Math.max(0, 1 - fly / 2.2);
      if (a <= 0) continue;
      c.globalAlpha = a;
      by -= fly * viewH * 0.22;
      bx += Math.sin(fly * 3) * s * 0.6;
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.beginPath(); c.moveTo(bx, by + s); c.quadraticCurveTo(bx + s * 0.3, by + s * 1.8, bx - s * 0.2, by + s * 2.6); c.stroke();
    }
    artBlob(c, bx, by, s * 0.78, s * 0.92, col, { lineColor: artShade(col, -0.45), hi: 0.5 });
    c.fillStyle = artShade(col, -0.2);
    c.beginPath(); c.moveTo(bx, by + s * 0.88); c.lineTo(bx - s * 0.14, by + s * 1.08); c.lineTo(bx + s * 0.14, by + s * 1.08); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }
  if (p.faceT > 0) {
    bx = BAL_BUNCH_OFF[2][0] * s;
    by = BAL_BUNCH_OFF[2][1] * s - bob;
    artEye(c, bx - s * 0.26, by - s * 0.15, s * 0.13, 0, p.faceT < 2.0 && p.faceT > 1.6);
    artEye(c, bx + s * 0.26, by - s * 0.15, s * 0.13, 0, false);
    artBlush(c, bx - s * 0.42, by + s * 0.15, s * 0.1);
    artBlush(c, bx + s * 0.42, by + s * 0.15, s * 0.1);
    c.strokeStyle = '#7a3050';
    c.lineWidth = Math.max(1, s * 0.06);
    c.lineCap = 'round';
    c.beginPath(); c.arc(bx, by + s * 0.1, s * 0.3, 0.3, Math.PI - 0.3); c.stroke();
  }
}
function balUpdateBunch(p, dt) {
  if (p.gone >= 0) {
    p.flyT += dt;
    if (p.flyT > 2.4) { p.gone = -1; p.flyT = 0; }
  }
  if (p.faceT > 0) p.faceT -= dt;
}
function balPokeBunch(p) {
  if (p.gone < 0) {
    p.gone = [0, 1, 3][randInt(3)];
    p.flyT = 0;
    playNote(1568, 0.05, 0.12, 'sine', 0.15);
  }
  if (p.n % 3 === 0) {
    p.faceT = 3.0;
    playNote(880, 0.1, 0.08, 'triangle', 0.2);
    playNote(1175, 0.2, 0.15, 'triangle', 0.2);
  }
}

// Hattarakärry: tökkäys heilauttaa hattaroita ja pudottaa karkin, joka pomppaa nurmella
function balDrawCart(c, p) {
  var s = p.s, t = p.t, sway = t >= 0 ? Math.sin(t * 9) * Math.exp(-t * 3) * 0.3 : Math.sin(globalT * 1.5) * 0.04;
  artShadow(c, 0, s * 0.05, s * 1.7, s * 0.3, 0.2);
  artCircle(c, -s * 0.9, -s * 0.38, s * 0.38, '#5a3a1e', { lineColor: '#2a1a0a' });
  artCircle(c, s * 0.9, -s * 0.38, s * 0.38, '#5a3a1e', { lineColor: '#2a1a0a' });
  artRoundRect(c, -s * 1.3, -s * 1.75, s * 2.6, s * 1.3, s * 0.2, '#ff7bac', { lineColor: '#a8405f' });
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(-s * 0.95, -s * 1.75, s * 0.4, s * 1.3);
  c.fillRect(s * 0.15, -s * 1.75, s * 0.4, s * 1.3);
  // Katoksen tolppa ja katos
  artLimb(c, 0, -s * 1.75, 0, -s * 3.1, s * 0.1, '#8a6a44', '#4a3418');
  c.beginPath(); c.moveTo(-s * 1.5, -s * 3.1); c.lineTo(s * 1.5, -s * 3.1); c.lineTo(s * 1.2, -s * 3.55); c.lineTo(-s * 1.2, -s * 3.55); c.closePath();
  artFillPath(c, '#ffd24f', -s * 3.55, -s * 3.1, s * 0.3, { lineColor: '#b8860b' });
  // Hattarat tikuissa heiluvat
  c.save(); c.translate(-s * 0.6, -s * 1.75); c.rotate(sway);
  artLimb(c, 0, 0, 0, -s * 0.9, s * 0.08, '#fff6e8', '#b8a0c8');
  artBlob(c, 0, -s * 1.25, s * 0.42, s * 0.5, '#ffb3d9', { lineColor: '#c96a92', hi: 0.4 });
  c.restore();
  c.save(); c.translate(s * 0.6, -s * 1.75); c.rotate(-sway);
  artLimb(c, 0, 0, 0, -s * 0.8, s * 0.08, '#fff6e8', '#b8a0c8');
  artBlob(c, 0, -s * 1.15, s * 0.4, s * 0.46, '#b8e8ff', { lineColor: '#5a9ac0', hi: 0.4 });
  c.restore();
}
function balPokeCart(p) {
  var cols = ['#ff9ec6', '#b8e8ff', '#ffe27a'];
  propDropBall(p.x + (Math.random() - 0.5) * p.s, p.y - p.s * 1.9, p.s * 0.22, cols[p.n % 3], p.y, (Math.random() - 0.5) * viewW * 0.06);
  playNote(784, 0.05, 0.1, 'triangle', 0.2);
}

function drawBalloon() {
  var i, R = balR();
  if (!beginPlayWorld()) return;
  drawFerrisWheel(ctx);
  drawWindStreaks(ctx);
  // Maan koristeet (ilmapallokimput, karkkikärry)
  propsDraw(ctx);
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
    drawPartyBalloon(ctx, balItems[i].ax - camX + Math.sin(balItems[i].phase * 0.7) * viewH * 0.01, balItems[i].ay + Math.sin(balItems[i].phase) * viewH * 0.015, viewH * 0.03, balItems[i].c, balItems[i].phase, true);
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
  endPlayWorld();
  drawPickupHud(ctx, BAL_COUNT, function (k) { return balItems[k] && balItems[k].collected; },
    function (c, x, y, s) { drawPartyBalloon(c, x, y - s * 0.3, s * 0.7, '#ff7bac', 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
