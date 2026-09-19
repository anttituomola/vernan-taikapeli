'use strict';

// Kelkkamäki: ruutu vierii itse. Ohjaa kelkkaa pidolla, lennä revontulirenkaiden
// läpi, väistä kiviä. Sydämet ja lyhdyt käytössä.

var SLED_RINGS = 8;
var sledRings = [];
var sledRocks = [];
var SLED_SPEEDS = [0.14, 0.17, 0.20];
var sledRingDefs = [
  { fx: 0.12, fy: 0.38 }, { fx: 0.22, fy: 0.22 }, { fx: 0.32, fy: 0.48 }, { fx: 0.44, fy: 0.28 },
  { fx: 0.56, fy: 0.44 }, { fx: 0.66, fy: 0.20 }, { fx: 0.78, fy: 0.40 }, { fx: 0.88, fy: 0.26 }
];

function sledSpeed() {
  var seg = camX / Math.max(1, worldW);
  var idx = seg < 0.34 ? 0 : (seg < 0.68 ? 1 : 2);
  return viewW * SLED_SPEEDS[idx];
}

function initSled() {
  var i;
  tasks = [makeTask(0.34, 'mirror'), makeTask(0.68, 'dots')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.36, 0.70]);
  sledRings = [];
  for (i = 0; i < SLED_RINGS; i++) {
    sledRings.push({
      ax: sledRingDefs[i].fx * worldW, ay: groundTop - sledRingDefs[i].fy * viewH,
      collected: false, returned: false, phase: Math.random() * Math.PI * 2,
      color: i % 2 ? '#7cffc4' : '#c9a0ff',
      onRestore: function (r) { r.ax = r.homeX; r.ay = r.homeY; }
    });
    sledRings[i].homeX = sledRings[i].ax;
    sledRings[i].homeY = sledRings[i].ay;
  }
  sledRocks = [];
  var tFx = [0.18, 0.38, 0.52, 0.64, 0.80];
  for (i = 0; i < tFx.length; i++) {
    sledRocks.push({
      fx: tFx[i], x: tFx[i] * worldW,
      baseY: viewH * (0.32 + (i % 3) * 0.12), y: 0,
      amp: viewH * 0.07, t: i * 1.1, f: 1.1 + (i % 3) * 0.25
    });
  }
  princess.x = viewW * 0.25;
  princess.y = groundTop - viewH * 0.28;
  princess.vx = 0; princess.vy = 0; princess.facing = 1;
  princess.onGround = false; princess.walkPhase = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(523, 0, 0.2, 'sine', 0.32);
  playNote(784, 0.14, 0.28, 'triangle', 0.32);
}

function respawnSled() {
  var i;
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.28;
  princess.vx = 0; princess.vy = 0;
  for (i = 0; i < sledRings.length; i++) {
    if (sledRings[i].homeX > checkpoint.x - viewW * 0.1 && !sledRings[i].collected) {
      sledRings[i].ax = sledRings[i].homeX;
      sledRings[i].ay = sledRings[i].homeY;
      sledRings[i].returned = false;
    }
  }
  spawnSparkles(princess.x, princess.y, 12, '#c8f0ff');
}

function resizeSled(ratio) {
  var i;
  princess.x *= ratio;
  for (i = 0; i < sledRings.length; i++) {
    sledRings[i].homeX = sledRingDefs[i].fx * worldW;
    sledRings[i].homeY = groundTop - sledRingDefs[i].fy * viewH;
    sledRings[i].ax = sledRings[i].homeX;
    sledRings[i].ay = sledRings[i].homeY;
  }
  for (i = 0; i < sledRocks.length; i++) sledRocks[i].x = sledRocks[i].fx * worldW;
}

function handleSledTap() {}

function sledCollect(r) {
  r.collected = true;
  registerCollected(r);
  spawnSparkles(r.ax, r.ay, 14, r.color);
  soundStar(countCollected(sledRings));
}

function sledMiss(r) {
  loseHeart();
  var ahead = camX + viewW * (1.1 + Math.random() * 0.2);
  r.ax = Math.min(ahead, worldW - viewW * 0.5);
  r.ay = groundTop - viewH * (0.18 + Math.random() * 0.32);
  r.returned = true;
}

