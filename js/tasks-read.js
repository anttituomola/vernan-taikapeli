'use strict';

// Lukemisen tehtävätyypit (Kirjainsaari). Kaikki teksti TIKKUKIRJAIMIN ja tavutettuna.
//   wordpick – kuva kuplassa, valitse oikea sana kolmesta sanakortista
//   build    – kokoa sana: raahaa tavukortit paikoilleen kuvan alle
//   letter   – alkukirjain: iso kirjain kuplassa, valitse kuva joka alkaa sillä
// Sanat ja kuvat: WORD_LIST (tasks-extra.js). Lukeminen ääneen: wordSay.

function readFont(c, size) {
  c.font = 'bold ' + Math.round(size) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
}

// Sanat, joissa tavuja on min..max
function wordsBySyl(min, max) {
  var out = [], i, n;
  for (i = 0; i < WORD_LIST.length; i++) {
    n = WORD_LIST[i].w.split('-').length;
    if (n >= min && n <= max) out.push(WORD_LIST[i]);
  }
  return out;
}

function pickDistinct(pool, n, keyFn) {
  var p = shuffleNums(pool.slice()), out = [], keys = {}, i, k;
  for (i = 0; i < p.length && out.length < n; i++) {
    k = keyFn ? keyFn(p[i]) : p[i].w;
    if (keys[k]) continue;
    keys[k] = true;
    out.push(p[i]);
  }
  return out;
}

// Sanakortti: tavut väliviivoilla, valittu tavu korostettuna (sayIdx)
function drawWordCard(c, x, y, w, h, word, sayIdx, dim, lit) {
  var syl = word.split('-'), i, tw, tx;
  c.globalAlpha = dim ? 0.35 : 1;
  c.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(c, x - w / 2 + 4, y - h / 2 + 5, w, h, h * 0.25);
  c.fill();
  c.fillStyle = lit ? '#fff6d8' : '#ffffff';
  roundRect(c, x - w / 2, y - h / 2, w, h, h * 0.25);
  c.fill();
  if (lit) {
    c.strokeStyle = '#ffd24f';
    c.lineWidth = Math.max(2, h * 0.06);
    c.stroke();
  }
  readFont(c, h * 0.5);
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  tw = c.measureText(word).width;
  tx = x - tw / 2;
  for (i = 0; i < syl.length; i++) {
    c.fillStyle = i === sayIdx ? '#ff5f7e' : '#8a2be2';
    c.fillText(syl[i], tx, y + h * 0.03);
    tx += c.measureText(syl[i]).width;
    if (i < syl.length - 1) {
      c.fillStyle = '#c9a0ff';
      c.fillText('-', tx, y + h * 0.03);
      tx += c.measureText('-').width;
    }
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.globalAlpha = 1;
}

function wordCardWidth(c, word, h) {
  readFont(c, h * 0.5);
  return c.measureText(word).width + h * 0.8;
}

// ---------- Kuva -> sana ----------
function makeWordPickProblem(t) {
  var pool = wordsBySyl(1, t.maxSyl || 3), picks = pickDistinct(pool, 3), slot = randInt(3), i;
  if (picks.length < 3) picks = pickDistinct(WORD_LIST, 3);
  t.word = picks[slot];
  t.orbs = 0;
  t.prompt = null;
  t.choices = [];
  for (i = 0; i < 3; i++) t.choices.push({ w: picks[i].w, wrong: false });
  t.correct = slot;
  t.sayT = -1;
}

function wordPickCardRect(c, t, i) {
  var h = viewH * 0.14, w = wordCardWidth(c, t.choices[i].w, h);
  return { x: viewW / 2, y: viewH * (0.44 + i * 0.17), w: Math.min(w, viewW * 0.8), h: h };
}

function wordPickTap(t, px, py) {
  var i, rc;
  // Kuvan napautus: sana kuullaan (tavut soivat), vaikka sitä ei näy
  if (Math.abs(px - viewW / 2) < viewH * 0.16 && Math.abs(py - viewH * 0.18) < viewH * 0.1) { wordSay(t); return; }
  for (i = 0; i < t.choices.length; i++) {
    rc = wordPickCardRect(ctx, t, i);
    if (px < rc.x - rc.w / 2 || px > rc.x + rc.w / 2 || py < rc.y - rc.h / 2 || py > rc.y + rc.h / 2) continue;
    if (t.choices[i].wrong) return;
    t.litOrb = i;
    t.litT = 0.3;
    if (i === t.correct) {
      wordSay(t);
      taskSolved();
    } else {
      playNote(170, 0, 0.3, 'sawtooth', 0.2);
      t.shakeT = 0.5;
      t.choices[i].wrong = true;
    }
    return;
  }
}

function drawWordPickOverlay(c, t, shake) {
  var i, rc, sayIdx = t.sayT >= 0 ? Math.floor(t.sayT / WORD_SYL_T) : -1;
  var cx = viewW / 2 + shake, cy = viewH * 0.18;
  drawPromptBubble(c, cx, cy, viewH * 0.3, viewH * 0.18);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.arc(cx - viewH * 0.06, cy, viewH * 0.06, 0, Math.PI * 2); c.fill();
  drawWordIcon(c, t.word.icon, cx - viewH * 0.06, cy, viewH * 0.06);
  c.fillStyle = '#8a2be2';
  readFont(c, viewH * 0.08);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cx + viewH * 0.07, cy + viewH * 0.005);
  for (i = 0; i < t.choices.length; i++) {
    rc = wordPickCardRect(c, t, i);
    drawWordCard(c, rc.x + shake, rc.y, rc.w, rc.h, t.choices[i].w, i === t.correct ? sayIdx : -1, t.choices[i].wrong, t.litOrb === i && t.litT > 0 && i === t.correct);
  }
}

