'use strict';

// Karkkitaivas: lennä sormea kohti, kerää kahdeksan karkkia ja väistä
// ajelehtivia ukkospilviä. Kun kaikki karkit ovat tallessa, karkkiportti
// hehkuu maailman laidassa — lennä sen läpi. Sydämet ja lyhdyt käytössä.

var CANDYSKY_COUNT = 8;
var skyCandies = [];
var candyThunder = [];
var candyGate = { fx: 0.93, x: 0, ready: false };

var candySkyDefs = [
  { fx: 0.08, fy: 0.30 }, { fx: 0.17, fy: 0.48 }, { fx: 0.26, fy: 0.22 }, { fx: 0.38, fy: 0.42 },
  { fx: 0.50, fy: 0.26 }, { fx: 0.62, fy: 0.50 }, { fx: 0.74, fy: 0.30 }, { fx: 0.85, fy: 0.44 }
];
var CANDY_WRAP_COLORS = ['#ff6b9d', '#ffd24f', '#7fd4ff', '#8fe38f', '#c9a0ff', '#ff9f3a', '#ff8fc0', '#6fd6d6'];

function initCandysky() {
  var i;
  tasks = [makeTask(0.30, 'give'), makeTask(0.62, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.40, 0.70]);
  skyCandies = [];
  for (i = 0; i < CANDYSKY_COUNT; i++) {
    skyCandies.push({
      ax: candySkyDefs[i].fx * worldW, ay: groundTop - candySkyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      color: CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length]
    });
  }
  candyThunder = [];
  var tFx = [0.22, 0.45, 0.58, 0.80];
  for (i = 0; i < tFx.length; i++) {
    candyThunder.push({
      fx: tFx[i], x: tFx[i] * worldW,
      baseY: viewH * (0.28 + (i % 2) * 0.2), y: 0,
      amp: viewH * (0.07 + (i % 2) * 0.05), t: i * 1.7, f: 1.1 + (i % 3) * 0.3, pokeT: 0
    });
  }
  candyGate.x = candyGate.fx * worldW;
  candyGate.ready = false;
  candyskyProps();
  princess.x = viewW * 0.14;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  princess.facing = 1;
  princess.onGround = false;
  princess.walkPhase = 0;
  princess.coyote = 0;
  checkpoint.x = princess.x;
  checkpoint.y = princess.y;
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.35);
  playNote(784, 0.14, 0.32, 'triangle', 0.35);
}

function respawnCandysky() {
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  spawnSparkles(princess.x, princess.y, 14, '#ffe27a');
}

function resizeCandysky(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < skyCandies.length; i++) {
    skyCandies[i].ax = candySkyDefs[i].fx * worldW;
    skyCandies[i].ay = groundTop - candySkyDefs[i].fy * viewH;
  }
  for (i = 0; i < candyThunder.length; i++) candyThunder[i].x = candyThunder[i].fx * worldW;
  candyGate.x = candyGate.fx * worldW;
  candyskyProps();
}

function collectSkyCandy(cd) {
  cd.collected = true;
  registerCollected(cd);
  spawnSparkles(cd.ax, cd.ay, 14, cd.color);
  playNote(660 + countCollected(skyCandies) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(skyCandies) * 55, 0.08, 0.3, 'triangle', 0.3);
  if (countCollected(skyCandies) === CANDYSKY_COUNT && !candyGate.ready) {
    candyGate.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleCandyskyTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, dx, dy;
  for (i = 0; i < skyCandies.length; i++) {
    if (skyCandies[i].collected) continue;
    dx = wx - skyCandies[i].ax;
    dy = py - (skyCandies[i].ay + Math.sin(skyCandies[i].phase) * viewH * 0.015);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectSkyCandy(skyCandies[i]);
      return;
    }
  }
  // Ukkospilvi välähtää ja murahtaa tökkäyksestä (pelkkä koriste)
  for (i = 0; i < candyThunder.length; i++) {
    if (Math.hypot(wx - candyThunder[i].x, py - candyThunder[i].y) < viewH * 0.08) {
      candyThunder[i].pokeT = 0.5;
      playNote(98, 0, 0.3, 'sawtooth', 0.12);
      playNote(1760, 0, 0.05, 'square', 0.08);
      spawnSparkles(candyThunder[i].x, candyThunder[i].y + viewH * 0.04, 6, '#ffe94f');
      return;
    }
  }
  // Koristeet (karkkitolpat, portti, hattarapilvi) heilahtavat
  propsTap(wx, py);
}

