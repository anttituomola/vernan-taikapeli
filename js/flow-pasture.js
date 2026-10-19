'use strict';

// Linnan hevoslaidun: linnan kahdeksas huone (HOME_ROOMS[7]) on tallin
// takaportin takana. Laidun on kolmen ruudun levyinen niitty, jota vieritetään
// (ei kauppaa). Tallin ponit ovat samoja eläimiä: kun portista tullaan, ne
// laukkaavat laitumelle yksi kerrallaan.
//
// Ratsastus: prinsessa seisoo portin luona. Hänet raahataan ponin selkään
// (tai poni raahataan prinsessan luo). Selässä ohjataan kuten kentissä:
// sormi pohjassa niityllä, ja poni menee sormea kohti — lähellä käynti,
// kauempana ravi, kaukana laukka. Laukatessa vapaat ponit liittyvät
// laumaksi perään. Esteen yli hypätään itsestään vauhdissa; käynnissä
// puomi putoaa ja poni kompastuu (vesiesteessä se kahlaa). Ratsastajasta
// raahaamalla prinsessa nousee pois.
//
// Esterata: lähtökaari ja viisi numeroitua estettä sateenkaaren väreissä.
// Kaaren läpi ratsastaminen käynnistää kellon ja Tähtiponin (hohtava
// haamuponi), joka ratsastaa ennätysreitin. Esteet 1–5 järjestyksessä ja
// takaisin kaaren läpi. Tähtiponin voittaminen = uusi ennätys, ja Tähtiponi
// ratsastaa jatkossa sinun reittisi. Ennen ennätystä Tähtiponi näyttää
// radan rauhallisella esimerkkikierroksella. Kierroksesta poni saa ruusukkeen
// suitsiinsa (kerran päivässä ponia kohden; ennätys = kerran päivässä
// kultainen, eli tähti), ja ruusuke menee tallin ruusuketaululle. Kun kukaan
// ei ratsasta, esteitä voi raahata uusiin paikkoihin (uusi rata nollaa
// ennätyksen) ja esteen napautus laskee sen numeron kilinöin.
//
// Niityllä: omenapuu (napautus ravistaa omenoita, ponit syövät; kerran
// päivässä kultainen omena = tähti), lampi (renkaat, sammakko, kala),
// mutalammikko (ponit kieriskelevät ja tulevat mutaisiksi talliin harjattaviksi),
// apilat (yksi päivän nelilehtinen = tähti), sadepilvi (sade ja sateenkaari),
// perhoset (varsat jahtaavat), tammi ja pöllö. Prinsessan napautus vihellyttää
// ponit luokse. Ponin voi nostaa ja laskea pupun viereen (pupu ratsastaa),
// mutaan (kieriskely) tai prinsessan luo (ratsastus).

var PASTURE_ROOM = 7;
var PAS_WALK = 0.16;         // nopeudet viewH/s
var PAS_TROT = 0.32;
var PAS_GALLOP = 0.56;
var PAS_JUMP_MIN = 0.24;     // tätä hitaampi ylitys kaataa puomin
var PAS_GHOST_V = 0.42;      // esimerkkikierroksen Tähtiponin vauhti
var PAS_SAMPLE = 0.1;        // reitin näytteenväli (s)
var PAS_GHOST_MAX = 1500;    // näytteitä enintään (150 s)
var PAS_APPLES_DAY = 8;
var PAS_FLAG = ['#ff5a5a', '#ff9f3a', '#ffd23a', '#5fd36b', '#4aa8ff'];
// Esteet: 0 = lähtö- ja maalikaari, 1..5 numeroidut esteet
var PAS_KINDS = ['arch', 'rail', 'flower', 'water', 'log', 'oxer'];
var PAS_COURSE_DEFAULT = [[1.55, 0.5], [2.25, 0.26], [3.0, 0.3], [3.8, 0.5], [3.2, 0.8], [2.4, 0.78]];
var PAS_MELODY = [784, 659, 784, 880, 784, 659, 523, 659, 587, 659, 784, 659, 587, 523, 587, 392];
var PAS_CLOVERS = [[0.28, 0.48], [1.3, 0.94], [1.95, 0.6], [2.75, 0.96], [3.45, 0.12], [4.05, 0.95], [2.78, 0.54]];

// Tallennettava tila
var pasCourse = [];          // [{ x (viewH-yksiköinä), t (syvyys 0..1) }] indeksi = esteen numero
var pasRecord = 0;           // ennätysaika (s), 0 = ei ennätystä
var pasGhost = null;         // ennätysreitti [x, t, x, t, ...], null = esimerkkikierros
var pasGoldDay = -1;         // päivä, jona ennätys antoi kultaruusukkeen
var pasAppleDay = -1;
var pasApplesN = 0;          // omenoita pudotettu tänään
var pasGoldApple = -1;       // päivä, jona kultainen omena löytyi
var pasCloverDay = -1;       // päivä, jona nelilehtinen löytyi
var pasRode = false;         // on ratsastettu (vihjenuoli pois)
var pasDemoV = PAS_GHOST_V;  // esimerkkikierroksen vauhti: hidastuu huomaamatta häviöistä

// Ajonaikainen tila
var pasCam = 0;              // kameran x (maailman pikseleinä)
var pasCamV = 0;
var pasCamGoal = -1;
var pasPrin = null;          // prinsessa { x, y, mode: 'foot'|'held'|'ride', dir, wph, waveT, hopT, hx, hy }
var pasRider = null;         // poni, jolla prinsessa ratsastaa
var pasRound = null;         // { t, next, path, sampleT, knocks, gt (Tähtiponin aika) }
var pasGhostRun = null;      // Tähtiponin toisto { path, total, x, y, dir, z, done, prance }
var pasDemo = null;          // esimerkkireitti (lasketaan radasta)
var pasApples = [];          // maassa ja putoamassa { x, y, gy, vy, gold, eater }
var pasHearts = [];
var pasNotes = [];
var pasRings = [];           // lammen renkaat { x, y, age }
var pasRain = [];
var pasFly = [];             // lentävät ruusukkeet ja tähdet { x0, y0, x1, y1, t, kind, g, scr, pony }
var pasFire = [];            // ilotulituksen raketit ja kipinät (ruudun koordinaatit)
var pasButterflies = [];
var pasBunRide = null;       // { b, p, t }
var pasTaps = { p: null, n: 0, t: -9 };
var pasTreeShake = 0;
var pasOakShake = 0;
var pasOwl = { taps: 0, eyesT: 0, flyT: 0 };
var pasFrog = { pad: 0, jumpT: 0, from: 0, taps: 0 };
var pasFish = { t: 4, jumpT: 0, x: 0 };
var pasCloud = { x: 0, rainT: 0, bowT: 0, wob: 0 };
var pasMudBlub = 0;
var pasCloverSpin = [];
var pasLuckyT = 0;
var pasBirdT = 3;
var pasEnterQ = [];          // portista laukkaavat ponit { p, t }
var pasInviteT = 0;          // Tähtiponin kutsuhyppy
var pasBanner = null;        // { kind: 'win'|'lose'|'record', t, time }
var pasFarCanvas = document.createElement('canvas');
var pasMidCanvas = document.createElement('canvas');
var pasTileCanvas = document.createElement('canvas');
var pasBgKey = '';
var pasSky = null;
var pasHerdSlow = 0;
var pasFollowN = 0;
var pasLastCam = 0;
var pasIdleT = 0;            // aika viimeisestä ohjauksesta (ohjausvihje)

// ---------- Mitat ----------
function pasWorldW() {
  return Math.max(viewH * 4.6, viewW * 2.6);
}
function pasTop() { return viewH * 0.47; }
function pasBot() { return viewH * 0.965; }
function pasYofT(t) { return pasTop() + t * (pasBot() - pasTop()); }
function pasTofY(y) { return (y - pasTop()) / (pasBot() - pasTop()); }
// Syvyysskaala: kaukana pienempi
function pasK(y) {
  return 0.72 + 0.38 * Math.max(0, Math.min(1, pasTofY(y)));
}
function pasPonySize(p, y) {
  var s = viewH * 0.095 * pasK(y);
  if (p.k === 'foal') return s * (0.55 + 0.3 * stabAge(p));
  return s;
}
function pasClampY(y) {
  return Math.min(Math.max(y, pasTop() + viewH * 0.035), pasBot() - viewH * 0.005);
}
function pasClampX(x) {
  return Math.min(Math.max(x, viewH * 0.12), pasWorldW() - viewH * 0.12);
}
function pasGate() {
  return { x: viewH * 0.42, y: pasTop() - viewH * 0.005, w: viewH * 0.17, h: viewH * 0.15 };
}
function pasTree() {
  return { x: viewH * 1.22, y: pasTop() + viewH * 0.035, s: viewH * 0.27 };
}
function pasOak() {
  return { x: pasWorldW() - viewH * 0.32, y: pasTop() + viewH * 0.02, s: viewH * 0.4 };
}
function pasPond() {
  return { x: viewH * 0.62, y: pasYofT(0.8), rx: viewH * 0.3, ry: viewH * 0.075 };
}
function pasMud() {
  return { x: Math.min(viewH * 4.3, pasWorldW() - viewH * 0.45), y: pasYofT(0.86), rx: viewH * 0.17, ry: viewH * 0.045 };
}
function pasInEllipse(e, x, y, pad) {
  var dx = (x - e.x) / (e.rx + (pad || 0)), dy = (y - e.y) / (e.ry + (pad || 0) * 0.4);
  return dx * dx + dy * dy < 1;
}
function pasLilyPads() {
  var p = pasPond();
  return [{ x: p.x - p.rx * 0.5, y: p.y - p.ry * 0.15 }, { x: p.x + p.rx * 0.1, y: p.y + p.ry * 0.35 }, { x: p.x + p.rx * 0.55, y: p.y - p.ry * 0.25 }];
}
function pasCloverPos(i) {
  var c = PAS_CLOVERS[i];
  return { x: Math.min(c[0] * viewH, pasWorldW() - viewH * 0.2), y: pasYofT(c[1]) };
}
function pasLuckyIdx() {
  return (stabDay() * 3 + 1) % PAS_CLOVERS.length;
}

// Este: keskipiste, puolisyvyys d ja kallistus L (takapää oikealla ylhäällä)
function pasObs(i) {
  var o = pasCourse[i], y = pasYofT(o.t);
  return { n: i, kind: PAS_KINDS[i], x: o.x * viewH, y: y, d: viewH * 0.085, L: viewH * 0.055, k: pasK(y), down: o.downT || 0, ok: o.ok || 0, wig: o.wig || 0 };
}
// Esteen viivan x syvyydellä y
function pasObsLineX(ob, y) {
  return ob.x - (y - ob.y) / ob.d * ob.L;
}

// ---------- Tallennus ----------
function pasSaveData() {
  var i, o = [], g = null;
  for (i = 0; i < pasCourse.length; i++) o.push([Math.round(pasCourse[i].x * 100) / 100, Math.round(pasCourse[i].t * 100) / 100]);
  if (pasGhost) {
    g = [];
    for (i = 0; i < pasGhost.length; i++) g.push(Math.round(pasGhost[i] * 200) / 200);
  }
  return { o: o, r: Math.round(pasRecord * 10) / 10, g: g, dv: Math.round(pasDemoV * 100) / 100, gd: pasGoldDay, ad: pasAppleDay, an: pasApplesN, ga: pasGoldApple, cd: pasCloverDay, rode: pasRode ? 1 : 0 };
}
function pasLoadData(d) {
  var i, src;
  pasCourse = [];
  for (i = 0; i < PAS_COURSE_DEFAULT.length; i++) pasCourse.push({ x: PAS_COURSE_DEFAULT[i][0], t: PAS_COURSE_DEFAULT[i][1] });
  pasRecord = 0;
  pasGhost = null;
  pasDemo = null;
  pasGoldDay = pasAppleDay = pasGoldApple = pasCloverDay = -1;
  pasApplesN = 0;
  pasRode = false;
  pasDemoV = PAS_GHOST_V;
  if (!d || typeof d !== 'object') return;
  if (+d.dv >= 0.28 && +d.dv <= PAS_GHOST_V) pasDemoV = +d.dv;
  if (d.o && d.o.length === PAS_COURSE_DEFAULT.length) {
    for (i = 0; i < d.o.length; i++) {
      src = d.o[i];
      if (src && isFinite(+src[0]) && isFinite(+src[1])) { pasCourse[i].x = +src[0]; pasCourse[i].t = Math.max(0.1, Math.min(0.9, +src[1])); }
    }
  }
  if (d.g && d.g.length >= 4 && d.g.length % 2 === 0 && +d.r > 0) {
    pasGhost = [];
    for (i = 0; i < d.g.length; i++) pasGhost.push(+d.g[i] || 0);
    pasRecord = +d.r;
  }
  pasGoldDay = d.gd === undefined ? -1 : d.gd | 0;
  pasAppleDay = d.ad === undefined ? -1 : d.ad | 0;
  pasApplesN = d.an | 0;
  pasGoldApple = d.ga === undefined ? -1 : d.ga | 0;
  pasCloverDay = d.cd === undefined ? -1 : d.cd | 0;
  pasRode = !!d.rode;
}
// Uusi peli (ei tallennusta): oletusrata
pasLoadData(null);

// Testaus: kelaa laitumen päiväleimat n päivää taaksepäin
function pasShiftDays(n) {
  if (pasGoldDay >= 0) pasGoldDay -= n;
  if (pasAppleDay >= 0) pasAppleDay -= n;
  if (pasGoldApple >= 0) pasGoldApple -= n;
  if (pasCloverDay >= 0) pasCloverDay -= n;
  stabShiftDays(n);
}

// ---------- Tähtiponin reitti ----------
// Esimerkkireitti: kaaresta esteiden 1..5 läpi (lähestyminen ja poistuminen
// esteen suunnassa) ja takaisin kaaren läpi, pehmennettynä ja tasavälein
function pasMakeDemo() {
  var h = viewH, pts = [], i, ob, a = pasObs(0), prev = { x: a.x, y: a.y }, dir, ax;
  pts.push({ x: a.x, y: a.y });
  for (i = 1; i <= 5; i++) {
    ob = pasObs(i);
    dir = ob.x >= prev.x ? 1 : -1;
    pts.push({ x: ob.x - dir * h * 0.3, y: ob.y });
    pts.push({ x: ob.x + dir * h * 0.3, y: ob.y });
    prev = pts[pts.length - 1];
  }
  dir = a.x >= prev.x ? 1 : -1;
  ax = a.x - dir * h * 0.3;
  pts.push({ x: ax, y: a.y });
  pts.push({ x: a.x + dir * h * 0.03, y: a.y });
  // Catmull-Rom-pehmennys
  var sm = [], k, s, p0, p1, p2, p3, t;
  for (k = 0; k < pts.length - 1; k++) {
    p0 = pts[Math.max(0, k - 1)]; p1 = pts[k]; p2 = pts[k + 1]; p3 = pts[Math.min(pts.length - 1, k + 2)];
    for (s = 0; s < 10; s++) {
      t = s / 10;
      var t2 = t * t, t3 = t2 * t;
      sm.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      });
    }
  }
  sm.push(pts[pts.length - 1]);
  // Tasavälinen näytteistys vauhdilla PAS_GHOST_V (syvyyssuunta hitaampi kuten ratsastaessa)
  var out = [], step = pasDemoV * h * PAS_SAMPLE, acc = 0, cx = sm[0].x, cy = sm[0].y, j = 1, dx, dy, dl;
  out.push(cx / h, pasTofY(cy));
  while (j < sm.length && out.length < PAS_GHOST_MAX * 2) {
    dx = sm[j].x - cx; dy = (sm[j].y - cy) / 0.75;
    dl = Math.sqrt(dx * dx + dy * dy);
    if (acc + dl >= step) {
      var f = (step - acc) / dl;
      cx += dx * f; cy += dy * 0.75 * f;
      out.push(cx / h, pasTofY(cy));
      acc = 0;
    } else {
      acc += dl;
      cx = sm[j].x; cy = sm[j].y;
      j++;
    }
  }
  out.push(sm[sm.length - 1].x / h, pasTofY(sm[sm.length - 1].y));
  return out;
}
function pasGhostPath() {
  if (pasGhost) return pasGhost;
  if (!pasDemo) pasDemo = pasMakeDemo();
  return pasDemo;
}
function pasPathTotal(path) {
  return (path.length / 2 - 1) * PAS_SAMPLE;
}
function pasPathAt(path, t) {
  var n = path.length / 2, f = t / PAS_SAMPLE, i = Math.floor(f), u;
  if (i >= n - 1) return { x: path[(n - 1) * 2] * viewH, y: pasYofT(path[(n - 1) * 2 + 1]), end: true };
  if (i < 0) { i = 0; f = 0; }
  u = f - i;
  return {
    x: (path[i * 2] + (path[i * 2 + 2] - path[i * 2]) * u) * viewH,
    y: pasYofT(path[i * 2 + 1] + (path[i * 2 + 3] - path[i * 2 + 1]) * u),
    end: false
  };
}

// ---------- Sisääntulo ja poistuminen ----------
function pasPonyInit(p, x, y) {
  p.qx = x; p.qy = y; p.qlx = x; p.qly = y; p.qdir = 1; p.qst = 'idle'; p.qtx = x; p.qty = y;
  p.qsp = 0; p.qwant = 0; p.qtimer = 1 + Math.random() * 2; p.qz = 0; p.qjump = 0; p.qjumpH = 0;
  p.qhead = 0; p.qtoss = 0; p.qrearT = 0; p.qrollT = 0; p.qros = p.qros || 0; p.qwph = Math.random() * 6;
  p.qshine = 0; p.qslot = -1; p.qstum = 0; p.qbuck = 0; p.qgraze = false; p.qmudT = 0; p.qhx = 1; p.qhy = 0;
  p.qapple = null; p.qheld = 0;
}
function pasOnEnter() {
  var i, p, g = pasGate(), d = stabDay(), b;
  stabMorning();
  pasBgKey = '';
  pasRound = null;
  pasGhostRun = null;
  pasDemo = null;
  pasApples = []; pasHearts = []; pasNotes = []; pasRings = []; pasRain = []; pasFly = []; pasFire = [];
  pasBunRide = null; pasBanner = null; pasCloverSpin = [];
  pasCam = 0; pasCamV = 0; pasCamGoal = -1;
  pasRider = null;
  pasFollowN = 0;
  pasPrin = { x: viewH * 0.8, y: pasYofT(0.34), mode: 'foot', dir: 1, wph: 0, waveT: 1.6, hopT: 0, hx: 0, hy: 0, taps: 0 };
  pasCloud = { x: viewH * 2.1, rainT: 0, bowT: 0, wob: 0 };
  if (pasAppleDay !== d) { pasAppleDay = d; pasApplesN = 0; }
  for (i = 0; i < pasCourse.length; i++) { pasCourse[i].ok = 0; pasCourse[i].downT = 0; pasCourse[i].wig = 0; }
  // Ponit laukkaavat portista yksi kerrallaan
  pasEnterQ = [];
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    pasPonyInit(p, g.x, pasTop() + viewH * 0.02);
    p.qros = 0;
    p.qst = 'wait';
    pasEnterQ.push({ p: p, t: 0.5 + i * 0.5 });
  }
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    b.qx = g.x + viewH * (0.25 + i * 0.1);
    b.qy = pasYofT(0.2 + i * 0.12);
    b.oy = 0;
    b.hop = 1;
    b.qdir = 1;
  }
  pasButterflies = [];
  for (i = 0; i < 4; i++) {
    pasButterflies.push({ x: viewH * (0.8 + i * 0.9), y: pasYofT(0.3 + (i % 2) * 0.4) - viewH * 0.08, tx: 0, ty: 0, t: Math.random() * 6, c: ['#ff9ec4', '#ffd24f', '#9fd8ff', '#c9a0ff'][i], loopT: 0 });
    pasButterflies[i].tx = pasButterflies[i].x; pasButterflies[i].ty = pasButterflies[i].y;
  }
  pasFrog = { pad: 0, jumpT: 0, from: 0, taps: 0 };
  pasOwl = { taps: 0, eyesT: 0, flyT: 0 };
  pasInviteT = 0;
  pasBirdT = 2;
  // Portti narahtaa auki ja niityn sävel
  playNote(330, 0, 0.15, 'triangle', 0.15);
  playNote(294, 0.12, 0.2, 'triangle', 0.12);
  var mel = [523, 659, 784, 659, 880, 784];
  for (i = 0; i < mel.length; i++) playNote(mel[i], 0.35 + i * 0.13, 0.16, 'sine', 0.18);
  saveProgress();
}
function pasOnLeave() {
  var i;
  pasRound = null;
  pasGhostRun = null;
  pasRider = null;
  pasBunRide = null;
  for (i = 0; i < homeBunnies.length; i++) homeBunnies[i].oy = 0;
}

