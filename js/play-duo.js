'use strict';

// Yhteispolku (Kaukamaa, Porkkanakumpu): YHTEISPELI kahdelle (lapsi + aikuinen)
// samalla tabletilla. Kaksi pupua samalla niityllä: vasemman puolen pelaaja
// ohjelmoi pinkin pupun, oikean puolen pelaaja sinisen. ▶ ajaa molemmat
// ohjelmat yhtä aikaa, askel kerrallaan. Niittyä halkoo pensasaita, jossa on
// portti; portti on auki vain, kun toinen pupu seisoo samanvärisellä laatalla.
// Pupujen on siis autettava toisiaan: toinen odottaa laatalla (⏸), kun toinen
// kulkee portista. Pupu pysähtyy (!), jos se törmää pensaaseen, reunaan,
// suljettuun porttiin tai toiseen pupuun (samaan ruutuun tai ristiin).
// Kierros onnistuu, kun molemmat ovat omassa kolossaan ja porkkanat on kerätty.
// Neljä arvottua, kovenevaa kierrosta: yksi aita ja laatta; laatta aidan
// kummallakin puolella ja molemmat kolot takana; kaksi aitaa ja kaksi porttia;
// kaksi aitaa ja neljä laattaa, molemmat kolot takimmaisena. Jokainen rata ratkaistaan
// yhteisellä leveyshaulla (molempien pupujen paikat), joten se ratkeaa aina.
// Ensimmäisellä ajolla onnistunut kierros antaa kultaisen porkkanan.
// Ei sydämiä. Tehtävä toisen kierroksen jälkeen: parit (kahdestaan).

// walls: aitojen määrä; plates[w]: aidan w laatat ('n' = lähtöpuolella,
// 'f' = takana); homeB: sinisen kolon alue ('near', 'mid', 'far');
// slots: ohjelmarivin pituus per pupu; len: yhteisen ratkaisun askeleet
var DUO_ROUNDS = [
  { cols: 6, rows: 5, walls: 1, plates: [['n']], homeB: 'near', carrots: 0, slots: 8, len: [4, 8], bushes: 2 },
  { cols: 7, rows: 5, walls: 1, plates: [['n', 'f']], homeB: 'far', carrots: 1, slots: 10, len: [6, 10], bushes: 3 },
  { cols: 8, rows: 5, walls: 2, plates: [['n', 'f'], ['n']], homeB: 'mid', carrots: 1, slots: 12, len: [8, 12], bushes: 2 },
  { cols: 8, rows: 5, walls: 2, plates: [['n', 'f'], ['n', 'f']], homeB: 'far', carrots: 1, slots: 14, len: [10, 14], bushes: 2 }
];
var DUO_WAIT = 4;
var DUO_STEP_T = 0.5;
var DUO_PCOL = ['#ff7bac', '#5fa8ff'];          // pupujen värit: pinkki (vasen), sininen (oikea)
var DUO_GCOL = ['#ffc23a', '#b05aff'];          // porttien ja laattojen värit

var duo = {
  round: 0, state: 'intro', t: 0, R: null, L: null, prog: [[], []], running: false, step: -1, stepT: 0, steps: 0,
  b: [{ c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: 1, fail: false }, { c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: -1, fail: false }],
  carrots: [], got: 0, failT: 0, runs: 0, gold: [], taskDelay: -1, hintT: 0, tapped: false, shakeT: [0, 0], open: []
};

