'use strict';

// Rapukuningas (Meren valtakunta, Korallikylä, huone K, paikan vartija):
// kuoripeli hiekkalinnan valtaistuimen edessä. Äreä mutta reilu Rapukuningas
// pitää hohtavaa valohelmeä saksissaan ja pudottaa sen yhden ison
// simpukankuoren alle.
//   - Kuori odottaa auki ja helmi hehkuu: napautus sulkee kuoren (lapsi
//     katsoo varmasti helmeä, kun sekoitus alkaa). Kuningas napsauttaa
//     saksiaan kahdesti, ja kuoret vaihtavat paikkaa näkyvinä kaarina:
//     toinen kuori kiertää takaa (nousee ja pienenee), toinen edestä.
//     Mitään ei vaihdeta piilossa.
//   - Kun kuoret pysähtyvät, napautetaan kuorta. Oikein: kuori nousee, helmi
//     hehkuu, pikkuravut hurraavat, kuningas tuhahtaa ja ottaa helmen
//     takaisin. Väärin: kuori nousee tyhjänä, kuningas nauraa saksia
//     napsutellen, oikea kuori näytetään ja sama kierros alkaa alusta uudella
//     sekoituksella (ei sydämiä, ei paluuta kentän alkuun).
//   - Mukautuva apu: joka toisen peräkkäisen hudin jälkeen sama kierros
//     sekoitetaan hieman hitaammin (CRK_SLOW_STEP, enintään CRK_SLOW_MAX).
//   - Kultainen helmikuori (+1 tähti): enintään CRK_GOLD_MISS hutia koko kentässä.
// Viisi kierrosta (CRK_ROUNDS): 3 kuorta / 4 vaihtoa hitaasti -> 3 / 6 ->
// 4 / 7 -> 4 / 7, joista osa kahden parin yhtäaikaisia vaihtoja -> 5 / 9
// ja kuninkaan hämäys (kurkistaa tyhjän kuoren alle). Välitehtävät toisen ja
// neljännen kierroksen jälkeen. Lopuksi kuningas hämmästyy, ojentaa helmen,
// ja helmi nousee kohti pintaa, Merikuningattaren kruunuun.
// Tökättävät koristeet: kaksi pikkurapua, linnan lippu, merivuokko ja
// kaukainen kallio, jonka kolosta arka mustekala kurkkii.

// ---------- Säätövakiot ----------
// n = kuoria; moves = vaihtoja (tuplavaihto = yksi liike); sp = viereisen
// vaihdon kesto (s), pidempi vaihto kestää sp × (CRK_DUR_BASE + CRK_DUR_DIST
// × etäisyys); doubles = montako liikkeistä on kahden parin yhtäaikainen
// vaihto (parit eivät mene ristiin); maxD = suurin vaihtoetäisyys (paikkaa);
// bias = todennäköisyys, että helmikuori on vaihdossa mukana (muuten pari
// arvotaan); feints = kuninkaan hämäyksiä.
// Mitoitus seuraaja-botilla (virhe todennäköisyydellä 0,0167 × v^1,5, v =
// paikkaa/s, tuplavaihdossa × 1,6): lapsibotti läpäisee kierroksen
// ensimmäisellä yrityksellä n. 94 / 79 / 70 / 68 / 49 %, kultaan pääsee
// n. 64 %; aikuisbotti (virhe × 0,35) 98–76 %, kulta 95 %.
var CRK_ROUNDS = [
  { n: 3, moves: 4, sp: 0.85, doubles: 0, maxD: 1, bias: 0.75, feints: 0 },
  { n: 3, moves: 6, sp: 0.6, doubles: 0, maxD: 2, bias: 0.7, feints: 0 },
  { n: 4, moves: 7, sp: 0.5, doubles: 0, maxD: 2, bias: 0.65, feints: 0 },
  { n: 4, moves: 7, sp: 0.52, doubles: 3, maxD: 2, bias: 0.65, feints: 0 },
  { n: 5, moves: 9, sp: 0.46, doubles: 3, maxD: 3, bias: 0.65, feints: 1 }
];
var CRK_DUR_BASE = 0.7;      // vaihdon kesto = sp × (BASE + DIST × etäisyys)
var CRK_DUR_DIST = 0.3;
var CRK_GAP = 0.1;           // pieni tauko liikkeiden välissä (s)
var CRK_FEINT_T = 1.7;       // hämäyksen kesto (s)
var CRK_SLOW_STEP = 1.15;    // mukautuva apu: kesto × tämä joka toisen peräkkäisen hudin jälkeen
var CRK_SLOW_MAX = 1.45;
var CRK_GOLD_MISS = 2;       // kultainen helmikuori: enintään näin monta hutia
var CRK_TASK_AFTER = [1, 3]; // välitehtävä näiden kierrosten jälkeen (0 = ensimmäinen)
var CRK_HINT_IDLE = 3.5;     // vihjekäsi avoimen kuoren päälle (s)
var CRK_FLY_T = 0.7;         // helmen lento saksista kuoreen ja takaisin (s)
var CRK_LIFT_H = 0.14;       // kuoren nousu (× viewH)
var CRK_ARC_BACK = 0.05;     // takaa kiertävän kuoren kaari (× viewH) ...
var CRK_ARC_BACK_D = 0.018;  // ... + tämä × etäisyys
var CRK_ARC_FRONT = 0.028;   // edestä kiertävän kuoren notkahdus (× viewH)
var CRK_FINALE = 4.8;        // loppukohtaus ennen juhlaa (s)

var CRK_SHELL = '#ffc2b0';
var CRK_SHELL_LINE = '#b8625a';
var CRK_RED = '#e8503a';
var CRK_RED_LINE = '#8a2a1a';

var crk = {
  t: 0, round: 0, state: 'enter', st: 0, shells: [], pearlShell: 0, pearl: null,
  seq: [], mi: 0, moveT: 0, moveD: 0, feint: null, picked: -1,
  misses: 0, consMiss: 0, slow: 1, mood: 'grump', moodT: 0, clackT: 0, look: 0,
  cheerT: 0, idleT: 0, goldLostT: 0, taskIdx: 0, octoT: 0, octoNext: 12, octoPop: 0,
  bubbles: [], swimmers: [], trumpT: 0, done: false, celT: 0, trail: [], bonusGiven: false
};

// ---------- Mittasuhteet ----------
function crkGap(n) { return Math.min(viewW * 0.78 / n, viewH * 0.3); }
function crkShellS(n) { return Math.min(crkGap(n) * 0.36, viewH * 0.085); }
function crkSlotX(slot, n) { return viewW / 2 + (slot - (n - 1) / 2) * crkGap(n); }
function crkRowY() { return viewH * 0.83; }
function crkK() { return viewH * 0.085; }
function crkKingX() { return viewW / 2; }
function crkKingY() { return viewH * 0.5; }
function crkEase(f) { return f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; }

// Kuoren sijainti tällä hetkellä: { x, y (pohja), sc, base (hiekan kohta) }
function crkShellPos(sh) {
  var n = crk.shells.length, x, y = crkRowY(), sc = 1, a, e, d;
  if (sh.f < 1) {
    e = crkEase(sh.f);
    a = Math.sin(sh.f * Math.PI);
    d = Math.abs(sh.to - sh.from);
    x = crkSlotX(sh.from, n) + (crkSlotX(sh.to, n) - crkSlotX(sh.from, n)) * e;
    if (sh.dir < 0) { y -= a * viewH * (CRK_ARC_BACK + CRK_ARC_BACK_D * d); sc = 1 - 0.12 * a; }
    else { y += a * viewH * CRK_ARC_FRONT; sc = 1 + 0.08 * a; }
  } else {
    x = crkSlotX(sh.slot, n);
  }
  return { x: x, y: y - sh.lift * viewH * CRK_LIFT_H, base: y, sc: sc * (sh.pop < 1 ? easeOutBack(Math.max(0, sh.pop)) : 1) };
}
function crkShellAt(slot) {
  var i;
  for (i = 0; i < crk.shells.length; i++) if (crk.shells[i].slot === slot) return i;
  return -1;
}
// Kuninkaan sakset: side -1 vasen, 1 oikea. Lepoasennossa sakset ylhäällä.
function crkClawPos(side) {
  var k = crkK(), x = crkKingX(), y = crkKingY();
  return { x: x + side * k * 1.75, y: y - k * 0.95 };
}

