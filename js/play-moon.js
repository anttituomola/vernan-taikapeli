'use strict';

// Kuun vartija: saaren vartijahuone. Neljä tehtäväporttia peräkkäin, tähdet
// putoavat taivaalta (varoitushehku maassa ennen osumaa) ja kuunkivet kerätään
// kiviltä. Kuun kasvot heräävät tehtävä kerrallaan. Sydämet käytössä.

var MSTONE_COUNT = 6;
var moonStones = [];
var meteors = [];
var meteorT = 2.5;
var moonDoor = { fx: 0.95, x: 0, open: false };
var mstoneDefs = [
  { fx: 0.05, fy: 0.10 }, { fx: 0.145, fy: 0.34 }, { fx: 0.345, fy: 0.34 },
  { fx: 0.545, fy: 0.34 }, { fx: 0.745, fy: 0.34 }, { fx: 0.90, fy: 0.10 }
];
var MOON_MENHIRS = [0.27, 0.47, 0.67];  // tökättävät kuukivipaadet (osuus maailmasta)
var moonTapG = -1;        // viimeksi käsitellyn painalluksen aloitusaika (kentällä ei omaa tap-koukkua)
var moonWinkT = 0;        // kuun kasvot iskevät silmää tökkäyksestä
var moonFacePokes = 0;    // kasvojen tökkäyksiä (joka kolmas lähettää tähdenlennon)
var moonShoot = null;     // yllätys: tähdenlento kuusta (ruutukoordinaatit)
var moonMenhirLitT = 0;   // kaikki paadet hehkuvat (paaden 5. tökkäys)

function layoutMoon() {
  var g = groundTop;
  platforms = [
    { kind: 'ground', x: 0, y: g, w: worldW },
    { kind: 'ledge', x: worldW * 0.12, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.32, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.52, y: g - viewH * 0.20, w: worldW * 0.05 },
    { kind: 'ledge', x: worldW * 0.72, y: g - viewH * 0.20, w: worldW * 0.05 }
  ];
  moonDoor.x = moonDoor.fx * worldW;
  moonProps();
}

function initMoon() {
  var i;
  layoutMoon();
  tasks = [
    makeTask(0.22, 'rhythm'),
    makeTask(0.42, 'shadow'),
    makeTask(0.62, 'minus'),
    makeTask(0.82, 'memory', { seqLen: 5, orbs: 4 })
  ];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.32, 0.52, 0.72]);
  moonStones = [];
  for (i = 0; i < MSTONE_COUNT; i++) {
    moonStones.push({ ax: mstoneDefs[i].fx * worldW, ay: groundTop - mstoneDefs[i].fy * viewH, collected: false, phase: Math.random() * Math.PI * 2 });
  }
  meteors = [];
  meteorT = 2.5;
  moonDoor.open = false;
  moonTapG = -1;
  moonWinkT = 0;
  moonFacePokes = 0;
  moonShoot = null;
  moonMenhirLitT = 0;
  resetPrincess(viewW * 0.08, groundTop);
  checkpoint.x = princess.x;
  checkpoint.y = groundTop;
  renderBackground();
  playNote(262, 0, 0.4, 'sine', 0.3);
  playNote(392, 0.2, 0.4, 'sine', 0.3);
  playNote(523, 0.4, 0.5, 'triangle', 0.3);
}

