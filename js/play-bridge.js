'use strict';

// Sateenkaarisilta: ruutu vierii itsestään. Lennä renkaiden läpi, väistä
// ukkospilviä. Ohi mennyt rengas vie sydämen ja ilmestyy uudelleen edemmäs.
// Sydämet ja lyhdyt käytössä; sydänten loputtua palataan lyhdylle.

var RING_COUNT = 8;
var rings = [];
var thunder = [];
var bridgeScroll = 0;
var BRIDGE_SEGMENT_SPEEDS = [0.13, 0.16, 0.19];

var ringDefs = [
  { fx: 0.10, fy: 0.40 }, { fx: 0.20, fy: 0.22 }, { fx: 0.30, fy: 0.50 }, { fx: 0.42, fy: 0.30 },
  { fx: 0.56, fy: 0.46 }, { fx: 0.66, fy: 0.20 }, { fx: 0.78, fy: 0.42 }, { fx: 0.88, fy: 0.28 }
];

function initBridge() {
  var i;
  level = 8;
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
  tasks = [makeTask(0.48, 'compare')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.34, 0.68]);
  rings = [];
  for (i = 0; i < RING_COUNT; i++) {
    rings.push({
      ax: ringDefs[i].fx * worldW, ay: groundTop - ringDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      color: maneColors[i % maneColors.length],
      onRestore: function (r) { r.ax = r.homeX; r.ay = r.homeY; }
    });
    rings[i].homeX = rings[i].ax;
    rings[i].homeY = rings[i].ay;
  }
  thunder = [];
  var tFx = [0.16, 0.36, 0.52, 0.62, 0.74, 0.84];
  for (i = 0; i < tFx.length; i++) {
    thunder.push({ fx: tFx[i], x: tFx[i] * worldW, baseY: viewH * (0.3 + (i % 3) * 0.12), y: 0, amp: viewH * (0.08 + (i % 2) * 0.08), t: i * 1.3, f: 1.2 + (i % 3) * 0.3 });
  }
  princess.x = viewW * 0.25;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  document.body.style.background = '#2a1f5e';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'block';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.2, 'sine', 0.35);
  playNote(659, 0.1, 0.2, 'sine', 0.35);
  playNote(784, 0.2, 0.3, 'triangle', 0.35);
}

function respawnBridge() {
  var i;
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  // Lyhdyn jälkeiset renkaat takaisin kotipaikoilleen
  for (i = 0; i < rings.length; i++) {
    if (rings[i].homeX > checkpoint.x - viewW * 0.1 && !rings[i].collected) {
      rings[i].ax = rings[i].homeX;
      rings[i].ay = rings[i].homeY;
    }
  }
  spawnSparkles(princess.x, princess.y, 14, '#ffe27a');
}

function resizeBridge(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < rings.length; i++) {
    rings[i].ax *= ratio;
    rings[i].homeX = ringDefs[i].fx * worldW;
    rings[i].homeY = groundTop - ringDefs[i].fy * viewH;
    rings[i].ay = groundTop - ringDefs[i].fy * viewH;
  }
  for (i = 0; i < thunder.length; i++) thunder[i].x = thunder[i].fx * worldW;
}

function bridgeSpeed() {
  var seg = camX / Math.max(1, worldW);
  var idx = seg < 0.34 ? 0 : (seg < 0.68 ? 1 : 2);
  return viewW * BRIDGE_SEGMENT_SPEEDS[idx];
}

function collectRing(r) {
  r.collected = true;
  registerCollected(r);
  spawnSparkles(r.ax, r.ay, 16, r.color);
  playNote(660 + countCollected(rings) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(rings) * 55, 0.08, 0.3, 'triangle', 0.3);
}

function missRing(r) {
  loseHeart();
  spawnSparkles(r.ax, r.ay, 8, '#c9c9e0');
  // Rengas leijuu edemmäs uuteen paikkaan, jotta kentän voi yhä läpäistä
  var ahead = camX + viewW * (1.1 + Math.random() * 0.2);
  r.ax = Math.min(ahead, worldW - viewW * 0.12);
  r.ay = groundTop - viewH * (0.18 + Math.random() * 0.34);
}

function handleBridgeTap(px, py) {
  // Ohjaus on pito + siivenisku; napautukselle ei erillistä tointa
}

