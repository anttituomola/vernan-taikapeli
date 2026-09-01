'use strict';

// Puutarhavaihe
// ---------- Taso 2: perhospuutarha ----------
function layoutLevel2() {
  var g = groundTop;
  platforms = [
    { x: 0, y: g, w: worldW },
    { x: worldW * 0.12, y: g - viewH * 0.22, w: worldW * 0.11 },
    { x: worldW * 0.30, y: g - viewH * 0.40, w: worldW * 0.09 },
    { x: worldW * 0.46, y: g - viewH * 0.20, w: worldW * 0.10 },
    { x: worldW * 0.62, y: g - viewH * 0.42, w: worldW * 0.10 },
    { x: worldW * 0.82, y: g - viewH * 0.28, w: worldW * 0.11 }
  ];
  owl.x = platforms[4].x + platforms[4].w * 0.55;
  owl.y = platforms[4].y;
}

function initLevel2() {
  level = 2;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  document.body.style.background = '#1a1448';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
  layoutLevel2();
  princess.x = viewW * 0.12;
  princess.y = groundTop;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = true;
  princess.walkPhase = 0;
  princess.coyote = 0.12;
  owl.awake = false;
  owl.flyT = 0;
  tasks = [makeTask(0.34, 'math'), makeTask(0.70, 'memory')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  activeTask = null;
  butterflies = [];
  var i;
  for (i = 0; i < BUTTERFLY_COUNT; i++) {
    butterflies.push({
      ax: butterflyDefs[i].fx * worldW,
      ay: groundTop - butterflyDefs[i].fy * viewH,
      collected: false,
      phase: Math.random() * Math.PI * 2
    });
  }
  renderBackground();
  playNote(659, 0, 0.25, 'triangle', 0.4);
  playNote(880, 0.12, 0.35, 'triangle', 0.4);
}

function tryJump() {
  if (!running || celebrating || puzzleBusy()) return;
  var p = phaseNow();
  if (!p.usesJump) return;
  if (level === 5) {
    princess.vy = -viewH * 0.58;
    princess.onGround = false;
    playNote(880, 0, 0.1, 'sine', 0.3);
    return;
  }
  if (princess.coyote <= 0) return;
  princess.vy = -viewH * 0.92;
  princess.onGround = false;
  princess.coyote = 0;
  playNote(784, 0, 0.12, 'sine', 0.35);
  playNote(1047, 0.06, 0.18, 'sine', 0.28);
}

function shootWand(px, py) {
  if (celebrating || puzzleBusy() || !phaseNow().usesWand) return;
  var ox = princess.x + princess.facing * viewH * 0.04;
  var oy = princess.y - viewH * 0.13;
  var dx = px + camX - ox;
  var dy = py - oy;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var sp = viewH * 0.78;
  sparks.push({ x: ox, y: oy, vx: dx / len * sp, vy: dy / len * sp, age: 0, life: 0.62 });
  playNote(988, 0, 0.12, 'sine', 0.4);
  playNote(1319, 0.05, 0.18, 'triangle', 0.3);
  spawnSparkles(ox, oy, 6, '#e4b8ff');
}

function countButterflies() {
  var n = 0, i;
  for (i = 0; i < butterflies.length; i++) if (butterflies[i].collected) n++;
  return n;
}

function collectButterfly(bf) {
  bf.collected = true;
  spawnSparkles(bf.ax, bf.ay, 14, '#ffd6ff');
  playNote(784, 0, 0.2, 'sine', 0.4);
  playNote(1175, 0.08, 0.28, 'sine', 0.35);
  if (countButterflies() === BUTTERFLY_COUNT) startCelebration();
}

function updateLevel2(dt) {
  var i, g = groundTop;
  var pw = viewH * 0.045;
  var runSp = viewW * 0.22;

  updateTasks(dt);

  if (!celebrating && holding && !puzzleBusy()) {
    var dxh = holdWorldX - princess.x;
    if (Math.abs(dxh) > 10) {
      princess.vx = (dxh > 0 ? 1 : -1) * runSp;
      princess.facing = dxh > 0 ? 1 : -1;
    } else {
      princess.vx = 0;
    }
  } else {
    princess.vx *= Math.max(0, 1 - dt * 7);
    if (Math.abs(princess.vx) < 8) princess.vx = 0;
  }

  princess.x += princess.vx * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x > princess.x - 8) {
      var lim = tasks[i].x - viewH * 0.09;
      if (princess.x > lim) {
        princess.x = lim;
        princess.vx = 0;
      }
    }
  }

  if (!owl.awake && Math.abs(princess.x - owl.x) < viewH * 0.07 &&
      Math.abs(princess.y - owl.y) < viewH * 0.08) {
    princess.x = owl.x - viewH * 0.08 * (princess.x < owl.x ? 1 : -1);
    princess.vx = 0;
  }

  princess.vy += viewH * 1.65 * dt;
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

  if (Math.abs(princess.vx) > 12 && princess.onGround) princess.walkPhase += dt * 10;
  if (Math.random() < dt * 8 && Math.abs(princess.vx) > 20) {
    spawnSparkles(princess.x, princess.y - 8, 1, '#e4b8ff');
  }

  var targetCam = princess.x - viewW / 2;
  targetCam = Math.min(Math.max(targetCam, 0), Math.max(0, worldW - viewW));
  camX += (targetCam - camX) * Math.min(1, dt * 4);

  for (i = 0; i < butterflies.length; i++) {
    var bf = butterflies[i];
    if (bf.collected) continue;
    bf.phase += dt * 2.6;
    var near = Math.abs((bf.ax + Math.sin(bf.phase) * viewW * 0.02) - princess.x) < viewW * 0.26;
    if (near) bf.ax += ((bf.ax - princess.x) >= 0 ? 1 : -1) * viewW * 0.09 * dt;
    bf.ax = Math.min(Math.max(bf.ax, viewW * 0.04), worldW - viewW * 0.04);
  }

  if (owl.awake) {
    owl.flyT += dt;
    owl.y -= viewH * 0.18 * dt;
  }

  for (i = sparks.length - 1; i >= 0; i--) {
    var sp = sparks[i];
    sp.age += dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    if (sp.age >= sp.life) { sparks.splice(i, 1); continue; }
    var k;
    if (!owl.awake) {
      var odx = sp.x - owl.x, ody = sp.y - (owl.y - viewH * 0.06);
      if (odx * odx + ody * ody < viewH * 0.07 * viewH * 0.07) {
        owl.awake = true;
        spawnSparkles(owl.x, owl.y - viewH * 0.05, 12, '#ffe27a');
        playNote(392, 0, 0.15, 'triangle', 0.3);
        playNote(523, 0.1, 0.25, 'triangle', 0.3);
        sparks.splice(i, 1);
        continue;
      }
    }
    for (k = 0; k < butterflies.length; k++) {
      var b2 = butterflies[k];
      if (b2.collected) continue;
      var bx = b2.ax + Math.sin(b2.phase) * viewW * 0.018;
      var by = b2.ay + Math.cos(b2.phase * 1.3) * viewH * 0.02;
      var sdx = sp.x - bx, sdy = sp.y - by;
      if (sdx * sdx + sdy * sdy < viewH * 0.038 * viewH * 0.038) {
        collectButterfly(b2);
        sparks.splice(i, 1);
        break;
      }
    }
  }

  for (i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.age += dt;
    if (p.age >= p.life) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  if (celebrating) {
    celebrateT += dt;
    for (i = 0; i < confetti.length; i++) {
      var cf = confetti[i];
      cf.y += cf.vy * dt;
      cf.x += cf.vx * dt + Math.sin(globalT * 3 + i) * 30 * dt;
      cf.rot += cf.vr * dt;
      if (cf.y > viewH + 20) { cf.y = -20; cf.x = Math.random() * viewW; }
    }
  }
}