// ---------- Alustus ----------
function initCrabking() {
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'odd')];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  crk.t = 0;
  crk.round = 0;
  crk.misses = 0;
  crk.goldLostT = 0;
  crk.taskIdx = 0;
  crk.octoT = 0;
  crk.octoNext = 8 + Math.random() * 6;
  crk.octoPop = 0;
  crk.bubbles = [];
  crk.swimmers = [];
  crk.trumpT = 0;
  crk.done = false;
  crk.celT = 0;
  crk.trail = [];
  crk.bonusGiven = false;
  crk.cheerT = 0;
  crkSetupRound();
  crkSetupProps();
  renderBackground();
  playNote(196, 0, 0.25, 'triangle', 0.3);
  playNote(262, 0.18, 0.25, 'triangle', 0.3);
  playNote(330, 0.36, 0.45, 'triangle', 0.35);
}

function crkSetupRound() {
  var r = CRK_ROUNDS[crk.round], i;
  crk.shells = [];
  for (i = 0; i < r.n; i++) crk.shells.push({ slot: i, from: i, to: i, f: 1, dir: 1, lift: 0, liftTo: 0, pop: -i * 0.08 });
  crk.pearlShell = randInt(r.n);
  crk.pearl = { at: 'claw', t: 0 };
  crk.state = 'enter';
  crk.st = 0;
  crk.slow = 1;
  crk.consMiss = 0;
  crk.picked = -1;
  crk.feint = null;
  crk.seq = [];
  crk.mi = 0;
  crk.idleT = 0;
  crk.mood = 'grump';
}

function respawnCrabking() {
  if (crk.state === 'finale' || crk.done) return;
  crkSetupRound();
}

function resizeCrabking() {
  crkSetupProps();
}

// ---------- Sekoituksen arvonta ----------
// Palauttaa liikelistan: { pairs: [[a, b], ...] } (paikat, a < b) tai
// { feint: paikka }. Helmikuori on mukana todennäköisyydellä bias; sama
// yksittäinen vaihto ei toistu heti peräkkäin. Tuplavaihdon parit ovat
// erillisillä väleillä, joten kuoret eivät mene ristiin.
function crkGenSeq(r, pearlSlot) {
  var seq = [], prev = '', i, slot = pearlSlot, dbl = {}, cand = [], fpos = [], mi = 0, k, p1, p2, ex, z, key, tries;
  for (i = 1; i < r.moves; i++) cand.push(i);
  for (i = 0; i < r.doubles && cand.length; i++) { k = randInt(cand.length); dbl[cand[k]] = true; cand.splice(k, 1); }
  for (i = 0; i < r.feints; i++) fpos.push(3 + randInt(Math.max(1, r.moves - 4)) + i);
  function pick(excl) {
    var t, a, b, lo, hi, q, bad;
    for (t = 0; t < 60; t++) {
      a = (Math.random() < r.bias && excl.indexOf(slot) < 0) ? slot : randInt(r.n);
      b = randInt(r.n);
      if (b === a || Math.abs(a - b) > r.maxD) continue;
      lo = Math.min(a, b); hi = Math.max(a, b); bad = false;
      for (q = 0; q < excl.length; q++) if (excl[q] >= lo && excl[q] <= hi) bad = true;
      if (!bad) return [lo, hi];
    }
    return null;
  }
  for (i = 0, tries = 0; i < r.moves + fpos.length && tries < 200; i++, tries++) {
    if (fpos.indexOf(i) >= 0) {
      do { k = randInt(r.n); } while (k === slot);
      seq.push({ feint: k });
      continue;
    }
    p1 = pick([]);
    if (!p1) { i--; continue; }
    if (dbl[mi]) {
      // toinen pari: kokonaan ensimmäisen välin ulkopuolelta (pari voi olla ilman helmeä)
      ex = [];
      for (z = p1[0]; z <= p1[1]; z++) ex.push(z);
      p2 = pick(ex);
      if (!p2) {
        // helmikuori sai ensimmäisen parin niin, ettei toiselle jää tilaa: arvo uudestaan
        i--; continue;
      }
      seq.push({ pairs: [p1, p2] });
    } else {
      key = p1[0] + '-' + p1[1];
      if (key === prev) { i--; continue; }
      prev = key;
      seq.push({ pairs: [p1] });
    }
    if (dbl[mi]) prev = '';
    seq[seq.length - 1].pairs.forEach(function (p) {
      if (slot === p[0]) slot = p[1]; else if (slot === p[1]) slot = p[0];
    });
    mi++;
  }
  return seq;
}

function crkMoveDur(m) {
  var d = 0;
  if (m.feint !== undefined) return CRK_FEINT_T * Math.min(1.2, crk.slow);
  m.pairs.forEach(function (p) { d = Math.max(d, p[1] - p[0]); });
  return CRK_ROUNDS[crk.round].sp * crk.slow * (CRK_DUR_BASE + CRK_DUR_DIST * d);
}

function crkStartMove() {
  var m = crk.seq[crk.mi], i, a, b, back, dist = 0;
  crk.moveT = 0;
  crk.moveD = crkMoveDur(m);
  crk.feint = null;
  if (m.feint !== undefined) {
    crk.feint = { shell: crkShellAt(m.feint), giggled: false };
    return;
  }
  for (i = 0; i < m.pairs.length; i++) {
    a = crkShellAt(m.pairs[i][0]);
    b = crkShellAt(m.pairs[i][1]);
    back = Math.random() < 0.5 ? 1 : -1;
    crk.shells[a].from = m.pairs[i][0]; crk.shells[a].to = m.pairs[i][1]; crk.shells[a].f = 0; crk.shells[a].dir = back;
    crk.shells[b].from = m.pairs[i][1]; crk.shells[b].to = m.pairs[i][0]; crk.shells[b].f = 0; crk.shells[b].dir = -back;
    dist = Math.max(dist, m.pairs[i][1] - m.pairs[i][0]);
  }
  crk.look = Math.max(-1, Math.min(1, ((crkSlotX(m.pairs[0][0], crk.shells.length) + crkSlotX(m.pairs[0][1], crk.shells.length)) / 2 - crkKingX()) / (viewH * 0.4)));
  playNote(300 + dist * 50, 0, 0.12, 'sine', 0.15);
  if (m.pairs.length > 1) playNote(450 + dist * 50, 0.02, 0.12, 'sine', 0.12);
}

function crkFinishMove() {
  var i, sh;
  for (i = 0; i < crk.shells.length; i++) {
    sh = crk.shells[i];
    if (sh.f < 1 || sh.to !== sh.slot) { sh.slot = sh.to; sh.from = sh.to; sh.f = 1; }
  }
  crk.feint = null;
}

