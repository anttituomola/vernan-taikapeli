'use strict';

// Vesikouru (Kaukamaa, Kellopaja): napautus kääntää kourupalaa
// neljänneskierroksen myötäpäivään, ja vesi virtaa lähteestä heti pitkin
// yhteen sopivia paloja. Kun vesi yltää myllyyn, myllynratas pyörii. Jos
// kourussa on avoin pää (pala ei jatku tai osoittaa reunan yli), vesi
// roiskuu siitä yli. Kierros onnistuu, kun kaikki myllyt pyörivät eikä vettä
// vuoda mihinkään. Kuunsäteen sukulainen (palaute: peilipulmat olivat hyviä).
// Neljä arvottua, kovenevaa kierrosta: yksi mylly; hämäyspalat; kaksi myllyä ja
// jakopala (T); kolme myllyä. Kolmannesta kierroksesta alkaen pajan kello käy
// (aikaraja): ajan loppuessa pato sulkeutuu ja kierros arvotaan uudestaan.
// Ruuvatut palat eivät käänny (ne ovat valmiiksi oikein). Ratkaisu rakennetaan
// ensin (puu lähteestä myllyihin), joten kierros ratkeaa aina. Kierros, joka
// ratkeaa enintään kolmella ylimääräisellä käännöllä, antaa kultaisen pisaran.
// Ei sydämiä. Tehtävät toisen ja kolmannen kierroksen jälkeen: lasku, pisteet.

// mills: myllyt, len: reitin pituus (palaa) myllyä kohti, decoys: hämäyspalat
// reitin ulkopuolella, rocks: kivet, fixed: ruuvatut reittipalat, time: aikaraja
var CHUTE_ROUNDS = [
  { cols: 5, rows: 4, mills: 1, len: [5, 7], decoys: 2, rocks: 2, fixed: 0, time: 0 },
  { cols: 6, rows: 4, mills: 1, len: [7, 10], decoys: 6, rocks: 2, fixed: 1, time: 0 },
  { cols: 6, rows: 5, mills: 2, len: [3, 6], decoys: 8, rocks: 2, fixed: 1, time: 90 },
  { cols: 7, rows: 5, mills: 3, len: [3, 5], decoys: 10, rocks: 2, fixed: 2, time: 100 }
];
// Suunnat bitteinä: pohjoinen 1, itä 2, etelä 4, länsi 8
var CHUTE_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
var CHUTE_FILL = 7;        // täyttymisnopeus (palaa / s)
var CHUTE_WIN_T = 1.0;
var CHUTE_PAR = 3;         // kultainen pisara: käännöt <= minimi + PAR

var chute = {
  round: 0, state: 'intro', t: 0, R: null, L: null, tiles: [], flow: null, okT: 0,
  taps: 0, par: 0, gold: [], taskDelay: -1, hintT: 0, tapped: false, timeLeft: 0, mills: []
};

// ---------- Palat ----------
function chuteRot(m) { return ((m << 1) | (m >> 3)) & 15; }
function chuteRotN(m, n) { while (n-- > 0) m = chuteRot(m); return m; }
function chuteBit(d) { return 1 << d; }
function chuteOpp(d) { return (d + 2) % 4; }
function chuteKey(c, r) { return c + ',' + r; }
function chuteTile(c, r) { var R = chute.R; return c >= 0 && r >= 0 && c < R.cols && r < R.rows ? chute.tiles[r * R.cols + c] : null; }
// Pienin määrä myötäpäiväkäännöksiä, joilla aukot ovat halutut
function chuteRotNeed(from, want) {
  var k;
  for (k = 0; k < 4; k++) if (chuteRotN(from, k) === want) return k;
  return -1;
}

