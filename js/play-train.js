'use strict';

// Junamatka (Kaukamaa, Maalaiskylä): pitkä ja helppo junakenttä. Pieni
// höyryjuna (veturi + kolme vaunua) puksuttaa itsestään pitkän maiseman läpi:
// pellot, silta joen yli, tuulimyllyt, tunneli, niitty, omenatarha ja
// iltaan hämärtyvä kylä. Prinsessa ajaa veturia.
// VAIHTEET (palaute 4.10.2026: juna oli "hiukan tylsä", lapsi lähinnä odotti):
// rata haarautuu viidesti kahdeksi raiteeksi. Yläraide nousee penkalle ja
// alaraide jatkuu suoraan; ne yhtyvät taas. Kummallakin haaralla on oma
// asemansa kuvakyltteineen (mansikka, porkkana, aurinko, omena, kala, kukka).
// Ennen haaraa on vaihdekyltti, jonka kahdessa nuolikyltissä näkyy, mihin
// asemaan kumpikin haara vie, ja sen juurella vaihdevipu. NAPAUTUS VIPUUN
// kääntää vaihteen heti (nuolikyltin napautus valitsee sen haaran): valittu
// nuoli hehkuu, vaihteen kieli liukuu ja raiteelle syttyvät nuolet. Vaihdetta
// voi kääntää edestakaisin, kunnes veturi ehtii vaihteelle.
// Eläinmatkustajien puhekuplassa on sen aseman kuva, jonne ne haluavat. Lapsi
// kääntää vaihteen oikealle haaralle ja napauttaa asemaa (kyltti, rakennus tai
// laituri), jolloin juna jarruttaa sille (ohitetulle, vielä näkyvälle asemalle
// juna peruuttaa). Perille tulleet hyppäävät pois (tähti ja ilo), ja laiturilla
// odottavat nousevat kyytiin. Uuden matkustajan määränpää arvotaan kyytiin
// noustessa niin, ettei samassa vaihteessa koskaan haluta kumpaankin haaraan:
// täydellisellä pelillä kaikki pääsevät perille.
// Ei sydämiä, ei aikarajaa eikä rangaistuksia. Väärä haara: matkustaja
// huiskuttaa ja odottaa seuraavaa samankuvaista asemaa (sellainen taataan
// myöhempään vaihteeseen). Ohi ajettu asema: matkustaja jää pois seuraavalla
// pysähdyksellä ja kävelee iloisena takaisin, ja laiturin odottaja juoksee
// junan perään. Pääteasemalla kaikki jäävät pois. Kultainen veturi, jos
// jokainen matka sujui ensimmäisellä kerralla.
// Tähdet: matalat napataan veturin savusta itsestään (haaroilla vain sillä
// raiteella, jota juna kulkee), korkeat vihellyksellä (napautus muualle kuin
// asemaan tai vaihteeseen = vihellys ja iso savupilvi). Viides vihellys tuo
// kuumailmapallon, josta pupu pudottaa tähtiä.
// Kaksi opastinta pysäyttää junan tehtävän ajaksi (reitti, maksu).

// Mitat: radan pituudet × viewH (koko maailma skaalautuu korkeuden mukaan),
// nopeudet × TRAIN_VU·viewH / s (16:10-ruudun leveys; kesto ei riipu
// kuvasuhteesta), junan ja maiseman mitat × viewH
var TRAIN_VU = 1.6;           // nopeusyksikkö × viewH
var TRAIN_V = 0.15;           // ajonopeus
var TRAIN_V_NEAR = 0.085;     // hiljennys, kun asema on edessä lähellä
var TRAIN_V_SW = 0.11;        // hiljennys vaihdekyltin näkyessä (aikaa katsoa kuvat ja kääntää vipu)
var TRAIN_V_BACK = 0.1;       // peruutuksen enimmäisnopeus
var TRAIN_ACC = 0.07;         // kiihdytys / s
var TRAIN_BRK = 0.11;         // jarrutus / s
var TRAIN_LEAD = 0.6;         // veturin keula ruudulla × viewW (vaihdekyltti näkyy ajoissa)
var TRAIN_GRACE = 0.55;       // ohitetulle asemalle voi palata, kun keula on enintään näin pitkällä × viewW
var TRAIN_TY = 0.8;           // runkoradan kiskojen yläpinta × viewH
var TRAIN_PLAT = 0.1;         // laiturin seisontataso kiskon alapuolella × viewH
var TRAIN_LOCO = 0.2;         // veturin pituus × viewH
var TRAIN_CARL = 0.15;        // vaunun pituus
var TRAIN_CGAP = 0.025;       // kytkimen väli
var TRAIN_CARS = 3;
var TRAIN_SEATS = 6;          // kaksi paikkaa vaunussa
var TRAIN_ANIMAL = 0.042;     // eläimen koko × viewH
var TRAIN_KINDS = ['cow', 'sheep', 'pig', 'hen', 'duck', 'bunny'];
var TRAIN_CAR_COLS = ['#5fa8ff', '#ffc94f', '#6fd66f'];
// Asemien kuvat: 0–5 haara-asemat, 6 pääteasema, 7 lähtöasema
var TRAIN_ICONS = [
  { id: 'berry', color: '#ff5a6a' },
  { id: 'carrot', color: '#ff9a3a' },
  { id: 'sun', color: '#ffc93a' },
  { id: 'apple', color: '#5cc04a' },
  { id: 'fish', color: '#4aa8ff' },
  { id: 'flower', color: '#b878ff' },
  { id: 'house', color: '#ff7bac' },
  { id: 'flag', color: '#4fc39a' }
];
// Rata (× viewH): lähtöasema, runkopätkä, vaihde, runkopätkä, ..., pääteasema
var TRAIN_JN = 6;                                         // vaihteita
var TRAIN_START = 1.2;                                    // lähtöasema
var TRAIN_TRUNK = [2.1, 1.7, 1.2, 1.4, 2.2, 1.8, 1.9];    // runkopätkät vaihteiden välissä
var TRAIN_THEMES = ['fields', 'river', 'meadow', 'mills', 'tunnel', 'orchard', 'village'];  // runkopätkien maisemat
var TRAIN_JN_THEMES = ['fields', 'mills', 'meadow', 'mills', 'orchard', 'fields'];         // vaihdealueiden maisemat
var TRAIN_JLEN = 2.7;         // vaihteesta yhtymään
var TRAIN_CURVE = 0.65;       // yläraiteen nousu ja lasku
var TRAIN_UP = 0.19;          // yläraiteen korkeus
var TRAIN_JST = [1.35, 1.95]; // haarojen asemat vaihteesta (ylä, ala); ylä ensin, jotta rakennukset eivät peity
var TRAIN_POST = 0.6;         // vaihdekyltti ja vipu ennen vaihdetta
var TRAIN_BOARD_Y = [0.44, 0.56];  // nuolikylttien korkeus (ylä-, alahaara) × viewH

var train = {
  x: 0, v: 0, cam: 0, mode: 'stand', t: 0, req: -1, st: [], sig: [], jn: [], pax: [], seats: [],
  queue: [], queueT: 0, standT: 0, stars: [], puffs: [], puffT: 0, starN: 0, delivered: 0,
  flawless: true, gold: false, whistles: 0, balloon: null, hintNext: -1, hintLever: false, builtW: 0, builtH: 0,
  U: null, sigIdx: -1, endT: 0, won: false, brakeT: 0, hudBump: 0, whistleT: 0, crossDown: 0,
  firstHigh: -1, wheelA: 0, stops: 0, icons: [], trunk: [], lastKind: ''
};

// ---------- Apu ----------
function trainHash(n) {
  var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function trainTY() { return viewH * TRAIN_TY; }
function trainPlatY() { return viewH * (TRAIN_TY + TRAIN_PLAT); }
function trainLength() { return viewH * (TRAIN_LOCO + TRAIN_CARS * (TRAIN_CARL + TRAIN_CGAP)); }
// Vaunun k (0 = veturin takana) keskikohta junan keulasta x
function trainCarX(x, k) {
  var h = viewH;
  return x - h * TRAIN_LOCO - h * TRAIN_CGAP * (k + 1) - h * TRAIN_CARL * (k + 0.5);
}
// Vaihde, jonka alueella x on (-1 = runkorata)
function trainJnAt(x) {
  var j, J;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    if (x >= J.sx && x <= J.ex) return j;
  }
  return -1;
}
// Haara, jota juna kulkee: lukittu reitti tai vaihteen asento
function trainJnBranch(J) { return J.locked ? J.route : J.sel; }
// Yläraiteen nousu 0..1 vaihteen alusta (d × viewH): pehmeä kaari ylös ja alas
function trainUpShape(d) {
  var t;
  if (d <= 0 || d >= TRAIN_JLEN) return 0;
  if (d < TRAIN_CURVE) t = d / TRAIN_CURVE;
  else if (d > TRAIN_JLEN - TRAIN_CURVE) t = (TRAIN_JLEN - d) / TRAIN_CURVE;
  else return 1;
  return (1 - Math.cos(t * Math.PI)) / 2;
}
// Kiskon yläpinta x:ssä; br = haara (0 ylä, 1 ala; oletus junan reitti)
function trainTrackY(x, br) {
  var j = trainJnAt(x), J;
  if (j < 0) return trainTY();
  J = train.jn[j];
  if (br === undefined) br = trainJnBranch(J);
  return br === 0 ? trainTY() - viewH * TRAIN_UP * trainUpShape((x - J.sx) / viewH) : trainTY();
}
// Kiskon kallistus x:ssä (radiaaneina; negatiivinen = nousu)
function trainTrackAng(x, br) {
  var e = viewH * 0.02;
  return Math.atan2(trainTrackY(x + e, br) - trainTrackY(x - e, br), 2 * e);
}
// Seisontataso kiskon edessä (pois hyppäävät laskeutuvat tähän)
function trainGroundY(x) { return trainTrackY(x) + viewH * TRAIN_PLAT; }
// Istumapaikka: vaunu j/2, vasen tai oikea puoli; kallistuu vaunun mukana
function trainSeatPos(j, x) {
  var h = viewH, cx = trainCarX(x === undefined ? train.x : x, Math.floor(j / 2)), y = trainTrackY(cx), a = trainTrackAng(cx);
  var dx = j % 2 ? h * 0.034 : -h * 0.034, dy = -h * 0.058, ca = Math.cos(a), sa = Math.sin(a);
  return { x: cx + dx * ca - dy * sa, y: y + dx * sa + dy * ca };
}
function trainChimney() {
  var h = viewH, px = train.x - h * 0.1, y = trainTrackY(px), a = trainTrackAng(px), dx = h * 0.055, dy = -h * 0.215;
  return { x: px + dx * Math.cos(a) - dy * Math.sin(a), y: y + dx * Math.sin(a) + dy * Math.cos(a) };
}
// Piirtokehys: vaunu tai veturi kallistetaan kiskon mukaan pisteen px ympäri
function trainTilt(c, px) {
  var y = trainTrackY(px), a = trainTrackAng(px);
  c.save();
  c.translate(px, y);
  c.rotate(a);
  c.translate(-px, -trainTY());
}

// ---------- Asemien kuvat ja matkustajien määränpäät ----------
// Kummallekin haaralle eri kuva, eikä peräkkäisissä vaihteissa samoja kuvia
function trainMakeIcons() {
  var out = [], prev = [], j, k, pool, pick;
  for (j = 0; j < TRAIN_JN; j++) {
    pool = shuffleNums([0, 1, 2, 3, 4, 5]);
    pick = [];
    for (k = 0; k < pool.length && pick.length < 2; k++) if (prev.indexOf(pool[k]) < 0) pick.push(pool[k]);
    out.push(pick);
    prev = pick;
  }
  return out;
}
// Ensimmäinen vaihde vaihteen afterJ jälkeen, jonka haaralla on kuva icon
function trainFirstMatch(icon, afterJ) {
  var k, b;
  for (k = afterJ + 1; k < train.jn.length; k++) {
    for (b = 0; b < 2; b++) if (train.st[train.jn[k].st[b]].icon === icon) return { k: k, b: b };
  }
  return null;
}
// Kyydissä olevien (ja kyytiin juoksevien) toiveet: vaihde -> haluttu haara
function trainWanted(afterJ) {
  var w = {}, i, p, fm;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.dest < 0 || p.missed) continue;
    if (p.state !== 'ride' && p.state !== 'run' && !(p.state === 'hop' && p.anim && !p.anim.off)) continue;
    fm = trainFirstMatch(p.dest, afterJ);
    if (fm) w[fm.k] = fm.b;
  }
  return w;
}
// Kyytiin nousevan määränpää (vaihteen atJ asemalta, -1 = lähtöasema):
// seuraavaan tai sitä seuraavaan vaihteeseen, eikä koskaan eri haaralle kuin
// muut samaan vaihteeseen haluavat. Seuraavaan vaihteeseen haluaa aina joku.
function trainPickDest(atJ) {
  var w = trainWanted(atJ), near = [], far = [], ic, fm, nk = atJ + 1, pick;
  if (nk >= TRAIN_JN) return 6;
  for (ic = 0; ic < 6; ic++) {
    fm = trainFirstMatch(ic, atJ);
    if (!fm || fm.k > nk + 1) continue;
    if (w[fm.k] !== undefined && w[fm.k] !== fm.b) continue;
    (fm.k === nk ? near : far).push(ic);
  }
  if (near.length && (w[nk] === undefined || !far.length || Math.random() < 0.55)) pick = near;
  else pick = far;
  if (!pick.length) return 6;
  return pick[Math.floor(Math.random() * pick.length)];
}
// Väärälle haaralle jäänyt matkustaja saa myöhemmän (vielä näkymättömän)
// vaihteen asemasta oman kuvansa
function trainRescue(icon, afterJ) {
  var w = trainWanted(afterJ), k, b, bs, s, best = null, score;
  for (k = afterJ + 1; k < train.jn.length; k++) {
    if (train.jn[k].revealed) continue;
    bs = Math.random() < 0.5 ? [0, 1] : [1, 0];
    for (var n = 0; n < 2; n++) {
      b = bs[n];
      if (w[k] === b) continue;
      if (train.st[train.jn[k].st[1 - b]].icon === icon) continue;
      score = w[k] === undefined ? 2 : 1;
      if (!best || score > best.score) best = { k: k, b: b, score: score };
    }
    if (best && best.score === 2) break;
  }
  if (!best) return;
  s = train.st[train.jn[best.k].st[best.b]];
  s.icon = icon;
  train.icons[best.k][best.b] = icon;
}

// ---------- Maailma ----------
// Paikat viewH-yksiköissä; trainLayout muuttaa ne pikseleiksi
function trainBuildU() {
  var U = { st0: TRAIN_START, jn: [], trunk: [], stars: [] }, x = TRAIN_START, j, k, n, u, cl, t;
  for (j = 0; j <= TRAIN_JN; j++) {
    U.trunk.push([x, x + TRAIN_TRUNK[j]]);
    x += TRAIN_TRUNK[j];
    if (j < TRAIN_JN) { U.jn.push(x); x += TRAIN_JLEN; }
  }
  U.end = x;
  U.river = [U.trunk[1][0] + 0.35, U.trunk[1][0] + 0.95];
  U.sig = [U.trunk[3][0] + 0.55, U.trunk[5][0] + 0.4];
  U.tunnel = [U.trunk[4][0] + 0.5, U.trunk[4][0] + 1.2];
  U.cross = U.trunk[5][0] + 0.95;
  // Runkoradan tähtiryhmät: matala kaari (savu nappaa itsestään) ja korkeat
  // pylväät tai kaaret (vihellys). Ei tunnelissa, opastimilla eikä kylteillä.
  for (k = 0; k < U.trunk.length; k++) {
    t = U.trunk[k];
    for (n = 0; ; n++) {
      u = t[0] + 0.45 + n * 0.6 + (Math.random() - 0.5) * 0.08;
      if (u > t[1] - TRAIN_POST - 0.35 || (k === U.trunk.length - 1 && u > t[1] - 1.0)) break;
      if (u > U.tunnel[0] - 0.4 && u < U.tunnel[1] + 0.15) continue;
      if (Math.abs(u - U.sig[0]) < 0.3 || Math.abs(u - U.sig[1]) < 0.3) continue;
      cl = (k + n) % 3;
      if (cl === 0) {
        for (j = 0; j < 4; j++) U.stars.push({ u: u + j * 0.11, fy: 0.545 - Math.sin(j / 3 * Math.PI) * 0.025, low: true, jn: -1, br: -1 });
      } else if (cl === 1) {
        for (j = 0; j < 3; j++) U.stars.push({ u: u, fy: 0.46 - j * 0.09, low: false, jn: -1, br: -1 });
      } else {
        for (j = 0; j < 5; j++) U.stars.push({ u: u + j * 0.09, fy: 0.4 - Math.sin(j / 4 * Math.PI) * 0.1, low: false, jn: -1, br: -1 });
      }
    }
  }
  // Vaihteiden haaroilla matalat tähdet (vain kuljettu haara kerää ne) ja
  // penkan päällä korkea pylväs
  for (j = 0; j < TRAIN_JN; j++) {
    for (n = 0; n < 4; n++) {
      u = 0.3 + n * 0.13;
      U.stars.push({ u: U.jn[j] + u, fy: TRAIN_TY - TRAIN_UP * trainUpShape(u) - 0.25, low: true, jn: j, br: 0 });
      u = 0.95 + n * 0.12;
      U.stars.push({ u: U.jn[j] + u, fy: 0.545 - Math.sin(n / 3 * Math.PI) * 0.025, low: true, jn: j, br: 1 });
    }
    for (n = 0; n < 3; n++) U.stars.push({ u: U.jn[j] + 1.75, fy: 0.27 - n * 0.08, low: false, jn: -1, br: -1 });
  }
  return U;
}
function trainLayout() {
  var h = viewH, U = train.U, i, j, b, o, J, old = train.st, oldJ = train.jn, st;
  train.jn = [];
  for (j = 0; j < U.jn.length; j++) {
    o = oldJ[j];
    train.jn.push({
      sx: U.jn[j] * h, ex: (U.jn[j] + TRAIN_JLEN) * h, post: (U.jn[j] - TRAIN_POST) * h,
      sel: o ? o.sel : 1, locked: o ? o.locked : false, route: o ? o.route : -1, revealed: o ? o.revealed : false,
      flips: o ? o.flips : 0, lev: o ? o.lev : 1, levA: o ? o.levA : 0.55, wob: 0, flashT: 0, st: [0, 0], theme: TRAIN_JN_THEMES[j]
    });
  }
  train.st = [];
  train.st.push({ x: U.st0 * h, icon: 7, jn: -1, br: -1, start: true, end: false });
  for (j = 0; j < U.jn.length; j++) {
    for (b = 0; b < 2; b++) {
      train.jn[j].st[b] = train.st.length;
      train.st.push({ x: (U.jn[j] + TRAIN_JST[b]) * h, icon: train.icons[j][b], jn: j, br: b, start: false, end: false });
    }
  }
  train.st.push({ x: U.end * h, icon: 6, jn: -1, br: -1, start: false, end: true });
  for (i = 0; i < train.st.length; i++) {
    st = train.st[i];
    st.visited = old[i] ? old[i].visited : i === 0;
    st.passed = old[i] ? old[i].passed : false;
    st.wob = 0;
    st.ty = st.br < 0 ? trainTY() : trainTrackY(st.x, st.br);
    st.platY = st.ty + h * TRAIN_PLAT;
    st.signY = st.ty - h * 0.3;
    st.hx = h * (st.br === 1 ? 0.3 : 0.42);   // rakennus aseman takana
  }
  var oldSig = train.sig;
  train.sig = [];
  for (i = 0; i < U.sig.length; i++) train.sig.push({ x: U.sig[i] * h, green: oldSig[i] ? oldSig[i].green : false, task: i, t: 0 });
  train.river = [U.river[0] * h, U.river[1] * h];
  train.tunnel = [U.tunnel[0] * h, U.tunnel[1] * h];
  train.cross = U.cross * h;
  train.trunk = [];
  for (i = 0; i < U.trunk.length; i++) train.trunk.push([U.trunk[i][0] * h, U.trunk[i][1] * h, TRAIN_THEMES[i]]);
  train.builtW = viewW;
  train.builtH = h;
}

