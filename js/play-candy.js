'use strict';

// Karkkilaakso: tasohyppely vaahtokarkkitasoilla. Osa tasoista pomputtaa
// korkealle, kuulakarkit vierivät maassa ja kuiluissa on limonadia. Sydämet käytössä.

var CANDY_COUNT = 10;
var candies = [];
var gumballs = [];
var candyGround = [[0.0, 0.18], [0.21, 0.40], [0.43, 0.62], [0.65, 0.84], [0.87, 1.0]];
var candyDoor = { fx: 0.965, x: 0, open: false };
var candyLiquidY = 0;
var candyDefs = [
  { fx: 0.08, fy: 0.30 }, { fx: 0.195, fy: 0.30 }, { fx: 0.24, fy: 0.46 }, { fx: 0.32, fy: 0.34 },
  { fx: 0.415, fy: 0.30 }, { fx: 0.52, fy: 0.32 }, { fx: 0.58, fy: 0.46 }, { fx: 0.635, fy: 0.30 },
  { fx: 0.74, fy: 0.34 }, { fx: 0.80, fy: 0.46 }
];
var CANDY_COLORS = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff'];

function layoutCandy() {
  var g = groundTop, i, seg;
  platforms = [];
  for (i = 0; i < candyGround.length; i++) {
    seg = candyGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: g, w: (seg[1] - seg[0]) * worldW });
  }
  platforms.push({ kind: 'ledge', x: worldW * 0.10, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.30, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.50, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.72, y: g - viewH * 0.20, w: worldW * 0.05 });
  // Pomppivat vaahtokarkit: niiltä pääsee korkealla oleviin karkkeihin
  platforms.push({ kind: 'bounce', x: worldW * 0.24 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  platforms.push({ kind: 'bounce', x: worldW * 0.58 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  platforms.push({ kind: 'bounce', x: worldW * 0.80 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  candyLiquidY = g + viewH * 0.06;
  candyDoor.x = candyDoor.fx * worldW;
}

function initCandy() {
  var i;
  setupRunLevel(11, '#ffd9ec');
  layoutCandy();
  tasks = [makeTask(0.34, 'puzzle'), makeTask(0.70, 'shadow')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.45, 0.78]);
  candies = [];
  for (i = 0; i < CANDY_COUNT; i++) {
    candies.push({
      ax: candyDefs[i].fx * worldW, ay: groundTop - candyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: CANDY_COLORS[i % CANDY_COLORS.length]
    });
  }
  gumballs = [
    { zA: 0.22, zB: 0.39, x: 0.30 * worldW, dir: 1, rot: 0, color: '#5fa8ff' },
    { zA: 0.66, zB: 0.83, x: 0.74 * worldW, dir: -1, rot: 0, color: '#ff5f7e' }
  ];
  candyDoor.open = false;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(659, 0, 0.2, 'triangle', 0.35);
  playNote(880, 0.1, 0.2, 'triangle', 0.35);
  playNote(1047, 0.2, 0.3, 'triangle', 0.35);
}

function respawnCandy() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function respawnCandyPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < candyGround.length; i++) {
    var end = candyGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  resetPrincess(best > 0 ? best - viewH * 0.09 : checkpoint.x, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffb3d9');
}

function resizeCandy(ratio) {
  var i;
  princess.x *= ratio;
  layoutCandy();
  for (i = 0; i < candies.length; i++) {
    candies[i].ax = candyDefs[i].fx * worldW;
    candies[i].ay = groundTop - candyDefs[i].fy * viewH;
  }
  for (i = 0; i < gumballs.length; i++) gumballs[i].x *= ratio;
}

function collectCandy(cd) {
  cd.collected = true;
  registerCollected(cd);
  spawnSparkles(cd.ax, cd.ay, 14, cd.color);
  playNote(800 + countCollected(candies) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1200 + countCollected(candies) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(candies) === CANDY_COUNT && !candyDoor.open) {
    candyDoor.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function candyFell() {
  spawnSparkles(princess.x, candyLiquidY, 14, '#ffb3d9');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) respawnCandyPitEdge();
}

function updateCandy(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();

  platformerStep(dt, {
    runSp: viewW * 0.22,
    fallY: candyLiquidY,
    onFall: function () { candyFell(); },
    onBounce: function (pl) {
      pl.squish = 0.3;
      playNote(523, 0, 0.1, 'sine', 0.3);
      playNote(1047, 0.06, 0.2, 'sine', 0.3);
      spawnSparkles(princess.x, pl.y, 8, '#ffffff');
    }
  });
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce' && platforms[i].squish > 0) platforms[i].squish -= dt;
  }
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < candies.length; i++) {
    var cd = candies[i];
    if (cd.collected) continue;
    cd.phase += dt * 2;
    var dx = cd.ax - princess.x, dy = (cd.ay + Math.sin(cd.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectCandy(cd);
  }

  // Kuulakarkit vierivät maassa: hyppää yli
  for (i = 0; i < gumballs.length; i++) {
    var gb = gumballs[i];
    if (!busy && !celebrating) {
      gb.x += gb.dir * viewW * 0.07 * dt;
      gb.rot += gb.dir * dt * 4;
      if (gb.x < gb.zA * worldW) { gb.x = gb.zA * worldW; gb.dir = 1; }
      if (gb.x > gb.zB * worldW) { gb.x = gb.zB * worldW; gb.dir = -1; }
    }
    if (!celebrating && Math.abs(gb.x - princess.x) < viewH * 0.06 && princess.y > groundTop - viewH * 0.07) {
      if (loseHeart()) {
        princess.knockVx = (princess.x < gb.x ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.3;
      }
    }
  }

  if (candyDoor.open && !celebrating && Math.abs(princess.x - candyDoor.x) < viewH * 0.07) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderCandyBg(b, w, h) {
  var i, x, seg;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ffd9ec');
  sky.addColorStop(0.6, '#ffeef7');
  sky.addColorStop(1, '#ffe4c8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 8; i++) cloudShape(b, w * (0.04 + i * 0.125), h * (0.1 + (i % 3) * 0.07), h * 0.03);
  // Raidalliset karkkikukkulat
  var horizon = h * 0.66;
  for (i = 0; i < 9; i++) {
    x = w * (0.05 + i * 0.115);
    var r = h * (0.12 + (i % 3) * 0.04);
    b.fillStyle = i % 2 ? '#ffb3d9' : '#c9a0ff';
    b.beginPath(); b.arc(x, horizon + r * 0.3, r, Math.PI, 0); b.fill();
    b.strokeStyle = 'rgba(255,255,255,0.6)';
    b.lineWidth = r * 0.12;
    b.beginPath(); b.arc(x, horizon + r * 0.3, r * 0.75, Math.PI * 1.15, Math.PI * 1.85); b.stroke();
  }
  // Limonadi kuiluissa
  var liq = b.createLinearGradient(0, groundTop, 0, h);
  liq.addColorStop(0, '#ff9ec6');
  liq.addColorStop(1, '#d94f8a');
  b.fillStyle = liq;
  b.fillRect(0, groundTop + h * 0.03, w, h - groundTop);
  b.fillStyle = 'rgba(255,255,255,0.5)';
  for (i = 0; i < 60; i++) {
    x = (i * 131.3) % w;
    b.beginPath(); b.arc(x, groundTop + h * 0.06 + ((i * 41) % Math.max(1, (h - groundTop - h * 0.08))), h * 0.005 + (i % 3) * h * 0.003, 0, Math.PI * 2); b.fill();
  }
  // Keksimaa
  for (i = 0; i < candyGround.length; i++) {
    seg = candyGround[i];
    drawBiscuitSlab(b, seg[0] * w, groundTop, (seg[1] - seg[0]) * w, h - groundTop, h);
  }
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'ledge') drawMarshmallow(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.055, false, 0);
  }
  // Tikkarit maiseman puina
  for (i = 0; i < 10; i++) {
    x = w * (0.03 + i * 0.1) + (i % 2) * h * 0.06;
    drawLollipopTree(b, x, groundTop, h * (0.14 + (i % 3) * 0.03), CANDY_COLORS[i % CANDY_COLORS.length]);
  }
  drawCandyDoorFrame(b, candyDoor.x, groundTop, h);
}

function drawBiscuitSlab(b, x, y, w, hh, h) {
  var g = b.createLinearGradient(0, y, 0, y + hh);
  g.addColorStop(0, '#fff2d6');
  g.addColorStop(0.12, '#e8c58f');
  g.addColorStop(1, '#b8895a');
  b.fillStyle = g;
  roundRect(b, x, y, w, hh, Math.min(h * 0.015, w / 4));
  b.fill();
  b.fillStyle = 'rgba(120,70,30,0.25)';
  var i;
  for (i = 0; i < w / (h * 0.06); i++) {
    b.beginPath(); b.arc(x + h * 0.03 + i * h * 0.06, y + h * 0.04, h * 0.004, 0, Math.PI * 2); b.fill();
  }
}

function drawMarshmallow(b, x, y, w, hh, bouncy, squish) {
  var sq = 1 - squish;
  var g = b.createLinearGradient(0, y - hh * 0.4, 0, y + hh);
  g.addColorStop(0, bouncy ? '#ffd0e8' : '#ffffff');
  g.addColorStop(1, bouncy ? '#ff8fc0' : '#f0dff0');
  b.fillStyle = g;
  roundRect(b, x, y - hh * 0.4 * (1 - sq) + (bouncy ? 0 : 0), w, hh * sq, hh * 0.45);
  b.fill();
  b.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(b, x + w * 0.1, y + hh * 0.08, w * 0.8, hh * 0.18, hh * 0.09);
  b.fill();
  if (bouncy) {
    b.fillStyle = '#ffe27a';
    var i;
    for (i = 0; i < 3; i++) {
      b.beginPath(); b.arc(x + w * (0.25 + i * 0.25), y + hh * 0.55, hh * 0.1, 0, Math.PI * 2); b.fill();
    }
  }
}

function drawLollipopTree(b, x, baseY, s, color) {
  b.strokeStyle = '#ffffff';
  b.lineWidth = s * 0.1;
  b.beginPath(); b.moveTo(x, baseY); b.lineTo(x, baseY - s); b.stroke();
  b.fillStyle = color;
  b.beginPath(); b.arc(x, baseY - s - s * 0.35, s * 0.4, 0, Math.PI * 2); b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.75)';
  b.lineWidth = s * 0.07;
  b.beginPath();
  var a, r;
  for (a = 0; a < Math.PI * 4; a += 0.2) {
    r = s * 0.05 + a / (Math.PI * 4) * s * 0.3;
    var px = x + Math.cos(a) * r, py = baseY - s - s * 0.35 + Math.sin(a) * r;
    if (a === 0) b.moveTo(px, py); else b.lineTo(px, py);
  }
  b.stroke();
}

function drawCandyDoorFrame(b, x, baseY, h) {
  var dw = h * 0.12, dh = h * 0.24;
  b.fillStyle = '#ff8fc0';
  roundRect(b, x - dw * 0.7, baseY - dh * 1.1, dw * 1.4, dh * 1.1, dw * 0.3);
  b.fill();
  b.fillStyle = '#b8467e';
  roundRect(b, x - dw / 2, baseY - dh, dw, dh, dw * 0.4);
  b.fill();
}

function drawCandy(c, x, y, s, color, phase) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(phase) * 0.2);
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1.5, s * 0.16);
  c.beginPath(); c.moveTo(0, s * 0.3); c.lineTo(0, s * 1.3); c.stroke();
  c.fillStyle = color;
  c.beginPath(); c.arc(0, 0, s * 0.75, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, s * 0.12);
  c.beginPath(); c.arc(0, 0, s * 0.42, 0, Math.PI * 1.4); c.stroke();
  c.beginPath(); c.arc(0, 0, s * 0.15, Math.PI, Math.PI * 2.2); c.stroke();
  c.restore();
}

function drawGumball(c, gb) {
  var x = gb.x - camX, y = groundTop - viewH * 0.035, r = viewH * 0.035;
  if (x < -r * 3 || x > viewW + r * 3) return;
  var g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, gb.color);
  g.addColorStop(1, gb.color);
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, r * 0.12);
  c.beginPath(); c.arc(x, y, r * 0.6, gb.rot, gb.rot + Math.PI * 0.8); c.stroke();
}

