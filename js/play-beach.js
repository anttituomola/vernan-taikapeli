'use strict';

// Rannikko: ratsastus rannalla. Simpukat napataan sormella, ravut saksivat
// polulla ja aallot huuhtovat polun alaosan varoituksen jälkeen. Sydämet käytössä.

var SHELL_COUNT = 8;
var shells = [];
var crabs = [];
var wave = { state: 'idle', t: 6, hit: false };
var lighthouse = { fx: 0.96, x: 0, open: false };
var shellDefs = [
  { fx: 0.08, fy: 0.16 }, { fx: 0.17, fy: 0.24 }, { fx: 0.26, fy: 0.14 }, { fx: 0.40, fy: 0.22 },
  { fx: 0.49, fy: 0.12 }, { fx: 0.61, fy: 0.26 }, { fx: 0.72, fy: 0.16 }, { fx: 0.86, fy: 0.22 }
];
var SHELL_COLORS = ['#ffd6e8', '#ffe9b8', '#e4d2ff', '#d2f4ff'];
var beachParrot = null;   // yllätys: papukaija, joka pyrähtää palmusta lentoon
var beachBeamT = 0;       // majakan valokeilan pyyhkäisy (s jäljellä)

function pathMidY() {
  return (groundTop + groundBottom) / 2;
}