// ---------- Alustus ----------
function initTrain() {
  var i, s;
  tasks = [makeTask(-5, 'route'), makeTask(-5, 'pay')];  // välitehtävät vaikeampia (palaute 4.10.2026)
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  train.icons = trainMakeIcons();
  train.U = trainBuildU();
  train.st = [];
  train.sig = [];
  train.jn = [];
  trainLayout();
  train.x = train.st[0].x;
  train.v = 0;
  train.cam = train.x - viewW * TRAIN_LEAD;
  train.req = -1;
  train.pax = [];
  train.seats = [];
  for (i = 0; i < TRAIN_SEATS; i++) train.seats.push(null);
  train.lastKind = '';
  trainSpawnWaiters(0, 2);
  train.stars = [];
  for (i = 0; i < train.U.stars.length; i++) {
    s = train.U.stars[i];
    train.stars.push({ x: s.u * viewH, y: s.fy * viewH, got: false, low: s.low, jn: s.jn, br: s.br, ph: Math.random() * 6, fall: false });
  }
  train.firstHigh = -1;
  for (i = 0; i < train.stars.length; i++) if (!train.stars[i].low && train.stars[i].x > train.jn[0].ex) { train.firstHigh = i; break; }
  train.puffs = [];
  train.puffT = 0;
  train.starN = 0;
  train.delivered = 0;
  train.flawless = true;
  train.gold = false;
  train.whistles = 0;
  train.whistleT = 0;
  train.balloon = null;
  train.hintNext = -1;
  train.hintLever = false;
  train.sigIdx = -1;
  train.won = false;
  train.endT = 0;
  train.brakeT = 0;
  train.hudBump = 0;
  train.crossDown = 0;
  train.wheelA = 0;
  train.stops = 0;
  trainArrive(0);
  train.standT = -0.8;
  trainSetupProps();
  renderBackground();
}
function respawnTrain() {}
function resizeTrain() {
  var rh = viewH / (train.builtH || viewH), i, p;
  camX = 0;
  if (!train.U) return;
  train.x *= rh;
  train.v *= rh;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    p.x *= rh; p.y *= rh; p.baseY *= rh;
    if (p.anim) { p.anim.x0 *= rh; p.anim.y0 *= rh; p.anim.x1 *= rh; p.anim.y1 *= rh; }
  }
  for (i = 0; i < train.stars.length; i++) { train.stars[i].x *= rh; train.stars[i].y *= rh; }
  train.puffs = [];
  trainLayout();
  train.cam = train.x - viewW * TRAIN_LEAD;
  trainPlaceWaiters();
  trainSetupProps();
}
// Laiturille odottajia (määränpää arvotaan vasta kyytiin noustessa)
function trainSpawnWaiters(i, n) {
  var k, kind, last = train.lastKind;
  for (k = 0; k < n; k++) {
    do { kind = TRAIN_KINDS[Math.floor(Math.random() * TRAIN_KINDS.length)]; } while (kind === last);
    last = kind;
    train.pax.push({ kind: kind, from: i, dest: -1, state: 'wait', x: 0, y: 0, baseY: 0, seat: -1, anim: null, t: Math.random() * 3, missed: false, waveT: 0, face: 1, alpha: 1, slot: 0 });
  }
  train.lastKind = last;
  trainPlaceWaiters();
}
// Odottajat laiturille vaunujen eteen
function trainPlaceWaiters() {
  var i, p, n = {}, h = viewH, S;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.state !== 'wait') continue;
    n[p.from] = (n[p.from] || 0) + 1;
    p.slot = n[p.from] - 1;
    S = train.st[p.from];
    p.x = S.x - h * (0.2 + p.slot * 0.17);
    p.y = S.platY;
    p.baseY = p.y;
  }
}
// Vaihde tulee pian näkyviin: vaihteen oletusasento ja asemien odottajat.
// Ensimmäinen vaihde on aina väärin päin (vihjekäsi näyttää vivun), muut
// useimmiten.
function trainReveal() {
  var j, J, w, b;
  // Lähtöasemalla odotetaan, että ensimmäiset matkustajat ovat kyydissä
  if (train.mode === 'stand' && train.atSt === 0) return;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    if (J.revealed || J.post - train.cam > viewW * 1.25) continue;
    J.revealed = true;
    w = trainWanted(j - 1)[j];
    if (w === undefined) J.sel = Math.random() < 0.5 ? 0 : 1;
    else J.sel = (j === 0 || Math.random() < 0.65) ? 1 - w : w;
    J.lev = J.sel;
    J.levA = J.sel === 0 ? -0.55 : 0.55;
    for (b = 0; b < 2; b++) trainSpawnWaiters(J.st[b], j === TRAIN_JN - 1 ? 1 : 1 + (Math.random() < 0.5 ? 1 : 0));
  }
}

// ---------- Tökättävät koristeet ----------
// Maailmakoordinaateissa (kamera train.cam). Taso 0 piirretään junan taakse,
// taso 1 junan eteen (traktori, puomi, kala, lepakot).
function trainSetupProps() {
  var h = viewH, T = train.trunk, J = train.jn, E = train.st[train.st.length - 1].x, i, x, ty = trainTY(), up = ty - h * TRAIN_UP, pl = h * 1.85;
  propsReset();
  // Pellot: lehmät ja aidan yli hyppivä lammas
  trainAddGrazer(T[0][0] + h * 0.4, h * 0.71, h * 0.05, 'cow', 1);
  trainAddGrazer(T[0][0] + h * 0.62, h * 0.72, h * 0.045, 'cow', -1);
  trainAddFenceSheep(T[0][0] + h * 0.85, h * 0.73, h * 0.04);
  // Ensimmäinen vaihde: vaihdetupa ja rautatieläisen kissa etualalla, lampaat penkalla
  trainAddHut(J[0].post - h * 0.42, h * 0.985, h * 0.1);
  trainAddCat(J[0].post - h * 0.62, h * 0.975, h * 0.035, 1);
  trainAddGrazer(J[0].sx + pl, up - h * 0.015, h * 0.032, 'sheep', 1);
  trainAddHay(J[0].sx + h * 2.3, h * 0.985, h * 0.045);
  // Joki: kala hyppää sillan vierestä, ankka uiskentelee; semafori joen jälkeen
  trainAddFish((train.river[0] + train.river[1]) / 2 - h * 0.15, h * 0.95, h * 0.04);
  trainAddGrazer(train.river[0] + h * 0.18, h * 0.705, h * 0.032, 'duck', 1);
  // Tuulimyllyvaihde: mylly penkalla
  trainAddMill(J[1].sx + pl, up - h * 0.01, h * 0.08);
  trainAddHay(J[1].sx + h * 0.95, h * 0.985, h * 0.045);
  // Niitty: semafori ja toinen vaihdetupa
  trainAddSemaphore(T[2][0] + h * 0.55, ty - h * 0.01, h * 0.05);
  trainAddHut(J[2].post - h * 0.38, h * 0.985, h * 0.1);
  trainAddScarecrow(J[2].sx + pl, up - h * 0.01, h * 0.07);
  trainAddFlowers(J[2].sx + h * 1.0, h * 0.97, h * 0.04);
  // Myllyt opastimen luona ja myllyvaihteen penkalla
  trainAddMill(T[3][0] + h * 0.3, h * 0.7, h * 0.1);
  trainAddMill(J[3].sx + pl, up - h * 0.01, h * 0.075);
  trainAddCat(J[3].sx + h * 2.3, h * 0.975, h * 0.035, -1);
  // Tunneli: lampaat mäen päällä, lepakot katossa
  x = (train.tunnel[0] + train.tunnel[1]) / 2;
  trainAddGrazer(x - h * 0.2, h * 0.4, h * 0.035, 'sheep', 1);
  trainAddGrazer(x + h * 0.16, h * 0.41, h * 0.032, 'sheep', -1);
  for (i = 0; i < 3; i++) trainAddBat(train.tunnel[0] + (train.tunnel[1] - train.tunnel[0]) * (0.25 + i * 0.25), ty - h * 0.245, h * 0.028);
  // Omenatarha, opastin ja tasoristeys
  trainAddAppleTree(J[4].sx + pl, up - h * 0.01, h * 0.14);
  trainAddAppleTree(T[5][0] + h * 0.2, h * 0.72, h * 0.15);
  trainAddGrazer(T[5][0] + h * 0.6, h * 0.73, h * 0.03, 'hen', 1);
  trainAddCrossing(train.cross);
  trainAddTractor(train.cross - h * 0.26, h * 0.985, h * 0.07);
  trainAddFlowers(J[5].sx + h * 1.0, h * 0.97, h * 0.04);
  trainAddGrazer(J[5].sx + pl, up - h * 0.015, h * 0.04, 'cow', -1);
  // Kylä: talot, joiden ikkunasta kurkkaa pupu, semafori ja laiturin kissa
  trainAddHouse(T[6][0] + h * 0.3, ty - h * 0.07, h * 0.12, '#ff9f7a');
  trainAddHouse(T[6][0] + h * 0.6, ty - h * 0.08, h * 0.1, '#7fc8ff');
  trainAddSemaphore(E - h * 0.95, ty - h * 0.01, h * 0.05);
  trainAddCat(E - h * 0.72, ty + h * 0.075, h * 0.033, 1, 2);
}

// Vaihdetupa: tökkäys avaa oven ja vaihdemies (pupu) tulee heiluttamaan
// lippua; joka kolmas tökkäys ripustaa katolle uuden viirin (enintään 6)
function trainAddHut(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.9, hy: s * 0.65, color: '#ffb84f', note: 698, amp: 0.05, layer: 1, outT: 0, flags: 0,
    update: function (p, dt) { if (p.outT > 0) p.outT -= dt; },
    draw: function (c, p) {
      var k = p.outT > 0 ? Math.min(1, (2.6 - p.outT) * 4, p.outT * 3) : 0, i, fx, fy;
      artShadow(c, 0, 0, s * 0.8, s * 0.14, 0.16);
      artRoundRect(c, -s * 0.5, -s * 0.85, s * 1.0, s * 0.85, s * 0.06, '#ffe0a8', { lineColor: '#a8804a', shadeTo: '#f0c888' });
      c.beginPath(); c.moveTo(-s * 0.66, -s * 0.8); c.lineTo(0, -s * 1.28); c.lineTo(s * 0.66, -s * 0.8); c.closePath();
      artFillPath(c, '#5a8ad8', -s * 1.28, -s * 0.8, s * 0.4, { lineColor: '#2a4a8a' });
      // Viirinaru katon harjalta räystäälle
      if (p.flags > 0) {
        c.strokeStyle = '#6a4a2a';
        c.lineWidth = Math.max(1, s * 0.025);
        c.beginPath(); c.moveTo(0, -s * 1.28); c.quadraticCurveTo(s * 0.45, -s * 1.12, s * 0.9, -s * 0.85); c.stroke();
        for (i = 0; i < p.flags; i++) {
          fx = s * (0.12 + i * 0.13);
          fy = -s * 1.28 + (fx / (s * 0.9)) * s * 0.43 - Math.sin(fx / (s * 0.9) * Math.PI) * s * 0.05;
          c.fillStyle = maneColors[i % maneColors.length];
          c.beginPath(); c.moveTo(fx - s * 0.05, fy); c.lineTo(fx + s * 0.05, fy); c.lineTo(fx, fy + s * 0.12 + Math.sin(globalT * 4 + i) * s * 0.01); c.closePath(); c.fill();
        }
      }
      // Ikkuna, ovi ja vaihdemies
      artRoundRect(c, s * 0.1, -s * 0.66, s * 0.28, s * 0.24, s * 0.04, '#8fd4ff', { lineColor: '#6a4020' });
      artRoundRect(c, -s * 0.38, -s * 0.62, s * 0.32, s * 0.62, s * 0.04, '#4a3020', { line: false });
      if (k > 0) {
        var bx = -s * 0.22 - k * s * 0.5, wv = Math.sin(globalT * 9) * 0.5;
        drawBunny(c, bx, 0, s * 0.3, 0, globalT * 6, false);
        // Lakki ja lippu
        artRoundRect(c, bx - s * 0.13, -s * 0.47, s * 0.26, s * 0.07, s * 0.03, '#2a4a8a', { lineColor: '#1a2a5a' });
        c.save();
        c.translate(bx + s * 0.15, -s * 0.2);
        c.rotate(-0.4 + wv);
        artLimb(c, 0, 0, 0, -s * 0.55, s * 0.035, '#8a6a4a', '#4a3a2a');
        c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.3, -s * 0.47 + Math.sin(globalT * 12) * s * 0.03); c.lineTo(0, -s * 0.36); c.closePath();
        artFillPath(c, '#5cd05a', -s * 0.55, -s * 0.36, s * 0.1, { lineColor: '#2a7a2a' });
        c.restore();
      }
      // Ovi kääntyy auki
      artRoundRect(c, -s * 0.38, -s * 0.62, s * 0.32 * (1 - k * 0.8), s * 0.62, s * 0.04, '#c8844a', { lineColor: '#6a4020' });
    },
    poke: function (p) {
      p.outT = 2.6;
      playNote(1568, 0.15, 0.08, 'square', 0.06);
      playNote(1568, 0.3, 0.12, 'square', 0.06);
      if (p.n % 3 === 0 && p.flags < 6) {
        p.flags++;
        for (var i = 0; i < 4; i++) playNote(659 * Math.pow(1.122, i), 0.45 + i * 0.07, 0.15, 'triangle', 0.2);
      }
    }
  });
}
// Rautatieläisen kissa: tökkäys -> miukaisu ja hännän heilautus; joka kolmas:
// kissa hyppää perhosen perään ja sydämiä
function trainAddCat(x, y, s, face, layer) {
  propAdd({
    x: x, y: y, r: s * 1.8, hy: s * 0.9, color: '#ffb070', note: 880, amp: 0.08, layer: layer === undefined ? 1 : layer, jumpT: 0,
    update: function (p, dt) { if (p.jumpT > 0) p.jumpT -= dt; },
    draw: function (c, p) {
      var k = p.jumpT > 0 ? 1 - p.jumpT / 1.1 : 0, jy = -Math.sin(k * Math.PI) * s * 2.4, tail = Math.sin(globalT * 2.2 + x) * 0.4 + (p.t >= 0 ? Math.sin(p.t * 14) * 0.6 : 0);
      artShadow(c, 0, 0, s * 0.9, s * 0.2, 0.16);
      if (p.jumpT > 0) {
        // Perhonen lepattaa ylhäällä
        var bx = Math.sin(k * 5) * s * 0.6, by = -s * 3.2 - k * s * 0.8, fl = Math.abs(Math.sin(globalT * 20));
        artBlob(c, bx - s * 0.18, by, s * 0.18 * fl + s * 0.04, s * 0.14, '#ff8ad8', { lineColor: '#a83a8a' });
        artBlob(c, bx + s * 0.18, by, s * 0.18 * fl + s * 0.04, s * 0.14, '#ff8ad8', { lineColor: '#a83a8a' });
      }
      c.save();
      c.translate(0, jy);
      c.scale(face, 1);
      // Häntä
      c.strokeStyle = '#a8602a';
      c.lineWidth = s * 0.26;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(-s * 0.5, -s * 0.3); c.quadraticCurveTo(-s * 1.1, -s * 0.5, -s * 0.9 + Math.sin(tail) * s * 0.3, -s * 1.2); c.stroke();
      c.strokeStyle = '#ffa860';
      c.lineWidth = s * 0.16;
      c.stroke();
      artBlob(c, -s * 0.05, -s * 0.5, s * 0.6, s * 0.5, '#ffa860', { lineColor: '#a8602a', shadeTo: '#f08a40', hi: 0.25 });
      artCircle(c, s * 0.45, -s * 1.05, s * 0.42, '#ffa860', { lineColor: '#a8602a', shadeTo: '#f08a40' });
      c.beginPath(); c.moveTo(s * 0.12, -s * 1.3); c.lineTo(s * 0.18, -s * 1.7); c.lineTo(s * 0.42, -s * 1.42); c.closePath();
      artFillPath(c, '#ffa860', -s * 1.7, -s * 1.3, s * 0.15, { lineColor: '#a8602a' });
      c.beginPath(); c.moveTo(s * 0.5, -s * 1.42); c.lineTo(s * 0.76, -s * 1.72); c.lineTo(s * 0.8, -s * 1.3); c.closePath();
      artFillPath(c, '#ffa860', -s * 1.72, -s * 1.3, s * 0.15, { lineColor: '#a8602a' });
      var blink = (globalT + x) % 4 < 0.15 || p.jumpT > 0;
      artEye(c, s * 0.34, -s * 1.08, s * 0.08, 0.5, blink);
      artEye(c, s * 0.62, -s * 1.08, s * 0.08, 0.5, blink);
      c.fillStyle = '#ff7b9a';
      c.beginPath(); c.arc(s * 0.5, -s * 0.94, s * 0.06, 0, Math.PI * 2); c.fill();
      artBlush(c, s * 0.25, -s * 0.9, s * 0.07);
      c.restore();
    },
    poke: function (p) {
      playNote(784, 0, 0.12, 'triangle', 0.15);
      playNote(659, 0.12, 0.25, 'triangle', 0.15);
      if (p.n % 3 === 0 && p.jumpT <= 0) {
        p.jumpT = 1.1;
        trainHearts(p.x, p.y - s * 3, 3);
        playNote(1319, 0.3, 0.1, 'sine', 0.2);
      }
    }
  });
}
// Ratapihan semafori: tökkäys kääntää siiven ylös tai alas (kolahdus ja
// lamppu vaihtaa väriä); viidennellä siivelle laskeutuu laulava lintu
function trainAddSemaphore(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.6, hy: s * 4.2, color: '#ff5a5a', note: 523, amp: 0.04, up: false, ang: 0, bird: 0, singT: 0,
    update: function (p, dt) {
      p.ang += ((p.up ? -0.75 : 0) - p.ang) * Math.min(1, dt * 9);
      if (p.singT > 0) p.singT -= dt;
      if (p.bird > 0 && p.bird < 1) p.bird = Math.min(1, p.bird + dt * 0.8);
    },
    draw: function (c, p) {
      var top = -s * 5;
      artShadow(c, 0, 0, s * 0.6, s * 0.12, 0.15);
      artLimb(c, 0, 0, 0, top, s * 0.18, '#d8d8e0', '#5a5a6a');
      artCircle(c, 0, top - s * 0.15, s * 0.14, '#5a5a6a', { line: false });
      // Lamppu siiven juuressa
      artCircle(c, -s * 0.05, top + s * 1.0, s * 0.2, p.up ? '#5cff6a' : '#ff4a4a', { lineColor: '#2a2a3a', hi: 0.4 });
      c.save();
      c.translate(0, top + s * 0.45);
      c.rotate(p.ang);
      artRoundRect(c, 0, -s * 0.16, s * 1.7, s * 0.32, s * 0.1, '#ff5a5a', { lineColor: '#8a2020' });
      c.fillStyle = '#ffffff';
      c.fillRect(s * 1.25, -s * 0.12, s * 0.16, s * 0.24);
      // Lintu siiven kärjessä
      if (p.bird > 0) {
        var by = -s * 0.16 - (1 - p.bird) * s * 3, bx = s * 1.45 + (1 - p.bird) * s * 2;
        c.save();
        c.translate(bx, by);
        c.rotate(-p.ang);
        artBlob(c, 0, -s * 0.25, s * 0.28, s * 0.22, '#7fc8ff', { lineColor: '#2a6a9a' });
        artCircle(c, s * 0.2, -s * 0.48, s * 0.15, '#7fc8ff', { lineColor: '#2a6a9a' });
        c.fillStyle = '#ffb030';
        c.beginPath(); c.moveTo(s * 0.32, -s * 0.5); c.lineTo(s * 0.5, -s * 0.45 - (p.singT > 0 ? Math.abs(Math.sin(globalT * 20)) * s * 0.08 : 0)); c.lineTo(s * 0.32, -s * 0.42); c.fill();
        artEye(c, s * 0.24, -s * 0.52, s * 0.05, 0.5, false);
        c.restore();
      }
      c.restore();
    },
    poke: function (p) {
      p.up = !p.up;
      playNote(196, 0, 0.08, 'square', 0.1);
      playNote(p.up ? 880 : 660, 0.06, 0.12, 'triangle', 0.2);
      if (p.n >= 5 && p.bird === 0) p.bird = 0.01;
      if (p.bird > 0) {
        p.singT = 1.2;
        for (var i = 0; i < 5; i++) playNote(1568 + (i % 2) * 300, 0.25 + i * 0.1, 0.07, 'sine', 0.15);
      }
    }
  });
}

