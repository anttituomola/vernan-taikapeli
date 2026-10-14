'use strict';

// Kelkkamäki: taikakelkka liukuu itse eteenpäin ja ruutu vierii. Pidä sormea
// ruudulla: kelkka nousee ilmaan ja liukuu pehmeästi sormen luo (vaimennettu
// jousi, ei nykivää kiihdytystä). Irrota: kelkka laskeutuu lumelle. Lennä
// revontulirenkaiden läpi ja väistä Myrskynoidan äreitä lumipilviä (vievät
// sydämen). Ohi mennyt rengas kaartaa uudelleen eteen, ei rangaistusta.
// Saaren vaikein kenttä: sydämet ja lyhdyt käytössä.

var SLED_RINGS = 6;
var sledRings = [];
var sledRocks = [];     // äreät lumipilvet (nimi säilyy VT-kahvaa varten)
var sled = { sx: 0, vx: 0 };   // kelkan paikka ruudulla ja nopeus suhteessa kameraan
var SLED_SPEEDS = [0.15, 0.18, 0.21];
var sledFx = { hopT: 0, bellT: 0 };   // kelkan pomppu ja kulkunen tökkäyksestä (vain piirtoon)
var sledRingDefs = [
  { fx: 0.14, fy: 0.30 }, { fx: 0.26, fy: 0.46 }, { fx: 0.45, fy: 0.22 },
  { fx: 0.58, fy: 0.44 }, { fx: 0.80, fy: 0.24 }, { fx: 0.90, fy: 0.40 }
];
// Lumipilvet: fy = keskikorkeus maan yllä, amp = pystyheilunta (viewH)
var sledCloudDefs = [
  { fx: 0.12, fy: 0.40, amp: 0.06 }, { fx: 0.19, fy: 0.24, amp: 0.10 },
  { fx: 0.24, fy: 0.42, amp: 0.10 }, { fx: 0.31, fy: 0.30, amp: 0.14 },
  { fx: 0.43, fy: 0.36, amp: 0.12 }, { fx: 0.50, fy: 0.30, amp: 0.14 },
  { fx: 0.55, fy: 0.24, amp: 0.10 }, { fx: 0.63, fy: 0.34, amp: 0.14 },
  { fx: 0.74, fy: 0.40, amp: 0.12 }, { fx: 0.78, fy: 0.18, amp: 0.08 },
  { fx: 0.86, fy: 0.30, amp: 0.14 }, { fx: 0.92, fy: 0.22, amp: 0.10 }
];

function sledSpeed() {
  var seg = camX / Math.max(1, worldW);
  var idx = seg < 0.34 ? 0 : (seg < 0.68 ? 1 : 2);
  return viewW * SLED_SPEEDS[idx];
}

function initSled() {
  var i;
  tasks = [makeTask(0.34, 'mirror'), makeTask(0.68, 'dots')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.36, 0.70]);
  sledRings = [];
  for (i = 0; i < SLED_RINGS; i++) {
    sledRings.push({
      ax: sledRingDefs[i].fx * worldW, ay: groundTop - sledRingDefs[i].fy * viewH,
      collected: false, returned: false, phase: Math.random() * Math.PI * 2,
      color: i % 2 ? '#7cffc4' : '#c9a0ff',
      onRestore: function (r) { r.ax = r.homeX; r.ay = r.homeY; }
    });
    sledRings[i].homeX = sledRings[i].ax;
    sledRings[i].homeY = sledRings[i].ay;
  }
  sledRocks = [];
  for (i = 0; i < sledCloudDefs.length; i++) {
    sledRocks.push({
      fx: sledCloudDefs[i].fx, x: sledCloudDefs[i].fx * worldW,
      baseY: groundTop - sledCloudDefs[i].fy * viewH, y: 0,
      amp: viewH * sledCloudDefs[i].amp, t: i * 1.1, f: 1.0 + (i % 3) * 0.2, puffT: 0
    });
    sledRocks[i].y = sledRocks[i].baseY;
  }
  sled.sx = viewW * 0.22;
  sled.vx = 0;
  princess.x = sled.sx;
  princess.y = groundTop;
  princess.vx = 0; princess.vy = 0; princess.facing = 1;
  princess.onGround = false; princess.walkPhase = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  sledFx.hopT = 0;
  sledFx.bellT = 0;
  sledSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'sine', 0.32);
  playNote(784, 0.14, 0.28, 'triangle', 0.32);
}