// ---------- Liike ----------
// Kohti (qtx, qty) vauhdilla qwant; perillä true
function pasMoveToward(p, dt, slowNear) {
  var h = viewH, dx = p.qtx - p.qx, dy = (p.qty - p.qy) / 0.75, dist = Math.sqrt(dx * dx + dy * dy), want = p.qwant, step;
  if (slowNear !== false && dist < h * 0.12) want = Math.min(want, Math.max(PAS_WALK * 0.7, dist / (h * 0.12) * want));
  p.qsp += (want - p.qsp) * Math.min(1, dt * 3);
  step = p.qsp * h * dt;
  if (dist <= Math.max(step, 2)) { p.qx = p.qtx; p.qy = p.qty; return true; }
  p.qx += dx / dist * step;
  p.qy += dy / dist * step * 0.75;
  if (Math.abs(dx) > 3) p.qdir = dx > 0 ? 1 : -1;
  return false;
}
function pasGo(p, st, x, y, v) {
  p.qst = st;
  p.qtx = pasClampX(x);
  p.qty = pasClampY(y);
  p.qwant = v;
  p.qgraze = false;
}
// Askelrytmi ja kavioäänet: käynti 4-tahti, ravi 2-tahti, laukka 3-tahti
function pasGait(p, dt, loud) {
  var v = p.qsp, rate = v > 0.42 ? 13 : (v > 0.24 ? 10 : 6), before = p.qwph, beat, k;
  if (v < 0.02) return;
  p.qwph += dt * rate * Math.min(1, v / 0.1);
  if (p.qz > 0) return;
  if (Math.floor(before / Math.PI) === Math.floor(p.qwph / Math.PI)) return;
  var onScreen = p.qx > pasCam - viewH * 0.2 && p.qx < pasCam + viewW + viewH * 0.2;
  if (!onScreen) return;
  var vol = loud ? 0.05 : 0.025;
  if (loud && v > 0.42) {
    // Ratsastajan laukka soittaa iloista ratsastuslaulua askel kerrallaan
    p.qmel = ((p.qmel || 0) + 1) % PAS_MELODY.length;
    playNote(PAS_MELODY[p.qmel], 0, 0.16, 'triangle', 0.07);
  }
  if (v > 0.42) { for (k = 0; k < 3; k++) playNote(200 + k * 30 + Math.random() * 30, k * 0.06, 0.03, 'square', vol); }
  else if (v > 0.24) { playNote(240 + Math.random() * 40, 0, 0.03, 'square', vol); playNote(300 + Math.random() * 40, 0.05, 0.03, 'square', vol * 0.8); }
  else if (loud || Math.random() < 0.5) playNote(220 + Math.random() * 60, 0, 0.03, 'square', vol * 0.7);
  if (v > 0.42 && Math.random() < 0.6) spawnDust(p.qx - p.qdir * viewH * 0.04, p.qy, 1, -p.qdir);
}
function pasFootFx(p, dt) {
  var pond = pasPond(), mud = pasMud();
  if (p.qz > 0 || p.qsp < 0.05) return;
  if (pasInEllipse(pond, p.qx, p.qy)) {
    if (Math.random() < dt * 14) spawnSparkles(p.qx + (Math.random() - 0.5) * viewH * 0.06, p.qy - viewH * 0.01, 2, '#9fdcff');
    if (Math.random() < dt * 4) playNote(900 + Math.random() * 500, 0, 0.05, 'sine', 0.06);
    if (Math.random() < dt * 3) pasRings.push({ x: p.qx, y: p.qy, age: 0 });
  } else if (pasInEllipse(mud, p.qx, p.qy)) {
    if (Math.random() < dt * 10) spawnSparkles(p.qx + (Math.random() - 0.5) * viewH * 0.05, p.qy - viewH * 0.01, 2, '#8a6038');
    if (Math.random() < dt * 4) playNote(140 + Math.random() * 60, 0, 0.06, 'triangle', 0.08);
    p.qmudT += dt;
    if (p.qmudT > 1 && p.mud < STAB_MUD) { p.qmudT = 0; p.mud++; saveProgress(); }
  }
}

// Esteen ylitys: syvyydessä esteen kohdalla ja x vaihtaa puolta
function pasCrossCheck(p, x0, y0, isRider) {
  var i, ob, s0, s1;
  for (i = 0; i < pasCourse.length; i++) {
    ob = pasObs(i);
    if (Math.abs(p.qy - ob.y) > ob.d + viewH * 0.012) continue;
    s0 = x0 - pasObsLineX(ob, y0);
    s1 = p.qx - pasObsLineX(ob, p.qy);
    if ((s0 >= 0) === (s1 >= 0)) continue;
    pasCrossed(p, ob, isRider);
  }
}
function pasCrossed(p, ob, isRider) {
  var o = pasCourse[ob.n], i, gr = pasGhostRun;
  if (p.qst === 'ghost' && gr && gr.solo && ob.n === gr.next) {
    // Näytöskierros: Tähtiponin ylittämä este välähtää numeronsa värissä
    gr.next++;
    o.wig = 0.6;
    if (ob.n) {
      spawnSparkles(ob.x - ob.L, ob.y + ob.d - viewH * 0.12 * ob.k, 12, PAS_FLAG[ob.n - 1]);
      playNote([523, 587, 659, 784, 880][ob.n - 1], 0.05, 0.12, 'sine', 0.14);
    }
  }
  if (ob.n === 0) {
    if (isRider) pasArchCross();
    return;
  }
  if (p.qjump <= 0 && p.qz <= 0) {
    if (!isRider || p.qsp >= PAS_JUMP_MIN) {
      p.qjump = isRider ? 0.5 : 0.42;
      p.qjumpD = p.qjump;
      p.qjumpH = viewH * (isRider ? 0.1 : 0.07) * ob.k * (ob.kind === 'oxer' ? 1.15 : 1);
      if (isRider) {
        playNote(523, 0, 0.08, 'sine', 0.18);
        playNote(784, 0.16, 0.14, 'sine', 0.18);
        spawnSparkles(p.qx, p.qy - viewH * 0.08, 8, '#ffffff');
      }
    } else if (isRider) {
      // Liian hidas: puomi putoaa ja poni kompastuu, vesiesteessä kahlataan
      p.qstum = 0.7;
      o.wig = 0.6;
      if (ob.kind === 'water') {
        for (i = 0; i < 6; i++) playNote(700 + Math.random() * 700, i * 0.05, 0.05, 'sine', 0.1);
        spawnSparkles(p.qx, p.qy - viewH * 0.02, 14, '#7fd4ff');
      } else {
        o.downT = 3.5;
        for (i = 0; i < 4; i++) playNote(180 + Math.random() * 120, i * 0.07, 0.06, 'square', 0.08);
        spawnDust(p.qx, p.qy, 5, 0);
      }
    }
  }
  if (!isRider || !pasRound) return;
  if (ob.n === pasRound.next) {
    o.ok = 1;
    o.wig = 0.8;
    pasRound.next++;
    var base = [523, 587, 659, 784, 880][ob.n - 1];
    playNote(base, 0.1, 0.12, 'triangle', 0.25);
    playNote(base * 1.5, 0.2, 0.2, 'triangle', 0.22);
    spawnSparkles(ob.x - ob.L, ob.y + ob.d - viewH * 0.12 * ob.k, 18, PAS_FLAG[ob.n - 1]);
    if (pasRound.next > 5) {
      // Kaikki esteet: kaari hehkuu maaliksi
      pasCourse[0].wig = 1;
      playNote(1047, 0.35, 0.2, 'sine', 0.2);
    }
  } else if (ob.n > pasRound.next || o.ok) {
    // Väärä este: pehmeä pomppu ja oikea numero välähtää
    playNote(260, 0.05, 0.12, 'triangle', 0.15);
    playNote(220, 0.15, 0.15, 'triangle', 0.12);
    pasRound.nudge = 1;
  }
}

// ---------- Ratsastus ----------
function pasUpdateRider(p, dt) {
  var h = viewH, want = 0, steer = homeDrag && homeDrag.pas === 'steer', dx, dy, d, k;
  var x0 = p.qx, y0 = p.qy;
  if (steer) {
    var tx = homeDrag.gx + pasCam, ty = pasClampY(homeDrag.gy);
    dx = tx - p.qx; dy = ty - p.qy;
    d = Math.sqrt(dx * dx + dy * dy);
    want = d < h * 0.05 ? 0 : (d < h * 0.17 ? PAS_WALK : (d < h * 0.36 ? PAS_TROT : PAS_GALLOP));
    if (d > 1) {
      k = Math.min(1, dt * 8);
      p.qhx += (dx / d - p.qhx) * k;
      p.qhy += (dy / d - p.qhy) * k;
      var hl = Math.sqrt(p.qhx * p.qhx + p.qhy * p.qhy) || 1;
      p.qhx /= hl; p.qhy /= hl;
    }
  }
  if (p.qstum > 0) { p.qstum -= dt; want = Math.min(want, 0.06); }
  if (p.qrearT > 0) { p.qrearT -= dt; want = 0; if (p.qrearT <= 0) stabClop(0); }
  if (pasInEllipse(pasPond(), p.qx, p.qy)) want = Math.min(want, PAS_WALK * 1.1);
  if (pasInEllipse(pasMud(), p.qx, p.qy)) want = Math.min(want, PAS_TROT);
  if (want > p.qsp) p.qsp = Math.min(want, p.qsp + 1.1 * dt);
  else p.qsp = Math.max(want, p.qsp - (p.qstum > 0 ? 3 : 1.6) * dt);
  if (p.qjump > 0) p.qsp = Math.max(p.qsp, PAS_JUMP_MIN);
  p.qx = pasClampX(p.qx + p.qhx * p.qsp * h * dt);
  p.qy = pasClampY(p.qy + p.qhy * p.qsp * h * dt * 0.75);
  if (Math.abs(p.qhx) > 0.25 && p.qsp > 0.03) p.qdir = p.qhx > 0 ? 1 : -1;
  pasGait(p, dt, true);
  pasFootFx(p, dt);
  pasCrossCheck(p, x0, y0, true);
  // Ruusuke välkkyy suitsissa ja laukka sirottaa kipinöitä
  if (p.qsp > 0.42 && Math.random() < dt * 4) spawnSparkles(p.qx - p.qdir * h * 0.08, p.qy - h * 0.05, 1, '#ffffff');
}
function pasMount(p) {
  var i;
  if (pasRider) pasDismount(pasPrin.x, pasPrin.y);
  if (pasBunRide && pasBunRide.p === p) pasBunRideEnd();
  pasRider = p;
  p.qst = 'ridden';
  p.qsp = 0;
  p.qhx = p.qdir; p.qhy = 0;
  pasPrin.mode = 'ride';
  pasPrin.hopT = 0.45;
  pasPrin.hx = pasPrin.x; pasPrin.hy = pasPrin.y - viewH * 0.05;
  p.qtoss = 0.8;
  for (i = 0; i < 4; i++) pasHearts.push({ x: p.qx + (i - 1.5) * viewH * 0.03, y: p.qy - viewH * 0.22, age: -i * 0.12 });
  playNote(659, 0, 0.08, 'sine', 0.22);
  playNote(880, 0.08, 0.08, 'sine', 0.22);
  playNote(1175, 0.16, 0.18, 'sine', 0.22);
  stabNeigh(p, 0.3);
  spawnSparkles(p.qx, p.qy - viewH * 0.15, 14, '#ffd6ec');
  if (!pasRode) { pasRode = true; saveProgress(); }
}
function pasDismount(x, y) {
  var p = pasRider;
  if (!p) return;
  pasRider = null;
  p.qst = 'idle';
  p.qtimer = 1.5;
  p.qsp = 0;
  pasPrin.mode = 'foot';
  pasPrin.x = pasClampX(x);
  pasPrin.y = pasClampY(y);
  pasPrin.waveT = 1.2;
  if (pasRound) pasRoundCancel();
  pasReleaseHerd();
  stabNicker(p, 0);
}
function pasRiderSeat(p) {
  var s = pasPonySize(p, p.qy), rb = pasBuckRot(p);
  return { x: p.qx - p.qdir * s * 0.06, y: p.qy - p.qz - s * 1.08 + (p.qsp > 0.42 ? Math.abs(Math.sin(p.qwph)) * s * 0.05 : 0) + rb * s * 0.2, s: s };
}
function pasBuckRot(p) {
  return p.qst === 'buck' ? Math.max(0, Math.sin((0.7 - p.qtimer) / 0.7 * Math.PI)) : 0;
}

// ---------- Esterata ----------
function pasArchCross() {
  if (!pasRound) { pasRoundStart(); return; }
  if (pasRound.next > 5) pasRoundFinish();
}
function pasRoundStart() {
  var i, a = pasObs(0), path = pasGhostPath();
  pasRound = { t: 0, next: 1, path: [], sampleT: 0, nudge: 0 };
  pasRound.path.push(pasRider.qx / viewH, pasTofY(pasRider.qy));
  for (i = 0; i < pasCourse.length; i++) pasCourse[i].ok = 0;
  pasCourse[0].wig = 0.8;
  var g = { k: 'pony', c: 0, m: 0, u: 1, ph: 0 };
  pasPonyInit(g, a.x, a.y);
  g.qst = 'ghost';
  pasGhostRun = { path: path, total: pasPathTotal(path), g: g, done: false, wait: 0 };
  // Lähtökello ja Tähtiponin hirnahdus
  playNote(1568, 0, 0.12, 'sine', 0.22);
  playNote(1568, 0.18, 0.12, 'sine', 0.22);
  playNote(2093, 0.36, 0.3, 'sine', 0.25);
  stabNeigh(g, 0.2);
  spawnSparkles(a.x, a.y - viewH * 0.15, 20, '#ffe27a');
}
function pasRoundCancel() {
  pasRound = null;
  if (pasGhostRun) { pasGhostRun.done = true; pasGhostRun.wait = 0.01; }
  for (var i = 0; i < pasCourse.length; i++) pasCourse[i].ok = 0;
}
function pasRoundFinish() {
  var r = pasRound, d = stabDay(), p = pasRider, gr = pasGhostRun, a = pasObs(0), i;
  var won = !gr || r.t < gr.total - 0.05;
  var t = Math.round(r.t * 10) / 10;
  r.path.push(p.qx / viewH, pasTofY(p.qy));
  pasRound = null;
  for (i = 0; i < pasCourse.length; i++) pasCourse[i].ok = 0;
  if (won) {
    pasRecord = t;
    pasGhost = r.path.length <= PAS_GHOST_MAX * 2 ? r.path : null;
    if (!pasGhost) pasRecord = 0;
    pasBanner = { kind: 'win', t: 0, time: t };
    soundFanfare();
    pasFireworks(6);
    if (gr) { gr.done = true; gr.wait = 3; gr.lost = true; }
  } else {
    pasBanner = { kind: 'lose', t: 0, time: t, ghost: gr ? gr.total : 0 };
    if (!pasGhost) { pasDemoV = Math.max(0.3, pasDemoV - 0.03); pasDemo = null; }
    var mel = [659, 784, 880, 784, 1047];
    for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.14, 0.16, 'triangle', 0.18);
    pasFireworks(2);
  }
  // Ruusuke suitsiin: kerran päivässä ponia kohden; ennätys kerran päivässä kultainen (tähti)
  var gold = won && pasGoldDay !== d, give = p.cr !== d || gold;
  if (give) {
    if (gold) pasGoldDay = d;
    p.cr = d;
    stabTotal++;
    if (stabBoard.length < STAB_BOARD_MAX) stabBoard.push(gold ? 1 : 0);
    pasFly.push({ x0: a.x, y0: a.y - viewH * 0.2, x1: 0, y1: 0, t: 0, kind: 'rosette', g: gold ? 1 : 0, pony: p });
    if (gold) {
      starCoins += 1;
      pasFly.push({ x0: a.x - pasCam, y0: a.y - viewH * 0.2, x1: viewH * 0.17, y1: viewH * 0.065, t: -0.4, kind: 'star', scr: 1 });
      soundStar(3);
    }
  }
  stabNeigh(p, 0.4);
  p.qtoss = 1;
  saveProgress();
}

// Ilotulitus: raketit nousevat ruudun alaosasta ja räjähtävät kipinöiksi
function pasFireworks(n) {
  for (var i = 0; i < n; i++) {
    pasFire.push({ x: viewW * (0.2 + Math.random() * 0.6), y: viewH, vx: (Math.random() - 0.5) * viewH * 0.1, vy: -viewH * (0.9 + Math.random() * 0.3), t: -i * 0.35, rocket: true, c: RAINBOW_COLORS[(i * 2) % RAINBOW_COLORS.length], age: 0 });
  }
}

// ---------- Lauma ----------
function pasFree(p) {
  return p !== pasRider && (p.qst === 'idle' || p.qst === 'graze' || p.qst === 'walk' || p.qst === 'drink' || p.qst === 'call' || p.qst === 'buck');
}
// Mitä poni tekee seuraavaksi. Kohteet painottuvat näkymään, jotta lauma pysyy lähellä.
function pasThink(p) {
  var h = viewH, r = Math.random(), i, o, best = null, bd = 1e9, dx, cx = pasCam + viewW * 0.5, x, y;
  p.qgraze = false;
  if (p.k === 'foal') {
    if (r < 0.25 && pasButterflies.length) {
      p.qbf = pasButterflies[randInt(pasButterflies.length)];
      p.qst = 'chase';
      p.qwant = PAS_TROT;
      p.qtimer = 2.5 + Math.random() * 2;
      p.qtx = p.qbf.x; p.qty = pasClampY(p.qbf.y + h * 0.1);
      return;
    }
    for (i = 0; i < stabPonies.length; i++) {
      o = stabPonies[i];
      if (o.k !== 'pony' || o.qst === 'wait' || o.qst === 'held') continue;
      dx = Math.abs(o.qx - p.qx) + Math.abs(o.qy - p.qy);
      if (dx < bd) { bd = dx; best = o; }
    }
    if (best && r < 0.75) {
      pasGo(p, 'walk', best.qx - best.qdir * h * (0.12 + Math.random() * 0.06), best.qy + h * (Math.random() - 0.4) * 0.06, bd > h * 0.6 ? PAS_TROT : PAS_WALK);
      return;
    }
    if (r < 0.85) { p.qst = 'buck'; p.qtimer = 0.7; stabNeigh(p, 0); return; }
  }
  if (p.k === 'pony' && r < 0.06 && p.mud < STAB_MUD) {
    var m = pasMud();
    pasGo(p, 'toroll', m.x + (Math.random() - 0.5) * m.rx, m.y + (Math.random() - 0.5) * m.ry, PAS_TROT);
    return;
  }
  if (r < 0.14) {
    var pd = pasPond(), a = Math.random() < 0.5 ? -Math.PI * (0.2 + Math.random() * 0.6) : Math.PI * (0.25 + Math.random() * 0.5);
    pasGo(p, 'todrink', pd.x + Math.cos(a) * pd.rx * 1.08, pd.y + Math.sin(a) * pd.ry * 1.5, PAS_WALK);
    return;
  }
  if (r < 0.52) {
    p.qst = 'graze';
    p.qgraze = true;
    p.qtimer = 3 + Math.random() * 4;
    return;
  }
  x = Math.random() < 0.55 ? cx + (Math.random() - 0.5) * viewW * 0.8 : p.qx + (Math.random() - 0.5) * h * 1.4;
  y = pasYofT(0.1 + Math.random() * 0.85);
  pasGo(p, 'walk', x, y, Math.random() < 0.2 ? PAS_TROT : PAS_WALK);
}
function pasArrive(p) {
  var pd, ap;
  if (p.qst === 'enter') { p.qst = 'buck'; p.qtimer = 0.7; if (Math.random() < 0.6) stabNeigh(p, 0); return; }
  if (p.qst === 'todrink') {
    pd = pasPond();
    p.qst = 'drink';
    p.qtimer = 3 + Math.random() * 2;
    p.qdir = pd.x > p.qx ? 1 : -1;
    return;
  }
  if (p.qst === 'toroll') {
    p.qst = 'roll';
    p.qrollT = 2.8;
    p.qtimer = 2.8;
    p.mud = Math.min(STAB_MUD, p.mud + 2);
    p.md = stabDay();
    saveProgress();
    return;
  }
  if (p.qst === 'toapple') {
    ap = p.qapple;
    p.qapple = null;
    if (ap && pasApples.indexOf(ap) >= 0) { pasEatApple(p, ap); return; }
    p.qst = 'idle'; p.qtimer = 1;
    return;
  }
  if (p.qst === 'call') {
    p.qst = 'idle';
    p.qtimer = 2 + Math.random() * 2;
    p.qdir = pasPrin.x > p.qx ? 1 : -1;
    p.qtoss = 0.8;
    pasHearts.push({ x: p.qx, y: p.qy - pasPonySize(p, p.qy) * 1.9, age: 0 });
    return;
  }
  if (p.qst === 'bunride') {
    pasGo(p, 'bunride', pasCam + viewW * (0.15 + Math.random() * 0.7), pasYofT(0.15 + Math.random() * 0.8), PAS_WALK);
    return;
  }
  if (p.qst === 'chase') return;
  p.qst = Math.random() < 0.5 ? 'graze' : 'idle';
  p.qgraze = p.qst === 'graze';
  p.qtimer = 1.5 + Math.random() * 3;
}
function pasReleaseHerd() {
  var i, p;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.qst !== 'follow') continue;
    p.qst = 'idle';
    p.qtimer = 0.4 + Math.random() * 1.5;
  }
  pasFollowN = 0;
}
// Laukka kokoaa vapaat ponit perään; hidastus hajottaa lauman
function pasHerd(dt) {
  var i, p, r = pasRider, h = viewH;
  if (!r) { if (pasFollowN) pasReleaseHerd(); return; }
  if (r.qsp > 0.42) {
    pasHerdSlow = 0;
    for (i = 0; i < stabPonies.length; i++) {
      p = stabPonies[i];
      if (!pasFree(p) || Math.abs(p.qx - r.qx) > h * 1.8) continue;
      p.qst = 'follow';
      p.qslot = pasFollowN++;
      p.qgraze = false;
      if (Math.random() < 0.5) stabNeigh(p, Math.random() * 0.4);
    }
  } else if (r.qsp < 0.22 && pasFollowN) {
    pasHerdSlow += dt;
    if (pasHerdSlow > 1.2) pasReleaseHerd();
  }
}
function pasFollowTarget(p) {
  var r = pasRider, h = viewH, row = Math.floor(p.qslot / 2), side = p.qslot % 2 ? 1 : -1;
  p.qtx = pasClampX(r.qx - r.qdir * h * (0.24 + row * 0.2));
  p.qty = pasClampY(r.qy + side * h * 0.08 * (1 + row * 0.3));
  var dx = p.qtx - p.qx, dy = p.qty - p.qy, dist = Math.sqrt(dx * dx + dy * dy);
  p.qwant = Math.min(PAS_GALLOP * 1.12, r.qsp + Math.min(0.3, dist / (h * 0.5) * 0.3));
  if (r.qsp < 0.05 && dist < h * 0.1) p.qwant = 0;
}
// Vihellys: vapaat ponit ravaavat prinsessan luo
function pasCall() {
  var i, p, k = 0, h = viewH, pr = pasPrin;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p === pasRider || p.qst === 'held' || p.qst === 'wait' || p.qst === 'roll' || p.qst === 'munch') continue;
    if (pasBunRide && pasBunRide.p === p) continue;
    var side = k % 2 ? 1 : -1, row = Math.floor(k / 2);
    var far = Math.abs(p.qx - pr.x) > h * 0.8;
    pasGo(p, 'call', pr.x + side * h * (0.2 + row * 0.15), pr.y + h * (0.05 - row * 0.04 + (k % 3) * 0.02), far ? PAS_GALLOP : PAS_TROT);
    stabNicker(p, 0.3 + k * 0.2);
    k++;
  }
}

