'use strict';

// Yllätysjuhlat (Kaukamaa, Myrskyvuori, huone J): prinsessa ja vuoren eläimet
// valmistelevat Myrskynoidalle salaiset juhlat huipun alapuolen niitylle.
// Kukaan ei kutsunut noitaa sateenkaarijuhliin, joten nyt hänelle tehdään
// omat. Yksi ruutu; kaikki valmiit koristeet jäävät näkyviin:
//   1. Viirinauha: kaksi narua tolppien välissä. Narun alussa olevat viirit
//      näyttävät kuvion (AB tai ABC, toisessa AAB tai ABBC) ja soivat
//      omilla sävelillään. Viiri raahataan korista tyhjään koukkuun. Väärä
//      viiri heilahtaa ja putoaa takaisin koriin.
//   2. Ilmapallot: viisi tolppaa, joista jokaisessa on oma väri ja koko
//      (katkoviivapallo). Väri valitaan napauttamalla pussia, ja pumpun
//      kahvaa pidetään pohjassa: pallo kasvaa ja kasvu kiihtyy lopussa.
//      Pallon ympärillä hehkuu rengas, joka näyttää oikean koon. Päästä
//      irti, kun reuna on renkaassa -> pallo solmitaan ja lentää tolppaan.
//      Liian iso -> PAM! (konfetti ja nauru, uusi pallo). Liian pieni ->
//      pallo jää pumppuun ja vuotaa hiljaa, joten pumppaamista jatketaan.
//   3. Sateenkaarikakku: jäähdytysritilältä seitsemän pohjaa sateenkaaren
//      järjestykseen alhaalta (punainen) ylös (violetti); väärä liukuu
//      takaisin. Kermavaahto hangataan sormella kakun päälle. Sitten
//      kynttilöitä yhtä monta kuin vieraita: taikatulitikku raahataan
//      kakulle, ja jokainen syttyvä kynttilä lähettää kipinän yhdelle
//      vieraalle (yksi yhteen). Jos joku jää ilman tai kipinä jää yli,
//      kynttilät sammuvat ja määrää korjataan. Lopuksi tähtisädetikku.
//   4. Vieraat (vuorikauris, murmeli, kotka, pöllö, kettu, lumijänis; 4–6
//      arvottuna) saapuvat pitkin kenttää. Jokainen raahataan omalle
//      paikalleen; paikkakortissa on sen kuva. Istuvat vieraat ovat
//      tökättäviä (kettu soittaa kitaraa, kauris harmonikkaa...).
//   5. YLLÄTYS: eläimet piiloutuvat, noita lentää luudallaan murjottaen
//      alas, ja lapsi napauttaa konfettitykkiä: YL-LÄ-TYS! Noidan kyynel
//      muuttuu hymyksi, ja hänen pilvensä sataa kimalletta ja sateenkaaren.
// Jännite koko kentän ajan: noidan oma pieni sadepilvi kurkkii välillä
// harjanteen takaa. Ensin pilven yläreuna ja silmät nousevat hitaasti
// (hmm-hmm), sitten se tuijottaa niittyä. Ennen sitä lapsi vetää
// naamioverhon narusta alas (raahaus alas): kalliolta näyttävä kangas
// rullautuu juhlatavaroiden yli, eläimet piiloutuvat kivien taakse (korvat
// jäävät näkyviin) ja prinsessa viheltelee viattomana. Pilvi mutisee ja
// laskeutuu; lapsi nostaa verhon samaa narua ylös raahaamalla. Jos pilvi
// näkee: kysymysmerkki ja lyhyt sadekuuro, ja yksi valmis koriste kärsii
// (viiri putoaa, pallo karkaa, kerma valuu, kerros liukuu, kynttilä kaatuu)
// ja se tehdään uudestaan. 2–3 kurkistusta asemaa kohden arvotuissa
// kohdissa, ei koskaan aseman ensimmäisen eleen aikana. Kultainen
// juhlahattu (+1 tähti), jos pilvi ei nähnyt kertaakaan.

// ---------- Säätövakiot ----------
var PRT_WARN = [1.8, 1.3];           // varoitus (s): kentän alussa -> lopussa
var PRT_WARN_FIRST = 2.8;            // ensimmäinen kurkistus: hidas, haamukäsi näyttää narun
var PRT_GRACE = 0.2;                 // silmät aukeavat ennen kuin pilvi näkee (s)
var PRT_LOOK = 3.0;                  // tuijotus (s)
var PRT_MUTTER = 1.0;                // mutina, katsoo yhä (s)
var PRT_SINK = 0.9;                  // laskeutuminen (s)
var PRT_PEEKS = [2, 3];              // kurkistuksia asemaa kohden
var PRT_PEEK_FROM = 0.12;            // kurkistukset aseman edistymisen välillä ...
var PRT_PEEK_TO = 0.9;               // ... (osuus aseman tehtävistä)
var PRT_PEEK_DELAY = [0.6, 3.2];     // viive kynnyksen ylityksestä (s)
var PRT_PEEK_GAP = 6;                // vähimmäisväli kurkistusten välillä (s)
var PRT_COVER = 0.96;                // verho lasketaan alhaalla olevaksi
var PRT_PUMP_T = 3.4;                // tyhjästä poksahdukseen jatkuvalla pumppauksella (s)
var PRT_PUMP_WIN = 0.5;              // oikean koon ikkuna (s)
var PRT_PUMP_EXP = 1.6;              // kasvun kiihtyminen (säde ~ p^1,6)
var PRT_LEAK = 0.2;                  // vuoto, kun ei pumpata (p/s)
var PRT_BAL_R = [0.03, 0.043, 0.056];   // ilmapallojen koot (× viewH)
var PRT_CREAM_LEN = 3.2;             // kerman hankausmatka (× viewH)
var PRT_GUESTS = [4, 6];             // vieraita (arvotaan)
var PRT_HOOKS = 8;                   // tyhjiä koukkuja narua kohden
var PRT_HINT_IDLE = 7;               // vihjekäsi toimettomuuden jälkeen (s)

var PRT_PEN = [
  { col: '#ff6f9a', sym: 'heart', note: 523 },
  { col: '#ffcf3f', sym: 'star', note: 659 },
  { col: '#5fb4ff', sym: 'flower', note: 784 },
  { col: '#6fd06a', sym: 'leaf', note: 587 },
  { col: '#b68cff', sym: 'moon', note: 880 }
];
var PRT_PAT1 = ['AB', 'ABC'];
var PRT_PAT2 = ['AAB', 'ABBC'];
var PRT_SHOWN = { AB: 4, ABC: 5, AAB: 6, ABBC: 6 };
var PRT_BAL_COLS = ['#ff5a7a', '#ff9f3a', '#ffd83a', '#5fd36b', '#4aa8ff', '#a07aff', '#ff8fd0'];
var PRT_KINDS = ['goat', 'marmot', 'eagle', 'owl', 'fox', 'hare'];
var PRT_ST_UNITS = [16, 5, 11];      // asemien tehtäväyksiköt (kakku: 7 + kerma 2 + kynttilät + sädetikku)

var prt = {
  L: null, t: 0, idleT: 0, st: 0, stT: 0, trans: 0, sub: '', stStarted: false, unitsDone: 0,
  cur: { k: 0, kd: 0, goal: 0, tick: 0, thump: 0 },
  cloud: { st: 'off', t: 0, x: 0, warn: 2, blush: 0, seen: false, dmg: null, sx: 0, sy: 0, tx: 0, ty: 0, look: 0, hihi: 0 },
  peekPlan: [], peekDelay: -1, peekGap: 0, peekN: 0, seenN: 0, firstPeek: true, hatLostT: 0,
  strings: [], basket: [], posts: [], bags: [], pump: null, cake: null, guests: [], seats: [], arrivals: [],
  drag: null, flies: [], puffs: [], bits: [], shown: {}, hintStep: null, hintT: 0,
  fin: null, celT: 0, prin: null, cv: {}, pops: 0, wrongs: 0, starsGiven: false, toolK: {}, banner: null
};

// ---------- Pienet apurit ----------
function prtEll(c, x, y, rx, ry) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  else { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); }
}
function prtText(c, txt, x, y, size, col, line) {
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
function prtHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
}
function prtStarPath(c, x, y, r, rot) {
  var i, a, rr;
  c.beginPath();
  for (i = 0; i < 10; i++) {
    rr = i % 2 === 0 ? r : r * 0.46;
    a = (i / 10) * Math.PI * 2 - Math.PI / 2 + (rot || 0);
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
function prtClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function prtLerp(a, b, k) { return a + (b - a) * k; }
function prtRange(r) { return r[0] + Math.random() * (r[1] - r[0]); }
// Toistettava satunnaisuus taustoihin (sama kuva joka piirrolla)
function prtSeeded(seed) {
  var s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
}
function prtAct() { prt.idleT = 0; }
function prtPuff(x, y, n, col, o) {
  var i;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (prt.puffs.length > 80) prt.puffs.shift();
    prt.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * (o.spread || 0.03), y: y + (Math.random() - 0.5) * viewH * 0.015,
      vx: (Math.random() - 0.5) * viewH * (o.vx || 0.08), vy: viewH * (o.vy !== undefined ? o.vy : -(0.05 + Math.random() * 0.07)),
      r: viewH * (o.r || 0.011) * (0.7 + Math.random() * 0.6), t: 0, life: o.life || (0.7 + Math.random() * 0.5),
      col: col || '#ffffff', kind: o.kind || 'dot', g: o.g || 0, rot: Math.random() * 6
    });
  }
}
// Konfetti- ja kimallepalat (omat, koska yhteinen konfetti liikkuu vain juhlassa)
function prtBits(x, y, n, o) {
  var i, a, sp;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (prt.bits.length > 160) prt.bits.shift();
    a = (o.a0 !== undefined ? o.a0 : -Math.PI / 2) + (Math.random() - 0.5) * (o.spread || 2.2);
    sp = viewH * (o.sp || 0.9) * (0.4 + Math.random() * 0.8);
    prt.bits.push({
      x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      s: viewH * (o.s || 0.012) * (0.6 + Math.random() * 0.7), t: 0, life: o.life || (1.4 + Math.random() * 0.8),
      col: o.cols ? o.cols[i % o.cols.length] : RAINBOW_COLORS[i % 7], star: !!o.star, drag: o.drag || 1.6
    });
  }
}

// ---------- Asettelu ----------
// Kaikki viewH-yksiköissä; leveys vaihtelee 4:3 – 16:10 (ja leveämpi).
function prtLayout() {
  var W = viewW, H = viewH, L = { W: W, H: H }, i, n, x, sp, x0, x1;
  L.cx = W / 2;
  L.ridgeY = H * 0.262;
  L.barY = H * 0.292;
  L.poleL = H * 0.05;
  L.poleR = W - H * 0.115;
  L.ropeX = W - H * 0.058;
  L.curTop = L.barY + H * 0.008;
  L.curBot = H * 0.872;
  L.handUp = H * 0.53;
  L.handDown = H * 0.86;
  L.str = [{ y: H * 0.338, sag: H * 0.024 }, { y: H * 0.41, sag: H * 0.024 }];
  L.strX0 = L.poleL + H * 0.045;
  L.strX1 = L.poleR - H * 0.045;
  L.penH = H * 0.058;
  L.penW = Math.min(H * 0.064, (L.strX1 - L.strX0) / 14 * 0.8);
  L.tableY = H * 0.705;
  L.tableX0 = Math.max(H * 0.16, L.cx - H * 0.47);
  L.tableX1 = Math.min(L.poleR - H * 0.06, L.cx + H * 0.47);
  L.cakeX = L.cx;
  L.standY = L.tableY - H * 0.03;
  L.layerW = H * 0.17;
  L.layerH = H * 0.02;
  L.guestR = H * 0.041;
  // Ilmapallotolpat: keskimmäinen korkea (pallo kakun yllä)
  sp = Math.min(H * 0.25, (L.poleR - L.poleL) * 0.2);
  L.posts = [];
  for (i = 0; i < 5; i++) {
    x = L.cx + (i - 2) * sp;
    L.posts.push({ x: x, y: i === 2 ? H * 0.43 : H * 0.54 - (i % 2) * H * 0.02 });
  }
  // Työkalut niityllä pöydän edessä
  L.ground = H * 0.872;
  L.basket = { x: H * 0.255, y: H * 0.868 };
  L.pump = { x: H * 0.2, y: H * 0.872 };
  L.nozzle = { x: H * 0.29, y: H * 0.775 };
  L.balC = { x: L.nozzle.x, y: L.nozzle.y - H * 0.078 };
  L.bags = [];
  x0 = L.cx + H * 0.03;
  x1 = Math.min(L.poleR - H * 0.2, L.cx + H * 0.42);
  for (i = 0; i < 5; i++) L.bags.push({ x: x0 + (x1 - x0) * i / 4, y: H * 0.865 });
  L.rack = [];
  sp = Math.min(H * 0.1, (L.poleR - H * 0.2 - H * 0.36) / 7);
  for (i = 0; i < 7; i++) L.rack.push({ x: L.cx + (i - 3) * sp, y: H * 0.855 });
  L.rackSp = sp;
  L.bowl = { x: L.cx + H * 0.2, y: H * 0.865 };
  L.candleBox = { x: L.cx - H * 0.17, y: H * 0.868 };
  L.match = { x: L.cx + H * 0.17, y: H * 0.868 };
  L.jar = { x: L.cx + H * 0.05, y: H * 0.868 };
  L.wait = [{ x: L.poleR - H * 0.075, y: H * 0.865 }, { x: L.poleR - H * 0.17, y: H * 0.81 }];
  // Etualan kivet (piilopaikat) ja prinsessa
  L.rocks = [
    { x: Math.max(H * 0.3, L.cx - H * 0.4), w: H * 0.24, top: H * 0.885 },
    { x: L.cx + H * 0.16, w: H * 0.22, top: H * 0.895 },
    { x: W - H * 0.21, w: H * 0.24, top: H * 0.885 }
  ];
  L.prin = { x: H * 0.09, y: H * 0.985 };
  L.cannon = { x: (L.rocks[0].x + L.rocks[0].w * 0.5 + L.rocks[1].x - L.rocks[1].w * 0.5) / 2, y: H * 0.985 };
  L.witchLand = { x: L.cx + H * 0.015, y: H * 0.47 };
  L.summit = { x: W * 0.8, y: H * 0.08 };
  // Harjanteen ääriviiva (pilvi kurkkii sen takaa)
  L.ridge = [];
  n = Math.ceil(W / (H * 0.02)) + 1;
  for (i = 0; i <= n; i++) {
    x = i * W / n;
    L.ridge.push({ x: x, y: prtRidgeFn(x, H) });
  }
  prt.L = L;
}
function prtRidgeFn(x, H) {
  var u = x / H;
  return H * 0.262 - H * (0.018 * Math.sin(u * 3.1 + 0.7) + 0.011 * Math.sin(u * 7.3 + 1.1) + 0.006 * Math.abs(Math.sin(u * 13.7)));
}
function prtRidgeAt(x) { return prtRidgeFn(x, viewH); }
// Narun koukkujen paikat
function prtHookPos(si, i) {
  var L = prt.L, s = L.str[si], S = prt.strings[si], n = S ? S.n : 14, k = (i + 0.5) / n;
  var x = L.strX0 + (L.strX1 - L.strX0) * k;
  return { x: x, y: s.y + Math.sin(k * Math.PI) * s.sag };
}
function prtSeatPos(i) {
  var L = prt.L, G = prt.seats.length, nl = Math.ceil(G / 2), off;
  if (i < nl) off = -(prtSeat0() + (nl - 1 - i) * prtSeatSp());
  else off = prtSeat0() + (i - nl) * prtSeatSp();
  return { x: L.cx + off * viewH, y: L.tableY + viewH * 0.018 };
}
function prtSeat0() { return 0.165; }
function prtSeatSp() { return prt.seats.length >= 6 ? 0.125 : 0.14; }
function prtCakeTopY(n) { return prt.L.standY - (n === undefined ? prt.cake.layers.length : n) * prt.L.layerH; }

// ---------- Alustus ----------
function initParty() {
  tasks = [];
  camX = 0;
  prtLayout();
  prt.t = 0;
  prt.idleT = 0;
  prt.st = 0;
  prt.stT = 0;
  prt.trans = 0;
  prt.sub = '';
  prt.stStarted = false;
  prt.cur = { k: 0, kd: 0, goal: 0, tick: 0, thump: 0, lastK: 0 };
  prt.cloud = { st: 'off', t: 0, x: 0, warn: 2, blush: 0, seen: false, dmg: null, sx: 0, sy: 0, tx: 0, ty: 0, look: 0, hihi: 0, duck: 0 };
  prt.peekPlan = prtMakePeekPlan(0);
  prt.peekDelay = -1;
  prt.peekGap = 4;
  prt.peekN = 0;
  prt.seenN = 0;
  prt.firstPeek = true;
  prt.hatLostT = 0;
  prt.drag = null;
  prt.flies = [];
  prt.puffs = [];
  prt.bits = [];
  prt.shown = {};
  prt.hintStep = null;
  prt.hintT = 0;
  prt.fin = null;
  prt.celT = 0;
  prt.pops = 0;
  prt.wrongs = 0;
  prt.starsGiven = false;
  prt.banner = null;
  prt.matchWob = 0;
  prt.whistled = false;
  prt.toolK = { basket: 0, pump: 0, rack: 0, bowl: 0, box: 0, match: 0, jar: 0 };
  prt.prin = { t: 0, bang: 0, whistle: 0, shh: 0, poke: 0, pokeN: 0, cheer: 0, spin: 0, wave: 0 };
  prtMakeStrings();
  prtMakeBalloons();
  prtMakeCake();
  prtMakeGuests();
  prtSetupProps();
  prtRenderLayers();
  renderBackground();
  playNote(523, 0, 0.18, 'triangle', 0.25);
  playNote(659, 0.12, 0.18, 'triangle', 0.25);
  playNote(784, 0.24, 0.18, 'triangle', 0.25);
  playNote(1047, 0.36, 0.35, 'triangle', 0.25);
}
function respawnParty() {}
function resizeParty() {
  var i, g;
  camX = 0;
  if (!prt.L) return;
  prtLayout();
  prtSetupProps();
  prtRenderLayers();
  if (prt.drag) prtCancelDrag();
  prt.flies = [];
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st === 'toSeat') g.st = 'seated';
    if (g.st === 'back' || g.st === 'wrong' || g.st === 'arrive') { g.st = 'wait'; }
    prtGuestSnap(g);
  }
}

// Kurkistusten kynnykset aseman edistymiselle (0..1)
function prtMakePeekPlan(extra) {
  var n = PRT_PEEKS[0] + randInt(PRT_PEEKS[1] - PRT_PEEKS[0] + 1) + (extra || 0), out = [], i, a, b;
  n = Math.min(4, n);
  for (i = 0; i < n; i++) {
    // Tasaväliset lohkot, kynnys arvotaan lohkon sisältä
    a = PRT_PEEK_FROM + (PRT_PEEK_TO - PRT_PEEK_FROM) * i / n;
    b = PRT_PEEK_FROM + (PRT_PEEK_TO - PRT_PEEK_FROM) * (i + 0.8) / n;
    out.push(a + Math.random() * (b - a));
  }
  return out;
}

// ---------- Asemien arvonta ----------
function prtMakeStrings() {
  var si, pat, types, S, i, letters, kinds, dec, pool;
  prt.strings = [];
  pool = shuffleNums([0, 1, 2, 3, 4]);
  for (si = 0; si < 2; si++) {
    pat = si === 0 ? PRT_PAT1[randInt(2)] : PRT_PAT2[randInt(2)];
    letters = pat.split('');
    // Kirjaimet -> viirityypit; toinen naru käyttää eri värit kuin ensimmäinen, jos riittää
    kinds = {};
    types = [];
    for (i = 0; i < letters.length; i++) {
      if (kinds[letters[i]] === undefined) { kinds[letters[i]] = pool[(si * 2 + Object.keys(kinds).length) % 5]; }
      types.push(kinds[letters[i]]);
    }
    S = { pat: pat, period: types, shown: PRT_SHOWN[pat], n: PRT_SHOWN[pat] + PRT_HOOKS, hooks: [], demoT: si === 0 ? 0 : -1, active: si === 0, done: false, wave: 0, order: 0 };
    for (i = 0; i < S.n; i++) {
      S.hooks.push({ type: i < S.shown ? types[i % types.length] : -1, demo: i < S.shown, pop: 0, wrong: 0, wrongType: -1, swing: 0, seq: 0 });
    }
    // Koriin: kuvion tyypit + yksi houkutus, sekaisin
    S.basket = [];
    for (i = 0; i < types.length; i++) if (S.basket.indexOf(types[i]) < 0) S.basket.push(types[i]);
    for (i = 0; i < 5; i++) { dec = pool[(si * 2 + 3 + i) % 5]; if (S.basket.indexOf(dec) < 0) { S.basket.push(dec); break; } }
    S.basket = shuffleNums(S.basket);
    prt.strings.push(S);
  }
}
function prtMakeBalloons() {
  var cols = shuffleNums(PRT_BAL_COLS.slice()).slice(0, 5), sizes = shuffleNums([0, 1, 2, randInt(3), randInt(3)]), i;
  prt.posts = [];
  for (i = 0; i < 5; i++) prt.posts.push({ col: cols[i], size: sizes[i], done: false, pop: 0, bob: Math.random() * 6, esc: 0 });
  prt.bags = [0, 0, 0, 0, 0];
  prt.pump = { post: -1, p: 0, hold: false, stroke: 0, strokeN: 0, popT: 0, tieT: 0, wob: 0, leakT: 0, newT: 0, inBand: false };
}
function prtMakeCake() {
  var order = shuffleNums([0, 1, 2, 3, 4, 5, 6]), i;
  prt.cake = { layers: [], rack: [], cream: 0, dollops: [], drips: 0, candles: [], light: null, spark: 0, glow: 0, squash: 0, rubT: 0, numPop: null, done: false };
  for (i = 0; i < 7; i++) prt.cake.rack.push({ col: order[i], here: true, slide: 0, wob: 0 });
}
function prtMakeGuests() {
  var G = PRT_GUESTS[0] + randInt(PRT_GUESTS[1] - PRT_GUESTS[0] + 1), kinds = shuffleNums(PRT_KINDS.slice()).slice(0, G), seatsOf = shuffleNums(kinds.slice()), i, arr;
  prt.seats = [];
  for (i = 0; i < G; i++) prt.seats.push({ kind: seatsOf[i], glow: 0 });
  prt.guests = [];
  for (i = 0; i < G; i++) {
    prt.guests.push({
      kind: kinds[i], seat: seatsOf.indexOf(kinds[i]), st: 'off', x: 0, y: 0, t: 0, q: 0, hid: 0, hx: 0, hy: 0,
      poke: 0, pokeN: 0, wet: 0, cheer: 0, shake: 0, mark: 0, num: 0, ax: 0, ay: 0, bx: 0, by: 0, seed: Math.random() * 10, hideSlot: i
    });
  }
  // Saapumiset: asema ja edistymisen kynnys
  arr = [{ st: 0, at: 0.28 }, { st: 1, at: 0.15 }, { st: 1, at: 0.6 }, { st: 2, at: 0.05 }];
  if (G >= 5) arr.splice(1, 0, { st: 0, at: 0.72 });
  if (G >= 6) arr.push({ st: 2, at: 0.3 });
  prt.arrivals = arr;
}

// ---------- Äänet ----------
function prtSfx(k, a) {
  var i;
  if (k === 'hmm') {
    playNote(196, 0, 0.3, 'sine', 0.22); playNote(392, 0, 0.18, 'triangle', 0.04);
    playNote(175, 0.36, 0.42, 'sine', 0.2); playNote(349, 0.36, 0.2, 'triangle', 0.04);
  } else if (k === 'mutter') {
    for (i = 0; i < 4; i++) playNote([220, 196, 233, 208][i], i * 0.13, 0.12, 'sawtooth', 0.035);
  } else if (k === 'seen') {
    playNote(392, 0, 0.14, 'triangle', 0.25); playNote(523, 0.12, 0.14, 'triangle', 0.25); playNote(698, 0.24, 0.3, 'triangle', 0.25);
  } else if (k === 'thump') {
    playNote(98, 0, 0.28, 'sine', 0.35); playNote(147, 0, 0.12, 'triangle', 0.14);
  } else if (k === 'roll') {
    playNote(a ? 330 : 520, 0, 0.05, 'triangle', 0.06);
  } else if (k === 'pam') {
    playNote(80, 0, 0.32, 'square', 0.16); playNote(160, 0, 0.14, 'sawtooth', 0.12);
    for (i = 0; i < 6; i++) playNote(1400 + Math.random() * 1800, 0.02 + i * 0.025, 0.05, 'square', 0.03);
  } else if (k === 'laugh') {
    for (i = 0; i < 5; i++) playNote([784, 659, 784, 659, 880][i], 0.25 + i * 0.12, 0.09, 'triangle', 0.16);
  } else if (k === 'boing') {
    playNote(392, 0, 0.1, 'triangle', 0.22); playNote(294, 0.1, 0.18, 'triangle', 0.2);
  } else if (k === 'grab') {
    playNote(880, 0, 0.06, 'sine', 0.16);
  } else if (k === 'tie') {
    playNote(988, 0, 0.06, 'square', 0.05); playNote(1319, 0.06, 0.08, 'triangle', 0.22); playNote(1760, 0.14, 0.18, 'triangle', 0.2);
  } else if (k === 'whoosh') {
    for (i = 0; i < 5; i++) playNote(600 + i * 140, i * 0.04, 0.05, 'sine', 0.06);
  } else if (k === 'fanfare') {
    for (i = 0; i < 5; i++) playNote([523, 659, 784, 1047, 1319][i], i * 0.1, 0.22, 'triangle', 0.24);
  } else if (k === 'rain') {
    for (i = 0; i < 10; i++) playNote(2600 + Math.random() * 2400, i * 0.11 + Math.random() * 0.05, 0.03, 'square', 0.015);
  } else if (k === 'squish') {
    playNote(220 + Math.random() * 90, 0, 0.07, 'sine', 0.14);
  } else if (k === 'shh') {
    for (i = 0; i < 4; i++) playNote(3200 + Math.random() * 800, i * 0.04, 0.05, 'square', 0.012);
  } else if (k === 'whistle') {
    for (i = 0; i < 6; i++) playNote([1568, 1760, 1976, 1760, 1568, 1319][i], i * 0.16, 0.14, 'sine', 0.1);
  } else if (k === 'hihi') {
    playNote(1047, 0, 0.07, 'sine', 0.16); playNote(1175, 0.09, 0.07, 'sine', 0.16); playNote(1319, 0.18, 0.1, 'sine', 0.16);
  }
}
// Vieraiden omat äänet
function prtGuestSound(kind, big) {
  var i;
  if (kind === 'goat') { for (i = 0; i < 4; i++) playNote(440 + (i % 2) * 30, i * 0.07, 0.08, 'sawtooth', 0.06); playNote(392, 0.3, 0.2, 'sawtooth', 0.05); }
  else if (kind === 'marmot') { playNote(2349, 0, 0.12, 'sine', 0.16); playNote(2637, 0.14, 0.18, 'sine', 0.16); }
  else if (kind === 'eagle') { playNote(1760, 0, 0.09, 'square', 0.05); playNote(1568, 0.09, 0.2, 'square', 0.05); }
  else if (kind === 'owl') { playNote(392, 0, 0.22, 'sine', 0.24); playNote(330, 0.26, 0.32, 'sine', 0.24); }
  else if (kind === 'fox') { playNote(880, 0, 0.07, 'triangle', 0.2); playNote(1175, 0.08, 0.1, 'triangle', 0.2); }
  else { playNote(110, 0, 0.1, 'sine', 0.3); playNote(1568, 0.1, 0.06, 'sine', 0.12); playNote(1760, 0.17, 0.06, 'sine', 0.12); }
  if (big) for (i = 0; i < 4; i++) playNote([784, 988, 1175, 1568][i], 0.35 + i * 0.09, 0.12, 'triangle', 0.15);
}

// ---------- Tila-apurit ----------
function prtWatching() { var s = prt.cloud.st; return s === 'look' || s === 'mutter'; }
function prtCloudBusy() { var s = prt.cloud.st; return s === 'seen' || s === 'swoop' || s === 'shower' || s === 'leave'; }
function prtCovered() { return prt.cur.k >= PRT_COVER; }
// Asemien tehtävät estetty (verho, sadekuuro, siirtymä, kynttilöiden sytytys)
function prtBlocked() {
  return prt.cur.k > 0.03 || prtCloudBusy() || prt.trans > 0 || !!prt.cake.light || prt.st > 2;
}
function prtUnits() {
  var n = 0, i, j, S, ck = prt.cake;
  if (prt.st === 0) {
    for (i = 0; i < 2; i++) { S = prt.strings[i]; for (j = S.shown; j < S.n; j++) if (S.hooks[j].type >= 0 && !S.hooks[j].wrong) n++; }
  } else if (prt.st === 1) {
    for (i = 0; i < 5; i++) if (prt.posts[i].done) n++;
  } else if (prt.st === 2) {
    n = ck.layers.length + Math.min(2, Math.floor(ck.cream * 2.001)) + (prt.sub === 'spark' || ck.done ? 1 : 0) + (ck.done ? 1 : 0);
  }
  return n;
}
function prtStProg() { return prt.st > 2 ? 1 : prtUnits() / PRT_ST_UNITS[prt.st]; }
function prtGlobalProg() { return prtClamp((Math.min(prt.st, 3) + (prt.st > 2 ? 0 : prtStProg())) / 3, 0, 1); }
function prtSeatedAll() {
  var i;
  for (i = 0; i < prt.guests.length; i++) if (prt.guests[i].st !== 'seated') return false;
  return true;
}
function prtBalR(p) { return viewH * (0.012 + 0.056 * Math.pow(prtClamp(p, 0, 1), PRT_PUMP_EXP)); }
function prtBalP(r) { return Math.pow(prtClamp((r / viewH - 0.012) / 0.056, 0, 1), 1 / PRT_PUMP_EXP); }
// Oikean koon ikkuna (p-arvoina) pumpussa olevalle pallolle
function prtPumpBand(post) {
  var R = PRT_BAL_R[prt.posts[post].size] * viewH, pR = prtBalP(R), h = PRT_PUMP_WIN / 2 / PRT_PUMP_T;
  return { p0: pR - h, p1: Math.min(0.985, pR + h), pR: pR, R: R };
}

