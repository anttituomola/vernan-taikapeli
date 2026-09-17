'use strict';

// Jääpolku: liukas ratsastus, lumihiutaleet, kettu ja lumipallot.

function initIce() {
  var i, def;
  tasks = [makeTask(0.30, 'odd'), makeTask(0.68, 'count')];
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
  renderBackground();
  playNote(698, 0, 0.22, 'sine', 0.35);
  playNote(880, 0.12, 0.3, 'triangle', 0.35);
}

function collectIceFlake(fl) {
  fl.collected = true;
  spawnSparkles(fl.ax, fl.ay, 12, '#e8f6ff');
  artPop(fl.ax, fl.ay, viewH * 0.05, '#e8f6ff', 'ring');
  var idx = flakes.indexOf(fl);
  if (idx >= 0) hudBump[idx] = 0.4;
  playNote(920 + countCollected(flakes) * 40, 0, 0.25, 'sine', 0.4);
  if (countCollected(flakes) === PICKUP_COUNT) startCelebration();
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
      collectIceFlake(flakes[i]);
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
  artGlow(c, x, y, r * 2.4, '#e8f6ff', 0.45);
  for (i = 0; i < 6; i++) {
    a = i * Math.PI / 3;
    artLimb(c, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1.6, r * 0.18), '#ffffff', '#8ab4d0');
  }
  artCircle(c, x, y, r * 0.28, '#ffffff', { shadeTo: '#d0e4f8', hi: 0.45 });
}

function drawFox(c) {
  var x = fox.x - camX, y = groundTop + 8, s = viewH * 0.05;
  var hop = Math.sin(fox.bounceT) * 3;
  artShadow(c, x, y, s * 1.3, s * 0.32, 0.16);
  c.save();
  c.translate(x, y + hop);
  c.scale(fox.dir, 1);
  artBlob(c, -s * 0.7, -s * 0.15, s * 0.28, s * 0.16, '#e88a3a', { rot: -0.4 });
  artBlob(c, 0, -s * 0.22, s * 0.9, s * 0.45, '#e88a3a', { hi: 0.3 });
  c.beginPath();
  c.moveTo(-s * 0.12, -s * 0.62); c.lineTo(-s * 0.38, -s * 1.12); c.lineTo(s * 0.08, -s * 0.7);
  c.closePath();
  artFillPath(c, '#e88a3a', -s * 1.12, -s * 0.62, s * 0.12, { lineColor: '#b45a20' });
  c.beginPath();
  c.moveTo(s * 0.22, -s * 0.62); c.lineTo(s * 0.48, -s * 1.12); c.lineTo(s * 0.02, -s * 0.62);
  c.closePath();
  artFillPath(c, '#e88a3a', -s * 1.12, -s * 0.62, s * 0.12, { lineColor: '#b45a20' });
  artCircle(c, s * 0.22, -s * 0.32, s * 0.18, '#fff4e8', { shadeTo: '#e8d4f0' });
  artEye(c, s * 0.28, -s * 0.32, s * 0.11, 0.3, false);
  c.restore();
}

function drawIce() {
  var i, hs, pad, bump;
  if (!beginPlayWorld()) return;
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
    artCircle(ctx, snowballs[i].x - camX, snowballs[i].y, viewH * 0.03, '#f4fbff', { shadeTo: '#c8dcec', hi: 0.4 });
  }
  drawFox(ctx);
  var us = viewH / 800;
  var ux = unicorn.x - camX, uy = unicorn.y;
  artShadow(ctx, ux, uy + us * 8, viewH * 0.07, viewH * 0.018, 0.18);
  if (invulnT > 0 && Math.sin(globalT * 20) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, ux, uy, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  endPlayWorld();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(20,50,80,0.28)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = flakes[i] && flakes[i].collected ? 1 : 0.28;
    bump = hudBump[i] > 0 ? 1 + Math.sin(Math.PI * hudBump[i] / 0.4) * 0.45 : 1;
    drawSnowflake(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.9 * bump);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
