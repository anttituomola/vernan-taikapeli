'use strict';

// Kuunsäde (Kaukamaa, Hohtometsä): uusi verbi KÄÄNTÖ. Kuukivi kerää kuun
// valon ja lähettää säteen kivilaattojen yli. Laatoilla on kristallipeilejä:
// napautus kääntää peiliä neljänneskierroksen (/ <-> \), ja säde kimpoaa
// peileistä. Säde sytyttää kuukukat, jotka se läpäisee; kun kaikki kukat
// hehkuvat yhtä aikaa, kierros on valmis. Kivet pysäyttävät säteen.
// Joka kierros arvotaan: säteen reitti, peilit, hämäyspeilit, kivet ja kukat.
// Neljä kovenevaa kierrosta (2 -> 5 peiliä, 1 -> 3 kukkaa). Kolmannesta
// kierroksesta alkaen varjokoi lentää säteellä olevan peilin päälle ja
// pimentää säteen: napauta koi pois. Toisesta kierroksesta alkaen kuu laskee:
// jos kuu ehtii laskea, pilvi peittää sen ja kierros arvotaan uudestaan.
// Nukkuvat tulikärpäset ovat bonuksia: ne heräävät, kun säde osuu niihin
// (usein vain "väärällä" peiliasennolla). Tehtävät 2. ja 3. kierroksen jälkeen.

// cols × rows ruudukko, mirrors: säteen reitin peilit, flowers: kukat,
// decoys: hämäyspeilit reitin ulkopuolella, rocks: kivet, flies: bonuskärpäset,
// time: kuun laskuaika (s, 0 = ei aikarajaa), moth: koin saapumisväli (s, 0 = ei koita)
var BEAM_ROUNDS = [
  { cols: 4, rows: 3, mirrors: 2, flowers: 1, decoys: 0, rocks: 0, flies: 1, time: 0, moth: 0 },
  { cols: 5, rows: 4, mirrors: 3, flowers: 2, decoys: 1, rocks: 1, flies: 1, time: 70, moth: 0 },
  { cols: 5, rows: 4, mirrors: 4, flowers: 2, decoys: 2, rocks: 2, flies: 2, time: 65, moth: 7 },
  { cols: 6, rows: 4, mirrors: 5, flowers: 3, decoys: 3, rocks: 2, flies: 2, time: 60, moth: 5 }
];
var BEAM_GROW = 9;        // säteen kasvunopeus (ruutua / s)
var BEAM_HOLD = 0.8;      // kaikkien kukkien pitää hehkua näin kauan (s)
var BEAM_TURN_T = 0.22;   // peilin kääntöanimaatio (s)

var beam = {
  round: 0, state: 'intro', t: 0, R: null, grid: [], src: null,
  path: [], hitsLen: 0, drawLen: 0, allLitT: 0, timeLeft: 0, cloudT: 0,
  moth: null, mothWait: 0, flying: [], flyGot: 0, flyTotal: 0,
  tapped: false, hintT: 0, taskDelay: -1, taps: 0
};

// ---------- Ruudukko ----------
function beamLayout() {
  var R = beam.R || BEAM_ROUNDS[0], left = viewW * 0.2, right = viewW * 0.94, top = viewH * 0.17, bot = viewH * 0.95;
  var cell = Math.min((right - left) / R.cols, (bot - top) / R.rows, viewH * 0.22);
  var ox = left + (right - left - cell * R.cols) / 2, oy = top + (bot - top - cell * R.rows) / 2;
  return { cell: cell, ox: ox, oy: oy, cols: R.cols, rows: R.rows };
}
function beamCellCenter(c, r, L) {
  L = L || beamLayout();
  return { x: L.ox + (c + 0.5) * L.cell, y: L.oy + (r + 0.5) * L.cell };
}
// Kuukivi leijuu ruudukon vasemmalla puolella lähtörivin kohdalla
function beamSrcPos(L) {
  L = L || beamLayout();
  return { x: L.ox - L.cell * 0.62, y: L.oy + (beam.src.r + 0.5) * L.cell };
}
// Peilit: o = 0 on '/', o = 1 on '\'
function beamReflect(o, dx, dy) {
  return o === 0 ? { dx: -dy, dy: -dx } : { dx: dy, dy: dx };
}
function beamCell(c, r) {
  var R = beam.R;
  if (c < 0 || r < 0 || c >= R.cols || r >= R.rows) return null;
  return beam.grid[r * R.cols + c];
}

// Säteen jäljitys: lista ruutuja, joiden läpi säde kulkee, ja loppupiste.
// Koi peilin päällä ja kivi pysäyttävät säteen.
function beamTrace() {
  var c = 0, r = beam.src.r, dx = 1, dy = 0, pts = [], cl, n = 0, nd, stop = null;
  while (n++ < 200) {
    cl = beamCell(c, r);
    if (!cl) { stop = 'out'; break; }
    if (cl.type === 'rock') { stop = 'rock'; pts.push({ c: c, r: r, dx: dx, dy: dy, end: true }); break; }
    if (cl.type === 'mirror' && beam.moth && beam.moth.state === 'sit' && beam.moth.c === c && beam.moth.r === r) {
      stop = 'moth'; pts.push({ c: c, r: r, dx: dx, dy: dy, end: true }); break;
    }
    pts.push({ c: c, r: r, dx: dx, dy: dy });
    if (cl.type === 'mirror') {
      nd = beamReflect(cl.o, dx, dy);
      dx = nd.dx; dy = nd.dy;
      pts[pts.length - 1].odx = dx; pts[pts.length - 1].ody = dy;
    }
    c += dx; r += dy;
  }
  return { pts: pts, stop: stop, exitDx: dx, exitDy: dy };
}

