'use strict';

// Pupujen pizzeria (Kaukamaa, Pupula): leipomon tilaus-ja-kokoa-logiikka
// pykälää vaikeampana, uusilla tuntuvilla eleillä ja yhdellä uudella
// ajatuksella: jakaminen. Yksi ruutu, kaikki raahaamalla tai hankaamalla:
//   - Taikinapallo raahataan kulhosta laudalle. Kaulin raahataan taikinan
//     päällä edestakaisin: taikina kasvaa pyöreäksi katkoviivarenkaaseen asti.
//   - Kauha kierretään pizzan päällä: kastike maalautuu siihen, missä kauha
//     kulkee. Juustopussia kuljetetaan pizzan yllä: raastetta sataa pussin
//     alle. Täytteet raahataan kulhoista (sieni, pupupepperoni, oliivi,
//     paprika, ananas, basilika); pois raahaamalla takaisin kulhoon tai
//     lattialle, josta pizzerian koira nappaa sen.
//   - Valmis pizza raahataan puu-uuniin. Uunin suulla kasvava rengas ennakoi
//     kultaista hetkeä; kultaisena pizza raahataan ulos laudalle. Myöhään
//     otettu on "vähän palanut" (asiakas yskähtää, kultainen lapio menee),
//     liian myöhään hiiltynyt (roskiin). Päivällä uunin tuli hiipuu sinisiksi
//     liekeiksi (savu, sihinä): halko puupinosta uuniin -> liekit roihahtavat.
//     Hiipunut uuni paistaa hitaasti (ei rangaistus).
//   - Pizzaleikkurin pyyhkäisy pizzan yli tekee viillon keskipisteen kautta;
//     viillot asettuvat tasavälein (k pyyhkäisyä = 2k palaa). Pöydässä istuu
//     2, 4, 6 tai 8 syöjää, ja jokaisella on oma lautanen.
//   - Pizza raahataan pöytään. Liian vähän paloja: joku jää ilman (surullinen)
//     ja pizza palaa leikattavaksi. Liikaa: koira nappaa ylimääräisen palan
//     (kultainen lapio menee). Väärä täyte: pää ravistaa, kuplan väärä kohta
//     sykkii ja pizza palaa korjattavaksi.
// Kolme vaihetta (aamu, päivä, ilta; valo vaihtuu), tilaukset arvotaan joka
// kerta: aamulla yksi pöytä ja uunipaikka, päivällä kaksi pöytää, kaksi
// uunipaikkaa, kärsivällisyyssydän ja hiipuva tuli, illalla numerot, laskut
// ja puolikas-tilaukset (vasemmalla yksi täyte, oikealla toinen). Vaiheiden
// välissä Pupulan kadulla käy jauhovespa: maksa ja vastaa kysymykseen.
// Kultainen pizzalapio (+1 tähti): ei palanutta, ei kärsivällisyyden
// loppumista eikä ylimääräisiä paloja.

var PZZ_TOPS = ['shroom', 'pep', 'olive', 'pepper', 'pine', 'basil'];
var PZZ_TOP_COL = { shroom: '#f0dcc0', pep: '#e0443e', olive: '#3a3040', pepper: '#5cc04a', pine: '#ffd84a', basil: '#3a9a3a' };
var PZZ_TINTS = [null, '#ffd6e8', '#d8f5e4', '#fff3c4', '#e6dcff', '#d6ecff', '#ffe2c8', '#f0f0f0'];
// Tilaukset vaiheittain: t = täytelajeja, c = kpl per laji, e = syöjämäärät
var PZZ_PLAN = [
  { ph: 0, t: 1, c: [1, 2], e: [2] }, { ph: 0, t: 1, c: [2, 3], e: [4] }, { ph: 0, t: 1, c: [1, 3], e: [2, 4] },
  { ph: 1, t: 1, c: [2, 4], e: [2, 4] }, { ph: 1, t: 2, c: [1, 2], e: [4, 6] }, { ph: 1, t: 1, c: [2, 3], e: [6] },
  { ph: 1, t: 2, c: [1, 3], e: [2, 4, 6] },
  { ph: 2, late: true }, { ph: 2, late: true }, { ph: 2, late: true }, { ph: 2, late: true }
];
var PZZ_PHASE_AT = [0, 3, 7];          // vaiheen ensimmäinen tilaus
var PZZ_PHASE_END = [3, 7, 11];        // vaihe loppuu, kun näin monta on palveltu
var PZZ_SLOTS = [1, 2, 2];             // uunipaikkoja vaiheittain
var PZZ_TABLES = [1, 2, 2];            // pöytiä vaiheittain
var PZZ_BOWLS = [3, 6, 6];             // täytekulhoja auki vaiheittain
var PZZ_ROLL_NEED = 4.2;               // kaulimen matka (pizzan säteinä) täyteen kokoon
var PZZ_BRUSH = 0.34;                  // kauhan ja pussin jälki (pizzan säteinä)
var PZZ_SAUCE_FULL = 0.8;              // kastikepeitto, jolla pinta valmistuu
var PZZ_CHEESE_FULL = 0.8;             // juustopeitto, jolla pinta valmistuu
var PZZ_CHEESE_RATE = 3.2;             // raastetta solua kohti per s pussin alla
var PZZ_BAKE = 7.0;                    // raa'asta kultaiseksi täydellä tulella (s)
var PZZ_GOLD = [3.6, 3.0, 2.6];        // kultainen ikkuna vaiheittain (s)
var PZZ_CHAR = 4.0;                    // vähän palaneesta hiiltyneeksi (s)
var PZZ_SLOW = 0.45;                   // hiipuneen tulen paistonopeus
var PZZ_FUEL_LIFE = [0, 30, 26];       // täydestä tulesta hiipuneeseen (s); 0 = ei hiivu
var PZZ_FUEL_LOW = 0.25;               // tämän alla liekit ovat sinisiä ja pieniä
var PZZ_PATIENCE = [0, 50, 56];        // kärsivällisyyden pohja (s) vaiheittain
var PZZ_PAT_PER = 2.5;                 // + s per täyte ja syöjäpari
var PZZ_ARRIVE_GAP = [1.2, 2.4, 2.0];  // seuraava seurue lähdön jälkeen (s)
var PZZ_SECOND_GAP = [0, 9, 6];        // toinen seurue ensimmäisen jälkeen (s)
var PZZ_CUT_MAX = 4;                   // viiltoja enintään (8 palaa)
var PZZ_CUT_LEN = 1.2;                 // pyyhkäisyn pituus pizzan päällä (säteinä)
var PZZ_TOP_MAX = 14;                  // täytteitä yhdellä pizzalla enintään
var PZZ_HINT_IDLE = 7;                 // vihjekäsi toimettomuuden jälkeen (s)
var PZZ_SQ = 0.84;                     // pizzan perspektiivi (pystylitistys)
var PZZ_GRID = 9;                      // kastike- ja juustoruudukko (N × N)
var PZZ_DOUGH = '#f6e2b8';
var PZZ_COLS = { raw: '#f4dcae', gold: '#e8a64a', bit: '#a8642a', char: '#3a2a26' };

var pzz = {
  L: null, t: 0, idleT: 0, ph: 0, dayK: 0, orders: [], nextO: 0, served: 0, groups: [null, null], leavers: [],
  arriveT: 0, seq: 0, boards: [], oven: [], drag: null, flies: [], puffs: [], shreds: [], floor: [], shown: {},
  burnt: 0, patOut: 0, extra: 0, misses: 0, hintStep: null, hintT: 0, flow: 'play', flowT: 0, taskIdx: 0,
  van: null, stars: [], celT: 0, fuel: 1, roarT: 0, lowWarn: false, hissT: 0, binT: 0, toolFly: {}, nudge: {},
  dog: null, snacks: [], bowlsK: 1, slotsK: 1, tablesK: 1, goldLostT: 0, starPop: 0, regPop: 0, pid: 0,
  passers: [], passT: 0, crackT: 0, ovenCv: null, sndT: 0
};

// ---------- Asettelu ----------
// Koot mitoitetaan yksiköllä u (16:10-näytöllä u = H, 4:3-näytöllä pienempi),
// pystypaikat näytön korkeuden osuuksina: uuni vasemmalla, laudat ja
// työkalut keskellä, pöydät oikeassa reunassa.
function pzzLayout() {
  var W = viewW, H = viewH, u = Math.min(H, W / 1.6), L = { W: W, H: H, u: u }, i, zw, sp, cx;
  L.R = u * 0.11;
  L.boardR = u * 0.14;
  // Uuni
  L.ovenX = u * 0.2;
  L.ovenY = H * 0.72;
  L.ovenR = u * 0.2;
  L.mouthW = u * 0.32;
  L.mouthH = u * 0.135;
  L.slotY = L.ovenY - u * 0.032;
  L.pile = { x: u * 0.12, y: H * 0.955 };
  L.cat = { x: u * 0.3, y: H * 0.965 };
  L.chef = { x: L.ovenX + u * 0.125, y: L.ovenY - L.ovenR * 0.62 };
  L.garlic = { x: u * 0.07, y: H * 0.0 };
  // Pöydät oikealla
  L.tz = W - u * 0.53;
  L.tables = [{ x: L.tz + u * 0.27, y: H * 0.5 }, { x: L.tz + u * 0.27, y: H * 0.88 }];
  L.tableW = u * 0.5;
  L.reg = { x: W - u * 0.065, y: H * 0.33 };
  L.lamps = [{ x: L.tz + u * 0.1, y: H * 0.0 }, { x: L.tz + u * 0.44, y: H * 0.0 }];
  L.dog = { x: L.tables[1].x - u * 0.15, y: H * 0.99 };
  // Työalue keskellä
  L.zx0 = u * 0.42;
  L.zx1 = L.tz - u * 0.01;
  zw = L.zx1 - L.zx0;
  cx = (L.zx0 + L.zx1) / 2;
  L.boards = [{ x: L.zx0 + zw * 0.265, y: H * 0.6 }, { x: L.zx0 + zw * 0.745, y: H * 0.6 }];
  L.shelfY = H * 0.215;
  sp = Math.min(u * 0.105, (zw - u * 0.03) / 6);
  L.bowls = [];
  for (i = 0; i < 6; i++) L.bowls.push({ x: cx + (i - 2.5) * sp, y: L.shelfY });
  L.bowlW = sp;
  L.win = { x0: L.zx0 + u * 0.03, x1: L.zx1 - u * 0.03, y0: H * 0.245, y1: H * 0.415 };
  L.basil = { x: L.win.x0 + u * 0.045, y: L.win.y1 + u * 0.004 };
  // Työkalurivi: roskis, taikina, kaulin, kastike, juusto, leikkuri
  L.rowY = H * 0.915;
  sp = zw / 6;
  L.bin = { x: L.zx0 + sp * 0.5, y: L.rowY + u * 0.05 };
  L.doughBowl = { x: L.zx0 + sp * 1.5, y: L.rowY + u * 0.035 };
  L.pin = { x: L.zx0 + sp * 2.5, y: L.rowY };
  L.sauce = { x: L.zx0 + sp * 3.5, y: L.rowY + u * 0.035 };
  L.cheese = { x: L.zx0 + sp * 4.5, y: L.rowY + u * 0.035 };
  L.cutter = { x: L.zx0 + sp * 5.5, y: L.rowY };
  L.rowSp = sp;
  pzz.L = L;
}
function pzzSlotPos(s) {
  var L = pzz.L, n = PZZ_SLOTS[pzz.ph];
  return { x: n === 1 ? L.ovenX : L.ovenX + (s ? 1 : -1) * L.u * 0.078, y: L.slotY };
}
function pzzMouth() { var L = pzz.L; return { x: L.ovenX, y: L.ovenY - L.mouthH * 0.45 }; }
function pzzBubblePos(ti) {
  var L = pzz.L, T = L.tables[ti];
  return { x: Math.min(T.x, L.W - L.u * 0.155), y: T.y - L.u * 0.265, w: L.u * 0.29, h: L.u * 0.155 };
}
function pzzSeatX(ti, n, i) {
  var L = pzz.L, sp = Math.min(L.u * 0.06, L.tableW * 0.94 / n);
  return L.tables[ti].x + (i - (n - 1) / 2) * sp;
}

// ---------- Pienet apurit ----------
function pzzEll(c, x, y, rx, ry) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  else { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); }
}
function pzzText(c, txt, x, y, size, col, line) {
  c.font = 'bold ' + Math.round(size) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (line) {
    c.strokeStyle = line;
    c.lineWidth = Math.max(2, size * 0.16);
    c.lineJoin = 'round';
    c.strokeText(txt, x, y);
  }
  c.fillStyle = col;
  c.fillText(txt, x, y);
}
function pzzHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
}
function pzzPuff(x, y, n, col, o) {
  var i;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (pzz.puffs.length > 80) pzz.puffs.shift();
    pzz.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * (o.spread || 0.03), y: y + (Math.random() - 0.5) * viewH * 0.015,
      vx: (Math.random() - 0.5) * viewH * (o.big ? 0.22 : 0.06), vy: -viewH * (o.up !== undefined ? o.up : (0.05 + Math.random() * 0.07)),
      r: viewH * (o.big ? 0.022 : (o.r || 0.011)) * (0.7 + Math.random() * 0.6), t: 0, life: o.life || (0.8 + Math.random() * 0.6),
      col: col || '#ffffff', heart: !!o.heart, note: !!o.note
    });
  }
}
function pzzAct() { pzz.idleT = 0; }
// Liukuva sävel (sihinä, humahdus, kastikkeen litsahdus)
function pzzGlide(f0, f1, delay, dur, type, vol) {
  var t0, osc, g;
  if (!audioCtx || muted) return;
  t0 = audioCtx.currentTime + delay;
  osc = audioCtx.createOscillator();
  g = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function pzzPieces(P) { return P.cuts ? P.cuts * 2 : 1; }
function pzzBaked(P) { return P.q !== null; }
// Kypsyys: 0..1 raaka -> kultainen, 1 = kultainen ikkuna, 1..2 vähän
// palanut, >= 2 hiiltynyt
function pzzBakeK(P) {
  var gold = PZZ_GOLD[pzz.ph];
  if (P.bt < PZZ_BAKE) return P.bt / PZZ_BAKE;
  if (P.bt < PZZ_BAKE + gold) return 1;
  return 1 + (P.bt - PZZ_BAKE - gold) / PZZ_CHAR;
}
function pzzGoldLeft(P) { return Math.max(0, Math.min(1, 1 - (P.bt - PZZ_BAKE) / PZZ_GOLD[pzz.ph])); }
function pzzCrustCol(P) {
  var C = PZZ_COLS, k;
  if (P.q === 'gold') return C.gold;
  if (P.q === 'bit') return artMix(C.gold, C.bit, 0.75);
  if (P.q === 'char') return C.char;
  if (P.where !== 'oven' && !P.bt) return C.raw;
  k = pzzBakeK(P);
  if (k <= 1) return artMix(C.raw, C.gold, k);
  if (k < 2) return artMix(C.gold, C.bit, k - 1);
  return C.char;
}
function pzzFireLow() { return pzz.fuel < PZZ_FUEL_LOW; }
function pzzRange(r) { return r[0] + randInt(r[1] - r[0] + 1); }

// ---------- Ruudukko (kastike ja juusto) ----------
// Pizzan pinta jaetaan N × N soluun; vain kiekon sisällä olevat lasketaan.
var PZZ_CELLS = null;
function pzzCells() {
  var i, j, u, v, N = PZZ_GRID;
  if (PZZ_CELLS) return PZZ_CELLS;
  PZZ_CELLS = [];
  for (j = 0; j < N; j++) {
    for (i = 0; i < N; i++) {
      u = -1 + (i + 0.5) * 2 / N;
      v = -1 + (j + 0.5) * 2 / N;
      if (u * u + v * v < 0.86 * 0.86) PZZ_CELLS.push({ u: u, v: v, k: j * N + i, s: ((i * 37 + j * 61) % 17) / 17 });
    }
  }
  return PZZ_CELLS;
}
function pzzNewPizza() {
  var n = PZZ_GRID * PZZ_GRID, i, P;
  P = {
    id: pzz.pid++, size: 0, sauce: [], sCov: 0, sauced: false, cheese: [], cCov: 0, cheesed: false, tops: [],
    bt: 0, q: null, cuts: 0, cutBase: 0, cutAng: [], cutFlash: 0, where: 'board', bi: 0, si: -1, fly: null,
    wob: 0, pop: 0.35, rollT: 0, seed: Math.random() * 10, flourT: 0, steam: 0, ding: false, late: false, charred: false, burnt: false
  };
  for (i = 0; i < n; i++) { P.sauce.push(0); P.cheese.push(0); }
  return P;
}
function pzzCoverage(arr) {
  var C = pzzCells(), i, n = 0;
  for (i = 0; i < C.length; i++) if (arr[C[i].k] >= 1) n++;
  return n / C.length;
}

// ---------- Tilaukset ----------
function pzzMakeTops(nTypes, cnt, pool, prevMain) {
  var out = [], types = shuffleNums(pool.slice()), i;
  if (types[0] === prevMain && types.length > 1) types.push(types.shift());
  for (i = 0; i < nTypes; i++) out.push({ type: types[i], n: pzzRange(cnt), side: 0 });
  return out;
}
function pzzMakeOrders() {
  var out = [], i, P, o, late, li = 0, prev = null, pool0 = PZZ_TOPS.slice(0, PZZ_BOWLS[0]);
  late = shuffleNums(['sum', 'half', 'two', Math.random() < 0.5 ? 'half' : 'big']);
  for (i = 0; i < PZZ_PLAN.length; i++) {
    P = PZZ_PLAN[i];
    o = { idx: i, ph: P.ph, eat: 2, tops: [], pics: P.ph < 2, kind: 'plain', perfect: true };
    if (!P.late) {
      o.eat = P.e[randInt(P.e.length)];
      o.tops = pzzMakeTops(P.t, P.c, P.ph === 0 ? pool0 : PZZ_TOPS, prev);
    } else {
      o.kind = late[li++];
      pzzLateOrder(o, prev);
    }
    prev = o.tops.length ? o.tops[0].type : null;
    out.push(o);
  }
  return out;
}
function pzzLateOrder(o, prev) {
  var a, b;
  o.eat = [4, 6, 8][randInt(3)];
  if (o.kind === 'sum') {
    a = 1 + randInt(3);
    b = 1 + randInt(3);
    o.tops = pzzMakeTops(1, [1, 1], PZZ_TOPS, prev);
    o.tops[0].n = a + b;
    o.tops[0].sum = [a, b];
  } else if (o.kind === 'half') {
    o.tops = pzzMakeTops(2, [1, 3], PZZ_TOPS, prev);
    o.tops[0].side = -1;
    o.tops[1].side = 1;
  } else if (o.kind === 'two') {
    o.tops = pzzMakeTops(2, [1, 3], PZZ_TOPS, prev);
  } else {
    o.eat = 8;
    o.tops = pzzMakeTops(1, [3, 5], PZZ_TOPS, prev);
  }
}
function pzzOrderTopsTotal(o) {
  var i, n = 0;
  for (i = 0; i < o.tops.length; i++) n += o.tops[i].n;
  return n;
}
function pzzOrderEntry(o, type) {
  var i;
  for (i = 0; i < o.tops.length; i++) if (o.tops[i].type === type) return o.tops[i];
  return null;
}
function pzzCountTops(P, type, side) {
  var i, n = 0, t;
  for (i = 0; i < P.tops.length; i++) {
    t = P.tops[i];
    if (t.type !== type) continue;
    if (side && (t.u < 0 ? -1 : 1) !== side) continue;
    n++;
  }
  return n;
}
// Väärällä puolella tai väärää lajia oleva täyte (indeksi) tai -1
function pzzWrongTop(P, o) {
  var i, t, e;
  for (i = P.tops.length - 1; i >= 0; i--) {
    t = P.tops[i];
    e = pzzOrderEntry(o, t.type);
    if (!e) return i;
    if (e.side && (t.u < 0 ? -1 : 1) !== e.side) return i;
  }
  return -1;
}
// Ensimmäinen ero tilaukseen täytteissä: null = kaikki oikein
function pzzCheck(P, o) {
  var i, w;
  for (i = 0; i < o.tops.length; i++) if (pzzCountTops(P, o.tops[i].type, o.tops[i].side) !== o.tops[i].n) return { part: 'top', i: i };
  w = pzzWrongTop(P, o);
  if (w >= 0) return { part: 'extra', type: P.tops[w].type, i: pzzOrderEntry(o, P.tops[w].type) ? o.tops.indexOf(pzzOrderEntry(o, P.tops[w].type)) : -1 };
  return null;
}
// Sopiiko pizza vielä tilaukseen (vihje ja botti): ei hiiltynyt, palat ja
// täytteet eivät ylitä tilausta
function pzzCompatible(P, o) {
  var i, e;
  if (P.q === 'char' || pzzPieces(P) > o.eat) return false;
  for (i = 0; i < o.tops.length; i++) {
    e = o.tops[i];
    if (pzzCountTops(P, e.type, e.side) > e.n) return false;
  }
  return pzzWrongTop(P, o) < 0;
}

// ---------- Alustus ----------
function initPizza() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'answer', { minLen: 4, maxLen: 9 })];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  pzzLayout();
  pzz.t = 0;
  pzz.idleT = 0;
  pzz.ph = 0;
  pzz.dayK = 0;
  pzz.orders = pzzMakeOrders();
  pzz.nextO = 0;
  pzz.served = 0;
  pzz.groups = [null, null];
  pzz.leavers = [];
  pzz.arriveT = 0.8;
  pzz.seq = 0;
  pzz.boards = [{ P: null, wob: 0, pop: 0 }, { P: null, wob: 0, pop: 0 }];
  pzz.oven = [null, null];
  pzz.drag = null;
  pzz.flies = [];
  pzz.puffs = [];
  pzz.shreds = [];
  pzz.floor = [];
  pzz.snacks = [];
  pzz.shown = {};
  pzz.burnt = 0;
  pzz.patOut = 0;
  pzz.extra = 0;
  pzz.misses = 0;
  pzz.hintStep = null;
  pzz.hintT = 0;
  pzz.flow = 'play';
  pzz.flowT = 0;
  pzz.taskIdx = 0;
  pzz.van = null;
  pzz.stars = [];
  pzz.celT = 0;
  pzz.fuel = 1;
  pzz.roarT = 0;
  pzz.lowWarn = false;
  pzz.hissT = 0;
  pzz.binT = 0;
  pzz.toolFly = {};
  pzz.nudge = {};
  pzz.bowlsK = 1;
  pzz.slotsK = 1;
  pzz.tablesK = 1;
  pzz.goldLostT = 0;
  pzz.starPop = 0;
  pzz.regPop = 0;
  pzz.pid = 0;
  pzz.passers = [];
  pzz.passT = 1.5;
  pzz.crackT = 0;
  pzz.sndT = 0;
  pzz.dog = { x: pzz.L.dog.x, y: pzz.L.dog.y, state: 'lie', t: 0, face: -1, munch: 0, jump: 0, carry: null, wag: 0, trick: 0, roll: 0 };
  pzzSetupProps();
  renderBackground();
  for (i = 0; i < 3; i++) playNote([523, 659, 784][i], i * 0.13, 0.25, 'triangle', 0.3);
  playNote(1047, 0.42, 0.4, 'triangle', 0.25);
}
function respawnPizza() {}
function resizePizza() {
  var i, g;
  camX = 0;
  pzzLayout();
  pzzSetupProps();
  if (pzz.drag) pzzCancelDrag();
  pzz.flies = [];
  pzz.shreds = [];
  pzz.floor = [];
  pzz.snacks = [];
  pzz.toolFly = {};
  for (i = 0; i < 2; i++) {
    if (pzz.boards[i].P && pzz.boards[i].P.where === 'fly') pzzLand(pzz.boards[i].P);
    if (pzz.oven[i] && pzz.oven[i].where === 'fly') pzzLand(pzz.oven[i]);
    g = pzz.groups[i];
    if (g) pzzPlaceGroup(g, true);
  }
  pzz.leavers = [];
  if (pzz.dog) { pzz.dog.x = pzz.L.dog.x; pzz.dog.y = pzz.L.dog.y; pzz.dog.state = 'lie'; pzz.dog.carry = null; }
}

// ---------- Seurueet ----------
function pzzFreeTable() {
  var n = PZZ_TABLES[pzz.ph], i;
  for (i = 0; i < n; i++) if (!pzz.groups[i] && !pzzTableBusy(i)) return i;
  return -1;
}
function pzzTableBusy(ti) {
  var i;
  for (i = 0; i < pzz.leavers.length; i++) if (pzz.leavers[i].ti === ti) return true;
  return false;
}
function pzzGroupCount() {
  var i, n = 0;
  for (i = 0; i < 2; i++) if (pzz.groups[i]) n++;
  return n;
}
function pzzSpawnGroup(ti) {
  var o = pzz.orders[pzz.nextO], g, i, tints = shuffleNums(PZZ_TINTS.slice());
  pzz.nextO++;
  g = {
    o: o, ti: ti, n: o.eat, pups: [], state: 'enter', t: 0, pat: 1, patT: 999, sits: false, shakeT: 0, sighT: 0,
    miss: null, seq: pzz.seq++, P: null, coughT: 0, joyT: 0, pop: 0, eatT: 0
  };
  for (i = 0; i < g.n; i++) {
    g.pups.push({
      tint: tints[i % tints.length], seed: Math.random() * 10, acc: randInt(5), x: 0, tx: 0, hop: 0, delay: i * 0.13,
      sad: 0, munch: 0, got: false, wave: 0
    });
  }
  pzzPlaceGroup(g, false);
  if (pzz.ph >= 1) g.patT = PZZ_PATIENCE[pzz.ph] + PZZ_PAT_PER * (g.n / 2 + pzzOrderTopsTotal(o));
  pzz.groups[ti] = g;
  playNote(1568, 0, 0.08, 'sine', 0.12);
  playNote(1319, 0.1, 0.12, 'sine', 0.12);
}
function pzzPlaceGroup(g, snap) {
  var i, p;
  for (i = 0; i < g.pups.length; i++) {
    p = g.pups[i];
    p.tx = pzzSeatX(g.ti, g.n, i);
    if (snap || g.state !== 'enter') p.x = p.tx;
    else p.x = pzz.L.W + pzz.L.u * (0.06 + i * 0.07);
  }
}
function pzzUpdateGroups(dt) {
  var i, j, g, p, sp = pzz.L.u * 1.1, done, lv;
  for (i = pzz.leavers.length - 1; i >= 0; i--) {
    lv = pzz.leavers[i];
    lv.t += dt;
    done = true;
    for (j = 0; j < lv.pups.length; j++) {
      p = lv.pups[j];
      if (lv.t < p.delay) { done = false; continue; }
      p.x += sp * dt;
      if (p.x < pzz.L.W + pzz.L.u * 0.08) done = false;
    }
    pzzGroupFx(lv, dt);
    if (done) pzz.leavers.splice(i, 1);
  }
  for (i = 0; i < 2; i++) {
    g = pzz.groups[i];
    if (!g) continue;
    pzzGroupFx(g, dt);
    if (g.state === 'enter') {
      done = true;
      for (j = 0; j < g.pups.length; j++) {
        p = g.pups[j];
        if (g.t < p.delay) { done = false; continue; }
        p.x = Math.max(p.tx, p.x - sp * dt);
        if (p.x > p.tx + 0.5) done = false;
        else if (!p.sat) { p.sat = true; p.hop = 0.3; playNote(660 + j * 70, 0, 0.06, 'triangle', 0.1); }
      }
      if (done) {
        g.state = 'wait';
        g.pop = 0.4;
        pzzGroupSound(g);
      }
    } else if (g.state === 'wait') {
      if (pzz.flow === 'play' && pzz.ph >= 1 && !g.sits) {
        g.pat -= dt / g.patT;
        if (g.pat <= 0) {
          // Kärsivällisyys loppui: huokaus, mutta seurue jää odottamaan
          g.pat = 0;
          g.sits = true;
          g.sighT = 1.8;
          pzz.patOut++;
          pzz.goldLostT = 1.5;
          pzzPuff(pzz.L.tables[g.ti].x, pzz.L.tables[g.ti].y - pzz.L.u * 0.1, 5, '#c8b8c0');
          playNote(330, 0, 0.35, 'sawtooth', 0.05);
          playNote(247, 0.3, 0.5, 'sawtooth', 0.05);
        }
      }
    } else if (g.state === 'eat') {
      g.eatT += dt;
      if (g.eatT > 2.4) {
        g.state = 'leave';
        g.t = 0;
        for (j = 0; j < g.pups.length; j++) g.pups[j].delay = (g.pups.length - 1 - j) * 0.08;
        pzz.leavers.push(g);
        pzz.groups[i] = null;
        pzz.served++;
        pzz.arriveT = Math.max(pzz.arriveT, PZZ_ARRIVE_GAP[pzz.ph]);
      }
    }
  }
}
function pzzGroupFx(g, dt) {
  var j, p;
  g.t += dt;
  if (g.shakeT > 0) g.shakeT -= dt;
  if (g.sighT > 0) g.sighT -= dt;
  if (g.joyT > 0) g.joyT -= dt;
  if (g.coughT > 0) g.coughT -= dt;
  if (g.pop > 0) g.pop -= dt;
  if (g.miss) { g.miss.t -= dt; if (g.miss.t <= 0) g.miss = null; }
  for (j = 0; j < g.pups.length; j++) {
    p = g.pups[j];
    if (p.hop > 0) p.hop -= dt;
    if (p.sad > 0) p.sad -= dt;
    if (p.munch > 0) p.munch -= dt;
    if (p.wave > 0) p.wave -= dt;
  }
}
function pzzGroupSound(g) {
  var b = 600 + (g.n % 3) * 60;
  playNote(b, 0, 0.1, 'sine', 0.2);
  playNote(b * 1.25, 0.09, 0.1, 'sine', 0.2);
  playNote(b * 1.5, 0.18, 0.16, 'sine', 0.2);
}

