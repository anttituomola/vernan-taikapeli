'use strict';

// Junamatka (Kaukamaa, Maalaiskylä): pitkä ja helppo junakenttä. Pieni
// höyryjuna (veturi + kolme vaunua) puksuttaa itsestään pitkän maiseman läpi:
// pellot, tuulimyllyt, silta joen yli, tunneli, kukkaniitty, omenatarha ja
// iltaan hämärtyvä kylä. Prinsessa ajaa veturia.
// Radan varrella on kuusi asemaa, joiden kylteissä on kuva ja väri (mansikka,
// porkkana, aurinko, omena, kala, kukka; järjestys arvotaan). Eläinmatkustajien
// puhekuplassa on sen aseman kuva, jonne ne haluavat. ASEMAN NAPAUTUS
// (kyltti, asemarakennus tai laituri) pysäyttää junan sille asemalle: juna
// jarruttaa pehmeästi, ja jos asema on jo ohitettu mutta näkyy vielä ruudulla,
// juna peruuttaa takaisin. Asemalla perille tulleet hyppäävät pois (tähti ja
// ilo), ja laiturilla odottavat nousevat kyytiin.
// Ei sydämiä, ei aikarajaa eikä rangaistuksia: turha pysähdys ei haittaa;
// ohi ajettaessa matkustaja huiskuttaa ja jää pois seuraavalla pysähdyksellä
// (kävelee iloisena takaisin), ja laiturille jäänyt odottaja juoksee junan
// perään ja hyppää viimeiseen vaunuun. Pääteasemalla kaikki jäävät pois.
// Kultainen veturi, jos jokainen matka sujui ensimmäisellä kerralla.
// Tähdet: matala tähti napataan veturin omasta savusta itsestään, korkeat
// tähdet vihellyksellä (napautus muualle kuin asemaan = vihellys ja iso
// savupilvi, joka nousee ja nappaa tähdet). Viides vihellys tuo
// kuumailmapallon, josta pupu pudottaa tähtiä.
// Kaksi opastinta pysäyttää junan tehtävän ajaksi (laske, anna N).

// Mitat: maailman pituudet × viewW, junan ja maiseman mitat × viewH
var TRAIN_GAP = 3.0;          // asemien väli
var TRAIN_MID = 6;            // väliasemia (lähtö- ja pääteaseman lisäksi)
var TRAIN_V = 0.13;           // ajonopeus × viewW / s
var TRAIN_V_NEAR = 0.085;     // hiljennys, kun asema on edessä lähellä
var TRAIN_V_BACK = 0.1;       // peruutuksen enimmäisnopeus
var TRAIN_ACC = 0.07;         // kiihdytys × viewW / s²
var TRAIN_BRK = 0.11;         // jarrutus × viewW / s²
var TRAIN_LEAD = 0.68;        // veturin keula ruudulla × viewW
var TRAIN_GRACE = 0.64;       // ohitetulle asemalle voi palata, kun keula on enintään näin pitkällä
var TRAIN_TY = 0.8;           // kiskojen yläpinta × viewH
var TRAIN_PLAT = 0.9;         // laiturin seisontataso × viewH
var TRAIN_LOCO = 0.2;         // veturin pituus × viewH
var TRAIN_CARL = 0.15;        // vaunun pituus
var TRAIN_CGAP = 0.025;       // kytkimen väli
var TRAIN_CARS = 3;
var TRAIN_SEATS = 6;          // kaksi paikkaa vaunussa
var TRAIN_ANIMAL = 0.042;     // eläimen koko × viewH
var TRAIN_KINDS = ['cow', 'sheep', 'pig', 'hen', 'duck', 'bunny'];
var TRAIN_CAR_COLS = ['#5fa8ff', '#ffc94f', '#6fd66f'];
// Asemien kuvat: 0–5 väliasemat (arvotaan järjestys), 6 pääteasema, 7 lähtöasema
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
// Maisemat asemaväleittäin
var TRAIN_THEMES = ['fields', 'mills', 'river', 'tunnel', 'meadow', 'orchard', 'village'];

var train = {
  x: 0, v: 0, cam: 0, mode: 'stand', t: 0, req: -1, st: [], sig: [], pax: [], seats: [],
  queue: [], queueT: 0, standT: 0, stars: [], puffs: [], puffT: 0, starN: 0, delivered: 0,
  flawless: true, gold: false, whistles: 0, balloon: null, hintNext: -1, builtW: 0, builtH: 0,
  U: null, sigIdx: -1, endT: 0, won: false, brakeT: 0, hudBump: 0, whistleT: 0, crossDown: 0,
  firstHigh: -1, wheelA: 0
};