// ---------- Kierroksen arvonta ----------
function beamRandInt(n) { return Math.floor(Math.random() * n); }
function beamGenerate(R) {
  var attempt, g, i;
  for (attempt = 0; attempt < 400; attempt++) {
    g = beamTryGenerate(R);
    if (g) return g;
  }
  // Varareitti: suora rivi yhdellä kukalla (ei pitäisi koskaan tarvita)
  g = { grid: [], src: { r: 0 }, flies: 0 };
  for (i = 0; i < R.cols * R.rows; i++) g.grid.push({ type: 'empty' });
  g.grid[R.cols - 1] = { type: 'flower', lit: false, bloom: 0, wig: 0 };
  return g;
}
function beamTryGenerate(R) {
  var cols = R.cols, rows = R.rows, grid = [], used = {}, i, c, r0, r, dx, dy, turns = 0, s, k, seg = 0;
  var straight = [], pathMirrors = [], key, nd, opts, pick, need;
  for (i = 0; i < cols * rows; i++) grid.push({ type: 'empty' });
  function inG(cc, rr) { return cc >= 0 && rr >= 0 && cc < cols && rr < rows; }
  r0 = beamRandInt(rows);
  c = 0; r = r0; dx = 1; dy = 0;
  // Reitti: 0–2 suoraa ruutua ja peili, kunnes peilejä on tarpeeksi; sitten suoraan ulos
  while (turns < R.mirrors) {
    s = beamRandInt(3);
    if (turns === 0 && Math.random() < 0.4) s = 0;
    for (k = 0; k < s; k++) {
      if (!inG(c, r) || used[c + ',' + r]) return null;
      used[c + ',' + r] = true;
      straight.push({ c: c, r: r, seg: seg });
      c += dx; r += dy;
    }
    if (!inG(c, r) || used[c + ',' + r]) return null;
    used[c + ',' + r] = true;
    // Käännös vasemmalle tai oikealle; seuraavan ruudun on oltava vapaana ruudukossa
    opts = [];
    if (inG(c - dy, r + dx) && !used[(c - dy) + ',' + (r + dx)]) opts.push({ dx: -dy, dy: dx });
    if (inG(c + dy, r - dx) && !used[(c + dy) + ',' + (r - dx)]) opts.push({ dx: dy, dy: -dx });
    if (!opts.length) return null;
    pick = opts[beamRandInt(opts.length)];
    // Peilin asento, joka kääntää tulosuunnan valittuun suuntaan
    nd = beamReflect(0, dx, dy);
    var o = nd.dx === pick.dx && nd.dy === pick.dy ? 0 : 1;
    grid[r * cols + c] = { type: 'mirror', o: o, sol: o, ang: 0, turnT: 0, onPath: true };
    pathMirrors.push(grid[r * cols + c]);
    dx = pick.dx; dy = pick.dy;
    c += dx; r += dy;
    turns++;
    seg++;
  }
  // Viimeisen peilin jälkeen suoraan ulos; vähintään yksi ruutu kukalle
  if (!inG(c, r)) return null;
  while (inG(c, r)) {
    if (used[c + ',' + r]) return null;
    used[c + ',' + r] = true;
    straight.push({ c: c, r: r, seg: seg });
    c += dx; r += dy;
  }
  // Kukat: yksi viimeisellä osuudella, muut eri osuuksille (ei ennen ensimmäistä peiliä)
  var last = straight.filter(function (p) { return p.seg === seg; });
  var others = straight.filter(function (p) { return p.seg > 0 && p.seg < seg; });
  if (!last.length) return null;
  var flowers = [last[beamRandInt(last.length)]];
  var segsUsed = {};
  segsUsed[seg] = true;
  // Sekoitetaan ja valitaan eri osuuksilta
  for (i = others.length - 1; i > 0; i--) { k = beamRandInt(i + 1); var tmp = others[i]; others[i] = others[k]; others[k] = tmp; }
  for (i = 0; i < others.length && flowers.length < R.flowers; i++) {
    if (segsUsed[others[i].seg]) continue;
    segsUsed[others[i].seg] = true;
    flowers.push(others[i]);
  }
  if (flowers.length < R.flowers) return null;
  for (i = 0; i < flowers.length; i++) grid[flowers[i].r * cols + flowers[i].c] = { type: 'flower', lit: false, bloom: 0, wig: 0 };
  // Vapaat ruudut: kivet ja hämäyspeilit
  var free = [];
  for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) if (!used[c + ',' + r]) free.push({ c: c, r: r });
  if (free.length < R.rocks + R.decoys + R.flies) return null;
  for (i = free.length - 1; i > 0; i--) { k = beamRandInt(i + 1); var t2 = free[i]; free[i] = free[k]; free[k] = t2; }
  for (i = 0; i < R.rocks; i++) grid[free[i].r * cols + free[i].c] = { type: 'rock', wig: 0 };
  for (i = R.rocks; i < R.rocks + R.decoys; i++) grid[free[i].r * cols + free[i].c] = { type: 'mirror', o: beamRandInt(2), sol: -1, ang: 0, turnT: 0, onPath: false };
  // Sekoitus: vähintään puolet reitin peileistä väärin päin, eikä alkuasento saa ratkaista
  var g = { grid: grid, src: { r: r0 } };
  need = Math.max(1, Math.ceil(R.mirrors * 0.5));
  var wrong = 0;
  for (i = 0; i < pathMirrors.length; i++) {
    if (i === 0 || Math.random() < 0.55) { pathMirrors[i].o = 1 - pathMirrors[i].sol; wrong++; }
  }
  for (i = 0; i < pathMirrors.length && wrong < need; i++) {
    if (pathMirrors[i].o === pathMirrors[i].sol) { pathMirrors[i].o = 1 - pathMirrors[i].sol; wrong++; }
  }
  // Bonuskärpäset ruutuihin, joihin säde osuu jollakin muulla peiliasennolla
  var saveGrid = beam.grid, saveSrc = beam.src, saveR = beam.R, saveMoth = beam.moth;
  beam.grid = grid; beam.src = g.src; beam.R = R; beam.moth = null;
  var mirrorsAll = [], seen = {}, trial, tr, j, orig = [];
  for (i = 0; i < grid.length; i++) if (grid[i].type === 'mirror') { mirrorsAll.push(grid[i]); orig.push(grid[i].o); }
  var solved = beamSolvedNow();
  for (trial = 0; trial < 160; trial++) {
    for (j = 0; j < mirrorsAll.length; j++) mirrorsAll[j].o = beamRandInt(2);
    tr = beamTrace();
    for (j = 0; j < tr.pts.length; j++) if (grid[tr.pts[j].r * cols + tr.pts[j].c].type === 'empty') seen[tr.pts[j].c + ',' + tr.pts[j].r] = true;
  }
  for (j = 0; j < mirrorsAll.length; j++) mirrorsAll[j].o = orig[j];
  // Ratkaisu toimii: reitin peilit oikein päin sytyttävät kaikki kukat
  var solOk;
  for (j = 0; j < mirrorsAll.length; j++) if (mirrorsAll[j].onPath) mirrorsAll[j].o = mirrorsAll[j].sol;
  solOk = beamSolvedNow();
  for (j = 0; j < mirrorsAll.length; j++) mirrorsAll[j].o = orig[j];
  beam.grid = saveGrid; beam.src = saveSrc; beam.R = saveR; beam.moth = saveMoth;
  if (solved || !solOk) return null;
  var cand = [];
  for (key in seen) if (!used[key]) cand.push(key);
  var nf = 0;
  for (i = cand.length - 1; i > 0; i--) { k = beamRandInt(i + 1); var t3 = cand[i]; cand[i] = cand[k]; cand[k] = t3; }
  for (i = 0; i < cand.length && nf < R.flies; i++) {
    var pc = cand[i].split(',');
    var gc = grid[Number(pc[1]) * cols + Number(pc[0])];
    if (gc.type !== 'empty') continue;
    gc.fly = { got: false, t: Math.random() * 6 };
    nf++;
  }
  g.flies = nf;
  return g;
}
// Sytyttäisikö nykyinen asento kaikki kukat?
function beamSolvedNow() {
  var tr = beamTrace(), i, lit = {}, n = 0, total = 0;
  for (i = 0; i < tr.pts.length; i++) {
    var cl = beamCell(tr.pts[i].c, tr.pts[i].r);
    if (cl && cl.type === 'flower' && !tr.pts[i].end) lit[i] = true;
  }
  for (i in lit) n++;
  for (i = 0; i < beam.grid.length; i++) if (beam.grid[i].type === 'flower') total++;
  return total > 0 && n >= total;
}