// Tökättävät koristeet mäen juurella: kuuset (lumitupsu) ja lumiukko, sekä
// kelkka itse: tökkäys pomppauttaa ja kilauttaa; joka viides soittaa kulkussävelen.
function sledSetupProps() {
  var h = viewH, w = worldW;
  propsReset();
  voyPineProp(w * 0.15, groundTop, h * 0.12, '#1a3850');
  voyPineProp(w * 0.5, groundTop, h * 0.13, '#245068');
  voyPineProp(w * 0.85, groundTop, h * 0.12, '#1a3850');
  propAdd({
    x: w * 0.35, y: groundTop - h * 0.01, r: h * 0.055, hy: h * 0.02, color: '#ffffff', note: 523, amp: 0.1,
    draw: function (c) { drawNorthSnowman(c, 0, 0, h * 0.07); },
    poke: function (p) { voySnowPuff(p.x + (Math.random() - 0.5) * h * 0.02, p.y - h * 0.045, h * 0.004, p.y + h * 0.01); }
  });
  propAdd({
    x: princess.x, y: princess.y, r: h * 0.09, hy: h * 0.02, color: '#ffd24f', note: 1047,
    draw: function () {},
    update: function (p) { p.x = princess.x; p.y = princess.y; },
    poke: function (p) {
      sledFx.hopT = 0.45;
      if (p.n % 5 === 0) sledBellTune();
    }
  });
}

// Yllätys: kulkunen ilmestyy kelkan keulaan ja soittaa tutun sävelen alun
function sledBellTune() {
  var seq = [659, 659, 659, 659, 659, 659, 659, 784, 523, 587, 659];
  var dl = [0, 0.18, 0.36, 0.72, 0.9, 1.08, 1.44, 1.62, 1.8, 1.98, 2.16], i;
  for (i = 0; i < seq.length; i++) playNote(seq[i], dl[i], 0.16, 'triangle', 0.22);
  sledFx.bellT = 2.8;
}

function respawnSled() {
  var i;
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop;
  princess.vx = 0; princess.vy = 0;
  sled.sx = princess.x - camX;
  sled.vx = 0;
  for (i = 0; i < sledRings.length; i++) {
    if (sledRings[i].homeX > checkpoint.x - viewW * 0.1 && !sledRings[i].collected) {
      sledRings[i].ax = sledRings[i].homeX;
      sledRings[i].ay = sledRings[i].homeY;
      sledRings[i].returned = false;
    }
  }
  spawnSparkles(princess.x, princess.y, 12, '#c8f0ff');
}

function resizeSled(ratio) {
  var i;
  princess.x *= ratio;
  for (i = 0; i < sledRings.length; i++) {
    sledRings[i].homeX = sledRingDefs[i].fx * worldW;
    sledRings[i].homeY = groundTop - sledRingDefs[i].fy * viewH;
    sledRings[i].ax = sledRings[i].homeX;
    sledRings[i].ay = sledRings[i].homeY;
  }
  for (i = 0; i < sledRocks.length; i++) {
    sledRocks[i].x = sledRocks[i].fx * worldW;
    sledRocks[i].baseY = groundTop - sledCloudDefs[i].fy * viewH;
    sledRocks[i].amp = viewH * sledCloudDefs[i].amp;
  }
  sled.sx = princess.x - camX;
  sledSetupProps();
}

// Napautus ohjaa kelkkaa pidon kautta kuten ennenkin; koriste saa lisäksi heilahtaa
function handleSledTap(px, py) {
  if (!running || puzzleBusy()) return;
  propsTap(px + camX, py);
}

function sledCollect(r) {
  r.collected = true;
  registerCollected(r);
  spawnSparkles(r.ax, r.ay, 14, r.color);
  soundStar(countCollected(sledRings));
}

// Ohi mennyt rengas kaartaa uudelleen eteen (ei sydäntä): kokeile uudestaan
function sledMiss(r) {
  var ahead = camX + viewW * (1.05 + Math.random() * 0.15);
  r.ax = Math.min(ahead, worldW - viewW * 0.3);
  r.ay = groundTop - viewH * (0.18 + Math.random() * 0.3);
  r.returned = true;
}

// Lumipilven tömäys: sydän lähtee, lunta pöllähtää ja kelkka tipahtaa alemmas
function sledHitCloud(cl) {
  var k;
  if (!loseHeart()) return;
  cl.puffT = 0.8;
  princess.vy = viewH * 0.35;
  for (k = 0; k < 4; k++) voySnowPuff(cl.x + (k - 1.5) * viewH * 0.03, cl.y + viewH * 0.03, viewH * 0.01, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.04, 10, '#c8d0e0');
}

