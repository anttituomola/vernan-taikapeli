'use strict';

// Myyräkuningas (Kaukamaa, Porkkanakumpu): alueen vartija. Yhdistää alueen
// kaksi verbiä: OHJELMOINTI (Pupupolku) ja VÄRISÄDE (Värisäde). Myyräkuningas
// on vienyt kummun värit maan alle, ja sen kruunun kide on himmennyt.
// Aurinkokivi lähettää säteen kiviruutujen yli. Uusi sääntö: pupu kääntää
// kristallipeiliä hyppäämällä sen päälle (toinen hyppy kääntää takaisin).
// Ohjelmoi pupun reitti nuolilla (kuten Pupupolussa) niin, että kun ohjelma
// loppuu, säde kulkee oikeiden värilasien kautta kruunun kiteeseen oikean
// värisenä. Säde näkyy koko ajan ja muuttuu pupun hyppiessä. Epäonnistunut ajo
// (törmäys tai väärä lopputulos) vie sydämen, ja peilit palaavat alkuasentoon;
// sydänten loppuessa kierros arvotaan uudestaan. Kolme kierrosta: enemmän
// käännettäviä peilejä, peili joka pitää ohittaa (tai kääntää kahdesti), kaksi
// lasia, ja lopuksi toistonapit. Kolmas osuma kirkastaa kruunun, ja
// Myyräkuningas palauttaa värit ystävällisenä. Tehtävät osumien välissä.

// cols × rows, mirrors: säteen reitin peilit, wrong: niistä väärin päin olevat,
// filters: reitin lasit, decoys: hämäyspeilit, rocks: kivet (pysäyttävät säteen
// ja pupun), bushes: pensaat (vain pupulle), slots: ohjelmarivin pituus,
// len: pupun lyhimmän reitin askeleet, mult: toistonapit
var MOLE_ROUNDS = [
  { cols: 5, rows: 4, mirrors: 2, wrong: 1, filters: 1, decoys: 1, rocks: 0, bushes: 3, slots: 8, len: [3, 7], mult: false },
  { cols: 6, rows: 5, mirrors: 3, wrong: 2, filters: 2, decoys: 1, rocks: 1, bushes: 4, slots: 10, len: [6, 10], mult: false },
  { cols: 6, rows: 6, mirrors: 4, wrong: 3, filters: 2, decoys: 2, rocks: 1, bushes: 5, slots: 8, len: [9, 15], mult: true }
];
var MOLE_STEP_T = 0.45;

var mole = {
  round: 0, hits: 0, state: 'intro', t: 0, R: null, grid: [], src: null, gem: null, start: null,
  path: [], prog: [], running: false, steps: [], step: -1, stepT: 0,
  bunny: { c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: 1 }, failT: 0, crash: false,
  shakeT: 0, hitT: 0, calmT: 0, taskDelay: -1, solution: null, runs: 0
};

// ---------- Ruudukko ja säde ----------
function moleLayout() {
  var R = mole.R || MOLE_ROUNDS[0], W = viewW, h = viewH;
  var left = W * 0.12, right = W * 0.66, top = h * 0.27, bot = h * 0.97;
  var cs = Math.min((right - left) / R.cols, (bot - top) / R.rows, h * 0.14);
  return { cs: cs, ox: left + (right - left - cs * R.cols) / 2 + cs * 0.3, oy: top + (bot - top - cs * R.rows) / 2 };
}
function moleCellPos(c, r, L) {
  L = L || moleLayout();
  return { x: L.ox + (c + 0.5) * L.cs, y: L.oy + (r + 0.5) * L.cs };
}
function moleSrcPos(L) {
  L = L || moleLayout();
  return { x: L.ox - L.cs * 0.62, y: L.oy + (mole.src.r + 0.5) * L.cs };
}
function moleCell(c, r) {
  var R = mole.R;
  if (c < 0 || r < 0 || c >= R.cols || r >= R.rows) return null;
  return mole.grid[r * R.cols + c];
}
// Säde päättyy kiteeseen, kiveen tai reunaan; col = väri ruudusta lähtiessä
function moleTrace() {
  var c = 0, r = mole.src.r, dx = 1, dy = 0, pts = [], cl, n = 0, nd, col = 0, hit = false;
  while (n++ < 200) {
    cl = moleCell(c, r);
    if (!cl) break;
    if (cl.type === 'rock') { pts.push({ c: c, r: r, dx: dx, dy: dy, col: col, end: true }); break; }
    if (cl.type === 'filter') col |= cl.bit;
    pts.push({ c: c, r: r, dx: dx, dy: dy, col: col });
    if (cl.type === 'gem') { hit = col === cl.want; pts[pts.length - 1].gem = true; break; }
    if (cl.type === 'mirror') {
      nd = beamReflect(cl.o, dx, dy);
      dx = nd.dx; dy = nd.dy;
      pts[pts.length - 1].odx = dx; pts[pts.length - 1].ody = dy;
    }
    c += dx; r += dy;
  }
  return { pts: pts, hit: hit, col: col };
}
function moleWalkable(cl) {
  return cl && (cl.type === 'empty' || cl.type === 'mirror');
}

