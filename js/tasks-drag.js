'use strict';

// Raahaustehtävät ja muistipeli:
//   shadow  – yhdistä muoto varjoon (raahaa 4 muotoa omiin varjoihinsa)
//   puzzle  – täydennä kuva (3×3 ruudukko, raahaa puuttuva pala paikalleen)
//   pairs   – etsi parit (käännä kortteja kaksi kerrallaan)
// Raahaus kulkee main.js:n pointerMove/Up-koukkujen kautta (taskDragMove/taskDrop).

var SHAPE_KINDS = ['star', 'heart', 'flower', 'circle', 'triangle', 'square', 'moon', 'diamond'];
var dragPiece = null;

function taskUsesDrag(t) {
  return t.type === 'shadow' || t.type === 'puzzle';
}

// Muodot: kolme perusmuotoa piirtää drawTaskGlyph, loput tässä. Sama polku
// kelpaa sekä värilliseen muotoon että tummaan varjoon.
function drawShape(c, kind, x, y, s, color, variant) {
  if (kind === 'star' || kind === 'heart' || kind === 'flower') {
    drawTaskGlyph(c, kind, x, y, s, color, variant || 0);
    return;
  }
  c.fillStyle = color;
  c.beginPath();
  if (kind === 'circle') {
    c.arc(x, y, s * 0.85, 0, Math.PI * 2);
  } else if (kind === 'triangle') {
    c.moveTo(x, y - s);
    c.lineTo(x + s * 0.95, y + s * 0.7);
    c.lineTo(x - s * 0.95, y + s * 0.7);
    c.closePath();
  } else if (kind === 'square') {
    c.rect(x - s * 0.75, y - s * 0.75, s * 1.5, s * 1.5);
  } else if (kind === 'diamond') {
    c.moveTo(x, y - s);
    c.lineTo(x + s * 0.7, y);
    c.lineTo(x, y + s);
    c.lineTo(x - s * 0.7, y);
    c.closePath();
  } else if (kind === 'moon') {
    c.arc(x, y, s * 0.85, Math.PI * 0.5, Math.PI * 1.5);
    c.arc(x + s * 0.4, y, s * 0.72, Math.PI * 1.5, Math.PI * 0.5, true);
    c.closePath();
  }
  c.fill();
}

