'use strict';

// Tivolisaaren tehtävätyypit:
//   clock  – mitä kello on: kellotaulu kuplassa (tasatunti), valitse tunti palloista
//   pay    – maksa: hinta lipussa, napauta rahoja (1, 2, 5) lautaselle kunnes summa täsmää
//   jigsaw – palapeli (raahaus): kuva paloina, raahaa palat kehykseen mallin mukaan
//   route  – reitti: ohjelmoi pupu porkkanalle nuolilla ja paina ▶
// Perusrunko (taskStart, handleTaskTap, taskDrop, drawTaskOverlay) haarautuu näihin.

var TASK_FONT = UI_FONT;

// ---------- Mitä kello on ----------
// Tasatunti 1–12. Väärät vaihtoehdot ovat läheisiä tunteja, jotta viisarin
// asento on luettava tarkasti. Väärästä arvotaan uusi kello.
function makeClockProblem(t) {
  var hour = 1 + randInt(12);
  var pool = shuffleNums([hour - 2, hour - 1, hour + 1, hour + 2, hour + 3]);
  var wrong = [], i, h;
  for (i = 0; i < pool.length && wrong.length < 2; i++) {
    h = ((pool[i] - 1 + 12) % 12) + 1;
    if (h !== hour && wrong.indexOf(h) < 0) wrong.push(h);
  }
  var answers = shuffleNums([hour, wrong[0], wrong[1]]);
  t.orbs = 3;
  return { hour: hour, answers: answers, correct: answers.indexOf(hour) };
}

function drawClockFace(c, x, y, r, hour, minute) {
  var i, a;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath(); c.arc(x + r * 0.05, y + r * 0.07, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#8a4dff';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x, y, r * 0.88, 0, Math.PI * 2); c.fill();
  // Tuntimerkit ja numerot
  c.fillStyle = '#5a3a8a';
  c.font = 'bold ' + Math.round(r * 0.22) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 1; i <= 12; i++) {
    a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    c.beginPath(); c.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.035, 0, Math.PI * 2); c.fill();
    c.fillText(String(i), x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62 + r * 0.01);
  }
  // Minuuttiviisari (pitkä, ohut) ja tuntiviisari (lyhyt, paksu)
  c.lineCap = 'round';
  a = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  c.strokeStyle = '#6b5a80';
  c.lineWidth = Math.max(2, r * 0.06);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72); c.stroke();
  a = ((hour % 12) / 12 + minute / 720) * Math.PI * 2 - Math.PI / 2;
  c.strokeStyle = '#ff5f7e';
  c.lineWidth = Math.max(3, r * 0.1);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.46, y + Math.sin(a) * r * 0.46); c.stroke();
  c.fillStyle = '#ff5f7e';
  c.beginPath(); c.arc(x, y, r * 0.07, 0, Math.PI * 2); c.fill();
  c.lineCap = 'butt';
}

function orbClockContent(c, t, i, x, y, r) {
  c.fillStyle = '#5a3a8a';
  c.font = 'bold ' + Math.round(r * 0.9) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(t.data.answers[i]), x, y + r * 0.05);
}

function drawClockOverlay(c, t, shake, op) {
  var r = Math.min(viewH * 0.15, viewW * 0.12);
  var cx = viewW / 2 + shake, cy = viewH * 0.2;
  drawClockFace(c, cx - r * 0.5, cy, r, t.data.hour, 0);
  c.fillStyle = '#ffe27a';
  c.font = 'bold ' + Math.round(viewH * 0.08) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cx + r * 1.0, cy);
  // Pallorivi alemmas, jotta kello mahtuu
  var op2 = { r: op.r, xs: op.xs, y: viewH * 0.6 };
  drawTaskOrbs(c, t, shake, op2, orbClockContent);
}

function clockTap(t, px, py) {
  var op = orbPositions(t.orbs), i;
  for (i = 0; i < t.orbs; i++) {
    var dx = px - op.xs[i], dy = py - viewH * 0.6;
    if (Math.sqrt(dx * dx + dy * dy) < op.r * 1.4) { answerChoice(t, i, true); return; }
  }
}

