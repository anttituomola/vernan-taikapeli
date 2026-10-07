'use strict';

// Kirjoittamisen tehtävätyypit: vastaus kootaan KIRJAINPALIKOISTA (tikkukirjaimet).
//   spell  – kuva kuplassa, kirjoita sen nimi: raahaa kirjaimet paikoilleen
//   answer – lyhyt tavutettu kysymys kuplassa, vastaus kirjaimina
// Paikat on ryhmitelty tavuittain (väliviiva tavujen välissä), jotta sanaa on
// helpompi kirjoittaa pala kerrallaan. Palikka sopii mihin tahansa paikkaan,
// jossa on sama kirjain; väärä kirjain pomppaa takaisin (ravistus). Palikan
// napautus (ei raahausta) kirjoittaa sen seuraavaan tyhjään paikkaan
// vasemmalta, eli sanan voi myös "näpytellä" järjestyksessä.
// Hämäyskirjaimia on muutama (mieluiten samannäköisiä: A/Ä, O/Ö, M/N...).
// Vihje: taikalamppu latautuu WRITE_HINT_WAIT sekunnissa tai kahdesta
// väärästä kirjaimesta, ja sen napautus lennättää kaksi seuraavaa kirjainta
// paikalleen (viimeistä kirjainta lamppu ei koskaan kirjoita).
//
// opts: { minLen, maxLen } kirjainten määrä, { decoys } hämäyskirjaimet.
//   spell: sanat WORD_LIST:stä (tasks-extra.js), oletus 3..6 kirjainta.
//   answer: kysymykset WRITE_QUESTIONS, oletus 2..7 kirjainta.

var WRITE_HINT_WAIT = 14;
var WRITE_ALPHABET = 'AEIKLMNOPRSTUVYÄÖH';
var WRITE_SIMILAR = {
  A: 'ÄO', Ä: 'AÖ', O: 'ÖU', Ö: 'OÄ', U: 'OY', Y: 'UV', I: 'EL', E: 'IÄ', K: 'TH',
  T: 'KL', P: 'RT', R: 'PL', L: 'IT', M: 'NV', N: 'MH', S: 'Ä', V: 'YU', H: 'NK', J: 'IL'
};
// Kysymys ja vastaus tavutettuina (tavujako näkyy myös vastauspaikoissa)
var WRITE_QUESTIONS = [
  { q: 'MI-KÄ E-LÄIN SA-NOO HAU?', a: 'KOI-RA' },
  { q: 'MI-KÄ E-LÄIN SA-NOO MUU?', a: 'LEH-MÄ' },
  { q: 'MI-KÄ E-LÄIN SA-NOO MIAU?', a: 'KIS-SA' },
  { q: 'MI-KÄ LOIS-TAA YÖL-LÄ TAI-VAAL-LA?', a: 'KUU' },
  { q: 'MI-KÄ LEN-TÄÄ JA LAU-LAA?', a: 'LIN-TU' },
  { q: 'MI-KÄ SA-TAA TAL-VEL-LA?', a: 'LU-MI' },
  { q: 'MI-KÄ ON PRIN-SES-SAN PÄÄS-SÄ?', a: 'KRUU-NU' },
  { q: 'MIL-LÄ SOU-DE-TAAN JÄR-VEL-LÄ?', a: 'VE-NE' },
  { q: 'MIL-LÄ KIR-JOI-TE-TAAN?', a: 'KY-NÄ' },
  { q: 'MI-TÄ KA-NA MU-NII?', a: 'MU-NI-A' },
  { q: 'MIS-SÄ KA-LA U-I?', a: 'VE-DES-SÄ' },
  { q: 'MI-KÄ ON KUU-MA JA KEL-TAI-NEN TAI-VAAL-LA?', a: 'AU-RIN-KO' },
  { q: 'MI-TÄ PU-PU SYÖ MIE-LEL-LÄÄN?', a: 'PORK-KA-NA' },
  { q: 'PAL-JON-KO ON 2 + 3?', a: 'VII-SI' },
  { q: 'PAL-JON-KO ON 4 + 4?', a: 'KAH-DEK-SAN' },
  { q: 'MON-TA-KO JAL-KAA KIS-SAL-LA ON?', a: 'NEL-JÄ' },
  { q: 'MON-TA-KO SOR-ME-A YH-DES-SÄ KÄ-DES-SÄ ON?', a: 'VII-SI' },
  { q: 'MIN-KÄ VÄ-RI-NEN RU-O-HO ON?', a: 'VIH-RE-Ä' },
  { q: 'MIN-KÄ VÄ-RI-NEN TAI-VAS ON?', a: 'SI-NI-NEN' },
  { q: 'E-LE-FANT-TI ON I-SO. HII-RI ON...', a: 'PIE-NI' },
  { q: 'PÄI-VÄL-LÄ ON VA-LOI-SAA. YÖL-LÄ ON...', a: 'PI-ME-ÄÄ' },
  { q: 'TÄ-NÄ-ÄN ON MA-NAN-TAI. HUO-MEN-NA ON...', a: 'TIIS-TAI' },
  { q: 'MI-KÄ VUO-DEN-AI-KA ON KYL-MÄ JA LU-MI-NEN?', a: 'TAL-VI' },
  { q: 'MIS-SÄ PRIN-SES-SA A-SUU?', a: 'LIN-NAS-SA' }
];

