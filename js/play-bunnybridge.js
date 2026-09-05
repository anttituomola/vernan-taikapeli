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
  setupRunLevel(19, '#f3f7e8');
  penCoreReset();
  bbBottles = [];
  for (i = 0; i < BB_BOTTLES; i++) bbBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  bbBunnies = [];
  for (i = 0; i < bbIslets.length; i++) {
    bbBunnies.push({ islet: i, x: 0, y: groundTop, vy: 0, onGround: true, facing: -1, walkPhase: 0, state: 'stuck', earT: i, hop: 0, callT: i * 0.7 });
  }
  layoutBunnyBridge();
  for (i = 0; i < bbBunnies.length; i++) bbBunnies[i].x = bbIsletX(i);
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

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderBunnyBridgeBg(b, w, h) {
  var i, x;
  renderPaperScene(b, w, h, bbGround, null, { paper: '#f7f6e6', hill1: '#d5ecc2', hill2: '#bfe0a3' });
  // Kukkia saarekkeille ja pupukolo lopussa
  for (i = 0; i < 14; i++) {
    x = w * (0.02 + i * 0.07);
    drawFlower(b, x, groundTop - h * 0.02, h * 0.012, i % 2 ? '#ff7bac' : '#ffe27a');
  }
  var bx = bbBurrow.x, s = h * 0.1;
  b.fillStyle = '#8a6a44';
  b.beginPath(); b.arc(bx, groundTop, s * 0.9, Math.PI, 0); b.fill();
  b.fillStyle = '#3a2a1a';
  b.beginPath(); b.arc(bx, groundTop, s * 0.6, Math.PI, 0); b.fill();
  b.fillStyle = '#c98b4a';
  b.fillRect(bx + s * 0.95, groundTop - s * 1.3, s * 0.08, s * 1.3);
  b.fillStyle = '#fff6c8';
  roundRect(b, bx + s * 0.8, groundTop - s * 1.5, s * 0.7, s * 0.4, s * 0.08);
  b.fill();
  drawBunny(b, bx + s * 1.15, groundTop - s * 1.05, s * 0.16, 0, 0, true);
}

function drawBbBunny(c, b) {
  var x = b.x - camX, y = b.y, s = viewH * 0.04;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var hop = b.hop * viewH * 0.03 + (b.onGround ? 0 : 0);
  drawBunny(c, x, y, s, hop, b.earT, false);
  if (b.state === 'stuck' && b.hop > 0.5) {
    // Huutomerkki: apua!
    c.fillStyle = '#ff5f7e';
    c.fillRect(x - s * 0.08, y - s * 2.6, s * 0.16, s * 0.5);
    c.beginPath(); c.arc(x, y - s * 1.95, s * 0.1, 0, Math.PI * 2); c.fill();
  } else if (b.state === 'follow') {
    drawHeartShape(c, x, y - s * 2.3 + Math.sin(globalT * 3) * s * 0.1, s * 0.16, true);
  }
}

function drawBunnyBridge() {
  var i;
  if (!drawWorldBg()) return;
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < bbBottles.length; i++) {
    if (bbBottles[i].collected) continue;
    drawInkBottle(ctx, bbBottles[i].ax - camX, bbBottles[i].ay + Math.sin(bbBottles[i].phase) * viewH * 0.012, viewH * 0.024);
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
  drawCelebrateLayer();
  drawPickupHud(ctx, bbBunnies.length, function (i2) { return bbBunnies[i2] && bbBunnies[i2].state === 'home'; },
    function (c, x, y, s2) { drawBunny(c, x, y + s2 * 0.3, s2 * 0.9, 0, 0, true); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
