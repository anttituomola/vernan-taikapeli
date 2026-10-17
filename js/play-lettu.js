'use strict';

// Lettukahvila (Kaukamaa, Pilvilinna): Pupujen leipomon logiikka vaikeampana
// ja reaaliaikaisena. Yksi ruutu, kaikki raahaamalla:
//   - Taivaan asiakkaat (pikkupilvet eri sävyissä, pöllö, kuupupu, lintu,
//     kuumailmapallokarhu, tähti) leijuvat tiskille. Kuplassa on kuva
//     tilauksesta: N letun pino ja täytteet (mansikka- ja mustikkahillo,
//     kermavaahto, mansikat, suklaa, sokeritähdet).
//   - Taikinakannu raahataan pannulle -> letun alapuoli paistuu: reuna
//     kullastuu, raaka pinta kuplii, pannu sihisee ja höyryää, ja pannun
//     ympärillä kasvava rengas ennakoi kultaisen hetken. Kultaisen renkaan
//     aikana pannun napautus kääntää letun lastalla (LKF_GOLD). Myöhään
//     käännetty on "vähän palanut": asiakas ottaa sen hassusti yskien, mutta
//     kultainen lasta menetetään. Liian kauan pannulla -> hiiltynyt letku
//     savuaa, piippaa ja tukkii pannun, kunnes se raahataan roskikseen.
//   - Toinen puoli paistuu samoin; kultaisena letku raahataan lautaselle
//     pinoon. Täytteet raahataan purkeista pinon päälle; määrä ratkaisee.
//     Täytteen saa pois raahaamalla sen takaisin purkkiin, koko lautasen
//     tyhjäksi roskikseen.
//   - Lautanen raahataan asiakkaalle. Väärä yksityiskohta: asiakas ravistaa
//     päätään, kuplan väärä kohta sykkii ja lautanen palaa korjattavaksi.
// Kolme vaihetta (aamu, päivä, ilta; valo vaihtuu):
//   1. yksi asiakas kerrallaan, 2 pannua, 1 lautanen, 2–3 letun pino ja yksi
//      täyte kuvina (opettelu)
//   2. kaksi asiakasta yhtä aikaa ja kärsivällisyyssydän, joka tyhjenee
//      hitaasti (tyhjänä asiakas huokaa, istahtaa pilvipuffille ja odottaa:
//      ei epäonnistumista, mutta kultainen lasta menee); 3 pannua,
//      2 lautasta, täytteet 1–4 kuvina, joskus kaksi lajia
//   3. numerot kuvien sijaan, laskut ("2 + 1"), "sama kuin tuolla" -asiakas
//      ja asiakas, jonka kupla sulkeutuu hetken päästä (napautus kurkistaa
//      uudestaan, mutta kärsivällisyys hupenee: muistihaaste). Kultainen
//      ikkuna kapenee.
// Tilaukset ja asiakkaat arvotaan joka kerta. Ensimmäisellä kerralla jokainen
// uusi ele näytetään haamukädellä; toimettomuuden jälkeen käsi näyttää
// seuraavan vaiheen. Kultainen lasta (+1 tähti), jos yksikään letku ei
// palanut eikä kenenkään kärsivällisyys loppunut. Vaiheiden välissä käy
// tavarantoimittajan ilmapallo: maksa (rahat) ja vastaa kysymykseen.

var LKF_TOPS = ['jamS', 'cream', 'berry', 'jamB', 'choco', 'star'];
var LKF_TOP_COL = { jamS: '#ff5a78', cream: '#fffaf4', berry: '#ff4a5a', jamB: '#7a6cf0', choco: '#8a5236', star: '#ffd24f' };
var LKF_KINDS = [
  { k: 'pup', tint: null }, { k: 'pup', tint: '#ffd6e8' }, { k: 'pup', tint: '#d8f5e4' }, { k: 'pup', tint: '#fff3c4' },
  { k: 'pup', tint: '#e6dcff' }, { k: 'owl' }, { k: 'moon' }, { k: 'bird' }, { k: 'bear' }, { k: 'star' }
];
// Tilaukset vaiheittain: n = lettuja (alin..ylin), t = täytelajeja, c = kpl
// per laji. Illan tilaukset (late): sum, same, peek ja two tai big.
var LKF_PLAN = [
  { ph: 0, n: [2, 2], t: 1, c: [1, 1] }, { ph: 0, n: [3, 3], t: 1, c: [2, 2] }, { ph: 0, n: [2, 3], t: 1, c: [1, 3] },
  { ph: 1, n: [2, 3], t: 1, c: [2, 4] }, { ph: 1, n: [3, 4], t: 1, c: [1, 3] }, { ph: 1, n: [2, 3], t: 2, c: [1, 2] },
  { ph: 1, n: [3, 4], t: 2, c: [1, 3] },
  { ph: 2, late: true }, { ph: 2, late: true }, { ph: 2, late: true }, { ph: 2, late: true }
];
var LKF_PHASE_AT = [0, 3, 7];         // vaiheen ensimmäinen tilaus
var LKF_PHASE_END = [3, 7, 11];       // vaihe loppuu, kun näin monta on palveltu
var LKF_PANS = [2, 3, 3];             // pannuja käytössä vaiheittain
var LKF_PLATES = [1, 2, 2];           // lautasia vaiheittain
var LKF_JARS = [3, 6, 6];             // täytepurkkeja auki vaiheittain
var LKF_SPOTS = [1, 2, 2];            // asiakkaita tiskillä yhtä aikaa
var LKF_COOK1 = 2.6;                  // ensimmäinen puoli raa'asta kultaiseksi (s)
var LKF_COOK2 = 2.0;                  // toinen puoli (s)
var LKF_GOLD = [1.5, 1.25, 1.0];       // kääntöikkuna vaiheittain (s)
var LKF_GOLD2 = [2.0, 1.7, 1.4];       // ottoikkuna toiselle puolelle (s)
var LKF_CHAR = 2.2;                   // vähän palaneesta hiiltyneeksi (s)
var LKF_FLIP_T = 0.42;                // käännön animaatio (s)
var LKF_PATIENCE = [0, 24, 28];       // kärsivällisyyden pohja (s) vaiheittain
var LKF_PAT_PER = 3;                  // + s per letku ja täyte
var LKF_PEEK_SHOW = 3.2;              // muistikupla auki saapuessa (s)
var LKF_PEEK_AGAIN = 1.5;             // kurkistus napautuksesta (s)
var LKF_PEEK_COST = 0.1;              // kurkistus vie kärsivällisyyttä (osuus)
var LKF_ARRIVE_GAP = [1.2, 2.2, 1.6]; // seuraava asiakas lähdön jälkeen (s)
var LKF_SECOND_GAP = [0, 6, 3.5];     // toinen asiakas ensimmäisen jälkeen (s)
var LKF_STACK_MAX = 5;                // lettuja lautasella enintään
var LKF_HINT_IDLE = 7;                // vihjekäsi toimettomuuden jälkeen (s)
var LKF_SLOTS = [
  [0, -0.05], [-0.5, -0.2], [0.5, -0.2], [-0.3, 0.45], [0.3, 0.45], [-0.26, -0.62], [0.26, -0.62], [0.66, 0.25], [-0.66, 0.25]
];
var LKF_BATTER = '#fbeccb';
var LKF_COLS = { raw: '#f8e4b8', gold: '#f0b13e', bit: '#a8622a', char: '#3a2a26' };

var lkf = {
  L: null, t: 0, idleT: 0, ph: 0, dayK: 0, orders: [], nextO: 0, served: 0, spots: [null, null],
  leavers: [], arriveT: 0, seq: 0, pans: [], plates: [], drag: null, flies: [], puffs: [], shown: {},
  burnt: 0, patOut: 0, misses: 0, hintStep: null, hintT: 0, flow: 'play', flowT: 0, taskIdx: 0,
  van: null, stars: [], celT: 0, jug: null, binT: 0, sizzleT: 0, jarsK: 1, pansK: 1, platesK: 1,
  goldLostT: 0, starPop: 0, regPop: 0, starsGiven: false
};

// ---------- Asettelu ----------
function lkfLayout() {
  var W = viewW, H = viewH, L = { W: W, H: H }, i, lw, sp, x0, x1, sh;
  L.rz = W - H * 0.55;
  L.counterY = H * 0.62;
  L.custY = L.counterY + H * 0.025;
  L.custS = H * 0.095;
  L.spots2 = [W - H * 0.405, W - H * 0.14];
  L.spot1 = W - H * 0.27;
  L.bubbleY = H * 0.235;
  lw = L.rz - H * 0.02;
  L.lw = lw;
  // Täytepurkit hyllyllä
  x0 = H * 0.2;
  sp = Math.min(H * 0.13, (lw - H * 0.05 - x0) / 5);
  sh = Math.max(0, (lw - H * 0.05 - x0 - sp * 5) / 2);
  L.jars = [];
  for (i = 0; i < 6; i++) L.jars.push({ x: x0 + sh + i * sp, y: H * 0.255 });
  L.shelfY = H * 0.262;
  // Pannut liedellä
  x0 = H * 0.28;
  sp = Math.min(H * 0.25, (lw - H * 0.1 - x0) / 2);
  sh = Math.max(0, (lw - H * 0.1 - x0 - sp * 2) / 2);
  L.pans = [];
  for (i = 0; i < 3; i++) L.pans.push({ x: x0 + sh + i * sp, y: H * 0.5 });
  L.panRx = H * 0.085;
  L.panRy = H * 0.04;
  L.lRx = H * 0.064;
  L.lRy = H * 0.029;
  L.stove = { x0: L.pans[0].x - H * 0.12, x1: L.pans[2].x + H * 0.115, y0: H * 0.42, y1: H * 0.66 };
  L.jug = { x: H * 0.08, y: H * 0.62 };
  L.tableY = H * 0.68;
  // Lautaset työpöydällä
  x0 = H * 0.21;
  x1 = lw - H * 0.12;
  L.plates = [{ x: x0 + (x1 - x0) * 0.25, y: H * 0.84 }, { x: x0 + (x1 - x0) * 0.78, y: H * 0.84 }];
  L.plRx = H * 0.1;
  L.plRy = H * 0.032;
  L.sRx = H * 0.07;
  L.sRy = H * 0.026;
  L.sStep = H * 0.018;
  L.bin = { x: H * 0.085, y: H * 0.93 };
  L.cocoa = { x: lw - H * 0.05, y: H * 0.88 };
  L.clock = { x: H * 0.072, y: H * 0.45 };
  L.porthole = { x: H * 0.072, y: H * 0.235 };
  L.tip = { x: L.rz + H * 0.04, y: L.counterY };
  L.sleeper = { x: W - H * 0.1, y: H * 0.975 };
  lkf.L = L;
}
function lkfSpotX(i) {
  var L = lkf.L;
  return LKF_SPOTS[lkf.ph] === 1 ? L.spot1 : L.spots2[i];
}

// ---------- Pienet apurit ----------
function lkfEll(c, x, y, rx, ry) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  else { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); }
}
function lkfEllArc(c, x, y, rx, ry, a0, a1, ccw) {
  if (c.ellipse) { c.ellipse(x, y, rx, ry, 0, a0, a1, !!ccw); return; }
  c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, a0, a1, !!ccw); c.restore();
}
function lkfText(c, txt, x, y, size, col, line) {
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
function lkfHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
}
function lkfPuff(x, y, n, col, o) {
  var i;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (lkf.puffs.length > 70) lkf.puffs.shift();
    lkf.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * (o.spread || 0.03), y: y + (Math.random() - 0.5) * viewH * 0.015,
      vx: (Math.random() - 0.5) * viewH * (o.big ? 0.22 : 0.06), vy: -viewH * (o.up || (0.05 + Math.random() * 0.07)),
      r: viewH * (o.big ? 0.022 : (o.r || 0.011)) * (0.7 + Math.random() * 0.6), t: 0, life: o.life || (0.8 + Math.random() * 0.6),
      col: col || '#ffffff', heart: !!o.heart
    });
  }
}
function lkfAct() { lkf.idleT = 0; }
// Kypsyys: 0..1 raaka -> kultainen, 1 = kultainen ikkuna, 1..2 vähän
// palanut, >= 2 hiiltynyt
function lkfSideK(Lt) {
  var cook = Lt.side === 1 ? LKF_COOK1 : LKF_COOK2, gold = Lt.side === 1 ? LKF_GOLD[lkf.ph] : LKF_GOLD2[lkf.ph];
  if (Lt.t < cook) return Lt.t / cook;
  if (Lt.t < cook + gold) return 1;
  return 1 + (Lt.t - cook - gold) / LKF_CHAR;
}
// Kultaisen ikkunan jäljellä oleva osuus (1 -> 0)
function lkfGoldLeft(Lt) {
  var cook = Lt.side === 1 ? LKF_COOK1 : LKF_COOK2, gold = Lt.side === 1 ? LKF_GOLD[lkf.ph] : LKF_GOLD2[lkf.ph];
  return Math.max(0, Math.min(1, 1 - (Lt.t - cook) / gold));
}
function lkfCookCol(k) {
  var C = LKF_COLS;
  if (k <= 1) return artMix(C.raw, C.gold, Math.max(0, k));
  if (k < 2) return artMix(C.gold, C.bit, k - 1);
  return C.char;
}
function lkfQCol(q) { return q === 'gold' ? LKF_COLS.gold : q === 'bit' ? artMix(LKF_COLS.gold, LKF_COLS.bit, 0.75) : LKF_COLS.char; }
function lkfWorse(a, b) {
  var r = { gold: 0, bit: 1, char: 2 };
  return r[a] >= r[b] ? a : b;
}

// ---------- Tilaukset ----------
function lkfPickDiff(n, prev) {
  var k = randInt(n);
  if (k === prev && n > 1) k = (k + 1 + randInt(n - 1)) % n;
  return k;
}
function lkfRange(r) { return r[0] + randInt(r[1] - r[0] + 1); }
function lkfMakeTops(nTypes, cnt, pool, prevMain) {
  var out = [], types = shuffleNums(pool.slice()), i;
  if (types[0] === prevMain && types.length > 1) { types.push(types.shift()); }
  for (i = 0; i < nTypes; i++) out.push({ type: types[i], n: lkfRange(cnt) });
  return out;
}
function lkfMakeOrders() {
  var out = [], i, P, o, kinds = [], pool = [], k, prev = null, late, li = 0, a, b, pool0 = LKF_TOPS.slice(0, LKF_JARS[0]);
  // Asiakkaat: sekoitettu jono ilman peräkkäisiä samoja
  while (kinds.length < LKF_PLAN.length) {
    if (!pool.length) pool = shuffleNums(LKF_KINDS.slice());
    k = pool.shift();
    if (kinds.length && kinds[kinds.length - 1] === k && pool.length) { pool.push(k); continue; }
    kinds.push(k);
  }
  // Illan tilaukset: "sama kuin" ei ensimmäisenä (toinen asiakas puuttuu)
  // ja edellinen ei ole muistiasiakas (sen kuplaa ei voi verrata)
  do {
    late = shuffleNums(['sum', 'same', 'peek', Math.random() < 0.5 ? 'two' : 'big']);
    k = late.indexOf('same');
  } while (k === 0 || late[k - 1] === 'peek');
  for (i = 0; i < LKF_PLAN.length; i++) {
    P = LKF_PLAN[i];
    o = { idx: i, ph: P.ph, n: 2, tops: [], pics: P.ph < 2, kind: 'plain', ck: kinds[i], perfect: true, ref: null };
    if (!P.late) {
      o.n = lkfRange(P.n);
      o.tops = lkfMakeTops(P.t, P.c, P.ph === 0 ? pool0 : LKF_TOPS, prev);
    } else {
      o.kind = late[li++];
      lkfLateOrder(o, prev);
    }
    prev = o.tops.length ? o.tops[0].type : null;
    out.push(o);
  }
  return out;
}
function lkfLateOrder(o, prev) {
  var a, b;
  if (o.kind === 'two' || o.kind === 'same') {
    o.n = 2 + randInt(3);
    o.tops = lkfMakeTops(2, [1, 4], LKF_TOPS, prev);
  } else if (o.kind === 'sum') {
    a = 1 + randInt(3);
    b = 1 + randInt(3);
    o.n = 2 + randInt(2);
    o.tops = lkfMakeTops(1, [1, 1], ['jamS', 'jamB', 'cream', 'berry'], prev);
    o.tops[0].n = a + b;
    o.tops[0].sum = [a, b];
  } else if (o.kind === 'peek') {
    o.n = 2 + randInt(3);
    o.tops = lkfMakeTops(1 + randInt(2), [1, 3], LKF_TOPS, prev);
  } else {
    o.n = 4;
    o.tops = lkfMakeTops(1, [3, 5], LKF_TOPS, prev);
  }
}
function lkfTopCount(tops, type) {
  var i, n = 0;
  for (i = 0; i < tops.length; i++) if (tops[i].type === type) n++;
  return n;
}
function lkfOrderNeed(o, type) {
  var i;
  for (i = 0; i < o.tops.length; i++) if (o.tops[i].type === type) return o.tops[i].n;
  return 0;
}
// Ensimmäinen ero tilaukseen: null = kaikki oikein
function lkfCheck(pl, o) {
  var i;
  if (pl.items.length !== o.n) return { part: 'n' };
  for (i = 0; i < o.tops.length; i++) if (lkfTopCount(pl.tops, o.tops[i].type) !== o.tops[i].n) return { part: 'top', i: i };
  for (i = 0; i < pl.tops.length; i++) if (!lkfOrderNeed(o, pl.tops[i].type)) return { part: 'extra', type: pl.tops[i].type };
  return null;
}
// Sopiiko lautasen nykyinen sisältö vielä tilaukseen (vihje ja botti)
function lkfCompatible(pl, o) {
  var i;
  if (pl.items.length > o.n) return false;
  if (pl.tops.length && pl.items.length < o.n) return false;
  for (i = 0; i < pl.items.length; i++) if (pl.items[i].q === 'char') return false;
  return true;
}

