'use strict';

// Linnan ponitalli: linnan seitsemäs huone (HOME_ROOMS[6]) on ulkona
// kanatarhan vieressä (kanatarhan toinen portti, linnakartalla kukkulalla
// puutarhan yllä). Tallissa on karsina olkipesineen, heinäseimi,
// ruusuketaulu, vesikaukalo ja porkkanalaatikko. Aluksi tallissa on yksi poni;
// lisää poneja ja varsoja ostetaan kaupasta raahaamalla kuten tavarat.
//
// Päivän hoito (ei rangaistuksia: hoitamaton poni vain ei saa ruusuketta):
//   - Heinäkori raahataan seimen ylle ja vesisanko kaukalon ylle -> kallistus
//     ja kaato (sama ele kuin kanatarhan jyväsäkissä ja puutarhan kannussa).
//   - Ponit ovat aamulla laitumelta mutaisia. Harja raahataan ponin päälle ja
//     hangataan edestakaisin: mutaläiskät katoavat yksi kerrallaan, ja puhdas
//     poni kiiltää.
//   - Kun poni on ruokittu, juotettu ja harjattu, se laukkaa iloisen kierroksen
//     (hypäten esteen yli, jos tallissa on este) ja saa ruusukkeen, joka lentää
//     ruusuketaululle. Kultainen ruusuke (harvoin) on lisäksi yksi tähti.
//   - Taululta ruusuke raahataan karsinan olkipesään. Seuraavana päivänä
//     pesässä nukkuu varsa; napautus herättää sen. Kultaisesta ruusukkeesta
//     syntyy yksisarvisvarsa. Varsa kasvaa poniksi kolmessa päivässä.
//     Jos talli on täynnä, vanhin tavallinen poni vilkuttaa ja lähtee kylään.
// Porkkana raahataan laatikosta ponin suulle (rouskutus ja sydämiä). Ponin voi
// nostaa sormella (sylissä sydämiä) ja laskea pupun viereen: pupu ratsastaa
// kierroksen. Kaupan rusetti raahataan ponin harjaan. Viisi nopeaa tökkäystä
// ponin kylkeen saa sen nousemaan takajaloilleen (ja kerran päivässä
// kultaruusukkeen taululle). Tallin tavarat ovat HOME_ITEMS-listan lopussa
// (flow-home.js); poni ja varsa ovat siellä pony-merkittyinä, mutta ne eivät
// ole homeItems-tavaroita vaan stabPonies-eläimiä.

var STABLE_ROOM = 6;
var STAB_MAX = 6;            // poneja + varsoja + karsinan varsa enintään
var STAB_GROW_DAYS = 3;      // varsa kasvaa poniksi näin monessa päivässä
var STAB_POUR = 0.6;         // s kaatoa yhteen täyttöön
var STAB_MUD = 5;            // mutaläiskiä aamulla
var STAB_GOLD_CHANCE = 1 / 8;
var STAB_BOARD_MAX = 12;
// Turkit: valkoinen, rautias, musta, tähtikirjava, hopeanharmaa
var STAB_COATS = [
  { body: '#fffaf4', shade: '#e2d6ee', line: '#8a7a9a', nose: '#ffd9ec' },
  { body: '#d0844a', shade: '#a65a28', line: '#6a3818', nose: '#e8b088' },
  { body: '#4a4556', shade: '#2c2836', line: '#16131c', nose: '#7a7088' },
  { body: '#f1e8d8', shade: '#cfc0a6', line: '#7a6a50', nose: '#ffd9ec', dots: '#6a4a3a' },
  { body: '#c8cad8', shade: '#9a9cb0', line: '#5a5c70', nose: '#e8d8e8' }
];
var STAB_MANES = ['#fff6d8', '#6a3a1e', '#ff9ec4', '#c9a0ff', '#5fa8ff', '#2a2430'];
var STAB_SADDLES = ['#ff7bac', '#5fa8ff', '#ffd24f', '#6fd66f'];

// Tallennettava tila
var stabPonies = [];         // { k: 'pony'|'foal', c, m, u, fx, fy, born, bd, r, md, mud, bow } + ajonaikaiset
var stabBoard = [];          // ruusuketaulu: 0 = sininen, 1 = kultainen
var stabStall = -1;          // karsinan ruusukkeen päivä (-1 = tyhjä)
var stabStallG = 0;          // karsinassa kultaruusuke (yksisarvisvarsa)
var stabFed = -1;            // päivä, jona seimi täytettiin
var stabWat = -1;            // päivä, jona kaukalo täytettiin
var stabTrick = -1;          // päivä, jona takajaloille nousu antoi kultaruusukkeen
var stabInit = false;        // aloitusponi annettu
var stabTotal = 0;           // ruusukkeita kaikkiaan (pokaalin numero)

// Ajonaikainen tila
var stabHay = 0;             // seimen heinä 0..1
var stabWater = 0;           // kaukalon vesi 0..1
var stabTool = { hay: { fx: -1, fy: -1, tilt: 0, pour: 0, shake: 0 }, bucket: { fx: -1, fy: -1, tilt: 0, pour: 0, shake: 0 }, brush: { fx: -1, fy: -1, tilt: 0, pour: 0, shake: 0 } };
var stabFly = [];            // lentävät ruusukkeet ja tähdet { x0, y0, x1, y1, t, g, star }
var stabHearts = [];
var stabBits = [];           // heinät ja vesipisarat
var stabGalloper = null;     // poni, joka laukkaa ruusukekierrosta
var stabAwardT = 0;          // tauko ennen seuraavaa laukkaa
var stabWakeT = 0;           // karsinan varsan herääminen
var stabStallShake = 0;
var stabBoardWig = 0;
var stabBoxShake = 0;
var stabBubbleT = 0;
var stabFullT = 0;           // "Talli on täynnä" -kupla
var stabLeavers = [];
var stabRide = null;         // { b: pupun indeksi, p: poni }
var stabTaps = { p: null, n: 0, t: -9 };

function stabDay() {
  return yardDay();
}
function stabIsPony(id) {
  return id === 'pony' || id === 'foal';
}
function stabCount() {
  return stabPonies.length + (stabStall >= 0 ? 1 : 0);
}
function stabAge(p) {
  if (p.k !== 'foal') return 1;
  return Math.max(0, Math.min(1, (stabDay() - (p.born === undefined ? stabDay() : p.born)) / STAB_GROW_DAYS));
}
function stabPonySize(p) {
  var s = viewH * 0.1;
  if (p.k === 'foal') return s * (0.55 + 0.3 * stabAge(p));
  return s;
}
function stabManeOf(p) {
  return p.u ? maneColors : [STAB_MANES[p.m] || STAB_MANES[0]];
}

// ---------- Tallennus ----------
function stabSaveData() {
  var i, p, out = [];
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    out.push({ k: p.k, c: p.c, m: p.m, u: p.u ? 1 : 0, fx: Math.round(p.fx * 1000) / 1000, fy: Math.round(p.fy * 1000) / 1000, born: p.born, bd: p.bd, r: p.r, md: p.md, mud: p.mud, bow: p.bow });
  }
  return { p: out, b: stabBoard, s: stabStall, sg: stabStallG, f: stabFed, w: stabWat, t: stabTrick, i: stabInit ? 1 : 0, n: stabTotal };
}
// Vanha tallennus (d puuttuu) = tyhjä talli; aloitusponi tulee ensikäynnillä
function stabLoadData(d) {
  var i, src;
  stabPonies = [];
  stabBoard = [];
  stabStall = -1;
  stabStallG = 0;
  stabFed = stabWat = stabTrick = -1;
  stabInit = false;
  stabTotal = 0;
  stabHay = stabWater = 0;
  stabFly = [];
  stabLeavers = [];
  stabGalloper = null;
  stabRide = null;
  if (!d || typeof d !== 'object') return;
  if (d.p && d.p.length !== undefined) {
    for (i = 0; i < d.p.length && stabPonies.length < STAB_MAX; i++) {
      src = d.p[i];
      if (!src || !stabIsPony(src.k)) continue;
      var p = stabNewPony(src.k, src.c | 0, src.m | 0, src.u ? 1 : 0, +src.fx || 0.4, +src.fy || 0.8, src.born);
      if (src.bd !== undefined) p.bd = src.bd | 0;
      if (src.r !== undefined) p.r = src.r | 0;
      if (src.md !== undefined) p.md = src.md | 0;
      p.mud = Math.max(0, Math.min(STAB_MUD, src.mud | 0));
      p.bow = src.bow === undefined || src.bow === null ? -1 : Math.max(-1, Math.min(HOME_BOWS.length - 1, src.bow | 0));
      stabPonies.push(p);
    }
  }
  if (d.b && d.b.length !== undefined) for (i = 0; i < d.b.length && i < STAB_BOARD_MAX; i++) stabBoard.push(d.b[i] ? 1 : 0);
  stabStall = d.s === undefined ? -1 : (d.s | 0);
  stabStallG = d.sg ? 1 : 0;
  stabFed = d.f === undefined ? -1 : (d.f | 0);
  stabWat = d.w === undefined ? -1 : (d.w | 0);
  stabTrick = d.t === undefined ? -1 : (d.t | 0);
  stabInit = !!d.i;
  stabTotal = d.n | 0;
}

// Kelaa tallin kelloa: kaikki päiväleimat n päivää taaksepäin (testaus: VT.stableSkip)
function stabShiftDays(n) {
  var i, p;
  if (stabFed >= 0) stabFed -= n;
  if (stabWat >= 0) stabWat -= n;
  if (stabTrick >= 0) stabTrick -= n;
  if (stabStall >= 0) stabStall -= n;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.born !== undefined) p.born -= n;
    if (p.bd !== undefined) p.bd -= n;
    if (p.r !== undefined) p.r -= n;
    if (p.md !== undefined) p.md -= n;
  }
  saveProgress();
}

function stabNewPony(k, c, m, u, fx, fy, born) {
  var p = { k: k, c: Math.max(0, Math.min(STAB_COATS.length - 1, c | 0)), m: Math.max(0, Math.min(STAB_MANES.length - 1, m | 0)), u: u ? 1 : 0, fx: fx, fy: fy, bow: -1, mud: 0 };
  if (born !== undefined && born !== null) p.born = born | 0;
  p.z = 0; p.tx = fx; p.ty = fy; p.dir = Math.random() < 0.5 ? -1 : 1;
  p.state = 'idle'; p.goal = ''; p.timer = 0.5 + Math.random() * 2; p.path = null;
  p.wph = Math.random() * 6; p.ph = Math.random() * 6; p.head = 0; p.tossT = 0; p.rearT = 0;
  p.hugT = 0; p.grewT = 0; p.slot = -1; p.speed = 0; p.jumpT = 0; p.shineT = 0; p.rub = 0; p.swishT = 0;
  return p;
}

// Uudelle ponille turkki, jota tallissa ei vielä ole (muuten satunnainen)
function stabFreshCoat() {
  var used = [], i;
  for (i = 0; i < STAB_COATS.length; i++) used.push(0);
  for (i = 0; i < stabPonies.length; i++) used[stabPonies[i].c]++;
  for (i = 0; i < used.length; i++) if (!used[i]) return i;
  return randInt(STAB_COATS.length);
}
function stabFreshMane(c) {
  // Tumma turkki saa vaalean tai värikkään harjan, vaalea tumman tai värikkään
  var opts = c === 2 ? [0, 2, 3, 4] : (c === 1 ? [0, 5, 2] : [1, 2, 3, 4, 5]);
  return opts[randInt(opts.length)];
}

// ---------- Paikat ----------
// Kiinteät paikat huoneessa (pikseleinä): talli (karsina, seimi, taulu),
// kaukalo, porkkanalaatikko ja työkalujen lepopaikat
function stabSpots() {
  var room = homeRoom(), h = viewH, rw = room.x1 - room.x0, fy = room.floorY;
  var bx = room.x0 + h * 0.03, bw = h * 0.62, base = fy + h * 0.05, top = base - h * 0.34;
  return {
    barn: { x: bx, w: bw, base: base, top: top },
    stall: { x: bx + h * 0.135, y: base + h * 0.005, x0: bx + h * 0.02, x1: bx + h * 0.25, top: base - h * 0.22 },
    rack: { x: bx + h * 0.45, y: base - h * 0.1, w: h * 0.3 },
    board: { x: bx + h * 0.45, y: top + h * 0.075, w: h * 0.3, h: h * 0.1 },
    trough: { x: room.x0 + rw * 0.78, y: fy + h * 0.2, w: h * 0.2 },
    box: { x: room.x0 + rw * 0.24, y: room.bottom - h * 0.02 },
    hay: { x: room.x0 + rw * 0.38, y: room.bottom - h * 0.025 },
    bucket: { x: room.x0 + rw * 0.49, y: room.bottom - h * 0.025 },
    brush: { x: room.x0 + rw * 0.6, y: room.bottom - h * 0.03 }
  };
}
function stabGroundClamp(p) {
  var room = homeRoom(), x = p.fx * viewW, y = p.fy * viewH, s = stabPonySize(p);
  if (!viewW || !viewH) return;
  x = Math.min(Math.max(x, room.x0 + s * 0.8), room.x1 - s * 0.8);
  y = Math.min(Math.max(y, room.floorY + viewH * 0.09), room.bottom - viewH * 0.02);
  p.fx = x / viewW;
  p.fy = y / viewH;
}
function stabClampPt(pt) {
  var room = homeRoom();
  return {
    x: Math.min(Math.max(pt.x, room.x0 + viewH * 0.1), room.x1 - viewH * 0.1),
    y: Math.min(Math.max(pt.y, room.floorY + viewH * 0.09), room.bottom - viewH * 0.02)
  };
}
function stabToolHome(name) {
  return stabSpots()[name];
}
function stabToolPos(name) {
  var t = stabTool[name], hm = stabToolHome(name);
  if (!viewW || !viewH) return { x: hm.x, y: hm.y };
  if (t.fx < 0 || !isFinite(t.fx) || !isFinite(t.fy)) { t.fx = hm.x / viewW; t.fy = hm.y / viewH; }
  return { x: t.fx * viewW, y: t.fy * viewH };
}
function stabToolSize() {
  return viewH * 0.1;
}
// Työkalun kaatokohta ja kohde (seimi tai kaukalo), jonka yllä se on
function stabPourTarget(name) {
  var p = stabToolPos(name), s = stabToolSize(), sp = stabSpots();
  var px = p.x + s * 0.45, py = p.y - s * 0.5;
  var tg = name === 'hay' ? { x: sp.rack.x, y: sp.rack.y - viewH * 0.06, hw: sp.rack.w / 2 } : { x: sp.trough.x, y: sp.trough.y - viewH * 0.04, hw: sp.trough.w / 2 };
  if (Math.abs(px - tg.x) < tg.hw + viewH * 0.05 && py < tg.y + viewH * 0.03 && tg.y - py < viewH * 0.4) return tg;
  return null;
}
// Ponin pään kohta (porkkana, rusetti) ja vartalon keskikohta (harja)
function stabHeadPos(p) {
  var s = stabPonySize(p);
  return { x: p.fx * viewW + p.dir * s * 0.62, y: p.fy * viewH - p.z - s * 1.35 };
}
function stabBodyPos(p) {
  var s = stabPonySize(p);
  return { x: p.fx * viewW, y: p.fy * viewH - p.z - s * 0.82, rx: s * 0.72, ry: s * 0.42 };
}
// Seimen ääreen (0..2) ja kaukalon ääreen (0..1)
function stabRackSlot(j) {
  var r = stabSpots().rack;
  return { x: r.x + (j - 1) * viewH * 0.12 - viewH * 0.075, y: stabSpots().barn.base + viewH * (0.075 + (j % 2) * 0.02), dir: 1 };
}
function stabTroughSlot(j) {
  var t = stabSpots().trough, side = j % 2 ? 1 : -1;
  return { x: t.x + side * (t.w * 0.5 + viewH * 0.06), y: t.y + viewH * 0.012, dir: -side };
}
function stabFreeSlot(goal, n) {
  var j, i, used;
  for (j = 0; j < n; j++) {
    used = false;
    for (i = 0; i < stabPonies.length; i++) if (stabPonies[i].goal === goal && stabPonies[i].slot === j) used = true;
    if (!used) return j;
  }
  return -1;
}
function stabBusy(p) {
  return p.state === 'held' || p.state === 'gallop' || p.state === 'rear' || p.state === 'munch' || p === stabGalloper || (stabRide && stabRide.p === p);
}

