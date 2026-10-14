'use strict';

// Liikennevalot (Kaukamaa, Pupula; paikan vartija). Pupulan risteys
// sivulta ja hieman ylhäältä: tie kulkee vaakasuoraan, alhaalla on
// jalkakäytävä, jonka reunalle puput jonottavat suojatien kohdalle, ja tiellä
// ajaa pieniä naamallisia autoja. Iso liikennevalo seisoo suojatien vieressä,
// ja sen NAPAUTUS vaihtaa vuoron: autojen valo käy keltaisena ja menee
// punaiselle, pupujen valo vihertää ja puput hyppivät seeprasuojatien yli
// (tai toisin päin). Autot pysähtyvät punaiseen ja odottavat aina, jos
// suojatiellä on pupu, eikä pupu astu tielle auton ollessa suojatiellä:
// kolareita ei voi tulla.
// Haaste on kahden asian jongleeraus reaaliajassa, ei suunnittelu: odottava
// ryhmä (puput tai autot) kärsimättömyyttään täyttää kuplan (äreä naama,
// tööttäys, tömistely). Täysi kupla = ryhmä "kiukuttelee" hetken ja kierroksen
// tähtimittarista sammuu yksi tähti. Peli ei lopu koskaan: kiukuttelu vain
// viivästää, ja kierros on läpi, kun N pupua on päässyt yli JA M autoa ohi.
// Kolme kierrosta (TRAF_ROUNDS): 1) yksi suojatie, rauhallinen liikenne
// yhdellä kaistalla; 2) enemmän liikennettä molempiin suuntiin; 3) kaksi
// suojatietä omine valoineen. Alussa vihjekäsi näyttää valoa, ja odottavien
// ryhmien yllä hyppii nuoli. Lopuksi kaikki puput ja autot kulkevat
// paraatina ja autot tööttäävät Ukko Nooan.
// Tökättävät: katulyhty (3.: lintu laulaa lampun päällä), pupupoliisi (3.:
// hattu lentää ja pilli soi pitkän sävelen) ja kukkakioski (3.: kukkakimppu
// lentää ja myyjäpupu kurkkaa). Autot tööttäävät ja puput vilkuttavat
// napautuksesta. Kultainen pilli, jos yksikään ryhmä ei kiukutellut.

// cross: suojateiden paikat (viewW-osuus), jonon puoli (-1 vasen, 1 oikea; valo
// on vastakkaisella puolella) ja from: mistä reunasta puput tulevat (oletus jonon puoli),
// lanes: kaistat (1 = alempi vasemmalta oikealle, -1 = ylempi oikealta
// vasemmalle), bunnies/cars: tavoite, bGap/cGap: saapumisvälit (s),
// fill: kuplan täyttymisaika yhdellä odottajalla (s), bus: bussin osuus
var TRAF_ROUNDS = [
  { cross: [{ fx: 0.5, qs: -1 }], lanes: [1], bunnies: 8, cars: 10, bGap: [3.8, 5.2], cGap: [3.0, 4.2], fill: 10, bus: 0 },
  { cross: [{ fx: 0.5, qs: -1 }], lanes: [1, -1], bunnies: 11, cars: 15, bGap: [2.9, 3.9], cGap: [2.0, 2.8], fill: 10, bus: 0.2 },
  { cross: [{ fx: 0.31, qs: -1 }, { fx: 0.71, qs: -1, from: 1 }], lanes: [1, -1], bunnies: 12, cars: 15, bGap: [2.4, 3.4], cGap: [2.0, 2.8], fill: 10, bus: 0.2 }
];
var TRAF_YELLOW = 0.7;        // valon vaihto: keltainen / vilkkuva vaihe (s)
var TRAF_SPEED = 0.42;        // auton huippunopeus (viewH/s)
var TRAF_ACC = 0.55;          // kiihtyvyys (viewH/s²)
var TRAF_DEC = 1.6;           // jarrutus (viewH/s²), sarjakuvamaisen napakka
var TRAF_BUNNY_GAP = 0.5;     // pupujen lähtöväli suojatielle (s)
var TRAF_CROSS_T = 1.7;       // suojatien ylitys (s)
var TRAF_QUEUE_MAX = 4;       // jonossa enintään
var TRAF_SULK_BACK = 0.35;    // kiukuttelun jälkeen kupla palaa tähän
var TRAF_SULK_T = 2.4;        // kiukkupilven kesto (s)
var TRAF_RELIEF_B = 0.12;     // lähtevä pupu tyhjentää kuplaa
var TRAF_RELIEF_C = 0.08;     // pysäytysviivan ohittava auto tyhjentää kuplaa
var TRAF_CUT = 0.25;          // heti katkaistun vuoron kupla hypähtää
var TRAF_CUT_FAST = 3;        // ... jos vihreä paloi alle tämän (s)
var TRAF_CUT_NEAR = 0.45;     // auto on "tulossa", jos viivalle on alle tämän (viewH)
var TRAF_DRAIN = 0.15;       // kupla tyhjenee /s, kun ryhmä liikkuu tai on tyhjä
var TRAF_METER = 5;           // kierroksen tähtimittari
var TRAF_HINT_IDLE = 5;       // vihjekäsi, jos kupla on puolillaan eikä napautettu (s)
var TRAF_INTRO_T = 2.4;       // tavoitekortti kierroksen alussa (s)
var TRAF_CAR_COLS = ['#ff6b8a', '#5fb8ff', '#ffd24f', '#7ed36b', '#b88aff', '#ff9f4a', '#4fd6c8'];
var TRAF_SCARVES = ['#ff7bac', '#5fa8ff', '#ffd24f', '#6fd66f', '#c9a0ff', '#ff9f3a'];
// Paraatin tööttäyssävelmä (Ukko Nooa, kansansävelmä)
var TRAF_TUNE = [262, 262, 262, 330, 294, 294, 294, 349, 330, 330, 294, 294, 262];

var traf = {
  round: 0, phase: 'play', phaseT: 0, t: 0, cross: [], cars: [], bunnies: [],
  crossedB: 0, passedC: 0, spawnedB: 0, spawnedC: 0, bT: 0, cT: 0,
  meter: TRAF_METER, meters: [], sulks: 0, tapped: false, idleT: 0, popB: 0, popC: 0, starPop: 0,
  W: 0, H: 0, parade: null, cop: { hatT: 0, armT: 0 }, lamp: { glowT: 0, birdT: 0 }, kiosk: { peekT: 0 }
};

// ---------- Mitat ----------
function trafR() { return TRAF_ROUNDS[Math.min(traf.round, TRAF_ROUNDS.length - 1)]; }
function trafZW() { return viewH * 0.075; }                       // suojatien puolileveys
function trafRoadY0() { return viewH * 0.5; }
function trafRoadY1() { return viewH * 0.78; }
function trafLaneY(dir) { return viewH * (dir > 0 ? 0.752 : 0.612); }   // pyörien maa
function trafNearY() { return viewH * 0.85; }                      // pupujen jono
function trafFarY() { return viewH * 0.47; }                       // ylitetty reuna
function trafBunnyS() { return viewH * 0.048; }
function trafLen(car) { return viewH * 0.17 * car.size; }
function trafGap() { return viewH * 0.045; }
function trafStopS(cr, dir) { return cr.x * dir - trafZW() - viewH * 0.03; }
function trafZebraEndS(cr, dir) { return cr.x * dir + trafZW(); }
function trafLightPos(cr) {
  return { x: cr.x - cr.qs * (trafZW() + viewH * 0.075), base: viewH * 0.885, top: viewH * 0.27 };
}
function trafSlotX(cr, i) { return cr.x + cr.qs * (trafZW() * 0.35 + i * viewH * 0.085); }
function trafRand(a) { return a[0] + Math.random() * (a[1] - a[0]); }

// ---------- Alustus ----------
function initTraffic() {
  tasks = [];
  camX = 0;
  traf.round = 0;
  traf.sulks = 0;
  traf.meters = [];
  traf.tapped = false;
  traf.parade = null;
  traf.cop = { hatT: 0, armT: 0 };
  traf.lamp = { glowT: 0, birdT: 0 };
  traf.kiosk = { peekT: 0 };
  traf.W = viewW;
  traf.H = viewH;
  trafLoadRound();
  trafSetupProps();
  playNote(523, 0, 0.2, 'triangle', 0.3);
  playNote(659, 0.14, 0.2, 'triangle', 0.3);
  playNote(784, 0.28, 0.35, 'triangle', 0.3);
}
function trafLoadRound() {
  var R = trafR(), i;
  traf.cross = [];
  for (i = 0; i < R.cross.length; i++) {
    traf.cross.push({
      fx: R.cross[i].fx, x: R.cross[i].fx * viewW, qs: R.cross[i].qs, from: R.cross[i].from || R.cross[i].qs, state: 'cars', trans: 0, to: null,
      pb: 0, pc: 0, greenT: 9, sulkB: 0, sulkC: 0, lastStart: 9, honkT: 2, stompT: 2, tapT: 0, queue: [], blink: 0
    });
  }
  traf.cars = [];
  traf.bunnies = [];
  traf.crossedB = 0;
  traf.passedC = 0;
  traf.spawnedB = 0;
  traf.spawnedC = 0;
  traf.cT = 0.6;
  traf.bT = 1.6;
  traf.meter = TRAF_METER;
  traf.phase = 'play';
  traf.phaseT = 0;
  traf.t = 0;
  traf.idleT = 0;
  renderBackground();
}
function respawnTraffic() {}
function resizeTraffic() {
  var kx = traf.W ? viewW / traf.W : 1, ky = traf.H ? viewH / traf.H : 1, i, c, b;
  for (i = 0; i < traf.cross.length; i++) traf.cross[i].x = traf.cross[i].fx * viewW;
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    // Etupuskuri pidetään samassa kohdassa suhteessa ruutuun
    c.s *= kx;
    c.v *= ky;
  }
  for (i = 0; i < traf.bunnies.length; i++) {
    b = traf.bunnies[i];
    b.x *= kx;
    b.x0 *= kx;
    b.cx *= kx;
  }
  if (traf.parade) {
    for (i = 0; i < traf.parade.bunnies.length; i++) traf.parade.bunnies[i].x *= kx;
  }
  traf.W = viewW;
  traf.H = viewH;
  camX = 0;
  trafSetupProps();
}

