'use strict';

// Lisää tehtävätyyppejä (Vuorisaari):
//   sort   – lajittele: raahaa kuusi kuviota kahteen koriin värin tai muodon mukaan
//   order  – järjestä koon mukaan: raahaa neljä kuviota pienimmästä suurimpaan
//   mirror – peilikuva: napauta oikean puolen ruutuja, kunnes kuva on vasemman peilikuva
//   dots   – yhdistä pisteet: napauta numerot 1…N järjestyksessä, kuva piirtyy
// Perusrunko (taskStart, handleTaskTap, taskDrop, drawTaskOverlay) haarautuu näihin.

// ---------- Lajittele ----------
// Kaksi koria: joko värin mukaan (korissa värilaikku, kuviot vaihtelevat) tai
// muodon mukaan (korissa harmaa muoto, värit vaihtelevat). Kolme palaa per kori.
function makeSortProblem(t) {
  var byColor = Math.random() < 0.5, i, k, hx;
  var kinds = shuffleNums(SHAPE_KINDS.slice()).slice(0, 3);
  var cols = shuffleNums([0, 1, 2, 3]).slice(0, 3);
  var gap = Math.min(viewW * 0.14, viewH * 0.17);
  var order = shuffleNums([0, 1, 0, 1, 0, 1]);
  t.byColor = byColor;
  t.baskets = [];
  for (k = 0; k < 2; k++) {
    t.baskets.push({
      id: k, x: viewW / 2 + (k - 0.5) * Math.min(viewW * 0.38, viewH * 0.5), y: viewH * 0.36,
      kind: byColor ? null : kinds[k], color: byColor ? cols[k] : null, count: 0
    });
  }
  t.pieces = [];
  for (i = 0; i < 6; i++) {
    k = order[i];
    hx = viewW / 2 + (i - 2.5) * gap;
    t.pieces.push({
      id: k,
      kind: byColor ? kinds[randInt(3)] : kinds[k],
      color: byColor ? cols[k] : cols[randInt(3)],
      x: hx, y: viewH * 0.76, homeX: hx, homeY: viewH * 0.76, placed: false, dragging: false, ox: 0, oy: 0
    });
  }
}

function sortDrop(t, p) {
  var i, best = null, bd = 1e9, d, r = viewH * 0.17, all = true;
  for (i = 0; i < t.baskets.length; i++) {
    d = pieceDist(p, t.baskets[i]);
    if (d < r && d < bd) { bd = d; best = t.baskets[i]; }
  }
  if (best && best.id === p.id) {
    p.placed = true;
    p.x = best.x + (best.count - 1) * viewH * 0.05;
    p.y = best.y + viewH * 0.02;
    best.count++;
    playNote(TASK_BF_NOTES[best.count % TASK_BF_NOTES.length], 0, 0.22, 'triangle', 0.4);
    for (i = 0; i < t.pieces.length; i++) if (!t.pieces[i].placed) all = false;
    if (all) taskSolved();
    return;
  }
  if (best) {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
  }
  p.x = p.homeX;
  p.y = p.homeY;
}

function drawBasket(c, x, y, s, shake) {
  c.fillStyle = '#c98b4a';
  c.beginPath();
  c.moveTo(x - s * 1.5 + shake, y - s * 0.55);
  c.lineTo(x + s * 1.5 + shake, y - s * 0.55);
  c.lineTo(x + s * 1.2 + shake, y + s * 0.6);
  c.lineTo(x - s * 1.2 + shake, y + s * 0.6);
  c.closePath();
  c.fill();
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2, s * 0.08);
  c.beginPath();
  c.moveTo(x - s * 1.5 + shake, y - s * 0.55); c.lineTo(x + s * 1.5 + shake, y - s * 0.55);
  c.moveTo(x - s * 1.4 + shake, y - s * 0.15); c.lineTo(x + s * 1.4 + shake, y - s * 0.15);
  c.moveTo(x - s * 1.3 + shake, y + s * 0.25); c.lineTo(x + s * 1.3 + shake, y + s * 0.25);
  c.stroke();
}

