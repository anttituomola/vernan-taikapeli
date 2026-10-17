'use strict';

// SA-TEEN-KAA-RI-LIU-KU (Kaukamaa, Pilvilinna): Vernan oma toive 17.10.2026
// "liukua sateenkaarta alas ja väistellä". Prinsessa ja yksisarvinen laskevat
// pienellä pilvikelkalla jättimäistä sateenkaarta Pilvilinnasta maahan.
//   Näkymä: sivulta vierivä maailma, jossa on syvyyttä kuten Kuplajoessa.
//   Sateenkaari on leveä nauhatie 3/4-kulmasta: se laskee vasemmalta oikealle
//   notkoin ja kumpurein, kamera seuraa ja horisontti kallistuu jyrkissä
//   kohdissa. Nauhan seitsemän väriraitaa ovat seitsemän syvyyskaistaa
//   (punainen kaukaisin ja ylimpänä, violetti lähin).
//   Ohjaus: RAAHAUS. Sormi vetää ratsastajaa raidalta toiselle (pehmennys ja
//   nopeusraja, ei piilofysiikkaa; ratsastajasta tarttuessa ote säilyy).
//   Hyppynappi (tai toinen sormi) hypähtää n. 0,6 s ilmaan: matalat esteet ja
//   AUKOT ylittyvät.
//   Taustamatka (esirenderöidyt kerrokset): auringonlaskun pinkki taivas ja
//   Pilvilinna -> pilvimeren läpi -> myrskykerroksen ali -> linnut ja
//   kuumailmapallot -> Kaukamaan vihreät maat nousevat alhaalta -> sateenkaari
//   päättyy niittylammen pulahdukseen ja kultapataan.
//   Nauhalla (arvotaan joka kerta osuuden säännöillä):
//    - aukot 1–4 raidassa (kimaltavat reunat näkyvät kaukaa): vaihda raitaa tai hyppää
//    - äreät sadepilvet raidoilla (korkeita: vain väistö), jääpalikat ja
//      sateenkaarikristallit (matalia: hyppy tai väistö)
//    - lumipallot ja rantapallot vierivät raitojen poikki, linnut lentävät
//      ratsastajan korkeudella (väistö); liike on sidottu matkaan, joten pallo
//      on samassa raidassa joka kerta kun ratsastaja saapuu
//    - salamaraita: pilvi lukitsee ratsastajan raidan (keltainen hehku
//      RBS_SECTIONS.tel s) ja iskee; hyppy ei auta, vain väistö
//    - tähdet (laskuri), seitsemän sateenkaarihelmeä omissa väriraidoissaan
//      hankalissa paikoissa (aukon yllä, palikan takana, pilvien välissä);
//      kaikki seitsemän = kultainen kelkka, helmikaari finaalissa ja +1 tähti
//    - vauhtinuolet (vauhtipurske) ja pilvilätäköt (hidastus)
//   Takaisku: osuma vie sydämen (välähdys, kuperkeikka, pyörryksen tähdet,
//   hetken suoja). Kolme menetettyä -> takaisin viimeiselle pilviportille
//   (portti syttyy ohi ajettaessa), osuus arvotaan uudestaan ja sydämet täyttyvät.
//   Viisi osuutta, vauhti ja tiheys kasvavat; viimeinen on nopea.
//   Salaisuus: toisella osuudella kaukaisen (punaisen) raidan yllä lipuu pieni
//   pilvi, jolla istuu pilvipentu. Sen saa vain hyppäämällä punaiselta raidalta;
//   pentu hyppää kelkkaan kyytiin (+1 tähti).
//   Tökättävät: Pilvilinna (fanfaari, 3.: ilotulitus), uninen pilvi (haukottelee,
//   3.: aivastaa sateenkaaren), linnut pilviorrella (sirkuttavat, 3.: silmukka,
//   5.: sulka), kuumailmapallon pupu (liekki, 3.: heittää porkkanan), kultapata
//   (suihkuttaa tähtiä, 5.: sateenkaarisuihku). Pikkupilvi kikattaa.
//   Alussa lähtölaskenta 3-2-1 linnan portilla; Pikkupilvi vilkuttaa ja käsi
//   näyttää raahauksen ja hyppynapin.
// Oma koordinaatisto: u = matka (yksi u = viewH × 4/3), tien korkeus × viewH.

// ---------- Säädöt ----------
var RBS_RX = 0.25;           // ratsastajan paikka ruudulla liu'un aikana × viewW
var RBS_RX_START = 0.62;     // ... lähtölaskennassa (linna näkyy vasemmalla)
var RBS_ROAD_Y = 0.57;       // nauhan keskiraita ratsastajan kohdalla × viewH
var RBS_PITCH = 0.047;       // raidan leveys × viewH
var RBS_FOLLOW = 14;         // raahauksen pehmennys (1/s): suuri = suora
var RBS_VMAX = 9;            // raidanvaihto enintään raitaa / s
var RBS_RIDER_SC = 0.68;     // ratsastajan skaala × trekUS()
var RBS_HOP_T = 0.75;        // hypyn ilma-aika (s)
var RBS_HOP_H = 0.11;        // hypyn korkeus × viewH
var RBS_HOP_BUF = 0.15;      // liian aikainen hyppypainallus muistetaan (s)
var RBS_HOP_LOW = 0.07;      // matala este ylittyy, kun hypystä on kulunut ja jäljellä vähintään tämä (s)
var RBS_HIT_U = 0.028;       // ratsastajan osuma-alueen puolipituus (u)
var RBS_HIT_V = 0.45;        // osuma, kun raitaero on alle tämän
var RBS_HIT_SLOW = 0.55;     // vauhti osuman jälkeen × normaali
var RBS_HIT_REC = 1.2;       // vauhdin palautuminen osumasta (s)
var RBS_TUMBLE_T = 0.9;      // kuperkeikka ja pyörryksen tähdet (s)
var RBS_FALL_T = 0.75;       // aukkoon putoaminen ja pilvipuhallus takaisin (s)
var RBS_BOOST = 1.35;        // vauhtinuolten kerroin
var RBS_BOOST_T = 1.3;       // ... kesto (s)
var RBS_SLOW = 0.6;          // pilvilätäkön kerroin
var RBS_SLOW_T = 1.0;        // ... kesto (s)
var RBS_BOLT_SHOW = 0.35;    // salaman näkyvä isku (s)
var RBS_BOLT_LEN = 0.13;     // varoitusalueen puolipituus iskukohdan ympärillä (u)
var RBS_DROP = 0.1;          // tien keskimääräinen lasku × viewH / u
var RBS_CASTLE_U = 0.72;     // Pilvilinnan keskikohta (u)
var RBS_GATE_U = 0.93;       // sateenkaari alkaa linnan portilta (u)
var RBS_START_U = 1.15;      // lähtöpaikka (u)
var RBS_RUNOUT = 3.4;        // viimeisen osuuden jälkeinen loppuliuku lammelle (u)
var RBS_POND_DU = 0.26;      // lammen keskikohta tien päästä (u); nauha päättyy lampeen
var RBS_COUNT_T = 3;         // lähtölaskenta (s)
var RBS_RESPAWN_T = 1.3;     // tauko pilviportilla ennen jatkoa (s)
var RBS_FIN_T = 4.6;         // pulahduksesta juhlaan (s)
var RBS_SECRET_SEC = 1;      // salainen pilvipentu tällä osuudella
var RBS_HINT_IDLE = 5;       // vihjekäsi tämän joutilaisuuden jälkeen (s)
// Osuudet: pituus (u), vauhti (u/s), rivien väli (s), suurin aukko (raitaa),
// raidanvaihto rivien välillä enintään (raitaa), estelajien painot,
// helmet (värin indeksi 0 = punainen), salaman varoitus (s) ja leveys (raitaa)
var RBS_SECTIONS = [
  // Kevennetty 17.10. (aikuinenkaan ei päässyt loppua läpi): vauhti nousee
  // vain vähän, rivien välit pysyvät väljinä, salama varoittaa pitkään eikä
  // loppupäässä ole aukko + palikka -muureja
  { len: 11, speed: 0.42, dt: [1.7, 2.1], gapMax: 2, shift: 3, kinds: { cloud: 2, ice: 3, gap: 3 }, pearls: [0, 1] },
  { len: 12, speed: 0.44, dt: [1.6, 2.0], gapMax: 2, shift: 3, kinds: { gap: 3, ice: 2, cloud: 2, ball: 2 }, pearls: [2] },
  { len: 12, speed: 0.46, dt: [1.55, 1.9], gapMax: 2, shift: 3, kinds: { bolt: 2, cloud: 3, gap: 2, ice: 2 }, pearls: [3, 4], tel: 1.25, boltW: [1, 1] },
  { len: 12, speed: 0.48, dt: [1.5, 1.85], gapMax: 3, shift: 3, kinds: { bird: 2, ball: 2, gap: 3, cloud: 2, ice: 1 }, pearls: [5] },
  { len: 12, speed: 0.5, dt: [1.45, 1.8], gapMax: 3, shift: 3, kinds: { bolt: 1, bird: 2, ball: 1, gap: 2, cloud: 2, ice: 2 }, pearls: [6], tel: 1.15, boltW: [1, 2] }
];
// Taivaan värit matkan osuuden mukaan (0 = linna, 1 = lampi)
var RBS_SKY_TOP = [[0, '#f493c4'], [0.14, '#c6a4ee'], [0.3, '#a99bd8'], [0.36, '#4f4a82'], [0.5, '#4f4a82'], [0.56, '#78b4f0'], [1, '#86c8ff']];
var RBS_SKY_BOT = [[0, '#ffd8a8'], [0.14, '#ffe3f1'], [0.3, '#e6dcf6'], [0.36, '#9890c2'], [0.5, '#9890c2'], [0.56, '#d4ecff'], [1, '#eef9ff']];
var RBS_SEA_TOP = [[0, 0.76], [0.12, 0.62], [0.19, 0.12], [0.3, -0.8]];      // pilvimeren yläreuna × viewH
var RBS_FOG = [[0.13, 0], [0.18, 0.6], [0.26, 0.6], [0.31, 0]];             // pilvisumu
var RBS_STORM = [[0.31, 0], [0.36, 1], [0.5, 1], [0.55, 0]];                // myrskykerros
var RBS_STORM_Y = [[0.3, -0.3], [0.36, 0.2], [0.5, 0.22], [0.56, -0.4]];    // myrskykaton alareuna × viewH
var RBS_LAND_TOP = [[0.42, 1.25], [0.6, 0.95], [1, 0.5]];                   // Kaukamaan maat
var RBS_HILL_TOP = [[0.72, 1.3], [1, 0.66]];                                // lähemmät kukkulat
var RBS_SUN_Y = [[0, 0.27], [0.3, 0.32], [0.55, 0.17], [1, 0.14]];

var rbs = {
  built: false, state: 'count', t: 0, stT: 0, key: '',
  secU: [], uEnd: 0, cpSec: 0, starsAtCp: 0, sec: 0,
  r: null, camU: 0, camV: 0, lead: RBS_RX_START, tilt: 0,
  obs: [], gaps: [], movers: [], bolts: [], pads: [], stars: [], pearls: [], gates: [], secret: null,
  starN: 0, pearlGot: [], secretFound: false, hits: 0, fails: 0, respawned: false,
  idleT: 0, everDrag: false, everJump: false, noSteer: false, grabOff: 0,
  hudBump: 0, pearlBump: [], flyers: [], lines: [], fogs: [], drops: [], ripples: [],
  finT: 0, won: false, bonus: 0, whooshT: 0, steep: false, pupT: 0, pupPoke: 0, gateFlash: 0
};
var rbsSeaCv = document.createElement('canvas');
var rbsStormCv = document.createElement('canvas');
var rbsLandCv = document.createElement('canvas');
var rbsHillCv = document.createElement('canvas');
var rbsCastleCv = document.createElement('canvas');
var rbsCastleTops = [];
var rbsSegs = [];
var rbsCuts = [];
var rbsList = [];
var rbsNoise = null;

// ---------- Apu ----------
function rbsRnd(a, b) { return a + Math.random() * (b - a); }
function rbsInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function rbsClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rbsHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function rbsUW() { return viewH * 4 / 3; }
function rbsSW() { return viewW / rbsUW(); }
function rbsSX(u) { return (u - rbs.camU) * rbsUW(); }
// Paloittain lineaarinen avainkehys: keys = [[p, arvo], ...]
function rbsKey(keys, p) {
  var i, a, b;
  if (p <= keys[0][0]) return keys[0][1];
  for (i = 1; i < keys.length; i++) {
    a = keys[i - 1]; b = keys[i];
    if (p <= b[0]) return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]);
  }
  return keys[keys.length - 1][1];
}
function rbsKeyCol(keys, p) {
  var i, a, b;
  if (p <= keys[0][0]) return keys[0][1];
  for (i = 1; i < keys.length; i++) {
    a = keys[i - 1]; b = keys[i];
    if (p <= b[0]) return artMix(a[1], b[1], (p - a[0]) / (b[0] - a[0]));
  }
  return keys[keys.length - 1][1];
}
// Tien keskiraidan korkeus maailmassa × viewH: laskee notkoin ja kumpurein.
// Linnan portilla tasainen lähtö, lopussa jyrkkä liuku lampeen.
function rbsRoadH(u) {
  var y = RBS_DROP * u + 0.085 * Math.sin(u * 0.83 + 0.4) + 0.045 * Math.sin(u * 2.05 + 1.1);
  var k = easeInOutSine((u - 0.9) / 1.6), e;
  y *= k;
  if (rbs.uEnd > 0) {
    e = rbsClamp((u - (rbs.uEnd - 2.6)) / 2.6, 0, 1);
    y += 0.22 * easeInOutSine(e);
  }
  return y;
}
function rbsSlope(u) { return (rbsRoadH(u + 0.08) - rbsRoadH(u - 0.08)) / 0.16; }
// Raidan v keskikohta ruudulla (v = 0 punainen ... 6 violetti, välit sallittu)
function rbsLaneY(u, v) { return (RBS_ROAD_Y + rbsRoadH(u) - rbs.camV) * viewH + (v - 3) * RBS_PITCH * viewH; }
// Syvyysskaala: kaukainen raita pienempi, lähin isompi
function rbsK(v) { return 0.9 + 0.2 * rbsClamp(v, -1, 7) / 6; }
function rbsProg() { return rbsClamp((rbs.r.u - RBS_START_U) / Math.max(1, rbs.uEnd - RBS_START_U), 0, 1); }
function rbsSecAt(u) {
  var i;
  for (i = RBS_SECTIONS.length - 1; i > 0; i--) if (u >= rbs.secU[i]) return i;
  return 0;
}
function rbsHopFrac() {
  var f, r = rbs.r;
  if (r.hopT < 0) return 0;
  f = r.hopT / RBS_HOP_T;
  return 4 * f * (1 - f);
}
// Matala este ylittyy vain hypyn keskivaiheilla
function rbsHigh() {
  var r = rbs.r;
  return r.hopT >= RBS_HOP_LOW && r.hopT <= RBS_HOP_T - RBS_HOP_LOW;
}
function rbsRiding() { return rbs.state === 'ride'; }

// ---------- Alustus ----------
function initRbslide() {
  var i, u = RBS_START_U;
  rbs.secU = [];
  for (i = 0; i < RBS_SECTIONS.length; i++) { rbs.secU.push(u); u += RBS_SECTIONS[i].len; }
  rbs.uEnd = u + RBS_RUNOUT;
  rbs.r = {
    u: RBS_START_U, v: 3, vt: 3, vy: 0, spd: 0, hopT: -1, jumpBuf: 0, tumbleT: 0, fallT: 0, fallFrom: 3, fallTo: 3,
    recT: 0, boostT: 0, slowT: 0, lean: 0, landT: 0, appearT: 0
  };
  rbs.state = 'count';
  rbs.t = 0;
  rbs.stT = 0;
  rbs.cpSec = 0;
  rbs.starN = 0;
  rbs.starsAtCp = 0;
  rbs.pearlGot = [false, false, false, false, false, false, false];
  rbs.pearlBump = [0, 0, 0, 0, 0, 0, 0];
  rbs.secretFound = false;
  rbs.hits = 0;
  rbs.fails = 0;
  rbs.respawned = false;
  rbs.idleT = 0;
  rbs.everDrag = false;
  rbs.everJump = false;
  rbs.noSteer = false;
  rbs.grabOff = 0;
  rbs.hudBump = 0;
  rbs.flyers = [];
  rbs.drops = [];
  rbs.ripples = [];
  rbs.finT = 0;
  rbs.won = false;
  rbs.bonus = 0;
  rbs.whooshT = 0;
  rbs.steep = false;
  rbs.pupT = 0;
  rbs.pupPoke = 0;
  rbs.gateFlash = 0;
  rbs.lead = RBS_RX_START;
  rbs.tilt = 0;
  rbs.sec = 0;
  rbs.obs = []; rbs.gaps = []; rbs.movers = []; rbs.bolts = []; rbs.pads = []; rbs.stars = []; rbs.pearls = [];
  rbs.secret = null;
  rbs.gates = [];
  for (i = 1; i < RBS_SECTIONS.length; i++) rbs.gates.push({ u: rbs.secU[i], sec: i, lit: false, x: 0, litT: 0 });
  for (i = 0; i < RBS_SECTIONS.length; i++) rbsGenSection(i);
  makeCheckpoints([]);
  rbsInitFx();
  princess.coyote = 1;
  princess.vy = 0;
  princess.onGround = true;
  rbs.built = true;
  rbsSnapCam();
  rbsSetupProps();
  rbsPlaceProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.25);
  playNote(659, 0.12, 0.2, 'triangle', 0.25);
  playNote(784, 0.24, 0.3, 'triangle', 0.25);
}
function rbsSnapCam() {
  var r = rbs.r;
  rbs.camU = r.u - rbs.lead * rbsSW();
  rbs.camV = rbsRoadH(r.u + 0.2);
  camX = rbs.camU * rbsUW();
}
function rbsInitFx() {
  var i;
  rbs.lines = [];
  for (i = 0; i < 9; i++) rbs.lines.push({ x: Math.random(), y: rbsRnd(0.12, 0.92), len: rbsRnd(0.08, 0.2), sp: rbsRnd(0.8, 1.3) });
  rbs.fogs = [];
  for (i = 0; i < 5; i++) rbs.fogs.push({ x: i / 5 + Math.random() * 0.1, y: rbsRnd(0.2, 0.95), s: rbsRnd(0.07, 0.13) });
}
function respawnRbslide() {
  var k = rbs.cpSec, r = rbs.r, i, S = RBS_SECTIONS;
  if (!rbs.built) return;
  rbs.respawned = true;
  rbs.fails++;
  // Tämän osuuden helmet palaavat ja osuus arvotaan uudestaan
  for (i = 0; i < S[k].pearls.length; i++) rbs.pearlGot[S[k].pearls[i]] = false;
  rbs.starN = rbs.starsAtCp;
  rbsGenSection(k);
  r.u = k ? rbs.secU[k] + 0.14 : RBS_START_U;
  r.v = r.vt = 3;
  r.hopT = -1; r.jumpBuf = 0; r.tumbleT = 0; r.fallT = 0; r.recT = 0; r.boostT = 0; r.slowT = 0; r.spd = 0;
  r.appearT = 0.6;
  rbs.flyers = [];
  rbs.state = 'respawn';
  rbs.stT = 0;
  rbs.noSteer = true;
  rbs.lead = RBS_RX;
  rbsSnapCam();
  rbsPlaceProps();
  spawnSparkles(r.u * rbsUW(), rbsLaneY(r.u, 3) - viewH * 0.08, 16, '#ffffff');
  artPop(r.u * rbsUW(), rbsLaneY(r.u, 3) - viewH * 0.08, viewH * 0.12, '#ffe27a', 'ring');
}
function resizeRbslide() {
  if (!rbs.built) return;
  rbsSnapCam();
  // Koristeiden koot ja osuma-alueet riippuvat ruudun korkeudesta
  rbsSetupProps();
  rbsPlaceProps();
}

