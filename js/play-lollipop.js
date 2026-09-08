'use strict';

// Tikkumetsä: ratsastus karkkimaisemassa. Tikkarit kerätään sormella tai
// ohitse ratsastaen, salmiakkipyörät vierivät polulla ja vievät sydämen.
// Karkkiportti aukeaa, kun kaikki tikkarit on kerätty. Sydämet käytössä.

var LOLLY_COUNT = 8;
var lollies = [];
var lollyWheels = [];
var lollyGate = { fx: 0.96, x: 0, open: false };
var lollyDefs = [
  { fx: 0.08, fy: 0.18 }, { fx: 0.16, fy: 0.26 }, { fx: 0.25, fy: 0.15 }, { fx: 0.39, fy: 0.24 },
  { fx: 0.50, fy: 0.14 }, { fx: 0.62, fy: 0.27 }, { fx: 0.73, fy: 0.17 }, { fx: 0.87, fy: 0.23 }
];
var LOLLY_COLORS = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#c9a0ff', '#ff9f3a', '#5fd36b', '#ff8fd0', '#8ecbff'];

function lollyPathY() {
  return (groundTop + groundBottom) / 2;
}

function initLollipop() {
  var i;
  tasks = [makeTask(0.32, 'count'), makeTask(0.68, 'odd')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.72]);
  lollies = [];
  for (i = 0; i < LOLLY_COUNT; i++) {
    lollies.push({
      ax: lollyDefs[i].fx * worldW, ay: groundTop - lollyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: LOLLY_COLORS[i % LOLLY_COLORS.length]
    });
  }
  lollyWheels = [
    { zA: 0.13, zB: 0.25, x: 0.19 * worldW, y: groundTop + viewH * 0.06, dir: 1, t: 0 },
    { zA: 0.45, zB: 0.61, x: 0.53 * worldW, y: groundTop + viewH * 0.15, dir: -1, t: 1 },
    { zA: 0.80, zB: 0.92, x: 0.86 * worldW, y: groundTop + viewH * 0.10, dir: 1, t: 2 }
  ];
  lollyGate.x = lollyGate.fx * worldW;
  lollyGate.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = lollyPathY() - viewH * 0.04;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  renderBackground();
  playNote(659, 0, 0.25, 'sine', 0.35);
  playNote(880, 0.12, 0.3, 'triangle', 0.3);
}

function respawnLollipop() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = lollyPathY() - viewH * 0.04;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeLollipop(ratio) {
  var i;
  for (i = 0; i < lollies.length; i++) {
    lollies[i].ax = lollyDefs[i].fx * worldW;
    lollies[i].ay = groundTop - lollyDefs[i].fy * viewH;
  }
  for (i = 0; i < lollyWheels.length; i++) lollyWheels[i].x *= ratio;
  lollyGate.x = lollyGate.fx * worldW;
}