TASK_TYPES.clock = {
  make: makeClockProblem, pitch: 659,
  tap: clockTap,
  draw: drawClockOverlay
};

// ---------- Maksa ----------
// Lipun hinta 3–9. Pöydällä rahoja: 1, 1, 1, 2, 2, 5. Napautettu raha lentää
// lautaselle; lautasen rahan napautus palauttaa sen. Summa yli hinnan pöhähtää
// ja kaikki rahat palaavat pöydälle.
var PAY_COINS = [5, 2, 2, 1, 1, 1];
function makePayProblem(t) {
  var price = 3 + randInt(7);
  var vals = shuffleNums(PAY_COINS.slice());
  var gap = Math.min(viewW * 0.13, viewH * 0.17), i, hx;
  var coins = [];
  for (i = 0; i < vals.length; i++) {
    hx = viewW / 2 + (i - (vals.length - 1) / 2) * gap;
    coins.push({ v: vals[i], x: hx, y: viewH * 0.76, homeX: hx, homeY: viewH * 0.76, inTray: false, flyT: -1, slot: -1 });
  }
  t.orbs = 0;
  return { price: price, coins: coins, sum: 0, resetT: 0, trayX: viewW / 2, trayY: viewH * 0.47 };
}

function payTrayPos(d, slot) {
  return { x: d.trayX + (slot - 2.5) * viewH * 0.052, y: d.trayY - viewH * 0.02 };
}

function payTap(t, px, py) {
  var d = t.data, i, best = null, bd = 1e9, dx, dy, dist, r = viewH * 0.07, k, used;
  if (d.resetT > 0) return;
  for (i = 0; i < d.coins.length; i++) {
    var cn = d.coins[i];
    var p = cn.inTray ? payTrayPos(d, cn.slot) : { x: cn.x, y: cn.y };
    dx = px - p.x; dy = py - p.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r && dist < bd) { bd = dist; best = cn; }
  }
  if (!best) return;
  if (best.inTray) {
    best.inTray = false;
    best.flyT = -1;
    d.sum -= best.v;
    playNote(440, 0, 0.1, 'sine', 0.25);
    return;
  }
  // Vapaa paikka lautasella
  used = {};
  for (i = 0; i < d.coins.length; i++) if (d.coins[i].inTray) used[d.coins[i].slot] = true;
  for (k = 0; k < 6; k++) if (!used[k]) break;
  best.inTray = true;
  best.slot = k;
  best.flyT = 0;
  d.sum += best.v;
  playNote(700 + best.v * 60, 0, 0.14, 'triangle', 0.35);
  if (d.sum === d.price) {
    taskSolved();
  } else if (d.sum > d.price) {
    d.resetT = 0.7;
    t.shakeT = 0.5;
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
  }
}

function updatePayTask(t, dt) {
  var d = t.data, i;
  for (i = 0; i < d.coins.length; i++) {
    if (d.coins[i].flyT >= 0 && d.coins[i].flyT < 1) d.coins[i].flyT = Math.min(1, d.coins[i].flyT + dt * 3);
  }
  if (d.resetT > 0) {
    d.resetT -= dt;
    if (d.resetT <= 0) {
      for (i = 0; i < d.coins.length; i++) { d.coins[i].inTray = false; d.coins[i].flyT = -1; }
      d.sum = 0;
      spawnSparkles(d.trayX, d.trayY, 12, '#c9c9c9');
    }
  }
}

