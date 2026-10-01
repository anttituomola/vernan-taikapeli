'use strict';

// Rataspaja (Kaukamaa, Kellopaja): uusi verbi RATTAAT. Tonttu veivaa
// moottoriratasta pajan seinällä. Raahaa rattaita laatikosta seinän tappeihin:
// ratas, joka koskettaa pyörivää ratasta, alkaa heti pyöriä vastakkaiseen
// suuntaan. Kun ketju yltää soittorasiaan (kohderatas), se soi. Tapit ovat
// kolmiohilassa, joten ratas voi koskettaa kuutta naapuria: jos kolme ratasta
// koskettaa toisiaan kolmiossa, koneisto JUMITTUU (rattaat tärisevät
// punaisina eikä mikään pyöri). Toisesta kierroksesta alkaen soittorasiassa on
// nuoli: sen on pyörittävä oikeaan suuntaan, ja suunta riippuu ketjun
// pituudesta (joka toinen ratas pyörii vastapäivään). Suorin reitti antaa
// väärän suunnan, joten ketjuun on tehtävä mutka. Rattaita on rajallisesti,
// ja rikkinäisiin tappeihin ei voi laittaa ratasta.
// Neljä arvottua, kovenevaa kierrosta: yksi soittorasia; suunta; kaksi
// soittorasiaa; kolme soittorasiaa. Ratkaisu rakennetaan ensin (puu, jossa
// mikään ratas ei koske kahta muuta), joten kierros ratkeaa aina.
// Kierros ilman yhtään jumia antaa kultaisen rattaan. Ei sydämiä.
// Tehtävät toisen ja kolmannen kierroksen jälkeen: kello, kuviosarja.

// targets: soittorasiat, len: ketjun pituus (rattaita) rasiaa kohti,
// dir: suuntavaatimus, trick: suorin reitti antaa väärän suunnan,
// spare: ylimääräisiä rattaita, broken: rikkinäisiä tappeja
var GEAR_ROUNDS = [
  { cols: 6, rows: 3, targets: 1, len: [3, 4], dir: false, trick: false, spare: 2, broken: 2 },
  { cols: 7, rows: 4, targets: 1, len: [4, 6], dir: true, trick: true, spare: 1, broken: 3 },
  { cols: 7, rows: 4, targets: 2, len: [2, 4], dir: true, trick: true, spare: 1, broken: 3 },
  { cols: 8, rows: 5, targets: 3, len: [2, 4], dir: true, trick: true, spare: 1, broken: 5 }
];
var GEAR_TEETH = 10;
var GEAR_SPEED = 1.6;       // moottorin kulmanopeus (rad/s)
var GEAR_WIN_T = 1.2;       // kaikki rasiat oikein näin kauan -> kierros valmis
var GEAR_TCOL = ['#ff7bac', '#5fa8ff', '#6fd66f'];

var gear = {
  round: 0, state: 'intro', t: 0, R: null, L: null, items: [], drag: null, net: null,
  netT: 0, okT: 0, flawless: true, gold: [], taskDelay: -1, hintT: 0, placed: false, jamT: 0, tonttu: { blink: 0 }
};

// ---------- Hila ----------
function gearKey(c, r) { return c + ',' + r; }
function gearNbrs(R, c, r) {
  var out = [], d, list, nc, nr;
  list = r % 2 === 0
    ? [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]]
    : [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]];
  for (d = 0; d < 6; d++) {
    nc = c + list[d][0]; nr = r + list[d][1];
    if (nc >= 0 && nr >= 0 && nc < R.cols && nr < R.rows) out.push({ c: nc, r: nr });
  }
  return out;
}
function gearLayout() {
  var R = gear.R || GEAR_ROUNDS[0], W = viewW, h = viewH;
  var bw = W * 0.8, bh = h * 0.6;
  var d = Math.min(bw / (R.cols + 0.5), bh / ((R.rows - 1) * 0.866 + 1), h * 0.16);
  var gw = (R.cols - 0.5) * d, gh = (R.rows - 1) * 0.866 * d;
  return { d: d, ox: W * 0.55 - gw / 2, oy: h * 0.15 + (bh - gh) / 2 + d * 0.5 };
}
function gearPegPos(c, r, Lz) {
  Lz = Lz || gearLayout();
  return { x: Lz.ox + (c + (r % 2) * 0.5) * Lz.d, y: Lz.oy + r * 0.866 * Lz.d };
}
function gearR() { return gearLayout().d * 0.5; }

