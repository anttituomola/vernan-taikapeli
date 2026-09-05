'use strict';

// Kuun vartija: saaren vartijahuone. Neljä tehtäväporttia peräkkäin, tähdet
// putoavat taivaalta (varoitushehku maassa ennen osumaa) ja kuunkivet kerätään
// kiviltä. Kuun kasvot heräävät tehtävä kerrallaan. Sydämet käytössä.

var MSTONE_COUNT = 6;
var moonStones = [];
var meteors = [];
var meteorT = 2.5;
var moonDoor = { fx: 0.95, x: 0, open: false };
var mstoneDefs = [
  { fx: 0.05, fy: 0.10 }, { fx: 0.145, fy: 0.34 }, { fx: 0.345, fy: 0.34 },
  { fx: 0.545, fy: 0.34 }, { fx: 0.745, fy: 0.34 }, { fx: 0.90, fy: 0.10 }
];

function layoutMoon() {
  var g = groundTop;
  platforms = [
    { kind: 'ground', x: 0, y: g, w: worldW },
    { kind: 'ledge', x: worldW * 0.12, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.32, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.52, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.72, y: g - viewH * 0.20, w: worldW * 0.05 }
  ];
  moonDoor.x = moonDoor.fx * worldW;
}

function initMoon() {
  var i;
  setupRunLevel(16, '#0a0a2a');
  layoutMoon();
  tasks = [
    makeTask(0.22, 'rhythm'),
    makeTask(0.42, 'shadow'),
    makeTask(0.62, 'minus'),
    makeTask(0.82, 'memory', { seqLen: 5, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.32, 0.52, 0.72]);
  moonStones = [];
  for (i = 0; i < MSTONE_COUNT; i++) {
    moonStones.push({ ax: mstoneDefs[i].fx * worldW, ay: groundTop - mstoneDefs[i].fy * viewH, collected: false, phase: Math.random() * Math.PI * 2 });
  }
  meteors = [];
  meteorT = 2.5;
  moonDoor.open = false;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(262, 0, 0.4, 'sine', 0.3);
  playNote(392, 0.2, 0.4, 'sine', 0.3);
  playNote(523, 0.4, 0.5, 'triangle', 0.3);
}

function respawnMoon() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  meteors = [];
  meteorT = 2.5;
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeMoon(ratio) {
  var i;
  princess.x *= ratio;
  layoutMoon();
  for (i = 0; i < moonStones.length; i++) {
    moonStones[i].ax = mstoneDefs[i].fx * worldW;
    moonStones[i].ay = groundTop - mstoneDefs[i].fy * viewH;
  }
  for (i = 0; i < meteors.length; i++) meteors[i].x *= ratio;
}

function moonTasksSolved() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return n;
}

function collectMoonStone(ms) {
  ms.collected = true;
  registerCollected(ms);
  spawnSparkles(ms.ax, ms.ay, 14, '#dfe8ff');
  playNote(700 + countCollected(moonStones) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(moonStones) * 60, 0.08, 0.3, 'sine', 0.3);
}

