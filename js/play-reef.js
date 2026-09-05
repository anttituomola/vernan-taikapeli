'use strict';

// Merenpohja: uidaan sormea kohti (↑ = potku ylöspäin), helmet kerätään
// simpukoista, meduusat pistävät ja virtaukset työntävät. Sydämet käytössä.

var PEARL_COUNT = 8;
var reefPearls = [];
var jellies = [];
var currents = [];
var chest = { fx: 0.95, x: 0, open: false };
// fy = korkeus ruudun yläreunasta (osuus viewH:sta); vesi ulottuu 0.14 … 0.91
var pearlDefs = [
  { fx: 0.08, fy: 0.58 }, { fx: 0.17, fy: 0.28 }, { fx: 0.27, fy: 0.76 }, { fx: 0.40, fy: 0.32 },
  { fx: 0.50, fy: 0.70 }, { fx: 0.60, fy: 0.24 }, { fx: 0.73, fy: 0.74 }, { fx: 0.86, fy: 0.36 }
];
var jellyDefs = [
  { fx: 0.22, baseY: 0.48, amp: 0.20, phase: 0, speed: 0.9 },
  { fx: 0.45, baseY: 0.42, amp: 0.24, phase: 2, speed: 1.1 },
  { fx: 0.56, baseY: 0.62, amp: 0.16, phase: 1, speed: 1.0 },
  { fx: 0.80, baseY: 0.46, amp: 0.24, phase: 3, speed: 1.2 }
];
var currentDefs = [{ fx: 0.36, fy: 0.5, dir: -1 }, { fx: 0.70, fy: 0.36, dir: 1 }];

function reefFloorY() {
  return groundBottom - viewH * 0.03;
}

function layoutReef() {
  var i;
  for (i = 0; i < reefPearls.length; i++) {
    reefPearls[i].ax = pearlDefs[i].fx * worldW;
    reefPearls[i].ay = pearlDefs[i].fy * viewH;
  }
  for (i = 0; i < jellies.length; i++) {
    jellies[i].x = jellyDefs[i].fx * worldW;
    jellies[i].baseY = jellyDefs[i].baseY * viewH;
    jellies[i].amp = jellyDefs[i].amp * viewH;
  }
  for (i = 0; i < currents.length; i++) {
    currents[i].x = currentDefs[i].fx * worldW;
    currents[i].y = currentDefs[i].fy * viewH;
  }
  chest.x = chest.fx * worldW;
}

function initReef() {
  var i;
  setupRunLevel(13, '#0b3a6b');
  tasks = [makeTask(0.32, 'pairs', { pairs: 4 }), makeTask(0.64, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.46, 0.78]);
  reefPearls = [];
  for (i = 0; i < PEARL_COUNT; i++) reefPearls.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  jellies = [];
  for (i = 0; i < jellyDefs.length; i++) jellies.push({ x: 0, y: 0, baseY: 0, amp: 0, phase: jellyDefs[i].phase, speed: jellyDefs[i].speed });
  currents = [];
  for (i = 0; i < currentDefs.length; i++) currents.push({ x: 0, y: 0, dir: currentDefs[i].dir, t: i });
  layoutReef();
  chest.open = false;
  princess.x = viewW * 0.10;
  princess.y = viewH * 0.5;
  princess.vx = 0;
  princess.vy = 0;
  princess.knockVx = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(392, 0, 0.3, 'sine', 0.3);
  playNote(523, 0.15, 0.3, 'sine', 0.3);
  playNote(659, 0.3, 0.4, 'triangle', 0.3);
}

function respawnReef() {
  princess.x = checkpoint.x;
  princess.y = viewH * 0.5;
  princess.vx = 0;
  princess.vy = 0;
  princess.knockVx = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#cfefff');
}

function resizeReef(ratio) {
  princess.x *= ratio;
  layoutReef();
}

