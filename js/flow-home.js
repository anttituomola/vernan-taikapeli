'use strict';

// Linnan sisustus: maaliton huoneisto, jossa kentistä kerätyillä tähdillä ostetaan
// huonekaluja ja raahataan ne paikoilleen. Kaksi huonetta (sali ja tornihuone),
// joiden välillä kuljetaan ovesta. Kauppa on sivutettu (nuolet alareunassa).
// Puput reagoivat tavaroihin (peti, porkkanat, pallo, nalle, kakku, trampoliini).
// Avataan linnan puhekuplasta (Linnasaari).

var HOME_ITEMS = [
  { id: 'rug', price: 2, kind: 'floor' },
  { id: 'lamp', price: 2, kind: 'floor' },
  { id: 'plant', price: 2, kind: 'floor' },
  { id: 'ball', price: 2, kind: 'floor' },
  { id: 'painting', price: 3, kind: 'wall' },
  { id: 'bed', price: 3, kind: 'floor' },
  { id: 'carrots', price: 3, kind: 'floor' },
  { id: 'curtains', price: 3, kind: 'wall' },
  { id: 'mirror', price: 3, kind: 'wall' },
  { id: 'table', price: 4, kind: 'floor' },
  { id: 'shelf', price: 4, kind: 'floor' },
  { id: 'musicbox', price: 4, kind: 'floor' },
  { id: 'teddy', price: 2, kind: 'floor' },
  { id: 'vase', price: 2, kind: 'floor' },
  { id: 'clock', price: 3, kind: 'wall' },
  { id: 'lights', price: 3, kind: 'wall' },
  { id: 'cake', price: 3, kind: 'floor' },
  { id: 'teaset', price: 3, kind: 'floor' },
  { id: 'sofa', price: 4, kind: 'floor' },
  { id: 'rockinghorse', price: 4, kind: 'floor' },
  { id: 'chest', price: 4, kind: 'floor' },
  { id: 'trampoline', price: 5, kind: 'floor' },
  { id: 'aquarium', price: 5, kind: 'floor' },
  { id: 'piano', price: 5, kind: 'floor' }
];
// Huoneet: 0 = sali (ovi oikealla), 1 = tornihuone (ovi vasemmalla)
var HOME_ROOMS = [{ id: 'hall' }, { id: 'tower' }];
var HOME_SHOP_PAGE = 10;
// Maalit: purkki raahataan seinälle (wall-liuku) tai lattialle (floor-liuku). Ilmaisia.
var HOME_PAINTS = [
  { id: 'lilac', pot: '#c9a0ff', wall: ['#f3e9ff', '#e2d2f5'], floor: ['#e2b98a', '#c48f5c'] },
  { id: 'pink', pot: '#ff7bac', wall: ['#ffe6f2', '#ffc4dd'], floor: ['#f2c6d8', '#d99ab5'] },
  { id: 'sky', pot: '#5fa8ff', wall: ['#e6f4ff', '#bfe0ff'], floor: ['#b9d4ee', '#8fb3d9'] },
  { id: 'mint', pot: '#6fd66f', wall: ['#e8fff0', '#bff0d0'], floor: ['#c8e6c0', '#9ccc94'] },
  { id: 'sun', pot: '#ffd24f', wall: ['#fff7d6', '#ffe7a0'], floor: ['#f0d59a', '#d9b26a'] },
  { id: 'night', pot: '#3a3a8a', wall: ['#2d2a6a', '#4a3f8a'], floor: ['#a9a6c8', '#7a7898'] },
  { id: 'wood', pot: '#a9743f', wall: ['#f7ead2', '#e6cfa8'], floor: ['#c98b4a', '#8a5a30'] }
];
var HOME_BOWS = ['#ff7bac', '#5fa8ff', '#ffd24f'];
function homeDecorDefault() { return { 0: { wall: 0, floor: 0 }, 1: { wall: 5, floor: 5 } }; }
var homeDecor = homeDecorDefault();   // huoneen seinä- ja lattiamaali (indeksi HOME_PAINTS)
var homeBows = [-1, -1, -1];          // pupujen rusetit (indeksi HOME_BOWS, -1 = ei)
var homeRoomIdx = 0;
var homeShopPage = 0;
var homeBunnies = [];
var homeDrag = null;        // { item, dx, dy, sx, sy, moved }
var homeShake = { id: '', t: 0 };
var homeNotes = [];         // soittorasian ja pianon nuotit
var homeFish = [];          // akvaarion kalat { fx, fy, dir, sp }
var homeBgCanvas = document.createElement('canvas');
var homeBgKey = '';

function homeRoom() {
  return { x0: viewH * 0.02, x1: viewW * 0.735, wallTop: viewH * 0.03, floorY: viewH * 0.6, bottom: viewH * 0.97 };
}
function homeShopBox() {
  return { x: viewW * 0.755, y: viewH * 0.03, w: viewW * 0.235, h: viewH * 0.94, head: viewH * 0.11, foot: viewH * 0.085 };
}
function homeItemDef(id) {
  var i;
  for (i = 0; i < HOME_ITEMS.length; i++) if (HOME_ITEMS[i].id === id) return HOME_ITEMS[i];
  return null;
}
function homeHas(id) {
  var i;
  for (i = 0; i < homeItems.length; i++) if (homeItems[i].id === id) return homeItems[i];
  return null;
}
// Tavara tässä huoneessa (vanhat tallennukset: huone puuttuu = sali; -1 = varastossa)
function homeItemRoom(it) {
  return it.room === undefined ? 0 : it.room;
}
function homeStored(id) {
  var it = homeHas(id);
  return it && homeItemRoom(it) === -1 ? it : null;
}
function homeHasHere(id) {
  var it = homeHas(id);
  return it && homeItemRoom(it) === homeRoomIdx ? it : null;
}
function homeItemSize() {
  return viewH * 0.13;
}
// Ovi: salissa oikeassa reunassa, tornihuoneessa vasemmassa
function homeDoorRect() {
  var room = homeRoom(), h = viewH;
  if (homeRoomIdx === 0) return { x: room.x1 - h * 0.13, y: room.floorY - h * 0.3, w: h * 0.12, h: h * 0.3 };
  return { x: room.x0 + h * 0.01, y: room.floorY - h * 0.3, w: h * 0.12, h: h * 0.3 };
}

function showHome() {
  var i, ids = ['replayBtn', 'continueBtn', 'jumpBtn', 'penBtn', 'seaBtn'];
  mode = 'home';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  homeDrag = null;
  homeRoomIdx = 0;
  homeBgKey = '';
  document.getElementById('hubChrome').style.display = 'none';
  for (i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#e8dcf5';
  lastTime = 0;
  if (homeBunnies.length === 0) {
    for (i = 0; i < 3; i++) homeBunnies.push({ fx: 0.15 + i * 0.2, fy: 0.72 + (i % 2) * 0.12, tx: 0, ty: 0, hop: 0, earT: i, state: 'wander', timer: 1 + i, moving: false, bow: homeBows[i] });
    for (i = 0; i < 3; i++) { homeBunnies[i].tx = homeBunnies[i].fx; homeBunnies[i].ty = homeBunnies[i].fy; }
  }
  if (homeFish.length === 0) {
    for (i = 0; i < 3; i++) homeFish.push({ fx: (i - 1) * 0.25, fy: (i % 2) * 0.2 - 0.1, dir: i % 2 ? -1 : 1, sp: 0.25 + i * 0.08, dart: 0 });
  }
  playNote(523, 0, 0.15, 'triangle', 0.3);
  playNote(659, 0.1, 0.2, 'triangle', 0.3);
}

function homeGoRoom(idx) {
  var i, b;
  homeRoomIdx = idx;
  homeBgKey = '';
  homeDrag = null;
  // Puput tulevat perässä ovesta
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    b.fx = idx === 0 ? 0.62 - i * 0.04 : 0.1 + i * 0.04;
    b.fy = 0.75 + (i % 2) * 0.1;
    b.timer = 0.3 + i * 0.3;
    b.hop = 1;
  }
  spawnSparkles(homeDoorRect().x + homeDoorRect().w / 2, homeRoom().floorY - viewH * 0.15, 12, '#ffe27a');
  playNote(392, 0, 0.1, 'triangle', 0.25);
  playNote(523, 0.1, 0.15, 'triangle', 0.25);
}

// ---------- Kauppa ----------
// Viimeinen sivu on maalit ja rusetit
function homeShopPages() {
  return Math.ceil(HOME_ITEMS.length / HOME_SHOP_PAGE) + 1;
}
function homeShopIsPaintPage() {
  return homeShopPage === homeShopPages() - 1;
}

// Kortit: { def } huonekalu, { paint } maalipurkki tai { bow } rusetti
function homeShopCells() {
  var s = homeShopBox(), cells = [], i, k, cols = 2, rows = HOME_SHOP_PAGE / cols;
  var pad = viewH * 0.012;
  var cw = (s.w - pad * (cols + 1)) / cols;
  var ch = (s.h - s.head - s.foot - pad * (rows + 1)) / rows;
  var cellAt = function (k, extra) {
    extra.x = s.x + pad + (k % cols) * (cw + pad);
    extra.y = s.y + s.head + pad + Math.floor(k / cols) * (ch + pad);
    extra.w = cw;
    extra.h = ch;
    return extra;
  };
  if (homeShopIsPaintPage()) {
    for (i = 0; i < HOME_PAINTS.length && i < HOME_SHOP_PAGE; i++) cells.push(cellAt(i, { paint: i }));
    for (k = 0; k < HOME_BOWS.length && i + k < HOME_SHOP_PAGE; k++) cells.push(cellAt(i + k, { bow: k }));
    return cells;
  }
  var start = homeShopPage * HOME_SHOP_PAGE;
  for (i = start; i < HOME_ITEMS.length && i < start + HOME_SHOP_PAGE; i++) {
    cells.push(cellAt(i - start, { def: HOME_ITEMS[i] }));
  }
  return cells;
}

