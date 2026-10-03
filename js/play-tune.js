'use strict';

// Soittorasia (Kaukamaa, Kellopaja): Rataspajan rattaat pyörittivät
// soittorasiaa, mutta tontun soittorasian rulla on tyhjä. Tonttu soittaa
// kellopelillä melodian (kello välähtää rivin värillä joka sävelellä), ja lapsi
// rakentaa sen rullaan. Rulla on ruudukko: sarakkeet ovat aika-askeleita, rivit
// viisi säveltä (pentatoninen C D E G A, korkein ylhäällä ja pienin kello).
// Nasta RAAHATAAN nastalaatikosta rullan ruutuun (sama ele kuin muualla siirto);
// rullan nastaa voi raahata toiseen ruutuun tai pois. Paikalleen pantu nasta
// soi rivinsä sävelen. Napautus kelloon tai tyhjään ruutuun soittaa sävelen
// (kokeilu korvalla), napautus tonttuun = tonttu soittaa melodian uudelleen.
// ▶-vipu pyörittää rullaa: osoitin kulkee sarakkeittain ja nastat näppäävät
// kelloja. Soiton jälkeen väärät nastat tärisevät punaisina; puuttuvat sävelet
// näkyvät 1. kierroksella haaleina aavenastoina, myöhemmin vain sarakkeen
// punaisena hehkuna. Jousessa on kolme vetoa: väärä soitto kuluttaa vedon, ja
// kun vedot loppuvat, tonttu arpoo uuden melodian ja rulla tyhjenee.
// Neljä arvottua, kovenevaa kierrosta: 4 säveltä ja nauha näkyy koko ajan;
// 6 säveltä ja nauha vain soiton aikana; 7–8 askelta, tauko ja sointu,
// kuuntelukertoja 3; 8–10 askelta A A B -rakenteella, kuuntelukertoja 2.
// Melodiat arvotaan musikaalisista askelista (enimmäkseen viereinen sävel,
// loppu perussävelelle C). Kultainen nuotti, jos kierros onnistuu ensimmäisellä
// soitolla. Ei sydämiä. Tehtävät toisen ja kolmannen kierroksen jälkeen:
// muisti (perhossävelet) ja lasku.

// len: askelia (sarakkeita), show: 'always' = nauha aina näkyvissä, 'play' =
// vain tontun soittaessa (ja linger s perään), listens: uusintakuuntelut
// (-1 = rajaton; ensimmäinen soitto kierroksen alussa on ilmainen),
// rest: taukoja, chord: kahden nastan sointuja, motif: A A B -rakenne
var TUNE_ROUNDS = [
  { len: [4, 4], show: 'always', listens: -1, rest: 0, chord: 0, motif: 0, linger: 0 },
  { len: [6, 6], show: 'play', listens: -1, rest: 0, chord: 0, motif: 0, linger: 2.0 },
  { len: [7, 8], show: 'play', listens: 3, rest: 1, chord: 1, motif: 0, linger: 1.6 },
  { len: [8, 10], show: 'play', listens: 2, rest: 0, chord: 0, motif: 1, linger: 1.6 }
];
var TUNE_ROWS = 5;
var TUNE_MAXCOLS = 10;
var TUNE_FREQ = [523.25, 587.33, 659.26, 783.99, 880.0];          // C5 D5 E5 G5 A5
var TUNE_COL = ['#ff5f5f', '#ff9f40', '#ffd24f', '#6fd66f', '#5fa8ff'];
var TUNE_PIN = '#e8c870';     // nasta laatikossa (saa rivin värin rullassa)
var TUNE_PULLS = 3;           // jousen vedot kierrosta kohti
var TUNE_STEP = 0.5;          // tontun soiton tahti (s / askel)
var TUNE_ROLL_STEP = 0.45;    // rullan soiton tahti
var TUNE_SONG_STEP = 0.32;
// Yllätys: Ukko Nooan alku (F ei ole kellopelissä, se soi ilman kelloa)
var TUNE_SONG = [523.25, 523.25, 523.25, 659.26, 587.33, 587.33, 587.33, 698.46, 659.26, 659.26, 587.33, 587.33, 523.25];

var tune = {
  round: 0, state: 'intro', t: 0, R: null, mel: null, pins: {}, drag: null, fly: [],
  play: null, pulls: TUNE_PULLS, listens: -1, misses: 0, gold: [], taskDelay: -1,
  hintT: 0, leverT: 0, placed: false, heard: false, ghost: false, colMiss: {}, stripT: 0,
  autoT: 0, resetT: 0, springPop: 0, leverPress: 0, crank: 0, genTries: 0,
  bells: [], tonttu: { blink: 0, no: 0, joy: 0, mx: 0, my: 0, hitRow: -1, hitT: 0 }, dancer: null
};

