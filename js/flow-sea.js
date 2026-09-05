'use strict';

// Saaristokartta: pelin ylin navigaatio. Jokainen saari on yksi maailma (sokkelo),
// ja vene kulkee saarten välillä. Saaren viimeinen huone (finaleKind) on saaren
// vartija: sen läpäisy palauttaa yhden sateenkaaren värin kartan yläreunaan.
// Tarina: Myrskynoidan myrsky huuhtoi sateenkaaren värit merelle, väri per saari.
// Uusi saari = rivi ISLANDS-taulukkoon + HUB_MAP/HUB_ROOMS/HUB_ORDER omalle sokkelolle.

var ISLANDS = [
  { world: 1, name: 'Linnasaari', fx: 0.24, fy: 0.70, size: 1.0, finaleKind: 'finale', deco: 'castle' },
  { world: 2, name: 'Karkkisaari', fx: 0.55, fy: 0.58, size: 0.82, finaleKind: 'tower', deco: ['beach', 'candy', 'tower'] },
  { world: 3, name: 'Kuutamosaari', fx: 0.84, fy: 0.76, size: 0.82, finaleKind: 'moon', deco: ['reef', 'nightwood', 'clouds'] }
];
// Sumuiset saaret vihjaavat tulevista maailmoista
var SEA_FOG = [{ fx: 0.89, fy: 0.47, size: 0.5 }];
var RAINBOW_COLORS = ['#ff5a5a', '#ff9f3a', '#ffe14d', '#5fd36b', '#4aa8ff', '#6f5cff', '#c46bff'];

var seaBoat = { x: 0, y: 0, island: 1, target: null, facing: 1, moving: false };
var seaReveal = null;               // { idx, t }: sateenkaaren värin paljastus
var seaToast = { t: 0, x: 0, y: 0 };
var seaBgCanvas = document.createElement('canvas');
var seaBgKey = '';

function islandByWorld(w) {
  var i;
  for (i = 0; i < ISLANDS.length; i++) if (ISLANDS[i].world === w) return ISLANDS[i];
  return null;
}
function islandIndex(isl) {
  var i;
  for (i = 0; i < ISLANDS.length; i++) if (ISLANDS[i] === isl) return i;
  return -1;
}
function islandDone(isl) {
  return !!(isl && hubCleared[isl.finaleKind]);
}
function islandUnlocked(i) {
  return i === 0 || islandDone(ISLANDS[i - 1]);
}
function rainbowEarned() {
  var n = 0, i;
  for (i = 0; i < ISLANDS.length; i++) if (islandDone(ISLANDS[i])) n++;
  return n;
}
function seaNextIsland() {
  var i;
  for (i = 0; i < ISLANDS.length; i++) {
    if (islandUnlocked(i) && !islandDone(ISLANDS[i])) return ISLANDS[i];
  }
  return null;
}
// Sokkelon satamaruutu vilkuttaa, kun tämä saari on valmis ja toisella saarella on tekemistä
function seaHarborHint() {
  var cur = islandByWorld(hubWorld);
  var nx = seaNextIsland();
  return !!(cur && islandDone(cur) && nx && nx.world !== hubWorld);
}
function seaIslandPos(isl) {
  return { x: viewW * isl.fx, y: viewH * isl.fy, r: viewH * 0.12 * isl.size };
}
function seaHarbor(isl) {
  var p = seaIslandPos(isl);
  return { x: p.x, y: p.y + p.r * 1.02 };
}

function showSea() {
  var isl, h, i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'karttaBtn', 'seaBtn'];
  mode = 'sea';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  document.getElementById('hubChrome').style.display = 'flex';
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#8fd0ff';
  lastTime = 0;
  isl = islandByWorld(hubWorld);
  if (!isl || !islandUnlocked(islandIndex(isl))) { isl = ISLANDS[0]; hubWorld = 1; }
  seaBoat.island = isl.world;
  seaBoat.target = null;
  seaBoat.moving = false;
  h = seaHarbor(isl);
  seaBoat.x = h.x;
  seaBoat.y = h.y;
  seaReveal = null;
  if (rainbowEarned() > rainbowShown) {
    seaReveal = { idx: rainbowShown, t: 0 };
    soundFanfare();
  }
}

function seaToastShow(p) {
  seaToast.t = 1.8;
  seaToast.x = p.x;
  seaToast.y = p.y - p.r * 1.5;
  playNote(392, 0, 0.18, 'triangle', 0.28);
}

