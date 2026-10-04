'use strict';

// Linnan kanatarha: linnan kuudes huone (HOME_ROOMS[5]) on ulkona puutarhan
// vieressä (puutarhan vasen portti, linnakartalla linnan oikealla puolella).
// Kanalassa on kanatalo kolmine pesälaatikkoineen, orsi, ruokakaukalo,
// vesikuppi, munakori ja hautomo. Aluksi tarhassa on kaksi kanaa; lisää kanoja,
// kukko ja tipuja ostetaan kaupasta raahaamalla kuten tavarat.
//
// Päivän hoito (ei rangaistuksia: hoitamaton kana vain ei muni):
//   - Jyväsäkki raahataan kaukalon ylle -> säkki kallistuu, jyvät valuvat ja
//     kanat juoksevat syömään (sama ele kuin puutarhan kastelukannussa).
//   - Vesikannu raahataan vesikupin ylle samalla tavalla.
//   - Kun molemmat on tehty tänään, kanat menevät vuorotellen pesään ja munivat
//     (ensimmäinen muna muutamassa sekunnissa). Kukin kana munii kerran päivässä.
//     Jos kanat hoidettiin eilen, mutta kaikki eivät ehtineet munia, munat
//     odottavat pesissä seuraavana päivänä.
//   - Pesän muna napautetaan koriin. Korin napautus maalaa munan kirjavaksi.
//     Korista muna raahataan hautomoon, ja seuraavana päivänä napautus
//     kuoriuttaa tipun. Tipu seuraa emoa ja kasvaa kanaksi kolmessa päivässä.
//   - Kultamuna (harvoin, tai kukon salaisuus) on yksi tähti.
// Kanoja voi nostaa sormella (sylissä syntyy sydämiä) ja laskea orrelle,
// pesään, pupun viereen tai maahan. Kukko kiekuu päivän ensimmäisellä
// käynnillä; viisi nopeaa tökkäystä kukkoon soittaa laulun (ja kerran
// päivässä kultamuna pesään). Kanatarhan tavarat ovat HOME_ITEMS-listan
// lopussa (flow-home.js); kanat, kukko ja tipu ovat siellä bird-merkittyinä,
// mutta ne eivät ole homeItems-tavaroita vaan coopBirds-eläimiä.

var COOP_ROOM = 5;
var COOP_MAX = 8;            // kanoja + tipuja + hautomon muna enintään
var COOP_GROW_DAYS = 3;      // tipu kasvaa kanaksi näin monessa päivässä
var COOP_POUR = 0.6;         // s kaatoa yhteen täyttöön
var COOP_GOLD_CHANCE = 1 / 12;
// Kanojen värit: valkoinen, ruskea, musta, kirjava
var COOP_COLORS = [
  { body: '#ffffff', shade: '#ded3ec', line: '#8a7a9a', wing: '#f1ebf7' },
  { body: '#d0844a', shade: '#a65a28', line: '#6a3818', wing: '#b86a34' },
  { body: '#4a4556', shade: '#2c2836', line: '#16131c', wing: '#605a70' },
  { body: '#f1e8d8', shade: '#cfc0a6', line: '#7a6a50', wing: '#e2d6c0', dots: '#5a4a3a' }
];
var COOP_EGG_PAINT = ['#fff6e8', '#ff7bac', '#5fa8ff', '#ffd24f', '#6fd66f', '#c9a0ff'];

// Tallennettava tila
var coopBirds = [];          // { k: 'hen'|'rooster'|'chick', c, fx, fy, born, laid } + ajonaikaiset kentät
var coopNests = [[], [], []];// munat pesittäin: { g: 1 = kultamuna }
var coopBasket = [];         // korin munat: kuvio (0 = valkoinen, 1.. = maalattu)
var coopInc = -1;            // hautomon munan päivä (-1 = tyhjä)
var coopIncP = 0;            // hautomon munan kuvio
var coopFed = -1;            // päivä, jona kaukalo täytettiin
var coopWat = -1;            // päivä, jona vesikuppi täytettiin
var coopCrow = -1;           // päivä, jona kukko kiekui
var coopGold = -1;           // päivä, jona kukon laulu antoi kultamunan
var coopInit = false;        // aloituskanat annettu

// Ajonaikainen tila
var coopGrain = 0;           // kaukalon jyvät 0..1 (näkyvä taso)
var coopWater = 0;           // vesikupin vesi 0..1
var coopLayT = 0;            // aika seuraavan kanan munimiseen
var coopLayer = null;        // kana, joka on menossa pesään
var coopCrowT = 0;           // kukon aamukiekaisun viive
var coopHatchT = 0;          // kuoriutumisen animaatio
var coopTaps = { n: 0, t: -9 }; // kukon tökkäykset (salaisuus)
var coopTool = { sack: { fx: -1, fy: -1, tilt: 0, pour: 0, shake: 0 }, jug: { fx: -1, fy: -1, tilt: 0, pour: 0, shake: 0 } };
var coopFly = [];            // lentävät munat { x0, y0, x1, y1, t, p, gold }
var coopHearts = [];         // { x, y, age }
var coopBits = [];           // jyvät ja vesipisarat { x, y, vx, vy, age, floorY, kind }
var coopIncShake = 0;
var coopBasketBounce = 0;
var coopBubbleT = 0;

function coopDay() {
  return yardDay();
}
function coopIsBird(id) {
  return id === 'hen' || id === 'rooster' || id === 'chick';
}
function coopRooster() {
  var i;
  for (i = 0; i < coopBirds.length; i++) if (coopBirds[i].k === 'rooster') return coopBirds[i];
  return null;
}
// Eläimiä + hautomon muna (enimmäismäärän laskuun)
function coopCount() {
  return coopBirds.length + (coopInc >= 0 ? 1 : 0);
}
function coopNestEggs() {
  return coopNests[0].length + coopNests[1].length + coopNests[2].length;
}
// Tipun kasvu 0..1
function coopAge(b) {
  if (b.k !== 'chick') return 1;
  return Math.max(0, Math.min(1, (coopDay() - (b.born === undefined ? coopDay() : b.born)) / COOP_GROW_DAYS));
}
function coopBirdSize(b) {
  var s = viewH * 0.055;
  if (b.k === 'rooster') return s * 1.15;
  if (b.k === 'chick') return s * (0.5 + 0.35 * coopAge(b));
  return s;
}

// ---------- Tallennus ----------
function coopSaveData() {
  var i, b, birds = [];
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    birds.push({ k: b.k, c: b.c, fx: Math.round(b.fx * 1000) / 1000, fy: Math.round(b.fy * 1000) / 1000, born: b.born, laid: b.laid });
  }
  return { b: birds, n: coopNests, k: coopBasket, i: coopInc, ip: coopIncP, f: coopFed, w: coopWat, r: coopCrow, g: coopGold, s: coopInit };
}
// Vanha tallennus (d puuttuu) = tyhjä kanatarha; aloituskanat tulevat ensikäynnillä
function coopLoadData(d) {
  var i, k, src;
  coopBirds = [];
  coopNests = [[], [], []];
  coopBasket = [];
  coopInc = -1;
  coopIncP = 0;
  coopFed = coopWat = coopCrow = coopGold = -1;
  coopInit = false;
  coopLayer = null;
  coopGrain = coopWater = 0;
  coopFly = [];
  if (!d || typeof d !== 'object') return;
  if (d.b && d.b.length !== undefined) {
    for (i = 0; i < d.b.length && coopBirds.length < COOP_MAX; i++) {
      src = d.b[i];
      if (!src || !coopIsBird(src.k)) continue;
      coopBirds.push(coopNewBird(src.k, src.c | 0, +src.fx || 0.4, +src.fy || 0.8, src.born, src.laid));
    }
  }
  if (d.n && d.n.length === 3) {
    for (k = 0; k < 3; k++) {
      if (!d.n[k] || d.n[k].length === undefined) continue;
      for (i = 0; i < d.n[k].length && i < 6; i++) coopNests[k].push({ g: d.n[k][i] && d.n[k][i].g ? 1 : 0 });
    }
  }
  if (d.k && d.k.length !== undefined) for (i = 0; i < d.k.length && i < 12; i++) coopBasket.push(Math.max(0, Math.min(COOP_EGG_PAINT.length - 1, d.k[i] | 0)));
  coopInc = d.i === undefined ? -1 : (d.i | 0);
  coopIncP = d.ip | 0;
  coopFed = d.f === undefined ? -1 : (d.f | 0);
  coopWat = d.w === undefined ? -1 : (d.w | 0);
  coopCrow = d.r === undefined ? -1 : (d.r | 0);
  coopGold = d.g === undefined ? -1 : (d.g | 0);
  coopInit = !!d.s;
}

// Kelaa kanatarhan kelloa: kaikki päiväleimat n päivää taaksepäin (testaus: VT.coopSkip)
function coopShiftDays(n) {
  var i, b;
  if (coopFed >= 0) coopFed -= n;
  if (coopWat >= 0) coopWat -= n;
  if (coopCrow >= 0) coopCrow -= n;
  if (coopGold >= 0) coopGold -= n;
  if (coopInc >= 0) coopInc -= n;
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    if (b.born !== undefined) b.born -= n;
    if (b.laid !== undefined) b.laid -= n;
  }
  saveProgress();
}

function coopNewBird(k, c, fx, fy, born, laid) {
  var b = { k: k, c: Math.max(0, Math.min(COOP_COLORS.length - 1, c | 0)), fx: fx, fy: fy };
  if (born !== undefined && born !== null) b.born = born | 0;
  if (laid !== undefined && laid !== null) b.laid = laid | 0;
  b.z = 0; b.zt = 0; b.tx = fx; b.ty = fy; b.dir = Math.random() < 0.5 ? -1 : 1;
  b.state = 'idle'; b.goal = ''; b.timer = 0.5 + Math.random() * 2;
  b.flapT = 0; b.peck = 0; b.hugT = 0; b.grewT = 0; b.slot = -1; b.run = false;
  b.ph = Math.random() * 6;
  return b;
}

// Uudelle kanalle väri, jota tarhassa ei vielä ole (muuten satunnainen)
function coopFreshColor() {
  var used = [0, 0, 0, 0], i;
  for (i = 0; i < coopBirds.length; i++) if (coopBirds[i].k !== 'rooster') used[coopBirds[i].c]++;
  for (i = 0; i < used.length; i++) if (!used[i]) return i;
  return randInt(COOP_COLORS.length);
}

// ---------- Paikat ----------
// Kiinteät paikat huoneessa (pikseleinä): kanatalo pesineen, orsi, kaukalo,
// vesikuppi, kori, hautomo ja työkalujen lepopaikat
function coopSpots() {
  var room = homeRoom(), h = viewH, rw = room.x1 - room.x0, fy = room.floorY;
  var hx = room.x0 + h * 0.04, hw = h * 0.36, hb = fy + h * 0.05, nests = [], i;
  for (i = 0; i < 3; i++) nests.push({ x: hx + hw * (0.2 + i * 0.3), y: hb - h * 0.13 });
  return {
    house: { x: hx, w: hw, base: hb },
    nests: nests,
    nestGround: hb + h * 0.035,
    roost: { x0: room.x0 + rw * 0.45, x1: room.x0 + rw * 0.66, base: fy + h * 0.075, z: h * 0.15 },
    trough: { x: room.x0 + rw * 0.36, y: fy + h * 0.2, w: h * 0.24 },
    cup: { x: room.x0 + rw * 0.6, y: fy + h * 0.21, r: h * 0.05 },
    basket: { x: room.x0 + rw * 0.3, y: room.bottom - h * 0.06 },
    inc: { x: room.x0 + rw * 0.1, y: room.bottom - h * 0.05 },
    sack: { x: room.x0 + rw * 0.46, y: room.bottom - h * 0.025 },
    jug: { x: room.x0 + rw * 0.56, y: room.bottom - h * 0.025 }
  };
}
function coopGroundClamp(b) {
  var room = homeRoom(), x = b.fx * viewW, y = b.fy * viewH;
  x = Math.min(Math.max(x, room.x0 + viewH * 0.05), room.x1 - viewH * 0.05);
  y = Math.min(Math.max(y, room.floorY + viewH * 0.07), room.bottom - viewH * 0.02);
  b.fx = x / viewW;
  b.fy = y / viewH;
}
function coopToolHome(name) {
  var sp = coopSpots();
  return name === 'sack' ? sp.sack : sp.jug;
}
function coopToolPos(name) {
  var t = coopTool[name], hm = coopToolHome(name);
  if (t.fx < 0) { t.fx = hm.x / viewW; t.fy = hm.y / viewH; }
  return { x: t.fx * viewW, y: t.fy * viewH };
}
function coopToolSize() {
  return viewH * 0.1;
}
// Työkalun kaatokohta (säkin suu / kannun nokka) ja kohde (kaukalo tai kuppi), jonka yllä se on
function coopPourTarget(name) {
  var p = coopToolPos(name), s = coopToolSize(), sp = coopSpots();
  var px = p.x + s * 0.45, py = p.y - s * 0.5;
  var tg = name === 'sack' ? { x: sp.trough.x, y: sp.trough.y, hw: sp.trough.w / 2 } : { x: sp.cup.x, y: sp.cup.y, hw: sp.cup.r };
  if (Math.abs(px - tg.x) < tg.hw + viewH * 0.05 && py < tg.y + viewH * 0.02 && tg.y - py < viewH * 0.4) return tg;
  return null;
}

