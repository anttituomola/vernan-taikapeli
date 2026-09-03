'use strict';

// Kristalliluola: pimeä tasohyppely. Valo vain prinsessan ympärillä, liikkuvat
// tasot, tippuvat tippukivet, lepakot ja vesikuilut. Sydämet ja lyhdyt käytössä.

var CRYSTAL_COUNT = 10;
var crystals = [];
var stalactites = [];
var bats = [];
var caveDoor = { fx: 0.965, x: 0, open: false };
var caveGround = [[0.0, 0.165], [0.195, 0.345], [0.375, 0.52], [0.565, 0.705], [0.735, 0.865], [0.895, 1.0]];
var caveWaterY = 0;

var CRYSTAL_COLORS = ['#8fd3ff', '#c9a0ff', '#ff9ec6', '#9fffd8', '#ffe27a'];

function layoutCave() {
  var g = groundTop, i, seg;
  platforms = [];
  for (i = 0; i < caveGround.length; i++) {
    seg = caveGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: g, w: (seg[1] - seg[0]) * worldW });
  }
  // Kiinteät kielekkeet
  platforms.push({ kind: 'ledge', x: worldW * 0.08, y: g - viewH * 0.22, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.25, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.42, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.60, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.78, y: g - viewH * 0.22, w: worldW * 0.045 });
  // Liikkuvat tasot kuilujen yllä
  platforms.push({
    kind: 'mover', baseX: worldW * 0.5425 - worldW * 0.025, x: 0, y: g - viewH * 0.10, w: worldW * 0.05,
    range: worldW * 0.018, speed: 1.1, phase: 0, vx: 0
  });
  platforms.push({
    kind: 'mover', baseX: worldW * 0.8775 - worldW * 0.025, x: 0, y: g - viewH * 0.18, w: worldW * 0.05,
    range: worldW * 0.02, speed: 0.9, phase: 1.5, vx: 0
  });
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'mover') platforms[i].x = platforms[i].baseX;
  }
  caveWaterY = g + viewH * 0.06;
  caveDoor.x = caveDoor.fx * worldW;
}

var crystalDefs = [
  { fx: 0.10, fy: 0.30 }, { fx: 0.18, fy: 0.30 }, { fx: 0.27, fy: 0.40 },
  { fx: 0.36, fy: 0.30 }, { fx: 0.44, fy: 0.32 }, { fx: 0.545, fy: 0.26 },
  { fx: 0.62, fy: 0.40 }, { fx: 0.72, fy: 0.30 }, { fx: 0.80, fy: 0.30 },
  { fx: 0.88, fy: 0.36 }
];

function initCave() {
  var i;
  setupRunLevel(6, '#0b0a1e');
  layoutCave();
  tasks = [makeTask(0.30, 'minus'), makeTask(0.79, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.44, 0.76]);
  crystals = [];
  for (i = 0; i < CRYSTAL_COUNT; i++) {
    crystals.push({
      ax: crystalDefs[i].fx * worldW,
      ay: groundTop - crystalDefs[i].fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2,
      color: CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]
    });
  }
  stalactites = [];
  var stalFx = [0.12, 0.29, 0.47, 0.66, 0.82];
  for (i = 0; i < stalFx.length; i++) {
    stalactites.push({ fx: stalFx[i], x: stalFx[i] * worldW, y: viewH * 0.08, vy: 0, state: 'hang', t: 0 });
  }
  bats = [];
  bats.push({ zA: 0.22, zB: 0.33, x: worldW * 0.27, baseY: groundTop - viewH * 0.22, y: 0, dir: 1, t: 0, stunT: 0, amp: viewH * 0.10, f: 2.2 });
  bats.push({ zA: 0.58, zB: 0.70, x: worldW * 0.62, baseY: groundTop - viewH * 0.16, y: 0, dir: -1, t: 1, stunT: 0, amp: viewH * 0.13, f: 1.8 });
  bats.push({ zA: 0.74, zB: 0.86, x: worldW * 0.80, baseY: groundTop - viewH * 0.28, y: 0, dir: 1, t: 2, stunT: 0, amp: viewH * 0.09, f: 2.6 });
  caveDoor.open = false;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(330, 0, 0.3, 'sine', 0.35);
  playNote(494, 0.15, 0.4, 'triangle', 0.3);
}

function respawnCave() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeCave(ratio) {
  var i;
  princess.x *= ratio;
  layoutCave();
  for (i = 0; i < crystals.length; i++) {
    crystals[i].ax = crystalDefs[i].fx * worldW;
    crystals[i].ay = groundTop - crystalDefs[i].fy * viewH;
  }
  for (i = 0; i < stalactites.length; i++) stalactites[i].x = stalactites[i].fx * worldW;
  for (i = 0; i < bats.length; i++) bats[i].x *= ratio;
  for (i = 0; i < sparks.length; i++) sparks[i].x *= ratio;
}