function writeLetters(w) { return w.replace(/-/g, '').split(''); }

// ---------- Ongelman rakennus ----------
function writePickDecoys(letters, n) {
  var out = [], i, k, cand, sim;
  for (i = 0; i < letters.length && out.length < n; i++) {
    sim = WRITE_SIMILAR[letters[i]] || '';
    for (k = 0; k < sim.length && out.length < n; k++) {
      cand = sim.charAt(k);
      if (letters.indexOf(cand) < 0 && out.indexOf(cand) < 0 && Math.random() < 0.6) out.push(cand);
    }
  }
  while (out.length < n) {
    cand = WRITE_ALPHABET.charAt(randInt(WRITE_ALPHABET.length));
    if (letters.indexOf(cand) < 0 && out.indexOf(cand) < 0) out.push(cand);
  }
  return out;
}
// Yksi kuva vastaa yhtä sanaa: kuvat, joilla on useampi sana (esim. timantti/kivi), ohitetaan
function writeSpellPool(minLen, maxLen) {
  var cnt = {}, out = [], i, n;
  for (i = 0; i < WORD_LIST.length; i++) cnt[WORD_LIST[i].icon] = (cnt[WORD_LIST[i].icon] || 0) + 1;
  for (i = 0; i < WORD_LIST.length; i++) {
    n = writeLetters(WORD_LIST[i].w).length;
    if (cnt[WORD_LIST[i].icon] === 1 && n >= minLen && n <= maxLen) out.push(WORD_LIST[i]);
  }
  return out;
}
function writeLayout(nSlots, nTiles) {
  var rows = nTiles > 8 ? 2 : 1, per = Math.ceil(nTiles / rows), most = Math.max(nSlots + 1, per);
  var ts = Math.min(viewH * 0.12, viewW * 0.86 / (most * 1.14));
  return { ts: ts, rows: rows, per: per, slotY: viewH * 0.47, tileY: rows > 1 ? viewH * 0.69 : viewH * 0.76 };
}
function writeMake(t, word, prompt) {
  var o = t.opts || {}, syl = word.split('-'), letters = writeLetters(word), tiles, i, k, s, Lw, x, slots = [], pieces = [], w;
  tiles = letters.concat(writePickDecoys(letters, o.decoys !== undefined ? o.decoys : 3));
  shuffleNums(tiles);
  Lw = writeLayout(letters.length, tiles.length);
  // Paikat: tavujen väliin väliviivan levyinen rako
  w = letters.length * Lw.ts * 1.08 + (syl.length - 1) * Lw.ts * 0.4;
  x = viewW / 2 - w / 2 + Lw.ts * 0.54;
  for (s = 0, k = 0; s < syl.length; s++) {
    for (i = 0; i < syl[s].length; i++, k++) {
      slots.push({ id: k, ch: syl[s].charAt(i), syl: s, x: x, y: Lw.slotY, filled: false, pop: 0 });
      x += Lw.ts * 1.08;
    }
    x += Lw.ts * 0.4;
  }
  for (i = 0; i < tiles.length; i++) {
    var row = Math.floor(i / Lw.per), inRow = Math.min(Lw.per, tiles.length - row * Lw.per), col = i - row * Lw.per;
    var hx = viewW / 2 + (col - (inRow - 1) / 2) * Lw.ts * 1.14, hy = Lw.tileY + row * Lw.ts * 1.2;
    pieces.push({ id: i, ch: tiles[i], x: hx, y: hy, homeX: hx, homeY: hy, placed: false, dragging: false, ox: 0, oy: 0, fly: 0, fx: 0, fy: 0, slot: null });
  }
  t.word = { w: word };
  t.sayT = -1;
  t.orbs = 0;
  return { prompt: prompt, slots: slots, pieces: pieces, ts: Lw.ts, hintT: 0, miss: 0, hintPop: 0 };
}
function makeSpellProblem(t) {
  var o = t.opts || {}, pool = writeSpellPool(o.minLen || 3, o.maxLen || 6), word;
  if (!pool.length) pool = writeSpellPool(1, 99);
  word = pool[randInt(pool.length)];
  return writeMake(t, word.w, { icon: word.icon });
}
function makeAnswerProblem(t) {
  var o = t.opts || {}, pool = [], i, n, q;
  for (i = 0; i < WRITE_QUESTIONS.length; i++) {
    n = writeLetters(WRITE_QUESTIONS[i].a).length;
    if (n >= (o.minLen || 2) && n <= (o.maxLen || 7)) pool.push(WRITE_QUESTIONS[i]);
  }
  if (!pool.length) pool = WRITE_QUESTIONS.slice();
  q = pool[randInt(pool.length)];
  return writeMake(t, q.a, { text: q.q });
}