function drawCoin(c, x, y, s, v) {
  var g = c.createRadialGradient(x - s * 0.3, y - s * 0.3, s * 0.1, x, y, s);
  if (v === 5) { g.addColorStop(0, '#fff1a8'); g.addColorStop(1, '#e0a800'); }
  else if (v === 2) { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#9aa4b8'); }
  else { g.addColorStop(0, '#ffd9b8'); g.addColorStop(1, '#c47a3a'); }
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath(); c.arc(x + s * 0.06, y + s * 0.1, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath(); c.arc(x, y, s * 0.78, 0, Math.PI * 2); c.stroke();
  c.fillStyle = v === 2 ? '#3a4560' : '#5a3a10';
  c.font = 'bold ' + Math.round(s * 1.1) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(v), x, y + s * 0.06);
}

function drawTicket(c, x, y, s, price) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.12);
  c.fillStyle = '#ff7bac';
  roundRect(c, -s * 1.3, -s * 0.7, s * 2.6, s * 1.4, s * 0.25);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  var i;
  for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(i * s * 1.3, 0, s * 0.22, 0, Math.PI * 2); c.fill(); }
  c.setLineDash([s * 0.12, s * 0.12]);
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1.5, s * 0.06);
  c.beginPath(); c.moveTo(-s * 0.45, -s * 0.55); c.lineTo(-s * 0.45, s * 0.55); c.stroke();
  c.setLineDash([]);
  drawStar(c, -s * 0.87, 0, s * 0.28, 0, 0);
  c.fillStyle = '#fff';
  c.font = 'bold ' + Math.round(s * 1.0) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(price), s * 0.45, s * 0.06);
  c.restore();
}

