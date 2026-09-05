'use strict';

// Uudet tehtävätyypit: vähennyslasku, kuviosarja, "kummalla on enemmän" ja rytmi.
// Perusrunko (taskStart, handleTaskTap, updateTasks, drawTaskOverlay) haarautuu näihin.

function randInt(n) {
  return Math.floor(Math.random() * n);
}

// a − b = ?  (a 6..15, tulos vähintään 2)
function makeMinusProblem(t) {
  t.a = 6 + randInt(10);
  t.b = 1 + randInt(t.a - 2);
  t.correct = t.a - t.b;
  t.answers = pickNumberAnswers(t.correct, [t.a, t.b]);
}

// Kuviosarja: näytetään 4 kuviota, valitaan viides
function makePatternProblem(t) {
  var kinds = shuffleNums([0, 1, 2]);
  var cols = shuffleNums([0, 1, 2, 3]);
  var A = { kind: TASK_GLYPH_KINDS[kinds[0]], color: cols[0] };
  var B = { kind: TASK_GLYPH_KINDS[kinds[1]], color: cols[1] };
  var C = { kind: TASK_GLYPH_KINDS[kinds[2]], color: cols[2] };
  var forms = [
    [A, B, A, B, A],
    [A, A, B, A, A],
    [A, B, C, A, B],
    [A, B, B, A, B],
    [A, A, B, B, A]
  ];
  var seq = forms[randInt(forms.length)];
  var correct = seq[4];
  var pool = [A, B, C], distract = [], i;
  for (i = 0; i < pool.length; i++) {
    if (pool[i] !== correct) distract.push(pool[i]);
  }
  t.items = seq.slice(0, 4);
  t.choices = shuffleNums([correct, distract[0], distract[1]]);
  t.correct = t.choices.indexOf(correct);
}

// Kummalla puolella on enemmän? Kaksi ryhmää, kaksi valintapalloa.
// Kummalla puolella on enemmän? Kuviot hajallaan ja ero vain 1–2, jotta pitää laskea.
function makeCompareProblem(t) {
  var n1 = 4 + randInt(6);
  var delta = 1 + randInt(2);
  var n2 = Math.random() < 0.5 ? n1 + delta : n1 - delta;
  if (n2 < 3) n2 = n1 + delta;
  if (n2 > 10) n2 = n1 - delta;
  t.orbs = 2;
  t.a = n1;
  t.b = n2;
  t.glyph = TASK_GLYPH_KINDS[randInt(TASK_GLYPH_KINDS.length)];
  t.color = randInt(TASK_BF_COLORS.length);
  t.correct = n1 > n2 ? 0 : 1;
  t.items = [scatterOffsets(n1), scatterOffsets(n2)];
}

// Rytmi: kuuntele iskut, taputa sama kuvio. Tempo saa heittää, kuvion ei.
var RHYTHM_PATTERNS = [
  [0, 0.6, 1.2, 1.8],
  [0, 0.4, 0.8, 1.6],
  [0, 0.8, 1.2, 1.6],
  [0, 0.5, 1.5, 2.0],
  [0, 0.4, 0.8, 1.2, 2.0],
  [0, 0.7, 1.0, 1.7, 2.0]
];

function makeRhythmProblem(t) {
  t.beats = RHYTHM_PATTERNS[randInt(RHYTHM_PATTERNS.length)];
  t.taps = [];
  t.timer = -0.7;
  t.lastShown = -1;
  t.inputT = 0;
}

function drumSound(strong) {
  if (!audioCtx || muted) return;
  var t0 = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(strong ? 220 : 180, t0);
  osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.18);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(strong ? 0.7 : 0.5, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + 0.25);
}

function rhythmShowUpdate(t, dt) {
  t.timer += dt;
  var k = t.lastShown + 1;
  if (k < t.beats.length && t.timer >= t.beats[k]) {
    t.lastShown = k;
    t.litT = 0.18;
    drumSound(k === 0);
  }
  if (t.lastShown === t.beats.length - 1 && t.timer > t.beats[t.beats.length - 1] + 1.0) {
    t.mode = 'input';
    t.taps = [];
    t.inputT = 0;
    playNote(880, 0, 0.12, 'triangle', 0.25);
  }
}

function rhythmReplay(t) {
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
  t.shakeT = 0.5;
  t.mode = 'show';
  t.timer = -0.9;
  t.lastShown = -1;
  t.taps = [];
}

function rhythmInputUpdate(t, dt) {
  if (t.taps.length === 0) return;
  // Taputus jäi kesken
  if (globalT - t.taps[t.taps.length - 1] > 2.2) rhythmReplay(t);
}