// ---------- Apu ----------
function trainHash(n) {
  var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function trainTY() { return viewH * TRAIN_TY; }
function trainPlatY() { return viewH * TRAIN_PLAT; }
function trainLength() { return viewH * (TRAIN_LOCO + TRAIN_CARS * (TRAIN_CARL + TRAIN_CGAP)); }
// Vaunun k (0 = veturin takana) keskikohta junan keulasta x
function trainCarX(x, k) {
  var h = viewH;
  return x - h * TRAIN_LOCO - h * TRAIN_CGAP * (k + 1) - h * TRAIN_CARL * (k + 0.5);
}
// Istumapaikka: vaunu j/2, vasen tai oikea puoli
function trainSeatPos(j, x) {
  var h = viewH, cx = trainCarX(x === undefined ? train.x : x, Math.floor(j / 2));
  return { x: cx + (j % 2 ? h * 0.034 : -h * 0.034), y: trainTY() - h * 0.058 };
}
function trainChimney() { return { x: train.x - viewH * 0.045, y: trainTY() - viewH * 0.215 }; }

// ---------- Arvonta: matkustajat ----------
// Jokainen väliasema (paitsi yksi tyhjä "ohitettava") saa ainakin yhden
// poisjäävän tai odottajan. Kyydissä enintään 5, ja odottajien juostessa
// perään (ohitettu asema) paikkoja riittää silti kaikille.
function trainMakePlan() {
  var tries, i, k, d, pax, ok, aboard, decoy, n, drops, boards, before, last = '';
  for (tries = 0; tries < 2000; tries++) {
    decoy = 3 + Math.floor(Math.random() * 3);
    pax = [{ from: 0, dest: 1 }, { from: 0, dest: Math.random() < 0.5 ? 2 : 4 }];
    for (i = 1; i <= TRAIN_MID; i++) {
      if (i === decoy) continue;
      n = i === 1 ? 1 : (i === TRAIN_MID ? (Math.random() < 0.6 ? 1 : 0) : (Math.random() < 0.45 ? 2 : 1));
      for (k = 0; k < n; k++) {
        d = i + 1 + (Math.random() < 0.55 ? 0 : (Math.random() < 0.7 ? 1 : 2));
        if (d === decoy) d++;
        if (d > TRAIN_MID + 1) d = TRAIN_MID + 1;
        pax.push({ from: i, dest: d });
      }
    }
    ok = pax.length >= 8 && pax.length <= 11;
    aboard = 0;
    var dropSt = 0;
    for (i = 0; ok && i <= TRAIN_MID; i++) {
      drops = 0; boards = 0;
      for (k = 0; k < pax.length; k++) {
        if (pax[k].dest === i) drops++;
        if (pax[k].from === i) boards++;
        if (pax[k].dest === decoy) ok = false;
      }
      before = aboard;
      if (i > 0 && i !== decoy && drops + boards === 0) ok = false;
      if (i === 1 && (drops < 1 || boards < 1)) ok = false;
      if (drops > 0) dropSt++;
      if (before + boards > TRAIN_SEATS) ok = false;
      aboard = before - drops + boards;
      if (aboard > 5) ok = false;
    }
    if (dropSt < 4) ok = false;
    if (ok) break;
  }
  for (i = 0; i < pax.length; i++) {
    do { k = TRAIN_KINDS[Math.floor(Math.random() * TRAIN_KINDS.length)]; } while (k === last);
    last = k;
    pax[i].kind = k;
  }
  return { pax: pax, decoy: decoy, icons: shuffleNums([0, 1, 2, 3, 4, 5]) };
}

// ---------- Maailma ----------
// Paikat viewW-yksiköissä; trainLayout muuttaa ne pikseleiksi
function trainBuildU() {
  var U = { st: [], sig: [], stars: [] }, i, g, x0, f, k, cl, n;
  for (i = 0; i <= TRAIN_MID + 1; i++) U.st.push(0.75 + i * TRAIN_GAP);
  U.sig = [U.st[2] + TRAIN_GAP * 0.27, U.st[5] + TRAIN_GAP * 0.3];
  U.river = [U.st[2] + TRAIN_GAP * 0.48, U.st[2] + TRAIN_GAP * 0.76];
  U.tunnel = [U.st[3] + TRAIN_GAP * 0.32, U.st[3] + TRAIN_GAP * 0.66];
  U.cross = U.st[5] + TRAIN_GAP * 0.62;
  // Tähtiryhmät: matala kaari (veturin savu nappaa itsestään) ja korkeat
  // pylväät tai kaaret (vihellys). Ei tunnelissa eikä asemien kohdalla.
  for (g = 0; g <= TRAIN_MID; g++) {
    x0 = U.st[g];
    for (k = 0; k < 3; k++) {
      f = 0.24 + k * 0.26 + (Math.random() - 0.5) * 0.06;
      var sx = x0 + TRAIN_GAP * f;
      if (sx > U.tunnel[0] - 0.3 && sx < U.tunnel[1] + 0.1) continue;
      if (Math.abs(sx - U.sig[0]) < 0.25 || Math.abs(sx - U.sig[1]) < 0.25) continue;
      cl = (g + k) % 3;
      if (cl === 0) {
        for (n = 0; n < 4; n++) U.stars.push({ u: sx + n * 0.07, fy: 0.545 - Math.sin(n / 3 * Math.PI) * 0.025, low: true });
      } else if (cl === 1) {
        for (n = 0; n < 3; n++) U.stars.push({ u: sx, fy: 0.46 - n * 0.09, low: false });
      } else {
        for (n = 0; n < 5; n++) U.stars.push({ u: sx + n * 0.06, fy: 0.4 - Math.sin(n / 4 * Math.PI) * 0.1, low: false });
      }
    }
  }
  return U;
}
function trainLayout() {
  var W = viewW, h = viewH, U = train.U, i, old = train.st;
  train.st = [];
  for (i = 0; i < U.st.length; i++) {
    train.st.push({
      x: U.st[i] * W, icon: i === 0 ? 7 : (i === U.st.length - 1 ? 6 : train.plan.icons[i - 1]),
      visited: old[i] ? old[i].visited : i === 0, passed: old[i] ? old[i].passed : false,
      wob: 0, end: i === U.st.length - 1, start: i === 0
    });
  }
  var oldSig = train.sig;
  train.sig = [];
  for (i = 0; i < U.sig.length; i++) train.sig.push({ x: U.sig[i] * W, green: oldSig[i] ? oldSig[i].green : false, task: i, t: 0 });
  train.river = [U.river[0] * W, U.river[1] * W];
  train.tunnel = [U.tunnel[0] * W, U.tunnel[1] * W];
  train.cross = U.cross * W;
  train.builtW = W;
  train.builtH = h;
}

// ---------- Alustus ----------
function initTrain() {
  var i, p;
  tasks = [makeTask(-5, 'route'), makeTask(-5, 'pay')];  // välitehtävät vaikeampia (palaute 4.10.2026)
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  train.plan = trainMakePlan();
  train.U = trainBuildU();
  train.st = [];
  train.sig = [];
  trainLayout();
  train.x = train.st[0].x;
  train.v = 0;
  train.cam = train.x - viewW * TRAIN_LEAD;
  train.req = -1;
  train.pax = [];
  train.seats = [];
  for (i = 0; i < TRAIN_SEATS; i++) train.seats.push(null);
  for (i = 0; i < train.plan.pax.length; i++) {
    p = train.plan.pax[i];
    train.pax.push({ kind: p.kind, from: p.from, dest: p.dest, state: p.from === 0 ? 'wait' : 'hidden', x: 0, y: 0, seat: -1, anim: null, t: Math.random() * 3, missed: false, waveT: 0, face: 1, alpha: 1, slot: 0 });
  }
  trainPlaceWaiters();
  train.stars = [];
  for (i = 0; i < train.U.stars.length; i++) {
    train.stars.push({ x: train.U.stars[i].u * viewW, y: train.U.stars[i].fy * viewH, got: false, low: train.U.stars[i].low, ph: Math.random() * 6, fall: false });
  }
  train.firstHigh = -1;
  for (i = 0; i < train.stars.length; i++) if (!train.stars[i].low && train.stars[i].x > train.st[1].x) { train.firstHigh = i; break; }
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
  train.sigIdx = -1;
  train.won = false;
  train.endT = 0;
  train.brakeT = 0;
  train.hudBump = 0;
  train.crossDown = 0;
  train.wheelA = 0;
  trainArrive(0);
  train.standT = -0.8;
  trainSetupProps();
  renderBackground();
}
function respawnTrain() {}
function resizeTrain() {
  var rw = viewW / (train.builtW || viewW), rh = viewH / (train.builtH || viewH), i, p;
  camX = 0;
  if (!train.U) return;
  train.x *= rw;
  train.v *= rw;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    p.x *= rw; p.y *= rh;
    if (p.anim) { p.anim.x0 *= rw; p.anim.y0 *= rh; p.anim.x1 *= rw; p.anim.y1 *= rh; }
  }
  for (i = 0; i < train.stars.length; i++) { train.stars[i].x *= rw; train.stars[i].y *= rh; }
  train.puffs = [];
  trainLayout();
  train.cam = train.x - viewW * TRAIN_LEAD;
  trainPlaceWaiters();
  trainSetupProps();
}
// Odottajat laiturille vaunujen eteen (asema, jolla ne nousevat)
function trainPlaceWaiters() {
  var i, p, n = {}, h = viewH, S;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.state !== 'wait' && p.state !== 'hidden') continue;
    n[p.from] = (n[p.from] || 0) + 1;
    p.slot = n[p.from] - 1;
    S = train.st[p.from].x;
    p.x = S - h * (0.2 + p.slot * 0.17);
    p.y = trainPlatY();
  }
}