// ---------- Syöte ----------
function prtHandPos() {
  var L = prt.L;
  return { x: L.ropeX, y: L.handUp + prt.cur.k * (L.handDown - L.handUp) };
}
function prtRopeHit(px, py) {
  var L = prt.L, h = prtHandPos();
  if (Math.hypot(px - h.x, py - h.y) < viewH * 0.075) return true;
  return Math.abs(px - L.ropeX) < viewH * 0.045 && py > L.barY && py < h.y + viewH * 0.03;
}
function handlePartyTap(px, py) {
  var L = prt.L;
  if (!running || celebrating || !L) return;
  prtAct();
  if (prt.drag) return;
  if (prt.st === 3 && prt.fin && prt.fin.ph !== 'wait') { prtFinTap(px, py); return; }
  if (prtRopeHit(px, py) && !prtCloudBusy()) {
    prt.drag = { kind: 'rope', x: px, y: py, y0: py, k0: prt.cur.k, moved: 0 };
    prtSfx('grab');
    return;
  }
  if (prtCloudTap(px, py)) return;
  if (prt.cur.k > 0.03 && px > L.poleL && px < L.poleR && py > L.curTop && py < L.curTop + (L.curBot - L.curTop) * prt.cur.k) {
    prtCurtainPoke(px, py);
    return;
  }
  if (!prtBlocked() && prtStationTap(px, py)) return;
  if (prtPrincessTap(px, py)) return;
  if (prt.cur.k <= 0.03 && !prtCloudBusy() && prtDecorTap(px, py)) return;
  propsTap(px, py);
}
function prtCurtainPoke(px, py) {
  // Kangas pullahtaa; jos pilvi katsoo, prinsessa sihahtaa "shh"
  prt.cur.thump = 0.3;
  playNote(150, 0, 0.12, 'sine', 0.2);
  prtPuff(px, py, 3, '#e8e0f4');
  if (prtWatching() || prt.cloud.st === 'warn') { prt.prin.shh = 1.2; prtSfx('shh'); }
}
function prtCloudPos() {
  var cl = prt.cloud, L = prt.L, H = viewH, ry = prtRidgeAt(cl.x), S = prtCloudS(), hide = ry + S * 1.05, edge = ry - S * 0.3, look = ry - S * 0.78, k, y;
  if (cl.st === 'warn') y = prtLerp(hide, edge, easeInOutSine(cl.t / cl.warn));
  else if (cl.st === 'look') y = prtLerp(edge, look, easeOutBack(Math.min(1, cl.t / 0.35)));
  else if (cl.st === 'mutter') y = look + Math.sin(cl.t * 9) * H * 0.003;
  else if (cl.st === 'sink') y = prtLerp(look, hide, easeInOutSine(cl.t / (cl.duck > 0 ? 0.45 : PRT_SINK)));
  else if (cl.st === 'seen') y = look - Math.sin(Math.min(1, cl.t / 0.3) * Math.PI) * H * 0.02;
  else if (cl.st === 'swoop') { k = easeInOutSine(cl.t / 0.7); return { x: prtLerp(cl.sx, cl.tx, k), y: prtLerp(cl.sy, cl.ty, k) - Math.sin(k * Math.PI) * H * 0.06 }; }
  else if (cl.st === 'shower') return { x: cl.tx + Math.sin(cl.t * 3) * H * 0.02, y: cl.ty + Math.sin(cl.t * 5) * H * 0.006 };
  else if (cl.st === 'leave') { k = easeInOutSine(cl.t / 1.1); return { x: prtLerp(cl.tx, cl.x, k), y: prtLerp(cl.ty, hide, k) - Math.sin(k * Math.PI) * H * 0.08 }; }
  else y = hide;
  return { x: cl.x, y: y };
}
function prtCloudS() { return viewH * 0.075; }
function prtCloudTap(px, py) {
  var cl = prt.cloud, p, S = prtCloudS();
  if (cl.st === 'off') return false;
  p = prtCloudPos();
  if (Math.hypot(px - p.x, (py - p.y) * 1.3) > S * 1.25) return false;
  if (cl.st === 'warn' && py > prtRidgeAt(px)) return false;
  cl.blush = 1.2;
  if (prtWatching() && prtCovered()) {
    // Hämillään: pilvi sukeltaa takaisin harjanteen taakse (verho on jo alhaalla)
    cl.st = 'sink';
    cl.t = 0;
    cl.duck = 1;
    prtSfx('hihi');
    spawnSparkles(p.x, p.y, 8, '#ffc8e0');
  } else {
    // Varoituksen aikana: punastuu ja kikattaa, mutta nousee silti
    cl.hihi = 0.5;
    prtSfx('hihi');
    spawnSparkles(p.x, p.y - S * 0.3, 5, '#ffc8e0');
  }
  return true;
}
function prtStationTap(px, py) {
  var L = prt.L, H = viewH, i, g, S, n, b, ck = prt.cake, c, p;
  // Odottavat vieraat raahataan paikoilleen
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st !== 'wait' || g.hid > 0.1) continue;
    p = prtGuestHome(g);
    if (Math.abs(px - p.x) < H * 0.055 && py > p.y - H * 0.13 && py < p.y + H * 0.02) {
      prt.drag = { kind: 'guest', g: g, x: p.x, y: p.y - H * 0.05, moved: 0, lx: px, ly: py };
      g.st = 'drag';
      prtGuestSound(g.kind);
      prtAct();
      return true;
    }
  }
  if (prt.st === 0) {
    n = prtBasketTypes();
    if (prt.toolK.basket > 0.9) {
      for (i = 0; i < n.length; i++) {
        b = prtBasketSlot(i, n.length);
        if (Math.abs(px - b.x) < H * 0.03 && py > b.y - H * 0.02 && py < b.y + L.penH * 1.2) {
          prt.drag = { kind: 'pen', type: n[i], x: b.x, y: b.y, moved: 0, lx: px, ly: py };
          prtSfx('grab');
          return true;
        }
      }
    }
  } else if (prt.st === 1) {
    // Pussit: väri pumppuun
    for (i = 0; i < 5; i++) {
      if (prt.posts[i].done || prt.toolK.pump < 0.9) continue;
      b = L.bags[i];
      if (Math.abs(px - b.x) < H * 0.042 && py > b.y - H * 0.085 && py < b.y + H * 0.01) { prtPickBag(i); return true; }
    }
    if (prt.toolK.pump > 0.9 && Math.abs(px - L.pump.x) < H * 0.06 && py > L.pump.y - H * 0.16 && py < L.pump.y + H * 0.01) {
      if (prt.pump.post < 0 || prt.pump.popT > 0) {
        prt.pump.wob = 0.4;
        playNote(220, 0, 0.1, 'triangle', 0.15);
        prt.shown.bagNeed = false;
        return true;
      }
      prt.drag = { kind: 'pump', x: px, y: py };
      prt.pump.hold = true;
      prt.shown.pump = true;
      return true;
    }
  } else if (prt.st === 2) {
    if (prt.sub === 'layers' && prt.toolK.rack > 0.9) {
      for (i = 0; i < 7; i++) {
        c = ck.rack[i];
        if (!c.here) continue;
        b = L.rack[i];
        if (Math.abs(px - b.x) < L.rackSp * 0.5 && Math.abs(py - (b.y - H * 0.02)) < H * 0.045) {
          c.here = false;
          prt.drag = { kind: 'layer', slot: i, col: c.col, x: b.x, y: b.y - H * 0.02, moved: 0, sc: 0.62 };
          prtSfx('grab');
          return true;
        }
      }
    }
    if (prt.sub === 'cream' && (prtOverCake(px, py) || Math.hypot(px - L.bowl.x, py - (L.bowl.y - H * 0.03)) < H * 0.06)) {
      prt.drag = { kind: 'rub', x: px, y: py, lx: px, ly: py, acc: 0 };
      prt.shown.rub = true;
      return true;
    }
    if (prt.sub === 'candles') {
      if (prt.toolK.box > 0.9 && Math.hypot(px - L.candleBox.x, py - (L.candleBox.y - H * 0.035)) < H * 0.06) {
        prt.drag = { kind: 'candle', from: 'box', x: px, y: py - H * 0.03, moved: 0 };
        prtSfx('grab');
        return true;
      }
      i = prtCandleAt(px, py);
      if (i >= 0) {
        ck.candles.splice(i, 1);
        prt.drag = { kind: 'candle', from: 'cake', x: px, y: py, moved: 0 };
        prtSfx('grab');
        return true;
      }
      if (prt.toolK.match > 0.9 && Math.hypot(px - L.match.x, py - (L.match.y - H * 0.05)) < H * 0.065) {
        if (!prtSeatedAll() || !ck.candles.length) { prt.matchWob = 0.4; playNote(220, 0, 0.1, 'triangle', 0.15); return true; }
        prt.drag = { kind: 'match', x: L.match.x, y: L.match.y - H * 0.06, moved: 0 };
        playNote(1568, 0, 0.08, 'sine', 0.12);
        return true;
      }
    }
    if (prt.sub === 'spark' && prt.toolK.jar > 0.9 && Math.hypot(px - L.jar.x, py - (L.jar.y - H * 0.05)) < H * 0.06) {
      prt.drag = { kind: 'spark', x: L.jar.x, y: L.jar.y - H * 0.06, moved: 0 };
      playNote(1760, 0, 0.06, 'square', 0.04);
      return true;
    }
  }
  return false;
}
// Valmiit koristeet: viirit, pallot, kakku ja istuvat vieraat reagoivat napautukseen
function prtDecorTap(px, py) {
  var L = prt.L, H = viewH, i, j, S, h, g, p, sp;
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st !== 'seated' || g.hid > 0.1) continue;
    p = prtSeatPos(g.seat);
    if (Math.abs(px - p.x) < H * 0.05 && py > p.y - H * 0.12 && py < p.y) { prtPokeGuest(g); return true; }
  }
  for (i = 0; i < 5; i++) {
    if (!prt.posts[i].done || prt.st < 1) continue;
    p = prtPostBalloon(i);
    if (Math.hypot(px - p.x, py - p.y) < p.r * 1.3) {
      prt.posts[i].pop = 0.5;
      playNote(prtNoteOfCol(i), 0, 0.2, 'sine', 0.22);
      playNote(prtNoteOfCol(i) * 1.5, 0.08, 0.2, 'sine', 0.12);
      spawnSparkles(p.x, p.y, 6, prt.posts[i].col);
      return true;
    }
  }
  if (prtOverCake(px, py) && prt.cake.layers.length) {
    prt.cake.squash = 0.4;
    for (i = 0; i < prt.cake.layers.length; i++) playNote([523, 587, 659, 698, 784, 880, 988][prt.cake.layers[i]], i * 0.05, 0.12, 'triangle', 0.14);
    return true;
  }
  for (i = 0; i < 2; i++) {
    S = prt.strings[i];
    if (S.demoT < 0) continue;
    for (j = 0; j < S.n; j++) {
      h = S.hooks[j];
      if (h.type < 0) continue;
      p = prtHookPos(i, j);
      if (Math.abs(px - p.x) < L.penW * 0.6 && py > p.y && py < p.y + L.penH) {
        // Koko naru heilahtaa aallossa ja soittaa kuvion
        S.wave = 1.2;
        S.waveX = j;
        for (sp = 0; sp < Math.min(8, S.n - j); sp++) if (S.hooks[j + sp].type >= 0) playNote(PRT_PEN[S.hooks[j + sp].type].note, sp * 0.09, 0.12, 'triangle', 0.14);
        return true;
      }
    }
  }
  return false;
}
function prtPrincessTap(px, py) {
  var L = prt.L, P = prt.prin;
  if (Math.abs(px - L.prin.x) > viewH * 0.06 || py < L.prin.y - viewH * 0.22 || py > L.prin.y + viewH * 0.02) return false;
  if (prtWatching()) { P.shh = 1.2; prtSfx('shh'); return true; }
  P.poke = 0.8;
  P.pokeN++;
  playNote(784, 0, 0.12, 'triangle', 0.2);
  playNote(1047, 0.1, 0.18, 'triangle', 0.2);
  spawnSparkles(L.prin.x + viewH * 0.06, L.prin.y - viewH * 0.17, 8, '#ffe27a');
  if (P.pokeN % 3 === 0) { P.spin = 1; for (var i = 0; i < 4; i++) playNote([1047, 1319, 1568, 2093][i], 0.15 + i * 0.08, 0.14, 'sine', 0.15); }
  return true;
}
function prtPokeGuest(g) {
  var p = prtSeatPos(g.seat), big;
  g.poke = 0.8;
  g.pokeN++;
  big = g.pokeN % 3 === 0;
  if (g.kind === 'fox') {
    // Kettu soittaa kitaraa; 3.: kokonainen melodia
    prtStrum(big);
  } else if (g.kind === 'goat') {
    prtSqueeze(big);
  } else prtGuestSound(g.kind, big);
  if (big) g.cheer = 1.4;
  spawnSparkles(p.x, p.y - viewH * 0.08, big ? 12 : 6, '#ffe27a');
}
function prtStrum(big) {
  var i, ch = [392, 494, 587, 784];
  for (i = 0; i < 4; i++) playNote(ch[i], i * 0.03, 0.4, 'triangle', 0.13);
  if (big) for (i = 0; i < 8; i++) playNote([784, 659, 587, 659, 784, 784, 784, 0][i] || 1, 0.35 + i * 0.16, 0.14, 'triangle', i === 7 ? 0 : 0.14);
}
function prtSqueeze(big) {
  var i;
  for (i = 0; i < 3; i++) playNote([262, 330, 392][i], 0, 0.45, 'sawtooth', 0.035);
  playNote(523, 0.05, 0.4, 'square', 0.03);
  if (big) for (i = 0; i < 6; i++) playNote([523, 587, 659, 698, 784, 1047][i], 0.4 + i * 0.13, 0.12, 'square', 0.035);
}

// ---------- Raahaus ----------
function prtUpdateDrag(dt) {
  var d = prt.drag, L = prt.L, H = viewH, k, tx, ty, dd;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 22);
    if (d.kind === 'rope') {
      prt.cur.kd = prtClamp(d.k0 + (lastPY - d.y0) / (L.handDown - L.handUp), 0, 1);
      d.moved = Math.max(d.moved, Math.abs(lastPY - d.y0));
      return;
    }
    if (d.kind === 'pump') return;
    if (d.kind === 'rub') {
      dd = Math.hypot(lastPX - d.lx, lastPY - d.ly);
      d.lx = lastPX;
      d.ly = lastPY;
      d.x = lastPX;
      d.y = lastPY;
      if (prtOverCake(lastPX, lastPY) && dd > 0) prtRub(dd, lastPX, lastPY);
      return;
    }
    tx = lastPX;
    ty = lastPY + prtDragOffY(d);
    if (d.kind === 'layer') d.sc += (prtLayerScaleAt(tx, ty) - d.sc) * Math.min(1, dt * 10);
    d.x += (tx - d.x) * k;
    d.y += (ty - d.y) * k;
    if (d.lx !== undefined) { d.moved += Math.hypot(lastPX - d.lx, lastPY - d.ly); d.lx = lastPX; d.ly = lastPY; }
    return;
  }
  prt.drag = null;
  // Pudotus sormen viimeiseen kohtaan (nopea heilautus ei jää jälkeen)
  if (d.lx !== undefined) d.moved += Math.hypot(lastPX - d.lx, lastPY - d.ly);
  if (d.kind !== 'rope' && d.kind !== 'pump' && d.kind !== 'rub' && !(d.kind === 'guest' && d.moved < viewH * 0.02)) { d.x = lastPX; d.y = lastPY + prtDragOffY(d); }
  prtDrop(d, lastPX, lastPY);
}
function prtDragOffY(d) {
  var H = viewH;
  if (d.kind === 'pen') return -H * 0.035;
  if (d.kind === 'guest') return H * 0.03;
  if (d.kind === 'layer') return H * 0.01;
  if (d.kind === 'match' || d.kind === 'spark') return -H * 0.02;
  return 0;
}
function prtLayerScaleAt(x, y) {
  var L = prt.L, dd = Math.hypot(x - L.cakeX, y - prtCakeTopY());
  return prtClamp(1 - (dd - viewH * 0.08) / (viewH * 0.25), 0.62, 1);
}
function prtCancelDrag() {
  var d = prt.drag;
  if (!d) return;
  prt.drag = null;
  if (d.kind === 'pump') { prt.pump.hold = false; return; }
  if (d.kind === 'rope') { prt.cur.goal = prt.cur.k > 0.5 ? 1 : 0; return; }
  if (d.kind === 'guest') { prtGuestBack(d.g, d.x, d.y + viewH * 0.05); return; }
  if (d.kind === 'layer') { prtFly('layer', d.x, d.y, prt.L.rack[d.slot].x, prt.L.rack[d.slot].y - viewH * 0.02, { slot: d.slot, col: d.col }); return; }
  if (d.kind === 'pen') { prtFly('pen', d.x, d.y, prt.L.basket.x, prt.L.basket.y - viewH * 0.05, { type: d.type }); return; }
  if (d.kind === 'candle') { prtFly('candle', d.x, d.y, prt.L.candleBox.x, prt.L.candleBox.y - viewH * 0.03, {}); }
}
function prtFly(kind, x0, y0, x1, y1, o) {
  var f = { kind: kind, x0: x0, y0: y0, x1: x1, y1: y1, t: 0, dur: (o && o.dur) || 0.4, o: o || {} };
  prt.flies.push(f);
  return f;
}
function prtOverCake(px, py) {
  var L = prt.L, H = viewH;
  return Math.abs(px - L.cakeX) < H * 0.12 && py > prtCakeTopY() - H * 0.1 && py < L.tableY + H * 0.03;
}
function prtDrop(d, px, py) {
  var L = prt.L, H = viewH, i, j, S, best, bd, dd, p, ck = prt.cake, g;
  if (d.kind === 'rope') {
    prt.cur.kd = prtClamp(d.k0 + (py - d.y0) / (L.handDown - L.handUp), 0, 1);
    d.moved = Math.max(d.moved, Math.abs(py - d.y0));
    if (d.k0 > 0.5) prt.cur.goal = prt.cur.kd < 0.8 ? 0 : 1;
    else prt.cur.goal = prt.cur.kd > 0.2 ? 1 : 0;
    if (d.moved < H * 0.01) {
      // Pelkkä napautus: naru nykäisee (ei vaihda tilaa)
      prt.cur.thump = 0.25;
      playNote(523, 0, 0.06, 'triangle', 0.12);
    }
    if (prt.cur.goal === 1 && d.k0 < 0.5) prt.shown.ropeDown = true;
    if (prt.cur.goal === 0 && d.k0 > 0.5) prt.shown.ropeUp = true;
    prtAct();
    return;
  }
  if (d.kind === 'pump') { prt.pump.hold = false; prtPumpRelease(); return; }
  if (d.kind === 'rub') return;
  if (d.kind === 'guest') {
    g = d.g;
    if (d.moved < H * 0.02) { prtGuestBack(g, d.x, d.y + H * 0.05); g.poke = 0.6; return; }
    best = -1; bd = H * 0.085;
    for (i = 0; i < prt.seats.length; i++) {
      p = prtSeatPos(i);
      dd = Math.abs(d.x - p.x);
      if (dd < bd && d.y > L.tableY - H * 0.24 && d.y < L.tableY + H * 0.06) { bd = dd; best = i; }
    }
    if (best >= 0 && prtBlocked()) best = -1;
    if (best === g.seat) {
      g.st = 'toSeat';
      g.t = 0;
      g.ax = d.x;
      g.ay = d.y + H * 0.05;
      prt.shown.guest = true;
      prtAct();
      return;
    }
    if (best >= 0) {
      // Väärä paikka: pudistaa päätään, kortti välähtää ja vieras palaa odottamaan
      g.st = 'wrong';
      g.t = 0;
      g.x = d.x;
      g.y = d.y + H * 0.05;
      g.shake = 0.7;
      prt.seats[best].glow = 0.8;
      prt.seats[g.seat].glow = 1.6;
      prt.wrongs++;
      prtSfx('boing');
      return;
    }
    prtGuestBack(g, d.x, d.y + H * 0.05);
    return;
  }
  if (d.kind === 'pen') { prtDropPen(d); return; }
  if (d.kind === 'layer') {
    if (prtOverCake(d.x, d.y + H * 0.02) && !prtBlocked()) {
      if (d.col === ck.layers.length) {
        ck.layers.push(d.col);
        ck.squash = 0.35;
        p = prtCakeTopY();
        artPop(L.cakeX, p, H * 0.08, RAINBOW_COLORS[d.col], 'ring');
        spawnSparkles(L.cakeX, p, 10, RAINBOW_COLORS[d.col]);
        playNote([523, 587, 659, 698, 784, 880, 988][d.col], 0, 0.2, 'triangle', 0.28);
        playNote([523, 587, 659, 698, 784, 880, 988][d.col] * 2, 0.07, 0.16, 'sine', 0.12);
        prt.shown.layer = true;
        prt.stStarted = true;
        prtAct();
        if (ck.layers.length === 7) prtCakeLayersDone();
        return;
      }
      // Väärä kerros: laskeutuu hetkeksi ja liukuu takaisin ritilälle
      prt.wrongs++;
      prtFly('layerSlide', L.cakeX, prtCakeTopY() - H * 0.012, L.rack[d.slot].x, L.rack[d.slot].y - H * 0.02, { slot: d.slot, col: d.col, dur: 1.0 });
      ck.squash = 0.2;
      playNote(523, 0, 0.1, 'triangle', 0.2); playNote(440, 0.1, 0.1, 'triangle', 0.2); playNote(349, 0.2, 0.2, 'triangle', 0.2);
      return;
    }
    prtFly('layer', d.x, d.y, L.rack[d.slot].x, L.rack[d.slot].y - H * 0.02, { slot: d.slot, col: d.col });
    return;
  }
  if (d.kind === 'candle') {
    if (prtOverCake(d.x, d.y + H * 0.03) && !prtBlocked() && ck.candles.length < 9) {
      ck.candles.push({ lit: 0, pop: 0.35, seed: Math.random() * 6, col: RAINBOW_COLORS[(ck.candles.length * 3) % 7] });
      ck.numPop = { n: ck.candles.length, t: 0 };
      playNote(1047 + ck.candles.length * 60, 0, 0.1, 'triangle', 0.25);
      spawnSparkles(L.cakeX, prtCakeTopY() - H * 0.03, 5, '#fff2a0');
      prt.shown.candle = true;
      prtAct();
      return;
    }
    if (d.from === 'cake') { prt.shown.candleOff = true; prtAct(); }
    prtFly('candle', d.x, d.y, L.candleBox.x, L.candleBox.y - H * 0.03, {});
    return;
  }
  if (d.kind === 'match') {
    if (prtOverCake(d.x, d.y + H * 0.04) && !prtBlocked() && ck.candles.length) { prtLightStart(); return; }
    prtFly('match', d.x, d.y, L.match.x, L.match.y - H * 0.06, {});
    return;
  }
  if (d.kind === 'spark') {
    if (prtOverCake(d.x, d.y + H * 0.04) && !prtBlocked()) {
      ck.spark = 0.001;
      ck.done = true;
      playNote(1760, 0, 0.1, 'square', 0.05);
      for (i = 0; i < 6; i++) playNote([1047, 1319, 1568, 2093, 2637, 3136][i], 0.05 + i * 0.07, 0.15, 'triangle', 0.18);
      spawnSparkles(L.cakeX, prtCakeTopY() - H * 0.06, 24, '#ffe27a');
      prt.shown.spark = true;
      prtAct();
      prtStationDone();
      return;
    }
    prtFly('spark', d.x, d.y, L.jar.x, L.jar.y - H * 0.06, {});
  }
}
function prtDropPen(d) {
  var L = prt.L, H = viewH, si, i, S, h, p, best = null, bd = 1e9, dd, ok, n;
  for (si = 0; si < 2; si++) {
    S = prt.strings[si];
    if (!prtStringOpen(si)) continue;
    for (i = S.shown; i < S.n; i++) {
      h = S.hooks[i];
      if (h.type >= 0) continue;
      p = prtHookPos(si, i);
      dd = Math.hypot((d.x - p.x) * 1.2, d.y - p.y);
      if (dd < bd && Math.abs(d.x - p.x) < H * 0.07 && Math.abs(d.y - p.y) < H * 0.075) { bd = dd; best = { si: si, i: i, p: p }; }
    }
  }
  if (!best || prtBlocked()) {
    prtFly('pen', d.x, d.y, L.basket.x, L.basket.y - H * 0.05, { type: d.type });
    return;
  }
  S = prt.strings[best.si];
  h = S.hooks[best.i];
  ok = d.type === S.period[best.i % S.period.length];
  h.type = d.type;
  h.pop = 0.35;
  h.swing = 1;
  if (!ok) {
    h.wrong = 0.75;
    prt.wrongs++;
    prtSfx('boing');
    return;
  }
  S.order++;
  h.seq = S.order;
  n = prtFilled(best.si);
  artPop(best.p.x, best.p.y + L.penH * 0.4, H * 0.045, PRT_PEN[d.type].col, 'ring');
  spawnSparkles(best.p.x, best.p.y + L.penH * 0.4, 6, PRT_PEN[d.type].col);
  playNote(PRT_PEN[d.type].note, 0, 0.18, 'triangle', 0.28);
  playNote(PRT_PEN[d.type].note * 1.5, 0.06, 0.14, 'sine', 0.12);
  prt.shown.pen = true;
  prt.stStarted = true;
  prtAct();
  if (n === PRT_HOOKS) prtStringDone(best.si);
}
function prtFilled(si) {
  var S = prt.strings[si], i, n = 0;
  for (i = S.shown; i < S.n; i++) if (S.hooks[i].type >= 0 && !S.hooks[i].wrong) n++;
  return n;
}
function prtStringOpen(si) {
  var S = prt.strings[si];
  return S.demoT >= S.shown * 0.28 + 0.6 && prt.st === 0;
}
function prtStringDone(si) {
  var S = prt.strings[si], i;
  S.done = true;
  S.wave = 1.6;
  S.waveX = 0;
  for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 784, 1047][i], 0.1 + i * 0.09, 0.16, 'triangle', 0.2);
  for (i = 0; i < 6; i++) { var p = prtHookPos(si, Math.floor(i * S.n / 6)); spawnSparkles(p.x, p.y + viewH * 0.02, 4, '#ffe27a'); }
  if (si === 0 && prt.strings[1].demoT < 0) prt.strings[1].demoT = 0;
  if (prt.strings[0].done && prt.strings[1].done && prtFilled(0) === PRT_HOOKS && prtFilled(1) === PRT_HOOKS) prtStationDone();
}
function prtBasketTypes() {
  var out = [], si, S, i;
  for (si = 0; si < 2; si++) {
    S = prt.strings[si];
    if (!prtStringOpen(si) || prtFilled(si) >= PRT_HOOKS) continue;
    for (i = 0; i < S.basket.length; i++) if (out.indexOf(S.basket[i]) < 0) out.push(S.basket[i]);
  }
  if (!out.length) out = prt.strings[prt.strings[0].done ? 1 : 0].basket.slice();
  return out.slice(0, 5);
}
function prtBasketSlot(i, n) {
  var L = prt.L, H = viewH;
  return { x: L.basket.x + (i - (n - 1) / 2) * H * 0.04, y: L.basket.y - H * 0.085 - Math.cos((i - (n - 1) / 2) * 0.5) * H * 0.012, rot: (i - (n - 1) / 2) * 0.22 };
}