// Kaukalon paikat syöjille (j = 0..7) ja vesikupin paikat juojille (0..3)
function coopTroughSlot(j) {
  var sp = coopSpots(), t = sp.trough;
  return { x: t.x + ((j % 4) - 1.5) * viewH * 0.065, y: t.y + viewH * (0.05 + Math.floor(j / 4) * 0.045) };
}
function coopCupSlot(j) {
  var c = coopSpots().cup, a = [[-1.4, 0.2], [1.4, 0.2], [-0.5, 1.1], [0.6, 1.1]][j % 4];
  return { x: c.x + a[0] * c.r, y: c.y + a[1] * c.r + viewH * 0.02 };
}
function coopRoostSlot(j) {
  var r = coopSpots().roost;
  return { x: r.x0 + (j + 0.5) * (r.x1 - r.x0) / 4, y: r.base };
}
// Vapaa paikka (slot) tavoitteelle: ei toisen linnun varaamaa
function coopFreeSlot(goal, n) {
  var j, i, used;
  for (j = 0; j < n; j++) {
    used = false;
    for (i = 0; i < coopBirds.length; i++) if (coopBirds[i].goal === goal && coopBirds[i].slot === j) used = true;
    if (!used) return j;
  }
  return -1;
}

// ---------- Hoito ----------
function coopFill(name) {
  var d = coopDay(), sp = coopSpots(), i, b, j, first;
  if (name === 'sack') {
    first = coopFed !== d;
    coopFed = d;
    coopGrain = 1;
    // Kanat juoksevat syömään
    for (i = 0; i < coopBirds.length; i++) {
      b = coopBirds[i];
      if (b.state === 'held' || b === coopLayer || b.state === 'lay') continue;
      j = coopFreeSlot('eat', 8);
      if (j < 0) break;
      coopGo(b, 'eat', coopTroughSlot(j), true);
      b.slot = j;
    }
    spawnSparkles(sp.trough.x, sp.trough.y - viewH * 0.03, first ? 18 : 8, '#ffd24f');
    playNote(523, 0, 0.1, 'triangle', 0.25);
    playNote(659, 0.1, 0.1, 'triangle', 0.25);
    if (first) playNote(784, 0.2, 0.25, 'triangle', 0.25);
  } else {
    first = coopWat !== d;
    coopWat = d;
    coopWater = 1;
    for (i = 0; i < coopBirds.length; i++) {
      b = coopBirds[i];
      if (b.state === 'held' || b === coopLayer || b.state === 'lay' || b.state === 'eat' || b.goal === 'eat') continue;
      j = coopFreeSlot('drink', 4);
      if (j < 0) break;
      coopGo(b, 'drink', coopCupSlot(j), false);
      b.slot = j;
    }
    spawnSparkles(sp.cup.x, sp.cup.y - viewH * 0.02, first ? 16 : 6, '#7fd4ff');
    playNote(988, 0, 0.1, 'sine', 0.25);
    playNote(1319, 0.1, 0.18, 'sine', 0.25);
  }
  for (i = 0; i < coopBirds.length; i++) if (coopBirds[i].k !== 'chick' && Math.random() < 0.6) coopCluck(0.15 + i * 0.12);
  // Molemmat tehty: ensimmäinen kana munii pian
  if (coopFed === d && coopWat === d && !coopLayer) coopLayT = Math.min(coopLayT > 0 ? coopLayT : 9, 2.5);
  saveProgress();
}

// Lintu lähtee kohteeseen; perillä alkaa tavoitteen mukainen tila (coopArrive)
function coopGo(b, goal, p, run) {
  b.goal = goal;
  b.slot = -1;
  b.tx = p.x / viewW;
  b.ty = p.y / viewH;
  b.run = !!run;
  if (b.z > 0) b.zt = 0;
  b.state = 'walk';
}

function coopArrive(b) {
  var sp = coopSpots(), it;
  b.run = false;
  if (b.goal === 'eat' && coopGrain > 0) { b.state = 'eat'; b.timer = 4 + Math.random() * 4; b.dir = b.fx * viewW < sp.trough.x ? 1 : -1; return; }
  if (b.goal === 'drink' && coopWater > 0) { b.state = 'drink'; b.timer = 2 + Math.random() * 2; b.dir = b.fx * viewW < sp.cup.x ? 1 : -1; return; }
  if (b.goal === 'roost') { b.zt = sp.roost.z; b.state = 'perch'; b.timer = 6 + Math.random() * 6; return; }
  if (b.goal === 'nest') { b.zt = sp.nestGround - sp.nests[b.slot].y; b.state = 'lay'; b.timer = 2.6; b.dir = 1; return; }
  if (b.goal === 'hay' && (it = homeHasHere('haybale'))) { b.zt = homeItemSize() * 0.42; b.state = 'perch'; b.timer = 5 + Math.random() * 4; if (b.k === 'rooster' && Math.random() < 0.5) coopCrowNow(b, 0.6); return; }
  if (b.goal === 'bathe' && homeHasHere('dustbath')) { b.state = 'bathe'; b.timer = 3 + Math.random() * 2; return; }
  if (b.goal === 'swing' && homeHasHere('coopswing')) { b.state = 'swing'; b.timer = 7 + Math.random() * 4; homeHasHere('coopswing').rockT = 2; return; }
  b.goal = '';
  b.state = 'idle';
  b.timer = 1 + Math.random() * 2.5;
}

// Mitä lintu tekee seuraavaksi (kun edellinen puuha loppui)
function coopThink(b) {
  var room = homeRoom(), r = Math.random(), j, i, o, best = null, bd = 1e9, dx, dy;
  var hay = homeHasHere('haybale'), bath = homeHasHere('dustbath'), swing = homeHasHere('coopswing');
  b.goal = '';
  b.slot = -1;
  if (coopGrain > 0.05 && r < (b.k === 'chick' ? 0.6 : 0.4)) {
    j = coopFreeSlot('eat', 8);
    if (j >= 0) { coopGo(b, 'eat', coopTroughSlot(j), false); b.slot = j; return; }
  }
  if (b.k === 'chick') {
    // Tipu seuraa lähintä aikuista kanaa
    for (i = 0; i < coopBirds.length; i++) {
      o = coopBirds[i];
      if (o.k !== 'hen' || o.z > 1) continue;
      dx = o.fx - b.fx; dy = o.fy - b.fy;
      if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = o; }
    }
    if (best) {
      coopGo(b, '', { x: best.fx * viewW - best.dir * viewH * (0.05 + Math.random() * 0.04), y: best.fy * viewH + viewH * (Math.random() - 0.3) * 0.04 }, false);
      return;
    }
  }
  r = Math.random();
  if (coopWater > 0.05 && r < 0.2) {
    j = coopFreeSlot('drink', 4);
    if (j >= 0) { coopGo(b, 'drink', coopCupSlot(j), false); b.slot = j; return; }
  }
  r = Math.random();
  if (b.k === 'rooster' && hay && r < 0.4) { coopGo(b, 'hay', { x: hay.fx * viewW, y: hay.fy * viewH + 2 }, false); return; }
  if (b.k !== 'chick') {
    if (r < 0.14) {
      j = coopFreeSlot('roost', 4);
      if (j >= 0) { coopGo(b, 'roost', coopRoostSlot(j), false); b.slot = j; return; }
    } else if (r < 0.22 && hay && b.k === 'hen') {
      var onHay = false;
      for (i = 0; i < coopBirds.length; i++) if (coopBirds[i].goal === 'hay') onHay = true;
      if (!onHay) { coopGo(b, 'hay', { x: hay.fx * viewW, y: hay.fy * viewH + 2 }, false); return; }
    } else if (r < 0.32 && bath && b.k === 'hen') {
      coopGo(b, 'bathe', { x: bath.fx * viewW, y: bath.fy * viewH + 2 }, false); return;
    } else if (r < 0.42 && swing && b.k === 'hen' && coopFreeSlot('swing', 1) === 0) {
      coopGo(b, 'swing', { x: swing.fx * viewW, y: swing.fy * viewH + 2 }, false); b.slot = 0; return;
    }
  }
  if (Math.random() < 0.45) {
    // Nokkii maata paikallaan
    b.state = 'idle';
    b.timer = 1.5 + Math.random() * 2;
    b.pecking = true;
    return;
  }
  b.pecking = false;
  coopGo(b, '', {
    x: room.x0 + viewH * 0.06 + Math.random() * (room.x1 - room.x0 - viewH * 0.12),
    y: room.floorY + viewH * 0.08 + Math.random() * (room.bottom - room.floorY - viewH * 0.11)
  }, false);
}

// Muna pesään (tai kultamuna). Täysistä pesistä muna menee suoraan koriin.
function coopLayEgg(b) {
  var n = b.slot >= 0 ? b.slot : 0, sp = coopSpots(), k, best = n, gold = Math.random() < COOP_GOLD_CHANCE ? 1 : 0;
  if (coopNests[n].length >= 4) {
    for (k = 0; k < 3; k++) if (coopNests[k].length < coopNests[best].length) best = k;
    n = best;
  }
  if (coopNests[n].length >= 4) {
    if (coopBasket.length < 12) coopBasket.push(0);
  } else {
    coopNests[n].push({ g: gold });
  }
  b.laid = coopDay();
  // Kot-kot-kot-KOTKAAK
  playNote(520, 0, 0.06, 'square', 0.06);
  playNote(520, 0.12, 0.06, 'square', 0.06);
  playNote(520, 0.24, 0.06, 'square', 0.06);
  playNote(700, 0.36, 0.35, 'square', 0.07);
  playNote(1047, 0.5, 0.15, 'sine', 0.25);
  playNote(1319, 0.62, 0.25, 'sine', 0.25);
  spawnSparkles(sp.nests[n].x, sp.nests[n].y - viewH * 0.02, gold ? 24 : 14, gold ? '#ffd24f' : '#fff6e8');
  b.flapT = 0.8;
  saveProgress();
}

function coopCluck(delay) {
  var f = 480 + Math.random() * 80;
  playNote(f, delay, 0.05, 'square', 0.05);
  playNote(f * 0.92, delay + 0.09, 0.06, 'square', 0.05);
}
function coopCheep(delay) {
  playNote(2300 + Math.random() * 300, delay, 0.05, 'sine', 0.14);
  playNote(2700 + Math.random() * 300, delay + 0.07, 0.05, 'sine', 0.12);
}
// Kukon kiekaisu (kukko-kiekuu)
function coopCrowNow(b, delay) {
  delay = delay || 0;
  playNote(523, delay, 0.12, 'square', 0.07);
  playNote(659, delay + 0.14, 0.12, 'square', 0.07);
  playNote(880, delay + 0.3, 0.4, 'sawtooth', 0.06);
  playNote(784, delay + 0.72, 0.3, 'sawtooth', 0.05);
  if (b) { b.flapT = 1.2; b.crowT = 1.2 + delay; }
}