function countCrystals() {
  return countCollected(crystals);
}

function collectCrystal(cr) {
  cr.collected = true;
  registerCollected(cr);
  spawnSparkles(cr.ax, cr.ay, 14, cr.color);
  playNote(880 + countCrystals() * 60, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCrystals() * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCrystals() === CRYSTAL_COUNT && !caveDoor.open) {
    caveDoor.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function caveFell() {
  spawnSparkles(princess.x, caveWaterY, 14, '#6fd0ff');
  playNote(200, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  // failSection palautti jo lyhdylle, jos sydämet loppuivat
  if (hearts <= heartsBefore && hearts > 0) respawnAtPitEdge();
}

// Kuilun vasemmalle reunalle, jotta hyppyä voi yrittää heti uudestaan
function respawnAtPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < caveGround.length; i++) {
    var end = caveGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  var rx = best > 0 ? best - viewH * 0.09 : checkpoint.x;
  resetPrincess(rx, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#6fd0ff');
}

function updateCave(dt) {
  var i, k;
  updateTasks(dt);

  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'mover' && !puzzleBusy()) moverStep(platforms[i], dt);
  }

  platformerStep(dt, {
    runSp: viewW * 0.22,
    fallY: caveWaterY,
    onFall: function () { caveFell(); }
  });
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  // Kristallit kerätään koskettamalla
  for (i = 0; i < crystals.length; i++) {
    var cr = crystals[i];
    if (cr.collected) continue;
    cr.phase += dt * 2;
    var dx = cr.ax - princess.x, dy = (cr.ay + Math.sin(cr.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectCrystal(cr);
  }

  // Tippukivet: tärisevät hetken ja putoavat, kun prinsessa kulkee alta
  for (i = 0; i < stalactites.length; i++) {
    var st = stalactites[i];
    if (puzzleBusy()) continue;
    if (st.state === 'hang') {
      if (Math.abs(princess.x - st.x) < viewW * 0.05 && princess.y > st.y) {
        st.state = 'shake';
        st.t = 0;
        playNote(110, 0, 0.3, 'sawtooth', 0.15);
      }
    } else if (st.state === 'shake') {
      st.t += dt;
      if (st.t > 0.85) { st.state = 'fall'; st.vy = 0; }
    } else if (st.state === 'fall') {
      st.vy += viewH * 1.6 * dt;
      st.y += st.vy * dt;
      if (Math.abs(st.x - princess.x) < viewH * 0.05 &&
          st.y > princess.y - viewH * 0.16 && st.y < princess.y + viewH * 0.02) {
        if (loseHeart()) {
          princess.knockVx = (princess.x < st.x ? -1 : 1) * viewW * 0.25;
        }
        st.state = 'gone'; st.t = 0;
        spawnSparkles(st.x, st.y, 10, '#c9c9e0');
      } else if (st.y >= groundTop) {
        st.state = 'gone'; st.t = 0;
        spawnSparkles(st.x, groundTop, 10, '#c9c9e0');
        playNote(150, 0, 0.15, 'square', 0.15);
      }
    } else if (st.state === 'gone') {
      st.t += dt;
      if (st.t > 4) { st.state = 'hang'; st.y = viewH * 0.08; }
    }
  }

  // Lepakot: siniaaltoliike omalla alueellaan, sauvan kipinä tainnuttaa
  for (i = 0; i < bats.length; i++) {
    var bt = bats[i];
    bt.t += dt;
    if (bt.stunT > 0) {
      bt.stunT -= dt;
      bt.y = bt.baseY - viewH * 0.3 - Math.sin(bt.t * 6) * 6;
      continue;
    }
    if (!puzzleBusy()) {
      bt.x += bt.dir * viewW * 0.085 * dt;
      if (bt.x < bt.zA * worldW) { bt.x = bt.zA * worldW; bt.dir = 1; }
      if (bt.x > bt.zB * worldW) { bt.x = bt.zB * worldW; bt.dir = -1; }
    }
    bt.y = bt.baseY + Math.sin(bt.t * bt.f) * bt.amp;
    var bdx = bt.x - princess.x, bdy = bt.y - (princess.y - viewH * 0.07);
    if (!celebrating && bdx * bdx + bdy * bdy < viewH * 0.06 * viewH * 0.06) {
      if (loseHeart()) {
        princess.knockVx = (bdx > 0 ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.3;
      }
    }
  }

  var batTargets = [];
  for (i = 0; i < bats.length; i++) batTargets.push(bats[i]);
  updateSparksAgainst(dt, batTargets, viewH * 0.07, function (bt) {
    bt.stunT = 3.5;
    spawnSparkles(bt.x, bt.y, 10, '#ffe27a');
    playNote(1200, 0, 0.12, 'sine', 0.3);
  });

  // Ovi: kaikki kristallit -> ovi hehkuu, kosketus vie juhlaan
  if (caveDoor.open && !celebrating && Math.abs(princess.x - caveDoor.x) < viewH * 0.07) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderCaveBg(b, w, h) {
  var i, x, seg;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#07061a');
  sky.addColorStop(0.5, '#1a1440');
  sky.addColorStop(1, '#241b52');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  // Katon tippukivisiluetit
  b.fillStyle = '#100c2a';
  for (i = 0; i < 40; i++) {
    x = (i * 173.3) % w;
    var len = h * (0.05 + (i % 4) * 0.03);
    b.beginPath();
    b.moveTo(x - h * 0.02, 0);
    b.lineTo(x + h * 0.02, 0);
    b.lineTo(x, len);
    b.closePath();
    b.fill();
  }
  // Takaseinän kiteet
  for (i = 0; i < 30; i++) {
    x = (i * 211.7) % w;
    var cy = h * (0.25 + (i % 5) * 0.09);
    b.fillStyle = 'rgba(140,120,220,0.18)';
    b.beginPath();
    b.moveTo(x, cy - h * 0.03);
    b.lineTo(x + h * 0.012, cy);
    b.lineTo(x, cy + h * 0.03);
    b.lineTo(x - h * 0.012, cy);
    b.closePath();
    b.fill();
  }
  // Vesi kuiluissa
  var water = b.createLinearGradient(0, groundTop, 0, h);
  water.addColorStop(0, '#1f8fa8');
  water.addColorStop(1, '#0b3a4a');
  b.fillStyle = water;
  b.fillRect(0, groundTop + h * 0.03, w, h - groundTop);
  // Maasegmentit
  for (i = 0; i < caveGround.length; i++) {
    seg = caveGround[i];
    drawStoneSlab(b, seg[0] * w, groundTop, (seg[1] - seg[0]) * w, h - groundTop, h);
  }
  // Kiinteät kielekkeet
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'ledge') {
      drawStoneSlab(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05, h);
    }
  }
  // Ovi maailman lopussa
  drawCaveDoorFrame(b, caveDoor.x, groundTop, h);
}

function drawStoneSlab(b, x, y, w, hh, h) {
  var g = b.createLinearGradient(0, y, 0, y + hh);
  g.addColorStop(0, '#5a5480');
  g.addColorStop(0.15, '#3e3960');
  g.addColorStop(1, '#221d3d');
  b.fillStyle = g;
  roundRect(b, x, y, w, hh, Math.min(h * 0.015, w / 4));
  b.fill();
  b.fillStyle = 'rgba(255,255,255,0.12)';
  b.fillRect(x + w * 0.05, y + 2, w * 0.9, Math.max(2, h * 0.006));
}

function drawCaveDoorFrame(b, x, baseY, h) {
  var dw = h * 0.12, dh = h * 0.24;
  b.fillStyle = '#3e3960';
  roundRect(b, x - dw * 0.7, baseY - dh * 1.1, dw * 1.4, dh * 1.1, dw * 0.3);
  b.fill();
  b.fillStyle = '#14102c';
  roundRect(b, x - dw / 2, baseY - dh, dw, dh, dw * 0.4);
  b.fill();
}

function drawCrystal(c, x, y, s, color) {
  c.save();
  c.translate(x, y);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, -s);
  c.lineTo(s * 0.55, -s * 0.3);
  c.lineTo(s * 0.4, s * 0.9);
  c.lineTo(-s * 0.4, s * 0.9);
  c.lineTo(-s * 0.55, -s * 0.3);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.moveTo(0, -s);
  c.lineTo(s * 0.55, -s * 0.3);
  c.lineTo(0, -s * 0.05);
  c.closePath();
  c.fill();
  c.restore();
}

function drawCrystalGlow(c, x, y, r, color) {
  var g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.45;
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
}

function drawStalactite(c, st) {
  var x = st.x - camX;
  var s = viewH * 0.03;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (st.state === 'gone') return;
  var shake = st.state === 'shake' ? Math.sin(globalT * 40) * s * 0.15 : 0;
  c.fillStyle = st.state === 'shake' ? '#d8d0f0' : '#a89ecf';
  c.beginPath();
  c.moveTo(x - s * 0.8 + shake, st.y - s * 0.5);
  c.lineTo(x + s * 0.8 + shake, st.y - s * 0.5);
  c.lineTo(x + shake, st.y + s * 2.2);
  c.closePath();
  c.fill();
}

function drawBat(c, bt) {
  var x = bt.x - camX, y = bt.y, s = viewH * 0.03;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var flap = Math.sin(bt.t * 14) * 0.6;
  c.save();
  c.translate(x, y);
  c.fillStyle = bt.stunT > 0 ? '#7a6f9a' : '#3b2f5c';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-s * 1.4, -s * (0.6 + flap), -s * 2.4, s * 0.2);
  c.quadraticCurveTo(-s * 1.2, s * 0.1, 0, s * 0.5);
  c.quadraticCurveTo(s * 1.2, s * 0.1, s * 2.4, s * 0.2);
  c.quadraticCurveTo(s * 1.4, -s * (0.6 + flap), 0, 0);
  c.fill();
  c.beginPath(); c.arc(0, s * 0.1, s * 0.55, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3b2f5c';
  c.beginPath();
  c.moveTo(-s * 0.4, -s * 0.3); c.lineTo(-s * 0.25, -s * 0.9); c.lineTo(-s * 0.05, -s * 0.3);
  c.moveTo(s * 0.4, -s * 0.3); c.lineTo(s * 0.25, -s * 0.9); c.lineTo(s * 0.05, -s * 0.3);
  c.fill();
  c.restore();
}

function drawBatEyes(c, bt) {
  var x = bt.x - camX, y = bt.y, s = viewH * 0.03;
  if (x < -s * 4 || x > viewW + s * 4) return;
  c.fillStyle = bt.stunT > 0 ? '#ffe27a' : '#ffd0d0';
  c.beginPath(); c.arc(x - s * 0.2, y, s * 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.2, y, s * 0.1, 0, Math.PI * 2); c.fill();
}

function drawCaveDoorGlow(c) {
  var x = caveDoor.x - camX;
  var h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var dw = h * 0.12, dh = h * 0.24;
  if (caveDoor.open) {
    var g = c.createLinearGradient(0, groundTop - dh, 0, groundTop);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.8 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,200,120,0.6)');
    c.fillStyle = g;
    roundRect(c, x - dw / 2, groundTop - dh, dw, dh, dw * 0.4);
    c.fill();
    drawStar(c, x, groundTop - dh * 1.35, h * 0.035, globalT, 1);
  } else {
    c.fillStyle = 'rgba(120,100,200,0.35)';
    roundRect(c, x - dw / 2, groundTop - dh, dw, dh, dw * 0.4);
    c.fill();
  }
}

function drawDarkness(c, lx, ly, radius) {
  var g = c.createRadialGradient(lx, ly, radius * 0.35, lx, ly, radius);
  g.addColorStop(0, 'rgba(5,4,20,0)');
  g.addColorStop(0.7, 'rgba(5,4,20,0.5)');
  g.addColorStop(1, 'rgba(5,4,20,0.86)');
  c.fillStyle = g;
  c.fillRect(0, 0, viewW, viewH);
}

function drawCave() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'mover') {
      drawStoneSlab(ctx, platforms[i].x - camX, platforms[i].y, platforms[i].w, viewH * 0.045, viewH);
    }
  }
  for (i = 0; i < stalactites.length; i++) drawStalactite(ctx, stalactites[i]);
  for (i = 0; i < bats.length; i++) drawBat(ctx, bats[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);

  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  var blink = hurtT > 0 && Math.sin(globalT * 22) > 0;
  if (blink) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawSparks(ctx);
  drawParticlesLayer(ctx);

  // Pimeys: valo prinsessan ympärillä, valonlähteet piirretään päälle
  if (!celebrating) drawDarkness(ctx, princess.x - camX, princess.y - viewH * 0.08, viewH * 0.72);
  for (i = 0; i < crystals.length; i++) {
    var cr = crystals[i];
    if (cr.collected) continue;
    var cy = cr.ay + Math.sin(cr.phase) * viewH * 0.012;
    drawCrystalGlow(ctx, cr.ax - camX, cy, viewH * 0.07, cr.color);
    drawCrystal(ctx, cr.ax - camX, cy, viewH * 0.024, cr.color);
  }
  for (i = 0; i < checkpoints.length; i++) {
    if (checkpoints[i].lit) drawLantern(ctx, checkpoints[i], groundTop);
  }
  for (i = 0; i < bats.length; i++) drawBatEyes(ctx, bats[i]);
  drawCaveDoorGlow(ctx);
  if (caveDoor.open && !celebrating) drawEdgeArrow(ctx, caveDoor.x);

  drawCelebrateLayer();
  drawPickupHud(ctx, CRYSTAL_COUNT, function (i2) { return crystals[i2] && crystals[i2].collected; },
    function (c, x, y, s) { drawCrystal(c, x, y, s, '#8fd3ff'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
