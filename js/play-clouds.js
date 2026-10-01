'use strict';

// Pilvipolku: tasohyppely pilvien päällä. Osa pilvistä haihtuu, kun niiden
// päällä seisoo, pinkit pilvet pomputtavat ja myrskypallot vierivät. Kuiluista
// putoaa taivaaseen. Sydämet käytössä.

var CSTAR_COUNT = 10;
var cloudStars = [];
var stormlets = [];
var cloudPuffs = [];
var cloudGround = [[0.0, 0.17], [0.20, 0.38], [0.41, 0.59], [0.62, 0.81], [0.84, 1.0]];
var rainbowGate = { fx: 0.965, x: 0, open: false };
var cstarDefs = [
  { fx: 0.07, fy: 0.30 }, { fx: 0.185, fy: 0.30 }, { fx: 0.27, fy: 0.46 }, { fx: 0.36, fy: 0.42 },
  { fx: 0.44, fy: 0.30 }, { fx: 0.52, fy: 0.42 }, { fx: 0.57, fy: 0.30 }, { fx: 0.66, fy: 0.46 },
  { fx: 0.735, fy: 0.42 }, { fx: 0.90, fy: 0.30 }
];
var PUFF_STAND = 0.7, PUFF_BACK = 2.5;
var CLOUDS_RAINBOW = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];
var cloudsDecoDefs = [{ fx: 0.13, fy: 0.58 }, { fx: 0.46, fy: 0.62 }, { fx: 0.80, fy: 0.58 }]; // tökättävät koristepilvet
var cloudsTapG = -1;       // viimeksi käsitellyn painalluksen aloitusaika (kentällä ei omaa tap-koukkua)
var cloudsRainbow = null;  // yllätys: koristepilvi sataa sateenkaaren (5. tökkäys)

