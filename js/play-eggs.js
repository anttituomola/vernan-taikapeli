'use strict';

// Munapesä (Kaukamaa, Lohikäärmelaakso): rauhallinen kenttä ilman sydämiä ja
// liikkumista. Luolan hyllyillä on kuusi lohikäärmeenmunaa, joissa on kuvio
// (pilkut, raidat, siksak). Raahaa jokainen muna pesään, jonka kyltissä on sama
// kuvio; väärä pesä keikauttaa munan takaisin hyllylle. Kun pesässä on kaksi
// munaa, pidä sormea pesän päällä: Minttu-lohikäärme lentää pesän viereen ja
// puhaltaa lämpöä, lämpörengas täyttyy ja munat halkeilevat vaihe vaiheelta,
// kunnes poikaset kuoriutuvat. Irti päästettynä lämpö hiipuu hitaasti, joten
// hautominen kannattaa tehdä yhdellä pidolla. Tehtävät avautuvat kuoriutumisten
// jälkeen: järjestä koon mukaan, samanlainen.

var EGG_PATTERNS = [
  { id: 'dots', color: '#ff7bac' },
  { id: 'stripes', color: '#5fa8ff' },
  { id: 'zig', color: '#6fd66f' }
];
var EGG_SHELVES = [
  { fx: 0.30, fy: 0.34, pat: 0 }, { fx: 0.45, fy: 0.24, pat: 1 }, { fx: 0.58, fy: 0.40, pat: 2 },
  { fx: 0.70, fy: 0.22, pat: 0 }, { fx: 0.84, fy: 0.34, pat: 1 }, { fx: 0.52, fy: 0.58, pat: 2 }
];
var EGG_NEST_FX = [0.40, 0.62, 0.84];
var EGG_WARM_T = 2.6;     // sekuntia täyteen lämpöön
var EGG_COOL = 0.22;      // lämmön hiipuminen per sekunti irti päästettynä
var EGG_BABY_COLORS = ['#ff9ec6', '#8fd4ff', '#a8e07a'];

var eggs = {
  list: [], nests: [], drag: null, back: [],
  minttu: { x: 0, y: 0, tx: 0, ty: 0, facing: 1, breathing: false, flap: 0 },
  holdNest: null, taskDelay: 0, hatched: 0, finishT: 0, hintT: 0
};

function eggS() { return viewH * 0.045; }
function eggNestY() { return groundTop - viewH * 0.02; }