// ---------- Hoito ----------
function stabFill(name) {
  var d = stabDay(), sp = stabSpots(), i, p, j, first, slot;
  if (name === 'hay') {
    first = stabFed !== d;
    stabFed = d;
    stabHay = 1;
    for (i = 0; i < stabPonies.length; i++) {
      p = stabPonies[i];
      if (stabBusy(p)) continue;
      j = stabFreeSlot('eat', 3);
      if (j < 0) break;
      slot = stabRackSlot(j);
      stabGo(p, 'eat', slot, 'trot');
      p.slot = j;
    }
    spawnSparkles(sp.rack.x, sp.rack.y - viewH * 0.05, first ? 18 : 8, '#f0d070');
    playNote(392, 0, 0.1, 'triangle', 0.25);
    playNote(523, 0.1, 0.1, 'triangle', 0.25);
    if (first) playNote(659, 0.2, 0.25, 'triangle', 0.25);
  } else {
    first = stabWat !== d;
    stabWat = d;
    stabWater = 1;
    for (i = 0; i < stabPonies.length; i++) {
      p = stabPonies[i];
      if (stabBusy(p) || p.goal === 'eat' || p.state === 'eat') continue;
      j = stabFreeSlot('drink', 2);
      if (j < 0) break;
      stabGo(p, 'drink', stabTroughSlot(j), 'walk');
      p.slot = j;
    }
    spawnSparkles(sp.trough.x, sp.trough.y - viewH * 0.03, first ? 16 : 6, '#7fd4ff');
    playNote(988, 0, 0.1, 'sine', 0.25);
    playNote(1319, 0.1, 0.18, 'sine', 0.25);
  }
  for (i = 0; i < stabPonies.length; i++) if (Math.random() < 0.5) stabNicker(stabPonies[i], 0.2 + i * 0.25);
  saveProgress();
}

// Poni lähtee kohteeseen (pt: { x, y } pikseleinä); perillä stabArrive.
// pace: 'walk', 'trot' tai 'gallop'. path: lisäpisteet, joiden kautta kuljetaan.
function stabGo(p, goal, pt, pace, path) {
  var c = stabClampPt(pt);
  p.goal = goal;
  p.slot = -1;
  p.tx = c.x / viewW;
  p.ty = c.y / viewH;
  p.pace = pace || 'walk';
  p.path = path || null;
  p.state = pace === 'gallop' ? 'gallop' : 'walk';
  if (pt.dir) p.wantDir = pt.dir; else p.wantDir = 0;
}

function stabArrive(p) {
  var sp = stabSpots();
  if (p.path && p.path.length) {
    var nx = stabClampPt(p.path.shift());
    p.tx = nx.x / viewW;
    p.ty = nx.y / viewH;
    return;
  }
  p.path = null;
  if (p.wantDir) p.dir = p.wantDir;
  if (p.goal === 'eat' && stabHay > 0) { p.state = 'eat'; p.timer = 5 + Math.random() * 4; p.dir = 1; return; }
  if (p.goal === 'drink' && stabWater > 0) { p.state = 'drink'; p.timer = 3 + Math.random() * 2; p.dir = p.fx * viewW < sp.trough.x ? 1 : -1; return; }
  if (p.goal === 'award') { stabAward(p); p.state = 'idle'; p.goal = ''; p.timer = 2; return; }
  if (p.goal === 'ride') { stabRideEnd(); p.state = 'idle'; p.goal = ''; p.timer = 2; return; }
  p.goal = '';
  p.state = 'idle';
  p.timer = 1.5 + Math.random() * 3;
}

// Mitä poni tekee seuraavaksi
function stabThink(p) {
  var room = homeRoom(), r = Math.random(), j, i, o, best = null, bd = 1e9, dx, dy;
  var jb = homeHasHere('jumpbar');
  p.goal = '';
  p.slot = -1;
  if (stabHay > 0.05 && r < (p.k === 'foal' ? 0.3 : 0.35)) {
    j = stabFreeSlot('eat', 3);
    if (j >= 0) { stabGo(p, 'eat', stabRackSlot(j), 'walk'); p.slot = j; return; }
  }
  r = Math.random();
  if (stabWater > 0.05 && r < 0.2) {
    j = stabFreeSlot('drink', 2);
    if (j >= 0) { stabGo(p, 'drink', stabTroughSlot(j), 'walk'); p.slot = j; return; }
  }
  if (p.k === 'foal') {
    // Varsa seuraa lähintä ponia
    for (i = 0; i < stabPonies.length; i++) {
      o = stabPonies[i];
      if (o.k !== 'pony' || o.state === 'held') continue;
      dx = o.fx - p.fx; dy = o.fy - p.fy;
      if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = o; }
    }
    if (best && Math.random() < 0.7) {
      stabGo(p, '', { x: best.fx * viewW - best.dir * viewH * (0.1 + Math.random() * 0.05), y: best.fy * viewH + viewH * (Math.random() - 0.3) * 0.05 }, 'walk');
      return;
    }
  }
  r = Math.random();
  if (jb && r < 0.12 && p.k === 'pony') {
    // Hyppää esteen yli huvikseen
    var side = p.fx * viewW < jb.fx * viewW ? 1 : -1;
    stabGo(p, '', { x: jb.fx * viewW - side * viewH * 0.2, y: jb.fy * viewH + 2 }, 'trot', [{ x: jb.fx * viewW + side * viewH * 0.22, y: jb.fy * viewH + 2 }]);
    p.state = 'gallop';
    p.pace = 'gallop';
    return;
  }
  if (Math.random() < 0.4) {
    // Seisoo, heilauttaa häntää ja syö ruohoa
    p.state = 'idle';
    p.timer = 2 + Math.random() * 3;
    p.graze = Math.random() < 0.6;
    return;
  }
  p.graze = false;
  stabGo(p, '', {
    x: room.x0 + viewH * 0.1 + Math.random() * (room.x1 - room.x0 - viewH * 0.2),
    y: room.floorY + viewH * 0.1 + Math.random() * (room.bottom - room.floorY - viewH * 0.13)
  }, Math.random() < 0.2 ? 'trot' : 'walk');
}

// Ruusukekierros: hoidettu poni laukkaa (esteen yli, jos sellainen on)
function stabStartGallop(p) {
  var room = homeRoom(), h = viewH, jb = homeHasHere('jumpbar'), pts, cx, cy;
  if (jb) {
    var jx = jb.fx * viewW, jy = jb.fy * viewH + 2, up = jy - h * 0.1 > room.floorY + h * 0.1 ? -1 : 1;
    pts = [{ x: jx + h * 0.24, y: jy }, { x: jx + h * 0.26, y: jy + up * h * 0.1 }, { x: jx - h * 0.26, y: jy + up * h * 0.1 }, { x: jx - h * 0.24, y: jy }, { x: jx + h * 0.24, y: jy }];
    stabGo(p, 'award', { x: jx - h * 0.24, y: jy }, 'gallop', pts);
  } else {
    cx = room.x0 + (room.x1 - room.x0) * 0.55;
    cy = room.floorY + (room.bottom - room.floorY) * 0.6;
    var rx = (room.x1 - room.x0) * 0.3, ry = (room.bottom - room.floorY) * 0.25;
    pts = [{ x: cx + rx, y: cy }, { x: cx, y: cy + ry }, { x: cx - rx, y: cy }, { x: cx, y: cy - ry }, { x: cx + rx * 0.6, y: cy - ry * 0.4 }];
    stabGo(p, 'award', { x: cx, y: cy - ry }, 'gallop', pts);
  }
  stabGalloper = p;
  stabNeigh(p, 0);
}

// Ruusuke taululle (kultainen = myös tähti kukkaroon). from: lentävän
// ruusukkeen lähtöponi, jos ruusuke ei ole ponin oma (takajaloille nousu)
function stabAward(p, gold, from) {
  var d = stabDay(), sp = stabSpots(), hp = stabHeadPos(p || from), shop = homeShopBox(), slot;
  if (p) p.r = d;
  if (gold === undefined) gold = Math.random() < STAB_GOLD_CHANCE ? 1 : 0;
  stabTotal++;
  if (stabBoard.length < STAB_BOARD_MAX) {
    stabBoard.push(gold);
    slot = stabBoardSlot(stabBoard.length - 1);
  } else {
    slot = { x: sp.board.x, y: sp.board.y };
  }
  stabFly.push({ x0: hp.x, y0: hp.y - viewH * 0.05, x1: slot.x, y1: slot.y, t: 0, g: gold });
  if (gold) {
    starCoins += 1;
    stabFly.push({ x0: hp.x, y0: hp.y - viewH * 0.05, x1: shop.x + viewH * 0.05, y1: shop.y + shop.head * 0.5, t: -0.3, g: 1, star: 1 });
    spawnSparkles(hp.x, hp.y, 26, '#ffd24f');
    soundStar(3);
  }
  // Fanfaari
  var mel = [523, 659, 784, 1047, 784, 1047];
  for (var i = 0; i < mel.length; i++) playNote(mel[i], 0.1 + i * 0.12 + (i > 3 ? 0.1 : 0), i === mel.length - 1 ? 0.35 : 0.1, 'square', 0.06);
  spawnSparkles(hp.x, hp.y - viewH * 0.04, 16, gold ? '#ffd24f' : '#5fa8ff');
  if (p) { p.tossT = 1; p.shineT = 2; }
  if (from) from.shineT = 2;
  saveProgress();
}
function stabBoardSlot(i) {
  var b = stabSpots().board, col = i % 6, row = Math.floor(i / 6);
  return { x: b.x - b.w * 0.42 + col * b.w * 0.168, y: b.y - b.h * 0.2 + row * b.h * 0.45 };
}

// ---------- Äänet ----------
// Hirnahdus: värisevä laskeva sarja
function stabNeigh(p, delay) {
  var foal = p && p.k === 'foal', base = foal ? 1100 : 760, k;
  delay = delay || 0;
  for (k = 0; k < 8; k++) playNote(base - k * (foal ? 55 : 45) + (k % 2) * (foal ? 90 : 70), delay + k * 0.055, 0.06, 'sawtooth', 0.045);
  playNote(base * 0.5, delay + 0.46, 0.12, 'triangle', 0.08);
}
// Pieni hörähdys
function stabNicker(p, delay) {
  var f = p && p.k === 'foal' ? 520 : 300, k;
  for (k = 0; k < 4; k++) playNote(f + (k % 2) * 40, delay + k * 0.05, 0.05, 'triangle', 0.08);
}
function stabClop(delay, soft) {
  playNote(220 + Math.random() * 40, delay, 0.03, 'square', soft ? 0.025 : 0.045);
  playNote(300 + Math.random() * 40, delay + 0.09, 0.03, 'square', soft ? 0.025 : 0.045);
}

// ---------- Napautukset ja raahaus ----------
function stabTap(px, py) {
  var sp, i, dx, dy, p, best = null, by = -1, s, names = ['hay', 'bucket', 'brush'];
  if (homeRoomIdx !== STABLE_ROOM) return false;
  sp = stabSpots();
  // Työkalut
  s = stabToolSize();
  for (i = 0; i < names.length; i++) {
    var tp = stabToolPos(names[i]);
    if (px > tp.x - s * 0.5 && px < tp.x + s * 0.55 && py > tp.y - s * 0.85 && py < tp.y + s * 0.15) {
      homeDrag = { stab: 'tool', tool: names[i], dx: px - tp.x, dy: py - tp.y, gx: px, gy: py, sx: px, sy: py, moved: false, lx: px, ly: py };
      playNote(660, 0, 0.05, 'sine', 0.18);
      return true;
    }
  }
  // Porkkanalaatikko: porkkana käteen
  dx = px - sp.box.x; dy = py - (sp.box.y - viewH * 0.04);
  if (Math.abs(dx) < viewH * 0.08 && Math.abs(dy) < viewH * 0.06) {
    homeDrag = { stab: 'carrot', gx: px, gy: py, sx: px, sy: py, moved: false };
    playNote(880, 0, 0.05, 'sine', 0.15);
    return true;
  }
  // Ruusuketaulu: ruusuke käteen (napautus soittaa fanfaarin)
  var bo = sp.board;
  if (Math.abs(px - bo.x) < bo.w * 0.55 && Math.abs(py - bo.y) < bo.h * 0.7) {
    if (stabBoard.length) {
      homeDrag = { stab: 'rosette', g: stabBoard.pop(), gx: px, gy: py, sx: px, sy: py, moved: false };
      playNote(880, 0, 0.05, 'sine', 0.18);
    } else {
      stabBoardWig = 0.6;
      playNote(330, 0, 0.08, 'triangle', 0.18);
    }
    return true;
  }
  // Karsina
  var st = sp.stall;
  if (px > st.x0 && px < st.x1 && py > st.top && py < st.y + viewH * 0.04) {
    // Karsinan edessä seisova poni nostetaan mieluummin kuin herätetään varsa
    var ponyThere = false;
    for (i = 0; i < stabPonies.length; i++) if (stabPonyHit(stabPonies[i], px, py)) ponyThere = true;
    if (!ponyThere || stabStall >= 0) { stabStallTap(); return true; }
  }
  // Ponit (etummainen ensin)
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (stabPonyHit(p, px, py) && p.fy > by) { best = p; by = p.fy; }
  }
  if (best) {
    if (stabRide && stabRide.p === best) stabRideEnd();
    if (best === stabGalloper) stabGalloper = null;
    homeDrag = { stab: 'pony', pony: best, gx: px, gy: py, sx: px, sy: py, moved: false, hold: 0, prev: best.state };
    best.state = 'held';
    best.goal = '';
    best.slot = -1;
    best.path = null;
    return true;
  }
  return false;
}
function stabPonyHit(p, px, py) {
  var s = stabPonySize(p), x = p.fx * viewW, y = p.fy * viewH - p.z;
  return Math.abs(px - x - p.dir * s * 0.15) < s * 0.95 && py < y + s * 0.1 && py > y - s * 1.75;
}