// ---------- Arvonta ----------
function gearRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function gearShortest(R, broken, from, to) {
  var q = [from], dist = {}, s, i, n, k;
  dist[gearKey(from.c, from.r)] = 0;
  while (q.length) {
    s = q.shift();
    if (s.c === to.c && s.r === to.r) return dist[gearKey(s.c, s.r)];
    n = gearNbrs(R, s.c, s.r);
    for (i = 0; i < n.length; i++) {
      k = gearKey(n[i].c, n[i].r);
      if (dist[k] !== undefined || broken[k]) continue;
      dist[k] = dist[gearKey(s.c, s.r)] + 1;
      q.push(n[i]);
    }
  }
  return -1;
}
function gearTryGenerate(R) {
  var tree = {}, nodes = [], i, t, len, cur, k, n, cand, ok, step, L, targets = [], gears = [];
  var motor = { c: 0, r: gearRandInt(0, R.rows - 1), depth: 0 };
  tree[gearKey(motor.c, motor.r)] = motor;
  nodes.push(motor);
  // Kasvata puu: jokainen uusi ratas koskettaa vain edeltäjäänsä
  function touchesOnly(p, prev) {
    var nb = gearNbrs(R, p.c, p.r), j, q;
    for (j = 0; j < nb.length; j++) {
      q = tree[gearKey(nb[j].c, nb[j].r)];
      if (q && q !== prev) return false;
    }
    return true;
  }
  for (t = 0; t < R.targets; t++) {
    // Haara lähtee moottorista tai jostain välirattaasta
    var starts = nodes.filter(function (q) { return !q.target; });
    cur = t === 0 ? motor : starts[Math.floor(Math.random() * starts.length)];
    len = gearRandInt(R.len[0], R.len[1]);
    for (step = 0; step <= len; step++) {
      n = gearNbrs(R, cur.c, cur.r);
      cand = n.filter(function (p) { return !tree[gearKey(p.c, p.r)] && touchesOnly(p, cur); });
      if (!cand.length) return null;
      // Suosi oikealle meneviä askeleita, jotta ketju leviää seinälle
      cand.sort(function () { return Math.random() - 0.5; });
      if (Math.random() < 0.55) cand.sort(function (a, b) { return b.c - a.c; });
      var nx = { c: cand[0].c, r: cand[0].r, depth: cur.depth + 1, target: step === len };
      tree[gearKey(nx.c, nx.r)] = nx;
      nodes.push(nx);
      if (nx.target) targets.push(nx); else gears.push(nx);
      cur = nx;
    }
  }
  L = { motor: motor, targets: [], gears: gears, broken: {}, cols: R.cols, rows: R.rows };
  for (i = 0; i < targets.length; i++) {
    if (targets[i].c < 2) return null;
    L.targets.push({ c: targets[i].c, r: targets[i].r, need: targets[i].depth % 2 === 0 ? 1 : -1, color: GEAR_TCOL[i] });
  }
  // Rikkinäiset tapit puun ulkopuolelle
  var free = [];
  for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) if (!tree[gearKey(i, k)]) free.push({ c: i, r: k });
  shuffleNums(free);
  for (i = 0; i < R.broken && i < free.length; i++) L.broken[gearKey(free[i].c, free[i].r)] = true;
  // Ansa: suorin reitti antaa väärän suunnan ainakin yhdelle rasialle
  if (R.trick) {
    ok = false;
    for (i = 0; i < L.targets.length; i++) {
      var sd = gearShortest(R, L.broken, motor, L.targets[i]);
      if (sd >= 0 && (sd % 2 === 0 ? 1 : -1) !== L.targets[i].need) ok = true;
    }
    if (!ok) return null;
  }
  L.count = gears.length + R.spare;
  return L;
}
function gearGenerate(R) {
  var i, L;
  for (i = 0; i < 5000; i++) {
    L = gearTryGenerate(R);
    if (L) return L;
  }
  return null;
}

