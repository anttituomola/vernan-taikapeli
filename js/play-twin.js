'use strict';

// Pupuparin piha (Kaukamaa, Maalaiskylä): REAALIAIKAINEN yhteispeli kahdelle
// (lapsi + aikuinen) samalla tabletilla. Piha on jaettu lauta-aidalla kahtia:
// vasen puoli on pinkin pupun (lapsi), oikea sinisen (aikuinen). Kumpikin
// napauttaa tai raahaa sormella omalla puolellaan, ja oma pupu hyppii sinne
// lyhintä reittiä. Sormia voi olla ruudulla kaksi yhtä aikaa (multiTouch).
//
// Toisen pupun apua tarvitaan koko ajan, eikä kumpikaan pääse yksin kotiin:
//   laatta + portti   portti aukeaa, kun TOINEN pupu seisoo samanvärisellä
//                     laatalla (laatat ovat aidan toisella puolella)
//   avain + luukku    avain ojennetaan aidan luukusta, kun molemmat puput
//                     seisovat luukulla; avain avaa lukitun portin pysyvästi
//   traktori          traktori ajaa peltotiellä edestakaisin, eikä tien yli
//                     pääse; toisen pupun punainen STOP-laatta pysäyttää sen
// Pupu ei koskaan rankaise: suljetun portin eteen se jää odottamaan, ja
// ajatuskupla näyttää, mitä se odottaa (laatan väri, avain tai traktori).
// Kierros on läpi, kun molemmat puput ovat kolossaan ja porkkanat kerätty.
// Viisi käsin tehtyä kierrosta; jokainen peilataan arvalla (pystysuunta ja
// puolet), joten uusinta ei ole sama. Kun kukaan ei koske ruutuun hetkeen,
// ratkaisija (twinSolve) näyttää kädellä seuraavan askeleen. Kultainen
// porkkana kierroksesta ilman vihjettä. Tehtävä toisen kierroksen jälkeen.

// Ruudukko: kummallakin puolella 6 × 5 ruutua, sarake 0 vasemmalla.
//   .  nurmi        #  heinäpaali/pensas   S  lähtö      H  kolo
//   c  porkkana     y v g o  laatta        Y V G O  portti (samaa väriä)
//   x  STOP-laatta (pysäyttää TOISEN puolen traktorin)
//   =  peltotie (traktorin kaista, yksi rivi)
//   k  avain        L  lukittu portti      u  luukku (aidan vieressä)
var TWIN_ROUNDS = [
  {
    L: ['S...#.',
        '.y..#H',
        '....V.',
        '..c.#.',
        '....#.'],
    R: ['.#...S',
        'H#....',
        '.Y.c..',
        'v#....',
        '.#....']
  },
  {
    L: ['S.#.#H',
        '..#.#.',
        'y.V.G.',
        '..#o#c',
        'c.#.#.'],
    R: ['H#.#.S',
        '.#.#..',
        '.OvY..',
        'g#.#c.',
        '.#c#..']
  },
  {
    L: ['S..#..',
        '.k.#.H',
        '...V.c',
        '...###',
        'c....u'],
    R: ['v.#..S',
        'H.L...',
        '..#.c.',
        '###...',
        'u.....']
  },
  {
    L: ['S..c#H',
        '.x..#.',
        '====#.',
        '..y.Vc',
        '.c..#.'],
    R: ['H#.c.S',
        '.#....',
        'v#====',
        '.Yx...',
        'c#..c.']
  },
  {
    L: ['S..##H',
        '.y.L.V',
        'c..#xc',
        '...###',
        '.....u'],
    R: ['Hv..#S',
        '..c.#.',
        '====#.',
        '...kY.',
        'u...#c']
  }
];
var TWIN_COLS = 6, TWIN_ROWS = 5;
var TWIN_SPEED = 3.4;          // pupun hypyt (ruutua/s)
var TWIN_TRACTOR_SPEED = 1.7;  // traktori (ruutua/s)
var TWIN_TRACTOR_LEN = 2;      // traktori + heinäkärry (ruutua)
var TWIN_HINT_IDLE = 9;        // vihje, kun kukaan ei ole koskenut ruutuun (s)
var TWIN_HINT_FIRST = 3;       // ensimmäisellä kierroksella vihje heti alussa (s)
var TWIN_PCOL = ['#ff7bac', '#5fa8ff'];
var TWIN_GCOL = { y: '#ffc23a', v: '#b05aff', g: '#3fcf6a', o: '#ff7a2a' };
var TWIN_STOP = '#ff4a4a';

var twin = {
  round: 0, state: 'intro', t: 0, L: null, b: [], carrots: [], key: null, lockOpen: false,
  tractors: [null, null], touches: {}, idle: 0, hint: null, hintUsed: false, gold: [],
  taskDelay: -1, open: {}, touched: false, lockAnim: 0, mouseDown: false
};

// ---------- Kierroksen rakennus ----------
// Peilaukset: flipV kääntää rivit, swap vaihtaa puolet (ja peilaa sarakkeet,
// jotta luukut ja kolot pysyvät aidan vieressä).
function twinBuild(def, flipV, swap) {
  var sides = swap ? [def.R, def.L] : [def.L, def.R], s, r, c, ch, row, L;
  L = {
    cell: [[], []], start: [], home: [], carrots: [], plates: [], gates: [], stops: [[], []],
    lanes: [null, null], hatch: [null, null], key: null, lock: null
  };
  for (s = 0; s < 2; s++) {
    for (r = 0; r < TWIN_ROWS; r++) {
      row = sides[s][flipV ? TWIN_ROWS - 1 - r : r];
      for (c = 0; c < TWIN_COLS; c++) {
        ch = row.charAt(swap ? TWIN_COLS - 1 - c : c);
        L.cell[s][c + r * TWIN_COLS] = ch;
        if (ch === 'S') L.start[s] = { c: c, r: r };
        else if (ch === 'H') L.home[s] = { c: c, r: r };
        else if (ch === 'c') L.carrots.push({ s: s, c: c, r: r });
        else if ('yvgo'.indexOf(ch) >= 0) L.plates.push({ s: s, c: c, r: r, g: ch });
        else if ('YVGO'.indexOf(ch) >= 0) L.gates.push({ s: s, c: c, r: r, g: ch.toLowerCase() });
        else if (ch === 'x') L.stops[s].push({ c: c, r: r });
        else if (ch === 'k') L.key = { s: s, c: c, r: r };
        else if (ch === 'L') L.lock = { s: s, c: c, r: r };
        else if (ch === 'u') L.hatch[s] = { c: c, r: r };
        else if (ch === '=') {
          if (!L.lanes[s]) L.lanes[s] = { r: r, c0: c, c1: c };
          L.lanes[s].c0 = Math.min(L.lanes[s].c0, c);
          L.lanes[s].c1 = Math.max(L.lanes[s].c1, c);
        }
      }
    }
  }
  return L;
}
function twinCh(s, c, r) {
  if (c < 0 || r < 0 || c >= TWIN_COLS || r >= TWIN_ROWS) return '#';
  return twin.L.cell[s][c + r * TWIN_COLS];
}

