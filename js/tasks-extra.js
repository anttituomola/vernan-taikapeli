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
function makeCompareProblem(t) {
  var n1 = 3 + randInt(7);
  var n2 = n1;
  while (n2 === n1) n2 = 3 + randInt(7);
  t.orbs = 2;
  t.a = n1;
  t.b = n2;
  t.glyph = TASK_GLYPH_KINDS[randInt(TASK_GLYPH_KINDS.length)];
  t.color = randInt(TASK_BF_COLORS.length);
  t.correct = n1 > n2 ? 0 : 1;
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
  var boxW = viewH * 0.24, boxH = viewH * 0.24;
  var y = viewH * 0.24;
  var sides = [t.a, t.b], i;
  for (i = 0; i < 2; i++) {
    var cx = op.xs[i] + shake;
    c.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(c, cx - boxW / 2, y - boxH / 2, boxW, boxH, gs);
    c.fill();
    drawGlyphGroup(c, cx, y, sides[i], t.glyph, TASK_BF_COLORS[t.color], gs);
  }
}

function drawRhythmOverlay(c, t, shake) {
  var cx = viewW / 2 + shake;
  var cy = viewH * 0.52;
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
    c.arc(dx, viewH * 0.22, on ? dotR * 1.3 : dotR, 0, Math.PI * 2);
    c.fill();
  }
  // Nuotti kertoo: kuuntele
  c.fillStyle = t.mode === 'show' ? '#ffe27a' : 'rgba(255,255,255,0.5)';
  c.font = 'bold ' + Math.round(viewH * 0.07) + 'px "Segoe UI Symbol", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('♫', cx, viewH * 0.12);
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
  // Käsi = taputa tähän (input-vaiheessa)
  if (t.mode === 'input') {
    c.fillStyle = '#8a2be2';
    c.font = 'bold ' + Math.round(r * 0.9) + 'px "Segoe UI Symbol", "Segoe UI", sans-serif';
    c.fillText('✋', cx, cy + r * 0.05);
  }
}