// ---------- Omenat ----------
function pasShakeTree() {
  var tr = pasTree(), d = stabDay(), n, i;
  pasTreeShake = 0.8;
  for (i = 0; i < 5; i++) playNote(500 + Math.random() * 400, i * 0.04, 0.05, 'triangle', 0.05);
  if (pasAppleDay !== d) { pasAppleDay = d; pasApplesN = 0; }
  if (pasApplesN >= PAS_APPLES_DAY || pasApples.length >= 6) {
    // Puu on tyhjä tältä päivältä: lintu pyrähtää lehvästöstä
    spawnSparkles(tr.x, tr.y - tr.s * 1.0, 10, '#6cc45c');
    var tw = [2400, 2800, 2600, 3000];
    for (i = 0; i < tw.length; i++) playNote(tw[i], 0.1 + i * 0.07, 0.05, 'sine', 0.08);
    pasNotes.push({ x: tr.x, y: tr.y - tr.s * 1.1, vy: -viewH * 0.15, age: 0, life: 1.2, c: 1, bird: 1, vx: viewH * 0.3 });
    return;
  }
  n = Math.random() < 0.5 ? 2 : 1;
  for (i = 0; i < n && pasApplesN < PAS_APPLES_DAY; i++) {
    var gold = pasGoldApple !== d && pasApplesN === 2 + (d % 4);
    pasApplesN++;
    pasApples.push({ x: tr.x + (Math.random() - 0.5) * tr.s * 1.1, y: tr.y - tr.s * (0.65 + Math.random() * 0.35), gy: pasYofT(0.05 + Math.random() * 0.28), vy: 0, gold: gold, eater: null, rest: false, wob: 0 });
  }
  saveProgress();
}
function pasEatApple(p, ap) {
  var i, d = stabDay();
  pasApples.splice(pasApples.indexOf(ap), 1);
  p.qst = 'munch';
  p.qtimer = 2.2;
  p.qtoss = 0.4;
  p.qdir = ap.x > p.qx ? 1 : -1;
  for (i = 0; i < 6; i++) playNote(700 + Math.random() * 500, 0.1 + i * 0.2, 0.03, 'square', 0.04);
  stabNicker(p, 1.4);
  for (i = 0; i < 3; i++) pasHearts.push({ x: p.qx + (i - 1) * viewH * 0.03, y: p.qy - pasPonySize(p, p.qy) * 1.8, age: -i * 0.3 });
  if (ap.gold) {
    pasGoldApple = d;
    p.qshine = 3;
    starCoins += 1;
    pasFly.push({ x0: ap.x - pasCam, y0: ap.y - viewH * 0.05, x1: viewH * 0.17, y1: viewH * 0.065, t: 0, kind: 'star', scr: 1 });
    spawnSparkles(ap.x, ap.y - viewH * 0.05, 26, '#ffd24f');
    soundStar(4);
    saveProgress();
  }
}
function pasUpdateApples(dt) {
  var i, ap, p, j, best, bd, dx;
  for (i = pasApples.length - 1; i >= 0; i--) {
    ap = pasApples[i];
    if (ap.wob > 0) ap.wob -= dt;
    if (ap.held) continue;
    if (!ap.rest) {
      ap.vy += viewH * 2.4 * dt;
      ap.y += ap.vy * dt;
      if (ap.y >= ap.gy) {
        ap.y = ap.gy;
        if (ap.vy > viewH * 0.4) { ap.vy = -ap.vy * 0.35; playNote(300 + Math.random() * 80, 0, 0.05, 'triangle', 0.1); }
        else { ap.vy = 0; ap.rest = true; }
      }
      continue;
    }
    if (ap.eater && (ap.eater.qst !== 'toapple' || ap.eater.qapple !== ap)) ap.eater = null;
    if (ap.eater) continue;
    best = null; bd = viewH * 2;
    for (j = 0; j < stabPonies.length; j++) {
      p = stabPonies[j];
      if (!pasFree(p)) continue;
      dx = Math.abs(p.qx - ap.x) + Math.abs(p.qy - ap.y);
      if (dx < bd) { bd = dx; best = p; }
    }
    if (best) pasSendToApple(best, ap);
  }
}
function pasSendToApple(p, ap) {
  var dir = ap.x >= p.qx ? 1 : -1, s = pasPonySize(p, ap.y);
  pasGo(p, 'toapple', ap.x - dir * s * 0.62, ap.y + viewH * 0.005, Math.abs(ap.x - p.qx) > viewH * 0.5 ? PAS_TROT : PAS_WALK);
  p.qapple = ap;
  ap.eater = p;
}

// ---------- Pupu ratsastaa ----------
function pasBunRideStart(p, bi) {
  if (pasBunRide) pasBunRideEnd();
  pasBunRide = { b: bi, p: p };
  p.qtimer = 9;
  pasGo(p, 'bunride', p.qx + (Math.random() < 0.5 ? -1 : 1) * viewH * 0.5, p.qy + (Math.random() - 0.5) * viewH * 0.2, PAS_WALK);
  homeBunnies[bi].hop = 1;
  for (var k = 0; k < 4; k++) pasHearts.push({ x: p.qx + (k - 1.5) * viewH * 0.025, y: p.qy - viewH * 0.2, age: -k * 0.15 });
  playNote(784, 0, 0.1, 'sine', 0.22);
  playNote(1047, 0.1, 0.1, 'sine', 0.22);
  playNote(1319, 0.2, 0.2, 'sine', 0.22);
  stabNicker(p, 0.3);
}
function pasBunRideEnd() {
  if (!pasBunRide) return;
  var b = homeBunnies[pasBunRide.b], p = pasBunRide.p;
  pasBunRide = null;
  if (p.qst === 'bunride') { p.qst = 'idle'; p.qtimer = 1.5; }
  if (!b) return;
  b.oy = 0;
  b.qx = p.qx + p.qdir * viewH * 0.06;
  b.qy = pasClampY(p.qy + viewH * 0.02);
  b.hop = 1;
  playNote(1175, 0, 0.08, 'sine', 0.2);
  playNote(1568, 0.08, 0.15, 'sine', 0.2);
}

// ---------- Päivitys ----------
function updatePasture(dt) {
  var i, p, h = viewH, a, gr, d = stabDay();
  if (!pasPrin) pasOnEnter();
  // Portista laukkaavat ponit
  for (i = pasEnterQ.length - 1; i >= 0; i--) {
    pasEnterQ[i].t -= dt;
    if (pasEnterQ[i].t > 0) continue;
    p = pasEnterQ[i].p;
    pasEnterQ.splice(i, 1);
    if (stabPonies.indexOf(p) < 0) continue;
    var g = pasGate();
    p.qx = g.x; p.qy = pasTop() + h * 0.02;
    pasGo(p, 'enter', g.x + h * (0.4 + Math.random() * 1.3), pasYofT(0.25 + Math.random() * 0.65), PAS_GALLOP * 0.9);
    p.qsp = PAS_TROT;
    stabNeigh(p, 0);
  }
  pasHerd(dt);
  if (pasRider && !(homeDrag && homeDrag.pas === 'steer')) pasIdleT += dt; else pasIdleT = 0;
  for (i = 0; i < stabPonies.length; i++) pasUpdatePony(stabPonies[i], dt);
  pasUpdatePrincess(dt);
  // Kierros ja Tähtiponi
  if (pasRound) {
    pasRound.t += dt;
    pasRound.sampleT += dt;
    if (pasRound.nudge > 0) pasRound.nudge -= dt;
    while (pasRound.sampleT >= PAS_SAMPLE && pasRider) {
      pasRound.sampleT -= PAS_SAMPLE;
      if (pasRound.path.length < PAS_GHOST_MAX * 2) pasRound.path.push(pasRider.qx / h, pasTofY(pasRider.qy));
    }
    if (pasRound.t > 150 || !pasRider) pasRoundCancel();
  }
  gr = pasGhostRun;
  if (gr) {
    var gp = gr.g, x0 = gp.qx, y0 = gp.qy;
    if (gp.qtoss > 0) gp.qtoss -= dt;
    if (gp.qjump > 0) {
      gp.qjump -= dt;
      gp.qz = Math.max(0, Math.sin(Math.PI * (1 - Math.max(0, gp.qjump) / gp.qjumpD))) * gp.qjumpH;
      if (gp.qjump <= 0) gp.qz = 0;
    }
    if (gr.solo && !gr.done) gr.t += dt;
    if (!gr.done && (pasRound || (gr.solo && gr.t >= 0))) {
      var pos = pasPathAt(gr.path, gr.solo ? gr.t : pasRound.t);
      gp.qx = pos.x; gp.qy = pos.y;
      var mv = Math.sqrt((gp.qx - x0) * (gp.qx - x0) + (gp.qy - y0) * (gp.qy - y0));
      gp.qsp += ((mv / Math.max(dt, 0.001)) / h - gp.qsp) * Math.min(1, dt * 6);
      if (Math.abs(gp.qx - x0) > 0.5) gp.qdir = gp.qx > x0 ? 1 : -1;
      pasGait(gp, dt, false);
      pasCrossCheck(gp, x0, y0, false);
      if (Math.random() < dt * 10) spawnSparkles(gp.qx - gp.qdir * h * 0.06, gp.qy - h * 0.08, 1, '#fff2a0');
      if (pos.end) {
        // Tähtiponi ehti maaliin: tanssii kaarella odottaen
        gr.done = true;
        gr.wait = 2.5;
        gp.qsp = 0;
        stabNeigh(gp, 0);
        spawnSparkles(gp.qx, gp.qy - h * 0.12, 16, '#fff2a0');
      }
    } else if (gr.done) {
      gp.qsp = Math.max(0, gp.qsp - dt * 2);
      if (gr.lost) gr.wait -= dt;
      else if (!pasRound) gr.wait -= dt;
      if (Math.random() < dt * 0.7 && !gr.lost) { gp.qtoss = 0.8; gp.qjump = 0.35; gp.qjumpD = 0.35; gp.qjumpH = h * 0.04; }
      if (gr.wait <= 0) pasGhostRun = null;
    }
  }
  // Tähtiponi kutsuu kilpasille, kun ratsastaja tulee kaaren luo
  if (pasInviteT > 0) pasInviteT -= dt;
  if (!pasRound && !pasGhostRun && pasRider) {
    a = pasObs(0);
    if (Math.abs(pasRider.qx - a.x) < h * 0.7 && pasInviteT <= 0) {
      pasInviteT = 6;
      playNote(1319, 0, 0.1, 'sine', 0.15);
      playNote(1760, 0.1, 0.15, 'sine', 0.15);
      spawnSparkles(a.x + h * 0.22, a.y - h * 0.1, 10, '#fff2a0');
    }
  }
  for (i = 0; i < pasCourse.length; i++) {
    var o = pasCourse[i];
    if (o.downT > 0) o.downT -= dt;
    if (o.wig > 0) o.wig -= dt;
    if (o.count) { o.countT += dt; if (o.countT > o.count * 0.28 + 1) o.count = 0; }
  }
  pasUpdateApples(dt);
  pasUpdateBunnies(dt);
  pasUpdateCritters(dt);
  pasUpdateFx(dt);
  pasDragFollow();
  pasUpdateCam(dt);
  // Lintujen laulu
  pasBirdT -= dt;
  if (pasBirdT <= 0) {
    pasBirdT = 5 + Math.random() * 7;
    var base = 2200 + Math.random() * 900, n = 3 + randInt(3);
    for (i = 0; i < n; i++) playNote(base + (i % 2) * 300 + Math.random() * 100, i * 0.08, 0.05, 'sine', 0.035);
  }
}

function pasUpdatePony(p, dt) {
  var h = viewH, x0 = p.qx, y0 = p.qy, headT = 0, st;
  if (p.qst === 'wait') return;
  if (p.qtoss > 0) p.qtoss -= dt;
  if (p.qshine > 0) p.qshine -= dt;
  if (p.qjump > 0) {
    p.qjump -= dt;
    p.qz = Math.max(0, Math.sin(Math.PI * (1 - Math.max(0, p.qjump) / p.qjumpD))) * p.qjumpH;
    if (p.qjump <= 0) {
      p.qz = 0;
      if (p.qx > pasCam - h * 0.2 && p.qx < pasCam + viewW + h * 0.2) {
        spawnDust(p.qx, p.qy, p === pasRider ? 6 : 3, 0);
        stabClop(0, p !== pasRider);
      }
    }
  } else if (p.qz > 0) {
    p.qz = Math.max(0, p.qz - h * 0.6 * dt);
  }
  if (p === pasRider) {
    pasUpdateRider(p, dt);
    p.qhead += ((p.qsp > 0.42 ? -0.12 : 0) - p.qhead) * Math.min(1, dt * 5);
    return;
  }
  if (p.qst === 'held') {
    p.qsp = 0;
    p.qheld += dt;
    if (p.qheld > 0.7) { p.qheld = 0; pasHearts.push({ x: p.qx, y: p.qy - pasPonySize(p, p.qy) * 1.9, age: 0 }); stabNicker(p, 0); }
    p.qhead += (0 - p.qhead) * Math.min(1, dt * 6);
    return;
  }
  p.qtimer -= dt;
  st = p.qst;
  if (st === 'enter' || st === 'walk' || st === 'todrink' || st === 'toroll' || st === 'toapple' || st === 'call' || st === 'chase' || st === 'follow' || st === 'bunride') {
    if (st === 'follow') {
      if (!pasRider) { p.qst = 'idle'; p.qtimer = 1; return; }
      pasFollowTarget(p);
    } else if (st === 'chase') {
      if (p.qbf) { p.qtx = pasClampX(p.qbf.x); p.qty = pasClampY(p.qbf.y + h * 0.12); }
      if (p.qtimer <= 0) { p.qst = 'buck'; p.qtimer = 0.7; stabNeigh(p, 0); }
    } else if (st === 'toapple') {
      if (!p.qapple || pasApples.indexOf(p.qapple) < 0) { p.qapple = null; p.qst = 'idle'; p.qtimer = 0.5; }
    } else if (st === 'bunride') {
      if (p.qtimer <= 0) pasBunRideEnd();
    }
    if (p.qst === st && pasMoveToward(p, dt, st !== 'follow' && st !== 'chase')) pasArrive(p);
    headT = p.qsp > 0.42 ? -0.12 : 0;
    pasFootFx(p, dt);
  } else {
    p.qsp = Math.max(0, p.qsp - dt * 1.5);
    if (st === 'graze') {
      headT = 0.95 - Math.max(0, Math.sin(globalT * 2 + p.ph)) * 0.15;
      if (Math.random() < dt * 0.6) playNote(600 + Math.random() * 300, 0, 0.02, 'triangle', 0.02);
      if (p.qtimer <= 0) pasThink(p);
    } else if (st === 'drink') {
      headT = 1;
      if (Math.random() < dt * 1.5 && p.qx > pasCam && p.qx < pasCam + viewW) playNote(900 + Math.random() * 300, 0, 0.04, 'sine', 0.04);
      if (Math.random() < dt * 0.8) pasRings.push({ x: p.qx + p.qdir * pasPonySize(p, p.qy) * 0.65, y: p.qy - viewH * 0.005, age: 0 });
      if (p.qtimer <= 0) { p.qst = 'idle'; p.qtimer = 1; }
    } else if (st === 'munch') {
      headT = 0.15 + Math.max(0, Math.sin(globalT * 10)) * 0.08;
      if (p.qtimer <= 0) { p.qst = 'idle'; p.qtimer = 1.5; }
    } else if (st === 'roll') {
      p.qrollT -= dt;
      if (Math.random() < dt * 8) spawnSparkles(p.qx + (Math.random() - 0.5) * h * 0.1, p.qy - h * 0.03, 2, '#8a6038');
      if (Math.random() < dt * 3) playNote(120 + Math.random() * 80, 0, 0.08, 'triangle', 0.07);
      if (p.qtimer <= 0) {
        // Ylös ja ravistus
        p.qst = 'idle';
        p.qtimer = 1.5;
        p.qtoss = 1;
        spawnDust(p.qx, p.qy - h * 0.05, 6, 0);
        stabNicker(p, 0);
      }
    } else if (st === 'buck') {
      if (p.qtimer <= 0) { p.qst = 'idle'; p.qtimer = 0.8 + Math.random(); }
    } else if (st === 'rear') {
      p.qrearT -= dt;
      if (p.qrearT <= 0) { p.qst = 'idle'; p.qtimer = 1; stabClop(0); }
    } else {
      if (p.qtimer <= 0 && p.qz === 0) pasThink(p);
    }
  }
  pasGait(p, dt, false);
  pasCrossCheck(p, x0, y0, false);
  p.qhead += (headT - p.qhead) * Math.min(1, dt * 4);
}

function pasUpdatePrincess(dt) {
  var pr = pasPrin;
  if (pr.waveT > 0) pr.waveT -= dt;
  if (pr.hopT > 0) pr.hopT -= dt;
  if (pr.mode === 'foot' && !pasRider) {
    // Katsoo lähintä ponia
    var i, best = null, bd = 1e9, p;
    for (i = 0; i < stabPonies.length; i++) {
      p = stabPonies[i];
      if (p.qst === 'wait') continue;
      var dd = Math.abs(p.qx - pr.x);
      if (dd < bd) { bd = dd; best = p; }
    }
    if (best && bd > viewH * 0.05) pr.dir = best.qx > pr.x ? 1 : -1;
  }
}

function pasUpdateBunnies(dt) {
  var i, b, lead, tx, ty, dx, dy, dist, sp, h = viewH;
  if (pasRider) lead = { x: pasRider.qx, y: pasRider.qy, dir: pasRider.qdir };
  else lead = { x: pasPrin.x, y: pasPrin.y, dir: pasPrin.dir };
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    b.earT += dt * 3;
    if (b.qx === undefined) { b.qx = lead.x; b.qy = lead.y; }
    if (pasBunRide && pasBunRide.b === i) {
      var rp = pasBunRide.p, rs = pasPonySize(rp, rp.qy);
      b.qx = rp.qx - rp.qdir * rs * 0.08;
      b.qy = rp.qy + 0.5;
      b.oy = -rs * 1.05 - rp.qz + Math.abs(Math.sin(rp.qwph)) * rs * 0.04;
      b.hop = 0;
      b.qdir = rp.qdir;
      if (Math.random() < dt * 1.5) pasHearts.push({ x: b.qx, y: b.qy + b.oy - h * 0.08, age: 0 });
      continue;
    }
    b.oy = 0;
    tx = lead.x - lead.dir * h * (0.17 + i * 0.09);
    ty = pasClampY(lead.y + h * (0.03 + (i - 1) * 0.05));
    dx = tx - b.qx; dy = ty - b.qy;
    dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > h * 0.04) {
      sp = Math.min(dist, h * (dist > h * 0.6 ? 0.5 : 0.34) * dt);
      b.qx += dx / dist * sp;
      b.qy += dy / dist * sp;
      b.hop = Math.abs(Math.sin(globalT * 9 + i));
      b.qdir = dx > 0 ? 1 : -1;
      b.moving = true;
    } else {
      b.moving = false;
      b.hop = Math.max(0, b.hop - dt * 4);
    }
  }
}