// ---------- Verkko: kuka pyörii mihin suuntaan ----------
function gearNodeAt(c, r) {
  var i, L = gear.L;
  if (L.motor.c === c && L.motor.r === r) return { kind: 'motor' };
  for (i = 0; i < L.targets.length; i++) if (L.targets[i].c === c && L.targets[i].r === r) return { kind: 'target', i: i };
  for (i = 0; i < gear.items.length; i++) if (gear.items[i].peg && gear.items[i].peg.c === c && gear.items[i].peg.r === r && gear.items[i] !== gear.drag) return { kind: 'gear', i: i };
  return null;
}
// Leveyshaku moottorista: suunnat vuorottelevat; ristiriita = jumi
function gearEvalNet() {
  var L = gear.L, R = gear.R, dir = {}, depth = {}, q = [L.motor], jam = false, s, n, i, k, sk;
  dir[gearKey(L.motor.c, L.motor.r)] = 1;
  depth[gearKey(L.motor.c, L.motor.r)] = 0;
  while (q.length) {
    s = q.shift();
    sk = gearKey(s.c, s.r);
    n = gearNbrs(R, s.c, s.r);
    for (i = 0; i < n.length; i++) {
      if (!gearNodeAt(n[i].c, n[i].r)) continue;
      k = gearKey(n[i].c, n[i].r);
      if (dir[k] === undefined) {
        dir[k] = -dir[sk];
        depth[k] = depth[sk] + 1;
        q.push(n[i]);
      } else if (dir[k] === dir[sk]) {
        jam = true;
      }
    }
  }
  return { dir: dir, depth: depth, jam: jam };
}
function gearRefresh() {
  var was = gear.net && gear.net.jam, i, t, d;
  gear.net = gearEvalNet();
  if (gear.net.jam && !was) {
    gear.flawless = false;
    gear.jamT = 0.6;
    artShakeStart(viewH * 0.006, 0.3);
    playNote(140, 0, 0.3, 'sawtooth', 0.15);
    playNote(120, 0.15, 0.3, 'sawtooth', 0.12);
  }
  for (i = 0; i < gear.L.targets.length; i++) {
    t = gear.L.targets[i];
    d = gear.net.jam ? 0 : (gear.net.dir[gearKey(t.c, t.r)] || 0);
    if (d !== 0 && !t.spin) {
      // Rasia lähti pyörimään: oikea suunta soi, väärä narisee
      if (!gear.R.dir || d === t.need) { playNote(1047 + i * 120, 0, 0.12, 'triangle', 0.3); playNote(1319 + i * 120, 0.1, 0.18, 'triangle', 0.3); }
      else playNote(300, 0, 0.2, 'square', 0.1);
    }
    t.spin = d;
  }
}