// Laiduntava eläin: ääntelee; joka kolmas tökkäys pomppaa ilosta sydämin
function trainAddGrazer(x, y, s, kind, face) {
  propAdd({
    x: x, y: y, r: s * 1.5, hy: s * 0.9, color: '#ffffff', note: 330, amp: 0.1, hopT: 0, eatT: Math.random() * 5,
    update: function (p, dt) { if (p.hopT > 0) p.hopT -= dt; p.eatT += dt; },
    draw: function (c, p) {
      var hop = p.hopT > 0 ? Math.sin((0.8 - p.hopT) / 0.8 * Math.PI) * s * 1.2 : 0;
      artShadow(c, 0, 0, s * 1.1, s * 0.25, 0.16);
      trainDrawAnimal(c, kind, 0, -hop, s, { face: face, t: p.eatT, graze: p.t < 0 && hop === 0 && kind !== 'duck' });
    },
    poke: function (p) {
      trainAnimalSound(kind);
      if (p.n % 3 === 0) {
        p.hopT = 0.8;
        trainHearts(p.x, p.y - s * 2.5, 3);
      }
    }
  });
}
function trainHearts(x, y, n) {
  var i;
  for (i = 0; i < n; i++) {
    propDrop({
      x: x + (i - (n - 1) / 2) * viewH * 0.025, y: y, vx: (i - (n - 1) / 2) * viewW * 0.02, vy: -viewH * 0.35, vr: 0, life: 1.2,
      draw: function (c) { trainDrawHeart(c, 0, 0, viewH * 0.016); }
    });
  }
}
function trainDrawHeart(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.45);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  c.closePath();
  artFillPath(c, '#ff6f9a', y - r, y + r, r, { lineColor: '#c8406a' });
}
// Heinäpaali pomppaa; joka kolmas tökkäys: hiiri kurkistaa
function trainAddHay(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.3, hy: s * 0.8, color: '#ffe08a', note: 392, mouseT: 0,
    update: function (p, dt) { if (p.mouseT > 0) p.mouseT -= dt; },
    draw: function (c, p) {
      var i;
      artShadow(c, 0, 0, s * 1.3, s * 0.25, 0.16);
      if (p.mouseT > 0) {
        var k = Math.min(1, (2 - p.mouseT) * 4, p.mouseT * 3);
        artCircle(c, s * 0.75, -s * 0.3 - k * s * 0.35, s * 0.22, '#b8a8a0', { lineColor: '#6a5a50' });
        artCircle(c, s * 0.62, -s * 0.48 - k * s * 0.35, s * 0.1, '#ffc0c8', { lineColor: '#6a5a50' });
        artCircle(c, s * 0.9, -s * 0.48 - k * s * 0.35, s * 0.1, '#ffc0c8', { lineColor: '#6a5a50' });
        artEye(c, s * 0.82, -s * 0.33 - k * s * 0.35, s * 0.04, 0.5, false);
      }
      artBlob(c, 0, -s * 0.75, s * 1.1, s * 0.75, '#f2cf6a', { lineColor: '#a8803a', hi: 0.25 });
      c.strokeStyle = 'rgba(168,128,58,0.6)';
      c.lineWidth = Math.max(1, s * 0.06);
      for (i = 0; i < 3; i++) { c.beginPath(); c.arc(-s * 0.4, -s * 0.75, s * (0.15 + i * 0.17), 0, Math.PI * 2); c.stroke(); }
      c.beginPath(); c.moveTo(s * 0.3, -s * 1.45); c.lineTo(s * 0.3, -s * 0.05); c.stroke();
    },
    poke: function (p) {
      if (p.n % 3 === 0) { p.mouseT = 2; playNote(1568, 0.1, 0.08, 'sine', 0.2); playNote(1760, 0.2, 0.08, 'sine', 0.2); }
    }
  });
}
// Tuulimylly: tökkäys pyöräyttää siivet; viides tökkäys sataa kukan terälehtiä
function trainAddMill(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.2, hy: s * 1.6, color: '#ffffff', note: 523, amp: 0.05, ang: Math.random() * 6, spin: 0,
    update: function (p, dt) {
      p.ang += (0.6 + p.spin) * dt;
      p.spin *= Math.max(0, 1 - dt * 0.8);
    },
    draw: function (c, p) {
      var i;
      artShadow(c, 0, 0, s * 0.8, s * 0.15, 0.15);
      c.beginPath();
      c.moveTo(-s * 0.55, 0); c.lineTo(-s * 0.32, -s * 1.9); c.lineTo(s * 0.32, -s * 1.9); c.lineTo(s * 0.55, 0);
      c.closePath();
      artFillPath(c, '#fff4e0', -s * 1.9, 0, s * 0.5, { lineColor: '#a88a6a', shadeTo: '#e8d0b8' });
      artRoundRect(c, -s * 0.14, -s * 0.5, s * 0.28, s * 0.5, s * 0.12, '#a86a3a', { lineColor: '#6a4020' });
      artCircle(c, 0, -s * 1.2, s * 0.13, '#8fd4ff', { lineColor: '#6a4020' });
      c.beginPath();
      c.moveTo(-s * 0.42, -s * 1.85); c.quadraticCurveTo(0, -s * 2.7, s * 0.42, -s * 1.85);
      c.closePath();
      artFillPath(c, '#e85a4a', -s * 2.4, -s * 1.85, s * 0.4, { lineColor: '#8a2a20' });
      c.save();
      c.translate(0, -s * 1.95);
      for (i = 0; i < 4; i++) {
        c.save();
        c.rotate(p.ang + i * Math.PI / 2);
        artRoundRect(c, -s * 0.1, -s * 1.25, s * 0.2, s * 1.1, s * 0.05, '#fffaf0', { lineColor: '#8a6a4a' });
        c.strokeStyle = 'rgba(138,106,74,0.6)';
        c.lineWidth = Math.max(1, s * 0.03);
        c.beginPath(); c.moveTo(0, -s * 0.2); c.lineTo(0, -s * 1.2); c.moveTo(-s * 0.1, -s * 0.7); c.lineTo(s * 0.1, -s * 0.7); c.stroke();
        c.restore();
      }
      artCircle(c, 0, 0, s * 0.1, '#8a6a4a', { line: false });
      c.restore();
    },
    poke: function (p) {
      var i;
      p.spin = 6;
      playNote(392, 0.05, 0.2, 'triangle', 0.15);
      playNote(523, 0.15, 0.2, 'triangle', 0.15);
      if (p.n % 5 === 0) {
        for (i = 0; i < 8; i++) {
          propDrop({
            x: p.x + (Math.random() - 0.5) * s, y: p.y - s * 2, vx: (Math.random() - 0.5) * viewW * 0.15, vy: -viewH * (0.2 + Math.random() * 0.3), ground: p.y + viewH * 0.02, life: 2.4,
            col: maneColors[i % maneColors.length],
            draw: function (c, d) { artBlob(c, 0, 0, viewH * 0.008, viewH * 0.005, d.col, { line: false }); }
          });
        }
        for (i = 0; i < 5; i++) playNote(659 * Math.pow(1.12, i), i * 0.08, 0.2, 'sine', 0.18);
      }
    }
  });
}
// Lammas aidan vieressä: tökkäys hyppyyttää sen aidan yli (ja takaisin);
// joka kolmannella hypyllä karitsa hyppää perässä
function trainAddFenceSheep(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 2.2, hy: s * 1.0, color: '#ffffff', note: 440, amp: 0.04, side: -1, jumpT: 0, lamb: false, lambSide: -1, lambT: 0,
    update: function (p, dt) {
      if (p.jumpT > 0) { p.jumpT -= dt; if (p.jumpT <= 0) p.side = -p.side; }
      if (p.lambT > 0) { p.lambT -= dt; if (p.lambT <= 0) p.lambSide = -p.lambSide; }
    },
    draw: function (c, p) {
      var i, k, sx, sy;
      // Aita
      for (i = -1; i <= 1; i++) artRoundRect(c, i * s * 0.5 - s * 0.07, -s * 1.1, s * 0.14, s * 1.1, s * 0.05, '#c8945a', { lineColor: '#7a5028' });
      artRoundRect(c, -s * 0.7, -s * 0.95, s * 1.4, s * 0.12, s * 0.05, '#d8a46a', { lineColor: '#7a5028' });
      artRoundRect(c, -s * 0.7, -s * 0.55, s * 1.4, s * 0.12, s * 0.05, '#d8a46a', { lineColor: '#7a5028' });
      // Lammas (ja karitsa)
      k = p.jumpT > 0 ? 1 - p.jumpT / 0.7 : 0;
      sx = p.side * s * 1.3 * (1 - 2 * easeInOutSine(k));
      sy = -Math.sin(k * Math.PI) * s * 1.8;
      artShadow(c, sx, 0, s * 0.9, s * 0.2, 0.15);
      trainDrawAnimal(c, 'sheep', sx, sy, s, { face: -p.side, t: globalT });
      if (p.lamb) {
        k = p.lambT > 0 ? 1 - p.lambT / 0.6 : 0;
        sx = p.lambSide * s * 2.1 * (1 - 2 * easeInOutSine(k));
        sy = -Math.sin(k * Math.PI) * s * 1.5;
        trainDrawAnimal(c, 'sheep', sx, sy, s * 0.6, { face: -p.lambSide, t: globalT + 1 });
      }
    },
    poke: function (p) {
      if (p.jumpT > 0) return;
      p.jumpT = 0.7;
      trainAnimalSound('sheep');
      playNote(523 + (p.n % 5) * 60, 0.2, 0.12, 'triangle', 0.2);
      if (p.n % 3 === 0) {
        if (!p.lamb) { p.lamb = true; p.lambSide = p.side; }
        p.lambT = 0.6;
      }
    }
  });
}
// Kala hyppää joesta (itsestäänkin välillä); viides tökkäys: kultakala
function trainAddFish(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 2.2, hy: s * 0.6, color: '#7fd4ff', note: 784, layer: 1, jumpT: 0, auto: 3, gold: false,
    update: function (p, dt) {
      if (p.jumpT > 0) p.jumpT -= dt;
      p.auto -= dt;
      if (p.auto <= 0) { p.auto = 5 + Math.random() * 4; if (p.jumpT <= 0 && Math.abs(p.x - train.cam - viewW / 2) < viewW * 0.6) { p.jumpT = 1; p.gold = false; } }
    },
    draw: function (c, p) {
      var k, a = globalT * 2;
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(1, s * 0.08);
      c.beginPath(); c.ellipse(0, 0, s * (0.8 + (a % 1) * 0.6), s * 0.2, 0, 0, Math.PI * 2); c.stroke();
      if (p.jumpT > 0) {
        k = 1 - p.jumpT;
        c.save();
        c.translate(-s * 1.2 + k * s * 2.4, -Math.sin(k * Math.PI) * s * 2.6);
        c.rotate(-Math.cos(k * Math.PI) * 0.9);
        trainDrawIcon(c, 'fish', 0, 0, s * 0.9, p.gold ? '#ffd24f' : '#ff9a6a');
        c.restore();
        if (p.gold && Math.random() < 0.3) spawnSparkles(p.x - s * 1.2 + k * s * 2.4, p.y - Math.sin(k * Math.PI) * s * 2.6, 1, maneColors[Math.floor(Math.random() * 6)]);
      }
    },
    poke: function (p) {
      p.jumpT = 1;
      p.gold = p.n % 5 === 0;
      playNote(523, 0, 0.1, 'sine', 0.2);
      playNote(1047, 0.5, 0.15, 'sine', 0.2);
      if (p.gold) { for (var i = 0; i < 6; i++) playNote(784 * Math.pow(1.12, i), 0.2 + i * 0.07, 0.2, 'sine', 0.2); }
    }
  });
}
// Lepakko tunnelin katossa: tökkäys -> lentää silmukan ja vinkaisee
function trainAddBat(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.8, hy: -s * 0.8, color: '#c8a0ff', note: 1319, layer: 1, flyT: 0,
    update: function (p, dt) { if (p.flyT > 0) p.flyT -= dt; },
    draw: function (c, p) {
      var k = p.flyT > 0 ? 1 - p.flyT / 1.6 : 0, a = k * Math.PI * 2, fx = 0, fy = 0, flap;
      if (p.flyT > 0) { fx = Math.sin(a) * s * 4; fy = (1 - Math.cos(a)) * s * 2.2; }
      flap = p.flyT > 0 ? Math.sin(globalT * 30) * 0.6 : 0.15;
      c.save();
      c.translate(fx, fy);
      if (p.flyT <= 0) c.scale(1, -1);
      c.fillStyle = '#5a4a7a';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-s * 1.4, -s * (0.9 + flap), -s * 1.6, s * 0.3); c.quadraticCurveTo(-s * 0.8, 0, 0, s * 0.3); c.fill();
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 1.4, -s * (0.9 + flap), s * 1.6, s * 0.3); c.quadraticCurveTo(s * 0.8, 0, 0, s * 0.3); c.fill();
      artBlob(c, 0, s * 0.1, s * 0.45, s * 0.55, '#6a5a8a', { lineColor: '#3a2a5a' });
      artEye(c, -s * 0.16, -s * 0.05, s * 0.1, 0, p.flyT <= 0);
      artEye(c, s * 0.16, -s * 0.05, s * 0.1, 0, p.flyT <= 0);
      c.restore();
    },
    poke: function (p) {
      p.flyT = 1.6;
      playNote(1760, 0, 0.06, 'square', 0.08);
      playNote(1976, 0.08, 0.06, 'square', 0.08);
      if (p.n % 3 === 0) trainHearts(p.x, p.y + s * 2, 2);
    }
  });
}
// Variksenpelätin: variksen lento ja hatun pomppu
function trainAddScarecrow(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.1, hy: s * 1.4, color: '#ffd24f', note: 349, amp: 0.12, crowT: 0,
    update: function (p, dt) { if (p.crowT > 0) p.crowT -= dt; },
    draw: function (c, p) {
      artShadow(c, 0, 0, s * 0.6, s * 0.12, 0.15);
      artLimb(c, 0, 0, 0, -s * 1.9, s * 0.1, '#8a5a30', '#5a3a1a');
      artLimb(c, -s * 0.9, -s * 1.35, s * 0.9, -s * 1.35, s * 0.09, '#8a5a30', '#5a3a1a');
      artRoundRect(c, -s * 0.35, -s * 1.5, s * 0.7, s * 0.8, s * 0.15, '#5fa8ff', { lineColor: '#2a5a9a' });
      artRoundRect(c, -s * 0.5, -s * 1.5, s * 0.22, s * 0.28, s * 0.08, '#e85a4a', { lineColor: '#8a2a20' });
      artCircle(c, 0, -s * 1.85, s * 0.3, '#f2d9a0', { lineColor: '#a8803a' });
      artEye(c, -s * 0.1, -s * 1.88, s * 0.05, 0, false);
      artEye(c, s * 0.1, -s * 1.88, s * 0.05, 0, false);
      var hop = p.t >= 0 ? Math.max(0, Math.sin(Math.min(1, p.t / 0.6) * Math.PI)) * s * 0.4 : 0;
      c.beginPath();
      c.moveTo(-s * 0.5, -s * 2.05 - hop); c.lineTo(s * 0.5, -s * 2.05 - hop); c.lineTo(s * 0.2, -s * 2.5 - hop); c.lineTo(-s * 0.2, -s * 2.5 - hop);
      c.closePath();
      artFillPath(c, '#d8a040', -s * 2.5 - hop, -s * 2.05 - hop, s * 0.3, { lineColor: '#8a6020' });
      // Varis: istuu käsivarrella tai lentää kaarella
      var k = p.crowT > 0 ? 1 - p.crowT / 2.2 : 0, cx = s * 0.75, cy = -s * 1.5, fl = 0;
      if (p.crowT > 0) { cx += Math.sin(k * Math.PI * 2) * s * 2.5; cy -= Math.sin(k * Math.PI) * s * 2.5; fl = Math.sin(globalT * 25) * 0.5; }
      artBlob(c, cx, cy, s * 0.22, s * 0.16, '#3a3a4a', { lineColor: '#1a1a2a' });
      artCircle(c, cx + s * 0.18, cy - s * 0.12, s * 0.11, '#3a3a4a', { lineColor: '#1a1a2a' });
      c.fillStyle = '#ffb030';
      c.beginPath(); c.moveTo(cx + s * 0.27, cy - s * 0.14); c.lineTo(cx + s * 0.4, cy - s * 0.1); c.lineTo(cx + s * 0.27, cy - s * 0.07); c.fill();
      c.fillStyle = '#2a2a3a';
      c.beginPath(); c.moveTo(cx - s * 0.05, cy - s * 0.05); c.lineTo(cx - s * 0.3, cy - s * (0.3 + fl)); c.lineTo(cx + s * 0.1, cy - s * 0.05); c.fill();
    },
    poke: function (p) {
      if (p.crowT <= 0) { p.crowT = 2.2; playNote(330, 0, 0.12, 'sawtooth', 0.08); playNote(300, 0.15, 0.12, 'sawtooth', 0.08); }
    }
  });
}
// Kukkamätäs: kukat heilahtavat; kolmas tökkäys avaa sateenkaarikukan
function trainAddFlowers(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.8, hy: s * 0.6, color: '#ff8ad8', note: 659, layer: 1, bloomT: 0,
    update: function (p, dt) { if (p.bloomT > 0) p.bloomT -= dt; },
    draw: function (c, p) {
      var i, k;
      for (i = 0; i < 5; i++) {
        var fx = (i - 2) * s * 0.55, fy = -s * (0.5 + (i % 2) * 0.35);
        c.strokeStyle = '#3f9a3a';
        c.lineWidth = Math.max(1, s * 0.08);
        c.beginPath(); c.moveTo(fx, 0); c.lineTo(fx, fy); c.stroke();
        drawFlower(c, fx, fy, s * 0.16, ['#ff7bac', '#ffd24f', '#b78bff', '#ff9d5c', '#7fd4ff'][i]);
      }
      if (p.bloomT > 0) {
        k = Math.min(1, (3 - p.bloomT) * 3);
        for (i = 0; i < 6; i++) artCircle(c, Math.cos(i * 1.047) * s * 0.45 * k, -s * 1.5 + Math.sin(i * 1.047) * s * 0.45 * k, s * 0.25 * k, maneColors[i], { line: false });
        artCircle(c, 0, -s * 1.5, s * 0.22 * k, '#fff6a0', { lineColor: '#d8b030' });
      }
    },
    poke: function (p) {
      if (p.n % 3 === 0) { p.bloomT = 3; for (var i = 0; i < 6; i++) playNote(523 * Math.pow(1.122, i), i * 0.07, 0.2, 'triangle', 0.2); }
    }
  });
}
// Omenapuu: tökkäys pudottaa omenan; viides on kultainen
function trainAddAppleTree(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.6, hy: s * 0.9, color: '#ff5a5a', note: 494, amp: 0.06,
    draw: function (c) {
      var i;
      artShadow(c, 0, 0, s * 0.6, s * 0.1, 0.15);
      drawTree(c, 0, 0, s, 0, {});
      for (i = 0; i < 5; i++) artCircle(c, Math.cos(i * 1.3 + 0.4) * s * 0.42, -s * 0.85 + Math.sin(i * 1.3 + 0.4) * s * 0.3, s * 0.06, '#ff4a4a', { hi: 0.4 });
    },
    poke: function (p) {
      var gold = p.n % 5 === 0, r = s * (gold ? 0.08 : 0.06);
      propDrop({
        x: p.x + (Math.random() - 0.5) * s * 0.6, y: p.y - s * 0.8, vx: (Math.random() - 0.5) * viewW * 0.05, vy: 0, ground: p.y + viewH * 0.005, life: 2.2,
        draw: function (c) { artCircle(c, 0, 0, r, gold ? '#ffd24f' : '#ff4a4a', { hi: 0.4 }); artLimb(c, 0, -r, r * 0.3, -r * 1.5, r * 0.25, '#6a4020', false); },
        onLand: function (d) { if (gold) { spawnSparkles(d.x, d.y, 12, '#ffd24f'); playNote(1319, 0, 0.2, 'sine', 0.25); playNote(1568, 0.1, 0.25, 'sine', 0.25); } }
      });
    }
  });
}
// Tasoristeyksen puomi: laskee itsestään junan tullessa; tökkäys kilauttaa kelloa
function trainAddCrossing(x) {
  var h = viewH;
  propAdd({
    x: x + h * 0.1, y: h * 0.965, r: h * 0.07, hy: h * 0.1, color: '#ff5a5a', note: 1175, layer: 1, amp: 0.05,
    draw: function (c, p) {
      var s = h * 0.05, a = -1.35 * (1 - train.crossDown), blink = train.crossDown > 0.05 && Math.sin(globalT * 10) > 0;
      artLimb(c, 0, 0, 0, -s * 2.2, s * 0.14, '#e8e8f0', '#6a6a7a');
      artCircle(c, -s * 0.2, -s * 2.2, s * 0.16, blink ? '#ff4a4a' : '#8a3a3a', { lineColor: '#3a1a1a' });
      artCircle(c, s * 0.2, -s * 2.2, s * 0.16, !blink && train.crossDown > 0.05 ? '#ff4a4a' : '#8a3a3a', { lineColor: '#3a1a1a' });
      c.save();
      c.translate(0, -s * 1.3);
      c.rotate(Math.PI + a);
      artRoundRect(c, 0, -s * 0.09, s * 3.6, s * 0.18, s * 0.08, '#ffffff', { lineColor: '#8a2a2a' });
      c.fillStyle = '#ff4a4a';
      for (var i = 0; i < 4; i++) c.fillRect(s * (0.4 + i * 0.85), -s * 0.08, s * 0.4, s * 0.16);
      c.restore();
    },
    poke: function () {
      playNote(1319, 0, 0.1, 'triangle', 0.2);
      playNote(1319, 0.2, 0.1, 'triangle', 0.2);
    }
  });
}
// Traktori odottaa tasoristeyksessä: tööt; kolmas tökkäys pomppauttaa
function trainAddTractor(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.9, hy: s * 0.6, color: '#6fd66f', note: 262, layer: 1, hopT: 0,
    update: function (p, dt) { if (p.hopT > 0) p.hopT -= dt; },
    draw: function (c, p) {
      var hop = p.hopT > 0 ? Math.abs(Math.sin((0.9 - p.hopT) * 10)) * s * 0.12 : 0;
      artShadow(c, 0, 0, s * 0.9, s * 0.15, 0.18);
      c.save();
      c.translate(0, -hop);
      artRoundRect(c, -s * 0.7, -s * 0.75, s * 1.0, s * 0.45, s * 0.12, '#4fbf4f', { lineColor: '#1f6a2a', hi: 0.2 });
      artRoundRect(c, -s * 0.15, -s * 1.15, s * 0.5, s * 0.55, s * 0.08, '#4fbf4f', { lineColor: '#1f6a2a' });
      artRoundRect(c, -s * 0.07, -s * 1.07, s * 0.34, s * 0.25, s * 0.05, '#cfeeff', { lineColor: '#1f6a2a' });
      artLimb(c, -s * 0.55, -s * 0.75, -s * 0.55, -s * 1.0, s * 0.08, '#5a5a5a', '#2a2a2a');
      c.restore();
      trainDrawWheel(c, s * 0.15, -s * 0.32, s * 0.32, globalT, '#ffd24f');
      trainDrawWheel(c, -s * 0.55, -s * 0.18, s * 0.18, globalT, '#ffd24f');
    },
    poke: function (p) {
      playNote(220, 0, 0.18, 'square', 0.12);
      playNote(220, 0.22, 0.25, 'square', 0.12);
      if (p.n % 3 === 0) { p.hopT = 0.9; trainHearts(p.x, p.y - s * 1.3, 2); }
    }
  });
}
// Kylän talo: ikkunaan syttyy valo; joka kolmas tökkäys: pupu kurkkaa ikkunasta
function trainAddHouse(x, y, s, col) {
  propAdd({
    x: x, y: y, r: s * 0.8, hy: s * 0.7, color: col, note: 587, amp: 0.04, lightT: 0, bunT: 0,
    update: function (p, dt) { if (p.lightT > 0) p.lightT -= dt; if (p.bunT > 0) p.bunT -= dt; },
    draw: function (c, p) {
      var eve = trainEvening(), lit = p.lightT > 0 || eve > 0.5;
      artShadow(c, 0, 0, s * 0.8, s * 0.12, 0.15);
      artRoundRect(c, -s * 0.6, -s * 0.9, s * 1.2, s * 0.9, s * 0.06, '#fff4e8', { lineColor: '#a8806a', shadeTo: '#ead8c8' });
      c.beginPath(); c.moveTo(-s * 0.75, -s * 0.85); c.lineTo(0, -s * 1.45); c.lineTo(s * 0.75, -s * 0.85); c.closePath();
      artFillPath(c, col, -s * 1.45, -s * 0.85, s * 0.5, {});
      artRoundRect(c, s * 0.2, -s * 0.5, s * 0.25, s * 0.5, s * 0.06, '#a86a3a', { lineColor: '#6a4020' });
      if (lit) artGlow(c, -s * 0.25, -s * 0.55, s * 0.35, '#ffe890', 0.6);
      artRoundRect(c, -s * 0.42, -s * 0.72, s * 0.34, s * 0.3, s * 0.05, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
      if (p.bunT > 0) {
        c.save();
        c.beginPath(); c.rect(-s * 0.42, -s * 0.72, s * 0.34, s * 0.3); c.clip();
        drawBunny(c, -s * 0.25, -s * 0.38 - Math.min(1, (2 - p.bunT) * 4, p.bunT * 3) * s * 0.12, s * 0.16, 0, globalT * 8, false);
        c.restore();
      }
    },
    poke: function (p) {
      p.lightT = 3;
      if (p.n % 3 === 0) { p.bunT = 2; soundBunny(); }
    }
  });
}
function trainAnimalSound(kind) {
  if (kind === 'cow') { playNote(180, 0, 0.35, 'sawtooth', 0.1); playNote(150, 0.25, 0.45, 'sawtooth', 0.1); }
  else if (kind === 'sheep') { playNote(440, 0, 0.1, 'square', 0.06); playNote(415, 0.1, 0.1, 'square', 0.06); playNote(440, 0.2, 0.15, 'square', 0.06); }
  else if (kind === 'pig') { playNote(300, 0, 0.1, 'square', 0.08); playNote(260, 0.14, 0.12, 'square', 0.08); }
  else if (kind === 'hen') { playNote(880, 0, 0.06, 'triangle', 0.15); playNote(990, 0.1, 0.06, 'triangle', 0.15); playNote(880, 0.2, 0.1, 'triangle', 0.15); }
  else if (kind === 'duck') { playNote(520, 0, 0.08, 'square', 0.08); playNote(500, 0.14, 0.08, 'square', 0.08); }
  else soundBunny();
}

// ---------- Asemat, vaihteet ja pysähdykset ----------
// Pysähdyksen kohde: pyydetty asema, edessä oleva punainen opastin tai pääteasema
function trainTarget() {
  var cand = null, i, s, x = train.x;
  if (train.req >= 0) {
    s = train.st[train.req].x;
    if (s < x - 1) return { x: s, kind: 'station', i: train.req };
    cand = { x: s, kind: 'station', i: train.req };
  }
  for (i = 0; i < train.sig.length; i++) {
    s = train.sig[i].x - viewH * 0.06;
    if (!train.sig[i].green && s >= x - 2 && (!cand || s < cand.x)) cand = { x: s, kind: 'signal', i: i };
  }
  s = train.st[train.st.length - 1].x;
  if (!cand || s < cand.x) cand = { x: s, kind: 'station', i: train.st.length - 1 };
  return cand;
}
// Onko asema junan reitillä (runkorata tai vaihteen valittu/lukittu haara)
function trainOnRoute(i) {
  var st = train.st[i];
  if (st.jn < 0) return true;
  return trainJnBranch(train.jn[st.jn]) === st.br;
}
// Seuraava käymätön asema reitillä (hiljennystä, vihjeitä ja innostusta varten)
function trainNextStation() {
  var i;
  for (i = 1; i < train.st.length; i++) if (!train.st[i].visited && !train.st[i].passed && trainOnRoute(i)) return i;
  return -1;
}
// Ensimmäinen vaihde, jota juna ei ole vielä ohittanut
function trainNextJn() {
  var j;
  for (j = 0; j < train.jn.length; j++) if (!train.jn[j].locked) return j;
  return -1;
}
// Haluaako joku jäädä asemalle i tai nousta siltä?
function trainStationWanted(i) {
  var k, p, st = train.st[i];
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && !p.missed && p.dest === st.icon) return true;
    if (p.from === i && p.state === 'wait') return true;
  }
  return false;
}
function trainRequest(i) {
  var st = train.st[i], J = st.jn >= 0 ? train.jn[st.jn] : null;
  if (st.visited || st.passed || st.start || st.end || (J && J.locked && J.route !== st.br)) { st.wob = 0.5; playNote(660, 0, 0.08, 'triangle', 0.15); return; }
  if (J && J.sel !== st.br) {
    // Asema on toisella haaralla: vaihdevipu välähtää ja vihjekäsi näyttää sen
    st.wob = 0.5;
    J.flashT = 2.5;
    J.wob = 0.5;
    playNote(660, 0, 0.08, 'triangle', 0.15);
    playNote(523, 0.1, 0.12, 'triangle', 0.15);
    return;
  }
  st.wob = 0.6;
  if (train.req === i) return;
  train.req = i;
  train.brakeT = 0.6;
  if (train.hintNext === i) train.hintNext = -1;
  artPop(st.x + viewH * 0.04, st.signY, viewH * 0.08, TRAIN_ICONS[st.icon].color, 'ring');
  // Jarrun kirskahdus ja asemakellon kilaus
  playNote(1568, 0, 0.12, 'sine', 0.12);
  playNote(1397, 0.08, 0.2, 'sine', 0.1);
  playNote(784, 0.05, 0.15, 'triangle', 0.25);
  playNote(1047, 0.15, 0.2, 'triangle', 0.25);
}
// Vaihteen kääntö: b = haara (undefined = toiseen asentoon)
function trainFlip(j, b) {
  var J = train.jn[j], h = viewH, s;
  if (J.locked) { J.wob = 0.4; playNote(330, 0, 0.08, 'triangle', 0.15); return; }
  if (b === undefined) b = 1 - J.sel;
  if (b === J.sel) { J.wob = 0.35; playNote(784, 0, 0.08, 'sine', 0.15); return; }
  J.sel = b;
  J.flips++;
  J.wob = 0.5;
  J.flashT = 0;
  if (train.req >= 0) { s = train.st[train.req]; if (s.jn === j && s.br !== b) train.req = -1; }
  // Kolahdus, kipinät vivusta ja vaihteen kielistä
  playNote(196, 0, 0.07, 'square', 0.1);
  playNote(b === 0 ? 784 : 587, 0.05, 0.12, 'triangle', 0.25);
  playNote(b === 0 ? 1047 : 784, 0.13, 0.16, 'triangle', 0.22);
  spawnSparkles(J.sx, trainTY() - h * 0.01, 8, '#ffe27a');
  spawnSparkles(J.post - h * 0.07, h * 0.85, 5, '#ffd24f');
  artPop(J.post + h * 0.1, h * TRAIN_BOARD_Y[b], h * 0.09, '#ffd24f', 'ring');
}
// Veturi ehtii vaihteelle: haara lukittuu. Toiselle haaralle halunneet
// huiskuttavat ja odottavat seuraavaa samankuvaista asemaa.
function trainLock(j) {
  var J = train.jn[j], i, p, fm, any = false;
  J.locked = true;
  J.route = J.sel;
  J.flashT = 0;
  playNote(147, 0, 0.1, 'square', 0.08);
  playNote(220, 0.07, 0.1, 'triangle', 0.18);
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.dest < 0 || p.missed) continue;
    if (p.state !== 'ride' && p.state !== 'run' && !(p.state === 'hop' && p.anim && !p.anim.off)) continue;
    fm = trainFirstMatch(p.dest, j - 1);
    if (!fm || fm.k !== j || fm.b === J.route) continue;
    p.waveT = 2.2;
    any = true;
    if (!trainFirstMatch(p.dest, j)) trainRescue(p.dest, j);
  }
  if (any) {
    train.flawless = false;
    train.hintLever = true;
    playNote(523, 0.2, 0.15, 'triangle', 0.2);
    playNote(440, 0.35, 0.2, 'triangle', 0.2);
  }
}
// Juna seisoo asemalla i: ensin pois ohi ajaneet ja perille tulleet, sitten kyytiin odottajat
function trainArrive(i) {
  var st = train.st[i], k, p, off = [], on = [], h = viewH;
  train.mode = 'stand';
  train.v = 0;
  train.x = st.x;
  train.standT = 0;
  train.queueT = 0.4;
  train.atSt = i;
  st.visited = true;
  if (train.req === i) train.req = -1;
  if (i > 0 && !st.end) train.stops++;
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && p.missed) off.push(p);
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && !p.missed && (p.dest === st.icon || st.end)) off.push(p);
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.from === i && p.state === 'wait') on.push(p);
  }
  train.queue = [];
  for (k = 0; k < off.length; k++) train.queue.push({ off: true, p: off[k] });
  for (k = 0; k < on.length; k++) train.queue.push({ off: false, p: on[k] });
  if (st.end) train.gold = train.flawless;
  if (i > 0) {
    // Höyry pihahtaa jarruista
    for (k = 0; k < 6; k++) trainPuff(train.x - h * (0.05 + k * 0.03), trainTrackY(train.x - h * (0.05 + k * 0.03)) - h * 0.02, false, 0.5);
    playNote(392, 0, 0.15, 'triangle', 0.2);
    if (!off.length && !on.length) {
      // Turha pysähdys: asemapupu vilkuttaa, muuten ei mitään
      playNote(659, 0.3, 0.12, 'triangle', 0.25);
      playNote(880, 0.45, 0.16, 'triangle', 0.25);
    }
  }
}
function trainDepart() {
  train.mode = 'run';
  train.t = 0;
  trainWhistleSound();
  trainPuff(trainChimney().x, trainChimney().y, true);
}
// Ohitettu asema: kyydissä olevat huiskuttavat (jäävät pois seuraavalla pysähdyksellä),
// laiturin odottajat juoksevat junan perään
function trainPass(i) {
  var st = train.st[i], k, p, any = false, seat;
  st.passed = true;
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && !p.missed && p.dest === st.icon) { p.missed = true; p.waveT = 2.2; any = true; }
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.from !== i || p.state !== 'wait') continue;
    seat = trainFreeSeat(1e9, true);
    // Täysi juna (aiemmin ohi ajaneet yhä kyydissä): ne hyppäävät iloisina pois ja tekevät tilaa
    if (seat < 0) { trainDropMissed(); seat = trainFreeSeat(1e9, true); }
    if (seat < 0) continue;
    p.dest = trainPickDest(st.jn);
    train.seats[seat] = p;
    p.seat = seat;
    p.state = 'run';
    p.x = train.cam - viewW * 0.05 - p.slot * viewH * 0.12;
    p.y = st.platY;
    p.baseY = p.y;
    p.face = 1;
    any = true;
  }
  if (any) {
    train.flawless = false;
    train.hintNext = trainNextStation();
    playNote(523, 0, 0.15, 'triangle', 0.2);
    playNote(440, 0.15, 0.2, 'triangle', 0.2);
  }
}
// Ohi ajaneet hyppäävät pois heti (opastimella tai täydestä junasta) ja kävelevät takaisin
function trainDropMissed() {
  var k, p, sp;
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state !== 'ride' || !p.missed) continue;
    train.seats[p.seat] = null;
    sp = trainSeatPos(p.seat);
    p.x = sp.x; p.y = sp.y;
    p.seat = -1;
    p.face = -1;
    trainHop(p, sp.x - viewH * 0.04, trainGroundY(sp.x), 0.55, true);
  }
}
// Vapaa paikka: lähin x:ää (tail = takimmainen vapaa)
function trainFreeSeat(x, tail) {
  var j, best = -1, bd = 1e12, d;
  for (j = 0; j < TRAIN_SEATS; j++) {
    if (train.seats[j]) continue;
    d = tail ? -j : Math.abs(trainSeatPos(j).x - x);
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}
function trainHop(p, x1, y1, dur, off) {
  p.anim = { x0: p.x, y0: p.y, x1: x1, y1: y1, t: 0, dur: dur, off: off };
  p.state = 'hop';
}
function trainRunQueue() {
  var q = train.queue.shift(), p = q.p, sp, seat, st = train.st[train.atSt];
  if (q.off) {
    train.seats[p.seat] = null;
    sp = trainSeatPos(p.seat);
    p.x = sp.x; p.y = sp.y;
    p.seat = -1;
    p.face = -1;
    trainHop(p, sp.x - viewH * 0.02, trainGroundY(sp.x), 0.55, true);
    playNote(587, 0, 0.1, 'triangle', 0.2);
  } else {
    seat = trainFreeSeat(p.x, false);
    if (seat < 0) return;
    p.dest = trainPickDest(st ? st.jn : -1);
    train.seats[seat] = p;
    p.seat = seat;
    p.face = 1;
    sp = trainSeatPos(seat);
    trainHop(p, sp.x, sp.y, 0.55, false);
    playNote(659, 0, 0.1, 'triangle', 0.2);
  }
}
// Hyppy perillä: tähti ja ilo, tai ohi ajaneen iloinen kävely takaisin
function trainLanded(p) {
  if (!p.anim.off) {
    p.state = 'ride';
    p.anim = null;
    p.popT = 0.5;
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  p.anim = null;
  p.baseY = p.y;
  if (p.missed) {
    p.state = 'walkback';
    p.t = 0;
    p.face = -1;
    trainHearts(p.x, p.y - viewH * 0.1, 1);
    trainAnimalSound(p.kind);
    return;
  }
  p.state = 'cheer';
  p.t = 0;
  train.starN++;
  train.delivered++;
  train.hudBump = 0.4;
  soundStar(Math.min(12, train.delivered));
  trainAnimalSound(p.kind);
  artPop(p.x, p.y - viewH * 0.05, viewH * 0.07, TRAIN_ICONS[p.dest >= 0 ? p.dest : 6].color, 'burst');
  spawnSparkles(p.x, p.y - viewH * 0.06, 10, '#ffe27a');
}

// ---------- Savu, vihellys ja tähdet ----------
function trainPuff(x, y, big, life) {
  var h = viewH;
  if (train.puffs.length > 40) train.puffs.shift();
  train.puffs.push({
    x: x, y: y, r: h * (big ? 0.025 : 0.012), r1: h * (big ? 0.075 : 0.03),
    vy: -h * (big ? 0.55 : 0.16), vx: -viewW * (big ? 0.02 : 0.04), t: 0, life: life || (big ? 1.4 : 1.1), big: big
  });
}
function trainWhistleSound() {
  playNote(587, 0, 0.28, 'triangle', 0.22);
  playNote(740, 0, 0.28, 'triangle', 0.18);
  playNote(587, 0.34, 0.45, 'triangle', 0.22);
  playNote(740, 0.34, 0.45, 'triangle', 0.18);
}
function trainWhistle() {
  var ch = trainChimney(), i;
  if (train.whistleT > 0) return;
  train.whistleT = 0.3;
  train.whistles++;
  trainWhistleSound();
  trainPuff(ch.x, ch.y, true);
  trainPuff(ch.x - viewH * 0.02, ch.y + viewH * 0.01, true, 1.2);
  // Salaisuus: viides vihellys (ja sen jälkeen joka kymmenes) tuo kuumailmapallon
  if ((train.whistles === 5 || (train.whistles > 5 && train.whistles % 10 === 5)) && !train.balloon) {
    train.balloon = { x: viewW * 1.15, y: viewH * 0.2, t: 0, waveT: 0, drops: 0 };
    for (i = 0; i < 4; i++) playNote(784 * Math.pow(1.122, i), 0.5 + i * 0.1, 0.25, 'sine', 0.2);
  }
}
function trainUpdatePuffs(dt) {
  var i, p, k, s, d;
  for (i = train.puffs.length - 1; i >= 0; i--) {
    p = train.puffs[i];
    p.t += dt;
    if (p.t >= p.life) { train.puffs.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy *= Math.max(0, 1 - dt * (p.big ? 0.9 : 0.6));
    p.r += (p.r1 - p.r) * Math.min(1, dt * 3);
    // Savu nappaa tähdet
    for (k = 0; k < train.stars.length; k++) {
      s = train.stars[k];
      if (s.got) continue;
      d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < p.r + viewH * 0.02) trainStarGot(s);
    }
  }
}
function trainStarGot(s) {
  s.got = true;
  train.starN++;
  train.hudBump = 0.35;
  soundStar(Math.min(14, train.starN % 15));
  artPop(s.x, s.y, viewH * 0.05, '#ffe27a', 'ring');
  spawnSparkles(s.x, s.y, 6, '#ffe27a');
}

// ---------- Syöte ----------
// Vaihdekyltin osuma: 0/1 = nuolikyltti (valitsee haaran), 2 = vipu tai tolppa (kääntää), -1 = ohi
function trainPostHit(J, wx, py) {
  var h = viewH, bx = J.post + h * 0.1, b;
  for (b = 0; b < 2; b++) if (Math.abs(wx - bx) < h * 0.14 && Math.abs(py - h * TRAIN_BOARD_Y[b]) < h * 0.06) return b;
  if (Math.abs(wx - (J.post - h * 0.06)) < h * 0.13 && py > h * 0.72) return 2;
  if (Math.abs(wx - J.post) < h * 0.045 && py > h * 0.38) return 2;
  return -1;
}
function handleTrainTap(px, py) {
  var wx = px + train.cam, i, st, b, h = viewH, sx, J;
  if (puzzleBusy() || celebrating || !train.U) return;
  // Kuumailmapallo: pupu vilkuttaa ja pudottaa tähtiä
  b = train.balloon;
  if (b && Math.hypot(px - b.x, py - (b.y - h * 0.02)) < h * 0.1) {
    b.waveT = 1.2;
    soundBunny();
    if (b.drops < 3) {
      b.drops++;
      train.stars.push({ x: wx, y: b.y + h * 0.1, got: false, low: false, jn: -1, br: -1, ph: 0, fall: true });
      playNote(1319, 0.1, 0.15, 'sine', 0.25);
    }
    return;
  }
  // Vaihdekyltti ja vipu
  for (i = 0; i < train.jn.length; i++) {
    J = train.jn[i];
    sx = J.post - train.cam;
    if (!J.revealed || sx < -h * 0.4 || sx > viewW + h * 0.4) continue;
    b = trainPostHit(J, wx, py);
    if (b >= 0) { trainFlip(i, b === 2 ? undefined : b); return; }
  }
  if (propsTap(wx, py)) return;
  // Asema: kyltti, rakennus tai laituri
  for (i = 0; i < train.st.length; i++) {
    st = train.st[i];
    sx = st.x - train.cam;
    if (sx < -h * 0.9 || sx > viewW + h * 0.3) continue;
    var hitSign = Math.hypot(wx - (st.x + h * 0.045), py - st.signY) < h * 0.1 || (Math.abs(wx - (st.x + h * 0.045)) < h * 0.035 && py > st.signY && py < st.platY);
    var hitHouse = Math.abs(wx - (st.x - st.hx)) < h * 0.2 && py > st.ty - h * 0.32 && py < st.ty - h * 0.12;
    var hitPlat = wx > st.x - h * 0.8 && wx < st.x + h * 0.08 && py > st.ty + h * 0.04 && (st.br !== 0 || py < st.ty + h * 0.11);
    if (hitSign || hitHouse || hitPlat) { trainRequest(i); return; }
  }
  trainWhistle();
}

// ---------- Päivitys ----------
function updateTrain(dt) {
  var busy, i, p, sp, W = viewW, h = viewH, J;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (!train.U) return;
  busy = puzzleBusy();
  if (train.whistleT > 0) train.whistleT -= dt;
  if (train.brakeT > 0) train.brakeT -= dt;
  if (train.hudBump > 0) train.hudBump -= dt;
  for (i = 0; i < train.st.length; i++) if (train.st[i].wob > 0) train.st[i].wob -= dt;
  for (i = 0; i < train.jn.length; i++) {
    J = train.jn[i];
    if (J.wob > 0) J.wob -= dt;
    if (J.flashT > 0) J.flashT -= dt;
    J.lev += (J.sel - J.lev) * Math.min(1, dt * 12);
    J.levA += ((J.sel === 0 ? -0.55 : 0.55) - J.levA) * Math.min(1, dt * 16);
  }
  trainReveal();
  trainUpdatePuffs(dt);
  trainUpdateBalloon(dt);
  for (i = 0; i < train.stars.length; i++) {
    p = train.stars[i];
    p.ph += dt;
    if (p.got) continue;
    if (p.fall) {
      p.y += h * 0.12 * dt;
      p.x += (train.x + W * 0.12 - p.x) * Math.min(1, dt * 1.2);
      if (p.y > h * 0.42) p.fall = false;
    } else if (p.low && train.v > 0 && Math.abs(p.x - trainChimney().x) < h * 0.04) {
      // Haaran tähdet vain sillä raiteella, jota juna kulkee
      if (p.jn < 0 || trainJnBranch(train.jn[p.jn]) === p.br) trainStarGot(p);
    }
  }
  // Tasoristeyksen puomi laskee, kun juna on lähellä
  var near = train.cross > train.x - trainLength() - h * 0.3 && train.cross < train.x + W * 0.45;
  train.crossDown += ((near ? 1 : 0) - train.crossDown) * Math.min(1, dt * 3);
  trainUpdatePax(dt);
  if (busy || celebrating) return;
  train.t += dt;
  if (train.mode === 'stand') trainUpdateStand(dt);
  else if (train.mode === 'signal') trainUpdateSignal(dt);
  else if (train.mode === 'run') trainUpdateRun(dt);
  else if (train.mode === 'end') {
    train.endT += dt;
    if (train.endT > 2.2 && !train.won) { train.won = true; startCelebration(); }
  }
  train.cam = train.x - W * TRAIN_LEAD;
  // Kyydissä istuvat seuraavat junaa vasta sen liikuttua: muuten he (ja
  // kuplat) jäisivät ruudun verran jälkeen ja tärisisivät vaunuun nähden.
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.state === 'ride') { sp = trainSeatPos(p.seat); p.x = sp.x; p.y = sp.y; }
  }
}
function trainUpdateStand(dt) {
  var i, busyPax = false, st;
  train.standT += dt;
  if (train.standT < 0) return;
  if (train.queue.length) {
    train.queueT -= dt;
    if (train.queueT <= 0) { trainRunQueue(); train.queueT = 0.45; }
    return;
  }
  for (i = 0; i < train.pax.length; i++) if (train.pax[i].state === 'hop' || train.pax[i].state === 'run') busyPax = true;
  if (busyPax) return;
  st = train.st[train.atSt];
  if (st && st.end) {
    train.mode = 'end';
    train.endT = 0;
    if (train.gold) {
      for (i = 0; i < 6; i++) playNote(1047 * Math.pow(1.122, i), 0.3 + i * 0.08, 0.25, 'sine', 0.25);
      spawnSparkles(train.x - viewH * 0.1, trainTY() - viewH * 0.12, 24, '#ffd24f');
    }
    return;
  }
  if (train.standT > 1.3) trainDepart();
}
function trainUpdateSignal(dt) {
  var sg = train.sig[train.sigIdx], tk = tasks[sg.task];
  sg.t += dt;
  if (!sg.green) {
    if (tk.opened) {
      sg.green = true;
      sg.t = 0;
      playNote(1047, 0, 0.15, 'triangle', 0.3);
      playNote(1568, 0.12, 0.2, 'triangle', 0.3);
    } else if (sg.t > 0.7 && !activeTask) {
      taskStart(tk);
    }
    return;
  }
  if (sg.t > 0.8) trainDepart();
}
function trainUpdateRun(dt) {
  var W = viewW, S = viewH * TRAIN_VU, x = train.x, tg = trainTarget(), vc = TRAIN_V * S, ns = trainNextStation(), nj = trainNextJn(), d, vt, dv, lim, i, st;
  // Hiljennys: asema edessä tai vaihde tulossa (aikaa katsoa kylttiä ja kääntää vipua)
  if (nj >= 0 && train.jn[nj].sx - x > 0 && train.jn[nj].sx - x < W * (1 - TRAIN_LEAD) + viewH * (TRAIN_POST + 0.3)) vc = TRAIN_V_SW * S;
  if (ns >= 0 && train.st[ns].x - x > 0 && train.st[ns].x - x < W * 0.6) vc = TRAIN_V_NEAR * S;
  // Lähtö kiihtyy pehmeästi
  vc *= Math.min(1, 0.35 + train.t * 0.5);
  if (tg) {
    d = tg.x - x;
    vt = Math.min(d >= 0 ? vc : TRAIN_V_BACK * S, Math.sqrt(2 * TRAIN_BRK * S * 0.8 * Math.abs(d)));
    vt *= d >= 0 ? 1 : -1;
  } else {
    vt = vc;
  }
  dv = vt - train.v;
  lim = ((Math.abs(vt) < Math.abs(train.v) || vt * train.v < 0) ? TRAIN_BRK : TRAIN_ACC) * S * dt;
  train.v += Math.max(-lim, Math.min(lim, dv));
  train.x += train.v * dt;
  train.wheelA += train.v * dt;
  // Veturi vaihteella: haara lukittuu
  if (nj >= 0 && train.x >= train.jn[nj].sx) trainLock(nj);
  // Perillä
  if (tg) {
    d = tg.x - train.x;
    if ((Math.abs(d) < W * 0.004 && Math.abs(train.v) < W * 0.03) || (d * (tg.x - x) < 0 && Math.abs(train.v) < W * 0.05)) {
      train.x = tg.x;
      train.v = 0;
      if (tg.kind === 'signal') {
        train.mode = 'signal';
        train.sigIdx = tg.i;
        train.sig[tg.i].t = 0;
        trainDropMissed();
        playNote(392, 0, 0.15, 'triangle', 0.2);
      } else {
        trainArrive(tg.i);
      }
      return;
    }
  }
  // Ohitetut asemat (vain reitillä olevat, haara jo lukittu)
  for (i = 1; i < train.st.length - 1; i++) {
    st = train.st[i];
    if (st.visited || st.passed || train.req === i || !trainOnRoute(i)) continue;
    if (st.jn >= 0 && !train.jn[st.jn].locked) continue;
    if (train.x > st.x + W * TRAIN_GRACE) trainPass(i);
  }
  // Savu piipusta ja jarrukipinät
  train.puffT -= dt * Math.max(0.3, Math.abs(train.v) / (TRAIN_V * S));
  if (train.puffT <= 0 && !trainInTunnel(trainChimney().x)) {
    train.puffT = 0.42;
    trainPuff(trainChimney().x, trainChimney().y, false);
  }
  if (lim > 0 && dv < -lim * 0.5 && train.v > W * 0.02 && Math.random() < 0.3) {
    spawnSparkles(train.x - viewH * 0.12, trainTrackY(train.x - viewH * 0.12) - viewH * 0.01, 1, '#ffb040');
  }
}
function trainInTunnel(x) { return x > train.tunnel[0] && x < train.tunnel[1]; }
function trainUpdatePax(dt) {
  var i, p, k, sp, W = viewW, h = viewH;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    p.t += dt;
    if (p.waveT > 0) p.waveT -= dt;
    if (p.popT > 0) p.popT -= dt;
    if (p.state === 'ride') {
      sp = trainSeatPos(p.seat);
      p.x = sp.x; p.y = sp.y;
    } else if (p.state === 'hop') {
      p.anim.t += dt;
      // Kyytiin hyppäävä seuraa paikkaansa (juoksija hyppää liikkuvaan junaan)
      if (!p.anim.off) { sp = trainSeatPos(p.seat); p.anim.x1 = sp.x; p.anim.y1 = sp.y; }
      k = Math.min(1, p.anim.t / p.anim.dur);
      p.x = p.anim.x0 + (p.anim.x1 - p.anim.x0) * k;
      p.y = p.anim.y0 + (p.anim.y1 - p.anim.y0) * k - Math.sin(k * Math.PI) * h * 0.09;
      if (k >= 1) trainLanded(p);
    } else if (p.state === 'run') {
      sp = trainSeatPos(p.seat);
      p.x += (Math.max(0, train.v) + W * 0.17) * dt;
      p.y = p.baseY - Math.abs(Math.sin(p.t * 12)) * h * 0.012;
      if (p.x >= sp.x - h * 0.05) { p.y = p.baseY; trainHop(p, sp.x, sp.y, 0.45, false); }
    } else if (p.state === 'cheer') {
      if (p.t > 1.0) { p.state = 'walk'; p.t = 0; p.face = -1; }
    } else if (p.state === 'walk' || p.state === 'walkback') {
      p.x -= W * (p.state === 'walk' ? 0.06 : 0.09) * dt;
      p.alpha = Math.max(0, 1 - Math.max(0, p.t - (p.state === 'walk' ? 1.2 : 2.6)) / 0.6);
      if (p.alpha <= 0) p.state = 'gone';
    }
  }
}
function trainUpdateBalloon(dt) {
  var b = train.balloon;
  if (!b) return;
  b.t += dt;
  if (b.waveT > 0) b.waveT -= dt;
  b.x -= viewW * 0.07 * dt;
  b.y = viewH * 0.2 + Math.sin(b.t * 1.3) * viewH * 0.02;
  if (b.x < -viewW * 0.2) train.balloon = null;
}