function updateSled(dt) {
  var i, pw = viewH * 0.045, r, dx, dy, rr, busy, scrolling, maxCam;
  updateTasks(dt);
  busy = puzzleBusy();
  scrolling = !busy && !celebrating;
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x - princess.x < viewW * 0.3 && tasks[i].x > princess.x - viewW * 0.05) scrolling = false;
  }
  maxCam = Math.max(0, worldW - viewW);
  if (scrolling && camX < maxCam) camX = Math.min(maxCam, camX + sledSpeed() * dt);
  if (!celebrating && holding && !busy) {
    princess.vx += ((holdWorldX - princess.x) > 0 ? 1 : -1) * viewW * 0.55 * dt;
    princess.vy += ((lastPY - princess.y) > 0 ? 1 : -1) * viewH * 0.7 * dt;
    if (holdWorldX > princess.x + 8) princess.facing = 1;
    else if (holdWorldX < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.88 * dt;
  }
  princess.vx = Math.min(Math.max(princess.vx, -viewW * 0.3), viewW * 0.3);
  princess.vy = Math.min(Math.max(princess.vy, -viewH * 0.40), viewH * 0.72);
  if (!busy) { princess.x += princess.vx * dt; princess.y += princess.vy * dt; }
  princess.x = Math.min(Math.max(princess.x, camX + viewW * 0.08), camX + viewW * 0.7);
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  if (princess.y <= viewH * 0.12 && princess.vy < 0) princess.vy = 0;
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();
  princess.walkPhase += dt * 8;
  updateCheckpoints(princess.x, princess.y);
  for (i = 0; i < sledRings.length; i++) {
    r = sledRings[i];
    if (r.collected) continue;
    r.phase += dt * 2;
    rr = viewH * 0.07;
    dx = princess.x - r.ax; dy = princess.y - viewH * 0.05 - r.ay;
    if (Math.abs(dx) < rr * 0.7 && Math.abs(dy) < rr) { sledCollect(r); continue; }
    if (camX >= maxCam - 2) {
      if (r.ax < camX + viewW * 0.12 || r.ax > camX + viewW * 0.6) r.ax = camX + viewW * 0.3;
    } else if (r.ax < camX + viewW * 0.02 && !busy) sledMiss(r);
  }
  for (i = 0; i < sledRocks.length; i++) {
    sledRocks[i].t += dt;
    sledRocks[i].y = sledRocks[i].baseY + Math.sin(sledRocks[i].t * sledRocks[i].f) * sledRocks[i].amp;
    dx = princess.x - sledRocks[i].x; dy = princess.y - sledRocks[i].y;
    if (dx * dx + dy * dy < viewH * 0.055 * viewH * 0.055) {
      if (loseHeart()) spawnSparkles(princess.x, princess.y, 8, '#c8d0e0');
    }
  }
  if (!celebrating && camX >= maxCam - 2 && countCollected(sledRings) === SLED_RINGS) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function sledLayers() {
  return [
    { speed: 0.22, render: renderSledFar },
    { speed: 0.55, render: renderSledMid },
    { speed: 1, render: renderSledNear }
  ];
}
function renderSledBg(b, w, h) {
  renderSledFar(b, w, h); renderSledMid(b, w, h); renderSledNear(b, w, h);
}
function renderSledFar(b, w, h) { renderNorthSky(b, w, h); }
function renderSledMid(b, w, h) { renderNorthHills(b, w, h); }
function renderSledNear(b, w, h) { renderNorthGround(b, w, h); }

function drawSled() {
  var i, r, ry, us;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < sledRings.length; i++) {
    r = sledRings[i];
    if (r.collected) continue;
    ry = r.ay + Math.sin(r.phase) * viewH * 0.01;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = Math.max(3, viewH * 0.012);
    ctx.beginPath(); ctx.arc(r.ax - camX, ry, viewH * 0.055, 0, Math.PI * 2); ctx.stroke();
  }
  for (i = 0; i < sledRocks.length; i++) {
    ctx.fillStyle = '#6a8498';
    ctx.beginPath();
    ctx.arc(sledRocks[i].x - camX, sledRocks[i].y, viewH * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  us = viewH / 520;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#8a5a30';
  ctx.lineWidth = Math.max(3, us * 3);
  ctx.beginPath();
  ctx.moveTo(princess.x - camX - us * 18, princess.y + us * 4);
  ctx.quadraticCurveTo(princess.x - camX, princess.y + us * 10, princess.x - camX + us * 20, princess.y + us * 2);
  ctx.stroke();
  drawPrincessFree(ctx, princess.x - camX, princess.y, us, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, SLED_RINGS, function (k) { return sledRings[k] && sledRings[k].collected; },
    function (c, x, y, sz) { c.strokeStyle = '#7cffc4'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, sz * 0.4, 0, Math.PI * 2); c.stroke(); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