// ---------- Alustus ----------
function initEggs() {
  var i, sh, s = eggS();
  tasks = [makeTask(-5, 'order'), makeTask(-5, 'match')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  eggs.list = [];
  for (i = 0; i < EGG_SHELVES.length; i++) {
    sh = EGG_SHELVES[i];
    eggs.list.push({ idx: i, pat: sh.pat, hx: sh.fx * viewW, hy: sh.fy * viewH, x: sh.fx * viewW, y: sh.fy * viewH, nest: null, slot: 0, wobble: 0, crack: 0, hatched: false, hopT: Math.random() * 3 });
  }
  eggs.nests = [];
  for (i = 0; i < EGG_NEST_FX.length; i++) {
    eggs.nests.push({ pat: i, x: EGG_NEST_FX[i] * viewW, y: eggNestY(), eggs: [], heat: 0, hatched: false, hatchT: 0, shakeT: 0 });
  }
  eggs.drag = null;
  eggs.back = [];
  eggs.holdNest = null;
  eggs.taskDelay = 0;
  eggs.hatched = 0;
  eggs.finishT = 0;
  eggs.hintT = 0;
  princess.x = viewW * 0.11;
  princess.y = groundTop + viewH * 0.03;
  princess.facing = 1;
  eggs.minttu.x = viewW * 0.20;
  eggs.minttu.y = groundTop + viewH * 0.02;
  eggs.minttu.tx = eggs.minttu.x;
  eggs.minttu.ty = eggs.minttu.y;
  eggs.minttu.facing = 1;
  eggs.minttu.breathing = false;
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}
function respawnEggs() {}
function resizeEggs() {
  var i, e, n;
  for (i = 0; i < eggs.list.length; i++) {
    e = eggs.list[i];
    e.hx = EGG_SHELVES[i].fx * viewW;
    e.hy = EGG_SHELVES[i].fy * viewH;
    if (!e.nest && eggs.drag !== e) { e.x = e.hx; e.y = e.hy; }
  }
  for (i = 0; i < eggs.nests.length; i++) { n = eggs.nests[i]; n.x = EGG_NEST_FX[i] * viewW; n.y = eggNestY(); }
  princess.x = viewW * 0.11;
  princess.y = groundTop + viewH * 0.03;
  eggs.minttu.y = groundTop + viewH * 0.02;
}

// ---------- Apurit ----------
function eggSlotPos(n, slot) {
  var s = eggS();
  return { x: n.x + (slot === 0 ? -s * 0.6 : s * 0.6), y: n.y - s * 0.7 };
}
function eggNestAt(px, py) {
  var i, n, s = eggS(), dx, dy;
  for (i = 0; i < eggs.nests.length; i++) {
    n = eggs.nests[i];
    dx = px - n.x; dy = py - (n.y - s * 0.8);
    if (dx * dx / (s * s * 6) + dy * dy / (s * s * 4) <= 1) return n;
  }
  return null;
}
function eggPlaceInNest(e, n) {
  var p;
  e.nest = n;
  e.slot = n.eggs.length;
  n.eggs.push(e);
  p = eggSlotPos(n, e.slot);
  e.x = p.x; e.y = p.y;
  artPop(p.x, p.y, eggS() * 1.2, EGG_PATTERNS[n.pat].color, 'ring');
  spawnSparkles(p.x, p.y, 10, EGG_PATTERNS[n.pat].color);
  playNote(660 + e.slot * 120, 0, 0.18, 'triangle', 0.35);
  playNote(990 + e.slot * 120, 0.08, 0.25, 'sine', 0.3);
  if (n.eggs.length === 2) {
    playNote(784, 0.3, 0.2, 'triangle', 0.3);
    playNote(1047, 0.42, 0.35, 'triangle', 0.3);
  }
}
function eggReturn(e, wrong) {
  eggs.back.push({ e: e, x0: e.x, y0: e.y, t: 0 });
  if (wrong) {
    e.wobble = 0.6;
    playNote(170, 0, 0.25, 'sawtooth', 0.18);
  }
}
function eggNestReady(n) {
  return n.eggs.length === 2 && !n.hatched;
}

// ---------- Syöte ----------
function handleEggsTap(px, py) {
  var i, e, s = eggS(), dx, dy, best = null, bd = 1e9, n;
  if (!running || celebrating || puzzleBusy()) return;
  // Tartu munaan hyllyllä (pesään laitettua munaa ei enää siirretä)
  for (i = 0; i < eggs.list.length; i++) {
    e = eggs.list[i];
    if (e.nest || e.hatched) continue;
    dx = px - e.x; dy = py - e.y;
    if (dx * dx + dy * dy < s * s * 2.6 && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = e; }
  }
  if (best) {
    eggs.drag = best;
    for (i = eggs.back.length - 1; i >= 0; i--) if (eggs.back[i].e === best) eggs.back.splice(i, 1);
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  // Pidä pesän päällä: hautominen
  n = eggNestAt(px, py);
  if (n && eggNestReady(n)) {
    eggs.holdNest = n;
    eggs.minttu.tx = n.x - s * 3.2;
    eggs.minttu.ty = n.y - s * 0.2;
    eggs.minttu.facing = 1;
  }
}

// ---------- Päivitys ----------
function updateEggs(dt) {
  var i, j, e, n, m = eggs.minttu, busy, b, k, p, s = eggS(), dx, dy;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (eggs.taskDelay > 0 && !busy) {
    eggs.taskDelay -= dt;
    if (eggs.taskDelay <= 0) {
      if (eggs.hatched >= 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (eggs.hatched >= 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Raahaus: muna seuraa sormea; irti päästettynä pesään tai takaisin hyllylle
  if (eggs.drag) {
    e = eggs.drag;
    if (holding && !busy) {
      e.x += (lastPX - e.x) * Math.min(1, dt * 18);
      e.y += (lastPY - s * 0.6 - e.y) * Math.min(1, dt * 18);
    } else {
      eggs.drag = null;
      n = eggNestAt(e.x, e.y + s * 0.6);
      if (n && !busy) {
        if (n.pat === e.pat && n.eggs.length < 2) eggPlaceInNest(e, n);
        else { eggReturn(e, true); n.shakeT = 0.5; }
      } else {
        eggReturn(e, false);
      }
    }
  }
  for (i = eggs.back.length - 1; i >= 0; i--) {
    b = eggs.back[i];
    b.t += dt;
    k = easeOutCubic(Math.min(1, b.t / 0.45));
    b.e.x = b.x0 + (b.e.hx - b.x0) * k;
    b.e.y = b.y0 + (b.e.hy - b.y0) * k - Math.sin(k * Math.PI) * s * 1.5;
    if (b.t >= 0.45) { b.e.x = b.e.hx; b.e.y = b.e.hy; eggs.back.splice(i, 1); }
  }
  // Hautominen: pito pesän päällä lämmittää, irti päästettynä lämpö hiipuu.
  // Pito, joka alkoi tehtävän aikana, tarttuu pesään heti kun tehtävä sulkeutuu.
  if (eggs.holdNest && (!holding || busy || !eggNestReady(eggs.holdNest))) eggs.holdNest = null;
  if (holding && !busy && !eggs.holdNest && !eggs.drag) {
    n = eggNestAt(lastPX, lastPY);
    if (n && eggNestReady(n)) { eggs.holdNest = n; m.tx = n.x - s * 3.2; m.ty = n.y - s * 0.2; }
  }
  m.breathing = false;
  for (i = 0; i < eggs.nests.length; i++) {
    n = eggs.nests[i];
    if (n.shakeT > 0) n.shakeT -= dt;
    if (n.hatched) { n.hatchT += dt; continue; }
    if (n === eggs.holdNest && Math.abs(m.x - m.tx) < s * 0.8) {
      n.heat = Math.min(1, n.heat + dt / EGG_WARM_T);
      m.breathing = true;
      if (Math.random() < dt * 20) spawnSparkles(n.x + (Math.random() - 0.5) * s * 2, n.y - s * (0.6 + Math.random()), 1, Math.random() < 0.5 ? '#ffb347' : '#fff0a0');
      if (n.heat >= 1) eggHatch(n);
    } else if (n.heat > 0 && n.eggs.length === 2) {
      n.heat = Math.max(0, n.heat - dt * EGG_COOL);
    }
    for (j = 0; j < n.eggs.length; j++) {
      e = n.eggs[j];
      e.crack = n.heat > 0.85 ? 2 : (n.heat > 0.45 ? 1 : 0);
    }
  }
  // Minttu lentää pesän viereen tai palaa prinsessan luo
  if (!eggs.holdNest) { m.tx = viewW * 0.20; m.ty = groundTop + viewH * 0.02; }
  dx = m.tx - m.x; dy = m.ty - m.y;
  if (Math.abs(dx) > 2) m.facing = dx > 0 ? 1 : -1;
  m.x += dx * Math.min(1, dt * 4);
  m.y += dy * Math.min(1, dt * 4);
  if (eggs.holdNest) m.facing = 1;
  m.flap += dt * (Math.abs(dx) + Math.abs(dy) > s ? 12 : 4);
  for (i = 0; i < eggs.list.length; i++) {
    e = eggs.list[i];
    if (e.wobble > 0) e.wobble -= dt;
    e.hopT += dt;
  }
  if (eggs.hatched === 0 && !busy) eggs.hintT += dt;
  if (eggs.hatched === eggs.nests.length && !celebrating && !busy) {
    eggs.finishT += dt;
    if (eggs.finishT > 1.6) startCelebration();
  }
}

function eggHatch(n) {
  var j, e, p, col = EGG_BABY_COLORS[n.pat];
  n.hatched = true;
  n.hatchT = 0;
  n.heat = 1;
  for (j = 0; j < n.eggs.length; j++) {
    e = n.eggs[j];
    e.hatched = true;
    p = eggSlotPos(n, e.slot);
    artPop(p.x, p.y, eggS() * 1.6, col, 'burst');
    spawnSparkles(p.x, p.y - eggS(), 18, '#fff0a0');
  }
  eggs.hatched++;
  eggs.holdNest = null;
  soundDragonHappy(n.pat * 2);
  playNote(1047, 0.35, 0.3, 'triangle', 0.35);
  playNote(1319, 0.5, 0.45, 'triangle', 0.35);
  if (eggs.hatched === 1 || eggs.hatched === 2) eggs.taskDelay = 1.6;
}

// ---------- Piirto: tausta ----------
function eggsLayers() {
  return [
    { speed: 0.3, render: renderEggsFar },
    { speed: 1, render: renderEggsNear }
  ];
}
function renderEggsBg(b, w, h) {
  renderEggsFar(b, w, h);
  renderEggsNear(b, w, h);
}
function renderEggsFar(b, w, h) {
  var i, x, y, vw = viewW, g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a1428');
  g.addColorStop(0.6, '#4a2438');
  g.addColorStop(1, '#6a3a3a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Luolan suu vasemmalla ylhäällä: yötaivas ja tähdet
  var sky = b.createRadialGradient(vw * 0.12, h * 0.1, h * 0.02, vw * 0.12, h * 0.1, h * 0.3);
  sky.addColorStop(0, '#3a2a7a');
  sky.addColorStop(1, '#2a1428');
  b.fillStyle = sky;
  b.beginPath(); if (b.ellipse) b.ellipse(vw * 0.12, h * 0.1, h * 0.3, h * 0.22, 0, 0, Math.PI * 2); else b.arc(vw * 0.12, h * 0.1, h * 0.25, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#fff6d8';
  for (i = 0; i < 12; i++) {
    x = vw * 0.02 + (i * 0.037) * vw; y = h * (0.02 + (i * 0.29) % 0.2);
    if (Math.hypot(x - vw * 0.12, y - h * 0.1) < h * 0.22) { b.globalAlpha = 0.5 + (i % 3) * 0.2; b.beginPath(); b.arc(x, y, 1.2 + (i % 2), 0, Math.PI * 2); b.fill(); }
  }
  b.globalAlpha = 1;
  drawBgSun(b, vw * 0.09, h * 0.07, h * 0.035, 0.3, '#c8d4ff', '#fdfdff', '#d8e0ff');
  // Kaukaiset kristallit
  for (i = 0; i < 9; i++) {
    x = vw * (0.05 + i * 0.11); y = h * (0.75 - (i % 3) * 0.08);
    drawEggCrystal(b, x, y, h * (0.05 + (i % 2) * 0.02), i % 2 ? '#ff7bac' : '#7fd4ff', 0.5);
  }
}
function renderEggsNear(b, w, h) {
  var i, x, sh, s = eggS(), g, vw = viewW;
  // Tippukivet katosta
  for (i = 0; i < 10; i++) {
    x = vw * (0.16 + i * 0.09);
    b.beginPath(); b.moveTo(x - s * 1.1, -4); b.lineTo(x + s * 1.1, -4); b.lineTo(x, h * (0.08 + (i % 3) * 0.04)); b.closePath();
    artFillPath(b, '#3a1a2a', 0, h * 0.15, s, { shadeTo: '#6a3a4a', lineColor: '#1a0a12' });
  }
  // Lattia
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#8a5a4a');
  g.addColorStop(1, '#4a2a2a');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,210,170,0.18)';
  b.fillRect(0, groundTop + h * 0.015, w, Math.max(0, groundBottom - groundTop - h * 0.02));
  // Hyllyt munille
  for (i = 0; i < EGG_SHELVES.length; i++) {
    sh = EGG_SHELVES[i];
    x = sh.fx * vw;
    artBlob(b, x, sh.fy * h + s * 1.05, s * 1.7, s * 0.4, '#7a4a4a', { shadeTo: '#3a1a1a', lineColor: '#2a0a0a', hi: 0.15 });
    artBlob(b, x - s * 1.2, sh.fy * h + s * 0.95, s * 0.35, s * 0.2, '#6dbb6a', { line: false });
  }
  // Isot kristallit ja hehku
  for (i = 0; i < 5; i++) {
    x = vw * (0.08 + i * 0.22) + (i % 2) * vw * 0.05;
    drawEggCrystal(b, x, groundTop + h * 0.01, h * (0.07 + (i % 2) * 0.03), i % 2 ? '#7fd4ff' : '#ff7bac', 1);
  }
  // Pesät: kyltti kuviolla
  for (i = 0; i < EGG_NEST_FX.length; i++) {
    x = EGG_NEST_FX[i] * vw;
    artLimb(b, x + s * 2.0, eggNestY() + s * 0.2, x + s * 2.0, eggNestY() - s * 1.9, s * 0.22, '#8a5a30', '#4a2a10');
    artRoundRect(b, x + s * 1.2, eggNestY() - s * 3.2, s * 1.6, s * 1.5, s * 0.25, '#fff6d8', { lineColor: '#b8862a' });
    drawEgg(b, x + s * 2.0, eggNestY() - s * 2.45, s * 0.42, EGG_PATTERNS[i], 0, 0);
  }
}
function drawEggCrystal(b, x, baseY, s, color, alpha) {
  b.globalAlpha = alpha;
  artGlow(b, x, baseY - s * 0.6, s * 1.8, color, 0.35);
  b.beginPath(); b.moveTo(x - s * 0.4, baseY); b.lineTo(x - s * 0.2, baseY - s * 1.3); b.lineTo(x + s * 0.1, baseY - s * 0.7); b.lineTo(x + s * 0.45, baseY); b.closePath();
  artFillPath(b, color, baseY - s * 1.3, baseY, s * 0.4, { lineColor: artShade(color, -0.4) });
  b.fillStyle = 'rgba(255,255,255,0.4)';
  b.beginPath(); b.moveTo(x - s * 0.28, baseY - s * 0.1); b.lineTo(x - s * 0.2, baseY - s * 1.1); b.lineTo(x - s * 0.1, baseY - s * 0.2); b.closePath(); b.fill();
  b.globalAlpha = 1;
}

// ---------- Piirto: munat, pesät ----------
// Muna kuviolla; crack 0..2 halkeamat, hatched = auennut kuori
function drawEgg(c, x, y, s, pat, crack, wobble, hatched) {
  var i, col = pat.color, rot = wobble > 0 ? Math.sin(wobble * 40) * 0.25 : 0;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  if (hatched) {
    // Alakuori
    c.beginPath();
    c.moveTo(-s * 0.72, -s * 0.05);
    for (i = 0; i <= 6; i++) c.lineTo(-s * 0.72 + i * s * 0.24, -s * 0.05 + (i % 2 ? -s * 0.18 : s * 0.02));
    c.arc(0, 0, s, 0, Math.PI, false);
    c.closePath();
    artFillPath(c, '#fff6e6', -s * 0.3, s, s, { lineColor: '#c9b8a0' });
    c.restore();
    return;
  }
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.74, s, 0, 0, Math.PI * 2); else c.arc(0, 0, s * 0.85, 0, Math.PI * 2);
  artFillPath(c, '#fff6e6', -s, s, s, { lineColor: '#c9b8a0', shadeTo: '#e8d8c8' });
  c.save();
  c.beginPath();
  if (c.ellipse) c.ellipse(0, 0, s * 0.72, s * 0.98, 0, 0, Math.PI * 2); else c.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = col;
  c.strokeStyle = col;
  if (pat.id === 'dots') {
    for (i = 0; i < 7; i++) {
      c.beginPath(); c.arc(-s * 0.5 + (i % 3) * s * 0.5 + (i > 2 ? s * 0.25 : 0), -s * 0.55 + Math.floor(i / 3) * s * 0.5, s * 0.14, 0, Math.PI * 2); c.fill();
    }
  } else if (pat.id === 'stripes') {
    c.lineWidth = s * 0.16;
    for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-s, i * s * 0.45); c.lineTo(s, i * s * 0.45); c.stroke(); }
  } else {
    c.lineWidth = s * 0.14;
    c.lineJoin = 'round';
    c.beginPath();
    for (i = 0; i <= 6; i++) c.lineTo(-s * 0.9 + i * s * 0.3, (i % 2 ? -s * 0.2 : s * 0.1));
    c.stroke();
    c.beginPath();
    for (i = 0; i <= 6; i++) c.lineTo(-s * 0.9 + i * s * 0.3, (i % 2 ? -s * 0.7 : -s * 0.4));
    c.stroke();
  }
  c.restore();
  artHighlight(c, -s * 0.3, -s * 0.5, s * 0.22, s * 0.3, 0.45);
  if (crack > 0) {
    c.strokeStyle = '#5a4a3a';
    c.lineWidth = Math.max(1.2, s * 0.07);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.2); c.lineTo(-s * 0.1, 0); c.lineTo(-s * 0.25, s * 0.2); c.lineTo(0, s * 0.35); c.stroke();
    if (crack > 1) {
      c.beginPath(); c.moveTo(s * 0.1, -s * 0.6); c.lineTo(s * 0.3, -s * 0.35); c.lineTo(s * 0.15, -s * 0.1); c.lineTo(s * 0.4, s * 0.1); c.stroke();
      artGlow(c, 0, 0, s * 1.4, '#ffe27a', 0.3 + Math.sin(globalT * 8) * 0.15);
    }
  }
  c.restore();
}
function drawEggNest(c, n) {
  var s = eggS(), x = n.x + (n.shakeT > 0 ? Math.sin(n.shakeT * 40) * s * 0.15 : 0), y = n.y, i, e, p, col = EGG_PATTERNS[n.pat].color, ready = eggNestReady(n);
  // Lämpörengas
  if (n.eggs.length === 2 && !n.hatched) {
    c.strokeStyle = 'rgba(255,255,255,0.3)';
    c.lineWidth = Math.max(3, s * 0.18);
    c.beginPath(); c.arc(x, y - s * 0.8, s * 2.6, 0, Math.PI * 2); c.stroke();
    if (n.heat > 0) {
      c.strokeStyle = artMix('#ffd24f', '#ff6a2a', n.heat);
      c.beginPath(); c.arc(x, y - s * 0.8, s * 2.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.heat); c.stroke();
      artGlow(c, x, y - s * 0.8, s * 3.2, '#ffb347', 0.25 * n.heat);
    }
  }
  drawNestBowl(c, x, y, s * 1.05, false);
  for (i = 0; i < n.eggs.length; i++) {
    e = n.eggs[i];
    p = eggSlotPos(n, e.slot);
    if (n.hatched) {
      var ht = Math.min(1, n.hatchT / 0.6), hop = Math.sin(globalT * 6 + i * 2) * s * 0.15 * ht;
      drawEgg(c, p.x + (x - n.x), p.y + s * 0.3, s * 0.9, EGG_PATTERNS[n.pat], 0, 0, true);
      drawBabyDragon(c, p.x + (x - n.x), p.y + s * 0.15 - hop - (1 - ht) * s * 0.5, s * 0.55 * (0.4 + ht * 0.6), EGG_BABY_COLORS[n.pat], { mouth: 0.2, flap: Math.sin(globalT * 9 + i), look: -0.3, blink: (globalT + i) % 3.7 < 0.12, facing: i === 0 ? 1 : -1, noShadow: true });
    } else {
      var wob = n.heat > 0 ? Math.sin(globalT * (8 + n.heat * 14) + i * 2) * n.heat * 0.25 : 0;
      drawEgg(c, p.x + (x - n.x), p.y + Math.abs(wob) * -s * 0.15, s * 0.9, EGG_PATTERNS[n.pat], e.crack, wob !== 0 ? globalT * 0.3 + i : 0);
    }
  }
  drawNestBowl(c, x, y, s * 1.05, true);
  if (ready && n.heat < 0.05) {
    // Vihje: käsi pitää pesän päällä
    var hp = (globalT % 2.4);
    if (hp < 1.6) {
      c.globalAlpha = hp < 0.3 ? hp / 0.3 : (hp > 1.3 ? (1.6 - hp) / 0.3 : 1);
      drawHand(c, x + s * 0.4, y - s * 1.2 + Math.sin(hp * 6) * s * 0.1, s * 0.7);
      c.globalAlpha = 1;
    }
  }
}

function drawEggs() {
  var i, e, m = eggs.minttu, s = eggS(), c = ctx;
  if (!beginPlayWorld()) return;
  for (i = 0; i < eggs.nests.length; i++) drawEggNest(c, eggs.nests[i]);
  // Munat hyllyillä ja raahattava muna viimeisenä
  for (i = 0; i < eggs.list.length; i++) {
    e = eggs.list[i];
    if (e.nest || e === eggs.drag) continue;
    artShadow(c, e.x, e.y + s * 1.0, s * 0.8, s * 0.2, 0.18);
    drawEgg(c, e.x, e.y, s, EGG_PATTERNS[e.pat], 0, e.wobble);
  }
  drawPrincessFree(c, princess.x, princess.y, viewH / 560, 1, 0, false, globalT);
  // Minttu: lentää pesän viereen ja puhaltaa lämpöä
  var flying = Math.abs(m.x - m.tx) + Math.abs(m.y - m.ty) > s * 0.5 || !!eggs.holdNest;
  drawBabyDragon(c, m.x, m.y, s * 1.1, '#7fe0c8', { mouth: m.breathing ? 0.7 : 0, flap: Math.sin(m.flap) * (flying ? 0.9 : 0.2), look: -0.3, blink: (globalT % 4.3) < 0.12, facing: -m.facing, noShadow: flying });
  if (m.breathing && eggs.holdNest) {
    var n = eggs.holdNest, mx = m.x + m.facing * s * 1.9, my = m.y - s * 1.5;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (i = 0; i < 5; i++) {
      var u = (i + 0.5) / 5, px = mx + (n.x - s * 0.5 - mx) * u, py = my + (n.y - s * 1.2 - my) * u + Math.sin(globalT * 14 + i) * s * 0.2;
      artBlob(c, px, py, s * (0.25 + u * 0.35), s * (0.2 + u * 0.25), u < 0.5 ? '#fff0a0' : '#ffb347', { line: false, alpha: 0.55 - u * 0.25 });
    }
    c.restore();
  }
  if (eggs.drag) {
    e = eggs.drag;
    artShadow(c, e.x, e.y + s * 1.6, s * 0.7, s * 0.18, 0.12);
    drawEgg(c, e.x, e.y, s * 1.08, EGG_PATTERNS[e.pat], 0, 0);
  }
  // Vihje ennen ensimmäistä pesään laitettua munaa: käsi vetää munan pesään
  if (eggs.hatched === 0 && !eggs.drag && eggs.nests[0].eggs.length === 0 && eggs.hintT > 1.5) {
    var hp = (eggs.hintT - 1.5) % 3.4;
    if (hp < 2.0) {
      var k = easeInOutSine(Math.min(1, hp / 1.6)), e0 = eggs.list[0], n0 = eggs.nests[0];
      var hx = e0.x + (n0.x - e0.x) * k, hy = e0.y + (n0.y - s * 1.2 - e0.y) * k;
      c.globalAlpha = hp > 1.7 ? (2.0 - hp) / 0.3 : 0.85;
      if (k > 0.05) drawEgg(c, hx, hy, s * 0.9, EGG_PATTERNS[e0.pat], 0, 0);
      drawHand(c, hx + s * 0.4, hy + s * 0.8, s * 0.7);
      c.globalAlpha = 1;
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawEggsHud(c);
  drawTaskOverlay(c);
}
function drawEggsHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, e, n = eggs.list.length;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * n + pad, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    e = eggs.list[i];
    var x = left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, y = pad * 0.5 + hs * 1.9;
    if (e.hatched) drawDragonHead(c, x, y, hs * 0.85, EGG_BABY_COLORS[e.pat]);
    else { c.globalAlpha = e.nest ? 0.85 : 0.35; drawEgg(c, x, y, hs * 1.0, EGG_PATTERNS[e.pat], 0, 0); c.globalAlpha = 1; }
  }
}

HUB_ICONS.eggs = function (c, x, y, s) {
  drawEgg(c, x - s * 0.07, y + s * 0.02, s * 0.13, EGG_PATTERNS[0], 0, 0);
  drawEgg(c, x + s * 0.1, y + s * 0.05, s * 0.11, EGG_PATTERNS[1], 0, 0);
};
