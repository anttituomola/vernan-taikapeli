'use strict';

// Taikakynä: saaren ensimmäinen kenttä. Pohjassa pitäminen kävelyttää prinsessaa
// sormea kohti; rotkon reunalle hän pysähtyy. Kynänappi ottaa kynän käteen, ja
// silloin piirretään siltoja ja ramppeja. Ympyrä myrskypilven ympärille vangitsee
// sen kuplaan. Mustepullot täyttävät musteen. Sydämet käytössä. Ydin: pen-core.js.

var PEN_BOTTLES = 8;
var penBottles = [];
var penClouds = [];
var penGround = [[0.0, 0.14], [0.19, 0.34], [0.40, 0.55], [0.60, 0.74], [0.80, 1.0]];
var penRaised = { 2: 0.22 };   // segmentti 2 on korkea tasanne (osuus viewH:sta)
var penFrame = { fx: 0.96, x: 0, open: false };
var penBottleDefs = [
  { fx: 0.07, fy: 0.10 }, { fx: 0.165, fy: 0.40 }, { fx: 0.26, fy: 0.12 }, { fx: 0.37, fy: 0.30 },
  { fx: 0.47, fy: 0.36 }, { fx: 0.575, fy: 0.12 }, { fx: 0.67, fy: 0.44 }, { fx: 0.90, fy: 0.12 }
];
var penCloudDefs = [{ zA: 0.21, zB: 0.33, fx: 0.27 }, { zA: 0.61, zB: 0.73, fx: 0.67 }];

function penSegY(i) {
  return groundTop - (penRaised[i] || 0) * viewH;
}

function layoutPen() {
  var i, seg;
  platforms = [];
  for (i = 0; i < penGround.length; i++) {
    seg = penGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: penSegY(i), w: (seg[1] - seg[0]) * worldW });
  }
  penFrame.x = penFrame.fx * worldW;
  for (i = 0; i < penBottles.length; i++) {
    penBottles[i].ax = penBottleDefs[i].fx * worldW;
    penBottles[i].ay = groundTop - penBottleDefs[i].fy * viewH;
  }
}

function initPen() {
  var i;
  setupRunLevel(17, '#fdf6e3');
  penCoreReset();
  penHooks.bubbleTargets = function () { return penClouds; };
  penBottles = [];
  for (i = 0; i < PEN_BOTTLES; i++) penBottles.push({ ax: 0, ay: 0, collected: false, phase: Math.random() * Math.PI * 2 });
  penClouds = [];
  for (i = 0; i < penCloudDefs.length; i++) {
    penClouds.push({ zA: penCloudDefs[i].zA, zB: penCloudDefs[i].zB, x: penCloudDefs[i].fx * worldW, y: groundTop - viewH * 0.13, dir: 1, bubbleT: 0, t: i });
  }
  layoutPen();
  tasks = [makeTask(0.30, 'shadow'), makeTask(0.66, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.37, 0.77]);
  penFrame.open = false;
  resetPrincess(viewW * 0.06, groundTop);
  princess.facing = 1;
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(784, 0.12, 0.3, 'triangle', 0.35);
}

function respawnPen() {
  resetPrincess(checkpoint.x, penGroundYAt(checkpoint.x));
  princess.facing = penDir = 1;
  penStun = 0;
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizePen(ratio) {
  var i;
  princess.x *= ratio;
  layoutPen();
  for (i = 0; i < penClouds.length; i++) { penClouds[i].x *= ratio; penClouds[i].y = groundTop - viewH * 0.13; }
  penCoreResize(ratio);
}

function penFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.08, 14, '#c9a0ff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) {
    var rx = penPitEdgeX(penGround, princess.x);
    if (rx === null) rx = checkpoint.x;
    resetPrincess(rx, penGroundYAt(rx));
    penStun = 0;
    spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#c9a0ff');
  }
}