function collectPearl(p) {
  p.collected = true;
  registerCollected(p);
  spawnSparkles(p.ax, p.ay, 14, '#ffffff');
  playNote(880 + countCollected(reefPearls) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(reefPearls) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(reefPearls) === PEARL_COUNT && !chest.open) {
    chest.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleReefTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < reefPearls.length; i++) {
    if (reefPearls[i].collected) continue;
    dx = wx - reefPearls[i].ax;
    dy = py - reefPearls[i].ay;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
      collectPearl(reefPearls[i]);
      return;
    }
  }
}

function updateReef(dt) {
  var i, pw = viewH * 0.045, floorY = reefFloorY();
  updateTasks(dt);
  var busy = puzzleBusy();

  // Uinti: kiihdytys sormea kohti, vesi jarruttaa, hiljainen vajoaminen
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.42 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.55 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 2.0);
    princess.vy *= Math.max(0, 1 - dt * 2.0);
    princess.vy += viewH * 0.05 * dt;
  }
  if (princess.knockVx) {
    princess.vx += princess.knockVx * dt * 6;
    princess.knockVx *= Math.max(0, 1 - dt * 5);
    if (Math.abs(princess.knockVx) < 5) princess.knockVx = 0;
  }
  if (princess.vx > viewW * 0.24) princess.vx = viewW * 0.24;
  if (princess.vx < -viewW * 0.24) princess.vx = -viewW * 0.24;
  if (princess.vy > viewH * 0.45) princess.vy = viewH * 0.45;
  if (princess.vy < -viewH * 0.6) princess.vy = -viewH * 0.6;

  princess.x += princess.vx * dt;
  princess.y += princess.vy * dt;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  if (princess.y < viewH * 0.16) { princess.y = viewH * 0.16; if (princess.vy < 0) princess.vy = 0; }
  if (princess.y > floorY) { princess.y = floorY; if (princess.vy > 0) princess.vy = 0; }
  blockPrincessAtTasks();

  // Virtaukset työntävät sivulle
  for (i = 0; i < currents.length; i++) {
    var cu = currents[i];
    cu.t += dt;
    if (!busy && !celebrating && Math.abs(princess.x - cu.x) < viewW * 0.08 && Math.abs(princess.y - cu.y) < viewH * 0.2) {
      princess.vx += cu.dir * viewW * 0.35 * dt;
    }
  }

  // Meduusat kelluvat ylös–alas
  for (i = 0; i < jellies.length; i++) {
    var j = jellies[i];
    if (!busy) j.phase += dt * j.speed;
    j.y = j.baseY + Math.sin(j.phase) * j.amp;
    var jdx = j.x - princess.x, jdy = j.y - (princess.y - viewH * 0.08);
    if (!celebrating && jdx * jdx + jdy * jdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        princess.knockVx = (princess.x < j.x ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.2;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ff9ecf');
      }
    }
  }

  for (i = 0; i < reefPearls.length; i++) {
    var p = reefPearls[i];
    if (p.collected) continue;
    p.phase += dt * 2;
    var dx = p.ax - princess.x, dy = p.ay - (princess.y - viewH * 0.07);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectPearl(p);
  }

  if (chest.open && !celebrating && Math.abs(princess.x - chest.x) < viewH * 0.1 && princess.y > floorY - viewH * 0.22) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  princess.walkPhase += dt * 5;
  if (Math.random() < dt * 3) spawnSparkles(princess.x - princess.facing * viewH * 0.03, princess.y - viewH * 0.14, 1, '#dff6ff');
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderReefBg(b, w, h) {
  var i, x, floorY = groundBottom - h * 0.03;
  var water = b.createLinearGradient(0, 0, 0, h);
  water.addColorStop(0, '#48bde8');
  water.addColorStop(0.45, '#1f7fbf');
  water.addColorStop(1, '#0b3a6b');
  b.fillStyle = water;
  b.fillRect(0, 0, w, h);
  // Valonsäteet
  b.fillStyle = 'rgba(255,255,255,0.07)';
  for (i = 0; i < 14; i++) {
    x = w * (0.03 + i * 0.075);
    b.beginPath();
    b.moveTo(x, 0); b.lineTo(x + h * 0.08, 0); b.lineTo(x + h * 0.32, h * 0.8); b.lineTo(x + h * 0.1, h * 0.8);
    b.closePath(); b.fill();
  }
  // Kaukaiset kalat
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 18; i++) {
    x = (i * 233.7) % w;
    var fy = h * (0.2 + ((i * 53) % 50) / 100);
    b.beginPath();
    if (b.ellipse) b.ellipse(x, fy, h * 0.018, h * 0.009, 0, 0, Math.PI * 2);
    else b.arc(x, fy, h * 0.012, 0, Math.PI * 2);
    b.fill();
    b.beginPath(); b.moveTo(x - h * 0.016, fy); b.lineTo(x - h * 0.03, fy - h * 0.01); b.lineTo(x - h * 0.03, fy + h * 0.01); b.closePath(); b.fill();
  }
  // Hiekkapohja
  var sand = b.createLinearGradient(0, floorY, 0, h);
  sand.addColorStop(0, '#e8d5a3');
  sand.addColorStop(1, '#b89a66');
  b.fillStyle = sand;
  b.beginPath();
  b.moveTo(0, floorY);
  for (x = 0; x <= w; x += 16) b.lineTo(x, floorY + Math.sin(x * 0.01) * h * 0.008);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Korallit ja merilevä
  var corals = ['#ff7a9c', '#ffb46b', '#c98bff', '#6fe0d0'];
  for (i = 0; i < 16; i++) {
    x = w * (0.02 + i * 0.062) + (i % 3) * h * 0.03;
    if (i % 2 === 0) drawCoral(b, x, floorY + h * 0.01, h * (0.07 + (i % 3) * 0.02), corals[i % corals.length]);
    else drawKelp(b, x, floorY + h * 0.01, h * (0.16 + (i % 3) * 0.05));
  }
  drawChestFrame(b, chest.x, floorY, h);
}

