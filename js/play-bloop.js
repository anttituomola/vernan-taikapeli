'use strict';

// Loitsupolku (Kaukamaa, Porkkanakumpu): Pupupolun isompi ja haastavampi
// jatko (palaute: pupun ohjaus oli mieluisa, ja siitä toivottiin isompaa).
// Uutta: LOITSU eli aliohjelma. Ohjelmarivejä on kaksi: pupurivi (pääohjelma)
// ja ★-rivi (loitsu). Nuolet menevät valitulle riville (rivin napautus
// valitsee sen), ja ★-nappi lisää pupuriville loitsun: pupu tekee silloin koko
// ★-rivin. Pupurivi on niin lyhyt, ettei reitti mahdu siihen ilman loitsua.
// Kolmannesta kierroksesta alkaen niityllä on myyriä, jotka nousevat joka
// toisella askeleella (ylhäällä parillisilla askelilla, myös tauolla sekä
// odottaessa): pupu ei saa olla myyrän kolossa sen noustessa. Odota-nappi (⏸)
// pitää pupun paikallaan yhden askeleen. Törmäys pensaaseen, reunaan tai
// nousevaan myyrään pysäyttää pupun (!), ja ohjelma jää korjattavaksi.
// Neljä arvottua, kovenevaa kierrosta. Rata rakennetaan arvotusta ohjelmasta,
// joten se ratkeaa aina, ja leveyshaku varmistaa, ettei lyhin reitti mahdu
// pupuriville ilman loitsua. Ensimmäisellä kierroksella loitsu on valmiina.
// Ensimmäisellä ajolla onnistunut kierros antaa kultaisen porkkanan.
// Ei sydämiä. Tehtävät 2. ja 3. kierroksen jälkeen (lukumäärä, kuviosarja).

// main/spell: rivien pituudet, stars: loitsujen määrä pääohjelmassa vähintään,
// waits: odotuksia pääohjelmassa, moles: myyriä reitillä (odotuksen jälkeen),
// decoys: myyriä reitin vieressä, len: reitin askeleet, given: loitsu valmiina
var BLOOP_ROUNDS = [
  { cols: 7, rows: 5, main: 4, spell: 3, stars: 2, waits: 0, moles: 0, decoys: 0, carrots: 1, len: [7, 11], bushes: 6, given: true },
  { cols: 7, rows: 5, main: 5, spell: 3, stars: 3, waits: 0, moles: 0, decoys: 0, carrots: 2, len: [9, 14], bushes: 7 },
  { cols: 7, rows: 6, main: 6, spell: 3, stars: 3, waits: 1, moles: 1, decoys: 2, carrots: 1, len: [9, 14], bushes: 7 },
  { cols: 8, rows: 6, main: 7, spell: 4, stars: 3, waits: 2, moles: 2, decoys: 2, carrots: 2, len: [12, 19], bushes: 9 }
];
var BLOOP_WAIT = 4;   // käsky: odota
var BLOOP_STAR = 5;   // käsky: loitsu
var BLOOP_STEP_T = 0.45;

var bloop = {
  round: 0, state: 'intro', t: 0, R: null, grid: null, main: [], spell: [], edit: 'main',
  running: false, steps: [], step: -1, stepT: 0, tick: 0,
  bunny: { c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: 1 }, got: 0, carrots: [],
  failT: 0, crash: false, bonk: -1, runs: 0, gold: [], taskDelay: -1, hintT: 0, tapped: false, shakeT: 0
};