// ---------- Paikoilleen ----------
function writeFirstEmpty(t) {
  var i, S = t.data.slots;
  for (i = 0; i < S.length; i++) if (!S[i].filled) return S[i];
  return null;
}
function writePlace(t, p, sl, fly) {
  sl.filled = true;
  sl.pop = 0.3;
  p.placed = true;
  p.slot = sl;
  if (fly) { p.fly = 0.4; p.fx = p.x; p.fy = p.y; }
  else { p.x = sl.x; p.y = sl.y; }
  playNote(523 + sl.id * 45, 0, 0.18, 'triangle', 0.35);
  if (!writeFirstEmpty(t)) {
    t.data.done = true;
    wordSay(t);
    taskSolved();
  }
}
function writeWrong(t, p) {
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
  t.shakeT = 0.5;
  t.data.miss++;
  p.x = p.homeX;
  p.y = p.homeY;
}
function writeDrop(t, p) {
  var D = t.data, i, best = null, bd = 1e9, d, moved = Math.hypot(p.x - p.homeX, p.y - p.homeY);
  if (moved < D.ts * 0.3) {
    // Napautus: kirjoita seuraavaan tyhjään paikkaan
    best = writeFirstEmpty(t);
    if (best && best.ch === p.ch) { writePlace(t, p, best, true); return; }
    if (best) writeWrong(t, p);
    else { p.x = p.homeX; p.y = p.homeY; }
    return;
  }
  for (i = 0; i < D.slots.length; i++) {
    if (D.slots[i].filled) continue;
    d = pieceDist(p, D.slots[i]);
    if (d < D.ts * 0.8 && d < bd) { bd = d; best = D.slots[i]; }
  }
  if (best && best.ch === p.ch) { writePlace(t, p, best, false); return; }
  if (best) { writeWrong(t, p); return; }
  p.x = p.homeX;
  p.y = p.homeY;
}