function drawCoral(b, x, baseY, s, color) {
  var i;
  b.strokeStyle = color;
  b.lineCap = 'round';
  b.lineWidth = s * 0.22;
  for (i = -1; i <= 1; i++) {
    b.beginPath();
    b.moveTo(x, baseY);
    b.quadraticCurveTo(x + i * s * 0.5, baseY - s * 0.5, x + i * s * 0.7, baseY - s);
    b.stroke();
  }
  b.fillStyle = color;
  b.beginPath(); b.arc(x, baseY - s * 0.05, s * 0.3, Math.PI, 0); b.fill();
}

function drawKelp(b, x, baseY, s) {
  var i, k;
  b.strokeStyle = '#2f9a6a';
  b.lineCap = 'round';
  b.lineWidth = Math.max(2, s * 0.06);
  for (k = -1; k <= 1; k += 2) {
    b.beginPath();
    b.moveTo(x + k * s * 0.05, baseY);
    for (i = 1; i <= 6; i++) {
      b.lineTo(x + k * s * 0.05 + Math.sin(i * 1.1 + k) * s * 0.08, baseY - (i / 6) * s);
    }
    b.stroke();
  }
}

function drawChestFrame(b, x, floorY, h) {
  var s = h * 0.09;
  b.fillStyle = '#7a4a22';
  roundRect(b, x - s * 0.7, floorY - s * 0.75, s * 1.4, s * 0.75, s * 0.1);
  b.fill();
  b.fillStyle = '#5a3416';
  roundRect(b, x - s * 0.72, floorY - s * 1.05, s * 1.44, s * 0.4, s * 0.15);
  b.fill();
  b.fillStyle = '#ffd24f';
  b.fillRect(x - s * 0.08, floorY - s * 0.75, s * 0.16, s * 0.22);
  b.fillRect(x - s * 0.72, floorY - s * 0.7, s * 1.44, s * 0.06);
}