// Sivunuolet kaupan alareunassa: { prev, next } (kumpikin { x, y, r } tai null)
function homeShopArrows() {
  var s = homeShopBox(), r = s.foot * 0.36, y = s.y + s.h - s.foot * 0.5;
  return {
    prev: homeShopPage > 0 ? { x: s.x + s.w * 0.25, y: y, r: r } : null,
    next: homeShopPage < homeShopPages() - 1 ? { x: s.x + s.w * 0.75, y: y, r: r } : null
  };
}

// Osto raahaamalla: kortista nostetaan haamutavara, joka ostetaan, kun se
// päästetään irti huoneen puolella. Kaupan päälle palautettu peruu oston.
// Varastoitu (kauppaan palautettu) tavara nostetaan samasta kortista ilmaiseksi.
// Maalipurkki ja rusetti nostetaan samalla tavalla (ilmaisia).
function homeShopPick(cell, px, py) {
  var def = cell.def, it;
  if (cell.paint !== undefined) {
    homeDrag = { ghost: true, paint: cell.paint, gx: px, gy: py, dx: 0, dy: 0, sx: px, sy: py, moved: false };
    playNote(660, 0, 0.06, 'sine', 0.2);
    return;
  }
  if (cell.bow !== undefined) {
    homeDrag = { ghost: true, bow: cell.bow, gx: px, gy: py, dx: 0, dy: 0, sx: px, sy: py, moved: false };
    playNote(660, 0, 0.06, 'sine', 0.2);
    return;
  }
  it = homeStored(def.id);
  if (it) {
    it.fx = px / viewW;
    it.fy = py / viewH;
    homeDrag = { item: it, ghost: true, def: def, existing: true, dx: 0, dy: 0, sx: px, sy: py, moved: false };
    playNote(660, 0, 0.06, 'sine', 0.2);
    return;
  }
  if (homeHas(def.id)) {
    playNote(440, 0, 0.08, 'triangle', 0.15);
    return;
  }
  if (starCoins < def.price) {
    homeShake.id = def.id;
    homeShake.t = 0.5;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    return;
  }
  it = { id: def.id, fx: px / viewW, fy: py / viewH, on: def.id !== 'chest', phase: 0, room: homeRoomIdx };
  homeDrag = { item: it, ghost: true, def: def, dx: 0, dy: 0, sx: px, sy: py, moved: false };
  playNote(660, 0, 0.06, 'sine', 0.2);
}

// Tavara varastoon: pois huoneesta, kortti kaupassa näyttää sen odottavana
function homeStore(it) {
  it.room = -1;
  it.roll = 0;
  saveProgress();
  var s = homeShopBox();
  spawnSparkles(s.x + s.w / 2, viewH * 0.5, 14, '#c9a0ff');
  playNote(523, 0, 0.1, 'triangle', 0.25);
  playNote(392, 0.1, 0.15, 'triangle', 0.25);
}

// Tavara toiseen huoneeseen oven kautta: ilmestyy toisen huoneen oven viereen
function homeMoveToOtherRoom(it) {
  var def = homeItemDef(it.id), room = homeRoom(), s = homeItemSize();
  var other = homeRoomIdx === 0 ? 1 : 0;
  it.room = other;
  it.roll = 0;
  // Toisen huoneen ovi on vastakkaisella laidalla: sali -> torni vasempaan laitaan, torni -> sali oikeaan
  it.fx = (other === 1 ? room.x0 + s * 1.3 : room.x1 - s * 1.6) / viewW;
  if (def && def.kind === 'wall') it.fy = 0.3;
  else it.fy = Math.min(Math.max(it.fy, (room.floorY + s * 0.05) / viewH), room.bottom / viewH);
  saveProgress();
  var dr = homeDoorRect();
  spawnSparkles(dr.x + dr.w / 2, dr.y + dr.h * 0.4, 16, '#ffe27a');
  playNote(523, 0, 0.1, 'triangle', 0.25);
  playNote(659, 0.1, 0.1, 'triangle', 0.25);
  playNote(784, 0.2, 0.2, 'triangle', 0.25);
}

// Maali seinälle tai lattialle; tausta piirretään uudelleen
function homePaint(idx, py) {
  var room = homeRoom(), d = homeDecor[homeRoomIdx];
  if (py < room.floorY) d.wall = idx; else d.floor = idx;
  homeBgKey = '';
  saveProgress();
  spawnSparkles(homeDrag ? homeDrag.gx : viewW * 0.3, py, 22, HOME_PAINTS[idx].pot);
  playNote(660, 0, 0.1, 'sine', 0.25);
  playNote(880, 0.08, 0.12, 'sine', 0.25);
  playNote(1175, 0.16, 0.25, 'sine', 0.25);
}

function homeBowTo(bowIdx, px, py) {
  var i, b, best = -1, bd = 1e9, dx, dy, d;
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    dx = px - b.fx * viewW;
    dy = py - (b.fy * viewH - viewH * 0.05);
    d = Math.sqrt(dx * dx + dy * dy);
    if (d < viewH * 0.12 && d < bd) { bd = d; best = i; }
  }
  if (best < 0) return false;
  homeBunnies[best].bow = bowIdx;
  homeBows[best] = bowIdx;
  homeBunnies[best].hop = 1;
  saveProgress();
  spawnSparkles(homeBunnies[best].fx * viewW, homeBunnies[best].fy * viewH - viewH * 0.1, 14, HOME_BOWS[bowIdx]);
  playNote(1200, 0, 0.08, 'sine', 0.25);
  playNote(1500, 0.07, 0.12, 'sine', 0.25);
  return true;
}

function homeBuy(def, it) {
  if (homeItemRoom(it) === -1) {
    // Varastosta takaisin: ei veloitusta
    it.room = homeRoomIdx;
  } else {
    starCoins -= def.price;
    homeItems.push(it);
  }
  saveProgress();
  spawnSparkles(it.fx * viewW, it.fy * viewH - homeItemSize() * 0.4, 18, '#ffe27a');
  playNote(784, 0, 0.12, 'sine', 0.35);
  playNote(1047, 0.1, 0.15, 'sine', 0.35);
  playNote(1319, 0.2, 0.3, 'sine', 0.35);
}

// ---------- Syöte ----------
function homeItemRect(it) {
  var s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH, def = homeItemDef(it.id);
  if (def && def.kind === 'wall') return { x: x - s * 0.55, y: y - s * 0.45, w: s * 1.1, h: s * 0.9 };
  return { x: x - s * 0.55, y: y - s * 0.95, w: s * 1.1, h: s * 1.05 };
}

function handleHomeTap(px, py) {
  var i, cells, c, r, ar, dx, dy;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var shop = homeShopBox();
  if (px >= shop.x) {
    ar = homeShopArrows();
    if (ar.prev) { dx = px - ar.prev.x; dy = py - ar.prev.y; if (dx * dx + dy * dy < ar.prev.r * ar.prev.r * 2) { homeShopPage--; playNote(660, 0, 0.08, 'sine', 0.25); return; } }
    if (ar.next) { dx = px - ar.next.x; dy = py - ar.next.y; if (dx * dx + dy * dy < ar.next.r * ar.next.r * 2) { homeShopPage++; playNote(784, 0, 0.08, 'sine', 0.25); return; } }
    cells = homeShopCells();
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) { homeShopPick(c, px, py); return; }
    }
    return;
  }
  // Päällimmäinen tavara sormen alla (viimeksi lisätty on päällimmäinen)
  for (i = homeItems.length - 1; i >= 0; i--) {
    if (homeItemRoom(homeItems[i]) !== homeRoomIdx) continue;
    r = homeItemRect(homeItems[i]);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      homeDrag = { item: homeItems[i], dx: px - homeItems[i].fx * viewW, dy: py - homeItems[i].fy * viewH, sx: px, sy: py, moved: false };
      // Nosta päällimmäiseksi
      homeItems.splice(i, 1);
      homeItems.push(homeDrag.item);
      return;
    }
  }
  // Pupun napautus: hyppy ja vikinä
  for (i = 0; i < homeBunnies.length; i++) {
    var b = homeBunnies[i], bx = b.fx * viewW, by = b.fy * viewH;
    if (Math.abs(px - bx) < viewH * 0.06 && py < by && py > by - viewH * 0.12) {
      b.hop = 1;
      b.state = 'wander';
      b.timer = 0.2;
      spawnSparkles(bx, by - viewH * 0.1, 6, '#ffd6ec');
      playNote(1200 + i * 100, 0, 0.08, 'sine', 0.25);
      playNote(1500 + i * 100, 0.07, 0.1, 'sine', 0.2);
      return;
    }
  }
  // Ovi: toiseen huoneeseen
  r = homeDoorRect();
  if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
    homeGoRoom(homeRoomIdx === 0 ? 1 : 0);
  }
}

// Onko raahattava kaupan puolella (haamu: ei ostoa vielä; oma tavara: varastoon)
function homeDragX() {
  if (!homeDrag) return 0;
  return homeDrag.item ? homeDrag.item.fx * viewW : homeDrag.gx;
}
function homeGhostInShop() {
  return !!(homeDrag && homeDragX() >= homeShopBox().x - homeItemSize() * 0.3);
}
// Onko raahattava tavara oven päällä (siirto toiseen huoneeseen)
function homeDragOnDoor() {
  if (!homeDrag || !homeDrag.item) return false;
  var dr = homeDoorRect(), x = homeDrag.item.fx * viewW, y = homeDrag.item.fy * viewH;
  var def = homeItemDef(homeDrag.item.id);
  if (def && def.kind !== 'wall') y -= homeItemSize() * 0.4;
  return x >= dr.x - dr.w * 0.2 && x <= dr.x + dr.w * 1.2 && y >= dr.y - dr.h * 0.1 && y <= dr.y + dr.h * 1.1;
}

function homeMove(px, py) {
  if (!homeDrag) return;
  if (Math.abs(px - homeDrag.sx) + Math.abs(py - homeDrag.sy) > 12) homeDrag.moved = true;
  if (homeDrag.paint !== undefined || homeDrag.bow !== undefined) {
    homeDrag.gx = px;
    homeDrag.gy = py;
    return;
  }
  var it = homeDrag.item, def = homeItemDef(it.id), room = homeRoom(), s = homeItemSize();
  var x = px - homeDrag.dx, y = py - homeDrag.dy;
  if (x >= homeShopBox().x - s * 0.3) {
    // Kaupan päällä raahattava seuraa sormea vapaasti (haamu: ei ostoa; oma: varastoon)
    it.fx = x / viewW;
    it.fy = y / viewH;
    return;
  }
  x = Math.min(Math.max(x, room.x0 + s * 0.5), room.x1 - s * 0.5);
  if (def && def.kind === 'wall') y = Math.min(Math.max(y, room.wallTop + s * 0.5), room.floorY - s * 0.15);
  else y = Math.min(Math.max(y, room.floorY + s * 0.05), room.bottom);
  it.fx = x / viewW;
  it.fy = y / viewH;
}

