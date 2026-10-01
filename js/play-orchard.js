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
  orchardProps();
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
  orchardProps();
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
  // Ei omenaa eikä kynää kädessä: koristeet saavat tökkäyksen (kävely jatkuu silti)
  if (!penMode) propsTap(wx, py);
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

  propsUpdate(dt);
  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
var ORCHARD_PAPER = { paper: '#f6f3e0', hill1: '#e2eec8', hill2: '#cfe4ae' };
function orchardLayers() { return paperLayers(ORCHARD_PAPER, renderOrchardNear); }
function renderOrchardBg(b, w, h) {
  renderPaperFar(b, w, h, ORCHARD_PAPER);
  renderPaperMid(b, w, h, ORCHARD_PAPER);
  renderOrchardNear(b, w, h);
}
function renderOrchardNear(b, w, h) {
  var i, x;
  renderPaperNear(b, w, h, [], null);
  for (i = 0; i < orchardTerraces.length; i++) {
    drawPaperGround(b, orchardTerraces[i].seg[0] * w, orchardTerraceY(i), (orchardTerraces[i].seg[1] - orchardTerraces[i].seg[0]) * w, h);
  }
  // Puut ja kori ovat tökättäviä koristeita (orchardProps), joten ne eivät ole taustassa
  for (i = 0; i < 16; i++) {
    x = w * (0.02 + i * 0.062);
    drawFlower(b, x, orchardTerraceY(2) - h * 0.015, h * 0.011, i % 2 ? '#ff7bac' : '#ffe27a');
  }
}

// Omena: kaksi lohkoa yhtenä reunaviivallisena muotona, kiilto, varsi ja lehti.
// col = väri (kultainen yllätysomena saa oman).
function orchardApplePath(c, x, y, s) {
  c.beginPath();
  c.arc(x - s * 0.28, y, s * 0.62, 0, Math.PI * 2);
  c.arc(x + s * 0.28, y, s * 0.62, 0, Math.PI * 2);
}
function orDrawApple(c, x, y, s, rot, col) {
  col = col || '#ff5f5f';
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artUnion(c, orchardApplePath, 0, 0, s, -s * 0.62, s * 0.62, col, { lineColor: artShade(col, -0.45), line: Math.max(1.2, s * 0.1) });
  artHighlight(c, -s * 0.35, -s * 0.28, s * 0.18, s * 0.1, 0.5);
  artLimb(c, 0, -s * 0.5, s * 0.25, -s * 0.95, s * 0.1, '#8a6a44', '#4a3418');
  artBlob(c, s * 0.34, -s * 0.78, s * 0.22, s * 0.1, '#6fb35a', { rot: -0.5, lineColor: '#3f7a35' });
  c.restore();
}