function drawCandyDoorGlow(c) {
  var x = candyDoor.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var dw = h * 0.12, dh = h * 0.24;
  if (candyDoor.open) {
    var g = c.createLinearGradient(0, groundTop - dh, 0, groundTop);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.8 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,200,220,0.6)');
    c.fillStyle = g;
    roundRect(c, x - dw / 2, groundTop - dh, dw, dh, dw * 0.4);
    c.fill();
    drawStar(c, x, groundTop - dh * 1.35, h * 0.035, globalT, 1);
  }
}

function drawCandy_() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce') {
      drawMarshmallow(ctx, platforms[i].x - camX, platforms[i].y, platforms[i].w, viewH * 0.06, true, Math.max(0, platforms[i].squish));
    }
  }
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < candies.length; i++) {
    if (candies[i].collected) continue;
    drawCandy(ctx, candies[i].ax - camX, candies[i].ay + Math.sin(candies[i].phase) * viewH * 0.012, viewH * 0.024, candies[i].color, candies[i].phase);
  }
  for (i = 0; i < gumballs.length; i++) drawGumball(ctx, gumballs[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  drawCandyDoorGlow(ctx);
  if (candyDoor.open && !celebrating) drawEdgeArrow(ctx, candyDoor.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, CANDY_COUNT, function (i2) { return candies[i2] && candies[i2].collected; },
    function (c, x, y, s) { drawCandy(c, x, y - s * 0.3, s * 0.9, '#ff5f7e', 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