function rhythmTap(t) {
  if (t.mode !== 'input') return;
  t.taps.push(globalT);
  t.litT = 0.18;
  drumSound(t.taps.length === 1);
  if (t.taps.length < t.beats.length) return;

  var wantTotal = t.beats[t.beats.length - 1] - t.beats[0];
  var gotTotal = t.taps[t.taps.length - 1] - t.taps[0];
  var scale = gotTotal / wantTotal;
  if (scale < 0.65 || scale > 1.5) { rhythmReplay(t); return; }
  var k, want, got, tol;
  for (k = 1; k < t.beats.length; k++) {
    want = (t.beats[k] - t.beats[k - 1]) * scale;
    got = t.taps[k] - t.taps[k - 1];
    tol = Math.max(0.15, want * 0.32);
    if (Math.abs(got - want) > tol) { rhythmReplay(t); return; }
  }
  taskSolved();
}

// ---------- Piirto ----------
function drawPatternPrompt(c, t, shake) {
  var gs = viewH * 0.03;
  var gap = gs * 2.8;
  var n = t.items.length + 1;
  var x0 = viewW / 2 - (n - 1) * gap / 2 + shake;
  var y = viewH * 0.27;
  var i;
  c.fillStyle = 'rgba(255,255,255,0.85)';
  roundRect(c, x0 - gap * 0.6, y - gs * 1.5, (n - 1) * gap + gap * 1.2, gs * 3, gs);
  c.fill();
  for (i = 0; i < t.items.length; i++) {
    drawTaskGlyph(c, t.items[i].kind, x0 + i * gap, y, gs, TASK_BF_COLORS[t.items[i].color]);
  }
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(gs * 2.2) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', x0 + t.items.length * gap, y + gs * 0.1);
}

function drawGlyphGroup(c, cx, cy, n, kind, color, gs) {
  var cols = n > 4 ? 3 : 2;
  var rows = Math.ceil(n / cols);
  var gap = gs * 2.3;
  var x0 = cx - (cols - 1) * gap / 2;
  var y0 = cy - (rows - 1) * gap / 2;
  var i;
  for (i = 0; i < n; i++) {
    drawTaskGlyph(c, kind, x0 + (i % cols) * gap, y0 + Math.floor(i / cols) * gap, gs, color);
  }
}

function drawComparePrompt(c, t, op, shake) {
  var gs = viewH * 0.022;
  var sides = [t.a, t.b], i, k;
  for (i = 0; i < 2; i++) {
    var rc = compareBoxRect(i, op);
    var lit = t.litOrb === i && t.litT > 0;
    c.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.85)';
    roundRect(c, rc.x + shake, rc.y, rc.w, rc.h, gs);
    c.fill();
    c.strokeStyle = TASK_BF_COLORS[i];
    c.lineWidth = viewH * 0.006;
    c.stroke();
    var offs = t.items ? t.items[i] : null;
    for (k = 0; k < sides[i]; k++) {
      var ox = offs ? offs[k].x : 0, oy = offs ? offs[k].y : 0;
      drawTaskGlyph(c, t.glyph, rc.x + rc.w / 2 + ox * rc.w * 0.4 + shake, rc.y + rc.h / 2 + oy * rc.h * 0.4, gs, TASK_BF_COLORS[t.color], 0);
    }
  }
  // Kysymysmerkki laatikoiden valiin, reunaviivalla jotta erottuu laatikoista
  c.font = 'bold ' + Math.round(viewH * 0.085) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.lineWidth = viewH * 0.012;
  c.strokeStyle = '#4a2a6e';
  c.strokeText('?', viewW / 2 + shake, viewH * 0.24);
  c.fillStyle = '#ffe27a';
  c.fillText('?', viewW / 2 + shake, viewH * 0.24);
}