// ---------- Arvonta ----------
function chuteRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function chuteTryGenerate(R) {
  var mask = {}, used = {}, mills = [], i, k, c, r, d, len, path, cur, step, cand, src, exitsUsed = {};
  src = { c: 0, r: chuteRandInt(0, R.rows - 1) };
  mask[chuteKey(src.c, src.r)] = chuteBit(3);
  used[chuteKey(src.c, src.r)] = true;
  var cells = [src];
  // Reunan ulospäin osoittava aukko myllylle (ei lähteen länsireunaa)
  function exitsOf(p) {
    var out = [], dd;
    for (dd = 0; dd < 3; dd++) {
      var nc = p.c + CHUTE_DIRS[dd][0], nr = p.r + CHUTE_DIRS[dd][1];
      if ((nc < 0 || nr < 0 || nc >= R.cols || nr >= R.rows) && !exitsUsed[chuteKey(p.c, p.r) + dd]) out.push(dd);
    }
    return out;
  }
  for (k = 0; k < R.mills; k++) {
    // Haara: ensimmäinen lähteestä, muut jostain kahden aukon reittipalasta
    if (k === 0) cur = src;
    else {
      var br = cells.filter(function (p) {
        var m = mask[chuteKey(p.c, p.r)], n = 0, b;
        for (b = 0; b < 4; b++) if (m & (1 << b)) n++;
        return n === 2;
      });
      if (!br.length) return null;
      cur = br[Math.floor(Math.random() * br.length)];
    }
    len = chuteRandInt(R.len[0], R.len[1]);
    for (step = 0; step < len; step++) {
      cand = [];
      for (d = 0; d < 4; d++) {
        c = cur.c + CHUTE_DIRS[d][0]; r = cur.r + CHUTE_DIRS[d][1];
        if (c < 0 || r < 0 || c >= R.cols || r >= R.rows || used[chuteKey(c, r)]) continue;
        cand.push(d);
      }
      if (!cand.length) return null;
      d = cand[Math.floor(Math.random() * cand.length)];
      var nx = { c: cur.c + CHUTE_DIRS[d][0], r: cur.r + CHUTE_DIRS[d][1] };
      mask[chuteKey(cur.c, cur.r)] |= chuteBit(d);
      mask[chuteKey(nx.c, nx.r)] = chuteBit(chuteOpp(d));
      used[chuteKey(nx.c, nx.r)] = true;
      cells.push(nx);
      cur = nx;
    }
    var ex = exitsOf(cur);
    if (!ex.length) return null;
    d = ex[Math.floor(Math.random() * ex.length)];
    exitsUsed[chuteKey(cur.c, cur.r) + d] = true;
    mask[chuteKey(cur.c, cur.r)] |= chuteBit(d);
    mills.push({ c: cur.c, r: cur.r, d: d });
  }
  // Ei neljän aukon paloja
  for (i = 0; i < cells.length; i++) if (mask[chuteKey(cells[i].c, cells[i].r)] === 15) return null;
  var L = { src: src, mills: mills, tiles: [], cols: R.cols, rows: R.rows };
  var free = [];
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) if (!used[chuteKey(c, r)]) free.push({ c: c, r: r });
  shuffleNums(free);
  var kinds = {};
  for (i = 0; i < free.length; i++) {
    if (i < R.rocks) kinds[chuteKey(free[i].c, free[i].r)] = 'rock';
    else if (i < R.rocks + R.decoys) kinds[chuteKey(free[i].c, free[i].r)] = Math.random() < 0.5 ? 'corner' : (Math.random() < 0.7 ? 'straight' : 'tee');
    else kinds[chuteKey(free[i].c, free[i].r)] = 'empty';
  }
  var fixedLeft = R.fixed, pathCells = shuffleNums(cells.slice(1));
  var fixedSet = {};
  for (i = 0; i < pathCells.length && fixedLeft > 0; i++) { fixedSet[chuteKey(pathCells[i].c, pathCells[i].r)] = true; fixedLeft--; }
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) {
    var key = chuteKey(c, r), t = { c: c, r: r, kind: 'empty', mask: 0, want: -1, fixed: false, rotA: 0 };
    if (mask[key] !== undefined) {
      t.kind = 'pipe'; t.want = mask[key]; t.fixed = !!fixedSet[key];
      t.mask = t.fixed ? t.want : chuteRotN(t.want, chuteRandInt(0, 3));
    } else if (kinds[key] === 'rock') {
      t.kind = 'rock';
    } else if (kinds[key] !== 'empty') {
      t.kind = 'pipe';
      t.mask = kinds[key] === 'corner' ? 3 : kinds[key] === 'straight' ? 5 : 7;
      t.mask = chuteRotN(t.mask, chuteRandInt(0, 3));
    }
    L.tiles.push(t);
  }
  // Minimikäännöt ratkaisun reitille; alkuasento ei saa olla valmis
  var par = 0;
  for (i = 0; i < L.tiles.length; i++) if (L.tiles[i].want >= 0) par += chuteRotNeed(L.tiles[i].mask, L.tiles[i].want);
  if (par < 3) return null;
  L.par = par;
  return L;
}
function chuteGenerate(R) {
  var i, L;
  for (i = 0; i < 5000; i++) {
    L = chuteTryGenerate(R);
    if (L) return L;
  }
  return null;
}