// ---------- Alustus ----------
function initLettu() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'answer', { minLen: 4, maxLen: 9 })];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  lkfLayout();
  lkf.t = 0;
  lkf.idleT = 0;
  lkf.ph = 0;
  lkf.dayK = 0;
  lkf.orders = lkfMakeOrders();
  lkf.nextO = 0;
  lkf.served = 0;
  lkf.spots = [null, null];
  lkf.leavers = [];
  lkf.arriveT = 0.6;
  lkf.seq = 0;
  lkf.pans = [];
  for (i = 0; i < 3; i++) lkf.pans.push({ L: null, ring: 0, wob: 0, sizz: Math.random() });
  lkf.plates = [];
  for (i = 0; i < 2; i++) lkf.plates.push({ items: [], tops: [], where: 'home', fly: null, pop: 0, wob: 0 });
  lkf.drag = null;
  lkf.flies = [];
  lkf.puffs = [];
  lkf.shown = {};
  lkf.burnt = 0;
  lkf.patOut = 0;
  lkf.misses = 0;
  lkf.hintStep = null;
  lkf.hintT = 0;
  lkf.flow = 'play';
  lkf.flowT = 0;
  lkf.taskIdx = 0;
  lkf.van = null;
  lkf.stars = [];
  lkf.celT = 0;
  lkf.jug = null;
  lkf.binT = 0;
  lkf.sizzleT = 0;
  lkf.jarsK = 1;
  lkf.pansK = 1;
  lkf.platesK = 1;
  lkf.goldLostT = 0;
  lkf.starPop = 0;
  lkf.regPop = 0;
  lkf.starsGiven = false;
  lkfSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.3);
  playNote(659, 0.14, 0.2, 'triangle', 0.3);
  playNote(880, 0.28, 0.35, 'triangle', 0.3);
}
function respawnLettu() {}
function resizeLettu() {
  var i, cu;
  camX = 0;
  lkfLayout();
  lkfSetupProps();
  // Asiakkaat ja lautaset uusille paikoilleen
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (!cu) continue;
    cu.tx = lkfSpotX(cu.spot);
    if (cu.state !== 'enter') cu.x = cu.tx;
  }
  lkf.leavers = [];
  if (lkf.drag) lkfCancelDrag();
  lkf.flies = [];
  for (i = 0; i < lkf.plates.length; i++) lkf.plates[i].where = 'home';
  for (i = 0; i < lkf.pans.length; i++) if (lkf.pans[i].L && lkf.pans[i].L.where !== 'pan') lkf.pans[i].L.where = 'pan';
  lkf.jug = null;
}

// ---------- Asiakasvirta ----------
function lkfFreeSpot() {
  var n = LKF_SPOTS[lkf.ph], i;
  for (i = 0; i < n; i++) if (!lkf.spots[i]) return i;
  return -1;
}
function lkfCustCount() {
  var i, n = 0;
  for (i = 0; i < 2; i++) if (lkf.spots[i]) n++;
  return n;
}
function lkfSpawnCustomer(spot) {
  var o = lkf.orders[lkf.nextO], other = lkf.spots[1 - spot], cu, k;
  lkf.nextO++;
  if (o.kind === 'same') {
    // "Sama kuin tuolla": kopio viereisen asiakkaan tilauksesta
    if (other && other.state !== 'leave' && other.state !== 'happy' && other.o.kind !== 'same') {
      o.n = other.o.n;
      o.tops = [];
      for (k = 0; k < other.o.tops.length; k++) o.tops.push({ type: other.o.tops[k].type, n: other.o.tops[k].n, sum: other.o.tops[k].sum });
      o.ref = other;
    } else {
      o.kind = 'two';
    }
  }
  cu = {
    o: o, kind: o.ck.k, tint: o.ck.tint, spot: spot, tx: lkfSpotX(spot), x: lkf.L.W + viewH * 0.3,
    yOff: -viewH * 0.12, state: 'enter', t: 0, seed: Math.random() * 10, pat: 1, patT: 999, sits: false,
    hop: 0, shakeT: 0, sighT: 0, joyT: 0, coughT: 0, pop: 0, waveT: 0, lookT: 0, hold: null, peekT: 0,
    miss: null, seq: lkf.seq++
  };
  if (lkf.ph >= 1) cu.patT = LKF_PATIENCE[lkf.ph] + LKF_PAT_PER * (o.n + lkfOrderTopsTotal(o));
  lkf.spots[spot] = cu;
}
function lkfOrderTopsTotal(o) {
  var i, n = 0;
  for (i = 0; i < o.tops.length; i++) n += o.tops[i].n;
  return n;
}
function lkfUpdateFlow(dt) {
  var i, cu, lv, sp = viewH * 0.7, fs, k;
  for (i = lkf.leavers.length - 1; i >= 0; i--) {
    lv = lkf.leavers[i];
    lv.t += dt;
    lv.x += sp * dt;
    lv.yOff -= viewH * 0.25 * dt;
    if (lv.x > lkf.L.W + viewH * 0.4) lkf.leavers.splice(i, 1);
  }
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (!cu) continue;
    if (cu.state === 'enter') {
      k = Math.min(1, dt * 3.2);
      cu.x += Math.max(-sp * dt, (cu.tx - cu.x) * k * 1.4);
      cu.yOff *= Math.max(0, 1 - dt * 4);
      if (Math.abs(cu.x - cu.tx) < viewH * 0.004) {
        cu.x = cu.tx;
        cu.yOff = 0;
        cu.state = 'wait';
        cu.pop = 0.4;
        if (cu.o.kind === 'peek') cu.peekT = LKF_PEEK_SHOW;
        lkfCustSound(cu.kind);
      }
    } else if (cu.state === 'wait') {
      if (cu.peekT > 0) {
        cu.peekT -= dt;
        if (cu.peekT <= 0) playNote(392, 0, 0.12, 'sine', 0.15);
      }
      if (lkf.flow === 'play' && lkf.ph >= 1 && !cu.sits) {
        cu.pat -= dt / cu.patT;
        if (cu.pat <= 0) {
          // Kärsivällisyys loppui: huokaus ja istahdus pilvipuffille
          cu.pat = 0;
          cu.sits = true;
          cu.sighT = 1.8;
          lkf.patOut++;
          lkf.goldLostT = 1.5;
          lkfPuff(cu.x, viewH * 0.45, 5, '#b8b0d0');
          playNote(330, 0, 0.35, 'sawtooth', 0.05);
          playNote(247, 0.3, 0.5, 'sawtooth', 0.05);
        }
      }
    } else if (cu.state === 'happy') {
      if (cu.t > 1.3) {
        cu.state = 'leave';
        lkf.leavers.push(cu);
        lkf.spots[i] = null;
        lkf.served++;
        lkf.arriveT = Math.max(lkf.arriveT, LKF_ARRIVE_GAP[lkf.ph]);
      }
    }
  }
  lkf.flowT += dt;
  if (lkf.flow === 'play') {
    if (lkf.nextO < LKF_PHASE_END[lkf.ph]) {
      fs = lkfFreeSpot();
      if (fs >= 0) {
        lkf.arriveT -= dt;
        if (lkf.arriveT <= 0) {
          lkfSpawnCustomer(fs);
          lkf.arriveT = LKF_SECOND_GAP[lkf.ph];
        }
      }
    } else if (lkf.served >= LKF_PHASE_END[lkf.ph] && !lkfCustCount()) {
      if (lkf.ph < 2) {
        lkf.flow = 'van';
        lkf.flowT = 0;
        lkf.van = { t: 0, leave: -1 };
        playNote(523, 0, 0.12, 'triangle', 0.15);
        playNote(659, 0.18, 0.12, 'triangle', 0.15);
      } else {
        lkf.flow = 'end';
        lkf.flowT = 0;
      }
    }
    return;
  }
  if (lkf.flow === 'van') {
    if (lkf.flowT < 1.6) return;
    lkfCancelDrag();
    lkf.flow = 'task';
    lkf.flowT = 0;
    taskStart(tasks[lkf.taskIdx]);
    return;
  }
  if (lkf.flow === 'task') {
    if (!tasks[lkf.taskIdx].opened) return;
    lkf.taskIdx++;
    lkf.van.leave = lkf.van.t;
    lkf.ph++;
    lkf.flow = 'play';
    lkf.flowT = 0;
    lkf.arriveT = 1.6;
    if (LKF_PANS[lkf.ph] > LKF_PANS[lkf.ph - 1]) lkf.pansK = 0;
    if (LKF_PLATES[lkf.ph] > LKF_PLATES[lkf.ph - 1]) lkf.platesK = 0;
    if (LKF_JARS[lkf.ph] > LKF_JARS[lkf.ph - 1]) lkf.jarsK = 0;
    for (i = 0; i < 4; i++) playNote([659, 784, 988, 1319][i], i * 0.12, 0.25, 'triangle', 0.25);
    return;
  }
  if (lkf.flow === 'end') {
    if (lkf.flowT > 1.2 && !lkf.drag) {
      lkf.flow = 'done';
      startCelebration();
      if (lkfGolden()) {
        // Kultainen lasta: +1 tähti (startCelebration antoi jo 2)
        starCoins += 1;
        starGain.n += 1;
        starGain.until = globalT + 3.2;
        saveProgress();
        spawnSparkles(viewW / 2, viewH * 0.45, 30, '#ffd24f');
      }
    }
  }
}
function lkfGolden() { return lkf.burnt === 0 && lkf.patOut === 0; }
function lkfCustSound(kind) {
  if (kind === 'owl') { playNote(392, 0, 0.22, 'sine', 0.25); playNote(330, 0.26, 0.32, 'sine', 0.25); return; }
  if (kind === 'bird') { playNote(1760, 0, 0.06, 'sine', 0.18); playNote(2093, 0.08, 0.06, 'sine', 0.18); playNote(1976, 0.16, 0.08, 'sine', 0.18); return; }
  if (kind === 'bear') { playNote(147, 0, 0.25, 'triangle', 0.3); playNote(196, 0.2, 0.3, 'triangle', 0.25); return; }
  if (kind === 'star') { playNote(1319, 0, 0.12, 'triangle', 0.2); playNote(1568, 0.08, 0.12, 'triangle', 0.2); playNote(2093, 0.16, 0.2, 'triangle', 0.2); return; }
  if (kind === 'moon') { soundBunny(); return; }
  playNote(659, 0, 0.1, 'sine', 0.25);
  playNote(880, 0.09, 0.16, 'sine', 0.25);
}

// ---------- Syöte ----------
function lkfPanHit(i, px, py) {
  var p = lkf.L.pans[i];
  return Math.pow((px - p.x) / (lkf.L.panRx * 1.2), 2) + Math.pow((py - p.y + viewH * 0.01) / (viewH * 0.075), 2) < 1;
}
function lkfPlateTopY(i, n) {
  var L = lkf.L;
  return L.plates[i].y - viewH * 0.016 - Math.max(0, n - 1) * L.sStep;
}
function lkfSlotWorld(i, n, k) {
  var L = lkf.L, s = LKF_SLOTS[k];
  return { x: L.plates[i].x + s[0] * L.sRx * 0.78, y: lkfPlateTopY(i, n) + s[1] * L.sRy * 0.85 };
}
function lkfTopR() { return viewH * 0.029; }
function handleLettuTap(px, py) {
  var L = lkf.L, i, j, p, pl, Lt, k, s, cu;
  if (!running || celebrating || puzzleBusy()) return;
  lkf.idleT = 0;
  if (lkf.drag) return;
  if (lkf.flow !== 'task' && lkf.flow !== 'done') {
    // Pannut: kääntö tai otto
    for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
      if (!lkfPanHit(i, px, py)) continue;
      p = lkf.pans[i];
      Lt = p.L;
      if (!Lt || Lt.where !== 'pan' || Lt.pour > 0) {
        p.wob = 0.3;
        playNote(1175, 0, 0.06, 'triangle', 0.1);
        return;
      }
      k = lkfSideK(Lt);
      if (Lt.flipT > 0) return;
      if (Lt.side === 1 && k < 2) {
        if (k >= 1) lkfFlip(i);
        else lkfNotYet(i);
        return;
      }
      if (Lt.side === 2 && k < 1) { lkfNotYet(i); return; }
      lkfStartDrag('lettu', px, py, { pan: i });
      return;
    }
    // Lautaset: täyte pois tai koko lautanen
    for (i = 0; i < LKF_PLATES[lkf.ph]; i++) {
      pl = lkf.plates[i];
      if (pl.where !== 'home') continue;
      for (j = pl.tops.length - 1; j >= 0; j--) {
        s = lkfSlotWorld(i, pl.items.length, pl.tops[j].slot);
        if (Math.hypot(px - s.x, py - (s.y - lkfTopR() * 0.5)) < lkfTopR() * 0.85) {
          lkfStartDrag('top', px, py, { type: pl.tops[j].type, from: 'plate', plate: i });
          pl.tops.splice(j, 1);
          return;
        }
      }
      if (pl.items.length && Math.abs(px - L.plates[i].x) < L.plRx * 1.05 && py < L.plates[i].y + viewH * 0.04 && py > lkfPlateTopY(i, pl.items.length) - viewH * 0.06) {
        lkfStartDrag('plate', px, py, { plate: i });
        return;
      }
    }
    // Täytepurkit
    if (lkf.jarsK > 0.9) {
      for (i = 0; i < LKF_JARS[lkf.ph]; i++) {
        if (Math.hypot(px - L.jars[i].x, py - (L.jars[i].y - viewH * 0.035)) < viewH * 0.058) { lkfStartDrag('top', px, py, { type: LKF_TOPS[i], from: 'jar' }); return; }
      }
    }
    // Taikinakannu
    if (!lkf.jug && Math.hypot(px - L.jug.x, py - (L.jug.y - viewH * 0.05)) < viewH * 0.07) { lkfStartDrag('jug', px, py, {}); return; }
  }
  // Kuplat (muistiasiakkaan kurkistus) ja asiakkaat
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (!cu || cu.state !== 'wait') continue;
    if (lkfBubbleTap(cu, px, py)) return;
  }
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (!cu || cu.state === 'leave') continue;
    if (Math.abs(px - cu.x) < viewH * 0.1 && py > viewH * 0.38 && py < L.counterY + viewH * 0.02) {
      cu.hop = 0.45;
      cu.pop = 0.3;
      lkfCustSound(cu.kind);
      spawnSparkles(cu.x, viewH * 0.5, 6, '#ff9ec6');
      return;
    }
  }
  propsTap(px, py);
}
function lkfNotYet(i) {
  var p = lkf.pans[i];
  p.wob = 0.35;
  playNote(196, 0, 0.1, 'sine', 0.15);
  lkfPuff(lkf.L.pans[i].x, lkf.L.pans[i].y - viewH * 0.02, 2, '#fff6e0');
  lkfAct();
}
function lkfFlip(i) {
  var p = lkf.pans[i], Lt = p.L, k = lkfSideK(Lt), P = lkf.L.pans[i];
  Lt.s1 = k <= 1 ? 'gold' : 'bit';
  Lt.side = 2;
  Lt.t = 0;
  Lt.flipT = LKF_FLIP_T;
  Lt.dinged = false;
  Lt.late = false;
  playNote(523, 0, 0.08, 'square', 0.06);
  playNote(1047, 0.05, 0.14, 'triangle', 0.25);
  if (Lt.s1 === 'gold') { spawnSparkles(P.x, P.y - viewH * 0.06, 8, '#ffd24f'); artPop(P.x, P.y - viewH * 0.02, viewH * 0.07, '#ffe27a', 'ring'); }
  lkf.shown.flip = true;
  lkfAct();
}
function lkfStartDrag(kind, px, py, o) {
  var d = { kind: kind, x: px, y: py, lx: px, ly: py, moved: 0 }, k, L = lkf.L, Lt, k2;
  for (k in o) if (o.hasOwnProperty(k)) d[k] = o[k];
  if (kind === 'lettu') {
    Lt = lkf.pans[d.pan].L;
    if (Lt.side === 1) Lt.q = 'char';
    else {
      k2 = lkfSideK(Lt);
      Lt.q = lkfWorse(Lt.s1, k2 <= 1 ? 'gold' : (k2 < 2 ? 'bit' : 'char'));
    }
    Lt.where = 'drag';
    d.x = L.pans[d.pan].x;
    d.y = L.pans[d.pan].y;
    playNote(330, 0, 0.08, 'square', 0.06);
    playNote(784, 0.05, 0.1, 'triangle', 0.2);
  }
  if (kind === 'plate') {
    lkf.plates[d.plate].where = 'drag';
    d.x = L.plates[d.plate].x;
    d.y = L.plates[d.plate].y;
  }
  if (kind === 'jug') { d.x = L.jug.x; d.y = L.jug.y - viewH * 0.05; }
  lkf.drag = d;
  playNote(880, 0, 0.07, 'sine', 0.18);
  lkfAct();
}

