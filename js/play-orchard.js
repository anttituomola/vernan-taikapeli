'use strict';

// Omenavarat: kuusi omenaa roikkuu puissa terassien yläpuolella. Napauta
// omena pudottaaksesi sen — se vierii (käy) piirrettyjä rampppeja pitkin
// kohti koria. Rotkoon pudonnut omena palaa puuhunsa; prinsessalta menee
// sydän. Kun kaikki omenat ovat korissa, kori hehkuu ja kenttä juhlii.

var ORCHARD_COUNT = 6;
var orchardApples = [];
var orchardBasket = { fx: 0.93, x: 0 };
// Terassit laskevat korvas koriin päin; välissä kaksi rotkoa
var orchardTerraces = [
  { seg: [0.0, 0.30], dy: 0.18 },
  { seg: [0.36, 0.62], dy: 0.09 },
  { seg: [0.68, 1.0], dy: 0.0 }
];
var orchardTrees = [
  { fx: 0.13, terrace: 0 },
  { fx: 0.47, terrace: 1 },
  { fx: 0.79, terrace: 2 }
];

function orchardTerraceY(ti) {
  return groundTop - orchardTerraces[ti].dy * viewH;
}

function layoutOrchard() {
  var i, t;
  platforms = [];
  for (i = 0; i < orchardTerraces.length; i++) {
    t = orchardTerraces[i];
    platforms.push({ kind: 'ground', x: t.seg[0] * worldW, y: orchardTerraceY(i), w: (t.seg[1] - t.seg[0]) * worldW });
  }
  orchardBasket.x = orchardBasket.fx * worldW;
  for (i = 0; i < orchardTrees.length; i++) orchardTrees[i].x = orchardTrees[i].fx * worldW;
}

function initOrchard() {
  var i, tr;
  penCoreReset();
  layoutOrchard();
  orchardApples = [];
  for (i = 0; i < ORCHARD_COUNT; i++) {
    tr = orchardTrees[Math.floor(i / 2)];
    orchardApples.push({
      tree: Math.floor(i / 2),
      hx: tr.fx + (i % 2 ? 0.028 : -0.024), hy: 0, // roikkumapaikka (worldfx, lasketaan alla)
      x: 0, y: 0, vy: 0, onGround: false, facing: 1,
      state: 'tree', rot: 0, phase: Math.random() * Math.PI * 2,
      collected: false,
      onRestore: function (a) { orchardAppleHome(a); }
    });
  }
  for (i = 0; i < orchardApples.length; i++) orchardAppleHome(orchardApples[i]);
  tasks = [makeTask(0.42, 'pattern'), makeTask(0.74, 'shadow')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.36, 0.68]);
  resetPrincess(viewW * 0.06, orchardTerraceY(0));
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(523, 0, 0.2, 'sine', 0.3);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

// Omena takaisin oksalle roikkumaan
function orchardAppleHome(a) {
  var tr = orchardTrees[a.tree];
  a.x = a.hx * worldW;
  a.y = orchardTerraceY(tr.terrace) - viewH * (0.16 + (a.tree % 2) * 0.02);
  a.vy = 0;
  a.onGround = false;
  a.state = 'tree';
  a.collected = false;
}

function respawnOrchard() {
  resetPrincess(checkpoint.x, checkpoint.y);
  princess.facing = penDir = 1;
  penStun = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeOrchard(ratio) {
  var i;
  princess.x *= ratio;
  layoutOrchard();
  for (i = 0; i < orchardApples.length; i++) {
    orchardApples[i].x *= ratio;
    if (orchardApples[i].state === 'tree') orchardAppleHome(orchardApples[i]);
  }
  penCoreResize(ratio);
}

function orchardPrincessFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var segs = orchardTerraces.map(function (t) { return t.seg; });
    var rx = penPitEdgeX(segs, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, penGroundYAt(rx));
    penStun = 0;
  }
}

function orchardAppleFell(a) {
  // Rotkoon pudonnut omena palaa puuhunsa, ei sydänmenetystä
  orchardAppleHome(a);
  spawnSparkles(a.x, a.y, 10, '#ffd6ec');
  playNote(330, 0, 0.15, 'triangle', 0.25);
  playNote(262, 0.12, 0.2, 'triangle', 0.25);
}

function orchardBasketCount() {
  var i, n = 0;
  for (i = 0; i < orchardApples.length; i++) if (orchardApples[i].collected) n++;
  return n;
}

function dropOrchardApple(a) {
  a.state = 'roll';
  a.onGround = false;
  a.vy = 0;
  playNote(740, 0, 0.12, 'sine', 0.3);
  playNote(554, 0.08, 0.15, 'sine', 0.25);
}

function handleOrchardTap(px, py) {
  penStart(px, py);
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy, r = viewH * 0.06;
  for (i = 0; i < orchardApples.length; i++) {
    var a = orchardApples[i];
    if (a.state !== 'tree') continue;
    dx = wx - a.x;
    dy = py - a.y;
    if (dx * dx + dy * dy < r * r) { dropOrchardApple(a); return; }
  }
}