// ---------- Napautukset ja raahaus ----------
// Pesän muna, työkalu, lintu, kori tai hautomo (ennen tavaroita). True = osui.
function coopTap(px, py) {
  var sp, i, k, e, dx, dy, b, best = null, by = -1, s;
  if (homeRoomIdx !== COOP_ROOM) return false;
  sp = coopSpots();
  // Pesien munat
  for (k = 0; k < 3; k++) {
    if (!coopNests[k].length) continue;
    dx = px - sp.nests[k].x; dy = py - (sp.nests[k].y - viewH * 0.02);
    if (Math.abs(dx) < viewH * 0.06 && Math.abs(dy) < viewH * 0.05) {
      e = coopNests[k].pop();
      coopCollect(e, sp.nests[k].x, sp.nests[k].y - viewH * 0.015);
      return true;
    }
  }
  // Työkalut
  var names = ['sack', 'jug'];
  s = coopToolSize();
  for (i = 0; i < 2; i++) {
    var tp = coopToolPos(names[i]);
    if (px > tp.x - s * 0.5 && px < tp.x + s * 0.55 && py > tp.y - s * 0.85 && py < tp.y + s * 0.1) {
      homeDrag = { coop: 'tool', tool: names[i], dx: px - tp.x, dy: py - tp.y, gx: px, gy: py, sx: px, sy: py, moved: false };
      playNote(660, 0, 0.05, 'sine', 0.18);
      return true;
    }
  }
  // Kori: muna käteen (napautus maalaa). Kori ja hautomo ennen lintuja,
  // jotta niiden päällä seisova kana ei estä käyttöä.
  dx = px - sp.basket.x; dy = py - (sp.basket.y - viewH * 0.04);
  if (Math.abs(dx) < viewH * 0.09 && Math.abs(dy) < viewH * 0.07) {
    if (coopBasket.length) {
      homeDrag = { coop: 'egg', p: coopBasket.pop(), gx: px, gy: py, sx: px, sy: py, moved: false };
      playNote(880, 0, 0.05, 'sine', 0.18);
    } else {
      coopBasketBounce = 0.5;
      playNote(330, 0, 0.08, 'triangle', 0.18);
    }
    return true;
  }
  // Hautomo
  dx = px - sp.inc.x; dy = py - (sp.inc.y - viewH * 0.06);
  if (Math.abs(dx) < viewH * 0.08 && Math.abs(dy) < viewH * 0.08) {
    coopIncTap();
    return true;
  }
  // Linnut (etummainen eli alimpana seisova ensin)
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    s = coopBirdSize(b);
    var bx = b.fx * viewW + (b.ox || 0), byy = b.fy * viewH - b.z + (b.oy || 0);
    if (Math.abs(px - bx) < s * 0.8 && py < byy + s * 0.15 && py > byy - s * 1.6 && b.fy > by) { best = b; by = b.fy; }
  }
  if (best) {
    homeDrag = { coop: 'bird', bird: best, gx: px, gy: py, sx: px, sy: py, moved: false, hold: 0 };
    if (best === coopLayer) coopLayer = null;
    best.state = 'held';
    best.goal = '';
    best.slot = -1;
    return true;
  }
  return false;
}

// Pesän muna koriin (kultamuna = tähti kukkaroon)
function coopCollect(e, x, y) {
  var sp = coopSpots(), shop = homeShopBox();
  if (e.g) {
    starCoins += 1;
    coopFly.push({ x0: x, y0: y, x1: shop.x + viewH * 0.05, y1: shop.y + shop.head * 0.5, t: 0, p: 0, gold: 1 });
    spawnSparkles(x, y, 24, '#ffd24f');
    soundStar(3);
  } else {
    if (coopBasket.length < 12) coopBasket.push(0);
    coopFly.push({ x0: x, y0: y, x1: sp.basket.x, y1: sp.basket.y - viewH * 0.05, t: 0, p: 0, gold: 0 });
    spawnSparkles(x, y, 10, '#fff6e8');
    playNote(784, 0, 0.08, 'sine', 0.25);
    playNote(1047, 0.08, 0.12, 'sine', 0.25);
  }
  saveProgress();
}

function coopIncTap() {
  var d = coopDay(), sp = coopSpots();
  if (coopHatchT > 0) return;
  if (coopInc >= 0 && d > coopInc) {
    // Kuoriutuminen: kuori halkeaa ja tipu hyppää ulos
    coopHatchT = 1.4;
    playNote(1400, 0, 0.04, 'square', 0.06);
    playNote(1200, 0.25, 0.04, 'square', 0.06);
    playNote(1500, 0.5, 0.04, 'square', 0.06);
    return;
  }
  coopIncShake = 0.6;
  if (coopInc >= 0) {
    // Sisältä kuuluu pieni piip
    coopCheep(0.1);
    spawnSparkles(sp.inc.x, sp.inc.y - viewH * 0.07, 6, '#ffe27a');
  } else {
    playNote(440, 0, 0.12, 'sine', 0.15);
    playNote(554, 0.1, 0.18, 'sine', 0.15);
  }
}

function coopHatch() {
  var sp = coopSpots(), b = coopNewBird('chick', randInt(COOP_COLORS.length), sp.inc.x / viewW + 0.04, (sp.inc.y + viewH * 0.01) / viewH, coopDay());
  coopGroundClamp(b);
  b.flapT = 0.6;
  b.z = viewH * 0.06;
  coopBirds.push(b);
  coopInc = -1;
  spawnSparkles(sp.inc.x, sp.inc.y - viewH * 0.06, 26, '#ffe066');
  coopCheep(0);
  coopCheep(0.2);
  playNote(784, 0.3, 0.12, 'sine', 0.28);
  playNote(1047, 0.42, 0.12, 'sine', 0.28);
  playNote(1568, 0.54, 0.3, 'sine', 0.28);
  saveProgress();
}

// Raahaus (homeMove kutsuu)
function coopDragMove(px, py) {
  var d = homeDrag;
  d.gx = px;
  d.gy = py;
  if (d.coop === 'tool') {
    var t = coopTool[d.tool];
    t.fx = Math.min(Math.max(px - d.dx, viewH * 0.05), viewW - viewH * 0.05) / viewW;
    t.fy = Math.min(Math.max(py - d.dy, viewH * 0.12), viewH) / viewH;
  } else if (d.coop === 'bird') {
    if (!d.moved) return;
    d.bird.fx = px / viewW;
    d.bird.fy = (py + coopBirdSize(d.bird) * 0.7) / viewH;
    d.bird.z = 0;
    d.bird.zt = 0;
  }
}

// Pudotus (homeUp kutsuu)
function coopDrop() {
  var d = homeDrag, sp = coopSpots(), i, b, dx, dy;
  homeDrag = null;
  if (d.coop === 'tool') {
    if (!d.moved) {
      coopTool[d.tool].shake = 0.6;
      if (d.tool === 'sack') { for (i = 0; i < 4; i++) playNote(300 + Math.random() * 200, i * 0.05, 0.04, 'square', 0.04); }
      else { for (i = 0; i < 3; i++) playNote(1300 + i * 200, i * 0.06, 0.06, 'sine', 0.12); }
    }
    coopTool[d.tool].pour = 0;
    return;
  }
  if (d.coop === 'egg') {
    dx = d.gx - sp.inc.x; dy = d.gy - (sp.inc.y - viewH * 0.06);
    if (!d.moved) {
      // Napautus koriin: valkoinen muna maalataan kirjavaksi
      coopBasket.push(d.p);
      for (i = 0; i < coopBasket.length; i++) if (!coopBasket[i]) break;
      if (i < coopBasket.length) {
        coopBasket[i] = 1 + randInt(COOP_EGG_PAINT.length - 1);
        spawnSparkles(sp.basket.x, sp.basket.y - viewH * 0.05, 14, COOP_EGG_PAINT[coopBasket[i]]);
        playNote(784, 0, 0.1, 'sine', 0.22);
        playNote(1175, 0.08, 0.15, 'sine', 0.22);
        saveProgress();
      } else {
        for (i = 0; i < 4; i++) playNote(1400 + i * 180, i * 0.06, 0.08, 'sine', 0.12);
      }
      coopBasketBounce = 0.5;
      return;
    }
    if (dx * dx + dy * dy < viewH * viewH * 0.016 && coopInc < 0 && coopCount() < COOP_MAX) {
      coopInc = coopDay();
      coopIncP = d.p;
      spawnSparkles(sp.inc.x, sp.inc.y - viewH * 0.06, 16, '#ffd6a0');
      playNote(523, 0, 0.12, 'sine', 0.25);
      playNote(659, 0.12, 0.12, 'sine', 0.25);
      playNote(784, 0.24, 0.3, 'sine', 0.25);
      saveProgress();
      return;
    }
    // Ei käy (hautomo varattu tai tarha täynnä): muna palaa koriin
    if (dx * dx + dy * dy < viewH * viewH * 0.016) coopIncShake = 0.6;
    coopBasket.push(d.p);
    coopFly.push({ x0: d.gx, y0: d.gy, x1: sp.basket.x, y1: sp.basket.y - viewH * 0.05, t: 0.3, p: d.p, gold: 0, back: 1 });
    playNote(330, 0, 0.1, 'triangle', 0.2);
    return;
  }
  // Lintu
  b = d.bird;
  if (!d.moved) {
    b.state = 'idle';
    coopBirdTap(b);
    return;
  }
  coopBirdDrop(b, d.gx, d.gy);
}

function coopBirdTap(b) {
  var x = b.fx * viewW, y = b.fy * viewH - b.z, s = coopBirdSize(b), room = homeRoom();
  b.flapT = 0.9;
  if (b.k === 'chick') {
    coopCheep(0);
    b.z = Math.max(b.z, viewH * 0.02);
    spawnSparkles(x, y - s, 6, '#ffe066');
    return;
  }
  if (b.k === 'rooster') {
    if (globalT - coopTaps.t < 2.5) coopTaps.n++;
    else coopTaps.n = 1;
    coopTaps.t = globalT;
    if (coopTaps.n >= 5) { coopTaps.n = 0; coopRoosterSong(b); return; }
    coopCrowNow(b, 0);
    spawnSparkles(x, y - s * 1.4, 8, '#ff7b5e');
    return;
  }
  coopCluck(0);
  coopCluck(0.22);
  spawnSparkles(x, y - s, 6, '#ffffff');
  // Juoksee pyrähtäen sivuun
  if (b.z <= 1) {
    var nx = Math.min(Math.max(x + (Math.random() < 0.5 ? -1 : 1) * viewH * (0.12 + Math.random() * 0.1), room.x0 + viewH * 0.06), room.x1 - viewH * 0.06);
    coopGo(b, '', { x: nx, y: b.fy * viewH + (Math.random() - 0.5) * viewH * 0.08 }, true);
  }
}

// Kukon salaisuus: laulu ja kerran päivässä kultamuna pesään
function coopRoosterSong(b) {
  var mel = [523, 659, 784, 1047, 880, 784, 659, 784, 1047, 1319], i, k, best = 0, sp = coopSpots();
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.16, 0.22, 'square', 0.06);
  coopCrowNow(b, mel.length * 0.16 + 0.1);
  homeSpawnNotes(b.fx * viewW, b.fy * viewH - coopBirdSize(b) * 1.6, 8);
  b.flapT = 2.5;
  if (coopGold !== coopDay()) {
    coopGold = coopDay();
    for (k = 0; k < 3; k++) if (coopNests[k].length < coopNests[best].length) best = k;
    coopNests[best].push({ g: 1 });
    spawnSparkles(sp.nests[best].x, sp.nests[best].y - viewH * 0.02, 30, '#ffd24f');
    saveProgress();
  }
}

// Lintu lasketaan: orrelle, pesään, pupun viereen tai maahan (pyrähtää alas)
function coopBirdDrop(b, px, py) {
  var sp = coopSpots(), k, j, dx, dy, s = coopBirdSize(b), room = homeRoom(), d = coopDay(), i, bun;
  var footY = py + s * 0.7;
  b.goal = '';
  b.slot = -1;
  // Pesä (vain aikuinen kana)
  for (k = 0; k < 3 && b.k === 'hen'; k++) {
    dx = px - sp.nests[k].x; dy = footY - sp.nests[k].y;
    if (Math.abs(dx) < viewH * 0.07 && Math.abs(dy) < viewH * 0.08) {
      b.fx = sp.nests[k].x / viewW;
      b.fy = sp.nestGround / viewH;
      b.z = b.zt = sp.nestGround - sp.nests[k].y;
      b.goal = 'nest';
      b.slot = k;
      b.state = 'lay';
      b.dir = 1;
      b.timer = coopFed === d && coopWat === d && b.laid !== d ? 1.8 : 3;
      coopCluck(0);
      return;
    }
  }
  // Orsi
  if (b.k !== 'chick' && px > sp.roost.x0 - viewH * 0.03 && px < sp.roost.x1 + viewH * 0.03 && Math.abs(footY - (sp.roost.base - sp.roost.z)) < viewH * 0.07) {
    j = coopFreeSlot('roost', 4);
    if (j >= 0) {
      var rs = coopRoostSlot(j);
      b.fx = rs.x / viewW; b.fy = rs.y / viewH;
      b.z = b.zt = sp.roost.z;
      b.goal = 'roost'; b.slot = j; b.state = 'perch'; b.timer = 8 + Math.random() * 5;
      coopCluck(0);
      spawnSparkles(rs.x, rs.y - sp.roost.z, 6, '#ffe27a');
      return;
    }
  }
  // Pupun viereen: halaus ja sydämiä
  for (i = 0; i < homeBunnies.length; i++) {
    bun = homeBunnies[i];
    dx = px - bun.fx * viewW; dy = py - (bun.fy * viewH - viewH * 0.04);
    if (dx * dx + dy * dy < viewH * viewH * 0.01) {
      b.fx = bun.fx + 0.035; b.fy = bun.fy;
      coopGroundClamp(b);
      b.z = 0; b.zt = 0;
      b.state = 'hug'; b.timer = 5; b.dir = -1;
      bun.hop = 1;
      for (j = 0; j < 4; j++) coopHearts.push({ x: bun.fx * viewW + (j - 1.5) * viewH * 0.02, y: bun.fy * viewH - viewH * 0.08, age: -j * 0.15 });
      playNote(1047, 0, 0.12, 'sine', 0.22);
      playNote(1319, 0.12, 0.2, 'sine', 0.22);
      return;
    }
  }
  // Maahan: lintu pyrähtää alas sormen kohdalta
  var groundY = Math.min(Math.max(footY, room.floorY + viewH * 0.07), room.bottom - viewH * 0.02);
  b.fx = Math.min(Math.max(px, room.x0 + viewH * 0.05), room.x1 - viewH * 0.05) / viewW;
  b.z = Math.max(0, groundY - footY);
  b.fy = groundY / viewH;
  b.zt = 0;
  b.flapT = 0.6;
  b.state = 'idle';
  b.timer = 1 + Math.random();
  if (b.k === 'chick') coopCheep(0); else coopCluck(0);
}