function pasUpdateCritters(dt) {
  var i, bf, h = viewH, p, j, dx, dy, d;
  // Perhoset lepattavat kukilta toisille ja pakenevat poneja
  for (i = 0; i < pasButterflies.length; i++) {
    bf = pasButterflies[i];
    bf.t += dt;
    if (bf.loopT > 0) { bf.loopT -= dt; continue; }
    dx = bf.tx - bf.x; dy = bf.ty - bf.y;
    d = Math.sqrt(dx * dx + dy * dy);
    if (d < h * 0.02) {
      bf.tx = pasClampX(bf.x + (Math.random() - 0.5) * h * 1.0);
      bf.ty = pasYofT(Math.random()) - h * (0.04 + Math.random() * 0.1);
    } else {
      var spd = h * 0.13 * dt;
      bf.x += dx / d * spd;
      bf.y += dy / d * spd + Math.sin(bf.t * 9) * h * 0.06 * dt;
    }
    for (j = 0; j < stabPonies.length; j++) {
      p = stabPonies[j];
      if (p.qst === 'wait' || p.k === 'foal') continue;
      if (Math.abs(p.qx - bf.x) < h * 0.12 && Math.abs(p.qy - h * 0.12 - bf.y) < h * 0.12) {
        bf.tx = pasClampX(bf.x + (bf.x > p.qx ? 1 : -1) * h * 0.5);
        bf.ty = bf.y - h * 0.08;
      }
    }
  }
  // Sadepilvi ajelehtii; sade ja sateenkaari
  var cl = pasCloud, W = pasWorldW();
  cl.x += h * 0.02 * dt;
  if (cl.x > W + h * 0.4) cl.x = -h * 0.4;
  if (cl.wob > 0) cl.wob -= dt;
  if (cl.rainT > 0) {
    cl.rainT -= dt;
    for (i = 0; i < 3; i++) if (Math.random() < dt * 40) pasRain.push({ x: cl.x + (Math.random() - 0.5) * h * 0.36, y: h * 0.2, gy: pasYofT(Math.random()), vy: h * 1.6 });
    if (Math.random() < dt * 8) playNote(1500 + Math.random() * 1500, 0, 0.03, 'sine', 0.03);
    for (j = 0; j < stabPonies.length; j++) {
      p = stabPonies[j];
      if (Math.abs(p.qx - cl.x) < h * 0.25 && p.qtoss <= 0 && Math.random() < dt * 2) p.qtoss = 0.6;
    }
    if (cl.rainT <= 0) {
      cl.bowT = 12;
      for (i = 0; i < 7; i++) playNote(523 * Math.pow(1.12, i), i * 0.1, 0.3, 'sine', 0.12);
    }
  }
  if (cl.bowT > 0) cl.bowT -= dt;
  for (i = pasRain.length - 1; i >= 0; i--) {
    var r = pasRain[i];
    r.y += r.vy * dt;
    if (r.y >= r.gy) { if (Math.random() < 0.3) pasRings.push({ x: r.x, y: r.gy, age: 0.5, small: 1 }); pasRain.splice(i, 1); }
  }
  // Sammakko, kala ja pöllö
  if (pasFrog.jumpT > 0) pasFrog.jumpT -= dt;
  var pd = pasPond();
  if (pasFish.jumpT > 0) pasFish.jumpT -= dt;
  else if (pd.x + pd.rx > pasCam && pd.x - pd.rx < pasCam + viewW) {
    pasFish.t -= dt;
    if (pasFish.t <= 0) {
      pasFish.t = 6 + Math.random() * 6;
      pasFish.jumpT = 0.9;
      pasFish.x = pd.x + (Math.random() - 0.5) * pd.rx;
      pasFish.dir = Math.random() < 0.5 ? -1 : 1;
      playNote(1100, 0, 0.05, 'sine', 0.08);
    }
    if (pasFish.jumpT > 0 && pasFish.jumpT < 0.05) pasRings.push({ x: pasFish.x + pasFish.dir * h * 0.08, y: pd.y, age: 0 });
  }
  if (pasOwl.eyesT > 0) pasOwl.eyesT -= dt;
  if (pasOwl.flyT > 0) pasOwl.flyT -= dt;
  if (pasTreeShake > 0) pasTreeShake -= dt;
  if (pasOakShake > 0) pasOakShake -= dt;
  if (pasMudBlub > 0) pasMudBlub -= dt;
  if (pasLuckyT > 0) pasLuckyT -= dt;
  for (i = pasCloverSpin.length - 1; i >= 0; i--) {
    pasCloverSpin[i].t -= dt;
    if (pasCloverSpin[i].t <= 0) pasCloverSpin.splice(i, 1);
  }
}

function pasUpdateFx(dt) {
  var i, f, h = viewH, p;
  for (i = pasHearts.length - 1; i >= 0; i--) { pasHearts[i].age += dt; if (pasHearts[i].age > 1.4) pasHearts.splice(i, 1); }
  for (i = pasNotes.length - 1; i >= 0; i--) {
    f = pasNotes[i];
    f.age += dt;
    f.y += f.vy * dt;
    f.x += (f.vx || 0) * dt + Math.sin(f.age * 5 + i) * h * 0.02 * dt;
    if (f.age > f.life) pasNotes.splice(i, 1);
  }
  for (i = pasRings.length - 1; i >= 0; i--) { pasRings[i].age += dt; if (pasRings[i].age > 1.2) pasRings.splice(i, 1); }
  for (i = pasFly.length - 1; i >= 0; i--) {
    f = pasFly[i];
    f.t += dt / 0.9;
    if (f.t < 1) continue;
    if (f.kind === 'rosette' && f.pony) {
      f.pony.qros = f.g + 1;
      f.pony.qshine = 2;
      var c = pasPonyChest(f.pony);
      spawnSparkles(c.x, c.y, 16, f.g ? '#ffd24f' : '#5fa8ff');
      playNote(1047, 0, 0.1, 'sine', 0.2);
      playNote(1319, 0.1, 0.2, 'sine', 0.2);
    }
    pasFly.splice(i, 1);
  }
  for (i = pasFire.length - 1; i >= 0; i--) {
    f = pasFire[i];
    f.t += dt;
    if (f.t < 0) continue;
    f.age += dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.rocket) {
      f.vy += h * 0.6 * dt;
      if (Math.random() < dt * 30) pasFire.push({ x: f.x, y: f.y, vx: 0, vy: 0, t: 0, age: 0, life: 0.4, c: '#fff2a0', trail: 1 });
      if (f.vy > -h * 0.2 || f.age > 1.1) {
        for (var k = 0; k < 28; k++) {
          var ang = k / 28 * Math.PI * 2, sp = h * (0.25 + Math.random() * 0.2);
          pasFire.push({ x: f.x, y: f.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: 0, age: 0, life: 1.1 + Math.random() * 0.4, c: k % 3 ? f.c : '#ffffff' });
        }
        playNote(200, 0, 0.15, 'triangle', 0.15);
        for (k = 0; k < 5; k++) playNote(2000 + Math.random() * 2000, 0.1 + k * 0.06, 0.03, 'square', 0.025);
        pasFire.splice(i, 1);
      }
    } else {
      f.vy += h * 0.3 * dt;
      f.vx *= Math.max(0, 1 - dt * 1.5);
      if (f.age > f.life) pasFire.splice(i, 1);
    }
  }
  if (pasBanner) { pasBanner.t += dt; if (pasBanner.t > 4.2) pasBanner = null; }
}

// Raahattava seuraa sormea myös kameran liikkuessa
function pasDragFollow() {
  var d = homeDrag, wx;
  if (!d || !d.pas || !d.moved) return;
  wx = d.gx + pasCam;
  if (d.pas === 'pony') {
    var p = d.pony, foot = d.gy + pasPonySize(p, p.qy) * 0.9, ground = pasClampY(foot);
    p.qx = pasClampX(wx);
    p.qy = ground;
    p.qz = Math.max(0, ground - foot);
  } else if (d.pas === 'prin') {
    pasPrin.x = pasClampX(wx);
    pasPrin.y = d.gy + viewH * 0.1;
  } else if (d.pas === 'apple') {
    d.apple.x = wx;
    d.apple.y = d.gy;
  } else if (d.pas === 'obst') {
    var o = pasCourse[d.n];
    o.x = Math.min(Math.max(wx - d.dx, viewH * 0.4), pasWorldW() - viewH * 0.4) / viewH;
    o.t = Math.max(0.1, Math.min(0.9, pasTofY(d.gy - d.dy)));
  }
}

function pasUpdateCam(dt) {
  var maxC = Math.max(0, pasWorldW() - viewW), goal, d = homeDrag;
  if (pasRider) {
    goal = pasRider.qx - viewW * 0.5 + pasRider.qdir * viewW * 0.2 * Math.min(1, pasRider.qsp / PAS_GALLOP);
    pasCam += (goal - pasCam) * Math.min(1, dt * 3.5);
    pasCamV = 0;
    pasCamGoal = -1;
  } else if (d && d.pas && d.moved && (d.pas === 'pony' || d.pas === 'prin' || d.pas === 'apple' || d.pas === 'obst')) {
    // Kantaessa ruudun reuna vierittää
    if (d.gx < viewW * 0.08) pasCam -= viewH * 0.6 * dt;
    else if (d.gx > viewW * 0.92) pasCam += viewH * 0.6 * dt;
  } else if (d && d.pas === 'pan') {
    // pasMove hoitaa
  } else if (pasGhostRun && pasGhostRun.solo && !pasGhostRun.done && !d && pasCamGoal < 0) {
    goal = pasGhostRun.g.qx - viewW * 0.5;
    pasCam += (goal - pasCam) * Math.min(1, dt * 3);
  } else if (pasCamGoal >= 0) {
    pasCam += (pasCamGoal - pasCam) * Math.min(1, dt * 3);
    if (Math.abs(pasCamGoal - pasCam) < 2) pasCamGoal = -1;
  } else if (pasCamV) {
    pasCam += pasCamV * dt;
    pasCamV *= Math.max(0, 1 - dt * 3);
    if (Math.abs(pasCamV) < 5) pasCamV = 0;
  }
  pasCam = Math.min(Math.max(pasCam, 0), maxC);
}

// ---------- Napautukset ja raahaus ----------
function pasPonyHit(p, wx, py) {
  var s = pasPonySize(p, p.qy), y = p.qy - p.qz;
  return Math.abs(wx - p.qx - p.qdir * s * 0.15) < s * 0.95 && py < y + s * 0.15 && py > y - s * 1.8;
}
// Ratsastajan osuma: vain prinsessa (ponista painaminen ohjaa, ei pudota selästä)
function pasRiderHit(wx, py) {
  var seat = pasRiderSeat(pasRider), s = seat.s;
  return Math.abs(wx - seat.x) < s * 0.42 && py > seat.y - s * 1.2 && py < seat.y + s * 0.05;
}
function pasPrinHit(wx, py) {
  var pr = pasPrin, k = pasK(pr.y);
  return pr.mode === 'foot' && Math.abs(wx - pr.x) < viewH * 0.065 * k && py > pr.y - viewH * 0.19 * k && py < pr.y + viewH * 0.025;
}
function pasStarPonyIdlePos() {
  var a = pasObs(0), o1 = pasObs(1), dir = o1.x >= a.x ? 1 : -1;
  return { x: a.x + dir * viewH * 0.22, y: a.y + viewH * 0.05, dir: dir };
}

// Reunanuolet: seuraava este kierroksella tai näkymästä kadonnut prinsessa
function pasArrows() {
  var out = [], tx = -1, kind = '', col = '#ffb300', n = 0, sx, dir;
  if (pasRound) {
    if (pasRound.next <= 5) { tx = pasObs(pasRound.next).x; kind = 'num'; n = pasRound.next; col = PAS_FLAG[n - 1]; }
    else { tx = pasObs(0).x; kind = 'arch'; }
  } else if (!pasRider && pasPrin && pasPrin.mode === 'foot') {
    tx = pasPrin.x; kind = 'prin';
  }
  if (tx < 0) return out;
  sx = tx - pasCam;
  if (sx >= viewW * 0.03 && sx <= viewW * 0.97) return out;
  dir = sx < 0 ? -1 : 1;
  out.push({ x: dir < 0 ? viewH * 0.09 : viewW - viewH * 0.09, y: viewH * 0.56, r: viewH * 0.055, dir: dir, tx: tx, kind: kind, col: col, n: n });
  return out;
}

function pasTap(px, py) {
  var wx = px + pasCam, h = viewH, i, p, best = null, by = -1, ar, dx, dy;
  if (!pasPrin) pasOnEnter();
  pasCamV = 0;
  if (!pasRider) {
    ar = pasArrows();
    for (i = 0; i < ar.length; i++) {
      dx = px - ar[i].x; dy = py - ar[i].y;
      if (dx * dx + dy * dy < ar[i].r * ar[i].r * 2) {
        pasCamGoal = Math.min(Math.max(ar[i].tx - viewW * 0.5, 0), Math.max(0, pasWorldW() - viewW));
        playNote(784, 0, 0.08, 'sine', 0.2);
        return;
      }
    }
  }
  pasCamGoal = -1;
  var base = { gx: px, gy: py, sx: px, sy: py, moved: false, t0: globalT };
  if (pasRider && pasRiderHit(wx, py)) { base.pas = 'rider'; homeDrag = base; return; }
  var tap = pasSceneryAt(wx, py, px);
  if (pasRider) {
    if (pasPonyHit(pasRider, wx, py)) tap = pasRiderTap;
    base.pas = 'steer'; base.tap = tap; homeDrag = base;
    pasIdleT = 0;
    return;
  }
  if (pasPrinHit(wx, py)) { base.pas = 'prin'; homeDrag = base; playNote(988, 0, 0.05, 'sine', 0.15); return; }
  for (i = pasApples.length - 1; i >= 0; i--) {
    var ap = pasApples[i];
    if (Math.abs(wx - ap.x) < h * 0.045 && Math.abs(py - (ap.y - h * 0.015)) < h * 0.045) {
      base.pas = 'apple';
      base.apple = ap;
      ap.held = true;
      if (ap.eater) { ap.eater.qapple = null; ap.eater = null; }
      homeDrag = base;
      playNote(880, 0, 0.05, 'sine', 0.15);
      return;
    }
  }
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.qst === 'wait') continue;
    if (pasPonyHit(p, wx, py) && p.qy > by) { best = p; by = p.qy; }
  }
  if (best) {
    if (pasBunRide && pasBunRide.p === best) pasBunRideEnd();
    if (best.qapple) { best.qapple.eater = null; best.qapple = null; }
    base.pas = 'pony';
    base.pony = best;
    best.qst = 'held';
    best.qheld = 0;
    best.qslot = -1;
    homeDrag = base;
    return;
  }
  for (i = 0; i < homeBunnies.length; i++) {
    var b = homeBunnies[i];
    if (pasBunRide && pasBunRide.b === i) continue;
    if (Math.abs(wx - b.qx) < h * 0.055 && py < b.qy + h * 0.01 && py > b.qy - h * 0.11) {
      b.hop = 1.6;
      spawnSparkles(b.qx, b.qy - h * 0.1, 6, '#ffd6ec');
      playNote(1200 + i * 100, 0, 0.08, 'sine', 0.25);
      playNote(1500 + i * 100, 0.07, 0.1, 'sine', 0.2);
      return;
    }
  }
  for (i = 0; i < pasButterflies.length; i++) {
    var bf = pasButterflies[i];
    if (Math.abs(wx - bf.x) < h * 0.05 && Math.abs(py - bf.y) < h * 0.05 && bf.loopT <= 0) {
      bf.loopT = 1.2;
      spawnSparkles(bf.x, bf.y, 8, bf.c);
      for (var k = 0; k < 4; k++) playNote(1400 + k * 200, k * 0.08, 0.06, 'sine', 0.1);
      return;
    }
  }
  for (i = pasCourse.length - 1; i >= 0; i--) {
    var ob = pasObs(i);
    if (Math.abs(wx - pasObsLineX(ob, Math.min(Math.max(py + h * 0.04, ob.y - ob.d), ob.y + ob.d))) < h * 0.08 && py > ob.y - ob.d - h * (i === 0 ? 0.25 : 0.12) && py < ob.y + ob.d + h * 0.03) {
      base.pas = 'obst';
      base.n = i;
      base.dx = wx - ob.x;
      base.dy = py - ob.y;
      base.ox = pasCourse[i].x;
      base.ot = pasCourse[i].t;
      homeDrag = base;
      return;
    }
  }
  base.pas = 'pan';
  base.tap = tap;
  base.cam0 = pasCam;
  base.lx = px;
  base.lt = globalT;
  base.v = 0;
  homeDrag = base;
}

function pasMove(px, py) {
  var d = homeDrag, now = globalT;
  d.gx = px;
  d.gy = py;
  if (d.pas === 'pan') {
    if (!d.moved) return;
    pasCam = Math.min(Math.max(d.cam0 - (px - d.sx), 0), Math.max(0, pasWorldW() - viewW));
    var dtm = Math.max(0.016, now - d.lt);
    d.v = d.v * 0.5 + ((d.lx - px) / dtm) * 0.5;
    d.lx = px;
    d.lt = now;
  } else if (d.pas === 'rider') {
    var dx = px - d.sx, dy = py - d.sy;
    if (dx * dx + dy * dy > viewH * viewH * 0.012) {
      // Raahaus ratsastajasta: prinsessa nousee pois ja kulkee sormessa
      pasDismount(px + pasCam, py + viewH * 0.1);
      pasPrin.mode = 'held';
      d.pas = 'prin';
      d.moved = true;
      playNote(880, 0, 0.06, 'sine', 0.18);
      playNote(660, 0.06, 0.08, 'sine', 0.15);
    }
  } else if (d.pas === 'prin') {
    if (d.moved) pasPrin.mode = 'held';
  }
}

function pasUp() {
  var d = homeDrag, wx;
  homeDrag = null;
  if (!d) return;
  wx = d.gx + pasCam;
  if (d.pas === 'steer') {
    if (!d.moved && globalT - d.t0 < 0.35 && d.tap) d.tap();
  } else if (d.pas === 'pan') {
    if (!d.moved) {
      if (d.tap) d.tap();
      else {
        spawnSparkles(wx, d.gy, 4, '#c8f0a0');
        playNote(1500 + Math.random() * 400, 0, 0.04, 'sine', 0.06);
      }
    } else if (globalT - d.lt < 0.12) {
      pasCamV = Math.max(-viewH * 4, Math.min(viewH * 4, d.v));
    }
  } else if (d.pas === 'rider') {
    if (!d.moved) pasRiderTap();
  } else if (d.pas === 'prin') {
    if (!d.moved) { pasPrin.mode = 'foot'; pasPrinTap(); }
    else pasPrinDrop(wx, d.gy);
  } else if (d.pas === 'pony') {
    if (!d.moved) { d.pony.qst = 'idle'; d.pony.qtimer = 1; pasPonyTap(d.pony); }
    else pasPonyDrop(d.pony);
  } else if (d.pas === 'apple') {
    d.apple.held = false;
    if (!d.moved) { d.apple.wob = 0.5; playNote(600, 0, 0.05, 'triangle', 0.15); }
    else pasAppleDrop(d.apple);
  } else if (d.pas === 'obst') {
    if (!d.moved) pasObsTap(d.n);
    else pasObsMoved(d.n, d);
  }
}

function pasPrinTap() {
  var pr = pasPrin, i, mel = [1047, 1319, 1568, 2093];
  pr.waveT = 1.4;
  // Vihellys: nuotit ja ponit ravaavat luo
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.1, i === 3 ? 0.3 : 0.1, 'sine', 0.18);
  for (i = 0; i < 4; i++) pasNotes.push({ x: pr.x + (Math.random() - 0.5) * viewH * 0.05, y: pr.y - viewH * 0.16, vy: -viewH * (0.12 + Math.random() * 0.08), age: -i * 0.1, life: 1.4, c: i % 3 });
  pasCall();
}
function pasPrinDrop(wx, gy) {
  var i, p, s, best = null, bd = 1e9, dx, dy, foot = gy + viewH * 0.1;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.k !== 'pony' || p.qst === 'wait' || p.qst === 'roll' || p.qst === 'held') continue;
    s = pasPonySize(p, p.qy);
    dx = wx - p.qx; dy = (gy + viewH * 0.06) - (p.qy - s * 0.95);
    if (Math.abs(dx) < s * 1.0 && Math.abs(dy) < s * 0.9 && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p; }
  }
  if (best) { pasPrin.x = wx; pasPrin.y = pasClampY(foot); pasMount(best); return; }
  pasPrin.mode = 'foot';
  pasPrin.x = pasClampX(wx);
  pasPrin.y = pasClampY(foot);
  pasPrin.waveT = 1;
  playNote(523, 0, 0.08, 'sine', 0.15);
  spawnSparkles(pasPrin.x, pasPrin.y, 5, '#ffd6ec');
}
function pasPonyDrop(p) {
  var s = pasPonySize(p, p.qy), i, b, pr = pasPrin;
  p.qst = 'idle';
  p.qtimer = 1 + Math.random();
  if (p.k === 'pony') {
    // Lähin selkään hyppääjä: prinsessa (ratsastus) tai pupu (pupu ratsastaa)
    var best = -2, bd = 1e9, dx, dy, dd;
    if (pr.mode === 'foot') {
      dx = p.qx - pr.x; dy = p.qy - pr.y;
      if (Math.abs(dx) < s * 1.1 && Math.abs(dy) < viewH * 0.12) { best = -1; bd = dx * dx + dy * dy; }
    }
    for (i = 0; i < homeBunnies.length; i++) {
      b = homeBunnies[i];
      if (pasBunRide && pasBunRide.b === i) continue;
      dx = p.qx - b.qx; dy = p.qy - b.qy; dd = dx * dx + dy * dy;
      if (Math.abs(dx) < s * 0.9 && Math.abs(dy) < viewH * 0.1 && dd < bd) { best = i; bd = dd; }
    }
    if (best === -1) { pasMount(p); return; }
    if (best >= 0) { pasBunRideStart(p, best); return; }
  }
  if (pasInEllipse(pasMud(), p.qx, p.qy, viewH * 0.03)) {
    p.qst = 'roll';
    p.qrollT = 2.8;
    p.qtimer = 2.8;
    p.mud = Math.min(STAB_MUD, p.mud + 2);
    p.md = stabDay();
    for (i = 0; i < 4; i++) playNote(160 + i * 30, i * 0.08, 0.08, 'triangle', 0.1);
    saveProgress();
    return;
  }
  if (pasInEllipse(pasPond(), p.qx, p.qy)) {
    spawnSparkles(p.qx, p.qy - viewH * 0.02, 18, '#7fd4ff');
    pasRings.push({ x: p.qx, y: p.qy, age: 0 });
    for (i = 0; i < 5; i++) playNote(800 + Math.random() * 800, i * 0.05, 0.05, 'sine', 0.1);
    p.qtoss = 1;
  }
  stabNicker(p, 0);
}
function pasPonyTap(p) {
  var s = pasPonySize(p, p.qy), hx = p.qx + p.qdir * s * 0.62, hy = p.qy - p.qz - s * 1.35;
  p.qtoss = 0.9;
  if (p.k === 'foal') {
    stabNeigh(p, 0);
    p.qjump = 0.3; p.qjumpD = 0.3; p.qjumpH = viewH * 0.03;
    spawnSparkles(hx, hy, 6, p.u ? '#ff9ec4' : '#ffe066');
    return;
  }
  if (pasTaps.p === p && globalT - pasTaps.t < 2.5) pasTaps.n++;
  else { pasTaps.p = p; pasTaps.n = 1; }
  pasTaps.t = globalT;
  if (pasTaps.n >= 5) { pasTaps.n = 0; pasRear(p); return; }
  stabNeigh(p, 0);
  spawnSparkles(hx, hy - viewH * 0.02, 6, '#ffffff');
  if (Math.random() < 0.5) pasGo(p, 'walk', p.qx + (Math.random() < 0.5 ? -1 : 1) * viewH * (0.15 + Math.random() * 0.1), p.qy + (Math.random() - 0.5) * viewH * 0.06, PAS_TROT);
}
function pasRear(p) {
  var mel = [392, 523, 659, 784, 659, 784, 1047], i, s = pasPonySize(p, p.qy);
  if (p !== pasRider) p.qst = 'rear';
  p.qrearT = 1.8;
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.14, 0.18, 'square', 0.05);
  stabNeigh(p, mel.length * 0.14);
  for (i = 0; i < 6; i++) pasNotes.push({ x: p.qx + (Math.random() - 0.5) * viewH * 0.06, y: p.qy - s * 1.9, vy: -viewH * (0.12 + Math.random() * 0.08), age: -i * 0.1, life: 1.4, c: i % 3 });
}
function pasRiderTap() {
  var p = pasRider;
  pasPrin.waveT = 1.4;
  p.qtoss = 0.9;
  if (pasTaps.p === p && globalT - pasTaps.t < 2.5) pasTaps.n++;
  else { pasTaps.p = p; pasTaps.n = 1; }
  pasTaps.t = globalT;
  if (pasTaps.n >= 5 && p.qsp < 0.1) {
    pasTaps.n = 0;
    pasRear(p);
    for (var i = 0; i < 5; i++) pasHearts.push({ x: p.qx + (i - 2) * viewH * 0.03, y: p.qy - viewH * 0.25, age: -i * 0.15 });
    return;
  }
  stabNeigh(p, 0);
  playNote(1319, 0.3, 0.08, 'sine', 0.15);
}
function pasAppleDrop(ap) {
  var i, p, s, hx, hy, dx, dy, best = null, bd = viewH * viewH * 0.014;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.qst === 'wait' || p.qst === 'held' || p.qst === 'roll') continue;
    s = pasPonySize(p, p.qy);
    hx = p.qx + p.qdir * s * 0.62; hy = p.qy - p.qz - s * 1.35;
    dx = ap.x - hx; dy = ap.y - hy;
    if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p; }
  }
  if (best) {
    if (best === pasRider) {
      // Ratsu syö selästä annetun omenan
      pasApples.splice(pasApples.indexOf(ap), 1);
      best.qtoss = 0.6;
      for (i = 0; i < 4; i++) playNote(700 + Math.random() * 500, 0.1 + i * 0.2, 0.03, 'square', 0.04);
      pasHearts.push({ x: best.qx, y: best.qy - viewH * 0.2, age: 0 });
      if (ap.gold) { pasGoldApple = stabDay(); starCoins += 1; pasFly.push({ x0: ap.x - pasCam, y0: ap.y, x1: viewH * 0.17, y1: viewH * 0.065, t: 0, kind: 'star', scr: 1 }); soundStar(4); saveProgress(); }
      return;
    }
    if (pasBunRide && pasBunRide.p === best) pasBunRideEnd();
    pasEatApple(best, ap);
    return;
  }
  // Omena putoaa maahan sormen kohdalta
  ap.gy = pasClampY(ap.y + viewH * 0.06);
  ap.vy = 0;
  ap.rest = false;
}