// ---------- Ilmapallot ----------
function prtPickBag(i) {
  var pu = prt.pump, L = prt.L;
  prt.bags[i] = 0.4;
  if (pu.post === i && pu.popT <= 0) { playNote(prtNoteOfCol(i), 0, 0.12, 'sine', 0.18); return; }
  if (pu.post >= 0 && pu.p > 0.05) prtPuff(L.balC.x, L.balC.y, 5, '#ffffff');
  pu.post = i;
  pu.p = 0;
  pu.popT = 0;
  pu.newT = 0.35;
  playNote(prtNoteOfCol(i), 0, 0.12, 'triangle', 0.25);
  playNote(prtNoteOfCol(i) * 1.25, 0.08, 0.14, 'triangle', 0.2);
  prt.shown.bag = true;
  prtAct();
}
function prtNoteOfCol(i) { return [523, 587, 659, 784, 880][i % 5]; }
function prtPumpRelease() {
  var pu = prt.pump, B, L = prt.L;
  if (pu.post < 0 || pu.popT > 0 || pu.p <= 0.01) return;
  B = prtPumpBand(pu.post);
  if (pu.p >= B.p0 && pu.p <= B.p1 && !prtBlocked()) {
    // Oikea koko: solmu ja lento tolppaan
    prtSfx('tie');
    prtFly('bal', L.balC.x, L.balC.y, 0, 0, { post: pu.post, r0: prtBalR(pu.p), dur: 0.9 });
    pu.post = -1;
    pu.p = 0;
    pu.tieT = 0.5;
    prt.stStarted = true;
    prtAct();
    return;
  }
  if (pu.p > B.p1) { prtPop(); return; }
  // Liian pieni: jää pumppuun ja alkaa vuotaa
  playNote(330, 0, 0.08, 'sine', 0.1);
}
function prtPop() {
  var pu = prt.pump, L = prt.L, r = prtBalR(pu.p), i, g;
  prtSfx('pam');
  prtSfx('laugh');
  prtBits(L.balC.x, L.balC.y, 26, { spread: 6.3, sp: 0.6, cols: [prt.posts[pu.post].col, '#ffffff', '#ffe27a'] });
  artPop(L.balC.x, L.balC.y, r * 1.6, '#ffffff', 'burst');
  artShakeStart(viewH * 0.006, 0.25);
  pu.p = 0;
  pu.popT = 0.7;
  pu.hold = false;
  prt.pops++;
  prt.prin.bang = 1.2;
  for (i = 0; i < prt.guests.length; i++) { g = prt.guests[i]; if (g.st === 'seated' || g.st === 'wait') g.cheer = 1.0; }
}
function prtUpdatePump(dt) {
  var pu = prt.pump, B, prevStroke;
  if (pu.wob > 0) pu.wob -= dt;
  if (pu.tieT > 0) pu.tieT -= dt;
  if (pu.newT > 0) pu.newT -= dt;
  if (pu.popT > 0) {
    pu.popT -= dt;
    if (pu.popT <= 0) { pu.newT = 0.35; playNote(prtNoteOfCol(pu.post), 0, 0.1, 'triangle', 0.18); }
    return;
  }
  if (pu.post < 0) { pu.p = 0; return; }
  if (pu.hold && !prtBlocked()) {
    prevStroke = Math.floor(pu.stroke);
    pu.stroke += dt * 3.4;
    if (Math.floor(pu.stroke) !== prevStroke) {
      playNote(260 + pu.p * 700, 0, 0.12, 'sine', 0.12);
      playNote(2200 + Math.random() * 900, 0, 0.05, 'square', 0.012);
    }
    pu.p += dt / PRT_PUMP_T;
    B = prtPumpBand(pu.post);
    if (pu.p >= B.p0 && !pu.inBand) { pu.inBand = true; playNote(1319, 0, 0.1, 'sine', 0.14); }
    if (pu.p >= 1) prtPop();
  } else if (pu.p > 0) {
    pu.p = Math.max(0, pu.p - PRT_LEAK * dt);
    pu.leakT -= dt;
    if (pu.leakT <= 0) { pu.leakT = 0.25; playNote(3000 + Math.random() * 800, 0, 0.05, 'square', 0.008); }
  }
  if (pu.post >= 0) { B = prtPumpBand(pu.post); if (pu.p < B.p0) pu.inBand = false; }
}

// ---------- Kakku ----------
function prtCakeLayersDone() {
  var i;
  prt.cake.glow = 1.5;
  for (i = 0; i < 7; i++) playNote([523, 587, 659, 698, 784, 880, 988][i], 0.15 + i * 0.07, 0.18, 'triangle', 0.2);
  prt.sub = 'cream';
}
function prtRub(dd, x, y) {
  var ck = prt.cake, n0 = Math.floor(ck.cream * 14), n1, L = prt.L, s, i, best, bd, dx;
  if (prtBlocked() || prt.sub !== 'cream') return;
  ck.cream = Math.min(1, ck.cream + dd / (viewH * PRT_CREAM_LEN));
  ck.rubT += dd;
  if (ck.rubT > viewH * 0.06) { ck.rubT = 0; prtSfx('squish'); }
  if (Math.random() < 0.3) prtPuff(x, y, 1, '#ffffff', { r: 0.008, vy: -0.03, life: 0.5 });
  n1 = Math.floor(ck.cream * 14);
  // Uusi kermanokare ilmestyy sormen lähimpään vapaaseen kohtaan
  while (n0 < n1) {
    best = -1; bd = 1e9;
    for (i = 0; i < 14; i++) {
      if (ck.dollops.indexOf(i) >= 0) continue;
      s = prtDollopPos(i);
      dx = Math.hypot(s.x - x, s.y - y);
      if (dx < bd) { bd = dx; best = i; }
    }
    if (best >= 0) { ck.dollops.push(best); s = prtDollopPos(best); artPop(s.x, s.y, viewH * 0.02, '#ffffff', 'ring'); }
    n0++;
  }
  ck.drips = Math.max(0, ck.drips - dd / (viewH * 0.5));
  if (ck.cream >= 1) {
    prt.sub = 'candles';
    ck.glow = 1.2;
    for (i = 0; i < 5; i++) playNote([784, 988, 1175, 1568, 1976][i], i * 0.08, 0.15, 'sine', 0.18);
    spawnSparkles(L.cakeX, prtCakeTopY(), 16, '#ffffff');
    prt.drag = null;
  }
}
function prtDollopPos(i) {
  var L = prt.L, H = viewH, top = prtCakeTopY(), rx = L.layerW / 2;
  if (i < 8) return { x: L.cakeX + Math.cos(Math.PI + i / 7 * Math.PI) * rx * 0.8, y: top + Math.sin(i / 7 * Math.PI) * H * 0.012 - H * 0.004 };
  return { x: L.cakeX + (i - 10.5) * rx * 0.33, y: top + H * 0.035 + ((i % 2) * H * 0.03) };
}
function prtCandlePos(i, n) {
  var L = prt.L, H = viewH, top = prtCakeTopY(), rx = L.layerW / 2 * 0.72, k = n > 1 ? i / (n - 1) : 0.5;
  return { x: L.cakeX + (k - 0.5) * 2 * rx, y: top + (i % 2 ? H * 0.008 : -H * 0.004) };
}
function prtCandleAt(px, py) {
  var ck = prt.cake, i, p, n = ck.candles.length;
  if (ck.light || prtBlocked()) return -1;
  for (i = n - 1; i >= 0; i--) {
    p = prtCandlePos(i, n);
    if (Math.abs(px - p.x) < viewH * 0.016 && py > p.y - viewH * 0.06 && py < p.y + viewH * 0.008) return i;
  }
  return -1;
}
// Sytytys: kynttilä kerrallaan, kipinä yhdelle vieraalle (yksi yhteen)
function prtLightStart() {
  var ck = prt.cake;
  ck.light = { t: 0, i: 0, n: ck.candles.length, G: prt.guests.length, end: -1, ok: ck.candles.length === prt.guests.length };
  prt.shown.match = true;
  playNote(1568, 0, 0.1, 'sine', 0.2);
  prtAct();
}
function prtGuestsBySeat() {
  var out = prt.guests.slice();
  out.sort(function (a, b) { return prtSeatPos(a.seat).x - prtSeatPos(b.seat).x; });
  return out;
}
function prtUpdateLight(dt) {
  var ck = prt.cake, Lg = ck.light, L = prt.L, H = viewH, gs, p, q, g, i;
  if (!Lg) return;
  Lg.t += dt;
  gs = prtGuestsBySeat();
  while (Lg.i < Lg.n && Lg.t >= 0.35 + Lg.i * 0.5) {
    i = Lg.i;
    ck.candles[i].lit = 1;
    p = prtCandlePos(i, Lg.n);
    playNote(784 * Math.pow(1.122, i), 0, 0.18, 'triangle', 0.25);
    spawnSparkles(p.x, p.y - H * 0.05, 5, '#ffd24f');
    if (i < Lg.G) {
      g = gs[i];
      q = prtSeatPos(g.seat);
      prtFly('ember', p.x, p.y - H * 0.05, q.x, q.y - H * 0.1, { g: g, n: i + 1, dur: 0.45 });
    } else {
      prtFly('ember', p.x, p.y - H * 0.05, p.x + (i % 2 ? 1 : -1) * H * 0.1, p.y - H * 0.18, { g: null, n: i + 1, dur: 0.6 });
    }
    Lg.i++;
  }
  if (Lg.i >= Lg.n && Lg.end < 0 && Lg.t >= 0.35 + Lg.n * 0.5 + 0.2) {
    Lg.end = Lg.t;
    if (Lg.ok) {
      for (i = 0; i < gs.length; i++) gs[i].cheer = 1.6;
      for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 1319, 1568][i], i * 0.08, 0.2, 'triangle', 0.22);
      spawnSparkles(L.cakeX, prtCakeTopY() - H * 0.05, 20, '#ffe27a');
      ck.glow = 1.4;
    } else {
      // Väärä määrä: ilman kipinää jääneet tai ylimääräiset kysyvät
      for (i = Lg.n; i < gs.length; i++) gs[i].mark = 2.0;
      prtSfx('boing');
      prt.wrongs++;
    }
  }
  if (Lg.end >= 0 && Lg.t - Lg.end > (Lg.ok ? 0.8 : 2.0)) {
    if (Lg.ok) {
      ck.light = null;
      prt.sub = 'spark';
    } else {
      for (i = 0; i < ck.candles.length; i++) {
        ck.candles[i].lit = 0;
        p = prtCandlePos(i, ck.candles.length);
        prtPuff(p.x, p.y - H * 0.05, 2, '#d8d0e8', { r: 0.008, vy: -0.08 });
      }
      for (i = 0; i < gs.length; i++) gs[i].num = 0;
      playNote(330, 0, 0.2, 'sine', 0.15);
      ck.light = null;
    }
  }
}

// ---------- Asemat ----------
function prtStationDone() {
  var left = prt.peekPlan.length;
  prtSfx('fanfare');
  prt.trans = 1.5;
  prt.st++;
  prt.stT = 0;
  prt.stStarted = false;
  prtCancelDrag();
  if (prt.st === 1) { prt.peekPlan = prtMakePeekPlan(left); }
  else if (prt.st === 2) { prt.peekPlan = prtMakePeekPlan(left); prt.sub = 'layers'; }
  else { prt.peekPlan = []; prt.fin = { ph: 'wait', t: 0 }; prt.sub = ''; }
  prt.peekDelay = -1;
  prt.peekGap = Math.max(prt.peekGap, 2.5);
}
function prtToolTargets() {
  var T = { basket: 0, pump: 0, rack: 0, bowl: 0, box: 0, match: 0, jar: 0 }, s = prt.sub;
  if (prt.trans > 0.6) return T;
  if (prt.st === 0) T.basket = 1;
  else if (prt.st === 1) T.pump = 1;
  else if (prt.st === 2) {
    if (s === 'layers') T.rack = 1;
    else if (s === 'cream') T.bowl = 1;
    else if (s === 'candles') { T.box = 1; T.match = 1; }
    else if (s === 'spark') T.jar = prt.cake.done ? 0 : 1;
  }
  return T;
}

// ---------- Vieraat ----------
function prtGuestHome(g) {
  var L = prt.L, p;
  if (g.st === 'seated' || g.st === 'toSeat') { p = prtSeatPos(g.seat); return { x: p.x, y: p.y }; }
  if (g.st === 'arrive') return { x: g.x, y: g.y };
  if (g.st === 'drag') return { x: g.x, y: g.y };
  return { x: L.wait[g.q].x, y: L.wait[g.q].y };
}
function prtGuestSnap(g) {
  var p = prtGuestHome(g);
  g.x = p.x;
  g.y = p.y;
}
function prtHidePos(g) {
  var L = prt.L, R = L.rocks[g.hideSlot % 3], off = (g.hideSlot < 3 ? -1 : 1) * viewH * 0.05;
  return { x: R.x + off, y: R.top + viewH * 0.008 + prt.L.guestR * 1.55 };
}
function prtGuestBack(g, x, y) {
  g.st = 'back';
  g.t = 0;
  g.ax = x;
  g.ay = y;
}
function prtWaitingCount() {
  var i, n = 0, s;
  for (i = 0; i < prt.guests.length; i++) { s = prt.guests[i].st; if (s === 'wait' || s === 'arrive' || s === 'drag' || s === 'back' || s === 'wrong') n++; }
  return n;
}
function prtSpawnGuest() {
  var i, g, L = prt.L, H = viewH;
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st !== 'off') continue;
    g.q = prtQueueFree(0) ? 0 : 1;
    g.st = 'arrive';
    g.t = 0;
    g.ax = L.W + H * 0.12;
    g.ay = g.kind === 'eagle' || g.kind === 'owl' ? H * 0.4 : L.wait[g.q].y;
    g.x = g.ax;
    g.y = g.ay;
    playNote(1319, 0, 0.08, 'sine', 0.12);
    playNote(1568, 0.1, 0.1, 'sine', 0.12);
    return;
  }
}
function prtQueueFree(q) {
  var i, g;
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.q === q && (g.st === 'wait' || g.st === 'arrive' || g.st === 'drag' || g.st === 'back' || g.st === 'wrong')) return false;
  }
  return true;
}
function prtUpdateGuests(dt) {
  var i, g, L = prt.L, H = viewH, k, p, hideAll, a;
  hideAll = prt.cur.k > 0.3 || (prt.fin && prt.fin.hide);
  // Saapumiset aseman edistymisen mukaan
  a = prt.arrivals[0];
  if (a && prt.trans <= 0 && !prtCloudBusy() && prtWaitingCount() < 2 && (prt.st > a.st || (prt.st === a.st && prtStProg() >= a.at))) {
    prt.arrivals.shift();
    prtSpawnGuest();
  }
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st === 'off') continue;
    g.t += dt;
    if (g.poke > 0) g.poke -= dt;
    if (g.cheer > 0) g.cheer -= dt;
    if (g.shake > 0) g.shake -= dt;
    if (g.mark > 0) g.mark -= dt;
    if (g.wet > 0) g.wet -= dt;
    // Piiloon kivien taakse (verho alhaalla tai yllätys)
    if (g.st !== 'drag') {
      k = hideAll ? 1 : 0;
      if (g.hid < k) { if (g.hid === 0) g.hidFrom = prtGuestHome(g); g.hid = Math.min(1, g.hid + dt * 2.8); }
      else if (g.hid > k) g.hid = Math.max(0, g.hid - dt * 2.4);
    }
    if (g.hid > 0) continue;
    if (g.st === 'arrive') {
      k = Math.min(1, g.t / 1.8);
      p = L.wait[g.q];
      g.x = prtLerp(g.ax, p.x, easeOutCubic(k));
      g.y = prtLerp(g.ay, p.y, easeOutCubic(k)) - (g.kind === 'eagle' || g.kind === 'owl' ? 0 : Math.abs(Math.sin(k * Math.PI * 4)) * H * 0.025 * (1 - k));
      if (k >= 1) { g.st = 'wait'; g.t = 0; prtGuestSound(g.kind); g.poke = 0.5; }
    } else if (g.st === 'back' || g.st === 'wrong') {
      if (g.st === 'wrong' && g.t < 0.7) continue;
      if (g.st === 'wrong') { g.st = 'back'; g.t = 0; g.ax = g.x; g.ay = g.y; }
      k = Math.min(1, g.t / 0.4);
      p = L.wait[g.q];
      g.x = prtLerp(g.ax, p.x, easeOutCubic(k));
      g.y = prtLerp(g.ay, p.y, easeOutCubic(k)) - Math.sin(k * Math.PI) * H * 0.04;
      if (k >= 1) { g.st = 'wait'; g.t = 0; }
    } else if (g.st === 'toSeat') {
      k = Math.min(1, g.t / 0.35);
      p = prtSeatPos(g.seat);
      g.x = prtLerp(g.ax, p.x, easeOutCubic(k));
      g.y = prtLerp(g.ay, p.y, easeOutCubic(k)) - Math.sin(k * Math.PI) * H * 0.05;
      if (k >= 1) {
        g.st = 'seated';
        g.t = 0;
        g.poke = 0.6;
        prt.seats[g.seat].glow = 1.0;
        prtGuestSound(g.kind);
        playNote(1047, 0.1, 0.12, 'triangle', 0.2);
        playNote(1319, 0.2, 0.18, 'triangle', 0.2);
        spawnSparkles(p.x, p.y - H * 0.08, 12, '#ffe27a');
        artPop(p.x, p.y - H * 0.06, H * 0.06, '#ffffff', 'ring');
        prtQueueShift();
      }
    } else if (g.st === 'drag') {
      g.x = prt.drag ? prt.drag.x : g.x;
      g.y = prt.drag ? prt.drag.y + H * 0.05 : g.y;
    } else if (g.st === 'wait' || g.st === 'seated') prtGuestSnap(g);
  }
  for (i = 0; i < prt.seats.length; i++) if (prt.seats[i].glow > 0) prt.seats[i].glow -= dt;
}
function prtQueueShift() {
  var i, g;
  if (!prtQueueFree(0)) return;
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.q === 1 && g.st === 'wait') { g.q = 0; prtGuestBack(g, g.x, g.y); return; }
  }
}

// ---------- Verho ----------
function prtUpdateCurtain(dt) {
  var C = prt.cur, L = prt.L, d = prt.drag, k0 = C.k, sp;
  if (C.thump > 0) C.thump -= dt;
  if (d && d.kind === 'rope') C.k += (C.kd - C.k) * Math.min(1, dt * 22);
  else {
    // Päästetty: verho rullautuu loppuun asti (alas painovoimalla, ylös jousella)
    sp = C.goal > C.k ? 2.6 + C.k * 3 : 3.2;
    if (C.goal > C.k) C.k = Math.min(C.goal, C.k + sp * dt);
    else if (C.goal < C.k) C.k = Math.max(C.goal, C.k - sp * dt);
  }
  C.k = prtClamp(C.k, 0, 1);
  if (Math.abs(C.k - C.lastK) > 0.07) { prtSfx('roll', C.k > C.lastK); C.lastK = C.k; }
  if (C.k >= 0.995 && k0 < 0.995) {
    C.thump = 0.35;
    prtSfx('thump');
    artShakeStart(viewH * 0.004, 0.2);
    prtPuff(L.cx, L.curBot, 8, '#e8e0f0', { spread: 0.6, vy: -0.03, r: 0.016 });
  }
  if (C.k <= 0.005 && k0 > 0.005) { playNote(660, 0, 0.08, 'triangle', 0.15); playNote(880, 0.08, 0.12, 'triangle', 0.15); }
}

// ---------- Kurkkiva pilvi ----------
function prtCloudStart() {
  var cl = prt.cloud, L = prt.L, x0 = L.W * 0.3, x1 = L.W * 0.78;
  cl.st = 'warn';
  cl.t = 0;
  cl.x = x0 + Math.random() * (x1 - x0);
  cl.warn = prt.firstPeek ? PRT_WARN_FIRST : prtLerp(PRT_WARN[0], PRT_WARN[1], prtGlobalProg());
  cl.seen = false;
  cl.duck = 0;
  cl.look = 0;
  cl.first = prt.firstPeek;
  prt.peekN++;
  prtSfx('hmm');
}
function prtUpdateCloud(dt) {
  var cl = prt.cloud, p, L = prt.L, H = viewH;
  if (cl.blush > 0) cl.blush -= dt;
  if (cl.hihi > 0) cl.hihi -= dt;
  if (cl.st === 'off') { prtPeekTick(dt); return; }
  cl.t += dt;
  if (cl.st === 'warn') {
    if (cl.t > cl.warn * 0.5 && cl.t - dt <= cl.warn * 0.5) { prt.prin.bang = 1.0; playNote(1175, 0, 0.08, 'sine', 0.12); }
    if (cl.t >= cl.warn) { cl.st = 'look'; cl.t = 0; playNote(330, 0, 0.12, 'sine', 0.12); }
  } else if (cl.st === 'look' || cl.st === 'mutter') {
    cl.look = Math.sin(cl.t * 2.2) * 0.9;
    if (cl.t >= PRT_GRACE || cl.st === 'mutter') {
      if (!prtCovered()) { prtSeen(); return; }
      prt.prin.whistle = 0.5;
      if (!prt.whistled) { prt.whistled = true; prtSfx('whistle'); }
    }
    if (cl.st === 'look' && cl.t >= PRT_LOOK) { cl.st = 'mutter'; cl.t = 0; prtSfx('mutter'); }
    else if (cl.st === 'mutter' && cl.t >= PRT_MUTTER) { cl.st = 'sink'; cl.t = 0; playNote(262, 0, 0.2, 'sine', 0.12); playNote(196, 0.18, 0.3, 'sine', 0.12); }
  } else if (cl.st === 'sink') {
    if (cl.t >= (cl.duck > 0 ? 0.45 : PRT_SINK)) prtCloudOff();
  } else if (cl.st === 'seen') {
    if (cl.t >= 0.9) {
      p = prtCloudPos();
      cl.sx = p.x;
      cl.sy = p.y;
      cl.st = 'swoop';
      cl.t = 0;
      prtSfx('whoosh');
    }
  } else if (cl.st === 'swoop') {
    if (cl.t >= 0.7) { cl.st = 'shower'; cl.t = 0; prtSfx('rain'); cl.applied = false; }
  } else if (cl.st === 'shower') {
    if (Math.random() < dt * 30) prtPuff(cl.tx + (Math.random() - 0.5) * prtCloudS() * 2, cl.ty + prtCloudS() * 0.4, 1, '#9ab8f0', { kind: 'drop', vy: 0.55, vx: 0.01, life: 0.5, r: 0.006, spread: 0.01 });
    if (!cl.applied && cl.t >= 0.5) { cl.applied = true; prtApplyDamage(cl.dmg); prtSfx('rain'); }
    if (cl.t >= 1.8) { cl.st = 'leave'; cl.t = 0; playNote(392, 0, 0.12, 'triangle', 0.12); playNote(330, 0.12, 0.2, 'triangle', 0.12); }
  } else if (cl.st === 'leave') {
    if (cl.t >= 1.1) prtCloudOff();
  }
}
function prtCloudOff() {
  var cl = prt.cloud;
  cl.st = 'off';
  cl.t = 0;
  prt.firstPeek = false;
  prt.whistled = false;
  prt.peekGap = PRT_PEEK_GAP;
}
function prtPeekTick(dt) {
  if (prt.st > 2 || prt.trans > 0 || prt.cake.light || celebrating) return;
  if (prt.peekGap > 0) { prt.peekGap -= dt; return; }
  if (!prt.peekPlan.length || !prt.stStarted) return;
  if (prtStProg() < prt.peekPlan[0]) return;
  if (prt.peekDelay < 0) prt.peekDelay = prtRange(PRT_PEEK_DELAY);
  prt.peekDelay -= dt;
  if (prt.peekDelay <= 0) {
    prt.peekPlan.shift();
    prt.peekDelay = -1;
    prtCloudStart();
  }
}
function prtSeen() {
  var cl = prt.cloud, d, H = viewH, i, g;
  cl.st = 'seen';
  cl.t = 0;
  cl.seen = true;
  prt.seenN++;
  prt.hatLostT = 1.6;
  prtCancelDrag();
  prtSfx('seen');
  d = prtPickDamage();
  cl.dmg = d;
  cl.tx = d ? d.x : prt.L.cx;
  cl.ty = Math.max(H * 0.2, (d ? d.y : H * 0.6) - H * 0.17);
  for (i = 0; i < prt.guests.length; i++) { g = prt.guests[i]; if (g.st === 'seated' || g.st === 'wait') g.mark = 1.2; }
}
// Mikä valmis koriste kastuu: ensisijaisesti nykyisen aseman viimeisin
function prtPickDamage() {
  var L = prt.L, H = viewH, si, i, S, best = null, bs = -1, p, ck = prt.cake, cands = [];
  function pen() {
    for (si = 0; si < 2; si++) {
      S = prt.strings[si];
      for (i = S.shown; i < S.n; i++) if (S.hooks[i].type >= 0 && !S.hooks[i].wrong && S.hooks[i].seq + si * 100 > bs) { bs = S.hooks[i].seq + si * 100; best = { kind: 'pen', si: si, i: i }; }
    }
    if (best) { p = prtHookPos(best.si, best.i); best.x = p.x; best.y = p.y + L.penH * 0.5; }
    return best;
  }
  function bal() {
    for (i = 0; i < 5; i++) if (prt.posts[i].done) cands.push(i);
    if (!cands.length) return null;
    i = cands[randInt(cands.length)];
    p = prtPostBalloon(i);
    return { kind: 'bal', i: i, x: p.x, y: p.y };
  }
  if (prt.st > 2) return null;
  if (prt.st === 0) return pen();
  if (prt.st === 1) return bal();
  if (prt.sub === 'spark') return { kind: 'blowout', x: L.cakeX, y: prtCakeTopY() - H * 0.03 };
  if (prt.sub === 'candles' && ck.candles.length) return { kind: 'candle', x: L.cakeX, y: prtCakeTopY() - H * 0.03 };
  if (ck.cream > 0.3) return { kind: 'cream', x: L.cakeX, y: prtCakeTopY() };
  if (ck.layers.length) return { kind: 'layer', x: L.cakeX, y: prtCakeTopY() };
  return null;
}
function prtApplyDamage(d) {
  var L = prt.L, H = viewH, S, h, p, ck = prt.cake, c, i, g, slot;
  for (i = 0; i < prt.guests.length; i++) { g = prt.guests[i]; if (g.st === 'seated' || g.st === 'wait') g.wet = 2.2; }
  prt.prin.wet = 2.2;
  if (!d) return;
  if (d.kind === 'pen') {
    S = prt.strings[d.si];
    h = S.hooks[d.i];
    p = prtHookPos(d.si, d.i);
    prtFly('penFall', p.x, p.y, L.basket.x, L.basket.y - H * 0.05, { type: h.type, dur: 1.1 });
    h.type = -1;
    h.seq = 0;
    S.done = false;
  } else if (d.kind === 'bal') {
    prt.posts[d.i].done = false;
    prt.posts[d.i].esc = 0.001;
    prt.bags[d.i] = 0.5;
    playNote(784, 0, 0.3, 'sine', 0.12); playNote(988, 0.25, 0.4, 'sine', 0.1);
  } else if (d.kind === 'blowout') {
    // Sade sammuttaa kynttilät: sytytetään uudestaan
    for (i = 0; i < ck.candles.length; i++) { ck.candles[i].lit = 0; p = prtCandlePos(i, ck.candles.length); prtPuff(p.x, p.y - H * 0.05, 2, '#d8d0e8', { r: 0.008, vy: -0.08 }); }
    for (i = 0; i < prt.guests.length; i++) prt.guests[i].num = 0;
    prt.sub = 'candles';
    playNote(330, 0, 0.2, 'sine', 0.15);
  } else if (d.kind === 'candle') {
    c = ck.candles.length - 1;
    p = prtCandlePos(c, ck.candles.length);
    ck.candles.pop();
    prtFly('candle', p.x, p.y - H * 0.02, L.candleBox.x, L.candleBox.y - H * 0.03, { dur: 0.8 });
  } else if (d.kind === 'cream') {
    ck.cream = Math.min(ck.cream, 0.4);
    ck.dollops = ck.dollops.slice(0, Math.floor(ck.cream * 14));
    ck.drips = 1;
    for (i = 0; i < ck.candles.length; i++) ck.candles[i].lit = 0;
    if (prt.sub !== 'cream') { prt.sub = 'cream'; }
    playNote(392, 0, 0.3, 'sine', 0.12); playNote(294, 0.25, 0.4, 'sine', 0.1);
  } else if (d.kind === 'layer') {
    c = ck.layers.pop();
    slot = 0;
    for (i = 0; i < 7; i++) if (ck.rack[i].col === c) slot = i;
    prtFly('layerSlide', L.cakeX, prtCakeTopY(), L.rack[slot].x, L.rack[slot].y - H * 0.02, { slot: slot, col: c, dur: 1.0 });
    if (prt.sub !== 'layers') prt.sub = 'layers';
  }
}

