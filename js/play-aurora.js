'use strict';

// Revontulipolku: ratsastus. Valopallot syttyvät vain kun revontuli on niiden
// yllä — kerää ne loistaessaan. Sydämet ja lyhdyt käytössä.

var AUR_COUNT = 8;
var aurLights = [];
var aurGate = northGateAt(0.96);
var aurWind = [];
var aurDefs = [
  { fx: 0.10, fy: 0.16 }, { fx: 0.20, fy: 0.28 }, { fx: 0.32, fy: 0.14 }, { fx: 0.44, fy: 0.26 },
  { fx: 0.55, fy: 0.12 }, { fx: 0.66, fy: 0.24 }, { fx: 0.78, fy: 0.15 }, { fx: 0.88, fy: 0.27 }
];

var AUR_GLOW = 1.8;
var AUR_BAND = 0.28;

function aurCurtainX() {
  return (0.12 + 0.76 * (0.5 + 0.5 * Math.sin(globalT * 0.24))) * worldW;
}
function aurUnderCurtain(g) {
  return Math.abs(g.ax - aurCurtainX()) < viewW * AUR_BAND;
}
function aurLit(g) {
  return !g.collected && g.glowT > 0;
}

function initAurora() {
  var i;
  tasks = [makeTask(0.32, 'pattern'), makeTask(0.66, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.40, 0.72]);
  aurLights = [];
  for (i = 0; i < AUR_COUNT; i++) {
    aurLights.push({
      ax: aurDefs[i].fx * worldW, ay: groundTop - aurDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, glowT: 0
    });
  }
  // Puuskat ylä- ja alareunaan: keskilinja on vapaa, ettei aloitusratsastus
  // osu näkymättömään esteeseen. Ensimmäinen vasta valojen jälkeen.
  aurWind = [
    { zA: 0.30, zB: 0.46, fy: 0.12, dir: 1 },
    { zA: 0.62, zB: 0.80, fy: 0.82, dir: -1 }
  ];
  for (i = 0; i < aurWind.length; i++) aurPlaceWind(aurWind[i]);
  aurGate.x = aurGate.fx * worldW;
  aurGate.open = false;
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.08;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  aurSetupProps();
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.32);
  playNote(784, 0.14, 0.3, 'triangle', 0.3);
}

function respawnAurora() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 12, '#a8ffe0');
}

function aurPlaceWind(wh) {
  var pathH = groundBottom - groundTop;
  wh.x = (wh.zA + wh.zB) * 0.5 * worldW;
  wh.y = groundTop + pathH * wh.fy;
}

function resizeAurora(ratio) {
  var i;
  for (i = 0; i < aurLights.length; i++) {
    aurLights[i].ax = aurDefs[i].fx * worldW;
    aurLights[i].ay = groundTop - aurDefs[i].fy * viewH;
  }
  for (i = 0; i < aurWind.length; i++) {
    aurWind[i].x *= ratio;
    aurWind[i].y = groundTop + (groundBottom - groundTop) * aurWind[i].fy;
  }
  aurGate.x = aurGate.fx * worldW;
  aurSetupProps();
}

// Tökättävät koristeet: lähikuuset pudottavat lumitupsun; kivet heilahtavat ja
// joka kolmannella tökkäyksellä kiven takaa pyrähtää riekko (yllätys).
function aurSetupProps() {
  var i, h = viewH, w = worldW;
  propsReset();
  for (i = 0; i < 5; i++) voyPineProp(w * (0.1 + i * 0.18), groundTop, h * 0.16, '#1a3850');
  aurRockProp(w * 0.34, groundTop + h * 0.02, h * 0.045);
  aurRockProp(w * 0.68, groundTop + h * 0.015, h * 0.038);
}

function aurRockProp(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.4, hy: s * 0.2, color: '#dce8f4', note: 392, amp: 0.07,
    draw: function (c) { drawNorthRock(c, 0, 0, s); },
    poke: function (p) {
      if (p.n % 3 === 0) aurBirdFly(p.x, p.y - s * 0.3);
      else voySnowPuff(p.x + (Math.random() - 0.5) * s, p.y - s * 0.4, s * 0.12, p.y + s * 0.1);
    }
  });
}