// ---------- Raahaus ja pudotus ----------
function lkfUpdateDrag(dt) {
  var d = lkf.drag, k, tx, ty;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 20);
    tx = lastPX;
    ty = lastPY;
    if (d.kind === 'lettu') ty += viewH * 0.02;
    if (d.kind === 'plate') ty += viewH * 0.06;
    if (d.kind === 'top') ty += lkfTopR() * 0.4;
    d.x += (tx - d.x) * k;
    d.y += (ty - d.y) * k;
    d.moved += Math.hypot(lastPX - d.lx, lastPY - d.ly);
    d.lx = lastPX;
    d.ly = lastPY;
    return;
  }
  lkf.drag = null;
  lkfDrop(d, lastPX, lastPY);
}
function lkfNearestPlate(px, py, maxD, needItems) {
  var i, n, d, best = -1, bd = maxD, L = lkf.L;
  for (i = 0; i < LKF_PLATES[lkf.ph]; i++) {
    if (lkf.plates[i].where !== 'home') continue;
    n = lkf.plates[i].items.length;
    if (needItems && !n) continue;
    d = Math.hypot(px - L.plates[i].x, (py - (lkfPlateTopY(i, n) - viewH * 0.01)) * 1.2);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function lkfOverBin(px, py) {
  var b = lkf.L.bin;
  return Math.hypot(px - b.x, py - (b.y - viewH * 0.06)) < viewH * 0.1;
}
function lkfCustAt(px, py) {
  var i, cu;
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (!cu || cu.state !== 'wait') continue;
    if (Math.abs(px - cu.x) < viewH * 0.135 && py > viewH * 0.08 && py < lkf.L.counterY + viewH * 0.1) return cu;
  }
  return null;
}
function lkfDrop(d, px, py) {
  var L = lkf.L, i, j, pl, best, bd, s, dd, used, Lt, cu;
  if (d.kind === 'jug') {
    // Lähin tyhjä pannu
    best = -1; bd = viewH * 0.16;
    for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
      if (lkf.pans[i].L) continue;
      dd = Math.hypot(px - L.pans[i].x, py - L.pans[i].y);
      if (dd < bd) { bd = dd; best = i; }
    }
    if (best >= 0 && lkf.flow === 'play') {
      lkf.pans[best].L = { side: 1, t: 0, where: 'pan', pour: 0.4, flipT: 0, s1: null, q: null, seed: Math.random() * 10, dinged: false, late: false, charred: false, burnt: false };
      lkf.jug = { pan: best, t: 0, x0: d.x, y0: d.y };
      playNote(262, 0, 0.18, 'sine', 0.2);
      playNote(392, 0.1, 0.25, 'sine', 0.15);
      lkfPuff(L.pans[best].x, L.pans[best].y - viewH * 0.02, 4, '#ffffff');
      lkf.shown.pour = true;
      lkfAct();
      return;
    }
    lkf.jug = { pan: -1, t: 0.4, x0: d.x, y0: d.y };
    return;
  }
  if (d.kind === 'lettu') {
    Lt = lkf.pans[d.pan].L;
    if (lkfOverBin(px, py)) {
      lkfBinIt(px, py, Lt.q === 'char' ? '#5a4a48' : '#f0c070');
      lkf.pans[d.pan].L = null;
      lkf.shown.bin = true;
      lkfAct();
      return;
    }
    i = lkfNearestPlate(px, py, viewH * 0.17, false);
    if (i >= 0) {
      pl = lkf.plates[i];
      if (Lt.q !== 'char' && !pl.tops.length && pl.items.length < LKF_STACK_MAX) {
        pl.items.push({ q: Lt.q, seed: Lt.seed, pop: 0.3 });
        lkf.pans[d.pan].L = null;
        pl.pop = 0.25;
        s = lkfPlateTopY(i, pl.items.length);
        artPop(L.plates[i].x, s, viewH * 0.06, '#ffe0b0', 'ring');
        lkfPuff(L.plates[i].x, s - viewH * 0.01, 3, '#ffffff');
        playNote(440 + pl.items.length * 60, 0, 0.12, 'triangle', 0.28);
        playNote(660 + pl.items.length * 60, 0.06, 0.14, 'triangle', 0.22);
        lkf.shown.take = true;
        lkfAct();
        return;
      }
      // Hiiltynyt, täytteet jo päällä tai pino täynnä: lautanen ei ota
      pl.wob = 0.4;
      if (Lt.q === 'char') lkfPuff(px, py - viewH * 0.02, 4, '#6a5a58');
      playNote(220, 0, 0.14, 'triangle', 0.18);
    }
    // Takaisin pannulle (paistuu edelleen)
    Lt.where = 'fly';
    Lt.fly = { x0: d.x, y0: d.y, t: 0 };
    return;
  }
  if (d.kind === 'top') {
    i = lkfNearestPlate(px, py, viewH * 0.13, true);
    if (i >= 0) {
      pl = lkf.plates[i];
      if (pl.tops.length < LKF_SLOTS.length) {
        used = {};
        for (j = 0; j < pl.tops.length; j++) used[pl.tops[j].slot] = true;
        best = -1; bd = 1e9;
        for (j = 0; j < LKF_SLOTS.length; j++) {
          if (used[j]) continue;
          s = lkfSlotWorld(i, pl.items.length, j);
          dd = Math.hypot(px - s.x, py - s.y) + j * 0.5;
          if (dd < bd) { bd = dd; best = j; }
        }
        pl.tops.push({ type: d.type, slot: best, pop: 0.3 });
        s = lkfSlotWorld(i, pl.items.length, best);
        artPop(s.x, s.y - lkfTopR() * 0.4, lkfTopR() * 1.3, '#ffffff', 'ring');
        spawnSparkles(s.x, s.y - lkfTopR() * 0.4, 4, LKF_TOP_COL[d.type]);
        playNote(880 + pl.tops.length * 70, 0, 0.12, 'triangle', 0.3);
        lkf.shown.top = true;
        lkfAct();
        return;
      }
      pl.wob = 0.4;
    }
    if (d.from === 'plate') { lkf.shown.topOff = true; lkfAct(); }
    i = LKF_TOPS.indexOf(d.type);
    lkfFly('top', d.x, d.y, L.jars[i].x, L.jars[i].y - viewH * 0.03, { type: d.type });
    return;
  }
  if (d.kind === 'plate') {
    pl = lkf.plates[d.plate];
    cu = lkfCustAt(px, py);
    if (cu) { lkfDeliver(d, cu); return; }
    if (lkfOverBin(px, py)) {
      // Koko lautanen tyhjäksi
      lkfBinIt(px, py, '#f0c070');
      pl.items = [];
      pl.tops = [];
      pl.where = 'home';
      pl.pop = 0.3;
      lkf.shown.dump = true;
      lkfAct();
      return;
    }
    lkfPlateHome(d.plate, d.x, d.y);
  }
}
function lkfBinIt(px, py, col) {
  var b = lkf.L.bin;
  lkf.binT = 0.6;
  lkfPuff(b.x, b.y - viewH * 0.09, 7, col, { big: true });
  playNote(392, 0, 0.1, 'sine', 0.25);
  playNote(262, 0.08, 0.16, 'sine', 0.2);
}
function lkfPlateHome(i, x, y) {
  var pl = lkf.plates[i];
  pl.where = 'fly';
  pl.fly = { x0: x, y0: y, t: 0 };
}
function lkfFly(kind, x0, y0, x1, y1, o) {
  var f = { kind: kind, x0: x0, y0: y0, x1: x1, y1: y1, t: 0, dur: 0.4, o: o || {} };
  lkf.flies.push(f);
  return f;
}
function lkfCancelDrag() {
  var d = lkf.drag, Lt, i;
  if (!d) return;
  lkf.drag = null;
  if (d.kind === 'lettu') { Lt = lkf.pans[d.pan].L; Lt.where = 'fly'; Lt.fly = { x0: d.x, y0: d.y, t: 0 }; }
  else if (d.kind === 'plate') lkfPlateHome(d.plate, d.x, d.y);
  else if (d.kind === 'top') { i = LKF_TOPS.indexOf(d.type); lkfFly('top', d.x, d.y, lkf.L.jars[i].x, lkf.L.jars[i].y - viewH * 0.03, { type: d.type }); }
  else lkf.jug = { pan: -1, t: 0.4, x0: d.x, y0: d.y };
}

// ---------- Ojennus asiakkaalle ----------
function lkfDeliver(d, cu) {
  var o = cu.o, pl = lkf.plates[d.plate], miss = lkfCheck(pl, o), i, bit = false, hs;
  lkf.shown.deliver = true;
  lkfAct();
  if (miss) {
    // Ei rangaistusta: asiakas ravistaa päätään, kuplan väärä kohta sykkii
    o.perfect = false;
    lkf.misses++;
    cu.miss = { part: miss.part, i: miss.i, type: miss.type, t: 2.6 };
    cu.shakeT = 0.9;
    if (o.kind === 'peek') cu.peekT = Math.max(cu.peekT, 2.6);
    playNote(392, 0, 0.16, 'triangle', 0.25);
    playNote(330, 0.16, 0.24, 'triangle', 0.25);
    lkfPlateHome(d.plate, d.x, d.y);
    return;
  }
  for (i = 0; i < pl.items.length; i++) if (pl.items[i].q === 'bit') bit = true;
  if (bit || cu.sits) o.perfect = false;
  cu.hold = { items: pl.items, tops: pl.tops };
  pl.items = [];
  pl.tops = [];
  pl.where = 'home';
  pl.pop = 0.3;
  cu.miss = null;
  cu.state = 'happy';
  cu.t = 0;
  cu.joyT = 1.3;
  cu.hop = 0.5;
  cu.sits = false;
  if (bit) {
    // Vähän palanut: hassu yskähdys, mutta kelpaa
    cu.coughT = 1.3;
    lkfPuff(cu.x - viewH * 0.05, viewH * 0.47, 6, '#8a7a7a');
    playNote(220, 0, 0.12, 'sawtooth', 0.07);
    playNote(196, 0.18, 0.12, 'sawtooth', 0.07);
    playNote(220, 0.36, 0.14, 'sawtooth', 0.06);
  }
  for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 1319, 1568][i], 0.05 + i * 0.07, 0.18, 'triangle', 0.25);
  spawnSparkles(cu.x, viewH * 0.5, 14, '#ff9ec6');
  for (i = 0; i < 3; i++) lkfFly('coin', cu.x - viewH * 0.04, viewH * 0.55, lkf.L.tip.x, lkf.L.tip.y - viewH * 0.05, { delay: i * 0.12 });
  hs = lkfHudSlot(o.idx);
  lkfFly('star', cu.x, viewH * 0.45, hs.x, hs.y, { gold: o.perfect, idx: o.idx, delay: 0.3 });
}

// ---------- Päivitys ----------
function updateLettu(dt) {
  var target;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  lkfUpdateFx(dt);
  if (celebrating) { lkf.celT += dt; return; }
  if (puzzleBusy()) return;
  lkf.t += dt;
  if (!holding) lkf.idleT += dt;
  target = lkf.ph;
  lkf.dayK += Math.max(-dt * 0.3, Math.min(dt * 0.3, target - lkf.dayK));
  if (lkf.pansK < 1) lkf.pansK = Math.min(1, lkf.pansK + dt * 1.5);
  if (lkf.platesK < 1) lkf.platesK = Math.min(1, lkf.platesK + dt * 1.5);
  if (lkf.jarsK < 1) lkf.jarsK = Math.min(1, lkf.jarsK + dt * 1.5);
  lkfUpdateDrag(dt);
  lkfUpdatePans(dt);
  lkfUpdateFlow(dt);
  lkf.hintStep = lkfNextStep();
  if (lkf.hintStep && !holding && !lkf.drag && (!lkf.shown[lkf.hintStep.kind] || lkf.idleT > LKF_HINT_IDLE)) lkf.hintT += dt;
  else lkf.hintT = 0;
}
function lkfUpdatePans(dt) {
  var i, p, Lt, k, P, L = lkf.L, live = lkf.flow === 'play' || lkf.flow === 'van', col;
  for (i = 0; i < 3; i++) {
    p = lkf.pans[i];
    if (p.ring > 0) p.ring -= dt;
    if (p.wob > 0) p.wob -= dt;
    Lt = p.L;
    if (!Lt) continue;
    P = L.pans[i];
    if (Lt.pour > 0) Lt.pour -= dt;
    if (Lt.where === 'fly') {
      Lt.fly.t += dt;
      if (Lt.fly.t >= 0.3) Lt.where = 'pan';
      continue;
    }
    if (Lt.where !== 'pan' || !live) continue;
    if (Lt.flipT > 0) {
      Lt.flipT -= dt;
      if (Lt.flipT <= 0) { lkfPuff(P.x, P.y - viewH * 0.01, 3, '#ffffff'); playNote(180, 0, 0.08, 'sine', 0.2); }
    }
    Lt.t += dt;
    k = lkfSideK(Lt);
    if (k >= 1 && !Lt.dinged) {
      // Kultainen hetki: kilahdus pannun omalla sävelellä
      Lt.dinged = true;
      p.ring = 0.6;
      playNote([1319, 1568, 1760][i], 0, 0.35, 'sine', 0.28);
      playNote([1976, 2349, 2637][i], 0.08, 0.3, 'sine', 0.12);
      spawnSparkles(P.x, P.y - viewH * 0.03, 8, '#ffd24f');
    }
    if (k > 1 && !Lt.late) {
      Lt.late = true;
      if (!Lt.burnt) { Lt.burnt = true; lkf.burnt++; lkf.goldLostT = 1.5; }
      playNote(294, 0, 0.18, 'triangle', 0.2);
      playNote(247, 0.15, 0.25, 'triangle', 0.2);
    }
    if (k >= 2 && !Lt.charred) {
      // Hiiltyi: savua ja piippaus
      Lt.charred = true;
      playNote(1760, 0, 0.1, 'square', 0.07);
      playNote(1760, 0.2, 0.1, 'square', 0.07);
      playNote(1760, 0.4, 0.1, 'square', 0.07);
      lkfPuff(P.x, P.y - viewH * 0.03, 8, '#5a4a48', { big: true });
    }
    // Höyry ja savu
    col = k < 1 ? '#ffffff' : (k < 1.5 ? '#f4eee8' : (k < 2 ? '#a89a98' : '#5a4a48'));
    if (Math.random() < dt * (1.2 + Math.min(2, k) * 2.2)) lkfPuff(P.x + (Math.random() - 0.5) * L.lRx, P.y - viewH * 0.02, 1, col, { up: 0.09 + Math.random() * 0.05, life: 1.1 });
  }
  // Sihinä: pehmeä rätinä, kun jokin paistuu
  lkf.sizzleT -= dt;
  if (lkf.sizzleT <= 0) {
    lkf.sizzleT = 0.13 + Math.random() * 0.12;
    for (i = 0; i < 3; i++) {
      Lt = lkf.pans[i].L;
      if (Lt && Lt.where === 'pan' && live && Math.random() < 0.5) { playNote(2400 + Math.random() * 1600, 0, 0.03, 'square', 0.012); break; }
    }
  }
}
function lkfUpdateFx(dt) {
  var i, f, p, pl, cu;
  for (i = lkf.flies.length - 1; i >= 0; i--) {
    f = lkf.flies[i];
    f.t += dt;
    if (f.t - (f.o.delay || 0) >= f.dur) {
      lkf.flies.splice(i, 1);
      if (f.kind === 'coin') { playNote(1319 + Math.random() * 200, 0, 0.08, 'sine', 0.15); lkf.regPop = 0.25; }
      if (f.kind === 'star') {
        lkf.stars[f.o.idx] = f.o.gold ? 2 : 1;
        lkf.starPop = 0.4;
        spawnSparkles(f.x1, f.y1, 10, f.o.gold ? '#ffd24f' : '#ffffff');
        playNote(1047, 0, 0.15, 'triangle', 0.3);
        playNote(1568, 0.1, 0.25, 'triangle', 0.3);
      }
    }
  }
  for (i = lkf.puffs.length - 1; i >= 0; i--) {
    p = lkf.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 2);
    if (p.t > p.life) lkf.puffs.splice(i, 1);
  }
  for (i = 0; i < 2; i++) {
    pl = lkf.plates[i];
    if (pl.pop > 0) pl.pop -= dt;
    if (pl.wob > 0) pl.wob -= dt;
    if (pl.where === 'fly') { pl.fly.t += dt; if (pl.fly.t >= 0.35) { pl.where = 'home'; pl.pop = 0.2; } }
  }
  if (lkf.jug) {
    lkf.jug.t += dt;
    if (lkf.jug.t >= 0.8) lkf.jug = null;
  }
  for (i = 0; i < 2; i++) { cu = lkf.spots[i]; if (cu) lkfCustFx(cu, dt); }
  for (i = 0; i < lkf.leavers.length; i++) lkfCustFx(lkf.leavers[i], dt);
  if (lkf.binT > 0) lkf.binT -= dt;
  if (lkf.goldLostT > 0) lkf.goldLostT -= dt;
  if (lkf.starPop > 0) lkf.starPop -= dt;
  if (lkf.regPop > 0) lkf.regPop -= dt;
  if (lkf.van) {
    lkf.van.t += dt;
    if (lkf.van.leave >= 0 && lkf.van.t - lkf.van.leave > 1.6) lkf.van = null;
  }
}
function lkfCustFx(cu, dt) {
  cu.t += dt;
  if (cu.hop > 0) cu.hop -= dt;
  if (cu.shakeT > 0) cu.shakeT -= dt;
  if (cu.sighT > 0) cu.sighT -= dt;
  if (cu.joyT > 0) cu.joyT -= dt;
  if (cu.coughT > 0) cu.coughT -= dt;
  if (cu.pop > 0) cu.pop -= dt;
  if (cu.lookT > 0) cu.lookT -= dt;
  if (cu.miss) { cu.miss.t -= dt; if (cu.miss.t <= 0) cu.miss = null; }
}