function drawSortOverlay(c, t, shake) {
  var i, b, p, s = viewH * 0.045;
  for (i = 0; i < t.baskets.length; i++) {
    b = t.baskets[i];
    drawBasket(c, b.x, b.y, viewH * 0.06, shake);
    // Korin merkki: värilaikku tai harmaa muoto
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.beginPath(); c.arc(b.x + shake, b.y - viewH * 0.15, viewH * 0.055, 0, Math.PI * 2); c.fill();
    if (t.byColor) {
      c.fillStyle = TASK_BF_COLORS[b.color];
      c.beginPath();
      c.arc(b.x + shake, b.y - viewH * 0.15, viewH * 0.03, 0, Math.PI * 2);
      c.arc(b.x + shake + viewH * 0.022, b.y - viewH * 0.168, viewH * 0.016, 0, Math.PI * 2);
      c.arc(b.x + shake - viewH * 0.024, b.y - viewH * 0.13, viewH * 0.013, 0, Math.PI * 2);
      c.fill();
    } else {
      drawShape(c, b.kind, b.x + shake, b.y - viewH * 0.15, viewH * 0.03, '#6b6580', 0);
    }
  }
  c.fillStyle = '#ffe27a';
  c.font = 'bold ' + Math.round(viewH * 0.08) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', viewW / 2 + shake, viewH * 0.3);
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) continue;
    if (!p.placed) {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath(); c.arc(p.x + shake, p.y, s * 1.6, 0, Math.PI * 2); c.fill();
    }
    drawShape(c, p.kind, p.x + shake, p.y, p.placed ? s * 0.8 : s, TASK_BF_COLORS[p.color], 0);
  }
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (!p.dragging) continue;
    drawShape(c, p.kind, p.x + 5, p.y + 6, s, 'rgba(0,0,0,0.22)', 0);
    drawShape(c, p.kind, p.x, p.y, s, TASK_BF_COLORS[p.color], 0);
  }
}

// ---------- Järjestä koon mukaan ----------
// Neljä samanlaista kuviota eri kokoisina; paikat ylhäällä pienimmästä suurimpaan.
// Palan id = kokojärjestys, paikan id = sijainti -> taskDrop tarkistaa id === id.
var ORDER_SCALES = [0.5, 0.74, 0.98, 1.24];
function makeOrderProblem(t) {
  var kind = SHAPE_KINDS[randInt(SHAPE_KINDS.length)];
  var color = randInt(TASK_BF_COLORS.length);
  var perm = shuffleNums([0, 1, 2, 3]);
  var gap = Math.min(viewW * 0.2, viewH * 0.27);
  var i, hx;
  t.pieces = [];
  t.targets = [];
  for (i = 0; i < 4; i++) {
    hx = viewW / 2 + (i - 1.5) * gap;
    t.targets.push({ id: i, x: hx, y: viewH * 0.33, filled: false });
    t.pieces.push({
      id: perm[i], kind: kind, color: color, scale: ORDER_SCALES[perm[i]],
      x: hx, y: viewH * 0.74, homeX: hx, homeY: viewH * 0.74, placed: false, dragging: false, ox: 0, oy: 0
    });
  }
}

function drawOrderPiece(c, p, x, y) {
  var s = viewH * 0.045 * p.scale;
  drawShape(c, p.kind, x, y, s, TASK_BF_COLORS[p.color], 0);
}