// ---------- Tökättävät koristeet ----------
function crkSetupProps() {
  var h = viewH, vw = viewW, k = crkK();
  propsReset();
  // Pikkuravut valtaistuimen molemmin puolin: hyppy ja saksien heilutus,
  // viides tökkäys puhaltaa kuplarenkaan
  [-1, 1].forEach(function (side) {
    propAdd({
      x: vw / 2 + side * h * 0.42, y: h * 0.66, r: h * 0.06, hy: h * 0.035, color: '#ff9a6a', note: side < 0 ? 784 : 880,
      draw: function (c, p) {
        var hop = 0, wave = false, tt;
        if (p.t >= 0) { hop = Math.abs(Math.sin(p.t * 9)) * Math.exp(-p.t * 2) * h * 0.04; wave = true; }
        if (crk.cheerT > 0) { tt = crk.cheerT; hop = Math.max(hop, Math.abs(Math.sin(tt * 11 + side)) * h * 0.035); wave = true; }
        crkDrawCrabling(c, 0, -hop, h * 0.028, wave, -side);
      },
      poke: function (p) {
        if (p.n % 5 === 0) {
          var i;
          for (i = 0; i < 6; i++) crk.bubbles.push({ x: p.x + side * -h * 0.03, y: p.y - h * 0.05, r: h * (0.008 + i * 0.003), vx: -side * h * 0.02, vy: -h * (0.1 + i * 0.03), t: 0 });
          for (i = 0; i < 4; i++) playNote(660 + i * 120, i * 0.07, 0.1, 'sine', 0.15);
        }
      }
    });
  });
  // Linnan lippu oikean tornin huipulla: heilahtaa ja soittaa torven,
  // kolmas tökkäys: torvirapu kurkistaa tornin ikkunasta ja toitottaa
  propAdd({
    x: vw / 2 + h * 0.21, y: h * 0.21, r: h * 0.06, hy: h * 0.06, color: '#ff6a5a', note: 523, amp: 0.25,
    draw: function (c, p) {
      var s = h * 0.05, wv = Math.sin(globalT * 4) * s * 0.12;
      artLimb(c, 0, 0, 0, -s * 1.9, Math.max(2, s * 0.08), '#8a5a30', '#5a3a1e');
      c.beginPath();
      c.moveTo(0, -s * 1.85);
      c.quadraticCurveTo(s * 0.5, -s * 1.9 + wv, s * 1.1, -s * 1.6 + wv);
      c.quadraticCurveTo(s * 0.5, -s * 1.35 - wv, 0, -s * 1.3);
      c.closePath();
      artFillPath(c, '#ff6a5a', -s * 1.9, -s * 1.3, s * 0.5, { lineColor: '#a8302a' });
      artCircle(c, s * 0.4, -s * 1.6 + wv * 0.5, s * 0.1, '#ffe27a', { lineColor: '#a07010' });
      artCircle(c, 0, -s * 1.95, s * 0.09, '#ffd24f', { lineColor: '#a07010' });
    },
    poke: function (p) {
      if (p.n % 3 === 0) {
        crk.trumpT = 1.8;
        playNote(523, 0.15, 0.15, 'square', 0.12);
        playNote(523, 0.35, 0.15, 'square', 0.12);
        playNote(784, 0.55, 0.4, 'square', 0.14);
      }
    }
  });
  // Merivuokko vasemmalla: lonkerot vetäytyvät, kolmas tökkäys: vuokkokala
  // pyrähtää uimaan
  propAdd({
    x: Math.max(h * 0.12, vw / 2 - h * 0.72), y: h * 0.69, r: h * 0.065, hy: h * 0.045, color: '#ff8ac8', note: 698,
    draw: function (c, p) {
      var s = h * 0.045, i, a, sq = p.t >= 0 ? Math.max(0.35, 1 - Math.sin(Math.min(1, p.t / 1.2) * Math.PI) * 0.65) : 1;
      for (i = 0; i < 7; i++) {
        a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(globalT * 2 + i) * 0.12;
        artLimb(c, (i - 3) * s * 0.18, -s * 0.5, (i - 3) * s * 0.18 + Math.cos(a) * s * 1.1 * sq, -s * 0.5 + Math.sin(a) * s * 1.1 * sq, s * 0.16, '#ff9ad0', '#b04a88');
        artCircle(c, (i - 3) * s * 0.18 + Math.cos(a) * s * 1.1 * sq, -s * 0.5 + Math.sin(a) * s * 1.1 * sq, s * 0.11, '#ffd0ea', { line: false, flat: true });
      }
      artBlob(c, 0, -s * 0.25, s * 0.7, s * 0.35, '#c85aa0', { lineColor: '#7a2a60' });
    },
    poke: function (p) {
      if (p.n % 3 === 0) {
        crk.swimmers.push({ x: p.x, y: p.y - h * 0.08, vx: h * 0.22, t: 0, col: '#ff8a3a' });
        playNote(988, 0, 0.1, 'sine', 0.2);
        playNote(1319, 0.1, 0.15, 'sine', 0.2);
      }
    }
  });
  // Kaukainen kallio, jonka kolossa arka mustekala asuu: tökkäys saa silmät
  // pullahtamaan esiin ja painumaan piiloon kuplien saattelemana
  propAdd({
    x: Math.min(vw - h * 0.12, vw / 2 + h * 0.72), y: h * 0.585, r: h * 0.07, hy: h * 0.03, color: '#c8a0ff', note: 392, amp: 0.05,
    draw: function () {},
    poke: function (p) {
      crk.octoPop = 1.1;
      crk.octoT = 0;
      var i;
      for (i = 0; i < 5; i++) crk.bubbles.push({ x: p.x + (Math.random() - 0.5) * h * 0.04, y: p.y - h * 0.03, r: h * (0.006 + Math.random() * 0.008), vx: 0, vy: -h * (0.08 + Math.random() * 0.06), t: 0 });
      playNote(330, 0.05, 0.15, 'sine', 0.2);
      playNote(262, 0.18, 0.2, 'sine', 0.18);
    }
  });
}

// ---------- Napautus ----------
function crkShellHit(px, py) {
  var i, P, s = crkShellS(crk.shells.length), best = -1, bd = 1e9, d;
  for (i = 0; i < crk.shells.length; i++) {
    P = crkShellPos(crk.shells[i]);
    if (Math.abs(px - P.x) < s * 1.25 && py > P.y - s * 1.6 && py < P.base + s * 0.5) {
      d = Math.abs(px - P.x);
      if (d < bd) { bd = d; best = i; }
    }
  }
  return best;
}

function handleCrabkingTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i;
  crk.idleT = 0;
  // Kuoret ensin, kun niitä odotetaan napautettaviksi (nostettu kuori voi
  // ulottua pikkuravun kohdalle); muuten koristeet
  if ((crk.state !== 'show' && crk.state !== 'pick') || crkShellHit(px, py) < 0) {
    if (propsTap(px, py)) return;
  }
  if (crk.state === 'show') {
    i = crkShellHit(px, py);
    if (i === crk.pearlShell) {
      crk.shells[i].liftTo = 0;
      crk.state = 'close';
      crk.st = 0;
      playNote(440, 0, 0.1, 'triangle', 0.22);
    } else if (i >= 0) {
      // väärä kuori ennen sekoitusta: helmi välähtää, missä se on
      crk.pearl.flash = 0.6;
      playNote(880, 0, 0.08, 'sine', 0.15);
    }
    return;
  }
  if (crk.state === 'pick') {
    i = crkShellHit(px, py);
    if (i < 0) return;
    crk.picked = i;
    crk.shells[i].liftTo = 1;
    crk.state = 'reveal';
    crk.st = 0;
    playNote(660, 0, 0.12, 'sine', 0.3);
  }
}

// ---------- Päivitys ----------
function crkSetMood(m, t) { crk.mood = m; crk.moodT = t || 0; }

function crkWinSound() {
  playNote(523, 0, 0.18, 'triangle', 0.35);
  playNote(659, 0.12, 0.18, 'triangle', 0.35);
  playNote(784, 0.24, 0.18, 'triangle', 0.35);
  playNote(1047, 0.36, 0.45, 'triangle', 0.4);
}
function crkLaughSound() {
  var i;
  for (i = 0; i < 4; i++) {
    playNote(330 - i * 25, i * 0.16, 0.1, 'sawtooth', 0.1);
    playNote(1500, i * 0.16 + 0.07, 0.03, 'square', 0.08);
  }
}

function crkAfterWin() {
  crk.round++;
  if (CRK_TASK_AFTER.indexOf(crk.round - 1) >= 0 && crk.taskIdx < tasks.length) {
    crk.state = 'task';
    crk.st = 0;
    taskStart(tasks[crk.taskIdx]);
    return;
  }
  crkSetupRound();
}