// ---------- Kauppa ----------
// Lintujen kortit: true = käsitelty (haamu nostettu tai kortti ravistettu)
function coopShopPick(def, px, py) {
  if (!coopIsBird(def.id)) return false;
  if (homeRoomIdx !== COOP_ROOM || coopShopOwned(def.id) || starCoins < def.price) {
    homeShake.id = def.id;
    homeShake.t = 0.5;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    return true;
  }
  homeDrag = { item: { id: def.id, fx: px / viewW, fy: py / viewH, on: true, phase: 0, room: COOP_ROOM }, ghost: true, def: def, dx: 0, dy: 0, sx: px, sy: py, moved: false };
  playNote(660, 0, 0.06, 'sine', 0.2);
  return true;
}
// Kortti harmaana: kukko on jo, tai tarha on täynnä
function coopShopOwned(id) {
  if (id === 'rooster') return !!coopRooster() || coopCount() >= COOP_MAX;
  if (id === 'hen' || id === 'chick') return coopCount() >= COOP_MAX;
  return false;
}
// Ostettu lintu tarhaan: true = käsitelty
function coopBuy(def, it) {
  var b;
  if (!coopIsBird(def.id)) return false;
  starCoins -= def.price;
  b = coopNewBird(def.id, def.id === 'hen' ? coopFreshColor() : randInt(COOP_COLORS.length), it.fx, it.fy, def.id === 'chick' ? coopDay() : undefined);
  coopGroundClamp(b);
  b.flapT = 1;
  coopBirds.push(b);
  saveProgress();
  spawnSparkles(b.fx * viewW, b.fy * viewH - viewH * 0.05, 18, '#ffe27a');
  playNote(784, 0, 0.12, 'sine', 0.35);
  playNote(1047, 0.1, 0.15, 'sine', 0.35);
  playNote(1319, 0.2, 0.3, 'sine', 0.35);
  if (def.id === 'chick') coopCheep(0.35); else if (def.id === 'rooster') coopCrowNow(b, 0.4); else coopCluck(0.35);
  return true;
}

function coopOnEnter() {
  var i, d = coopDay(), b, sp;
  for (i = 0; i < HOME_ITEMS.length; i++) if (HOME_ITEMS[i].id === 'hen') break;
  homeShopPage = Math.floor(i / HOME_SHOP_PAGE);
  if (!coopInit) {
    // Aloituskanat: valkoinen ja ruskea
    coopInit = true;
    coopBirds.push(coopNewBird('hen', 0, 0.3, 0.8));
    coopBirds.push(coopNewBird('hen', 1, 0.45, 0.88));
    saveProgress();
  }
  sp = coopSpots();
  // Eilen hoidetut kanat munivat yöllä
  if (coopFed >= 0 && coopFed === coopWat && coopFed < d) {
    for (i = 0; i < coopBirds.length; i++) {
      b = coopBirds[i];
      if (b.k !== 'hen' || (b.laid !== undefined && b.laid >= coopFed)) continue;
      b.slot = coopNestEggs() % 3;
      coopLayEggQuiet(b, coopFed);
    }
  }
  // Tiput kasvavat
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    if (b.k === 'chick' && coopAge(b) >= 1) {
      b.k = 'hen';
      b.grewT = 2.5;
      delete b.born;
    }
  }
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    coopGroundClamp(b);
    b.z = b.zt = 0;
    b.state = 'idle';
    b.goal = '';
    b.slot = -1;
    b.timer = 0.3 + Math.random() * 1.5;
  }
  coopLayer = null;
  coopGrain = coopFed === d ? Math.max(coopGrain, 0.6) : 0;
  coopWater = coopWat === d ? Math.max(coopWater, 0.6) : 0;
  coopLayT = 2;
  coopTool.sack.fx = coopTool.jug.fx = -1;
  coopCrowT = coopRooster() && coopCrow !== d ? 1.5 : 0;
  saveProgress();
}
// Yöllä munittu muna pesään ilman ääniä
function coopLayEggQuiet(b, day) {
  var n = b.slot >= 0 ? b.slot : 0;
  if (coopNests[n].length < 4) coopNests[n].push({ g: Math.random() < COOP_GOLD_CHANCE ? 1 : 0 });
  else if (coopBasket.length < 12) coopBasket.push(0);
  b.laid = day;
  b.slot = -1;
}

// ---------- Päivitys ----------
function updateCoopItem(it, dt) {
  if (it.wigT > 0) it.wigT -= dt;
  if (it.dustT > 0) it.dustT -= dt;
}

function updateCoop(dt) {
  var i, b, d, sp, t, name, s;
  for (i = coopHearts.length - 1; i >= 0; i--) {
    coopHearts[i].age += dt;
    if (coopHearts[i].age > 1.4) coopHearts.splice(i, 1);
  }
  for (i = coopFly.length - 1; i >= 0; i--) {
    coopFly[i].t += dt / 0.6;
    if (coopFly[i].t >= 1) {
      if (!coopFly[i].gold) coopBasketBounce = 0.4;
      coopFly.splice(i, 1);
    }
  }
  if (homeRoomIdx !== COOP_ROOM) return;
  d = coopDay();
  sp = coopSpots();
  if (coopIncShake > 0) coopIncShake -= dt;
  if (coopBasketBounce > 0) coopBasketBounce -= dt;
  coopBubbleT += dt;
  if (coopHatchT > 0) {
    coopHatchT -= dt;
    if (coopHatchT <= 0) coopHatch();
  }
  if (coopCrowT > 0) {
    coopCrowT -= dt;
    if (coopCrowT <= 0) {
      var ro = coopRooster();
      if (ro) coopCrowNow(ro, 0);
      coopCrow = d;
      saveProgress();
    }
  }
  // Työkalut: kallistus ja kaato kohteen yllä; irti päästetty palaa paikalleen
  for (name in coopTool) {
    t = coopTool[name];
    if (t.shake > 0) t.shake -= dt;
    var held = !!(homeDrag && homeDrag.coop === 'tool' && homeDrag.tool === name);
    var tg = held ? coopPourTarget(name) : null;
    t.tilt = Math.max(0, Math.min(1, t.tilt + (tg ? dt * 4 : -dt * 4)));
    if (!held) {
      var hm = coopToolHome(name), p = coopToolPos(name), k = Math.min(1, dt * 8);
      t.fx = (p.x + (hm.x - p.x) * k) / viewW;
      t.fy = (p.y + (hm.y - p.y) * k) / viewH;
      t.pour = 0;
    } else if (tg && t.tilt > 0.6) {
      var pp = coopToolPos(name);
      s = coopToolSize();
      if (Math.random() < dt * 30) {
        coopBits.push({ x: pp.x + s * 0.5, y: pp.y - s * 0.45, vx: viewH * (0.02 + Math.random() * 0.06), vy: viewH * 0.05, age: 0, floorY: tg.y - viewH * 0.01, kind: name });
      }
      if (Math.random() < dt * 8) {
        if (name === 'sack') playNote(250 + Math.random() * 250, 0, 0.03, 'square', 0.03);
        else playNote(1500 + Math.random() * 700, 0, 0.04, 'sine', 0.06);
      }
      t.pour += dt;
      if (t.pour >= COOP_POUR) { t.pour = -9; coopFill(name); }
    }
  }
  for (i = coopBits.length - 1; i >= 0; i--) {
    t = coopBits[i];
    t.age += dt;
    t.vy += viewH * 1.6 * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    if ((t.vy > 0 && t.y > t.floorY) || t.age > 2) coopBits.splice(i, 1);
  }
  // Munintavuoro: hoidetut kanat menevät yksi kerrallaan pesään
  if (coopFed === d && coopWat === d && !coopLayer) {
    coopLayT -= dt;
    if (coopLayT <= 0) {
      coopLayT = 2.5 + Math.random() * 2;
      for (i = 0; i < coopBirds.length; i++) {
        b = coopBirds[i];
        if (b.k !== 'hen' || b.laid === d || b.state === 'held' || b.state === 'lay') continue;
        var nb = 0, k2;
        for (k2 = 1; k2 < 3; k2++) if (coopNests[k2].length < coopNests[nb].length) nb = k2;
        coopGo(b, 'nest', { x: sp.nests[nb].x, y: sp.nestGround }, false);
        b.slot = nb;
        coopLayer = b;
        break;
      }
    }
  }
  if (coopLayer && coopBirds.indexOf(coopLayer) < 0) coopLayer = null;
  // Linnut
  var swing = homeHasHere('coopswing');
  for (i = 0; i < coopBirds.length; i++) coopUpdateBird(coopBirds[i], i, dt, d, sp, swing);
}

function coopUpdateBird(b, i, dt, d, sp, swing) {
  var s = coopBirdSize(b), dx, dy, dist, spd, held = !!(homeDrag && homeDrag.coop === 'bird' && homeDrag.bird === b);
  b.ph += dt;
  if (b.flapT > 0) b.flapT -= dt;
  if (b.grewT > 0) {
    b.grewT -= dt;
    if (Math.random() < dt * 8) spawnSparkles(b.fx * viewW, b.fy * viewH - s, 2, '#ffe27a');
  }
  if (b.crowT > 0) b.crowT -= dt;
  b.ox = 0; b.oy = 0;
  if (b.state === 'held') {
    if (!held) { b.state = 'idle'; b.timer = 0.5; b.zt = 0; return; }
    // Sylissä: sydämiä ja tyytyväistä kotkotusta
    homeDrag.hold += dt;
    if (homeDrag.hold > 0.7) {
      homeDrag.hold = 0;
      coopHearts.push({ x: b.fx * viewW + (Math.random() - 0.5) * s, y: b.fy * viewH - s * 1.6, age: 0 });
      if (b.k === 'chick') coopCheep(0); else playNote(420 + Math.random() * 40, 0, 0.08, 'triangle', 0.08);
    }
    return;
  }
  // Pystysuunta: hyppy orrelle/pesään ja pyrähdys alas
  if (b.z !== b.zt) {
    var vz = viewH * 0.7 * dt;
    if (Math.abs(b.zt - b.z) <= vz) b.z = b.zt; else b.z += b.z < b.zt ? vz : -vz;
    b.flapT = Math.max(b.flapT, 0.1);
  }
  b.timer -= dt;
  if (b.state === 'walk') {
    dx = (b.tx - b.fx) * viewW; dy = (b.ty - b.fy) * viewH;
    dist = Math.sqrt(dx * dx + dy * dy);
    spd = viewH * (b.run ? 0.38 : (b.k === 'chick' ? 0.16 : 0.13)) * dt;
    if (b.z > 0 && b.zt === 0) spd = 0;
    if (dist <= Math.max(spd, 2)) {
      b.fx = b.tx; b.fy = b.ty;
      coopArrive(b);
    } else {
      b.fx += dx / dist * spd / viewW;
      b.fy += dy / dist * spd / viewH;
      if (Math.abs(dx) > 1) b.dir = dx > 0 ? 1 : -1;
    }
    b.peck = 0;
    return;
  }
  if (b.state === 'eat') {
    b.peck = Math.max(0, Math.sin(b.ph * 9));
    coopGrain = Math.max(0.3, coopGrain - dt * 0.004);
    if (Math.random() < dt * 2) playNote(900 + Math.random() * 300, 0, 0.02, 'square', 0.025);
    if (b.timer <= 0 || coopGrain <= 0) { b.state = 'idle'; b.goal = ''; b.slot = -1; b.timer = 0.5 + Math.random(); }
    return;
  }
  if (b.state === 'drink') {
    b.peck = Math.sin(b.ph * 3) > 0.3 ? 1 : 0;
    coopWater = Math.max(0.3, coopWater - dt * 0.004);
    if (b.timer <= 0) { b.state = 'idle'; b.goal = ''; b.slot = -1; b.timer = 0.5 + Math.random(); }
    return;
  }
  if (b.state === 'lay') {
    b.peck = 0;
    if (b.z !== b.zt) { b.timer = Math.max(b.timer, 0.5); return; }
    if (Math.random() < dt * 1.5) coopCluck(0);
    if (b.timer <= 0) {
      if (b.k === 'hen' && coopFed === d && coopWat === d && b.laid !== d) coopLayEgg(b);
      if (b === coopLayer) coopLayer = null;
      b.zt = 0;
      b.state = 'idle';
      b.goal = '';
      b.slot = -1;
      b.timer = 0.8;
    }
    return;
  }
  if (b.state === 'perch') {
    b.peck = 0;
    if (b.timer <= 0) { b.zt = 0; b.state = 'idle'; b.goal = ''; b.slot = -1; b.timer = 0.6; }
    return;
  }
  if (b.state === 'hug') {
    if (Math.random() < dt * 1.2) coopHearts.push({ x: b.fx * viewW - viewH * 0.02, y: b.fy * viewH - viewH * 0.1, age: 0 });
    if (b.timer <= 0) { b.state = 'idle'; b.timer = 0.5; }
    return;
  }
  if (b.state === 'bathe') {
    var bath = homeHasHere('dustbath');
    if (!bath || b.timer <= 0) { b.state = 'idle'; b.goal = ''; b.timer = 0.5; return; }
    b.peck = 0.5 + Math.sin(b.ph * 14) * 0.5;
    b.flapT = Math.max(b.flapT, 0.1);
    if (Math.random() < dt * 6) spawnDust(b.fx * viewW, b.fy * viewH, 1, 0);
    return;
  }
  if (b.state === 'swing') {
    if (!swing || b.timer <= 0) { b.state = 'idle'; b.goal = ''; b.slot = -1; b.timer = 0.5; return; }
    swing.rockT = Math.max(swing.rockT || 0, 1.2);
    var a = coopSwingAngle(swing), L = homeItemSize() * 0.85, hs = homeItemSize();
    b.fx = swing.fx; b.fy = swing.fy + 0.002;
    b.ox = Math.sin(a) * L;
    b.oy = -hs * 1.2 + Math.cos(a) * L;
    b.peck = 0;
    return;
  }
  // idle: nokkii tai seisoo, sitten keksii uutta
  b.peck = b.pecking ? Math.max(0, Math.sin(b.ph * 7)) : 0;
  if (b.timer <= 0 && b.z === b.zt) coopThink(b);
}