function updateCandysky(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Lento (kuten Kuutamotaivaalla)
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.55 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.7 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.28) princess.vx = viewW * 0.28;
  if (princess.vx < -viewW * 0.28) princess.vx = -viewW * 0.28;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;
  if (!busy) {
    princess.x += princess.vx * dt;
    princess.y += princess.vy * dt;
  }
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();
  princess.walkPhase += dt * 6;
  updateCheckpoints(princess.x, princess.y);

  // Karkit kimaltelevat; niihin voi myös lentää läpi
  for (i = 0; i < skyCandies.length; i++) {
    var cd = skyCandies[i];
    if (cd.collected) continue;
    cd.phase += dt * 2;
    var dx = cd.ax - princess.x, dy = cd.ay - princess.y;
    if (!busy && !celebrating && dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) collectSkyCandy(cd);
  }

  // Ukkospilvet ajelehtivat
  for (i = 0; i < candyThunder.length; i++) {
    var th = candyThunder[i];
    th.t += dt;
    if (th.pokeT > 0) th.pokeT -= dt;
    th.y = th.baseY + Math.sin(th.t * th.f) * th.amp;
    var tdx = th.x - princess.x, tdy = th.y - (princess.y - viewH * 0.06);
    if (!celebrating && tdx * tdx + tdy * tdy < viewH * 0.075 * viewH * 0.075) {
      if (loseHeart()) {
        princess.vx = (tdx > 0 ? -1 : 1) * viewW * 0.25;
        princess.vy = viewH * 0.3;
        spawnSparkles(princess.x, princess.y, 12, '#ffe94f');
      }
    }
  }

  if (candyGate.ready && !celebrating && Math.abs(princess.x - candyGate.x) < viewW * 0.06) {
    startCelebration();
  }

  followCam(princess.x, dt);
  if (Math.random() < dt * 8) spawnSparkles(princess.x - princess.facing * 20, princess.y - viewH * 0.02, 1, '#ffd6ff');
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function candyskyLayers() {
  return [
    { speed: 0.22, render: renderCandyskyFar },
    { speed: 0.55, render: renderCandyskyMid },
    { speed: 1, render: renderCandyskyNear }
  ];
}
function renderCandyskyBg(b, w, h) {
  renderCandyskyFar(b, w, h);
  renderCandyskyMid(b, w, h);
  renderCandyskyNear(b, w, h);
}
function renderCandyskyFar(b, w, h) {
  var i;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ff8fc8');
  sky.addColorStop(0.55, '#ffd9ec');
  sky.addColorStop(1, '#fff3fa');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.78, h * 0.15, h * 0.06, 0.22, '#fff0c8', '#ffffff', '#ffd45a');
  for (i = 0; i < 10; i++) drawCloud(b, w * (0.05 + i * 0.1), h * (0.1 + (i % 3) * 0.08), h * 0.035, 0.75);
}
function renderCandyskyMid(b, w, h) {
  var i, x;
  for (i = 0; i < 9; i++) {
    x = w * (i / 8);
    b.beginPath(); b.arc(x, groundTop + h * 0.03, h * (0.1 + (i % 3) * 0.05), Math.PI, 0); b.closePath();
    // Keskikerros sävytetään taivaaseen (ilmaperspektiivi), ei reunaviivaa
    artFillPath(b, artMix('#ffc4e0', '#fff3fa', 0.3), groundTop - h * 0.12, groundTop + h * 0.03, h * 0.1, { line: false });
  }
}
function renderCandyskyNear(b, w, h) {
  var i, x;
  var gr = b.createLinearGradient(0, groundTop, 0, h);
  gr.addColorStop(0, '#fff0f7');
  gr.addColorStop(1, '#ffd6ea');
  b.fillStyle = gr;
  b.fillRect(0, groundTop, w, h - groundTop);
  for (i = 0; i < 7; i++) {
    if (i % 2 === 1) continue; // tolpat 1, 3 ja 5 ovat tökättäviä koristeita (candyskyProps)
    x = w * (0.07 + i * 0.14);
    candyskyDrawPole(b, x, groundTop, h * (0.05 + (i % 3) * 0.015), CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length]);
  }
}

// Karkkitolppa: tikku reunaviivalla ja karkkipallo. Sama piirto taustalle
// ja tökättäville koristeille.
function candyskyDrawPole(c, x, baseY, s, color) {
  artShadow(c, x, baseY + s * 0.05, s * 0.9, s * 0.18, 0.12);
  artLimb(c, x, baseY, x, baseY - s * 2.2, Math.max(2, s * 0.12), '#ffffff', '#d8b8d0');
  artCircle(c, x, baseY - s * 2.6, s, color, { lineColor: artShade(color, -0.45), hi: 0.4 });
}