// ---------- Vaiheiden kulku ----------
function pzzUpdateFlow(dt) {
  var fs, i;
  pzz.flowT += dt;
  if (pzz.flow === 'play') {
    if (pzz.nextO < PZZ_PHASE_END[pzz.ph]) {
      fs = pzzFreeTable();
      if (fs >= 0) {
        pzz.arriveT -= dt;
        if (pzz.arriveT <= 0) {
          pzzSpawnGroup(fs);
          pzz.arriveT = PZZ_SECOND_GAP[pzz.ph];
        }
      }
    } else if (pzz.served >= PZZ_PHASE_END[pzz.ph] && !pzzGroupCount() && !pzz.leavers.length) {
      if (pzz.ph < 2) {
        pzz.flow = 'van';
        pzz.flowT = 0;
        pzz.van = { t: 0, leave: -1 };
        pzzGlide(300, 500, 0, 0.3, 'square', 0.04);
        pzzGlide(320, 540, 0.35, 0.3, 'square', 0.04);
      } else {
        pzz.flow = 'end';
        pzz.flowT = 0;
      }
    }
    return;
  }
  if (pzz.flow === 'van') {
    if (pzz.flowT < 2.0) return;
    pzzCancelDrag();
    pzz.flow = 'task';
    pzz.flowT = 0;
    taskStart(tasks[pzz.taskIdx]);
    return;
  }
  if (pzz.flow === 'task') {
    if (!tasks[pzz.taskIdx].opened) return;
    pzz.taskIdx++;
    pzz.van.leave = pzz.van.t;
    pzz.ph++;
    pzz.flow = 'play';
    pzz.flowT = 0;
    pzz.arriveT = 1.8;
    pzz.fuel = 1;
    if (PZZ_SLOTS[pzz.ph] > PZZ_SLOTS[pzz.ph - 1]) pzz.slotsK = 0;
    if (PZZ_TABLES[pzz.ph] > PZZ_TABLES[pzz.ph - 1]) pzz.tablesK = 0;
    if (PZZ_BOWLS[pzz.ph] > PZZ_BOWLS[pzz.ph - 1]) pzz.bowlsK = 0;
    for (i = 0; i < 4; i++) playNote([659, 784, 988, 1319][i], i * 0.12, 0.25, 'triangle', 0.25);
    return;
  }
  if (pzz.flow === 'end') {
    if (pzz.flowT > 1.2 && !pzz.drag) {
      pzz.flow = 'done';
      startCelebration();
      if (pzzGolden()) {
        // Kultainen pizzalapio: +1 tähti (startCelebration antoi jo 2)
        starCoins += 1;
        starGain.n += 1;
        starGain.until = globalT + 3.2;
        saveProgress();
        spawnSparkles(viewW / 2, viewH * 0.45, 30, '#ffd24f');
      }
    }
  }
}
function pzzGolden() { return pzz.burnt === 0 && pzz.patOut === 0 && pzz.extra === 0; }

// ---------- Syöte ----------
// Pizzan paikalliset koordinaatit: u, v -1..1 (säteinä), v litistetty
function pzzLocal(P, x, y) {
  var c = pzzPizzaPos(P), R = pzz.L.R;
  return { u: (x - c.x) / R, v: (y - c.y) / (R * PZZ_SQ) };
}
function pzzPizzaPos(P) {
  var L = pzz.L, s;
  if (P.where === 'oven') { s = pzzSlotPos(P.si); return { x: s.x, y: s.y }; }
  return { x: L.boards[P.bi].x, y: L.boards[P.bi].y };
}
function pzzDoughR(P) { return 0.34 + 0.66 * Math.min(1, P.size); }
function pzzTopR() { return pzz.L.R * 0.2; }
function pzzSlotHit(s, px, py) {
  var p = pzzSlotPos(s), L = pzz.L;
  return Math.pow((px - p.x) / (L.u * 0.085), 2) + Math.pow((py - p.y) / (L.u * 0.06), 2) < 1;
}
function pzzNear(px, py, P, r) { return Math.hypot(px - P.x, py - P.y) < r; }
function handlePizzaTap(px, py) {
  var L = pzz.L, i, j, P, b, lc, t, d, g, u = L.u;
  if (!running || celebrating || puzzleBusy()) return;
  pzz.idleT = 0;
  if (pzz.drag) return;
  if (pzz.flow !== 'task' && pzz.flow !== 'done') {
    // Uunin paikat
    for (i = 0; i < PZZ_SLOTS[pzz.ph]; i++) {
      if (!pzzSlotHit(i, px, py)) continue;
      P = pzz.oven[i];
      if (!P || P.where !== 'oven') continue;
      if (pzzBakeK(P) < 1) { pzzNotYet(P); return; }
      pzzStartDrag('pizza', px, py, { P: P, from: 'oven', si: i });
      return;
    }
    if (Math.abs(px - L.ovenX) < L.mouthW * 0.5 && py > L.ovenY - L.mouthH && py < L.ovenY + u * 0.02) { pzzOvenPoke(); return; }
    // Laudat: täyte pois tai koko pizza
    for (i = 0; i < 2; i++) {
      P = pzz.boards[i].P;
      if (!P || P.where !== 'board') continue;
      b = pzzPizzaPos(P);
      for (j = P.tops.length - 1; j >= 0; j--) {
        t = P.tops[j];
        if (Math.hypot(px - (b.x + t.u * L.R), py - (b.y + t.v * L.R * PZZ_SQ)) < pzzTopR() * 1.05) {
          pzzStartDrag('top', px, py, { type: t.type, from: 'pizza', P: P, u0: t.u, v0: t.v });
          P.tops.splice(j, 1);
          return;
        }
      }
      lc = pzzLocal(P, px, py);
      if (lc.u * lc.u + lc.v * lc.v < Math.pow(pzzDoughR(P) + 0.15, 2)) {
        pzzStartDrag('pizza', px, py, { P: P, from: 'board', bi: i });
        return;
      }
    }
    // Täytekulhot
    if (pzz.bowlsK > 0.9) {
      for (i = 0; i < PZZ_BOWLS[pzz.ph]; i++) {
        if (Math.hypot(px - L.bowls[i].x, py - (L.bowls[i].y - u * 0.03)) < Math.max(u * 0.05, L.bowlW * 0.5)) {
          pzzStartDrag('top', px, py, { type: PZZ_TOPS[i], from: 'bowl' });
          return;
        }
      }
    }
    // Työkalut
    if (!pzz.toolFly.ball && pzzNear(px, py, { x: L.doughBowl.x, y: L.doughBowl.y - u * 0.03 }, u * 0.065)) { pzzStartDrag('ball', px, py, {}); return; }
    if (!pzz.toolFly.pin && Math.abs(px - L.pin.x) < u * 0.075 && Math.abs(py - L.pin.y) < u * 0.045) { pzzStartDrag('pin', px, py, {}); return; }
    if (!pzz.toolFly.ladle && pzzNear(px, py, { x: L.sauce.x, y: L.sauce.y - u * 0.035 }, u * 0.065)) { pzzStartDrag('ladle', px, py, {}); return; }
    if (!pzz.toolFly.bag && pzzNear(px, py, { x: L.cheese.x, y: L.cheese.y - u * 0.04 }, u * 0.065)) { pzzStartDrag('bag', px, py, {}); return; }
    if (!pzz.toolFly.cutter && pzzNear(px, py, { x: L.cutter.x, y: L.cutter.y - u * 0.01 }, u * 0.06)) { pzzStartDrag('cutter', px, py, {}); return; }
    if (!pzz.toolFly.log && pzzNear(px, py, { x: L.pile.x, y: L.pile.y - u * 0.04 }, u * 0.085)) { pzzStartDrag('log', px, py, {}); return; }
    // Tyhjä lauta koputtaa
    for (i = 0; i < 2; i++) {
      if (!pzz.boards[i].P && pzzNear(px, py, L.boards[i], L.boardR)) {
        pzz.boards[i].wob = 0.35;
        playNote(220, 0, 0.08, 'triangle', 0.2);
        playNote(262, 0.07, 0.08, 'triangle', 0.15);
        return;
      }
    }
  }
  // Kuplat ja syöjät
  for (i = 0; i < 2; i++) {
    g = pzz.groups[i];
    if (!g) continue;
    d = pzzBubblePos(i);
    if (g.state === 'wait' && Math.abs(px - d.x) < d.w / 2 && Math.abs(py - d.y) < d.h / 2) {
      g.pop = 0.3;
      playNote(988, 0, 0.08, 'sine', 0.14);
      playNote(1319, 0.06, 0.1, 'sine', 0.1);
      return;
    }
    for (j = 0; j < g.pups.length; j++) {
      if (Math.abs(px - g.pups[j].x) < u * 0.03 && Math.abs(py - (L.tables[i].y - u * 0.04)) < u * 0.05) {
        g.pups[j].hop = 0.45;
        g.pups[j].wave = 0.8;
        playNote(880 + j * 60, 0, 0.08, 'sine', 0.2);
        playNote(1175 + j * 60, 0.08, 0.1, 'sine', 0.16);
        spawnSparkles(g.pups[j].x, L.tables[i].y - u * 0.07, 5, '#ff9ec6');
        return;
      }
    }
  }
  if (propsTap(px, py)) return;
  // Koira ja ikkunan katu
  if (pzz.dog && Math.abs(px - pzz.dog.x) < u * 0.06 && Math.abs(py - (pzz.dog.y - u * 0.025)) < u * 0.045 && pzzDogPoke()) return;
  if (px > L.win.x0 && px < L.win.x1 && py > L.win.y0 && py < L.win.y1) {
    pzzAddPasser(px < (L.win.x0 + L.win.x1) / 2 ? 1 : -1, true);
    playNote(1175, 0, 0.08, 'sine', 0.15);
    playNote(1568, 0.1, 0.1, 'sine', 0.12);
  }
}
function pzzNotYet(P) {
  var s = pzzPizzaPos(P);
  P.wob = 0.35;
  playNote(196, 0, 0.1, 'sine', 0.15);
  pzzPuff(s.x, s.y - viewH * 0.02, 2, '#fff6e0');
  pzzAct();
}
function pzzEmbers(n, spread, up) {
  var m = pzzMouth(), i, L = pzz.L;
  for (i = 0; i < n; i++) {
    if (pzz.flies.length > 60) break;
    pzz.flies.push({ kind: 'ember', x0: m.x + (Math.random() - 0.5) * L.mouthW * spread, y0: m.y, vx: (Math.random() - 0.5) * L.u * 0.4, vy: -L.u * (up + Math.random() * 0.4), t: 0, dur: 0.9, o: {} });
  }
}
function pzzOvenPoke() {
  pzz.crackT = 0.5;
  pzzEmbers(6, 0.5, 0.3);
  playNote(1800 + Math.random() * 400, 0, 0.04, 'square', 0.04);
  playNote(1400 + Math.random() * 400, 0.06, 0.04, 'square', 0.04);
  playNote(2200, 0.13, 0.03, 'square', 0.03);
}
function pzzStartDrag(kind, px, py, o) {
  var d = { kind: kind, x: px, y: py, lx: px, ly: py, moved: 0, cs: null, ox: 0, oy: 0 }, k, P, kk, L = pzz.L;
  for (k in o) if (o.hasOwnProperty(k)) d[k] = o[k];
  if (kind === 'pizza') {
    P = d.P;
    if (d.from === 'oven') {
      kk = pzzBakeK(P);
      P.q = kk <= 1 ? 'gold' : (kk < 2 ? 'bit' : 'char');
      if (P.q === 'gold') {
        spawnSparkles(px, py, 10, '#ffd24f');
        artPop(px, py, L.R * 1.2, '#ffe27a', 'ring');
        playNote(1319, 0, 0.12, 'triangle', 0.25);
        playNote(1760, 0.08, 0.18, 'triangle', 0.22);
      }
      pzzGlide(600, 300, 0, 0.2, 'triangle', 0.12);
    }
    k = pzzPizzaPos(P);
    d.x = k.x;
    d.y = k.y;
    d.ox = k.x - px;
    d.oy = k.y - py;
    P.where = 'drag';
    playNote(523, 0, 0.07, 'triangle', 0.18);
  } else if (kind === 'ball') {
    d.x = L.doughBowl.x; d.y = L.doughBowl.y - L.u * 0.04;
    pzzGlide(200, 320, 0, 0.12, 'sine', 0.2);
  } else if (kind === 'top') {
    if (d.from === 'pizza') { k = pzzPizzaPos(d.P); d.x = k.x + d.u0 * L.R; d.y = k.y + d.v0 * L.R * PZZ_SQ; }
    playNote(880 + PZZ_TOPS.indexOf(d.type) * 80, 0, 0.06, 'sine', 0.18);
  } else if (kind === 'log') {
    d.x = L.pile.x; d.y = L.pile.y - L.u * 0.04;
    playNote(180, 0, 0.08, 'triangle', 0.25);
    playNote(140, 0.06, 0.08, 'triangle', 0.2);
  } else {
    // Työkalu: kahva sormen alla, kärki näkyvissä
    k = L[kind === 'ladle' ? 'sauce' : kind === 'bag' ? 'cheese' : kind];
    d.x = k.x; d.y = k.y - L.u * 0.03;
    playNote(660, 0, 0.06, 'sine', 0.15);
    playNote(990, 0.05, 0.08, 'sine', 0.12);
  }
  pzz.drag = d;
  pzzAct();
}
var PZZ_DRAG_OFF = { pin: 0, ladle: -0.05, bag: -0.075, cutter: -0.045, top: -0.035, ball: -0.03, log: -0.02 };
function pzzDragTarget(d) {
  if (d.kind === 'pizza') return { x: lastPX + d.ox * 0.6, y: lastPY + d.oy * 0.6 };
  return { x: lastPX, y: lastPY + (PZZ_DRAG_OFF[d.kind] || 0) * pzz.L.u };
}

// ---------- Raahaus ----------
function pzzUpdateDrag(dt) {
  var d = pzz.drag, k, tg, mx, my, mv;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 24);
    tg = pzzDragTarget(d);
    mx = d.x;
    my = d.y;
    d.x += (tg.x - d.x) * k;
    d.y += (tg.y - d.y) * k;
    mv = Math.hypot(d.x - mx, d.y - my);
    d.moved += mv;
    d.lx = lastPX;
    d.ly = lastPY;
    if (d.kind === 'pin' || d.kind === 'ladle' || d.kind === 'bag' || d.kind === 'cutter') pzzToolWork(d, dt, mv);
    return;
  }
  pzz.drag = null;
  pzzDrop(d);
}
// Työkalun kärjen alla oleva laudan pizza ja paikalliset koordinaatit
function pzzUnder(x, y, margin) {
  var i, P, lc, r;
  for (i = 0; i < 2; i++) {
    P = pzz.boards[i].P;
    if (!P || P.where !== 'board') continue;
    lc = pzzLocal(P, x, y);
    r = Math.hypot(lc.u, lc.v);
    if (r < pzzDoughR(P) + (margin || 0)) return { P: P, u: lc.u, v: lc.v, r: r, bi: i };
  }
  return null;
}
function pzzNudge(name) {
  if (!pzz.nudge[name] || pzz.nudge[name] <= 0) {
    pzz.nudge[name] = 0.9;
    playNote(784, 0, 0.08, 'sine', 0.14);
    playNote(988, 0.1, 0.08, 'sine', 0.12);
  }
}
// Mikä pizzasta puuttuu ennen uunia: työkalu, joka heilahtaa vihjeeksi
function pzzMissingTool(P) {
  if (P.size < 1) return 'pin';
  if (!P.sauced) return 'ladle';
  if (!P.cheesed) return 'bag';
  return null;
}
function pzzToolWork(d, dt, mv) {
  var hit = pzzUnder(d.x, d.y, d.kind === 'cutter' ? 0.35 : 0.2), P, L = pzz.L, C, i, c, du, dv, rb = PZZ_BRUSH, gain, a;
  if (d.kind === 'cutter') { pzzCutWork(d, hit, mv); return; }
  if (!hit) return;
  P = hit.P;
  if (pzzBaked(P)) {
    // Paistettu: kaulin, kauha ja pussi eivät enää tee mitään
    if (mv > L.u * 0.004 && P.wob <= 0) { P.wob = 0.25; playNote(330, 0, 0.05, 'sine', 0.08); }
    return;
  }
  if (d.kind === 'pin') {
    if (P.size >= 1) return;
    P.size = Math.min(1, P.size + mv / (L.R * PZZ_ROLL_NEED));
    if (mv > 0.5) P.rollT = 0.12;
    d.trail = (d.trail || 0) + mv;
    if (d.trail > L.R * 0.5) {
      d.trail = 0;
      playNote(150 + P.size * 120, 0, 0.07, 'triangle', 0.18);
      pzzPuff(d.x + (Math.random() - 0.5) * L.R, d.y, 1, '#ffffff', { up: 0.03, r: 0.008, life: 0.7 });
    }
    if (P.size >= 1) {
      P.pop = 0.35;
      P.ringT = 0.6;
      a = pzzPizzaPos(P);
      artPop(a.x, a.y, L.R * 1.3, '#fff4d0', 'ring');
      spawnSparkles(a.x, a.y, 10, '#fff4d0');
      for (i = 0; i < 3; i++) playNote([523, 659, 784][i], i * 0.08, 0.14, 'triangle', 0.28);
      pzz.shown.roll = true;
      pzzAct();
    }
    return;
  }
  if (P.size < 1) {
    if (P.wob <= 0) { P.wob = 0.35; playNote(196, 0, 0.1, 'sine', 0.12); }
    pzzNudge('pin');
    return;
  }
  C = pzzCells();
  if (d.kind === 'ladle') {
    if (P.sauced) return;
    gain = 0;
    for (i = 0; i < C.length; i++) {
      c = C[i];
      du = c.u - hit.u;
      dv = c.v - hit.v;
      if (du * du + dv * dv < rb * rb && P.sauce[c.k] < 1) { P.sauce[c.k] = 1; gain++; }
    }
    if (gain) P.sCov = pzzCoverage(P.sauce);
    d.trail = (d.trail || 0) + mv;
    if (d.trail > L.R * 0.35) {
      d.trail = 0;
      pzzGlide(220 + Math.random() * 60, 140, 0, 0.09, 'sine', 0.12);
    }
    if (P.sCov >= PZZ_SAUCE_FULL) {
      P.sauced = true;
      for (i = 0; i < C.length; i++) P.sauce[C[i].k] = 1;
      P.pop = 0.3;
      a = pzzPizzaPos(P);
      artPop(a.x, a.y, L.R * 1.2, '#ff7a5a', 'ring');
      spawnSparkles(a.x, a.y, 10, '#ff6a4a');
      for (i = 0; i < 3; i++) playNote([587, 740, 880][i], i * 0.08, 0.14, 'triangle', 0.28);
      pzz.shown.sauce = true;
      pzzAct();
    }
    return;
  }
  if (d.kind === 'bag') {
    if (!P.sauced) { pzzNudge('ladle'); return; }
    if (P.cheesed) return;
    pzzShredRain(d.x, d.y, dt);
    for (i = 0; i < C.length; i++) {
      c = C[i];
      du = c.u - hit.u;
      dv = c.v - hit.v;
      if (du * du + dv * dv < rb * rb) P.cheese[c.k] = Math.min(1, P.cheese[c.k] + dt * PZZ_CHEESE_RATE);
    }
    P.cCov = pzzCoverage(P.cheese);
    if (P.cCov >= PZZ_CHEESE_FULL) {
      P.cheesed = true;
      for (i = 0; i < C.length; i++) P.cheese[C[i].k] = 1;
      P.pop = 0.3;
      a = pzzPizzaPos(P);
      artPop(a.x, a.y, L.R * 1.2, '#ffe27a', 'ring');
      spawnSparkles(a.x, a.y, 12, '#ffe27a');
      for (i = 0; i < 3; i++) playNote([659, 831, 988][i], i * 0.08, 0.14, 'triangle', 0.28);
      pzz.shown.cheese = true;
      pzzAct();
    }
  }
}
// Pyyhkäisy: viilto, kun leikkuri on kulkenut pizzan yli tarpeeksi pitkälle
function pzzCutWork(d, hit, mv) {
  var P, L = pzz.L, du, dv, a, k, i, old, s;
  if (!hit || hit.r > 1.1) { d.cs = null; return; }
  P = hit.P;
  if (!pzzBaked(P)) {
    if (mv > L.u * 0.004 && P.wob <= 0) { P.wob = 0.35; playNote(196, 0, 0.1, 'sine', 0.12); }
    pzz.nudge.oven = 0.9;
    return;
  }
  if (d.cs && d.cs.id !== P.id) d.cs = null;
  if (!d.cs) { d.cs = { u: hit.u, v: hit.v, id: P.id }; return; }
  if (mv > 0.5 && Math.random() < 0.3) playNote(2200 + Math.random() * 600, 0, 0.02, 'square', 0.02);
  du = hit.u - d.cs.u;
  dv = hit.v - d.cs.v;
  if (du * du + dv * dv < PZZ_CUT_LEN * PZZ_CUT_LEN) return;
  d.cs = { u: hit.u, v: hit.v, id: P.id };
  if (P.cuts >= PZZ_CUT_MAX) {
    P.wob = 0.35;
    playNote(262, 0, 0.1, 'triangle', 0.15);
    return;
  }
  // Uusi viilto pyyhkäisyn suuntaan; kaikki asettuvat tasavälein
  a = Math.atan2(dv, du);
  a = ((a % Math.PI) + Math.PI) % Math.PI;
  if (!P.cuts) P.cutBase = a;
  P.cuts++;
  k = P.cuts;
  old = P.cutAng.slice();
  P.cutAng = [];
  for (i = 0; i < k; i++) P.cutAng.push(i < old.length ? old[i] : a);
  P.cutFlash = 0.5;
  P.pop = 0.2;
  s = pzzPizzaPos(P);
  spawnSparkles(s.x, s.y, 8, '#ffffff');
  pzzGlide(1800, 700, 0, 0.16, 'square', 0.05);
  playNote(1047 + k * 120, 0.05, 0.12, 'triangle', 0.22);
  pzz.shown.cut = true;
  pzzAct();
}
function pzzCutTarget(P, i) { return P.cutBase + i * Math.PI / P.cuts; }

