'use strict';

// Sateenkaarisilta: ruutu vierii itsestään. Lennä renkaiden läpi, väistä
// ukkospilviä. Ohi mennyt rengas vie sydämen ja ilmestyy uudelleen edemmäs.
// Sydämet ja lyhdyt käytössä; sydänten loputtua palataan lyhdylle.

var RING_COUNT = 8;
var rings = [];
var thunder = [];
var bridgeScroll = 0;
var BRIDGE_SEGMENT_SPEEDS = [0.13, 0.16, 0.19];

var ringDefs = [
  { fx: 0.10, fy: 0.40 }, { fx: 0.20, fy: 0.22 }, { fx: 0.30, fy: 0.50 }, { fx: 0.42, fy: 0.30 },
  { fx: 0.56, fy: 0.46 }, { fx: 0.66, fy: 0.20 }, { fx: 0.78, fy: 0.42 }, { fx: 0.88, fy: 0.28 }
];

// ---------- Tökättävät koristeet ----------
// Paikat murto-osina pilvilattian tasolla; bridgePropSync laskee paikan joka
// ruudulla. p.s = piirtokoko, p.sp = koristeen oma ajastin (haukotus, hehku).
// bridgeShootT: tähdenlento (yllätys), sekunteja jäljellä.
var bridgeShootT = 0;
function bridgePropSync(p, dt) {
  p.x = p.fx * worldW;
  p.y = groundTop + p.dy * viewH;
  p.s = p.fs * viewH;
  p.r = p.s * 2.2;
  p.hy = p.kind === 'puff' ? p.s * 0.3 : p.s * 1.0;
  if (p.sp > 0) p.sp -= dt;
}

// Uninen pilvitupsu: laventelivarjo, kiinni olevat silmät ja haukotteleva suu (yawn 0..1)
function bridgeDrawPuff(c, s, yawn) {
  artUnion(c, cloudPath, 0, 0, s, -s * 1.4, s * 1.1, '#ffffff', { shadeTo: '#e3d8f5', lineColor: '#b9a8d8' });
  artEye(c, -s * 0.4, -s * 0.1, s * 0.16, 0, true);
  artEye(c, s * 0.4, -s * 0.1, s * 0.16, 0, true);
  if (yawn > 0) {
    artBlob(c, 0, s * 0.4, s * 0.18 + yawn * s * 0.1, s * 0.1 + yawn * s * 0.3, '#6a4a7a', { line: false });
  } else {
    c.strokeStyle = '#6a4a7a';
    c.lineWidth = Math.max(1.2, s * 0.08);
    c.lineCap = 'round';
    c.beginPath(); c.arc(0, s * 0.3, s * 0.2, 0.3, Math.PI - 0.3); c.stroke();
  }
  artBlush(c, -s * 0.75, s * 0.2, s * 0.14);
  artBlush(c, s * 0.75, s * 0.2, s * 0.14);
}

// Tähtilyhty: naru ylhäältä, hehku ja keinuva tähti (lit 0..1 kirkastaa)
function bridgeDrawStarLantern(c, s, lit) {
  var sway = Math.sin(globalT * 1.6) * 0.15;
  artLimb(c, 0, -s * 3.2, 0, -s * 1.9, s * 0.06, '#e3d8f5', '#8a7aa8');
  artGlow(c, 0, -s * 1.0, s * (2.0 + lit * 1.4), '#ffe678', 0.3 + lit * 0.4);
  drawStar(c, 0, -s * 1.0, s * 0.9, sway, 0.4 + lit * 0.6);
  artLimb(c, 0, -s * 0.15, 0, s * 0.4, s * 0.1, '#ff5f7e', '#8a2a3e');
}

function bridgePropsSetup() {
  var i, defs = [
    { kind: 'puff', fx: 0.25, fs: 0.028, color: '#ffffff', note: 440 },
    { kind: 'star', fx: 0.40, fs: 0.03, color: '#ffe678', note: 988 },
    { kind: 'star', fx: 0.72, fs: 0.03, color: '#ffe678', note: 1047 },
    { kind: 'puff', fx: 0.93, fs: 0.03, color: '#ffffff', note: 392 }
  ];
  propsReset();
  for (i = 0; i < defs.length; i++) {
    defs[i].sp = 0;
    defs[i].update = bridgePropSync;
    if (defs[i].kind === 'puff') {
      defs[i].dy = 0.03;
      defs[i].draw = function (c, p) { bridgeDrawPuff(c, p.s, p.sp > 0 ? Math.sin(Math.min(1, p.sp / 1.2) * Math.PI) : 0); };
      defs[i].poke = function (p) {
        // Haukotus ja pöllähdys
        p.sp = 1.2;
        spawnSparkles(p.x, p.y - p.s * 0.5, 8, '#ffffff');
      };
    } else {
      defs[i].dy = -0.02;
      defs[i].draw = function (c, p) { bridgeDrawStarLantern(c, p.s, p.sp > 0 ? Math.min(1, p.sp) : 0); };
      defs[i].poke = bridgeStarPoke;
    }
    bridgePropSync(propAdd(defs[i]), 0);
  }
}