// ---------- Piirto: tausta ----------
function trainEvening() {
  if (!train.st.length) return 0;
  var a = train.st[0].x, b = train.st[train.st.length - 1].x, p = (train.x - a) / (b - a);
  return Math.max(0, Math.min(1, (p - 0.62) / 0.36));
}
function renderTrainBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h * 0.7);
  g.addColorStop(0, '#6cc0ff');
  g.addColorStop(1, '#dff3ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.84, h * 0.15, h * 0.065, 1, '#fff4c8', '#fffdf0', '#ffd45a');
}
// Kaukaiset ja keskikukkulat parallaksina
function trainDrawHills(c, speed, y0, amp, color, wl, seed) {
  var W = viewW, h = viewH, off = train.cam * speed, x, step = W / 28, wx;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, h);
  for (x = 0; x <= W + step; x += step) {
    wx = (x + off) / (W * wl) + seed;
    c.lineTo(x, h * (y0 - amp * (0.55 + 0.45 * Math.sin(wx * Math.PI * 2) * Math.cos(wx * 1.7 + seed))));
  }
  c.lineTo(W, h);
  c.closePath();
  c.fill();
}
function trainDrawSkyLayer(c) {
  var W = viewW, h = viewH, eve = trainEvening(), i, x, g;
  if (eve > 0) {
    g = c.createLinearGradient(0, 0, 0, h * 0.7);
    g.addColorStop(0, 'rgba(120,90,200,' + (eve * 0.45) + ')');
    g.addColorStop(0.6, 'rgba(255,150,120,' + (eve * 0.4) + ')');
    g.addColorStop(1, 'rgba(255,200,140,' + (eve * 0.35) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, W, h * 0.75);
  }
  // Pilvet ajelehtivat hitaasti
  for (i = 0; i < 3; i++) {
    x = ((i * 0.47 * W - train.cam * 0.05 - globalT * W * 0.006) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
    drawCloud(c, x, h * (0.12 + i * 0.07), h * (0.035 + (i % 2) * 0.012), 0.9);
  }
  trainDrawHills(c, 0.08, 0.64, 0.12, artMix('#7fbf8a', '#dff3ff', 0.55 + eve * 0.1), 1.6, 0.3);
  trainDrawHills(c, 0.22, 0.69, 0.09, artMix('#6cb860', '#dff3ff', 0.32), 1.1, 1.7);
  // Keskikerroksen puurivi
  var off = train.cam * 0.22, k0 = Math.floor(off / (W * 0.13)) - 1, k;
  for (k = k0; k < k0 + 11; k++) {
    if (trainHash(k) < 0.45) continue;
    x = k * W * 0.13 - off + trainHash(k + 9) * W * 0.06;
    var ty = h * (0.665 + trainHash(k + 3) * 0.02), s = h * (0.025 + trainHash(k + 5) * 0.015);
    c.fillStyle = artMix('#4f9a4a', '#dff3ff', 0.3);
    c.fillRect(x - s * 0.12, ty - s * 0.6, s * 0.24, s * 0.7);
    c.beginPath(); c.arc(x, ty - s, s * 0.75, 0, Math.PI * 2); c.fill();
  }
}

// ---------- Piirto: maisema (maailmakoordinaatit, kamera käännetty) ----------
function trainThemeAt(x) {
  var j = trainJnAt(x), k;
  if (j >= 0) return train.jn[j].theme;
  for (k = 0; k < train.trunk.length; k++) if (x < train.trunk[k][1]) return train.trunk[k][2];
  return 'village';
}
function trainDrawGround(c) {
  var W = viewW, h = viewH, x0 = train.cam - 4, x1 = train.cam + W + 4, ty = trainTY(), i, k, x, s, g;
  // Nurmi
  g = c.createLinearGradient(0, h * 0.68, 0, h);
  g.addColorStop(0, '#9fdc78');
  g.addColorStop(1, '#6fbf4f');
  c.fillStyle = g;
  c.fillRect(x0, h * 0.68, x1 - x0, h * 0.34);
  // Pellot (pelto- ja niittyosuuksilla): raidalliset tilkut takarinteessä
  for (k = Math.floor(x0 / (W * 0.5)) - 1; k <= Math.floor(x1 / (W * 0.5)); k++) {
    x = k * W * 0.5;
    var th = trainThemeAt(x + W * 0.25);
    if (th !== 'fields' && th !== 'meadow' && th !== 'mills') continue;
    var col = ['#f2d36a', '#c9e27a', '#d8b07a', '#e8e07a'][((k % 4) + 4) % 4];
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + W * 0.02, h * 0.735); c.lineTo(x + W * 0.06, h * 0.69); c.lineTo(x + W * 0.47, h * 0.69); c.lineTo(x + W * 0.45, h * 0.735);
    c.closePath(); c.fill();
    c.strokeStyle = artShade(col, -0.18);
    c.lineWidth = Math.max(1, h * 0.003);
    for (i = 1; i < 4; i++) {
      c.beginPath(); c.moveTo(x + W * (0.02 + i * 0.01), h * (0.735 - i * 0.011)); c.lineTo(x + W * (0.455 - i * 0.002), h * (0.735 - i * 0.011)); c.stroke();
    }
  }
  // Joki ja silta
  trainDrawRiver(c);
  // Aita radan takana (pelloilla ja myllyillä)
  c.strokeStyle = '#b8844a';
  c.lineWidth = Math.max(1.5, h * 0.005);
  for (x = Math.floor(x0 / (h * 0.08)) * h * 0.08; x < x1; x += h * 0.08) {
    var t2 = trainThemeAt(x);
    if ((t2 !== 'fields' && t2 !== 'mills') || trainNearStation(x, h * 0.9)) continue;
    c.beginPath(); c.moveTo(x, ty - h * 0.045); c.lineTo(x, ty - h * 0.005); c.stroke();
  }
  for (k = 0; k < 2; k++) {
    c.beginPath();
    var on = false;
    for (x = Math.floor(x0 / (h * 0.08)) * h * 0.08; x < x1; x += h * 0.08) {
      var t3 = trainThemeAt(x), ok = (t3 === 'fields' || t3 === 'mills') && !trainNearStation(x, h * 0.9);
      if (ok && !on) { c.moveTo(x, ty - h * (0.035 - k * 0.018)); on = true; }
      else if (ok) c.lineTo(x, ty - h * (0.035 - k * 0.018));
      else on = false;
    }
    c.stroke();
  }
}
function trainNearStation(x, r) {
  var i;
  for (i = 0; i < train.st.length; i++) if (train.st[i].br !== 0 && x > train.st[i].x - r && x < train.st[i].x + viewH * 0.12) return true;
  return false;
}
function trainDrawRiver(c) {
  var h = viewH, r0 = train.river[0], r1 = train.river[1], ty = trainTY(), i, x;
  if (r1 < train.cam - 10 || r0 > train.cam + viewW + 10) return;
  var g = c.createLinearGradient(0, h * 0.7, 0, h);
  g.addColorStop(0, '#7fd4ff');
  g.addColorStop(1, '#3a9ad8');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(r0 + h * 0.1, h * 0.69);
  c.quadraticCurveTo(r0 - h * 0.05, h * 0.85, r0 + h * 0.02, h * 1.02);
  c.lineTo(r1 - h * 0.02, h * 1.02);
  c.quadraticCurveTo(r1 + h * 0.05, h * 0.85, r1 - h * 0.1, h * 0.69);
  c.closePath();
  c.fill();
  c.strokeStyle = '#e8d8a0';
  c.lineWidth = Math.max(2, h * 0.008);
  c.stroke();
  // Väreet
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 7; i++) {
    x = r0 + (r1 - r0) * (0.15 + 0.7 * trainHash(i + 40)) + Math.sin(globalT + i) * h * 0.01;
    var y = h * (0.74 + 0.03 * i);
    c.beginPath(); c.moveTo(x - h * 0.03, y); c.quadraticCurveTo(x, y - h * 0.008, x + h * 0.03, y); c.stroke();
  }
  // Silta: kivikaaret ja kansi
  var b0 = r0 - h * 0.05, b1 = r1 + h * 0.05, n = Math.max(2, Math.round((b1 - b0) / (h * 0.35))), w = (b1 - b0) / n;
  for (i = 0; i <= n; i++) {
    x = b0 + i * w;
    artRoundRect(c, x - h * 0.025, ty + h * 0.02, h * 0.05, h * 0.2, h * 0.01, '#c8b8a8', { lineColor: '#7a6a5a' });
  }
  c.strokeStyle = '#7a6a5a';
  c.lineWidth = Math.max(2, h * 0.012);
  for (i = 0; i < n; i++) {
    c.beginPath(); c.arc(b0 + (i + 0.5) * w, ty + h * 0.12, w / 2 - h * 0.02, Math.PI, 0); c.stroke();
  }
  artRoundRect(c, b0 - h * 0.03, ty + h * 0.015, b1 - b0 + h * 0.06, h * 0.035, h * 0.01, '#a87a5a', { lineColor: '#5a3a2a' });
}
function trainDrawTunnelBack(c) {
  var h = viewH, t0 = train.tunnel[0], t1 = train.tunnel[1], ty = trainTY();
  if (t1 + h * 0.6 < train.cam || t0 - h * 0.6 > train.cam + viewW) return;
  c.beginPath();
  c.moveTo(t0 - h * 0.5, ty + h * 0.02);
  c.bezierCurveTo(t0 - h * 0.2, ty - h * 0.2, t0 - h * 0.1, h * 0.43, t0 + h * 0.15, h * 0.42);
  c.lineTo(t1 - h * 0.15, h * 0.42);
  c.bezierCurveTo(t1 + h * 0.1, h * 0.43, t1 + h * 0.2, ty - h * 0.2, t1 + h * 0.5, ty + h * 0.02);
  c.closePath();
  artFillPath(c, '#7cc860', h * 0.42, ty, h * 0.2, { lineColor: '#3f8a3a', shadeTo: '#5aa848' });
  // Pieniä kukkia ja kiviä rinteellä
  var i, x;
  for (i = 0; i < 9; i++) {
    x = t0 + (t1 - t0) * (i / 8);
    drawFlower(c, x, h * (0.45 + 0.04 * trainHash(i + 70)), h * 0.008, ['#ff7bac', '#ffd24f', '#ffffff'][i % 3]);
  }
  // Tunnelin sisäseinä
  c.fillStyle = '#3a2e48';
  c.fillRect(t0, ty - h * 0.25, t1 - t0, h * 0.25 + h * 0.035);
}
// Junan päälle: tunnelin pimeys, katto ja suuaukot
function trainDrawTunnelFront(c) {
  var h = viewH, t0 = train.tunnel[0], t1 = train.tunnel[1], ty = trainTY(), k, x, a;
  if (t1 + h * 0.6 < train.cam || t0 - h * 0.6 > train.cam + viewW) return;
  c.fillStyle = 'rgba(24,16,40,0.72)';
  c.fillRect(t0, ty - h * 0.25, t1 - t0, h * 0.25 + h * 0.035);
  // Veturin valo pimeässä
  if (trainInTunnel(train.x - viewH * 0.02)) artGlow(c, train.x + h * 0.08, ty - h * 0.09, h * 0.16, '#fff2a0', 0.55);
  // Holvin kivikehykset
  for (k = 0; k < 2; k++) {
    x = k ? t1 : t0;
    c.strokeStyle = '#8a7a6a';
    c.lineWidth = h * 0.035;
    c.beginPath();
    c.moveTo(x, ty + h * 0.03);
    c.lineTo(x, ty - h * 0.25);
    c.stroke();
    a = h * 0.035;
    artRoundRect(c, x - a * 0.6, ty - h * 0.3, a * 1.2, h * 0.33, a * 0.3, '#b8a898', { lineColor: '#6a5a4a' });
  }
  artRoundRect(c, t0 - h * 0.03, ty - h * 0.3, t1 - t0 + h * 0.06, h * 0.05, h * 0.02, '#b8a898', { lineColor: '#6a5a4a' });
}
// Kylän tausta: kirkontorni ja puita (talot ovat tökättäviä koristeita)
function trainDrawVillage(c) {
  var h = viewH, x = train.trunk[6][0] + h * 0.8, ty = trainTY();
  if (x < train.cam - h * 0.4 || x > train.cam + viewW + h * 0.4) return;
  var b = ty - h * 0.06;
  artRoundRect(c, x - h * 0.05, b - h * 0.25, h * 0.1, h * 0.25, h * 0.01, '#f4ece0', { lineColor: '#a8907a' });
  c.beginPath(); c.moveTo(x - h * 0.065, b - h * 0.25); c.lineTo(x, b - h * 0.38); c.lineTo(x + h * 0.065, b - h * 0.25); c.closePath();
  artFillPath(c, '#5a8ad8', b - h * 0.38, b - h * 0.25, h * 0.05, {});
  artCircle(c, x, b - h * 0.19, h * 0.028, '#ffffff', { lineColor: '#5a4a3a' });
  c.strokeStyle = '#3a2a1a';
  c.lineWidth = Math.max(1, h * 0.004);
  c.beginPath(); c.moveTo(x, b - h * 0.19); c.lineTo(x, b - h * 0.21); c.moveTo(x, b - h * 0.19); c.lineTo(x + h * 0.014, b - h * 0.19); c.stroke();
}
function trainDrawTrack(c) {
  var h = viewH, x0 = train.cam - 4, x1 = train.cam + viewW + 4, ty = trainTY(), x, step = h * 0.045, r0 = train.river[0] - h * 0.05, r1 = train.river[1] + h * 0.05;
  // Tukikerros (ei sillalla)
  c.fillStyle = '#c8b090';
  if (x0 < r0) c.fillRect(x0, ty + h * 0.004, Math.min(x1, r0) - x0, h * 0.032);
  if (x1 > r1) c.fillRect(Math.max(x0, r1), ty + h * 0.004, x1 - Math.max(x0, r1), h * 0.032);
  c.fillStyle = '#7a5038';
  for (x = Math.floor(x0 / step) * step; x < x1; x += step) c.fillRect(x - h * 0.012, ty + h * 0.002, h * 0.024, h * 0.014);
  // Kisko
  c.fillStyle = '#7a7a8e';
  c.fillRect(x0, ty - h * 0.003, x1 - x0, h * 0.008);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.fillRect(x0, ty - h * 0.003, x1 - x0, h * 0.002);
  // Tasoristeyksen tie etualalla
  if (train.cross > x0 - h * 0.3 && train.cross < x1 + h * 0.3) {
    c.fillStyle = '#b8b0a8';
    c.beginPath();
    c.moveTo(train.cross - h * 0.06, ty - h * 0.02); c.lineTo(train.cross + h * 0.06, ty - h * 0.02);
    c.lineTo(train.cross + h * 0.12, h * 1.01); c.lineTo(train.cross - h * 0.12, h * 1.01);
    c.closePath(); c.fill();
  }
}
// Vaihteiden yläraiteen penkka: nurmipenger, jonka päällä yläraide kulkee
function trainDrawBanks(c) {
  var h = viewH, ty = trainTY(), j, J, x, n;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    if (J.ex + h * 0.2 < train.cam || J.sx - h * 0.2 > train.cam + viewW) continue;
    // Mäen laki jatkuu yläraiteen taakse, jotta yläaseman rakennus seisoo nurmella
    c.beginPath();
    c.moveTo(J.sx - h * 0.3, ty + h * 0.01);
    for (x = J.sx - h * 0.25; x <= J.ex + h * 0.25; x += h * 0.05) c.lineTo(x, trainTrackY(Math.max(J.sx, Math.min(J.ex, x)), 0) - h * 0.1 * trainUpShape((x - J.sx) / h) + h * 0.01);
    c.lineTo(J.ex + h * 0.3, ty + h * 0.01);
    c.closePath();
    artFillPath(c, '#93d46c', ty - h * (TRAIN_UP + 0.1), ty, h * 0.2, { lineColor: '#5aa848', shadeTo: '#79c056' });
    // Kukkia ja kiviä penkan kyljessä
    for (n = 0; n < 9; n++) {
      x = J.sx + h * (0.95 + n * 0.17);
      var y = ty - h * TRAIN_UP + h * (0.07 + trainHash(n + j * 13) * 0.08);
      if (n % 3 === 1) artBlob(c, x, y, h * 0.012, h * 0.008, '#c8c0b8', { lineColor: '#8a8078' });
      else drawFlower(c, x, y, h * 0.007, ['#ff7bac', '#ffd24f', '#ffffff'][n % 3]);
    }
  }
}
// Yläraide: tukikerros, ratapölkyt ja kisko kaarevaa polkua pitkin
function trainDrawUpperTrack(c) {
  var h = viewH, x0 = train.cam - h * 0.05, x1 = train.cam + viewW + h * 0.05, step = h * 0.045, j, J, x, xa, xb, y, a, k;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    if (J.ex < x0 || J.sx > x1) continue;
    xa = Math.max(J.sx, x0);
    xb = Math.min(J.ex, x1);
    c.lineCap = 'butt';
    c.lineJoin = 'round';
    c.strokeStyle = '#c8b090';
    c.lineWidth = h * 0.032;
    c.beginPath();
    for (x = xa, k = 0; x <= xb + h * 0.03; x += h * 0.03, k++) { y = trainTrackY(Math.min(x, J.ex), 0) + h * 0.02; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
    c.fillStyle = '#7a5038';
    for (x = Math.ceil(xa / step) * step; x < xb; x += step) {
      a = trainTrackAng(x, 0);
      c.save();
      c.translate(x, trainTrackY(x, 0));
      c.rotate(a);
      c.fillRect(-h * 0.012, h * 0.002, h * 0.024, h * 0.014);
      c.restore();
    }
    c.lineCap = 'round';
    c.strokeStyle = '#7a7a8e';
    c.lineWidth = h * 0.008;
    c.beginPath();
    for (x = xa, k = 0; x <= xb + h * 0.03; x += h * 0.03, k++) { y = trainTrackY(Math.min(x, J.ex), 0) + h * 0.001; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = h * 0.002;
    c.stroke();
  }
}
// Kääntyvä vaihde: kirkas kieli liukuu valitulle haaralle, ja valitulla
// raiteella vilkkuvat nuolet vaihdekyltiltä haaraan asti
function trainDrawSwitches(c) {
  var h = viewH, j, J, d, x, y, a, n, al, b;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    if (!J.revealed || J.locked || J.post - h * 0.3 > train.cam + viewW || J.sx + h * 1.0 < train.cam) continue;
    b = J.sel;
    // Kieli
    c.lineCap = 'round';
    for (n = 0; n < 2; n++) {
      c.strokeStyle = n ? '#ffe680' : '#8a6a10';
      c.lineWidth = h * (n ? 0.007 : 0.013);
      c.beginPath();
      for (d = 0; d <= h * 0.5; d += h * 0.025) {
        x = J.sx - h * 0.06 + d;
        y = trainTrackY(x, 0) + (trainTrackY(x, 1) - trainTrackY(x, 0)) * J.lev;
        if (d) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.stroke();
    }
    // Nuolet
    for (n = 0; n < 12; n++) {
      x = J.post + h * 0.15 + n * h * 0.12;
      if (x > J.sx + h * 0.9) break;
      y = trainTrackY(x, b) - h * 0.03;
      a = trainTrackAng(x, b);
      al = 0.3 + 0.6 * Math.max(0, Math.sin(globalT * 5 - n * 0.8));
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.globalAlpha = al;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.strokeStyle = '#8a6a10';
      c.lineWidth = h * 0.014;
      c.beginPath(); c.moveTo(-h * 0.018, -h * 0.018); c.lineTo(h * 0.008, 0); c.lineTo(-h * 0.018, h * 0.018); c.stroke();
      c.strokeStyle = '#ffe27a';
      c.lineWidth = h * 0.008;
      c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
  }
}
// Vaihdekyltti (kaksi nuolikylttiä haarojen asemien kuvin) ja vaihdevipu
function trainDrawPost(c, J) {
  var h = viewH, x = J.post, gy = h * 0.95, b, by, on, ic, wob = J.wob > 0 ? Math.sin(J.wob * 25) * J.wob * 0.3 : 0, r = h * 0.044;
  if (!J.revealed || x + h * 0.4 < train.cam || x - h * 0.3 > train.cam + viewW) return;
  artShadow(c, x, gy, h * 0.05, h * 0.012, 0.18);
  artLimb(c, x, gy, x, h * 0.4, h * 0.016, '#8a6a4a', '#4a3a2a');
  for (b = 0; b < 2; b++) {
    by = h * TRAIN_BOARD_Y[b];
    on = J.sel === b && !J.locked || J.locked && J.route === b;
    ic = TRAIN_ICONS[train.st[J.st[b]].icon];
    c.save();
    c.translate(x, by);
    c.rotate((b === 0 ? -0.28 : 0) + (on ? wob : 0));
    if (on && !J.locked) artGlow(c, h * 0.1, 0, h * 0.15, '#fff2a0', 0.55 + Math.sin(globalT * 5) * 0.15);
    c.beginPath();
    c.moveTo(-h * 0.01, -h * 0.04); c.lineTo(h * 0.16, -h * 0.04); c.lineTo(h * 0.215, 0); c.lineTo(h * 0.16, h * 0.04); c.lineTo(-h * 0.01, h * 0.04);
    c.closePath();
    artFillPath(c, on ? '#ffd24f' : '#d8d0c8', -h * 0.04, h * 0.04, h * 0.03, { lineColor: on ? '#a8780a' : '#8a8078' });
    if (!on) c.globalAlpha = 0.55;
    artCircle(c, h * 0.085, 0, r, '#ffffff', { lineColor: artShade(ic.color, -0.4), line: h * 0.005 });
    c.strokeStyle = ic.color;
    c.lineWidth = r * 0.16;
    c.beginPath(); c.arc(h * 0.085, 0, r * 0.86, 0, Math.PI * 2); c.stroke();
    trainDrawIcon(c, ic.id, h * 0.085, 0, r * 0.62);
    c.globalAlpha = 1;
    c.restore();
  }
  // Vipu: kallistuu taakse (ylähaara) tai eteen (alahaara)
  var px = x - h * 0.07, py = h * 0.935, L = h * 0.13, hx = px + Math.sin(J.levA) * L, hy = py - Math.cos(J.levA) * L;
  artLimb(c, px, py, hx, hy, h * 0.014, '#e8e8f0', '#5a5a6a');
  artCircle(c, hx, hy, h * 0.027, J.locked ? '#b8b0b8' : '#ff5a5a', { lineColor: J.locked ? '#6a6a6a' : '#8a2020', hi: 0.4 });
  artRoundRect(c, px - h * 0.04, py - h * 0.012, h * 0.08, h * 0.035, h * 0.01, '#6a6a7a', { lineColor: '#3a3a4a' });
}

// Etualan nurmi, kukat ja heinätupsut
function trainDrawFront(c) {
  var h = viewH, x0 = train.cam - h * 0.05, x1 = train.cam + viewW + h * 0.05, ty = trainTY(), k, x, y, th, cols = ['#ff7bac', '#ffd24f', '#b78bff', '#ffffff', '#ff9d5c'];
  var step = h * 0.09;
  for (k = Math.floor(x0 / step); k < x1 / step; k++) {
    x = k * step + trainHash(k) * step * 0.6;
    if (x > train.river[0] && x < train.river[1]) continue;
    if (train.cross && Math.abs(x - train.cross) < h * 0.13) continue;
    th = trainThemeAt(x);
    y = ty + h * (0.06 + trainHash(k + 17) * 0.1);
    if (trainNearStation(x, h * 0.85) && y < ty + h * 0.12) continue;
    if (th === 'meadow' || trainHash(k + 31) < 0.3) {
      c.strokeStyle = '#3f9a3a';
      c.lineWidth = Math.max(1, h * 0.003);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.02); c.stroke();
      drawFlower(c, x, y - h * 0.02, h * 0.007, cols[((k % cols.length) + cols.length) % cols.length]);
    } else {
      c.strokeStyle = '#5aa848';
      c.lineWidth = Math.max(1, h * 0.004);
      c.beginPath(); c.moveTo(x - h * 0.01, y); c.lineTo(x - h * 0.014, y - h * 0.018); c.moveTo(x, y); c.lineTo(x, y - h * 0.024); c.moveTo(x + h * 0.01, y); c.lineTo(x + h * 0.015, y - h * 0.017); c.stroke();
    }
  }
}

// ---------- Piirto: asemat ja opastimet ----------
function trainDrawStationBack(c, st, i) {
  // Alahaaran asema on pieni, jotta se mahtuu raiteiden väliin penkan eteen
  var h = viewH, ty = st.ty, ic = TRAIN_ICONS[st.icon], x = st.x - st.hx, b = ty - h * 0.03, small = st.br === 1;
  var w = st.end ? h * 0.5 : (small ? h * 0.3 : h * 0.34), hh = st.end ? h * 0.2 : (small ? h * 0.1 : h * 0.15), rf = small ? h * 0.05 : h * 0.08;
  if (st.x + h * 0.4 < train.cam || st.x - h * 1.0 > train.cam + viewW) return;
  artShadow(c, x, b, w * 0.6, h * 0.02, 0.15);
  artRoundRect(c, x - w / 2, b - hh, w, hh, h * 0.012, '#fff4e4', { lineColor: '#a8806a', shadeTo: '#ead4c0' });
  c.beginPath();
  c.moveTo(x - w * 0.6, b - hh + h * 0.005); c.lineTo(x - w * 0.42, b - hh - rf); c.lineTo(x + w * 0.42, b - hh - rf); c.lineTo(x + w * 0.6, b - hh + h * 0.005);
  c.closePath();
  artFillPath(c, ic.color, b - hh - rf, b - hh, h * 0.06, {});
  // Ovi ja ikkunat
  artRoundRect(c, x - h * 0.025, b - h * 0.09, h * 0.05, h * 0.09, h * 0.015, '#a86a3a', { lineColor: '#6a4020' });
  var lit = trainEvening() > 0.4;
  artRoundRect(c, x - w * 0.38, b - hh * 0.75, w * 0.18, hh * 0.35, h * 0.008, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
  artRoundRect(c, x + w * 0.2, b - hh * 0.75, w * 0.18, hh * 0.35, h * 0.008, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
  // Asemakello päädyssä
  artCircle(c, x, b - hh - rf * 0.44, small ? h * 0.016 : h * 0.022, '#ffffff', { lineColor: '#5a4a3a' });
  if (st.end) {
    // Pääteaseman juhlaviirit
    var k, fx;
    c.strokeStyle = '#8a6a4a';
    c.lineWidth = Math.max(1, h * 0.003);
    c.beginPath(); c.moveTo(x - w * 0.6, b - hh - h * 0.02); c.quadraticCurveTo(x, b - hh + h * 0.04, x + w * 0.6, b - hh - h * 0.02); c.stroke();
    for (k = 0; k < 9; k++) {
      fx = x - w * 0.55 + k * w * 0.1375;
      var fy = b - hh - h * 0.02 + Math.sin((k + 0.5) / 9 * Math.PI) * h * 0.028;
      c.fillStyle = maneColors[k % 6];
      c.beginPath(); c.moveTo(fx - h * 0.012, fy); c.lineTo(fx + h * 0.012, fy); c.lineTo(fx, fy + h * 0.025); c.closePath(); c.fill();
    }
  }
}
function trainDrawStationFront(c, st, i) {
  var h = viewH, ty = st.ty, ic = TRAIN_ICONS[st.icon], sx = st.x + h * 0.045, sy = st.signY, r = h * 0.058, wob, k;
  // Haara, jota juna ei kulkenut: kyltti himmenee
  var off = st.jn >= 0 && train.jn[st.jn].locked && train.jn[st.jn].route !== st.br;
  if (st.x + h * 0.4 < train.cam || st.x - h * 1.0 > train.cam + viewW) return;
  // Laituri etualalla
  artRoundRect(c, st.x - h * 0.8, ty + h * 0.045, h * 0.88, h * 0.06, h * 0.012, '#d8d0c8', { lineColor: '#8a8078', shadeTo: '#b8b0a8' });
  c.fillStyle = '#ffd24f';
  c.fillRect(st.x - h * 0.79, ty + h * 0.048, h * 0.86, h * 0.008);
  // Pysähdysmerkki: pyydetty asema hehkuu laiturilla
  if (train.req === i) {
    k = 0.5 + Math.sin(globalT * 6) * 0.25;
    artGlow(c, st.x - h * 0.36, ty + h * 0.075, h * 0.3, ic.color, k);
  }
  // Kyltti tolpassa
  wob = st.wob > 0 ? Math.sin(st.wob * 25) * st.wob * 0.4 : 0;
  artLimb(c, sx, ty + h * 0.08, sx, sy + r, h * 0.014, '#8a6a4a', '#4a3a2a');
  c.save();
  c.translate(sx, sy + r);
  c.rotate(wob);
  c.translate(0, -r);
  if (off) c.globalAlpha = 0.5;
  artCircle(c, 0, 0, r, '#ffffff', { lineColor: artShade(ic.color, -0.4), line: h * 0.008 });
  c.strokeStyle = ic.color;
  c.lineWidth = r * 0.16;
  c.beginPath(); c.arc(0, 0, r * 0.88, 0, Math.PI * 2); c.stroke();
  trainDrawIcon(c, ic.id, 0, 0, r * 0.62);
  if (st.visited && !st.start) {
    // Käyty: vihreä merkki
    artCircle(c, r * 0.7, -r * 0.7, r * 0.28, '#5cc04a', { lineColor: '#2a7a2a' });
    c.strokeStyle = '#ffffff';
    c.lineWidth = r * 0.09;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(r * 0.57, -r * 0.7); c.lineTo(r * 0.67, -r * 0.6); c.lineTo(r * 0.85, -r * 0.82); c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;
}
function trainDrawSignal(c, sg) {
  var h = viewH, ty = trainTY(), x = sg.x, y = h * 0.52;
  if (x < train.cam - h * 0.2 || x > train.cam + viewW + h * 0.2) return;
  artLimb(c, x, ty + h * 0.07, x, y + h * 0.05, h * 0.014, '#6a6a7a', '#3a3a4a');
  artRoundRect(c, x - h * 0.035, y - h * 0.06, h * 0.07, h * 0.13, h * 0.03, '#3a3a4a', { lineColor: '#1a1a2a' });
  var red = !sg.green;
  if (red) artGlow(c, x, y - h * 0.025, h * 0.06, '#ff4a4a', 0.5 + Math.sin(globalT * 5) * 0.2);
  else artGlow(c, x, y + h * 0.035, h * 0.06, '#5cff6a', 0.6);
  artCircle(c, x, y - h * 0.025, h * 0.02, red ? '#ff4a4a' : '#5a2a2a', { lineColor: '#1a1a2a' });
  artCircle(c, x, y + h * 0.035, h * 0.02, red ? '#2a5a2a' : '#5cff6a', { lineColor: '#1a1a2a' });
}

// ---------- Piirto: kuvat ----------
// Aseman kuva; color korvaa värin (kultakala)
function trainDrawIcon(c, id, x, y, r, color) {
  var i, a;
  if (id === 'berry') {
    c.beginPath();
    c.moveTo(x, y + r * 0.95);
    c.bezierCurveTo(x - r * 1.05, y + r * 0.2, x - r * 0.9, y - r * 0.75, x, y - r * 0.55);
    c.bezierCurveTo(x + r * 0.9, y - r * 0.75, x + r * 1.05, y + r * 0.2, x, y + r * 0.95);
    c.closePath();
    artFillPath(c, color || '#ff4a5a', y - r * 0.7, y + r, r, { lineColor: '#a82a3a' });
    c.fillStyle = '#fff6b0';
    for (i = 0; i < 6; i++) { c.beginPath(); c.arc(x + ((i % 3) - 1) * r * 0.35, y - r * 0.1 + Math.floor(i / 3) * r * 0.4, r * 0.06, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#4fae3a';
    for (i = 0; i < 4; i++) { a = -Math.PI / 2 + (i - 1.5) * 0.6; artBlob(c, x + Math.cos(a) * r * 0.25, y - r * 0.6 + Math.sin(a) * r * 0.12, r * 0.22, r * 0.1, '#4fae3a', { rot: a, lineColor: '#2a6a2a' }); }
  } else if (id === 'carrot') {
    for (i = 0; i < 3; i++) artBlob(c, x + (i - 1) * r * 0.25 + r * 0.25, y - r * 0.75, r * 0.1, r * 0.3, '#4fae3a', { rot: (i - 1) * 0.5 + 0.5, lineColor: '#2a6a2a' });
    c.beginPath();
    c.moveTo(x - r * 0.15, y - r * 0.55); c.quadraticCurveTo(x + r * 0.5, y - r * 0.75, x + r * 0.55, y - r * 0.3);
    c.lineTo(x - r * 0.55, y + r * 0.9);
    c.closePath();
    artFillPath(c, color || '#ff8a2a', y - r * 0.7, y + r * 0.9, r * 0.5, { lineColor: '#b0501a' });
  } else if (id === 'sun') {
    c.strokeStyle = '#ffb020';
    c.lineWidth = r * 0.16;
    c.lineCap = 'round';
    for (i = 0; i < 8; i++) {
      a = i * Math.PI / 4;
      c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68); c.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98); c.stroke();
    }
    artCircle(c, x, y, r * 0.52, color || '#ffd23a', { lineColor: '#d89020', hi: 0.4 });
    artEye(c, x - r * 0.17, y - r * 0.06, r * 0.07, 0, true);
    artEye(c, x + r * 0.17, y - r * 0.06, r * 0.07, 0, true);
    c.strokeStyle = '#b06010';
    c.lineWidth = r * 0.06;
    c.beginPath(); c.arc(x, y + r * 0.08, r * 0.16, 0.3, Math.PI - 0.3); c.stroke();
  } else if (id === 'apple') {
    artLimb(c, x, y - r * 0.55, x + r * 0.08, y - r * 0.9, r * 0.1, '#6a4020', false);
    artBlob(c, x + r * 0.3, y - r * 0.8, r * 0.25, r * 0.12, '#4fae3a', { rot: -0.4, lineColor: '#2a6a2a' });
    c.beginPath();
    c.moveTo(x, y - r * 0.5);
    c.bezierCurveTo(x - r * 0.4, y - r * 0.85, x - r * 0.95, y - r * 0.4, x - r * 0.75, y + r * 0.3);
    c.bezierCurveTo(x - r * 0.6, y + r * 0.85, x - r * 0.2, y + r * 0.95, x, y + r * 0.8);
    c.bezierCurveTo(x + r * 0.2, y + r * 0.95, x + r * 0.6, y + r * 0.85, x + r * 0.75, y + r * 0.3);
    c.bezierCurveTo(x + r * 0.95, y - r * 0.4, x + r * 0.4, y - r * 0.85, x, y - r * 0.5);
    c.closePath();
    artFillPath(c, color || '#6fd04a', y - r * 0.6, y + r * 0.9, r * 0.8, { lineColor: '#2f7a2a' });
    artHighlight(c, x - r * 0.35, y - r * 0.2, r * 0.15, r * 0.1, 0.5);
  } else if (id === 'fish') {
    var fc = color || '#4aa8ff';
    c.beginPath(); c.moveTo(x - r * 0.45, y); c.lineTo(x - r * 0.95, y - r * 0.4); c.lineTo(x - r * 0.95, y + r * 0.4); c.closePath();
    artFillPath(c, fc, y - r * 0.4, y + r * 0.4, r * 0.3, { lineColor: artShade(fc, -0.4) });
    artBlob(c, x + r * 0.1, y, r * 0.65, r * 0.42, fc, { lineColor: artShade(fc, -0.4), hi: 0.3 });
    artEye(c, x + r * 0.4, y - r * 0.08, r * 0.1, 0.5, false);
  } else if (id === 'flower') {
    for (i = 0; i < 5; i++) { a = i * Math.PI * 2 / 5 - Math.PI / 2; artCircle(c, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.36, color || '#b878ff', { lineColor: '#6a3aa8' }); }
    artCircle(c, x, y, r * 0.3, '#ffe060', { lineColor: '#c89020' });
  } else if (id === 'house') {
    artRoundRect(c, x - r * 0.6, y - r * 0.2, r * 1.2, r * 0.95, r * 0.08, '#fff4e8', { lineColor: '#a8806a' });
    c.beginPath(); c.moveTo(x - r * 0.85, y - r * 0.1); c.lineTo(x, y - r * 0.85); c.lineTo(x + r * 0.85, y - r * 0.1); c.closePath();
    artFillPath(c, color || '#ff7bac', y - r * 0.85, y - r * 0.1, r * 0.5, { lineColor: '#b8406a' });
    artRoundRect(c, x - r * 0.15, y + r * 0.25, r * 0.3, r * 0.5, r * 0.06, '#a86a3a', { lineColor: '#6a4020' });
    trainDrawHeart(c, x, y - r * 0.32, r * 0.14);
  } else if (id === 'flag') {
    artLimb(c, x - r * 0.4, y + r * 0.9, x - r * 0.4, y - r * 0.9, r * 0.12, '#8a6a4a', '#4a3a2a');
    c.beginPath(); c.moveTo(x - r * 0.35, y - r * 0.85); c.lineTo(x + r * 0.75, y - r * 0.5); c.lineTo(x - r * 0.35, y - r * 0.1); c.closePath();
    artFillPath(c, color || '#4fc39a', y - r * 0.85, y - r * 0.1, r * 0.4, { lineColor: '#2a7a5a' });
  }
}
// Puhekupla matkustajan yllä: aseman kuva (TRAIN_ICONS-indeksi) aseman värisessä renkaassa
function trainDrawBubble(c, x, y, r, icon, glow) {
  var ic = TRAIN_ICONS[icon];
  if (glow > 0) artGlow(c, x, y, r * 1.9, '#fff6a0', glow);
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(x - r * 0.25, y + r * 0.8); c.lineTo(x, y + r * 1.35); c.lineTo(x + r * 0.25, y + r * 0.8); c.closePath(); c.fill();
  artCircle(c, x, y, r, '#ffffff', { lineColor: artShade(ic.color, -0.35), line: Math.max(1.5, r * 0.1) });
  c.strokeStyle = ic.color;
  c.lineWidth = r * 0.14;
  c.beginPath(); c.arc(x, y, r * 0.84, 0, Math.PI * 2); c.stroke();
  trainDrawIcon(c, ic.id, x, y, r * 0.58);
}
function trainDrawWheel(c, x, y, r, ang, hub) {
  var i, a;
  artCircle(c, x, y, r, '#3a3040', { line: false });
  artCircle(c, x, y, r * 0.8, '#e85a4a', { lineColor: '#5a2020', line: Math.max(1, r * 0.12) });
  c.strokeStyle = '#7a2a2a';
  c.lineWidth = Math.max(1, r * 0.12);
  for (i = 0; i < 3; i++) {
    a = ang + i * Math.PI / 3;
    c.beginPath(); c.moveTo(x - Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7); c.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.stroke();
  }
  artCircle(c, x, y, r * 0.25, hub || '#ffd24f', { lineColor: '#8a6a20' });
}

// ---------- Piirto: eläimet ----------
// Origo jalkojen kohdalla, s ≈ puolet korkeudesta. o: { face, t, wave, graze }
function trainDrawAnimal(c, kind, x, y, s, o) {
  o = o || {};
  var f = o.face || 1, t = o.t || 0, blink = (t % 3.7) < 0.12, gz = o.graze ? Math.max(0, Math.sin(t * 0.7)) : 0;
  c.save();
  c.translate(x, y);
  c.scale(f, 1);
  if (kind === 'bunny') {
    drawBunny(c, 0, 0, s * 0.95, 0, t * 3, false);
    if (o.wave > 0) artLimb(c, s * 0.45, -s * 1.0, s * 0.85, -s * 1.5 - Math.sin(globalT * 14) * s * 0.25, s * 0.18, '#ffffff', '#c9a8d8');
    c.restore();
    return;
  }
  var body = { cow: '#ffffff', sheep: '#ffffff', pig: '#ffb8c8', hen: '#ffffff', duck: '#ffe060' }[kind];
  var line = { cow: '#7a6a7a', sheep: '#8a8098', pig: '#c8708a', hen: '#a89880', duck: '#c8a020' }[kind];
  var shade = { cow: '#e0d8ec', sheep: '#e4dcf0', pig: '#f098b0', hen: '#ece0d0', duck: '#f0c040' }[kind];
  var hx = s * 0.75, hy = -s * 1.3 + gz * s * 0.6;
  if (kind === 'cow' || kind === 'pig' || kind === 'sheep') {
    var legC = kind === 'sheep' ? '#4a4050' : body;
    artLimb(c, -s * 0.5, -s * 0.5, -s * 0.5, 0, s * 0.2, legC, line);
    artLimb(c, s * 0.45, -s * 0.5, s * 0.45, 0, s * 0.2, legC, line);
    if (kind === 'sheep') {
      artUnion(c, function (cc, xx, yy, ss) {
        cc.beginPath();
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; cc.moveTo(xx + Math.cos(a) * ss * 0.55 + ss * 0.35, yy + Math.sin(a) * ss * 0.32); cc.arc(xx + Math.cos(a) * ss * 0.55, yy + Math.sin(a) * ss * 0.32, ss * 0.35, 0, Math.PI * 2); }
      }, 0, -s * 0.8, s, -s * 1.2, -s * 0.4, body, { lineColor: line, shadeTo: shade });
    } else {
      artBlob(c, 0, -s * 0.8, s * 0.85, s * 0.5, body, { lineColor: line, shadeTo: shade, hi: 0.3 });
    }
    if (kind === 'cow') {
      artBlob(c, -s * 0.3, -s * 0.9, s * 0.25, s * 0.18, '#4a3a4a', { line: false });
      artBlob(c, s * 0.25, -s * 0.65, s * 0.18, s * 0.12, '#4a3a4a', { line: false });
      artLimb(c, -s * 0.85, -s * 0.9, -s * 1.05, -s * 0.5, s * 0.06, line, false);
    }
    if (kind === 'pig') {
      c.strokeStyle = line;
      c.lineWidth = Math.max(1, s * 0.07);
      c.beginPath(); c.arc(-s * 0.95, -s * 0.9, s * 0.12, 0, Math.PI * 1.6); c.stroke();
    }
    // Pää
    if (kind === 'cow') {
      artBlob(c, hx - s * 0.2, hy - s * 0.3, s * 0.18, s * 0.08, '#ffffff', { rot: -0.6, lineColor: line });
      artBlob(c, hx + s * 0.25, hy - s * 0.3, s * 0.18, s * 0.08, '#ffffff', { rot: 0.6, lineColor: line });
      artLimb(c, hx - s * 0.1, hy - s * 0.35, hx - s * 0.15, hy - s * 0.55, s * 0.08, '#fff0c0', '#a89060');
      artLimb(c, hx + s * 0.15, hy - s * 0.35, hx + s * 0.2, hy - s * 0.55, s * 0.08, '#fff0c0', '#a89060');
    }
    if (kind === 'pig') {
      c.beginPath(); c.moveTo(hx - s * 0.3, hy - s * 0.25); c.lineTo(hx - s * 0.15, hy - s * 0.6); c.lineTo(hx, hy - s * 0.3); c.closePath();
      artFillPath(c, body, hy - s * 0.6, hy - s * 0.25, s * 0.2, { lineColor: line });
    }
    if (kind === 'sheep') {
      artBlob(c, hx, hy, s * 0.33, s * 0.4, '#4a4050', { lineColor: '#2a2030' });
      artBlob(c, hx - s * 0.3, hy - s * 0.1, s * 0.16, s * 0.07, '#4a4050', { rot: 0.4, lineColor: '#2a2030' });
      artCircle(c, hx - s * 0.05, hy - s * 0.38, s * 0.2, body, { lineColor: line });
      artEye(c, hx + s * 0.12, hy - s * 0.06, s * 0.09, 0.5, blink);
    } else {
      artBlob(c, hx, hy, s * 0.42, s * 0.38, body, { lineColor: line, shadeTo: shade, hi: 0.3 });
      artBlob(c, hx + s * 0.22, hy + s * 0.12, s * 0.22, s * 0.16, kind === 'pig' ? '#ff98b0' : '#ffc0c8', { lineColor: line });
      c.fillStyle = artShade(line, -0.2);
      c.beginPath(); c.arc(hx + s * 0.16, hy + s * 0.12, s * 0.035, 0, Math.PI * 2); c.arc(hx + s * 0.3, hy + s * 0.12, s * 0.035, 0, Math.PI * 2); c.fill();
      artEye(c, hx + s * 0.05, hy - s * 0.12, s * 0.09, 0.5, blink);
      artBlush(c, hx - s * 0.12, hy + s * 0.05, s * 0.08);
    }
    if (o.wave > 0) artLimb(c, s * 0.4, -s * 0.9, s * 0.75, -s * 1.5 - Math.sin(globalT * 14) * s * 0.25, s * 0.16, body, line);
  } else {
    // Kana ja ankka: pyöreä vartalo, siipi, nokka
    artLimb(c, -s * 0.15, -s * 0.4, -s * 0.15, 0, s * 0.06, '#ff9a2a', '#b05a10');
    artLimb(c, s * 0.15, -s * 0.4, s * 0.15, 0, s * 0.06, '#ff9a2a', '#b05a10');
    artBlob(c, 0, -s * 0.75, s * 0.62, s * 0.52, body, { lineColor: line, shadeTo: shade, hi: 0.3 });
    c.beginPath(); c.moveTo(-s * 0.55, -s * 0.85); c.lineTo(-s * 0.85, -s * 1.15); c.lineTo(-s * 0.6, -s * 0.6); c.closePath();
    artFillPath(c, body, -s * 1.15, -s * 0.6, s * 0.2, { lineColor: line });
    var wa = o.wave > 0 ? Math.sin(globalT * 14) * 0.8 - 0.6 : 0;
    c.save();
    c.translate(-s * 0.05, -s * 0.8);
    c.rotate(wa);
    artBlob(c, 0, s * 0.05, s * 0.32, s * 0.2, shade, { lineColor: line, rot: 0.3 });
    c.restore();
    var hhx = s * 0.4, hhy = -s * 1.25 + gz * s * 0.5;
    artCircle(c, hhx, hhy, s * 0.32, body, { lineColor: line, shadeTo: shade });
    if (kind === 'hen') {
      artCircle(c, hhx - s * 0.05, hhy - s * 0.32, s * 0.1, '#ff4a4a', { lineColor: '#a82a2a' });
      artCircle(c, hhx + s * 0.1, hhy - s * 0.3, s * 0.09, '#ff4a4a', { lineColor: '#a82a2a' });
      c.beginPath(); c.moveTo(hhx + s * 0.28, hhy - s * 0.05); c.lineTo(hhx + s * 0.5, hhy + s * 0.03); c.lineTo(hhx + s * 0.28, hhy + s * 0.1); c.closePath();
      artFillPath(c, '#ffc02a', hhy - s * 0.05, hhy + s * 0.1, s * 0.1, { lineColor: '#b07a10' });
      artCircle(c, hhx + s * 0.25, hhy + s * 0.18, s * 0.06, '#ff4a4a', { line: false });
    } else {
      artBlob(c, hhx + s * 0.38, hhy + s * 0.05, s * 0.2, s * 0.08, '#ff9a2a', { lineColor: '#b05a10' });
    }
    artEye(c, hhx + s * 0.1, hhy - s * 0.06, s * 0.08, 0.5, blink);
    artBlush(c, hhx - s * 0.05, hhy + s * 0.1, s * 0.07);
  }
  c.restore();
}

// ---------- Piirto: juna ----------
function trainDrawLoco(c, x, gold) {
  var h = viewH, ty = trainTY(), body = gold ? '#ffd24f' : '#e85a4a', dark = gold ? '#a8780a' : '#7a2020', ang = train.wheelA / (h * 0.03), wr = h * 0.03;
  var trim = gold ? '#fff6c0' : '#ffd24f';
  // Runko ja pyörät
  artRoundRect(c, x - h * 0.205, ty - h * 0.06, h * 0.2, h * 0.025, h * 0.008, '#4a3a4a', { lineColor: '#2a1a2a' });
  trainDrawWheel(c, x - h * 0.155, ty - wr, wr, ang, trim);
  trainDrawWheel(c, x - h * 0.09, ty - wr, wr, ang, trim);
  trainDrawWheel(c, x - h * 0.03, ty - h * 0.018, h * 0.018, ang * 1.6, trim);
  c.strokeStyle = '#c0c0d0';
  c.lineWidth = Math.max(2, h * 0.007);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - h * 0.155 + Math.cos(ang) * wr * 0.5, ty - wr + Math.sin(ang) * wr * 0.5);
  c.lineTo(x - h * 0.09 + Math.cos(ang) * wr * 0.5, ty - wr + Math.sin(ang) * wr * 0.5);
  c.stroke();
  // Raivaaja
  c.beginPath(); c.moveTo(x - h * 0.012, ty - h * 0.055); c.lineTo(x + h * 0.025, ty - h * 0.006); c.lineTo(x - h * 0.012, ty - h * 0.006); c.closePath();
  artFillPath(c, '#5a5a6a', ty - h * 0.055, ty, h * 0.02, { lineColor: '#2a2a3a' });
  // Kattila
  artRoundRect(c, x - h * 0.14, ty - h * 0.128, h * 0.125, h * 0.072, h * 0.03, body, { lineColor: dark, hi: 0.25 });
  c.fillStyle = trim;
  c.fillRect(x - h * 0.115, ty - h * 0.126, h * 0.008, h * 0.068);
  c.fillRect(x - h * 0.075, ty - h * 0.126, h * 0.008, h * 0.068);
  artCircle(c, x - h * 0.016, ty - h * 0.092, h * 0.034, '#4a4a5a', { lineColor: '#2a2a3a' });
  artCircle(c, x - h * 0.014, ty - h * 0.092, h * 0.012, trim, { lineColor: dark });
  // Lamppu
  if (trainEvening() > 0.3 || trainInTunnel(x)) artGlow(c, x + h * 0.01, ty - h * 0.135, h * 0.05, '#fff2a0', 0.6);
  artRoundRect(c, x - h * 0.03, ty - h * 0.15, h * 0.03, h * 0.025, h * 0.008, '#fff2a0', { lineColor: '#8a7a3a' });
  // Piippu ja dome
  c.beginPath();
  c.moveTo(x - h * 0.058, ty - h * 0.125); c.lineTo(x - h * 0.054, ty - h * 0.19); c.lineTo(x - h * 0.066, ty - h * 0.215);
  c.lineTo(x - h * 0.024, ty - h * 0.215); c.lineTo(x - h * 0.036, ty - h * 0.19); c.lineTo(x - h * 0.032, ty - h * 0.125);
  c.closePath();
  artFillPath(c, '#4a4a5a', ty - h * 0.215, ty - h * 0.125, h * 0.02, { lineColor: '#2a2a3a' });
  artBlob(c, x - h * 0.092, ty - h * 0.13, h * 0.017, h * 0.014, trim, { lineColor: dark, hi: 0.4 });
  // Ohjaamo: prinsessa ikkunassa
  var cx0 = x - h * 0.205, cx1 = x - h * 0.13;
  artRoundRect(c, cx0, ty - h * 0.175, cx1 - cx0, h * 0.12, h * 0.01, body, { lineColor: dark });
  var wx0 = cx0 + h * 0.01, wy0 = ty - h * 0.165, ww = h * 0.055, wh = h * 0.055;
  c.fillStyle = trainInTunnel(x) ? '#3a2a4a' : '#fff0d8';
  c.fillRect(wx0, wy0, ww, wh);
  c.save();
  c.beginPath(); c.rect(wx0, wy0, ww, wh); c.clip();
  drawRiderPrincess(c, wx0 + ww * 0.5, ty - h * 0.08, h * 0.0021, globalT, train.mode === 'run');
  c.restore();
  c.strokeStyle = dark;
  c.lineWidth = Math.max(1.5, h * 0.005);
  c.strokeRect(wx0, wy0, ww, wh);
  artRoundRect(c, cx0 - h * 0.01, ty - h * 0.192, cx1 - cx0 + h * 0.02, h * 0.02, h * 0.008, gold ? '#fff0a0' : '#5a3a6a', { lineColor: gold ? '#a8780a' : '#2a1a3a' });
  if (gold && Math.random() < 0.15) spawnSparkles(x - Math.random() * h * 0.2, trainTrackY(x - h * 0.1) - Math.random() * h * 0.18, 1, '#fff2a0');
}
function trainDrawCar(c, k, cx) {
  var h = viewH, ty = trainTY(), col = TRAIN_CAR_COLS[k], L = h * TRAIN_CARL, ang = train.wheelA / (h * 0.022);
  artRoundRect(c, cx - L * 0.48, ty - h * 0.045, L * 0.96, h * 0.014, h * 0.005, '#4a3a4a', { line: false });
  trainDrawWheel(c, cx - L * 0.3, ty - h * 0.022, h * 0.022, ang, '#ffd24f');
  trainDrawWheel(c, cx + L * 0.3, ty - h * 0.022, h * 0.022, ang, '#ffd24f');
}
function trainDrawCarFront(c, k, cx) {
  var h = viewH, ty = trainTY(), col = TRAIN_CAR_COLS[k], L = h * TRAIN_CARL, i;
  artRoundRect(c, cx - L / 2, ty - h * 0.1, L, h * 0.062, h * 0.012, col, { lineColor: artShade(col, -0.45), hi: 0.2 });
  c.strokeStyle = artShade(col, -0.2);
  c.lineWidth = Math.max(1, h * 0.003);
  for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cx - L / 2 + L * i / 4, ty - h * 0.095); c.lineTo(cx - L / 2 + L * i / 4, ty - h * 0.043); c.stroke(); }
  artRoundRect(c, cx - L / 2 - h * 0.004, ty - h * 0.106, L + h * 0.008, h * 0.014, h * 0.006, artShade(col, -0.25), { lineColor: artShade(col, -0.5) });
  // Kytkin seuraavaan
  c.strokeStyle = '#4a3a4a';
  c.lineWidth = Math.max(2, h * 0.006);
  c.beginPath(); c.moveTo(cx + L / 2, ty - h * 0.05); c.lineTo(cx + L / 2 + h * TRAIN_CGAP, ty - h * 0.05); c.stroke();
}
function trainDrawPassenger(c, p) {
  var h = viewH, s = h * TRAIN_ANIMAL, bob = 0, ns, o = { face: p.face, t: p.t, wave: p.waveT > 0 || p.state === 'walkback' ? 1 : 0 };
  if (p.state === 'gone') return;
  if (p.x < train.cam - h * 0.2 || p.x > train.cam + viewW + h * 0.2) return;
  if (p.state === 'ride') {
    ns = trainNextStation();
    // Innostus: oma asema näkyy edessä
    if (!p.missed && ns >= 0 && train.st[ns].icon === p.dest && train.st[ns].x - train.cam < viewW * 1.05) bob = Math.abs(Math.sin(globalT * 8)) * h * 0.012;
    else bob = Math.abs(Math.sin(globalT * 3 + p.seat)) * h * 0.003;
  } else if (p.state === 'cheer') {
    bob = Math.abs(Math.sin(p.t * 9)) * h * 0.03;
  } else if (p.state === 'walk' || p.state === 'walkback') {
    bob = Math.abs(Math.sin(p.t * 10)) * h * 0.01;
  } else if (p.state === 'wait') {
    bob = Math.abs(Math.sin(globalT * 2.5 + p.slot)) * h * 0.004;
    o.wave = trainNextStation() === p.from && train.st[p.from].x - train.cam < viewW * 1.1 ? 1 : 0;
  }
  if (p.alpha < 1) c.globalAlpha = p.alpha;
  if (p.state !== 'ride' && p.state !== 'hop') artShadow(c, p.x, p.y, s * 0.9, s * 0.2, 0.15);
  trainDrawAnimal(c, p.kind, p.x, p.y - bob, s, o);
  c.globalAlpha = 1;
}
// Kuplat kyydissä olevien yllä. Hehku: oma asema on seuraavana edessä, tai
// oma vaihde on tulossa ja vaihdekyltti näkyy (katso kuvaa, käännä vipu).
function trainDrawBubbles(c) {
  var i, p, h = viewH, r = h * 0.032, ns = trainNextStation(), nj = trainNextJn(), glow, y, fm, J, pop, postOn;
  J = nj >= 0 ? train.jn[nj] : null;
  postOn = J && J.revealed && J.post - train.cam < viewW * 1.0;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.state !== 'ride' || p.missed || p.dest < 0) continue;
    if (p.x < train.cam - h * 0.2 || p.x > train.cam + viewW + h * 0.2) continue;
    glow = 0;
    if (ns >= 0 && train.st[ns].icon === p.dest && train.st[ns].x - train.cam < viewW * 1.05) glow = 0.45 + Math.sin(globalT * 6) * 0.2;
    else if (postOn) {
      fm = trainFirstMatch(p.dest, nj - 1);
      if (fm && fm.k === nj) glow = 0.35 + Math.sin(globalT * 6) * 0.15;
    }
    pop = p.popT > 0 ? 1 + Math.sin((0.5 - p.popT) / 0.5 * Math.PI) * 0.35 : 1;
    y = p.y - h * (0.152 + (p.seat % 2 ? 0 : 0.035));
    trainDrawBubble(c, p.x, y, r * pop, p.dest, glow);
  }
}
function trainDrawTrain(c) {
  var k, cx, i, p, h = viewH;
  for (k = 0; k < TRAIN_CARS; k++) {
    cx = trainCarX(train.x, k);
    trainTilt(c, cx);
    trainDrawCar(c, k, cx);
    c.restore();
  }
  // Matkustajat istuvat vaunuissa (vaunun etuseinä peittää alaosan)
  for (i = 0; i < train.pax.length; i++) { p = train.pax[i]; if (p.state === 'ride') trainDrawPassenger(c, p); }
  for (k = 0; k < TRAIN_CARS; k++) {
    cx = trainCarX(train.x, k);
    trainTilt(c, cx);
    trainDrawCarFront(c, k, cx);
    c.restore();
  }
  trainTilt(c, train.x - h * 0.1);
  trainDrawLoco(c, train.x, train.gold);
  c.restore();
}
// Yläraiteen laiturilla (penkalla) olevat piirretään alaraiteen junan taakse
function trainPaxUpper(p) { return p.state !== 'ride' && p.y < trainTY() - viewH * 0.02; }
function trainDrawPuffs(c) {
  var i, p, a;
  for (i = 0; i < train.puffs.length; i++) {
    p = train.puffs[i];
    a = 1 - p.t / p.life;
    c.globalAlpha = Math.max(0, a) * (p.big ? 0.9 : 0.75);
    artCircle(c, p.x, p.y, p.r, '#ffffff', { lineColor: '#c8c0d8', shadeTo: '#e4dcf0', line: Math.max(1, p.r * 0.08) });
  }
  c.globalAlpha = 1;
}
function trainDrawStars(c) {
  var i, s, h = viewH;
  for (i = 0; i < train.stars.length; i++) {
    s = train.stars[i];
    if (s.got || s.x < train.cam - h * 0.1 || s.x > train.cam + viewW + h * 0.1) continue;
    drawStar(c, s.x, s.y + Math.sin(s.ph * 2) * h * 0.006, h * 0.02, Math.sin(s.ph) * 0.2, 0.6);
  }
}
function trainDrawBalloon(c) {
  var b = train.balloon, h = viewH, s = h * 0.06, i;
  if (!b) return;
  c.strokeStyle = '#8a6a4a';
  c.lineWidth = Math.max(1, h * 0.003);
  c.beginPath(); c.moveTo(b.x - s * 0.5, b.y + s * 0.6); c.lineTo(b.x - s * 0.3, b.y + s * 1.3); c.moveTo(b.x + s * 0.5, b.y + s * 0.6); c.lineTo(b.x + s * 0.3, b.y + s * 1.3); c.stroke();
  for (i = 0; i < 6; i++) {
    c.beginPath();
    c.moveTo(b.x, b.y + s * 0.75);
    c.bezierCurveTo(b.x - s * (1.1 - i * 0.37), b.y + s * 0.2, b.x - s * (1.2 - i * 0.4), b.y - s * 1.1, b.x, b.y - s * 1.05);
    c.bezierCurveTo(b.x - s * (1.0 - (i + 1) * 0.33), b.y - s * 1.1, b.x - s * (0.9 - (i + 1) * 0.3), b.y + s * 0.2, b.x, b.y + s * 0.75);
    c.fillStyle = maneColors[i];
    c.fill();
  }
  c.strokeStyle = '#8a4a6a';
  c.lineWidth = Math.max(1, h * 0.003);
  c.beginPath(); c.ellipse(b.x, b.y - s * 0.2, s * 0.98, s * 0.92, 0, 0, Math.PI * 2); c.stroke();
  drawBunny(c, b.x, b.y + s * 1.25, s * 0.3, b.waveT > 0 ? Math.abs(Math.sin(b.waveT * 10)) * s * 0.15 : 0, globalT * 6, false);
  artRoundRect(c, b.x - s * 0.35, b.y + s * 1.15, s * 0.7, s * 0.4, s * 0.08, '#c8945a', { lineColor: '#6a4020' });
}

