'use strict';

// Revontulikettu: saaren vartija. Ratsastus tunturissa, neljä tehtäväporttia
// ja kuusi revontulikidettä. Kettu herää portti kerrallaan.

var FOX_STONES = 6;
var foxStones = [];
var foxDoor = { fx: 0.95, x: 0, open: false };
// Ketun reaktiot tökkäykseen (vain piirtoon): häntä heiluu, unikettu raottaa
// silmää, joka kolmas tökkäys: häntä pyyhkäisee revontulen ("tulikettu")
var foxFx = { yipT: 0, peekT: 0, tailT: 0 };
var foxStoneDefs = [
  { fx: 0.08, fy: 0.16 }, { fx: 0.22, fy: 0.28 }, { fx: 0.40, fy: 0.18 },
  { fx: 0.58, fy: 0.26 }, { fx: 0.74, fy: 0.14 }, { fx: 0.88, fy: 0.24 }
];

function initFoxguard() {
  var i;
  tasks = [
    makeTask(0.22, 'word'),
    makeTask(0.42, 'lastletter'),
    makeTask(0.62, 'gapsyl'),
    makeTask(0.82, 'memory', { seqLen: 5, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.32, 0.52, 0.72]);
  foxStones = [];
  for (i = 0; i < FOX_STONES; i++) {
    foxStones.push({
      ax: foxStoneDefs[i].fx * worldW, ay: groundTop - foxStoneDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  foxDoor.x = foxDoor.fx * worldW;
  foxDoor.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.06;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  foxFx.yipT = 0; foxFx.peekT = 0; foxFx.tailT = 0;
  foxSetupProps();
  renderBackground();
  playNote(262, 0, 0.35, 'sine', 0.3);
  playNote(392, 0.18, 0.4, 'triangle', 0.3);
}

// Tökättävät koristeet: lähikuuset pudottavat lumitupsun; kettu portin päällä
// äännähtää ja heiluttaa häntää (osuma-alue, piirto drawFoxShrine:ssa).
function foxSetupProps() {
  var h = viewH, w = worldW;
  propsReset();
  voyPineProp(w * 0.08, groundTop, h * 0.14, '#1a3850');
  voyPineProp(w * 0.9, groundTop, h * 0.16, '#245068');
  propAdd({
    x: foxDoor.x + h * 0.01, y: groundTop - h * 0.16, r: h * 0.09, hy: h * 0.05, color: '#ffb060', note: 880,
    draw: function () {},
    poke: function (p) {
      foxFx.yipT = 0.7;
      if (foxTasksSolved() < 2) foxFx.peekT = 1.0;
      playNote(1175, 0, 0.07, 'triangle', 0.22);
      playNote(1568, 0.08, 0.1, 'triangle', 0.2);
      if (p.n % 3 === 0) {
        foxFx.tailT = 1.8;
        spawnSparkles(p.x - h * 0.05, p.y - h * 0.08, 10, '#7cffc4');
        spawnSparkles(p.x - h * 0.06, p.y - h * 0.1, 8, '#c9a0ff');
        playNote(659, 0, 0.3, 'sine', 0.2);
        playNote(988, 0.15, 0.3, 'sine', 0.2);
        playNote(1319, 0.3, 0.5, 'sine', 0.2);
      }
    }
  });
}

function respawnFoxguard() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y, 12, '#ffe27a');
}

function resizeFoxguard(ratio) {
  var i;
  for (i = 0; i < foxStones.length; i++) {
    foxStones[i].ax = foxStoneDefs[i].fx * worldW;
    foxStones[i].ay = groundTop - foxStoneDefs[i].fy * viewH;
  }
  foxDoor.x = foxDoor.fx * worldW;
  foxSetupProps();
}

function foxTasksSolved() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return n;
}

function foxCollect(s) {
  s.collected = true;
  registerCollected(s);
  spawnSparkles(s.ax, s.ay, 12, '#c9a0ff');
  soundStar(countCollected(foxStones));
}

function handleFoxguardTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, s, dx, dy;
  for (i = 0; i < foxStones.length; i++) {
    s = foxStones[i];
    if (s.collected) continue;
    dx = wx - s.ax; dy = py - s.ay;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) { foxCollect(s); return; }
  }
  // Ei osunut kiteeseen: koriste saa heilahtaa, ratsastus jatkuu kuten ennen
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateFoxguard(dt) {
  var i, s, dx, dy, busy;
  updateTasks(dt);
  propsUpdate(dt);
  if (foxFx.yipT > 0) foxFx.yipT -= dt;
  if (foxFx.peekT > 0) foxFx.peekT -= dt;
  if (foxFx.tailT > 0) foxFx.tailT -= dt;
  busy = puzzleBusy();
  northRideUnicorn(dt, busy);
  updateCheckpoints(unicorn.x, unicorn.y);
  for (i = 0; i < foxStones.length; i++) {
    s = foxStones[i];
    s.phase += dt * 2;
    if (s.collected || busy || celebrating) continue;
    dx = s.ax - unicorn.x; dy = s.ay - unicorn.y;
    if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) foxCollect(s);
  }
  if (!foxDoor.open && foxTasksSolved() === tasks.length && countCollected(foxStones) === FOX_STONES) {
    foxDoor.open = true;
    playNote(523, 0, 0.25, 'triangle', 0.35);
    playNote(784, 0.2, 0.4, 'triangle', 0.35);
  }
  if (foxDoor.open && !celebrating && Math.abs(unicorn.x - foxDoor.x) < viewH * 0.1) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function foxguardLayers() {
  return [
    { speed: 0.22, render: renderFoxguardFar },
    { speed: 0.55, render: renderFoxguardMid },
    { speed: 1, render: renderFoxguardNear }
  ];
}
function renderFoxguardBg(b, w, h) {
  renderFoxguardFar(b, w, h); renderFoxguardMid(b, w, h); renderFoxguardNear(b, w, h);
}
function renderFoxguardFar(b, w, h) { renderNorthSky(b, w, h); }
function renderFoxguardMid(b, w, h) {
  var i;
  renderNorthHills(b, w, h);
  for (i = 0; i < 4; i++) drawNorthPine(b, w * (0.14 + i * 0.22), groundTop - h * 0.01, h * (0.16 + (i % 2) * 0.04), i % 2 ? '#1a3850' : '#245068');
}
function renderFoxguardNear(b, w, h) {
  // Lähikuuset ovat tökättäviä koristeita (foxSetupProps)
  renderNorthGround(b, w, h);
}

