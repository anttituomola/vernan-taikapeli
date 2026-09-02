'use strict';

// Kuutamotaivas: lennä sormea kohti, kerää kuut, väistä tuulenpuuskia.

function initSky() {
  var i, def;
  level = 5;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  tasks = [makeTask(0.28, 'memory'), makeTask(0.66, 'odd')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  moons = [];
  for (i = 0; i < skyDefs.length; i++) {
    def = skyDefs[i];
    moons.push({
      ax: def.fx * worldW,
      ay: groundTop - def.fy * viewH,
      by: groundTop - def.fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2
    });
  }
  gusts = [
    { x: worldW * 0.36, y: viewH * 0.4, t: 0, dir: 1 },
    { x: worldW * 0.74, y: viewH * 0.32, t: 1.2, dir: -1 }
  ];
  sheep.x = worldW * 0.55;
  sheep.y = viewH * 0.42;
  sheep.awake = false;
  sheep.flyT = 0;
  princess.x = viewW * 0.14;
  princess.y = groundTop - viewH * 0.18;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  document.body.style.background = '#140832';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.35);
  playNote(784, 0.14, 0.32, 'triangle', 0.35);
}

function collectMoon(m) {
  m.collected = true;
  spawnSparkles(m.ax, m.ay, 14, '#ffe9a0');
  playNote(784, 0, 0.18, 'sine', 0.4);
  playNote(1175, 0.08, 0.26, 'triangle', 0.3);
  if (countCollected(moons) === PICKUP_COUNT) startCelebration();
}

function updateSky(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);

  if (!celebrating && holding && !puzzleBusy()) {
    var tx = holdWorldX;
    var ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.55 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.7 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.28) princess.vx = viewW * 0.28;
  if (princess.vx < -viewW * 0.28) princess.vx = -viewW * 0.28;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;

  princess.x += princess.vx * dt;
  princess.y += princess.vy * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();

  if (!sheep.awake && Math.abs(princess.x - sheep.x) < viewH * 0.1 &&
      Math.abs(princess.y - sheep.y) < viewH * 0.1) {
    princess.x = sheep.x - viewH * 0.12 * (princess.x < sheep.x ? 1 : -1);
    princess.vx = 0;
  }
  if (sheep.awake) {
    sheep.flyT += dt;
    sheep.y -= viewH * 0.12 * dt;
  }

  for (i = 0; i < gusts.length; i++) {
    gusts[i].t += dt;
    if (!celebrating && Math.abs(princess.x - gusts[i].x) < viewW * 0.1) {
      princess.vx += gusts[i].dir * viewW * 0.22 * dt * (0.6 + Math.sin(gusts[i].t * 3) * 0.4);
    }
  }

  for (i = 0; i < moons.length; i++) {
    var m = moons[i];
    if (m.collected) continue;
    m.phase += dt * 2;
    m.ay = m.by + Math.sin(m.phase) * viewH * 0.018;
    var mx = m.ax + Math.sin(m.phase * 0.7) * viewW * 0.01;
    var dx = mx - princess.x, dy = m.ay - princess.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectMoon(m);
  }

  followCam(princess.x, dt);
  princess.walkPhase += dt * 6;
  updateParticles(dt);
  if (Math.random() < dt * 6) {
    spawnSparkles(princess.x - princess.facing * 20, princess.y, 1, '#d9b3ff');
  }
  if (celebrating) {
    celebrateT += dt;
    for (i = 0; i < confetti.length; i++) {
      confetti[i].y += confetti[i].vy * dt;
      confetti[i].x += confetti[i].vx * dt;
      confetti[i].rot += confetti[i].vr * dt;
    }
  }
}

function handleSkyTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < moons.length; i++) {
    if (moons[i].collected) continue;
    dx = wx - moons[i].ax;
    dy = py - moons[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
      collectMoon(moons[i]);
      return;
    }
  }
  if (!sheep.awake) {
    dx = wx - sheep.x;
    dy = py - sheep.y;
    if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
      sheep.awake = true;
      spawnSparkles(sheep.x, sheep.y, 12, '#fff6c8');
      playNote(392, 0, 0.2, 'triangle', 0.3);
    }
  }
}

function drawMoonGem(c, x, y, r) {
  c.fillStyle = '#ffe9a0';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#140832';
  c.beginPath(); c.arc(x + r * 0.35, y - r * 0.1, r * 0.78, 0, Math.PI * 2); c.fill();
}

function drawSheep(c) {
  var x = sheep.x - camX, y = sheep.y, s = viewH * 0.055;
  c.save();
  c.translate(x, y);
  c.fillStyle = '#fff8ee';
  cloudShape(c, 0, 0, s * 0.45);
  c.fillStyle = '#333';
  c.beginPath(); c.arc(-s * 0.15, 0, s * 0.08, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.2, 0, s * 0.08, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawSky() {
  var i, hs, pad;
  if (!drawWorldBg()) return;
  for (i = 0; i < gusts.length; i++) {
    ctx.globalAlpha = 0.25 + Math.sin(gusts[i].t * 3) * 0.12;
    ctx.strokeStyle = '#c9e7ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gusts[i].x - camX - 30, gusts[i].y);
    ctx.bezierCurveTo(gusts[i].x - camX, gusts[i].y - 20, gusts[i].x - camX + 10, gusts[i].y + 20, gusts[i].x - camX + 40, gusts[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (!sheep.awake || sheep.y > -40) drawSheep(ctx);
  for (i = 0; i < moons.length; i++) {
    if (moons[i].collected) continue;
    drawMoonGem(ctx, moons[i].ax - camX, moons[i].ay, viewH * 0.03);
  }
  drawPrincessFree(
    ctx, princess.x - camX, princess.y,
    viewH / 520, princess.facing, princess.walkPhase, true, globalT
  );
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  drawCelebrateLayer();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = moons[i] && moons[i].collected ? 1 : 0.25;
    drawMoonGem(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.9);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