// ---------- Valot ----------
function trafCarGo(cr) { return cr.state === 'cars' && cr.trans <= 0; }
function trafBunnyGo(cr) { return cr.state === 'bunnies' && cr.trans <= 0; }
function trafBunniesOn(k) {
  var i, b;
  for (i = 0; i < traf.bunnies.length; i++) {
    b = traf.bunnies[i];
    if (b.state === 'cross' && b.k === k) return true;
  }
  return false;
}
function trafCarMayGo(k) { return trafCarGo(traf.cross[k]) && !trafBunniesOn(k); }
function trafZebraClear(k) {
  var i, c, cr = traf.cross[k], zs, ze, m = viewH * 0.012;
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    zs = cr.x * c.dir - trafZW();
    ze = cr.x * c.dir + trafZW();
    if (c.s > zs - m && c.s - trafLen(c) < ze + m) return false;
  }
  return true;
}
function trafToggle(k) {
  var cr = traf.cross[k];
  cr.tapT = 0.45;
  if (cr.trans > 0) {
    // Vaihto on jo käynnissä: pieni naksahdus
    playNote(520, 0, 0.05, 'square', 0.06);
    return;
  }
  // Heti katkaistu vuoro harmittaa: jos vihreä ehti palaa vasta hetken ja
  // tulijoita on vielä, niiden kupla hypähtää. Näin pelkkä tahdissa
  // naputtelu ei riitä, vaan kannattaa katsoa, kuka odottaa.
  if (traf.phase === 'play' && cr.greenT < TRAF_CUT_FAST && trafCutCount(k) > 0) {
    if (cr.state === 'cars') cr.pc = Math.min(0.95, cr.pc + TRAF_CUT);
    else cr.pb = Math.min(0.95, cr.pb + TRAF_CUT);
    playNote(300, 0.1, 0.12, 'triangle', 0.18);
  }
  cr.to = cr.state === 'cars' ? 'bunnies' : 'cars';
  cr.trans = TRAF_YELLOW;
  traf.tapped = true;
  traf.idleT = 0;
  playNote(700, 0, 0.07, 'square', 0.1);
  playNote(940, 0.08, 0.09, 'square', 0.1);
  var lp = trafLightPos(cr);
  artPop(lp.x, lp.top + viewH * 0.11, viewH * 0.09, cr.to === 'bunnies' ? '#6fe07a' : '#ffd24f', 'ring');
}
// Montako vihreän vuoron tulijaa jää odottamaan, jos valo vaihdetaan nyt:
// autot, jotka seisovat tai ovat lähellä pysäytysviivaa, tai jonon puput
function trafCutCount(k) {
  var cr = traf.cross[k], n = 0, i, c, sl, j, first;
  if (cr.state === 'bunnies') {
    for (i = 0; i < cr.queue.length; i++) if (cr.queue[i].state === 'queue') n++;
    return n;
  }
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    first = -1;
    for (j = 0; j < traf.cross.length; j++) {
      sl = trafStopS(traf.cross[j], c.dir);
      if (c.s <= sl + 0.5 && (first < 0 || sl < trafStopS(traf.cross[first], c.dir))) first = j;
    }
    if (first === k && trafStopS(cr, c.dir) - c.s < viewH * TRAF_CUT_NEAR) n++;
  }
  return n;
}
function trafLightDone(cr) {
  cr.state = cr.to;
  cr.to = null;
  cr.greenT = 0;
  if (cr.state === 'bunnies') {
    // Pupujen valo vihertää: piip-piip-piip
    playNote(1320, 0, 0.06, 'square', 0.08);
    playNote(1320, 0.12, 0.06, 'square', 0.08);
    playNote(1320, 0.24, 0.06, 'square', 0.08);
  } else {
    playNote(392, 0, 0.12, 'triangle', 0.2);
    playNote(523, 0.1, 0.16, 'triangle', 0.2);
  }
}

// ---------- Syöte ----------
function trafLightHit(cr, px, py) {
  var lp = trafLightPos(cr), w = viewH * 0.085;
  return px > lp.x - w && px < lp.x + w && py > lp.top - viewH * 0.03 && py < lp.base + viewH * 0.02;
}
function handleTrafficTap(px, py) {
  var i, cr, c, b, len, gy, bs, zw = trafZW();
  if (!running || puzzleBusy()) return;
  if (celebrating || traf.phase === 'parade') { propsTap(px, py); return; }
  for (i = 0; i < traf.cross.length; i++) {
    if (trafLightHit(traf.cross[i], px, py)) { trafToggle(i); return; }
  }
  // Auto tööttää, pupu vilkuttaa (ei vaikuta peliin)
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    len = trafLen(c);
    gy = trafLaneY(c.dir);
    if (Math.abs(px - (c.s - len / 2) * c.dir) < len * 0.5 && py < gy && py > gy - len * 0.65) {
      trafHonk(c, 1);
      return;
    }
  }
  bs = trafBunnyS();
  for (i = 0; i < traf.bunnies.length; i++) {
    b = traf.bunnies[i];
    if (Math.abs(px - b.x) < bs * 0.9 && py < b.y && py > b.y - bs * 2.4) {
      b.waveT = 1.2;
      playNote(880 + Math.random() * 200, 0, 0.1, 'sine', 0.2);
      return;
    }
  }
  // Suojatien napautus käy myös valosta (anteeksiantava)
  for (i = 0; i < traf.cross.length; i++) {
    cr = traf.cross[i];
    if (Math.abs(px - cr.x) < zw && py > trafRoadY0() && py < trafRoadY1()) { trafToggle(i); return; }
  }
  propsTap(px, py);
}
function trafHonk(c, vol) {
  var f = c.size > 1.2 ? 220 : 392 + (c.col.charCodeAt(2) % 4) * 30;
  c.honkT = 0.45;
  playNote(f, 0, 0.11, 'square', 0.09 * vol);
  playNote(f * 0.84, 0.13, 0.14, 'square', 0.09 * vol);
}