// ---------- Kentän arvonta ----------
function rbsClearSec(k) {
  var lists = ['obs', 'gaps', 'movers', 'bolts', 'pads', 'stars', 'pearls'], i, j, L;
  for (i = 0; i < lists.length; i++) {
    L = rbs[lists[i]];
    for (j = L.length - 1; j >= 0; j--) if (L[j].sec === k) L.splice(j, 1);
  }
  if (rbs.secret && rbs.secret.sec === k) rbs.secret = null;
}
function rbsPickKind(S, prev) {
  var tot = 0, key, x;
  for (key in S.kinds) if (key !== prev || (key !== 'bolt' && key !== 'wall')) tot += S.kinds[key];
  x = Math.random() * tot;
  for (key in S.kinds) {
    if (key === prev && (key === 'bolt' || key === 'wall')) continue;
    x -= S.kinds[key];
    if (x <= 0) return key;
  }
  return 'ice';
}
// n eri raitaa ilman turvaraitaa ns; prefer pääsee mukaan ensimmäisenä
function rbsLanesExcept(ns, n, prefer) {
  var pool = [], i, j, t;
  for (i = 0; i < 7; i++) if (i !== ns && i !== prefer) pool.push(i);
  for (i = pool.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  if (prefer !== undefined && prefer !== ns && prefer >= 0 && prefer <= 6) pool.unshift(prefer);
  return pool.slice(0, n);
}
// Yhtenäinen raitalohko [l0, l0 + size - 1], joka ei peitä turvaraitaa
function rbsBlock(size, ns, prefer) {
  var opts = [], hit = [], l0;
  for (l0 = 0; l0 + size - 1 <= 6; l0++) {
    if (ns >= l0 && ns <= l0 + size - 1) continue;
    opts.push(l0);
    if (prefer >= l0 && prefer <= l0 + size - 1) hit.push(l0);
  }
  if (hit.length) return hit[rbsInt(0, hit.length - 1)];
  if (opts.length) return opts[rbsInt(0, opts.length - 1)];
  return -1;
}
function rbsAddGap(k, u, l0, l1, len) {
  rbs.gaps.push({ u0: u - len / 2, u1: u + len / 2, l0: l0, l1: l1, sec: k });
}
function rbsAddObs(k, type, u, l0, l1) {
  var low = type === 'ice' || type === 'crystal';
  rbs.obs.push({ type: type, u: u, l0: l0, l1: l1, len: low ? 0.05 : 0.075, low: low, done: false, bump: 0, sec: k, ph: Math.random() * 6 });
}
function rbsAddStar(k, u, lane, h) { rbs.stars.push({ u: u, lane: lane, h: h || 0, got: false, sec: k, ph: Math.random() * 6 }); }
function rbsGenSection(k) {
  var S = RBS_SECTIONS[k], u0 = rbs.secU[k], u = u0 + (k ? 0.9 : 1.5), end = u0 + S.len - 0.55;
  var s = 3, ns, dtRow, kind, prev = '', row = 0, est, pearlRow = {}, i, j, shift, secretU = -99, idx;
  rbsClearSec(k);
  // Helmirivit arvotaan osuuden keskiosaan
  est = Math.floor((end - u) / (S.speed * (S.dt[0] + S.dt[1]) / 2));
  for (i = 0; i < S.pearls.length; i++) {
    if (rbs.pearlGot[S.pearls[i]]) continue;
    for (j = 0; j < 20; j++) {
      idx = rbsInt(2 + Math.floor(est * i / S.pearls.length), Math.max(3, Math.floor(est * (i + 1) / S.pearls.length) - 2));
      if (pearlRow[idx] === undefined) { pearlRow[idx] = S.pearls[i]; break; }
    }
  }
  // Salainen pilvipentu: hiljainen kohta punaisen raidan kohdalla
  if (k === RBS_SECRET_SEC && !rbs.secretFound) {
    secretU = u0 + S.len * rbsRnd(0.42, 0.62);
    rbs.secret = { u: secretU, sec: k, t: 0, ph: Math.random() * 6 };
    for (i = 0; i < 3; i++) rbsAddStar(k, secretU - 0.42 + i * 0.09, 0, 0);
  }
  while (true) {
    dtRow = rbsRnd(S.dt[0], S.dt[1]);
    u += dtRow * S.speed;
    if (u > end) break;
    if (Math.abs(u - secretU) < 0.5) { row++; continue; }
    shift = Math.max(1, Math.min(S.shift, Math.floor((dtRow - 0.35) * 4)));
    ns = rbsClamp(s + rbsInt(-shift, shift), 0, 6);
    if (pearlRow[row] !== undefined) kind = 'pearl';
    else if (k === 0 && row < 3) kind = ['cloud', 'ice', 'gap'][row];
    else kind = rbsPickKind(S, prev);
    if (kind === 'wall' || kind === 'bolt') ns = s;
    rbsRow(k, kind, u, s, ns, pearlRow[row]);
    // Tähtirivi johdattaa turvaraidalle
    if (kind !== 'bolt' && kind !== 'wall' && Math.random() < 0.55) {
      for (i = 0; i < 3; i++) rbsAddStar(k, u - 0.34 + i * 0.08, ns, 0);
    }
    // Vauhtinuolet turvaraidalle, pilvilätäkkö muualle
    if (Math.random() < 0.22) rbs.pads.push({ type: 'boost', u: u + 0.22, len: 0.2, lane: ns, used: false, sec: k });
    if (k > 0 && Math.random() < 0.2) rbs.pads.push({ type: 'slow', u: u + 0.24, len: 0.17, lane: rbsLanesExcept(ns, 1)[0], used: false, sec: k });
    s = ns;
    prev = kind;
    row++;
  }
}
function rbsRow(k, kind, u, s, ns, pearlIdx) {
  var S = RBS_SECTIONS[k], i, n, lanes, size, l0, d, m, w;
  if (kind === 'gap') {
    size = rbsInt(1, S.gapMax);
    l0 = -1;
    while (size > 0 && (l0 = rbsBlock(size, ns, s)) < 0) size--;
    if (l0 >= 0) rbsAddGap(k, u, l0, l0 + size - 1, rbsRnd(0.12, 0.17) + k * 0.006);
    // Myöhemmin toinen aukko turvaraidan toiselle puolelle
    if (k >= 2 && Math.random() < 0.4) {
      size = rbsInt(1, 2);
      l0 = ns + (l0 > ns ? -size : 1);
      if (l0 >= 0 && l0 + size - 1 <= 6 && (ns < l0 || ns > l0 + size - 1)) rbsAddGap(k, u + rbsRnd(-0.04, 0.04), l0, l0 + size - 1, rbsRnd(0.12, 0.16));
    }
  } else if (kind === 'ice') {
    n = rbsInt(2, k >= 3 ? 4 : 3);
    lanes = rbsLanesExcept(ns, n, s);
    for (i = 0; i < lanes.length; i++) rbsAddObs(k, Math.random() < 0.5 ? 'ice' : 'crystal', u + rbsRnd(-0.06, 0.06), lanes[i], lanes[i]);
  } else if (kind === 'cloud') {
    n = 1 + (k >= 2 ? 1 : 0) + (k >= 4 && Math.random() < 0.5 ? 1 : 0);
    for (i = 0; i < n; i++) {
      size = k >= 1 && Math.random() < 0.4 ? 2 : 1;
      l0 = rbsBlock(size, ns, i === 0 ? s : rbsInt(0, 6));
      if (l0 < 0) l0 = rbsBlock(1, ns, s), size = 1;
      if (l0 >= 0 && !rbsLaneBusy(u, l0, l0 + size - 1)) rbsAddObs(k, 'cloud', u + rbsRnd(-0.05, 0.05), l0, l0 + size - 1);
    }
  } else if (kind === 'ball' || kind === 'bird') {
    n = kind === 'bird' ? rbsInt(1, 2) : rbsInt(1, k >= 3 ? 2 : 1);
    for (i = 0; i < n; i++) {
      // Saapumisraita (missä pallo/lintu on, kun ratsastaja tulee kohdalle)
      lanes = rbsLanesExcept(ns, 7, s);
      m = -1;
      for (d = 0; d < lanes.length; d++) if (Math.abs(lanes[d] - ns) >= 1.3) { m = lanes[d]; break; }
      if (m < 0) continue;
      // Ovela: pallo on kulkenut turvaraidan kautta
      w = Math.random() < 0.6 ? (m > ns ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
      rbs.movers.push({
        type: kind === 'bird' ? 'bird' : (k >= 3 ? 'beach' : 'snow'), u: u + i * 0.1, vEnd: m, dir: w,
        rate: kind === 'bird' ? 3.2 : (k >= 3 ? 3.0 : 2.6), done: false, sec: k, ph: Math.random() * 6
      });
    }
  } else if (kind === 'bolt') {
    w = rbsInt(S.boltW[0], S.boltW[1]);
    rbs.bolts.push({ u: u, w: w, tel: S.tel, state: 'wait', t: 0, l0: 0, l1: 0, sec: k, ph: Math.random() * 6, pts: [] });
    if (k >= 5 && Math.random() < 0.5) {
      // Lopussa salaman lisäksi jääpalikka kauempana
      lanes = rbsLanesExcept(s, 1);
      if (Math.abs(lanes[0] - s) >= 3) rbsAddObs(k, 'ice', u + 0.25, lanes[0], lanes[0]);
    }
  } else if (kind === 'wall') {
    // Koko nauhan poikki: aukko ja palikat -> hypättävä
    size = Math.min(4, S.gapMax);
    l0 = rbsInt(0, 7 - size);
    rbsAddGap(k, u, l0, l0 + size - 1, rbsRnd(0.12, 0.15));
    for (i = 0; i < 7; i++) if (i < l0 || i > l0 + size - 1) rbsAddObs(k, Math.random() < 0.5 ? 'ice' : 'crystal', u, i, i);
    rbsAddStar(k, u - 0.11, s, 0.5);
    rbsAddStar(k, u, s, 1);
    rbsAddStar(k, u + 0.11, s, 0.5);
  } else if (kind === 'pearl') {
    rbsRowPearl(k, u, s, ns, pearlIdx);
  }
}
function rbsLaneBusy(u, l0, l1) {
  var i, o;
  for (i = 0; i < rbs.obs.length; i++) {
    o = rbs.obs[i];
    if (Math.abs(o.u - u) < 0.15 && o.l1 >= l0 && o.l0 <= l1) return true;
  }
  return false;
}
// Helmi omassa väriraidassaan hankalassa paikassa; turvaraita jää aina vapaaksi
function rbsRowPearl(k, u, s, ns, idx) {
  var L = idx, opt = rbsInt(0, 2), size, l0, c, i, pu = u, ph = 0;
  if (ns === L) ns = L < 6 ? L + 1 : L - 1;
  if (opt === 2 && Math.abs(ns - L) <= 1) opt = 1;
  if (opt === 0) {
    // Aukon yllä leijuva helmi: hyppää aukon yli juuri sen raidan kohdalla
    size = rbsInt(1, 2);
    c = [];
    for (l0 = L - size + 1; l0 <= L; l0++) if (l0 >= 0 && l0 + size - 1 <= 6 && (ns < l0 || ns > l0 + size - 1)) c.push(l0);
    if (c.length) {
      l0 = c[rbsInt(0, c.length - 1)];
      rbsAddGap(k, u, l0, l0 + size - 1, rbsRnd(0.13, 0.16));
      ph = 0.85;
    } else opt = 1;
  }
  if (opt === 1) {
    // Palikan takana: hyppy palikan yli ja lasku helmen päälle
    rbsAddObs(k, Math.random() < 0.5 ? 'ice' : 'crystal', u, L, L);
    pu = u + 0.14;
  } else if (opt === 2) {
    // Kahden sadepilven välissä
    for (i = -1; i <= 1; i += 2) if (L + i >= 0 && L + i <= 6 && L + i !== ns) rbsAddObs(k, 'cloud', u, L + i, L + i);
  }
  rbs.pearls.push({ u: pu, lane: L, h: ph, idx: idx, got: false, sec: k, ph: Math.random() * 6 });
}

// ---------- Tökättävät koristeet ----------
// Paikka: wu (keskikohta, u), sy (korkeus ruudulla, kun tie on kameran
// korkeudella), par (parallaksi). Sijainti lasketaan joka ruudulla (rbsPlaceProps).
function rbsSetupProps() {
  var s3 = rbs.secU[3];
  propsReset();
  rbsAddCastle();
  rbsAddSleepy(rbs.secU[1] + 5.5);
  rbsAddBirds(s3 + 2.5);
  rbsAddBalloon(s3 + 10.5);
  rbsAddPot();
}
function rbsPlaceProps() {
  var i, p, sw = rbsSW(), uw = rbsUW(), sx;
  for (i = 0; i < props.length; i++) {
    p = props[i];
    sx = viewW * 0.5 + (p.wu - (rbs.camU + 0.5 * sw)) * uw * p.par;
    p.x = camX + sx;
    if (p.yFn) p.y = p.yFn();
    else if (p.road) p.y = rbsLaneY(p.wu, p.road) + p.sy * viewH;
    else p.y = (p.sy + (rbsRoadH(p.wu) - rbs.camV) * p.par) * viewH;
  }
}
// Pilvilinna: sateenkaari lähtee sen portilta; 3. tökkäys: ilotulitus
function rbsAddCastle() {
  propAdd({
    wu: RBS_CASTLE_U, par: 1, road: 3, sy: 0.2, r: viewH * 0.26, hy: viewH * 0.32, color: '#ffd6f0', note: 659, amp: 0.03, flagT: 0,
    update: function (p, dt) { if (p.flagT > 0) p.flagT -= dt; },
    poke: function (p) {
      var i, tp;
      p.flagT = 1.5;
      playNote(523, 0, 0.12, 'triangle', 0.2);
      playNote(659, 0.1, 0.12, 'triangle', 0.2);
      playNote(784, 0.2, 0.25, 'triangle', 0.2);
      for (i = 0; i < rbsCastleTops.length; i++) {
        tp = rbsCastleTops[i];
        spawnSparkles(p.x + tp.x * viewH, p.y + tp.y * viewH, 4, RAINBOW_COLORS[(i * 2 + p.n) % 7]);
      }
      if (p.n % 3 === 0) {
        for (i = 0; i < 5; i++) {
          artPop(p.x + rbsRnd(-0.25, 0.25) * viewH, p.y - rbsRnd(0.45, 0.7) * viewH, viewH * rbsRnd(0.05, 0.09), RAINBOW_COLORS[(i + p.n) % 7], 'burst');
          spawnSparkles(p.x + rbsRnd(-0.25, 0.25) * viewH, p.y - rbsRnd(0.45, 0.7) * viewH, 8, RAINBOW_COLORS[(i * 3) % 7]);
        }
        soundFanfare();
      }
    },
    draw: function (c, p) {
      var w = rbsCastleCv.width / rbsCastleCv._sc, h = rbsCastleCv.height / rbsCastleCv._sc, i, tp, wv, fx, fy, L;
      if (!rbsCastleCv.width) return;
      c.drawImage(rbsCastleCv, -w * 0.5, -h, w, h);
      // Viirit liehuvat (tökkäys heiluttaa rajummin)
      L = viewH * 0.045;
      for (i = 0; i < rbsCastleTops.length; i++) {
        tp = rbsCastleTops[i];
        fx = tp.x * viewH; fy = tp.y * viewH;
        wv = Math.sin(globalT * (p.flagT > 0 ? 14 : 4) + i) * L * (p.flagT > 0 ? 0.2 : 0.08);
        c.beginPath();
        c.moveTo(fx, fy);
        c.quadraticCurveTo(fx + L * 0.5, fy + wv, fx + L, fy + L * 0.18 + wv * 1.5);
        c.lineTo(fx, fy + L * 0.36);
        c.closePath();
        artFillPath(c, RAINBOW_COLORS[(i * 2) % 7], fy, fy + L * 0.36, L * 0.2, { line: Math.max(1, L * 0.05) });
      }
    }
  });
}
// Uninen pilvi: haukottelee; 3. tökkäys: aivastaa pienen sateenkaaren
function rbsAddSleepy(wu) {
  propAdd({
    wu: wu, par: 0.8, sy: 0.24, r: viewH * 0.09, hy: viewH * 0.02, color: '#ffffff', note: 392, amp: 0.08, wakeT: 0, sneezeT: 0,
    update: function (p, dt) { if (p.wakeT > 0) p.wakeT -= dt; if (p.sneezeT > 0) p.sneezeT -= dt; },
    poke: function (p) {
      p.wakeT = 2.5;
      playNote(330, 0, 0.3, 'sine', 0.15);
      playNote(262, 0.25, 0.4, 'sine', 0.12);
      if (p.n % 3 === 0) {
        p.sneezeT = 1.6;
        playNote(880, 0.3, 0.06, 'square', 0.08);
        playNote(1319, 0.38, 0.12, 'triangle', 0.15);
        var i;
        for (i = 0; i < 7; i++) spawnSparkles(p.x + viewH * 0.09, p.y - viewH * 0.02, 3, RAINBOW_COLORS[i]);
      }
    },
    draw: function (c, p) {
      var S = viewH * 0.05, awake = p.wakeT > 0, i, k, zx, zy;
      rbsCloudBody(c, 0, -S * 0.3, S, '#ffffff', '#dcd6f4', '#a49ad8');
      artBlush(c, -S * 0.55, -S * 0.12, S * 0.14);
      artBlush(c, S * 0.55, -S * 0.12, S * 0.14);
      if (awake) {
        artEye(c, -S * 0.26, -S * 0.35, S * 0.11, 0.5, p.wakeT < 0.5);
        artEye(c, S * 0.26, -S * 0.35, S * 0.11, 0.5, p.wakeT < 0.5);
        c.fillStyle = '#6a3a7a';
        c.beginPath(); c.ellipse(0, -S * 0.08, S * 0.12, S * (p.wakeT > 1.6 ? 0.16 : 0.08), 0, 0, Math.PI * 2); c.fill();
      } else {
        c.strokeStyle = '#5a4a8a'; c.lineWidth = Math.max(1, S * 0.05); c.lineCap = 'round';
        c.beginPath();
        c.arc(-S * 0.26, -S * 0.36, S * 0.1, 0.2, Math.PI - 0.2);
        c.moveTo(S * 0.36, -S * 0.34);
        c.arc(S * 0.26, -S * 0.36, S * 0.1, 0.2, Math.PI - 0.2);
        c.stroke();
        // Unen Z:t nousevat
        c.fillStyle = 'rgba(110,90,170,0.8)';
        c.font = 'bold ' + Math.round(S * 0.4) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        for (i = 0; i < 2; i++) {
          k = (globalT * 0.5 + i * 0.5) % 1;
          zx = S * (0.8 + k * 0.4); zy = -S * (0.8 + k * 0.9);
          c.globalAlpha = Math.sin(k * Math.PI);
          c.fillText('Z', zx, zy);
        }
        c.globalAlpha = 1;
      }
      if (p.sneezeT > 0) {
        // Aivastuksesta syntyy pieni sateenkaari
        k = easeOutCubic(Math.min(1, (1.6 - p.sneezeT) / 0.5));
        c.globalAlpha = Math.min(1, p.sneezeT);
        c.lineWidth = S * 0.08;
        for (i = 0; i < 7; i++) {
          c.strokeStyle = RAINBOW_COLORS[i];
          c.beginPath(); c.arc(S * 1.4, S * 0.1, S * (0.9 - i * 0.08) * k, Math.PI, Math.PI * 2); c.stroke();
        }
        c.globalAlpha = 1;
      }
    }
  });
}
// Linnut pilviorrella: sirkuttavat; 3.: silmukka ja sydämet; 5.: sulka putoaa
function rbsAddBirds(wu) {
  propAdd({
    wu: wu, par: 0.9, sy: 0.22, r: viewH * 0.08, hy: viewH * 0.03, color: '#8fd0ff', note: 1175, amp: 0.1, loopT: 0, hopT: 0,
    update: function (p, dt) { if (p.loopT > 0) p.loopT -= dt; if (p.hopT > 0) p.hopT -= dt; },
    poke: function (p) {
      p.hopT = 0.4;
      playNote(1568, 0, 0.05, 'sine', 0.12);
      playNote(1760, 0.07, 0.05, 'sine', 0.12);
      playNote(1568, 0.14, 0.06, 'sine', 0.12);
      if (p.n % 3 === 0) {
        p.loopT = 1.4;
        spawnSparkles(p.x, p.y - viewH * 0.06, 10, '#ff9fc8');
      }
      if (p.n % 5 === 0) {
        propDrop({
          x: p.x + viewH * 0.02, y: p.y - viewH * 0.03, vx: -viewW * 0.03, vy: -viewH * 0.05, vr: 1.5, life: 2.4,
          draw: function (cc) { rbsDrawFeather(cc, viewH * 0.025); }
        });
      }
    },
    draw: function (c, p) {
      var S = viewH * 0.045, i, a, bx, by, k;
      rbsCloudBody(c, 0, 0, S * 1.2, '#ffffff', '#dcd6f4', '#a49ad8');
      for (i = 0; i < 3; i++) {
        bx = (i - 1) * S * 0.75; by = -S * 0.7 - (p.hopT > 0 ? Math.sin(p.hopT / 0.4 * Math.PI) * S * 0.4 * (i === 1 ? 1 : 0.6) : 0);
        if (p.loopT > 0) {
          k = (1.4 - p.loopT) / 1.4;
          a = k * Math.PI * 2 + i * 0.5;
          bx += Math.sin(a) * S * 1.4;
          by -= (1 - Math.cos(a)) * S * 1.1;
        }
        rbsDrawBirdBody(c, bx, by, S * 0.42, globalT * 3 + i, i === 2 ? -1 : 1, ['#7cc4ff', '#ffb0d0', '#ffd86a'][i]);
      }
    }
  });
}
// Kuumailmapallo ja pupu korissa: liekki; 3.: pupu vilkuttaa ja heittää porkkanan
function rbsAddBalloon(wu) {
  propAdd({
    wu: wu, par: 0.7, sy: 0.2, r: viewH * 0.1, hy: viewH * 0.1, color: '#ffd24f', note: 523, amp: 0.05, fireT: 0, waveT: 0, lift: 0,
    update: function (p, dt) {
      if (p.fireT > 0) { p.fireT -= dt; p.lift = Math.min(1, p.lift + dt * 1.2); } else p.lift = Math.max(0, p.lift - dt * 0.3);
      if (p.waveT > 0) p.waveT -= dt;
    },
    poke: function (p) {
      p.fireT = 0.8;
      rbsWhoosh(0.14, 0.5, 300, 900);
      if (p.n % 3 === 0) {
        p.waveT = 2;
        soundBunny();
        propDrop({
          x: p.x, y: p.y - viewH * 0.02, vx: -viewW * 0.05, vy: -viewH * 0.15, vr: 4, life: 2.5,
          draw: function (cc) { rbsDrawCarrot(cc, viewH * 0.022); }
        });
      }
    },
    draw: function (c, p) {
      var S = viewH * 0.06, i, up = -p.lift * S * 0.6 + Math.sin(globalT * 1.1) * S * 0.08, x0, x1;
      c.save();
      c.translate(0, up);
      // Köydet
      c.strokeStyle = '#8a6a4a'; c.lineWidth = Math.max(1, S * 0.03);
      c.beginPath(); c.moveTo(-S * 0.42, -S * 0.32); c.lineTo(-S * 0.3, 0); c.moveTo(S * 0.42, -S * 0.32); c.lineTo(S * 0.3, 0); c.stroke();
      // Kupu raidoittain
      c.save();
      c.beginPath(); c.ellipse(0, -S * 1.05, S * 0.82, S * 0.9, 0, 0, Math.PI * 2);
      c.moveTo(-S * 0.5, -S * 0.4); c.lineTo(0, -S * 0.25); c.lineTo(S * 0.5, -S * 0.4);
      c.clip();
      for (i = 0; i < 7; i++) {
        x0 = -S * 0.84 + i * S * 0.24; x1 = x0 + S * 0.24;
        c.fillStyle = RAINBOW_COLORS[i];
        c.fillRect(x0, -S * 2, x1 - x0 + 1, S * 2);
      }
      var g = c.createLinearGradient(-S, 0, S, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,30,90,0.2)');
      c.fillStyle = g; c.fillRect(-S, -S * 2, S * 2, S * 2);
      c.restore();
      c.beginPath(); c.ellipse(0, -S * 1.05, S * 0.82, S * 0.9, 0, 0, Math.PI * 2);
      c.strokeStyle = '#5a3a7a'; c.lineWidth = Math.max(1.2, S * 0.04); c.stroke();
      artHighlight(c, -S * 0.4, -S * 1.4, S * 0.16, S * 0.28, 0.4);
      if (p.fireT > 0) {
        artGlow(c, 0, -S * 0.3, S * 0.4, '#ffb030', 0.8);
        artBlob(c, 0, -S * 0.32, S * 0.07, S * 0.14, '#ffd84a', { line: false });
      }
      // Pupu korissa
      drawBunny(c, -S * 0.02, -S * 0.02, S * 0.36, 0, 0, true);
      if (p.waveT > 0) artLimb(c, S * 0.18, -S * 0.15, S * 0.3, -S * 0.32 + Math.sin(globalT * 14) * S * 0.06, S * 0.07, '#ffffff', BUNNY_LINE);
      artRoundRect(c, -S * 0.3, -S * 0.06, S * 0.6, S * 0.3, S * 0.06, '#c8945a', { lineColor: '#6a4a2a' });
      c.strokeStyle = 'rgba(106,74,42,0.5)'; c.lineWidth = Math.max(1, S * 0.02);
      c.beginPath(); c.moveTo(-S * 0.3, S * 0.08); c.lineTo(S * 0.3, S * 0.08); c.stroke();
      c.restore();
    }
  });
}
// Kultapata sateenkaaren päässä: suihkuttaa tähtiä; 5.: sateenkaarisuihku
function rbsAddPot() {
  propAdd({
    wu: rbs.uEnd + RBS_POND_DU + 0.47, par: 1, sy: 0, r: viewH * 0.09, hy: viewH * 0.06, color: '#ffd24f', note: 784, amp: 0.1, layer: 1, spT: 0,
    yFn: function () { return rbsPondXY().y - viewH * 0.03; },
    update: function (p, dt) { if (p.spT > 0) p.spT -= dt; },
    poke: function (p) { rbsPotSpew(p, p.n % 5 === 0 ? 14 : 5); },
    draw: function (c, p) { rbsDrawPot(c, viewH * 0.05, p.spT); }
  });
}
function rbsPotSpew(p, n) {
  var i;
  p.spT = 1;
  for (i = 0; i < n; i++) {
    propDrop({
      x: p.x, y: p.y - viewH * 0.06, vx: rbsRnd(-1, 1) * viewW * 0.12, vy: -viewH * rbsRnd(0.5, 0.9), vr: rbsRnd(-5, 5), life: 1.8,
      ground: p.y + viewH * 0.01,
      draw: function (cc) { drawStar(cc, 0, 0, viewH * 0.016, 0, 0); }
    });
  }
  for (i = 0; i < 3; i++) playNote(1047 * Math.pow(1.26, i), i * 0.06, 0.15, 'triangle', 0.18);
  if (n > 10) {
    for (i = 0; i < 7; i++) spawnSparkles(p.x, p.y - viewH * 0.1, 3, RAINBOW_COLORS[i]);
    soundFanfare();
  }
}

// ---------- Syöte ----------
function handleRbslideTap(px, py) {
  var g, pp;
  if (!rbs.built || celebrating) return;
  rbs.idleT = 0;
  rbs.noSteer = false;
  rbs.grabOff = 0;
  // Pikkupilvi kikattaa
  pp = rbsPupPos();
  if (pp && Math.hypot(px - pp.x, py - pp.y) < pp.r * 1.6) {
    rbs.pupPoke = 0.7;
    trekPupSound('giggle');
    spawnSparkles(pp.x + camX, pp.y, 8, '#bfe0ff');
    artPop(pp.x + camX, pp.y, pp.r * 1.4, '#ffffff', 'ring');
    rbs.noSteer = true;
    return;
  }
  if (propsTap(px + camX, py)) { rbs.noSteer = true; return; }
  if (rbs.state === 'finish') return;
  // Ote ratsastajasta: ratsastaja ei hyppää sormen alle
  g = rbsRiderGeo();
  if (Math.abs(px - g.x) < viewH * 0.07 && py > g.y - viewH * 0.17 && py < g.y + viewH * 0.03) rbs.grabOff = g.base - RBS_PITCH * viewH * 0.22 - py;
}
// Hyppy: tryJump (hyppynappi, toinen sormi, vasen alakulma) nollaa princess.coyoten
function rbsJumpInput() {
  if (princess.coyote <= 0) rbs.r.jumpBuf = RBS_HOP_BUF;
  princess.coyote = 1;
  princess.vy = 0;
  princess.onGround = true;
}

// ---------- Päivitys ----------
function updateRbslide(dt) {
  var r;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (!rbs.built) return;
  if (dt > 0.1) dt = 0.1;
  r = rbs.r;
  rbs.t += dt;
  rbs.stT += dt;
  if (!holding) rbs.noSteer = false;
  else rbs.idleT = 0;
  rbs.idleT += dt;
  rbsJumpInput();
  if (rbs.hudBump > 0) rbs.hudBump -= dt;
  if (rbs.pupPoke > 0) rbs.pupPoke -= dt;
  if (rbs.gateFlash > 0) rbs.gateFlash -= dt;
  if (rbs.whooshT > 0) rbs.whooshT -= dt;
  rbsUpdateFlyers(dt);
  rbsUpdateFx(dt);
  if (rbs.state === 'count') {
    if (introT <= 0) {
      var prev = rbs.stT - dt, i;
      for (i = 0; i < 3; i++) if (prev < i && rbs.stT >= i) playNote(523, 0, 0.15, 'triangle', 0.3);
      if (rbs.stT >= RBS_COUNT_T) {
        rbs.state = 'ride';
        rbs.stT = 0;
        playNote(784, 0, 0.2, 'triangle', 0.35);
        playNote(1047, 0.08, 0.35, 'triangle', 0.35);
        rbsWhoosh(0.22, 0.9, 400, 1400);
      }
    } else rbs.stT = 0;
    rbsSteer(dt);
    rbsHop(dt);
  } else if (rbs.state === 'respawn') {
    if (r.appearT > 0) r.appearT -= dt;
    rbsSteer(dt);
    rbsHop(dt);
    if (rbs.stT >= RBS_RESPAWN_T) { rbs.state = 'ride'; rbs.stT = 0; rbsWhoosh(0.15, 0.6, 400, 1200); }
  } else if (rbs.state === 'ride') {
    rbsUpdateRide(dt);
  } else if (rbs.state === 'finish') {
    rbsUpdateFinish(dt);
  }
  rbsUpdateCamera(dt);
  rbsPlaceProps();
}
function rbsUpdateRide(dt) {
  var r = rbs.r, S, k, target, sl, prevU = r.u;
  k = rbsSecAt(r.u);
  rbs.sec = k;
  S = RBS_SECTIONS[k];
  sl = rbsSlope(r.u);
  if (r.boostT > 0) r.boostT -= dt;
  if (r.slowT > 0) r.slowT -= dt;
  if (r.recT > 0) r.recT -= dt;
  if (r.tumbleT > 0) r.tumbleT -= dt;
  target = S.speed * (1 + rbsClamp(sl, -0.1, 0.3) * 0.35);
  if (r.boostT > 0) target *= RBS_BOOST;
  if (r.slowT > 0) target *= RBS_SLOW;
  if (r.recT > 0) target *= RBS_HIT_SLOW + (1 - RBS_HIT_SLOW) * (1 - r.recT / RBS_HIT_REC);
  r.spd += (target - r.spd) * Math.min(1, dt * 3);
  r.u += r.spd * dt;
  // Jyrkkä kohta: tuulen suhahdus
  if (sl > 0.2 && !rbs.steep && rbs.whooshT <= 0) { rbsWhoosh(0.12, 0.8, 500, 1300); rbs.whooshT = 2.5; }
  rbs.steep = sl > 0.2;
  rbsSteer(dt);
  rbsHop(dt);
  rbsGates(prevU, dt);
  rbsUpdateBolts(dt);
  if (rbs.respawned) { rbs.respawned = false; return; }
  rbsCollide();
  if (rbs.respawned) { rbs.respawned = false; return; }
  rbsPickups();
  rbsSecretCheck();
  // Kipinävana kelkan perässä
  if (Math.random() < dt * 10 * r.spd / 0.5) {
    var g = rbsRiderGeo();
    particles.push({ x: g.x + camX - viewH * 0.05, y: g.y + rbsRnd(-1, 1) * viewH * 0.01, vx: -20, vy: rbsRnd(-20, 10), life: 0.5, age: 0, size: 3 + Math.random() * 3, color: RAINBOW_COLORS[rbsInt(0, 6)], noGravity: true });
  }
  if (r.u >= rbs.uEnd) rbsStartFinish();
}
// Raahaus: sormen korkeus -> raita ratsastajan kohdalla
function rbsSteer(dt) {
  var r = rbs.r, tv, d, k, lim, ov = r.v;
  if (r.fallT > 0) {
    // Putoaminen: pilvipuhallus nostaa lähimmälle ehjälle raidalle
    r.fallT -= dt;
    if (r.fallT < RBS_FALL_T * 0.55) {
      k = 1 - Math.exp(-dt * 12);
      r.v += (r.fallTo - r.v) * k;
      r.vt = r.fallTo;
    }
    if (r.fallT <= 0) { r.fallT = 0; r.v = r.vt = r.fallTo; }
    r.vy = 0;
    return;
  }
  if (holding && !rbs.noSteer && !celebrating) {
    tv = (lastPY + rbs.grabOff - rbsLaneY(r.u, 0)) / (RBS_PITCH * viewH);
    r.vt = rbsClamp(tv, 0, 6);
    if (Math.abs(r.vt - r.v) > 0.3) rbs.everDrag = true;
  }
  k = 1 - Math.exp(-dt * RBS_FOLLOW);
  lim = RBS_VMAX * dt;
  d = (r.vt - r.v) * k;
  r.v += rbsClamp(d, -lim, lim);
  r.v = rbsClamp(r.v, 0, 6);
  r.vy = dt > 0 ? (r.v - ov) / dt : 0;
  r.lean += (rbsClamp(r.vy * 0.025, -0.14, 0.14) - r.lean) * Math.min(1, dt * 10);
}
function rbsHop(dt) {
  var r = rbs.r, g;
  if (r.jumpBuf > 0) {
    r.jumpBuf -= dt;
    if (r.hopT < 0 && r.fallT <= 0 && r.tumbleT < RBS_TUMBLE_T - 0.25) {
      r.hopT = 0;
      r.jumpBuf = 0;
      rbs.everJump = true;
      g = rbsRiderGeo();
      spawnSparkles(g.x + camX, g.base, 6, '#ffffff');
    }
  }
  if (r.hopT >= 0) {
    r.hopT += dt;
    if (r.hopT >= RBS_HOP_T) {
      r.hopT = -1;
      r.landT = 0.25;
      g = rbsRiderGeo();
      spawnSparkles(g.x + camX, g.base, 5, '#fff4fb');
      playNote(220, 0, 0.1, 'sine', 0.2);
    }
  }
  if (r.landT > 0) r.landT -= dt;
}
function rbsUpdateCamera(dt) {
  var r = rbs.r, sw = rbsSW(), tu, tv, sl;
  if (rbs.state === 'finish') {
    tu = rbs.uEnd + RBS_POND_DU - 0.48 * sw;
    rbs.camU += (tu - rbs.camU) * Math.min(1, dt * 1.6);
    tv = rbsRoadH(rbs.uEnd) - 0.04;
    rbs.camV += (tv - rbs.camV) * Math.min(1, dt * 2);
  } else {
    if (rbs.state !== 'count') rbs.lead += (RBS_RX - rbs.lead) * Math.min(1, dt * 1.8);
    rbs.camU = r.u - rbs.lead * sw;
    tv = rbsRoadH(r.u + 0.2);
    rbs.camV += (tv - rbs.camV) * Math.min(1, dt * 5);
  }
  sl = rbs.state === 'finish' ? 0 : rbsSlope(r.u + 0.1);
  rbs.tilt += (rbsClamp(sl * 0.16, -0.025, 0.05) - rbs.tilt) * Math.min(1, dt * 2.5);
  camX = rbs.camU * rbsUW();
}
// Pilviportit: syttyvät ohi ajettaessa ja tallentavat paluupaikan
function rbsGates(prevU, dt) {
  var i, gt, r = rbs.r;
  for (i = 0; i < rbs.gates.length; i++) {
    gt = rbs.gates[i];
    if (!gt.lit && prevU < gt.u && r.u >= gt.u) {
      gt.x = gt.u * rbsUW();
      gt.litT = 0;
      setCheckpoint(gt, gt.x, rbsLaneY(gt.u, 3));
      rbs.cpSec = gt.sec;
      rbs.starsAtCp = rbs.starN;
      rbs.gateFlash = 0.6;
      playNote(1319, 0.2, 0.3, 'sine', 0.2);
      playNote(1568, 0.3, 0.4, 'sine', 0.18);
      rbsWhoosh(0.12, 0.6, 600, 1500);
    }
    if (gt.lit) gt.litT += dt;
  }
}
// Mukana kulkevan pallon / linnun raita ratsastajan matkan funktiona
function rbsMoverV(m) { return m.vEnd + m.dir * m.rate * (rbs.r.u - m.u); }
// Salamat: varoitus alkaa RBS_SECTIONS.tel s ennen saapumista ja lukitsee raidat
function rbsUpdateBolts(dt) {
  var i, b, r = rbs.r, c, eta, j;
  for (i = 0; i < rbs.bolts.length; i++) {
    b = rbs.bolts[i];
    b.t += dt;
    if (b.state === 'wait') {
      eta = (b.u - r.u) / Math.max(0.1, r.spd);
      if (b.u - r.u < 2 && eta <= b.tel) {
        b.state = 'warn';
        b.t = 0;
        c = Math.round(r.v) + rbsInt(-1, 1) * (b.w >= 2 ? 1 : 0) * (Math.random() < 0.5 ? 1 : 0);
        b.l0 = rbsClamp(c - Math.floor((b.w - 1) / 2), 0, 7 - b.w);
        b.l1 = b.l0 + b.w - 1;
        playNote(73, 0, 0.5, 'triangle', 0.16);
        playNote(82, 0.18, 0.45, 'triangle', 0.13);
      }
    } else if (b.state === 'warn') {
      if (r.u >= b.u) {
        b.state = 'strike';
        b.t = 0;
        b.pts = [];
        for (j = 0; j <= 7; j++) b.pts.push(j === 0 || j === 7 ? 0 : rbsRnd(-1, 1));
        artShakeStart(viewH * 0.006, 0.25);
        playNote(90, 0, 0.45, 'sawtooth', 0.14);
        playNote(1250, 0, 0.05, 'square', 0.07);
        playNote(620, 0.05, 0.08, 'square', 0.06);
        if (r.v > b.l0 - RBS_HIT_V && r.v < b.l1 + RBS_HIT_V) {
          rbsHurt(b);
          if (rbs.respawned) return;
        }
      }
    } else if (b.state === 'strike' && b.t > RBS_BOLT_SHOW) b.state = 'done';
  }
}
function rbsCollide() {
  var r = rbs.r, i, o, g, m, mv, high = rbsHigh(), air = r.hopT >= 0, d;
  if (r.fallT > 0) return;
  for (i = 0; i < rbs.obs.length; i++) {
    o = rbs.obs[i];
    if (o.done) continue;
    d = Math.abs(o.u - r.u);
    if (d > o.len * 0.5 + RBS_HIT_U) continue;
    if (r.v < o.l0 - RBS_HIT_V || r.v > o.l1 + RBS_HIT_V) continue;
    if (o.low && high) { if (!o.cleared) { o.cleared = true; playNote(1319, 0, 0.08, 'sine', 0.12); } continue; }
    o.done = true;
    o.bump = 0.5;
    rbsHurt(o);
    if (rbs.respawned) return;
  }
  for (i = 0; i < rbs.movers.length; i++) {
    m = rbs.movers[i];
    if (m.done || Math.abs(m.u - r.u) > RBS_HIT_U + 0.02) continue;
    mv = rbsMoverV(m);
    if (Math.abs(mv - r.v) > RBS_HIT_V) continue;
    if (m.type !== 'bird' && high) continue;
    m.done = true;
    rbsHurt(m);
    if (rbs.respawned) return;
  }
  if (!air) {
    for (i = 0; i < rbs.gaps.length; i++) {
      g = rbs.gaps[i];
      if (r.u < g.u0 + RBS_HIT_U * 0.5 || r.u > g.u1 - RBS_HIT_U * 0.5) continue;
      if (r.v < g.l0 - 0.45 || r.v > g.l1 + 0.45) continue;
      rbsFall(g);
      if (rbs.respawned) return;
      break;
    }
  }
  // Vauhtinuolet ja lätäköt
  for (i = 0; i < rbs.pads.length; i++) {
    o = rbs.pads[i];
    if (o.used || air || r.u < o.u || r.u > o.u + o.len || Math.abs(r.v - o.lane) > 0.6) continue;
    o.used = true;
    if (o.type === 'boost') {
      r.boostT = RBS_BOOST_T;
      rbsWhoosh(0.2, 0.9, 500, 1800);
      playNote(784, 0, 0.1, 'triangle', 0.2);
      playNote(1175, 0.08, 0.15, 'triangle', 0.2);
      spawnSparkles(r.u * rbsUW(), rbsLaneY(r.u, r.v), 10, '#ffd24f');
    } else {
      r.slowT = RBS_SLOW_T;
      playNote(196, 0, 0.12, 'sine', 0.2);
      playNote(165, 0.1, 0.18, 'sine', 0.18);
      spawnSparkles(r.u * rbsUW(), rbsLaneY(r.u, r.v), 6, '#c8c0e0');
    }
  }
}
// Osuma: sydän, kuperkeikka ja pyörryksen tähdet (suoja-aikana ei mitään)
function rbsHurt(o) {
  var r = rbs.r, g;
  if (!loseHeart()) return false;
  if (rbs.respawned) return true;
  rbs.hits++;
  r.tumbleT = RBS_TUMBLE_T;
  r.recT = RBS_HIT_REC;
  r.hopT = -1;
  g = rbsRiderGeo();
  artShakeStart(viewH * 0.008, 0.35);
  spawnSparkles(g.x + camX, g.y - viewH * 0.08, 12, '#ffffff');
  artPop(g.x + camX, g.y - viewH * 0.06, viewH * 0.08, '#ff9fc8', 'burst');
  return true;
}
function rbsFall(g) {
  var r = rbs.r, a = g.l0 - 1, b = g.l1 + 1;
  if (!rbsHurt(g)) return;
  if (rbs.respawned) return;
  r.tumbleT = 0;
  r.fallT = RBS_FALL_T;
  r.fallFrom = r.v;
  if (a < 0) r.fallTo = b;
  else if (b > 6) r.fallTo = a;
  else r.fallTo = Math.abs(r.v - a) <= Math.abs(r.v - b) ? a : b;
  rbs.noSteer = true;
  playNote(600, 0, 0.3, 'sine', 0.15);
  playNote(300, 0.1, 0.3, 'sine', 0.15);
}
function rbsPickups() {
  var r = rbs.r, i, s, p, hf = rbsHopFrac(), g;
  for (i = 0; i < rbs.stars.length; i++) {
    s = rbs.stars[i];
    if (s.got || Math.abs(s.u - r.u) > 0.06 || Math.abs(r.v - s.lane) > 0.6) continue;
    if (s.h > 0 && hf < s.h * 0.6 - 0.01) continue;
    if (s.h === 0 && hf > 0.75) continue;
    s.got = true;
    rbs.starN++;
    soundStar(rbs.starN % 12);
    g = rbsItemXY(s.u, s.lane, s.h);
    rbs.flyers.push({ kind: 'star', x0: g.x, y0: g.y, t: 0, dur: 0.55 });
    spawnSparkles(s.u * rbsUW(), g.y, 5, '#ffe27a');
  }
  for (i = 0; i < rbs.pearls.length; i++) {
    p = rbs.pearls[i];
    if (p.got || Math.abs(p.u - r.u) > 0.07 || Math.abs(r.v - p.lane) > 0.6) continue;
    if (p.h > 0 && hf < p.h * 0.55) continue;
    p.got = true;
    rbs.pearlGot[p.idx] = true;
    g = rbsItemXY(p.u, p.lane, p.h);
    rbs.flyers.push({ kind: 'pearl', idx: p.idx, x0: g.x, y0: g.y, t: 0, dur: 0.75 });
    artPop(p.u * rbsUW(), g.y, viewH * 0.06, RAINBOW_COLORS[p.idx], 'burst');
    spawnSparkles(p.u * rbsUW(), g.y, 12, RAINBOW_COLORS[p.idx]);
    playNote(523 * Math.pow(1.122, p.idx), 0, 0.2, 'triangle', 0.3);
    playNote(784 * Math.pow(1.122, p.idx), 0.08, 0.25, 'triangle', 0.25);
    playNote(1047 * Math.pow(1.122, p.idx), 0.16, 0.35, 'sine', 0.2);
  }
}
// Salainen pilvipentu: vain hyppy punaiselta raidalta yltää
function rbsSecretCheck() {
  var sc = rbs.secret, r = rbs.r, g;
  if (!sc || rbs.secretFound) return;
  if (Math.abs(sc.u - r.u) < 0.1 && r.v < 0.6 && rbsHopFrac() > 0.5) {
    rbs.secretFound = true;
    g = rbsSecretXY();
    artPop(sc.u * rbsUW(), g.y, viewH * 0.1, '#ffffff', 'ring');
    artPop(sc.u * rbsUW(), g.y, viewH * 0.07, '#ffe27a', 'burst');
    spawnSparkles(sc.u * rbsUW(), g.y, 18, '#ffe27a');
    trekPupSound('giggle');
    playNote(1047, 0.1, 0.15, 'triangle', 0.25);
    playNote(1319, 0.2, 0.15, 'triangle', 0.25);
    playNote(1568, 0.3, 0.3, 'triangle', 0.25);
    rbs.flyers.push({ kind: 'secret', x0: rbsSX(sc.u), y0: g.y, t: 0, dur: 0.7 });
  }
}
function rbsUpdateFlyers(dt) {
  var i, f;
  for (i = rbs.flyers.length - 1; i >= 0; i--) {
    f = rbs.flyers[i];
    f.t += dt;
    if (f.t >= f.dur) {
      if (f.kind === 'star') rbs.hudBump = 0.35;
      else if (f.kind === 'pearl') rbs.pearlBump[f.idx] = 0.45;
      rbs.flyers.splice(i, 1);
    }
  }
  for (i = 0; i < 7; i++) if (rbs.pearlBump[i] > 0) rbs.pearlBump[i] -= dt;
}
function rbsUpdateFx(dt) {
  var i, L, f, sp = rbs.r.spd * (rbs.r.boostT > 0 ? 1.4 : 1), p = rbsProg(), fog;
  for (i = 0; i < rbs.lines.length; i++) {
    L = rbs.lines[i];
    L.x -= dt * sp * L.sp * 2.2 * rbsUW() / viewW;
    if (L.x < -0.3) { L.x = 1 + Math.random() * 0.3; L.y = rbsRnd(0.12, 0.92); L.len = rbsRnd(0.08, 0.2); }
  }
  fog = rbsKey(RBS_FOG, p);
  for (i = 0; i < rbs.fogs.length; i++) {
    f = rbs.fogs[i];
    f.x -= dt * sp * 1.5 * rbsUW() / viewW;
    if (f.x < -0.3) { f.x = 1.2 + Math.random() * 0.3; f.y = rbsRnd(0.2, 0.95); f.s = rbsRnd(0.07, 0.13); }
  }
  // Myrskyn sadepisarat
  if (rbsKey(RBS_STORM, p) > 0.3 && rbs.drops.length < 60 && Math.random() < dt * 40) {
    rbs.drops.push({ x: Math.random() * viewW * 1.2, y: -10, vy: viewH * rbsRnd(1.1, 1.5) });
  }
  for (i = rbs.drops.length - 1; i >= 0; i--) {
    rbs.drops[i].y += rbs.drops[i].vy * dt;
    rbs.drops[i].x -= viewH * 0.4 * dt;
    if (rbs.drops[i].y > viewH * 1.05) rbs.drops.splice(i, 1);
  }
  for (i = rbs.ripples.length - 1; i >= 0; i--) {
    rbs.ripples[i].t += dt;
    if (rbs.ripples[i].t > 1.2) rbs.ripples.splice(i, 1);
  }
  for (i = 0; i < rbs.obs.length; i++) if (rbs.obs[i].bump > 0) rbs.obs[i].bump -= dt;
}
function rbsStartFinish() {
  var r = rbs.r;
  rbs.state = 'finish';
  rbs.finT = 0;
  r.hopT = -1;
  r.tumbleT = 0;
  r.fallT = 0;
  r.vt = r.v;
  rbs.bonus = (rbs.pearlGot.indexOf(false) < 0 ? 1 : 0) + (rbs.secretFound ? 1 : 0);
  rbsWhoosh(0.22, 1.0, 1400, 300);
  playNote(1047, 0, 0.15, 'triangle', 0.3);
  playNote(1319, 0.1, 0.15, 'triangle', 0.3);
}
// Lampi: kelkka pulahtaa, kultapata suihkuttaa, kaikki hurraavat
function rbsUpdateFinish(dt) {
  var prev = rbs.finT, t, pp, i, pot = rbsPotProp();
  rbs.finT += dt;
  t = rbs.finT;
  if (prev < 0.8 && t >= 0.8) {
    pp = rbsPondXY();
    rbsSplash(pp.x + camX, pp.y);
    artShakeStart(viewH * 0.007, 0.35);
  }
  if (prev < 1.3 && t >= 1.3 && pot) rbsPotSpew(pot, 9);
  if (prev < 1.5 && t >= 1.5 && rbs.bonus > 0 && rbs.pearlGot.indexOf(false) < 0) {
    for (i = 0; i < 7; i++) playNote(523 * Math.pow(1.122, i), i * 0.09, 0.3, 'triangle', 0.22);
  }
  if (t > 1.0 && Math.random() < dt * 2) {
    pp = rbsPondXY();
    rbs.ripples.push({ x: pp.x + rbsRnd(-1, 1) * viewH * 0.05, y: pp.y + viewH * 0.01, t: 0 });
  }
  if (t >= RBS_FIN_T && !rbs.won) {
    rbs.won = true;
    startCelebration();
    if (rbs.bonus > 0) {
      starCoins += rbs.bonus;
      starGain.n += rbs.bonus;
      starGain.until = globalT + 3.2;
      saveProgress();
    }
  }
}
function rbsPotProp() {
  var i;
  for (i = 0; i < props.length; i++) if (props[i].layer === 1) return props[i];
  return null;
}
function rbsSplash(x, y) {
  var i;
  for (i = 0; i < 26; i++) {
    if (particles.length > 140) break;
    particles.push({ x: x + rbsRnd(-1, 1) * viewH * 0.04, y: y, vx: rbsRnd(-1, 1) * 160, vy: -rbsRnd(120, 320), life: 0.8 + Math.random() * 0.4, age: 0, size: 4 + Math.random() * 5, color: i % 3 ? '#9fd8ff' : '#ffffff' });
  }
  for (i = 0; i < 3; i++) rbs.ripples.push({ x: x - camX, y: y + viewH * 0.01, t: -i * 0.15 });
  artPop(x, y, viewH * 0.12, '#ffffff', 'ring');
  playNote(180, 0, 0.25, 'sine', 0.3);
  rbsWhoosh(0.25, 0.6, 1800, 400);
  playNote(1175, 0.2, 0.1, 'sine', 0.15);
  playNote(1568, 0.3, 0.12, 'sine', 0.15);
}
// Tuulen suhahdus: kaistanpäästösuodatettua kohinaa
function rbsWhoosh(vol, dur, f0, f1) {
  var i, d, src, bp, g, t0;
  if (!audioCtx || muted) return;
  try {
    if (!rbsNoise) {
      rbsNoise = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 1.2), audioCtx.sampleRate);
      d = rbsNoise.getChannelData(0);
      for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    t0 = audioCtx.currentTime;
    src = audioCtx.createBufferSource();
    src.buffer = rbsNoise;
    bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(f0, t0);
    bp.frequency.linearRampToValueAtTime(f1, t0 + dur);
    g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(masterGain);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  } catch (e) { /* vanha selain: ei suhahdusta */ }
}

// ---------- Paikat ruudulla ----------
function rbsRiderGeo() {
  var r = rbs.r, k = rbsK(r.v), x = rbsSX(r.u), base = rbsLaneY(r.u, r.v) + RBS_PITCH * viewH * 0.22, lift = 0, q, y, rs, pp;
  if (rbs.state === 'finish') {
    // Kaari tien päästä lammen keskelle
    pp = rbsPondXY();
    q = Math.min(1, rbs.finT / 0.8);
    x = rbsSX(rbs.uEnd) + (pp.x - viewH * 0.04 - rbsSX(rbs.uEnd)) * q;
    base = rbsLaneY(rbs.uEnd, r.v) + (pp.y + viewH * 0.03 - rbsLaneY(rbs.uEnd, r.v)) * q;
    lift = Math.sin(q * Math.PI) * viewH * 0.14;
    if (rbs.finT > 0.8) { lift = -Math.sin(rbs.finT * 2.2) * viewH * 0.006; base = pp.y + viewH * 0.035; }
    k = 1.08;
  }
  rs = trekUS() * RBS_RIDER_SC * k;
  y = base - lift;
  if (r.hopT >= 0) { lift = rbsHopFrac() * RBS_HOP_H * viewH; y = base - lift; }
  if (r.fallT > 0) {
    q = 1 - r.fallT / RBS_FALL_T;
    y = base + viewH * 0.09 * (q < 0.45 ? easeOutCubic(q / 0.45) : 1 - easeOutBack((q - 0.45) / 0.55));
  }
  return { x: x, base: base, y: y, k: k, rs: rs, lift: lift };
}
function rbsItemXY(u, lane, h) {
  return { x: rbsSX(u), y: rbsLaneY(u, lane) - viewH * 0.045 * rbsK(lane) - h * RBS_HOP_H * viewH };
}
function rbsSecretXY() {
  var sc = rbs.secret;
  return { x: rbsSX(sc.u), y: rbsLaneY(sc.u, -1.1) - viewH * 0.11 + Math.sin(globalT * 1.6 + sc.ph) * viewH * 0.008 };
}
function rbsPondXY() {
  var u = rbs.uEnd + RBS_POND_DU;
  return { x: rbsSX(u), y: rbsLaneY(rbs.uEnd, 3) + viewH * 0.01, rx: viewH * 0.42, ry: viewH * 0.18 };
}
// Pikkupilvi: vilkuttaa linnan portilla lähdössä ja lentää lammelle lopussa
function rbsPupPos() {
  var x, y, pp, k;
  if (rbs.state === 'finish') {
    pp = rbsPondXY();
    k = easeInOutSine(Math.min(1, rbs.finT / 2));
    return { x: pp.x - viewH * 0.2 + (1 - k) * viewW * -0.4, y: pp.y - viewH * 0.3 - (1 - k) * viewH * 0.3, r: viewH * 0.045 };
  }
  x = rbsSX(RBS_START_U - 0.1);
  if (x < -viewH * 0.1) return null;
  y = rbsLaneY(RBS_START_U - 0.1, 0) - viewH * 0.08 + Math.sin(globalT * 2) * viewH * 0.008;
  return { x: x, y: y, r: viewH * 0.048 };
}

// ---------- Esirenderöinti ----------
function rbsCanvas(cv, w, h) {
  var sc = Math.min(1, 4000 / Math.max(1, w));
  cv.width = Math.max(1, Math.round(w * sc));
  cv.height = Math.max(1, Math.round(h * sc));
  cv._sc = sc;
  var b = cv.getContext('2d');
  b.setTransform(sc, 0, 0, sc, 0, 0);
  return b;
}
function rbsPrepare() {
  var key = viewW + 'x' + viewH, tw = Math.round(viewW * 1.5);
  if (!viewW || !viewH || rbs.key === key) return;
  rbs.key = key;
  rbsRenderSea(rbsCanvas(rbsSeaCv, tw, viewH * 0.6), tw, viewH * 0.6);
  rbsRenderStorm(rbsCanvas(rbsStormCv, tw, viewH * 0.55), tw, viewH * 0.55);
  rbsRenderLand(rbsCanvas(rbsLandCv, tw, viewH * 0.8), tw, viewH * 0.8);
  rbsRenderHills(rbsCanvas(rbsHillCv, tw, viewH * 0.6), tw, viewH * 0.6);
  rbsRenderCastle(rbsCanvas(rbsCastleCv, viewH * 0.74, viewH * 0.7), viewH * 0.74, viewH * 0.7);
}
// Pilvimeri: pallerot ylä- ja alareunassa, saumaton vaakasuunnassa
function rbsSeaPath(b, w, h, grow) {
  var n = 12, i, x, r, y;
  b.beginPath();
  b.rect(0, h * 0.2 - grow, w, h * 0.6 + grow * 2);
  for (i = 0; i <= n; i++) {
    x = i * w / n;
    r = h * (0.1 + 0.05 * rbsHash(i % n)) + grow; y = h * (0.21 + 0.03 * rbsHash(i % n + 7));
    b.moveTo(x + r, y); b.arc(x, y, r, 0, Math.PI * 2);
    r = h * (0.07 + 0.04 * rbsHash(i % n + 3)) + grow; y = h * 0.2;
    b.moveTo(x + w / n * 0.5 + r, y); b.arc(x + w / n * 0.5, y, r, 0, Math.PI * 2);
    r = h * (0.08 + 0.04 * rbsHash(i % n + 11)) + grow; y = h * 0.8;
    b.moveTo(x + r, y); b.arc(x, y, r, 0, Math.PI * 2);
    r = h * (0.06 + 0.03 * rbsHash(i % n + 5)) + grow;
    b.moveTo(x + w / n * 0.5 + r, y + h * 0.02); b.arc(x + w / n * 0.5, y + h * 0.02, r, 0, Math.PI * 2);
  }
}
function rbsRenderSea(b, w, h) {
  var g, i, x, y;
  b.clearRect(0, 0, w, h);
  b.fillStyle = '#c3b3e6';
  rbsSeaPath(b, w, h, Math.max(1.5, h * 0.006));
  b.fill();
  g = b.createLinearGradient(0, h * 0.08, 0, h * 0.92);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#fbf2ff');
  g.addColorStop(1, '#ddd0f2');
  b.fillStyle = g;
  rbsSeaPath(b, w, h, 0);
  b.fill();
  // Auringonlaskun punerrus ja pehmeät sisäpallerot
  b.fillStyle = 'rgba(255,190,220,0.3)';
  for (i = 0; i < 12; i++) {
    x = i * w / 12 + w / 24;
    b.beginPath(); b.arc(x, h * 0.17, h * 0.05, 0, Math.PI * 2); b.fill();
  }
  b.fillStyle = 'rgba(255,255,255,0.5)';
  for (i = 0; i < 18; i++) {
    x = i * w / 18 + rbsHash(i + 40) * w / 18;
    y = h * (0.32 + 0.4 * rbsHash(i + 20));
    b.beginPath(); b.arc(x, y, h * (0.03 + 0.03 * rbsHash(i + 60)), 0, Math.PI * 2); b.fill();
  }
}
// Myrskykatto: tumma pilvivyö, alareunassa pallerot
function rbsRenderStorm(b, w, h) {
  var n = 10, i, x, r, y, g, pass;
  b.clearRect(0, 0, w, h);
  for (pass = 0; pass < 2; pass++) {
    b.beginPath();
    b.rect(0, 0, w, h * 0.72 + (pass ? 0 : 2));
    for (i = 0; i <= n; i++) {
      x = i * w / n;
      r = h * (0.12 + 0.06 * rbsHash(i % n + 2)) + (pass ? 0 : 2); y = h * 0.74;
      b.moveTo(x + r, y); b.arc(x, y, r, 0, Math.PI * 2);
      r = h * (0.09 + 0.04 * rbsHash(i % n + 9)) + (pass ? 0 : 2);
      b.moveTo(x + w / n * 0.5 + r, y + h * 0.04); b.arc(x + w / n * 0.5, y + h * 0.04, r, 0, Math.PI * 2);
    }
    if (pass === 0) { b.fillStyle = '#2e2850'; b.fill(); }
    else {
      g = b.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4a4478');
      g.addColorStop(0.7, '#6c6498');
      g.addColorStop(1, '#5a5288');
      b.fillStyle = g;
      b.fill();
    }
  }
  b.fillStyle = 'rgba(150,140,200,0.18)';
  for (i = 0; i < 14; i++) {
    x = i * w / 14 + rbsHash(i + 70) * w / 14;
    y = h * (0.35 + 0.3 * rbsHash(i + 80));
    b.beginPath(); b.arc(x, y, h * (0.08 + 0.05 * rbsHash(i + 90)), Math.PI, Math.PI * 2); b.fill();
  }
  b.fillStyle = 'rgba(180,170,230,0.35)';
  for (i = 0; i < 10; i++) {
    x = i * w / 10 + w / 20;
    b.beginPath(); b.arc(x, h * 0.84, h * 0.04, Math.PI * 0.1, Math.PI * 0.9); b.fill();
  }
}
// Kaukamaan maat ylhäältä: kumpuileva reuna, peltotilkut, joki, puut ja talot
function rbsLandTop(x, w, h) {
  var a = x / w * Math.PI * 2;
  return h * (0.09 + 0.045 * Math.sin(a * 3 + 0.5) + 0.025 * Math.sin(a * 7 + 1.3));
}
function rbsRenderLand(b, w, h) {
  var x, y, i, j, g, cols, pw, ph, y0, col, rows = 7, hz = '#d8efff', top;
  var pal = ['#9fd47c', '#b8e08a', '#e8d878', '#8cc86a', '#c8e6a0', '#f2c6dc', '#a6dc94', '#d6ea8c'];
  b.clearRect(0, 0, w, h);
  // Kaukaiset sinertävät vuoret reunalla
  b.beginPath();
  b.moveTo(0, h);
  for (x = 0; x <= w; x += 8) b.lineTo(x, rbsLandTop(x, w, h) - h * (0.05 + 0.04 * Math.abs(Math.sin(x / w * Math.PI * 8))));
  b.lineTo(w, h); b.closePath();
  b.fillStyle = artMix('#9ab8d8', hz, 0.4);
  b.fill();
  b.beginPath();
  b.moveTo(0, h);
  for (x = 0; x <= w; x += 8) b.lineTo(x, rbsLandTop(x, w, h));
  b.lineTo(w, h); b.closePath();
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, artMix('#a8dc8c', hz, 0.45));
  g.addColorStop(0.5, '#9cd47e');
  g.addColorStop(1, '#79c264');
  b.fillStyle = g;
  b.fill();
  // Peltotilkut (perspektiivi: rivit kasvavat alaspäin)
  for (j = 0; j < rows; j++) {
    y0 = h * (0.2 + 0.8 * Math.pow(j / rows, 1.3));
    ph = h * 0.8 * (Math.pow((j + 1) / rows, 1.3) - Math.pow(j / rows, 1.3)) * 0.82;
    cols = 14 - j;
    pw = w / cols;
    for (i = 0; i < cols; i++) {
      col = pal[Math.floor(rbsHash(i * 13 + j * 7) * pal.length)];
      x = i * pw + (j % 2) * pw * 0.5;
      b.fillStyle = artMix(col, hz, 0.35 * (1 - j / rows));
      roundRect(b, x + pw * 0.06, y0, pw * 0.88, ph, Math.min(pw, ph) * 0.25);
      b.fill();
      if (x + pw > w) { roundRect(b, x - w + pw * 0.06, y0, pw * 0.88, ph, Math.min(pw, ph) * 0.25); b.fill(); }
      // Kukkapellon rivit
      if (rbsHash(i * 5 + j) > 0.7) {
        b.strokeStyle = 'rgba(255,255,255,0.35)';
        b.lineWidth = Math.max(1, ph * 0.08);
        b.beginPath();
        b.moveTo(x + pw * 0.15, y0 + ph * 0.35); b.lineTo(x + pw * 0.85, y0 + ph * 0.35);
        b.moveTo(x + pw * 0.15, y0 + ph * 0.7); b.lineTo(x + pw * 0.85, y0 + ph * 0.7);
        b.stroke();
      }
    }
  }
  // Mutkitteleva joki
  b.lineCap = 'round';
  b.lineJoin = 'round';
  for (i = 0; i < 2; i++) {
    b.strokeStyle = i ? '#a8dcfa' : '#6cb4e4';
    b.lineWidth = h * (i ? 0.018 : 0.03);
    b.beginPath();
    for (x = 0; x <= w; x += 8) {
      y = h * (0.5 + 0.16 * Math.sin(x / w * Math.PI * 4 + 0.7));
      if (x === 0) b.moveTo(x, y); else b.lineTo(x, y);
    }
    b.stroke();
  }
  // Puuryhmät ja talot
  for (i = 0; i < 36; i++) {
    x = rbsHash(i + 300) * w;
    y = h * (0.22 + 0.7 * rbsHash(i + 400));
    top = h * (0.012 + 0.02 * (y / h));
    if (i % 6 === 0) {
      b.fillStyle = '#fff4e0';
      b.fillRect(x - top, y - top, top * 2, top * 1.4);
      b.fillStyle = '#e8706a';
      b.beginPath(); b.moveTo(x - top * 1.3, y - top); b.lineTo(x, y - top * 2.1); b.lineTo(x + top * 1.3, y - top); b.closePath(); b.fill();
    } else {
      b.fillStyle = artMix('#4f9a4a', hz, 0.25 * (1 - y / h));
      b.beginPath(); b.arc(x, y, top, 0, Math.PI * 2); b.arc(x + top * 1.2, y + top * 0.3, top * 0.8, 0, Math.PI * 2); b.fill();
    }
  }
}
// Lähemmät kukkulat puineen (loppuosuus)
function rbsRenderHills(b, w, h) {
  var x, i, g, ridge, n;
  b.clearRect(0, 0, w, h);
  ridge = function (px) { var a = px / w * Math.PI * 2; return h * (0.16 + 0.07 * Math.sin(a * 2 + 0.3) + 0.04 * Math.sin(a * 5 + 2)); };
  b.beginPath();
  b.moveTo(0, h);
  for (x = 0; x <= w; x += 8) b.lineTo(x, ridge(x));
  b.lineTo(w, h); b.closePath();
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#8fd27a');
  g.addColorStop(1, '#5fb052');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.4)';
  b.lineWidth = Math.max(1.5, h * 0.008);
  b.beginPath();
  for (x = 0; x <= w; x += 8) { if (x === 0) b.moveTo(x, ridge(x) + 2); else b.lineTo(x, ridge(x) + 2); }
  b.stroke();
  n = 16;
  for (i = 0; i < n; i++) {
    x = (i + 0.5) * w / n + (rbsHash(i + 500) - 0.5) * w / n * 0.6;
    drawTree(b, x, ridge(x) + h * 0.04 + rbsHash(i + 520) * h * 0.06, h * (0.07 + 0.04 * rbsHash(i + 510)), 0.15);
  }
  for (i = 0; i < 40; i++) {
    x = rbsHash(i + 600) * w;
    drawFlower(b, x, ridge(x) + h * (0.12 + 0.6 * rbsHash(i + 610)), h * 0.008, RAINBOW_COLORS[i % 7]);
  }
}
// Pilvilinna: pilvijalusta, muurit, kolme tornia; portti oikealla (sateenkaari lähtee)
function rbsRenderCastle(b, w, h) {
  var H = viewH, cx = w * 0.5, base = h, lw = Math.max(1.2, H * 0.004), i, tw, tx, top, tip, roofW, x;
  var towers = [[-0.16, 0.32, 0.052, '#ff9fc8'], [0.0, 0.47, 0.065, '#c88ae8'], [0.15, 0.36, 0.05, '#8fb8ff']];
  b.clearRect(0, 0, w, h);
  rbsCastleTops = [];
  // Muuri
  b.beginPath();
  b.rect(cx - H * 0.2, base - H * 0.3, H * 0.4, H * 0.2);
  artFillPath(b, '#f6f0ff', base - H * 0.3, base - H * 0.1, H * 0.1, { lineColor: '#9c8bd0', line: lw, shadeTo: '#d8ccf2' });
  for (x = -0.2; x <= 0.201; x += 0.05) artCircle(b, cx + x * H, base - H * 0.3, H * 0.022, '#ffffff', { lineColor: '#9c8bd0', line: lw, shadeTo: '#e6dcf8' });
  // Tornit
  for (i = 0; i < towers.length; i++) {
    tx = cx + towers[i][0] * H; top = base - H * towers[i][1]; tw = H * towers[i][2];
    b.beginPath(); b.rect(tx - tw, top, tw * 2, base - H * 0.1 - top);
    artFillPath(b, '#ffffff', top, base - H * 0.1, tw, { lineColor: '#9c8bd0', line: lw, shadeTo: '#ddd2f4' });
    artHighlight(b, tx - tw * 0.5, top + H * 0.05, tw * 0.22, H * 0.04, 0.45);
    // Ikkuna lämpimällä valolla
    b.fillStyle = '#7a5ab0';
    roundRect(b, tx - tw * 0.32, top + H * 0.06, tw * 0.64, H * 0.06, tw * 0.3); b.fill();
    b.fillStyle = '#ffe9a8';
    roundRect(b, tx - tw * 0.2, top + H * 0.07, tw * 0.4, H * 0.04, tw * 0.2); b.fill();
    // Kartiokatto
    roofW = tw * 1.35; tip = top - H * 0.13;
    b.beginPath();
    b.moveTo(tx - roofW, top);
    b.quadraticCurveTo(tx - roofW * 0.3, top - (top - tip) * 0.45, tx, tip);
    b.quadraticCurveTo(tx + roofW * 0.3, top - (top - tip) * 0.45, tx + roofW, top);
    b.closePath();
    artFillPath(b, towers[i][3], tip, top, roofW, { lineColor: artShade(towers[i][3], -0.4), line: lw });
    for (x = -1; x <= 1.01; x += 0.5) artCircle(b, tx + x * roofW, top, H * 0.014, '#ffffff', { lineColor: '#9c8bd0', line: lw * 0.8 });
    b.strokeStyle = '#8a74c4'; b.lineWidth = Math.max(1.5, H * 0.004); b.lineCap = 'round';
    b.beginPath(); b.moveTo(tx, tip); b.lineTo(tx, tip - H * 0.05); b.stroke();
    artCircle(b, tx, tip - H * 0.05, H * 0.007, '#ffd24f', { lineColor: '#c8901e' });
    rbsCastleTops.push({ x: (tx - cx) / H, y: (tip - H * 0.05 - base) / H });
  }
  // Portti oikealla: tästä sateenkaari alkaa
  x = cx + H * 0.15;
  b.beginPath();
  b.moveTo(x - H * 0.05, base - H * 0.1);
  b.lineTo(x - H * 0.05, base - H * 0.2);
  b.arc(x, base - H * 0.2, H * 0.05, Math.PI, 0);
  b.lineTo(x + H * 0.05, base - H * 0.1);
  b.closePath();
  artFillPath(b, '#a98ad8', base - H * 0.25, base - H * 0.1, H * 0.05, { lineColor: '#7a62b0', line: lw });
  // Pilvijalusta
  b.fillStyle = '#b8aadf';
  for (i = 0; i < 9; i++) { b.beginPath(); b.arc(cx + (i - 4) * H * 0.058, base - H * 0.07 + (i % 2) * H * 0.02, H * (0.06 + (i % 3) * 0.008) + lw, 0, Math.PI * 2); b.fill(); }
  for (i = 0; i < 9; i++) artCircle(b, cx + (i - 4) * H * 0.058, base - H * 0.07 + (i % 2) * H * 0.02, H * (0.06 + (i % 3) * 0.008), '#ffffff', { line: false, shadeTo: '#e2d8f6' });
  b.fillStyle = 'rgba(255,200,225,0.35)';
  for (i = 0; i < 9; i++) { b.beginPath(); b.arc(cx + (i - 4) * H * 0.058 - H * 0.015, base - H * 0.1 + (i % 2) * H * 0.02, H * 0.025, 0, Math.PI * 2); b.fill(); }
}
function rbsBlit(c, cv, off, y) {
  var tw, x;
  if (!cv.width) return;
  tw = cv.width / cv._sc;
  x = -(((off % tw) + tw) % tw) - tw;
  while (x < viewW * 1.1) {
    if (x + tw > -viewW * 0.1) c.drawImage(cv, x, y, tw, cv.height / cv._sc);
    x += tw;
  }
}