// ---------- Vihje ----------
function writeHintPos(t) {
  var D = t.data;
  return { x: Math.min(viewW - D.ts * 0.9, viewW / 2 + writePromptW(t) / 2 + D.ts * 0.9), y: viewH * 0.17, r: D.ts * 0.5 };
}
function writeHintReady(t) { return t.data.hintT >= WRITE_HINT_WAIT || t.data.miss >= 2; }
function writeTap(t, px, py) {
  var D = t.data, H = writeHintPos(t), i, k, left = 0, n, sl, p;
  if (t.mode !== 'input' || D.done || Math.hypot(px - H.x, py - H.y) > H.r * 1.3) return false;
  if (!writeHintReady(t)) {
    D.hintPop = 0.3;
    playNote(330, 0, 0.08, 'sine', 0.15);
    return true;
  }
  for (i = 0; i < D.slots.length; i++) if (!D.slots[i].filled) left++;
  n = Math.min(2, left - 1);
  for (k = 0; k < n; k++) {
    sl = writeFirstEmpty(t);
    p = null;
    for (i = 0; i < D.pieces.length && !p; i++) if (!D.pieces[i].placed && !D.pieces[i].dragging && D.pieces[i].ch === sl.ch) p = D.pieces[i];
    if (!p) break;
    writePlace(t, p, sl, true);
    spawnSparkles(sl.x, sl.y, 10, '#ffe27a');
  }
  D.hintT = 0;
  D.miss = 0;
  playNote(1175, 0, 0.12, 'sine', 0.25);
  playNote(1568, 0.1, 0.18, 'sine', 0.25);
  return true;
}

function writeUpdate(t, dt) {
  var D = t.data, i, p, k;
  if (!D || !D.slots) return;
  if (t.mode === 'input' && !D.done) D.hintT += dt;
  if (D.hintPop > 0) D.hintPop -= dt;
  for (i = 0; i < D.slots.length; i++) if (D.slots[i].pop > 0) D.slots[i].pop -= dt;
  for (i = 0; i < D.pieces.length; i++) {
    p = D.pieces[i];
    if (p.fly <= 0) continue;
    p.fly = Math.max(0, p.fly - dt);
    k = 1 - p.fly / 0.4;
    k = k * k * (3 - 2 * k);
    p.x = p.fx + (p.slot.x - p.fx) * k;
    p.y = p.fy + (p.slot.y - p.fy) * k - Math.sin(k * Math.PI) * D.ts * 0.6;
  }
}