// ---------- Säännöt ----------
function duoKey(c, r) { return c + ',' + r; }
function duoMove(L, p, d) {
  if (d === DUO_WAIT) return { c: p.c, r: p.r };
  return { c: p.c + BCODE_DIRS[d][0], r: p.r + BCODE_DIRS[d][1] };
}
function duoGateAt(L, p) {
  var i;
  for (i = 0; i < L.gates.length; i++) if (L.gates[i].c === p.c && L.gates[i].r === p.r) return i;
  return -1;
}
function duoOnPlate(L, p, g) {
  var i;
  for (i = 0; i < L.plates.length; i++) if (L.plates[i].g === g && L.plates[i].c === p.c && L.plates[i].r === p.r) return true;
  return false;
}
// Yksi yhteinen askel. Palauttaa uudet paikat ja kummankin epäonnistumisen
// (null | 'crash' = pensas/reuna, 'gate' = suljettu portti, 'bump' = toinen pupu).
function duoStep(L, a, b, da, db) {
  var na = duoMove(L, a, da), nb = duoMove(L, b, db), fa = null, fb = null, g;
  if (na.c < 0 || na.r < 0 || na.c >= L.cols || na.r >= L.rows || L.bush[duoKey(na.c, na.r)]) { fa = 'crash'; na = { c: a.c, r: a.r }; }
  if (nb.c < 0 || nb.r < 0 || nb.c >= L.cols || nb.r >= L.rows || L.bush[duoKey(nb.c, nb.r)]) { fb = 'crash'; nb = { c: b.c, r: b.r }; }
  // Portti: auki, kun toinen pupu on (askeleen jälkeen) samanvärisellä laatalla
  g = duoGateAt(L, na);
  if (!fa && g >= 0 && (na.c !== a.c || na.r !== a.r) && !duoOnPlate(L, nb, g)) { fa = 'gate'; na = { c: a.c, r: a.r }; }
  g = duoGateAt(L, nb);
  if (!fb && g >= 0 && (nb.c !== b.c || nb.r !== b.r) && !duoOnPlate(L, na, g)) { fb = 'gate'; nb = { c: b.c, r: b.r }; }
  // Törmäys toiseen pupuun: samaan ruutuun tai ristiin
  if ((na.c === nb.c && na.r === nb.r) || (na.c === b.c && na.r === b.r && nb.c === a.c && nb.r === a.r)) {
    if (!fa) fa = 'bump';
    if (!fb) fb = 'bump';
  }
  return { a: na, b: nb, fa: fa, fb: fb };
}
// Yhteinen leveyshaku tilassa (pinkin paikka, sinisen paikka, porkkanat).
// Tila on numero ((a * solut + b) * porkkanamaskit + m). Palauttaa askelparit
// [[da, db], ...] tai null.
function duoSolve(L, maxLen) {
  var n = L.carrots.length, M = 1 << n, full = M - 1, NC = L.cols * L.rows, total = NC * NC * M;
  var prev = new Int32Array(total), act = new Uint8Array(total), depth = new Uint8Array(total), q = new Int32Array(total);
  var head = 0, tail = 0, id, ai, bi, m, da, db, st, k, nid, goal = -1, a, b, carrotAt = {}, hA, hB;
  for (k = 0; k < total; k++) prev[k] = -2;
  for (k = 0; k < n; k++) carrotAt[L.carrots[k].c + L.carrots[k].r * L.cols] = k;
  hA = L.home[0].c + L.home[0].r * L.cols;
  hB = L.home[1].c + L.home[1].r * L.cols;
  id = ((L.start[0].c + L.start[0].r * L.cols) * NC + L.start[1].c + L.start[1].r * L.cols) * M;
  prev[id] = -1;
  q[tail++] = id;
  while (head < tail) {
    id = q[head++];
    m = id % M;
    bi = Math.floor(id / M) % NC;
    ai = Math.floor(id / M / NC);
    if (m === full && ai === hA && bi === hB) { goal = id; break; }
    if (depth[id] >= maxLen) continue;
    a = { c: ai % L.cols, r: Math.floor(ai / L.cols) };
    b = { c: bi % L.cols, r: Math.floor(bi / L.cols) };
    for (da = 0; da < 5; da++) for (db = 0; db < 5; db++) {
      if (da === DUO_WAIT && db === DUO_WAIT) continue;
      st = duoStep(L, a, b, da, db);
      if (st.fa || st.fb) continue;
      var na = st.a.c + st.a.r * L.cols, nb = st.b.c + st.b.r * L.cols, nm = m;
      if (carrotAt[na] !== undefined) nm |= 1 << carrotAt[na];
      if (carrotAt[nb] !== undefined) nm |= 1 << carrotAt[nb];
      nid = (na * NC + nb) * M + nm;
      if (prev[nid] !== -2) continue;
      prev[nid] = id;
      act[nid] = da * 5 + db;
      depth[nid] = depth[id] + 1;
      q[tail++] = nid;
    }
  }
  if (goal < 0) return null;
  var path = [];
  while (prev[goal] >= 0) { path.unshift([Math.floor(act[goal] / 5), act[goal] % 5]); goal = prev[goal]; }
  return path;
}