function drawRhythmOverlay(c, t, shake) {
  var cx = viewW / 2 + shake;
  var cy = viewH * 0.55;
  var r = viewH * 0.13;
  var lit = t.litT > 0;
  var i;
  // Iskupisteet
  var dotR = viewH * 0.014;
  var n = t.beats.length;
  var span = t.beats[n - 1] - t.beats[0];
  var rowW = viewW * 0.5;
  for (i = 0; i < n; i++) {
    var dx = cx - rowW / 2 + (t.beats[i] - t.beats[0]) / span * rowW;
    var on = t.mode === 'show' ? i <= t.lastShown : i < t.taps.length;
    c.fillStyle = on ? '#ffe27a' : 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.arc(dx, viewH * 0.2, on ? dotR * 1.3 : dotR, 0, Math.PI * 2);
    c.fill();
  }
  // Nuotti kertoo: kuuntele
  c.fillStyle = t.mode === 'show' ? '#ffe27a' : 'rgba(255,255,255,0.5)';
  c.font = 'bold ' + Math.round(viewH * 0.07) + 'px "Segoe UI Symbol", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('♫', cx, viewH * 0.1);
  // Rumpu
  if (lit) {
    var glow = c.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.9);
    glow.addColorStop(0, 'rgba(255,255,255,0.55)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(cx, cy, r * 1.9, 0, Math.PI * 2); c.fill();
  }
  var rr = r * (lit ? 1.08 : 1);
  var dg = c.createRadialGradient(cx - rr * 0.3, cy - rr * 0.3, rr * 0.1, cx, cy, rr);
  dg.addColorStop(0, lit ? '#fff' : '#ffd6ec');
  dg.addColorStop(1, '#ff7bac');
  c.fillStyle = dg;
  c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = viewH * 0.012;
  c.stroke();
  // Käsi: näytössä taputtaa rumpua jokaisella iskulla, omalla vuorolla pomppii odottaen
  var handY;
  if (t.mode === 'show') {
    handY = cy - r * (lit ? 0.55 : 1.15);
  } else {
    handY = cy - r * (1.05 + Math.sin(globalT * 4) * 0.12);
    if (lit) handY = cy - r * 0.55;
  }
  drawHand(c, cx + r * 0.15, handY, r * 0.42);
}

// ---------- Apurit uusille tehtäville ----------
function cloneItems(items) {
  var out = [], i;
  for (i = 0; i < items.length; i++) out.push({ kind: items[i].kind, color: items[i].color, variant: items[i].variant || 0 });
  return out;
}
function groupKey(items) {
  var k = [], i;
  for (i = 0; i < items.length; i++) k.push(items[i].kind + ':' + items[i].color + ':' + (items[i].variant || 0));
  return k.join('|');
}

// Hajallaan olevat paikat (-1..1 x -1..1), ei päällekkäin
function scatterOffsets(n) {
  var out = [], tries, i, ok, p;
  while (out.length < n) {
    tries = 0;
    do {
      p = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
      ok = true;
      for (i = 0; i < out.length; i++) {
        if (Math.abs(out[i].x - p.x) < 0.42 && Math.abs(out[i].y - p.y) < 0.42) { ok = false; break; }
      }
      tries++;
    } while (!ok && tries < 40);
    out.push(p);
  }
  return out;
}

function compareBoxRect(i, op) {
  var w = viewH * 0.215, h = viewH * 0.26;
  return { x: op.xs[i] - w / 2, y: viewH * 0.24 - h / 2, w: w, h: h };
}

// Rivi pieniä kuvioita keskitettynä (cx, cy); gap = kuvioiden väli
function drawGlyphRow(c, items, cx, cy, s, gap) {
  var i, x0 = cx - (items.length - 1) * gap / 2;
  for (i = 0; i < items.length; i++) {
    drawTaskGlyph(c, items[i].kind, x0 + i * gap, cy, s, TASK_BF_COLORS[items[i].color], items[i].variant);
  }
}

// Puhekupla: malli + "?" (pelaaja ei lue, joten kysymysmerkki kantaa viestin)
function drawPromptBubble(c, cx, cy, w, h) {
  c.fillStyle = 'rgba(255,255,255,0.9)';
  roundRect(c, cx - w / 2, cy - h / 2, w, h, h * 0.3);
  c.fill();
  c.beginPath();
  c.moveTo(cx - h * 0.2, cy + h / 2 - 1);
  c.lineTo(cx + h * 0.2, cy + h / 2 - 1);
  c.lineTo(cx, cy + h / 2 + h * 0.28);
  c.closePath();
  c.fill();
}

function drawMatchPrompt(c, t, shake) {
  var gs = viewH * 0.032;
  var gap = gs * 2.6;
  var w = t.prompt.items.length * gap + gs * 3.4;
  var h = gs * 3.2;
  var cx = viewW / 2 + shake, cy = viewH * 0.27;
  drawPromptBubble(c, cx, cy, w, h);
  drawGlyphRow(c, t.prompt.items, cx - gs * 1.1, cy, gs, gap);
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(gs * 2.2) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cx + w / 2 - gs * 1.3, cy + gs * 0.1);
}

