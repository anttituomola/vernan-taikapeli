'use strict';

// Marjaniitty: kiireetön hoivakenttä ilman sydämiä. Mansikat ja mustikat
// kerätään koriin sormella tai ohitse ratsastaen; puput hyppäävät ilosta
// jokaisesta marjasta. Kori hehkuu kun se on täynnä — vie se perille.

var BERRY_COUNT = 8;
var berries = [];
var berryBunnies = [];
var berryBasket = { fx: 0.95, x: 0, ready: false };
var berryDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];
var BERRY_KINDS = ['mansikka', 'mustikka'];

function berryPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initBerry() {
  var i;
  tasks = [makeTask(0.36, 'pairs', { pairs: 3 }), makeTask(0.70, 'sort')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  berries = [];
  for (i = 0; i < BERRY_COUNT; i++) {
    berries.push({
      ax: berryDefs[i].fx * worldW, ay: groundTop - berryDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, kind: BERRY_KINDS[i % 2]
    });
  }
  berryBunnies = [];
  for (i = 0; i < 3; i++) {
    berryBunnies.push({ fx: 0.22 + i * 0.27, x: 0, y: 0, hop: 0, earT: i * 1.3, facing: i % 2 ? -1 : 1 });
  }
  for (i = 0; i < berryBunnies.length; i++) {
    berryBunnies[i].x = berryBunnies[i].fx * worldW;
    berryBunnies[i].y = berryPathY(0.86);
  }
  berryBasket.x = berryBasket.fx * worldW;
  berryBasket.ready = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = berryPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnBerry() {}

function resizeBerry(ratio) {
  var i;
  for (i = 0; i < berries.length; i++) {
    berries[i].ax = berryDefs[i].fx * worldW;
    berries[i].ay = groundTop - berryDefs[i].fy * viewH;
  }
  for (i = 0; i < berryBunnies.length; i++) {
    berryBunnies[i].x = berryBunnies[i].fx * worldW;
    berryBunnies[i].y = berryPathY(0.86);
  }
  berryBasket.x = berryBasket.fx * worldW;
}

function collectBerry(be) {
  be.collected = true;
  spawnSparkles(be.ax, be.ay, 14, be.kind === 'mansikka' ? '#ff5f7e' : '#6f5cff');
  playNote(660 + countCollected(berries) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(berries) * 55, 0.08, 0.3, 'sine', 0.3);
  // Lähin pupu hyppää ilosta
  var i, best = null, bd = 1e9;
  for (i = 0; i < berryBunnies.length; i++) {
    var d = Math.abs(berryBunnies[i].x - be.ax);
    if (d < bd) { bd = d; best = berryBunnies[i]; }
  }
  if (best) best.hop = 1;
  if (countCollected(berries) === BERRY_COUNT && !berryBasket.ready) {
    berryBasket.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleBerryTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < berries.length; i++) {
    var be = berries[i];
    if (be.collected) continue;
    dx = wx - be.ax;
    dy = wy - (be.ay + Math.sin(be.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectBerry(be);
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateBerry(dt) {
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

  // Marjat kimaltelevat; niiden läpi voi myös ratsastaa
  for (i = 0; i < berries.length; i++) {
    var be = berries[i];
    be.phase += dt * 2;
    if (!be.collected && !busy && !celebrating) {
      dx = be.ax - unicorn.x;
      dy = be.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectBerry(be);
    }
  }

  // Puput pomppivat ja heiluttavat korviaan
  for (i = 0; i < berryBunnies.length; i++) {
    var bu = berryBunnies[i];
    bu.earT += dt * 3;
    if (bu.hop > 0) bu.hop = Math.max(0, bu.hop - dt * 2.5);
  }

  if (berryBasket.ready && !celebrating && Math.abs(unicorn.x - berryBasket.x) < viewW * 0.08) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderBerryBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#b8e6ff');
  sky.addColorStop(1, '#eefaff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, groundTop + 2);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 9; i++) cloudShape(b, w * (0.05 + i * 0.11), h * (0.1 + (i % 3) * 0.07), h * 0.03);
  b.fillStyle = '#a7dd8f';
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.12 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  var grass = b.createLinearGradient(0, groundTop, 0, h);
  grass.addColorStop(0, '#8fd97a');
  grass.addColorStop(1, '#5fb356');
  b.fillStyle = grass;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,180,0.45)';
  b.fillRect(0, groundTop + h * 0.02, w, groundBottom - groundTop - h * 0.02);
  // Marjapensaat koristeina
  for (i = 0; i < 6; i++) {
    x = w * (0.10 + i * 0.16) + (i % 2) * h * 0.03;
    drawBush(b, x, groundTop - h * 0.01, h * 0.08);
    b.fillStyle = i % 2 ? '#6f5cff' : '#ff5f7e';
    var k;
    for (k = 0; k < 4; k++) {
      b.beginPath();
      b.arc(x - h * 0.03 + (k % 2) * h * 0.05, groundTop - h * (0.05 + 0.03 * (k > 1 ? 1 : 0)), h * 0.008, 0, Math.PI * 2);
      b.fill();
    }
  }
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
  }
  // Marjakori
  var bx = berryBasket.x, s = h * 0.09;
  b.fillStyle = '#c98b4a';
  b.beginPath();
  b.moveTo(bx - s, groundTop - s * 0.9);
  b.lineTo(bx + s, groundTop - s * 0.9);
  b.lineTo(bx + s * 0.72, groundTop);
  b.lineTo(bx - s * 0.72, groundTop);
  b.closePath(); b.fill();
  b.strokeStyle = '#a9743f';
  b.lineWidth = s * 0.09;
  b.beginPath(); b.arc(bx, groundTop - s * 0.9, s * 0.72, Math.PI, 0); b.stroke();
  b.fillStyle = 'rgba(0,0,0,0.12)';
  for (i = -1; i <= 1; i++) b.fillRect(bx + i * s * 0.5 - s * 0.04, groundTop - s * 0.82, s * 0.08, s * 0.72);
}

function beDrawBerry(c, x, y, s, kind) {
  var i;
  if (kind === 'mansikka') {
    c.fillStyle = '#ff5f7e';
    c.beginPath();
    c.moveTo(x - s * 0.8, y - s * 0.3);
    c.quadraticCurveTo(x - s * 0.85, y + s * 0.6, x, y + s);
    c.quadraticCurveTo(x + s * 0.85, y + s * 0.6, x + s * 0.8, y - s * 0.3);
    c.quadraticCurveTo(x, y - s * 0.75, x - s * 0.8, y - s * 0.3);
    c.fill();
    c.fillStyle = '#ffe9b8';
    for (i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(x + (i % 2 ? 0.3 : -0.3) * s * (i < 3 ? 1 : 0.4), y - s * 0.1 + i * s * 0.22, s * 0.08, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#5fd36b';
    c.beginPath(); c.moveTo(x, y - s * 0.75); c.lineTo(x - s * 0.35, y - s * 0.5); c.lineTo(x + s * 0.35, y - s * 0.5); c.closePath(); c.fill();
  } else {
    c.fillStyle = '#6f5cff';
    var offs = [[-0.4, 0.2], [0.4, 0.2], [0, -0.35], [0, 0.55]];
    for (i = 0; i < offs.length; i++) {
      c.beginPath(); c.arc(x + offs[i][0] * s, y + offs[i][1] * s, s * 0.42, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (i = 0; i < offs.length; i++) {
      c.beginPath(); c.arc(x + offs[i][0] * s - s * 0.12, y + offs[i][1] * s - s * 0.12, s * 0.1, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawBerry() {
  var i, order = [];
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  // Korin hehku kun se odottaa täyttä lastia
  if (berryBasket.ready) {
    var bx = berryBasket.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.08, viewH * 0.01, bx, groundTop - viewH * 0.08, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.08, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < berries.length; i++) {
    if (berries[i].collected) continue;
    var by = berries[i].ay + Math.sin(berries[i].phase) * viewH * 0.012;
    beDrawBerry(ctx, berries[i].ax - camX, by, viewH * 0.026, berries[i].kind);
  }
  // Puput ja yksisarvinen syvyysjärjestyksessä
  for (i = 0; i < berryBunnies.length; i++) order.push({ y: berryBunnies[i].y, b: berryBunnies[i] });
  order.push({ y: unicorn.y, u: true });
  order.sort(function (a, b2) { return a.y - b2.y; });
  var us = viewH / 800;
  for (i = 0; i < order.length; i++) {
    if (order[i].u) {
      drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
    } else {
      var bu = order[i].b;
      drawBunny(ctx, bu.x - camX, bu.y, viewH * 0.04, bu.hop * viewH * 0.03, bu.earT, false);
    }
  }
  drawParticlesLayer(ctx);
  if (berryBasket.ready && !celebrating) drawEdgeArrow(ctx, berryBasket.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, BERRY_COUNT, function (i2) { return berries[i2] && berries[i2].collected; },
    function (c, x, y, s) { beDrawBerry(c, x, y, s, 'mansikka'); });
  drawTaskOverlay(ctx);
}