function homeUp() {
  if (!homeDrag) return;
  var it = homeDrag.item;
  var moved = homeDrag.moved;
  var inShop = homeGhostInShop(), onDoor = homeDragOnDoor(), def = homeDrag.def;
  if (homeDrag.paint !== undefined) {
    var pi = homeDrag.paint, gy = homeDrag.gy;
    if (!inShop) homePaint(pi, gy);
    else playNote(330, 0, 0.1, 'triangle', 0.2);
    homeDrag = null;
    return;
  }
  if (homeDrag.bow !== undefined) {
    if (inShop || !homeBowTo(homeDrag.bow, homeDrag.gx, homeDrag.gy)) playNote(330, 0, 0.1, 'triangle', 0.2);
    homeDrag = null;
    return;
  }
  if (homeDrag.ghost) {
    homeDrag = null;
    if (inShop) {
      // Peruttu: tavara palaa kortille (varastoitu pysyy varastossa)
      playNote(330, 0, 0.1, 'triangle', 0.2);
      return;
    }
    homeBuy(def, it);
    return;
  }
  homeDrag = null;
  if (inShop) {
    homeStore(it);
    return;
  }
  if (onDoor && moved) {
    homeMoveToOtherRoom(it);
    return;
  }
  if (moved) {
    saveProgress();
    playNote(330, 0, 0.08, 'triangle', 0.2);
    spawnSparkles(it.fx * viewW, it.fy * viewH - homeItemSize() * 0.3, 6, '#ffffff');
    return;
  }
  homeItemTap(it);
}

function homeSpawnNotes(x, y, n) {
  var i;
  for (i = 0; i < n; i++) homeNotes.push({ x: x + (Math.random() - 0.5) * viewH * 0.05, y: y, vy: -viewH * (0.12 + Math.random() * 0.08), age: 0, life: 1.4 + i * 0.15, c: i % 3 });
}

function homeItemTap(it) {
  var i, s = homeItemSize(), x = it.fx * viewW, y = it.fy * viewH;
  it.phase = 1;
  if (it.id === 'lamp' || it.id === 'lights') {
    it.on = !it.on;
    playNote(it.on ? 880 : 440, 0, 0.1, 'sine', 0.25);
  } else if (it.id === 'musicbox') {
    var mel = [523, 659, 784, 659, 880, 784, 1047];
    for (i = 0; i < mel.length; i++) playNote(mel[i], i * 0.18, 0.22, 'sine', 0.28);
    homeSpawnNotes(x, y - s * 0.6, 7);
  } else if (it.id === 'piano') {
    var scale = [523, 587, 659, 784, 880, 1047], tune = [];
    for (i = 0; i < 6; i++) tune.push(scale[randInt(scale.length)]);
    tune.push(1047);
    for (i = 0; i < tune.length; i++) playNote(tune[i], i * 0.16, 0.25, 'triangle', 0.3);
    homeSpawnNotes(x, y - s * 0.9, 7);
    it.keysT = 1.2;
  } else if (it.id === 'clock') {
    for (i = 0; i < 3; i++) { playNote(1047, i * 0.35, 0.3, 'sine', 0.25); playNote(784, i * 0.35 + 0.05, 0.3, 'sine', 0.15); }
    it.swingT = 1.2;
  } else if (it.id === 'ball') {
    it.roll = (it.roll || 0) + (Math.random() < 0.5 ? -1 : 1) * viewW * 0.18;
    playNote(392, 0, 0.1, 'triangle', 0.25);
  } else if (it.id === 'rockinghorse') {
    it.rockT = 2.4;
    playNote(440, 0, 0.1, 'triangle', 0.2);
    playNote(392, 0.3, 0.1, 'triangle', 0.2);
  } else if (it.id === 'chest') {
    it.on = !it.on;
    playNote(it.on ? 660 : 330, 0, 0.15, 'triangle', 0.3);
    if (it.on) { playNote(1047, 0.15, 0.3, 'sine', 0.3); spawnSparkles(x, y - s * 0.5, 16, '#ffd24f'); }
  } else if (it.id === 'cake') {
    it.on = !it.on;
    playNote(it.on ? 784 : 262, 0, 0.15, 'sine', 0.25);
    if (!it.on) spawnSparkles(x, y - s * 0.7, 8, '#c9c9c9');
  } else if (it.id === 'aquarium') {
    for (i = 0; i < homeFish.length; i++) homeFish[i].dart = 1;
    playNote(880, 0, 0.08, 'sine', 0.2);
    playNote(1175, 0.06, 0.1, 'sine', 0.2);
  } else if (it.id === 'teaset') {
    it.steamT = 2.0;
    playNote(660, 0, 0.12, 'sine', 0.2);
    playNote(560, 0.15, 0.2, 'sine', 0.2);
  } else if (it.id === 'teddy') {
    playNote(900, 0, 0.1, 'square', 0.08);
    playNote(1100, 0.1, 0.12, 'square', 0.08);
  } else if (it.id === 'trampoline') {
    it.bounceT = 1;
    playNote(330, 0, 0.1, 'sine', 0.25);
    playNote(660, 0.1, 0.2, 'sine', 0.25);
  } else if (it.id === 'vase') {
    it.spinT = 1.5;
    playNote(988, 0, 0.1, 'sine', 0.2);
  } else {
    playNote(660, 0, 0.08, 'triangle', 0.2);
  }
  spawnSparkles(x, y - s * 0.5, 6, '#ffe27a');
}

// ---------- Päivitys ----------
function updateHome(dt) {
  var i, it, b, room = homeRoom();
  globalT += dt;
  if (homeShake.t > 0) homeShake.t -= dt;
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (it.phase > 0) it.phase = Math.max(0, it.phase - dt * 3);
    if (it.keysT > 0) it.keysT -= dt;
    if (it.swingT > 0) it.swingT -= dt;
    if (it.rockT > 0) it.rockT -= dt;
    if (it.steamT > 0) it.steamT -= dt;
    if (it.spinT > 0) it.spinT -= dt;
    if (it.bounceT > 0) it.bounceT = Math.max(0, it.bounceT - dt * 2);
    if (it.roll) {
      var nx = it.fx * viewW + it.roll * dt;
      nx = Math.min(Math.max(nx, room.x0 + homeItemSize() * 0.5), room.x1 - homeItemSize() * 0.5);
      it.fx = nx / viewW;
      it.rot = (it.rot || 0) + it.roll * dt / (homeItemSize() * 0.3);
      it.roll *= Math.max(0, 1 - dt * 1.8);
      if (Math.abs(it.roll) < 4) { it.roll = 0; saveProgress(); }
    }
  }
  for (i = homeNotes.length - 1; i >= 0; i--) {
    homeNotes[i].age += dt;
    homeNotes[i].y += homeNotes[i].vy * dt;
    homeNotes[i].x += Math.sin(homeNotes[i].age * 5 + i) * viewH * 0.02 * dt;
    if (homeNotes[i].age > homeNotes[i].life) homeNotes.splice(i, 1);
  }
  // Akvaarion kalat uivat edestakaisin (suhteellisina koordinaatteina -0.35..0.35)
  for (i = 0; i < homeFish.length; i++) {
    var f = homeFish[i];
    if (f.dart > 0) f.dart -= dt;
    f.fx += f.dir * f.sp * (f.dart > 0 ? 3 : 1) * dt;
    if (f.fx > 0.32) { f.fx = 0.32; f.dir = -1; }
    if (f.fx < -0.32) { f.fx = -0.32; f.dir = 1; }
    f.fy = Math.sin(globalT * (1 + i * 0.3) + i) * 0.12;
  }

  // Puput: peti nukuttaa, porkkanat syöttävät, pallo houkuttaa leikkiin; nalle,
  // kakku ja trampoliini toimivat varavaihtoehtoina. Muuten vaellus.
  var bed = homeHasHere('bed'), carrots = homeHasHere('carrots'), ball = homeHasHere('ball');
  var teddy = homeHasHere('teddy'), cake = homeHasHere('cake'), tramp = homeHasHere('trampoline');
  for (i = 0; i < homeBunnies.length; i++) {
    b = homeBunnies[i];
    b.earT += dt * (b.state === 'eat' ? 12 : 3);
    b.timer -= dt;
    var want = 'wander', target = null;
    if (i === 0 && bed) { want = 'sleep'; target = { fx: bed.fx, fy: bed.fy - 0.005 }; }
    else if (i === 0 && teddy) { want = 'hug'; target = { fx: teddy.fx + 0.035, fy: teddy.fy }; }
    else if (i === 1 && carrots) { want = 'eat'; target = { fx: carrots.fx + 0.045, fy: carrots.fy }; }
    else if (i === 1 && cake) { want = 'eat'; target = { fx: cake.fx + 0.045, fy: cake.fy }; }
    else if (i === 2 && ball) { want = 'play'; target = { fx: ball.fx + (b.side || -1) * 0.05, fy: ball.fy }; }
    else if (i === 2 && tramp) { want = 'bounce'; target = { fx: tramp.fx, fy: tramp.fy - 0.01 }; }
    if (want !== 'wander') {
      b.tx = target.fx; b.ty = target.fy;
    } else if (b.timer <= 0) {
      b.timer = 2 + Math.random() * 3;
      b.tx = (room.x0 + homeItemSize() * 0.5 + Math.random() * (room.x1 - room.x0 - homeItemSize())) / viewW;
      b.ty = (room.floorY + viewH * 0.05 + Math.random() * (room.bottom - room.floorY - viewH * 0.08)) / viewH;
    }
    var dx = (b.tx - b.fx) * viewW, dy = (b.ty - b.fy) * viewH, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      var sp = viewH * 0.16 * dt;
      if (sp > dist) sp = dist;
      b.fx += (dx / dist) * sp / viewW;
      b.fy += (dy / dist) * sp / viewH;
      b.moving = true;
      b.state = 'wander';
      b.hop = Math.abs(Math.sin(globalT * 9 + i));
    } else {
      b.moving = false;
      b.state = want;
      if (want === 'bounce') {
        b.hop = Math.abs(Math.sin(globalT * 5)) * 2.4;
        if (tramp && Math.sin(globalT * 5) > 0.97) tramp.bounceT = 1;
      } else {
        b.hop = Math.max(0, b.hop - dt * 4);
      }
      if (want === 'play' && b.timer <= 0) {
        b.timer = 1.2 + Math.random();
        b.side = -(b.side || -1);
        ball.roll = (ball.roll || 0) + (b.side < 0 ? 1 : -1) * viewW * 0.08;
        b.hop = 1;
      }
    }
  }
  updateParticles(dt);
}