// Riekko pyrähtää lentoon kiven takaa, laskeutuu ja haihtuu
function aurBirdFly(x, y) {
  var s = viewH * 0.022, snow = { shadeTo: '#e3d8f5', lineColor: '#b8c8d8' }, dir = Math.random() < 0.5 ? -1 : 1;
  playNote(988, 0, 0.07, 'triangle', 0.18);
  playNote(1175, 0.08, 0.07, 'triangle', 0.18);
  playNote(988, 0.16, 0.1, 'triangle', 0.18);
  propDrop({
    x: x, y: y, dir: dir, vx: dir * viewW * 0.1, vy: -viewH * 0.5, vr: 0, ground: y + s * 1.2, life: 2.0,
    draw: function (c, d) {
      var fl = Math.sin(d.t * 26) * 0.6;
      c.scale(d.dir, 1);
      artBlob(c, -s * 0.5, -s * 0.1, s * 0.75, s * 0.28, '#ffffff', { rot: -0.5 - fl, shadeTo: snow.shadeTo, lineColor: snow.lineColor });
      artBlob(c, 0, 0, s * 0.8, s * 0.6, '#ffffff', { shadeTo: snow.shadeTo, lineColor: snow.lineColor, hi: 0.4 });
      artBlob(c, -s * 0.9, -s * 0.1, s * 0.25, s * 0.12, '#2a2a2a', { line: false });
      artCircle(c, s * 0.7, -s * 0.5, s * 0.36, '#ffffff', snow);
      artBlob(c, s * 0.72, -s * 0.78, s * 0.2, s * 0.07, '#e8323c', { line: false });
      artEye(c, s * 0.8, -s * 0.52, s * 0.08, 0.3, false);
      artBlob(c, s * 1.08, -s * 0.44, s * 0.12, s * 0.07, '#2a2a2a', { line: false });
    }
  });
}

function aurCollect(g) {
  g.collected = true;
  registerCollected(g);
  spawnSparkles(g.ax, g.ay, 14, '#7cffc4');
  soundStar(countCollected(aurLights));
  if (countCollected(aurLights) === AUR_COUNT) aurGate.open = true;
}

function handleAuroraTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy, g;
  for (i = 0; i < aurLights.length; i++) {
    g = aurLights[i];
    if (g.collected || !aurLit(g)) continue;
    dx = wx - g.ax; dy = py - g.ay;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) { aurCollect(g); return; }
  }
  // Ei osunut valoon: koriste saa heilahtaa, ja ratsastus jatkuu kohti napautusta kuten ennen
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateAurora(dt) {
  var i, g, dx, dy, busy, wh;
  updateTasks(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  northRideUnicorn(dt, busy);
  updateCheckpoints(unicorn.x, unicorn.y);
  for (i = 0; i < aurLights.length; i++) {
    g = aurLights[i];
    g.phase += dt * 2;
    if (aurUnderCurtain(g)) g.glowT = AUR_GLOW;
    else if (g.glowT > 0 && !busy) g.glowT = Math.max(0, g.glowT - dt);
    if (g.collected || busy || celebrating) continue;
    if (!aurLit(g)) continue;
    dx = g.ax - unicorn.x; dy = g.ay - unicorn.y;
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) aurCollect(g);
  }
  for (i = 0; i < aurWind.length; i++) {
    wh = aurWind[i];
    if (!busy && !celebrating) {
      wh.x += wh.dir * viewW * 0.07 * dt;
      if (wh.x < wh.zA * worldW) { wh.x = wh.zA * worldW; wh.dir = 1; }
      if (wh.x > wh.zB * worldW) { wh.x = wh.zB * worldW; wh.dir = -1; }
    }
    if (!celebrating && Math.abs(wh.x - unicorn.x) < viewH * 0.05 && Math.abs(wh.y - unicorn.y) < viewH * 0.05) {
      if (loseHeart()) {
        unicorn.tx = Math.min(Math.max(unicorn.x + (unicorn.x < wh.x ? -1 : 1) * viewW * 0.08, viewW * 0.05), worldW);
        spawnSparkles(unicorn.x, unicorn.y, 8, '#c8e8ff');
      }
    }
  }
  if (aurGate.open && !celebrating && Math.abs(unicorn.x - aurGate.x) < viewH * 0.09) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function auroraLayers() {
  return [
    { speed: 0.22, render: renderAuroraFar },
    { speed: 0.55, render: renderAuroraMid },
    { speed: 1, render: renderAuroraNear }
  ];
}
function renderAuroraBg(b, w, h) {
  renderAuroraFar(b, w, h); renderAuroraMid(b, w, h); renderAuroraNear(b, w, h);
}
function renderAuroraFar(b, w, h) { renderNorthSky(b, w, h); }
function renderAuroraMid(b, w, h) {
  var i, x;
  renderNorthHills(b, w, h);
  for (i = 0; i < 7; i++) {
    x = w * (0.08 + i * 0.14);
    drawNorthPine(b, x, groundTop - h * 0.01, h * (0.16 + (i % 3) * 0.04), i % 2 ? '#1a3850' : '#245068');
  }
}
function renderAuroraNear(b, w, h) {
  // Lähikuuset ja kivet ovat tökättäviä koristeita (aurSetupProps)
  renderNorthGround(b, w, h);
}

function drawAuroraGust(c, x, y, t, dir) {
  var r = viewH * 0.07, i, a, px, py, g;
  c.save();
  c.translate(x, y);
  g = c.createRadialGradient(0, 0, 2, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(120,210,255,0.85)');
  g.addColorStop(1, 'rgba(40,140,210,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#3aa8e8';
  c.lineWidth = 3.2;
  c.lineCap = 'round';
  c.beginPath(); c.arc(0, 0, r * 0.72, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.6;
  for (i = 0; i < 3; i++) {
    a = t * 2.6 * dir + i * 2.1;
    c.beginPath();
    c.arc(0, 0, r * (0.28 + i * 0.2), a, a + 1.5);
    c.stroke();
  }
  c.fillStyle = '#ffffff';
  for (i = 0; i < 7; i++) {
    a = t * 2.0 * dir + i * 0.9;
    px = Math.cos(a) * r * 0.88;
    py = Math.sin(a * 1.25) * r * 0.55;
    c.beginPath(); c.arc(px, py, 3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function drawAuroraFollow(c) {
  var x = aurCurtainX() - camX, half = viewW * AUR_BAND, g;
  g = c.createLinearGradient(x - half, 0, x + half, 0);
  g.addColorStop(0, 'rgba(140,255,210,0)');
  g.addColorStop(0.5, 'rgba(140,255,210,0.2)');
  g.addColorStop(1, 'rgba(140,255,210,0)');
  c.fillStyle = g;
  c.fillRect(x - half, 0, half * 2, groundTop);
}

function drawAurora() {
  var i, g, lit, us, glowA;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  drawAuroraFollow(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  propsDraw(ctx);
  for (i = 0; i < aurLights.length; i++) {
    g = aurLights[i];
    if (g.collected) continue;
    lit = aurLit(g);
    glowA = g.glowT >= 1 ? 1 : Math.max(0, g.glowT);
    if (lit) {
      var gl = ctx.createRadialGradient(g.ax - camX, g.ay, 2, g.ax - camX, g.ay, viewH * 0.08);
      gl.addColorStop(0, 'rgba(140,255,200,' + (0.9 * glowA) + ')');
      gl.addColorStop(1, 'rgba(140,255,200,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(g.ax - camX, g.ay, viewH * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    // Valopallo tarrakirja-ilmeessä: kaksi sävyä, reunaviiva ja kiilto; sammuneena haalea
    ctx.globalAlpha = lit ? 0.45 + 0.55 * glowA : 0.4;
    if (lit) artCircle(ctx, g.ax - camX, g.ay + Math.sin(g.phase) * 3, viewH * 0.018, '#b8ffe0', { shadeTo: '#4ad0a0', lineColor: '#2a9a70', hi: 0.5 });
    else artCircle(ctx, g.ax - camX, g.ay + Math.sin(g.phase) * 3, viewH * 0.018, '#b4d2e6', { shadeTo: '#7a9ab4', lineColor: '#5a7a94', hi: 0.3 });
    ctx.globalAlpha = 1;
  }
  for (i = 0; i < aurWind.length; i++) {
    drawAuroraGust(ctx, aurWind[i].x - camX, aurWind[i].y, globalT, aurWind[i].dir);
  }
  drawNorthGate(ctx, aurGate.x - camX, groundTop + viewH * 0.02, viewH * 0.16, aurGate.open);
  us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (aurGate.open && !celebrating) drawEdgeArrow(ctx, aurGate.x);
  endPlayWorld();
  drawPickupHud(ctx, AUR_COUNT, function (k) { return aurLights[k] && aurLights[k].collected; },
    function (c, x, y, sz) { artCircle(c, x, y, sz * 0.45, '#7cffc4', { hi: 0.4 }); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