function collectLolly(lo) {
  lo.collected = true;
  registerCollected(lo);
  spawnSparkles(lo.ax, lo.ay, 14, lo.color);
  playNote(720 + countCollected(lollies) * 55, 0, 0.25, 'sine', 0.4);
  playNote(1080 + countCollected(lollies) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(lollies) === LOLLY_COUNT && !lollyGate.open) {
    lollyGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleLollipopTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < lollies.length; i++) {
    var lo = lollies[i];
    if (lo.collected) continue;
    dx = wx - lo.ax;
    dy = wy - (lo.ay + Math.sin(lo.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectLolly(lo);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateLollipop(dt) {
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

  // Tikkarit kimaltelevat; niiden läpi voi myös ratsastaa
  for (i = 0; i < lollies.length; i++) {
    var lo = lollies[i];
    lo.phase += dt * 2;
    if (!lo.collected && !busy && !celebrating) {
      dx = lo.ax - unicorn.x;
      dy = lo.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectLolly(lo);
    }
  }

  // Salmiakkipyörät vierivät polulla edestakaisin
  for (i = 0; i < lollyWheels.length; i++) {
    var wh = lollyWheels[i];
    wh.t += dt * 8;
    if (!busy && !celebrating) {
      wh.x += wh.dir * viewW * 0.06 * dt;
      if (wh.x < wh.zA * worldW) { wh.x = wh.zA * worldW; wh.dir = 1; }
      if (wh.x > wh.zB * worldW) { wh.x = wh.zB * worldW; wh.dir = -1; }
    }
    if (!celebrating && Math.abs(wh.x - unicorn.x) < viewH * 0.06 && Math.abs(wh.y - unicorn.y) < viewH * 0.07) {
      if (loseHeart()) {
        var push = unicorn.x < wh.x ? -1 : 1;
        unicorn.tx = Math.min(Math.max(unicorn.x + push * viewW * 0.08, viewW * 0.05), worldW - viewW * 0.03);
        unicorn.ty = unicorn.y;
        spawnSparkles(unicorn.x, unicorn.y - viewH * 0.08, 10, '#5a4a6e');
      }
    }
  }

  if (lollyGate.open && !celebrating && Math.abs(unicorn.x - lollyGate.x) < viewH * 0.09) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderLollipopBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#ffb8dd');
  sky.addColorStop(1, '#ffe9f4');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, groundTop + 2);
  var sunX = w * 0.16, sunY = h * 0.16, sunR = h * 0.06;
  b.fillStyle = '#fff1a8';
  b.beginPath(); b.arc(sunX, sunY, sunR, 0, Math.PI * 2); b.fill();
  b.strokeStyle = 'rgba(255,241,168,0.7)';
  b.lineWidth = h * 0.008;
  for (i = 0; i < 8; i++) {
    var a = i * Math.PI / 4;
    b.beginPath();
    b.moveTo(sunX + Math.cos(a) * sunR * 1.25, sunY + Math.sin(a) * sunR * 1.25);
    b.lineTo(sunX + Math.cos(a) * sunR * 1.6, sunY + Math.sin(a) * sunR * 1.6);
    b.stroke();
  }
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 8; i++) cloudShape(b, w * (0.04 + i * 0.125), h * (0.1 + (i % 3) * 0.08), h * 0.03);
  // Karkkimäet taustalla
  b.fillStyle = '#f7a8cd';
  for (i = 0; i < 9; i++) {
    x = w * (i / 8);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.13 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  // Tikkaripuut
  for (i = 0; i < 7; i++) {
    x = w * (0.07 + i * 0.14) + (i % 2) * h * 0.04;
    loBgTree(b, x, groundTop - h * 0.01, h * 0.2, LOLLY_COLORS[(i * 3) % LOLLY_COLORS.length]);
  }
  // Maitokarkkimaa ja polku
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#c8f2d8');
  ground.addColorStop(1, '#8fd9a8');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,250,0.55)';
  b.fillRect(0, groundTop + h * 0.02, w, groundBottom - groundTop - h * 0.02);
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, LOLLY_COLORS[i % LOLLY_COLORS.length]);
  }
  // Karkkiportti: kaksi keppiä ja kaari
  var gx = lollyGate.x, gs = h * 0.3;
  b.strokeStyle = '#ff5f7e';
  b.lineWidth = h * 0.028;
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(gx - gs * 0.32, groundTop); b.lineTo(gx - gs * 0.32, groundTop - gs); b.stroke();
  b.beginPath(); b.moveTo(gx + gs * 0.32, groundTop); b.lineTo(gx + gs * 0.32, groundTop - gs); b.stroke();
  b.strokeStyle = '#ffffff';
  b.lineWidth = h * 0.012;
  for (i = 0; i < 4; i++) {
    b.beginPath(); b.moveTo(gx - gs * 0.32 - h * 0.012, groundTop - gs * (0.15 + i * 0.25)); b.lineTo(gx - gs * 0.32 + h * 0.012, groundTop - gs * (0.25 + i * 0.25)); b.stroke();
    b.beginPath(); b.moveTo(gx + gs * 0.32 - h * 0.012, groundTop - gs * (0.15 + i * 0.25)); b.lineTo(gx + gs * 0.32 + h * 0.012, groundTop - gs * (0.25 + i * 0.25)); b.stroke();
  }
  b.strokeStyle = '#ff5f7e';
  b.lineWidth = h * 0.028;
  b.beginPath(); b.arc(gx, groundTop - gs, gs * 0.32, Math.PI, 0); b.stroke();
}

