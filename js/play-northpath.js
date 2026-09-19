'use strict';

// Tunturipolku: selkään päin. Tie nousee itse; pidä sormea ohjataksesi
// vasemmalle ja oikealle. Kerää kahdeksan valoa, väistä kiviä.
// Sydämet ja kaksi välitehtävää.

var NP_LIGHTS = 8;
var np = { x: 0, climb: 0, len: 0, cp: 0, walk: 0 };
var npLights = [];
var npRocks = [];
var npPeak = { ready: false };
var npLightDefs = [
  { f: 0.10, lane: 0 }, { f: 0.18, lane: 2 }, { f: 0.28, lane: 1 }, { f: 0.40, lane: 0 },
  { f: 0.52, lane: 2 }, { f: 0.64, lane: 1 }, { f: 0.76, lane: 0 }, { f: 0.88, lane: 2 }
];
var npRockDefs = [
  { f: 0.16, lane: 1 }, { f: 0.34, lane: 2 }, { f: 0.46, lane: 0 },
  { f: 0.58, lane: 1 }, { f: 0.70, lane: 2 }, { f: 0.82, lane: 1 }
];
var NP_TASK_AT = [0.30, 0.62];

function npLen() { return viewH * 4.4; }
function npLaneX(lane) { return viewW * (0.22 + lane * 0.28); }
function npWorldY(f) { return f * np.len; }
function npScreenY(wy) { return viewH * 0.78 - (wy - np.climb); }

