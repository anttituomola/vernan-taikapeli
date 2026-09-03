'use strict';

// Noidan suo: ratsastus sumussa. Virvatulet huomaavat edestä lähestyjän ja
// karkaavat — ne pitää saartaa takaa. Noita luudalla pudottaa sammakoita.
// Rupikonnat (rytmitehtävä) ja muistiloitsu tukkivat tien. Sydämet käytössä.

var WISP_COUNT = 8;
var wisps = [];
var witch = { x: 0, fy: 0.26, dir: 1, dropT: 3, warnT: 0, wobble: 0 };
var frogs = [];
var swampGate = { fx: 0.965, x: 0, open: false };
var fogBands = [];

var wispDefs = [
  { fx: 0.08, fy: 0.22, dir: 1 }, { fx: 0.16, fy: 0.34, dir: -1 }, { fx: 0.27, fy: 0.18, dir: -1 },
  { fx: 0.45, fy: 0.30, dir: 1 }, { fx: 0.52, fy: 0.16, dir: -1 }, { fx: 0.66, fy: 0.28, dir: 1 },
  { fx: 0.86, fy: 0.20, dir: -1 }, { fx: 0.92, fy: 0.34, dir: 1 }
];

function initSwamp() {
  var i;
  level = 7;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  activeTask = null;
  heartsReset();
  tasks = [
    makeTask(0.34, 'rhythm'),
    makeTask(0.58, 'memory', { seqLen: 5, orbs: 4 }),
    makeTask(0.80, 'rhythm')
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.40, 0.72]);
  wisps = [];
  for (i = 0; i < WISP_COUNT; i++) {
    wisps.push({
      ax: wispDefs[i].fx * worldW,
      ay: groundTop - wispDefs[i].fy * viewH,
      ox: 0, oy: 0, dir: wispDefs[i].dir,
      collected: false, phase: Math.random() * Math.PI * 2,
      turnT: 3 + Math.random() * 4, noticeT: 0,
      onRestore: function (w) { w.ox = 0; w.oy = 0; }
    });
  }
  witch.x = worldW * 0.3;
  witch.dir = 1;
  witch.dropT = 3.5;
  witch.warnT = 0;
  witch.wobble = 0;
  frogs = [];
  fogBands = [];
  for (i = 0; i < 6; i++) {
    fogBands.push({ x: Math.random() * viewW, y: viewH * (0.55 + Math.random() * 0.35), w: viewW * (0.3 + Math.random() * 0.3), sp: viewW * (0.01 + Math.random() * 0.02) * (i % 2 ? 1 : -1) });
  }
  swampGate.x = swampGate.fx * worldW;
  swampGate.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  document.body.style.background = '#12241c';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(294, 0, 0.3, 'triangle', 0.35);
  playNote(392, 0.15, 0.4, 'sine', 0.3);
}

function respawnSwamp() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.moving = false;
  frogs = [];
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeSwamp(ratio) {
  var i;
  for (i = 0; i < wisps.length; i++) {
    wisps[i].ax = wispDefs[i].fx * worldW;
    wisps[i].ay = groundTop - wispDefs[i].fy * viewH;
    wisps[i].ox = 0; wisps[i].oy = 0;
  }
  witch.x *= ratio;
  for (i = 0; i < frogs.length; i++) frogs[i].x *= ratio;
  swampGate.x = swampGate.fx * worldW;
}

function wispX(w) { return w.ax + w.ox + Math.sin(w.phase) * viewW * 0.008; }
function wispY(w) { return w.ay + w.oy + Math.sin(w.phase * 1.4) * viewH * 0.018; }

// Näkeekö virvatuli yksisarvisen? Katsoo suuntaan dir; edestä tulija huomataan.
function wispSees(w) {
  var dx = unicorn.x - wispX(w);
  return (dx > 0 ? 1 : -1) === w.dir && Math.abs(dx) < viewW * 0.24;
}