// ---------- Arvonta ----------
function duoRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function duoTryGenerate(R) {
  var L = { cols: R.cols, rows: R.rows, bush: {}, gates: [], plates: [], carrots: [], start: [], home: [], wallCols: [] }, used = {};
  var i, w, c, r, col, regions = [], free, p, k, sol, progs;
  // Aidat: pensassarakkeet, joissa yksi portti
  if (R.walls === 1) L.wallCols = [duoRandInt(2, R.cols - 3)];
  else { col = duoRandInt(2, R.cols - 5); L.wallCols = [col, duoRandInt(col + 2, R.cols - 3)]; }
  for (w = 0; w < L.wallCols.length; w++) {
    var gr = duoRandInt(0, R.rows - 1);
    for (r = 0; r < R.rows; r++) {
      if (r === gr) { L.gates.push({ c: L.wallCols[w], r: r, g: w }); used[duoKey(L.wallCols[w], r)] = true; }
      else { L.bush[duoKey(L.wallCols[w], r)] = true; used[duoKey(L.wallCols[w], r)] = true; }
    }
  }
  // Alueet aitojen välissä
  for (k = 0; k <= L.wallCols.length; k++) regions.push([]);
  for (c = 0; c < R.cols; c++) {
    if (L.wallCols.indexOf(c) >= 0) continue;
    for (k = 0; k < L.wallCols.length && c > L.wallCols[k]; k++);
    for (r = 0; r < R.rows; r++) regions[k].push({ c: c, r: r });
  }
  function pick(reg) {
    var list = regions[reg].filter(function (q) { return !used[duoKey(q.c, q.r)]; }), q;
    if (!list.length) return null;
    q = list[Math.floor(Math.random() * list.length)];
    used[duoKey(q.c, q.r)] = true;
    return { c: q.c, r: q.r };
  }
  var last = L.wallCols.length;
  L.start.push(pick(0)); L.start.push(pick(0));
  L.home.push(pick(last));
  L.home.push(pick(R.homeB === 'near' ? 0 : R.homeB === 'mid' ? 1 : last));
  for (w = 0; w < R.plates.length; w++) {
    for (k = 0; k < R.plates[w].length; k++) {
      p = pick(R.plates[w][k] === 'n' ? w : w + 1);
      if (!p) return null;
      p.g = w;
      L.plates.push(p);
    }
  }
  for (i = 0; i < R.carrots; i++) { p = pick(duoRandInt(0, last)); if (!p) return null; L.carrots.push(p); }
  // Hämäyspensaat eivät saa tukkia porttien eteen
  for (i = 0; i < R.bushes; i++) {
    p = pick(duoRandInt(0, last));
    if (!p) continue;
    for (k = 0; k < L.gates.length && p; k++) if (Math.abs(p.c - L.gates[k].c) === 1 && p.r === L.gates[k].r) p = null;
    if (p) L.bush[duoKey(p.c, p.r)] = true;
  }
  for (i = 0; i < 2; i++) if (!L.start[i] || !L.home[i]) return null;
  sol = duoSolve(L, R.len[1]);
  if (!sol || sol.length < R.len[0] || sol.length > R.slots) return null;
  // Ohjelmat ratkaisusta (lopun odotukset pois); kummallakin tekemistä
  progs = [[], []];
  for (i = 0; i < sol.length; i++) { progs[0].push(sol[i][0]); progs[1].push(sol[i][1]); }
  for (k = 0; k < 2; k++) {
    while (progs[k].length && progs[k][progs[k].length - 1] === DUO_WAIT) progs[k].pop();
    if (progs[k].filter(function (d) { return d !== DUO_WAIT; }).length < 2) return null;
  }
  // Yhteistyö on pakollista: jonkun on odotettava (pelkät nuolet eivät riitä)
  if (progs[0].indexOf(DUO_WAIT) < 0 && progs[1].indexOf(DUO_WAIT) < 0) return null;
  L.solution = progs;
  return L;
}
function duoGenerate(R) {
  var i, L;
  for (i = 0; i < 4000; i++) {
    L = duoTryGenerate(R);
    if (L) return L;
  }
  return null;
}