// ---------- Päivitys ----------
function updateTraffic(dt) {
  var i, cr;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  trafUpdatePropFx(dt);
  if (traf.popB > 0) traf.popB -= dt;
  if (traf.popC > 0) traf.popC -= dt;
  if (traf.starPop > 0) traf.starPop -= dt;
  if (traf.phase === 'parade') { trafUpdateParade(dt); return; }
  if (puzzleBusy()) return;
  traf.t += dt;
  traf.phaseT += dt;
  traf.idleT += dt;
  for (i = 0; i < traf.cross.length; i++) {
    cr = traf.cross[i];
    cr.lastStart += dt;
    cr.blink += dt;
    if (cr.trans <= 0) cr.greenT += dt;
    if (cr.tapT > 0) cr.tapT -= dt;
    if (cr.sulkB > 0) cr.sulkB -= dt;
    if (cr.sulkC > 0) cr.sulkC -= dt;
    if (cr.trans > 0) {
      cr.trans -= dt;
      if (cr.trans <= 0) trafLightDone(cr);
    }
  }
  if (traf.phase === 'play') trafSpawn(dt);
  trafUpdateCars(dt);
  trafUpdateBunnies(dt);
  if (traf.phase === 'play') {
    trafUpdatePatience(dt);
    if (traf.crossedB >= trafR().bunnies && traf.passedC >= trafR().cars) trafRoundDone();
  } else if (traf.phase === 'done') {
    if (traf.phaseT > 2.8) {
      if (traf.round + 1 < TRAF_ROUNDS.length) {
        traf.round++;
        trafLoadRound();
        trafSetupProps();
      } else {
        trafStartParade();
      }
    }
  }
}
function trafSpawn(dt) {
  var R = trafR(), i, k, opts, cr, dir, lane, ok, n;
  traf.bT -= dt;
  if (traf.bT <= 0 && traf.spawnedB < R.bunnies) {
    opts = [];
    for (i = 0; i < traf.cross.length; i++) if (traf.cross[i].queue.length < TRAF_QUEUE_MAX) opts.push(i);
    if (opts.length) {
      // Kahdella suojatiellä vuorotellen, välillä arvottu
      k = opts.length > 1 ? (Math.random() < 0.65 ? traf.spawnedB % 2 : Math.floor(Math.random() * 2)) : opts[0];
      if (opts.indexOf(k) < 0) k = opts[0];
      cr = traf.cross[k];
      n = traf.bunnies.length;
      traf.bunnies.push({
        k: k, state: 'arrive', x: cr.from < 0 ? -viewH * 0.08 : viewW + viewH * 0.08, y: trafNearY(), x0: 0, cx: 0, t: Math.random() * 3,
        waveT: 0, stompT: 0, scarf: TRAF_SCARVES[(traf.spawnedB + traf.round * 2) % TRAF_SCARVES.length], dirOut: 0
      });
      cr.queue.push(traf.bunnies[n]);
      traf.spawnedB++;
      traf.bT = trafRand(R.bGap);
    } else {
      traf.bT = 0.6;
    }
  }
  traf.cT -= dt;
  if (traf.cT <= 0 && traf.spawnedC < R.cars) {
    lane = R.lanes.slice();
    if (lane.length > 1 && Math.random() < 0.5) lane.reverse();
    ok = false;
    for (i = 0; i < lane.length && !ok; i++) {
      dir = lane[i];
      if (trafEntryFree(dir)) {
        trafAddCar(dir, Math.random() < R.bus ? 'bus' : 'car');
        ok = true;
      }
    }
    traf.cT = ok ? trafRand(R.cGap) : 0.5;
  }
}
function trafEntryFree(dir) {
  var i, c, s0 = (dir > 0 ? 0 : -viewW);
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    if (c.dir === dir && c.s - trafLen(c) < s0 + trafGap() * 1.5 + viewH * 0.25) return false;
  }
  return true;
}
function trafAddCar(dir, kind, o) {
  var col = TRAF_CAR_COLS[(traf.spawnedC * 3 + traf.round) % TRAF_CAR_COLS.length];
  var c = {
    dir: dir, kind: kind, size: kind === 'bus' ? 1.4 : 1, col: kind === 'bus' ? '#ffb347' : col,
    s: (dir > 0 ? 0 : -viewW) - viewH * 0.02, v: TRAF_SPEED * viewH * 0.85, roll: 0, honkT: 0, squashT: 0,
    counted: false, waitK: -1, waitT: 0, blinkT: Math.random() * 3
  };
  if (o) { c.s = o.s; c.v = o.v; c.parade = true; c.col = o.col || c.col; }
  traf.cars.push(c);
  traf.spawnedC++;
  return c;
}
// Edellä ajava auto samalla kaistalla (suurin s, joka on tämän edessä)
function trafAhead(c) {
  var i, o, best = null;
  for (i = 0; i < traf.cars.length; i++) {
    o = traf.cars[i];
    if (o === c || o.dir !== c.dir || o.s <= c.s) continue;
    if (!best || o.s < best.s) best = o;
  }
  return best;
}
function trafUpdateCars(dt) {
  var i, j, c, a, limit, len, sl, ze, cr, firstK, firstSl, vmax = TRAF_SPEED * viewH, vAllow, prevV, prevS, lastZe, end, H = viewH;
  // Johtavat ensin, jotta jono liikkuu tasaisesti
  traf.cars.sort(function (p, q) { return q.s - p.s; });
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    len = trafLen(c);
    a = trafAhead(c);
    limit = Infinity;
    if (a) limit = a.s - trafLen(a) - trafGap();
    // Ensimmäinen suojatie, jonka pysäytysviivaa ei ole ohitettu
    firstK = -1;
    firstSl = Infinity;
    for (j = 0; j < traf.cross.length; j++) {
      sl = trafStopS(traf.cross[j], c.dir);
      if (c.s <= sl + 0.5 && sl < firstSl) { firstSl = sl; firstK = j; }
    }
    if (firstK >= 0 && traf.phase !== 'parade') {
      cr = traf.cross[firstK];
      ze = trafZebraEndS(cr, c.dir);
      if (!trafCarMayGo(firstK)) limit = Math.min(limit, firstSl);
      // Suojatielle ei jäädä seisomaan: jos edellä on jono, odotetaan viivalla
      else if (a && a.v < vmax * 0.5 && a.s - trafLen(a) - trafGap() < ze + len + H * 0.01) limit = Math.min(limit, firstSl);
    }
    prevV = c.v;
    prevS = c.s;
    vAllow = limit === Infinity ? vmax : Math.sqrt(2 * TRAF_DEC * H * Math.max(0, limit - c.s));
    c.v = Math.min(c.v + TRAF_ACC * H * dt, c.parade ? vmax * 0.6 : vmax, vAllow);
    c.s += c.v * dt;
    if (c.s > limit) { c.s = Math.max(prevS, limit); c.v = 0; }
    c.roll += (c.s - prevS) / (len * 0.11);
    if (prevV > vmax * 0.45 && c.v < vmax * 0.1) c.squashT = 0.35;   // napakka jarrutus
    if (c.squashT > 0) c.squashT -= dt;
    if (c.honkT > 0) c.honkT -= dt;
    c.blinkT -= dt;
    if (c.blinkT < -0.15) c.blinkT = 2 + Math.random() * 3;
    // Ohitti pysäytysviivan: ryhmän kupla helpottaa
    if (firstK >= 0 && prevS <= firstSl + 0.5 && c.s > firstSl + 0.5) {
      cr = traf.cross[firstK];
      cr.pc = Math.max(0, cr.pc - TRAF_RELIEF_C);
    }
    c.waitK = c.v < vmax * 0.08 ? firstK : -1;
    if (c.waitK >= 0) c.waitT += dt; else c.waitT = 0;
    // Laskettu, kun kaikki suojatiet on ohitettu
    if (!c.counted && !c.parade) {
      lastZe = -Infinity;
      for (j = 0; j < traf.cross.length; j++) lastZe = Math.max(lastZe, trafZebraEndS(traf.cross[j], c.dir));
      if (c.s - len > lastZe) {
        c.counted = true;
        traf.passedC++;
        traf.popC = 0.4;
        playNote(523 + Math.min(12, traf.passedC) * 40, 0, 0.12, 'triangle', 0.22);
      }
    }
  }
  for (i = traf.cars.length - 1; i >= 0; i--) {
    c = traf.cars[i];
    end = c.dir > 0 ? viewW : 0;
    if (!c.parade && c.s - trafLen(c) > end + viewH * 0.05) traf.cars.splice(i, 1);
  }
}
function trafUpdateBunnies(dt) {
  var i, j, b, cr, tx, d, step, sp = viewH * 0.32, k, H = viewH;
  for (j = 0; j < traf.cross.length; j++) {
    cr = traf.cross[j];
    // Jonon ensimmäinen lähtee, kun pupujen valo on vihreä ja suojatie tyhjä
    b = cr.queue[0];
    if (b && b.state === 'queue' && trafBunnyGo(cr) && cr.lastStart >= TRAF_BUNNY_GAP && trafZebraClear(j) && traf.phase !== 'parade') {
      cr.queue.shift();
      b.state = 'cross';
      b.t = 0;
      b.x0 = b.x;
      b.cx = cr.x + (Math.random() - 0.5) * trafZW() * 0.9;
      cr.lastStart = 0;
      cr.pb = Math.max(0, cr.pb - TRAF_RELIEF_B);
      playNote(620, 0, 0.08, 'sine', 0.2);
      playNote(840, 0.06, 0.1, 'sine', 0.18);
    }
  }
  for (i = traf.bunnies.length - 1; i >= 0; i--) {
    b = traf.bunnies[i];
    b.t += dt;
    if (b.waveT > 0) b.waveT -= dt;
    if (b.stompT > 0) b.stompT -= dt;
    cr = traf.cross[b.k];
    if (b.state === 'arrive' || b.state === 'queue') {
      tx = trafSlotX(cr, cr.queue.indexOf(b));
      d = tx - b.x;
      step = sp * dt;
      if (Math.abs(d) > step) { b.x += d > 0 ? step : -step; b.moving = true; }
      else { b.x = tx; b.moving = false; if (b.state === 'arrive') b.state = 'queue'; }
      b.y = trafNearY();
    } else if (b.state === 'cross') {
      // Valon vaihduttua kesken ylityksen pupu kiirehtii
      if (!trafBunnyGo(cr)) b.t += dt * 0.4;
      k = Math.min(1, b.t / TRAF_CROSS_T);
      b.x = b.x0 + (b.cx - b.x0) * Math.min(1, k * 4);
      b.y = trafNearY() + (trafFarY() - trafNearY()) * k;
      if (k >= 1) {
        b.state = 'leave';
        b.t = 0;
        b.dirOut = b.x < viewW * 0.5 ? -1 : 1;
        traf.crossedB++;
        traf.popB = 0.4;
        spawnSparkles(b.x, b.y - H * 0.05, 6, '#ffe27a');
        playNote(784, 0, 0.1, 'triangle', 0.22);
        playNote(1047, 0.08, 0.16, 'triangle', 0.22);
      }
    } else if (b.state === 'leave') {
      b.x += b.dirOut * sp * 1.1 * dt;
      b.y = trafFarY();
      if (b.x < -H * 0.1 || b.x > viewW + H * 0.1) traf.bunnies.splice(i, 1);
    }
  }
}
function trafUpdatePatience(dt) {
  var i, j, cr, nb, nc, rate, R = trafR(), b, lead;
  for (i = 0; i < traf.cross.length; i++) {
    cr = traf.cross[i];
    nb = 0;
    for (j = 0; j < cr.queue.length; j++) if (cr.queue[j].state === 'queue') nb++;
    nc = 0;
    for (j = 0; j < traf.cars.length; j++) if (traf.cars[j].waitK === i) nc++;
    // Puput
    if (nb > 0 && !trafBunnyGo(cr)) {
      rate = (1 + 0.15 * Math.min(3, nb - 1)) / R.fill;
      cr.pb += rate * dt;
    } else {
      cr.pb = Math.max(0, cr.pb - TRAF_DRAIN * dt * (nb > 0 ? 0.5 : 1));
    }
    // Autot
    if (nc > 0 && !trafCarMayGo(i)) {
      rate = (1 + 0.15 * Math.min(3, nc - 1)) / R.fill;
      cr.pc += rate * dt;
    } else {
      cr.pc = Math.max(0, cr.pc - TRAF_DRAIN * dt * (nc > 0 ? 0.5 : 1));
    }
    if (cr.pb >= 1) trafSulk(cr, 'b');
    if (cr.pc >= 1) trafSulk(cr, 'c');
    // Kärsimättömyys kuuluu: tööttäys ja tömistely
    if (cr.pc > 0.55 && nc > 0) {
      cr.honkT -= dt;
      if (cr.honkT <= 0) {
        lead = trafLeadCar(i);
        if (lead) trafHonk(lead, 0.8);
        cr.honkT = 1.1 + (1 - cr.pc) * 2.5;
      }
    } else cr.honkT = Math.max(cr.honkT, 0.6);
    if (cr.pb > 0.55 && nb > 0) {
      cr.stompT -= dt;
      if (cr.stompT <= 0) {
        b = cr.queue[0];
        if (b) b.stompT = 0.5;
        playNote(110, 0, 0.1, 'sine', 0.3);
        playNote(98, 0.12, 0.1, 'sine', 0.3);
        cr.stompT = 1.2 + (1 - cr.pb) * 2.5;
      }
    } else cr.stompT = Math.max(cr.stompT, 0.6);
  }
}
// Odottavan autoryhmän ensimmäinen (lähimpänä pysäytysviivaa)
function trafLeadCar(k) {
  var i, c, best = null;
  for (i = 0; i < traf.cars.length; i++) {
    c = traf.cars[i];
    if (c.waitK !== k) continue;
    if (!best || trafStopS(traf.cross[k], c.dir) - c.s < trafStopS(traf.cross[k], best.dir) - best.s) best = c;
  }
  return best;
}
function trafSulk(cr, who) {
  var hs = viewH * 0.022, x;
  if (who === 'b') { cr.pb = TRAF_SULK_BACK; cr.sulkB = TRAF_SULK_T; }
  else { cr.pc = TRAF_SULK_BACK; cr.sulkC = TRAF_SULK_T; }
  traf.sulks++;
  if (traf.meter > 1) {
    traf.meter--;
    x = trafHudStarX(traf.meter);
    artPop(x, viewH * 0.063, hs * 1.6, '#8a8aa8', 'ring');
    traf.starPop = 0.6;
  }
  playNote(330, 0, 0.2, 'triangle', 0.25);
  playNote(247, 0.18, 0.4, 'triangle', 0.25);
  if (who === 'c') {
    var lead = trafLeadCar(traf.cross.indexOf(cr));
    if (lead) { lead.honkT = 0.9; playNote(196, 0.05, 0.6, 'square', 0.08); }
  }
}
function trafRoundDone() {
  traf.phase = 'done';
  traf.phaseT = 0;
  traf.meters[traf.round] = traf.meter;
  soundFanfare();
  spawnSparkles(viewW / 2, viewH * 0.35, 24, '#ffe27a');
}