// ---------- Melodian arvonta (puhdas logiikka) ----------
function tuneRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function tuneKey(c, r) { return c + ',' + r; }
function tuneDistinct(notes) {
  var seen = {}, n = 0, i;
  for (i = 0; i < notes.length; i++) if (!seen[notes[i]]) { seen[notes[i]] = true; n++; }
  return n;
}
// Musikaalinen askel: enimmäkseen viereinen sävel, joskus hyppy yli yhden tai
// toisto (ei kolmea samaa peräkkäin); reunalla suunta kääntyy
function tuneStep(prev, prev2) {
  var x = Math.random(), d;
  if (x < 0.15 && prev !== prev2) d = 0;
  else if (x < 0.85) d = Math.random() < 0.5 ? -1 : 1;
  else d = Math.random() < 0.5 ? -2 : 2;
  if (prev + d < 0 || prev + d >= TUNE_ROWS) d = -d;
  return prev + d;
}
function tuneWalk(start, n) {
  var out = [start], i;
  for (i = 1; i < n; i++) out.push(tuneStep(out[i - 1], i > 1 ? out[i - 2] : -1));
  return out;
}
// Yksi yritys: palauttaa sarakkeet (rivilistat, [] = tauko) tai null
function tuneTryMelody(R) {
  var len = tuneRandInt(R.len[0], R.len[1]), notes, mel = [], i, k = -99, j, m = 0, A, starts = [0, 2, 3, 4];
  if (R.motif) {
    // A A B: A on 3–4 askelta, B (2–4) laskeutuu perussävelelle
    m = len >= 10 && Math.random() < 0.5 ? 4 : 3;
    A = tuneWalk(starts[tuneRandInt(0, 3)], m);
    if (tuneDistinct(A) < 2 || Math.abs(A[m - 1] - A[0]) > 2) return null;
    notes = A.concat(A, tuneWalk(tuneStep(A[m - 1], A[m - 2]), len - 2 * m));
  } else {
    notes = tuneWalk(starts[tuneRandInt(0, 3)], len);
  }
  notes[len - 1] = 0;
  if (notes[len - 2] > 2 || (notes[len - 2] === 0 && notes[len - 3] === 0)) return null;
  if (tuneDistinct(notes) < 3) return null;
  // B ei saa alkaa kuin A (muuten se kuulostaa kolmannelta A:lta)
  if (R.motif && notes[2 * m] === A[0] && notes[2 * m + 1] === A[1]) return null;
  for (i = 0; i < len; i++) mel.push([notes[i]]);
  if (R.rest) {
    k = tuneRandInt(2, len - 2);
    if (Math.abs(notes[k - 1] - notes[k + 1]) > 2) return null;
    mel[k] = [];
  }
  if (R.chord) {
    // Sointu: sävel ja kahden rivin päässä oleva (terssi tai kvartti)
    j = tuneRandInt(1, len - 2);
    if (Math.abs(j - k) < 2) return null;
    mel[j] = notes[j] + 2 < TUNE_ROWS ? [notes[j], notes[j] + 2] : [notes[j] - 2, notes[j]];
  }
  return tuneValidate(mel, R) ? mel : null;
}
// Kelpaako melodia kierrokselle: mahtuu rullaan, loppuu perussävelelle,
// askeleet pieniä, oikea määrä taukoja/sointuja ja A A B -rakenne
function tuneValidate(mel, R) {
  var len = mel.length, i, j, rests = 0, chords = 0, all = [], prev = null, ok, m, b, cc, col;
  if (len < R.len[0] || len > R.len[1] || len > TUNE_MAXCOLS) return false;
  for (i = 0; i < len; i++) {
    col = mel[i];
    if (col.length > 2) return false;
    for (j = 0; j < col.length; j++) {
      if (col[j] !== Math.floor(col[j]) || col[j] < 0 || col[j] >= TUNE_ROWS) return false;
      if (j > 0 && col[j] <= col[j - 1]) return false;
      all.push(col[j]);
    }
    if (col.length === 0) rests++;
    if (col.length === 2) chords++;
    if (col.length) {
      // Melodian askel edellisestä soivasta sarakkeesta enintään kaksi riviä
      if (prev) {
        ok = false;
        for (j = 0; j < col.length; j++) for (cc = 0; cc < prev.length; cc++) if (Math.abs(col[j] - prev[cc]) <= 2) ok = true;
        if (!ok) return false;
      }
      prev = col;
    }
  }
  if (!mel[0].length || mel[len - 1].length !== 1 || mel[len - 1][0] !== 0) return false;
  if (rests !== R.rest || chords !== R.chord) return false;
  if (tuneDistinct(all) < 3) return false;
  if (R.motif) {
    ok = false;
    for (m = 3; m <= 4; m++) {
      b = len - 2 * m;
      if (b < 2 || b > 4) continue;
      var same = true;
      for (i = 0; i < m; i++) if (mel[i].join() !== mel[i + m].join()) same = false;
      if (same) ok = true;
    }
    if (!ok) return false;
  }
  return true;
}
function tuneMakeMelody(R) {
  var i, mel;
  for (i = 1; i <= 3000; i++) {
    mel = tuneTryMelody(R);
    if (mel) { tune.genTries = i; return mel; }
  }
  // Varalla (ei pitäisi tapahtua): laskeva sävelkulku
  tune.genTries = -1;
  mel = [];
  for (i = 0; i < R.len[0]; i++) mel.push([Math.max(0, R.len[0] - 1 - i) % TUNE_ROWS]);
  mel[mel.length - 1] = [0];
  return mel;
}
// Rullan tarkistus: väärät nastat, puuttuvat sävelet ja sarakkeet, joista puuttuu
function tuneCheck(mel, pins) {
  var res = { ok: true, wrong: [], missing: [], missCols: [] }, k, p, c, i;
  for (k in pins) {
    p = pins[k];
    if (p.c >= mel.length || mel[p.c].indexOf(p.r) < 0) { res.wrong.push(k); res.ok = false; }
  }
  for (c = 0; c < mel.length; c++) {
    for (i = 0; i < mel[c].length; i++) {
      if (pins[tuneKey(c, mel[c][i])]) continue;
      res.missing.push({ c: c, r: mel[c][i] });
      res.ok = false;
      if (res.missCols.indexOf(c) < 0) res.missCols.push(c);
    }
  }
  return res;
}

// ---------- Asettelu ----------
// Lasketaan viewW/viewH:sta; rullan sarakkeita on melodian verran
function tuneLayout() {
  var W = viewW, h = viewH, n = tune.mel ? tune.mel.length : 4;
  var cs = Math.min(W * 0.54 / n, h * 0.5 / TUNE_ROWS, h * 0.11);
  var ox = W * 0.56 - cs * n / 2, oy = h * 0.3 + (h * 0.5 - cs * TUNE_ROWS) / 2, s = h * 0.085;
  var bx = ox - cs * 0.62;
  return {
    cs: cs, n: n, ox: ox, oy: oy, bx: bx, s: s,
    tx: bx - cs * 0.45 - s * 1.3, ty: oy + cs * TUNE_ROWS,
    lx: W * 0.92, ly: h * 0.62, lr: h * 0.065, sx: W * 0.92, sy: h * 0.45,
    box: { x: W * 0.4, y: h * 0.85, w: W * 0.3, h: h * 0.11 }
  };
}
function tuneRowY(r, Lz) { return Lz.oy + (TUNE_ROWS - 1 - r + 0.5) * Lz.cs; }
function tuneColX(c, Lz) { return Lz.ox + (c + 0.5) * Lz.cs; }
function tuneBellR(r, cs) { return cs * (0.42 - r * 0.035); }
// Ruutu pisteen kohdalla (pieni armo reunoilla) tai null
function tuneCellAt(x, y, Lz, slack) {
  var cf = (x - Lz.ox) / Lz.cs, rf = (y - Lz.oy) / Lz.cs;
  slack = slack || 0;
  if (cf < -slack || rf < -slack || cf > Lz.n + slack || rf > TUNE_ROWS + slack) return null;
  return { c: Math.max(0, Math.min(Lz.n - 1, Math.floor(cf))), r: TUNE_ROWS - 1 - Math.max(0, Math.min(TUNE_ROWS - 1, Math.floor(rf))) };
}

