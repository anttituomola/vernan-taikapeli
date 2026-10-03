'use strict';

// Lelutehdas (Kaukamaa, Kellopaja): tonttujen liukuhihna kuljettaa leluja
// vasemmalta oikealle. Seuraava lelu näkyy ensin luukun ikkunassa (ennakko),
// sitten se putoaa hihnalle. Hihnassa on vaihteita (kääntöläppä): napautus
// kääntää läpän heti ylös tai alas, ja läpän nuoli ja kirkkaampi hihna
// näyttävät, minne seuraava lelu menee. Laatikon kyltissä on kuva siitä, mitä
// laatikkoon kuuluu. Väärään laatikkoon mennyt lelu pomppaa ulos, tonttu
// hämmästyy ja sydän menee; sydämien loppuessa kierros alkaa alusta.
// Jokainen laatikko tarvitsee kierroksen verran leluja; kun kaikki laatikot
// ovat täynnä, kierros onnistuu. Neljä arvottua, kovenevaa kierrosta:
// värin mukaan (1 vaihde, 2 laatikkoa); muodon mukaan, hämäyksenä eri värit
// (2 vaihdetta, 3 laatikkoa); noppapalikat pistekuvan mukaan; noppapalikat
// numerokyltin mukaan nopeammalla hihnalla, ja kesken kierroksen tonttu
// vaihtaa kahden laatikon paikat (hihna pysähtyy, iso varoitus ennen vaihtoa).
// Ensimmäisellä kierroksella käsi näyttää napautuksen, ja ensimmäinen lelu
// odottaa vaihteen edessä, kunnes vaihdetta on napautettu.
// Kierros ilman sydänmenetystä antaa kultaisen lelun.
// Tehtävät toisen ja kolmannen kierroksen jälkeen: lukumäärä, varjo.
//
// Hihnan liikelogiikka (beltNewState, beltStep, beltFlip, beltRoute) on
// puhdasta laskentaa ilman canvasia, jotta sen voi ajaa nodessa
// reaktioviivebotin kanssa (mitoitus: Tulivuoren jätti on maksimi).

// topo: hihnaverkko (2 = yksi vaihde ja kaksi laatikkoa, 3 = kaksi vaihdetta ja
// kolme laatikkoa); kind: lajitteluperuste; sign: kyltin kuva (icon, dots =
// noppakuvio, num = numero); need: leluja laatikkoa kohti; speed: hihnan
// nopeus (yksikköä / s); gap: lelujen väli (s) = aika, jonka vaihde on vapaa
// edellisen lelun jälkeen; swapAt: tonttu vaihtaa laatikot näin monen oikean
// lelun jälkeen
var BELT_ROUNDS = [
  { topo: 2, kind: 'color', sign: 'icon', need: 3, speed: 0.9, gap: 3.2 },
  { topo: 3, kind: 'shape', sign: 'icon', need: 3, speed: 1.1, gap: 2.5 },
  { topo: 3, kind: 'dice', sign: 'dots', need: 3, speed: 1.1, gap: 2.4 },
  { topo: 3, kind: 'dice', sign: 'num', need: 4, speed: 1.35, gap: 1.9, swapAt: 6 }
];
// Hihnaverkot: segmentin pituus logiikkayksiköissä; sw = segmentti päättyy
// vaihteeseen, slot = laatikkopaikkaan. sws[i] = [ylös, alas] -segmentit.
// pts: segmenttien murtoviivat (osuus viewW, viewH), slots: hihnan pää laatikolla.
var BELT_TOPOS = {
  2: {
    segs: [{ len: 3.0, sw: 0 }, { len: 2.6, slot: 0 }, { len: 2.6, slot: 1 }],
    sws: [[1, 2]],
    pts: [
      [[0.12, 0.55], [0.40, 0.55]],
      [[0.40, 0.55], [0.48, 0.36], [0.80, 0.36]],
      [[0.40, 0.55], [0.48, 0.74], [0.80, 0.74]]
    ],
    slots: [[0.87, 0.36], [0.87, 0.74]]
  },
  3: {
    segs: [{ len: 3.0, sw: 0 }, { len: 2.8, slot: 0 }, { len: 1.6, sw: 1 }, { len: 1.6, slot: 1 }, { len: 1.6, slot: 2 }],
    sws: [[1, 2], [3, 4]],
    pts: [
      [[0.12, 0.5], [0.34, 0.5]],
      [[0.34, 0.5], [0.42, 0.3], [0.80, 0.3]],
      [[0.34, 0.5], [0.42, 0.66], [0.56, 0.66]],
      [[0.56, 0.66], [0.63, 0.52], [0.80, 0.52]],
      [[0.56, 0.66], [0.63, 0.82], [0.80, 0.82]]
    ],
    slots: [[0.87, 0.3], [0.87, 0.52], [0.87, 0.82]]
  }
};
var BELT_COLORS = { red: '#ff5a5a', blue: '#4f9cff', green: '#5fd06a', yellow: '#ffd24f', purple: '#b678ff' };
var BELT_PALETTE = ['#ff5a5a', '#4f9cff', '#5fd06a', '#ffd24f', '#b678ff'];
var BELT_FIRST = 2.4;       // ensimmäisen lelun ennakko luukussa (s)
var BELT_FALL = 0.35;       // putoaminen luukusta hihnalle (s)
var BELT_SWAP_WARN = 1.6;   // tontun varoitus ennen laatikoiden vaihtoa (s)
var BELT_SWAP_MOVE = 1.2;   // laatikoiden vaihto (s)
var BELT_HOP_T = 0.3;       // lelun hyppy hihnan päästä laatikkoon (s)

var belt = {
  round: 0, state: 'intro', t: 0, S: null, gen: 0, gold: [], taskDelay: -1,
  tapped: false, tutor: false, hintT: 0, flapA: [], fx: [], phase: 0, doorT: 0,
  tonttu: { blink: 0, hop: 0, wow: 0, blinkT: 2 }
};