function updateCrabking(dt) {
  var i, sh, f, n = crk.shells.length, busy, P, cl, m;
  crk.t += dt;
  updateTasks(dt);
  busy = puzzleBusy();
  propsUpdate(dt);
  if (crk.goldLostT > 0) crk.goldLostT -= dt;
  if (crk.cheerT > 0) crk.cheerT -= dt;
  if (crk.trumpT > 0) crk.trumpT -= dt;
  if (crk.clackT > 0) crk.clackT -= dt;
  if (crk.pearl && crk.pearl.flash > 0) crk.pearl.flash -= dt;
  if (crk.moodT > 0) { crk.moodT -= dt; if (crk.moodT <= 0 && !crk.done && crk.state !== 'finale') crk.mood = 'grump'; }
  crkUpdateCritters(dt);

  for (i = 0; i < n; i++) {
    sh = crk.shells[i];
    if (sh.pop < 1) sh.pop = Math.min(1, sh.pop + dt / 0.45);
    sh.lift += (sh.liftTo - sh.lift) * Math.min(1, dt * 11);
  }
  if (crk.pearl && crk.pearl.at === 'fly') crk.pearl.t += dt;

  if (busy) {
    // ei etene tehtävän aikana
  } else if (crk.state === 'enter') {
    crk.st += dt;
    if (crk.st > 0.55) crk.shells[crk.pearlShell].liftTo = 1;
    if (crk.st > 0.85) {
      cl = crkClawPos(1);
      crk.pearl = { at: 'fly', t: 0, x0: cl.x, y0: cl.y, toShell: true };
      crk.state = 'place';
      crk.st = 0;
      playNote(988, 0, 0.12, 'sine', 0.2);
    }
  } else if (crk.state === 'place') {
    crk.st += dt;
    if (crk.pearl.t >= CRK_FLY_T) {
      crk.pearl = { at: 'shell', t: 0 };
      crk.state = 'show';
      crk.st = 0;
      crk.idleT = 0;
      P = crkShellPos(crk.shells[crk.pearlShell]);
      spawnSparkles(P.x, P.base - viewH * 0.03, 10, '#fff6ff');
      playNote(1319, 0, 0.15, 'sine', 0.25);
      playNote(1760, 0.08, 0.2, 'sine', 0.2);
    }
  } else if (crk.state === 'show') {
    crk.st += dt;
    crk.idleT += dt;
  } else if (crk.state === 'close') {
    crk.st += dt;
    if (crk.st > 0.35) { crk.state = 'ready'; crk.st = 0; crk.clackT = 0.7; }
  } else if (crk.state === 'ready') {
    // Kuningas napsauttaa saksiaan kahdesti: nyt alkaa
    if (crk.st === 0 || (crk.st < 0.3 && crk.st + dt >= 0.3)) {
      playNote(1400, 0, 0.04, 'square', 0.12);
      playNote(900, 0.03, 0.05, 'square', 0.1);
    }
    crk.st += dt;
    if (crk.st > 0.75) {
      crk.seq = crkGenSeq(CRK_ROUNDS[crk.round], crk.shells[crk.pearlShell].slot);
      crk.mi = 0;
      crk.state = 'shuffle';
      crk.st = 0;
      crkStartMove();
    }
  } else if (crk.state === 'shuffle') {
    crk.st += dt;
    crk.moveT += dt;
    m = crk.seq[crk.mi];
    f = Math.min(1, crk.moveT / crk.moveD);
    if (crk.feint) {
      crkUpdateFeint(f);
    } else {
      for (i = 0; i < n; i++) if (crk.shells[i].to !== crk.shells[i].slot) crk.shells[i].f = f;
    }
    if (crk.moveT >= crk.moveD + CRK_GAP) {
      crkFinishMove();
      crk.mi++;
      if (crk.mi < crk.seq.length) crkStartMove();
      else {
        crk.state = 'pick';
        crk.st = 0;
        crk.look = 0;
        playNote(784, 0, 0.15, 'triangle', 0.3);
        playNote(988, 0.12, 0.2, 'triangle', 0.3);
      }
    }
  } else if (crk.state === 'pick') {
    crk.st += dt;
  } else if (crk.state === 'reveal') {
    crk.st += dt;
    if (crk.st > 0.4) {
      P = crkShellPos(crk.shells[crk.picked]);
      if (crk.picked === crk.pearlShell) {
        crk.consMiss = 0;
        crk.cheerT = 1.6;
        spawnSparkles(P.x, P.base - viewH * 0.04, 26, '#fff6ff');
        artPop(P.x, P.base - viewH * 0.04, viewH * 0.08, '#ffffff', 'ring');
        crkWinSound();
        if (crk.round >= CRK_ROUNDS.length - 1) {
          crk.state = 'finale';
          crk.st = 0;
          crkSetMood('wow', 0);
          playNote(392, 0.5, 0.3, 'sine', 0.25);
          playNote(587, 0.75, 0.5, 'sine', 0.25);
        } else {
          crk.state = 'win';
          crk.st = 0;
          crkSetMood('huff', 1.6);
          playNote(150, 0.45, 0.3, 'triangle', 0.25);
        }
      } else {
        crk.state = 'miss';
        crk.st = 0;
        crk.misses++;
        crk.consMiss++;
        if (crk.consMiss % 2 === 0) crk.slow = Math.min(CRK_SLOW_MAX, crk.slow * CRK_SLOW_STEP);
        if (crk.misses === CRK_GOLD_MISS + 1) crk.goldLostT = 1.5;
        crkSetMood('laugh', 1.7);
        crk.clackT = 1.4;
        crkLaughSound();
      }
    }
  } else if (crk.state === 'win') {
    crk.st += dt;
    if (crk.st > 1.3 && crk.pearl.at === 'shell') {
      P = crkShellPos(crk.shells[crk.pearlShell]);
      crk.pearl = { at: 'fly', t: 0, x0: P.x, y0: P.base - crkShellS(n) * 0.35, toShell: false };
      crk.shells[crk.pearlShell].liftTo = 0;
      playNote(880, 0, 0.12, 'sine', 0.18);
    }
    if (crk.pearl.at === 'fly' && crk.pearl.t >= CRK_FLY_T) crk.pearl = { at: 'claw', t: 0 };
    if (crk.st > 2.2) crkAfterWin();
  } else if (crk.state === 'miss') {
    crk.st += dt;
    if (crk.st > 0.8 && crk.shells[crk.picked].liftTo > 0) {
      // oikea kuori näytetään
      crk.shells[crk.picked].liftTo = 0;
      crk.shells[crk.pearlShell].liftTo = 1;
      P = crkShellPos(crk.shells[crk.pearlShell]);
      spawnSparkles(P.x, P.base - viewH * 0.03, 10, '#fff6ff');
      playNote(1047, 0, 0.15, 'sine', 0.2);
    }
    if (crk.st > 1.8) {
      crk.state = 'show';
      crk.st = 0;
      crk.idleT = 0;
    }
  } else if (crk.state === 'task') {
    if (tasks[crk.taskIdx].opened) {
      crk.taskIdx++;
      crkSetupRound();
    }
  } else if (crk.state === 'finale') {
    crkUpdateFinale(dt);
  }
  if (celebrating) crk.celT += dt;
  updateParticles(dt);
  updateConfetti(dt);
}

// Hämäys: kuningas kurottaa saksellaan tyhjän kuoren luo, raottaa sitä
// ja kikattaa. Mitään ei liiku sillä välin.
function crkUpdateFeint(f) {
  var fe = crk.feint, sh = crk.shells[fe.shell], T = crk.moveD;
  var tt = f * T;
  fe.reach = Math.min(1, tt / (T * 0.26));
  if (tt > T * 0.88) fe.reach = Math.max(0, 1 - (tt - T * 0.88) / (T * 0.12));
  sh.liftTo = (tt > T * 0.26 && tt < T * 0.7) ? 0.45 : 0;
  if (!fe.giggled && tt > T * 0.4) {
    fe.giggled = true;
    crkSetMood('laugh', 0.6);
    playNote(587, 0, 0.08, 'sine', 0.15);
    playNote(659, 0.1, 0.08, 'sine', 0.15);
    playNote(587, 0.2, 0.08, 'sine', 0.15);
  }
  crk.look = Math.max(-1, Math.min(1, (crkSlotX(sh.slot, crk.shells.length) - crkKingX()) / (viewH * 0.4)));
}

function crkUpdateFinale(dt) {
  var P, cl, n = crk.shells.length;
  crk.st += dt;
  if (crk.st > 0.9 && crk.pearl.at === 'shell') {
    P = crkShellPos(crk.shells[crk.pearlShell]);
    crk.pearl = { at: 'fly', t: 0, x0: P.x, y0: P.base - crkShellS(n) * 0.35, toShell: false };
    crk.shells[crk.pearlShell].liftTo = 0;
  }
  if (crk.pearl.at === 'fly' && crk.pearl.t >= CRK_FLY_T) {
    crk.pearl = { at: 'claw', t: 0 };
    crkSetMood('happy', 0);
    playNote(659, 0, 0.2, 'triangle', 0.3);
  }
  if (crk.st > 2.4 && crk.pearl.at === 'claw') {
    // Kuningas ojentaa helmen: se nousee kohti pintaa, kruunuun
    cl = crkClawPos(1);
    crk.pearl = { at: 'up', t: 0, x0: cl.x, y0: cl.y };
    crk.cheerT = 4;
    var i;
    for (i = 0; i < 6; i++) playNote(784 * Math.pow(1.122, i), i * 0.12, 0.25, 'sine', 0.2);
  }
  if (crk.pearl.at === 'up') {
    crk.pearl.t += dt;
    var p = crkPearlXY();
    crk.trail.push({ x: p.x, y: p.y, t: 0 });
    if (crk.trail.length > 30) crk.trail.shift();
    if (Math.random() < dt * 14) spawnSparkles(p.x, p.y, 2, '#fff6ff');
  }
  if (crk.st > CRK_FINALE && !crk.done) {
    crk.done = true;
    startCelebration();
    if (crkGolden() && !crk.bonusGiven) {
      // Kultainen helmikuori: +1 tähti (startCelebration antoi jo 2)
      crk.bonusGiven = true;
      starCoins += 1;
      starGain.n += 1;
      starGain.until = globalT + 3.2;
      saveProgress();
      spawnSparkles(viewW / 2, viewH * 0.5, 30, '#ffd24f');
    }
  }
}
function crkGolden() { return crk.misses <= CRK_GOLD_MISS; }

