'use strict';

// Värisäde (Kaukamaa, Porkkanakumpu): Kuunsäteen (play-beam.js) muunnelma
// VÄRISUODATTIMILLA. Aurinkokivi lähettää valkoisen säteen kiviruutujen yli;
// napautus kääntää peiliä (/ <-> \) kuten Kuunsäteessä. Värilasit ovat kiinteitä:
// säde saa lasin värin, ja kaksi eri lasia sekoittaa värit kuten Taikakeittiössä
// (punainen + keltainen = oranssi, punainen + sininen = violetti, keltainen +
// sininen = vihreä; kaikki kolme = ruskea). Kukat ovat värillisiä ja aukeavat
// vain oman värisestä valosta, joten säteen on kuljettava oikeiden lasien kautta
// oikeassa järjestyksessä. Kun kaikki kukat hehkuvat yhtä aikaa, kierros on
// valmis. Neljä arvottua, kovenevaa kierrosta (1 -> 2 lasia reitillä, 1 -> 3
// kukkaa, hämäyslasit ja -peilit). Toisesta kierroksesta alkaen aurinko laskee:
// jos se ehtii laskea, pilvi peittää sen ja kierros arvotaan uudestaan.
// Kolmannesta alkaen kimalainen istuu säteellä olevalle peilille ja varjostaa
// säteen: napauta se pois. Perhoset lepäävät ruuduissa bonuksena ja lehahtavat,
// kun säde osuu niihin. Tehtävät 2. ja 3. kierroksen jälkeen (sekoita väri, lasku).

// Värit bittimaskeina: 1 punainen, 2 keltainen, 4 sininen
var PRISM_COLORS = { 0: '#ffffff', 1: '#ff5a5a', 2: '#ffd83a', 4: '#4a8cff', 3: '#ff9a2a', 5: '#b05aff', 6: '#4ec85a', 7: '#9a6a3a' };
// cols × rows, mirrors: reitin peilit, filters: reitin värilasit, flowers: kukat,
// decoys: hämäyspeilit, dfilters: hämäyslasit, rocks: kivet, flies: bonusperhoset,
// time: auringon laskuaika (s, 0 = ei), bee: kimalaisen väli (s, 0 = ei)
var PRISM_ROUNDS = [
  { cols: 4, rows: 4, mirrors: 2, filters: 1, flowers: 1, decoys: 0, dfilters: 1, rocks: 0, flies: 1, time: 0, bee: 0 },
  { cols: 5, rows: 4, mirrors: 3, filters: 2, flowers: 2, decoys: 1, dfilters: 1, rocks: 1, flies: 1, time: 75, bee: 0 },
  { cols: 5, rows: 5, mirrors: 4, filters: 2, flowers: 2, decoys: 2, dfilters: 2, rocks: 1, flies: 2, time: 70, bee: 7 },
  { cols: 6, rows: 5, mirrors: 5, filters: 2, flowers: 3, decoys: 2, dfilters: 3, rocks: 2, flies: 2, time: 65, bee: 5 }
];
var PRISM_GROW = 9;       // säteen kasvunopeus (ruutua / s)
var PRISM_HOLD = 0.8;     // kaikkien kukkien pitää hehkua näin kauan (s)

var prism = {
  round: 0, state: 'intro', t: 0, R: null, grid: [], src: null, path: [], stop: null,
  drawLen: 0, allLitT: 0, timeLeft: 0, cloudT: 0, bee: null, beeWait: 0,
  flying: [], flyGot: 0, tapped: false, hintT: 0, taskDelay: -1
};

// ---------- Ruudukko ----------
function prismLayout() {
  var R = prism.R || PRISM_ROUNDS[0], left = viewW * 0.2, right = viewW * 0.94, top = viewH * 0.17, bot = viewH * 0.95;
  var cell = Math.min((right - left) / R.cols, (bot - top) / R.rows, viewH * 0.2);
  return { cell: cell, ox: left + (right - left - cell * R.cols) / 2, oy: top + (bot - top - cell * R.rows) / 2, cols: R.cols, rows: R.rows };
}
function prismCellCenter(c, r, L) {
  L = L || prismLayout();
  return { x: L.ox + (c + 0.5) * L.cell, y: L.oy + (r + 0.5) * L.cell };
}
function prismSrcPos(L) {
  L = L || prismLayout();
  return { x: L.ox - L.cell * 0.62, y: L.oy + (prism.src.r + 0.5) * L.cell };
}
function prismCell(c, r) {
  var R = prism.R;
  if (c < 0 || r < 0 || c >= R.cols || r >= R.rows) return null;
  return prism.grid[r * R.cols + c];
}

// Jäljitys: jokainen piste tietää säteen värin ruudusta lähtiessä (col)
function prismTrace() {
  var c = 0, r = prism.src.r, dx = 1, dy = 0, pts = [], cl, n = 0, nd, stop = null, col = 0;
  while (n++ < 200) {
    cl = prismCell(c, r);
    if (!cl) { stop = 'out'; break; }
    if (cl.type === 'rock') { stop = 'rock'; pts.push({ c: c, r: r, dx: dx, dy: dy, col: col, end: true }); break; }
    if (cl.type === 'mirror' && prism.bee && prism.bee.state === 'sit' && prism.bee.c === c && prism.bee.r === r) {
      stop = 'bee'; pts.push({ c: c, r: r, dx: dx, dy: dy, col: col, end: true }); break;
    }
    if (cl.type === 'filter') col |= cl.bit;
    pts.push({ c: c, r: r, dx: dx, dy: dy, col: col });
    if (cl.type === 'mirror') {
      nd = beamReflect(cl.o, dx, dy);
      dx = nd.dx; dy = nd.dy;
      pts[pts.length - 1].odx = dx; pts[pts.length - 1].ody = dy;
    }
    c += dx; r += dy;
  }
  return { pts: pts, stop: stop };
}
function prismSolvedNow() {
  var tr = prismTrace(), i, p, cl, lit = {}, n = 0, total = 0;
  for (i = 0; i < tr.pts.length; i++) {
    p = tr.pts[i];
    cl = prismCell(p.c, p.r);
    if (cl && cl.type === 'flower' && !p.end && p.col === cl.want) lit[p.c + ',' + p.r] = true;
  }
  for (i in lit) n++;
  for (i = 0; i < prism.grid.length; i++) if (prism.grid[i].type === 'flower') total++;
  return total > 0 && n >= total;
}