// ---------- Kierros ----------
function duoStartRound() {
  var R = DUO_ROUNDS[duo.round], i;
  duo.R = R;
  duo.L = duoGenerate(R);
  duo.carrots = [];
  for (i = 0; i < duo.L.carrots.length; i++) duo.carrots.push({ c: duo.L.carrots[i].c, r: duo.L.carrots[i].r, got: false, wig: 0 });
  duo.prog = [[], []];
  duo.running = false;
  duo.runs = 0;
  duo.state = 'play';
  duo.t = 0;
  duo.hintT = 0;
  duoResetBunnies();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function duoResetBunnies() {
  var i, b;
  for (i = 0; i < 2; i++) {
    b = duo.b[i];
    b.c = duo.L.start[i].c; b.r = duo.L.start[i].r; b.fc = b.c; b.fr = b.r; b.hop = 0; b.fail = false;
    b.facing = i === 0 ? 1 : -1;
  }
  duo.got = 0;
  duo.open = [false, false];
  for (i = 0; i < duo.carrots.length; i++) duo.carrots[i].got = false;
}

// ---------- Alustus ----------
function initDuo() {
  var i;
  tasks = [makeTask(-5, 'pairs', { pairs: 5 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  duo.round = 0;
  duo.state = 'intro';
  duo.t = 0;
  duo.R = DUO_ROUNDS[0];
  duo.L = null;
  duo.gold = [];
  duo.taskDelay = -1;
  duo.hintT = 0;
  duo.tapped = false;
  duo.prog = [[], []];
  renderBackground();
}
function respawnDuo() { duoStartRound(); }
function resizeDuo() { camX = 0; }

// ---------- Asettelu ----------
function duoLayout() {
  var R = duo.R || DUO_ROUNDS[0], W = viewW, h = viewH;
  var areaW = W * 0.46, areaH = h * 0.7, cs = Math.min(areaW / R.cols, areaH / R.rows, h * 0.14);
  return { cs: cs, ox: W * 0.5 - cs * R.cols / 2, oy: h * 0.13 + (areaH - cs * R.rows) / 2 };
}
function duoCell(c, r, L) {
  L = L || duoLayout();
  return { x: L.ox + (c + 0.5) * L.cs, y: L.oy + (r + 0.5) * L.cs };
}
// Pelaajan paneelin keskikohta: p = 0 vasen (pinkki), 1 oikea (sininen)
function duoPanelX(p) { return viewW * (p === 0 ? 0.13 : 0.87); }
function duoSlotSize() { return Math.min(viewH * 0.07, viewW * 0.23 / 6 / 1.08); }
function duoSlotPos(p, i) {
  var s = duoSlotSize(), row = Math.floor(i / 6), col = i % 6;
  return { x: duoPanelX(p) + (col - 2.5) * s * 1.08, y: viewH * 0.21 + row * s * 1.12, s: s };
}
function duoButtons(p) {
  var h = viewH, g = Math.min(h * 0.1, viewW * 0.06), bx = duoPanelX(p), by = h * 0.58;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    r: g * 0.44,
    wait: { x: bx, y: h * 0.86, r: g * 0.42 }
  };
}
function duoPlayBtn() { return { x: viewW * 0.5, y: viewH * 0.92, r: Math.min(viewH * 0.06, viewW * 0.035) }; }

// ---------- Napautus ----------
function handleDuoTap(px, py) {
  var p, i, b, sp, L, s = duoSlotSize();
  if (duo.state !== 'play' || puzzleBusy() || celebrating || duo.running) return;
  for (p = 0; p < 2; p++) {
    b = duoButtons(p);
    for (i = 0; i < b.arrows.length; i++) {
      if (Math.hypot(px - b.arrows[i].x, py - b.arrows[i].y) < b.r * 1.25) { duoAdd(p, b.arrows[i].dir); return; }
    }
    if (Math.hypot(px - b.wait.x, py - b.wait.y) < b.wait.r * 1.3) { duoAdd(p, DUO_WAIT); return; }
    for (i = 0; i < duo.prog[p].length; i++) {
      sp = duoSlotPos(p, i);
      if (Math.abs(px - sp.x) < s * 0.54 && Math.abs(py - sp.y) < s * 0.56) {
        duo.prog[p].splice(i, 1);
        spawnSparkles(sp.x, sp.y, 5, '#c9b8e0');
        playNote(392, 0, 0.1, 'sine', 0.25);
        return;
      }
    }
  }
  var pb = duoPlayBtn();
  if (Math.hypot(px - pb.x, py - pb.y) < pb.r * 1.3) {
    if (!duo.prog[0].length && !duo.prog[1].length) { duoBuzz(0); duoBuzz(1); return; }
    duoRun();
    return;
  }
  // Pupuihin ja porkkanoihin voi napauttaa
  L = duoLayout();
  for (i = 0; i < 2; i++) {
    sp = duoCell(duo.b[i].fc, duo.b[i].fr, L);
    if (Math.hypot(px - sp.x, py - sp.y) < L.cs * 0.5) { duo.b[i].hop = 1; playNote(i ? 988 : 880, 0, 0.08, 'sine', 0.25); return; }
  }
  for (i = 0; i < duo.carrots.length; i++) {
    sp = duoCell(duo.carrots[i].c, duo.carrots[i].r, L);
    if (Math.hypot(px - sp.x, py - sp.y) < L.cs * 0.45) { duo.carrots[i].wig = 0.5; playNote(740, 0, 0.08, 'sine', 0.2); return; }
  }
}
function duoAdd(p, d) {
  duo.tapped = true;
  if (duo.prog[p].length >= duo.R.slots) { duoBuzz(p); return; }
  duo.prog[p].push({ d: d, pop: 0.25 });
  playNote((p ? 587 : 523) + duo.prog[p].length * 30, 0, 0.1, 'triangle', 0.3);
}
function duoBuzz(p) {
  duo.shakeT[p] = 0.3;
  playNote(170, 0, 0.2, 'sawtooth', 0.15);
}
function duoRun() {
  duoResetBunnies();
  duo.running = true;
  duo.step = -1;
  duo.stepT = 0.25;
  duo.steps = Math.max(duo.prog[0].length, duo.prog[1].length);
  duo.runs++;
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.1, 0.16, 'triangle', 0.35);
}
function duoCmd(p, k) { return k < duo.prog[p].length ? duo.prog[p][k].d : DUO_WAIT; }
function duoAtGoal() {
  var L = duo.L;
  return duo.got >= duo.carrots.length &&
    duo.b[0].c === L.home[0].c && duo.b[0].r === L.home[0].r &&
    duo.b[1].c === L.home[1].c && duo.b[1].r === L.home[1].r;
}
function duoFail(fa, fb) {
  duo.running = false;
  duo.failT = 1.2;
  duo.b[0].fail = fa || (!fa && !fb ? 'lost' : false);
  duo.b[1].fail = fb || (!fa && !fb ? 'lost' : false);
  if (fa) duo.shakeT[0] = 0.4;
  if (fb) duo.shakeT[1] = 0.4;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
}

// ---------- Päivitys ----------
function updateDuo(dt) {
  var busy, i, b, st, L, a0, b0, da, db, p, k, ca;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  for (i = 0; i < 2; i++) {
    b = duo.b[i];
    b.hop = Math.max(0, b.hop - dt * 4);
    b.fc += (b.c - b.fc) * Math.min(1, dt * 10);
    b.fr += (b.r - b.fr) * Math.min(1, dt * 10);
    if (duo.shakeT[i] > 0) duo.shakeT[i] -= dt;
    for (k = 0; k < duo.prog[i].length; k++) if (duo.prog[i][k].pop > 0) duo.prog[i][k].pop -= dt;
  }
  for (i = 0; i < duo.carrots.length; i++) if (duo.carrots[i].wig > 0) duo.carrots[i].wig -= dt;
  if (duo.taskDelay > 0 && !busy) {
    duo.taskDelay -= dt;
    if (duo.taskDelay <= 0 && !tasks[0].opened) taskStart(tasks[0]);
  }
  if (busy || celebrating) return;
  duo.t += dt;
  if (duo.state === 'intro') { if (duo.t > 0.6) duoStartRound(); return; }
  if (duo.state === 'roundDone') {
    if (duo.t > 2.2 && duo.taskDelay <= 0) {
      duo.round++;
      if (duo.round >= DUO_ROUNDS.length) { duo.state = 'won'; duo.t = 0; soundFanfare(); }
      else duoStartRound();
    }
    return;
  }
  if (duo.state === 'won') { if (duo.t > 1.4) startCelebration(); return; }
  if (!duo.tapped) duo.hintT += dt;
  if (duo.failT > 0) {
    duo.failT -= dt;
    if (duo.failT <= 0) duoResetBunnies();
  }
  if (!duo.running) return;
  L = duoLayout();
  duo.stepT -= dt;
  if (duo.stepT > 0) return;
  duo.stepT = DUO_STEP_T;
  duo.step++;
  if (duo.step >= duo.steps) {
    if (duoAtGoal()) duoRoundDone(L);
    else duoFail(null, null);
    return;
  }
  a0 = { c: duo.b[0].c, r: duo.b[0].r };
  b0 = { c: duo.b[1].c, r: duo.b[1].r };
  da = duoCmd(0, duo.step);
  db = duoCmd(1, duo.step);
  st = duoStep(duo.L, a0, b0, da, db);
  for (i = 0; i < 2; i++) {
    var d = i ? db : da, np = i ? st.b : st.a, f = i ? st.fb : st.fa, bb = duo.b[i];
    if (d === 1) bb.facing = 1; else if (d === 3) bb.facing = -1;
    if (f && d !== DUO_WAIT) {
      // Törmäys: pupu nytkähtää kohti estettä
      bb.fc = bb.c + BCODE_DIRS[d][0] * 0.3; bb.fr = bb.r + BCODE_DIRS[d][1] * 0.3;
    } else if (!f && d !== DUO_WAIT) {
      bb.c = np.c; bb.r = np.r; bb.hop = 1;
    }
  }
  if (st.fa || st.fb) { duoFail(st.fa, st.fb); return; }
  playNote(600 + duo.step * 25, 0, 0.08, 'sine', 0.22);
  // Porttien tila: auki, kun laatalla on pupu
  for (i = 0; i < duo.L.gates.length; i++) {
    var was = duo.open[i];
    duo.open[i] = duoOnPlate(duo.L, duo.b[0], i) || duoOnPlate(duo.L, duo.b[1], i);
    if (duo.open[i] && !was) { p = duoCell(duo.L.gates[i].c, duo.L.gates[i].r, L); spawnSparkles(p.x, p.y, 8, DUO_GCOL[i]); playNote(1047, 0, 0.1, 'triangle', 0.25); }
  }
  for (k = 0; k < duo.carrots.length; k++) {
    ca = duo.carrots[k];
    for (i = 0; i < 2; i++) {
      if (!ca.got && ca.c === duo.b[i].c && ca.r === duo.b[i].r) {
        ca.got = true;
        duo.got++;
        p = duoCell(ca.c, ca.r, L);
        artPop(p.x, p.y, L.cs * 0.4, '#ff8f3a', 'burst');
        spawnSparkles(p.x, p.y, 10, '#ff8f3a');
        playNote(988 + duo.got * 60, 0, 0.1, 'sine', 0.3);
      }
    }
  }
}
function duoRoundDone(L) {
  var i, p;
  duo.running = false;
  duo.state = 'roundDone';
  duo.t = 0;
  duo.gold[duo.round] = duo.runs === 1;
  for (i = 0; i < 2; i++) {
    p = duoCell(duo.b[i].c, duo.b[i].r, L);
    artPop(p.x, p.y, L.cs * 0.8, DUO_PCOL[i], 'ring');
    spawnSparkles(p.x, p.y, 16, DUO_PCOL[i]);
  }
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (duo.runs === 1) playNote(1760, 0.45, 0.3, 'sine', 0.3);
  if (duo.round === 1) duo.taskDelay = 1.6;
}

// ---------- Piirto ----------
function renderDuoBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), x, i, p;
  g.addColorStop(0, '#8fd0ff');
  g.addColorStop(0.5, '#dff4ff');
  g.addColorStop(1, '#fff2d8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.5, h * 0.06, h * 0.04, 0.1);
  b.fillStyle = artMix('#7fcf6a', '#dff4ff', 0.4);
  b.beginPath(); b.moveTo(0, h * 0.4);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.34 - Math.sin(x / vw * 6 + 0.5) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = '#8fdc6f';
  b.beginPath(); b.moveTo(0, h * 0.52);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.47 - Math.sin(x / vw * 3.4 + 1) * 0.03));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Pelaajien paneelit omalla värillään
  for (p = 0; p < 2; p++) {
    b.fillStyle = artRGBA(DUO_PCOL[p], 0.22);
    roundRect(b, duoPanelX(p) - vw * 0.122, h * 0.1, vw * 0.244, h * 0.87, h * 0.04);
    b.fill();
  }
  for (i = 0; i < 5; i++) drawFlower(b, vw * (0.32 + i * 0.09), h * 0.975, h * 0.011, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}