function stabStallTap() {
  var d = stabDay(), sp = stabSpots();
  if (stabWakeT > 0) return;
  if (stabStall >= 0 && d > stabStall) {
    // Herätys: varsa venyttelee ja hyppää ylös
    stabWakeT = 1.4;
    playNote(660, 0, 0.1, 'sine', 0.15);
    playNote(880, 0.3, 0.1, 'sine', 0.15);
    playNote(1100, 0.6, 0.12, 'sine', 0.15);
    return;
  }
  stabStallShake = 0.6;
  if (stabStall >= 0) {
    // Ruusuke odottaa yötä: tuutulaulu
    var mel = [784, 659, 784, 659, 523];
    for (var i = 0; i < mel.length; i++) playNote(mel[i], i * 0.2, 0.18, 'sine', 0.15);
    spawnSparkles(sp.stall.x, sp.stall.y - viewH * 0.05, 8, '#c9a0ff');
  } else {
    for (var k = 0; k < 4; k++) playNote(260 + Math.random() * 120, k * 0.05, 0.04, 'triangle', 0.08);
    spawnDust(sp.stall.x, sp.stall.y, 4, 0);
  }
}

function stabFoalOut() {
  var sp = stabSpots(), c = stabStallG ? 0 : randInt(STAB_COATS.length);
  var p = stabNewPony('foal', c, stabFreshMane(c), stabStallG, (sp.stall.x + viewH * 0.12) / viewW, (sp.stall.y + viewH * 0.06) / viewH, stabDay());
  stabGroundClamp(p);
  p.z = viewH * 0.05;
  p.dir = 1;
  p.tossT = 1;
  stabPonies.push(p);
  stabStall = -1;
  stabStallG = 0;
  spawnSparkles(sp.stall.x, sp.stall.y - viewH * 0.05, 26, p.u ? '#ff9ec4' : '#ffe066');
  stabNeigh(p, 0.1);
  playNote(784, 0.6, 0.12, 'sine', 0.28);
  playNote(1047, 0.72, 0.12, 'sine', 0.28);
  playNote(1568, 0.84, 0.3, 'sine', 0.28);
  saveProgress();
}

// Talli täynnä: vanhin tavallinen poni muuttaa kylään (yksisarviset ja varsat jäävät)
function stabSendAway() {
  var i, p;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.k === 'pony' && !p.u && !stabBusy(p)) break;
  }
  if (i >= stabPonies.length) return false;
  stabPonies.splice(i, 1);
  p.state = 'leave';
  p.z = 0;
  p.timer = 1.4;
  p.fade = 1;
  p.tossT = 1.4;
  stabLeavers.push(p);
  stabHearts.push({ x: p.fx * viewW, y: p.fy * viewH - stabPonySize(p) * 1.9, age: 0 });
  stabNeigh(p, 0.3);
  return true;
}
function stabCanSendAway() {
  for (var i = 0; i < stabPonies.length; i++) if (stabPonies[i].k === 'pony' && !stabPonies[i].u && !stabBusy(stabPonies[i])) return true;
  return false;
}
function stabUpdateLeaver(p, dt) {
  var room = homeRoom(), s = stabPonySize(p), tx = room.x1 + s, ty = room.floorY + viewH * 0.1, dx, dy, dist, spd;
  p.ph += dt;
  if (p.tossT > 0) p.tossT -= dt;
  p.timer -= dt;
  if (p.timer > 0) {
    p.dir = Math.sin(p.ph * 3) > 0 ? 1 : -1;
    return;
  }
  dx = tx - p.fx * viewW; dy = ty - p.fy * viewH;
  dist = Math.sqrt(dx * dx + dy * dy);
  spd = viewH * 0.2 * dt;
  p.dir = dx > 0 ? 1 : -1;
  p.speed = spd / dt;
  p.wph += dt * 9;
  if (dist > spd) { p.fx += dx / dist * spd / viewW; p.fy += dy / dist * spd / viewH; }
  if (Math.random() < dt * 3) stabClop(0, true);
  if (dist < viewH * 0.2) p.fade = Math.max(0, p.fade - dt * 2);
}
function stabFullNote() {
  stabFullT = 2.5;
  for (var i = 0; i < stabPonies.length; i++) stabPonies[i].tossT = 0.6 + Math.random() * 0.4;
  stabNicker(stabPonies[0], 0);
}

// Raahaus (homeMove kutsuu)
function stabDragMove(px, py) {
  var d = homeDrag, i, p, bp, mv, dd;
  d.gx = px;
  d.gy = py;
  if (d.stab === 'tool') {
    var t = stabTool[d.tool];
    t.fx = Math.min(Math.max(px - d.dx, viewH * 0.05), viewW - viewH * 0.05) / viewW;
    t.fy = Math.min(Math.max(py - d.dy, viewH * 0.12), viewH) / viewH;
    mv = Math.sqrt((px - d.lx) * (px - d.lx) + (py - d.ly) * (py - d.ly));
    d.lx = px; d.ly = py;
    if (d.tool === 'brush') stabBrushRub(mv);
  } else if (d.stab === 'pony') {
    if (!d.moved) return;
    p = d.pony;
    p.fx = px / viewW;
    p.fy = (py + stabPonySize(p) * 0.9) / viewH;
    p.z = 0;
  }
}

// Harja ponin päällä: liike hankaa mutaa pois
function stabBrushRub(mv) {
  var tp = stabToolPos('brush'), s = stabToolSize(), hx = tp.x, hy = tp.y - s * 0.15, i, p, bp, d = stabDay(), best = null, bd = 1e9, dx, dy, q;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.state === 'held' || p.state === 'gallop') continue;
    bp = stabBodyPos(p);
    dx = (hx - bp.x) / bp.rx; dy = (hy - bp.y) / bp.ry;
    q = dx * dx + dy * dy;
    if (q < 1.3 && q < bd) { bd = q; best = p; }
  }
  stabTool.brush.on = best;
  if (!best || mv <= 0) return;
  p = best;
  // Poni pysähtyy nauttimaan
  if (p.state === 'walk' && !p.goal) { p.state = 'idle'; p.path = null; }
  if (p.state === 'idle') p.timer = Math.max(p.timer, 1.5);
  p.rub += mv;
  if (Math.random() < 0.3) stabBits.push({ x: hx + (Math.random() - 0.5) * s * 0.4, y: hy, vx: (Math.random() - 0.5) * viewH * 0.15, vy: -viewH * 0.1, age: 0, floorY: p.fy * viewH, kind: p.mud > 0 ? 'mud' : 'shine' });
  if (p.rub < viewH * 0.18) return;
  p.rub = 0;
  if (p.mud > 0) {
    p.mud--;
    spawnDust(hx, hy, 4, 0);
    playNote(1800 + Math.random() * 600, 0, 0.05, 'sine', 0.06);
    playNote(1500 + Math.random() * 400, 0.05, 0.05, 'sine', 0.05);
    p.swishT = 0.8;
    if (p.mud === 0) {
      p.bd = d;
      p.shineT = 2.5;
      spawnSparkles(stabBodyPos(p).x, stabBodyPos(p).y, 22, '#ffffff');
      stabNeigh(p, 0.1);
      playNote(1047, 0.2, 0.1, 'sine', 0.22);
      playNote(1319, 0.3, 0.1, 'sine', 0.22);
      playNote(1568, 0.4, 0.25, 'sine', 0.22);
    }
    saveProgress();
  } else {
    // Puhdas poni: kiiltoa ja tyytyväinen hörähdys
    spawnSparkles(hx, hy, 5, '#ffffff');
    p.swishT = 0.8;
    if (Math.random() < 0.4) stabNicker(p, 0);
    if (Math.random() < 0.5) stabHearts.push({ x: hx, y: hy - viewH * 0.05, age: 0 });
  }
}

// Pudotus (homeUp kutsuu)
function stabDrop() {
  var d = homeDrag, sp = stabSpots(), i, p, dx, dy, best = null, bd = 1e9, hp;
  homeDrag = null;
  if (d.stab === 'tool') {
    stabTool.brush.on = null;
    if (!d.moved) {
      stabTool[d.tool].shake = 0.6;
      if (d.tool === 'hay') { for (i = 0; i < 4; i++) playNote(280 + Math.random() * 160, i * 0.05, 0.04, 'triangle', 0.06); }
      else if (d.tool === 'bucket') { for (i = 0; i < 3; i++) playNote(1300 + i * 200, i * 0.06, 0.06, 'sine', 0.12); }
      else { for (i = 0; i < 3; i++) playNote(2000 + i * 300, i * 0.05, 0.04, 'sine', 0.06); }
    }
    stabTool[d.tool].pour = 0;
    return;
  }
  if (d.stab === 'carrot') {
    if (!d.moved) {
      stabBoxShake = 0.5;
      for (i = 0; i < 3; i++) playNote(500 + i * 90, i * 0.06, 0.05, 'triangle', 0.1);
      return;
    }
    for (i = 0; i < stabPonies.length; i++) {
      p = stabPonies[i];
      if (p.state === 'held' || p.state === 'gallop') continue;
      hp = stabHeadPos(p);
      dx = d.gx - hp.x; dy = d.gy - hp.y;
      if (dx * dx + dy * dy < viewH * viewH * 0.012 && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p; }
    }
    if (best) {
      if (stabRide && stabRide.p === best) stabRideEnd();
      best.state = 'munch';
      best.goal = '';
      best.path = null;
      best.timer = 2.4;
      best.tossT = 0.5;
      for (i = 0; i < 6; i++) playNote(700 + Math.random() * 500, 0.1 + i * 0.22, 0.03, 'square', 0.04);
      stabNicker(best, 1.5);
      for (i = 0; i < 3; i++) stabHearts.push({ x: best.fx * viewW + (i - 1) * viewH * 0.03, y: stabHeadPos(best).y - viewH * 0.05, age: -i * 0.3 });
      return;
    }
    // Porkkana palaa laatikkoon
    stabFly.push({ x0: d.gx, y0: d.gy, x1: sp.box.x, y1: sp.box.y - viewH * 0.04, t: 0.3, carrot: 1 });
    playNote(330, 0, 0.1, 'triangle', 0.2);
    return;
  }
  if (d.stab === 'rosette') {
    var st = sp.stall, onStall = d.gx > st.x0 && d.gx < st.x1 && d.gy > st.top && d.gy < st.y + viewH * 0.05;
    if (!d.moved) {
      // Napautus tauluun: fanfaari ja ruusukkeet heiluvat
      stabBoard.push(d.g);
      stabBoardWig = 1.2;
      var mel = [523, 659, 784, 1047];
      for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.1, 0.12, 'square', 0.05);
      spawnSparkles(sp.board.x, sp.board.y, 10, '#5fa8ff');
      return;
    }
    if (onStall && stabStall < 0 && (stabCount() < STAB_MAX || stabSendAway())) {
      stabStall = stabDay();
      stabStallG = d.g;
      spawnSparkles(st.x, st.y - viewH * 0.04, 18, d.g ? '#ffd24f' : '#c9a0ff');
      playNote(523, 0, 0.12, 'sine', 0.25);
      playNote(659, 0.12, 0.12, 'sine', 0.25);
      playNote(784, 0.24, 0.3, 'sine', 0.25);
      saveProgress();
      return;
    }
    if (onStall) {
      stabStallShake = 0.6;
      if (stabStall < 0) stabFullNote();
    }
    stabBoard.push(d.g);
    var bs = stabBoardSlot(stabBoard.length - 1);
    stabFly.push({ x0: d.gx, y0: d.gy, x1: bs.x, y1: bs.y, t: 0.3, g: d.g, back: 1 });
    playNote(330, 0, 0.1, 'triangle', 0.2);
    return;
  }
  // Poni
  p = d.pony;
  if (!d.moved) {
    p.state = 'idle';
    p.timer = 1;
    stabPonyTap(p);
    return;
  }
  stabPonyDrop(p, d.gx, d.gy);
}

function stabPonyTap(p) {
  var hp = stabHeadPos(p), room = homeRoom(), x = p.fx * viewW;
  p.tossT = 0.9;
  if (p.k === 'foal') {
    stabNeigh(p, 0);
    p.z = Math.max(p.z, viewH * 0.03);
    spawnSparkles(hp.x, hp.y, 6, p.u ? '#ff9ec4' : '#ffe066');
    return;
  }
  if (stabTaps.p === p && globalT - stabTaps.t < 2.5) stabTaps.n++;
  else { stabTaps.p = p; stabTaps.n = 1; }
  stabTaps.t = globalT;
  if (stabTaps.n >= 5) { stabTaps.n = 0; stabRear(p); return; }
  stabNeigh(p, 0);
  spawnSparkles(hp.x, hp.y - viewH * 0.02, 6, '#ffffff');
  // Ravaa pari askelta sivuun
  if (Math.random() < 0.5) {
    var nx = Math.min(Math.max(x + (Math.random() < 0.5 ? -1 : 1) * viewH * (0.12 + Math.random() * 0.08), room.x0 + viewH * 0.1), room.x1 - viewH * 0.1);
    stabGo(p, '', { x: nx, y: p.fy * viewH + (Math.random() - 0.5) * viewH * 0.06 }, 'trot');
  }
}

// Ponin salaisuus: nousu takajaloille, fanfaari ja kerran päivässä kultaruusuke taululle
function stabRear(p) {
  var mel = [392, 523, 659, 784, 659, 784, 1047], i;
  p.state = 'rear';
  p.rearT = 1.8;
  p.goal = '';
  p.path = null;
  for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.14, 0.18, 'square', 0.05);
  stabNeigh(p, mel.length * 0.14);
  homeSpawnNotes(p.fx * viewW, p.fy * viewH - stabPonySize(p) * 1.9, 8);
  if (stabTrick !== stabDay()) {
    stabTrick = stabDay();
    stabAward(null, 1, p);
  }
}