// Esteen napautus: numero kilisee yhtä monta kertaa ja pisteet syttyvät
function pasObsTap(n) {
  var o = pasCourse[n], ob = pasObs(n), i;
  o.wig = 0.8;
  if (n === 0) {
    var mel = [784, 988, 1175, 1568];
    for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.1, 0.15, 'triangle', 0.18);
    pasInviteT = 0;
    spawnSparkles(ob.x, ob.y - viewH * 0.2, 12, '#ffe27a');
    return;
  }
  o.countT = 0;
  o.count = n;
  for (i = 0; i < n; i++) playNote(880 + i * 110, 0.05 + i * 0.28, 0.14, 'sine', 0.2);
}
function pasObsMoved(n, d) {
  var o = pasCourse[n];
  if (Math.abs(o.x - d.ox) < 0.02 && Math.abs(o.t - d.ot) < 0.02) return;
  // Uusi rata: ennätys ja Tähtiponin reitti nollautuvat
  pasRecord = 0;
  pasGhost = null;
  pasDemo = null;
  var ob = pasObs(n);
  spawnSparkles(ob.x, ob.y - viewH * 0.04, 10, n ? PAS_FLAG[n - 1] : '#ffe27a');
  playNote(330, 0, 0.06, 'square', 0.1);
  playNote(440, 0.07, 0.08, 'square', 0.08);
  saveProgress();
}

// Maiseman napautuskohde: palauttaa funktion tai null
function pasSceneryAt(wx, py, px) {
  var h = viewH, g = pasGate(), tr = pasTree(), oak = pasOak(), i, c, cl = pasCloud, sp;
  if (Math.abs(wx - g.x) < g.w * 0.6 && py > g.y - g.h - h * 0.06 && py < g.y + h * 0.05) return function () { homeGoRoom(STABLE_ROOM); };
  if (Math.abs(wx - cl.x) < h * 0.13 && Math.abs(py - h * 0.17) < h * 0.08) return pasCloudTap;
  if (Math.abs(wx - tr.x) < tr.s * 0.6 && py > tr.y - tr.s * 1.35 && py < tr.y + h * 0.02) return pasShakeTree;
  if (Math.abs(wx - oak.x) < oak.s * 0.6 && py > oak.y - oak.s * 1.35 && py < oak.y + h * 0.02) return pasOakTap;
  for (i = 0; i < PAS_CLOVERS.length; i++) {
    c = pasCloverPos(i);
    if (Math.abs(wx - c.x) < h * 0.045 && Math.abs(py - c.y) < h * 0.04) return (function (k) { return function () { pasCloverTap(k); }; })(i);
  }
  if (pasInEllipse(pasPond(), wx, py)) return function () { pasPondTap(wx, py); };
  if (pasInEllipse(pasMud(), wx, py)) return function () { pasMudTap(wx, py); };
  if (!pasGhostRun) {
    sp = pasStarPonyIdlePos();
    if (Math.abs(wx - sp.x) < h * 0.09 && py > sp.y - h * 0.17 && py < sp.y + h * 0.02) return pasStarPonyTap;
  }
  return null;
}
function pasCloudTap() {
  var cl = pasCloud;
  cl.wob = 0.6;
  if (cl.rainT > 0 || cl.bowT > 0) { playNote(700, 0, 0.08, 'sine', 0.12); return; }
  cl.rainT = 3.5;
  playNote(392, 0, 0.2, 'triangle', 0.15);
  playNote(330, 0.15, 0.25, 'triangle', 0.15);
}
function pasOakTap() {
  var oak = pasOak();
  pasOakShake = 0.7;
  pasOwl.taps++;
  pasOwl.eyesT = 2.2;
  for (var i = 0; i < 4; i++) playNote(500 + Math.random() * 300, i * 0.05, 0.05, 'triangle', 0.05);
  playNote(392, 0.25, 0.25, 'sine', 0.2);
  playNote(330, 0.6, 0.35, 'sine', 0.2);
  if (pasOwl.taps % 3 === 0) {
    pasOwl.flyT = 3;
    spawnSparkles(oak.x, oak.y - oak.s * 0.8, 8, '#c9a0ff');
  }
}
function pasCloverTap(i) {
  var c = pasCloverPos(i), d = stabDay();
  pasCloverSpin.push({ i: i, t: 0.6 });
  if (i === pasLuckyIdx() && pasCloverDay !== d) {
    // Päivän nelilehtinen apila: tähti ja onnen sävel
    pasCloverDay = d;
    pasLuckyT = 2.5;
    starCoins += 1;
    pasFly.push({ x0: c.x - pasCam, y0: c.y - viewH * 0.03, x1: viewH * 0.17, y1: viewH * 0.065, t: 0, kind: 'star', scr: 1 });
    for (var k = 0; k < RAINBOW_COLORS.length; k++) spawnSparkles(c.x, c.y - viewH * 0.02, 3, RAINBOW_COLORS[k]);
    var mel = [784, 988, 1175, 1568, 1976];
    for (k = 0; k < mel.length; k++) playNote(mel[k], k * 0.09, 0.2, 'sine', 0.2);
    soundStar(5);
    saveProgress();
    return;
  }
  spawnSparkles(c.x, c.y - viewH * 0.01, 4, '#6fd66f');
  playNote(1568, 0, 0.05, 'sine', 0.1);
}
function pasPondTap(wx, py) {
  var pads = pasLilyPads();
  pasRings.push({ x: wx, y: py, age: 0 });
  pasRings.push({ x: wx, y: py, age: -0.25 });
  playNote(600 + Math.random() * 200, 0, 0.08, 'sine', 0.15);
  playNote(400, 0.06, 0.1, 'sine', 0.1);
  pasFrog.taps++;
  if (pasFrog.taps % 3 === 0) {
    pasFrog.from = pasFrog.pad;
    pasFrog.pad = (pasFrog.pad + 1 + randInt(pads.length - 1)) % pads.length;
    pasFrog.jumpT = 0.5;
    playNote(180, 0.05, 0.12, 'square', 0.08);
    playNote(140, 0.2, 0.15, 'square', 0.08);
  }
}
function pasMudTap(wx, py) {
  pasMudBlub = 0.6;
  pasRings.push({ x: wx, y: py, age: 0.3, mud: 1 });
  playNote(110, 0, 0.12, 'triangle', 0.15);
  playNote(160, 0.1, 0.1, 'triangle', 0.12);
  spawnSparkles(wx, py - viewH * 0.01, 5, '#8a6038');
}
// Tähtiponin napautus: se ratsastaa radan yksin näytökseksi (liput syttyvät järjestyksessä)
function pasStarPonyTap() {
  var sp = pasStarPonyIdlePos(), path = pasGhostPath(), g = { k: 'pony', c: 0, m: 0, u: 1, ph: 0 };
  pasInviteT = 0;
  if (!pasRound && !pasGhostRun) {
    var p0 = pasPathAt(path, 0);
    pasPonyInit(g, p0.x, p0.y);
    g.qdir = sp.dir;
    g.qst = 'ghost';
    pasGhostRun = { path: path, total: pasPathTotal(path), g: g, done: false, wait: 0, solo: true, t: -0.6, next: 1 };
    stabNeigh(g, 0.1);
  }
  spawnSparkles(sp.x, sp.y - viewH * 0.1, 14, '#fff2a0');
  playNote(1319, 0, 0.1, 'sine', 0.18);
  playNote(1760, 0.1, 0.1, 'sine', 0.18);
  playNote(2093, 0.2, 0.2, 'sine', 0.18);
}

// ---------- Taustat (esirenderöity) ----------
// Kaukainen kerros (vuoret, kukkulat ja linna) liikkuu 0,25-kertaisesti,
// keskikerros (puurivi ja talli) 0,6-kertaisesti, niitty kameran mukana
// toistuvana laattana.
function renderPasBg() {
  var key = viewW + 'x' + viewH;
  if (pasBgKey === key) return;
  pasBgKey = key;
  var h = viewH, W = pasWorldW(), top = pasTop(), bot = pasBot(), sc = DPR, i, x, b;
  // Kaukainen kerros (vain vuorten korkeudelta: yläpuolella on taivasta)
  var fy0 = Math.floor(top - h * 0.32), fw = Math.ceil(viewW + (W - viewW) * 0.25 + 4), fh = Math.ceil(top + 2 - fy0);
  pasFarCanvas.width = Math.round(fw * sc);
  pasFarCanvas.height = Math.round(fh * sc);
  pasFarCanvas.y0 = fy0;
  b = pasFarCanvas.getContext('2d');
  b.setTransform(sc, 0, 0, sc, 0, -fy0 * sc);
  b.fillStyle = '#c9c4ec';
  b.beginPath(); b.moveTo(0, fh);
  for (x = 0; x <= fw; x += h * 0.05) b.lineTo(x, top - h * 0.17 - Math.abs(Math.sin(x / h * 1.7)) * h * 0.09 - Math.sin(x / h * 0.6) * h * 0.03);
  b.lineTo(fw, fh); b.closePath(); b.fill();
  b.fillStyle = '#bfe3a8';
  b.beginPath(); b.moveTo(0, fh);
  for (x = 0; x <= fw; x += h * 0.05) b.lineTo(x, top - h * 0.08 - Math.sin(x / h * 1.3 + 1) * h * 0.035);
  b.lineTo(fw, fh); b.closePath(); b.fill();
  // Oma linna kaukaisella kukkulalla
  var cx = Math.min(fw - h * 0.3, viewW * 0.72), cb = top - h * 0.08 - Math.sin(cx / h * 1.3 + 1) * h * 0.035 + h * 0.01;
  b.fillStyle = '#b3dd9a';
  b.beginPath(); b.arc(cx, cb + h * 0.05, h * 0.16, Math.PI, 0); b.fill();
  b.globalAlpha = 0.85;
  drawCastle(b, cx, cb - h * 0.02, h * 0.1);
  b.globalAlpha = 1;
  for (i = 0; i < 9; i++) {
    x = (i * 0.37 + 0.1) % 1 * fw;
    if (Math.abs(x - cx) < h * 0.2) continue;
    drawTree(b, x, top - h * 0.06 - Math.sin(x / h * 1.3 + 1) * h * 0.035 + h * 0.02, h * 0.05, 0.5);
  }
  // Keskikerros: puurivi, pensaat ja talli portin takana
  var mw = Math.ceil(viewW + (W - viewW) * 0.6 + 4), my0 = Math.floor(top - h * 0.2), mh = Math.ceil(h * 0.22);
  pasMidCanvas.width = Math.round(mw * sc);
  pasMidCanvas.height = Math.round(mh * sc);
  pasMidCanvas.y0 = my0;
  b = pasMidCanvas.getContext('2d');
  b.setTransform(sc, 0, 0, sc, 0, -my0 * sc);
  b.fillStyle = '#a8dc8c';
  b.beginPath(); b.moveTo(0, top + h * 0.02);
  for (x = 0; x <= mw; x += h * 0.06) b.lineTo(x, top - h * 0.03 - Math.sin(x / h * 2.1) * h * 0.012);
  b.lineTo(mw, top + h * 0.02); b.closePath(); b.fill();
  var bx = viewH * 0.06, bw = h * 0.3, bb = top - h * 0.015, bt = bb - h * 0.12;
  b.beginPath(); b.rect(bx, bt, bw, bb - bt);
  artFillPath(b, '#e05a5a', bt, bb, h * 0.05, { lineColor: '#8a2a2a', line: Math.max(1, h * 0.003) });
  b.beginPath(); b.moveTo(bx - h * 0.02, bt + h * 0.003); b.lineTo(bx + bw / 2, bt - h * 0.07); b.lineTo(bx + bw + h * 0.02, bt + h * 0.003); b.closePath();
  artFillPath(b, '#8a5cb8', bt - h * 0.07, bt, h * 0.05, { lineColor: '#4a2a6a', line: Math.max(1, h * 0.003) });
  b.fillStyle = '#4a2a20';
  roundRect(b, bx + bw * 0.38, bb - h * 0.075, bw * 0.24, h * 0.075, h * 0.01);
  b.fill();
  b.fillStyle = '#fff6ec';
  b.fillRect(bx, bt, h * 0.008, bb - bt);
  b.fillRect(bx + bw - h * 0.008, bt, h * 0.008, bb - bt);
  for (i = 0; i < 22; i++) {
    x = h * 0.5 + i * (mw - h * 0.6) / 21 + Math.sin(i * 7.3) * h * 0.08;
    var tb = top - h * 0.02 - Math.sin(x / h * 2.1) * h * 0.012;
    if (i % 3 === 1) drawBush(b, x, tb + h * 0.01, h * 0.025);
    else drawTree(b, x, tb, h * (0.09 + (i % 4) * 0.015), 0.18);
  }
  // Niittylaatta: ruohon liukuväri, tupsut ja pikkukukat (saumaton vaakasuunnassa)
  var tw = Math.ceil(viewW), th = Math.ceil(viewH - top + 1);
  pasTileCanvas.width = Math.round(tw * sc);
  pasTileCanvas.height = Math.round(th * sc);
  b = pasTileCanvas.getContext('2d');
  b.setTransform(sc, 0, 0, sc, 0, 0);
  var gg = b.createLinearGradient(0, 0, 0, th);
  gg.addColorStop(0, '#b2e690');
  gg.addColorStop(0.5, '#8fd677');
  gg.addColorStop(1, '#5fb54c');
  b.fillStyle = gg;
  b.fillRect(0, 0, tw, th);
  b.fillStyle = 'rgba(255,255,255,0.08)';
  for (i = 0; i < 7; i++) {
    var px = (i * 0.21 + 0.05) % 1 * tw, py = (i * 0.37 + 0.2) % 1 * th;
    for (var rep = -1; rep <= 1; rep++) { b.beginPath(); b.ellipse ? b.ellipse(px + rep * tw, py, h * 0.25, h * 0.05, 0, 0, Math.PI * 2) : b.arc(px + rep * tw, py, h * 0.1, 0, Math.PI * 2); b.fill(); }
  }
  b.lineWidth = Math.max(1, h * 0.003);
  b.lineCap = 'round';
  for (i = 0; i < 140; i++) {
    var gx = (i * 97.37) % tw, gy = h * 0.01 + (i * 53.71) % (th - h * 0.02), gk = 0.6 + gy / th * 0.6;
    b.strokeStyle = i % 3 ? 'rgba(40,110,40,0.35)' : 'rgba(255,255,255,0.25)';
    var xs = [gx, gx < h * 0.02 ? gx + tw : (gx > tw - h * 0.02 ? gx - tw : null)];
    for (var q = 0; q < 2; q++) {
      if (xs[q] === null) continue;
      b.beginPath();
      b.moveTo(xs[q] - h * 0.006 * gk, gy); b.lineTo(xs[q] - h * 0.009 * gk, gy - h * 0.016 * gk);
      b.moveTo(xs[q], gy); b.lineTo(xs[q] + h * 0.001, gy - h * 0.02 * gk);
      b.moveTo(xs[q] + h * 0.006 * gk, gy); b.lineTo(xs[q] + h * 0.009 * gk, gy - h * 0.015 * gk);
      b.stroke();
    }
  }
  var fcs = ['#ffffff', '#ffd24f', '#ff9ec4', '#c9a0ff'];
  for (i = 0; i < 28; i++) {
    var fx = h * 0.03 + (i * 131.3) % (tw - h * 0.06), fy = h * 0.03 + (i * 71.9) % (th - h * 0.06);
    drawFlower(b, fx, fy, h * (0.004 + fy / th * 0.004), fcs[i % fcs.length]);
  }
}

// Esirenderöity kerros vieritettynä: vain näkyvä osa, laitepikseleihin kohdistettuna
function pasBlit(c, img, scroll, y0) {
  var sc = DPR, sx = Math.round(scroll * sc), sw = Math.min(img.width - sx, Math.ceil(viewW * sc));
  if (sw <= 0) return;
  c.drawImage(img, sx, 0, sw, img.height, 0, y0, sw / sc, img.height / sc);
}

// ---------- Piirto ----------
function drawPasture() {
  var c = ctx, h = viewH, cam = pasCam, top = pasTop(), i, o;
  if (!pasPrin) pasOnEnter();
  renderPasBg();
  // Taivas ja aurinko
  if (!pasSky || pasSky.k !== pasBgKey) {
    pasSky = { k: pasBgKey, g: c.createLinearGradient(0, 0, 0, top) };
    pasSky.g.addColorStop(0, '#8fd0ff');
    pasSky.g.addColorStop(1, '#eaf7ff');
  }
  c.fillStyle = pasSky.g;
  c.fillRect(0, 0, viewW, top + 2);
  var sunX = viewW * 0.85 - cam * 0.04, sunY = h * 0.11;
  artGlow(c, sunX, sunY, h * 0.15, '#fff4c8', 0.55);
  artCircle(c, sunX, sunY, h * 0.045, '#ffe07a', { lineColor: '#f0b840', line: Math.max(1, h * 0.003) });
  // Sateenkaari sateen jälkeen (puiden takana)
  if (pasCloud.bowT > 0) pasDrawRainbow(c);
  pasBlit(c, pasFarCanvas, cam * 0.25, pasFarCanvas.y0);
  pasBlit(c, pasMidCanvas, cam * 0.6, pasMidCanvas.y0);
  // Niitty: laatta kahtena palana (vain näkyvä osa)
  var sc = DPR, tpx = pasTileCanvas.width, th = pasTileCanvas.height, sx = Math.round((cam * sc) % tpx), w1 = Math.min(tpx - sx, Math.ceil(viewW * sc));
  if (w1 > 0) c.drawImage(pasTileCanvas, sx, 0, w1, th, 0, top, w1 / sc, th / sc);
  if (w1 < viewW * sc) c.drawImage(pasTileCanvas, 0, 0, Math.min(tpx, Math.ceil(viewW * sc - w1)), th, w1 / sc, top, Math.min(tpx, Math.ceil(viewW * sc - w1)) / sc, th / sc);

  c.save();
  c.translate(-cam, 0);
  pasDrawFence(c);
  pasDrawGate(c);
  pasDrawPond(c);
  pasDrawMud(c);
  for (i = 0; i < PAS_CLOVERS.length; i++) pasDrawClover(c, i);
  for (i = 0; i < pasRings.length; i++) pasDrawRing(c, pasRings[i]);
  // Syvyysjärjestys
  var order = [], p, x0 = cam - h * 0.6, x1 = cam + viewW + h * 0.6;
  for (i = 0; i < pasCourse.length; i++) { o = pasObs(i); if (o.x > x0 - h * 0.3 && o.x < x1 + h * 0.3) order.push({ y: o.y, obs: i }); }
  var tr = pasTree(), oak = pasOak();
  if (tr.x > x0 - tr.s && tr.x < x1 + tr.s) order.push({ y: tr.y, tree: 1 });
  if (oak.x > x0 - oak.s && oak.x < x1 + oak.s) order.push({ y: oak.y, oak: 1 });
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.qst === 'wait' || p.qst === 'held' || p.qx < x0 || p.qx > x1) continue;
    order.push({ y: p.qy, pony: p });
  }
  for (i = 0; i < homeBunnies.length; i++) {
    var b = homeBunnies[i];
    if (b.qx === undefined || b.qx < x0 || b.qx > x1) continue;
    order.push({ y: b.qy + (pasBunRide && pasBunRide.b === i ? 0.6 : 0), bunny: b });
  }
  for (i = 0; i < pasApples.length; i++) if (!pasApples[i].held) order.push({ y: pasApples[i].rest ? pasApples[i].y : pasApples[i].gy, apple: pasApples[i] });
  if (pasPrin.mode === 'foot') order.push({ y: pasPrin.y, prin: 1 });
  if (pasGhostRun) order.push({ y: pasGhostRun.g.qy, ghost: 1 });
  else order.push({ y: pasStarPonyIdlePos().y, ghostIdle: 1 });
  order.sort(function (a, b2) { return a.y - b2.y; });
  for (i = 0; i < order.length; i++) {
    o = order[i];
    if (o.obs !== undefined) pasDrawObs(c, o.obs);
    else if (o.tree) pasDrawTree(c);
    else if (o.oak) pasDrawOak(c);
    else if (o.pony) pasDrawPony(c, o.pony);
    else if (o.bunny) pasDrawBunny(c, o.bunny);
    else if (o.apple) pasDrawApple(c, o.apple);
    else if (o.prin) pasDrawPrinFoot(c);
    else if (o.ghost) pasDrawStarPony(c, pasGhostRun.g, pasGhostRun.lost ? Math.max(0, pasGhostRun.wait / 3) : 1);
    else if (o.ghostIdle) pasDrawStarPonyIdle(c);
  }
  // Sade, pilvi, perhoset ja tehosteet
  pasDrawCloud(c);
  for (i = 0; i < pasButterflies.length; i++) pasDrawButterfly(c, pasButterflies[i]);
  pasDrawFxWorld(c);
  if (pasRider && pasIdleT > 3 && !pasRound && !pasRecord) pasDrawSteerHint(c);
  // Sormessa kulkevat: poni, prinsessa, omena
  var d = homeDrag;
  if (d && d.pas === 'pony') pasDrawPony(c, d.pony);
  if (pasPrin.mode === 'held') pasDrawPrinHeld(c);
  if (d && d.pas === 'apple') pasDrawApple(c, d.apple);
  drawParticlesLayerAbs(c);
  c.restore();
  pasDrawHud(c);
}