// ---------- Ohjelman suoritus ----------
// Litistää pääohjelman askeliksi: { d, mi, si } (si = loitsurivin paikka tai -1)
function bloopExpand(main, spell) {
  var out = [], i, k;
  for (i = 0; i < main.length; i++) {
    if (main[i] === BLOOP_STAR) {
      for (k = 0; k < spell.length; k++) out.push({ d: spell[k], mi: i, si: k });
    } else {
      out.push({ d: main[i], mi: i, si: -1 });
    }
  }
  return out;
}
// Myyrät ovat ylhäällä parillisilla askelilla (0 = ennen ensimmäistä askelta)
function bloopMoleUpAt(tick) { return tick % 2 === 0; }
// Yksi askel säännöin: palauttaa { c, r, fail: null | 'crash' | 'bonk' }
function bloopStep(L, c, r, d, tick) {
  var nc = c, nr = r, R = L.R;
  if (d >= 0 && d < 4) {
    nc = c + BCODE_DIRS[d][0]; nr = r + BCODE_DIRS[d][1];
    if (nc < 0 || nr < 0 || nc >= R.cols || nr >= R.rows || L.bush[bcodeKey(nc, nr)]) return { c: c, r: r, fail: 'crash' };
  }
  if (L.mole[bcodeKey(nc, nr)] && bloopMoleUpAt(tick)) return { c: nc, r: nr, fail: 'bonk' };
  return { c: nc, r: nr, fail: null };
}
// Koko ohjelman simulointi arvonnan tarkistukseen
function bloopSimulate(L, main, spell) {
  var steps = bloopExpand(main, spell), c = L.start.c, r = L.start.r, i, k, s, got = {}, n = 0;
  for (i = 0; i < steps.length; i++) {
    s = bloopStep(L, c, r, steps[i].d, i + 1);
    if (s.fail) return false;
    c = s.c; r = s.r;
    for (k = 0; k < L.carrots.length; k++) if (!got[k] && L.carrots[k].c === c && L.carrots[k].r === r) { got[k] = true; n++; }
  }
  return n === L.carrots.length && c === L.burrow.c && r === L.burrow.r;
}

// ---------- Arvonta ----------
function bloopRandDirs(n) {
  var out = [], d, prev = -1, i;
  for (i = 0; i < n; i++) {
    do { d = Math.floor(Math.random() * 4); } while (prev >= 0 && d === (prev + 2) % 4);
    out.push(d);
    prev = d;
  }
  return out;
}
function bloopTryGenerate(R) {
  var spell, main, i, k, cells, start, steps, c, r, d, seen, path, arrive, L, cand, p, tick;
  // Loitsu: vähintään kaksi eri suuntaa, ei edestakaista liikettä
  spell = bloopRandDirs(R.spell);
  if (spell[0] === spell[1] && spell[spell.length - 1] === spell[0]) return null;
  // Pääohjelma: loitsut, odotukset ja yksittäiset nuolet sekaisin
  main = [];
  for (i = 0; i < R.stars; i++) main.push(BLOOP_STAR);
  for (i = 0; i < R.waits; i++) main.push(BLOOP_WAIT);
  var rest = bloopRandDirs(R.main - main.length);
  for (i = 0; i < rest.length; i++) main.push(rest[i]);
  shuffleNums(main);
  if (main[0] === BLOOP_WAIT) return null;
  for (i = 1; i < main.length; i++) if (main[i] === BLOOP_WAIT && main[i - 1] === BLOOP_WAIT) return null;
  // Kulje ohjelma: reitti ei saa käydä samassa ruudussa kahdesti
  start = { c: Math.floor(Math.random() * R.cols), r: Math.floor(Math.random() * R.rows) };
  steps = bloopExpand(main, spell);
  c = start.c; r = start.r;
  seen = {}; seen[bcodeKey(c, r)] = true;
  path = [{ c: c, r: r, tick: 0 }];
  arrive = {};
  for (i = 0; i < steps.length; i++) {
    d = steps[i].d;
    if (d === BLOOP_WAIT) { path[path.length - 1].waits = (path[path.length - 1].waits || 0) + 1; continue; }
    c += BCODE_DIRS[d][0]; r += BCODE_DIRS[d][1];
    if (c < 0 || r < 0 || c >= R.cols || r >= R.rows || seen[bcodeKey(c, r)]) return null;
    seen[bcodeKey(c, r)] = true;
    path.push({ c: c, r: r, tick: i + 1, afterWait: steps[i - 1] && steps[i - 1].d === BLOOP_WAIT });
  }
  if (path.length - 1 < R.len[0] || path.length - 1 > R.len[1]) return null;
  L = { R: { cols: R.cols, rows: R.rows, burrow: true }, bush: {}, mole: {}, carrots: [], start: start, burrow: path[path.length - 1], key: null, gate: null };
  // Myyrät: reitillä odotusten jälkeen (ilman odotusta pupu osuisi myyrään)
  var inner = path.slice(1, path.length - 1);
  if (R.moles) {
    cand = inner.filter(function (q) { return q.afterWait && !q.waits && !bloopMoleUpAt(q.tick); });
    if (cand.length < R.moles) return null;
    shuffleNums(cand);
    for (i = 0; i < R.moles; i++) L.mole[bcodeKey(cand[i].c, cand[i].r)] = true;
  }
  // Porkkanat reitille (ei myyrän koloon)
  cand = inner.filter(function (q) { return !L.mole[bcodeKey(q.c, q.r)]; });
  if (cand.length < R.carrots) return null;
  shuffleNums(cand);
  for (i = 0; i < R.carrots; i++) L.carrots.push({ c: cand[i].c, r: cand[i].r });
  // Hämäysmyyrät ja pensaat reitin ulkopuolelle
  cells = [];
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) if (!seen[bcodeKey(c, r)]) cells.push({ c: c, r: r });
  shuffleNums(cells);
  for (i = 0, k = 0; i < cells.length && k < R.decoys; i++) {
    p = cells[i];
    if (bloopNearPath(p, seen)) { L.mole[bcodeKey(p.c, p.r)] = true; k++; p.used = true; }
  }
  for (i = 0, k = 0; i < cells.length && k < R.bushes; i++) {
    if (cells[i].used) continue;
    L.bush[bcodeKey(cells[i].c, cells[i].r)] = true;
    k++;
  }
  // Loitsu on pakollinen: lyhin reitti ei mahdu pupuriville yksittäisinä nuolina
  var short = bcodeSolve(L);
  if (!short || short.length <= R.main) return null;
  if (!bloopSimulate(L, main, spell)) return null;
  L.main = main;
  L.spell = spell;
  return L;
}
function bloopNearPath(p, seen) {
  var d;
  for (d = 0; d < 4; d++) if (seen[bcodeKey(p.c + BCODE_DIRS[d][0], p.r + BCODE_DIRS[d][1])]) return true;
  return false;
}
function bloopGenerate(R) {
  var i, L;
  for (i = 0; i < 200000; i++) {
    L = bloopTryGenerate(R);
    if (L) return L;
  }
  return null;
}