// Poni lasketaan: pupun viereen (ratsastus) tai maahan
function stabPonyDrop(p, px, py) {
  var s = stabPonySize(p), room = homeRoom(), i, bun, dx, dy;
  var footY = py + s * 0.9;
  p.goal = '';
  p.slot = -1;
  if (p.k === 'pony') {
    for (i = 0; i < homeBunnies.length; i++) {
      bun = homeBunnies[i];
      dx = px - bun.fx * viewW; dy = footY - bun.fy * viewH;
      if (Math.abs(dx) < s * 0.9 && Math.abs(dy) < viewH * 0.1) {
        p.fx = bun.fx;
        p.fy = bun.fy;
        stabGroundClamp(p);
        p.z = 0;
        stabRideStart(p, i);
        return;
      }
    }
  }
  var groundY = Math.min(Math.max(footY, room.floorY + viewH * 0.09), room.bottom - viewH * 0.02);
  p.fx = Math.min(Math.max(px, room.x0 + s * 0.8), room.x1 - s * 0.8) / viewW;
  p.z = Math.max(0, groundY - footY);
  p.fy = groundY / viewH;
  p.state = 'idle';
  p.timer = 1 + Math.random();
  stabNicker(p, 0);
}

// Ratsastus: pupu hyppää ponin selkään ja poni kävelee kierroksen
function stabRideStart(p, bi) {
  var room = homeRoom(), pts = [], k, bun = homeBunnies[bi];
  if (stabRide) stabRideEnd();
  stabRide = { b: bi, p: p };
  for (k = 0; k < 3; k++) pts.push({ x: room.x0 + viewH * 0.15 + Math.random() * (room.x1 - room.x0 - viewH * 0.3), y: room.floorY + viewH * 0.12 + Math.random() * (room.bottom - room.floorY - viewH * 0.16) });
  var first = pts.shift();
  stabGo(p, 'ride', first, 'walk', pts);
  bun.hop = 1;
  for (k = 0; k < 4; k++) stabHearts.push({ x: p.fx * viewW + (k - 1.5) * viewH * 0.025, y: p.fy * viewH - stabPonySize(p) * 1.8, age: -k * 0.15 });
  playNote(784, 0, 0.1, 'sine', 0.22);
  playNote(1047, 0.1, 0.1, 'sine', 0.22);
  playNote(1319, 0.2, 0.2, 'sine', 0.22);
  stabNicker(p, 0.3);
}
function stabRideEnd() {
  if (!stabRide) return;
  var b = homeBunnies[stabRide.b], p = stabRide.p;
  stabRide = null;
  if (!b) return;
  b.oy = 0;
  b.fx = p.fx + p.dir * 0.04;
  b.fy = Math.min(p.fy + 0.02, homeRoom().bottom / viewH - 0.02);
  b.tx = b.fx; b.ty = b.fy;
  b.hop = 1;
  b.timer = 1.5;
  playNote(1175, 0, 0.08, 'sine', 0.2);
  playNote(1568, 0.08, 0.15, 'sine', 0.2);
}

// Kaupan rusetti ponin harjaan: true = poni otti rusetin
function stabBowTo(bowIdx, px, py) {
  var i, p, hp, dx, dy, best = null, bd = viewH * viewH * 0.016;
  if (homeRoomIdx !== STABLE_ROOM) return false;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    hp = stabHeadPos(p);
    dx = px - (hp.x - p.dir * stabPonySize(p) * 0.25); dy = py - hp.y;
    if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = p; }
  }
  if (!best) return false;
  best.bow = bowIdx;
  best.tossT = 0.8;
  saveProgress();
  hp = stabHeadPos(best);
  spawnSparkles(hp.x, hp.y - viewH * 0.03, 14, HOME_BOWS[bowIdx]);
  playNote(1200, 0, 0.08, 'sine', 0.25);
  playNote(1500, 0.07, 0.12, 'sine', 0.25);
  stabNicker(best, 0.2);
  return true;
}

// ---------- Kauppa ----------
function stabShopPick(def, px, py) {
  if (!stabIsPony(def.id)) return false;
  if (homeRoomIdx !== STABLE_ROOM || stabShopOwned(def.id) || starCoins < def.price) {
    homeShake.id = def.id;
    homeShake.t = 0.5;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    return true;
  }
  homeDrag = { item: { id: def.id, fx: px / viewW, fy: py / viewH, on: true, phase: 0, room: STABLE_ROOM }, ghost: true, def: def, dx: 0, dy: 0, sx: px, sy: py, moved: false };
  playNote(660, 0, 0.06, 'sine', 0.2);
  return true;
}
function stabShopOwned(id) {
  return stabIsPony(id) && stabCount() >= STAB_MAX;
}
function stabBuy(def, it) {
  var p, c;
  if (!stabIsPony(def.id)) return false;
  starCoins -= def.price;
  c = stabFreshCoat();
  p = stabNewPony(def.id, c, stabFreshMane(c), 0, it.fx, it.fy, def.id === 'foal' ? stabDay() : undefined);
  stabGroundClamp(p);
  p.md = stabDay();
  p.mud = 0;
  p.bd = stabDay();
  p.tossT = 1;
  stabPonies.push(p);
  saveProgress();
  spawnSparkles(p.fx * viewW, p.fy * viewH - viewH * 0.08, 18, '#ffe27a');
  playNote(784, 0, 0.12, 'sine', 0.35);
  playNote(1047, 0.1, 0.15, 'sine', 0.35);
  playNote(1319, 0.2, 0.3, 'sine', 0.35);
  stabNeigh(p, 0.4);
  return true;
}

function stabOnEnter() {
  var i, d = stabDay(), p;
  for (i = 0; i < HOME_ITEMS.length; i++) if (HOME_ITEMS[i].id === 'pony') break;
  homeShopPage = Math.floor(i / HOME_SHOP_PAGE);
  stabLeavers = [];
  stabRide = null;
  stabGalloper = null;
  if (!stabInit) {
    // Aloitusponi: valkoinen, vaaleanpunainen harja
    stabInit = true;
    p = stabNewPony('pony', 0, 2, 0, 0.42, 0.85);
    stabPonies.push(p);
  }
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    // Varsat kasvavat
    if (p.k === 'foal' && stabAge(p) >= 1) {
      p.k = 'pony';
      p.grewT = 2.5;
      delete p.born;
    }
    // Aamulla laitumelta mutaisena
    if (p.md !== d) {
      p.md = d;
      p.mud = p.k === 'pony' ? STAB_MUD : 2;
    }
    stabGroundClamp(p);
    p.z = 0;
    p.state = 'idle';
    p.goal = '';
    p.slot = -1;
    p.path = null;
    p.timer = 0.3 + Math.random() * 1.5;
  }
  stabHay = stabFed === d ? Math.max(stabHay, 0.6) : 0;
  stabWater = stabWat === d ? Math.max(stabWater, 0.6) : 0;
  stabAwardT = 2;
  stabTool.hay.fx = stabTool.bucket.fx = stabTool.brush.fx = -1;
  for (i = 0; i < homeBunnies.length; i++) homeBunnies[i].oy = 0;
  saveProgress();
}

// ---------- Päivitys ----------
function updateStabItem(it, dt) {
  if (it.ringT > 0) it.ringT -= dt;
  if (it.shineT > 0) it.shineT -= dt;
  if (it.catT > 0) it.catT -= dt;
  if (it.clackT > 0) it.clackT -= dt;
}

function updateStable(dt) {
  var i, p, d, sp, t, name, s;
  for (i = stabHearts.length - 1; i >= 0; i--) {
    stabHearts[i].age += dt;
    if (stabHearts[i].age > 1.4) stabHearts.splice(i, 1);
  }
  for (i = stabFly.length - 1; i >= 0; i--) {
    stabFly[i].t += dt / 0.8;
    if (stabFly[i].t >= 1) {
      if (!stabFly[i].star && !stabFly[i].carrot) stabBoardWig = Math.max(stabBoardWig, 0.4);
      stabFly.splice(i, 1);
    }
  }
  if (homeRoomIdx !== STABLE_ROOM) return;
  d = stabDay();
  sp = stabSpots();
  if (stabStallShake > 0) stabStallShake -= dt;
  if (stabBoardWig > 0) stabBoardWig -= dt;
  if (stabBoxShake > 0) stabBoxShake -= dt;
  if (stabFullT > 0) stabFullT -= dt;
  stabBubbleT += dt;
  if (stabWakeT > 0) {
    stabWakeT -= dt;
    if (stabWakeT <= 0) stabFoalOut();
  }
  // Työkalut: kallistus ja kaato kohteen yllä; irti päästetty palaa paikalleen
  for (name in stabTool) {
    t = stabTool[name];
    if (t.shake > 0) t.shake -= dt;
    var held = !!(homeDrag && homeDrag.stab === 'tool' && homeDrag.tool === name);
    var tg = held && name !== 'brush' ? stabPourTarget(name) : null;
    t.tilt = Math.max(0, Math.min(1, t.tilt + (tg ? dt * 4 : -dt * 4)));
    if (!held) {
      var hm = stabToolHome(name), pp = stabToolPos(name), k = Math.min(1, dt * 8);
      t.fx = (pp.x + (hm.x - pp.x) * k) / viewW;
      t.fy = (pp.y + (hm.y - pp.y) * k) / viewH;
      t.pour = 0;
    } else if (tg && t.tilt > 0.6) {
      var tp = stabToolPos(name);
      s = stabToolSize();
      if (Math.random() < dt * 30) {
        stabBits.push({ x: tp.x + s * 0.5, y: tp.y - s * 0.45, vx: viewH * (0.02 + Math.random() * 0.06), vy: viewH * 0.05, age: 0, floorY: tg.y + viewH * 0.03, kind: name, rot: Math.random() * 3 });
      }
      if (Math.random() < dt * 8) {
        if (name === 'hay') playNote(250 + Math.random() * 200, 0, 0.03, 'triangle', 0.05);
        else playNote(1500 + Math.random() * 700, 0, 0.04, 'sine', 0.06);
      }
      t.pour += dt;
      if (t.pour >= STAB_POUR) { t.pour = -9; stabFill(name); }
    }
  }
  for (i = stabBits.length - 1; i >= 0; i--) {
    t = stabBits[i];
    t.age += dt;
    t.vy += viewH * 1.6 * dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    if ((t.vy > 0 && t.y > t.floorY) || t.age > 2) stabBits.splice(i, 1);
  }
  for (i = stabLeavers.length - 1; i >= 0; i--) {
    stabUpdateLeaver(stabLeavers[i], dt);
    if (stabLeavers[i].fade <= 0) stabLeavers.splice(i, 1);
  }
  // Ruusukekierros: yksi hoidettu poni kerrallaan
  if (stabGalloper && stabPonies.indexOf(stabGalloper) < 0) stabGalloper = null;
  if (stabGalloper && stabGalloper.goal !== 'award') stabGalloper = null;
  if (!stabGalloper && stabFed === d && stabWat === d) {
    stabAwardT -= dt;
    if (stabAwardT <= 0) {
      stabAwardT = 1.5;
      for (i = 0; i < stabPonies.length; i++) {
        p = stabPonies[i];
        if (p.k !== 'pony' || p.bd !== d || p.r === d || stabBusy(p) || p.state === 'eat' && p.timer > 2) continue;
        stabStartGallop(p);
        break;
      }
    }
  }
  // Ratsastava pupu ponin selässä
  if (stabRide) {
    var rb = homeBunnies[stabRide.b], rp = stabRide.p;
    if (!rb || stabPonies.indexOf(rp) < 0 || rp.state === 'held') stabRideEnd();
    else {
      var rs = stabPonySize(rp);
      rb.fx = rp.fx - rp.dir * rs * 0.08 / viewW;
      rb.fy = rp.fy + 0.002;
      rb.tx = rb.fx; rb.ty = rb.fy;
      rb.oy = -rs * 1.05 - rp.z + Math.abs(Math.sin(rp.wph)) * rs * 0.04;
      rb.hop = 0;
      if (Math.random() < dt * 1.5) stabHearts.push({ x: rb.fx * viewW, y: rb.fy * viewH + rb.oy - viewH * 0.08, age: 0 });
    }
  }
  for (i = 0; i < stabPonies.length; i++) stabUpdatePony(stabPonies[i], dt, d);
}

