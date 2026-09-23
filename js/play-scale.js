'use strict';

// Aarrevaaka (Kaukamaa, Lohikäärmelaakso): rauhallinen kenttä ilman sydämiä ja
// liikkumista. Vanha lohikäärme Vaari vartioi aarrekammiota, jossa on iso
// kultainen vaaka. Vaari laittaa vasempaan kuppiin jalokiviä; raahaa lattian
// jalokiviä oikeaan kuppiin, kunnes vaaka on tasan. Pieni jalokivi painaa yhden
// ja iso kaksi, ja vaaka kallistuu heti painavamman puolen mukaan, joten liian
// painavan kupin näkee ja jalokiven voi raahata takaisin lattialle. Viisi
// kierrosta; jokaisesta tasapainosta Vaarin aarrekasa saa uuden aarteen.
// Tehtävät toisen ja neljännen kierroksen jälkeen: kummalla enemmän, lasku.

var SCALE_ROUNDS = [[1, 1, 1], [2], [2, 1, 1], [2, 2, 1], [2, 2, 2, 1]];
var SCALE_FLOOR = [
  { fx: 0.30, w: 1 }, { fx: 0.37, w: 1 }, { fx: 0.44, w: 1 }, { fx: 0.51, w: 1 }, { fx: 0.58, w: 1 }, { fx: 0.65, w: 1 }, { fx: 0.72, w: 1 }, { fx: 0.79, w: 1 },
  { fx: 0.34, w: 2 }, { fx: 0.48, w: 2 }, { fx: 0.62, w: 2 }, { fx: 0.76, w: 2 }
];
var SCALE_SMALL_COLORS = ['#ff7bac', '#5fa8ff', '#6fd66f', '#ffd24f', '#c9a0ff', '#ff9f3a', '#6fd6d6', '#ff8fc0'];
var SCALE_BIG_COLORS = ['#b678ff', '#ff5f7e', '#4aa8ff', '#5fd36b'];
var SCALE_TREASURES = ['crown', 'goblet', 'ring', 'necklace', 'sceptre'];

var scale = {
  round: 0, gems: [], left: [], drag: null, back: [],
  angle: 0, stableT: 0, doneT: 0, treasures: 0, taskDelay: 0, finishT: 0,
  vaari: { nodT: 0, blinkT: 0 }, hintT: 0
};

function scaleS() { return viewH * 0.03; }
function scalePivot() { return { x: viewW * 0.55, y: viewH * 0.26 }; }
function scaleArm() { return viewW * 0.24; }
function scaleChain() { return viewH * 0.2; }
function scalePanPos(side) {
  var p = scalePivot(), B = scaleArm(), a = scale.angle;
  return { x: p.x + side * B * Math.cos(a), y: p.y + side * B * Math.sin(a) + scaleChain() };
}
function scaleGemR(w) { return scaleS() * (w === 2 ? 1.45 : 1); }
function scaleSum(list) {
  var i, n = 0;
  for (i = 0; i < list.length; i++) n += list[i].w;
  return n;
}
// Jalokivien paikat kupissa: rivi keskeltä ulospäin, iso kivi vie enemmän tilaa
function scaleSlotPositions(list, pan) {
  var i, widths = [], total = 0, x, out = [], s = scaleS();
  for (i = 0; i < list.length; i++) { widths.push(scaleGemR(list[i].w) * 2.1); total += widths[i]; }
  x = pan.x - total / 2;
  for (i = 0; i < list.length; i++) {
    out.push({ x: x + widths[i] / 2, y: pan.y - scaleGemR(list[i].w) * 0.9 - s * 0.1 });
    x += widths[i];
  }
  return out;
}