function drawTrain() {
  var c = ctx, h = viewH, W = viewW, i, st, k, hand = null, p, J, nj, w;
  if (!beginPlayWorld()) return;
  if (!train.U) { endPlayWorld(); return; }
  trainDrawSkyLayer(c);
  if (train.balloon) trainDrawBalloon(c);
  c.save();
  c.translate(-train.cam, 0);
  trainDrawGround(c);
  trainDrawVillage(c);
  trainDrawTunnelBack(c);
  trainDrawBanks(c);
  for (i = 0; i < train.st.length; i++) trainDrawStationBack(c, train.st[i], i);
  // Koristeet: kamera perutaan, propsDraw siirtää itse camX:n verran
  c.save();
  c.translate(train.cam, 0);
  camX = train.cam;
  propsDraw(c, 0);
  camX = 0;
  c.restore();
  // Yläraide ja sen asemat (laituri, kyltti, odottajat) jäävät alaraiteen junan taakse
  trainDrawUpperTrack(c);
  for (i = 0; i < train.st.length; i++) if (train.st[i].br === 0) trainDrawStationFront(c, train.st[i], i);
  for (i = 0; i < train.pax.length; i++) { p = train.pax[i]; if (trainPaxUpper(p)) trainDrawPassenger(c, p); }
  trainDrawTrack(c);
  trainDrawSwitches(c);
  trainDrawPuffs(c);
  trainDrawTrain(c);
  trainDrawTunnelFront(c);
  c.save();
  c.translate(train.cam, 0);
  camX = train.cam;
  propsDraw(c, 1);
  camX = 0;
  c.restore();
  trainDrawFront(c);
  for (i = 0; i < train.st.length; i++) if (train.st[i].br !== 0) trainDrawStationFront(c, train.st[i], i);
  for (i = 0; i < train.sig.length; i++) trainDrawSignal(c, train.sig[i]);
  for (i = 0; i < train.jn.length; i++) trainDrawPost(c, train.jn[i]);
  for (i = 0; i < train.pax.length; i++) { p = train.pax[i]; if (p.state !== 'ride' && !trainPaxUpper(p)) trainDrawPassenger(c, p); }
  c.save();
  c.translate(train.cam, 0);
  camX = train.cam;
  propsDraw(c, 2);
  camX = 0;
  c.restore();
  trainDrawBubbles(c);
  trainDrawStars(c);
  c.restore();
  // Hiukkaset ja pop-efektit ovat maailmakoordinaateissa
  camX = train.cam;
  drawParticlesLayer(c);
  // Vihjekädet: vaihdevipu (ensimmäinen vaihde, väärän haaran jälkeen
  // seuraavat ja toisen haaran aseman napautus), sitten asemat ja korkeat tähdet
  if (!puzzleBusy() && !celebrating) {
    nj = trainNextJn();
    if (nj >= 0) {
      J = train.jn[nj];
      w = trainWanted(nj - 1)[nj];
      k = J.post - h * 0.07 - train.cam;
      if (J.revealed && k > W * 0.06 && k < W * 0.96 && (J.flashT > 0 || (w !== undefined && w !== J.sel && (nj === 0 || train.hintLever)))) {
        hand = { x: k + Math.sin(J.levA) * h * 0.13, y: h * 0.935 - Math.cos(J.levA) * h * 0.13 + h * 0.03 };
      }
    }
    for (i = 1; i < train.st.length - 1 && !hand; i++) {
      st = train.st[i];
      if (st.visited || st.passed || train.req === i || !trainOnRoute(i) || !trainStationWanted(i)) continue;
      if (train.stops > 0 && i !== train.hintNext) continue;
      if (st.jn >= 0 && !train.jn[st.jn].locked && train.stops > 0) continue;
      k = st.x + h * 0.045 - train.cam;
      if (k > W * 0.08 && k < W * 0.96) hand = { x: k, y: st.signY };
    }
    if (!hand && train.whistles === 0 && train.firstHigh >= 0 && train.stops > 0 && train.mode === 'run') {
      var fs = train.stars[train.firstHigh];
      if (!fs.got && fs.x - train.cam < W * 1.0 && fs.x - train.cam > W * 0.3) hand = { x: train.x - h * 0.1 - train.cam, y: trainTrackY(train.x - h * 0.1) - h * 0.12 };
    }
    if (hand) {
      k = (globalT % 1.1) / 1.1;
      drawHand(c, hand.x - h * 0.005, hand.y - h * 0.04 - Math.abs(Math.sin(k * Math.PI)) * h * 0.04, h * 0.045);
    }
  }
  endPlayWorld();
  camX = 0;
  drawTrainHud(c);
  drawTaskOverlay(c);
}