// ---------- Seuraava vaihe (vihjekäsi ja testibotti) ----------
// Paluu: { kind, from, to } raahaukselle tai { kind: 'flip'/'peek', from } napautukselle
function lkfWaiting() {
  var out = [], i, cu;
  for (i = 0; i < 2; i++) {
    cu = lkf.spots[i];
    if (cu && cu.state === 'wait') out.push(cu);
  }
  out.sort(function (a, b) { return a.seq - b.seq; });
  return out;
}
// Asiakas -> lautanen: sopiva keskeneräinen, muuten tyhjä, muuten tyhjennettävä
function lkfAssign() {
  var cus = lkfWaiting(), np = LKF_PLATES[lkf.ph], taken = {}, out = [], i, j, cu, best, bn;
  for (i = 0; i < cus.length; i++) {
    cu = cus[i];
    best = -1; bn = -1;
    for (j = 0; j < np; j++) {
      if (taken[j] || lkf.plates[j].where === 'drag') continue;
      if (lkf.plates[j].items.length && lkfCompatible(lkf.plates[j], cu.o) && lkf.plates[j].items.length + lkf.plates[j].tops.length > bn) { best = j; bn = lkf.plates[j].items.length + lkf.plates[j].tops.length; }
    }
    if (best < 0) for (j = 0; j < np; j++) if (!taken[j] && !lkf.plates[j].items.length && lkf.plates[j].where !== 'drag') { best = j; break; }
    if (best < 0) for (j = 0; j < np; j++) if (!taken[j] && lkf.plates[j].where !== 'drag') { best = j; break; }
    if (best < 0) continue;
    taken[best] = true;
    out.push({ cu: cu, pl: best });
  }
  return out;
}
function lkfNextStep() {
  var L = lkf.L, i, j, p, Lt, k, A, a, pl, o, need, pend = 0, emptyPan = -1, best = -1, bk = -1, tgt, s, n, cnt;
  if (lkf.flow !== 'play' || !L) return null;
  // 1. Käännettävät (kiireellisin ensin)
  for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
    Lt = lkf.pans[i].L;
    if (!Lt || Lt.where !== 'pan' || Lt.flipT > 0 || Lt.pour > 0) continue;
    k = lkfSideK(Lt);
    if (Lt.side === 1 && k >= 1 && k < 2 && k + (1 - lkfGoldLeft(Lt)) > bk) { bk = k + (1 - lkfGoldLeft(Lt)); best = i; }
  }
  if (best >= 0) return { kind: 'flip', from: { x: L.pans[best].x, y: L.pans[best].y }, pan: best };
  A = lkfAssign();
  // 2. Valmiit letut lautaselle (tai roskiin, jos kukaan ei tarvitse)
  for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
    Lt = lkf.pans[i].L;
    if (!Lt || Lt.where !== 'pan' || Lt.flipT > 0) continue;
    k = lkfSideK(Lt);
    if (k >= 2 || (Lt.side === 2 && k >= 1)) {
      tgt = null;
      if (k < 2) {
        for (j = 0; j < A.length; j++) {
          pl = lkf.plates[A[j].pl];
          if (lkfCompatible(pl, A[j].cu.o) && !pl.tops.length && pl.items.length < A[j].cu.o.n) { tgt = A[j].pl; break; }
        }
        // Kukaan ei juuri nyt tarvitse: varastoon vapaalle lautaselle
        if (tgt === null && !A.length) {
          for (j = 0; j < LKF_PLATES[lkf.ph]; j++) {
            pl = lkf.plates[j];
            if (pl.where === 'home' && !pl.tops.length && pl.items.length < 2) { tgt = j; break; }
          }
        }
      }
      if (tgt === null) return { kind: 'bin', from: { x: L.pans[i].x, y: L.pans[i].y }, to: { x: L.bin.x, y: L.bin.y - viewH * 0.06 }, pan: i };
      return { kind: 'take', from: { x: L.pans[i].x, y: L.pans[i].y }, to: { x: L.plates[tgt].x, y: lkfPlateTopY(tgt, lkf.plates[tgt].items.length) }, pan: i };
    }
  }
  // 3. Tyhjennettävät lautaset ja tarvittavat paistokset
  for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
    Lt = lkf.pans[i].L;
    if (!Lt) { if (emptyPan < 0) emptyPan = i; }
    else if (lkfSideK(Lt) < 2) pend++;
  }
  for (j = 0; j < A.length; j++) {
    a = A[j];
    pl = lkf.plates[a.pl];
    if (pl.where !== 'home') continue;
    if (pl.items.length && !lkfCompatible(pl, a.cu.o)) return { kind: 'dump', from: { x: L.plates[a.pl].x, y: L.plates[a.pl].y - viewH * 0.03 }, to: { x: L.bin.x, y: L.bin.y - viewH * 0.06 }, plate: a.pl };
    need = a.cu.o.n - pl.items.length;
    n = Math.min(pend, need);
    pend -= n;
    if (need - n > 0 && emptyPan >= 0) return { kind: 'pour', from: { x: L.jug.x, y: L.jug.y - viewH * 0.05 }, to: { x: L.pans[emptyPan].x, y: L.pans[emptyPan].y }, pan: emptyPan };
  }
  // 4. Täytteet ja ojennus
  for (j = 0; j < A.length; j++) {
    a = A[j];
    pl = lkf.plates[a.pl];
    o = a.cu.o;
    if (pl.where !== 'home' || pl.items.length !== o.n) continue;
    for (i = pl.tops.length - 1; i >= 0; i--) {
      cnt = lkfTopCount(pl.tops, pl.tops[i].type);
      if (cnt > lkfOrderNeed(o, pl.tops[i].type)) {
        s = lkfSlotWorld(a.pl, pl.items.length, pl.tops[i].slot);
        k = LKF_TOPS.indexOf(pl.tops[i].type);
        return { kind: 'topOff', from: { x: s.x, y: s.y - lkfTopR() * 0.5 }, to: { x: L.jars[k].x, y: L.jars[k].y - viewH * 0.03 }, type: pl.tops[i].type, plate: a.pl };
      }
    }
    for (i = 0; i < o.tops.length; i++) {
      if (lkfTopCount(pl.tops, o.tops[i].type) < o.tops[i].n) {
        k = LKF_TOPS.indexOf(o.tops[i].type);
        return { kind: 'top', from: { x: L.jars[k].x, y: L.jars[k].y - viewH * 0.035 }, to: { x: L.plates[a.pl].x, y: lkfPlateTopY(a.pl, pl.items.length) }, type: o.tops[i].type, plate: a.pl, cu: a.cu };
      }
    }
    return { kind: 'deliver', from: { x: L.plates[a.pl].x, y: L.plates[a.pl].y - viewH * 0.02 }, to: { x: a.cu.x, y: viewH * 0.5 }, plate: a.pl, cu: a.cu };
  }
  // 5. Hiiltyneet roskiin
  for (i = 0; i < LKF_PANS[lkf.ph]; i++) {
    Lt = lkf.pans[i].L;
    if (Lt && Lt.where === 'pan' && Lt.side === 1 && lkfSideK(Lt) >= 2) return { kind: 'bin', from: { x: L.pans[i].x, y: L.pans[i].y }, to: { x: L.bin.x, y: L.bin.y - viewH * 0.06 }, pan: i };
  }
  return null;
}

// ---------- Kuplat ----------
function lkfBubbleOpen(cu) {
  var o = cu.o;
  if (o.kind !== 'peek') return true;
  return cu.peekT > 0;
}
function lkfBubbleBox(cu) {
  var L = lkf.L, H = viewH, w = H * 0.24, h = H * 0.19, x = cu.tx, y = L.bubbleY;
  x = Math.max(L.rz + w / 2 + H * 0.005, Math.min(L.W - w / 2 - H * 0.035, x));
  if (!lkfBubbleOpen(cu)) { w = H * 0.13; h = H * 0.13; y += H * 0.03; }
  return { x: x, y: y, w: w, h: h };
}
function lkfBubbleTap(cu, px, py) {
  var B = lkfBubbleBox(cu);
  if (Math.abs(px - B.x) > B.w / 2 || Math.abs(py - B.y) > B.h / 2 + viewH * 0.01) return false;
  if (cu.o.kind === 'peek' && cu.peekT <= 0) {
    // Kurkistus: kupla aukeaa hetkeksi, kärsivällisyys hupenee
    cu.peekT = LKF_PEEK_AGAIN;
    if (lkf.ph >= 1 && !cu.sits) cu.pat = Math.max(0.02, cu.pat - LKF_PEEK_COST);
    cu.pop = 0.3;
    playNote(784, 0, 0.1, 'sine', 0.2);
    playNote(1047, 0.08, 0.14, 'sine', 0.2);
    lkf.shown.peek = true;
    return true;
  }
  cu.pop = 0.3;
  playNote(988, 0, 0.08, 'sine', 0.12);
  return true;
}

// ---------- Tökättävät ----------
// Kaakaokone (sydänhöyry; 3.: kaakaomuki ja vaahtokarkki, 5.: iso
// sydänpilvi), tähtikello (viisarit pyörivät; 3.: tähtikäki laulaa, 5.:
// tähtisade), pyöreä ikkuna (lintu kurkkaa ja visertää; 3.: kaksi poikasta,
// 5.: sateenkaari), tippipurkki (kolikoita; 5.: tähtikolikko) ja nukkuva
// pikkupilvi pilvityynyllä (havahtuu ja haukottelee; 3.: pieni sateenkaari,
// 5.: aivastaa tähtiä).
function lkfSetupProps() {
  var L = lkf.L, H = viewH;
  propsReset();
  propAdd({
    x: L.cocoa.x, y: L.cocoa.y, r: H * 0.06, hy: H * 0.06, color: '#ffb0c8', note: 523, amp: 0.05, cup: 0,
    update: function (p, dt) { if (p.cup > 0) p.cup -= dt; },
    draw: function (c, p) { lkfDrawCocoa(c, H, p); },
    poke: function (p) {
      var big = p.n % 5 === 0;
      lkfPuff(p.x, p.y - H * 0.13, big ? 8 : 3, '#ff8fb8', { heart: true, up: 0.12, r: big ? 0.02 : 0.014, life: 1.6, spread: big ? 0.08 : 0.03 });
      playNote(330, 0, 0.3, 'sine', 0.12);
      playNote(392, 0.15, 0.3, 'sine', 0.1);
      if (p.n % 3 === 0) {
        p.cup = 1.6;
        propDrop({
          x: p.x - H * 0.02, y: p.y - H * 0.06, vx: -H * 0.2, vy: -H * 0.6, ground: p.y - H * 0.005, life: 2.2,
          draw: function (c) { artRoundRect(c, -H * 0.009, -H * 0.009, H * 0.018, H * 0.018, H * 0.006, '#ffffff', { lineColor: '#d0b8d8' }); }
        });
        playNote(988, 0.1, 0.12, 'triangle', 0.22);
      }
    }
  });
  propAdd({
    x: L.clock.x, y: L.clock.y, r: H * 0.055, hy: H * 0.05, color: '#ffe27a', note: 988, amp: 0.06, spin: 0, ang: 0, cuck: 0,
    update: function (p, dt) {
      if (p.spin > 0) { p.spin -= dt; p.ang += dt * 14; }
      if (p.cuck > 0) p.cuck -= dt;
    },
    draw: function (c, p) { lkfDrawClock(c, H, p); },
    poke: function (p) {
      var i;
      p.spin = 1;
      playNote(1319, 0, 0.05, 'square', 0.05);
      playNote(1175, 0.15, 0.05, 'square', 0.05);
      if (p.n % 3 === 0) {
        p.cuck = 1.6;
        playNote(1568, 0.3, 0.2, 'sine', 0.25);
        playNote(1319, 0.55, 0.3, 'sine', 0.25);
        playNote(1568, 0.95, 0.2, 'sine', 0.25);
        playNote(1319, 1.2, 0.3, 'sine', 0.25);
      }
      if (p.n % 5 === 0) {
        for (i = 0; i < 5; i++) {
          propDrop({
            x: p.x, y: p.y - H * 0.08, vx: H * (0.1 + Math.random() * 0.3), vy: -H * (0.4 + Math.random() * 0.4), ground: H * 0.7, life: 2,
            draw: function (c) { drawStar(c, 0, 0, H * 0.014, 0, 0.3); }
          });
        }
      }
    }
  });
  propAdd({
    x: L.porthole.x, y: L.porthole.y + H * 0.055, r: H * 0.06, hy: H * 0.055, color: '#9fd8ff', note: 1568, amp: 0.04, bird: 0, kids: 0, bow: 0,
    update: function (p, dt) { if (p.bird > 0) p.bird -= dt; if (p.bow > 0) p.bow -= dt; },
    draw: function (c, p) { lkfDrawPorthole(c, H, p); },
    poke: function (p) {
      p.bird = 2.2;
      p.kids = p.n % 3 === 0 ? 1 : 0;
      lkfCustSound('bird');
      if (p.kids) { playNote(2349, 0.3, 0.05, 'sine', 0.12); playNote(2637, 0.38, 0.05, 'sine', 0.12); }
      if (p.n % 5 === 0) { p.bow = 2.4; playNote(1047, 0.2, 0.3, 'triangle', 0.2); playNote(1319, 0.35, 0.4, 'triangle', 0.2); }
    }
  });
  propAdd({
    x: L.tip.x, y: L.tip.y, r: H * 0.045, hy: H * 0.035, color: '#ffd24f', note: 1319, amp: 0.06, layer: 1,
    draw: function (c, p) { lkfDrawTipJar(c, H, p); },
    poke: function (p) {
      var i, n = p.n % 5 === 0 ? 6 : 2, big;
      playNote(1568, 0, 0.1, 'square', 0.06);
      playNote(2093, 0.1, 0.25, 'sine', 0.2);
      for (i = 0; i < n; i++) {
        big = p.n % 5 === 0 && i === 0;
        propDrop({
          x: p.x, y: p.y - H * 0.05, vx: H * (0.08 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1), vy: -H * (0.35 + Math.random() * 0.25),
          ground: L.counterY - H * 0.005, life: 2, big: big,
          draw: function (c, d) {
            if (d.big) { drawStar(c, 0, 0, H * 0.02, 0, 0.6); return; }
            artCircle(c, 0, 0, H * 0.011, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
          }
        });
      }
    }
  });
  propAdd({
    x: L.sleeper.x, y: L.sleeper.y, r: H * 0.07, hy: H * 0.05, color: '#ffffff', note: 659, amp: 0.05, layer: 1, awake: 0, bow: 0,
    update: function (p, dt) { if (p.awake > 0) p.awake -= dt; if (p.bow > 0) p.bow -= dt; },
    draw: function (c, p) { lkfDrawSleeper(c, H, p); },
    poke: function (p) {
      p.awake = 1.6;
      playNote(523, 0, 0.3, 'sine', 0.15);
      playNote(392, 0.25, 0.4, 'sine', 0.12);
      if (p.n % 3 === 0) { p.bow = 2.2; playNote(1047, 0.2, 0.2, 'triangle', 0.2); playNote(1319, 0.35, 0.3, 'triangle', 0.2); }
      if (p.n % 5 === 0) {
        playNote(1568, 0.5, 0.08, 'square', 0.06);
        spawnSparkles(p.x, p.y - H * 0.05, 14, '#ffd24f');
        for (var i = 0; i < 3; i++) {
          propDrop({
            x: p.x, y: p.y - H * 0.05, vx: -H * (0.15 + Math.random() * 0.25), vy: -H * (0.4 + Math.random() * 0.3), ground: H * 0.985, life: 1.8,
            draw: function (c) { drawStar(c, 0, 0, H * 0.013, 0, 0.3); }
          });
        }
      }
    }
  });
}

// ---------- Tausta ----------
function renderLettuBg(b, w, h) {
  var L = lkf.L, g, i, x, y, s, st, sx;
  if (!L || L.W !== w || L.H !== h) { lkfLayout(); L = lkf.L; }
  // Seinä: laventelinpunertava, pilvitapetti
  g = b.createLinearGradient(0, 0, 0, h * 0.7);
  g.addColorStop(0, '#f6dff2');
  g.addColorStop(1, '#ecd6f4');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,255,0.22)';
  for (y = h * 0.14; y < h * 0.7; y += h * 0.12) {
    for (x = ((y / (h * 0.12)) % 2) * h * 0.08; x < L.rz; x += h * 0.16) {
      cloudShape(b, x, y, h * 0.018);
    }
  }
  // Pilvireunus seinän yläosassa
  for (x = -h * 0.02; x < w; x += h * 0.085) htCloudPuff(b, x, h * 0.025, h * 0.13, '#f0e8ff');
  // Pyöreän ikkunan ja kellon paikka: pieni hylly
  artRoundRect(b, h * 0.015, L.clock.y + h * 0.005, h * 0.115, h * 0.014, h * 0.006, '#e0a8c8', { lineColor: '#9a5a80' });
  // Täytehylly
  artRoundRect(b, L.jars[0].x - h * 0.07, L.shelfY, L.jars[5].x - L.jars[0].x + h * 0.14, h * 0.02, h * 0.008, '#e8b0d0', { lineColor: '#9a5a80' });
  b.fillStyle = 'rgba(120,60,100,0.12)';
  b.fillRect(L.jars[0].x - h * 0.06, L.shelfY + h * 0.02, L.jars[5].x - L.jars[0].x + h * 0.12, h * 0.01);
  artLimb(b, L.jars[0].x - h * 0.04, L.shelfY + h * 0.02, L.jars[0].x - h * 0.04, L.shelfY + h * 0.05, h * 0.009, '#d898c0', '#9a5a80');
  artLimb(b, L.jars[5].x + h * 0.04, L.shelfY + h * 0.02, L.jars[5].x + h * 0.04, L.shelfY + h * 0.05, h * 0.009, '#d898c0', '#9a5a80');
  // Viirinauha hyllyn yllä
  st = ['#ff9ec6', '#ffe27a', '#9fd8ff', '#b8f0a0', '#d8b8ff'];
  b.strokeStyle = '#c890b8';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath(); b.moveTo(L.jars[0].x - h * 0.06, h * 0.12); b.quadraticCurveTo((L.jars[0].x + L.jars[5].x) / 2, h * 0.16, L.jars[5].x + h * 0.06, h * 0.12); b.stroke();
  for (i = 0; i < 9; i++) {
    x = L.jars[0].x - h * 0.06 + (L.jars[5].x - L.jars[0].x + h * 0.12) * (i + 0.5) / 9;
    y = h * 0.12 + Math.sin((i + 0.5) / 9 * Math.PI) * h * 0.02;
    b.beginPath(); b.moveTo(x - h * 0.012, y); b.lineTo(x + h * 0.012, y); b.lineTo(x, y + h * 0.026); b.closePath();
    artFillPath(b, st[i % 5], y, y + h * 0.026, h * 0.012, { line: false });
  }
  // Lattia: pehmeä pilvimatto
  y = h * 0.9;
  b.fillStyle = '#e4dcf8';
  b.fillRect(0, y, w, h - y);
  for (x = -h * 0.03; x < w; x += h * 0.11) htCloudPuff(b, x, y + h * 0.05, h * 0.12, '#ece6ff');
  // Liesi: minttu, lieden päällinen ja etupaneeli
  s = L.stove;
  artRoundRect(b, s.x0, s.y0 + h * 0.08, s.x1 - s.x0, s.y1 - s.y0 - h * 0.05, h * 0.02, '#9fe0cc', { lineColor: '#3a8a76', hi: 0.12 });
  artRoundRect(b, s.x0 - h * 0.008, s.y0, s.x1 - s.x0 + h * 0.016, h * 0.15, h * 0.03, '#d8f4ea', { lineColor: '#3a8a76' });
  for (i = 0; i < 3; i++) {
    sx = L.pans[i].x;
    lkfEll(b, sx, L.pans[i].y + h * 0.012, L.panRx * 0.95, L.panRy * 0.95);
    artFillPath(b, '#8a9a9a', L.pans[i].y - h * 0.03, L.pans[i].y + h * 0.05, h * 0.04, { lineColor: '#4a5a5a' });
    lkfEll(b, sx, L.pans[i].y + h * 0.012, L.panRx * 0.7, L.panRy * 0.68);
    b.strokeStyle = '#5a6a6a';
    b.lineWidth = Math.max(1, h * 0.004);
    b.stroke();
    // Nuppi etupaneelissa
    artCircle(b, sx, s.y0 + h * 0.185, h * 0.018, '#ffffff', { lineColor: '#3a8a76' });
  }
  // Työpöytä
  artRoundRect(b, h * 0.15, L.tableY + h * 0.02, L.lw - h * 0.13, h * 0.9 - L.tableY + h * 0.06, h * 0.012, '#f4c8a0', { lineColor: '#9a6040' });
  artRoundRect(b, h * 0.14, L.tableY - h * 0.005, L.lw - h * 0.11, h * 0.035, h * 0.012, '#ffe6c8', { lineColor: '#9a6a3a' });
  b.fillStyle = 'rgba(154,96,64,0.18)';
  for (i = 0; i < 3; i++) b.fillRect(h * 0.16, L.tableY + h * (0.07 + i * 0.07), L.lw - h * 0.15, h * 0.004);
  // Kannun jalusta
  artRoundRect(b, h * 0.02, L.jug.y - h * 0.005, h * 0.13, h * 0.03, h * 0.01, '#d8f4ea', { lineColor: '#3a8a76' });
  // Lautasalustat
  for (i = 0; i < 2; i++) {
    artShadow(b, L.plates[i].x, L.plates[i].y + h * 0.012, L.plRx * 1.3, h * 0.04, 0.12);
    lkfEll(b, L.plates[i].x, L.plates[i].y + h * 0.008, L.plRx * 1.2, L.plRy * 1.5);
    b.fillStyle = 'rgba(255,255,255,0.35)';
    b.fill();
  }
}