function drawOrderOverlay(c, t, shake) {
  var i, tg, p, s = viewH * 0.045, step;
  // Portaat: paikat pienimmästä suurimpaan
  for (i = 0; i < t.targets.length; i++) {
    tg = t.targets[i];
    step = viewH * (0.03 + i * 0.022);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(c, tg.x - viewH * 0.075 + shake, tg.y + viewH * 0.07, viewH * 0.15, step, viewH * 0.012);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath(); c.arc(tg.x + shake, tg.y, viewH * 0.075, 0, Math.PI * 2); c.fill();
    if (!tg.filled) {
      c.setLineDash([viewH * 0.012, viewH * 0.012]);
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(2, viewH * 0.004);
      c.beginPath(); c.arc(tg.x + shake, tg.y, s * ORDER_SCALES[i] * 1.15, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
    }
  }
  // Vihje: pieni -> iso
  var hx = viewW / 2 + shake, hy = viewH * 0.12;
  drawPromptBubble(c, hx, hy, viewH * 0.3, viewH * 0.11);
  c.fillStyle = '#8a2be2';
  for (i = 0; i < 3; i++) {
    c.beginPath(); c.arc(hx - viewH * 0.09 + i * viewH * 0.055, hy, viewH * (0.012 + i * 0.008), 0, Math.PI * 2); c.fill();
  }
  c.font = 'bold ' + Math.round(viewH * 0.06) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', hx + viewH * 0.09, hy + viewH * 0.005);
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) continue;
    if (!p.placed) {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath(); c.arc(p.x + shake, p.y, s * 1.8, 0, Math.PI * 2); c.fill();
    }
    drawOrderPiece(c, p, p.x + shake, p.y);
  }
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (!p.dragging) continue;
    drawShape(c, p.kind, p.x + 5, p.y + 6, viewH * 0.045 * p.scale, 'rgba(0,0,0,0.22)', 0);
    drawOrderPiece(c, p, p.x, p.y);
  }
}

// ---------- Peilikuva ----------
// 3×3 ruudukko molemmin puolin peiliviivaa. Vasemmalla malli, oikealle napautetaan
// ruutuja päälle/pois. Valmis, kun oikea puoli on vasemman peilikuva.
function makeMirrorProblem(t) {
  var n = 3, r, c, filled, left, right;
  do {
    filled = 0;
    left = [];
    for (r = 0; r < n; r++) {
      left.push([]);
      for (c = 0; c < n; c++) {
        left[r].push(Math.random() < 0.45 ? 1 : 0);
        filled += left[r][c];
      }
    }
  } while (filled < 3 || filled > 5);
  right = [];
  for (r = 0; r < n; r++) { right.push([]); for (c = 0; c < n; c++) right[r].push(0); }
  t.grid = { n: n, left: left, right: right, color: randInt(TASK_BF_COLORS.length), kind: TASK_GLYPH_KINDS[randInt(TASK_GLYPH_KINDS.length)] };
}

function mirrorCell() {
  return Math.min(viewH * 0.1, viewW * 0.075);
}

// Ruudun keskipiste: side 0 = vasen, 1 = oikea; c = sarake vasemmalta
function mirrorCellPos(side, c, r) {
  var cs = mirrorCell(), n = 3, midGap = cs * 0.35;
  var x0 = side === 0 ? viewW / 2 - midGap - n * cs : viewW / 2 + midGap;
  return { x: x0 + (c + 0.5) * cs, y: viewH * 0.55 - n * cs / 2 + (r + 0.5) * cs };
}

function mirrorSolved(g) {
  var r, c;
  for (r = 0; r < g.n; r++) for (c = 0; c < g.n; c++) if (g.right[r][c] !== g.left[r][g.n - 1 - c]) return false;
  return true;
}

function mirrorTap(t, px, py) {
  var g = t.grid, r, c, p, cs = mirrorCell();
  for (r = 0; r < g.n; r++) {
    for (c = 0; c < g.n; c++) {
      p = mirrorCellPos(1, c, r);
      if (Math.abs(px - p.x) < cs / 2 && Math.abs(py - p.y) < cs / 2) {
        g.right[r][c] = g.right[r][c] ? 0 : 1;
        playNote(g.right[r][c] ? 740 : 440, 0, 0.1, 'sine', 0.3);
        if (mirrorSolved(g)) taskSolved();
        return;
      }
    }
  }
}

