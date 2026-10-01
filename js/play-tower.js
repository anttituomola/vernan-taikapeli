'use strict';

// Arvoitusten torni: neljä tehtäväovea peräkkäin, jalokivet hyllyillä ja
// heiluvat kattokruunut. Painopiste pulmissa. Sydämet käytössä.

var GEM_COUNT = 6;
var gems = [];
var pendulums = [];
var throne = { fx: 0.95, x: 0, open: false };
var gemDefs = [
  { fx: 0.165, fy: 0.34 }, { fx: 0.385, fy: 0.36 }, { fx: 0.605, fy: 0.34 },
  { fx: 0.825, fy: 0.36 }, { fx: 0.30, fy: 0.12 }, { fx: 0.76, fy: 0.12 }
];
var GEM_COLORS = ['#ff5f7e', '#5fa8ff', '#6fd66f', '#ffe94f', '#c9a0ff', '#8fd3ff'];
var towerTapSeen = 0;     // viimeksi käsitelty kosketuksen alkuhetki (juoksukentällä ei ole tap-koukkua)

function layoutTower() {
  var g = groundTop;
  platforms = [
    { kind: 'ground', x: 0, y: g, w: worldW },
    { kind: 'ledge', x: worldW * 0.14, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.36, y: g - viewH * 0.22, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.58, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.80, y: g - viewH * 0.22, w: worldW * 0.05 }
  ];
  throne.x = throne.fx * worldW;
  towerProps();
}