// ---------- Piirto ----------
function rbsBegin() {
  if (!viewW || !viewH) return false;
  ctx.clearRect(0, 0, viewW, viewH);
  var sh = artShakeOffset();
  ctx.save();
  ctx.translate(sh.x, sh.y);
  return true;
}
function drawRbslide() {
  var c = ctx, g, p;
  if (!rbsBegin()) return;
  if (!rbs.built) { ctx.restore(); return; }
  rbsPrepare();
  p = rbsProg();
  g = rbsRiderGeo();
  c.save();
  c.translate(g.x, g.base);
  c.rotate(rbs.tilt);
  c.translate(-g.x, -g.base);
  rbsDrawBack(c, p);
  propsDraw(c, 0);
  rbsDrawFinishBack(c);
  rbsDrawGates(c, false);
  rbsDrawRoad(c);
  rbsDrawBoltBands(c);
  rbsDrawBand(c);
  rbsDrawGates(c, true);
  rbsDrawRoadStart(c);
  rbsDrawBoltClouds(c);
  propsDraw(c, 1);
  rbsDrawFinishFront(c);
  rbsDrawFront(c, p);
  drawParticlesLayer(c);
  c.restore();
  rbsDrawLines(c);
  rbsDrawHint(c);
  endPlayWorld();
  rbsDrawHud(c);
  rbsDrawCount(c);
}
// Taivas, aurinko ja matkan kerrokset
function rbsDrawBack(c, p) {
  var W = viewW, H = viewH, g, storm = rbsKey(RBS_STORM, p), sx, sy, sr, y, i, x, fog;
  g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rbsKeyCol(RBS_SKY_TOP, p));
  g.addColorStop(0.8, rbsKeyCol(RBS_SKY_BOT, p));
  g.addColorStop(1, rbsKeyCol(RBS_SKY_BOT, p));
  c.fillStyle = g;
  c.fillRect(-W * 0.1, -H * 0.15, W * 1.2, H * 1.3);
  // Aurinko: auringonlasku ylhäällä, keltainen päivä alhaalla
  sx = W * 0.8; sy = H * rbsKey(RBS_SUN_Y, p); sr = H * 0.065;
  bgSun = storm < 0.5 ? { x: sx, y: sy, r: sr, speed: 0 } : null;
  if (storm < 1) {
    c.globalAlpha = 1 - storm;
    artGlow(c, sx, sy, sr * 3.4, p < 0.4 ? '#ffc8a0' : '#fff2b8', 0.55);
    artCircle(c, sx, sy, sr, p < 0.4 ? artMix('#ffb070', '#ffd45a', p / 0.4) : '#ffd84a', { line: false, hi: 0.3 });
    c.globalAlpha = 1;
  }
  // Kaukaiset pilvenhattarat
  for (i = 0; i < 6; i++) {
    x = ((i * 0.23 + 0.1) * W - camX * 0.04) % (W * 1.3);
    if (x < -W * 0.15) x += W * 1.3;
    drawCloud(c, x, H * (0.08 + (i % 3) * 0.06), H * (0.018 + (i % 2) * 0.008), 0.5 * (1 - storm));
  }
  // Kaukamaan maat ja lähemmät kukkulat nousevat alhaalta
  y = rbsKey(RBS_LAND_TOP, p) * H;
  if (y < H * 1.1) rbsBlit(c, rbsLandCv, camX * 0.05, y);
  y = rbsKey(RBS_HILL_TOP, p) * H;
  if (y < H * 1.1) rbsBlit(c, rbsHillCv, camX * 0.16, y);
  // Pilvimeri
  y = rbsKey(RBS_SEA_TOP, p) * H - viewH * 0.6 * 0.12;
  if (y < H * 1.1 && y > -H * 0.7) rbsBlit(c, rbsSeaCv, camX * 0.12, y);
  // Keskipilvet
  for (i = 0; i < 4; i++) {
    x = ((i * 0.33 + 0.05) * W * 1.4 - camX * 0.3) % (W * 1.4);
    if (x < -W * 0.2) x += W * 1.4;
    y = H * (0.18 + (i % 2) * 0.12) + ((p * 7 + i * 0.37) % 1) * -H * 0.1;
    drawCloud(c, x, y, H * (0.035 + (i % 3) * 0.01), (1 - storm * 0.7) * 0.85);
  }
  // Kaukaiset kuumailmapallot ja lintuparvet (lintuosuus)
  if (p > 0.5 && p < 0.92) rbsDrawFarDecor(c, Math.min(1, (p - 0.5) / 0.05, (0.92 - p) / 0.05));
  // Myrsky: tummuus ja katto
  if (storm > 0) {
    c.fillStyle = 'rgba(40,30,80,' + (0.3 * storm) + ')';
    c.fillRect(-W * 0.1, -H * 0.15, W * 1.2, H * 1.3);
    if (Math.sin(globalT * 1.7) > 0.985) {
      c.fillStyle = 'rgba(255,255,240,' + (0.25 * storm) + ')';
      c.fillRect(-W * 0.1, -H * 0.15, W * 1.2, H * 1.3);
    }
  }
  y = rbsKey(RBS_STORM_Y, p) * H;
  if (y > -H * 0.05) rbsBlit(c, rbsStormCv, camX * 0.2, y - viewH * 0.55 * 0.8);
  fog = rbsKey(RBS_FOG, p);
  if (fog > 0) {
    c.fillStyle = 'rgba(255,250,255,' + (fog * 0.45) + ')';
    c.fillRect(-W * 0.1, -H * 0.15, W * 1.2, H * 1.3);
  }
}
function rbsDrawFarDecor(c, a) {
  var i, x, y, W = viewW, H = viewH, s, j;
  c.globalAlpha = a * 0.85;
  for (i = 0; i < 3; i++) {
    x = ((i * 0.41 + 0.2) * W * 1.5 - camX * 0.1) % (W * 1.5);
    if (x < -W * 0.2) x += W * 1.5;
    y = H * (0.15 + i * 0.07) + Math.sin(globalT * 0.7 + i) * H * 0.01;
    s = H * (0.025 - i * 0.004);
    artBlob(c, x, y, s * 0.8, s, RAINBOW_COLORS[(i * 3 + 1) % 7], { line: false, hi: 0.3 });
    c.fillStyle = '#b08a5a';
    c.fillRect(x - s * 0.25, y + s * 1.25, s * 0.5, s * 0.35);
  }
  c.strokeStyle = 'rgba(70,60,110,0.55)';
  c.lineWidth = Math.max(1, H * 0.002);
  c.lineCap = 'round';
  for (i = 0; i < 2; i++) {
    x = ((i * 0.55 + 0.4) * W * 1.6 - camX * 0.18) % (W * 1.6);
    if (x < -W * 0.2) x += W * 1.6;
    for (j = 0; j < 4; j++) {
      var bx = x + j * H * 0.025, by = H * (0.3 + i * 0.08) + Math.abs(j - 1.5) * H * 0.012, f = Math.sin(globalT * 8 + j) * H * 0.004;
      c.beginPath(); c.moveTo(bx - H * 0.008, by - f); c.quadraticCurveTo(bx - H * 0.003, by - H * 0.006, bx, by); c.quadraticCurveTo(bx + H * 0.003, by - H * 0.006, bx + H * 0.008, by - f); c.stroke();
    }
  }
  c.globalAlpha = 1;
}
// Nauhan ehjät pätkät raidalla L väliltä a..b (aukot pois)
function rbsSolid(L, a, b) {
  var segs = rbsSegs, cuts = rbsCuts, i, g, x = a;
  segs.length = 0;
  cuts.length = 0;
  for (i = 0; i < rbs.gaps.length; i++) {
    g = rbs.gaps[i];
    if (L >= g.l0 && L <= g.l1 && g.u1 > a && g.u0 < b) cuts.push(g);
  }
  cuts.sort(function (p, q) { return p.u0 - q.u0; });
  for (i = 0; i < cuts.length; i++) {
    if (cuts[i].u0 > x) segs.push(x, cuts[i].u0);
    x = Math.max(x, cuts[i].u1);
  }
  if (x < b) segs.push(x, b);
  return segs;
}
function rbsStripePath(c, L, a, b, off0, off1) {
  var n = Math.max(1, Math.ceil((b - a) * rbsUW() / 14)), i, u, P = RBS_PITCH * viewH;
  c.beginPath();
  for (i = 0; i <= n; i++) {
    u = a + (b - a) * i / n;
    if (i === 0) c.moveTo(rbsSX(u), rbsLaneY(u, L) + off0 * P);
    else c.lineTo(rbsSX(u), rbsLaneY(u, L) + off0 * P);
  }
  for (i = n; i >= 0; i--) {
    u = a + (b - a) * i / n;
    c.lineTo(rbsSX(u), rbsLaneY(u, L) + off1 * P);
  }
  c.closePath();
}
function rbsDrawRoad(c) {
  var a = Math.max(RBS_GATE_U, rbs.camU - 0.12), b = Math.min(rbs.uEnd, rbs.camU + rbsSW() + 0.12), L, segs, i, P = RBS_PITCH * viewH, u, x, y, m, g, e, j, k, tw;
  if (b <= a) return;
  // Hehku kaukaisen reunan yllä
  rbsStripePath(c, 0, a, b, -0.9, -0.5);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.fill();
  // Alapinta (nauhan paksuus) violetin raidan alla
  segs = rbsSolid(6, a, b);
  for (i = 0; i < segs.length; i += 2) {
    rbsStripePath(c, 6, segs[i], segs[i + 1], 0.5, 1.05);
    c.fillStyle = '#9a6cc8';
    c.fill();
    rbsStripePath(c, 6, segs[i], segs[i + 1], 1.0, 1.25);
    c.fillStyle = 'rgba(120,80,170,0.35)';
    c.fill();
  }
  // Raidat
  for (L = 0; L < 7; L++) {
    segs = rbsSolid(L, a, b);
    c.fillStyle = RAINBOW_COLORS[L];
    for (i = 0; i < segs.length; i += 2) {
      rbsStripePath(c, L, segs[i], segs[i + 1], -0.5, 0.52);
      c.fill();
    }
  }
  // Kiilto ja vauhtiviivat raitojen pinnalla
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = Math.max(1, P * 0.08);
  c.lineCap = 'round';
  c.beginPath();
  for (L = 0; L < 7; L++) {
    segs = rbsSolid(L, a, b);
    for (i = 0; i < segs.length; i += 2) {
      k = Math.max(1, Math.ceil((segs[i + 1] - segs[i]) * rbsUW() / 20));
      for (j = 0; j <= k; j++) {
        u = segs[i] + (segs[i + 1] - segs[i]) * j / k;
        y = rbsLaneY(u, L) - P * 0.36;
        if (j === 0) c.moveTo(rbsSX(u), y); else c.lineTo(rbsSX(u), y);
      }
    }
  }
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = Math.max(1.5, P * 0.12);
  c.beginPath();
  for (L = 0; L < 7; L++) {
    for (m = Math.floor(a / 0.45); m * 0.45 < b; m++) {
      u = m * 0.45 + L * 0.13 + (L % 2) * 0.2;
      if (u < a || u + 0.07 > b || rbsInGap(u, L) || rbsInGap(u + 0.07, L)) continue;
      x = rbsSX(u);
      c.moveTo(x, rbsLaneY(u, L));
      c.lineTo(rbsSX(u + 0.07), rbsLaneY(u + 0.07, L));
    }
  }
  c.stroke();
  // Vauhtinuolet ja pilvilätäköt
  for (i = 0; i < rbs.pads.length; i++) {
    g = rbs.pads[i];
    if (g.u + g.len < a || g.u > b) continue;
    rbsDrawPad(c, g);
  }
  // Aukkojen kimaltavat reunat
  for (i = 0; i < rbs.gaps.length; i++) {
    g = rbs.gaps[i];
    if (g.u1 < a - 0.05 || g.u0 > b + 0.05) continue;
    // Reiän syvyys: hämärä täyte ja nauhan leikkauspinta etureunassa
    rbsStripePath(c, g.l0, g.u0, g.u1, -0.5, (g.l1 - g.l0) + 0.5);
    c.fillStyle = 'rgba(70,50,140,0.22)';
    c.fill();
    x = rbsSX(g.u1);
    for (L = g.l0; L <= g.l1; L++) {
      y = rbsLaneY(g.u1, L);
      c.fillStyle = artShade(RAINBOW_COLORS[L], -0.3);
      c.fillRect(x - P * 0.02, y - P * 0.5, P * 0.32, P * 1.02);
    }
    tw = 0.6 + 0.4 * Math.sin(globalT * 6 + g.u0 * 9);
    for (e = 0; e < 2; e++) {
      u = e ? g.u1 : g.u0;
      x = rbsSX(u);
      c.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.35 * tw) + ')';
      c.lineWidth = Math.max(2, P * 0.16);
      c.beginPath();
      c.moveTo(x, rbsLaneY(u, g.l0) - P * 0.5);
      c.lineTo(x, rbsLaneY(u, g.l1) + P * 0.5);
      c.stroke();
      for (L = g.l0; L <= g.l1; L++) rbsTwinkle(c, x + (e ? 1 : -1) * P * 0.15, rbsLaneY(u, L) + Math.sin(globalT * 5 + L) * P * 0.2, P * (0.22 + 0.1 * Math.sin(globalT * 8 + L * 2 + e)), '#fffbe0');
    }
    // Reiästä putoilee kimalletta
    for (j = 0; j < 3; j++) {
      k = (globalT * 0.9 + j * 0.33 + g.u0) % 1;
      u = g.u0 + (g.u1 - g.u0) * ((j * 0.37 + 0.2) % 1);
      rbsTwinkle(c, rbsSX(u), rbsLaneY(u, (g.l0 + g.l1) / 2) + k * viewH * 0.12, P * 0.14 * (1 - k), '#ffffff');
    }
  }
  // Tien loppu: nauha sukeltaa lammen kimalteeseen
  if (b >= rbs.uEnd - 0.01) {
    x = rbsSX(rbs.uEnd);
    for (L = 0; L < 7; L += 2) rbsTwinkle(c, x + Math.sin(globalT * 3 + L) * P * 0.3, rbsLaneY(rbs.uEnd, L), P * 0.3, '#ffffff');
  }
}
function rbsInGap(u, L) {
  var i, g;
  for (i = 0; i < rbs.gaps.length; i++) {
    g = rbs.gaps[i];
    if (L >= g.l0 && L <= g.l1 && u > g.u0 - 0.01 && u < g.u1 + 0.01) return true;
  }
  return false;
}
function rbsTwinkle(c, x, y, s, col) {
  if (s <= 0.3) return;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y - s);
  c.quadraticCurveTo(x, y, x + s, y);
  c.quadraticCurveTo(x, y, x, y + s);
  c.quadraticCurveTo(x, y, x - s, y);
  c.quadraticCurveTo(x, y, x, y - s);
  c.fill();
}
function rbsDrawPad(c, g) {
  var P = RBS_PITCH * viewH, i, u, x, y, k, a;
  if (g.type === 'boost') {
    // Kolme kultaista nuolta, vilkkuvat vuorotellen
    for (i = 0; i < 3; i++) {
      u = g.u + g.len * (0.2 + i * 0.3);
      x = rbsSX(u); y = rbsLaneY(u, g.lane);
      a = g.used ? 0.35 : 0.65 + 0.35 * Math.sin(globalT * 10 - i * 1.5);
      c.globalAlpha = a;
      c.beginPath();
      c.moveTo(x - P * 0.35, y - P * 0.34);
      c.lineTo(x + P * 0.25, y);
      c.lineTo(x - P * 0.35, y + P * 0.34);
      c.lineTo(x - P * 0.12, y);
      c.closePath();
      artFillPath(c, '#ffd24f', y - P * 0.34, y + P * 0.34, P * 0.3, { lineColor: '#c8801e', line: Math.max(1, P * 0.06) });
    }
    c.globalAlpha = 1;
  } else {
    // Pilvilätäkkö: harmaa, kuplii
    u = g.u + g.len * 0.5;
    x = rbsSX(u); y = rbsLaneY(u, g.lane);
    k = (g.len * rbsUW()) * 0.5;
    artBlob(c, x, y, k, P * 0.4, '#c9c3e6', { lineColor: '#7e76a8', line: Math.max(1, P * 0.05) });
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1, P * 0.05);
    a = (globalT * 0.7) % 1;
    c.beginPath(); c.ellipse(x, y, k * (0.3 + a * 0.6), P * 0.4 * (0.3 + a * 0.6), 0, 0, Math.PI * 2); c.stroke();
    for (i = 0; i < 3; i++) {
      a = (globalT * 0.8 + i * 0.33) % 1;
      c.globalAlpha = 1 - a;
      artCircle(c, x + (i - 1) * k * 0.5, y - a * P * 0.5, P * 0.08, '#e6e2f4', { line: false });
    }
    c.globalAlpha = 1;
  }
}
// Salaman varoitusraidat: keltainen hehku lukituilla raidoilla, iskun valkoinen välähdys
function rbsDrawBoltBands(c) {
  var i, b, L, a, k, segs, j;
  for (i = 0; i < rbs.bolts.length; i++) {
    b = rbs.bolts[i];
    if (b.state !== 'warn' && b.state !== 'strike') continue;
    if (b.state === 'warn') {
      k = Math.min(1, b.t / Math.max(0.1, b.tel));
      a = 0.5 + 0.25 * k + 0.2 * Math.sin(globalT * (14 + k * 16));
      c.fillStyle = 'rgba(255,240,110,' + a.toFixed(2) + ')';
    } else {
      a = Math.max(0, 1 - b.t / RBS_BOLT_SHOW);
      c.fillStyle = 'rgba(255,255,235,' + (0.85 * a).toFixed(2) + ')';
    }
    for (L = b.l0; L <= b.l1; L++) {
      segs = rbsSolid(L, b.u - RBS_BOLT_LEN, b.u + RBS_BOLT_LEN);
      for (j = 0; j < segs.length; j += 2) {
        rbsStripePath(c, L, segs[j], segs[j + 1], -0.5, 0.5);
        c.fill();
      }
    }
    if (b.state === 'warn') {
      // Siksak-reunat lukitun alueen ympärillä
      c.strokeStyle = 'rgba(255,255,255,0.95)';
      c.lineWidth = Math.max(2, viewH * 0.005);
      c.setLineDash([viewH * 0.014, viewH * 0.01]);
      c.lineDashOffset = -globalT * viewH * 0.1;
      rbsStripePath(c, b.l0, b.u - RBS_BOLT_LEN, b.u + RBS_BOLT_LEN, -0.5, (b.l1 - b.l0) + 0.5);
      c.stroke();
      c.setLineDash([]);
      c.lineDashOffset = 0;
      // Sähkökipinät pomppivat lukitulla alueella
      for (L = b.l0; L <= b.l1; L++) {
        for (j = 0; j < 2; j++) {
          a = (globalT * 3 + j * 0.5 + L * 0.3) % 1;
          rbsTwinkle(c, rbsSX(b.u + (j ? 0.06 : -0.06)), rbsLaneY(b.u, L) - a * viewH * 0.04, RBS_PITCH * viewH * 0.3 * (1 - a), '#ffffff');
        }
      }
    }
  }
}
// Salamapilvet nauhan yllä
function rbsDrawBoltClouds(c) {
  var i, b, x, y, S = viewH * 0.06, warn, n, j, y0, y1, xs, ly, w, a, pass;
  for (i = 0; i < rbs.bolts.length; i++) {
    b = rbs.bolts[i];
    if (b.state === 'done' && b.t > 1.5) continue;
    x = rbsSX(b.u);
    if (x < -S * 3 || x > viewW + S * 3) continue;
    warn = b.state === 'warn';
    y = rbsLaneY(b.u, 0) - viewH * 0.2 + Math.sin(globalT * 1.3 + b.ph) * viewH * 0.008;
    if (b.state === 'strike') {
      // Isku pilvestä raitojen keskelle
      ly = rbsLaneY(b.u, (b.l0 + b.l1) / 2);
      w = viewH * 0.03;
      a = 1 - b.t / RBS_BOLT_SHOW;
      for (pass = 0; pass < 3; pass++) {
        c.strokeStyle = pass === 0 ? 'rgba(255,240,150,' + (0.35 * a).toFixed(2) + ')' : pass === 1 ? 'rgba(255,214,80,' + a.toFixed(2) + ')' : 'rgba(255,255,245,' + a.toFixed(2) + ')';
        c.lineWidth = pass === 0 ? (b.l1 - b.l0 + 1) * RBS_PITCH * viewH : pass === 1 ? viewH * 0.016 : viewH * 0.006;
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath();
        n = b.pts.length - 1;
        for (j = 0; j <= n; j++) {
          y0 = y + S * 0.4 + (ly - y - S * 0.4) * j / n;
          if (j === 0) c.moveTo(x, y0); else c.lineTo(x + b.pts[j] * w, y0);
        }
        c.stroke();
      }
    }
    rbsStormFace(c, x + (warn ? Math.sin(globalT * 55) * S * 0.04 : 0), y, S, warn, b.state === 'strike', b.ph);
    if (warn) {
      c.strokeStyle = '#ffe27a';
      c.lineWidth = Math.max(1.5, S * 0.05);
      for (j = 0; j < 2; j++) {
        n = Math.floor(globalT * 10 + j * 3);
        xs = x + (rbsHash(n) - 0.5) * S * 2; y1 = y + S * 0.4 + rbsHash(n + 1) * S * 0.2;
        c.beginPath(); c.moveTo(xs, y1); c.lineTo(xs + S * 0.08, y1 + S * 0.14); c.lineTo(xs - S * 0.04, y1 + S * 0.16); c.lineTo(xs + S * 0.05, y1 + S * 0.3); c.stroke();
      }
    }
  }
}
function rbsStormFace(c, x, y, S, warn, bolt, ph) {
  var flick = warn && Math.floor(globalT * 14) % 2 === 0, col = bolt ? '#c8c4f0' : flick ? '#a29ed8' : '#7c78b4', i;
  rbsCloudBody(c, x, y, S, col, artShade(col, -0.28), '#3c3868');
  for (i = -1; i <= 1; i += 2) {
    artEye(c, x + i * S * 0.24, y - S * 0.05, S * 0.1, 0, !warn && ((globalT + ph) % 3.1) < 0.12);
    c.strokeStyle = '#2a2450';
    c.lineWidth = Math.max(1.2, S * 0.05);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + i * S * 0.38, y - S * 0.23); c.lineTo(x + i * S * 0.12, y - S * 0.16); c.stroke();
  }
  artBlush(c, x - S * 0.45, y + S * 0.12, S * 0.12);
  artBlush(c, x + S * 0.45, y + S * 0.12, S * 0.12);
  c.strokeStyle = '#2a2450';
  c.lineWidth = Math.max(1.2, S * 0.045);
  c.beginPath();
  if (warn) c.arc(x, y + S * 0.18, S * 0.07, 0, Math.PI * 2);
  else c.arc(x, y + S * 0.28, S * 0.1, Math.PI * 1.2, Math.PI * 1.8);
  c.stroke();
}
// Pilven muoto ääriviivalla (artUnion)
function rbsCloudPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x + s * 0.62, y); c.arc(x, y, s * 0.62, 0, Math.PI * 2);
  c.moveTo(x - s * 0.55 + s * 0.42, y + s * 0.15); c.arc(x - s * 0.55, y + s * 0.15, s * 0.42, 0, Math.PI * 2);
  c.moveTo(x + s * 0.58 + s * 0.44, y + s * 0.12); c.arc(x + s * 0.58, y + s * 0.12, s * 0.44, 0, Math.PI * 2);
  c.moveTo(x - s * 0.2 + s * 0.45, y - s * 0.35); c.arc(x - s * 0.2, y - s * 0.35, s * 0.45, 0, Math.PI * 2);
  c.moveTo(x + s * 0.28 + s * 0.4, y - s * 0.3); c.arc(x + s * 0.28, y - s * 0.3, s * 0.4, 0, Math.PI * 2);
}
function rbsCloudBody(c, x, y, s, col, shade, line) {
  artUnion(c, rbsCloudPath, x, y, s, y - s * 0.8, y + s * 0.6, col, { lineColor: line, shadeTo: shade });
  artHighlight(c, x - s * 0.3, y - s * 0.45, s * 0.22, s * 0.09, 0.4);
}
// Esineet ja ratsastaja syvyysjärjestyksessä (kaukainen raita ensin)
function rbsDrawBand(c) {
  var L = rbsList, i, o, x, a = rbs.camU - 0.2, b = rbs.camU + rbsSW() + 0.2, v;
  L.length = 0;
  for (i = 0; i < rbs.obs.length; i++) { o = rbs.obs[i]; if (o.u > a && o.u < b) L.push({ v: o.l1 + 0.05, k: 0, o: o }); }
  for (i = 0; i < rbs.movers.length; i++) {
    o = rbs.movers[i];
    if (o.u < a || o.u > b) continue;
    v = rbsMoverV(o);
    if (v < (o.type === 'bird' ? -2 : -0.6) || v > (o.type === 'bird' ? 8 : 6.6)) continue;
    L.push({ v: v + 0.02, k: 1, o: o, mv: v });
  }
  for (i = 0; i < rbs.stars.length; i++) { o = rbs.stars[i]; if (!o.got && o.u > a && o.u < b) L.push({ v: o.lane - 0.02, k: 2, o: o }); }
  for (i = 0; i < rbs.pearls.length; i++) { o = rbs.pearls[i]; if (!o.got && o.u > a && o.u < b) L.push({ v: o.lane - 0.01, k: 3, o: o }); }
  if (rbs.secret && rbs.secret.u > a && rbs.secret.u < b && !rbs.secretFound) L.push({ v: -1.5, k: 4, o: rbs.secret });
  if (rbs.state !== 'finish') L.push({ v: rbs.r.v + 0.03, k: 5, o: null });
  L.sort(function (p, q) { return p.v - q.v; });
  for (i = 0; i < L.length; i++) {
    o = L[i];
    if (o.k === 0) rbsDrawObs(c, o.o);
    else if (o.k === 1) rbsDrawMover(c, o.o, o.mv);
    else if (o.k === 2) rbsDrawStarAt(c, o.o);
    else if (o.k === 3) rbsDrawPearlAt(c, o.o);
    else if (o.k === 4) rbsDrawSecret(c);
    else rbsDrawRider(c);
  }
}
function rbsDrawObs(c, o) {
  var x = rbsSX(o.u), P = RBS_PITCH * viewH, k = rbsK(o.l1), y, s, i, a, j, dx;
  if (x < -viewH * 0.2 || x > viewW + viewH * 0.2) return;
  if (o.type === 'cloud') {
    // Äreä sadepilvi raidoilla: tihkuu, kulmat kurtussa
    y = (rbsLaneY(o.u, o.l0) + rbsLaneY(o.u, o.l1)) / 2;
    s = viewH * (0.054 + 0.02 * (o.l1 - o.l0)) * k;
    artShadow(c, x, y + P * 0.2, s * 1.2, s * 0.3 + (o.l1 - o.l0) * P * 0.4, 0.2);
    c.strokeStyle = 'rgba(110,140,225,0.8)';
    c.lineWidth = Math.max(1.2, viewH * 0.003);
    c.lineCap = 'round';
    c.beginPath();
    for (i = 0; i < 6; i++) {
      a = (globalT * 2.2 + i * 0.37 + o.ph) % 1;
      dx = (i - 2.5) * s * 0.3;
      c.moveTo(x + dx, y - s * 0.3 + a * s * 0.9);
      c.lineTo(x + dx - s * 0.04, y - s * 0.3 + a * s * 0.9 + s * 0.18);
    }
    c.stroke();
    j = o.bump > 0 ? Math.sin(o.bump * 30) * s * 0.06 : 0;
    a = y - s * 0.75 + Math.sin(globalT * 2 + o.ph) * s * 0.04;
    rbsCloudBody(c, x + j, a, s, '#a8a8d0', '#7c7cb0', '#4a4a80');
    for (i = -1; i <= 1; i += 2) {
      artEye(c, x + j + i * s * 0.22, a - s * 0.05, s * 0.09, -0.6, ((globalT + o.ph) % 3.4) < 0.12);
      c.strokeStyle = '#2a2a50';
      c.lineWidth = Math.max(1.2, s * 0.05);
      c.beginPath(); c.moveTo(x + j + i * s * 0.36, a - s * 0.24); c.lineTo(x + j + i * s * 0.1, a - s * 0.16); c.stroke();
    }
    c.beginPath(); c.arc(x + j, a + s * 0.25, s * 0.1, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    return;
  }
  y = rbsLaneY(o.u, o.l0) + P * 0.22;
  s = viewH * 0.037 * k;
  if (o.done && o.bump <= 0) {
    // Särkynyt: sirpaleet jäävät raidalle
    for (i = 0; i < 3; i++) artBlob(c, x + (i - 1) * s * 0.6, y - s * 0.15, s * 0.25, s * 0.15, o.type === 'ice' ? '#cfeeff' : '#f0c8ff', { line: Math.max(1, s * 0.05) });
    return;
  }
  artShadow(c, x, y, s * 1.1, s * 0.3, 0.2);
  j = o.bump > 0 ? Math.sin(o.bump * 40) * s * 0.1 : 0;
  if (o.type === 'ice') {
    // Jääpalikka: kuutio kiiltoineen
    c.beginPath();
    c.moveTo(x + j - s * 0.8, y); c.lineTo(x + j - s * 0.8, y - s * 1.3); c.lineTo(x + j - s * 0.4, y - s * 1.7);
    c.lineTo(x + j + s * 0.9, y - s * 1.7); c.lineTo(x + j + s * 0.9, y - s * 0.35); c.lineTo(x + j + s * 0.5, y); c.closePath();
    artFillPath(c, '#bfe8ff', y - s * 1.7, y, s, { lineColor: '#4a8ac0' });
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.moveTo(x + j - s * 0.8, y - s * 1.3); c.lineTo(x + j - s * 0.4, y - s * 1.7); c.lineTo(x + j + s * 0.9, y - s * 1.7); c.lineTo(x + j + s * 0.5, y - s * 1.3); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = Math.max(1.2, s * 0.1);
    c.beginPath(); c.moveTo(x + j - s * 0.55, y - s * 0.3); c.lineTo(x + j - s * 0.55, y - s * 1.0); c.stroke();
    artEye(c, x + j - s * 0.15, y - s * 0.75, s * 0.13, 0.3, ((globalT + o.ph) % 3) < 0.12);
    artEye(c, x + j + s * 0.3, y - s * 0.75, s * 0.13, 0.3, ((globalT + o.ph) % 3) < 0.12);
  } else {
    // Sateenkaarikristalli: kolme särmää
    for (i = -1; i <= 1; i++) {
      a = i * 0.35;
      c.save();
      c.translate(x + j + i * s * 0.45, y);
      c.rotate(a);
      c.beginPath();
      c.moveTo(-s * 0.32, 0); c.lineTo(-s * 0.32, -s * (i ? 1.1 : 1.55)); c.lineTo(0, -s * (i ? 1.45 : 1.95)); c.lineTo(s * 0.32, -s * (i ? 1.1 : 1.55)); c.lineTo(s * 0.32, 0); c.closePath();
      artFillPath(c, i === 0 ? '#e6a8ff' : (i < 0 ? '#ffb0d8' : '#a8c8ff'), -s * 1.9, 0, s * 0.5, { lineColor: '#8a4ab8' });
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.fillRect(-s * 0.2, -s * (i ? 1.0 : 1.4), s * 0.12, s * (i ? 0.8 : 1.1));
      c.restore();
    }
    rbsTwinkle(c, x + s * 0.4, y - s * 1.6 + Math.sin(globalT * 4 + o.ph) * s * 0.1, s * 0.25 * (0.6 + 0.4 * Math.sin(globalT * 7 + o.ph)), '#ffffff');
  }
}
function rbsDrawMover(c, m, v) {
  var x = rbsSX(m.u), y = rbsLaneY(m.u, rbsClamp(v, -0.5, 6.5)), k = rbsK(v), s, b, rot, i, P = RBS_PITCH * viewH;
  if (x < -viewH * 0.2 || x > viewW + viewH * 0.2) return;
  if (m.type === 'bird') {
    // Lintu ratsastajan korkeudella; varjo raidalla näyttää kaistan
    s = viewH * 0.032 * k;
    if (v > -0.6 && v < 6.6) artShadow(c, x, y + P * 0.15, s * 1.1, s * 0.3, 0.25);
    y = rbsLaneY(m.u, v) - viewH * 0.085 * k + Math.sin(globalT * 6 + m.ph) * viewH * 0.006;
    rbsDrawBirdBody(c, x, y, s, globalT * 9 + m.ph, -1, '#5aa8f0');
    return;
  }
  s = viewH * (m.type === 'beach' ? 0.026 : 0.024) * k;
  rot = (rbs.r.u - m.u) * m.rate * m.dir * 2.4;
  b = m.type === 'beach' ? Math.abs(Math.sin((rbs.r.u - m.u) * m.rate * Math.PI)) * viewH * 0.035 : 0;
  artShadow(c, x, y + P * 0.15, s * (1 - b / (viewH * 0.1)), s * 0.3, 0.22);
  y = y + P * 0.15 - s - b;
  if (m.type === 'snow') {
    artCircle(c, x, y, s, '#ffffff', { lineColor: '#7a9ad0', shadeTo: '#cfe0f8', hi: 0.5 });
    c.fillStyle = 'rgba(160,190,235,0.6)';
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(x + Math.cos(rot + i * 2.1) * s * 0.5, y + Math.sin(rot + i * 2.1) * s * 0.5, s * 0.12, 0, Math.PI * 2); c.fill(); }
  } else {
    c.save();
    c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.clip();
    for (i = 0; i < 6; i++) {
      c.fillStyle = ['#ff5a5a', '#ffffff', '#ffe14d', '#ffffff', '#4aa8ff', '#ffffff'][i];
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, s, rot + i * Math.PI / 3, rot + (i + 1) * Math.PI / 3); c.closePath(); c.fill();
    }
    c.restore();
    c.strokeStyle = '#8a4a6a'; c.lineWidth = Math.max(1.2, s * 0.08);
    c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.stroke();
    artHighlight(c, x - s * 0.35, y - s * 0.4, s * 0.3, s * 0.18, 0.55);
  }
}
// Pyöreä lintu: s = vartalon säde, dir = katseen suunta (-1 vasemmalle)
function rbsDrawBirdBody(c, x, y, s, t, dir, col) {
  var f = Math.sin(t) * 0.8;
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  artLimb(c, -s * 0.2, -s * 0.1, -s * 0.9, -s * 0.2 - f * s * 0.8, s * 0.42, artShade(col, -0.1), artShade(col, -0.45));
  artCircle(c, 0, 0, s, col, { hi: 0.4 });
  artBlob(c, s * 0.2, s * 0.3, s * 0.55, s * 0.45, '#fff4e0', { line: false });
  artLimb(c, s * 0.1, -s * 0.05, -s * 0.4, -s * 0.5 - f * s * 0.9, s * 0.45, col, artShade(col, -0.45));
  artEye(c, s * 0.45, -s * 0.25, s * 0.2, 0.5, (t % 9) < 0.3);
  c.fillStyle = '#ffb030';
  c.beginPath(); c.moveTo(s * 0.85, -s * 0.12); c.lineTo(s * 1.3, 0); c.lineTo(s * 0.85, s * 0.12); c.closePath(); c.fill();
  artBlush(c, s * 0.4, s * 0.1, s * 0.14);
  c.restore();
}
function rbsDrawStarAt(c, st) {
  var g = rbsItemXY(st.u, st.lane, st.h);
  if (g.x < -30 || g.x > viewW + 30) return;
  drawStar(c, g.x, g.y + Math.sin(globalT * 3 + st.ph) * viewH * 0.004, viewH * 0.018 * rbsK(st.lane), Math.sin(globalT * 2 + st.ph) * 0.2, 0.5);
}
function rbsDrawPearlAt(c, p) {
  var g = rbsItemXY(p.u, p.lane, p.h), r = viewH * 0.022 * rbsK(p.lane);
  if (g.x < -40 || g.x > viewW + 40) return;
  g.y += Math.sin(globalT * 2.5 + p.ph) * viewH * 0.006;
  if (p.h > 0) {
    // Leijuu aukon yllä: kimallerengas kertoo hypyn korkeuden
    c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.3 * Math.sin(globalT * 6)) + ')';
    c.lineWidth = Math.max(1, viewH * 0.003);
    c.beginPath(); c.ellipse(g.x, g.y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); c.stroke();
  }
  rbsDrawPearl(c, g.x, g.y, r, p.idx);
}
function rbsDrawPearl(c, x, y, r, idx) {
  var col = RAINBOW_COLORS[idx];
  artGlow(c, x, y, r * 2.6, artShade(col, 0.4), 0.6);
  artCircle(c, x, y, r, artShade(col, 0.25), { lineColor: artShade(col, -0.45), hi: 0.6 });
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2); c.fill();
  rbsTwinkle(c, x + r * 0.7, y - r * 0.7, r * 0.45 * (0.6 + 0.4 * Math.sin(globalT * 5 + idx)), '#ffffff');
}
// Salainen pilvipentu pikkupilvellä kaukaisen raidan yllä
function rbsDrawSecret(c) {
  var g = rbsSecretXY(), s = viewH * 0.05;
  if (g.x < -s * 3 || g.x > viewW + s * 3) return;
  rbsCloudBody(c, g.x, g.y + s * 0.6, s * 1.1, '#ffffff', '#e2daf6', '#a49ad8');
  trekDrawPup(c, g.x, g.y - s * 0.2, s * 0.6, { mood: 'happy', t: globalT, wave: true, tint: '#ffe0f0', seed: 2, look: -0.6 });
  rbsTwinkle(c, g.x + s * 0.9, g.y - s * 0.7, s * 0.2 * (0.6 + 0.4 * Math.sin(globalT * 6)), '#fff6c0');
}
function rbsDrawRider(c) {
  var r = rbs.r, g = rbsRiderGeo(), rs = g.rs, rot = r.lean, q, i, a, hx, hy, gold = rbs.state === 'finish' && rbs.pearlGot.indexOf(false) < 0 && rbs.finT > 1.5, over;
  if (g.x < -viewH * 0.3 || g.x > viewW + viewH * 0.3) return;
  over = rbs.state !== 'finish' && r.fallT <= 0 && rbsInGap(r.u, Math.round(r.v));
  // Varjo raidalla (aukon kohdalla ei varjoa; suoja-aikana kimallesilta)
  if (rbs.state !== 'finish' && !over) artShadow(c, g.x, g.base, 46 * rs * (1 - 0.4 * rbsHopFrac()), 9 * rs, 0.2);
  if (over && hurtT > 0) for (i = 0; i < 3; i++) rbsTwinkle(c, g.x + (i - 1) * rs * 25, g.base + Math.sin(globalT * 9 + i) * rs * 3, rs * 7, '#fff6c0');
  if (r.tumbleT > 0) { q = 1 - r.tumbleT / RBS_TUMBLE_T; rot += -Math.sin(q * Math.PI * 2) * 0.35 * (1 - q); }
  if (r.appearT > 0) rs *= 1 - r.appearT / 0.6 * 0.9;
  c.save();
  if (hurtT > 0 && Math.floor(globalT * 12) % 2 === 0 && rbs.state !== 'finish') c.globalAlpha = 0.55;
  c.translate(g.x, g.y);
  c.rotate(rot);
  if (r.landT > 0) artSquash(c, -Math.sin(r.landT / 0.25 * Math.PI) * 0.08);
  rbsDrawSled(c, rs, false, gold);
  drawUnicorn(c, 0, -rs * 10, rs, 1, 0, false, globalT);
  if (rbs.secretFound) trekDrawPup(c, -rs * 44, -rs * 34, rs * 16, { mood: 'happy', t: globalT, wave: rbs.state === 'finish', tint: '#ffe0f0', seed: 2, look: 1 });
  rbsDrawSled(c, rs, true, gold);
  c.restore();
  c.globalAlpha = 1;
  // Pyörryksen tähdet prinsessan pään ympärillä
  if (r.tumbleT > 0) {
    hx = g.x - rs * 4; hy = g.y - rs * 128;
    for (i = 0; i < 3; i++) {
      a = globalT * 7 + i * Math.PI * 2 / 3;
      drawStar(c, hx + Math.cos(a) * rs * 22, hy + Math.sin(a) * rs * 7, rs * 6, a, 0);
    }
  }
}
// Pilvikelkka: takapallerot ennen yksisarvista, etupallerot ja kiitävä jalas sen jälkeen
function rbsDrawSled(c, rs, front, gold) {
  var col = gold ? '#fff1b0' : '#ffffff', shade = gold ? '#ffd24f' : '#e2d8f6', line = gold ? '#c8901e' : '#a49ad8', lw = Math.max(1.2, rs * 1.6);
  if (!front) {
    artBlob(c, -rs * 8, -rs * 12, rs * 50, rs * 13, col, { lineColor: line, shadeTo: shade, line: lw });
    if (gold) artGlow(c, 0, -rs * 10, rs * 80, '#ffe27a', 0.5);
    return;
  }
  // Jalas: pinkki kiitäjä, kärki kaartuu ylös
  c.strokeStyle = gold ? '#c8901e' : '#c8508a';
  c.lineWidth = rs * 5 + 2;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-rs * 50, rs * 2); c.lineTo(rs * 40, rs * 2); c.quadraticCurveTo(rs * 62, rs * 2, rs * 58, -rs * 16); c.stroke();
  c.strokeStyle = gold ? '#ffd24f' : '#ff8fbf';
  c.lineWidth = rs * 5;
  c.beginPath(); c.moveTo(-rs * 50, rs * 2); c.lineTo(rs * 40, rs * 2); c.quadraticCurveTo(rs * 62, rs * 2, rs * 58, -rs * 16); c.stroke();
  artCircle(c, rs * 58, -rs * 17, rs * 4, '#ffd24f', { lineColor: '#c8901e' });
  artCircle(c, -rs * 34, -rs * 6, rs * 12, col, { lineColor: line, shadeTo: shade, line: lw });
  artCircle(c, -rs * 12, -rs * 4, rs * 14, col, { lineColor: line, shadeTo: shade, line: lw });
  artCircle(c, rs * 12, -rs * 4, rs * 13, col, { lineColor: line, shadeTo: shade, line: lw });
  artCircle(c, rs * 33, -rs * 6, rs * 11, col, { lineColor: line, shadeTo: shade, line: lw });
  artHighlight(c, -rs * 16, -rs * 11, rs * 6, rs * 3, 0.5);
}
// Pilviportit: pystyssä oleva pilvirengas nauhan poikki. Takapuolisko ennen
// ratsastajaa, etupuolisko sen jälkeen; sytytettynä tähtilyhdyt hehkuvat.
function rbsDrawGates(c, front) {
  var i, gt, x, yf, yn, cx, cy, rx, ry, s = viewH * 0.036, lit, j, n = 30, a, bx, by, k, col, shade, line;
  for (i = 0; i < rbs.gates.length; i++) {
    gt = rbs.gates[i];
    x = rbsSX(gt.u);
    if (x < -viewH * 0.3 || x > viewW + viewH * 0.3) continue;
    lit = gt.lit;
    yf = rbsLaneY(gt.u, -0.6);
    yn = rbsLaneY(gt.u, 6.6);
    rx = viewH * 0.075;
    ry = (yn - yf) / 2 + viewH * 0.13;
    cx = x;
    cy = yn - ry;
    col = lit ? '#fff8ff' : '#e4def4';
    shade = lit ? '#f4dcff' : '#cfc6e8';
    line = lit ? '#c8a0e0' : '#a49ad0';
    if (!front && lit && gt.litT < 1.2) artGlow(c, cx, cy, ry * (1 + gt.litT), '#ffe27a', 0.5 * (1 - gt.litT / 1.2));
    for (j = 0; j < n; j++) {
      a = Math.PI / 2 + j / n * Math.PI * 2;
      bx = cx + Math.cos(a) * rx;
      by = cy + Math.sin(a) * ry;
      // Takapuolisko oikealla (kauempana), etupuolisko vasemmalla
      if ((Math.cos(a) < -0.01) !== front) continue;
      if (by > yn - viewH * 0.01 && Math.abs(Math.cos(a)) < 0.5) continue;
      k = Math.cos(a) >= 0 ? 0.85 : 1;
      artCircle(c, bx, by, s * k * (1 + 0.12 * Math.sin(j * 1.7)), front ? col : artMix(col, '#c8bce8', 0.25), { lineColor: line, shadeTo: shade });
      if (j % 3 === 1) {
        if (lit) {
          artGlow(c, bx, by, s * 1.5, '#ffe27a', 0.55 + 0.2 * Math.sin(globalT * 5 + j));
          drawStar(c, bx, by, s * 0.42, Math.sin(globalT * 2 + j) * 0.3, 0);
        } else {
          c.globalAlpha = 0.35;
          drawStar(c, bx, by, s * 0.38, 0, 0);
          c.globalAlpha = 1;
        }
      }
    }
  }
}
// Sateenkaari lähtee linnan portilta pilvipallerosta
function rbsDrawRoadStart(c) {
  var x = rbsSX(RBS_GATE_U), i, y, s = viewH * 0.045;
  if (x < -viewH * 0.3 || x > viewW + viewH * 0.3) return;
  for (i = 0; i < 5; i++) {
    y = rbsLaneY(RBS_GATE_U, i * 1.6 - 0.2);
    artCircle(c, x + (i % 2) * s * 0.4, y, s * (1.1 - Math.abs(i - 2) * 0.1), '#ffffff', { lineColor: '#a49ad8', shadeTo: '#e2d8f6' });
  }
  // Pikkupilvi vilkuttaa lähdössä
  var pp = rbsPupPos();
  if (pp && rbs.state !== 'finish') {
    trekDrawPup(c, pp.x, pp.y, pp.r, {
      mood: rbs.state === 'count' ? (rbs.stT > 2.5 ? 'wow' : 'happy') : 'happy', t: globalT, wave: true, look: 1, lookY: 0.3,
      squash: rbs.pupPoke > 0 ? Math.sin(rbs.pupPoke * 30) * 0.1 : 0, squint: rbs.pupPoke > 0
    });
  }
}
// Lopun niitty (ennen nauhaa): nousee alhaalta, kun loppu lähestyy
function rbsDrawFinishBack(c) {
  var gy = rbsLaneY(rbs.uEnd, -1) - viewH * 0.03, W = viewW, H = viewH, x, g, i, pp;
  if (gy > H * 1.1) return;
  c.beginPath();
  c.moveTo(-W * 0.1, H * 1.2);
  for (x = -W * 0.1; x <= W * 1.1; x += 12) c.lineTo(x, gy + Math.sin((x + camX) * 0.004) * H * 0.012);
  c.lineTo(W * 1.1, H * 1.2);
  c.closePath();
  g = c.createLinearGradient(0, gy, 0, gy + H * 0.6);
  g.addColorStop(0, '#b4e692');
  g.addColorStop(1, '#5fb052');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1.5, H * 0.004);
  c.beginPath();
  for (x = -W * 0.1; x <= W * 1.1; x += 12) { if (x <= -W * 0.1) c.moveTo(x, gy + 2 + Math.sin((x + camX) * 0.004) * H * 0.012); else c.lineTo(x, gy + 2 + Math.sin((x + camX) * 0.004) * H * 0.012); }
  c.stroke();
  pp = rbsPondXY();
  for (i = 0; i < 22; i++) {
    x = pp.x + (rbsHash(i + 800) - 0.45) * H * 2.2;
    g = gy + H * (0.04 + 0.5 * rbsHash(i + 810));
    if (Math.pow((x - pp.x) / (pp.rx * 1.1), 2) + Math.pow((g - pp.y) / (pp.ry * 1.2), 2) < 1) continue;
    drawFlower(c, x, g, H * 0.009, RAINBOW_COLORS[i % 7]);
  }
}
// Lampi nauhan päässä, pulahdus, pupuja, Pikkupilvi ja helmikaari
function rbsDrawFinishFront(c) {
  var pp = rbsPondXY(), i, rp, k, b, x, hop, a, ex;
  if (pp.x - pp.rx > viewW * 1.2) return;
  // Nauhan pää jää veden alle: läpikuultava vesi
  c.beginPath(); c.ellipse(pp.x, pp.y, pp.rx, pp.ry, 0, 0, Math.PI * 2);
  c.globalAlpha = 0.9;
  artFillPath(c, '#7cc8f0', pp.y - pp.ry, pp.y + pp.ry, pp.ry, { lineColor: '#3f8ac0', line: Math.max(2, viewH * 0.005) });
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.ellipse(pp.x + pp.rx * 0.1, pp.y - pp.ry * 0.45, pp.rx * 0.5, pp.ry * 0.14, 0, 0, Math.PI * 2); c.fill();
  // Sateenkaari kimaltaa siinä, missä se sukeltaa veteen
  ex = rbsSX(rbs.uEnd);
  for (i = 0; i < 7; i++) {
    a = (globalT * 1.2 + i * 0.31) % 1;
    rbsTwinkle(c, ex + (i % 3 - 1) * viewH * 0.02, rbsLaneY(rbs.uEnd, i) - a * viewH * 0.04, RBS_PITCH * viewH * 0.35 * (1 - a), '#ffffff');
  }
  for (i = 0; i < 3; i++) hubThemeTuft(c, pp.x + (i - 1) * pp.rx * 0.9 + pp.rx * 0.2, pp.y + pp.ry * (i === 1 ? 1.0 : 0.75), viewH * 0.1, 'rgba(70,150,70,0.9)');
  c.lineWidth = Math.max(1.2, viewH * 0.003);
  for (i = 0; i < rbs.ripples.length; i++) {
    rp = rbs.ripples[i];
    if (rp.t < 0) continue;
    k = rp.t / 1.2;
    c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')';
    c.beginPath(); c.ellipse(rp.x, rp.y, viewH * (0.03 + k * 0.15), viewH * (0.01 + k * 0.05), 0, 0, Math.PI * 2); c.stroke();
  }
  if (rbs.state !== 'finish') return;
  // Helmikaari: kaikki seitsemän helmeä -> iso sateenkaari lammen ylle
  if (rbs.pearlGot.indexOf(false) < 0 && rbs.finT > 1.5) {
    k = easeOutCubic(Math.min(1, (rbs.finT - 1.5) / 1.2));
    c.lineWidth = viewH * 0.018;
    for (i = 0; i < 7; i++) {
      c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.85);
      c.beginPath(); c.arc(pp.x, pp.y, viewH * (0.44 - i * 0.018), Math.PI, Math.PI + Math.PI * k); c.stroke();
    }
    for (i = 0; i < 7; i++) {
      a = Math.PI + Math.PI * k * (i + 0.5) / 7;
      rbsDrawPearl(c, pp.x + Math.cos(a) * viewH * 0.385, pp.y + Math.sin(a) * viewH * 0.385, viewH * 0.018, i);
    }
  }
  rbsDrawRider(c);
  // Pupuja hurraamassa rannalla
  for (b = 0; b < 2; b++) {
    x = pp.x + (b ? pp.rx * 0.55 : -pp.rx * 0.45);
    hop = rbs.finT > 0.9 ? Math.abs(Math.sin(rbs.finT * 6 + b)) * viewH * 0.03 : 0;
    drawBunny(c, x, pp.y + pp.ry * 1.05, viewH * 0.04, hop, Math.sin(globalT * 4 + b) * 0.3, false);
  }
  // Pikkupilvi saapuu juhliin
  var pu = rbsPupPos();
  if (pu) trekDrawPup(c, pu.x, pu.y, pu.r, { mood: 'wow', t: globalT, wave: true, look: 1 });
}
// Etualan sumu (pilvimeren läpi) ja myrskyn sade
function rbsDrawFront(c, p) {
  var fog = rbsKey(RBS_FOG, p), i, f, d, W = viewW, H = viewH;
  if (fog > 0) {
    for (i = 0; i < rbs.fogs.length; i++) {
      f = rbs.fogs[i];
      drawCloud(c, f.x * W, f.y * H, f.s * H, fog * 0.6);
    }
  }
  if (rbs.drops.length) {
    c.strokeStyle = 'rgba(170,180,240,0.6)';
    c.lineWidth = Math.max(1, H * 0.0025);
    c.lineCap = 'round';
    c.beginPath();
    for (i = 0; i < rbs.drops.length; i++) {
      d = rbs.drops[i];
      c.moveTo(d.x, d.y); c.lineTo(d.x + H * 0.008, d.y - H * 0.03);
    }
    c.stroke();
  }
}
// Vauhtiviivat ilmassa (ei kallistu)
function rbsDrawLines(c) {
  var i, L, a, sp = rbs.r.spd / 0.6 * (rbs.r.boostT > 0 ? 1.5 : 1);
  if (rbs.state !== 'ride' || sp < 0.3) return;
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.5, viewH * 0.003);
  for (i = 0; i < rbs.lines.length; i++) {
    L = rbs.lines[i];
    a = Math.min(0.6, 0.35 * sp);
    c.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
    c.beginPath();
    c.moveTo(L.x * viewW, L.y * viewH);
    c.lineTo((L.x + L.len * Math.min(1.6, sp)) * viewW, L.y * viewH);
    c.stroke();
  }
}
// Vihjekäsi: lähtölaskennassa raahaus ja hyppynappi; myöhemmin tarpeen mukaan
function rbsDrawHint(c) {
  var r = rbs.r, g, k, hx, hy, vmin = Math.min(viewW, viewH), jx = vmin * 0.13, jy = viewH - vmin * 0.12, t, need;
  if (celebrating || rbs.state === 'finish' || holding) return;
  g = rbsRiderGeo();
  if (rbs.state === 'count' && introT <= 0) {
    t = rbs.stT;
    if (t < 1.8) {
      // Raahaus: käsi vie ratsastajaa raidalta toiselle
      k = easeInOutSine((Math.sin(t / 1.8 * Math.PI * 2 - Math.PI / 2) + 1) / 2);
      hx = g.x + viewH * 0.06;
      hy = g.base + viewH * 0.01 + k * RBS_PITCH * viewH * 2.5;
      c.globalAlpha = Math.min(1, t * 3) * 0.9;
      drawHand(c, hx, hy, viewH * 0.045);
    } else {
      // Hyppynappi
      k = ((t - 1.8) % 0.6) / 0.6;
      c.globalAlpha = 0.9;
      drawHand(c, jx + viewH * 0.02, jy - viewH * 0.02 + Math.sin(k * Math.PI) * viewH * 0.02, viewH * 0.045);
    }
    c.globalAlpha = 1;
    return;
  }
  if (rbs.state !== 'ride') return;
  need = rbsHintNeed();
  if (need === 'jump' && !rbs.everJump) {
    k = (globalT % 0.6) / 0.6;
    c.globalAlpha = 0.9;
    drawHand(c, jx + viewH * 0.02, jy - viewH * 0.02 + Math.sin(k * Math.PI) * viewH * 0.02, viewH * 0.045);
    c.globalAlpha = 1;
  } else if (need !== null && need !== 'jump' && (!rbs.everDrag || rbs.idleT > RBS_HINT_IDLE)) {
    k = (globalT % 1.2) / 1.2;
    hx = g.x + viewH * 0.06;
    hy = g.base + viewH * 0.01 + (need - r.v) * RBS_PITCH * viewH * easeInOutSine(Math.min(1, k * 1.4));
    c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
    drawHand(c, hx, hy, viewH * 0.045);
    c.globalAlpha = 1;
  }
}
// Vihjeen tarve: 'jump' (vain hypyllä), vapaa raita (numero) tai null
function rbsHintNeed() {
  var r = rbs.r, i, o, lane = Math.round(r.v), L, free, d;
  for (i = 0; i < rbs.obs.length; i++) {
    o = rbs.obs[i];
    if (o.done || o.u < r.u || o.u - r.u > 0.7 || lane < o.l0 || lane > o.l1) continue;
    if (o.low && rbs.sec === 0 && !rbs.everJump) return 'jump';
    for (d = 1; d <= 3; d++) {
      for (L = lane - d; L <= lane + d; L += 2 * d) {
        free = L >= 0 && L <= 6 && !rbsLaneBlocked(o.u, L);
        if (free) return L;
      }
    }
  }
  for (i = 0; i < rbs.gaps.length; i++) {
    o = rbs.gaps[i];
    if (o.u0 < r.u || o.u0 - r.u > 0.7 || lane < o.l0 || lane > o.l1) continue;
    if (rbs.sec === 0 && !rbs.everJump) return 'jump';
    return o.l0 > 0 ? o.l0 - 1 : o.l1 + 1;
  }
  return null;
}
function rbsLaneBlocked(u, L) {
  var i, o;
  for (i = 0; i < rbs.obs.length; i++) { o = rbs.obs[i]; if (!o.done && Math.abs(o.u - u) < 0.12 && L >= o.l0 && L <= o.l1) return true; }
  return rbsInGap(u, L);
}
// HUD: tähdet, seitsemän helmeä, matka sateenkaarta pitkin ja sydämet
function rbsDrawHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, top = pad * 0.5, left = hudX(), i, x, y, f, k, bump, px, tx0, tx1, ty, sl, fx, fy;
  drawHudPanel(c, left, top, hs * 6.4, hs * 3.4, hs);
  bump = rbs.hudBump > 0 ? 1 + Math.sin(Math.PI * rbs.hudBump / 0.35) * 0.4 : 1;
  drawStar(c, left + hs * 1.7, top + hs * 1.7, hs * 1.05 * bump, 0, rbs.hudBump > 0 ? 0.6 : 0);
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(hs * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(String(rbs.starN), left + hs * 3.1, top + hs * 1.8);
  c.textBaseline = 'alphabetic';
  // Helmet
  px = left + hs * 6.9;
  drawHudPanel(c, px, top, hs * 2.7 * 7 + pad, hs * 3.4, hs);
  for (i = 0; i < 7; i++) {
    sl = rbsPearlSlot(i);
    if (rbs.pearlGot[i] && !rbsPearlFlying(i)) {
      bump = rbs.pearlBump[i] > 0 ? 1 + Math.sin(Math.PI * rbs.pearlBump[i] / 0.45) * 0.45 : 1;
      rbsDrawPearl(c, sl.x, sl.y, hs * 0.85 * bump, i);
    } else {
      c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.75);
      c.lineWidth = Math.max(1.5, hs * 0.14);
      c.beginPath(); c.arc(sl.x, sl.y, hs * 0.75, 0, Math.PI * 2); c.stroke();
    }
  }
  // Matka: pieni sateenkaariviiva linnasta lammelle
  tx0 = left + hs * 1.2; tx1 = px + hs * 2.7 * 7 + pad - hs * 1.2; ty = top + hs * 4.6;
  drawHudPanel(c, left, top + hs * 3.7, tx1 - left + hs * 1.2, hs * 1.8, hs * 0.8);
  for (i = 0; i < 7; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.lineWidth = Math.max(1, hs * 0.13);
    c.beginPath(); c.moveTo(tx0, ty - hs * 0.4 + i * hs * 0.13); c.lineTo(tx1, ty - hs * 0.4 + i * hs * 0.13); c.stroke();
  }
  for (i = 0; i < rbs.gates.length; i++) {
    x = tx0 + (tx1 - tx0) * (rbs.gates[i].u - RBS_START_U) / (rbs.uEnd - RBS_START_U);
    artCircle(c, x, ty, hs * 0.38, rbs.gates[i].lit ? '#ffe27a' : '#ffffff', { lineColor: rbs.gates[i].lit ? '#c8901e' : '#a49ad8', line: Math.max(1, hs * 0.08) });
  }
  artBlob(c, tx1 + hs * 0.2, ty, hs * 0.55, hs * 0.3, '#7cc8f0', { lineColor: '#3f8ac0', line: Math.max(1, hs * 0.08) });
  x = tx0 + (tx1 - tx0) * rbsProg();
  artCircle(c, x, ty, hs * 0.5, '#ff8fb0', { lineColor: '#b8507a', line: hs * 0.1 });
  // Lentävät tähdet ja helmet HUD:iin
  for (i = 0; i < rbs.flyers.length; i++) {
    f = rbs.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    if (f.kind === 'star') { fx = left + hs * 1.7; fy = top + hs * 1.7; }
    else if (f.kind === 'pearl') { sl = rbsPearlSlot(f.idx); fx = sl.x; fy = sl.y; }
    else { fx = viewW * 0.3; fy = viewH * 0.45; }
    x = f.x0 + (fx - f.x0) * k;
    y = f.y0 + (fy - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.08;
    if (f.kind === 'star') drawStar(c, x, y, hs * (1.2 - k * 0.2), k * 6, 0.4);
    else if (f.kind === 'pearl') rbsDrawPearl(c, x, y, hs * (1.2 - k * 0.3), f.idx);
    else {
      c.globalAlpha = 1 - k;
      for (var j = 0; j < 6; j++) drawStar(c, f.x0 + Math.cos(j * 1.05 + k * 3) * viewH * 0.1 * k, f.y0 + Math.sin(j * 1.05 + k * 3) * viewH * 0.1 * k, hs * 0.8, k * 4, 0.4);
      c.globalAlpha = 1;
    }
  }
  drawHearts(c);
}
function rbsPearlSlot(i) {
  var hs = viewH * 0.022, pad = hs * 1.4;
  return { x: hudX() + hs * 6.9 + pad * 0.5 + hs * 1.35 + i * hs * 2.7, y: pad * 0.5 + hs * 1.7 };
}
function rbsPearlFlying(idx) {
  var i;
  for (i = 0; i < rbs.flyers.length; i++) if (rbs.flyers[i].kind === 'pearl' && rbs.flyers[i].idx === idx) return true;
  return false;
}
// Lähtölaskenta 3-2-1 ja lähtötähti
function rbsDrawCount(c) {
  var t, n, k, x = viewW * 0.5, y = viewH * 0.22, r = viewH * 0.07, i;
  if (rbs.state === 'respawn') {
    k = Math.min(1, rbs.stT / 0.3) * Math.min(1, (RBS_RESPAWN_T - rbs.stT) / 0.3);
    c.globalAlpha = Math.max(0, k);
    for (i = 0; i < 3; i++) drawHeartShape(c, x + (i - 1) * r * 1.4, y + Math.sin(globalT * 6 + i) * r * 0.08, r * 0.6, true);
    c.globalAlpha = 1;
    return;
  }
  if (rbs.state === 'count' && introT <= 0) {
    t = rbs.stT;
    n = 3 - Math.floor(t);
    k = t % 1;
    c.globalAlpha = Math.min(1, (1 - k) * 4);
    artCircle(c, x, y, r * (0.9 + 0.2 * easeOutBack(Math.min(1, k * 4))), '#ffffff', { lineColor: '#c88ae8', line: r * 0.08, hi: 0.3 });
    c.fillStyle = RAINBOW_COLORS[(3 - n) * 2];
    c.strokeStyle = '#5a3a8a';
    c.lineWidth = r * 0.08;
    c.font = 'bold ' + Math.round(r * 1.3) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.strokeText(String(n), x, y + r * 0.05);
    c.fillText(String(n), x, y + r * 0.05);
    c.textBaseline = 'alphabetic';
    c.globalAlpha = 1;
  } else if (rbs.state === 'ride' && rbs.stT < 0.7 && rbs.cpSec === 0 && rbs.r.u < rbs.secU[0] + 1) {
    k = rbs.stT / 0.7;
    c.globalAlpha = 1 - k;
    drawStar(c, x, y, r * (1 + k), k * 3, 1);
    c.globalAlpha = 1;
  }
}
function rbsDrawFeather(c, s) {
  c.beginPath();
  c.moveTo(0, -s); c.quadraticCurveTo(s * 0.5, 0, 0, s); c.quadraticCurveTo(-s * 0.5, 0, 0, -s);
  artFillPath(c, '#ffb0d0', -s, s, s * 0.4, { lineColor: '#c8508a', line: Math.max(1, s * 0.08) });
  c.strokeStyle = '#c8508a'; c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s * 1.3); c.stroke();
}
function rbsDrawCarrot(c, s) {
  c.beginPath();
  c.moveTo(-s * 0.3, -s * 0.5); c.lineTo(s * 0.3, -s * 0.5); c.lineTo(0, s); c.closePath();
  artFillPath(c, '#ff9a3a', -s * 0.5, s, s * 0.3, { lineColor: '#b8601a' });
  artLimb(c, 0, -s * 0.5, -s * 0.2, -s, s * 0.12, '#6cc45c', '#2f7a2c');
  artLimb(c, 0, -s * 0.5, s * 0.2, -s, s * 0.12, '#6cc45c', '#2f7a2c');
}
function rbsDrawPot(c, s, sp) {
  var i, a;
  artShadow(c, 0, 0, s * 1.2, s * 0.25, 0.25);
  // Kultakasa
  for (i = 0; i < 6; i++) artCircle(c, (i - 2.5) * s * 0.28, -s * 1.15 - Math.abs(i - 2.5) * -s * 0.06, s * 0.2, '#ffd24f', { lineColor: '#c8901e', hi: 0.5 });
  drawStar(c, 0, -s * 1.45 - (sp > 0 ? Math.sin(sp * Math.PI) * s * 0.3 : 0), s * 0.32, globalT, 0.6);
  // Pata
  c.beginPath();
  c.moveTo(-s * 0.85, -s * 1.0);
  c.quadraticCurveTo(-s * 1.05, -s * 0.1, -s * 0.5, 0);
  c.lineTo(s * 0.5, 0);
  c.quadraticCurveTo(s * 1.05, -s * 0.1, s * 0.85, -s * 1.0);
  c.closePath();
  artFillPath(c, '#4a4458', -s * 1.0, 0, s, { lineColor: '#1e1a28' });
  artRoundRect(c, -s * 0.95, -s * 1.12, s * 1.9, s * 0.2, s * 0.1, '#5a5468', { lineColor: '#1e1a28' });
  artHighlight(c, -s * 0.5, -s * 0.7, s * 0.12, s * 0.25, 0.3);
  a = 0.5 + 0.3 * Math.sin(globalT * 3);
  artGlow(c, 0, -s * 1.2, s * 1.4, '#ffe27a', a * 0.6);
}

