'use strict';

// Karkkitaivas: lennä sormea kohti, kerää kahdeksan karkkia ja väistä
// ajelehtivia ukkospilviä. Kun kaikki karkit ovat tallessa, karkkiportti
// hehkuu maailman laidassa — lennä sen läpi. Sydämet ja lyhdyt käytössä.

var CANDYSKY_COUNT = 8;
var skyCandies = [];
var candyThunder = [];
var candyGate = { fx: 0.93, x: 0, ready: false };

var candySkyDefs = [
  { fx: 0.08, fy: 0.30 }, { fx: 0.17, fy: 0.48 }, { fx: 0.26, fy: 0.22 }, { fx: 0.38, fy: 0.42 },
  { fx: 0.50, fy: 0.26 }, { fx: 0.62, fy: 0.50 }, { fx: 0.74, fy: 0.30 }, { fx: 0.85, fy: 0.44 }
];
var CANDY_WRAP_COLORS = ['#ff6b9d', '#ffd24f', '#7fd4ff', '#8fe38f', '#c9a0ff', '#ff9f3a', '#ff8fc0', '#6fd6d6'];

function initCandysky() {
  var i;
  tasks = [makeTask(0.30, 'give'), makeTask(0.62, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.40, 0.70]);
  skyCandies = [];
  for (i = 0; i < CANDYSKY_COUNT; i++) {
    skyCandies.push({
      ax: candySkyDefs[i].fx * worldW, ay: groundTop - candySkyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      color: CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length]
    });
  }
  candyThunder = [];
  var tFx = [0.22, 0.45, 0.58, 0.80];
  for (i = 0; i < tFx.length; i++) {
    candyThunder.push({
      fx: tFx[i], x: tFx[i] * worldW,
      baseY: viewH * (0.28 + (i % 2) * 0.2), y: 0,
      amp: viewH * (0.07 + (i % 2) * 0.05), t: i * 1.7, f: 1.1 + (i % 3) * 0.3
    });
  }
  candyGate.x = candyGate.fx * worldW;
  candyGate.ready = false;
  princess.x = viewW * 0.14;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.35);
  playNote(784, 0.14, 0.32, 'triangle', 0.35);
}

function respawnCandysky() {
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  spawnSparkles(princess.x, princess.y, 14, '#ffe27a');
}

function resizeCandysky(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < skyCandies.length; i++) {
    skyCandies[i].ax = candySkyDefs[i].fx * worldW;
    skyCandies[i].ay = groundTop - candySkyDefs[i].fy * viewH;
  }
  for (i = 0; i < candyThunder.length; i++) candyThunder[i].x = candyThunder[i].fx * worldW;
  candyGate.x = candyGate.fx * worldW;
}

function collectSkyCandy(cd) {
  cd.collected = true;
  registerCollected(cd);
  spawnSparkles(cd.ax, cd.ay, 14, cd.color);
  playNote(660 + countCollected(skyCandies) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(skyCandies) * 55, 0.08, 0.3, 'triangle', 0.3);
  if (countCollected(skyCandies) === CANDYSKY_COUNT && !candyGate.ready) {
    candyGate.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleCandyskyTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < skyCandies.length; i++) {
    if (skyCandies[i].collected) continue;
    dx = wx - skyCandies[i].ax;
    dy = py - (skyCandies[i].ay + Math.sin(skyCandies[i].phase) * viewH * 0.015);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectSkyCandy(skyCandies[i]);
      return;
    }
  }
}

