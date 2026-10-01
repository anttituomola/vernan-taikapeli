'use strict';

// Tikkumetsä: ratsastus karkkimaisemassa. Tikkarit kerätään sormella tai
// ohitse ratsastaen, salmiakkipyörät vierivät polulla ja vievät sydämen.
// Karkkiportti aukeaa, kun kaikki tikkarit on kerätty. Sydämet käytössä.

var LOLLY_COUNT = 8;
var lollies = [];
var lollyWheels = [];
var lollyGate = { fx: 0.96, x: 0, open: false };
var lollyDefs = [
  { fx: 0.08, fy: 0.18 }, { fx: 0.16, fy: 0.26 }, { fx: 0.25, fy: 0.15 }, { fx: 0.39, fy: 0.24 },
  { fx: 0.50, fy: 0.14 }, { fx: 0.62, fy: 0.27 }, { fx: 0.73, fy: 0.17 }, { fx: 0.87, fy: 0.23 }
];
var LOLLY_COLORS = ['#ff5f7e', '#ffd23e', '#7fd4ff', '#c9a0ff', '#ff9f3a', '#5fd36b', '#ff8fd0', '#8ecbff'];

function lollyPathY() {
  return (groundTop + groundBottom) / 2;
}

function initLollipop() {
  var i;
  tasks = [makeTask(0.32, 'count'), makeTask(0.68, 'odd')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  makeCheckpoints([0.42, 0.72]);
  lollies = [];
  for (i = 0; i < LOLLY_COUNT; i++) {
    lollies.push({
      ax: lollyDefs[i].fx * worldW, ay: groundTop - lollyDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2, color: LOLLY_COLORS[i % LOLLY_COLORS.length]
    });
  }
  lollyWheels = [
    { zA: 0.13, zB: 0.25, x: 0.19 * worldW, y: groundTop + viewH * 0.06, dir: 1, t: 0, pokeT: 0, spin: 0, spinV: 0 },
    { zA: 0.45, zB: 0.61, x: 0.53 * worldW, y: groundTop + viewH * 0.15, dir: -1, t: 1, pokeT: 0, spin: 0, spinV: 0 },
    { zA: 0.80, zB: 0.92, x: 0.86 * worldW, y: groundTop + viewH * 0.10, dir: 1, t: 2, pokeT: 0, spin: 0, spinV: 0 }
  ];
  lollyGate.x = lollyGate.fx * worldW;
  lollyGate.open = false;
  lolliProps();
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.10;
  unicorn.y = unicorn.ty = lollyPathY() - viewH * 0.04;
  unicorn.facing = 1;
  unicorn.moving = false;
  invulnT = 0;
  checkpoint.x = unicorn.x;
  checkpoint.y = unicorn.y;
  renderBackground();
  playNote(659, 0, 0.25, 'sine', 0.35);
  playNote(880, 0.12, 0.3, 'triangle', 0.3);
}

function respawnLollipop() {
  unicorn.x = unicorn.tx = checkpoint.x;
  unicorn.y = unicorn.ty = lollyPathY() - viewH * 0.04;
  unicorn.moving = false;
  camX = Math.min(Math.max(unicorn.x - viewW / 2, 0), Math.max(0, worldW - viewW));
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.1, 14, '#ffe27a');
}

function resizeLollipop(ratio) {
  var i;
  for (i = 0; i < lollies.length; i++) {
    lollies[i].ax = lollyDefs[i].fx * worldW;
    lollies[i].ay = groundTop - lollyDefs[i].fy * viewH;
  }
  for (i = 0; i < lollyWheels.length; i++) lollyWheels[i].x *= ratio;
  lollyGate.x = lollyGate.fx * worldW;
  lolliProps();
}

function collectLolly(lo) {
  lo.collected = true;
  registerCollected(lo);
  spawnSparkles(lo.ax, lo.ay, 14, lo.color);
  playNote(720 + countCollected(lollies) * 55, 0, 0.25, 'sine', 0.4);
  playNote(1080 + countCollected(lollies) * 55, 0.08, 0.3, 'sine', 0.3);
  if (countCollected(lollies) === LOLLY_COUNT && !lollyGate.open) {
    lollyGate.open = true;
    playNote(523, 0.3, 0.3, 'triangle', 0.4);
    playNote(659, 0.45, 0.3, 'triangle', 0.4);
    playNote(784, 0.6, 0.5, 'triangle', 0.4);
  }
}

function handleLollipopTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, wy = py, i, dx, dy;
  for (i = 0; i < lollies.length; i++) {
    var lo = lollies[i];
    if (lo.collected) continue;
    dx = wx - lo.ax;
    dy = wy - (lo.ay + Math.sin(lo.phase) * viewH * 0.012);
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectLolly(lo);
      return;
    }
  }
  // Salmiakkipyörä hypähtää ja pyörähtää tökkäyksestä (pelkkä koriste);
  // koristeet heilahtavat, ja napautus kävelyttää silti kuten ennen
  for (i = 0; i < lollyWheels.length; i++) {
    if (Math.hypot(wx - lollyWheels[i].x, wy - lollyWheels[i].y) < viewH * 0.06) {
      lollyWheels[i].pokeT = 0.5;
      lollyWheels[i].spinV = 12;
      playNote(300, 0, 0.1, 'square', 0.1);
      playNote(380, 0.08, 0.1, 'square', 0.1);
      spawnSparkles(lollyWheels[i].x, lollyWheels[i].y - viewH * 0.03, 5, '#f4f0ff');
      break;
    }
  }
  propsTap(wx, wy);
  setWalkTarget(px, py);
}

function updateLollipop(dt) {
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

  // Tikkarit kimaltelevat; niiden läpi voi myös ratsastaa
  for (i = 0; i < lollies.length; i++) {
    var lo = lollies[i];
    lo.phase += dt * 2;
    if (!lo.collected && !busy && !celebrating) {
      dx = lo.ax - unicorn.x;
      dy = lo.ay - unicorn.y;
      if (dx * dx + dy * dy < viewH * 0.09 * viewH * 0.09) collectLolly(lo);
    }
  }

  // Salmiakkipyörät vierivät polulla edestakaisin
  for (i = 0; i < lollyWheels.length; i++) {
    var wh = lollyWheels[i];
    wh.t += dt * 8;
    if (wh.pokeT > 0) wh.pokeT -= dt;
    if (wh.spinV > 0.01) { wh.spin += wh.spinV * wh.dir * dt; wh.spinV *= Math.max(0, 1 - dt * 2.5); }
    if (!busy && !celebrating) {
      wh.x += wh.dir * viewW * 0.06 * dt;
      if (wh.x < wh.zA * worldW) { wh.x = wh.zA * worldW; wh.dir = 1; }
      if (wh.x > wh.zB * worldW) { wh.x = wh.zB * worldW; wh.dir = -1; }
    }
    if (!celebrating && Math.abs(wh.x - unicorn.x) < viewH * 0.06 && Math.abs(wh.y - unicorn.y) < viewH * 0.07) {
      if (loseHeart()) {
        var push = unicorn.x < wh.x ? -1 : 1;
        unicorn.tx = Math.min(Math.max(unicorn.x + push * viewW * 0.08, viewW * 0.05), worldW - viewW * 0.03);
        unicorn.ty = unicorn.y;
        spawnSparkles(unicorn.x, unicorn.y - viewH * 0.08, 10, '#5a4a6e');
      }
    }
  }

  if (lollyGate.open && !celebrating && Math.abs(unicorn.x - lollyGate.x) < viewH * 0.09) {
    startCelebration();
  }

  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function lollipopLayers() {
  return [
    { speed: 0.22, render: renderLollipopFar },
    { speed: 0.55, render: renderLollipopMid },
    { speed: 1, render: renderLollipopNear }
  ];
}
function renderLollipopBg(b, w, h) {
  renderLollipopFar(b, w, h);
  renderLollipopMid(b, w, h);
  renderLollipopNear(b, w, h);
}
function renderLollipopFar(b, w, h) {
  var i;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#ff8fc8');
  sky.addColorStop(0.55, '#ffd4ec');
  sky.addColorStop(1, '#ffe9f4');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.16, h * 0.16, h * 0.065, 0.22, '#fff1a8', '#ffffff', '#ffd45a');
  for (i = 0; i < 8; i++) drawCloud(b, w * (0.04 + i * 0.125), h * (0.1 + (i % 3) * 0.08), h * 0.03, 0.8);
}
function renderLollipopMid(b, w, h) {
  var i, x;
  for (i = 0; i < 9; i++) {
    x = w * (i / 8);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.13 + (i % 3) * 0.04), Math.PI, 0); b.closePath();
    // Keskikerros sävytetään taivaaseen (ilmaperspektiivi), ei reunaviivoja
    artFillPath(b, artMix('#f7a8cd', '#ffe9f4', 0.3), groundTop - h * 0.15, groundTop + h * 0.02, h * 0.13, { line: false });
  }
  for (i = 0; i < 7; i++) {
    x = w * (0.07 + i * 0.14) + (i % 2) * h * 0.04;
    loBgTree(b, x, groundTop - h * 0.01, h * 0.16, LOLLY_COLORS[(i * 3) % LOLLY_COLORS.length], 0.45);
  }
}
function renderLollipopNear(b, w, h) {
  var i, x;
  var ground = b.createLinearGradient(0, groundTop, 0, h);
  ground.addColorStop(0, '#c8f2d8');
  ground.addColorStop(1, '#8fd9a8');
  b.fillStyle = ground;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,250,0.55)';
  b.fillRect(0, groundTop + h * 0.02, w, groundBottom - groundTop - h * 0.02);
  for (i = 0; i < 7; i++) {
    if (i % 2 === 1) continue; // puut 1, 3 ja 5 ovat tökättäviä koristeita (lolliProps)
    x = w * (0.07 + i * 0.14) + (i % 2) * h * 0.04;
    loBgTree(b, x, groundTop - h * 0.01, h * 0.2, LOLLY_COLORS[(i * 3) % LOLLY_COLORS.length], 0);
  }
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, LOLLY_COLORS[i % LOLLY_COLORS.length]);
  }
}