function drawPayOverlay(c, t, shake) {
  var d = t.data, i, cn, p, s = viewH * 0.038;
  var hx = viewW / 2 + shake, hy = viewH * 0.15;
  drawPromptBubble(c, hx, hy, viewH * 0.34, viewH * 0.13);
  drawTicket(c, hx - viewH * 0.05, hy, viewH * 0.04, d.price);
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(viewH * 0.06) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', hx + viewH * 0.1, hy + viewH * 0.005);
  // Lautanen
  var tx = d.trayX + shake, ty = d.trayY;
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath();
  if (c.ellipse) c.ellipse(tx, ty + viewH * 0.02, viewH * 0.2, viewH * 0.055, 0, 0, Math.PI * 2); else c.arc(tx, ty, viewH * 0.15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = d.resetT > 0 ? '#e0d0d8' : '#f4f0ff';
  c.beginPath();
  if (c.ellipse) c.ellipse(tx, ty, viewH * 0.2, viewH * 0.055, 0, 0, Math.PI * 2); else c.arc(tx, ty, viewH * 0.15, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#c9b8f0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  c.stroke();
  // Summa lautasen vieressä
  c.fillStyle = d.sum > d.price ? '#ff5f5f' : '#fff';
  c.font = 'bold ' + Math.round(viewH * 0.06) + 'px ' + TASK_FONT;
  c.fillText(String(d.sum), tx + viewH * 0.27, ty);
  // Rahat: pöydällä olevat ensin, lentävät päällimmäisenä
  for (i = 0; i < d.coins.length; i++) {
    cn = d.coins[i];
    if (cn.inTray) continue;
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath(); c.arc(cn.x + shake, cn.y, s * 1.5, 0, Math.PI * 2); c.fill();
    drawCoin(c, cn.x + shake, cn.y, s, cn.v);
  }
  for (i = 0; i < d.coins.length; i++) {
    cn = d.coins[i];
    if (!cn.inTray) continue;
    p = payTrayPos(d, cn.slot);
    var f = cn.flyT < 0 ? 1 : cn.flyT;
    var x = cn.homeX + (p.x - cn.homeX) * f, y = cn.homeY + (p.y - cn.homeY) * f - Math.sin(f * Math.PI) * viewH * 0.1;
    drawCoin(c, x + shake, y, s * 0.85, cn.v);
  }
}

TASK_TYPES.pay = {
  make: makePayProblem, pitch: 587,
  tap: payTap, update: updatePayTask,
  draw: drawPayOverlay
};

// ---------- Palapeli ----------
// Kuva piirretään omalle canvasille ja leikataan 2×2 (tai 3×2) palaan. Malli näkyy
// pienenä kuplassa; palat raahataan kehyksen ruutuihin. Palan id = ruudun id.
var JIGSAW_PICS = ['bunny', 'castle', 'flower', 'unicorn', 'balloon'];

function drawJigsawPicture(c, pic, w, h) {
  var i;
  var sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, pic === 'unicorn' ? '#2a1860' : '#8ed3ff');
  sky.addColorStop(1, pic === 'unicorn' ? '#7a4ea8' : '#e6f6ff');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  c.fillStyle = pic === 'unicorn' ? '#fff6c8' : '#ffe27a';
  c.beginPath(); c.arc(w * 0.82, h * 0.2, h * 0.1, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(c, w * 0.22, h * 0.18, h * 0.05);
  var grass = c.createLinearGradient(0, h * 0.72, 0, h);
  grass.addColorStop(0, '#9fdc7f');
  grass.addColorStop(1, '#4ea84f');
  c.fillStyle = grass;
  c.fillRect(0, h * 0.72, w, h * 0.28);
  for (i = 0; i < 5; i++) drawFlower(c, w * (0.1 + i * 0.2), h * (0.82 + (i % 2) * 0.08), h * 0.025, ['#ff7bac', '#ffd24f', '#b78bff', '#ff9d5c', '#7fd4ff'][i]);
  if (pic === 'bunny') {
    drawBunny(c, w * 0.5, h * 0.78, h * 0.26, 0, 0, false);
  } else if (pic === 'castle') {
    drawCastle(c, w * 0.5, h * 0.76, h * 0.42);
  } else if (pic === 'flower') {
    c.strokeStyle = '#4ea84f';
    c.lineWidth = h * 0.03;
    c.beginPath(); c.moveTo(w * 0.5, h * 0.78); c.lineTo(w * 0.5, h * 0.45); c.stroke();
    c.fillStyle = '#5fd36b';
    c.beginPath();
    if (c.ellipse) c.ellipse(w * 0.6, h * 0.66, h * 0.11, h * 0.05, -0.6, 0, Math.PI * 2); else c.arc(w * 0.6, h * 0.66, h * 0.07, 0, Math.PI * 2);
    c.fill();
    drawFlower(c, w * 0.5, h * 0.38, h * 0.11, '#ff7bac');
  } else if (pic === 'unicorn') {
    drawUnicorn(c, w * 0.5, h * 0.8, h * 0.0052, 1, 0, false, 1.0);
  } else {
    // Kuumailmapallo
    c.fillStyle = '#8a5a30';
    c.fillRect(w * 0.42, h * 0.6, w * 0.16, h * 0.1);
    c.strokeStyle = '#8a5a30';
    c.lineWidth = h * 0.012;
    c.beginPath(); c.moveTo(w * 0.43, h * 0.6); c.lineTo(w * 0.35, h * 0.44); c.moveTo(w * 0.57, h * 0.6); c.lineTo(w * 0.65, h * 0.44); c.stroke();
    for (i = 0; i < 6; i++) {
      c.fillStyle = maneColors[i];
      c.beginPath();
      c.moveTo(w * 0.5, h * 0.3);
      c.arc(w * 0.5, h * 0.3, h * 0.2, (i / 6) * Math.PI * 2 - Math.PI / 2, ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2);
      c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = h * 0.015;
    c.beginPath(); c.arc(w * 0.5, h * 0.3, h * 0.2, 0, Math.PI * 2); c.stroke();
  }
}

function makeJigsawProblem(t) {
  var cols = (t.opts && t.opts.pieces === 6) ? 3 : 2, rows = 2;
  var pic = JIGSAW_PICS[randInt(JIGSAW_PICS.length)];
  var cell = Math.min(viewH * 0.17, viewW * 0.12);
  var pw = cell * cols, ph = cell * rows;
  var cv = document.createElement('canvas');
  cv.width = Math.round(pw * DPR);
  cv.height = Math.round(ph * DPR);
  var cc = cv.getContext('2d');
  cc.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawJigsawPicture(cc, pic, pw, ph);
  var fx0 = viewW / 2 - pw / 2, fy0 = viewH * 0.36 - ph / 2;
  var n = cols * rows, order = shuffleNums([0, 1, 2, 3, 4, 5].slice(0, n)), i, k, hx;
  var gap = Math.min(viewW * 0.16, cell * 1.12);
  var pieces = [], targets = [];
  for (i = 0; i < n; i++) {
    k = order[i];
    hx = viewW / 2 + (i - (n - 1) / 2) * gap;
    pieces.push({
      id: k, sx: (k % cols) * cell, sy: Math.floor(k / cols) * cell,
      x: hx, y: viewH * 0.8, homeX: hx, homeY: viewH * 0.8, placed: false, dragging: false, ox: 0, oy: 0
    });
    targets.push({ id: i, x: fx0 + (i % cols + 0.5) * cell, y: fy0 + (Math.floor(i / cols) + 0.5) * cell, filled: false });
  }
  return { pic: pic, canvas: cv, cols: cols, rows: rows, cell: cell, fx0: fx0, fy0: fy0, pieces: pieces, targets: targets };
}

function drawJigsawPiece(c, d, p, x, y, scale) {
  var cell = d.cell * scale;
  c.save();
  roundRect(c, x - cell / 2, y - cell / 2, cell, cell, cell * 0.08);
  c.clip();
  c.drawImage(d.canvas, p.sx * DPR, p.sy * DPR, d.cell * DPR, d.cell * DPR, x - cell / 2, y - cell / 2, cell, cell);
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1.5, cell * 0.035);
  roundRect(c, x - cell / 2, y - cell / 2, cell, cell, cell * 0.08);
  c.stroke();
}

function drawJigsawOverlay(c, t, shake) {
  var d = t.data, i, p, tg;
  // Malli kuplassa
  var mw = d.cell * d.cols * 0.42, mh = d.cell * d.rows * 0.42;
  var hx = viewW / 2 + shake, hy = viewH * 0.11;
  drawPromptBubble(c, hx, hy, mw + viewH * 0.12, mh + viewH * 0.03);
  c.drawImage(d.canvas, 0, 0, d.canvas.width, d.canvas.height, hx - mw / 2 - viewH * 0.03, hy - mh / 2, mw, mh);
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(viewH * 0.055) + 'px ' + TASK_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', hx + mw / 2 + viewH * 0.02, hy + viewH * 0.005);
  // Kehys
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, d.fx0 - d.cell * 0.12 + shake, d.fy0 - d.cell * 0.12, d.cell * d.cols + d.cell * 0.24, d.cell * d.rows + d.cell * 0.24, d.cell * 0.15);
  c.fill();
  c.strokeStyle = '#d9b98a';
  c.lineWidth = Math.max(3, d.cell * 0.06);
  c.stroke();
  for (i = 0; i < d.targets.length; i++) {
    tg = d.targets[i];
    if (tg.filled) continue;
    c.setLineDash([d.cell * 0.08, d.cell * 0.08]);
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1.5, d.cell * 0.025);
    roundRect(c, tg.x - d.cell * 0.47 + shake, tg.y - d.cell * 0.47, d.cell * 0.94, d.cell * 0.94, d.cell * 0.08);
    c.stroke();
    c.setLineDash([]);
  }
  for (i = 0; i < d.pieces.length; i++) {
    p = d.pieces[i];
    if (p.dragging) continue;
    drawJigsawPiece(c, d, p, p.x + shake, p.y, p.placed ? 1 : 0.8);
  }
  for (i = 0; i < d.pieces.length; i++) {
    p = d.pieces[i];
    if (!p.dragging) continue;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(c, p.x - d.cell / 2 + 6, p.y - d.cell / 2 + 8, d.cell, d.cell, d.cell * 0.08);
    c.fill();
    drawJigsawPiece(c, d, p, p.x, p.y, 1);
  }
}