// ---------- Piirto: letut ja täytteet ----------
// Letku: (x, y) = yläpinnan keskikohta. top/rim = värit, o: { bubbles, raw, seed, alpha }
function lkfDrawLettu(c, x, y, rx, ry, top, rim, o) {
  var th = ry * 0.5, i, a, r, sd = (o && o.seed) || 1, k;
  o = o || {};
  c.beginPath();
  lkfEllArc(c, x, y + th, rx, ry, 0, Math.PI, false);
  c.lineTo(x - rx, y);
  lkfEllArc(c, x, y, rx, ry, Math.PI, 0, true);
  c.closePath();
  artFillPath(c, rim, y, y + th + ry, rx, { lineColor: artShade(rim, -0.45), line: Math.max(1, rx * 0.04) });
  lkfEll(c, x, y, rx, ry);
  artFillPath(c, top, y - ry, y + ry, rx, { lineColor: artShade(rim, -0.4), line: Math.max(1, rx * 0.04) });
  if (o.raw > 0) {
    // Raaka pinta: kuplat puhkeavat kypsyessä
    k = o.bubbles || 0;
    for (i = 0; i < 7; i++) {
      a = sd * 7 + i * 2.39;
      r = 0.25 + ((i * 37 + Math.floor(sd * 10)) % 6) * 0.1;
      if (i / 7 > k + 0.1) continue;
      c.strokeStyle = 'rgba(200,150,80,' + (0.25 + k * 0.4) + ')';
      c.lineWidth = Math.max(1, rx * 0.025);
      lkfEll(c, x + Math.cos(a) * rx * r * 0.85, y + Math.sin(a) * ry * r * 0.8, rx * 0.06, ry * 0.12);
      c.stroke();
    }
  } else {
    // Kypsä pinta: pitsimäinen kuvio
    c.fillStyle = artRGBA(artShade(top, -0.22), 0.5);
    for (i = 0; i < 6; i++) {
      a = sd * 5 + i * 1.9;
      r = 0.3 + ((i * 53 + Math.floor(sd * 7)) % 5) * 0.12;
      lkfEll(c, x + Math.cos(a) * rx * r * 0.8, y + Math.sin(a) * ry * r * 0.75, rx * 0.12, ry * 0.18);
      c.fill();
    }
  }
  artHighlight(c, x - rx * 0.4, y - ry * 0.35, rx * 0.22, ry * 0.18, 0.35);
}
// Täyte: (x, y) = pohjakohta pinnalla, r = koko
function lkfDrawTop(c, type, x, y, r) {
  var i;
  if (type === 'jamS' || type === 'jamB') {
    var col = LKF_TOP_COL[type], line = type === 'jamS' ? '#a01a3a' : '#3a2a90';
    artBlob(c, x, y - r * 0.18, r * 0.62, r * 0.3, col, { lineColor: line, line: Math.max(1, r * 0.08) });
    artBlob(c, x, y - r * 0.38, r * 0.38, r * 0.26, col, { lineColor: line, line: Math.max(1, r * 0.08), hi: 0.55 });
    if (type === 'jamB') { c.fillStyle = '#4a3ab0'; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(x + i * r * 0.25, y - r * 0.2, r * 0.07, 0, Math.PI * 2); c.fill(); } }
  } else if (type === 'cream') {
    artBlob(c, x, y - r * 0.2, r * 0.6, r * 0.28, '#fffaf4', { lineColor: '#b8a8c8', shadeTo: '#ebe2f4', line: Math.max(1, r * 0.08) });
    artBlob(c, x, y - r * 0.48, r * 0.44, r * 0.24, '#fffaf4', { lineColor: '#b8a8c8', shadeTo: '#ebe2f4', line: Math.max(1, r * 0.08) });
    c.beginPath(); c.moveTo(x - r * 0.25, y - r * 0.6); c.quadraticCurveTo(x, y - r * 1.1, x + r * 0.08, y - r * 1.05); c.quadraticCurveTo(x + r * 0.05, y - r * 0.8, x + r * 0.25, y - r * 0.6); c.closePath();
    artFillPath(c, '#fffaf4', y - r * 1.1, y - r * 0.6, r * 0.3, { lineColor: '#b8a8c8', shadeTo: '#ebe2f4', line: Math.max(1, r * 0.08) });
  } else if (type === 'berry') {
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x - r * 0.75, y - r * 0.3, x - r * 0.6, y - r * 0.95, x, y - r * 0.85);
    c.bezierCurveTo(x + r * 0.6, y - r * 0.95, x + r * 0.75, y - r * 0.3, x, y);
    c.closePath();
    artFillPath(c, '#ff4a5a', y - r * 0.95, y, r, { lineColor: '#a01a2a', line: Math.max(1, r * 0.08) });
    c.fillStyle = '#ffe9a0';
    c.fillRect(x - r * 0.25, y - r * 0.55, r * 0.09, r * 0.1);
    c.fillRect(x + r * 0.16, y - r * 0.6, r * 0.09, r * 0.1);
    c.fillRect(x - r * 0.04, y - r * 0.3, r * 0.09, r * 0.1);
    artBlob(c, x - r * 0.18, y - r * 0.88, r * 0.22, r * 0.09, '#5fbf4a', { rot: -0.4, lineColor: '#2a7a2a', line: Math.max(1, r * 0.06) });
    artBlob(c, x + r * 0.18, y - r * 0.88, r * 0.22, r * 0.09, '#5fbf4a', { rot: 0.4, lineColor: '#2a7a2a', line: Math.max(1, r * 0.06) });
  } else if (type === 'choco') {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (i = 0; i < 2; i++) {
      c.strokeStyle = i ? '#8a5236' : '#3a1e10';
      c.lineWidth = i ? Math.max(1.5, r * 0.16) : Math.max(2.5, r * 0.28);
      c.beginPath();
      c.moveTo(x - r * 0.6, y - r * 0.15);
      c.lineTo(x - r * 0.3, y - r * 0.5);
      c.lineTo(x, y - r * 0.12);
      c.lineTo(x + r * 0.3, y - r * 0.5);
      c.lineTo(x + r * 0.6, y - r * 0.15);
      c.stroke();
    }
    artCircle(c, x + r * 0.6, y - r * 0.08, r * 0.12, '#8a5236', { lineColor: '#3a1e10', line: Math.max(1, r * 0.06) });
  } else {
    drawStar(c, x, y - r * 0.45, r * 0.5, 0, 0);
  }
}
// Pino lautasella tai käsissä: (x, y) = lautasen keskikohta
function lkfDrawStack(c, x, y, items, tops, sc, o) {
  var L = lkf.L, rx = L.sRx * sc, ry = L.sRy * sc, i, list, s, tx, ty;
  o = o || {};
  if (!o.noPlate) {
    artShadow(c, x, y + viewH * 0.01 * sc, L.plRx * 1.15 * sc, viewH * 0.025 * sc, 0.18);
    c.save();
    lkfEll(c, x, y, L.plRx * sc, L.plRy * sc);
    artFillPath(c, '#ffffff', y - L.plRy * sc, y + L.plRy * sc, viewH * 0.05 * sc, { lineColor: '#b8a8d8', shadeTo: '#ece6fa' });
    c.strokeStyle = 'rgba(184,168,216,0.6)';
    c.lineWidth = Math.max(1, viewH * 0.003);
    lkfEll(c, x, y, L.plRx * 0.75 * sc, L.plRy * 0.7 * sc);
    c.stroke();
    c.restore();
  }
  for (i = 0; i < items.length; i++) {
    ty = y - viewH * 0.016 * sc - i * L.sStep * sc;
    if (items[i].pop > 0) ty -= Math.sin(items[i].pop / 0.3 * Math.PI) * viewH * 0.01;
    lkfDrawLettu(c, x, ty, rx, ry, lkfQCol(items[i].q), artShade(lkfQCol(items[i].q), -0.12), { seed: items[i].seed });
  }
  if (!tops || !tops.length || !items.length) return;
  list = tops.slice().sort(function (a, b) { return LKF_SLOTS[a.slot][1] - LKF_SLOTS[b.slot][1]; });
  ty = y - viewH * 0.016 * sc - (items.length - 1) * L.sStep * sc;
  for (i = 0; i < list.length; i++) {
    s = LKF_SLOTS[list[i].slot];
    tx = x + s[0] * rx * 0.78;
    lkfDrawTop(c, list[i].type, tx, ty + s[1] * ry * 0.85, lkfTopR() * sc * (list[i].pop > 0 ? 1 + list[i].pop : 1));
  }
}
function lkfDrawSpatula(c, x, y, s, gold, rot) {
  var col = gold ? '#ffd24f' : '#d8d0e8', line = gold ? '#a07010' : '#7a7090', i;
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  if (gold) artGlow(c, 0, -s * 0.3, s * 1.1, '#ffe27a', 0.45);
  artRoundRect(c, -s * 0.1, s * 0.0, s * 0.2, s * 0.7, s * 0.09, gold ? '#ffd24f' : '#ff9ec6', { lineColor: gold ? '#a07010' : '#b0507a' });
  artLimb(c, 0, s * 0.02, 0, -s * 0.25, s * 0.07, col, line);
  artRoundRect(c, -s * 0.3, -s * 0.85, s * 0.6, s * 0.62, s * 0.12, col, { lineColor: line, hi: 0.3 });
  c.fillStyle = artShade(col, -0.3);
  for (i = -1; i <= 1; i++) roundRect(c, i * s * 0.15 - s * 0.03, -s * 0.75, s * 0.06, s * 0.38, s * 0.03), c.fill();
  c.restore();
}

// ---------- Piirto: pannut ----------
function lkfDrawPans(c) {
  var L = lkf.L, H = viewH, i, P, p, Lt, k, gl, x, y, k2, fl, a0, a1, rr, top, rim, raw, sq, lift, rot;
  for (i = 0; i < 3; i++) {
    P = L.pans[i];
    p = lkf.pans[i];
    x = P.x;
    y = P.y;
    if (i >= LKF_PANS[lkf.ph]) {
      // Kylmä liesi: kansi
      artBlob(c, x, y + H * 0.005, L.panRx * 0.75, L.panRy * 0.7, '#e0f4ee', { lineColor: '#3a8a76', hi: 0.3 });
      artCircle(c, x, y - H * 0.015, H * 0.012, '#ff9ec6', { lineColor: '#b0507a' });
      continue;
    }
    sq = i === 2 && lkf.pansK < 1 ? easeOutBack(lkf.pansK) : 1;
    c.save();
    c.translate(x, y);
    c.scale(sq, sq);
    if (p.wob > 0) c.rotate(Math.sin(p.wob * 40) * 0.04);
    Lt = p.L;
    k = Lt ? lkfSideK(Lt) : 0;
    // Liekit
    if (Lt && Lt.where === 'pan') {
      fl = 0.6 + Math.sin(globalT * 20 + i) * 0.15;
      artGlow(c, 0, H * 0.02, L.panRx * 1.1, '#ff9a4a', 0.35 * fl);
    }
    // Varsi
    artLimb(c, -L.panRx * 0.75, L.panRy * 0.5, -L.panRx * 1.25, L.panRy * 2.2, H * 0.018, '#ff9ec6', '#9a4a6a');
    // Pannu
    lkfEll(c, 0, H * 0.008, L.panRx, L.panRy * 1.15);
    artFillPath(c, '#6a6488', -L.panRy, L.panRy * 1.4, L.panRx, { lineColor: '#3a3458' });
    lkfEll(c, 0, 0, L.panRx * 0.9, L.panRy * 0.9);
    artFillPath(c, '#4a4466', -L.panRy, L.panRy, L.panRx, { line: false, flat: true });
    artHighlight(c, -L.panRx * 0.45, -L.panRy * 0.35, L.panRx * 0.18, L.panRy * 0.18, 0.25);
    // Ennakkorengas: kasvaa paistuessa, kultainen ikkunassa, kutistuu loppua kohti
    if (Lt && Lt.where === 'pan' && Lt.flipT <= 0 && Lt.pour <= 0) {
      rr = 1.18;
      c.lineCap = 'round';
      if (k < 1) {
        c.strokeStyle = 'rgba(255,255,255,0.55)';
        c.lineWidth = Math.max(2, H * 0.006);
        lkfEll(c, 0, 0, L.panRx * rr, L.panRy * rr * 1.25);
        c.stroke();
        c.strokeStyle = artMix('#ffe6a0', '#ffc030', k);
        c.lineWidth = Math.max(3, H * 0.009);
        c.beginPath();
        lkfEllArc(c, 0, 0, L.panRx * rr, L.panRy * rr * 1.25, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2, false);
        c.stroke();
      } else if (k <= 1) {
        gl = lkfGoldLeft(Lt);
        artGlow(c, 0, 0, L.panRx * 1.5, '#ffe27a', 0.45 + Math.sin(globalT * 14) * 0.15);
        c.strokeStyle = '#ffd24f';
        c.lineWidth = Math.max(4, H * (0.008 + gl * 0.008));
        c.beginPath();
        lkfEllArc(c, 0, 0, L.panRx * rr, L.panRy * rr * 1.25, -Math.PI / 2, -Math.PI / 2 + gl * Math.PI * 2, false);
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.8)';
        c.lineWidth = Math.max(1.5, H * 0.003);
        c.stroke();
      } else if (k < 2) {
        c.strokeStyle = 'rgba(230,110,60,' + (0.5 + Math.sin(globalT * 10) * 0.3) + ')';
        c.lineWidth = Math.max(3, H * 0.007);
        lkfEll(c, 0, 0, L.panRx * rr, L.panRy * rr * 1.25);
        c.stroke();
      }
    }
    if (p.ring > 0) artGlow(c, 0, 0, L.panRx * 1.6, '#fff2a0', p.ring);
    // Letku pannulla
    if (Lt && Lt.where === 'pan') {
      lift = 0;
      rot = 1;
      if (Lt.flipT > 0) {
        a0 = 1 - Lt.flipT / LKF_FLIP_T;
        lift = Math.sin(a0 * Math.PI) * H * 0.1;
        rot = Math.cos(a0 * Math.PI);
      }
      if (Lt.side === 1) {
        top = artMix(LKF_BATTER, lkfCookCol(Math.min(1, k)), 0.25);
        if (k >= 2) top = artMix(top, '#6a5040', 0.5);
        rim = lkfCookCol(k);
        raw = 1;
      } else {
        top = lkfQCol(Lt.s1);
        rim = lkfCookCol(k);
        raw = 0;
      }
      if (Lt.flipT > 0 && rot < 0) {
        // Kääntymässä: alapuoli näkyy
        top = Lt.s1 ? lkfQCol(Lt.s1) : top;
        raw = 0;
      }
      a1 = Lt.pour > 0 ? 1 - Lt.pour / 0.4 : 1;
      c.save();
      c.translate(0, -lift);
      c.scale(0.4 + 0.6 * a1, Math.max(0.08, Math.abs(rot)) * (0.4 + 0.6 * a1));
      lkfDrawLettu(c, 0, -H * 0.004, L.lRx, L.lRy, top, rim, { raw: raw, bubbles: Lt.side === 1 ? Math.min(1, k) : 0, seed: Lt.seed });
      if (k >= 2) {
        c.fillStyle = 'rgba(30,20,18,0.55)';
        for (a0 = 0; a0 < 5; a0++) { lkfEll(c, Math.cos(a0 * 2.1) * L.lRx * 0.5, -H * 0.004 + Math.sin(a0 * 2.1) * L.lRy * 0.45, L.lRx * 0.16, L.lRy * 0.22); c.fill(); }
      }
      c.restore();
      if (Lt.flipT > 0) {
        // Lasta heilahtaa
        a0 = 1 - Lt.flipT / LKF_FLIP_T;
        lkfDrawSpatula(c, L.panRx * 0.6 - a0 * L.panRx * 0.5, -lift * 0.5 + H * 0.02, H * 0.05, false, -1.2 + a0 * 1.4);
      }
    }
    c.restore();
  }
}
// ---------- Piirto: purkit, kannu, roskis ----------
function lkfDrawJars(c) {
  var L = lkf.L, H = viewH, i, x, y, k, open, col, n = LKF_JARS[lkf.ph];
  for (i = 0; i < 6; i++) {
    x = L.jars[i].x;
    y = L.jars[i].y;
    open = i < n;
    k = open && i >= LKF_JARS[0] && lkf.jarsK < 1 ? easeOutBack(lkf.jarsK) : 1;
    c.save();
    c.translate(x, y);
    if (!open) {
      // Suljettu purkki (aukeaa päivällä)
      artRoundRect(c, -H * 0.036, -H * 0.07, H * 0.072, H * 0.07, H * 0.018, '#f4ecfa', { lineColor: '#b8a0c8', alpha: 0.85 });
      artRoundRect(c, -H * 0.04, -H * 0.085, H * 0.08, H * 0.02, H * 0.008, '#d8c8e8', { lineColor: '#9a80b0' });
      c.restore();
      continue;
    }
    c.scale(k, k);
    col = LKF_TOP_COL[LKF_TOPS[i]];
    // Lasipurkki, sisällä täytettä
    artRoundRect(c, -H * 0.04, -H * 0.08, H * 0.08, H * 0.08, H * 0.022, '#eef8ff', { lineColor: '#8aa8c8', alpha: 0.9 });
    artRoundRect(c, -H * 0.032, -H * 0.04, H * 0.064, H * 0.034, H * 0.014, artMix(col, '#ffffff', LKF_TOPS[i] === 'cream' ? 0 : 0.15), { line: false });
    artHighlight(c, -H * 0.026, -H * 0.064, H * 0.007, H * 0.013, 0.6);
    // Etiketti: täytteen kuva
    artCircle(c, 0, -H * 0.045, H * 0.026, '#ffffff', { lineColor: '#c8b0d0', flat: true });
    lkfDrawTop(c, LKF_TOPS[i], 0, -H * 0.03, H * 0.03);
    artRoundRect(c, -H * 0.044, -H * 0.094, H * 0.088, H * 0.018, H * 0.008, ['#ff9ec6', '#c8b8f0', '#ff9ec6', '#9fb8ff', '#d8a070', '#ffe27a'][i], { lineColor: '#9a6a8a' });
    c.restore();
  }
}
function lkfDrawJug(c, x, y, s, tilt) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt || 0);
  // Kahva
  c.strokeStyle = '#b0507a';
  c.lineWidth = Math.max(3, s * 0.2);
  c.beginPath(); c.arc(s * 0.62, -s * 0.85, s * 0.3, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.strokeStyle = '#ffb0d0';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.stroke();
  c.beginPath(); c.moveTo(-s * 0.55, 0); c.lineTo(-s * 0.62, -s * 1.3); c.lineTo(-s * 0.85, -s * 1.5); c.lineTo(s * 0.62, -s * 1.5); c.lineTo(s * 0.55, 0); c.closePath();
  artFillPath(c, '#ffd0e4', -s * 1.5, 0, s, { lineColor: '#b0507a' });
  artBlob(c, -s * 0.05, -s * 1.42, s * 0.6, s * 0.1, LKF_BATTER, { lineColor: '#c0a070' });
  artHighlight(c, -s * 0.3, -s * 1.0, s * 0.08, s * 0.3, 0.5);
  artCircle(c, 0, -s * 0.65, s * 0.18, '#ffffff', { lineColor: '#b0507a', line: Math.max(1, s * 0.05) });
  c.restore();
}
function lkfDrawBin(c) {
  var b = lkf.L.bin, H = viewH, op = lkf.binT > 0 ? Math.sin(lkf.binT / 0.6 * Math.PI) : 0, hl = lkf.drag && (lkf.drag.kind === 'lettu' || lkf.drag.kind === 'plate');
  if (hl) artGlow(c, b.x, b.y - H * 0.05, H * 0.09, '#ffffff', 0.4);
  artShadow(c, b.x, b.y, H * 0.06, H * 0.015, 0.2);
  c.beginPath(); c.moveTo(b.x - H * 0.048, b.y - H * 0.1); c.lineTo(b.x + H * 0.048, b.y - H * 0.1); c.lineTo(b.x + H * 0.038, b.y); c.lineTo(b.x - H * 0.038, b.y); c.closePath();
  artFillPath(c, '#c8b8f0', b.y - H * 0.1, b.y, H * 0.05, { lineColor: '#6a5aa0' });
  c.strokeStyle = 'rgba(106,90,160,0.4)';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath(); c.moveTo(b.x - H * 0.015, b.y - H * 0.085); c.lineTo(b.x - H * 0.013, b.y - H * 0.01); c.moveTo(b.x + H * 0.015, b.y - H * 0.085); c.lineTo(b.x + H * 0.013, b.y - H * 0.01); c.stroke();
  c.save();
  c.translate(b.x - H * 0.05, b.y - H * 0.1);
  c.rotate(-op * 0.7 - (hl ? 0.15 : 0));
  artRoundRect(c, 0, -H * 0.014, H * 0.1, H * 0.018, H * 0.008, '#a898e0', { lineColor: '#6a5aa0' });
  artCircle(c, H * 0.05, -H * 0.018, H * 0.008, '#ff9ec6', { lineColor: '#6a5aa0' });
  c.restore();
}