// Tikkaripuu: raidallinen tikku ja kierrekarkki. haze > 0 = keskikerros
// (sävytetty taivaaseen, ei reunaviivaa). p = tökättävä koriste: kierre pyörii
// (p.spin) ja viidennellä tökkäyksellä tikkarille kasvaa kasvot (p.face).
function loBgTree(b, x, baseY, s, color, haze, p) {
  haze = haze || 0;
  var sky = '#ffe9f4', cy = baseY - s * 0.92, spin = p ? p.spin : 0;
  var stick = artMix('#ffffff', sky, haze), col = artMix(color, sky, haze), line = artShade(color, -0.45);
  if (!haze) artShadow(b, x, baseY + s * 0.02, s * 0.3, s * 0.07, 0.14);
  artLimb(b, x, baseY, x, baseY - s * 0.75, s * 0.09, stick, haze > 0 ? false : '#d8b8d0');
  b.strokeStyle = artRGBA(artMix('#ff5f7e', sky, haze), 0.6);
  b.lineWidth = s * 0.035;
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x - s * 0.04, baseY - s * 0.1); b.lineTo(x + s * 0.04, baseY - s * 0.35); b.stroke();
  b.beginPath(); b.moveTo(x + s * 0.04, baseY - s * 0.4); b.lineTo(x - s * 0.04, baseY - s * 0.65); b.stroke();
  artCircle(b, x, cy, s * 0.28, col, haze > 0 ? { line: false } : { lineColor: line, hi: 0.3 });
  b.strokeStyle = 'rgba(255,255,255,0.7)';
  b.lineWidth = s * 0.05;
  b.beginPath(); b.arc(x, cy, s * 0.17, spin + 0.4, spin + Math.PI * 1.3); b.stroke();
  b.beginPath(); b.arc(x, cy, s * 0.07, spin + Math.PI * 1.3, spin + Math.PI * 2.4); b.stroke();
  if (p && p.face > 0) {
    artEye(b, x - s * 0.1, cy - s * 0.04, s * 0.05, 0, false);
    artEye(b, x + s * 0.1, cy - s * 0.04, s * 0.05, 0, Math.sin(p.face * 6) > 0.5);
    b.strokeStyle = line;
    b.lineWidth = Math.max(1, s * 0.03);
    b.beginPath(); b.arc(x, cy + s * 0.06, s * 0.09, 0.2, Math.PI - 0.2); b.stroke();
  }
}

