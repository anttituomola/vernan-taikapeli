'use strict';

// Karkkikello: kiireetön ratsastus karkkileipomossa. Piparkakkukellot
// kerätään sormella tai ohitse ratsastaen. Uuni hehkuu, kun kaikki on koossa.
// Tehtävät: kello (myös puoli- ja varttitunnit) ja lue sana.

var SC_COUNT = 8;
var scClocks = [];
var scOven = { fx: 0.95, x: 0, ready: false };
var scDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];

function scPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initSweetclock() {
  var i;
  tasks = [makeTask(0.34, 'clock'), makeTask(0.68, 'word', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  scClocks = [];
  for (i = 0; i < SC_COUNT; i++) {
    scClocks.push({
      ax: scDefs[i].fx * worldW, ay: groundTop - scDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      hour: 1 + (i * 5 + 3) % 12, minute: (i % 2) * 30
    });
  }
  scOven.x = scOven.fx * worldW;
  scOven.ready = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = scPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnSweetclock() {}

function resizeSweetclock(ratio) {
  var i;
  for (i = 0; i < scClocks.length; i++) {
    scClocks[i].ax = scDefs[i].fx * worldW;
    scClocks[i].ay = groundTop - scDefs[i].fy * viewH;
  }
  scOven.x = scOven.fx * worldW;
}

function collectSweetclock(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#e0a060');
  playNote(660 + countCollected(scClocks) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(scClocks) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(scClocks) === SC_COUNT && !scOven.ready) {
    scOven.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleSweetclockTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < scClocks.length; i++) {
    var it = scClocks[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectSweetclock(it);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateSweetclock(dt) {
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
    unicorn.walkPhase += dt * 10;
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#fff3c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < scClocks.length; i++) {
    var it = scClocks[i];
    it.phase += dt * 2;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectSweetclock(it);
    }
  }

  if (scOven.ready && !celebrating && Math.abs(unicorn.x - scOven.x) < viewW * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

function sweetclockLayers() {
  return [
    { speed: 0.22, render: renderSweetclockFar },
    { speed: 0.55, render: renderSweetclockMid },
    { speed: 1, render: renderSweetclockNear }
  ];
}
function renderSweetclockBg(b, w, h) {
  renderSweetclockFar(b, w, h);
  renderSweetclockMid(b, w, h);
  renderSweetclockNear(b, w, h);
}
function renderSweetclockFar(b, w, h) { meadowFar(b, w, h, '#ffb8d4', '#ffe4f0', '#f0c8a0'); }
function renderSweetclockMid(b, w, h) { meadowMid(b, w, h, '#f0b878'); }
function renderSweetclockNear(b, w, h) {
  var i, x;
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#f2d4a8');
  ground.addColorStop(1, '#d9a06a');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,220,0.45)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  for (i = 0; i < 6; i++) {
    x = w * (0.10 + i * 0.16) + (i % 2) * h * 0.03;
    scDrawCookieTree(b, x, groundTop - h * 0.01, h * 0.14);
  }
  for (i = 0; i < 28; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#ff9f3a'][i % 4]);
  }
  scDrawOven(b, scOven.x, groundTop, h * 0.11);
}

function scDrawCookieTree(b, x, baseY, s) {
  b.fillStyle = '#8a5a30';
  b.fillRect(x - s * 0.06, baseY - s * 0.55, s * 0.12, s * 0.55);
  b.fillStyle = '#e0a060';
  b.beginPath(); b.arc(x, baseY - s * 0.72, s * 0.38, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#c47a3a';
  b.beginPath(); b.arc(x - s * 0.12, baseY - s * 0.78, s * 0.06, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + s * 0.14, baseY - s * 0.66, s * 0.05, 0, Math.PI * 2); b.fill();
}

function scDrawOven(b, x, baseY, s) {
  b.fillStyle = '#8a5a3a';
  roundRect(b, x - s, baseY - s * 1.6, s * 2, s * 1.6, s * 0.12);
  b.fill();
  b.fillStyle = '#5a3a20';
  roundRect(b, x - s * 0.7, baseY - s * 1.15, s * 1.4, s * 0.7, s * 0.08);
  b.fill();
  b.fillStyle = '#ff9f3a';
  b.globalAlpha = 0.85;
  roundRect(b, x - s * 0.55, baseY - s * 1.05, s * 1.1, s * 0.5, s * 0.06);
  b.fill();
  b.globalAlpha = 1;
  b.fillStyle = '#c98b4a';
  b.fillRect(x - s * 1.05, baseY - s * 1.72, s * 2.1, s * 0.16);
}

function scDrawCookieClock(c, x, y, s, hour, minute) {
  c.fillStyle = '#c47a3a';
  c.beginPath(); c.arc(x + s * 0.08, y + s * 0.1, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e8b878';
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#c47a3a';
  var i, a;
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3;
    c.beginPath(); c.arc(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.1, 0, Math.PI * 2); c.fill();
  }
  drawClockFace(c, x, y, s * 0.72, hour, minute);
}

function drawSweetclock() {
  var i;
  if (!beginPlayWorld()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (scOven.ready) {
    var bx = scOven.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.1, viewH * 0.01, bx, groundTop - viewH * 0.1, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,180,80,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.1, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < scClocks.length; i++) {
    if (scClocks[i].collected) continue;
    var cy = scClocks[i].ay + Math.sin(scClocks[i].phase) * viewH * 0.012;
    scDrawCookieClock(ctx, scClocks[i].ax - camX, cy, viewH * 0.032, scClocks[i].hour, scClocks[i].minute);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (scOven.ready && !celebrating) drawEdgeArrow(ctx, scOven.x);
  endPlayWorld();
  drawPickupHud(ctx, SC_COUNT, function (i2) { return scClocks[i2] && scClocks[i2].collected; },
    function (c, x, y, s) { scDrawCookieClock(c, x, y, s, 3, 0); });
  drawTaskOverlay(ctx);
}