// Pupu omalla huivillaan
function duoDrawBunny(c, x, y, s, hop, col, facing) {
  artBlob(c, x, y + s * 0.02, s * 0.8, s * 0.26, col, { line: false, alpha: 0.6 });
  c.save();
  c.translate(x, 0);
  c.scale(facing, 1);
  drawBunny(c, 0, y, s, hop, globalT * 3, false);
  c.restore();
  artBlob(c, x, y - hop - s * 0.66, s * 0.4, s * 0.13, col, { lineColor: artShade(col, -0.4) });
  artBlob(c, x + facing * s * 0.24, y - hop - s * 0.5, s * 0.1, s * 0.2, col, { lineColor: artShade(col, -0.4) });
}
function duoDrawBurrow(c, x, y, s, col) {
  drawBcodeBurrow(c, x, y, s);
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2, s * 0.08);
  c.beginPath(); c.moveTo(x + s * 0.6, y + s * 0.2); c.lineTo(x + s * 0.6, y - s * 0.75); c.stroke();
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x + s * 0.6, y - s * 0.75); c.lineTo(x + s * 1.05 + Math.sin(globalT * 5) * s * 0.05, y - s * 0.6); c.lineTo(x + s * 0.6, y - s * 0.45); c.closePath(); c.fill();
}
function duoDrawPlate(c, x, y, s, col, pressed) {
  artBlob(c, x, y + s * 0.15, s * 0.62, s * 0.36, artShade(col, -0.25), { lineColor: artShade(col, -0.5) });
  artBlob(c, x, y + s * (pressed ? 0.15 : 0.05), s * 0.52, s * 0.28, col, { lineColor: artShade(col, -0.45), hi: 0.4 });
  if (!pressed) artGlow(c, x, y, s * 0.9, col, 0.25 + Math.sin(globalT * 4) * 0.1);
}
function duoDrawGate(c, x, y, s, col, open) {
  var i, k = open ? 0.25 : 1;
  c.globalAlpha = open ? 0.45 : 1;
  for (i = -1; i <= 1; i++) artRoundRect(c, x + i * s * 0.35 - s * 0.09, y + s * 0.4 - s * 0.9 * k, s * 0.18, s * 0.9 * k, s * 0.06, '#c89060', { lineColor: '#6a4a28' });
  artRoundRect(c, x - s * 0.55, y + s * 0.4 - s * 0.62 * k, s * 1.1, s * 0.16, s * 0.05, col, { lineColor: artShade(col, -0.5) });
  c.globalAlpha = 1;
}

