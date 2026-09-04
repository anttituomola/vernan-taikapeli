'use strict';

// Rannikko: ratsastus rannalla. Simpukat napataan sormella, ravut saksivat
// polulla ja aallot huuhtovat polun alaosan varoituksen jälkeen. Sydämet käytössä.

var SHELL_COUNT = 8;
var shells = [];
var crabs = [];
var wave = { state: 'idle', t: 6, hit: false };
var lighthouse = { fx: 0.96, x: 0, open: false };
var shellDefs = [
  { fx: 0.08, fy: 0.16 }, { fx: 0.17, fy: 0.24 }, { fx: 0.26, fy: 0.14 }, { fx: 0.40, fy: 0.22 },
  { fx: 0.49, fy: 0.12 }, { fx: 0.61, fy: 0.26 }, { fx: 0.72, fy: 0.16 }, { fx: 0.86, fy: 0.22 }
];
var SHELL_COLORS = ['#ffd6e8', '#ffe9b8', '#e4d2ff', '#d2f4ff'];

function pathMidY() {
  return (groundTop + groundBottom) / 2;
}

function initBeach() {
  var i;
  level = 10;
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
  tasks = [makeTask(0.30, 'shadow'), makeTask(0.55, 'math'), makeTask(0.78, 'pairs', { pairs: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.72]);
  shells = [];
  for (i = 0; i < SHELL_COUNT; i++) {
    shells.push({
      ax: shellDefs[i].fx * worldW, ay: groundTop - shellDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: SHELL_COLORS[i % SHELL_COLORS.length]
    });
  }
  crabs = [
    { zA: 0.12, zB: 0.24, x: 0.18 * worldW, y: groundTop + viewH * 0.06, dir: 1, t: 0 },
    { zA: 0.44, zB: 0.60, x: 0.50 * worldW, y: groundTop + viewH * 0.15, dir: -1, t: 1 },
    { zA: 0.80, zB: 0.92, x: 0.86 * worldW, y: groundTop + viewH * 0.10, dir: 1, t: 2 }
  ];
  wave.state = 'idle';
  wave.t = 5;
  wave.hit = false;
  lighthouse.x = lighthouse.fx * worldW;
  lighthouse.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = pathMidY() - viewH * 0.04;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  document.body.style.background = '#7fd0ff';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnBeach() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = pathMidY() - viewH * 0.04;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeBeach(ratio) {
  var i;
  for (i = 0; i < shells.length; i++) {
    shells[i].ax = shellDefs[i].fx * worldW;
    shells[i].ay = groundTop - shellDefs[i].fy * viewH;
  }
  for (i = 0; i < crabs.length; i++) crabs[i].x *= ratio;
  lighthouse.x = lighthouse.fx * worldW;
}

function collectShell(sh) {
  sh.collected = true;
  registerCollected(sh);
  spawnSparkles(sh.ax, sh.ay, 14, sh.color);
  playNote(700 + countCollected(shells) * 55, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(shells) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(shells) === SHELL_COUNT && !lighthouse.open) {
    lighthouse.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleBeachTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < shells.length; i++) {
    var sh = shells[i];
    if (sh.collected) continue;
    dx = wx - sh.ax;
    dy = wy - (sh.ay + Math.sin(sh.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectShell(sh);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateBeach(dt) {
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
  updateCheckpoints(unicorn.x, unicorn.y);

  for (i = 0; i < shells.length; i++) shells[i].phase += dt * 2;

  // Ravut saksivat polulla edestakaisin
  for (i = 0; i < crabs.length; i++) {
    var cr = crabs[i];
    cr.t += dt * 8;
    if (!busy && !celebrating) {
      cr.x += cr.dir * viewW * 0.06 * dt;
      if (cr.x < cr.zA * worldW) { cr.x = cr.zA * worldW; cr.dir = 1; }
      if (cr.x > cr.zB * worldW) { cr.x = cr.zB * worldW; cr.dir = -1; }
    }
    if (!celebrating && Math.abs(cr.x - unicorn.x) < viewH * 0.06 && Math.abs(cr.y - unicorn.y) < viewH * 0.07) {
      if (loseHeart()) {
        var push = unicorn.x < cr.x ? -1 : 1;
        unicorn.tx = Math.min(Math.max(unicorn.x + push * viewW * 0.08, viewW * 0.05), worldW - viewW * 0.03);
        unicorn.ty = unicorn.y;
        spawnSparkles(unicorn.x, unicorn.y - viewH * 0.08, 10, '#ff9d5c');
      }
    }
  }

  // Aallot: varoitus (vaahto rannassa) -> huuhtelu polun alaosaan
  if (!busy && !celebrating) {
    wave.t -= dt;
    if (wave.state === 'idle' && wave.t <= 0) {
      wave.state = 'warn';
      wave.t = 1.3;
      playNote(110, 0, 0.6, 'sine', 0.2);
    } else if (wave.state === 'warn' && wave.t <= 0) {
      wave.state = 'wash';
      wave.t = 0.9;
      wave.hit = false;
      playNote(160, 0, 0.5, 'sawtooth', 0.12);
      playNote(240, 0.1, 0.5, 'sine', 0.15);
    } else if (wave.state === 'wash') {
      if (!wave.hit && unicorn.y > pathMidY()) {
        wave.hit = true;
        if (loseHeart()) {
          unicorn.tx = unicorn.x;
          unicorn.ty = pathMidY() - viewH * 0.05;
          spawnSparkles(unicorn.x, unicorn.y, 12, '#c9f0ff');
        }
      }
      if (wave.t <= 0) {
        wave.state = 'idle';
        wave.t = 6 + Math.random() * 3;
      }
    }
  }

  if (lighthouse.open && !celebrating && Math.abs(unicorn.x - lighthouse.x) < viewH * 0.09) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderBeachBg(b, w, h) {
  var i, x;
  var horizon = h * 0.5;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#7fd0ff');
  sky.addColorStop(1, '#ffe9c4');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  var sunX = w * 0.8, sunY = h * 0.18, sunR = h * 0.07;
  var sg = b.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  sg.addColorStop(0, 'rgba(255,240,170,1)');
  sg.addColorStop(1, 'rgba(255,240,170,0)');
  b.fillStyle = sg;
  b.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
  b.fillStyle = '#fff1a8';
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 8; i++) cloudShape(b, w * (0.03 + i * 0.125), h * (0.1 + (i % 3) * 0.08), h * 0.03);
  // Meri
  var sea = b.createLinearGradient(0, horizon, 0, groundTop);
  sea.addColorStop(0, '#5fc9e6');
  sea.addColorStop(1, '#1f8fb0');
  b.fillStyle = sea;
  b.fillRect(0, horizon, w, groundTop - horizon);
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = 2;
  for (i = 0; i < 40; i++) {
    x = (i * 173.1) % w;
    var wy = horizon + h * 0.03 + ((i * 61) % Math.max(1, (groundTop - horizon - h * 0.06)));
    b.beginPath(); b.moveTo(x, wy); b.quadraticCurveTo(x + h * 0.03, wy - h * 0.008, x + h * 0.06, wy); b.stroke();
  }
  // Ranta ja polku (hiekka)
  var sand = b.createLinearGradient(0, groundTop - h * 0.02, 0, h);
  sand.addColorStop(0, '#fff0c9');
  sand.addColorStop(0.3, '#f3dfae');
  sand.addColorStop(1, '#e2c68d');
  b.fillStyle = sand;
  b.beginPath();
  b.moveTo(0, groundTop - h * 0.02);
  for (x = 0; x <= w; x += 14) b.lineTo(x, groundTop - h * 0.02 + Math.sin(x * 0.008) * 6);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = 'rgba(0,0,0,0.06)';
  for (i = 0; i < 90; i++) {
    x = (i * 97.7) % w;
    b.beginPath(); b.arc(x, groundTop + h * 0.03 + ((i * 37) % Math.max(1, (h - groundTop - h * 0.05))), h * 0.004, 0, Math.PI * 2); b.fill();
  }
  // Palmut
  for (i = 0; i < 7; i++) {
    x = w * (0.06 + i * 0.14) + (i % 2) * h * 0.05;
    drawPalm(b, x, groundTop - h * 0.02, h * 0.26);
  }
  drawLighthouseFrame(b, lighthouse.x, groundTop - h * 0.02, h);
}

function drawPalm(b, x, baseY, s) {
  var i;
  b.strokeStyle = '#a8763e';
  b.lineWidth = s * 0.09;
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY); b.quadraticCurveTo(x + s * 0.15, baseY - s * 0.55, x + s * 0.08, baseY - s); b.stroke();
  b.strokeStyle = '#3f9a44';
  b.lineWidth = s * 0.11;
  for (i = 0; i < 7; i++) {
    var a = -Math.PI * 0.05 + i * Math.PI * 0.18;
    b.beginPath();
    b.moveTo(x + s * 0.08, baseY - s);
    b.quadraticCurveTo(x + s * 0.08 + Math.cos(a) * s * 0.45, baseY - s - s * 0.35 + Math.sin(a) * s * 0.1, x + s * 0.08 + Math.cos(a) * s * 0.75, baseY - s + Math.sin(a) * s * 0.4 + s * 0.2);
    b.stroke();
  }
  b.fillStyle = '#8a5a30';
  b.beginPath(); b.arc(x + s * 0.06, baseY - s * 0.98, s * 0.06, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x + s * 0.13, baseY - s * 0.95, s * 0.06, 0, Math.PI * 2); b.fill();
}

function drawLighthouseFrame(b, x, baseY, h) {
  var tw = h * 0.07, th = h * 0.32, i;
  for (i = 0; i < 4; i++) {
    b.fillStyle = i % 2 ? '#ff5f7e' : '#ffffff';
    b.fillRect(x - tw / 2, baseY - th + i * th / 4, tw, th / 4);
  }
  b.fillStyle = '#5a4a6e';
  b.fillRect(x - tw * 0.65, baseY - th - h * 0.06, tw * 1.3, h * 0.06);
  b.fillStyle = '#3a3346';
  b.beginPath(); b.moveTo(x - tw * 0.75, baseY - th - h * 0.06); b.lineTo(x + tw * 0.75, baseY - th - h * 0.06); b.lineTo(x, baseY - th - h * 0.12); b.closePath(); b.fill();
}

function drawShell(c, x, y, s, color) {
  var i;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - s * 0.8, y);
  c.arc(x, y, s * 0.8, Math.PI, 0);
  c.lineTo(x, y + s * 0.75);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(160,110,90,0.5)';
  c.lineWidth = Math.max(1, s * 0.08);
  for (i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(x, y + s * 0.7); c.lineTo(x + i * s * 0.32, y - s * 0.5 + Math.abs(i) * s * 0.12); c.stroke();
  }
}

function drawCrab(c, cr) {
  var x = cr.x - camX, y = cr.y, s = viewH * 0.03;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var i;
  c.save();
  c.translate(x, y);
  c.strokeStyle = '#d9502a';
  c.lineWidth = s * 0.18;
  c.lineCap = 'round';
  for (i = -1; i <= 1; i++) {
    var lift = Math.sin(cr.t + i) * s * 0.15;
    c.beginPath(); c.moveTo(-s * 0.6, s * 0.1); c.lineTo(-s * 1.3, s * 0.6 + i * s * 0.25 + lift); c.stroke();
    c.beginPath(); c.moveTo(s * 0.6, s * 0.1); c.lineTo(s * 1.3, s * 0.6 + i * s * 0.25 - lift); c.stroke();
  }
  c.fillStyle = '#ff6a3d';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 1.05, s * 0.7, 0, 0, Math.PI * 2);
  else c.arc(0, 0, s * 0.9, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.arc(-s * 1.25, -s * 0.5, s * 0.32, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 1.25, -s * 0.5, s * 0.32, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(-s * 0.3, -s * 0.7, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.3, -s * 0.7, s * 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(-s * 0.3, -s * 0.7, s * 0.09, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.3, -s * 0.7, s * 0.09, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawWaveOverlay(c) {
  var mid = pathMidY();
  if (wave.state === 'warn') {
    var a = 0.4 + Math.sin(globalT * 14) * 0.3;
    c.fillStyle = 'rgba(255,255,255,' + Math.max(0, a) + ')';
    c.fillRect(0, groundBottom - viewH * 0.02, viewW, viewH * 0.03);
    c.fillStyle = 'rgba(120,200,240,0.25)';
    c.fillRect(0, groundBottom - viewH * 0.06, viewW, viewH * 0.1);
  } else if (wave.state === 'wash') {
    var p = wave.t / 0.9;
    var top = mid + (groundBottom - mid) * (1 - Math.sin(p * Math.PI)) * 0.4;
    var g = c.createLinearGradient(0, top, 0, viewH);
    g.addColorStop(0, 'rgba(210,240,255,0.9)');
    g.addColorStop(0.2, 'rgba(90,190,230,0.65)');
    g.addColorStop(1, 'rgba(40,140,190,0.55)');
    c.fillStyle = g;
    c.fillRect(0, top, viewW, viewH - top);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    var i;
    for (i = 0; i < 14; i++) {
      c.beginPath(); c.arc((i / 14) * viewW + Math.sin(globalT * 6 + i) * 10, top, viewH * 0.012, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawLighthouseGlow(c) {
  var x = lighthouse.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var ly = groundTop - h * 0.02 - h * 0.32 - h * 0.03;
  if (lighthouse.open) {
    var g = c.createRadialGradient(x, ly, h * 0.01, x, ly, h * 0.18);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.9 + Math.sin(globalT * 5) * 0.1) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, ly, h * 0.18, 0, Math.PI * 2); c.fill();
    drawStar(c, x, ly - h * 0.1, h * 0.035, globalT, 1);
  } else {
    c.fillStyle = 'rgba(255,240,160,0.3)';
    c.beginPath(); c.arc(x, ly, h * 0.02, 0, Math.PI * 2); c.fill();
  }
}

function drawBeach() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawLighthouseGlow(ctx);
  for (i = 0; i < shells.length; i++) {
    if (shells[i].collected) continue;
    var sy = shells[i].ay + Math.sin(shells[i].phase) * viewH * 0.012;
    drawShell(ctx, shells[i].ax - camX, sy, viewH * 0.03, shells[i].color);
  }
  for (i = 0; i < crabs.length; i++) drawCrab(ctx, crabs[i]);
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  drawWaveOverlay(ctx);
  drawParticlesLayer(ctx);
  if (lighthouse.open && !celebrating) drawEdgeArrow(ctx, lighthouse.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, SHELL_COUNT, function (i2) { return shells[i2] && shells[i2].collected; },
    function (c, x, y, s) { drawShell(c, x, y, s, '#ffd6e8'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
