'use strict';

// Tähtisana: kiireetön ratsastus kuutamossa. Kirjaintähdet kerätään sormella
// tai ohitse ratsastaen. Portti hehkuu, kun tähdet on koossa.
// Tehtävät: lue sana ja kuva→sana.

var MW_COUNT = 8;
var MW_LETTERS = ['A', 'I', 'O', 'U', 'E', 'S', 'K', 'M'];
var mwStars = [];
var mwGate = { fx: 0.95, x: 0, ready: false };
var mwDefs = [
  { fx: 0.08, fy: 0.20 }, { fx: 0.17, fy: 0.28 }, { fx: 0.26, fy: 0.16 }, { fx: 0.38, fy: 0.25 },
  { fx: 0.49, fy: 0.15 }, { fx: 0.61, fy: 0.27 }, { fx: 0.72, fy: 0.18 }, { fx: 0.85, fy: 0.24 }
];
var MW_SKY = '#3b3f8c';         // taivaan alareuna: kaukaiset kuuset sävytetään tähän
var MW_PINE_IDX = [1, 4];       // lähirivistön (6 kuusta) tökättävät kuuset
var mwShoot = null;             // yllätys: tähdenlento (kuusen 5. tökkäys tai harvoin itsestään)

function mwPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function initMoonword() {
  var i;
  tasks = [makeTask(0.32, 'word', { maxSyl: 3 }), makeTask(0.66, 'wordpick', { maxSyl: 2 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  mwStars = [];
  for (i = 0; i < MW_COUNT; i++) {
    mwStars.push({
      ax: mwDefs[i].fx * worldW, ay: groundTop - mwDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2,
      ch: MW_LETTERS[i]
    });
  }
  mwGate.x = mwGate.fx * worldW;
  mwGate.ready = false;
  mwShoot = null;
  mwProps();
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = mwPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  renderBackground();
  playNote(494, 0, 0.28, 'sine', 0.32);
  playNote(659, 0.14, 0.32, 'triangle', 0.3);
}

function respawnMoonword() {}

function resizeMoonword(ratio) {
  var i;
  for (i = 0; i < mwStars.length; i++) {
    mwStars[i].ax = mwDefs[i].fx * worldW;
    mwStars[i].ay = groundTop - mwDefs[i].fy * viewH;
  }
  mwGate.x = mwGate.fx * worldW;
  mwProps();
}

function collectMoonword(it) {
  it.collected = true;
  spawnSparkles(it.ax, it.ay, 14, '#ffe27a');
  playNote(700 + countCollected(mwStars) * 50, 0, 0.25, 'sine', 0.4);
  playNote(1050 + countCollected(mwStars) * 50, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(mwStars) === MW_COUNT && !mwGate.ready) {
    mwGate.ready = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleMoonwordTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < mwStars.length; i++) {
    var it = mwStars[i];
    if (it.collected) continue;
    dx = wx - it.ax;
    dy = wy - (it.ay + Math.sin(it.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectMoonword(it);
      return;
    }
  }
  // Koristeet heilahtavat (pelkkä koriste); ratsastus jatkuu napautuskohtaan kuten ennen
  propsTap(wx, wy);
  setWalkTarget(px, py);
}

function updateMoonword(dt) {
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
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#c8d4ff');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  for (i = 0; i < mwStars.length; i++) {
    var it = mwStars[i];
    it.phase += dt * 2;
    if (!it.collected && !busy && !celebrating) {
      dx = it.ax - unicorn.x;
      dy = it.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectMoonword(it);
    }
  }

  if (mwGate.ready && !celebrating && Math.abs(unicorn.x - mwGate.x) < viewW * 0.08) {
    startCelebration();
  }

  // Tähdenlento: harvoin itsestään (keskimäärin minuutin välein), muuten kuusen tökkäyksestä
  if (mwShoot) {
    mwShoot.t += dt;
    if (mwShoot.t > 1.4) mwShoot = null;
  } else if (!busy && Math.random() < dt / 60) {
    mwShootStart();
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

function moonwordLayers() {
  return [
    { speed: 0.22, render: renderMoonwordFar },
    { speed: 0.55, render: renderMoonwordMid },
    { speed: 1, render: renderMoonwordNear }
  ];
}
function renderMoonwordBg(b, w, h) {
  renderMoonwordFar(b, w, h);
  renderMoonwordMid(b, w, h);
  renderMoonwordNear(b, w, h);
}
function renderMoonwordFar(b, w, h) {
  var horizon = h * 0.68, i, x;
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(0.55, '#1a2460');
  sky.addColorStop(1, '#3b3f8c');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 22; i++) {
    x = w * ((i * 0.13 + 0.04) % 1);
    drawStar(b, x, h * (0.06 + (i % 6) * 0.06), h * (0.006 + (i % 3) * 0.004), i * 0.7, 0.5);
  }
  // Kuu: hehku, laventeliin varjostettu kiekko ja pari kraatteria (kaukainen: ei reunaviivaa)
  artGlow(b, w * 0.16, h * 0.14, h * 0.11, '#fff6c8', 0.35);
  artCircle(b, w * 0.16, h * 0.14, h * 0.05, '#fff6c8', { line: false, shadeTo: '#e3d8f5' });
  artCircle(b, w * 0.16 + h * 0.015, h * 0.14 + h * 0.012, h * 0.009, '#e9e0f0', { line: false, flat: true });
  artCircle(b, w * 0.16 - h * 0.018, h * 0.14 - h * 0.01, h * 0.006, '#e9e0f0', { line: false, flat: true });
  fillHillBand(b, w, h, horizon, '#243868', function (px) {
    return horizon - h * 0.09 - Math.sin(px * 0.002 + 0.4) * h * 0.05;
  });
}
function renderMoonwordMid(b, w, h) {
  var i, x;
  meadowMid(b, w, h, '#2a3a68');
  // Kaukaiset kuuset taivaan sävyyn hälvennettyinä, ilman reunaviivaa
  for (i = 0; i < 8; i++) {
    x = w * (0.05 + i * 0.12);
    drawPine(b, x, groundTop - h * 0.02, h * (0.16 + (i % 3) * 0.04), artMix(i % 2 ? '#16204a' : '#1a2a58', MW_SKY, 0.3), true);
  }
}
function renderMoonwordNear(b, w, h) {
  var i, x;
  var path = b.createLinearGradient(0, groundTop, 0, h);
  path.addColorStop(0, '#31507a');
  path.addColorStop(1, '#2a4468');
  b.fillStyle = path;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(180,210,255,0.18)';
  b.fillRect(0, groundTop + h * 0.02, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  for (i = 0; i < 6; i++) {
    if (MW_PINE_IDX.indexOf(i) >= 0) continue; // tökättävät kuuset piirretään joka ruudulla (mwProps)
    x = w * (0.08 + i * 0.16);
    drawPine(b, x, groundTop - h * 0.01, h * 0.16, i % 2 ? '#1a2a58' : '#243868');
  }
  // Polun reunan kiviä (lähitason elämää)
  for (i = 0; i < 5; i++) artBlob(b, w * (0.03 + i * 0.21), groundBottom + h * (0.025 + (i % 2) * 0.015), h * (0.014 + (i % 3) * 0.004), h * 0.009, '#4a5a8a', { lineColor: '#1e2648', hi: 0.25 });
  // Portti piirretään tökättävänä koristeena joka ruudulla (mwProps)
}

// Portti: pylväät ja kaari reunaviivoin, kirjain reunustettuna. lit = kirjain hehkuu
function mwDrawGate(b, x, baseY, s, lit, ch) {
  var lw = Math.max(1.2, s * 0.05), col = '#5a5488', line = '#2a2446';
  artShadow(b, x, baseY + s * 0.02, s, s * 0.12, 0.2);
  artRoundRect(b, x - s * 0.75, baseY - s * 1.6, s * 0.25, s * 1.6, s * 0.06, col, { lineColor: line, line: lw });
  artRoundRect(b, x + s * 0.5, baseY - s * 1.6, s * 0.25, s * 1.6, s * 0.06, col, { lineColor: line, line: lw });
  b.beginPath();
  b.arc(x, baseY - s * 1.6, s * 0.75, Math.PI, 0);
  b.lineTo(x + s * 0.5, baseY - s * 1.6);
  b.arc(x, baseY - s * 1.6, s * 0.5, 0, Math.PI, true);
  b.closePath();
  artFillPath(b, col, baseY - s * 2.35, baseY - s * 1.6, s * 0.75, { lineColor: line, line: lw });
  if (lit) artGlow(b, x, baseY - s * 0.7, s * 0.6, '#ffe27a', 0.6);
  b.fillStyle = '#ffe27a';
  b.strokeStyle = '#7a5a10';
  b.lineWidth = Math.max(1, s * 0.04);
  b.lineJoin = 'round';
  b.font = 'bold ' + Math.round(s * 0.45) + 'px ' + UI_FONT;
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  b.strokeText(ch || 'A', x, baseY - s * 0.7);
  b.fillText(ch || 'A', x, baseY - s * 0.7);
}

// Tökättävät koristeet: kaksi lähikuusta, kirjainkivi ja portti. Kutsutaan myös resize-koukusta.
function mwProps() {
  var i, idx, h = viewH;
  propsReset();
  for (i = 0; i < MW_PINE_IDX.length; i++) {
    idx = MW_PINE_IDX[i];
    propAdd({
      x: worldW * (0.08 + idx * 0.16), y: groundTop - h * 0.01, s: h * 0.16, pine: idx % 2 ? '#1a2a58' : '#243868',
      r: h * 0.07, hy: h * 0.09, amp: 0.06, color: '#c8d4ff', note: 420 + idx * 40,
      draw: function (c, p) { drawPine(c, 0, 0, p.s, p.pine); },
      poke: mwPinePoke
    });
  }
  propAdd({
    x: worldW * 0.55, y: groundBottom + h * 0.035, s: h * 0.035, r: h * 0.055, hy: h * 0.02, amp: 0.12,
    color: '#ffe27a', note: 660, ch: 'A',
    draw: mwDrawLetterStone,
    poke: function (p) {
      // Kivi näyttää seuraavan kirjaimen ja helähtää sen sävelellä
      p.ch = MW_LETTERS[p.n % MW_LETTERS.length];
      playNote(523 * Math.pow(2, (p.n % 8) / 8), 0.08, 0.3, 'triangle', 0.15);
    }
  });
  propAdd({
    x: mwGate.x, y: groundTop, s: h * 0.12, r: h * 0.1, hy: h * 0.12, amp: 0.03, color: '#ffe27a', note: 740,
    draw: function (c, p) { mwDrawGate(c, 0, 0, p.s, mwGate.ready || (p.t >= 0 && p.t < 0.6), 'A'); }
  });
}

// Kirjainkivi (origo = juuri): pyöreä kivi, jonka pinnassa hehkuva kirjain
function mwDrawLetterStone(c, p) {
  var s = p.s, lit = p.t >= 0 && p.t < 0.6;
  artShadow(c, 0, s * 0.05, s * 1.1, s * 0.18, 0.2);
  artBlob(c, 0, -s * 0.5, s, s * 0.55, '#5a6a9a', { lineColor: '#262e50', hi: 0.3 });
  if (lit) artGlow(c, 0, -s * 0.5, s * 0.9, '#ffe27a', 0.6);
  c.fillStyle = '#ffe27a';
  c.strokeStyle = '#7a5a10';
  c.lineWidth = Math.max(1, s * 0.05);
  c.lineJoin = 'round';
  c.font = 'bold ' + Math.round(s * 0.7) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.strokeText(p.ch, 0, -s * 0.48);
  c.fillText(p.ch, 0, -s * 0.48);
}

// Kuusesta putoaa käpy; joka viides tökkäys lähettää tähdenlennon (yllätys)
function mwPinePoke(p) {
  propDropBall(p.x + (Math.random() - 0.5) * p.s * 0.4, p.y - p.s * 0.5, p.s * 0.045, '#6b4a2a', p.y + viewH * 0.02);
  if (p.n % 5 === 0) mwShootStart();
}

function mwShootStart() {
  if (mwShoot) return;
  mwShoot = { t: 0, x0: viewW * (0.15 + Math.random() * 0.5), y0: viewH * (0.04 + Math.random() * 0.08) };
  playNote(1568, 0, 0.25, 'sine', 0.12);
  playNote(1047, 0.2, 0.4, 'sine', 0.1);
}

// Tähdenlento (ruutukoordinaatit): hehkuva pää ja häipyvä pyrstö
function mwDrawShoot(c) {
  var s = mwShoot;
  if (!s) return;
  var k = s.t / 1.4, x = s.x0 + k * viewW * 0.35, y = s.y0 + k * viewH * 0.2, a = Math.sin(Math.min(1, k) * Math.PI), r = viewH * 0.01;
  var g = c.createLinearGradient(x - viewW * 0.12, y - viewH * 0.07, x, y);
  g.addColorStop(0, 'rgba(255,246,200,0)');
  g.addColorStop(1, 'rgba(255,246,200,' + (a * 0.8) + ')');
  c.strokeStyle = g;
  c.lineWidth = r * 0.8;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - viewW * 0.12, y - viewH * 0.07); c.lineTo(x, y); c.stroke();
  artGlow(c, x, y, r * 3, '#fff6c8', a * 0.7);
  artCircle(c, x, y, r, '#ffffff', { line: false, shadeTo: '#ffe9a8', alpha: a });
}

function mwDrawLetterStar(c, x, y, s, ch) {
  drawStar(c, x, y, s, globalT * 0.4, 0.85);
  c.fillStyle = '#3a2460';
  c.font = 'bold ' + Math.round(s * 0.85) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, x, y + s * 0.08);
}

function drawMoonword() {
  var i;
  if (!beginPlayWorld()) return;
  mwDrawShoot(ctx);
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  if (mwGate.ready) {
    var bx = mwGate.x - camX;
    var g = ctx.createRadialGradient(bx, groundTop - viewH * 0.12, viewH * 0.01, bx, groundTop - viewH * 0.12, viewH * 0.16);
    g.addColorStop(0, 'rgba(255,230,140,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, groundTop - viewH * 0.12, viewH * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  for (i = 0; i < mwStars.length; i++) {
    if (mwStars[i].collected) continue;
    var sy = mwStars[i].ay + Math.sin(mwStars[i].phase) * viewH * 0.012;
    mwDrawLetterStar(ctx, mwStars[i].ax - camX, sy, viewH * 0.032, mwStars[i].ch);
  }
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, viewH / 800 * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  drawParticlesLayer(ctx);
  if (mwGate.ready && !celebrating) drawEdgeArrow(ctx, mwGate.x);
  endPlayWorld();
  drawPickupHud(ctx, MW_COUNT, function (i2) { return mwStars[i2] && mwStars[i2].collected; },
    function (c, x, y, s) { mwDrawLetterStar(c, x, y, s, 'A'); });
  drawTaskOverlay(ctx);
}