function drawCountPrompt(c, t, shake) {
  var gs = viewH * 0.026;
  var gap = gs * 2.3;
  var n = t.items ? t.items.length : t.a;
  var cols = 4;
  var rows = Math.ceil(n / cols);
  var gridW = (cols - 1) * gap;
  var gridH = (rows - 1) * gap;
  var gx0 = viewW / 2 - gridW / 2 + gs * 1.6 + shake;
  var gy0 = viewH * 0.26 - gridH / 2;
  var i;
  // Malli kuplassa ruudukon vasemmalla puolella
  var bw = gs * 5.2, bh = gs * 3.2;
  var bx = gx0 - gap - bw / 2 - gs * 0.6, by = viewH * 0.26;
  drawPromptBubble(c, bx, by, bw, bh);
  drawTaskGlyph(c, t.prompt.kind, bx - gs * 1.1, by, gs * 1.1, TASK_BF_COLORS[t.prompt.color], 0);
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(gs * 2.2) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', bx + gs * 1.4, by + gs * 0.1);
  // Ruudukko
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, gx0 - gap * 0.7, gy0 - gap * 0.7, gridW + gap * 1.4, gridH + gap * 1.4, gs);
  c.fill();
  for (i = 0; i < n; i++) {
    var it = t.items ? t.items[i] : t.prompt;
    drawTaskGlyph(c, it.kind, gx0 + (i % cols) * gap, gy0 + Math.floor(i / cols) * gap, gs, TASK_BF_COLORS[it.color], it.variant);
  }
}

// "Etsi erilainen": suurennuslasi + kysymysmerkki
function drawOddPrompt(c, shake) {
  var cx = viewW / 2 + shake, cy = viewH * 0.27, s = viewH * 0.04;
  c.strokeStyle = '#ffe27a';
  c.lineWidth = s * 0.28;
  c.lineCap = 'round';
  c.beginPath(); c.arc(cx - s * 0.3, cy - s * 0.2, s * 0.8, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(cx + s * 0.28, cy + s * 0.38); c.lineTo(cx + s * 1.0, cy + s * 1.1); c.stroke();
  c.fillStyle = '#ffe27a';
  c.font = 'bold ' + Math.round(viewH * 0.09) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cx + s * 2.2, cy);
}

// Pomppiva nuoli alaspäin
// Pomppiva nuoli: käytössä vain kartalla (seuraava huone, linna)
function drawHintArrow(c, x, y) {
  var s = viewH * 0.03;
  var by = y + Math.abs(Math.sin(globalT * 5)) * s * 0.6;
  c.fillStyle = '#ffe27a';
  c.beginPath();
  c.moveTo(x, by + s);
  c.lineTo(x - s * 0.8, by - s * 0.1);
  c.lineTo(x - s * 0.3, by - s * 0.1);
  c.lineTo(x - s * 0.3, by - s * 1.1);
  c.lineTo(x + s * 0.3, by - s * 1.1);
  c.lineTo(x + s * 0.3, by - s * 0.1);
  c.lineTo(x + s * 0.8, by - s * 0.1);
  c.closePath();
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.stroke();
}

// Yksinkertainen käsi (kämmen + sormet), osoittaa alaspäin rumpuun
function drawHand(c, x, y, s) {
  var i;
  c.fillStyle = '#ffd9b8';
  c.strokeStyle = '#d9a37a';
  c.lineWidth = Math.max(1.5, s * 0.08);
  roundRect(c, x - s * 0.55, y - s * 0.4, s * 1.1, s * 0.95, s * 0.3);
  c.fill(); c.stroke();
  for (i = 0; i < 4; i++) {
    roundRect(c, x - s * 0.5 + i * s * 0.27, y + s * 0.3, s * 0.22, s * 0.62, s * 0.11);
    c.fill(); c.stroke();
  }
  roundRect(c, x + s * 0.5, y - s * 0.2, s * 0.24, s * 0.6, s * 0.12);
  c.fill(); c.stroke();
}

// Väärän vastauksen jälkeen arvotaan uusi tehtävä samasta tyypistä
function regenerateTask(t) {
  if (t.type === 'match') makeMatchProblem(t);
  else if (t.type === 'odd') makeOddProblem(t);
  else if (t.type === 'pattern') makePatternProblem(t);
  else if (t.type === 'compare') makeCompareProblem(t);
  t.litOrb = -1;
  t.litT = 0;
  playNote(494, 0, 0.1, 'triangle', 0.25);
  playNote(659, 0.08, 0.14, 'triangle', 0.25);
}