// ---------- Piirto ----------
function coopSwingAngle(it) {
  var k = Math.min(1, (it.rockT || 0) / 1.2);
  return Math.sin(globalT * 3) * 0.4 * k;
}

// Lintu: (x, y) jalkojen kohta, s koko. dir 1 = katsoo oikealle.
// o: { flap, peck, sit, blink, crow, age }
function drawCoopBirdShape(c, k, col, x, y, s, dir, o) {
  var C = COOP_COLORS[col] || COOP_COLORS[0], fl = o.flap ? Math.abs(Math.sin(globalT * 28)) * 0.9 : 0, pk = o.peck || 0;
  if (k === 'rooster') C = { body: '#e07a3a', shade: '#a8501e', line: '#6a2e10', wing: '#b8402a' };
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  if (k === 'chick') {
    var ag = o.age || 0, cb = ag > 0.6 ? artMix('#ffe066', C.body, (ag - 0.6) * 1.5) : '#ffe066';
    if (!o.sit) {
      artLimb(c, -s * 0.12, -s * 0.15, -s * 0.14, 0, s * 0.07, '#f0a020', false);
      artLimb(c, s * 0.12, -s * 0.15, s * 0.14, 0, s * 0.07, '#f0a020', false);
    }
    artCircle(c, 0, -s * 0.45, s * 0.42, cb, { lineColor: '#c99a20', hi: 0.4 });
    c.save(); c.translate(-s * 0.1, -s * 0.45); c.rotate(-fl);
    artBlob(c, -s * 0.05, 0, s * 0.2, s * 0.13, artShade(cb, -0.08), { lineColor: '#c99a20', line: 1 });
    c.restore();
    var chx = s * 0.25 + pk * s * 0.12, chy = -s * 0.88 + pk * s * 0.35;
    artCircle(c, chx, chy, s * 0.28, cb, { lineColor: '#c99a20' });
    c.fillStyle = '#ff9f3a';
    c.beginPath(); c.moveTo(chx + s * 0.22, chy - s * 0.04); c.lineTo(chx + s * 0.4, chy + s * 0.02); c.lineTo(chx + s * 0.22, chy + s * 0.08); c.closePath(); c.fill();
    artEye(c, chx + s * 0.08, chy - s * 0.05, s * 0.07, 0.5, o.blink);
    c.restore();
    return;
  }
  // Jalat
  if (!o.sit) {
    artLimb(c, -s * 0.13, -s * 0.38, -s * 0.15, -s * 0.02, s * 0.07, '#f0a020', '#b8761a');
    artLimb(c, s * 0.13, -s * 0.38, s * 0.15, -s * 0.02, s * 0.07, '#f0a020', '#b8761a');
  }
  var lift = o.sit ? s * 0.25 : 0;
  // Pyrstö
  if (k === 'rooster') {
    var tc = ['#2f6a5a', '#3a4a9a', '#2a2a3a'], q;
    for (q = 0; q < 3; q++) artBlob(c, -s * (0.62 + q * 0.06), -s * (1.0 + q * 0.12) + lift, s * 0.14, s * 0.48, tc[q], { rot: -0.75 + q * 0.32, lineColor: '#1a1a26' });
  } else {
    artBlob(c, -s * 0.6, -s * 0.95 + lift, s * 0.18, s * 0.32, C.body, { rot: -0.55, lineColor: C.line, shadeTo: C.shade });
  }
  // Vartalo
  artBlob(c, 0, -s * 0.68 + lift, s * 0.6, s * 0.45, C.body, { lineColor: C.line, shadeTo: C.shade, hi: 0.35 });
  if (C.dots) {
    c.fillStyle = C.dots;
    var dd = [[-0.3, -0.75], [0.1, -0.9], [-0.05, -0.55], [0.3, -0.62], [-0.38, -0.5], [0.2, -0.4]], q2;
    for (q2 = 0; q2 < dd.length; q2++) { c.beginPath(); c.arc(dd[q2][0] * s, dd[q2][1] * s + lift, s * 0.045, 0, Math.PI * 2); c.fill(); }
  }
  // Siipi
  c.save(); c.translate(-s * 0.05, -s * 0.72 + lift); c.rotate(-fl);
  artBlob(c, -s * 0.06, 0, s * 0.32, s * 0.2, C.wing, { lineColor: C.line });
  c.restore();
  // Pää
  var hx = s * 0.42 + pk * s * 0.16, hy = -s * 1.12 + lift + pk * s * 0.45;
  if (o.crow) { hx += s * 0.05; hy -= s * 0.12; }
  if (k === 'rooster') artBlob(c, s * 0.28, -s * 0.95 + lift, s * 0.22, s * 0.3, '#f0b040', { rot: 0.4, lineColor: '#a8701e' });
  var cs = k === 'rooster' ? 1.5 : 1;
  artCircle(c, hx - s * 0.06, hy - s * 0.23 * cs, s * 0.08 * cs, '#ff4f5e', { lineColor: '#b82a3a', line: 1 });
  artCircle(c, hx + s * 0.06, hy - s * 0.27 * cs, s * 0.09 * cs, '#ff4f5e', { lineColor: '#b82a3a', line: 1 });
  artCircle(c, hx + s * 0.16, hy - s * 0.21 * cs, s * 0.07 * cs, '#ff4f5e', { lineColor: '#b82a3a', line: 1 });
  artCircle(c, hx, hy, s * 0.24, k === 'rooster' ? '#f0b040' : C.body, { lineColor: k === 'rooster' ? '#a8701e' : C.line, shadeTo: k === 'rooster' ? '#d89030' : C.shade });
  artBlob(c, hx + s * 0.16, hy + s * 0.16, s * 0.05, s * 0.08 * cs, '#ff4f5e', { lineColor: '#b82a3a', line: 1 });
  c.beginPath();
  if (o.crow) {
    c.moveTo(hx + s * 0.2, hy - s * 0.06); c.lineTo(hx + s * 0.4, hy - s * 0.04); c.lineTo(hx + s * 0.22, hy + s * 0.01);
    c.moveTo(hx + s * 0.22, hy + s * 0.04); c.lineTo(hx + s * 0.38, hy + s * 0.12); c.lineTo(hx + s * 0.2, hy + s * 0.1);
  } else {
    c.moveTo(hx + s * 0.2, hy - s * 0.04); c.lineTo(hx + s * 0.4, hy + s * 0.03); c.lineTo(hx + s * 0.2, hy + s * 0.09); c.closePath();
  }
  c.fillStyle = '#ffb84f';
  c.fill();
  c.strokeStyle = '#c97a1a';
  c.lineWidth = Math.max(1, s * 0.03);
  c.stroke();
  artEye(c, hx + s * 0.07, hy - s * 0.04, s * 0.065, 0.5, o.blink);
  c.restore();
}

function drawCoopBird(c, b) {
  var s = coopBirdSize(b), x = b.fx * viewW + (b.ox || 0), y = b.fy * viewH + (b.oy || 0) - b.z;
  var sit = b.state === 'lay' || b.state === 'perch' || b.state === 'swing' || b.state === 'hug';
  if (b.z < viewH * 0.02 && !b.oy) artShadow(c, b.fx * viewW, b.fy * viewH + s * 0.05, s * 0.7, s * 0.18, 0.18);
  if (b.state === 'bathe') y += s * 0.15;
  var blink = (b.state === 'perch' && b.timer > 2 && Math.sin(b.ph * 0.7) > 0.3) || Math.sin(b.ph * 1.3) > 0.985 ? 1 : 0;
  drawCoopBirdShape(c, b.k, b.c, x, y, s, b.dir, { flap: b.flapT > 0 || b.state === 'bathe' || b.state === 'held', peck: b.peck, sit: sit, blink: blink, crow: b.crowT > 0, age: coopAge(b) });
  if (b.grewT > 0) artGlow(c, x, y - s * 0.7, s * 1.4, '#fff2a0', Math.min(0.6, b.grewT * 0.3));
}

// Lajittelu muiden kanssa (drawHome): linnut, joita ei pidellä
function coopDrawOrder(order) {
  var i, b;
  if (homeRoomIdx !== COOP_ROOM) return;
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    if (b.state === 'held') continue;
    order.push({ y: b.fy * viewH + (b.state === 'swing' ? homeItemSize() * 0.01 : 0), coopBird: b });
  }
}