TASK_TYPES.jigsaw = {
  make: makeJigsawProblem, pitch: 740, drag: true,
  draw: drawJigsawOverlay
};

// ---------- Reitti ----------
// 4×4 ruudukko: pupu lähtee, porkkana odottaa, pensaat tukkivat. Napauta nuolia
// ohjelmariville, ▶ ajaa ohjelman askel kerrallaan. Pensaaseen tai reunaan
// törmäys palauttaa pupun alkuun (ohjelma säilyy, viimeisen askeleen voi poistaa
// rivin napautuksella). Perillä porkkanalla tehtävä ratkeaa.
var ROUTE_N = 4;
var ROUTE_MAX = 6;
var ROUTE_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // ylös, oikea, alas, vasen

function makeRouteProblem(t) {
  var n = ROUTE_N, tries = 0, path, cells, ok, len, dir, turns, c, r, i, k, nc, nr, key;
  var blocks = [];
  do {
    tries++;
    len = 3 + randInt(3);
    c = randInt(n); r = randInt(n);
    path = [];
    cells = {};
    cells[c + ',' + r] = true;
    dir = randInt(4);
    turns = 0;
    ok = true;
    for (i = 0; i < len; i++) {
      if (i > 0 && turns < 2 && Math.random() < 0.4) {
        dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
        turns++;
      }
      nc = c + ROUTE_DIRS[dir][0]; nr = r + ROUTE_DIRS[dir][1];
      // Jos suunta ei kelpaa, käännä
      for (k = 0; k < 4 && (nc < 0 || nr < 0 || nc >= n || nr >= n || cells[nc + ',' + nr]); k++) {
        dir = (dir + 1) % 4;
        nc = c + ROUTE_DIRS[dir][0]; nr = r + ROUTE_DIRS[dir][1];
      }
      if (nc < 0 || nr < 0 || nc >= n || nr >= n || cells[nc + ',' + nr]) { ok = false; break; }
      path.push(dir);
      c = nc; r = nr;
      cells[c + ',' + r] = true;
    }
  } while (!ok && tries < 50);
  var start = { c: parseInt(Object.keys(cells)[0].split(',')[0], 10), r: parseInt(Object.keys(cells)[0].split(',')[1], 10) };
  var goal = { c: c, r: r };
  // Pensaat: 2–3 ruutua polun vierestä, ei polulle
  var cand = [];
  for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
    key = c + ',' + r;
    if (cells[key]) continue;
    var near = false;
    for (k = 0; k < 4; k++) if (cells[(c + ROUTE_DIRS[k][0]) + ',' + (r + ROUTE_DIRS[k][1])]) near = true;
    if (near) cand.push({ c: c, r: r });
  }
  shuffleNums(cand);
  for (i = 0; i < cand.length && blocks.length < 3; i++) blocks.push(cand[i]);
  t.orbs = 0;
  return {
    n: n, start: start, goal: goal, blocks: blocks, solution: path,
    prog: [], running: false, step: -1, stepT: 0,
    bunny: { c: start.c, r: start.r, fc: start.c, fr: start.r, hop: 0 },
    failT: 0, doneT: -1
  };
}

