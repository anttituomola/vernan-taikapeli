'use strict';

// Kotkalento: vapaa liito vuoristoalueen yllä. Kerää kahdeksan kotkan sulkaa,
// väistä ajelehtivia ukkospilviä ja lennä lopuksi tuuliportin läpi.
// Sydämet ja lyhdyt käytössä.

var GLIDE_COUNT = 8;
var feathers = [];
var glideThunder = [];
var glideGate = { fx: 0.93, x: 0, ready: false };

var featherDefs = [
  { fx: 0.08, fy: 0.34 }, { fx: 0.17, fy: 0.20 }, { fx: 0.27, fy: 0.46 }, { fx: 0.39, fy: 0.26 },
  { fx: 0.51, fy: 0.44 }, { fx: 0.63, fy: 0.22 }, { fx: 0.75, fy: 0.40 }, { fx: 0.86, fy: 0.28 }
];

function initGlide() {
  var i;
  tasks = [makeTask(0.30, 'matrix'), makeTask(0.62, 'mirror')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.40, 0.70]);
  feathers = [];
  for (i = 0; i < GLIDE_COUNT; i++) {
    feathers.push({
      ax: featherDefs[i].fx * worldW, ay: groundTop - featherDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  glideThunder = [];
  var tFx = [0.20, 0.44, 0.57, 0.82];
  for (i = 0; i < tFx.length; i++) {
    glideThunder.push({
      fx: tFx[i], x: tFx[i] * worldW,
      baseY: viewH * (0.26 + (i % 2) * 0.22), y: 0,
      amp: viewH * (0.06 + (i % 2) * 0.06), t: i * 2.1, f: 0.9 + (i % 3) * 0.35
    });
  }
  glideGate.x = glideGate.fx * worldW;
  glideGate.ready = false;
  princess.x = viewW * 0.14;
  princess.y = groundTop - viewH * 0.3;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(392, 0, 0.25, 'sine', 0.35);
  playNote(587, 0.15, 0.35, 'triangle', 0.35);
}

function respawnGlide() {
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.3;
  princess.vx = 0;
  princess.vy = 0;
  spawnSparkles(princess.x, princess.y, 14, '#cfe6ff');
}

function resizeGlide(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < feathers.length; i++) {
    feathers[i].ax = featherDefs[i].fx * worldW;
    feathers[i].ay = groundTop - featherDefs[i].fy * viewH;
  }
  for (i = 0; i < glideThunder.length; i++) glideThunder[i].x = glideThunder[i].fx * worldW;
  glideGate.x = glideGate.fx * worldW;
}

function collectFeather(f) {
  f.collected = true;
  registerCollected(f);
  spawnSparkles(f.ax, f.ay, 14, '#fff3c8');
  playNote(587 + countCollected(feathers) * 55, 0, 0.25, 'sine', 0.4);
  playNote(880 + countCollected(feathers) * 55, 0.08, 0.3, 'triangle', 0.3);
  if (countCollected(feathers) === GLIDE_COUNT && !glideGate.ready) {
    glideGate.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleGlideTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < feathers.length; i++) {
    if (feathers[i].collected) continue;
    dx = wx - feathers[i].ax;
    dy = py - (feathers[i].ay + Math.sin(feathers[i].phase) * viewH * 0.02);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectFeather(feathers[i]);
      return;
    }
  }
}