function updateCandysky(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Lento (kuten Kuutamotaivaalla)
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.55 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.7 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.28) princess.vx = viewW * 0.28;
  if (princess.vx < -viewW * 0.28) princess.vx = -viewW * 0.28;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;
  if (!busy) {
    princess.x += princess.vx * dt;
    princess.y += princess.vy * dt;
  }
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();
  princess.walkPhase += dt * 6;
  updateCheckpoints(princess.x, princess.y);

  // Karkit kimaltelevat; niihin voi myös lentää läpi
  for (i = 0; i < skyCandies.length; i++) {
    var cd = skyCandies[i];
    if (cd.collected) continue;
    cd.phase += dt * 2;
    var dx = cd.ax - princess.x, dy = cd.ay - princess.y;
    if (!busy && !celebrating && dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectSkyCandy(cd);
  }

  // Ukkospilvet ajelehtivat
  for (i = 0; i < candyThunder.length; i++) {
    var th = candyThunder[i];
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

  if (candyGate.ready && !celebrating && Math.abs(princess.x - candyGate.x) < viewW * 0.06) {
    startCelebration();
  }

  followCam(princess.x, dt);
  if (Math.random() < dt * 8) spawnSparkles(princess.x - princess.facing * 20, princess.y - viewH * 0.02, 1, '#ffd6ff');
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderCandyskyBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ffb3d9');
  sky.addColorStop(0.55, '#ffd9ec');
  sky.addColorStop(1, '#fff3fa');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  // Karkkipilvet
  for (i = 0; i < 10; i++) {
    b.fillStyle = i % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(255,230,245,0.9)';
    cloudShape(b, w * (0.05 + i * 0.1), h * (0.1 + (i % 3) * 0.08), h * 0.035);
  }
  // Vaahtokarkkikukkula maan rajassa
  b.fillStyle = '#ffc4e0';
  for (i = 0; i < 9; i++) {
    x = w * (i / 8);
    b.beginPath(); b.arc(x, groundTop + h * 0.03, h * (0.1 + (i % 3) * 0.05), Math.PI, 0); b.fill();
  }
  // Maapinta: kermainen pilvi
  var gr = b.createLinearGradient(0, groundTop, 0, h);
  gr.addColorStop(0, '#fff0f7');
  gr.addColorStop(1, '#ffd6ea');
  b.fillStyle = gr;
  b.fillRect(0, groundTop, w, h - groundTop);
  // Tikkarit maisemassa
  for (i = 0; i < 7; i++) {
    x = w * (0.07 + i * 0.14);
    var s = h * (0.05 + (i % 3) * 0.015);
    b.strokeStyle = '#fff';
    b.lineWidth = Math.max(2, s * 0.12);
    b.beginPath(); b.moveTo(x, groundTop); b.lineTo(x, groundTop - s * 2.2); b.stroke();
    b.fillStyle = CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length];
    b.beginPath(); b.arc(x, groundTop - s * 2.6, s, 0, Math.PI * 2); b.fill();
    b.strokeStyle = 'rgba(255,255,255,0.8)';
    b.lineWidth = Math.max(2, s * 0.18);
    b.beginPath(); b.arc(x, groundTop - s * 2.6, s * 0.55, 0.5, 2.6); b.stroke();
  }
  // Karkkiportti maailman lopussa
  var gx = candyGate.x, gs = h * 0.16;
  b.strokeStyle = '#ff6b9d';
  b.lineWidth = gs * 0.14;
  b.lineCap = 'round';
  b.beginPath(); b.arc(gx, groundTop, gs * 0.9, Math.PI, 0); b.stroke();
  b.strokeStyle = '#fff';
  b.lineWidth = gs * 0.07;
  b.beginPath(); b.arc(gx, groundTop, gs * 0.9, Math.PI, 0); b.stroke();
  b.fillStyle = '#ff6b9d';
  b.beginPath(); b.arc(gx - gs * 0.9, groundTop, gs * 0.12, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(gx + gs * 0.9, groundTop, gs * 0.12, 0, Math.PI * 2); b.fill();
}

function csDrawCandy(c, x, y, s, color) {
  // Käärekarkki: pallo + kääreen päät
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - s * 0.8, y);
  c.lineTo(x - s * 1.35, y - s * 0.5);
  c.lineTo(x - s * 1.35, y + s * 0.5);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(x + s * 0.8, y);
  c.lineTo(x + s * 1.35, y - s * 0.5);
  c.lineTo(x + s * 1.35, y + s * 0.5);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1.5, s * 0.16);
  c.beginPath(); c.arc(x, y, s * 0.55, -0.6, 1.2); c.stroke();
}

function drawCandysky() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  // Portin hehku kun se odottaa
  if (candyGate.ready) {
    var gx = candyGate.x - camX, gy = groundTop - viewH * 0.14;
    var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.2);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.8 + Math.sin(globalT * 5) * 0.2) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < skyCandies.length; i++) {
    var cd = skyCandies[i];
    if (cd.collected) continue;
    csDrawCandy(ctx, cd.ax - camX, cd.ay + Math.sin(cd.phase) * viewH * 0.015, viewH * 0.028, cd.color);
  }
  for (i = 0; i < candyThunder.length; i++) drawThunderCloud(ctx, candyThunder[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (candyGate.ready && !celebrating) drawEdgeArrow(ctx, candyGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, CANDYSKY_COUNT, function (i2) { return skyCandies[i2] && skyCandies[i2].collected; },
    function (c, x, y, s) { csDrawCandy(c, x, y, s, '#ff6b9d'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