// ---------- Virtaus ----------
// Leveyshaku lähteestä: märät palat (etäisyys ja mistä vesi tuli), myllyt ja vuodot
function chuteEvalFlow() {
  var R = chute.R, L = chute.L, q = [], wet = {}, leaks = [], mills = [], s, t, d, nc, nr, nt, k, i;
  t = chuteTile(L.src.c, L.src.r);
  if (!t || t.kind !== 'pipe' || !(t.mask & chuteBit(3))) return { wet: wet, leaks: [{ c: L.src.c, r: L.src.r, d: 3, src: true }], mills: mills };
  wet[chuteKey(t.c, t.r)] = { dist: 0, from: -1 };
  q.push(t);
  while (q.length) {
    s = q.shift();
    for (d = 0; d < 4; d++) {
      if (!(s.mask & chuteBit(d))) continue;
      if (s.c === L.src.c && s.r === L.src.r && d === 3) continue;
      nc = s.c + CHUTE_DIRS[d][0]; nr = s.r + CHUTE_DIRS[d][1];
      nt = chuteTile(nc, nr);
      if (!nt) {
        // Reunan yli: mylly vai vuoto
        k = -1;
        for (i = 0; i < L.mills.length; i++) if (L.mills[i].c === s.c && L.mills[i].r === s.r && L.mills[i].d === d) k = i;
        if (k >= 0) mills.push({ i: k, c: s.c, r: s.r });
        else leaks.push({ c: s.c, r: s.r, d: d });
        continue;
      }
      if (nt.kind !== 'pipe' || !(nt.mask & chuteBit(chuteOpp(d)))) { leaks.push({ c: s.c, r: s.r, d: d }); continue; }
      if (wet[chuteKey(nc, nr)]) continue;
      wet[chuteKey(nc, nr)] = { dist: wet[chuteKey(s.c, s.r)].dist + 1, from: chuteKey(s.c, s.r) };
      q.push(nt);
    }
  }
  return { wet: wet, leaks: leaks, mills: mills };
}
function chuteRefresh() { chute.flow = chuteEvalFlow(); }

// ---------- Kierros ----------
function chuteStartRound() {
  var R = CHUTE_ROUNDS[chute.round], i;
  chute.R = R;
  chute.L = chuteGenerate(R);
  chute.tiles = chute.L.tiles;
  for (i = 0; i < chute.tiles.length; i++) { chute.tiles[i].fill = 0; chute.tiles[i].wig = 0; }
  chute.mills = [];
  for (i = 0; i < chute.L.mills.length; i++) chute.mills.push({ spin: 0, ang: Math.random() * 6 });
  chute.par = chute.L.par;
  chute.taps = 0;
  chute.okT = 0;
  chute.state = 'play';
  chute.t = 0;
  chute.hintT = 0;
  chute.timeLeft = R.time;
  chuteRefresh();
  renderBackground();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}