// ---------- Kierros ----------
function tuneStartRound() {
  tune.R = TUNE_ROUNDS[tune.round];
  tune.misses = 0;
  tuneNewMelody(true);
  tune.state = 'play';
  tune.t = 0;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
// Uusi melodia (kierroksen alku tai jousen vedot loppuivat): nastat lentävät laatikkoon
function tuneNewMelody(first) {
  var k, p, Lz = tuneLayout();
  for (k in tune.pins) {
    p = tune.pins[k];
    tune.fly.push({ x0: tuneColX(p.c, Lz), y0: tuneRowY(p.r, Lz), t: -Math.random() * 0.2, color: TUNE_COL[p.r] });
  }
  tune.pins = {};
  tune.mel = tuneMakeMelody(tune.R);
  tune.pulls = TUNE_PULLS;
  tune.listens = tune.R.listens;
  tune.ghost = false;
  tune.colMiss = {};
  tune.play = null;
  tune.stripT = 0;
  tune.autoT = first ? 0.9 : 0.7;
  tune.hintT = 0;
  tune.leverT = 0;
}

// ---------- Alustus ----------
function initTune() {
  var i;
  tasks = [makeTask(-5, 'memory', { seqLen: 4, orbs: 4 }), makeTask(-5, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  tune.round = 0;
  tune.state = 'intro';
  tune.t = 0;
  tune.R = TUNE_ROUNDS[0];
  tune.mel = null;
  tune.pins = {};
  tune.drag = null;
  tune.fly = [];
  tune.play = null;
  tune.gold = [];
  tune.taskDelay = -1;
  tune.placed = false;
  tune.heard = false;
  tune.resetT = 0;
  tune.autoT = 0;
  tune.bells = [];
  for (i = 0; i < TUNE_ROWS; i++) tune.bells.push({ f: 0 });
  tune.tonttu.no = 0; tune.tonttu.joy = 0; tune.tonttu.hitT = 0; tune.tonttu.mx = 0;
  tuneSetupProps();
  renderBackground();
}
function respawnTune() { tuneStartRound(); }
function resizeTune() {
  camX = 0;
  tune.tonttu.mx = 0;
  tuneSetupProps();
}

// Tökättävät koristeet: soittorasian tanssija hyllyllä (pyörähtää; joka viides
// tökkäys: tonttu soittaa Ukko Nooan alun ja tanssija pyörii), metronomi
// (heiluu ja naksuttaa) ja pikkurumpu (pomppaa ja jymähtää). Ne ovat rullan,
// laatikon ja vivun ulkopuolella, eivätkä raahattavien tiellä.
function tuneSetupProps() {
  var W = viewW, h = viewH;
  propsReset();
  tune.dancer = propAdd({
    x: W * 0.91, y: h * 0.3, r: h * 0.075, hy: h * 0.06, color: '#ff9ec6', note: 1047, amp: 0.05, a: 0, v: 0,
    update: function (p, dt) {
      if (tune.play && tune.play.kind === 'song') p.v = Math.max(p.v, 9);
      p.a += p.v * dt;
      p.v *= Math.max(0, 1 - dt * 0.9);
    },
    draw: function (c, p) { tuneDrawDancer(c, h * 0.05, p.a); },
    poke: function (p) {
      p.v = 14;
      playNote(1568, 0.05, 0.2, 'sine', 0.15);
      playNote(2093, 0.15, 0.25, 'sine', 0.12);
      if (p.n % 5 === 0) {
        p.v = 20;
        tune.tonttu.joy = 1.5;
        if (tune.state === 'play' && !tune.play && !tune.drag && tune.resetT <= 0) tuneStartPlay('song');
      }
    }
  });
  propAdd({
    x: W * 0.07, y: h * 0.95, r: h * 0.07, hy: h * 0.055, color: '#ffd24f', note: 880, amp: 0.05, swing: 0, ph: 0,
    update: function (p, dt) {
      if (p.swing <= 0) return;
      var before = Math.sin(p.ph);
      p.ph += dt * 5;
      p.swing -= dt;
      if ((Math.sin(p.ph) > 0) !== (before > 0)) playNote(Math.sin(p.ph) > 0 ? 1200 : 1000, 0, 0.04, 'square', 0.05);
    },
    draw: function (c, p) { tuneDrawMetronome(c, h * 0.05, p.swing > 0 ? Math.sin(p.ph) * 0.45 * Math.min(1, p.swing) : 0); },
    poke: function (p) { p.swing = 3.2; p.ph = 0; }
  });
  propAdd({
    x: W * 0.8, y: h * 0.955, r: h * 0.065, hy: h * 0.04, color: '#ff7a5a', note: 196, amp: 0.05,
    draw: function (c, p) {
      var b = p.t >= 0 ? Math.abs(Math.sin(p.t * 12)) * Math.exp(-p.t * 4) : 0;
      tuneDrawDrum(c, h * 0.045, b);
    },
    poke: function () {
      playNote(110, 0, 0.25, 'triangle', 0.35);
      playNote(82, 0.02, 0.3, 'sine', 0.3);
    }
  });
}

// ---------- Soitto ----------
// kind: 'tonttu' (melodia kellopelillä), 'roll' (rulla nastoineen), 'song' (yllätys)
function tuneStartPlay(kind) {
  var seq = [], c, k, n = tune.mel.length;
  if (kind === 'tonttu') seq = tune.mel;
  else if (kind === 'song') seq = TUNE_SONG;
  else {
    for (c = 0; c < n; c++) seq.push([]);
    for (k in tune.pins) seq[tune.pins[k].c].push(tune.pins[k].r);
  }
  tune.play = { kind: kind, seq: seq, i: -1, t: 0, step: kind === 'tonttu' ? TUNE_STEP : kind === 'song' ? TUNE_SONG_STEP : TUNE_ROLL_STEP };
  if (kind === 'roll') {
    tune.colMiss = {};
    tune.leverPress = 0.3;
    for (k in tune.pins) tune.pins[k].err = false;
  }
}
function tuneRing(r, soft) {
  var Lz = tuneLayout(), f = TUNE_FREQ[r];
  playNote(f, 0, soft ? 0.35 : 0.8, 'sine', soft ? 0.2 : 0.32);
  playNote(f * 2, 0, soft ? 0.2 : 0.4, 'sine', soft ? 0.05 : 0.08);
  tune.bells[r].f = soft ? 0.3 : 0.5;
  if (!soft) spawnSparkles(Lz.bx, tuneRowY(r, Lz), 4, TUNE_COL[r]);
}
function tuneSoundCol(p, i) {
  var rows, j, k, row;
  if (p.kind === 'song') {
    row = TUNE_FREQ.indexOf(p.seq[i]);
    if (row >= 0) tuneRing(row);
    else playNote(p.seq[i], 0, 0.6, 'sine', 0.3);
    tune.tonttu.hitRow = row >= 0 ? row : 3;
    tune.tonttu.hitT = 0.18;
    return;
  }
  rows = p.seq[i];
  for (j = 0; j < rows.length; j++) tuneRing(rows[j]);
  if (p.kind === 'tonttu') {
    if (rows.length) { tune.tonttu.hitRow = rows[rows.length - 1]; tune.tonttu.hitT = 0.18; }
  } else {
    for (k in tune.pins) if (tune.pins[k].c === i) tune.pins[k].pl = 0.35;
    if (!rows.length) playNote(220, 0, 0.05, 'triangle', 0.06);
  }
}
function tuneUpdatePlay(dt) {
  var p = tune.play, n = p.seq.length;
  p.t += dt;
  while (p.i + 1 < n && p.t >= (p.i + 1) * p.step) { p.i++; tuneSoundCol(p, p.i); }
  if (p.t >= n * p.step + 0.45) {
    tune.play = null;
    if (p.kind === 'tonttu') { tune.heard = true; tune.stripT = tune.R.linger; }
    else if (p.kind === 'roll') tuneRollDone();
  }
}
function tuneRollDone() {
  var res = tuneCheck(tune.mel, tune.pins), i;
  if (res.ok) { tuneRoundDone(); return; }
  tune.misses++;
  tune.pulls--;
  tune.springPop = 0.5;
  for (i = 0; i < res.wrong.length; i++) { tune.pins[res.wrong[i]].err = true; tune.pins[res.wrong[i]].shake = 0.9; }
  if (tune.round === 0) tune.ghost = true;
  else for (i = 0; i < res.missCols.length; i++) tune.colMiss[res.missCols[i]] = true;
  tune.tonttu.no = 1.0;
  artShakeStart(viewH * 0.005, 0.3);
  playNote(330, 0, 0.2, 'triangle', 0.22);
  playNote(247, 0.18, 0.35, 'triangle', 0.22);
  playNote(150, 0.1, 0.3, 'sawtooth', 0.06);
  if (tune.pulls <= 0) {
    // Jousi lopussa: tonttu arpoo uuden melodian (kierroksen uusinta)
    tune.resetT = 1.8;
    playNote(196, 0.6, 0.5, 'triangle', 0.22);
    playNote(165, 0.9, 0.6, 'triangle', 0.22);
  }
}
function tuneRoundDone() {
  var i, k, p, Lz = tuneLayout(), mel = [523, 659, 784, 880, 1047], gold = tune.misses === 0;
  tune.state = 'roundDone';
  tune.t = 0;
  tune.gold[tune.round] = gold;
  for (k in tune.pins) {
    p = tune.pins[k];
    spawnSparkles(tuneColX(p.c, Lz), tuneRowY(p.r, Lz), 5, TUNE_COL[p.r]);
    p.pop = 0.3;
  }
  artPop(Lz.ox + Lz.cs * Lz.n / 2, Lz.oy + Lz.cs * TUNE_ROWS / 2, Lz.cs * 2, '#ffe27a', 'ring');
  tune.tonttu.joy = 2;
  if (tune.dancer) tune.dancer.v = 16;
  for (i = 0; i < mel.length; i++) playNote(mel[i], 0.2 + i * 0.12, 0.25, 'triangle', 0.3);
  if (gold) playNote(1760, 0.9, 0.3, 'sine', 0.3);
  if (tune.round === 1 || tune.round === 2) tune.taskDelay = 1.6;
}

// ---------- Syöte ----------
function handleTuneTap(px, py) {
  var Lz, cell, k, p, b;
  if (puzzleBusy() || celebrating) return;
  if (tune.state !== 'play' || tune.resetT > 0 || (tune.play && tune.play.kind === 'roll')) { propsTap(px, py); return; }
  Lz = tuneLayout();
  // Rullan nasta: koko ruutu on tarttumisaluetta
  cell = tuneCellAt(px, py, Lz, 0);
  if (cell && tune.pins[tuneKey(cell.c, cell.r)]) {
    k = tuneKey(cell.c, cell.r);
    p = tune.pins[k];
    delete tune.pins[k];
    tune.drag = { x: tuneColX(p.c, Lz), y: tuneRowY(p.r, Lz), from: { c: p.c, r: p.r } };
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  // Nastalaatikko: uusi nasta
  b = Lz.box;
  if (px > b.x - viewH * 0.02 && px < b.x + b.w + viewH * 0.02 && py > b.y - viewH * 0.03 && py < b.y + b.h + viewH * 0.02) {
    tune.drag = { x: px, y: py, from: null };
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  // Kello tai tyhjä ruutu: rivin sävel
  if (Math.abs(px - Lz.bx) < Lz.cs * 0.55 && py > Lz.oy && py < Lz.oy + Lz.cs * TUNE_ROWS) {
    tuneRing(TUNE_ROWS - 1 - Math.floor((py - Lz.oy) / Lz.cs));
    return;
  }
  if (cell) { tuneRing(cell.r, true); return; }
  // Tonttu soittaa melodian uudelleen (jos kuuntelukertoja on)
  if (Math.hypot(px - Lz.tx, py - (Lz.ty - Lz.s * 1.0)) < Lz.s * 1.2) { tuneListen(); return; }
  // Vipu pyörittää rullaa
  if (Math.hypot(px - Lz.lx, py - Lz.ly) < Lz.lr * 1.4) { tunePull(); return; }
  propsTap(px, py);
}
function tuneListen() {
  if (tune.play) return;
  if (tune.R.listens >= 0 && tune.listens <= 0) {
    // Nuottilaput lopussa: tonttu pudistaa päätään
    tune.tonttu.no = 0.8;
    playNote(262, 0, 0.15, 'triangle', 0.18);
    playNote(247, 0.12, 0.2, 'triangle', 0.18);
    return;
  }
  if (tune.R.listens >= 0) tune.listens--;
  tune.tonttu.blink = 0.3;
  tuneStartPlay('tonttu');
}
function tunePull() {
  var k, any = false;
  if (tune.play) return;
  for (k in tune.pins) any = true;
  if (!any) {
    // Tyhjä rulla: vipu nytkähtää, ei kuluta vetoa
    tune.leverPress = 0.2;
    playNote(200, 0, 0.1, 'triangle', 0.2);
    return;
  }
  playNote(330, 0, 0.08, 'triangle', 0.2);
  tuneStartPlay('roll');
}
function tuneDrop(d) {
  var Lz = tuneLayout(), cell = tuneCellAt(d.x, d.y, Lz, 0.4), k, cx, cy;
  if (cell && !tune.pins[tuneKey(cell.c, cell.r)]) {
    k = tuneKey(cell.c, cell.r);
    cx = tuneColX(cell.c, Lz); cy = tuneRowY(cell.r, Lz);
    tune.pins[k] = { c: cell.c, r: cell.r, pop: 0.25, shake: 0, err: false, pl: 0, offX: d.x - cx, offY: d.y - cy };
    delete tune.colMiss[cell.c];
    tune.placed = true;
    // Paikalleen pantu nasta soi rivinsä sävelen
    tuneRing(cell.r, true);
  } else if (cell && d.from) {
    // Varattu ruutu: nasta palaa paikalleen
    cx = tuneColX(d.from.c, Lz); cy = tuneRowY(d.from.r, Lz);
    tune.pins[tuneKey(d.from.c, d.from.r)] = { c: d.from.c, r: d.from.r, pop: 0, shake: 0, err: false, pl: 0, offX: d.x - cx, offY: d.y - cy };
    playNote(300, 0, 0.08, 'triangle', 0.15);
  } else {
    // Rullan ulkopuolelle: nasta lentää laatikkoon
    tune.fly.push({ x0: d.x, y0: d.y, t: 0, color: TUNE_PIN });
    playNote(600, 0, 0.06, 'sine', 0.15);
  }
}

// ---------- Päivitys ----------
function updateTune(dt) {
  var busy, i, k, p, d, Lz, tt = tune.tonttu;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  // Animaatiot
  for (i = 0; i < tune.bells.length; i++) if (tune.bells[i].f > 0) tune.bells[i].f -= dt;
  for (k in tune.pins) {
    p = tune.pins[k];
    if (p.pop > 0) p.pop -= dt;
    if (p.shake > 0) p.shake -= dt;
    if (p.pl > 0) p.pl -= dt;
    p.offX *= Math.max(0, 1 - dt * 16);
    p.offY *= Math.max(0, 1 - dt * 16);
  }
  for (i = tune.fly.length - 1; i >= 0; i--) {
    tune.fly[i].t += dt;
    if (tune.fly[i].t > 0.4) tune.fly.splice(i, 1);
  }
  if (tt.blink > 0) tt.blink -= dt;
  if (tt.no > 0) tt.no -= dt;
  if (tt.joy > 0) tt.joy -= dt;
  if (tt.hitT > 0) tt.hitT -= dt;
  if (tune.springPop > 0) tune.springPop -= dt;
  if (tune.leverPress > 0) tune.leverPress -= dt;
  if (tune.play && tune.play.kind === 'roll') tune.crank += dt * 5;
  if (tune.taskDelay > 0 && !busy) {
    tune.taskDelay -= dt;
    if (tune.taskDelay <= 0) {
      if (tune.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (tune.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Raahaus: nasta kulkee sormen yläpuolella, jotta sen näkee
  if (tune.drag) {
    d = tune.drag;
    if (holding && !busy) {
      Lz = tuneLayout();
      d.x += (lastPX - d.x) * Math.min(1, dt * 18);
      d.y += (lastPY - Lz.cs * 0.45 - d.y) * Math.min(1, dt * 18);
    } else {
      tune.drag = null;
      tuneDrop(d);
    }
  }
  if (busy || celebrating) return;
  tune.t += dt;
  if (tune.state === 'intro') { if (tune.t > 0.6) tuneStartRound(); return; }
  if (tune.state === 'roundDone') {
    if (tune.t > 2.4 && tune.taskDelay <= 0) {
      tune.round++;
      if (tune.round >= TUNE_ROUNDS.length) { tune.state = 'won'; tune.t = 0; soundFanfare(); }
      else tuneStartRound();
    }
    return;
  }
  if (tune.state === 'won') { if (tune.t > 1.4) startCelebration(); return; }
  if (tune.play) tuneUpdatePlay(dt);
  if (tune.state !== 'play') return;
  if (tune.resetT > 0) {
    tune.resetT -= dt;
    tt.no = Math.max(tt.no, 0.3);
    if (tune.resetT <= 0) tuneNewMelody(false);
    return;
  }
  if (tune.autoT > 0) {
    tune.autoT -= dt;
    if (tune.autoT <= 0 && !tune.play) tuneStartPlay('tonttu');
  }
  if (tune.stripT > 0 && !(tune.play && tune.play.kind === 'tonttu')) tune.stripT -= dt;
  // Vihjeet 1. kierroksella: käsi vie nastan rullaan, valmiilla rullalla käsi näyttää vivun
  if (tune.round === 0 && tune.heard && !tune.placed && !tune.drag && !tune.play) tune.hintT += dt;
  if (tune.round === 0 && !tune.play && !tune.drag && tuneCheck(tune.mel, tune.pins).ok) tune.leverT += dt;
  else tune.leverT = 0;
}

// ---------- Piirto ----------
function renderTuneBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#6a4a6a');
  g.addColorStop(1, '#3e2a46');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Lautaseinä
  b.strokeStyle = 'rgba(20,10,25,0.22)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 14; i++) { x = vw * i / 14; b.beginPath(); b.moveTo(x, 0); b.lineTo(x, h); b.stroke(); }
  // Pyöreä ikkuna: tähtitaivas ja kuu
  artCircle(b, vw * 0.5, h * 0.1, h * 0.065, '#2a3a7a', { lineColor: '#3a2418', line: Math.max(3, h * 0.012), shadeTo: '#1a2450' });
  artCircle(b, vw * 0.5 + h * 0.02, h * 0.085, h * 0.018, '#fff6c0', { line: false, flat: true });
  b.fillStyle = '#ffffff';
  for (i = 0; i < 6; i++) b.fillRect(vw * 0.5 - h * 0.04 + ((i * 37) % 7) * h * 0.012, h * 0.06 + ((i * 53) % 5) * h * 0.016, Math.max(1.5, h * 0.004), Math.max(1.5, h * 0.004));
  // Seinälle maalatut nuotit
  b.globalAlpha = 0.18;
  tuneDrawNote(b, vw * 0.3, h * 0.12, h * 0.025, '#ffd24f');
  tuneDrawNote(b, vw * 0.7, h * 0.09, h * 0.02, '#ff9ec6');
  tuneDrawNote(b, vw * 0.78, h * 0.16, h * 0.018, '#7fd4ff');
  b.globalAlpha = 1;
  // Hylly tanssijan soittorasialle
  artRoundRect(b, vw * 0.84, h * 0.3, vw * 0.15, h * 0.022, h * 0.008, '#a0703a', { lineColor: '#4a2a10' });
  artLimb(b, vw * 0.87, h * 0.322, vw * 0.87, h * 0.36, h * 0.012, '#8a5a30', '#4a2a10');
  artLimb(b, vw * 0.96, h * 0.322, vw * 0.96, h * 0.36, h * 0.012, '#8a5a30', '#4a2a10');
  // Työpöytä
  artRoundRect(b, 0, h * 0.82, vw, h * 0.18, 0, '#8a5a30', { shadeTo: '#5a3a1a', line: false });
  b.strokeStyle = '#4a2a10';
  b.lineWidth = Math.max(2, h * 0.006);
  b.beginPath(); b.moveTo(0, h * 0.82); b.lineTo(vw, h * 0.82); b.stroke();
}
function tuneDrawNote(c, x, y, s, color) {
  var dark = artShade(color, -0.45);
  artLimb(c, x + s * 0.4, y, x + s * 0.4, y - s * 1.6, s * 0.18, color, dark);
  c.beginPath();
  c.moveTo(x + s * 0.4, y - s * 1.6);
  c.quadraticCurveTo(x + s * 1.2, y - s * 1.2, x + s * 1.0, y - s * 0.6);
  c.quadraticCurveTo(x + s * 0.9, y - s * 1.0, x + s * 0.4, y - s * 1.05);
  c.closePath();
  artFillPath(c, color, y - s * 1.6, y - s * 0.6, s * 0.5, { lineColor: dark });
  artBlob(c, x, y, s * 0.5, s * 0.36, color, { rot: -0.4, lineColor: dark, hi: 0.3 });
}
// Kello: kupu, levenevä helma ja läppä; heilahtaa soidessa (keskipiste x, y)
function tuneDrawBell(c, x, y, r, color, swing) {
  c.save();
  c.translate(x, y - r * 0.8);
  c.rotate(swing);
  c.translate(0, r * 0.8);
  artCircle(c, 0, r * 0.62, r * 0.17, '#8a6a30', { lineColor: '#4a3418' });
  c.beginPath();
  c.moveTo(-r * 0.9, r * 0.55);
  c.quadraticCurveTo(-r * 0.6, r * 0.35, -r * 0.55, -r * 0.1);
  c.quadraticCurveTo(-r * 0.5, -r * 0.8, 0, -r * 0.8);
  c.quadraticCurveTo(r * 0.5, -r * 0.8, r * 0.55, -r * 0.1);
  c.quadraticCurveTo(r * 0.6, r * 0.35, r * 0.9, r * 0.55);
  c.closePath();
  artFillPath(c, color, -r * 0.8, r * 0.55, r, { lineColor: artShade(color, -0.5) });
  artHighlight(c, -r * 0.25, -r * 0.35, r * 0.12, r * 0.25, 0.4);
  artCircle(c, 0, -r * 0.9, r * 0.13, '#c0a060', { lineColor: '#5a4020', flat: true });
  c.restore();
}
function tuneDrawPin(c, x, y, r, color, err) {
  artShadow(c, x + r * 0.15, y + r * 0.45, r * 0.9, r * 0.35, 0.25);
  artCircle(c, x, y, r, color, { lineColor: artShade(color, -0.5), hi: 0.45 });
  if (err) {
    c.strokeStyle = '#ff3a3a';
    c.lineWidth = Math.max(2, r * 0.22);
    c.beginPath(); c.arc(x, y, r * 1.4, 0, Math.PI * 2); c.stroke();
  }
}
// Tonttu kellopelin vieressä (jalat x, y); vasara osuu kohtaan mx, my
function tuneDrawTonttu(c, x, y, s, mx, my) {
  var tt = tune.tonttu, hop = tt.joy > 0 ? Math.abs(Math.sin(globalT * 10)) * s * 0.25 : 0;
  var sh = tt.no > 0 ? Math.sin(globalT * 28) * s * 0.07 : 0, bx = x, by = y - s * 0.75 - hop;
  var shx = bx + s * 0.25, shy = by, dx = mx - shx, dy = my - shy, dd = Math.max(1, Math.hypot(dx, dy));
  var reach = Math.min(dd * 0.45, s * 0.7), hx = shx + dx / dd * reach, hy = shy + dy / dd * reach;
  artShadow(c, bx, y + s * 0.02, s * 0.55, s * 0.12, 0.22);
  artBlob(c, bx, by + s * 0.25, s * 0.42, s * 0.5, '#e0403a', { lineColor: '#8a1a1a', hi: 0.2 });
  // Vasara: varsi kädestä kelloon, purppurainen nuppi
  c.strokeStyle = '#6a4a28';
  c.lineWidth = Math.max(2, s * 0.06);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(mx, my); c.stroke();
  artCircle(c, mx, my, s * 0.11, '#c86ad8', { lineColor: '#5a2a6a' });
  artLimb(c, shx, shy, hx, hy, s * 0.13, '#e0403a', '#8a1a1a');
  artCircle(c, hx, hy, s * 0.11, '#ffd9b8', { lineColor: '#c99a7a' });
  // Pää, parta ja hattu
  artCircle(c, bx + sh, by - s * 0.42, s * 0.3, '#ffd9b8', { lineColor: '#c99a7a' });
  artBlob(c, bx + sh, by - s * 0.22, s * 0.28, s * 0.2, '#ffffff', { lineColor: '#c9c0d8' });
  artEye(c, bx - s * 0.1 + sh, by - s * 0.47, s * 0.05, 0.5, tt.blink > 0);
  artEye(c, bx + s * 0.1 + sh, by - s * 0.47, s * 0.05, 0.5, tt.blink > 0);
  if (tt.joy > 0) { artBlush(c, bx - s * 0.17 + sh, by - s * 0.36, s * 0.07); artBlush(c, bx + s * 0.17 + sh, by - s * 0.36, s * 0.07); }
  c.beginPath();
  c.moveTo(bx - s * 0.32 + sh, by - s * 0.55); c.lineTo(bx + s * 0.3 + sh, by - s * 0.55); c.lineTo(bx + s * 0.2 + sh, by - s * 1.15);
  c.closePath();
  artFillPath(c, '#e0403a', by - s * 1.15, by - s * 0.55, s * 0.3, { lineColor: '#8a1a1a' });
  artCircle(c, bx + s * 0.2 + sh, by - s * 1.15, s * 0.08, '#ffffff', { line: false });
}
// Jousi: kolme kierrosta, kultainen = veto jäljellä (x, y = keskikohta)
function tuneDrawSpring(c, x, y, s, n) {
  var i, cy, pop = tune.springPop > 0 ? Math.sin(tune.springPop * 30) * s * 0.06 : 0;
  artRoundRect(c, x - s * 0.7, y - s * 1.15, s * 1.4, s * 0.22, s * 0.08, '#c0c8d8', { lineColor: '#4a5060' });
  artRoundRect(c, x - s * 0.7, y + s * 0.93, s * 1.4, s * 0.22, s * 0.08, '#c0c8d8', { lineColor: '#4a5060' });
  for (i = 0; i < TUNE_PULLS; i++) {
    cy = y - s * 0.6 + i * s * 0.6 + pop;
    var on = i >= TUNE_PULLS - n;
    if (on) artGlow(c, x, cy, s * 0.8, '#ffd24f', 0.35);
    c.beginPath();
    if (c.ellipse) c.ellipse(x, cy, s * 0.55, s * 0.22, -0.15, 0, Math.PI * 2);
    else c.arc(x, cy, s * 0.4, 0, Math.PI * 2);
    c.strokeStyle = '#4a3418';
    c.lineWidth = s * 0.24;
    c.stroke();
    c.strokeStyle = on ? '#ffd24f' : '#8a8090';
    c.lineWidth = s * 0.14;
    c.stroke();
  }
}
// ▶-vipu: pyöreä nappi, jonka takana kampi pyörii rullan soidessa
function tuneDrawLever(c, x, y, r, glow) {
  var press = tune.leverPress > 0 ? 1 : 0, a = tune.crank, ex = x + Math.cos(a) * r * 1.35, ey = y + Math.sin(a) * r * 1.35;
  if (glow > 0) artGlow(c, x, y, r * 2, '#b8ff9a', glow);
  artLimb(c, x, y, ex, ey, r * 0.2, '#8a5a30', '#4a2a10');
  artCircle(c, ex, ey, r * 0.22, '#c86ad8', { lineColor: '#5a2a6a' });
  artCircle(c, x, y + press * r * 0.08, r * (1 - press * 0.08), '#8fd46f', { lineColor: '#3a6a2a', hi: 0.4 });
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#3a6a2a';
  c.lineWidth = Math.max(2, r * 0.06);
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.3, y - r * 0.42 + press * r * 0.08);
  c.lineTo(x + r * 0.45, y + press * r * 0.08);
  c.lineTo(x - r * 0.3, y + r * 0.42 + press * r * 0.08);
  c.closePath(); c.fill(); c.stroke();
}
// Nuottilappu tontun yläpuolella: yksi uusintakuuntelu
function tuneDrawSheet(c, x, y, s, on) {
  c.globalAlpha = on ? 1 : 0.28;
  artRoundRect(c, x - s * 0.5, y - s * 0.65, s, s * 1.3, s * 0.12, '#fff6e0', { lineColor: '#b09060', flat: true });
  tuneDrawNote(c, x - s * 0.15, y + s * 0.3, s * 0.32, '#c86ad8');
  c.globalAlpha = 1;
}
function tuneDrawDancer(c, s, a) {
  var k = Math.cos(a), sx = 0.35 + 0.65 * Math.abs(k);
  artShadow(c, 0, 0, s * 1.1, s * 0.2, 0.2);
  // Kansi (peili) takana, rasia edessä
  artRoundRect(c, -s * 0.95, -s * 2.0, s * 1.9, s * 1.15, s * 0.15, '#e0a0ec', { lineColor: '#5a2a6a' });
  artBlob(c, 0, -s * 1.45, s * 0.6, s * 0.38, '#bfe6ff', { lineColor: '#7a8aa8', flat: true, hi: 0.5 });
  artRoundRect(c, -s, -s * 0.9, s * 2, s * 0.9, s * 0.15, '#c86ad8', { lineColor: '#5a2a6a', hi: 0.2 });
  artCircle(c, 0, -s * 0.45, s * 0.12, '#ffd24f', { lineColor: '#8a6a10', flat: true });
  // Tanssija pyörii (leveys kapenee kääntyessä)
  c.save();
  c.translate(0, -s * 0.9);
  c.scale(k < 0 ? -sx : sx, 1);
  artLimb(c, 0, 0, 0, -s * 0.5, s * 0.08, '#ffd9b8', '#c99a7a');
  artLimb(c, 0, -s * 0.9, -s * 0.28, -s * 1.25, s * 0.08, '#ffd9b8', '#c99a7a');
  artLimb(c, 0, -s * 0.9, s * 0.28, -s * 1.25, s * 0.08, '#ffd9b8', '#c99a7a');
  artLimb(c, 0, -s * 0.5, 0, -s * 0.92, s * 0.2, '#ff9ec6', '#b0507a');
  artBlob(c, 0, -s * 0.55, s * 0.45, s * 0.12, '#ff9ec6', { lineColor: '#b0507a' });
  artCircle(c, 0, -s * 1.1, s * 0.16, '#ffd9b8', { lineColor: '#c99a7a' });
  artCircle(c, 0, -s * 1.28, s * 0.08, '#8a5a30', { lineColor: '#4a2a10', flat: true });
  c.restore();
}
function tuneDrawMetronome(c, s, a) {
  artShadow(c, 0, 0, s * 0.8, s * 0.18, 0.2);
  c.beginPath();
  c.moveTo(-s * 0.6, 0); c.lineTo(s * 0.6, 0); c.lineTo(s * 0.25, -s * 1.7); c.lineTo(-s * 0.25, -s * 1.7);
  c.closePath();
  artFillPath(c, '#a0603a', -s * 1.7, 0, s, { lineColor: '#4a2a10' });
  artRoundRect(c, -s * 0.28, -s * 1.4, s * 0.56, s * 1.0, s * 0.1, '#f0e0c0', { lineColor: '#8a6a40', flat: true });
  c.save();
  c.translate(0, -s * 0.3);
  c.rotate(a);
  artLimb(c, 0, 0, 0, -s * 1.3, s * 0.07, '#c0c8d8', '#4a5060');
  artRoundRect(c, -s * 0.13, -s * 0.95, s * 0.26, s * 0.18, s * 0.05, '#ffd24f', { lineColor: '#8a6a10', flat: true });
  c.restore();
}
function tuneDrawDrum(c, s, b) {
  var up = b * s * 0.35;
  artShadow(c, 0, 0, s * 1.1, s * 0.2, 0.2 * (1 - b * 0.5));
  c.save();
  c.translate(0, -up);
  artRoundRect(c, -s, -s * 1.1, s * 2, s * 1.05, s * 0.2, '#ff7a5a', { lineColor: '#8a2a1a', hi: 0.2 });
  c.strokeStyle = '#fff6e0';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath();
  c.moveTo(-s * 0.9, -s * 0.9); c.lineTo(-s * 0.5, -s * 0.25); c.lineTo(-s * 0.1, -s * 0.9); c.lineTo(s * 0.3, -s * 0.25); c.lineTo(s * 0.7, -s * 0.9);
  c.stroke();
  artBlob(c, 0, -s * 1.1, s, s * 0.25, '#fff6e0', { lineColor: '#8a6a40' });
  c.restore();
  artLimb(c, -s * 0.9, -s * 1.6 - up, s * 0.1, -s * 1.15 - up, s * 0.1, '#d9b070', '#6a4a20');
  artLimb(c, s * 0.9, -s * 1.5 - up, -s * 0.05, -s * 1.15 - up, s * 0.1, '#d9b070', '#6a4a20');
}

function drawTune() {
  var c = ctx, Lz, cs, i, k, p, r, x, y, n, mel = tune.mel, res, tt = tune.tonttu, pr, playing;
  if (!beginPlayWorld()) return;
  propsDraw(c);
  if (mel) {
    Lz = tuneLayout();
    cs = Lz.cs;
    n = Lz.n;
    playing = tune.play;
    // Akseli ja rulla: messinkisylinteri, rivien värijuovat ja nastojen reiät
    artRoundRect(c, Lz.ox - cs * 0.4, Lz.oy + cs * 2.3, cs * (n + 0.8), cs * 0.4, cs * 0.12, '#8a6a40', { lineColor: '#4a3418' });
    artRoundRect(c, Lz.ox - cs * 0.12, Lz.oy - cs * 0.1, cs * (n + 0.24), cs * (TUNE_ROWS + 0.2), cs * 0.25, '#f0cc70', { shadeTo: '#a07830', lineColor: '#5a3a10', hi: 0.12 });
    for (r = 0; r < TUNE_ROWS; r++) {
      c.fillStyle = artRGBA(TUNE_COL[r], 0.2);
      c.fillRect(Lz.ox, tuneRowY(r, Lz) - cs * 0.4, cs * n, cs * 0.8);
    }
    c.strokeStyle = 'rgba(90,60,20,0.28)';
    c.lineWidth = Math.max(1, cs * 0.025);
    c.beginPath();
    for (i = 1; i < n; i++) { c.moveTo(Lz.ox + i * cs, Lz.oy); c.lineTo(Lz.ox + i * cs, Lz.oy + cs * TUNE_ROWS); }
    c.stroke();
    c.fillStyle = 'rgba(90,60,20,0.4)';
    c.beginPath();
    for (i = 0; i < n; i++) for (r = 0; r < TUNE_ROWS; r++) {
      x = tuneColX(i, Lz); y = tuneRowY(r, Lz);
      c.moveTo(x + cs * 0.07, y); c.arc(x, y, cs * 0.07, 0, Math.PI * 2);
    }
    c.fill();
    // Rullan soitto: osoitinsarake hohtaa
    if (playing && playing.kind === 'roll' && playing.i >= 0 && playing.i < n) {
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(Lz.ox + playing.i * cs, Lz.oy - cs * 0.1, cs, cs * (TUNE_ROWS + 0.2));
    }
    // Sarakkeet, joista puuttuu sävel (2. kierroksesta alkaen)
    for (k in tune.colMiss) {
      i = Number(k);
      c.fillStyle = 'rgba(255,70,70,' + (0.16 + Math.sin(globalT * 5) * 0.08) + ')';
      c.fillRect(Lz.ox + i * cs, Lz.oy - cs * 0.1, cs, cs * (TUNE_ROWS + 0.2));
      x = tuneColX(i, Lz); y = Lz.oy + cs * (TUNE_ROWS + 0.22);
      c.fillStyle = '#ff4a4a';
      c.beginPath(); c.moveTo(x, y - cs * 0.12); c.lineTo(x + cs * 0.14, y + cs * 0.08); c.lineTo(x - cs * 0.14, y + cs * 0.08); c.closePath(); c.fill();
    }
    // Aavenastat puuttuviin kohtiin (vain 1. kierros, väärän soiton jälkeen)
    if (tune.ghost) {
      for (i = 0; i < n; i++) for (k = 0; k < mel[i].length; k++) {
        r = mel[i][k];
        if (tune.pins[tuneKey(i, r)]) continue;
        c.globalAlpha = 0.3 + Math.sin(globalT * 4) * 0.12;
        artCircle(c, tuneColX(i, Lz), tuneRowY(r, Lz), cs * 0.25, TUNE_COL[r], { line: false, flat: true });
        c.globalAlpha = 1;
      }
    }
    // Nastat
    for (k in tune.pins) {
      p = tune.pins[k];
      x = tuneColX(p.c, Lz) + p.offX + (p.shake > 0 ? Math.sin(globalT * 50) * cs * 0.06 : 0);
      y = tuneRowY(p.r, Lz) + p.offY;
      if (p.pl > 0) artGlow(c, x, y, cs * 0.6, TUNE_COL[p.r], p.pl * 2);
      tuneDrawPin(c, x, y, cs * 0.27 * (1 + Math.max(0, p.pop) * 0.8 + Math.max(0, p.pl) * 0.5), TUNE_COL[p.r], p.err);
    }
    tuneDrawStrip(c, Lz);
    // Kellopeli: teline, kielet rullaan ja kellot
    artRoundRect(c, Lz.bx - cs * 0.07, Lz.oy - cs * 0.25, cs * 0.14, cs * (TUNE_ROWS + 0.4), cs * 0.07, '#8a5a30', { lineColor: '#4a2a10' });
    c.strokeStyle = '#8a6a40';
    c.lineWidth = Math.max(1.5, cs * 0.05);
    c.beginPath();
    for (r = 0; r < TUNE_ROWS; r++) { y = tuneRowY(r, Lz); c.moveTo(Lz.bx, y); c.lineTo(Lz.ox - cs * 0.1, y); }
    c.stroke();
    for (r = 0; r < TUNE_ROWS; r++) {
      var fl = Math.max(0, tune.bells[r].f), br = tuneBellR(r, cs);
      y = tuneRowY(r, Lz);
      if (fl > 0) artGlow(c, Lz.bx, y, br * 2.6, TUNE_COL[r], Math.min(0.9, fl * 2));
      tuneDrawBell(c, Lz.bx, y, br, fl > 0 ? artMix(TUNE_COL[r], '#ffffff', Math.min(0.6, fl * 1.4)) : TUNE_COL[r], Math.sin(globalT * 40) * fl * 0.5);
    }
    // Tonttu: vasara kohti soitettavaa kelloa, levossa keskikellon vieressä
    pr = tt.hitT > 0 && tt.hitRow >= 0 ? tt.hitRow : 2;
    var tmx = Lz.bx - tuneBellR(pr, cs) * (tt.hitT > 0 ? 0.85 : 1.3) - (tt.hitT > 0 ? 0 : Lz.s * 0.15), tmy = tuneRowY(pr, Lz);
    if (!tt.mx) { tt.mx = tmx; tt.my = tmy; }
    tt.mx += (tmx - tt.mx) * 0.45;
    tt.my += (tmy - tt.my) * 0.45;
    tuneDrawTonttu(c, Lz.tx, Lz.ty, Lz.s, tt.mx, tt.my);
    // Nuottilaput: uusintakuuntelut (rajattu 3. kierroksesta)
    if (tune.R.listens >= 0) {
      for (i = 0; i < tune.R.listens; i++) tuneDrawSheet(c, Lz.tx + (i - (tune.R.listens - 1) / 2) * Lz.s * 0.6, Lz.ty - Lz.s * 2.15, Lz.s * 0.45, i < tune.listens);
    }
    // Jousi ja vipu
    tuneDrawSpring(c, Lz.sx, Lz.sy, viewH * 0.06, tune.pulls);
    tuneDrawLever(c, Lz.lx, Lz.ly, Lz.lr, tune.leverT > 0 ? 0.3 + Math.sin(globalT * 6) * 0.15 : 0);
    tuneDrawBox(c, Lz);
    // Lentävät nastat laatikkoon
    for (i = 0; i < tune.fly.length; i++) {
      var f = tune.fly[i], q = easeOutCubic(Math.max(0, f.t) / 0.4), bxc = Lz.box.x + Lz.box.w / 2, byc = Lz.box.y + Lz.box.h * 0.4;
      tuneDrawPin(c, f.x0 + (bxc - f.x0) * q, f.y0 + (byc - f.y0) * q - Math.sin(q * Math.PI) * cs * 0.6, cs * 0.27 * (1 - q * 0.5), f.color, false);
    }
    // Raahattava nasta: saa rivin värin rullan päällä
    if (tune.drag) {
      var dc = tuneCellAt(tune.drag.x, tune.drag.y, Lz, 0.4);
      tuneDrawPin(c, tune.drag.x, tune.drag.y, cs * 0.31, dc ? TUNE_COL[dc.r] : TUNE_PIN, false);
    }
    // Vihjeet 1. kierroksella
    if (tune.round === 0 && tune.state === 'play' && !tune.drag && !playing) {
      if (!tune.placed && tune.hintT > 1.5) {
        res = tuneCheck(mel, tune.pins);
        if (res.missing.length) {
          var hp = (tune.hintT - 1.5) % 3.2, kk = easeInOutSine(Math.min(1, hp / 1.6));
          var hx0 = Lz.box.x + Lz.box.w / 2, hy0 = Lz.box.y + Lz.box.h * 0.4;
          var hx1 = tuneColX(res.missing[0].c, Lz), hy1 = tuneRowY(res.missing[0].r, Lz);
          if (hp < 2) {
            x = hx0 + (hx1 - hx0) * kk; y = hy0 + (hy1 - hy0) * kk;
            c.globalAlpha = hp > 1.7 ? (2 - hp) / 0.3 : 0.85;
            tuneDrawPin(c, x, y, cs * 0.27, kk > 0.5 ? TUNE_COL[res.missing[0].r] : TUNE_PIN, false);
            drawHand(c, x + cs * 0.2, y + cs * 0.35, cs * 0.45);
            c.globalAlpha = 1;
          }
        }
      }
      if (tune.leverT > 1.5) {
        var lk = (globalT % 1.2) / 1.2;
        drawHand(c, Lz.lx + Lz.lr * 0.2, Lz.ly + Lz.lr * 0.5 + Math.abs(Math.sin(lk * Math.PI)) * Lz.lr * 0.4, Lz.lr * 0.6);
      }
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawTuneHud(c);
  drawTaskOverlay(c);
}
// Tontun nuottinauha rullan yläpuolella: sävelet värillisinä palloina samoissa
// sarakkeissa kuin rullassa (korkeampi sävel ylempänä). 1. kierroksella aina
// näkyvissä, myöhemmin vain tontun soittaessa (ja hetken perään).
function tuneDrawStrip(c, Lz) {
  var cs = Lz.cs, n = Lz.n, sy = Lz.oy - cs * 0.95, sh = cs * 0.78, a = 0, rev = 0, i, j, x, y, row, cur = -1;
  var p = tune.play && tune.play.kind === 'tonttu' ? tune.play : null;
  if (tune.R.show === 'always') { a = 1; rev = n; }
  else if (p) { a = 1; rev = p.i + 1; }
  else if (tune.stripT > 0) { a = Math.min(1, tune.stripT / 0.6); rev = n; }
  if (p) cur = p.i;
  artRoundRect(c, Lz.ox, sy, cs * n, sh, cs * 0.15, '#fff6e0', { lineColor: '#b09060', flat: true, alpha: 0.55 + a * 0.45 });
  if (a <= 0) return;
  c.globalAlpha = a;
  for (i = 0; i < rev && i < n; i++) {
    x = tuneColX(i, Lz);
    if (!tune.mel[i].length) {
      // Tauko: harmaa viiva
      artRoundRect(c, x - cs * 0.15, sy + sh / 2 - cs * 0.04, cs * 0.3, cs * 0.08, cs * 0.04, '#9a8a80', { line: false, flat: true });
      continue;
    }
    for (j = 0; j < tune.mel[i].length; j++) {
      row = tune.mel[i][j];
      y = sy + sh / 2 + (2 - row) * cs * 0.12;
      artCircle(c, x, y, cs * 0.13 * (i === cur ? 1.35 : 1), TUNE_COL[row], { lineColor: artShade(TUNE_COL[row], -0.45) });
    }
  }
  c.globalAlpha = 1;
}
function tuneDrawBox(c, Lz) {
  var b = Lz.box, i, x, y, glow = tune.round === 0 && !tune.placed && tune.hintT > 1.5;
  if (glow) artGlow(c, b.x + b.w / 2, b.y + b.h / 2, b.w * 0.6, '#ffe27a', 0.3 + Math.sin(globalT * 5) * 0.12);
  artRoundRect(c, b.x, b.y, b.w, b.h, b.h * 0.25, '#b07840', { shadeTo: '#7a4a20', lineColor: '#4a2a10' });
  artRoundRect(c, b.x + b.h * 0.15, b.y + b.h * 0.12, b.w - b.h * 0.3, b.h * 0.5, b.h * 0.12, '#5a3418', { line: false, flat: true });
  for (i = 0; i < 14; i++) {
    x = b.x + b.h * 0.35 + (i / 13) * (b.w - b.h * 0.7);
    y = b.y + b.h * 0.3 + ((i * 37) % 5) / 5 * b.h * 0.2;
    artCircle(c, x, y, b.h * 0.1, TUNE_PIN, { lineColor: '#8a6a20', flat: true });
  }
}
// HUD: kierrokset nuotteina; kultainen = onnistui ensimmäisellä soitolla
function drawTuneHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = TUNE_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.6 * n + hs * 1.2, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < tune.round || tune.state === 'won' || (i === tune.round && tune.state === 'roundDone');
    var x = left + hs * 1.7 + i * hs * 2.6, y = pad * 0.5 + hs * 2.4;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && tune.gold[i]) artGlow(c, x + hs * 0.3, y - hs * 0.6, hs * 1.7, '#ffd24f', 0.7);
    tuneDrawNote(c, x, y, hs * 0.75, done && tune.gold[i] ? '#ffd24f' : '#c86ad8');
    c.globalAlpha = 1;
  }
}

HUB_ICONS.tune = function (c, x, y, s) {
  var i, cols = ['#ff5f5f', '#ffd24f', '#5fa8ff'];
  artRoundRect(c, x - s * 0.14, y - s * 0.12, s * 0.34, s * 0.22, s * 0.05, '#f0cc70', { lineColor: '#5a3a10' });
  for (i = 0; i < 3; i++) artCircle(c, x - s * 0.07 + i * s * 0.1, y - s * 0.06 + ((i * 2) % 3) * s * 0.05, s * 0.03, cols[i], { lineColor: '#4a3418', flat: true });
  tuneDrawBell(c, x - s * 0.22, y - s * 0.01, s * 0.08, '#c86ad8', Math.sin(globalT * 3) * 0.2);
};