// ---------- Kierros ----------
function gearStartRound() {
  var R = GEAR_ROUNDS[gear.round], i;
  gear.R = R;
  gear.L = gearGenerate(R);
  gear.items = [];
  for (i = 0; i < gear.L.count; i++) gear.items.push({ slot: i, peg: null, x: 0, y: 0, back: null, appear: -i * 0.08, pop: 0 });
  for (i = 0; i < gear.items.length; i++) gearHome(gear.items[i], true);
  gear.drag = null;
  gear.okT = 0;
  gear.flawless = true;
  gear.state = 'play';
  gear.t = 0;
  gear.hintT = 0;
  gear.net = null;
  gearRefresh();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function gearSlotPos(i) {
  var n = gear.items.length, gap = Math.min(viewW * 0.08, viewW * 0.6 / Math.max(1, n));
  return { x: viewW * 0.55 + (i - (n - 1) / 2) * gap, y: viewH * 0.885 };
}
function gearHome(it, snap) {
  var p = it.peg ? gearPegPos(it.peg.c, it.peg.r) : gearSlotPos(it.slot);
  it.hx = p.x; it.hy = p.y;
  if (snap) { it.x = p.x; it.y = p.y; }
}

// ---------- Alustus ----------
function initGear() {
  var i;
  tasks = [makeTask(-5, 'clock'), makeTask(-5, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  gear.round = 0;
  gear.state = 'intro';
  gear.t = 0;
  gear.R = GEAR_ROUNDS[0];
  gear.L = null;
  gear.items = [];
  gear.gold = [];
  gear.taskDelay = -1;
  gear.placed = false;
  gearSetupProps();
  renderBackground();
}
function respawnGear() { gearStartRound(); }
function resizeGear() {
  var i;
  camX = 0;
  for (i = 0; i < gear.items.length; i++) gearHome(gear.items[i], true);
  gearSetupProps();
}

// Tökättävät koristeet: kolme seinän koristeratasta (tökkäys pyöräyttää ja
// kilahtaa; joka viides tökkäys avaa navassa käkikellon luukun, josta pupu
// kurkistaa) ja öljykannu työpöydällä (kallistuu ja tiputtaa öljypisaran).
// Ne ovat tappitaulun ja rataslaatikon ulkopuolella, eivätkä raahattavien tiellä.
function gearSetupProps() {
  var W = viewW, h = viewH;
  propsReset();
  gearAddWallGear(W * 0.05, h * 0.45, h * 0.04, 0);
  gearAddWallGear(W * 0.06, h * 0.7, h * 0.04, 0.8);
  gearAddWallGear(W * 0.94, h * 0.88, h * 0.04, 1.2);
  propAdd({
    x: W * 0.12, y: h * 0.92, r: h * 0.06, hy: h * 0.045, color: '#c0c8d8', note: 523, amp: 0.1,
    update: function (p, dt) {
      var s = h * 0.045;
      // Pisara irtoaa nokasta, kun kannu on kallistunut
      if (p.t >= 0.25 && p.t - dt < 0.25) {
        propDrop({
          x: p.x + s * 2.0, y: p.y - s * 1.0, vx: 0, vy: 0, vr: 0, ground: p.y - s * 0.1, life: 1.2,
          draw: function (c) { artBlob(c, 0, 0, s * 0.12, s * 0.18, '#3a2a10', { line: false }); }
        });
      }
    },
    draw: function (c, p) {
      var s = h * 0.045, tilt = p.t >= 0 ? Math.sin(Math.min(1, p.t / 0.5) * Math.PI) * 0.5 : 0;
      artShadow(c, 0, s * 0.05, s * 0.9, s * 0.18, 0.2);
      c.rotate(tilt);
      artRoundRect(c, -s * 0.7, -s * 0.9, s * 1.4, s * 0.9, s * 0.15, '#c0c8d8', { shadeTo: '#8a92a8', lineColor: '#4a5060', hi: 0.3 });
      artBlob(c, 0, -s * 0.9, s * 0.5, s * 0.22, '#d8e0ec', { lineColor: '#4a5060' });
      artLimb(c, s * 0.3, -s * 1.0, s * 1.3, -s * 1.9, s * 0.16, '#c0c8d8', '#4a5060');
      artLimb(c, -s * 0.7, -s * 0.6, -s * 1.1, -s * 0.2, s * 0.12, '#8a92a8', '#4a5060');
    }
  });
}
function gearAddWallGear(x, y, r, ang0) {
  propAdd({
    x: x, y: y, r: r * 1.6, hy: 0, color: '#ffd24f', note: 1175, amp: 0.05, ang: ang0, spin: 0, cuckooT: 0,
    update: function (p, dt) {
      p.ang += p.spin * dt;
      p.spin *= Math.max(0, 1 - dt * 1.6);
      if (p.cuckooT > 0) p.cuckooT -= dt;
    },
    draw: function (c, p) {
      c.globalAlpha = p.t >= 0 || p.cuckooT > 0 ? 0.9 : 0.45;
      gearDrawWheel(c, 0, 0, r, p.ang, '#d9b070', 8);
      if (p.cuckooT > 0) gearDrawCuckoo(c, r, p.cuckooT);
      c.globalAlpha = 1;
    },
    poke: function (p) {
      p.spin = (p.n % 2 ? 1 : -1) * 7;
      playNote(1568, 0.05, 0.25, 'sine', 0.2);
      if (p.n % 5 === 0) {
        p.cuckooT = 2.2;
        playNote(784, 0.3, 0.2, 'triangle', 0.3);
        playNote(622, 0.55, 0.3, 'triangle', 0.3);
      }
    }
  });
}
// Käkikellon luukku rattaan navassa: ovi kääntyy auki ja pupu kurkistaa (t: aikaa jäljellä 2,2 s:sta)
function gearDrawCuckoo(c, r, t) {
  var k = Math.min(1, (2.2 - t) * 4, t * 3), s = r * 0.5;
  artRoundRect(c, -s * 0.8, -s * 0.8, s * 1.6, s * 1.6, s * 0.2, '#3a2010', { lineColor: '#1e1008' });
  drawBunny(c, 0, s * 0.3 - k * s * 0.5, s * 0.5 * k, 0, globalT * 8, true);
  c.save();
  c.translate(-s * 0.8, 0);
  c.scale(Math.max(0.05, 1 - k), 1);
  artRoundRect(c, 0, -s * 0.8, s * 1.6, s * 1.6, s * 0.2, '#8a5a30', { lineColor: '#3a2010' });
  c.restore();
}

// ---------- Syöte ----------
function handleGearTap(px, py) {
  var i, it, d, best = null, bd = 1e9, r = gearR() * 1.1, Lz, p;
  if (puzzleBusy() || celebrating) return;
  if (gear.state !== 'play') { propsTap(px, py); return; }
  for (i = 0; i < gear.items.length; i++) {
    it = gear.items[i];
    if (it.back || it.appear < 1) continue;
    d = Math.hypot(px - it.x, py - it.y);
    if (d < r && d < bd) { bd = d; best = it; }
  }
  if (best) {
    gear.drag = best;
    if (best.peg) { best.peg = null; gearRefresh(); }
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  // Tonttuun ja rasioihin voi napauttaa
  Lz = gearLayout();
  p = gearPegPos(gear.L.motor.c, gear.L.motor.r, Lz);
  if (Math.hypot(px - (p.x - Lz.d * 0.9), py - p.y) < Lz.d * 0.6) {
    gear.tonttu.blink = 0.5;
    playNote(660, 0, 0.1, 'triangle', 0.25);
    playNote(880, 0.1, 0.12, 'triangle', 0.25);
    return;
  }
  // Koristeet (seinän rattaat, öljykannu) vain, kun napautus ei osunut rattaaseen eikä tonttuun
  propsTap(px, py);
}
function gearDrop(it) {
  var R = gear.R, Lz = gearLayout(), best = null, bd = Lz.d * 0.55, c, r, p, d;
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) {
    if (gear.L.broken[gearKey(c, r)] || gearNodeAt(c, r)) continue;
    p = gearPegPos(c, r, Lz);
    d = Math.hypot(it.x - p.x, it.y - p.y);
    if (d < bd) { bd = d; best = { c: c, r: r }; }
  }
  if (best) {
    it.peg = best;
    it.pop = 0.25;
    gear.placed = true;
    gearHome(it);
    playNote(700, 0, 0.08, 'triangle', 0.25);
    gearRefresh();
  } else {
    it.peg = null;
    gearHome(it);
    it.back = { x0: it.x, y0: it.y, t: 0 };
  }
}

// ---------- Päivitys ----------
function updateGear(dt) {
  var busy, i, it, k, allOk, t;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  if (gear.tonttu.blink > 0) gear.tonttu.blink -= dt;
  if (gear.jamT > 0) gear.jamT -= dt;
  if (gear.taskDelay > 0 && !busy) {
    gear.taskDelay -= dt;
    if (gear.taskDelay <= 0) {
      if (gear.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (gear.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (gear.net && !gear.net.jam) gear.netT += dt;
  // Raahaus
  if (gear.drag) {
    it = gear.drag;
    if (holding && !busy) {
      it.x += (lastPX - it.x) * Math.min(1, dt * 18);
      it.y += (lastPY - gearR() * 0.6 - it.y) * Math.min(1, dt * 18);
    } else {
      gear.drag = null;
      gearDrop(it);
    }
  }
  for (i = 0; i < gear.items.length; i++) {
    it = gear.items[i];
    it.appear = Math.min(1, it.appear + dt * 2.5);
    if (it.pop > 0) it.pop -= dt;
    if (it === gear.drag) continue;
    if (it.back) {
      it.back.t += dt;
      k = easeOutCubic(Math.min(1, it.back.t / 0.4));
      it.x = it.back.x0 + (it.hx - it.back.x0) * k;
      it.y = it.back.y0 + (it.hy - it.back.y0) * k - Math.sin(k * Math.PI) * viewH * 0.05;
      if (it.back.t >= 0.4) it.back = null;
    } else {
      gearHome(it);
      it.x += (it.hx - it.x) * Math.min(1, dt * 14);
      it.y += (it.hy - it.y) * Math.min(1, dt * 14);
    }
  }
  if (busy || celebrating) return;
  gear.t += dt;
  if (gear.state === 'intro') { if (gear.t > 0.6) gearStartRound(); return; }
  if (gear.state === 'roundDone') {
    if (gear.t > 2.2 && gear.taskDelay <= 0) {
      gear.round++;
      if (gear.round >= GEAR_ROUNDS.length) { gear.state = 'won'; gear.t = 0; soundFanfare(); }
      else gearStartRound();
    }
    return;
  }
  if (gear.state === 'won') { if (gear.t > 1.4) startCelebration(); return; }
  if (!gear.placed) gear.hintT += dt;
  // Kaikki rasiat soivat oikein hetken: kierros valmis
  allOk = gear.net && !gear.net.jam && !gear.drag;
  for (i = 0; allOk && i < gear.L.targets.length; i++) {
    t = gear.L.targets[i];
    if (!t.spin || (gear.R.dir && t.spin !== t.need)) allOk = false;
  }
  if (allOk) {
    gear.okT += dt;
    if (gear.okT > GEAR_WIN_T) gearRoundDone();
  } else {
    gear.okT = 0;
  }
}
function gearRoundDone() {
  var i, p, Lz = gearLayout();
  gear.state = 'roundDone';
  gear.t = 0;
  gear.gold[gear.round] = gear.flawless;
  for (i = 0; i < gear.L.targets.length; i++) {
    p = gearPegPos(gear.L.targets[i].c, gear.L.targets[i].r, Lz);
    artPop(p.x, p.y, Lz.d * 0.8, gear.L.targets[i].color, 'ring');
    spawnSparkles(p.x, p.y, 16, gear.L.targets[i].color);
  }
  var mel = [784, 988, 1175, 1319, 1568];
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.25, 'triangle', 0.3);
  if (gear.flawless) playNote(1760, 0.7, 0.3, 'sine', 0.3);
  if (gear.round === 1 || gear.round === 2) gear.taskDelay = 1.6;
}

// ---------- Piirto ----------
function renderGearBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#6a4a3a');
  g.addColorStop(1, '#4a3028');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Lautaseinä
  b.strokeStyle = 'rgba(30,15,10,0.25)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 14; i++) { x = vw * i / 14; b.beginPath(); b.moveTo(x, 0); b.lineTo(x, h); b.stroke(); }
  // Ikkuna ja vuoret takana
  artRoundRect(b, vw * 0.03, h * 0.06, vw * 0.14, h * 0.2, h * 0.02, '#9fd4ff', { lineColor: '#3a2418' });
  b.fillStyle = '#e8f2ff';
  b.beginPath(); b.moveTo(vw * 0.03, h * 0.24); b.lineTo(vw * 0.08, h * 0.13); b.lineTo(vw * 0.12, h * 0.2); b.lineTo(vw * 0.15, h * 0.15); b.lineTo(vw * 0.17, h * 0.24); b.closePath(); b.fill();
  b.strokeStyle = '#3a2418';
  b.lineWidth = Math.max(2, h * 0.008);
  b.beginPath(); b.moveTo(vw * 0.1, h * 0.06); b.lineTo(vw * 0.1, h * 0.26); b.moveTo(vw * 0.03, h * 0.16); b.lineTo(vw * 0.17, h * 0.16); b.stroke();
  // Tappitaulu
  artRoundRect(b, vw * 0.12, h * 0.1, vw * 0.86, h * 0.68, h * 0.04, '#c99a62', { shadeTo: '#a87a48', lineColor: '#5a3a1a', hi: 0.15 });
  // Työpöytä ja rattaiden laatikko
  artRoundRect(b, vw * 0.0, h * 0.8, vw, h * 0.2, 0, '#8a5a30', { shadeTo: '#5a3a1a', line: false });
  artRoundRect(b, vw * 0.22, h * 0.82, vw * 0.66, h * 0.13, h * 0.03, '#b07840', { shadeTo: '#7a4a20', lineColor: '#4a2a10' });
  // Seinän koristeratas oikeassa yläkulmassa; muut kolme ovat tökättäviä koristeita (gearSetupProps)
  b.globalAlpha = 0.35;
  gearDrawWheel(b, vw * 0.95, h * 0.06, h * 0.04, 0.4, '#d9b070', 8);
  b.globalAlpha = 1;
}
function gearDrawWheel(c, x, y, r, ang, color, teeth) {
  var i, n = teeth || GEAR_TEETH, a, ro = r * 1.12, ri = r * 0.88, dark = artShade(color, -0.45);
  c.beginPath();
  for (i = 0; i < n * 2; i++) {
    a = ang + i * Math.PI / n;
    var rr = i % 2 === 0 ? ro : ri, a0 = a - Math.PI / n * 0.35, a1 = a + Math.PI / n * 0.35;
    c.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr);
    c.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
  }
  c.closePath();
  artFillPath(c, color, y - ro, y + ro, r, { lineColor: dark });
  artCircle(c, x, y, r * 0.62, artShade(color, -0.12), { lineColor: dark });
  // Puolat näyttävät pyörimisen
  c.strokeStyle = dark;
  c.lineWidth = Math.max(1.5, r * 0.12);
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    a = ang + i * Math.PI * 2 / 3;
    c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18); c.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); c.stroke();
  }
  artCircle(c, x, y, r * 0.18, '#5a3a1a', { line: false });
}
// Suuntanuoli rasian ympärillä: 1 = myötäpäivään, -1 = vastapäivään
function gearDrawDirArrow(c, x, y, r, dir, color) {
  var a0 = -Math.PI * 0.85, a1 = -Math.PI * 0.15, ah, tx, ty;
  c.strokeStyle = color;
  c.lineWidth = Math.max(3, r * 0.14);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke();
  ah = dir > 0 ? a1 : a0;
  tx = x + Math.cos(ah) * r; ty = y + Math.sin(ah) * r;
  var tang = ah + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(tx + Math.cos(tang) * r * 0.32, ty + Math.sin(tang) * r * 0.32);
  c.lineTo(tx + Math.cos(tang + 2.3) * r * 0.26, ty + Math.sin(tang + 2.3) * r * 0.26);
  c.lineTo(tx + Math.cos(tang - 2.3) * r * 0.26, ty + Math.sin(tang - 2.3) * r * 0.26);
  c.closePath(); c.fill();
}
function gearDrawTonttu(c, x, y, s, crankA, strain) {
  var hx = x + Math.cos(crankA) * s * 0.55, hy = y + Math.sin(crankA) * s * 0.55, bx = x - s * 1.25, by = y + s * 0.15;
  var sh = strain ? Math.sin(globalT * 40) * s * 0.03 : 0;
  artShadow(c, bx, by + s * 0.75, s * 0.5, s * 0.1, 0.2);
  artBlob(c, bx + sh, by + s * 0.25, s * 0.42, s * 0.5, '#e0403a', { lineColor: '#8a1a1a', hi: 0.2 });
  artLimb(c, bx + s * 0.25 + sh, by, hx, hy, s * 0.13, '#e0403a', '#8a1a1a');
  artCircle(c, hx, hy, s * 0.11, '#ffd9b8', { lineColor: '#c99a7a' });
  artCircle(c, bx + sh, by - s * 0.42, s * 0.3, '#ffd9b8', { lineColor: '#c99a7a' });
  artBlob(c, bx + sh, by - s * 0.22, s * 0.28, s * 0.2, '#ffffff', { lineColor: '#c9c0d8' });
  artEye(c, bx - s * 0.1 + sh, by - s * 0.47, s * 0.05, 0.5, gear.tonttu.blink > 0 || strain);
  artEye(c, bx + s * 0.1 + sh, by - s * 0.47, s * 0.05, 0.5, gear.tonttu.blink > 0 || strain);
  c.beginPath();
  c.moveTo(bx - s * 0.32 + sh, by - s * 0.55); c.lineTo(bx + s * 0.3 + sh, by - s * 0.55); c.lineTo(bx + s * 0.2 + sh, by - s * 1.15);
  c.closePath();
  artFillPath(c, '#e0403a', by - s * 1.15, by - s * 0.55, s * 0.3, { lineColor: '#8a1a1a' });
  artCircle(c, bx + s * 0.2 + sh, by - s * 1.15, s * 0.08, '#ffffff', { line: false });
  // Veivi
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = Math.max(2, s * 0.08);
  c.beginPath(); c.moveTo(x, y); c.lineTo(hx, hy); c.stroke();
}

function drawGear() {
  var c = ctx, R = gear.R, L = gear.L, Lz, i, k, p, it, r, net = gear.net, ang, d, sh;
  if (!beginPlayWorld()) return;
  propsDraw(c);
  if (L) {
    Lz = gearLayout();
    r = Lz.d * 0.5;
    // Tapit
    for (k = 0; k < R.rows; k++) for (i = 0; i < R.cols; i++) {
      p = gearPegPos(i, k, Lz);
      if (L.broken[gearKey(i, k)]) {
        c.strokeStyle = 'rgba(90,50,20,0.55)';
        c.lineWidth = Math.max(2, r * 0.1);
        c.beginPath(); c.moveTo(p.x - r * 0.15, p.y - r * 0.15); c.lineTo(p.x + r * 0.15, p.y + r * 0.15); c.moveTo(p.x + r * 0.15, p.y - r * 0.15); c.lineTo(p.x - r * 0.15, p.y + r * 0.15); c.stroke();
      } else {
        artCircle(c, p.x, p.y, r * 0.16, '#e8c27a', { lineColor: '#7a5a28', hi: 0.4 });
      }
    }
    var jam = net && net.jam, jsh = jam ? Math.sin(globalT * 45) * r * 0.05 : 0;
    function spinOf(cc, rr) {
      var kk = gearKey(cc, rr);
      if (!net || jam || net.dir[kk] === undefined) return 0;
      return net.dir[kk];
    }
    function angOf(cc, rr) {
      var kk = gearKey(cc, rr), dd = spinOf(cc, rr), dep = net && net.depth[kk] !== undefined ? net.depth[kk] : 0;
      return dd * gear.netT * GEAR_SPEED + (dep % 2) * Math.PI / GEAR_TEETH;
    }
    function inJam(cc, rr) { return jam && net.dir[gearKey(cc, rr)] !== undefined; }
    // Moottori ja tonttu
    p = gearPegPos(L.motor.c, L.motor.r, Lz);
    ang = jam ? 0 : gear.netT * GEAR_SPEED;
    gearDrawWheel(c, p.x + jsh, p.y, r, ang, jam ? '#ff8a6a' : '#c0c8d8');
    gearDrawTonttu(c, p.x, p.y, r * 1.1, jam ? -0.6 : ang, jam);
    // Soittorasiat
    for (i = 0; i < L.targets.length; i++) {
      var t = L.targets[i], spin = spinOf(t.c, t.r), good = spin !== 0 && (!R.dir || spin === t.need);
      p = gearPegPos(t.c, t.r, Lz);
      sh = inJam(t.c, t.r) ? jsh : 0;
      if (good) artGlow(c, p.x, p.y, r * 1.8, t.color, 0.45 + Math.sin(globalT * 6) * 0.15);
      gearDrawWheel(c, p.x + sh, p.y, r, angOf(t.c, t.r), inJam(t.c, t.r) ? '#ff8a6a' : t.color);
      // Soittorasian kansi: tähti, joka pyörii rattaan mukana
      drawStar(c, p.x + sh, p.y, r * 0.42, angOf(t.c, t.r), 1);
      if (R.dir) gearDrawDirArrow(c, p.x, p.y, r * 1.35, t.need, spin !== 0 && spin !== t.need ? '#ff5f5f' : '#ffffff');
      if (good && Math.random() < 0.05) spawnSparkles(p.x, p.y - r, 2, t.color);
    }
    // Rattaat taululla ja laatikossa, raahattava viimeisenä
    for (i = 0; i < gear.items.length; i++) {
      it = gear.items[i];
      if (it === gear.drag || it.appear <= 0) continue;
      var sc = easeOutBack(it.appear) * (it.pop > 0 ? 1 + it.pop * 0.5 : 1);
      if (it.peg) {
        sh = inJam(it.peg.c, it.peg.r) ? jsh : 0;
        gearDrawWheel(c, it.x + sh, it.y, r * sc, angOf(it.peg.c, it.peg.r), inJam(it.peg.c, it.peg.r) ? '#ff8a6a' : '#e8b84a');
      } else {
        artShadow(c, it.x, it.y + r * 0.9, r * 0.9, r * 0.2, 0.2);
        gearDrawWheel(c, it.x, it.y, r * sc * 0.85, 0.2 * i, '#e8b84a');
      }
    }
    if (gear.drag) {
      it = gear.drag;
      artShadow(c, it.x, it.y + r * 1.6, r * 0.8, r * 0.18, 0.15);
      gearDrawWheel(c, it.x, it.y, r * 1.05, globalT * 0.5, '#f0c860');
    }
    // Vihje: käsi vie rattaan moottorin viereen
    if (gear.round === 0 && !gear.placed && !gear.drag && gear.hintT > 2 && gear.items.length) {
      var hp = (gear.hintT - 2) % 3.2, g0 = gear.items[0], tgt = null, nb = gearNbrs(R, L.motor.c, L.motor.r);
      for (i = 0; i < nb.length; i++) {
        for (k = 0; k < L.gears.length; k++) if (L.gears[k].c === nb[i].c && L.gears[k].r === nb[i].r) tgt = nb[i];
      }
      if (tgt && hp < 2) {
        var q = gearPegPos(tgt.c, tgt.r, Lz), kk = easeInOutSine(Math.min(1, hp / 1.6));
        var hx = g0.hx + (q.x - g0.hx) * kk, hy = g0.hy + (q.y - g0.hy) * kk;
        c.globalAlpha = hp > 1.7 ? (2 - hp) / 0.3 : 0.85;
        if (kk > 0.05) gearDrawWheel(c, hx, hy, r * 0.9, 0, '#e8b84a');
        drawHand(c, hx + r * 0.4, hy + r * 0.9, r * 0.8);
        c.globalAlpha = 1;
      }
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawGearHud(c);
  drawTaskOverlay(c);
}
// HUD: kierrokset rattaina; kultainen = kierros ilman jumia
function drawGearHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = GEAR_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.8 * n + hs * 1.2, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < gear.round || gear.state === 'won' || (i === gear.round && gear.state === 'roundDone');
    var x = left + hs * 2 + i * hs * 2.8, y = pad * 0.5 + hs * 1.7;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && gear.gold[i]) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.7);
    gearDrawWheel(c, x, y, hs * 0.8, globalT * (done ? 1 : 0), done && gear.gold[i] ? '#ffd24f' : '#c9a070', 8);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.gear = function (c, x, y, s) {
  gearDrawWheel(c, x - s * 0.1, y + s * 0.02, s * 0.12, globalT * 0.8, '#e8b84a', 9);
  gearDrawWheel(c, x + s * 0.13, y - s * 0.08, s * 0.09, -globalT * 0.8 * 1.3, '#c0c8d8', 7);
};

// Kellopajan sokkelon maasto: rattaat, ruuvit ja lastut lautalattialla
HUB_TILE_DECOR.clock = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, cy = y + s / 2;
  b.strokeStyle = 'rgba(90,55,25,0.25)';
  b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.moveTo(x, y + s * 0.5); b.lineTo(x + s, y + s * 0.5); b.stroke();
  if (rnd < 0.18) {
    b.globalAlpha = 0.7;
    gearDrawWheel(b, cx + (rnd2 - 0.5) * s * 0.4, cy + s * 0.15, s * 0.12, rnd * 10, '#d9b070', 8);
    b.globalAlpha = 1;
  } else if (rnd < 0.3) {
    artCircle(b, cx + (rnd2 - 0.5) * s * 0.5, cy + s * 0.2, s * 0.04, '#c0c8d8', { lineColor: '#6a7080' });
  }
};