// ---------- Kierros ----------
function bloopStartRound() {
  var R = BLOOP_ROUNDS[bloop.round], L = bloopGenerate(R), i;
  bloop.R = R;
  bloop.grid = L;
  bloop.carrots = [];
  for (i = 0; i < L.carrots.length; i++) bloop.carrots.push({ c: L.carrots[i].c, r: L.carrots[i].r, got: false, wig: 0 });
  bloop.main = [];
  bloop.spell = [];
  if (R.given) for (i = 0; i < L.spell.length; i++) bloop.spell.push({ d: L.spell[i], pop: 0.3 + i * 0.1 });
  bloop.edit = R.given ? 'main' : 'spell';
  bloop.running = false;
  bloop.runs = 0;
  bloop.state = 'play';
  bloop.t = 0;
  bloop.hintT = 0;
  bloopResetBunny();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function bloopResetBunny() {
  var b = bloop.bunny, i;
  b.c = bloop.grid.start.c; b.r = bloop.grid.start.r; b.fc = b.c; b.fr = b.r; b.hop = 0;
  bloop.got = 0;
  bloop.tick = 0;
  bloop.bonk = -1;
  for (i = 0; i < bloop.carrots.length; i++) bloop.carrots[i].got = false;
}

// ---------- Alustus ----------
function initBloop() {
  var i;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  bloop.round = 0;
  bloop.state = 'intro';
  bloop.t = 0;
  bloop.R = BLOOP_ROUNDS[0];
  bloop.grid = null;
  bloop.gold = [];
  bloop.taskDelay = -1;
  bloop.hintT = 0;
  bloop.main = [];
  bloop.spell = [];
  renderBackground();
}
function respawnBloop() { bloopStartRound(); }
function resizeBloop() { camX = 0; }

// ---------- Asettelu ----------
function bloopLayout() {
  var R = bloop.R || BLOOP_ROUNDS[0], W = viewW, h = viewH;
  var areaW = W * 0.6, areaH = h * 0.66, cs = Math.min(areaW / R.cols, areaH / R.rows, h * 0.14);
  var ox = W * 0.38 - cs * R.cols / 2, oy = h * 0.31 + (areaH - cs * R.rows) / 2;
  return { cs: cs, ox: ox, oy: oy };
}
function bloopCell(c, r, L) {
  L = L || bloopLayout();
  return { x: L.ox + (c + 0.5) * L.cs, y: L.oy + (r + 0.5) * L.cs };
}
// Ohjelmarivit: pupurivi ylempänä, ★-rivi sen alla; vasemmalla rivin merkki
function bloopSlotSize() {
  var R = bloop.R || BLOOP_ROUNDS[0];
  return Math.min(viewH * 0.085, viewW * 0.5 / Math.max(R.main, R.spell) / 1.1);
}
function bloopRowY(row) { return viewH * (row === 'main' ? 0.1 : 0.215); }
function bloopRowX0() { return viewW * 0.16; }
function bloopSlotPos(row, i) {
  var s = bloopSlotSize();
  return { x: bloopRowX0() + i * s * 1.1, y: bloopRowY(row), s: s };
}
function bloopRowLen(row) { var R = bloop.R || BLOOP_ROUNDS[0]; return row === 'main' ? R.main : R.spell; }
function bloopButtons() {
  var h = viewH, W = viewW, g = Math.min(h * 0.12, W * 0.07), bx = W * 0.84, by = h * 0.4;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    r: g * 0.44,
    star: { x: bx - g * 0.7, y: h * 0.66, r: g * 0.42 },
    wait: { x: bx + g * 0.7, y: h * 0.66, r: g * 0.42 },
    play: { x: bx, y: h * 0.85, r: g * 0.55 }
  };
}
function bloopHasWait() { return (bloop.R || BLOOP_ROUNDS[0]).waits > 0; }