// Pilven ääriviiva (sama muoto kuin cloudPath), g kasvattaa säteitä reunaviivaa varten
function candyskyCloudPath(c, x, y, s, g) {
  c.beginPath();
  c.arc(x, y, s * 1.2 + g, 0, Math.PI * 2);
  c.arc(x + s * 1.4, y + s * 0.2, s * 0.9 + g, 0, Math.PI * 2);
  c.arc(x - s * 1.4, y + s * 0.25, s * 0.85 + g, 0, Math.PI * 2);
  c.arc(x + s * 0.5, y - s * 0.6, s * 0.8 + g, 0, Math.PI * 2);
}

// Hattarapilvi (tökättävä koriste, origo = pilven keskikohta): keinuu
// hitaasti; kolmannella tökkäyksellä sille ilmestyy kasvot, jotka iskevät silmää
function candyskyDrawCloud(c, p) {
  var s = p.s, lw = Math.max(1.5, s * 0.1), k;
  c.translate(0, Math.sin(globalT * 1.3 + p.ph) * s * 0.2);
  c.fillStyle = '#d9709f';
  candyskyCloudPath(c, 0, 0, s, lw);
  c.fill();
  candyskyCloudPath(c, 0, 0, s, 0);
  artFillPath(c, '#ffb3d9', -s * 1.4, s * 1.1, s, { line: false });
  artHighlight(c, -s * 0.7, -s * 0.5, s * 0.5, s * 0.25, 0.45);
  if (p.face > 0) {
    k = Math.min(1, p.face / 0.3);
    artEye(c, -s * 0.45, -s * 0.05, s * 0.17 * k, 0.3, false);
    artEye(c, s * 0.35, -s * 0.1, s * 0.17 * k, 0.3, p.face > 1.2 && p.face < 1.6);
    artBlush(c, -s * 0.95, s * 0.35, s * 0.2);
    artBlush(c, s * 0.85, s * 0.3, s * 0.2);
    c.strokeStyle = '#a84a78';
    c.lineWidth = Math.max(1, s * 0.08);
    c.lineCap = 'round';
    c.beginPath(); c.arc(-s * 0.05, s * 0.25, s * 0.3 * k, 0.3, Math.PI - 0.3); c.stroke();
  }
}

// Karkkiportti (origo = portin keskikohta maassa): kaari reunaviivalla,
// karkkipallot jaloissa ja kolme karkkilamppua kaarella
function candyskyDrawGate(c, p) {
  var h = viewH, gs = h * 0.16, i, a, lw = Math.max(1.2, h * 0.004);
  var lamps = ['#ffd24f', '#8fe38f', '#7fd4ff'];
  artShadow(c, 0, 0, gs * 1.1, gs * 0.14, 0.14);
  c.lineCap = 'round';
  c.strokeStyle = '#a83050';
  c.lineWidth = gs * 0.14 + lw * 2;
  c.beginPath(); c.arc(0, 0, gs * 0.9, Math.PI, 0); c.stroke();
  c.strokeStyle = '#ff6b9d';
  c.lineWidth = gs * 0.14;
  c.beginPath(); c.arc(0, 0, gs * 0.9, Math.PI, 0); c.stroke();
  c.strokeStyle = '#fff';
  c.lineWidth = gs * 0.07;
  c.beginPath(); c.arc(0, 0, gs * 0.9, Math.PI, 0); c.stroke();
  artCircle(c, -gs * 0.9, 0, gs * 0.12, '#ff6b9d', { lineColor: '#a83050', hi: 0.4 });
  artCircle(c, gs * 0.9, 0, gs * 0.12, '#ff6b9d', { lineColor: '#a83050', hi: 0.4 });
  for (i = -1; i <= 1; i++) {
    a = -Math.PI / 2 + i * 0.6;
    artCircle(c, Math.cos(a) * gs * 0.9, Math.sin(a) * gs * 0.9, gs * 0.09, lamps[i + 1], { lineColor: artShade(lamps[i + 1], -0.45), line: lw, hi: 0.4 });
  }
}