function drawMirrorOverlay(c, t, shake) {
  var g = t.grid, r, k, p, cs = mirrorCell(), side, v;
  // Vihje: perhonen (symmetria) ja kysymysmerkki
  var hx = viewW / 2 + shake, hy = viewH * 0.14;
  drawPromptBubble(c, hx, hy, viewH * 0.26, viewH * 0.11);
  drawButterfly(c, hx - viewH * 0.05, hy, viewH * 0.035, globalT, '#c9a0ff');
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(viewH * 0.06) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', hx + viewH * 0.06, hy + viewH * 0.005);
  // Peiliviiva
  var my0 = viewH * 0.55 - g.n * cs / 2 - cs * 0.3, my1 = viewH * 0.55 + g.n * cs / 2 + cs * 0.3;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(3, cs * 0.06);
  c.setLineDash([cs * 0.18, cs * 0.12]);
  c.beginPath(); c.moveTo(viewW / 2 + shake, my0); c.lineTo(viewW / 2 + shake, my1); c.stroke();
  c.setLineDash([]);
  drawStar(c, viewW / 2 + shake, my0 - cs * 0.2, cs * 0.16, globalT, 0.6);
  for (side = 0; side < 2; side++) {
    for (r = 0; r < g.n; r++) {
      for (k = 0; k < g.n; k++) {
        p = mirrorCellPos(side, k, r);
        v = side === 0 ? g.left[r][k] : g.right[r][k];
        c.fillStyle = side === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)';
        roundRect(c, p.x - cs * 0.46 + shake, p.y - cs * 0.46, cs * 0.92, cs * 0.92, cs * 0.12);
        c.fill();
        if (side === 1) {
          c.strokeStyle = 'rgba(138,43,226,0.35)';
          c.lineWidth = Math.max(1.5, cs * 0.03);
          c.stroke();
        }
        if (v) drawTaskGlyph(c, g.kind, p.x + shake, p.y, cs * 0.3, TASK_BF_COLORS[g.color], 0);
      }
    }
  }
}

// ---------- Yhdistä pisteet ----------
// Pisteet numeroina kuvion ääriviivalla. Seuraava numero hehkuu, jotta järjestys
// löytyy ilman lukutaitoa. Väärä piste ravistaa; oikea vetää viivan. Lopuksi kuvio täyttyy.
var DOT_SHAPES = [
  { name: 'star', color: '#ffd94f', pts: [[0, -1], [0.59, 0.81], [-0.95, -0.31], [0.95, -0.31], [-0.59, 0.81]] },
  { name: 'house', color: '#ff9ec6', pts: [[-0.8, 0.9], [-0.8, -0.2], [0, -0.95], [0.8, -0.2], [0.8, 0.9]] },
  { name: 'heart', color: '#ff5f7e', pts: [[0, 0.95], [-0.95, -0.1], [-0.55, -0.85], [0, -0.35], [0.55, -0.85], [0.95, -0.1]] },
  { name: 'gem', color: '#7fd4ff', pts: [[-0.55, -0.7], [0.55, -0.7], [0.95, -0.15], [0, 0.95], [-0.95, -0.15]] },
  { name: 'tree', color: '#6fd66f', pts: [[0, -0.95], [0.9, 0.45], [0.3, 0.45], [0.3, 0.95], [-0.3, 0.95], [-0.3, 0.45], [-0.9, 0.45]] }
];

function makeDotsProblem(t) {
  var shape = DOT_SHAPES[randInt(DOT_SHAPES.length)], i;
  var R = Math.min(viewH * 0.3, viewW * 0.22), cx = viewW / 2, cy = viewH * 0.54;
  t.dots = { shape: shape, pts: [], next: 0, wrongT: 0, wrongIdx: -1, done: false };
  for (i = 0; i < shape.pts.length; i++) {
    t.dots.pts.push({ x: cx + shape.pts[i][0] * R, y: cy + shape.pts[i][1] * R });
  }
  t.orbs = 0;
}

