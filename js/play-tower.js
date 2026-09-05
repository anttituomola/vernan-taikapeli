'use strict';

// Arvoitusten torni: neljä tehtäväovea peräkkäin, jalokivet hyllyillä ja
// heiluvat kattokruunut. Painopiste pulmissa. Sydämet käytössä.

var GEM_COUNT = 6;
var gems = [];
var pendulums = [];
var throne = { fx: 0.95, x: 0, open: false };
var gemDefs = [
  { fx: 0.165, fy: 0.34 }, { fx: 0.385, fy: 0.36 }, { fx: 0.605, fy: 0.34 },
  { fx: 0.825, fy: 0.36 }, { fx: 0.30, fy: 0.12 }, { fx: 0.76, fy: 0.12 }
];
var GEM_COLORS = ['#ff5f7e', '#5fa8ff', '#6fd66f', '#ffe94f', '#c9a0ff', '#8fd3ff'];

function layoutTower() {
  var g = groundTop;
  platforms = [
    { kind: 'ground', x: 0, y: g, w: worldW },
    { kind: 'ledge', x: worldW * 0.14, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.36, y: g - viewH * 0.22, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.58, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.80, y: g - viewH * 0.22, w: worldW * 0.05 }
  ];
  throne.x = throne.fx * worldW;
}

