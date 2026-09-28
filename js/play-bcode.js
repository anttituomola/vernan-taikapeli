'use strict';

// Pupupolku (Kaukamaa, Porkkanakumpu): uusi verbi OHJELMOINTI. Laajennus
// reittitehtävästä (tasks-fair.js 'route'), josta palaute oli hyvää. Pupu
// odottaa niityllä: napauta nuolia ohjelmariville ja paina ▶, niin pupu hyppii
// ohjelman askel kerrallaan. Ohjelmarivin ruudun napautus poistaa sen. Pensas,
// reuna tai suljettu portti pysäyttää pupun ("!"), ja se palaa alkuun; ohjelma
// jää korjattavaksi. Kierros ratkeaa, kun pupu on kerännyt kaikki porkkanat ja
// ohjelma päättyy kotikoloon (ensimmäisellä kierroksella porkkanalle).
// Neljä arvottua, kovenevaa kierrosta: 5×5 yksi porkkana; kaksi porkkanaa ja
// kolo; avain ja portti sekä toistonapit (×2, ×3 kertaavat viimeisen nuolen),
// joita on pakko käyttää, koska rivi on lyhyempi kuin reitti; lopuksi kaikki
// yhdessä 7×6-ruudukossa. Jokainen rata tarkistetaan leveyshaulla ratkeavaksi.
// Ensimmäisellä ajolla onnistunut kierros antaa kultaisen porkkanan (bonus).
// Tehtävät 2. ja 3. kierroksen jälkeen (lasku, vähennys).

// cols × rows, carrots: porkkanoita, burrow: loppu koloon, key: avain + portti,
// mult: toistonapit, slots: ohjelmarivin pituus, len: lyhimmän reitin askeleet,
// bushes: pensaita
var BCODE_ROUNDS = [
  { cols: 5, rows: 5, carrots: 1, burrow: false, key: false, mult: false, slots: 8, len: [5, 8], bushes: 6 },
  { cols: 6, rows: 5, carrots: 2, burrow: true, key: false, mult: false, slots: 10, len: [8, 10], bushes: 8 },
  { cols: 6, rows: 6, carrots: 1, burrow: true, key: true, mult: true, slots: 7, len: [10, 14], bushes: 9 },
  { cols: 7, rows: 6, carrots: 2, burrow: true, key: true, mult: true, slots: 8, len: [12, 17], bushes: 11 }
];
var BCODE_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // ylös, oikea, alas, vasen
var BCODE_STEP_T = 0.42;  // askeleen kesto ajossa (s)
var BCODE_MAX_RUN = 3;    // toistonapin suurin kerroin

var bcode = {
  round: 0, state: 'intro', t: 0, R: null, grid: null, start: null, burrow: null, key: null, gate: null,
  carrots: [], prog: [], running: false, steps: [], step: -1, stepT: 0,
  bunny: { c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: 1 }, haveKey: false, got: 0,
  failT: 0, crash: false, runs: 0, gold: [], taskDelay: -1, hintT: 0, tapped: false, doneT: 0, wig: {}
};