// Tökättävät koristeet: tikkaripuut 1, 3 ja 5 sekä karkkiportti piirretään
// joka ruudulla taustan sijaan, jotta ne heilahtavat napautuksesta. Paikat
// ovat samat kuin taustan puilla; kutsutaan myös resize-koukusta.
function lolliProps() {
  var i, h = viewH;
  propsReset();
  for (i = 1; i < 7; i += 2) {
    propAdd({
      x: worldW * (0.07 + i * 0.14) + (i % 2) * h * 0.04, y: groundTop - h * 0.01, s: h * 0.2, col: LOLLY_COLORS[(i * 3) % LOLLY_COLORS.length],
      r: h * 0.09, hy: h * 0.2 * 0.92, color: LOLLY_COLORS[(i * 3) % LOLLY_COLORS.length], note: 600 + i * 40, spin: 0, spinV: 0, face: 0,
      draw: function (c, p) { loBgTree(c, 0, 0, p.s, p.col, 0, p); },
      update: function (p, dt) {
        if (p.spinV > 0.01) { p.spin += p.spinV * dt; p.spinV *= Math.max(0, 1 - dt * 2.2); }
        if (p.face > 0) { p.face += dt; if (p.face > 2.5) p.face = 0; }
      },
      poke: lolliTreePoke
    });
  }
  propAdd({
    x: lollyGate.x, y: groundTop, r: h * 0.15, hy: h * 0.27, amp: 0.05, color: '#ff5f7e', note: 1319,
    draw: lolliDrawGate,
    poke: function (p) {
      // Portti kilisee
      playNote(1760, 0.08, 0.12, 'triangle', 0.16);
      spawnSparkles(p.x, p.y - viewH * 0.4, 8, '#ffd23e');
    }
  });
}

// Tikkari pyörähtää ja sirottelee sokeria ja pari karkkia; joka viides
// tökkäys antaa sille kasvot, jotka iskevät silmää (yllätys)
function lolliTreePoke(p) {
  var j;
  p.spinV = 10;
  spawnSparkles(p.x, p.y - p.s * 0.92, 10, '#ffffff');
  for (j = 0; j < 2; j++) {
    propDropBall(p.x + (j - 0.5) * p.s * 0.3, p.y - p.s * 0.8, p.s * 0.05, LOLLY_COLORS[(p.n + j) % LOLLY_COLORS.length], p.y + viewH * 0.01);
  }
  if (p.n % 5 === 0 && !(p.face > 0)) {
    p.face = 0.001;
    playNote(880, 0.15, 0.1, 'triangle', 0.2);
    playNote(1109, 0.25, 0.1, 'triangle', 0.2);
    playNote(1319, 0.35, 0.2, 'triangle', 0.2);
  }
}

// Karkkiportti (origo = portin keskikohta maassa): karkkikeppipylväät,
// kaari ja sydänkarkki huipulla
function lolliDrawGate(c, p) {
  var h = viewH, gs = h * 0.3, i, lw = Math.max(1.2, h * 0.004);
  artShadow(c, 0, 0, gs * 0.5, gs * 0.08, 0.14);
  artLimb(c, -gs * 0.32, 0, -gs * 0.32, -gs, h * 0.028, '#ff5f7e', '#a83050');
  artLimb(c, gs * 0.32, 0, gs * 0.32, -gs, h * 0.028, '#ff5f7e', '#a83050');
  c.strokeStyle = '#ffffff';
  c.lineWidth = h * 0.012;
  c.lineCap = 'round';
  for (i = 0; i < 4; i++) {
    c.beginPath(); c.moveTo(-gs * 0.32 - h * 0.012, -gs * (0.15 + i * 0.25)); c.lineTo(-gs * 0.32 + h * 0.012, -gs * (0.25 + i * 0.25)); c.stroke();
    c.beginPath(); c.moveTo(gs * 0.32 - h * 0.012, -gs * (0.15 + i * 0.25)); c.lineTo(gs * 0.32 + h * 0.012, -gs * (0.25 + i * 0.25)); c.stroke();
  }
  c.strokeStyle = '#a83050';
  c.lineWidth = h * 0.028 + lw * 2;
  c.beginPath(); c.arc(0, -gs, gs * 0.32, Math.PI, 0); c.stroke();
  c.strokeStyle = '#ff5f7e';
  c.lineWidth = h * 0.028;
  c.beginPath(); c.arc(0, -gs, gs * 0.32, Math.PI, 0); c.stroke();
  artCircle(c, 0, -gs * 1.32, gs * 0.07, '#ffd23e', { lineColor: '#b8862a', hi: 0.4 });
}

