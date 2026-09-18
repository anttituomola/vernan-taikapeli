'use strict';

// Nuorallakävely: uusi verbi, tasapaino. Prinsessa kävelee itsekseen nuoraa
// pitkin tasapainotangon kanssa. Tuuli kallistaa; pidä sormea sen puolen
// puolella, johon haluat nojata, jotta tanko pysyy suorassa. Liika kallistus
// pudottaa turvaverkkoon (sydän) ja palauttaa viimeiselle korokkeelle.
// Korokkeelta napautus lähtee seuraavalle nuoralle. Tähdet kerätään kävellessä.

var WIRE_MAX = 1;
var WIRE_HOLD = 2.4;
var WIRE_STARS = 8;
var wirePlats = [
  { fx: 0.07 },
  { fx: 0.34, task: 0 },
  { fx: 0.62, task: 1 },
  { fx: 0.91, door: true }
];
var wireStarDefs = [
  { fx: 0.16 }, { fx: 0.24 },
  { fx: 0.42 }, { fx: 0.50 },
  { fx: 0.70 }, { fx: 0.78 }, { fx: 0.84 }, { fx: 0.88 }
];
var WIRE_WIND = [0.30, 0.44, 0.58];
var WIRE_SPD = [0.15, 0.17, 0.19];

var wire = {
  x: 0, lean: 0, leanV: 0, state: 'stand', plat: 0, lastPlat: 0,
  t: 0, wind: 0, gust: 0, gustT: 2.8, fallT: 0, walkPhase: 0,
  taskDelay: 0, doorDelay: 0, stars: []
};

function wireRopeY() { return viewH * 0.40; }
function wireNetY() { return viewH * 0.80; }
function wirePlatW() { return viewH * 0.22; }
function wirePlatX(i) { return wirePlats[i].fx * worldW; }
function wireSeg() { return Math.min(wire.plat, WIRE_WIND.length - 1); }

function layoutWire() {
  var i;
  checkpoints = [];
  for (i = 0; i < wirePlats.length; i++) {
    checkpoints.push({ fx: wirePlats[i].fx, x: wirePlatX(i), lit: false, plat: i });
  }
}

function wireStandOn(i) {
  wire.state = 'stand';
  wire.plat = i;
  wire.lastPlat = i;
  wire.x = wirePlatX(i);
  wire.lean = 0;
  wire.leanV = 0;
  wire.gust = 0;
  princess.x = wire.x;
  princess.y = wireRopeY();
  princess.facing = 1;
}