function crkUpdateCritters(dt) {
  var i, b, s;
  // Mustekala kurkkii kolostaan silloin tällöin
  if (crk.octoPop > 0) crk.octoPop -= dt;
  if (crk.octoT > 0) crk.octoT -= dt;
  else {
    crk.octoNext -= dt;
    if (crk.octoNext <= 0) { crk.octoT = 2.8; crk.octoNext = 14 + Math.random() * 10; }
  }
  for (i = crk.bubbles.length - 1; i >= 0; i--) {
    b = crk.bubbles[i];
    b.t += dt;
    b.x += b.vx * dt + Math.sin(b.t * 5 + i) * viewH * 0.01 * dt;
    b.y += b.vy * dt;
    if (b.t > 2.5 || b.y < -viewH * 0.05) crk.bubbles.splice(i, 1);
  }
  for (i = crk.swimmers.length - 1; i >= 0; i--) {
    s = crk.swimmers[i];
    s.t += dt;
    s.x += s.vx * dt;
    s.y -= viewH * 0.05 * dt + Math.sin(s.t * 3) * viewH * 0.02 * dt;
    if (s.x > viewW + viewH * 0.1 || s.t > 8) crk.swimmers.splice(i, 1);
  }
  for (i = crk.trail.length - 1; i >= 0; i--) { crk.trail[i].t += dt; if (crk.trail[i].t > 0.8) crk.trail.splice(i, 1); }
}

// Helmen paikka ruudulla tilan mukaan (null = piilossa kuoren alla)
function crkPearlXY() {
  var p = crk.pearl, n = crk.shells.length, s = crkShellS(n), cl, P, f, x1, y1, e;
  if (!p) return null;
  if (p.at === 'claw') { cl = crkClawPos(1); return { x: cl.x, y: cl.y - crkK() * 0.05, r: s * 0.32 }; }
  if (p.at === 'shell') {
    P = crkShellPos(crk.shells[crk.pearlShell]);
    return { x: P.x, y: P.base - s * 0.34, r: s * 0.32 };
  }
  if (p.at === 'fly') {
    f = Math.min(1, p.t / CRK_FLY_T);
    if (p.toShell) { P = crkShellPos(crk.shells[crk.pearlShell]); x1 = P.x; y1 = P.base - s * 0.34; }
    else { cl = crkClawPos(1); x1 = cl.x; y1 = cl.y; }
    e = crkEase(f);
    return { x: p.x0 + (x1 - p.x0) * e, y: p.y0 + (y1 - p.y0) * e - Math.sin(f * Math.PI) * viewH * 0.12, r: s * 0.32 };
  }
  if (p.at === 'up') {
    f = Math.min(1, p.t / 2.4);
    e = f * f;
    return { x: p.x0 + (viewW / 2 - p.x0) * crkEase(f) + Math.sin(p.t * 4) * viewH * 0.02 * (1 - f), y: p.y0 + (-viewH * 0.12 - p.y0) * e, r: s * 0.32 * (1 + f * 0.4) };
  }
  return null;
}

// ---------- Tausta ----------
function renderCrabkingBg(b, w, h) {
  var vw = viewW, i, x, y, g, cx = vw / 2;
  // Vesi
  g = b.createLinearGradient(0, 0, 0, h * 0.64);
  g.addColorStop(0, '#8ad8f0');
  g.addColorStop(1, '#3a9ed0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h * 0.64);
  // Kaukaiset korallit ja levät horisontissa (sävytetty veteen)
  var cols = ['#ff8a9a', '#ffb05a', '#c890ff', '#ff7ac0'];
  for (i = 0; i < 9; i++) {
    x = ((i * 0.137 + 0.04) % 1) * vw;
    if (Math.abs(x - cx) < h * 0.34) continue;
    drawCoral(b, x, h * 0.615, h * (0.05 + (i % 3) * 0.015), artMix(cols[i % 4], '#3a9ed0', 0.55), true);
  }
  for (i = 0; i < 5; i++) {
    x = ((i * 0.23 + 0.11) % 1) * vw;
    if (Math.abs(x - cx) < h * 0.36) continue;
    drawKelp(b, x, h * 0.62, h * 0.16, 0.6, 0);
  }
  // Kallio, jonka kolossa arka mustekala asuu
  x = Math.min(vw - h * 0.12, cx + h * 0.72);
  artBlob(b, x, h * 0.6, h * 0.13, h * 0.11, '#7a8cb0', { lineColor: '#4a5a80', flat: false });
  artBlob(b, x + h * 0.08, h * 0.61, h * 0.07, h * 0.06, '#8a9cc0', { lineColor: '#4a5a80' });
  artBlob(b, x, h * 0.565, h * 0.045, h * 0.03, '#1a2a48', { line: false, flat: true });
  // Hiekkapohja
  g = b.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, '#f6e4ba');
  g.addColorStop(1, '#e0bc84');
  b.fillStyle = g;
  b.beginPath();
  b.moveTo(0, h * 0.63);
  for (x = 0; x <= vw + h * 0.2; x += h * 0.2) b.quadraticCurveTo(x + h * 0.1, h * (0.6 + ((x / h) % 2 > 1 ? 0.01 : 0.025)), x + h * 0.2, h * 0.62);
  b.lineTo(w, h); b.lineTo(0, h); b.closePath();
  b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 22; i++) {
    x = ((i * 0.173 + 0.05) % 1) * vw; y = h * (0.68 + ((i * 0.37) % 1) * 0.3);
    b.beginPath(); b.arc(x, y, h * 0.03, Math.PI * 1.15, Math.PI * 1.85); b.stroke();
  }
  for (i = 0; i < 14; i++) {
    x = ((i * 0.291 + 0.02) % 1) * vw; y = h * (0.66 + ((i * 0.53) % 1) * 0.32);
    artBlob(b, x, y, h * 0.008, h * 0.005, i % 2 ? '#c8a878' : '#b8b0a8', { line: false });
  }
  drawDeepStarfish(b, vw * 0.06, h * 0.95, h * 0.03, '#ff8a5a', 0.3);
  drawDeepStarfish(b, vw * 0.95, h * 0.9, h * 0.025, '#ffb85a', 1.1);
  // Hiekkalinna-valtaistuin
  crkDrawCastle(b, cx, h);
  // Valokeilat pinnalta
  drawDeepRays(b, vw, h, 0, 0.8);
}

function crkDrawCastle(b, cx, h) {
  var col = '#ecc888', line = '#a8804a', lw = Math.max(1.5, h * 0.004), i, tx;
  var base = h * 0.62;
  // Takamuuri hampaineen
  artRoundRect(b, cx - h * 0.2, h * 0.33, h * 0.4, base - h * 0.33, h * 0.02, col, { lineColor: line, line: lw });
  for (i = 0; i < 5; i++) artRoundRect(b, cx - h * 0.2 + i * h * 0.085, h * 0.3, h * 0.06, h * 0.045, h * 0.008, col, { lineColor: line, line: lw });
  // Tornit
  for (i = -1; i <= 1; i += 2) {
    tx = cx + i * h * 0.21;
    b.beginPath();
    b.moveTo(tx - h * 0.075, base); b.lineTo(tx - h * 0.06, h * 0.25); b.lineTo(tx + h * 0.06, h * 0.25); b.lineTo(tx + h * 0.075, base);
    b.closePath();
    artFillPath(b, artShade(col, 0.04), h * 0.25, base, h * 0.07, { lineColor: line, line: lw });
    artRoundRect(b, tx - h * 0.072, h * 0.21, h * 0.144, h * 0.05, h * 0.01, col, { lineColor: line, line: lw });
    artRoundRect(b, tx - h * 0.02, h * 0.32, h * 0.04, h * 0.05, h * 0.02, '#5a4a6a', { lineColor: line, line: lw });
    b.strokeStyle = 'rgba(168,128,74,0.45)';
    b.beginPath(); b.moveTo(tx - h * 0.066, h * 0.45); b.lineTo(tx + h * 0.066, h * 0.45); b.stroke();
    drawDeepStarfish(b, tx, h * 0.52, h * 0.018, '#ff9a8a', i);
  }
  // Valtaistuimen selkänoja: simpukka
  b.beginPath();
  b.moveTo(cx - h * 0.13, h * 0.56);
  b.bezierCurveTo(cx - h * 0.15, h * 0.4, cx - h * 0.06, h * 0.33, cx, h * 0.33);
  b.bezierCurveTo(cx + h * 0.06, h * 0.33, cx + h * 0.15, h * 0.4, cx + h * 0.13, h * 0.56);
  b.closePath();
  artFillPath(b, '#ff9ab8', h * 0.33, h * 0.56, h * 0.1, { lineColor: '#b0506a', line: lw });
  b.strokeStyle = 'rgba(176,80,106,0.5)';
  for (i = -3; i <= 3; i++) { b.beginPath(); b.moveTo(cx, h * 0.57); b.lineTo(cx + i * h * 0.037, h * 0.36 + Math.abs(i) * h * 0.012); b.stroke(); }
  // Istuinaskelma
  artRoundRect(b, cx - h * 0.17, h * 0.57, h * 0.34, h * 0.05, h * 0.015, artShade(col, -0.05), { lineColor: line, line: lw });
  artShadow(b, cx, base + h * 0.005, h * 0.25, h * 0.025, 0.18);
}