// ---------- Alustus ----------
function initScale() {
  var i, f;
  tasks = [makeTask(-5, 'compare'), makeTask(-5, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  scale.gems = [];
  for (i = 0; i < SCALE_FLOOR.length; i++) {
    f = SCALE_FLOOR[i];
    scale.gems.push({ idx: i, w: f.w, fx: f.fx, hx: 0, hy: 0, x: 0, y: 0, onPan: false, color: f.w === 2 ? SCALE_BIG_COLORS[i % SCALE_BIG_COLORS.length] : SCALE_SMALL_COLORS[i % SCALE_SMALL_COLORS.length], wobble: 0 });
  }
  scalePlaceFloor();
  scale.round = 0;
  scale.left = [];
  scale.drag = null;
  scale.back = [];
  scale.angle = 0;
  scale.stableT = 0;
  scale.doneT = 0;
  scale.treasures = 0;
  scale.taskDelay = 0;
  scale.finishT = 0;
  scale.hintT = 0;
  scale.vaari.nodT = 0;
  scaleLoadRound();
  princess.x = viewW * 0.16;
  princess.y = groundTop + viewH * 0.03;
  princess.facing = 1;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}
function scalePlaceFloor() {
  var i, g, s = scaleS();
  for (i = 0; i < scale.gems.length; i++) {
    g = scale.gems[i];
    g.hx = g.fx * viewW;
    g.hy = groundTop + viewH * (g.w === 2 ? 0.10 : 0.045) - scaleGemR(g.w) * 0.2;
    if (!g.onPan && scale.drag !== g) { g.x = g.hx; g.y = g.hy; }
  }
}
function scaleLoadRound() {
  var i, set = SCALE_ROUNDS[scale.round];
  scale.left = [];
  for (i = 0; i < set.length; i++) scale.left.push({ w: set[i], color: set[i] === 2 ? SCALE_BIG_COLORS[(i + 1) % SCALE_BIG_COLORS.length] : SCALE_SMALL_COLORS[(i + 3) % SCALE_SMALL_COLORS.length], appear: -i * 0.15 });
  scale.stableT = 0;
  scale.doneT = 0;
}
function respawnScale() {}
function resizeScale() {
  scalePlaceFloor();
  princess.x = viewW * 0.16;
  princess.y = groundTop + viewH * 0.03;
}

// ---------- Syöte ----------
function scaleRightList() {
  var i, out = [];
  for (i = 0; i < scale.gems.length; i++) if (scale.gems[i].onPan) out.push(scale.gems[i]);
  return out;
}
function handleScaleTap(px, py) {
  var i, g, dx, dy, r, best = null, bd = 1e9;
  if (!running || celebrating || puzzleBusy() || scale.doneT > 0) return;
  for (i = 0; i < scale.gems.length; i++) {
    g = scale.gems[i];
    r = scaleGemR(g.w) * 1.6;
    dx = px - g.x; dy = py - g.y;
    if (dx * dx + dy * dy < r * r && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = g; }
  }
  if (!best) return;
  scale.drag = best;
  if (best.onPan) { best.onPan = false; scaleArrangePan(); }
  for (i = scale.back.length - 1; i >= 0; i--) if (scale.back[i].g === best) scale.back.splice(i, 1);
  playNote(880, 0, 0.08, 'sine', 0.2);
}
function scaleInPan(px, py) {
  var pan = scalePanPos(1), rx = viewW * 0.13, ry = viewH * 0.12;
  var dx = (px - pan.x) / rx, dy = (py - (pan.y - viewH * 0.05)) / ry;
  return dx * dx + dy * dy <= 1;
}
// Kupissa olevat kivet järjestyvät riviin (kohdepaikat; kivet liukuvat niihin)
function scaleArrangePan() {
  var list = scaleRightList(), pos = scaleSlotPositions(list, scalePanPos(1)), i;
  for (i = 0; i < list.length; i++) { list[i].tx = pos[i].x; list[i].ty = pos[i].y; }
}
function scaleDrop(g) {
  if (scaleInPan(g.x, g.y)) {
    g.onPan = true;
    scaleArrangePan();
    artPop(g.x, g.y, scaleGemR(g.w) * 1.6, g.color, 'ring');
    playNote(600 + scaleSum(scaleRightList()) * 60, 0, 0.18, 'triangle', 0.35);
  } else {
    scale.back.push({ g: g, x0: g.x, y0: g.y, t: 0 });
  }
}

// ---------- Päivitys ----------
function updateScale(dt) {
  var i, g, b, k, busy, sumL, sumR, target, list, pos, s = scaleS();
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  scale.vaari.blinkT -= dt;
  if (scale.vaari.blinkT < -0.15) scale.vaari.blinkT = 2.5 + Math.random() * 3;
  if (scale.vaari.nodT > 0) scale.vaari.nodT -= dt;
  if (scale.taskDelay > 0 && !busy) {
    scale.taskDelay -= dt;
    if (scale.taskDelay <= 0) {
      if (scale.treasures >= 2 && !tasks[0].opened) taskStart(tasks[0]);
      else if (scale.treasures >= 4 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Raahaus
  if (scale.drag) {
    g = scale.drag;
    if (holding && !busy) {
      g.x += (lastPX - g.x) * Math.min(1, dt * 18);
      g.y += (lastPY - s * 0.8 - g.y) * Math.min(1, dt * 18);
    } else {
      scale.drag = null;
      scaleDrop(g);
    }
  }
  for (i = scale.back.length - 1; i >= 0; i--) {
    b = scale.back[i];
    b.t += dt;
    k = easeOutCubic(Math.min(1, b.t / 0.45));
    b.g.x = b.x0 + (b.g.hx - b.x0) * k;
    b.g.y = b.y0 + (b.g.hy - b.y0) * k - Math.sin(k * Math.PI) * s * 2;
    if (b.t >= 0.45) { b.g.x = b.g.hx; b.g.y = b.g.hy; scale.back.splice(i, 1); }
  }
  // Vaaka kallistuu painavamman puolen mukaan
  sumL = scaleSum(scale.left);
  sumR = scaleSum(scaleRightList());
  target = scale.doneT > 0 ? 0 : Math.max(-0.3, Math.min(0.3, (sumR - sumL) * 0.075));
  scale.angle += (target - scale.angle) * Math.min(1, dt * 3.5);
  // Kupissa olevat kivet seuraavat kuppia
  list = scaleRightList();
  pos = scaleSlotPositions(list, scalePanPos(1));
  for (i = 0; i < list.length; i++) {
    list[i].x += (pos[i].x - list[i].x) * Math.min(1, dt * 10);
    list[i].y += (pos[i].y - list[i].y) * Math.min(1, dt * 10);
  }
  for (i = 0; i < scale.left.length; i++) scale.left[i].appear = Math.min(1, scale.left[i].appear + dt * 2);
  // Tasapaino: sama paino, ei raahausta, hetki rauhassa
  if (scale.doneT <= 0 && !busy && !celebrating) {
    if (sumL === sumR && sumR > 0 && !scale.drag && Math.abs(scale.angle) < 0.03) {
      scale.stableT += dt;
      if (scale.stableT > 0.9) scaleRoundDone();
    } else {
      scale.stableT = 0;
    }
  }
  if (scale.doneT > 0) {
    scale.doneT -= dt;
    if (scale.doneT <= 0) {
      if (scale.round + 1 < SCALE_ROUNDS.length) {
        scale.round++;
        scaleLoadRound();
      } else if (!celebrating) {
        startCelebration();
      }
    }
  }
  if (scale.treasures === 0 && !busy) scale.hintT += dt;
}

function scaleRoundDone() {
  var i, list = scaleRightList(), p = scalePivot();
  scale.doneT = 2.2;
  scale.treasures++;
  scale.vaari.nodT = 1.6;
  artPop(p.x, p.y, viewH * 0.08, '#ffe27a', 'burst');
  spawnSparkles(p.x, p.y - viewH * 0.05, 24, '#ffe27a');
  for (i = 0; i < list.length; i++) {
    list[i].onPan = false;
    scale.back.push({ g: list[i], x0: list[i].x, y0: list[i].y, t: -0.6 - i * 0.08 });
  }
  scale.stableT = 0;
  soundFanfare();
  if (scale.treasures === 2 || scale.treasures === 4) scale.taskDelay = 2.6;
}

// ---------- Piirto: tausta ----------
function scaleLayers() {
  return [
    { speed: 0.3, render: renderScaleFar },
    { speed: 1, render: renderScaleNear }
  ];
}
function renderScaleBg(b, w, h) {
  renderScaleFar(b, w, h);
  renderScaleNear(b, w, h);
}
function renderScaleFar(b, w, h) {
  var i, x, vw = viewW, g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a1438');
  g.addColorStop(0.7, '#3a2450');
  g.addColorStop(1, '#5a3a40');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Seinän jalokivet ja kultahehku
  for (i = 0; i < 14; i++) {
    x = vw * ((i * 0.137 + 0.03) % 1);
    drawScaleGem(b, x, h * (0.08 + (i * 0.173) % 0.45), h * 0.012, SCALE_SMALL_COLORS[i % SCALE_SMALL_COLORS.length], 0.5);
  }
  artGlow(b, vw * 0.5, h * 0.9, h * 0.5, '#ffb347', 0.25);
  drawBgSun(b, vw * 0.5, h * 0.06, h * 0.03, 0.3, '#ffe0a0', '#fff6dc', '#ffd24f');
}
function renderScaleNear(b, w, h) {
  var i, x, g, s = scaleS(), vw = viewW;
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#6a4a5a');
  g.addColorStop(1, '#3a2438');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,220,180,0.15)';
  b.fillRect(0, groundTop + h * 0.015, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  // Kultakasat sivuilla ja Vaarin aarrekasa vasemmalla
  drawGoldPile(b, vw * 0.06, groundTop + h * 0.02, h * 0.16);
  drawGoldPile(b, vw * 0.94, groundTop + h * 0.02, h * 0.13);
  drawGoldPile(b, vw * 0.86, groundTop + h * 0.1, h * 0.09);
  // Vaa'an jalusta
  var p = scalePivot();
  artRoundRect(b, p.x - s * 0.7, p.y, s * 1.4, groundTop - p.y + h * 0.02, s * 0.4, '#d9a441', { shadeTo: '#8a5a10', lineColor: '#5a3a08', hi: 0.25 });
  artBlob(b, p.x, groundTop + h * 0.02, s * 4.5, s * 1.0, '#d9a441', { shadeTo: '#8a5a10', lineColor: '#5a3a08', hi: 0.2 });
  artCircle(b, p.x, p.y, s * 1.1, '#ffd24f', { lineColor: '#8a5a10', hi: 0.4 });
}
function drawGoldPile(b, x, baseY, s) {
  var i;
  artBlob(b, x, baseY - s * 0.25, s * 1.3, s * 0.55, '#ffd24f', { shadeTo: '#b8862a', lineColor: '#7a5a10', hi: 0.35 });
  artBlob(b, x - s * 0.2, baseY - s * 0.6, s * 0.8, s * 0.4, '#ffe27a', { shadeTo: '#c9962a', lineColor: '#7a5a10', hi: 0.4 });
  for (i = 0; i < 6; i++) {
    artBlob(b, x - s * 0.9 + i * s * 0.36, baseY - s * (0.15 + (i % 2) * 0.5) - s * 0.05, s * 0.16, s * 0.07, '#fff0a0', { lineColor: '#b8862a' });
  }
  drawScaleGem(b, x + s * 0.4, baseY - s * 0.75, s * 0.14, '#ff5f7e', 1);
  drawScaleGem(b, x - s * 0.6, baseY - s * 0.5, s * 0.12, '#4aa8ff', 1);
}

// ---------- Piirto: jalokivet, vaaka, aarteet ----------
function drawScaleGem(c, x, y, r, color, alpha) {
  var dark = artShade(color, -0.45);
  if (alpha !== undefined) c.globalAlpha = alpha;
  c.beginPath();
  c.moveTo(x - r * 0.6, y - r * 0.55);
  c.lineTo(x + r * 0.6, y - r * 0.55);
  c.lineTo(x + r, y - r * 0.1);
  c.lineTo(x, y + r);
  c.lineTo(x - r, y - r * 0.1);
  c.closePath();
  artFillPath(c, color, y - r * 0.55, y + r, r, { lineColor: dark });
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath(); c.moveTo(x - r, y - r * 0.1); c.lineTo(x + r, y - r * 0.1); c.moveTo(x - r * 0.3, y - r * 0.1); c.lineTo(x, y + r); c.moveTo(x + r * 0.3, y - r * 0.1); c.lineTo(x, y + r); c.stroke();
  artHighlight(c, x - r * 0.3, y - r * 0.35, r * 0.25, r * 0.12, 0.6);
  c.globalAlpha = 1;
}
function drawScalePan(c, pan, side) {
  var s = scaleS(), p = scalePivot(), B = scaleArm(), a = scale.angle;
  var ex = p.x + side * B * Math.cos(a), ey = p.y + side * B * Math.sin(a);
  c.strokeStyle = '#8a5a10';
  c.lineWidth = Math.max(2, s * 0.14);
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(pan.x - s * 3.2, pan.y - s * 0.4); c.moveTo(ex, ey); c.lineTo(pan.x + s * 3.2, pan.y - s * 0.4); c.stroke();
  c.strokeStyle = '#ffd24f';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(pan.x - s * 3.2, pan.y - s * 0.4); c.moveTo(ex, ey); c.lineTo(pan.x + s * 3.2, pan.y - s * 0.4); c.stroke();
  artBlob(c, pan.x, pan.y, s * 3.6, s * 0.75, '#e8b84a', { shadeTo: '#9a6a18', lineColor: '#5a3a08', hi: 0.3 });
  artBlob(c, pan.x, pan.y - s * 0.2, s * 3.0, s * 0.45, '#b8862a', { line: false });
}
function drawScaleBeam(c) {
  var s = scaleS(), p = scalePivot(), B = scaleArm(), a = scale.angle;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(a);
  artRoundRect(c, -B - s * 0.3, -s * 0.45, B * 2 + s * 0.6, s * 0.9, s * 0.45, '#ffd24f', { shadeTo: '#b8862a', lineColor: '#7a5a10', hi: 0.3 });
  c.restore();
  // Tasapainon osoitin: kolmio jalustassa ja viisari palkissa
  c.fillStyle = Math.abs(a) < 0.03 && scaleSum(scaleRightList()) > 0 ? '#6fd66f' : '#ff9f3a';
  c.beginPath(); c.moveTo(p.x, p.y - s * 2.6); c.lineTo(p.x - s * 0.5, p.y - s * 1.7); c.lineTo(p.x + s * 0.5, p.y - s * 1.7); c.closePath(); c.fill();
  c.strokeStyle = '#7a5a10';
  c.lineWidth = Math.max(2, s * 0.12);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - Math.sin(a) * s * 2.2, p.y - Math.cos(a) * s * 2.2); c.stroke();
  artCircle(c, p.x, p.y, s * 0.5, '#8a5a10', { line: false });
}
function drawTreasure(c, kind, x, y, s) {
  var i;
  if (kind === 'crown') {
    c.beginPath(); c.moveTo(x - s, y + s * 0.5); c.lineTo(x - s, y - s * 0.3); c.lineTo(x - s * 0.5, y + s * 0.1); c.lineTo(x, y - s * 0.6); c.lineTo(x + s * 0.5, y + s * 0.1); c.lineTo(x + s, y - s * 0.3); c.lineTo(x + s, y + s * 0.5); c.closePath();
    artFillPath(c, '#ffd24f', y - s * 0.6, y + s * 0.5, s, { lineColor: '#b8862a' });
    drawScaleGem(c, x, y + s * 0.15, s * 0.25, '#ff5f7e');
  } else if (kind === 'goblet') {
    artBlob(c, x, y - s * 0.3, s * 0.7, s * 0.5, '#ffd24f', { shadeTo: '#b8862a', lineColor: '#7a5a10', hi: 0.3 });
    artLimb(c, x, y, x, y + s * 0.6, s * 0.2, '#ffd24f', '#7a5a10');
    artBlob(c, x, y + s * 0.7, s * 0.5, s * 0.15, '#ffd24f', { lineColor: '#7a5a10' });
  } else if (kind === 'ring') {
    c.strokeStyle = '#7a5a10'; c.lineWidth = s * 0.42; c.beginPath(); c.arc(x, y + s * 0.15, s * 0.55, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#ffd24f'; c.lineWidth = s * 0.28; c.beginPath(); c.arc(x, y + s * 0.15, s * 0.55, 0, Math.PI * 2); c.stroke();
    drawScaleGem(c, x, y - s * 0.5, s * 0.3, '#4aa8ff');
  } else if (kind === 'necklace') {
    c.strokeStyle = '#ffd24f'; c.lineWidth = Math.max(2, s * 0.14); c.beginPath(); c.arc(x, y - s * 0.3, s * 0.8, 0.3, Math.PI - 0.3); c.stroke();
    for (i = 0; i < 3; i++) drawScaleGem(c, x + (i - 1) * s * 0.45, y + s * 0.35 - Math.abs(i - 1) * s * 0.15, s * 0.2, ['#6fd66f', '#ff7bac', '#c9a0ff'][i]);
  } else {
    artLimb(c, x - s * 0.5, y + s * 0.7, x + s * 0.4, y - s * 0.5, s * 0.16, '#ffd24f', '#7a5a10');
    drawStar(c, x + s * 0.5, y - s * 0.65, s * 0.35, 0, 0.6);
  }
}
function drawVaari(c) {
  var s = viewH * 0.09, x = viewW * 0.08, y = groundTop - viewH * 0.03, nod = scale.vaari.nodT > 0 ? Math.sin(scale.vaari.nodT * 12) * 0.08 : 0;
  drawBabyDragon(c, x, y, s, '#b8a8d8', {
    mouth: scale.vaari.nodT > 0 ? 0.3 : 0, flap: -0.5, look: 0.5, blink: scale.vaari.blinkT < 0,
    facing: -1, squash: nod, sleep: false
  });
  // Silmälasit
  c.strokeStyle = '#7a5a10';
  c.lineWidth = Math.max(1.5, s * 0.05);
  c.beginPath(); c.arc(x + s * 0.8, y - s * 1.95, s * 0.28, 0, Math.PI * 2); c.arc(x + s * 0.32, y - s * 1.9, s * 0.28, 0, Math.PI * 2); c.stroke();
  // Aarteet kasassa Vaarin edessä
  var i;
  for (i = 0; i < scale.treasures; i++) {
    drawTreasure(c, SCALE_TREASURES[i], viewW * 0.06 + (i % 3) * viewH * 0.06 + Math.floor(i / 3) * viewH * 0.03, groundTop - viewH * 0.12 - Math.floor(i / 3) * viewH * 0.06, viewH * 0.025);
  }
}

function drawScale() {
  var i, g, c = ctx, s = scaleS(), panL = scalePanPos(-1), panR = scalePanPos(1), pos;
  if (!beginPlayWorld()) return;
  drawVaari(c);
  drawPrincessFree(c, princess.x, princess.y, viewH / 560, 1, 0, false, globalT);
  drawScaleBeam(c);
  drawScalePan(c, panL, -1);
  drawScalePan(c, panR, 1);
  // Vaarin kivet vasemmassa kupissa
  pos = scaleSlotPositions(scale.left, panL);
  for (i = 0; i < scale.left.length; i++) {
    var k = easeOutBack(Math.max(0, scale.left[i].appear));
    if (k > 0) drawScaleGem(c, pos[i].x, pos[i].y - (1 - k) * s * 3, scaleGemR(scale.left[i].w) * Math.max(0.2, k), scale.left[i].color);
  }
  // Oikean kupin korostus, kun raahataan
  if (scale.drag) {
    c.strokeStyle = 'rgba(255,240,160,' + (0.5 + Math.sin(globalT * 6) * 0.3) + ')';
    c.lineWidth = Math.max(2, s * 0.15);
    c.beginPath();
    if (c.ellipse) c.ellipse(panR.x, panR.y - viewH * 0.05, viewW * 0.13, viewH * 0.12, 0, 0, Math.PI * 2); else c.arc(panR.x, panR.y - viewH * 0.05, viewH * 0.12, 0, Math.PI * 2);
    c.stroke();
  }
  // Lattian ja kupin kivet, raahattava viimeisenä
  for (i = 0; i < scale.gems.length; i++) {
    g = scale.gems[i];
    if (g === scale.drag) continue;
    if (!g.onPan) artShadow(c, g.x, g.y + scaleGemR(g.w) * 1.05, scaleGemR(g.w) * 1.1, scaleGemR(g.w) * 0.3, 0.16);
    drawScaleGem(c, g.x, g.y, scaleGemR(g.w), g.color);
  }
  if (scale.drag) {
    g = scale.drag;
    artShadow(c, g.x, g.y + scaleGemR(g.w) * 2.2, scaleGemR(g.w) * 1.0, scaleGemR(g.w) * 0.25, 0.1);
    drawScaleGem(c, g.x, g.y, scaleGemR(g.w) * 1.1, g.color);
  }
  // Tasapaino saavutettu: hehku
  if (scale.doneT > 0) {
    var p = scalePivot();
    artGlow(c, p.x, p.y, viewH * 0.25, '#ffe27a', 0.3 * Math.min(1, scale.doneT));
  }
  // Vihje ennen ensimmäistä tasapainoa: käsi raahaa kiven kuppiin
  if (scale.treasures === 0 && !scale.drag && scaleRightList().length === 0 && scale.hintT > 2) {
    var hp = (scale.hintT - 2) % 3.4;
    if (hp < 2.0) {
      var kk = easeInOutSine(Math.min(1, hp / 1.6)), g0 = scale.gems[0];
      var hx = g0.hx + (panR.x - g0.hx) * kk, hy = g0.hy + (panR.y - s * 1.5 - g0.hy) * kk;
      c.globalAlpha = hp > 1.7 ? (2.0 - hp) / 0.3 : 0.85;
      if (kk > 0.05) drawScaleGem(c, hx, hy, scaleGemR(1), g0.color);
      drawHand(c, hx + s * 0.6, hy + s * 1.2, s * 1.1);
      c.globalAlpha = 1;
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawPickupHud(c, SCALE_ROUNDS.length, function (i2) { return i2 < scale.treasures; }, function (cc, x, y, hs) { drawTreasure(cc, SCALE_TREASURES[0], x, y, hs * 0.9); });
  drawTaskOverlay(c);
}

HUB_ICONS.scale = function (c, x, y, s) {
  c.strokeStyle = '#8a5a10';
  c.lineWidth = Math.max(2, s * 0.035);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + s * 0.14); c.lineTo(x, y - s * 0.14); c.moveTo(x - s * 0.2, y - s * 0.1); c.lineTo(x + s * 0.2, y - s * 0.14); c.stroke();
  artBlob(c, x - s * 0.2, y + s * 0.02, s * 0.1, s * 0.035, '#ffd24f', { lineColor: '#8a5a10' });
  artBlob(c, x + s * 0.2, y - s * 0.02, s * 0.1, s * 0.035, '#ffd24f', { lineColor: '#8a5a10' });
  drawScaleGem(c, x - s * 0.2, y - s * 0.03, s * 0.045, '#ff5f7e');
};