// ---------- Logiikka (puhdas, ei piirtoa) ----------
function beltShuffle(a) {
  var i, j, t;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
// Vaihteiden asennot, joilla lelu päätyy laatikkopaikkaan slot: [{ sw, dir }]
function beltRoute(T, slot) {
  function walk(si, acc) {
    var g = T.segs[si], d, r;
    if (g.slot !== undefined) return g.slot === slot ? acc : null;
    for (d = 0; d < 2; d++) {
      r = walk(T.sws[g.sw][d], acc.concat([{ sw: g.sw, dir: d }]));
      if (r) return r;
    }
    return null;
  }
  return walk(0, []);
}
function beltLook(R, cat) {
  var col = BELT_PALETTE[Math.floor(Math.random() * BELT_PALETTE.length)];
  if (R.kind === 'color') return { shape: 'ball', color: BELT_COLORS[cat] };
  if (R.kind === 'shape') return { shape: cat, color: col };
  return { shape: 'dice', val: cat, color: col };
}
function beltNewState(R) {
  var T = BELT_TOPOS[R.topo], cats, i, S;
  if (R.kind === 'color') cats = ['red', 'blue'];
  else if (R.kind === 'shape') cats = ['ball', 'cube', 'star'];
  else cats = beltShuffle([1, 2, 3, 4, 5, 6]).slice(0, R.topo);
  cats = beltShuffle(cats.slice(0, R.topo));
  S = {
    R: R, T: T, boxes: [], slotBox: [], sws: [], pieces: [], hatch: null, spawnT: BELT_FIRST,
    nextId: 1, delivered: 0, flawless: true, swap: null, done: false, time: 0, lastCat: null, run: 0
  };
  for (i = 0; i < cats.length; i++) {
    S.boxes.push({ cat: cats[i], need: R.need, have: 0, shown: 0, jig: 0, shake: 0 });
    S.slotBox.push(i);
  }
  for (i = 0; i < T.sws.length; i++) S.sws.push(Math.random() < 0.5 ? 0 : 1);
  S.hatch = beltPickNext(S);
  return S;
}
// Laatikon tarve miinus matkalla olevat: arvotaan painotetusti. Sama lelu
// enintään kolmesti peräkkäin, jotta vaihdetta joutuu kääntämään.
function beltPickNext(S) {
  var w = [], tot = 0, i, k, n, b, r, other = 0;
  for (i = 0; i < S.boxes.length; i++) {
    b = S.boxes[i];
    n = b.need - b.have;
    for (k = 0; k < S.pieces.length; k++) if (S.pieces[k].cat === b.cat) n--;
    if (S.hatch && S.hatch.cat === b.cat) n--;
    w.push(Math.max(0, n));
    if (b.cat !== S.lastCat) other += Math.max(0, n);
  }
  for (i = 0; i < w.length; i++) {
    if (S.run >= 3 && S.boxes[i].cat === S.lastCat && other > 0) w[i] = 0;
    tot += w[i];
  }
  if (tot <= 0) return null;
  r = Math.random() * tot;
  for (i = 0; i < w.length; i++) {
    r -= w[i];
    if (r < 0 && w[i] > 0) break;
  }
  if (i >= w.length) i = w.length - 1;
  while (w[i] <= 0) i--;
  b = S.boxes[i];
  S.run = b.cat === S.lastCat ? S.run + 1 : 1;
  S.lastCat = b.cat;
  return { id: S.nextId++, cat: b.cat, look: beltLook(S.R, b.cat), seg: -1, s: 0, fall: 0, passed: {}, seen: S.time };
}
function beltBoxOf(S, cat) {
  var i;
  for (i = 0; i < S.boxes.length; i++) if (S.boxes[i].cat === cat) return i;
  return -1;
}
function beltFlip(S, sw) { S.sws[sw] = S.sws[sw] ? 0 : 1; }
function beltDropPiece(S) {
  var p = S.hatch;
  p.seg = 0; p.s = 0; p.fall = BELT_FALL;
  S.pieces.push(p);
  S.hatch = null;
  S.spawnT = S.R.gap;
  S.hatch = beltPickNext(S);
  return p;
}
// Askel: palauttaa tapahtumat { type: drop | pass | arrive | swapWarn | swapMove | swapDone | done }
function beltStep(S, dt) {
  var ev = [], i, p, g, ov, b, sw, R = S.R, k, a;
  if (S.done) return ev;
  S.time += dt;
  // Laatikoiden vaihto: hihna seisoo varoituksen ja vaihdon ajan
  if (S.swap && (S.swap.phase === 'warn' || S.swap.phase === 'move')) {
    S.swap.t += dt;
    if (S.swap.phase === 'warn' && S.swap.t >= BELT_SWAP_WARN) {
      S.swap.phase = 'move'; S.swap.t = 0;
      k = S.slotBox[S.swap.a]; S.slotBox[S.swap.a] = S.slotBox[S.swap.b]; S.slotBox[S.swap.b] = k;
      ev.push({ type: 'swapMove' });
    } else if (S.swap.phase === 'move' && S.swap.t >= BELT_SWAP_MOVE) {
      S.swap.phase = 'done';
      S.spawnT = Math.max(S.spawnT, R.gap);
      ev.push({ type: 'swapDone' });
    }
    return ev;
  }
  // Lelut hihnalla
  for (i = 0; i < S.pieces.length; i++) {
    p = S.pieces[i];
    if (p.fall > 0) { p.fall -= dt; continue; }
    p.s += R.speed * dt;
    g = S.T.segs[p.seg];
    while (p.s >= g.len) {
      ov = p.s - g.len;
      if (g.sw !== undefined) {
        sw = g.sw;
        p.passed[sw] = true;
        p.seg = S.T.sws[sw][S.sws[sw]];
        p.s = ov;
        ev.push({ type: 'pass', sw: sw, piece: p, dir: S.sws[sw] });
        g = S.T.segs[p.seg];
      } else {
        b = S.slotBox[g.slot];
        a = S.boxes[b].cat === p.cat;
        if (a) { S.boxes[b].have++; S.delivered++; }
        else S.flawless = false;
        ev.push({ type: 'arrive', piece: p, box: b, slot: g.slot, ok: a });
        S.pieces.splice(i, 1);
        i--;
        break;
      }
    }
  }
  // Tonttu vaihtaa laatikot, kun hihna on tyhjä
  if (R.swapAt && !S.swap && S.delivered >= R.swapAt) S.swap = { phase: 'wait', t: 0, a: 0, b: 1 };
  if (S.swap && S.swap.phase === 'wait' && S.pieces.length === 0) {
    k = beltShuffle(S.boxes.map(function (x, j) { return j; }));
    S.swap.phase = 'warn'; S.swap.t = 0; S.swap.a = Math.min(k[0], k[1]); S.swap.b = Math.max(k[0], k[1]);
    ev.push({ type: 'swapWarn', a: S.swap.a, b: S.swap.b });
    return ev;
  }
  // Luukku: seuraava lelu odottaa ikkunassa ja putoaa hihnalle
  if (!S.swap || S.swap.phase === 'done') {
    if (!S.hatch) {
      S.hatch = beltPickNext(S);
      if (S.hatch) S.spawnT = Math.max(S.spawnT, R.gap * 0.8);
    }
    if (S.hatch) {
      S.spawnT -= dt;
      if (S.spawnT <= 0) ev.push({ type: 'drop', piece: beltDropPiece(S) });
    }
  }
  // Valmis: kaikki laatikot täynnä
  a = true;
  for (i = 0; i < S.boxes.length; i++) if (S.boxes[i].have < S.boxes[i].need) a = false;
  if (a) { S.done = true; ev.push({ type: 'done' }); }
  return ev;
}

// ---------- Kierros ----------
function beltStartRound() {
  var R = BELT_ROUNDS[belt.round], S, i, rt;
  belt.gen++;
  S = beltNewState(R);
  belt.S = S;
  belt.fx = [];
  belt.state = 'play';
  belt.t = 0;
  belt.hintT = 0;
  // 1. kierros: ensimmäinen lelu vaatii aina napautuksen, ja se odottaa vaihteen edessä
  belt.tutor = belt.round === 0 && !belt.tapped;
  if (belt.round === 0 && S.hatch) {
    rt = beltRoute(S.T, S.slotBox.indexOf(beltBoxOf(S, S.hatch.cat)));
    S.sws[0] = rt[0].dir ? 0 : 1;
  }
  belt.flapA = [];
  for (i = 0; i < S.sws.length; i++) belt.flapA.push(beltFlapTarget(i));
  renderBackground();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}

// ---------- Alustus ----------
function initBelt() {
  var i;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'shadow')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  belt.round = 0;
  belt.state = 'intro';
  belt.t = 0;
  belt.S = null;
  belt.gold = [];
  belt.taskDelay = -1;
  belt.tapped = false;
  belt.tutor = false;
  belt.fx = [];
  belt.tonttu = { blink: 0, hop: 0, wow: 0, blinkT: 2 };
  beltSetupProps();
  renderBackground();
}
// Sydämet loppu: sama kierros alkaa alusta (uudet lelut ja laatikot)
function respawnBelt() { beltStartRound(); }
function resizeBelt() {
  camX = 0;
  beltSetupProps();
}