// HUD: tähtien määrä ja reittikartta (vaihteet haaroineen, asemien kuvat, juna liikkuu)
function drawTrainHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), W = viewW, i, j, st, x, J, bump = train.hudBump > 0 ? 1 + train.hudBump * 0.6 : 1;
  if (!train.U) return;
  drawHudPanel(c, left, pad * 0.5, hs * 6.4, hs * 3.4, hs);
  drawStar(c, left + hs * 1.7, pad * 0.5 + hs * 1.7, hs * 1.0 * bump, 0, 0.4);
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(hs * 1.6) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(train.starN + '', left + hs * 3.1, pad * 0.5 + hs * 1.85);
  c.textBaseline = 'alphabetic';
  // Reitti: runkoviiva, vaihteiden yläkaaret ja asemat
  var n = train.st.length, x0 = W * 0.36, x1 = W * 0.88, top = pad * 0.5, y = top + hs * 3.0, yu = top + hs * 1.25, a = train.st[0].x, b = train.st[n - 1].x;
  var X = function (wx) { return x0 + (x1 - x0) * (wx - a) / (b - a); };
  drawHudPanel(c, x0 - hs * 1.6, top, x1 - x0 + hs * 3.2, hs * 4.3, hs);
  c.lineCap = 'round';
  c.lineWidth = hs * 0.35;
  for (j = 0; j < train.jn.length; j++) {
    J = train.jn[j];
    c.strokeStyle = J.locked && J.route === 1 ? 'rgba(122,80,56,0.3)' : 'rgba(122,80,56,0.7)';
    c.beginPath();
    c.moveTo(X(J.sx), y);
    c.bezierCurveTo(X(J.sx) + hs * 0.6, y, X(J.sx) + hs * 0.2, yu, X(J.sx) + hs * 1.2, yu);
    c.lineTo(X(J.ex) - hs * 1.2, yu);
    c.bezierCurveTo(X(J.ex) - hs * 0.2, yu, X(J.ex) - hs * 0.6, y, X(J.ex), y);
    c.stroke();
  }
  c.strokeStyle = 'rgba(122,80,56,0.7)';
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  for (i = 0; i < n; i++) {
    st = train.st[i];
    x = X(st.x);
    var sy = st.br === 0 ? yu : y, r = st.jn >= 0 ? hs * 0.85 : hs * 1.05, ic = TRAIN_ICONS[st.icon];
    var off = st.passed || (st.jn >= 0 && train.jn[st.jn].locked && train.jn[st.jn].route !== st.br);
    if (st.jn >= 0 && !train.jn[st.jn].revealed) {
      // Vielä näkymätön asema: pelkkä pallukka
      artCircle(c, x, sy, r * 0.5, '#e8e0d8', { lineColor: '#a89888', line: hs * 0.12 });
      continue;
    }
    c.globalAlpha = off ? 0.4 : 1;
    artCircle(c, x, sy, r, '#ffffff', { lineColor: ic.color, line: hs * 0.2 });
    trainDrawIcon(c, ic.id, x, sy, r * 0.65);
    if (st.visited && !st.start) artCircle(c, x + r * 0.75, sy - r * 0.75, hs * 0.36, '#5cc04a', { lineColor: '#ffffff', line: hs * 0.12 });
    c.globalAlpha = 1;
  }
  for (i = 0; i < train.sig.length; i++) {
    x = X(train.sig[i].x);
    artCircle(c, x, y + hs * 0.9, hs * 0.3, train.sig[i].green ? '#5cff6a' : '#ff4a4a', { lineColor: '#3a3a4a', line: hs * 0.08 });
  }
  // Juna: nousee kartalla yläkaarelle, kun se kulkee yläraidetta
  var f = Math.max(0, Math.min(1, (train.x - a) / (b - a))), ty = y;
  j = trainJnAt(train.x);
  if (j >= 0 && trainJnBranch(train.jn[j]) === 0) ty = y + (yu - y) * trainUpShape((train.x - train.jn[j].sx) / viewH);
  x = x0 + (x1 - x0) * f;
  artRoundRect(c, x - hs * 0.6, ty + hs * 0.35, hs * 1.2, hs * 0.75, hs * 0.2, train.gold ? '#ffd24f' : '#e85a4a', { lineColor: '#5a2020', line: hs * 0.1 });
  artRoundRect(c, x - hs * 0.15, ty + hs * 0.05, hs * 0.3, hs * 0.4, hs * 0.08, '#4a4a5a', { line: false });
}