function initTower() {
  var i;
  layoutTower();
  tasks = [
    makeTask(0.20, 'pairs', { pairs: 4 }),
    makeTask(0.44, 'puzzle'),
    makeTask(0.66, 'word', { maxSyl: 3 }),
    makeTask(0.88, 'memory', { seqLen: 4, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.52]);
  gems = [];
  for (i = 0; i < GEM_COUNT; i++) {
    gems.push({
      ax: gemDefs[i].fx * worldW, ay: groundTop - gemDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: GEM_COLORS[i % GEM_COLORS.length]
    });
  }
  pendulums = [];
  var pFx = [0.27, 0.50, 0.72];
  for (i = 0; i < pFx.length; i++) {
    pendulums.push({ fx: pFx[i], x: pFx[i] * worldW, phase: i * 1.3, speed: 1.1, angle: 0, flareT: 0 });
  }
  throne.open = false;
  towerTapSeen = holdStartG;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(392, 0, 0.3, 'triangle', 0.35);
  playNote(494, 0.15, 0.3, 'triangle', 0.35);
  playNote(587, 0.3, 0.4, 'sine', 0.35);
}

function respawnTower() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeTower(ratio) {
  var i;
  princess.x *= ratio;
  layoutTower();
  for (i = 0; i < gems.length; i++) {
    gems[i].ax = gemDefs[i].fx * worldW;
    gems[i].ay = groundTop - gemDefs[i].fy * viewH;
  }
  for (i = 0; i < pendulums.length; i++) pendulums[i].x = pendulums[i].fx * worldW;
}

function collectGem(gm) {
  gm.collected = true;
  registerCollected(gm);
  spawnSparkles(gm.ax, gm.ay, 14, gm.color);
  playNote(880 + countCollected(gems) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(gems) * 60, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(gems) === GEM_COUNT && !throne.open) {
    throne.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function pendulumBob(p) {
  var pivotY = viewH * 0.06, len = viewH * 0.5;
  return { x: p.x + Math.sin(p.angle) * len, y: pivotY + Math.cos(p.angle) * len };
}

function updateTower(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();
  towerPollTap();

  platformerStep(dt, { runSp: viewW * 0.22 });
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < gems.length; i++) {
    var gm = gems[i];
    if (gm.collected) continue;
    gm.phase += dt * 2;
    var dx = gm.ax - princess.x, dy = (gm.ay + Math.sin(gm.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectGem(gm);
  }

  // Kattokruunut heiluvat: kulje ohi kun kruunu on sivulla
  for (i = 0; i < pendulums.length; i++) {
    var p = pendulums[i];
    if (!busy) p.phase += dt * p.speed;
    if (p.flareT > 0) p.flareT -= dt;
    p.angle = Math.sin(p.phase) * 0.55;
    var bob = pendulumBob(p);
    var hx = bob.x - princess.x, hy = bob.y - (princess.y - viewH * 0.1);
    if (!celebrating && hx * hx + hy * hy < viewH * 0.09 * viewH * 0.09) {
      if (loseHeart()) {
        princess.knockVx = (hx > 0 ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.25;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffe27a');
      }
    }
  }

  if (throne.open && !celebrating && Math.abs(princess.x - throne.x) < viewH * 0.08) {
    startCelebration();
  }

  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function towerLayers() {
  return [
    { speed: 0.22, render: renderTowerFar },
    { speed: 0.55, render: renderTowerMid },
    { speed: 1, render: renderTowerNear }
  ];
}
function renderTowerBg(b, w, h) {
  renderTowerFar(b, w, h);
  renderTowerMid(b, w, h);
  renderTowerNear(b, w, h);
}
function renderTowerFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b0630');
  sky.addColorStop(1, '#2a1860');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.5, h * 0.18, h * 0.05, 0.22, '#fff4c8', '#ffffff', '#ffe9a8');
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 40; i++) {
    x = (i * 173.3) % w;
    b.globalAlpha = 0.4 + (i % 4) * 0.12;
    b.beginPath(); b.arc(x, (i * 97.1) % (h * 0.4), 1.3 + (i % 3), 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
}
function renderTowerMid(b, w, h) {
  var i, x, k;
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#241c48');
  wall.addColorStop(0.7, '#3c2f6e');
  wall.addColorStop(1, '#2e2458');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  b.strokeStyle = 'rgba(255,255,255,0.05)';
  b.lineWidth = 2;
  for (i = 0; i < 14; i++) { b.beginPath(); b.moveTo(0, h * 0.05 * i); b.lineTo(w, h * 0.05 * i); b.stroke(); }
  // Keskikerros: kirjahyllyt sävytetään seinän väriin (ilmaperspektiivi), ei reunaviivoja
  var bookCols = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff', '#ffe94f'];
  var hazeCol = '#3c2f6e', hazed = [], shelfCol = artMix('#5a3d2a', hazeCol, 0.3), boardCol = artMix('#7a5538', hazeCol, 0.3);
  for (k = 0; k < bookCols.length; k++) hazed.push(artMix(bookCols[k], hazeCol, 0.3));
  for (i = 0; i < 12; i++) {
    x = w * (0.04 + i * 0.082);
    if (i % 3 === 1) {
      var wg = b.createLinearGradient(0, h * 0.14, 0, h * 0.44);
      wg.addColorStop(0, '#0b0630');
      wg.addColorStop(1, '#2a1860');
      b.fillStyle = wg;
      b.beginPath();
      b.moveTo(x - h * 0.05, h * 0.44); b.lineTo(x - h * 0.05, h * 0.22); b.arc(x, h * 0.22, h * 0.05, Math.PI, 0); b.lineTo(x + h * 0.05, h * 0.44);
      b.closePath(); b.fill();
      b.fillStyle = '#fff6c8';
      b.beginPath(); b.arc(x + h * 0.015, h * 0.26, h * 0.006, 0, Math.PI * 2); b.fill();
      b.beginPath(); b.arc(x - h * 0.02, h * 0.34, h * 0.005, 0, Math.PI * 2); b.fill();
      continue;
    }
    b.fillStyle = shelfCol;
    b.fillRect(x - h * 0.07, h * 0.16, h * 0.14, h * 0.3);
    for (k = 0; k < 3; k++) {
      var sy = h * 0.19 + k * h * 0.09;
      b.fillStyle = boardCol;
      b.fillRect(x - h * 0.065, sy + h * 0.07, h * 0.13, h * 0.012);
      var j;
      for (j = 0; j < 5; j++) {
        b.fillStyle = hazed[(i + j + k) % hazed.length];
        b.fillRect(x - h * 0.06 + j * h * 0.025, sy + h * 0.01 + (j % 2) * h * 0.008, h * 0.02, h * 0.06 - (j % 2) * h * 0.008);
      }
    }
  }
}
function renderTowerNear(b, w, h) {
  var i, x;
  var floor = b.createLinearGradient(0, groundTop, 0, h);
  floor.addColorStop(0, '#7d6a9c');
  floor.addColorStop(1, '#4a3d66');
  b.fillStyle = floor;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(0,0,0,0.12)';
  for (x = 0; x < w; x += h * 0.12) b.fillRect(x, groundTop, 2, h - groundTop);
  b.beginPath(); b.rect(0, groundTop + 4, w, h * 0.06);
  artFillPath(b, '#5a3aa0', groundTop + 4, groundTop + 4 + h * 0.06, h * 0.03, { lineColor: '#ffd24f' });
  for (i = 1; i < platforms.length; i++) {
    drawStoneSlab(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05, h);
  }
}

// Tökättävät koristeet: lattiakynttelikköjä ja kirjapinoja ovien välissä
// sekä valtaistuin piirretään joka ruudulla, jotta ne heilahtavat
// napautuksesta. Kutsutaan layoutTowerista (init ja resize).
function towerProps() {
  var h = viewH, i, candleFx = [0.12, 0.60], bookFx = [0.38, 0.84];
  propsReset();
  for (i = 0; i < 2; i++) {
    propAdd({
      x: worldW * candleFx[i], y: groundTop, s: h * 0.05, r: h * 0.1, hy: h * 0.11, amp: 0.08, color: '#ffd86a', note: 700 + i * 90,
      draw: towerDrawCandelabra,
      poke: function (p) {
        // Liekit leimahtavat
        spawnSparkles(p.x, p.y - p.s * 2.7, 8, '#ffe27a');
        playNote(1568, 0.06, 0.12, 'triangle', 0.14);
      }
    });
    propAdd({
      x: worldW * bookFx[i], y: groundTop, s: h * 0.045, r: h * 0.08, hy: h * 0.03, amp: 0.1, color: '#c9a0ff', note: 560 + i * 70, ci: i,
      draw: towerDrawBooks,
      poke: function (p) {
        // Päällimmäinen kansi läpsähtää auki ja pölyä pöllähtää
        spawnSparkles(p.x, p.y - p.s * 1.2, 8, '#ffffff');
        playNote(440, 0.05, 0.08, 'triangle', 0.12);
      }
    });
  }
  propAdd({
    x: throne.x, y: groundTop, r: h * 0.14, hy: h * 0.11, amp: 0.035, color: '#ffd24f', note: 784, owl: 0,
    draw: towerDrawThrone,
    update: function (p, dt) { if (p.owl > 0) { p.owl += dt; if (p.owl > 2.6) p.owl = 0; } },
    poke: towerThronePoke
  });
}

function towerThronePoke(p) {
  // Kruunu kimaltaa ja fanfaari soi; joka kolmas tökkäys kutsuu pöllön esiin (yllätys)
  spawnSparkles(p.x, p.y - viewH * 0.1, 10, '#ffd24f');
  playNote(1047, 0.1, 0.16, 'triangle', 0.2);
  playNote(1319, 0.22, 0.2, 'triangle', 0.2);
  if (p.n % 3 === 0 && !(p.owl > 0)) {
    p.owl = 0.001;
    playNote(392, 0.6, 0.18, 'sine', 0.25);
    playNote(330, 0.85, 0.3, 'sine', 0.25);
  }
}

// Valtaistuin (origo = lattia): selkänoja, tyyny, jalusta ja kruunu.
// Yllätys: pöllö nousee selkänojan takaa, räpyttelee silmiään ja painuu takaisin.
function towerDrawThrone(c, p) {
  var s = viewH * 0.1, lw = Math.max(1.2, s * 0.04), k, oy, os, blink;
  artShadow(c, 0, 0, s * 0.95, s * 0.16, 0.2);
  if (p.owl > 0) {
    k = p.owl < 0.4 ? easeOutBack(p.owl / 0.4) : (p.owl > 2.2 ? Math.max(0, (2.6 - p.owl) / 0.4) : 1);
    os = s * 0.3;
    oy = -s * 1.2 - k * s * 1.0;
    blink = p.owl > 1.0 && p.owl < 1.5 && Math.sin(p.owl * 25) > 0;
    // Korvatupsut, vartalo, maha, silmät ja nokka (piirretään ennen selkänojaa)
    c.beginPath(); c.moveTo(-os * 0.9, oy - os * 0.6); c.lineTo(-os * 0.75, oy - os * 1.5); c.lineTo(-os * 0.2, oy - os * 0.95); c.closePath();
    artFillPath(c, '#9b7bff', oy - os * 1.5, oy - os * 0.6, os * 0.3, { lineColor: '#4a2a90', line: lw });
    c.beginPath(); c.moveTo(os * 0.9, oy - os * 0.6); c.lineTo(os * 0.75, oy - os * 1.5); c.lineTo(os * 0.2, oy - os * 0.95); c.closePath();
    artFillPath(c, '#9b7bff', oy - os * 1.5, oy - os * 0.6, os * 0.3, { lineColor: '#4a2a90', line: lw });
    artBlob(c, 0, oy, os, os * 1.15, '#9b7bff', { lineColor: '#4a2a90', line: lw, hi: 0.25 });
    artBlob(c, 0, oy + os * 0.35, os * 0.6, os * 0.6, '#e3d8f5', { line: false });
    artEye(c, -os * 0.38, oy - os * 0.3, os * 0.3, 0, blink);
    artEye(c, os * 0.38, oy - os * 0.3, os * 0.3, 0, blink);
    c.fillStyle = '#ffb347';
    c.beginPath(); c.moveTo(-os * 0.12, oy + os * 0.02); c.lineTo(os * 0.12, oy + os * 0.02); c.lineTo(0, oy + os * 0.3); c.closePath(); c.fill();
  }
  artRoundRect(c, -s * 0.7, -s * 1.8, s * 1.4, s * 1.8, s * 0.2, '#8a5cb8', { lineColor: '#4a2a70', line: lw });
  artRoundRect(c, -s * 0.55, -s * 1.5, s * 1.1, s * 0.9, s * 0.15, '#c0304e', { lineColor: '#6a1428', line: lw });
  artHighlight(c, -s * 0.3, -s * 1.32, s * 0.16, s * 0.08, 0.3);
  artRoundRect(c, -s * 0.7, -s * 0.6, s * 1.4, s * 0.12, s * 0.04, '#ffd24f', { lineColor: '#9a6a10', line: lw });
  // Kruunu istuimella
  c.beginPath();
  c.moveTo(-s * 0.35, -s * 0.75); c.lineTo(-s * 0.35, -s * 1.1); c.lineTo(-s * 0.17, -s * 0.9); c.lineTo(0, -s * 1.2);
  c.lineTo(s * 0.17, -s * 0.9); c.lineTo(s * 0.35, -s * 1.1); c.lineTo(s * 0.35, -s * 0.75); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.2, -s * 0.75, s * 0.3, { lineColor: '#9a6a10', line: lw });
  artCircle(c, 0, -s * 0.93, s * 0.06, '#ff5f7e', { line: false });
}

// Lattiakynttelikkö (origo = lattia): jalusta, varsi, poikkipuu ja kolme
// kynttilää. Tökättynä liekit leimahtavat (p.t = aika tökkäyksestä).
function towerDrawCandelabra(c, p) {
  var s = p.s, i, x, fl, lw = Math.max(1.2, s * 0.05);
  var flare = p.t >= 0 && p.t < 0.8 ? 1 - p.t / 0.8 : 0;
  artShadow(c, 0, 0, s * 0.9, s * 0.16, 0.2);
  artGlow(c, 0, -s * 2.6, s * (1.6 + flare), '#ffd86a', 0.35 + flare * 0.3);
  artRoundRect(c, -s * 0.5, -s * 0.16, s, s * 0.16, s * 0.06, '#d9b34f', { lineColor: '#8a6a10', line: lw });
  artLimb(c, 0, -s * 0.1, 0, -s * 2.0, s * 0.14, '#d9b34f', '#8a6a10');
  artLimb(c, -s * 0.7, -s * 2.0, s * 0.7, -s * 2.0, s * 0.12, '#d9b34f', '#8a6a10');
  for (i = -1; i <= 1; i++) {
    x = i * s * 0.7;
    artRoundRect(c, x - s * 0.1, -s * 2.6, s * 0.2, s * 0.6, s * 0.06, '#fff6c8', { lineColor: '#b8a060', line: lw, shadeTo: '#e3d8f5' });
    fl = Math.sin(globalT * 9 + i * 2 + p.x) * s * 0.04;
    artBlob(c, x, -s * 2.78 + fl, s * 0.09 * (1 + flare * 0.6), s * 0.16 * (1 + flare * 0.8), '#ffb84f', { lineColor: '#d9700f', line: Math.max(1, s * 0.03) });
  }
}

// Kirjapino (origo = lattia): kolme kirjaa reunaviivoin ja sivuraidoin.
// Tökättynä päällimmäinen kansi raottuu (p.t).
function towerDrawBooks(c, p) {
  var s = p.s, i, col, dx, cols = ['#ff5f7e', '#5fa8ff', '#6fd66f', '#ffb84f'], lw = Math.max(1.2, s * 0.05);
  var flip = p.t >= 0 ? Math.sin(Math.min(1, p.t / 0.7) * Math.PI) : 0;
  artShadow(c, 0, 0, s * 1.2, s * 0.18, 0.2);
  for (i = 0; i < 3; i++) {
    col = cols[(i + p.ci) % 4];
    dx = (i % 2) * s * 0.15;
    artRoundRect(c, -s * (1 - i * 0.1) + dx, -s * 0.36 * (i + 1), s * (2 - i * 0.2), s * 0.36, s * 0.08, col, { lineColor: artShade(col, -0.5), line: lw });
    c.fillStyle = 'rgba(255,255,255,0.7)';
    roundRect(c, -s * (0.85 - i * 0.1) + dx, -s * 0.36 * (i + 1) + s * 0.1, s * (1.6 - i * 0.2), s * 0.08, s * 0.04);
    c.fill();
  }
  if (flip > 0) {
    c.save();
    c.translate(-s * 0.8, -s * 1.08);
    c.rotate(-flip * 1.2);
    artRoundRect(c, 0, -s * 0.08, s * 1.6, s * 0.1, s * 0.04, '#fff6e8', { lineColor: '#b8a080', line: Math.max(1, s * 0.04) });
    c.restore();
  }
}

// Juoksukentällä ei ole omaa napautuskoukkua: uusi kosketus tunnistetaan
// otteen alkuhetkestä (hyppyalueen napautukset eivät tule tänne). Kattokruunun
// kynttilät leimahtavat ja koristeet heilahtavat: pelkkää koristetta.
function towerPollTap() {
  if (holdStartG === towerTapSeen) return;
  towerTapSeen = holdStartG;
  if (!running || celebrating || puzzleBusy()) return;
  var wx = holdSX + camX, wy = holdSY, i, bob;
  for (i = 0; i < pendulums.length; i++) {
    bob = pendulumBob(pendulums[i]);
    if (Math.hypot(wx - bob.x, wy - bob.y) < viewH * 0.09) {
      pendulums[i].flareT = 0.8;
      playNote(1568, 0, 0.12, 'triangle', 0.18);
      playNote(2093, 0.1, 0.14, 'triangle', 0.14);
      spawnSparkles(bob.x, bob.y - viewH * 0.03, 8, '#ffe27a');
      return;
    }
  }
  propsTap(wx, wy);
}

// Jalokivi: särmikäs muoto reunaviivalla, kiiltofasetti ja hehku
function drawGem(c, x, y, s, color) {
  var line = artShade(color, -0.5);
  artGlow(c, x, y, s * 1.6, color, 0.4);
  c.beginPath();
  c.moveTo(x - s * 0.7, y - s * 0.2);
  c.lineTo(x - s * 0.35, y - s * 0.65);
  c.lineTo(x + s * 0.35, y - s * 0.65);
  c.lineTo(x + s * 0.7, y - s * 0.2);
  c.lineTo(x, y + s * 0.75);
  c.closePath();
  artFillPath(c, color, y - s * 0.65, y + s * 0.75, s * 0.7, { lineColor: line });
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.moveTo(x - s * 0.35, y - s * 0.65);
  c.lineTo(x, y - s * 0.65);
  c.lineTo(x - s * 0.2, y - s * 0.2);
  c.lineTo(x - s * 0.7, y - s * 0.2);
  c.closePath();
  c.fill();
  c.strokeStyle = artRGBA(line, 0.5);
  c.lineWidth = Math.max(1, s * 0.06);
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - s * 0.7, y - s * 0.2); c.lineTo(x + s * 0.7, y - s * 0.2);
  c.moveTo(x - s * 0.35, y - s * 0.65); c.lineTo(x - s * 0.2, y - s * 0.2); c.lineTo(x, y + s * 0.75);
  c.moveTo(x + s * 0.35, y - s * 0.65); c.lineTo(x + s * 0.2, y - s * 0.2); c.lineTo(x, y + s * 0.75);
  c.stroke();
}

function drawPendulum(c, p) {
  var pivotX = p.x - camX, pivotY = viewH * 0.06;
  if (pivotX < -viewH * 0.6 || pivotX > viewW + viewH * 0.6) return;
  var bob = pendulumBob(p);
  var bx = bob.x - camX, by = bob.y, r = viewH * 0.065, i, cx2, cy2;
  var flare = p.flareT > 0 ? p.flareT / 0.8 : 0;
  artLimb(c, pivotX, pivotY, bx, by, Math.max(2, viewH * 0.006), '#c9b8e0', '#5a4a70');
  artCircle(c, pivotX, pivotY, viewH * 0.012, '#6b5a80', { lineColor: '#3a3050' });
  // Kattokruunu: hehku, rengas ja kynttilät; tökättynä liekit leimahtavat
  artGlow(c, bx, by - r * 0.3, r * (1.5 + flare * 0.6), '#ffd86a', 0.28 + flare * 0.35);
  artBlob(c, bx, by, r, r * 0.4, '#d9b34f', { lineColor: '#8a6a10', hi: 0.3 });
  for (i = 0; i < 4; i++) {
    cx2 = bx + Math.cos(i * Math.PI / 2 + globalT) * r * 0.75;
    cy2 = by - r * 0.1 + Math.sin(i * Math.PI / 2 + globalT) * r * 0.3;
    artRoundRect(c, cx2 - r * 0.05, cy2 - r * 0.35, r * 0.1, r * 0.35, r * 0.03, '#fff6c8', { lineColor: '#b8a060', line: Math.max(1, r * 0.02), shadeTo: '#e3d8f5' });
    artBlob(c, cx2, cy2 - r * 0.44, r * 0.07 * (1 + flare * 0.5), r * 0.12 * (1 + flare * 0.8), '#ffb84f', { lineColor: '#d9700f', line: Math.max(1, r * 0.02) });
  }
}

function drawThroneGlow(c) {
  var x = throne.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var s = h * 0.1;
  if (throne.open) {
    artGlow(c, x, groundTop - s * 1.2, s * 2, '#fff0b4', 0.55 + Math.sin(globalT * 4) * 0.15);
    drawStar(c, x, groundTop - s * 2.4, h * 0.035, globalT, 1);
  }
}

function drawTower() {
  var i;
  if (!beginPlayWorld()) return;
  for (i = 0; i < pendulums.length; i++) drawPendulum(ctx, pendulums[i]);
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawThroneGlow(ctx);
  for (i = 0; i < gems.length; i++) {
    if (gems[i].collected) continue;
    drawGem(ctx, gems[i].ax - camX, gems[i].ay + Math.sin(gems[i].phase) * viewH * 0.012, viewH * 0.028, gems[i].color);
  }
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (throne.open && !celebrating) drawEdgeArrow(ctx, throne.x);
  endPlayWorld();
  drawPickupHud(ctx, GEM_COUNT, function (i2) { return gems[i2] && gems[i2].collected; },
    function (c, x, y, s) { drawGem(c, x, y, s, '#8fd3ff'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