function pasDrawRainbow(c) {
  var a = Math.min(1, pasCloud.bowT / 2, (12 - pasCloud.bowT) / 1.5), cx = pasCloud.x - pasCam * 1, cy = pasTop() + viewH * 0.05, r = viewH * 0.6, i;
  c.save();
  c.globalAlpha = 0.55 * Math.max(0, a);
  c.lineCap = 'butt';
  for (i = 0; i < RAINBOW_COLORS.length; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.lineWidth = viewH * 0.022;
    c.beginPath(); c.arc(cx, cy, r - i * viewH * 0.021, Math.PI, 0); c.stroke();
  }
  c.restore();
}

function pasDrawFence(c) {
  var h = viewH, top = pasTop(), x, x0 = Math.max(0, Math.floor((pasCam - h * 0.3) / (h * 0.32)) * h * 0.32), x1 = pasCam + viewW + h * 0.3, g = pasGate();
  var col = '#fff6ec', line = '#a89a8a', lw = Math.max(1, h * 0.003);
  c.fillStyle = col;
  c.strokeStyle = line;
  c.lineWidth = lw;
  // Puomit (portin kohdalla aukko)
  var gl = g.x - g.w * 0.5, gr = g.x + g.w * 0.5;
  var rails = [top - h * 0.06, top - h * 0.03];
  for (var k = 0; k < 2; k++) {
    if (pasCam - h * 0.3 < gl) { c.beginPath(); c.rect(Math.max(0, pasCam - h * 0.3), rails[k], gl - Math.max(0, pasCam - h * 0.3), h * 0.012); c.fill(); c.stroke(); }
    if (x1 > gr) { c.beginPath(); c.rect(Math.max(gr, pasCam - h * 0.3), rails[k], x1 - Math.max(gr, pasCam - h * 0.3), h * 0.012); c.fill(); c.stroke(); }
  }
  for (x = x0; x < x1; x += h * 0.32) {
    if (Math.abs(x - g.x) < g.w * 0.6) continue;
    c.beginPath(); c.rect(x - h * 0.008, top - h * 0.08, h * 0.016, h * 0.085); c.fill(); c.stroke();
  }
}

// Portti talliin: pylväät, auki kääntynyt säleportti ja hevosenkenkäkyltti
function pasDrawGate(c) {
  var g = pasGate(), h = viewH, top = pasTop(), lw = Math.max(1.5, h * 0.004), i;
  if (g.x < pasCam - h * 0.5 || g.x > pasCam + viewW + h * 0.5) return;
  // Hiekkapolku portilta niitylle
  c.fillStyle = '#ecd6a4';
  c.beginPath();
  c.moveTo(g.x - g.w * 0.45, top);
  c.quadraticCurveTo(g.x - g.w * 0.2, top + h * 0.1, g.x - g.w * 0.05, top + h * 0.2);
  c.lineTo(g.x + g.w * 0.45, top + h * 0.2);
  c.quadraticCurveTo(g.x + g.w * 0.4, top + h * 0.1, g.x + g.w * 0.45, top);
  c.closePath();
  c.fill();
  artGlow(c, g.x, top - h * 0.05, g.w * 0.9, '#fff0b4', 0.25 + Math.sin(globalT * 3) * 0.08);
  artLimb(c, g.x - g.w * 0.5, top + h * 0.005, g.x - g.w * 0.5, top - h * 0.12, h * 0.02, '#a9743f', '#5a3a1e');
  artLimb(c, g.x + g.w * 0.5, top + h * 0.005, g.x + g.w * 0.5, top - h * 0.12, h * 0.02, '#a9743f', '#5a3a1e');
  // Auki oleva portinpuolisko (kääntynyt kohti katsojaa)
  var hx = g.x + g.w * 0.5, ex = hx + g.w * 0.28, ey = top + h * 0.06;
  c.beginPath(); c.moveTo(hx, top - h * 0.085); c.lineTo(ex, ey - h * 0.1); c.lineTo(ex, ey - h * 0.01); c.lineTo(hx, top - h * 0.005); c.closePath();
  artFillPath(c, '#d9a066', top - h * 0.1, ey, h * 0.05, { lineColor: '#5a3a1e', line: lw });
  c.strokeStyle = '#8a5a30';
  c.lineWidth = lw;
  for (i = 1; i < 4; i++) { var fx = hx + (ex - hx) * i / 4; c.beginPath(); c.moveTo(fx, top - h * 0.085 + (ey - h * 0.1 - top + h * 0.085) * i / 4); c.lineTo(fx, top - h * 0.005 + (ey - h * 0.01 - top + h * 0.005) * i / 4); c.stroke(); }
  // Kaari ja kyltti
  c.strokeStyle = '#a9743f';
  c.lineWidth = h * 0.014;
  c.beginPath(); c.moveTo(g.x - g.w * 0.5, top - h * 0.12); c.quadraticCurveTo(g.x, top - h * 0.17, g.x + g.w * 0.5, top - h * 0.12); c.stroke();
  homeRoomSign(c, STABLE_ROOM, g.x, top - h * 0.175, h * 0.05);
}

function pasDrawPond(c) {
  var p = pasPond(), h = viewH, i, pads, fr, k;
  if (p.x + p.rx < pasCam - h * 0.1 || p.x - p.rx > pasCam + viewW + h * 0.1) return;
  // Kaislat ja kivireuna
  artBlob(c, p.x, p.y + p.ry * 0.12, p.rx * 1.06, p.ry * 1.18, '#9aa8a0', { lineColor: '#6a7a72', line: Math.max(1, h * 0.003) });
  c.beginPath();
  if (c.ellipse) c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); else c.arc(p.x, p.y, p.rx, 0, Math.PI * 2);
  var wg = c.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry);
  wg.addColorStop(0, '#9fe0ff');
  wg.addColorStop(1, '#4fa8e0');
  c.fillStyle = wg;
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 3; i++) {
    var sx = p.x - p.rx * 0.5 + i * p.rx * 0.4 + Math.sin(globalT + i) * h * 0.01;
    c.beginPath(); c.moveTo(sx, p.y - p.ry * 0.3 + i * p.ry * 0.25); c.lineTo(sx + h * 0.05, p.y - p.ry * 0.3 + i * p.ry * 0.25); c.stroke();
  }
  // Lumpeet
  pads = pasLilyPads();
  for (i = 0; i < pads.length; i++) {
    artBlob(c, pads[i].x, pads[i].y, h * 0.03, h * 0.012, '#5fbf55', { lineColor: '#3a8a3a', line: 1 });
    if (i !== 1) drawFlower(c, pads[i].x + h * 0.01, pads[i].y - h * 0.006, h * 0.005, '#ff9ec4');
  }
  // Sammakko lumpeella (hyppää kolmannesta napautuksesta)
  fr = pasFrog;
  var a = pads[fr.pad], from = pads[fr.from], fx, fy;
  if (fr.jumpT > 0) {
    k = 1 - fr.jumpT / 0.5;
    fx = from.x + (a.x - from.x) * k;
    fy = from.y + (a.y - from.y) * k - Math.sin(k * Math.PI) * h * 0.08;
  } else { fx = a.x; fy = a.y; }
  artBlob(c, fx, fy - h * 0.012, h * 0.018, h * 0.013, '#6fd66f', { lineColor: '#3a8a3a', line: 1, hi: 0.3 });
  artCircle(c, fx - h * 0.008, fy - h * 0.026, h * 0.006, '#ffffff', { lineColor: '#3a8a3a', line: 1 });
  artCircle(c, fx + h * 0.008, fy - h * 0.026, h * 0.006, '#ffffff', { lineColor: '#3a8a3a', line: 1 });
  c.fillStyle = '#2a2430';
  c.beginPath(); c.arc(fx - h * 0.008, fy - h * 0.026, h * 0.003, 0, Math.PI * 2); c.arc(fx + h * 0.008, fy - h * 0.026, h * 0.003, 0, Math.PI * 2); c.fill();
  // Kala hyppää
  if (pasFish.jumpT > 0) {
    k = 1 - pasFish.jumpT / 0.9;
    var kx = pasFish.x + pasFish.dir * k * h * 0.08, ky = p.y - Math.sin(k * Math.PI) * h * 0.07;
    c.save(); c.translate(kx, ky); c.rotate(pasFish.dir * (k - 0.5) * 2.4); c.scale(pasFish.dir, 1);
    artBlob(c, 0, 0, h * 0.016, h * 0.008, '#ffa040', { lineColor: '#c96a1a', line: 1 });
    c.fillStyle = '#ffa040';
    c.beginPath(); c.moveTo(-h * 0.014, 0); c.lineTo(-h * 0.026, -h * 0.008); c.lineTo(-h * 0.026, h * 0.008); c.closePath(); c.fill();
    c.restore();
  }
  // Kaislat
  for (i = 0; i < 5; i++) {
    var rx = p.x + p.rx * (0.7 + i * 0.07), ry = p.y + p.ry * (0.4 - i * 0.18);
    artLimb(c, rx, ry, rx + Math.sin(globalT * 1.5 + i) * h * 0.004, ry - h * (0.05 + (i % 2) * 0.02), h * 0.004, '#4fa04a', false);
    artBlob(c, rx + Math.sin(globalT * 1.5 + i) * h * 0.004, ry - h * (0.05 + (i % 2) * 0.02), h * 0.004, h * 0.012, '#8a5a30', { line: false });
  }
}

function pasDrawMud(c) {
  var m = pasMud(), h = viewH, i;
  if (m.x + m.rx < pasCam - h * 0.1 || m.x - m.rx > pasCam + viewW + h * 0.1) return;
  artBlob(c, m.x, m.y, m.rx, m.ry, '#9a6a3e', { lineColor: '#6a4424', line: Math.max(1, h * 0.003), shadeTo: '#7a5030' });
  c.fillStyle = 'rgba(70,40,20,0.35)';
  for (i = 0; i < 6; i++) {
    c.beginPath(); c.arc(m.x - m.rx * 0.6 + i * m.rx * 0.24, m.y + Math.sin(i * 2.1) * m.ry * 0.4, h * (0.006 + (i % 3) * 0.003), 0, Math.PI * 2); c.fill();
  }
  if (pasMudBlub > 0 || Math.sin(globalT * 1.3) > 0.95) {
    var bk = pasMudBlub > 0 ? 1 - pasMudBlub / 0.6 : 0.5;
    artCircle(c, m.x + m.rx * 0.2, m.y - bk * h * 0.012, h * 0.008 * (1 + bk), 'rgba(170,120,70,0.9)', { lineColor: '#6a4424', line: 1 });
  }
}

function pasDrawClover(c, i) {
  var p = pasCloverPos(i), h = viewH, k = pasK(p.y), s = h * 0.011 * k, lucky = i === pasLuckyIdx(), n = lucky ? 4 : 3, j, spin = 0, found = lucky && pasCloverDay === stabDay();
  if (p.x < pasCam - h * 0.1 || p.x > pasCam + viewW + h * 0.1) return;
  for (j = 0; j < pasCloverSpin.length; j++) if (pasCloverSpin[j].i === i) spin = pasCloverSpin[j].t * 10;
  if (found) artGlow(c, p.x, p.y - s, s * 5, '#fff2a0', 0.4 + Math.sin(globalT * 3) * 0.15);
  // Kaksi tavallista apilaa vieressä ja keskellä tarkasteltava (nelilehtinen = päivän onni)
  var spots = [[-1.8, 0.4, 3], [1.9, 0.6, 3], [0, 0, n]];
  for (var q = 0; q < spots.length; q++) {
    var cx = p.x + spots[q][0] * s, cy = p.y + spots[q][1] * s, nn = spots[q][2];
    artLimb(c, cx, cy + s * 0.8, cx, cy - s * 0.4, s * 0.25, '#3a8a3a', false);
    for (j = 0; j < nn; j++) {
      var a = (q === 2 ? spin : 0) + j / nn * Math.PI * 2 - Math.PI / 2;
      artCircle(c, cx + Math.cos(a) * s * 0.75, cy - s * 0.6 + Math.sin(a) * s * 0.75, s * 0.62, q === 2 && lucky ? '#5fcf5f' : '#6fc464', { lineColor: '#2f7a2f', line: 1 });
    }
  }
}

function pasDrawRing(c, r) {
  if (r.age < 0) return;
  var k = r.age / 1.2, h = viewH, rr = h * (r.small ? 0.012 : 0.03) * (0.3 + k * 1.5);
  c.strokeStyle = r.mud ? 'rgba(90,58,30,' + (0.6 * (1 - k)) + ')' : 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')';
  c.lineWidth = Math.max(1, h * 0.003);
  c.beginPath();
  if (c.ellipse) c.ellipse(r.x, r.y, rr, rr * 0.35, 0, 0, Math.PI * 2); else c.arc(r.x, r.y, rr, 0, Math.PI * 2);
  c.stroke();
}

// Este: tolpat takana ja edessä, puomit, numerolippu
function pasDrawObs(c, n) {
  var ob = pasObs(n), h = viewH, o = pasCourse[n], bx = ob.x + ob.L, by = ob.y - ob.d, fx = ob.x - ob.L, fy = ob.y + ob.d;
  var kb = pasK(by), kf = pasK(fy), wig = ob.wig > 0 ? Math.sin(ob.wig * 30) * h * 0.004 : 0, lw = Math.max(1.5, h * 0.0035), i;
  var col = n ? PAS_FLAG[n - 1] : '#ffe27a', next = pasRound && pasRound.next === n, dragged = homeDrag && homeDrag.pas === 'obst' && homeDrag.n === n;
  bx += wig; fx += wig;
  if (dragged) { artShadow(c, ob.x, ob.y + h * 0.01, h * 0.16, h * 0.06, 0.25); c.save(); c.translate(0, -h * 0.02); }
  if (next) artGlow(c, ob.x, ob.y - h * 0.04, h * 0.2, col, 0.35 + Math.sin(globalT * 6) * 0.15);
  if (ob.kind === 'arch') { pasDrawArch(c, ob, bx, by, fx, fy, kb, kf); if (dragged) c.restore(); return; }
  var phB = h * 0.075 * kb, phF = h * 0.075 * kf;
  if (ob.kind === 'flower') { phB *= 0.75; phF *= 0.75; }
  // Maavarjo viivan suunnassa
  c.strokeStyle = 'rgba(20,60,20,0.18)';
  c.lineWidth = h * 0.02;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(bx, by + h * 0.004); c.lineTo(fx, fy + h * 0.004); c.stroke();
  if (ob.kind === 'water') {
    // Vesioja ja pensasaita
    c.beginPath();
    c.moveTo(bx - h * 0.04, by); c.lineTo(bx + h * 0.035, by); c.lineTo(fx + h * 0.045, fy); c.lineTo(fx - h * 0.05, fy); c.closePath();
    var wg = c.createLinearGradient(0, by, 0, fy);
    wg.addColorStop(0, '#9fe0ff'); wg.addColorStop(1, '#4fa8e0');
    c.fillStyle = wg; c.fill();
    c.strokeStyle = '#3a7ab8'; c.lineWidth = lw; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    for (i = 0; i < 3; i++) { var t = (i + 0.5) / 3, wx = bx + (fx - bx) * t + Math.sin(globalT * 2 + i) * h * 0.006, wy = by + (fy - by) * t; c.beginPath(); c.moveTo(wx - h * 0.015, wy); c.lineTo(wx + h * 0.015, wy); c.stroke(); }
    for (i = 0; i < 5; i++) { var tt = i / 4; artCircle(c, bx + (fx - bx) * tt + h * 0.045, by + (fy - by) * tt - h * 0.012 * pasK(by + (fy - by) * tt), h * 0.016 * pasK(by + (fy - by) * tt), '#5fbf55', { lineColor: '#3a8a3a', line: 1 }); }
    pasDrawPost(c, bx + h * 0.045, by, h * 0.045 * kb, col);
    pasDrawPost(c, fx + h * 0.045, fy, h * 0.045 * kf, col);
    pasDrawFlag(c, n, fx + h * 0.045, fy - h * 0.045 * kf, kf);
    if (dragged) c.restore();
    return;
  }
  if (ob.kind === 'log') {
    var lt = h * 0.032;
    artLimb(c, bx, by - lt * kb * 0.6, fx, fy - lt * kf * 0.6, lt * (kb + kf) * 0.5, '#a9743f', '#5e3b1c');
    c.strokeStyle = 'rgba(94,59,28,0.5)';
    c.lineWidth = lw;
    for (i = 1; i < 4; i++) { var lx = bx + (fx - bx) * i / 4, ly = by + (fy - by) * i / 4 - lt * 0.6; c.beginPath(); c.moveTo(lx - h * 0.01, ly - h * 0.008); c.lineTo(lx + h * 0.008, ly + h * 0.006); c.stroke(); }
    artCircle(c, fx, fy - lt * kf * 0.6, lt * kf * 0.55, '#e8c48a', { lineColor: '#5e3b1c' });
    c.strokeStyle = '#a9743f';
    c.beginPath(); c.arc(fx, fy - lt * kf * 0.6, lt * kf * 0.28, 0, Math.PI * 2); c.stroke();
    // Sienet ja lehti tukin päällä
    artCircle(c, bx + (fx - bx) * 0.3, by + (fy - by) * 0.3 - lt * 1.2, h * 0.008, '#ff5f7e', { lineColor: '#a83a4a', line: 1 });
    pasDrawPost(c, fx - h * 0.02, fy, h * 0.05 * kf, col);
    pasDrawFlag(c, n, fx - h * 0.02, fy - h * 0.05 * kf, kf);
    if (dragged) c.restore();
    return;
  }
  var sets = ob.kind === 'oxer' ? [-h * 0.022, h * 0.022] : [0];
  for (var si = 0; si < sets.length; si++) {
    var ox = sets[si];
    pasDrawPost(c, bx + ox, by, phB, col);
    var heights = ob.kind === 'flower' ? [0.6] : [0.45, 0.85];
    for (i = 0; i < heights.length; i++) {
      var top = i === heights.length - 1;
      if (top && ob.down > 0 && ob.kind !== 'flower') {
        // Pudonnut puomi maassa
        pasDrawRail(c, bx + ox + h * 0.01, by + h * 0.004, fx + ox - h * 0.015, fy + h * 0.004, col, h * 0.011 * (kb + kf) * 0.5);
        continue;
      }
      pasDrawRail(c, bx + ox, by - phB * heights[i], fx + ox, fy - phF * heights[i], col, h * 0.011 * (kb + kf) * 0.5);
    }
    pasDrawPost(c, fx + ox, fy, phF, col);
  }
  if (ob.kind === 'flower') {
    for (i = 0; i < 3; i++) {
      var ft = (i + 0.5) / 3, fxx = bx + (fx - bx) * ft, fyy = by + (fy - by) * ft, fk = pasK(fyy);
      artRoundRect(c, fxx - h * 0.025 * fk, fyy - h * 0.022 * fk, h * 0.05 * fk, h * 0.022 * fk, h * 0.005, '#c98b4a', { lineColor: '#7a5030', line: 1 });
      for (var fl = 0; fl < 3; fl++) drawFlower(c, fxx + (fl - 1) * h * 0.015 * fk, fyy - h * 0.028 * fk, h * 0.006 * fk, ['#ff7bac', '#ffd24f', '#ffffff'][(fl + i) % 3]);
    }
  }
  pasDrawFlag(c, n, fx + sets[sets.length - 1], fy - phF, kf);
  if (dragged) c.restore();
}
function pasDrawPost(c, x, y, ph, col) {
  var h = viewH, w = h * 0.012;
  artRoundRect(c, x - w / 2, y - ph, w, ph, w * 0.3, '#ffffff', { lineColor: '#8a7a9a', line: 1 });
  c.fillStyle = col;
  c.fillRect(x - w / 2, y - ph * 0.7, w, ph * 0.12);
  c.fillRect(x - w / 2, y - ph * 0.35, w, ph * 0.12);
}
function pasDrawRail(c, x0, y0, x1, y1, col, w) {
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(60,40,70,0.55)';
  c.lineWidth = w + 2;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  if (c.setLineDash) {
    c.setLineDash([w * 1.6, w * 1.6]);
    c.strokeStyle = col;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.setLineDash([]);
  }
}
// Numerolippu etutolpan päässä: suoritettu = rasti, seuraava pomppii
function pasDrawFlag(c, n, x, y, k) {
  var h = viewH, o = pasCourse[n], col = PAS_FLAG[n - 1], s = h * 0.035 * k, next = pasRound && pasRound.next === n, ok = o.ok;
  var bob = next ? Math.abs(Math.sin(globalT * 5)) * h * 0.02 : 0, i;
  artLimb(c, x, y, x, y - s * 1.6, Math.max(1.5, s * 0.08), '#8a7a9a', false);
  var wv = Math.sin(globalT * 4 + n) * s * 0.1;
  c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x + s * 1.1, y - s * 1.35 + wv); c.lineTo(x, y - s * 1.0); c.closePath();
  artFillPath(c, col, y - s * 1.6, y - s, s * 0.5, { lineColor: artShade(col, -0.35), line: 1 });
  // Numeropallo
  var nx = x, ny = y - s * 2.3 - bob, nr = s * (next ? 0.7 : 0.58);
  if (next) artGlow(c, nx, ny, nr * 2.6, col, 0.6);
  artCircle(c, nx, ny, nr, ok ? col : '#ffffff', { lineColor: artShade(col, -0.35), line: Math.max(1.5, h * 0.003) });
  if (ok) {
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, nr * 0.28);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(nx - nr * 0.45, ny); c.lineTo(nx - nr * 0.1, ny + nr * 0.35); c.lineTo(nx + nr * 0.5, ny - nr * 0.4); c.stroke();
  } else {
    c.fillStyle = artShade(col, -0.35);
    c.font = 'bold ' + Math.round(nr * 1.45) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), nx, ny + nr * 0.06);
  }
  // Napautuslaskenta: pisteet syttyvät yksi kerrallaan
  if (o.count) {
    var shown = Math.min(o.count, Math.floor(o.countT / 0.28) + 1);
    for (i = 0; i < shown; i++) {
      var dx = (i - (o.count - 1) / 2) * nr * 1.1;
      artCircle(c, nx + dx, ny - nr * 1.8, nr * 0.38, col, { lineColor: '#ffffff', line: 1.5 });
    }
  }
}