function respawnMoon() {
  resetPrincess(checkpoint.x, groundTop);
  camX = Math.min(Math.max(princess.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  meteors = [];
  meteorT = 2.5;
  spawnSparkles(princess.x, princess.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeMoon(ratio) {
  var i;
  princess.x *= ratio;
  layoutMoon();
  for (i = 0; i < moonStones.length; i++) {
    moonStones[i].ax = mstoneDefs[i].fx * worldW;
    moonStones[i].ay = groundTop - mstoneDefs[i].fy * viewH;
  }
  for (i = 0; i < meteors.length; i++) meteors[i].x *= ratio;
}

function moonTasksSolved() {
  var i, n = 0;
  for (i = 0; i < tasks.length; i++) if (tasks[i].opened) n++;
  return n;
}

function collectMoonStone(ms) {
  ms.collected = true;
  registerCollected(ms);
  spawnSparkles(ms.ax, ms.ay, 14, '#dfe8ff');
  playNote(700 + countCollected(moonStones) * 60, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(moonStones) * 60, 0.08, 0.3, 'sine', 0.3);
}

// Tökkäys (pelkkä koriste, juoksu jatkuu sormen mukana): kuun kasvot iskevät
// silmää ja joka kolmannella kerralla lähettävät tähdenlennon; muuten paadet
// ja ovi heilahtavat. sx, sy = ruutukoordinaatit
function moonPoke(sx, sy) {
  var fx = moonDoor.x - camX, fy = viewH * 0.30, r = viewH * 0.15;
  if (Math.hypot(sx - fx, sy - fy) < r) {
    moonWinkT = 0.6;
    moonFacePokes++;
    spawnSparkles(moonDoor.x, fy, 6, '#fff6c8');
    playNote(392, 0, 0.15, 'sine', 0.2);
    playNote(587, 0.1, 0.2, 'sine', 0.15);
    if (moonFacePokes % 3 === 0) moonShootStart(fx, fy);
    return;
  }
  propsTap(sx + camX, sy);
}

function updateMoon(dt) {
  var i;
  updateTasks(dt);
  var busy = puzzleBusy();

  // Uusi painallus: kentällä ei ole omaa tap-koukkua, joten tökkäys luetaan pidon alusta
  if (holding && holdStartG !== moonTapG) {
    moonTapG = holdStartG;
    if (!celebrating && !busy) moonPoke(holdSX, holdSY);
  }

  platformerStep(dt, { runSp: viewW * 0.22 });
  updateCheckpoints(princess.x, groundTop);
  followCam(princess.x, dt);

  for (i = 0; i < moonStones.length; i++) {
    var ms = moonStones[i];
    if (ms.collected) continue;
    ms.phase += dt * 2;
    var dx = ms.ax - princess.x, dy = (ms.ay + Math.sin(ms.phase) * viewH * 0.012) - (princess.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.065 * viewH * 0.065) collectMoonStone(ms);
  }

  // Putoavat tähdet: hehku maassa varoittaa, sitten tähti putoaa
  if (!busy && !celebrating && !moonDoor.open) {
    meteorT -= dt;
    if (meteorT <= 0) {
      meteorT = 1.8 + Math.random() * 0.9;
      var mx = princess.x + (Math.random() - 0.5) * viewW * 0.5 + princess.facing * viewW * 0.1;
      mx = Math.min(Math.max(mx, viewH * 0.1), worldW - viewH * 0.1);
      meteors.push({ x: mx, y: -viewH * 0.1, vy: viewH * 0.5, state: 'warn', t: 0.9, hit: false });
    }
  }
  for (i = meteors.length - 1; i >= 0; i--) {
    var m = meteors[i];
    if (busy) continue;
    if (m.state === 'warn') {
      m.t -= dt;
      if (m.t <= 0) { m.state = 'fall'; playNote(1200, 0, 0.3, 'sine', 0.12); }
      continue;
    }
    m.vy += viewH * 1.3 * dt;
    m.y += m.vy * dt;
    var hdx = m.x - princess.x, hdy = m.y - (princess.y - viewH * 0.08);
    if (!m.hit && !celebrating && hdx * hdx + hdy * hdy < viewH * 0.065 * viewH * 0.065) {
      m.hit = true;
      if (loseHeart()) {
        princess.knockVx = (princess.x < m.x ? -1 : 1) * viewW * 0.25;
        spawnSparkles(princess.x, princess.y - viewH * 0.1, 10, '#ffe27a');
      }
    }
    if (m.y >= groundTop) {
      spawnSparkles(m.x, groundTop, 12, '#fff6c8');
      playNote(180, 0, 0.2, 'triangle', 0.2);
      meteors.splice(i, 1);
    }
  }

  if (!moonDoor.open && moonTasksSolved() === tasks.length && countCollected(moonStones) === MSTONE_COUNT) {
    moonDoor.open = true;
    meteors = [];
    playNote(523, 0.2, 0.3, 'triangle', 0.4);
    playNote(659, 0.4, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.3, 'triangle', 0.4);
    playNote(1047, 0.8, 0.6, 'triangle', 0.45);
  }
  if (moonDoor.open && !celebrating && Math.abs(princess.x - moonDoor.x) < viewH * 0.08) {
    startCelebration();
  }

  if (moonWinkT > 0) moonWinkT -= dt;
  if (moonMenhirLitT > 0) moonMenhirLitT -= dt;
  if (moonShoot) {
    moonShoot.t += dt;
    if (moonShoot.t > 1.4) moonShoot = null;
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function moonLayers() {
  return [
    { speed: 0.22, render: renderMoonFar },
    { speed: 0.55, render: renderMoonMid },
    { speed: 1, render: renderMoonNear }
  ];
}
function renderMoonBg(b, w, h) {
  renderMoonFar(b, w, h);
  renderMoonMid(b, w, h);
  renderMoonNear(b, w, h);
}
function renderMoonFar(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05051a');
  sky.addColorStop(0.6, '#141440');
  sky.addColorStop(1, '#2a2860');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#ffffff';
  for (i = 0; i < 160; i++) {
    x = (i * 211.7) % w;
    b.globalAlpha = 0.35 + ((i * 7) % 6) / 10;
    b.beginPath(); b.arc(x, ((i * 83) % Math.round(h * 0.65)), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.22, h * 0.14, h * 0.06, 0.22, '#fff6c8', '#ffffff', '#ffe9a8');
}
function renderMoonMid(b, w, h) {
  var i, x, top;
  // Kaukaiset vuoret taivaan sävyyn hälvennettyinä (vaalea huippu, tumma juuri, ei reunaviivaa)
  for (i = 0; i < 12; i++) {
    x = w * (i / 11);
    top = groundTop - h * (0.16 + (i % 3) * 0.05);
    b.beginPath(); b.moveTo(x - h * 0.2, groundTop); b.lineTo(x, top); b.lineTo(x + h * 0.2, groundTop); b.closePath();
    artFillPath(b, artMix('#1c1b4a', '#2a2860', 0.3), top, groundTop, h * 0.2, { line: false });
  }
}
function renderMoonNear(b, w, h) {
  var i, x;
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#d9dcef');
  ground.addColorStop(0.15, '#a7abcf');
  ground.addColorStop(1, '#5c5f8a');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(60,60,110,0.35)';
  for (i = 0; i < 40; i++) {
    x = (i * 157.9) % w;
    var cy = groundTop + h * 0.04 + ((i * 47) % Math.max(1, Math.round(h - groundTop - h * 0.08)));
    b.beginPath();
    if (b.ellipse) b.ellipse(x, cy, h * (0.015 + (i % 3) * 0.01), h * (0.007 + (i % 3) * 0.004), 0, 0, Math.PI * 2);
    else b.arc(x, cy, h * 0.012, 0, Math.PI * 2);
    b.fill();
  }
  // Pieniä kuukiviä maassa (lähitason elämää)
  for (i = 0; i < 6; i++) artBlob(b, w * (0.04 + i * 0.17) + (i % 2) * h * 0.05, groundTop + h * (0.1 + (i % 3) * 0.04), h * (0.014 + (i % 2) * 0.006), h * 0.009, '#c3c6e6', { lineColor: '#5a5a8a', hi: 0.3 });
  for (i = 1; i < platforms.length; i++) drawMoonRock(b, platforms[i].x, platforms[i].y, platforms[i].w, h * 0.05);
  // Ovi piirretään tökättävänä koristeena joka ruudulla (moonProps)
}

// Kuukivitaso: pyöristetty kivi reunaviivalla ja kraattereilla
function drawMoonRock(b, x, y, w, hh) {
  artRoundRect(b, x, y, w, hh, hh * 0.4, '#b9bde0', { lineColor: '#5a5a8a', shadeTo: '#8f93c0' });
  artBlob(b, x + w * 0.3, y + hh * 0.5, hh * 0.2, hh * 0.14, '#8f93c0', { line: false, flat: true });
  artBlob(b, x + w * 0.7, y + hh * 0.45, hh * 0.15, hh * 0.1, '#8f93c0', { line: false, flat: true });
  artHighlight(b, x + w * 0.15, y + hh * 0.2, w * 0.1, hh * 0.08, 0.4);
}

// Kuun ovi: pylväät ja kaari reunaviivoin
function drawMoonDoorFrame(b, x, baseY, h) {
  var s = h * 0.12, lw = Math.max(1.2, s * 0.05), col = '#8f8fc0', line = '#4a4a7a';
  artShadow(b, x, baseY + s * 0.02, s * 1.1, s * 0.12, 0.2);
  artRoundRect(b, x - s * 0.8, baseY - s * 1.7, s * 0.28, s * 1.7, s * 0.06, col, { lineColor: line, line: lw });
  artRoundRect(b, x + s * 0.52, baseY - s * 1.7, s * 0.28, s * 1.7, s * 0.06, col, { lineColor: line, line: lw });
  b.beginPath(); b.arc(x, baseY - s * 1.7, s * 0.8, Math.PI, 0); b.lineTo(x + s * 0.52, baseY - s * 1.7); b.arc(x, baseY - s * 1.7, s * 0.52, 0, Math.PI, true); b.closePath();
  artFillPath(b, col, baseY - s * 2.5, baseY - s * 1.7, s * 0.8, { lineColor: line, line: lw });
  artHighlight(b, x - s * 0.3, baseY - s * 2.35, s * 0.18, s * 0.06, 0.3);
}

// Kuunkivi (keräiltävä; sama kuva HUD:ssa): hehku, laventeliin varjostettu pallo, kraatteri ja kiilto
function drawMoonStone(c, x, y, s) {
  artGlow(c, x, y, s * 2, '#dfe8ff', 0.4);
  artCircle(c, x, y, s, '#ffffff', { shadeTo: '#c9cdf0', lineColor: '#7a84c0', hi: 0.55 });
  artBlob(c, x + s * 0.3, y + s * 0.2, s * 0.22, s * 0.18, '#aeb6e0', { line: false, flat: true });
}

// Tökättävät koristeet: kolme kuukivipaatta ja ovi. Kutsutaan myös resize-koukusta (layoutMoon).
function moonProps() {
  var i, h = viewH;
  propsReset();
  for (i = 0; i < MOON_MENHIRS.length; i++) {
    propAdd({
      x: MOON_MENHIRS[i] * worldW, y: groundTop + h * 0.01, s: h * 0.07, r: h * 0.07, hy: h * 0.06, amp: 0.05,
      color: '#dfe8ff', note: 330 + i * 110, idx: i,
      draw: moonDrawMenhir,
      poke: moonMenhirPoke
    });
  }
  propAdd({
    x: moonDoor.x, y: groundTop, r: h * 0.11, hy: h * 0.14, amp: 0.02, color: '#fff6c8', note: 660,
    draw: function (c, p) {
      drawMoonDoorFrame(c, 0, 0, h);
      if (p.t >= 0 && p.t < 0.5) artGlow(c, 0, -h * 0.26, h * 0.12, '#fff6c8', 0.6 * (1 - p.t * 2));
    }
  });
}

// Kuukivipaasi (origo = juuri): pysty kivi reunaviivalla, riimu hehkuu tökättäessä
function moonDrawMenhir(c, p) {
  var s = p.s, lit = (p.t >= 0 && p.t < 0.7) || moonMenhirLitT > 0;
  artShadow(c, 0, s * 0.05, s * 0.6, s * 0.12, 0.2);
  artRoundRect(c, -s * 0.3, -s * 1.6, s * 0.6, s * 1.6, s * 0.22, '#b9bde0', { lineColor: '#5a5a8a', shadeTo: '#8f93c0' });
  artBlob(c, s * 0.1, -s * 0.5, s * 0.1, s * 0.07, '#8f93c0', { line: false, flat: true });
  artHighlight(c, -s * 0.12, -s * 1.3, s * 0.06, s * 0.2, 0.4);
  if (lit) artGlow(c, 0, -s * 1.0, s * 0.6, '#dfe8ff', 0.7);
  artCircle(c, 0, -s * 1.0, s * 0.13, lit ? '#ffffff' : '#9aa6dc', { lineColor: '#5a5a8a', hi: lit ? 0.6 : 0.3 });
}

// Paasi humisee ja lähettää renkaan; joka viides tökkäys sytyttää kaikki paadet (yllätys)
function moonMenhirPoke(p) {
  artPop(p.x, p.y - p.s, p.s * 1.4, '#dfe8ff', 'ring');
  playNote(p.note / 2, 0, 0.6, 'sine', 0.18);
  if (p.n % 5 === 0) {
    moonMenhirLitT = 2;
    playNote(330, 0.1, 0.5, 'sine', 0.2);
    playNote(440, 0.3, 0.5, 'sine', 0.2);
    playNote(550, 0.5, 0.8, 'triangle', 0.2);
  }
}

function moonShootStart(sx, sy) {
  if (moonShoot) return;
  moonShoot = { t: 0, x0: sx, y0: sy };
  playNote(1568, 0.1, 0.25, 'sine', 0.12);
  playNote(1047, 0.3, 0.4, 'sine', 0.1);
}

// Tähdenlento kuusta vasemmalle alas (ruutukoordinaatit): häipyvä pyrstö ja hehkuva tähti
function moonDrawShoot(c) {
  var s = moonShoot;
  if (!s) return;
  var k = s.t / 1.4, x = s.x0 - k * viewW * 0.4, y = s.y0 + k * viewH * 0.12, a = Math.sin(Math.min(1, k) * Math.PI), r = viewH * 0.012;
  var g = c.createLinearGradient(x + viewW * 0.12, y - viewH * 0.04, x, y);
  g.addColorStop(0, 'rgba(255,246,200,0)');
  g.addColorStop(1, 'rgba(255,246,200,' + (a * 0.8) + ')');
  c.strokeStyle = g;
  c.lineWidth = r * 0.8;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + viewW * 0.12, y - viewH * 0.04); c.lineTo(x, y); c.stroke();
  artGlow(c, x, y, r * 3, '#fff6c8', a * 0.7);
  c.globalAlpha = a;
  drawStar(c, x, y, r * 1.6, globalT * 3, 0);
  c.globalAlpha = 1;
}

// Kuun kasvot heräävät: 1 = silmä, 2 = molemmat, 3 = hymy, 4 = kruunu ja hehku.
// Tökättynä (moonWinkT) oikea silmä iskee tai nukkuva kuu kurkistaa.
function drawMoonFace(c) {
  var x = moonDoor.x - camX, y = viewH * 0.30, r = viewH * 0.15, n = moonTasksSolved(), wink = moonWinkT > 0;
  if (x < -r * 2 || x > viewW + r * 2) return;
  if (n >= 4) artGlow(c, x, y, r * 2.2, '#fff5c8', 0.5 + Math.sin(globalT * 3) * 0.12);
  artCircle(c, x, y, r, n >= 4 ? '#fff6c8' : '#e9e3c4', { shadeTo: '#d8cfe8', lineColor: '#8a7a5a', hi: 0.3 });
  artBlob(c, x - r * 0.45, y - r * 0.4, r * 0.14, r * 0.12, '#cfc7b0', { line: false, flat: true });
  artBlob(c, x + r * 0.55, y + r * 0.45, r * 0.1, r * 0.08, '#cfc7b0', { line: false, flat: true });
  c.strokeStyle = '#6b5a3a';
  c.lineWidth = Math.max(2, r * 0.06);
  c.lineCap = 'round';
  // Silmät
  var e;
  for (e = -1; e <= 1; e += 2) {
    var ex = x + e * r * 0.35, ey = y - r * 0.12;
    var open = (e < 0 && n >= 1) || (e > 0 && n >= 2);
    if (e > 0 && wink) open = !open; // isku silmää tai kurkistus
    if (open) {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex, ey, r * 0.13, 0, Math.PI * 2); c.fill();
      c.stroke();
      c.fillStyle = '#3a2a5a';
      c.beginPath(); c.arc(ex + r * 0.02, ey + r * 0.02, r * 0.07, 0, Math.PI * 2); c.fill();
      artHighlight(c, ex - r * 0.02, ey - r * 0.03, r * 0.025, r * 0.015, 0.8);
    } else {
      c.beginPath(); c.arc(ex, ey - r * 0.02, r * 0.13, 0.15, Math.PI - 0.15); c.stroke();
    }
  }
  if (n >= 3 || wink) {
    artBlush(c, x - r * 0.55, y + r * 0.1, r * 0.09);
    artBlush(c, x + r * 0.55, y + r * 0.1, r * 0.09);
  }
  // Suu
  c.beginPath();
  if (n >= 3 || wink) c.arc(x, y + r * 0.22, r * 0.3, 0.2, Math.PI - 0.2);
  else { c.moveTo(x - r * 0.2, y + r * 0.35); c.lineTo(x + r * 0.2, y + r * 0.35); }
  c.stroke();
  // Kruunu
  if (n >= 4) {
    c.beginPath();
    c.moveTo(x - r * 0.45, y - r * 0.85); c.lineTo(x - r * 0.45, y - r * 1.2); c.lineTo(x - r * 0.22, y - r * 1.0);
    c.lineTo(x, y - r * 1.3); c.lineTo(x + r * 0.22, y - r * 1.0); c.lineTo(x + r * 0.45, y - r * 1.2); c.lineTo(x + r * 0.45, y - r * 0.85);
    c.closePath();
    artFillPath(c, '#ffd24f', y - r * 1.3, y - r * 0.85, r * 0.45, { lineColor: '#9a7a1a' });
  }
  // Zzz kun nukkuu
  if (n === 0 && !wink) {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.font = Math.round(r * 0.3) + 'px sans-serif';
    c.fillText('z', x + r * 0.8, y - r * 0.7 - Math.sin(globalT * 2) * r * 0.05);
    c.fillText('z', x + r * 1.0, y - r * 0.95 - Math.sin(globalT * 2 + 1) * r * 0.05);
  }
}

function drawMeteor(c, m) {
  var x = m.x - camX;
  if (x < -viewH * 0.2 || x > viewW + viewH * 0.2) return;
  if (m.state === 'warn') {
    var a = 0.35 + Math.sin(globalT * 14) * 0.25;
    c.fillStyle = 'rgba(255,230,120,' + Math.max(0, a) + ')';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, groundTop, viewH * 0.06, viewH * 0.018, 0, 0, Math.PI * 2);
    else c.arc(x, groundTop, viewH * 0.04, 0, Math.PI * 2);
    c.fill();
    return;
  }
  c.strokeStyle = 'rgba(255,240,180,0.5)';
  c.lineWidth = Math.max(2, viewH * 0.01);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, m.y - viewH * 0.16); c.lineTo(x, m.y - viewH * 0.03); c.stroke();
  drawStar(c, x, m.y, viewH * 0.03, globalT * 4, 0.9);
}

function drawMoonDoorGlow(c) {
  var x = moonDoor.x - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  c.fillStyle = moonDoor.open ? 'rgba(255,245,200,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')' : 'rgba(10,10,40,0.85)';
  c.beginPath(); c.arc(x, groundTop - s * 1.7, s * 0.52, Math.PI, 0); c.lineTo(x + s * 0.52, groundTop); c.lineTo(x - s * 0.52, groundTop); c.closePath(); c.fill();
  if (moonDoor.open) drawStar(c, x, groundTop - s * 2.9, h * 0.035, globalT, 1);
}

function drawMoon() {
  var i;
  if (!beginPlayWorld()) return;
  drawMoonFace(ctx);
  moonDrawShoot(ctx);
  propsDraw(ctx);
  drawMoonDoorGlow(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  for (i = 0; i < moonStones.length; i++) {
    if (moonStones[i].collected) continue;
    drawMoonStone(ctx, moonStones[i].ax - camX, moonStones[i].ay + Math.sin(moonStones[i].phase) * viewH * 0.012, viewH * 0.024);
  }
  for (i = 0; i < meteors.length; i++) if (meteors[i].state === 'warn') drawMeteor(ctx, meteors[i]);
  var moving = Math.abs(princess.vx) > 12 && princess.onGround;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawPrincessFree(ctx, princess.x - camX, princess.y, viewH / 520, princess.facing, princess.walkPhase, moving, globalT);
  ctx.globalAlpha = 1;
  for (i = 0; i < meteors.length; i++) if (meteors[i].state === 'fall') drawMeteor(ctx, meteors[i]);
  drawParticlesLayer(ctx);
  if (moonDoor.open && !celebrating) drawEdgeArrow(ctx, moonDoor.x);
  endPlayWorld();
  drawPickupHud(ctx, MSTONE_COUNT, function (i2) { return moonStones[i2] && moonStones[i2].collected; },
    function (c, x, y, s) { drawMoonStone(c, x, y, s * 0.8); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
