'use strict';

// Jääpolku: liukas ratsastus, lumihiutaleet, kettu ja lumipallot.

function initIce() {
  var i, def;
  level = 3;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  tasks = [makeTask(0.30, 'math'), makeTask(0.68, 'memory')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  flakes = [];
  for (i = 0; i < iceDefs.length; i++) {
    def = iceDefs[i];
    flakes.push({
      ax: def.fx * worldW,
      ay: groundTop - def.fy * viewH,
      ox: 0, oy: 0, collected: false,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  snowballs = [
    { x: worldW * 0.40, y: -20, vy: viewH * 0.25, wait: 1.2 },
    { x: worldW * 0.78, y: -20, vy: viewH * 0.28, wait: 2.4 }
  ];
  fox.x = worldW * 0.52;
  fox.dir = 1;
  fox.bounceT = 0;
  fox.stillT = 0;
  fox.cooldown = 0;
  unicorn.speed = 300;
  unicorn.x = unicorn.tx = viewW * 0.12;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  document.body.style.background = '#3d6ea8';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(698, 0, 0.22, 'sine', 0.35);
  playNote(880, 0.12, 0.3, 'triangle', 0.35);
}

function handleIceTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy, d, hit = viewH * 0.07;
  for (i = 0; i < flakes.length; i++) {
    if (flakes[i].collected) continue;
    dx = wx - (flakes[i].ax + flakes[i].ox);
    dy = wy - (flakes[i].ay + flakes[i].oy);
    d = Math.sqrt(dx * dx + dy * dy);
    if (d < hit) {
      flakes[i].collected = true;
      spawnSparkles(flakes[i].ax, flakes[i].ay, 12, '#e8f6ff');
      playNote(920 + countCollected(flakes) * 40, 0, 0.25, 'sine', 0.4);
      if (countCollected(flakes) === PICKUP_COUNT) startCelebration();
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateIce(dt) {
  var i, dx, dy, dist, step;
  updateTasks(dt);

  dx = unicorn.tx - unicorn.x;
  dy = unicorn.ty - unicorn.y;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !puzzleBusy()) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * 1.05 * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 9;
    if (Math.random() < dt * 10) {
      spawnSparkles(unicorn.x - unicorn.facing * 30, unicorn.y + 8, 1, '#ffffff');
    }
  } else {
    unicorn.moving = false;
    unicorn.tx += (unicorn.x - unicorn.tx) * Math.min(1, dt * 1.4);
  }
  unicorn.x = Math.min(Math.max(unicorn.x, viewW * 0.04), worldW - viewW * 0.03);
  followCam(unicorn.x, dt);

  for (i = 0; i < flakes.length; i++) {
    var fl = flakes[i];
    if (fl.collected) continue;
    fl.twinkle += dt * 2.4;
    if (Math.abs(fl.ax - unicorn.x) < viewW * 0.14) {
      fl.ox += ((fl.ax - unicorn.x) >= 0 ? 1 : -1) * viewW * 0.05 * dt;
    } else {
      fl.ox *= Math.max(0, 1 - dt * 0.8);
    }
    fl.ox = Math.min(Math.max(fl.ox, -viewW * 0.1), viewW * 0.1);
    fl.oy = Math.sin(fl.twinkle) * viewH * 0.012;
  }

  fox.bounceT += dt * 6;
  fox.x += fox.dir * viewW * 0.04 * dt;
  if (fox.x < worldW * 0.44) { fox.x = worldW * 0.44; fox.dir = 1; }
  if (fox.x > worldW * 0.62) { fox.x = worldW * 0.62; fox.dir = -1; }
  if (fox.cooldown > 0) fox.cooldown -= dt;
  if (!celebrating && !puzzleBusy() && fox.cooldown <= 0 && Math.abs(unicorn.x - fox.x) < viewH * 0.08) {
    if (!unicorn.moving) fox.stillT += dt;
    else fox.stillT = 0;
    if (fox.stillT > 0.5) {
      fox.stillT = 0;
      fox.cooldown = 2.5;
      for (i = flakes.length - 1; i >= 0; i--) {
        if (!flakes[i].collected) continue;
        flakes[i].collected = false;
        flakes[i].ax = fox.x + (Math.random() - 0.5) * viewW * 0.08;
        spawnSparkles(fox.x, unicorn.y, 10, '#ffd0b0');
        playNote(220, 0, 0.2, 'triangle', 0.3);
        break;
      }
    }
  } else fox.stillT = 0;

  if (invulnT > 0) invulnT -= dt;
  for (i = 0; i < snowballs.length; i++) {
    var sb = snowballs[i];
    if (puzzleBusy()) continue;
    if (sb.wait > 0) { sb.wait -= dt; continue; }
    sb.vy += viewH * 0.45 * dt;
    sb.y += sb.vy * dt;
    if (!celebrating && invulnT <= 0 &&
        Math.abs(sb.x - unicorn.x) < viewH * 0.07 &&
        Math.abs(sb.y - unicorn.y) < viewH * 0.08) {
      invulnT = 1.6;
      playNote(180, 0, 0.2, 'sawtooth', 0.22);
      spawnSparkles(unicorn.x, unicorn.y, 10, '#ffffff');
      sb.y = -30; sb.vy = viewH * 0.2; sb.wait = 2 + Math.random();
    }
    if (sb.y > viewH + 40) {
      sb.y = -30; sb.vy = viewH * 0.18;
      sb.x = unicorn.x + (Math.random() - 0.3) * viewW * 0.4;
      sb.wait = 0.8 + Math.random();
    }
  }

  updateParticles(dt);
  if (celebrating) {
    celebrateT += dt;
    for (i = 0; i < confetti.length; i++) {
      confetti[i].y += confetti[i].vy * dt;
      confetti[i].x += confetti[i].vx * dt;
      confetti[i].rot += confetti[i].vr * dt;
    }
  }
}

function drawSnowflake(c, x, y, r) {
  var i, a;
  c.save();
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(2, r * 0.16);
  c.beginPath();
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3;
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.stroke();
  c.restore();
}

function drawFox(c) {
  var x = fox.x - camX, y = groundTop + 8, s = viewH * 0.05;
  c.save();
  c.translate(x, y);
  c.scale(fox.dir, 1);
  c.translate(0, Math.sin(fox.bounceT) * 3);
  c.fillStyle = '#e88a3a';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, -s * 0.2, s * 0.9, s * 0.45, 0, 0, Math.PI * 2);
  else c.arc(0, -s * 0.2, s * 0.7, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-s * 0.15, -s * 0.7); c.lineTo(-s * 0.4, -s * 1.15); c.lineTo(s * 0.05, -s * 0.75);
  c.moveTo(s * 0.25, -s * 0.7); c.lineTo(s * 0.5, -s * 1.15); c.lineTo(s * 0.05, -s * 0.7);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(s * 0.25, -s * 0.3, s * 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 0.28, -s * 0.3, s * 0.06, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawIce() {
  var i, hs, pad;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < flakes.length; i++) {
    if (flakes[i].collected) continue;
    drawSnowflake(
      ctx,
      flakes[i].ax + flakes[i].ox - camX,
      flakes[i].ay + flakes[i].oy,
      viewH * 0.028
    );
  }
  for (i = 0; i < snowballs.length; i++) {
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(snowballs[i].x - camX, snowballs[i].y, viewH * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
  drawFox(ctx);
  var us = viewH / 800;
  var ux = unicorn.x - camX, uy = unicorn.y;
  ctx.fillStyle = 'rgba(18, 42, 70, 0.45)';
  ctx.beginPath();
  if (ctx.ellipse) ctx.ellipse(ux, uy + us * 8, viewH * 0.07, viewH * 0.018, 0, 0, Math.PI * 2);
  else ctx.arc(ux, uy + 6, viewH * 0.05, 0, Math.PI * 2);
  ctx.fill();
  if (invulnT > 0 && Math.sin(globalT * 20) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, ux, uy, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  drawCelebrateLayer();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = flakes[i] && flakes[i].collected ? 1 : 0.25;
    drawSnowflake(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.9);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