function updateMoon(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();

  platformerStep(dt, { runSp: viewW * 0.22 });
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < moonStones.length; i++) {
    var ms = moonStones[i];
    if (ms.collected) continue;
    ms.phase += dt * 2;
    var dx = ms.ax - princess.x, dy = (ms.ay + Math.sin(ms.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectMoonStone(ms);
  }

  // Putoavat tähdet: hehku maassa varoittaa, sitten tähti putoaa
  if (!busy && !celebrating && !moonDoor.open) {
    meteorT -= dt;
    if (meteorT <= 0) {
      meteorT = 1.8 + Math.random() * 0.9;
      var mx = princess.x + (Math.random() - 0.5) * viewW * 0.5 + princess.facing * viewW * 0.1;
      mx = Math.min(Math.max(mx, viewH * 0.1), worldW - viewH * 0.1);
      meteors.push({ x: mx, y: -viewH * 0.1, vy: viewH * 0.5, state: 'warn', t: 0.9, hit: false });
    }
  }
  for (i = meteors.length - 1; i >= 0; i--) {
    var m = meteors[i];
    if (busy) continue;
    if (m.state === 'warn') {
      m.t -= dt;
      if (m.t <= 0) { m.state = 'fall'; playNote(1200, 0, 0.3, 'sine', 0.12); }
      continue;
    }
    m.vy += viewH * 1.3 * dt;
    m.y += m.vy * dt;
    var hdx = m.x - princess.x, hdy = m.y - (princess.y - viewH * 0.08);
    if (!m.hit && !celebrating && hdx * hdx + hdy * hdy < viewH * 0.065 * viewH * 0.065) {
      m.hit = true;
      if (loseHeart()) {
        princess.knockVx = (princess.x < m.x ? -1 : 1) * viewW * 0.25;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffe27a');
      }
    }
    if (m.y >= groundTop) {
      spawnSparkles(m.x, groundTop, 12, '#fff6c8');
      playNote(180, 0, 0.2, 'triangle', 0.2);
      meteors.splice(i, 1);
    }
  }

  if (!moonDoor.open && moonTasksSolved() === tasks.length && countCollected(moonStones) === MSTONE_COUNT) {
    moonDoor.open = true;
    meteors = [];
    playNote(523, 0.2, 0.3, 'triangle', 0.4);
    playNote(659, 0.4, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.3, 'triangle', 0.4);
    playNote(1047, 0.8, 0.6, 'triangle', 0.45);
  }
  if (moonDoor.open && !celebrating && Math.abs(princess.x - moonDoor.x) < viewH * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderMoonBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05051a');
  sky.addColorStop(0.6, '#141440');
  sky.addColorStop(1, '#2a2860');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#ffffff';
  for (i = 0; i < 160; i++) {
    x = (i * 211.7) % w;
    b.globalAlpha = 0.35 + ((i * 7) % 6) / 10;
    b.beginPath(); b.arc(x, ((i * 83) % Math.round(h * 0.65)), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  // Kaukaiset vuoret
  b.fillStyle = '#1c1b4a';
  for (i = 0; i < 12; i++) {
    x = w * (i / 11);
    b.beginPath(); b.moveTo(x - h * 0.2, groundTop); b.lineTo(x, groundTop - h * (0.16 + (i % 3) * 0.05)); b.lineTo(x + h * 0.2, groundTop); b.closePath(); b.fill();
  }
  // Kuukivipolku kraatereineen
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#d9dcef');
  ground.addColorStop(0.15, '#a7abcf');
  ground.addColorStop(1, '#5c5f8a');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(60,60,110,0.35)';
  for (i = 0; i < 40; i++) {
    x = (i * 157.9) % w;
    var cy = groundTop + h * 0.04 + ((i * 47) % Math.max(1, Math.round(h - groundTop - h * 0.08)));
    b.beginPath();
    if (b.ellipse) b.ellipse(x, cy, h * (0.015 + (i % 3) * 0.01), h * (0.007 + (i % 3) * 0.004), 0, 0, Math.PI * 2);
    else b.arc(x, cy, h * 0.012, 0, Math.PI * 2);
    b.fill();
  }
  for (i = 1; i < platforms.length; i++) drawMoonRock(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05);
  drawMoonDoorFrame(b, moonDoor.x, groundTop, h);
}

function drawMoonRock(b, x, y, w, hh) {
  b.fillStyle = '#b9bde0';
  roundRect(b, x, y, w, hh, hh * 0.4);
  b.fill();
  b.fillStyle = 'rgba(60,60,110,0.3)';
  b.beginPath(); b.arc(x + w * 0.3, y + hh * 0.5, hh * 0.2, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + w * 0.7, y + hh * 0.45, hh * 0.15, 0, Math.PI * 2); b.fill();
}

function drawMoonDoorFrame(b, x, baseY, h) {
  var s = h * 0.12;
  b.fillStyle = '#8f8fc0';
  b.fillRect(x - s * 0.8, baseY - s * 1.7, s * 0.28, s * 1.7);
  b.fillRect(x + s * 0.52, baseY - s * 1.7, s * 0.28, s * 1.7);
  b.beginPath(); b.arc(x, baseY - s * 1.7, s * 0.8, Math.PI, 0); b.lineTo(x + s * 0.52, baseY - s * 1.7); b.arc(x, baseY - s * 1.7, s * 0.52, 0, Math.PI, true); b.closePath(); b.fill();
}

function drawMoonStone(c, x, y, s) {
  var g = c.createRadialGradient(x - s * 0.3, y - s * 0.3, s * 0.1, x, y, s);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#dfe8ff');
  g.addColorStop(1, '#9aa6dc');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(80,90,150,0.35)';
  c.beginPath(); c.arc(x + s * 0.3, y + s * 0.2, s * 0.22, 0, Math.PI * 2); c.fill();
}

// Kuun kasvot heräävät: 1 = silmä, 2 = molemmat, 3 = hymy, 4 = kruunu ja hehku
function drawMoonFace(c) {
  var x = moonDoor.x - camX, y = viewH * 0.30, r = viewH * 0.15, n = moonTasksSolved();
  if (x < -r * 2 || x > viewW + r * 2) return;
  if (n >= 4) {
    var g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(255,245,200,' + (0.4 + Math.sin(globalT * 3) * 0.12) + ')');
    g.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r * 2.2, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = n >= 4 ? '#fff6c8' : '#e9e3c4';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(200,190,150,0.35)';
  c.beginPath(); c.arc(x - r * 0.45, y - r * 0.4, r * 0.14, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.55, y + r * 0.45, r * 0.1, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#6b5a3a';
  c.lineWidth = Math.max(2, r * 0.06);
  c.lineCap = 'round';
  // Silmät
  var e;
  for (e = -1; e <= 1; e += 2) {
    var ex = x + e * r * 0.35, ey = y - r * 0.12;
    var open = (e < 0 && n >= 1) || (e > 0 && n >= 2);
    if (open) {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex, ey, r * 0.13, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3a2a5a';
      c.beginPath(); c.arc(ex + r * 0.02, ey + r * 0.02, r * 0.07, 0, Math.PI * 2); c.fill();
    } else {
      c.beginPath(); c.arc(ex, ey - r * 0.02, r * 0.13, 0.15, Math.PI - 0.15); c.stroke();
    }
  }
  // Suu
  c.beginPath();
  if (n >= 3) c.arc(x, y + r * 0.22, r * 0.3, 0.2, Math.PI - 0.2);
  else { c.moveTo(x - r * 0.2, y + r * 0.35); c.lineTo(x + r * 0.2, y + r * 0.35); }
  c.stroke();
  // Kruunu
  if (n >= 4) {
    c.fillStyle = '#ffd24f';
    c.beginPath();
    c.moveTo(x - r * 0.45, y - r * 0.85); c.lineTo(x - r * 0.45, y - r * 1.2); c.lineTo(x - r * 0.22, y - r * 1.0);
    c.lineTo(x, y - r * 1.3); c.lineTo(x + r * 0.22, y - r * 1.0); c.lineTo(x + r * 0.45, y - r * 1.2); c.lineTo(x + r * 0.45, y - r * 0.85);
    c.closePath(); c.fill();
  }
  // Zzz kun nukkuu
  if (n === 0) {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.font = Math.round(r * 0.3) + 'px sans-serif';
    c.fillText('z', x + r * 0.8, y - r * 0.7 - Math.sin(globalT * 2) * r * 0.05);
    c.fillText('z', x + r * 1.0, y - r * 0.95 - Math.sin(globalT * 2 + 1) * r * 0.05);
  }
}

function drawMeteor(c, m) {
  var x = m.x - camX;
  if (x < -viewH * 0.2 || x > viewW + viewH * 0.2) return;
  if (m.state === 'warn') {
    var a = 0.35 + Math.sin(globalT * 14) * 0.25;
    c.fillStyle = 'rgba(255,230,120,' + Math.max(0, a) + ')';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, groundTop, viewH * 0.06, viewH * 0.018, 0, 0, Math.PI * 2);
    else c.arc(x, groundTop, viewH * 0.04, 0, Math.PI * 2);
    c.fill();
    return;
  }
  c.strokeStyle = 'rgba(255,240,180,0.5)';
  c.lineWidth = Math.max(2, viewH * 0.01);
  c.beginPath(); c.moveTo(x, m.y - viewH * 0.16); c.lineTo(x, m.y - viewH * 0.03); c.stroke();
  drawStar(c, x, m.y, viewH * 0.03, globalT * 4, 0.9);
}

function drawMoonDoorGlow(c) {
  var x = moonDoor.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = moonDoor.open ? 'rgba(255,245,200,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')' : 'rgba(10,10,40,0.85)';
  c.beginPath(); c.arc(x, groundTop - s * 1.7, s * 0.52, Math.PI, 0); c.lineTo(x + s * 0.52, groundTop); c.lineTo(x - s * 0.52, groundTop); c.closePath(); c.fill();
  if (moonDoor.open) drawStar(c, x, groundTop - s * 2.9, h * 0.035, globalT, 1);
}

function drawMoon() {
  var i;
  if (!drawWorldBg()) return;
  drawMoonFace(ctx);
  drawMoonDoorGlow(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < moonStones.length; i++) {
    if (moonStones[i].collected) continue;
    drawMoonStone(ctx, moonStones[i].ax - camX, moonStones[i].ay + Math.sin(moonStones[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  for (i = 0; i < meteors.length; i++) if (meteors[i].state === 'warn') drawMeteor(ctx, meteors[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < meteors.length; i++) if (meteors[i].state === 'fall') drawMeteor(ctx, meteors[i]);
  drawParticlesLayer(ctx);
  if (moonDoor.open && !celebrating) drawEdgeArrow(ctx, moonDoor.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, MSTONE_COUNT, function (i2) { return moonStones[i2] && moonStones[i2].collected; },
    function (c, x, y, s) { drawMoonStone(c, x, y, s * 0.8); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