function routeCell() {
  return Math.min(viewH * 0.13, viewW * 0.1);
}
function routeGridPos(d, c, r) {
  var cs = routeCell();
  var x0 = viewW * 0.36 - d.n * cs / 2, y0 = viewH * 0.55 - d.n * cs / 2;
  return { x: x0 + (c + 0.5) * cs, y: y0 + (r + 0.5) * cs, cs: cs };
}
function routeButtons() {
  var cs = routeCell();
  var bx = viewW * 0.78, by = viewH * 0.5, g = cs * 0.95;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    play: { x: bx, y: by + g * 2.35, r: cs * 0.42 },
    r: cs * 0.4
  };
}
function routeSlotPos(d, i) {
  var cs = routeCell() * 0.62;
  var x0 = viewW * 0.36 - (ROUTE_MAX - 1) * cs * 0.55;
  return { x: x0 + i * cs * 1.1, y: viewH * 0.2, s: cs };
}

function routeIsBlocked(d, c, r) {
  var i;
  if (c < 0 || r < 0 || c >= d.n || r >= d.n) return true;
  for (i = 0; i < d.blocks.length; i++) if (d.blocks[i].c === c && d.blocks[i].r === r) return true;
  return false;
}

function routeTap(t, px, py) {
  var d = t.data, b = routeButtons(), i, dx, dy, p;
  if (d.running || d.doneT >= 0) return;
  for (i = 0; i < b.arrows.length; i++) {
    dx = px - b.arrows[i].x; dy = py - b.arrows[i].y;
    if (dx * dx + dy * dy < b.r * b.r * 1.6) {
      if (d.prog.length >= ROUTE_MAX) { t.shakeT = 0.3; playNote(170, 0, 0.2, 'sawtooth', 0.15); return; }
      d.prog.push(b.arrows[i].dir);
      playNote(523 + d.prog.length * 40, 0, 0.1, 'triangle', 0.3);
      return;
    }
  }
  dx = px - b.play.x; dy = py - b.play.y;
  if (dx * dx + dy * dy < b.play.r * b.play.r * 1.8) {
    if (d.prog.length === 0) { t.shakeT = 0.3; playNote(170, 0, 0.2, 'sawtooth', 0.15); return; }
    d.running = true;
    d.step = -1;
    d.stepT = 0.3;
    d.bunny.c = d.start.c; d.bunny.r = d.start.r; d.bunny.fc = d.bunny.c; d.bunny.fr = d.bunny.r;
    playNote(784, 0, 0.12, 'triangle', 0.35);
    playNote(988, 0.1, 0.16, 'triangle', 0.35);
    return;
  }
  // Ohjelmarivi: napautus poistaa viimeisen askeleen
  for (i = 0; i < ROUTE_MAX; i++) {
    p = routeSlotPos(d, i);
    if (Math.abs(px - p.x) < p.s * 0.55 && Math.abs(py - p.y) < p.s * 0.55) {
      if (d.prog.length > 0) { d.prog.pop(); playNote(392, 0, 0.1, 'sine', 0.25); }
      return;
    }
  }
}