function drawDuo() {
  var c = ctx, Lz, R = duo.R, L = duo.L, i, k, p, q, s, bp;
  if (!beginPlayWorld()) return;
  if (L) {
    Lz = duoLayout();
    s = Lz.cs;
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      p = duoCell(i, k, Lz);
      artRoundRect(c, p.x - s * 0.47, p.y - s * 0.47, s * 0.94, s * 0.94, s * 0.12, (i + k) % 2 ? '#9fdc7f' : '#8fd06f', { lineColor: '#5a9a4a', line: Math.max(1, s * 0.02) });
    }
    // Laatan ja portin yhteys katkoviivana
    c.lineWidth = Math.max(2, s * 0.04);
    c.setLineDash([s * 0.1, s * 0.1]);
    for (i = 0; i < L.plates.length; i++) {
      p = duoCell(L.plates[i].c, L.plates[i].r, Lz);
      q = duoCell(L.gates[L.plates[i].g].c, L.gates[L.plates[i].g].r, Lz);
      c.strokeStyle = artRGBA(DUO_GCOL[L.plates[i].g], 0.6);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
    }
    c.setLineDash([]);
    for (i = 0; i < 2; i++) {
      p = duoCell(L.start[i].c, L.start[i].r, Lz);
      c.fillStyle = artRGBA(DUO_PCOL[i], 0.35);
      c.beginPath(); c.arc(p.x, p.y + s * 0.28, s * 0.3, 0, Math.PI * 2); c.fill();
      p = duoCell(L.home[i].c, L.home[i].r, Lz);
      duoDrawBurrow(c, p.x, p.y, s * 0.4, DUO_PCOL[i]);
    }
    for (i = 0; i < L.plates.length; i++) {
      var pl = L.plates[i], pressed = (duo.b[0].c === pl.c && duo.b[0].r === pl.r) || (duo.b[1].c === pl.c && duo.b[1].r === pl.r);
      p = duoCell(pl.c, pl.r, Lz);
      duoDrawPlate(c, p.x, p.y, s * 0.42, DUO_GCOL[pl.g], pressed);
    }
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      if (!L.bush[duoKey(i, k)]) continue;
      p = duoCell(i, k, Lz);
      drawBush(c, p.x, p.y + s * 0.35, s * 0.25);
    }
    for (i = 0; i < L.gates.length; i++) {
      p = duoCell(L.gates[i].c, L.gates[i].r, Lz);
      var occ = (duo.b[0].c === L.gates[i].c && duo.b[0].r === L.gates[i].r) || (duo.b[1].c === L.gates[i].c && duo.b[1].r === L.gates[i].r);
      duoDrawGate(c, p.x, p.y, s * 0.45, DUO_GCOL[i], duo.open[i] || occ);
    }
    for (i = 0; i < duo.carrots.length; i++) {
      var ca = duo.carrots[i];
      if (ca.got) continue;
      p = duoCell(ca.c, ca.r, Lz);
      c.save(); c.translate(p.x, p.y); c.rotate(ca.wig > 0 ? Math.sin(globalT * 30) * 0.2 : Math.sin(globalT * 2 + i) * 0.05);
      drawCarrotGlyph(c, 0, -s * 0.1, s * 0.26);
      c.restore();
    }
    // Pupu, joka on alempana, piirretään viimeisenä
    var order = duo.b[0].fr > duo.b[1].fr ? [1, 0] : [0, 1];
    for (k = 0; k < 2; k++) {
      i = order[k];
      bp = duoCell(duo.b[i].fc, duo.b[i].fr, Lz);
      duoDrawBunny(c, bp.x, bp.y + s * 0.36, s * 0.32, Math.sin(duo.b[i].hop * Math.PI) * s * 0.22, DUO_PCOL[i], duo.b[i].facing);
      if (duo.failT > 0 && duo.b[i].fail) {
        c.fillStyle = duo.b[i].fail === 'lost' ? '#8a2be2' : '#ff5f5f';
        c.font = 'bold ' + Math.round(s * 0.5) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(duo.b[i].fail === 'lost' ? '?' : '!', bp.x, bp.y - s * 0.55);
        c.textBaseline = 'alphabetic';
      }
    }
    for (i = 0; i < 2; i++) drawDuoPanel(c, i);
    var pb = duoPlayBtn(), pulse = (duo.prog[0].length || duo.prog[1].length) && !duo.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
    artCircle(c, pb.x, pb.y, pb.r * pulse, duo.running ? '#8fd06f' : '#3ccf6a', { lineColor: '#1f8a40' });
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(pb.x - pb.r * 0.3, pb.y - pb.r * 0.42);
    c.lineTo(pb.x + pb.r * 0.48, pb.y);
    c.lineTo(pb.x - pb.r * 0.3, pb.y + pb.r * 0.42);
    c.closePath(); c.fill();
    drawDuoHint(c);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawDuoHud(c);
  drawTaskOverlay(c);
}
function drawDuoPanel(c, p) {
  var R = duo.R, i, sp, b = duoButtons(p), sh = duo.shakeT[p] > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0, col = DUO_PCOL[p];
  var cur = duo.running ? duo.step : -1;
  // Pelaajan pupu paneelin yläreunassa
  drawBunny(c, duoPanelX(p), viewH * 0.135, viewH * 0.03, 0, globalT * 3, true);
  artBlob(c, duoPanelX(p), viewH * 0.168, viewH * 0.017, viewH * 0.006, col, { lineColor: artShade(col, -0.4) });
  for (i = 0; i < R.slots; i++) {
    sp = duoSlotPos(p, i);
    var cmd = duo.prog[p][i], ps = sp.s * (cmd && cmd.pop > 0 ? 1 + cmd.pop * 0.6 : 1);
    c.fillStyle = i === cur ? '#ffe27a' : (cmd ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)');
    roundRect(c, sp.x - ps / 2 + sh, sp.y - ps / 2, ps, ps, ps * 0.2);
    c.fill();
    if (cmd) {
      if (cmd.d === DUO_WAIT) drawBloopWait(c, sp.x + sh, sp.y, ps * 0.24, artShade(col, -0.45));
      else drawArrowGlyph(c, sp.x + sh, sp.y, ps * 0.3, cmd.d, artShade(col, -0.45));
    }
  }
  for (i = 0; i < b.arrows.length; i++) {
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.beginPath(); c.arc(b.arrows[i].x, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
    artCircle(c, b.arrows[i].x, b.arrows[i].y, b.r, duo.running ? '#e8e0f0' : '#ffffff', { lineColor: col });
    drawArrowGlyph(c, b.arrows[i].x, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, artShade(col, -0.35));
  }
  artCircle(c, b.wait.x, b.wait.y, b.wait.r, '#ffffff', { lineColor: col });
  drawBloopWait(c, b.wait.x, b.wait.y, b.wait.r * 0.45, artShade(col, -0.35));
}
// Vihje 1. kierroksella: laatta ja portti sykkivät, ja käsi näyttää ⏸-napin
// sille pelaajalle, jonka ratkaisussa odotetaan.
function drawDuoHint(c) {
  var p, b, k;
  if (duo.round !== 0 || duo.state !== 'play' || duo.running || duo.runs > 0 || duo.hintT < 2) return;
  p = duo.L.solution[0].indexOf(DUO_WAIT) >= 0 ? 0 : 1;
  b = duoButtons(p);
  k = (globalT % 1.2) / 1.2;
  drawHand(c, b.wait.x + viewH * 0.01, b.wait.y + viewH * 0.02 + Math.abs(Math.sin(k * Math.PI)) * viewH * 0.03, viewH * 0.04);
}
// HUD: kierrokset porkkanoina keskellä ylhäällä; kultainen = ensimmäisellä ajolla
function drawDuoHud(c) {
  var hs = viewH * 0.02, i, n = DUO_ROUNDS.length, w = hs * 2.6 * n + hs * 1.2, x0 = viewW * 0.5 - w / 2, y = viewH * 0.045;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, x0, y - hs * 1.6, w, hs * 3.2, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < duo.round || duo.state === 'won' || (i === duo.round && duo.state === 'roundDone');
    var x = x0 + hs * 1.9 + i * hs * 2.6;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && duo.gold[i]) artGlow(c, x, y, hs * 1.6, '#ffd24f', 0.7);
    drawCarrotGlyph(c, x, y - hs * 0.2, hs * 0.9);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.duo = function (c, x, y, s) {
  duoDrawBunny(c, x - s * 0.12, y + s * 0.15, s * 0.1, 0, DUO_PCOL[0], 1);
  duoDrawBunny(c, x + s * 0.12, y + s * 0.15, s * 0.1, 0, DUO_PCOL[1], -1);
  duoDrawPlate(c, x, y - s * 0.12, s * 0.09, DUO_GCOL[0], false);
};
