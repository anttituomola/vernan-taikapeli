'use strict';

// Porolaakso: ratsastus. Kolme poroa seuraa; revontulipulssi pelästyttää
// ne kivien taa. Napauta piilossa olevaa poroa. Vie kaikki aitaukseen.
// Ei sydämiä.

var REIN_N = 3;
var reinDeer = [];
var reinRocks = [];
var reinPen = { fx: 0.94, x: 0 };
var reinPulseT = 4.2;
var reinRockDefs = [0.16, 0.30, 0.46, 0.60, 0.74, 0.86];
var reinStart = [{ fx: 0.10, fy: 0.28 }, { fx: 0.14, fy: 0.62 }, { fx: 0.18, fy: 0.45 }];

function reinPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initReindeer() {
  var i;
  tasks = [makeTask(0.36, 'give'), makeTask(0.68, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  reinRocks = [];
  for (i = 0; i < reinRockDefs.length; i++) {
    reinRocks.push({ x: reinRockDefs[i] * worldW, y: groundTop + viewH * 0.02 });
  }
  reinPen.x = reinPen.fx * worldW;
  reinDeer = [];
  for (i = 0; i < REIN_N; i++) {
    reinDeer.push({
      x: reinStart[i].fx * worldW, y: reinPathY(reinStart[i].fy),
      tx: 0, ty: 0, state: 'follow', hop: 0, rock: -1, facing: 1, idleT: 1 + i
    });
    reinDeer[i].tx = reinDeer[i].x;
    reinDeer[i].ty = reinDeer[i].y;
  }
  reinPulseT = 4.2;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.22;
  unicorn.y = unicorn.ty = reinPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(392, 0, 0.22, 'sine', 0.3);
  playNote(523, 0.12, 0.28, 'triangle', 0.3);
}

function respawnReindeer() {}

function resizeReindeer(ratio) {
  var i;
  for (i = 0; i < reinDeer.length; i++) { reinDeer[i].x *= ratio; reinDeer[i].tx *= ratio; }
  for (i = 0; i < reinRocks.length; i++) reinRocks[i].x = reinRockDefs[i] * worldW;
  reinPen.x = reinPen.fx * worldW;
}

function reinHomeCount() {
  var i, n = 0;
  for (i = 0; i < reinDeer.length; i++) if (reinDeer[i].state === 'home') n++;
  return n;
}

function reinNearestRock(x) {
  var i, best = 0, bd = 1e9, d;
  for (i = 0; i < reinRocks.length; i++) {
    d = Math.abs(reinRocks[i].x - x);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function reinScare(b) {
  b.state = 'hiding';
  b.rock = reinNearestRock(b.x + (Math.random() - 0.5) * viewW * 0.15);
  b.tx = reinRocks[b.rock].x;
  b.ty = groundTop + viewH * 0.03;
}

function handleReindeerTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, b, dx, dy;
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state !== 'hid') continue;
    dx = wx - b.x; dy = py - b.y;
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      b.state = 'follow';
      spawnSparkles(b.x, b.y, 8, '#ffe27a');
      playNote(660, 0, 0.12, 'sine', 0.3);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateReindeer(dt) {
  var i, b, dx, dy, dist, step, busy, spd;
  updateTasks(dt);
  busy = puzzleBusy();
  northRideUnicorn(dt, busy);
  if (!busy && !celebrating) {
    reinPulseT -= dt;
    if (reinPulseT <= 0) {
      reinPulseT = 5.2 + Math.random() * 1.4;
      spawnSparkles(unicorn.x, viewH * 0.2, 16, '#7cffc4');
      playNote(330, 0, 0.18, 'sine', 0.25);
      for (i = 0; i < reinDeer.length; i++) {
        b = reinDeer[i];
        if (b.state === 'follow' && Math.abs(b.x - unicorn.x) < viewW * 0.32) reinScare(b);
      }
    }
  }
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    b.hop += dt * 8;
    if (b.state === 'follow') {
      b.tx = Math.max(viewW * 0.08, unicorn.x - unicorn.facing * viewH * (0.14 + i * 0.09));
      b.ty = unicorn.y + (i - 1) * viewH * 0.03;
    } else if (b.state === 'free') {
      b.idleT -= dt;
      if (b.idleT <= 0) {
        b.tx = b.x + (Math.random() - 0.5) * viewW * 0.12;
        b.ty = reinPathY(0.2 + Math.random() * 0.6);
        b.idleT = 1.4 + Math.random();
      }
    }
    dx = b.tx - b.x; dy = b.ty - b.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    spd = b.state === 'hiding' ? viewW * 0.32 : viewW * 0.22;
    if (dist > 4) {
      step = Math.min(spd * dt, dist);
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
      if (Math.abs(dx) > 3) b.facing = dx > 0 ? 1 : -1;
    } else if (b.state === 'hiding') b.state = 'hid';
    if (b.state === 'follow' && Math.abs(b.x - reinPen.x) < viewH * 0.12 && Math.abs(unicorn.x - reinPen.x) < viewH * 0.16) {
      b.state = 'home';
      spawnSparkles(reinPen.x, groundTop, 10, '#ffe27a');
      playNote(784, 0, 0.2, 'triangle', 0.35);
    }
  }
  if (!celebrating && reinHomeCount() === REIN_N) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function reindeerLayers() {
  return [
    { speed: 0.22, render: renderReindeerFar },
    { speed: 0.55, render: renderReindeerMid },
    { speed: 1, render: renderReindeerNear }
  ];
}
function renderReindeerBg(b, w, h) {
  renderReindeerFar(b, w, h); renderReindeerMid(b, w, h); renderReindeerNear(b, w, h);
}
function renderReindeerFar(b, w, h) { renderNorthSky(b, w, h); }
function renderReindeerMid(b, w, h) {
  var i;
  renderNorthHills(b, w, h);
  for (i = 0; i < 6; i++) drawPine(b, w * (0.07 + i * 0.16), groundTop - h * 0.01, h * 0.15, '#1a3850');
}
function renderReindeerNear(b, w, h) {
  var i, x;
  renderNorthGround(b, w, h);
  for (i = 0; i < reinRockDefs.length; i++) {
    x = reinRockDefs[i] * w;
    b.fillStyle = '#6a8498';
    b.beginPath();
    b.moveTo(x - h * 0.05, groundTop + h * 0.04);
    b.lineTo(x - h * 0.02, groundTop - h * 0.04);
    b.lineTo(x + h * 0.04, groundTop + h * 0.04);
    b.closePath(); b.fill();
  }
  b.strokeStyle = '#8a5a30';
  b.lineWidth = h * 0.012;
  b.strokeRect(reinPen.x - h * 0.1, groundTop - h * 0.12, h * 0.2, h * 0.18);
}

function drawNorthDeer(c, x, y, s, facing, hop) {
  c.save();
  c.translate(x, y + Math.sin(hop) * s * 0.08);
  c.scale(facing, 1);
  artShadow(c, 0, s * 0.2, s * 1.1, s * 0.25, 0.18);
  artBlob(c, 0, -s * 0.15, s * 0.7, s * 0.35, '#8a5a30', { hi: 0.25 });
  artCircle(c, s * 0.55, -s * 0.35, s * 0.22, '#8a5a30', {});
  c.strokeStyle = '#5a3a18';
  c.lineWidth = Math.max(2, s * 0.12);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(s * 0.5, -s * 0.5); c.lineTo(s * 0.2, -s * 0.95); c.lineTo(s * 0.05, -s * 1.05); c.stroke();
  c.beginPath(); c.moveTo(s * 0.62, -s * 0.5); c.lineTo(s * 0.85, -s * 0.95); c.lineTo(s * 1.0, -s * 1.05); c.stroke();
  c.lineCap = 'butt';
  artEye(c, s * 0.62, -s * 0.38, s * 0.07, 0.3, false);
  c.restore();
}

function drawReindeer() {
  var i, b, us;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < reinDeer.length; i++) {
    b = reinDeer[i];
    if (b.state === 'hid') ctx.globalAlpha = 0.4;
    drawNorthDeer(ctx, b.x - camX, b.y, viewH * 0.065, b.facing, b.hop);
    ctx.globalAlpha = 1;
  }
  us = viewH / 800;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (reinHomeCount() === REIN_N && !celebrating) drawEdgeArrow(ctx, reinPen.x);
  endPlayWorld();
  drawPickupHud(ctx, REIN_N, function (k) { return reinDeer[k] && reinDeer[k].state === 'home'; },
    function (c, x, y, sz) { drawNorthDeer(c, x, y + sz * 0.3, sz * 0.7, 1, 0); });
  drawTaskOverlay(ctx);
}