// ---------- Pudotus ----------
function pzzFreeBoard(nearX, nearY, maxD) {
  var i, best = -1, bd = maxD === undefined ? 1e9 : maxD, dd, L = pzz.L;
  for (i = 0; i < 2; i++) {
    if (pzz.boards[i].P) continue;
    dd = nearX === undefined ? 0 : Math.hypot(nearX - L.boards[i].x, nearY - L.boards[i].y);
    if (dd < bd) { bd = dd; best = i; }
  }
  return best;
}
function pzzOverBin(x, y) { var b = pzz.L.bin; return Math.hypot(x - b.x, y - (b.y - pzz.L.u * 0.05)) < pzz.L.u * 0.085; }
function pzzOverMouth(x, y) {
  var L = pzz.L;
  return Math.abs(x - L.ovenX) < L.mouthW * 0.62 && y > L.ovenY - L.mouthH * 1.5 && y < L.ovenY + L.u * 0.06;
}
function pzzGroupAt(x, y) {
  var i, g, L = pzz.L, B;
  for (i = 0; i < 2; i++) {
    g = pzz.groups[i];
    if (!g || g.state !== 'wait') continue;
    B = pzzBubblePos(i);
    if (x > L.tz - L.u * 0.02 && y > B.y - B.h / 2 && y < L.tables[i].y + L.u * 0.08) return g;
  }
  return null;
}
function pzzDrop(d) {
  var L = pzz.L, x = d.x, y = d.y, i, P, hit, g, s, b, best, bd, dd;
  if (d.kind === 'ball') {
    i = pzzFreeBoard(x, y, L.boardR * 1.4);
    if (i >= 0 && pzz.flow === 'play') {
      P = pzzNewPizza();
      P.bi = i;
      pzz.boards[i].P = P;
      pzz.boards[i].pop = 0.3;
      pzzPuff(L.boards[i].x, L.boards[i].y, 6, '#ffffff', { up: 0.04, spread: 0.05 });
      playNote(180, 0, 0.1, 'triangle', 0.3);
      playNote(240, 0.06, 0.1, 'triangle', 0.2);
      pzz.shown.dough = true;
      pzzAct();
      return;
    }
    pzzToolHome('ball', x, y);
    return;
  }
  if (d.kind === 'pin' || d.kind === 'ladle' || d.kind === 'bag' || d.kind === 'cutter') { pzzToolHome(d.kind, x, y); return; }
  if (d.kind === 'log') {
    if (pzzOverMouth(x, y)) { pzzAddLog(); return; }
    pzzToolHome('log', x, y);
    return;
  }
  if (d.kind === 'top') {
    hit = pzzUnder(x, y, 0.15);
    if (hit && hit.P.cheesed && hit.P.tops.length < PZZ_TOP_MAX) {
      pzzAddTop(hit.P, d.type, hit.u, hit.v);
      return;
    }
    if (hit) {
      // Pohja kesken: täyte kimpoaa ja puuttuva työkalu heilahtaa
      hit.P.wob = 0.35;
      if (pzzMissingTool(hit.P)) pzzNudge(pzzMissingTool(hit.P));
    }
    i = PZZ_TOPS.indexOf(d.type);
    if (pzzOverBin(x, y)) { pzzBinIt('#c8a070'); return; }
    if (hit || Math.hypot(x - L.bowls[i].x, y - L.bowls[i].y) < L.u * 0.14 || y < L.win.y1) {
      pzzFly('top', x, y, L.bowls[i].x, L.bowls[i].y - L.u * 0.025, { type: d.type });
      if (d.from === 'pizza') { pzz.shown.topOff = true; pzzAct(); }
      return;
    }
    // Lattialle: koira tulee nappaamaan
    pzzToFloor(d.type, x, y);
    if (d.from === 'pizza') { pzz.shown.topOff = true; pzzAct(); }
    return;
  }
  if (d.kind === 'pizza') {
    P = d.P;
    if (pzzOverBin(x, y)) {
      pzzRemovePizza(P);
      pzzBinIt(P.q === 'char' ? '#5a4a48' : '#f0c070');
      pzz.shown.bin = true;
      pzzAct();
      return;
    }
    if (pzzOverMouth(x, y) && d.from === 'board') {
      if (!pzzBaked(P) && P.cheesed) {
        s = pzzFreeSlot(x);
        if (s >= 0) { pzzIntoOven(P, s); return; }
        pzz.nudge.oven = 0.9;
      } else if (!pzzBaked(P)) pzzNudge(pzzMissingTool(P) || 'bag');
      P.wob = 0.35;
      playNote(220, 0, 0.12, 'triangle', 0.15);
      pzzSendBack(P, d);
      return;
    }
    g = pzzGroupAt(x, y);
    if (g) { pzzDeliver(d, g); return; }
    // Toiselle laudalle (uunista tai laudalta)
    best = -1; bd = L.boardR * 1.5;
    for (i = 0; i < 2; i++) {
      if (pzz.boards[i].P && pzz.boards[i].P !== P) continue;
      dd = Math.hypot(x - L.boards[i].x, y - L.boards[i].y);
      if (dd < bd) { bd = dd; best = i; }
    }
    if (best >= 0 && P.q !== 'char') {
      if (d.from === 'oven') { pzz.oven[d.si] = null; P.si = -1; pzz.shown.take = true; pzzAct(); }
      else pzz.boards[d.bi].P = null;
      P.bi = best;
      pzz.boards[best].P = P;
      P.fly = { x0: x, y0: y, t: 0, to: 'board' };
      P.where = 'fly';
      pzz.boards[best].pop = 0.3;
      b = L.boards[best];
      artPop(b.x, b.y, L.R * 1.1, '#fff0c8', 'ring');
      playNote(392, 0, 0.1, 'triangle', 0.25);
      playNote(523, 0.06, 0.12, 'triangle', 0.2);
      return;
    }
    if (best >= 0 && P.q === 'char') { pzz.boards[best].wob = 0.4; pzzPuff(x, y, 4, '#6a5a58'); }
    pzzSendBack(P, d);
  }
}
function pzzSendBack(P, d) {
  P.fly = { x0: d.x, y0: d.y, t: 0, to: d.from === 'oven' ? 'oven' : 'board' };
  P.where = 'fly';
}
function pzzLand(P) {
  P.where = P.fly && P.fly.to === 'oven' ? 'oven' : 'board';
  P.fly = null;
}
function pzzRemovePizza(P) {
  var i;
  for (i = 0; i < 2; i++) {
    if (pzz.boards[i].P === P) pzz.boards[i].P = null;
    if (pzz.oven[i] === P) pzz.oven[i] = null;
  }
}
function pzzFreeSlot(x) {
  var i, best = -1, bd = 1e9, dd;
  for (i = 0; i < PZZ_SLOTS[pzz.ph]; i++) {
    if (pzz.oven[i]) continue;
    dd = Math.abs(x - pzzSlotPos(i).x);
    if (dd < bd) { bd = dd; best = i; }
  }
  return best;
}
function pzzIntoOven(P, s) {
  pzz.boards[P.bi].P = null;
  pzz.oven[s] = P;
  P.si = s;
  P.where = 'oven';
  P.bt = 0;
  P.pop = 0.3;
  P.ding = false;
  P.late = false;
  pzzEmbers(8, 0.3, 0.2);
  pzzGlide(160, 90, 0, 0.35, 'sawtooth', 0.06);
  playNote(523, 0.1, 0.12, 'triangle', 0.2);
  pzz.shown.oven = true;
  pzzAct();
}
function pzzAddLog() {
  var m = pzzMouth(), i, was = pzzFireLow();
  pzz.fuel = 1;
  pzz.roarT = 1;
  pzz.lowWarn = false;
  pzzEmbers(14, 0.6, 0.4);
  artPop(m.x, m.y, pzz.L.mouthW * 0.5, '#ffb040', 'burst');
  pzzGlide(90, 260, 0, 0.45, 'sawtooth', 0.09);
  pzzGlide(140, 420, 0.05, 0.4, 'triangle', 0.12);
  if (was) for (i = 0; i < 3; i++) playNote([392, 523, 659][i], 0.15 + i * 0.08, 0.15, 'triangle', 0.22);
  pzz.shown.log = true;
  pzzAct();
}
function pzzAddTop(P, type, u, v) {
  var r = Math.hypot(u, v), s, i, t, k, L = pzz.L, half = pzzHalfOpen();
  if (r > 0.74) { u = u / r * 0.74; v = v / r * 0.74; }
  // Puolikas-tilaus auki: keskiviivalle pudotettu siirtyy selvästi puolelle
  if (half && Math.abs(u) < 0.1) u = u < 0 ? -0.1 : 0.1;
  // Ei täsmälleen päällekkäin: pieni tönäisy
  for (k = 0; k < 3; k++) {
    for (i = 0; i < P.tops.length; i++) {
      t = P.tops[i];
      if (Math.hypot(t.u - u, t.v - v) < 0.18) { u += ((u - t.u) || 0.05) * 0.6; v += ((v - t.v) || 0.05) * 0.6 + 0.03; }
    }
  }
  r = Math.hypot(u, v);
  if (r > 0.76) { u = u / r * 0.76; v = v / r * 0.76; }
  if (half && Math.abs(u) < 0.06) u = u < 0 ? -0.08 : 0.08;
  P.tops.push({ type: type, u: u, v: v, pop: 0.3, warm: pzzBaked(P) ? 1 : 0, rot: Math.random() * 6.28 });
  s = pzzPizzaPos(P);
  artPop(s.x + u * L.R, s.y + v * L.R * PZZ_SQ, pzzTopR() * 1.4, '#ffffff', 'ring');
  spawnSparkles(s.x + u * L.R, s.y + v * L.R * PZZ_SQ, 4, PZZ_TOP_COL[type]);
  playNote(700 + P.tops.length * 60, 0, 0.1, 'triangle', 0.28);
  if (pzzBaked(P)) pzzPuff(s.x + u * L.R, s.y + v * L.R * PZZ_SQ, 2, '#ffffff', { up: 0.06, life: 0.8 });
  pzz.shown.top = true;
  pzzAct();
}
function pzzHalfOpen() {
  var i, g;
  for (i = 0; i < 2; i++) { g = pzz.groups[i]; if (g && g.state === 'wait' && g.o.kind === 'half') return true; }
  return false;
}
function pzzToFloor(type, x, y) {
  if (pzz.floor.length > 8) pzz.floor.shift();
  pzz.floor.push({ type: type, x: x, y: y, vy: -pzz.L.u * 0.3, gy: pzz.L.H * 0.985, t: 0, rot: Math.random() * 6, landed: false });
  playNote(500, 0, 0.08, 'sine', 0.15);
}
function pzzBinIt(col) {
  var b = pzz.L.bin;
  pzz.binT = 0.6;
  pzzPuff(b.x, b.y - pzz.L.u * 0.09, 7, col, { big: true });
  playNote(392, 0, 0.1, 'sine', 0.25);
  playNote(262, 0.08, 0.16, 'sine', 0.2);
}
function pzzToolHome(name, x, y) { pzz.toolFly[name] = { x0: x, y0: y, t: 0 }; }
function pzzFly(kind, x0, y0, x1, y1, o) {
  var f = { kind: kind, x0: x0, y0: y0, x1: x1, y1: y1, t: 0, dur: (o && o.dur) || 0.4, o: o || {} };
  pzz.flies.push(f);
  return f;
}
function pzzCancelDrag() {
  var d = pzz.drag, i;
  if (!d) return;
  pzz.drag = null;
  if (d.kind === 'pizza') pzzSendBack(d.P, d);
  else if (d.kind === 'top') { i = PZZ_TOPS.indexOf(d.type); pzzFly('top', d.x, d.y, pzz.L.bowls[i].x, pzz.L.bowls[i].y - pzz.L.u * 0.025, { type: d.type }); }
  else pzzToolHome(d.kind, d.x, d.y);
}

// ---------- Tarjoilu ----------
function pzzDeliver(d, g) {
  var P = d.P, o = g.o, miss, pieces, i, L = pzz.L, T = L.tables[g.ti], extra, hs;
  pzz.shown.serve = true;
  pzzAct();
  if (!pzzBaked(P) || P.q === 'char') {
    // Raaka tai hiiltynyt: ei kelpaa
    g.miss = { part: 'raw', t: 2.2 };
    g.shakeT = 0.9;
    if (!pzzBaked(P)) pzz.nudge.oven = 0.9;
    playNote(392, 0, 0.16, 'triangle', 0.25);
    playNote(330, 0.16, 0.24, 'triangle', 0.25);
    pzzSendBack(P, d);
    return;
  }
  miss = pzzCheck(P, o);
  if (miss) {
    // Ei rangaistusta: pää ravistaa, kuplan väärä kohta sykkii, pizza palaa
    o.perfect = false;
    pzz.misses++;
    g.miss = { part: miss.part, i: miss.i, type: miss.type, t: 2.6 };
    g.shakeT = 0.9;
    playNote(392, 0, 0.16, 'triangle', 0.25);
    playNote(330, 0.16, 0.24, 'triangle', 0.25);
    pzzSendBack(P, d);
    return;
  }
  pieces = pzzPieces(P);
  if (pieces < g.n) {
    // Liian vähän paloja: osa jää ilman ja pizza palaa leikattavaksi
    o.perfect = false;
    pzz.misses++;
    g.miss = { part: 'cuts', have: pieces, t: 2.6 };
    for (i = 0; i < g.n; i++) if (i >= pieces) { g.pups[i].sad = 2.6; } else g.pups[i].hop = 0.4;
    pzzNudge('cutter');
    playNote(523, 0, 0.14, 'sine', 0.2);
    playNote(440, 0.16, 0.18, 'sine', 0.2);
    playNote(349, 0.36, 0.3, 'sine', 0.18);
    pzzSendBack(P, d);
    return;
  }
  extra = pieces - g.n;
  if (P.q === 'bit' || g.sits || extra > 0) o.perfect = false;
  if (extra > 0) { pzz.extra++; pzz.goldLostT = 1.5; }
  pzzRemovePizza(P);
  P.where = 'table';
  P.tx = T.x;
  P.ty = T.y + L.u * 0.02;
  P.fly = { x0: d.x, y0: d.y, t: 0 };
  P.left = [];
  for (i = 0; i < pieces; i++) P.left.push(true);
  g.P = P;
  g.state = 'eat';
  g.eatT = 0;
  g.joyT = 1.6;
  g.miss = null;
  g.sits = false;
  for (i = 0; i < g.n; i++) {
    pzzFly('slice', P.tx, P.ty, g.pups[i].x, T.y + L.u * 0.006, { delay: 0.35 + i * 0.09, dur: 0.35, g: g, pi: i, si: i, P: P });
  }
  for (i = g.n; i < pieces; i++) pzz.snacks.push({ kind: 'slice', g: g, si: i, P: P, x: P.tx, y: P.ty, delay: 0.9 });
  if (P.q === 'bit') {
    g.coughT = 1.4;
    pzzPuff(T.x, T.y - L.u * 0.08, 6, '#8a7a7a');
    playNote(220, 0.5, 0.12, 'sawtooth', 0.07);
    playNote(196, 0.68, 0.12, 'sawtooth', 0.07);
  }
  for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 1319, 1568][i], 0.05 + i * 0.07, 0.18, 'triangle', 0.25);
  spawnSparkles(T.x, T.y - L.u * 0.06, 16, '#ff9ec6');
  for (i = 0; i < 3; i++) pzzFly('coin', T.x, T.y - L.u * 0.05, L.reg.x, L.reg.y - L.u * 0.04, { delay: 0.5 + i * 0.12, dur: 0.5 });
  hs = pzzHudSlot(o.idx);
  pzzFly('star', T.x, T.y - L.u * 0.1, hs.x, hs.y, { gold: o.perfect, idx: o.idx, delay: 0.4, dur: 0.6 });
}

// ---------- Päivitys ----------
function updatePizza(dt) {
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  pzzUpdateFx(dt);
  if (celebrating) { pzz.celT += dt; return; }
  if (puzzleBusy()) return;
  pzz.t += dt;
  if (!holding) pzz.idleT += dt;
  pzz.dayK += Math.max(-dt * 0.3, Math.min(dt * 0.3, pzz.ph - pzz.dayK));
  if (pzz.slotsK < 1) pzz.slotsK = Math.min(1, pzz.slotsK + dt * 1.5);
  if (pzz.tablesK < 1) pzz.tablesK = Math.min(1, pzz.tablesK + dt * 1.5);
  if (pzz.bowlsK < 1) pzz.bowlsK = Math.min(1, pzz.bowlsK + dt * 1.5);
  pzzUpdateDrag(dt);
  pzzUpdateOven(dt);
  pzzUpdateGroups(dt);
  pzzUpdateFlow(dt);
  pzz.hintStep = pzzNextStep();
  if (pzz.hintStep && !holding && !pzz.drag && (!pzz.shown[pzz.hintStep.kind] || pzz.idleT > PZZ_HINT_IDLE)) pzz.hintT += dt;
  else pzz.hintT = 0;
}
function pzzUpdateOven(dt) {
  var i, P, k, s, m = pzzMouth(), live = pzz.flow === 'play' || pzz.flow === 'van', mult, any = false, L = pzz.L;
  // Tuli hiipuu päivällä ja illalla
  if (live && PZZ_FUEL_LIFE[pzz.ph] > 0) {
    pzz.fuel = Math.max(0, pzz.fuel - dt / PZZ_FUEL_LIFE[pzz.ph]);
    if (pzzFireLow() && !pzz.lowWarn) {
      pzz.lowWarn = true;
      pzzGlide(1200, 500, 0, 0.6, 'sawtooth', 0.025);
      pzzPuff(m.x, m.y - L.u * 0.04, 6, '#8a8a98', { big: true });
    }
  }
  if (pzz.roarT > 0) pzz.roarT -= dt;
  if (pzz.crackT > 0) pzz.crackT -= dt;
  if (pzzFireLow()) {
    pzz.hissT -= dt;
    if (pzz.hissT <= 0) {
      pzz.hissT = 1.3 + Math.random() * 0.6;
      pzzGlide(2400, 1400, 0, 0.3, 'sawtooth', 0.012);
      pzzPuff(m.x + (Math.random() - 0.5) * L.mouthW * 0.4, m.y - L.mouthH * 0.4, 2, '#9a9aa8', { up: 0.1, life: 1.4 });
    }
  }
  mult = pzzFireLow() ? PZZ_SLOW : 1;
  for (i = 0; i < 2; i++) {
    P = pzz.oven[i];
    if (!P || P.where !== 'oven' || !live) continue;
    any = true;
    s = pzzSlotPos(i);
    P.bt += dt * mult;
    k = pzzBakeK(P);
    if (k >= 1 && !P.ding) {
      // Kultainen hetki: kilahdus paikan omalla sävelellä
      P.ding = true;
      P.ringT = 0.6;
      playNote([1319, 1568][i], 0, 0.35, 'sine', 0.28);
      playNote([1976, 2349][i], 0.08, 0.3, 'sine', 0.12);
      spawnSparkles(s.x, s.y - L.u * 0.03, 10, '#ffd24f');
    }
    if (k > 1 && !P.late) {
      P.late = true;
      if (!P.burnt) { P.burnt = true; pzz.burnt++; pzz.goldLostT = 1.5; }
      playNote(294, 0, 0.18, 'triangle', 0.2);
      playNote(247, 0.15, 0.25, 'triangle', 0.2);
    }
    if (k >= 2 && !P.charred) {
      P.charred = true;
      playNote(1760, 0, 0.1, 'square', 0.07);
      playNote(1760, 0.2, 0.1, 'square', 0.07);
      playNote(1760, 0.4, 0.1, 'square', 0.07);
      pzzPuff(s.x, s.y - L.u * 0.04, 8, '#5a4a48', { big: true });
    }
    if (Math.random() < dt * (0.8 + Math.min(2, k) * 1.6)) {
      pzzPuff(s.x + (Math.random() - 0.5) * L.R * 0.8, L.ovenY - L.mouthH * 0.95, 1, k < 1.3 ? '#ffffff' : (k < 2 ? '#a89a98' : '#5a4a48'), { up: 0.1 + Math.random() * 0.05, life: 1.1 });
    }
  }
  // Rätinä: pehmeä paukahtelu, kun uunissa paistuu jotain
  pzz.sndT -= dt;
  if (pzz.sndT <= 0) {
    pzz.sndT = 0.16 + Math.random() * 0.2;
    if (live && (any || Math.random() < 0.3)) playNote(1600 + Math.random() * 1800, 0, 0.025, 'square', pzzFireLow() ? 0.006 : 0.012);
  }
}
function pzzPizzaFx(P, dt) {
  var i, t, tg, da;
  if (P.wob > 0) P.wob -= dt;
  if (P.pop > 0) P.pop -= dt;
  if (P.rollT > 0) P.rollT -= dt;
  if (P.ringT > 0) P.ringT -= dt;
  if (P.cutFlash > 0) P.cutFlash -= dt;
  for (i = 0; i < P.tops.length; i++) {
    t = P.tops[i];
    if (t.pop > 0) t.pop -= dt;
    if (t.warm > 0) t.warm = Math.max(0, t.warm - dt * 0.4);
  }
  // Viillot liukuvat tasaväleihin
  for (i = 0; i < P.cutAng.length; i++) {
    tg = pzzCutTarget(P, i);
    da = tg - P.cutAng[i];
    P.cutAng[i] += da * Math.min(1, dt * 9);
  }
  if (P.where === 'fly' && P.fly) {
    P.fly.t += dt;
    if (P.fly.t >= 0.3) { pzzLand(P); P.pop = 0.2; }
  }
}
function pzzUpdateFx(dt) {
  var i, f, p, b, g, s, nm;
  for (i = pzz.flies.length - 1; i >= 0; i--) {
    f = pzz.flies[i];
    f.t += dt;
    if (f.kind === 'ember') { if (f.t > f.dur) pzz.flies.splice(i, 1); continue; }
    if (f.t - (f.o.delay || 0) >= f.dur) {
      pzz.flies.splice(i, 1);
      if (f.kind === 'coin') { playNote(1319 + Math.random() * 200, 0, 0.08, 'sine', 0.15); pzz.regPop = 0.25; }
      if (f.kind === 'star') {
        pzz.stars[f.o.idx] = f.o.gold ? 2 : 1;
        pzz.starPop = 0.4;
        spawnSparkles(f.x1, f.y1, 10, f.o.gold ? '#ffd24f' : '#ffffff');
        playNote(1047, 0, 0.15, 'triangle', 0.3);
        playNote(1568, 0.1, 0.25, 'triangle', 0.3);
      }
      if (f.kind === 'slice') {
        f.o.P.left[f.o.si] = false;
        p = f.o.g.pups[f.o.pi];
        p.got = true;
        p.munch = 1.9;
        p.hop = 0.3;
        playNote(784 + f.o.pi * 50, 0, 0.08, 'triangle', 0.2);
      }
    }
  }
  for (i = pzz.puffs.length - 1; i >= 0; i--) {
    p = pzz.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 2);
    if (p.t > p.life) pzz.puffs.splice(i, 1);
  }
  for (i = pzz.shreds.length - 1; i >= 0; i--) {
    s = pzz.shreds[i];
    s.t += dt;
    s.y += s.vy * dt;
    s.vy += viewH * 2 * dt;
    if (s.y >= s.ty) pzz.shreds.splice(i, 1);
  }
  for (i = 0; i < 2; i++) {
    b = pzz.boards[i];
    if (b.wob > 0) b.wob -= dt;
    if (b.pop > 0) b.pop -= dt;
    if (b.P) pzzPizzaFx(b.P, dt);
    if (pzz.oven[i]) pzzPizzaFx(pzz.oven[i], dt);
    g = pzz.groups[i];
    if (g && g.P) { g.P.fly.t += dt; pzzPizzaFx(g.P, dt); }
  }
  for (nm in pzz.toolFly) {
    if (!pzz.toolFly.hasOwnProperty(nm) || !pzz.toolFly[nm]) continue;
    pzz.toolFly[nm].t += dt;
    if (pzz.toolFly[nm].t >= 0.35) { pzz.toolFly[nm] = null; playNote(330, 0, 0.05, 'triangle', 0.1); }
  }
  for (nm in pzz.nudge) if (pzz.nudge.hasOwnProperty(nm) && pzz.nudge[nm] > 0) pzz.nudge[nm] -= dt;
  if (pzz.binT > 0) pzz.binT -= dt;
  if (pzz.goldLostT > 0) pzz.goldLostT -= dt;
  if (pzz.starPop > 0) pzz.starPop -= dt;
  if (pzz.regPop > 0) pzz.regPop -= dt;
  if (pzz.van) {
    pzz.van.t += dt;
    if (pzz.van.leave >= 0 && pzz.van.t - pzz.van.leave > 2.2) pzz.van = null;
  }
  // Lattialle pudonneet täytteet
  for (i = pzz.floor.length - 1; i >= 0; i--) {
    f = pzz.floor[i];
    f.t += dt;
    if (!f.landed) {
      f.vy += viewH * 2.2 * dt;
      f.y += f.vy * dt;
      f.rot += dt * 8;
      if (f.y >= f.gy) { f.y = f.gy; f.landed = true; playNote(400, 0, 0.05, 'triangle', 0.12); pzz.snacks.push({ kind: 'floor', f: f, x: f.x, y: f.gy, delay: 0.2 }); }
    }
    if (f.eaten) pzz.floor.splice(i, 1);
  }
  for (i = 0; i < pzz.snacks.length; i++) if (pzz.snacks[i].delay > 0) pzz.snacks[i].delay -= dt;
  pzzUpdateDog(dt);
  pzzUpdateStreet(dt);
}
function pzzShredRain(x, y, dt) {
  var i, n = Math.random() < dt * 30 ? 2 : 0;
  for (i = 0; i < n; i++) {
    if (pzz.shreds.length > 50) pzz.shreds.shift();
    pzz.shreds.push({ x: x + (Math.random() - 0.5) * pzz.L.R * 0.45, y: y - pzz.L.u * 0.01, vy: viewH * 0.1, ty: y + pzz.L.u * 0.02 + Math.random() * pzz.L.u * 0.015, t: 0, rot: Math.random() * 3 });
  }
  if (Math.random() < dt * 10) playNote(3000 + Math.random() * 1500, 0, 0.02, 'triangle', 0.025);
}

// ---------- Pizzerian koira ----------
// Makaa pöydän alla. Lattialle pudonnut täyte ja ylimääräinen pala
// houkuttavat sen hakemaan: juoksu, hyppy, namskutus ja häntä heiluu.
function pzzUpdateDog(dt) {
  var D = pzz.dog, L = pzz.L, i, sn = null, dx, sp = L.u * 2.2, T, g;
  if (!D) return;
  D.t += dt;
  if (D.munch > 0) D.munch -= dt;
  if (D.jump > 0) D.jump -= dt;
  if (D.wag > 0) D.wag -= dt;
  if (D.trick > 0) D.trick -= dt;
  if (D.roll > 0) D.roll -= dt;
  // Vanhentuneet: seurue lähti, täyte jo syöty
  for (i = pzz.snacks.length - 1; i >= 0; i--) {
    sn = pzz.snacks[i];
    if (sn.kind === 'slice' && (sn.g.state !== 'eat' || !sn.P.left[sn.si])) { if (sn.g.state !== 'eat' && sn.P.left[sn.si]) sn.P.left[sn.si] = false; pzz.snacks.splice(i, 1); }
  }
  sn = null;
  for (i = 0; i < pzz.snacks.length; i++) if (pzz.snacks[i].delay <= 0) { sn = pzz.snacks[i]; break; }
  if (D.state === 'eat') {
    if (D.munch <= 0) { D.state = sn ? 'run' : 'back'; }
    return;
  }
  if (sn && D.state !== 'run') { D.state = 'run'; playNote(784, 0, 0.06, 'square', 0.04); playNote(988, 0.08, 0.06, 'square', 0.04); }
  if (D.state === 'run') {
    if (!sn) { D.state = 'back'; return; }
    dx = sn.x - D.x;
    D.face = dx < 0 ? -1 : 1;
    D.x += Math.max(-sp * dt, Math.min(sp * dt, dx));
    if (Math.abs(dx) < L.u * 0.01) {
      // Perillä: nappaa
      pzz.snacks.splice(pzz.snacks.indexOf(sn), 1);
      if (sn.kind === 'floor') sn.f.eaten = true;
      else { sn.P.left[sn.si] = false; D.jump = 0.5; }
      D.state = 'eat';
      D.munch = 0.8;
      D.wag = 1.4;
      pzzPuff(D.x, D.y - L.u * 0.06, 2, '#ff8fb8', { heart: true, up: 0.1, life: 1.2 });
      for (i = 0; i < 3; i++) playNote(330 + i * 40, 0.05 + i * 0.14, 0.06, 'square', 0.04);
    }
    return;
  }
  if (D.state === 'back') {
    dx = L.dog.x - D.x;
    D.face = dx < 0 ? -1 : 1;
    D.x += Math.max(-sp * 0.6 * dt, Math.min(sp * 0.6 * dt, dx));
    if (Math.abs(dx) < 1) { D.state = 'lie'; D.face = -1; }
  }
}

// ---------- Katu ikkunan takana ----------
function pzzUpdateStreet(dt) {
  var i, p, W = pzz.L.win;
  pzz.passT -= dt;
  if (pzz.passT <= 0 && pzz.passers.length < 3) {
    pzz.passT = 4 + Math.random() * 5;
    pzzAddPasser(Math.random() < 0.5 ? 1 : -1, false);
  }
  for (i = pzz.passers.length - 1; i >= 0; i--) {
    p = pzz.passers[i];
    p.t += dt;
    if (p.wave > 0) p.wave -= dt;
    p.x += p.dir * p.sp * dt;
    if ((p.dir > 0 && p.x > W.x1 + pzz.L.u * 0.08) || (p.dir < 0 && p.x < W.x0 - pzz.L.u * 0.08)) pzz.passers.splice(i, 1);
  }
}
function pzzAddPasser(dir, wave) {
  var W = pzz.L.win, kinds = ['pup', 'pup', 'balloon', 'bike', 'pup'];
  pzz.passers.push({
    x: dir > 0 ? W.x0 - pzz.L.u * 0.06 : W.x1 + pzz.L.u * 0.06, dir: dir, sp: pzz.L.u * (0.07 + Math.random() * 0.05), t: Math.random() * 5,
    tint: PZZ_TINTS[randInt(PZZ_TINTS.length)], kind: kinds[randInt(kinds.length)], wave: wave ? 1.2 : 0, col: ['#ff8fb8', '#8fd0ff', '#ffe27a', '#b8f0a0'][randInt(4)]
  });
}