// ---------- Paraati ja juhla ----------
function trafStartParade() {
  var i, H = viewH, P;
  traf.phase = 'parade';
  traf.phaseT = 0;
  traf.cars = [];
  for (i = 0; i < traf.cross.length; i++) { traf.cross[i].queue = []; traf.cross[i].state = 'cars'; traf.cross[i].trans = 0; }
  P = { t: 0, note: 0, cars: [], bunnies: [], started: false };
  for (i = 0; i < 5; i++) {
    P.cars.push(trafAddCar(1, i === 2 ? 'bus' : 'car', { s: -H * 0.05 - i * H * 0.26, v: TRAF_SPEED * H * 0.5, col: TRAF_CAR_COLS[i] }));
  }
  traf.bunnies = [];
  for (i = 0; i < 6; i++) {
    traf.bunnies.push({
      k: 0, state: 'parade', x: -H * 0.1 - i * H * 0.13, y: trafFarY(), x0: 0, cx: 0, t: i * 0.4,
      waveT: 0, stompT: 0, scarf: TRAF_SCARVES[i % TRAF_SCARVES.length], dirOut: 1
    });
  }
  P.bunnies = traf.bunnies;
  traf.parade = P;
}
function trafUpdateParade(dt) {
  var P = traf.parade, i, b, idx, H = viewH;
  P.t += dt;
  traf.phaseT += dt;
  for (i = 0; i < traf.cross.length; i++) traf.cross[i].blink += dt;
  trafUpdateCars(dt);
  for (i = 0; i < P.bunnies.length; i++) {
    b = P.bunnies[i];
    b.t += dt;
    b.x += H * 0.2 * dt;
    if (b.x > viewW + H * 0.1) b.x -= viewW + H * 0.4;
    if (b.waveT > 0) b.waveT -= dt;
  }
  // Tööttäyssävelmä: jokainen nuotti tulee vuorollaan eri autosta
  if (P.note < TRAF_TUNE.length && P.t > 0.8 + P.note * 0.26) {
    idx = P.note % P.cars.length;
    P.cars[idx].honkT = 0.25;
    playNote(TRAF_TUNE[P.note], 0, 0.2, 'square', 0.07);
    playNote(TRAF_TUNE[P.note] * 2, 0, 0.18, 'triangle', 0.12);
    P.bunnies[P.note % P.bunnies.length].waveT = 0.5;
    P.note++;
  }
  // Autot kiertävät ruudun ympäri juhlan ajan
  for (i = 0; i < P.cars.length; i++) {
    if (P.cars[i].s - trafLen(P.cars[i]) > viewW) P.cars[i].s -= viewW + H * 0.6;
  }
  if (!P.started && P.t > 0.8 + TRAF_TUNE.length * 0.26 + 0.3) {
    P.started = true;
    startCelebration();
  }
}

// ---------- Tökättävät koristeet ----------
function trafSetupProps() {
  var H = viewH, W = viewW;
  propsReset();
  // Kukkakioski ylemmällä jalkakäytävällä
  propAdd({ x: W * 0.085, y: H * 0.49, r: H * 0.1, hy: H * 0.09, layer: 0, color: '#ff7bac', note: 784, draw: trafDrawKiosk, poke: trafPokeKiosk });
  // Pupupoliisi pillin kanssa
  propAdd({ x: W * 0.925, y: H * 0.49, r: H * 0.08, hy: H * 0.07, layer: 0, color: '#5fa8ff', note: 1175, draw: trafDrawCop, poke: trafPokeCop });
  // Katulyhty alemmalla jalkakäytävällä
  propAdd({ x: W * 0.035, y: H * 0.89, r: H * 0.07, hy: H * 0.33, layer: 1, color: '#ffe27a', note: 659, draw: trafDrawLamp, poke: trafPokeLamp });
}
function trafUpdatePropFx(dt) {
  if (traf.cop.hatT > 0) traf.cop.hatT -= dt;
  if (traf.cop.armT > 0) traf.cop.armT -= dt;
  if (traf.lamp.glowT > 0) traf.lamp.glowT -= dt;
  if (traf.lamp.birdT > 0) traf.lamp.birdT -= dt;
  if (traf.kiosk.peekT > 0) traf.kiosk.peekT -= dt;
}
function trafPokeCop(p) {
  traf.cop.armT = 1.0;
  playNote(2093, 0.02, 0.06, 'square', 0.06);
  playNote(2349, 0.09, 0.06, 'square', 0.06);
  playNote(2093, 0.16, 0.08, 'square', 0.06);
  if (p.n % 3 === 0) {
    // Yllätys: hattu lentää ilmaan ja pilli soi pitkään
    traf.cop.hatT = 1.6;
    playNote(2637, 0.3, 0.6, 'square', 0.05);
    spawnSparkles(p.x, p.y - viewH * 0.16, 12, '#5fa8ff');
  }
}
function trafPokeLamp(p) {
  traf.lamp.glowT = 1.5;
  if (p.n % 3 === 0) {
    // Yllätys: lintu laskeutuu lampun päälle ja laulaa
    traf.lamp.birdT = 4.5;
    playNote(1568, 0.2, 0.08, 'sine', 0.2);
    playNote(1760, 0.32, 0.08, 'sine', 0.2);
    playNote(2093, 0.44, 0.15, 'sine', 0.2);
    playNote(1760, 0.62, 0.1, 'sine', 0.2);
  }
}
function trafPokeKiosk(p) {
  var i, H = viewH;
  for (i = 0; i < 2; i++) propDropBall(p.x + (Math.random() - 0.5) * H * 0.08, p.y - H * 0.12, H * 0.012, TRAF_SCARVES[(p.n + i) % TRAF_SCARVES.length], p.y + H * 0.005);
  if (p.n % 3 === 0) {
    // Yllätys: myyjäpupu kurkkaa ja kukkakimppu lentää
    traf.kiosk.peekT = 3;
    propDrop({
      x: p.x, y: p.y - H * 0.13, vx: H * 0.12, vy: -H * 0.6, ground: p.y + H * 0.005, life: 3.2,
      draw: function (c) { trafDrawBouquet(c, 0, 0, H * 0.03); }
    });
    playNote(1047, 0.05, 0.12, 'triangle', 0.25);
    playNote(1319, 0.17, 0.12, 'triangle', 0.25);
    playNote(1568, 0.29, 0.25, 'triangle', 0.25);
  }
}
function trafDrawBouquet(c, x, y, s) {
  artLimb(c, x, y + s * 1.1, x - s * 0.3, y, s * 0.12, '#5fb84a', '#2e7a2a');
  artLimb(c, x, y + s * 1.1, x + s * 0.3, y - s * 0.1, s * 0.12, '#5fb84a', '#2e7a2a');
  drawFlower(c, x - s * 0.35, y - s * 0.1, s * 0.4, '#ff7bac');
  drawFlower(c, x + s * 0.35, y - s * 0.2, s * 0.4, '#ffd24f');
  drawFlower(c, x, y - s * 0.45, s * 0.4, '#b678ff');
  artBlob(c, x, y + s * 0.7, s * 0.35, s * 0.45, '#fff2f8', { lineColor: '#c88aa8' });
}
function trafDrawKiosk(c, p) {
  var H = viewH, w = H * 0.2, i, x;
  artShadow(c, 0, 0, w * 0.6, H * 0.012, 0.18);
  // Myyjäpupu kurkkaa tiskin takaa
  if (traf.kiosk.peekT > 0) {
    var k = Math.min(1, traf.kiosk.peekT * 2, (3 - traf.kiosk.peekT) * 3);
    drawBunny(c, w * 0.1, -H * 0.075 - k * H * 0.035, H * 0.04, 0, globalT * 4, true);
  }
  artRoundRect(c, -w / 2, -H * 0.085, w, H * 0.085, H * 0.01, '#ffe8d0', { lineColor: '#b8865a' });
  artRoundRect(c, -w / 2 - H * 0.005, -H * 0.09, w + H * 0.01, H * 0.016, H * 0.006, '#c8845a', { lineColor: '#7a4422' });
  // Raidallinen markiisi tolppien päällä
  artLimb(c, -w * 0.45, -H * 0.085, -w * 0.45, -H * 0.17, H * 0.008, '#ffffff', '#b8a0b0');
  artLimb(c, w * 0.45, -H * 0.085, w * 0.45, -H * 0.17, H * 0.008, '#ffffff', '#b8a0b0');
  for (i = 0; i < 5; i++) {
    x = -w * 0.55 + i * w * 0.22;
    c.beginPath(); c.moveTo(x, -H * 0.19); c.lineTo(x + w * 0.22, -H * 0.19); c.lineTo(x + w * 0.22, -H * 0.16); c.quadraticCurveTo(x + w * 0.11, -H * 0.14, x, -H * 0.16); c.closePath();
    artFillPath(c, i % 2 ? '#ffffff' : '#ff7bac', -H * 0.19, -H * 0.14, H * 0.02, { lineColor: '#c0506a', line: Math.max(1, H * 0.002) });
  }
  // Kukkaämpärit tiskillä
  for (i = 0; i < 3; i++) {
    x = -w * 0.32 + i * w * 0.32;
    artRoundRect(c, x - H * 0.018, -H * 0.12, H * 0.036, H * 0.03, H * 0.006, ['#5fa8ff', '#ffd24f', '#6fd66f'][i], { line: Math.max(1, H * 0.002) });
    drawFlower(c, x - H * 0.01, -H * 0.13, H * 0.012, TRAF_SCARVES[i]);
    drawFlower(c, x + H * 0.01, -H * 0.135, H * 0.012, TRAF_SCARVES[i + 3]);
  }
}
function trafDrawCop(c, p) {
  var H = viewH, s = H * 0.05, arm = traf.cop.armT > 0 ? Math.sin(traf.cop.armT * 14) * 0.5 : 0, hk, hy;
  // Pieni korokepalli
  artBlob(c, 0, -H * 0.006, s * 0.9, s * 0.22, '#ffffff', { lineColor: '#9a9ab8' });
  drawBunny(c, 0, -H * 0.01, s, 0, globalT * 2, false);
  // Sininen liivi
  artBlob(c, 0, -H * 0.01 - s * 0.5, s * 0.5, s * 0.36, '#5fa8ff', { lineColor: '#2a5a9a' });
  artCircle(c, 0, -H * 0.01 - s * 0.6, s * 0.08, '#ffd24f', { lineColor: '#a07010' });
  // Viittova käsi
  artLimb(c, s * 0.4, -H * 0.01 - s * 0.7, s * 0.4 + Math.cos(-1.2 + arm) * s * 0.55, -H * 0.01 - s * 0.7 + Math.sin(-1.2 + arm) * s * 0.55, s * 0.17, '#ffffff', BUNNY_LINE);
  // Pilli suussa (kultainen, jos kukaan ei ole kiukutellut juhlassa)
  var gold = celebrating && traf.sulks === 0;
  artRoundRect(c, s * 0.02, -H * 0.01 - s * 0.88, s * 0.32, s * 0.1, s * 0.05, gold ? '#ffd24f' : '#d8dce8', { lineColor: gold ? '#a07010' : '#6a6a8a' });
  if (gold) artGlow(c, s * 0.2, -H * 0.01 - s * 0.84, s * 0.4, '#ffe27a', 0.6);
  // Poliisin hattu (3. tökkäys: lentää ilmaan ja putoaa takaisin)
  hk = traf.cop.hatT > 0 ? Math.sin((1 - traf.cop.hatT / 1.6) * Math.PI) : 0;
  hy = -H * 0.01 - s * 1.42 - hk * H * 0.12;
  c.save();
  c.translate(0, hy);
  c.rotate(hk * Math.PI * 2 * (1 - traf.cop.hatT / 1.6));
  artRoundRect(c, -s * 0.36, -s * 0.28, s * 0.72, s * 0.3, s * 0.1, '#3a5aa8', { lineColor: '#1a2a5a' });
  artBlob(c, 0, s * 0.03, s * 0.46, s * 0.08, '#1a2a5a', { line: false });
  drawStar(c, 0, -s * 0.13, s * 0.09, 0, 0);
  c.restore();
}
function trafDrawLamp(c, p) {
  var H = viewH, top = -H * 0.38, on = traf.lamp.glowT > 0 ? Math.min(1, traf.lamp.glowT) : 0, bk;
  artShadow(c, 0, 0, H * 0.03, H * 0.008, 0.2);
  artLimb(c, 0, 0, 0, top, H * 0.014, '#4a4a6a', '#2a2a3a');
  artRoundRect(c, -H * 0.018, -H * 0.03, H * 0.036, H * 0.03, H * 0.006, '#4a4a6a', { lineColor: '#2a2a3a' });
  if (on > 0) artGlow(c, 0, top - H * 0.02, H * 0.12, '#ffe27a', 0.7 * on);
  artCircle(c, 0, top - H * 0.02, H * 0.026, on > 0 ? '#fff6b0' : '#eef0f8', { lineColor: '#2a2a3a', hi: 0.4 });
  artBlob(c, 0, top - H * 0.045, H * 0.03, H * 0.01, '#4a4a6a', { lineColor: '#2a2a3a' });
  // Lintu lampun päällä
  if (traf.lamp.birdT > 0) {
    bk = Math.min(1, traf.lamp.birdT, (4.5 - traf.lamp.birdT) * 2);
    c.globalAlpha = bk;
    var by = top - H * 0.07 - Math.abs(Math.sin(globalT * 8)) * H * 0.006;
    artBlob(c, 0, by, H * 0.02, H * 0.016, '#ff9f4a', { lineColor: '#a0501a' });
    artCircle(c, H * 0.013, by - H * 0.014, H * 0.011, '#ff9f4a', { lineColor: '#a0501a' });
    artEye(c, H * 0.016, by - H * 0.016, H * 0.004, 1, false);
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.moveTo(H * 0.023, by - H * 0.016); c.lineTo(H * 0.033, by - H * 0.012); c.lineTo(H * 0.023, by - H * 0.009); c.closePath(); c.fill();
    if (Math.sin(globalT * 5) > 0.3) {
      c.fillStyle = '#7a5aa8';
      c.font = 'bold ' + Math.round(H * 0.025) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.fillText('♪', H * 0.05, by - H * 0.035);
    }
    c.globalAlpha = 1;
  }
}