// ---------- Arvonta ----------
function moleShuffle(a) { for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[k]; a[k] = t; } return a; }
function moleTryGenerate(R) {
  var cols = R.cols, rows = R.rows, grid = [], used = {}, i, k, c, r, r0, dx, dy, turns = 0, s, seg = 0, idx = 0;
  var straight = [], pathMirrors = [], opts, pick, nd, o;
  for (i = 0; i < cols * rows; i++) grid.push({ type: 'empty' });
  function inG(cc, rr) { return cc >= 0 && rr >= 0 && cc < cols && rr < rows; }
  r0 = Math.floor(Math.random() * rows);
  c = 0; r = r0; dx = 1; dy = 0;
  // Säteen reitti kuten Värisäteessä
  while (turns < R.mirrors) {
    s = Math.floor(Math.random() * 3);
    for (k = 0; k < s; k++) {
      if (!inG(c, r) || used[c + ',' + r]) return null;
      used[c + ',' + r] = true;
      straight.push({ c: c, r: r, seg: seg, idx: idx++ });
      c += dx; r += dy;
    }
    if (!inG(c, r) || used[c + ',' + r]) return null;
    used[c + ',' + r] = true;
    idx++;
    opts = [];
    if (inG(c - dy, r + dx) && !used[(c - dy) + ',' + (r + dx)]) opts.push({ dx: -dy, dy: dx });
    if (inG(c + dy, r - dx) && !used[(c + dy) + ',' + (r - dx)]) opts.push({ dx: dy, dy: -dx });
    if (!opts.length) return null;
    pick = opts[Math.floor(Math.random() * opts.length)];
    nd = beamReflect(0, dx, dy);
    o = nd.dx === pick.dx && nd.dy === pick.dy ? 0 : 1;
    grid[r * cols + c] = { type: 'mirror', o: o, sol: o, ang: 0, turnT: 0, onPath: true, bit: pathMirrors.length };
    pathMirrors.push(grid[r * cols + c]);
    dx = pick.dx; dy = pick.dy;
    c += dx; r += dy;
    turns++;
    seg++;
  }
  var lastSeg = [];
  while (inG(c, r)) {
    if (used[c + ',' + r]) return null;
    used[c + ',' + r] = true;
    lastSeg.push({ c: c, r: r, seg: seg, idx: idx++ });
    c += dx; r += dy;
  }
  if (!lastSeg.length) return null;
  // Kide viimeisellä osuudella; lasit ennen sitä (ei viimeiseen ruutuun ennen kidettä välttämättä)
  var gem = lastSeg[Math.floor(Math.random() * lastSeg.length)];
  var before = lastSeg.filter(function (p) { return p.idx < gem.idx; });
  var fcand = moleShuffle(straight.concat(before));
  if (fcand.length < R.filters) return null;
  var filt = fcand.slice(0, R.filters);
  var prim = moleShuffle([1, 2, 4]), want = 0;
  for (i = 0; i < filt.length; i++) { grid[filt[i].r * cols + filt[i].c] = { type: 'filter', bit: prim[i], wig: 0 }; want |= prim[i]; }
  grid[gem.r * cols + gem.c] = { type: 'gem', want: want, lit: 0 };
  // Kiteen takana olevat ruudut vapautuvat pupulle (säde pysähtyy kiteeseen)
  lastSeg.forEach(function (p) { if (p.idx > gem.idx) delete used[p.c + ',' + p.r]; });
  var free = [];
  for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (!used[c + ',' + r]) free.push({ c: c, r: r });
  moleShuffle(free);
  if (free.length < R.decoys + R.rocks + R.bushes + 1) return null;
  k = 0;
  for (i = 0; i < R.decoys; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'mirror', o: Math.floor(Math.random() * 2), sol: -1, ang: 0, turnT: 0, onPath: false };
  for (i = 0; i < R.rocks; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'rock', wig: 0 };
  for (i = 0; i < R.bushes; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'bush' };
  // Pupu aloittaa tyhjästä ruudusta (myös säteen reitin suorat ruudut käyvät)
  var starts = [];
  for (i = 0; i < grid.length; i++) if (grid[i].type === 'empty') starts.push({ c: i % cols, r: Math.floor(i / cols) });
  if (!starts.length) return null;
  var start = starts[Math.floor(Math.random() * starts.length)];
  // Väärin päin olevat peilit
  var wrongIdx = moleShuffle(pathMirrors.map(function (m, j) { return j; })).slice(0, R.wrong), wrongMask = 0;
  wrongIdx.forEach(function (j) { pathMirrors[j].o = 1 - pathMirrors[j].sol; wrongMask |= 1 << j; });
  // Leveyshaku: pupun reitti, jonka jälkeen juuri väärät peilit on käännetty pariton määrä kertoja
  var q = [{ c: start.c, r: start.r, m: 0 }], seen = {}, prev = {}, goal = null, st, d, nc, nr, nm, cl, id, nid;
  seen[start.c + ',' + start.r + ',0'] = true;
  while (q.length) {
    st = q.shift();
    id = st.c + ',' + st.r + ',' + st.m;
    if (st.m === wrongMask) { goal = id; break; }
    for (d = 0; d < 4; d++) {
      nc = st.c + BCODE_DIRS[d][0]; nr = st.r + BCODE_DIRS[d][1];
      if (!inG(nc, nr)) continue;
      cl = grid[nr * cols + nc];
      if (!moleWalkable(cl)) continue;
      nm = st.m;
      if (cl.type === 'mirror' && cl.onPath) nm ^= 1 << cl.bit;
      nid = nc + ',' + nr + ',' + nm;
      if (seen[nid]) continue;
      seen[nid] = true;
      prev[nid] = { from: id, d: d };
      q.push({ c: nc, r: nr, m: nm });
    }
  }
  if (!goal) return null;
  var sol = [];
  while (prev[goal]) { sol.unshift(prev[goal].d); goal = prev[goal].from; }
  if (sol.length < R.len[0] || sol.length > R.len[1]) return null;
  if (bcodeCmdCount(sol, R.mult) > R.slots) return null;
  if (R.mult && sol.length <= R.slots) return null;
  // Tarkistus: alkuasento ei osu, ratkaisun jälkeen osuu
  var save = { grid: mole.grid, src: mole.src, R: mole.R };
  mole.grid = grid; mole.src = { r: r0 }; mole.R = R;
  var okStart = !moleTrace().hit;
  pathMirrors.forEach(function (m) { m.o0 = m.o; m.o = m.sol; });
  var okSol = moleTrace().hit;
  pathMirrors.forEach(function (m) { m.o = m.o0; });
  mole.grid = save.grid; mole.src = save.src; mole.R = save.R;
  if (!okStart || !okSol) return null;
  return { grid: grid, src: { r: r0 }, start: start, gem: gem, solution: sol };
}
function moleGenerate(R) {
  var g = null, i;
  for (i = 0; i < 4000 && !g; i++) g = moleTryGenerate(R);
  return g;
}