function loBgTree(b, x, baseY, s, color) {
  b.strokeStyle = '#ffffff';
  b.lineWidth = s * 0.09;
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, baseY); b.lineTo(x, baseY - s * 0.75); b.stroke();
  b.strokeStyle = 'rgba(255,95,126,0.6)';
  b.lineWidth = s * 0.035;
  b.beginPath(); b.moveTo(x - s * 0.04, baseY - s * 0.1); b.lineTo(x + s * 0.04, baseY - s * 0.35); b.stroke();
  b.beginPath(); b.moveTo(x + s * 0.04, baseY - s * 0.4); b.lineTo(x - s * 0.04, baseY - s * 0.65); b.stroke();
  b.fillStyle = color;
  b.beginPath(); b.arc(x, baseY - s * 0.92, s * 0.28, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.65)';
  b.beginPath(); b.arc(x - s * 0.09, baseY - s * 1.02, s * 0.09, 0, Math.PI * 2); b.fill();
}

function loDrawLolly(c, x, y, s, color) {
  c.strokeStyle = '#ffffff';
  c.lineWidth = s * 0.22;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + s * 0.5); c.lineTo(x, y + s * 1.6); c.stroke();
  c.fillStyle = color;
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = s * 0.16;
  c.beginPath(); c.arc(x, y, s * 0.62, Math.PI * 0.2, Math.PI * 1.2); c.stroke();
  c.beginPath(); c.arc(x, y, s * 0.3, Math.PI * 1.2, Math.PI * 2.2); c.stroke();
}

function loDrawWheel(c, wh) {
  var x = wh.x - camX, y = wh.y, s = viewH * 0.035;
  if (x < -s * 4 || x > viewW + s * 4) return;
  c.save();
  c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath();
  if (c.ellipse) c.ellipse(0, s * 0.85, s * 0.9, s * 0.22, 0, 0, Math.PI * 2);
  else c.arc(0, s * 0.85, s * 0.6, 0, Math.PI * 2);
  c.fill();
  c.rotate(wh.t * wh.dir * 0.35);
  c.fillStyle = '#2e2a38';
  c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#f4f0ff';
  c.lineWidth = s * 0.2;
  var i;
  for (i = 0; i < 3; i++) {
    c.beginPath(); c.arc(0, 0, s * (0.35 + i * 0.24), i * 0.9, i * 0.9 + Math.PI * 1.1); c.stroke();
  }
  c.restore();
}

function loDrawGateGlow(c) {
  var x = lollyGate.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var gy = groundTop - h * 0.32;
  if (lollyGate.open) {
    var g = c.createRadialGradient(x, gy, h * 0.01, x, gy, h * 0.16);
    g.addColorStop(0, 'rgba(255,214,240,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,214,240,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, gy, h * 0.16, 0, Math.PI * 2); c.fill();
    drawStar(c, x, gy - h * 0.06, h * 0.03, globalT, 1);
  } else {
    c.fillStyle = 'rgba(255,214,240,0.3)';
    c.beginPath(); c.arc(x, gy, h * 0.018, 0, Math.PI * 2); c.fill();
  }
}

function drawLollipop() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  loDrawGateGlow(ctx);
  for (i = 0; i < lollies.length; i++) {
    if (lollies[i].collected) continue;
    var ly = lollies[i].ay + Math.sin(lollies[i].phase) * viewH * 0.012;
    loDrawLolly(ctx, lollies[i].ax - camX, ly, viewH * 0.028, lollies[i].color);
  }
  for (i = 0; i < lollyWheels.length; i++) loDrawWheel(ctx, lollyWheels[i]);
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (lollyGate.open && !celebrating) drawEdgeArrow(ctx, lollyGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, LOLLY_COUNT, function (i2) { return lollies[i2] && lollies[i2].collected; },
    function (c, x, y, s) { loDrawLolly(c, x, y, s, '#ff5f7e'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