function routeFail(d, t) {
  d.running = false;
  d.failT = 0.9;
  t.shakeT = 0.5;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
}

function updateRouteTask(t, dt) {
  var d = t.data, b = d.bunny;
  b.hop = Math.max(0, b.hop - dt * 4);
  if (d.failT > 0) {
    d.failT -= dt;
    if (d.failT <= 0) { b.c = d.start.c; b.r = d.start.r; b.fc = b.c; b.fr = b.r; }
  }
  // Pehmeä liike kohti ruutua
  b.fc += (b.c - b.fc) * Math.min(1, dt * 9);
  b.fr += (b.r - b.fr) * Math.min(1, dt * 9);
  if (!d.running) return;
  d.stepT -= dt;
  if (d.stepT > 0) return;
  d.stepT = 0.5;
  d.step++;
  if (d.step >= d.prog.length) {
    if (b.c === d.goal.c && b.r === d.goal.r) { d.running = false; taskSolved(); }
    else routeFail(d, t);
    return;
  }
  var dir = ROUTE_DIRS[d.prog[d.step]];
  var nc = b.c + dir[0], nr = b.r + dir[1];
  if (routeIsBlocked(d, nc, nr)) {
    b.fc = b.c + dir[0] * 0.3; b.fr = b.r + dir[1] * 0.3;
    routeFail(d, t);
    return;
  }
  b.c = nc; b.r = nr; b.hop = 1;
  playNote(600 + d.step * 50, 0, 0.08, 'sine', 0.25);
  if (b.c === d.goal.c && b.r === d.goal.r) {
    d.running = false;
    spawnSparkles(routeGridPos(d, nc, nr).x, routeGridPos(d, nc, nr).y, 16, '#ffe27a');
    taskSolved();
  }
}

function drawArrowGlyph(c, x, y, s, dir, color) {
  var a = dir * Math.PI / 2;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, -s);
  c.lineTo(s * 0.8, 0);
  c.lineTo(s * 0.3, 0);
  c.lineTo(s * 0.3, s * 0.9);
  c.lineTo(-s * 0.3, s * 0.9);
  c.lineTo(-s * 0.3, 0);
  c.lineTo(-s * 0.8, 0);
  c.closePath();
  c.fill();
  c.restore();
}

function drawCarrotGlyph(c, x, y, s) {
  c.fillStyle = '#ff8f3a';
  c.beginPath();
  c.moveTo(x - s * 0.4, y - s * 0.3);
  c.quadraticCurveTo(x - s * 0.25, y + s * 0.6, x, y + s);
  c.quadraticCurveTo(x + s * 0.25, y + s * 0.6, x + s * 0.4, y - s * 0.3);
  c.closePath(); c.fill();
  c.fillStyle = '#5fd36b';
  var i;
  for (i = -1; i <= 1; i++) {
    c.beginPath();
    if (c.ellipse) c.ellipse(x + i * s * 0.2, y - s * 0.55, s * 0.11, s * 0.3, i * 0.5, 0, Math.PI * 2); else c.arc(x + i * s * 0.2, y - s * 0.55, s * 0.15, 0, Math.PI * 2);
    c.fill();
  }
}