// ---------- Yllätys ----------
function prtFinTap(px, py) {
  var F = prt.fin, L = prt.L, H = viewH, w;
  if (!F) return;
  if (F.ph === 'ready' && Math.hypot(px - L.cannon.x, py - (L.cannon.y - H * 0.09)) < H * 0.13) { prtBoom(); return; }
  w = prtWitchPos();
  if (w && Math.hypot(px - w.x, py - w.y) < H * 0.09) {
    F.wPoke = 0.8;
    if (F.ph === 'boom') { prtSfx('hihi'); spawnSparkles(w.x, w.y - H * 0.06, 10, '#ff9ec6'); }
    else { playNote(330, 0, 0.18, 'sine', 0.12); playNote(294, 0.2, 0.25, 'sine', 0.1); }
    return;
  }
  if (prtPrincessTap(px, py)) return;
  if (F.ph === 'boom' && prtDecorTap(px, py)) return;
  if (F.ph !== 'boom' && F.hide) { prtSfx('hihi'); return; }
  propsTap(px, py);
}
function prtBoom() {
  var F = prt.fin, L = prt.L, H = viewH, i;
  F.ph = 'boom';
  F.t = 0;
  F.hide = false;
  prt.banner = { t: 0 };
  prt.shown.cannon = true;
  playNote(98, 0, 0.35, 'square', 0.2);
  playNote(131, 0, 0.3, 'sawtooth', 0.12);
  for (i = 0; i < 3; i++) playNote([523, 659, 784][i], 0.15 + i * 0.32, 0.28, 'triangle', 0.3);
  for (i = 0; i < 3; i++) playNote([1047, 1319, 1568][i], 0.15 + i * 0.32, 0.22, 'sine', 0.14);
  prtBits(L.cannon.x + H * 0.1, L.cannon.y - H * 0.2, 90, { a0: -1.2, spread: 1.4, sp: 1.6, s: 0.014 });
  prtBits(L.cannon.x + H * 0.1, L.cannon.y - H * 0.2, 30, { a0: -1.2, spread: 1.0, sp: 1.4, star: true, cols: ['#ffe27a', '#fff6c0'] });
  artShakeStart(H * 0.01, 0.35);
  artPop(L.cannon.x + H * 0.1, L.cannon.y - H * 0.2, H * 0.12, '#ffffff', 'burst');
}
function prtWitchPos() {
  var F = prt.fin, L = prt.L, H = viewH, k, x, y, s0;
  if (!F || F.ph === 'wait' || F.ph === 'hide') return null;
  if (F.ph === 'fly') {
    k = easeInOutSine(F.t / 3.4);
    s0 = L.summit;
    x = prtLerp(s0.x, L.witchLand.x, k) + Math.sin(k * Math.PI) * H * 0.12;
    y = prtLerp(s0.y, L.witchLand.y, k) - Math.sin(k * Math.PI) * H * 0.05;
    return { x: x, y: y + Math.sin(globalT * 3) * H * 0.008 };
  }
  return { x: L.witchLand.x, y: L.witchLand.y + Math.sin(globalT * 2.2) * H * 0.008 + (F.ph === 'boom' && F.t > 1.8 ? -Math.abs(Math.sin(F.t * 4)) * H * 0.02 : 0) };
}
function prtWitchMood() {
  var F = prt.fin;
  if (!F) return 'sulk';
  if (F.ph === 'fly') return 'sulk';
  if (F.ph === 'land' || F.ph === 'ready') return F.wPoke > 0 ? 'sad' : 'sulk';
  if (F.ph === 'boom') return F.t < 0.3 ? 'sulk' : (F.t < 1.9 ? 'sad' : 'happy');
  return 'happy';
}
function prtUpdateFin(dt) {
  var F = prt.fin, i, w, H = viewH;
  if (!F) return;
  F.t += dt;
  if (F.wPoke > 0) F.wPoke -= dt;
  if (F.ph === 'wait') {
    // Odotetaan, että siirtymä on ohi ja verho ylhäällä
    if (prt.trans <= 0 && prt.cur.k <= 0.01 && !prt.drag && prt.cloud.st === 'off') { F.ph = 'hide'; F.t = 0; F.hide = true; playNote(659, 0, 0.12, 'triangle', 0.18); playNote(523, 0.15, 0.2, 'triangle', 0.18); }
  } else if (F.ph === 'hide') {
    if (F.t > 1.4) { F.ph = 'fly'; F.t = 0; prtSfx('whoosh'); }
  } else if (F.ph === 'fly') {
    if (Math.random() < dt * 4) { w = prtWitchPos(); prtPuff(w.x - H * 0.05, w.y + H * 0.05, 1, '#d8d0f0', { r: 0.008, vy: 0.02 }); }
    if (F.t >= 3.4) { F.ph = 'land'; F.t = 0; playNote(262, 0, 0.3, 'sine', 0.14); playNote(220, 0.3, 0.45, 'sine', 0.12); }
  } else if (F.ph === 'land') {
    if (F.t >= 1.2) { F.ph = 'ready'; F.t = 0; }
  } else if (F.ph === 'boom') {
    w = prtWitchPos();
    if (F.t > 0.3 && F.t - dt <= 0.3) { for (i = 0; i < prt.guests.length; i++) prt.guests[i].cheer = 2.2; prt.prin.cheer = 2.5; }
    if (F.t > 1.9 && F.t - dt <= 1.9) {
      for (i = 0; i < 6; i++) playNote([784, 988, 1175, 1568, 1976, 2349][i], i * 0.08, 0.2, 'sine', 0.18);
      spawnSparkles(w.x, w.y - H * 0.06, 18, '#ff9ec6');
    }
    if (F.t > 1.9 && Math.random() < dt * 14) prtPuff(w.x + (Math.random() - 0.5) * H * 0.14, w.y - H * 0.16, 1, '#fff2a0', { kind: 'glit', vy: 0.12, vx: 0.02, life: 1.2, r: 0.008, spread: 0.01 });
    if (F.t >= 4.4 && !prt.starsGiven) {
      prt.starsGiven = true;
      F.ph = 'cel';
      startCelebration();
      if (prtGolden()) {
        // Kultainen juhlahattu: +1 tähti (startCelebration antoi jo 2)
        starCoins += 1;
        starGain.n += 1;
        starGain.until = globalT + 3.2;
        saveProgress();
        spawnSparkles(viewW / 2, viewH * 0.45, 30, '#ffd24f');
      }
    }
  }
}
function prtGolden() { return prt.seenN === 0; }

// ---------- Päivitys ----------
function updateParty(dt) {
  var T, k, i, S, f, p;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  prtUpdateFx(dt);
  if (!prt.L) return;
  if (prt.banner) prt.banner.t += dt;
  if (celebrating) { prt.celT += dt; prtUpdateGuests(dt); prtUpdateFin(dt); return; }
  prt.t += dt;
  prt.stT += dt;
  if (!holding) prt.idleT += dt;
  if (prt.trans > 0) prt.trans -= dt;
  if (prt.hatLostT > 0) prt.hatLostT -= dt;
  if (prt.matchWob > 0) prt.matchWob -= dt;
  T = prtToolTargets();
  for (k in T) if (T.hasOwnProperty(k)) prt.toolK[k] += prtClamp(T[k] - prt.toolK[k], -dt * 2.5, dt * 2.5);
  prtUpdateDrag(dt);
  prtUpdateCurtain(dt);
  prtUpdateCloud(dt);
  prtUpdatePump(dt);
  prtUpdateLight(dt);
  prtUpdateGuests(dt);
  prtUpdateFin(dt);
  for (i = 0; i < 2; i++) {
    S = prt.strings[i];
    if (S.demoT >= 0 && S.demoT < S.shown * 0.28 + 0.7) {
      p = S.demoT;
      S.demoT += dt;
      // Mallikuvio soi viiri kerrallaan
      for (k = 0; k < S.shown; k++) if (p < 0.4 + k * 0.28 && S.demoT >= 0.4 + k * 0.28) { S.hooks[k].pop = 0.35; playNote(PRT_PEN[S.hooks[k].type].note, 0, 0.16, 'triangle', 0.22); }
    }
    if (S.wave > 0) S.wave -= dt;
    for (k = 0; k < S.n; k++) {
      f = S.hooks[k];
      if (f.pop > 0) f.pop -= dt;
      if (f.swing > 0) f.swing -= dt;
      if (f.wrong > 0) {
        f.wrong -= dt;
        if (f.wrong <= 0) {
          // Väärä viiri putoaa lepattaen koriin
          p = prtHookPos(i, k);
          prtFly('penFall', p.x, p.y, prt.L.basket.x, prt.L.basket.y - viewH * 0.05, { type: f.type, dur: 0.9 });
          f.type = -1;
          f.wrong = 0;
        }
      }
    }
  }
  if (prt.cake.squash > 0) prt.cake.squash -= dt;
  for (i = 0; i < prt.cake.candles.length; i++) if (prt.cake.candles[i].pop > 0) prt.cake.candles[i].pop -= dt;
  for (i = 0; i < 7; i++) if (prt.cake.rack[i].wob > 0) prt.cake.rack[i].wob -= dt;
  if (prt.cake.glow > 0) prt.cake.glow -= dt;
  if (prt.cake.spark > 0) {
    prt.cake.spark += dt;
    if (Math.random() < dt * 20) spawnSparkles(prt.L.cakeX, prtCakeTopY() - viewH * 0.075, 1, Math.random() < 0.5 ? '#ffe27a' : '#ffffff');
  }
  if (prt.cake.numPop) { prt.cake.numPop.t += dt; if (prt.cake.numPop.t > 1) prt.cake.numPop = null; }
  for (i = 0; i < 5; i++) {
    if (prt.bags[i] > 0) prt.bags[i] -= dt;
    if (prt.posts[i].pop > 0) prt.posts[i].pop -= dt;
    if (prt.posts[i].esc > 0) { prt.posts[i].esc += dt; if (prt.posts[i].esc > 2.6) prt.posts[i].esc = 0; }
  }
  if (prt.st === 1 && prt.trans <= 0 && prtUnits() === 5 && !prtFlyingBalloons()) prtStationDone();
  prtUpdatePrincess(dt);
  prt.hintStep = prtNextStep();
  if (prtHintWanted(prt.hintStep)) prt.hintT += dt;
  else prt.hintT = 0;
}
function prtFlyingBalloons() {
  var i;
  for (i = 0; i < prt.flies.length; i++) if (prt.flies[i].kind === 'bal') return true;
  return false;
}
function prtUpdatePrincess(dt) {
  var P = prt.prin;
  P.t += dt;
  if (P.bang > 0) P.bang -= dt;
  if (P.whistle > 0) P.whistle -= dt;
  if (P.shh > 0) P.shh -= dt;
  if (P.poke > 0) P.poke -= dt;
  if (P.cheer > 0) P.cheer -= dt;
  if (P.spin > 0) P.spin -= dt;
  if (P.wet > 0) P.wet -= dt;
}
function prtUpdateFx(dt) {
  var i, f, p, b, L = prt.L, H = viewH;
  for (i = prt.flies.length - 1; i >= 0; i--) {
    f = prt.flies[i];
    f.t += dt;
    if (f.t < f.dur) continue;
    prt.flies.splice(i, 1);
    if (f.kind === 'layer' || f.kind === 'layerSlide') { prt.cake.rack[f.o.slot].here = true; prt.cake.rack[f.o.slot].wob = 0.3; }
    if (f.kind === 'bal') {
      prt.posts[f.o.post].done = true;
      prt.posts[f.o.post].pop = 0.5;
      p = prtPostBalloon(f.o.post);
      spawnSparkles(p.x, p.y, 12, prt.posts[f.o.post].col);
      artPop(p.x, p.y, p.r * 1.4, '#ffffff', 'ring');
      playNote(prtNoteOfCol(f.o.post) * 2, 0, 0.2, 'triangle', 0.22);
      prt.shown.tie = true;
    }
    if (f.kind === 'ember' && f.o.g) { f.o.g.num = f.o.n; f.o.g.poke = 0.4; playNote(1568, 0, 0.08, 'sine', 0.12); }
    if (f.kind === 'ember' && !f.o.g) { prtPuff(f.x1, f.y1, 3, '#c8c0d8', { r: 0.008 }); playNote(294, 0, 0.12, 'triangle', 0.15); }
  }
  for (i = prt.puffs.length - 1; i >= 0; i--) {
    p = prt.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 2);
    if (p.t > p.life) prt.puffs.splice(i, 1);
  }
  for (i = prt.bits.length - 1; i >= 0; i--) {
    b = prt.bits[i];
    b.t += dt;
    b.vx *= Math.max(0, 1 - dt * b.drag);
    b.vy = b.vy * Math.max(0, 1 - dt * b.drag) + H * 0.9 * dt;
    if (b.vy > H * 0.18) b.vy = H * 0.18;
    b.x += b.vx * dt + Math.sin(b.t * 6 + b.rot) * H * 0.03 * dt;
    b.y += b.vy * dt;
    b.rot += b.vr * dt;
    if (b.t > b.life) prt.bits.splice(i, 1);
  }
}

// ---------- Seuraava askel (vihjekäsi ja testibotti) ----------
// Paluu: { kind, from, to } raahaukselle, { kind, from, hold } pidolle tai { kind, from } napautukselle
function prtNextStep() {
  var L = prt.L, H = viewH, cl = prt.cloud, h, i, g, S, si, j, t, types, b, p, ck = prt.cake, pu = prt.pump, n, G;
  if (!L || celebrating) return null;
  h = prtHandPos();
  if ((cl.st === 'warn' || prtWatching()) && !prtCovered()) return { kind: 'ropeDown', from: { x: h.x, y: h.y }, to: { x: L.ropeX, y: L.handDown + H * 0.02 } };
  if (prt.cur.k > 0.03) {
    if (cl.st === 'off' || cl.st === 'sink') return { kind: 'ropeUp', from: { x: h.x, y: h.y }, to: { x: L.ropeX, y: L.handUp - H * 0.04 } };
    return null;
  }
  if (prt.st === 3) {
    if (prt.fin && prt.fin.ph === 'ready') return { kind: 'cannon', from: { x: L.cannon.x, y: L.cannon.y - H * 0.1 } };
    return null;
  }
  if (prtCloudBusy() || prt.trans > 0 || ck.light) return null;
  for (i = 0; i < prt.guests.length; i++) {
    g = prt.guests[i];
    if (g.st !== 'wait' || g.hid > 0 || g.q !== 0) continue;
    p = prtSeatPos(g.seat);
    return { kind: 'guest', from: { x: g.x, y: g.y - H * 0.05 }, to: { x: p.x, y: p.y - H * 0.07 }, g: g };
  }
  if (prt.st === 0) {
    types = prtBasketTypes();
    for (si = 0; si < 2; si++) {
      S = prt.strings[si];
      if (!prtStringOpen(si)) continue;
      for (j = S.shown; j < S.n; j++) {
        if (S.hooks[j].type >= 0) continue;
        t = S.period[j % S.period.length];
        i = types.indexOf(t);
        if (i < 0) return null;
        b = prtBasketSlot(i, types.length);
        p = prtHookPos(si, j);
        return { kind: 'pen', from: { x: b.x, y: b.y + H * 0.02 }, to: { x: p.x, y: p.y + H * 0.035 }, type: t, si: si, j: j };
      }
    }
    return null;
  }
  if (prt.st === 1) {
    if (pu.post < 0) {
      for (i = 0; i < 5; i++) {
        if (prt.posts[i].done || prtBalFlying(i)) continue;
        return { kind: 'bag', from: { x: L.bags[i].x, y: L.bags[i].y - H * 0.04 }, post: i };
      }
      return null;
    }
    if (pu.popT > 0) return null;
    return { kind: 'pump', from: { x: L.pump.x, y: L.pump.y - H * 0.13 }, hold: true, post: pu.post };
  }
  if (prt.sub === 'layers') {
    n = ck.layers.length;
    for (i = 0; i < 7; i++) if (ck.rack[i].col === n && ck.rack[i].here) return { kind: 'layer', from: { x: L.rack[i].x, y: L.rack[i].y - H * 0.02 }, to: { x: L.cakeX, y: prtCakeTopY() - H * 0.02 }, slot: i };
    return null;
  }
  if (prt.sub === 'cream') return { kind: 'rub', from: { x: L.bowl.x, y: L.bowl.y - H * 0.03 }, to: { x: L.cakeX, y: prtCakeTopY() + H * 0.03 } };
  if (prt.sub === 'candles') {
    if (!prtSeatedAll()) return null;
    n = ck.candles.length;
    G = prt.guests.length;
    if (n < G) return { kind: 'candle', from: { x: L.candleBox.x, y: L.candleBox.y - H * 0.04 }, to: { x: L.cakeX, y: prtCakeTopY() - H * 0.02 } };
    if (n > G) { p = prtCandlePos(n - 1, n); return { kind: 'candleOff', from: { x: p.x, y: p.y - H * 0.02 }, to: { x: L.candleBox.x, y: L.candleBox.y - H * 0.04 } }; }
    return { kind: 'match', from: { x: L.match.x, y: L.match.y - H * 0.06 }, to: { x: L.cakeX, y: prtCakeTopY() - H * 0.04 } };
  }
  if (prt.sub === 'spark' && !ck.done) return { kind: 'spark', from: { x: L.jar.x, y: L.jar.y - H * 0.06 }, to: { x: L.cakeX, y: prtCakeTopY() - H * 0.04 } };
  return null;
}
function prtBalFlying(i) {
  var j;
  for (j = 0; j < prt.flies.length; j++) if (prt.flies[j].kind === 'bal' && prt.flies[j].o.post === i) return true;
  return false;
}
function prtHintWanted(st) {
  if (!st || prt.drag || holding) return false;
  if (st.kind === 'ropeDown') return !prt.shown.ropeDown;
  if (st.kind === 'ropeUp') return !prt.shown.ropeUp || prt.idleT > 2.5;
  if (st.kind === 'cannon') return prt.fin.t > 0.8;
  if (st.kind === 'pump' && prt.pump.p > 0.05) return false;
  return !prt.shown[st.kind] || prt.idleT > PRT_HINT_IDLE;
}

// ---------- Tökättävät ----------
// Alppitorvi (kaiku vastaa vuorilta kolmesti; 5.: vuorikauris vastaa),
// lumiukko (hattu lentää; 3.: aivastaa lunta; 5.: vilkuttaa), kotkan pesä
// (poikaset piipittävät; 3.: emo lentää yli; 5.: höyhen leijuu), lumihuippu
// (lumipallo vierii rinnettä; 5.: pallosta hyppää lumijänis), puro
// (kala hyppää; 3.: sammakko; 5.: sateenkaarisuihku), kellokukat (soivat;
// 3.: kimalainen; 5.: kokonainen sävelmä), murmelin kolo (poikanen pomppaa;
// 3.: tuo kukan; 5.: sisarukset) ja piknikkori (omena; 3.: hiiri; 5.:
// kuppikakku).
function prtSetupProps() {
  var L = prt.L, H = viewH, x, R = L.rocks;
  propsReset();
  x = Math.max(H * 0.24, L.cx - H * 0.48);
  propAdd({
    x: x, y: prtRidgeAt(x) + H * 0.012, r: H * 0.075, hy: H * 0.03, color: '#ffd39a', note: 196, amp: 0.05, echo: 0, goat: 0,
    update: function (p, dt) { if (p.echo > 0) p.echo -= dt; if (p.goat > 0) p.goat -= dt; },
    draw: function (c, p) { prtDrawAlphorn(c, H, p); },
    poke: function (p) {
      var i;
      playNote(147, 0, 0.8, 'triangle', 0.3);
      playNote(294, 0, 0.6, 'sine', 0.12);
      playNote(220, 0.25, 0.6, 'triangle', 0.22);
      if (p.n % 5 === 0) {
        p.goat = 2.6;
        for (i = 0; i < 4; i++) playNote(523 + (i % 2) * 30, 1.0 + i * 0.07, 0.08, 'sawtooth', 0.04);
        return;
      }
      p.echo = 2.4;
      for (i = 1; i <= 3; i++) { playNote(220, 0.25 + i * 0.6, 0.5, 'triangle', 0.22 / (i + 1)); playNote(147, i * 0.6, 0.5, 'triangle', 0.25 / (i + 1)); }
    }
  });
  x = L.W - H * 0.21;
  propAdd({
    x: x, y: prtRidgeAt(x) + H * 0.01, r: H * 0.05, hy: H * 0.045, color: '#ffffff', note: 880, amp: 0.08, hat: 0, sneeze: 0, wave: 0,
    update: function (p, dt) { if (p.hat > 0) p.hat -= dt; if (p.sneeze > 0) p.sneeze -= dt; if (p.wave > 0) p.wave -= dt; },
    draw: function (c, p) { prtDrawSnowman(c, H, p); },
    poke: function (p) {
      p.hat = 1.0;
      playNote(659, 0, 0.08, 'triangle', 0.2);
      playNote(988, 0.5, 0.1, 'triangle', 0.2);
      if (p.n % 3 === 0) { p.sneeze = 1.2; playNote(1568, 0.2, 0.05, 'square', 0.05); playNote(392, 0.27, 0.15, 'sine', 0.2); }
      if (p.n % 5 === 0) { p.wave = 2.0; spawnSparkles(p.x, p.y - H * 0.05, 14, '#e0f0ff'); }
    }
  });
  propAdd({
    x: H * 0.065, y: H * 0.205, r: H * 0.05, hy: H * 0.015, color: '#ffe27a', note: 1568, amp: 0.06, beak: 0, mama: 0, feather: 0,
    update: function (p, dt) { if (p.beak > 0) p.beak -= dt; if (p.mama > 0) p.mama -= dt; if (p.feather > 0) p.feather -= dt; },
    draw: function (c, p) { prtDrawNest(c, H, p); },
    poke: function (p) {
      var i;
      p.beak = 1.0;
      for (i = 0; i < 4; i++) playNote(2093 + (i % 2) * 300, i * 0.1, 0.05, 'sine', 0.12);
      if (p.n % 3 === 0) { p.mama = 3.2; playNote(1760, 0.5, 0.1, 'square', 0.04); playNote(1568, 0.6, 0.25, 'square', 0.04); }
      if (p.n % 5 === 0) p.feather = 3;
    }
  });
  propAdd({
    x: L.W * 0.44, y: H * 0.105, r: H * 0.06, hy: H * 0.0, color: '#ffffff', note: 1319, amp: 0, ball: 0, hare: 0, nb: 1,
    update: function (p, dt) {
      if (p.ball > 0) {
        p.ball -= dt;
        if (p.ball <= 0) { prtPuff(prtSnowballPos(p, 1).x, prtSnowballPos(p, 1).y, 6, '#ffffff', { r: 0.012 }); playNote(392, 0, 0.12, 'sine', 0.15); if (p.n % 5 === 0) { p.hare = 1.8; playNote(1568, 0.05, 0.08, 'sine', 0.12); } }
      }
      if (p.hare > 0) p.hare -= dt;
    },
    draw: function (c, p) { prtDrawPeakFx(c, H, p); },
    poke: function (p) {
      var i;
      p.ball = 1.6;
      p.nb = p.n % 3 === 0 ? 2 : 1;
      for (i = 0; i < 6; i++) playNote(1047 - i * 90, i * 0.2, 0.08, 'sine', 0.08);
    }
  });
  x = R[0].x - R[0].w * 0.12;
  propAdd({
    x: x, y: H * 0.995, r: H * 0.045, hy: H * 0.03, color: '#f0c070', note: 784, amp: 0.1, lid: 0, mouse: 0, layer: 1,
    update: function (p, dt) { if (p.lid > 0) p.lid -= dt; if (p.mouse > 0) p.mouse -= dt; },
    draw: function (c, p) { prtDrawPicnic(c, H, p); },
    poke: function (p) {
      p.lid = 0.8;
      playNote(523, 0, 0.08, 'square', 0.05);
      if (p.n % 3 === 0) { p.mouse = 1.8; playNote(2637, 0.2, 0.05, 'sine', 0.12); playNote(2794, 0.3, 0.05, 'sine', 0.12); }
      prtPropToss(p.x, p.y - H * 0.04, p.n % 5 === 0 ? 'cupcake' : (p.n % 2 ? 'apple' : 'sandwich'), H);
    }
  });
  x = R[1].x - R[1].w * 0.18;
  propAdd({
    x: x, y: H * 0.998, r: H * 0.05, hy: H * 0.03, color: '#c8a070', note: 2349, amp: 0.04, up: 0, flower: 0, sibs: 0, layer: 1,
    update: function (p, dt) { if (p.up > 0) p.up -= dt; },
    draw: function (c, p) { prtDrawBurrow(c, H, p); },
    poke: function (p) {
      p.up = 1.6;
      p.flower = p.n % 3 === 0 ? 1 : 0;
      p.sibs = p.n % 5 === 0 ? 1 : 0;
      playNote(2349, 0.1, 0.12, 'sine', 0.15);
      playNote(2637, 0.25, 0.16, 'sine', 0.15);
      if (p.sibs) { playNote(2794, 0.4, 0.1, 'sine', 0.12); playNote(3136, 0.5, 0.12, 'sine', 0.12); }
    }
  });
  x = (R[1].x + R[1].w * 0.5 + R[2].x - R[2].w * 0.5) / 2;
  propAdd({
    x: x, y: H * 0.99, r: H * 0.045, hy: H * 0.045, color: '#8fb8ff', note: 1760, amp: 0.14, ring: 0, bee: 0, layer: 1,
    update: function (p, dt) { if (p.ring > 0) p.ring -= dt; if (p.bee > 0) p.bee -= dt; },
    draw: function (c, p) { prtDrawBells(c, H, p); },
    poke: function (p) {
      var i, mel = [1319, 1175, 1047, 1175, 1319, 1319, 1319];
      p.ring = 1.2;
      playNote(2093, 0, 0.25, 'sine', 0.14);
      playNote(2637, 0.09, 0.25, 'sine', 0.12);
      playNote(3136, 0.18, 0.3, 'sine', 0.1);
      if (p.n % 3 === 0) { p.bee = 3; for (i = 0; i < 6; i++) playNote(220 + (i % 2) * 15, 0.3 + i * 0.1, 0.1, 'sawtooth', 0.025); }
      if (p.n % 5 === 0) for (i = 0; i < mel.length; i++) playNote(mel[i], 0.4 + i * 0.2, 0.18, 'sine', 0.16);
    }
  });
  x = L.cx + (L.W > H * 1.5 ? H * 0.42 : H * 0.3);
  propAdd({
    x: Math.min(x, L.poleR - H * 0.1), y: prtRidgeAt(x) + H * 0.028, r: H * 0.05, hy: H * 0.015, color: '#9fd8ff', note: 1175, amp: 0, fish: 0, frog: 0, bow: 0,
    update: function (p, dt) { if (p.fish > 0) p.fish -= dt; if (p.frog > 0) p.frog -= dt; if (p.bow > 0) p.bow -= dt; },
    draw: function (c, p) { prtDrawBrook(c, H, p); },
    poke: function (p) {
      p.fish = 1.1;
      playNote(880, 0, 0.06, 'sine', 0.15);
      playNote(1319, 0.45, 0.08, 'sine', 0.15);
      prtPuff(p.x, p.y - H * 0.01, 4, '#bfe6ff', { r: 0.006, vy: -0.12 });
      if (p.n % 3 === 0) { p.frog = 2.2; playNote(196, 0.3, 0.12, 'square', 0.06); playNote(185, 0.45, 0.15, 'square', 0.06); }
      if (p.n % 5 === 0) { p.bow = 2.4; playNote(1047, 0.2, 0.3, 'triangle', 0.18); playNote(1568, 0.35, 0.4, 'triangle', 0.18); }
    }
  });
}
function prtPropToss(x, y, what, H) {
  propDrop({
    x: x, y: y, vx: H * (0.1 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1), vy: -H * (0.55 + Math.random() * 0.2), ground: H * 0.985, life: 2,
    draw: function (c) {
      if (what === 'apple') { artCircle(c, 0, 0, H * 0.014, '#ff5a5a', { hi: 0.5 }); artBlob(c, H * 0.004, -H * 0.016, H * 0.006, H * 0.003, '#5fbf4a', { line: false }); }
      else if (what === 'sandwich') { artRoundRect(c, -H * 0.016, -H * 0.008, H * 0.032, H * 0.016, H * 0.004, '#f8dca0', { lineColor: '#a07a40' }); c.fillStyle = '#7ad66f'; c.fillRect(-H * 0.016, -H * 0.002, H * 0.032, H * 0.004); }
      else {
        artRoundRect(c, -H * 0.012, -H * 0.006, H * 0.024, H * 0.016, H * 0.004, '#ff9ec6', { lineColor: '#b0507a' });
        artBlob(c, 0, -H * 0.01, H * 0.015, H * 0.009, '#fffaf4', { lineColor: '#c8b0c8' });
        artCircle(c, 0, -H * 0.02, H * 0.004, '#ff4a5a', { line: false });
      }
    }
  });
}