function updateSled(dt) {
  var i, r, dx, dy, rr, busy, scrolling, maxCam, camStep, wantSX, wantY, ky, cy, pw = viewH * 0.045;
  updateTasks(dt);
  propsUpdate(dt);
  if (sledFx.hopT > 0) sledFx.hopT -= dt;
  if (sledFx.bellT > 0) sledFx.bellT -= dt;
  busy = puzzleBusy();
  scrolling = !busy && !celebrating;
  // Tehtäväkaari pysäyttää vierityksen, kun se on ruudun oikealla puolella,
  // ja tehtävä alkaa heti: kelkan ei tarvitse ehtiä kaaren luo itse
  for (i = 0; i < tasks.length; i++) {
    if (tasks[i].opened || tasks[i].x - camX > viewW * 0.72) continue;
    scrolling = false;
    if (!activeTask && !celebrating) taskStart(tasks[i]);
  }
  maxCam = Math.max(0, worldW - viewW);
  camStep = 0;
  if (scrolling && camX < maxCam) {
    camStep = Math.min(maxCam - camX, sledSpeed() * dt);
    camX += camStep;
  }
  if (!busy && !celebrating) {
    // Sormi pohjassa: kelkka liukuu sormen luo vaimennetulla jousella.
    // Ilman sormea kelkka laskeutuu lumelle ja liukuu paikallaan ruudulla.
    if (holding) {
      wantSX = Math.min(Math.max(lastPX, viewW * 0.1), viewW * 0.66);
      wantY = Math.min(Math.max(lastPY + viewH * 0.04, viewH * 0.16), groundTop);
      ky = 10;
      if (lastPX > sled.sx + 8) princess.facing = 1;
      else if (lastPX < sled.sx - 8) princess.facing = -1;
    } else {
      wantSX = sled.sx;
      wantY = groundTop;
      ky = 3;
      princess.facing = 1;
    }
    sled.vx += ((wantSX - sled.sx) * 10 - sled.vx * 6) * dt;
    princess.vy += ((wantY - princess.y) * ky - princess.vy * (ky > 5 ? 6 : 3.5)) * dt;
    sled.vx = Math.min(Math.max(sled.vx, -viewW * 0.3), viewW * 0.3);
    princess.vy = Math.min(Math.max(princess.vy, -viewH * 0.45), viewH * 0.45);
    sled.sx += sled.vx * dt;
    princess.y += princess.vy * dt;
  }
  sled.sx = Math.min(Math.max(sled.sx, viewW * 0.08), viewW * 0.7);
  princess.x = camX + sled.sx;
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  if (princess.y < viewH * 0.14) { princess.y = viewH * 0.14; princess.vy = Math.max(0, princess.vy); }
  if (princess.y > groundTop) { princess.y = groundTop; princess.vy = Math.min(0, princess.vy); }
  blockPrincessAtTasks();
  sled.sx = princess.x - camX;
  princess.walkPhase += dt * 8;
  updateCheckpoints(princess.x, princess.y);
  for (i = 0; i < sledRings.length; i++) {
    r = sledRings[i];
    if (r.collected) continue;
    r.phase += dt * 2;
    rr = viewH * 0.075;
    dx = princess.x - r.ax; dy = princess.y - viewH * 0.05 - r.ay;
    if (!busy && Math.abs(dx) < rr * 0.8 && Math.abs(dy) < rr) { sledCollect(r); continue; }
    if (camX >= maxCam - 2) {
      if (r.ax < camX + viewW * 0.12 || r.ax > camX + viewW * 0.6) {
        r.ax = camX + viewW * (0.35 + (i % 3) * 0.1);
        spawnSparkles(r.ax, r.ay, 8, r.color);
      }
    } else if (r.ax < camX + viewW * 0.02 && !busy) sledMiss(r);
  }
  for (i = 0; i < sledRocks.length; i++) {
    cy = sledRocks[i];
    if (!busy) cy.t += dt;
    if (cy.puffT > 0) cy.puffT -= dt;
    cy.y = cy.baseY + Math.sin(cy.t * cy.f) * cy.amp;
    dx = princess.x - cy.x; dy = princess.y - viewH * 0.04 - cy.y;
    if (!busy && !celebrating && dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) sledHitCloud(cy);
  }
  if (!celebrating && camX >= maxCam - 2 && countCollected(sledRings) === SLED_RINGS) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

function sledLayers() {
  return [
    { speed: 0.22, render: renderSledFar },
    { speed: 0.55, render: renderSledMid },
    { speed: 1, render: renderSledNear }
  ];
}
function renderSledBg(b, w, h) {
  renderSledFar(b, w, h); renderSledMid(b, w, h); renderSledNear(b, w, h);
}
function renderSledFar(b, w, h) { renderNorthSky(b, w, h); }
function renderSledMid(b, w, h) {
  var i;
  renderNorthHills(b, w, h);
  for (i = 0; i < 5; i++) drawNorthPine(b, w * (0.08 + i * 0.2), groundTop - h * 0.01, h * (0.12 + (i % 3) * 0.03), '#1a3850');
}
function renderSledNear(b, w, h) { renderNorthGround(b, w, h); }

function drawSledBody(c, x, y, s, facing) {
  c.save();
  c.translate(x, y);
  c.scale(facing || 1, 1);
  artLimb(c, -s * 20, s * 8, s * 14, s * 8, s * 3.4, '#6a4020');
  artLimb(c, s * 14, s * 8, s * 22, s * 0, s * 3.4, '#6a4020');
  artRoundRect(c, -s * 18, -s * 2, s * 34, s * 9, s * 2.4, '#e24a3a', { hi: 0.2 });
  artRoundRect(c, -s * 8, -s * 4, s * 12, s * 4, s * 1.5, '#ffd24f', { line: false });
  if (sledFx.bellT > 0) {
    // Kulkunen keulassa heiluu sävelen ajan
    c.save();
    c.translate(s * 19, -s * 1);
    c.rotate(Math.sin(globalT * 18) * 0.4 * Math.min(1, sledFx.bellT / 0.4));
    artLimb(c, 0, 0, 0, s * 3, s * 0.9, '#e24a3a');
    artCircle(c, 0, s * 4.6, s * 2.2, '#ffd24f', { lineColor: '#9a6a10', hi: 0.5 });
    artCircle(c, 0, s * 6.2, s * 0.6, '#9a6a10', { line: false });
    c.restore();
  }
  c.restore();
}

// Myrskynoidan äreä lumipilvi: harmaanlila möhkäle kulmat kurtussa, hiutaleita alla
function drawSledCloud(c, x, y, r, t, puff) {
  var i, sq = puff > 0 ? 1 + Math.sin(puff * 20) * 0.08 : 1, fx, fy;
  c.fillStyle = 'rgba(240,248,255,0.8)';
  for (i = 0; i < 4; i++) {
    fx = x + (i - 1.5) * r * 0.45 + Math.sin(t * 2 + i) * r * 0.1;
    fy = y + r * (0.6 + ((t * 0.6 + i * 0.27) % 1) * 0.8);
    c.beginPath(); c.arc(fx, fy, Math.max(1.5, r * 0.06), 0, Math.PI * 2); c.fill();
  }
  c.save();
  c.translate(x, y);
  c.scale(sq, 2 - sq);
  artBlob(c, -r * 0.5, r * 0.1, r * 0.5, r * 0.4, '#9a98c0', { shadeTo: '#64628c', lineColor: '#46446a', hi: 0.15 });
  artBlob(c, r * 0.5, r * 0.12, r * 0.48, r * 0.38, '#9a98c0', { shadeTo: '#64628c', lineColor: '#46446a', hi: 0.15 });
  artBlob(c, 0, -r * 0.1, r * 0.62, r * 0.55, '#a8a6cc', { shadeTo: '#706e98', lineColor: '#46446a', hi: 0.22 });
  artEye(c, -r * 0.2, 0, r * 0.1, 0, false);
  artEye(c, r * 0.2, 0, r * 0.1, 0, false);
  c.strokeStyle = '#2a2848';
  c.lineWidth = Math.max(2, r * 0.07);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * 0.34, -r * 0.2); c.lineTo(-r * 0.1, -r * 0.12); c.stroke();
  c.beginPath(); c.moveTo(r * 0.34, -r * 0.2); c.lineTo(r * 0.1, -r * 0.12); c.stroke();
  c.beginPath(); c.arc(0, r * 0.26, r * 0.12, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  c.restore();
}

function drawSled() {
  var i, r, ry, us, hop;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, camX);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  propsDraw(ctx);
  for (i = 0; i < sledRings.length; i++) {
    r = sledRings[i];
    if (r.collected) continue;
    ry = r.ay + Math.sin(r.phase) * viewH * 0.01;
    drawNorthHoop(ctx, r.ax - camX, ry, viewH * 0.055, r.color, r.phase);
  }
  for (i = 0; i < sledRocks.length; i++) {
    drawSledCloud(ctx, sledRocks[i].x - camX, sledRocks[i].y, viewH * 0.06, globalT + i, sledRocks[i].puffT);
  }
  us = viewH / 520;
  hop = sledFx.hopT > 0 ? Math.sin(Math.min(1, (0.45 - sledFx.hopT) / 0.45) * Math.PI) * viewH * 0.025 : 0;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawSledBody(ctx, princess.x - camX, princess.y + us * 6 - hop, us, princess.facing);
  drawPrincessFree(ctx, princess.x - camX, princess.y - hop, us, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, SLED_RINGS, function (k) { return sledRings[k] && sledRings[k].collected; },
    function (c, x, y, sz) {
      // Rengas reunaviivalla: tumma ulkorengas ja vaalea sisärengas
      c.beginPath(); c.arc(x, y, sz * 0.4, 0, Math.PI * 2);
      c.strokeStyle = '#2a9a70'; c.lineWidth = 5; c.stroke();
      c.strokeStyle = '#7cffc4'; c.lineWidth = 3; c.stroke();
    });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