function collectPenBottle(d) {
  d.collected = true;
  registerCollected(d);
  penInk = penInkMax;
  spawnSparkles(d.ax, d.ay, 14, '#8a4dff');
  playNote(700 + countCollected(penBottles) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(penBottles) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(penBottles) === PEN_BOTTLES && !penFrame.open) {
    penFrame.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function updatePen(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();
  penCoreUpdate(dt);

  // Myrskypilvet liikkuvat pään korkeudella; kuplassa oleva ei liiku eikä satuta
  for (i = 0; i < penClouds.length; i++) {
    var cl = penClouds[i];
    cl.t += dt;
    if (cl.bubbleT > 0) { cl.bubbleT -= dt; continue; }
    if (!busy && !celebrating) {
      cl.x += cl.dir * viewW * 0.05 * dt;
      if (cl.x < cl.zA * worldW) { cl.x = cl.zA * worldW; cl.dir = 1; }
      if (cl.x > cl.zB * worldW) { cl.x = cl.zB * worldW; cl.dir = -1; }
    }
    var cdx = cl.x - princess.x, cdy = cl.y - (princess.y - viewH * 0.1);
    if (!celebrating && cdx * cdx + cdy * cdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        penStun = 0.8;
        princess.x = Math.max(viewH * 0.05, princess.x - penDir * viewW * 0.04);
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#9aa0b8');
      }
    }
  }

  if (!busy && !celebrating) penPrincessStep(dt, { onFall: penFell });
  blockPrincessAtTasks();

  for (i = 0; i < penBottles.length; i++) {
    var d = penBottles[i];
    if (d.collected) continue;
    d.phase += dt * 2;
    var dx = d.ax - princess.x, dy = (d.ay + Math.sin(d.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectPenBottle(d);
  }

  if (penFrame.open && !celebrating && Math.abs(princess.x - penFrame.x) < viewH * 0.07) {
    startCelebration();
  }

  followCam(princess.x, dt);
  updateCheckpoints(princess.x, princess.y);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderPenBg(b, w, h) {
  renderPaperScene(b, w, h, penGround, penSegY, {});
  drawPenFrame(b, penFrame.x, groundTop, h);
}

function drawPenFrame(b, x, baseY, h) {
  var fw = h * 0.16, fh = h * 0.22;
  b.fillStyle = '#a9743f';
  roundRect(b, x - fw / 2 - h * 0.015, baseY - fh - h * 0.05, fw + h * 0.03, fh + h * 0.03, h * 0.01);
  b.fill();
  b.fillStyle = '#fffaf0';
  b.fillRect(x - fw / 2, baseY - fh - h * 0.035, fw, fh);
  b.fillStyle = '#7a5a30';
  b.fillRect(x - h * 0.01, baseY - h * 0.05, h * 0.02, h * 0.05);
}

function drawPenCloud(c, cl) {
  var x = cl.x - camX, y = cl.y, r = viewH * 0.04;
  if (x < -r * 4 || x > viewW + r * 4) return;
  var bubbled = cl.bubbleT > 0;
  c.fillStyle = bubbled ? '#c9c4dc' : '#7d7a99';
  cloudShape(c, x, y, r * 0.55);
  c.strokeStyle = '#4a4560';
  c.lineWidth = Math.max(1.5, r * 0.08);
  c.beginPath(); c.arc(x, y, r * 0.66, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28, y - r * 0.1, r * 0.16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#222';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.1, r * 0.07, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.28, y - r * 0.1, r * 0.07, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#222';
  c.lineWidth = Math.max(1.5, r * 0.07);
  c.beginPath();
  if (bubbled) c.arc(x, y + r * 0.15, r * 0.22, 0.2, Math.PI - 0.2);
  else c.arc(x, y + r * 0.45, r * 0.22, Math.PI + 0.3, Math.PI * 2 - 0.3);
  c.stroke();
  if (!bubbled) {
    c.fillStyle = '#ffe94f';
    c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.5); c.lineTo(x + r * 0.15, y + r * 0.5); c.lineTo(x, y + r * 1.0); c.closePath(); c.fill();
  }
}

function drawPenFrameGlow(c) {
  var x = penFrame.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var fw = h * 0.16, fh = h * 0.22, top = groundTop - fh - h * 0.035;
  if (penFrame.open) {
    var cols = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'], i;
    c.lineWidth = fh * 0.06;
    for (i = 0; i < cols.length; i++) {
      c.strokeStyle = cols[i];
      c.beginPath(); c.arc(x, top + fh * 0.95, fw * (0.42 - i * 0.055), Math.PI, 0); c.stroke();
    }
    var g = c.createRadialGradient(x, top + fh / 2, fh * 0.2, x, top + fh / 2, fh * 1.4);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, top + fh / 2, fh * 1.4, 0, Math.PI * 2); c.fill();
    drawStar(c, x, top - h * 0.06, h * 0.035, globalT, 1);
  } else {
    c.strokeStyle = 'rgba(120,100,160,0.35)';
    c.lineWidth = Math.max(1.5, h * 0.004);
    c.beginPath(); c.arc(x, top + fh * 0.95, fw * 0.4, Math.PI, 0); c.stroke();
  }
}

function drawPen() {
  var i;
  if (!drawWorldBg()) return;
  drawPenStrokesLayer(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], penGroundYAt(checkpoints[i].x));
  drawPenFrameGlow(ctx);
  for (i = 0; i < penBottles.length; i++) {
    if (penBottles[i].collected) continue;
    drawInkBottle(ctx, penBottles[i].ax - camX, penBottles[i].ay + Math.sin(penBottles[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  for (i = 0; i < penClouds.length; i++) drawPenCloud(ctx, penClouds[i]);
  drawPenBubblesLayer(ctx);
  drawPenPrincess(ctx);
  drawParticlesLayer(ctx);
  if (penFrame.open && !celebrating) drawEdgeArrow(ctx, penFrame.x);
  drawCelebrateLayer();
  drawPickupHud(ctx, PEN_BOTTLES, function (i2) { return penBottles[i2] && penBottles[i2].collected; },
    function (c, x, y, s2) { drawInkBottle(c, x, y, s2 * 0.75); });
  drawHearts(ctx);
  drawPenInk(ctx);
  drawTaskOverlay(ctx);
}