function handleSeaTap(px, py) {
  var i, p, dx, dy, isl = null, idx = -1;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  for (i = 0; i < ISLANDS.length; i++) {
    p = seaIslandPos(ISLANDS[i]);
    dx = px - p.x;
    dy = py - (p.y + p.r * 0.15);
    if (dx * dx + dy * dy <= p.r * p.r * 1.8) { isl = ISLANDS[i]; idx = i; break; }
  }
  if (!isl) {
    for (i = 0; i < SEA_FOG.length; i++) {
      p = seaIslandPos(SEA_FOG[i]);
      dx = px - p.x;
      dy = py - p.y;
      if (dx * dx + dy * dy <= p.r * p.r * 1.8) { seaToastShow(p); return; }
    }
    return;
  }
  if (!islandUnlocked(idx)) {
    seaToastShow(p);
    return;
  }
  if (seaBoat.island === isl.world && !seaBoat.moving) {
    hubEnterIsland(isl.world);
    return;
  }
  seaBoat.target = isl;
  seaBoat.moving = true;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.16, 'triangle', 0.3);
}

function updateSea(dt) {
  globalT += dt;
  if (seaToast.t > 0) seaToast.t -= dt;
  if (seaReveal) {
    seaReveal.t += dt;
    if (seaReveal.t > 2.4) {
      if (rainbowEarned() > seaReveal.idx) rainbowShown = seaReveal.idx + 1;
      saveProgress();
      if (rainbowEarned() > rainbowShown) {
        seaReveal = { idx: rainbowShown, t: 0 };
        soundFanfare();
      } else {
        seaReveal = null;
      }
    }
  }
  if (seaBoat.target) {
    var h = seaHarbor(seaBoat.target);
    var dx = h.x - seaBoat.x, dy = h.y - seaBoat.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var sp = viewH * 0.32 * dt;
    if (dx > 2) seaBoat.facing = 1;
    else if (dx < -2) seaBoat.facing = -1;
    if (dist <= sp || dist < 1) {
      seaBoat.x = h.x;
      seaBoat.y = h.y;
      seaBoat.island = seaBoat.target.world;
      seaBoat.target = null;
      seaBoat.moving = false;
      hubEnterIsland(seaBoat.island);
    } else {
      seaBoat.x += (dx / dist) * sp;
      seaBoat.y += (dy / dist) * sp;
    }
  }
}

// ---------- Piirto ----------
function drawSea() {
  if (!viewW || !viewH) return;
  renderSeaBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(seaBgCanvas, 0, 0, seaBgCanvas.width, seaBgCanvas.height, 0, 0, viewW, viewH);
  drawSeaWaves(ctx);
  drawSeaRainbow(ctx);

  var i, p, isl, nx = seaNextIsland();
  for (i = 0; i < ISLANDS.length; i++) {
    isl = ISLANDS[i];
    p = seaIslandPos(isl);
    if (!islandUnlocked(i)) {
      ctx.fillStyle = 'rgba(200,212,235,0.78)';
      islandBlob(ctx, p.x, p.y, p.r * 1.12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.42, 0, Math.PI * 2); ctx.fill();
      drawHubLock(ctx, p.x, p.y + p.r * 0.02, p.r * 1.05);
    } else if (islandDone(isl)) {
      drawStar(ctx, p.x + p.r * 0.8, p.y - p.r * 0.85, p.r * 0.16, globalT * 0.5, 0.9);
    }
    if (isl === nx) {
      var gl = ctx.createRadialGradient(p.x, p.y, p.r * 0.9, p.x, p.y, p.r * 1.6);
      gl.addColorStop(0, 'rgba(255,230,140,' + (0.35 + Math.sin(globalT * 4) * 0.12) + ')');
      gl.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.6, 0, Math.PI * 2); ctx.fill();
      drawHintArrow(ctx, p.x, p.y - p.r * 1.45);
    }
  }

  // Vene ja ratsastajat
  var bob = Math.sin(globalT * 2.5) * viewH * 0.005;
  drawBoatWithRider(ctx, seaBoat.x, seaBoat.y + bob, viewH * 0.1, seaBoat.facing, seaBoat.moving);

  if (seaReveal) drawRevealSparkles(ctx);

  if (seaToast.t > 0) {
    ctx.globalAlpha = Math.min(1, seaToast.t * 2);
    var tw = viewH * 0.14, th = viewH * 0.11;
    var tx = Math.min(Math.max(seaToast.x - tw / 2, viewH * 0.02), viewW - tw - viewH * 0.02);
    var ty = Math.max(seaToast.y - th / 2, viewH * 0.14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, tx, ty, tw, th, viewH * 0.03);
    ctx.fill();
    drawHubLock(ctx, tx + tw / 2, ty + th * 0.55, th * 0.7);
    ctx.globalAlpha = 1;
  }
}

