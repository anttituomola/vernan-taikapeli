'use strict';

// Helmilampi: hyppely lumpeilla, helmet, sammakko ja sauva.

function layoutPond() {
  var g = groundTop;
  platforms = [
    { x: 0, y: g, w: worldW },
    { x: worldW * 0.14, y: g - viewH * 0.18, w: worldW * 0.12 },
    { x: worldW * 0.32, y: g - viewH * 0.34, w: worldW * 0.10 },
    { x: worldW * 0.50, y: g - viewH * 0.20, w: worldW * 0.11 },
    { x: worldW * 0.66, y: g - viewH * 0.40, w: worldW * 0.10 },
    { x: worldW * 0.84, y: g - viewH * 0.24, w: worldW * 0.12 }
  ];
  frog.x = platforms[4].x + platforms[4].w * 0.5;
  frog.y = platforms[4].y;
}

function initPond() {
  var i, def;
  level = 4;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  tasks = [makeTask(0.32, 'math'), makeTask(0.72, 'memory')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  layoutPond();
  pearls = [];
  for (i = 0; i < pondDefs.length; i++) {
    def = pondDefs[i];
    pearls.push({
      ax: def.fx * worldW,
      ay: groundTop - def.fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2
    });
  }
  frog.awake = false;
  frog.hopT = 0;
  princess.x = viewW * 0.12;
  princess.y = groundTop;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = true;
  princess.walkPhase = 0;
  princess.coyote = 0.12;
  document.body.style.background = '#0a4550';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(392, 0, 0.22, 'triangle', 0.35);
  playNote(523, 0.12, 0.28, 'sine', 0.35);
}

function collectPearl(p) {
  p.collected = true;
  spawnSparkles(p.ax, p.ay, 12, '#c8f4ff');
  playNote(698, 0, 0.18, 'sine', 0.4);
  playNote(1047, 0.08, 0.24, 'sine', 0.32);
  if (countCollected(pearls) === PICKUP_COUNT) startCelebration();
}

function updatePond(dt) {
  var i, g = groundTop, pw = viewH * 0.045, runSp = viewW * 0.18;
  updateTasks(dt);

  if (!celebrating && holding && !puzzleBusy()) {
    var dxh = holdWorldX - princess.x;
    if (Math.abs(dxh) > 10) {
      princess.vx = (dxh > 0 ? 1 : -1) * runSp;
      princess.facing = dxh > 0 ? 1 : -1;
    } else princess.vx = 0;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 6);
    if (Math.abs(princess.vx) < 8) princess.vx = 0;
  }

  princess.x += princess.vx * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  blockPrincessAtTasks();

  if (!frog.awake && Math.abs(princess.x - frog.x) < viewH * 0.07 &&
      Math.abs(princess.y - frog.y) < viewH * 0.08) {
    princess.x = frog.x - viewH * 0.08 * (princess.x < frog.x ? 1 : -1);
    princess.vx = 0;
  }

  princess.vy += viewH * 1.55 * dt;
  if (princess.vy > viewH * 1.05) princess.vy = viewH * 1.05;
  princess.y += princess.vy * dt;
  princess.onGround = false;
  for (i = 0; i < platforms.length; i++) {
    var pl = platforms[i];
    var onX = princess.x > pl.x + pw * 0.2 && princess.x < pl.x + pl.w - pw * 0.2;
    if (onX && princess.vy >= 0 && princess.y >= pl.y && princess.y <= pl.y + viewH * 0.08) {
      princess.y = pl.y;
      princess.vy = 0;
      princess.onGround = true;
    }
  }
  if (princess.y > g) {
    princess.y = g;
    princess.vy = 0;
    princess.onGround = true;
  }
  if (princess.onGround) princess.coyote = 0.14;
  else princess.coyote -= dt;
  if (Math.abs(princess.vx) > 12 && princess.onGround) princess.walkPhase += dt * 8;

  followCam(princess.x, dt);
  frog.hopT += dt * 5;
  if (frog.awake) frog.y -= viewH * 0.16 * dt;

  for (i = 0; i < pearls.length; i++) {
    if (pearls[i].collected) continue;
    pearls[i].phase += dt * 2.4;
    if (Math.abs(pearls[i].ax - princess.x) < viewW * 0.22) {
      pearls[i].ax += ((pearls[i].ax - princess.x) >= 0 ? 1 : -1) * viewW * 0.07 * dt;
    }
    pearls[i].ax = Math.min(Math.max(pearls[i].ax, viewW * 0.04), worldW - viewW * 0.04);
  }

  for (i = sparks.length - 1; i >= 0; i--) {
    var sp = sparks[i];
    sp.age += dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    if (sp.age >= sp.life) { sparks.splice(i, 1); continue; }
    if (!frog.awake) {
      var odx = sp.x - frog.x, ody = sp.y - (frog.y - viewH * 0.05);
      if (odx * odx + ody * ody < viewH * 0.07 * viewH * 0.07) {
        frog.awake = true;
        spawnSparkles(frog.x, frog.y, 12, '#b6ff9a');
        playNote(330, 0, 0.15, 'triangle', 0.3);
        sparks.splice(i, 1);
        continue;
      }
    }
    var k;
    for (k = 0; k < pearls.length; k++) {
      if (pearls[k].collected) continue;
      var pdx = sp.x - pearls[k].ax, pdy = sp.y - (pearls[k].ay + Math.sin(pearls[k].phase) * viewH * 0.015);
      if (pdx * pdx + pdy * pdy < viewH * 0.04 * viewH * 0.04) {
        collectPearl(pearls[k]);
        sparks.splice(i, 1);
        break;
      }
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

function drawFrog(c) {
  var x = frog.x - camX;
  var y = frog.y - viewH * 0.04 - (frog.awake ? frog.hopT * viewH * 0.04 : Math.abs(Math.sin(frog.hopT)) * 6);
  var s = viewH * 0.05;
  c.save();
  c.translate(x, y);
  c.fillStyle = '#5ecf6a';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.8, s * 0.55, 0, 0, Math.PI * 2);
  else c.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = frog.awake ? '#fff' : '#c8f5c4';
  c.beginPath(); c.arc(-s * 0.28, -s * 0.25, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.28, -s * 0.25, s * 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#234';
  c.beginPath(); c.arc(-s * 0.24, -s * 0.25, s * 0.08, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.32, -s * 0.25, s * 0.08, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawPearl(c, x, y, r) {
  var g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#d4f6ff');
  g.addColorStop(1, '#7ecbe0');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

function drawPond() {
  var i, hs, pad;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  drawFrog(ctx);
  for (i = 0; i < pearls.length; i++) {
    if (pearls[i].collected) continue;
    drawPearl(
      ctx,
      pearls[i].ax - camX,
      pearls[i].ay + Math.sin(pearls[i].phase) * viewH * 0.015,
      viewH * 0.022
    );
  }
  for (i = 0; i < sparks.length; i++) {
    var a = 1 - sparks[i].age / sparks[i].life;
    ctx.fillStyle = 'rgba(180,255,255,' + a + ')';
    ctx.beginPath();
    ctx.arc(sparks[i].x - camX, sparks[i].y, viewH * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  for (i = 0; i < particles.length; i++) {
    ctx.globalAlpha = 1 - particles[i].age / particles[i].life;
    ctx.fillStyle = particles[i].color;
    ctx.fillRect(particles[i].x - camX - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  ctx.globalAlpha = 1;
  drawCelebrateLayer();
  hs = viewH * 0.022; pad = hs * 1.4;
  var left = hudX();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * PICKUP_COUNT + pad, hs * 3.4, hs);
  ctx.fill();
  for (i = 0; i < PICKUP_COUNT; i++) {
    ctx.globalAlpha = pearls[i] && pearls[i].collected ? 1 : 0.25;
    drawPearl(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.7, hs * 0.85);
    ctx.globalAlpha = 1;
  }
  drawTaskOverlay(ctx);
}