function loDrawLolly(c, x, y, s, color) {
  artGlow(c, x, y, s * 1.8, color, 0.35);
  artLimb(c, x, y + s * 0.5, x, y + s * 1.6, s * 0.22, '#ffffff', '#d8b8d0');
  artCircle(c, x, y, s, color, { lineColor: artShade(color, -0.45), hi: 0.35 });
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = s * 0.16;
  c.beginPath(); c.arc(x, y, s * 0.62, Math.PI * 0.2, Math.PI * 1.2); c.stroke();
  c.beginPath(); c.arc(x, y, s * 0.3, Math.PI * 1.2, Math.PI * 2.2); c.stroke();
}

function loDrawWheel(c, wh) {
  var x = wh.x - camX, y = wh.y, s = viewH * 0.035, i;
  if (x < -s * 4 || x > viewW + s * 4) return;
  // Tökätty pyörä hypähtää ja pyörähtää vauhdilla (pelkkä piirto)
  var hop = wh.pokeT > 0 ? Math.sin(Math.min(1, wh.pokeT / 0.5) * Math.PI) * s * 0.6 : 0;
  artShadow(c, x, y + s * 0.85, s * 0.9, s * 0.22, 0.2);
  c.save();
  c.translate(x, y - hop);
  c.rotate(wh.t * wh.dir * 0.35 + wh.spin);
  artCircle(c, 0, 0, s, '#2e2a38', { lineColor: '#15121c' });
  c.strokeStyle = '#f4f0ff';
  c.lineWidth = s * 0.2;
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    c.beginPath(); c.arc(0, 0, s * (0.35 + i * 0.24), i * 0.9, i * 0.9 + Math.PI * 1.1); c.stroke();
  }
  c.restore();
  artHighlight(c, x - s * 0.35, y - hop - s * 0.4, s * 0.3, s * 0.18, 0.25);
}

function loDrawGateGlow(c) {
  var x = lollyGate.x - camX, h = viewH;
  if (x < -h * 0.3 || x > viewW + h * 0.3) return;
  var gy = groundTop - h * 0.32;
  if (lollyGate.open) {
    var g = c.createRadialGradient(x, gy, h * 0.01, x, gy, h * 0.16);
    g.addColorStop(0, 'rgba(255,214,240,' + (0.85 + Math.sin(globalT * 5) * 0.15) + ')');
    g.addColorStop(1, 'rgba(255,214,240,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, gy, h * 0.16, 0, Math.PI * 2); c.fill();
    drawStar(c, x, gy - h * 0.06, h * 0.03, globalT, 1);
  } else {
    c.fillStyle = 'rgba(255,214,240,0.3)';
    c.beginPath(); c.arc(x, gy, h * 0.018, 0, Math.PI * 2); c.fill();
  }
}

function drawLollipop() {
  var i;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < checkpoints.length; i++) drawLantern(ctx, checkpoints[i], groundTop);
  loDrawGateGlow(ctx);
  for (i = 0; i < lollies.length; i++) {
    if (lollies[i].collected) continue;
    var ly = lollies[i].ay + Math.sin(lollies[i].phase) * viewH * 0.012;
    loDrawLolly(ctx, lollies[i].ax - camX, ly, viewH * 0.028, lollies[i].color);
  }
  for (i = 0; i < lollyWheels.length; i++) loDrawWheel(ctx, lollyWheels[i]);
  var us = viewH / 800;
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;
  drawParticlesLayer(ctx);
  if (lollyGate.open && !celebrating) drawEdgeArrow(ctx, lollyGate.x);
  endPlayWorld();
  drawPickupHud(ctx, LOLLY_COUNT, function (i2) { return lollies[i2] && lollies[i2].collected; },
    function (c, x, y, s) { loDrawLolly(c, x, y, s, '#ff5f7e'); });
  drawHearts(ctx);
  drawTaskOverlay(ctx);
}
