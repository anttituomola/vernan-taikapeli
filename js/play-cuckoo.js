'use strict';

// Käkikello (Kaukamaa, Kellopaja): pajan seinällä iso käkikello, jonka
// viisarit ovat sekaisin. Tonttu pitelee korttia "aseta kello näin".
// Viisarit RAAHATAAN: minuuttiviisari (pitkä, ohut, sininen) napsahtaa 15 tai
// 5 minuutin askeliin ja vie tuntiviisaria mukanaan kuten oikeassa kellossa
// (rattaat kellon takana pyörivät). Tuntiviisarin (lyhyt, paksu, punainen)
// voi raahata suoraan: se napsahtaa tasatuntiin ja minuutit säilyvät.
// Kortin aika on kirjoitettu samoin värein: tunti punaisella, minuutit
// sinisellä. Kun kello on valmis, lapsi vetää kellon vetorenkaasta:
// oikea aika -> luukku aukeaa ja käki kukkuu tunnin verran (numero lasketaan
// näkyviin). Väärä aika -> käki tuhahtaa ja pudistaa päätään, väärä viisari
// heilahtaa vihjeenä ja yksi kolmesta kellopainosta putoaa. Kun painot
// loppuvat, kierros arvotaan alusta.
// Neljä kierrosta, kussakin kolme arvottua korttia:
//   1. tasatunnit, kortissa iso aika ja pieni kuvakello (kopioi kuva)
//   2. tasat ja puolet, kortissa vain aika
//   3. "kuuntele käkeä" (käki kukkuu N kertaa, aseta N:00) ja "tunnin päästä"
//      (pieni kuvakello + tiimalasi +1)
//   4. vartit ja "kahden tunnin päästä" (+2)
// Kolmannesta kierroksesta alkaen kellopainot laskeutuvat ketjuissa
// (aikaraja); kun ne osuvat lattiaan, kierros alkaa alusta. Kierros ilman
// yhtään pudonnutta painoa antaa kultaisen käen. Ei sydämiä.
// Tehtävät toisen ja kolmannen kierroksen jälkeen: lasku, kuviosarja.

// cards: korttityypit, step: minuuttiviisarin askel, time: aikaraja (s, 0 = ei)
var CUCKOO_ROUNDS = [
  { cards: ['pic', 'pic', 'pic'], step: 15, time: 0 },
  { cards: ['half', 'half', 'whole'], step: 15, time: 0 },
  { cards: ['listen', 'plus1', 'mix3'], step: 5, time: 80 },
  { cards: ['quarter', 'plus2', 'mix4'], step: 5, time: 70 }
];
var CUCKOO_CARDS = 3;           // korttia kierroksessa
var CUCKOO_WEIGHTS = 3;         // kellopainoja (sallitut virheet)
var CUCKOO_GAP = 0.8;           // kukahdusten väli (s)
var CUCKOO_WX = [-0.9, 0.62, 0.92];  // painojen paikat (× kellon säde)
var CUCKOO_TAU = Math.PI * 2;

var cuckoo = {
  round: 0, state: 'intro', t: 0, R: null, cards: [], ci: 0, cardK: 0,
  tm: 0, disp: 0, drag: null, weights: [], timeLeft: 0, gold: [], taskDelay: -1,
  hintT: 0, idleT: 0, dragged: false, pulled: false, pullT: 0, wigH: 0, wigM: 0,
  pend: 0.22, tonttu: { blink: 0, hop: 0 }, bird: null, countPop: 0
};

// ---------- Aika ja kulmat (puhtaat funktiot) ----------
// Aika on minuutteja 0..719 (0 = 12:00). Kulma on canvasin kulma: 0 = oikealle,
// kasvaa myötäpäivään; kello 12 on -π/2.
function cuckooWrap(v, n) { return ((v % n) + n) % n; }
// Erotus välille [-n/2, n/2)
function cuckooWrapDiff(d, n) { return cuckooWrap(d + n / 2, n) - n / 2; }
function cuckooMinAng(t) { return t / 60 * CUCKOO_TAU - Math.PI / 2; }
function cuckooHourAng(t) { return t / 720 * CUCKOO_TAU - Math.PI / 2; }
// Osoittimen kulma minuuttiviisarin lukemana (0..60) ja tuntiviisarin lukemana (0..720 min)
function cuckooAngToMin(a) { return cuckooWrap((a + Math.PI / 2) / CUCKOO_TAU * 60, 60); }
function cuckooAngToDial(a) { return cuckooWrap((a + Math.PI / 2) / CUCKOO_TAU * 720, 720); }
// Tunti 1..12
function cuckooHourOf(tm) { var h = Math.floor(cuckooWrap(tm, 720) / 60); return h === 0 ? 12 : h; }
function cuckooLabel(tm) { var m = cuckooWrap(tm, 60); return cuckooHourOf(tm) + ':' + (m < 10 ? '0' : '') + m; }
// Raahauksen alku: viisari liikkuu sormen mukana suhteellisesti (ei hyppää sormeen)
function cuckooDragStart(kind, tm, a) {
  return { kind: kind, acc: tm, last: kind === 'hour' ? cuckooAngToDial(a) : cuckooAngToMin(a), keepMin: cuckooWrap(tm, 60) };
}
// Raahauksen siirto: palauttaa uuden ajan. Minuuttiviisari kertyy kierroksiksi,
// joten 12:n ylitys kumpaan suuntaan tahansa vaihtaa tunnin.
function cuckooDragMove(d, a, step) {
  var p;
  if (d.kind === 'hour') {
    p = cuckooAngToDial(a);
    d.acc += cuckooWrapDiff(p - d.last, 720);
    d.last = p;
    return cuckooWrap(Math.round((d.acc - d.keepMin) / 60) * 60 + d.keepMin, 720);
  }
  p = cuckooAngToMin(a);
  d.acc += cuckooWrapDiff(p - d.last, 60);
  d.last = p;
  return cuckooWrap(Math.round(d.acc / step) * step, 720);
}
function cuckooCheck(tm, target) {
  var hw = Math.floor(cuckooWrap(tm, 720) / 60) !== Math.floor(cuckooWrap(target, 720) / 60);
  var mw = cuckooWrap(tm, 60) !== cuckooWrap(target, 60);
  return { ok: !hw && !mw, hourWrong: hw, minWrong: mw };
}

// ---------- Kortit ----------
function cuckooRandInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function cuckooPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// Kortti: kind 'pic' | 'digi' | 'listen' | 'plus'; tm = tavoiteaika; plus-kortissa base + plus tuntia
function cuckooMakeCard(kind) {
  var H = cuckooRandInt(1, 12), base;
  if (kind === 'mix3') kind = Math.random() < 0.5 ? 'listen' : 'plus1';
  if (kind === 'mix4') kind = Math.random() < 0.5 ? 'quarter' : 'plus2';
  if (kind === 'pic') return { kind: 'pic', tm: cuckooWrap(H * 60, 720) };
  if (kind === 'whole') return { kind: 'digi', tm: cuckooWrap(H * 60, 720) };
  if (kind === 'half') return { kind: 'digi', tm: cuckooWrap(H * 60 + 30, 720) };
  if (kind === 'quarter') return { kind: 'digi', tm: cuckooWrap(H * 60 + cuckooPick([15, 45]), 720) };
  if (kind === 'listen') return { kind: 'listen', tm: cuckooRandInt(2, 7) * 60 };
  if (kind === 'plus1') {
    base = cuckooWrap(H * 60 + cuckooPick([0, 30]), 720);
    return { kind: 'plus', plus: 1, base: base, tm: cuckooWrap(base + 60, 720) };
  }
  base = cuckooWrap(H * 60 + cuckooPick([0, 15, 30, 45]), 720);
  return { kind: 'plus', plus: 2, base: base, tm: cuckooWrap(base + 120, 720) };
}
// Kierroksen kortit: ei samaa tavoiteaikaa kahdesti
function cuckooMakeCards(ri) {
  var R = CUCKOO_ROUNDS[ri], tries, i, out, seen, cd, ok;
  for (tries = 0; tries < 500; tries++) {
    out = []; seen = {}; ok = true;
    for (i = 0; i < R.cards.length; i++) {
      cd = cuckooMakeCard(R.cards[i]);
      if (seen[cd.tm]) { ok = false; break; }
      seen[cd.tm] = true;
      out.push(cd);
    }
    if (ok) return ri > 0 ? shuffleNums(out) : out;
  }
  return out;
}
// Sekoitettu alkuasento: tunti vähintään kahden päässä tavoitteesta; 1. kierroksella
// minuutit valmiiksi tasan (vain tuntiviisari raahataan), muuten minuutit eri kuin kortissa
function cuckooScramble(ri, target) {
  var R = CUCKOO_ROUNDS[ri], tries, h, m, dh;
  for (tries = 0; tries < 200; tries++) {
    h = cuckooRandInt(0, 11);
    m = ri === 0 ? 0 : cuckooRandInt(0, 60 / R.step - 1) * R.step;
    dh = Math.abs(cuckooWrapDiff(h - Math.floor(target / 60), 12));
    if (dh < 2) continue;
    if (ri > 0 && m === cuckooWrap(target, 60)) continue;
    return h * 60 + m;
  }
  return cuckooWrap(target + 300, 720);
}