function stabUpdatePony(p, dt, d) {
  var s = stabPonySize(p), dx, dy, dist, spd, held = !!(homeDrag && homeDrag.stab === 'pony' && homeDrag.pony === p), headT = 0;
  p.ph += dt;
  if (p.tossT > 0) p.tossT -= dt;
  if (p.shineT > 0) p.shineT -= dt;
  if (p.swishT > 0) p.swishT -= dt;
  if (p.grewT > 0) {
    p.grewT -= dt;
    if (Math.random() < dt * 8) spawnSparkles(p.fx * viewW, p.fy * viewH - s, 2, '#ffe27a');
  }
  p.speed = 0;
  if (p.state === 'held') {
    if (!held) { p.state = 'idle'; p.timer = 0.5; return; }
    homeDrag.hold += dt;
    if (homeDrag.hold > 0.7) {
      homeDrag.hold = 0;
      stabHearts.push({ x: p.fx * viewW + (Math.random() - 0.5) * s, y: p.fy * viewH - s * 1.9, age: 0 });
      stabNicker(p, 0);
    }
    p.head += (0 - p.head) * Math.min(1, dt * 6);
    return;
  }
  // Pudotus maahan ja hypyt
  if (p.jumpT > 0) {
    p.jumpT -= dt;
    p.z = Math.max(0, Math.sin(Math.PI * (1 - Math.max(0, p.jumpT) / 0.55)) * viewH * 0.08);
    if (p.jumpT <= 0) { p.z = 0; stabClop(0); }
  } else if (p.z > 0) {
    p.z = Math.max(0, p.z - viewH * 0.6 * dt);
    if (p.z === 0) stabClop(0, true);
  }
  p.timer -= dt;
  if (p.state === 'walk' || p.state === 'gallop') {
    dx = (p.tx - p.fx) * viewW; dy = (p.ty - p.fy) * viewH;
    dist = Math.sqrt(dx * dx + dy * dy);
    var v = p.state === 'gallop' || p.pace === 'gallop' ? 0.42 : (p.pace === 'trot' ? 0.26 : 0.11);
    if (p.k === 'foal') v *= 1.1;
    spd = viewH * v * dt;
    p.speed = v;
    p.wph += dt * (v > 0.3 ? 13 : (v > 0.2 ? 10 : 6));
    if (dist <= Math.max(spd, 2)) {
      p.fx = p.tx; p.fy = p.ty;
      stabArrive(p);
    } else {
      p.fx += dx / dist * spd / viewW;
      p.fy += dy / dist * spd / viewH;
      if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1;
    }
    // Esteen yli hypätään laukassa
    var jb = homeHasHere('jumpbar');
    if (jb && v > 0.3 && p.jumpT <= 0 && Math.abs(p.fx * viewW - jb.fx * viewW) < viewH * 0.06 && Math.abs(p.fy * viewH - jb.fy * viewH) < viewH * 0.05) {
      p.jumpT = 0.55;
      playNote(523, 0, 0.08, 'sine', 0.15);
      playNote(784, 0.15, 0.12, 'sine', 0.15);
    }
    if (v > 0.2 && Math.random() < dt * (v > 0.3 ? 5 : 3)) stabClop(0, v < 0.3);
    if (v > 0.3 && Math.random() < dt * 6) spawnDust(p.fx * viewW - p.dir * s * 0.4, p.fy * viewH, 1, -p.dir);
    p.head += (-0.1 - p.head) * Math.min(1, dt * 6);
    return;
  }
  if (p.state === 'eat') {
    headT = 0.35 + Math.max(0, Math.sin(p.ph * 4)) * 0.12;
    stabHay = Math.max(0.3, stabHay - dt * 0.004);
    if (Math.random() < dt * 2) playNote(600 + Math.random() * 300, 0, 0.02, 'triangle', 0.04);
    if (p.timer <= 0) { p.state = 'idle'; p.goal = ''; p.slot = -1; p.timer = 0.5 + Math.random(); }
  } else if (p.state === 'drink') {
    headT = 1;
    stabWater = Math.max(0.3, stabWater - dt * 0.004);
    if (Math.random() < dt * 1.5) playNote(900 + Math.random() * 300, 0, 0.04, 'sine', 0.05);
    if (p.timer <= 0) { p.state = 'idle'; p.goal = ''; p.slot = -1; p.timer = 0.5 + Math.random(); }
  } else if (p.state === 'munch') {
    headT = 0.1 + Math.max(0, Math.sin(p.ph * 10)) * 0.08;
    if (p.timer <= 0) { p.state = 'idle'; p.timer = 1 + Math.random(); }
  } else if (p.state === 'rear') {
    p.rearT -= dt;
    if (p.rearT <= 0) { p.state = 'idle'; p.timer = 1; stabClop(0); }
  } else if (p.state === 'idle') {
    headT = p.graze ? 0.95 - Math.max(0, Math.sin(p.ph * 2)) * 0.15 : 0;
    if (p.timer <= 0 && p.z === 0) stabThink(p);
  }
  p.head += (headT - p.head) * Math.min(1, dt * 4);
}

// ---------- Piirto ----------
// Poni: (x, y) kavioiden keskikohta, s koko (korkeus ~1,8 s). dir 1 = katsoo oikealle.
// o: { wph, speed, head (0 = pystyssä .. 1 = maassa), toss, rear (0..1), sleep, mud, shine, bow, blink, swish, foal }
function drawStabPonyShape(c, p, x, y, s, dir, o) {
  var C = STAB_COATS[p.c] || STAB_COATS[0], manes = stabManeOf(p), i, foal = p.k === 'foal';
  var body = C.body, line = C.line, opt = { lineColor: line, shadeTo: C.shade, hi: 0.35 };
  var sp = o.speed || 0, ph = o.wph || 0;
  // Pullea poni: lyhyet paksut jalat, iso pää. Varsalla pidemmät jalat.
  var legTop = foal ? -s * 0.72 : -s * 0.6, bodyY = foal ? -s * 0.9 : -s * 0.8;
  var bodyRx = foal ? s * 0.5 : s * 0.6, bodyRy = foal ? s * 0.27 : s * 0.34, legW = foal ? s * 0.12 : s * 0.17;
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  if (o.rear) { c.translate(-s * 0.38, 0); c.rotate(-0.55 * o.rear); c.translate(s * 0.38, 0); }
  if (o.sleep) c.translate(0, -legTop - s * 0.1);
  var bob = sp > 0.3 ? Math.abs(Math.sin(ph)) * s * 0.08 : (sp > 0 ? Math.abs(Math.sin(ph)) * s * 0.03 : Math.sin(globalT * 2 + (p.ph || 0)) * s * 0.01);
  c.translate(0, -bob);
  // Jalat (takimmaiset tummempina) ja kaviot
  var legXs = [-0.4, -0.25, 0.25, 0.4];
  if (!o.sleep) {
    for (i = 0; i < 4; i++) {
      var back = i === 0 || i === 2, amp = sp > 0.3 ? 0.28 : (sp > 0 ? 0.14 : 0);
      var sw = Math.sin(ph + i * Math.PI * (sp > 0.3 ? 0.5 : 0.9)) * s * amp, lift = 0;
      if (sp > 0) lift = Math.max(0, Math.sin(ph + i * Math.PI * 0.9)) * s * 0.07;
      if (o.rear && i >= 2) { sw = s * (0.22 + Math.sin(globalT * 12 + i) * 0.08); lift = s * 0.25; }
      var lx = legXs[i] * s * (bodyRx / (s * 0.6));
      artLimb(c, lx, legTop, lx + sw, -s * 0.05 - lift, legW, back ? C.shade : body, line);
      artRoundRect(c, lx + sw - legW * 0.6, -s * 0.07 - lift, legW * 1.2, s * 0.08, s * 0.03, '#6a5450', { lineColor: '#2a2020', line: 1 });
    }
  } else {
    artBlob(c, s * 0.3, bodyY + bodyRy * 0.8, s * 0.26, s * 0.08, C.shade, { lineColor: line });
    artBlob(c, -s * 0.3, bodyY + bodyRy * 0.8, s * 0.26, s * 0.08, C.shade, { lineColor: line });
  }
  // Häntä (heilahtaa)
  var tw = o.swish ? Math.sin(globalT * 16) * 0.5 : Math.sin(globalT * 1.7 + (p.ph || 0)) * 0.15 + (sp > 0.3 ? -0.6 : 0);
  c.save();
  c.translate(-bodyRx * 0.9, bodyY - bodyRy * 0.35);
  c.rotate(tw);
  c.lineCap = 'round';
  for (i = 0; i < Math.max(3, manes.length); i++) {
    var mc = manes[i % manes.length];
    c.strokeStyle = manes.length > 1 ? mc : (i === 1 ? artShade(mc, -0.15) : mc);
    c.lineWidth = s * (manes.length > 1 ? 0.07 : 0.12);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-s * (0.3 + i * 0.03), s * 0.02, -s * (0.22 + i * 0.05), s * (0.5 - i * 0.03));
    c.stroke();
  }
  if (o.bow >= 0) drawBow(c, -s * 0.03, s * 0.03, s * 0.09, HOME_BOWS[o.bow]);
  c.restore();
  // Kaula (vartalon takana) ja vartalo
  var hd = o.head || 0, toss = o.toss > 0 ? Math.sin(o.toss * 9) * 0.25 : 0;
  var ax = bodyRx * 0.62, ay = bodyY - bodyRy * 0.25, rot = hd * 1.1 - toss;
  c.save();
  c.translate(ax, ay);
  c.rotate(rot);
  c.beginPath();
  c.moveTo(-s * 0.24, s * 0.02);
  c.quadraticCurveTo(-s * 0.2, -s * 0.3, -s * 0.02, -s * 0.46);
  c.lineTo(s * 0.24, -s * 0.38);
  c.quadraticCurveTo(s * 0.16, -s * 0.12, s * 0.2, s * 0.14);
  c.closePath();
  artFillPath(c, body, -s * 0.46, s * 0.14, s * 0.3, { lineColor: line, shadeTo: C.shade });
  c.restore();
  artBlob(c, 0, bodyY, bodyRx, bodyRy, body, opt);
  if (C.dots) {
    c.fillStyle = C.dots;
    var dd = [[-0.42, -0.9], [-0.28, -0.72], [-0.5, -0.7], [-0.14, -0.94], [-0.34, -1.0], [0.02, -0.72]];
    for (i = 0; i < dd.length; i++) { c.beginPath(); c.arc(dd[i][0] * s * (bodyRx / (s * 0.6)), bodyY + (dd[i][1] + 0.8) * s * (bodyRy / (s * 0.34)), s * 0.04, 0, Math.PI * 2); c.fill(); }
  }
  // Satula (satulapukin väri, kun pupu ratsastaa)
  if (o.saddle) {
    c.beginPath();
    c.moveTo(-s * 0.3, bodyY - bodyRy * 0.8); c.quadraticCurveTo(-s * 0.05, bodyY - bodyRy * 1.25, s * 0.22, bodyY - bodyRy * 0.85);
    c.lineTo(s * 0.18, bodyY - bodyRy * 0.2); c.lineTo(-s * 0.26, bodyY - bodyRy * 0.2); c.closePath();
    artFillPath(c, o.saddle, bodyY - bodyRy * 1.2, bodyY, s * 0.2, { lineColor: artShade(o.saddle, -0.4) });
  }
  // Muta
  var mudPts = [[-0.32, -0.08], [0.1, -0.18], [0.3, 0.06], [-0.06, 0.12], [-0.46, 0.08]];
  for (i = 0; i < (o.mud || 0) && i < mudPts.length; i++) {
    var mx0 = mudPts[i][0] * s * (bodyRx / (s * 0.6)), my0 = bodyY + mudPts[i][1] * s;
    artBlob(c, mx0, my0, s * 0.1, s * 0.065, '#8a6038', { rot: i * 0.7, lineColor: '#5a3a20', line: 1 });
    c.fillStyle = '#a87a4a';
    c.beginPath(); c.arc(mx0 - s * 0.03, my0 - s * 0.02, s * 0.025, 0, Math.PI * 2); c.fill();
  }
  // Harja ja pää (kääntyvät alas syödessä)
  c.save();
  c.translate(ax, ay);
  c.rotate(rot);
  var mx = [[-0.2, -0.04], [-0.17, -0.18], [-0.12, -0.31], [-0.04, -0.42]];
  for (i = 0; i < mx.length; i++) {
    var mc2 = manes[(i + 1) % manes.length];
    artBlob(c, mx[i][0] * s, mx[i][1] * s, s * 0.1, s * 0.12, mc2, { rot: -0.4, lineColor: artShade(mc2, -0.35), line: 1 });
  }
  var hx = s * 0.2, hy = -s * 0.5, hs = foal ? 0.92 : 1;
  // Korvat
  c.beginPath(); c.moveTo(hx - s * 0.16, hy - s * 0.1); c.lineTo(hx - s * 0.15, hy - s * 0.34 * hs); c.lineTo(hx - s * 0.03, hy - s * 0.15); c.closePath();
  artFillPath(c, body, hy - s * 0.34, hy - s * 0.1, s * 0.1, { lineColor: line });
  c.fillStyle = C.nose;
  c.beginPath(); c.moveTo(hx - s * 0.14, hy - s * 0.13); c.lineTo(hx - s * 0.14, hy - s * 0.27 * hs); c.lineTo(hx - s * 0.07, hy - s * 0.15); c.closePath(); c.fill();
  // Pää ja turpa
  artBlob(c, hx, hy, s * 0.3 * hs, s * 0.21 * hs, body, { rot: 0.5, lineColor: line, shadeTo: C.shade, hi: 0.3 });
  artBlob(c, hx + s * 0.19 * hs, hy + s * 0.13 * hs, s * 0.15 * hs, s * 0.12 * hs, C.nose, { rot: 0.5, lineColor: line });
  c.fillStyle = artShade(C.nose, -0.35);
  c.beginPath(); c.arc(hx + s * 0.25 * hs, hy + s * 0.1 * hs, s * 0.022, 0, Math.PI * 2); c.fill();
  c.strokeStyle = artShade(C.nose, -0.4);
  c.lineWidth = Math.max(1, s * 0.018);
  c.beginPath(); c.arc(hx + s * 0.17 * hs, hy + s * 0.17 * hs, s * 0.05, 0.3, 1.4); c.stroke();
  if (o.munch) {
    // Porkkana suussa
    var mo = Math.sin(globalT * 12) * s * 0.01;
    c.save(); c.translate(hx + s * 0.25, hy + s * 0.22 + mo); c.rotate(-0.3);
    c.fillStyle = '#ff8a3d';
    c.beginPath(); c.moveTo(0, -s * 0.03); c.lineTo(s * 0.22, 0); c.lineTo(0, s * 0.03); c.closePath(); c.fill();
    c.restore();
  }
  // Otsatukka
  var fc = manes[0];
  artBlob(c, hx - s * 0.06, hy - s * 0.15 * hs, s * 0.09, s * 0.06, fc, { rot: 0.5, lineColor: artShade(fc, -0.35), line: 1 });
  // Sarvi (yksisarvinen)
  if (p.u) {
    c.beginPath(); c.moveTo(hx - s * 0.02, hy - s * 0.18); c.lineTo(hx + s * 0.06, hy - s * 0.16); c.lineTo(hx + s * 0.09, hy - s * 0.44); c.closePath();
    artFillPath(c, '#fff3b0', hy - s * 0.44, hy - s * 0.16, s * 0.05, { lineColor: '#c99a20' });
    artGlow(c, hx + s * 0.06, hy - s * 0.36, s * 0.14, '#fff2a0', 0.5 + Math.sin(globalT * 4) * 0.2);
  }
  artEye(c, hx + s * 0.02, hy - s * 0.03, s * 0.065 * hs, 0.5, o.blink || o.sleep);
  if (!o.sleep && !o.blink) artBlush(c, hx + s * 0.06, hy + s * 0.07, s * 0.04);
  if (o.bow >= 0) drawBow(c, hx - s * 0.2, hy - s * 0.17, s * 0.08, HOME_BOWS[o.bow]);
  c.restore();
  c.restore();
  // Kiilto puhtaassa turkissa
  if (o.shine > 0) {
    for (i = 0; i < 3; i++) {
      var ka = globalT * 2 + i * 2.1, kx = x + dir * Math.cos(ka) * s * 0.4, ky = y + bodyY + Math.sin(ka * 1.3) * s * 0.15;
      drawStar(c, kx, ky, s * 0.05 * (0.6 + Math.abs(Math.sin(globalT * 5 + i))), globalT, 0);
    }
  }
}

function stabPonyOpts(p) {
  var blink = Math.sin(p.ph * 1.3) > 0.985 ? 1 : 0, ride = stabRide && stabRide.p === p;
  var rack = homeHasHere('saddlerack');
  return {
    wph: p.wph, speed: p.speed, head: p.head, toss: p.tossT, rear: p.state === 'rear' ? Math.min(1, Math.min(p.rearT, 1.8 - p.rearT) * 3) : 0,
    mud: p.mud, shine: p.shineT > 0 ? 1 : 0, bow: p.bow, blink: blink, swish: p.swishT > 0, munch: p.state === 'munch',
    saddle: ride ? STAB_SADDLES[rack ? (rack.lv || 0) % STAB_SADDLES.length : 0] : null
  };
}