// ---------- Piirto: tausta ----------
function renderTrafficBg(b, w, h) {
  var W = viewW, H = viewH, i, g, x, y, hx, hw, hh, col, roof, R = trafR(), cx, zw = trafZW(), r0 = trafRoadY0(), r1 = trafRoadY1(), j, n;
  g = b.createLinearGradient(0, 0, 0, H * 0.42);
  g.addColorStop(0, '#8fd0ff');
  g.addColorStop(1, '#e4f6ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, H);
  drawBgSun(b, W * 0.82, H * 0.1, H * 0.05, 0.2, '#fff4c8', '#fffdf0', '#ffd45a');
  drawCloud(b, W * 0.22, H * 0.09, H * 0.05, 0.85);
  drawCloud(b, W * 0.55, H * 0.06, H * 0.035, 0.7);
  // Kaukaiset kukkulat
  b.fillStyle = artMix('#9ad88a', '#e4f6ff', 0.45);
  b.beginPath(); b.moveTo(0, H * 0.3);
  for (x = 0; x <= W; x += 10) b.lineTo(x, H * 0.27 - Math.sin(x / W * 5.2 + 0.6) * H * 0.04);
  b.lineTo(W, H * 0.42); b.lineTo(0, H * 0.42); b.closePath(); b.fill();
  // Pupulan talorivi
  n = Math.max(5, Math.round(W / (H * 0.24)));
  for (i = 0; i < n; i++) {
    hx = (i + 0.5) * W / n;
    hw = H * (0.085 + (i % 3) * 0.012);
    hh = H * (0.13 + ((i * 7) % 3) * 0.025);
    y = H * 0.405;
    col = ['#ffd0b0', '#d8f0c8', '#fff0a8', '#e0d0ff', '#ffc8d8', '#c8e8ff'][i % 6];
    roof = ['#e8705a', '#5fa8d8', '#c86aa8', '#e89a3a', '#7a6ad8', '#e85a7a'][(i * 5) % 6];
    artRoundRect(b, hx - hw, y - hh, hw * 2, hh, H * 0.008, col, { lineColor: artShade(col, -0.4) });
    b.beginPath(); b.moveTo(hx - hw * 1.18, y - hh + H * 0.004); b.lineTo(hx, y - hh - H * 0.07); b.lineTo(hx + hw * 1.18, y - hh + H * 0.004); b.closePath();
    artFillPath(b, roof, y - hh - H * 0.07, y - hh, H * 0.03, { lineColor: artShade(roof, -0.45) });
    // Ikkunat ja ovi
    for (j = 0; j < 2; j++) {
      artRoundRect(b, hx - hw * 0.7 + j * hw * 0.95, y - hh + H * 0.03, hw * 0.45, H * 0.035, H * 0.006, '#bfe8ff', { lineColor: '#5a8ab0' });
      b.fillStyle = 'rgba(255,255,255,0.7)';
      b.fillRect(hx - hw * 0.7 + j * hw * 0.95 + hw * 0.2, y - hh + H * 0.03, Math.max(1, H * 0.003), H * 0.035);
    }
    artRoundRect(b, hx - hw * 0.18, y - H * 0.055, hw * 0.36, H * 0.055, hw * 0.16, '#a86a4a', { lineColor: '#6a3a22' });
    // Ikkunasta kurkkaa joskus pupu
    if (i % 3 === 1) drawBunny(b, hx - hw * 0.475, y - hh + H * 0.06, H * 0.016, 0, 0, true);
    // Kukkalaatikko ikkunan alla
    if (i % 2 === 0) {
      artRoundRect(b, hx + hw * 0.25, y - hh + H * 0.066, hw * 0.45, H * 0.012, H * 0.004, '#c8845a', { line: false });
      drawFlower(b, hx + hw * 0.35, y - hh + H * 0.064, H * 0.007, '#ff7bac');
      drawFlower(b, hx + hw * 0.6, y - hh + H * 0.064, H * 0.007, '#ffd24f');
    }
  }
  // Pensaita talojen välissä
  for (i = 0; i < n - 1; i++) drawBush(b, (i + 1) * W / n, H * 0.41, H * 0.035);
  // Ylempi jalkakäytävä
  artRoundRect(b, -H * 0.02, H * 0.4, w + H * 0.04, r0 - H * 0.4, 0, '#f2e2cc', { lineColor: '#c8a888', flat: true });
  trafPavers(b, H * 0.41, r0 - H * 0.012);
  // Tie
  g = b.createLinearGradient(0, r0, 0, r1);
  g.addColorStop(0, '#8a88a8');
  g.addColorStop(1, '#6e6c8e');
  b.fillStyle = g;
  b.fillRect(0, r0, w, r1 - r0);
  b.fillStyle = '#d8c8b8';
  b.fillRect(0, r0 - H * 0.012, w, H * 0.014);
  b.fillRect(0, r1 - H * 0.002, w, H * 0.016);
  // Keskiviiva katkoviivana (ei suojateillä)
  b.fillStyle = 'rgba(255,240,180,0.85)';
  y = (r0 + r1) / 2 + H * 0.01;
  for (x = H * 0.02; x < W; x += H * 0.12) {
    var onZebra = false;
    for (i = 0; i < R.cross.length; i++) if (Math.abs(x + H * 0.03 - R.cross[i].fx * W) < zw + H * 0.06) onZebra = true;
    if (!onZebra) { roundRect(b, x, y - H * 0.005, H * 0.06, H * 0.01, H * 0.005); b.fill(); }
  }
  // Suojatiet ja pysäytysviivat
  for (i = 0; i < R.cross.length; i++) {
    cx = R.cross[i].fx * W;
    b.fillStyle = 'rgba(255,255,255,0.92)';
    for (y = r0 + H * 0.008; y < r1 - H * 0.02; y += H * 0.04) {
      roundRect(b, cx - zw, y, zw * 2, H * 0.024, H * 0.006);
      b.fill();
    }
    b.fillStyle = 'rgba(255,255,255,0.75)';
    b.fillRect(cx - zw - H * 0.04, (r0 + r1) / 2 + H * 0.02, H * 0.008, r1 - (r0 + r1) / 2 - H * 0.03);
    if (R.lanes.length > 1) b.fillRect(cx + zw + H * 0.032, r0 + H * 0.01, H * 0.008, (r1 - r0) / 2 - H * 0.01);
  }
  // Alempi jalkakäytävä ja nurmikaista
  artRoundRect(b, -H * 0.02, r1 + H * 0.012, w + H * 0.04, H * 0.11, 0, '#f2e2cc', { flat: true, line: false });
  trafPavers(b, r1 + H * 0.025, H * 0.89);
  g = b.createLinearGradient(0, H * 0.9, 0, H);
  g.addColorStop(0, '#8fdc7a');
  g.addColorStop(1, '#5fb84a');
  b.fillStyle = g;
  b.fillRect(0, H * 0.9, w, H * 0.1);
  for (i = 0; i < 14; i++) drawFlower(b, (i + 0.4) * W / 14 + ((i * 37) % 11) * H * 0.004, H * (0.93 + (i % 3) * 0.022), H * 0.011, TRAF_SCARVES[i % TRAF_SCARVES.length]);
}
function trafPavers(b, y0, y1) {
  var W = viewW, H = viewH, x, y, row = 0;
  b.strokeStyle = 'rgba(180,140,110,0.3)';
  b.lineWidth = Math.max(1, H * 0.002);
  for (y = y0; y < y1; y += H * 0.03) {
    b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke();
    for (x = (row % 2) * H * 0.04; x < W; x += H * 0.08) { b.beginPath(); b.moveTo(x, y); b.lineTo(x, Math.min(y1, y + H * 0.03)); b.stroke(); }
    row++;
  }
}

// ---------- Piirto: autot ja puput ----------
function trafCarMood(c) {
  if (c.waitK < 0 || c.parade) return 0;
  var cr = traf.cross[c.waitK];
  if (!cr) return 0;
  if (cr.sulkC > 0) return 3;
  return cr.pc > 0.7 ? 2 : cr.pc > 0.4 ? 1 : 0;
}
// cx, gy: keskikohta ja maa (oletuksena kaistalta; HUD antaa omansa)
function trafDrawCar(c, car, cx, gy) {
  var L = trafLen(car), h = viewH, mood = trafCarMood(car), sq = 0, i, col = car.col, line = artShade(col, -0.45), shake = 0, k;
  if (gy === undefined) { gy = trafLaneY(car.dir); cx = (car.s - L / 2) * car.dir; }
  if (car.squashT > 0) sq = Math.sin(car.squashT / 0.35 * Math.PI) * 0.12;
  if (car.honkT > 0) sq -= Math.sin(car.honkT / 0.45 * Math.PI * 2) * 0.06;
  if (mood >= 2) shake = Math.sin(globalT * 40) * h * 0.002;
  artShadow(c, cx, gy, L * 0.58, L * 0.07, 0.22);
  c.save();
  c.translate(cx + shake, gy);
  c.scale(car.dir, 1);
  artSquash(c, sq);
  var Lb = L, hb = viewH * 0.17 * Math.min(1, car.size);   // korkeus ei kasva bussin pituuden mukana
  if (car.kind === 'bus') {
    artRoundRect(c, -Lb / 2, -hb * 0.62, Lb, hb * 0.52, hb * 0.1, col, { lineColor: line, hi: 0.25 });
    for (i = 0; i < 3; i++) {
      artRoundRect(c, -Lb * 0.44 + i * Lb * 0.2, -hb * 0.56, Lb * 0.16, hb * 0.17, hb * 0.03, '#bfe8ff', { lineColor: '#4a7aa0' });
      drawBunny(c, -Lb * 0.36 + i * Lb * 0.2, -hb * 0.44, hb * 0.07, Math.abs(Math.sin(globalT * 5 + i)) * hb * 0.01, globalT * 3 + i, true);
    }
    artRoundRect(c, Lb * 0.2, -hb * 0.56, Lb * 0.24, hb * 0.2, hb * 0.04, '#bfe8ff', { lineColor: '#4a7aa0' });
    trafCarFace(c, Lb * 0.25, -hb * 0.47, hb, mood, car);
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.fillRect(-Lb * 0.48, -hb * 0.3, Lb * 0.96, hb * 0.03);
    trafCarMouth(c, Lb * 0.44, -hb * 0.22, hb, mood);
    artCircle(c, Lb * 0.47, -hb * 0.3, hb * 0.03, '#fff2a0', { lineColor: '#a08020' });
  } else {
    // Ohjaamo
    artRoundRect(c, -Lb * 0.3, -hb * 0.62, Lb * 0.52, hb * 0.34, hb * 0.1, col, { lineColor: line, hi: 0.3 });
    artRoundRect(c, -Lb * 0.25, -hb * 0.56, Lb * 0.18, hb * 0.18, hb * 0.04, '#bfe8ff', { lineColor: '#4a7aa0' });
    artRoundRect(c, -Lb * 0.03, -hb * 0.56, Lb * 0.21, hb * 0.2, hb * 0.04, '#bfe8ff', { lineColor: '#4a7aa0' });
    // Kori
    artRoundRect(c, -Lb / 2, -hb * 0.4, Lb, hb * 0.3, hb * 0.12, col, { lineColor: line, hi: 0.25 });
    trafCarFace(c, Lb * 0.075, -hb * 0.47, hb, mood, car);
    trafCarMouth(c, Lb * 0.42, -hb * 0.22, hb, mood);
    artCircle(c, Lb * 0.45, -hb * 0.31, hb * 0.035, '#fff2a0', { lineColor: '#a08020' });
    artBlush(c, Lb * 0.3, -hb * 0.24, hb * 0.04);
  }
  // Pyörät
  for (i = -1; i <= 1; i += 2) {
    var wx = i * Lb * 0.3, wy = -hb * 0.1;
    artCircle(c, wx, wy, hb * 0.11, '#3a3a4a', { lineColor: '#1a1a2a' });
    artCircle(c, wx, wy, hb * 0.05, '#e0e0f0', { line: false });
    c.strokeStyle = '#9a9ab0';
    c.lineWidth = Math.max(1, hb * 0.012);
    c.beginPath();
    for (k = 0; k < 2; k++) {
      var a = car.roll + k * Math.PI / 2;
      c.moveTo(wx - Math.cos(a) * hb * 0.05, wy - Math.sin(a) * hb * 0.05);
      c.lineTo(wx + Math.cos(a) * hb * 0.05, wy + Math.sin(a) * hb * 0.05);
    }
    c.stroke();
  }
  // Tööttäys: ääniaallot keulassa
  if (car.honkT > 0) {
    c.strokeStyle = 'rgba(255,255,255,' + Math.min(1, car.honkT * 3) + ')';
    c.lineWidth = Math.max(2, hb * 0.02);
    for (i = 0; i < 2; i++) {
      c.beginPath(); c.arc(Lb * 0.5, -hb * 0.28, hb * (0.1 + i * 0.08 + (0.45 - car.honkT) * 0.15), -0.6, 0.6); c.stroke();
    }
  }
  c.restore();
  // Kiukkuhöyry
  if (mood >= 2) {
    c.globalAlpha = 0.5;
    for (i = 0; i < 2; i++) {
      var pt = (globalT * 1.2 + i * 0.5) % 1;
      artCircle(c, cx + car.dir * L * 0.1 + i * h * 0.01, gy - hb * 0.68 - pt * h * 0.05, h * (0.008 + pt * 0.012), '#ffffff', { line: false });
    }
    c.globalAlpha = 1;
  }
}
function trafCarFace(c, x, y, hb, mood, car) {
  var r = hb * 0.045, blink = car.blinkT < 0;
  artEye(c, x - r * 1.1, y, r, 0.8, blink);
  artEye(c, x + r * 1.3, y, r, 0.8, blink);
  if (mood >= 1) {
    c.strokeStyle = '#2a2a3a';
    c.lineWidth = Math.max(1.5, r * 0.35);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - r * 2, y - r * (mood >= 2 ? 1.7 : 1.5)); c.lineTo(x - r * 0.4, y - r * (mood >= 2 ? 1.1 : 1.4));
    c.moveTo(x + r * 0.4, y - r * (mood >= 2 ? 1.1 : 1.4)); c.lineTo(x + r * 2.2, y - r * (mood >= 2 ? 1.7 : 1.5));
    c.stroke();
  }
}
function trafCarMouth(c, x, y, hb, mood) {
  var r = hb * 0.05;
  c.strokeStyle = '#4a2a3a';
  c.lineWidth = Math.max(1.5, hb * 0.014);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.4, y - r * 0.7);
  if (mood >= 2) c.quadraticCurveTo(x + r * 0.2, y - r * 0.9, x - r * 0.1, y + r * 0.5);
  else if (mood === 1) c.lineTo(x - r * 0.1, y + r * 0.5);
  else c.quadraticCurveTo(x + r * 0.6, y, x - r * 0.1, y + r * 0.6);
  c.stroke();
}
function trafBunnyMood(b) {
  var cr = traf.cross[b.k];
  if (!cr || b.state !== 'queue') return 0;
  if (cr.sulkB > 0) return 3;
  return cr.pb > 0.7 ? 2 : cr.pb > 0.4 ? 1 : 0;
}
function trafDrawBunny(c, b) {
  var s = trafBunnyS(), hop = 0, mood = trafBunnyMood(b), k, hx, hy, ear = b.t * 3, H = viewH;
  if (b.state === 'cross') {
    k = b.t / TRAF_CROSS_T;
    hop = Math.abs(Math.sin(k * Math.PI * 4)) * H * 0.028;
  } else if (b.moving || b.state === 'leave' || b.state === 'parade') {
    hop = Math.abs(Math.sin(b.t * 9)) * H * 0.018;
  }
  if (b.stompT > 0) hop = Math.abs(Math.sin(b.stompT * 18)) * H * 0.008;
  if (b.waveT > 0 && b.state === 'parade') hop += Math.sin(b.waveT / 0.5 * Math.PI) * H * 0.02;
  if (mood >= 2) ear = Math.sin(globalT * 14) * 2;
  drawBunny(c, b.x, b.y, s, hop, ear, false);
  // Huivi
  artBlob(c, b.x, b.y - hop - s * 0.7, s * 0.34, s * 0.09, b.scarf, { line: Math.max(1, s * 0.03) });
  artBlob(c, b.x + s * 0.18, b.y - hop - s * 0.58, s * 0.08, s * 0.14, b.scarf, { line: Math.max(1, s * 0.03), rot: 0.4 });
  hx = b.x;
  hy = b.y - hop - s * 1.05;
  if (mood >= 1) {
    // Äreät kulmat
    c.strokeStyle = '#7a5a8a';
    c.lineWidth = Math.max(1.5, s * 0.05);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(hx - s * 0.25, hy - s * (mood >= 2 ? 0.22 : 0.18)); c.lineTo(hx - s * 0.07, hy - s * (mood >= 2 ? 0.13 : 0.16));
    c.moveTo(hx + s * 0.07, hy - s * (mood >= 2 ? 0.13 : 0.16)); c.lineTo(hx + s * 0.25, hy - s * (mood >= 2 ? 0.22 : 0.18));
    c.stroke();
  }
  if (b.waveT > 0) {
    artLimb(c, hx + s * 0.4, hy + s * 0.45, hx + s * 0.75, hy - s * 0.05 - Math.sin(globalT * 14) * s * 0.2, s * 0.16, '#ffffff', BUNNY_LINE);
  }
}

