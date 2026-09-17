'use strict';

// Tähtisana: kiireetön ratsastus kuutamossa. Kirjaintähdet kerätään sormella
// tai ohitse ratsastaen. Portti hehkuu, kun tähdet on koossa.
// Tehtävät: lue sana ja kuva→sana.

var MW_COUNT = 8;
var MW_LETTERS = ['A', 'I', 'O', 'U', 'E', 'S', 'K', 'M'];
var mwStars = [];
var mwGate = { fx: 0.95, x: 0, ready: false };
var mwDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];

function mwPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initMoonword() {
  var i;
  tasks = [makeTask(0.32, 'word', { maxSyl: 3 }), makeTask(0.66, 'wordpick', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  mwStars = [];
  for (i = 0; i < MW_COUNT; i++) {
    mwStars.push({
      ax: mwDefs[i].fx * worldW, ay: groundTop - mwDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      ch: MW_LETTERS[i]
    });
  }
  mwGate.x = mwGate.fx * worldW;
  mwGate.ready = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = mwPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(494, 0, 0.28, 'sine', 0.32);
  playNote(659, 0.14, 0.32, 'triangle', 0.3);
}

function respawnMoonword() {}

function resizeMoonword(ratio) {
  var i;
  for (i = 0; i < mwStars.length; i++) {
    mwStars[i].ax = mwDefs[i].fx * worldW;
    mwStars[i].ay = groundTop - mwDefs[i].fy * viewH;
  }
  mwGate.x = mwGate.fx * worldW;
}

function collectMoonword(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#ffe27a');
  playNote(700 + countCollected(mwStars) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(mwStars) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(mwStars) === MW_COUNT && !mwGate.ready) {
    mwGate.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleMoonwordTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < mwStars.length; i++) {
    var it = mwStars[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectMoonword(it);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateMoonword(dt) {
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
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#c8d4ff');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < mwStars.length; i++) {
    var it = mwStars[i];
    it.phase += dt * 2;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectMoonword(it);
    }
  }

  if (mwGate.ready && !celebrating && Math.abs(unicorn.x - mwGate.x) < viewW * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

function moonwordLayers() {
  return [
    { speed: 0.22, render: renderMoonwordFar },
    { speed: 0.55, render: renderMoonwordMid },
    { speed: 1, render: renderMoonwordNear }
  ];
}
function renderMoonwordBg(b, w, h) {
  renderMoonwordFar(b, w, h);
  renderMoonwordMid(b, w, h);
  renderMoonwordNear(b, w, h);
}
function renderMoonwordFar(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(0.55, '#1a2460');
  sky.addColorStop(1, '#3b3f8c');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 22; i++) {
    x = w * ((i * 0.13 + 0.04) % 1);
    drawStar(b, x, h * (0.06 + (i % 6) * 0.06), h * (0.006 + (i % 3) * 0.004), i * 0.7, 0.5);
  }
  b.fillStyle = '#fff6c8';
  b.beginPath(); b.arc(w * 0.16, h * 0.14, h * 0.05, 0, Math.PI * 2); b.fill();
  fillHillBand(b, w, h, horizon, '#243868', function (px) {
    return horizon - h * 0.09 - Math.sin(px * 0.002 + 0.4) * h * 0.05;
  });
}
function renderMoonwordMid(b, w, h) {
  var i, x;
  meadowMid(b, w, h, '#2a3a68');
  for (i = 0; i < 8; i++) {
    x = w * (0.05 + i * 0.12);
    drawPine(b, x, groundTop - h * 0.02, h * (0.16 + (i % 3) * 0.04), i % 2 ? '#16204a' : '#1a2a58');
  }
}
function renderMoonwordNear(b, w, h) {
  var i, x;
  var path = b.createLinearGradient(0, groundTop, 0, h);
  path.addColorStop(0, '#31507a');
  path.addColorStop(1, '#2a4468');
  b.fillStyle = path;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(180,210,255,0.18)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  for (i = 0; i < 6; i++) {
    x = w * (0.08 + i * 0.16);
    drawPine(b, x, groundTop - h * 0.01, h * 0.16, i % 2 ? '#1a2a58' : '#243868');
  }
  mwDrawGate(b, mwGate.x, groundTop, h * 0.12);
}

function mwDrawGate(b, x, baseY, s) {
  b.fillStyle = '#4a4470';
  b.fillRect(x - s * 0.75, baseY - s * 1.6, s * 0.25, s * 1.6);
  b.fillRect(x + s * 0.5, baseY - s * 1.6, s * 0.25, s * 1.6);
  b.beginPath();
  b.arc(x, baseY - s * 1.6, s * 0.75, Math.PI, 0);
  b.lineTo(x + s * 0.5, baseY - s * 1.6);
  b.arc(x, baseY - s * 1.6, s * 0.5, 0, Math.PI, true);
  b.closePath();
  b.fill();
  b.fillStyle = '#ffe27a';
  b.font = 'bold ' + Math.round(s * 0.45) + 'px ' + UI_FONT;
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  b.fillText('A', x, baseY - s * 0.7);
}

function mwDrawLetterStar(c, x, y, s, ch) {
  drawStar(c, x, y, s, globalT * 0.4, 0.85);
  c.fillStyle = '#3a2460';
  c.font = 'bold ' + Math.round(s * 0.85) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, x, y + s * 0.08);
}

function drawMoonword() {
  var i;
  if (!beginPlayWorld()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (mwGate.ready) {
    var bx = mwGate.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.12, viewH * 0.01, bx, groundTop - viewH * 0.12, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,230,140,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.12, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < mwStars.length; i++) {
    if (mwStars[i].collected) continue;
    var sy = mwStars[i].ay + Math.sin(mwStars[i].phase) * viewH * 0.012;
    mwDrawLetterStar(ctx, mwStars[i].ax - camX, sy, viewH * 0.032, mwStars[i].ch);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (mwGate.ready && !celebrating) drawEdgeArrow(ctx, mwGate.x);
  endPlayWorld();
  drawPickupHud(ctx, MW_COUNT, function (i2) { return mwStars[i2] && mwStars[i2].collected; },
    function (c, x, y, s) { mwDrawLetterStar(c, x, y, s, 'A'); });
  drawTaskOverlay(ctx);
}