function initBeach() {
  var i;
  tasks = [makeTask(0.30, 'shadow'), makeTask(0.55, 'math'), makeTask(0.78, 'pairs', { pairs: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.72]);
  shells = [];
  for (i = 0; i < SHELL_COUNT; i++) {
    shells.push({
      ax: shellDefs[i].fx * worldW, ay: groundTop - shellDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: SHELL_COLORS[i % SHELL_COLORS.length]
    });
  }
  crabs = [
    { zA: 0.12, zB: 0.24, x: 0.18 * worldW, y: groundTop + viewH * 0.06, dir: 1, t: 0, pokeT: 0 },
    { zA: 0.44, zB: 0.60, x: 0.50 * worldW, y: groundTop + viewH * 0.15, dir: -1, t: 1, pokeT: 0 },
    { zA: 0.80, zB: 0.92, x: 0.86 * worldW, y: groundTop + viewH * 0.10, dir: 1, t: 2, pokeT: 0 }
  ];
  wave.state = 'idle';
  wave.t = 5;
  wave.hit = false;
  lighthouse.x = lighthouse.fx * worldW;
  lighthouse.open = false;
  beachParrot = null;
  beachBeamT = 0;
  beachProps();
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = pathMidY() - viewH * 0.04;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnBeach() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = pathMidY() - viewH * 0.04;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeBeach(ratio) {
  var i;
  for (i = 0; i < shells.length; i++) {
    shells[i].ax = shellDefs[i].fx * worldW;
    shells[i].ay = groundTop - shellDefs[i].fy * viewH;
  }
  for (i = 0; i < crabs.length; i++) crabs[i].x *= ratio;
  lighthouse.x = lighthouse.fx * worldW;
  beachProps();
}

function collectShell(sh) {
  sh.collected = true;
  registerCollected(sh);
  spawnSparkles(sh.ax, sh.ay, 14, sh.color);
  playNote(700 + countCollected(shells) * 55, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(shells) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(shells) === SHELL_COUNT && !lighthouse.open) {
    lighthouse.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleBeachTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < shells.length; i++) {
    var sh = shells[i];
    if (sh.collected) continue;
    dx = wx - sh.ax;
    dy = wy - (sh.ay + Math.sin(sh.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectShell(sh);
      return;
    }
  }
  // Rapu nostaa saksensa tökkäyksestä (pelkkä koriste); koristeet heilahtavat,
  // ja napautus kävelyttää silti kuten ennen
  for (i = 0; i < crabs.length; i++) {
    if (Math.hypot(wx - crabs[i].x, wy - crabs[i].y) < viewH * 0.06) {
      crabs[i].pokeT = 0.9;
      playNote(880, 0, 0.06, 'square', 0.1);
      playNote(1175, 0.07, 0.08, 'square', 0.1);
      spawnSparkles(crabs[i].x, crabs[i].y - viewH * 0.03, 5, '#ffb08a');
      break;
    }
  }
  propsTap(wx, wy);
  setWalkTarget(px, py);
}

function updateBeach(dt) {
  var i, dx, dy, dist, step;
  updateTasks(dt);
  var busy = puzzleBusy();

  dx = unicorn.tx - unicorn.x;
  dy = unicorn.ty - unicorn.y;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !busy) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 10;
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#fff3c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);
  updateCheckpoints(unicorn.x, unicorn.y);

  for (i = 0; i < shells.length; i++) shells[i].phase += dt * 2;

  // Ravut saksivat polulla edestakaisin
  for (i = 0; i < crabs.length; i++) {
    var cr = crabs[i];
    cr.t += dt * 8;
    if (cr.pokeT > 0) cr.pokeT -= dt;
    if (!busy && !celebrating) {
      cr.x += cr.dir * viewW * 0.06 * dt;
      if (cr.x < cr.zA * worldW) { cr.x = cr.zA * worldW; cr.dir = 1; }
      if (cr.x > cr.zB * worldW) { cr.x = cr.zB * worldW; cr.dir = -1; }
    }
    if (!celebrating && Math.abs(cr.x - unicorn.x) < viewH * 0.06 && Math.abs(cr.y - unicorn.y) < viewH * 0.07) {
      if (loseHeart()) {
        var push = unicorn.x < cr.x ? -1 : 1;
        unicorn.tx = Math.min(Math.max(unicorn.x + push * viewW * 0.08, viewW * 0.05), worldW - viewW * 0.03);
        unicorn.ty = unicorn.y;
        spawnSparkles(unicorn.x, unicorn.y - viewH * 0.08, 10, '#ff9d5c');
      }
    }
  }

  // Aallot: varoitus (vaahto rannassa) -> huuhtelu polun alaosaan
  if (!busy && !celebrating) {
    wave.t -= dt;
    if (wave.state === 'idle' && wave.t <= 0) {
      wave.state = 'warn';
      wave.t = 1.3;
      playNote(110, 0, 0.6, 'sine', 0.2);
    } else if (wave.state === 'warn' && wave.t <= 0) {
      wave.state = 'wash';
      wave.t = 0.9;
      wave.hit = false;
      playNote(160, 0, 0.5, 'sawtooth', 0.12);
      playNote(240, 0.1, 0.5, 'sine', 0.15);
    } else if (wave.state === 'wash') {
      if (!wave.hit && unicorn.y > pathMidY()) {
        wave.hit = true;
        if (loseHeart()) {
          unicorn.tx = unicorn.x;
          unicorn.ty = pathMidY() - viewH * 0.05;
          spawnSparkles(unicorn.x, unicorn.y, 12, '#c9f0ff');
        }
      }
      if (wave.t <= 0) {
        wave.state = 'idle';
        wave.t = 6 + Math.random() * 3;
      }
    }
  }

  if (lighthouse.open && !celebrating && Math.abs(unicorn.x - lighthouse.x) < viewH * 0.09) {
    startCelebration();
  }

  if (beachBeamT > 0) beachBeamT -= dt;
  beachUpdateParrot(dt);
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function beachLayers() {
  return [
    { speed: 0.22, render: renderBeachFar },
    { speed: 0.55, render: renderBeachMid },
    { speed: 1, render: renderBeachNear }
  ];
}
function renderBeachBg(b, w, h) {
  renderBeachFar(b, w, h);
  renderBeachMid(b, w, h);
  renderBeachNear(b, w, h);
}
function renderBeachFar(b, w, h) {
  var i, x, horizon = h * 0.5;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#5ec4ff');
  sky.addColorStop(0.55, '#c8ecff');
  sky.addColorStop(1, '#ffe9c4');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.8, h * 0.18, h * 0.07, 0.22, '#fff4c8', '#fffdf0', '#ffd45a');
  for (i = 0; i < 8; i++) {
    x = w * (0.03 + i * 0.125);
    if (Math.abs(x - w * 0.8) < h * 0.2) continue;
    drawCloud(b, x, h * (0.1 + (i % 3) * 0.08), h * 0.03, 0.85);
  }
}
function renderBeachMid(b, w, h) {
  var horizon = h * 0.5, i, x;
  var sea = b.createLinearGradient(0, horizon, 0, groundTop);
  sea.addColorStop(0, '#7ad4e8');
  sea.addColorStop(1, '#2aa0c0');
  b.fillStyle = sea;
  b.fillRect(0, horizon, w, h - horizon);
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = 2;
  b.lineCap = 'round';
  for (i = 0; i < 40; i++) {
    x = (i * 173.1) % w;
    var wy = horizon + h * 0.03 + ((i * 61) % Math.max(1, (groundTop - horizon - h * 0.06)));
    b.beginPath(); b.moveTo(x, wy); b.quadraticCurveTo(x + h * 0.03, wy - h * 0.008, x + h * 0.06, wy); b.stroke();
  }
}
function renderBeachNear(b, w, h) {
  var i, x;
  var sand = b.createLinearGradient(0, groundTop - h * 0.02, 0, h);
  sand.addColorStop(0, '#fff0c9');
  sand.addColorStop(0.3, '#f3dfae');
  sand.addColorStop(1, '#e2c68d');
  b.fillStyle = sand;
  b.beginPath();
  b.moveTo(0, groundTop - h * 0.02);
  for (x = 0; x <= w; x += 14) b.lineTo(x, groundTop - h * 0.02 + Math.sin(x * 0.008) * 6);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = 'rgba(0,0,0,0.06)';
  for (i = 0; i < 90; i++) {
    x = (i * 97.7) % w;
    b.beginPath(); b.arc(x, groundTop + h * 0.03 + ((i * 37) % Math.max(1, (h - groundTop - h * 0.05))), h * 0.004, 0, Math.PI * 2); b.fill();
  }
  for (i = 0; i < 7; i++) {
    if (i % 2 === 1) continue; // palmut 1, 3 ja 5 ovat tökättäviä koristeita (beachProps)
    x = w * (0.06 + i * 0.14) + (i % 2) * h * 0.05;
    drawPalm(b, x, groundTop - h * 0.02, h * 0.26);
  }
}

// Palmu: runko renkaineen, lehvät soikioina (vaalea ylä, tumma ala) ja
// kookokset. Sama piirto taustalle ja tökättäville koristeille (origo = juuri).
function drawPalm(b, x, baseY, s) {
  var i, a, ex, ey, topX = x + s * 0.08, topY = baseY - s;
  artShadow(b, x, baseY + s * 0.02, s * 0.4, s * 0.08, 0.14);
  artLimb(b, x, baseY, topX, topY, s * 0.09, '#a8763e', '#6a4a28');
  b.strokeStyle = 'rgba(90,55,25,0.4)';
  b.lineWidth = Math.max(1, s * 0.02);
  b.lineCap = 'round';
  for (i = 1; i < 5; i++) {
    b.beginPath();
    b.moveTo(x + (topX - x) * i * 0.2 - s * 0.045, baseY - s * 0.2 * i);
    b.lineTo(x + (topX - x) * i * 0.2 + s * 0.045, baseY - s * 0.2 * i);
    b.stroke();
  }
  for (i = 0; i < 7; i++) {
    a = -Math.PI * 0.05 + i * Math.PI * 0.18;
    ex = Math.cos(a) * s * 0.75;
    ey = Math.sin(a) * s * 0.4 + s * 0.2;
    artBlob(b, topX + ex * 0.5, topY + ey * 0.5, Math.sqrt(ex * ex + ey * ey) * 0.5, s * 0.075, i % 2 ? '#3f9a44' : '#4fb050', { rot: Math.atan2(ey, ex), lineColor: '#2a6a2e' });
  }
  artCircle(b, x + s * 0.06, baseY - s * 0.98, s * 0.06, '#8a5a30', { lineColor: '#4a2e14', hi: 0.3 });
  artCircle(b, x + s * 0.13, baseY - s * 0.95, s * 0.06, '#8a5a30', { lineColor: '#4a2e14', hi: 0.3 });
}

// Tökättävät koristeet: joka toinen palmu (1, 3, 5) ja majakka piirretään
// joka ruudulla taustan sijaan, jotta ne heilahtavat napautuksesta.
// Paikat ovat samat kuin taustan palmuilla; kutsutaan myös resize-koukusta.
function beachProps() {
  var i, h = viewH;
  propsReset();
  for (i = 1; i < 7; i += 2) {
    propAdd({
      x: worldW * (0.06 + i * 0.14) + (i % 2) * h * 0.05, y: groundTop - h * 0.02, s: h * 0.26,
      r: h * 0.12, hy: h * 0.26 * 0.95, amp: 0.07, color: '#6fd66f', note: 520 + i * 40,
      draw: function (c, p) { drawPalm(c, 0, 0, p.s); },
      poke: beachPalmPoke
    });
  }
  propAdd({
    x: lighthouse.x, y: groundTop - h * 0.02, r: h * 0.09, hy: h * 0.37, amp: 0.04, color: '#ffe27a', note: 740,
    draw: beachDrawLighthouse,
    poke: function (p) {
      // Lamppu välähtää aina; joka kolmas tökkäys pyyhkäisee valokeilan taivaan yli
      if (p.n % 3 === 0) {
        beachBeamT = 1.6;
        playNote(196, 0, 0.5, 'triangle', 0.2);
        playNote(262, 0.2, 0.5, 'triangle', 0.15);
      }
    }
  });
}

// Palmusta putoaa kookos; joka viides tökkäys herättää papukaijan (yllätys)
function beachPalmPoke(p) {
  var cx = p.x + p.s * 0.1, cy = p.y - p.s * 0.95;
  if (p.n % 5 === 0 && !beachParrot) {
    beachParrot = { x: cx, y: cy, vx: viewW * 0.16, vy: -viewH * 0.1, t: 0, flap: 0 };
    playNote(1320, 0, 0.1, 'square', 0.1);
    playNote(1760, 0.12, 0.1, 'square', 0.1);
    playNote(1320, 0.24, 0.18, 'square', 0.1);
    return;
  }
  propDropBall(cx + (Math.random() - 0.5) * p.s * 0.2, cy, p.s * 0.06, '#8a5a30', p.y + p.s * 0.03);
}

function beachUpdateParrot(dt) {
  var b = beachParrot;
  if (!b) return;
  b.t += dt;
  b.flap += dt * 16;
  b.x += b.vx * dt;
  b.vy -= viewH * 0.04 * dt;
  b.y += b.vy * dt;
  if (b.t > 4 || b.y < -viewH * 0.1 || b.x - camX > viewW + viewH * 0.2) beachParrot = null;
}

function beachDrawParrot(c) {
  var b = beachParrot;
  if (!b) return;
  var x = b.x - camX, y = b.y + Math.sin(b.flap) * viewH * 0.004, s = viewH * 0.022, flap = Math.sin(b.flap);
  if (x < -s * 4 || x > viewW + s * 4) return;
  // Pyrstö, vartalo, siipi, pää, nokka ja silmä
  artBlob(c, x - s * 1.4, y + s * 0.2, s * 0.8, s * 0.22, '#3f9a44', { rot: 0.35, lineColor: '#1f5a24' });
  artBlob(c, x, y, s, s * 0.6, '#ff5f4a', { lineColor: '#8a2a1a', hi: 0.25 });
  c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.1); c.lineTo(x + s * 0.2, y - s * 1.0 - flap * s * 0.6); c.lineTo(x + s * 0.8, y + s * 0.1); c.closePath();
  artFillPath(c, '#3f7fd0', y - s * 1.6, y + s * 0.1, s * 0.4, { lineColor: '#1a3a7a' });
  artCircle(c, x + s * 0.95, y - s * 0.45, s * 0.45, '#ff5f4a', { lineColor: '#8a2a1a' });
  c.fillStyle = '#ffb347';
  c.beginPath(); c.moveTo(x + s * 1.3, y - s * 0.55); c.lineTo(x + s * 1.85, y - s * 0.35); c.lineTo(x + s * 1.3, y - s * 0.15); c.closePath(); c.fill();
  artEye(c, x + s * 1.02, y - s * 0.55, s * 0.13, 0.5, false);
}

// Majakka (tökättävä koriste, origo = juuri): raidallinen torni, ovi,
// parveke, lamppuhuone ja katto. Lamppu välähtää tökkäyksestä.
function beachDrawLighthouse(c, p) {
  var h = viewH, tw = h * 0.07, th = h * 0.32, i, lw = Math.max(1.2, h * 0.004);
  var flash = p.t >= 0 && p.t < 0.5, lit = lighthouse.open || flash;
  artShadow(c, 0, 0, tw * 1.3, tw * 0.28, 0.16);
  c.save();
  roundRect(c, -tw / 2, -th, tw, th, tw * 0.18);
  c.clip();
  for (i = 0; i < 4; i++) {
    c.beginPath(); c.rect(-tw / 2, -th + i * th / 4, tw, th / 4);
    artFillPath(c, i % 2 ? '#ff5f7e' : '#ffffff', -th + i * th / 4, -th + (i + 1) * th / 4, tw / 2, i % 2 ? { line: false } : { line: false, shadeTo: '#e3d8f5' });
  }
  c.restore();
  roundRect(c, -tw / 2, -th, tw, th, tw * 0.18);
  c.strokeStyle = '#7a3a4e';
  c.lineWidth = lw;
  c.stroke();
  artRoundRect(c, -tw * 0.18, -tw * 0.6, tw * 0.36, tw * 0.6, tw * 0.15, '#5a4a6e', { lineColor: '#3a3346', line: lw });
  artRoundRect(c, -tw * 0.65, -th - h * 0.06, tw * 1.3, h * 0.06, h * 0.012, '#5a4a6e', { lineColor: '#3a3346', line: lw });
  artRoundRect(c, -tw * 0.42, -th - h * 0.05, tw * 0.84, h * 0.04, h * 0.008, lit ? '#ffe27a' : '#8a7aa8', { lineColor: '#3a3346', line: lw });
  if (flash) artGlow(c, 0, -th - h * 0.03, h * 0.08, '#fff2a8', 0.6);
  c.beginPath(); c.moveTo(-tw * 0.75, -th - h * 0.06); c.lineTo(tw * 0.75, -th - h * 0.06); c.lineTo(0, -th - h * 0.12); c.closePath();
  artFillPath(c, '#4a4060', -th - h * 0.12, -th - h * 0.06, tw * 0.5, { lineColor: '#2a2436', line: lw });
}

function drawShell(c, x, y, s, color) {
  var i, line = artShade(color, -0.4);
  artGlow(c, x, y, s * 1.6, color, 0.35);
  c.beginPath();
  c.moveTo(x - s * 0.8, y);
  c.arc(x, y, s * 0.8, Math.PI, 0);
  c.lineTo(x, y + s * 0.75);
  c.closePath();
  artFillPath(c, color, y - s * 0.8, y + s * 0.75, s * 0.8, { lineColor: line });
  c.strokeStyle = artRGBA(line, 0.55);
  c.lineWidth = Math.max(1, s * 0.07);
  c.lineCap = 'round';
  for (i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(x, y + s * 0.7); c.lineTo(x + i * s * 0.32, y - s * 0.5 + Math.abs(i) * s * 0.12); c.stroke();
  }
  artHighlight(c, x - s * 0.3, y - s * 0.35, s * 0.2, s * 0.1, 0.5);
}

function drawCrab(c, cr) {
  var x = cr.x - camX, y = cr.y, s = viewH * 0.03;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var i, lift, body = '#ff6a3d', leg = '#d9502a', line = '#9a3418';
  // Tökättynä rapu nousee varpailleen, nostaa sakset ja naksuttaa niitä
  var poke = cr.pokeT > 0 ? Math.sin(Math.min(1, cr.pokeT / 0.9) * Math.PI) : 0;
  var clawY = -s * 0.5 - poke * s * 0.7, snap = poke * Math.sin(globalT * 30) * s * 0.08;
  var blink = Math.sin(cr.t * 0.3) > 0.97;
  artShadow(c, x, y + s * 0.8, s * 1.5, s * 0.3, 0.16);
  c.save();
  c.translate(x, y - poke * s * 0.3);
  for (i = -1; i <= 1; i++) {
    lift = Math.sin(cr.t + i) * s * 0.15;
    artLimb(c, -s * 0.6, s * 0.1, -s * 1.3, s * 0.6 + i * s * 0.25 + lift, s * 0.16, leg, line);
    artLimb(c, s * 0.6, s * 0.1, s * 1.3, s * 0.6 + i * s * 0.25 - lift, s * 0.16, leg, line);
  }
  artLimb(c, -s * 0.8, -s * 0.1, -s * 1.25, clawY, s * 0.2, leg, line);
  artLimb(c, s * 0.8, -s * 0.1, s * 1.25, clawY, s * 0.2, leg, line);
  artCircle(c, -s * 1.25 - snap, clawY, s * 0.34, body, { lineColor: line, hi: 0.3 });
  artCircle(c, s * 1.25 + snap, clawY, s * 0.34, body, { lineColor: line, hi: 0.3 });
  artBlob(c, 0, 0, s * 1.05, s * 0.7, body, { lineColor: line, hi: 0.3 });
  artLimb(c, -s * 0.3, -s * 0.45, -s * 0.3, -s * 0.75, s * 0.1, leg, line);
  artLimb(c, s * 0.3, -s * 0.45, s * 0.3, -s * 0.75, s * 0.1, leg, line);
  artEye(c, -s * 0.3, -s * 0.78, s * 0.2, cr.dir * 0.5, blink);
  artEye(c, s * 0.3, -s * 0.78, s * 0.2, cr.dir * 0.5, blink);
  c.strokeStyle = line;
  c.lineWidth = Math.max(1, s * 0.08);
  c.lineCap = 'round';
  c.beginPath(); c.arc(0, s * 0.02, s * 0.28, 0.4, Math.PI - 0.4); c.stroke();
  c.restore();
}

function drawWaveOverlay(c) {
  var mid = pathMidY();
  if (wave.state === 'warn') {
    var a = 0.4 + Math.sin(globalT * 14) * 0.3;
    c.fillStyle = 'rgba(255,255,255,' + Math.max(0, a) + ')';
    c.fillRect(0, groundBottom - viewH * 0.02, viewW, viewH * 0.03);
    c.fillStyle = 'rgba(120,200,240,0.25)';
    c.fillRect(0, groundBottom - viewH * 0.06, viewW, viewH * 0.1);
  } else if (wave.state === 'wash') {
    var p = wave.t / 0.9;
    var top = mid + (groundBottom - mid) * (1 - Math.sin(p * Math.PI)) * 0.4;
    var g = c.createLinearGradient(0, top, 0, viewH);
    g.addColorStop(0, 'rgba(210,240,255,0.9)');
    g.addColorStop(0.2, 'rgba(90,190,230,0.65)');
    g.addColorStop(1, 'rgba(40,140,190,0.55)');
    c.fillStyle = g;
    c.fillRect(0, top, viewW, viewH - top);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    var i;
    for (i = 0; i < 14; i++) {
      c.beginPath(); c.arc((i / 14) * viewW + Math.sin(globalT * 6 + i) * 10, top, viewH * 0.012, 0, Math.PI * 2); c.fill();
    }
  }
}

function drawLighthouseGlow(c) {
  var x = lighthouse.x - camX, h = viewH;
  if (x < -h * 0.7 || x > viewW + h * 0.7) return;
  var ly = groundTop - h * 0.02 - h * 0.32 - h * 0.03, k, ang, len;
  if (beachBeamT > 0) {
    // Valokeila pyyhkäisee vasemmalta oikealle (joka kolmas tökkäys majakkaan)
    k = 1 - beachBeamT / 1.6;
    ang = Math.PI * 1.1 + k * Math.PI * 0.8;
    len = h * 0.7;
    c.fillStyle = 'rgba(255,240,160,' + Math.max(0, 0.3 * Math.sin(k * Math.PI)) + ')';
    c.beginPath();
    c.moveTo(x, ly);
    c.lineTo(x + Math.cos(ang - 0.12) * len, ly + Math.sin(ang - 0.12) * len);
    c.lineTo(x + Math.cos(ang + 0.12) * len, ly + Math.sin(ang + 0.12) * len);
    c.closePath();
    c.fill();
  }
  if (lighthouse.open) {
    artGlow(c, x, ly, h * 0.18, '#fff0a0', 0.9 + Math.sin(globalT * 5) * 0.1);
    drawStar(c, x, ly - h * 0.1, h * 0.035, globalT, 1);
  }
}

function drawBeach() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  drawLighthouseGlow(ctx);
  for (i = 0; i < shells.length; i++) {
    if (shells[i].collected) continue;
    var sy = shells[i].ay + Math.sin(shells[i].phase) * viewH * 0.012;
    drawShell(ctx, shells[i].ax - camX, sy, viewH * 0.03, shells[i].color);
  }
  for (i = 0; i < crabs.length; i++) drawCrab(ctx, crabs[i]);
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  beachDrawParrot(ctx);
  drawWaveOverlay(ctx);
  drawParticlesLayer(ctx);
  if (lighthouse.open && !celebrating) drawEdgeArrow(ctx, lighthouse.x);
  endPlayWorld();
  drawPickupHud(ctx, SHELL_COUNT, function (i2) { return shells[i2] && shells[i2].collected; },
    function (c, x, y, s) { drawShell(c, x, y, s, '#ffd6e8'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