// ---------- Piirto ----------
function drawCrabking() {
  var c = ctx;
  if (!beginPlayWorld()) return;
  crkDrawOcto(c);
  propsDraw(c);
  crkDrawKing(c);
  crkDrawShells(c);
  crkDrawPearlFree(c);
  crkDrawCritters(c);
  crkDrawHint(c);
  drawParticlesLayer(c);
  if (celebrating) crkDrawTrophy(c);
  endPlayWorld();
  crkDrawHud(c);
  drawTaskOverlay(c);
}

function crkDrawShells(c) {
  var n = crk.shells.length, s = crkShellS(n), order = [], i, sh, P, depth, pp, glow;
  for (i = 0; i < n; i++) {
    sh = crk.shells[i];
    depth = sh.f < 1 ? sh.dir * Math.sin(sh.f * Math.PI) : 0;
    order.push({ i: i, d: depth });
  }
  order.sort(function (a, b) { return a.d - b.d; });
  for (i = 0; i < n; i++) {
    sh = crk.shells[order[i].i];
    P = crkShellPos(sh);
    // varjo hiekassa
    c.fillStyle = 'rgba(90,60,30,' + (0.22 - sh.lift * 0.1) + ')';
    c.beginPath();
    if (c.ellipse) c.ellipse(P.x, P.base + s * 0.04, s * (1.05 - sh.lift * 0.25) * P.sc, s * 0.18 * P.sc, 0, 0, Math.PI * 2);
    else c.arc(P.x, P.base, s, 0, Math.PI * 2);
    c.fill();
    // helmi kuoren alla, kun kuori on raollaan
    if (order[i].i === crk.pearlShell && crk.pearl && crk.pearl.at === 'shell' && sh.lift > 0.03) {
      pp = crkPearlXY();
      glow = crk.state === 'win' || crk.state === 'finale' ? 1.4 : 0.8;
      drawDeepPearl(c, pp.x, pp.y, pp.r, glow);
    }
    crkDrawShell(c, P.x, P.y, s, P.sc, -sh.lift * 0.3, order[i].i === crk.picked && crk.state === 'miss');
  }
  // väärä kuori ennen sekoitusta: helmi välähtää avoimessa kuoressa
  if (crk.state === 'show' && crk.pearl.flash > 0) {
    pp = crkPearlXY();
    artGlow(c, pp.x, pp.y, pp.r * 5, '#ffffff', crk.pearl.flash);
  }
}

// Simpukankuori (kupera, saranakorvat ylhäällä): (x, y) = alareunan keskikohta
function crkDrawShell(c, x, y, s, sc, tilt, empty) {
  var i;
  c.save();
  c.translate(x, y);
  c.scale(sc, sc);
  c.rotate(tilt);
  c.beginPath();
  c.moveTo(-s, 0);
  for (i = 0; i < 6; i++) c.quadraticCurveTo(-s + (i + 0.5) * s / 3, s * 0.1, -s + (i + 1) * s / 3, 0);
  c.bezierCurveTo(s * 1.04, -s * 0.72, s * 0.42, -s * 1.15, 0, -s * 1.15);
  c.bezierCurveTo(-s * 0.42, -s * 1.15, -s * 1.04, -s * 0.72, -s, 0);
  c.closePath();
  artFillPath(c, CRK_SHELL, -s * 1.15, s * 0.1, s, { lineColor: CRK_SHELL_LINE });
  c.strokeStyle = 'rgba(184,98,90,0.5)';
  c.lineWidth = Math.max(1, s * 0.04);
  c.lineCap = 'round';
  for (i = -2; i <= 2; i++) {
    c.beginPath();
    c.moveTo(i * s * 0.08, -s * 1.02);
    c.quadraticCurveTo(i * s * 0.3, -s * 0.6, i * s * 0.36 + (i === 0 ? 0 : 0), -s * 0.06);
    c.stroke();
  }
  artRoundRect(c, -s * 0.34, -s * 1.27, s * 0.68, s * 0.2, s * 0.07, artShade(CRK_SHELL, 0.05), { lineColor: CRK_SHELL_LINE });
  artHighlight(c, -s * 0.45, -s * 0.72, s * 0.16, s * 0.1, 0.45);
  c.restore();
}