// ---------- Arvonta ----------
function bcodeRand(n) { return Math.floor(Math.random() * n); }
function bcodeKey(c, r) { return c + ',' + r; }
// Leveyshaku tilassa (paikka, kerätyt porkkanat, avain): palauttaa lyhimmän reitin suuntina
function bcodeSolve(L, gateClosedWithoutKey) {
  var R = L.R, n = L.carrots.length, full = (1 << n) - 1, start = { c: L.start.c, r: L.start.r, m: 0, k: 0 };
  var q = [start], seen = {}, prev = {}, id, s, d, nc, nr, m, k, i, ns, nid, goal = null;
  function sid(o) { return o.c + ',' + o.r + ',' + o.m + ',' + o.k; }
  seen[sid(start)] = true;
  while (q.length) {
    s = q.shift();
    id = sid(s);
    if (s.m === full && (R.burrow ? (s.c === L.burrow.c && s.r === L.burrow.r) : true) && (n === 0 || s.m === full)) {
      if (!R.burrow || (s.c === L.burrow.c && s.r === L.burrow.r)) { goal = id; break; }
    }
    for (d = 0; d < 4; d++) {
      nc = s.c + BCODE_DIRS[d][0]; nr = s.r + BCODE_DIRS[d][1];
      if (nc < 0 || nr < 0 || nc >= R.cols || nr >= R.rows) continue;
      if (L.bush[bcodeKey(nc, nr)]) continue;
      k = s.k;
      if (L.gate && nc === L.gate.c && nr === L.gate.r && !k && gateClosedWithoutKey !== false) continue;
      if (L.key && nc === L.key.c && nr === L.key.r) k = 1;
      m = s.m;
      for (i = 0; i < n; i++) if (L.carrots[i].c === nc && L.carrots[i].r === nr) m |= 1 << i;
      ns = { c: nc, r: nr, m: m, k: k };
      nid = sid(ns);
      if (seen[nid]) continue;
      seen[nid] = true;
      prev[nid] = { from: id, d: d };
      q.push(ns);
    }
  }
  if (!goal) return null;
  var path = [];
  while (prev[goal]) { path.unshift(prev[goal].d); goal = prev[goal].from; }
  return path;
}
// Käskyjen määrä: peräkkäiset samat suunnat yhdeksi käskyksi (toistonapilla), enintään ×3
function bcodeCmdCount(path, mult) {
  if (!mult) return path.length;
  var n = 0, i = 0, run;
  while (i < path.length) {
    run = 1;
    while (i + run < path.length && path[i + run] === path[i] && run < BCODE_MAX_RUN) run++;
    n++;
    i += run;
  }
  return n;
}
function bcodeTurns(path) {
  var t = 0, i;
  for (i = 1; i < path.length; i++) if (path[i] !== path[i - 1]) t++;
  return t;
}
function bcodeGenerate(R) {
  var tries, L, i, free, cells, c, r, p, path, cmds;
  for (tries = 0; tries < 3000; tries++) {
    L = { R: R, bush: {}, carrots: [], start: null, burrow: null, key: null, gate: null };
    cells = [];
    for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) cells.push({ c: c, r: r });
    shuffleNums(cells);
    L.start = cells.pop();
    for (i = 0; i < R.carrots; i++) L.carrots.push(cells.pop());
    if (R.burrow) L.burrow = cells.pop();
    if (R.key) { L.key = cells.pop(); L.gate = cells.pop(); }
    for (i = 0; i < R.bushes && cells.length; i++) { p = cells.pop(); L.bush[bcodeKey(p.c, p.r)] = true; }
    path = bcodeSolve(L);
    if (!path) continue;
    if (path.length < R.len[0] || path.length > R.len[1]) continue;
    if (bcodeTurns(path) < 2) continue;
    cmds = bcodeCmdCount(path, R.mult);
    if (cmds > R.slots) continue;
    // Toistonapit on pakko käyttää: ilman niitä reitti ei mahdu riville
    if (R.mult && path.length <= R.slots) continue;
    if (R.key) {
      // Portin on oltava tarpeen: ilman avainta kolo ei aukea
      var noKey = { R: R, bush: L.bush, carrots: L.carrots, start: L.start, burrow: L.burrow, key: null, gate: L.gate };
      if (bcodeSolve(noKey)) continue;
    }
    L.solution = path;
    return L;
  }
  return L;
}