function collectWisp(w) {
  w.collected = true;
  registerCollected(w);
  spawnSparkles(wispX(w), wispY(w), 16, '#c8ffb0');
  playNote(740 + countCollected(wisps) * 50, 0, 0.3, 'sine', 0.4);
  playNote(1110 + countCollected(wisps) * 50, 0.1, 0.35, 'sine', 0.3);
  if (countCollected(wisps) === WISP_COUNT && !swampGate.open) {
    swampGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleSwampTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy, d;
  var hit = viewH * 0.075;
  for (i = 0; i < wisps.length; i++) {
    var w = wisps[i];
    if (w.collected) continue;
    dx = wx - wispX(w);
    dy = wy - wispY(w);
    d = Math.sqrt(dx * dx + dy * dy);
    if (d >= hit) continue;
    var near = Math.abs(unicorn.x - wispX(w)) < viewW * 0.22;
    if (near && !wispSees(w)) {
      collectWisp(w);
    } else {
      // Huomasi: kääntyy katsomaan ja karkaa hetken
      w.dir = unicorn.x > wispX(w) ? 1 : -1;
      w.noticeT = 1.2;
      spawnSparkles(wispX(w), wispY(w), 6, '#eafff0');
      playNote(660, 0, 0.1, 'sine', 0.25);
      playNote(880, 0.07, 0.12, 'sine', 0.2);
    }
    return;
  }
  setWalkTarget(px, py);
}

function witchDropFrog() {
  frogs.push({
    x: witch.x, y: witch.fy * viewH + viewH * 0.05,
    vx: 0, vy: viewH * 0.2, bounces: 0, alive: true, t: 0
  });
}

function updateSwamp(dt) {
  var i, dx, dy, dist, step;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Yksisarvisen liike (kuten metsässä)
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
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 10, 1, '#b8e0c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);
  updateCheckpoints(unicorn.x, unicorn.y);

  // Virvatulet
  for (i = 0; i < wisps.length; i++) {
    var w = wisps[i];
    if (w.collected) continue;
    w.phase += dt * 2.2;
    w.turnT -= dt;
    if (w.turnT <= 0) {
      w.dir = -w.dir;
      w.turnT = 3 + Math.random() * 4;
    }
    if (w.noticeT > 0) w.noticeT -= dt;
    var flee = !busy && (wispSees(w) || w.noticeT > 0);
    if (flee) {
      var away = unicorn.x > wispX(w) ? -1 : 1;
      w.ox += away * viewW * 0.13 * dt;
      w.oy -= viewH * 0.05 * dt;
    } else {
      w.ox -= w.ox * Math.min(1, dt * 0.7);
      w.oy -= w.oy * Math.min(1, dt * 0.7);
    }
    var oMax = viewW * 0.16;
    w.ox = Math.min(Math.max(w.ox, -oMax), oMax);
    w.oy = Math.min(Math.max(w.oy, -viewH * 0.12), 0);
  }

  // Noita: seuraa yksisarvista ja pudottaa sammakon varoituksen jälkeen
  if (!busy && !celebrating) {
    var wd = unicorn.x - witch.x;
    var wsp = viewW * 0.075 * dt;
    witch.x += Math.min(Math.max(wd, -wsp), wsp);
    witch.dir = wd > 0 ? 1 : -1;
    witch.x = Math.min(Math.max(witch.x, viewW * 0.1), worldW - viewW * 0.1);
    witch.wobble += dt * 3;
    witch.dropT -= dt;
    if (witch.dropT <= 0 && Math.abs(witch.x - unicorn.x) < viewH * 0.2 && witch.warnT <= 0) {
      witch.warnT = 0.7;
      witch.dropT = 3.2 + Math.random() * 1.4;
      playNote(196, 0, 0.12, 'square', 0.15);
      playNote(233, 0.1, 0.12, 'square', 0.15);
      playNote(196, 0.2, 0.15, 'square', 0.15);
    }
    if (witch.warnT > 0) {
      witch.warnT -= dt;
      if (witch.warnT <= 0) witchDropFrog();
    }
  }

  // Sammakot: putoavat ja loikkivat kohti yksisarvista
  var pathY = (groundTop + groundBottom) / 2;
  for (i = frogs.length - 1; i >= 0; i--) {
    var fr = frogs[i];
    if (busy) continue;
    fr.t += dt;
    fr.vy += viewH * 1.2 * dt;
    fr.x += fr.vx * dt;
    fr.y += fr.vy * dt;
    if (fr.y >= pathY) {
      fr.y = pathY;
      fr.bounces += 1;
      if (fr.bounces > 3) {
        spawnSparkles(fr.x, fr.y, 8, '#9fe08a');
        frogs.splice(i, 1);
        continue;
      }
      fr.vy = -viewH * 0.55;
      fr.vx = (unicorn.x > fr.x ? 1 : -1) * viewW * 0.12;
      playNote(330 - fr.bounces * 30, 0, 0.08, 'square', 0.12);
    }
    var hx = Math.abs(fr.x - unicorn.x) < viewH * 0.07;
    var hy = Math.abs(fr.y - (unicorn.y - viewH * 0.06)) < viewH * 0.10;
    if (hx && hy && !celebrating) {
      frogs.splice(i, 1);
      loseHeart();
      spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 10, '#9fe08a');
    }
  }

  // Sumu
  for (i = 0; i < fogBands.length; i++) {
    fogBands[i].x += fogBands[i].sp * dt;
    if (fogBands[i].x > viewW + fogBands[i].w) fogBands[i].x = -fogBands[i].w;
    if (fogBands[i].x < -fogBands[i].w) fogBands[i].x = viewW + fogBands[i].w;
  }

  if (swampGate.open && !celebrating && Math.abs(unicorn.x - swampGate.x) < viewH * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderSwampBg(b, w, h) {
  var i, x;
  var horizon = h * 0.66;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#0d1a2a');
  sky.addColorStop(0.6, '#1f3a3a');
  sky.addColorStop(1, '#3d5a4a');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  // Kuu
  var mx = w * 0.7, my = h * 0.15, mr = h * 0.06;
  var mg = b.createRadialGradient(mx, my, mr * 0.3, mx, my, mr * 2.6);
  mg.addColorStop(0, 'rgba(230,255,220,0.9)');
  mg.addColorStop(1, 'rgba(230,255,220,0)');
  b.fillStyle = mg;
  b.fillRect(mx - mr * 2.6, my - mr * 2.6, mr * 5.2, mr * 5.2);
  b.fillStyle = '#eafff0';
  b.beginPath(); b.arc(mx, my, mr, 0, Math.PI * 2); b.fill();
  // Kuolleet puut
  for (i = 0; i < 16; i++) {
    x = w * (0.03 + i * 0.062) + (i % 3) * 20;
    drawDeadTree(b, x, horizon + h * 0.02, h * (0.16 + (i % 3) * 0.05));
  }
  // Suo ja vesi
  var marsh = b.createLinearGradient(0, horizon, 0, h);
  marsh.addColorStop(0, '#2f5a3a');
  marsh.addColorStop(1, '#183426');
  b.fillStyle = marsh;
  b.fillRect(0, horizon, w, h - horizon);
  b.fillStyle = 'rgba(70,140,120,0.5)';
  for (i = 0; i < 14; i++) {
    x = (i * 457.3) % w;
    b.beginPath();
    if (b.ellipse) b.ellipse(x, horizon + h * 0.04 + (i % 3) * h * 0.012, h * 0.08, h * 0.012, 0, 0, Math.PI * 2);
    else b.arc(x, horizon + h * 0.04, h * 0.03, 0, Math.PI * 2);
    b.fill();
  }
  // Polku (lankkusilta)
  b.fillStyle = '#6b4f3a';
  b.beginPath();
  b.moveTo(0, groundTop);
  for (x = 0; x <= w; x += 12) b.lineTo(x, groundTop + Math.sin(x * 0.01) * 5);
  b.lineTo(w, groundBottom + 8);
  for (x = w; x >= 0; x -= 12) b.lineTo(x, groundBottom + 8 + Math.sin(x * 0.013) * 5);
  b.closePath(); b.fill();
  b.strokeStyle = 'rgba(0,0,0,0.25)';
  b.lineWidth = 2;
  for (x = 0; x < w; x += h * 0.05) {
    b.beginPath(); b.moveTo(x, groundTop); b.lineTo(x + 6, groundBottom + 8); b.stroke();
  }
  // Kaislat
  b.strokeStyle = '#5f8a4a';
  b.lineWidth = 3;
  for (i = 0; i < 60; i++) {
    x = (i * 137.5) % w;
    var ry = horizon + h * 0.02 + ((i * 53) % Math.max(1, (groundTop - horizon - h * 0.05)));
    b.beginPath(); b.moveTo(x, ry); b.lineTo(x + 4, ry - h * 0.05); b.stroke();
  }
  // Portti lopussa
  drawSwampGateFrame(b, swampGate.x, groundTop, h);
}

function drawDeadTree(b, x, baseY, s) {
  b.strokeStyle = '#1a2620';
  b.lineCap = 'round';
  b.lineWidth = s * 0.12;
  b.beginPath(); b.moveTo(x, baseY); b.lineTo(x, baseY - s); b.stroke();
  b.lineWidth = s * 0.07;
  b.beginPath(); b.moveTo(x, baseY - s * 0.6); b.lineTo(x - s * 0.35, baseY - s * 0.95); b.stroke();
  b.beginPath(); b.moveTo(x, baseY - s * 0.75); b.lineTo(x + s * 0.3, baseY - s * 1.1); b.stroke();
}

function drawSwampGateFrame(b, x, baseY, h) {
  var pw = h * 0.03, gh = h * 0.28, gw = h * 0.1;
  b.fillStyle = '#4a3627';
  b.fillRect(x - gw - pw / 2, baseY - gh, pw, gh);
  b.fillRect(x + gw - pw / 2, baseY - gh, pw, gh);
  b.fillRect(x - gw - pw, baseY - gh - pw, gw * 2 + pw * 2, pw);
}

function drawWisp(c, w) {
  var x = wispX(w) - camX, y = wispY(w), r = viewH * 0.028;
  if (x < -r * 4 || x > viewW + r * 4) return;
  var g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  g.addColorStop(0, 'rgba(200,255,180,0.7)');
  g.addColorStop(1, 'rgba(200,255,180,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r * 2.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#eafff0';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#c8ffb0';
  c.beginPath(); c.arc(x, y + r * 0.2, r * 0.6, 0, Math.PI * 2); c.fill();
  // Silmä katsoo suuntaan dir: siitä puolelta ei kannata lähestyä
  c.fillStyle = '#204030';
  c.beginPath(); c.arc(x + w.dir * r * 0.35, y - r * 0.15, r * 0.18, 0, Math.PI * 2); c.fill();
  // Katseen suunta kolmiona
  c.fillStyle = 'rgba(200,255,180,0.45)';
  c.beginPath();
  c.moveTo(x + w.dir * r * 1.2, y - r * 0.5);
  c.lineTo(x + w.dir * r * 2.4, y);
  c.lineTo(x + w.dir * r * 1.2, y + r * 0.5);
  c.closePath();
  c.fill();
}

function drawWitch(c) {
  var x = witch.x - camX, y = witch.fy * viewH + Math.sin(witch.wobble) * viewH * 0.015;
  var s = viewH * 0.045;
  if (x < -s * 6 || x > viewW + s * 6) return;
  var warn = witch.warnT > 0;
  c.save();
  c.translate(x, y);
  c.scale(witch.dir, 1);
  if (warn) c.rotate(Math.sin(globalT * 30) * 0.08);
  // Luuta
  c.strokeStyle = '#8a5a30';
  c.lineWidth = s * 0.18;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 1.6, s * 0.9); c.lineTo(s * 1.1, s * 0.5); c.stroke();
  c.fillStyle = '#c9a25a';
  c.beginPath();
  c.moveTo(-s * 1.5, s * 0.6); c.lineTo(-s * 2.4, s * 0.55); c.lineTo(-s * 2.5, s * 1.3); c.lineTo(-s * 1.6, s * 1.15);
  c.closePath(); c.fill();
  // Kaapu
  c.fillStyle = '#5a2d82';
  c.beginPath();
  c.moveTo(0, -s * 0.9);
  c.quadraticCurveTo(-s * 1.2, s * 0.2, -s * 0.9, s * 0.7);
  c.lineTo(s * 0.7, s * 0.7);
  c.quadraticCurveTo(s * 0.8, 0, 0, -s * 0.9);
  c.closePath(); c.fill();
  // Pää ja hattu
  c.fillStyle = '#b8e0a0';
  c.beginPath(); c.arc(0, -s * 1.1, s * 0.42, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 0.15, -s * 1.15, s * 0.07, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2e1a4a';
  c.beginPath();
  c.moveTo(-s * 0.7, -s * 1.35); c.lineTo(s * 0.7, -s * 1.35); c.lineTo(s * 0.1, -s * 2.6);
  c.closePath(); c.fill();
  c.fillRect(-s * 0.85, -s * 1.45, s * 1.7, s * 0.14);
  c.fillStyle = '#ffe27a';
  c.fillRect(-s * 0.3, -s * 1.6, s * 0.6, s * 0.14);
  c.restore();
  if (warn) {
    c.fillStyle = 'rgba(160,240,120,0.6)';
    c.beginPath(); c.arc(x, y + s * 1.4 + Math.sin(globalT * 20) * 3, s * 0.3, 0, Math.PI * 2); c.fill();
  }
}

function drawFrogProjectile(c, fr) {
  var x = fr.x - camX, y = fr.y, s = viewH * 0.028;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = '#5ecf6a';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y - s * 0.4, s, s * 0.7, 0, 0, Math.PI * 2);
  else c.arc(x, y - s * 0.4, s * 0.8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - s * 0.35, y - s * 0.8, s * 0.25, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.35, y - s * 0.8, s * 0.25, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#234';
  c.beginPath(); c.arc(x - s * 0.3, y - s * 0.8, s * 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.4, y - s * 0.8, s * 0.1, 0, Math.PI * 2); c.fill();
}

function drawSwampGateGlow(c) {
  var x = swampGate.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var gh = h * 0.28, gw = h * 0.1;
  if (swampGate.open) {
    var g = c.createLinearGradient(0, groundTop - gh, 0, groundTop);
    g.addColorStop(0, 'rgba(200,255,180,' + (0.7 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(200,255,180,0.25)');
    c.fillStyle = g;
    c.fillRect(x - gw, groundTop - gh, gw * 2, gh);
    drawStar(c, x, groundTop - gh * 1.3, h * 0.035, globalT, 1);
  } else {
    c.fillStyle = 'rgba(40,80,60,0.35)';
    c.fillRect(x - gw, groundTop - gh, gw * 2, gh);
  }
}

function drawSwamp() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawSwampGateGlow(ctx);
  for (i = 0; i < wisps.length; i++) {
    if (!wisps[i].collected) drawWisp(ctx, wisps[i]);
  }
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < frogs.length; i++) drawFrogProjectile(ctx, frogs[i]);
  drawWitch(ctx);
  drawParticlesLayer(ctx);
  // Sumu kulkee etualalla
  for (i = 0; i < fogBands.length; i++) {
    var fb = fogBands[i];
    var fg = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, fb.w / 2);
    fg.addColorStop(0, 'rgba(200,220,210,0.22)');
    fg.addColorStop(1, 'rgba(200,220,210,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(fb.x, fb.y, fb.w / 2, viewH * 0.06, 0, 0, Math.PI * 2);
    else ctx.arc(fb.x, fb.y, viewH * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  if (swampGate.open && !celebrating) drawEdgeArrow(ctx, swampGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, WISP_COUNT, function (i2) { return wisps[i2] && wisps[i2].collected; },
    function (c, x, y, s) {
      c.fillStyle = '#eafff0';
      c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c8ffb0';
      c.beginPath(); c.arc(x, y + s * 0.2, s * 0.6, 0, Math.PI * 2); c.fill();
    });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