function drawSeaWaves(c) {
  var i, x, y, w;
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1.5, viewH * 0.005);
  c.lineCap = 'round';
  for (i = 0; i < 14; i++) {
    w = viewH * (0.05 + (i % 3) * 0.015);
    x = ((globalT * viewH * (0.03 + (i % 4) * 0.01) + i * viewW * 0.173) % (viewW + w * 2)) - w;
    y = viewH * (0.42 + (i % 7) * 0.08) + Math.sin(globalT * 1.6 + i) * viewH * 0.006;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.quadraticCurveTo(x - w / 4, y - w * 0.18, x, y);
    c.quadraticCurveTo(x + w / 4, y + w * 0.18, x + w / 2, y);
    c.stroke();
  }
  c.lineCap = 'butt';
}

// Sateenkaari taivaalla: kerätyt värit täytetään, muut ovat vaaleita kaaria
function drawSeaRainbow(c) {
  var cx = viewW * 0.5, cy = viewH * 0.40, bw = viewH * 0.021, R0 = viewH * 0.27, i, r;
  c.lineCap = 'butt';
  for (i = 0; i < RAINBOW_COLORS.length; i++) {
    r = R0 - i * bw - bw / 2;
    c.lineWidth = bw * 0.96;
    c.strokeStyle = '#ffffff';
    c.globalAlpha = 0.28;
    c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI * 2); c.stroke();
    if (i < rainbowShown || (seaReveal && i === seaReveal.idx)) {
      c.strokeStyle = RAINBOW_COLORS[i];
      c.globalAlpha = i < rainbowShown ? 0.92 : Math.min(0.92, seaReveal.t / 1.3) * 0.92;
      c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI * 2); c.stroke();
    }
  }
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,0.95)';
  cloudShape(c, cx - R0 + bw * 1.5, cy - bw * 0.5, viewH * 0.03);
  cloudShape(c, cx + R0 - bw * 1.5, cy - bw * 0.5, viewH * 0.03);
}

function drawRevealSparkles(c) {
  var cx = viewW * 0.5, cy = viewH * 0.40, bw = viewH * 0.021, R0 = viewH * 0.27;
  var r = R0 - seaReveal.idx * bw - bw / 2, k, a, t = seaReveal.t;
  for (k = 0; k < 7; k++) {
    a = Math.PI + ((t * 0.55 + k / 7) % 1) * Math.PI;
    c.globalAlpha = Math.max(0, 1 - t / 2.4);
    drawStar(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, bw * 0.9, globalT * 3 + k, 0.8);
  }
  c.globalAlpha = 1;
}

function drawHull(c, x, y, s) {
  c.fillStyle = '#8a5a30';
  c.beginPath();
  c.moveTo(x - s * 0.5, y);
  c.quadraticCurveTo(x, y + s * 0.45, x + s * 0.5, y);
  c.lineTo(x + s * 0.42, y - s * 0.12);
  c.lineTo(x - s * 0.42, y - s * 0.12);
  c.closePath();
  c.fill();
}

function drawBoatWithRider(c, x, y, s, facing, moving) {
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  drawBoat(c, 0, 0, s);
  drawUnicorn(c, -s * 0.05, -s * 0.02, s * 0.0042, 1, globalT * 7, moving, globalT);
  drawHull(c, 0, 0, s);
  c.restore();
}

function islandBlob(c, x, y, r) {
  c.beginPath();
  c.moveTo(x + r * 0.85, y); c.arc(x, y, r * 0.85, 0, Math.PI * 2);
  c.moveTo(x - r * 0.55 + r * 0.55, y + r * 0.1); c.arc(x - r * 0.55, y + r * 0.1, r * 0.55, 0, Math.PI * 2);
  c.moveTo(x + r * 0.6 + r * 0.5, y + r * 0.05); c.arc(x + r * 0.6, y + r * 0.05, r * 0.5, 0, Math.PI * 2);
  c.moveTo(x + r * 0.1 + r * 0.6, y + r * 0.3); c.arc(x + r * 0.1, y + r * 0.3, r * 0.6, 0, Math.PI * 2);
}