// ---------- Taustat (esirenderöinti) ----------
function renderPartyBg(b, w, h) {
  var L = prt.L, W, i, x, y, g, r, rnd = prtSeeded(7), px, s;
  if (!L || L.W !== viewW || L.H !== viewH) { prtLayout(); L = prt.L; }
  W = L.W;
  g = b.createLinearGradient(0, 0, 0, L.ridgeY);
  g.addColorStop(0, '#8ec8ff');
  g.addColorStop(0.6, '#cbe6ff');
  g.addColorStop(1, '#ffeef6');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, W * 0.18, h * 0.1, h * 0.045, 0.2, '#fff4c8', '#fffdf0', '#ffe08a');
  for (i = 0; i < 6; i++) drawCloud(b, W * (0.08 + i * 0.17), h * (0.05 + (i % 3) * 0.035), h * (0.018 + (i % 2) * 0.008), 0.6);
  // Kaukaiset huiput laventelina, lumilakit
  prtMountain(b, W * 0.12, h * 0.15, h * 0.32, artMix('#a9a0dc', '#dceaff', 0.45));
  prtMountain(b, W * 0.62, h * 0.13, h * 0.3, artMix('#a9a0dc', '#dceaff', 0.45));
  prtMountain(b, W * 0.44, h * 0.085, h * 0.36, artMix('#9a90d0', '#dceaff', 0.3));
  // Myrskyvuoren huippu oikealla ja sen yllä noidan iso sadepilvi
  prtMountain(b, L.summit.x, L.summit.y + h * 0.02, h * 0.42, artMix('#8a7cc0', '#dceaff', 0.2));
  b.fillStyle = 'rgba(110,100,160,0.85)';
  cloudShape(b, L.summit.x, L.summit.y, h * 0.03);
  b.strokeStyle = 'rgba(120,140,200,0.45)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 6; i++) { x = L.summit.x - h * 0.05 + i * h * 0.02; b.beginPath(); b.moveTo(x, L.summit.y + h * 0.02); b.lineTo(x - h * 0.008, L.summit.y + h * 0.05); b.stroke(); }
  // Kallionkieleke vasemmalla (kotkan pesä)
  b.beginPath();
  b.moveTo(0, h * 0.2);
  b.lineTo(h * 0.03, h * 0.185);
  b.quadraticCurveTo(h * 0.1, h * 0.19, h * 0.115, h * 0.215);
  b.lineTo(h * 0.09, h * 0.3);
  b.lineTo(0, h * 0.3);
  b.closePath();
  artFillPath(b, '#8f86b8', h * 0.18, h * 0.3, h * 0.08, { lineColor: '#5a5088' });
  // Harjanne: lähin kallio, lumilaikkuja ja kiviä
  b.beginPath();
  b.moveTo(0, h);
  for (i = 0; i < L.ridge.length; i++) b.lineTo(L.ridge[i].x, L.ridge[i].y);
  b.lineTo(W, h);
  b.lineTo(w, h);
  b.closePath();
  artFillPath(b, '#9d93c4', L.ridgeY - h * 0.05, L.barY + h * 0.02, h * 0.1, { lineColor: '#5e5490', line: Math.max(1.5, h * 0.004) });
  b.fillStyle = 'rgba(255,255,255,0.85)';
  for (i = 0; i < L.ridge.length - 2; i += 3) {
    if (rnd() < 0.45) continue;
    x = L.ridge[i].x;
    y = L.ridge[i].y;
    b.beginPath(); b.moveTo(x - h * 0.02, y + h * 0.006); b.quadraticCurveTo(x, y - h * 0.006, x + h * 0.025, y + h * 0.007); b.quadraticCurveTo(x, y + h * 0.014, x - h * 0.02, y + h * 0.006); b.fill();
  }
  // Niitty harjanteen alla
  g = b.createLinearGradient(0, L.barY, 0, h);
  g.addColorStop(0, '#a8e08a');
  g.addColorStop(0.5, '#8fd673');
  g.addColorStop(1, '#79c661');
  b.fillStyle = g;
  b.beginPath();
  b.moveTo(0, L.barY + h * 0.02);
  for (x = 0; x <= W; x += h * 0.05) b.lineTo(x, L.barY + h * 0.012 + Math.sin(x / h * 9) * h * 0.006);
  b.lineTo(W, h);
  b.lineTo(0, h);
  b.closePath();
  b.fill();
  // Kukkapilkut ja ruohotupsut
  for (i = 0; i < 70; i++) {
    x = rnd() * W;
    y = L.barY + h * 0.04 + rnd() * (h - L.barY - h * 0.06);
    s = h * (0.003 + rnd() * 0.004) * (0.6 + (y / h));
    b.fillStyle = ['#ffffff', '#ffe27a', '#ff9ec6', '#c8b8ff'][i % 4];
    b.beginPath(); b.arc(x, y, s, 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = 'rgba(70,140,60,0.35)';
  b.lineWidth = Math.max(1, h * 0.002);
  for (i = 0; i < 50; i++) {
    x = rnd() * W;
    y = L.barY + h * 0.05 + rnd() * (h - L.barY - h * 0.05);
    b.beginPath(); b.moveTo(x - h * 0.006, y); b.lineTo(x - h * 0.003, y - h * 0.012); b.moveTo(x, y); b.lineTo(x + h * 0.001, y - h * 0.015); b.moveTo(x + h * 0.006, y); b.lineTo(x + h * 0.004, y - h * 0.011); b.stroke();
  }
  // Maavarjot pöydän ja työkalujen alla
  artShadow(b, L.cx, L.tableY + h * 0.1, (L.tableX1 - L.tableX0) * 0.58, h * 0.03, 0.14);
}
function prtMountain(b, x, y, hw, col) {
  var h = viewH, base = prt.L.ridgeY + h * 0.04;
  b.beginPath();
  b.moveTo(x - hw, base);
  b.quadraticCurveTo(x - hw * 0.35, y + (base - y) * 0.25, x - h * 0.012, y);
  b.lineTo(x + h * 0.012, y + h * 0.004);
  b.quadraticCurveTo(x + hw * 0.4, y + (base - y) * 0.3, x + hw, base);
  b.closePath();
  artFillPath(b, col, y, base, hw * 0.5, { line: false });
  // Lumilakki
  b.beginPath();
  b.moveTo(x - hw * 0.16, y + (base - y) * 0.2);
  b.quadraticCurveTo(x - hw * 0.08, y + h * 0.005, x, y);
  b.quadraticCurveTo(x + hw * 0.08, y + h * 0.006, x + hw * 0.18, y + (base - y) * 0.22);
  b.lineTo(x + hw * 0.1, y + (base - y) * 0.17);
  b.lineTo(x + hw * 0.03, y + (base - y) * 0.24);
  b.lineTo(x - hw * 0.05, y + (base - y) * 0.16);
  b.closePath();
  b.fillStyle = 'rgba(255,255,255,0.92)';
  b.fill();
}
function prtCanvas(name, w, h) {
  var cv = prt.cv[name], sc = DPR;
  if (!cv) { cv = document.createElement('canvas'); prt.cv[name] = cv; }
  cv.width = Math.max(1, Math.round(w * sc));
  cv.height = Math.max(1, Math.round(h * sc));
  cv.cw = w;
  cv.ch = h;
  var b = cv.getContext('2d');
  b.setTransform(sc, 0, 0, sc, 0, 0);
  b.clearRect(0, 0, w, h);
  return b;
}
function prtRenderLayers() {
  var L = prt.L, H = viewH;
  if (!L || !L.W || !L.H) return;
  prtRenderCurtain(prtCanvas('cur', L.poleR - L.poleL, L.curBot - L.curTop), L.poleR - L.poleL, L.curBot - L.curTop);
  prtRenderTable(prtCanvas('table', L.tableX1 - L.tableX0 + H * 0.04, H * 0.13));
  prtRenderFront(prtCanvas('front', L.W, H * 0.17));
}
// Naamioverho: kalliolta näyttävä kangas (kivet, lumilaikut, männyt)
function prtRenderCurtain(b, w, h) {
  var H = viewH, rnd = prtSeeded(31), g, x, y, i, r, col, n;
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#a49ad0');
  g.addColorStop(1, '#8c82b8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (y = -H * 0.02; y < h + H * 0.06; y += H * 0.075) {
    for (x = -H * 0.04 + ((y / (H * 0.075)) % 2) * H * 0.06; x < w + H * 0.08; x += H * 0.12) {
      r = H * (0.045 + rnd() * 0.03);
      col = ['#b2a8dc', '#a096cc', '#aaa0d4', '#968cc2'][Math.floor(rnd() * 4)];
      b.beginPath();
      n = 7;
      for (i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2, rr = r * (0.78 + rnd() * 0.3);
        b.lineTo(x + rnd() * H * 0.02 + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.8);
      }
      b.closePath();
      artFillPath(b, col, y - r, y + r, r, { lineColor: '#6e6498', line: Math.max(1, H * 0.003) });
      artHighlight(b, x - r * 0.4, y - r * 0.35, r * 0.3, r * 0.12, 0.25);
      if (rnd() < 0.3) {
        b.fillStyle = 'rgba(255,255,255,0.9)';
        b.beginPath(); b.ellipse(x - r * 0.1, y - r * 0.62, r * 0.6, r * 0.18, 0, 0, Math.PI * 2); b.fill();
      }
    }
  }
  // Pienet männyt ja varvut, jotta kangas näyttää vuorenrinteeltä
  for (i = 0; i < 9; i++) {
    x = rnd() * w;
    y = H * 0.06 + rnd() * (h - H * 0.1);
    r = H * (0.018 + rnd() * 0.012);
    b.fillStyle = '#5e9a70';
    b.beginPath(); b.moveTo(x, y - r * 2.2); b.lineTo(x + r, y); b.lineTo(x - r, y); b.closePath(); b.fill();
    b.beginPath(); b.moveTo(x, y - r * 3); b.lineTo(x + r * 0.75, y - r * 1.2); b.lineTo(x - r * 0.75, y - r * 1.2); b.closePath(); b.fill();
    b.fillStyle = '#6a4a3a';
    b.fillRect(x - r * 0.12, y, r * 0.24, r * 0.5);
  }
  // Kankaan laskokset
  for (x = H * 0.06; x < w; x += H * 0.13) {
    g = b.createLinearGradient(x - H * 0.03, 0, x + H * 0.03, 0);
    g.addColorStop(0, 'rgba(60,40,100,0)');
    g.addColorStop(0.5, 'rgba(60,40,100,0.1)');
    g.addColorStop(1, 'rgba(255,255,255,0.06)');
    b.fillStyle = g;
    b.fillRect(x - H * 0.03, 0, H * 0.06, h);
  }
}
function prtRenderTable(b) {
  var L = prt.L, H = viewH, x0 = H * 0.02, w = L.tableX1 - L.tableX0, y0 = H * 0.008, i, x, n, sc;
  // Pöytäliina: kansi ja etuhelma pitsireunalla
  artRoundRect(b, x0 - H * 0.01, y0, w + H * 0.02, H * 0.028, H * 0.012, '#fff6fa', { lineColor: '#c88aa8' });
  b.beginPath();
  b.moveTo(x0 - H * 0.008, y0 + H * 0.02);
  b.lineTo(x0 + w + H * 0.008, y0 + H * 0.02);
  b.lineTo(x0 + w + H * 0.012, y0 + H * 0.095);
  n = Math.max(6, Math.round(w / (H * 0.06)));
  sc = (w + H * 0.024) / n;
  for (i = n; i > 0; i--) {
    x = x0 - H * 0.012 + i * sc;
    b.quadraticCurveTo(x - sc / 2, y0 + H * 0.115, x - sc, y0 + H * 0.095);
  }
  b.closePath();
  artFillPath(b, '#ffd0e4', y0 + H * 0.02, y0 + H * 0.115, H * 0.05, { lineColor: '#c06a90' });
  b.fillStyle = 'rgba(255,255,255,0.7)';
  for (i = 0; i < n * 2; i++) {
    x = x0 + (i + 0.5) * (w / (n * 2));
    b.beginPath(); b.arc(x, y0 + H * (0.045 + (i % 2) * 0.03), H * 0.006, 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = '#ff9ec6';
  b.lineWidth = Math.max(1.5, H * 0.004);
  b.beginPath(); b.moveTo(x0, y0 + H * 0.03); b.lineTo(x0 + w, y0 + H * 0.03); b.stroke();
}
function prtRenderFront(b) {
  var L = prt.L, H = viewH, y0 = H * 0.83, i, R, rnd = prtSeeded(53), x, y, g;
  b.save();
  b.translate(0, -y0);
  // Etualan ruohokaistale
  g = b.createLinearGradient(0, H * 0.94, 0, H);
  g.addColorStop(0, '#7cc864');
  g.addColorStop(1, '#5fae4c');
  b.fillStyle = g;
  b.beginPath();
  b.moveTo(0, H);
  for (x = 0; x <= L.W; x += H * 0.03) b.lineTo(x, H * 0.955 + Math.sin(x / H * 17) * H * 0.006);
  b.lineTo(L.W, H);
  b.closePath();
  b.fill();
  for (i = 0; i < L.rocks.length; i++) {
    R = L.rocks[i];
    prtRock(b, R.x, R.top, R.w, H * 1.02 - R.top, i);
  }
  b.strokeStyle = '#4a9a3a';
  b.lineWidth = Math.max(1.2, H * 0.003);
  b.lineCap = 'round';
  for (i = 0; i < 40; i++) {
    x = rnd() * L.W;
    y = H * (0.965 + rnd() * 0.03);
    b.beginPath(); b.moveTo(x - H * 0.008, y); b.lineTo(x - H * 0.012, y - H * 0.02); b.moveTo(x, y); b.lineTo(x + H * 0.002, y - H * 0.026); b.moveTo(x + H * 0.008, y); b.lineTo(x + H * 0.013, y - H * 0.018); b.stroke();
  }
  b.restore();
}
function prtRock(b, x, top, w, h, seed) {
  var H = viewH;
  b.beginPath();
  b.moveTo(x - w * 0.5, top + h);
  b.quadraticCurveTo(x - w * 0.55, top + h * 0.25, x - w * 0.22, top + h * 0.05);
  b.quadraticCurveTo(x, top - h * 0.12, x + w * 0.28, top + h * 0.06);
  b.quadraticCurveTo(x + w * 0.56, top + h * 0.3, x + w * 0.5, top + h);
  b.closePath();
  artFillPath(b, seed % 2 ? '#aaa2cc' : '#b4accf', top, top + h, w * 0.4, { lineColor: '#615a8a', line: Math.max(1.5, H * 0.004) });
  artHighlight(b, x - w * 0.18, top + h * 0.2, w * 0.14, h * 0.07, 0.35);
  b.fillStyle = 'rgba(255,255,255,0.92)';
  b.beginPath();
  b.moveTo(x - w * 0.24, top + h * 0.07);
  b.quadraticCurveTo(x, top - h * 0.1, x + w * 0.28, top + h * 0.08);
  b.quadraticCurveTo(x + w * 0.1, top + h * 0.15, x - w * 0.05, top + h * 0.1);
  b.quadraticCurveTo(x - w * 0.15, top + h * 0.14, x - w * 0.24, top + h * 0.07);
  b.fill();
  b.fillStyle = 'rgba(120,180,100,0.5)';
  b.beginPath(); b.ellipse(x + w * 0.25, top + h * 0.75, w * 0.12, h * 0.06, 0, 0, Math.PI * 2); b.fill();
  b.strokeStyle = 'rgba(80,70,120,0.35)';
  b.lineWidth = Math.max(1, H * 0.002);
  b.beginPath(); b.moveTo(x - w * 0.1, top + h * 0.35); b.lineTo(x - w * 0.02, top + h * 0.5); b.lineTo(x - w * 0.08, top + h * 0.62); b.stroke();
}

// ---------- Piirto: eläimet ----------
var PRT_LOOKS = {
  goat: { body: '#f6f1e6', belly: '#ffffff', line: '#8a8070', shade: '#ddd4c4' },
  marmot: { body: '#c08a58', belly: '#f0d8b8', line: '#6a4424' },
  eagle: { body: '#8a5a34', belly: '#a87048', line: '#4a2a14' },
  owl: { body: '#b89a7a', belly: '#f0e0c8', line: '#5a4030' },
  fox: { body: '#f08c3c', belly: '#fff4e8', line: '#9a4a14' },
  hare: { body: '#ffffff', belly: '#ffffff', line: '#9aa8c0', shade: '#e4ecf8' }
};
// Pää: (x, y) = pään keskikohta, r = säde. o: { blink, look, mood, ear }
function prtDrawHead(c, kind, x, y, r, o) {
  var lk = o.look || 0, ew = o.ear || 0, i, A = PRT_LOOKS[kind], ey = -0.12, ex = 0.36, es = 0.16, my = 0.5;
  o = o || {};
  if (kind === 'goat') {
    for (i = -1; i <= 1; i += 2) {
      c.lineCap = 'round';
      c.strokeStyle = '#6a5a44';
      c.lineWidth = r * 0.34;
      c.beginPath(); c.moveTo(x + i * r * 0.3, y - r * 0.72); c.quadraticCurveTo(x + i * r * 0.72, y - r * 1.6, x + i * r * 1.05, y - r * 0.98); c.stroke();
      c.strokeStyle = '#c4ae88';
      c.lineWidth = r * 0.2;
      c.stroke();
      artBlob(c, x + i * r * 0.98, y - r * 0.12, r * 0.36, r * 0.14, '#efe8da', { rot: i * (0.45 + ew), lineColor: A.line });
    }
    artBlob(c, x, y, r * 0.84, r, A.body, { lineColor: A.line, shadeTo: A.shade, hi: 0.3 });
    c.beginPath(); c.moveTo(x - r * 0.2, y + r * 0.82); c.lineTo(x, y + r * 1.38); c.lineTo(x + r * 0.2, y + r * 0.82); c.closePath();
    artFillPath(c, '#e8e0d0', y + r * 0.8, y + r * 1.4, r * 0.2, { lineColor: A.line });
    artBlob(c, x, y + r * 0.45, r * 0.54, r * 0.38, '#eadcc4', { lineColor: '#a89478' });
    c.fillStyle = '#6a5040';
    prtEll(c, x - r * 0.16, y + r * 0.36, r * 0.07, r * 0.05); c.fill();
    prtEll(c, x + r * 0.16, y + r * 0.36, r * 0.07, r * 0.05); c.fill();
    my = 0.6;
  } else if (kind === 'marmot') {
    for (i = -1; i <= 1; i += 2) { artCircle(c, x + i * r * 0.64, y - r * 0.68, r * 0.24, A.body, { lineColor: A.line }); artCircle(c, x + i * r * 0.64, y - r * 0.68, r * 0.11, '#e8b890', { line: false }); }
    artBlob(c, x, y, r, r * 0.92, A.body, { lineColor: A.line, hi: 0.25 });
    artBlob(c, x, y + r * 0.38, r * 0.52, r * 0.36, A.belly, { lineColor: '#b08a60', line: Math.max(1, r * 0.05) });
    artBlob(c, x, y + r * 0.2, r * 0.15, r * 0.1, '#4a2a1a', { line: false });
    artRoundRect(c, x - r * 0.1, y + r * 0.42, r * 0.09, r * 0.15, r * 0.03, '#ffffff', { lineColor: '#b08a60', line: 1 });
    artRoundRect(c, x + r * 0.01, y + r * 0.42, r * 0.09, r * 0.15, r * 0.03, '#ffffff', { lineColor: '#b08a60', line: 1 });
    my = -1;
  } else if (kind === 'eagle') {
    for (i = -1; i <= 1; i++) artBlob(c, x + i * r * 0.22, y - r * 0.85, r * 0.14, r * 0.28, '#f4efe4', { rot: i * 0.5, lineColor: '#8a8478' });
    artBlob(c, x, y, r * 0.9, r * 0.95, '#fbf8f2', { lineColor: '#8a8478', shadeTo: '#e8e2d6', hi: 0.3 });
    c.beginPath();
    c.moveTo(x - r * 0.24, y + r * 0.08);
    c.quadraticCurveTo(x, y - r * 0.02, x + r * 0.24, y + r * 0.08);
    c.quadraticCurveTo(x + r * 0.22, y + r * 0.5, x + r * 0.02, y + r * 0.66);
    c.quadraticCurveTo(x - r * 0.06, y + r * 0.5, x - r * 0.24, y + r * 0.08);
    c.closePath();
    artFillPath(c, '#ffc23a', y, y + r * 0.66, r * 0.25, { lineColor: '#a06a10' });
    c.strokeStyle = '#6a5a44';
    c.lineWidth = Math.max(1.2, r * 0.08);
    c.lineCap = 'round';
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(x + i * r * 0.18, y - r * 0.32); c.lineTo(x + i * r * 0.56, y - r * 0.4); c.stroke(); }
    my = -1;
  } else if (kind === 'owl') {
    for (i = -1; i <= 1; i += 2) {
      c.beginPath(); c.moveTo(x + i * r * 0.78, y - r * 0.45); c.lineTo(x + i * r * 0.72, y - r * (1.15 + ew * 0.3)); c.lineTo(x + i * r * 0.32, y - r * 0.8); c.closePath();
      artFillPath(c, A.body, y - r * 1.15, y - r * 0.45, r * 0.3, { lineColor: A.line });
    }
    artBlob(c, x, y, r, r * 0.95, A.body, { lineColor: A.line, hi: 0.25 });
    for (i = -1; i <= 1; i += 2) artCircle(c, x + i * r * 0.38, y - r * 0.08, r * 0.38, A.belly, { lineColor: '#c0a888', line: Math.max(1, r * 0.05) });
    for (i = -1; i <= 1; i += 2) artCircle(c, x + i * r * 0.38, y - r * 0.08, r * 0.27, '#ffb040', { line: false, flat: true });
    c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.18); c.lineTo(x, y + r * 0.42); c.lineTo(x + r * 0.1, y + r * 0.18); c.closePath();
    artFillPath(c, '#ffb040', y + r * 0.18, y + r * 0.42, r * 0.1, { lineColor: '#a06010' });
    ex = 0.38; ey = -0.08; es = 0.21; my = -1;
  } else if (kind === 'fox') {
    for (i = -1; i <= 1; i += 2) {
      c.beginPath(); c.moveTo(x + i * r * 0.2, y - r * 0.7); c.lineTo(x + i * r * (0.78 + ew * 0.1), y - r * 1.35); c.lineTo(x + i * r * 0.86, y - r * 0.45); c.closePath();
      artFillPath(c, A.body, y - r * 1.35, y - r * 0.45, r * 0.4, { lineColor: A.line });
      c.beginPath(); c.moveTo(x + i * r * 0.62, y - r * 1.05); c.lineTo(x + i * r * (0.78 + ew * 0.1), y - r * 1.35); c.lineTo(x + i * r * 0.83, y - r * 0.98); c.closePath();
      c.fillStyle = '#4a2a1a';
      c.fill();
    }
    artBlob(c, x, y, r, r * 0.88, A.body, { lineColor: A.line, hi: 0.25 });
    for (i = -1; i <= 1; i += 2) artBlob(c, x + i * r * 0.42, y + r * 0.38, r * 0.42, r * 0.3, '#fff4e8', { rot: -i * 0.4, line: false });
    artBlob(c, x, y + r * 0.3, r * 0.3, r * 0.26, '#fff4e8', { line: false });
    artBlob(c, x, y + r * 0.22, r * 0.12, r * 0.08, '#2a1a10', { line: false });
    ey = -0.08; ex = 0.34; my = 0.5;
  } else {
    for (i = -1; i <= 1; i += 2) {
      artBlob(c, x + i * r * 0.32, y - r * 1.25, r * 0.22, r * 0.62, '#ffffff', { rot: i * (0.18 + ew), lineColor: A.line, shadeTo: A.shade });
      artBlob(c, x + i * r * 0.32, y - r * 1.2, r * 0.1, r * 0.42, '#ffc8d8', { rot: i * (0.18 + ew), line: false });
    }
    artBlob(c, x, y, r * 0.95, r * 0.9, '#ffffff', { lineColor: A.line, shadeTo: A.shade, hi: 0.35 });
    artCircle(c, x, y + r * 0.2, r * 0.1, '#ff8aa8', { line: false });
    c.strokeStyle = 'rgba(120,130,160,0.6)';
    c.lineWidth = Math.max(1, r * 0.035);
    for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(x + i * r * 0.2, y + r * 0.28); c.lineTo(x + i * r * 0.7, y + r * 0.2); c.moveTo(x + i * r * 0.2, y + r * 0.34); c.lineTo(x + i * r * 0.68, y + r * 0.4); c.stroke(); }
    my = 0.45;
  }
  // Silmät ja suu ilmeen mukaan
  for (i = -1; i <= 1; i += 2) {
    if (o.mood === 'sad') {
      c.strokeStyle = '#2a1a2a'; c.lineWidth = Math.max(1.2, r * 0.09); c.lineCap = 'round';
      c.beginPath(); c.arc(x + i * r * ex, y + r * ey + r * 0.05, r * es * 0.8, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    } else if (o.mood === 'laugh') {
      c.strokeStyle = '#2a1a2a'; c.lineWidth = Math.max(1.2, r * 0.09); c.lineCap = 'round';
      c.beginPath(); c.arc(x + i * r * ex, y + r * ey + r * 0.06, r * es * 0.8, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    } else artEye(c, x + i * r * ex, y + r * ey, r * es * (o.mood === 'wow' ? 1.25 : 1), lk, o.blink);
  }
  artBlush(c, x - r * 0.6, y + r * 0.22, r * 0.14);
  artBlush(c, x + r * 0.6, y + r * 0.22, r * 0.14);
  if (my < 0) my = 0.62;
  c.strokeStyle = '#4a2a2a';
  c.lineWidth = Math.max(1, r * 0.07);
  c.lineCap = 'round';
  c.beginPath();
  if (o.mood === 'sad') c.arc(x, y + r * (my + 0.2), r * 0.12, 1.15 * Math.PI, 1.85 * Math.PI);
  else if (o.mood === 'wow') { c.arc(x, y + r * my, r * 0.08, 0, Math.PI * 2); }
  else if (o.mood === 'laugh') { c.arc(x, y + r * (my - 0.05), r * 0.16, 0.05 * Math.PI, 0.95 * Math.PI); c.closePath(); c.fillStyle = '#c0405a'; c.fill(); }
  else c.arc(x, y + r * (my - 0.08), r * 0.13, 0.15 * Math.PI, 0.85 * Math.PI);
  c.stroke();
}
// Koko vieras: (x, yb) = jalkojen kohta. o: { t, feet, blink, mood, wave, guitar, accordion, seated }
function prtDrawGuest(c, kind, x, yb, r, o) {
  var A = PRT_LOOKS[kind], by = yb - r * 0.55, w = o.wave ? Math.sin(o.t * 14) * 0.5 : 0, i, sq = o.sq || 0;
  c.save();
  c.translate(x, yb);
  if (sq) c.scale(1 + sq, 1 - sq);
  c.translate(-x, -yb);
  if (o.feet) for (i = -1; i <= 1; i += 2) artBlob(c, x + i * r * 0.34, yb - r * 0.04, r * 0.26, r * 0.12, kind === 'eagle' || kind === 'owl' ? '#ffb040' : artShade(A.body, -0.1), { lineColor: A.line });
  if (kind === 'eagle' || kind === 'owl') {
    for (i = -1; i <= 1; i += 2) artBlob(c, x + i * r * 0.78, by - r * 0.05, r * 0.26, r * 0.62, artShade(A.body, -0.1), { rot: i * (0.35 + w), lineColor: A.line });
  }
  if (kind === 'fox' && o.tail !== false) artBlob(c, x + r * 0.85, by + r * 0.1, r * 0.5, r * 0.22, A.body, { rot: -0.6 + Math.sin(o.t * 3) * 0.15, lineColor: A.line });
  artBlob(c, x, by, r * 0.82, r * 0.72, A.body, { lineColor: A.line, shadeTo: A.shade, hi: 0.15 });
  artBlob(c, x, by + r * 0.12, r * 0.5, r * 0.5, A.belly, { line: false });
  if (kind === 'owl') {
    c.strokeStyle = 'rgba(120,90,60,0.5)';
    c.lineWidth = Math.max(1, r * 0.05);
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(x + (i - 1) * r * 0.22, by + r * 0.1, r * 0.08, 0.2, Math.PI - 0.2); c.stroke(); }
  }
  if (o.guitar) prtDrawGuitar(c, x, by + r * 0.12, r, o.strum || 0);
  else if (o.accordion) prtDrawAccordion(c, x, by + r * 0.15, r, o.squeeze || 0);
  else if (kind !== 'eagle' && kind !== 'owl') {
    for (i = -1; i <= 1; i += 2) artCircle(c, x + i * r * 0.5, by + r * 0.3 - (o.wave && i > 0 ? r * 0.5 + w * r * 0.3 : 0), r * 0.2, artShade(A.body, -0.05), { lineColor: A.line });
  }
  prtDrawHead(c, kind, x, yb - r * 1.55, r, o);
  c.restore();
}
function prtDrawGuitar(c, x, y, r, k) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.6);
  artRoundRect(c, -r * 0.06, -r * 1.1, r * 0.12, r * 0.9, r * 0.04, '#8a5a30', { lineColor: '#4a2a10' });
  artBlob(c, 0, 0, r * 0.38, r * 0.3, '#ffb84f', { lineColor: '#9a5a10' });
  artBlob(c, 0, -r * 0.32, r * 0.28, r * 0.22, '#ffb84f', { lineColor: '#9a5a10' });
  artCircle(c, 0, -r * 0.12, r * 0.08, '#6a3a10', { line: false });
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(-r * 0.03, -r * 1.05); c.lineTo(-r * 0.03 + Math.sin(k * 60) * r * 0.02 * k, r * 0.15); c.moveTo(r * 0.03, -r * 1.05); c.lineTo(r * 0.03, r * 0.15); c.stroke();
  c.restore();
  artCircle(c, x + r * 0.35, y + r * 0.05 - k * r * 0.15, r * 0.16, '#f08c3c', { lineColor: '#9a4a14' });
}
function prtDrawAccordion(c, x, y, r, k) {
  var w = r * (0.5 + Math.sin(k * 12) * 0.12 * (k > 0 ? 1 : 0)), i;
  artRoundRect(c, x - r * 0.62 - w * 0.2, y - r * 0.28, r * 0.28, r * 0.5, r * 0.05, '#ff5a7a', { lineColor: '#9a2040' });
  artRoundRect(c, x + r * 0.34 + w * 0.2, y - r * 0.28, r * 0.28, r * 0.5, r * 0.05, '#ff5a7a', { lineColor: '#9a2040' });
  artRoundRect(c, x - r * 0.34 - w * 0.2, y - r * 0.24, r * 0.68 + w * 0.4, r * 0.42, r * 0.03, '#fff2d0', { lineColor: '#9a7040' });
  c.strokeStyle = 'rgba(154,112,64,0.7)';
  c.lineWidth = Math.max(1, r * 0.04);
  for (i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x - r * 0.34 - w * 0.2 + i * (r * 0.68 + w * 0.4) / 6, y - r * 0.24); c.lineTo(x - r * 0.34 - w * 0.2 + i * (r * 0.68 + w * 0.4) / 6, y + r * 0.18); c.stroke(); }
  for (i = -1; i <= 1; i += 2) artCircle(c, x + i * (r * 0.5 + w * 0.2), y + r * 0.02, r * 0.17, '#f6f1e6', { lineColor: '#8a8070' });
}
function prtGuestDrawOpts(g, seated) {
  var t = g.t + g.seed, o = { t: t, blink: ((t * 0.8) % 3.6) < 0.12, look: 0, mood: 'happy', feet: !seated, ear: 0, sq: 0 };
  if (g.poke > 0) { o.sq = Math.sin(g.poke / 0.8 * Math.PI * 2) * 0.08; o.ear = Math.sin(g.poke * 20) * 0.3; o.mood = 'wow'; }
  if (g.cheer > 0) { o.mood = 'laugh'; o.wave = true; }
  if (g.shake > 0 || g.mark > 0 || g.wet > 0.8) o.mood = 'sad';
  if (prt.fin && prt.fin.hide) { o.mood = 'laugh'; o.blink = false; }
  if (g.kind === 'fox' && seated) { o.guitar = true; o.strum = g.poke > 0 ? g.poke : 0; }
  if (g.kind === 'goat' && seated) { o.accordion = true; o.squeeze = g.poke > 0 ? g.poke : 0; }
  return o;
}
// Vieraan piirto tilan mukaan; layer: 'seat' (pöydän takana), 'ground' (niityllä), 'hide' (kivien takana)
function prtDrawGuestAt(c, g, layer) {
  var H = viewH, r = prt.L.guestR, seated = g.st === 'seated', o, x, y, hop = 0, p0, p1, k, sh = 0;
  if (g.st === 'off' || g.st === 'drag') return;
  if (g.hid > 0) {
    if ((g.hid >= 0.5) !== (layer === 'hide')) return;
    p0 = g.hidFrom || prtGuestHome(g);
    p1 = prtHidePos(g);
    k = easeInOutSine(g.hid);
    x = prtLerp(p0.x, p1.x, k);
    y = prtLerp(p0.y, p1.y, k) - Math.sin(k * Math.PI) * H * 0.08;
    o = prtGuestDrawOpts(g, false);
    o.feet = true;
    if (g.hid >= 1) {
      // Korvat ja silmät kurkkivat kiven takaa
      y += Math.sin(globalT * 3 + g.seed) * H * 0.004;
      o.look = Math.sin(globalT * 0.7 + g.seed) * 0.8;
    }
    prtDrawGuest(c, g.kind, x, y, r, o);
    return;
  }
  if (layer === 'hide') return;
  if (seated !== (layer === 'seat')) return;
  o = prtGuestDrawOpts(g, seated);
  x = g.x;
  y = g.y;
  if (g.cheer > 0) hop = Math.abs(Math.sin(g.cheer * 7)) * H * 0.02;
  if (g.shake > 0) sh = Math.sin(g.shake * 40) * H * 0.006;
  if (g.wet > 0) sh += Math.sin(globalT * 50) * H * 0.0015;
  if (g.st === 'wait') hop += Math.abs(Math.sin(g.t * 2.4)) * H * 0.006;
  if (g.st === 'arrive' && (g.kind === 'eagle' || g.kind === 'owl')) o.wave = true;
  prtDrawGuest(c, g.kind, x + sh, y - hop, r, o);
  prtGuestOverlay(c, g, x, y - hop - r * 2.9);
}
function prtGuestOverlay(c, g, x, y) {
  var H = viewH, i, k;
  if (g.wet > 0) {
    c.fillStyle = 'rgba(120,170,255,0.8)';
    for (i = 0; i < 3; i++) { k = ((globalT * 1.5 + i * 0.33) % 1); c.beginPath(); c.arc(x + (i - 1) * H * 0.02, y + H * 0.03 + k * H * 0.06, H * 0.004, 0, Math.PI * 2); c.fill(); }
  }
  if (g.mark > 0) prtText(c, '?', x, y - Math.sin(Math.min(1, g.mark) * Math.PI) * H * 0.01, H * 0.045, '#8a6ac8', '#ffffff');
  if (g.num > 0 && prt.cake.light) {
    artCircle(c, x, y, H * 0.018, '#fff6c0', { lineColor: '#d8a020' });
    prtText(c, String(g.num), x, y + H * 0.001, H * 0.026, '#a0600a');
  }
}