function pieceDist(p, q) {
  var dx = p.x - q.x, dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------- Yhdistä muoto varjoon ----------
function makeShadowProblem(t) {
  var kinds = shuffleNums(SHAPE_KINDS.slice()).slice(0, 4);
  var order = shuffleNums([0, 1, 2, 3]);
  var gap = Math.min(viewW * 0.22, viewH * 0.28);
  var i, hx;
  t.pieces = [];
  t.targets = [];
  for (i = 0; i < 4; i++) {
    hx = viewW / 2 + (i - 1.5) * gap;
    t.pieces.push({
      id: i, kind: kinds[i], color: randInt(TASK_BF_COLORS.length),
      x: hx, y: viewH * 0.7, homeX: hx, homeY: viewH * 0.7, placed: false, dragging: false, ox: 0, oy: 0
    });
    t.targets.push({ id: order[i], kind: kinds[order[i]], x: viewW / 2 + (i - 1.5) * gap, y: viewH * 0.3, filled: false });
  }
}

// ---------- Täydennä kuva ----------
function makePuzzleProblem(t) {
  var kinds = shuffleNums(['star', 'heart', 'flower']);
  var cols = shuffleNums([0, 1, 2, 3]).slice(0, 3);
  var hole = randInt(9);
  var hr = Math.floor(hole / 3), hc = hole % 3;
  var correct = { kind: kinds[hr], color: cols[hc] };
  var wrongColor = { kind: kinds[hr], color: cols[(hc + 1 + randInt(2)) % 3] };
  var wrongKind = { kind: kinds[(hr + 1 + randInt(2)) % 3], color: cols[hc] };
  var cands = shuffleNums([correct, wrongColor, wrongKind]);
  var ci = cands.indexOf(correct);
  var cell = viewH * 0.085;
  var gx0 = viewW / 2 - cell, gy0 = viewH * 0.3 - cell;
  var i, hx;
  t.grid = { kinds: kinds, cols: cols, hole: hole, cell: cell, gx0: gx0, gy0: gy0 };
  t.targets = [{ id: ci, x: gx0 + hc * cell, y: gy0 + hr * cell, filled: false }];
  t.pieces = [];
  for (i = 0; i < cands.length; i++) {
    hx = viewW / 2 + (i - 1) * viewH * 0.2;
    t.pieces.push({
      id: i, kind: cands[i].kind, color: cands[i].color,
      x: hx, y: viewH * 0.72, homeX: hx, homeY: viewH * 0.72, placed: false, dragging: false, ox: 0, oy: 0
    });
  }
}

// ---------- Etsi parit ----------
function makePairsProblem(t) {
  var n = t.pairs || 3;
  var kinds = shuffleNums(SHAPE_KINDS.slice()).slice(0, n);
  var cards = [], i, color;
  for (i = 0; i < n; i++) {
    color = randInt(TASK_BF_COLORS.length);
    cards.push({ kind: kinds[i], color: color, face: false, matched: false });
    cards.push({ kind: kinds[i], color: color, face: false, matched: false });
  }
  t.cards = shuffleNums(cards);
  t.open = [];
  t.flipBackT = 0;
  t.cols = n <= 3 ? 3 : 4;
}

function pairsCardRect(t, i) {
  var cols = t.cols;
  var rows = Math.ceil(t.cards.length / cols);
  var cw = viewH * 0.13, ch = viewH * 0.16, gap = viewH * 0.025;
  var totalW = cols * cw + (cols - 1) * gap;
  var totalH = rows * ch + (rows - 1) * gap;
  var x0 = viewW / 2 - totalW / 2, y0 = viewH * 0.47 - totalH / 2;
  return { x: x0 + (i % cols) * (cw + gap), y: y0 + Math.floor(i / cols) * (ch + gap), w: cw, h: ch };
}

function pairsTap(t, px, py) {
  var i, rc;
  if (t.flipBackT > 0) return;
  for (i = 0; i < t.cards.length; i++) {
    rc = pairsCardRect(t, i);
    if (px < rc.x || px > rc.x + rc.w || py < rc.y || py > rc.y + rc.h) continue;
    var card = t.cards[i];
    if (card.matched || card.face) return;
    card.face = true;
    t.open.push(i);
    playNote(660 + i * 20, 0, 0.1, 'sine', 0.25);
    if (t.open.length === 2) {
      var a = t.cards[t.open[0]], b = t.cards[t.open[1]];
      if (a.kind === b.kind && a.color === b.color) {
        a.matched = true; b.matched = true;
        t.open = [];
        playNote(784, 0, 0.2, 'triangle', 0.4);
        playNote(1047, 0.1, 0.25, 'triangle', 0.4);
        var all = true, k;
        for (k = 0; k < t.cards.length; k++) if (!t.cards[k].matched) all = false;
        if (all) taskSolved();
      } else {
        t.flipBackT = 0.9;
        playNote(220, 0.1, 0.2, 'sawtooth', 0.15);
      }
    }
    return;
  }
}

function pairsUpdate(t, dt) {
  if (t.flipBackT > 0) {
    t.flipBackT -= dt;
    if (t.flipBackT <= 0) {
      var k;
      for (k = 0; k < t.open.length; k++) t.cards[t.open[k]].face = false;
      t.open = [];
    }
  }
}

// ---------- Raahaus ----------
function taskDragStart(t, px, py) {
  var i, best = null, bd = 1e9, r = viewH * 0.09, d;
  for (i = 0; i < t.pieces.length; i++) {
    var p = t.pieces[i];
    if (p.placed) continue;
    d = pieceDist(p, { x: px, y: py });
    if (d < r && d < bd) { bd = d; best = p; }
  }
  if (!best) return false;
  best.dragging = true;
  best.ox = best.x - px;
  best.oy = best.y - py;
  dragPiece = { task: t, piece: best };
  t.idleT = 0;
  playNote(660, 0, 0.06, 'sine', 0.2);
  return true;
}

function taskDragMove(px, py) {
  if (!dragPiece) return;
  var p = dragPiece.piece;
  p.x = px + p.ox;
  p.y = py + p.oy;
}

function taskDrop(px, py) {
  if (!dragPiece) return;
  var t = dragPiece.task, p = dragPiece.piece;
  dragPiece = null;
  p.dragging = false;
  var i, hit = null, bd = 1e9, r = viewH * 0.09, d, all = true;
  for (i = 0; i < t.targets.length; i++) {
    var tg = t.targets[i];
    if (tg.filled) continue;
    d = pieceDist(p, tg);
    if (d < r && d < bd) { bd = d; hit = tg; }
  }
  if (hit && hit.id === p.id) {
    p.x = hit.x; p.y = hit.y; p.placed = true; hit.filled = true;
    playNote(TASK_BF_NOTES[p.id % TASK_BF_NOTES.length], 0, 0.25, 'triangle', 0.45);
    for (i = 0; i < t.targets.length; i++) if (!t.targets[i].filled) all = false;
    if (all) taskSolved();
    return;
  }
  if (hit) {
    // Väärä paikka: ravistus ja pala palaa alas
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
  }
  p.x = p.homeX;
  p.y = p.homeY;
}

// ---------- Piirto ----------
function drawTile(c, x, y, cell, fill) {
  c.fillStyle = fill;
  roundRect(c, x - cell * 0.47, y - cell * 0.47, cell * 0.94, cell * 0.94, cell * 0.12);
  c.fill();
}

function drawDragTaskOverlay(c, t, shake, hint) {
  var i, p, tg, rc;
  if (t.type === 'shadow') {
    // Varjot ylhäällä
    for (i = 0; i < t.targets.length; i++) {
      tg = t.targets[i];
      c.fillStyle = 'rgba(255,255,255,0.14)';
      c.beginPath(); c.arc(tg.x + shake, tg.y, viewH * 0.085, 0, Math.PI * 2); c.fill();
      if (!tg.filled) drawShape(c, tg.kind, tg.x + shake, tg.y, viewH * 0.05, 'rgba(20,10,40,0.85)', 0);
    }
    c.fillStyle = '#ffe27a';
    c.font = 'bold ' + Math.round(viewH * 0.08) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', viewW / 2 + shake, viewH * 0.5);
  } else if (t.type === 'puzzle') {
    var g = t.grid, r2, c2;
    c.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(c, g.gx0 - g.cell * 0.6 + shake, g.gy0 - g.cell * 0.6, g.cell * 3.2, g.cell * 3.2, g.cell * 0.2);
    c.fill();
    for (r2 = 0; r2 < 3; r2++) {
      for (c2 = 0; c2 < 3; c2++) {
        var idx = r2 * 3 + c2;
        var tx = g.gx0 + c2 * g.cell + shake, ty = g.gy0 + r2 * g.cell;
        if (idx === g.hole) {
          if (!t.targets[0].filled) {
            c.setLineDash([g.cell * 0.08, g.cell * 0.08]);
            c.strokeStyle = 'rgba(255,255,255,0.8)';
            c.lineWidth = Math.max(2, g.cell * 0.04);
            roundRect(c, tx - g.cell * 0.47, ty - g.cell * 0.47, g.cell * 0.94, g.cell * 0.94, g.cell * 0.12);
            c.stroke();
            c.setLineDash([]);
          }
          continue;
        }
        drawTile(c, tx, ty, g.cell, 'rgba(255,255,255,0.9)');
        drawShape(c, g.kinds[r2], tx, ty, g.cell * 0.3, TASK_BF_COLORS[g.cols[c2]], 0);
      }
    }
  }
  // Palat: paikalleen asetetut ensin, raahattava viimeisenä päällimmäiseksi
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) continue;
    drawPiece(c, t, p, shake);
  }
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) drawPiece(c, t, p, 0);
  }
  if (hint) {
    for (i = 0; i < t.pieces.length; i++) {
      if (!t.pieces[i].placed) { drawHintArrow(c, t.pieces[i].x + shake, t.pieces[i].y - viewH * 0.11); break; }
    }
  }
}