// ---------- Asettelu ----------
function cuckooLayout() {
  var W = viewW, h = viewH, R = Math.min(h * 0.18, W * 0.16);
  return { R: R, cx: W * 0.42, cy: h * 0.4, floor: h * 0.9 };
}
function cuckooCardBox() {
  var W = viewW, h = viewH, w = Math.min(W * 0.24, h * 0.34);
  return { x: W * 0.8, y: h * 0.45, w: w, h: w * 1.1 };
}
function cuckooHandlePos(L) {
  L = L || cuckooLayout();
  return { x: L.cx - L.R * 1.72, y: L.cy + L.R * 0.6 + Math.sin(Math.min(1, Math.max(0, cuckoo.pullT) / 0.5) * Math.PI) * L.R * 0.35 };
}
// Painon yläreuna: laskeutuu ketjussa aikarajan mukana lattiaan asti
function cuckooWeightTop(L) {
  var top0 = L.cy + L.R * 1.3, wh = L.R * 0.5, k = 0, R = cuckoo.R;
  if (R && R.time > 0 && cuckoo.state === 'play') k = 1 - Math.max(0, cuckoo.timeLeft) / R.time;
  return top0 + (L.floor - wh - top0) * k;
}
function cuckooTontPos() {
  var B = cuckooCardBox();
  return { x: B.x, y: viewH * 0.93, s: viewH * 0.12 };
}

// ---------- Kierros ----------
function cuckooStartRound(again) {
  var i;
  cuckoo.R = CUCKOO_ROUNDS[cuckoo.round];
  cuckoo.cards = cuckooMakeCards(cuckoo.round);
  cuckoo.ci = 0;
  cuckoo.cardK = 0;
  cuckoo.weights = [];
  for (i = 0; i < CUCKOO_WEIGHTS; i++) cuckoo.weights.push({ on: true, appear: again ? -i * 0.1 : 1 });
  cuckoo.tm = cuckooScramble(cuckoo.round, cuckoo.cards[0].tm);
  cuckoo.disp = cuckoo.tm - (again ? 0 : 300);   // kierroksen alussa viisarit pyörähtävät paikoilleen
  cuckoo.drag = null;
  cuckoo.timeLeft = cuckoo.R.time;
  cuckoo.state = 'play';
  cuckoo.t = 0;
  cuckoo.hintT = 0;
  cuckoo.idleT = 0;
  cuckoo.bird = cuckooBirdIdle();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}
function cuckooRoundDone() {
  var i, L = cuckooLayout(), mel = [659, 784, 988, 1175, 1319], gold = cuckooWeightsLeft() === CUCKOO_WEIGHTS;
  cuckoo.state = 'roundDone';
  cuckoo.t = 0;
  cuckoo.gold[cuckoo.round] = gold;
  artPop(L.cx, L.cy, L.R * 1.2, '#ffd24f', 'ring');
  spawnSparkles(L.cx, L.cy - L.R * 1.5, 18, '#ffe27a');
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.25, 'triangle', 0.3);
  if (gold) playNote(1760, 0.7, 0.3, 'sine', 0.3);
  if (cuckoo.round === 1 || cuckoo.round === 2) cuckoo.taskDelay = 1.6;
}
function cuckooWeightsLeft() {
  var i, n = 0;
  for (i = 0; i < cuckoo.weights.length; i++) if (cuckoo.weights[i].on) n++;
  return n;
}

// ---------- Käki ----------
// mode: 'none' | 'call' (n kukahdusta; count = numero näkyviin) | 'wrong' | 'peek'
function cuckooBirdIdle() { return { mode: 'none', t: 0, n: 0, i: 0, count: false, lock: false, chick: false, after: null, open: 0, beak: 0 }; }
function cuckooBirdStart(mode, n, count, lock, after) {
  var b = cuckoo.bird, open = b ? b.open : 0;
  cuckoo.bird = cuckooBirdIdle();
  b = cuckoo.bird;
  b.mode = mode; b.n = n; b.count = count; b.lock = lock; b.after = after; b.open = open;
  return b;
}
function cuckooBirdEnd(b) {
  if (b.mode === 'call') return 0.45 + (b.n - 1) * CUCKOO_GAP + 1.0;
  if (b.mode === 'wrong') return 1.7;
  if (b.mode === 'peek') return b.chick ? 2.6 : 1.5;
  return 0;
}
function cuckooKuku(vol) {
  playNote(784, 0, 0.22, 'sine', vol);
  playNote(622, 0.24, 0.32, 'sine', vol);
}
function cuckooUpdateBird(dt) {
  var b = cuckoo.bird, end, L;
  if (!b) return;
  b.beak = Math.max(0, b.beak - dt);
  if (b.mode === 'none') { b.open = Math.max(0, b.open - dt * 4); return; }
  b.t += dt;
  end = cuckooBirdEnd(b);
  b.open = b.t < end - 0.3 ? Math.min(1, b.open + dt * 4) : Math.max(0, b.open - dt * 4);
  if ((b.mode === 'call' || b.mode === 'peek') && b.i < Math.max(1, b.n) && b.t >= 0.45 + b.i * CUCKOO_GAP) {
    b.i++;
    b.beak = 0.45;
    cuckooKuku(0.35);
    if (b.count) {
      L = cuckooLayout();
      cuckoo.countPop = 0.3;
      spawnSparkles(L.cx + L.R * 0.95, L.cy - L.R * 1.75, 6, '#ffe27a');
    }
  }
  if (b.mode === 'peek' && b.chick && (b.t - dt < 1.1 && b.t >= 1.1 || b.t - dt < 1.4 && b.t >= 1.4)) {
    playNote(1760, 0, 0.1, 'sine', 0.25);
    playNote(1568, 0.1, 0.12, 'sine', 0.25);
  }
  if (b.mode === 'wrong' && b.t - dt < 0.35 && b.t >= 0.35) {
    // Tuhahdus
    playNote(196, 0, 0.16, 'sawtooth', 0.12);
    playNote(147, 0.13, 0.25, 'sawtooth', 0.1);
  }
  if (b.t >= end) {
    var after = b.after;
    b.mode = 'none';
    b.lock = false;
    b.after = null;
    if (after === 'next') cuckooCardDone();
    else if (after === 'restart') {
      artShakeStart(viewH * 0.006, 0.3);
      playNote(220, 0, 0.3, 'triangle', 0.25);
      cuckooStartRound(true);
    }
  }
}
function cuckooBusy() { return cuckoo.bird && cuckoo.bird.lock; }
function cuckooListen() {
  var cd = cuckoo.cards[cuckoo.ci];
  if (!cd || cd.kind !== 'listen' || cuckooBusy()) return false;
  cd.heard = true;
  cuckooBirdStart('call', cuckooHourOf(cd.tm), false, false, null);
  return true;
}