// Tähtilyhty helisee; joka viides tökkäys lähettää tähdenlennon taivaan yli (yllätys)
function bridgeStarPoke(p) {
  p.sp = 1.5;
  playNote(1319, 0.1, 0.25, 'sine', 0.18);
  playNote(1760, 0.22, 0.3, 'sine', 0.14);
  if (p.n % 5 === 0 && bridgeShootT <= 0) {
    bridgeShootT = 1.6;
    playNote(2093, 0.4, 0.5, 'sine', 0.15);
    playNote(2637, 0.5, 0.7, 'sine', 0.1);
  }
}

// Tähdenlento: kaari ruudun yläosan poikki, perässä häipyvä vana
function bridgeDrawShootingStar(c) {
  if (bridgeShootT <= 0) return;
  var k = 1 - bridgeShootT / 1.6, x = viewW * (0.05 + k * 0.9), y = viewH * (0.1 + k * 0.18), s = viewH * 0.02;
  var a = Math.sin(k * Math.PI);
  c.globalAlpha = a;
  artLimb(c, x - s * 7, y - s * 1.4, x, y, s * 0.5, '#fff6c8', false);
  drawStar(c, x, y, s, k * 6, 1);
  c.globalAlpha = 1;
}

function initBridge() {
  var i;
  tasks = [makeTask(0.48, 'compare')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.34, 0.68]);
  rings = [];
  for (i = 0; i < RING_COUNT; i++) {
    rings.push({
      ax: ringDefs[i].fx * worldW, ay: groundTop - ringDefs[i].fy * viewH,
      collected: false, returned: false, phase: Math.random() * Math.PI * 2,
      color: maneColors[i % maneColors.length],
      onRestore: function (r) { r.ax = r.homeX; r.ay = r.homeY; }
    });
    rings[i].homeX = rings[i].ax;
    rings[i].homeY = rings[i].ay;
  }
  thunder = [];
  var tFx = [0.16, 0.36, 0.52, 0.62, 0.74, 0.84];
  for (i = 0; i < tFx.length; i++) {
    thunder.push({ fx: tFx[i], x: tFx[i] * worldW, baseY: viewH * (0.3 + (i % 3) * 0.12), y: 0, amp: viewH * (0.08 + (i % 2) * 0.08), t: i * 1.3, f: 1.2 + (i % 3) * 0.3, pokeT: 0 });
  }
  bridgePropsSetup();
  bridgeShootT = 0;
  princess.x = viewW * 0.25;
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
  playNote(523, 0, 0.2, 'sine', 0.35);
  playNote(659, 0.1, 0.2, 'sine', 0.35);
  playNote(784, 0.2, 0.3, 'triangle', 0.35);
}

function respawnBridge() {
  var i;
  camX = Math.min(Math.max(checkpoint.x - viewW * 0.25, 0), Math.max(0, worldW - viewW));
  princess.x = checkpoint.x;
  princess.y = groundTop - viewH * 0.25;
  princess.vx = 0;
  princess.vy = 0;
  // Lyhdyn jälkeiset renkaat takaisin kotipaikoilleen
  for (i = 0; i < rings.length; i++) {
    if (rings[i].homeX > checkpoint.x - viewW * 0.1 && !rings[i].collected) {
      rings[i].ax = rings[i].homeX;
      rings[i].ay = rings[i].homeY;
      rings[i].returned = false;
    }
  }
  spawnSparkles(princess.x, princess.y, 14, '#ffe27a');
}

function resizeBridge(ratio) {
  var i;
  princess.x *= ratio;
  princess.y = Math.min(princess.y, groundTop);
  for (i = 0; i < rings.length; i++) {
    rings[i].ax *= ratio;
    rings[i].homeX = ringDefs[i].fx * worldW;
    rings[i].homeY = groundTop - ringDefs[i].fy * viewH;
    rings[i].ay = groundTop - ringDefs[i].fy * viewH;
  }
  for (i = 0; i < thunder.length; i++) thunder[i].x = thunder[i].fx * worldW;
}