function updateBridge(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Vieritys: pysähtyy tehtäväkaaren eteen ja maailman lopussa
  var scrolling = !busy && !celebrating;
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x - princess.x < viewW * 0.3 && tasks[i].x > princess.x - viewW * 0.05) scrolling = false;
  }
  var maxCam = Math.max(0, worldW - viewW);
  if (scrolling && camX < maxCam) {
    camX = Math.min(maxCam, camX + bridgeSpeed() * dt);
  }

  // Lento (kuten taivaalla)
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.6 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.75 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.3) princess.vx = viewW * 0.3;
  if (princess.vx < -viewW * 0.3) princess.vx = -viewW * 0.3;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;
  if (!busy) {
    princess.x += princess.vx * dt;
    princess.y += princess.vy * dt;
  }
  // Ruudun sisällä: vieritys työntää mukanaan
  princess.x = Math.min(Math.max(princess.x, camX + viewW * 0.08), camX + viewW * 0.7);
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();
  princess.walkPhase += dt * 6;
  updateCheckpoints(princess.x, princess.y);

  // Renkaat
  var endZone = camX >= maxCam - 2;
  for (i = 0; i < rings.length; i++) {
    var r = rings[i];
    if (r.collected) continue;
    r.phase += dt * 2;
    var ry = r.ay + Math.sin(r.phase) * viewH * 0.01;
    var rr = viewH * 0.075;
    var dx = princess.x - r.ax, dy = princess.y - viewH * 0.06 - ry;
    if (Math.abs(dx) < rr * 0.5 && Math.abs(dy) < rr * 0.85) {
      collectRing(r);
      continue;
    }
    if (endZone) {
      // Lopussa jäljellä olevat renkaat leijuvat näkyville
      if (r.ax < camX + viewW * 0.05 || r.ax > camX + viewW * 0.95) {
        r.ax = camX + viewW * (0.5 + Math.random() * 0.4);
      }
    } else if (r.ax < camX + viewW * 0.02 && !busy) {
      missRing(r);
    }
  }

  // Ukkospilvet
  for (i = 0; i < thunder.length; i++) {
    var th = thunder[i];
    th.t += dt;
    th.y = th.baseY + Math.sin(th.t * th.f) * th.amp;
    var tdx = th.x - princess.x, tdy = th.y - (princess.y - viewH * 0.06);
    if (!celebrating && tdx * tdx + tdy * tdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        princess.vx = (tdx > 0 ? -1 : 1) * viewW * 0.25;
        princess.vy = viewH * 0.3;
        spawnSparkles(princess.x, princess.y, 12, '#ffe94f');
      }
    }
  }

  if (Math.random() < dt * 8) spawnSparkles(princess.x - princess.facing * 20, princess.y - viewH * 0.02, 1, '#ffd6ff');

  if (!celebrating && countCollected(rings) === RING_COUNT && princess.x > worldW * 0.9) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderBridgeBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b1450');
  sky.addColorStop(0.6, '#4a2f8a');
  sky.addColorStop(1, '#8a5cc8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 80; i++) {
    x = (i * 173.3) % w;
    b.globalAlpha = 0.3 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, (i * 97.1) % (h * 0.6), 1.4 + (i % 3), 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  // Sateenkaarisilta aaltoilee koko maailman läpi
  var band = h * 0.022;
  b.lineWidth = band;
  for (i = 0; i < maneColors.length; i++) {
    b.strokeStyle = maneColors[i];
    b.globalAlpha = 0.55;
    b.beginPath();
    for (x = 0; x <= w; x += 16) {
      var y = h * 0.78 + Math.sin(x * 0.0025) * h * 0.06 + i * band;
      if (x === 0) b.moveTo(x, y); else b.lineTo(x, y);
    }
    b.stroke();
  }
  b.globalAlpha = 1;
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 12; i++) {
    cloudShape(b, w * (0.04 + i * 0.085), h * (0.86 + (i % 2) * 0.06), h * 0.04);
  }
  drawCastle(b, w * 0.95, h * 0.78, h * 0.26);
}

function drawRing(c, r) {
  var x = r.ax - camX, y = r.ay + Math.sin(r.phase) * viewH * 0.01;
  var rr = viewH * 0.075;
  if (x < -rr * 2 || x > viewW + rr * 2) return;
  c.save();
  c.strokeStyle = r.color;
  c.lineWidth = viewH * 0.014;
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rr * 0.45, rr, 0, 0, Math.PI * 2);
  else c.arc(x, y, rr * 0.7, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = viewH * 0.005;
  c.stroke();
  c.restore();
}

function drawThunderCloud(c, th) {
  var x = th.x - camX, y = th.y, s = viewH * 0.035;
  if (x < -s * 6 || x > viewW + s * 6) return;
  c.fillStyle = '#5a5f78';
  cloudShape(c, x, y, s);
  c.fillStyle = 'rgba(255,255,255,0.2)';
  cloudShape(c, x - s * 0.3, y - s * 0.5, s * 0.5);
  if (Math.sin(th.t * 9) > 0.6) {
    c.fillStyle = '#ffe94f';
    c.beginPath();
    c.moveTo(x, y + s * 1.0);
    c.lineTo(x - s * 0.3, y + s * 1.7);
    c.lineTo(x + s * 0.05, y + s * 1.7);
    c.lineTo(x - s * 0.2, y + s * 2.3);
    c.lineTo(x + s * 0.4, y + s * 1.5);
    c.lineTo(x + s * 0.05, y + s * 1.5);
    c.lineTo(x + s * 0.3, y + s * 1.0);
    c.closePath();
    c.fill();
  }
}

function drawRainbowGem(c, x, y, s) {
  var i;
  for (i = 0; i < 3; i++) {
    c.strokeStyle = maneColors[i * 2];
    c.lineWidth = Math.max(2, s * 0.28);
    c.beginPath();
    c.arc(x, y + s * 0.3, s * (1 - i * 0.28), Math.PI, 0);
    c.stroke();
  }
}

function drawSkyLantern(c, cp) {
  var x = cp.x - camX, y = viewH * 0.5, s = viewH * 0.04;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (cp.lit) {
    var g = c.createRadialGradient(x, y, s * 0.2, x, y, s * 2.2);
    g.addColorStop(0, 'rgba(255,230,140,0.7)');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, s * 2.2, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = cp.lit ? '#ffe27a' : 'rgba(255,255,255,0.35)';
  roundRect(c, x - s * 0.5, y - s * 0.8, s, s * 1.6, s * 0.3);
  c.fill();
  c.fillStyle = '#7a6a8e';
  c.fillRect(x - s * 0.6, y - s * 0.95, s * 1.2, s * 0.18);
  c.fillRect(x - s * 0.6, y + s * 0.78, s * 1.2, s * 0.18);
}

function drawBridge() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  for (i = 0; i < rings.length; i++) {
    if (!rings[i].collected) drawRing(ctx, rings[i]);
  }
  for (i = 0; i < thunder.length; i++) drawThunderCloud(ctx, thunder[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, RING_COUNT, function (i2) { return rings[i2] && rings[i2].collected; }, drawRainbowGem);
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