// ---------- Piirto ----------
function drawHome() {
  var i, it;
  if (!viewW || !viewH) return;
  renderHomeBg();
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.drawImage(homeBgCanvas, 0, 0, homeBgCanvas.width, homeBgCanvas.height, 0, 0, viewW, viewH);

  // Seinätavarat, sitten lattiatavarat ja puput y-järjestyksessä (vain tämä huone)
  var order = [];
  for (i = 0; i < homeItems.length; i++) {
    it = homeItems[i];
    if (homeItemRoom(it) !== homeRoomIdx || !homeItemDef(it.id)) continue;
    if (homeItemDef(it.id).kind === 'wall') drawHomeItem(ctx, it, it.fx * viewW, it.fy * viewH, homeItemSize());
    else order.push({ y: it.fy * viewH, item: it });
  }
  for (i = 0; i < homeBunnies.length; i++) order.push({ y: homeBunnies[i].fy * viewH, bunny: homeBunnies[i] });
  order.sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < order.length; i++) {
    if (order[i].item) drawHomeItem(ctx, order[i].item, order[i].item.fx * viewW, order[i].item.fy * viewH, homeItemSize());
    else drawHomeBunny(ctx, order[i].bunny);
  }
  if (homeDrag && !homeDrag.ghost) {
    var r = homeItemRect(homeDrag.item);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = Math.max(2, viewH * 0.005);
    roundRect(ctx, r.x, r.y, r.w, r.h, viewH * 0.02);
    ctx.stroke();
  }
  // Oma tavara kaupan päällä: piirretään kaupan päälle haaleana laatikon kanssa (varastoon)
  var toShop = homeDrag && homeDrag.item && !homeDrag.ghost && homeGhostInShop();
  // Oven hehku (voimakkaampi, kun tavaraa raahataan: sen voi viedä ovesta) ja
  // vihje, kunnes toisessa huoneessa on jotain
  var dr = homeDoorRect(), otherHas = false;
  for (i = 0; i < homeItems.length; i++) if (homeItemRoom(homeItems[i]) === (homeRoomIdx === 0 ? 1 : 0)) otherHas = true;
  var dragging = !!(homeDrag && homeDrag.item && !homeDrag.ghost);
  var dg = ctx.createRadialGradient(dr.x + dr.w / 2, dr.y + dr.h * 0.5, dr.w * 0.2, dr.x + dr.w / 2, dr.y + dr.h * 0.5, dr.w * 1.3);
  dg.addColorStop(0, 'rgba(255,240,180,' + ((dragging ? (homeDragOnDoor() ? 0.8 : 0.5) : 0.25) + Math.sin(globalT * 3) * 0.1) + ')');
  dg.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(dr.x + dr.w / 2, dr.y + dr.h * 0.5, dr.w * 1.3, 0, Math.PI * 2); ctx.fill();
  if (!otherHas && homeRoomIdx === 0) drawHintArrow(ctx, dr.x + dr.w / 2, dr.y - viewH * 0.06);
  for (i = 0; i < homeNotes.length; i++) drawNote(ctx, homeNotes[i]);
  drawParticlesLayerAbs(ctx);
  drawHomeShop(ctx);
  if (homeDrag && homeDrag.ghost) drawHomeGhost(ctx);
  if (toShop) {
    var ti = homeDrag.item, ts = homeItemSize(), tx = ti.fx * viewW, ty = ti.fy * viewH;
    ctx.globalAlpha = 0.6;
    drawHomeItem(ctx, ti, tx, ty, ts * 0.8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#c98b4a';
    roundRect(ctx, tx - ts * 0.35, ty + ts * 0.1, ts * 0.7, ts * 0.25, ts * 0.05);
    ctx.fill();
    ctx.fillStyle = '#a9743f';
    ctx.fillRect(tx - ts * 0.4, ty + ts * 0.08, ts * 0.8, ts * 0.06);
  }
}