// ---------- Tökättävät koristeet ----------
// Maailmakoordinaateissa (kamera train.cam). Taso 0 piirretään junan taakse,
// taso 1 junan eteen (traktori, puomi, kala, lepakot).
function trainSetupProps() {
  var W = viewW, h = viewH, S = train.st, G = TRAIN_GAP * W, i, x, ty = trainTY();
  propsReset();
  // Pellot: lehmät, possu mutalammikossa, heinäpaalit
  trainAddGrazer(S[0].x + G * 0.3, h * 0.71, h * 0.05, 'cow', 1);
  trainAddGrazer(S[0].x + G * 0.42, h * 0.72, h * 0.045, 'cow', -1);
  trainAddHay(S[0].x + G * 0.62, h * 0.73, h * 0.045);
  trainAddGrazer(S[0].x + G * 0.8, h * 0.72, h * 0.04, 'pig', 1);
  // Tuulimyllyt ja aidan yli hyppivät lampaat
  trainAddMill(S[1].x + G * 0.28, h * 0.7, h * 0.11);
  trainAddFenceSheep(S[1].x + G * 0.5, h * 0.73, h * 0.04);
  trainAddMill(S[1].x + G * 0.72, h * 0.69, h * 0.09);
  // Joki: kala hyppää sillan vierestä, ankka uiskentelee
  trainAddFish((train.river[0] + train.river[1]) / 2 - W * 0.12, h * 0.95, h * 0.04);
  trainAddGrazer(train.river[0] + W * 0.12, h * 0.705, h * 0.032, 'duck', 1);
  // Tunneli: lampaat mäen päällä, lepakot katossa
  x = (train.tunnel[0] + train.tunnel[1]) / 2;
  trainAddGrazer(x - W * 0.12, h * 0.4, h * 0.035, 'sheep', 1);
  trainAddGrazer(x + W * 0.1, h * 0.41, h * 0.032, 'sheep', -1);
  for (i = 0; i < 3; i++) trainAddBat(train.tunnel[0] + (train.tunnel[1] - train.tunnel[0]) * (0.25 + i * 0.25), ty - h * 0.245, h * 0.028);
  // Kukkaniitty: variksenpelätin, kukkamätäs, heinäpaali, lehmä
  trainAddScarecrow(S[4].x + G * 0.35, h * 0.72, h * 0.07);
  trainAddFlowers(S[4].x + G * 0.55, h * 0.97, h * 0.04);
  trainAddHay(S[4].x + G * 0.7, h * 0.72, h * 0.05);
  trainAddGrazer(S[4].x + G * 0.85, h * 0.715, h * 0.045, 'cow', -1);
  // Omenatarha ja tasoristeys
  trainAddAppleTree(S[5].x + G * 0.18, h * 0.72, h * 0.16);
  trainAddAppleTree(S[5].x + G * 0.42, h * 0.72, h * 0.14);
  trainAddGrazer(S[5].x + G * 0.5, h * 0.73, h * 0.03, 'hen', 1);
  trainAddCrossing(train.cross);
  trainAddTractor(train.cross - h * 0.26, h * 0.985, h * 0.07);
  trainAddAppleTree(S[5].x + G * 0.85, h * 0.72, h * 0.15);
  // Kylä: talot, joiden ikkunasta kurkkaa pupu
  trainAddHouse(S[6].x + G * 0.3, ty - h * 0.07, h * 0.12, '#ff9f7a');
  trainAddHouse(S[6].x + G * 0.55, ty - h * 0.08, h * 0.1, '#7fc8ff');
  trainAddHouse(S[6].x + G * 0.78, ty - h * 0.07, h * 0.11, '#ffd24f');
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

// ---------- Asemat ja pysähdykset ----------
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
// Seuraava käymätön asema edessä (hiljennystä, vihjeitä ja innostusta varten)
function trainNextStation() {
  var i;
  for (i = 1; i < train.st.length; i++) if (!train.st[i].visited && !train.st[i].passed) return i;
  return -1;
}
function trainRequest(i) {
  var st = train.st[i];
  if (st.visited || st.passed || st.start || st.end) { st.wob = 0.5; playNote(660, 0, 0.08, 'triangle', 0.15); return; }
  st.wob = 0.6;
  if (train.req === i) return;
  train.req = i;
  train.brakeT = 0.6;
  if (train.hintNext === i) train.hintNext = -1;
  artPop(st.x + viewH * 0.04, viewH * 0.5, viewH * 0.08, TRAIN_ICONS[st.icon].color, 'ring');
  // Jarrun kirskahdus ja asemakellon kilaus
  playNote(1568, 0, 0.12, 'sine', 0.12);
  playNote(1397, 0.08, 0.2, 'sine', 0.1);
  playNote(784, 0.05, 0.15, 'triangle', 0.25);
  playNote(1047, 0.15, 0.2, 'triangle', 0.25);
}
// Juna seisoo asemalla i: ensin pois ohi ajaneet ja perille tulleet, sitten kyytiin odottajat
function trainArrive(i) {
  var st = train.st[i], k, p, off = [], on = [];
  train.mode = 'stand';
  train.v = 0;
  train.x = st.x;
  train.standT = 0;
  train.queueT = 0.4;
  train.atSt = i;
  st.visited = true;
  if (train.req === i) train.req = -1;
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && p.missed) off.push(p);
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.state === 'ride' && !p.missed && (p.dest === i || st.end)) off.push(p);
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.from === i && (p.state === 'wait' || p.state === 'hidden')) on.push(p);
  }
  train.queue = [];
  for (k = 0; k < off.length; k++) train.queue.push({ off: true, p: off[k] });
  for (k = 0; k < on.length; k++) train.queue.push({ off: false, p: on[k] });
  if (st.end) train.gold = train.flawless;
  if (i > 0) {
    // Höyry pihahtaa jarruista
    for (k = 0; k < 6; k++) trainPuff(train.x - viewH * (0.05 + k * 0.03), trainTY() - viewH * 0.02, false, 0.5);
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
    if (p.state === 'ride' && p.dest === i) { p.missed = true; p.waveT = 2.2; any = true; }
  }
  for (k = 0; k < train.pax.length; k++) {
    p = train.pax[k];
    if (p.from !== i || (p.state !== 'wait' && p.state !== 'hidden')) continue;
    seat = trainFreeSeat(1e9, true);
    // Täysi juna (aiemmin ohi ajaneet yhä kyydissä): ne hyppäävät iloisina pois ja tekevät tilaa
    if (seat < 0) { trainDropMissed(); seat = trainFreeSeat(1e9, true); }
    if (seat < 0) continue;
    train.seats[seat] = p;
    p.seat = seat;
    p.state = 'run';
    p.x = train.cam - viewW * 0.05 - p.slot * viewH * 0.12;
    p.y = trainPlatY();
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
    trainHop(p, sp.x - viewH * 0.04, trainPlatY(), 0.55, true);
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
  var q = train.queue.shift(), p = q.p, sp, seat;
  if (q.off) {
    train.seats[p.seat] = null;
    sp = trainSeatPos(p.seat);
    p.x = sp.x; p.y = sp.y;
    p.seat = -1;
    p.face = -1;
    trainHop(p, sp.x - viewH * 0.02, trainPlatY(), 0.55, true);
    playNote(587, 0, 0.1, 'triangle', 0.2);
  } else {
    seat = trainFreeSeat(p.x, false);
    if (seat < 0) return;
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
  var st;
  if (!p.anim.off) {
    p.state = 'ride';
    p.anim = null;
    playNote(880, 0, 0.08, 'sine', 0.2);
    return;
  }
  p.anim = null;
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
  st = train.st[p.dest];
  train.starN++;
  train.delivered++;
  train.hudBump = 0.4;
  soundStar(Math.min(12, train.delivered));
  trainAnimalSound(p.kind);
  artPop(p.x, p.y - viewH * 0.05, viewH * 0.07, TRAIN_ICONS[st.icon].color, 'burst');
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
function handleTrainTap(px, py) {
  var wx = px + train.cam, i, st, b, h = viewH, sx;
  if (puzzleBusy() || celebrating || !train.U) return;
  // Kuumailmapallo: pupu vilkuttaa ja pudottaa tähtiä
  b = train.balloon;
  if (b && Math.hypot(px - b.x, py - (b.y - h * 0.02)) < h * 0.1) {
    b.waveT = 1.2;
    soundBunny();
    if (b.drops < 3) {
      b.drops++;
      train.stars.push({ x: wx, y: b.y + h * 0.1, got: false, low: false, ph: 0, fall: true });
      playNote(1319, 0.1, 0.15, 'sine', 0.25);
    }
    return;
  }
  if (propsTap(wx, py)) return;
  // Asema: kyltti, rakennus tai laituri
  for (i = 0; i < train.st.length; i++) {
    st = train.st[i];
    sx = st.x - train.cam;
    if (sx < -h * 0.9 || sx > viewW + h * 0.3) continue;
    var hitSign = Math.hypot(wx - (st.x + h * 0.045), py - h * 0.5) < h * 0.1 || (Math.abs(wx - (st.x + h * 0.045)) < h * 0.035 && py > h * 0.5);
    var hitHouse = Math.abs(wx - (st.x - h * 0.42)) < h * 0.2 && py > h * 0.48 && py < trainTY() - h * 0.12;
    var hitPlat = wx > st.x - h * 0.8 && wx < st.x + h * 0.08 && py > trainTY() + h * 0.04;
    if (hitSign || hitHouse || hitPlat) { trainRequest(i); return; }
  }
  trainWhistle();
}

// ---------- Päivitys ----------
function updateTrain(dt) {
  var busy, i, p, sp, W = viewW, h = viewH;
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
      trainStarGot(p);
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
  var W = viewW, x = train.x, tg = trainTarget(), vc = TRAIN_V * W, ns = trainNextStation(), d, vt, dv, lim, i, st;
  if (ns >= 0 && train.st[ns].x - x > 0 && train.st[ns].x - x < W * 1.0) vc = TRAIN_V_NEAR * W;
  // Lähtö kiihtyy pehmeästi
  vc *= Math.min(1, 0.35 + train.t * 0.5);
  if (tg) {
    d = tg.x - x;
    vt = Math.min(d >= 0 ? vc : TRAIN_V_BACK * W, Math.sqrt(2 * TRAIN_BRK * W * 0.8 * Math.abs(d)));
    vt *= d >= 0 ? 1 : -1;
  } else {
    vt = vc;
  }
  dv = vt - train.v;
  lim = ((Math.abs(vt) < Math.abs(train.v) || vt * train.v < 0) ? TRAIN_BRK : TRAIN_ACC) * W * dt;
  train.v += Math.max(-lim, Math.min(lim, dv));
  train.x += train.v * dt;
  train.wheelA += train.v * dt;
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
  // Ohitetut asemat
  for (i = 1; i < train.st.length - 1; i++) {
    st = train.st[i];
    if (!st.visited && !st.passed && train.req !== i && train.x > st.x + W * TRAIN_GRACE) trainPass(i);
  }
  // Savu piipusta ja jarrukipinät
  train.puffT -= dt * Math.max(0.3, Math.abs(train.v) / (TRAIN_V * W));
  if (train.puffT <= 0 && !trainInTunnel(trainChimney().x)) {
    train.puffT = 0.42;
    trainPuff(trainChimney().x, trainChimney().y, false);
  }
  if (lim > 0 && dv < -lim * 0.5 && train.v > W * 0.02 && Math.random() < 0.3) {
    spawnSparkles(train.x - viewH * 0.12, trainTY() - viewH * 0.01, 1, '#ffb040');
  }
}
function trainInTunnel(x) { return x > train.tunnel[0] && x < train.tunnel[1]; }
function trainUpdatePax(dt) {
  var i, p, k, sp, W = viewW, h = viewH, st, ns = trainNextStation();
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    p.t += dt;
    if (p.waveT > 0) p.waveT -= dt;
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
      p.y = trainPlatY() - Math.abs(Math.sin(p.t * 12)) * h * 0.012;
      if (p.x >= sp.x - h * 0.05) { p.y = trainPlatY(); trainHop(p, sp.x, sp.y, 0.45, false); }
    } else if (p.state === 'cheer') {
      if (p.t > 1.0) { p.state = 'walk'; p.t = 0; p.face = -1; }
    } else if (p.state === 'walk' || p.state === 'walkback') {
      p.x -= W * (p.state === 'walk' ? 0.06 : 0.09) * dt;
      p.alpha = Math.max(0, 1 - Math.max(0, p.t - (p.state === 'walk' ? 1.2 : 2.6)) / 0.6);
      if (p.alpha <= 0) p.state = 'gone';
    } else if (p.state === 'hidden') {
      // Odottaja ilmestyy laiturille, kun asema tulee näkyviin
      st = train.st[p.from];
      if (st.x - train.cam < W * 1.6) p.state = 'wait';
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
  var g = Math.floor((x - train.st[0].x) / (TRAIN_GAP * viewW));
  return TRAIN_THEMES[Math.max(0, Math.min(TRAIN_THEMES.length - 1, g))];
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
  for (i = 0; i < train.st.length; i++) if (x > train.st[i].x - r && x < train.st[i].x + viewH * 0.12) return true;
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
  var h = viewH, x = train.st[6].x + TRAIN_GAP * viewW * 0.45, ty = trainTY();
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
      drawFlower(c, x, y - h * 0.02, h * 0.007, cols[k % cols.length]);
    } else {
      c.strokeStyle = '#5aa848';
      c.lineWidth = Math.max(1, h * 0.004);
      c.beginPath(); c.moveTo(x - h * 0.01, y); c.lineTo(x - h * 0.014, y - h * 0.018); c.moveTo(x, y); c.lineTo(x, y - h * 0.024); c.moveTo(x + h * 0.01, y); c.lineTo(x + h * 0.015, y - h * 0.017); c.stroke();
    }
  }
}