// ---------- Alustus ----------
function initChute() {
  var i;
  tasks = [makeTask(-5, 'math'), makeTask(-5, 'dots')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  chute.round = 0;
  chute.state = 'intro';
  chute.t = 0;
  chute.R = CHUTE_ROUNDS[0];
  chute.L = null;
  chute.tiles = [];
  chute.gold = [];
  chute.taskDelay = -1;
  chute.tapped = false;
  renderBackground();
}
function respawnChute() { chuteStartRound(); }
function resizeChute() { camX = 0; }

// ---------- Asettelu ----------
function chuteLayout() {
  var R = chute.R || CHUTE_ROUNDS[0], W = viewW, h = viewH;
  var cs = Math.min(W * 0.72 / (R.cols + 2), h * 0.7 / (R.rows + 1), h * 0.17);
  return { cs: cs, ox: W * 0.52 - cs * R.cols / 2, oy: h * 0.16 + (h * 0.78 - cs * R.rows) / 2 };
}
function chuteCell(c, r, Lz) {
  Lz = Lz || chuteLayout();
  return { x: Lz.ox + (c + 0.5) * Lz.cs, y: Lz.oy + (r + 0.5) * Lz.cs };
}

// ---------- Napautus ----------
function handleChuteTap(px, py) {
  var Lz, c, r, t, p;
  if (chute.state !== 'play' || puzzleBusy() || celebrating) return;
  Lz = chuteLayout();
  c = Math.floor((px - Lz.ox) / Lz.cs);
  r = Math.floor((py - Lz.oy) / Lz.cs);
  t = chuteTile(c, r);
  if (!t) return;
  chute.tapped = true;
  if (t.kind === 'pipe' && !t.fixed) {
    t.mask = chuteRot(t.mask);
    t.rotA = -Math.PI / 2;
    chute.taps++;
    playNote(520 + (chute.taps % 5) * 40, 0, 0.07, 'triangle', 0.25);
    chuteRefresh();
  } else {
    // Ruuvattu pala tai kivi: nytkähdys
    t.wig = 0.35;
    playNote(t.kind === 'rock' ? 180 : 330, 0, 0.1, 'triangle', 0.18);
    p = chuteCell(c, r, Lz);
    if (t.fixed) spawnSparkles(p.x, p.y, 4, '#c0c8d8');
  }
}

// ---------- Päivitys ----------
function updateChute(dt) {
  var busy, i, t, w, f, allOk, m, R = chute.R;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (chute.taskDelay > 0 && !busy) {
    chute.taskDelay -= dt;
    if (chute.taskDelay <= 0) {
      if (chute.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (chute.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Palojen kääntöanimaatio ja veden täyttyminen pala kerrallaan
  f = chute.flow;
  for (i = 0; i < chute.tiles.length; i++) {
    t = chute.tiles[i];
    if (t.rotA < 0) t.rotA = Math.min(0, t.rotA + dt * 14);
    if (t.wig > 0) t.wig -= dt;
    w = f && f.wet[chuteKey(t.c, t.r)];
    if (w) {
      var src = w.from === -1 ? null : chute.tiles[(+w.from.split(',')[1]) * R.cols + (+w.from.split(',')[0])];
      if (!src || src.fill >= 1) t.fill = Math.min(1, t.fill + dt * CHUTE_FILL);
    } else {
      t.fill = Math.max(0, t.fill - dt * CHUTE_FILL * 1.5);
    }
  }
  for (i = 0; i < chute.mills.length; i++) {
    m = chute.mills[i];
    var on = false;
    if (f) for (var k = 0; k < f.mills.length; k++) if (f.mills[k].i === i && chuteTile(f.mills[k].c, f.mills[k].r).fill >= 1) on = true;
    if (on && m.spin < 1 && Math.random() < 0.5) playNote(784 + i * 110, 0, 0.08, 'sine', 0.15);
    m.spin += ((on ? 1 : 0) - m.spin) * Math.min(1, dt * 3);
    m.ang += m.spin * dt * 3;
    m.on = on;
  }
  if (busy || celebrating) return;
  chute.t += dt;
  if (chute.state === 'intro') { if (chute.t > 0.6) chuteStartRound(); return; }
  if (chute.state === 'roundDone') {
    if (chute.t > 2.2 && chute.taskDelay <= 0) {
      chute.round++;
      if (chute.round >= CHUTE_ROUNDS.length) { chute.state = 'won'; chute.t = 0; soundFanfare(); }
      else chuteStartRound();
    }
    return;
  }
  if (chute.state === 'won') { if (chute.t > 1.4) startCelebration(); return; }
  if (!chute.tapped) chute.hintT += dt;
  // Pajan kello: ajan loppuessa pato sulkeutuu ja kierros arvotaan uudestaan
  if (R.time > 0) {
    var before = chute.timeLeft;
    chute.timeLeft -= dt;
    if (before > 10 && chute.timeLeft <= 10) playNote(392, 0, 0.25, 'triangle', 0.2);
    if (chute.timeLeft <= 0) {
      artShakeStart(viewH * 0.008, 0.4);
      playNote(220, 0, 0.4, 'triangle', 0.25);
      playNote(165, 0.3, 0.5, 'triangle', 0.25);
      chuteStartRound();
      return;
    }
  }
  // Valmis: kaikki myllyt pyörivät eikä vettä vuoda
  allOk = f && f.leaks.length === 0;
  for (i = 0; allOk && i < chute.mills.length; i++) if (!chute.mills[i].on) allOk = false;
  if (allOk) {
    chute.okT += dt;
    if (chute.okT > CHUTE_WIN_T) chuteRoundDone();
  } else {
    chute.okT = 0;
  }
}
function chuteRoundDone() {
  var i, mel = [659, 784, 988, 1175, 1319], gold = chute.taps <= chute.par + CHUTE_PAR;
  chute.state = 'roundDone';
  chute.t = 0;
  chute.gold[chute.round] = gold;
  for (i = 0; i < chute.L.mills.length; i++) {
    var p = chuteMillPos(i);
    artPop(p.x, p.y, chuteLayout().cs * 0.8, '#7fd4ff', 'ring');
    spawnSparkles(p.x, p.y, 16, '#bfeaff');
  }
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.25, 'triangle', 0.3);
  if (gold) playNote(1760, 0.7, 0.3, 'sine', 0.3);
  if (chute.round === 1 || chute.round === 2) chute.taskDelay = 1.6;
}

// ---------- Piirto ----------
function chuteMillPos(i, Lz) {
  var m = chute.L.mills[i], p;
  Lz = Lz || chuteLayout();
  p = chuteCell(m.c, m.r, Lz);
  return { x: p.x + CHUTE_DIRS[m.d][0] * Lz.cs * 0.95, y: p.y + CHUTE_DIRS[m.d][1] * Lz.cs * 0.95 };
}
function renderChuteBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), x, i;
  g.addColorStop(0, '#8fd0ff');
  g.addColorStop(0.45, '#e2f4ff');
  g.addColorStop(1, '#fff0d0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.88, h * 0.09, h * 0.045, 0.1);
  // Vuoret ja paja rinteellä
  b.fillStyle = artMix('#9a8ac4', '#e2f4ff', 0.4);
  b.beginPath(); b.moveTo(0, h * 0.34);
  for (x = 0; x <= vw; x += vw / 12) b.lineTo(x, h * (0.3 - Math.abs(Math.sin(x / vw * 5)) * 0.14));
  b.lineTo(vw, h * 0.36); b.lineTo(0, h * 0.36); b.closePath(); b.fill();
  b.fillStyle = '#93d476';
  b.beginPath(); b.moveTo(0, h * 0.4);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.34 - Math.sin(x / vw * 3 + 1) * 0.03));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  artRoundRect(b, vw * 0.8, h * 0.2, h * 0.16, h * 0.13, h * 0.01, '#b07840', { lineColor: '#5a3a1a' });
  b.beginPath(); b.moveTo(vw * 0.8 - h * 0.02, h * 0.2); b.lineTo(vw * 0.8 + h * 0.08, h * 0.13); b.lineTo(vw * 0.8 + h * 0.18, h * 0.2); b.closePath();
  artFillPath(b, '#c0503a', h * 0.13, h * 0.2, h * 0.08, { lineColor: '#6a2418' });
  // Kivinen alusta kourupaloille
  var Lz = chuteLayout(), R = chute.R || CHUTE_ROUNDS[0];
  artRoundRect(b, Lz.ox - Lz.cs * 0.12, Lz.oy - Lz.cs * 0.12, Lz.cs * (R.cols + 0.24), Lz.cs * (R.rows + 0.24), Lz.cs * 0.2, '#b8a890', { shadeTo: '#8a7a68', lineColor: '#5a4a3a', hi: 0.1 });
  for (i = 0; i < 6; i++) drawFlower(b, vw * (0.04 + i * 0.07), h * (0.9 + (i % 2) * 0.05), h * 0.011, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}
// Kourupala: puinen kouru aukkojen suuntiin, vesi täyttää keskeltä ulos
function chuteDrawPipe(c, x, y, s, mask, fill, fixed, wet) {
  var d, w = s * 0.34, ex, ey;
  c.lineCap = 'round';
  // Puinen kouru
  c.strokeStyle = '#6a4a28';
  c.lineWidth = w * 1.35;
  for (d = 0; d < 4; d++) if (mask & chuteBit(d)) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + CHUTE_DIRS[d][0] * s * 0.5, y + CHUTE_DIRS[d][1] * s * 0.5); c.stroke(); }
  c.strokeStyle = '#c08a50';
  c.lineWidth = w * 1.05;
  for (d = 0; d < 4; d++) if (mask & chuteBit(d)) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + CHUTE_DIRS[d][0] * s * 0.5, y + CHUTE_DIRS[d][1] * s * 0.5); c.stroke(); }
  artCircle(c, x, y, w * 0.55, '#c08a50', { line: false });
  // Vesi
  if (fill > 0) {
    c.strokeStyle = '#4fb8f0';
    c.lineWidth = w * 0.78;
    for (d = 0; d < 4; d++) {
      if (!(mask & chuteBit(d))) continue;
      ex = x + CHUTE_DIRS[d][0] * s * 0.5 * fill; ey = y + CHUTE_DIRS[d][1] * s * 0.5 * fill;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
    }
    artCircle(c, x, y, w * 0.39, '#4fb8f0', { line: false });
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1, w * 0.12);
    c.setLineDash([w * 0.3, w * 0.5]);
    c.lineDashOffset = -globalT * s * 0.8;
    for (d = 0; d < 4; d++) if (mask & chuteBit(d)) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + CHUTE_DIRS[d][0] * s * 0.5 * fill, y + CHUTE_DIRS[d][1] * s * 0.5 * fill); c.stroke(); }
    c.setLineDash([]);
  }
  if (fixed) {
    // Ruuvit nurkissa
    for (d = 0; d < 4; d++) artCircle(c, x + (d % 2 ? 1 : -1) * s * 0.36, y + (d < 2 ? -1 : 1) * s * 0.36, s * 0.06, '#c0c8d8', { lineColor: '#5a6070' });
  }
}
function chuteDrawWheel(c, x, y, s, ang, on) {
  var i, a;
  artCircle(c, x, y, s, on ? '#d9a060' : '#b08a60', { lineColor: '#5a3a1a', hi: 0.2 });
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = Math.max(2, s * 0.1);
  for (i = 0; i < 8; i++) {
    a = ang + i * Math.PI / 4;
    c.beginPath(); c.moveTo(x + Math.cos(a) * s * 0.2, y + Math.sin(a) * s * 0.2); c.lineTo(x + Math.cos(a) * s * 1.15, y + Math.sin(a) * s * 1.15); c.stroke();
  }
  artCircle(c, x, y, s * 0.25, '#8a5a30', { lineColor: '#4a2a10' });
}