// ---------- Arvonta ----------
function prismRandInt(n) { return Math.floor(Math.random() * n); }
function prismShuffle(a) { for (var i = a.length - 1; i > 0; i--) { var k = prismRandInt(i + 1), t = a[i]; a[i] = a[k]; a[k] = t; } return a; }
function prismGenerate(R) {
  var g, i;
  for (i = 0; i < 600; i++) { g = prismTryGenerate(R); if (g) return g; }
  // Varareitti: suora rivi, lasi ja kukka (ei pitäisi tarvita)
  g = { grid: [], src: { r: 0 }, flies: 0 };
  for (i = 0; i < R.cols * R.rows; i++) g.grid.push({ type: 'empty' });
  g.grid[1] = { type: 'filter', bit: 1 };
  g.grid[R.cols - 1] = { type: 'flower', want: 1, lit: false, bloom: 0, wig: 0 };
  return g;
}
function prismTryGenerate(R) {
  var cols = R.cols, rows = R.rows, grid = [], used = {}, i, k, c, r, r0, dx, dy, turns = 0, s, seg = 0, idx = 0;
  var straight = [], pathMirrors = [], opts, pick, nd, o;
  for (i = 0; i < cols * rows; i++) grid.push({ type: 'empty' });
  function inG(cc, rr) { return cc >= 0 && rr >= 0 && cc < cols && rr < rows; }
  r0 = prismRandInt(rows);
  c = 0; r = r0; dx = 1; dy = 0;
  while (turns < R.mirrors) {
    s = prismRandInt(3);
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
    pick = opts[prismRandInt(opts.length)];
    nd = beamReflect(0, dx, dy);
    o = nd.dx === pick.dx && nd.dy === pick.dy ? 0 : 1;
    grid[r * cols + c] = { type: 'mirror', o: o, sol: o, ang: 0, turnT: 0, onPath: true };
    pathMirrors.push(grid[r * cols + c]);
    dx = pick.dx; dy = pick.dy;
    c += dx; r += dy;
    turns++;
    seg++;
  }
  if (!inG(c, r)) return null;
  while (inG(c, r)) {
    if (used[c + ',' + r]) return null;
    used[c + ',' + r] = true;
    straight.push({ c: c, r: r, seg: seg, idx: idx++ });
    c += dx; r += dy;
  }
  // Viimeinen kukka viimeisellä osuudella (kaikki peilit tarpeen) ja kaikkien lasien jälkeen
  var last = straight.filter(function (p) { return p.seg === seg; });
  if (!last.length) return null;
  var lastFlower = last[prismRandInt(last.length)];
  var fcand = prismShuffle(straight.filter(function (p) { return p.idx < lastFlower.idx; }));
  if (fcand.length < R.filters) return null;
  var filt = fcand.slice(0, R.filters).sort(function (a, b) { return a.idx - b.idx; });
  // Lasien värit: eri päävärit, jotta sekoitus syntyy
  var prim = prismShuffle([1, 2, 4]);
  for (i = 0; i < filt.length; i++) grid[filt[i].r * cols + filt[i].c] = { type: 'filter', bit: prim[i], onPath: true, wig: 0 };
  // Säteen väri kussakin reitin ruudussa
  function colAt(p) {
    var m = 0, j;
    for (j = 0; j < filt.length; j++) if (filt[j].idx <= p.idx) m |= prim[j];
    return m;
  }
  // Muut kukat: värillisiä, eri osuuksilla, mieluiten eri väreillä
  var flowers = [lastFlower], wants = {};
  wants[colAt(lastFlower)] = true;
  var fl = prismShuffle(straight.filter(function (p) {
    return p !== lastFlower && p.seg > 0 && !filt.some(function (f) { return f.c === p.c && f.r === p.r; });
  }));
  var segUsed = {};
  segUsed[lastFlower.seg] = true;
  for (i = 0; i < fl.length && flowers.length < R.flowers; i++) {
    var w = colAt(fl[i]);
    // Värit eri kukille niin pitkälle kuin laseista riittää (n lasia = n väriä), sitten saa toistua
    if (segUsed[fl[i].seg] || w === 0 || (wants[w] && Object.keys(wants).length < R.filters)) continue;
    segUsed[fl[i].seg] = true;
    wants[w] = true;
    flowers.push(fl[i]);
  }
  if (flowers.length < R.flowers) return null;
  if (colAt(lastFlower) === 0) return null;
  for (i = 0; i < flowers.length; i++) grid[flowers[i].r * cols + flowers[i].c] = { type: 'flower', want: colAt(flowers[i]), lit: false, bloom: 0, wig: 0 };
  // Vapaat ruudut: kivet, hämäyspeilit, hämäyslasit
  var free = [];
  for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (!used[c + ',' + r]) free.push({ c: c, r: r });
  if (free.length < R.rocks + R.decoys + R.dfilters + R.flies) return null;
  prismShuffle(free);
  k = 0;
  for (i = 0; i < R.rocks; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'rock', wig: 0 };
  for (i = 0; i < R.decoys; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'mirror', o: prismRandInt(2), sol: -1, ang: 0, turnT: 0, onPath: false };
  for (i = 0; i < R.dfilters; i++, k++) grid[free[k].r * cols + free[k].c] = { type: 'filter', bit: [1, 2, 4][prismRandInt(3)], onPath: false, wig: 0 };
  // Sekoitus: vähintään puolet reitin peileistä väärin päin
  var need = Math.max(1, Math.ceil(R.mirrors * 0.5)), wrong = 0;
  for (i = 0; i < pathMirrors.length; i++) {
    if (i === 0 || Math.random() < 0.55) { pathMirrors[i].o = 1 - pathMirrors[i].sol; wrong++; }
  }
  for (i = 0; i < pathMirrors.length && wrong < need; i++) {
    if (pathMirrors[i].o === pathMirrors[i].sol) { pathMirrors[i].o = 1 - pathMirrors[i].sol; wrong++; }
  }
  // Tarkistukset ja bonusperhoset ruutuihin, joihin säde osuu jollain peiliasennolla
  var save = { grid: prism.grid, src: prism.src, R: prism.R, bee: prism.bee }, g = { grid: grid, src: { r: r0 } };
  prism.grid = grid; prism.src = g.src; prism.R = R; prism.bee = null;
  var mirrors = [], orig = [], seen = {}, trial, tr, j;
  for (i = 0; i < grid.length; i++) if (grid[i].type === 'mirror') { mirrors.push(grid[i]); orig.push(grid[i].o); }
  var solvedAtStart = prismSolvedNow();
  for (j = 0; j < mirrors.length; j++) if (mirrors[j].onPath) mirrors[j].o = mirrors[j].sol;
  var solOk = prismSolvedNow();
  for (trial = 0; trial < 160; trial++) {
    for (j = 0; j < mirrors.length; j++) mirrors[j].o = prismRandInt(2);
    tr = prismTrace();
    for (j = 0; j < tr.pts.length; j++) if (grid[tr.pts[j].r * cols + tr.pts[j].c].type === 'empty') seen[tr.pts[j].c + ',' + tr.pts[j].r] = true;
  }
  for (j = 0; j < mirrors.length; j++) mirrors[j].o = orig[j];
  prism.grid = save.grid; prism.src = save.src; prism.R = save.R; prism.bee = save.bee;
  if (solvedAtStart || !solOk) return null;
  var cand = prismShuffle(Object.keys(seen).filter(function (key) { return !used[key]; })), nf = 0;
  for (i = 0; i < cand.length && nf < R.flies; i++) {
    var pc = cand[i].split(','), gc = grid[Number(pc[1]) * cols + Number(pc[0])];
    if (gc.type !== 'empty') continue;
    gc.fly = { got: false, t: Math.random() * 6, col: ['#ff7bac', '#b98aff', '#7fd4ff'][nf % 3] };
    nf++;
  }
  g.flies = nf;
  return g;
}