// ---------- Piirto: tökättävät ----------
function lkfDrawCocoa(c, H, p) {
  var s = H * 0.05, k = p.t >= 0 ? Math.max(0, 1 - p.t * 2) : 0;
  artShadow(c, 0, 0, s * 1.1, s * 0.2, 0.18);
  artRoundRect(c, -s * 0.9, -s * 2.3, s * 1.8, s * 2.3, s * 0.3, '#ff9ec6', { lineColor: '#b0507a', hi: 0.15 });
  artRoundRect(c, -s * 0.7, -s * 1.95, s * 1.4, s * 0.55, s * 0.15, '#fff2f8', { lineColor: '#b0507a' });
  lkfHeartPath(c, 0, -s * 1.68, s * 0.22);
  artFillPath(c, '#ff5a8a', -s * 1.9, -s * 1.5, s * 0.2, { lineColor: '#b0305a', line: Math.max(1, s * 0.04) });
  // Nokka ja muki
  artRoundRect(c, -s * 0.12, -s * 1.3, s * 0.24, s * 0.25, s * 0.06, '#d8d0e8', { lineColor: '#7a7090' });
  if (k > 0) { c.fillStyle = '#8a5236'; c.fillRect(-s * 0.04, -s * 1.05, s * 0.08, s * 0.55 * k); }
  artRoundRect(c, -s * 0.32, -s * 0.55, s * 0.64, s * 0.5, s * 0.1, '#ffffff', { lineColor: '#b8a8c8' });
  c.strokeStyle = '#b8a8c8';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath(); c.arc(s * 0.38, -s * 0.3, s * 0.13, -Math.PI / 2, Math.PI / 2); c.stroke();
  artBlob(c, 0, -s * 0.52, s * 0.26, s * 0.06, '#8a5236', { line: false });
  if (p.cup > 0) artCircle(c, s * 0.05, -s * 0.6, s * 0.12, '#ffffff', { lineColor: '#d0b8d8' });
  artCircle(c, -s * 0.55, -s * 2.05, s * 0.08, '#b8f0a0', { lineColor: '#4a8a3a' });
  artCircle(c, s * 0.55, -s * 2.05, s * 0.08, '#ffe27a', { lineColor: '#a07010' });
}
function lkfDrawClock(c, H, p) {
  var s = H * 0.04, cy = -s * 1.1, i, a, m = globalT * 0.4 + p.ang, ck = p.cuck > 0 ? Math.min(1, Math.min(p.cuck, 1.6 - p.cuck) * 5) : 0;
  // Tähtikäki kurkkaa kellon katolta
  if (ck > 0) {
    drawStar(c, 0, cy - s * 1.2 - ck * s * 0.6, s * 0.45, Math.sin(globalT * 8) * 0.2, 0.4);
    artEye(c, -s * 0.12, cy - s * 1.22 - ck * s * 0.6, s * 0.06, 0, false);
    artEye(c, s * 0.12, cy - s * 1.22 - ck * s * 0.6, s * 0.06, 0, false);
  }
  c.beginPath(); c.moveTo(-s * 1.0, cy - s * 0.45); c.lineTo(0, cy - s * 1.35); c.lineTo(s * 1.0, cy - s * 0.45); c.closePath();
  artFillPath(c, '#b8a0f0', cy - s * 1.35, cy - s * 0.45, s, { lineColor: '#5a4a9a' });
  artCircle(c, 0, cy, s, '#fffaf0', { lineColor: '#5a4a9a', line: Math.max(1.5, s * 0.14) });
  for (i = 0; i < 12; i++) {
    a = i * Math.PI / 6;
    if (i % 3 === 0) drawStar(c, Math.cos(a) * s * 0.72, cy + Math.sin(a) * s * 0.72, s * 0.13, 0, 0);
    else { c.fillStyle = '#9a8ac8'; c.beginPath(); c.arc(Math.cos(a) * s * 0.75, cy + Math.sin(a) * s * 0.75, s * 0.05, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = '#4a3a7a';
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(m / 12 - 1.6) * s * 0.42, cy + Math.sin(m / 12 - 1.6) * s * 0.42); c.stroke();
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(m - 1.6) * s * 0.65, cy + Math.sin(m - 1.6) * s * 0.65); c.stroke();
  artCircle(c, 0, cy, s * 0.08, '#ffd24f', { lineColor: '#a07010' });
}
function lkfDrawPorthole(c, H, p) {
  var r = H * 0.052, cy = -H * 0.055, sky = lkfSkyCols(), g, b = p.bird > 0 ? Math.min(1, Math.min(p.bird, 2.2 - p.bird) * 5) : 0, i;
  c.save();
  c.beginPath(); c.arc(0, cy, r, 0, Math.PI * 2); c.clip();
  g = c.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(-r, cy - r, r * 2, r * 2);
  if (p.bow > 0) htMannerPokeRainbow(c, 0, cy + r * 0.5, r * 0.8, Math.min(1, p.bow));
  htCloudPuff(c, -r * 0.4 + Math.sin(globalT * 0.3) * r * 0.2, cy + r * 0.55, r * 0.9);
  if (b > 0) {
    lkfDrawBird(c, r * 0.1, cy + r * 1.1 - b * r * 0.95, r * 0.55, { t: globalT, flap: 0, look: -0.5 });
    if (p.kids) for (i = -1; i <= 1; i += 2) lkfDrawBird(c, i * r * 0.6, cy + r * 1.2 - b * r * 0.7, r * 0.3, { t: globalT + i, flap: 0 });
  }
  c.restore();
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(3, H * 0.012);
  c.beginPath(); c.arc(0, cy, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#c890b8';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath(); c.arc(0, cy, r + H * 0.007, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, H * 0.005);
  c.beginPath(); c.moveTo(-r, cy); c.lineTo(r, cy); c.moveTo(0, cy - r); c.lineTo(0, cy + r); c.stroke();
}
function lkfDrawTipJar(c, H, p) {
  var s = H * 0.03;
  artBlob(c, 0, -s * 0.8, s * 0.75, s * 0.85, '#eef8ff', { lineColor: '#8aa8c8', hi: 0.5, alpha: 0.85 });
  artCircle(c, -s * 0.2, -s * 0.4, s * 0.22, '#ffd24f', { lineColor: '#a07010' });
  artCircle(c, s * 0.25, -s * 0.5, s * 0.22, '#ffd24f', { lineColor: '#a07010' });
  artCircle(c, 0, -s * 0.75, s * 0.22, '#ffd24f', { lineColor: '#a07010' });
  artRoundRect(c, -s * 0.55, -s * 1.75, s * 1.1, s * 0.22, s * 0.08, '#ff9ec6', { lineColor: '#b0507a' });
  lkfHeartPath(c, 0, -s * 1.05, s * 0.25);
  c.fillStyle = 'rgba(255,90,138,0.6)';
  c.fill();
  if (lkf.regPop > 0) artGlow(c, 0, -s * 0.8, s * 1.6, '#ffe27a', lkf.regPop * 2);
}
function lkfDrawSleeper(c, H, p) {
  var s = H * 0.032, aw = p.awake > 0 ? 1 : 0, k;
  htCloudPuff(c, 0, -s * 0.2, s * 2.6, '#ffe2f0');
  if (p.bow > 0) htMannerPokeRainbow(c, 0, -s * 1.4, s * 1.6, Math.min(1, p.bow));
  trekDrawPup(c, 0, -s * 1.1 - aw * s * 0.3, s, { mood: aw ? 'wow' : 'sleepy', t: globalT, tint: '#e6dcff', squash: aw ? 0 : Math.sin(globalT * 2) * 0.04 });
  if (aw && p.awake > 1.0) {
    k = (1.6 - p.awake) / 0.6;
    c.fillStyle = 'rgba(140,190,255,0.7)';
    c.beginPath(); c.arc(s * 1.0, -s * 1.8 + k * s, s * 0.08, 0, Math.PI * 2); c.fill();
  }
  if (!aw) lkfText(c, 'Z', s * 1.1, -s * 2.0 - (globalT % 1.6) * s * 0.4, s * 0.6, '#8a7ab8', '#ffffff');
}

// ---------- Piirto: asiakkaat ----------
function lkfDrawBird(c, x, y, s, o) {
  var t = o.t || 0, f = o.flap ? Math.sin(t * 18) : Math.sin(t * 3) * 0.2, body = o.col || '#8fd0ff', line = artShade(body, -0.45);
  artBlob(c, x + s * 0.75, y + s * 0.05, s * 0.32, s * 0.14, artShade(body, -0.1), { lineColor: line, rot: -0.4 });
  artBlob(c, x - s * 0.55, y - s * 0.05 - f * s * 0.35, s * 0.42, s * 0.2, artShade(body, -0.08), { lineColor: line, rot: -0.6 - f * 0.6 });
  artCircle(c, x, y, s * 0.62, body, { lineColor: line, hi: 0.35 });
  artBlob(c, x - s * 0.05, y + s * 0.2, s * 0.38, s * 0.3, '#fff6e0', { lineColor: artShade('#fff6e0', -0.3), line: Math.max(1, s * 0.04) });
  artBlob(c, x + s * 0.45, y - s * 0.12 + f * s * 0.3, s * 0.36, s * 0.18, artShade(body, -0.08), { lineColor: line, rot: 0.6 + f * 0.6 });
  artEye(c, x - s * 0.22, y - s * 0.18, s * 0.12, o.look || 0, ((t * 0.9) % 3.1) < 0.12);
  artEye(c, x + s * 0.12, y - s * 0.18, s * 0.12, o.look || 0, ((t * 0.9) % 3.1) < 0.12);
  c.beginPath(); c.moveTo(x - s * 0.1, y - s * 0.02); c.lineTo(x - s * 0.05, y + s * 0.12); c.lineTo(x + s * 0.02, y - s * 0.02); c.closePath();
  artFillPath(c, '#ffb040', y - s * 0.02, y + s * 0.12, s * 0.1, { lineColor: '#b06010', line: Math.max(1, s * 0.03) });
  artBlush(c, x - s * 0.36, y + s * 0.02, s * 0.07);
  artBlob(c, x - s * 0.02, y - s * 0.62, s * 0.08, s * 0.16, body, { lineColor: line, rot: -0.3 });
}
function lkfDrawOwl(c, x, cy, s, o) {
  var body = '#c0a4e0', line = '#5a4080', belly = '#f6eaff', t = o.t, fl = o.wave ? Math.sin(t * 14) * 0.4 : Math.sin(t * 2) * 0.06, bl = o.blink, i;
  artBlob(c, x - s * 0.7, cy + s * 0.15, s * 0.24, s * 0.5, artShade(body, -0.1), { lineColor: line, rot: 0.35 + fl });
  artBlob(c, x + s * 0.7, cy + s * 0.15, s * 0.24, s * 0.5, artShade(body, -0.1), { lineColor: line, rot: -0.35 - fl });
  for (i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(x + i * s * 0.62, cy - s * 0.45); c.lineTo(x + i * s * 0.55, cy - s * 1.0); c.lineTo(x + i * s * 0.2, cy - s * 0.7); c.closePath();
    artFillPath(c, body, cy - s, cy - s * 0.45, s * 0.3, { lineColor: line });
  }
  artBlob(c, x, cy, s * 0.76, s * 0.86, body, { lineColor: line, hi: 0.3 });
  artBlob(c, x, cy + s * 0.32, s * 0.48, s * 0.46, belly, { lineColor: artShade(belly, -0.3), line: Math.max(1, s * 0.03) });
  c.strokeStyle = artShade(belly, -0.25);
  c.lineWidth = Math.max(1, s * 0.03);
  for (i = 0; i < 3; i++) { c.beginPath(); c.arc(x + (i - 1) * s * 0.2, cy + s * 0.32, s * 0.08, 0.2, Math.PI - 0.2); c.stroke(); }
  for (i = -1; i <= 1; i += 2) {
    artCircle(c, x + i * s * 0.28, cy - s * 0.22, s * 0.27, '#fffaf0', { lineColor: line, line: Math.max(1, s * 0.04) });
    if (o.mood === 'sad') {
      c.strokeStyle = '#3a2a5a'; c.lineWidth = Math.max(1.2, s * 0.05); c.lineCap = 'round';
      c.beginPath(); c.arc(x + i * s * 0.28, cy - s * 0.18, s * 0.12, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    } else artEye(c, x + i * s * 0.28, cy - s * 0.22, s * 0.16, o.look || 0, bl);
  }
  c.beginPath(); c.moveTo(x - s * 0.09, cy - s * 0.02); c.lineTo(x, cy + s * 0.16); c.lineTo(x + s * 0.09, cy - s * 0.02); c.closePath();
  artFillPath(c, '#ffb040', cy - s * 0.02, cy + s * 0.16, s * 0.1, { lineColor: '#a06010', line: Math.max(1, s * 0.03) });
  artBlush(c, x - s * 0.5, cy + s * 0.05, s * 0.09);
  artBlush(c, x + s * 0.5, cy + s * 0.05, s * 0.09);
}
function lkfDrawBear(c, x, y, s, o) {
  var body = '#d8a070', line = '#7a4a22', cy = y - s * 1.05, i, t = o.t, k = o.wave ? Math.sin(t * 12) * 0.3 : 0;
  // Pallo ja köydet
  c.strokeStyle = '#9a7a5a';
  c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath(); c.moveTo(x - s * 0.62, y - s * 0.55); c.lineTo(x - s * 0.42, y - s * 2.15); c.moveTo(x + s * 0.62, y - s * 0.55); c.lineTo(x + s * 0.42, y - s * 2.15); c.stroke();
  artCircle(c, x, y - s * 2.55, s * 0.55, '#ff8fb8', { lineColor: '#b0406a', hi: 0.4 });
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(x, y - s * 3.08); c.quadraticCurveTo(x + s * 0.25, y - s * 2.55, x, y - s * 2.02); c.stroke();
  artBlob(c, x, y - s * 2.03, s * 0.22, s * 0.06, '#ffe27a', { lineColor: '#a07010' });
  // Pää
  for (i = -1; i <= 1; i += 2) {
    artCircle(c, x + i * s * 0.42, cy - s * 0.42, s * 0.18, body, { lineColor: line });
    artCircle(c, x + i * s * 0.42, cy - s * 0.42, s * 0.09, '#f0c8a0', { line: false });
  }
  artCircle(c, x, cy, s * 0.56, body, { lineColor: line, hi: 0.25 });
  artBlob(c, x, cy + s * 0.16, s * 0.24, s * 0.17, '#f4dcc0', { lineColor: artShade('#f4dcc0', -0.3), line: Math.max(1, s * 0.03) });
  artBlob(c, x, cy + s * 0.08, s * 0.08, s * 0.055, '#4a2a1a', { line: false });
  if (o.mood === 'sad') {
    c.strokeStyle = '#3a2a1a'; c.lineWidth = Math.max(1.2, s * 0.05); c.lineCap = 'round';
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(x + i * s * 0.2, cy - s * 0.06, s * 0.07, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); }
  } else {
    artEye(c, x - s * 0.2, cy - s * 0.1, s * 0.08, o.look || 0, o.blink);
    artEye(c, x + s * 0.2, cy - s * 0.1, s * 0.08, o.look || 0, o.blink);
  }
  // Lentolasit otsalla
  artRoundRect(c, x - s * 0.42, cy - s * 0.42, s * 0.84, s * 0.1, s * 0.05, '#8a5a3a', { line: false });
  for (i = -1; i <= 1; i += 2) artCircle(c, x + i * s * 0.18, cy - s * 0.37, s * 0.12, '#bfe8ff', { lineColor: '#5a3a2a', hi: 0.6 });
  artBlush(c, x - s * 0.36, cy + s * 0.1, s * 0.08);
  artBlush(c, x + s * 0.36, cy + s * 0.1, s * 0.08);
  // Kori ja tassut
  artRoundRect(c, x - s * 0.7, y - s * 0.6, s * 1.4, s * 0.7, s * 0.12, '#e0a860', { lineColor: '#7a4a1a' });
  c.strokeStyle = 'rgba(122,74,26,0.45)';
  c.lineWidth = Math.max(1, s * 0.03);
  for (i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - s * 0.7 + i * s * 0.28, y - s * 0.58); c.lineTo(x - s * 0.7 + i * s * 0.28, y + s * 0.08); c.stroke(); }
  artCircle(c, x - s * 0.35, y - s * 0.62 - k * s * 0.4, s * 0.14, body, { lineColor: line });
  artCircle(c, x + s * 0.35, y - s * 0.62 + k * s * 0.4, s * 0.14, body, { lineColor: line });
}
function lkfDrawStarCust(c, x, cy, s, o) {
  var t = o.t, i;
  drawStar(c, x, cy, s * 0.95, Math.sin(t * 2) * 0.08 + (o.wave ? Math.sin(t * 14) * 0.15 : 0), 0.3);
  if (o.mood === 'sad') {
    c.strokeStyle = '#7a4a10'; c.lineWidth = Math.max(1.2, s * 0.05); c.lineCap = 'round';
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.arc(x + i * s * 0.18, cy - s * 0.02, s * 0.07, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); }
  } else {
    artEye(c, x - s * 0.18, cy - s * 0.06, s * 0.09, o.look || 0, o.blink);
    artEye(c, x + s * 0.18, cy - s * 0.06, s * 0.09, o.look || 0, o.blink);
  }
  artBlush(c, x - s * 0.32, cy + s * 0.1, s * 0.08);
  artBlush(c, x + s * 0.32, cy + s * 0.1, s * 0.08);
  c.strokeStyle = '#8a5a10';
  c.lineWidth = Math.max(1.2, s * 0.04);
  c.lineCap = 'round';
  c.beginPath();
  if (o.mood === 'sad') c.arc(x, cy + s * 0.24, s * 0.08, 1.15 * Math.PI, 1.85 * Math.PI);
  else c.arc(x, cy + s * 0.08, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI);
  c.stroke();
}
function lkfCrescent(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, Math.PI * 0.35, Math.PI * 1.65, false);
  c.arc(x + r * 0.45, y - r * 0.1, r * 0.8, Math.PI * 1.5, Math.PI * 0.5, true);
  c.closePath();
  artFillPath(c, col, y - r, y + r, r, { lineColor: '#c09020', line: Math.max(1, r * 0.12) });
}
// Asiakas: (x, y) = jalkojen kohta tiskin takana, s = koko
function lkfDrawCustomer(c, cu, x, y, s, small) {
  var H = viewH, t = cu.t + (cu.seed || 0), hop = 0, sh = 0, mood, o, bob, blink = ((t * 0.9) % 3.4) < 0.12, k, cy;
  bob = Math.sin(t * 2.2) * H * 0.006;
  if (cu.hop > 0) hop += Math.sin(cu.hop / 0.5 * Math.PI) * H * 0.03;
  if (cu.shakeT > 0) sh = Math.sin(cu.shakeT * 30) * H * 0.01;
  y += (cu.yOff || 0) - hop + bob;
  if (cu.sits && cu.state === 'wait') y += H * 0.018;
  mood = (cu.shakeT > 0 || cu.sits || cu.sighT > 0) ? 'sad' : (cu.joyT > 0 ? 'happy' : 'happy');
  o = { t: t, mood: mood, wave: cu.joyT > 0 || cu.waveT > 0, look: -0.6, blink: blink };
  c.save();
  c.translate(x + sh, y);
  if (cu.shakeT > 0) c.rotate(Math.sin(cu.shakeT * 30) * 0.06);
  if (cu.kind === 'pup') {
    trekDrawPup(c, 0, -s * 0.95, s * 0.88, { tint: cu.tint, mood: mood, t: t, seed: cu.seed, wave: o.wave, squint: cu.joyT > 0, look: -0.6 });
  } else if (cu.kind === 'owl') {
    lkfDrawOwl(c, 0, -s * 1.0, s * 0.95, o);
  } else if (cu.kind === 'moon') {
    // Kuupupu leijuu pikku kuunsirpin päällä
    drawBunny(c, 0, -s * 0.42, s * 0.82, 0, t * 2, false);
    lkfCrescent(c, s * 0.45, -s * 1.95, s * 0.2, '#ffe27a');
    drawStar(c, -s * 0.45, -s * 2.0, s * 0.09, t, 0);
    if (mood === 'sad') { c.fillStyle = 'rgba(120,160,255,0.85)'; c.beginPath(); c.arc(-s * 0.15, -s * 1.2 + (t % 1) * s * 0.15, s * 0.04, 0, Math.PI * 2); c.fill(); }
  } else if (cu.kind === 'bird') {
    lkfDrawBird(c, 0, -s * 0.95, s * 0.82, { t: t, flap: true, look: -0.6 });
    if (mood === 'sad') { c.fillStyle = 'rgba(120,160,255,0.85)'; c.beginPath(); c.arc(-s * 0.2, -s * 0.8 + (t % 1) * s * 0.15, s * 0.04, 0, Math.PI * 2); c.fill(); }
  } else if (cu.kind === 'bear') {
    lkfDrawBear(c, 0, 0, s * 0.85, o);
  } else {
    lkfDrawStarCust(c, 0, -s * 1.0, s * 0.95, o);
  }
  c.restore();
  if (small) return;
  // Istahtanut: pilvipuffi ja kaakaomuki
  if (cu.sits && cu.state === 'wait') {
    k = lkf.L.counterY;
    artRoundRect(c, x + s * 0.55, k - H * 0.035, H * 0.03, H * 0.03, H * 0.008, '#ffffff', { lineColor: '#b8a8c8' });
    artBlob(c, x + s * 0.55 + H * 0.015, k - H * 0.034, H * 0.012, H * 0.004, '#8a5236', { line: false });
  }
  if (cu.sighT > 0) lkfText(c, '...', x - H * 0.07, y - s * 2.0 - (1.8 - cu.sighT) * H * 0.03, H * 0.04, '#8a7a8a', '#ffffff');
  if (cu.joyT > 0) drawHeartShape(c, x + H * 0.03, y - s * 2.1 - (1.3 - cu.joyT) * H * 0.06, H * 0.018, true);
  if (cu.coughT > 0) {
    cy = y - s * 1.0;
    lkfText(c, '!', x - s * 0.8, cy - (1.3 - cu.coughT) * H * 0.04, H * 0.035, '#a0603a', '#ffffff');
  }
}
function lkfDrawHeld(c, cu) {
  if (!cu.hold) return;
  lkfDrawStack(c, cu.x - viewH * 0.09, lkf.L.counterY + viewH * 0.005 + (cu.yOff || 0), cu.hold.items, cu.hold.tops, 0.55, {});
}