function updateGlide(dt) {
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

  // Sulat keinuvat tuulessa; niihin voi myös lentää läpi
  for (i = 0; i < feathers.length; i++) {
    var f = feathers[i];
    if (f.collected) continue;
    f.phase += dt * 1.6;
    var dx = f.ax - princess.x, dy = f.ay - princess.y;
    if (!busy && !celebrating && dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectFeather(f);
  }

  // Ukkospilvet ajelehtivat ja lipuvat hitaasti sivulle
  for (i = 0; i < glideThunder.length; i++) {
    var th = glideThunder[i];
    th.t += dt;
    th.y = th.baseY + Math.sin(th.t * th.f) * th.amp;
    th.x = th.fx * worldW + Math.sin(th.t * 0.35) * viewW * 0.04;
    var tdx = th.x - princess.x, tdy = th.y - (princess.y - viewH * 0.06);
    if (!celebrating && tdx * tdx + tdy * tdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        princess.vx = (tdx > 0 ? -1 : 1) * viewW * 0.25;
        princess.vy = viewH * 0.3;
        spawnSparkles(princess.x, princess.y, 12, '#ffe94f');
      }
    }
  }

  if (glideGate.ready && !celebrating && Math.abs(princess.x - glideGate.x) < viewW * 0.06) {
    startCelebration();
  }

  followCam(princess.x, dt);
  if (Math.random() < dt * 8) spawnSparkles(princess.x - princess.facing * 20, princess.y - viewH * 0.02, 1, '#cfe6ff');
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderGlideBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#9fc8f0');
  sky.addColorStop(0.6, '#cfe6ff');
  sky.addColorStop(1, '#eef7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  // Aurinko
  b.fillStyle = 'rgba(255,246,200,0.9)';
  b.beginPath(); b.arc(w * 0.82, h * 0.14, h * 0.07, 0, Math.PI * 2); b.fill();
  // Kaukoiden vuorten siluetit
  b.fillStyle = '#a8c4e0';
  for (i = 0; i < 8; i++) {
    x = w * (i / 7);
    b.beginPath();
    b.moveTo(x - w * 0.12, groundTop);
    b.lineTo(x, groundTop - h * (0.18 + (i % 3) * 0.07));
    b.lineTo(x + w * 0.12, groundTop);
    b.closePath(); b.fill();
  }
  b.fillStyle = '#e8f2fc';
  for (i = 0; i < 8; i++) {
    x = w * (i / 7);
    var py = groundTop - h * (0.18 + (i % 3) * 0.07);
    b.beginPath();
    b.moveTo(x - w * 0.03, py + h * 0.045);
    b.lineTo(x, py);
    b.lineTo(x + w * 0.03, py + h * 0.045);
    b.closePath(); b.fill();
  }
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < 8; i++) cloudShape(b, w * (0.06 + i * 0.12), h * (0.16 + (i % 3) * 0.09), h * 0.03);
  // Maapinta: kallioinen harjanne
  var gr = b.createLinearGradient(0, groundTop, 0, h);
  gr.addColorStop(0, '#b8cfe4');
  gr.addColorStop(1, '#7f9cbd');
  b.fillStyle = gr;
  b.fillRect(0, groundTop, w, h - groundTop);
  // Tuuliportti maailman lopussa: kaksi lippua ja kaari
  var gx = glideGate.x, gs = h * 0.16;
  b.strokeStyle = '#5a7fa8';
  b.lineWidth = gs * 0.1;
  b.lineCap = 'round';
  b.beginPath(); b.arc(gx, groundTop, gs * 0.9, Math.PI, 0); b.stroke();
  b.fillStyle = '#ff8fc0';
  b.beginPath();
  b.moveTo(gx - gs * 0.9, groundTop - gs * 0.02);
  b.lineTo(gx - gs * 0.9, groundTop - gs * 0.4);
  b.lineTo(gx - gs * 0.6, groundTop - gs * 0.3);
  b.closePath(); b.fill();
  b.beginPath();
  b.moveTo(gx + gs * 0.9, groundTop - gs * 0.02);
  b.lineTo(gx + gs * 0.9, groundTop - gs * 0.4);
  b.lineTo(gx + gs * 0.6, groundTop - gs * 0.3);
  b.closePath(); b.fill();
}

function glDrawFeather(c, x, y, s) {
  // Kotkan sulka: vaalea höyhen pienellä varrella
  c.save();
  c.translate(x, y);
  c.rotate(-0.5);
  c.fillStyle = '#fff8ea';
  c.beginPath();
  c.moveTo(0, s * 1.1);
  c.quadraticCurveTo(-s * 0.75, s * 0.2, 0, -s * 1.1);
  c.quadraticCurveTo(s * 0.75, s * 0.2, 0, s * 1.1);
  c.fill();
  c.strokeStyle = '#d9c9a8';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.beginPath(); c.moveTo(0, s * 1.15); c.lineTo(0, -s * 0.95); c.stroke();
  c.restore();
}

function drawGlide() {
  var i;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  // Portin hehku kun se odottaa
  if (glideGate.ready) {
    var gx = glideGate.x - camX, gy = groundTop - viewH * 0.14;
    var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.2);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.8 + Math.sin(globalT * 5) * 0.2) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < feathers.length; i++) {
    var f = feathers[i];
    if (f.collected) continue;
    var fy = f.ay + Math.sin(f.phase) * viewH * 0.02;
    var fx2 = f.ax + Math.sin(f.phase * 0.6) * viewW * 0.008;
    glDrawFeather(ctx, fx2 - camX, fy, viewH * 0.03);
  }
  for (i = 0; i < glideThunder.length; i++) drawThunderCloud(ctx, glideThunder[i]);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (glideGate.ready && !celebrating) drawEdgeArrow(ctx, glideGate.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, GLIDE_COUNT, function (i2) { return feathers[i2] && feathers[i2].collected; }, glDrawFeather);
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