// ---------- Seuraava vaihe (vihjekäsi ja testibotti) ----------
// Paluu: { kind, from, to, ... }. Raahaukset: dough, top, topOff, oven, take,
// bin, log, serve. Hankaukset (työkalu pizzalle ja liikettä): roll, sauce,
// cheese. Pyyhkäisy: cut.
function pzzWaiting() {
  var out = [], i, g;
  for (i = 0; i < 2; i++) { g = pzz.groups[i]; if (g && g.state === 'wait') out.push(g); }
  out.sort(function (a, b) { return a.seq - b.seq; });
  return out;
}
function pzzPizzaList() {
  var out = [], i, P;
  for (i = 0; i < 2; i++) {
    P = pzz.oven[i];
    if (P && P.q !== 'char' && (P.where === 'oven' || P.where === 'fly')) out.push(P);
    P = pzz.boards[i].P;
    if (P && P.q !== 'char' && (P.where === 'board' || P.where === 'fly')) out.push(P);
  }
  return out;
}
function pzzProgress(P) { return (pzzBaked(P) ? 20 : 0) + (P.where === 'oven' ? 15 : 0) + (P.cheesed ? 4 : 0) + (P.sauced ? 3 : 0) + P.size + P.tops.length * 0.3; }
// Seurue -> pizza: sopiva pisimmälle ehtinyt, muuten mikä tahansa korjattava
function pzzAssign() {
  var G = pzzWaiting(), Ps = pzzPizzaList(), taken = {}, out = [], i, j, g, best, bs, sc, P;
  for (i = 0; i < G.length; i++) {
    g = G[i];
    best = null; bs = -1;
    for (j = 0; j < Ps.length; j++) {
      P = Ps[j];
      if (taken[P.id] || pzzPieces(P) > g.n) continue;
      sc = pzzProgress(P) + (pzzCompatible(P, g.o) ? 100 : 0);
      if (sc > bs) { bs = sc; best = P; }
    }
    if (best) taken[best.id] = true;
    out.push({ g: g, P: best });
  }
  return out;
}
// Täyteasento: vapaa kohta (puolikkaassa oikealla puolella)
var PZZ_SPOTS = [[0, 0], [0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3],
  [0.62, 0.22], [-0.62, 0.22], [0.62, -0.22], [-0.62, -0.22], [0.22, 0.62], [-0.22, 0.62], [0.22, -0.62], [-0.22, -0.62]];
function pzzTopSpot(P, side) {
  var i, j, s, ok, half = side || pzzHalfOpen();
  for (i = 0; i < PZZ_SPOTS.length; i++) {
    s = PZZ_SPOTS[i];
    if (side && s[0] * side < 0.2) continue;
    if (!side && half && Math.abs(s[0]) < 0.2) continue;
    ok = true;
    for (j = 0; j < P.tops.length; j++) if (Math.hypot(P.tops[j].u - s[0], P.tops[j].v - s[1]) < 0.3) { ok = false; break; }
    if (ok) return { u: s[0], v: s[1] };
  }
  return { u: (side || 1) * (0.3 + Math.random() * 0.3), v: (Math.random() - 0.5) * 0.8 };
}
function pzzWorldOf(P, u, v) { var c = pzzPizzaPos(P); return { x: c.x + u * pzz.L.R, y: c.y + v * pzz.L.R * PZZ_SQ }; }
function pzzBowlPos(type) { var b = pzz.L.bowls[PZZ_TOPS.indexOf(type)]; return { x: b.x, y: b.y - pzz.L.u * 0.03 }; }
// Täytteiden korjaus: väärä pois, ylimääräinen pois, puuttuva lisää
function pzzTopStep(P, o) {
  var w = pzzWrongTop(P, o), i, j, e, t, sp, n;
  if (w >= 0) return { kind: 'topOff', from: pzzWorldOf(P, P.tops[w].u, P.tops[w].v), to: pzzBowlPos(P.tops[w].type), type: P.tops[w].type, P: P };
  for (i = 0; i < o.tops.length; i++) {
    e = o.tops[i];
    n = pzzCountTops(P, e.type, e.side);
    if (n > e.n) {
      for (j = P.tops.length - 1; j >= 0; j--) {
        t = P.tops[j];
        if (t.type === e.type && (!e.side || (t.u < 0 ? -1 : 1) === e.side)) return { kind: 'topOff', from: pzzWorldOf(P, t.u, t.v), to: pzzBowlPos(t.type), type: t.type, P: P };
      }
    }
  }
  for (i = 0; i < o.tops.length; i++) {
    e = o.tops[i];
    if (pzzCountTops(P, e.type, e.side) < e.n) {
      sp = pzzTopSpot(P, e.side);
      return { kind: 'top', from: pzzBowlPos(e.type), to: pzzWorldOf(P, sp.u, sp.v), type: e.type, P: P };
    }
  }
  return null;
}
function pzzNextStep() {
  var L = pzz.L, i, s, P, k, fb, A, a, st, best = -1, bk = -1, raw = false, bc, T;
  if (pzz.flow !== 'play' || !L) return null;
  // 1. Uuni: hiiltyneet roskiin, kultaiset ulos (kiireellisin ensin)
  for (s = 0; s < PZZ_SLOTS[pzz.ph]; s++) {
    P = pzz.oven[s];
    if (!P || P.where !== 'oven') continue;
    k = pzzBakeK(P);
    if (k >= 2) return { kind: 'bin', from: pzzSlotPos(s), to: { x: L.bin.x, y: L.bin.y - L.u * 0.05 }, si: s };
    if (k >= 1 && k > bk) { bk = k; best = s; }
    if (k < 1) raw = true;
  }
  if (best >= 0) {
    fb = pzzFreeBoard();
    if (fb >= 0) return { kind: 'take', from: pzzSlotPos(best), to: L.boards[fb], si: best, bi: fb };
  }
  // 2. Tuli hiipuu, kun uunissa paistuu
  if (pzzFireLow() && raw) return { kind: 'log', from: { x: L.pile.x, y: L.pile.y - L.u * 0.04 }, to: pzzMouth() };
  A = pzzAssign();
  // 3. Paistetut laudalla: täytteet kuntoon, leikkaus, tarjoilu
  for (i = 0; i < A.length; i++) {
    a = A[i];
    P = a.P;
    if (!P || P.where !== 'board' || !pzzBaked(P)) continue;
    st = pzzTopStep(P, a.g.o);
    if (st) return st;
    bc = L.boards[P.bi];
    if (pzzPieces(P) < a.g.n) return { kind: 'cut', from: { x: L.cutter.x, y: L.cutter.y }, to: bc, P: P, bi: P.bi };
    T = L.tables[a.g.ti];
    return { kind: 'serve', from: pzzGrabPt(P), to: { x: T.x, y: T.y - L.u * 0.05 }, P: P, g: a.g };
  }
  // 4. Raa'at laudalla: kaulinta, kastike, juusto, täytteet, uuniin
  for (i = 0; i < A.length; i++) {
    a = A[i];
    P = a.P;
    if (!P || P.where !== 'board' || pzzBaked(P)) continue;
    bc = L.boards[P.bi];
    if (P.size < 1) return { kind: 'roll', from: { x: L.pin.x, y: L.pin.y }, to: bc, P: P, bi: P.bi };
    if (!P.sauced) return { kind: 'sauce', from: { x: L.sauce.x, y: L.sauce.y - L.u * 0.035 }, to: bc, P: P, bi: P.bi };
    if (!P.cheesed) return { kind: 'cheese', from: { x: L.cheese.x, y: L.cheese.y - L.u * 0.04 }, to: bc, P: P, bi: P.bi };
    st = pzzTopStep(P, a.g.o);
    if (st) return st;
    s = pzzFreeSlot(L.ovenX);
    if (s >= 0) return { kind: 'oven', from: pzzGrabPt(P), to: pzzMouth(), P: P };
  }
  // 5. Uusi taikina seurueelle, jolla ei vielä ole pizzaa
  for (i = 0; i < A.length; i++) {
    if (A[i].P) continue;
    fb = pzzFreeBoard();
    if (fb >= 0) return { kind: 'dough', from: { x: L.doughBowl.x, y: L.doughBowl.y - L.u * 0.03 }, to: L.boards[fb], bi: fb };
  }
  // 6. Tuli hiipuu (myös tyhjänä)
  if (pzzFireLow()) return { kind: 'log', from: { x: L.pile.x, y: L.pile.y - L.u * 0.04 }, to: pzzMouth() };
  return null;
}
// Tarttumakohta: kuoren alareuna (keskellä voi olla täyte)
function pzzGrabPt(P) { return pzzWorldOf(P, 0, 0.9); }
function pzzRubKind(k) { return k === 'roll' || k === 'sauce' || k === 'cheese'; }

// ---------- Piirto: täytteet ----------
// (x, y) = täytteen keskikohta, r = koko
function pzzDrawTop(c, type, x, y, r, rot) {
  var i, a;
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot);
  if (type === 'shroom') {
    // Sieniviipale: lakki ja jalka
    c.beginPath();
    c.moveTo(-r * 0.95, r * 0.05);
    c.bezierCurveTo(-r * 0.95, -r * 0.95, r * 0.95, -r * 0.95, r * 0.95, r * 0.05);
    c.lineTo(r * 0.32, r * 0.05);
    c.lineTo(r * 0.36, r * 0.82);
    c.quadraticCurveTo(0, r * 0.98, -r * 0.36, r * 0.82);
    c.lineTo(-r * 0.32, r * 0.05);
    c.closePath();
    c.fillStyle = '#f4e2c8';
    c.fill();
    c.strokeStyle = '#8a6040';
    c.lineWidth = Math.max(1, r * 0.14);
    c.lineJoin = 'round';
    c.stroke();
    c.strokeStyle = 'rgba(160,110,70,0.6)';
    c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath();
    for (i = -2; i <= 2; i++) { c.moveTo(i * r * 0.16, -r * 0.05); c.lineTo(i * r * 0.22, -r * 0.42); }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(-r * 0.4, -r * 0.45, r * 0.14, 0, Math.PI * 2); c.fill();
  } else if (type === 'pep') {
    // Pupupepperoni: punainen kiekko ja pupunkorvat
    c.fillStyle = '#c8302e';
    c.strokeStyle = '#7a1a1a';
    c.lineWidth = Math.max(1, r * 0.12);
    for (i = -1; i <= 1; i += 2) {
      c.beginPath();
      if (c.ellipse) c.ellipse(i * r * 0.38, -r * 0.82, r * 0.2, r * 0.42, i * 0.25, 0, Math.PI * 2);
      else c.arc(i * r * 0.38, -r * 0.82, r * 0.25, 0, Math.PI * 2);
      c.fill(); c.stroke();
    }
    c.beginPath(); c.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    c.fillStyle = '#e0443e';
    c.fill(); c.stroke();
    c.fillStyle = '#ff8a7a';
    for (i = 0; i < 4; i++) { a = i * 1.7 + 0.4; c.beginPath(); c.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.42, r * 0.13, 0, Math.PI * 2); c.fill(); }
  } else if (type === 'olive') {
    // Oliivirengas
    c.strokeStyle = '#1e1824';
    c.lineWidth = r * 0.62;
    c.beginPath(); c.arc(0, 0, r * 0.56, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#4a4058';
    c.lineWidth = r * 0.36;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.45)';
    c.lineWidth = Math.max(1, r * 0.1);
    c.beginPath(); c.arc(0, 0, r * 0.56, 3.6, 4.6); c.stroke();
  } else if (type === 'pepper') {
    // Paprikarengas: kolme pyöreää lohkoa
    c.beginPath();
    for (i = 0; i <= 36; i++) {
      a = i / 36 * Math.PI * 2;
      var rr = r * (0.72 + Math.cos(a * 3) * 0.14);
      if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.strokeStyle = '#2a7a1e';
    c.lineWidth = r * 0.42;
    c.lineJoin = 'round';
    c.stroke();
    c.strokeStyle = '#6ad04e';
    c.lineWidth = r * 0.24;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = Math.max(1, r * 0.07);
    c.stroke();
  } else if (type === 'pine') {
    // Ananaspala: kolmio
    c.beginPath();
    c.moveTo(-r * 0.85, r * 0.6);
    c.lineTo(0, -r * 0.85);
    c.lineTo(r * 0.85, r * 0.6);
    c.quadraticCurveTo(0, r * 0.95, -r * 0.85, r * 0.6);
    c.closePath();
    c.fillStyle = '#ffd84a';
    c.fill();
    c.strokeStyle = '#c08010';
    c.lineWidth = Math.max(1, r * 0.13);
    c.lineJoin = 'round';
    c.stroke();
    c.strokeStyle = 'rgba(200,140,20,0.55)';
    c.lineWidth = Math.max(1, r * 0.07);
    c.beginPath(); c.moveTo(-r * 0.4, r * 0.4); c.lineTo(0, -r * 0.3); c.lineTo(r * 0.4, r * 0.4); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.arc(-r * 0.18, -r * 0.1, r * 0.1, 0, Math.PI * 2); c.fill();
  } else {
    // Basilikanlehti
    c.beginPath();
    c.moveTo(0, r * 0.95);
    c.bezierCurveTo(-r * 1.0, r * 0.4, -r * 0.7, -r * 0.7, 0, -r * 0.95);
    c.bezierCurveTo(r * 0.7, -r * 0.7, r * 1.0, r * 0.4, 0, r * 0.95);
    c.closePath();
    c.fillStyle = '#44aa3c';
    c.fill();
    c.strokeStyle = '#1e6a1e';
    c.lineWidth = Math.max(1, r * 0.12);
    c.stroke();
    c.strokeStyle = '#a8e890';
    c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath(); c.moveTo(0, r * 0.8); c.lineTo(0, -r * 0.7);
    c.moveTo(0, r * 0.2); c.lineTo(-r * 0.35, -r * 0.1); c.moveTo(0, r * 0.2); c.lineTo(r * 0.35, -r * 0.1);
    c.stroke();
  }
  c.restore();
}