function beamStartRound() {
  var R = BEAM_ROUNDS[beam.round], g = beamGenerate(R), i;
  beam.R = R;
  beam.grid = g.grid;
  beam.src = g.src;
  beam.flyTotal += g.flies || 0;
  for (i = 0; i < beam.grid.length; i++) {
    var cl = beam.grid[i];
    if (cl.type === 'mirror') cl.ang = cl.o === 0 ? Math.PI / 4 : -Math.PI / 4;
    cl.pop = 0.3 + (i % beam.R.cols) * 0.06 + Math.floor(i / beam.R.cols) * 0.05;
  }
  beam.moth = null;
  beam.mothWait = R.moth ? R.moth * 0.6 : 0;
  beam.path = [];
  beam.drawLen = 0;
  beam.allLitT = 0;
  beam.timeLeft = R.time;
  beam.cloudT = 0;
  beam.state = 'play';
  beam.t = 0;
  beamRetrace();
  playNote(587, 0, 0.12, 'sine', 0.3);
  playNote(880, 0.12, 0.25, 'sine', 0.3);
}
// Uusi jäljitys: säde säilyy yhteiseen alkuosaan asti ja kasvaa siitä eteenpäin
function beamRetrace() {
  var tr = beamTrace(), old = beam.path, i = 0;
  while (i < old.length && i < tr.pts.length && old[i].c === tr.pts[i].c && old[i].r === tr.pts[i].r &&
    old[i].odx === tr.pts[i].odx && old[i].ody === tr.pts[i].ody && !!old[i].end === !!tr.pts[i].end) i++;
  beam.path = tr.pts;
  beam.stop = tr.stop;
  beam.drawLen = Math.min(beam.drawLen, i);
}