// Omenapuu (tökättävä koriste, origo = juuri): runko ja kolmilatvuksinen kruunu
function orchardCanopyPath(c, x, y, s) {
  c.beginPath();
  c.arc(x, y, s, 0, Math.PI * 2);
  c.arc(x - s * 0.733, y + s * 0.533, s * 0.733, 0, Math.PI * 2);
  c.arc(x + s * 0.733, y + s * 0.533, s * 0.733, 0, Math.PI * 2);
}
function orchardDrawTree(c) {
  var h = viewH, lw = Math.max(1.2, h * 0.004);
  artShadow(c, 0, 0, h * 0.07, h * 0.014, 0.14);
  artRoundRect(c, -h * 0.012, -h * 0.14, h * 0.024, h * 0.14, h * 0.006, '#8a6a44', { lineColor: '#4a3418', line: lw });
  artUnion(c, orchardCanopyPath, 0, -h * 0.19, h * 0.075, -h * 0.265, -h * 0.095, '#6fb35a', { lineColor: '#3f7a35', line: lw });
  artHighlight(c, -h * 0.03, -h * 0.21, h * 0.03, h * 0.015, 0.3);
}
// Puusta putoaa koristeomena; joka viides on kultainen ja kimaltaa (yllätys)
function orchardTreePoke(p) {
  var gold = p.n % 5 === 0, h = viewH;
  propDrop({ x: p.x + (Math.random() - 0.5) * h * 0.1, y: p.y - h * 0.17, vx: (Math.random() - 0.5) * viewW * 0.05, ground: p.y,
    s: h * 0.02, gold: gold, life: gold ? 3.2 : 2.2,
    draw: function (c, d) {
      if (d.gold) artGlow(c, 0, 0, d.s * 2.5, '#fff0a0', 0.6);
      orDrawApple(c, 0, 0, d.s, 0, d.gold ? '#ffd24f' : '#ff5f5f');
    },
    onLand: gold ? function (d) { spawnSparkles(d.x, d.y, 16, '#ffe27a'); } : null });
  if (gold) {
    playNote(1047, 0, 0.12, 'sine', 0.3);
    playNote(1319, 0.1, 0.12, 'sine', 0.3);
    playNote(1568, 0.2, 0.35, 'sine', 0.3);
  } else {
    playNote(420, 0, 0.1, 'triangle', 0.18);
  }
}
// Kori (tökättävä koriste, origo = pohjan keskikohta): sanka, punos ja kerätyt omenat kurkistavat
function orchardDrawBasket(c, p) {
  var s = p.s, lw = Math.max(1.2, s * 0.05), n = Math.min(3, orchardBasketCount()), i;
  artShadow(c, 0, 0, s * 0.9, s * 0.12, 0.14);
  c.lineCap = 'round';
  c.beginPath(); c.arc(0, -s * 0.9, s * 0.72, Math.PI, 0);
  c.strokeStyle = '#6a4a28'; c.lineWidth = s * 0.09 + lw * 2; c.stroke();
  c.strokeStyle = '#a9743f'; c.lineWidth = s * 0.09; c.stroke();
  for (i = 0; i < n; i++) artCircle(c, (i - (n - 1) / 2) * s * 0.45, -s * 0.95, s * 0.22, '#ff5f5f', { lineColor: '#8a2a2a', hi: 0.4 });
  c.beginPath(); c.moveTo(-s, -s * 0.9); c.lineTo(s, -s * 0.9); c.lineTo(s * 0.72, 0); c.lineTo(-s * 0.72, 0); c.closePath();
  artFillPath(c, '#c98b4a', -s * 0.9, 0, s * 0.5, { lineColor: '#6a4a28', line: lw });
  c.strokeStyle = 'rgba(90,55,25,0.35)'; c.lineWidth = lw;
  for (i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-s * (1 - i * 0.09), -s * (0.9 - i * 0.3)); c.lineTo(s * (1 - i * 0.09), -s * (0.9 - i * 0.3)); c.stroke(); }
  c.lineCap = 'butt';
}
function orchardBasketPoke(p) {
  if (orchardBasketCount() > 0) spawnSparkles(p.x, p.y - p.s, 8, '#ff5f5f');
}

// Tökättävät koristeet: kolme omenapuuta ja kori. Kutsutaan myös resize-koukusta.
function orchardProps() {
  var i, h = viewH, tr;
  propsReset();
  for (i = 0; i < orchardTrees.length; i++) {
    tr = orchardTrees[i];
    propAdd({ x: tr.x, y: orchardTerraceY(tr.terrace), r: h * 0.09, hy: h * 0.1, amp: 0.05, color: '#8fd87a', note: 500 + i * 60,
      draw: orchardDrawTree, poke: orchardTreePoke });
  }
  propAdd({ x: orchardBasket.x, y: groundTop, s: h * 0.09, r: h * 0.08, hy: h * 0.05, amp: 0.06, color: '#ffb060', note: 720,
    draw: orchardDrawBasket, poke: orchardBasketPoke });
}

function drawOrchard() {
  var i, a;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
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
  endPlayWorld();
  drawPickupHud(ctx, ORCHARD_COUNT, function (i2) { return orchardApples[i2] && orchardApples[i2].collected; },
    function (c, x, y, s) { orDrawApple(c, x, y, s, 0); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