// ---------- Kortin vaihto ----------
function cuckooCardDone() {
  var B = cuckooCardBox();
  spawnSparkles(B.x, B.y, 14, '#ffe27a');
  artPop(B.x, B.y, B.w * 0.6, '#ffd24f', 'ring');
  cuckoo.tonttu.hop = 0.5;
  cuckoo.ci++;
  cuckoo.cardK = 0;
  if (cuckoo.ci >= CUCKOO_CARDS) cuckooRoundDone();
}

// ---------- Alustus ----------
function initCuckoo() {
  var i;
  tasks = [makeTask(-5, 'math'), makeTask(-5, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  cuckoo.round = 0;
  cuckoo.state = 'intro';
  cuckoo.t = 0;
  cuckoo.R = CUCKOO_ROUNDS[0];
  cuckoo.cards = [];
  cuckoo.ci = 0;
  cuckoo.cardK = 0;
  cuckoo.weights = [];
  for (i = 0; i < CUCKOO_WEIGHTS; i++) cuckoo.weights.push({ on: true, appear: 1 });
  cuckoo.tm = 0;
  cuckoo.disp = 0;
  cuckoo.drag = null;
  cuckoo.gold = [];
  cuckoo.taskDelay = -1;
  cuckoo.dragged = false;
  cuckoo.pulled = false;
  cuckoo.pullT = 0;
  cuckoo.wigH = 0;
  cuckoo.wigM = 0;
  cuckoo.pend = 0.22;
  cuckoo.tonttu = { blink: 0, hop: 0 };
  cuckoo.bird = cuckooBirdIdle();
  cuckoo.countPop = 0;
  cuckooSetupProps();
  renderBackground();
}
function respawnCuckoo() { cuckooStartRound(true); }
function resizeCuckoo() {
  camX = 0;
  cuckooSetupProps();
}

// Tökättävät koristeet: herätyskello hyllyllä (pärisee), kävykori lattialla
// (käpy pomppaa ulos), kukkaruukku (kukka pyörähtää ja terälehti leijuu) ja
// käen luukku (käki kurkistaa ja kukkuu; joka viides tökkäys tuo mukaan
// poikasen). Kuuntelukortin aikana luukun tökkäys toistaa kukahdukset.
function cuckooSetupProps() {
  var W = viewW, h = viewH, L = cuckooLayout(), s = h * 0.045;
  propsReset();
  // Herätyskello hyllyllä
  propAdd({
    x: W * 0.09, y: h * 0.3, r: h * 0.07, hy: s * 0.9, color: '#ff7a5a', note: 1319, amp: 0.05, ring: 0,
    update: function (p, dt) { if (p.ring > 0) p.ring -= dt; },
    draw: function (c, p) {
      var sh = p.ring > 0 ? Math.sin(globalT * 60) * s * 0.08 : 0;
      artShadow(c, 0, 0, s * 0.9, s * 0.15, 0.2);
      artLimb(c, -s * 0.5, -s * 0.3, -s * 0.7, 0, s * 0.12, '#7a2a20', '#3a1008');
      artLimb(c, s * 0.5, -s * 0.3, s * 0.7, 0, s * 0.12, '#7a2a20', '#3a1008');
      artCircle(c, -s * 0.5 + sh, -s * 1.55, s * 0.32, '#ffd24f', { lineColor: '#8a6a10', hi: 0.4 });
      artCircle(c, s * 0.5 - sh, -s * 1.55, s * 0.32, '#ffd24f', { lineColor: '#8a6a10', hi: 0.4 });
      artCircle(c, sh, -s * 0.85, s * 0.78, '#ff7a5a', { lineColor: '#8a2a1a', hi: 0.3 });
      artCircle(c, sh, -s * 0.85, s * 0.58, '#fff6e0', { lineColor: '#c9a070' });
      c.strokeStyle = '#3a2010';
      c.lineWidth = Math.max(1.5, s * 0.08);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(sh, -s * 0.85); c.lineTo(sh, -s * 1.25); c.moveTo(sh, -s * 0.85); c.lineTo(sh + s * 0.28, -s * 0.85); c.stroke();
    },
    poke: function (p) {
      var i;
      p.ring = 1.0;
      for (i = 0; i < 8; i++) playNote(i % 2 ? 1568 : 1760, i * 0.1, 0.08, 'square', 0.06);
    }
  });
  // Kävykori: käpy (kellopainon näköinen) pomppaa ulos
  propAdd({
    x: W * 0.1, y: h * 0.95, r: h * 0.07, hy: s * 0.7, color: '#c08a50', note: 392, amp: 0.1,
    draw: function (c) {
      var i;
      artShadow(c, 0, 0, s * 1.3, s * 0.2, 0.22);
      for (i = 0; i < 3; i++) cuckooDrawCone(c, (i - 1) * s * 0.55, -s * 1.0 - (i % 2) * s * 0.15, s * 0.45, (i - 1) * 0.3);
      c.beginPath();
      c.moveTo(-s * 1.2, -s * 1.0); c.lineTo(s * 1.2, -s * 1.0); c.lineTo(s * 0.9, 0); c.lineTo(-s * 0.9, 0); c.closePath();
      artFillPath(c, '#c08a50', -s * 1.0, 0, s, { lineColor: '#5a3a1a' });
      c.strokeStyle = 'rgba(90,58,26,0.5)';
      c.lineWidth = Math.max(1, s * 0.06);
      c.beginPath(); c.moveTo(-s * 1.1, -s * 0.66); c.lineTo(s * 1.1, -s * 0.66); c.moveTo(-s, -s * 0.33); c.lineTo(s, -s * 0.33); c.stroke();
    },
    poke: function (p) {
      propDrop({
        x: p.x, y: p.y - s * 1.2, vx: (p.n % 2 ? 1 : -1) * viewW * 0.08, vy: -viewH * 0.55, ground: p.y - s * 0.1, life: 1.6,
        draw: function (c) { cuckooDrawCone(c, 0, 0, s * 0.45, 0); },
        onLand: function () { playNote(330, 0, 0.1, 'triangle', 0.2); }
      });
    }
  });
  // Kukkaruukku kellon ja tontun välissä
  propAdd({
    x: W * 0.64, y: h * 0.95, r: h * 0.07, hy: s * 1.2, color: '#ff7bac', note: 880, amp: 0.14, spin: 0, ang: 0,
    update: function (p, dt) { p.ang += p.spin * dt; p.spin *= Math.max(0, 1 - dt * 2); },
    draw: function (c, p) {
      artShadow(c, 0, 0, s * 0.9, s * 0.15, 0.2);
      artLimb(c, 0, -s * 0.8, 0, -s * 1.9, s * 0.12, '#4a9a3a', '#1e4a18');
      artBlob(c, -s * 0.3, -s * 1.3, s * 0.3, s * 0.14, '#6fd66f', { lineColor: '#2a6a22', rot: -0.5 });
      c.save();
      c.translate(0, -s * 2.0);
      c.rotate(p.ang);
      drawFlower(c, 0, 0, s * 0.55, '#ff7bac');
      c.restore();
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.9); c.lineTo(s * 0.7, -s * 0.9); c.lineTo(s * 0.5, 0); c.lineTo(-s * 0.5, 0); c.closePath();
      artFillPath(c, '#d9703a', -s * 0.9, 0, s, { lineColor: '#7a3010' });
    },
    poke: function (p) {
      p.spin = 9;
      propDrop({
        x: p.x, y: p.y - s * 2.0, vx: viewW * 0.03, vy: -viewH * 0.1, vr: 3, ground: p.y - s * 0.05, life: 1.8,
        draw: function (c) { artBlob(c, 0, 0, s * 0.18, s * 0.1, '#ff9ec6', { lineColor: '#c04a7a' }); }
      });
    }
  });
  // Käen luukku (piirretään kellon kanssa; tämä on vain osuma-alue ja laskuri)
  propAdd({
    x: L.cx, y: L.cy - L.R * 1.25, r: L.R * 0.36, hy: L.R * 0.27, color: '#ffd24f', note: 988, amp: 0,
    draw: function () {},
    poke: function (p) {
      if (cuckoo.state === 'play' && cuckooListen()) return;
      if (cuckoo.bird.mode !== 'none') return;
      var b = cuckooBirdStart('peek', 1, false, false, null);
      b.chick = p.n % 5 === 0;
    }
  });
}

// ---------- Syöte ----------
function cuckooPickHand(px, py, L) {
  var dx = px - L.cx, dy = py - L.cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), dm, dh, hourOk, minOk;
  if (d > L.R * 1.12) return null;
  dm = Math.abs(cuckooWrapDiff(a - cuckooMinAng(cuckoo.tm), CUCKOO_TAU));
  dh = Math.abs(cuckooWrapDiff(a - cuckooHourAng(cuckoo.tm), CUCKOO_TAU));
  hourOk = d < L.R * 0.72 && dh < 0.6;
  minOk = d > L.R * 0.2 && dm < 0.6;
  if (hourOk && minOk) return d < L.R * 0.5 ? 'hour' : 'minute';
  if (hourOk) return 'hour';
  if (minOk) return 'minute';
  // Ei osunut kumpaankaan: lähempänä keskustaa tunti, reunalla minuutti
  return d < L.R * 0.5 ? 'hour' : 'minute';
}
function handleCuckooTap(px, py) {
  var L, hp, B, T, k, pp;
  if (puzzleBusy() || celebrating) return;
  if (cuckoo.state !== 'play') { propsTap(px, py); return; }
  L = cuckooLayout();
  // Vetorengas
  hp = cuckooHandlePos(L);
  if (Math.hypot(px - hp.x, py - hp.y) < L.R * 0.42) { cuckooPull(); return; }
  // Viisarit
  if (!cuckooBusy() && cuckoo.ci < CUCKOO_CARDS && Math.hypot(px - L.cx, py - L.cy) < L.R * 1.12) {
    k = cuckooPickHand(px, py, L);
    if (k) {
      cuckoo.drag = cuckooDragStart(k, cuckoo.tm, Math.atan2(py - L.cy, px - L.cx));
      cuckoo.dragged = true;
      playNote(k === 'hour' ? 660 : 880, 0, 0.08, 'sine', 0.2);
      return;
    }
  }
  // Kortti: kuuntelukortti toistaa kukahdukset, muuten kortti heilahtaa
  B = cuckooCardBox();
  if (cuckoo.ci < CUCKOO_CARDS && Math.abs(px - B.x) < B.w / 2 && Math.abs(py - B.y) < B.h / 2) {
    if (!cuckooListen()) { cuckoo.tonttu.hop = 0.3; playNote(587, 0, 0.1, 'triangle', 0.2); }
    return;
  }
  // Tonttu
  T = cuckooTontPos();
  if (Math.hypot(px - T.x, py - (T.y - T.s * 1.1)) < T.s * 1.1) {
    cuckoo.tonttu.blink = 0.5;
    cuckoo.tonttu.hop = 0.4;
    playNote(660, 0, 0.1, 'triangle', 0.25);
    playNote(880, 0.1, 0.12, 'triangle', 0.25);
    return;
  }
  // Heiluri: iso heilahdus ja tik-tak
  pp = cuckooPendBob(L);
  if (Math.hypot(px - pp.x, py - pp.y) < L.R * 0.4) {
    cuckoo.pend = 0.6;
    playNote(1200, 0, 0.05, 'square', 0.08);
    playNote(900, 0.3, 0.05, 'square', 0.08);
    spawnSparkles(pp.x, pp.y, 5, '#ffd24f');
    return;
  }
  propsTap(px, py);
}
function cuckooPull() {
  var cd = cuckoo.cards[cuckoo.ci], r, i, L, w, hpos;
  if (!cd || cuckoo.cardK < 1 || cuckooBusy() || cuckoo.pullT > 0) return;
  cuckoo.drag = null;
  cuckoo.pullT = 0.5;
  cuckoo.pulled = true;
  cuckoo.idleT = 0;
  playNote(330, 0, 0.08, 'triangle', 0.25);
  playNote(262, 0.12, 0.1, 'triangle', 0.2);
  r = cuckooCheck(cuckoo.tm, cd.tm);
  if (r.ok) {
    cuckooBirdStart('call', cuckooHourOf(cd.tm), true, true, 'next');
    cuckoo.tonttu.hop = 0.4;
    return;
  }
  // Väärin: käki tuhahtaa, väärä viisari heilahtaa ja paino putoaa
  if (r.hourWrong) cuckoo.wigH = 1.2;
  if (r.minWrong) cuckoo.wigM = 1.2;
  L = cuckooLayout();
  for (i = cuckoo.weights.length - 1; i >= 0; i--) {
    w = cuckoo.weights[i];
    if (!w.on) continue;
    w.on = false;
    hpos = { x: L.cx + CUCKOO_WX[i] * L.R, y: cuckooWeightTop(L) };
    propDrop({
      x: hpos.x, y: hpos.y + L.R * 0.25, vx: 0, vy: viewH * 0.1, vr: (i % 2 ? 1 : -1) * 1.5, ground: L.floor + L.R * 0.05, life: 1.5,
      draw: function (c) { cuckooDrawCone(c, 0, 0, L.R * 0.25, 0); },
      onLand: function () { playNote(98, 0, 0.3, 'triangle', 0.35); artShakeStart(viewH * 0.005, 0.2); }
    });
    break;
  }
  cuckooBirdStart('wrong', 0, false, true, cuckooWeightsLeft() === 0 ? 'restart' : null);
}