// ---------- Piirto: pizza ----------
function pzzBlobPath(c, r, seed, n) {
  var i, a, rr;
  n = n || 18;
  c.beginPath();
  for (i = 0; i <= n; i++) {
    a = i / n * Math.PI * 2;
    rr = r * (1 + Math.sin(a * 5 + seed) * 0.03 + Math.sin(a * 3 + seed * 2) * 0.025);
    if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
}
function pzzCheeseK(P) {
  if (pzzBaked(P)) return 1;
  if (P.where === 'oven') return Math.min(1, pzzBakeK(P));
  return 0;
}
// Viiltojen rajakulmat järjestyksessä (paloja 2k)
function pzzWedgeAngles(P) {
  var out = [], i, a;
  for (i = 0; i < P.cutAng.length; i++) {
    a = ((P.cutAng[i] % Math.PI) + Math.PI) % Math.PI;
    out.push(a, a + Math.PI);
  }
  out.sort(function (x, y) { return x - y; });
  return out;
}
// Pizza: (x, y) = keskikohta, R = täysi säde. o: { sq, left (palat jäljellä), noRing, mini }
function pzzDrawPizza(c, P, x, y, R, o) {
  var sq, i, C, cell, crust, r, pop, k, ck, cc, a, b, W, half, n;
  o = o || {};
  sq = o.sq || PZZ_SQ;
  c.save();
  c.translate(x, y);
  if (P.wob > 0) c.rotate(Math.sin(P.wob * 40) * 0.05);
  pop = P.pop > 0 ? 1 + Math.sin(Math.min(1, P.pop / 0.35) * Math.PI) * 0.07 : 1;
  c.scale(pop, pop * sq);
  if (P.size < 1) {
    // Taikinapallo: kaulinta kasvattaa, katkoviivarengas näyttää valmiin koon
    if (!o.noRing) {
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = Math.max(2, R * 0.05);
      c.lineCap = 'round';
      c.beginPath();
      for (i = 0; i < 18; i++) { a = i / 18 * Math.PI * 2 + globalT * 0.3; c.moveTo(Math.cos(a) * R, Math.sin(a) * R); c.arc(0, 0, R, a, a + 0.18); }
      c.stroke();
    }
    r = R * pzzDoughR(P);
    if (P.rollT > 0) c.scale(1.06, 0.94);
    artCircle(c, 0, 0, r, PZZ_DOUGH, { lineColor: '#c8a06a', hi: Math.max(0.15, 0.5 - P.size * 0.35) });
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (i = 0; i < 6; i++) { a = P.seed + i * 1.3; c.beginPath(); c.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.5, r * 0.06, 0, Math.PI * 2); c.fill(); }
    c.restore();
    return;
  }
  if (o.left) {
    // Tarjoiltu: vain jäljellä olevat palat näkyvät
    W = pzzWedgeAngles(P);
    if (W.length) {
      c.beginPath();
      for (i = 0; i < W.length; i++) {
        if (!o.left[i]) continue;
        a = W[i];
        b = i + 1 < W.length ? W[i + 1] : W[0] + Math.PI * 2;
        c.moveTo(0, 0);
        c.arc(0, 0, R * 1.1, a, b);
        c.closePath();
      }
      c.clip();
    } else if (!o.left[0]) { c.restore(); return; }
  }
  crust = pzzCrustCol(P);
  artCircle(c, 0, 0, R, crust, { lineColor: artShade(crust, -0.45) });
  artCircle(c, 0, 0, R * 0.86, artMix(PZZ_DOUGH, crust, 0.35), { line: false, flat: true });
  if (P.ringT > 0) {
    c.strokeStyle = 'rgba(255,255,255,' + (P.ringT / 0.6) + ')';
    c.lineWidth = R * 0.08;
    c.beginPath(); c.arc(0, 0, R * 1.05, 0, Math.PI * 2); c.stroke();
  }
  // Kastike
  C = pzzCells();
  c.fillStyle = '#d23a28';
  if (P.sauced) { pzzBlobPath(c, R * 0.82, P.seed); c.fill(); }
  else {
    c.beginPath();
    n = 0;
    for (i = 0; i < C.length; i++) {
      cell = C[i];
      if (P.sauce[cell.k] < 1) continue;
      n++;
      c.moveTo(cell.u * R + R * 0.17, cell.v * R);
      c.arc(cell.u * R, cell.v * R, R * (0.15 + cell.s * 0.04), 0, Math.PI * 2);
    }
    if (n) c.fill();
  }
  if (P.sauced || n) {
    c.fillStyle = 'rgba(255,140,110,0.35)';
    c.beginPath(); c.arc(-R * 0.3, -R * 0.32, R * 0.16, 0, Math.PI * 2); c.fill();
  }
  // Juusto: raastetta tai sulanut kerros
  ck = pzzCheeseK(P);
  cc = artMix('#fff2a8', '#ffca50', ck);
  if (P.cheesed) {
    pzzBlobPath(c, R * 0.78, P.seed + 2, 16);
    c.fillStyle = cc;
    c.fill();
    if (ck < 0.6) {
      c.strokeStyle = artMix('#f4d060', '#e0a030', ck);
      c.lineWidth = Math.max(1, R * 0.035);
      c.lineCap = 'round';
      c.beginPath();
      for (i = 0; i < C.length; i++) {
        cell = C[i];
        a = cell.s * 6;
        c.moveTo(cell.u * R * 0.9, cell.v * R * 0.9);
        c.lineTo(cell.u * R * 0.9 + Math.cos(a) * R * 0.1, cell.v * R * 0.9 + Math.sin(a) * R * 0.1);
      }
      c.stroke();
    }
    if (ck > 0.5) {
      // Kuplat ja ruskistuneet läikät
      c.fillStyle = 'rgba(200,110,30,' + ((ck - 0.5) * 0.9) + ')';
      for (i = 0; i < 7; i++) { a = P.seed * 3 + i * 0.9; c.beginPath(); c.arc(Math.cos(a) * R * (0.2 + (i % 3) * 0.2), Math.sin(a) * R * (0.2 + (i % 3) * 0.18), R * 0.07, 0, Math.PI * 2); c.fill(); }
      if (P.where === 'oven' && ck < 1.4) {
        c.fillStyle = 'rgba(255,250,210,0.8)';
        for (i = 0; i < 4; i++) {
          k = (globalT * 1.3 + i * 0.27) % 1;
          a = P.seed + i * 1.7;
          c.beginPath(); c.arc(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.4, R * 0.08 * Math.sin(k * Math.PI), 0, Math.PI * 2); c.fill();
        }
      }
    }
  } else {
    c.strokeStyle = '#ffe270';
    c.lineWidth = Math.max(1, R * 0.04);
    c.lineCap = 'round';
    c.beginPath();
    n = 0;
    for (i = 0; i < C.length; i++) {
      cell = C[i];
      k = P.cheese[cell.k];
      if (k <= 0) continue;
      n++;
      a = cell.s * 6;
      c.moveTo(cell.u * R, cell.v * R);
      c.lineTo(cell.u * R + Math.cos(a) * R * 0.12, cell.v * R + Math.sin(a) * R * 0.12);
      if (k > 0.4) { c.moveTo(cell.u * R + R * 0.06, cell.v * R - R * 0.06); c.lineTo(cell.u * R + R * 0.06 + Math.cos(a + 1.5) * R * 0.11, cell.v * R - R * 0.06 + Math.sin(a + 1.5) * R * 0.11); }
      if (k > 0.8) { c.moveTo(cell.u * R - R * 0.07, cell.v * R + R * 0.05); c.lineTo(cell.u * R - R * 0.07 + Math.cos(a + 3) * R * 0.1, cell.v * R + R * 0.05 + Math.sin(a + 3) * R * 0.1); }
    }
    if (n) c.stroke();
  }
  // Puolikas-tilaus auki: haalea keskiviiva
  half = !o.mini && pzzHalfOpen() && P.where !== 'table';
  if (half) {
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = Math.max(1.5, R * 0.035);
    c.beginPath();
    for (i = -5; i < 5; i++) { c.moveTo(0, i * R * 0.2); c.lineTo(0, i * R * 0.2 + R * 0.12); }
    c.stroke();
  }
  // Täytteet
  r = pzzTopR() * (R / pzz.L.R);
  for (i = 0; i < P.tops.length; i++) {
    a = P.tops[i];
    k = a.pop > 0 ? 1 + a.pop : 1;
    pzzDrawTop(c, a.type, a.u * R, a.v * R, r * k, a.rot);
  }
  // Viillot
  if (P.cuts) {
    c.lineCap = 'round';
    for (b = 0; b < 2; b++) {
      c.strokeStyle = b ? 'rgba(255,240,200,0.5)' : 'rgba(110,50,20,0.6)';
      c.lineWidth = Math.max(1, R * (b ? 0.015 : 0.04));
      c.beginPath();
      for (i = 0; i < P.cutAng.length; i++) {
        a = P.cutAng[i];
        c.moveTo(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99);
        c.lineTo(-Math.cos(a) * R * 0.99, -Math.sin(a) * R * 0.99);
      }
      c.stroke();
    }
    if (P.cutFlash > 0) {
      c.strokeStyle = 'rgba(255,255,255,' + (P.cutFlash * 1.6) + ')';
      c.lineWidth = R * 0.06;
      a = P.cutAng[P.cutAng.length - 1];
      c.beginPath(); c.moveTo(Math.cos(a) * R, Math.sin(a) * R); c.lineTo(-Math.cos(a) * R, -Math.sin(a) * R); c.stroke();
    }
  }
  // Hiiltynyt: mustat läikät
  if (P.q === 'char' || (P.where === 'oven' && pzzBakeK(P) >= 2)) {
    c.fillStyle = 'rgba(30,20,18,0.6)';
    for (i = 0; i < 6; i++) { a = i * 1.1 + P.seed; c.beginPath(); c.arc(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.16, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}
// Pala lautasella tai lennossa: kolmio, kuori ja muutama täyte
function pzzDrawSlice(c, P, x, y, r, rot, eaten) {
  var crust = pzzCrustCol(P), types = [], i, k = 1 - (eaten || 0);
  if (k <= 0.02) return;
  for (i = 0; i < P.tops.length && types.length < 2; i++) if (types.indexOf(P.tops[i].type) < 0) types.push(P.tops[i].type);
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  c.scale(k, k);
  c.beginPath();
  c.moveTo(0, r * 0.7);
  c.lineTo(-r * 0.62, -r * 0.55);
  c.quadraticCurveTo(0, -r * 0.85, r * 0.62, -r * 0.55);
  c.closePath();
  c.fillStyle = '#ffd060';
  c.fill();
  c.strokeStyle = '#c07a20';
  c.lineWidth = Math.max(1, r * 0.08);
  c.lineJoin = 'round';
  c.stroke();
  c.beginPath();
  c.moveTo(-r * 0.66, -r * 0.55);
  c.quadraticCurveTo(0, -r * 0.92, r * 0.66, -r * 0.55);
  c.strokeStyle = crust;
  c.lineWidth = r * 0.24;
  c.lineCap = 'round';
  c.stroke();
  c.fillStyle = 'rgba(210,58,40,0.55)';
  c.beginPath(); c.arc(-r * 0.15, -r * 0.2, r * 0.1, 0, Math.PI * 2); c.fill();
  for (i = 0; i < types.length; i++) pzzDrawTop(c, types[i], (i ? r * 0.18 : -r * 0.12), (i ? -r * 0.32 : r * 0.08), r * 0.24, 0);
  c.restore();
}
// Kuplan tilauspizza: täytteet kuvina (pics) tai yksi kuva per laji
function pzzDrawOrderPizza(c, o, x, y, r, m, pulse) {
  var i, j, e, list, spots, k, sx, side, cnt, rr = r * 0.24;
  artCircle(c, x, y, r, PZZ_COLS.gold, { lineColor: '#9a5a1a', flat: true });
  artCircle(c, x, y, r * 0.84, '#d23a28', { line: false, flat: true });
  pzzBlobPath(c, r * 0.78, 1, 14);
  c.save(); c.translate(x, y); c.fillStyle = '#ffd060'; c.fill(); c.restore();
  if (o.kind === 'half') {
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(1.5, r * 0.06);
    c.beginPath();
    for (i = -4; i < 4; i++) { c.moveTo(x, y + i * r * 0.25); c.lineTo(x, y + i * r * 0.25 + r * 0.14); }
    c.stroke();
  }
  for (i = 0; i < o.tops.length; i++) {
    e = o.tops[i];
    if (m && (m.part === 'top' || m.part === 'extra') && m.i === i) {
      side = e.side;
      c.fillStyle = 'rgba(255,90,90,' + (0.25 + pulse * 0.35) + ')';
      c.beginPath();
      if (side) { c.moveTo(x, y - r); c.arc(x, y, r * 1.08, -Math.PI / 2, Math.PI / 2, side < 0); c.closePath(); }
      else c.arc(x, y, r * 1.08, 0, Math.PI * 2);
      c.fill();
    }
  }
  for (i = 0; i < o.tops.length; i++) {
    e = o.tops[i];
    if (!o.pics) {
      // Numerot: yksi kuva puolikkaan tai pizzan keskelle
      if (e.side) pzzDrawTop(c, e.type, x + e.side * r * 0.45, y, rr * 1.5, 0);
      else pzzDrawTop(c, e.type, x + (o.tops.length > 1 ? (i ? 1 : -1) * r * 0.38 : 0), y, rr * 1.5, 0);
      continue;
    }
    spots = [];
    for (j = 0; j < PZZ_SPOTS.length; j++) {
      sx = PZZ_SPOTS[j][0];
      if (e.side && sx * e.side < 0.2) continue;
      spots.push(PZZ_SPOTS[j]);
    }
    // Kaksi lajia ilman puolia: vuorotellen eri paikoista
    cnt = 0;
    for (j = 0; j < spots.length && cnt < e.n; j++) {
      if (!e.side && o.tops.length > 1 && (j % 2) !== i) continue;
      k = spots[j];
      pzzDrawTop(c, e.type, x + k[0] * r, y + k[1] * r, rr, 0);
      cnt++;
    }
  }
}

// ---------- Piirto: työkalut ----------
function pzzDrawPin(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artLimb(c, -s * 1.25, 0, -s * 0.8, 0, s * 0.16, '#c88a4a', '#7a4a20');
  artLimb(c, s * 0.8, 0, s * 1.25, 0, s * 0.16, '#c88a4a', '#7a4a20');
  artRoundRect(c, -s * 0.85, -s * 0.2, s * 1.7, s * 0.4, s * 0.18, '#f0c890', { lineColor: '#8a5a2a', hi: 0.4 });
  c.strokeStyle = 'rgba(138,90,42,0.3)';
  c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.moveTo(-s * 0.6, -s * 0.05); c.lineTo(s * 0.6, -s * 0.05); c.stroke();
  c.restore();
}
function pzzDrawLadle(c, x, y, s, full) {
  // (x, y) = kauhan kupin keskikohta; varsi ylös oikealle
  artLimb(c, x + s * 0.3, y - s * 0.2, x + s * 0.95, y - s * 1.3, s * 0.13, '#d8d0e8', '#7a7090');
  artCircle(c, x + s * 0.98, y - s * 1.35, s * 0.1, '#ff9ec6', { lineColor: '#9a4a6a' });
  pzzEll(c, x, y, s * 0.42, s * 0.3);
  artFillPath(c, '#d8d0e8', y - s * 0.3, y + s * 0.3, s * 0.4, { lineColor: '#7a7090' });
  if (full) { pzzEll(c, x, y - s * 0.04, s * 0.32, s * 0.18); c.fillStyle = '#d23a28'; c.fill(); }
}
function pzzDrawSauceBowl(c, x, y, s) {
  artShadow(c, x, y, s * 0.95, s * 0.2, 0.18);
  c.beginPath();
  c.moveTo(x - s * 0.85, y - s * 0.55);
  c.quadraticCurveTo(x - s * 0.8, y + s * 0.05, x, y + s * 0.05);
  c.quadraticCurveTo(x + s * 0.8, y + s * 0.05, x + s * 0.85, y - s * 0.55);
  c.closePath();
  artFillPath(c, '#5fa8d8', y - s * 0.55, y + s * 0.05, s, { lineColor: '#2a5a8a' });
  pzzEll(c, x, y - s * 0.55, s * 0.85, s * 0.2);
  artFillPath(c, '#8ac8f0', y - s * 0.75, y - s * 0.35, s, { lineColor: '#2a5a8a' });
  pzzEll(c, x, y - s * 0.55, s * 0.7, s * 0.14);
  c.fillStyle = '#d23a28';
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(x - s * 0.5 + i * s * 0.45, y - s * 0.28, s * 0.06, 0, Math.PI * 2); c.fill(); }
}
function pzzDrawBag(c, x, y, s, tilt, open) {
  // (x, y) = pussin suu (raaste valuu tästä)
  c.save();
  c.translate(x, y);
  c.rotate(tilt || 0);
  c.beginPath();
  c.moveTo(-s * 0.5, -s * 1.4);
  c.lineTo(s * 0.5, -s * 1.4);
  c.lineTo(s * 0.55, -s * 0.3);
  c.quadraticCurveTo(s * 0.2, -s * 0.05, s * 0.08, 0);
  c.lineTo(-s * 0.08, 0);
  c.quadraticCurveTo(-s * 0.2, -s * 0.05, -s * 0.55, -s * 0.3);
  c.closePath();
  artFillPath(c, '#fff4d8', -s * 1.4, 0, s, { lineColor: '#a08050', shadeTo: '#f0dcb0' });
  // Juustokuva: keltainen kolmio reikineen
  c.beginPath(); c.moveTo(-s * 0.3, -s * 0.55); c.lineTo(s * 0.32, -s * 0.55); c.lineTo(s * 0.32, -s * 1.0); c.closePath();
  artFillPath(c, '#ffd84a', -s * 1.0, -s * 0.55, s * 0.3, { lineColor: '#c08010', line: Math.max(1, s * 0.05) });
  c.fillStyle = '#e8b030';
  c.beginPath(); c.arc(s * 0.14, -s * 0.66, s * 0.06, 0, Math.PI * 2); c.arc(s * 0.24, -s * 0.82, s * 0.04, 0, Math.PI * 2); c.fill();
  artRoundRect(c, -s * 0.56, -s * 1.5, s * 1.12, s * 0.16, s * 0.06, '#ff8fb8', { lineColor: '#b0507a' });
  if (open) { c.fillStyle = '#ffe270'; c.fillRect(-s * 0.06, -s * 0.02, s * 0.12, s * 0.06); }
  c.restore();
}
function pzzDrawCutter(c, x, y, s, spin) {
  // (x, y) = terän keskikohta; kahva vasemmalle ylös
  var i, a;
  artLimb(c, x - s * 0.2, y - s * 0.15, x - s * 1.0, y - s * 0.9, s * 0.24, '#ff7a4a', '#a0402a');
  artCircle(c, x, y, s * 0.55, '#e8eef4', { lineColor: '#6a7a8a', hi: 0.5 });
  c.strokeStyle = '#8a9aaa';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath();
  for (i = 0; i < 3; i++) { a = spin + i * Math.PI / 3; c.moveTo(x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.42); c.lineTo(x - Math.cos(a) * s * 0.42, y - Math.sin(a) * s * 0.42); }
  c.stroke();
  artCircle(c, x, y, s * 0.12, '#ff7a4a', { lineColor: '#a0402a' });
}
function pzzDrawDoughBowl(c, x, y, s, n) {
  var i;
  artShadow(c, x, y, s * 1.0, s * 0.2, 0.18);
  for (i = 0; i < n; i++) artCircle(c, x + (i - (n - 1) / 2) * s * 0.42, y - s * 0.58 - (i % 2) * s * 0.12, s * 0.3, PZZ_DOUGH, { lineColor: '#c8a06a', hi: 0.45 });
  c.beginPath();
  c.moveTo(x - s * 0.9, y - s * 0.5);
  c.quadraticCurveTo(x - s * 0.85, y + s * 0.05, x, y + s * 0.05);
  c.quadraticCurveTo(x + s * 0.85, y + s * 0.05, x + s * 0.9, y - s * 0.5);
  c.closePath();
  artFillPath(c, '#ffb0c8', y - s * 0.5, y + s * 0.05, s, { lineColor: '#b0507a' });
  c.fillStyle = 'rgba(255,255,255,0.7)';
  for (i = 0; i < 4; i++) { c.beginPath(); c.arc(x - s * 0.55 + i * s * 0.37, y - s * 0.25, s * 0.06, 0, Math.PI * 2); c.fill(); }
}
function pzzDrawLog(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artRoundRect(c, -s, -s * 0.28, s * 2, s * 0.56, s * 0.26, '#a8683a', { lineColor: '#5a3014' });
  artCircle(c, s * 0.82, 0, s * 0.26, '#f0c890', { lineColor: '#5a3014', flat: true });
  c.strokeStyle = '#b0804a';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.arc(s * 0.82, 0, s * 0.13, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = 'rgba(90,48,20,0.4)';
  c.beginPath(); c.moveTo(-s * 0.7, -s * 0.08); c.lineTo(s * 0.3, -s * 0.08); c.moveTo(-s * 0.4, s * 0.1); c.lineTo(s * 0.5, s * 0.1); c.stroke();
  c.restore();
}

// ---------- Piirto: hylly ----------
function pzzDrawBowls(c) {
  var L = pzz.L, u = L.u, i, x, y, k, open, n = PZZ_BOWLS[pzz.ph], s = Math.min(u * 0.045, L.bowlW * 0.45), j, type;
  for (i = 0; i < 6; i++) {
    x = L.bowls[i].x;
    y = L.bowls[i].y;
    open = i < n;
    type = PZZ_TOPS[i];
    k = open && i >= PZZ_BOWLS[0] && pzz.bowlsK < 1 ? easeOutBack(pzz.bowlsK) : 1;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    if (open) {
      // Kasa täytettä kulhossa
      for (j = 0; j < 4; j++) pzzDrawTop(c, type, (j - 1.5) * s * 0.42, -s * 0.62 - (j % 2) * s * 0.22, s * 0.36, j * 0.7);
      pzzDrawTop(c, type, 0, -s * 0.95, s * 0.4, 0.3);
    }
    c.beginPath();
    c.moveTo(-s, -s * 0.6);
    c.quadraticCurveTo(-s * 0.95, 0, 0, 0);
    c.quadraticCurveTo(s * 0.95, 0, s, -s * 0.6);
    c.closePath();
    artFillPath(c, open ? '#e8845a' : '#d8b8a0', -s * 0.6, 0, s, { lineColor: '#8a3a1a' });
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = Math.max(1, s * 0.07);
    c.beginPath(); c.moveTo(-s * 0.7, -s * 0.36); c.quadraticCurveTo(0, -s * 0.16, s * 0.7, -s * 0.36); c.stroke();
    if (!open) {
      // Liinalla peitetty (aukeaa päivällä)
      c.beginPath(); c.moveTo(-s * 1.05, -s * 0.6); c.quadraticCurveTo(0, -s * 1.1, s * 1.05, -s * 0.6); c.closePath();
      artFillPath(c, '#fff4f0', -s * 1.0, -s * 0.6, s, { lineColor: '#c06a5a' });
      c.fillStyle = 'rgba(224,68,62,0.5)';
      for (j = -1; j <= 1; j++) c.fillRect(j * s * 0.4 - s * 0.1, -s * 0.85, s * 0.2, s * 0.22);
    }
    c.restore();
  }
}

// ---------- Uuni ----------
// Kupoli, savupiippu ja puupinon syvennys piirretään kerran omaan kuvaansa;
// tuli, pizzat ja kokkipupu (kupolin takana) piirretään joka ruudulla.
function pzzRenderOven() {
  var L = pzz.L, u = L.u, H = L.H, w = Math.ceil(u * 0.44), cv, b, i, j, x, y, a, rx = L.ovenR, ry = u * 0.21, oy = L.ovenY, ox = L.ovenX, mw = L.mouthW, mh = L.mouthH;
  if (typeof document === 'undefined' || !document.createElement) return;
  if (!pzz.ovenCv) pzz.ovenCv = document.createElement('canvas');
  cv = pzz.ovenCv;
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, Math.ceil(H));
  b = cv.getContext('2d');
  if (!b || !b.clearRect) return;
  b.clearRect(0, 0, cv.width, cv.height);
  // Savupiippu
  x = ox - u * 0.085;
  artRoundRect(b, x, -u * 0.02, u * 0.07, oy - ry + u * 0.05, u * 0.01, '#c86a44', { lineColor: '#7a3418' });
  b.strokeStyle = 'rgba(122,52,24,0.35)';
  b.lineWidth = Math.max(1, u * 0.003);
  for (y = u * 0.03; y < oy - ry; y += u * 0.03) { b.beginPath(); b.moveTo(x, y); b.lineTo(x + u * 0.07, y); b.stroke(); }
  // Pohja ja hylly
  artRoundRect(b, ox - rx - u * 0.012, oy - u * 0.005, rx * 2 + u * 0.024, u * 0.055, u * 0.012, '#e0b088', { lineColor: '#7a4a2a' });
  // Syvennys puille ja kissalle
  artRoundRect(b, ox - rx + u * 0.005, oy + u * 0.045, rx * 2 - u * 0.01, H * 0.985 - oy - u * 0.045, u * 0.02, '#c86a44', { lineColor: '#7a3418' });
  artRoundRect(b, ox - rx + u * 0.025, oy + u * 0.07, rx * 2 - u * 0.05, H * 0.985 - oy - u * 0.07, u * 0.03, '#5a2a1a', { line: false, flat: true });
  // Puupino syvennyksen vasemmalla
  for (j = 0; j < 3; j++) {
    for (i = 0; i < 3 - j; i++) {
      x = L.pile.x + (i - (2 - j) / 2) * u * 0.05;
      y = L.pile.y - u * 0.012 - j * u * 0.036;
      artCircle(b, x, y, u * 0.022, '#a8683a', { lineColor: '#4a2810' });
      artCircle(b, x, y, u * 0.013, '#f0c890', { line: false, flat: true });
      b.strokeStyle = '#b0804a';
      b.lineWidth = Math.max(1, u * 0.002);
      b.beginPath(); b.arc(x, y, u * 0.007, 0, Math.PI * 2); b.stroke();
    }
  }
  // Kupoli tiilineen
  b.beginPath();
  b.moveTo(ox - rx, oy);
  if (b.ellipse) b.ellipse(ox, oy, rx, ry, 0, Math.PI, 0, false); else b.arc(ox, oy, rx, Math.PI, 0, false);
  b.closePath();
  artFillPath(b, '#e07a4c', oy - ry, oy, rx, { lineColor: '#7a3418' });
  b.save();
  b.clip();
  b.strokeStyle = 'rgba(255,220,190,0.35)';
  b.lineWidth = Math.max(1, u * 0.004);
  for (j = 0; j < 6; j++) {
    y = oy - j * ry / 6;
    b.beginPath(); b.moveTo(ox - rx, y); b.lineTo(ox + rx, y); b.stroke();
    for (i = -4; i <= 4; i++) {
      x = ox + (i + (j % 2) * 0.5) * u * 0.05;
      b.beginPath(); b.moveTo(x, y); b.lineTo(x, y - ry / 6); b.stroke();
    }
  }
  b.restore();
  artHighlight(b, ox - rx * 0.45, oy - ry * 0.7, rx * 0.25, ry * 0.12, 0.25);
  // Uunin suu: kaari, jonka sisällä tuli palaa
  b.beginPath();
  b.moveTo(ox - mw / 2, oy);
  b.lineTo(ox - mw / 2, oy - mh * 0.45);
  b.quadraticCurveTo(ox - mw / 2, oy - mh, ox, oy - mh);
  b.quadraticCurveTo(ox + mw / 2, oy - mh, ox + mw / 2, oy - mh * 0.45);
  b.lineTo(ox + mw / 2, oy);
  b.closePath();
  b.fillStyle = '#2a1410';
  b.fill();
  b.strokeStyle = '#f0c8a0';
  b.lineWidth = Math.max(3, u * 0.016);
  b.stroke();
  b.strokeStyle = '#7a3418';
  b.lineWidth = Math.max(1, u * 0.004);
  b.stroke();
  // Kaaren tiilet
  for (i = 0; i <= 8; i++) {
    a = Math.PI + i / 8 * Math.PI;
    x = ox + Math.cos(a) * mw * 0.56;
    y = oy - mh * 0.45 + Math.sin(a) * mh * 0.62;
    artRoundRect(b, x - u * 0.012, y - u * 0.01, u * 0.024, u * 0.02, u * 0.005, '#f4d0a8', { lineColor: '#8a4a2a' });
  }
}
function pzzFlame(c, x, y, w, h, col, inner) {
  c.beginPath();
  c.moveTo(x - w, y);
  c.quadraticCurveTo(x - w * 0.9, y - h * 0.55, x, y - h);
  c.quadraticCurveTo(x + w * 0.9, y - h * 0.55, x + w, y);
  c.closePath();
  c.fillStyle = col;
  c.fill();
  if (inner) {
    c.beginPath();
    c.moveTo(x - w * 0.5, y);
    c.quadraticCurveTo(x - w * 0.45, y - h * 0.35, x, y - h * 0.6);
    c.quadraticCurveTo(x + w * 0.45, y - h * 0.35, x + w * 0.5, y);
    c.closePath();
    c.fillStyle = inner;
    c.fill();
  }
}
function pzzDrawOvenFire(c) {
  var L = pzz.L, u = L.u, ox = L.ovenX, oy = L.ovenY, mw = L.mouthW, mh = L.mouthH, i, n = 7, f = pzz.fuel, low = pzzFireLow(), h, x, k, roar = pzz.roarT > 0 ? pzz.roarT : 0;
  c.save();
  c.beginPath();
  c.moveTo(ox - mw / 2, oy);
  c.lineTo(ox - mw / 2, oy - mh * 0.45);
  c.quadraticCurveTo(ox - mw / 2, oy - mh, ox, oy - mh);
  c.quadraticCurveTo(ox + mw / 2, oy - mh, ox + mw / 2, oy - mh * 0.45);
  c.lineTo(ox + mw / 2, oy);
  c.closePath();
  c.clip();
  artGlow(c, ox, oy - mh * 0.3, mw * 0.7, low ? '#6a8aff' : '#ff8a3a', low ? 0.35 : 0.55 + roar * 0.3 + Math.sin(globalT * 9) * 0.05);
  // Liekit takaseinällä: korkeus polttopuun mukaan, sinisiä hiipuessa
  for (i = 0; i < n; i++) {
    x = ox + (i - (n - 1) / 2) * mw / n * 0.95;
    k = Math.sin(globalT * (7 + i) + i * 1.7) * 0.18 + 0.82;
    h = mh * (low ? 0.22 + f * 0.6 : 0.42 + f * 0.4 + roar * 0.35) * k;
    pzzFlame(c, x, oy - mh * 0.08, mw / n * 0.62, h, low ? '#5a7aff' : (i % 2 ? '#ff7a2a' : '#ff9a3a'), low ? '#b8d0ff' : '#ffe27a');
  }
  // Hehkuvat hiillos
  for (i = 0; i < 9; i++) artCircle(c, ox + (i - 4) * mw * 0.1, oy - mh * 0.06, u * 0.008, low ? '#8a5aa0' : '#ffb040', { line: false, flat: true });
  c.restore();
}
function pzzDrawOvenPizzas(c) {
  var L = pzz.L, u = L.u, i, P, s, k, gl, rx, ry, sc;
  for (i = 0; i < PZZ_SLOTS[pzz.ph]; i++) {
    s = pzzSlotPos(i);
    P = pzz.oven[i];
    sc = i === 1 && pzz.slotsK < 1 ? easeOutBack(pzz.slotsK) : 1;
    rx = L.R * 0.68 * sc;
    ry = rx * 0.42;
    // Paikan merkki arinalla
    pzzEll(c, s.x, s.y + ry * 0.2, rx * 1.05, ry * 1.05);
    c.fillStyle = 'rgba(255,200,120,0.18)';
    c.fill();
    if (!P || P.where !== 'oven') continue;
    k = pzzBakeK(P);
    // Ennakkorengas: kasvaa paistuessa, kultainen ikkunassa, punainen myöhässä
    c.lineCap = 'round';
    if (k < 1) {
      c.strokeStyle = 'rgba(255,255,255,0.45)';
      c.lineWidth = Math.max(2, u * 0.006);
      pzzEll(c, s.x, s.y, rx * 1.28, ry * 1.6);
      c.stroke();
      c.strokeStyle = artMix('#ffe6a0', '#ffc030', k);
      c.lineWidth = Math.max(3, u * 0.01);
      c.beginPath();
      if (c.ellipse) c.ellipse(s.x, s.y, rx * 1.28, ry * 1.6, 0, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2, false);
      c.stroke();
    } else if (k <= 1) {
      gl = pzzGoldLeft(P);
      artGlow(c, s.x, s.y, rx * 1.9, '#ffe27a', 0.5 + Math.sin(globalT * 14) * 0.15);
      c.strokeStyle = '#ffd24f';
      c.lineWidth = Math.max(4, u * (0.009 + gl * 0.009));
      c.beginPath();
      if (c.ellipse) c.ellipse(s.x, s.y, rx * 1.28, ry * 1.6, 0, -Math.PI / 2, -Math.PI / 2 + gl * Math.PI * 2, false);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = Math.max(1.5, u * 0.003);
      c.stroke();
    } else if (k < 2) {
      c.strokeStyle = 'rgba(230,110,60,' + (0.5 + Math.sin(globalT * 10) * 0.35) + ')';
      c.lineWidth = Math.max(3, u * 0.008);
      pzzEll(c, s.x, s.y, rx * 1.28, ry * 1.6);
      c.stroke();
    }
    if (P.ringT > 0) artGlow(c, s.x, s.y, rx * 2, '#fff2a0', P.ringT);
    pzzDrawPizza(c, P, s.x, s.y, L.R * 0.68 * sc, { sq: 0.42, mini: true });
  }
}

// ---------- Laudat ja työkalut ----------
function pzzDrawBoard(c, i) {
  var L = pzz.L, b = L.boards[i], B = pzz.boards[i], r = L.boardR, u = L.u;
  c.save();
  c.translate(b.x, b.y);
  if (B.wob > 0) c.rotate(Math.sin(B.wob * 40) * 0.03);
  if (B.pop > 0) artSquash(c, Math.sin(B.pop / 0.3 * Math.PI) * 0.05);
  artShadow(c, 0, r * PZZ_SQ * 0.3, r * 1.1, r * 0.5, 0.18);
  artLimb(c, -r * 0.62, r * 0.58, -r * 0.95, r * 0.95, u * 0.03, '#d8a060', '#7a4a20');
  pzzEll(c, 0, u * 0.008, r, r * PZZ_SQ);
  artFillPath(c, '#b8783a', -r, r, r, { lineColor: '#6a3a14' });
  pzzEll(c, 0, 0, r, r * PZZ_SQ);
  artFillPath(c, '#e8b878', -r, r, r, { lineColor: '#7a4a20' });
  c.strokeStyle = 'rgba(150,90,40,0.22)';
  c.lineWidth = Math.max(1, u * 0.003);
  pzzEll(c, 0, 0, r * 0.75, r * 0.75 * PZZ_SQ); c.stroke();
  pzzEll(c, 0, 0, r * 0.5, r * 0.5 * PZZ_SQ); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.beginPath(); c.arc(-r * 0.4, -r * 0.3, r * 0.05, 0, Math.PI * 2); c.arc(r * 0.3, r * 0.25, r * 0.04, 0, Math.PI * 2); c.fill();
  c.restore();
}
function pzzToolPos(name, home) {
  var f = pzz.toolFly[name], k;
  if (!f) return home;
  k = easeOutCubic(f.t / 0.35);
  return { x: f.x0 + (home.x - f.x0) * k, y: f.y0 + (home.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.04 };
}
function pzzWig(name) { var n = pzz.nudge[name]; return n > 0 ? Math.sin(n * 30) * 0.18 * Math.min(1, n * 2) : 0; }
function pzzDrawTools(c) {
  var L = pzz.L, u = L.u, d = pzz.drag, p, s = u * 0.045, w;
  // Roskis
  pzzDrawBin(c);
  // Taikinakulho (pallo lähtee kulhosta, kulhossa riittää)
  p = L.doughBowl;
  c.save(); c.translate(p.x, p.y); c.rotate(pzzWig('dough')); pzzDrawDoughBowl(c, 0, 0, u * 0.05, d && d.kind === 'ball' ? 2 : 3); c.restore();
  // Kaulin
  if (!(d && d.kind === 'pin')) {
    p = pzzToolPos('pin', L.pin);
    w = pzzWig('pin');
    if (w) artGlow(c, p.x, p.y, u * 0.08, '#ffffff', 0.5);
    pzzDrawPin(c, p.x, p.y, u * 0.05, -0.15 + w);
  }
  // Kastikekulho ja kauha
  p = L.sauce;
  pzzDrawSauceBowl(c, p.x, p.y, u * 0.05);
  if (!(d && d.kind === 'ladle')) {
    p = pzzToolPos('ladle', { x: L.sauce.x, y: L.sauce.y - u * 0.035 });
    w = pzzWig('ladle');
    if (w) artGlow(c, p.x, p.y - u * 0.02, u * 0.08, '#ffffff', 0.5);
    c.save(); c.translate(p.x, p.y); c.rotate(w); pzzDrawLadle(c, 0, 0, s, true); c.restore();
  }
  // Juustopussi
  if (!(d && d.kind === 'bag')) {
    p = pzzToolPos('bag', { x: L.cheese.x, y: L.cheese.y + u * 0.02 });
    w = pzzWig('bag');
    if (w) artGlow(c, p.x, p.y - u * 0.04, u * 0.08, '#ffffff', 0.5);
    artShadow(c, p.x, p.y, u * 0.035, u * 0.01, 0.18);
    pzzDrawBag(c, p.x, p.y, u * 0.052, w, false);
  }
  // Leikkuri
  if (!(d && d.kind === 'cutter')) {
    p = pzzToolPos('cutter', L.cutter);
    w = pzzWig('cutter');
    if (w) artGlow(c, p.x, p.y, u * 0.08, '#ffffff', 0.5);
    c.save(); c.translate(p.x, p.y); c.rotate(w * 2); pzzDrawCutter(c, u * 0.015, u * 0.01, u * 0.05, 0); c.restore();
  }
  // Lentävä taikinapallo kulhoon ja halko pinoon
  if (pzz.toolFly.ball) { p = pzzToolPos('ball', { x: L.doughBowl.x, y: L.doughBowl.y - u * 0.04 }); artCircle(c, p.x, p.y, u * 0.03, PZZ_DOUGH, { lineColor: '#c8a06a', hi: 0.4 }); }
  if (pzz.toolFly.log) { p = pzzToolPos('log', { x: L.pile.x, y: L.pile.y - u * 0.04 }); pzzDrawLog(c, p.x, p.y, u * 0.035, 0.3); }
  if (pzz.nudge.oven > 0) artGlow(c, L.ovenX, L.ovenY - L.mouthH * 0.5, L.mouthW * 0.7, '#ffffff', pzz.nudge.oven * 0.5);
}
function pzzDrawBin(c) {
  var b = pzz.L.bin, u = pzz.L.u, op = pzz.binT > 0 ? Math.sin(pzz.binT / 0.6 * Math.PI) : 0, d = pzz.drag, hl = d && (d.kind === 'pizza' || d.kind === 'top');
  if (hl) artGlow(c, b.x, b.y - u * 0.05, u * 0.09, '#ffffff', 0.4);
  artShadow(c, b.x, b.y, u * 0.055, u * 0.014, 0.2);
  c.beginPath(); c.moveTo(b.x - u * 0.045, b.y - u * 0.095); c.lineTo(b.x + u * 0.045, b.y - u * 0.095); c.lineTo(b.x + u * 0.036, b.y); c.lineTo(b.x - u * 0.036, b.y); c.closePath();
  artFillPath(c, '#9fd0a0', b.y - u * 0.095, b.y, u * 0.05, { lineColor: '#3a7a3a' });
  c.strokeStyle = 'rgba(58,122,58,0.4)';
  c.lineWidth = Math.max(1, u * 0.003);
  c.beginPath(); c.moveTo(b.x - u * 0.014, b.y - u * 0.08); c.lineTo(b.x - u * 0.012, b.y - u * 0.01); c.moveTo(b.x + u * 0.014, b.y - u * 0.08); c.lineTo(b.x + u * 0.012, b.y - u * 0.01); c.stroke();
  c.save();
  c.translate(b.x - u * 0.048, b.y - u * 0.095);
  c.rotate(-op * 0.7 - (hl ? 0.15 : 0));
  artRoundRect(c, 0, -u * 0.013, u * 0.096, u * 0.017, u * 0.008, '#80c080', { lineColor: '#3a7a3a' });
  artCircle(c, u * 0.048, -u * 0.017, u * 0.008, '#ff9ec6', { lineColor: '#3a7a3a' });
  c.restore();
}

// ---------- Pöydät, syöjät ja koira ----------
function pzzRenderTable() {
  var L = pzz.L, u = L.u, w = Math.ceil(L.tableW + u * 0.04), h = Math.ceil(u * 0.1), cv, b, i, cw, x0;
  if (typeof document === 'undefined' || !document.createElement) return;
  if (!pzz.tableCv) pzz.tableCv = document.createElement('canvas');
  cv = pzz.tableCv;
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, h);
  b = cv.getContext('2d');
  if (!b || !b.clearRect) return;
  b.clearRect(0, 0, w, h);
  x0 = u * 0.02;
  // Pöytäliina: punavalkoinen ruutu
  roundRect(b, x0, u * 0.008, L.tableW, u * 0.075, u * 0.014);
  b.fillStyle = '#fff6f0';
  b.fill();
  b.save();
  b.clip();
  cw = u * 0.025;
  b.fillStyle = 'rgba(224,68,62,0.5)';
  for (i = 0; i * cw < L.tableW; i++) b.fillRect(x0 + i * cw, u * 0.008, cw * 0.5, u * 0.075);
  b.fillStyle = 'rgba(224,68,62,0.35)';
  for (i = 0; i * cw < u * 0.075; i++) b.fillRect(x0, u * 0.008 + i * cw, L.tableW, cw * 0.5);
  b.restore();
  roundRect(b, x0, u * 0.008, L.tableW, u * 0.075, u * 0.014);
  b.strokeStyle = '#a0403a';
  b.lineWidth = Math.max(1.5, u * 0.004);
  b.stroke();
  // Pöydän pinta
  roundRect(b, x0 - u * 0.006, 0, L.tableW + u * 0.012, u * 0.026, u * 0.012);
  b.fillStyle = '#fffaf4';
  b.fill();
  b.stroke();
}
function pzzDrawEater(c, x, y, s, o) {
  var t = o.t, i, ear, mood = o.mood, blink = ((t * 0.9) % 3.4) < 0.12, col = o.tint || '#ffffff', line = o.tint ? artShade(o.tint, -0.4) : BUNNY_LINE;
  // Korvat
  for (i = -1; i <= 1; i += 2) {
    ear = i * (0.22 + Math.sin(t * 2 + i) * 0.05) + (mood === 'sad' ? i * 0.5 : 0);
    c.save();
    c.translate(x + i * s * 0.42, y - s * 0.75);
    c.rotate(ear);
    artBlob(c, 0, -s * 0.55, s * 0.24, s * 0.62, col, { lineColor: line, flat: true });
    artBlob(c, 0, -s * 0.52, s * 0.11, s * 0.42, '#ffc4dd', { line: false, flat: true });
    c.restore();
  }
  artCircle(c, x, y, s, col, { lineColor: line, flat: true });
  artHighlight(c, x - s * 0.38, y - s * 0.45, s * 0.26, s * 0.14, 0.5);
  // Asuste
  if (o.acc === 1) {
    artBlob(c, x - s * 0.62, y - s * 0.78, s * 0.24, s * 0.16, '#ff6f9a', { lineColor: '#a03a5a', rot: 0.5, flat: true });
    artBlob(c, x - s * 0.3, y - s * 0.95, s * 0.24, s * 0.16, '#ff6f9a', { lineColor: '#a03a5a', rot: -0.5, flat: true });
    artCircle(c, x - s * 0.46, y - s * 0.86, s * 0.1, '#ffb0c8', { lineColor: '#a03a5a', flat: true });
  } else if (o.acc === 2) {
    artBlob(c, x + s * 0.1, y - s * 0.85, s * 0.72, s * 0.22, '#5a6ad8', { lineColor: '#2a3a8a', rot: -0.15, flat: true });
    artCircle(c, x + s * 0.12, y - s * 1.05, s * 0.09, '#5a6ad8', { lineColor: '#2a3a8a', flat: true });
  } else if (o.acc === 3) {
    artCircle(c, x + s * 0.5, y - s * 0.75, s * 0.2, '#ffe27a', { lineColor: '#c09020', flat: true });
    artCircle(c, x + s * 0.5, y - s * 0.75, s * 0.08, '#ff8a3a', { line: false, flat: true });
  }
  // Kasvot
  if (mood === 'happy' && o.squint) {
    c.strokeStyle = '#4a3a5a';
    c.lineWidth = Math.max(1.2, s * 0.1);
    c.lineCap = 'round';
    c.beginPath();
    for (i = -1; i <= 1; i += 2) c.arc(x + i * s * 0.36, y - s * 0.02, s * 0.14, 1.15 * Math.PI, 1.85 * Math.PI);
    c.stroke();
  } else {
    artEye(c, x - s * 0.36, y - s * 0.08, s * 0.16, o.look || 0, blink);
    artEye(c, x + s * 0.36, y - s * 0.08, s * 0.16, o.look || 0, blink);
  }
  if (o.acc === 4) {
    c.strokeStyle = '#3a3a5a';
    c.lineWidth = Math.max(1, s * 0.07);
    c.beginPath(); c.arc(x - s * 0.36, y - s * 0.08, s * 0.24, 0, Math.PI * 2); c.moveTo(x + s * 0.6, y - s * 0.08); c.arc(x + s * 0.36, y - s * 0.08, s * 0.24, 0, Math.PI * 2); c.moveTo(x - s * 0.12, y - s * 0.1); c.lineTo(x + s * 0.12, y - s * 0.1); c.stroke();
  }
  artBlush(c, x - s * 0.58, y + s * 0.22, s * 0.16);
  artBlush(c, x + s * 0.58, y + s * 0.22, s * 0.16);
  c.fillStyle = '#ff8fbe';
  c.beginPath(); c.arc(x, y + s * 0.16, s * 0.1, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a4a6a';
  c.lineWidth = Math.max(1, s * 0.07);
  c.lineCap = 'round';
  c.beginPath();
  if (mood === 'sad') {
    c.arc(x, y + s * 0.5, s * 0.16, 1.15 * Math.PI, 1.85 * Math.PI);
    c.stroke();
    artBlob(c, x - s * 0.4, y + s * 0.15 + ((t * 0.8) % 1) * s * 0.4, s * 0.08, s * 0.12, '#9fd0ff', { lineColor: '#5a90d0', line: Math.max(1, s * 0.03), flat: true });
  } else if (mood === 'munch') {
    c.arc(x, y + s * 0.34, s * (0.08 + Math.abs(Math.sin(t * 16)) * 0.1), 0, Math.PI * 2);
    c.fillStyle = '#c45a7a';
    c.fill();
    c.stroke();
  } else if (mood === 'wow') {
    artBlob(c, x, y + s * 0.38, s * 0.11, s * 0.14, '#c45a7a', { lineColor: '#8a4a6a', line: Math.max(1, s * 0.05), flat: true });
  } else {
    c.moveTo(x - s * 0.18, y + s * 0.28);
    c.quadraticCurveTo(x, y + s * 0.48, x + s * 0.18, y + s * 0.28);
    c.stroke();
  }
}
// Seurue pöydän takana: tuolit, syöjät, sitten pöytä, lautaset ja pizza
function pzzDrawGroupBack(c, g, leaving) {
  var L = pzz.L, u = L.u, T = L.tables[g.ti], i, p, x, y, s = u * 0.024, mood, hop, k, sh;
  sh = g.shakeT > 0 ? Math.sin(g.shakeT * 30) * u * 0.006 : 0;
  for (i = 0; i < g.pups.length; i++) {
    p = g.pups[i];
    x = p.x + sh;
    if (x > L.W + u * 0.08) continue;
    hop = p.hop > 0 ? Math.sin(p.hop / 0.45 * Math.PI) * u * 0.02 : 0;
    // Hyppii paikalleen tai pois
    if ((g.state === 'enter' && Math.abs(p.x - p.tx) > 1) || leaving) hop += Math.abs(Math.sin((g.t + p.seed) * 9)) * u * 0.03;
    y = T.y - u * 0.045 - hop + Math.sin(g.t * 2 + p.seed) * u * 0.002;
    if (g.sits && g.state === 'wait') y += u * 0.008;
    mood = 'happy';
    if (p.sad > 0 || (g.sits && g.state === 'wait') || g.shakeT > 0) mood = 'sad';
    else if (p.munch > 0) mood = 'munch';
    else if (g.state === 'eat' && !p.got) mood = 'wow';
    if (!leaving && Math.abs(p.x - p.tx) < 2) artRoundRect(c, p.tx - u * 0.022, T.y - u * 0.085, u * 0.044, u * 0.09, u * 0.018, '#c88a4a', { lineColor: '#6a3a14', flat: true });
    pzzDrawEater(c, x, y, s, { t: g.t + p.seed, mood: mood, tint: p.tint, acc: p.acc, squint: g.joyT > 0 || p.wave > 0, look: g.state === 'wait' ? -0.4 : 0 });
    if (p.wave > 0 || (g.joyT > 0 && i % 2 === 0)) {
      k = Math.sin((g.t + i) * 14) * 0.4;
      artBlob(c, x + s * 1.1, y + s * 0.7 - k * s, s * 0.28, s * 0.2, p.tint || '#ffffff', { lineColor: p.tint ? artShade(p.tint, -0.4) : BUNNY_LINE, rot: -0.6 + k, flat: true });
    }
  }
}
function pzzDrawGroupFront(c, g) {
  var L = pzz.L, u = L.u, T = L.tables[g.ti], i, p, P = g.P, k, x, y;
  // Lautaset syöjien edessä
  for (i = 0; i < g.pups.length; i++) {
    p = g.pups[i];
    if (Math.abs(p.x - p.tx) > 2) continue;
    x = p.tx + (p.sad > 0 ? Math.sin(p.sad * 25) * u * 0.003 : 0);
    pzzEll(c, x, T.y + u * 0.006, u * 0.024, u * 0.009);
    c.fillStyle = '#ffffff';
    c.fill();
    c.strokeStyle = '#c8b8d0';
    c.lineWidth = Math.max(1, u * 0.002);
    c.stroke();
    if (p.got && P) pzzDrawSlice(c, P, x, T.y + u * 0.002, u * 0.022, Math.PI, 1 - Math.max(0, p.munch) / 1.9);
    if (p.sad > 0) pzzText(c, '?', x, T.y - u * 0.01 - Math.sin(p.sad * 6) * u * 0.004, u * 0.03, '#6a8ac8', '#ffffff');
  }
  if (P && g.state === 'eat') {
    k = easeOutCubic(Math.min(1, P.fly.t / 0.3));
    x = P.fly.x0 + (P.tx - P.fly.x0) * k;
    y = P.fly.y0 + (P.ty - P.fly.y0) * k - Math.sin(k * Math.PI) * u * 0.05;
    pzzDrawPizza(c, P, x, y, L.R * (1 - k * 0.3), { left: P.left, sq: PZZ_SQ - k * 0.3, mini: true });
  }
  if (g.sighT > 0) pzzText(c, '...', T.x, T.y - u * 0.13 - (1.8 - g.sighT) * u * 0.03, u * 0.04, '#8a7a8a', '#ffffff');
  if (g.joyT > 0) for (i = 0; i < 3; i++) drawHeartShape(c, T.x + (i - 1) * u * 0.08, T.y - u * 0.12 - (1.6 - g.joyT) * u * 0.06, u * 0.014, true);
  if (g.coughT > 0) pzzText(c, '!', T.x - u * 0.1, T.y - u * 0.1 - (1.4 - g.coughT) * u * 0.04, u * 0.035, '#a0603a', '#ffffff');
}
function pzzDrawTables(c) {
  var L = pzz.L, u = L.u, i, T, g, j, k, open;
  for (i = 0; i < 2; i++) {
    T = L.tables[i];
    open = i < PZZ_TABLES[pzz.ph];
    for (j = 0; j < pzz.leavers.length; j++) if (pzz.leavers[j].ti === i) pzzDrawGroupBack(c, pzz.leavers[j], true);
    g = pzz.groups[i];
    if (g) pzzDrawGroupBack(c, g, false);
    k = !open ? 1 : (i === 1 && pzz.tablesK < 1 ? easeOutBack(pzz.tablesK) : 1);
    // Jalat
    artLimb(c, T.x - L.tableW * 0.4, T.y + u * 0.05, T.x - L.tableW * 0.4, T.y + u * 0.1, u * 0.014, '#a8683a', '#5a3014');
    artLimb(c, T.x + L.tableW * 0.4, T.y + u * 0.05, T.x + L.tableW * 0.4, T.y + u * 0.1, u * 0.014, '#a8683a', '#5a3014');
    if (pzz.tableCv && pzz.tableCv.width > 1) c.drawImage(pzz.tableCv, T.x - L.tableW / 2 - u * 0.02, T.y - u * 0.012);
    if (!open) {
      // Kiinni: kukkamaljakko ja "pian" -tuolit pöydällä
      artRoundRect(c, T.x - u * 0.012, T.y - u * 0.05, u * 0.024, u * 0.045, u * 0.008, '#bfe8ff', { lineColor: '#5a8ab0', hi: 0.5 });
      for (j = -1; j <= 1; j++) artCircle(c, T.x + j * u * 0.014, T.y - u * 0.062 - Math.abs(j) * -u * 0.006, u * 0.011, ['#ff8fb8', '#ffe27a', '#b8a0ff'][j + 1], { lineColor: '#9a5a7a', flat: true });
    } else if (k < 1) {
      artGlow(c, T.x, T.y, L.tableW * 0.5, '#ffffff', 1 - k);
    }
    if (g) pzzDrawGroupFront(c, g);
  }
}
function pzzDrawDog(c) {
  var D = pzz.dog, L = pzz.L, u = L.u, s = u * 0.032, x, y, t = D.t, run = D.state === 'run' || D.state === 'back', wag, j, lie = D.state === 'lie' && D.trick <= 0, leg, f = D.face, roll = D.roll > 0;
  if (!D) return;
  x = D.x;
  y = D.y;
  j = D.jump > 0 ? Math.sin(D.jump / 0.5 * Math.PI) * u * 0.06 : 0;
  if (run) y -= Math.abs(Math.sin(t * 16)) * u * 0.008;
  if (D.trick > 0) j = Math.sin(Math.min(1, D.trick / 1.5) * Math.PI) * u * 0.03;
  wag = Math.sin(t * (D.wag > 0 || run ? 22 : 3)) * (D.wag > 0 || run ? 0.6 : 0.15);
  artShadow(c, x, y, s * 1.6, s * 0.3, 0.2);
  c.save();
  c.translate(x, y - j);
  c.scale(f < 0 ? 1 : -1, 1);
  if (roll) c.rotate(Math.sin(D.roll / 1.2 * Math.PI) * Math.PI);
  if (D.trick > 0) c.rotate(Math.sin(D.trick * 10) * 0.1);
  // Häntä
  c.save();
  c.translate(s * 1.1, -s * 0.6);
  c.rotate(-0.8 + wag);
  artBlob(c, 0, -s * 0.35, s * 0.14, s * 0.4, '#c88a5a', { lineColor: '#6a3a1a', flat: true });
  c.restore();
  // Vartalo ja jalat
  leg = run ? Math.sin(t * 18) * s * 0.25 : 0;
  if (!lie) {
    artLimb(c, -s * 0.6 + leg, -s * 0.4, -s * 0.6 + leg, 0, s * 0.22, '#c88a5a', '#6a3a1a');
    artLimb(c, s * 0.7 - leg, -s * 0.4, s * 0.7 - leg, 0, s * 0.22, '#c88a5a', '#6a3a1a');
  }
  artBlob(c, s * 0.1, lie ? -s * 0.38 : -s * 0.62, s * 1.15, lie ? s * 0.4 : s * 0.48, '#d8a070', { lineColor: '#6a3a1a', flat: true });
  artBlob(c, s * 0.4, lie ? -s * 0.45 : -s * 0.7, s * 0.38, s * 0.26, '#f4dcc0', { line: false, flat: true });
  // Pää
  c.save();
  c.translate(-s * 0.95, lie ? -s * 0.55 : -s * 1.05);
  artBlob(c, -s * 0.4, s * 0.12, s * 0.42, s * 0.3, '#f4dcc0', { lineColor: '#6a3a1a', flat: true });
  artCircle(c, 0, 0, s * 0.55, '#d8a070', { lineColor: '#6a3a1a', flat: true });
  artBlob(c, s * 0.38, s * 0.1, s * 0.2, s * 0.42, '#8a5a3a', { lineColor: '#4a2a10', rot: -0.3 + wag * 0.2, flat: true });
  artCircle(c, -s * 0.8, s * 0.06, s * 0.12, '#3a2a2a', { line: false, flat: true });
  if (lie && D.wag <= 0 && D.trick <= 0) {
    c.strokeStyle = '#3a2a2a';
    c.lineWidth = Math.max(1, s * 0.08);
    c.beginPath(); c.arc(-s * 0.18, -s * 0.08, s * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
  } else artEye(c, -s * 0.18, -s * 0.1, s * 0.12, -0.5, false);
  if (D.munch > 0 || D.wag > 0) {
    artBlob(c, -s * 0.6, s * 0.4, s * 0.1, s * 0.16 + Math.abs(Math.sin(t * 14)) * s * 0.05, '#ff7a9a', { lineColor: '#a03a5a', line: Math.max(1, s * 0.04), flat: true });
  }
  c.restore();
  c.restore();
  if (lie && D.wag <= 0 && D.trick <= 0) pzzText(c, 'z', x - s * 1.4, y - s * 1.3 - (globalT % 1.5) * s * 0.4, s * 0.5, '#8a7ab8', '#ffffff');
}
function pzzDogPoke() {
  var D = pzz.dog, L = pzz.L;
  if (!D || D.state !== 'lie') return false;
  D.n = (D.n || 0) + 1;
  D.wag = 1.4;
  spawnSparkles(D.x, D.y - L.u * 0.04, 6, '#d8a070');
  playNote(392, 0, 0.08, 'square', 0.06);
  playNote(330, 0.12, 0.1, 'square', 0.06);
  if (D.n % 3 === 0) { D.roll = 1.2; playNote(659, 0.2, 0.2, 'triangle', 0.2); }
  if (D.n % 5 === 0) {
    D.trick = 1.5;
    pzzPuff(D.x, D.y - L.u * 0.08, 5, '#ff8fb8', { heart: true, up: 0.12, life: 1.4, spread: 0.06 });
    for (var i = 0; i < 4; i++) playNote([523, 659, 784, 1047][i], 0.1 + i * 0.1, 0.14, 'triangle', 0.2);
  }
  return true;
}

// ---------- Ikkuna ja katu ----------
function pzzSkyCols() {
  var k = pzz.dayK, A = ['#ffcf9a', '#fff0d8'], B = ['#7cc4ff', '#d8f0ff'], C = ['#5a4a98', '#ff9a6a'];
  if (k <= 1) return [artMix(A[0], B[0], k), artMix(A[1], B[1], k)];
  return [artMix(B[0], C[0], k - 1), artMix(B[1], C[1], k - 1)];
}
function pzzDrawWindow(c) {
  var L = pzz.L, u = L.u, W = L.win, sky = pzzSkyCols(), g, i, x, y, ev = Math.max(0, pzz.dayK - 1), st = W.y1 - (W.y1 - W.y0) * 0.22, p, v = pzz.van, k, hw, mus, hc;
  c.save();
  roundRect(c, W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0, u * 0.03);
  c.clip();
  g = c.createLinearGradient(0, W.y0, 0, st);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
  if (ev < 0.6) artCircle(c, W.x0 + (W.x1 - W.x0) * (0.15 + pzz.dayK * 0.3), W.y0 + u * (0.04 + ev * 0.05), u * 0.022, '#fff2a0', { line: false, flat: true });
  else {
    artCircle(c, W.x1 - u * 0.06, W.y0 + u * 0.035, u * 0.018, '#fffbe0', { line: false, flat: true });
    for (i = 0; i < 6; i++) drawStar(c, W.x0 + (W.x1 - W.x0) * ((i * 0.37) % 1), W.y0 + u * (0.02 + ((i * 0.53) % 1) * 0.05), u * 0.006, 0, 0.3 * ev);
  }
  // Pupulan talot kadun toisella puolella
  hw = u * 0.085;
  for (i = 0; i * hw < W.x1 - W.x0 + hw; i++) {
    x = W.x0 + i * hw - u * 0.01;
    hc = ['#ffd0e0', '#d8f0c8', '#fff0b0', '#d8e0ff', '#ffe0c8'][i % 5];
    y = st - u * (0.075 + (i % 3) * 0.015);
    c.fillStyle = artMix(hc, sky[1], ev * 0.4);
    c.fillRect(x, y, hw - u * 0.006, st - y);
    c.fillStyle = artMix(['#e86a6a', '#8a6ad8', '#e8a040', '#5aa0d8', '#d86aa0'][i % 5], '#3a2a5a', ev * 0.4);
    c.beginPath(); c.moveTo(x - u * 0.006, y); c.lineTo(x + hw / 2 - u * 0.003, y - u * 0.035); c.lineTo(x + hw, y); c.closePath(); c.fill();
    c.fillStyle = ev > 0.4 ? 'rgba(255,220,120,' + (0.5 + ev * 0.5) + ')' : 'rgba(120,170,220,0.7)';
    c.fillRect(x + hw * 0.2, y + u * 0.016, hw * 0.22, u * 0.018);
    c.fillRect(x + hw * 0.55, y + u * 0.016, hw * 0.22, u * 0.018);
  }
  // Katu
  c.fillStyle = '#e8d8c8';
  c.fillRect(W.x0, st, W.x1 - W.x0, W.y1 - st);
  c.fillStyle = 'rgba(160,130,110,0.3)';
  for (x = W.x0; x < W.x1; x += u * 0.03) c.fillRect(x, st + u * 0.01, u * 0.02, u * 0.006);
  // Jauhovespa
  if (v) {
    k = v.leave >= 0 ? easeInOutSine((v.t - v.leave) / 1.8) : 1 - easeOutCubic(Math.min(1, v.t / 1.6));
    x = (W.x0 + W.x1) / 2 + (v.leave >= 0 ? -k : k) * (W.x1 - W.x0) * 0.75;
    pzzDrawVespa(c, x, st + u * 0.02, u * 0.04, v.leave >= 0 || v.t < 1.6);
  }
  // Ohikulkijat
  for (i = 0; i < pzz.passers.length; i++) pzzDrawPasser(c, pzz.passers[i], st + u * 0.022);
  // Harmonikkapupu kadun kulmassa
  mus = pzz.musician;
  if (mus) pzzDrawMusician(c, W.x1 - u * 0.06, st + u * 0.024, u * 0.024, mus);
  c.restore();
  // Ikkunan puitteet ja lauta
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(3, u * 0.012);
  roundRect(c, W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0, u * 0.03);
  c.stroke();
  c.lineWidth = Math.max(2, u * 0.007);
  c.beginPath();
  c.moveTo((W.x0 + W.x1) / 2, W.y0); c.lineTo((W.x0 + W.x1) / 2, W.y1);
  c.moveTo(W.x0, (W.y0 + W.y1) * 0.5 - u * 0.02); c.lineTo(W.x1, (W.y0 + W.y1) * 0.5 - u * 0.02);
  c.stroke();
  c.strokeStyle = '#b8805a';
  c.lineWidth = Math.max(1, u * 0.003);
  roundRect(c, W.x0 - u * 0.006, W.y0 - u * 0.006, W.x1 - W.x0 + u * 0.012, W.y1 - W.y0 + u * 0.012, u * 0.034);
  c.stroke();
  artRoundRect(c, W.x0 - u * 0.02, W.y1 - u * 0.004, W.x1 - W.x0 + u * 0.04, u * 0.016, u * 0.006, '#f4d8b8', { lineColor: '#8a5a3a' });
}
function pzzDrawPasser(c, p, y) {
  var u = pzz.L.u, s = u * 0.018, b = Math.abs(Math.sin(p.t * 7)) * u * 0.008, x = p.x;
  if (p.kind === 'bike') {
    artCircle(c, x - s * 1.2, y - s * 0.5, s * 0.55, '#ffffff', { lineColor: '#3a3a5a', flat: true });
    artCircle(c, x + s * 1.2, y - s * 0.5, s * 0.55, '#ffffff', { lineColor: '#3a3a5a', flat: true });
    artLimb(c, x - s * 1.2, y - s * 0.5, x + s * 1.2, y - s * 0.5, s * 0.2, p.col, '#5a3a5a');
    pzzDrawEater(c, x, y - s * 2.2, s, { t: p.t, mood: 'happy', tint: p.tint, acc: 0, squint: p.wave > 0 });
    return;
  }
  if (p.kind === 'balloon') {
    c.strokeStyle = '#8a7a8a';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(x + s * 0.8 * p.dir, y - s * 1.4 - b); c.lineTo(x + s * 1.2 * p.dir, y - s * 4.2); c.stroke();
    artCircle(c, x + s * 1.2 * p.dir, y - s * 4.8, s * 0.7, p.col, { lineColor: artShade(p.col, -0.4), flat: true });
  }
  artBlob(c, x, y - s * 0.6 - b, s * 0.7, s * 0.6, p.tint || '#ffffff', { lineColor: p.tint ? artShade(p.tint, -0.4) : BUNNY_LINE, flat: true });
  pzzDrawEater(c, x, y - s * 1.7 - b, s, { t: p.t, mood: p.wave > 0 ? 'wow' : 'happy', tint: p.tint, acc: 0, squint: false, look: p.dir * 0.6 });
  if (p.wave > 0) artBlob(c, x + s * 1.0, y - s * 2.0 - b - Math.sin(p.t * 14) * s * 0.3, s * 0.25, s * 0.2, p.tint || '#ffffff', { lineColor: BUNNY_LINE, flat: true });
}
function pzzDrawMusician(c, x, y, s, p) {
  var play = p.play > 0, sq = play ? Math.sin(globalT * 10) * 0.35 : 0, i, a;
  artBlob(c, x, y - s * 0.7, s * 0.8, s * 0.7, '#ffffff', { lineColor: BUNNY_LINE, flat: true });
  pzzDrawEater(c, x, y - s * 1.9 + (play ? Math.abs(Math.sin(globalT * 5)) * -s * 0.15 : 0), s, { t: globalT, mood: play ? 'happy' : 'happy', tint: null, acc: 2, squint: play });
  // Harmonikka: palkeet aukeavat ja sulkeutuvat
  artRoundRect(c, x - s * (0.95 + sq * 0.3), y - s * 1.0, s * 0.42, s * 0.7, s * 0.08, '#e0443e', { lineColor: '#7a1a1a', flat: true });
  artRoundRect(c, x + s * (0.53 + sq * 0.3), y - s * 1.0, s * 0.42, s * 0.7, s * 0.08, '#e0443e', { lineColor: '#7a1a1a', flat: true });
  c.strokeStyle = '#3a2a2a';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath();
  for (i = 0; i < 5; i++) { a = x - s * (0.5 + sq * 0.15) + i * s * (0.25 + sq * 0.07); c.moveTo(a, y - s * 0.95); c.lineTo(a + s * 0.1, y - s * 0.65); c.lineTo(a, y - s * 0.35); }
  c.stroke();
}
function pzzDrawVespa(c, x, y, s, moving) {
  var i, b = moving ? Math.sin(globalT * 20) * s * 0.03 : 0;
  artCircle(c, x - s * 0.9, y - s * 0.3, s * 0.32, '#3a3a4a', { lineColor: '#1a1a2a', flat: true });
  artCircle(c, x + s * 0.9, y - s * 0.3, s * 0.32, '#3a3a4a', { lineColor: '#1a1a2a', flat: true });
  c.beginPath();
  c.moveTo(x - s * 1.3, y - s * 0.4);
  c.quadraticCurveTo(x - s * 1.3, y - s * 1.1, x - s * 0.4, y - s * 0.9);
  c.lineTo(x + s * 0.6, y - s * 0.75);
  c.quadraticCurveTo(x + s * 1.2, y - s * 0.6, x + s * 1.2, y - s * 0.35);
  c.closePath();
  artFillPath(c, '#7ad8c0', y - s * 1.1, y - s * 0.35, s, { lineColor: '#2a7a6a', flat: true });
  artLimb(c, x + s * 0.9, y - s * 0.7, x + s * 0.8, y - s * 1.5, s * 0.12, '#7ad8c0', '#2a7a6a');
  artCircle(c, x + s * 1.0, y - s * 1.2, s * 0.12, '#fff6a0', { lineColor: '#a09020', flat: true });
  // Jauhosäkki takana ja kuski
  artRoundRect(c, x - s * 1.25, y - s * 1.6 + b, s * 0.6, s * 0.65, s * 0.15, '#fff8ec', { lineColor: '#a08050', flat: true });
  pzzText(c, '1', x - s * 0.95, y - s * 1.27 + b, s * 0.4, '#c08040');
  pzzDrawEater(c, x - s * 0.1, y - s * 1.6 + b, s * 0.4, { t: globalT, mood: 'happy', tint: '#fff3c4', acc: 2, squint: false, look: -0.5 });
  for (i = 0; i < 2; i++) if (moving) { c.globalAlpha = 0.4; artCircle(c, x - s * (1.6 + i * 0.4), y - s * 0.4, s * (0.15 + i * 0.08), '#ffffff', { line: false, flat: true }); c.globalAlpha = 1; }
}

// ---------- Kupla ----------
function pzzDrawBubble(c, g) {
  var o = g.o, L = pzz.L, u = L.u, B = pzzBubblePos(g.ti), T = L.tables[g.ti], pop = g.pop > 0 ? 1 + Math.sin(g.pop / 0.4 * Math.PI) * 0.08 : 1, m = g.miss, pulse = m ? 0.5 + Math.sin(globalT * 10) * 0.5 : 0;
  var w = o.pics ? u * 0.17 : B.w, h = B.h, x = o.pics ? B.x : B.x, px, i, e, ry, txt, rows, sx;
  c.save();
  c.translate(B.x, B.y);
  c.scale(pop, pop);
  c.translate(-B.x, -B.y);
  sx = Math.max(x - w * 0.35, Math.min(x + w * 0.35, T.x));
  c.beginPath(); c.moveTo(sx - u * 0.02, B.y + h / 2 - u * 0.01); c.lineTo(sx, B.y + h / 2 + u * 0.04); c.lineTo(sx + u * 0.02, B.y + h / 2 - u * 0.01); c.closePath();
  artFillPath(c, '#ffffff', B.y, B.y + h, u * 0.05, { lineColor: '#d8a8a0', flat: true });
  artRoundRect(c, x - w / 2, B.y - h / 2, w, h, u * 0.04, g.sits ? '#f4eef0' : '#ffffff', { lineColor: '#d8a8a0', flat: true });
  c.fillStyle = g.sits ? '#f4eef0' : '#ffffff';
  c.fillRect(sx - u * 0.018, B.y + h / 2 - u * 0.02, u * 0.036, u * 0.02);
  px = o.pics ? x : x - w * 0.24;
  if (m && m.part === 'raw') {
    c.fillStyle = 'rgba(255,150,60,' + (0.2 + pulse * 0.35) + ')';
    c.beginPath(); c.arc(px, B.y, u * 0.068, 0, Math.PI * 2); c.fill();
  }
  pzzDrawOrderPizza(c, o, px, B.y, u * 0.058, m, pulse);
  if (m && m.part === 'raw') {
    // Raaka: pieni liekki muistuttaa uunista
    pzzFlame(c, px + u * 0.05, B.y + u * 0.055, u * 0.016, u * 0.04 * (1 + pulse * 0.2), '#ff7a2a', '#ffe27a');
  }
  if (m && m.part === 'cuts') {
    // Liian vähän paloja: leikkuri sykkii kuplassa
    pzzDrawCutter(c, px + u * 0.055, B.y + u * 0.045, u * 0.028 * (1 + pulse * 0.25), globalT * 4);
  }
  if (!o.pics) {
    // Numerot: rivit "3 [kuva]" tai "2+1 [kuva]"; puolikkaissa pikku puolikas
    rows = o.tops.length;
    for (i = 0; i < rows; i++) {
      e = o.tops[i];
      ry = rows > 1 ? B.y - u * 0.035 + i * u * 0.07 : B.y;
      if (m && (m.part === 'top' || m.part === 'extra') && m.i === i) {
        c.fillStyle = 'rgba(255,90,90,' + (0.18 + pulse * 0.3) + ')';
        roundRect(c, x + w * 0.0, ry - u * 0.032, w * 0.46, u * 0.064, u * 0.026);
        c.fill();
      }
      if (e.side) {
        c.beginPath();
        c.moveTo(x + w * 0.07, ry - u * 0.02);
        c.arc(x + w * 0.07, ry, u * 0.02, -Math.PI / 2, Math.PI / 2, e.side < 0);
        c.closePath();
        c.fillStyle = '#ffd060';
        c.fill();
        c.strokeStyle = '#9a5a1a';
        c.lineWidth = Math.max(1, u * 0.003);
        c.stroke();
      }
      txt = e.sum ? e.sum[0] + '+' + e.sum[1] : String(e.n);
      pzzText(c, txt, x + w * (e.sum ? 0.21 : 0.2), ry, u * (e.sum ? 0.04 : 0.05), '#8a3a2a', '#ffffff');
      pzzDrawTop(c, e.type, x + w * 0.38, ry, u * 0.022, 0);
    }
  }
  if (m && m.part === 'extra' && m.i < 0) {
    // Ylimääräinen laji: kuva ja punainen ruksi
    pzzDrawTop(c, m.type, px + u * 0.06, B.y - u * 0.05, u * 0.02, 0);
    c.strokeStyle = '#e83040';
    c.lineWidth = Math.max(2, u * 0.006);
    c.beginPath(); c.moveTo(px + u * 0.04, B.y - u * 0.07); c.lineTo(px + u * 0.08, B.y - u * 0.03); c.moveTo(px + u * 0.08, B.y - u * 0.07); c.lineTo(px + u * 0.04, B.y - u * 0.03); c.stroke();
  }
  c.restore();
  if (pzz.ph >= 1) pzzDrawPatience(c, x + w / 2 - u * 0.012, B.y - h / 2 + u * 0.01, g);
}
function pzzDrawPatience(c, x, y, g) {
  var u = pzz.L.u, s = u * 0.022, p = Math.max(0, Math.min(1, g.pat)), pul = p < 0.3 && !g.sits ? 1 + Math.sin(globalT * 12) * 0.12 : 1;
  s *= pul;
  artCircle(c, x, y, s * 1.25, '#ffffff', { lineColor: '#e0b8c0', flat: true });
  if (g.sits) { htCloudPuff(c, x, y + s * 0.2, s * 1.6, '#d8d4e4'); return; }
  pzzHeartPath(c, x, y + s * 0.12, s * 0.95);
  c.fillStyle = 'rgba(255,200,215,0.5)';
  c.fill();
  c.save();
  c.beginPath();
  c.rect(x - s * 1.2, y + s * 0.12 + s * 0.55 - p * s * 1.45, s * 2.4, p * s * 1.45);
  c.clip();
  pzzHeartPath(c, x, y + s * 0.12, s * 0.95);
  c.fillStyle = p < 0.3 ? '#ff5a6a' : '#ff6f9a';
  c.fill();
  c.restore();
  pzzHeartPath(c, x, y + s * 0.12, s * 0.95);
  c.strokeStyle = '#c0406a';
  c.lineWidth = Math.max(1.2, s * 0.12);
  c.stroke();
}

// ---------- Tökättävät ----------
// Kokkipupu uunin takana pyörittää taikinaa (3.: tuplapyöräytys, 5.: taikina
// putoaa päähän hatuksi), kissa jauhosäkillä (jauhopöllähdys; 3.: kehrää
// sydämiä, 5.: aivastaa jauhopilven), katosta roikkuvat valkosipulit ja
// paprikat (heiluvat; 3.: chili putoaa, 5.: tuoksupilvi), basilikaruukku
// (tuoksukiehkurat; 3.: kukka aukeaa, 5.: perhonen lähtee lentoon),
// kassakone (kilahdus ja kolikko; 3.: kuitti, 5.: kolikkosuihku ja
// tähtikolikko), harmonikkapupu kadulla (soittaa; 3.: ohikulkijat
// vilkuttavat, 5.: nuottipilvi), lamput (heiluvat ja välähtävät), pöydän alla
// torkkuva koira (häntä; 3.: kieriskely, 5.: temppu) ja ikkunan katu
// (napautus kutsuu ohikulkijan vilkuttamaan).
function pzzSetupProps() {
  var L = pzz.L, H = viewH, u = L.u, i, W = L.win;
  propsReset();
  propAdd({
    x: L.chef.x, y: L.chef.y, r: u * 0.075, hy: u * 0.17, color: '#ffffff', note: 659, amp: 0.05, layer: 2, toss: 0, spin2: 0, hatT: 0,
    update: function (p, dt) { if (p.toss > 0) p.toss -= dt; if (p.hatT > 0) p.hatT -= dt; },
    draw: function (c, p) { pzzDrawChef(c, u, p); },
    poke: function (p) {
      p.toss = 1.0;
      p.spin2 = p.n % 3 === 0 ? 1 : 0;
      pzzGlide(400, 900, 0, 0.35, 'sine', 0.15);
      if (p.spin2) { spawnSparkles(p.x, p.y - u * 0.3, 10, '#fff4d0'); playNote(1319, 0.3, 0.15, 'triangle', 0.2); }
      if (p.n % 5 === 0) {
        p.hatT = 5;
        pzzGlide(900, 300, 0.6, 0.3, 'sine', 0.15);
        playNote(523, 1.0, 0.1, 'triangle', 0.2);
        playNote(659, 1.1, 0.1, 'triangle', 0.2);
        playNote(523, 1.2, 0.15, 'triangle', 0.2);
      }
    }
  });
  propAdd({
    x: L.cat.x, y: L.cat.y, r: u * 0.065, hy: u * 0.05, color: '#fff8ec', note: 784, amp: 0.05, layer: 3, awake: 0, purr: 0,
    update: function (p, dt) { if (p.awake > 0) p.awake -= dt; if (p.purr > 0) p.purr -= dt; },
    draw: function (c, p) { pzzDrawCatSack(c, u, p); },
    poke: function (p) {
      p.awake = 1.6;
      pzzPuff(p.x, p.y - u * 0.05, 4, '#ffffff', { up: 0.05, spread: 0.04 });
      pzzGlide(700, 1100, 0, 0.18, 'triangle', 0.15);
      pzzGlide(1100, 800, 0.18, 0.2, 'triangle', 0.13);
      if (p.n % 3 === 0) {
        p.purr = 2;
        pzzPuff(p.x, p.y - u * 0.07, 3, '#ff8fb8', { heart: true, up: 0.08, life: 1.4 });
        for (i = 0; i < 6; i++) playNote(90 + (i % 2) * 10, i * 0.12, 0.1, 'sawtooth', 0.03);
      }
      if (p.n % 5 === 0) {
        pzzPuff(p.x - u * 0.04, p.y - u * 0.06, 12, '#ffffff', { big: true, spread: 0.08 });
        pzzGlide(1400, 300, 0.3, 0.25, 'sawtooth', 0.06);
      }
    }
  });
  for (i = 0; i < 2; i++) {
    propAdd({
      x: L.garlic.x + i * u * 0.075, y: 0, r: u * 0.06, hy: -(H * 0.17 + i * u * 0.03), color: i ? '#ff5a3a' : '#fff8ec', note: 1047 - i * 200, amp: 0.25, layer: 0, k: i, smell: 0,
      update: function (p, dt) { if (p.smell > 0) p.smell -= dt; },
      draw: function (c, p) { pzzDrawStrings(c, u, H, p.k); },
      poke: function (p) {
        playNote(1568 - p.k * 300, 0.05, 0.06, 'triangle', 0.15);
        playNote(1319 - p.k * 300, 0.15, 0.06, 'triangle', 0.12);
        if (p.n % 3 === 0) {
          propDrop({
            x: p.x, y: H * 0.2 + p.k * u * 0.03, vx: u * 0.15, vy: -u * 0.2, ground: H * 0.985, life: 2.2,
            draw: function (c) { pzzDrawChili(c, 0, 0, u * 0.02); }
          });
        }
        if (p.n % 5 === 0) pzzPuff(p.x, H * 0.2, 7, '#e0f0c0', { up: 0.04, spread: 0.08, life: 1.8 });
      }
    });
  }
  propAdd({
    x: L.basil.x, y: L.basil.y, r: u * 0.05, hy: u * 0.045, color: '#5cc04a', note: 880, amp: 0.08, layer: 0, bloom: 0,
    update: function (p, dt) { if (p.bloom > 0) p.bloom -= dt; },
    draw: function (c, p) { pzzDrawBasilPot(c, u, p); },
    poke: function (p) {
      pzzPuff(p.x, p.y - u * 0.07, 4, '#c8f0b0', { up: 0.06, life: 1.6, spread: 0.04 });
      playNote(988, 0.05, 0.2, 'sine', 0.12);
      if (p.n % 3 === 0) { p.bloom = 4; playNote(1319, 0.2, 0.2, 'triangle', 0.18); }
      if (p.n % 5 === 0) {
        pzz.flies.push({ kind: 'fly', x0: p.x, y0: p.y - u * 0.08, x1: p.x + u * 0.5, y1: H * 0.05, t: 0, dur: 3, o: {} });
        playNote(1568, 0.1, 0.1, 'sine', 0.15);
        playNote(1760, 0.25, 0.1, 'sine', 0.15);
      }
    }
  });
  propAdd({
    x: L.reg.x, y: L.reg.y, r: u * 0.06, hy: u * 0.04, color: '#ffd24f', note: 1319, amp: 0.06, layer: 0, drawer: 0, receipt: 0,
    update: function (p, dt) { if (p.drawer > 0) p.drawer -= dt; if (p.receipt > 0) p.receipt -= dt; },
    draw: function (c, p) { pzzDrawRegister(c, u, p); },
    poke: function (p) {
      var j, n = p.n % 5 === 0 ? 7 : 1, big;
      p.drawer = 0.8;
      playNote(2093, 0, 0.3, 'sine', 0.22);
      playNote(2637, 0.04, 0.3, 'sine', 0.12);
      if (p.n % 3 === 0) { p.receipt = 2.5; for (j = 0; j < 4; j++) playNote(2400, 0.1 + j * 0.06, 0.03, 'square', 0.03); }
      for (j = 0; j < n; j++) {
        big = p.n % 5 === 0 && j === 0;
        propDrop({
          x: p.x, y: p.y - u * 0.01, vx: -u * (0.1 + Math.random() * 0.3), vy: -u * (0.3 + Math.random() * 0.3), ground: p.y + u * 0.005, life: 1.8, big: big,
          draw: function (c, d) { if (d.big) drawStar(c, 0, 0, u * 0.018, 0, 0.6); else artCircle(c, 0, 0, u * 0.01, '#ffd24f', { lineColor: '#a07010', hi: 0.5 }); }
        });
      }
    }
  });
  pzz.musician = propAdd({
    x: W.x1 - u * 0.06, y: W.y1 - (W.y1 - W.y0) * 0.22 + u * 0.024, r: u * 0.045, hy: u * 0.04, color: '#ff8fb8', note: 784, amp: 0, layer: 0, play: 0,
    update: function (p, dt) { if (p.play > 0) p.play -= dt; },
    draw: function () {},
    poke: function (p) {
      var j, mel = [659, 784, 880, 784, 659, 587, 659, 523, 587, 659];
      p.play = 2.6;
      for (j = 0; j < mel.length; j++) { playNote(mel[j], 0.1 + j * 0.2, 0.18, 'square', 0.05); playNote(mel[j] / 2, 0.1 + j * 0.2, 0.18, 'triangle', 0.08); }
      if (p.n % 3 === 0) { pzzAddPasser(1, true); pzzAddPasser(-1, true); }
      if (p.n % 5 === 0) pzzPuff(p.x, p.y - u * 0.06, 8, '#ff8fb8', { note: true, up: 0.08, spread: 0.1, life: 2 });
      else pzzPuff(p.x, p.y - u * 0.05, 2, '#8a6ad8', { note: true, up: 0.07, life: 1.6 });
    }
  });
  for (i = 0; i < 2; i++) {
    propAdd({
      x: L.lamps[i].x, y: 0, r: u * 0.05, hy: -u * 0.1, color: '#fff2a0', note: 1175 + i * 200, amp: 0.3, layer: 0, flash: 0,
      update: function (p, dt) { if (p.flash > 0) p.flash -= dt; },
      draw: function (c, p) { pzzDrawLamp(c, u, p); },
      poke: function (p) {
        p.flash = 0.6;
        if (p.n % 3 === 0) { p.flash = 1.5; spawnSparkles(p.x, u * 0.12, 10, '#fff2a0'); }
        if (p.n % 5 === 0) for (var j = 0; j < 3; j++) propDrop({ x: p.x, y: u * 0.12, vx: (Math.random() - 0.5) * u * 0.4, vy: -u * 0.2, ground: H * 0.6, life: 1.6, draw: function (c) { drawStar(c, 0, 0, u * 0.012, 0, 0.4); } });
      }
    });
  }
}
function pzzDrawChef(c, u, p) {
  var s = u * 0.065, t = globalT, k = p.toss > 0 ? Math.sin((1 - p.toss) * Math.PI) : 0, dy, sp, w, hat = p.hatT > 0;
  // Tassut ylhäällä pyörittämässä
  dy = -s * 2.45 - k * u * 0.14;
  if (!hat) {
    artCircle(c, -s * 0.42, -s * 1.85, s * 0.16, '#ffffff', { lineColor: BUNNY_LINE, flat: true });
    artCircle(c, s * 0.42, -s * 1.85, s * 0.16, '#ffffff', { lineColor: BUNNY_LINE, flat: true });
  }
  drawBunny(c, 0, 0, s, 0, t * 2, false);
  // Kokinhattu (tai taikinahattu)
  if (hat) {
    artBlob(c, 0, -s * 1.42, s * 0.6, s * 0.2, PZZ_DOUGH, { lineColor: '#c8a06a', flat: true });
    artBlob(c, s * 0.3, -s * 1.3, s * 0.15, s * 0.25, PZZ_DOUGH, { lineColor: '#c8a06a', flat: true });
  } else {
    artRoundRect(c, -s * 0.3, -s * 1.55, s * 0.6, s * 0.18, s * 0.05, '#ffffff', { lineColor: '#b8b0c8', flat: true });
    artCircle(c, -s * 0.2, -s * 1.7, s * 0.2, '#ffffff', { lineColor: '#b8b0c8', flat: true });
    artCircle(c, s * 0.2, -s * 1.7, s * 0.2, '#ffffff', { lineColor: '#b8b0c8', flat: true });
    artCircle(c, 0, -s * 1.8, s * 0.22, '#ffffff', { lineColor: '#b8b0c8', flat: true });
    // Pyörivä taikina
    sp = t * (p.spin2 && p.toss > 0 ? 18 : 7);
    w = s * 0.75 * (0.75 + Math.abs(Math.cos(sp)) * 0.25);
    pzzEll(c, 0, dy, w, s * 0.16);
    c.fillStyle = PZZ_DOUGH;
    c.fill();
    c.strokeStyle = '#c8a06a';
    c.lineWidth = Math.max(1, s * 0.05);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.arc(Math.cos(sp) * w * 0.5, dy, s * 0.05, 0, Math.PI * 2); c.fill();
  }
}
function pzzDrawCatSack(c, u, p) {
  var s = u * 0.03, aw = p.awake > 0, i;
  // Jauhosäkki
  c.beginPath();
  c.moveTo(-s * 1.4, 0);
  c.quadraticCurveTo(-s * 1.7, -s * 1.4, -s * 0.9, -s * 1.9);
  c.lineTo(s * 0.9, -s * 1.9);
  c.quadraticCurveTo(s * 1.7, -s * 1.4, s * 1.4, 0);
  c.closePath();
  artFillPath(c, '#fff8ec', -s * 1.9, 0, s, { lineColor: '#a08050', shadeTo: '#f0e0c0' });
  artCircle(c, 0, -s * 0.8, s * 0.45, '#f4dcc0', { lineColor: '#c0a070', flat: true });
  drawStar(c, 0, -s * 0.8, s * 0.25, 0, 0);
  // Kissa käppyrällä säkin päällä
  c.save();
  c.translate(0, -s * 1.9 - (aw ? s * 0.3 : 0));
  artBlob(c, s * 0.1, 0, s * 1.0, s * 0.45, '#ffb070', { lineColor: '#8a4a1a', flat: true });
  c.strokeStyle = 'rgba(200,110,50,0.7)';
  c.lineWidth = Math.max(1, s * 0.12);
  c.beginPath();
  for (i = 0; i < 3; i++) { c.moveTo(-s * 0.2 + i * s * 0.35, -s * 0.4); c.lineTo(-s * 0.1 + i * s * 0.35, -s * 0.1); }
  c.stroke();
  artBlob(c, s * 1.0, s * 0.1, s * 0.5, s * 0.16, '#ffb070', { lineColor: '#8a4a1a', rot: aw ? -0.8 + Math.sin(globalT * 10) * 0.3 : 0.3, flat: true });
  artCircle(c, -s * 0.8, -s * 0.15, s * 0.5, '#ffb070', { lineColor: '#8a4a1a', flat: true });
  for (i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(-s * 0.8 + i * s * 0.42, -s * 0.35); c.lineTo(-s * 0.8 + i * s * 0.32, -s * 0.85); c.lineTo(-s * 0.8 + i * s * 0.08, -s * 0.55); c.closePath();
    artFillPath(c, '#ffb070', -s * 0.85, -s * 0.35, s * 0.3, { lineColor: '#8a4a1a', flat: true });
  }
  if (aw) { artEye(c, -s * 0.98, -s * 0.2, s * 0.1, 0, false); artEye(c, -s * 0.62, -s * 0.2, s * 0.1, 0, false); }
  else {
    c.strokeStyle = '#4a2a1a';
    c.lineWidth = Math.max(1, s * 0.08);
    c.beginPath(); c.arc(-s * 0.98, -s * 0.2, s * 0.09, 0.1 * Math.PI, 0.9 * Math.PI); c.moveTo(-s * 0.53, -s * 0.2); c.arc(-s * 0.62, -s * 0.2, s * 0.09, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
  }
  artCircle(c, -s * 0.8, -s * 0.02, s * 0.06, '#ff8fb8', { line: false, flat: true });
  c.restore();
  if (!aw) pzzText(c, 'z', s * 1.3, -s * 2.8 - (globalT % 1.6) * s * 0.5, s * 0.7, '#8a7ab8', '#ffffff');
}
function pzzDrawStrings(c, u, H, k) {
  var len = H * 0.17 + k * u * 0.03, i, y;
  c.strokeStyle = '#c8a070';
  c.lineWidth = Math.max(1.5, u * 0.004);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
  for (i = 0; i < 4; i++) {
    y = len * (0.3 + i * 0.22);
    if (k) pzzDrawChili(c, (i % 2 ? 1 : -1) * u * 0.012, y, u * 0.02);
    else {
      artBlob(c, (i % 2 ? 1 : -1) * u * 0.012, y, u * 0.02, u * 0.018, '#fff8ec', { lineColor: '#b0a080', flat: true });
      c.strokeStyle = 'rgba(176,160,128,0.6)';
      c.lineWidth = Math.max(1, u * 0.002);
      c.beginPath(); c.moveTo((i % 2 ? 1 : -1) * u * 0.012, y - u * 0.016); c.lineTo((i % 2 ? 1 : -1) * u * 0.012, y + u * 0.016); c.stroke();
    }
  }
}
function pzzDrawChili(c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s * 0.3, y - s * 0.5);
  c.quadraticCurveTo(x + s * 0.5, y - s * 0.3, x + s * 0.1, y + s * 0.9);
  c.quadraticCurveTo(x - s * 0.5, y + s * 0.1, x - s * 0.3, y - s * 0.5);
  c.closePath();
  c.fillStyle = '#e8402e';
  c.fill();
  c.strokeStyle = '#8a1a10';
  c.lineWidth = Math.max(1, s * 0.1);
  c.stroke();
  artLimb(c, x - s * 0.25, y - s * 0.5, x - s * 0.2, y - s * 0.8, s * 0.14, '#4aa83a', '#1e5a1e');
}
function pzzDrawBasilPot(c, u, p) {
  var s = u * 0.03, i, a, bl = p.bloom > 0;
  for (i = 0; i < 6; i++) {
    a = -Math.PI / 2 + (i - 2.5) * 0.45;
    c.save();
    c.translate(Math.cos(a) * s * 0.5, -s * 1.1 + Math.sin(a) * s * 0.4);
    c.rotate(a + Math.PI / 2 + Math.sin(globalT * 1.5 + i) * 0.06);
    pzzDrawTop(c, 'basil', 0, -s * 0.5, s * 0.55, 0);
    c.restore();
  }
  if (bl) for (i = 0; i < 3; i++) artCircle(c, (i - 1) * s * 0.5, -s * 2.1 - (i % 2) * s * 0.3, s * 0.18, '#ffffff', { lineColor: '#c8b0d8', flat: true });
  c.beginPath();
  c.moveTo(-s * 0.8, -s * 1.0);
  c.lineTo(s * 0.8, -s * 1.0);
  c.lineTo(s * 0.6, 0);
  c.lineTo(-s * 0.6, 0);
  c.closePath();
  artFillPath(c, '#e07a4c', -s, 0, s, { lineColor: '#7a3418' });
  artRoundRect(c, -s * 0.9, -s * 1.15, s * 1.8, s * 0.3, s * 0.1, '#e8906a', { lineColor: '#7a3418' });
}
function pzzDrawRegister(c, u, p) {
  var s = u * 0.03, dr = p.drawer > 0 ? Math.sin(Math.min(1, p.drawer / 0.8) * Math.PI) * s * 0.6 : 0;
  artRoundRect(c, -s * 1.2, -s * 0.5 + 0, s * 2.4, s * 0.5, s * 0.1, '#c8a0e0', { lineColor: '#5a3a7a' });
  artRoundRect(c, -s * 1.0 - dr, -s * 0.35, s * 1.0, s * 0.3, s * 0.06, '#e8d0f4', { lineColor: '#5a3a7a', flat: true });
  artRoundRect(c, -s * 1.1, -s * 1.5, s * 2.2, s * 1.05, s * 0.2, '#ff9ec6', { lineColor: '#9a4a6a', hi: 0.2 });
  artRoundRect(c, -s * 0.7, -s * 1.35, s * 1.4, s * 0.4, s * 0.08, '#e8fff0', { lineColor: '#4a8a5a', flat: true });
  pzzText(c, String(pzz.served), 0, -s * 1.15, s * 0.36, '#2a6a3a');
  c.fillStyle = '#ffffff';
  for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(-s * 0.5 + i * s * 0.5, -s * 0.7, s * 0.1, 0, Math.PI * 2); c.fill(); }
  if (p.receipt > 0) { artRoundRect(c, s * 0.2, -s * 2.4 + Math.min(1, (2.5 - p.receipt) * 2) * -s * 0.4, s * 0.5, s * 1.0, s * 0.05, '#ffffff', { lineColor: '#c8c0d0', flat: true }); }
  if (pzz.regPop > 0) artGlow(c, 0, -s * 0.8, s * 2, '#ffe27a', pzz.regPop * 2);
}
function pzzDrawLamp(c, u, p) {
  var len = u * 0.08, on = pzz.dayK > 1.2 || p.flash > 0, k = p.flash > 0 ? 0.6 + Math.sin(p.flash * 40) * 0.3 : 0;
  c.strokeStyle = '#6a4a3a';
  c.lineWidth = Math.max(1, u * 0.003);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
  if (on) artGlow(c, 0, len + u * 0.03, u * 0.12, '#fff2a0', 0.35 + k * 0.4);
  artCircle(c, 0, len + u * 0.022, u * 0.012, on ? '#fff8c0' : '#f4f0e0', { lineColor: '#a09070', flat: true });
  c.beginPath();
  c.moveTo(-u * 0.04, len + u * 0.022);
  c.quadraticCurveTo(-u * 0.035, len - u * 0.012, 0, len - u * 0.012);
  c.quadraticCurveTo(u * 0.035, len - u * 0.012, u * 0.04, len + u * 0.022);
  c.closePath();
  artFillPath(c, '#5aa878', len - u * 0.012, len + u * 0.022, u * 0.04, { lineColor: '#2a5a3a' });
}

// ---------- Tausta ----------
function renderPizzaBg(b, w, h) {
  var L = pzz.L, g, i, x, y, u, T, st;
  if (!L || L.W !== w || L.H !== h) { pzzLayout(); L = pzz.L; }
  u = L.u;
  // Seinä: lämmin rappaus
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffe8cc');
  g.addColorStop(1, '#f8d0a8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,255,0.25)';
  for (i = 0; i < 40; i++) {
    x = ((i * 0.618) % 1) * w;
    y = ((i * 0.377) % 1) * h * 0.9;
    b.beginPath(); b.arc(x, y, u * (0.01 + (i % 3) * 0.006), 0, Math.PI * 2); b.fill();
  }
  // Paljaat tiilet rappauksen alta
  b.strokeStyle = 'rgba(190,110,70,0.25)';
  b.lineWidth = Math.max(1, u * 0.003);
  for (i = 0; i < 3; i++) {
    x = [L.zx0 + u * 0.05, L.tz + u * 0.35, L.zx1 - u * 0.1][i];
    y = [h * 0.16, h * 0.62, h * 0.12][i];
    artRoundRect(b, x, y, u * 0.05, u * 0.02, u * 0.004, 'rgba(220,140,100,0.35)', { line: false, flat: true });
    artRoundRect(b, x + u * 0.03, y + u * 0.024, u * 0.05, u * 0.02, u * 0.004, 'rgba(220,140,100,0.3)', { line: false, flat: true });
  }
  // Kattopalkki
  artRoundRect(b, -u * 0.02, -u * 0.02, w + u * 0.04, h * 0.03 + u * 0.02, u * 0.01, '#9a5a32', { lineColor: '#5a3014' });
  // Viirinauha pöytien yllä: vihreä, valkoinen, punainen
  b.strokeStyle = '#b0805a';
  b.lineWidth = Math.max(1, u * 0.003);
  b.beginPath(); b.moveTo(L.tz, h * 0.04); b.quadraticCurveTo((L.tz + w) / 2, h * 0.1, w, h * 0.04); b.stroke();
  for (i = 0; i < 9; i++) {
    x = L.tz + (w - L.tz) * (i + 0.5) / 9;
    y = h * 0.04 + Math.sin((i + 0.5) / 9 * Math.PI) * h * 0.045;
    b.beginPath(); b.moveTo(x - u * 0.014, y); b.lineTo(x + u * 0.014, y); b.lineTo(x, y + u * 0.03); b.closePath();
    artFillPath(b, ['#5cc04a', '#ffffff', '#e0443e'][i % 3], y, y + u * 0.03, u * 0.014, { lineColor: '#9a6a4a' });
  }
  // Täytehylly
  x = L.bowls[0].x - L.bowlW * 0.62;
  artRoundRect(b, x, L.shelfY, L.bowls[5].x - L.bowls[0].x + L.bowlW * 1.24, h * 0.018, u * 0.006, '#c8884a', { lineColor: '#6a3a14' });
  artLimb(b, x + u * 0.03, L.shelfY + h * 0.018, x + u * 0.03, L.shelfY + h * 0.05, u * 0.01, '#a8683a', '#5a3014');
  artLimb(b, L.bowls[5].x + L.bowlW * 0.62 - u * 0.03, L.shelfY + h * 0.018, L.bowls[5].x + L.bowlW * 0.62 - u * 0.03, L.shelfY + h * 0.05, u * 0.01, '#a8683a', '#5a3014');
  // Kassakoneen hylly
  artRoundRect(b, L.reg.x - u * 0.06, L.reg.y, u * 0.12, h * 0.016, u * 0.005, '#c8884a', { lineColor: '#6a3a14' });
  // Työtaso: puulankut
  y = h * 0.44;
  artRoundRect(b, L.zx0 - u * 0.02, y, L.zx1 - L.zx0 + u * 0.03, h - y + u * 0.02, u * 0.012, '#f0c890', { lineColor: '#8a5a2a' });
  b.fillStyle = 'rgba(138,90,42,0.14)';
  for (i = 1; i < 6; i++) b.fillRect(L.zx0 - u * 0.01, y + (h - y) * i / 6, L.zx1 - L.zx0 + u * 0.01, Math.max(1, u * 0.003));
  artRoundRect(b, L.zx0 - u * 0.025, y - u * 0.01, L.zx1 - L.zx0 + u * 0.04, u * 0.022, u * 0.008, '#f8dcb0', { lineColor: '#8a5a2a' });
  // Työkalujen alustat
  for (i = 0; i < 6; i++) {
    x = L.zx0 + L.rowSp * (i + 0.5);
    pzzEll(b, x, L.rowY + u * 0.035, L.rowSp * 0.42, u * 0.022);
    b.fillStyle = 'rgba(255,255,255,0.3)';
    b.fill();
  }
  // Pöytäalue: lattialaatat ja parvi ylemmälle pöydälle
  T = L.tables[1];
  y = T.y + u * 0.085;
  b.fillStyle = '#f0c8a0';
  b.fillRect(L.tz - u * 0.01, y, w - L.tz + u * 0.02, h - y);
  b.fillStyle = 'rgba(200,110,70,0.25)';
  for (x = L.tz; x < w; x += u * 0.06) for (st = 0; st < 3; st++) if ((Math.round((x - L.tz) / (u * 0.06)) + st) % 2 === 0) b.fillRect(x, y + st * u * 0.03, u * 0.06, u * 0.03);
  T = L.tables[0];
  y = T.y + u * 0.1;
  artRoundRect(b, L.tz - u * 0.01, y, w - L.tz + u * 0.03, u * 0.028, u * 0.008, '#c8884a', { lineColor: '#6a3a14' });
  b.fillStyle = 'rgba(90,48,20,0.18)';
  b.fillRect(L.tz, y + u * 0.028, w - L.tz, u * 0.02);
  for (x = L.tz + u * 0.03; x < w; x += u * 0.07) artLimb(b, x, y + u * 0.028, x, y + u * 0.06, u * 0.008, '#e0a868', '#6a3a14');
  // Pöytäalueen reunus
  b.fillStyle = 'rgba(160,90,50,0.15)';
  b.fillRect(L.tz - u * 0.012, h * 0.03, u * 0.008, h);
  pzzRenderOven();
  pzzRenderTable();
}

// ---------- Vihjekäsi ----------
function pzzHintPos(st, k) {
  var a = st.from, b = st.to, m, R = pzz.L.R, ang;
  if (pzzRubKind(st.kind)) {
    if (k < 0.25) { m = easeInOutSine(k / 0.25); return { x: a.x + (b.x - a.x) * m, y: a.y + (b.y - a.y) * m - Math.sin(m * Math.PI) * viewH * 0.04, press: 1 }; }
    m = (k - 0.25) / 0.75;
    if (st.kind === 'roll') return { x: b.x + Math.sin(m * Math.PI * 6) * R * 0.7, y: b.y + Math.sin(m * Math.PI * 2) * R * 0.25, press: 1 };
    ang = m * Math.PI * 4;
    return { x: b.x + Math.cos(ang) * R * 0.5, y: b.y + Math.sin(ang) * R * 0.5 * PZZ_SQ, press: 1 };
  }
  if (st.kind === 'cut') {
    if (k < 0.3) { m = easeInOutSine(k / 0.3); return { x: a.x + (b.x - R * 1.2 - a.x) * m, y: a.y + (b.y - a.y) * m, press: 1 }; }
    if (k < 0.75) { m = easeInOutSine((k - 0.3) / 0.45); return { x: b.x - R * 1.2 + m * R * 2.4, y: b.y, press: 1 }; }
    return { x: b.x + R * 1.2, y: b.y, press: Math.max(0, 1 - (k - 0.75) / 0.12) };
  }
  if (k < 0.2) return { x: a.x, y: a.y, press: k / 0.2 };
  if (k < 0.75) {
    m = easeInOutSine((k - 0.2) / 0.55);
    return { x: a.x + (b.x - a.x) * m, y: a.y + (b.y - a.y) * m - Math.sin(m * Math.PI) * viewH * 0.05, press: 1 };
  }
  return { x: b.x, y: b.y, press: Math.max(0, 1 - (k - 0.75) / 0.12) };
}
function pzzDrawHint(c) {
  var st = pzz.hintStep, k, p, s = viewH * 0.07, a, per = pzzRubKind(st && st.kind) ? 3.2 : (st && st.kind === 'cut' ? 2.0 : 2.2), u = pzz.L.u;
  if (!st || pzz.hintT < 0.4) return;
  k = ((pzz.hintT - 0.4) % per) / per;
  p = pzzHintPos(st, k);
  a = Math.min(1, (pzz.hintT - 0.4) * 3);
  if (p.press > 0.3) {
    c.globalAlpha = 0.55 * a * p.press;
    if (st.kind === 'top' || st.kind === 'topOff') pzzDrawTop(c, st.type, p.x, p.y, pzzTopR(), 0);
    else if (st.kind === 'dough') artCircle(c, p.x, p.y, u * 0.03, PZZ_DOUGH, { lineColor: '#c8a06a' });
    else if (st.kind === 'log') pzzDrawLog(c, p.x, p.y, u * 0.035, 0.3);
    else if (st.kind === 'roll') pzzDrawPin(c, p.x, p.y, u * 0.05, -0.15);
    else if (st.kind === 'sauce') pzzDrawLadle(c, p.x, p.y, u * 0.045, true);
    else if (st.kind === 'cheese') pzzDrawBag(c, p.x, p.y, u * 0.052, 0, true);
    else if (st.kind === 'cut') pzzDrawCutter(c, p.x, p.y, u * 0.05, globalT * 6);
    else if (st.kind === 'take' || st.kind === 'oven' || st.kind === 'serve' || st.kind === 'bin') {
      artCircle(c, p.x, p.y, pzz.L.R * 0.7, PZZ_COLS.gold, { lineColor: '#9a5a1a' });
      artCircle(c, p.x, p.y, pzz.L.R * 0.55, '#ffd060', { line: false, flat: true });
    }
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (k < 0.2 && !pzzRubKind(st.kind) && st.kind !== 'cut') { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - p.press) * s * -0.25, s);
  c.globalAlpha = 1;
}

// ---------- HUD ja juhla ----------
function pzzHudSlot(i) {
  var gap = viewH * 0.05, x = hudX() + viewH * 0.045 + i * gap + (i >= PZZ_PHASE_AT[1] ? viewH * 0.014 : 0) + (i >= PZZ_PHASE_AT[2] ? viewH * 0.014 : 0);
  return { x: x, y: viewH * 0.063 };
}
function pzzDrawPeel(c, x, y, s, gold, rot) {
  var col = gold ? '#ffd24f' : '#e8c890', line = gold ? '#a07010' : '#8a5a2a';
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  if (gold) artGlow(c, 0, -s * 0.4, s * 1.1, '#ffe27a', 0.45);
  artLimb(c, 0, s * 0.75, 0, -s * 0.1, s * 0.14, col, line);
  artRoundRect(c, -s * 0.42, -s * 0.95, s * 0.84, s * 0.85, s * 0.3, col, { lineColor: line, hi: 0.35 });
  artCircle(c, 0, -s * 0.52, s * 0.25, gold ? '#fff2a0' : PZZ_COLS.gold, { lineColor: line, flat: true });
  c.restore();
}
function pzzDrawHud(c) {
  var i, sl, n = pzz.orders.length, last = pzzHudSlot(n - 1), w, cur, gold = pzzGolden(), pop, g, j;
  w = last.x + viewH * 0.1 - hudX();
  drawHudPanel(c, hudX(), viewH * 0.018, w, viewH * 0.09, viewH * 0.025);
  for (i = 0; i < n; i++) {
    sl = pzzHudSlot(i);
    cur = false;
    for (j = 0; j < 2; j++) { g = pzz.groups[j]; if (g && g.o.idx === i) cur = true; }
    if (pzz.stars[i]) {
      pop = pzz.starPop > 0 ? 1 + pzz.starPop * 0.5 : 1;
      if (pzz.stars[i] === 2) drawStar(c, sl.x, sl.y, viewH * 0.02 * pop, 0, 0.3);
      else { c.globalAlpha = 0.85; drawStar(c, sl.x, sl.y, viewH * 0.018 * pop, 0, 0); c.globalAlpha = 1; artCircle(c, sl.x + viewH * 0.013, sl.y + viewH * 0.011, viewH * 0.006, '#ff9ec6', { line: false }); }
    } else {
      artCircle(c, sl.x, sl.y, viewH * (cur ? 0.018 + Math.sin(globalT * 4) * 0.002 : 0.014), cur ? '#fff6e0' : 'rgba(255,255,255,0.5)', { lineColor: cur ? '#d89a5a' : '#c8b0c8', flat: true });
      if (cur) {
        artCircle(c, sl.x, sl.y, viewH * 0.011, PZZ_COLS.gold, { lineColor: '#9a5a1a', flat: true });
        artCircle(c, sl.x, sl.y, viewH * 0.008, '#e0443e', { line: false, flat: true });
      }
    }
  }
  c.globalAlpha = gold ? 1 : 0.45;
  pzzDrawPeel(c, last.x + viewH * 0.055, viewH * 0.075, viewH * 0.04, gold, 0.35 + (pzz.goldLostT > 0 ? Math.sin(pzz.goldLostT * 30) * 0.2 : 0));
  c.globalAlpha = 1;
}
function pzzTrophyPizza() {
  var P = pzzNewPizza(), i, C = pzzCells(), t = PZZ_TOPS;
  P.size = 1; P.sauced = true; P.cheesed = true; P.q = 'gold'; P.pop = 0; P.cuts = 4; P.cutBase = 0.2;
  for (i = 0; i < C.length; i++) { P.sauce[C[i].k] = 1; P.cheese[C[i].k] = 1; }
  for (i = 0; i < 4; i++) P.cutAng.push(0.2 + i * Math.PI / 4);
  for (i = 0; i < 12; i++) P.tops.push({ type: t[i % 6], u: PZZ_SPOTS[i + 1][0] * 1.1, v: PZZ_SPOTS[i + 1][1] * 1.1, pop: 0, warm: 0, rot: i });
  return P;
}
function pzzDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, pzz.celT / 0.8)), gold = pzzGolden(), x = viewW / 2, y = H * 0.6, i;
  if (k <= 0) return;
  if (!pzz.trophy) pzz.trophy = pzzTrophyPizza();
  c.save();
  c.translate(x, y);
  c.scale(k * 1.6, k * 1.6);
  artGlow(c, 0, 0, H * 0.2, gold ? '#ffe27a' : '#ffd0e0', 0.6);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.15, Math.sin(globalT + i * Math.PI / 4) * H * 0.11, H * 0.012, globalT * 2, 0.4);
  pzzDrawPizza(c, pzz.trophy, 0, 0, H * 0.1, { sq: 0.8, mini: true });
  if (gold) {
    pzzDrawPeel(c, -H * 0.14, H * 0.01, H * 0.06, true, -0.5 + Math.sin(globalT * 3) * 0.1);
    pzzDrawPeel(c, H * 0.14, H * 0.01, H * 0.06, true, 0.5 - Math.sin(globalT * 3) * 0.1);
  }
  c.restore();
}