// Helmi saksissa, lennossa ja nousussa (kuoren alla olevan piirtää crkDrawShells)
function crkDrawPearlFree(c) {
  var p = crk.pearl, q, i, tr;
  if (!p || p.at === 'shell') return;
  for (i = 0; i < crk.trail.length; i++) {
    tr = crk.trail[i];
    c.globalAlpha = Math.max(0, 0.5 - tr.t * 0.6);
    c.fillStyle = '#fff6ff';
    c.beginPath(); c.arc(tr.x, tr.y, viewH * 0.008 * (1 - tr.t), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  q = crkPearlXY();
  if (!q) return;
  drawDeepPearl(c, q.x, q.y, q.r, p.at === 'up' ? 1.6 : 1);
}

function crkDrawHint(c) {
  if (crk.state !== 'show' || crk.idleT < CRK_HINT_IDLE || celebrating) return;
  var P = crkShellPos(crk.shells[crk.pearlShell]), s = crkShellS(crk.shells.length);
  var bob = Math.abs(Math.sin(globalT * 4)) * viewH * 0.02;
  c.globalAlpha = 0.9;
  drawHand(c, P.x + s * 0.2, P.y - s * 2.1 - bob, viewH * 0.045);
  c.globalAlpha = 1;
}

// ---------- Rapukuningas ----------
function crkDrawKing(c) {
  var k = crkK(), x = crkKingX(), t = globalT, mood = crk.mood;
  var shake = mood === 'laugh' ? Math.sin(t * 38) * k * 0.05 : 0;
  var bob = Math.sin(t * 2) * k * 0.03 + (mood === 'wow' ? -k * 0.08 : 0);
  var by = crkKingY() + bob, bx = x + shake, side, i, hx, hy, kx2, ky2, fx, fy;
  var lc = CRK_RED_LINE;
  // Jalat (3 kummallakin puolella)
  for (side = -1; side <= 1; side += 2) {
    for (i = 0; i < 3; i++) {
      hx = bx + side * k * (0.55 + i * 0.2); hy = by + k * 0.35;
      kx2 = bx + side * k * (1.0 + i * 0.26); ky2 = by + k * 0.2 - i * k * 0.02;
      fx = bx + side * k * (1.12 + i * 0.3); fy = viewH * 0.6;
      artLimb(c, hx, hy, kx2, ky2, k * 0.13, CRK_RED, lc);
      artLimb(c, kx2, ky2, fx, fy, k * 0.11, CRK_RED, lc);
    }
  }
  // Kädet ja sakset
  crkDrawArm(c, -1, bx, by, k);
  crkDrawArm(c, 1, bx, by, k);
  // Runko
  artBlob(c, bx, by, k * 1.15, k * 0.72, CRK_RED, { lineColor: lc, hi: 0.35 });
  artBlob(c, bx, by + k * 0.24, k * 0.62, k * 0.3, '#ff8f72', { line: false, flat: true });
  for (i = -1; i <= 1; i++) artCircle(c, bx + i * k * 0.45, by - k * 0.28 + Math.abs(i) * k * 0.1, k * 0.07, '#c83a2a', { line: false, flat: true });
  // Silmävarret ja silmät
  var ey = by - k * 1.15, look = crk.look, blink = (t % 4.3) < 0.13 && mood !== 'wow';
  var er = mood === 'wow' ? k * 0.28 : k * 0.22;
  for (side = -1; side <= 1; side += 2) {
    artLimb(c, bx + side * k * 0.3, by - k * 0.55, bx + side * k * 0.42, ey + k * 0.1, k * 0.13, CRK_RED, lc);
    artCircle(c, bx + side * k * 0.42, ey, er, '#ffffff', { lineColor: lc, flat: true });
    if (mood === 'laugh') {
      // nauraessa silmät sirrillään
      c.strokeStyle = '#333';
      c.lineWidth = Math.max(2, er * 0.25);
      c.lineCap = 'round';
      c.beginPath(); c.arc(bx + side * k * 0.42, ey + er * 0.25, er * 0.55, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else {
      artEye(c, bx + side * k * 0.42 + look * er * 0.25, ey + (crk.state === 'pick' ? er * 0.15 : 0), er * 0.62, look, blink);
    }
  }
  // Kulmakarvat: äreät, nauraessa kaarella, hämmästyessä ylhäällä
  c.strokeStyle = '#4a1a10';
  c.lineWidth = Math.max(2, k * 0.09);
  c.lineCap = 'round';
  for (side = -1; side <= 1; side += 2) {
    c.beginPath();
    if (mood === 'wow' || mood === 'happy') {
      c.moveTo(bx + side * k * 0.22, ey - er * 1.5); c.quadraticCurveTo(bx + side * k * 0.42, ey - er * 2, bx + side * k * 0.62, ey - er * 1.5);
    } else if (mood === 'laugh') {
      c.moveTo(bx + side * k * 0.24, ey - er * 1.25); c.quadraticCurveTo(bx + side * k * 0.42, ey - er * 1.7, bx + side * k * 0.6, ey - er * 1.3);
    } else {
      c.moveTo(bx + side * k * 0.22, ey - er * 0.95); c.lineTo(bx + side * k * 0.64, ey - er * (mood === 'huff' ? 1.55 : 1.45));
    }
    c.stroke();
  }
  // Kruunu silmävarsien välissä
  crkDrawCrown(c, bx, by - k * 0.62, k * 0.5, mood === 'wow' ? 0.18 : 0);
  // Viikset ja suu
  var my = by - k * 0.02;
  c.strokeStyle = '#fff2e0';
  c.lineWidth = Math.max(2, k * 0.08);
  for (side = -1; side <= 1; side += 2) {
    c.beginPath();
    c.moveTo(bx + side * k * 0.05, my - k * 0.08);
    c.quadraticCurveTo(bx + side * k * 0.35, my - k * 0.22, bx + side * k * 0.42, my - k * (mood === 'laugh' ? 0.24 : 0.04));
    c.stroke();
  }
  c.strokeStyle = '#5a1a10';
  c.lineWidth = Math.max(1.5, k * 0.06);
  c.beginPath();
  if (mood === 'laugh') {
    c.fillStyle = '#5a1a10';
    c.moveTo(bx - k * 0.32, my + k * 0.02);
    c.quadraticCurveTo(bx, my + k * 0.62 + Math.sin(t * 30) * k * 0.06, bx + k * 0.32, my + k * 0.02);
    c.closePath(); c.fill();
    artBlob(c, bx, my + k * 0.27, k * 0.13, k * 0.06, '#ff7a8a', { line: false, flat: true });
  } else if (mood === 'wow') {
    c.fillStyle = '#5a1a10';
    c.arc(bx, my + k * 0.14, k * 0.11, 0, Math.PI * 2); c.fill();
  } else if (mood === 'happy') {
    c.arc(bx, my + k * 0.02, k * 0.2, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  } else if (mood === 'huff') {
    c.moveTo(bx - k * 0.18, my + k * 0.14);
    for (i = 1; i <= 4; i++) c.lineTo(bx - k * 0.18 + i * k * 0.09, my + k * (i % 2 ? 0.1 : 0.14));
    c.stroke();
    // tuhahdus: kuplia nenästä
    var hf = crk.moodT > 0 ? 1.6 - crk.moodT : 0;
    if (hf > 0 && hf < 1) for (i = 0; i < 3; i++) drawDeepBubble(c, bx + (i - 1) * k * 0.25, my - k * 0.2 - hf * k * (0.6 + i * 0.2), k * 0.06 * (1 + hf), 1 - hf);
  } else {
    c.arc(bx, my + k * 0.24, k * 0.16, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
  }
}

// Käsi: olkapää -> kyynärpää -> sakset. Sakset heiluvat sekoituksessa,
// napsuvat nauraessa, oikea pitää helmeä, ja hämäyksessä käsi kurottaa kuorelle.
function crkDrawArm(c, side, bx, by, k) {
  var t = globalT, sx = bx + side * k * 0.95, sy = by - k * 0.05, cl = crkClawPos(side);
  var cx = cl.x + (bx - crkKingX()), cy = cl.y + (by - crkKingY()), ang = -Math.PI / 2 + side * 0.35, open = 0.25;
  var st = crk.state, fe = crk.feint, P, s;
  if (st === 'shuffle' && !fe) {
    cx += Math.sin(t * 9 + side * 1.6) * k * 0.18;
    cy += Math.cos(t * 9 + side * 1.6) * k * 0.14;
    open = 0.2 + Math.abs(Math.sin(t * 9)) * 0.25;
  }
  if (crk.clackT > 0 || crk.mood === 'laugh') open = 0.05 + Math.abs(Math.sin(t * 22)) * 0.45;
  if (crk.mood === 'wow') { cy -= k * 0.3; open = 0.6; }
  if (crk.mood === 'happy' && side < 0 && (celebrating || crk.done)) { cy += Math.sin(t * 6) * k * 0.2; open = 0.3 + Math.sin(t * 6) * 0.2; }
  if (side > 0 && crk.pearl && (crk.pearl.at === 'claw' || (crk.pearl.at === 'up' && crk.pearl.t < 0.3))) open = 0.42;
  if (fe && fe.reach > 0 && Math.sign(crkSlotX(crk.shells[fe.shell].slot, crk.shells.length) - crkKingX() || 1) === side) {
    P = crkShellPos(crk.shells[fe.shell]);
    s = crkShellS(crk.shells.length);
    var tx = P.x, ty = P.y - s * 1.25, e = crkEase(fe.reach);
    cx += (tx - cx) * e;
    cy += (ty - cy) * e;
    ang += (Math.PI / 2 - ang) * e;
    open = 0.15;
  }
  var ex = (sx + cx) / 2 + side * k * 0.45, ey = (sy + cy) / 2 + k * 0.1;
  artLimb(c, sx, sy, ex, ey, k * 0.2, CRK_RED, CRK_RED_LINE);
  artLimb(c, ex, ey, cx, cy, k * 0.18, CRK_RED, CRK_RED_LINE);
  crkDrawClaw(c, cx, cy, k * 0.42, ang, open, side);
}

// Sakset: kämmen ja kaksi leukaa; ang = osoitussuunta, open = leukojen kulma
function crkDrawClaw(c, x, y, s, ang, open, side) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.scale(1, side < 0 ? -1 : 1);
  artBlob(c, s * 0.55, -s * 0.2, s * 0.62, s * 0.24, CRK_RED, { rot: -open, lineColor: CRK_RED_LINE });
  artBlob(c, s * 0.5, s * 0.22, s * 0.55, s * 0.2, '#d8402a', { rot: open, lineColor: CRK_RED_LINE });
  artBlob(c, 0, 0, s * 0.55, s * 0.45, CRK_RED, { lineColor: CRK_RED_LINE, hi: 0.3 });
  c.restore();
}

function crkDrawCrown(c, x, y, s, tilt) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt || 0);
  c.beginPath();
  c.moveTo(-s * 0.55, 0);
  c.lineTo(-s * 0.62, -s * 0.6); c.lineTo(-s * 0.3, -s * 0.3); c.lineTo(0, -s * 0.75);
  c.lineTo(s * 0.3, -s * 0.3); c.lineTo(s * 0.62, -s * 0.6); c.lineTo(s * 0.55, 0);
  c.closePath();
  artFillPath(c, '#ffd24f', -s * 0.75, 0, s * 0.4, { lineColor: '#a07010' });
  artCircle(c, 0, -s * 0.18, s * 0.1, '#4fc8c0', { lineColor: '#1a7a70' });
  artCircle(c, -s * 0.62, -s * 0.62, s * 0.07, '#ffffff', { lineColor: '#a07010' });
  artCircle(c, s * 0.62, -s * 0.62, s * 0.07, '#ffffff', { lineColor: '#a07010' });
  artCircle(c, 0, -s * 0.78, s * 0.08, '#ff8ac8', { lineColor: '#a07010' });
  c.restore();
}

// Pikkurapu: (x, y) = jalkojen kohta, s = rungon säde, wave = sakset ylhäällä
function crkDrawCrabling(c, x, y, s, wave, look) {
  var t = globalT, side, wv;
  for (side = -1; side <= 1; side += 2) {
    artLimb(c, x + side * s * 0.6, y - s * 0.5, x + side * s * 1.25, y, s * 0.18, '#ff8a5a', '#a8402a');
    wv = wave ? Math.sin(t * 14 + side) * s * 0.3 : 0;
    artLimb(c, x + side * s * 0.8, y - s * 0.8, x + side * s * 1.3, y - s * (wave ? 1.9 : 1.2) + wv, s * 0.2, '#ff8a5a', '#a8402a');
    artCircle(c, x + side * s * 1.32, y - s * (wave ? 2.05 : 1.35) + wv, s * 0.32, '#ff7a4a', { lineColor: '#a8402a' });
    artLimb(c, x + side * s * 0.3, y - s * 1.0, x + side * s * 0.38, y - s * 1.55, s * 0.12, '#ff8a5a', '#a8402a');
    artCircle(c, x + side * s * 0.38, y - s * 1.65, s * 0.22, '#ffffff', { lineColor: '#a8402a', flat: true });
    artEye(c, x + side * s * 0.38 + (look || 0) * s * 0.05, y - s * 1.65, s * 0.15, look || 0, (t % 3.7) < 0.12);
  }
  artBlob(c, x, y - s * 0.75, s, s * 0.62, '#ff8a5a', { lineColor: '#a8402a', hi: 0.35 });
  c.strokeStyle = '#7a2a1a';
  c.lineWidth = Math.max(1, s * 0.1);
  c.beginPath(); c.arc(x, y - s * 0.75, s * 0.28, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
}

// Arka mustekala kurkkii kallion kolosta: vain silmäpari (vihje tulevasta)
function crkDrawOcto(c) {
  var h = viewH, x = Math.min(viewW - h * 0.12, viewW / 2 + h * 0.72), y = h * 0.565, a = 0, f, pop = 0, i, look;
  if (crk.octoT > 0) {
    f = 2.8 - crk.octoT;
    a = Math.min(1, f / 0.5, crk.octoT / 0.5);
  }
  if (crk.octoPop > 0) { pop = Math.sin(Math.min(1, (1.1 - crk.octoPop) / 1.1) * Math.PI); a = Math.max(a, pop); }
  if (a <= 0.01) return;
  look = Math.sin(globalT * 0.9) * 0.6 - 0.4;
  c.save();
  c.globalAlpha = a;
  for (i = -1; i <= 1; i += 2) {
    artCircle(c, x + i * h * 0.016, y - pop * h * 0.012, h * (0.012 + pop * 0.006), '#ffffff', { line: false, flat: true });
    artEye(c, x + i * h * 0.016, y - pop * h * 0.012, h * (0.009 + pop * 0.005), look, (globalT % 2.9) < 0.12);
  }
  if (pop > 0.3) {
    c.strokeStyle = '#b88ae0';
    c.lineWidth = Math.max(2, h * 0.008);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x + h * 0.035, y + h * 0.015);
    c.quadraticCurveTo(x + h * 0.06, y - h * 0.01 + Math.sin(globalT * 8) * h * 0.01, x + h * 0.075, y - h * 0.02);
    c.stroke();
  }
  c.restore();
}

function crkDrawCritters(c) {
  var i, b, s, h = viewH, tw;
  for (i = 0; i < crk.bubbles.length; i++) {
    b = crk.bubbles[i];
    drawDeepBubble(c, b.x, b.y, b.r, Math.min(1, 2.5 - b.t));
  }
  for (i = 0; i < crk.swimmers.length; i++) {
    s = crk.swimmers[i];
    drawDeepFish(c, s.x, s.y, h * 0.022, s.col, 1, s.t * 14);
    c.fillStyle = '#ffffff';
    c.fillRect(s.x - h * 0.004, s.y - h * 0.012, h * 0.006, h * 0.024);
  }
  // Torvirapu kurkistaa oikean tornin ikkunasta
  if (crk.trumpT > 0) {
    tw = Math.min(1, (1.8 - crk.trumpT) / 0.3, crk.trumpT / 0.3);
    var wx = viewW / 2 + h * 0.21, wy = h * 0.345;
    c.save();
    c.globalAlpha = tw;
    artCircle(c, wx, wy, h * 0.016, '#ff8a5a', { lineColor: '#a8402a' });
    artEye(c, wx - h * 0.006, wy - h * 0.004, h * 0.005, 0.5, false);
    artEye(c, wx + h * 0.006, wy - h * 0.004, h * 0.005, 0.5, false);
    c.beginPath();
    c.moveTo(wx + h * 0.012, wy + h * 0.004); c.lineTo(wx + h * 0.05, wy - h * 0.008); c.lineTo(wx + h * 0.05, wy + h * 0.018); c.closePath();
    artFillPath(c, '#ffd24f', wy - h * 0.008, wy + h * 0.018, h * 0.01, { lineColor: '#a07010' });
    c.restore();
  }
}

// ---------- HUD ja juhla ----------
function crkDrawHud(c) {
  var H = viewH, x0 = hudX(), i, x, y = H * 0.063, n = CRK_ROUNDS.length, w, gold = crkGolden(), sh, left;
  w = n * H * 0.05 + H * 0.16;
  drawHudPanel(c, x0, H * 0.018, w, H * 0.09, H * 0.025);
  for (i = 0; i < n; i++) {
    x = x0 + H * 0.04 + i * H * 0.05;
    if (i < crk.round || (i === crk.round && (crk.state === 'win' || crk.state === 'finale'))) drawDeepPearl(c, x, y, H * 0.014, 0.6);
    else artCircle(c, x, y, H * (i === crk.round ? 0.014 + Math.sin(globalT * 4) * 0.002 : 0.011), i === crk.round ? '#d8f4ff' : 'rgba(255,255,255,0.45)', { lineColor: i === crk.round ? '#4a9ac8' : '#a8c0d0', flat: true });
  }
  // Kultainen helmikuori ja jäljellä olevat hutit
  x = x0 + H * 0.04 + n * H * 0.05 + H * 0.01;
  sh = crk.goldLostT > 0 ? Math.sin(crk.goldLostT * 30) * 0.25 : 0;
  c.save();
  c.globalAlpha = gold ? 1 : 0.4;
  c.translate(x, y + H * 0.02);
  c.rotate(sh);
  crkDrawGoldShell(c, 0, 0, H * 0.024, gold);
  c.restore();
  if (gold) {
    left = Math.max(0, CRK_GOLD_MISS - crk.misses);
    for (i = 0; i < CRK_GOLD_MISS; i++) {
      c.fillStyle = i < left ? '#ffd24f' : 'rgba(160,170,200,0.45)';
      c.beginPath(); c.arc(x + H * 0.04, y - H * 0.012 + i * H * 0.022, H * 0.006, 0, Math.PI * 2); c.fill();
    }
  }
}
function crkDrawGoldShell(c, x, y, s, gold) {
  var col = gold ? '#ffd24f' : '#c8c0d8', line = gold ? '#a07010' : '#7a7490', i;
  c.beginPath();
  c.moveTo(x - s, y);
  c.bezierCurveTo(x - s * 1.04, y - s * 0.72, x - s * 0.42, y - s * 1.15, x, y - s * 1.15);
  c.bezierCurveTo(x + s * 0.42, y - s * 1.15, x + s * 1.04, y - s * 0.72, x + s, y);
  c.closePath();
  artFillPath(c, col, y - s * 1.15, y, s, { lineColor: line });
  c.strokeStyle = artRGBA(line, 0.5);
  c.lineWidth = Math.max(1, s * 0.06);
  for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x, y - s * 1.05); c.lineTo(x + i * s * 0.38, y - s * 0.05); c.stroke(); }
}
function crkDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, crk.celT / 0.8)), gold = crkGolden(), i;
  if (k <= 0) return;
  c.save();
  c.translate(viewW / 2, H * 0.19);
  c.scale(k * 1.5, k * 1.5);
  artGlow(c, 0, 0, H * 0.16, gold ? '#ffe27a' : '#d8f4ff', 0.5);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.12, Math.sin(globalT + i * Math.PI / 4) * H * 0.08, H * 0.01, globalT * 2, 0.4);
  if (gold) crkDrawGoldShell(c, 0, H * 0.04, H * 0.06, true);
  drawDeepPearl(c, 0, H * 0.02, H * 0.025, 1);
  c.restore();
}