// ---------- Piirto: pilvi ----------
// Noidan pieni pilvi: (x, y) keskikohta, S koko. o: { white, look, squint, blush, mouth, rain, glitter, t }
function prtDrawCloud(c, x, y, S, o) {
  var col = artMix('#6f6a9a', '#f6f2ff', o.white || 0), i, k, rx, ry, ey = y - S * 0.12;
  if (o.rain > 0) {
    c.strokeStyle = 'rgba(120,150,220,' + (0.6 * o.rain) + ')';
    c.lineWidth = Math.max(1, S * 0.05);
    c.lineCap = 'round';
    for (i = 0; i < 9; i++) {
      k = ((o.t * 1.8 + i * 0.37) % 1);
      rx = x + (i - 4) * S * 0.25 - k * S * 0.12;
      ry = y + S * 0.35 + k * S * (o.long || 1.4);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - S * 0.06, ry + S * 0.28); c.stroke();
    }
  }
  c.fillStyle = artShade(col, -0.35);
  c.beginPath();
  c.arc(x - S * 0.6, y + S * 0.05, S * 0.46, 0, Math.PI * 2);
  c.arc(x + S * 0.6, y + S * 0.08, S * 0.44, 0, Math.PI * 2);
  c.arc(x - S * 0.15, y - S * 0.2, S * 0.59, 0, Math.PI * 2);
  c.arc(x + S * 0.3, y - S * 0.12, S * 0.49, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.arc(x - S * 0.6, y + S * 0.05, S * 0.42, 0, Math.PI * 2);
  c.arc(x + S * 0.6, y + S * 0.08, S * 0.4, 0, Math.PI * 2);
  c.arc(x - S * 0.15, y - S * 0.2, S * 0.55, 0, Math.PI * 2);
  c.arc(x + S * 0.3, y - S * 0.12, S * 0.45, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(40,30,80,' + (0.3 * (1 - (o.white || 0))) + ')';
  prtEll(c, x, y + S * 0.3, S * 0.92, S * 0.13);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.beginPath(); c.arc(x - S * 0.3, y - S * 0.42, S * 0.2, 0, Math.PI * 2); c.fill();
  // Silmät: tuijottavat, siristävät tai ovat iloiset
  for (i = -1; i <= 1; i += 2) {
    if (o.happy) {
      c.strokeStyle = '#3a2a5a'; c.lineWidth = Math.max(1.5, S * 0.07); c.lineCap = 'round';
      c.beginPath(); c.arc(x + i * S * 0.26, ey + S * 0.04, S * 0.11, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    } else {
      artEye(c, x + i * S * 0.26, ey, S * 0.15, o.look || 0, false);
      if (o.squint > 0) {
        c.fillStyle = col;
        c.beginPath(); c.rect(x + i * S * 0.26 - S * 0.17, ey - S * 0.17, S * 0.34, S * 0.17 * (0.4 + o.squint * 0.5)); c.fill();
        c.strokeStyle = artShade(col, -0.45); c.lineWidth = Math.max(1, S * 0.04);
        c.beginPath(); c.moveTo(x + i * S * 0.26 - S * 0.16, ey - S * 0.17 + S * 0.17 * (0.4 + o.squint * 0.5)); c.lineTo(x + i * S * 0.26 + S * 0.16, ey - S * 0.17 + S * 0.17 * (0.4 + o.squint * 0.5)); c.stroke();
      }
    }
  }
  if (o.blush > 0 || o.happy) { artBlush(c, x - S * 0.5, ey + S * 0.18, S * 0.12); artBlush(c, x + S * 0.5, ey + S * 0.18, S * 0.12); }
  c.strokeStyle = '#3a2a5a';
  c.lineWidth = Math.max(1.2, S * 0.05);
  c.lineCap = 'round';
  c.beginPath();
  if (o.mouth === 'o') c.arc(x, ey + S * 0.24, S * 0.07, 0, Math.PI * 2);
  else if (o.mouth === 'smile') c.arc(x, ey + S * 0.16, S * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (o.mouth === 'hmm') { c.moveTo(x - S * 0.1, ey + S * 0.24); c.quadraticCurveTo(x, ey + S * 0.2 + Math.sin((o.t || 0) * 20) * S * 0.03, x + S * 0.1, ey + S * 0.24); }
  c.stroke();
}
function prtDrawPeekCloud(c, front) {
  var cl = prt.cloud, L = prt.L, H = viewH, p, S = prtCloudS(), o, i, R, k;
  if (cl.st === 'off') return;
  if (front !== prtCloudBusy()) return;
  p = prtCloudPos();
  o = { t: globalT, look: cl.look, blush: cl.blush, mouth: '' };
  if (cl.st === 'warn') { o.look = Math.sin(cl.t * 1.5) * 0.4; o.mouth = 'hmm'; }
  if (cl.st === 'mutter') { o.squint = 0.7; o.mouth = 'hmm'; }
  if (cl.st === 'sink' && cl.duck > 0) o.blush = 1;
  if (cl.st === 'seen' || cl.st === 'swoop') o.mouth = 'o';
  if (cl.st === 'shower') { o.rain = 1; o.mouth = 'smile'; o.long = (cl.ty < L.tableY ? (L.tableY - cl.ty) / S * 0.7 : 1.4); }
  if (cl.hihi > 0) { o.happy = true; }
  if (!front) {
    // Harjanteen takana: rajataan harjanteen ääriviivaan
    c.save();
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(L.W, 0);
    for (i = L.ridge.length - 1; i >= 0; i--) c.lineTo(L.ridge[i].x, L.ridge[i].y + H * 0.002);
    c.closePath();
    c.clip();
    prtDrawCloud(c, p.x, p.y, S, o);
    c.restore();
  } else prtDrawCloud(c, p.x, p.y, S, o);
  if (cl.st === 'seen') {
    k = Math.min(1, cl.t / 0.25);
    prtText(c, '?', p.x + S * 0.9, p.y - S * 1.0 - k * H * 0.02, H * 0.07 * easeOutBack(k), '#ffe27a', '#6a4a9a');
  }
  if (cl.st === 'mutter') prtText(c, 'hmm', p.x, p.y - S * 1.05, H * 0.03, '#ffffff', '#6a5a9a');
}

// ---------- Piirto: viirit ----------
function prtSym(c, sym, x, y, r, line) {
  var i;
  c.fillStyle = '#ffffff';
  c.strokeStyle = line;
  c.lineWidth = Math.max(1, r * 0.18);
  if (sym === 'heart') { prtHeartPath(c, x, y, r * 0.9); c.fill(); c.stroke(); }
  else if (sym === 'star') { prtStarPath(c, x, y, r, 0); c.fill(); c.stroke(); }
  else if (sym === 'flower') {
    for (i = 0; i < 5; i++) { c.beginPath(); c.arc(x + Math.cos(i * 1.257) * r * 0.5, y + Math.sin(i * 1.257) * r * 0.5, r * 0.36, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(x, y, r * 0.3, 0, Math.PI * 2); c.fill();
  } else if (sym === 'leaf') {
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.9, y, x, y + r); c.quadraticCurveTo(x - r * 0.9, y, x, y - r); c.closePath(); c.fill(); c.stroke();
  } else {
    c.beginPath(); c.arc(x, y, r * 0.8, Math.PI * 0.35, Math.PI * 1.65, false); c.arc(x + r * 0.4, y - r * 0.1, r * 0.62, Math.PI * 1.5, Math.PI * 0.5, true); c.closePath(); c.fill(); c.stroke();
  }
}
// Viiri: (x, y) = yläreunan keskikohta
function prtDrawPennant(c, x, y, w, h, type, rot, ghost) {
  var P = PRT_PEN[type], line = artShade(P.col, -0.45);
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(w / 2, 0);
  c.quadraticCurveTo(w * 0.1, h * 0.5, 0, h);
  c.quadraticCurveTo(-w * 0.1, h * 0.5, -w / 2, 0);
  c.closePath();
  artFillPath(c, P.col, 0, h, w * 0.5, { lineColor: line, alpha: ghost });
  if (!ghost) {
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(-w / 2 + w * 0.06, h * 0.04, w * 0.88, h * 0.07);
    prtSym(c, P.sym, 0, h * 0.33, w * 0.2, line);
  }
  c.restore();
}
function prtDrawStrings(c) {
  var L = prt.L, H = viewH, si, S, s, j, h, p, rot, show, x0 = L.poleL + H * 0.012, x1 = L.poleR - H * 0.012, open, wv, dk, ghostT, k;
  for (si = 0; si < 2; si++) {
    S = prt.strings[si];
    s = L.str[si];
    c.strokeStyle = '#c89a70';
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.beginPath(); c.moveTo(x0, s.y - H * 0.005); c.quadraticCurveTo(L.cx, s.y + s.sag * 2.1, x1, s.y - H * 0.005); c.stroke();
    if (S.demoT < 0) continue;
    open = prtStringOpen(si);
    for (j = 0; j < S.n; j++) {
      h = S.hooks[j];
      p = prtHookPos(si, j);
      wv = 0;
      if (S.wave > 0) { dk = Math.abs(j - (S.waveX || 0)); wv = Math.max(0, Math.sin((1.6 - S.wave) * 9 - dk * 0.6)) * Math.min(1, S.wave) * H * 0.012; }
      rot = Math.sin(globalT * 1.8 + j * 0.7 + si) * 0.05;
      if (h.swing > 0) rot += Math.sin(h.swing * 18) * 0.25 * h.swing;
      if (h.wrong > 0) rot += Math.sin(h.wrong * 26) * 0.5 * Math.min(1, h.wrong * 2);
      if (h.type >= 0 && h.demo) {
        show = S.demoT - (0.4 + j * 0.28);
        if (show < 0) continue;
        k = Math.min(1, show / 0.25);
        c.save();
        c.translate(p.x, p.y - wv);
        c.scale(easeOutBack(k), easeOutBack(k));
        prtDrawPennant(c, 0, 0, L.penW, L.penH, h.type, rot);
        c.restore();
      } else if (h.type >= 0) {
        k = h.pop > 0 ? 1 + Math.sin(h.pop / 0.35 * Math.PI) * 0.15 : 1;
        c.save();
        c.translate(p.x, p.y - wv);
        c.scale(k, k);
        prtDrawPennant(c, 0, 0, L.penW, L.penH, h.type, rot);
        c.restore();
      } else if (open) {
        // Tyhjä koukku: haalea ääriviiva
        c.globalAlpha = 0.5 + Math.sin(globalT * 3 + j) * 0.12;
        c.setLineDash([H * 0.008, H * 0.006]);
        c.strokeStyle = '#ffffff';
        c.lineWidth = Math.max(1.2, H * 0.003);
        c.beginPath(); c.moveTo(p.x - L.penW / 2, p.y); c.lineTo(p.x, p.y + L.penH); c.lineTo(p.x + L.penW / 2, p.y); c.stroke();
        c.setLineDash([]);
        c.globalAlpha = 1;
      }
      c.fillStyle = '#a07050';
      c.beginPath(); c.arc(p.x, p.y, H * 0.003, 0, Math.PI * 2); c.fill();
    }
    // Rusetti mallikuvion perään
    p = prtHookPos(si, S.shown - 0.5);
    artBlob(c, p.x - H * 0.008, p.y, H * 0.009, H * 0.006, '#ff6f9a', { rot: 0.5, lineColor: '#a0304a' });
    artBlob(c, p.x + H * 0.008, p.y, H * 0.009, H * 0.006, '#ff6f9a', { rot: -0.5, lineColor: '#a0304a' });
    artCircle(c, p.x, p.y, H * 0.005, '#ffd24f', { lineColor: '#a0304a' });
  }
}

// ---------- Piirto: ilmapallot ----------
function prtPostBalloon(i) {
  var P = prt.L.posts[i], b = prt.posts[i], H = viewH;
  return { x: P.x + Math.sin(globalT * 1.3 + b.bob) * H * 0.004, y: P.y + Math.sin(globalT * 1.7 + b.bob) * H * 0.006, r: PRT_BAL_R[b.size] * H };
}
function prtDrawBalloon(c, x, y, r, col, o) {
  var ry = r * 1.12;
  o = o || {};
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, r, ry, 0, 0, Math.PI * 2); else c.arc(x, y, r, 0, Math.PI * 2);
  artFillPath(c, col, y - ry, y + ry, r, { lineColor: artShade(col, -0.4), alpha: o.alpha });
  artHighlight(c, x - r * 0.38, y - ry * 0.42, r * 0.22, ry * 0.15, 0.55);
  c.beginPath(); c.moveTo(x - r * 0.14, y + ry + r * 0.12); c.lineTo(x, y + ry - r * 0.02); c.lineTo(x + r * 0.14, y + ry + r * 0.12); c.closePath();
  c.fillStyle = artShade(col, -0.2);
  c.fill();
  if (o.face) {
    artEye(c, x - r * 0.25, y - r * 0.05, r * 0.11, 0, ((globalT * 0.7 + x) % 3.3) < 0.12);
    artEye(c, x + r * 0.25, y - r * 0.05, r * 0.11, 0, ((globalT * 0.7 + x) % 3.3) < 0.12);
    c.strokeStyle = artShade(col, -0.5); c.lineWidth = Math.max(1, r * 0.06); c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + r * 0.12, r * 0.18, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  }
}
function prtDrawPosts(c) {
  var L = prt.L, H = viewH, i, P, b, q, r, k = prt.st >= 1 ? Math.min(1, (1.5 - Math.max(0, prt.trans)) / 0.9) : 0, sx, top, pk;
  if (k <= 0) return;
  for (i = 0; i < 5; i++) {
    P = L.posts[i];
    b = prt.posts[i];
    r = PRT_BAL_R[b.size] * H;
    pk = easeOutBack(prtClamp(k * 1.6 - i * 0.12, 0, 1));
    if (pk <= 0) continue;
    top = P.y + r * 1.12 + H * 0.045;
    sx = P.x;
    // Tolppa ja värinauha
    artLimb(c, sx, L.tableY + H * 0.02, sx, top + (L.tableY - top) * (1 - pk), H * 0.008, '#c8956a', '#7a5030');
    if (pk >= 1) {
      c.beginPath(); c.moveTo(sx, top + H * 0.004); c.lineTo(sx + H * 0.03, top + H * 0.012 + Math.sin(globalT * 3 + i) * H * 0.003); c.lineTo(sx, top + H * 0.022); c.closePath();
      artFillPath(c, b.col, top, top + H * 0.022, H * 0.012, { lineColor: artShade(b.col, -0.4) });
    }
    if (b.done) {
      q = prtPostBalloon(i);
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = Math.max(1, H * 0.002);
      c.beginPath(); c.moveTo(sx, top); c.quadraticCurveTo(q.x + Math.sin(globalT * 2 + i) * H * 0.006, (top + q.y + q.r) / 2, q.x, q.y + q.r * 1.2); c.stroke();
      c.save();
      c.translate(q.x, q.y);
      if (b.pop > 0) { pk = 1 + Math.sin(b.pop / 0.5 * Math.PI * 2) * 0.08 * (b.pop / 0.5); c.scale(pk, 2 - pk); }
      prtDrawBalloon(c, 0, 0, q.r, b.col, { face: true });
      c.restore();
    } else if (pk >= 1) {
      // Tavoitekoko katkoviivana omalla värillä
      c.setLineDash([H * 0.009, H * 0.007]);
      c.strokeStyle = artRGBA(b.col, 0.9);
      c.lineWidth = Math.max(1.5, H * 0.004);
      prtEll(c, P.x, P.y, r * (1 + Math.sin(globalT * 3 + i) * 0.03), r * 1.12 * (1 + Math.sin(globalT * 3 + i) * 0.03));
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = artRGBA(b.col, 0.12);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = Math.max(1, H * 0.002);
      c.beginPath(); c.moveTo(sx, top); c.lineTo(P.x, P.y + r * 1.12); c.stroke();
    }
    if (b.esc > 0) {
      // Karannut pallo lentää taivaalle
      q = prtPostBalloon(i);
      pk = b.esc / 2.6;
      c.globalAlpha = Math.max(0, 1 - pk * 0.8);
      prtDrawBalloon(c, q.x + Math.sin(b.esc * 3) * H * 0.04, q.y - pk * pk * H * 0.7, q.r, b.col, {});
      c.globalAlpha = 1;
    }
  }
}

// ---------- Piirto: pöytä, kortit ja kakku ----------
function prtDrawTable(c) {
  var L = prt.L, H = viewH, cv = prt.cv.table, i, p, s, g;
  if (cv) c.drawImage(cv, L.tableX0 - H * 0.02, L.tableY - H * 0.008, cv.cw, cv.ch);
  // Paikkakortit
  for (i = 0; i < prt.seats.length; i++) {
    p = prtSeatPos(i);
    s = prt.seats[i];
    if (s.glow > 0) artGlow(c, p.x, L.tableY + H * 0.012, H * 0.04, '#ffe27a', Math.min(0.8, s.glow));
    c.beginPath(); c.moveTo(p.x - H * 0.024, L.tableY + H * 0.03); c.lineTo(p.x - H * 0.02, L.tableY - H * 0.006); c.lineTo(p.x + H * 0.02, L.tableY - H * 0.006); c.lineTo(p.x + H * 0.024, L.tableY + H * 0.03); c.closePath();
    artFillPath(c, '#ffffff', L.tableY - H * 0.01, L.tableY + H * 0.03, H * 0.02, { lineColor: '#d8a0c0', shadeTo: '#f4eaf6' });
    prtDrawHead(c, s.kind, p.x, L.tableY + H * 0.016, H * 0.0105, { mood: 'happy' });
  }
}
// Kakkukerros: (x, y) = yläpinnan keskikohta
function prtDrawLayer(c, x, y, w, h, col, k) {
  var rx = w / 2, ry = w * 0.12, colr = RAINBOW_COLORS[col];
  c.beginPath();
  if (c.ellipse) { c.ellipse(x, y + h, rx, ry, 0, 0, Math.PI, false); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); }
  c.closePath();
  artFillPath(c, artShade(colr, -0.05), y, y + h + ry, rx, { lineColor: artShade(colr, -0.45), line: Math.max(1, w * 0.012) });
  prtEll(c, x, y, rx, ry);
  artFillPath(c, artShade(colr, 0.25), y - ry, y + ry, rx, { lineColor: artShade(colr, -0.4), line: Math.max(1, w * 0.012) });
  c.fillStyle = 'rgba(255,255,255,0.35)';
  prtEll(c, x - rx * 0.4, y - ry * 0.25, rx * 0.2, ry * 0.3);
  c.fill();
}
function prtDrawCake(c) {
  var L = prt.L, H = viewH, ck = prt.cake, i, n = ck.layers.length, x = L.cakeX, y, top, sq = ck.squash > 0 ? Math.sin(ck.squash / 0.4 * Math.PI) * 0.06 : 0, p, d, f;
  // Kakkuvati
  artLimb(c, x, L.tableY + H * 0.002, x, L.standY + H * 0.01, H * 0.016, '#ffffff', '#b8a8d8');
  artBlob(c, x, L.tableY + H * 0.002, H * 0.04, H * 0.008, '#ffffff', { lineColor: '#b8a8d8' });
  prtEll(c, x, L.standY + H * 0.008, L.layerW * 0.62, H * 0.016);
  artFillPath(c, '#ffffff', L.standY, L.standY + H * 0.024, H * 0.05, { lineColor: '#b8a8d8', shadeTo: '#ece6fa' });
  if (ck.glow > 0 && n) artGlow(c, x, prtCakeTopY() + H * 0.05, H * 0.16, '#fff2a0', Math.min(0.6, ck.glow * 0.5));
  c.save();
  c.translate(x, L.standY);
  c.scale(1 + sq, 1 - sq);
  c.translate(-x, -L.standY);
  for (i = 0; i < n; i++) prtDrawLayer(c, x, L.standY - (i + 1) * L.layerH, L.layerW, L.layerH, ck.layers[i]);
  top = prtCakeTopY();
  if (ck.cream > 0 && n) {
    // Kerma: pinta, valumat ja nokareet
    c.globalAlpha = Math.min(1, ck.cream * 2.2);
    prtEll(c, x, top, L.layerW / 2 * 1.02, L.layerW * 0.125);
    artFillPath(c, '#fffaf4', top - H * 0.02, top + H * 0.02, H * 0.05, { lineColor: '#d8c8e0', shadeTo: '#f0e6f6' });
    c.globalAlpha = 1;
    f = Math.floor(ck.cream * 9);
    for (i = 0; i < f; i++) {
      p = x + (i / 8 - 0.5) * L.layerW * 0.92;
      d = H * (0.012 + ((i * 7) % 5) * 0.004);
      artBlob(c, p, top + L.layerW * 0.1 * Math.sin((i / 8) * Math.PI) + d * 0.4, H * 0.008, d * 0.6, '#fffaf4', { lineColor: '#d8c8e0', line: 1 });
    }
    for (i = 0; i < ck.dollops.length; i++) {
      p = prtDollopPos(ck.dollops[i]);
      artBlob(c, p.x, p.y, H * 0.011, H * 0.008, '#ffffff', { lineColor: '#d8c8e0', hi: 0.5 });
      artBlob(c, p.x, p.y - H * 0.007, H * 0.006, H * 0.005, '#ffffff', { lineColor: '#d8c8e0', line: 1 });
    }
  }
  if (ck.drips > 0 && n) {
    // Sade valutti kerman: pitkät valumat kyljissä
    c.globalAlpha = Math.min(1, ck.drips * 1.5);
    for (i = 0; i < 6; i++) {
      p = x + (i / 5 - 0.5) * L.layerW * 0.85;
      artBlob(c, p, top + H * 0.05 + (i % 2) * H * 0.02, H * 0.007, H * 0.035, '#e8f0ff', { lineColor: '#a8b8e0', line: 1 });
    }
    c.globalAlpha = 1;
  }
  c.restore();
  // Kynttilät
  for (i = 0; i < ck.candles.length; i++) {
    p = prtCandlePos(i, ck.candles.length);
    prtDrawCandle(c, p.x, p.y, H, ck.candles[i], ck.candles[i].pop > 0 ? ck.candles[i].pop : 0);
  }
  if (ck.spark > 0) prtDrawSparkler(c, x, top + H * 0.005, H, true);
  if (ck.numPop) {
    d = ck.numPop.t;
    prtText(c, String(ck.numPop.n), x + L.layerW * 0.62, top - H * 0.06 - d * H * 0.03, H * 0.045 * easeOutBack(Math.min(1, d * 4)), '#ffffff', '#a0508a');
  }
}
function prtDrawCandle(c, x, y, H, cd, pop) {
  var h = H * 0.038, w = H * 0.008, fl;
  y -= pop ? Math.sin(pop / 0.35 * Math.PI) * H * 0.012 : 0;
  artRoundRect(c, x - w / 2, y - h, w, h, w * 0.3, cd.col || '#ff9ec6', { lineColor: artShade(cd.col || '#ff9ec6', -0.45), line: 1 });
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.fillRect(x - w / 2, y - h * 0.7, w, h * 0.12);
  c.fillRect(x - w / 2, y - h * 0.35, w, h * 0.12);
  c.strokeStyle = '#5a4a40';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(x, y - h); c.lineTo(x, y - h - H * 0.006); c.stroke();
  if (cd.lit) {
    fl = 1 + Math.sin(globalT * 22 + (cd.seed || 0)) * 0.12;
    artGlow(c, x, y - h - H * 0.012, H * 0.03, '#ffd890', 0.55);
    c.beginPath();
    c.moveTo(x, y - h - H * 0.028 * fl);
    c.quadraticCurveTo(x + H * 0.008, y - h - H * 0.01, x, y - h - H * 0.004);
    c.quadraticCurveTo(x - H * 0.008, y - h - H * 0.01, x, y - h - H * 0.028 * fl);
    c.fillStyle = '#ffb83a';
    c.fill();
    c.fillStyle = '#fff6c0';
    prtEll(c, x, y - h - H * 0.011, H * 0.0028, H * 0.006);
    c.fill();
  }
}
function prtDrawSparkler(c, x, y, H, on) {
  var i, a, r;
  artLimb(c, x, y, x + H * 0.004, y - H * 0.07, H * 0.004, '#a8a8b8', '#5a5a6a');
  if (!on) { artCircle(c, x + H * 0.004, y - H * 0.07, H * 0.007, '#c8c0a0', { lineColor: '#6a6050' }); return; }
  artGlow(c, x + H * 0.004, y - H * 0.072, H * 0.05, '#fff2a0', 0.7);
  c.strokeStyle = '#fff6c0';
  c.lineWidth = Math.max(1, H * 0.002);
  for (i = 0; i < 8; i++) {
    a = i * 0.785 + globalT * 7;
    r = H * (0.015 + ((i * 13 + Math.floor(globalT * 20)) % 7) * 0.004);
    c.beginPath(); c.moveTo(x + H * 0.004, y - H * 0.072); c.lineTo(x + H * 0.004 + Math.cos(a) * r, y - H * 0.072 + Math.sin(a) * r); c.stroke();
  }
}

// ---------- Piirto: työkalut ----------
function prtToolY(name) { return (1 - easeOutBack(prtClamp(prt.toolK[name], 0, 1))) * viewH * 0.22; }
function prtDrawTools(c) {
  var L = prt.L, H = viewH, k, i, n, b, y, ck = prt.cake, pu = prt.pump, x, s, B, r, ph, col, hb;
  // Viirikori
  if (prt.toolK.basket > 0.01) {
    y = prtToolY('basket');
    c.save();
    c.translate(0, y);
    n = prtBasketTypes();
    for (i = 0; i < n.length; i++) {
      b = prtBasketSlot(i, n.length);
      if (prt.drag && prt.drag.kind === 'pen' && prt.drag.type === n[i]) continue;
      prtDrawPennant(c, b.x, b.y, L.penW * 0.9, L.penH * 0.9, n[i], b.rot + Math.PI);
    }
    prtDrawBasket(c, L.basket.x, L.basket.y, H);
    c.restore();
  }
  // Pumppu, pallo ja värit
  if (prt.toolK.pump > 0.01) {
    y = prtToolY('pump');
    c.save();
    c.translate(0, y);
    for (i = 0; i < 5; i++) {
      if (prt.posts[i].done && !prtBalFlying(i)) continue;
      if (prtBalFlying(i)) continue;
      b = L.bags[i];
      k = prt.bags[i] > 0 ? Math.sin(prt.bags[i] / 0.4 * Math.PI) * 0.12 : 0;
      if (pu.post === i) artGlow(c, b.x, b.y - H * 0.04, H * 0.06, '#ffffff', 0.7);
      c.save();
      c.translate(b.x, b.y);
      c.scale(1 - k, 1 + k);
      prtDrawBag(c, 0, 0, H, prt.posts[i].col, PRT_BAL_R[prt.posts[i].size]);
      c.restore();
    }
    ph = pu.hold ? (Math.sin(pu.stroke * Math.PI * 2) * 0.5 + 0.5) : 0;
    prtDrawPump(c, L.pump.x, L.pump.y, H, ph, pu.wob);
    if (pu.post >= 0 && pu.popT <= 0) {
      col = prt.posts[pu.post].col;
      B = prtPumpBand(pu.post);
      r = prtBalR(pu.p);
      // Oikean koon rengas: hehkuu, kun pallon reuna on renkaassa
      hb = pu.p >= B.p0 && pu.p <= B.p1;
      x = (prtBalR(B.p0) + prtBalR(B.p1)) / 2;
      c.strokeStyle = hb ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,' + (0.38 + Math.sin(globalT * 5) * 0.08) + ')';
      c.lineWidth = prtBalR(B.p1) - prtBalR(B.p0);
      prtEll(c, L.balC.x, L.balC.y, x, x * 1.12);
      c.stroke();
      c.strokeStyle = artRGBA(col, hb ? 0.55 : 0.3);
      c.stroke();
      c.setLineDash([H * 0.008, H * 0.006]);
      c.lineDashOffset = -globalT * H * 0.03;
      c.strokeStyle = hb ? '#ffffff' : artShade(col, -0.25);
      c.lineWidth = Math.max(1.5, H * 0.004);
      prtEll(c, L.balC.x, L.balC.y, prtBalR(B.p1), prtBalR(B.p1) * 1.12);
      c.stroke();
      prtEll(c, L.balC.x, L.balC.y, prtBalR(B.p0), prtBalR(B.p0) * 1.12);
      c.stroke();
      c.setLineDash([]);
      c.lineDashOffset = 0;
      if (hb) artGlow(c, L.balC.x, L.balC.y, prtBalR(B.p1) * 1.5, '#ffffff', 0.3);
      // Pallo suuttimessa
      k = pu.newT > 0 ? easeOutBack(1 - pu.newT / 0.35) : 1;
      s = pu.p > 0.8 && pu.hold ? Math.sin(globalT * 40) * H * 0.0015 * (pu.p - 0.8) * 5 : 0;
      c.strokeStyle = artShade(col, -0.2);
      c.lineWidth = Math.max(2, H * 0.006);
      c.beginPath(); c.moveTo(L.nozzle.x, L.nozzle.y); c.lineTo(L.balC.x, L.balC.y + r * 1.05 * k); c.stroke();
      prtDrawBalloon(c, L.balC.x + s, L.balC.y, Math.max(H * 0.004, r * k), col, { face: pu.p > 0.25 });
      if (pu.p > 0.2 && !pu.hold && pu.p < B.p0) prtPuff(L.nozzle.x, L.nozzle.y - H * 0.005, Math.random() < 0.05 ? 1 : 0, '#ffffff', { r: 0.004, vy: -0.03, life: 0.4 });
    }
    c.restore();
  }
  // Jäähdytysritilä ja kakkupohjat
  if (prt.toolK.rack > 0.01) {
    y = prtToolY('rack');
    c.save();
    c.translate(0, y);
    prtDrawRack(c, H);
    for (i = 0; i < 7; i++) {
      b = ck.rack[i];
      if (!b.here) continue;
      k = b.wob > 0 ? Math.sin(b.wob * 30) * 0.08 : 0;
      c.save();
      c.translate(L.rack[i].x, L.rack[i].y - H * 0.02);
      c.rotate(k);
      prtDrawLayer(c, 0, 0, L.layerW * 0.62, L.layerH * 0.9, b.col);
      c.restore();
    }
    c.restore();
  }
  if (prt.toolK.bowl > 0.01) { y = prtToolY('bowl'); prtDrawBowl(c, L.bowl.x, L.bowl.y + y, H); }
  if (prt.toolK.box > 0.01) { y = prtToolY('box'); prtDrawCandleBox(c, L.candleBox.x, L.candleBox.y + y, H); }
  if (prt.toolK.match > 0.01) {
    y = prtToolY('match');
    k = prt.matchWob > 0 ? Math.sin(prt.matchWob * 30) * 0.1 : 0;
    artRoundRect(c, L.match.x - H * 0.03, L.match.y + y - H * 0.03, H * 0.06, H * 0.03, H * 0.008, '#c8a0e8', { lineColor: '#6a4a9a' });
    if (!(prt.drag && prt.drag.kind === 'match') && !prtFlying('match')) prtDrawMatch(c, L.match.x, L.match.y + y - H * 0.025, H, k, prtSeatedAll() && ck.candles.length > 0);
  }
  if (prt.toolK.jar > 0.01) { y = prtToolY('jar'); prtDrawJar(c, L.jar.x, L.jar.y + y, H); }
}
function prtFlying(kind) {
  var i;
  for (i = 0; i < prt.flies.length; i++) if (prt.flies[i].kind === kind) return true;
  return false;
}
function prtDrawBasket(c, x, y, H) {
  var i;
  artShadow(c, x, y + H * 0.004, H * 0.08, H * 0.014, 0.2);
  c.beginPath();
  c.moveTo(x - H * 0.075, y - H * 0.065);
  c.lineTo(x + H * 0.075, y - H * 0.065);
  c.lineTo(x + H * 0.06, y);
  c.lineTo(x - H * 0.06, y);
  c.closePath();
  artFillPath(c, '#e8b46a', y - H * 0.065, y, H * 0.06, { lineColor: '#8a5a20' });
  c.strokeStyle = 'rgba(138,90,32,0.45)';
  c.lineWidth = Math.max(1, H * 0.003);
  for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - H * 0.075 + i * H * 0.004, y - H * 0.065 + i * H * 0.016); c.lineTo(x + H * 0.075 - i * H * 0.004, y - H * 0.065 + i * H * 0.016); c.stroke(); }
  artRoundRect(c, x - H * 0.08, y - H * 0.072, H * 0.16, H * 0.014, H * 0.007, '#f4c87a', { lineColor: '#8a5a20' });
  artBlob(c, x + H * 0.06, y - H * 0.062, H * 0.012, H * 0.008, '#ff6f9a', { rot: 0.5, lineColor: '#a0304a' });
}
function prtDrawBag(c, x, y, H, col, rs) {
  var r = H * 0.024;
  prtDrawBalloon(c, x, y - H * 0.065, r * (0.7 + rs * 6), col, {});
  c.beginPath(); c.moveTo(x - H * 0.032, y - H * 0.055); c.lineTo(x + H * 0.032, y - H * 0.055); c.lineTo(x + H * 0.036, y); c.lineTo(x - H * 0.036, y); c.closePath();
  artFillPath(c, '#fff4e0', y - H * 0.055, y, H * 0.035, { lineColor: '#b09070' });
  c.fillStyle = col;
  c.fillRect(x - H * 0.034, y - H * 0.032, H * 0.068, H * 0.012);
  // Koon merkki: pieni, keski tai iso pallo kassin kyljessä
  artCircle(c, x, y - H * 0.014, H * (0.004 + rs * 0.12), col, { lineColor: artShade(col, -0.4), line: 1 });
}
function prtDrawPump(c, x, y, H, ph, wob) {
  var hy = y - H * 0.13 - (1 - ph) * H * 0.025, L = prt.L, k = wob > 0 ? Math.sin(wob * 30) * 0.05 : 0;
  c.save();
  c.translate(x, y);
  c.rotate(k);
  c.translate(-x, -y);
  artShadow(c, x, y, H * 0.05, H * 0.01, 0.2);
  // Letku suuttimelle
  c.strokeStyle = '#4a4a6a';
  c.lineWidth = Math.max(3, H * 0.008);
  c.beginPath(); c.moveTo(x + H * 0.015, y - H * 0.01); c.quadraticCurveTo(L.nozzle.x, y, L.nozzle.x, L.nozzle.y + H * 0.02); c.stroke();
  artRoundRect(c, L.nozzle.x - H * 0.008, L.nozzle.y, H * 0.016, H * 0.03, H * 0.005, '#9a9ab8', { lineColor: '#4a4a6a' });
  artRoundRect(c, x - H * 0.04, y - H * 0.008, H * 0.08, H * 0.012, H * 0.005, '#6a6a8a', { lineColor: '#3a3a5a' });
  artLimb(c, x, hy, x, y - H * 0.1, H * 0.006, '#c8c8d8', '#5a5a7a');
  artRoundRect(c, x - H * 0.022, y - H * 0.1, H * 0.044, H * 0.095, H * 0.012, '#ff6f9a', { lineColor: '#a0304a', hi: 0.2 });
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(x - H * 0.022, y - H * 0.07, H * 0.044, H * 0.008);
  artLimb(c, x - H * 0.04, hy, x + H * 0.04, hy, H * 0.014, '#ffd24f', '#a07010');
  c.restore();
}
function prtDrawRack(c, H) {
  var L = prt.L, x0 = L.rack[0].x - L.rackSp * 0.55, x1 = L.rack[6].x + L.rackSp * 0.55, y = L.rack[0].y, i;
  artShadow(c, (x0 + x1) / 2, y + H * 0.012, (x1 - x0) * 0.55, H * 0.012, 0.18);
  c.strokeStyle = '#8a8aa8';
  c.lineWidth = Math.max(1.5, H * 0.004);
  c.beginPath();
  c.moveTo(x0, y); c.lineTo(x1, y);
  c.moveTo(x0, y - H * 0.006); c.lineTo(x1, y - H * 0.006);
  for (i = 0; i <= 14; i++) { c.moveTo(x0 + (x1 - x0) * i / 14, y - H * 0.006); c.lineTo(x0 + (x1 - x0) * i / 14, y); }
  c.moveTo(x0 + H * 0.01, y); c.lineTo(x0 + H * 0.004, y + H * 0.012);
  c.moveTo(x1 - H * 0.01, y); c.lineTo(x1 - H * 0.004, y + H * 0.012);
  c.stroke();
}
function prtDrawBowl(c, x, y, H) {
  artShadow(c, x, y, H * 0.06, H * 0.012, 0.2);
  artBlob(c, x, y - H * 0.04, H * 0.045, H * 0.02, '#fffaf4', { lineColor: '#c8b8d8', shadeTo: '#ece2f4' });
  artBlob(c, x - H * 0.01, y - H * 0.05, H * 0.022, H * 0.014, '#ffffff', { lineColor: '#d0c0d8' });
  c.beginPath(); c.moveTo(x - H * 0.055, y - H * 0.04); c.quadraticCurveTo(x, y + H * 0.02, x + H * 0.055, y - H * 0.04); c.closePath();
  artFillPath(c, '#8fd0ff', y - H * 0.04, y, H * 0.05, { lineColor: '#3a7ab0' });
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.arc(x - H * 0.02, y - H * 0.02, H * 0.005, 0, Math.PI * 2); c.arc(x + H * 0.015, y - H * 0.014, H * 0.005, 0, Math.PI * 2); c.fill();
  if (!(prt.drag && prt.drag.kind === 'rub')) prtDrawSpatula(c, x + H * 0.025, y - H * 0.06, H * 0.05, 0.6);
}
function prtDrawSpatula(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artRoundRect(c, -s * 0.08, -s * 0.05, s * 0.16, s * 0.75, s * 0.07, '#ff9ec6', { lineColor: '#b0507a' });
  artRoundRect(c, -s * 0.22, -s * 0.5, s * 0.44, s * 0.48, s * 0.18, '#e8e4f8', { lineColor: '#7a7090' });
  artBlob(c, 0, -s * 0.38, s * 0.18, s * 0.1, '#ffffff', { lineColor: '#d0c0d8', line: 1 });
  c.restore();
}
function prtDrawCandleBox(c, x, y, H) {
  var i, n = Math.max(0, 6 - prt.cake.candles.length);
  artShadow(c, x, y, H * 0.05, H * 0.01, 0.2);
  for (i = 0; i < 5; i++) prtDrawCandle(c, x - H * 0.024 + i * H * 0.012, y - H * 0.03 + (i % 2) * H * 0.004, H, { col: RAINBOW_COLORS[(i * 3) % 7], lit: 0 }, 0);
  artRoundRect(c, x - H * 0.04, y - H * 0.04, H * 0.08, H * 0.04, H * 0.008, '#ffe27a', { lineColor: '#a07010' });
  drawStar(c, x, y - H * 0.02, H * 0.01, 0, 0);
}
function prtDrawMatch(c, x, y, H, rot, ready) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artLimb(c, 0, 0, 0, -H * 0.06, H * 0.007, '#f4dca0', '#a07a40');
  if (ready) artGlow(c, 0, -H * 0.07, H * 0.04, '#ffd890', 0.6 + Math.sin(globalT * 6) * 0.15);
  drawStar(c, 0, -H * 0.068, H * 0.014, globalT * 2, ready ? 0.4 : 0);
  c.restore();
}
function prtDrawJar(c, x, y, H) {
  var i;
  for (i = 0; i < 3; i++) prtDrawSparkler(c, x - H * 0.012 + i * H * 0.012, y - H * 0.03, H, false);
  artRoundRect(c, x - H * 0.03, y - H * 0.05, H * 0.06, H * 0.05, H * 0.012, '#eef8ff', { lineColor: '#8aa8c8', alpha: 0.85 });
  artHighlight(c, x - H * 0.018, y - H * 0.035, H * 0.005, H * 0.01, 0.6);
  drawStar(c, x, y - H * 0.022, H * 0.009, 0, 0.4);
}