function drawPiece(c, t, p, shake) {
  var s = viewH * 0.05;
  if (t.type === 'puzzle') {
    var cell = t.grid.cell;
    c.fillStyle = 'rgba(0,0,0,0.2)';
    roundRect(c, p.x - cell * 0.47 + shake + 4, p.y - cell * 0.47 + 5, cell * 0.94, cell * 0.94, cell * 0.12);
    c.fill();
    drawTile(c, p.x + shake, p.y, cell, p.dragging ? '#ffffff' : 'rgba(255,255,255,0.92)');
    drawShape(c, p.kind, p.x + shake, p.y, cell * 0.3, TASK_BF_COLORS[p.color], 0);
    return;
  }
  if (!p.placed) {
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath(); c.arc(p.x + shake, p.y, s * 1.7, 0, Math.PI * 2); c.fill();
  }
  if (p.dragging) {
    c.fillStyle = 'rgba(0,0,0,0.22)';
    drawShape(c, p.kind, p.x + shake + 5, p.y + 6, s, 'rgba(0,0,0,0.22)', 0);
  }
  drawShape(c, p.kind, p.x + shake, p.y, s, TASK_BF_COLORS[p.color], 0);
}

function drawPairsOverlay(c, t, shake, hint) {
  var i, rc, card;
  for (i = 0; i < t.cards.length; i++) {
    rc = pairsCardRect(t, i);
    card = t.cards[i];
    var x = rc.x + shake, y = rc.y;
    c.fillStyle = 'rgba(0,0,0,0.2)';
    roundRect(c, x + 4, y + 5, rc.w, rc.h, rc.w * 0.12);
    c.fill();
    if (card.face || card.matched) {
      c.fillStyle = card.matched ? '#fff6d8' : '#ffffff';
      roundRect(c, x, y, rc.w, rc.h, rc.w * 0.12);
      c.fill();
      drawShape(c, card.kind, x + rc.w / 2, y + rc.h / 2, rc.w * 0.3, TASK_BF_COLORS[card.color], 0);
      if (card.matched) {
        c.strokeStyle = '#ffe27a';
        c.lineWidth = Math.max(2, rc.w * 0.05);
        c.stroke();
      }
    } else {
      var bg = c.createLinearGradient(x, y, x + rc.w, y + rc.h);
      bg.addColorStop(0, '#9b7bff');
      bg.addColorStop(1, '#6b3fd6');
      c.fillStyle = bg;
      roundRect(c, x, y, rc.w, rc.h, rc.w * 0.12);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(2, rc.w * 0.04);
      c.stroke();
      drawStar(c, x + rc.w / 2, y + rc.h / 2, rc.w * 0.18, 0, 0);
    }
  }
  if (hint) {
    for (i = 0; i < t.cards.length; i++) {
      if (!t.cards[i].matched && !t.cards[i].face) { rc = pairsCardRect(t, i); drawHintArrow(c, rc.x + rc.w / 2 + shake, rc.y - viewH * 0.06); break; }
    }
  }
}