// ---------- Kokoa sana tavuista ----------
// opts.presetWord = WORD_LIST-alkio (Sanapaja antaa sanan); muuten arvotaan 2..maxSyl tavua
function makeBuildProblem(t) {
  var word = t.presetWord || null, pool, syls, i, k, cards, extra, others, cw, gap, tries, tmp;
  if (!word) {
    pool = wordsBySyl(2, Math.max(2, t.maxSyl || 3));
    word = pool[randInt(pool.length)];
  }
  syls = word.w.split('-');
  // Hämäystavut muista sanoista (eivät saa olla sanan omia tavuja)
  others = [];
  for (i = 0; i < WORD_LIST.length; i++) {
    tmp = WORD_LIST[i].w.split('-');
    for (k = 0; k < tmp.length; k++) if (syls.indexOf(tmp[k]) < 0 && others.indexOf(tmp[k]) < 0) others.push(tmp[k]);
  }
  others = shuffleNums(others);
  extra = syls.length <= 2 ? 2 : 2;
  cards = syls.slice();
  for (i = 0; i < extra && i < others.length; i++) cards.push(others[i]);
  cards = shuffleNums(cards);
  t.word = word;
  t.sayT = -1;
  t.orbs = 0;
  cw = Math.min(viewH * 0.17, viewW * 0.16);
  gap = cw * 1.12;
  t.targets = [];
  for (i = 0; i < syls.length; i++) {
    t.targets.push({ id: i, syl: syls[i], x: viewW / 2 + (i - (syls.length - 1) / 2) * gap, y: viewH * 0.4, filled: false });
  }
  t.pieces = [];
  for (i = 0; i < cards.length; i++) {
    var hx = viewW / 2 + (i - (cards.length - 1) / 2) * gap;
    t.pieces.push({ id: i, syl: cards[i], x: hx, y: viewH * 0.76, homeX: hx, homeY: viewH * 0.76, placed: false, dragging: false, ox: 0, oy: 0 });
  }
  t.cardW = cw;
}

function buildDrop(t, p) {
  var i, best = null, bd = 1e9, d, r = viewH * 0.1, all = true;
  for (i = 0; i < t.targets.length; i++) {
    if (t.targets[i].filled) continue;
    d = pieceDist(p, t.targets[i]);
    if (d < r && d < bd) { bd = d; best = t.targets[i]; }
  }
  if (best && best.syl === p.syl) {
    p.x = best.x; p.y = best.y; p.placed = true; best.filled = true;
    playNote(392 + best.id * 70, 0, 0.3, 'triangle', 0.35);
    for (i = 0; i < t.targets.length; i++) if (!t.targets[i].filled) all = false;
    if (all) { wordSay(t); taskSolved(); }
    return;
  }
  if (best) {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
  }
  p.x = p.homeX;
  p.y = p.homeY;
}

function drawSylCard(c, x, y, w, h, syl, color, alpha, shadow) {
  c.globalAlpha = alpha;
  if (shadow) {
    c.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(c, x - w / 2 + 5, y - h / 2 + 6, w, h, h * 0.2);
    c.fill();
  }
  c.fillStyle = '#ffffff';
  roundRect(c, x - w / 2, y - h / 2, w, h, h * 0.2);
  c.fill();
  readFont(c, h * 0.48);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(syl, x, y + h * 0.03);
  c.textBaseline = 'alphabetic';
  c.globalAlpha = 1;
}