// ---------- Piirto: kupla ----------
function lkfMiniStack(c, x, y, n, sc) {
  var i, H = viewH, rx = H * 0.046 * sc, ry = H * 0.015 * sc;
  for (i = 0; i < n; i++) lkfDrawLettu(c, x, y - i * H * 0.027 * sc, rx, ry, LKF_COLS.gold, artShade(LKF_COLS.gold, -0.12), { seed: i + 1 });
}
function lkfDrawBubble(c, cu) {
  var o = cu.o, H = viewH, B = lkfBubbleBox(cu), pop = cu.pop > 0 ? 1 + Math.sin(cu.pop / 0.4 * Math.PI) * 0.08 : 1, m = cu.miss, pulse = m ? 0.5 + Math.sin(globalT * 10) * 0.5 : 0;
  var i, j, d, rows, ry, x0, txt, open = lkfBubbleOpen(cu), same = o.kind === 'same' && o.ref && o.ref.state === 'wait', sx, sy, r = H * 0.027, k;
  c.save();
  c.translate(B.x, B.y);
  c.scale(pop, pop);
  c.translate(-B.x, -B.y);
  // Häntä asiakasta kohti
  sx = Math.max(B.x - B.w * 0.35, Math.min(B.x + B.w * 0.35, cu.x));
  c.beginPath(); c.moveTo(sx - H * 0.022, B.y + B.h / 2 - H * 0.01); c.lineTo(sx + (cu.x - sx) * 0.5, B.y + B.h / 2 + H * 0.045); c.lineTo(sx + H * 0.022, B.y + B.h / 2 - H * 0.01); c.closePath();
  artFillPath(c, '#ffffff', B.y, B.y + B.h, H * 0.05, { lineColor: '#c8a8d8', flat: true });
  artRoundRect(c, B.x - B.w / 2, B.y - B.h / 2, B.w, B.h, H * 0.04, cu.sits ? '#f0ecf6' : '#ffffff', { lineColor: '#c8a8d8', flat: true });
  c.fillStyle = cu.sits ? '#f0ecf6' : '#ffffff';
  c.fillRect(sx - H * 0.02, B.y + B.h / 2 - H * 0.02, H * 0.04, H * 0.02);
  if (!open) {
    // Suljettu muistikupla: kysymysmerkki kutsuu kurkistamaan
    k = 1 + Math.sin(globalT * 4) * 0.06;
    lkfText(c, '?', B.x, B.y + H * 0.004, H * 0.075 * k, '#8a6ac8', '#ffffff');
  } else if (same) {
    // "Sama kuin tuolla": viereisen asiakkaan pää ja =
    lkfText(c, '=', B.x - H * 0.06, B.y, H * 0.07, '#8a6ac8', '#ffffff');
    c.save();
    c.beginPath(); c.arc(B.x + H * 0.04, B.y, H * 0.07, 0, Math.PI * 2); c.clip();
    artCircle(c, B.x + H * 0.04, B.y, H * 0.07, '#f4f0ff', { line: false });
    lkfDrawCustomer(c, { kind: o.ref.kind, tint: o.ref.tint, t: o.ref.t, seed: o.ref.seed, state: 'wait' }, B.x + H * 0.04, B.y + H * 0.11, H * 0.072, true);
    c.restore();
    c.strokeStyle = '#c8a8d8';
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.beginPath(); c.arc(B.x + H * 0.04, B.y, H * 0.07, 0, Math.PI * 2); c.stroke();
    // Nuoli viereistä asiakasta kohti
    d = o.ref.x < cu.x ? -1 : 1;
    lkfText(c, d < 0 ? '<' : '>', B.x + d * H * 0.11, B.y, H * 0.05, '#8a6ac8', '#ffffff');
  } else {
    // Pino: kuvina erilliset letut, numeroin luku ja pieni pino
    sx = B.x - H * 0.068;
    sy = B.y + H * 0.06;
    if (m && m.part === 'n') {
      c.fillStyle = 'rgba(255,90,90,' + (0.18 + pulse * 0.25) + ')';
      roundRect(c, sx - H * 0.06, B.y - B.h / 2 + H * 0.012, H * 0.12, B.h - H * 0.024, H * 0.03);
      c.fill();
    }
    if (o.pics) lkfMiniStack(c, sx, sy, o.n, 1);
    else {
      lkfMiniStack(c, sx + H * 0.018, sy, 2, 0.8);
      lkfText(c, String(o.n), sx - H * 0.03, B.y - H * 0.015, H * 0.06, '#6a3a8a', '#ffffff');
    }
    // Täyterivit
    rows = o.tops.length;
    for (i = 0; i < rows; i++) {
      d = o.tops[i];
      ry = rows > 1 ? B.y - H * 0.04 + i * H * 0.08 : B.y;
      if (m && m.part === 'top' && m.i === i) {
        c.fillStyle = 'rgba(255,90,90,' + (0.18 + pulse * 0.25) + ')';
        roundRect(c, B.x - H * 0.012, ry - H * 0.038, H * 0.128, H * 0.072, H * 0.03);
        c.fill();
      }
      if (o.pics) {
        x0 = B.x + H * 0.05 - (d.n - 1) * H * 0.0175;
        for (j = 0; j < d.n; j++) lkfDrawTop(c, d.type, x0 + j * H * 0.035, ry + H * 0.022, r);
      } else {
        txt = d.sum ? d.sum[0] + '+' + d.sum[1] : String(d.n);
        lkfText(c, txt, B.x + H * (d.sum ? 0.032 : 0.04), ry, H * (d.sum ? 0.042 : 0.05), '#6a3a8a', '#ffffff');
        lkfDrawTop(c, d.type, B.x + H * (d.sum ? 0.093 : 0.085), ry + H * 0.022, r * 1.1);
      }
    }
    if (m && m.part === 'extra') {
      // Ylimääräinen täyte: kuva ja punainen ruksi
      lkfDrawTop(c, m.type, sx + H * 0.045, B.y - H * 0.045, r * 0.85);
      c.strokeStyle = '#e83040';
      c.lineWidth = Math.max(2, H * 0.006);
      c.beginPath(); c.moveTo(sx + H * 0.025, B.y - H * 0.075); c.lineTo(sx + H * 0.065, B.y - H * 0.035); c.moveTo(sx + H * 0.065, B.y - H * 0.075); c.lineTo(sx + H * 0.025, B.y - H * 0.035); c.stroke();
    }
  }
  c.restore();
  // Kärsivällisyyssydän kuplan kulmassa
  if (lkf.ph >= 1) lkfDrawPatience(c, B.x + B.w / 2 - H * 0.01, B.y - B.h / 2 + H * 0.008, cu);
}
function lkfDrawPatience(c, x, y, cu) {
  var H = viewH, s = H * 0.022, p = Math.max(0, Math.min(1, cu.pat)), pul = p < 0.3 && !cu.sits ? 1 + Math.sin(globalT * 12) * 0.12 : 1;
  s *= pul;
  artCircle(c, x, y, s * 1.25, '#ffffff', { lineColor: '#e0b8d0', flat: true });
  if (cu.sits) {
    // Huokaissut: harmaa pilvi
    htCloudPuff(c, x, y + s * 0.2, s * 1.6, '#d8d4e4');
    return;
  }
  lkfHeartPath(c, x, y + s * 0.12, s * 0.95);
  c.fillStyle = 'rgba(255,200,215,0.5)';
  c.fill();
  c.save();
  c.beginPath();
  c.rect(x - s * 1.2, y + s * 0.12 + s * 0.55 - p * s * 1.45, s * 2.4, p * s * 1.45);
  c.clip();
  lkfHeartPath(c, x, y + s * 0.12, s * 0.95);
  artFillPath(c, p < 0.3 ? '#ff5a6a' : '#ff6f9a', y - s * 0.8, y + s * 0.7, s, { line: false });
  c.restore();
  lkfHeartPath(c, x, y + s * 0.12, s * 0.95);
  c.strokeStyle = '#c0406a';
  c.lineWidth = Math.max(1.2, s * 0.12);
  c.stroke();
}