function drawReefPearl(c, x, y, r) {
  // Avonainen simpukka, jossa helmi
  c.fillStyle = '#ff9ecf';
  c.beginPath(); c.arc(x, y + r * 0.9, r * 1.3, Math.PI, 0); c.fill();
  c.fillStyle = '#ffc9e3';
  c.beginPath(); c.moveTo(x - r * 1.3, y + r * 0.9); c.arc(x, y - r * 0.4, r * 1.3, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
  var g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#cfe0f0');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

function drawJelly(c, j) {
  var x = j.x - camX, y = j.y, r = viewH * 0.05, i;
  if (x < -r * 3 || x > viewW + r * 3) return;
  c.strokeStyle = 'rgba(255,160,220,0.7)';
  c.lineWidth = Math.max(2, r * 0.12);
  c.lineCap = 'round';
  for (i = -2; i <= 2; i++) {
    c.beginPath();
    c.moveTo(x + i * r * 0.35, y + r * 0.3);
    c.quadraticCurveTo(x + i * r * 0.35 + Math.sin(globalT * 3 + i) * r * 0.4, y + r * 1.2, x + i * r * 0.35 + Math.sin(globalT * 2 + i) * r * 0.3, y + r * 1.9);
    c.stroke();
  }
  var g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, 'rgba(255,220,245,0.95)');
  g.addColorStop(1, 'rgba(255,120,200,0.75)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r * (1 + Math.sin(j.phase * 2) * 0.05), Math.PI, 0); c.lineTo(x + r, y + r * 0.3); c.lineTo(x - r, y + r * 0.3); c.closePath(); c.fill();
  c.fillStyle = '#4a2a5a';
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.15, r * 0.09, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.3, y - r * 0.15, r * 0.09, 0, Math.PI * 2); c.fill();
}

function drawCurrentStream(c, cu) {
  var x = cu.x - camX, i;
  if (x < -viewW * 0.2 || x > viewW * 1.2) return;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 12; i++) {
    var t = (cu.t * 0.6 + i / 12) % 1;
    var bx = x + (t - 0.5) * viewW * 0.16 * cu.dir;
    var by = cu.y + Math.sin(t * Math.PI * 4 + i) * viewH * 0.08 + (i % 3 - 1) * viewH * 0.05;
    c.beginPath(); c.arc(bx, by, viewH * 0.006 + (i % 2) * viewH * 0.004, 0, Math.PI * 2); c.fill();
  }
}

function drawChestGlow(c) {
  var x = chest.x - camX, floorY = reefFloorY(), s = viewH * 0.09;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (chest.open) {
    var g = c.createRadialGradient(x, floorY - s * 0.8, s * 0.1, x, floorY - s * 0.8, s * 2);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.7 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, floorY - s * 0.8, s * 2, 0, Math.PI * 2); c.fill();
    drawStar(c, x, floorY - s * 1.6, viewH * 0.035, globalT, 1);
  }
}

function drawReef() {
  var i, floorY = reefFloorY();
  if (!drawWorldBg()) return;
  for (i = 0; i < currents.length; i++) drawCurrentStream(ctx, currents[i]);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], floorY);
  drawChestGlow(ctx);
  for (i = 0; i < reefPearls.length; i++) {
    if (reefPearls[i].collected) continue;
    drawReefPearl(ctx, reefPearls[i].ax - camX, reefPearls[i].ay + Math.sin(reefPearls[i].phase) * viewH * 0.01, viewH * 0.022);
  }
  for (i = 0; i < jellies.length; i++) drawJelly(ctx, jellies[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (chest.open && !celebrating) drawEdgeArrow(ctx, chest.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, PEARL_COUNT, function (i2) { return reefPearls[i2] && reefPearls[i2].collected; },
    function (c, x, y, s) { drawReefPearl(c, x, y, s * 0.7); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