function drawBuildOverlay(c, t, shake) {
  var i, tg, p, cw = t.cardW, ch = cw * 0.72, sayIdx = t.sayT >= 0 ? Math.floor(t.sayT / WORD_SYL_T) : -1;
  var cx = viewW / 2 + shake, cy = viewH * 0.15;
  drawPromptBubble(c, cx, cy, viewH * 0.3, viewH * 0.17);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.arc(cx - viewH * 0.06, cy, viewH * 0.06, 0, Math.PI * 2); c.fill();
  drawWordIcon(c, t.word.icon, cx - viewH * 0.06, cy, viewH * 0.06);
  c.fillStyle = '#8a2be2';
  readFont(c, viewH * 0.08);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cx + viewH * 0.07, cy + viewH * 0.005);
  // Paikat ja väliviivat
  var nextSlot = -1;
  for (i = 0; i < t.targets.length; i++) if (!t.targets[i].filled && nextSlot < 0) nextSlot = i;
  for (i = 0; i < t.targets.length; i++) {
    tg = t.targets[i];
    if (!tg.filled) {
      c.fillStyle = i === nextSlot ? 'rgba(255,230,140,0.35)' : 'rgba(255,255,255,0.15)';
      roundRect(c, tg.x - cw / 2 + shake, tg.y - ch / 2, cw, ch, ch * 0.2);
      c.fill();
      c.setLineDash([ch * 0.1, ch * 0.08]);
      c.strokeStyle = i === nextSlot ? '#ffe27a' : 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(2, ch * 0.04);
      c.stroke();
      c.setLineDash([]);
    }
    if (i < t.targets.length - 1) {
      c.fillStyle = '#c9a0ff';
      c.fillRect(tg.x + cw / 2 + shake + cw * 0.02, tg.y - ch * 0.04, cw * 0.08, ch * 0.08);
    }
  }
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) continue;
    var slotIdx = -1;
    if (p.placed) for (var k = 0; k < t.targets.length; k++) if (t.targets[k].x === p.x) slotIdx = k;
    drawSylCard(c, p.x + shake, p.y, cw, ch, p.syl, p.placed && slotIdx === sayIdx ? '#ff5f7e' : '#8a2be2', 1, !p.placed);
  }
  for (i = 0; i < t.pieces.length; i++) {
    p = t.pieces[i];
    if (p.dragging) drawSylCard(c, p.x, p.y, cw, ch, p.syl, '#8a2be2', 1, true);
  }
}

// ---------- Alkukirjain ----------
function makeLetterProblem(t) {
  var picks = pickDistinct(WORD_LIST, 4, function (w) { return w.w.charAt(0); }), slot = randInt(4), i;
  t.word = picks[slot];
  t.letter = picks[slot].w.charAt(0);
  t.orbs = 4;
  t.prompt = null;
  t.choices = [];
  for (i = 0; i < 4; i++) t.choices.push({ icon: picks[i].icon, w: picks[i].w, wrong: false });
  t.correct = slot;
  t.sayT = -1;
}

function letterPromptRect() {
  var h = viewH * 0.17;
  return { x: viewW / 2 - h * 0.9, y: viewH * 0.22 - h / 2, w: h * 1.8, h: h };
}

function drawLetterPrompt(c, t, shake) {
  var rc = letterPromptRect(), cx = viewW / 2 + shake, cy = viewH * 0.22;
  drawPromptBubble(c, cx, cy, rc.w, rc.h);
  readFont(c, rc.h * 0.7);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = t.sayT >= 0 ? '#ff5f7e' : '#8a2be2';
  c.fillText(t.letter, cx - rc.h * 0.35, cy + rc.h * 0.04);
  c.fillStyle = '#c9a0ff';
  readFont(c, rc.h * 0.5);
  c.fillText('?', cx + rc.h * 0.4, cy + rc.h * 0.04);
  c.textBaseline = 'alphabetic';
}

// Väärän kuvan sana luetaan, jotta alkukirjain kuuluu; oikea sana luetaan ja ratkaisu
function letterTap(t, i) {
  if (t.choices[i].wrong) return;
  t.litOrb = i;
  t.litT = 0.3;
  if (i === t.correct) {
    wordSay(t);
    taskSolved();
  } else {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
    t.choices[i].wrong = true;
  }
}