// ---------- Kierros ----------
function moleStartRound() {
  var R = MOLE_ROUNDS[mole.round], g = moleGenerate(R), i, cl;
  mole.R = R;
  mole.grid = g.grid;
  mole.src = g.src;
  mole.start = g.start;
  mole.gem = g.gem;
  mole.solution = g.solution;
  for (i = 0; i < mole.grid.length; i++) {
    cl = mole.grid[i];
    if (cl.type === 'mirror') { cl.o0 = cl.o; cl.ang = cl.o === 0 ? Math.PI / 4 : -Math.PI / 4; }
    cl.pop = 0.3 + (i % R.cols) * 0.05 + Math.floor(i / R.cols) * 0.05;
  }
  mole.prog = [];
  mole.running = false;
  mole.runs = 0;
  mole.state = 'play';
  mole.t = 0;
  moleReset();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
// Pupu alkuun ja peilit alkuasentoon
function moleReset() {
  var b = mole.bunny, i, cl;
  b.c = mole.start.c; b.r = mole.start.r; b.fc = b.c; b.fr = b.r; b.hop = 0;
  for (i = 0; i < mole.grid.length; i++) {
    cl = mole.grid[i];
    if (cl.type === 'mirror' && cl.o !== cl.o0) {
      cl.o = cl.o0;
      cl.turnT = BEAM_TURN_T; cl.angFrom = cl.ang; cl.angTo = cl.ang - Math.PI / 2;
    }
  }
  mole.path = moleTrace().pts;
}

// ---------- Alustus ----------
function initMole() {
  var i;
  tasks = [makeTask(-5, 'math'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  mole.round = 0;
  mole.hits = 0;
  mole.state = 'intro';
  mole.t = 0;
  mole.R = MOLE_ROUNDS[0];
  mole.grid = [];
  mole.prog = [];
  mole.hitT = 0;
  mole.calmT = 0;
  mole.taskDelay = -1;
  renderBackground();
}
function respawnMole() {
  // Sydämet loppu: uusi rata samalle kierrokselle
  moleStartRound();
}
function resizeMole() { camX = 0; }

// ---------- Napit ----------
function moleSlotPos(i) {
  var R = mole.R || MOLE_ROUNDS[0], s = Math.min(viewH * 0.085, viewW * 0.56 / R.slots / 1.1);
  var x0 = viewW * 0.4 - (R.slots - 1) * s * 0.55;
  return { x: x0 + i * s * 1.1, y: viewH * 0.17, s: s };
}
function moleButtons() {
  var h = viewH, W = viewW, g = Math.min(h * 0.1, W * 0.06), bx = W * 0.84, by = h * 0.5;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    r: g * 0.44,
    play: { x: bx, y: h * 0.88, r: g * 0.52 },
    mult: [{ n: 2, x: bx - g * 0.7, y: h * 0.72 }, { n: 3, x: bx + g * 0.7, y: h * 0.72 }],
    mr: g * 0.34
  };
}
function moleKingPos() { return { x: viewW * 0.84, y: viewH * 0.14 }; }

function handleMoleTap(px, py) {
  if (mole.state !== 'play' || puzzleBusy() || celebrating || mole.running || mole.failT > 0) return;
  var b = moleButtons(), R = mole.R, i, p, last, k;
  for (i = 0; i < b.arrows.length; i++) {
    if (Math.hypot(px - b.arrows[i].x, py - b.arrows[i].y) < b.r * 1.25) {
      if (mole.prog.length >= R.slots) { moleBuzz(); return; }
      mole.prog.push({ dir: b.arrows[i].dir, n: 1, pop: 0.25 });
      playNote(523 + mole.prog.length * 35, 0, 0.1, 'triangle', 0.3);
      return;
    }
  }
  if (R.mult) {
    for (i = 0; i < b.mult.length; i++) {
      if (Math.hypot(px - b.mult[i].x, py - b.mult[i].y) < b.mr * 1.3) {
        last = mole.prog[mole.prog.length - 1];
        if (!last) { moleBuzz(); return; }
        last.n = last.n === b.mult[i].n ? 1 : b.mult[i].n;
        last.pop = 0.25;
        playNote(659 + last.n * 80, 0, 0.1, 'triangle', 0.3);
        return;
      }
    }
  }
  if (Math.hypot(px - b.play.x, py - b.play.y) < b.play.r * 1.3) {
    if (!mole.prog.length) { moleBuzz(); return; }
    mole.steps = [];
    for (i = 0; i < mole.prog.length; i++) for (k = 0; k < mole.prog[i].n; k++) mole.steps.push({ dir: mole.prog[i].dir, slot: i });
    moleReset();
    mole.running = true;
    mole.step = -1;
    mole.stepT = 0.25;
    mole.runs++;
    playNote(784, 0, 0.12, 'triangle', 0.35);
    playNote(988, 0.1, 0.16, 'triangle', 0.35);
    return;
  }
  for (i = 0; i < mole.prog.length; i++) {
    p = moleSlotPos(i);
    if (Math.abs(px - p.x) < p.s * 0.55 && Math.abs(py - p.y) < p.s * 0.6) {
      mole.prog.splice(i, 1);
      spawnSparkles(p.x, p.y, 5, '#c9b8e0');
      playNote(392, 0, 0.1, 'sine', 0.25);
      return;
    }
  }
  p = moleKingPos();
  if (Math.hypot(px - p.x, py - p.y) < viewH * 0.1) {
    mole.shakeK = 0.5;
    playNote(150, 0, 0.15, 'triangle', 0.25);
    playNote(120, 0.1, 0.15, 'triangle', 0.2);
  }
}
function moleBuzz() {
  mole.shakeT = 0.3;
  playNote(170, 0, 0.2, 'sawtooth', 0.15);
}
function moleFail(crash) {
  mole.running = false;
  mole.failT = 1.1;
  mole.crash = crash;
  mole.shakeT = 0.4;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
  loseHeart();
}

// ---------- Päivitys ----------
function updateMole(dt) {
  var busy, b = mole.bunny, i, cl, s, nc, nr, L;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  b.hop = Math.max(0, b.hop - dt * 4);
  b.fc += (b.c - b.fc) * Math.min(1, dt * 10);
  b.fr += (b.r - b.fr) * Math.min(1, dt * 10);
  if (mole.shakeT > 0) mole.shakeT -= dt;
  if (mole.shakeK > 0) mole.shakeK -= dt;
  if (mole.hitT > 0) mole.hitT -= dt;
  for (i = 0; i < mole.prog.length; i++) if (mole.prog[i].pop > 0) mole.prog[i].pop -= dt;
  for (i = 0; i < mole.grid.length; i++) {
    cl = mole.grid[i];
    if (cl.pop > 0) cl.pop = Math.max(0, cl.pop - dt);
    if (cl.wig > 0) cl.wig -= dt;
    if (cl.type === 'mirror' && cl.turnT > 0) {
      cl.turnT = Math.max(0, cl.turnT - dt);
      cl.ang = cl.angFrom + (cl.angTo - cl.angFrom) * easeOutBack(1 - cl.turnT / BEAM_TURN_T);
    }
  }
  if (mole.taskDelay > 0 && !busy) {
    mole.taskDelay -= dt;
    if (mole.taskDelay <= 0) {
      if (mole.hits === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (mole.hits === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  mole.t += dt;
  if (mole.state === 'intro') { if (mole.t > 0.8) moleStartRound(); return; }
  if (mole.state === 'hit') {
    if (mole.t > 2.4 && mole.taskDelay <= 0) {
      if (mole.hits >= MOLE_ROUNDS.length) { mole.state = 'won'; mole.t = 0; soundFanfare(); }
      else { mole.round++; moleStartRound(); }
    }
    return;
  }
  if (mole.state === 'won') {
    mole.calmT += dt;
    if (mole.calmT > 2.6) startCelebration();
    return;
  }
  if (mole.failT > 0) {
    mole.failT -= dt;
    if (mole.failT <= 0 && mole.state === 'play') moleReset();
    return;
  }
  if (!mole.running) return;
  L = moleLayout();
  mole.stepT -= dt;
  if (mole.stepT > 0) return;
  mole.stepT = MOLE_STEP_T;
  mole.step++;
  if (mole.step >= mole.steps.length) {
    // Ohjelma loppui: osuuko säde kiteeseen oikean värisenä?
    var tr = moleTrace();
    mole.running = false;
    if (tr.hit) moleHit(L);
    else moleFail(false);
    return;
  }
  s = mole.steps[mole.step];
  nc = b.c + BCODE_DIRS[s.dir][0]; nr = b.r + BCODE_DIRS[s.dir][1];
  if (s.dir === 1) b.facing = 1; else if (s.dir === 3) b.facing = -1;
  cl = moleCell(nc, nr);
  if (!moleWalkable(cl)) {
    b.fc = b.c + BCODE_DIRS[s.dir][0] * 0.3; b.fr = b.r + BCODE_DIRS[s.dir][1] * 0.3;
    moleFail(true);
    return;
  }
  b.c = nc; b.r = nr; b.hop = 1;
  playNote(600 + mole.step * 30, 0, 0.08, 'sine', 0.25);
  if (cl.type === 'mirror') {
    // Hyppy peilin päälle kääntää sen
    cl.o = 1 - cl.o;
    cl.turnT = BEAM_TURN_T; cl.angFrom = cl.ang; cl.angTo = cl.ang + Math.PI / 2;
    var cp = moleCellPos(nc, nr, L);
    artPop(cp.x, cp.y, L.cs * 0.4, '#dff4ff', 'ring');
    playNote(1320, 0.05, 0.08, 'triangle', 0.22);
    mole.path = moleTrace().pts;
  }
}
function moleHit(L) {
  var g = moleCellPos(mole.gem.c, mole.gem.r, L), k = moleKingPos();
  mole.state = 'hit';
  mole.t = 0;
  mole.hits++;
  mole.hitT = 1.4;
  artPop(g.x, g.y, L.cs * 0.8, PRISM_COLORS[moleCell(mole.gem.c, mole.gem.r).want], 'ring');
  spawnSparkles(g.x, g.y, 20, PRISM_COLORS[moleCell(mole.gem.c, mole.gem.r).want]);
  spawnSparkles(k.x, k.y, 24, '#fff2a0');
  artShakeStart(viewH * 0.01, 0.3);
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(1047, 0.1, 0.12, 'triangle', 0.35);
  playNote(1568, 0.22, 0.3, 'triangle', 0.35);
  if (mole.hits === 1 || mole.hits === 2) mole.taskDelay = 1.8;
}

// ---------- Piirto ----------
function renderMoleBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), x;
  g.addColorStop(0, '#9ab8c8');
  g.addColorStop(0.4, '#d0dcd0');
  g.addColorStop(1, '#a8c890');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = artMix('#88a878', '#d0dcd0', 0.4);
  b.beginPath(); b.moveTo(0, h * 0.34);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.3 - Math.sin(x / vw * 4 + 1) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Myyrän kumpu oikeassa yläkulmassa ja nappipaneeli
  artBlob(b, vw * 0.84, h * 0.23, h * 0.17, h * 0.07, '#8a6a4a', { lineColor: '#5a4030' });
  b.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(b, vw * 0.71, h * 0.33, vw * 0.27, h * 0.64, h * 0.04);
  b.fill();
}

// Myyräkuningas: pullea myyrä kruunu päässä; calm muuttaa sen iloiseksi ja värikkääksi
function drawMoleKing(c, x, y, s, calm, hits) {
  var sh = mole.shakeK > 0 ? Math.sin(globalT * 40) * s * 0.03 : 0, hurt = mole.hitT > 0;
  var fur = artMix('#6a5a5a', '#8a6a5a', calm);
  x += sh;
  artBlob(c, x, y + s * 0.2, s * 0.62, s * 0.55, fur, { lineColor: '#3a2a2a', hi: 0.2 });
  // Kädet
  artBlob(c, x - s * 0.55, y + s * 0.45, s * 0.2, s * 0.12, '#f0a8a8', { lineColor: '#a86a6a' });
  artBlob(c, x + s * 0.55, y + s * 0.45, s * 0.2, s * 0.12, '#f0a8a8', { lineColor: '#a86a6a' });
  // Kuono
  artBlob(c, x, y + s * 0.18, s * 0.2, s * 0.14, '#f0a8a8', { lineColor: '#a86a6a' });
  artCircle(c, x, y + s * 0.1, s * 0.06, '#c05a6a', { line: false });
  // Silmät: kiukkuiset sirrit, lopussa iloiset
  if (calm > 0.5 || hurt) {
    c.strokeStyle = '#2a1a1a';
    c.lineWidth = Math.max(2, s * 0.04);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x - s * 0.2, y - s * 0.05, s * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(x + s * 0.2, y - s * 0.05, s * 0.07, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    artEye(c, x - s * 0.2, y - s * 0.05, s * 0.06, 0, false);
    artEye(c, x + s * 0.2, y - s * 0.05, s * 0.06, 0, false);
    c.strokeStyle = '#2a1a1a';
    c.lineWidth = Math.max(2, s * 0.04);
    c.beginPath(); c.moveTo(x - s * 0.32, y - s * 0.17); c.lineTo(x - s * 0.12, y - s * 0.12); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.32, y - s * 0.17); c.lineTo(x + s * 0.12, y - s * 0.12); c.stroke();
  }
  if (calm > 0.5) { artBlush(c, x - s * 0.34, y + s * 0.1, s * 0.07); artBlush(c, x + s * 0.34, y + s * 0.1, s * 0.07); }
  // Kruunu ja kolme kidettä, jotka syttyvät osumista
  var ky = y - s * 0.42;
  c.beginPath();
  c.moveTo(x - s * 0.32, ky + s * 0.12); c.lineTo(x - s * 0.32, ky - s * 0.1); c.lineTo(x - s * 0.16, ky + s * 0.02);
  c.lineTo(x, ky - s * 0.16); c.lineTo(x + s * 0.16, ky + s * 0.02); c.lineTo(x + s * 0.32, ky - s * 0.1); c.lineTo(x + s * 0.32, ky + s * 0.12);
  c.closePath();
  artFillPath(c, '#ffd24f', ky - s * 0.16, ky + s * 0.12, s * 0.3, { lineColor: '#a8760a' });
  var gemCols = ['#ff5a5a', '#4ec85a', '#4a8cff'];
  for (var i = 0; i < 3; i++) {
    var gx = x + (i - 1) * s * 0.2, on = i < hits;
    if (on) artGlow(c, gx, ky + s * 0.03, s * 0.14, gemCols[i], 0.7);
    artCircle(c, gx, ky + s * 0.03, s * 0.055, on ? gemCols[i] : '#8a8a9a', { lineColor: '#5a5a6a' });
  }
}

function drawMoleGem(c, x, y, s, want, lit) {
  var col = PRISM_COLORS[want];
  artShadow(c, x, y + s * 0.35, s * 0.3, s * 0.07);
  artBlob(c, x, y + s * 0.25, s * 0.32, s * 0.12, '#8a6a4a', { lineColor: '#5a4030' });
  if (lit) artGlow(c, x, y - s * 0.05, s * 0.8, col, 0.7);
  c.beginPath();
  c.moveTo(x, y - s * 0.35); c.lineTo(x + s * 0.2, y - s * 0.05); c.lineTo(x, y + s * 0.22); c.lineTo(x - s * 0.2, y - s * 0.05); c.closePath();
  artFillPath(c, lit ? col : artMix(col, '#9a9aaa', 0.55), y - s * 0.35, y + s * 0.22, s * 0.2, { lineColor: artShade(col, -0.4) });
  // Värirengas kertoo, minkä värisen valon kide haluaa
  c.strokeStyle = col;
  c.lineWidth = Math.max(2, s * 0.05);
  c.setLineDash([s * 0.06, s * 0.05]);
  c.beginPath(); c.arc(x, y - s * 0.05, s * 0.36, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
}

function moleDrawRay(c, L) {
  var sp = moleSrcPos(L), pts = [{ x: sp.x + L.cs * 0.17, y: sp.y, col: 0 }], i, p, cc, w = L.cs, a, b, col;
  for (i = 0; i < mole.path.length; i++) {
    p = mole.path[i];
    cc = moleCellPos(p.c, p.r, L);
    if (p.end) cc = { x: cc.x - p.dx * L.cs * 0.32, y: cc.y - p.dy * L.cs * 0.32 };
    pts.push({ x: cc.x, y: cc.y, col: p.col });
  }
  var lastP = mole.path[mole.path.length - 1];
  if (lastP && !lastP.end && !lastP.gem) {
    cc = moleCellPos(lastP.c, lastP.r, L);
    var ddx = lastP.odx !== undefined ? lastP.odx : lastP.dx, ddy = lastP.ody !== undefined ? lastP.ody : lastP.dy;
    pts.push({ x: cc.x + ddx * L.cs * 0.8, y: cc.y + ddy * L.cs * 0.8, col: lastP.col });
  }
  c.lineCap = 'round';
  for (i = 1; i < pts.length; i++) {
    a = pts[i - 1]; b = pts[i];
    col = PRISM_COLORS[a.col];
    c.strokeStyle = artRGBA(col === '#ffffff' ? '#fff4b0' : col, 0.3);
    c.lineWidth = w * 0.2;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = artRGBA(col === '#ffffff' ? '#fffbe0' : col, 0.85);
    c.lineWidth = w * 0.08;
    c.stroke();
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, w * 0.025);
    c.stroke();
  }
}

function drawMole() {
  var c = ctx, R = mole.R, L, i, k, p, cl, b = moleButtons(), sh = mole.shakeT > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
  var calm = mole.state === 'won' ? Math.min(1, mole.calmT / 1.2) : 0, kp = moleKingPos();
  if (!beginPlayWorld()) return;
  drawMoleKing(c, kp.x, kp.y, viewH * 0.13, calm, mole.hits);
  if (mole.grid.length) {
    L = moleLayout();
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      cl = mole.grid[k * R.cols + i];
      p = moleCellPos(i, k, L);
      drawPrismTile(c, p.x, p.y, L.cs, cl, i + k);
    }
    moleDrawRay(c, L);
    // Kiteen ja kuninkaan välinen säde osumasta
    var gp = moleCellPos(mole.gem.c, mole.gem.r, L), gcl = moleCell(mole.gem.c, mole.gem.r);
    if (mole.state === 'hit' && mole.t < 1.4) {
      c.strokeStyle = artRGBA(PRISM_COLORS[gcl.want], 0.7);
      c.lineWidth = L.cs * 0.12;
      c.beginPath(); c.moveTo(gp.x, gp.y); c.lineTo(kp.x, kp.y - viewH * 0.07); c.stroke();
    }
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      cl = mole.grid[k * R.cols + i];
      if (cl.pop > 0.15) continue;
      p = moleCellPos(i, k, L);
      if (cl.type === 'mirror') {
        drawBeamMirror(c, p.x, p.y, L.cs, cl);
        // Tassunjälki kertoo: tähän voi hypätä
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.beginPath(); c.arc(p.x + L.cs * 0.3, p.y + L.cs * 0.3, L.cs * 0.06, 0, Math.PI * 2);
        c.arc(p.x + L.cs * 0.23, p.y + L.cs * 0.2, L.cs * 0.03, 0, Math.PI * 2); c.arc(p.x + L.cs * 0.37, p.y + L.cs * 0.2, L.cs * 0.03, 0, Math.PI * 2); c.fill();
      }
      else if (cl.type === 'rock') drawBeamRock(c, p.x, p.y, L.cs, cl);
      else if (cl.type === 'filter') drawPrismFilter(c, p.x, p.y, L.cs, cl);
      else if (cl.type === 'bush') drawBush(c, p.x, p.y + L.cs * 0.35, L.cs * 0.24);
      else if (cl.type === 'gem') drawMoleGem(c, p.x, p.y, L.cs, cl.want, moleTrace().hit);
    }
    // Aurinkokivi
    var sp = moleSrcPos(L);
    artGlow(c, sp.x, sp.y, L.cs * 0.6, '#fff4b0', 0.5);
    c.beginPath();
    c.moveTo(sp.x, sp.y - L.cs * 0.26); c.lineTo(sp.x + L.cs * 0.17, sp.y); c.lineTo(sp.x, sp.y + L.cs * 0.26); c.lineTo(sp.x - L.cs * 0.17, sp.y);
    c.closePath();
    artFillPath(c, '#fff4c0', sp.y - L.cs * 0.26, sp.y + L.cs * 0.26, L.cs * 0.2, { lineColor: '#c8a040' });
    // Pupu ja aloitusruudun rengas
    p = moleCellPos(mole.start.c, mole.start.r, L);
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.arc(p.x, p.y + L.cs * 0.28, L.cs * 0.28, 0, Math.PI * 2); c.fill();
    var bp = moleCellPos(mole.bunny.fc, mole.bunny.fr, L);
    c.save(); c.translate(bp.x, 0); c.scale(mole.bunny.facing, 1);
    drawBunny(c, 0, bp.y + L.cs * 0.33, L.cs * 0.25, Math.sin(mole.bunny.hop * Math.PI) * L.cs * 0.22, globalT * 3, false);
    c.restore();
    if (mole.failT > 0) {
      c.fillStyle = mole.crash ? '#ff5f5f' : '#8a2be2';
      c.font = 'bold ' + Math.round(L.cs * 0.5) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(mole.crash ? '!' : '?', bp.x, bp.y - L.cs * 0.55);
      c.textBaseline = 'alphabetic';
    }
    // Ohjelmarivi
    for (i = 0; i < R.slots; i++) {
      p = moleSlotPos(i);
      var cmd = mole.prog[i], active = mole.running && mole.steps[mole.step] && mole.steps[mole.step].slot === i;
      var ps = p.s * (cmd && cmd.pop > 0 ? 1 + cmd.pop * 0.6 : 1);
      c.fillStyle = active ? '#ffe27a' : (cmd ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)');
      roundRect(c, p.x - ps / 2 + sh, p.y - ps / 2, ps, ps, ps * 0.2);
      c.fill();
      if (cmd) {
        drawArrowGlyph(c, p.x + sh, p.y, ps * 0.3, cmd.dir, '#5a3a8a');
        if (cmd.n > 1) {
          artCircle(c, p.x + ps * 0.38 + sh, p.y - ps * 0.38, ps * 0.22, '#ff7bac', { lineColor: '#fff' });
          c.fillStyle = '#fff';
          c.font = 'bold ' + Math.round(ps * 0.3) + 'px ' + UI_FONT;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(cmd.n + '', p.x + ps * 0.38 + sh, p.y - ps * 0.36);
          c.textBaseline = 'alphabetic';
        }
      }
    }
    for (i = 0; i < b.arrows.length; i++) {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.arc(b.arrows[i].x, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
      artCircle(c, b.arrows[i].x, b.arrows[i].y, b.r, mole.running ? '#d8cce8' : '#ffffff', { lineColor: '#b8a8d8' });
      drawArrowGlyph(c, b.arrows[i].x, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, '#8a2be2');
    }
    if (R.mult) {
      for (i = 0; i < b.mult.length; i++) {
        var m = b.mult[i], lastC = mole.prog[mole.prog.length - 1], on = lastC && lastC.n === m.n;
        artCircle(c, m.x, m.y, b.mr, on ? '#ff7bac' : '#ffffff', { lineColor: '#d86a9a' });
        c.fillStyle = on ? '#fff' : '#d8508a';
        c.font = 'bold ' + Math.round(b.mr * 0.9) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('×' + m.n, m.x, m.y + b.mr * 0.05);
        c.textBaseline = 'alphabetic';
      }
    }
    var pulse = mole.prog.length && !mole.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
    artCircle(c, b.play.x, b.play.y, b.play.r * pulse, mole.running ? '#8fd06f' : '#3ccf6a', { lineColor: '#1f8a40' });
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(b.play.x - b.play.r * 0.3, b.play.y - b.play.r * 0.42);
    c.lineTo(b.play.x + b.play.r * 0.48, b.play.y);
    c.lineTo(b.play.x - b.play.r * 0.3, b.play.y + b.play.r * 0.42);
    c.closePath(); c.fill();
  }
  if (mole.state === 'won') {
    // Värit palaavat kummulle
    c.fillStyle = 'rgba(255,240,200,' + calm * 0.25 + ')';
    c.fillRect(0, 0, viewW, viewH);
    for (i = 0; i < 5; i++) drawFlower(c, viewW * (0.05 + i * 0.13), viewH * 0.97, viewH * 0.02 * calm, ['#ff7bac', '#ffd24f', '#b98aff', '#7fd4ff', '#8fe38f'][i]);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawHearts(c);
  drawTaskOverlay(c);
}

HUB_ICONS.mole = function (c, x, y, s) {
  artBlob(c, x, y + s * 0.12, s * 0.22, s * 0.08, '#8a6a4a', { lineColor: '#5a4030' });
  artBlob(c, x, y, s * 0.14, s * 0.13, '#6a5a5a', { lineColor: '#3a2a2a' });
  artBlob(c, x, y + s * 0.02, s * 0.05, s * 0.035, '#f0a8a8', { line: false });
  artEye(c, x - s * 0.05, y - s * 0.04, s * 0.02, 0, false);
  artEye(c, x + s * 0.05, y - s * 0.04, s * 0.02, 0, false);
  c.beginPath();
  c.moveTo(x - s * 0.08, y - s * 0.1); c.lineTo(x - s * 0.08, y - s * 0.17); c.lineTo(x - s * 0.04, y - s * 0.13);
  c.lineTo(x, y - s * 0.19); c.lineTo(x + s * 0.04, y - s * 0.13); c.lineTo(x + s * 0.08, y - s * 0.17); c.lineTo(x + s * 0.08, y - s * 0.1); c.closePath();
  artFillPath(c, '#ffd24f', y - s * 0.19, y - s * 0.1, s * 0.08, { lineColor: '#a8760a' });
};