function drawPrincessFree(c, x, y, s, facing, walkPhase, moving, t) {
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  var bob = moving ? Math.abs(Math.sin(walkPhase)) * s * 3 : Math.sin(t * 2) * s * 1.2;
  c.translate(0, -bob);
  c.strokeStyle = '#ffd9b8';
  c.lineWidth = s * 5;
  c.lineCap = 'round';
  var swing = moving ? Math.sin(walkPhase) * s * 7 : 0;
  c.beginPath();
  c.moveTo(-s * 4, -s * 18);
  c.lineTo(-s * 6 - swing, -s * 2);
  c.moveTo(s * 4, -s * 18);
  c.lineTo(s * 6 + swing, -s * 2);
  c.stroke();
  c.fillStyle = '#ff6fb0';
  c.beginPath();
  c.moveTo(0, -s * 28);
  c.quadraticCurveTo(-s * 16, -s * 8, -s * 12, -s * 2);
  c.lineTo(s * 12, -s * 2);
  c.quadraticCurveTo(s * 16, -s * 8, 0, -s * 28);
  c.closePath(); c.fill();
  c.fillStyle = '#ffd9b8';
  c.beginPath(); c.arc(0, -s * 42, s * 8, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f7c948';
  c.beginPath();
  c.arc(0, -s * 45, s * 8.2, Math.PI * 0.95, Math.PI * 2.05);
  c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 3, -s * 42, s * 1.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffd24f';
  c.beginPath();
  c.moveTo(-s * 6, -s * 50);
  c.lineTo(-s * 6, -s * 56);
  c.lineTo(-s * 3, -s * 52);
  c.lineTo(0, -s * 58);
  c.lineTo(s * 3, -s * 52);
  c.lineTo(s * 6, -s * 56);
  c.lineTo(s * 6, -s * 50);
  c.closePath(); c.fill();
  c.strokeStyle = '#d9b3ff';
  c.lineWidth = s * 2.4;
  c.beginPath();
  c.moveTo(s * 6, -s * 30);
  c.lineTo(s * 22, -s * 48);
  c.stroke();
  c.fillStyle = '#ffe27a';
  c.beginPath(); c.arc(s * 24, -s * 50, s * 4, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawOwl(c) {
  var x = owl.x - camX;
  var y = owl.y - viewH * 0.055 - (owl.awake ? owl.flyT * viewH * 0.05 : 0);
  var s = viewH * 0.055;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.save();
  c.translate(x, y);
  c.fillStyle = '#8b5a2b';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.7, s * 0.9, 0, 0, Math.PI * 2);
  else c.arc(0, 0, s * 0.75, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#c9a06a';
  c.beginPath(); c.arc(0, s * 0.15, s * 0.35, 0, Math.PI * 2); c.fill();
  if (owl.awake) {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-s * 0.22, -s * 0.25, s * 0.22, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.22, -s * 0.25, s * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.beginPath(); c.arc(-s * 0.18, -s * 0.25, s * 0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.26, -s * 0.25, s * 0.1, 0, Math.PI * 2); c.fill();
  } else {
    c.strokeStyle = '#333';
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.arc(-s * 0.22, -s * 0.22, s * 0.16, 0.2, Math.PI - 0.2);
    c.stroke();
    c.beginPath();
    c.arc(s * 0.22, -s * 0.22, s * 0.16, 0.2, Math.PI - 0.2);
    c.stroke();
  }
  c.fillStyle = '#e8a020';
  c.beginPath();
  c.moveTo(0, -s * 0.05);
  c.lineTo(s * 0.18, s * 0.12);
  c.lineTo(-s * 0.18, s * 0.12);
  c.closePath(); c.fill();
  c.restore();
}

function drawButterfly(c, x, y, s, phase, color) {
  var flap = 0.55 + Math.sin(phase * 8) * 0.45;
  c.save();
  c.translate(x, y);
  c.fillStyle = color;
  c.globalAlpha = 0.9;
  c.beginPath();
  if (c.ellipse) {
    c.ellipse(-s * 0.55 * flap, 0, s * 0.55 * flap, s * 0.4, -0.4, 0, Math.PI * 2);
    c.ellipse(s * 0.55 * flap, 0, s * 0.55 * flap, s * 0.4, 0.4, 0, Math.PI * 2);
  } else {
    c.arc(-s * 0.4, 0, s * 0.4, 0, Math.PI * 2);
    c.arc(s * 0.4, 0, s * 0.4, 0, Math.PI * 2);
  }
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#4a3060';
  c.fillRect(-s * 0.06, -s * 0.35, s * 0.12, s * 0.7);
  c.restore();
}

function drawLevel2() {
  var i;
  if (!bgCanvas.width || !viewW || !viewH) return;
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(bgCanvas, 0, 0, bgCanvas.width, bgCanvas.height, -camX, 0, worldW, viewH);

  ctx.fillStyle = 'rgba(255,244,180,0.55)';
  for (i = 0; i < 8; i++) {
    var fx = ((globalT * (12 + i) + i * 90) % (viewW + 80)) - 40;
    var fy = viewH * (0.12 + (i % 4) * 0.08) + Math.sin(globalT * 2 + i) * 6;
    ctx.globalAlpha = 0.35 + Math.sin(globalT * 3 + i) * 0.2;
    ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawOwl(ctx);

  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);

  var bfColors = ['#ff7bac', '#c9a0ff', '#7fd4ff', '#ffd24f'];
  for (i = 0; i < butterflies.length; i++) {
    var bf = butterflies[i];
    if (bf.collected) continue;
    drawButterfly(
      ctx,
      bf.ax + Math.sin(bf.phase) * viewW * 0.018 - camX,
      bf.ay + Math.cos(bf.phase * 1.3) * viewH * 0.02,
      viewH * 0.028,
      bf.phase,
      bfColors[i % bfColors.length]
    );
  }

  for (i = 0; i < sparks.length; i++) {
    var sp = sparks[i];
    var a = 1 - sp.age / sp.life;
    var sg = ctx.createRadialGradient(sp.x - camX, sp.y, 2, sp.x - camX, sp.y, viewH * 0.04);
    sg.addColorStop(0, 'rgba(255,255,200,' + a + ')');
    sg.addColorStop(1, 'rgba(200,140,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sp.x - camX, sp.y, viewH * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  drawPrincessFree(
    ctx, princess.x - camX, princess.y,
    viewH / 520, princess.facing, princess.walkPhase, moving, globalT
  );

  for (i = 0; i < particles.length; i++) {
    var p = particles[i];
    ctx.globalAlpha = 1 - p.age / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (celebrating) {
    drawRainbow(ctx);
    for (i = 0; i < confetti.length; i++) {
      var cf = confetti[i];
      ctx.save();
      ctx.translate(cf.x, cf.y);
      ctx.rotate(cf.rot);
      ctx.fillStyle = cf.color;
      ctx.fillRect(-cf.size / 2, -cf.size / 3, cf.size, cf.size * 0.66);
      ctx.restore();
    }
  }

  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(ctx, left, pad * 0.5, hs * 3.2 * BUTTERFLY_COUNT + pad, hs * 3.6, hs);
  ctx.fill();
  for (i = 0; i < BUTTERFLY_COUNT; i++) {
    ctx.save();
    ctx.globalAlpha = (butterflies[i] && butterflies[i].collected) ? 1 : 0.25;
    drawButterfly(ctx, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 1.1, i, bfColors[i % bfColors.length]);
    ctx.restore();
  }
  drawTaskOverlay(ctx);
}