function drawStabPony(c, p) {
  var s = stabPonySize(p), x = p.fx * viewW, y = p.fy * viewH - p.z;
  if (p.state === 'leave') { c.save(); c.globalAlpha = p.fade; }
  artShadow(c, x, p.fy * viewH + s * 0.02, s * 0.8, s * 0.16, 0.18 * (1 - Math.min(1, p.z / (viewH * 0.1)) * 0.5));
  drawStabPonyShape(c, p, x, y, s, p.dir, stabPonyOpts(p));
  if (p.grewT > 0) artGlow(c, x, y - s * 0.9, s * 1.5, '#fff2a0', Math.min(0.6, p.grewT * 0.3));
  if (p.state === 'leave') c.restore();
}

function stabDrawOrder(order) {
  var i, p;
  if (homeRoomIdx !== STABLE_ROOM) return;
  for (i = 0; i < stabPonies.length; i++) {
    p = stabPonies[i];
    if (p.state === 'held') continue;
    order.push({ y: p.fy * viewH, stabPony: p });
  }
  for (i = 0; i < stabLeavers.length; i++) order.push({ y: stabLeavers[i].fy * viewH, stabPony: stabLeavers[i] });
}

// Ruusuke: (x, y) keskikohta, r koko. g = kultainen
function drawStabRosette(c, x, y, r, g) {
  var col = g ? '#ffd24f' : '#5fa8ff', dk = g ? '#c99a20' : '#2f5f9f', i;
  if (g) artGlow(c, x, y, r * 2.4, '#fff2a0', 0.45 + Math.sin(globalT * 5) * 0.15);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - r * 0.45, y); c.lineTo(x - r * 0.6, y + r * 1.5); c.lineTo(x - r * 0.3, y + r * 1.3); c.lineTo(x - r * 0.1, y + r * 1.55); c.lineTo(x, y); c.fill();
  c.beginPath(); c.moveTo(x + r * 0.45, y); c.lineTo(x + r * 0.6, y + r * 1.5); c.lineTo(x + r * 0.3, y + r * 1.3); c.lineTo(x + r * 0.1, y + r * 1.55); c.lineTo(x, y); c.fill();
  for (i = 0; i < 10; i++) {
    var a = i / 10 * Math.PI * 2;
    artCircle(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.38, col, { lineColor: dk, line: 1 });
  }
  artCircle(c, x, y, r * 0.55, '#ffffff', { lineColor: dk, line: 1 });
  if (g) drawStar(c, x, y, r * 0.35, 0, 0);
  else { c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 0.25, 0, Math.PI * 2); c.fill(); }
}