// ---------- Piirto: taivasaukko ja tiski ----------
function lkfSkyCols() {
  var k = lkf.dayK, A = ['#ffd2e4', '#ffeede'], B = ['#7cc4ff', '#d8f0ff'], C = ['#6a5aa8', '#ffa070'];
  if (k <= 1) return [artMix(A[0], B[0], k), artMix(A[1], B[1], k)];
  return [artMix(B[0], C[0], k - 1), artMix(B[1], C[1], k - 1)];
}
function lkfDrawSky(c) {
  var L = lkf.L, H = viewH, x0 = L.rz + H * 0.01, x1 = L.W - H * 0.01, y0 = H * 0.06, y1 = L.counterY, sky = lkfSkyCols(), g, i, x, ev = Math.max(0, lkf.dayK - 1), v = lkf.van, k, vx, vy;
  c.save();
  c.beginPath();
  c.moveTo(x0, y1);
  c.lineTo(x0, y0 + H * 0.12);
  c.quadraticCurveTo(x0, y0, x0 + H * 0.12, y0);
  c.lineTo(x1 - H * 0.12, y0);
  c.quadraticCurveTo(x1, y0, x1, y0 + H * 0.12);
  c.lineTo(x1, y1);
  c.closePath();
  c.clip();
  g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (ev < 0.6) artCircle(c, x0 + (x1 - x0) * (0.25 + lkf.dayK * 0.25), y0 + H * (0.12 + ev * 0.2), H * 0.035, '#fff2a0', { line: false });
  else {
    artCircle(c, x1 - H * 0.08, y0 + H * 0.1, H * 0.028, '#fffbe0', { line: false });
    for (i = 0; i < 6; i++) drawStar(c, x0 + (x1 - x0) * ((i * 0.37) % 1), y0 + H * (0.05 + ((i * 0.53) % 1) * 0.25), H * 0.008, 0, 0.3 * ev);
  }
  // Kaukainen Pilvilinna ja pilvet
  x = x0 + (x1 - x0) * 0.7;
  c.fillStyle = artMix('#ffffff', sky[1], 0.3);
  c.fillRect(x - H * 0.05, y1 - H * 0.2, H * 0.1, H * 0.12);
  c.fillRect(x - H * 0.08, y1 - H * 0.25, H * 0.035, H * 0.17);
  c.fillRect(x + H * 0.045, y1 - H * 0.24, H * 0.035, H * 0.16);
  c.fillStyle = artMix('#ff9ec6', sky[1], 0.4);
  for (i = -1; i <= 1; i++) {
    vx = x + i * H * 0.0625 + (i === 0 ? 0 : 0);
    c.beginPath(); c.moveTo(vx - H * 0.025, y1 - H * (i === 0 ? 0.2 : 0.245)); c.lineTo(vx, y1 - H * (i === 0 ? 0.26 : 0.3)); c.lineTo(vx + H * 0.025, y1 - H * (i === 0 ? 0.2 : 0.245)); c.closePath(); c.fill();
  }
  for (i = 0; i < 4; i++) {
    x = x0 + (((i * 0.31 + globalT * 0.006 * (1 + i * 0.3)) % 1.3) - 0.15) * (x1 - x0);
    htCloudPuff(c, x, y0 + H * (0.15 + (i % 2) * 0.1), H * (0.12 + (i % 3) * 0.03), ev > 0.3 ? '#e8d8f0' : '#eef4ff');
  }
  for (x = x0 - H * 0.05; x < x1 + H * 0.1; x += H * 0.1) htCloudPuff(c, x, y1 - H * 0.02, H * 0.16, '#f4f0ff');
  // Tavarantoimittajan ilmapallo
  if (v) {
    k = v.leave >= 0 ? easeInOutSine((v.t - v.leave) / 1.4) : 1 - easeOutCubic(Math.min(1, v.t / 1.4));
    vx = (x0 + x1) / 2 + (v.leave >= 0 ? k * 0.3 : k) * (x1 - x0) * 0.8;
    vy = H * 0.47 - (v.leave >= 0 ? k * H * 0.45 : 0) + Math.sin(globalT * 2) * H * 0.008;
    lkfDrawBear(c, vx, vy, H * 0.075, { t: globalT, mood: 'happy', wave: true, look: -0.5 });
    artRoundRect(c, vx + H * 0.03, vy - H * 0.085, H * 0.05, H * 0.04, H * 0.008, '#ffd0a0', { lineColor: '#9a6030' });
    c.strokeStyle = '#ff6f9a';
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.beginPath(); c.moveTo(vx + H * 0.055, vy - H * 0.085); c.lineTo(vx + H * 0.055, vy - H * 0.045); c.stroke();
  }
  c.restore();
  // Kaaren kehys
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(3, H * 0.014);
  c.beginPath();
  c.moveTo(x0, y1);
  c.lineTo(x0, y0 + H * 0.12);
  c.quadraticCurveTo(x0, y0, x0 + H * 0.12, y0);
  c.lineTo(x1 - H * 0.12, y0);
  c.quadraticCurveTo(x1, y0, x1, y0 + H * 0.12);
  c.lineTo(x1, y1);
  c.stroke();
}
function lkfDrawCounter(c) {
  var L = lkf.L, H = viewH, x0 = L.rz, y = L.counterY, i;
  artRoundRect(c, x0, y + H * 0.015, L.W - x0 + H * 0.02, H - y, H * 0.012, '#ffb8d0', { lineColor: '#a0506a' });
  for (i = 0; i < 3; i++) {
    c.fillStyle = i % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(255,240,250,0.5)';
    c.fillRect(x0 + H * 0.02, y + H * (0.07 + i * 0.07), L.W - x0, H * 0.012);
  }
  // Etupaneelin pilvikuviot
  for (i = 0; i < 4; i++) cloudShape(c, x0 + (L.W - x0) * (i + 0.5) / 4, y + H * 0.28, H * 0.02);
  artRoundRect(c, x0 - H * 0.01, y - H * 0.01, L.W - x0 + H * 0.03, H * 0.035, H * 0.012, '#fff2f8', { lineColor: '#a0607a' });
}

// ---------- Piirto: kokonaisuus ----------
function drawLettu() {
  var c = ctx, L = lkf.L, i, d, pl, x, y, k, f, H = viewH, cu, Lt, P;
  if (!beginPlayWorld()) return;
  lkfDrawSky(c);
  for (i = 0; i < lkf.leavers.length; i++) lkfDrawCustomer(c, lkf.leavers[i], lkf.leavers[i].x, L.custY, L.custS);
  for (i = 0; i < 2; i++) { cu = lkf.spots[i]; if (cu) lkfDrawCustomer(c, cu, cu.x, L.custY, L.custS); }
  lkfDrawCounter(c);
  for (i = 0; i < lkf.leavers.length; i++) lkfDrawHeld(c, lkf.leavers[i]);
  for (i = 0; i < 2; i++) { cu = lkf.spots[i]; if (cu) lkfDrawHeld(c, cu); }
  propsDraw(c, 0);
  lkfDrawJars(c);
  lkfDrawPans(c);
  // Kannu kotona tai kaatamassa
  if (!(lkf.drag && lkf.drag.kind === 'jug')) {
    if (lkf.jug && lkf.jug.pan >= 0 && lkf.jug.t < 0.45) {
      P = L.pans[lkf.jug.pan];
      lkfDrawJug(c, P.x + H * 0.06, P.y - H * 0.05, H * 0.04, -1.1);
      c.strokeStyle = LKF_BATTER;
      c.lineWidth = Math.max(3, H * 0.012);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(P.x + H * 0.005, P.y - H * 0.085); c.lineTo(P.x, P.y - H * 0.01); c.stroke();
    } else if (lkf.jug) {
      k = easeOutCubic(Math.max(0, (lkf.jug.t - (lkf.jug.pan >= 0 ? 0.45 : 0)) / 0.35));
      x = lkf.jug.pan >= 0 ? L.pans[lkf.jug.pan].x + H * 0.06 : lkf.jug.x0;
      y = lkf.jug.pan >= 0 ? L.pans[lkf.jug.pan].y - H * 0.05 : lkf.jug.y0 + H * 0.05;
      lkfDrawJug(c, x + (L.jug.x - x) * k, y + (L.jug.y - y) * k, H * 0.04, 0);
    } else lkfDrawJug(c, L.jug.x, L.jug.y, H * 0.04, 0);
  }
  lkfDrawBin(c);
  // Lautaset
  for (i = 0; i < 2; i++) {
    pl = lkf.plates[i];
    if (i >= LKF_PLATES[lkf.ph]) continue;
    if (pl.where === 'drag') continue;
    x = L.plates[i].x;
    y = L.plates[i].y;
    if (pl.where === 'fly') {
      k = easeOutCubic(pl.fly.t / 0.35);
      x = pl.fly.x0 + (x - pl.fly.x0) * k;
      y = pl.fly.y0 + (y - pl.fly.y0) * k - Math.sin(k * Math.PI) * H * 0.05;
    }
    c.save();
    c.translate(x, y);
    k = i === 1 && lkf.platesK < 1 ? easeOutBack(lkf.platesK) : 1;
    c.scale(k, k);
    if (pl.wob > 0) c.rotate(Math.sin(pl.wob * 30) * 0.05);
    if (pl.pop > 0) artSquash(c, Math.sin(pl.pop / 0.3 * Math.PI) * 0.1);
    lkfDrawStack(c, 0, 0, pl.items, pl.tops, 1, {});
    c.restore();
  }
  propsDraw(c, 1);
  // Lentävät esineet
  for (i = 0; i < lkf.flies.length; i++) {
    f = lkf.flies[i];
    if (f.t < (f.o.delay || 0)) continue;
    k = easeOutCubic((f.t - (f.o.delay || 0)) / f.dur);
    x = f.x0 + (f.x1 - f.x0) * k;
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * H * 0.06;
    if (f.kind === 'top') lkfDrawTop(c, f.o.type, x, y + H * 0.015, lkfTopR());
    else if (f.kind === 'coin') artCircle(c, x, y, H * 0.012, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
    else if (f.kind === 'star') drawStar(c, x, y, H * 0.022 * (1 + Math.sin(k * Math.PI) * 0.6), k * 6, f.o.gold ? 0.8 : 0);
  }
  // Pannulle palaavat letut
  for (i = 0; i < 3; i++) {
    Lt = lkf.pans[i].L;
    if (!Lt || Lt.where !== 'fly') continue;
    k = easeOutCubic(Lt.fly.t / 0.3);
    x = Lt.fly.x0 + (L.pans[i].x - Lt.fly.x0) * k;
    y = Lt.fly.y0 + (L.pans[i].y - Lt.fly.y0) * k - Math.sin(k * Math.PI) * H * 0.04;
    lkfDrawLettu(c, x, y, L.lRx, L.lRy, lkfQCol(Lt.q), lkfQCol(Lt.q), { seed: Lt.seed });
  }
  // Raahattava
  d = lkf.drag;
  if (d) {
    if (d.kind === 'jug') lkfDrawJug(c, d.x, d.y + H * 0.05, H * 0.042, -0.35 * Math.min(1, d.moved / (H * 0.2)));
    else if (d.kind === 'lettu') {
      Lt = lkf.pans[d.pan].L;
      artShadow(c, d.x, d.y + H * 0.05, L.lRx, L.lRy * 0.6, 0.15);
      lkfDrawSpatula(c, d.x + H * 0.03, d.y + H * 0.03, H * 0.055, false, 0.5);
      lkfDrawLettu(c, d.x, d.y, L.lRx, L.lRy, Lt.side === 1 ? artMix(LKF_BATTER, '#6a5040', 0.5) : lkfQCol(Lt.s1), lkfQCol(Lt.q), { seed: Lt.seed });
    } else if (d.kind === 'plate') {
      pl = lkf.plates[d.plate];
      lkfDrawStack(c, d.x, d.y, pl.items, pl.tops, 1, {});
    } else lkfDrawTop(c, d.type, d.x, d.y, lkfTopR() * 1.2);
  }
  lkfDrawPuffs(c);
  for (i = 0; i < 2; i++) { cu = lkf.spots[i]; if (cu && cu.state === 'wait') lkfDrawBubble(c, cu); }
  lkfDrawHint(c);
  lkfDrawEvening(c);
  drawParticlesLayer(c);
  if (celebrating) lkfDrawTrophy(c);
  endPlayWorld();
  lkfDrawHud(c);
  drawTaskOverlay(c);
}
function lkfDrawPuffs(c) {
  var i, p, a, r;
  for (i = 0; i < lkf.puffs.length; i++) {
    p = lkf.puffs[i];
    a = 1 - p.t / p.life;
    c.globalAlpha = Math.max(0, a * 0.75);
    r = p.r * (1 + p.t);
    if (p.heart) {
      lkfHeartPath(c, p.x, p.y, r * 1.2);
      c.fillStyle = p.col;
      c.fill();
    } else {
      c.fillStyle = p.col;
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
    }
  }
  c.globalAlpha = 1;
}
function lkfDrawEvening(c) {
  var ev = Math.max(0, lkf.dayK - 1), mo = Math.max(0, 1 - lkf.dayK), L = lkf.L;
  if (mo > 0) { c.fillStyle = 'rgba(255,220,230,' + (0.07 * mo) + ')'; c.fillRect(0, 0, viewW, viewH); }
  if (ev <= 0) return;
  c.fillStyle = 'rgba(150,110,200,' + (0.1 * ev) + ')';
  c.fillRect(0, 0, viewW, viewH);
  artGlow(c, L.pans[1].x, L.pans[1].y, viewH * 0.4, '#ffd890', 0.16 * ev);
}

// ---------- Vihjekäsi ----------
function lkfHintPos(st, k) {
  var a = st.from, b = st.to, m;
  if (st.kind === 'flip' || !b) {
    // Napautus: käsi painaa pannua kahdesti
    m = (k * 2) % 1;
    return { x: a.x, y: a.y, press: m < 0.5 ? m * 2 : (1 - m) * 2 };
  }
  if (k < 0.2) return { x: a.x, y: a.y, press: k / 0.2 };
  if (k < 0.75) {
    m = easeInOutSine((k - 0.2) / 0.55);
    return { x: a.x + (b.x - a.x) * m, y: a.y + (b.y - a.y) * m - Math.sin(m * Math.PI) * viewH * 0.05, press: 1 };
  }
  return { x: b.x, y: b.y, press: Math.max(0, 1 - (k - 0.75) / 0.12) };
}
function lkfDrawHint(c) {
  var st = lkf.hintStep, k, p, s = viewH * 0.07, a, per = st && st.kind === 'flip' ? 1.2 : 2.2;
  if (!st || lkf.hintT < 0.4) return;
  k = ((lkf.hintT - 0.4) % per) / per;
  p = lkfHintPos(st, k);
  a = Math.min(1, (lkf.hintT - 0.4) * 3);
  if (st.to && p.press > 0.3) {
    c.globalAlpha = 0.55 * a * p.press;
    if (st.kind === 'top' || st.kind === 'topOff') lkfDrawTop(c, st.type, p.x, p.y + viewH * 0.012, lkfTopR());
    else if (st.kind === 'pour') lkfDrawJug(c, p.x, p.y + viewH * 0.05, viewH * 0.04, -0.3);
    else if (st.kind === 'take' || st.kind === 'bin') lkfDrawLettu(c, p.x, p.y, lkf.L.lRx, lkf.L.lRy, LKF_COLS.gold, LKF_COLS.gold, { seed: 3 });
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (st.kind === 'flip') { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.03 + (1 - p.press) * 0.05), 0, Math.PI * 2); c.stroke(); }
  else if (k < 0.2) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - p.press) * s * -0.25, s);
  c.globalAlpha = 1;
}

// ---------- HUD ja juhla ----------
function lkfHudSlot(i) {
  var gap = viewH * 0.05, x = hudX() + viewH * 0.045 + i * gap + (i >= LKF_PHASE_AT[1] ? viewH * 0.014 : 0) + (i >= LKF_PHASE_AT[2] ? viewH * 0.014 : 0);
  return { x: x, y: viewH * 0.063 };
}
function lkfDrawHud(c) {
  var i, sl, n = lkf.orders.length, last = lkfHudSlot(n - 1), w, cur, gold = lkfGolden(), pop, cu, j;
  w = last.x + viewH * 0.1 - hudX();
  drawHudPanel(c, hudX(), viewH * 0.018, w, viewH * 0.09, viewH * 0.025);
  for (i = 0; i < n; i++) {
    sl = lkfHudSlot(i);
    cur = false;
    for (j = 0; j < 2; j++) { cu = lkf.spots[j]; if (cu && cu.o.idx === i && cu.state !== 'leave') cur = true; }
    if (lkf.stars[i]) {
      pop = lkf.starPop > 0 ? 1 + lkf.starPop * 0.5 : 1;
      if (lkf.stars[i] === 2) drawStar(c, sl.x, sl.y, viewH * 0.02 * pop, 0, 0.3);
      else { c.globalAlpha = 0.85; drawStar(c, sl.x, sl.y, viewH * 0.018 * pop, 0, 0); c.globalAlpha = 1; artCircle(c, sl.x + viewH * 0.013, sl.y + viewH * 0.011, viewH * 0.006, '#ff9ec6', { line: false }); }
    } else {
      artCircle(c, sl.x, sl.y, viewH * (cur ? 0.018 + Math.sin(globalT * 4) * 0.002 : 0.014), cur ? '#fff6e0' : 'rgba(255,255,255,0.5)', { lineColor: cur ? '#d89a5a' : '#c8b0c8', flat: true });
      if (cur) lkfMiniStack(c, sl.x, sl.y + viewH * 0.008, 2, 0.32);
    }
  }
  c.globalAlpha = gold ? 1 : 0.45;
  lkfDrawSpatula(c, last.x + viewH * 0.055, viewH * 0.085, viewH * 0.045, gold, 0.35 + (lkf.goldLostT > 0 ? Math.sin(lkf.goldLostT * 30) * 0.2 : 0));
  c.globalAlpha = 1;
}
function lkfDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, lkf.celT / 0.8)), gold = lkfGolden(), x = viewW / 2, y = H * 0.62, i, items = [], tops;
  if (k <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(k * 1.8, k * 1.8);
  artGlow(c, 0, -H * 0.06, H * 0.2, gold ? '#ffe27a' : '#ffd0e0', 0.6);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.14, -H * 0.06 + Math.sin(globalT + i * Math.PI / 4) * H * 0.1, H * 0.012, globalT * 2, 0.4);
  for (i = 0; i < 5; i++) items.push({ q: 'gold', seed: i + 2 });
  tops = [{ type: 'jamS', slot: 5 }, { type: 'jamB', slot: 6 }, { type: 'berry', slot: 1 }, { type: 'berry', slot: 2 }, { type: 'cream', slot: 0 }, { type: 'star', slot: 3 }, { type: 'star', slot: 4 }];
  lkfDrawStack(c, 0, 0, items, tops, 1, {});
  if (gold) {
    lkfDrawSpatula(c, -H * 0.12, -H * 0.02, H * 0.07, true, -0.5 + Math.sin(globalT * 3) * 0.1);
    lkfDrawSpatula(c, H * 0.12, -H * 0.02, H * 0.07, true, 0.5 - Math.sin(globalT * 3) * 0.1);
  }
  c.restore();
}

// ---------- Kartan kuvake ----------
// Lettupino hillolla ja kermalla sekä höyryävä pannu
HUB_ICONS.lettu = function (c, x, y, s) {
  var r = s * 0.13, i, py = y + r * 1.25, px = x - r * 1.45, pY = y - r * 0.15;
  // Pannu takana vasemmalla, höyryää
  artLimb(c, px - r * 0.8, pY + r * 0.3, px - r * 1.55, pY - r * 0.35, r * 0.24, '#ff9ec6', '#9a4a6a');
  lkfEll(c, px, pY + r * 0.06, r * 1.0, r * 0.46);
  artFillPath(c, '#6a6488', pY - r * 0.45, pY + r * 0.5, r, { lineColor: '#3a3458' });
  lkfDrawLettu(c, px, pY - r * 0.05, r * 0.72, r * 0.3, LKF_COLS.gold, LKF_COLS.gold, { seed: 4 });
  for (i = 0; i < 3; i++) {
    c.globalAlpha = 0.75;
    artCircle(c, px - r * 0.2 + i * r * 0.25, pY - r * (0.75 + i * 0.5) - Math.sin(globalT * 2 + i) * r * 0.08, r * (0.17 + i * 0.05), '#ffffff', { line: false });
    c.globalAlpha = 1;
  }
  // Pino lautasella: hilloa ja kermaa
  lkfEll(c, x + r * 0.7, py, r * 1.45, r * 0.45);
  artFillPath(c, '#ffffff', py - r * 0.45, py + r * 0.45, r, { lineColor: '#b8a8d8', shadeTo: '#ece6fa' });
  for (i = 0; i < 4; i++) lkfDrawLettu(c, x + r * 0.7, py - r * 0.3 - i * r * 0.36, r * 1.05, r * 0.4, LKF_COLS.gold, artShade(LKF_COLS.gold, -0.12), { seed: i + 1 });
  lkfDrawTop(c, 'jamS', x + r * 0.35, py - r * 1.4, r * 0.7);
  lkfDrawTop(c, 'cream', x + r * 1.0, py - r * 1.45, r * 0.85);
  lkfDrawTop(c, 'berry', x + r * 0.7, py - r * 1.15, r * 0.6);
};