function bridgeSpeed() {
  var seg = camX / Math.max(1, worldW);
  var idx = seg < 0.34 ? 0 : (seg < 0.68 ? 1 : 2);
  return viewW * BRIDGE_SEGMENT_SPEEDS[idx];
}

function collectRing(r) {
  r.collected = true;
  registerCollected(r);
  spawnSparkles(r.ax, r.ay, 16, r.color);
  playNote(660 + countCollected(rings) * 55, 0, 0.25, 'sine', 0.4);
  playNote(990 + countCollected(rings) * 55, 0.08, 0.3, 'triangle', 0.3);
}

function missRing(r) {
  loseHeart();
  spawnSparkles(r.ax, r.ay, 8, '#c9c9e0');
  // Rengas leijuu edemmäs uuteen paikkaan, jotta kentän voi yhä läpäistä.
  // Prinsessa pääsee vain 70 %:iin ruudusta, joten lopussa rengas pysyy sen sisällä.
  var ahead = camX + viewW * (1.1 + Math.random() * 0.2);
  r.ax = Math.min(ahead, worldW - viewW * 0.5);
  r.ay = groundTop - viewH * (0.18 + Math.random() * 0.34);
  r.returned = true;
  playNote(520, 0, 0.1, 'sine', 0.25);
  playNote(780, 0.07, 0.12, 'sine', 0.22);
  playNote(1040, 0.14, 0.16, 'sine', 0.2);
}

function handleBridgeTap(px, py) {
  // Ohjaus on pito + siivenisku; napautus vain tökkää koristeita (ei pelivaikutusta):
  // ukkospilvi jyrähtää, muuten koriste heilahtaa
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i;
  for (i = 0; i < thunder.length; i++) {
    if (Math.hypot(wx - thunder[i].x, py - thunder[i].y) < viewH * 0.08) {
      thunder[i].pokeT = 0.8;
      playNote(80, 0, 0.4, 'sawtooth', 0.15);
      playNote(110, 0.1, 0.3, 'square', 0.08);
      spawnSparkles(thunder[i].x, thunder[i].y + viewH * 0.04, 6, '#ffe94f');
      return;
    }
  }
  propsTap(wx, py);
}