// ---------- Piirto: kokonaisuus ----------
function drawPizza() {
  var c = ctx, L = pzz.L, i, d, f, k, x, y, P, H = viewH, u, g, to, sc;
  if (!L || !beginPlayWorld()) return;
  u = L.u;
  pzzDrawWindow(c);
  propsDraw(c, 0);
  pzzDrawBowls(c);
  propsDraw(c, 2);
  if (pzz.ovenCv && pzz.ovenCv.width > 1) c.drawImage(pzz.ovenCv, 0, 0);
  pzzDrawOvenFire(c);
  pzzDrawOvenPizzas(c);
  propsDraw(c, 3);
  for (i = 0; i < 2; i++) {
    pzzDrawBoard(c, i);
    P = pzz.boards[i].P;
    if (P && P.where === 'board') pzzDrawPizza(c, P, L.boards[i].x, L.boards[i].y, L.R, {});
  }
  pzzDrawTools(c);
  pzzDrawTables(c);
  pzzDrawDog(c);
  // Lattialle pudonneet täytteet
  for (i = 0; i < pzz.floor.length; i++) { f = pzz.floor[i]; pzzDrawTop(c, f.type, f.x, f.y - pzzTopR() * 0.5, pzzTopR(), f.rot); }
  // Lentävät
  for (i = 0; i < pzz.flies.length; i++) {
    f = pzz.flies[i];
    if (f.kind === 'ember') {
      k = f.t / f.dur;
      c.globalAlpha = Math.max(0, 1 - k);
      artCircle(c, f.x0 + f.vx * f.t, f.y0 + f.vy * f.t + H * 0.4 * f.t * f.t, u * 0.006 * (1 - k * 0.5), k < 0.5 ? '#ffd24f' : '#ff7a2a', { line: false, flat: true });
      c.globalAlpha = 1;
      continue;
    }
    if (f.kind === 'fly') {
      k = f.t / f.dur;
      x = f.x0 + (f.x1 - f.x0) * k + Math.sin(f.t * 5) * u * 0.03;
      y = f.y0 + (f.y1 - f.y0) * k;
      pzzDrawButterfly(c, x, y, u * 0.02, f.t);
      continue;
    }
    if (f.t < (f.o.delay || 0)) continue;
    k = easeOutCubic((f.t - (f.o.delay || 0)) / f.dur);
    x = f.x0 + (f.x1 - f.x0) * k;
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * H * 0.06;
    if (f.kind === 'top') pzzDrawTop(c, f.o.type, x, y, pzzTopR(), 0);
    else if (f.kind === 'coin') artCircle(c, x, y, u * 0.012, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
    else if (f.kind === 'star') drawStar(c, x, y, H * 0.022 * (1 + Math.sin(k * Math.PI) * 0.6), k * 6, f.o.gold ? 0.8 : 0);
    else if (f.kind === 'slice') pzzDrawSlice(c, f.o.P, x, y, u * 0.024, Math.PI + k * 0.3, 0);
  }
  // Paikalleen palaavat pizzat
  for (i = 0; i < 4; i++) {
    P = i < 2 ? pzz.boards[i].P : pzz.oven[i - 2];
    if (!P || P.where !== 'fly' || !P.fly) continue;
    to = P.fly.to === 'oven' ? pzzSlotPos(P.si) : L.boards[P.bi];
    sc = P.fly.to === 'oven' ? 0.68 : 1;
    k = easeOutCubic(P.fly.t / 0.3);
    x = P.fly.x0 + (to.x - P.fly.x0) * k;
    y = P.fly.y0 + (to.y - P.fly.y0) * k - Math.sin(k * Math.PI) * H * 0.04;
    pzzDrawPizza(c, P, x, y, L.R * (1 + (sc - 1) * k), { sq: PZZ_SQ + (P.fly.to === 'oven' ? (0.42 - PZZ_SQ) * k : 0), noRing: true });
  }
  // Juustoraaste
  if (pzz.shreds.length) {
    c.strokeStyle = '#ffe270';
    c.lineWidth = Math.max(1, u * 0.004);
    c.lineCap = 'round';
    c.beginPath();
    for (i = 0; i < pzz.shreds.length; i++) { f = pzz.shreds[i]; c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(f.rot) * u * 0.008, f.y + Math.sin(f.rot) * u * 0.008); }
    c.stroke();
  }
  // Raahattava
  d = pzz.drag;
  if (d) pzzDrawDragged(c, d);
  pzzDrawPuffs(c);
  for (i = 0; i < 2; i++) { g = pzz.groups[i]; if (g && g.state === 'wait') pzzDrawBubble(c, g); }
  pzzDrawHint(c);
  pzzDrawEvening(c);
  drawParticlesLayer(c);
  if (celebrating) pzzDrawTrophy(c);
  endPlayWorld();
  pzzDrawHud(c);
  drawTaskOverlay(c);
}
function pzzDrawDragged(c, d) {
  var L = pzz.L, u = L.u, P, tilt;
  if (d.kind === 'pizza') {
    P = d.P;
    artShadow(c, d.x, d.y + u * 0.05, L.R * 1.05, L.R * 0.4, 0.18);
    pzzDrawPeel(c, d.x - L.R * 0.2, d.y + L.R * 1.1, L.R * 0.9, false, 0.2);
    pzzDrawPizza(c, P, d.x, d.y, L.R * 1.04, { noRing: true });
  } else if (d.kind === 'ball') artCircle(c, d.x, d.y, u * 0.032, PZZ_DOUGH, { lineColor: '#c8a06a', hi: 0.45 });
  else if (d.kind === 'pin') pzzDrawPin(c, d.x, d.y, u * 0.055, Math.sin(d.moved * 0.02) * 0.1);
  else if (d.kind === 'ladle') pzzDrawLadle(c, d.x, d.y, u * 0.048, true);
  else if (d.kind === 'bag') { tilt = Math.sin(globalT * 14) * 0.08; pzzDrawBag(c, d.x, d.y, u * 0.055, tilt, true); }
  else if (d.kind === 'cutter') pzzDrawCutter(c, d.x, d.y, u * 0.05, d.moved * 0.05);
  else if (d.kind === 'log') pzzDrawLog(c, d.x, d.y, u * 0.04, 0.3 + Math.sin(globalT * 6) * 0.05);
  else if (d.kind === 'top') pzzDrawTop(c, d.type, d.x, d.y, pzzTopR() * 1.2, 0);
}
function pzzDrawButterfly(c, x, y, s, t) {
  var f = Math.abs(Math.sin(t * 14));
  artBlob(c, x - s * 0.5 * f, y, s * 0.6 * f + s * 0.1, s * 0.5, '#ffb0e0', { lineColor: '#a04a8a', flat: true });
  artBlob(c, x + s * 0.5 * f, y, s * 0.6 * f + s * 0.1, s * 0.5, '#ffb0e0', { lineColor: '#a04a8a', flat: true });
  artBlob(c, x, y, s * 0.12, s * 0.45, '#5a3a5a', { line: false, flat: true });
}
function pzzDrawPuffs(c) {
  var i, p, a, r;
  for (i = 0; i < pzz.puffs.length; i++) {
    p = pzz.puffs[i];
    a = 1 - p.t / p.life;
    c.globalAlpha = Math.max(0, a * 0.75);
    r = p.r * (1 + p.t);
    if (p.heart) { pzzHeartPath(c, p.x, p.y, r * 1.2); c.fillStyle = p.col; c.fill(); }
    else if (p.note) { pzzText(c, '♪', p.x, p.y, r * 2.4, p.col, '#ffffff'); }
    else { c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill(); }
  }
  c.globalAlpha = 1;
}
function pzzDrawEvening(c) {
  var ev = Math.max(0, pzz.dayK - 1), mo = Math.max(0, 1 - pzz.dayK), L = pzz.L;
  if (mo > 0) { c.fillStyle = 'rgba(255,210,170,' + (0.06 * mo) + ')'; c.fillRect(0, 0, viewW, viewH); }
  if (ev <= 0) return;
  c.fillStyle = 'rgba(120,80,170,' + (0.1 * ev) + ')';
  c.fillRect(0, 0, viewW, viewH);
  artGlow(c, L.ovenX, L.ovenY - L.mouthH * 0.5, viewH * 0.45, '#ffb060', 0.18 * ev);
}