// ---------- Piirto: asemat ja opastimet ----------
function trainDrawStationBack(c, st, i) {
  var h = viewH, ty = trainTY(), ic = TRAIN_ICONS[st.icon], x = st.x - h * 0.42, b = ty - h * 0.03, w = st.end ? h * 0.5 : h * 0.34, hh = st.end ? h * 0.2 : h * 0.15;
  if (st.x + h * 0.4 < train.cam || st.x - h * 1.0 > train.cam + viewW) return;
  artShadow(c, x, b, w * 0.6, h * 0.02, 0.15);
  artRoundRect(c, x - w / 2, b - hh, w, hh, h * 0.012, '#fff4e4', { lineColor: '#a8806a', shadeTo: '#ead4c0' });
  c.beginPath();
  c.moveTo(x - w * 0.6, b - hh + h * 0.005); c.lineTo(x - w * 0.42, b - hh - h * 0.08); c.lineTo(x + w * 0.42, b - hh - h * 0.08); c.lineTo(x + w * 0.6, b - hh + h * 0.005);
  c.closePath();
  artFillPath(c, ic.color, b - hh - h * 0.08, b - hh, h * 0.06, {});
  // Ovi ja ikkunat
  artRoundRect(c, x - h * 0.025, b - h * 0.09, h * 0.05, h * 0.09, h * 0.015, '#a86a3a', { lineColor: '#6a4020' });
  var lit = trainEvening() > 0.4;
  artRoundRect(c, x - w * 0.38, b - hh * 0.75, w * 0.18, hh * 0.35, h * 0.008, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
  artRoundRect(c, x + w * 0.2, b - hh * 0.75, w * 0.18, hh * 0.35, h * 0.008, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
  // Asemakello päädyssä
  artCircle(c, x, b - hh - h * 0.035, h * 0.022, '#ffffff', { lineColor: '#5a4a3a' });
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
  var h = viewH, ty = trainTY(), ic = TRAIN_ICONS[st.icon], sx = st.x + h * 0.045, sy = h * 0.5, r = h * 0.058, wob, k;
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
// Puhekupla matkustajan yllä: aseman kuva aseman värisessä renkaassa
function trainDrawBubble(c, x, y, r, stIdx, glow) {
  var st = train.st[stIdx], ic = TRAIN_ICONS[st.icon];
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
  if (gold && Math.random() < 0.15) spawnSparkles(x - Math.random() * h * 0.2, ty - Math.random() * h * 0.18, 1, '#fff2a0');
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
  var h = viewH, s = h * TRAIN_ANIMAL, bob = 0, o = { face: p.face, t: p.t, wave: p.waveT > 0 || p.state === 'walkback' ? 1 : 0 };
  if (p.state === 'gone' || p.state === 'hidden') return;
  if (p.x < train.cam - h * 0.2 || p.x > train.cam + viewW + h * 0.2) return;
  if (p.state === 'ride') {
    var ns = trainNextStation();
    // Innostus: oma asema näkyy edessä
    if (!p.missed && ns === p.dest && train.st[ns].x - train.cam < viewW * 1.05) bob = Math.abs(Math.sin(globalT * 8)) * h * 0.012;
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
function trainDrawBubbles(c) {
  var i, p, h = viewH, r = h * 0.032, ns = trainNextStation(), glow, y;
  for (i = 0; i < train.pax.length; i++) {
    p = train.pax[i];
    if (p.state !== 'ride' && p.state !== 'wait') continue;
    if (p.x < train.cam - h * 0.2 || p.x > train.cam + viewW + h * 0.2) continue;
    if (p.missed) continue;
    glow = 0;
    if (p.state === 'ride' && ns === p.dest && train.st[ns].x - train.cam < viewW * 1.05) glow = 0.45 + Math.sin(globalT * 6) * 0.2;
    y = p.state === 'ride' ? trainTY() - h * (0.21 + (p.seat % 2 ? 0 : 0.035)) : p.y - h * 0.15;
    trainDrawBubble(c, p.x, y, r, p.dest, glow);
  }
}
function trainDrawTrain(c) {
  var k, cx, i, p;
  for (k = 0; k < TRAIN_CARS; k++) trainDrawCar(c, k, trainCarX(train.x, k));
  // Matkustajat istuvat vaunuissa (vaunun etuseinä peittää alaosan)
  for (i = 0; i < train.pax.length; i++) { p = train.pax[i]; if (p.state === 'ride') trainDrawPassenger(c, p); }
  for (k = 0; k < TRAIN_CARS; k++) trainDrawCarFront(c, k, trainCarX(train.x, k));
  trainDrawLoco(c, train.x, train.gold);
}
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
  var c = ctx, h = viewH, W = viewW, i, st, k, hand = null;
  if (!beginPlayWorld()) return;
  if (!train.U) { endPlayWorld(); return; }
  trainDrawSkyLayer(c);
  if (train.balloon) trainDrawBalloon(c);
  c.save();
  c.translate(-train.cam, 0);
  trainDrawGround(c);
  trainDrawVillage(c);
  trainDrawTunnelBack(c);
  for (i = 0; i < train.st.length; i++) trainDrawStationBack(c, train.st[i], i);
  // Koristeet: kamera perutaan, propsDraw siirtää itse camX:n verran
  c.save();
  c.translate(train.cam, 0);
  camX = train.cam;
  propsDraw(c, 0);
  camX = 0;
  c.restore();
  trainDrawTrack(c);
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
  for (i = 0; i < train.st.length; i++) trainDrawStationFront(c, train.st[i], i);
  for (i = 0; i < train.sig.length; i++) trainDrawSignal(c, train.sig[i]);
  for (i = 0; i < train.pax.length; i++) if (train.pax[i].state !== 'ride') trainDrawPassenger(c, train.pax[i]);
  trainDrawBubbles(c);
  trainDrawStars(c);
  c.restore();
  // Hiukkaset ja pop-efektit ovat maailmakoordinaateissa
  camX = train.cam;
  drawParticlesLayer(c);
  // Vihjekäsi: ensimmäisellä asemalla (ja ohiajon jälkeen seuraavalla) kyltti, ensimmäisillä korkeilla tähdillä veturi
  if (!puzzleBusy() && !celebrating) {
    for (i = 1; i < train.st.length - 1; i++) {
      st = train.st[i];
      if (st.visited || st.passed || train.req === i) continue;
      if (i !== 1 && i !== train.hintNext) continue;
      k = st.x + h * 0.045 - train.cam;
      if (k > W * 0.08 && k < W * 0.96) hand = { x: k, y: h * 0.5 };
    }
    if (!hand && train.whistles === 0 && train.firstHigh >= 0 && train.st[1].visited && train.mode === 'run') {
      var fs = train.stars[train.firstHigh];
      if (!fs.got && fs.x - train.cam < W * 1.0 && fs.x - train.cam > W * 0.3) hand = { x: train.x - h * 0.1 - train.cam, y: trainTY() - h * 0.12 };
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

// HUD: tähtien määrä ja reittikartta (asemien kuvat, juna liikkuu)
function drawTrainHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), W = viewW, i, st, x, bump = train.hudBump > 0 ? 1 + train.hudBump * 0.6 : 1;
  if (!train.U) return;
  drawHudPanel(c, left, pad * 0.5, hs * 6.4, hs * 3.4, hs);
  drawStar(c, left + hs * 1.7, pad * 0.5 + hs * 1.7, hs * 1.0 * bump, 0, 0.4);
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(hs * 1.6) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(train.starN + '', left + hs * 3.1, pad * 0.5 + hs * 1.85);
  c.textBaseline = 'alphabetic';
  // Reitti
  var n = train.st.length, x0 = W * 0.38, x1 = W * 0.86, y = pad * 0.5 + hs * 1.7, a = train.st[0].x, b = train.st[n - 1].x;
  drawHudPanel(c, x0 - hs * 1.6, pad * 0.5, x1 - x0 + hs * 3.2, hs * 3.4, hs);
  c.strokeStyle = 'rgba(122,80,56,0.7)';
  c.lineWidth = hs * 0.35;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  for (i = 0; i < n; i++) {
    st = train.st[i];
    x = x0 + (x1 - x0) * (st.x - a) / (b - a);
    c.globalAlpha = st.passed ? 0.45 : 1;
    var ic = TRAIN_ICONS[st.icon];
    artCircle(c, x, y, hs * 1.15, '#ffffff', { lineColor: ic.color, line: hs * 0.22 });
    trainDrawIcon(c, ic.id, x, y, hs * 0.75);
    if (st.visited && !st.start) artCircle(c, x + hs * 0.8, y - hs * 0.8, hs * 0.38, '#5cc04a', { lineColor: '#ffffff', line: hs * 0.12 });
    c.globalAlpha = 1;
  }
  for (i = 0; i < train.sig.length; i++) {
    x = x0 + (x1 - x0) * (train.sig[i].x - a) / (b - a);
    artCircle(c, x, y + hs * 1.1, hs * 0.3, train.sig[i].green ? '#5cff6a' : '#ff4a4a', { lineColor: '#3a3a4a', line: hs * 0.08 });
  }
  var f = Math.max(0, Math.min(1, (train.x - a) / (b - a)));
  x = x0 + (x1 - x0) * f;
  artRoundRect(c, x - hs * 0.6, y + hs * 0.35, hs * 1.2, hs * 0.75, hs * 0.2, train.gold ? '#ffd24f' : '#e85a4a', { lineColor: '#5a2020', line: hs * 0.1 });
  artRoundRect(c, x - hs * 0.15, y + hs * 0.05, hs * 0.3, hs * 0.4, hs * 0.08, '#4a4a5a', { line: false });
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