function drawRouteOverlay(c, t, shake) {
  var d = t.data, i, r, k, p, b = routeButtons(), cs = routeCell();
  // Vihje: pupu → porkkana
  var hx = viewW * 0.78 + shake, hy = viewH * 0.14;
  drawPromptBubble(c, hx, hy, viewH * 0.3, viewH * 0.11);
  drawBunny(c, hx - viewH * 0.09, hy + viewH * 0.005, viewH * 0.03, 0, 0, true);
  drawArrowGlyph(c, hx, hy, viewH * 0.02, 1, '#8a2be2');
  drawCarrotGlyph(c, hx + viewH * 0.09, hy - viewH * 0.01, viewH * 0.025);
  // Ohjelmarivi
  for (i = 0; i < ROUTE_MAX; i++) {
    p = routeSlotPos(d, i);
    var active = d.running && i === d.step;
    c.fillStyle = active ? '#ffe27a' : (i < d.prog.length ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.25)');
    roundRect(c, p.x - p.s / 2 + shake, p.y - p.s / 2, p.s, p.s, p.s * 0.2);
    c.fill();
    if (i < d.prog.length) drawArrowGlyph(c, p.x + shake, p.y, p.s * 0.3, d.prog[i], '#5a3a8a');
  }
  // Ruudukko
  for (r = 0; r < d.n; r++) {
    for (k = 0; k < d.n; k++) {
      p = routeGridPos(d, k, r);
      c.fillStyle = (k + r) % 2 ? '#9fdc7f' : '#8fd06f';
      roundRect(c, p.x - cs * 0.48 + shake, p.y - cs * 0.48, cs * 0.96, cs * 0.96, cs * 0.1);
      c.fill();
    }
  }
  for (i = 0; i < d.blocks.length; i++) {
    p = routeGridPos(d, d.blocks[i].c, d.blocks[i].r);
    drawBush(c, p.x + shake, p.y + cs * 0.4, cs * 0.28);
  }
  p = routeGridPos(d, d.goal.c, d.goal.r);
  drawCarrotGlyph(c, p.x + shake, p.y - cs * 0.1, cs * 0.28);
  p = routeGridPos(d, d.start.c, d.start.r);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.arc(p.x + shake, p.y + cs * 0.3, cs * 0.3, 0, Math.PI * 2); c.fill();
  // Pupu
  var bp = routeGridPos(d, d.bunny.fc, d.bunny.fr);
  drawBunny(c, bp.x + shake, bp.y + cs * 0.35, cs * 0.26, Math.sin(d.bunny.hop * Math.PI) * cs * 0.2, globalT * 3, false);
  if (d.failT > 0) {
    c.fillStyle = '#ff5f5f';
    c.font = 'bold ' + Math.round(cs * 0.5) + 'px ' + TASK_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', bp.x + shake, bp.y - cs * 0.55);
  }
  // Nuolinapit ja ▶
  for (i = 0; i < b.arrows.length; i++) {
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath(); c.arc(b.arrows[i].x + shake, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
    c.fillStyle = d.running ? '#c9b8e0' : '#ffffff';
    c.beginPath(); c.arc(b.arrows[i].x + shake, b.arrows[i].y, b.r, 0, Math.PI * 2); c.fill();
    drawArrowGlyph(c, b.arrows[i].x + shake, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, '#8a2be2');
  }
  var pulse = d.prog.length > 0 && !d.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath(); c.arc(b.play.x + shake, b.play.y + b.play.r * 0.12, b.play.r * pulse, 0, Math.PI * 2); c.fill();
  c.fillStyle = d.running ? '#8fd06f' : '#3ccf6a';
  c.beginPath(); c.arc(b.play.x + shake, b.play.y, b.play.r * pulse, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(b.play.x - b.play.r * 0.3 + shake, b.play.y - b.play.r * 0.42);
  c.lineTo(b.play.x + b.play.r * 0.48 + shake, b.play.y);
  c.lineTo(b.play.x - b.play.r * 0.3 + shake, b.play.y + b.play.r * 0.42);
  c.closePath(); c.fill();
}

TASK_TYPES.route = {
  make: makeRouteProblem, pitch: 698,
  tap: routeTap, update: updateRouteTask,
  draw: drawRouteOverlay
};