// ---------- Kierros ----------
function bcodeStartRound() {
  var R = BCODE_ROUNDS[bcode.round], L = bcodeGenerate(R), i;
  bcode.R = R;
  bcode.grid = L;
  bcode.start = L.start;
  bcode.burrow = L.burrow;
  bcode.key = L.key;
  bcode.gate = L.gate;
  bcode.carrots = [];
  for (i = 0; i < L.carrots.length; i++) bcode.carrots.push({ c: L.carrots[i].c, r: L.carrots[i].r, got: false, wig: 0 });
  bcode.prog = [];
  bcode.running = false;
  bcode.runs = 0;
  bcode.state = 'play';
  bcode.t = 0;
  bcodeResetBunny();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function bcodeResetBunny() {
  var b = bcode.bunny, i;
  b.c = bcode.start.c; b.r = bcode.start.r; b.fc = b.c; b.fr = b.r; b.hop = 0;
  bcode.haveKey = false;
  bcode.got = 0;
  for (i = 0; i < bcode.carrots.length; i++) bcode.carrots[i].got = false;
}

// ---------- Alustus ----------
function initBcode() {
  var i;
  tasks = [makeTask(-5, 'math'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  bcode.round = 0;
  bcode.state = 'intro';
  bcode.t = 0;
  bcode.R = BCODE_ROUNDS[0];
  bcode.grid = null;
  bcode.gold = [];
  bcode.taskDelay = -1;
  bcode.hintT = 0;
  bcode.tapped = false;
  bcode.prog = [];
  renderBackground();
}
function respawnBcode() { bcodeStartRound(); }
function resizeBcode() { camX = 0; }

// ---------- Asettelu ----------
function bcodeLayout() {
  var R = bcode.R || BCODE_ROUNDS[0], W = viewW, h = viewH;
  var areaW = W * 0.6, areaH = h * 0.68, cs = Math.min(areaW / R.cols, areaH / R.rows, h * 0.15);
  var ox = W * 0.38 - cs * R.cols / 2, oy = h * 0.27 + (areaH - cs * R.rows) / 2;
  return { cs: cs, ox: ox, oy: oy };
}
function bcodeCell(c, r, L) {
  L = L || bcodeLayout();
  return { x: L.ox + (c + 0.5) * L.cs, y: L.oy + (r + 0.5) * L.cs };
}
function bcodeSlotPos(i) {
  var R = bcode.R || BCODE_ROUNDS[0], s = Math.min(viewH * 0.085, viewW * 0.62 / R.slots / 1.1);
  var x0 = viewW * 0.38 - (R.slots - 1) * s * 0.55;
  return { x: x0 + i * s * 1.1, y: viewH * 0.15, s: s };
}
function bcodeButtons() {
  var h = viewH, W = viewW, g = Math.min(h * 0.12, W * 0.07), bx = W * 0.84, by = h * 0.4;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    r: g * 0.44,
    play: { x: bx, y: h * 0.84, r: g * 0.55 },
    mult: [{ n: 2, x: bx - g * 0.7, y: h * 0.66 }, { n: 3, x: bx + g * 0.7, y: h * 0.66 }],
    mr: g * 0.36
  };
}

// ---------- Napautus ----------
function handleBcodeTap(px, py) {
  if (bcode.state !== 'play' || puzzleBusy() || celebrating) return;
  var b = bcodeButtons(), i, p, R = bcode.R, L = bcodeLayout(), last;
  if (bcode.running) return;
  for (i = 0; i < b.arrows.length; i++) {
    if (Math.hypot(px - b.arrows[i].x, py - b.arrows[i].y) < b.r * 1.25) {
      bcode.tapped = true;
      if (bcode.prog.length >= R.slots) { bcodeBuzz(); return; }
      bcode.prog.push({ dir: b.arrows[i].dir, n: 1, pop: 0.25 });
      playNote(523 + bcode.prog.length * 35, 0, 0.1, 'triangle', 0.3);
      return;
    }
  }
  if (R.mult) {
    for (i = 0; i < b.mult.length; i++) {
      if (Math.hypot(px - b.mult[i].x, py - b.mult[i].y) < b.mr * 1.3) {
        last = bcode.prog[bcode.prog.length - 1];
        if (!last) { bcodeBuzz(); return; }
        last.n = last.n === b.mult[i].n ? 1 : b.mult[i].n;
        last.pop = 0.25;
        playNote(659 + last.n * 80, 0, 0.1, 'triangle', 0.3);
        playNote(880 + last.n * 80, 0.07, 0.1, 'triangle', 0.25);
        return;
      }
    }
  }
  if (Math.hypot(px - b.play.x, py - b.play.y) < b.play.r * 1.3) {
    if (!bcode.prog.length) { bcodeBuzz(); return; }
    bcodeRun();
    return;
  }
  // Ohjelmarivin ruutu: napautus poistaa sen
  for (i = 0; i < bcode.prog.length; i++) {
    p = bcodeSlotPos(i);
    if (Math.abs(px - p.x) < p.s * 0.55 && Math.abs(py - p.y) < p.s * 0.6) {
      bcode.prog.splice(i, 1);
      spawnSparkles(p.x, p.y, 5, '#c9b8e0');
      playNote(392, 0, 0.1, 'sine', 0.25);
      return;
    }
  }
  // Niityn asiat reagoivat
  var bp = bcodeCell(bcode.bunny.fc, bcode.bunny.fr, L);
  if (Math.hypot(px - bp.x, py - bp.y) < L.cs * 0.5) { bcode.bunny.hop = 1; playNote(880, 0, 0.08, 'sine', 0.25); return; }
  for (i = 0; i < bcode.carrots.length; i++) {
    p = bcodeCell(bcode.carrots[i].c, bcode.carrots[i].r, L);
    if (Math.hypot(px - p.x, py - p.y) < L.cs * 0.45) { bcode.carrots[i].wig = 0.5; playNote(740, 0, 0.08, 'sine', 0.2); return; }
  }
}
function bcodeBuzz() {
  bcode.shakeT = 0.3;
  playNote(170, 0, 0.2, 'sawtooth', 0.15);
}
function bcodeRun() {
  var i, k;
  bcode.steps = [];
  for (i = 0; i < bcode.prog.length; i++) for (k = 0; k < bcode.prog[i].n; k++) bcode.steps.push({ dir: bcode.prog[i].dir, slot: i });
  bcodeResetBunny();
  bcode.running = true;
  bcode.step = -1;
  bcode.stepT = 0.25;
  bcode.runs++;
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.1, 0.16, 'triangle', 0.35);
}
function bcodeBlocked(c, r) {
  var R = bcode.R;
  if (c < 0 || r < 0 || c >= R.cols || r >= R.rows) return true;
  if (bcode.grid.bush[bcodeKey(c, r)]) return true;
  if (bcode.gate && c === bcode.gate.c && r === bcode.gate.r && !bcode.haveKey) return true;
  return false;
}
function bcodeFail(crash) {
  bcode.running = false;
  bcode.failT = 1.0;
  bcode.crash = crash;
  bcode.shakeT = 0.4;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
}
function bcodeAtGoal() {
  var b = bcode.bunny;
  if (bcode.got < bcode.carrots.length) return false;
  if (bcode.burrow) return b.c === bcode.burrow.c && b.r === bcode.burrow.r;
  return true;
}

// ---------- Päivitys ----------
function updateBcode(dt) {
  var busy, b = bcode.bunny, i, L, s, nc, nr;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  b.hop = Math.max(0, b.hop - dt * 4);
  b.fc += (b.c - b.fc) * Math.min(1, dt * 10);
  b.fr += (b.r - b.fr) * Math.min(1, dt * 10);
  if (bcode.shakeT > 0) bcode.shakeT -= dt;
  for (i = 0; i < bcode.prog.length; i++) if (bcode.prog[i].pop > 0) bcode.prog[i].pop -= dt;
  for (i = 0; i < bcode.carrots.length; i++) if (bcode.carrots[i].wig > 0) bcode.carrots[i].wig -= dt;
  if (bcode.taskDelay > 0 && !busy) {
    bcode.taskDelay -= dt;
    if (bcode.taskDelay <= 0) {
      if (bcode.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (bcode.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  bcode.t += dt;
  if (bcode.state === 'intro') { if (bcode.t > 0.6) bcodeStartRound(); return; }
  if (bcode.state === 'roundDone') {
    if (bcode.t > 2.0 && bcode.taskDelay <= 0) {
      bcode.round++;
      if (bcode.round >= BCODE_ROUNDS.length) { bcode.state = 'won'; bcode.t = 0; soundFanfare(); }
      else bcodeStartRound();
    }
    return;
  }
  if (bcode.state === 'won') { if (bcode.t > 1.4) startCelebration(); return; }
  if (!bcode.tapped) bcode.hintT += dt;
  if (bcode.failT > 0) {
    bcode.failT -= dt;
    if (bcode.failT <= 0) bcodeResetBunny();
  }
  if (!bcode.running) return;
  L = bcodeLayout();
  bcode.stepT -= dt;
  if (bcode.stepT > 0) return;
  bcode.stepT = BCODE_STEP_T;
  bcode.step++;
  if (bcode.step >= bcode.steps.length) {
    if (bcodeAtGoal()) bcodeRoundDone(L);
    else bcodeFail(false);
    return;
  }
  s = bcode.steps[bcode.step];
  nc = b.c + BCODE_DIRS[s.dir][0]; nr = b.r + BCODE_DIRS[s.dir][1];
  if (s.dir === 1) b.facing = 1; else if (s.dir === 3) b.facing = -1;
  if (bcodeBlocked(nc, nr)) {
    // Törmäys: pupu nytkähtää kohti estettä
    b.fc = b.c + BCODE_DIRS[s.dir][0] * 0.3; b.fr = b.r + BCODE_DIRS[s.dir][1] * 0.3;
    bcodeFail(true);
    return;
  }
  b.c = nc; b.r = nr; b.hop = 1;
  playNote(600 + bcode.step * 30, 0, 0.08, 'sine', 0.25);
  var cp = bcodeCell(nc, nr, L);
  if (bcode.key && !bcode.haveKey && nc === bcode.key.c && nr === bcode.key.r) {
    bcode.haveKey = true;
    artPop(cp.x, cp.y, L.cs * 0.4, '#ffd24f', 'burst');
    playNote(1175, 0, 0.1, 'triangle', 0.3);
    playNote(1568, 0.08, 0.14, 'triangle', 0.3);
    var gp = bcodeCell(bcode.gate.c, bcode.gate.r, L);
    spawnSparkles(gp.x, gp.y, 12, '#ffd24f');
  }
  for (i = 0; i < bcode.carrots.length; i++) {
    var ca = bcode.carrots[i];
    if (!ca.got && ca.c === nc && ca.r === nr) {
      ca.got = true;
      bcode.got++;
      artPop(cp.x, cp.y, L.cs * 0.4, '#ff8f3a', 'burst');
      spawnSparkles(cp.x, cp.y, 10, '#ff8f3a');
      playNote(988 + bcode.got * 60, 0, 0.1, 'sine', 0.3);
    }
  }
  // Ensimmäisellä kierroksella porkkanalle pääsy riittää heti
  if (!bcode.burrow && bcodeAtGoal()) bcodeRoundDone(L);
}
function bcodeRoundDone(L) {
  var p = bcodeCell(bcode.bunny.c, bcode.bunny.r, L);
  bcode.running = false;
  bcode.state = 'roundDone';
  bcode.t = 0;
  bcode.gold[bcode.round] = bcode.runs === 1;
  artPop(p.x, p.y, L.cs * 0.8, '#ffe27a', 'ring');
  spawnSparkles(p.x, p.y, 22, bcode.runs === 1 ? '#ffd24f' : '#ffe27a');
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (bcode.runs === 1) playNote(1760, 0.45, 0.3, 'sine', 0.3);
  if (bcode.round === 1 || bcode.round === 2) bcode.taskDelay = 1.6;
}

// ---------- Piirto ----------
function renderBcodeBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#8fd8ff');
  g.addColorStop(0.5, '#d8f4ff');
  g.addColorStop(1, '#fff4d8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.1, h * 0.1, h * 0.05, 0.1);
  // Kummut
  b.fillStyle = artMix('#7fcf6a', '#d8f4ff', 0.4);
  b.beginPath(); b.moveTo(0, h * 0.4);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.34 - Math.sin(x / vw * 5 + 1) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = '#8fdc6f';
  b.beginPath(); b.moveTo(0, h * 0.5);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.46 - Math.sin(x / vw * 3.4) * 0.03));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Oikean paneelin tausta
  b.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(b, vw * 0.7, h * 0.22, vw * 0.28, h * 0.74, h * 0.04);
  b.fill();
  for (i = 0; i < 6; i++) drawFlower(b, vw * (0.03 + i * 0.12), h * 0.97, h * 0.012, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}

function drawBcodeBurrow(c, x, y, s) {
  artBlob(c, x, y + s * 0.15, s * 0.8, s * 0.45, '#b07840', { lineColor: '#6a4a28', hi: 0.2 });
  artBlob(c, x, y + s * 0.25, s * 0.42, s * 0.3, '#3a2418', { line: false });
  artBlob(c, x - s * 0.55, y - s * 0.12, s * 0.12, s * 0.08, '#5fbf55', { line: false });
  artBlob(c, x + s * 0.5, y - s * 0.15, s * 0.14, s * 0.08, '#5fbf55', { line: false });
}
function drawBcodeKey(c, x, y, s) {
  artGlow(c, x, y, s * 1.4, '#ffe27a', 0.4 + Math.sin(globalT * 4) * 0.15);
  c.strokeStyle = '#c08a10';
  c.lineWidth = Math.max(2, s * 0.22);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - s * 0.1, y); c.lineTo(x + s * 0.8, y); c.moveTo(x + s * 0.55, y); c.lineTo(x + s * 0.55, y + s * 0.3); c.moveTo(x + s * 0.8, y); c.lineTo(x + s * 0.8, y + s * 0.35); c.stroke();
  artCircle(c, x - s * 0.35, y, s * 0.32, '#ffd24f', { lineColor: '#c08a10' });
  artCircle(c, x - s * 0.35, y, s * 0.12, '#fff4c0', { line: false });
}
function drawBcodeGate(c, x, y, s, open) {
  var i;
  if (open) {
    c.globalAlpha = 0.35;
  }
  for (i = -1; i <= 1; i++) artRoundRect(c, x + i * s * 0.35 - s * 0.08, y - s * 0.5, s * 0.16, s * 0.9, s * 0.06, '#c89060', { lineColor: '#6a4a28' });
  artRoundRect(c, x - s * 0.55, y - s * 0.3, s * 1.1, s * 0.14, s * 0.05, '#b07840', { lineColor: '#6a4a28' });
  artRoundRect(c, x - s * 0.55, y + s * 0.1, s * 1.1, s * 0.14, s * 0.05, '#b07840', { lineColor: '#6a4a28' });
  if (!open) {
    artRoundRect(c, x - s * 0.18, y - s * 0.12, s * 0.36, s * 0.3, s * 0.06, '#ffd24f', { lineColor: '#8a5a10' });
    c.strokeStyle = '#8a5a10';
    c.lineWidth = Math.max(2, s * 0.07);
    c.beginPath(); c.arc(x, y - s * 0.12, s * 0.12, Math.PI, 0); c.stroke();
  }
  c.globalAlpha = 1;
}

function drawBcode() {
  var c = ctx, L, R = bcode.R, i, k, p, b = bcodeButtons(), sh = bcode.shakeT > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
  if (!beginPlayWorld()) return;
  if (bcode.grid) {
    L = bcodeLayout();
    // Niitty ruutuina
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      p = bcodeCell(i, k, L);
      artRoundRect(c, p.x - L.cs * 0.47, p.y - L.cs * 0.47, L.cs * 0.94, L.cs * 0.94, L.cs * 0.12, (i + k) % 2 ? '#9fdc7f' : '#8fd06f', { lineColor: '#5a9a4a', line: Math.max(1, L.cs * 0.02) });
    }
    p = bcodeCell(bcode.start.c, bcode.start.r, L);
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.arc(p.x, p.y + L.cs * 0.28, L.cs * 0.3, 0, Math.PI * 2); c.fill();
    if (bcode.burrow) { p = bcodeCell(bcode.burrow.c, bcode.burrow.r, L); drawBcodeBurrow(c, p.x, p.y, L.cs * 0.4); }
    if (bcode.gate) { p = bcodeCell(bcode.gate.c, bcode.gate.r, L); drawBcodeGate(c, p.x, p.y, L.cs * 0.42, bcode.haveKey); }
    if (bcode.key && !bcode.haveKey) { p = bcodeCell(bcode.key.c, bcode.key.r, L); drawBcodeKey(c, p.x, p.y, L.cs * 0.22); }
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      if (!bcode.grid.bush[bcodeKey(i, k)]) continue;
      p = bcodeCell(i, k, L);
      drawBush(c, p.x, p.y + L.cs * 0.35, L.cs * 0.25);
    }
    for (i = 0; i < bcode.carrots.length; i++) {
      var ca = bcode.carrots[i];
      if (ca.got) continue;
      p = bcodeCell(ca.c, ca.r, L);
      c.save(); c.translate(p.x, p.y); c.rotate(ca.wig > 0 ? Math.sin(globalT * 30) * 0.2 : Math.sin(globalT * 2 + i) * 0.05);
      drawCarrotGlyph(c, 0, -L.cs * 0.1, L.cs * 0.26);
      c.restore();
    }
    // Pupu
    var bp = bcodeCell(bcode.bunny.fc, bcode.bunny.fr, L);
    c.save();
    c.translate(bp.x, 0);
    c.scale(bcode.bunny.facing, 1);
    drawBunny(c, 0, bp.y + L.cs * 0.33, L.cs * 0.26, Math.sin(bcode.bunny.hop * Math.PI) * L.cs * 0.22, globalT * 3, false);
    c.restore();
    if (bcode.haveKey) drawBcodeKey(c, bp.x + L.cs * 0.25, bp.y - L.cs * 0.25, L.cs * 0.1);
    if (bcode.failT > 0) {
      c.fillStyle = bcode.crash ? '#ff5f5f' : '#8a2be2';
      c.font = 'bold ' + Math.round(L.cs * 0.5) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(bcode.crash ? '!' : '?', bp.x, bp.y - L.cs * 0.55);
      c.textBaseline = 'alphabetic';
    }
    // Ohjelmarivi
    for (i = 0; i < R.slots; i++) {
      p = bcodeSlotPos(i);
      var cmd = bcode.prog[i], active = bcode.running && bcode.steps[bcode.step] && bcode.steps[bcode.step].slot === i;
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
    // Napit
    for (i = 0; i < b.arrows.length; i++) {
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath(); c.arc(b.arrows[i].x, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
      artCircle(c, b.arrows[i].x, b.arrows[i].y, b.r, bcode.running ? '#d8cce8' : '#ffffff', { lineColor: '#b8a8d8' });
      drawArrowGlyph(c, b.arrows[i].x, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, '#8a2be2');
    }
    if (R.mult) {
      for (i = 0; i < b.mult.length; i++) {
        var m = b.mult[i], lastC = bcode.prog[bcode.prog.length - 1], on = lastC && lastC.n === m.n;
        artCircle(c, m.x, m.y, b.mr, on ? '#ff7bac' : '#ffffff', { lineColor: '#d86a9a' });
        c.fillStyle = on ? '#fff' : '#d8508a';
        c.font = 'bold ' + Math.round(b.mr * 0.9) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('×' + m.n, m.x, m.y + b.mr * 0.05);
        c.textBaseline = 'alphabetic';
      }
    }
    var pulse = bcode.prog.length && !bcode.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
    artCircle(c, b.play.x, b.play.y, b.play.r * pulse, bcode.running ? '#8fd06f' : '#3ccf6a', { lineColor: '#1f8a40' });
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(b.play.x - b.play.r * 0.3, b.play.y - b.play.r * 0.42);
    c.lineTo(b.play.x + b.play.r * 0.48, b.play.y);
    c.lineTo(b.play.x - b.play.r * 0.3, b.play.y + b.play.r * 0.42);
    c.closePath(); c.fill();
    // Vihje ensimmäisellä kierroksella: käsi näyttää kaksi ensimmäistä nuolta, ja kun
    // rivillä on koko reitin verran käskyjä, ▶:n. Loput lapsi päättelee itse.
    var sol = bcode.grid.solution || [];
    if (bcode.round === 0 && bcode.state === 'play' && !bcode.running && bcode.runs === 0 && (bcode.hintT > 1.5 || bcode.prog.length)) {
      var tgt = null;
      if (bcode.prog.length < 2 && !bcode.prog.some(function (q, qi) { return q.dir !== sol[qi]; })) tgt = b.arrows[sol[bcode.prog.length]];
      else if (bcode.prog.length >= sol.length) tgt = b.play;
      if (tgt) {
        var hk = (globalT % 1.2) / 1.2;
        drawHand(c, tgt.x + viewH * 0.01, tgt.y + viewH * 0.02 + Math.abs(Math.sin(hk * Math.PI)) * viewH * 0.03, viewH * 0.04);
      }
    }
  }
  drawPrincessFree(c, viewW * 0.05, viewH * 0.93, viewH / 560, 1, 0, false, globalT);
  drawParticlesLayer(c);
  endPlayWorld();
  drawBcodeHud(c);
  drawTaskOverlay(c);
}

// HUD: kierrokset porkkanoina; kultainen = onnistui ensimmäisellä ajolla
function drawBcodeHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = BCODE_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.6 * n + hs * 1.2, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < bcode.round || bcode.state === 'won' || (i === bcode.round && bcode.state === 'roundDone');
    var x = left + hs * 1.9 + i * hs * 2.6, y = pad * 0.5 + hs * 1.6;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && bcode.gold[i]) artGlow(c, x, y, hs * 1.6, '#ffd24f', 0.7);
    drawCarrotGlyph(c, x, y - hs * 0.2, hs * 0.9);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.bcode = function (c, x, y, s) {
  var i;
  for (i = 0; i < 3; i++) {
    c.fillStyle = i === 1 ? '#ffe27a' : 'rgba(255,255,255,0.9)';
    roundRect(c, x - s * 0.24 + i * s * 0.17, y - s * 0.28, s * 0.14, s * 0.14, s * 0.03);
    c.fill();
    drawArrowGlyph(c, x - s * 0.17 + i * s * 0.17, y - s * 0.21, s * 0.04, i === 2 ? 2 : 1, '#5a3a8a');
  }
  drawBunny(c, x - s * 0.08, y + s * 0.14, s * 0.1, 0, 0, false);
  drawCarrotGlyph(c, x + s * 0.16, y + s * 0.02, s * 0.07);
};

// Porkkanakummun sokkelon maasto: porkkanan naatit, kukat ja pupunjäljet
HUB_TILE_DECOR.carrot = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.8;
  if (rnd < 0.22) {
    drawCarrotGlyph(b, bx, by - s * 0.12, s * 0.1);
  } else if (rnd < 0.36) {
    drawFlower(b, bx, by - s * 0.1, s * 0.05, rnd2 < 0.5 ? '#ff7bac' : '#ffd24f');
  } else if (rnd < 0.46) {
    b.fillStyle = 'rgba(90,140,70,0.35)';
    b.beginPath(); b.arc(bx - s * 0.05, by - s * 0.05, s * 0.03, 0, Math.PI * 2); b.arc(bx + s * 0.05, by - s * 0.02, s * 0.03, 0, Math.PI * 2); b.fill();
  }
};