function initNorthpath() {
  var i;
  np.len = npLen();
  np.climb = 0;
  np.cp = 0;
  np.x = viewW * 0.5;
  np.walk = 0;
  npPeak.ready = false;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  npLights = [];
  for (i = 0; i < NP_LIGHTS; i++) {
    npLights.push({
      f: npLightDefs[i].f, lane: npLightDefs[i].lane,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  npRocks = [];
  for (i = 0; i < npRockDefs.length; i++) {
    npRocks.push({ f: npRockDefs[i].f, lane: npRockDefs[i].lane, t: i * 0.8 });
  }
  princess.x = np.x;
  princess.y = viewH * 0.78;
  camX = 0;
  checkpoint.x = np.x;
  checkpoint.y = 0;
  renderBackground();
  playNote(392, 0, 0.22, 'sine', 0.3);
  playNote(523, 0.12, 0.28, 'triangle', 0.3);
}

function respawnNorthpath() {
  np.climb = np.cp;
  np.x = viewW * 0.5;
  spawnSparkles(np.x, viewH * 0.78, 12, '#c8f0ff');
}

function resizeNorthpath() {
  np.len = npLen();
  np.x = Math.min(Math.max(np.x, viewW * 0.16), viewW * 0.84);
}

function handleNorthpathTap() {}

function npCollect(g) {
  g.collected = true;
  registerCollected(g);
  spawnSparkles(npLaneX(g.lane), npScreenY(npWorldY(g.f)), 12, '#7cffc4');
  soundStar(countCollected(npLights));
  if (countCollected(npLights) === NP_LIGHTS) npPeak.ready = true;
}

function npPlaceAhead(g) {
  g.f = Math.min(0.96, (np.climb + viewH * (0.7 + Math.random() * 0.35)) / np.len);
  g.lane = randInt(3);
}

function updateNorthpath(dt) {
  var i, g, sy, sx, dx, dy, busy, wantX, rr;
  updateTasks(dt);
  busy = puzzleBusy();
  np.walk += dt * (busy ? 2 : 10);
  if (!busy && !celebrating) {
    np.climb = Math.min(np.len, np.climb + viewH * 0.20 * dt);
    if (holding) {
      wantX = lastPX;
      np.x += ((wantX > np.x ? 1 : -1) * viewW * 0.42) * dt;
    }
    np.x = Math.min(Math.max(np.x, viewW * 0.16), viewW * 0.84);
    if (np.climb > np.len * 0.36 && np.cp < np.len * 0.36) np.cp = np.len * 0.36;
    if (np.climb > np.len * 0.68 && np.cp < np.len * 0.68) np.cp = np.len * 0.68;
    for (i = 0; i < NP_TASK_AT.length; i++) {
      if (!tasks[i].opened && np.climb > NP_TASK_AT[i] * np.len && !activeTask) taskStart(tasks[i]);
    }
  }
  princess.x = np.x;
  princess.y = viewH * 0.78;
  for (i = 0; i < npLights.length; i++) {
    g = npLights[i];
    g.phase += dt * 2;
    if (g.collected) continue;
    sy = npScreenY(npWorldY(g.f));
    sx = npLaneX(g.lane);
    if (sy > viewH * 0.96 && !busy) npPlaceAhead(g);
    dx = sx - np.x; dy = sy - viewH * 0.72;
    if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) npCollect(g);
  }
  for (i = 0; i < npRocks.length; i++) {
    npRocks[i].t += dt;
    sy = npScreenY(npWorldY(npRocks[i].f) + Math.sin(npRocks[i].t) * viewH * 0.02);
    sx = npLaneX(npRocks[i].lane);
    dx = sx - np.x; dy = sy - viewH * 0.74;
    rr = viewH * 0.055;
    if (!busy && !celebrating && dx * dx + dy * dy < rr * rr) {
      if (loseHeart()) {
        np.x += (np.x < sx ? -1 : 1) * viewW * 0.08;
        spawnSparkles(np.x, viewH * 0.76, 8, '#c8d0e0');
      }
    }
  }
  if (npPeak.ready && !celebrating && np.climb >= np.len - viewH * 0.08) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function northpathLayers() {
  return [
    { speed: 0.22, render: renderNorthpathFar },
    { speed: 0.55, render: renderNorthpathMid },
    { speed: 1, render: renderNorthpathNear }
  ];
}
function renderNorthpathBg(b, w, h) {
  renderNorthpathFar(b, w, h); renderNorthpathMid(b, w, h); renderNorthpathNear(b, w, h);
}
function renderNorthpathFar(b, w, h) { renderNorthSky(b, w, h); }
function renderNorthpathMid(b, w, h) { renderNorthHills(b, w, h); }
function renderNorthpathNear(b, w, h) {
  renderNorthGround(b, w, h);
}

function drawNorthpath() {
  var i, g, sy, sx, us, y, step;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, np.climb * 0.2);
  ctx.fillStyle = 'rgba(236,246,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(viewW * 0.28, viewH);
  ctx.lineTo(viewW * 0.38, 0);
  ctx.lineTo(viewW * 0.62, 0);
  ctx.lineTo(viewW * 0.72, viewH);
  ctx.closePath();
  ctx.fill();
  step = viewH * 0.16;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (i = 0; i < 12; i++) {
    y = ((i * step) - (np.climb * 0.85) % step);
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(viewW * 0.5, y, viewW * 0.04, viewH * 0.012, 0, 0, Math.PI * 2);
    else ctx.arc(viewW * 0.5, y, viewH * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  for (i = 0; i < 8; i++) {
    y = ((i * viewH * 0.28) - (np.climb * 0.7) % (viewH * 0.28));
    drawNorthPine(ctx, viewW * (i % 2 ? 0.08 : 0.92), y + viewH * 0.1, viewH * 0.16, '#1a3850');
  }
  for (i = 0; i < npLights.length; i++) {
    g = npLights[i];
    if (g.collected) continue;
    sy = npScreenY(npWorldY(g.f)) + Math.sin(g.phase) * 4;
    sx = npLaneX(g.lane);
    if (sy < -viewH * 0.08 || sy > viewH * 1.08) continue;
    drawStar(ctx, sx, sy, viewH * 0.026, g.phase, 0.8);
  }
  for (i = 0; i < npRocks.length; i++) {
    sy = npScreenY(npWorldY(npRocks[i].f) + Math.sin(npRocks[i].t) * viewH * 0.02);
    sx = npLaneX(npRocks[i].lane);
    if (sy < -viewH * 0.1 || sy > viewH * 1.1) continue;
    drawNorthRock(ctx, sx, sy, viewH * 0.05);
  }
  if (np.climb > np.len - viewH * 0.7) {
    drawNorthGate(ctx, viewW * 0.5, npScreenY(np.len) + viewH * 0.12, viewH * 0.16, npPeak.ready);
  }
  us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicornBack(ctx, np.x, viewH * 0.78, us * 1.55, np.walk, !puzzleBusy() && !celebrating, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, NP_LIGHTS, function (k) { return npLights[k] && npLights[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