function drawFoxShrine(c, x, y, s, awake) {
  var fur = '#e88a3a', wag = 0, twitch = 0, k, j, tx, ty;
  if (foxFx.yipT > 0) {
    wag = Math.sin(globalT * 25) * 0.35 * Math.min(1, foxFx.yipT / 0.3);
    twitch = Math.sin(globalT * 30) * s * 0.025;
  }
  if (foxFx.tailT > 0) {
    // Tulikettu: häntä pyyhkäisee ylös ja revontuli lehahtaa sen perässä
    k = Math.min(1, (1.8 - foxFx.tailT) / 0.6);
    wag -= Math.sin(k * Math.PI) * 1.1;
    tx = x - s * 0.62; ty = y - s * 0.1;
    c.save();
    c.globalAlpha = Math.min(1, foxFx.tailT / 0.6) * Math.min(1, k * 2);
    c.lineCap = 'round';
    for (j = 0; j < 3; j++) {
      c.strokeStyle = ['rgba(124,255,196,0.5)', 'rgba(201,160,255,0.45)', 'rgba(140,220,255,0.4)'][j];
      c.lineWidth = s * (0.14 - j * 0.03);
      c.beginPath();
      c.moveTo(tx - j * s * 0.1, ty);
      c.quadraticCurveTo(tx - s * (0.4 + j * 0.15) + Math.sin(globalT * 3 + j) * s * 0.1, ty - s * 0.6, tx - s * (0.2 + j * 0.1), ty - s * (1.3 + j * 0.25));
      c.stroke();
    }
    c.restore();
    artGlow(c, tx, ty, s * 0.4, '#7cffc4', 0.35 * Math.min(1, foxFx.tailT / 0.6));
  }
  artBlob(c, x - s * 0.42, y + s * 0.06, s * 0.28, s * 0.16, fur, { rot: -0.55 + wag, hi: 0.2 });
  artBlob(c, x, y + s * 0.1, s * 0.42, s * 0.24, fur, { hi: 0.24 });
  artBlob(c, x + s * 0.34, y - s * 0.06, s * 0.24, s * 0.2, fur, { hi: 0.26 });
  artBlob(c, x + s * 0.24, y - s * 0.28 - twitch, s * 0.075, s * 0.13, fur, { rot: -0.4 });
  artBlob(c, x + s * 0.42, y - s * 0.28 + twitch, s * 0.075, s * 0.13, fur, { rot: 0.35 });
  artBlob(c, x + s * 0.5, y, s * 0.13, s * 0.08, '#fff4e8', { line: false });
  artCircle(c, x + s * 0.6, y + s * 0.01, s * 0.028, '#4a2810', { line: false });
  if (awake || foxFx.peekT > 0) artEye(c, x + s * 0.3, y - s * 0.1, s * 0.055, 0.28, false);
  else {
    c.strokeStyle = '#4a2810';
    c.lineWidth = Math.max(1.6, s * 0.045);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x + s * 0.3, y - s * 0.08, s * 0.04, 0.15, 2.9); c.stroke();
  }
}

function drawFoxguard() {
  var i, s, us, awake;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  propsDraw(ctx);
  for (i = 0; i < foxStones.length; i++) {
    s = foxStones[i];
    if (s.collected) continue;
    drawStar(ctx, s.ax - camX, s.ay + Math.sin(s.phase) * 4, viewH * 0.026, s.phase, 0.8);
  }
  awake = foxTasksSolved() >= 2;
  drawNorthGate(ctx, foxDoor.x - camX, groundTop + viewH * 0.02, viewH * 0.18, foxDoor.open);
  drawFoxShrine(ctx, foxDoor.x - camX + viewH * 0.01, groundTop - viewH * 0.2, viewH * 0.11, awake);
  us = viewH / 800;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (foxDoor.open && !celebrating) drawEdgeArrow(ctx, foxDoor.x);
  endPlayWorld();
  drawPickupHud(ctx, FOX_STONES, function (k) { return foxStones[k] && foxStones[k].collected; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawTaskOverlay(ctx);
}
