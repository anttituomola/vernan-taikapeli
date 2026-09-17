'use strict';

// Unikello: kiireetön ratsastus iltahämärässä. Unikuut kerätään sormella
// tai ohitse ratsastaen ja viedään nukkumaan. Tehtävät: kello ja lue sana.

var BD_COUNT = 8;
var bdMoons = [];
var bdBed = { fx: 0.95, x: 0, ready: false };
var bdDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];

function bdPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initBedtime() {
  var i;
  tasks = [makeTask(0.34, 'clock'), makeTask(0.68, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  bdMoons = [];
  for (i = 0; i < BD_COUNT; i++) {
    bdMoons.push({
      ax: bdDefs[i].fx * worldW, ay: groundTop - bdDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  bdBed.x = bdBed.fx * worldW;
  bdBed.ready = false;
  unicorn.speed = 250;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = bdPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(523, 0.16, 0.35, 'triangle', 0.3);
}

function respawnBedtime() {}

function resizeBedtime(ratio) {
  var i;
  for (i = 0; i < bdMoons.length; i++) {
    bdMoons[i].ax = bdDefs[i].fx * worldW;
    bdMoons[i].ay = groundTop - bdDefs[i].fy * viewH;
  }
  bdBed.x = bdBed.fx * worldW;
}

function collectBedtime(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#ffe9a0');
  playNote(520 + countCollected(bdMoons) * 40, 0, 0.28, 'sine', 0.35);
  playNote(780 + countCollected(bdMoons) * 40, 0.1, 0.32, 'triangle', 0.28);
  if (countCollected(bdMoons) === BD_COUNT && !bdBed.ready) {
    bdBed.ready = true;
    playNote(392, 0.3, 0.35, 'triangle', 0.35);
    playNote(523, 0.48, 0.4, 'triangle', 0.35);
    playNote(659, 0.66, 0.5, 'sine', 0.35);
  }
}

function handleBedtimeTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < bdMoons.length; i++) {
    var it = bdMoons[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectBedtime(it);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateBedtime(dt) {
  var i, dx, dy, dist, step;
  updateTasks(dt);
  var busy = puzzleBusy();

  dx = unicorn.tx - unicorn.x;
  dy = unicorn.ty - unicorn.y;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !busy) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 9;
    if (Math.random() < dt * 6) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#c8d4ff');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < bdMoons.length; i++) {
    var it = bdMoons[i];
    it.phase += dt * 1.6;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectBedtime(it);
    }
  }

  if (bdBed.ready && !celebrating && Math.abs(unicorn.x - bdBed.x) < viewW * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

function bedtimeLayers() {
  return [
    { speed: 0.22, render: renderBedtimeFar },
    { speed: 0.55, render: renderBedtimeMid },
    { speed: 1, render: renderBedtimeNear }
  ];
}
function renderBedtimeBg(b, w, h) {
  renderBedtimeFar(b, w, h);
  renderBedtimeMid(b, w, h);
  renderBedtimeNear(b, w, h);
}
function renderBedtimeFar(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#1a1448');
  sky.addColorStop(0.55, '#3a2a78');
  sky.addColorStop(1, '#6a4a98');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 18; i++) {
    x = w * ((i * 0.17 + 0.05) % 1);
    drawStar(b, x, h * (0.08 + (i % 5) * 0.07), h * 0.008, i, 0.4);
  }
  b.fillStyle = '#fff1a8';
  b.beginPath(); b.arc(w * 0.82, h * 0.16, h * 0.055, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#3a2a78';
  b.beginPath(); b.arc(w * 0.845, h * 0.14, h * 0.042, 0, Math.PI * 2); b.fill();
  fillHillBand(b, w, h, horizon, '#4a3a70', function (px) {
    return horizon - h * 0.08 - Math.sin(px * 0.002 + 0.4) * h * 0.05;
  });
}
function renderBedtimeMid(b, w, h) { meadowMid(b, w, h, '#5a4a80'); }
function renderBedtimeNear(b, w, h) {
  var i, x;
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#6a5a90');
  ground.addColorStop(1, '#3a2a58');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(200,180,255,0.18)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  for (i = 0; i < 7; i++) {
    x = w * (0.06 + i * 0.14);
    drawBush(b, x, groundTop - h * 0.01, h * 0.07);
  }
  bdDrawBed(b, bdBed.x, groundTop, h * 0.1);
}

function bdDrawBed(b, x, baseY, s) {
  b.fillStyle = '#8a6a4a';
  b.fillRect(x - s * 0.95, baseY - s * 0.55, s * 1.9, s * 0.4);
  b.fillStyle = '#f4e8ff';
  roundRect(b, x - s * 0.85, baseY - s * 0.72, s * 1.5, s * 0.28, s * 0.08);
  b.fill();
  b.fillStyle = '#c9b8f0';
  roundRect(b, x + s * 0.45, baseY - s * 1.15, s * 0.42, s * 0.7, s * 0.12);
  b.fill();
  b.fillStyle = '#ffe9a0';
  b.beginPath(); b.arc(x - s * 0.55, baseY - s * 0.9, s * 0.16, 0, Math.PI * 2); b.fill();
}

function bdDrawMoon(c, x, y, s) {
  var g = c.createRadialGradient(x, y, s * 0.2, x, y, s * 1.6);
  g.addColorStop(0, 'rgba(255,240,170,0.7)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, s * 1.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff1a8';
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6a4a98';
  c.beginPath(); c.arc(x + s * 0.38, y - s * 0.12, s * 0.78, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.font = 'bold ' + Math.round(s * 0.7) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('Z', x + s * 0.85, y - s * 0.7);
  c.textBaseline = 'alphabetic';
}

function drawBedtime() {
  var i;
  if (!beginPlayWorld()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (bdBed.ready) {
    var bx = bdBed.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.08, viewH * 0.01, bx, groundTop - viewH * 0.08, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,230,160,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.08, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < bdMoons.length; i++) {
    if (bdMoons[i].collected) continue;
    var my = bdMoons[i].ay + Math.sin(bdMoons[i].phase) * viewH * 0.012;
    bdDrawMoon(ctx, bdMoons[i].ax - camX, my, viewH * 0.028);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (bdBed.ready && !celebrating) drawEdgeArrow(ctx, bdBed.x);
  endPlayWorld();
  drawPickupHud(ctx, BD_COUNT, function (i2) { return bdMoons[i2] && bdMoons[i2].collected; },
    function (c, x, y, s) { bdDrawMoon(c, x, y, s); });
  drawTaskOverlay(ctx);
}