function twinStartRound() {
  var i, L, T, ln;
  L = twin.L = twinBuild(TWIN_ROUNDS[twin.round], Math.random() < 0.5, Math.random() < 0.5);
  twin.b = [];
  for (i = 0; i < 2; i++) {
    twin.b.push({
      s: i, c: L.start[i].c, r: L.start[i].r, fc: L.start[i].c, fr: L.start[i].r, from: null, prog: 0, moving: false,
      tc: L.start[i].c, tr: L.start[i].r, hop: 0, facing: i === 0 ? 1 : -1, wait: null, home: false, waveT: 0, pokeT: 0
    });
  }
  twin.carrots = [];
  for (i = 0; i < L.carrots.length; i++) twin.carrots.push({ s: L.carrots[i].s, c: L.carrots[i].c, r: L.carrots[i].r, got: false, wig: 0 });
  twin.key = L.key ? { s: L.key.s, c: L.key.c, r: L.key.r, holder: -1, used: false, fly: 0, passLock: false } : null;
  twin.lockOpen = false;
  twin.lockAnim = 0;
  twin.open = {};
  for (i = 0; i < 2; i++) {
    ln = L.lanes[i];
    T = null;
    if (ln) T = { s: i, pos: ln.c0, dir: 1, pause: 0, stopped: false, honkT: 0, puffT: 0, wasStopped: false };
    twin.tractors[i] = T;
  }
  twin.touches = {};
  twin.state = 'play';
  twin.t = 0;
  twin.idle = 0;
  twin.hint = null;
  twin.hintUsed = false;
  twin.touched = false;
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}