// ---------- Piirto: verho, tolpat ja naru ----------
function prtDrawCurtain(c) {
  var L = prt.L, H = viewH, k = prt.cur.k, cv = prt.cv.cur, vis, y, sw, rr;
  if (k > 0.002 && cv) {
    vis = k * cv.ch;
    sw = prt.cur.thump > 0 ? Math.sin(prt.cur.thump * 30) * H * 0.003 : 0;
    c.drawImage(cv, 0, (cv.ch - vis) * DPR, cv.width, Math.max(1, vis * DPR), L.poleL, L.curTop, cv.cw, vis);
    y = L.curTop + vis;
    c.fillStyle = 'rgba(40,30,70,0.15)';
    c.fillRect(L.poleL, y, cv.cw, H * 0.008);
    artRoundRect(c, L.poleL - H * 0.004, y - H * 0.008 + sw, cv.cw + H * 0.008, H * 0.014, H * 0.007, '#b88a5a', { lineColor: '#6a4a2a' });
  }
  // Rulla tangossa: paksumpi, kun verho on ylhäällä
  rr = H * (0.007 + 0.012 * (1 - k));
  artRoundRect(c, L.poleL, L.barY - rr, L.ropeX - L.poleL, rr * 2, rr, '#a49ad0', { lineColor: '#5e5490' });
  c.strokeStyle = 'rgba(255,255,255,0.3)';
  c.lineWidth = Math.max(1, H * 0.002);
  c.beginPath(); c.moveTo(L.poleL + rr, L.barY - rr * 0.4); c.lineTo(L.ropeX - rr, L.barY - rr * 0.4); c.stroke();
}
function prtDrawPoles(c) {
  var L = prt.L, H = viewH, i, x, j;
  for (i = 0; i < 2; i++) {
    x = i ? L.poleR : L.poleL;
    artLimb(c, x, L.ground, x, L.barY - H * 0.015, H * 0.014, '#d8a070', '#7a4a22');
    c.strokeStyle = '#ff9ec6';
    c.lineWidth = Math.max(1.5, H * 0.004);
    for (j = 0; j < 9; j++) { c.beginPath(); c.moveTo(x - H * 0.007, L.barY + H * 0.03 + j * H * 0.062); c.lineTo(x + H * 0.007, L.barY + H * 0.05 + j * H * 0.062); c.stroke(); }
    drawStar(c, x, L.barY - H * 0.022, H * 0.014, Math.sin(globalT + i) * 0.2, 0.2);
  }
}
function prtDrawRope(c) {
  var L = prt.L, H = viewH, h = prtHandPos(), cl = prt.cloud, pul = 0, k;
  artCircle(c, L.ropeX, L.barY, H * 0.014, '#d8a070', { lineColor: '#7a4a22' });
  c.strokeStyle = '#7a4a22';
  c.lineWidth = Math.max(2.5, H * 0.006);
  c.beginPath(); c.moveTo(L.ropeX, L.barY); c.lineTo(h.x, h.y - H * 0.02); c.stroke();
  c.strokeStyle = '#f4d090';
  c.lineWidth = Math.max(1.2, H * 0.003);
  c.stroke();
  if (cl.st === 'warn' || prtWatching()) pul = prtCovered() ? 0 : 0.5 + Math.sin(globalT * 10) * 0.5;
  if (prt.cur.k > 0.5 && (cl.st === 'off' || cl.st === 'sink')) pul = 0.3 + Math.sin(globalT * 4) * 0.3;
  if (pul > 0) artGlow(c, h.x, h.y + H * 0.01, H * 0.06, '#fff2a0', 0.5 * pul);
  k = prt.drag && prt.drag.kind === 'rope' ? 1.12 : 1;
  // Tupsukahva
  c.save();
  c.translate(h.x, h.y);
  c.scale(k, k);
  artCircle(c, 0, -H * 0.012, H * 0.013, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
  c.beginPath(); c.moveTo(-H * 0.012, -H * 0.004); c.lineTo(H * 0.012, -H * 0.004); c.lineTo(H * 0.018, H * 0.04); c.lineTo(-H * 0.018, H * 0.04); c.closePath();
  artFillPath(c, '#ff6f9a', -H * 0.004, H * 0.04, H * 0.02, { lineColor: '#a0304a' });
  c.strokeStyle = 'rgba(160,48,74,0.5)';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(-H * 0.006, 0); c.lineTo(-H * 0.009, H * 0.038); c.moveTo(H * 0.006, 0); c.lineTo(H * 0.009, H * 0.038); c.moveTo(0, 0); c.lineTo(0, H * 0.038); c.stroke();
  c.restore();
}

// ---------- Piirto: prinsessa, noita ja tykki ----------
function prtDrawPrincess(c) {
  var L = prt.L, H = viewH, P = prt.prin, s = H * 0.19 / 58, x = L.prin.x, y = L.prin.y, hop = 0, sx = 1, i, k, hx = x + H * 0.01, hy = y - H * 0.2;
  if (P.poke > 0) hop = Math.sin(P.poke / 0.8 * Math.PI) * H * 0.025;
  if (P.cheer > 0) hop = Math.abs(Math.sin(P.cheer * 6)) * H * 0.03;
  if (P.spin > 0) sx = Math.cos((1 - P.spin) * Math.PI * 2);
  c.save();
  c.translate(x, y - hop);
  c.scale(sx || 0.01, 1);
  drawPrincessFree(c, 0, 0, s, 1, 0, false, globalT);
  c.restore();
  if (P.bang > 0) {
    k = Math.min(1, (1.2 - P.bang) * 6);
    artCircle(c, hx + H * 0.05, hy - H * 0.02, H * 0.025 * easeOutBack(k), '#ffffff', { lineColor: '#c8a8d8' });
    prtText(c, '!', hx + H * 0.05, hy - H * 0.02, H * 0.035 * easeOutBack(k), '#ff5a7a');
  }
  if (P.whistle > 0) {
    for (i = 0; i < 3; i++) {
      k = (globalT * 0.8 + i * 0.33) % 1;
      c.globalAlpha = Math.sin(k * Math.PI);
      prtText(c, i % 2 ? '♪' : '♫', hx + H * (0.03 + k * 0.05), hy + H * 0.03 - k * H * 0.08, H * 0.03, '#8a6ac8', '#ffffff');
    }
    c.globalAlpha = 1;
  }
  if (P.shh > 0) prtText(c, 'shh!', hx + H * 0.06, hy, H * 0.03, '#8a6ac8', '#ffffff');
  if (P.wet > 0) {
    c.fillStyle = 'rgba(120,170,255,0.8)';
    for (i = 0; i < 3; i++) { k = (globalT * 1.6 + i * 0.33) % 1; c.beginPath(); c.arc(x + (i - 1) * H * 0.025, hy + H * 0.02 + k * H * 0.06, H * 0.004, 0, Math.PI * 2); c.fill(); }
  }
}
function prtDrawWitch(c) {
  var F = prt.fin, w = prtWitchPos(), H = viewH, mood, cs, cx, cy, white = 0, i, r, k;
  if (!w) return;
  mood = prtWitchMood();
  cs = H * 0.055;
  cx = w.x + H * 0.01;
  cy = w.y - H * 0.19;
  if (F.ph === 'boom' || F.ph === 'cel') white = prtClamp((F.t - 1.2) / 1.2, 0, 1);
  if (F.ph === 'cel') white = 1;
  // Pieni sateenkaari pilvestä
  if (white > 0.5) {
    k = prtClamp((white - 0.5) * 2, 0, 1);
    for (i = 0; i < 7; i++) {
      r = H * (0.13 - i * 0.008);
      c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.8 * k);
      c.lineWidth = H * 0.008;
      c.beginPath(); c.arc(cx + H * 0.1, cy + H * 0.12, r, Math.PI, Math.PI + Math.PI * k); c.stroke();
    }
  }
  prtDrawCloud(c, cx, cy, cs, { t: globalT, white: white, rain: white > 0.3 ? 0 : 0.5, happy: white > 0.6, mouth: white > 0.6 ? 'smile' : '', look: -0.4 });
  if (white > 0.3) {
    for (i = 0; i < 6; i++) { k = (globalT * 1.2 + i / 6) % 1; drawStar(c, cx + (i - 2.5) * cs * 0.32, cy + cs * 0.4 + k * H * 0.12, H * 0.006, k * 6, 0); }
  }
  c.save();
  if (F.wPoke > 0) { c.translate(w.x, w.y); c.rotate(Math.sin(F.wPoke * 20) * 0.05); c.translate(-w.x, -w.y); }
  drawStormWitch(c, w.x, w.y, H * 0.058, -1, mood);
  c.restore();
  if (F.ph === 'boom' && F.t > 1.9) drawHeartShape(c, w.x - H * 0.03, w.y - H * 0.2 - ((F.t - 1.9) % 1.2) * H * 0.06, H * 0.016, true);
}
function prtDrawCannon(c) {
  var F = prt.fin, L = prt.L, H = viewH, k, x = L.cannon.x, y = L.cannon.y, rec = 0, i;
  if (!F || F.ph === 'wait') return;
  k = F.ph === 'hide' ? easeOutBack(Math.min(1, F.t / 0.6)) : 1;
  if (F.ph === 'boom') rec = Math.max(0, 1 - F.t * 3) * H * 0.02;
  c.save();
  c.translate(x, y);
  c.scale(k * 1.35, k * 1.35 * (F.ph === 'ready' ? 1 + Math.sin(globalT * 6) * 0.03 : 1));
  if (F.ph === 'ready') artGlow(c, H * 0.03, -H * 0.08, H * 0.13, '#fff2a0', 0.6 + Math.sin(globalT * 6) * 0.25);
  artShadow(c, 0, 0, H * 0.07, H * 0.012, 0.2);
  c.save();
  c.translate(-rec, rec * 0.6);
  c.rotate(-0.75);
  artRoundRect(c, -H * 0.03, -H * 0.15, H * 0.06, H * 0.15, H * 0.02, '#8a6ad8', { lineColor: '#3a2a7a', hi: 0.25 });
  for (i = 0; i < 3; i++) { c.fillStyle = RAINBOW_COLORS[i * 2]; c.fillRect(-H * 0.03, -H * (0.12 - i * 0.035), H * 0.06, H * 0.01); }
  artBlob(c, 0, -H * 0.15, H * 0.034, H * 0.012, '#ffe27a', { lineColor: '#a07010' });
  c.restore();
  artCircle(c, -H * 0.03, -H * 0.012, H * 0.018, '#ff6f9a', { lineColor: '#a0304a' });
  artCircle(c, H * 0.03, -H * 0.012, H * 0.018, '#ff6f9a', { lineColor: '#a0304a' });
  drawStar(c, 0, -H * 0.03, H * 0.012, 0, 0.2);
  c.restore();
}
function prtDrawBanner(c) {
  var B = prt.banner, H = viewH, parts = ['YL-', 'LÄ-', 'TYS!'], cols = ['#ff5a7a', '#ffb84f', '#5fb4ff'], i, k, x, tw, y = H * 0.2, sz = H * 0.11;
  if (!B) return;
  c.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
  tw = c.measureText('YL-LÄ-TYS!').width;
  x = viewW / 2 - tw / 2;
  for (i = 0; i < 3; i++) {
    k = prtClamp((B.t - 0.15 - i * 0.32) / 0.3, 0, 1);
    c.font = 'bold ' + Math.round(sz) + 'px ' + UI_FONT;
    var w = c.measureText(parts[i]).width;
    if (k > 0) {
      c.save();
      c.translate(x + w / 2, y + Math.sin(globalT * 4 + i) * H * 0.006);
      c.scale(easeOutBack(k), easeOutBack(k));
      c.rotate(Math.sin(globalT * 3 + i) * 0.05);
      prtText(c, parts[i], 0, 0, sz, cols[i], '#ffffff');
      c.restore();
    }
    x += w;
  }
}

// ---------- Piirto: lentävät, raahattava ja hiukkaset ----------
function prtDrawFlies(c) {
  var L = prt.L, H = viewH, i, f, k, x, y, r, P, q;
  for (i = 0; i < prt.flies.length; i++) {
    f = prt.flies[i];
    k = prtClamp(f.t / f.dur, 0, 1);
    if (f.kind === 'penFall') {
      k = easeInOutSine(k);
      x = prtLerp(f.x0, f.x1, k) + Math.sin(f.t * 9) * H * 0.025 * (1 - k);
      y = prtLerp(f.y0, f.y1, k);
      prtDrawPennant(c, x, y, L.penW, L.penH, f.o.type, Math.sin(f.t * 11) * 0.7);
      continue;
    }
    if (f.kind === 'layerSlide') {
      if (k < 0.35) {
        q = k / 0.35;
        prtDrawLayerTilted(c, f.x0 + q * L.layerW * 0.7, f.y0 + q * q * H * 0.04, L.layerW, L.layerH, f.o.col, q * 0.5);
        continue;
      }
      q = easeOutCubic((k - 0.35) / 0.65);
      x = prtLerp(f.x0 + L.layerW * 0.7, f.x1, q);
      y = prtLerp(f.y0 + H * 0.04, f.y1, q) - Math.sin(q * Math.PI) * H * 0.05;
      prtDrawLayerTilted(c, x, y, prtLerp(L.layerW, L.layerW * 0.62, q), L.layerH * 0.9, f.o.col, 0.5 * (1 - q));
      continue;
    }
    if (f.kind === 'bal') {
      P = prtPostBalloon(f.o.post);
      k = easeInOutSine(k);
      x = prtLerp(f.x0, P.x, k);
      y = prtLerp(f.y0, P.y, k) - Math.sin(k * Math.PI) * H * 0.12;
      r = prtLerp(f.o.r0, P.r, k);
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, y + r * 1.1); c.quadraticCurveTo(x - H * 0.02, y + r * 2, x + Math.sin(f.t * 12) * H * 0.01, y + r * 2.6); c.stroke();
      prtDrawBalloon(c, x, y, r, prt.posts[f.o.post].col, { face: true });
      continue;
    }
    k = easeOutCubic(k);
    x = prtLerp(f.x0, f.x1, k);
    y = prtLerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * H * 0.05;
    if (f.kind === 'pen') prtDrawPennant(c, x, y, L.penW * 0.9, L.penH * 0.9, f.o.type, Math.sin(k * 6) * 0.3);
    else if (f.kind === 'layer') prtDrawLayer(c, x, y, L.layerW * 0.62, L.layerH * 0.9, f.o.col);
    else if (f.kind === 'candle') prtDrawCandle(c, x, y + H * 0.02, H, { col: '#ff9ec6', lit: 0 }, 0);
    else if (f.kind === 'match') prtDrawMatch(c, x, y + H * 0.035, H, 0, true);
    else if (f.kind === 'spark') prtDrawSparkler(c, x, y + H * 0.04, H, false);
    else if (f.kind === 'ember') {
      artGlow(c, x, y, H * 0.025, '#ffd890', 0.8);
      drawStar(c, x, y, H * 0.009, f.t * 8, 0.5);
    }
  }
}
function prtDrawLayerTilted(c, x, y, w, h, col, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  prtDrawLayer(c, 0, 0, w, h, col);
  c.restore();
}
function prtDrawDrag(c) {
  var d = prt.drag, L = prt.L, H = viewH, g, o;
  if (!d) return;
  if (d.kind === 'pen') prtDrawPennant(c, d.x, d.y, L.penW, L.penH, d.type, (lastPX - d.x) / H * -2);
  else if (d.kind === 'guest') {
    g = d.g;
    o = prtGuestDrawOpts(g, false);
    o.mood = 'wow';
    o.wave = true;
    o.t = globalT;
    artShadow(c, d.x, d.y + H * 0.1, H * 0.035, H * 0.008, 0.15);
    prtDrawGuest(c, g.kind, d.x, d.y + H * 0.05 + Math.sin(globalT * 10) * H * 0.003, L.guestR, o);
  } else if (d.kind === 'layer') prtDrawLayer(c, d.x, d.y, L.layerW * d.sc, L.layerH * (0.9 + (d.sc - 0.62) * 0.26), d.col);
  else if (d.kind === 'candle') prtDrawCandle(c, d.x, d.y + H * 0.02, H, { col: '#ff9ec6', lit: 0 }, 0);
  else if (d.kind === 'match') prtDrawMatch(c, d.x, d.y + H * 0.035, H, 0.3, true);
  else if (d.kind === 'spark') prtDrawSparkler(c, d.x, d.y + H * 0.04, H, false);
  else if (d.kind === 'rub') prtDrawSpatula(c, d.x + H * 0.01, d.y + H * 0.01, H * 0.05, 0.5 + Math.sin(globalT * 14) * 0.15);
}
function prtDrawPuffs(c) {
  var i, p, a, r;
  for (i = 0; i < prt.puffs.length; i++) {
    p = prt.puffs[i];
    a = Math.max(0, 1 - p.t / p.life);
    c.globalAlpha = a * 0.8;
    if (p.kind === 'drop') {
      c.strokeStyle = p.col;
      c.lineWidth = Math.max(1, p.r * 0.6);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.r * 0.5, p.y + p.r * 3); c.stroke();
    } else if (p.kind === 'glit') {
      drawStar(c, p.x, p.y, p.r, p.t * 5 + p.rot, 0);
    } else {
      r = p.r * (1 + p.t);
      c.fillStyle = p.col;
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
    }
  }
  c.globalAlpha = 1;
}
function prtDrawBits(c) {
  var i, b, a;
  for (i = 0; i < prt.bits.length; i++) {
    b = prt.bits[i];
    a = Math.min(1, (b.life - b.t) * 2.5);
    if (a <= 0) continue;
    c.globalAlpha = a;
    if (b.star) drawStar(c, b.x, b.y, b.s * 0.8, b.rot, 0);
    else {
      c.save();
      c.translate(b.x, b.y);
      c.rotate(b.rot);
      c.scale(1, Math.cos(b.t * 9 + b.rot));
      c.fillStyle = b.col;
      c.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * 0.66);
      c.restore();
    }
  }
  c.globalAlpha = 1;
}