// Tökättävät koristeet: karkkitolpat 1, 3 ja 5 (samat paikat kuin taustan
// tolpilla), karkkiportti ja hattarapilvi korkealla lentokaton yläpuolella.
// Kutsutaan myös resize-koukusta.
function candyskyProps() {
  var i, h = viewH, s;
  propsReset();
  for (i = 1; i < 7; i += 2) {
    s = h * (0.05 + (i % 3) * 0.015);
    propAdd({
      x: worldW * (0.07 + i * 0.14), y: groundTop, s: s, col: CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length],
      r: s * 1.7, hy: s * 2.6, color: CANDY_WRAP_COLORS[i % CANDY_WRAP_COLORS.length], note: 640 + i * 40,
      draw: function (c, p) { candyskyDrawPole(c, 0, 0, p.s, p.col); },
      poke: function (p) {
        // Tolpasta tipahtaa karkki
        spawnSparkles(p.x, p.y - p.s * 2.6, 8, p.col);
        propDropBall(p.x + (Math.random() - 0.5) * p.s, p.y - p.s * 2.2, p.s * 0.18, p.col, p.y + viewH * 0.01);
      }
    });
  }
  propAdd({
    x: candyGate.x, y: groundTop, r: h * 0.13, hy: h * 0.1, amp: 0.05, color: '#ff6b9d', note: 1319,
    draw: candyskyDrawGate,
    poke: function (p) {
      // Portti kilisee
      playNote(1760, 0.08, 0.12, 'triangle', 0.16);
      spawnSparkles(p.x, p.y - viewH * 0.14, 8, '#ffd24f');
    }
  });
  propAdd({
    x: worldW * 0.5, y: h * 0.085, s: h * 0.04, r: h * 0.08, hy: 0, amp: 0.1, color: '#ffb3d9', note: 988, ph: 1.3, face: 0,
    draw: candyskyDrawCloud,
    update: function (p, dt) { if (p.face > 0) { p.face += dt; if (p.face > 2.6) p.face = 0; } },
    poke: function (p) {
      // Sokeripöly; joka kolmas tökkäys paljastaa kasvot (yllätys)
      spawnSparkles(p.x, p.y, 12, '#ffffff');
      if (p.n % 3 === 0 && !(p.face > 0)) {
        p.face = 0.001;
        playNote(1047, 0.2, 0.1, 'sine', 0.2);
        playNote(1319, 0.3, 0.1, 'sine', 0.2);
        playNote(1568, 0.4, 0.2, 'sine', 0.2);
      }
    }
  });
}

function csDrawCandy(c, x, y, s, color) {
  // Käärekarkki: pallo + kääreen päät, reunaviivat ja hehku
  var line = artShade(color, -0.45);
  artGlow(c, x, y, s * 1.7, color, 0.35);
  c.beginPath();
  c.moveTo(x - s * 0.8, y);
  c.lineTo(x - s * 1.35, y - s * 0.5);
  c.lineTo(x - s * 1.35, y + s * 0.5);
  c.closePath();
  artFillPath(c, color, y - s * 0.5, y + s * 0.5, s * 0.5, { lineColor: line });
  c.beginPath();
  c.moveTo(x + s * 0.8, y);
  c.lineTo(x + s * 1.35, y - s * 0.5);
  c.lineTo(x + s * 1.35, y + s * 0.5);
  c.closePath();
  artFillPath(c, color, y - s * 0.5, y + s * 0.5, s * 0.5, { lineColor: line });
  artCircle(c, x, y, s, color, { lineColor: line, hi: 0.35 });
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1.5, s * 0.16);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, s * 0.55, -0.6, 1.2); c.stroke();
}

function drawCandysky() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  // Portin hehku kun se odottaa
  if (candyGate.ready) {
    var gx = candyGate.x - camX, gy = groundTop - viewH * 0.14;
    var g = ctx.createRadialGradient(gx, gy, viewH * 0.02, gx, gy, viewH * 0.2);
    g.addColorStop(0, 'rgba(255,240,160,' + (0.8 + Math.sin(globalT * 5) * 0.2) + ')');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, viewH * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < skyCandies.length; i++) {
    var cd = skyCandies[i];
    if (cd.collected) continue;
    csDrawCandy(ctx, cd.ax - camX, cd.ay + Math.sin(cd.phase) * viewH * 0.015, viewH * 0.028, cd.color);
  }
  for (i = 0; i < candyThunder.length; i++) {
    var th = candyThunder[i], tx = th.x - camX;
    if (tx > -viewH * 0.25 && tx < viewW + viewH * 0.25) {
      // Reunaviiva jaetun ukkospilven taakse; tökättynä pilvi välähtää
      ctx.fillStyle = '#2e3146';
      candyskyCloudPath(ctx, tx, th.y, viewH * 0.035, Math.max(1.5, viewH * 0.004));
      ctx.fill();
      if (th.pokeT > 0) artGlow(ctx, tx, th.y, viewH * 0.09, '#ffe94f', th.pokeT);
    }
    drawThunderCloud(ctx, th);
  }
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (candyGate.ready && !celebrating) drawEdgeArrow(ctx, candyGate.x);
  endPlayWorld();
  drawPickupHud(ctx, CANDYSKY_COUNT, function (i2) { return skyCandies[i2] && skyCandies[i2].collected; },
    function (c, x, y, s) { csDrawCandy(c, x, y, s, '#ff6b9d'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