// ---------- Alustus ----------
function initTwin() {
  var i;
  tasks = [makeTask(-5, 'pairs', { pairs: 6 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  twin.round = 0;
  twin.state = 'intro';
  twin.t = 0;
  twin.L = null;
  twin.gold = [];
  twin.taskDelay = -1;
  twin.touches = {};
  twin.hint = null;
  renderBackground();
  twinSetupProps();
}
function respawnTwin() { twinStartRound(); }
function resizeTwin() { camX = 0; twinSetupProps(); }

// ---------- Asettelu ----------
function twinLayout() {
  var W = viewW, h = viewH, cs = Math.min(W * 0.44 / TWIN_COLS, h * 0.66 / TWIN_ROWS), gap = cs * 0.55;
  var fw = cs * TWIN_COLS * 2 + gap;
  return { cs: cs, gap: gap, ox: [W * 0.5 - fw / 2, W * 0.5 + gap / 2], oy: h * 0.16, fw: fw };
}
function twinCell(s, c, r, Lz) {
  Lz = Lz || twinLayout();
  return { x: Lz.ox[s] + (c + 0.5) * Lz.cs, y: Lz.oy + (r + 0.5) * Lz.cs };
}
function twinCellAt(s, px, py, Lz) {
  Lz = Lz || twinLayout();
  return {
    c: Math.max(0, Math.min(TWIN_COLS - 1, Math.floor((px - Lz.ox[s]) / Lz.cs))),
    r: Math.max(0, Math.min(TWIN_ROWS - 1, Math.floor((py - Lz.oy) / Lz.cs)))
  };
}

// ---------- Säännöt ----------
function twinOn(b, c, r) { return b.c === c && b.r === r; }
// Onko joku pupu laatalla, jonka väri on g?
function twinPlateDown(g) {
  var i, p, L = twin.L;
  for (i = 0; i < L.plates.length; i++) {
    p = L.plates[i];
    if (p.g === g && twinOn(twin.b[p.s], p.c, p.r)) return true;
  }
  return false;
}
// Puolen s traktori pysähtyy, kun toinen pupu seisoo STOP-laatalla
function twinStopDown(s) {
  var o = 1 - s, i, st = twin.L.stops[o];
  for (i = 0; i < st.length; i++) if (twinOn(twin.b[o], st[i].c, st[i].r)) return true;
  return false;
}
// Traktorin ja kärryn peittämät sarakkeet
function twinTractorCovers(T, c) {
  return c + 1 > T.pos + 0.05 && c < T.pos + TWIN_TRACTOR_LEN - 0.05;
}
function twinGateAt(s, c, r) {
  var i, G = twin.L.gates;
  for (i = 0; i < G.length; i++) if (G[i].s === s && G[i].c === c && G[i].r === r) return G[i];
  return null;
}
// Voiko pupu i hypätä ruutuun (c, r) juuri nyt? relaxed: kaikki muuttuvat
// esteet auki (ajatuskuplan syyn etsintä).
function twinPass(i, c, r, relaxed) {
  var b = twin.b[i], ch = twinCh(i, c, r), g, T;
  if (ch === '#') return false;
  if (relaxed) return true;
  if ('YVGO'.indexOf(ch) >= 0) return twinPlateDown(ch.toLowerCase()) || twinOn(b, c, r);
  if (ch === 'L') return twin.lockOpen || (twin.key && twin.key.holder === i && !twin.key.fly);
  if (ch === '=') {
    T = twin.tractors[i];
    if (!T || twinTractorCovers(T, c)) return false;
    g = twinCh(i, b.c, b.r) === '=';
    return T.stopped || g;
  }
  return true;
}
// Leveyshaku omalla puolella. Palauttaa { next, at } : ensimmäinen askel kohti
// kohdetta tai lähintä saavutettavaa ruutua (at = mihin päädytään).
function twinPlan(i, relaxed) {
  var b = twin.b[i], N = TWIN_COLS * TWIN_ROWS, prev = [], q = [], head = 0, id, c, r, d, nc, nr, nid;
  var goal = b.tc + b.tr * TWIN_COLS, best = -1, bestD = 1e9, dd, start = b.c + b.r * TWIN_COLS;
  for (id = 0; id < N; id++) prev[id] = -2;
  prev[start] = -1;
  q.push(start);
  while (head < q.length) {
    id = q[head++];
    c = id % TWIN_COLS; r = Math.floor(id / TWIN_COLS);
    dd = Math.abs(c - b.tc) + Math.abs(r - b.tr);
    if (dd < bestD) { bestD = dd; best = id; }
    if (id === goal) break;
    for (d = 0; d < 4; d++) {
      nc = c + [0, 1, 0, -1][d]; nr = r + [-1, 0, 1, 0][d];
      if (nc < 0 || nr < 0 || nc >= TWIN_COLS || nr >= TWIN_ROWS) continue;
      nid = nc + nr * TWIN_COLS;
      if (prev[nid] !== -2 || !twinPass(i, nc, nr, relaxed)) continue;
      prev[nid] = id;
      q.push(nid);
    }
  }
  var at = best, path = [];
  while (at >= 0 && at !== start) { path.unshift(at); at = prev[at]; }
  return { path: path, reached: best === goal, end: best };
}
// Ajatuskuplan syy: ensimmäinen este rennolla reitillä
function twinWaitReason(i) {
  var P = twinPlan(i, true), k, id, c, r, ch;
  if (!P.reached) return null;
  for (k = 0; k < P.path.length; k++) {
    id = P.path[k];
    c = id % TWIN_COLS; r = Math.floor(id / TWIN_COLS);
    if (twinPass(i, c, r, false)) continue;
    ch = twinCh(i, c, r);
    if ('YVGO'.indexOf(ch) >= 0) return { kind: 'gate', g: ch.toLowerCase(), c: c, r: r };
    if (ch === 'L') return { kind: 'key', c: c, r: r };
    if (ch === '=') return { kind: 'tractor', c: c, r: r };
    return null;
  }
  return null;
}

// ---------- Kosketus (kaksi sormea yhtä aikaa) ----------
function twinSideOf(px) { return px < viewW * 0.5 ? 0 : 1; }
function twinTouchDown(id, px, py) {
  var s, Lz, b, cell, i, p, ca;
  if (puzzleBusy() || celebrating) return;
  if (propsTap(px, py)) return;
  ambientPoke(px, py);
  if (twin.state !== 'play') return;
  s = twinSideOf(px);
  Lz = twinLayout();
  b = twin.b[s];
  twin.idle = 0;
  twin.hint = null;
  twin.touched = true;
  // Pupun tökkäys: hyppy ja piippaus (pupu jää paikalleen)
  p = twinCell(s, b.fc, b.fr, Lz);
  if (Math.hypot(px - p.x, py - (p.y + Lz.cs * 0.1)) < Lz.cs * 0.42 && !b.moving) {
    b.pokeT = 0.5;
    b.hop = 1;
    playNote(s ? 988 : 880, 0, 0.08, 'sine', 0.25);
    playNote(s ? 1319 : 1175, 0.08, 0.1, 'sine', 0.2);
    twin.touches[id] = { s: s, x: px, y: py, poke: true };
    return;
  }
  cell = twinCellAt(s, px, py, Lz);
  for (i = 0; i < twin.carrots.length; i++) {
    ca = twin.carrots[i];
    if (!ca.got && ca.s === s && ca.c === cell.c && ca.r === cell.r) ca.wig = 0.5;
  }
  twinTractorPoke(s, px, py, Lz);
  twin.touches[id] = { s: s, x: px, y: py, poke: false };
  twinSetTarget(s, cell, true);
}
function twinTouchMove(id, px, py) {
  var T = twin.touches[id], cell;
  if (!T || twin.state !== 'play') return;
  if (T.poke && Math.hypot(px - T.x, py - T.y) < viewH * 0.04) return;
  T.poke = false;
  // Sormi pysyy omalla puolellaan, vaikka se lipsuisi aidan yli
  cell = twinCellAt(T.s, px, py);
  twinSetTarget(T.s, cell, false);
}
function twinTouchUp(id) { delete twin.touches[id]; }
function twinSetTarget(s, cell, tap) {
  var b = twin.b[s], Lz;
  if (b.tc === cell.c && b.tr === cell.r) return;
  b.tc = cell.c; b.tr = cell.r;
  b.home = false;
  if (tap) {
    Lz = twinLayout();
    var p = twinCell(s, cell.c, cell.r, Lz);
    artPop(p.x, p.y, Lz.cs * 0.3, TWIN_PCOL[s], 'ring');
    playNote(s ? 659 : 587, 0, 0.06, 'triangle', 0.15);
  }
}
function twinTractorPoke(s, px, py, Lz) {
  var T = twin.tractors[s], ln = twin.L.lanes[s], p;
  if (!T) return;
  p = twinCell(s, T.pos + (TWIN_TRACTOR_LEN - 1) / 2, ln.r, Lz);
  if (Math.abs(px - p.x) < Lz.cs * TWIN_TRACTOR_LEN * 0.5 && Math.abs(py - p.y) < Lz.cs * 0.5) {
    T.honkT = 0.5;
    T.puffT = 0.6;
    twinHonk();
  }
}
function twinHonk() {
  playNote(220, 0, 0.16, 'square', 0.1);
  playNote(220, 0.2, 0.22, 'square', 0.1);
}

// ---------- Päivitys ----------
function updateTwin(dt) {
  var busy, i;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  for (i = 0; i < twin.carrots.length; i++) if (twin.carrots[i].wig > 0) twin.carrots[i].wig -= dt;
  if (twin.taskDelay > 0 && !busy) {
    twin.taskDelay -= dt;
    if (twin.taskDelay <= 0 && !tasks[0].opened) taskStart(tasks[0]);
  }
  for (i = 0; i < twin.b.length; i++) {
    twin.b[i].hop = Math.max(0, twin.b[i].hop - dt * 3.5);
    if (twin.b[i].pokeT > 0) twin.b[i].pokeT -= dt;
    if (twin.b[i].waveT > 0) twin.b[i].waveT -= dt;
  }
  if (twin.lockAnim > 0) twin.lockAnim -= dt;
  if (busy || celebrating) return;
  twin.t += dt;
  if (twin.state === 'intro') { if (twin.t > 0.6) twinStartRound(); return; }
  if (twin.state === 'roundDone') {
    if (twin.t > 2.4 && twin.taskDelay <= 0) {
      twin.round++;
      if (twin.round >= TWIN_ROUNDS.length) { twin.state = 'won'; twin.t = 0; soundFanfare(); }
      else twinStartRound();
    }
    return;
  }
  if (twin.state === 'won') { if (twin.t > 1.4) startCelebration(); return; }
  twinUpdateTractors(dt);
  for (i = 0; i < 2; i++) twinUpdateBunny(i, dt);
  twinUpdateGates();
  twinUpdateKey(dt);
  twinUpdateHint(dt);
  if (twinAtGoal()) twinRoundDone();
}
function twinUpdateBunny(i, dt) {
  var b = twin.b[i], P, id, nc, nr, ch, Lz;
  if (b.moving) {
    b.prog += dt * TWIN_SPEED;
    if (b.prog >= 1) {
      b.moving = false;
      b.fc = b.c; b.fr = b.r;
      twinArrive(i);
    } else {
      b.fc = b.from.c + (b.c - b.from.c) * b.prog;
      b.fr = b.from.r + (b.r - b.from.r) * b.prog;
    }
    return;
  }
  if (b.c === b.tc && b.r === b.tr) { b.wait = null; return; }
  P = twinPlan(i, false);
  if (!P.path.length) {
    // Jumissa: odotetaan, ja kupla kertoo mitä (syy päivitetään puolen sekunnin välein)
    if (!b.wait) b.wait = { t: 0, next: 0, why: null };
    b.wait.t += dt;
    b.wait.next -= dt;
    if (b.wait.next <= 0) { b.wait.why = twinWaitReason(i); b.wait.next = 0.5; }
    return;
  }
  b.wait = null;
  id = P.path[0];
  nc = id % TWIN_COLS; nr = Math.floor(id / TWIN_COLS);
  ch = twinCh(i, nc, nr);
  if (ch === 'L' && !twin.lockOpen) {
    // Avain avaa lukon pysyvästi
    twin.lockOpen = true;
    twin.lockAnim = 1;
    twin.key.holder = -1;
    twin.key.used = true;
    Lz = twinLayout();
    var lp = twinCell(i, nc, nr, Lz);
    artPop(lp.x, lp.y, Lz.cs * 0.6, '#ffd24f', 'burst');
    spawnSparkles(lp.x, lp.y, 18, '#ffd24f');
    playNote(784, 0, 0.1, 'triangle', 0.3);
    playNote(1047, 0.1, 0.1, 'triangle', 0.3);
    playNote(1568, 0.2, 0.3, 'triangle', 0.3);
  }
  b.from = { c: b.c, r: b.r };
  b.c = nc; b.r = nr;
  b.prog = 0;
  b.moving = true;
  b.hop = 1;
  if (nc > b.from.c) b.facing = 1; else if (nc < b.from.c) b.facing = -1;
  playNote((i ? 660 : 590) + nr * 20, 0, 0.05, 'sine', 0.1);
}
function twinArrive(i) {
  var b = twin.b[i], k, ca, Lz = twinLayout(), p, L = twin.L;
  for (k = 0; k < twin.carrots.length; k++) {
    ca = twin.carrots[k];
    if (!ca.got && ca.s === i && twinOn(b, ca.c, ca.r)) {
      ca.got = true;
      p = twinCell(i, ca.c, ca.r, Lz);
      artPop(p.x, p.y, Lz.cs * 0.4, '#ff8f3a', 'burst');
      spawnSparkles(p.x, p.y, 10, '#ff8f3a');
      playNote(988 + twinCarrotsGot() * 60, 0, 0.1, 'sine', 0.3);
    }
  }
  if (twin.key && twin.key.holder < 0 && !twin.key.used && twin.key.s === i && twinOn(b, twin.key.c, twin.key.r)) {
    twin.key.holder = i;
    p = twinCell(i, b.c, b.r, Lz);
    spawnSparkles(p.x, p.y, 12, '#ffd24f');
    playNote(1175, 0, 0.1, 'triangle', 0.3);
    playNote(1568, 0.1, 0.2, 'triangle', 0.3);
  }
  if (twinOn(b, L.home[i].c, L.home[i].r)) {
    if (!b.home) {
      b.home = true;
      b.waveT = 1.2;
      p = twinCell(i, b.c, b.r, Lz);
      spawnSparkles(p.x, p.y, 10, TWIN_PCOL[i]);
      playNote(784, 0, 0.1, 'triangle', 0.25);
      playNote(1047, 0.1, 0.18, 'triangle', 0.25);
    }
  } else b.home = false;
}
function twinCarrotsGot() {
  var i, n = 0;
  for (i = 0; i < twin.carrots.length; i++) if (twin.carrots[i].got) n++;
  return n;
}
// Porttien ääni ja kipinät, kun ne aukeavat tai sulkeutuvat
function twinUpdateGates() {
  var i, G, open, key, Lz, p;
  for (i = 0; i < twin.L.gates.length; i++) {
    G = twin.L.gates[i];
    key = G.s + ':' + G.c + ':' + G.r;
    open = twinPlateDown(G.g);
    if (open !== !!twin.open[key]) {
      Lz = Lz || twinLayout();
      p = twinCell(G.s, G.c, G.r, Lz);
      if (open) {
        spawnSparkles(p.x, p.y, 8, TWIN_GCOL[G.g]);
        playNote(1047, 0, 0.1, 'triangle', 0.25);
        playNote(1319, 0.08, 0.12, 'triangle', 0.2);
      } else playNote(392, 0, 0.1, 'triangle', 0.15);
    }
    twin.open[key] = open;
  }
}
function twinUpdateTractors(dt) {
  var s, T, ln, onLane, b, max;
  for (s = 0; s < 2; s++) {
    T = twin.tractors[s];
    if (!T) continue;
    ln = twin.L.lanes[s];
    if (T.honkT > 0) T.honkT -= dt;
    if (T.puffT > 0) T.puffT -= dt;
    T.stopped = twinStopDown(s);
    if (T.stopped && !T.wasStopped) { playNote(330, 0, 0.12, 'square', 0.08); T.puffT = 0.4; }
    if (!T.stopped && T.wasStopped) playNote(262, 0, 0.12, 'square', 0.08);
    T.wasStopped = T.stopped;
    if (T.stopped) continue;
    // Tiellä seisova pupu: traktori odottaa ja tööttää
    b = twin.b[s];
    onLane = twinCh(s, b.c, b.r) === '=' || (b.moving && twinCh(s, b.from.c, b.from.r) === '=');
    if (onLane) {
      if (T.honkT <= 0 && Math.random() < dt * 0.6) { T.honkT = 0.5; twinHonk(); }
      continue;
    }
    if (T.pause > 0) { T.pause -= dt; continue; }
    max = ln.c1 - TWIN_TRACTOR_LEN + 1;
    T.pos += T.dir * TWIN_TRACTOR_SPEED * dt;
    if (T.pos >= max) { T.pos = max; T.dir = -1; T.pause = 0.35; }
    if (T.pos <= ln.c0) { T.pos = ln.c0; T.dir = 1; T.pause = 0.35; }
    if (Math.random() < dt * 3) T.puffT = Math.max(T.puffT, 0.2);
  }
}
// Avain ojennetaan luukusta, kun molemmat puput ovat luukulla
function twinUpdateKey(dt) {
  var K = twin.key, H = twin.L.hatch, at0, at1, Lz, p;
  if (!K || K.used || !H[0] || !H[1]) return;
  if (K.fly > 0) {
    K.fly -= dt;
    if (K.fly <= 0) {
      K.fly = 0;
      Lz = twinLayout();
      p = twinCell(K.holder, twin.b[K.holder].c, twin.b[K.holder].r, Lz);
      spawnSparkles(p.x, p.y, 12, '#ffd24f');
      playNote(1568, 0, 0.15, 'triangle', 0.3);
    }
    return;
  }
  at0 = !twin.b[0].moving && twinOn(twin.b[0], H[0].c, H[0].r);
  at1 = !twin.b[1].moving && twinOn(twin.b[1], H[1].c, H[1].r);
  if (!at0 || !at1) { K.passLock = false; return; }
  if (K.holder < 0 || K.passLock) return;
  K.holder = 1 - K.holder;
  K.fly = 0.7;
  K.passLock = true;
  playNote(880, 0, 0.1, 'triangle', 0.3);
  playNote(1175, 0.12, 0.12, 'triangle', 0.3);
}
function twinAtGoal() {
  var L = twin.L, i;
  if (twinCarrotsGot() < twin.carrots.length) return false;
  for (i = 0; i < 2; i++) if (twin.b[i].moving || !twinOn(twin.b[i], L.home[i].c, L.home[i].r)) return false;
  return true;
}
function twinRoundDone() {
  var i, p, Lz = twinLayout();
  twin.state = 'roundDone';
  twin.t = 0;
  twin.hint = null;
  twin.gold[twin.round] = !twin.hintUsed;
  for (i = 0; i < 2; i++) {
    p = twinCell(i, twin.b[i].c, twin.b[i].r, Lz);
    artPop(p.x, p.y, Lz.cs * 0.8, TWIN_PCOL[i], 'ring');
    spawnSparkles(p.x, p.y, 16, TWIN_PCOL[i]);
    twin.b[i].waveT = 2;
  }
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (!twin.hintUsed) playNote(1760, 0.45, 0.3, 'sine', 0.3);
  if (twin.round === 1) twin.taskDelay = 1.6;
}

// ---------- Ratkaisija ja vihje ----------
// Leveyshaku "siirroilla": siirto = toinen pupu kävelee mihin tahansa ruutuun,
// johon se nykytilassa pääsee (toinen pupu pysyy paikallaan). Lukko avautuu
// vain siirron päätteeksi (lukkoruutuun), porkkana ja avain napataan
// siirron päätepisteessä. Luukun ojennus on oma siirtonsa. Tila:
// (pinkin ruutu, sinisen ruutu, avain: 0 maassa / 1 pinkillä / 2 sinisellä /
// 3 käytetty, porkkanamaski). Palauttaa siirrot [{ who, c, r } | { pass }].
function twinSolve(L, st) {
  var N = TWIN_COLS * TWIN_ROWS, nC = L.carrots.length, M = 1 << nC, KS = 4, total = N * N * KS * M;
  var prev = new Int32Array(total), mv = new Int32Array(total), q = new Int32Array(total), head = 0, tail = 0;
  var k, id, goal = -1, carrotAt = [{}, {}], full = M - 1, seen = new Int32Array(N), stamp = 0, fq = new Int32Array(N), fn;
  // Täyttö riippuu vain pupujen ruuduista ja avaimesta, ei porkkanoista: välimuisti
  var fillCache = [], fill, fk;
  for (k = 0; k < total; k++) prev[k] = -2;
  for (k = 0; k < nC; k++) carrotAt[L.carrots[k].s][L.carrots[k].c + L.carrots[k].r * TWIN_COLS] = k;
  function enc(a, b, kk, m) { return ((a * N + b) * KS + kk) * M + m; }
  function ch(s, i) { return L.cell[s][i]; }
  function plateDown(pos, g) {
    var i, p;
    for (i = 0; i < L.plates.length; i++) { p = L.plates[i]; if (p.g === g && p.c + p.r * TWIN_COLS === pos[p.s]) return true; }
    return false;
  }
  function stopDown(pos, s) {
    var i, sp = L.stops[1 - s];
    for (i = 0; i < sp.length; i++) if (sp[i].c + sp[i].r * TWIN_COLS === pos[1 - s]) return true;
    return false;
  }
  function canEnter(who, pos, kk, cell, fromLane) {
    var x = ch(who, cell);
    if (x === '#') return false;
    if ('YVGO'.indexOf(x) >= 0) return plateDown(pos, x.toLowerCase());
    if (x === 'L') return kk === 3 || kk === who + 1;
    if (x === '=') return stopDown(pos, who) || fromLane;
    return true;
  }
  id = enc(st.a, st.b, st.k, st.m);
  prev[id] = -1;
  q[tail++] = id;
  while (head < tail) {
    id = q[head++];
    var m = id % M, kk = Math.floor(id / M) % KS, bi = Math.floor(id / M / KS) % N, ai = Math.floor(id / M / KS / N);
    var pos = [ai, bi], who, fh, cur, d, c, r, nc, nr, ni, nk, nm, np, nid;
    if (m === full && ai === L.home[0].c + L.home[0].r * TWIN_COLS && bi === L.home[1].c + L.home[1].r * TWIN_COLS) { goal = id; break; }
    // Ojennus luukulla
    if ((kk === 1 || kk === 2) && L.hatch[0] && L.hatch[1] &&
        ai === L.hatch[0].c + L.hatch[0].r * TWIN_COLS && bi === L.hatch[1].c + L.hatch[1].r * TWIN_COLS) {
      nid = enc(ai, bi, 3 - kk, m);
      if (prev[nid] === -2) { prev[nid] = id; mv[nid] = -1; q[tail++] = nid; }
    }
    for (who = 0; who < 2; who++) {
      // Täyttö: kaikki ruudut, joihin pupu who pääsee (lukko vain päätepisteeksi)
      fk = ((who * N + pos[who]) * N + pos[1 - who]) * KS + kk;
      fill = fillCache[fk];
      if (!fill) {
      stamp++;
      fq[0] = pos[who];
      fn = 1;
      fh = 0;
      seen[pos[who]] = stamp;
      while (fh < fn) {
        cur = fq[fh++];
        c = cur % TWIN_COLS; r = Math.floor(cur / TWIN_COLS);
        if (cur !== pos[who] && ch(who, cur) === 'L' && kk !== 3) continue;
        for (d = 0; d < 4; d++) {
          nc = c + [0, 1, 0, -1][d]; nr = r + [-1, 0, 1, 0][d];
          if (nc < 0 || nr < 0 || nc >= TWIN_COLS || nr >= TWIN_ROWS) continue;
          ni = nc + nr * TWIN_COLS;
          if (seen[ni] === stamp || !canEnter(who, pos, kk, ni, ch(who, cur) === '=')) continue;
          seen[ni] = stamp;
          fq[fn++] = ni;
        }
      }
      fill = fillCache[fk] = fq.slice(1, fn);
      }
      for (k = 0; k < fill.length; k++) {
        ni = fill[k];
        nk = kk; nm = m;
        if (carrotAt[who][ni] !== undefined) nm |= 1 << carrotAt[who][ni];
        if (L.key && kk === 0 && L.key.s === who && ni === L.key.c + L.key.r * TWIN_COLS) nk = who + 1;
        if (ch(who, ni) === 'L' && kk === who + 1) nk = 3;
        np = who === 0 ? enc(ni, bi, nk, nm) : enc(ai, ni, nk, nm);
        if (prev[np] !== -2) continue;
        prev[np] = id;
        mv[np] = who * N + ni;
        q[tail++] = np;
      }
    }
  }
  if (goal < 0) return null;
  var path = [];
  while (prev[goal] >= 0) {
    if (mv[goal] < 0) path.unshift({ pass: true });
    else path.unshift({ who: Math.floor(mv[goal] / N), c: mv[goal] % N % TWIN_COLS, r: Math.floor(mv[goal] % N / TWIN_COLS) });
    goal = prev[goal];
  }
  return path;
}
function twinSolveState() {
  var K = twin.key, m = 0, i, k = 0;
  for (i = 0; i < twin.carrots.length; i++) if (twin.carrots[i].got) m |= 1 << i;
  if (K) k = K.used ? 3 : K.holder < 0 ? 0 : K.holder + 1;
  return { a: twin.b[0].c + twin.b[0].r * TWIN_COLS, b: twin.b[1].c + twin.b[1].r * TWIN_COLS, k: k, m: m };
}
function twinUpdateHint(dt) {
  var lim, P, i;
  if (twin.b[0].moving || twin.b[1].moving || (twin.key && twin.key.fly > 0)) return;
  twin.idle += dt;
  lim = twin.round === 0 && !twin.touched ? TWIN_HINT_FIRST : TWIN_HINT_IDLE;
  if (twin.hint || twin.idle < lim) return;
  P = twinSolve(twin.L, twinSolveState());
  if (!P || !P.length) return;
  for (i = 0; i < P.length && P[i].pass; i++);
  if (i >= P.length) return;
  twin.hint = P[i];
  twin.hint.t = 0;
  twin.hintUsed = true;
}

// ---------- Tökättävät koristeet ----------
function twinSetupProps() {
  var h = viewH, W = viewW, Lz = twinLayout(), by = Lz.oy + Lz.cs * TWIN_ROWS, gy = Math.min(h * 0.985, by + (h - by) * 0.78);
  propsReset();
  if (typeof trainAddMill === 'function') {
    trainAddMill(W * 0.06, h * 0.16, h * 0.05);
    trainAddScarecrow(W * 0.95, h * 0.16, h * 0.04);
    trainAddFenceSheep(W * 0.16, gy, h * 0.04);
    trainAddHay(W * 0.36, gy, h * 0.035);
    trainAddCat(W * 0.62, gy, h * 0.032, -1, 0);
    trainAddFlowers(W * 0.5, gy, h * 0.035);
    trainAddTractor(W * 0.86, gy, h * 0.06);
  }
  // Kukko aidan tolpan päällä keskellä: kiekuu, ja molemmat puput vilkuttavat
  propAdd({
    x: W * 0.5, y: Lz.oy - h * 0.01, r: h * 0.035, hy: h * 0.035, color: '#ff7a5a', note: 784, amp: 0.2, crowT: 0,
    update: function (p, dt) { if (p.crowT > 0) p.crowT -= dt; },
    draw: function (c, p) { postDrawRooster(c, h * 0.022, p.crowT > 0 ? Math.min(1, p.crowT * 2) : 0); },
    poke: function (p) {
      p.crowT = 1.0;
      postRoosterCrow(0);
      if (twin.b.length) { twin.b[0].waveT = 1.2; twin.b[1].waveT = 1.2; }
    }
  });
}

// ---------- Piirto ----------
function renderTwinBg(b, w, h) {
  var vw = viewW, g, x, i, Lz = twinLayout();
  g = b.createLinearGradient(0, 0, 0, h * 0.2);
  g.addColorStop(0, '#8fd4ff');
  g.addColorStop(1, '#e8f6ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.22, h * 0.055, h * 0.035, 1);
  for (i = 0; i < 4; i++) drawCloud(b, vw * (0.35 + i * 0.17), h * (0.04 + (i % 2) * 0.03), h * 0.016, 0.85);
  fillHillBand(b, w, h, h * 0.12, artMix('#a8d880', '#e8f6ff', 0.4), function (px) {
    return h * (0.11 - Math.sin(px / h * 1.3 + 0.6) * 0.02);
  });
  g = b.createLinearGradient(0, h * 0.13, 0, h);
  g.addColorStop(0, '#a6de7c');
  g.addColorStop(1, '#7cc458');
  b.fillStyle = g;
  b.beginPath(); b.moveTo(0, h * 0.14);
  for (x = 0; x <= w; x += h * 0.1) b.lineTo(x, h * (0.135 - Math.sin(x / h * 1.7) * 0.008));
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Pihat: kummankin oma värireunus
  for (i = 0; i < 2; i++) {
    b.fillStyle = artRGBA(TWIN_PCOL[i], 0.3);
    roundRect(b, Lz.ox[i] - Lz.cs * 0.14, Lz.oy - Lz.cs * 0.14, Lz.cs * (TWIN_COLS + 0.28), Lz.cs * (TWIN_ROWS + 0.28), Lz.cs * 0.25);
    b.fill();
  }
  for (i = 0; i < 9; i++) drawFlower(b, vw * (0.04 + i * 0.115), h * 0.995, h * 0.01, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}
function twinDrawBunny(c, x, y, s, hop, col, facing, wave) {
  artBlob(c, x, y + s * 0.02, s * 0.8, s * 0.26, col, { line: false, alpha: 0.6 });
  c.save();
  c.translate(x, 0);
  c.scale(facing, 1);
  drawBunny(c, 0, y, s, hop, globalT * 3, false);
  c.restore();
  artBlob(c, x, y - hop - s * 0.66, s * 0.4, s * 0.13, col, { lineColor: artShade(col, -0.4) });
  artBlob(c, x + facing * s * 0.24, y - hop - s * 0.5, s * 0.1, s * 0.2, col, { lineColor: artShade(col, -0.4) });
  if (wave > 0) {
    var a = Math.sin(globalT * 14) * 0.5;
    artLimb(c, x - facing * s * 0.3, y - hop - s * 0.45, x - facing * s * (0.55 + Math.cos(a) * 0.1), y - hop - s * (0.95 + Math.sin(a) * 0.15), s * 0.12, '#ffffff', '#c8b8c8');
  }
}
function twinDrawBale(c, x, y, s, k) {
  var i;
  if (k % 3 === 2) { drawBush(c, x, y + s * 0.85, s * 0.6); return; }
  artShadow(c, x, y + s * 0.75, s * 0.85, s * 0.18, 0.18);
  artRoundRect(c, x - s * 0.8, y - s * 0.55, s * 1.6, s * 1.25, s * 0.3, '#f2cf6a', { lineColor: '#a8803a', hi: 0.25 });
  c.strokeStyle = 'rgba(168,128,58,0.55)';
  c.lineWidth = Math.max(1, s * 0.06);
  for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.3 + i * s * 0.35); c.lineTo(x + s * 0.6, y - s * 0.3 + i * s * 0.35); c.stroke(); }
  c.strokeStyle = '#c84a3a';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath(); c.moveTo(x - s * 0.35, y - s * 0.55); c.lineTo(x - s * 0.35, y + s * 0.7); c.moveTo(x + s * 0.35, y - s * 0.55); c.lineTo(x + s * 0.35, y + s * 0.7); c.stroke();
}
function twinDrawPlate(c, x, y, s, col, pressed) {
  artBlob(c, x, y + s * 0.15, s * 0.62, s * 0.36, artShade(col, -0.25), { lineColor: artShade(col, -0.5) });
  artBlob(c, x, y + s * (pressed ? 0.15 : 0.05), s * 0.52, s * 0.28, col, { lineColor: artShade(col, -0.45), hi: 0.4 });
  if (!pressed) artGlow(c, x, y, s * 0.9, col, 0.25 + Math.sin(globalT * 4) * 0.1);
}
// Punainen kahdeksankulmio ja valkoinen kämmen (keskipiste x, y)
function twinDrawStopSign(c, x, y, r) {
  var i, a;
  c.beginPath();
  for (i = 0; i < 8; i++) { a = Math.PI / 8 + i * Math.PI / 4; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  c.closePath();
  c.fillStyle = TWIN_STOP; c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1.5, r * 0.16); c.stroke();
  artBlob(c, x, y + r * 0.1, r * 0.36, r * 0.42, '#ffffff', { line: false });
  for (i = 0; i < 4; i++) artBlob(c, x + (i - 1.5) * r * 0.24, y - r * 0.38, r * 0.1, r * 0.24, '#ffffff', { line: false });
}
function twinDrawStopPlate(c, x, y, s, pressed) {
  twinDrawPlate(c, x, y, s, TWIN_STOP, pressed);
  artLimb(c, x, y - s * 0.33, x, y, s * 0.06, '#c8c8d0', false);
  twinDrawStopSign(c, x, y - s * 0.75, s * 0.42);
}
function twinDrawGate(c, x, y, s, col, open) {
  var i, k = open ? 0.25 : 1;
  c.globalAlpha = open ? 0.45 : 1;
  for (i = -1; i <= 1; i++) artRoundRect(c, x + i * s * 0.35 - s * 0.09, y + s * 0.4 - s * 0.9 * k, s * 0.18, s * 0.9 * k, s * 0.06, '#c89060', { lineColor: '#6a4a28' });
  artRoundRect(c, x - s * 0.55, y + s * 0.4 - s * 0.62 * k, s * 1.1, s * 0.16, s * 0.05, col, { lineColor: artShade(col, -0.5) });
  c.globalAlpha = 1;
}
function twinDrawBurrow(c, x, y, s, col) {
  drawBcodeBurrow(c, x, y, s);
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2, s * 0.08);
  c.beginPath(); c.moveTo(x + s * 0.6, y + s * 0.2); c.lineTo(x + s * 0.6, y - s * 0.75); c.stroke();
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x + s * 0.6, y - s * 0.75); c.lineTo(x + s * 1.05 + Math.sin(globalT * 5) * s * 0.05, y - s * 0.6); c.lineTo(x + s * 0.6, y - s * 0.45); c.closePath(); c.fill();
}
// Punainen traktori ja heinäkärry sivulta (origo kärryn ja traktorin välissä)
function twinDrawTractor(c, x, y, s, dir, T) {
  var hop = T.stopped ? 0 : Math.abs(Math.sin(globalT * 12)) * s * 0.04, ang = T.stopped ? 0 : globalT * 6 * dir;
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artShadow(c, 0, s * 0.42, s * 1.9, s * 0.16, 0.2);
  // Kärry
  artRoundRect(c, -s * 1.85, -s * 0.15, s * 1.45, s * 0.32, s * 0.08, '#c89060', { lineColor: '#6a4a28' });
  artBlob(c, -s * 1.12, -s * 0.38, s * 0.62, s * 0.3, '#f2cf6a', { lineColor: '#a8803a', hi: 0.25 });
  artLimb(c, -s * 0.42, s * 0.08, s * 0.2, s * 0.12, s * 0.05, '#6a4a28', false);
  trainDrawWheel(c, -s * 1.12, s * 0.25, s * 0.18, ang, '#ffd24f');
  // Traktori
  c.translate(0, -hop);
  artRoundRect(c, s * 0.15, -s * 0.2, s * 1.15, s * 0.42, s * 0.12, '#e8443a', { lineColor: '#8a2018', hi: 0.2 });
  artRoundRect(c, s * 0.2, -s * 0.78, s * 0.55, s * 0.62, s * 0.08, '#e8443a', { lineColor: '#8a2018' });
  artRoundRect(c, s * 0.28, -s * 0.7, s * 0.38, s * 0.3, s * 0.05, '#cfeeff', { lineColor: '#8a2018' });
  artLimb(c, s * 1.0, -s * 0.2, s * 1.0, -s * 0.55, s * 0.07, '#5a5a5a', '#2a2a2a');
  // Valo katolla: punainen kun pysäytetty, muuten vilkkuva keltainen
  artCircle(c, s * 0.47, -s * 0.86, s * 0.1, T.stopped ? TWIN_STOP : (Math.sin(globalT * 8) > 0 ? '#ffd24f' : '#c8a040'), { lineColor: '#5a3a10' });
  if (T.stopped) artGlow(c, s * 0.47, -s * 0.86, s * 0.4, TWIN_STOP, 0.5);
  c.translate(0, hop);
  trainDrawWheel(c, s * 0.42, s * 0.12, s * 0.34, ang, '#ffd24f');
  trainDrawWheel(c, s * 1.12, s * 0.22, s * 0.2, ang, '#ffd24f');
  if (T.puffT > 0) {
    var k = 1 - T.puffT / 0.6;
    c.globalAlpha = Math.max(0, 1 - k);
    artCircle(c, s * 1.0 - k * s * 0.3, -s * 0.65 - k * s * 0.5, s * (0.1 + k * 0.15), '#e8e8f0', { line: false });
    c.globalAlpha = 1;
  }
  c.restore();
}
// Ajatuskupla: mitä pupu odottaa
function twinDrawBubble(c, x, y, s, W, side) {
  var bx = x + (side ? -s * 0.6 : s * 0.6), by = y - s * 1.55, r = s * 0.42, wob = Math.sin(globalT * 3) * s * 0.03;
  artCircle(c, x + (side ? -s * 0.2 : s * 0.2), y - s * 0.95, s * 0.07, '#ffffff', { lineColor: '#b8a8c8' });
  artCircle(c, x + (side ? -s * 0.38 : s * 0.38), y - s * 1.18, s * 0.11, '#ffffff', { lineColor: '#b8a8c8' });
  artCircle(c, bx, by + wob, r, '#ffffff', { lineColor: '#b8a8c8' });
  if (W.kind === 'gate') twinDrawPlate(c, bx, by + wob, r * 0.75, TWIN_GCOL[W.g], false);
  else if (W.kind === 'key') drawBcodeKey(c, bx - r * 0.15, by + wob, r * 0.55);
  else if (W.kind === 'tractor') twinDrawStopSign(c, bx, by + wob, r * 0.6);
}

function drawTwin() {
  var c = ctx, L = twin.L, Lz, s, i, k, p, q, ch, b, bp;
  if (!beginPlayWorld()) return;
  propsDraw(c, 0);
  if (L) {
    Lz = twinLayout();
    s = Lz.cs;
    // Nurmi- ja tieruudut
    for (k = 0; k < 2; k++) for (q = 0; q < TWIN_ROWS; q++) for (i = 0; i < TWIN_COLS; i++) {
      p = twinCell(k, i, q, Lz);
      ch = twinCh(k, i, q);
      if (ch === '=') {
        artRoundRect(c, p.x - s * 0.5, p.y - s * 0.44, s, s * 0.88, s * 0.06, '#d8b880', { lineColor: '#a8885a', line: Math.max(1, s * 0.02) });
        c.fillStyle = 'rgba(138,104,60,0.35)';
        c.fillRect(p.x - s * 0.5, p.y - s * 0.22, s, s * 0.05);
        c.fillRect(p.x - s * 0.5, p.y + s * 0.17, s, s * 0.05);
      } else {
        artRoundRect(c, p.x - s * 0.47, p.y - s * 0.47, s * 0.94, s * 0.94, s * 0.12,
          (i + q) % 2 ? (k ? '#a2dc86' : '#a8de7f') : (k ? '#90d077' : '#96d26f'), { lineColor: '#5a9a4a', line: Math.max(1, s * 0.02) });
      }
    }
    // Laatan ja portin yhteys katkoviivana (aidan yli)
    c.lineWidth = Math.max(2, s * 0.035);
    c.setLineDash([s * 0.1, s * 0.12]);
    for (i = 0; i < L.plates.length; i++) {
      for (k = 0; k < L.gates.length; k++) {
        if (L.gates[k].g !== L.plates[i].g) continue;
        p = twinCell(L.plates[i].s, L.plates[i].c, L.plates[i].r, Lz);
        q = twinCell(L.gates[k].s, L.gates[k].c, L.gates[k].r, Lz);
        c.strokeStyle = artRGBA(TWIN_GCOL[L.plates[i].g], twinPlateDown(L.plates[i].g) ? 0.85 : 0.4);
        c.lineDashOffset = -globalT * s * 0.4;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
      }
    }
    c.setLineDash([]);
    c.lineDashOffset = 0;
    twinDrawFence(c, Lz);
    // Lähtö, kolot, laatat
    for (i = 0; i < 2; i++) {
      p = twinCell(i, L.start[i].c, L.start[i].r, Lz);
      c.fillStyle = artRGBA(TWIN_PCOL[i], 0.35);
      c.beginPath(); c.arc(p.x, p.y + s * 0.28, s * 0.3, 0, Math.PI * 2); c.fill();
      p = twinCell(i, L.home[i].c, L.home[i].r, Lz);
      twinDrawBurrow(c, p.x, p.y, s * 0.4, TWIN_PCOL[i]);
    }
    for (i = 0; i < L.plates.length; i++) {
      q = L.plates[i];
      p = twinCell(q.s, q.c, q.r, Lz);
      twinDrawPlate(c, p.x, p.y, s * 0.42, TWIN_GCOL[q.g], twinOn(twin.b[q.s], q.c, q.r));
    }
    for (k = 0; k < 2; k++) for (i = 0; i < L.stops[k].length; i++) {
      q = L.stops[k][i];
      p = twinCell(k, q.c, q.r, Lz);
      twinDrawStopPlate(c, p.x, p.y + s * 0.12, s * 0.4, twinOn(twin.b[k], q.c, q.r));
    }
    for (i = 0; i < twin.carrots.length; i++) {
      var ca = twin.carrots[i];
      if (ca.got) continue;
      p = twinCell(ca.s, ca.c, ca.r, Lz);
      c.save(); c.translate(p.x, p.y); c.rotate(ca.wig > 0 ? Math.sin(globalT * 30) * 0.2 : Math.sin(globalT * 2 + i) * 0.05);
      drawCarrotGlyph(c, 0, -s * 0.1, s * 0.26);
      c.restore();
    }
    if (twin.key && twin.key.holder < 0 && !twin.key.used) {
      p = twinCell(twin.key.s, twin.key.c, twin.key.r, Lz);
      drawBcodeKey(c, p.x - s * 0.1, p.y + Math.sin(globalT * 3) * s * 0.04, s * 0.22);
    }
    // Rivi kerrallaan: paalit, portit, lukko, traktori ja pupu oikeassa järjestyksessä
    for (q = 0; q < TWIN_ROWS; q++) {
      for (k = 0; k < 2; k++) for (i = 0; i < TWIN_COLS; i++) {
        ch = twinCh(k, i, q);
        p = twinCell(k, i, q, Lz);
        if (ch === '#') twinDrawBale(c, p.x, p.y - s * 0.08, s * 0.4, i * 7 + q * 3 + k);
        else if ('YVGO'.indexOf(ch) >= 0) {
          var occ = twinOn(twin.b[k], i, q) || (twin.b[k].moving && twin.b[k].from && twinOn(twin.b[k].from, i, q));
          twinDrawGate(c, p.x, p.y, s * 0.45, TWIN_GCOL[ch.toLowerCase()], twinPlateDown(ch.toLowerCase()) || occ);
        } else if (ch === 'L') {
          c.save();
          if (twin.lockOpen) { c.translate(p.x, p.y); c.scale(1, Math.max(0.25, twin.lockAnim)); c.translate(-p.x, -p.y); }
          drawBcodeGate(c, p.x, p.y, s * 0.45, twin.lockOpen);
          c.restore();
        }
      }
      for (k = 0; k < 2; k++) {
        var T = twin.tractors[k];
        if (T && L.lanes[k].r === q) {
          p = twinCell(k, T.pos + (TWIN_TRACTOR_LEN - 1) / 2, q, Lz);
          twinDrawTractor(c, p.x, p.y + s * 0.1, s * 0.42, T.dir, T);
        }
      }
      for (k = 0; k < 2; k++) {
        b = twin.b[k];
        if (Math.round(b.fr) !== q) continue;
        bp = twinCell(k, b.fc, b.fr, Lz);
        var hop = Math.sin(b.hop * Math.PI) * s * (b.pokeT > 0 ? 0.35 : 0.18);
        if (b.home && !b.moving && twin.state === 'roundDone') hop = Math.abs(Math.sin(globalT * 6 + k)) * s * 0.15;
        twinDrawBunny(c, bp.x, bp.y + s * 0.36, s * 0.36, hop, TWIN_PCOL[k], b.facing, b.waveT);
        if (twin.key && !twin.key.used && twin.key.holder === k && !twin.key.fly) drawBcodeKey(c, bp.x - s * 0.08, bp.y - s * 0.5 - hop, s * 0.16);
      }
    }
    twinDrawFlyingKey(c, Lz);
    // Kohdemerkki ja ajatuskuplat
    for (k = 0; k < 2; k++) {
      b = twin.b[k];
      if (twin.state === 'play' && (b.tc !== b.c || b.tr !== b.r)) {
        p = twinCell(k, b.tc, b.tr, Lz);
        c.strokeStyle = artRGBA(TWIN_PCOL[k], 0.75);
        c.lineWidth = Math.max(2, s * 0.05);
        c.beginPath(); c.arc(p.x, p.y + s * 0.2, s * (0.2 + Math.sin(globalT * 6) * 0.03), 0, Math.PI * 2); c.stroke();
      }
      if (twin.state === 'play' && b.wait && b.wait.why && b.wait.t > 0.25) {
        bp = twinCell(k, b.fc, b.fr, Lz);
        twinDrawBubble(c, bp.x, bp.y + s * 0.34, s * 0.5, b.wait.why, k);
      }
    }
    twinDrawHint(c, Lz);
  }
  propsDraw(c, 1);
  drawParticlesLayer(c);
  endPlayWorld();
  drawTwinHud(c);
  drawTaskOverlay(c);
}
// Lauta-aita puolten välissä; luukku avautuu ojennuksen ajaksi
function twinDrawFence(c, Lz) {
  var x = (Lz.ox[0] + Lz.cs * TWIN_COLS + Lz.ox[1]) / 2, y0 = Lz.oy - Lz.cs * 0.25, y1 = Lz.oy + Lz.cs * (TWIN_ROWS + 0.1), s = Lz.cs, y, H = twin.L.hatch;
  artShadow(c, x + s * 0.06, y1, s * 0.25, s * 0.06, 0.2);
  for (y = y0; y < y1 - s * 0.1; y += s * 0.5) {
    artRoundRect(c, x - s * 0.13, y, s * 0.26, s * 0.46, s * 0.08, '#d8a868', { lineColor: '#7a5228' });
  }
  artRoundRect(c, x - s * 0.2, y0 + s * 0.4, s * 0.4, s * 0.1, s * 0.04, '#b8884a', { lineColor: '#6a4420' });
  artRoundRect(c, x - s * 0.2, y1 - s * 0.6, s * 0.4, s * 0.1, s * 0.04, '#b8884a', { lineColor: '#6a4420' });
  if (H[0]) {
    var p = twinCell(0, H[0].c, H[0].r, Lz), open = twin.key && twin.key.fly > 0;
    artRoundRect(c, x - s * 0.2, p.y - s * 0.24, s * 0.4, s * 0.48, s * 0.06, open ? '#5a3a20' : '#ffd24f', { lineColor: '#6a4420' });
    if (!open) {
      artRoundRect(c, x - s * 0.15, p.y - s * 0.19, s * 0.3, s * 0.38, s * 0.05, '#e8b040', { lineColor: '#8a6020' });
      artCircle(c, x + s * 0.08, p.y, s * 0.035, '#6a4420', { line: false });
      artGlow(c, x, p.y, s * 0.4, '#ffe27a', 0.2 + Math.sin(globalT * 4) * 0.1);
    }
  }
}
function twinDrawFlyingKey(c, Lz) {
  var K = twin.key, k, a, b, p, q, x, y;
  if (!K || K.fly <= 0) return;
  k = 1 - K.fly / 0.7;
  a = 1 - K.holder;
  b = K.holder;
  p = twinCell(a, twin.b[a].c, twin.b[a].r, Lz);
  q = twinCell(b, twin.b[b].c, twin.b[b].r, Lz);
  x = p.x + (q.x - p.x) * k;
  y = p.y + (q.y - p.y) * k - Math.sin(k * Math.PI) * Lz.cs * 0.9 - Lz.cs * 0.4;
  drawBcodeKey(c, x, y, Lz.cs * 0.18);
}
// Vihje: käsi napauttaa ruutua, johon pupun kannattaa seuraavaksi mennä
function twinDrawHint(c, Lz) {
  var H = twin.hint, p, k;
  if (!H || twin.state !== 'play') return;
  p = twinCell(H.who, H.c, H.r, Lz);
  k = (globalT % 1.2) / 1.2;
  c.strokeStyle = artRGBA(TWIN_PCOL[H.who], 0.9);
  c.lineWidth = Math.max(3, Lz.cs * 0.06);
  c.beginPath(); c.arc(p.x, p.y, Lz.cs * (0.3 + k * 0.15), 0, Math.PI * 2); c.stroke();
  drawHand(c, p.x + Lz.cs * 0.05, p.y - Lz.cs * 0.75 + Math.abs(Math.sin(k * Math.PI)) * Lz.cs * 0.25, Lz.cs * 0.28);
}
// HUD: kierrokset porkkanoina keskellä ylhäällä; kultainen = ilman vihjettä
function drawTwinHud(c) {
  var hs = viewH * 0.02, i, n = TWIN_ROUNDS.length, w = hs * 2.6 * n + hs * 1.2, x0 = viewW * 0.5 - w / 2, y = viewH * 0.045;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, x0, y - hs * 1.6, w, hs * 3.2, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < twin.round || twin.state === 'won' || (i === twin.round && twin.state === 'roundDone');
    var x = x0 + hs * 1.9 + i * hs * 2.6;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && twin.gold[i]) artGlow(c, x, y, hs * 1.6, '#ffd24f', 0.7);
    drawCarrotGlyph(c, x, y - hs * 0.2, hs * 0.9);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.twin = function (c, x, y, s) {
  artRoundRect(c, x - s * 0.03, y - s * 0.3, s * 0.06, s * 0.5, s * 0.02, '#d8a868', { lineColor: '#7a5228' });
  twinDrawBunny(c, x - s * 0.17, y + s * 0.18, s * 0.1, 0, TWIN_PCOL[0], 1, 0);
  twinDrawBunny(c, x + s * 0.17, y + s * 0.18, s * 0.1, 0, TWIN_PCOL[1], -1, 0);
  twinDrawPlate(c, x, y - s * 0.32, s * 0.08, TWIN_GCOL.y, false);
};