// ---------- Piirto: valot ----------
function trafDrawLight(c, cr, idx) {
  var lp = trafLightPos(cr), H = viewH, x = lp.x, bw = H * 0.085, bh = H * 0.22, by = lp.top, r = H * 0.028, i, lit, col, k, wob = 0;
  var carRed, carYel, carGreen, bunGreen, party = traf.phase === 'parade';
  if (cr.tapT > 0) wob = Math.sin(cr.tapT * 30) * 0.04 * (cr.tapT / 0.45);
  carGreen = cr.state === 'cars' && cr.trans <= 0;
  carYel = cr.state === 'cars' && cr.trans > 0;
  carRed = cr.state === 'bunnies';
  bunGreen = cr.state === 'bunnies';
  artShadow(c, x, lp.base, H * 0.04, H * 0.01, 0.2);
  // Tolppa
  artLimb(c, x, lp.base, x, by + bh, H * 0.016, '#5a5a7a', '#2a2a3a');
  artRoundRect(c, x - H * 0.02, lp.base - H * 0.03, H * 0.04, H * 0.03, H * 0.006, '#5a5a7a', { lineColor: '#2a2a3a' });
  c.save();
  c.translate(x, by + bh);
  c.rotate(wob);
  c.translate(-x, -(by + bh));
  // Autojen valo: punainen, keltainen, vihreä
  artRoundRect(c, x - bw / 2, by, bw, bh, bw * 0.3, '#3a3a5a', { lineColor: '#1a1a2a', hi: 0.15 });
  for (i = 0; i < 3; i++) {
    col = ['#ff4a4a', '#ffc83a', '#4ade5a'][i];
    if (party) lit = Math.floor(cr.blink * 4) % 3 === i;
    else lit = i === 0 ? carRed : i === 1 ? carYel : carGreen;
    var ly = by + bh * (0.2 + i * 0.3);
    // Lippa
    artBlob(c, x, ly - r * 0.95, r * 1.15, r * 0.35, '#2a2a40', { line: false });
    if (lit) artGlow(c, x, ly, r * 2.6, col, 0.6);
    artCircle(c, x, ly, r, lit ? col : artMix(col, '#2a2a40', 0.72), { lineColor: '#1a1a2a', hi: lit ? 0.5 : 0.15 });
  }
  c.restore();
  // Pupujen valo tolpan jonon puolella: punainen seisova / vihreä hyppivä pupu
  var px = x + cr.qs * H * 0.055, py = H * 0.64, pw = H * 0.07, ph = H * 0.09, blinkOff;
  artLimb(c, x, py, px, py, H * 0.01, '#5a5a7a', '#2a2a3a');
  artRoundRect(c, px - pw / 2, py - ph / 2, pw, ph, pw * 0.25, '#3a3a5a', { lineColor: '#1a1a2a' });
  blinkOff = cr.state === 'bunnies' && cr.trans > 0 && Math.floor(cr.trans * 8) % 2 === 0;
  if (party) bunGreen = Math.floor(cr.blink * 3) % 2 === 0;
  col = bunGreen ? '#4ade5a' : '#ff4a4a';
  if (!blinkOff) {
    artGlow(c, px, py, pw * 0.9, col, 0.45);
    k = bunGreen ? Math.abs(Math.sin(globalT * 7)) * ph * 0.08 : 0;
    trafPupuSign(c, px, py + ph * 0.28 - k, ph * 0.3, col);
  }
  // Kärsimättömyys: valo hehkuu kutsuvasti, kun kupla on yli puolen
  if (!party && Math.max(cr.pb, cr.pc) > 0.5 && cr.trans <= 0) {
    c.strokeStyle = 'rgba(255,255,255,' + (0.35 + Math.sin(globalT * 6) * 0.25) + ')';
    c.lineWidth = Math.max(2, H * 0.006);
    roundRect(c, x - bw / 2 - H * 0.012, by - H * 0.012, bw + H * 0.024, bh + H * 0.024, bw * 0.4);
    c.stroke();
  }
}
// Pupun siluetti valossa
function trafPupuSign(c, x, y, s, col) {
  c.fillStyle = col;
  c.beginPath();
  if (c.ellipse) {
    c.ellipse(x, y - s * 0.45, s * 0.42, s * 0.42, 0, 0, Math.PI * 2);
    c.ellipse(x, y - s * 1.15, s * 0.3, s * 0.3, 0, 0, Math.PI * 2);
  } else {
    c.arc(x, y - s * 0.45, s * 0.42, 0, Math.PI * 2);
    c.arc(x, y - s * 1.15, s * 0.3, 0, Math.PI * 2);
  }
  c.fill();
  c.beginPath();
  if (c.ellipse) {
    c.ellipse(x - s * 0.13, y - s * 1.6, s * 0.09, s * 0.3, -0.2, 0, Math.PI * 2);
    c.ellipse(x + s * 0.13, y - s * 1.6, s * 0.09, s * 0.3, 0.2, 0, Math.PI * 2);
  }
  c.fill();
}

