'use strict';

// Pupusilta: kolme pupua on jäänyt saarekkeille. Puput kävelevät piirrettyjä
// viivoja pitkin prinsessan luo ja seuraavat häntä pupukoloon. Pudonnut pupu
// palaa saarekkeelleen. Mustepullot täyttävät musteen. Sydämet käytössä.

var BB_BOTTLES = 4;
var bbBottles = [];
var bbBunnies = [];
var bbGround = [[0.0, 0.12], [0.16, 0.21], [0.26, 0.40], [0.45, 0.50], [0.55, 0.68], [0.73, 0.78], [0.83, 1.0]];
var bbIslets = [1, 3, 5];
var bbBurrow = { fx: 0.95, x: 0 };
var bbBottleDefs = [{ fx: 0.06, fy: 0.10 }, { fx: 0.33, fy: 0.10 }, { fx: 0.61, fy: 0.10 }, { fx: 0.90, fy: 0.10 }];

function layoutBunnyBridge() {
  var i, seg;
  platforms = [];
  for (i = 0; i < bbGround.length; i++) {
    seg = bbGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: groundTop, w: (seg[1] - seg[0]) * worldW });
  }
  bbBurrow.x = bbBurrow.fx * worldW;
  for (i = 0; i < bbBottles.length; i++) {
    bbBottles[i].ax = bbBottleDefs[i].fx * worldW;
    bbBottles[i].ay = groundTop - bbBottleDefs[i].fy * viewH;
  }
}

function bbIsletX(idx) {
  var seg = bbGround[bbIslets[idx]];
  return (seg[0] + seg[1]) / 2 * worldW;
}

function initBunnyBridge() {
  var i;
  penCoreReset();
  bbBottles = [];
  for (i = 0; i < BB_BOTTLES; i++) bbBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  bbBunnies = [];
  for (i = 0; i < bbIslets.length; i++) {
    bbBunnies.push({ islet: i, x: 0, y: groundTop, vy: 0, onGround: true, facing: -1, walkPhase: 0, state: 'stuck', earT: i, hop: 0, callT: i * 0.7 });
  }
  layoutBunnyBridge();
  for (i = 0; i < bbBunnies.length; i++) bbBunnies[i].x = bbIsletX(i);
  bbProps();
  tasks = [makeTask(0.33, 'pairs', { pairs: 3 }), makeTask(0.62, 'word', { maxSyl: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.30, 0.60]);
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(659, 0, 0.2, 'sine', 0.3);
  playNote(880, 0.12, 0.3, 'triangle', 0.3);
}

function respawnBunnyBridge() {
  resetPrincess(checkpoint.x, groundTop);
  princess.facing = penDir = 1;
  penStun = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeBunnyBridge(ratio) {
  var i;
  princess.x *= ratio;
  layoutBunnyBridge();
  bbProps();
  for (i = 0; i < bbBunnies.length; i++) bbBunnies[i].x *= ratio;
  penCoreResize(ratio);
}

function bbFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var rx = penPitEdgeX(bbGround, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, groundTop);
    penStun = 0;
  }
}

function bbBunnyFell(b) {
  // Pupu palaa saarekkeelleen, ei sydänmenetystä
  b.x = bbIsletX(b.islet);
  b.y = groundTop;
  b.vy = 0;
  b.onGround = true;
  b.state = 'stuck';
  spawnSparkles(b.x, b.y - viewH * 0.08, 10, '#ffd6ec');
  playNote(330, 0, 0.15, 'triangle', 0.25);
  playNote(262, 0.12, 0.2, 'triangle', 0.25);
}

function bbHomeCount() {
  var i, n = 0;
  for (i = 0; i < bbBunnies.length; i++) if (bbBunnies[i].state === 'home') n++;
  return n;
}

function collectBbBottle(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(800, 0, 0.2, 'sine', 0.35);
  playNote(1200, 0.08, 0.25, 'sine', 0.3);
}