function drawIsland(b, isl, foggy) {
  var p = seaIslandPos(isl), i, k, xs;
  b.fillStyle = foggy ? 'rgba(200,220,235,0.35)' : 'rgba(190,240,255,0.6)';
  islandBlob(b, p.x, p.y, p.r * 1.3);
  b.fill();
  b.fillStyle = foggy ? '#b9c6d6' : '#f2dfa6';
  islandBlob(b, p.x, p.y, p.r);
  b.fill();
  b.fillStyle = foggy ? '#a7b6c8' : '#7fcf68';
  islandBlob(b, p.x, p.y - p.r * 0.12, p.r * 0.76);
  b.fill();
  if (foggy) {
    b.fillStyle = 'rgba(240,246,255,0.55)';
    for (i = 0; i < 5; i++) {
      b.beginPath();
      b.arc(p.x + (i - 2) * p.r * 0.45, p.y - p.r * 0.1 + (i % 2) * p.r * 0.25, p.r * 0.42, 0, Math.PI * 2);
      b.fill();
    }
    return;
  }
  if (isl.deco === 'castle') {
    drawTree(b, p.x - p.r * 0.62, p.y + p.r * 0.2, p.r * 0.5);
    drawTree(b, p.x + p.r * 0.7, p.y + p.r * 0.25, p.r * 0.45);
    drawCastle(b, p.x, p.y + p.r * 0.1, p.r * 1.0);
    drawFlower(b, p.x - p.r * 0.3, p.y + p.r * 0.45, p.r * 0.08, '#ff7bac');
    drawFlower(b, p.x + p.r * 0.35, p.y + p.r * 0.5, p.r * 0.08, '#ffe27a');
  } else if (isl.deco && isl.deco.length) {
    xs = [-0.6, 0.02, 0.64];
    for (k = 0; k < isl.deco.length && k < 3; k++) {
      drawHubRoomIcon(b, isl.deco[k], p.x + xs[k] * p.r, p.y - p.r * 0.1 + (k === 1 ? -p.r * 0.22 : p.r * 0.08), p.r * 1.9);
    }
  }
}

function drawSeaRoute(b, a, c2, alpha) {
  var dx = c2.x - a.x, dy = c2.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
  var step = viewH * 0.03, n = Math.floor(dist / step), i, t;
  b.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  for (i = 1; i < n; i++) {
    t = i / n;
    b.beginPath();
    b.arc(a.x + dx * t, a.y + dy * t + Math.sin(t * Math.PI) * -viewH * 0.03, viewH * 0.005, 0, Math.PI * 2);
    b.fill();
  }
}

function renderSeaBg() {
  var key = viewW + 'x' + viewH;
  if (seaBgKey === key) return;
  seaBgKey = key;
  seaBgCanvas.width = Math.round(viewW * DPR);
  seaBgCanvas.height = Math.round(viewH * DPR);
  var b = seaBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var w = viewW, h = viewH, horizon = h * 0.36, i, x, y;

  // Taivas ja aurinko
  var sky = b.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#a9dcff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, horizon + 2);
  var sg = b.createRadialGradient(w * 0.12, h * 0.17, h * 0.02, w * 0.12, h * 0.17, h * 0.15);
  sg.addColorStop(0, 'rgba(255,245,180,0.95)');
  sg.addColorStop(0.35, 'rgba(255,235,140,0.55)');
  sg.addColorStop(1, 'rgba(255,235,140,0)');
  b.fillStyle = sg;
  b.beginPath(); b.arc(w * 0.12, h * 0.17, h * 0.15, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff6c8';
  b.beginPath(); b.arc(w * 0.12, h * 0.17, h * 0.05, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.3, h * 0.2, h * 0.024);
  cloudShape(b, w * 0.78, h * 0.15, h * 0.03);
  cloudShape(b, w * 0.93, h * 0.27, h * 0.022);

  // Kaukaiset kukkulat horisontissa
  b.fillStyle = '#a9d9c3';
  for (i = 0; i < 9; i++) {
    x = w * (i / 8) + (i % 2) * w * 0.03;
    b.beginPath();
    b.arc(x, horizon + h * 0.012, h * (0.018 + (i % 3) * 0.008), Math.PI, Math.PI * 2);
    b.fill();
  }

  // Meri
  var sea = b.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#8ed4ff');
  sea.addColorStop(0.5, '#5db3f0');
  sea.addColorStop(1, '#3f8fd6');
  b.fillStyle = sea;
  b.fillRect(0, horizon, w, h - horizon);
  b.strokeStyle = 'rgba(255,255,255,0.14)';
  b.lineWidth = Math.max(1, h * 0.004);
  for (y = horizon + h * 0.04; y < h; y += h * 0.055) {
    b.beginPath();
    for (x = -10; x <= w + 10; x += 12) {
      var wy = y + Math.sin(x / (h * 0.08) + y) * h * 0.005;
      if (x === -10) b.moveTo(x, wy); else b.lineTo(x, wy);
    }
    b.stroke();
  }

  // Reitit saarten välillä (viimeisestä sumuun haaleana)
  for (i = 0; i + 1 < ISLANDS.length; i++) drawSeaRoute(b, seaHarbor(ISLANDS[i]), seaHarbor(ISLANDS[i + 1]), 0.55);
  if (SEA_FOG.length > 0 && ISLANDS.length > 0) {
    var fp = seaIslandPos(SEA_FOG[0]);
    drawSeaRoute(b, seaHarbor(ISLANDS[ISLANDS.length - 1]), { x: fp.x, y: fp.y + fp.r }, 0.22);
  }

  // Saaret
  for (i = 0; i < SEA_FOG.length; i++) drawIsland(b, SEA_FOG[i], true);
  for (i = 0; i < ISLANDS.length; i++) drawIsland(b, ISLANDS[i], false);
}
