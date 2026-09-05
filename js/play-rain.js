'use strict';

// Sadesuoja: sadealueilla taivaalta tippuu mustetahroja. Piirretty viiva toimii
// sateenvarjona: tahrat jäävät viivan päälle. Sama muste sillaksi ja suojaksi.
// Mustepullot täyttävät musteen ja avaavat aurinko-oven. Sydämet käytössä.

var RAIN_BOTTLES = 6;
var rainBottles = [];
var rainBlots = [];
var rainT = 0;
var rainGround = [[0.0, 0.16], [0.21, 0.44], [0.49, 0.70], [0.75, 1.0]];
var rainZones = [[0.22, 0.44], [0.50, 0.70], [0.76, 0.94]];
var rainGate = { fx: 0.96, x: 0, open: false };
var rainBottleDefs = [
  { fx: 0.08, fy: 0.10 }, { fx: 0.185, fy: 0.34 }, { fx: 0.33, fy: 0.12 },
  { fx: 0.465, fy: 0.34 }, { fx: 0.60, fy: 0.12 }, { fx: 0.725, fy: 0.36 }
];

function layoutRain() {
  var i, seg;
  platforms = [];
  for (i = 0; i < rainGround.length; i++) {
    seg = rainGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: groundTop, w: (seg[1] - seg[0]) * worldW });
  }
  rainGate.x = rainGate.fx * worldW;
  for (i = 0; i < rainBottles.length; i++) {
    rainBottles[i].ax = rainBottleDefs[i].fx * worldW;
    rainBottles[i].ay = groundTop - rainBottleDefs[i].fy * viewH;
  }
}

function initRain() {
  var i;
  setupRunLevel(18, '#e9eef7');
  penCoreReset();
  rainBottles = [];
  for (i = 0; i < RAIN_BOTTLES; i++) rainBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  rainBlots = [];
  rainT = 1.5;
  layoutRain();
  tasks = [makeTask(0.36, 'count'), makeTask(0.64, 'match')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.46, 0.72]);
  rainGate.open = false;
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(440, 0, 0.25, 'sine', 0.3);
  playNote(587, 0.15, 0.35, 'triangle', 0.3);
}

function respawnRain() {
  resetPrincess(checkpoint.x, groundTop);
  princess.facing = penDir = 1;
  penStun = 0;
  rainBlots = [];
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeRain(ratio) {
  var i;
  princess.x *= ratio;
  layoutRain();
  for (i = 0; i < rainBlots.length; i++) rainBlots[i].x *= ratio;
  penCoreResize(ratio);
}

function rainFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var rx = penPitEdgeX(rainGround, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, groundTop);
    penStun = 0;
  }
}

function rainZoneAt(x) {
  var i, f = x / worldW;
  for (i = 0; i < rainZones.length; i++) if (f >= rainZones[i][0] && f <= rainZones[i][1]) return rainZones[i];
  return null;
}