// ---------- Kartan kuvake ----------
// Pizza, josta on vedetty pala irti, ja pieni puu-uuni
HUB_ICONS.pizza = function (c, x, y, s) {
  var r = s * 0.24, i, a;
  c.beginPath();
  c.moveTo(x - r * 1.9, y + r * 0.9);
  c.lineTo(x - r * 1.9, y + r * 0.1);
  c.quadraticCurveTo(x - r * 1.9, y - r * 0.6, x - r * 1.25, y - r * 0.6);
  c.quadraticCurveTo(x - r * 0.6, y - r * 0.6, x - r * 0.6, y + r * 0.1);
  c.lineTo(x - r * 0.6, y + r * 0.9);
  c.closePath();
  artFillPath(c, '#e07a4c', y - r * 0.6, y + r * 0.9, r, { lineColor: '#7a3418' });
  artBlob(c, x - r * 1.25, y + r * 0.55, r * 0.35, r * 0.3, '#ff9a3a', { line: false, flat: true });
  artCircle(c, x + r * 0.35, y + r * 0.3, r * 1.0, PZZ_COLS.gold, { lineColor: '#9a5a1a' });
  artCircle(c, x + r * 0.35, y + r * 0.3, r * 0.84, '#d23a28', { line: false, flat: true });
  artCircle(c, x + r * 0.35, y + r * 0.3, r * 0.76, '#ffd060', { line: false, flat: true });
  for (i = 0; i < 4; i++) { a = i * 1.57 + 0.5; pzzDrawTop(c, ['pep', 'shroom', 'olive', 'basil'][i], x + r * 0.35 + Math.cos(a) * r * 0.45, y + r * 0.3 + Math.sin(a) * r * 0.42, r * 0.22, 0); }
  pzzDrawSlice(c, { q: 'gold', tops: [{ type: 'pep' }], where: 'table', bt: 1 }, x + r * 1.2, y - r * 0.75, r * 0.6, Math.PI - 0.5, 0);
};