function dotsTap(t, px, py) {
  var d = t.dots, i, dx, dy, r = viewH * 0.06, hit = -1, bd = 1e9, dist;
  if (d.done) return;
  for (i = 0; i < d.pts.length; i++) {
    dx = px - d.pts[i].x;
    dy = py - d.pts[i].y;
    dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r && dist < bd) { bd = dist; hit = i; }
  }
  if (hit < 0) return;
  if (hit === d.next) {
    d.next++;
    playNote(523 + hit * 66, 0, 0.25, 'triangle', 0.4);
    spawnSparkles(d.pts[hit].x, d.pts[hit].y, 6, '#ffe27a');
    if (d.next >= d.pts.length) {
      d.done = true;
      spawnSparkles(viewW / 2, viewH * 0.54, 20, d.shape.color);
      taskSolved();
    }
  } else if (hit < d.next) {
    playNote(440, 0, 0.08, 'sine', 0.2);
  } else {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
    d.wrongT = 0.6;
    d.wrongIdx = hit;
  }
}

function updateDotsTask(t, dt) {
  if (t.dots && t.dots.wrongT > 0) t.dots.wrongT -= dt;
}

function drawDotsOverlay(c, t, shake) {
  var d = t.dots, i, p, q, r = viewH * 0.036, n = d.pts.length;
  // Valmis kuvio täyttyy
  if (d.done) {
    c.fillStyle = d.shape.color;
    c.globalAlpha = 0.75;
    c.beginPath();
    for (i = 0; i < n; i++) { p = d.pts[i]; if (i === 0) c.moveTo(p.x + shake, p.y); else c.lineTo(p.x + shake, p.y); }
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
  }
  // Viivat jo yhdistettyjen välillä
  c.strokeStyle = '#ffe27a';
  c.lineWidth = Math.max(3, viewH * 0.012);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  for (i = 0; i < d.next && i < n; i++) {
    p = d.pts[i];
    if (i === 0) c.moveTo(p.x + shake, p.y); else c.lineTo(p.x + shake, p.y);
  }
  if (d.done) c.closePath();
  c.stroke();
  // Haaleat apuviivat seuraavasta pisteestä eteenpäin eivät paljasta; vain seuraava hehkuu
  c.font = 'bold ' + Math.round(r * 1.3) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 0; i < n; i++) {
    p = d.pts[i];
    var isNext = i === d.next && !d.done;
    var isDone = i < d.next;
    var wrong = d.wrongT > 0 && d.wrongIdx === i;
    var rr = r * (isNext ? 1.15 + Math.sin(globalT * 6) * 0.08 : 1);
    if (isNext) {
      var g = c.createRadialGradient(p.x + shake, p.y, rr * 0.5, p.x + shake, p.y, rr * 2.4);
      g.addColorStop(0, 'rgba(255,240,160,0.7)');
      g.addColorStop(1, 'rgba(255,240,160,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(p.x + shake, p.y, rr * 2.4, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = wrong ? '#ff7a7a' : (isDone ? '#ffe27a' : '#ffffff');
    c.beginPath(); c.arc(p.x + shake, p.y, rr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = isNext ? '#ffb300' : (isDone ? '#e8a800' : 'rgba(138,43,226,0.5)');
    c.lineWidth = Math.max(2, r * 0.12);
    c.stroke();
    c.fillStyle = isDone ? '#8a5a00' : '#8a2be2';
    c.fillText(String(i + 1), p.x + shake, p.y + r * 0.08);
  }
  // Kynä osoittaa seuraavaa
  if (!d.done && d.next < n) {
    q = d.pts[d.next];
    drawPenGlyph(c, q.x + shake + r * 1.9, q.y - r * 1.9 + Math.sin(globalT * 4) * r * 0.2, r * 1.6, '#ffffff');
  }
}

// ---------- Rekisteröinnit ----------

TASK_TYPES.sort = {
  make: makeSortProblem, pitch: 698, drag: true,
  draw: drawSortOverlay
};

TASK_TYPES.order = {
  make: makeOrderProblem, pitch: 740, drag: true,
  draw: drawOrderOverlay
};

TASK_TYPES.mirror = {
  make: makeMirrorProblem, pitch: 784,
  tap: mirrorTap,
  draw: drawMirrorOverlay
};

TASK_TYPES.dots = {
  make: makeDotsProblem, pitch: 523,
  tap: dotsTap, update: updateDotsTask,
  draw: drawDotsOverlay
};