// ---------- Kartan kuvake ----------
HUB_ICONS.rbslide = function (c, x, y, s) {
  var i, bw = s * 0.045, R = s * 0.4, cx = x, cy = y + s * 0.22, a, px, py, us;
  c.lineCap = 'butt';
  for (i = 0; i < 7; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.lineWidth = bw + 0.6;
    c.beginPath(); c.arc(cx, cy, R - i * bw, Math.PI, Math.PI * 2); c.stroke();
  }
  // Pilvet kaaren jaloissa
  rbsCloudBody(c, cx - R + bw * 3, cy, s * 0.09, '#ffffff', '#e2d8f6', '#a49ad8');
  rbsCloudBody(c, cx + R - bw * 3, cy, s * 0.09, '#ffffff', '#e2d8f6', '#a49ad8');
  // Ratsastaja liukuu kaaren oikeaa puolta alas
  a = Math.PI * 1.72 + Math.sin(globalT * 1.2) * 0.05;
  px = cx + Math.cos(a) * (R - bw * 3.5);
  py = cy + Math.sin(a) * (R - bw * 3.5);
  us = s * 0.0021;
  c.save();
  c.translate(px, py - bw * 1.2);
  c.rotate(a + Math.PI / 2);
  rbsDrawSled(c, us, false, false);
  drawUnicorn(c, 0, -us * 10, us, 1, 0, false, globalT);
  rbsDrawSled(c, us, true, false);
  c.restore();
};

// ---------- Rekisterin taustakoukut ----------
// Kenttä piirtää taustansa itse (taivas vaihtuu matkan mukaan); rekisterille
// kevyt yhden ruudun kerros, jottei leveää maailmakangasta varata turhaan.
function renderRbslideBg(b, w, h) {
  var g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, RBS_SKY_TOP[0][1]);
  g.addColorStop(1, RBS_SKY_BOT[0][1]);
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
}
function rbslideLayers() { return [{ speed: 0, render: renderRbslideBg }]; }