// ---------- Asettelu ----------
function beltTopo() {
  return belt.S ? belt.S.T : BELT_TOPOS[BELT_ROUNDS[belt.round].topo];
}
function beltLayout() {
  var T = beltTopo(), W = viewW, H = viewH, i, k, segs = [], poly, len, sws = [], slots = [];
  for (i = 0; i < T.pts.length; i++) {
    poly = [];
    len = 0;
    for (k = 0; k < T.pts[i].length; k++) {
      poly.push({ x: T.pts[i][k][0] * W, y: T.pts[i][k][1] * H, d: 0 });
      if (k > 0) len += Math.hypot(poly[k].x - poly[k - 1].x, poly[k].y - poly[k - 1].y);
      poly[k].d = len;
    }
    poly.len = len;
    segs.push(poly);
    if (T.segs[i].sw !== undefined) sws[T.segs[i].sw] = poly[poly.length - 1];
  }
  for (i = 0; i < T.slots.length; i++) slots.push({ x: T.slots[i][0] * W, y: T.slots[i][1] * H });
  return {
    segs: segs, sws: sws, slots: slots, W: W, H: H,
    bw: Math.min(W * 0.13, H * 0.2), bh: H * 0.17, pr: H * 0.042, sr: H * 0.05,
    hx: W * 0.12, hy: H * 0.2, hs: H * 0.09
  };
}
function beltPolyAt(poly, f) {
  var d = Math.max(0, Math.min(1, f)) * poly.len, k, a, b, q;
  for (k = 1; k < poly.length; k++) {
    if (d <= poly[k].d || k === poly.length - 1) {
      a = poly[k - 1]; b = poly[k];
      q = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
      return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q };
    }
  }
  return { x: poly[0].x, y: poly[0].y };
}
// Lelun paikka ruudulla (keskipiste)
function beltPiecePos(p, Lz) {
  var T = beltTopo(), pt = beltPolyAt(Lz.segs[p.seg], p.s / T.segs[p.seg].len), y = pt.y - Lz.pr * 0.95, k;
  if (p.fall > 0) {
    k = 1 - p.fall / BELT_FALL;
    y = Lz.hy + (y - Lz.hy) * k * k;
  }
  return { x: pt.x, y: y };
}
// Laatikon paikka (keskipiste); vaihdon aikana laatikot liukuvat kaarella
function beltBoxPos(b, Lz) {
  var S = belt.S, slot = S.slotBox.indexOf(b), p = Lz.slots[slot], q, k, sg;
  var pos = { x: p.x, y: p.y + Lz.bh * 0.3 };
  if (S.swap && S.swap.phase === 'move' && (slot === S.swap.a || slot === S.swap.b)) {
    q = Lz.slots[slot === S.swap.a ? S.swap.b : S.swap.a];
    k = easeInOutSine(S.swap.t / BELT_SWAP_MOVE);
    sg = slot === S.swap.a ? 1 : -1;
    pos.x = q.x + (p.x - q.x) * k + Math.sin(k * Math.PI) * Lz.bw * 0.55 * sg;
    pos.y = q.y + (p.y - q.y) * k + Lz.bh * 0.3;
  }
  return pos;
}
// Läpän kulma: kohti valitun haaran ensimmäistä mutkaa
function beltFlapTarget(sw) {
  var S = belt.S, Lz = beltLayout(), o = Lz.sws[sw], seg = Lz.segs[S.T.sws[sw][S.sws[sw]]];
  return Math.atan2(seg[1].y - o.y, seg[1].x - o.x);
}
function beltTonttuPos() { return { x: viewW * 0.22, y: viewH * 0.95, s: viewH * 0.1 }; }

// ---------- Tökättävät koristeet ----------
// Hyllyn lelurobotti (piippaa; joka viides tökkäys: marssii hyllyn päähän ja
// takaisin), vieterirasia (klovni ponnahtaa) ja nalle (vinkaisee ja hypähtää).
// Kaikki ovat hihnojen ja vaihteiden ulkopuolella; vaihde on napautuksessa etusijalla.
function beltSetupProps() {
  var W = viewW, h = viewH;
  propsReset();
  propAdd({
    x: W * 0.62, y: h * 0.17, r: h * 0.07, hy: h * 0.05, color: '#c0c8d8', note: 880, amp: 0.08, march: 0,
    update: function (p, dt) { if (p.march > 0) p.march = Math.max(0, p.march - dt); },
    draw: function (c, p) {
      var s = h * 0.035, k = p.march > 0 ? Math.sin((1 - p.march / 3) * Math.PI) : 0, step = p.march > 0 ? Math.sin(globalT * 14) : 0;
      c.translate(k * W * 0.14, -Math.abs(step) * s * 0.15);
      beltDrawRobot(c, 0, 0, s, step, p.march > 0 || p.t >= 0);
    },
    poke: function (p) {
      playNote(1047, 0.05, 0.08, 'square', 0.08);
      playNote(1319, 0.13, 0.08, 'square', 0.08);
      if (p.n % 5 === 0) {
        p.march = 3;
        var i;
        for (i = 0; i < 6; i++) playNote(i % 2 ? 523 : 659, 0.3 + i * 0.4, 0.12, 'square', 0.07);
      }
    }
  });
  propAdd({
    x: W * 0.4, y: h * 0.96, r: h * 0.07, hy: h * 0.05, color: '#ff7bac', note: 523, amp: 0.1, pop: 0,
    update: function (p, dt) { if (p.pop > 0) p.pop = Math.max(0, p.pop - dt); },
    draw: function (c, p) { beltDrawJack(c, h * 0.04, p.pop); },
    poke: function (p) {
      p.pop = 1.4;
      playNote(392, 0, 0.08, 'triangle', 0.2);
      playNote(784, 0.08, 0.2, 'triangle', 0.25);
    }
  });
  propAdd({
    x: W * 0.07, y: h * 0.96, r: h * 0.07, hy: h * 0.05, color: '#d9a060', note: 660, amp: 0.14, hopT: 0,
    update: function (p, dt) { if (p.hopT > 0) p.hopT = Math.max(0, p.hopT - dt); },
    draw: function (c, p) {
      c.translate(0, -Math.sin(Math.min(1, (0.5 - p.hopT) / 0.5) * Math.PI) * h * 0.03 * (p.hopT > 0 ? 1 : 0));
      beltDrawTeddy(c, h * 0.04, p.hopT > 0);
    },
    poke: function (p) {
      p.hopT = 0.5;
      playNote(990, 0, 0.1, 'sine', 0.2);
      playNote(1320, 0.06, 0.12, 'sine', 0.15);
    }
  });
}