// ---------- Vihjekäsi ----------
function prtHintPos(st, k) {
  var a = st.from, b = st.to, m;
  if (st.kind === 'rub') {
    if (k < 0.25) { m = easeInOutSine(k / 0.25); return { x: prtLerp(a.x, b.x, m), y: prtLerp(a.y, b.y, m) - Math.sin(m * Math.PI) * viewH * 0.04, press: 1 }; }
    m = (k - 0.25) / 0.75;
    return { x: b.x + Math.sin(m * Math.PI * 6) * viewH * 0.06, y: b.y + Math.sin(m * Math.PI * 3) * viewH * 0.012, press: 1 };
  }
  if (st.hold) return { x: a.x, y: a.y, press: k < 0.15 ? k / 0.15 : (k > 0.85 ? (1 - k) / 0.15 : 1) };
  if (!b) { m = (k * 2) % 1; return { x: a.x, y: a.y, press: m < 0.5 ? m * 2 : (1 - m) * 2 }; }
  if (k < 0.2) return { x: a.x, y: a.y, press: k / 0.2 };
  if (k < 0.75) {
    m = easeInOutSine((k - 0.2) / 0.55);
    return { x: prtLerp(a.x, b.x, m), y: prtLerp(a.y, b.y, m) - Math.sin(m * Math.PI) * viewH * (st.kind === 'ropeDown' || st.kind === 'ropeUp' ? 0 : 0.05), press: 1 };
  }
  return { x: b.x, y: b.y, press: Math.max(0, 1 - (k - 0.75) / 0.12) };
}
function prtDrawHint(c) {
  var st = prt.hintStep, k, p, s = viewH * 0.07, a, per, L = prt.L;
  if (!st || prt.hintT < 0.3) return;
  per = !st.to && !st.hold ? 1.2 : (st.hold ? 2.4 : (st.kind === 'rub' ? 2.8 : 2.0));
  if (st.kind === 'ropeDown') per = 1.2;
  k = ((prt.hintT - 0.3) % per) / per;
  p = prtHintPos(st, k);
  a = Math.min(1, (prt.hintT - 0.3) * 3);
  if (st.to && p.press > 0.3 && st.kind !== 'rub') {
    c.globalAlpha = 0.5 * a * p.press;
    if (st.kind === 'pen') prtDrawPennant(c, p.x, p.y - viewH * 0.035, L.penW, L.penH, st.type, 0);
    else if (st.kind === 'layer') prtDrawLayer(c, p.x, p.y, L.layerW * 0.8, L.layerH, prt.cake.layers.length);
    else if (st.kind === 'guest' && st.g) prtDrawGuest(c, st.g.kind, p.x, p.y + viewH * 0.1, L.guestR, { t: globalT, feet: true, mood: 'happy' });
    else if (st.kind === 'candle' || st.kind === 'candleOff') prtDrawCandle(c, p.x, p.y + viewH * 0.02, viewH, { col: '#ff9ec6' }, 0);
    else if (st.kind === 'match') prtDrawMatch(c, p.x, p.y + viewH * 0.035, viewH, 0, true);
    else if (st.kind === 'spark') prtDrawSparkler(c, p.x, p.y + viewH * 0.04, viewH, false);
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (!st.to && !st.hold) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.03 + (1 - p.press) * 0.05), 0, Math.PI * 2); c.stroke(); }
  else if (st.hold) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.03 + ((prt.hintT * 1.5) % 1) * 0.05), 0, Math.PI * 2); c.stroke(); }
  else if (k < 0.2) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - p.press) * s * -0.25, s);
  c.globalAlpha = 1;
}

// ---------- HUD ja juhla ----------
function prtHudSlot(i) { return { x: hudX() + viewH * 0.05 + i * viewH * 0.075, y: viewH * 0.063 }; }
function prtDrawHud(c) {
  var H = viewH, i, sl, done, cur, k, gold = prtGolden(), last = prtHudSlot(4), sh;
  drawHudPanel(c, hudX(), H * 0.018, last.x + H * 0.05 - hudX(), H * 0.09, H * 0.025);
  for (i = 0; i < 4; i++) {
    sl = prtHudSlot(i);
    done = prt.st > i || (i === 3 && prt.fin && (prt.fin.ph === 'boom' || prt.fin.ph === 'cel'));
    cur = prt.st === i && !done;
    k = cur ? 1 + Math.sin(globalT * 4) * 0.06 : 1;
    c.globalAlpha = done || cur ? 1 : 0.35;
    c.save();
    c.translate(sl.x, sl.y);
    c.scale(k, k);
    prtHudIcon(c, i, H);
    c.restore();
    c.globalAlpha = 1;
    if (done) drawStar(c, sl.x + H * 0.022, sl.y + H * 0.02, H * 0.01, 0, 0);
  }
  sh = prt.hatLostT > 0 ? Math.sin(prt.hatLostT * 30) * 0.25 : 0;
  c.globalAlpha = gold ? 1 : 0.4;
  prtDrawHat(c, last.x, last.y + H * 0.022, H * 0.05, gold, sh);
  c.globalAlpha = 1;
}
function prtHudIcon(c, i, H) {
  if (i === 0) { prtDrawPennant(c, -H * 0.012, -H * 0.02, H * 0.026, H * 0.034, 0, -0.1); prtDrawPennant(c, H * 0.014, -H * 0.018, H * 0.026, H * 0.034, 1, 0.1); }
  else if (i === 1) { prtDrawBalloon(c, -H * 0.008, -H * 0.008, H * 0.015, '#ff5a7a', {}); prtDrawBalloon(c, H * 0.012, -H * 0.002, H * 0.012, '#4aa8ff', {}); }
  else if (i === 2) {
    for (var j = 0; j < 4; j++) prtDrawLayer(c, 0, H * 0.016 - j * H * 0.009, H * 0.036, H * 0.009, j * 2);
    prtDrawCandle(c, 0, -H * 0.018, H * 0.55, { col: '#ff9ec6', lit: 1 }, 0);
  } else {
    c.save(); c.rotate(-0.75);
    artRoundRect(c, -H * 0.008, -H * 0.03, H * 0.016, H * 0.04, H * 0.005, '#8a6ad8', { lineColor: '#3a2a7a' });
    c.restore();
    drawStar(c, H * 0.016, -H * 0.022, H * 0.007, 0, 0);
    drawStar(c, H * 0.004, -H * 0.03, H * 0.005, 0, 0);
  }
}
// Juhlahattu: (x, y) = alareunan keskikohta, s = korkeus
function prtDrawHat(c, x, y, s, gold, rot) {
  var col = gold ? '#ffd24f' : '#ff9ec6', line = gold ? '#a07010' : '#b0507a', i;
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  if (gold) artGlow(c, 0, -s * 0.45, s * 0.8, '#ffe27a', 0.5);
  c.beginPath(); c.moveTo(-s * 0.38, 0); c.lineTo(0, -s); c.lineTo(s * 0.38, 0); c.closePath();
  artFillPath(c, col, -s, 0, s * 0.4, { lineColor: line });
  c.fillStyle = gold ? '#fff2a0' : '#ffffff';
  for (i = 0; i < 3; i++) { c.beginPath(); c.arc((i - 1) * s * 0.13, -s * (0.2 + (i % 2) * 0.25), s * 0.05, 0, Math.PI * 2); c.fill(); }
  artBlob(c, 0, 0, s * 0.42, s * 0.07, gold ? '#ff9ec6' : '#ffe27a', { lineColor: line });
  artCircle(c, 0, -s, s * 0.1, '#ffffff', { lineColor: line });
  c.restore();
}
function prtDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, prt.celT / 0.8)), gold = prtGolden(), i;
  if (k <= 0) return;
  c.save();
  c.translate(viewW / 2, H * 0.56);
  c.scale(k, k);
  artGlow(c, 0, -H * 0.08, H * 0.22, gold ? '#ffe27a' : '#ffd0e0', 0.6);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.15, -H * 0.08 + Math.sin(globalT + i * Math.PI / 4) * H * 0.11, H * 0.013, globalT * 2, 0.4);
  prtDrawHat(c, 0, 0, H * 0.18, gold, Math.sin(globalT * 3) * 0.08);
  c.restore();
}

// ---------- Piirto: kokonaisuus ----------
function drawParty() {
  var c = ctx, L = prt.L, H = viewH, i, g;
  if (!L || !beginPlayWorld()) return;
  prtDrawPeekCloud(c, false);
  if (prt.fin && prt.fin.ph === 'fly') prtDrawWitch(c);
  propsDraw(c, 0);
  prtDrawStrings(c);
  prtDrawPosts(c);
  for (i = 0; i < prt.guests.length; i++) prtDrawGuestAt(c, prt.guests[i], 'seat');
  if (prt.fin && prt.fin.ph !== 'fly') prtDrawWitch(c);
  prtDrawTable(c);
  prtDrawCake(c);
  prtDrawTools(c);
  for (i = 0; i < prt.guests.length; i++) prtDrawGuestAt(c, prt.guests[i], 'ground');
  prtDrawCurtain(c);
  prtDrawPoles(c);
  for (i = 0; i < prt.guests.length; i++) prtDrawGuestAt(c, prt.guests[i], 'hide');
  if (prt.cv.front) c.drawImage(prt.cv.front, 0, H * 0.83, prt.cv.front.cw, prt.cv.front.ch);
  propsDraw(c, 1);
  prtDrawCannon(c);
  prtDrawPrincess(c);
  prtDrawRope(c);
  prtDrawFlies(c);
  prtDrawDrag(c);
  prtDrawPeekCloud(c, true);
  prtDrawPuffs(c);
  prtDrawBits(c);
  prtDrawHint(c);
  drawParticlesLayer(c);
  prtDrawBanner(c);
  if (celebrating) prtDrawTrophy(c);
  endPlayWorld();
  prtDrawHud(c);
}

// ---------- Piirto: tökättävät ----------
function prtDrawAlphorn(c, H, p) {
  var i, k, r, gx, gy;
  // Puinen alppitorvi lepää kivellä: suukappale vasemmalla ylhäällä, kello oikealla
  artLimb(c, -H * 0.085, -H * 0.05, -H * 0.075, -H * 0.012, H * 0.004, '#8a5a30', '#4a2a10');
  artLimb(c, -H * 0.09, -H * 0.06, H * 0.05, -H * 0.012, H * 0.008, '#c88a50', '#6a3a14');
  artLimb(c, H * 0.0, -H * 0.03, H * 0.06, -H * 0.012, H * 0.012, '#c88a50', '#6a3a14');
  c.beginPath();
  c.moveTo(H * 0.05, -H * 0.022);
  c.quadraticCurveTo(H * 0.075, -H * 0.03, H * 0.085, -H * 0.045);
  c.lineTo(H * 0.095, H * 0.002);
  c.quadraticCurveTo(H * 0.075, -H * 0.006, H * 0.05, -H * 0.004);
  c.closePath();
  artFillPath(c, '#d89a60', -H * 0.045, H * 0.002, H * 0.03, { lineColor: '#6a3a14' });
  artBlob(c, H * 0.09, -H * 0.021, H * 0.006, H * 0.023, '#4a2a10', { line: false });
  for (i = 0; i < 3; i++) artCircle(c, -H * 0.04 + i * H * 0.025, -H * 0.035 + i * H * 0.006, H * 0.004, ['#ff6f9a', '#ffe27a', '#5fb4ff'][i], { line: false });
  if (p.echo > 0) {
    // Kaiku: renkaat kaukaisilta vuorilta
    for (i = 0; i < 3; i++) {
      k = ((2.4 - p.echo) - i * 0.6) / 0.8;
      if (k <= 0 || k >= 1) continue;
      r = H * (0.02 + k * 0.06);
      gx = (prt.L.W * (0.12 + i * 0.3)) - p.x;
      gy = H * 0.18 - p.y;
      c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')';
      c.lineWidth = Math.max(1.5, H * 0.004);
      c.beginPath(); c.arc(gx, gy, r, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
    }
  }
  if (p.goat > 0) {
    // 5.: kaukaiselta huipulta vastaa vuorikauris
    k = Math.min(1, Math.min(p.goat, 2.6 - p.goat) * 4);
    gx = prt.L.W * 0.62 - p.x;
    gy = H * 0.13 - p.y;
    c.save();
    c.translate(gx, gy + (1 - k) * H * 0.03);
    prtDrawHead(c, 'goat', 0, 0, H * 0.016, { mood: 'laugh' });
    c.restore();
  }
}
function prtDrawSnowman(c, H, p) {
  var s = H * 0.03, hk = p.hat > 0 ? Math.sin((1 - p.hat) * Math.PI) : 0, wv = p.wave > 0 ? Math.sin(p.wave * 14) * 0.5 : 0, i;
  artShadow(c, 0, 0, s * 1.2, s * 0.25, 0.15);
  artCircle(c, 0, -s * 0.85, s * 0.9, '#ffffff', { lineColor: '#9aa8c8', shadeTo: '#e0e8f8', hi: 0.3 });
  artCircle(c, 0, -s * 2.05, s * 0.6, '#ffffff', { lineColor: '#9aa8c8', shadeTo: '#e0e8f8', hi: 0.3 });
  artLimb(c, -s * 0.5, -s * 2.0, -s * 1.3, -s * (2.6 + wv), s * 0.08, '#8a5a30', '#4a2a10');
  artLimb(c, s * 0.5, -s * 2.0, s * 1.3, -s * (2.5 - wv), s * 0.08, '#8a5a30', '#4a2a10');
  artCircle(c, 0, -s * 3.0, s * 0.45, '#ffffff', { lineColor: '#9aa8c8', shadeTo: '#e0e8f8', hi: 0.3 });
  artEye(c, -s * 0.16, -s * 3.05, s * 0.07, 0, false);
  artEye(c, s * 0.16, -s * 3.05, s * 0.07, 0, false);
  c.beginPath(); c.moveTo(0, -s * 2.98); c.lineTo(s * (0.5 + (p.sneeze > 0 ? 0.2 : 0)), -s * 2.9); c.lineTo(0, -s * 2.85); c.closePath();
  c.fillStyle = '#ff9a3a';
  c.fill();
  for (i = 0; i < 3; i++) artCircle(c, 0, -s * (0.6 + i * 0.35), s * 0.07, '#3a3a5a', { line: false });
  c.strokeStyle = '#ff5a7a';
  c.lineWidth = s * 0.18;
  c.beginPath(); c.moveTo(-s * 0.4, -s * 2.6); c.lineTo(s * 0.4, -s * 2.6); c.stroke();
  // Hattu
  c.save();
  c.translate(0, -s * 3.35 - hk * H * 0.07);
  c.rotate(hk * Math.PI * 2);
  artRoundRect(c, -s * 0.3, -s * 0.5, s * 0.6, s * 0.5, s * 0.06, '#3a3a5a', { lineColor: '#1a1a3a' });
  artBlob(c, 0, 0, s * 0.48, s * 0.09, '#3a3a5a', { lineColor: '#1a1a3a' });
  c.fillStyle = '#ff5a7a';
  c.fillRect(-s * 0.3, -s * 0.17, s * 0.6, s * 0.1);
  c.restore();
  if (p.sneeze > 0 && p.sneeze < 1.0) {
    for (i = 0; i < 5; i++) {
      c.fillStyle = 'rgba(255,255,255,' + p.sneeze + ')';
      c.beginPath(); c.arc(s * (0.6 + (1 - p.sneeze) * 2 + i * 0.25), -s * (2.9 + Math.sin(i * 2) * 0.3), s * 0.08, 0, Math.PI * 2); c.fill();
    }
  }
}
function prtDrawNest(c, H, p) {
  var b = p.beak > 0 ? Math.abs(Math.sin(p.beak * 20)) : 0, i, k, x;
  for (i = -1; i <= 1; i += 2) {
    artCircle(c, i * H * 0.012, -H * 0.014 - b * H * 0.004, H * 0.011, '#f4e8d0', { lineColor: '#8a7a60' });
    artEye(c, i * H * 0.012 - H * 0.003, -H * 0.017 - b * H * 0.004, H * 0.0025, 0, false);
    artEye(c, i * H * 0.012 + H * 0.003, -H * 0.017 - b * H * 0.004, H * 0.0025, 0, false);
    c.beginPath(); c.moveTo(i * H * 0.012 - H * 0.004, -H * 0.011 - b * H * 0.004); c.lineTo(i * H * 0.012, -H * 0.006 + b * H * 0.004); c.lineTo(i * H * 0.012 + H * 0.004, -H * 0.011 - b * H * 0.004); c.closePath();
    c.fillStyle = '#ffc23a';
    c.fill();
  }
  artBlob(c, 0, 0, H * 0.032, H * 0.011, '#a87848', { lineColor: '#5a3a1a' });
  c.strokeStyle = 'rgba(90,58,26,0.6)';
  c.lineWidth = 1;
  for (i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-H * 0.03 + i * H * 0.014, -H * 0.006); c.lineTo(-H * 0.022 + i * H * 0.014, H * 0.006); c.stroke(); }
  if (p.mama > 0) {
    k = 1 - p.mama / 3.2;
    x = -p.x + k * (prt.L.W + H * 0.2) - H * 0.1;
    c.save();
    c.translate(x, -H * 0.12 + Math.sin(k * Math.PI * 2) * H * 0.02);
    for (i = -1; i <= 1; i += 2) artBlob(c, i * H * 0.03, -Math.sin(globalT * 12) * H * 0.008, H * 0.03, H * 0.008, '#8a5a34', { rot: i * Math.sin(globalT * 12) * 0.3, lineColor: '#4a2a14' });
    artBlob(c, 0, 0, H * 0.014, H * 0.01, '#8a5a34', { lineColor: '#4a2a14' });
    artCircle(c, H * 0.012, -H * 0.004, H * 0.007, '#fbf8f2', { lineColor: '#8a8478' });
    c.restore();
  }
  if (p.feather > 0) {
    k = 1 - p.feather / 3;
    artBlob(c, Math.sin(k * 9) * H * 0.03 + k * H * 0.05, k * H * 0.12, H * 0.004, H * 0.012, '#c8a070', { rot: Math.sin(k * 9) * 0.8, lineColor: '#7a5a30' });
  }
}
function prtSnowballPos(p, k) {
  var H = viewH, sx = 0, sy = 0, ex = H * 0.16, ey = prt.L.ridgeY - p.y - H * 0.02;
  return { x: p.x + prtLerp(sx, ex, k) + (p.nb > 1 ? 0 : 0), y: p.y + prtLerp(sy, ey, k * k) };
}
function prtDrawPeakFx(c, H, p) {
  var k, q, r, i;
  if (p.t >= 0 && p.t < 0.6) { c.globalAlpha = 1 - p.t / 0.6; drawStar(c, 0, -H * 0.005, H * 0.01, p.t * 4, 0.5); c.globalAlpha = 1; }
  if (p.ball > 0) {
    k = 1 - p.ball / 1.6;
    for (i = 0; i < p.nb; i++) {
      q = prtSnowballPos(p, Math.max(0, k - i * 0.12));
      r = H * (0.006 + Math.max(0, k - i * 0.12) * 0.014);
      c.save();
      c.translate(q.x - p.x - i * H * 0.02, q.y - p.y - r);
      c.rotate(k * 12);
      artCircle(c, 0, 0, r, '#ffffff', { lineColor: '#9aa8c8', shadeTo: '#e0e8f8' });
      c.restore();
    }
  }
  if (p.hare > 0) {
    q = prtSnowballPos(p, 1);
    k = Math.min(1, (1.8 - p.hare) * 3);
    prtDrawHead(c, 'hare', q.x - p.x, q.y - p.y - H * 0.015 - Math.abs(Math.sin(p.hare * 5)) * H * 0.02, H * 0.012 * k, { mood: 'laugh' });
  }
}
function prtDrawPicnic(c, H, p) {
  var lid = p.lid > 0 ? Math.sin(p.lid / 0.8 * Math.PI) : 0, mk = p.mouse > 0 ? Math.min(1, Math.min(p.mouse, 1.8 - p.mouse) * 5) : 0;
  artShadow(c, 0, 0, H * 0.045, H * 0.01, 0.2);
  if (mk > 0) {
    artCircle(c, H * 0.012, -H * 0.04 - mk * H * 0.012, H * 0.009, '#c8b8c8', { lineColor: '#6a5a6a' });
    artCircle(c, H * 0.006, -H * 0.05 - mk * H * 0.012, H * 0.005, '#ffc8d8', { lineColor: '#6a5a6a', line: 1 });
    artCircle(c, H * 0.018, -H * 0.05 - mk * H * 0.012, H * 0.005, '#ffc8d8', { lineColor: '#6a5a6a', line: 1 });
    artEye(c, H * 0.009, -H * 0.041 - mk * H * 0.012, H * 0.002, 0, false);
    artEye(c, H * 0.015, -H * 0.041 - mk * H * 0.012, H * 0.002, 0, false);
  }
  c.beginPath(); c.moveTo(-H * 0.04, -H * 0.035); c.lineTo(H * 0.04, -H * 0.035); c.lineTo(H * 0.034, 0); c.lineTo(-H * 0.034, 0); c.closePath();
  artFillPath(c, '#e8b46a', -H * 0.035, 0, H * 0.04, { lineColor: '#8a5a20' });
  c.fillStyle = '#ff6f9a';
  c.fillRect(-H * 0.037, -H * 0.024, H * 0.074, H * 0.008);
  c.strokeStyle = '#8a5a20';
  c.lineWidth = Math.max(2, H * 0.004);
  c.beginPath(); c.arc(0, -H * 0.038, H * 0.028, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.save();
  c.translate(-H * 0.04, -H * 0.036);
  c.rotate(-lid * 0.7);
  artRoundRect(c, 0, -H * 0.008, H * 0.08, H * 0.01, H * 0.004, '#f4c87a', { lineColor: '#8a5a20' });
  c.restore();
}
function prtDrawBurrow(c, H, p) {
  var up = p.up > 0 ? Math.min(1, Math.min(p.up, 1.6 - p.up) * 5) : 0, i;
  artBlob(c, 0, -H * 0.006, H * 0.045, H * 0.016, '#b08a60', { lineColor: '#6a4a2a' });
  artBlob(c, 0, -H * 0.008, H * 0.026, H * 0.009, '#3a2a1a', { line: false });
  if (up > 0) {
    c.save();
    c.beginPath(); c.rect(-H * 0.06, -H * 0.12, H * 0.12, H * 0.112); c.clip();
    prtDrawGuest(c, 'marmot', 0, -H * 0.008 + (1 - up) * H * 0.06, H * 0.016, { t: globalT, mood: 'laugh', feet: false });
    if (p.sibs) for (i = -1; i <= 1; i += 2) prtDrawGuest(c, 'marmot', i * H * 0.03, -H * 0.004 + (1 - up) * H * 0.06, H * 0.011, { t: globalT + i, mood: 'wow', feet: false });
    c.restore();
    if (p.flower) {
      artLimb(c, H * 0.012, -H * 0.03 - up * H * 0.01, H * 0.016, -H * 0.06 - up * H * 0.01, H * 0.002, '#4a9a3a', false);
      for (i = 0; i < 5; i++) artCircle(c, H * 0.016 + Math.cos(i * 1.26) * H * 0.006, -H * 0.062 - up * H * 0.01 + Math.sin(i * 1.26) * H * 0.006, H * 0.004, '#ff9ec6', { line: false });
      artCircle(c, H * 0.016, -H * 0.062 - up * H * 0.01, H * 0.003, '#ffe27a', { line: false });
    }
  }
}
function prtDrawBells(c, H, p) {
  var i, sw, x, y, k;
  for (i = 0; i < 3; i++) {
    x = (i - 1) * H * 0.016;
    sw = (p.ring > 0 ? Math.sin(p.ring * 16 + i) * 0.4 * Math.min(1, p.ring) : 0) + Math.sin(globalT * 1.5 + i) * 0.05;
    artLimb(c, x, 0, x + H * 0.004, -H * (0.04 + i % 2 * 0.012), H * 0.0025, '#4a9a3a', false);
    c.save();
    c.translate(x + H * 0.004, -H * (0.04 + i % 2 * 0.012));
    c.rotate(sw);
    c.beginPath(); c.moveTo(-H * 0.009, H * 0.016); c.quadraticCurveTo(-H * 0.008, 0, 0, -H * 0.001); c.quadraticCurveTo(H * 0.008, 0, H * 0.009, H * 0.016); c.closePath();
    artFillPath(c, '#8a9aff', 0, H * 0.016, H * 0.01, { lineColor: '#4a4aa0' });
    c.restore();
  }
  artBlob(c, -H * 0.016, -H * 0.012, H * 0.012, H * 0.004, '#5fbf4a', { rot: -0.5, line: false });
  artBlob(c, H * 0.018, -H * 0.01, H * 0.012, H * 0.004, '#5fbf4a', { rot: 0.5, line: false });
  if (p.bee > 0) {
    k = 3 - p.bee;
    x = Math.sin(k * 3) * H * 0.06;
    y = -H * 0.07 - Math.cos(k * 4) * H * 0.02 - k * H * 0.01;
    artBlob(c, x, y, H * 0.008, H * 0.006, '#ffd24f', { lineColor: '#5a4a10', line: 1 });
    c.fillStyle = '#3a3010';
    c.fillRect(x - H * 0.002, y - H * 0.006, H * 0.003, H * 0.012);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.arc(x, y - H * 0.008, H * 0.005 * (1 + Math.sin(globalT * 60) * 0.3), 0, Math.PI * 2); c.fill();
  }
}
function prtDrawBrook(c, H, p) {
  var i, k, fx, fy;
  // Pieni puro harjanteen kivien välissä
  c.fillStyle = '#9fd8ff';
  prtEll(c, 0, -H * 0.004, H * 0.05, H * 0.008);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, H * 0.002);
  for (i = 0; i < 3; i++) {
    k = (globalT * 0.5 + i / 3) % 1;
    c.beginPath(); c.moveTo(-H * 0.04 + k * H * 0.06, -H * 0.005); c.lineTo(-H * 0.03 + k * H * 0.06, -H * 0.005); c.stroke();
  }
  artCircle(c, -H * 0.05, -H * 0.006, H * 0.009, '#a49ad0', { lineColor: '#5e5490', line: 1 });
  artCircle(c, H * 0.052, -H * 0.004, H * 0.007, '#b4accf', { lineColor: '#5e5490', line: 1 });
  if (p.fish > 0) {
    k = 1 - p.fish / 1.1;
    fx = -H * 0.02 + k * H * 0.04;
    fy = -H * 0.004 - Math.sin(k * Math.PI) * H * 0.04;
    c.save();
    c.translate(fx, fy);
    c.rotate(-1 + k * 2);
    artBlob(c, 0, 0, H * 0.009, H * 0.005, '#ff9a5a', { lineColor: '#a04a10', line: 1 });
    c.beginPath(); c.moveTo(-H * 0.008, 0); c.lineTo(-H * 0.014, -H * 0.004); c.lineTo(-H * 0.014, H * 0.004); c.closePath();
    c.fillStyle = '#ff9a5a'; c.fill();
    c.restore();
  }
  if (p.frog > 0) {
    k = Math.min(1, Math.min(p.frog, 2.2 - p.frog) * 5);
    artBlob(c, H * 0.03, -H * 0.008 - k * H * 0.004, H * 0.009, H * 0.006 * (1 + Math.sin(globalT * 12) * 0.15), '#6fd06a', { lineColor: '#2a7a2a', line: 1 });
    artEye(c, H * 0.026, -H * 0.014 - k * H * 0.004, H * 0.0025, 0, false);
    artEye(c, H * 0.034, -H * 0.014 - k * H * 0.004, H * 0.0025, 0, false);
  }
  if (p.bow > 0) {
    for (i = 0; i < 7; i++) {
      c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.7 * Math.min(1, p.bow));
      c.lineWidth = H * 0.003;
      c.beginPath(); c.arc(0, -H * 0.004, H * (0.04 - i * 0.003), Math.PI, Math.PI * 2); c.stroke();
    }
  }
}

// ---------- Kartan kuvake ----------
// Sateenkaarikakku kynttilöineen, viirinauha ja ilmapallo
HUB_ICONS.party = function (c, x, y, s) {
  var r = s * 0.13, i, k;
  c.strokeStyle = '#c89a70';
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath(); c.moveTo(x - r * 2.1, y - r * 1.9); c.quadraticCurveTo(x, y - r * 1.2, x + r * 2.1, y - r * 1.9); c.stroke();
  for (i = 0; i < 5; i++) {
    k = (i + 0.5) / 5;
    prtDrawPennant(c, x - r * 2.1 + k * r * 4.2, y - r * 1.9 + Math.sin(k * Math.PI) * r * 0.33, r * 0.55, r * 0.7, i % 5, 0);
  }
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(x + r * 1.5, y + r * 0.2); c.lineTo(x + r * 1.5, y - r * 0.6); c.stroke();
  prtDrawBalloon(c, x + r * 1.5, y - r * 1.0, r * 0.45, '#ff5a7a', {});
  for (i = 0; i < 7; i++) prtDrawLayer(c, x, y + r * 1.3 - i * r * 0.26, r * 2.0, r * 0.26, i);
  for (i = 0; i < 3; i++) prtDrawCandle(c, x + (i - 1) * r * 0.5, y + r * 1.3 - 7 * r * 0.26 + r * 0.08, r * 2.2, { col: RAINBOW_COLORS[i * 3], lit: 1, seed: i }, 0);
};