// ---------- Alustus ----------
function initBeam() {
  var i;
  tasks = [makeTask(-5, 'route'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  beam.round = 0;
  beam.state = 'intro';
  beam.t = 0;
  beam.R = BEAM_ROUNDS[0];
  beam.grid = [];
  beam.src = { r: 0 };
  beam.path = [];
  beam.flying = [];
  beam.flyGot = 0;
  beam.flyTotal = 0;
  beam.tapped = false;
  beam.hintT = 0;
  beam.taskDelay = -1;
  beam.taps = 0;
  beam.moth = null;
  renderBackground();
}
function respawnBeam() {
  beamStartRound();
}
function resizeBeam() { camX = 0; }

// ---------- Napautus ----------
function handleBeamTap(px, py) {
  if (beam.state !== 'play' || puzzleBusy() || celebrating) return;
  var L = beamLayout(), m = beam.moth, c, r, cl, cc, sp;
  // Koi ensin: napautus lähellä koita häätää sen
  if (m && (m.state === 'sit' || m.state === 'fly')) {
    if (Math.hypot(px - m.x, py - m.y) < Math.max(L.cell * 0.5, viewH * 0.08)) { beamShooMoth(); return; }
  }
  sp = beamSrcPos(L);
  if (Math.hypot(px - sp.x, py - sp.y) < L.cell * 0.4) {
    artPop(sp.x, sp.y, L.cell * 0.5, '#dff4ff', 'ring');
    spawnSparkles(sp.x, sp.y, 8, '#dff4ff');
    playNote(1175, 0, 0.12, 'sine', 0.25);
    return;
  }
  c = Math.floor((px - L.ox) / L.cell);
  r = Math.floor((py - L.oy) / L.cell);
  cl = beamCell(c, r);
  if (!cl) return;
  cc = beamCellCenter(c, r, L);
  if (cl.type === 'mirror') {
    cl.o = 1 - cl.o;
    cl.turnT = BEAM_TURN_T;
    cl.angFrom = cl.ang;
    cl.angTo = cl.ang + Math.PI / 2;
    beam.tapped = true;
    beam.taps++;
    artPop(cc.x, cc.y, L.cell * 0.4, '#bfe8ff', 'ring');
    playNote(1320 + (c + r) * 40, 0, 0.08, 'triangle', 0.25);
    playNote(1760 + (c + r) * 40, 0.05, 0.1, 'sine', 0.18);
    beamRetrace();
  } else if (cl.type === 'flower') {
    cl.wig = 0.5;
    playNote(cl.lit ? 1047 : 523, 0, 0.12, 'sine', 0.25);
  } else if (cl.type === 'rock') {
    cl.wig = 0.4;
    playNote(160, 0, 0.1, 'triangle', 0.25);
  } else {
    spawnSparkles(cc.x, cc.y, 5, '#8fe3d0');
    playNote(740, 0, 0.06, 'sine', 0.15);
  }
}

// ---------- Varjokoi ----------
function beamSendMoth() {
  var i, cand = [], p, cl, L = beamLayout();
  // Kohde: säteen reitillä oleva peili (säde on jo piirtynyt sen kohdalle)
  for (i = 0; i < beam.path.length && i < beam.drawLen; i++) {
    p = beam.path[i];
    cl = beamCell(p.c, p.r);
    if (cl && cl.type === 'mirror') cand.push(p);
  }
  if (!cand.length) { beam.mothWait = 1.5; return; }
  p = cand[Math.max(0, cand.length - 1 - beamRandInt(Math.min(2, cand.length)))];
  var cc = beamCellCenter(p.c, p.r, L), fromLeft = Math.random() < 0.5;
  beam.moth = {
    state: 'fly', c: p.c, r: p.r, t: 0, flap: 0,
    x0: fromLeft ? -viewW * 0.05 : viewW * 1.05, y0: viewH * (0.1 + Math.random() * 0.3),
    x: 0, y: 0, tx: cc.x, ty: cc.y - L.cell * 0.12
  };
  beam.moth.x = beam.moth.x0; beam.moth.y = beam.moth.y0;
  playNote(220, 0, 0.2, 'triangle', 0.12);
}
function beamShooMoth() {
  var m = beam.moth;
  m.state = 'flee';
  m.t = 0;
  m.x0 = m.x; m.y0 = m.y;
  m.tx = m.x < viewW / 2 ? -viewW * 0.1 : viewW * 1.1;
  m.ty = -viewH * 0.1;
  artPop(m.x, m.y, viewH * 0.06, '#b98aff', 'burst');
  spawnSparkles(m.x, m.y, 10, '#b98aff');
  playNote(880, 0, 0.08, 'square', 0.1);
  playNote(1175, 0.06, 0.12, 'sine', 0.2);
  beam.mothWait = beam.R.moth * (0.8 + Math.random() * 0.5);
  beamRetrace();
}

// ---------- Päivitys ----------
function updateBeam(dt) {
  var i, cl, busy, R, L, p, lit, total, k;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  for (i = 0; i < beam.grid.length; i++) {
    cl = beam.grid[i];
    if (cl.pop > 0) cl.pop = Math.max(0, cl.pop - dt);
    if (cl.wig > 0) cl.wig -= dt;
    if (cl.type === 'mirror') {
      if (cl.turnT > 0) {
        cl.turnT = Math.max(0, cl.turnT - dt);
        cl.ang = cl.angFrom + (cl.angTo - cl.angFrom) * easeOutBack(1 - cl.turnT / BEAM_TURN_T);
      }
    }
    if (cl.type === 'flower') cl.bloom += ((cl.lit ? 1 : 0) - cl.bloom) * Math.min(1, dt * 6);
    if (cl.fly && !cl.fly.got) cl.fly.t += dt;
  }
  // Heränneet tulikärpäset lentävät HUD:iin
  for (i = beam.flying.length - 1; i >= 0; i--) {
    p = beam.flying[i];
    p.t += dt;
    k = easeInOutSine(Math.min(1, p.t / 0.8));
    p.x = p.x0 + (p.x1 - p.x0) * k;
    p.y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * viewH * 0.1;
    if (p.t >= 0.8) { beam.flying.splice(i, 1); beam.flyGot++; playNote(1568, 0, 0.1, 'sine', 0.2); }
  }
  if (beam.taskDelay > 0 && !busy) {
    beam.taskDelay -= dt;
    if (beam.taskDelay <= 0) {
      if (beam.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (beam.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) return;
  beam.t += dt;
  if (beam.state === 'intro') {
    if (beam.t > 0.8) beamStartRound();
    return;
  }
  if (beam.state === 'roundDone') {
    if (beam.t > 1.8 && beam.taskDelay <= 0) {
      beam.round++;
      if (beam.round >= BEAM_ROUNDS.length) { beam.state = 'won'; beam.t = 0; soundFanfare(); }
      else beamStartRound();
    }
    return;
  }
  if (beam.state === 'cloud') {
    // Kuu laski: pilvi peittää sen ja kierros arvotaan uudestaan
    beam.cloudT += dt;
    if (beam.cloudT > 1.6) beamStartRound();
    return;
  }
  if (beam.state === 'won') {
    if (beam.t > 1.6) startCelebration();
    return;
  }
  R = beam.R;
  L = beamLayout();
  if (!beam.tapped) beam.hintT += dt;

  // Kuu laskee
  if (R.time > 0) {
    var before = beam.timeLeft;
    beam.timeLeft -= dt;
    if (before > 10 && beam.timeLeft <= 10) playNote(392, 0, 0.25, 'triangle', 0.2);
    if (beam.timeLeft <= 0) {
      beam.state = 'cloud';
      beam.cloudT = 0;
      beam.moth = null;
      playNote(330, 0, 0.3, 'triangle', 0.3);
      playNote(247, 0.25, 0.5, 'triangle', 0.3);
      return;
    }
  }

  // Varjokoi
  if (R.moth > 0) {
    var m = beam.moth;
    if (!m || m.state === 'gone') {
      beam.mothWait -= dt;
      if (beam.mothWait <= 0) beamSendMoth();
    } else {
      m.t += dt;
      m.flap += dt * 14;
      if (m.state === 'fly') {
        k = easeInOutSine(Math.min(1, m.t / 1.8));
        m.x = m.x0 + (m.tx - m.x0) * k;
        m.y = m.y0 + (m.ty - m.y0) * k + Math.sin(m.t * 7) * viewH * 0.02 * (1 - k);
        if (m.t >= 1.8) {
          var tc = beamCell(m.c, m.r);
          if (tc && tc.type === 'mirror') {
            m.state = 'sit';
            m.t = 0;
            playNote(196, 0, 0.25, 'sine', 0.2);
            beamRetrace();
          } else { m.state = 'gone'; beam.mothWait = 1; }
        }
      } else if (m.state === 'sit') {
        m.y = m.ty + Math.sin(m.t * 3) * viewH * 0.004;
      } else if (m.state === 'flee') {
        k = Math.min(1, m.t / 0.9);
        m.x = m.x0 + (m.tx - m.x0) * k * k;
        m.y = m.y0 + (m.ty - m.y0) * k;
        if (k >= 1) m.state = 'gone';
      }
    }
  }

  // Säde kasvaa; kukat syttyvät ja tulikärpäset heräävät, kun säde ehtii niihin
  beam.drawLen = Math.min(beam.path.length, beam.drawLen + dt * BEAM_GROW);
  for (i = 0; i < beam.grid.length; i++) if (beam.grid[i].type === 'flower') beam.grid[i].reach = false;
  for (i = 0; i < beam.path.length; i++) {
    if (i + 0.5 > beam.drawLen) break;
    p = beam.path[i];
    cl = beamCell(p.c, p.r);
    if (!cl || p.end) continue;
    if (cl.type === 'flower') {
      cl.reach = true;
      if (!cl.lit) {
        var fc = beamCellCenter(p.c, p.r, L);
        artPop(fc.x, fc.y, L.cell * 0.45, '#fff6c8', 'burst');
        playNote(784 + i * 30, 0, 0.12, 'sine', 0.28);
        playNote(1175 + i * 30, 0.08, 0.2, 'sine', 0.22);
      }
    }
    if (cl.fly && !cl.fly.got) {
      cl.fly.got = true;
      var fp = beamCellCenter(p.c, p.r, L);
      beam.flying.push({ x0: fp.x, y0: fp.y, x1: hudX() + viewH * 0.2, y1: viewH * 0.12, x: fp.x, y: fp.y, t: 0 });
      artPop(fp.x, fp.y, L.cell * 0.35, '#fff6a0', 'ring');
      playNote(1319, 0, 0.1, 'sine', 0.25);
      playNote(1760, 0.08, 0.14, 'sine', 0.22);
    }
  }
  lit = 0; total = 0;
  for (i = 0; i < beam.grid.length; i++) {
    cl = beam.grid[i];
    if (cl.type !== 'flower') continue;
    total++;
    cl.lit = !!cl.reach;
    if (cl.lit) lit++;
  }
  if (total > 0 && lit === total && beam.drawLen >= beam.path.length) {
    beam.allLitT += dt;
    if (beam.allLitT >= BEAM_HOLD) beamRoundDone(L);
  } else {
    beam.allLitT = 0;
  }
}

function beamRoundDone(L) {
  var i, cl, cc;
  beam.state = 'roundDone';
  beam.t = 0;
  if (beam.moth && beam.moth.state !== 'gone') { beam.moth.state = 'gone'; }
  for (i = 0; i < beam.grid.length; i++) {
    cl = beam.grid[i];
    if (cl.type !== 'flower') continue;
    cc = beamCellCenter(i % beam.R.cols, Math.floor(i / beam.R.cols), L);
    artPop(cc.x, cc.y, L.cell * 0.8, '#fff6c8', 'ring');
    spawnSparkles(cc.x, cc.y, 16, '#fff6c8');
  }
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (beam.round === 1 || beam.round === 2) beam.taskDelay = 1.3;
}

// ---------- Piirto ----------
function renderBeamBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x, y;
  g.addColorStop(0, '#080c30');
  g.addColorStop(0.6, '#142a50');
  g.addColorStop(1, '#1a4450');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 50; i++) {
    x = vw * ((i * 0.137 + 0.03) % 1);
    y = h * ((i * 0.083) % 0.3);
    b.fillStyle = 'rgba(255,255,240,' + (0.2 + (i % 4) * 0.15) + ')';
    b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  // Kaukaiset puut ja sammal
  for (i = 0; i < 9; i++) {
    x = vw * (i / 8);
    b.fillStyle = 'rgba(16,34,58,0.9)';
    b.beginPath(); b.arc(x, h * (0.3 + (i % 3) * 0.03), h * (0.13 + (i % 2) * 0.04), 0, Math.PI * 2); b.fill();
    b.fillRect(x - h * 0.02, h * 0.3, h * 0.04, h * 0.7);
  }
  g = b.createLinearGradient(0, h * 0.35, 0, h);
  g.addColorStop(0, '#16384a');
  g.addColorStop(1, '#0c2230');
  b.fillStyle = g;
  b.fillRect(0, h * 0.35, w, h * 0.65);
  // Hohtosienet vasemmassa reunassa (prinsessan ja kuukiven puolella)
  for (i = 0; i < 5; i++) {
    x = vw * (0.02 + i * 0.035);
    y = h * (0.97 - (i % 2) * 0.02);
    var ms = h * (0.02 + (i % 3) * 0.008), col = ['#5fd4c8', '#ff8ad8', '#b98aff'][i % 3];
    b.fillStyle = '#e8e0ff';
    b.fillRect(x - ms * 0.2, y - ms, ms * 0.4, ms);
    artGlow(b, x, y - ms, ms * 2.4, col, 0.4);
    b.beginPath(); b.arc(x, y - ms, ms * 0.8, Math.PI, 0); b.closePath();
    artFillPath(b, col, y - ms * 1.8, y - ms, ms, { line: false });
  }
}

// Kuu kulkee taivaan poikki ajan mukana; aikarajattomalla kierroksella se on paikallaan
function beamMoonPos() {
  var R = beam.R, k = R && R.time > 0 ? 1 - Math.max(0, beam.timeLeft) / R.time : 0.3;
  return { x: viewW * (0.3 + k * 0.62), y: viewH * (0.075 + Math.pow(k - 0.3, 2) * 0.12) };
}
function drawBeamMoon(c) {
  var R = beam.R, x, y, r = viewH * 0.04, dim, mp = beamMoonPos();
  if (!R) return;
  x = mp.x; y = mp.y;
  dim = R.time > 0 && beam.timeLeft < 10 && beam.state === 'play';
  artGlow(c, x, y, r * 3, dim ? '#ffb070' : '#e8f4ff', 0.35 + (dim ? Math.sin(globalT * 6) * 0.15 : 0));
  artCircle(c, x, y, r, dim ? '#ffd8a8' : '#f4f8ff', { lineColor: dim ? '#c88a50' : '#aabbe0', hi: 0.3 });
  c.fillStyle = 'rgba(170,185,220,0.45)';
  c.beginPath(); c.arc(x - r * 0.3, y + r * 0.15, r * 0.2, 0, Math.PI * 2); c.arc(x + r * 0.25, y - r * 0.25, r * 0.13, 0, Math.PI * 2); c.fill();
  // Aikarajan kaari kuun ympärillä
  if (R.time > 0 && beam.state === 'play') {
    c.strokeStyle = dim ? 'rgba(255,190,120,0.9)' : 'rgba(255,255,255,0.7)';
    c.lineWidth = Math.max(2, r * 0.14);
    c.beginPath(); c.arc(x, y, r * 1.35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (beam.timeLeft / R.time)); c.stroke();
  }
  // Pilvi peittää laskeneen kuun
  if (beam.state === 'cloud') {
    var ck = easeOutCubic(beam.cloudT / 0.8);
    c.globalAlpha = 0.95;
    artBlob(c, x - r * 2.5 + ck * r * 2.5, y + r * 0.2, r * 1.8, r * 0.9, '#5a6488', { line: false });
    artBlob(c, x + r * 2.8 - ck * r * 2.3, y - r * 0.1, r * 1.5, r * 0.8, '#4a5478', { line: false });
    c.globalAlpha = 1;
  }
}

function drawBeamTile(c, x, y, s, cl, i) {
  var pop = cl.pop > 0 ? easeOutBack(1 - Math.min(1, cl.pop / 0.3)) : 1;
  if (pop <= 0.01) return;
  c.save();
  c.translate(x, y);
  c.scale(pop, pop);
  artRoundRect(c, -s * 0.46, -s * 0.46, s * 0.92, s * 0.92, s * 0.14, (i % 2) ? '#23505e' : '#285866', { lineColor: '#123040' });
  c.fillStyle = 'rgba(120,200,170,0.18)';
  c.beginPath(); c.arc(-s * 0.28, s * 0.3, s * 0.1, 0, Math.PI * 2); c.arc(s * 0.3, -s * 0.28, s * 0.07, 0, Math.PI * 2); c.fill();
  c.restore();
}

function drawBeamMirror(c, x, y, s, cl) {
  var a = cl.ang, L = s * 0.36, wd = s * 0.1;
  artShadow(c, x, y + s * 0.3, s * 0.3, s * 0.08);
  artCircle(c, x, y + s * 0.26, s * 0.14, '#7a7a9a', { lineColor: '#44445a' });
  c.save();
  c.translate(x, y);
  c.rotate(a);
  artGlow(c, 0, 0, s * 0.45, '#9fdcff', 0.18);
  artRoundRect(c, -wd / 2, -L, wd, L * 2, wd * 0.4, '#cfeeff', { lineColor: '#5a8ab8' });
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.fillRect(-wd * 0.15, -L * 0.8, wd * 0.2, L * 1.1);
  c.restore();
}

function drawBeamRock(c, x, y, s, cl) {
  var wg = cl.wig > 0 ? Math.sin(globalT * 40) * s * 0.03 : 0;
  artShadow(c, x, y + s * 0.3, s * 0.34, s * 0.09);
  artBlob(c, x + wg, y + s * 0.06, s * 0.34, s * 0.26, '#6a6a86', { lineColor: '#3a3a50', hi: 0.25 });
  artBlob(c, x - s * 0.12 + wg, y - s * 0.1, s * 0.14, s * 0.06, '#4f9a7a', { line: false });
}

function drawBeamFlower(c, x, y, s, cl) {
  var b = cl.bloom, wg = cl.wig > 0 ? Math.sin(globalT * 30) * 0.2 : Math.sin(globalT * 1.5 + x) * 0.05, i, ang, pr;
  artShadow(c, x, y + s * 0.34, s * 0.22, s * 0.06);
  c.strokeStyle = '#3a8a5a';
  c.lineWidth = Math.max(2, s * 0.05);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + s * 0.34); c.quadraticCurveTo(x + s * 0.05, y + s * 0.15, x + Math.sin(wg) * s * 0.1, y); c.stroke();
  artBlob(c, x - s * 0.1, y + s * 0.22, s * 0.09, s * 0.04, '#4fae6a', { line: false, rot: -0.5 });
  c.save();
  c.translate(x + Math.sin(wg) * s * 0.1, y);
  c.rotate(wg);
  if (b > 0.05) artGlow(c, 0, 0, s * (0.4 + b * 0.5), '#fff6c8', 0.3 + b * 0.4);
  // Terälehdet avautuvat valossa
  pr = s * (0.1 + b * 0.12);
  for (i = 0; i < 6; i++) {
    ang = i / 6 * Math.PI * 2 + globalT * 0.2 * b;
    var dx = Math.cos(ang) * pr * (0.4 + b * 0.6), dy = Math.sin(ang) * pr * (0.4 + b * 0.6);
    artBlob(c, dx, dy, pr * 0.75, pr * 0.5, artMix('#8a6ab8', '#fff8e8', b), { lineColor: artMix('#5a3a8a', '#d9b84a', b), rot: ang });
  }
  artCircle(c, 0, 0, s * 0.07, artMix('#6a4a9a', '#ffd24f', b), { line: false });
  c.restore();
}

function drawBeamSleepFly(c, x, y, s, f) {
  var bob = Math.sin(f.t * 2) * s * 0.03;
  artGlow(c, x, y + bob, s * 0.2, '#fff6a0', 0.25 + Math.sin(f.t * 1.5) * 0.1);
  artBlob(c, x, y + bob, s * 0.07, s * 0.05, '#c8b870', { lineColor: '#7a6a30' });
  // Zzz
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.font = 'bold ' + Math.round(s * 0.12) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.fillText('z', x + s * 0.12, y - s * 0.1 - (f.t % 2) * s * 0.05);
}

function drawBeamStone(c, L) {
  var sp = beamSrcPos(L), s = L.cell, bob = Math.sin(globalT * 2) * s * 0.03;
  artGlow(c, sp.x, sp.y + bob, s * 0.6, '#bfe8ff', 0.45 + Math.sin(globalT * 3) * 0.1);
  c.beginPath();
  c.moveTo(sp.x, sp.y + bob - s * 0.26);
  c.lineTo(sp.x + s * 0.17, sp.y + bob);
  c.lineTo(sp.x, sp.y + bob + s * 0.26);
  c.lineTo(sp.x - s * 0.17, sp.y + bob);
  c.closePath();
  artFillPath(c, '#dff4ff', sp.y - s * 0.26, sp.y + s * 0.26, s * 0.2, { lineColor: '#5a8ab8' });
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.moveTo(sp.x - s * 0.02, sp.y + bob - s * 0.18); c.lineTo(sp.x - s * 0.1, sp.y + bob); c.lineTo(sp.x - s * 0.02, sp.y + bob); c.closePath(); c.fill();
}

// Säteen polku pisteinä (ruudun keskipisteet), leikattuna piirtopituuteen
function beamPolyline(L) {
  var pts = [], sp = beamSrcPos(L), i, p, cc, n = beam.drawLen, full, frac, last;
  pts.push({ x: sp.x + L.cell * 0.17, y: sp.y });
  for (i = 0; i < beam.path.length; i++) {
    p = beam.path[i];
    cc = beamCellCenter(p.c, p.r, L);
    // Kivi ja koi pysäyttävät säteen ruudun reunaan
    if (p.end) { cc = { x: cc.x - p.dx * L.cell * 0.32, y: cc.y - p.dy * L.cell * 0.32 }; }
    if (i + 0.5 > n) {
      last = pts[pts.length - 1];
      frac = Math.max(0, Math.min(1, (n - (i - 0.5)) / 1));
      pts.push({ x: last.x + (cc.x - last.x) * frac, y: last.y + (cc.y - last.y) * frac });
      return pts;
    }
    pts.push(cc);
  }
  // Ulos ruudukosta
  full = beam.path.length ? beam.path[beam.path.length - 1] : null;
  if (full && !full.end && n >= beam.path.length) {
    var ddx = full.odx !== undefined ? full.odx : full.dx, ddy = full.ody !== undefined ? full.ody : full.dy;
    cc = beamCellCenter(full.c, full.r, L);
    pts.push({ x: cc.x + ddx * L.cell * 0.8, y: cc.y + ddy * L.cell * 0.8 });
  } else if (!full && n >= 0) {
    pts.push({ x: L.ox + L.cell * 0.2, y: sp.y });
  }
  return pts;
}

function drawBeamRay(c, L) {
  var pts = beamPolyline(L), i, w = L.cell;
  if (pts.length < 2) return;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(140,210,255,0.22)';
  c.lineWidth = w * 0.2;
  c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
  for (i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.stroke();
  c.strokeStyle = 'rgba(210,240,255,0.55)';
  c.lineWidth = w * 0.09;
  c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(2, w * 0.03);
  c.stroke();
  // Valokipinät kulkevat säteellä
  var tot = 0, seg = [], d;
  for (i = 1; i < pts.length; i++) { d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); tot += d; }
  if (tot <= 0) return;
  for (var k = 0; k < 8; k++) {
    var at = ((globalT * w * 1.8 + k * tot / 8) % tot), j = 0;
    while (j < seg.length - 1 && at > seg[j]) { at -= seg[j]; j++; }
    var f = seg[j] > 0 ? at / seg[j] : 0;
    artGlow(c, pts[j].x + (pts[j + 1].x - pts[j].x) * f, pts[j].y + (pts[j + 1].y - pts[j].y) * f, w * 0.09, '#ffffff', 0.8);
  }
  // Säteen pää hehkuu, jos se pysähtyi kiveen tai koihin
  var e = pts[pts.length - 1];
  if (beam.stop === 'rock' || beam.stop === 'moth') artGlow(c, e.x, e.y, w * 0.2, '#dff4ff', 0.7);
}

function drawBeamMothShape(c, m, s) {
  var fl = Math.sin(m.flap) * (m.state === 'sit' ? 0.12 : 0.35);
  artGlow(c, m.x, m.y, s * 2.2, '#2a1040', 0.5);
  c.fillStyle = '#3a2a5a';
  c.beginPath(); c.ellipse(m.x - s * 0.7, m.y - s * 0.1, s * 0.8, s * (0.55 + fl * 0.3), -0.6 + fl, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(m.x + s * 0.7, m.y - s * 0.1, s * 0.8, s * (0.55 + fl * 0.3), 0.6 - fl, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#5a3a8a';
  c.beginPath(); c.arc(m.x - s * 0.8, m.y - s * 0.15, s * 0.22, 0, Math.PI * 2); c.arc(m.x + s * 0.8, m.y - s * 0.15, s * 0.22, 0, Math.PI * 2); c.fill();
  artBlob(c, m.x, m.y, s * 0.28, s * 0.55, '#241838', { lineColor: '#0e0818' });
  c.fillStyle = '#ff8aa0';
  c.beginPath(); c.arc(m.x - s * 0.1, m.y - s * 0.35, s * 0.07, 0, Math.PI * 2); c.arc(m.x + s * 0.1, m.y - s * 0.35, s * 0.07, 0, Math.PI * 2); c.fill();
}

function drawBeam() {
  var c = ctx, L, i, cl, cc, col, row, m;
  if (!beginPlayWorld()) return;
  drawBeamMoon(c);
  // Prinsessa katsoo vasemmassa alakulmassa
  drawPrincessFree(c, viewW * 0.085, viewH * 0.93, viewH / 470, 1, 0, false, globalT);
  if (beam.state !== 'intro') {
    L = beamLayout();
    // Kuun valo virtaa kiveen
    var sp = beamSrcPos(L);
    c.strokeStyle = 'rgba(200,230,255,' + (beam.state === 'cloud' ? 0.05 : 0.12) + ')';
    c.lineWidth = L.cell * 0.12;
    var mp = beamMoonPos();
    c.beginPath(); c.moveTo(sp.x, sp.y); c.lineTo(mp.x, mp.y); c.stroke();
    for (i = 0; i < beam.grid.length; i++) {
      col = i % L.cols; row = Math.floor(i / L.cols);
      cc = beamCellCenter(col, row, L);
      drawBeamTile(c, cc.x, cc.y, L.cell, beam.grid[i], col + row);
    }
    if (beam.state !== 'cloud') drawBeamRay(c, L);
    for (i = 0; i < beam.grid.length; i++) {
      cl = beam.grid[i];
      if (cl.pop > 0.15) continue;
      col = i % L.cols; row = Math.floor(i / L.cols);
      cc = beamCellCenter(col, row, L);
      if (cl.type === 'mirror') drawBeamMirror(c, cc.x, cc.y, L.cell, cl);
      else if (cl.type === 'rock') drawBeamRock(c, cc.x, cc.y, L.cell, cl);
      else if (cl.type === 'flower') drawBeamFlower(c, cc.x, cc.y, L.cell, cl);
      if (cl.fly && !cl.fly.got) drawBeamSleepFly(c, cc.x, cc.y, L.cell, cl.fly);
    }
    drawBeamStone(c, L);
    m = beam.moth;
    if (m && m.state !== 'gone') drawBeamMothShape(c, m, viewH * 0.045);
    // Vihje: käsi napauttaa ensimmäistä väärin päin olevaa peiliä säteen reitillä
    if (!beam.tapped && beam.state === 'play' && beam.hintT > 1.5) {
      for (i = 0; i < beam.path.length; i++) {
        cl = beamCell(beam.path[i].c, beam.path[i].r);
        if (cl && cl.type === 'mirror' && cl.onPath && cl.o !== cl.sol) {
          cc = beamCellCenter(beam.path[i].c, beam.path[i].r, L);
          var tk = (beam.hintT % 1.2) / 1.2;
          drawHand(c, cc.x + L.cell * 0.05, cc.y + L.cell * 0.05 + Math.abs(Math.sin(tk * Math.PI)) * L.cell * 0.12, viewH * 0.035);
          break;
        }
      }
    }
  }
  for (i = 0; i < beam.flying.length; i++) {
    var fl = beam.flying[i];
    artGlow(c, fl.x, fl.y, viewH * 0.05, '#fff6a0', 0.7);
    artCircle(c, fl.x, fl.y, viewH * 0.012, '#fff6a0', { line: false });
  }
  if (beam.state === 'won') {
    var wk = Math.min(1, beam.t / 1.2);
    c.fillStyle = 'rgba(255,248,210,' + (wk * 0.25) + ')';
    c.fillRect(0, 0, viewW, viewH);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawBeamHud(c);
  drawTaskOverlay(c);
}

// HUD: kierrokset kuukukkina ja herätetyt tulikärpäset
function drawBeamHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = BEAM_ROUNDS.length, x;
  c.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(c, left, pad * 0.5, hs * 3 * n + pad + hs * 5.5, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < beam.round || beam.state === 'won' || (i === beam.round && beam.state === 'roundDone');
    c.globalAlpha = done ? 1 : (i === beam.round ? 0.75 : 0.3);
    drawBeamFlower(c, left + pad * 0.5 + hs * 1.5 + i * hs * 3, pad * 0.5 + hs * 1.5, hs * 4, { bloom: done ? 1 : 0, wig: 0 });
    c.globalAlpha = 1;
  }
  x = left + pad * 0.5 + hs * 3 * n + hs * 1.2;
  artGlow(c, x, pad * 0.5 + hs * 1.8, hs * 1.5, '#fff6a0', 0.6);
  artCircle(c, x, pad * 0.5 + hs * 1.8, hs * 0.5, '#fff6a0', { line: false });
  c.fillStyle = '#ffffff';
  c.font = 'bold ' + Math.round(hs * 1.4) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(beam.flyGot + '', x + hs * 1.0, pad * 0.5 + hs * 1.85);
  c.textBaseline = 'alphabetic';
}

HUB_ICONS.beam = function (c, x, y, s) {
  c.strokeStyle = 'rgba(210,240,255,0.9)';
  c.lineWidth = Math.max(2, s * 0.035);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - s * 0.24, y + s * 0.08); c.lineTo(x, y + s * 0.08); c.lineTo(x, y - s * 0.16); c.stroke();
  c.save();
  c.translate(x, y + s * 0.08);
  c.rotate(-Math.PI / 4);
  artRoundRect(c, -s * 0.02, -s * 0.1, s * 0.04, s * 0.2, s * 0.015, '#cfeeff', { lineColor: '#5a8ab8' });
  c.restore();
  drawBeamFlower(c, x, y - s * 0.2, s * 0.4, { bloom: 1, wig: 0 });
};