function layoutClouds() {
  var g = groundTop, i, seg;
  platforms = [];
  for (i = 0; i < cloudGround.length; i++) {
    seg = cloudGround[i];
    platforms.push({ kind: 'ground', x: seg[0] * worldW, y: g, w: (seg[1] - seg[0]) * worldW });
  }
  platforms.push({ kind: 'ledge', x: worldW * 0.09, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.30, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.49, y: g - viewH * 0.20, w: worldW * 0.05 });
  platforms.push({ kind: 'ledge', x: worldW * 0.70, y: g - viewH * 0.20, w: worldW * 0.05 });
  // Pomppupilvet
  platforms.push({ kind: 'bounce', x: worldW * 0.27 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  platforms.push({ kind: 'bounce', x: worldW * 0.66 - worldW * 0.02, y: g - viewH * 0.06, w: worldW * 0.04, squish: 0 });
  // Haihtuvat pilvet: seiso hetki, hyppää ajoissa
  cloudPuffs = [
    { kind: 'ledge', fade: true, x: worldW * 0.36 - worldW * 0.02, y: g - viewH * 0.26, w: worldW * 0.04, w0: worldW * 0.04, timer: 0, gone: false, backT: 0 },
    { kind: 'ledge', fade: true, x: worldW * 0.52 - worldW * 0.02, y: g - viewH * 0.26, w: worldW * 0.04, w0: worldW * 0.04, timer: 0, gone: false, backT: 0 },
    { kind: 'ledge', fade: true, x: worldW * 0.735 - worldW * 0.02, y: g - viewH * 0.26, w: worldW * 0.04, w0: worldW * 0.04, timer: 0, gone: false, backT: 0 }
  ];
  for (i = 0; i < cloudPuffs.length; i++) platforms.push(cloudPuffs[i]);
  rainbowGate.x = rainbowGate.fx * worldW;
  cloudsProps();
}

function initClouds() {
  var i;
  layoutClouds();
  tasks = [makeTask(0.30, 'puzzle'), makeTask(0.68, 'mix', { mixLevel: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.48, 0.82]);
  cloudStars = [];
  for (i = 0; i < CSTAR_COUNT; i++) {
    cloudStars.push({ ax: cstarDefs[i].fx * worldW, ay: groundTop - cstarDefs[i].fy * viewH, collected: false, phase: Math.random() * Math.PI * 2 });
  }
  stormlets = [
    { zA: 0.21, zB: 0.37, x: 0.29 * worldW, dir: 1, t: 0, pokeT: 0 },
    { zA: 0.63, zB: 0.80, x: 0.72 * worldW, dir: -1, t: 1, pokeT: 0 }
  ];
  rainbowGate.open = false;
  cloudsTapG = -1;
  cloudsRainbow = null;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(659, 0, 0.2, 'sine', 0.35);
  playNote(988, 0.12, 0.3, 'triangle', 0.35);
}

function respawnClouds() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function respawnCloudsPitEdge() {
  var i, best = 0, x = princess.x;
  for (i = 0; i < cloudGround.length; i++) {
    var end = cloudGround[i][1] * worldW;
    if (end <= x + 1 && end > best) best = end;
  }
  resetPrincess(best > 0 ? best - viewH * 0.09 : checkpoint.x, groundTop);
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffffff');
}

function resizeClouds(ratio) {
  var i;
  princess.x *= ratio;
  layoutClouds();
  for (i = 0; i < cloudStars.length; i++) {
    cloudStars[i].ax = cstarDefs[i].fx * worldW;
    cloudStars[i].ay = groundTop - cstarDefs[i].fy * viewH;
  }
  for (i = 0; i < stormlets.length; i++) stormlets[i].x *= ratio;
}

function collectCloudStar(st) {
  st.collected = true;
  registerCollected(st);
  spawnSparkles(st.ax, st.ay, 14, '#ffe27a');
  playNote(880 + countCollected(cloudStars) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1320 + countCollected(cloudStars) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(cloudStars) === CSTAR_COUNT && !rainbowGate.open) {
    rainbowGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function cloudsFell() {
  spawnSparkles(princess.x, groundTop + viewH * 0.1, 14, '#ffffff');
  playNote(220, 0, 0.25, 'sine', 0.3);
  var heartsBefore = hearts;
  loseHeart();
  if (hearts <= heartsBefore && hearts > 0) respawnCloudsPitEdge();
}

// Tökkäys (pelkkä koriste, juoksu jatkuu sormen mukana): myrskypallo tärisee
// ja salama välähtää, muuten koristeet heilahtavat
function cloudsPoke(wx, wy) {
  var i, sm;
  for (i = 0; i < stormlets.length; i++) {
    sm = stormlets[i];
    if (Math.hypot(wx - sm.x, wy - (groundTop - viewH * 0.035)) < viewH * 0.07) {
      sm.pokeT = 0.8;
      playNote(110, 0, 0.3, 'sawtooth', 0.12);
      playNote(1200, 0.05, 0.05, 'square', 0.06);
      spawnSparkles(sm.x, groundTop - viewH * 0.05, 6, '#fff6a0');
      return;
    }
  }
  propsTap(wx, wy);
}

function updateClouds(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Uusi painallus: kentällä ei ole omaa tap-koukkua, joten tökkäys luetaan pidon alusta
  if (holding && holdStartG !== cloudsTapG) {
    cloudsTapG = holdStartG;
    if (!celebrating && !busy) cloudsPoke(holdSX + camX, holdSY);
  }

  platformerStep(dt, {
    runSp: viewW * 0.22,
    fallY: groundTop + viewH * 0.14,
    onFall: function () { cloudsFell(); },
    onBounce: function (pl) {
      pl.squish = 0.3;
      playNote(523, 0, 0.1, 'sine', 0.3);
      playNote(1047, 0.06, 0.2, 'sine', 0.3);
      spawnSparkles(princess.x, pl.y, 8, '#ffffff');
    }
  });
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce' && platforms[i].squish > 0) platforms[i].squish -= dt;
  }

  // Haihtuvat pilvet
  for (i = 0; i < cloudPuffs.length; i++) {
    var pf = cloudPuffs[i];
    if (pf.gone) {
      pf.backT -= dt;
      if (pf.backT <= 0) { pf.gone = false; pf.w = pf.w0; pf.timer = 0; }
      continue;
    }
    var standing = princess.onGround && princess.x > pf.x + pw * 0.2 && princess.x < pf.x + pf.w - pw * 0.2 && Math.abs(princess.y - pf.y) < 2;
    if (standing && !busy) {
      pf.timer += dt;
      if (pf.timer > PUFF_STAND) {
        pf.gone = true;
        pf.w = 0;
        pf.backT = PUFF_BACK;
        spawnSparkles(pf.x + pf.w0 / 2, pf.y, 10, '#ffffff');
        playNote(330, 0, 0.2, 'sine', 0.2);
      }
    } else {
      pf.timer = Math.max(0, pf.timer - dt * 2);
    }
  }

  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < cloudStars.length; i++) {
    var st = cloudStars[i];
    if (st.collected) continue;
    st.phase += dt * 2;
    var dx = st.ax - princess.x, dy = (st.ay + Math.sin(st.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectCloudStar(st);
  }

  // Myrskypallot vierivät pilvipenkalla: hyppää yli
  for (i = 0; i < stormlets.length; i++) {
    var sm = stormlets[i];
    sm.t += dt;
    if (sm.pokeT > 0) sm.pokeT -= dt;
    if (!busy && !celebrating) {
      sm.x += sm.dir * viewW * 0.07 * dt;
      if (sm.x < sm.zA * worldW) { sm.x = sm.zA * worldW; sm.dir = 1; }
      if (sm.x > sm.zB * worldW) { sm.x = sm.zB * worldW; sm.dir = -1; }
    }
    if (!celebrating && Math.abs(sm.x - princess.x) < viewH * 0.06 && princess.y > groundTop - viewH * 0.07) {
      if (loseHeart()) {
        princess.knockVx = (princess.x < sm.x ? -1 : 1) * viewW * 0.3;
        princess.vy = -viewH * 0.3;
      }
    }
  }

  if (rainbowGate.open && !celebrating && Math.abs(princess.x - rainbowGate.x) < viewH * 0.07) {
    startCelebration();
  }

  if (cloudsRainbow) {
    cloudsRainbow.t += dt;
    if (cloudsRainbow.t > 2.6) cloudsRainbow = null;
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function cloudsLayers() {
  return [
    { speed: 0.22, render: renderCloudsFar },
    { speed: 0.55, render: renderCloudsMid },
    { speed: 1, render: renderCloudsNear }
  ];
}
function renderCloudsBg(b, w, h) {
  renderCloudsFar(b, w, h);
  renderCloudsMid(b, w, h);
  renderCloudsNear(b, w, h);
}
function renderCloudsFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b2f7a');
  sky.addColorStop(0.45, '#8a7bd6');
  sky.addColorStop(0.72, '#ffb6c1');
  sky.addColorStop(1, '#ffe0b3');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#ffffff';
  for (i = 0; i < 70; i++) {
    x = (i * 173.3) % w;
    b.globalAlpha = 0.3 + ((i * 7) % 6) / 10;
    b.beginPath(); b.arc(x, ((i * 97) % Math.round(h * 0.4)), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.5, h * 0.12, h * 0.055, 0.22, '#fff6c8', '#ffffff', '#ffe9a8');
}
function renderCloudsMid(b, w, h) {
  var i;
  for (i = 0; i < 12; i++) drawCloud(b, w * (0.02 + i * 0.085), h * (0.3 + (i % 3) * 0.1), h * 0.025, 0.45);
}
function renderCloudsNear(b, w, h) {
  var i, seg;
  for (i = 0; i < cloudGround.length; i++) {
    seg = cloudGround[i];
    drawCloudBank(b, seg[0] * w, groundTop, (seg[1] - seg[0]) * w, h);
    // Pieniä tupsuja penkan päällä (lähitason elämää)
    drawPuff(b, seg[0] * w + (seg[1] - seg[0]) * w * 0.3, groundTop - h * 0.012, h * 0.05, h * 0.02, 1, false);
    drawPuff(b, seg[0] * w + (seg[1] - seg[0]) * w * 0.72, groundTop - h * 0.01, h * 0.04, h * 0.016, 1, false);
  }
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'ledge' && !platforms[i].fade) drawPuff(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.06, 1, false);
  }
  // Sateenkaariportti piirretään tökättävänä koristeena joka ruudulla (cloudsProps)
}

// Pilvipenkka: reunaviiva laventelinsävyisenä hieman suurempana saman muodon alla
function cloudsBankPath(b, x, y, w, h, n, grow) {
  var i, cx, r;
  b.beginPath();
  b.rect(x - grow, y + h * 0.02, w + grow * 2, h - y);
  for (i = 0; i <= n; i++) {
    cx = x + (i / n) * w;
    r = h * (0.04 + (i % 2) * 0.015) + grow;
    b.moveTo(cx + r, y + h * 0.02);
    b.arc(cx, y + h * 0.02, r, 0, Math.PI * 2);
  }
}
function drawCloudBank(b, x, y, w, h) {
  var n = Math.max(2, Math.round(w / (h * 0.09))), lw = Math.max(1.5, h * 0.004);
  b.fillStyle = '#9aa4d8';
  cloudsBankPath(b, x, y, w, h, n, lw);
  b.fill();
  var g = b.createLinearGradient(0, y - h * 0.03, 0, h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, '#e3d8f5');
  g.addColorStop(1, '#b9c4ee');
  b.fillStyle = g;
  cloudsBankPath(b, x, y, w, h, n, 0);
  b.fill();
}

// Pilvitupsu (taso): kolme kuplaa reunaviivalla, vaalea ylä ja laventeli ala
function cloudsPuffPath(b, x, y, w, hh, grow) {
  b.beginPath();
  b.arc(x + w * 0.25, y + hh * 0.3, hh * 0.55 + grow, 0, Math.PI * 2);
  b.arc(x + w * 0.5, y + hh * 0.15, hh * 0.65 + grow, 0, Math.PI * 2);
  b.arc(x + w * 0.75, y + hh * 0.3, hh * 0.55 + grow, 0, Math.PI * 2);
}
function drawPuff(b, x, y, w, hh, alpha, bouncy) {
  var col = bouncy ? '#ffb3d9' : '#ffffff', line = bouncy ? '#c0609a' : '#9aa4d8', lw = Math.max(ART.lineMin, hh * 0.08);
  b.globalAlpha = alpha;
  artRoundRect(b, x + w * 0.1, y + hh * 0.55, w * 0.8, hh * 0.25, hh * 0.1, bouncy ? '#ff8ec4' : '#cfd6f5', { lineColor: line, line: lw });
  b.fillStyle = line;
  cloudsPuffPath(b, x, y, w, hh, lw);
  b.fill();
  cloudsPuffPath(b, x, y, w, hh, 0);
  artFillPath(b, col, y - hh * 0.5, y + hh * 0.85, hh, { line: false, shadeTo: bouncy ? '#f08ab8' : '#e3d8f5' });
  artHighlight(b, x + w * 0.42, y - hh * 0.22, w * 0.12, hh * 0.1, 0.5);
  b.globalAlpha = 1;
}

// Sateenkaariportti: tumma reunakaari, kuusi värinauhaa ja pilvitupsut jalkoina
function drawRainbowGateFrame(b, x, baseY, h) {
  var i, bw = h * 0.014;
  b.lineCap = 'butt';
  b.strokeStyle = '#6a4a8a';
  b.lineWidth = bw * 6 + Math.max(2, h * 0.005);
  b.beginPath(); b.arc(x, baseY, h * 0.2 - bw * 2.5, Math.PI, 0); b.stroke();
  b.lineWidth = bw;
  for (i = 0; i < CLOUDS_RAINBOW.length; i++) {
    b.strokeStyle = CLOUDS_RAINBOW[i];
    b.beginPath(); b.arc(x, baseY, h * (0.2 - i * 0.014), Math.PI, 0); b.stroke();
  }
  drawPuff(b, x - h * 0.23, baseY - h * 0.03, h * 0.09, h * 0.03, 1, false);
  drawPuff(b, x + h * 0.11, baseY - h * 0.03, h * 0.09, h * 0.03, 1, false);
}

// Tökättävät koristeet: kolme koristepilveä taivaalla ja sateenkaariportti.
// Kutsutaan myös resize-koukusta (layoutClouds).
function cloudsProps() {
  var i, h = viewH;
  propsReset();
  for (i = 0; i < cloudsDecoDefs.length; i++) {
    propAdd({
      x: cloudsDecoDefs[i].fx * worldW, y: groundTop - cloudsDecoDefs[i].fy * h, w: h * 0.16, hh: h * 0.05,
      r: h * 0.07, hy: 0, amp: 0.1, color: '#ffffff', note: 620 + i * 60,
      draw: function (c, p) { drawPuff(c, -p.w / 2, -p.hh * 0.4, p.w, p.hh, 1, false); },
      poke: cloudsDecoPoke
    });
  }
  propAdd({
    x: rainbowGate.x, y: groundTop, r: h * 0.12, hy: h * 0.1, amp: 0.03, color: '#ffe94f', note: 784,
    draw: function (c) { drawRainbowGateFrame(c, 0, 0, h); },
    poke: function (p) {
      var k;
      for (k = 0; k < 6; k++) {
        spawnSparkles(p.x + (k - 2.5) * h * 0.05, p.y - h * 0.16, 2, CLOUDS_RAINBOW[k]);
        playNote(523 * Math.pow(2, k / 6), 0.05 * k, 0.15, 'sine', 0.12);
      }
    }
  });
}

// Koristepilvi pöllähtää: pieni tupsu putoaa; joka viides tökkäys sataa sateenkaaren (yllätys)
function cloudsDecoPoke(p) {
  var k, h = viewH;
  propDrop({
    x: p.x + (Math.random() - 0.5) * p.w * 0.5, y: p.y, vx: (Math.random() - 0.5) * viewW * 0.05, vy: -h * 0.05, ground: groundTop - h * 0.01, life: 1.6,
    draw: function (c) { drawPuff(c, -h * 0.02, -h * 0.01, h * 0.04, h * 0.014, c.globalAlpha, false); }
  });
  if (p.n % 5 === 0 && !cloudsRainbow) {
    cloudsRainbow = { x: p.x, y: p.y, t: 0 };
    for (k = 0; k < 6; k++) propDropBall(p.x + (k - 2.5) * p.w * 0.15, p.y + p.hh * 0.6, h * 0.007, CLOUDS_RAINBOW[k], groundTop - h * 0.005, (k - 2.5) * viewW * 0.01);
    playNote(784, 0, 0.2, 'triangle', 0.25);
    playNote(988, 0.15, 0.2, 'triangle', 0.25);
    playNote(1175, 0.3, 0.4, 'triangle', 0.25);
  }
}

function cloudsDrawRainbow(c) {
  var r = cloudsRainbow;
  if (!r) return;
  var x = r.x - camX, i, h = viewH, a = Math.sin(Math.min(1, r.t / 2.6) * Math.PI);
  if (x < -h * 0.2 || x > viewW + h * 0.2) return;
  c.globalAlpha = Math.max(0, a);
  c.lineWidth = h * 0.009;
  c.lineCap = 'butt';
  for (i = 0; i < CLOUDS_RAINBOW.length; i++) {
    c.strokeStyle = CLOUDS_RAINBOW[i];
    c.beginPath(); c.arc(x, r.y, h * (0.12 - i * 0.009), Math.PI, 0); c.stroke();
  }
  c.globalAlpha = 1;
}

// Myrskypallo: tumma pilvi reunaviivalla, salama, silmät ja vihaiset kulmat.
// Tökättynä tärisee ja salama välähtää (pelkkä koriste, osuma-alue ei muutu).
function drawStormlet(c, sm) {
  var x = sm.x - camX, y = groundTop - viewH * 0.035, r = viewH * 0.035;
  if (x < -r * 3 || x > viewW + r * 3) return;
  var poke = sm.pokeT > 0 ? Math.sin(Math.min(1, sm.pokeT / 0.8) * Math.PI) : 0;
  x += Math.sin(globalT * 40) * poke * r * 0.12;
  artShadow(c, x, groundTop, r * 1.3, r * 0.25, 0.14);
  artUnion(c, cloudPath, x, y, r * 0.5, y - r, y + r * 0.6, '#6a6a8e', { lineColor: '#3a3a56', shadeTo: '#4a4a6a' });
  if (poke > 0) artGlow(c, x, y + r * 0.45, r * 0.9, '#fff6a0', poke * 0.7);
  c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.2); c.lineTo(x + r * 0.15, y + r * 0.2); c.lineTo(x, y + r * 0.7); c.closePath();
  artFillPath(c, poke > 0.3 ? '#ffffff' : '#ffe94f', y + r * 0.2, y + r * 0.7, r * 0.3, { lineColor: '#b08a10' });
  artEye(c, x - r * 0.25, y - r * 0.15, r * 0.14, sm.dir * 0.5, false);
  artEye(c, x + r * 0.25, y - r * 0.15, r * 0.14, sm.dir * 0.5, false);
  c.strokeStyle = '#3a3a56';
  c.lineWidth = Math.max(1.2, r * 0.06);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.42, y - r * 0.42); c.lineTo(x - r * 0.12, y - r * 0.3);
  c.moveTo(x + r * 0.42, y - r * 0.42); c.lineTo(x + r * 0.12, y - r * 0.3);
  c.stroke();
}

function drawRainbowGateGlow(c) {
  var x = rainbowGate.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  if (rainbowGate.open) {
    var g = c.createRadialGradient(x, groundTop - h * 0.08, h * 0.02, x, groundTop - h * 0.08, h * 0.2);
    g.addColorStop(0, 'rgba(255,255,255,' + (0.8 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, groundTop - h * 0.08, h * 0.2, 0, Math.PI * 2); c.fill();
    drawStar(c, x, groundTop - h * 0.27, h * 0.035, globalT, 1);
  }
}

function drawClouds() {
  var i, pf;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  cloudsDrawRainbow(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < platforms.length; i++) {
    if (platforms[i].kind === 'bounce') {
      drawPuff(ctx, platforms[i].x - camX, platforms[i].y + Math.max(0, platforms[i].squish) * viewH * 0.02, platforms[i].w, viewH * 0.06, 1, true);
    }
  }
  for (i = 0; i < cloudPuffs.length; i++) {
    pf = cloudPuffs[i];
    var a = pf.gone ? Math.max(0, 1 - pf.backT / PUFF_BACK) * 0.35 : 1 - (pf.timer / PUFF_STAND) * 0.7;
    drawPuff(ctx, pf.x - camX, pf.y + (pf.gone ? 0 : pf.timer * viewH * 0.02), pf.w0, viewH * 0.06, a, false);
  }
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < cloudStars.length; i++) {
    if (cloudStars[i].collected) continue;
    drawStar(ctx, cloudStars[i].ax - camX, cloudStars[i].ay + Math.sin(cloudStars[i].phase) * viewH * 0.012, viewH * 0.026, cloudStars[i].phase * 0.3, 0.6);
  }
  for (i = 0; i < stormlets.length; i++) drawStormlet(ctx, stormlets[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  drawRainbowGateGlow(ctx);
  if (rainbowGate.open && !celebrating) drawEdgeArrow(ctx, rainbowGate.x);
  endPlayWorld();
  drawPickupHud(ctx, CSTAR_COUNT, function (i2) { return cloudStars[i2] && cloudStars[i2].collected; },
    function (c, x, y, s) { drawStar(c, x, y, s, 0, 0); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