function drawChute() {
  var c = ctx, R = chute.R, L = chute.L, Lz, i, t, p, s, f = chute.flow, d;
  if (!beginPlayWorld()) return;
  if (L) {
    Lz = chuteLayout();
    s = Lz.cs;
    // Ruudut
    for (i = 0; i < chute.tiles.length; i++) {
      t = chute.tiles[i];
      p = chuteCell(t.c, t.r, Lz);
      artRoundRect(c, p.x - s * 0.46, p.y - s * 0.46, s * 0.92, s * 0.92, s * 0.12, (t.c + t.r) % 2 ? '#d8ccb4' : '#cfc2a8', { lineColor: '#9a8a70', line: Math.max(1, s * 0.02) });
    }
    // Lähde: kivinen lähdesuu vasemmalla
    p = chuteCell(L.src.c, L.src.r, Lz);
    var sx = p.x - s * 0.95;
    artRoundRect(c, sx - s * 0.4, p.y - s * 0.4, s * 0.6, s * 0.8, s * 0.15, '#9a9aa8', { lineColor: '#4a4a5a', hi: 0.2 });
    c.strokeStyle = '#4fb8f0';
    c.lineWidth = s * 0.2;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, p.y); c.lineTo(p.x - s * 0.5, p.y); c.stroke();
    artGlow(c, sx, p.y, s * 0.5, '#7fd4ff', 0.4);
    // Myllyt
    for (i = 0; i < L.mills.length; i++) {
      var mp = chuteMillPos(i, Lz), ml = chute.mills[i];
      chuteDrawWheel(c, mp.x, mp.y, s * 0.36, ml.ang, ml.on);
      if (ml.on && Math.random() < 0.15) spawnSparkles(mp.x, mp.y + s * 0.3, 2, '#bfeaff');
      if (!ml.on) artGlow(c, mp.x, mp.y, s * 0.6, '#ffe27a', 0.2 + Math.sin(globalT * 4 + i) * 0.1);
    }
    // Palat
    for (i = 0; i < chute.tiles.length; i++) {
      t = chute.tiles[i];
      p = chuteCell(t.c, t.r, Lz);
      var wg = t.wig > 0 ? Math.sin(globalT * 50) * s * 0.03 : 0;
      if (t.kind === 'rock') {
        artBlob(c, p.x + wg, p.y + s * 0.08, s * 0.34, s * 0.26, '#9a9aa8', { lineColor: '#4a4a5a', hi: 0.3 });
      } else if (t.kind === 'pipe') {
        c.save();
        c.translate(p.x + wg, p.y);
        c.rotate(t.rotA);
        chuteDrawPipe(c, 0, 0, s, t.mask, t.fill, t.fixed, true);
        c.restore();
      }
    }
    // Vuodot: roiske avoimesta päästä
    if (f) {
      for (i = 0; i < f.leaks.length; i++) {
        var lk = f.leaks[i], lt = chuteTile(lk.c, lk.r);
        if (!lt || (lt.fill < 1 && !lk.src)) continue;
        p = chuteCell(lk.c, lk.r, Lz);
        // Lähteen vuoto roiskuu lähdesuulta, muut palan avoimesta päästä
        var lx = p.x + CHUTE_DIRS[lk.d][0] * s * 0.5, ly = p.y + CHUTE_DIRS[lk.d][1] * s * 0.5;
        for (d = 0; d < 4; d++) {
          var a = globalT * 6 + d * 1.6, rr = s * (0.08 + ((globalT * 2 + d * 0.3) % 1) * 0.18);
          artCircle(c, lx + Math.cos(a) * rr, ly + Math.sin(a) * rr * 0.6 + rr * 0.5, s * 0.05, '#7fd4ff', { line: false, alpha: 0.8 });
        }
      }
    }
    // Vihje 1. kierroksella: käsi napauttaa lähteen vieressä olevaa palaa
    if (chute.round === 0 && !chute.tapped && chute.hintT > 1.5) {
      p = chuteCell(L.src.c, L.src.r, Lz);
      var k = (globalT % 1.2) / 1.2;
      drawHand(c, p.x + s * 0.1, p.y + s * 0.15 + Math.abs(Math.sin(k * Math.PI)) * s * 0.15, s * 0.3);
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawChuteHud(c);
  drawTaskOverlay(c);
}
// HUD: kierrokset pisaroina (kultainen = vähillä käännöillä), pajan kello
function drawChuteHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = CHUTE_ROUNDS.length, R = chute.R;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.6 * n + hs * 1.2, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < chute.round || chute.state === 'won' || (i === chute.round && chute.state === 'roundDone');
    var x = left + hs * 1.9 + i * hs * 2.6, y = pad * 0.5 + hs * 1.7, col = done && chute.gold[i] ? '#ffd24f' : '#4fb8f0';
    c.globalAlpha = done ? 1 : 0.3;
    if (done && chute.gold[i]) artGlow(c, x, y, hs * 1.6, '#ffd24f', 0.7);
    c.beginPath(); c.moveTo(x, y - hs); c.quadraticCurveTo(x + hs * 0.8, y + hs * 0.1, x, y + hs * 0.8); c.quadraticCurveTo(x - hs * 0.8, y + hs * 0.1, x, y - hs); c.closePath();
    artFillPath(c, col, y - hs, y + hs * 0.8, hs, { lineColor: artShade(col, -0.4) });
    c.globalAlpha = 1;
  }
  if (R && R.time > 0 && chute.state === 'play') {
    // Kello: viisari kiertää, viimeinen neljännes punaisena
    var cx = viewW - viewH * 0.17, cy = viewH * 0.07, cr = viewH * 0.04, k = 1 - Math.max(0, chute.timeLeft) / R.time;
    artCircle(c, cx, cy, cr, k > 0.75 ? '#ffd0c0' : '#fff6e0', { lineColor: '#8a5a30' });
    c.fillStyle = k > 0.75 ? 'rgba(255,90,60,0.5)' : 'rgba(200,150,80,0.35)';
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, cr * 0.9, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.closePath(); c.fill();
    c.strokeStyle = '#5a3a1a';
    c.lineWidth = Math.max(2, cr * 0.1);
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-Math.PI / 2 + k * Math.PI * 2) * cr * 0.8, cy + Math.sin(-Math.PI / 2 + k * Math.PI * 2) * cr * 0.8); c.stroke();
  }
}

HUB_ICONS.chute = function (c, x, y, s) {
  chuteDrawPipe(c, x - s * 0.06, y + s * 0.02, s * 0.3, 10, 1, false, true);
  chuteDrawWheel(c, x + s * 0.16, y + s * 0.02, s * 0.09, globalT, true);
};