// Kaupasta raahattava: tavara (haalea kaupan päällä, kirkas huoneen puolella,
// hinta tähtinä alla), maalipurkki tai rusetti
function drawHomeGhost(c) {
  var s = homeItemSize(), k, inShop = homeGhostInShop();
  if (homeDrag.paint !== undefined) {
    var pc = HOME_PAINTS[homeDrag.paint].pot;
    c.globalAlpha = inShop ? 0.6 : 1;
    drawPaintPot(c, homeDrag.gx, homeDrag.gy - s * 0.2, s * 0.32, pc);
    if (!inShop) {
      // Maalitippa näyttää kohteen: seinä vai lattia
      c.fillStyle = pc;
      c.beginPath(); c.arc(homeDrag.gx, homeDrag.gy + s * 0.25 + Math.sin(globalT * 6) * s * 0.03, s * 0.09, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    return;
  }
  if (homeDrag.bow !== undefined) {
    c.globalAlpha = inShop ? 0.6 : 1;
    drawBow(c, homeDrag.gx, homeDrag.gy - s * 0.1, s * 0.3, HOME_BOWS[homeDrag.bow]);
    c.globalAlpha = 1;
    return;
  }
  var it = homeDrag.item, def = homeDrag.def, x = it.fx * viewW, y = it.fy * viewH;
  c.globalAlpha = inShop ? 0.55 : 0.92;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.arc(x, y - (def.kind === 'wall' ? 0 : s * 0.45), s * 0.85, 0, Math.PI * 2); c.fill();
  drawHomeItem(c, it, x, y, s);
  c.globalAlpha = 1;
  if (homeDrag.existing) return;
  var ps = viewH * 0.016;
  for (k = 0; k < def.price; k++) drawStar(c, x + (k - (def.price - 1) / 2) * ps * 2.3, y + s * 0.2, ps, 0, 0);
}

function drawPaintPot(c, x, y, s, color) {
  c.fillStyle = '#c9c4d8';
  c.beginPath(); c.moveTo(x - s * 0.9, y - s * 0.5); c.lineTo(x + s * 0.9, y - s * 0.5); c.lineTo(x + s * 0.75, y + s * 0.9); c.lineTo(x - s * 0.75, y + s * 0.9); c.closePath(); c.fill();
  c.fillStyle = color;
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y - s * 0.5, s * 0.9, s * 0.3, 0, 0, Math.PI * 2);
  else c.arc(x, y - s * 0.5, s * 0.6, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.moveTo(x + s * 0.3, y - s * 0.4); c.quadraticCurveTo(x + s * 0.55, y + s * 0.2, x + s * 0.4, y + s * 0.4); c.quadraticCurveTo(x + s * 0.2, y + s * 0.2, x + s * 0.3, y - s * 0.4); c.fill();
  c.strokeStyle = '#8a8298';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.beginPath(); c.arc(x, y - s * 0.6, s * 0.7, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  // Pensseli
  c.strokeStyle = '#a9743f';
  c.lineWidth = Math.max(2, s * 0.14);
  c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.4); c.lineTo(x - s * 1.0, y - s * 1.4); c.stroke();
  c.fillStyle = color;
  c.beginPath(); c.arc(x - s * 0.5, y - s * 0.4, s * 0.2, 0, Math.PI * 2); c.fill();
}

function drawBow(c, x, y, s, color) {
  c.fillStyle = color;
  c.beginPath();
  if (c.ellipse) { c.ellipse(x - s * 0.55, y, s * 0.55, s * 0.36, -0.25, 0, Math.PI * 2); c.ellipse(x + s * 0.55, y, s * 0.55, s * 0.36, 0.25, 0, Math.PI * 2); }
  else { c.arc(x - s * 0.5, y, s * 0.4, 0, Math.PI * 2); c.arc(x + s * 0.5, y, s * 0.4, 0, Math.PI * 2); }
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.beginPath(); c.arc(x - s * 0.6, y - s * 0.1, s * 0.15, 0, Math.PI * 2); c.arc(x + s * 0.6, y - s * 0.1, s * 0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = color;
  c.beginPath(); c.arc(x, y, s * 0.22, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath(); c.arc(x, y, s * 0.22, 0, Math.PI * 2); c.fill();
}

function drawParticlesLayerAbs(c) {
  var i;
  for (i = 0; i < particles.length; i++) {
    c.globalAlpha = 1 - particles[i].age / particles[i].life;
    c.fillStyle = particles[i].color;
    c.fillRect(particles[i].x - 2, particles[i].y - 2, particles[i].size, particles[i].size);
  }
  c.globalAlpha = 1;
}

function drawNote(c, n) {
  var s = viewH * 0.02, cols = ['#ff7bac', '#8a4dff', '#ffb84f'];
  c.globalAlpha = Math.max(0, 1 - n.age / n.life);
  c.fillStyle = cols[n.c];
  c.beginPath(); c.arc(n.x, n.y, s * 0.5, 0, Math.PI * 2); c.fill();
  c.fillRect(n.x + s * 0.35, n.y - s * 1.6, s * 0.18, s * 1.6);
  c.fillRect(n.x + s * 0.35, n.y - s * 1.6, s * 0.7, s * 0.2);
  c.globalAlpha = 1;
}

function drawStarBalance(c, x, y) {
  var s = viewH * 0.03;
  var txt = String(starCoins);
  c.font = 'bold ' + Math.round(s * 1.6) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  var tw = c.measureText(txt).width;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  roundRect(c, x, y - s * 1.2, s * 2.6 + tw + s * 0.8, s * 2.4, s * 1.2);
  c.fill();
  drawStar(c, x + s * 1.3, y, s * 0.85, 0, 0.6);
  c.fillStyle = '#7a3cb8';
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(txt, x + s * 2.6, y + s * 0.05);
  c.textBaseline = 'alphabetic';
}

function drawShopArrow(c, a, dir) {
  c.fillStyle = '#c9a0ff';
  c.beginPath(); c.arc(a.x, a.y, a.r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(a.x + dir * a.r * 0.45, a.y);
  c.lineTo(a.x - dir * a.r * 0.25, a.y - a.r * 0.45);
  c.lineTo(a.x - dir * a.r * 0.25, a.y + a.r * 0.45);
  c.closePath();
  c.fill();
}

function drawHomeShop(c) {
  var s = homeShopBox(), cells = homeShopCells(), i, k;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(c, s.x + viewH * 0.006, s.y + viewH * 0.01, s.w, s.h, viewH * 0.03);
  c.fill();
  c.fillStyle = '#fff6e3';
  roundRect(c, s.x, s.y, s.w, s.h, viewH * 0.03);
  c.fill();
  c.strokeStyle = '#e8c9a0';
  c.lineWidth = Math.max(2, viewH * 0.006);
  roundRect(c, s.x, s.y, s.w, s.h, viewH * 0.03);
  c.stroke();
  drawStarBalance(c, s.x + viewH * 0.02, s.y + s.head * 0.5);
  for (i = 0; i < cells.length; i++) {
    var cell = cells[i], def = cell.def, isz = Math.min(cell.w, cell.h) * 0.62;
    if (!def) {
      // Maalipurkki tai rusetti: aina saatavilla, ilmainen
      var liftP = !!(homeDrag && ((cell.paint !== undefined && homeDrag.paint === cell.paint) || (cell.bow !== undefined && homeDrag.bow === cell.bow)));
      c.fillStyle = '#ffffff';
      roundRect(c, cell.x, cell.y, cell.w, cell.h, viewH * 0.015);
      c.fill();
      c.globalAlpha = liftP ? 0.3 : 1;
      if (cell.paint !== undefined) drawPaintPot(c, cell.x + cell.w / 2, cell.y + cell.h * 0.55, isz * 0.5, HOME_PAINTS[cell.paint].pot);
      else drawBow(c, cell.x + cell.w / 2, cell.y + cell.h * 0.5, isz * 0.45, HOME_BOWS[cell.bow]);
      c.globalAlpha = 1;
      continue;
    }
    var stored = !!homeStored(def.id), owned = !!homeHas(def.id) && !stored, afford = starCoins >= def.price;
    var lifting = !!(homeDrag && homeDrag.ghost && homeDrag.def === def);
    var shake = homeShake.id === def.id && homeShake.t > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
    c.fillStyle = owned ? 'rgba(200,190,220,0.35)' : (stored ? '#fff0f7' : (afford ? '#ffffff' : 'rgba(255,255,255,0.55)'));
    roundRect(c, cell.x + shake, cell.y, cell.w, cell.h, viewH * 0.015);
    c.fill();
    if (lifting) {
      c.setLineDash([viewH * 0.01, viewH * 0.008]);
      c.strokeStyle = '#c9a0ff';
      c.lineWidth = Math.max(2, viewH * 0.004);
      c.stroke();
      c.setLineDash([]);
    }
    if (stored) {
      // Varastolaatikko kortin alareunassa
      c.fillStyle = '#c98b4a';
      roundRect(c, cell.x + cell.w * 0.2, cell.y + cell.h * 0.74, cell.w * 0.6, cell.h * 0.2, viewH * 0.006);
      c.fill();
      c.fillStyle = '#a9743f';
      c.fillRect(cell.x + cell.w * 0.17, cell.y + cell.h * 0.72, cell.w * 0.66, cell.h * 0.05);
    }
    c.globalAlpha = owned ? 0.35 : (lifting ? 0.25 : ((afford || stored) ? 1 : 0.5));
    var fake = { id: def.id, fx: 0, fy: 0, on: true, phase: 0 };
    drawHomeItem(c, fake, cell.x + cell.w / 2 + shake, cell.y + cell.h * (def.kind === 'wall' ? 0.42 : (stored ? 0.62 : 0.68)), isz * (stored ? 0.85 : 1));
    c.globalAlpha = 1;
    if (stored) continue;
    if (owned) {
      c.strokeStyle = '#4fb356';
      c.lineWidth = Math.max(2, viewH * 0.008);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cell.x + cell.w * 0.35, cell.y + cell.h * 0.5);
      c.lineTo(cell.x + cell.w * 0.47, cell.y + cell.h * 0.65);
      c.lineTo(cell.x + cell.w * 0.68, cell.y + cell.h * 0.35);
      c.stroke();
      c.lineCap = 'butt';
    } else {
      var ps = Math.min(cell.w / (def.price * 2.4), cell.h * 0.09);
      for (k = 0; k < def.price; k++) {
        drawStar(c, cell.x + cell.w / 2 + (k - (def.price - 1) / 2) * ps * 2.3 + shake, cell.y + cell.h * 0.88, ps, 0, 0);
      }
    }
  }
  // Sivunuolet ja sivupisteet
  var ar = homeShopArrows(), n = homeShopPages(), fy = s.y + s.h - s.foot * 0.5;
  if (ar.prev) drawShopArrow(c, ar.prev, -1);
  if (ar.next) drawShopArrow(c, ar.next, 1);
  for (i = 0; i < n; i++) {
    c.fillStyle = i === homeShopPage ? '#8a4dff' : 'rgba(138,77,255,0.3)';
    c.beginPath(); c.arc(s.x + s.w / 2 + (i - (n - 1) / 2) * s.foot * 0.3, fy, s.foot * 0.08, 0, Math.PI * 2); c.fill();
  }
}

function drawHomeBunny(c, b) {
  var x = b.fx * viewW, y = b.fy * viewH, s = viewH * 0.042;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, s * 0.8, s * 0.22, 0, 0, Math.PI * 2);
  else c.arc(x, y, s * 0.5, 0, Math.PI * 2);
  c.fill();
  drawBunny(c, x, y, s, b.hop * viewH * 0.02, b.earT, false);
  if (b.bow >= 0) drawBow(c, x, y - b.hop * viewH * 0.02 - s * 1.45, s * 0.3, HOME_BOWS[b.bow]);
  if (b.state === 'sleep') {
    c.fillStyle = 'rgba(120,80,160,0.8)';
    c.font = Math.round(s * 0.7) + 'px sans-serif';
    c.textAlign = 'left';
    c.fillText('z', x + s * 0.7, y - s * 1.7 - Math.sin(globalT * 2) * s * 0.1);
    c.fillText('z', x + s * 1.1, y - s * 2.2 - Math.sin(globalT * 2 + 1) * s * 0.1);
  } else if (b.state === 'eat') {
    c.fillStyle = '#ff8a3d';
    c.fillRect(x - s * 0.1, y - s * 1.05, s * 0.2 + Math.sin(globalT * 12) * s * 0.05, s * 0.12);
  } else if (b.state === 'hug') {
    c.fillStyle = '#ff5f7e';
    drawHeartShape(c, x + s * 0.6, y - s * 2.1 - Math.sin(globalT * 3) * s * 0.1, s * 0.22, true);
  }
}

// Huonekalut: lattiatavaroilla (x, y) on jalkojen keskikohta, seinätavaroilla keskipiste
function drawHomeItem(c, it, x, y, s) {
  var i, k, bump = it.phase ? Math.sin(it.phase * Math.PI) * s * 0.06 : 0;
  y -= bump;
  if (it.id === 'rug') {
    var rcols = ['#ff7bac', '#c9a0ff', '#ffd24f'];
    for (i = 0; i < 3; i++) {
      c.fillStyle = rcols[i];
      c.beginPath();
      if (c.ellipse) c.ellipse(x, y - s * 0.08, s * (0.8 - i * 0.22), s * (0.3 - i * 0.08), 0, 0, Math.PI * 2);
      else c.arc(x, y - s * 0.08, s * (0.6 - i * 0.18), 0, Math.PI * 2);
      c.fill();
    }
  } else if (it.id === 'lamp') {
    c.fillStyle = '#8a5cb8';
    c.beginPath(); c.arc(x, y - s * 0.03, s * 0.18, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.03, y - s * 0.9, s * 0.06, s * 0.9);
    if (it.on) {
      var lg = c.createRadialGradient(x, y - s * 0.95, s * 0.1, x, y - s * 0.95, s * 0.9);
      lg.addColorStop(0, 'rgba(255,240,170,0.55)');
      lg.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = lg;
      c.beginPath(); c.arc(x, y - s * 0.95, s * 0.9, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = it.on ? '#ffe9a0' : '#e8d5f2';
    c.beginPath(); c.moveTo(x - s * 0.32, y - s * 0.72); c.lineTo(x + s * 0.32, y - s * 0.72); c.lineTo(x + s * 0.18, y - s * 1.05); c.lineTo(x - s * 0.18, y - s * 1.05); c.closePath(); c.fill();
  } else if (it.id === 'plant') {
    c.fillStyle = '#c96a3a';
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.4); c.lineTo(x + s * 0.3, y - s * 0.4); c.lineTo(x + s * 0.22, y); c.lineTo(x - s * 0.22, y); c.closePath(); c.fill();
    c.fillStyle = '#4fb356';
    for (i = -2; i <= 2; i++) {
      c.beginPath();
      if (c.ellipse) c.ellipse(x + i * s * 0.14, y - s * 0.62 - Math.abs(i) * -s * 0.05, s * 0.12, s * 0.3, i * 0.35, 0, Math.PI * 2);
      else c.arc(x + i * s * 0.14, y - s * 0.65, s * 0.15, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.arc(x, y - s * 0.9, s * 0.08, 0, Math.PI * 2); c.fill();
  } else if (it.id === 'ball') {
    c.save();
    c.translate(x, y - s * 0.3);
    c.rotate(it.rot || 0);
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.arc(0, 0, s * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5fa8ff';
    c.beginPath(); c.arc(0, 0, s * 0.3, -0.5, 0.5); c.lineTo(0, 0); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, 0, s * 0.3, Math.PI - 0.5, Math.PI + 0.5); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffe94f';
    c.beginPath(); c.arc(0, 0, s * 0.12, 0, Math.PI * 2); c.fill();
    c.restore();
  } else if (it.id === 'painting') {
    c.fillStyle = '#a9743f';
    roundRect(c, x - s * 0.5, y - s * 0.4, s, s * 0.8, s * 0.05);
    c.fill();
    c.fillStyle = '#bfe6ff';
    c.fillRect(x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.64);
    var pcols = ['#ff5f7e', '#ffe94f', '#5fa8ff'];
    c.lineWidth = s * 0.04;
    for (i = 0; i < 3; i++) { c.strokeStyle = pcols[i]; c.beginPath(); c.arc(x, y + s * 0.25, s * (0.32 - i * 0.05), Math.PI, 0); c.stroke(); }
    drawCastle(c, x, y + s * 0.3, s * 0.35);
  } else if (it.id === 'bed') {
    c.fillStyle = '#c98b4a';
    roundRect(c, x - s * 0.5, y - s * 0.36, s, s * 0.36, s * 0.12);
    c.fill();
    c.fillStyle = '#ffd6ec';
    roundRect(c, x - s * 0.42, y - s * 0.4, s * 0.84, s * 0.22, s * 0.1);
    c.fill();
    c.fillStyle = '#ffffff';
    roundRect(c, x - s * 0.36, y - s * 0.46, s * 0.3, s * 0.14, s * 0.06);
    c.fill();
  } else if (it.id === 'carrots') {
    c.fillStyle = '#7fd4ff';
    c.beginPath(); c.moveTo(x - s * 0.36, y - s * 0.3); c.lineTo(x + s * 0.36, y - s * 0.3); c.lineTo(x + s * 0.26, y); c.lineTo(x - s * 0.26, y); c.closePath(); c.fill();
    for (i = -1; i <= 1; i++) {
      c.fillStyle = '#ff8a3d';
      c.beginPath(); c.moveTo(x + i * s * 0.18 - s * 0.07, y - s * 0.3); c.lineTo(x + i * s * 0.18 + s * 0.07, y - s * 0.3); c.lineTo(x + i * s * 0.18, y - s * 0.62); c.closePath(); c.fill();
      c.fillStyle = '#4fb356';
      c.fillRect(x + i * s * 0.18 - s * 0.03, y - s * 0.72, s * 0.06, s * 0.12);
    }
  } else if (it.id === 'curtains') {
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.6, y - s * 0.45, s * 1.2, s * 0.05);
    c.fillStyle = '#ff7bac';
    for (i = -1; i <= 1; i += 2) {
      c.beginPath();
      c.moveTo(x + i * s * 0.55, y - s * 0.42);
      c.quadraticCurveTo(x + i * s * 0.2, y, x + i * s * 0.45, y + s * 0.42);
      c.lineTo(x + i * s * 0.55, y + s * 0.42);
      c.closePath(); c.fill();
    }
    c.fillStyle = '#ffe27a';
    c.beginPath(); c.arc(x - s * 0.32, y + s * 0.02, s * 0.06, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + s * 0.32, y + s * 0.02, s * 0.06, 0, Math.PI * 2); c.fill();
  } else if (it.id === 'mirror') {
    c.fillStyle = '#d9b34f';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * 0.34, s * 0.44, 0, 0, Math.PI * 2);
    else c.arc(x, y, s * 0.38, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#dff3ff';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, s * 0.26, s * 0.36, 0, 0, Math.PI * 2);
    else c.arc(x, y, s * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(x - s * 0.1, y - s * 0.15, s * 0.06, 0, Math.PI * 2); c.fill();
    drawStar(c, x + s * 0.1, y + s * 0.1, s * 0.05, globalT, 0.4);
  } else if (it.id === 'table') {
    c.fillStyle = '#a9743f';
    c.fillRect(x - s * 0.36, y - s * 0.5, s * 0.06, s * 0.5);
    c.fillRect(x + s * 0.3, y - s * 0.5, s * 0.06, s * 0.5);
    c.fillStyle = '#c98b4a';
    roundRect(c, x - s * 0.5, y - s * 0.56, s, s * 0.1, s * 0.04);
    c.fill();
    c.fillStyle = '#ffd6ec';
    roundRect(c, x - s * 0.2, y - s * 0.82, s * 0.4, s * 0.26, s * 0.06);
    c.fill();
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.arc(x, y - s * 0.86, s * 0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.fillRect(x - s * 0.02, y - s * 0.98, s * 0.04, s * 0.1);
  } else if (it.id === 'shelf') {
    c.fillStyle = '#8a5a30';
    c.fillRect(x - s * 0.4, y - s * 1.0, s * 0.8, s * 1.0);
    var bcols = ['#ff5f7e', '#ffb84f', '#6fd66f', '#5fa8ff', '#b678ff'];
    for (k = 0; k < 3; k++) {
      c.fillStyle = '#c98b4a';
      c.fillRect(x - s * 0.36, y - s * 0.3 - k * s * 0.3, s * 0.72, s * 0.04);
      for (i = 0; i < 5; i++) {
        c.fillStyle = bcols[(i + k) % 5];
        c.fillRect(x - s * 0.33 + i * s * 0.13, y - s * 0.3 - k * s * 0.3 - s * 0.2 + (i % 2) * s * 0.03, s * 0.1, s * 0.2 - (i % 2) * s * 0.03);
      }
    }
  } else if (it.id === 'musicbox') {
    c.fillStyle = '#c9a0ff';
    roundRect(c, x - s * 0.32, y - s * 0.34, s * 0.64, s * 0.34, s * 0.06);
    c.fill();
    c.fillStyle = '#8a4dff';
    roundRect(c, x - s * 0.34, y - s * 0.42, s * 0.68, s * 0.1, s * 0.04);
    c.fill();
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.arc(x, y - s * 0.17, s * 0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.arc(x, y - s * 0.62, s * 0.1, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.02, y - s * 0.55, s * 0.04, s * 0.15);
  } else if (it.id === 'teddy') {
    c.fillStyle = '#c98b4a';
    c.beginPath(); c.arc(x - s * 0.28, y - s * 0.12, s * 0.12, 0, Math.PI * 2); c.arc(x + s * 0.28, y - s * 0.12, s * 0.12, 0, Math.PI * 2); c.fill();
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y - s * 0.3, s * 0.26, s * 0.3, 0, 0, Math.PI * 2);
    else c.arc(x, y - s * 0.3, s * 0.28, 0, Math.PI * 2);
    c.fill();
    c.beginPath(); c.arc(x - s * 0.2, y - s * 0.75, s * 0.1, 0, Math.PI * 2); c.arc(x + s * 0.2, y - s * 0.75, s * 0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x, y - s * 0.66, s * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8b880';
    c.beginPath(); c.arc(x, y - s * 0.34, s * 0.16, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x, y - s * 0.6, s * 0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#333';
    c.beginPath(); c.arc(x - s * 0.07, y - s * 0.7, s * 0.025, 0, Math.PI * 2); c.arc(x + s * 0.07, y - s * 0.7, s * 0.025, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x, y - s * 0.62, s * 0.025, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff5f7e';
    c.beginPath(); c.moveTo(x - s * 0.09, y - s * 0.5); c.lineTo(x + s * 0.09, y - s * 0.5); c.lineTo(x, y - s * 0.44); c.closePath(); c.fill();
  } else if (it.id === 'vase') {
    var spin = it.spinT > 0 ? it.spinT * 8 : 0;
    c.fillStyle = '#7fd4ff';
    c.beginPath(); c.moveTo(x - s * 0.14, y - s * 0.5); c.quadraticCurveTo(x - s * 0.3, y - s * 0.2, x - s * 0.18, y); c.lineTo(x + s * 0.18, y); c.quadraticCurveTo(x + s * 0.3, y - s * 0.2, x + s * 0.14, y - s * 0.5); c.closePath(); c.fill();
    c.strokeStyle = '#4fb356';
    c.lineWidth = Math.max(1.5, s * 0.035);
    var vcols = ['#ff7bac', '#ffd24f', '#c9a0ff'];
    for (i = -1; i <= 1; i++) {
      var a = i * 0.45 + Math.sin(spin + i) * 0.12;
      c.beginPath(); c.moveTo(x, y - s * 0.45); c.lineTo(x + Math.sin(a) * s * 0.35, y - s * 0.45 - Math.cos(a) * s * 0.35); c.stroke();
      drawFlower(c, x + Math.sin(a) * s * 0.35, y - s * 0.45 - Math.cos(a) * s * 0.35, s * 0.06, vcols[i + 1]);
    }
  } else if (it.id === 'clock') {
    var sw = it.swingT > 0 ? Math.sin(globalT * 14) * 0.3 : Math.sin(globalT * 3) * 0.25;
    c.fillStyle = '#8a5a30';
    roundRect(c, x - s * 0.24, y - s * 0.45, s * 0.48, s * 0.9, s * 0.08);
    c.fill();
    c.fillStyle = '#fff6d8';
    c.beginPath(); c.arc(x, y - s * 0.18, s * 0.18, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3a3346';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.moveTo(x, y - s * 0.18); c.lineTo(x, y - s * 0.32); c.moveTo(x, y - s * 0.18); c.lineTo(x + Math.cos(globalT * 0.5) * s * 0.1, y - s * 0.18 + Math.sin(globalT * 0.5) * s * 0.1); c.stroke();
    // Heiluri
    c.strokeStyle = '#ffd24f';
    c.lineWidth = Math.max(1.5, s * 0.025);
    c.beginPath(); c.moveTo(x, y + s * 0.02); c.lineTo(x + Math.sin(sw) * s * 0.28, y + s * 0.02 + Math.cos(sw) * s * 0.32); c.stroke();
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.arc(x + Math.sin(sw) * s * 0.28, y + s * 0.02 + Math.cos(sw) * s * 0.32, s * 0.06, 0, Math.PI * 2); c.fill();
  } else if (it.id === 'lights') {
    // Valosarja: naru ja lamput vilkkuvat
    var lcols = ['#ff5f7e', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];
    c.strokeStyle = '#5a4a3a';
    c.lineWidth = Math.max(1.5, s * 0.025);
    c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.2); c.quadraticCurveTo(x, y + s * 0.15, x + s * 0.6, y - s * 0.2); c.stroke();
    for (i = 0; i < 5; i++) {
      var t = (i + 0.5) / 5, lx = x - s * 0.6 + t * s * 1.2, ly = y - s * 0.2 + Math.sin(t * Math.PI) * s * 0.17;
      var on = it.on && Math.sin(globalT * 4 + i * 1.3) > -0.3;
      if (on) {
        var gg = c.createRadialGradient(lx, ly + s * 0.08, s * 0.02, lx, ly + s * 0.08, s * 0.18);
        gg.addColorStop(0, lcols[i]);
        gg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gg;
        c.globalAlpha = 0.6;
        c.beginPath(); c.arc(lx, ly + s * 0.08, s * 0.18, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      }
      c.fillStyle = on ? lcols[i] : '#8a8298';
      c.beginPath(); c.arc(lx, ly + s * 0.08, s * 0.055, 0, Math.PI * 2); c.fill();
    }
  } else if (it.id === 'cake') {
    c.fillStyle = '#ffffff';
    roundRect(c, x - s * 0.4, y - s * 0.08, s * 0.8, s * 0.08, s * 0.03);
    c.fill();
    c.fillStyle = '#ff9ec6';
    roundRect(c, x - s * 0.32, y - s * 0.34, s * 0.64, s * 0.28, s * 0.06);
    c.fill();
    c.fillStyle = '#ffd6ec';
    roundRect(c, x - s * 0.24, y - s * 0.52, s * 0.48, s * 0.2, s * 0.06);
    c.fill();
    c.fillStyle = '#ff5f7e';
    for (i = -1; i <= 1; i++) { c.beginPath(); c.arc(x + i * s * 0.16, y - s * 0.52, s * 0.045, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#7fd4ff';
    c.fillRect(x - s * 0.025, y - s * 0.7, s * 0.05, s * 0.18);
    if (it.on) {
      c.fillStyle = '#ffb347';
      c.beginPath();
      if (c.ellipse) c.ellipse(x, y - s * 0.76 + Math.sin(globalT * 12) * s * 0.01, s * 0.035, s * 0.06, 0, 0, Math.PI * 2);
      else c.arc(x, y - s * 0.76, s * 0.04, 0, Math.PI * 2);
      c.fill();
    }
  } else if (it.id === 'teaset') {
    c.fillStyle = '#a9743f';
    roundRect(c, x - s * 0.5, y - s * 0.34, s, s * 0.08, s * 0.03);
    c.fill();
    c.fillRect(x - s * 0.42, y - s * 0.26, s * 0.06, s * 0.26);
    c.fillRect(x + s * 0.36, y - s * 0.26, s * 0.06, s * 0.26);
    c.fillStyle = '#c9a0ff';
    c.beginPath(); c.arc(x - s * 0.12, y - s * 0.5, s * 0.16, 0, Math.PI * 2); c.fill();
    c.fillRect(x - s * 0.2, y - s * 0.7, s * 0.16, s * 0.08);
    c.strokeStyle = '#c9a0ff';
    c.lineWidth = Math.max(1.5, s * 0.04);
    c.beginPath(); c.moveTo(x + s * 0.02, y - s * 0.55); c.lineTo(x + s * 0.14, y - s * 0.62); c.stroke();
    c.fillStyle = '#ff7bac';
    roundRect(c, x + s * 0.2, y - s * 0.5, s * 0.16, s * 0.14, s * 0.04);
    c.fill();
    if (it.steamT > 0) {
      c.strokeStyle = 'rgba(255,255,255,' + Math.min(1, it.steamT) * 0.8 + ')';
      c.lineWidth = Math.max(1.5, s * 0.03);
      for (i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(x - s * 0.12 + i * s * 0.07, y - s * 0.72); c.quadraticCurveTo(x - s * 0.12 + i * s * 0.07 + Math.sin(globalT * 5 + i) * s * 0.06, y - s * 0.9, x - s * 0.12 + i * s * 0.07, y - s * 1.05); c.stroke();
      }
    }
  } else if (it.id === 'sofa') {
    c.fillStyle = '#8a4dff';
    roundRect(c, x - s * 0.55, y - s * 0.62, s * 1.1, s * 0.34, s * 0.1);
    c.fill();
    c.fillStyle = '#c9a0ff';
    roundRect(c, x - s * 0.5, y - s * 0.34, s, s * 0.26, s * 0.08);
    c.fill();
    c.fillStyle = '#8a4dff';
    roundRect(c, x - s * 0.6, y - s * 0.42, s * 0.14, s * 0.4, s * 0.06);
    c.fill();
    roundRect(c, x + s * 0.46, y - s * 0.42, s * 0.14, s * 0.4, s * 0.06);
    c.fill();
    c.fillStyle = '#ffd24f';
    roundRect(c, x - s * 0.36, y - s * 0.56, s * 0.28, s * 0.22, s * 0.05);
    c.fill();
    c.fillStyle = '#5a3a1e';
    c.fillRect(x - s * 0.45, y - s * 0.08, s * 0.08, s * 0.08);
    c.fillRect(x + s * 0.37, y - s * 0.08, s * 0.08, s * 0.08);
  } else if (it.id === 'rockinghorse') {
    var rk = it.rockT > 0 ? Math.sin(globalT * 6) * 0.22 * Math.min(1, it.rockT) : 0;
    c.save();
    c.translate(x, y - s * 0.05);
    c.rotate(rk);
    c.strokeStyle = '#a9743f';
    c.lineWidth = Math.max(2, s * 0.06);
    c.beginPath(); c.arc(0, -s * 0.5, s * 0.55, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    c.fillStyle = '#a9743f';
    c.fillRect(-s * 0.28, -s * 0.45, s * 0.08, s * 0.4);
    c.fillRect(s * 0.2, -s * 0.45, s * 0.08, s * 0.4);
    c.fillStyle = '#fff';
    c.beginPath();
    if (c.ellipse) c.ellipse(0, -s * 0.5, s * 0.36, s * 0.16, 0, 0, Math.PI * 2);
    else c.arc(0, -s * 0.5, s * 0.25, 0, Math.PI * 2);
    c.fill();
    c.beginPath(); c.moveTo(s * 0.22, -s * 0.58); c.lineTo(s * 0.34, -s * 0.9); c.lineTo(s * 0.48, -s * 0.85); c.lineTo(s * 0.4, -s * 0.55); c.closePath(); c.fill();
    c.fillStyle = '#ff7bac';
    roundRect(c, -s * 0.12, -s * 0.66, s * 0.24, s * 0.1, s * 0.03);
    c.fill();
    c.fillStyle = '#ffd24f';
    c.beginPath(); c.moveTo(s * 0.36, -s * 0.9); c.lineTo(s * 0.4, -s * 1.02); c.lineTo(s * 0.44, -s * 0.9); c.closePath(); c.fill();
    c.strokeStyle = '#ff7bac';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.moveTo(s * 0.3, -s * 0.85); c.lineTo(s * 0.2, -s * 0.7); c.stroke();
    c.fillStyle = '#333';
    c.beginPath(); c.arc(s * 0.4, -s * 0.82, s * 0.02, 0, Math.PI * 2); c.fill();
    c.restore();
  } else if (it.id === 'chest') {
    c.fillStyle = '#8a5a30';
    roundRect(c, x - s * 0.4, y - s * 0.34, s * 0.8, s * 0.34, s * 0.05);
    c.fill();
    c.fillStyle = '#ffd24f';
    c.fillRect(x - s * 0.4, y - s * 0.2, s * 0.8, s * 0.04);
    if (it.on) {
      var gcols = ['#ff5f7e', '#5fa8ff', '#6fd66f', '#ffe94f'];
      for (i = 0; i < 4; i++) drawGem(c, x - s * 0.24 + i * s * 0.16, y - s * 0.4 - (i % 2) * s * 0.06, s * 0.09, gcols[i]);
      c.fillStyle = '#5a3416';
      roundRect(c, x - s * 0.42, y - s * 0.8, s * 0.84, s * 0.22, s * 0.08);
      c.fill();
      drawStar(c, x + s * 0.3, y - s * 0.6, s * 0.07, globalT * 2, 0.7);
    } else {
      c.fillStyle = '#5a3416';
      roundRect(c, x - s * 0.42, y - s * 0.52, s * 0.84, s * 0.22, s * 0.08);
      c.fill();
      c.fillStyle = '#ffd24f';
      c.fillRect(x - s * 0.05, y - s * 0.36, s * 0.1, s * 0.12);
    }
  } else if (it.id === 'trampoline') {
    var dip = it.bounceT ? Math.sin(it.bounceT * Math.PI) * s * 0.06 : 0;
    c.fillStyle = '#5a4a6e';
    c.fillRect(x - s * 0.45, y - s * 0.3, s * 0.06, s * 0.3);
    c.fillRect(x + s * 0.39, y - s * 0.3, s * 0.06, s * 0.3);
    c.fillRect(x - s * 0.15, y - s * 0.3, s * 0.05, s * 0.3);
    c.fillRect(x + s * 0.1, y - s * 0.3, s * 0.05, s * 0.3);
    c.fillStyle = '#5fa8ff';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y - s * 0.32 + dip, s * 0.55, s * 0.1, 0, 0, Math.PI * 2);
    else c.arc(x, y - s * 0.32, s * 0.3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#3a3346';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.stroke();
    c.fillStyle = '#ffe94f';
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y - s * 0.32 + dip, s * 0.4, s * 0.06, 0, 0, Math.PI * 2);
    else c.arc(x, y - s * 0.32, s * 0.2, 0, Math.PI * 2);
    c.fill();
  } else if (it.id === 'aquarium') {
    c.fillStyle = '#a9743f';
    roundRect(c, x - s * 0.5, y - s * 0.32, s, s * 0.32, s * 0.04);
    c.fill();
    c.fillStyle = 'rgba(120,200,255,0.75)';
    roundRect(c, x - s * 0.44, y - s * 0.9, s * 0.88, s * 0.58, s * 0.05);
    c.fill();
    c.fillStyle = '#e8d5a3';
    c.fillRect(x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.08);
    c.strokeStyle = '#2f9a6a';
    c.lineWidth = Math.max(1.5, s * 0.03);
    c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.42); c.quadraticCurveTo(x - s * 0.36 + Math.sin(globalT * 2) * s * 0.03, y - s * 0.62, x - s * 0.3, y - s * 0.8); c.stroke();
    var fcols = ['#ffb347', '#ff5f7e', '#ffe94f'];
    for (i = 0; i < homeFish.length; i++) {
      var f = homeFish[i], fx = x + f.fx * s, fy = y - s * 0.62 + f.fy * s;
      c.fillStyle = fcols[i % 3];
      c.beginPath();
      if (c.ellipse) c.ellipse(fx, fy, s * 0.07, s * 0.04, 0, 0, Math.PI * 2);
      else c.arc(fx, fy, s * 0.05, 0, Math.PI * 2);
      c.fill();
      c.beginPath(); c.moveTo(fx - f.dir * s * 0.06, fy); c.lineTo(fx - f.dir * s * 0.12, fy - s * 0.04); c.lineTo(fx - f.dir * s * 0.12, fy + s * 0.04); c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(x + s * 0.3, y - s * 0.55 - ((globalT * 0.4 + 0.3) % 1) * s * 0.3, s * 0.02, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1.5, s * 0.03);
    roundRect(c, x - s * 0.44, y - s * 0.9, s * 0.88, s * 0.58, s * 0.05);
    c.stroke();
  } else if (it.id === 'piano') {
    c.fillStyle = '#3a3346';
    roundRect(c, x - s * 0.55, y - s * 0.95, s * 1.1, s * 0.6, s * 0.06);
    c.fill();
    c.fillRect(x - s * 0.5, y - s * 0.35, s * 0.08, s * 0.35);
    c.fillRect(x + s * 0.42, y - s * 0.35, s * 0.08, s * 0.35);
    c.fillStyle = '#fff';
    c.fillRect(x - s * 0.48, y - s * 0.42, s * 0.96, s * 0.14);
    c.fillStyle = '#222';
    for (i = 0; i < 7; i++) {
      var press = it.keysT > 0 && Math.sin(globalT * 12 + i * 2) > 0.6;
      c.fillRect(x - s * 0.42 + i * s * 0.13, y - s * 0.42, s * 0.05, press ? s * 0.06 : s * 0.08);
    }
    c.fillStyle = '#ffd24f';
    roundRect(c, x - s * 0.25, y - s * 0.86, s * 0.5, s * 0.16, s * 0.03);
    c.fill();
    c.fillStyle = '#ff7bac';
    c.beginPath(); c.arc(x + s * 0.38, y - s * 1.0, s * 0.06, 0, Math.PI * 2); c.fill();
  }
}

function renderHomeBg() {
  var dec = homeDecor[homeRoomIdx] || homeDecorDefault()[homeRoomIdx];
  var wallP = HOME_PAINTS[dec.wall] || HOME_PAINTS[0], floorP = HOME_PAINTS[dec.floor] || HOME_PAINTS[0];
  var key = viewW + 'x' + viewH + '|' + homeRoomIdx + '|' + wallP.id + '|' + floorP.id;
  if (homeBgKey === key) return;
  homeBgKey = key;
  homeBgCanvas.width = Math.round(viewW * DPR);
  homeBgCanvas.height = Math.round(viewH * DPR);
  var b = homeBgCanvas.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  var room = homeRoom(), w = viewW, h = viewH, i, k, x, y, tower = homeRoomIdx === 1;
  b.fillStyle = wallP.wall[1];
  b.fillRect(0, 0, w, h);
  // Seinä maalilla ja tapetilla (sali: sydämet, torni: tähtitaivas)
  var wall = b.createLinearGradient(0, 0, 0, room.floorY);
  wall.addColorStop(0, wallP.wall[0]);
  wall.addColorStop(1, wallP.wall[1]);
  b.fillStyle = wall;
  b.fillRect(0, 0, room.x1 + h * 0.02, room.floorY);
  if (tower) {
    for (i = 0; i < 60; i++) {
      x = (i * 173.7) % (room.x1 + h * 0.02);
      y = (i * 97.3) % (room.floorY - h * 0.05);
      b.fillStyle = 'rgba(255,255,255,' + (0.35 + (i % 4) * 0.15) + ')';
      b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.7, 0, Math.PI * 2); b.fill();
    }
    for (i = 0; i < 5; i++) drawStar(b, h * 0.1 + i * h * 0.22, h * 0.08 + (i % 2) * h * 0.06, h * 0.012, i, 0);
  } else {
    b.fillStyle = 'rgba(255,255,255,0.35)';
    for (i = 0; i < 14; i++) {
      for (k = 0; k < 7; k++) {
        x = h * 0.06 + i * h * 0.11 + (k % 2) * h * 0.055;
        y = h * 0.06 + k * h * 0.085;
        if (y > room.floorY - h * 0.08) continue;
        drawHeartShape(b, x, y, h * 0.012, true);
      }
    }
  }
  // Ikkuna: salissa neliö ja päivä, tornissa pyöreä ja kuu
  var wx = tower ? room.x1 * 0.7 : room.x1 * 0.22, wy = room.floorY * 0.42, ww = h * 0.2, wh = h * 0.26;
  if (tower) {
    b.fillStyle = '#8a8298';
    b.beginPath(); b.arc(wx, wy, ww * 0.62, 0, Math.PI * 2); b.fill();
    var night = b.createRadialGradient(wx, wy, ww * 0.1, wx, wy, ww * 0.55);
    night.addColorStop(0, '#2a3a78');
    night.addColorStop(1, '#0b1030');
    b.fillStyle = night;
    b.beginPath(); b.arc(wx, wy, ww * 0.55, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#fff6c8';
    b.beginPath(); b.arc(wx + ww * 0.15, wy - ww * 0.12, ww * 0.16, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#0b1030';
    b.beginPath(); b.arc(wx + ww * 0.23, wy - ww * 0.16, ww * 0.13, 0, Math.PI * 2); b.fill();
    for (i = 0; i < 6; i++) drawStar(b, wx - ww * 0.3 + (i % 3) * ww * 0.22, wy + ww * 0.1 + Math.floor(i / 3) * ww * 0.22, ww * 0.03, i, 0);
    b.strokeStyle = '#8a8298';
    b.lineWidth = h * 0.01;
    b.beginPath(); b.moveTo(wx, wy - ww * 0.55); b.lineTo(wx, wy + ww * 0.55); b.moveTo(wx - ww * 0.55, wy); b.lineTo(wx + ww * 0.55, wy); b.stroke();
  } else {
    b.fillStyle = '#a9743f';
    roundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02);
    b.fill();
    var sky = b.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
    sky.addColorStop(0, '#8fd0ff');
    sky.addColorStop(1, '#dff3ff');
    b.fillStyle = sky;
    roundRect(b, wx - ww / 2, wy - wh / 2, ww, wh, h * 0.015);
    b.fill();
    b.fillStyle = 'rgba(255,255,255,0.9)';
    cloudShape(b, wx - ww * 0.2, wy - wh * 0.2, h * 0.014);
    cloudShape(b, wx + ww * 0.25, wy + wh * 0.05, h * 0.011);
    b.fillStyle = '#7fcf68';
    b.beginPath(); b.arc(wx, wy + wh * 0.62, ww * 0.6, Math.PI, 0); b.fill();
    b.fillStyle = '#a9743f';
    b.fillRect(wx - h * 0.006, wy - wh / 2, h * 0.012, wh);
    b.fillRect(wx - ww / 2, wy - h * 0.006, ww, h * 0.012);
  }
  // Lattialista (seinämaalin sävy) ja lattia (lattiamaali)
  b.fillStyle = wallP.pot;
  b.fillRect(0, room.floorY - h * 0.03, room.x1 + h * 0.02, h * 0.03);
  var floor = b.createLinearGradient(0, room.floorY, 0, h);
  floor.addColorStop(0, floorP.floor[0]);
  floor.addColorStop(1, floorP.floor[1]);
  b.fillStyle = floor;
  b.fillRect(0, room.floorY, room.x1 + h * 0.02, h - room.floorY);
  b.strokeStyle = 'rgba(40,30,60,0.22)';
  b.lineWidth = 2;
  for (y = room.floorY + h * 0.06; y < h; y += h * 0.07) { b.beginPath(); b.moveTo(0, y); b.lineTo(room.x1 + h * 0.02, y); b.stroke(); }
  for (i = 0; i < 12; i++) {
    x = i * h * 0.16 + (i % 2) * h * 0.08;
    b.beginPath(); b.moveTo(x, room.floorY); b.lineTo(x - h * 0.06, h); b.stroke();
  }
  // Ovi: salissa oikealla (torniin), tornissa vasemmalla (saliin)
  var dr = homeDoorRect();
  b.fillStyle = '#8a5a30';
  roundRect(b, dr.x, dr.y, dr.w, dr.h, h * 0.03);
  b.fill();
  b.fillStyle = '#ffd24f';
  b.beginPath(); b.arc(homeRoomIdx === 0 ? dr.x + dr.w * 0.75 : dr.x + dr.w * 0.25, dr.y + dr.h * 0.53, h * 0.01, 0, Math.PI * 2); b.fill();
  // Kyltti oven yllä: portaat torniin / sydän saliin
  b.fillStyle = '#fff6d8';
  roundRect(b, dr.x + dr.w * 0.1, dr.y - h * 0.07, dr.w * 0.8, h * 0.05, h * 0.01);
  b.fill();
  if (homeRoomIdx === 0) {
    b.fillStyle = '#8a5cb8';
    for (i = 0; i < 3; i++) b.fillRect(dr.x + dr.w * 0.25 + i * dr.w * 0.17, dr.y - h * 0.03 - i * h * 0.01, dr.w * 0.17, h * 0.01 * (i + 1));
  } else {
    b.fillStyle = '#ff5f7e';
    drawHeartShape(b, dr.x + dr.w / 2, dr.y - h * 0.045, h * 0.012, true);
  }
}