function initTower() {
  var i;
  setupRunLevel(12, '#241c48');
  layoutTower();
  tasks = [
    makeTask(0.20, 'pairs', { pairs: 4 }),
    makeTask(0.44, 'puzzle'),
    makeTask(0.66, 'word', { maxSyl: 3 }),
    makeTask(0.88, 'memory', { seqLen: 4, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.52]);
  gems = [];
  for (i = 0; i < GEM_COUNT; i++) {
    gems.push({
      ax: gemDefs[i].fx * worldW, ay: groundTop - gemDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: GEM_COLORS[i % GEM_COLORS.length]
    });
  }
  pendulums = [];
  var pFx = [0.27, 0.50, 0.72];
  for (i = 0; i < pFx.length; i++) {
    pendulums.push({ fx: pFx[i], x: pFx[i] * worldW, phase: i * 1.3, speed: 1.1, angle: 0 });
  }
  throne.open = false;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(392, 0, 0.3, 'triangle', 0.35);
  playNote(494, 0.15, 0.3, 'triangle', 0.35);
  playNote(587, 0.3, 0.4, 'sine', 0.35);
}

function respawnTower() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeTower(ratio) {
  var i;
  princess.x *= ratio;
  layoutTower();
  for (i = 0; i < gems.length; i++) {
    gems[i].ax = gemDefs[i].fx * worldW;
    gems[i].ay = groundTop - gemDefs[i].fy * viewH;
  }
  for (i = 0; i < pendulums.length; i++) pendulums[i].x = pendulums[i].fx * worldW;
}

function collectGem(gm) {
  gm.collected = true;
  registerCollected(gm);
  spawnSparkles(gm.ax, gm.ay, 14, gm.color);
  playNote(880 + countCollected(gems) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(gems) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(gems) === GEM_COUNT && !throne.open) {
    throne.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function pendulumBob(p) {
  var pivotY = viewH * 0.06, len = viewH * 0.5;
  return { x: p.x + Math.sin(p.angle) * len, y: pivotY + Math.cos(p.angle) * len };
}

function updateTower(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();

  platformerStep(dt, { runSp: viewW * 0.22 });
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < gems.length; i++) {
    var gm = gems[i];
    if (gm.collected) continue;
    gm.phase += dt * 2;
    var dx = gm.ax - princess.x, dy = (gm.ay + Math.sin(gm.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectGem(gm);
  }

  // Kattokruunut heiluvat: kulje ohi kun kruunu on sivulla
  for (i = 0; i < pendulums.length; i++) {
    var p = pendulums[i];
    if (!busy) p.phase += dt * p.speed;
    p.angle = Math.sin(p.phase) * 0.55;
    var bob = pendulumBob(p);
    var hx = bob.x - princess.x, hy = bob.y - (princess.y - viewH * 0.1);
    if (!celebrating && hx * hx + hy * hy < viewH * 0.09 * viewH * 0.09) {
      if (loseHeart()) {
        princess.knockVx = (hx > 0 ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.25;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffe27a');
      }
    }
  }

  if (throne.open && !celebrating && Math.abs(princess.x - throne.x) < viewH * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderTowerBg(b, w, h) {
  var i, x, k;
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#241c48');
  wall.addColorStop(0.7, '#3c2f6e');
  wall.addColorStop(1, '#2e2458');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  b.strokeStyle = 'rgba(255,255,255,0.05)';
  b.lineWidth = 2;
  for (i = 0; i < 14; i++) { b.beginPath(); b.moveTo(0, h * 0.05 * i); b.lineTo(w, h * 0.05 * i); b.stroke(); }
  // Kirjahyllyt ja ikkunat vuorotellen
  var bookCols = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff', '#ffe94f'];
  for (i = 0; i < 12; i++) {
    x = w * (0.04 + i * 0.082);
    if (i % 3 === 1) {
      var wg = b.createLinearGradient(0, h * 0.14, 0, h * 0.44);
      wg.addColorStop(0, '#0b0630');
      wg.addColorStop(1, '#2a1860');
      b.fillStyle = wg;
      b.beginPath();
      b.moveTo(x - h * 0.05, h * 0.44); b.lineTo(x - h * 0.05, h * 0.22); b.arc(x, h * 0.22, h * 0.05, Math.PI, 0); b.lineTo(x + h * 0.05, h * 0.44);
      b.closePath(); b.fill();
      b.fillStyle = '#fff6c8';
      b.beginPath(); b.arc(x + h * 0.015, h * 0.26, h * 0.006, 0, Math.PI * 2); b.fill();
      b.beginPath(); b.arc(x - h * 0.02, h * 0.34, h * 0.005, 0, Math.PI * 2); b.fill();
      continue;
    }
    b.fillStyle = '#5a3d2a';
    b.fillRect(x - h * 0.07, h * 0.16, h * 0.14, h * 0.3);
    for (k = 0; k < 3; k++) {
      var sy = h * 0.19 + k * h * 0.09;
      b.fillStyle = '#7a5538';
      b.fillRect(x - h * 0.065, sy + h * 0.07, h * 0.13, h * 0.012);
      var j;
      for (j = 0; j < 5; j++) {
        b.fillStyle = bookCols[(i + j + k) % bookCols.length];
        b.fillRect(x - h * 0.06 + j * h * 0.025, sy + h * 0.01 + (j % 2) * h * 0.008, h * 0.02, h * 0.06 - (j % 2) * h * 0.008);
      }
    }
  }
  // Lattia ja matto
  var floor = b.createLinearGradient(0, groundTop, 0, h);
  floor.addColorStop(0, '#7d6a9c');
  floor.addColorStop(1, '#4a3d66');
  b.fillStyle = floor;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(0,0,0,0.12)';
  for (x = 0; x < w; x += h * 0.12) b.fillRect(x, groundTop, 2, h - groundTop);
  b.fillStyle = '#5a3aa0';
  b.fillRect(0, groundTop + 4, w, h * 0.06);
  b.fillStyle = '#ffd24f';
  b.fillRect(0, groundTop + 4, w, 3);
  b.fillRect(0, groundTop + 4 + h * 0.06 - 3, w, 3);
  for (i = 1; i < platforms.length; i++) {
    drawStoneSlab(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05, h);
  }
  drawThroneFrame(b, throne.x, groundTop, h);
}

function drawThroneFrame(b, x, baseY, h) {
  var s = h * 0.1;
  b.fillStyle = '#8a5cb8';
  roundRect(b, x - s * 0.7, baseY - s * 1.8, s * 1.4, s * 1.8, s * 0.2);
  b.fill();
  b.fillStyle = '#c0304e';
  roundRect(b, x - s * 0.55, baseY - s * 1.5, s * 1.1, s * 0.9, s * 0.15);
  b.fill();
  b.fillStyle = '#ffd24f';
  b.fillRect(x - s * 0.7, baseY - s * 0.6, s * 1.4, s * 0.12);
}

function drawGem(c, x, y, s, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - s * 0.7, y - s * 0.2);
  c.lineTo(x - s * 0.35, y - s * 0.65);
  c.lineTo(x + s * 0.35, y - s * 0.65);
  c.lineTo(x + s * 0.7, y - s * 0.2);
  c.lineTo(x, y + s * 0.75);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.moveTo(x - s * 0.35, y - s * 0.65);
  c.lineTo(x, y - s * 0.65);
  c.lineTo(x - s * 0.2, y - s * 0.2);
  c.lineTo(x - s * 0.7, y - s * 0.2);
  c.closePath();
  c.fill();
}

function drawPendulum(c, p) {
  var pivotX = p.x - camX, pivotY = viewH * 0.06;
  if (pivotX < -viewH * 0.6 || pivotX > viewW + viewH * 0.6) return;
  var bob = pendulumBob(p);
  var bx = bob.x - camX, by = bob.y;
  c.strokeStyle = '#c9b8e0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.beginPath(); c.moveTo(pivotX, pivotY); c.lineTo(bx, by); c.stroke();
  c.fillStyle = '#6b5a80';
  c.beginPath(); c.arc(pivotX, pivotY, viewH * 0.012, 0, Math.PI * 2); c.fill();
  // Kattokruunu: rengas ja kynttilät
  var r = viewH * 0.065;
  c.fillStyle = '#d9b34f';
  c.beginPath();
  if (c.ellipse) c.ellipse(bx, by, r, r * 0.4, 0, 0, Math.PI * 2);
  else c.arc(bx, by, r * 0.7, 0, Math.PI * 2);
  c.fill();
  var i;
  for (i = 0; i < 4; i++) {
    var cx2 = bx + Math.cos(i * Math.PI / 2 + globalT) * r * 0.75, cy2 = by - r * 0.1 + Math.sin(i * Math.PI / 2 + globalT) * r * 0.3;
    c.fillStyle = '#fff6c8';
    c.fillRect(cx2 - r * 0.05, cy2 - r * 0.35, r * 0.1, r * 0.35);
    c.fillStyle = '#ffb84f';
    c.beginPath(); c.arc(cx2, cy2 - r * 0.42, r * 0.09, 0, Math.PI * 2); c.fill();
  }
}

function drawThroneGlow(c) {
  var x = throne.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var s = h * 0.1;
  if (throne.open) {
    var g = c.createRadialGradient(x, groundTop - s * 1.2, s * 0.2, x, groundTop - s * 1.2, s * 2);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.55 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, groundTop - s * 1.2, s * 2, 0, Math.PI * 2); c.fill();
    drawStar(c, x, groundTop - s * 2.4, h * 0.035, globalT, 1);
  }
  // Kruunu istuimella
  c.fillStyle = '#ffd24f';
  c.beginPath();
  c.moveTo(x - s * 0.35, groundTop - s * 0.75);
  c.lineTo(x - s * 0.35, groundTop - s * 1.1);
  c.lineTo(x - s * 0.17, groundTop - s * 0.9);
  c.lineTo(x, groundTop - s * 1.2);
  c.lineTo(x + s * 0.17, groundTop - s * 0.9);
  c.lineTo(x + s * 0.35, groundTop - s * 1.1);
  c.lineTo(x + s * 0.35, groundTop - s * 0.75);
  c.closePath();
  c.fill();
}

function drawTower() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < pendulums.length; i++) drawPendulum(ctx, pendulums[i]);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawThroneGlow(ctx);
  for (i = 0; i < gems.length; i++) {
    if (gems[i].collected) continue;
    drawGem(ctx, gems[i].ax - camX, gems[i].ay + Math.sin(gems[i].phase) * viewH * 0.012, viewH * 0.028, gems[i].color);
  }
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (throne.open && !celebrating) drawEdgeArrow(ctx, throne.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, GEM_COUNT, function (i2) { return gems[i2] && gems[i2].collected; },
    function (c, x, y, s) { drawGem(c, x, y, s, '#8fd3ff'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