function updateBunnyBridge(dt) {
  var i, b, target, r, allFollow = true;
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);

  if (!busy && !celebrating) penPrincessStep(dt, { onFall: bbFell });
  blockPrincessAtTasks();

  // Puput: saarekkeella jäänyt lähtee prinsessaa kohti, kun tämä on lähellä;
  // seuraaja kulkee perässä ja hyppää koloon perillä
  for (i = 0; i < bbBunnies.length; i++) {
    b = bbBunnies[i];
    b.earT += dt * 3;
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 3);
    if (b.state === 'home') continue;
    if (b.state !== 'follow') allFollow = false;
    target = null;
    if (b.state === 'stuck') {
      b.callT -= dt;
      if (b.callT <= 0) { b.callT = 2.5 + Math.random() * 2; b.hop = 1; if (Math.abs(princess.x - b.x) < viewW * 0.6) playNote(1400 + i * 120, 0, 0.08, 'sine', 0.18); }
      if (Math.abs(princess.x - b.x) < viewW * 0.45) target = princess.x;
    } else {
      target = princess.x - princess.facing * viewH * (0.09 + i * 0.05);
      if (Math.abs(bbBurrow.x - b.x) < viewH * 0.06 && b.onGround) {
        b.state = 'home';
        spawnSparkles(b.x, b.y - viewH * 0.08, 14, '#ffe27a');
        playNote(880 + bbHomeCount() * 120, 0, 0.2, 'sine', 0.35);
        playNote(1320 + bbHomeCount() * 120, 0.1, 0.3, 'sine', 0.3);
        if (bbHomeCount() === bbBunnies.length) startCelebration();
        continue;
      }
      if (Math.abs(bbBurrow.x - b.x) < viewH * 0.06) target = null;
    }
    if (busy || celebrating) target = null;
    r = penWalkerStep(b, dt, { targetX: target, speed: viewW * 0.14, stopDist: viewH * 0.03, onFall: bbBunnyFell });
    if (r === 'walk') b.walkPhase += dt * 9;
    if (b.state === 'stuck') {
      var ddx = b.x - princess.x, ddy = b.y - princess.y;
      if (ddx * ddx + ddy * ddy < viewH * 0.1 * viewH * 0.1) {
        b.state = 'follow';
        b.hop = 1;
        spawnSparkles(b.x, b.y - viewH * 0.12, 12, '#ff7bac');
        playNote(988, 0, 0.1, 'sine', 0.3);
        playNote(1319, 0.08, 0.15, 'sine', 0.3);
      }
    }
  }

  for (i = 0; i < bbBottles.length; i++) {
    var d = bbBottles[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectBbBottle(d);
  }

  // Tökkäys: ensin pupu (hyppy ja piipitys), muuten koristeet; ei kynätilassa
  var tp = penTapPoll();
  if (tp && !bbPokeBunny(tp.x, tp.y)) propsTap(tp.x, tp.y);
  propsUpdate(dt);

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
var BB_PAPER = { paper: '#f7f6e6', hill1: '#d5ecc2', hill2: '#bfe0a3' };
function bunnyBridgeLayers() { return paperLayers(BB_PAPER, renderBunnyBridgeNear); }
function renderBunnyBridgeBg(b, w, h) {
  renderPaperFar(b, w, h, BB_PAPER);
  renderPaperMid(b, w, h, BB_PAPER);
  renderBunnyBridgeNear(b, w, h);
}
function renderBunnyBridgeNear(b, w, h) {
  var i, x;
  renderPaperNear(b, w, h, bbGround, null);
  for (i = 0; i < 14; i++) {
    x = w * (0.02 + i * 0.07);
    drawFlower(b, x, groundTop - h * 0.02, h * 0.012, i % 2 ? '#ff7bac' : '#ffe27a');
  }
  // Pupukolo taustaan; kyltti on tökättävä koriste (bbProps)
  bbDrawBurrow(b, bbBurrow.x, h * 0.1);
}

// Pupukolo: multakumpu reunaviivalla ja tumma aukko
function bbDrawBurrow(c, bx, s) {
  var lw = Math.max(1.2, s * 0.04);
  c.beginPath(); c.arc(bx, groundTop, s * 0.9, Math.PI, 0); c.closePath();
  artFillPath(c, '#8a6a44', groundTop - s * 0.9, groundTop, s * 0.9, { lineColor: '#4a3418', line: lw });
  c.beginPath(); c.arc(bx, groundTop, s * 0.6, Math.PI, 0); c.closePath();
  artFillPath(c, '#3a2a1a', groundTop - s * 0.6, groundTop, s * 0.6, { line: false, shadeTo: '#1a1208' });
  artHighlight(c, bx - s * 0.45, groundTop - s * 0.6, s * 0.25, s * 0.1, 0.25);
}
// Pupukyltti (tökättävä koriste, origo = tolpan juuri): tolppa, taulu ja pupun naama
function bbDrawSign(c, p) {
  var s = p.s, lw = Math.max(1.2, s * 0.04);
  artShadow(c, 0, 0, s * 0.3, s * 0.06, 0.14);
  artLimb(c, -s * 0.16, 0, -s * 0.16, -s * 1.3, s * 0.08, '#c98b4a', '#7a5a30');
  artRoundRect(c, -s * 0.35, -s * 1.5, s * 0.7, s * 0.4, s * 0.08, '#fff6c8', { lineColor: '#b89a5a', line: lw, shadeTo: '#e3d8f5' });
  drawBunny(c, 0, -s * 1.05, s * 0.16, 0, p.t >= 0 ? p.t * 12 : 0, true);
}
// Porkkanamaa (origo = maan pinta): kaksi porkkanaa naatteineen
function bbDrawCarrots(c, p) {
  var s = p.s, i, x;
  artShadow(c, 0, 0, s * 1.4, s * 0.25, 0.12);
  for (i = -1; i <= 1; i += 2) {
    x = i * s * 0.45;
    artBlob(c, x, -s * 0.05, s * 0.28, s * 0.2, '#ff9a3c', { lineColor: '#b85a10' });
    artLimb(c, x - s * 0.1, -s * 0.2, x - s * 0.3, -s * 0.75, s * 0.1, '#6fb35a', '#3f7a35');
    artLimb(c, x + s * 0.1, -s * 0.2, x + s * 0.25, -s * 0.8, s * 0.1, '#6fb35a', '#3f7a35');
  }
}
// Ilmaan ponnahtava porkkana; kultainen hehkuu
function bbDrawCarrot(c, d) {
  var s = d.s, col = d.gold ? '#ffd24f' : '#ff9a3c', line = d.gold ? '#b8860b' : '#b85a10';
  if (d.gold) artGlow(c, 0, 0, s * 2.2, '#fff0a0', 0.6);
  c.beginPath(); c.moveTo(-s * 0.35, -s * 0.6); c.lineTo(s * 0.35, -s * 0.6); c.lineTo(0, s * 0.9); c.closePath();
  artFillPath(c, col, -s * 0.6, s * 0.9, s * 0.4, { lineColor: line });
  artLimb(c, 0, -s * 0.6, -s * 0.25, -s * 1.1, s * 0.12, '#6fb35a', '#3f7a35');
  artLimb(c, 0, -s * 0.6, s * 0.25, -s * 1.15, s * 0.12, '#6fb35a', '#3f7a35');
}
// Porkkanamaasta ponnahtaa porkkana; joka viides on kultainen (yllätys)
function bbCarrotPoke(p) {
  var gold = p.n % 5 === 0;
  propDrop({ x: p.x + (Math.random() - 0.5) * p.s, y: p.y - p.s * 0.3, vx: (Math.random() - 0.5) * viewW * 0.06, vy: -viewH * 0.32,
    ground: p.y - p.s * 0.2, s: p.s * 0.45, gold: gold, life: gold ? 3 : 2, draw: bbDrawCarrot,
    onLand: gold ? function (d) { spawnSparkles(d.x, d.y, 14, '#ffe27a'); } : null });
  if (gold) {
    playNote(1047, 0, 0.12, 'sine', 0.3);
    playNote(1319, 0.1, 0.12, 'sine', 0.3);
    playNote(1568, 0.2, 0.3, 'sine', 0.3);
  } else {
    playNote(700, 0, 0.1, 'triangle', 0.2);
  }
}
// Pupu hypähtää ja piipittää tökkäyksestä (pelkkä koriste, tila ei muutu)
function bbPokeBunny(wx, wy) {
  var i, b;
  for (i = 0; i < bbBunnies.length; i++) {
    b = bbBunnies[i];
    if (b.state === 'home') continue;
    if (Math.hypot(wx - b.x, wy - (b.y - viewH * 0.05)) < viewH * 0.07) {
      b.hop = 1;
      spawnSparkles(b.x, b.y - viewH * 0.1, 8, '#ffd6ec');
      playNote(1500 + i * 150, 0, 0.07, 'square', 0.1);
      playNote(1900 + i * 150, 0.07, 0.09, 'square', 0.08);
      return true;
    }
  }
  return false;
}

// Tökättävät koristeet: porkkanamaa, kaksi paperikukkaa ja pupukyltti.
// Kutsutaan myös resize-koukusta (paikat osuuksina).
function bbProps() {
  var h = viewH, s = h * 0.1;
  propsReset();
  propAdd({ x: worldW * 0.085, y: groundTop, s: h * 0.035, r: h * 0.05, hy: h * 0.02, amp: 0.08, color: '#ffb060', note: 500,
    draw: bbDrawCarrots, poke: bbCarrotPoke });
  propAdd({ x: worldW * 0.375, y: groundTop, s: h * 0.02, r: h * 0.05, hy: h * 0.05, amp: 0.12, col: '#ff7bac', color: '#ff7bac', note: 620,
    draw: penFlowerDraw, poke: penFlowerPoke, update: penFlowerUpdate });
  propAdd({ x: worldW * 0.66, y: groundTop, s: h * 0.02, r: h * 0.05, hy: h * 0.05, amp: 0.12, col: '#ffe27a', color: '#ffe27a', note: 660,
    draw: penFlowerDraw, poke: penFlowerPoke, update: penFlowerUpdate });
  propAdd({ x: bbBurrow.x + s * 1.15, y: groundTop, s: s, r: h * 0.05, hy: s * 1.2, amp: 0.06, color: '#fff6c8', note: 760, draw: bbDrawSign });
}

function drawBbBunny(c, b) {
  var x = b.x - camX, y = b.y, s = viewH * 0.04;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var hop = b.hop * viewH * 0.03 + (b.onGround ? 0 : 0);
  drawBunny(c, x, y, s, hop, b.earT, false);
  if (b.state === 'stuck' && b.hop > 0.5) {
    // Huutomerkki: apua!
    artRoundRect(c, x - s * 0.08, y - s * 2.6, s * 0.16, s * 0.5, s * 0.08, '#ff5f7e', { lineColor: '#a8304e' });
    artCircle(c, x, y - s * 1.95, s * 0.1, '#ff5f7e', { lineColor: '#a8304e' });
  } else if (b.state === 'follow') {
    drawHeartShape(c, x, y - s * 2.3 + Math.sin(globalT * 3) * s * 0.1, s * 0.16, true);
  }
}

function drawBunnyBridge() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < bbBottles.length; i++) {
    if (bbBottles[i].collected) continue;
    penDrawBottle(ctx, bbBottles[i].ax - camX, bbBottles[i].ay + Math.sin(bbBottles[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  for (i = 0; i < bbBunnies.length; i++) if (bbBunnies[i].state !== 'home') drawBbBunny(ctx, bbBunnies[i]);
  drawPenPrincess(ctx);
  drawPenBubblesLayer(ctx);
  drawParticlesLayer(ctx);
  if (!celebrating && bbHomeCount() < bbBunnies.length) {
    var allFollow = true;
    for (i = 0; i < bbBunnies.length; i++) if (bbBunnies[i].state === 'stuck') allFollow = false;
    if (allFollow) drawEdgeArrow(ctx, bbBurrow.x);
  }
  endPlayWorld();
  drawPickupHud(ctx, bbBunnies.length, function (i2) { return bbBunnies[i2] && bbBunnies[i2].state === 'home'; },
    function (c, x, y, s2) { drawBunny(c, x, y + s2 * 0.3, s2 * 0.9, 0, 0, true); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