function updateBridge(dt) {
  var i, pw = viewH * 0.045;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Vieritys: pysähtyy tehtäväkaaren eteen ja maailman lopussa
  var scrolling = !busy && !celebrating;
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x - princess.x < viewW * 0.3 && tasks[i].x > princess.x - viewW * 0.05) scrolling = false;
  }
  var maxCam = Math.max(0, worldW - viewW);
  if (scrolling && camX < maxCam) {
    camX = Math.min(maxCam, camX + bridgeSpeed() * dt);
  }

  // Lento (kuten taivaalla)
  if (!celebrating && holding && !busy) {
    var tx = holdWorldX, ty = lastPY;
    princess.vx += ((tx - princess.x) > 0 ? 1 : -1) * viewW * 0.6 * dt;
    princess.vy += ((ty - princess.y) > 0 ? 1 : -1) * viewH * 0.75 * dt;
    if (tx > princess.x + 8) princess.facing = 1;
    else if (tx < princess.x - 8) princess.facing = -1;
  } else {
    princess.vx *= Math.max(0, 1 - dt * 1.8);
    princess.vy += viewH * 0.35 * dt;
  }
  if (princess.vx > viewW * 0.3) princess.vx = viewW * 0.3;
  if (princess.vx < -viewW * 0.3) princess.vx = -viewW * 0.3;
  if (princess.vy > viewH * 0.55) princess.vy = viewH * 0.55;
  if (princess.vy < -viewH * 0.7) princess.vy = -viewH * 0.7;
  if (!busy) {
    princess.x += princess.vx * dt;
    princess.y += princess.vy * dt;
  }
  // Ruudun sisällä: vieritys työntää mukanaan
  princess.x = Math.min(Math.max(princess.x, camX + viewW * 0.08), camX + viewW * 0.7);
  princess.x = Math.min(Math.max(princess.x, pw), worldW - pw);
  princess.y = Math.min(Math.max(princess.y, viewH * 0.12), groundTop);
  blockPrincessAtTasks();
  princess.walkPhase += dt * 6;
  updateCheckpoints(princess.x, princess.y);

  // Renkaat
  var endZone = camX >= maxCam - 2;
  for (i = 0; i < rings.length; i++) {
    var r = rings[i];
    if (r.collected) continue;
    r.phase += dt * 2;
    var ry = r.ay + Math.sin(r.phase) * viewH * 0.01;
    var rr = viewH * 0.075;
    var dx = princess.x - r.ax, dy = princess.y - viewH * 0.06 - ry;
    if (Math.abs(dx) < rr * 0.6 && Math.abs(dy) < rr * 1.0) {
      collectRing(r);
      continue;
    }
    if (endZone) {
      // Lopussa jäljellä olevat renkaat leijuvat näkyville
      if (r.ax < camX + viewW * 0.12 || r.ax > camX + viewW * 0.6) {
        r.ax = camX + viewW * (0.2 + Math.random() * 0.35);
        spawnSparkles(r.ax, r.ay, 6, r.color);
      }
    } else if (r.ax < camX + viewW * 0.02 && !busy) {
      missRing(r);
    }
  }

  propsUpdate(dt);
  if (bridgeShootT > 0) bridgeShootT -= dt;

  // Ukkospilvet
  for (i = 0; i < thunder.length; i++) {
    var th = thunder[i];
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

  if (Math.random() < dt * 8) spawnSparkles(princess.x - princess.facing * 20, princess.y - viewH * 0.02, 1, '#ffd6ff');

  if (!celebrating && countCollected(rings) === RING_COUNT && princess.x > worldW * 0.9) {
    startCelebration();
  }

  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function bridgeLayers() {
  return [
    { speed: 0.22, render: renderBridgeFar },
    { speed: 0.55, render: renderBridgeMid },
    { speed: 1, render: renderBridgeNear }
  ];
}
function renderBridgeBg(b, w, h) {
  renderBridgeFar(b, w, h);
  renderBridgeMid(b, w, h);
  renderBridgeNear(b, w, h);
}
function renderBridgeFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b1450');
  sky.addColorStop(0.6, '#4a2f8a');
  sky.addColorStop(1, '#8a5cc8');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  var moonX = w * 0.2, moonY = h * 0.16, moonR = h * 0.06;
  bgSun = { x: moonX, y: moonY, r: moonR, speed: 0.22 };
  artGlow(b, moonX, moonY, moonR * 3.2, '#fff4c8', 0.5);
  var mg = b.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
  mg.addColorStop(0, '#ffffff');
  mg.addColorStop(1, '#ffe9a8');
  b.fillStyle = mg;
  b.beginPath(); b.arc(moonX, moonY, moonR, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 80; i++) {
    x = (i * 173.3) % w;
    if (Math.abs(x - moonX) < moonR * 2) continue;
    b.globalAlpha = 0.3 + (i % 5) * 0.12;
    b.beginPath(); b.arc(x, (i * 97.1) % (h * 0.55), 1.4 + (i % 3), 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
}
function renderBridgeMid(b, w, h) {
  var i, x, band = h * 0.018;
  b.lineWidth = band;
  b.lineCap = 'round';
  for (i = 0; i < maneColors.length; i++) {
    b.strokeStyle = maneColors[i];
    b.globalAlpha = 0.22;
    b.beginPath();
    for (x = 0; x <= w; x += 16) {
      var y = h * 0.72 + Math.sin(x * 0.0025) * h * 0.05 + i * band;
      if (x === 0) b.moveTo(x, y); else b.lineTo(x, y);
    }
    b.stroke();
  }
  b.globalAlpha = 1;
}
function renderBridgeNear(b, w, h) {
  var i, x, band = h * 0.022;
  b.lineWidth = band;
  b.lineCap = 'round';
  for (i = 0; i < maneColors.length; i++) {
    b.strokeStyle = maneColors[i];
    b.globalAlpha = 0.7;
    b.beginPath();
    for (x = 0; x <= w; x += 16) {
      var y = h * 0.78 + Math.sin(x * 0.0025) * h * 0.06 + i * band;
      if (x === 0) b.moveTo(x, y); else b.lineTo(x, y);
    }
    b.stroke();
  }
  b.globalAlpha = 1;
  for (i = 0; i < 12; i++) {
    drawCloud(b, w * (0.04 + i * 0.085), h * (0.86 + (i % 2) * 0.06), h * 0.04, 0.9);
  }
  drawCastle(b, w * 0.95, h * 0.78, h * 0.26);
}

function drawRing(c, r) {
  var x = r.ax - camX, y = r.ay + Math.sin(r.phase) * viewH * 0.01;
  var rr = viewH * 0.075;
  if (x < -rr * 2 || x > viewW + rr * 2) return;
  // Rengas: tumma reunaviiva, väri ja valkoinen kiiltojuova
  c.save();
  artGlow(c, x, y, rr * 1.3, r.color, 0.25);
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rr * 0.45, rr, 0, 0, Math.PI * 2);
  else c.arc(x, y, rr * 0.7, 0, Math.PI * 2);
  c.strokeStyle = artShade(r.color, -0.45);
  c.lineWidth = viewH * 0.014 + Math.max(2.4, viewH * 0.005);
  c.stroke();
  c.strokeStyle = r.color;
  c.lineWidth = viewH * 0.014;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = viewH * 0.005;
  c.stroke();
  c.restore();
}

function drawThunderCloud(c, th) {
  var x = th.x - camX, y = th.y, s = viewH * 0.035;
  if (x < -s * 6 || x > viewW + s * 6) return;
  // Tökättynä pilvi jyrähtää: vaalenee hetkeksi ja salama välähtää
  var poke = th.pokeT > 0;
  artUnion(c, cloudPath, x, y, s, y - s * 1.4, y + s * 1.1, poke ? '#7a7f98' : '#5a5f78', { lineColor: '#2e3250', shadeTo: '#3a3e58' });
  artHighlight(c, x - s * 0.6, y - s * 0.6, s * 0.6, s * 0.25, 0.2);
  if (poke || Math.sin(th.t * 9) > 0.6) {
    c.beginPath();
    c.moveTo(x, y + s * 1.0);
    c.lineTo(x - s * 0.3, y + s * 1.7);
    c.lineTo(x + s * 0.05, y + s * 1.7);
    c.lineTo(x - s * 0.2, y + s * 2.3);
    c.lineTo(x + s * 0.4, y + s * 1.5);
    c.lineTo(x + s * 0.05, y + s * 1.5);
    c.lineTo(x + s * 0.3, y + s * 1.0);
    c.closePath();
    artFillPath(c, '#ffe94f', y + s * 1.0, y + s * 2.3, s * 0.4, { lineColor: '#c89a10' });
  }
}

// Sateenkaarihelmi (HUD): kolme kaarta tummalla reunaviivalla
function drawRainbowGem(c, x, y, s) {
  var i, lw = Math.max(2, s * 0.28);
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(x, y + s * 0.3, s * (1 - i * 0.28), Math.PI, 0);
    c.strokeStyle = artShade(maneColors[i * 2], -0.45);
    c.lineWidth = lw + Math.max(1.6, s * 0.08);
    c.stroke();
    c.strokeStyle = maneColors[i * 2];
    c.lineWidth = lw;
    c.stroke();
  }
}