function prismStartRound() {
  var R = PRISM_ROUNDS[prism.round], g = prismGenerate(R), i, cl;
  prism.R = R;
  prism.grid = g.grid;
  prism.src = g.src;
  for (i = 0; i < prism.grid.length; i++) {
    cl = prism.grid[i];
    if (cl.type === 'mirror') cl.ang = cl.o === 0 ? Math.PI / 4 : -Math.PI / 4;
    cl.pop = 0.3 + (i % R.cols) * 0.06 + Math.floor(i / R.cols) * 0.05;
  }
  prism.bee = null;
  prism.beeWait = R.bee ? R.bee * 0.6 : 0;
  prism.path = [];
  prism.drawLen = 0;
  prism.allLitT = 0;
  prism.timeLeft = R.time;
  prism.cloudT = 0;
  prism.state = 'play';
  prism.t = 0;
  prismRetrace();
  playNote(587, 0, 0.12, 'sine', 0.3);
  playNote(880, 0.12, 0.25, 'sine', 0.3);
}
function prismRetrace() {
  var tr = prismTrace(), old = prism.path, i = 0;
  while (i < old.length && i < tr.pts.length && old[i].c === tr.pts[i].c && old[i].r === tr.pts[i].r &&
    old[i].odx === tr.pts[i].odx && old[i].ody === tr.pts[i].ody && old[i].col === tr.pts[i].col && !!old[i].end === !!tr.pts[i].end) i++;
  prism.path = tr.pts;
  prism.stop = tr.stop;
  prism.drawLen = Math.min(prism.drawLen, i);
}