function updateOrchard(dt) {
  var i, a, r;
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);

  if (!busy && !celebrating) penPrincessStep(dt, { onFall: orchardPrincessFell });
  blockPrincessAtTasks();

  // Omenat: puusta pudonnut vierii pintoja pitkin koria kohti
  for (i = 0; i < orchardApples.length; i++) {
    a = orchardApples[i];
    if (a.state === 'tree' || a.collected) continue;
    r = penWalkerStep(a, dt, {
      targetX: (busy || celebrating) ? null : orchardBasket.x,
      speed: viewW * 0.13, stopDist: viewH * 0.02,
      onFall: orchardAppleFell
    });
    if (r === 'walk') a.rot += dt * 6;
    if (a.state === 'roll' && a.onGround && Math.abs(a.x - orchardBasket.x) < viewH * 0.05 &&
        Math.abs(a.y - groundTop) < viewH * 0.05) {
      a.collected = true;
      registerCollected(a);
      spawnSparkles(orchardBasket.x, groundTop - viewH * 0.08, 16, '#ff5f5f');
      playNote(660 + orchardBasketCount() * 66, 0, 0.25, 'sine', 0.4);
      playNote(990 + orchardBasketCount() * 66, 0.08, 0.3, 'triangle', 0.3);
      if (orchardBasketCount() === ORCHARD_COUNT) startCelebration();
    }
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderOrchardBg(b, w, h) {
  var i, x, tr, ty;
  renderPaperScene(b, w, h, [], null, { paper: '#f6f3e0', hill1: '#e2eec8', hill2: '#cfe4ae' });
  // Terassit ja niiden reunat
  for (i = 0; i < orchardTerraces.length; i++) {
    drawPaperGround(b, orchardTerraces[i].seg[0] * w, orchardTerraceY(i), (orchardTerraces[i].seg[1] - orchardTerraces[i].seg[0]) * w, h);
  }
  // Omenapuut terassilla
  for (i = 0; i < orchardTrees.length; i++) {
    tr = orchardTrees[i];
    ty = orchardTerraceY(tr.terrace);
    x = tr.x;
    b.fillStyle = '#8a6a44';
    b.fillRect(x - h * 0.012, ty - h * 0.14, h * 0.024, h * 0.14);
    b.fillStyle = '#6fb35a';
    b.beginPath(); b.arc(x, ty - h * 0.19, h * 0.075, 0, Math.PI * 2); b.fill();
    b.beginPath(); b.arc(x - h * 0.055, ty - h * 0.15, h * 0.055, 0, Math.PI * 2); b.fill();
    b.beginPath(); b.arc(x + h * 0.055, ty - h * 0.15, h * 0.055, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgba(255,255,255,0.25)';
    b.beginPath(); b.arc(x - h * 0.03, ty - h * 0.21, h * 0.03, 0, Math.PI * 2); b.fill();
  }
  // Kukkia
  for (i = 0; i < 16; i++) {
    x = w * (0.02 + i * 0.062);
    drawFlower(b, x, orchardTerraceY(2) - h * 0.015, h * 0.011, i % 2 ? '#ff7bac' : '#ffe27a');
  }
  // Omenakori
  var bx = orchardBasket.x, s = h * 0.09;
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
}

function orDrawApple(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  c.fillStyle = '#ff5f5f';
  c.beginPath(); c.arc(-s * 0.28, 0, s * 0.62, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.28, 0, s * 0.62, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.arc(-s * 0.35, -s * 0.28, s * 0.18, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a6a44';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.beginPath(); c.moveTo(0, -s * 0.5); c.quadraticCurveTo(s * 0.1, -s * 0.85, s * 0.25, -s * 0.95); c.stroke();
  c.fillStyle = '#6fb35a';
  c.beginPath(); c.ellipse(s * 0.34, -s * 0.78, s * 0.22, s * 0.1, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawOrchard() {
  var i, a;
  if (!drawWorldBg()) return;
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) {
    drawLantern(ctx, checkpoints[i], penGroundYAt(checkpoints[i].x));
  }
  for (i = 0; i < orchardApples.length; i++) {
    a = orchardApples[i];
    if (a.collected) continue;
    var sway = a.state === 'tree' ? Math.sin(a.phase + globalT * 1.5) * viewH * 0.006 : 0;
    orDrawApple(ctx, a.x - camX + sway, a.y, viewH * 0.026, a.state === 'tree' ? 0 : a.rot);
  }
  drawPenPrincess(ctx);
  drawPenBubblesLayer(ctx);
  drawParticlesLayer(ctx);
  if (!celebrating && orchardBasketCount() < ORCHARD_COUNT) {
    // Nuoli koriin, kun kaikki pudotetut omenat ovat liikkeellä tai korissa
    var anyRolling = false, anyTree = false;
    for (i = 0; i < orchardApples.length; i++) {
      if (orchardApples[i].collected) continue;
      if (orchardApples[i].state === 'tree') anyTree = true; else anyRolling = true;
    }
    if (anyRolling && !anyTree) drawEdgeArrow(ctx, orchardBasket.x);
  }
  drawCelebrateLayer();
  drawPickupHud(ctx, ORCHARD_COUNT, function (i2) { return orchardApples[i2] && orchardApples[i2].collected; },
    function (c, x, y, s) { orDrawApple(c, x, y, s, 0); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