HUB_ICONS.train = function (c, x, y, s) {
  var k = (globalT * 0.8) % 1;
  c.globalAlpha = 1 - k;
  artCircle(c, x + s * 0.06, y - s * 0.16 - k * s * 0.12, s * (0.03 + k * 0.04), '#ffffff', { lineColor: '#c8c0d8' });
  c.globalAlpha = 1;
  artRoundRect(c, x - s * 0.18, y - s * 0.06, s * 0.28, s * 0.1, s * 0.04, '#e85a4a', { lineColor: '#7a2020' });
  artRoundRect(c, x - s * 0.22, y - s * 0.14, s * 0.11, s * 0.18, s * 0.02, '#e85a4a', { lineColor: '#7a2020' });
  artRoundRect(c, x - s * 0.24, y - s * 0.16, s * 0.15, s * 0.03, s * 0.01, '#5a3a6a', { line: false });
  artRoundRect(c, x + s * 0.04, y - s * 0.14, s * 0.04, s * 0.08, s * 0.01, '#4a4a5a', { line: false });
  trainDrawWheel(c, x - s * 0.15, y + s * 0.07, s * 0.05, globalT * 3, '#ffd24f');
  trainDrawWheel(c, x + s * 0.0, y + s * 0.07, s * 0.05, globalT * 3, '#ffd24f');
  trainDrawWheel(c, x + s * 0.09, y + s * 0.08, s * 0.035, globalT * 3, '#ffd24f');
};