// ---------- Piirto: kuplat, nuolet, vihje ----------
function trafBubble(c, x, y, p, sulk, bunny) {
  var H = viewH, r = H * 0.032, col = p < 0.5 ? artMix('#6fd66f', '#ffd24f', p * 2) : artMix('#ffd24f', '#ff5a4a', (p - 0.5) * 2), shake = p > 0.75 ? Math.sin(globalT * 30) * H * 0.002 : 0;
  x += shake;
  if (sulk > 0) {
    // Kiukkupilvi ja sotkuviiva
    var k = Math.min(1, sulk * 2, (TRAF_SULK_T - sulk) * 4);
    c.globalAlpha = k;
    artBlob(c, x - r * 0.6, y, r * 0.9, r * 0.7, '#8a8aa8', { lineColor: '#4a4a6a' });
    artBlob(c, x + r * 0.6, y, r * 0.9, r * 0.7, '#8a8aa8', { lineColor: '#4a4a6a' });
    artBlob(c, x, y - r * 0.4, r, r * 0.8, '#9a9ab8', { lineColor: '#4a4a6a' });
    c.strokeStyle = '#2a2a3a';
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.beginPath();
    var i;
    for (i = 0; i <= 8; i++) c.lineTo(x - r * 0.8 + i * r * 0.2, y - r * 0.2 + (i % 2 ? -1 : 1) * r * 0.25 + Math.sin(globalT * 20 + i) * r * 0.05);
    c.stroke();
    c.globalAlpha = 1;
    return;
  }
  // Puhekupla ja täyttyvä kaari
  c.beginPath(); c.moveTo(x - r * 0.3, y + r * 0.85); c.lineTo(x, y + r * 1.45); c.lineTo(x + r * 0.35, y + r * 0.8); c.closePath();
  c.fillStyle = '#ffffff'; c.fill();
  artCircle(c, x, y, r, '#ffffff', { lineColor: '#9a8ab0', flat: true });
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x, y); c.arc(x, y, r * 0.82, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p)); c.closePath(); c.fill();
  // Pikkunaama: hymy -> suora -> mutru
  c.fillStyle = '#3a2a4a';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.12, r * 0.09, 0, Math.PI * 2); c.arc(x + r * 0.28, y - r * 0.12, r * 0.09, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#3a2a4a';
  c.lineWidth = Math.max(1.2, r * 0.1);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.25, y + r * 0.28);
  c.quadraticCurveTo(x, y + r * (0.28 + (0.4 - p) * 0.6), x + r * 0.25, y + r * 0.28);
  c.stroke();
  if (bunny) {
    // Pupun korvat kuplan päällä kertovat, kenen kupla
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#9a8ab0';
    c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath();
    if (c.ellipse) { c.ellipse(x - r * 0.35, y - r * 1.15, r * 0.18, r * 0.42, -0.2, 0, Math.PI * 2); }
    c.fill(); c.stroke();
    c.beginPath();
    if (c.ellipse) { c.ellipse(x + r * 0.35, y - r * 1.15, r * 0.18, r * 0.42, 0.2, 0, Math.PI * 2); }
    c.fill(); c.stroke();
  }
}
function trafArrow(c, x, y, dx, dy, col) {
  var H = viewH, s = H * 0.022, b = Math.sin(globalT * 6) * H * 0.008, a = Math.atan2(dy, dx);
  c.save();
  c.translate(x + dx * b, y + dy * b);
  c.rotate(a);
  c.beginPath();
  c.moveTo(s * 1.2, 0); c.lineTo(-s * 0.2, -s * 0.9); c.lineTo(-s * 0.2, -s * 0.38); c.lineTo(-s * 1.1, -s * 0.38);
  c.lineTo(-s * 1.1, s * 0.38); c.lineTo(-s * 0.2, s * 0.38); c.lineTo(-s * 0.2, s * 0.9); c.closePath();
  artFillPath(c, col, -s, s, s, { lineColor: '#ffffff', line: Math.max(2, s * 0.18) });
  c.restore();
}
function trafDrawGroups(c) {
  var i, cr, b, lead, L, x, y, H = viewH, nb, j;
  for (i = 0; i < traf.cross.length; i++) {
    cr = traf.cross[i];
    b = cr.queue[0];
    nb = 0;
    for (j = 0; j < cr.queue.length; j++) if (cr.queue[j].state === 'queue') nb++;
    if (b && nb > 0) {
      x = b.x; y = trafNearY() - H * 0.17;
      if (cr.pb > 0.04 || cr.sulkB > 0) trafBubble(c, x - cr.qs * H * 0.0, y - H * 0.03, cr.pb, cr.sulkB, true);
      if (!trafBunnyGo(cr) && traf.phase === 'play') trafArrow(c, x + cr.qs * H * 0.06, y + H * 0.03, 0, -1, '#ff7bac');
    }
    lead = trafLeadCar(i);
    if (lead) {
      L = trafLen(lead);
      x = (lead.s - L * 0.72) * lead.dir;
      y = trafLaneY(lead.dir) - H * 0.18;
      if (cr.pc > 0.04 || cr.sulkC > 0) trafBubble(c, x, y, cr.pc, cr.sulkC, false);
      if (!trafCarMayGo(i) && traf.phase === 'play') trafArrow(c, (lead.s - L * 0.3) * lead.dir, trafLaneY(lead.dir) - H * 0.14, lead.dir, 0, '#5fa8ff');
    }
  }
}
function trafHintCross() {
  var i, cr, best = -1, bp = -1, p, waiting;
  for (i = 0; i < traf.cross.length; i++) {
    cr = traf.cross[i];
    if (cr.trans > 0) continue;
    waiting = cr.state === 'cars' ? cr.queue.length > 0 && cr.queue[0].state === 'queue' : !!trafLeadCar(i);
    if (!waiting) continue;
    p = cr.state === 'cars' ? cr.pb : cr.pc;
    if (p > bp) { bp = p; best = i; }
  }
  if (best < 0) return -1;
  if (traf.round === 0 && !traf.tapped && bp > 0.06) return best;
  if (traf.idleT > TRAF_HINT_IDLE && bp > 0.5) return best;
  return -1;
}
function trafDrawHint(c) {
  var k = trafHintCross(), lp, H = viewH, s = H * 0.07, press;
  if (k < 0 || traf.phase !== 'play') return;
  lp = trafLightPos(traf.cross[k]);
  press = Math.max(0, Math.sin(globalT * 4));
  c.globalAlpha = 0.85;
  c.strokeStyle = 'rgba(255,255,255,' + (0.4 + press * 0.5) + ')';
  c.lineWidth = Math.max(2, H * 0.005);
  c.beginPath(); c.arc(lp.x, lp.top + H * 0.11, H * (0.05 + press * 0.04), 0, Math.PI * 2); c.stroke();
  // Käsi painaa valon yläreunaa, ei peitä lamppuja
  drawHand(c, lp.x + s * 0.05, lp.top - s * 0.95 - (1 - press) * s * 0.4, s);
  c.globalAlpha = 1;
}