// ---------- Alustus ----------
function initPrism() {
  var i;
  tasks = [makeTask(-5, 'mix', { mixLevel: 2 }), makeTask(-5, 'math')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  prism.round = 0;
  prism.state = 'intro';
  prism.t = 0;
  prism.R = PRISM_ROUNDS[0];
  prism.grid = [];
  prism.src = { r: 0 };
  prism.path = [];
  prism.flying = [];
  prism.flyGot = 0;
  prism.tapped = false;
  prism.hintT = 0;
  prism.taskDelay = -1;
  prism.bee = null;
  renderBackground();
}
function respawnPrism() { prismStartRound(); }
function resizePrism() { camX = 0; }

// ---------- Napautus ----------
function handlePrismTap(px, py) {
  if (prism.state !== 'play' || puzzleBusy() || celebrating) return;
  var L = prismLayout(), b = prism.bee, c, r, cl, cc, sp;
  if (b && (b.state === 'sit' || b.state === 'fly') && Math.hypot(px - b.x, py - b.y) < Math.max(L.cell * 0.5, viewH * 0.08)) {
    prismShooBee();
    return;
  }
  sp = prismSrcPos(L);
  if (Math.hypot(px - sp.x, py - sp.y) < L.cell * 0.4) {
    artPop(sp.x, sp.y, L.cell * 0.5, '#fff6c8', 'ring');
    spawnSparkles(sp.x, sp.y, 8, '#fff6c8');
    playNote(1175, 0, 0.12, 'sine', 0.25);
    return;
  }
  c = Math.floor((px - L.ox) / L.cell);
  r = Math.floor((py - L.oy) / L.cell);
  cl = prismCell(c, r);
  if (!cl) return;
  cc = prismCellCenter(c, r, L);
  if (cl.type === 'mirror') {
    cl.o = 1 - cl.o;
    cl.turnT = BEAM_TURN_T;
    cl.angFrom = cl.ang;
    cl.angTo = cl.ang + Math.PI / 2;
    prism.tapped = true;
    artPop(cc.x, cc.y, L.cell * 0.4, '#fff6c8', 'ring');
    playNote(1320 + (c + r) * 40, 0, 0.08, 'triangle', 0.25);
    playNote(1760 + (c + r) * 40, 0.05, 0.1, 'sine', 0.18);
    prismRetrace();
  } else if (cl.type === 'filter') {
    // Lasi helähtää omalla värisävyllään
    cl.wig = 0.4;
    spawnSparkles(cc.x, cc.y, 6, PRISM_COLORS[cl.bit]);
    playNote(cl.bit === 1 ? 523 : (cl.bit === 2 ? 659 : 784), 0, 0.15, 'sine', 0.25);
  } else if (cl.type === 'flower') {
    cl.wig = 0.5;
    playNote(cl.lit ? 1047 : 523, 0, 0.12, 'sine', 0.25);
  } else if (cl.type === 'rock') {
    cl.wig = 0.4;
    playNote(160, 0, 0.1, 'triangle', 0.25);
  } else {
    spawnSparkles(cc.x, cc.y, 5, '#b8f08a');
    playNote(740, 0, 0.06, 'sine', 0.15);
  }
}

// ---------- Kimalainen ----------
function prismSendBee() {
  var i, cand = [], p, cl, L = prismLayout();
  for (i = 0; i < prism.path.length && i < prism.drawLen; i++) {
    p = prism.path[i];
    cl = prismCell(p.c, p.r);
    if (cl && cl.type === 'mirror') cand.push(p);
  }
  if (!cand.length) { prism.beeWait = 1.5; return; }
  p = cand[Math.max(0, cand.length - 1 - prismRandInt(Math.min(2, cand.length)))];
  var cc = prismCellCenter(p.c, p.r, L), fromLeft = Math.random() < 0.5;
  prism.bee = {
    state: 'fly', c: p.c, r: p.r, t: 0, flap: 0,
    x0: fromLeft ? -viewW * 0.05 : viewW * 1.05, y0: viewH * (0.1 + Math.random() * 0.3),
    x: 0, y: 0, tx: cc.x, ty: cc.y - L.cell * 0.12
  };
  prism.bee.x = prism.bee.x0; prism.bee.y = prism.bee.y0;
  playNote(220, 0, 0.25, 'sawtooth', 0.05);
}
function prismShooBee() {
  var b = prism.bee;
  b.state = 'flee';
  b.t = 0;
  b.x0 = b.x; b.y0 = b.y;
  b.tx = b.x < viewW / 2 ? -viewW * 0.1 : viewW * 1.1;
  b.ty = -viewH * 0.1;
  artPop(b.x, b.y, viewH * 0.06, '#ffd83a', 'burst');
  spawnSparkles(b.x, b.y, 10, '#ffd83a');
  playNote(880, 0, 0.08, 'square', 0.08);
  playNote(1175, 0.06, 0.12, 'sine', 0.2);
  prism.beeWait = prism.R.bee * (0.8 + Math.random() * 0.5);
  prismRetrace();
}

// ---------- Päivitys ----------
function updatePrism(dt) {
  var i, cl, busy, R, L, p, lit, total, k;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  for (i = 0; i < prism.grid.length; i++) {
    cl = prism.grid[i];
    if (cl.pop > 0) cl.pop = Math.max(0, cl.pop - dt);
    if (cl.wig > 0) cl.wig -= dt;
    if (cl.type === 'mirror' && cl.turnT > 0) {
      cl.turnT = Math.max(0, cl.turnT - dt);
      cl.ang = cl.angFrom + (cl.angTo - cl.angFrom) * easeOutBack(1 - cl.turnT / BEAM_TURN_T);
    }
    if (cl.type === 'flower') cl.bloom += ((cl.lit ? 1 : 0) - cl.bloom) * Math.min(1, dt * 6);
    if (cl.fly && !cl.fly.got) cl.fly.t += dt;
  }
  for (i = prism.flying.length - 1; i >= 0; i--) {
    p = prism.flying[i];
    p.t += dt;
    k = easeInOutSine(Math.min(1, p.t / 0.9));
    p.x = p.x0 + (p.x1 - p.x0) * k;
    p.y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    if (p.t >= 0.9) { prism.flying.splice(i, 1); prism.flyGot++; playNote(1568, 0, 0.1, 'sine', 0.2); }
  }
  if (prism.taskDelay > 0 && !busy) {
    prism.taskDelay -= dt;
    if (prism.taskDelay <= 0) {
      if (prism.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (prism.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  prism.t += dt;
  if (prism.state === 'intro') { if (prism.t > 0.8) prismStartRound(); return; }
  if (prism.state === 'roundDone') {
    if (prism.t > 1.8 && prism.taskDelay <= 0) {
      prism.round++;
      if (prism.round >= PRISM_ROUNDS.length) { prism.state = 'won'; prism.t = 0; soundFanfare(); }
      else prismStartRound();
    }
    return;
  }
  if (prism.state === 'cloud') {
    prism.cloudT += dt;
    if (prism.cloudT > 1.6) prismStartRound();
    return;
  }
  if (prism.state === 'won') { if (prism.t > 1.6) startCelebration(); return; }
  R = prism.R;
  L = prismLayout();
  if (!prism.tapped) prism.hintT += dt;
  if (R.time > 0) {
    var before = prism.timeLeft;
    prism.timeLeft -= dt;
    if (before > 10 && prism.timeLeft <= 10) playNote(392, 0, 0.25, 'triangle', 0.2);
    if (prism.timeLeft <= 0) {
      prism.state = 'cloud';
      prism.cloudT = 0;
      prism.bee = null;
      playNote(330, 0, 0.3, 'triangle', 0.3);
      playNote(247, 0.25, 0.5, 'triangle', 0.3);
      return;
    }
  }
  if (R.bee > 0) {
    var b = prism.bee;
    if (!b || b.state === 'gone') {
      prism.beeWait -= dt;
      if (prism.beeWait <= 0) prismSendBee();
    } else {
      b.t += dt;
      b.flap += dt * 30;
      if (b.state === 'fly') {
        k = easeInOutSine(Math.min(1, b.t / 1.8));
        b.x = b.x0 + (b.tx - b.x0) * k + Math.sin(b.t * 9) * viewH * 0.02 * (1 - k);
        b.y = b.y0 + (b.ty - b.y0) * k + Math.cos(b.t * 7) * viewH * 0.02 * (1 - k);
        if (b.t >= 1.8) {
          var tc = prismCell(b.c, b.r);
          if (tc && tc.type === 'mirror') { b.state = 'sit'; b.t = 0; playNote(196, 0, 0.25, 'sine', 0.2); prismRetrace(); }
          else { b.state = 'gone'; prism.beeWait = 1; }
        }
      } else if (b.state === 'sit') {
        b.y = b.ty + Math.sin(b.t * 5) * viewH * 0.004;
      } else if (b.state === 'flee') {
        k = Math.min(1, b.t / 0.9);
        b.x = b.x0 + (b.tx - b.x0) * k * k;
        b.y = b.y0 + (b.ty - b.y0) * k;
        if (k >= 1) b.state = 'gone';
      }
    }
  }
  // Säde kasvaa; kukat aukeavat oikeasta väristä, perhoset lehahtavat
  prism.drawLen = Math.min(prism.path.length, prism.drawLen + dt * PRISM_GROW);
  for (i = 0; i < prism.grid.length; i++) if (prism.grid[i].type === 'flower') prism.grid[i].reach = false;
  for (i = 0; i < prism.path.length; i++) {
    if (i + 0.5 > prism.drawLen) break;
    p = prism.path[i];
    cl = prismCell(p.c, p.r);
    if (!cl || p.end) continue;
    if (cl.type === 'flower') {
      cl.hitCol = p.col;
      if (p.col === cl.want) {
        cl.reach = true;
        if (!cl.lit) {
          var fc = prismCellCenter(p.c, p.r, L);
          artPop(fc.x, fc.y, L.cell * 0.45, PRISM_COLORS[cl.want], 'burst');
          playNote(784 + i * 30, 0, 0.12, 'sine', 0.28);
          playNote(1175 + i * 30, 0.08, 0.2, 'sine', 0.22);
        }
      }
    }
    if (cl.fly && !cl.fly.got) {
      cl.fly.got = true;
      var fp = prismCellCenter(p.c, p.r, L);
      prism.flying.push({ x0: fp.x, y0: fp.y, x1: hudX() + viewH * 0.2, y1: viewH * 0.06, x: fp.x, y: fp.y, t: 0, col: cl.fly.col });
      artPop(fp.x, fp.y, L.cell * 0.35, cl.fly.col, 'ring');
      playNote(1319, 0, 0.1, 'sine', 0.25);
    }
  }
  lit = 0; total = 0;
  for (i = 0; i < prism.grid.length; i++) {
    cl = prism.grid[i];
    if (cl.type !== 'flower') continue;
    total++;
    cl.lit = !!cl.reach;
    if (cl.lit) lit++;
  }
  if (total > 0 && lit === total && prism.drawLen >= prism.path.length) {
    prism.allLitT += dt;
    if (prism.allLitT >= PRISM_HOLD) prismRoundDone(L);
  } else prism.allLitT = 0;
}
function prismRoundDone(L) {
  var i, cl, cc;
  prism.state = 'roundDone';
  prism.t = 0;
  if (prism.bee) prism.bee.state = 'gone';
  for (i = 0; i < prism.grid.length; i++) {
    cl = prism.grid[i];
    if (cl.type !== 'flower') continue;
    cc = prismCellCenter(i % prism.R.cols, Math.floor(i / prism.R.cols), L);
    artPop(cc.x, cc.y, L.cell * 0.8, PRISM_COLORS[cl.want], 'ring');
    spawnSparkles(cc.x, cc.y, 16, PRISM_COLORS[cl.want]);
  }
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (prism.round === 1 || prism.round === 2) prism.taskDelay = 1.3;
}

// ---------- Piirto ----------
function renderPrismBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#7fcfff');
  g.addColorStop(0.35, '#d8f4ff');
  g.addColorStop(1, '#b8e88a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = artMix('#7fcf6a', '#d8f4ff', 0.45);
  b.beginPath(); b.moveTo(0, h * 0.34);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.3 - Math.sin(x / vw * 5 + 2) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = '#9fdc7f';
  b.fillRect(0, h * 0.42, w, h * 0.58);
  for (i = 0; i < 7; i++) drawFlower(b, vw * (0.02 + i * 0.03), h * (0.96 - (i % 2) * 0.03), h * 0.012, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
  for (i = 0; i < 3; i++) drawBush(b, vw * (0.04 + i * 0.06), h * 0.6 + (i % 2) * h * 0.08, h * 0.03);
}

// Aurinko kulkee taivaan poikki ajan mukana; aikarajattomalla kierroksella paikallaan
function prismSunPos() {
  var R = prism.R, k = R && R.time > 0 ? 1 - Math.max(0, prism.timeLeft) / R.time : 0.3;
  return { x: viewW * (0.3 + k * 0.62), y: viewH * (0.075 + Math.pow(k - 0.3, 2) * 0.12) };
}
function drawPrismSun(c) {
  var R = prism.R, sp = prismSunPos(), r = viewH * 0.045, dim;
  if (!R) return;
  dim = R.time > 0 && prism.timeLeft < 10 && prism.state === 'play';
  artGlow(c, sp.x, sp.y, r * 3, dim ? '#ff9a50' : '#fff0a0', 0.45 + (dim ? Math.sin(globalT * 6) * 0.15 : 0));
  artCircle(c, sp.x, sp.y, r, dim ? '#ffb070' : '#ffe27a', { lineColor: dim ? '#c86a30' : '#e0a020', hi: 0.4 });
  if (R.time > 0 && prism.state === 'play') {
    c.strokeStyle = dim ? 'rgba(255,140,80,0.95)' : 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(2, r * 0.14);
    c.beginPath(); c.arc(sp.x, sp.y, r * 1.35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (prism.timeLeft / R.time)); c.stroke();
  }
  if (prism.state === 'cloud') {
    var ck = easeOutCubic(prism.cloudT / 0.8);
    artBlob(c, sp.x - r * 2.5 + ck * r * 2.5, sp.y + r * 0.2, r * 1.8, r * 0.9, '#ffffff', { lineColor: '#c8d8e8' });
    artBlob(c, sp.x + r * 2.8 - ck * r * 2.3, sp.y - r * 0.1, r * 1.5, r * 0.8, '#f4f8ff', { lineColor: '#c8d8e8' });
  }
}
function drawPrismTile(c, x, y, s, cl, i) {
  var pop = cl.pop > 0 ? easeOutBack(1 - Math.min(1, cl.pop / 0.3)) : 1;
  if (pop <= 0.01) return;
  c.save();
  c.translate(x, y);
  c.scale(pop, pop);
  artRoundRect(c, -s * 0.46, -s * 0.46, s * 0.92, s * 0.92, s * 0.14, i % 2 ? '#e8e0d0' : '#f2ecdf', { lineColor: '#b8a888' });
  c.fillStyle = 'rgba(120,180,90,0.25)';
  c.beginPath(); c.arc(-s * 0.3, s * 0.32, s * 0.08, 0, Math.PI * 2); c.arc(s * 0.32, -s * 0.3, s * 0.06, 0, Math.PI * 2); c.fill();
  c.restore();
}
function drawPrismFilter(c, x, y, s, cl) {
  var col = PRISM_COLORS[cl.bit], wg = cl.wig > 0 ? Math.sin(globalT * 40) * s * 0.03 : 0;
  artShadow(c, x, y + s * 0.32, s * 0.3, s * 0.07);
  artRoundRect(c, x - s * 0.3 + wg, y - s * 0.36, s * 0.6, s * 0.66, s * 0.08, '#c89060', { lineColor: '#6a4a28' });
  c.fillStyle = artRGBA(col, 0.75);
  roundRect(c, x - s * 0.22 + wg, y - s * 0.28, s * 0.44, s * 0.5, s * 0.05);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.moveTo(x - s * 0.18 + wg, y - s * 0.24); c.lineTo(x - s * 0.04 + wg, y - s * 0.24); c.lineTo(x - s * 0.18 + wg, y - s * 0.02); c.closePath(); c.fill();
}
// Kukka omassa värissään: kiinni haaleana, auki hehkuvana. Väärän värinen valo
// saa sen värisemään (se näkee valon, mutta ei aukea).
function drawPrismFlower(c, x, y, s, cl) {
  var b = cl.bloom, want = PRISM_COLORS[cl.want], i, ang, pr;
  var wrong = !cl.lit && cl.hitCol !== undefined && cl.hitCol !== cl.want && prism.state === 'play';
  var wg = cl.wig > 0 ? Math.sin(globalT * 30) * 0.2 : (wrong ? Math.sin(globalT * 20) * 0.08 : Math.sin(globalT * 1.5 + x) * 0.05);
  artShadow(c, x, y + s * 0.34, s * 0.22, s * 0.06);
  c.strokeStyle = '#3a8a5a';
  c.lineWidth = Math.max(2, s * 0.05);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + s * 0.34); c.quadraticCurveTo(x + s * 0.05, y + s * 0.15, x + Math.sin(wg) * s * 0.1, y); c.stroke();
  artBlob(c, x - s * 0.1, y + s * 0.22, s * 0.09, s * 0.04, '#4fae6a', { line: false, rot: -0.5 });
  c.save();
  c.translate(x + Math.sin(wg) * s * 0.1, y);
  c.rotate(wg);
  if (b > 0.05) artGlow(c, 0, 0, s * (0.4 + b * 0.5), want, 0.3 + b * 0.4);
  pr = s * (0.1 + b * 0.12);
  for (i = 0; i < 6; i++) {
    ang = i / 6 * Math.PI * 2 + globalT * 0.2 * b;
    var dx = Math.cos(ang) * pr * (0.4 + b * 0.6), dy = Math.sin(ang) * pr * (0.4 + b * 0.6);
    artBlob(c, dx, dy, pr * 0.75, pr * 0.5, artMix(artMix(want, '#ffffff', 0.45), want, b), { lineColor: artShade(want, -0.35), rot: ang });
  }
  artCircle(c, 0, 0, s * 0.07, artMix('#fff4c0', '#ffd24f', b), { line: false });
  c.restore();
}
function drawPrismButterfly(c, x, y, s, f, t) {
  var fl = Math.abs(Math.sin(t * (f.got ? 12 : 1.5))) * 0.8 + 0.2;
  c.fillStyle = f.col;
  c.beginPath(); c.ellipse(x - s * 0.1 * fl, y, s * 0.1 * fl, s * 0.08, -0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + s * 0.1 * fl, y, s * 0.1 * fl, s * 0.08, 0.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4a3a5a';
  c.fillRect(x - s * 0.012, y - s * 0.06, s * 0.024, s * 0.12);
}
function drawPrismStone(c, L) {
  var sp = prismSrcPos(L), s = L.cell, bob = Math.sin(globalT * 2) * s * 0.03;
  artGlow(c, sp.x, sp.y + bob, s * 0.6, '#fff4b0', 0.5 + Math.sin(globalT * 3) * 0.1);
  c.beginPath();
  c.moveTo(sp.x, sp.y + bob - s * 0.26); c.lineTo(sp.x + s * 0.17, sp.y + bob); c.lineTo(sp.x, sp.y + bob + s * 0.26); c.lineTo(sp.x - s * 0.17, sp.y + bob);
  c.closePath();
  artFillPath(c, '#fff4c0', sp.y - s * 0.26, sp.y + s * 0.26, s * 0.2, { lineColor: '#c8a040' });
}
function drawPrismBee(c, b, s) {
  var fl = Math.sin(b.flap) * 0.5;
  c.fillStyle = 'rgba(230,245,255,0.8)';
  c.beginPath(); c.ellipse(b.x - s * 0.3, b.y - s * 0.55, s * 0.4, s * (0.25 + fl * 0.1), -0.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(b.x + s * 0.3, b.y - s * 0.55, s * 0.4, s * (0.25 + fl * 0.1), 0.5, 0, Math.PI * 2); c.fill();
  artBlob(c, b.x, b.y, s * 0.6, s * 0.45, '#ffd83a', { lineColor: '#8a6a10' });
  c.fillStyle = '#4a3a2a';
  c.fillRect(b.x - s * 0.18, b.y - s * 0.42, s * 0.14, s * 0.84);
  c.fillRect(b.x + s * 0.14, b.y - s * 0.4, s * 0.14, s * 0.8);
  artEye(c, b.x + s * 0.42, b.y - s * 0.1, s * 0.12, 1, false);
}

// Säteen polku väreittäin: jokainen jana piirretään edellisen ruudun lähtövärillä
function prismPolyline(L) {
  var pts = [], sp = prismSrcPos(L), i, p, cc, n = prism.drawLen, last, frac, full;
  pts.push({ x: sp.x + L.cell * 0.17, y: sp.y, col: 0 });
  for (i = 0; i < prism.path.length; i++) {
    p = prism.path[i];
    cc = prismCellCenter(p.c, p.r, L);
    if (p.end) cc = { x: cc.x - p.dx * L.cell * 0.32, y: cc.y - p.dy * L.cell * 0.32 };
    if (i + 0.5 > n) {
      last = pts[pts.length - 1];
      frac = Math.max(0, Math.min(1, n - (i - 0.5)));
      pts.push({ x: last.x + (cc.x - last.x) * frac, y: last.y + (cc.y - last.y) * frac, col: p.col });
      return pts;
    }
    pts.push({ x: cc.x, y: cc.y, col: p.col });
  }
  full = prism.path.length ? prism.path[prism.path.length - 1] : null;
  if (full && !full.end && n >= prism.path.length) {
    var ddx = full.odx !== undefined ? full.odx : full.dx, ddy = full.ody !== undefined ? full.ody : full.dy;
    cc = prismCellCenter(full.c, full.r, L);
    pts.push({ x: cc.x + ddx * L.cell * 0.8, y: cc.y + ddy * L.cell * 0.8, col: full.col });
  }
  return pts;
}
function drawPrismRay(c, L) {
  var pts = prismPolyline(L), i, w = L.cell, a, b, col;
  if (pts.length < 2) return;
  c.lineCap = 'round';
  for (i = 1; i < pts.length; i++) {
    a = pts[i - 1]; b = pts[i];
    // Jana ruudun keskeltä seuraavaan: väri vaihtuu lasin kohdalla (b:n ruudussa)
    col = PRISM_COLORS[a.col];
    c.strokeStyle = artRGBA(col === '#ffffff' ? '#fff4b0' : col, 0.3);
    c.lineWidth = w * 0.2;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.strokeStyle = artRGBA(col === '#ffffff' ? '#fffbe0' : col, 0.8);
    c.lineWidth = w * 0.08;
    c.stroke();
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, w * 0.025);
    c.stroke();
  }
  var e = pts[pts.length - 1];
  if (prism.stop === 'rock' || prism.stop === 'bee') artGlow(c, e.x, e.y, w * 0.2, '#fff4c0', 0.7);
}

function drawPrism() {
  var c = ctx, L, i, cl, cc, col, row, b;
  if (!beginPlayWorld()) return;
  drawPrismSun(c);
  if (prism.state !== 'intro') {
    L = prismLayout();
    var sp = prismSrcPos(L), su = prismSunPos();
    c.strokeStyle = 'rgba(255,245,200,' + (prism.state === 'cloud' ? 0.05 : 0.18) + ')';
    c.lineWidth = L.cell * 0.12;
    c.beginPath(); c.moveTo(sp.x, sp.y); c.lineTo(su.x, su.y); c.stroke();
    for (i = 0; i < prism.grid.length; i++) {
      col = i % L.cols; row = Math.floor(i / L.cols);
      cc = prismCellCenter(col, row, L);
      drawPrismTile(c, cc.x, cc.y, L.cell, prism.grid[i], col + row);
    }
    if (prism.state !== 'cloud') drawPrismRay(c, L);
    for (i = 0; i < prism.grid.length; i++) {
      cl = prism.grid[i];
      if (cl.pop > 0.15) continue;
      col = i % L.cols; row = Math.floor(i / L.cols);
      cc = prismCellCenter(col, row, L);
      if (cl.type === 'mirror') drawBeamMirror(c, cc.x, cc.y, L.cell, cl);
      else if (cl.type === 'rock') drawBeamRock(c, cc.x, cc.y, L.cell, cl);
      else if (cl.type === 'filter') drawPrismFilter(c, cc.x, cc.y, L.cell, cl);
      else if (cl.type === 'flower') drawPrismFlower(c, cc.x, cc.y, L.cell, cl);
      if (cl.fly && !cl.fly.got) drawPrismButterfly(c, cc.x, cc.y - L.cell * 0.1, L.cell, cl.fly, cl.fly.t);
    }
    drawPrismStone(c, L);
    b = prism.bee;
    if (b && b.state !== 'gone') drawPrismBee(c, b, viewH * 0.035);
    if (!prism.tapped && prism.state === 'play' && prism.hintT > 1.5) {
      for (i = 0; i < prism.path.length; i++) {
        cl = prismCell(prism.path[i].c, prism.path[i].r);
        if (cl && cl.type === 'mirror' && cl.onPath && cl.o !== cl.sol) {
          cc = prismCellCenter(prism.path[i].c, prism.path[i].r, L);
          var tk = (prism.hintT % 1.2) / 1.2;
          drawHand(c, cc.x + L.cell * 0.05, cc.y + L.cell * 0.05 + Math.abs(Math.sin(tk * Math.PI)) * L.cell * 0.12, viewH * 0.035);
          break;
        }
      }
    }
  }
  drawPrincessFree(c, viewW * 0.085, viewH * 0.93, viewH / 470, 1, 0, false, globalT);
  for (i = 0; i < prism.flying.length; i++) {
    var fl = prism.flying[i];
    drawPrismButterfly(c, fl.x, fl.y, viewH * 0.12, { col: fl.col, got: true }, globalT);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawPrismHud(c);
  drawTaskOverlay(c);
}

// HUD: kierrokset värikukkina ja lehahtaneet perhoset
function drawPrismHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = PRISM_ROUNDS.length, x, cols = [1, 3, 5, 6];
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 3 * n + pad + hs * 5.5, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < prism.round || prism.state === 'won' || (i === prism.round && prism.state === 'roundDone');
    c.globalAlpha = done ? 1 : (i === prism.round ? 0.75 : 0.3);
    drawPrismFlower(c, left + pad * 0.5 + hs * 1.5 + i * hs * 3, pad * 0.5 + hs * 1.5, hs * 4, { want: cols[i], bloom: done ? 1 : 0, wig: 0, lit: done });
    c.globalAlpha = 1;
  }
  x = left + pad * 0.5 + hs * 3 * n + hs * 1.2;
  drawPrismButterfly(c, x, pad * 0.5 + hs * 1.8, hs * 6, { col: '#ff7bac', got: false }, globalT);
  c.fillStyle = '#5a3a8a';
  c.font = 'bold ' + Math.round(hs * 1.4) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(prism.flyGot + '', x + hs * 1.0, pad * 0.5 + hs * 1.85);
  c.textBaseline = 'alphabetic';
}

HUB_ICONS.prism = function (c, x, y, s) {
  c.lineCap = 'round';
  c.lineWidth = Math.max(2, s * 0.04);
  c.strokeStyle = '#fff4b0';
  c.beginPath(); c.moveTo(x - s * 0.26, y + s * 0.1); c.lineTo(x - s * 0.06, y + s * 0.1); c.stroke();
  c.strokeStyle = PRISM_COLORS[1];
  c.beginPath(); c.moveTo(x - s * 0.02, y + s * 0.1); c.lineTo(x + s * 0.2, y + s * 0.1); c.stroke();
  drawPrismFilter(c, x - s * 0.04, y + s * 0.1, s * 0.22, { bit: 1, wig: 0 });
  drawPrismFlower(c, x + s * 0.16, y - s * 0.12, s * 0.4, { want: 1, bloom: 1, wig: 0, lit: true });
};
