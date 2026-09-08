'use strict';

// Tähtisumu: kiireetön kuutamokenttä ilman sydämiä ja ilman liikkumista.
// Pilvet ajelehtivat tähtien päällä. Napauta pilveä puhaltaaksesi sen hetkeksi
// pois, ja napauta paljastunutta tähteä kerätäksesi sen. Kuusi tähteä.
// Tehtävät avautuvat keräilyn edetessä (käsin, kuten Kaivoksessa).

var STARS_COUNT = 6;
var nebStars = [];
var nebClouds = [];
var nebCollected = 0;

var nebStarDefs = [
  { fx: 0.16, fy: 0.30 }, { fx: 0.36, fy: 0.22 }, { fx: 0.55, fy: 0.34 },
  { fx: 0.74, fy: 0.24 }, { fx: 0.86, fy: 0.40 }, { fx: 0.45, fy: 0.46 }
];
var nebCloudDefs = [
  { fx: 0.26, fy: 0.28, amp: 0.07, f: 0.5 },
  { fx: 0.62, fy: 0.30, amp: 0.09, f: 0.4 },
  { fx: 0.82, fy: 0.36, amp: 0.06, f: 0.6 }
];

function initStars() {
  var i;
  tasks = [makeTask(-5, 'matrix'), makeTask(-5, 'memory', { seqLen: 4, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  nebStars = [];
  for (i = 0; i < STARS_COUNT; i++) {
    nebStars.push({
      x: nebStarDefs[i].fx * viewW, y: nebStarDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  nebClouds = [];
  for (i = 0; i < nebCloudDefs.length; i++) {
    nebClouds.push({
      bx: nebCloudDefs[i].fx * viewW, by: nebCloudDefs[i].fy * viewH,
      x: 0, y: 0, amp: nebCloudDefs[i].amp * viewW, f: nebCloudDefs[i].f,
      t: i * 2.3, blowT: 0
    });
  }
  nebCollected = 0;
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
  princess.facing = 1;
  princess.walkPhase = 0;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.3);
  playNote(784, 0.15, 0.35, 'triangle', 0.3);
}

function respawnStars() {}
function resizeStars() {
  var i;
  for (i = 0; i < nebStars.length; i++) {
    nebStars[i].x = nebStarDefs[i].fx * viewW;
    nebStars[i].y = nebStarDefs[i].fy * viewH;
  }
  for (i = 0; i < nebClouds.length; i++) {
    nebClouds[i].bx = nebCloudDefs[i].fx * viewW;
    nebClouds[i].by = nebCloudDefs[i].fy * viewH;
    nebClouds[i].amp = nebCloudDefs[i].amp * viewW;
  }
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
}

// Peittääkö joku leijaileva pilvi tähden?
function nebCovered(s) {
  var i, dx, dy, r = viewH * 0.085;
  for (i = 0; i < nebClouds.length; i++) {
    if (nebClouds[i].blowT > 0) continue;
    dx = nebClouds[i].x - s.x;
    dy = nebClouds[i].y - s.y;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function collectNebStar(s) {
  s.collected = true;
  nebCollected++;
  spawnSparkles(s.x, s.y, 16, '#ffe9a0');
  playNote(660 + nebCollected * 66, 0, 0.25, 'sine', 0.4);
  playNote(990 + nebCollected * 66, 0.08, 0.3, 'triangle', 0.3);
  // Tehtäväkaaret avautuvat keräilyn edetessä
  if (!activeTask && !celebrating) {
    if (nebCollected === 2 && !tasks[0].opened) taskStart(tasks[0]);
    else if (nebCollected === 4 && !tasks[1].opened) taskStart(tasks[1]);
  }
  if (nebCollected === STARS_COUNT) startCelebration();
}

function handleStarsTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, dx, dy;
  // Pilven napautus puhaltaa sen pois pariksi sekunniksi
  for (i = 0; i < nebClouds.length; i++) {
    if (nebClouds[i].blowT > 0) continue;
    dx = px - nebClouds[i].x;
    dy = py - nebClouds[i].y;
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      nebClouds[i].blowT = 2.2;
      spawnSparkles(nebClouds[i].x, nebClouds[i].y, 10, '#dfe9ff');
      playNote(392, 0, 0.15, 'sine', 0.25);
      playNote(523, 0.08, 0.2, 'sine', 0.2);
      return;
    }
  }
  // Paljastuneen tähden napautus kerää sen
  for (i = 0; i < nebStars.length; i++) {
    var s = nebStars[i];
    if (s.collected || nebCovered(s)) continue;
    dx = px - s.x;
    dy = py - s.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectNebStar(s);
      return;
    }
  }
}

function updateStars(dt) {
  var i;
  updateTasks(dt);
  for (i = 0; i < nebClouds.length; i++) {
    var cl = nebClouds[i];
    cl.t += dt;
    cl.x = cl.bx + Math.sin(cl.t * cl.f) * cl.amp;
    cl.y = cl.by + Math.sin(cl.t * cl.f * 1.7) * viewH * 0.02;
    if (cl.blowT > 0) cl.blowT -= dt;
  }
  for (i = 0; i < nebStars.length; i++) nebStars[i].phase += dt * 2;
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderStarsBg(b, w, h) {
  var i;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(0.7, '#1c2450');
  sky.addColorStop(1, '#2c3468');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  // Tähtitaivas
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 90; i++) {
    b.globalAlpha = 0.25 + (i % 5) * 0.13;
    b.beginPath();
    b.arc((i * 173.3) % w, (i * 97.1) % (h * 0.7), 1.2 + (i % 3), 0, Math.PI * 2);
    b.fill();
  }
  b.globalAlpha = 1;
  // Kuu
  b.fillStyle = '#ffe9a0';
  b.beginPath(); b.arc(w * 0.85, h * 0.14, h * 0.06, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#0b1030';
  b.beginPath(); b.arc(w * 0.87, h * 0.125, h * 0.05, 0, Math.PI * 2); b.fill();
  // Sumuiset kukkulat
  b.fillStyle = '#1a2148';
  for (i = 0; i < 7; i++) {
    b.beginPath();
    b.arc(w * (i / 6), h * 0.82, h * (0.1 + (i % 3) * 0.04), Math.PI, 0);
    b.fill();
  }
  // Maasto
  var gr = b.createLinearGradient(0, h * 0.78, 0, h);
  gr.addColorStop(0, '#2c3468');
  gr.addColorStop(1, '#171c40');
  b.fillStyle = gr;
  b.fillRect(0, h * 0.78, w, h * 0.22);
}

function nebDrawStar(c, x, y, s, lit) {
  c.save();
  c.translate(x, y);
  c.fillStyle = lit ? '#ffe27a' : 'rgba(255,226,122,0.35)';
  c.beginPath();
  var i, a, r;
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5;
    r = i % 2 ? s * 0.45 : s;
    if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath(); c.fill();
  c.restore();
}

function drawStars() {
  var i, s, cl;
  if (!drawWorldBg()) return;
  // Tähdet (peitetyt himmeämpinä)
  for (i = 0; i < nebStars.length; i++) {
    s = nebStars[i];
    if (s.collected) continue;
    var tw = 1 + Math.sin(s.phase * 2) * 0.1;
    nebDrawStar(ctx, s.x, s.y, viewH * 0.032 * tw, !nebCovered(s));
  }
  // Pilvet (poispuhalletut häipyvät ja palaavat)
  for (i = 0; i < nebClouds.length; i++) {
    cl = nebClouds[i];
    var alpha = 1, cx = cl.x, cy = cl.y;
    if (cl.blowT > 0) {
      var f = cl.blowT > 1.6 ? (2.2 - cl.blowT) / 0.6 : Math.min(1, cl.blowT / 0.6);
      alpha = Math.max(0, Math.min(1, f));
      cx += (2.2 - cl.blowT) * viewW * 0.12;
      cy -= (2.2 - cl.blowT) * viewH * 0.05;
    }
    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = '#8fa3d8';
    cloudShape(ctx, cx, cy, viewH * 0.045);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    cloudShape(ctx, cx - viewH * 0.02, cy - viewH * 0.02, viewH * 0.025);
    ctx.globalAlpha = 1;
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, STARS_COUNT, function (i2) { return nebStars[i2] && nebStars[i2].collected; },
    function (c, x, y, s2) { nebDrawStar(c, x, y, s2, true); });
  drawTaskOverlay(ctx);
}