function drawCoopEgg(c, x, y, r, p, gold) {
  var col = gold ? '#ffd24f' : COOP_EGG_PAINT[p] || COOP_EGG_PAINT[0];
  if (gold) artGlow(c, x, y - r, r * 2.6, '#fff2a0', 0.5 + Math.sin(globalT * 5) * 0.2);
  artBlob(c, x, y - r * 1.15, r * 0.82, r * 1.1, p && !gold ? '#fff6e8' : col, { lineColor: gold ? '#c99a20' : '#b8a888', line: Math.max(1, r * 0.12), hi: 0.5 });
  if (gold) { drawStar(c, x, y - r * 1.1, r * 0.45, 0, 0); return; }
  if (!p) return;
  c.save();
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y - r * 1.15, r * 0.78, r * 1.06, 0, 0, Math.PI * 2); else c.arc(x, y - r * 1.15, r * 0.9, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = col;
  var q;
  if (p % 2) {
    for (q = 0; q < 3; q++) c.fillRect(x - r, y - r * (0.45 + q * 0.62), r * 2, r * 0.22);
  } else {
    for (q = 0; q < 6; q++) { c.beginPath(); c.arc(x + ((q % 3) - 1) * r * 0.5, y - r * (0.6 + Math.floor(q / 3) * 0.8) - (q % 2) * r * 0.2, r * 0.18, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}

// Kanatalo pesineen, orsi (taustaan ja pienoiskuvaan)
function coopDrawHouse(b, sp, h) {
  var hs = sp.house, x0 = hs.x, w = hs.w, base = hs.base, top = base - h * 0.3, lw = Math.max(1.5, h * 0.004), i, n;
  // Seinät ja katto
  b.beginPath(); b.rect(x0, top, w, base - top);
  artFillPath(b, '#f4a3a0', top, base, h * 0.1, { lineColor: '#a85450', line: lw });
  b.strokeStyle = 'rgba(168,84,80,0.35)';
  b.lineWidth = lw;
  for (i = 1; i < 6; i++) { b.beginPath(); b.moveTo(x0, top + i * (base - top) / 6); b.lineTo(x0 + w, top + i * (base - top) / 6); b.stroke(); }
  b.beginPath(); b.moveTo(x0 - h * 0.03, top + h * 0.005); b.lineTo(x0 + w / 2, top - h * 0.13); b.lineTo(x0 + w + h * 0.03, top + h * 0.005); b.closePath();
  artFillPath(b, '#c286e0', top - h * 0.13, top, h * 0.1, { lineColor: '#7a4a9a', line: lw });
  // Sydänikkuna päädyssä
  b.fillStyle = '#fff6d8';
  drawHeartShape(b, x0 + w / 2, top - h * 0.055, h * 0.022, true);
  // Pesälaatikot (aukko ja olki)
  for (n = 0; n < 3; n++) {
    var nx = sp.nests[n].x, ny = sp.nests[n].y, bw = h * 0.085, bh = h * 0.075;
    artRoundRect(b, nx - bw / 2 - h * 0.008, ny - bh - h * 0.008, bw + h * 0.016, bh + h * 0.016, h * 0.012, '#c98b4a', { lineColor: '#7a5030', line: lw });
    b.fillStyle = '#5a3424';
    roundRect(b, nx - bw / 2, ny - bh, bw, bh, h * 0.01);
    b.fill();
    artBlob(b, nx, ny - h * 0.008, bw * 0.48, h * 0.016, '#f0d070', { lineColor: '#b8963a', line: 1 });
  }
  // Ovi ja luiska
  var dx = x0 + w * 0.5;
  artRoundRect(b, dx - h * 0.03, base - h * 0.075, h * 0.06, h * 0.075, h * 0.02, '#8a5a30', { lineColor: '#5e3b1c', line: lw });
  b.fillStyle = '#2a1a10';
  roundRect(b, dx - h * 0.022, base - h * 0.065, h * 0.044, h * 0.065, h * 0.016);
  b.fill();
  b.beginPath(); b.moveTo(dx - h * 0.025, base); b.lineTo(dx + h * 0.025, base); b.lineTo(dx + h * 0.06, base + h * 0.04); b.lineTo(dx + h * 0.0, base + h * 0.04); b.closePath();
  artFillPath(b, '#c98b4a', base, base + h * 0.04, h * 0.03, { lineColor: '#7a5030', line: lw });
  // Orsi
  var r = sp.roost;
  artLimb(b, r.x0, r.base, r.x0, r.base - r.z - h * 0.01, h * 0.016, '#a9743f');
  artLimb(b, r.x1, r.base, r.x1, r.base - r.z - h * 0.01, h * 0.016, '#a9743f');
  artLimb(b, r.x0 - h * 0.015, r.base - r.z, r.x1 + h * 0.015, r.base - r.z, h * 0.014, '#c98b4a');
}

// Tausta: taivas, kukkulat, aitaus (seinämaali), maa ja hiekkapiha (lattiamaali), kanatalo
function renderCoopBg(b, room, h, wallP, floorP) {
  var w = room.x1 + h * 0.02, i, x, y, fy = room.floorY, sp = coopSpots(), rw = room.x1 - room.x0;
  var sky = b.createLinearGradient(0, 0, 0, fy);
  sky.addColorStop(0, '#9fd8ff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, fy);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.55, h * 0.12, h * 0.03);
  cloudShape(b, w * 0.82, h * 0.22, h * 0.02);
  b.fillStyle = '#bfe6a6';
  b.beginPath(); b.arc(w * 0.75, fy + h * 0.06, h * 0.3, Math.PI, 0); b.fill();
  b.fillStyle = '#a8dc8c';
  b.beginPath(); b.arc(w * 0.5, fy + h * 0.1, h * 0.24, Math.PI, 0); b.fill();
  drawTree(b, w * 0.62, fy - h * 0.08, h * 0.1);
  drawTree(b, w * 0.9, fy - h * 0.1, h * 0.12);
  // Maa
  var grass = b.createLinearGradient(0, fy, 0, h);
  grass.addColorStop(0, '#9ee07f');
  grass.addColorStop(1, '#63b84e');
  b.fillStyle = grass;
  b.fillRect(0, fy, w, h - fy);
  // Hiekkapiha (lattiamaalin väri)
  artBlob(b, room.x0 + rw * 0.45, fy + (room.bottom - fy) * 0.5, rw * 0.44, (room.bottom - fy) * 0.42, floorP.floor[0], { lineColor: artShade(floorP.floor[1], -0.2), line: Math.max(1, h * 0.003), shadeTo: floorP.floor[1] });
  b.strokeStyle = 'rgba(200,160,60,0.55)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 26; i++) {
    x = room.x0 + rw * 0.1 + (i * 97.3) % (rw * 0.7);
    y = fy + h * 0.08 + (i * 41.7) % ((room.bottom - fy) * 0.7);
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + h * 0.02, y - h * 0.006 * ((i % 3) - 1)); b.stroke();
  }
  b.strokeStyle = 'rgba(40,110,40,0.35)';
  for (i = 0; i < 40; i++) {
    x = (i * 131.7) % w;
    y = fy + h * 0.03 + (i * 53.3) % (h - fy - h * 0.04);
    if (Math.abs(x - (room.x0 + rw * 0.45)) < rw * 0.4 && y > fy + h * 0.05) continue;
    b.beginPath(); b.moveTo(x - h * 0.006, y); b.lineTo(x - h * 0.008, y - h * 0.014); b.moveTo(x, y); b.lineTo(x + h * 0.001, y - h * 0.018); b.stroke();
  }
  // Aitaus takana (seinämaalin väri) ja kanaverkko
  var fc = wallP.pot, ft = fy - h * 0.14, lw = Math.max(1, h * 0.003);
  b.strokeStyle = 'rgba(255,255,255,0.55)';
  b.lineWidth = lw;
  for (x = 0; x < w; x += h * 0.025) {
    b.beginPath(); b.moveTo(x, ft + h * 0.02); b.lineTo(x + h * 0.06, fy); b.moveTo(x + h * 0.06, ft + h * 0.02); b.lineTo(x, fy); b.stroke();
  }
  b.fillStyle = fc;
  b.fillRect(0, ft + h * 0.015, w, h * 0.016);
  b.fillRect(0, fy - h * 0.03, w, h * 0.016);
  for (x = h * 0.01; x < w; x += h * 0.12) {
    b.beginPath(); b.rect(x, ft, h * 0.022, fy - ft + h * 0.01);
    artFillPath(b, fc, ft, fy, h * 0.02, { lineColor: artShade(fc, -0.35), line: lw });
  }
  for (i = 0; i < 8; i++) drawFlower(b, (i * 173.3) % w, fy + h * 0.02 + (i % 3) * h * 0.01, h * 0.007, ['#ffffff', '#ffd24f', '#ff9ec4'][i % 3]);
  coopDrawHouse(b, sp, h);
}

// Linnakartan pienoiskuva: tausta ja kanatalo pienennettynä samoista paikoista
function coopThumbBg(c, x, y, w, hh, wallP, floorP) {
  var room = homeRoom(), sc = w / (room.x1 - room.x0), h = viewH, fy = room.floorY, sp = coopSpots(), rw = room.x1 - room.x0;
  c.save();
  c.translate(x - room.x0 * sc, y - room.wallTop * sc);
  c.scale(sc, sc);
  var sky = c.createLinearGradient(0, room.wallTop, 0, fy);
  sky.addColorStop(0, '#9fd8ff');
  sky.addColorStop(1, '#eaf7ff');
  c.fillStyle = sky;
  c.fillRect(room.x0, room.wallTop, rw, fy - room.wallTop);
  c.fillStyle = '#9ee07f';
  c.fillRect(room.x0, fy, rw, room.bottom - fy);
  c.fillStyle = floorP.floor[0];
  c.beginPath();
  if (c.ellipse) c.ellipse(room.x0 + rw * 0.45, fy + (room.bottom - fy) * 0.5, rw * 0.44, (room.bottom - fy) * 0.42, 0, 0, Math.PI * 2); else c.arc(room.x0 + rw * 0.45, fy + (room.bottom - fy) * 0.5, rw * 0.3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = wallP.pot;
  c.fillRect(room.x0, fy - h * 0.125, rw, h * 0.02);
  c.fillRect(room.x0, fy - h * 0.03, rw, h * 0.02);
  var k;
  for (k = room.x0 + h * 0.01; k < room.x1; k += h * 0.12) c.fillRect(k, fy - h * 0.14, h * 0.025, h * 0.15);
  coopDrawHouse(c, sp, h);
  coopDrawStations(c, sp, h);
  c.restore();
}
// Pienoiskuvan linnut (tavaroiden jälkeen)
function coopThumbFront(c, x, y, w) {
  var room = homeRoom(), sc = w / (room.x1 - room.x0), i;
  c.save();
  c.translate(x - room.x0 * sc, y - room.wallTop * sc);
  c.scale(sc, sc);
  for (i = 0; i < coopBirds.length; i++) {
    var b = coopBirds[i];
    drawCoopBirdShape(c, b.k, b.c, b.fx * viewW, b.fy * viewH - (b.z || 0), coopBirdSize(b), b.dir || 1, { flap: false, peck: 0, sit: b.z > 0, age: coopAge(b) });
  }
  c.restore();
}

// Kaukalo, vesikuppi, pesien munat, kori ja hautomo (päivittyvät)
function coopDrawStations(c, sp, h) {
  var t = sp.trough, cu = sp.cup, i, k, lw = Math.max(1.5, h * 0.004);
  // Kaukalo jyvineen
  artLimb(c, t.x - t.w * 0.4, t.y, t.x - t.w * 0.4, t.y - h * 0.03, h * 0.012, '#8a5a30');
  artLimb(c, t.x + t.w * 0.4, t.y, t.x + t.w * 0.4, t.y - h * 0.03, h * 0.012, '#8a5a30');
  c.beginPath();
  c.moveTo(t.x - t.w / 2, t.y - h * 0.07); c.lineTo(t.x + t.w / 2, t.y - h * 0.07); c.lineTo(t.x + t.w * 0.44, t.y - h * 0.025); c.lineTo(t.x - t.w * 0.44, t.y - h * 0.025); c.closePath();
  artFillPath(c, '#c98b4a', t.y - h * 0.07, t.y - h * 0.025, h * 0.03, { lineColor: '#6a4424', line: lw });
  if (coopGrain > 0) {
    var gl = Math.min(1, coopGrain);
    artBlob(c, t.x, t.y - h * 0.07, t.w * 0.47, h * (0.008 + gl * 0.012), '#ffd24f', { lineColor: '#c99a20', line: 1 });
    c.fillStyle = '#e0a020';
    for (k = 0; k < 9; k++) c.fillRect(t.x - t.w * 0.4 + k * t.w * 0.1, t.y - h * (0.075 + (k % 2) * 0.006) - gl * h * 0.006, h * 0.006, h * 0.004);
  }
  // Vesikuppi
  artBlob(c, cu.x, cu.y - h * 0.018, cu.r, h * 0.022, '#9aa6b8', { lineColor: '#5a6478' });
  artBlob(c, cu.x, cu.y - h * 0.03, cu.r * 0.88, h * 0.016, coopWater > 0 ? '#7fd4ff' : '#5a6478', { lineColor: '#4f9ad9', line: 1 });
  if (coopWater > 0) {
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = Math.max(1, h * 0.003);
    c.beginPath(); c.arc(cu.x - cu.r * 0.3, cu.y - h * 0.032, cu.r * (0.15 + (globalT % 1.5) * 0.2), 0, Math.PI * 2); c.stroke();
  }
  // Pesien munat
  for (k = 0; k < 3; k++) {
    var ne = coopNests[k];
    for (i = 0; i < ne.length && i < 3; i++) drawCoopEgg(c, sp.nests[k].x + (i - (Math.min(3, ne.length) - 1) / 2) * h * 0.024, sp.nests[k].y - h * 0.004, h * 0.016, 0, ne[i].g);
  }
}

// Maan tasalla: kaukalo, kuppi, munat, kori, hautomo ja levossa olevat työkalut
function drawCoopGround(c) {
  var sp, h = viewH, i, k, n, s;
  if (homeRoomIdx !== COOP_ROOM) return;
  sp = coopSpots();
  coopDrawStations(c, sp, h);
  // Muna kimaltaa pesässä
  for (k = 0; k < 3; k++) if (coopNests[k].length && Math.sin(globalT * 3 + k) > 0.8) artGlow(c, sp.nests[k].x, sp.nests[k].y - h * 0.02, h * 0.05, '#fffbe0', 0.5);
  // Kori munineen
  var bk = sp.basket, bb = coopBasketBounce > 0 ? Math.sin(coopBasketBounce * 20) * h * 0.006 : 0, flying = 0;
  for (i = 0; i < coopFly.length; i++) if (!coopFly[i].gold) flying++;
  n = Math.max(0, coopBasket.length - flying);
  for (i = 0; i < n && i < 12; i++) {
    var row = Math.floor(i / 4), col = i % 4;
    drawCoopEgg(c, bk.x + (col - 1.5) * h * 0.028 + (row % 2) * h * 0.012, bk.y - h * 0.045 - row * h * 0.014 - bb, h * 0.018, coopBasket[i], 0);
  }
  c.beginPath();
  c.moveTo(bk.x - h * 0.08, bk.y - h * 0.06 - bb); c.lineTo(bk.x + h * 0.08, bk.y - h * 0.06 - bb); c.lineTo(bk.x + h * 0.06, bk.y); c.lineTo(bk.x - h * 0.06, bk.y); c.closePath();
  artFillPath(c, '#d9a35a', bk.y - h * 0.06, bk.y, h * 0.04, { lineColor: '#8a5a30' });
  c.strokeStyle = 'rgba(138,90,48,0.6)';
  c.lineWidth = Math.max(1, h * 0.003);
  for (i = 1; i < 3; i++) { c.beginPath(); c.moveTo(bk.x - h * 0.08 + i * h * 0.005, bk.y - h * 0.06 + i * h * 0.02 - bb); c.lineTo(bk.x + h * 0.08 - i * h * 0.005, bk.y - h * 0.06 + i * h * 0.02 - bb); c.stroke(); }
  c.strokeStyle = '#a9743f';
  c.lineWidth = Math.max(2, h * 0.008);
  c.beginPath(); c.arc(bk.x, bk.y - h * 0.06 - bb, h * 0.065, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  // Hautomo: lasikupu, lämpölamppu ja muna
  var ic = sp.inc, sh = coopIncShake > 0 ? Math.sin(coopIncShake * 30) * h * 0.005 : 0, d = coopDay();
  var ready = coopInc >= 0 && d > coopInc;
  artRoundRect(c, ic.x - h * 0.07 + sh, ic.y - h * 0.04, h * 0.14, h * 0.04, h * 0.012, '#ff9ec4', { lineColor: '#b85a80' });
  if (coopInc >= 0) artGlow(c, ic.x + sh, ic.y - h * 0.07, h * 0.08, '#ffd6a0', 0.6 + Math.sin(globalT * 2) * 0.15);
  c.fillStyle = 'rgba(220,240,255,0.45)';
  c.beginPath(); c.arc(ic.x + sh, ic.y - h * 0.04, h * 0.065, Math.PI, 0); c.fill();
  c.strokeStyle = '#8ab8d8';
  c.lineWidth = Math.max(1.5, h * 0.004);
  c.stroke();
  artCircle(c, ic.x + sh, ic.y - h * 0.112, h * 0.014, coopInc >= 0 ? '#ffb84f' : '#d8c8b0', { lineColor: '#a87a3a', line: 1 });
  if (coopInc >= 0) {
    var wob = ready ? Math.sin(globalT * 9) * 0.25 * (Math.sin(globalT * 1.7) > 0 ? 1 : 0.3) : Math.sin(globalT * 2) * 0.04;
    if (coopHatchT > 0) wob = Math.sin(globalT * 30) * 0.3;
    c.save();
    c.translate(ic.x + sh, ic.y - h * 0.04);
    c.rotate(wob);
    drawCoopEgg(c, 0, 0, h * 0.022, coopIncP, 0);
    if (coopHatchT > 0 && coopHatchT < 1.1) {
      // Halkeama
      c.strokeStyle = '#5a4a3a';
      c.lineWidth = Math.max(1, h * 0.003);
      c.beginPath(); c.moveTo(-h * 0.017, -h * 0.03); c.lineTo(-h * 0.008, -h * 0.024); c.lineTo(0, -h * 0.032); c.lineTo(h * 0.008, -h * 0.024); c.lineTo(h * 0.017, -h * 0.03); c.stroke();
    }
    c.restore();
    if (ready && coopHatchT <= 0) drawHintArrow(c, ic.x, ic.y - h * 0.15);
  }
  // Levossa olevat työkalut
  var held = homeDrag && homeDrag.coop === 'tool' ? homeDrag.tool : '';
  if (held !== 'sack') drawCoopTool(c, 'sack', coopFed !== d);
  if (held !== 'jug') drawCoopTool(c, 'jug', coopWat !== d);
  // Jyvät ja pisarat
  for (i = 0; i < coopBits.length; i++) {
    c.fillStyle = coopBits[i].kind === 'sack' ? '#ffd24f' : '#5fb8ff';
    s = coopBits[i].kind === 'sack' ? h * 0.005 : h * 0.006;
    c.beginPath(); c.arc(coopBits[i].x, coopBits[i].y, s, 0, Math.PI * 2); c.fill();
  }
}

// Jyväsäkki tai vesikannu; need = tänään tekemättä (hehkuu ja keinahtelee)
function drawCoopTool(c, name, need) {
  var p = coopToolPos(name), s = coopToolSize(), t = coopTool[name], x = p.x, y = p.y;
  var bob = need && !(homeDrag && homeDrag.tool === name) ? Math.abs(Math.sin(globalT * 3)) * s * 0.06 : 0;
  var rot = t.tilt * 0.9 + (t.shake > 0 ? Math.sin(t.shake * 25) * 0.12 : 0);
  if (need) artGlow(c, x, y - s * 0.4, s * 0.9, '#fff2a0', 0.35 + Math.sin(globalT * 3) * 0.15);
  c.save();
  c.translate(x, y - bob);
  c.rotate(rot);
  if (name === 'sack') {
    c.beginPath();
    c.moveTo(-s * 0.3, -s * 0.62); c.quadraticCurveTo(-s * 0.48, -s * 0.2, -s * 0.36, 0); c.lineTo(s * 0.36, 0); c.quadraticCurveTo(s * 0.48, -s * 0.2, s * 0.3, -s * 0.62); c.closePath();
    artFillPath(c, '#e8cf9a', -s * 0.62, 0, s * 0.4, { lineColor: '#9a7a40' });
    artBlob(c, 0, -s * 0.64, s * 0.3, s * 0.07, '#ffd24f', { lineColor: '#c99a20', line: 1 });
    c.strokeStyle = '#c96a3a';
    c.lineWidth = Math.max(1.5, s * 0.04);
    c.beginPath(); c.moveTo(-s * 0.32, -s * 0.52); c.quadraticCurveTo(0, -s * 0.46, s * 0.32, -s * 0.52); c.stroke();
    // Vehnäntähkä kyljessä
    c.strokeStyle = '#b8862a';
    c.lineWidth = Math.max(1, s * 0.025);
    c.beginPath(); c.moveTo(0, -s * 0.08); c.lineTo(0, -s * 0.38); c.stroke();
    for (var k = 0; k < 3; k++) {
      artBlob(c, -s * 0.05, -s * (0.2 + k * 0.07), s * 0.04, s * 0.025, '#f0b040', { rot: -0.6, line: false });
      artBlob(c, s * 0.05, -s * (0.2 + k * 0.07), s * 0.04, s * 0.025, '#f0b040', { rot: 0.6, line: false });
    }
  } else {
    c.strokeStyle = '#3f78c9';
    c.lineWidth = Math.max(2, s * 0.07);
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.15, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
    c.beginPath();
    c.moveTo(-s * 0.26, -s * 0.6); c.lineTo(s * 0.22, -s * 0.6); c.lineTo(s * 0.48, -s * 0.68); c.lineTo(s * 0.3, -s * 0.48); c.quadraticCurveTo(s * 0.34, -s * 0.1, s * 0.22, 0); c.lineTo(-s * 0.24, 0); c.quadraticCurveTo(-s * 0.34, -s * 0.3, -s * 0.26, -s * 0.6); c.closePath();
    artFillPath(c, '#5fa8ff', -s * 0.68, 0, s * 0.35, { lineColor: '#2f5f9f' });
    yardDrop(c, -s * 0.02, -s * 0.28, s * 0.08);
  }
  c.restore();
}

// Tavaroiden ja lintujen päällä: pesän reunat istujien edessä, nälkäkuplat,
// lentävät munat, sydämet ja sormen alla oleva lintu, työkalu tai muna
function drawCoopAbove(c) {
  var sp, h = viewH, i, b, s, k, x, y, d;
  if (homeRoomIdx !== COOP_ROOM) return;
  sp = coopSpots();
  d = coopDay();
  for (i = 0; i < coopBirds.length; i++) {
    b = coopBirds[i];
    if (b.state === 'lay' && b.slot >= 0 && b.z === b.zt) {
      var nx = sp.nests[b.slot].x, ny = sp.nests[b.slot].y;
      artRoundRect(c, nx - h * 0.05, ny - h * 0.02, h * 0.1, h * 0.028, h * 0.01, '#c98b4a', { lineColor: '#7a5030' });
      artBlob(c, nx, ny - h * 0.022, h * 0.045, h * 0.01, '#f0d070', { line: false });
    }
  }
  // Nälkä- tai janokupla yhden linnun yllä kerrallaan
  var needF = coopFed !== d, needW = coopWat !== d;
  if ((needF || needW) && coopBirds.length && !homeDrag) {
    var cyc = Math.floor(coopBubbleT / 3);
    b = coopBirds[cyc % coopBirds.length];
    if (b.state !== 'held' && b.k !== 'chick') {
      s = coopBirdSize(b);
      x = b.fx * viewW + b.dir * s * 0.5 + (b.ox || 0);
      y = b.fy * viewH - b.z - s * 2.1 + Math.sin(globalT * 3) * s * 0.06 + (b.oy || 0);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.beginPath(); c.arc(x, y, s * 0.36, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x - b.dir * s * 0.25, y + s * 0.38, s * 0.08, 0, Math.PI * 2); c.fill();
      if (needF && (!needW || cyc % 2 === 0)) {
        for (k = 0; k < 5; k++) artBlob(c, x + ((k % 3) - 1) * s * 0.13, y + (k < 3 ? s * 0.06 : -s * 0.08), s * 0.07, s * 0.05, '#ffd24f', { lineColor: '#c99a20', line: 1 });
      } else {
        yardDrop(c, x, y + s * 0.06, s * 0.14);
      }
    }
  }
  // Lentävät munat (koriin tai kultamuna kukkaroon)
  for (i = 0; i < coopFly.length; i++) {
    var f = coopFly[i], tt = Math.min(1, f.t);
    x = f.x0 + (f.x1 - f.x0) * tt;
    y = f.y0 + (f.y1 - f.y0) * tt - Math.sin(tt * Math.PI) * h * (f.back ? 0.05 : 0.15);
    drawCoopEgg(c, x, y + h * 0.02, h * 0.02, f.p, f.gold);
  }
  for (i = 0; i < coopHearts.length; i++) {
    var ht = coopHearts[i];
    if (ht.age < 0) continue;
    c.globalAlpha = Math.max(0, 1 - ht.age / 1.4);
    c.fillStyle = '#ff5f7e';
    drawHeartShape(c, ht.x + Math.sin(ht.age * 5) * h * 0.008, ht.y - ht.age * h * 0.08, h * 0.016, true);
    c.globalAlpha = 1;
  }
  if (!homeDrag || !homeDrag.coop) return;
  if (homeDrag.coop === 'bird') {
    b = homeDrag.bird;
    s = coopBirdSize(b);
    artShadow(c, b.fx * viewW, Math.min(homeRoom().bottom, b.fy * viewH + viewH * 0.06), s * 0.6, s * 0.15, 0.12);
    drawCoopBirdShape(c, b.k, b.c, b.fx * viewW, b.fy * viewH, s, b.dir, { flap: true, peck: 0, sit: false, age: coopAge(b) });
  } else if (homeDrag.coop === 'tool') {
    drawCoopTool(c, homeDrag.tool, false);
  } else if (homeDrag.coop === 'egg') {
    var onInc = Math.abs(homeDrag.gx - sp.inc.x) < h * 0.12 && Math.abs(homeDrag.gy - (sp.inc.y - h * 0.06)) < h * 0.12;
    if (onInc && coopInc < 0 && coopCount() < COOP_MAX) artGlow(c, sp.inc.x, sp.inc.y - h * 0.06, h * 0.1, '#fff2a0', 0.7);
    drawCoopEgg(c, homeDrag.gx, homeDrag.gy + h * 0.02, h * 0.024, homeDrag.p, 0);
  }
}

// Kanatarhan tavarat ja kaupan lintukortit: palauttaa true, jos piirrettiin
function drawCoopItem(c, it, x, y, s) {
  var i, k;
  if (coopIsBird(it.id)) {
    drawCoopBirdShape(c, it.id, it.id === 'hen' ? 3 : 0, x, y - s * 0.05, s * (it.id === 'chick' ? 0.5 : 0.42), 1, { flap: false, peck: 0, sit: false, age: 0 });
    return true;
  }
  if (it.id === 'haybale') {
    var hb = it.dustT > 0 ? Math.sin(it.dustT * 18) * s * 0.03 : 0;
    artRoundRect(c, x - s * 0.45, y - s * 0.42 - hb, s * 0.9, s * 0.42, s * 0.08, '#f0d070', { lineColor: '#b8963a' });
    c.strokeStyle = 'rgba(184,150,58,0.7)';
    c.lineWidth = Math.max(1, s * 0.02);
    for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x - s * 0.4 + i * s * 0.16, y - s * 0.38 - hb); c.lineTo(x - s * 0.35 + i * s * 0.16, y - s * 0.05 - hb); c.stroke(); }
    c.strokeStyle = '#c96a3a';
    c.lineWidth = Math.max(1.5, s * 0.035);
    c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.42 - hb); c.lineTo(x - s * 0.2, y - hb); c.moveTo(x + s * 0.2, y - s * 0.42 - hb); c.lineTo(x + s * 0.2, y - hb); c.stroke();
    return true;
  }
  if (it.id === 'flowerbed') {
    artRoundRect(c, x - s * 0.5, y - s * 0.16, s * 1.0, s * 0.16, s * 0.04, '#a9743f', { lineColor: '#6a4424' });
    artBlob(c, x, y - s * 0.17, s * 0.46, s * 0.05, '#6a4424', { line: false });
    var fcol = ['#ff5f7e', '#ffd24f', '#c9a0ff', '#ffffff', '#ff9ec4'];
    for (i = 0; i < 5; i++) {
      var fx2 = x - s * 0.36 + i * s * 0.18, wob = it.wigT > 0 ? Math.sin(it.wigT * 14 + i) * s * 0.05 : Math.sin(globalT * 2 + i) * s * 0.01, fh = s * (0.3 + (i % 2) * 0.08);
      yardStem(c, fx2, y - s * 0.18, fx2 + wob, y - s * 0.18 - fh, s * 0.025);
      drawFlower(c, fx2 + wob, y - s * 0.18 - fh, s * 0.045, fcol[i]);
    }
    if (it.wigT > 0) {
      // Perhonen lentää
      var bt = 1.6 - it.wigT, bx = x + Math.sin(bt * 4) * s * 0.4, by = y - s * (0.5 + bt * 0.5);
      c.fillStyle = '#c9a0ff';
      var wf = Math.abs(Math.sin(globalT * 20)) * s * 0.06;
      c.beginPath(); c.arc(bx - s * 0.05, by, s * 0.02 + wf, 0, Math.PI * 2); c.arc(bx + s * 0.05, by, s * 0.02 + wf, 0, Math.PI * 2); c.fill();
    }
    return true;
  }
  if (it.id === 'coopswing') {
    var sa = coopSwingAngle(it), L = s * 0.85, px = x + Math.sin(sa) * L, py = y - s * 1.2 + Math.cos(sa) * L;
    artLimb(c, x - s * 0.45, y, x - s * 0.3, y - s * 1.25, s * 0.05, '#a9743f');
    artLimb(c, x + s * 0.45, y, x + s * 0.3, y - s * 1.25, s * 0.05, '#a9743f');
    artLimb(c, x - s * 0.38, y - s * 1.22, x + s * 0.38, y - s * 1.22, s * 0.06, '#8a5a30');
    c.strokeStyle = '#c9a36a';
    c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(x - s * 0.12, y - s * 1.2); c.lineTo(px - s * 0.12, py); c.moveTo(x + s * 0.12, y - s * 1.2); c.lineTo(px + s * 0.12, py); c.stroke();
    artLimb(c, px - s * 0.2, py, px + s * 0.2, py, s * 0.045, '#ff9ec4', '#c94f7e');
    return true;
  }
  if (it.id === 'lantern') {
    artLimb(c, x, y, x, y - s * 1.0, s * 0.05, '#5a5a6a');
    artLimb(c, x, y - s * 1.0, x + s * 0.22, y - s * 1.0, s * 0.04, '#5a5a6a');
    var lx = x + s * 0.22, ly = y - s * 0.78 + Math.sin(globalT * 1.5) * s * 0.01;
    if (it.on) artGlow(c, lx, ly, s * 0.7, '#ffe27a', 0.5 + Math.sin(globalT * 4) * 0.08);
    artRoundRect(c, lx - s * 0.1, ly - s * 0.14, s * 0.2, s * 0.24, s * 0.04, it.on ? '#fff2a0' : '#d8d4e4', { lineColor: '#5a5a6a' });
    c.fillStyle = '#5a5a6a';
    c.beginPath(); c.moveTo(lx - s * 0.13, ly - s * 0.14); c.lineTo(lx, ly - s * 0.24); c.lineTo(lx + s * 0.13, ly - s * 0.14); c.closePath(); c.fill();
    if (it.on) artCircle(c, lx, ly - s * 0.01, s * 0.04, '#ffb84f', { line: false });
    return true;
  }
  if (it.id === 'scarecrow') {
    var wig = it.wigT > 0 ? Math.sin(it.wigT * 16) * 0.35 : Math.sin(globalT * 1.5) * 0.04;
    artLimb(c, x, y, x, y - s * 0.9, s * 0.06, '#a9743f');
    c.save(); c.translate(x, y - s * 0.75); c.rotate(wig);
    artLimb(c, -s * 0.45, 0, s * 0.45, 0, s * 0.06, '#a9743f');
    artBlob(c, -s * 0.48, s * 0.02, s * 0.06, s * 0.04, '#f0d070', { line: false });
    artBlob(c, s * 0.48, s * 0.02, s * 0.06, s * 0.04, '#f0d070', { line: false });
    c.restore();
    c.beginPath(); c.moveTo(x - s * 0.22, y - s * 0.82); c.lineTo(x + s * 0.22, y - s * 0.82); c.lineTo(x + s * 0.28, y - s * 0.35); c.lineTo(x - s * 0.28, y - s * 0.35); c.closePath();
    artFillPath(c, '#6fa8e0', y - s * 0.82, y - s * 0.35, s * 0.25, { lineColor: '#2f5f9f' });
    c.fillStyle = '#ffd24f';
    c.fillRect(x - s * 0.1, y - s * 0.65, s * 0.08, s * 0.08);
    artCircle(c, x, y - s * 0.95, s * 0.15, '#f0d8a0', { lineColor: '#9a7a40' });
    artEye(c, x - s * 0.05, y - s * 0.97, s * 0.025, 0, 0);
    artEye(c, x + s * 0.05, y - s * 0.97, s * 0.025, 0, 0);
    c.strokeStyle = '#8a5a30';
    c.lineWidth = Math.max(1, s * 0.015);
    c.beginPath(); c.arc(x, y - s * 0.92, s * 0.06, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    var hj = it.wigT > 0 ? Math.abs(Math.sin(it.wigT * 8)) * s * 0.08 : 0;
    artBlob(c, x, y - s * 1.06 - hj, s * 0.26, s * 0.04, '#c98b4a', { lineColor: '#7a5030' });
    artRoundRect(c, x - s * 0.12, y - s * 1.22 - hj, s * 0.24, s * 0.16, s * 0.04, '#c98b4a', { lineColor: '#7a5030' });
    drawFlower(c, x + s * 0.09, y - s * 1.12 - hj, s * 0.03, '#ff5f7e');
    return true;
  }
  if (it.id === 'dustbath') {
    artBlob(c, x, y - s * 0.06, s * 0.5, s * 0.14, '#c9a36a', { lineColor: '#8a6a3a' });
    artBlob(c, x, y - s * 0.08, s * 0.42, s * 0.09, '#e8cf9a', { line: false });
    c.fillStyle = 'rgba(138,106,58,0.5)';
    for (i = 0; i < 6; i++) { c.beginPath(); c.arc(x - s * 0.3 + i * s * 0.12, y - s * (0.07 + (i % 2) * 0.03), s * 0.015, 0, Math.PI * 2); c.fill(); }
    for (i = 0; i < 4; i++) artCircle(c, x - s * 0.52 + (i % 2) * s * 1.04, y - s * (0.05 + Math.floor(i / 2) * 0.06), s * 0.05, '#b9b4c8', { lineColor: '#6a6278', line: 1 });
    return true;
  }
  if (it.id === 'weathervane') {
    var spin = it.spinT > 0 ? it.spinT * 9 : Math.sin(globalT * 0.8) * 0.4;
    artLimb(c, x, y, x, y - s * 1.3, s * 0.04, '#5a5a6a');
    artBlob(c, x, y - s * 0.02, s * 0.12, s * 0.04, '#5a5a6a', { line: false });
    c.strokeStyle = '#5a5a6a';
    c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(x - s * 0.2, y - s * 1.0); c.lineTo(x + s * 0.2, y - s * 1.0); c.stroke();
    // Kukko-viiri kääntyy (leveys kertoo kulman)
    var cw2 = Math.cos(spin);
    c.save(); c.translate(x, y - s * 1.45); c.scale(cw2 >= 0 ? Math.max(0.15, cw2) : Math.min(-0.15, cw2), 1);
    drawCoopBirdShape(c, 'rooster', 0, 0, s * 0.12, s * 0.3, 1, { flap: false, peck: 0, sit: true, age: 1 });
    c.restore();
    artCircle(c, x, y - s * 1.32, s * 0.035, '#ffd24f', { lineColor: '#c99a20', line: 1 });
    return true;
  }
  return false;
}

// Kanatarhan tavaran napautus: palauttaa true, jos tavara oli kanatarhan
function coopItemTap(it) {
  var i, s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH, b;
  if (it.id === 'haybale') {
    it.dustT = 0.8;
    spawnSparkles(x, y - s * 0.45, 14, '#f0d070');
    playNote(300, 0, 0.06, 'triangle', 0.18);
    playNote(260, 0.08, 0.08, 'triangle', 0.18);
  } else if (it.id === 'flowerbed') {
    it.wigT = 1.6;
    playNote(988, 0, 0.1, 'sine', 0.2);
    playNote(1175, 0.1, 0.1, 'sine', 0.2);
    playNote(1568, 0.2, 0.2, 'sine', 0.2);
  } else if (it.id === 'coopswing') {
    it.rockT = 3;
    playNote(440, 0, 0.12, 'sine', 0.2);
    playNote(523, 0.4, 0.12, 'sine', 0.2);
  } else if (it.id === 'lantern') {
    it.on = !it.on;
    playNote(it.on ? 880 : 440, 0, 0.12, 'sine', 0.22);
    if (it.on) spawnSparkles(x + s * 0.22, y - s * 0.78, 10, '#ffe27a');
  } else if (it.id === 'scarecrow') {
    it.wigT = 1.2;
    playNote(330, 0, 0.1, 'triangle', 0.2);
    playNote(262, 0.12, 0.15, 'triangle', 0.2);
    // Kanat säikähtävät leikisti ja pyrähtävät kauemmas
    if (homeRoomIdx === COOP_ROOM) {
      for (i = 0; i < coopBirds.length; i++) {
        b = coopBirds[i];
        if (b.state === 'held' || b.state === 'lay' || b.z > 0) continue;
        var dx = b.fx * viewW - x, dist = Math.abs(dx);
        if (dist < viewH * 0.35) {
          b.flapT = 0.8;
          coopGo(b, '', { x: Math.min(Math.max(b.fx * viewW + (dx >= 0 ? 1 : -1) * viewH * 0.18, homeRoom().x0 + viewH * 0.06), homeRoom().x1 - viewH * 0.06), y: b.fy * viewH }, true);
          if (b.k === 'chick') coopCheep(i * 0.08); else coopCluck(i * 0.08);
        }
      }
    }
  } else if (it.id === 'dustbath') {
    it.dustT = 0.8;
    spawnDust(x, y - s * 0.08, 8, 0);
    playNote(200, 0, 0.12, 'triangle', 0.15);
  } else if (it.id === 'weathervane') {
    it.spinT = 1.5;
    for (i = 0; i < 5; i++) playNote(600 + i * 120, i * 0.05, 0.12, 'sine', 0.08);
  } else {
    return false;
  }
  return true;
}

// Huoneen kyltti: tipu
function coopSign(b, x, y, sh) {
  artCircle(b, x - sh * 0.05, y + sh * 0.12, sh * 0.2, '#ffe066', { lineColor: '#c99a20', line: 1 });
  artCircle(b, x + sh * 0.1, y - sh * 0.1, sh * 0.15, '#ffe066', { lineColor: '#c99a20', line: 1 });
  b.fillStyle = '#ff9f3a';
  b.beginPath(); b.moveTo(x + sh * 0.22, y - sh * 0.12); b.lineTo(x + sh * 0.34, y - sh * 0.08); b.lineTo(x + sh * 0.22, y - sh * 0.04); b.closePath(); b.fill();
  b.fillStyle = '#333';
  b.beginPath(); b.arc(x + sh * 0.13, y - sh * 0.13, sh * 0.03, 0, Math.PI * 2); b.fill();
}