// ---------- Piirto ----------
function writePromptW(t) {
  return t.data.prompt.text ? Math.min(viewW * 0.7, viewH * 1.4) : viewH * 0.3;
}
// Tavutettu teksti riveille: tavut violetteina, väliviivat vaaleina
function writeTextLines(c, text, maxW) {
  var words = text.split(' '), lines = [], cur = '', i, test;
  for (i = 0; i < words.length; i++) {
    test = cur ? cur + ' ' + words[i] : words[i];
    if (cur && c.measureText(test).width > maxW) { lines.push(cur); cur = words[i]; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
function writeDrawSylText(c, line, cx, y) {
  var parts = line.split('-'), x = cx - c.measureText(line).width / 2, i;
  c.textAlign = 'left';
  for (i = 0; i < parts.length; i++) {
    c.fillStyle = '#8a2be2';
    c.fillText(parts[i], x, y);
    x += c.measureText(parts[i]).width;
    if (i < parts.length - 1) {
      c.fillStyle = '#b088f0';
      c.fillText('-', x, y);
      x += c.measureText('-').width;
    }
  }
  c.textAlign = 'center';
}
function writeDrawPrompt(c, t, shake) {
  var P = t.data.prompt, cx = viewW / 2 + shake, cy = viewH * 0.17, w = writePromptW(t), h, fs, lines, i;
  if (P.icon) {
    h = viewH * 0.17;
    drawPromptBubble(c, cx, cy, w, h);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(cx - viewH * 0.06, cy, viewH * 0.06, 0, Math.PI * 2); c.fill();
    drawWordIcon(c, P.icon, cx - viewH * 0.06, cy, viewH * 0.06);
    c.fillStyle = '#8a2be2';
    readFont(c, viewH * 0.08);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', cx + viewH * 0.07, cy + viewH * 0.005);
    return;
  }
  fs = viewH * 0.055;
  readFont(c, fs);
  lines = writeTextLines(c, P.text, w - fs * 1.2);
  if (lines.length > 2) { fs = viewH * 0.045; readFont(c, fs); lines = writeTextLines(c, P.text, w - fs * 1.2); }
  h = Math.max(viewH * 0.15, lines.length * fs * 1.25 + fs);
  drawPromptBubble(c, cx, cy, w, h);
  c.textBaseline = 'middle';
  for (i = 0; i < lines.length; i++) writeDrawSylText(c, lines[i], cx, cy + (i - (lines.length - 1) / 2) * fs * 1.25 + fs * 0.05);
}
function writeDrawTile(c, x, y, s, ch, color, shadow, alpha) {
  c.globalAlpha = alpha === undefined ? 1 : alpha;
  if (shadow) {
    c.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(c, x - s / 2 + 4, y - s / 2 + 5, s, s, s * 0.2);
    c.fill();
  }
  c.fillStyle = '#fff8ec';
  roundRect(c, x - s / 2, y - s / 2, s, s, s * 0.2);
  c.fill();
  c.strokeStyle = '#e8c890';
  c.lineWidth = Math.max(1.5, s * 0.04);
  c.stroke();
  readFont(c, s * 0.62);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, x, y + s * 0.04);
  c.globalAlpha = 1;
}
function writeDrawHint(c, t) {
  var D = t.data, H = writeHintPos(t), ready = writeHintReady(t), k = Math.min(1, D.hintT / WRITE_HINT_WAIT), r = H.r * (1 + (D.hintPop > 0 ? Math.sin(D.hintPop * 30) * 0.08 : 0));
  if (D.done) return;
  if (ready) artGlow(c, H.x, H.y, r * 2.2, '#ffe678', 0.5 + Math.sin(globalT * 5) * 0.2);
  artCircle(c, H.x, H.y, r, ready ? '#fff6c8' : '#f0eaf8', { lineColor: ready ? '#e8a820' : '#b8a8d8' });
  // Latautuva kehä
  if (!ready) {
    c.strokeStyle = '#ffd24f';
    c.lineWidth = Math.max(3, r * 0.14);
    c.beginPath(); c.arc(H.x, H.y, r * 0.86, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke();
  }
  drawStar(c, H.x, H.y, r * 0.55 * (ready ? 1 + Math.sin(globalT * 6) * 0.08 : 0.85), ready ? Math.sin(globalT * 2) * 0.2 : 0, ready ? 1 : 0);
}
function drawWriteOverlay(c, t, shake) {
  var D = t.data, i, sl, p, s = D.ts, sayIdx = t.sayT >= 0 ? Math.floor(t.sayT / WORD_SYL_T) : -1, next = writeFirstEmpty(t);
  writeDrawPrompt(c, t, shake);
  writeDrawHint(c, t);
  for (i = 0; i < D.slots.length; i++) {
    sl = D.slots[i];
    if (!sl.filled) {
      c.fillStyle = sl === next ? 'rgba(255,230,140,0.35)' : 'rgba(255,255,255,0.15)';
      roundRect(c, sl.x - s / 2 + shake, sl.y - s / 2, s, s, s * 0.2);
      c.fill();
      c.setLineDash([s * 0.1, s * 0.08]);
      c.strokeStyle = sl === next ? '#ffe27a' : 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(2, s * 0.04);
      c.stroke();
      c.setLineDash([]);
    }
    if (i < D.slots.length - 1 && D.slots[i + 1].syl !== sl.syl) {
      c.fillStyle = '#c9a0ff';
      c.fillRect(sl.x + s * 0.62 + shake, sl.y - s * 0.04, s * 0.22, s * 0.08);
    }
  }
  for (i = 0; i < D.pieces.length; i++) {
    p = D.pieces[i];
    if (p.dragging || p.fly > 0) continue;
    if (p.placed) {
      var ps = s * (1 + Math.max(0, p.slot.pop) * 0.6);
      writeDrawTile(c, p.x + shake, p.y, ps, p.ch, p.slot.syl === sayIdx ? '#ff5f7e' : '#8a2be2', false);
    } else writeDrawTile(c, p.x + shake, p.y, s, p.ch, '#8a2be2', true);
  }
  for (i = 0; i < D.pieces.length; i++) {
    p = D.pieces[i];
    if (p.dragging || p.fly > 0) writeDrawTile(c, p.x, p.y, s * 1.08, p.ch, '#8a2be2', true);
  }
}

// ---------- Rekisteröinnit ----------
TASK_TYPES.spell = {
  make: makeSpellProblem, pitch: 659, drag: true,
  tap: writeTap, drop: writeDrop, update: writeUpdate, draw: drawWriteOverlay
};
TASK_TYPES.answer = {
  make: makeAnswerProblem, pitch: 698, drag: true,
  tap: writeTap, drop: writeDrop, update: writeUpdate, draw: drawWriteOverlay
};