// ---------- Päivitys ----------
function updateCuckoo(dt) {
  var busy, cd, L, a, d, nt, i, w, R = cuckoo.R;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  if (cuckoo.tonttu.blink > 0) cuckoo.tonttu.blink -= dt;
  if (cuckoo.tonttu.hop > 0) cuckoo.tonttu.hop -= dt;
  if (cuckoo.pullT > 0) cuckoo.pullT -= dt;
  if (cuckoo.wigH > 0) cuckoo.wigH -= dt;
  if (cuckoo.wigM > 0) cuckoo.wigM -= dt;
  if (cuckoo.countPop > 0) cuckoo.countPop -= dt;
  cuckoo.pend += (0.22 - cuckoo.pend) * Math.min(1, dt * 0.8);
  for (i = 0; i < cuckoo.weights.length; i++) {
    w = cuckoo.weights[i];
    if (w.appear < 1) w.appear = Math.min(1, w.appear + dt * 2.5);
  }
  if (cuckoo.taskDelay > 0 && !busy) {
    cuckoo.taskDelay -= dt;
    if (cuckoo.taskDelay <= 0) {
      if (cuckoo.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (cuckoo.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  // Raahaus: sormen kulma kellon keskeltä
  if (cuckoo.drag) {
    if (holding && !busy && !cuckooBusy()) {
      L = cuckooLayout();
      d = Math.hypot(lastPX - L.cx, lastPY - L.cy);
      if (d > L.R * 0.12) {
        a = Math.atan2(lastPY - L.cy, lastPX - L.cx);
        nt = cuckooDragMove(cuckoo.drag, a, R ? R.step : 15);
        if (nt !== cuckoo.tm) {
          cuckoo.tm = nt;
          if (cuckoo.drag.kind === 'hour') playNote(700, 0, 0.05, 'square', 0.07);
          else playNote(nt % 60 === 0 ? 1400 : 1100, 0, 0.03, 'square', 0.05);
        }
      }
      cuckoo.idleT = 0;
    } else {
      cuckoo.drag = null;
    }
  }
  // Viisarit liukuvat napsahdusasentoon (lyhintä tietä)
  nt = cuckoo.disp + cuckooWrapDiff(cuckoo.tm - cuckoo.disp, 720);
  cuckoo.disp += (nt - cuckoo.disp) * Math.min(1, dt * (cuckoo.drag ? 25 : 6));
  cuckooUpdateBird(dt);
  if (busy || celebrating) return;
  cuckoo.t += dt;
  if (cuckoo.state === 'intro') { if (cuckoo.t > 0.6) cuckooStartRound(false); return; }
  if (cuckoo.state === 'roundDone') {
    if (cuckoo.t > 2.2 && cuckoo.taskDelay <= 0) {
      cuckoo.round++;
      if (cuckoo.round >= CUCKOO_ROUNDS.length) { cuckoo.state = 'won'; cuckoo.t = 0; soundFanfare(); }
      else cuckooStartRound(false);
    }
    return;
  }
  if (cuckoo.state === 'won') { if (cuckoo.t > 1.4) startCelebration(); return; }
  // Uusi kortti nousee tontun käsiin; kuuntelukortilla käki kukkuu heti
  cd = cuckoo.cards[cuckoo.ci];
  if (cd && cuckoo.cardK < 1) {
    cuckoo.cardK = Math.min(1, cuckoo.cardK + dt * 2);
    if (cuckoo.cardK >= 1 && cd.kind === 'listen' && !cd.heard) cuckooListen();
  }
  cuckoo.hintT += dt;
  if (!cuckoo.drag) cuckoo.idleT += dt;
  // Aikaraja: painot laskeutuvat; käen ollessa ulkona aika ei kulu
  if (R.time > 0 && !cuckooBusy() && cuckoo.bird.mode !== 'call') {
    var before = cuckoo.timeLeft;
    cuckoo.timeLeft -= dt;
    if (before > 10 && cuckoo.timeLeft <= 10) playNote(392, 0, 0.25, 'triangle', 0.2);
    if (cuckoo.timeLeft <= 0) {
      artShakeStart(viewH * 0.008, 0.4);
      playNote(98, 0, 0.4, 'triangle', 0.35);
      playNote(165, 0.3, 0.5, 'triangle', 0.25);
      cuckooStartRound(true);
    }
  }
}

// ---------- Piirto ----------
function renderCuckooBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x, y, L = cuckooLayout();
  g.addColorStop(0, '#8a9a5e');
  g.addColorStop(1, '#5e6e3e');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Tapetin raidat ja pikkukukat
  b.fillStyle = 'rgba(255,250,220,0.07)';
  for (i = 0; i < 16; i += 2) b.fillRect(vw * i / 16, 0, vw / 16, h * 0.9);
  for (i = 0; i < 16; i++) {
    for (y = 0; y < 5; y++) {
      x = vw * (i + 0.5) / 16;
      b.fillStyle = 'rgba(255,240,200,0.18)';
      b.beginPath(); b.arc(x, h * (0.08 + y * 0.17 + (i % 2) * 0.085), h * 0.007, 0, Math.PI * 2); b.fill();
    }
  }
  // Ikkuna vasemmalla
  artRoundRect(b, vw * 0.025, h * 0.42, vw * 0.13, h * 0.22, h * 0.02, '#9fd4ff', { lineColor: '#3a2418' });
  b.fillStyle = '#e8f2ff';
  b.beginPath(); b.moveTo(vw * 0.025, h * 0.62); b.lineTo(vw * 0.07, h * 0.52); b.lineTo(vw * 0.1, h * 0.58); b.lineTo(vw * 0.13, h * 0.5); b.lineTo(vw * 0.155, h * 0.62); b.closePath(); b.fill();
  b.strokeStyle = '#3a2418';
  b.lineWidth = Math.max(2, h * 0.008);
  b.beginPath(); b.moveTo(vw * 0.09, h * 0.42); b.lineTo(vw * 0.09, h * 0.64); b.moveTo(vw * 0.025, h * 0.53); b.lineTo(vw * 0.155, h * 0.53); b.stroke();
  // Hylly herätyskellolle
  artRoundRect(b, vw * 0.02, h * 0.3, vw * 0.15, h * 0.02, h * 0.006, '#a87040', { lineColor: '#4a2a10' });
  // Lautalattia ja matto kellon alla
  artRoundRect(b, 0, h * 0.9, vw, h * 0.1, 0, '#a8703c', { shadeTo: '#6a4220', line: false });
  b.strokeStyle = 'rgba(60,30,10,0.3)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath(); b.moveTo(0, h * 0.9); b.lineTo(vw, h * 0.9); b.stroke();
  for (i = 0; i < 9; i++) { x = vw * (i + 0.3) / 9; b.beginPath(); b.moveTo(x, h * 0.9); b.lineTo(x - vw * 0.02, h); b.stroke(); }
  artBlob(b, L.cx, h * 0.95, L.R * 1.6, h * 0.03, '#c0503a', { lineColor: '#6a2418', flat: true });
  artBlob(b, L.cx, h * 0.95, L.R * 1.3, h * 0.018, '#e8b84a', { line: false, flat: true });
  // Kellon varjo seinällä
  b.fillStyle = 'rgba(30,40,10,0.18)';
  roundRect(b, L.cx - L.R * 1.15, L.cy - L.R * 1.1, L.R * 2.5, L.R * 2.5, L.R * 0.2);
  b.fill();
}

function cuckooDrawCone(c, x, y, s, rot) {
  var i;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  artBlob(c, 0, 0, s * 0.55, s, '#8a5a30', { lineColor: '#3a2010', hi: 0.2 });
  c.strokeStyle = 'rgba(40,20,5,0.55)';
  c.lineWidth = Math.max(1, s * 0.08);
  for (i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(-s * 0.5, i * s * 0.45 - s * 0.15); c.lineTo(0, i * s * 0.45 + s * 0.05); c.lineTo(s * 0.5, i * s * 0.45 - s * 0.15); c.stroke();
  }
  c.restore();
}
// Käki: s = koko, beak = nokka auki (0..1), shake = pään pudistus (rad)
function cuckooDrawBird(c, x, y, s, beak, shake, chick) {
  var col = chick ? '#ffe27a' : '#9a7a5a', dark = chick ? '#a08010' : '#4a3020';
  c.save();
  c.translate(x, y);
  // Pyrstö ja vartalo
  c.beginPath(); c.moveTo(s * 0.3, s * 0.1); c.lineTo(s * 1.1, -s * 0.2); c.lineTo(s * 1.0, s * 0.3); c.closePath();
  if (!chick) artFillPath(c, artShade(col, -0.2), -s * 0.2, s * 0.3, s * 0.4, { lineColor: dark });
  artBlob(c, s * 0.15, s * 0.15, s * 0.62, s * 0.45, col, { lineColor: dark, hi: 0.25 });
  artBlob(c, s * 0.0, s * 0.32, s * 0.36, s * 0.24, chick ? '#fff6c0' : '#f0dcc0', { line: false });
  artBlob(c, s * 0.35, s * 0.05, s * 0.3, s * 0.18, artShade(col, -0.15), { lineColor: dark, rot: -0.3 });
  // Pää
  c.rotate(shake);
  artCircle(c, -s * 0.38, -s * 0.32, s * 0.36, col, { lineColor: dark, hi: 0.3 });
  artEye(c, -s * 0.45, -s * 0.38, s * 0.1, -0.6, false);
  // Nokka: kaksi kolmiota, alanokka aukeaa
  c.fillStyle = '#ff9a2a';
  c.strokeStyle = '#a0500a';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.moveTo(-s * 0.68, -s * 0.36); c.lineTo(-s * 1.05, -s * 0.3 - beak * s * 0.12); c.lineTo(-s * 0.68, -s * 0.24); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.68, -s * 0.26); c.lineTo(-s * 0.98, -s * 0.24 + beak * s * 0.22); c.lineTo(-s * 0.7, -s * 0.16); c.closePath(); c.fill(); c.stroke();
  c.restore();
}
// Kellotaulu: disp = aika minuutteina (saa olla kiertymätön), wig = viisarin heilahdus
function cuckooDrawFace(c, x, y, r, disp, wigH, wigM, big) {
  var i, a, am, ah;
  artCircle(c, x, y, r, '#8a5a30', { lineColor: '#3a2010', hi: 0.15 });
  artCircle(c, x, y, r * 0.88, '#fff6e0', { lineColor: '#c9a070', shadeTo: '#f0e0c0' });
  // Minuuttimerkit (siniset) yhtenä polkuna
  c.fillStyle = '#2a62c8';
  c.beginPath();
  for (i = 0; i < 60; i++) {
    if (!big && i % 5) continue;
    a = i / 60 * CUCKOO_TAU - Math.PI / 2;
    var rr = i % 5 ? r * 0.018 : r * 0.035;
    c.moveTo(x + Math.cos(a) * r * 0.8 + rr, y + Math.sin(a) * r * 0.8);
    c.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, rr, 0, CUCKOO_TAU);
  }
  c.fill();
  // Tuntinumerot (punaiset kuten tuntiviisari)
  c.fillStyle = '#b8322a';
  c.font = 'bold ' + Math.round(r * 0.22) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (i = 1; i <= 12; i++) {
    a = i / 12 * CUCKOO_TAU - Math.PI / 2;
    c.fillText(String(i), x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62 + r * 0.015);
  }
  ah = cuckooHourAng(disp) + wigH;
  am = cuckooMinAng(disp) + wigM;
  // Tuntiviisari: lyhyt ja paksu, punainen
  artLimb(c, x - Math.cos(ah) * r * 0.08, y - Math.sin(ah) * r * 0.08, x + Math.cos(ah) * r * 0.46, y + Math.sin(ah) * r * 0.46, Math.max(3, r * 0.12), '#e0403a', '#7a1a10');
  // Minuuttiviisari: pitkä ja ohut, sininen, pyöreä pää
  artLimb(c, x - Math.cos(am) * r * 0.12, y - Math.sin(am) * r * 0.12, x + Math.cos(am) * r * 0.76, y + Math.sin(am) * r * 0.76, Math.max(2, r * 0.05), '#3a7ae0', '#123a80');
  artCircle(c, x + Math.cos(am) * r * 0.76, y + Math.sin(am) * r * 0.76, Math.max(2, r * 0.05), '#3a7ae0', { lineColor: '#123a80' });
  artCircle(c, x, y, Math.max(3, r * 0.08), '#ffd24f', { lineColor: '#8a6a10' });
}
// Digitaaliaika: tunti punaisella, minuutit sinisellä
function cuckooDrawDigital(c, tm, x, y, fs) {
  var hs = String(cuckooHourOf(tm)), m = cuckooWrap(tm, 60), ms = (m < 10 ? '0' : '') + m, wh, wc, wm, x0;
  c.font = 'bold ' + Math.round(fs) + 'px ' + UI_FONT;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  wh = c.measureText(hs).width; wc = c.measureText(':').width; wm = c.measureText(ms).width;
  x0 = x - (wh + wc + wm) / 2;
  c.fillStyle = '#d8342a'; c.fillText(hs, x0, y);
  c.fillStyle = '#5a3a1a'; c.fillText(':', x0 + wh, y - fs * 0.05);
  c.fillStyle = '#2a62c8'; c.fillText(ms, x0 + wh + wc, y);
  c.textAlign = 'center';
}
function cuckooDrawHourglass(c, x, y, s) {
  var k = (globalT * 0.5) % 1;
  artRoundRect(c, x - s * 0.5, y - s * 0.62, s, s * 0.14, s * 0.05, '#a87040', { lineColor: '#4a2a10' });
  artRoundRect(c, x - s * 0.5, y + s * 0.48, s, s * 0.14, s * 0.05, '#a87040', { lineColor: '#4a2a10' });
  c.beginPath();
  c.moveTo(x - s * 0.38, y - s * 0.48); c.lineTo(x + s * 0.38, y - s * 0.48); c.lineTo(x + s * 0.06, y); c.lineTo(x + s * 0.38, y + s * 0.48); c.lineTo(x - s * 0.38, y + s * 0.48); c.lineTo(x - s * 0.06, y); c.closePath();
  artFillPath(c, '#e8f6ff', y - s * 0.48, y + s * 0.48, s * 0.4, { lineColor: '#5a7a9a' });
  // Hiekka valuu
  c.fillStyle = '#e8b84a';
  c.beginPath(); c.moveTo(x - s * 0.3 * (1 - k), y - s * 0.4 * (1 - k)); c.lineTo(x + s * 0.3 * (1 - k), y - s * 0.4 * (1 - k)); c.lineTo(x, y); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x, y + s * 0.48 - s * 0.35 * (0.3 + k * 0.7)); c.lineTo(x + s * 0.34, y + s * 0.46); c.lineTo(x - s * 0.34, y + s * 0.46); c.closePath(); c.fill();
  c.strokeStyle = '#e8b84a';
  c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + s * 0.4); c.stroke();
}
function cuckooDrawCard(c, cd, B, k) {
  var x = B.x, y = B.y, w = B.w, h = B.h, i, n, sc = easeOutBack(k);
  c.save();
  c.translate(x, y + (1 - k) * h * 0.6);
  c.scale(sc, sc);
  c.translate(-x, -y);
  artShadow(c, x, y + h * 0.55, w * 0.5, h * 0.06, 0.2);
  artRoundRect(c, x - w / 2, y - h / 2, w, h, w * 0.08, '#fffaf0', { shadeTo: '#f0e4cc', lineColor: '#8a6a40', hi: 0.1 });
  artCircle(c, x, y - h * 0.46, w * 0.035, '#e0403a', { lineColor: '#7a1a10' });
  if (cd.kind === 'pic') {
    cuckooDrawDigital(c, cd.tm, x, y - h * 0.29, h * 0.21);
    cuckooDrawFace(c, x, y + h * 0.15, h * 0.26, cd.tm, 0, 0, false);
  } else if (cd.kind === 'digi') {
    cuckooDrawDigital(c, cd.tm, x, y, h * 0.3);
  } else if (cd.kind === 'listen') {
    // Kuuntele: käki, ääniaallot ja kysymysmerkki
    var bt = cuckoo.bird, talk = bt && bt.mode === 'call' && !bt.count ? bt.beak : 0;
    cuckooDrawBird(c, x - w * 0.12, y - h * 0.12, h * 0.17, Math.min(1, talk * 3), 0, false);
    c.strokeStyle = '#8a6a40';
    c.lineWidth = Math.max(2, h * 0.02);
    c.lineCap = 'round';
    for (i = 0; i < 3; i++) {
      c.globalAlpha = talk > 0 ? 1 : 0.5;
      c.beginPath(); c.arc(x - w * 0.36, y - h * 0.17, h * (0.06 + i * 0.05), Math.PI * 0.75, Math.PI * 1.25); c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = '#d8342a';
    c.font = 'bold ' + Math.round(h * 0.26) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', x, y + h * 0.24);
    c.fillStyle = '#2a62c8';
    c.font = 'bold ' + Math.round(h * 0.16) + 'px ' + UI_FONT;
    c.fillText(':00', x + w * 0.24, y + h * 0.26);
  } else if (cd.kind === 'plus') {
    cuckooDrawFace(c, x, y - h * 0.15, h * 0.24, cd.base, 0, 0, false);
    n = cd.plus;
    c.fillStyle = '#5a3a1a';
    c.font = 'bold ' + Math.round(h * 0.2) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('+' + n, x - w * 0.22, y + h * 0.3);
    for (i = 0; i < n; i++) cuckooDrawHourglass(c, x + w * 0.1 + i * h * 0.16, y + h * 0.3, h * 0.15);
  }
  c.restore();
}
function cuckooDrawTonttu(c, x, fy, s, armY, hop, blink) {
  var y = fy - hop, sh = 0;
  artShadow(c, x, fy, s * 0.6, s * 0.12, 0.2);
  // Kädet ylhäällä pitelemässä korttia
  artLimb(c, x - s * 0.3, y - s * 0.75, x - s * 0.55, armY, s * 0.15, '#e0403a', '#8a1a1a');
  artLimb(c, x + s * 0.3, y - s * 0.75, x + s * 0.55, armY, s * 0.15, '#e0403a', '#8a1a1a');
  artCircle(c, x - s * 0.55, armY, s * 0.12, '#ffd9b8', { lineColor: '#c99a7a' });
  artCircle(c, x + s * 0.55, armY, s * 0.12, '#ffd9b8', { lineColor: '#c99a7a' });
  artBlob(c, x + sh, y - s * 0.45, s * 0.42, s * 0.48, '#e0403a', { lineColor: '#8a1a1a', hi: 0.2 });
  artCircle(c, x - s * 0.18, y - s * 0.03, s * 0.13, '#5a3a1a', { line: false });
  artCircle(c, x + s * 0.18, y - s * 0.03, s * 0.13, '#5a3a1a', { line: false });
  artCircle(c, x, y - s * 1.12, s * 0.32, '#ffd9b8', { lineColor: '#c99a7a' });
  artBlob(c, x, y - s * 0.9, s * 0.3, s * 0.22, '#ffffff', { lineColor: '#c9c0d8' });
  artEye(c, x - s * 0.11, y - s * 1.17, s * 0.06, 0.5, blink);
  artEye(c, x + s * 0.11, y - s * 1.17, s * 0.06, 0.5, blink);
  artBlush(c, x - s * 0.2, y - s * 1.05, s * 0.06);
  artBlush(c, x + s * 0.2, y - s * 1.05, s * 0.06);
  c.beginPath();
  c.moveTo(x - s * 0.36, y - s * 1.25); c.lineTo(x + s * 0.36, y - s * 1.25); c.lineTo(x + s * 0.3, y - s * 1.85);
  c.closePath();
  artFillPath(c, '#3a9a4a', y - s * 1.85, y - s * 1.25, s * 0.3, { lineColor: '#1a4a22' });
  artCircle(c, x + s * 0.3, y - s * 1.85, s * 0.09, '#ffffff', { line: false });
}
function cuckooPendBob(L) {
  var a = Math.sin(globalT * 2.6) * cuckoo.pend, len = L.R * 0.8, px = L.cx, py = L.cy + L.R * 1.2;
  return { x: px + Math.sin(a) * len, y: py + Math.cos(a) * len, a: a, px: px, py: py };
}
// Koko kello: rattaat takana, kotelo ja katto, luukku ja käki, heiluri, painot, taulu
function cuckooDrawClock(c, L) {
  var R = L.R, cx = L.cx, cy = L.cy, i, b = cuckoo.bird, d = cuckoo.disp, pb, wt, x, k;
  // Rattaat kellon takana: kääntyvät viisarien mukana
  gearDrawWheel(c, cx - R * 1.2, cy - R * 0.5, R * 0.42, d * 0.06 + globalT * 0.15, '#d9b070', 9);
  gearDrawWheel(c, cx + R * 1.22, cy + R * 0.3, R * 0.36, -d * 0.07 - globalT * 0.18, '#c0c8d8', 8);
  gearDrawWheel(c, cx - R * 1.08, cy + R * 0.85, R * 0.24, -d * 0.1 - globalT * 0.22, '#e8b84a', 7);
  // Heiluri kotelon alla
  pb = cuckooPendBob(L);
  c.strokeStyle = '#7a5a28';
  c.lineWidth = Math.max(2, R * 0.05);
  c.beginPath(); c.moveTo(pb.px, pb.py); c.lineTo(pb.x, pb.y); c.stroke();
  artCircle(c, pb.x, pb.y, R * 0.2, '#ffd24f', { lineColor: '#8a6a10', hi: 0.45 });
  drawFlower(c, pb.x, pb.y, R * 0.08, '#ff7bac');
  // Painot ketjuissa
  wt = cuckooWeightTop(L);
  for (i = 0; i < cuckoo.weights.length; i++) {
    x = cx + CUCKOO_WX[i] * R;
    var on = cuckoo.weights[i].on, ap = cuckoo.weights[i].appear;
    c.strokeStyle = '#6a6a7a';
    c.lineWidth = Math.max(1.5, R * 0.025);
    c.setLineDash([R * 0.05, R * 0.03]);
    c.beginPath(); c.moveTo(x, cy + R * 1.15); c.lineTo(x, on ? wt + R * 0.02 : cy + R * 1.4); c.stroke();
    c.setLineDash([]);
    if (on && ap > 0) {
      var late = cuckoo.R && cuckoo.R.time > 0 && cuckoo.state === 'play' && cuckoo.timeLeft < 10;
      if (late) artGlow(c, x, wt + R * 0.25, R * 0.4, '#ff5a3a', 0.35 + Math.sin(globalT * 8) * 0.15);
      cuckooDrawCone(c, x, wt + R * 0.25 - (1 - ap) * R * 0.5, R * 0.25 * easeOutBack(ap), 0);
    }
  }
  // Kotelo
  artRoundRect(c, cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.45, R * 0.15, '#a8703c', { shadeTo: '#6a4220', lineColor: '#3a2010', hi: 0.1 });
  // Katto: harjakatto ja lehtikoristeet
  c.beginPath();
  c.moveTo(cx - R * 1.5, cy - R * 1.05); c.lineTo(cx, cy - R * 1.95); c.lineTo(cx + R * 1.5, cy - R * 1.05); c.closePath();
  artFillPath(c, '#7a4a24', cy - R * 1.95, cy - R * 1.05, R, { lineColor: '#3a2010' });
  for (i = 0; i < 5; i++) {
    var lx = cx + (i - 2) * R * 0.55;
    artBlob(c, lx, cy - R * 1.05, R * 0.17, R * 0.1, i % 2 ? '#6fb85a' : '#4a9a3a', { lineColor: '#1e4a18', rot: (i - 2) * 0.3 });
  }
  // Luukku ja käki
  k = b ? easeOutCubic(b.open) : 0;
  var dx = cx, dy = cy - R * 1.42, dw = R * 0.5, dh = R * 0.42;
  artRoundRect(c, dx - dw / 2, dy - dh / 2, dw, dh, R * 0.1, '#2a1408', { lineColor: '#1a0a04' });
  if (b && b.mode !== 'none' && k > 0.02) {
    var shake = b.mode === 'wrong' && b.t > 0.3 && b.t < 1.3 ? Math.sin(b.t * 22) * 0.35 : 0;
    var bs = R * 0.3 * (0.4 + 0.6 * k), by = dy + dh * 0.15 - k * R * 0.08;
    // Orsi
    artLimb(c, dx, dy + dh * 0.4, dx, dy + dh * 0.4 + k * R * 0.05, R * 0.06, '#c08a50', '#5a3a1a');
    if (b.chick) cuckooDrawBird(c, dx + R * 0.3 * k, by + R * 0.12, bs * 0.55, b.t > 1.0 && b.t < 1.6 ? 1 : 0, Math.sin(globalT * 9) * 0.15, true);
    cuckooDrawBird(c, dx - R * 0.02, by, bs, Math.min(1, b.beak * 3), shake, false);
    if (b.mode === 'wrong' && b.t > 0.35 && b.t < 1.0) {
      // Tuhahduspilvi
      for (i = 0; i < 3; i++) artCircle(c, dx - R * 0.45 - i * R * 0.1, by - R * 0.1 - i * R * 0.06, R * (0.05 + i * 0.02), '#ffffff', { line: false, alpha: 0.7 - (b.t - 0.35) });
    }
  }
  // Luukun ovet aukeavat sivuille
  c.save();
  c.translate(dx - dw / 2, 0);
  c.scale(Math.max(0.06, 1 - k), 1);
  artRoundRect(c, 0, dy - dh / 2, dw / 2, dh, R * 0.06, '#c08a50', { lineColor: '#5a3a1a' });
  c.restore();
  c.save();
  c.translate(dx + dw / 2, 0);
  c.scale(-Math.max(0.06, 1 - k), 1);
  artRoundRect(c, 0, dy - dh / 2, dw / 2, dh, R * 0.06, '#c08a50', { lineColor: '#5a3a1a' });
  c.restore();
  // Taulu ja viisarit
  var wh = cuckoo.wigH > 0 ? Math.sin(cuckoo.wigH * 26) * 0.18 * Math.min(1, cuckoo.wigH) : 0;
  var wm = cuckoo.wigM > 0 ? Math.sin(cuckoo.wigM * 26) * 0.18 * Math.min(1, cuckoo.wigM) : 0;
  if (cuckoo.drag) {
    // Raahattava viisari hehkuu
    var ga = cuckoo.drag.kind === 'hour' ? cuckooHourAng(d) : cuckooMinAng(d), gr = cuckoo.drag.kind === 'hour' ? 0.46 : 0.76;
    artGlow(c, cx + Math.cos(ga) * R * gr, cy + Math.sin(ga) * R * gr, R * 0.3, cuckoo.drag.kind === 'hour' ? '#ff7a6a' : '#7aaaff', 0.6);
  }
  cuckooDrawFace(c, cx, cy, R, d, wh, wm, true);
  if (wh) artGlow(c, cx + Math.cos(cuckooHourAng(d)) * R * 0.3, cy + Math.sin(cuckooHourAng(d)) * R * 0.3, R * 0.35, '#ff5a3a', 0.4);
  if (wm) artGlow(c, cx + Math.cos(cuckooMinAng(d)) * R * 0.55, cy + Math.sin(cuckooMinAng(d)) * R * 0.55, R * 0.35, '#5a8aff', 0.4);
}
function cuckooDrawHandle(c, L) {
  var hp = cuckooHandlePos(L), R = L.R, pegX = L.cx - R * 1.2, pegY = L.cy - R * 0.2;
  c.strokeStyle = '#c9a070';
  c.lineWidth = Math.max(2, R * 0.04);
  c.beginPath(); c.moveTo(pegX, pegY); c.lineTo(hp.x, pegY); c.lineTo(hp.x, hp.y - R * 0.2); c.stroke();
  artCircle(c, hp.x, pegY, R * 0.05, '#8a5a30', { lineColor: '#3a2010' });
  if (cuckoo.round === 0 && cuckoo.state === 'play') artGlow(c, hp.x, hp.y, R * 0.45, '#ffe27a', 0.25 + Math.sin(globalT * 4) * 0.12);
  // Kultarengas, jonka keskellä pieni käki
  artCircle(c, hp.x, hp.y, R * 0.22, '#ffd24f', { lineColor: '#8a6a10', hi: 0.45 });
  artCircle(c, hp.x, hp.y, R * 0.13, '#fff6e0', { lineColor: '#8a6a10' });
  cuckooDrawBird(c, hp.x + R * 0.02, hp.y + R * 0.02, R * 0.09, 0, 0, false);
}

function drawCuckoo() {
  var c = ctx, L, B, T, cd, b, i, k, p;
  if (!beginPlayWorld()) return;
  L = cuckooLayout();
  cuckooDrawClock(c, L);
  cuckooDrawHandle(c, L);
  propsDraw(c);
  // Tonttu ja kortti
  B = cuckooCardBox();
  T = cuckooTontPos();
  cd = cuckoo.cards[cuckoo.ci];
  var hop = cuckoo.tonttu.hop > 0 ? Math.sin(Math.min(1, cuckoo.tonttu.hop / 0.5) * Math.PI) * T.s * 0.3 : 0;
  var armY = cd && cuckoo.state === 'play' ? B.y + B.h / 2 - hop : T.y - T.s * 0.9 - hop;
  cuckooDrawTonttu(c, T.x, T.y, T.s, armY, hop, cuckoo.tonttu.blink > 0);
  if (cd && cuckoo.state === 'play' && cuckoo.cardK > 0) cuckooDrawCard(c, cd, B, cuckoo.cardK);
  // Korttien edistyminen: kolme tähteä kortin yllä
  if (cuckoo.state === 'play' || cuckoo.state === 'roundDone') {
    for (i = 0; i < CUCKOO_CARDS; i++) {
      var sx = B.x + (i - 1) * viewH * 0.05, sy = B.y - B.h / 2 - viewH * 0.045;
      if (i < cuckoo.ci) drawStar(c, sx, sy, viewH * 0.018, 0, 0.4);
      else artCircle(c, sx, sy, viewH * (i === cuckoo.ci ? 0.012 : 0.009), '#fff6e0', { lineColor: '#8a6a40', alpha: 0.7 });
    }
  }
  // Kukahduslaskuri
  b = cuckoo.bird;
  if (b && b.mode === 'call' && b.count && b.i > 0) {
    var nx = L.cx + L.R * 0.95, ny = L.cy - L.R * 1.75, pop = cuckoo.countPop > 0 ? 1 + cuckoo.countPop : 1;
    artCircle(c, nx, ny, L.R * 0.3 * pop, '#ffffff', { lineColor: '#8a6a40', hi: 0.2 });
    c.fillStyle = '#d8342a';
    c.font = 'bold ' + Math.round(L.R * 0.4 * pop) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(b.i), nx, ny + L.R * 0.02);
  }
  // Vihjeet 1. kierroksella: käsi raahaa tuntiviisaria, myöhemmin näyttää vetorenkaan
  if (cuckoo.round === 0 && cuckoo.state === 'play' && cd && cuckoo.cardK >= 1 && !cuckooBusy()) {
    if (cuckoo.ci === 0 && !cuckoo.dragged && cuckoo.hintT > 1.5) {
      var hp2 = (cuckoo.hintT - 1.5) % 3, a0 = cuckooHourAng(cuckoo.tm), a1 = a0 + cuckooWrapDiff(cuckooHourAng(cd.tm) - a0, CUCKOO_TAU);
      k = easeInOutSine(Math.min(1, hp2 / 2));
      var ha = a0 + (a1 - a0) * k, hx = L.cx + Math.cos(ha) * L.R * 0.42, hy = L.cy + Math.sin(ha) * L.R * 0.42;
      if (hp2 < 2.5) {
        c.globalAlpha = 0.45;
        artLimb(c, L.cx, L.cy, L.cx + Math.cos(ha) * L.R * 0.46, L.cy + Math.sin(ha) * L.R * 0.46, Math.max(3, L.R * 0.12), '#e0403a', '#7a1a10');
        c.globalAlpha = 0.9;
        drawHand(c, hx + L.R * 0.08, hy + L.R * 0.05, L.R * 0.28);
        c.globalAlpha = 1;
      }
    } else if (!cuckoo.pulled && cuckoo.dragged && cuckoo.idleT > 3) {
      p = cuckooHandlePos(L);
      k = (globalT % 1.2) / 1.2;
      drawHand(c, p.x + L.R * 0.05, p.y + L.R * 0.1 + Math.abs(Math.sin(k * Math.PI)) * L.R * 0.15, L.R * 0.28);
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawCuckooHud(c);
  drawTaskOverlay(c);
}
// HUD: kierrokset käkinä; kultainen = kierros ilman pudonnutta painoa
function drawCuckooHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = CUCKOO_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.8 * n + hs * 1.2, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < cuckoo.round || cuckoo.state === 'won' || (i === cuckoo.round && cuckoo.state === 'roundDone');
    var x = left + hs * 2.1 + i * hs * 2.8, y = pad * 0.5 + hs * 1.8;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && cuckoo.gold[i]) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.7);
    cuckooDrawBird(c, x, y, hs * 0.9, 0, 0, done && cuckoo.gold[i]);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.cuckoo = function (c, x, y, s) {
  var r = s * 0.15, a = Math.sin(globalT * 2.6) * 0.3;
  c.strokeStyle = '#7a5a28';
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath(); c.moveTo(x, y + r * 0.9); c.lineTo(x + Math.sin(a) * r * 0.9, y + r * 0.9 + Math.cos(a) * r * 0.9); c.stroke();
  artCircle(c, x + Math.sin(a) * r * 0.9, y + r * 0.9 + Math.cos(a) * r * 0.9, r * 0.22, '#ffd24f', { lineColor: '#8a6a10' });
  artRoundRect(c, x - r * 1.15, y - r * 1.1, r * 2.3, r * 2.2, r * 0.15, '#a8703c', { lineColor: '#3a2010' });
  c.beginPath(); c.moveTo(x - r * 1.4, y - r * 0.95); c.lineTo(x, y - r * 1.85); c.lineTo(x + r * 1.4, y - r * 0.95); c.closePath();
  artFillPath(c, '#7a4a24', y - r * 1.85, y - r * 0.95, r, { lineColor: '#3a2010' });
  cuckooDrawFace(c, x, y + r * 0.05, r * 0.85, 3 * 60 + globalT * 20, 0, 0, false);
  cuckooDrawBird(c, x, y - r * 1.3, r * 0.35, 0, 0, false);
};