// Lähtö- ja maalikaari: ilmapallopylväät, sateenkaarikaari, ruutulippu ja ennätystaulu
function pasDrawArch(c, ob, bx, by, fx, fy, kb, kf) {
  var h = viewH, i, k, finish = pasRound && pasRound.next > 5, lw = Math.max(1.5, h * 0.0035);
  var hb = h * 0.2 * kb, hf = h * 0.2 * kf;
  // Ruutuviiva maassa
  for (i = 0; i < 8; i++) {
    var t0 = i / 8, t1 = (i + 1) / 8;
    c.fillStyle = i % 2 ? '#ffffff' : '#3a3450';
    c.beginPath();
    c.moveTo(bx + (fx - bx) * t0 - h * 0.008, by + (fy - by) * t0); c.lineTo(bx + (fx - bx) * t1 - h * 0.008, by + (fy - by) * t1);
    c.lineTo(bx + (fx - bx) * t1 + h * 0.008, by + (fy - by) * t1); c.lineTo(bx + (fx - bx) * t0 + h * 0.008, by + (fy - by) * t0);
    c.closePath(); c.fill();
  }
  if (finish) artGlow(c, ob.x, ob.y - h * 0.1, h * 0.3, '#fff2a0', 0.45 + Math.sin(globalT * 6) * 0.2);
  // Ennätystaulu takapylvään vieressä
  pasDrawRecordBoard(c, bx + h * 0.1, by - h * 0.005, kb);
  // Lippunauha pylväiden latvojen välillä (riippuu perspektiivissä)
  var tx0 = bx, ty0 = by - hb, tx1 = fx, ty1 = fy - hf, mx = (tx0 + tx1) / 2, my = (ty0 + ty1) / 2 + h * 0.035;
  c.strokeStyle = '#8a7a9a';
  c.lineWidth = Math.max(1.5, h * 0.003);
  c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(mx, my, tx1, ty1); c.stroke();
  var np = 7, sway = Math.sin(globalT * 3) * h * 0.003;
  for (i = 0; i < np; i++) {
    var ta = (i + 0.15) / np, tb2 = (i + 0.85) / np, tm = (ta + tb2) / 2;
    var ax = (1 - ta) * (1 - ta) * tx0 + 2 * (1 - ta) * ta * mx + ta * ta * tx1, ay = (1 - ta) * (1 - ta) * ty0 + 2 * (1 - ta) * ta * my + ta * ta * ty1;
    var bxp = (1 - tb2) * (1 - tb2) * tx0 + 2 * (1 - tb2) * tb2 * mx + tb2 * tb2 * tx1, byp = (1 - tb2) * (1 - tb2) * ty0 + 2 * (1 - tb2) * tb2 * my + tb2 * tb2 * ty1;
    var cxp = (1 - tm) * (1 - tm) * tx0 + 2 * (1 - tm) * tm * mx + tm * tm * tx1, cyp = (1 - tm) * (1 - tm) * ty0 + 2 * (1 - tm) * tm * my + tm * tm * ty1;
    var pl = h * 0.03 * pasK(cyp + h * 0.1);
    c.fillStyle = PAS_FLAG[i % PAS_FLAG.length];
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bxp, byp); c.lineTo(cxp + sway, cyp + pl); c.closePath(); c.fill();
  }
  // Ilmapallopylväät
  var cols = ['#ff7bac', '#ffd24f', '#5fa8ff', '#6fd66f', '#c9a0ff'];
  var cs = [[bx, by, hb, kb], [fx, fy, hf, kf]];
  for (k = 0; k < 2; k++) {
    var px = cs[k][0], py = cs[k][1], ph = cs[k][2], pk = cs[k][3], n = 6;
    for (i = 0; i < n; i++) {
      var r = h * 0.017 * pk, yy = py - r - i * (ph - r) / (n - 1), sw = Math.sin(globalT * 2 + i + k) * h * 0.002;
      artCircle(c, px + sw + (i % 2 ? r * 0.3 : -r * 0.3), yy, r, cols[(i + k * 2) % cols.length], { lineColor: 'rgba(80,60,100,0.5)', line: 1, hi: 0.4 });
    }
  }
  // Maalilippu heiluu, kun kaikki esteet on hypätty
  if (finish) {
    var fx2 = fx - h * 0.04, fy2 = fy - hf - h * 0.04;
    artLimb(c, fx2, fy2 + h * 0.05, fx2, fy2 - h * 0.05, h * 0.006, '#8a7a9a', false);
    for (i = 0; i < 4; i++) for (k = 0; k < 3; k++) {
      c.fillStyle = (i + k) % 2 ? '#ffffff' : '#3a3450';
      c.fillRect(fx2 + i * h * 0.012, fy2 - h * 0.05 + k * h * 0.012 + Math.sin(globalT * 8 + i) * h * 0.003, h * 0.012, h * 0.012);
    }
  }
  // Vihje: kaaren läpi alkaa kierros (ratsastaessa ennen ensimmäistä kierrosta)
  if (pasRider && !pasRound && !pasRecord) drawHintArrow(c, (bx + fx) / 2, Math.min(ty0, ty1) - h * 0.1);
}
function pasDrawRecordBoard(c, x, y, k) {
  var h = viewH, w = h * 0.11 * k, bh = h * 0.07 * k, top = y - h * 0.09 * k - bh;
  artLimb(c, x, y, x, top + bh, h * 0.008, '#a9743f', '#5e3b1c');
  artRoundRect(c, x - w / 2, top, w, bh, h * 0.01, '#fff6ec', { lineColor: '#8a5a30' });
  if (pasRecord > 0 && pasGhost) {
    pasDrawTrophy(c, x - w * 0.27, top + bh * 0.82, bh * 0.75);
    c.fillStyle = '#7a3cb8';
    c.font = 'bold ' + Math.round(bh * 0.42) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(pasFmt(pasRecord), x + w * 0.16, top + bh * 0.52);
  } else {
    // Ei ennätystä: Tähtiponin pää ja tähti
    drawStabPonyShape(c, { k: 'pony', c: 0, m: 0, u: 1, ph: 0 }, x - w * 0.12, top + bh * 1.35, bh * 0.45, 1, { bow: -1, mud: 0, head: 0 });
    drawStar(c, x + w * 0.28, top + bh * 0.45, bh * 0.2, globalT, 0);
  }
}
function pasFmt(t) {
  var s = (Math.round(t * 10) / 10).toFixed(1);
  return s.replace('.', ',');
}
function pasDrawTrophy(c, x, y, s) {
  artRoundRect(c, x - s * 0.22, y - s * 0.16, s * 0.44, s * 0.16, s * 0.03, '#8a5a30', { lineColor: '#5e3b1c', line: 1 });
  artLimb(c, x, y - s * 0.16, x, y - s * 0.32, s * 0.08, '#ffd24f', '#c99a20');
  c.beginPath(); c.moveTo(x - s * 0.26, y - s * 0.78); c.lineTo(x + s * 0.26, y - s * 0.78); c.quadraticCurveTo(x + s * 0.24, y - s * 0.38, x, y - s * 0.34); c.quadraticCurveTo(x - s * 0.24, y - s * 0.38, x - s * 0.26, y - s * 0.78);
  artFillPath(c, '#ffd24f', y - s * 0.78, y - s * 0.34, s * 0.26, { lineColor: '#c99a20', hi: 0.4, line: 1 });
  c.strokeStyle = '#c99a20';
  c.lineWidth = Math.max(1.5, s * 0.05);
  c.beginPath(); c.arc(x - s * 0.28, y - s * 0.62, s * 0.1, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
  c.beginPath(); c.arc(x + s * 0.28, y - s * 0.62, s * 0.1, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
  drawStar(c, x, y - s * 0.58, s * 0.1, 0, 0);
}

function pasDrawTree(c) {
  var tr = pasTree(), h = viewH, x = tr.x, y = tr.y, s = tr.s, sh = pasTreeShake > 0 ? Math.sin(pasTreeShake * 25) * s * 0.03 : 0, i, left;
  artShadow(c, x, y + h * 0.01, s * 0.6, s * 0.1, 0.18);
  c.beginPath(); c.moveTo(x - s * 0.1, y); c.quadraticCurveTo(x - s * 0.06, y - s * 0.4, x - s * 0.08, y - s * 0.6); c.lineTo(x + s * 0.08, y - s * 0.6); c.quadraticCurveTo(x + s * 0.06, y - s * 0.4, x + s * 0.12, y); c.closePath();
  artFillPath(c, '#9c6b3f', y - s * 0.6, y, s * 0.1, {});
  c.save(); c.translate(sh, 0);
  var blobs = [[-0.35, -0.75, 0.36], [0.35, -0.75, 0.36], [0, -1.0, 0.45], [-0.2, -1.2, 0.3], [0.25, -1.18, 0.3]];
  for (i = 0; i < blobs.length; i++) artCircle(c, x + blobs[i][0] * s, y + blobs[i][1] * s, blobs[i][2] * s, '#6cc45c', i === 2 ? { hi: 0.3 } : {});
  // Puussa jäljellä olevat omenat (kultainen hohtaa, jos se on vielä löytämättä)
  left = Math.max(0, PAS_APPLES_DAY - (pasAppleDay === stabDay() ? pasApplesN : 0));
  var spots = [[-0.4, -0.8], [0.3, -0.7], [0.05, -1.1], [-0.15, -0.95], [0.45, -0.95], [-0.45, -1.05], [0.2, -1.3], [-0.05, -0.75]];
  for (i = 0; i < left && i < spots.length; i++) pasDrawAppleShape(c, x + spots[i][0] * s, y + spots[i][1] * s, h * 0.014, false);
  c.restore();
}
function pasDrawOak(c) {
  var o = pasOak(), h = viewH, x = o.x, y = o.y, s = o.s, sh = pasOakShake > 0 ? Math.sin(pasOakShake * 25) * s * 0.025 : 0, i;
  artShadow(c, x, y + h * 0.01, s * 0.7, s * 0.1, 0.18);
  c.beginPath(); c.moveTo(x - s * 0.16, y); c.quadraticCurveTo(x - s * 0.08, y - s * 0.35, x - s * 0.1, y - s * 0.6); c.lineTo(x + s * 0.1, y - s * 0.6); c.quadraticCurveTo(x + s * 0.08, y - s * 0.35, x + s * 0.18, y); c.closePath();
  artFillPath(c, '#8a5a30', y - s * 0.6, y, s * 0.12, {});
  // Pöllön kolo
  c.fillStyle = '#3a2418';
  c.beginPath(); if (c.ellipse) c.ellipse(x, y - s * 0.42, s * 0.05, s * 0.07, 0, 0, Math.PI * 2); else c.arc(x, y - s * 0.42, s * 0.05, 0, Math.PI * 2); c.fill();
  if (pasOwl.flyT <= 0) pasDrawOwl(c, x, y - s * 0.42, s * 0.05, pasOwl.eyesT > 0);
  c.save(); c.translate(sh, 0);
  var blobs = [[-0.4, -0.72, 0.38], [0.4, -0.72, 0.38], [0, -0.95, 0.5], [-0.25, -1.18, 0.32], [0.28, -1.15, 0.32]];
  for (i = 0; i < blobs.length; i++) artCircle(c, x + blobs[i][0] * s, y + blobs[i][1] * s, blobs[i][2] * s, '#4fa84a', i === 2 ? { hi: 0.25 } : {});
  c.restore();
  if (pasOwl.flyT > 0) {
    var k = 1 - pasOwl.flyT / 3, a = k * Math.PI * 2;
    pasDrawOwl(c, x - Math.sin(a) * s * 0.9, y - s * 0.9 - (1 - Math.cos(a)) * s * 0.35, s * 0.06, true, Math.sin(globalT * 20));
  }
}
function pasDrawOwl(c, x, y, s, awake, flap) {
  if (flap !== undefined) {
    artBlob(c, x - s * 0.9, y, s * 0.8, s * (0.3 + flap * 0.2), '#a07850', { lineColor: '#5a3a1e', line: 1 });
    artBlob(c, x + s * 0.9, y, s * 0.8, s * (0.3 + flap * 0.2), '#a07850', { lineColor: '#5a3a1e', line: 1 });
  }
  artBlob(c, x, y + s * 0.2, s * 0.8, s, '#b08a60', { lineColor: '#5a3a1e', line: 1 });
  if (awake) {
    artCircle(c, x - s * 0.35, y - s * 0.1, s * 0.32, '#fff6d8', { lineColor: '#5a3a1e', line: 1 });
    artCircle(c, x + s * 0.35, y - s * 0.1, s * 0.32, '#fff6d8', { lineColor: '#5a3a1e', line: 1 });
    c.fillStyle = '#2a2430';
    c.beginPath(); c.arc(x - s * 0.35, y - s * 0.1, s * 0.15, 0, Math.PI * 2); c.arc(x + s * 0.35, y - s * 0.1, s * 0.15, 0, Math.PI * 2); c.fill();
  } else {
    c.strokeStyle = '#5a3a1e';
    c.lineWidth = Math.max(1, s * 0.12);
    c.beginPath(); c.arc(x - s * 0.35, y - s * 0.15, s * 0.2, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(x + s * 0.35, y - s * 0.15, s * 0.2, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.fillStyle = '#ffb84f';
  c.beginPath(); c.moveTo(x - s * 0.1, y + s * 0.15); c.lineTo(x + s * 0.1, y + s * 0.15); c.lineTo(x, y + s * 0.35); c.closePath(); c.fill();
}

function pasDrawAppleShape(c, x, y, r, gold) {
  if (gold) artGlow(c, x, y, r * 3.2, '#fff2a0', 0.55 + Math.sin(globalT * 5) * 0.15);
  artCircle(c, x, y, r, gold ? '#ffd24f' : '#ff4f5e', { lineColor: gold ? '#c99a20' : '#a8202e', line: 1, hi: 0.4 });
  artLimb(c, x, y - r * 0.8, x + r * 0.15, y - r * 1.35, Math.max(1, r * 0.18), '#6a4424', false);
  artBlob(c, x + r * 0.45, y - r * 1.15, r * 0.4, r * 0.2, '#4fb356', { rot: -0.5, line: false });
}
function pasDrawApple(c, ap) {
  var h = viewH, r = h * 0.017 * pasK(ap.rest || ap.held ? ap.y : ap.gy), wob = ap.wob > 0 ? Math.abs(Math.sin(ap.wob * 15)) * h * 0.012 : 0;
  if (!ap.held) artShadow(c, ap.x, (ap.rest ? ap.y : ap.gy) + r * 0.8, r * 1.1, r * 0.3, 0.18);
  pasDrawAppleShape(c, ap.x, ap.y - r * 0.9 - wob, r, ap.gold);
}

function pasDrawBunny(c, b) {
  var h = viewH, k = pasK(b.qy), s = h * 0.042 * k, hop = b.hop * h * 0.02, x = b.qx, y = b.qy + (b.oy || 0);
  c.save();
  if (b.qdir < 0) { c.translate(x, 0); c.scale(-1, 1); x = 0; }
  drawBunny(c, x, y, s, hop, b.earT, false);
  if (b.bow >= 0) drawBow(c, x, y - hop - s * 1.45, s * 0.3, HOME_BOWS[b.bow]);
  c.restore();
}

function pasPonyChest(p) {
  var s = pasPonySize(p, p.qy);
  return { x: p.qx + p.qdir * s * 0.42, y: p.qy - p.qz - s * 1.02 };
}
function pasPonyOpts(p) {
  var v = p.qsp, rider = p === pasRider, rack = homeHas('saddlerack');
  var rearK = p.qrearT > 0 ? Math.min(1, Math.min(p.qrearT, 1.8 - p.qrearT) * 3) : 0;
  return {
    wph: p.qwph, speed: v > 0.42 ? 0.42 : (v > 0.05 ? 0.2 : 0), head: p.qhead, toss: p.qtoss, rear: rearK,
    mud: p.mud, shine: p.qshine > 0 ? 1 : 0, bow: p.bow, blink: Math.sin(globalT * 1.3 + p.qwph * 0.1 + (p.ph || 0)) > 0.985 ? 1 : 0,
    swish: p.qst === 'graze' && Math.sin(globalT * 0.8 + (p.ph || 0)) > 0.6, munch: p.qst === 'munch',
    saddle: rider || (pasBunRide && pasBunRide.p === p) ? STAB_SADDLES[rack ? (rack.lv || 0) % STAB_SADDLES.length : 0] : null
  };
}
function pasDrawPony(c, p) {
  var h = viewH, s = pasPonySize(p, p.qy), x = p.qx, y = p.qy, z = p.qz, o = pasPonyOpts(p), held = p.qst === 'held';
  artShadow(c, x, y + s * 0.02, s * 0.8, s * 0.16, 0.2 * (1 - Math.min(1, z / (h * 0.12)) * 0.5));
  if (p.qshine > 0 && p.qshine < 3 && p === pasRider) artGlow(c, x, y - s, s * 1.4, '#fff2a0', 0.25);
  c.save();
  if (p.qst === 'buck') {
    // Potku: takajalat ilmaan etujalkojen varassa
    var bk = pasBuckRot(p), pvx = x + p.qdir * s * 0.38;
    c.translate(pvx, y - z); c.rotate(p.qdir * 0.35 * bk); c.translate(-pvx, -(y - z));
  } else if (p.qst === 'roll') {
    // Kieriskely: makuulle ja selälleen jalat sätkien
    var rk = 1 - Math.max(0, p.qrollT) / 2.8, lie = Math.min(1, rk * 5, (1 - rk) * 5);
    var ang = p.qdir * lie * (1.7 + Math.sin(globalT * 7) * 0.7);
    c.translate(x, y - s * 0.45 * lie); c.rotate(ang); c.translate(-x, -(y - s * 0.45 * lie));
    o.speed = 0.42 * lie; o.wph = globalT * 16;
  } else if (held) {
    o.wph = globalT * 8; o.speed = 0.2;
    c.translate(x, y - z - s); c.rotate(Math.sin(globalT * 3) * 0.08); c.translate(-x, -(y - z - s));
  }
  drawStabPonyShape(c, p, x, y - z, s, p.qdir, o);
  c.restore();
  // Ruusuke suitsissa
  if (p.qros) {
    var ch = pasPonyChest(p);
    drawStabRosette(c, ch.x, ch.y + Math.sin(globalT * 3) * s * 0.01, s * 0.11, p.qros === 2 ? 1 : 0);
  }
  if (p === pasRider) pasDrawRiderPrincess(c, p);
  // Raahatessa prinsessaa ponit hehkuvat (kohteet)
  if (homeDrag && homeDrag.pas === 'prin' && homeDrag.moved && p.k === 'pony' && p.qst !== 'roll') artGlow(c, x, y - s, s * 1.3, '#fff2a0', 0.3 + Math.sin(globalT * 6) * 0.12);
}
function pasDrawRiderPrincess(c, p) {
  var seat = pasRiderSeat(p), u = seat.s * 0.024, x = seat.x, y = seat.y, pr = pasPrin, moving = p.qsp > 0.05;
  if (pr.hopT > 0) {
    var k = 1 - pr.hopT / 0.45;
    x = pr.hx + (x - pr.hx) * k;
    y = pr.hy + (y - pr.hy) * k - Math.sin(k * Math.PI) * viewH * 0.1;
  }
  if (p.qrearT > 0) y += seat.s * 0.1;
  c.save();
  c.translate(x, y);
  if (p.qdir < 0) c.scale(-1, 1);
  drawRiderPrincess(c, 0, 0, u, globalT, moving);
  if (pr.waveT > 0) {
    // Vilkutus vapaalla kädellä
    var wv = Math.sin(globalT * 14) * u * 4;
    artLimb(c, -u * 2, -u * 17, -u * 7 + wv, -u * 31, u * 3.2, SKIN, SKIN_LINE);
  }
  c.restore();
}
function pasDrawPrinFoot(c) {
  var pr = pasPrin, k = pasK(pr.y), s = viewH * 0.0029 * k;
  if (!pasRode) {
    artGlow(c, pr.x, pr.y - viewH * 0.09 * k, viewH * 0.12, '#fff2a0', 0.3 + Math.sin(globalT * 4) * 0.12);
    drawHintArrow(c, pr.x, pr.y - viewH * 0.26 * k);
    pasDrawMountHint(c);
  }
  drawPrincessFree(c, pr.x, pr.y, s, pr.dir, 0, false, globalT);
  if (pr.waveT > 0) {
    // Vihellysnuotti suun edessä
    c.globalAlpha = Math.min(1, pr.waveT);
    drawNote(c, { x: pr.x + pr.dir * s * 14, y: pr.y - s * 40, age: 0, life: 1, c: 1 });
    c.globalAlpha = 1;
  }
}
// Ensikertalaisen vihje: katkoviivakaari prinsessasta lähimmän ponin selkään
function pasDrawMountHint(c) {
  var pr = pasPrin, i, p, best = null, bd = 1e9, h = viewH;
  if (homeDrag) return;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.k !== 'pony' || p.qst === 'wait' || p.qst === 'roll') continue;
    var dd = Math.abs(p.qx - pr.x) + Math.abs(p.qy - pr.y);
    if (dd < bd) { bd = dd; best = p; }
  }
  if (!best || bd > viewW) return;
  var s = pasPonySize(best, best.qy), x0 = pr.x, y0 = pr.y - h * 0.12 * pasK(pr.y), x1 = best.qx, y1 = best.qy - best.qz - s * 1.15;
  var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - h * 0.12, ph = (globalT * 0.8) % 1;
  c.save();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.lineCap = 'round';
  if (c.setLineDash) { c.setLineDash([h * 0.012, h * 0.016]); c.lineDashOffset = -globalT * h * 0.05; }
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  if (c.setLineDash) c.setLineDash([]);
  c.restore();
  // Kulkeva pikkukruunu kaarella ja satula perillä
  var t = ph, qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
  artCircle(c, qx, qy, h * 0.012, '#ffd24f', { lineColor: '#d98a00', line: 1 });
  artGlow(c, x1, y1, s * 0.5, '#fff2a0', 0.5 + Math.sin(globalT * 6) * 0.2);
}
// Ohjausvihje: ratsastaja seisoo, eikä kierrosta ole ajettu — sormi ja renkaat kaaren suuntaan
function pasDrawSteerHint(c) {
  var r = pasRider, a = pasObs(0), h = viewH, dir = a.x >= r.qx ? 1 : -1;
  var x = r.qx + dir * h * 0.42, y = pasClampY(r.qy + (a.y - r.qy) * 0.4), k = (globalT * 1.2) % 1, i;
  for (i = 0; i < 2; i++) {
    var kk = (k + i * 0.5) % 1;
    c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - kk)) + ')';
    c.lineWidth = Math.max(2, h * 0.005);
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, h * (0.02 + kk * 0.06), h * (0.008 + kk * 0.024), 0, 0, Math.PI * 2); else c.arc(x, y, h * 0.04 * kk, 0, Math.PI * 2);
    c.stroke();
  }
  // Painava käsi (sormet alaspäin renkaiden keskelle)
  var hs = h * 0.032, press = Math.abs(Math.sin(globalT * 3)) * h * 0.012;
  drawHand(c, x, y - hs * 0.95 - h * 0.012 + press, hs);
}
function pasDrawPrinHeld(c) {
  var pr = pasPrin, k = pasK(pasClampY(pr.y)), s = viewH * 0.0029 * k;
  artShadow(c, pr.x, pasClampY(pr.y) + viewH * 0.005, s * 14, s * 4, 0.12);
  c.save();
  c.translate(pr.x, pr.y - s * 30);
  c.rotate(Math.sin(globalT * 4) * 0.12);
  c.translate(-pr.x, -(pr.y - s * 30));
  drawPrincessFree(c, pr.x, pr.y, s, pr.dir, globalT * 10, true, globalT);
  c.restore();
}