function drawSkyLantern(c, cp) {
  var x = cp.x - camX, y = viewH * 0.5, s = viewH * 0.04;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (cp.lit) artGlow(c, x, y, s * 2.2, '#ffe68c', 0.7);
  artRoundRect(c, x - s * 0.5, y - s * 0.8, s, s * 1.6, s * 0.3, cp.lit ? '#ffe27a' : '#cfc4e8', { lineColor: '#5a4a6e', alpha: cp.lit ? 1 : 0.55 });
  artRoundRect(c, x - s * 0.6, y - s * 0.95, s * 1.2, s * 0.18, s * 0.06, '#7a6a8e', { lineColor: '#3a3346' });
  artRoundRect(c, x - s * 0.6, y + s * 0.78, s * 1.2, s * 0.18, s * 0.06, '#7a6a8e', { lineColor: '#3a3346' });
  if (cp.lit) artHighlight(c, x - s * 0.2, y - s * 0.4, s * 0.12, s * 0.3, 0.4);
}

function drawBridge() {
  var i;
  if (!beginPlayWorld()) return;
  bridgeDrawShootingStar(ctx);
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawSkyLantern(ctx, checkpoints[i]);
  for (i = 0; i < rings.length; i++) {
    if (!rings[i].collected) drawRing(ctx, rings[i]);
  }
  for (i = 0; i < thunder.length; i++) drawThunderCloud(ctx, thunder[i]);
  if (!celebrating) {
    for (i = 0; i < rings.length; i++) {
      if (rings[i].returned && !rings[i].collected) { drawEdgeArrow(ctx, rings[i].ax); break; }
    }
  }
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, true, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, RING_COUNT, function (i2) { return rings[i2] && rings[i2].collected; }, drawRainbowGem);
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