function initWire() {
  var i;
  layoutWire();
  tasks = [makeTask(-5, 'clock'), makeTask(-5, 'jigsaw')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  wire.stars = [];
  for (i = 0; i < WIRE_STARS; i++) {
    wire.stars.push({
      ax: wireStarDefs[i].fx * worldW, ay: wireRopeY() - viewH * 0.10,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  wire.t = 0;
  wire.gustT = 2.4;
  wire.fallT = 0;
  wire.taskDelay = 0;
  wire.doorDelay = 0;
  wire.walkPhase = 0;
  wireStandOn(0);
  checkpoint.x = wire.x;
  checkpoint.y = wireRopeY();
  camX = 0;
  renderBackground();
  playNote(523, 0, 0.18, 'triangle', 0.35);
  playNote(659, 0.12, 0.18, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnWire() {
  wireStandOn(wire.lastPlat);
  wire.fallT = 0;
  spawnSparkles(wire.x, wireRopeY() - viewH * 0.1, 14, '#ffe27a');
}

function resizeWire(ratio) {
  var i, st = wire.state, plat = wire.plat;
  layoutWire();
  for (i = 0; i < wire.stars.length; i++) {
    wire.stars[i].ax = wireStarDefs[i].fx * worldW;
    wire.stars[i].ay = wireRopeY() - viewH * 0.10;
  }
  if (st === 'walk') {
    wire.x *= ratio;
    wire.plat = plat;
    wire.state = 'walk';
  } else wireStandOn(wire.lastPlat);
}

function wireLandPlat(i) {
  var n = wirePlats[i], k;
  wireStandOn(i);
  spawnSparkles(wire.x, wireRopeY(), 10, '#fff6c8');
  playNote(523, 0, 0.12, 'triangle', 0.35);
  playNote(784, 0.1, 0.2, 'triangle', 0.35);
  for (k = 0; k < checkpoints.length; k++) {
    if (checkpoints[k].plat === i && !checkpoints[k].lit) setCheckpoint(checkpoints[k], wirePlatX(i), wireRopeY());
  }
  if (n.task !== undefined && tasks[n.task] && !tasks[n.task].opened) wire.taskDelay = 0.5;
  if (n.door) wire.doorDelay = 0.4;
}

function handleWireTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  if (wire.state === 'stand') {
    if (wirePlats[wire.plat].door) return;
    wire.state = 'walk';
    playNote(660, 0, 0.12, 'sine', 0.3);
    playNote(880, 0.08, 0.16, 'sine', 0.25);
  }
}

function wireCollectStar(s) {
  s.collected = true;
  registerCollected(s);
  spawnSparkles(s.ax, s.ay, 14, '#ffe27a');
  soundStar(countCollected(wire.stars));
}

function updateWire(dt) {
  var i, n, nxt, spd, holdDir, s, dx, dy, busy;
  updateTasks(dt);
  busy = puzzleBusy();
  if (wire.taskDelay > 0) {
    wire.taskDelay -= dt;
    if (wire.taskDelay <= 0) {
      n = wirePlats[wire.plat];
      if (n.task !== undefined && !tasks[n.task].opened) taskStart(tasks[n.task]);
    }
  }
  if (wire.doorDelay > 0 && !celebrating) {
    wire.doorDelay -= dt;
    if (wire.doorDelay <= 0) startCelebration();
  }
  if (!busy && !celebrating) {
    wire.t += dt;
    if (wire.state === 'walk') {
      nxt = wire.plat + 1;
      spd = WIRE_SPD[wireSeg()] * viewW;
      wire.x += spd * dt;
      wire.walkPhase += dt * 10;
      wire.gustT -= dt;
      if (wire.gustT <= 0) {
        wire.gust = (Math.random() < 0.5 ? -1 : 1) * (0.55 + wireSeg() * 0.18);
        wire.gustT = 2.6 - wireSeg() * 0.4 + Math.random() * 0.8;
        playNote(392, 0, 0.08, 'sine', 0.18);
      }
      wire.gust += (0 - wire.gust) * Math.min(1, dt * 1.1);
      wire.wind = Math.sin(wire.t * (0.8 + wireSeg() * 0.25)) * WIRE_WIND[wireSeg()] + wire.gust;
      holdDir = 0;
      if (holding) holdDir = (lastPX + camX < wire.x) ? -1 : 1;
      wire.leanV += wire.wind * 1.35 * dt;
      wire.leanV += holdDir * WIRE_HOLD * dt;
      wire.leanV -= wire.lean * 0.12 * dt;
      wire.leanV *= Math.exp(-2.0 * dt);
      wire.lean += wire.leanV * dt;
      if (Math.abs(wire.lean) >= WIRE_MAX) {
        wire.state = 'fall';
        wire.fallT = 0;
        spawnSparkles(wire.x, wireRopeY(), 10, '#c9c9ff');
        loseHeart();
      }
      if (nxt < wirePlats.length && wire.x >= wirePlatX(nxt) - wirePlatW() * 0.15) {
        wireLandPlat(nxt);
      }
    } else if (wire.state === 'fall') {
      wire.fallT += dt;
      if (wire.fallT > 1.0) wireStandOn(wire.lastPlat);
    }
    for (i = 0; i < wire.stars.length; i++) {
      s = wire.stars[i];
      if (s.collected) continue;
      s.phase += dt * 2;
      dx = s.ax - wire.x; dy = s.ay - (wireRopeY() - viewH * 0.08);
      if (wire.state === 'walk' && dx * dx + dy * dy < viewH * 0.11 * viewH * 0.11) wireCollectStar(s);
    }
  }
  princess.x = wire.x;
  princess.y = wireRopeY();
  followCam(wire.x, dt);
  updateParticles(dt);
  updateConfetti(dt);
}

function wireLayers() {
  return [
    { speed: 0.22, render: renderWireFar },
    { speed: 0.55, render: renderWireMid },
    { speed: 1, render: renderWireNear }
  ];
}
function renderWireBg(b, w, h) {
  renderWireFar(b, w, h);
  renderWireMid(b, w, h);
  renderWireNear(b, w, h);
}
function renderWireFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#1a2850');
  wall.addColorStop(0.4, '#162040');
  wall.addColorStop(1, '#0c1028');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, h * 0.08, h * 0.05, 0.22, '#ffe9a0', '#fff8d0', '#ffd24f');
}
function renderWireMid(b, w, h) {
  var i, x, y, sw = h * 0.07;
  for (i = 0, x = 0; x < w; i++, x += sw) {
    b.fillStyle = i % 2 ? '#2a6a78' : '#e8f4d8';
    b.fillRect(x, 0, sw + 1, h * 0.2);
  }
  b.fillStyle = '#2a6a78';
  for (x = sw / 2; x < w + sw; x += sw) { b.beginPath(); b.arc(x, h * 0.2, sw / 2, 0, Math.PI); b.fill(); }
  b.strokeStyle = '#ffd24f';
  b.lineWidth = Math.max(2, h * 0.006);
  b.beginPath();
  for (x = 0; x <= w + sw; x += sw) { b.moveTo(x, h * 0.2); b.arc(x + sw / 2, h * 0.2, sw / 2, Math.PI, 0, true); }
  b.stroke();
  b.strokeStyle = 'rgba(255,255,255,0.28)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath();
  for (x = 0; x <= w; x += h * 0.5) { b.moveTo(x, h * 0.26); b.quadraticCurveTo(x + h * 0.25, h * 0.31, x + h * 0.5, h * 0.26); }
  b.stroke();
}
function renderWireNear(b, w, h) {
  var i, x, y, px, pt = wireRopeY(), ny = wireNetY(), pw = wirePlatW();
  var rows = 3;
  for (i = 0; i < rows; i++) {
    y = h * (0.86 + i * 0.035);
    b.fillStyle = i === 0 ? '#2a1a44' : (i === 1 ? '#231538' : '#1b1030');
    b.fillRect(0, y - h * 0.01, w, h * 0.06);
    for (x = h * 0.03 + i * h * 0.03; x < w; x += h * 0.065) {
      b.fillStyle = i === 0 ? '#3d2a5c' : '#2f1f4a';
      b.beginPath(); b.arc(x, y, h * 0.02, 0, Math.PI * 2); b.fill();
    }
  }
  b.fillStyle = '#2a6a78';
  b.fillRect(0, h * 0.955, w, h * 0.045);
  b.fillStyle = '#e8f4d8';
  for (x = 0; x < w; x += h * 0.12) b.fillRect(x, h * 0.955, h * 0.06, h * 0.045);
  b.strokeStyle = 'rgba(200,200,255,0.45)';
  b.lineWidth = Math.max(1, h * 0.002);
  for (x = 0; x < w + h * 0.06; x += h * 0.03) {
    b.beginPath(); b.moveTo(x, ny); b.lineTo(x - h * 0.06, ny + h * 0.06); b.stroke();
    b.beginPath(); b.moveTo(x, ny); b.lineTo(x + h * 0.06, ny + h * 0.06); b.stroke();
  }
  b.strokeStyle = 'rgba(230,230,255,0.8)';
  b.lineWidth = Math.max(2, h * 0.005);
  b.beginPath(); b.moveTo(0, ny); b.lineTo(w, ny); b.stroke();
  for (i = 0; i < wirePlats.length; i++) {
    px = wirePlatX(i);
    b.fillStyle = '#5a4a78';
    b.fillRect(px - h * 0.012, pt, h * 0.024, h * 0.955 - pt);
    var dg = b.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
    dg.addColorStop(0, '#2a6a78');
    dg.addColorStop(0.5, '#4ec4c8');
    dg.addColorStop(1, '#2a6a78');
    b.fillStyle = dg;
    roundRect(b, px - pw / 2, pt - h * 0.018, pw, h * 0.05, h * 0.012);
    b.fill();
    b.fillStyle = '#ffd24f';
    b.fillRect(px - pw / 2, pt - h * 0.018, pw, h * 0.01);
    if (wirePlats[i].door) {
      b.fillStyle = '#ffd24f';
      roundRect(b, px - pw * 0.4, pt - h * 0.34, pw * 0.8, h * 0.32, h * 0.03);
      b.fill();
      b.fillStyle = '#2a6a78';
      roundRect(b, px - pw * 0.32, pt - h * 0.31, pw * 0.64, h * 0.29, h * 0.025);
      b.fill();
      drawStar(b, px, pt - h * 0.2, h * 0.05, 0, 0);
    }
  }
}

function drawWireRope(c) {
  var i, x0, x1, y = wireRopeY(), sag;
  c.strokeStyle = '#e8d4a8';
  c.lineWidth = Math.max(3, viewH * 0.01);
  c.lineCap = 'round';
  for (i = 0; i < wirePlats.length - 1; i++) {
    x0 = wirePlatX(i) - camX;
    x1 = wirePlatX(i + 1) - camX;
    sag = viewH * 0.025;
    if (wire.state === 'walk' && wire.plat === i) sag += Math.abs(wire.lean) * viewH * 0.02;
    c.beginPath();
    c.moveTo(x0, y);
    c.quadraticCurveTo((x0 + x1) / 2, y + sag, x1, y);
    c.stroke();
  }
}

function drawWirePole(c, x, y, s, lean) {
  c.save();
  c.translate(x, y - s * 24);
  c.rotate(lean * 0.7);
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(3, s * 2.4);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 38, 0); c.lineTo(s * 38, 0); c.stroke();
  c.fillStyle = '#ffd24f';
  c.beginPath(); c.arc(-s * 38, 0, s * 3, 0, Math.PI * 2); c.arc(s * 38, 0, s * 3, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawWireHint(c, x, y, dir) {
  var pulse = 0.7 + Math.sin(globalT * 6) * 0.3;
  c.fillStyle = 'rgba(255,226,122,' + pulse + ')';
  c.beginPath();
  c.moveTo(x + dir * viewH * 0.05, y);
  c.lineTo(x - dir * viewH * 0.02, y - viewH * 0.035);
  c.lineTo(x - dir * viewH * 0.02, y + viewH * 0.035);
  c.closePath();
  c.fill();
}

function drawWire() {
  var i, n, s, ps, fallY, lean;
  if (!beginPlayWorld()) return;
  drawWireRope(ctx);
  for (i = 0; i < checkpoints.length; i++) {
    drawLantern(ctx, checkpoints[i], wireRopeY() - viewH * 0.02);
  }
  for (i = 0; i < wirePlats.length; i++) {
    n = wirePlats[i];
    if (n.task !== undefined && tasks[n.task] && !tasks[n.task].opened) {
      var gx = wirePlatX(i) - camX, gy = wireRopeY() - viewH * 0.2;
      var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.18);
      g.addColorStop(0, 'rgba(255,230,140,' + (0.45 + Math.sin(globalT * 3) * 0.15) + ')');
      g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold ' + Math.round(viewH * 0.07) + 'px ' + TASK_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', gx, gy);
    }
  }
  for (i = 0; i < wire.stars.length; i++) {
    s = wire.stars[i];
    if (s.collected) continue;
    drawStar(ctx, s.ax - camX, s.ay + Math.sin(s.phase) * viewH * 0.012, viewH * 0.03, Math.sin(s.phase * 0.5) * 0.3, 0.7 + Math.sin(s.phase * 2) * 0.3);
  }
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  ps = viewH / 520;
  lean = wire.state === 'walk' ? wire.lean : (wire.state === 'fall' ? wire.lean + wire.fallT * 1.2 : 0);
  fallY = wire.state === 'fall' ? Math.min(1, wire.fallT) * (wireNetY() - wireRopeY()) : 0;
  drawWirePole(ctx, wire.x - camX, wireRopeY() + fallY, ps, lean);
  ctx.save();
  ctx.translate(wire.x - camX, wireRopeY() + fallY);
  ctx.rotate(lean * 0.4);
  drawPrincessFree(ctx, 0, 0, ps, 1, wire.walkPhase, wire.state === 'walk', globalT);
  ctx.restore();
  if (wire.state === 'walk' && Math.abs(wire.lean) > 0.42 && !puzzleBusy()) {
    drawWireHint(ctx, wire.x - camX + (wire.lean > 0 ? -1 : 1) * viewH * 0.16, wireRopeY() - viewH * 0.22, wire.lean > 0 ? -1 : 1);
  }
  if (wire.state === 'fall') {
    ctx.strokeStyle = 'rgba(230,230,255,0.9)';
    ctx.lineWidth = Math.max(2, viewH * 0.005);
    ctx.beginPath();
    ctx.moveTo(wire.x - camX - viewH * 0.3, wireNetY());
    ctx.quadraticCurveTo(wire.x - camX, wireNetY() + (1 - Math.min(1, wire.fallT * 1.5)) * viewH * 0.06, wire.x - camX + viewH * 0.3, wireNetY());
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, WIRE_STARS, function (k) { return wire.stars[k] && wire.stars[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