function pasDrawStarPony(c, g, alpha) {
  var h = viewH, s = pasPonySize(g, g.qy), x = g.qx, y = g.qy - g.qz;
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = 0.65 * alpha;
  artGlow(c, x, y - s * 0.9, s * 1.6, '#fff2a0', 0.5);
  drawStabPonyShape(c, g, x, y, s, g.qdir, { wph: g.qwph, speed: g.qsp > 0.42 ? 0.42 : (g.qsp > 0.05 ? 0.2 : 0), head: g.qsp > 0.42 ? -0.12 : 0, toss: g.qtoss, bow: -1, mud: 0, shine: 1 });
  c.restore();
  if (alpha > 0.5) drawStar(c, x, y - s * 2.1 + Math.sin(globalT * 4) * s * 0.06, s * 0.14, globalT * 2, 1);
}
function pasDrawStarPonyIdle(c) {
  var sp = pasStarPonyIdlePos(), g = { k: 'pony', c: 0, m: 0, u: 1, ph: 0, qx: sp.x, qy: sp.y, qz: 0, qdir: sp.dir, qwph: globalT * 6, qsp: 0, qtoss: 0 };
  if (sp.x < pasCam - viewH * 0.3 || sp.x > pasCam + viewW + viewH * 0.3) return;
  // Kutsuhyppy: pieni pompahdus ja pään heilautus
  if (pasInviteT > 4.8) { var k = (6 - pasInviteT) / 1.2; g.qz = Math.abs(Math.sin(k * Math.PI * 2)) * viewH * 0.04; g.qtoss = 1 - k; }
  else g.qz = Math.abs(Math.sin(globalT * 1.5)) > 0.97 ? viewH * 0.008 : 0;
  pasDrawStarPony(c, g, 0.85);
}

function pasDrawCloud(c) {
  var cl = pasCloud, h = viewH, x = cl.x, y = h * 0.17, s = h * 0.045, w = cl.wob > 0 ? 1 + Math.sin(cl.wob * 20) * 0.06 : 1, i;
  if (x < pasCam - h * 0.4 || x > pasCam + viewW + h * 0.4) return;
  for (i = 0; i < pasRain.length; i++) {
    var r = pasRain[i];
    c.strokeStyle = 'rgba(95,168,255,0.7)';
    c.lineWidth = Math.max(1, h * 0.003);
    c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x - h * 0.003, r.y + h * 0.025); c.stroke();
  }
  c.save();
  c.translate(x, y);
  c.scale(w, 2 - w);
  drawCloud(c, 0, 0, s, 0.95);
  if (cl.rainT > 0) { c.globalAlpha = 0.35; c.fillStyle = '#8a9ab8'; cloudShape(c, 0, 0, s); c.globalAlpha = 1; }
  // Pilven kasvot
  artEye(c, -s * 0.5, -s * 0.1, s * 0.16, 0, cl.rainT > 0);
  artEye(c, s * 0.5, -s * 0.1, s * 0.16, 0, cl.rainT > 0);
  artBlush(c, -s * 0.85, s * 0.15, s * 0.18);
  artBlush(c, s * 0.85, s * 0.15, s * 0.18);
  c.strokeStyle = '#7a8aa8';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.arc(0, s * 0.1, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
}
function pasDrawButterfly(c, bf) {
  var h = viewH, s = h * 0.013, fl = Math.abs(Math.sin(bf.t * 18)), x = bf.x, y = bf.y;
  if (x < pasCam - h * 0.1 || x > pasCam + viewW + h * 0.1) return;
  if (bf.loopT > 0) { var a = (1.2 - bf.loopT) / 1.2 * Math.PI * 2; x += Math.sin(a) * h * 0.06; y -= (1 - Math.cos(a)) * h * 0.05; }
  c.fillStyle = bf.c;
  c.beginPath();
  if (c.ellipse) { c.ellipse(x - s * 0.6 * fl, y, s * fl, s * 0.8, 0, 0, Math.PI * 2); c.ellipse(x + s * 0.6 * fl, y, s * fl, s * 0.8, 0, 0, Math.PI * 2); }
  else { c.arc(x - s * 0.5, y, s * 0.7, 0, Math.PI * 2); c.arc(x + s * 0.5, y, s * 0.7, 0, Math.PI * 2); }
  c.fill();
  c.fillStyle = '#4a3a5a';
  c.fillRect(x - s * 0.12, y - s * 0.6, s * 0.24, s * 1.2);
}

function pasDrawFxWorld(c) {
  var h = viewH, i, f, x, y, tt;
  for (i = 0; i < pasHearts.length; i++) {
    var ht = pasHearts[i];
    if (ht.age < 0) continue;
    c.globalAlpha = Math.max(0, 1 - ht.age / 1.4);
    c.fillStyle = '#ff5f7e';
    drawHeartShape(c, ht.x + Math.sin(ht.age * 5) * h * 0.008, ht.y - ht.age * h * 0.08, h * 0.016, true);
    c.globalAlpha = 1;
  }
  for (i = 0; i < pasNotes.length; i++) {
    f = pasNotes[i];
    if (f.age < 0) continue;
    if (f.bird) {
      c.strokeStyle = '#4a3a5a';
      c.lineWidth = Math.max(1.5, h * 0.004);
      var fl = Math.sin(f.age * 25) * h * 0.008;
      c.beginPath(); c.moveTo(f.x - h * 0.015, f.y - fl); c.quadraticCurveTo(f.x - h * 0.006, f.y - h * 0.008, f.x, f.y); c.quadraticCurveTo(f.x + h * 0.006, f.y - h * 0.008, f.x + h * 0.015, f.y - fl); c.stroke();
      continue;
    }
    drawNote(c, f);
  }
  for (i = 0; i < pasFly.length; i++) {
    f = pasFly[i];
    if (f.scr || f.t < 0) continue;
    tt = Math.min(1, f.t);
    var dst = pasPonyChest(f.pony);
    x = f.x0 + (dst.x - f.x0) * tt;
    y = f.y0 + (dst.y - f.y0) * tt - Math.sin(tt * Math.PI) * h * 0.15;
    drawStabRosette(c, x, y, h * (0.03 - tt * 0.018), f.g);
  }
}

// ---------- Käyttöliittymä ----------
function pasDrawHud(c) {
  var h = viewH, i, ar = pasArrows(), a, f, tt, x, y;
  // Reunanuolet
  for (i = 0; i < ar.length; i++) {
    a = ar[i];
    var pulse = 1 + Math.sin(globalT * 5) * 0.08, r = a.r * pulse;
    artCircle(c, a.x, a.y, r, '#ffffff', { lineColor: a.col, line: Math.max(2, h * 0.006) });
    c.fillStyle = a.col;
    c.beginPath();
    c.moveTo(a.x + a.dir * r * 0.95, a.y); c.lineTo(a.x + a.dir * r * 0.45, a.y - r * 0.45); c.lineTo(a.x + a.dir * r * 0.45, a.y + r * 0.45); c.closePath(); c.fill();
    if (a.kind === 'num') {
      c.fillStyle = artShade(a.col, -0.35);
      c.font = 'bold ' + Math.round(r * 0.9) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(a.n), a.x - a.dir * r * 0.2, a.y + r * 0.04);
    } else if (a.kind === 'arch') {
      for (var k = 0; k < 3; k++) { c.strokeStyle = PAS_FLAG[k * 2]; c.lineWidth = r * 0.12; c.beginPath(); c.arc(a.x - a.dir * r * 0.2, a.y + r * 0.3, r * (0.55 - k * 0.13), Math.PI, 0); c.stroke(); }
    } else {
      drawRiderPrincess(c, a.x - a.dir * r * 0.15, a.y + r * 0.75, r * 0.022, globalT, false);
    }
  }
  // Kierroksen kello ja esteiden järjestys
  if (pasRound) {
    var pw = h * 0.58, ph = h * 0.1, px = viewW / 2 - pw / 2, py = h * 0.025;
    artRoundRect(c, px, py, pw, ph, ph * 0.45, 'rgba(255,255,255,0.88)', { lineColor: '#c9a0ff', line: Math.max(2, h * 0.004), flat: true });
    pasDrawStopwatch(c, px + ph * 0.55, py + ph * 0.52, ph * 0.36, pasRound.t);
    c.fillStyle = '#7a3cb8';
    c.font = 'bold ' + Math.round(ph * 0.5) + 'px ' + UI_FONT;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(String(Math.floor(pasRound.t)), px + ph * 1.05, py + ph * 0.54);
    for (i = 1; i <= 5; i++) {
      var cx = px + ph * 2.15 + (i - 1) * ph * 0.62, cy = py + ph * 0.52, nx = pasRound.next === i, done = i < pasRound.next, col = PAS_FLAG[i - 1];
      var rr = ph * (nx ? 0.27 + Math.sin(globalT * 6) * 0.03 + (pasRound.nudge > 0 ? 0.05 : 0) : 0.22);
      if (nx) artGlow(c, cx, cy, rr * 2.3, col, 0.5);
      artCircle(c, cx, cy, rr, done ? col : (nx ? '#ffffff' : 'rgba(255,255,255,0.6)'), { lineColor: done || nx ? artShade(col, -0.3) : '#c8c0d8', line: Math.max(1.5, h * 0.003), flat: true });
      if (done) {
        c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(2, rr * 0.3); c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx - rr * 0.45, cy); c.lineTo(cx - rr * 0.1, cy + rr * 0.35); c.lineTo(cx + rr * 0.5, cy - rr * 0.4); c.stroke();
      } else {
        c.fillStyle = nx ? artShade(col, -0.35) : '#b8b0c8';
        c.font = 'bold ' + Math.round(rr * 1.3) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.fillText(String(i), cx, cy + rr * 0.06);
      }
    }
    // Maalikaari viimeisenä
    var ax = px + ph * 2.15 + 5 * ph * 0.62, arc = pasRound.next > 5;
    for (k = 0; k < 3; k++) {
      c.strokeStyle = arc ? PAS_FLAG[k * 2] : '#d8d0e4';
      c.lineWidth = ph * 0.06;
      c.beginPath(); c.arc(ax, py + ph * 0.7, ph * (0.3 - k * 0.07) * (arc ? 1 + Math.sin(globalT * 6) * 0.08 : 1), Math.PI, 0); c.stroke();
    }
  }
  // Voitto- tai tasakierroskortti
  if (pasBanner) pasDrawBanner(c, pasBanner);
  // Ilotulitus ja tähtien lento kukkaroon
  for (i = 0; i < pasFire.length; i++) {
    f = pasFire[i];
    if (f.t < 0) continue;
    c.globalAlpha = f.rocket ? 1 : Math.max(0, 1 - f.age / (f.life || 1));
    c.fillStyle = f.c;
    c.beginPath(); c.arc(f.x, f.y, h * (f.rocket ? 0.006 : (f.trail ? 0.003 : 0.005)), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  for (i = 0; i < pasFly.length; i++) {
    f = pasFly[i];
    if (!f.scr || f.t < 0) continue;
    tt = Math.min(1, f.t);
    x = f.x0 + (f.x1 - f.x0) * tt;
    y = f.y0 + (f.y1 - f.y0) * tt - Math.sin(tt * Math.PI) * h * 0.15;
    drawStar(c, x, y, h * 0.03, globalT * 3, 1);
  }
  drawStarBalance(c, viewH * 0.14, viewH * 0.065);
}
function pasDrawStopwatch(c, x, y, r, t) {
  artCircle(c, x, y, r, '#ffffff', { lineColor: '#7a3cb8', line: Math.max(2, r * 0.14) });
  artRoundRect(c, x - r * 0.18, y - r * 1.38, r * 0.36, r * 0.3, r * 0.08, '#7a3cb8', { line: false, flat: true });
  var a = (t % 60) / 60 * Math.PI * 2 - Math.PI / 2;
  c.strokeStyle = '#ff5f7e';
  c.lineWidth = Math.max(2, r * 0.12);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75); c.stroke();
}
function pasDrawBanner(c, bn) {
  var h = viewH, a = Math.min(1, bn.t * 3, (4.2 - bn.t) * 2), w = h * 0.62, bh = h * 0.22, x = viewW / 2 - w / 2, y = h * 0.14 + (1 - Math.min(1, bn.t * 3)) * -h * 0.1;
  c.save();
  c.globalAlpha = Math.max(0, a);
  artRoundRect(c, x, y, w, bh, h * 0.04, '#fff8fb', { lineColor: bn.kind === 'win' ? '#ffb300' : '#c9a0ff', line: Math.max(3, h * 0.006), flat: true });
  if (bn.kind === 'win') {
    var sc = 1 + Math.sin(globalT * 6) * 0.04;
    pasDrawTrophy(c, x + bh * 0.62, y + bh * 0.88, bh * 0.8 * sc);
    for (var i = 0; i < 5; i++) drawStar(c, x + w * (0.35 + i * 0.12), y + bh * 0.2 + Math.sin(globalT * 5 + i) * h * 0.006, h * 0.018, globalT * 2 + i, 1);
    pasDrawStopwatch(c, x + w * 0.45, y + bh * 0.6, bh * 0.16, bn.time);
    c.fillStyle = '#c97a00';
    c.font = 'bold ' + Math.round(bh * 0.34) + 'px ' + UI_FONT;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(pasFmt(bn.time), x + w * 0.56, y + bh * 0.62);
  } else {
    // Tähtiponi ehti ensin: oma aika ja Tähtiponin aika rinnakkain
    pasDrawStopwatch(c, x + w * 0.14, y + bh * 0.5, bh * 0.15, bn.time);
    c.fillStyle = '#7a3cb8';
    c.font = 'bold ' + Math.round(bh * 0.3) + 'px ' + UI_FONT;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(pasFmt(bn.time), x + w * 0.24, y + bh * 0.52);
    drawStabPonyShape(c, { k: 'pony', c: 0, m: 0, u: 1, ph: 0 }, x + w * 0.62, y + bh * 0.85, bh * 0.32, 1, { bow: -1, mud: 0, head: 0, shine: 1 });
    c.fillStyle = '#c97a00';
    c.fillText(pasFmt(bn.ghost), x + w * 0.74, y + bh * 0.52);
  }
  c.restore();
}

// Huoneen kyltti: aidattu niitty ja lippu
function pasSign(b, x, y, sh) {
  b.fillStyle = '#6fc464';
  b.beginPath(); b.arc(x, y + sh * 0.32, sh * 0.42, Math.PI, 0); b.fill();
  b.strokeStyle = '#a9743f';
  b.lineWidth = Math.max(1, sh * 0.06);
  b.beginPath();
  b.moveTo(x - sh * 0.4, y + sh * 0.12); b.lineTo(x + sh * 0.4, y + sh * 0.12);
  b.moveTo(x - sh * 0.4, y + sh * 0.24); b.lineTo(x + sh * 0.4, y + sh * 0.24);
  for (var i = 0; i < 4; i++) { b.moveTo(x - sh * 0.36 + i * sh * 0.24, y + sh * 0.02); b.lineTo(x - sh * 0.36 + i * sh * 0.24, y + sh * 0.3); }
  b.stroke();
  b.strokeStyle = '#8a7a9a';
  b.beginPath(); b.moveTo(x + sh * 0.1, y + sh * 0.05); b.lineTo(x + sh * 0.1, y - sh * 0.36); b.stroke();
  b.fillStyle = '#ff5a5a';
  b.beginPath(); b.moveTo(x + sh * 0.1, y - sh * 0.36); b.lineTo(x + sh * 0.38, y - sh * 0.27); b.lineTo(x + sh * 0.1, y - sh * 0.18); b.closePath(); b.fill();
}

// Linnakartan pienoiskuva: aidattu niitty kukkulalla, kaari ja laukkaavat ponit
function pasCastleThumb(c, r, lay) {
  var u = lay.u, gy = r.y + r.h * lay.fyRel, x0 = r.x, w = r.w, i, k;
  c.strokeStyle = '#fff6ec';
  c.lineWidth = Math.max(1, u * 0.004);
  for (k = 0; k < 2; k++) { c.beginPath(); c.moveTo(x0, gy - u * (0.02 + k * 0.012)); c.lineTo(x0 + w, gy - u * (0.02 + k * 0.012)); c.stroke(); }
  for (i = 0; i <= 8; i++) artLimb(c, x0 + i * w / 8, gy - u * 0.008, x0 + i * w / 8, gy - u * 0.04, u * 0.005, '#fff6ec', '#a89a8a');
  // Pieni kaari
  for (k = 0; k < 5; k++) {
    c.strokeStyle = PAS_FLAG[k];
    c.lineWidth = u * 0.004;
    c.beginPath(); c.arc(x0 + w * 0.7, gy + u * 0.03, u * (0.035 - k * 0.004), Math.PI, 0); c.stroke();
  }
  drawTree(c, x0 + w * 0.12, gy - u * 0.01, u * 0.07);
  // Ponit laukkaavat edestakaisin
  var n = Math.min(4, stabPonies.length);
  for (i = 0; i < n; i++) {
    var p = stabPonies[i], ph = globalT * 0.25 + i * 0.27, f = ph % 2, t = f < 1 ? f : 2 - f, dir = f < 1 ? 1 : -1;
    var px = x0 + w * (0.1 + t * 0.8), py = gy + u * (0.035 + (i % 2) * 0.025);
    drawStabPonyShape(c, p, px, py, u * (p.k === 'foal' ? 0.018 : 0.026), dir, { wph: globalT * 13 + i, speed: 0.42, head: -0.1, bow: p.bow, mud: 0 });
  }
}