// ---------- Napautus ----------
function handleBeltTap(px, py) {
  var S = belt.S, Lz, i, best = -1, bd, d, tp, bp, b;
  if (puzzleBusy() || celebrating) return;
  Lz = beltLayout();
  // Vaihde ensin: iso osuma-alue
  if (S && belt.state === 'play') {
    bd = Lz.H * 0.12;
    for (i = 0; i < Lz.sws.length; i++) {
      d = Math.hypot(px - Lz.sws[i].x, py - Lz.sws[i].y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) {
      beltFlip(S, best);
      belt.tapped = true;
      playNote(S.sws[best] ? 440 : 660, 0, 0.08, 'triangle', 0.3);
      playNote(S.sws[best] ? 330 : 880, 0.05, 0.08, 'triangle', 0.2);
      spawnSparkles(Lz.sws[best].x, Lz.sws[best].y, 4, '#ffe27a');
      return;
    }
  }
  // Tonttu
  tp = beltTonttuPos();
  if (Math.hypot(px - tp.x, py - (tp.y - tp.s * 0.9)) < tp.s * 0.9) {
    belt.tonttu.blink = 0.4;
    belt.tonttu.hop = 0.5;
    playNote(660, 0, 0.1, 'triangle', 0.25);
    playNote(880, 0.1, 0.12, 'triangle', 0.25);
    return;
  }
  // Laatikot: valmiit lelut hyppelevät ja soivat
  if (S) {
    for (i = 0; i < S.boxes.length; i++) {
      b = S.boxes[i];
      bp = beltBoxPos(i, Lz);
      if (Math.abs(px - bp.x) < Lz.bw * 0.55 && py > bp.y - Lz.bh * 0.75 && py < bp.y + Lz.bh * 0.55) {
        b.jig = 0.6;
        playNote(523 + i * 130, 0, 0.1, 'sine', 0.25);
        if (b.shown > 0) playNote(784 + i * 130, 0.08, 0.12, 'sine', 0.2);
        spawnSparkles(bp.x, bp.y - Lz.bh * 0.35, 5, '#ffe27a');
        return;
      }
    }
  }
  propsTap(px, py);
}

// ---------- Päivitys ----------
function updateBelt(dt) {
  var busy, S = belt.S, i, ev, e, gen, Lz, tt = belt.tonttu, hold, p;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  if (tt.blink > 0) tt.blink -= dt;
  if (tt.hop > 0) tt.hop -= dt;
  if (tt.wow > 0) tt.wow -= dt;
  tt.blinkT -= dt;
  if (tt.blinkT < -0.15) tt.blinkT = 2 + Math.random() * 3;
  if (belt.doorT > 0) belt.doorT -= dt;
  if (S) {
    for (i = 0; i < S.boxes.length; i++) {
      if (S.boxes[i].jig > 0) S.boxes[i].jig -= dt;
      if (S.boxes[i].shake > 0) S.boxes[i].shake -= dt;
    }
    // Läppä kääntyy nopeasti uuteen asentoon
    for (i = 0; i < S.sws.length; i++) {
      var ta = beltFlapTarget(i), da = ta - belt.flapA[i];
      belt.flapA[i] += da * Math.min(1, dt * 20);
    }
  }
  beltUpdateFx(dt);
  if (belt.taskDelay > 0 && !busy) {
    belt.taskDelay -= dt;
    if (belt.taskDelay <= 0) {
      if (belt.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (belt.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  belt.t += dt;
  if (belt.state === 'intro') { if (belt.t > 0.6) beltStartRound(); return; }
  if (belt.state === 'roundDone') {
    if (belt.t > 2.2 && belt.taskDelay <= 0) {
      belt.round++;
      if (belt.round >= BELT_ROUNDS.length) { belt.round = BELT_ROUNDS.length - 1; belt.state = 'won'; belt.t = 0; soundFanfare(); }
      else beltStartRound();
    }
    return;
  }
  if (belt.state === 'won') { if (belt.t > 1.4) startCelebration(); return; }
  if (!belt.tapped) belt.hintT += dt;
  // Opetus: ensimmäinen lelu odottaa vaihteen edessä, kunnes läppä osoittaa oikein
  hold = false;
  if (belt.tutor) {
    p = S.pieces[0];
    if (p && p.seg === 0 && p.s >= S.T.segs[0].len * 0.82) {
      var rt = beltRoute(S.T, S.slotBox.indexOf(beltBoxOf(S, p.cat)));
      if (S.sws[0] !== rt[0].dir) hold = true;
    }
    if (p && p.seg !== 0) belt.tutor = false;
  }
  if (hold) return;
  var moving = !(S.swap && (S.swap.phase === 'warn' || S.swap.phase === 'move'));
  if (moving) belt.phase += S.R.speed * dt;
  gen = belt.gen;
  ev = beltStep(S, dt);
  Lz = beltLayout();
  for (i = 0; i < ev.length && belt.gen === gen; i++) {
    e = ev[i];
    if (e.type === 'drop') {
      belt.doorT = 0.35;
      playNote(392, 0, 0.08, 'triangle', 0.2);
      playNote(523, 0.06, 0.1, 'triangle', 0.2);
    } else if (e.type === 'pass') {
      playNote(e.dir ? 494 : 587, 0, 0.05, 'triangle', 0.12);
    } else if (e.type === 'arrive') {
      beltArrive(e, Lz);
    } else if (e.type === 'swapWarn') {
      tt.wow = BELT_SWAP_WARN + BELT_SWAP_MOVE;
      artShakeStart(viewH * 0.006, 0.3);
      playNote(392, 0, 0.25, 'square', 0.12);
      playNote(523, 0.3, 0.25, 'square', 0.12);
      playNote(392, 0.6, 0.25, 'square', 0.12);
      playNote(523, 0.9, 0.35, 'square', 0.12);
    } else if (e.type === 'swapMove') {
      playNote(330, 0, 0.5, 'sine', 0.2);
      playNote(660, 0.4, 0.5, 'sine', 0.2);
    } else if (e.type === 'swapDone') {
      playNote(784, 0, 0.12, 'triangle', 0.25);
    } else if (e.type === 'done') {
      beltRoundDone();
    }
  }
}
// Lelu saapui hihnan päähän: hyppää laatikkoon; väärästä laatikosta pomppaa ulos
function beltArrive(e, Lz) {
  var poly = Lz.segs[0], end, S = belt.S, gen = belt.gen, k;
  for (k = 0; k < S.T.segs.length; k++) if (S.T.segs[k].slot === e.slot) poly = Lz.segs[k];
  end = poly[poly.length - 1];
  belt.fx.push({ look: e.piece.look, x0: end.x, y0: end.y - Lz.pr * 0.95, box: e.box, ok: e.ok, t: 0, side: Math.random() < 0.5 ? -1 : 1 });
  if (!e.ok) {
    belt.tonttu.wow = 1.4;
    artShakeStart(viewH * 0.006, 0.3);
    playNote(180, 0.25, 0.25, 'sawtooth', 0.15);
    loseHeart();
    // Sydämet loppuivat: respawnBelt aloitti kierroksen alusta (belt.gen kasvoi)
    if (belt.gen !== gen) belt.fx = [];
  }
}
function beltUpdateFx(dt) {
  var i, f, S = belt.S, b, Lz;
  for (i = belt.fx.length - 1; i >= 0; i--) {
    f = belt.fx[i];
    var before = f.t;
    f.t += dt;
    if (!S || f.box >= S.boxes.length) { belt.fx.splice(i, 1); continue; }
    b = S.boxes[f.box];
    if (before < BELT_HOP_T && f.t >= BELT_HOP_T) {
      Lz = beltLayout();
      var bp = beltBoxPos(f.box, Lz);
      if (f.ok) {
        b.shown = Math.min(b.need, b.shown + 1);
        b.jig = 0.4;
        spawnSparkles(bp.x, bp.y - Lz.bh * 0.35, 8, '#ffe27a');
        playNote(587 + b.shown * 110, 0, 0.12, 'triangle', 0.3);
        playNote(880 + b.shown * 110, 0.08, 0.14, 'triangle', 0.22);
        if (b.shown >= b.need) {
          artPop(bp.x, bp.y - Lz.bh * 0.2, Lz.bw * 0.6, '#ffe27a', 'ring');
          playNote(1319, 0.2, 0.25, 'sine', 0.25);
        }
      } else {
        b.shake = 0.5;
        playNote(220, 0, 0.15, 'triangle', 0.25);
      }
    }
    if (f.t > (f.ok ? BELT_HOP_T : 1.4)) belt.fx.splice(i, 1);
  }
}
function beltRoundDone() {
  var i, mel = [659, 784, 988, 1175, 1319], Lz = beltLayout(), S = belt.S, bp;
  belt.state = 'roundDone';
  belt.t = 0;
  belt.gold[belt.round] = S.flawless;
  for (i = 0; i < S.boxes.length; i++) {
    bp = beltBoxPos(i, Lz);
    spawnSparkles(bp.x, bp.y - Lz.bh * 0.3, 14, '#ffe27a');
  }
  belt.tonttu.hop = 0.8;
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.25, 'triangle', 0.3);
  if (S.flawless) {
    playNote(1760, 0.7, 0.3, 'sine', 0.3);
    spawnSparkles(hudX() + viewH * 0.05, viewH * 0.04, 12, '#ffd24f');
  }
  if (belt.round === 1 || belt.round === 2) belt.taskDelay = 1.6;
}

// ---------- Piirto: tausta ----------
function renderBeltBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#f2c89a');
  g.addColorStop(1, '#d99a70');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Tapetin raidat
  b.fillStyle = 'rgba(255,240,220,0.28)';
  for (i = 0; i < 16; i++) b.fillRect(vw * i / 16, 0, vw / 32, h * 0.88);
  // Pyöreä ikkuna
  artCircle(b, vw * 0.3, h * 0.14, h * 0.07, '#9fd4ff', { lineColor: '#6a3a1a', line: Math.max(3, h * 0.012) });
  b.strokeStyle = '#6a3a1a';
  b.lineWidth = Math.max(2, h * 0.008);
  b.beginPath(); b.moveTo(vw * 0.3 - h * 0.07, h * 0.14); b.lineTo(vw * 0.3 + h * 0.07, h * 0.14); b.moveTo(vw * 0.3, h * 0.07); b.lineTo(vw * 0.3, h * 0.21); b.stroke();
  // Hylly robotille
  artRoundRect(b, vw * 0.56, h * 0.17, vw * 0.24, h * 0.022, h * 0.006, '#a0683a', { lineColor: '#5a3a1a' });
  b.fillStyle = '#7a4a28';
  b.fillRect(vw * 0.58, h * 0.19, h * 0.012, h * 0.03);
  b.fillRect(vw * 0.78 - h * 0.012, h * 0.19, h * 0.012, h * 0.03);
  // Lattia
  artRoundRect(b, 0, h * 0.88, vw, h * 0.12, 0, '#a86a3a', { shadeTo: '#7a4a28', line: false });
  b.strokeStyle = 'rgba(60,30,10,0.25)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (x = 0; x < vw; x += vw / 10) { b.beginPath(); b.moveTo(x, h * 0.88); b.lineTo(x - vw * 0.03, h); b.stroke(); }
  // Seinän koriste-ilmapallot
  var cols = ['#ff7bac', '#5fa8ff', '#ffd24f'];
  for (i = 0; i < 3; i++) {
    x = vw * (0.92 + (i - 1) * 0.025);
    b.strokeStyle = 'rgba(90,50,20,0.5)';
    b.lineWidth = 1.5;
    b.beginPath(); b.moveTo(x, h * 0.1 + i * h * 0.01); b.lineTo(vw * 0.92, h * 0.19); b.stroke();
    artBlob(b, x, h * 0.08 + i * h * 0.01, h * 0.022, h * 0.028, cols[i], { hi: 0.4 });
  }
}

// ---------- Piirto: lelut ----------
function beltStarPath(c, x, y, r) {
  var i, a, rr;
  c.beginPath();
  for (i = 0; i < 10; i++) {
    rr = i % 2 === 0 ? r : r * 0.5;
    a = i / 10 * Math.PI * 2 - Math.PI / 2;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
// Noppakuvio: pisteet arvolle v (1–6) neliöön, jonka puolikas on s
function beltDrawDots(c, x, y, s, v, color) {
  var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [], i;
  c.fillStyle = color || '#333';
  for (i = 0; i < P.length; i++) {
    c.beginPath(); c.arc(x + P[i][0] * s * 0.52, y + P[i][1] * s * 0.52, s * 0.17, 0, Math.PI * 2); c.fill();
  }
}
// Lelu: pallo, kuutio, tähti tai noppapalikka (r = säde)
function beltDrawToy(c, x, y, r, look) {
  var col = look.color;
  if (look.shape === 'ball') {
    artCircle(c, x, y, r, col, { hi: 0.4 });
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = Math.max(1.5, r * 0.18);
    c.beginPath(); c.arc(x, y, r * 0.62, -0.4, 1.4); c.stroke();
  } else if (look.shape === 'cube') {
    artRoundRect(c, x - r * 0.88, y - r * 0.88, r * 1.76, r * 1.76, r * 0.25, col, { hi: 0.3 });
    artRoundRect(c, x - r * 0.45, y - r * 0.45, r * 0.9, r * 0.9, r * 0.15, artShade(col, 0.35), { line: false });
  } else if (look.shape === 'star') {
    beltStarPath(c, x, y + r * 0.08, r * 1.12);
    artFillPath(c, col, y - r, y + r, r);
    artHighlight(c, x - r * 0.2, y - r * 0.2, r * 0.18, r * 0.1, 0.5);
  } else {
    artRoundRect(c, x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.3, artMix(col, '#ffffff', 0.55), { lineColor: artShade(col, -0.45) });
    beltDrawDots(c, x, y, r * 0.9, look.val, '#3a2a40');
  }
}
// Kyltin kuva: värin ja muodon kierroksilla lelu (muoto harmaana), nopilla
// noppakuvio tai numero
function beltDrawSign(c, x, y, s, box, R) {
  artRoundRect(c, x - s, y - s, s * 2, s * 2, s * 0.3, '#fffaf0', { lineColor: '#8a6a40', line: Math.max(1.5, s * 0.08) });
  if (R.kind === 'color') beltDrawToy(c, x, y, s * 0.68, { shape: 'ball', color: BELT_COLORS[box.cat] });
  else if (R.kind === 'shape') beltDrawToy(c, x, y, s * 0.68, { shape: box.cat, color: '#b8b0c8' });
  else if (R.sign === 'dots') {
    artRoundRect(c, x - s * 0.72, y - s * 0.72, s * 1.44, s * 1.44, s * 0.22, '#ffffff', { lineColor: '#6a5a7a' });
    beltDrawDots(c, x, y, s * 0.72, box.cat, '#3a2a40');
  } else {
    c.fillStyle = '#3a2a40';
    c.font = 'bold ' + Math.round(s * 1.6) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(box.cat), x, y + s * 0.08);
  }
}
// Laatikko: takareuna ja valmiit lelut (piirretään ennen hyppiviä leluja)
function beltDrawBoxBack(c, x, y, Lz, box, R) {
  var w = Lz.bw, h = Lz.bh, i, n = box.shown, jg = box.jig > 0 ? Math.sin(box.jig * 30) * h * 0.03 : 0;
  artShadow(c, x, y + h * 0.52, w * 0.6, h * 0.08, 0.2);
  artRoundRect(c, x - w * 0.5, y - h * 0.42, w, h * 0.3, h * 0.05, '#6a3a1a', { line: false });
  for (i = 0; i < n; i++) {
    var tx = x + (i - (box.need - 1) / 2) * w * 0.22, ty = y - h * 0.3 + (i % 2) * h * 0.04 - (box.jig > 0 ? Math.abs(Math.sin(box.jig * 20 + i)) * h * 0.08 : 0);
    beltDrawToy(c, tx, ty + jg, Lz.pr * 0.75, beltShownLook(box, R, i));
  }
}
// Laatikossa näkyvien lelujen ilme (sama joka ruudulla)
function beltShownLook(box, R, i) {
  if (R.kind === 'color') return { shape: 'ball', color: BELT_COLORS[box.cat] };
  if (R.kind === 'shape') return { shape: box.cat, color: BELT_PALETTE[i % BELT_PALETTE.length] };
  return { shape: 'dice', val: box.cat, color: BELT_PALETTE[(i + 1) % BELT_PALETTE.length] };
}
// Etuseinä, kyltti ja edistymispisteet
function beltDrawBoxFront(c, x, y, Lz, box, R, flash) {
  var w = Lz.bw, h = Lz.bh, i, sh = box.shake > 0 ? Math.sin(box.shake * 50) * w * 0.04 : 0, full = box.shown >= box.need;
  x += sh;
  if (full) artGlow(c, x, y, w * 0.9, '#ffe27a', 0.35 + Math.sin(globalT * 4) * 0.1);
  if (flash) artGlow(c, x, y, w * 1.0, '#ff7a5a', 0.5 + Math.sin(globalT * 12) * 0.3);
  artRoundRect(c, x - w * 0.5, y - h * 0.25, w, h * 0.75, h * 0.08, box.shake > 0 ? '#e0805a' : '#c9884a', { shadeTo: '#9a5a2a', lineColor: '#5a3010', hi: 0.15 });
  c.strokeStyle = 'rgba(90,48,16,0.35)';
  c.lineWidth = Math.max(1, h * 0.015);
  c.beginPath(); c.moveTo(x - w * 0.5, y + h * 0.12); c.lineTo(x + w * 0.5, y + h * 0.12); c.stroke();
  beltDrawSign(c, x, y + h * 0.07, h * 0.2, box, R);
  // Edistyminen: pisteet laatikon alareunassa
  for (i = 0; i < box.need; i++) {
    var dx = x + (i - (box.need - 1) / 2) * h * 0.11;
    artCircle(c, dx, y + h * 0.4, h * 0.035, i < box.shown ? '#ffd24f' : '#7a4a20', { lineColor: '#4a2810', line: Math.max(1, h * 0.008), flat: true });
  }
  if (full) drawStar(c, x + w * 0.42, y - h * 0.25, h * 0.08, globalT, 0.4);
}
// Vaihde: napa, läppä nuolena ja hehku ensimmäisellä kierroksella
function beltDrawSwitch(c, x, y, r, ang, glow) {
  if (glow) artGlow(c, x, y, r * 2.4, '#ffe27a', 0.35 + Math.sin(globalT * 6) * 0.2);
  var L = r * 1.9, cs = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = cs;
  artCircle(c, x, y, r * 1.15, '#c0c8d8', { lineColor: '#4a5060', hi: 0.3 });
  // Läppä: leveä nuoli
  c.beginPath();
  c.moveTo(x + nx * r * 0.42, y + ny * r * 0.42);
  c.lineTo(x + cs * L * 0.62 + nx * r * 0.36, y + sn * L * 0.62 + ny * r * 0.36);
  c.lineTo(x + cs * L * 0.62 + nx * r * 0.7, y + sn * L * 0.62 + ny * r * 0.7);
  c.lineTo(x + cs * L, y + sn * L);
  c.lineTo(x + cs * L * 0.62 - nx * r * 0.7, y + sn * L * 0.62 - ny * r * 0.7);
  c.lineTo(x + cs * L * 0.62 - nx * r * 0.36, y + sn * L * 0.62 - ny * r * 0.36);
  c.lineTo(x - nx * r * 0.42, y - ny * r * 0.42);
  c.closePath();
  artFillPath(c, '#ffd24f', y - L, y + L, r, { lineColor: '#8a5a10', flat: true, line: Math.max(2, r * 0.12) });
  artCircle(c, x, y, r * 0.45, '#ff7a5a', { lineColor: '#7a2a1a', hi: 0.4 });
}
function beltDrawRobot(c, x, y, s, step, lit) {
  artLimb(c, x - s * 0.3, y - s * 0.9, x - s * 0.3 + step * s * 0.2, y, s * 0.22, '#8a92a8', '#4a5060');
  artLimb(c, x + s * 0.3, y - s * 0.9, x + s * 0.3 - step * s * 0.2, y, s * 0.22, '#8a92a8', '#4a5060');
  artRoundRect(c, x - s * 0.65, y - s * 1.9, s * 1.3, s * 1.1, s * 0.2, '#c0c8d8', { lineColor: '#4a5060', hi: 0.3 });
  artCircle(c, x, y - s * 1.35, s * 0.2, lit ? '#ff5a5a' : '#a05050', { lineColor: '#4a2020' });
  artRoundRect(c, x - s * 0.5, y - s * 2.75, s * 1.0, s * 0.8, s * 0.2, '#d8e0ec', { lineColor: '#4a5060', hi: 0.3 });
  artEye(c, x - s * 0.2, y - s * 2.35, s * 0.12, 0, false);
  artEye(c, x + s * 0.2, y - s * 2.35, s * 0.12, 0, false);
  c.strokeStyle = '#4a5060';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath(); c.moveTo(x, y - s * 2.75); c.lineTo(x, y - s * 3.1); c.stroke();
  artCircle(c, x, y - s * 3.15, s * 0.12, lit ? '#ffe27a' : '#c9a050', { lineColor: '#6a5020' });
}
// Vieterirasia: klovni ponnahtaa jousella (pop: aikaa jäljellä 1,4 s:sta)
function beltDrawJack(c, s, pop) {
  var k = pop > 0 ? Math.min(1, (1.4 - pop) * 6, pop * 3) : 0, sy = -s * 1.6 - k * s * 1.4, i;
  artShadow(c, 0, 0, s * 1.3, s * 0.2, 0.18);
  if (k > 0) {
    c.strokeStyle = '#8a92a8';
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.beginPath();
    for (i = 0; i <= 8; i++) c.lineTo((i % 2 ? 1 : -1) * s * 0.25, -s * 1.6 + (sy + s * 1.6) * i / 8);
    c.stroke();
    artCircle(c, 0, sy - s * 0.3, s * 0.55, '#ffe8d0', { lineColor: '#a07a5a' });
    artCircle(c, 0, sy - s * 0.2, s * 0.14, '#ff5a5a', { line: false });
    artEye(c, -s * 0.2, sy - s * 0.42, s * 0.09, 0, false);
    artEye(c, s * 0.2, sy - s * 0.42, s * 0.09, 0, false);
    c.beginPath(); c.moveTo(-s * 0.45, sy - s * 0.6); c.lineTo(0, sy - s * 1.3); c.lineTo(s * 0.45, sy - s * 0.6); c.closePath();
    artFillPath(c, '#5fa8ff', sy - s * 1.3, sy - s * 0.6, s * 0.4);
  }
  artRoundRect(c, -s, -s * 1.6, s * 2, s * 1.6, s * 0.2, '#ff7bac', { lineColor: '#8a2a50', hi: 0.2 });
  beltStarPath(c, 0, -s * 0.8, s * 0.45);
  artFillPath(c, '#ffd24f', -s * 1.2, -s * 0.4, s * 0.4, { line: false });
  if (k <= 0) artRoundRect(c, -s * 1.08, -s * 1.75, s * 2.16, s * 0.25, s * 0.08, '#e0609a', { lineColor: '#8a2a50' });
  // Veivi kyljessä
  artLimb(c, s, -s * 0.8, s * 1.35, -s * 0.8, s * 0.12, '#c0c8d8', '#4a5060');
}
function beltDrawTeddy(c, s, squeak) {
  artShadow(c, 0, 0, s * 1.1, s * 0.2, 0.18);
  artBlob(c, 0, -s * 0.8, s * 0.8, s * 0.85, '#c98a50', { lineColor: '#6a3a18', hi: 0.2 });
  artBlob(c, 0, -s * 0.7, s * 0.45, s * 0.5, '#f0c890', { line: false });
  artCircle(c, -s * 0.6, -s * 2.15, s * 0.28, '#c98a50', { lineColor: '#6a3a18' });
  artCircle(c, s * 0.6, -s * 2.15, s * 0.28, '#c98a50', { lineColor: '#6a3a18' });
  artCircle(c, 0, -s * 1.8, s * 0.65, '#c98a50', { lineColor: '#6a3a18', hi: 0.25 });
  artBlob(c, 0, -s * 1.62, s * 0.3, s * 0.22, '#f0c890', { line: false });
  artCircle(c, 0, -s * 1.7, s * 0.09, '#3a2010', { line: false });
  artEye(c, -s * 0.25, -s * 1.95, s * 0.09, 0, squeak);
  artEye(c, s * 0.25, -s * 1.95, s * 0.09, 0, squeak);
  if (squeak) artCircle(c, 0, -s * 1.5, s * 0.1, '#a03040', { line: false });
}
// Tonttu työtakissa; wow = hämmästys (kädet ylös, suu auki, huutomerkki)
function beltDrawTonttu(c, x, y, s) {
  var tt = belt.tonttu, wow = tt.wow > 0, hop = tt.hop > 0 ? Math.sin((1 - tt.hop / 0.5) * Math.PI) * s * 0.25 : 0;
  var by = y - hop, sh = wow ? Math.sin(globalT * 30) * s * 0.03 : 0, blink = tt.blink > 0 || tt.blinkT < 0;
  artShadow(c, x, y, s * 0.5, s * 0.1, 0.2);
  artLimb(c, x - s * 0.15, by - s * 0.35, x - s * 0.2, by - s * 0.02, s * 0.14, '#5a3a8a', '#2a1a4a');
  artLimb(c, x + s * 0.15, by - s * 0.35, x + s * 0.2, by - s * 0.02, s * 0.14, '#5a3a8a', '#2a1a4a');
  artBlob(c, x + sh, by - s * 0.6, s * 0.4, s * 0.38, '#e0403a', { lineColor: '#8a1a1a', hi: 0.2 });
  if (wow) {
    artLimb(c, x - s * 0.3, by - s * 0.75, x - s * 0.55, by - s * 1.35, s * 0.12, '#e0403a', '#8a1a1a');
    artLimb(c, x + s * 0.3, by - s * 0.75, x + s * 0.55, by - s * 1.35, s * 0.12, '#e0403a', '#8a1a1a');
    artCircle(c, x - s * 0.55, by - s * 1.38, s * 0.1, '#ffd9b8', { lineColor: '#c99a7a' });
    artCircle(c, x + s * 0.55, by - s * 1.38, s * 0.1, '#ffd9b8', { lineColor: '#c99a7a' });
  } else {
    artLimb(c, x - s * 0.3, by - s * 0.75, x - s * 0.42, by - s * 0.4, s * 0.12, '#e0403a', '#8a1a1a');
    artLimb(c, x + s * 0.3, by - s * 0.75, x + s * 0.42, by - s * 0.4, s * 0.12, '#e0403a', '#8a1a1a');
  }
  artCircle(c, x + sh, by - s * 1.2, s * 0.3, '#ffd9b8', { lineColor: '#c99a7a' });
  artBlob(c, x + sh, by - s * 0.98, s * 0.28, s * 0.2, '#ffffff', { lineColor: '#c9c0d8' });
  artEye(c, x - s * 0.1 + sh, by - s * 1.25, s * (wow ? 0.07 : 0.05), 0, blink && !wow);
  artEye(c, x + s * 0.1 + sh, by - s * 1.25, s * (wow ? 0.07 : 0.05), 0, blink && !wow);
  if (wow) artBlob(c, x + sh, by - s * 1.04, s * 0.06, s * 0.08, '#8a2a2a', { line: false });
  c.beginPath();
  c.moveTo(x - s * 0.32 + sh, by - s * 1.33); c.lineTo(x + s * 0.3 + sh, by - s * 1.33); c.lineTo(x + s * 0.22 + sh, by - s * 1.95);
  c.closePath();
  artFillPath(c, '#e0403a', by - s * 1.95, by - s * 1.33, s * 0.3, { lineColor: '#8a1a1a' });
  artCircle(c, x + s * 0.22 + sh, by - s * 1.95, s * 0.08, '#ffffff', { line: false });
  if (wow) {
    // Huutomerkki puhekuplassa
    artCircle(c, x + s * 0.75, by - s * 2.1, s * 0.32, '#ffffff', { lineColor: '#8a1a1a' });
    c.fillStyle = '#e0403a';
    c.font = 'bold ' + Math.round(s * 0.5) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', x + s * 0.75, by - s * 2.08);
  }
}
// Luukku: kone, jonka ikkunassa seuraava lelu odottaa; rengas täyttyy pudotukseen asti
function beltDrawHatch(c, Lz) {
  var S = belt.S, x = Lz.hx, y = Lz.hy, s = Lz.hs, k, open = belt.doorT > 0;
  artRoundRect(c, x - s * 0.95, y - s * 1.05, s * 1.9, s * 2.0, s * 0.25, '#7ac0a0', { shadeTo: '#4a8a70', lineColor: '#2a4a3a', hi: 0.2 });
  artRoundRect(c, x - s * 0.5, y - s * 1.35, s * 1.0, s * 0.35, s * 0.1, '#5a9a80', { lineColor: '#2a4a3a' });
  artCircle(c, x, y - s * 0.1, s * 0.62, '#fff6e0', { lineColor: '#2a4a3a' });
  if (S && S.hatch && belt.state === 'play') {
    k = S.spawnT > 0 ? Math.max(0, 1 - S.spawnT / S.R.gap) : 1;
    c.strokeStyle = k > 0.8 ? '#ff7a5a' : '#ffd24f';
    c.lineWidth = Math.max(3, s * 0.1);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - s * 0.1, s * 0.72, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke();
    beltDrawToy(c, x, y - s * 0.1, Lz.pr, S.hatch.look);
  }
  // Pudotusluukku alareunassa
  artRoundRect(c, x - s * 0.5, y + s * 0.78, s * (open ? 0.2 : 1.0), s * 0.18, s * 0.06, '#3a5a4a', { line: false });
}
function beltDrawBelts(c, Lz) {
  var S = belt.S, i, k, poly, chosen = {}, sw, w = Lz.pr * 0.55;
  for (sw = 0; sw < S.sws.length; sw++) chosen[S.T.sws[sw][S.sws[sw]]] = 1;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (i = 0; i < Lz.segs.length; i++) {
    poly = Lz.segs[i];
    var lit = i === 0 || chosen[i];
    c.beginPath();
    c.moveTo(poly[0].x, poly[0].y);
    for (k = 1; k < poly.length; k++) c.lineTo(poly[k].x, poly[k].y);
    c.strokeStyle = '#3a2a2a';
    c.lineWidth = w * 1.5;
    c.stroke();
    c.strokeStyle = lit ? '#6a6a7a' : '#4a4a55';
    c.lineWidth = w;
    c.stroke();
    // Liikkuvat poikkiraidat
    c.strokeStyle = lit ? 'rgba(255,240,180,0.7)' : 'rgba(200,200,210,0.25)';
    c.lineWidth = w * 0.7;
    c.setLineDash([w * 0.25, w * 0.9]);
    c.lineDashOffset = -belt.phase * Lz.H * 0.12;
    c.stroke();
    c.setLineDash([]);
  }
  // Rullat hihnan päissä
  for (i = 0; i < Lz.segs.length; i++) {
    poly = Lz.segs[i];
    if (S.T.segs[i].slot !== undefined) artCircle(c, poly[poly.length - 1].x, poly[poly.length - 1].y, w * 0.6, '#8a92a8', { lineColor: '#3a3a4a' });
  }
  artCircle(c, Lz.segs[0][0].x, Lz.segs[0][0].y, w * 0.6, '#8a92a8', { lineColor: '#3a3a4a' });
}

function drawBelt() {
  var c = ctx, S = belt.S, Lz, i, p, pos, f, bp, b, tp;
  if (!beginPlayWorld()) return;
  propsDraw(c);
  Lz = beltLayout();
  tp = beltTonttuPos();
  beltDrawTonttu(c, tp.x, tp.y, tp.s);
  beltDrawHatch(c, Lz);
  if (S) {
    beltDrawBelts(c, Lz);
    for (i = 0; i < S.boxes.length; i++) {
      bp = beltBoxPos(i, Lz);
      beltDrawBoxBack(c, bp.x, bp.y, Lz, S.boxes[i], S.R);
    }
    // Lelut hihnalla
    for (i = 0; i < S.pieces.length; i++) {
      p = S.pieces[i];
      pos = beltPiecePos(p, Lz);
      if (p.fall <= 0) artShadow(c, pos.x, pos.y + Lz.pr * 0.9, Lz.pr * 0.8, Lz.pr * 0.2, 0.18);
      beltDrawToy(c, pos.x, pos.y, Lz.pr, p.look);
    }
    // Hyppy laatikkoon ja väärän lelun pomppu ulos
    for (i = 0; i < belt.fx.length; i++) {
      f = belt.fx[i];
      bp = beltBoxPos(f.box, Lz);
      var tx = bp.x, ty = bp.y - Lz.bh * 0.32, x, y, k, a = 1;
      if (f.t < BELT_HOP_T) {
        k = f.t / BELT_HOP_T;
        x = f.x0 + (tx - f.x0) * k;
        y = f.y0 + (ty - f.y0) * k - Math.sin(k * Math.PI) * Lz.H * 0.06;
      } else {
        k = (f.t - BELT_HOP_T) / (1.4 - BELT_HOP_T);
        x = tx + f.side * k * Lz.bw * 1.2;
        y = ty - Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) * Lz.H * 0.16 + k * k * Lz.H * 0.3;
        a = Math.max(0, 1 - k * 1.2);
      }
      c.globalAlpha = a;
      beltDrawToy(c, x, y, Lz.pr, f.look);
      c.globalAlpha = 1;
    }
    for (i = 0; i < S.boxes.length; i++) {
      b = S.boxes[i];
      bp = beltBoxPos(i, Lz);
      var flash = S.swap && S.swap.phase === 'warn' && (S.slotBox[S.swap.a] === i || S.slotBox[S.swap.b] === i);
      beltDrawBoxFront(c, bp.x, bp.y, Lz, b, S.R, flash);
    }
    // Vaihteet
    for (i = 0; i < S.sws.length; i++) {
      beltDrawSwitch(c, Lz.sws[i].x, Lz.sws[i].y, Lz.sr, belt.flapA[i], belt.round === 0 && !belt.tapped);
    }
    // Vihje 1. kierroksella: käsi napauttaa vaihdetta
    if (belt.round === 0 && !belt.tapped && belt.state === 'play' && (belt.hintT > 1.2 || belt.tutor)) {
      var kk = (globalT % 1.2) / 1.2;
      drawHand(c, Lz.sws[0].x + Lz.sr * 0.3, Lz.sws[0].y + Lz.sr * 0.5 + Math.abs(Math.sin(kk * Math.PI)) * Lz.sr * 0.5, Lz.sr * 0.9);
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawBeltHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}
// HUD: kierrokset leluina; kultainen = kierros ilman sydänmenetystä
function drawBeltHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = BELT_ROUNDS.length, shapes = ['ball', 'cube', 'dice', 'dice'];
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.8 * n + hs * 1.2, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < belt.round || belt.state === 'won' || (i === belt.round && belt.state === 'roundDone');
    var x = left + hs * 2 + i * hs * 2.8, y = pad * 0.5 + hs * 1.7, gold = done && belt.gold[i];
    c.globalAlpha = done ? 1 : 0.3;
    if (gold) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.7);
    beltDrawToy(c, x, y, hs * 0.85, { shape: shapes[i], color: gold ? '#ffd24f' : '#c9a070', val: i + 2 });
    c.globalAlpha = 1;
  }
}

HUB_ICONS.belt = function (c, x, y, s) {
  c.strokeStyle = '#3a2a2a';
  c.lineWidth = Math.max(2, s * 0.07);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - s * 0.28, y + s * 0.1); c.lineTo(x + s * 0.12, y + s * 0.1); c.stroke();
  beltDrawToy(c, x - s * 0.12 + ((globalT * 0.3) % 1) * s * 0.18, y + s * 0.02, s * 0.06, { shape: 'ball', color: '#ff5a5a' });
  artRoundRect(c, x + s * 0.12, y - s * 0.04, s * 0.2, s * 0.18, s * 0.03, '#c9884a', { lineColor: '#5a3010' });
};