// ---------- Piirto: HUD ja kortit ----------
function trafHudStarX(i) { return hudX() + viewH * 0.37 + i * viewH * 0.042; }
function trafDrawHud(c) {
  var H = viewH, R = trafR(), x0 = hudX(), y = H * 0.063, w = trafHudStarX(TRAF_METER - 1) + H * 0.035 - x0, i, pb, pc, sc;
  drawHudPanel(c, x0, H * 0.018, w, H * 0.09, H * 0.025);
  c.font = 'bold ' + Math.round(H * 0.036) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  // Puput
  pb = traf.popB > 0 ? 1 + Math.sin(traf.popB / 0.4 * Math.PI) * 0.3 : 1;
  c.save(); c.translate(x0 + H * 0.04, y + H * 0.012); c.scale(pb, pb);
  drawBunny(c, 0, 0, H * 0.03, 0, globalT * 2, true);
  c.restore();
  trafHudText(c, Math.min(traf.crossedB, R.bunnies) + '/' + R.bunnies, x0 + H * 0.068, y);
  // Autot
  pc = traf.popC > 0 ? 1 + Math.sin(traf.popC / 0.4 * Math.PI) * 0.3 : 1;
  c.save(); c.translate(x0 + H * 0.2, y + H * 0.024); c.scale(pc * 0.3, pc * 0.3);
  trafDrawCar(c, { dir: 1, kind: 'car', size: 1, col: '#5fb8ff', s: 0, roll: 0, honkT: 0, squashT: 0, waitK: -1, blinkT: 1 }, 0, 0);
  c.restore();
  trafHudText(c, Math.min(traf.passedC, R.cars) + '/' + R.cars, x0 + H * 0.24, y);
  // Tähtimittari
  for (i = 0; i < TRAF_METER; i++) {
    sc = traf.starPop > 0 && i === traf.meter ? 1 + traf.starPop : 1;
    if (i < traf.meter) drawStar(c, trafHudStarX(i), y, H * 0.018 * (traf.phase === 'done' ? 1 + Math.sin(globalT * 6 + i) * 0.1 : 1), 0, traf.phase === 'done' ? 0.6 : 0.2);
    else { c.globalAlpha = 0.3; drawStar(c, trafHudStarX(i), y, H * 0.016 * sc, 0, 0); c.globalAlpha = 1; }
  }
  c.textBaseline = 'alphabetic';
}
function trafHudText(c, txt, x, y) {
  c.lineWidth = Math.max(2, viewH * 0.007);
  c.strokeStyle = '#ffffff';
  c.strokeText(txt, x, y);
  c.fillStyle = '#5a3a7a';
  c.fillText(txt, x, y);
}
// Kierroksen alussa tavoitekortti: puput × N ja autot × M, kierrospallot
function trafDrawIntro(c) {
  var H = viewH, R = trafR(), t = traf.phaseT, k, a, x = viewW / 2, y = H * 0.155, i, w = H * 0.5, hh = H * 0.15;
  if (traf.phase !== 'play' || t > TRAF_INTRO_T) return;
  k = easeOutBack(Math.min(1, t / 0.4));
  a = Math.min(1, (TRAF_INTRO_T - t) / 0.4);
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  c.scale(k, k);
  drawHudPanel(c, -w / 2, -hh / 2, w, hh, H * 0.03);
  c.font = 'bold ' + Math.round(H * 0.06) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  drawBunny(c, -w * 0.33, H * 0.025, H * 0.05, 0, globalT * 3, true);
  trafHudText(c, '' + R.bunnies, -w * 0.24, -H * 0.005);
  c.save(); c.translate(w * 0.06, H * 0.04); c.scale(0.5, 0.5);
  trafDrawCar(c, { dir: 1, kind: 'car', size: 1, col: '#ff6b8a', s: 0, roll: 0, honkT: 0, squashT: 0, waitK: -1, blinkT: 1 }, 0, 0);
  c.restore();
  trafHudText(c, '' + R.cars, w * 0.2, -H * 0.005);
  for (i = 0; i < TRAF_ROUNDS.length; i++) {
    artCircle(c, (i - 1) * H * 0.04, hh / 2 + H * 0.02, H * 0.012, i <= traf.round ? '#ffd24f' : '#ffffff', { lineColor: '#a08040' });
  }
  c.restore();
  c.textBaseline = 'alphabetic';
  c.globalAlpha = 1;
}
// Kierros läpi: tähdet kortissa
function trafDrawDone(c) {
  var H = viewH, t = traf.phaseT, k, i, n = traf.meters[traf.round] || 0, x = viewW / 2, y = H * 0.17, a;
  if (traf.phase !== 'done') return;
  k = easeOutBack(Math.min(1, t / 0.45));
  a = Math.min(1, (2.8 - t) / 0.3);
  c.save();
  c.globalAlpha = Math.max(0, a);
  c.translate(x, y);
  c.scale(k, k);
  drawHudPanel(c, -H * 0.27, -H * 0.07, H * 0.54, H * 0.14, H * 0.03);
  for (i = 0; i < TRAF_METER; i++) {
    if (i < n) drawStar(c, (i - 2) * H * 0.095, 0, H * 0.04 * Math.min(1, Math.max(0, (t - 0.3 - i * 0.15) * 4)), Math.sin(globalT * 2 + i) * 0.2, 0.7);
    else { c.globalAlpha = 0.25 * Math.max(0, a); drawStar(c, (i - 2) * H * 0.095, 0, H * 0.032, 0, 0); c.globalAlpha = Math.max(0, a); }
  }
  c.restore();
  c.globalAlpha = 1;
}

function drawTraffic() {
  var c = ctx, i, list = [], d, H = viewH;
  if (!beginPlayWorld()) return;
  propsDraw(c, 0);
  // Syvyysjärjestys: kaikki maan y-koordinaatin mukaan
  for (i = 0; i < traf.cars.length; i++) list.push({ y: trafLaneY(traf.cars[i].dir), car: traf.cars[i] });
  for (i = 0; i < traf.bunnies.length; i++) list.push({ y: traf.bunnies[i].y, bunny: traf.bunnies[i] });
  for (i = 0; i < traf.cross.length; i++) list.push({ y: H * 0.885, light: traf.cross[i], k: i });
  list.sort(function (p, q) { return p.y - q.y; });
  for (i = 0; i < list.length; i++) {
    d = list[i];
    if (d.car) trafDrawCar(c, d.car);
    else if (d.bunny) trafDrawBunny(c, d.bunny);
    else trafDrawLight(c, d.light, d.k);
  }
  propsDraw(c, 1);
  if (traf.phase !== 'parade') trafDrawGroups(c);
  trafDrawHint(c);
  drawParticlesLayer(c);
  endPlayWorld();
  trafDrawHud(c);
  trafDrawIntro(c);
  trafDrawDone(c);
  drawTaskOverlay(c);
}

// ---------- Sokkelon huonekuvake: pieni liikennevalo ----------
HUB_ICONS.traffic = function (c, x, y, s) {
  var i, bw = s * 0.16, bh = s * 0.36, cols = ['#ff4a4a', '#ffc83a', '#4ade5a'];
  artLimb(c, x, y + s * 0.3, x, y + s * 0.1, s * 0.04, '#5a5a7a', '#2a2a3a');
  artRoundRect(c, x - bw / 2, y - bh / 2 - s * 0.04, bw, bh, bw * 0.3, '#3a3a5a', { lineColor: '#1a1a2a' });
  for (i = 0; i < 3; i++) {
    artCircle(c, x, y - bh / 2 - s * 0.04 + bh * (0.2 + i * 0.3), s * 0.045, i === 2 ? cols[i] : artMix(cols[i], '#2a2a40', 0.55), { line: false });
  }
  artGlow(c, x, y - bh / 2 - s * 0.04 + bh * 0.8, s * 0.12, '#4ade5a', 0.5);
};