// Talli: seinät, katto, karsina ja seimi (taustaan ja pienoiskuvaan)
function stabDrawBarn(b, sp, h) {
  var br = sp.barn, x0 = br.x, w = br.w, base = br.base, top = br.top, lw = Math.max(1.5, h * 0.004), i, st = sp.stall, rk = sp.rack;
  // Seinä: punainen lautaseinä valkoisin nurkin
  b.beginPath(); b.rect(x0, top, w, base - top);
  artFillPath(b, '#e05a5a', top, base, h * 0.1, { lineColor: '#8a2a2a', line: lw });
  b.strokeStyle = 'rgba(138,42,42,0.35)';
  b.lineWidth = lw;
  for (i = 1; i < 14; i++) { b.beginPath(); b.moveTo(x0 + i * w / 14, top); b.lineTo(x0 + i * w / 14, base); b.stroke(); }
  b.fillStyle = '#fff6ec';
  b.fillRect(x0, top, h * 0.015, base - top);
  b.fillRect(x0 + w - h * 0.015, top, h * 0.015, base - top);
  // Katto ja heinäparven luukku
  b.beginPath(); b.moveTo(x0 - h * 0.035, top + h * 0.005); b.lineTo(x0 + w * 0.5, top - h * 0.15); b.lineTo(x0 + w + h * 0.035, top + h * 0.005); b.closePath();
  artFillPath(b, '#8a5cb8', top - h * 0.15, top, h * 0.1, { lineColor: '#4a2a6a', line: lw });
  artRoundRect(b, x0 + w * 0.5 - h * 0.03, top - h * 0.09, h * 0.06, h * 0.07, h * 0.01, '#fff6ec', { lineColor: '#8a2a2a', line: lw });
  b.fillStyle = '#5a3424';
  b.fillRect(x0 + w * 0.5 - h * 0.022, top - h * 0.082, h * 0.044, h * 0.055);
  artBlob(b, x0 + w * 0.5, top - h * 0.03, h * 0.022, h * 0.01, '#f0d070', { line: false });
  // Karsina: tumma aukko, olkipohja ja kuukyltti
  b.fillStyle = '#4a2a20';
  roundRect(b, st.x0, st.top, st.x1 - st.x0, base - st.top, h * 0.02);
  b.fill();
  b.strokeStyle = '#fff6ec';
  b.lineWidth = h * 0.008;
  roundRect(b, st.x0, st.top, st.x1 - st.x0, base - st.top, h * 0.02);
  b.stroke();
  artBlob(b, st.x, base - h * 0.006, (st.x1 - st.x0) * 0.46, h * 0.022, '#f0d070', { lineColor: '#b8963a', line: 1 });
  b.strokeStyle = 'rgba(184,150,58,0.8)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 9; i++) { var sx = st.x0 + h * 0.02 + i * (st.x1 - st.x0 - h * 0.04) / 8; b.beginPath(); b.moveTo(sx, base - h * 0.01); b.lineTo(sx + h * 0.012 * ((i % 3) - 1), base - h * 0.03); b.stroke(); }
  // Kuu ja tähti karsinan yllä
  b.fillStyle = '#fff2a0';
  b.beginPath(); b.arc(st.x, st.top - h * 0.035, h * 0.022, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#e05a5a';
  b.beginPath(); b.arc(st.x + h * 0.011, st.top - h * 0.041, h * 0.019, 0, Math.PI * 2); b.fill();
  drawStar(b, st.x + h * 0.03, st.top - h * 0.05, h * 0.009, 0, 0);
  // Seimi: puinen heinähäkki
  var rx0 = rk.x - rk.w / 2, ry = rk.y;
  artRoundRect(b, rx0, ry - h * 0.07, rk.w, h * 0.075, h * 0.012, '#a9743f', { lineColor: '#5e3b1c', line: lw });
  b.fillStyle = '#5a3424';
  b.fillRect(rx0 + h * 0.01, ry - h * 0.06, rk.w - h * 0.02, h * 0.055);
  // Ruusuketaulun pohja
  var bo = sp.board;
  artRoundRect(b, bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h, h * 0.015, '#fff6ec', { lineColor: '#8a5a30', line: lw });
}

// Tausta: taivas, kukkulat, laidun aitoineen, maa ja talli
function renderStableBg(b, room, h, wallP, floorP) {
  var w = room.x1 + h * 0.02, i, x, y, fy = room.floorY, sp = stabSpots(), rw = room.x1 - room.x0;
  var sky = b.createLinearGradient(0, 0, 0, fy);
  sky.addColorStop(0, '#9fd8ff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, fy);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  cloudShape(b, w * 0.62, h * 0.1, h * 0.03);
  cloudShape(b, w * 0.88, h * 0.2, h * 0.02);
  b.fillStyle = '#bfe6a6';
  b.beginPath(); b.arc(w * 0.8, fy + h * 0.08, h * 0.32, Math.PI, 0); b.fill();
  b.fillStyle = '#a8dc8c';
  b.beginPath(); b.arc(w * 0.55, fy + h * 0.12, h * 0.26, Math.PI, 0); b.fill();
  drawTree(b, w * 0.7, fy - h * 0.1, h * 0.11);
  drawTree(b, w * 0.95, fy - h * 0.08, h * 0.09);
  // Laidun (lattiamaalin sävyä nurmessa)
  var grass = b.createLinearGradient(0, fy, 0, h);
  grass.addColorStop(0, '#9ee07f');
  grass.addColorStop(1, '#63b84e');
  b.fillStyle = grass;
  b.fillRect(0, fy, w, h - fy);
  artBlob(b, room.x0 + rw * 0.55, fy + (room.bottom - fy) * 0.55, rw * 0.42, (room.bottom - fy) * 0.38, floorP.floor[0], { lineColor: artShade(floorP.floor[1], -0.2), line: Math.max(1, h * 0.003), shadeTo: floorP.floor[1], alpha: 0.55 });
  b.strokeStyle = 'rgba(40,110,40,0.35)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 0; i < 50; i++) {
    x = (i * 131.7) % w;
    y = fy + h * 0.03 + (i * 53.3) % (h - fy - h * 0.04);
    b.beginPath(); b.moveTo(x - h * 0.006, y); b.lineTo(x - h * 0.008, y - h * 0.014); b.moveTo(x, y); b.lineTo(x + h * 0.001, y - h * 0.018); b.stroke();
  }
  for (i = 0; i < 10; i++) drawFlower(b, room.x0 + (i * 173.3) % rw, fy + h * 0.06 + (i * 61.1) % (room.bottom - fy - h * 0.08), h * 0.007, ['#ffffff', '#ffd24f', '#ff9ec4'][i % 3]);
  // Laitumen puuaita (seinämaalin väri)
  var fc = wallP.pot, ft = fy - h * 0.1, lw = Math.max(1, h * 0.003);
  for (x = h * 0.01; x < w; x += h * 0.14) {
    b.beginPath(); b.rect(x, ft, h * 0.022, fy - ft + h * 0.01);
    artFillPath(b, fc, ft, fy, h * 0.02, { lineColor: artShade(fc, -0.35), line: lw });
  }
  b.beginPath(); b.rect(0, ft + h * 0.015, w, h * 0.018);
  artFillPath(b, fc, ft, ft + h * 0.03, h * 0.02, { lineColor: artShade(fc, -0.35), line: lw });
  b.beginPath(); b.rect(0, fy - h * 0.045, w, h * 0.018);
  artFillPath(b, fc, fy - h * 0.045, fy - h * 0.03, h * 0.02, { lineColor: artShade(fc, -0.35), line: lw });
  stabDrawBarn(b, sp, h);
}

function stabThumbBg(c, x, y, w, hh, wallP, floorP) {
  var room = homeRoom(), sc = w / (room.x1 - room.x0), h = viewH, fy = room.floorY, sp = stabSpots(), rw = room.x1 - room.x0;
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
  c.fillStyle = wallP.pot;
  c.fillRect(room.x0, fy - h * 0.09, rw, h * 0.02);
  c.fillRect(room.x0, fy - h * 0.045, rw, h * 0.02);
  var k;
  for (k = room.x0 + h * 0.01; k < room.x1; k += h * 0.14) c.fillRect(k, fy - h * 0.1, h * 0.025, h * 0.11);
  stabDrawBarn(c, sp, h);
  stabDrawStations(c, sp, h);
  c.restore();
}
function stabThumbFront(c, x, y, w) {
  var room = homeRoom(), sc = w / (room.x1 - room.x0), i, p;
  c.save();
  c.translate(x - room.x0 * sc, y - room.wallTop * sc);
  c.scale(sc, sc);
  var list = stabPonies.slice().sort(function (a, b) { return a.fy - b.fy; });
  for (i = 0; i < list.length; i++) {
    p = list[i];
    drawStabPonyShape(c, p, p.fx * viewW, p.fy * viewH, stabPonySize(p), p.dir || 1, { bow: p.bow, mud: 0, head: 0 });
  }
  c.restore();
}

// Seimen heinä, kaukalo ja ruusukkeet (päivittyvät)
function stabDrawStations(c, sp, h) {
  var rk = sp.rack, t = sp.trough, i, lw = Math.max(1.5, h * 0.004), flying = 0;
  // Heinä seimessä ja säleet
  if (stabHay > 0) {
    var hl = Math.min(1, stabHay);
    artBlob(c, rk.x, rk.y - h * 0.03 - hl * h * 0.012, rk.w * 0.45, h * (0.012 + hl * 0.014), '#f0d070', { lineColor: '#b8963a', line: 1 });
    c.strokeStyle = '#d8b850';
    c.lineWidth = Math.max(1, h * 0.003);
    for (i = 0; i < 10; i++) { var hx = rk.x - rk.w * 0.4 + i * rk.w * 0.09; c.beginPath(); c.moveTo(hx, rk.y - h * 0.03); c.lineTo(hx + h * 0.01 * ((i % 3) - 1), rk.y - h * (0.05 + hl * 0.02)); c.stroke(); }
  }
  c.strokeStyle = '#a9743f';
  c.lineWidth = h * 0.008;
  for (i = 0; i < 7; i++) { var bx = rk.x - rk.w / 2 + h * 0.015 + i * (rk.w - h * 0.03) / 6; c.beginPath(); c.moveTo(bx, rk.y - h * 0.065); c.lineTo(bx, rk.y - h * 0.005); c.stroke(); }
  // Vesikaukalo
  artLimb(c, t.x - t.w * 0.4, t.y, t.x - t.w * 0.4, t.y - h * 0.03, h * 0.012, '#6a6278');
  artLimb(c, t.x + t.w * 0.4, t.y, t.x + t.w * 0.4, t.y - h * 0.03, h * 0.012, '#6a6278');
  c.beginPath();
  c.moveTo(t.x - t.w / 2, t.y - h * 0.08); c.lineTo(t.x + t.w / 2, t.y - h * 0.08); c.lineTo(t.x + t.w * 0.44, t.y - h * 0.025); c.lineTo(t.x - t.w * 0.44, t.y - h * 0.025); c.closePath();
  artFillPath(c, '#9aa6b8', t.y - h * 0.08, t.y - h * 0.025, h * 0.03, { lineColor: '#5a6478', line: lw });
  artBlob(c, t.x, t.y - h * 0.078, t.w * 0.47, h * 0.012, stabWater > 0 ? '#7fd4ff' : '#5a6478', { lineColor: stabWater > 0 ? '#4f9ad9' : '#4a5468', line: 1 });
  if (stabWater > 0) {
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = Math.max(1, h * 0.003);
    c.beginPath(); c.moveTo(t.x - t.w * 0.2 - (globalT % 1.5) * h * 0.02, t.y - h * 0.08); c.lineTo(t.x - t.w * 0.05, t.y - h * 0.08); c.stroke();
  }
  // Ruusukkeet taululla
  for (i = 0; i < stabFly.length; i++) if (!stabFly[i].star && !stabFly[i].carrot) flying++;
  var n = Math.max(0, stabBoard.length - flying);
  for (i = 0; i < n; i++) {
    var bs = stabBoardSlot(i), wg = stabBoardWig > 0 ? Math.sin(stabBoardWig * 18 + i) * h * 0.004 : 0;
    drawStabRosette(c, bs.x + wg, bs.y, h * 0.014, stabBoard[i]);
  }
}

// Maan tasalla: asemat, karsinan sisältö, porkkanalaatikko ja levossa olevat työkalut
function drawStabGround(c) {
  var sp, h = viewH, i, d, st;
  if (homeRoomIdx !== STABLE_ROOM) return;
  sp = stabSpots();
  d = stabDay();
  stabDrawStations(c, sp, h);
  // Karsina: ruusuke odottaa yötä, tai varsa nukkuu
  st = sp.stall;
  var sh = stabStallShake > 0 ? Math.sin(stabStallShake * 30) * h * 0.004 : 0;
  if (stabStall >= 0 && d > stabStall) {
    var fp = { k: 'foal', c: stabStallG ? 0 : 1, m: 2, u: stabStallG, ph: 0 };
    if (stabWakeT > 0) {
      var wk = 1 - stabWakeT / 1.4;
      drawStabPonyShape(c, fp, st.x + sh, st.y, h * 0.06, 1, { sleep: wk < 0.6, head: 0, toss: wk > 0.6 ? 1 - wk : 0, bow: -1, mud: 0 });
    } else {
      drawStabPonyShape(c, fp, st.x + sh, st.y, h * 0.06, 1, { sleep: true, head: 0.15, bow: -1, mud: 0 });
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.font = 'bold ' + Math.round(h * 0.03) + 'px ' + UI_FONT;
      c.textAlign = 'left';
      c.fillText('z', st.x + h * 0.06, st.y - h * 0.08 - Math.sin(globalT * 2) * h * 0.005);
      c.fillText('z', st.x + h * 0.085, st.y - h * 0.115 - Math.sin(globalT * 2 + 1) * h * 0.005);
      drawHintArrow(c, st.x, st.top - h * 0.08);
    }
  } else if (stabStall >= 0) {
    artGlow(c, st.x, st.y - h * 0.03, h * 0.07, stabStallG ? '#fff2a0' : '#e8d8ff', 0.6 + Math.sin(globalT * 2) * 0.15);
    drawStabRosette(c, st.x + sh, st.y - h * 0.035, h * 0.018, stabStallG);
  }
  if (stabFullT > 0) {
    var fa = Math.min(1, stabFullT * 2), fy = st.top - h * 0.12 + Math.sin(globalT * 3) * h * 0.005;
    c.save();
    c.globalAlpha = fa;
    c.font = 'bold ' + Math.round(h * 0.03) + 'px ' + UI_FONT;
    var fw = c.measureText('Talli on täynnä!').width + h * 0.04;
    artRoundRect(c, st.x - fw / 2 + h * 0.08, fy - h * 0.03, fw, h * 0.06, h * 0.03, '#fff8fb', { lineColor: '#b85a80' });
    c.fillStyle = '#7a3a5a';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Talli on täynnä!', st.x + h * 0.08, fy);
    c.restore();
  }
  // Porkkanalaatikko
  var bx = sp.box, bsh = stabBoxShake > 0 ? Math.sin(stabBoxShake * 30) * h * 0.005 : 0;
  for (i = 0; i < 5; i++) {
    var cx = bx.x + bsh + (i - 2) * h * 0.022, cy = bx.y - h * 0.045 - (i % 2) * h * 0.008;
    stabDrawCarrot(c, cx, cy, h * 0.05, -0.3 + i * 0.15);
  }
  artRoundRect(c, bx.x - h * 0.065 + bsh, bx.y - h * 0.05, h * 0.13, h * 0.05, h * 0.01, '#c98b4a', { lineColor: '#7a5030' });
  c.strokeStyle = 'rgba(122,80,48,0.6)';
  c.lineWidth = Math.max(1, h * 0.003);
  c.beginPath(); c.moveTo(bx.x - h * 0.06 + bsh, bx.y - h * 0.025); c.lineTo(bx.x + h * 0.06 + bsh, bx.y - h * 0.025); c.stroke();
  // Levossa olevat työkalut
  var held = homeDrag && homeDrag.stab === 'tool' ? homeDrag.tool : '';
  if (held !== 'hay') drawStabTool(c, 'hay', stabFed !== d);
  if (held !== 'bucket') drawStabTool(c, 'bucket', stabWat !== d);
  var muddy = false;
  for (i = 0; i < stabPonies.length; i++) if (stabPonies[i].mud > 0) muddy = true;
  if (held !== 'brush') drawStabTool(c, 'brush', muddy);
}

function stabDrawCarrot(c, x, y, len, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath(); c.moveTo(-len * 0.12, 0); c.lineTo(len * 0.12, 0); c.lineTo(0, len * 0.6); c.closePath();
  artFillPath(c, '#ff8a3d', 0, len * 0.6, len * 0.1, { lineColor: '#c95a1a', line: 1 });
  artBlob(c, -len * 0.06, -len * 0.08, len * 0.05, len * 0.12, '#4fb356', { rot: -0.4, line: false });
  artBlob(c, len * 0.06, -len * 0.08, len * 0.05, len * 0.12, '#4fb356', { rot: 0.4, line: false });
  c.restore();
}

// Heinäkori, vesisanko tai harja; need = tänään tekemättä (hehkuu ja keinahtelee)
function drawStabTool(c, name, need) {
  var p = stabToolPos(name), s = stabToolSize(), t = stabTool[name], x = p.x, y = p.y, k;
  var held = homeDrag && homeDrag.stab === 'tool' && homeDrag.tool === name;
  var bob = need && !held ? Math.abs(Math.sin(globalT * 3)) * s * 0.06 : 0;
  var rot = t.tilt * 0.9 + (t.shake > 0 ? Math.sin(t.shake * 25) * 0.12 : 0);
  if (name === 'brush' && held && t.on) rot = Math.sin(globalT * 20) * 0.15;
  if (need) artGlow(c, x, y - s * 0.4, s * 0.9, '#fff2a0', 0.35 + Math.sin(globalT * 3) * 0.15);
  c.save();
  c.translate(x, y - bob);
  c.rotate(rot);
  if (name === 'hay') {
    // Kori täynnä heinää
    artBlob(c, 0, -s * 0.5, s * 0.36, s * 0.14, '#f0d070', { lineColor: '#b8963a' });
    c.strokeStyle = '#d8b850';
    c.lineWidth = Math.max(1, s * 0.025);
    for (k = 0; k < 7; k++) { c.beginPath(); c.moveTo(-s * 0.3 + k * s * 0.1, -s * 0.5); c.lineTo(-s * 0.32 + k * s * 0.1 + (k % 2) * s * 0.06, -s * 0.7); c.stroke(); }
    c.beginPath();
    c.moveTo(-s * 0.4, -s * 0.5); c.lineTo(s * 0.4, -s * 0.5); c.lineTo(s * 0.3, 0); c.lineTo(-s * 0.3, 0); c.closePath();
    artFillPath(c, '#d9a35a', -s * 0.5, 0, s * 0.3, { lineColor: '#8a5a30' });
    c.strokeStyle = 'rgba(138,90,48,0.6)';
    c.lineWidth = Math.max(1, s * 0.02);
    for (k = 1; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.38 + k * s * 0.03, -s * 0.5 + k * s * 0.16); c.lineTo(s * 0.38 - k * s * 0.03, -s * 0.5 + k * s * 0.16); c.stroke(); }
  } else if (name === 'bucket') {
    c.strokeStyle = '#6a6278';
    c.lineWidth = Math.max(2, s * 0.04);
    c.beginPath(); c.arc(0, -s * 0.55, s * 0.3, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath();
    c.moveTo(-s * 0.32, -s * 0.6); c.lineTo(s * 0.32, -s * 0.6); c.lineTo(s * 0.48, -s * 0.66); c.lineTo(s * 0.26, 0); c.lineTo(-s * 0.26, 0); c.closePath();
    artFillPath(c, '#5fa8ff', -s * 0.66, 0, s * 0.35, { lineColor: '#2f5f9f' });
    artBlob(c, 0, -s * 0.6, s * 0.3, s * 0.05, '#bfe6ff', { lineColor: '#2f5f9f', line: 1 });
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(-s * 0.2, -s * 0.5, s * 0.05, s * 0.4);
  } else {
    // Harja: puinen selkä ja harjakset alla
    artRoundRect(c, -s * 0.32, -s * 0.36, s * 0.64, s * 0.2, s * 0.08, '#c98b4a', { lineColor: '#6a4424' });
    c.fillStyle = '#5a3a2a';
    for (k = 0; k < 9; k++) c.fillRect(-s * 0.28 + k * s * 0.07, -s * 0.16, s * 0.035, s * 0.12);
    artCircle(c, 0, -s * 0.28, s * 0.05, '#ff7bac', { lineColor: '#b84a7a', line: 1 });
    // Kahva
    artRoundRect(c, -s * 0.16, -s * 0.48, s * 0.32, s * 0.08, s * 0.04, '#a9743f', { lineColor: '#6a4424' });
  }
  c.restore();
}

// Tavaroiden ja ponien päällä: tarvekuplat, lentävät ruusukkeet, sydämet ja sormen alla oleva
function drawStabAbove(c) {
  var h = viewH, i, p, s, k, x, y, d, f, tt;
  if (homeRoomIdx !== STABLE_ROOM) return;
  d = stabDay();
  // Tarvekupla yhden ponin yllä kerrallaan: heinä, vesi tai harja
  var needF = stabFed !== d, needW = stabWat !== d, muddy = [];
  for (i = 0; i < stabPonies.length; i++) if (stabPonies[i].mud > 0) muddy.push(stabPonies[i]);
  var needs = [];
  if (needF) needs.push('hay');
  if (needW) needs.push('water');
  if (muddy.length) needs.push('brush');
  if (needs.length && stabPonies.length && !homeDrag) {
    var cyc = Math.floor(stabBubbleT / 3), need = needs[cyc % needs.length];
    p = need === 'brush' ? muddy[cyc % muddy.length] : stabPonies[cyc % stabPonies.length];
    if (p.state !== 'held' && p.state !== 'gallop') {
      s = stabPonySize(p);
      var hp = stabHeadPos(p);
      x = hp.x + p.dir * s * 0.2;
      y = hp.y - s * 0.55 + Math.sin(globalT * 3) * s * 0.04;
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.beginPath(); c.arc(x, y, s * 0.26, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x - p.dir * s * 0.14, y + s * 0.3, s * 0.06, 0, Math.PI * 2); c.fill();
      if (need === 'hay') {
        artBlob(c, x, y + s * 0.04, s * 0.15, s * 0.07, '#f0d070', { lineColor: '#b8963a', line: 1 });
        c.strokeStyle = '#d8b850';
        c.lineWidth = Math.max(1, s * 0.02);
        for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - s * 0.1 + k * s * 0.07, y); c.lineTo(x - s * 0.12 + k * s * 0.08, y - s * 0.12); c.stroke(); }
      } else if (need === 'water') {
        yardDrop(c, x, y + s * 0.05, s * 0.11);
      } else {
        c.save(); c.translate(x, y + s * 0.08); c.scale(0.5, 0.5);
        artRoundRect(c, -s * 0.32, -s * 0.36, s * 0.64, s * 0.2, s * 0.08, '#c98b4a', { lineColor: '#6a4424' });
        c.fillStyle = '#5a3a2a';
        for (k = 0; k < 7; k++) c.fillRect(-s * 0.26 + k * s * 0.08, -s * 0.16, s * 0.04, s * 0.12);
        c.restore();
      }
    }
  }
  // Lentävät ruusukkeet, tähdet ja palaavat porkkanat
  for (i = 0; i < stabFly.length; i++) {
    f = stabFly[i];
    if (f.t < 0) continue;
    tt = Math.min(1, f.t);
    x = f.x0 + (f.x1 - f.x0) * tt;
    y = f.y0 + (f.y1 - f.y0) * tt - Math.sin(tt * Math.PI) * h * (f.back || f.carrot ? 0.05 : 0.15);
    if (f.carrot) stabDrawCarrot(c, x, y, h * 0.06, tt * 4);
    else if (f.star) drawStar(c, x, y, h * 0.03, globalT * 3, 1);
    else drawStabRosette(c, x, y, h * (0.022 - tt * 0.008), f.g);
  }
  for (i = 0; i < stabHearts.length; i++) {
    var ht = stabHearts[i];
    if (ht.age < 0) continue;
    c.globalAlpha = Math.max(0, 1 - ht.age / 1.4);
    c.fillStyle = '#ff5f7e';
    drawHeartShape(c, ht.x + Math.sin(ht.age * 5) * h * 0.008, ht.y - ht.age * h * 0.08, h * 0.016, true);
    c.globalAlpha = 1;
  }
  // Harjan muta- ja kiiltohiukkaset
  for (i = 0; i < stabBits.length; i++) {
    var bt = stabBits[i];
    if (bt.kind === 'hay') {
      c.strokeStyle = '#e0c050';
      c.lineWidth = Math.max(1, h * 0.003);
      c.beginPath(); c.moveTo(bt.x, bt.y); c.lineTo(bt.x + Math.cos(bt.rot + bt.age * 5) * h * 0.012, bt.y + Math.sin(bt.rot + bt.age * 5) * h * 0.012); c.stroke();
    } else {
      c.fillStyle = bt.kind === 'bucket' ? '#5fb8ff' : (bt.kind === 'mud' ? '#8a6038' : '#ffffff');
      c.beginPath(); c.arc(bt.x, bt.y, h * (bt.kind === 'mud' ? 0.005 : 0.006), 0, Math.PI * 2); c.fill();
    }
  }
  if (!homeDrag || !homeDrag.stab) return;
  if (homeDrag.stab === 'pony') {
    p = homeDrag.pony;
    s = stabPonySize(p);
    artShadow(c, p.fx * viewW, Math.min(homeRoom().bottom, p.fy * viewH + viewH * 0.06), s * 0.7, s * 0.14, 0.12);
    var op = stabPonyOpts(p);
    op.wph = globalT * 8; op.speed = homeDrag.moved ? 0.2 : 0;
    drawStabPonyShape(c, p, p.fx * viewW, p.fy * viewH, s, p.dir, op);
  } else if (homeDrag.stab === 'tool') {
    drawStabTool(c, homeDrag.tool, false);
  } else if (homeDrag.stab === 'carrot') {
    stabDrawCarrot(c, homeDrag.gx, homeDrag.gy, h * 0.07, -0.6);
  } else if (homeDrag.stab === 'rosette') {
    var st = stabSpots().stall, onStall = homeDrag.gx > st.x0 && homeDrag.gx < st.x1 && homeDrag.gy > st.top && homeDrag.gy < st.y + h * 0.05;
    if (onStall && stabStall < 0 && (stabCount() < STAB_MAX || stabCanSendAway())) artGlow(c, st.x, st.y - h * 0.05, h * 0.12, '#fff2a0', 0.7);
    drawStabRosette(c, homeDrag.gx, homeDrag.gy, h * 0.024, homeDrag.g);
  }
}