function collectRainBottle(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(700 + countCollected(rainBottles) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(rainBottles) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(rainBottles) === RAIN_BOTTLES && !rainGate.open) {
    rainGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function updateRain(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);

  // Sade: sadealueella tahroja tippuu prinsessan lähelle
  var zone = rainZoneAt(princess.x);
  if (zone && !busy && !celebrating && !rainGate.open) {
    rainT -= dt;
    if (rainT <= 0) {
      rainT = 0.8 + Math.random() * 0.6;
      var bx = princess.x + (Math.random() - 0.5) * viewW * 0.36;
      bx = Math.min(Math.max(bx, zone[0] * worldW), zone[1] * worldW);
      rainBlots.push({ x: bx, y: -viewH * 0.05, vy: viewH * 0.3, t: 0 });
    }
  }
  for (i = rainBlots.length - 1; i >= 0; i--) {
    var bl = rainBlots[i];
    if (busy) continue;
    bl.t += dt;
    bl.vy += viewH * 0.55 * dt;
    var oldY = bl.y, newY = bl.y + bl.vy * dt;
    var hit = penFallHit(bl.x, oldY, newY);
    if (hit) {
      // Viivan päälle tai maahan: läiskähdys
      spawnSparkles(bl.x, hit.y, hit.ground ? 6 : 12, hit.ground ? '#9aa0b8' : '#c9a0ff');
      playNote(hit.ground ? 200 : 520, 0, 0.08, 'sine', hit.ground ? 0.12 : 0.2);
      rainBlots.splice(i, 1);
      continue;
    }
    bl.y = newY;
    var hdx = bl.x - princess.x, hdy = bl.y - (princess.y - viewH * 0.1);
    if (!celebrating && hdx * hdx + hdy * hdy < viewH * 0.06 * viewH * 0.06) {
      if (loseHeart()) {
        penStun = 0.6;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#5a5a7a');
      }
      rainBlots.splice(i, 1);
      continue;
    }
    if (bl.y > viewH + 20) rainBlots.splice(i, 1);
  }

  if (!busy && !celebrating) penPrincessStep(dt, { onFall: rainFell });
  blockPrincessAtTasks();

  for (i = 0; i < rainBottles.length; i++) {
    var d = rainBottles[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectRainBottle(d);
  }

  if (rainGate.open && !celebrating && Math.abs(princess.x - rainGate.x) < viewH * 0.07) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderRainBg(b, w, h) {
  var i, k, x, z;
  renderPaperScene(b, w, h, rainGround, null, { sky: 'rgba(200,210,235,0.35)', sun: false, clouds: false, hill1: '#d3e3d0', hill2: '#c0d6bd' });
  // Sadepilvet sadealueiden yllä ja lätäköt maassa
  for (i = 0; i < rainZones.length; i++) {
    z = rainZones[i];
    b.fillStyle = '#8a8fa8';
    for (x = z[0] * w; x < z[1] * w; x += h * 0.09) cloudShape(b, x + h * 0.04, h * 0.07 + (Math.floor(x / (h * 0.09)) % 2) * h * 0.02, h * 0.03);
    b.fillStyle = 'rgba(120,150,220,0.35)';
    for (k = 0; k < 4; k++) {
      x = z[0] * w + (k + 0.5) * (z[1] - z[0]) * w / 4;
      b.beginPath();
      if (b.ellipse) b.ellipse(x, groundTop + h * 0.05, h * 0.05, h * 0.012, 0, 0, Math.PI * 2);
      else b.arc(x, groundTop + h * 0.05, h * 0.03, 0, Math.PI * 2);
      b.fill();
    }
  }
  // Aurinko-ovi lopussa
  var gx = rainGate.x, s = h * 0.12;
  b.fillStyle = '#a9743f';
  b.fillRect(gx - s * 0.75, groundTop - s * 1.6, s * 0.25, s * 1.6);
  b.fillRect(gx + s * 0.5, groundTop - s * 1.6, s * 0.25, s * 1.6);
  b.beginPath(); b.arc(gx, groundTop - s * 1.6, s * 0.75, Math.PI, 0); b.lineTo(gx + s * 0.5, groundTop - s * 1.6); b.arc(gx, groundTop - s * 1.6, s * 0.5, 0, Math.PI, true); b.closePath(); b.fill();
}

function drawRainBlot(c, bl) {
  var x = bl.x - camX, y = bl.y, s = viewH * 0.022;
  if (x < -s * 4 || x > viewW + s * 4) return;
  c.fillStyle = 'rgba(90,90,122,0.5)';
  c.beginPath(); c.moveTo(x - s * 0.3, y - s * 1.6); c.lineTo(x + s * 0.3, y - s * 1.6); c.lineTo(x + s * 0.15, y); c.lineTo(x - s * 0.15, y); c.closePath(); c.fill();
  c.fillStyle = '#4a4560';
  c.beginPath(); c.arc(x, y, s * 0.6, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.45, y + s * 0.3, s * 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.5, y + s * 0.25, s * 0.25, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.arc(x - s * 0.2, y - s * 0.2, s * 0.15, 0, Math.PI * 2); c.fill();
}

function drawRainStreaks(c) {
  var i, k, z, x0, x1;
  c.strokeStyle = 'rgba(120,130,170,0.35)';
  c.lineWidth = Math.max(1, viewH * 0.003);
  for (i = 0; i < rainZones.length; i++) {
    z = rainZones[i];
    x0 = z[0] * worldW - camX; x1 = z[1] * worldW - camX;
    if (x1 < 0 || x0 > viewW) continue;
    for (k = 0; k < 40; k++) {
      var sx = x0 + ((k * 131.7) % Math.max(1, (x1 - x0)));
      var sy = ((globalT * viewH * 0.6 + k * 97) % (groundTop - viewH * 0.1)) + viewH * 0.1;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - viewH * 0.006, sy + viewH * 0.03); c.stroke();
    }
  }
}

function drawRainGateGlow(c) {
  var x = rainGate.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = rainGate.open ? 'rgba(255,240,170,' + (0.8 + Math.sin(globalT * 4) * 0.15) + ')' : 'rgba(90,90,122,0.6)';
  c.beginPath(); c.arc(x, groundTop - s * 1.6, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, groundTop); c.lineTo(x - s * 0.5, groundTop); c.closePath(); c.fill();
  c.fillStyle = rainGate.open ? '#ffe27a' : '#b8b4c8';
  c.beginPath(); c.arc(x, groundTop - s * 1.0, s * 0.22, 0, Math.PI * 2); c.fill();
  if (rainGate.open) drawStar(c, x, groundTop - s * 2.7, h * 0.035, globalT, 1);
}

function drawRain() {
  var i;
  if (!drawWorldBg()) return;
  drawRainStreaks(ctx);
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawRainGateGlow(ctx);
  for (i = 0; i < rainBottles.length; i++) {
    if (rainBottles[i].collected) continue;
    drawInkBottle(ctx, rainBottles[i].ax - camX, rainBottles[i].ay + Math.sin(rainBottles[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  drawPenPrincess(ctx);
  for (i = 0; i < rainBlots.length; i++) drawRainBlot(ctx, rainBlots[i]);
  drawPenBubblesLayer(ctx);
  drawParticlesLayer(ctx);
  if (rainGate.open && !celebrating) drawEdgeArrow(ctx, rainGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, RAIN_BOTTLES, function (i2) { return rainBottles[i2] && rainBottles[i2].collected; },
    function (c, x, y, s2) { drawInkBottle(c, x, y, s2 * 0.75); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