// Maalaiskylän sokkelon maasto: pienet pellot, aita, kukat ja heinäpaalit
HUB_TILE_DECOR.farm = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.8, i, col;
  if (rnd < 0.16) {
    // Peltotilkku vakoineen
    col = rnd2 < 0.5 ? '#f2d36a' : '#d8b07a';
    artRoundRect(b, x + s * 0.18, y + s * 0.3, s * 0.64, s * 0.45, s * 0.08, col, { lineColor: artShade(col, -0.3), line: Math.max(1, s * 0.02) });
    b.strokeStyle = artShade(col, -0.2);
    b.lineWidth = Math.max(1, s * 0.025);
    for (i = 1; i < 4; i++) { b.beginPath(); b.moveTo(x + s * 0.24, y + s * (0.3 + i * 0.11)); b.lineTo(x + s * 0.76, y + s * (0.3 + i * 0.11)); b.stroke(); }
  } else if (rnd < 0.28) {
    // Aidanpätkä
    b.strokeStyle = '#b8844a';
    b.lineWidth = Math.max(1.5, s * 0.04);
    b.lineCap = 'round';
    for (i = 0; i < 3; i++) { b.beginPath(); b.moveTo(x + s * (0.25 + i * 0.25), by); b.lineTo(x + s * (0.25 + i * 0.25), by - s * 0.22); b.stroke(); }
    b.beginPath(); b.moveTo(x + s * 0.2, by - s * 0.16); b.lineTo(x + s * 0.8, by - s * 0.16); b.moveTo(x + s * 0.2, by - s * 0.07); b.lineTo(x + s * 0.8, by - s * 0.07); b.stroke();
  } else if (rnd < 0.4) {
    drawFlower(b, bx - s * 0.12, by - s * 0.1, s * 0.035, '#ff7bac');
    drawFlower(b, bx + s * 0.12, by - s * 0.04, s * 0.03, '#ffd24f');
  } else if (rnd < 0.48) {
    // Heinäpaali
    artBlob(b, bx, by - s * 0.1, s * 0.14, s * 0.1, '#f2cf6a', { lineColor: '#a8803a' });
    b.strokeStyle = 'rgba(168,128,58,0.6)';
    b.lineWidth = Math.max(1, s * 0.015);
    b.beginPath(); b.arc(bx - s * 0.05, by - s * 0.1, s * 0.05, 0, Math.PI * 2); b.stroke();
  } else if (rnd < 0.6) {
    b.strokeStyle = 'rgba(70,140,60,0.45)';
    b.lineWidth = Math.max(1, s * 0.02);
    b.beginPath(); b.moveTo(bx - s * 0.04, by); b.lineTo(bx - s * 0.06, by - s * 0.08); b.moveTo(bx, by); b.lineTo(bx, by - s * 0.1); b.moveTo(bx + s * 0.04, by); b.lineTo(bx + s * 0.06, by - s * 0.08); b.stroke();
  }
};