// ---------- Kartan kuvake ----------
// Kruunupäinen rapu
HUB_ICONS.crabking = function (c, x, y, s) {
  var r = s * 0.15, side;
  for (side = -1; side <= 1; side += 2) {
    artLimb(c, x + side * r * 0.9, y + r * 0.2, x + side * r * 1.7, y + r * 1.0, r * 0.2, CRK_RED, CRK_RED_LINE);
    artLimb(c, x + side * r * 1.0, y - r * 0.1, x + side * r * 1.55, y - r * 0.8, r * 0.24, CRK_RED, CRK_RED_LINE);
    artBlob(c, x + side * r * 1.65, y - r * 1.05, r * 0.42, r * 0.3, CRK_RED, { rot: side * 0.6, lineColor: CRK_RED_LINE });
    artLimb(c, x + side * r * 0.3, y - r * 0.5, x + side * r * 0.45, y - r * 1.05, r * 0.16, CRK_RED, CRK_RED_LINE);
    artCircle(c, x + side * r * 0.45, y - r * 1.15, r * 0.24, '#ffffff', { lineColor: CRK_RED_LINE, flat: true });
    artEye(c, x + side * r * 0.45, y - r * 1.13, r * 0.15, 0, false);
  }
  artBlob(c, x, y, r * 1.2, r * 0.75, CRK_RED, { lineColor: CRK_RED_LINE, hi: 0.35 });
  crkDrawCrown(c, x, y - r * 0.62, r * 1.0, 0);
  c.strokeStyle = '#5a1a10';
  c.lineWidth = Math.max(1, r * 0.1);
  c.beginPath(); c.arc(x, y + r * 0.35, r * 0.25, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
};