// ---------- Napautus ----------
function handleBloopTap(px, py) {
  if (bloop.state !== 'play' || puzzleBusy() || celebrating || bloop.running) return;
  var b = bloopButtons(), i, p, L = bloopLayout(), row, list, s = bloopSlotSize();
  for (i = 0; i < b.arrows.length; i++) {
    if (Math.hypot(px - b.arrows[i].x, py - b.arrows[i].y) < b.r * 1.25) { bloopAdd(bloop.edit, b.arrows[i].dir); return; }
  }
  if (Math.hypot(px - b.star.x, py - b.star.y) < b.star.r * 1.3) { bloopAdd('main', BLOOP_STAR); return; }
  if (bloopHasWait() && Math.hypot(px - b.wait.x, py - b.wait.y) < b.wait.r * 1.3) { bloopAdd(bloop.edit, BLOOP_WAIT); return; }
  if (Math.hypot(px - b.play.x, py - b.play.y) < b.play.r * 1.3) {
    if (!bloop.main.length) { bloopBuzz(); return; }
    bloopRun();
    return;
  }
  // Ohjelmarivit: täytetyn ruudun napautus poistaa sen, muu kohta valitsee rivin
  for (row = 0; row < 2; row++) {
    var name = row === 0 ? 'main' : 'spell';
    list = bloop[name];
    if (Math.abs(py - bloopRowY(name)) > s * 0.6) continue;
    for (i = 0; i < list.length; i++) {
      p = bloopSlotPos(name, i);
      if (Math.abs(px - p.x) < p.s * 0.55) {
        list.splice(i, 1);
        bloop.edit = name;
        spawnSparkles(p.x, p.y, 5, '#c9b8e0');
        playNote(392, 0, 0.1, 'sine', 0.25);
        return;
      }
    }
    if (px > bloopRowX0() - s * 1.4 && px < bloopSlotPos(name, bloopRowLen(name) - 1).x + s) {
      bloop.edit = name;
      bloop.tapped = true;
      playNote(name === 'main' ? 660 : 880, 0, 0.08, 'sine', 0.2);
      return;
    }
  }
  // Niityn asiat reagoivat
  var bp = bloopCell(bloop.bunny.fc, bloop.bunny.fr, L);
  if (Math.hypot(px - bp.x, py - bp.y) < L.cs * 0.5) { bloop.bunny.hop = 1; playNote(880, 0, 0.08, 'sine', 0.25); return; }
  for (i = 0; i < bloop.carrots.length; i++) {
    p = bloopCell(bloop.carrots[i].c, bloop.carrots[i].r, L);
    if (Math.hypot(px - p.x, py - p.y) < L.cs * 0.45) { bloop.carrots[i].wig = 0.5; playNote(740, 0, 0.08, 'sine', 0.2); return; }
  }
}
function bloopAdd(row, d) {
  var list = bloop[row];
  bloop.tapped = true;
  if (list.length >= bloopRowLen(row)) { bloopBuzz(); return; }
  list.push({ d: d, pop: 0.25 });
  if (d === BLOOP_STAR) {
    playNote(988, 0, 0.1, 'triangle', 0.3);
    playNote(1319, 0.07, 0.12, 'triangle', 0.25);
  } else {
    playNote(523 + list.length * 35 + (row === 'spell' ? 200 : 0), 0, 0.1, 'triangle', 0.3);
  }
}
function bloopBuzz() {
  bloop.shakeT = 0.3;
  playNote(170, 0, 0.2, 'sawtooth', 0.15);
}
function bloopRun() {
  var main = bloop.main.map(function (q) { return q.d; }), spell = bloop.spell.map(function (q) { return q.d; });
  bloop.steps = bloopExpand(main, spell);
  bloopResetBunny();
  bloop.running = true;
  bloop.step = -1;
  bloop.stepT = 0.25;
  bloop.runs++;
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.1, 0.16, 'triangle', 0.35);
}
function bloopFail(kind) {
  bloop.running = false;
  bloop.failT = 1.1;
  bloop.crash = kind;
  bloop.shakeT = 0.4;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
}
function bloopAtGoal() {
  var b = bloop.bunny, g = bloop.grid.burrow;
  return bloop.got >= bloop.carrots.length && b.c === g.c && b.r === g.r;
}
// Myyrien tila: ajossa askelen mukaan, muuten samassa tahdissa itsestään
function bloopMolesUp() {
  if (bloop.running || bloop.failT > 0) return bloopMoleUpAt(bloop.tick);
  return bloopMoleUpAt(Math.floor(globalT / BLOOP_STEP_T));
}