// Tallin tavarat ja kaupan ponikortit: palauttaa true, jos piirrettiin
function drawStabItem(c, it, x, y, s) {
  var i, a;
  if (stabIsPony(it.id)) {
    var demo = { k: it.id, c: it.id === 'pony' ? 1 : 3, m: it.id === 'pony' ? 0 : 2, u: 0, ph: 0 };
    drawStabPonyShape(c, demo, x - s * 0.05, y - s * 0.05, s * (it.id === 'foal' ? 0.4 : 0.5), 1, { bow: -1, mud: 0, head: 0 });
    return true;
  }
  if (it.id === 'jumpbar') {
    var lv = (it.lv || 0) % 3, bh = s * (0.25 + lv * 0.15), cl = it.clackT > 0 ? Math.sin(it.clackT * 30) * s * 0.02 : 0;
    for (i = 0; i < 2; i++) {
      var px = x + (i ? 1 : -1) * s * 0.45;
      artLimb(c, px, y, px, y - s * 0.75, s * 0.07, '#ffffff', '#8a7a9a');
      c.fillStyle = '#ff5f7e';
      for (a = 0; a < 3; a++) c.fillRect(px - s * 0.035, y - s * (0.15 + a * 0.22), s * 0.07, s * 0.08);
    }
    c.save(); c.translate(x, y - bh + cl);
    for (i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#ffffff' : '#5fa8ff';
      c.fillRect(-s * 0.45 + i * s * 0.15, -s * 0.035, s * 0.15, s * 0.07);
    }
    c.strokeStyle = '#2f5f9f';
    c.lineWidth = Math.max(1, s * 0.015);
    c.strokeRect(-s * 0.45, -s * 0.035, s * 0.9, s * 0.07);
    c.restore();
    return true;
  }
  if (it.id === 'saddlerack') {
    var col = STAB_SADDLES[(it.lv || 0) % STAB_SADDLES.length], bump = it.shineT > 0 ? Math.sin(it.shineT * 20) * s * 0.02 : 0;
    artLimb(c, x - s * 0.3, y, x - s * 0.2, y - s * 0.5, s * 0.06, '#a9743f');
    artLimb(c, x + s * 0.3, y, x + s * 0.2, y - s * 0.5, s * 0.06, '#a9743f');
    artLimb(c, x - s * 0.32, y - s * 0.52, x + s * 0.32, y - s * 0.52, s * 0.08, '#c98b4a');
    c.beginPath();
    c.moveTo(x - s * 0.35, y - s * 0.5 - bump); c.quadraticCurveTo(x - s * 0.2, y - s * 0.78 - bump, x, y - s * 0.68 - bump); c.quadraticCurveTo(x + s * 0.2, y - s * 0.78 - bump, x + s * 0.35, y - s * 0.5 - bump);
    c.quadraticCurveTo(x + s * 0.3, y - s * 0.3 - bump, x + s * 0.15, y - s * 0.28 - bump); c.lineTo(x - s * 0.15, y - s * 0.28 - bump); c.quadraticCurveTo(x - s * 0.3, y - s * 0.3 - bump, x - s * 0.35, y - s * 0.5 - bump);
    artFillPath(c, col, y - s * 0.78, y - s * 0.28, s * 0.3, { lineColor: artShade(col, -0.4) });
    artCircle(c, x, y - s * 0.55 - bump, s * 0.05, '#ffd24f', { lineColor: '#c99a20', line: 1 });
    artLimb(c, x - s * 0.1, y - s * 0.3 - bump, x - s * 0.12, y - s * 0.12 - bump, s * 0.02, '#8a8298', false);
    artCircle(c, x - s * 0.12, y - s * 0.1 - bump, s * 0.04, '#b9b4c8', { lineColor: '#6a6278', line: 1 });
    return true;
  }
  if (it.id === 'rockinghorse') {
    var k = Math.min(1, (it.rockT || 0) / 1.2), ang = Math.sin(globalT * 5) * 0.25 * k;
    c.save(); c.translate(x, y - s * 0.05); c.rotate(ang);
    c.strokeStyle = '#a9743f';
    c.lineWidth = s * 0.07;
    c.beginPath(); c.arc(0, -s * 0.9, s * 0.92, Math.PI * 0.32, Math.PI * 0.68); c.stroke();
    artLimb(c, -s * 0.25, -s * 0.12, -s * 0.2, -s * 0.4, s * 0.06, '#c98b4a');
    artLimb(c, s * 0.25, -s * 0.12, s * 0.2, -s * 0.4, s * 0.06, '#c98b4a');
    drawStabPonyShape(c, { k: 'pony', c: 3, m: 2, u: 0, ph: 0 }, 0, -s * 0.1, s * 0.4, 1, { bow: 0, mud: 0, head: 0, saddle: '#ff7bac' });
    c.restore();
    return true;
  }
  if (it.id === 'stablecat') {
    var awake = it.catT > 0, st = awake ? Math.sin(Math.min(1, (2.5 - it.catT) * 2) * Math.PI / 2) : 0;
    artBlob(c, x, y - s * 0.12, s * 0.42, s * 0.12, '#f0d070', { lineColor: '#b8963a' });
    var cc = '#ffb84f';
    if (!awake) {
      artBlob(c, x, y - s * 0.26, s * 0.26, s * 0.13, cc, { lineColor: '#c97a1a', hi: 0.3 });
      artCircle(c, x + s * 0.2, y - s * 0.27, s * 0.12, cc, { lineColor: '#c97a1a' });
      c.strokeStyle = '#c97a1a';
      c.lineWidth = Math.max(2, s * 0.05);
      c.beginPath(); c.arc(x - s * 0.05, y - s * 0.22, s * 0.25, Math.PI * 0.1, Math.PI * 0.8); c.stroke();
      artEye(c, x + s * 0.22, y - s * 0.28, s * 0.025, 0, 1);
      c.fillStyle = 'rgba(120,80,160,0.8)';
      c.font = Math.round(s * 0.14) + 'px sans-serif';
      c.textAlign = 'left';
      c.fillText('z', x + s * 0.32, y - s * 0.42 - Math.sin(globalT * 2) * s * 0.02);
    } else {
      artLimb(c, x - s * 0.15, y - s * 0.25, x - s * 0.15, y - s * 0.12, s * 0.06, cc, '#c97a1a');
      artLimb(c, x + s * 0.15, y - s * 0.25, x + s * 0.15, y - s * 0.12, s * 0.06, cc, '#c97a1a');
      artBlob(c, x, y - s * (0.28 + st * 0.04), s * 0.22, s * 0.1, cc, { lineColor: '#c97a1a', hi: 0.3 });
      c.strokeStyle = '#c97a1a';
      c.lineWidth = Math.max(2, s * 0.05);
      c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.3); c.quadraticCurveTo(x - s * 0.35, y - s * 0.5, x - s * 0.28, y - s * 0.6 - Math.sin(globalT * 6) * s * 0.03); c.stroke();
      var hx = x + s * 0.22, hy = y - s * (0.42 + st * 0.04);
      artCircle(c, hx, hy, s * 0.12, cc, { lineColor: '#c97a1a' });
      c.fillStyle = cc;
      c.beginPath(); c.moveTo(hx - s * 0.1, hy - s * 0.05); c.lineTo(hx - s * 0.08, hy - s * 0.2); c.lineTo(hx - s * 0.01, hy - s * 0.1); c.fill();
      c.beginPath(); c.moveTo(hx + s * 0.1, hy - s * 0.05); c.lineTo(hx + s * 0.08, hy - s * 0.2); c.lineTo(hx + s * 0.01, hy - s * 0.1); c.fill();
      artEye(c, hx - s * 0.04, hy - s * 0.01, s * 0.03, 0.4, 0);
      artEye(c, hx + s * 0.05, hy - s * 0.01, s * 0.03, 0.4, 0);
      c.fillStyle = '#ff7bac';
      c.beginPath(); c.arc(hx + s * 0.005, hy + s * 0.04, s * 0.015, 0, Math.PI * 2); c.fill();
    }
    return true;
  }
  if (it.id === 'stablebell') {
    var rg = it.ringT > 0 ? Math.sin(it.ringT * 25) * 0.4 * Math.min(1, it.ringT) : 0;
    artLimb(c, x, y, x, y - s * 1.2, s * 0.05, '#a9743f');
    artLimb(c, x, y - s * 1.2, x + s * 0.25, y - s * 1.2, s * 0.05, '#a9743f');
    c.save(); c.translate(x + s * 0.22, y - s * 1.18); c.rotate(rg);
    c.beginPath(); c.moveTo(-s * 0.06, s * 0.02); c.quadraticCurveTo(-s * 0.08, s * 0.18, -s * 0.15, s * 0.24); c.lineTo(s * 0.15, s * 0.24); c.quadraticCurveTo(s * 0.08, s * 0.18, s * 0.06, s * 0.02); c.closePath();
    artFillPath(c, '#ffd24f', 0, s * 0.24, s * 0.15, { lineColor: '#c99a20' });
    artCircle(c, 0, s * 0.26, s * 0.035, '#c99a20', { line: false });
    c.restore();
    if (it.ringT > 0) artGlow(c, x + s * 0.22, y - s * 1.05, s * 0.4, '#fff2a0', it.ringT * 0.4);
    return true;
  }
  if (it.id === 'trophy') {
    var sh2 = it.shineT > 0;
    if (sh2) artGlow(c, x, y - s * 0.5, s * 0.7, '#fff2a0', Math.min(0.7, it.shineT * 0.4));
    artRoundRect(c, x - s * 0.22, y - s * 0.16, s * 0.44, s * 0.16, s * 0.03, '#8a5a30', { lineColor: '#5e3b1c' });
    artLimb(c, x, y - s * 0.16, x, y - s * 0.32, s * 0.08, '#ffd24f', '#c99a20');
    c.beginPath(); c.moveTo(x - s * 0.24, y - s * 0.75); c.lineTo(x + s * 0.24, y - s * 0.75); c.quadraticCurveTo(x + s * 0.22, y - s * 0.38, x, y - s * 0.34); c.quadraticCurveTo(x - s * 0.22, y - s * 0.38, x - s * 0.24, y - s * 0.75);
    artFillPath(c, '#ffd24f', y - s * 0.75, y - s * 0.34, s * 0.24, { lineColor: '#c99a20', hi: 0.4 });
    c.strokeStyle = '#c99a20';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.arc(x - s * 0.26, y - s * 0.6, s * 0.09, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.arc(x + s * 0.26, y - s * 0.6, s * 0.09, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    // Ruusukkeiden määrä laatassa
    c.fillStyle = '#fff6d8';
    c.font = 'bold ' + Math.round(s * 0.12) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(stabTotal), x, y - s * 0.08);
    drawStar(c, x, y - s * 0.57, s * 0.08, sh2 ? globalT * 3 : 0, 0);
    return true;
  }
  return false;
}

// Tallin tavaran napautus: palauttaa true, jos tavara oli tallin
function stabItemTap(it) {
  var i, s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH, p;
  if (it.id === 'jumpbar') {
    it.lv = ((it.lv || 0) + 1) % 3;
    it.clackT = 0.4;
    playNote(330 + it.lv * 110, 0, 0.06, 'square', 0.08);
    playNote(440 + it.lv * 110, 0.08, 0.08, 'square', 0.06);
    saveProgress();
  } else if (it.id === 'saddlerack') {
    it.lv = ((it.lv || 0) + 1) % STAB_SADDLES.length;
    it.shineT = 0.5;
    spawnSparkles(x, y - s * 0.55, 10, STAB_SADDLES[it.lv]);
    playNote(880, 0, 0.08, 'sine', 0.2);
    playNote(1175, 0.08, 0.12, 'sine', 0.2);
    saveProgress();
  } else if (it.id === 'rockinghorse') {
    it.rockT = 3;
    for (i = 0; i < 4; i++) playNote(i % 2 ? 330 : 392, i * 0.4, 0.1, 'triangle', 0.15);
  } else if (it.id === 'stablecat') {
    it.catT = 2.5;
    playNote(880, 0, 0.12, 'sine', 0.2);
    playNote(1175, 0.1, 0.08, 'sine', 0.18);
    playNote(784, 0.22, 0.25, 'sine', 0.18);
  } else if (it.id === 'stablebell') {
    it.ringT = 1.5;
    playNote(1568, 0, 0.5, 'sine', 0.25);
    playNote(2093, 0.02, 0.4, 'sine', 0.12);
    playNote(1568, 0.5, 0.5, 'sine', 0.2);
    // Ponit ravaavat kellon luo
    if (homeRoomIdx === STABLE_ROOM) {
      for (i = 0; i < stabPonies.length; i++) {
        p = stabPonies[i];
        if (stabBusy(p)) continue;
        stabGo(p, '', { x: x + (i % 2 ? 1 : -1) * viewH * (0.12 + Math.floor(i / 2) * 0.1), y: y + viewH * (0.02 + (i % 3) * 0.03) }, 'trot');
        stabNicker(p, 0.3 + i * 0.2);
      }
    }
  } else if (it.id === 'trophy') {
    it.shineT = 1.5;
    var mel = [523, 659, 784, 1047];
    for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.12, 0.15, 'square', 0.05);
    spawnSparkles(x, y - s * 0.6, 14, '#ffd24f');
  } else {
    return false;
  }
  return true;
}

// Huoneen kyltti: hevosenkenkä (aukko alaspäin, kultaiset naulat)
function stabSign(b, x, y, sh) {
  var r = sh * 0.22, a0 = Math.PI * 0.5 + 0.55, a1 = Math.PI * 2.5 - 0.55, i, a;
  b.strokeStyle = '#8a8298';
  b.lineWidth = sh * 0.14;
  b.lineCap = 'round';
  b.beginPath(); b.arc(x, y + sh * 0.02, r, a0, a1); b.stroke();
  b.fillStyle = '#ffd24f';
  for (i = 0; i < 5; i++) {
    a = a0 + 0.25 + (a1 - a0 - 0.5) * i / 4;
    b.beginPath(); b.arc(x + Math.cos(a) * r, y + sh * 0.02 + Math.sin(a) * r, sh * 0.03, 0, Math.PI * 2); b.fill();
  }
}