// ---------- Päivitys ----------
function updateBloop(dt) {
  var busy, b = bloop.bunny, i, L, s, st;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  b.hop = Math.max(0, b.hop - dt * 4);
  b.fc += (b.c - b.fc) * Math.min(1, dt * 10);
  b.fr += (b.r - b.fr) * Math.min(1, dt * 10);
  if (bloop.shakeT > 0) bloop.shakeT -= dt;
  for (i = 0; i < bloop.main.length; i++) if (bloop.main[i].pop > 0) bloop.main[i].pop -= dt;
  for (i = 0; i < bloop.spell.length; i++) if (bloop.spell[i].pop > 0) bloop.spell[i].pop -= dt;
  for (i = 0; i < bloop.carrots.length; i++) if (bloop.carrots[i].wig > 0) bloop.carrots[i].wig -= dt;
  if (bloop.taskDelay > 0 && !busy) {
    bloop.taskDelay -= dt;
    if (bloop.taskDelay <= 0) {
      if (bloop.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (bloop.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  bloop.t += dt;
  if (bloop.state === 'intro') { if (bloop.t > 0.6) bloopStartRound(); return; }
  if (bloop.state === 'roundDone') {
    if (bloop.t > 2.0 && bloop.taskDelay <= 0) {
      bloop.round++;
      if (bloop.round >= BLOOP_ROUNDS.length) { bloop.state = 'won'; bloop.t = 0; soundFanfare(); }
      else bloopStartRound();
    }
    return;
  }
  if (bloop.state === 'won') { if (bloop.t > 1.4) startCelebration(); return; }
  if (!bloop.tapped) bloop.hintT += dt;
  if (bloop.failT > 0) {
    bloop.failT -= dt;
    if (bloop.failT <= 0) bloopResetBunny();
  }
  if (!bloop.running) return;
  L = bloopLayout();
  bloop.stepT -= dt;
  if (bloop.stepT > 0) return;
  bloop.stepT = BLOOP_STEP_T;
  bloop.step++;
  if (bloop.step >= bloop.steps.length) {
    if (bloopAtGoal()) bloopRoundDone(L);
    else bloopFail('lost');
    return;
  }
  s = bloop.steps[bloop.step];
  bloop.tick = bloop.step + 1;
  if (s.d === 1) b.facing = 1; else if (s.d === 3) b.facing = -1;
  st = bloopStep(bloop.grid, b.c, b.r, s.d, bloop.tick);
  if (st.fail === 'crash') {
    // Törmäys: pupu nytkähtää kohti estettä
    b.fc = b.c + BCODE_DIRS[s.d][0] * 0.3; b.fr = b.r + BCODE_DIRS[s.d][1] * 0.3;
    bloopFail('crash');
    return;
  }
  if (s.d !== BLOOP_WAIT) { b.c = st.c; b.r = st.r; b.hop = 1; playNote(600 + bloop.step * 25, 0, 0.08, 'sine', 0.25); }
  else playNote(440, 0, 0.06, 'sine', 0.15);
  if (st.fail === 'bonk') {
    bloop.bonk = bcodeKey(st.c, st.r);
    var bpp = bloopCell(st.c, st.r, L);
    artPop(bpp.x, bpp.y, L.cs * 0.4, '#8a6a5a', 'burst');
    playNote(260, 0.05, 0.12, 'square', 0.15);
    bloopFail('bonk');
    return;
  }
  var cp = bloopCell(b.c, b.r, L);
  for (i = 0; i < bloop.carrots.length; i++) {
    var ca = bloop.carrots[i];
    if (!ca.got && ca.c === b.c && ca.r === b.r) {
      ca.got = true;
      bloop.got++;
      artPop(cp.x, cp.y, L.cs * 0.4, '#ff8f3a', 'burst');
      spawnSparkles(cp.x, cp.y, 10, '#ff8f3a');
      playNote(988 + bloop.got * 60, 0, 0.1, 'sine', 0.3);
    }
  }
}
function bloopRoundDone(L) {
  var p = bloopCell(bloop.bunny.c, bloop.bunny.r, L);
  bloop.running = false;
  bloop.state = 'roundDone';
  bloop.t = 0;
  bloop.gold[bloop.round] = bloop.runs === 1;
  artPop(p.x, p.y, L.cs * 0.8, '#ffe27a', 'ring');
  spawnSparkles(p.x, p.y, 22, bloop.runs === 1 ? '#ffd24f' : '#ffe27a');
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (bloop.runs === 1) playNote(1760, 0.45, 0.3, 'sine', 0.3);
  if (bloop.round === 1 || bloop.round === 2) bloop.taskDelay = 1.6;
}

// ---------- Piirto ----------
function renderBloopBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#7fc8f0');
  g.addColorStop(0.5, '#d8f0ff');
  g.addColorStop(1, '#fff0d0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.92, h * 0.08, h * 0.045, 0.1);
  b.fillStyle = artMix('#6fbf5a', '#d8f0ff', 0.45);
  b.beginPath(); b.moveTo(0, h * 0.42);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.36 - Math.sin(x / vw * 5 + 2) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = '#86d466';
  b.beginPath(); b.moveTo(0, h * 0.52);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.48 - Math.sin(x / vw * 3.1 + 1) * 0.03));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Ohjelmarivien ja nappien taustat
  b.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(b, vw * 0.7, h * 0.24, vw * 0.28, h * 0.73, h * 0.04);
  b.fill();
  for (i = 0; i < 7; i++) drawFlower(b, vw * (0.02 + i * 0.1), h * 0.975, h * 0.011, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}
function drawBloopStar(c, x, y, s, color) {
  var i, a, rr;
  c.beginPath();
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5;
    rr = i % 2 ? s * 0.45 : s;
    if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  artFillPath(c, color || '#ffd24f', y - s, y + s, s, { lineColor: '#b8862a' });
}
function drawBloopWait(c, x, y, s, color) {
  c.fillStyle = color || '#5a3a8a';
  roundRect(c, x - s * 0.55, y - s * 0.7, s * 0.38, s * 1.4, s * 0.12); c.fill();
  roundRect(c, x + s * 0.17, y - s * 0.7, s * 0.38, s * 1.4, s * 0.12); c.fill();
}
// Käskyn kuva: nuoli, tauko tai loitsutähti
function drawBloopCmd(c, x, y, s, d) {
  if (d === BLOOP_STAR) drawBloopStar(c, x, y, s * 1.05);
  else if (d === BLOOP_WAIT) drawBloopWait(c, x, y, s * 0.8);
  else drawArrowGlyph(c, x, y, s, d, '#5a3a8a');
}
// Myyrän kolo; up = pää näkyy, bonk = tähdet pään ympärillä
function drawBloopMole(c, x, y, s, up, bonk) {
  artBlob(c, x, y + s * 0.35, s * 0.75, s * 0.32, '#9a6a3a', { lineColor: '#5a3a1a', hi: 0.15 });
  artBlob(c, x, y + s * 0.38, s * 0.45, s * 0.17, '#3a2418', { line: false });
  if (up > 0) {
    var hy = y + s * 0.35 - up * s * 0.55;
    c.save();
    c.beginPath(); c.rect(x - s, y - s * 1.5, s * 2, s * 1.88); c.clip();
    artBlob(c, x, hy, s * 0.4, s * 0.42, '#7a6a6a', { lineColor: '#3a2a2a', hi: 0.2 });
    artBlob(c, x, hy + s * 0.08, s * 0.14, s * 0.1, '#f0a8a8', { lineColor: '#a86a6a' });
    artEye(c, x - s * 0.15, hy - s * 0.1, s * 0.07, 0, bonk);
    artEye(c, x + s * 0.15, hy - s * 0.1, s * 0.07, 0, bonk);
    c.restore();
    if (bonk) {
      for (var i = 0; i < 3; i++) {
        var a = globalT * 5 + i * 2.1;
        drawStar(c, x + Math.cos(a) * s * 0.5, hy - s * 0.5 + Math.sin(a) * s * 0.12, s * 0.12, 0, 0.9);
      }
    }
  }
}

function drawBloopRow(c, name, sh) {
  var R = bloop.R, i, p, list = bloop[name], n = bloopRowLen(name), s = bloopSlotSize(), cur = bloop.running ? bloop.steps[bloop.step] : null;
  var y = bloopRowY(name), x0 = bloopRowX0(), active = bloop.edit === name && !bloop.running;
  // Rivin tausta ja valinta
  c.fillStyle = active ? 'rgba(255,240,160,0.75)' : 'rgba(255,255,255,0.35)';
  roundRect(c, x0 - s * 1.35, y - s * 0.68, s * 1.1 * n + s * 1.25, s * 1.36, s * 0.3);
  c.fill();
  if (active) {
    c.strokeStyle = 'rgba(255,190,60,' + (0.7 + Math.sin(globalT * 5) * 0.25) + ')';
    c.lineWidth = Math.max(2, s * 0.06);
    c.stroke();
  }
  // Merkki: pupu tai tähti
  if (name === 'main') drawBunny(c, x0 - s * 0.8, y + s * 0.08, s * 0.4, 0, globalT * 3, true);
  else drawBloopStar(c, x0 - s * 0.8, y, s * 0.36);
  for (i = 0; i < n; i++) {
    p = bloopSlotPos(name, i);
    var cmd = list[i];
    var on = cur && (name === 'main' ? cur.mi === i : cur.si === i && bloop.steps[bloop.step].si >= 0);
    var ps = p.s * (cmd && cmd.pop > 0 ? 1 + cmd.pop * 0.6 : 1);
    c.fillStyle = on ? '#ffe27a' : (cmd ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)');
    roundRect(c, p.x - ps / 2 + sh, p.y - ps / 2, ps, ps, ps * 0.2);
    c.fill();
    if (cmd) drawBloopCmd(c, p.x + sh, p.y, ps * 0.3, cmd.d);
  }
}

function drawBloop() {
  var c = ctx, L, R = bloop.R, i, k, p, b = bloopButtons(), sh = bloop.shakeT > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
  if (!beginPlayWorld()) return;
  if (bloop.grid) {
    L = bloopLayout();
    var G = bloop.grid, up = bloopMolesUp();
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      p = bloopCell(i, k, L);
      artRoundRect(c, p.x - L.cs * 0.47, p.y - L.cs * 0.47, L.cs * 0.94, L.cs * 0.94, L.cs * 0.12, (i + k) % 2 ? '#9fdc7f' : '#8fd06f', { lineColor: '#5a9a4a', line: Math.max(1, L.cs * 0.02) });
    }
    p = bloopCell(G.start.c, G.start.r, L);
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.arc(p.x, p.y + L.cs * 0.28, L.cs * 0.3, 0, Math.PI * 2); c.fill();
    p = bloopCell(G.burrow.c, G.burrow.r, L);
    drawBcodeBurrow(c, p.x, p.y, L.cs * 0.4);
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      p = bloopCell(i, k, L);
      if (G.bush[bcodeKey(i, k)]) drawBush(c, p.x, p.y + L.cs * 0.35, L.cs * 0.25);
      else if (G.mole[bcodeKey(i, k)]) {
        var bonk = bloop.bonk === bcodeKey(i, k);
        drawBloopMole(c, p.x, p.y, L.cs * 0.4, up || bonk ? 1 : 0, bonk);
      }
    }
    for (i = 0; i < bloop.carrots.length; i++) {
      var ca = bloop.carrots[i];
      if (ca.got) continue;
      p = bloopCell(ca.c, ca.r, L);
      c.save(); c.translate(p.x, p.y); c.rotate(ca.wig > 0 ? Math.sin(globalT * 30) * 0.2 : Math.sin(globalT * 2 + i) * 0.05);
      drawCarrotGlyph(c, 0, -L.cs * 0.1, L.cs * 0.26);
      c.restore();
    }
    // Pupu
    var bp = bloopCell(bloop.bunny.fc, bloop.bunny.fr, L);
    c.save();
    c.translate(bp.x, 0);
    c.scale(bloop.bunny.facing, 1);
    drawBunny(c, 0, bp.y + L.cs * 0.33, L.cs * 0.26, Math.sin(bloop.bunny.hop * Math.PI) * L.cs * 0.22, globalT * 3, false);
    c.restore();
    // Loitsun aikana pupun ympärillä kimaltaa
    var cur = bloop.running ? bloop.steps[bloop.step] : null;
    if (cur && cur.si >= 0) artGlow(c, bp.x, bp.y, L.cs * 0.5, '#ffe27a', 0.35);
    if (bloop.failT > 0) {
      c.fillStyle = bloop.crash === 'lost' ? '#8a2be2' : '#ff5f5f';
      c.font = 'bold ' + Math.round(L.cs * 0.5) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(bloop.crash === 'lost' ? '?' : '!', bp.x, bp.y - L.cs * 0.55);
      c.textBaseline = 'alphabetic';
    }
    drawBloopRow(c, 'main', sh);
    drawBloopRow(c, 'spell', sh);
    // Napit
    for (i = 0; i < b.arrows.length; i++) {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.arc(b.arrows[i].x, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
      artCircle(c, b.arrows[i].x, b.arrows[i].y, b.r, bloop.running ? '#d8cce8' : '#ffffff', { lineColor: '#b8a8d8' });
      drawArrowGlyph(c, b.arrows[i].x, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, '#8a2be2');
    }
    artCircle(c, b.star.x, b.star.y, b.star.r, '#fff4c8', { lineColor: '#d8a830' });
    drawBloopStar(c, b.star.x, b.star.y, b.star.r * 0.6);
    if (bloopHasWait()) {
      artCircle(c, b.wait.x, b.wait.y, b.wait.r, '#ffffff', { lineColor: '#b8a8d8' });
      drawBloopWait(c, b.wait.x, b.wait.y, b.wait.r * 0.45, '#8a2be2');
    }
    var pulse = bloop.main.length && !bloop.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
    artCircle(c, b.play.x, b.play.y, b.play.r * pulse, bloop.running ? '#8fd06f' : '#3ccf6a', { lineColor: '#1f8a40' });
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(b.play.x - b.play.r * 0.3, b.play.y - b.play.r * 0.42);
    c.lineTo(b.play.x + b.play.r * 0.48, b.play.y);
    c.lineTo(b.play.x - b.play.r * 0.3, b.play.y + b.play.r * 0.42);
    c.closePath(); c.fill();
    drawBloopHint(c, b);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawBloopHud(c);
  drawTaskOverlay(c);
}
// Vihjeet: 1. kierroksella käsi näyttää ★-napin (loitsu on valmiina), 2. kierroksella
// ★-rivin valinnan, 3. kierroksella odotusnapin. Loput lapsi päättelee itse.
function drawBloopHint(c, b) {
  var tgt = null, k;
  if (bloop.state !== 'play' || bloop.running || bloop.runs > 0) return;
  if (bloop.round === 0 && bloop.hintT > 1.2 && bloop.main.length === 0) tgt = b.star;
  else if (bloop.round === 1 && bloop.hintT > 1.5 && !bloop.spell.length && !bloop.main.length) {
    var p = bloopSlotPos('spell', 0);
    tgt = { x: p.x, y: p.y };
  } else if (bloop.round === 2 && bloop.hintT > 2.5 && bloop.main.length === 0 && bloop.spell.length === 0) tgt = b.wait;
  if (!tgt) return;
  k = (globalT % 1.2) / 1.2;
  drawHand(c, tgt.x + viewH * 0.01, tgt.y + viewH * 0.02 + Math.abs(Math.sin(k * Math.PI)) * viewH * 0.03, viewH * 0.04);
}

// HUD: kierrokset porkkanoina oikeassa yläkulmassa; kultainen = ensimmäisellä ajolla
function drawBloopHud(c) {
  var hs = viewH * 0.022, i, n = BLOOP_ROUNDS.length, x0 = viewW * 0.72, y = viewH * 0.1;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, x0, y - hs * 1.8, hs * 2.6 * n + hs * 1.2, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < bloop.round || bloop.state === 'won' || (i === bloop.round && bloop.state === 'roundDone');
    var x = x0 + hs * 1.9 + i * hs * 2.6;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && bloop.gold[i]) artGlow(c, x, y, hs * 1.6, '#ffd24f', 0.7);
    drawCarrotGlyph(c, x, y - hs * 0.2, hs * 0.9);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.bloop = function (c, x, y, s) {
  drawBloopStar(c, x - s * 0.14, y - s * 0.14, s * 0.1);
  drawBloopMole(c, x + s * 0.12, y + s * 0.02, s * 0.12, 1, false);
  drawBunny(c, x - s * 0.1, y + s * 0.16, s * 0.08, 0, 0, false);
};
