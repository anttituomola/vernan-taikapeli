'use strict';

// Kalastusretki (Kaukamaa, Maalaiskylä): pitkä ja helppo kenttä ilman sydämiä
// ja aikarajaa. Prinsessa ja yksisarvinen istuvat soutuveneessä kylän
// järvellä; kalat uivat näkyvinä varjoina pinnan alla, jokainen laji omalla
// paikallaan (ahvenet keskellä, hauki kaislikossa, kultakala ja sammakko
// lumpeiden luona, lohi syvällä kaukana, rapu rantakivillä).
//   Heitto: napautus järveen heittää kohon siihen kohtaan.
//   Tärppi: lähin kala ui kohon luo, nykäisee 1–3 kertaa pienesti ja sitten
//   koho sukeltaa (iso roiske, "!" ja ääni). Napautus mihin tahansa nostaa
//   kalan; pito kelaa nopeammin. Tärppi-ikkuna on väljä (FISHING_BITE), ja
//   ohi mennyt kala vain ui pois — uusi tulee hetken päästä. Liian aikainen
//   napautus kohoon nykäisyjen aikana säikäyttää kalan (kevyt ajoitustaito,
//   ei rangaistusta; ensimmäisellä kalalla ei sitäkään).
//   Saalis näytetään isona tarrana; uusi laji lentää kalakirjaan ruudun
//   yläreunaan. Kuusi tavallista lajia täyttää kirjan ja päättää kentän.
//   Bonussivulla on saapas, aarrearkku, kuukala (vain yöllä) ja harvinainen
//   sateenkaarikala; kun kaikki kymmenen on joskus löydetty, kirja muuttuu
//   kultaiseksi (muistetaan omassa tallennusavaimessa).
//   Saaliit eivät mene hukkaan: laiturin kyläläinen tilaa "N kalaa" (numero
//   ja kalan kuva, ämpärin pallot täyttyvät), muut kalat saa laiturin kissa,
//   saappaan kissa säikähtää ja pukee hatuksi, rapu ja sammakko pulahtavat
//   takaisin järveen.
//   Päivä vaihtuu kirjan täyttyessä iltaruskoon ja tähtitaivaaseen.
// Tehtävä (lasku) kolmannen kirjalajin jälkeen.

var FISHING_GOAL = 6;           // tavalliset lajit kirjassa = kenttä läpi
var FISHING_BITE = 1.5;         // tärppi-ikkuna (s)
var FISHING_NIBBLE = 0.55;      // yhden nykäisyn kesto (s)
var FISHING_REEL = 1.2;         // kelauksen kesto (s); pito nopeuttaa
var FISHING_SHOW = 1.9;         // saaliskortin kesto (s)
var FISHING_CAST = 0.55;        // heiton lento (s)
var FISHING_SHADOWS = 5;        // kalavarjoja järvessä kerralla
var FISHING_KEY = 'vt_fishing_v1';
var FISHING_RAINBOW = ['#ff5f7e', '#ffb84f', '#ffe94f', '#6fd66f', '#5fa8ff', '#b678ff'];
// Lajit: 0–5 tavalliset (kirjan tavoite), 6–9 bonussivu.
// zone: missä uivat, shape: varjon muoto, len: koko, note: saaliin ääni
var FISHING_SPECIES = [
  { id: 'perch', zone: 'mid', shape: 'fish', len: 1.0, note: 523, ring: '#9cc04a' },
  { id: 'pike', zone: 'reeds', shape: 'long', len: 1.3, note: 440, ring: '#6aa04a' },
  { id: 'gold', zone: 'lily', shape: 'round', len: 0.8, note: 659, ring: '#ffa52a' },
  { id: 'salmon', zone: 'far', shape: 'fish', len: 1.15, note: 587, ring: '#ff9aa8' },
  { id: 'crab', zone: 'shore', shape: 'crab', len: 0.8, note: 392, ring: '#e0503a' },
  { id: 'frog', zone: 'lily', shape: 'frog', len: 0.8, note: 349, ring: '#5fbf4a' },
  { id: 'boot', zone: 'any', shape: 'boot', len: 0.9, note: 196, ring: '#8a5a30', bonus: true },
  { id: 'chest', zone: 'deep', shape: 'chest', len: 1.0, note: 784, ring: '#e8b84a', bonus: true },
  { id: 'moon', zone: 'any', shape: 'round', len: 0.9, note: 880, ring: '#a8c8ff', bonus: true, night: true },
  { id: 'rainbow', zone: 'any', shape: 'fish', len: 1.0, note: 988, ring: '#b678ff', bonus: true }
];
// Uintialueet: [x0, y0, x1, y1] osuutena ruudusta
var FISHING_ZONES = {
  far: [0.40, 0.46, 0.76, 0.52],
  reeds: [0.36, 0.52, 0.50, 0.66],
  mid: [0.46, 0.58, 0.74, 0.75],
  deep: [0.54, 0.60, 0.70, 0.70],
  lily: [0.47, 0.79, 0.68, 0.90],
  shore: [0.74, 0.80, 0.90, 0.92],
  any: [0.40, 0.52, 0.76, 0.88]
};
// Päivän kulku kirjan tavallisten lajien mukaan (0 päivä, 0.5 ilta, 1 yö)
var FISHING_DAY = [0, 0.08, 0.16, 0.26, 0.48, 0.8, 1];

var fishing = {
  st: 'idle', t: 0, stT: 0, idleT: 0,
  bx: 0.6, by: 0.65, castX0: 0, castY0: 0, bobWig: 0,
  fish: [], spawnT: 0, hooked: null, waitT: 0, waitAll: 0, nibN: 1, nibDone: 0, reelK: 0, reelTick: 0,
  catchSp: -1, catchSize: 1, catchV: 0.5, catchX: 0, catchY: 0,
  book: [], saved: [], slotPop: [], fly: [], rip: [], bub: [],
  order: null, orderWait: 0, ordersDone: 0,
  cat: { eat: 0, jump: 0, hat: 0, fed: 0 }, vill: { wave: 0, joy: 0 },
  uniFlower: false, prHop: 0, dayK: 0, moonT: 0,
  casts: 0, catches: 0, misses: 0, early: 0, bites: 0, hits: 0,
  newCool: 0, taskDelay: -1, winT: -1, wonT: -1, golden: false, shore: null
};

// ---------- Asettelu ----------
function fishingL() {
  var W = viewW, H = viewH, bs = H * 0.38, bx = W * 0.15, by = H * 0.8;
  return {
    W: W, H: H, top: H * 0.4, boatX: bx, boatY: by, bs: bs,
    tipX: bx + H * 0.34, tipY: by - H * 0.33,
    dockX: W * 0.79, dockY: H * 0.56, catX: W * 0.845, villX: W * 0.935
  };
}
function fishingPx(f) { return { x: f.fx * viewW, y: f.fy * viewH }; }
function fishingPersp(y, L) { return 0.6 + 0.6 * Math.max(0, (y - L.top) / (L.H - L.top)); }
function fishingShadowS(f, y, L) { return L.H * 0.03 * FISHING_SPECIES[f.sp].len * f.size * fishingPersp(y, L); }
function fishingBobPx(L) {
  return { x: fishing.bx * L.W, y: fishing.by * L.H + Math.sin(globalT * 2.2) * L.H * 0.003 };
}
function fishingCardPos(L) { return { x: L.W * 0.56, y: L.H * 0.4, r: L.H * 0.15 }; }
function fishingBucket(L) { return { x: L.villX + L.H * 0.065, y: L.dockY }; }
function fishingSlot(i) {
  var s = viewH * 0.068, x0 = hudX() + viewH * 0.14, gap = s * 1.12;
  return { x: x0 + i * gap + (i >= FISHING_GOAL ? s * 0.45 : 0), y: viewH * 0.072, s: s };
}
function fishingRegular() {
  var i, n = 0;
  for (i = 0; i < FISHING_GOAL; i++) if (fishing.book[i]) n++;
  return n;
}
function fishingClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fishingOval(c, x, y, rx, ry) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  else { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); }
}

// ---------- Tallennus (bonuslajit muistetaan kenttäkertojen yli) ----------
function fishingLoad() {
  var i, raw, d;
  fishing.saved = [];
  for (i = 0; i < FISHING_SPECIES.length; i++) fishing.saved.push(false);
  try {
    raw = localStorage.getItem(FISHING_KEY);
    d = raw ? JSON.parse(raw) : null;
    if (d && d.found && d.found.length) {
      for (i = 0; i < d.found.length; i++) {
        if (Number(d.found[i]) >= 0 && Number(d.found[i]) < FISHING_SPECIES.length) fishing.saved[Number(d.found[i])] = true;
      }
    }
  } catch (e) { /* ei tallennusta: kirja muistaa vain tämän kerran */ }
}
function fishingSave() {
  var i, out = [];
  for (i = 0; i < fishing.saved.length; i++) if (fishing.saved[i]) out.push(i);
  try { localStorage.setItem(FISHING_KEY, JSON.stringify({ found: out })); } catch (e) { /* yksityinen tila */ }
}
function fishingAllEver() {
  var i;
  for (i = 0; i < FISHING_SPECIES.length; i++) if (!fishing.saved[i] && !fishing.book[i]) return false;
  return true;
}

// ---------- Alustus ----------
function initFishing() {
  var i;
  // Välitehtävät vaikeampia (palaute 4.10.2026): lasku ja kalojen myynti kolikoilla
  tasks = [makeTask(-5, 'math'), makeTask(-5, 'pay')];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  fishing.taskIdx = 0;
  camX = 0;
  fishingLoad();
  fishing.st = 'idle';
  fishing.t = 0;
  fishing.stT = 0;
  fishing.idleT = 0;
  fishing.fish = [];
  fishing.spawnT = 0;
  fishing.hooked = null;
  fishing.book = [];
  fishing.slotPop = [];
  for (i = 0; i < FISHING_SPECIES.length; i++) { fishing.book.push(false); fishing.slotPop.push(0); }
  fishing.fly = [];
  fishing.rip = [];
  fishing.bub = [];
  fishing.order = null;
  fishing.orderWait = 5;
  fishing.ordersDone = 0;
  fishing.cat = { eat: 0, jump: 0, hat: 0, fed: 0 };
  fishing.vill = { wave: 0, joy: 0 };
  fishing.uniFlower = false;
  fishing.prHop = 0;
  fishing.dayK = 0;
  fishing.moonT = 0;
  fishing.casts = 0;
  fishing.newCool = 0;
  fishing.catches = 0;
  fishing.misses = 0;
  fishing.early = 0;
  fishing.bites = 0;
  fishing.hits = 0;
  fishing.taskDelay = -1;
  fishing.winT = -1;
  fishing.wonT = -1;
  fishing.golden = fishingAllEver();
  for (i = 0; i < FISHING_SHADOWS; i++) fishingSpawn(true);
  fishingSetupProps();
  fishingBuildShore();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.3);
  playNote(659, 0.14, 0.2, 'triangle', 0.3);
  playNote(784, 0.28, 0.35, 'triangle', 0.3);
}
function respawnFishing() {
  if (fishing.st === 'won') return;
  fishingRelease();
  fishing.st = 'idle';
  fishing.stT = 0;
}
function resizeFishing() {
  camX = 0;
  fishingSetupProps();
  fishingBuildShore();
}

// ---------- Kalat ----------
function fishingCount(sp) {
  var i, n = 0;
  for (i = 0; i < fishing.fish.length; i++) if (fishing.fish[i].sp === sp && fishing.fish[i].mode !== 'flee') n++;
  return n;
}
// Lajin arvonta: puuttuvat lajit ja tilauksen laji useammin, kuukala vain yöllä
function fishingPickSpecies() {
  var i, w = [], sum = 0, r, S, ww, o = fishing.order;
  for (i = 0; i < FISHING_SPECIES.length; i++) {
    S = FISHING_SPECIES[i];
    if (!S.bonus) ww = fishing.book[i] ? (i === 0 ? 1.4 : 0.8) : (i === 0 ? 2 : (fishingNewOk() ? 3 : 0));
    else if (S.id === 'boot') ww = fishing.book[i] ? 0.35 : (fishing.catches >= 2 ? 3 : 1);
    else if (S.id === 'chest') ww = fishing.book[i] ? 0.05 : 0.1;
    else if (S.id === 'moon') ww = fishing.dayK < 0.7 ? 0 : (fishing.book[i] ? 0.5 : 3.5);
    else ww = fishing.book[i] ? 0.02 : 0.045;
    if (o && !o.done && o.sp === i) ww += 3;
    if (fishingCount(i) >= (S.bonus ? 1 : i === 0 ? 3 : 2)) ww = 0;
    w.push(ww);
    sum += ww;
  }
  r = Math.random() * sum;
  for (i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0 && w[i] > 0) return i; }
  return 0;
}
// Uusi laji (puuttuu kirjasta) tulee järveen yksi kerrallaan ja vasta kahden
// muun saaliin jälkeen edellisestä uudesta: kenttä pysyy pitkänä, ja tuplat
// menevät kissalle ja tilauksiin. Ahven on aina mukana.
function fishingIsNew(sp) { return sp > 0 && sp < FISHING_GOAL && !fishing.book[sp]; }
function fishingNewInLake() {
  var i;
  for (i = 0; i < fishing.fish.length; i++) if (fishingIsNew(fishing.fish[i].sp) && fishing.fish[i].mode !== 'flee') return true;
  return fishing.st === 'reel' || fishing.st === 'show' ? fishingIsNew(fishing.catchSp) : false;
}
function fishingNewOk() {
  return fishing.newCool <= 0 && !fishingNewInLake() && !fishing.fly.length;
}
function fishingZonePt(z) {
  var Z = FISHING_ZONES[z] || FISHING_ZONES.any;
  return { fx: Z[0] + Math.random() * (Z[2] - Z[0]), fy: Z[1] + Math.random() * (Z[3] - Z[1]) };
}
function fishingSpawn(instant) {
  var sp = fishingPickSpecies(), p = fishingZonePt(FISHING_SPECIES[sp].zone);
  if (!instant && fishingIsNew(sp)) {
    // Uusi laji saapuu kimallellen
    fishingRipple(p.fx * viewW, p.fy * viewH, true);
    spawnSparkles(p.fx * viewW, p.fy * viewH, 6, '#ffffff');
    playNote(1319, 0, 0.08, 'sine', 0.12);
    playNote(1760, 0.08, 0.1, 'sine', 0.12);
  }
  fishing.fish.push({
    sp: sp, fx: p.fx, fy: p.fy, tx: p.fx, ty: p.fy, dir: Math.random() < 0.5 ? -1 : 1,
    mode: 'swim', alpha: instant ? 1 : 0, pause: Math.random() * 2, ph: Math.random() * 6,
    size: 0.85 + Math.random() * 0.45, v: Math.random(),
    // Harvinaiset käyvät vain hetken: kurkkaa ajoissa!
    life: FISHING_SPECIES[sp].id === 'rainbow' ? 18 : FISHING_SPECIES[sp].id === 'chest' ? 26 : 1e9
  });
}
// Siirtää kalaa kohti pistettä (px); palauttaa true kun perillä
function fishingMoveTo(f, tx, ty, speed, dt) {
  var p = fishingPx(f), dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), step;
  if (d < 1.5) return true;
  step = Math.min(d, speed * dt);
  f.fx += dx / d * step / viewW;
  f.fy += dy / d * step / viewH;
  if (Math.abs(dx) > 3) f.dir = dx > 0 ? 1 : -1;
  return d - step < 1.5;
}
// Kalan suu kohon kohdalle
function fishingMouthPt(f, L) {
  var b = fishingBobPx(L), p = fishingPx(f), s = fishingShadowS(f, b.y, L), dir = b.x >= p.x ? 1 : -1;
  return { x: b.x - dir * s * 0.95, y: b.y + s * 0.15 };
}
function fishingUpdateFish(dt, L) {
  var i, f, p, m, z, Z, H = L.H;
  for (i = fishing.fish.length - 1; i >= 0; i--) {
    f = fishing.fish[i];
    f.ph += dt * (f.mode === 'come' ? 9 : f.mode === 'flee' ? 14 : 4);
    if (f.mode === 'flee') {
      p = fishingPx(f);
      f.fx += f.dir * H * 0.35 * dt / viewW;
      f.alpha -= dt * 0.9;
      if (f.alpha <= 0) { fishing.fish.splice(i, 1); fishing.spawnT = Math.max(fishing.spawnT, 1.0); }
      continue;
    }
    if (f.alpha < 1) f.alpha = Math.min(1, f.alpha + dt * 0.8);
    // Kuukala sukeltaa pois, jos ei ole yö (ei tapahdu normaalisti)
    if (FISHING_SPECIES[f.sp].night && fishing.dayK < 0.6 && f !== fishing.hooked) { f.mode = 'flee'; continue; }
    if (f.mode === 'come') {
      m = fishingMouthPt(f, L);
      f.arrived = fishingMoveTo(f, m.x, m.y, H * 0.17, dt);
      if (f.arrived) f.dir = fishingBobPx(L).x >= m.x ? 1 : -1;
      continue;
    }
    if (f.mode === 'hold') continue;
    f.life -= dt;
    if (f.life <= 0 && f.mode === 'swim') { f.mode = 'flee'; continue; }
    // Vapaa uinti omalla alueella
    if (f.pause > 0) { f.pause -= dt; continue; }
    if (fishingMoveTo(f, f.tx * L.W, f.ty * H, H * (0.035 + f.v * 0.03), dt)) {
      z = FISHING_SPECIES[f.sp].zone;
      Z = fishingZonePt(z);
      f.tx = Z.fx;
      f.ty = Z.fy;
      f.pause = Math.random() < 0.4 ? 0.5 + Math.random() * 1.5 : 0;
    }
  }
  // Uudelle lajille tilaa: tuttu kala ui pois
  if (fishing.fish.length >= FISHING_SHADOWS && fishingNewOk() && fishingRegular() < FISHING_GOAL) {
    for (i = 0; i < fishing.fish.length; i++) {
      f = fishing.fish[i];
      if (f.mode === 'swim' && !FISHING_SPECIES[f.sp].bonus && !fishingIsNew(f.sp)) { f.mode = 'flee'; break; }
    }
  }
  if (fishing.fish.length < FISHING_SHADOWS) {
    fishing.spawnT -= dt;
    if (fishing.spawnT <= 0) { fishingSpawn(false); fishing.spawnT = 0.8; }
  }
}
// Kohossa kiinni oleva kala päästetään takaisin uimaan
function fishingRelease() {
  if (fishing.hooked) {
    fishing.hooked.mode = 'swim';
    fishing.hooked.pause = 0.5;
    fishing.hooked = null;
  }
}

// ---------- Heitto, tärppi, kelaus ----------
function fishingCast(px, py, L) {
  var b = fishingRestBob(L), minX = Math.max(L.W * 0.34, L.tipX + L.H * 0.03), tx, ty;
  fishingRelease();
  tx = fishingClamp(px, minX, L.W * 0.95);
  ty = fishingClamp(py, L.top + L.H * 0.06, L.H * 0.93);
  // Laiturin alle ei heitetä
  if (tx > L.dockX - L.H * 0.02 && ty < L.dockY + L.H * 0.1) ty = L.dockY + L.H * 0.1;
  if (fishing.st === 'wait' || fishing.st === 'nibble') b = fishingBobPx(L);
  fishing.castX0 = b.x;
  fishing.castY0 = b.y;
  fishing.bx = tx / L.W;
  fishing.by = ty / L.H;
  fishing.st = 'cast';
  fishing.stT = 0;
  fishing.idleT = 0;
  fishing.casts++;
  playNote(900, 0, 0.07, 'sine', 0.15);
  playNote(700, 0.06, 0.07, 'sine', 0.15);
  playNote(520, 0.12, 0.08, 'sine', 0.15);
}
function fishingRestBob(L) {
  return { x: L.tipX + Math.sin(globalT * 1.7) * L.H * 0.006, y: L.tipY + L.H * 0.075 };
}
function fishingRipple(x, y, big) {
  if (fishing.rip.length > 14) fishing.rip.shift();
  fishing.rip.push({ x: x, y: y, t: 0, big: !!big });
}
function fishingBubbles(x, y, n) {
  var i;
  for (i = 0; i < n; i++) {
    if (fishing.bub.length > 30) fishing.bub.shift();
    fishing.bub.push({ x: x + (Math.random() - 0.5) * viewH * 0.03, y: y, t: -i * 0.08, life: 0.7 + Math.random() * 0.4 });
  }
}
function fishingBite(L) {
  var b = fishingBobPx(L);
  fishing.st = 'bite';
  fishing.stT = 0;
  fishing.bites++;
  fishingRipple(b.x, b.y, true);
  fishingRipple(b.x, b.y, false);
  fishingBubbles(b.x, b.y, 5);
  spawnSparkles(b.x, b.y - L.H * 0.01, 8, '#ffffff');
  playNote(330, 0, 0.12, 'triangle', 0.35);
  playNote(660, 0.08, 0.16, 'triangle', 0.3);
  playNote(990, 0.16, 0.2, 'sine', 0.25);
}
function fishingHook() {
  var L = fishingL(), b = fishingBobPx(L), f = fishing.hooked, i;
  if (!f) return;
  fishing.hits++;
  fishing.catchSp = f.sp;
  fishing.catchSize = f.size;
  fishing.catchV = f.v;
  for (i = 0; i < fishing.fish.length; i++) if (fishing.fish[i] === f) { fishing.fish.splice(i, 1); break; }
  fishing.hooked = null;
  fishing.spawnT = Math.max(fishing.spawnT, 1.2);
  fishing.st = 'reel';
  fishing.stT = 0;
  fishing.reelK = 0;
  fishing.reelTick = 0;
  fishing.catchX = b.x;
  fishing.catchY = b.y;
  fishingRipple(b.x, b.y, true);
  artShakeStart(L.H * 0.004, 0.2);
  playNote(523, 0, 0.1, 'triangle', 0.35);
  playNote(784, 0.08, 0.14, 'triangle', 0.35);
}
// Kala lähtee: ohi mennyt tärppi (early = liian aikainen napautus)
function fishingLetGo(early) {
  var L = fishingL(), b = fishingBobPx(L), f = fishing.hooked;
  if (early) fishing.early++; else fishing.misses++;
  if (f) {
    f.mode = 'flee';
    f.dir = f.fx * L.W < b.x ? -1 : 1;
  }
  fishing.hooked = null;
  fishing.st = 'wait';
  fishing.stT = 0;
  fishing.waitT = 0.9 + Math.random() * 0.5;
  fishing.waitAll = 0;
  fishingRipple(b.x, b.y, false);
  fishingBubbles(b.x, b.y, early ? 4 : 2);
  // Pehmeä "plup", ei pettymysääntä
  playNote(early ? 700 : 500, 0, 0.1, 'sine', 0.18);
  playNote(early ? 880 : 420, 0.09, 0.12, 'sine', 0.14);
}
function fishingReelEnd(L) {
  return { x: L.boatX + L.bs * 0.62, y: L.boatY - L.H * 0.035 };
}
function fishingShowStart(L) {
  var S = FISHING_SPECIES[fishing.catchSp], n = S.note, e = fishingReelEnd(L);
  fishing.st = 'show';
  fishing.stT = 0;
  fishing.catches++;
  if (fishing.newCool > 0) fishing.newCool--;
  fishing.prHop = 0.5;
  fishingRipple(e.x, e.y, true);
  spawnSparkles(e.x, e.y, 10, '#ffffff');
  if (S.id === 'boot') {
    // Hassu "boing"
    playNote(392, 0, 0.14, 'triangle', 0.35);
    playNote(262, 0.14, 0.14, 'triangle', 0.35);
    playNote(196, 0.28, 0.3, 'triangle', 0.3);
    return;
  }
  playNote(n, 0, 0.18, 'triangle', 0.35);
  playNote(n * 1.25, 0.12, 0.18, 'triangle', 0.35);
  playNote(n * 1.5, 0.24, 0.3, 'triangle', 0.35);
  if (S.bonus) playNote(n * 2, 0.4, 0.4, 'sine', 0.25);
  if (fishing.catchSize > 1.18) playNote(n * 0.5, 0.05, 0.5, 'sine', 0.25);
}

// ---------- Saaliin reititys ----------
function fishingFly(d) {
  d.t = 0;
  d.delay = d.delay || 0;
  fishing.fly.push(d);
  return d;
}
function fishingDispatch() {
  var L = fishingL(), sp = fishing.catchSp, S = FISHING_SPECIES[sp], C = fishingCardPos(L), sl, o = fishing.order, delay = 0, dest, w;
  if (fishing.st !== 'show') return;
  if (!fishing.book[sp] && !fishingFlyingSticker(sp)) {
    sl = fishingSlot(sp);
    fishingFly({ kind: 'sticker', sp: sp, v: fishing.catchV, x0: C.x, y0: C.y, x1: sl.x, y1: sl.y, s0: C.r * 0.5, s1: sl.s * 0.36, dur: 0.8, hop: L.H * 0.08, onEnd: fishingStickerDone });
    delay = 0.3;
  }
  if (o && !o.done && o.sp === sp && o.got + o.pend < o.n) {
    dest = fishingBucket(L);
    o.pend++;
    fishingFly({ kind: 'item', sp: sp, v: fishing.catchV, x0: C.x, y0: C.y, x1: dest.x, y1: dest.y - L.H * 0.03, s0: C.r * 0.5, s1: L.H * 0.022, dur: 0.85, hop: L.H * 0.12, delay: delay, onEnd: fishingBucketDone });
  } else if (S.id === 'boot' || sp <= 3) {
    fishingFly({ kind: 'item', sp: sp, v: fishing.catchV, x0: C.x, y0: C.y, x1: L.catX - L.H * 0.012, y1: L.dockY - L.H * 0.07, s0: C.r * 0.5, s1: L.H * 0.02, dur: 0.9, hop: L.H * 0.12, delay: delay, onEnd: S.id === 'boot' ? fishingCatBoot : fishingCatEat });
  } else {
    // Takaisin järveen: rapu rannalle, sammakko lumpeille, muut syvälle
    w = fishingZonePt(S.zone);
    fishingFly({ kind: 'item', sp: sp, v: fishing.catchV, x0: C.x, y0: C.y, x1: w.fx * L.W, y1: w.fy * L.H, s0: C.r * 0.5, s1: L.H * 0.03, dur: 0.9, hop: L.H * 0.1, delay: delay, onEnd: fishingSplashBack });
  }
  fishing.st = fishing.winT >= 0 ? 'won' : 'idle';
  fishing.stT = 0;
  fishing.idleT = 0;
}
function fishingFlyingSticker(sp) {
  var i;
  for (i = 0; i < fishing.fly.length; i++) if (fishing.fly[i].kind === 'sticker' && fishing.fly[i].sp === sp) return true;
  return false;
}
function fishingStickerDone(d) {
  var sp = d.sp, n, sl = fishingSlot(sp);
  fishing.book[sp] = true;
  fishing.slotPop[sp] = 0.6;
  spawnSparkles(sl.x, sl.y, 12, FISHING_SPECIES[sp].bonus ? '#ffd24f' : '#ffffff');
  artPop(sl.x, sl.y, sl.s * 0.7, '#ffe27a', 'ring');
  n = fishingRegular();
  soundStar(n + (FISHING_SPECIES[sp].bonus ? 6 : 0));
  if (!fishing.saved[sp]) { fishing.saved[sp] = true; fishingSave(); }
  if (!fishing.golden && fishingAllEver()) {
    fishing.golden = true;
    playNote(1047, 0.3, 0.3, 'sine', 0.3);
    playNote(1319, 0.42, 0.3, 'sine', 0.3);
    playNote(1568, 0.54, 0.5, 'sine', 0.3);
  }
  if (FISHING_SPECIES[sp].bonus) return;
  fishing.newCool = 2;
  if (n === 2 && !tasks[0].opened) { fishing.taskIdx = 0; fishing.taskDelay = 0.9; }
  if (n === 4 && !tasks[1].opened) { fishing.taskIdx = 1; fishing.taskDelay = 0.9; }
  if (n >= FISHING_GOAL && fishing.winT < 0) {
    fishing.winT = 0;
    fishing.wonT = 0;
  }
}
function fishingBucketDone() {
  var o = fishing.order, L = fishingL(), b = fishingBucket(L);
  if (!o) return;
  o.pend = Math.max(0, o.pend - 1);
  o.got++;
  o.pop = 0.4;
  spawnSparkles(b.x, b.y - L.H * 0.03, 8, '#9fe8ff');
  playNote(600 + o.got * 120, 0, 0.15, 'triangle', 0.3);
  if (o.got >= o.n) {
    o.done = true;
    o.doneT = 0;
    fishing.ordersDone++;
    fishing.vill.joy = 2.2;
    fishing.uniFlower = true;
    spawnSparkles(L.villX, L.dockY - L.H * 0.17, 18, '#ff9ec6');
    playNote(784, 0.15, 0.2, 'triangle', 0.35);
    playNote(988, 0.3, 0.2, 'triangle', 0.35);
    playNote(1175, 0.45, 0.4, 'triangle', 0.35);
  }
}
function fishingCatEat() {
  var L = fishingL();
  fishing.cat.eat = 1.4;
  fishing.cat.fed++;
  spawnSparkles(L.catX, L.dockY - L.H * 0.08, 6, '#ff9ec6');
  // Kehräys
  playNote(110, 0, 0.5, 'sawtooth', 0.05);
  playNote(1175, 0.2, 0.1, 'sine', 0.2);
  playNote(1397, 0.32, 0.15, 'sine', 0.2);
}
function fishingCatBoot() {
  var L = fishingL();
  fishing.cat.jump = 1.0;
  fishing.cat.hat = 14;
  spawnSparkles(L.catX, L.dockY - L.H * 0.1, 10, '#ffe27a');
  // Säikähtänyt "MIAU!" ylös ja alas
  playNote(880, 0, 0.12, 'triangle', 0.3);
  playNote(1320, 0.1, 0.18, 'triangle', 0.3);
  playNote(700, 0.6, 0.2, 'triangle', 0.25);
}
function fishingSplashBack(d) {
  fishingRipple(d.x1, d.y1, true);
  spawnSparkles(d.x1, d.y1, 8, FISHING_SPECIES[d.sp].bonus ? '#ffe27a' : '#cfefff');
  playNote(360, 0, 0.1, 'sine', 0.22);
  playNote(540, 0.07, 0.1, 'sine', 0.16);
}
function fishingUpdateFly(dt) {
  var i, d;
  for (i = fishing.fly.length - 1; i >= 0; i--) {
    d = fishing.fly[i];
    if (d.delay > 0) { d.delay -= dt; continue; }
    d.t += dt;
    if (d.t >= d.dur) {
      fishing.fly.splice(i, 1);
      if (d.onEnd) d.onEnd(d);
    }
  }
}

// ---------- Tilaukset ----------
function fishingUpdateOrder(dt) {
  var o = fishing.order, i, opts;
  if (o) {
    if (o.t < 1) o.t = Math.min(1, o.t + dt * 2.5);
    if (o.pop > 0) o.pop -= dt;
    if (o.done) {
      o.doneT += dt;
      if (o.doneT > 2.2) { fishing.order = null; fishing.orderWait = 14; }
    }
    return;
  }
  if (fishing.ordersDone >= 3 || fishing.winT >= 0 || fishingRegular() < 2) return;
  fishing.orderWait -= dt;
  if (fishing.orderWait > 0) return;
  opts = [];
  for (i = 0; i < 4; i++) if (fishing.book[i]) opts.push(i);
  if (!opts.length) { fishing.orderWait = 3; return; }
  fishing.order = { sp: opts[Math.floor(Math.random() * opts.length)], n: fishing.ordersDone === 0 ? 2 : 3, got: 0, pend: 0, t: 0, pop: 0, done: false, doneT: 0 };
  fishing.vill.wave = 1.2;
  playNote(659, 0, 0.12, 'triangle', 0.25);
  playNote(784, 0.12, 0.16, 'triangle', 0.25);
}

// ---------- Päivitys ----------
function updateFishing(dt) {
  var L = fishingL(), busy, i, r, b, target, e, k, f, cand, bd, p, d, rate, before;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  for (i = fishing.rip.length - 1; i >= 0; i--) { fishing.rip[i].t += dt; if (fishing.rip[i].t > 1.1) fishing.rip.splice(i, 1); }
  for (i = fishing.bub.length - 1; i >= 0; i--) { r = fishing.bub[i]; r.t += dt; if (r.t > r.life) fishing.bub.splice(i, 1); }
  for (i = 0; i < fishing.slotPop.length; i++) if (fishing.slotPop[i] > 0) fishing.slotPop[i] -= dt;
  if (fishing.cat.eat > 0) fishing.cat.eat -= dt;
  if (fishing.cat.jump > 0) fishing.cat.jump -= dt;
  if (fishing.cat.hat > 0) fishing.cat.hat -= dt;
  if (fishing.vill.wave > 0) fishing.vill.wave -= dt;
  if (fishing.vill.joy > 0) fishing.vill.joy -= dt;
  if (fishing.prHop > 0) fishing.prHop -= dt;
  if (fishing.moonT > 0) fishing.moonT -= dt;
  if (fishing.bobWig > 0) fishing.bobWig -= dt;
  busy = puzzleBusy();
  if (busy || celebrating) return;
  fishing.t += dt;
  fishing.stT += dt;
  // Päivä -> ilta -> yö kirjan täyttyessä (ja hitaasti ajan kanssa)
  target = Math.max(FISHING_DAY[Math.min(FISHING_GOAL, fishingRegular())], Math.min(1, fishing.t / 260));
  fishing.dayK += fishingClamp(target - fishing.dayK, -dt * 0.05, dt * 0.05);
  fishingUpdateFish(dt, L);
  fishingUpdateFly(dt);
  fishingUpdateOrder(dt);
  // Tehtävä odottaa, kunnes tarra on kirjassa eikä kala ole juuri koukussa
  if (fishing.taskDelay > 0 && !fishing.fly.length && fishingCalm()) {
    fishing.taskDelay -= dt;
    if (fishing.taskDelay <= 0 && !tasks[fishing.taskIdx].opened) {
      fishingRelease();
      if (fishing.st !== 'won') fishing.st = 'idle';
      taskStart(tasks[fishing.taskIdx]);
      return;
    }
  }
  if (fishing.winT >= 0) {
    if (fishingCalm() && fishing.st !== 'won') { fishingRelease(); fishing.st = 'won'; }
    if (fishing.st === 'won' && !fishing.fly.length && fishing.taskDelay <= 0) {
      before = fishing.wonT;
      fishing.wonT += dt;
      if (before < 0.8 && fishing.wonT >= 0.8) fishingWinShine();
      if (fishing.wonT >= 2.8) { fishing.winT = -2; startCelebration(); return; }
    }
  }
  if (fishing.st === 'idle') { fishing.idleT += dt; return; }
  if (fishing.st === 'cast') {
    if (fishing.stT >= FISHING_CAST) {
      b = fishingBobPx(L);
      fishing.st = 'wait';
      fishing.stT = 0;
      fishing.waitT = 0.4 + Math.random() * 0.6;
      fishing.waitAll = 0;
      fishingRipple(b.x, b.y, true);
      playNote(280, 0, 0.1, 'sine', 0.3);
      playNote(560, 0.05, 0.08, 'sine', 0.15);
    }
    return;
  }
  if (fishing.st === 'wait') {
    f = fishing.hooked;
    if (f) {
      if (f.arrived) {
        fishing.st = 'nibble';
        fishing.stT = 0;
        fishing.nibDone = 0;
        fishing.nibN = fishing.catches === 0 ? 1 : 1 + Math.floor(Math.random() * 3);
        f.mode = 'hold';
      }
      return;
    }
    fishing.waitT -= dt;
    fishing.waitAll += dt;
    if (fishing.waitT > 0) return;
    // Lähin kala lähtee kohon luo; jos lähellä ei ole ketään, joku tulee kauempaa
    b = fishingBobPx(L);
    cand = null; bd = 1e9;
    for (i = 0; i < fishing.fish.length; i++) {
      f = fishing.fish[i];
      if (f.mode !== 'swim' || f.alpha < 0.6) continue;
      p = fishingPx(f);
      // Uusi laji on utelias ja tulee kauempaakin
      d = Math.hypot(p.x - b.x, p.y - b.y) * (fishingIsNew(f.sp) ? 0.4 : 1);
      if (d < bd) { bd = d; cand = f; }
    }
    if (cand && (bd < L.W * 0.22 || fishing.waitAll > 2.5)) {
      fishing.hooked = cand;
      cand.mode = 'come';
      cand.arrived = false;
    }
    return;
  }
  if (fishing.st === 'nibble') {
    k = Math.floor(fishing.stT / FISHING_NIBBLE);
    if (k >= fishing.nibDone && fishing.nibDone < fishing.nibN) {
      fishing.nibDone++;
      b = fishingBobPx(L);
      fishingRipple(b.x, b.y, false);
      playNote(1100, 0, 0.05, 'sine', 0.15);
    }
    if (fishing.stT >= fishing.nibN * FISHING_NIBBLE + 0.15) fishingBite(L);
    return;
  }
  if (fishing.st === 'bite') {
    if (fishing.stT > FISHING_BITE) fishingLetGo(false);
    return;
  }
  if (fishing.st === 'reel') {
    rate = holding ? 1.9 : 1;
    fishing.reelK = Math.min(1, fishing.reelK + dt * rate / FISHING_REEL);
    fishing.reelTick -= dt * rate;
    e = fishingReelEnd(L);
    k = easeInOutSine(fishing.reelK);
    if (fishing.reelTick <= 0) {
      fishing.reelTick = 0.16;
      playNote(1500, 0, 0.03, 'square', 0.05);
      p = { x: fishing.catchX + (e.x - fishing.catchX) * k, y: fishing.catchY + (e.y - fishing.catchY) * k };
      if (Math.random() < 0.6) fishingRipple(p.x, p.y, false);
      if (Math.random() < 0.5) spawnSparkles(p.x, p.y, 2, '#e8f8ff');
    }
    if (fishing.reelK >= 1) fishingShowStart(L);
    return;
  }
  if (fishing.st === 'show') {
    if (fishing.stT >= FISHING_SHOW) fishingDispatch();
  }
}
// Rauhallinen hetki: ei tärppiä, kelausta eikä saaliskorttia
function fishingCalm() {
  var st = fishing.st;
  return st === 'idle' || st === 'won' || st === 'wait' || st === 'nibble' || st === 'cast';
}
function fishingWinShine() {
  var i, sl;
  for (i = 0; i < FISHING_SPECIES.length; i++) {
    if (!fishing.book[i]) continue;
    sl = fishingSlot(i);
    fishing.slotPop[i] = 0.4 + i * 0.05;
    spawnSparkles(sl.x, sl.y, 4, fishing.golden ? '#ffd24f' : '#ffffff');
  }
  for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 1319, 1568][i], i * 0.1, 0.25, 'triangle', 0.3);
}

// ---------- Syöte ----------
function handleFishingTap(px, py) {
  var L, b, st = fishing.st;
  if (!running || celebrating || puzzleBusy()) return;
  L = fishingL();
  if (st === 'bite') { fishingHook(); return; }
  if (st === 'show') { if (fishing.stT > 0.6) fishingDispatch(); return; }
  // Kuu hymyilee (aurinko hoituu bgSunPoke-koukulla)
  if (fishingMoonTap(px, py, L)) return;
  if (propsTap(px, py)) return;
  if (st === 'reel' || st === 'cast' || st === 'won' || fishing.winT >= 0) return;
  if (py < L.top + L.H * 0.02) return;
  if (px < L.boatX + L.bs * 0.55 && py > L.boatY - L.H * 0.25) return;
  if (st === 'wait' || st === 'nibble') {
    b = fishingBobPx(L);
    if (Math.hypot(px - b.x, py - b.y) < L.H * 0.075) {
      fishing.bobWig = 0.4;
      // Liian aikainen napautus säikäyttää kalan (ensimmäisellä kalalla ei)
      if (st === 'nibble' && fishing.catches > 0) fishingLetGo(true);
      else playNote(880, 0, 0.06, 'sine', 0.12);
      return;
    }
  }
  fishingCast(px, py, L);
}
function fishingMoonTap(px, py, L) {
  var m = fishingMoonPos(L);
  if (!m || Math.hypot(px - m.x, py - m.y) > m.r * 1.6) return false;
  fishing.moonT = 1.4;
  spawnSparkles(m.x, m.y, 8, '#fff6c0');
  playNote(988, 0, 0.12, 'sine', 0.25);
  playNote(1319, 0.1, 0.2, 'sine', 0.25);
  return true;
}

// ---------- Tökättävät ----------
// Tuulimylly (siivet pyörähtävät, joka 3. tökkäys pöllähtää jauhoja),
// sorsaperhe (emo kvaakkaa, poikaset piipittävät ja hyppäävät), kivi (kuplii;
// joka 5. tökkäys: ystävällinen järvihirviö kurkistaa ja suihkuttaa
// vesisydämen), kaislikko (sudenkorento tekee silmukan, joka 5.: kolme
// korentoa tanssii), sammakko lumpeella (kurnuttaa, joka toinen hyppää),
// laiturin kissa (miukuu, joka 3.: kieriskelee), kyläläinen (vilkuttaa),
// yksisarvinen (hirnuu, sydämiä) ja prinsessa (hyppää).
function fishingSetupProps() {
  var L = fishingL(), W = L.W, H = L.H, top = L.top;
  propsReset();
  propAdd({
    x: W * 0.62, y: top - H * 0.004, r: H * 0.1, hy: H * 0.1, color: '#fff6e0', note: 523, amp: 0.04, ang: 0, spin: 0,
    update: function (p, dt) { p.ang += (0.5 + p.spin) * dt; p.spin *= Math.max(0, 1 - dt * 0.8); },
    draw: function (c, p) { fishingDrawMill(c, H, p.ang); },
    poke: function (p) {
      p.spin += 7;
      playNote(300, 0, 0.3, 'triangle', 0.08);
      playNote(400, 0.15, 0.3, 'triangle', 0.08);
      if (p.n % 3 === 0) spawnSparkles(p.x - H * 0.01, p.y - H * 0.05, 10, '#ffffff');
    }
  });
  propAdd({
    x: W * 0.45, y: top + H * 0.035, r: H * 0.06, hy: H * 0.02, color: '#ffe27a', note: 700, amp: 0.05, dir: 1,
    update: function (p, dt) {
      p.x += p.dir * W * 0.012 * dt;
      if (p.x > W * 0.74) p.dir = -1;
      if (p.x < W * 0.4) p.dir = 1;
    },
    draw: function (c, p) { fishingDrawDucks(c, H, p); },
    poke: function () {
      playNote(330, 0, 0.1, 'square', 0.1);
      playNote(300, 0.12, 0.12, 'square', 0.1);
      playNote(1568, 0.3, 0.06, 'sine', 0.15);
      playNote(1760, 0.4, 0.06, 'sine', 0.15);
      playNote(1568, 0.5, 0.06, 'sine', 0.15);
    }
  });
  propAdd({
    x: W * 0.82, y: top + H * 0.06, r: H * 0.045, hy: H * 0.015, color: '#bfe8ff', note: 330, amp: 0.05, mon: 0,
    update: function (p, dt) { if (p.mon > 0) p.mon -= dt; },
    draw: function (c, p) { fishingDrawRock(c, H, p); },
    poke: function (p) {
      fishingBubbles(p.x, p.y, 3);
      if (p.mon > 0) { playNote(1047, 0, 0.1, 'sine', 0.2); playNote(1319, 0.1, 0.12, 'sine', 0.2); return; }
      if (p.n % 5 === 0) {
        p.mon = 4.2;
        playNote(196, 0, 0.3, 'sine', 0.3);
        playNote(262, 0.3, 0.3, 'sine', 0.3);
        playNote(392, 0.6, 0.3, 'sine', 0.3);
        playNote(523, 1.4, 0.2, 'triangle', 0.25);
        playNote(659, 1.55, 0.2, 'triangle', 0.25);
        playNote(784, 1.7, 0.35, 'triangle', 0.25);
      }
    }
  });
  propAdd({
    x: W * 0.08, y: top + H * 0.1, r: H * 0.09, hy: H * 0.07, color: '#9fdc7f', note: 520, amp: 0.06, dance: 0,
    update: function (p, dt) { if (p.dance > 0) p.dance -= dt; },
    draw: function (c, p) { fishingDrawReeds(c, H, p); },
    poke: function (p) {
      if (p.n % 5 === 0) p.dance = 3;
      playNote(1319, 0.05, 0.06, 'sine', 0.12);
      playNote(1568, 0.12, 0.06, 'sine', 0.12);
    }
  });
  propAdd({
    x: W * 0.6, y: H * 0.885, r: H * 0.06, hy: H * 0.025, color: '#9fe07a', note: 262, amp: 0.08,
    draw: function (c, p) { fishingDrawLilyFrog(c, H, p); },
    poke: function (p) {
      playNote(196, 0, 0.12, 'square', 0.1);
      playNote(165, 0.12, 0.16, 'square', 0.1);
      if (p.n % 2 === 0) fishingRipple(p.x + H * 0.05, p.y, false);
    }
  });
  propAdd({
    x: L.catX, y: L.dockY, r: H * 0.06, hy: H * 0.045, color: '#ffb870', note: 880, amp: 0.06,
    draw: function (c, p) { fishingDrawCat(c, H, p); },
    poke: function () {
      playNote(784, 0, 0.12, 'triangle', 0.25);
      playNote(988, 0.1, 0.12, 'triangle', 0.25);
      playNote(740, 0.22, 0.2, 'triangle', 0.2);
    }
  });
  propAdd({
    x: L.villX, y: L.dockY, r: H * 0.08, hy: H * 0.08, color: '#ff9ec6', note: 659, amp: 0.04,
    draw: function (c, p) { fishingDrawVillager(c, H, p); },
    poke: function () {
      fishing.vill.wave = 1.2;
      if (fishing.order && !fishing.order.done) fishing.order.pop = 0.4;
      playNote(523, 0.05, 0.1, 'triangle', 0.2);
      playNote(659, 0.15, 0.14, 'triangle', 0.2);
    }
  });
  // Yksisarvinen ja prinsessa piirretään veneen kanssa; nämä ovat vain osuma-alueet
  propAdd({
    x: L.boatX - H * 0.06, y: L.boatY - H * 0.04, r: H * 0.08, hy: H * 0.06, color: '#ff9ec6', note: 0, amp: 0,
    draw: function () {},
    poke: function (p) {
      spawnSparkles(p.x + H * 0.04, p.y - H * 0.12, 8, '#ff9ec6');
      playNote(660, 0, 0.1, 'triangle', 0.2);
      playNote(880, 0.08, 0.1, 'triangle', 0.2);
      playNote(1100, 0.16, 0.18, 'triangle', 0.2);
    }
  });
  propAdd({
    x: L.boatX + H * 0.09, y: L.boatY - H * 0.03, r: H * 0.06, hy: H * 0.06, color: '#ffe27a', note: 0, amp: 0,
    draw: function () {},
    poke: function () { fishing.prHop = 0.5; }
  });
}

// ---------- Tausta ----------
function renderFishingBg(b, w, h) {
  var L = fishingL(), W = L.W, top = L.top, g, i, x, y;
  g = b.createLinearGradient(0, 0, 0, top);
  g.addColorStop(0, '#5fb4f0');
  g.addColorStop(0.6, '#bfe6ff');
  g.addColorStop(1, '#fff2dc');
  b.fillStyle = g;
  b.fillRect(0, 0, w, top + 2);
  drawCloud(b, W * 0.42, h * 0.16, h * 0.026, 0.85);
  drawCloud(b, W * 0.8, h * 0.22, h * 0.022, 0.8);
  drawCloud(b, W * 0.12, h * 0.25, h * 0.018, 0.7);
  // Järvi: vaalea kaukana, syvä lähellä
  g = b.createLinearGradient(0, top, 0, h);
  g.addColorStop(0, '#9adcf0');
  g.addColorStop(0.35, '#4fb0dc');
  g.addColorStop(1, '#2a74b0');
  b.fillStyle = g;
  b.fillRect(0, top, w, h - top);
  // Rannan heijastus
  b.fillStyle = 'rgba(90,160,90,0.18)';
  b.fillRect(0, top, w, h * 0.03);
  b.strokeStyle = 'rgba(255,255,255,0.2)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (y = top + h * 0.05; y < h; y += h * 0.05) {
    b.beginPath();
    for (x = -10; x <= w + 10; x += 14) {
      var wy = y + Math.sin(x / (h * 0.06) + y * 0.1) * h * 0.004;
      if (x === -10) b.moveTo(x, wy); else b.lineTo(x, wy);
    }
    b.stroke();
  }
  // Lumpeet (sammakon lumme on koriste)
  var lil = [[0.5, 0.82], [0.55, 0.9], [0.66, 0.8], [0.69, 0.92], [0.47, 0.93], [0.72, 0.86]];
  for (i = 0; i < lil.length; i++) {
    x = W * lil[i][0]; y = h * lil[i][1];
    fishingLilyPad(b, x, y, h * (0.03 + (i % 3) * 0.004), i);
    if (i % 2 === 0) drawFlower(b, x + h * 0.01, y - h * 0.008, h * 0.011, i % 4 ? '#ffffff' : '#ff9ec6');
  }
  // Rantakivet oikeassa alakulmassa
  for (i = 0; i < 6; i++) {
    x = W * (0.8 + i * 0.04); y = h * (0.97 - (i % 2) * 0.03);
    artBlob(b, x, y, h * (0.04 + (i % 3) * 0.01), h * 0.025, i % 2 ? '#9a9aa8' : '#b0aab0', { lineColor: '#5a5a68', hi: 0.25 });
  }
  // Matalia kaisloja hauen apajalla (tökättävä kaislikko on vasemmalla)
  for (i = 0; i < 5; i++) {
    x = W * 0.37 + i * h * 0.016;
    artLimb(b, x, top + h * 0.05, x + h * 0.006, top + h * (0.015 - (i % 2) * 0.012), Math.max(2, h * 0.005), '#5fb356', '#2e7a3a');
  }
  // Kaisloja vasemmassa alakulmassa veneen takana
  for (i = 0; i < 6; i++) {
    x = W * 0.01 + i * h * 0.018;
    artLimb(b, x, h, x + h * 0.01, h * (0.86 - (i % 2) * 0.04), Math.max(2, h * 0.006), '#5fb356', '#2e7a3a');
  }
  fishingDrawDock(b, L);
}
function fishingLilyPad(c, x, y, r, i) {
  c.beginPath();
  c.moveTo(x, y);
  c.arc(x, y, r, 0.25 + i * 0.4, Math.PI * 2 - 0.25 + i * 0.4);
  c.closePath();
  c.save();
  c.translate(x, y); c.scale(1, 0.45); c.translate(-x, -y);
  artFillPath(c, '#5fbf4a', y - r, y + r, r, { lineColor: '#2e7a3a' });
  c.restore();
}
function fishingDrawDock(b, L) {
  var H = L.H, x0 = L.dockX, y = L.dockY, w = L.W - x0 + H * 0.02, i, n;
  for (i = 0; i < 4; i++) {
    var px = x0 + H * 0.02 + i * (w - H * 0.04) / 3;
    artRoundRect(b, px - H * 0.01, y, H * 0.02, H * 0.1, H * 0.006, '#7a4a28', { lineColor: '#3a2010' });
    b.fillStyle = 'rgba(40,60,90,0.25)';
    b.fillRect(px - H * 0.01, y + H * 0.1, H * 0.02, H * 0.04);
  }
  artRoundRect(b, x0, y - H * 0.012, w, H * 0.034, H * 0.008, '#b8844e', { lineColor: '#5a3a1e' });
  b.strokeStyle = 'rgba(90,58,30,0.45)';
  b.lineWidth = Math.max(1, H * 0.003);
  n = Math.floor(w / (H * 0.04));
  for (i = 1; i < n; i++) { b.beginPath(); b.moveTo(x0 + i * H * 0.04, y - H * 0.01); b.lineTo(x0 + i * H * 0.04, y + H * 0.02); b.stroke(); }
}
// Kaukainen ranta omalle kankaalleen: aurinko laskee sen taakse
function fishingBuildShore() {
  var L = fishingL(), cv, b;
  if (!L.W || !L.H) return;
  if (!fishing.shore) fishing.shore = document.createElement('canvas');
  cv = fishing.shore;
  cv.width = Math.max(1, Math.round(L.W));
  cv.height = Math.max(1, Math.round(L.top + L.H * 0.012));
  b = cv.getContext('2d');
  b.clearRect(0, 0, cv.width, cv.height);
  fishingRenderShore(b, L);
}
function fishingRenderShore(b, L) {
  var W = L.W, H = L.H, top = L.top, x, i, tx;
  b.fillStyle = artMix('#8fc8a0', '#e8f4ff', 0.5);
  b.beginPath(); b.moveTo(0, top);
  for (x = 0; x <= W; x += 10) b.lineTo(x, top - H * 0.1 - Math.sin(x / W * 5 + 1) * H * 0.03 - Math.sin(x / W * 13) * H * 0.008);
  b.lineTo(W, top); b.closePath(); b.fill();
  b.fillStyle = '#9fd46a';
  b.beginPath(); b.moveTo(0, top);
  for (x = 0; x <= W; x += 10) b.lineTo(x, top - H * 0.05 - Math.sin(x / W * 4 + 2.2) * H * 0.018);
  b.lineTo(W, top); b.closePath(); b.fill();
  // Pellot: raidat ja vehnäpelto
  b.strokeStyle = 'rgba(80,140,40,0.35)';
  b.lineWidth = Math.max(1, H * 0.003);
  for (i = 0; i < 14; i++) {
    x = W * (0.3 + i * 0.03);
    b.beginPath(); b.moveTo(x, top - H * 0.035); b.lineTo(x - W * 0.03, top - H * 0.005); b.stroke();
  }
  b.fillStyle = '#f0d060';
  b.beginPath(); b.moveTo(W * 0.72, top - H * 0.045); b.lineTo(W * 0.82, top - H * 0.05); b.lineTo(W * 0.84, top - H * 0.012); b.lineTo(W * 0.7, top - H * 0.01); b.closePath(); b.fill();
  // Puita
  var trees = [0.05, 0.09, 0.33, 0.47, 0.76, 0.97];
  for (i = 0; i < trees.length; i++) {
    tx = W * trees[i];
    artLimb(b, tx, top - H * 0.01, tx, top - H * 0.045, Math.max(2, H * 0.008), '#7a4a28', '#3a2010');
    artCircle(b, tx, top - H * (0.065 + (i % 2) * 0.01), H * (0.03 + (i % 3) * 0.006), i % 2 ? '#4fa04a' : '#5fb356', { lineColor: '#2a6a2a', hi: 0.25 });
  }
  // Kylän talot vasemmalla ja punainen lato oikealla
  fishingHouse(b, W * 0.17, top - H * 0.012, H * 0.045, '#fff0d8', '#d8443a');
  fishingHouse(b, W * 0.24, top - H * 0.016, H * 0.038, '#ffe08a', '#5a7ac8');
  fishingHouse(b, W * 0.88, top - H * 0.012, H * 0.06, '#d8443a', '#7a2a20');
  // Aita rannalla
  b.strokeStyle = '#fff6e0';
  b.lineWidth = Math.max(1, H * 0.004);
  b.beginPath(); b.moveTo(W * 0.66, top - H * 0.02); b.lineTo(W, top - H * 0.02); b.stroke();
  for (x = W * 0.66; x < W; x += H * 0.025) { b.beginPath(); b.moveTo(x, top - H * 0.008); b.lineTo(x, top - H * 0.03); b.stroke(); }
  // Rantapenkka
  b.fillStyle = '#7cc060';
  b.fillRect(0, top - H * 0.012, W, H * 0.016);
  b.fillStyle = '#5a9a48';
  b.fillRect(0, top + H * 0.002, W, H * 0.01);
}
function fishingHouse(b, x, y, s, wall, roof) {
  artRoundRect(b, x - s * 0.6, y - s * 0.75, s * 1.2, s * 0.75, s * 0.05, wall, { lineColor: artShade(wall, -0.5) });
  b.beginPath(); b.moveTo(x - s * 0.75, y - s * 0.72); b.lineTo(x, y - s * 1.25); b.lineTo(x + s * 0.75, y - s * 0.72); b.closePath();
  artFillPath(b, roof, y - s * 1.25, y - s * 0.72, s * 0.5, { lineColor: artShade(roof, -0.5) });
  artRoundRect(b, x - s * 0.15, y - s * 0.4, s * 0.3, s * 0.4, s * 0.05, '#8a5a30', { lineColor: '#3a2010' });
  artRoundRect(b, x + s * 0.25, y - s * 0.6, s * 0.22, s * 0.18, s * 0.03, '#ffe9a0', { lineColor: '#5a3a1e' });
}

// ---------- Piirto: koristeet ----------
function fishingDrawMill(c, H, ang) {
  var i, a, s = H;
  c.beginPath();
  c.moveTo(-s * 0.03, 0); c.lineTo(-s * 0.02, -s * 0.11); c.lineTo(s * 0.02, -s * 0.11); c.lineTo(s * 0.03, 0); c.closePath();
  artFillPath(c, '#fff6e0', -s * 0.11, 0, s * 0.03, { lineColor: '#8a6a40', shadeTo: '#e8d8c0' });
  c.beginPath(); c.moveTo(-s * 0.03, -s * 0.105); c.lineTo(0, -s * 0.14); c.lineTo(s * 0.03, -s * 0.105); c.closePath();
  artFillPath(c, '#d8443a', -s * 0.14, -s * 0.105, s * 0.02, { lineColor: '#7a2010' });
  artRoundRect(c, -s * 0.008, -s * 0.025, s * 0.016, s * 0.025, s * 0.006, '#8a5a30', { lineColor: '#3a2010' });
  artCircle(c, 0, -s * 0.07, s * 0.006, '#ffe9a0', { lineColor: '#5a3a1e' });
  for (i = 0; i < 4; i++) {
    a = ang + i * Math.PI / 2;
    c.save();
    c.translate(0, -s * 0.115);
    c.rotate(a);
    artRoundRect(c, -s * 0.004, -s * 0.085, s * 0.008, s * 0.085, s * 0.003, '#7a4a28', { line: false });
    artRoundRect(c, s * 0.002, -s * 0.08, s * 0.018, s * 0.065, s * 0.003, '#fff6e0', { lineColor: '#8a6a40' });
    c.restore();
  }
  artCircle(c, 0, -s * 0.115, s * 0.007, '#7a4a28', { lineColor: '#3a2010' });
}
function fishingDrawDucks(c, H, p) {
  var i, s = H * 0.016, hop, dir = p.dir, k = p.t >= 0 ? p.t : -1;
  c.save();
  c.scale(dir, 1);
  for (i = 3; i >= 0; i--) {
    var x = -i * s * 2.6, ss = i === 0 ? s : s * 0.6;
    hop = k >= 0 && i > 0 ? Math.max(0, Math.sin((k - 0.25 - i * 0.1) * 9)) * s * 0.8 * (k < 0.8 ? 1 : 0) : 0;
    if (k >= 0 && i === 0) hop = Math.sin(Math.min(1, k / 0.3) * Math.PI) * s * 0.3;
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = Math.max(1, s * 0.12);
    fishingOval(c, x, 0, ss * 1.3, ss * 0.3);
    c.stroke();
    artBlob(c, x, -ss * 0.4 - hop, ss * 1.1, ss * 0.6, i === 0 ? '#c89a5a' : '#ffd84a', { lineColor: i === 0 ? '#6a4a20' : '#b08a10', hi: 0.3 });
    artCircle(c, x + ss * 0.8, -ss * 1.1 - hop, ss * 0.5, i === 0 ? '#3a8a4a' : '#ffd84a', { lineColor: i === 0 ? '#1a4a22' : '#b08a10' });
    artBlob(c, x + ss * 1.35, -ss * 1.0 - hop, ss * 0.3, ss * 0.13, '#ff9a2a', { lineColor: '#a05a10' });
    artEye(c, x + ss * 0.95, -ss * 1.2 - hop, ss * 0.13, 0.5, false);
  }
  c.restore();
}
function fishingDrawRock(c, H, p) {
  var s = H * 0.03, m = p.mon, k, up, i;
  if (m > 0) {
    // Järvihirviö nousee kiven takaa: kaula, pää, kukka päälaella
    k = 4.2 - m;
    up = Math.min(1, k / 0.6) * (m < 0.6 ? m / 0.6 : 1);
    c.save();
    c.translate(s * 0.8, 0);
    for (i = 0; i < 4; i++) artCircle(c, i * s * 0.18, -i * s * 0.75 * up, s * (0.55 - i * 0.04), '#6fcf8a', { lineColor: '#2a7a4a', hi: 0.3 });
    var hx = s * 0.75, hy = -s * 3.0 * up;
    artBlob(c, hx, hy, s * 0.8, s * 0.6, '#6fcf8a', { lineColor: '#2a7a4a', hi: 0.35 });
    artEye(c, hx + s * 0.1, hy - s * 0.15, s * 0.18, 0.3, k > 1.8 && k < 2.0);
    artEye(c, hx + s * 0.5, hy - s * 0.15, s * 0.16, 0.3, k > 1.8 && k < 2.0);
    artBlush(c, hx + s * 0.6, hy + s * 0.2, s * 0.12);
    c.strokeStyle = '#1a4a2a';
    c.lineWidth = Math.max(1, s * 0.08);
    c.beginPath(); c.arc(hx + s * 0.35, hy + s * 0.1, s * 0.25, 0.3, Math.PI - 0.3); c.stroke();
    drawFlower(c, hx - s * 0.2, hy - s * 0.6, s * 0.25, '#ff9ec6');
    if (k > 1.2 && k < 3.2) {
      // Vesisuihku ja sydän
      var hk = (k - 1.2) / 2;
      c.globalAlpha = Math.max(0, 1 - hk);
      c.fillStyle = '#bfefff';
      for (i = 0; i < 4; i++) { c.beginPath(); c.arc(hx + s * 0.3, hy - s * (0.8 + i * 0.4) - hk * s, s * 0.1, 0, Math.PI * 2); c.fill(); }
      drawTaskGlyph(c, 'heart', hx + s * 0.3, hy - s * 2.6 - hk * s * 1.5, s * (0.5 + hk * 0.4), '#7fd4ff', true);
      c.globalAlpha = 1;
    }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = Math.max(1, s * 0.08);
    fishingOval(c, s * 1.3, 0, s * 1.0, s * 0.25);
    c.stroke();
  }
  artBlob(c, 0, -s * 0.2, s * 1.1, s * 0.6, '#9a9aa8', { lineColor: '#4a4a58', hi: 0.3 });
  artBlob(c, -s * 0.3, -s * 0.6, s * 0.5, s * 0.15, '#6fbf5a', { line: false });
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1, s * 0.08);
  fishingOval(c, 0, s * 0.15, s * 1.4, s * 0.3);
  c.stroke();
}
function fishingDrawReeds(c, H, p) {
  var i, s = H, dx, top, k, fx, fy, n, j;
  for (i = 0; i < 7; i++) {
    dx = (i - 3) * s * 0.012 + Math.sin(globalT * 1.2 + i) * s * 0.002;
    top = -s * (0.1 + (i % 3) * 0.025);
    artLimb(c, (i - 3) * s * 0.01, 0, dx, top, Math.max(2, s * 0.005), '#4fb356', '#2e7a3a');
    if (i % 2 === 0) artBlob(c, dx, top + s * 0.012, s * 0.006, s * 0.018, '#8a5a30', { lineColor: '#5a3a1e' });
  }
  artBlob(c, s * 0.02, -s * 0.03, s * 0.012, s * 0.04, '#5fbf4a', { lineColor: '#2e7a3a', rot: 0.4 });
  // Sudenkorento: leijuu latvassa, tökkäyksestä silmukka; tanssissa kolme
  n = p.dance > 0 ? 3 : 1;
  for (j = 0; j < n; j++) {
    k = p.t >= 0 && j === 0 ? Math.min(1, p.t / 1.2) : 0;
    fx = s * 0.025 + Math.sin(globalT * 1.5 + j * 2) * s * 0.008;
    fy = -s * 0.15 + Math.sin(globalT * 3 + j) * s * 0.004;
    if (k > 0 && k < 1) { fx += Math.sin(k * Math.PI * 2) * s * 0.06; fy -= (1 - Math.cos(k * Math.PI * 2)) * s * 0.04; }
    if (j > 0) { fx += Math.cos(globalT * 3 + j * 2.1) * s * 0.05; fy += Math.sin(globalT * 3 + j * 2.1) * s * 0.03 - s * 0.02; }
    fishingDragonfly(c, fx, fy, s * 0.02, ['#5fd0ff', '#ff7bac', '#ffd24f'][j]);
  }
}
function fishingDragonfly(c, x, y, s, col) {
  var fl = Math.sin(globalT * 40) * 0.4;
  artBlob(c, x - s * 0.2, y - s * 0.3, s * 0.7, s * 0.22, '#ffffff', { line: false, alpha: 0.65, rot: -0.5 + fl });
  artBlob(c, x + s * 0.2, y - s * 0.3, s * 0.7, s * 0.22, '#ffffff', { line: false, alpha: 0.65, rot: 0.5 - fl });
  artLimb(c, x - s * 1.1, y, x + s * 0.6, y, Math.max(1.5, s * 0.25), col, artShade(col, -0.5));
  artCircle(c, x + s * 0.75, y, s * 0.25, col, { lineColor: artShade(col, -0.5) });
}
function fishingDrawLilyFrog(c, H, p) {
  var s = H * 0.022, k = p.t, jump = 0, jx = 0, blow = 0;
  fishingLilyPad(c, 0, 0, H * 0.035, 3);
  if (k >= 0 && p.n % 2 === 0 && k < 1.0) {
    jump = Math.sin(Math.min(1, k) * Math.PI) * s * 2.5;
    jx = Math.sin(Math.min(1, k) * Math.PI) * H * 0.05;
  }
  if (k >= 0 && k < 0.8) blow = Math.sin(k / 0.8 * Math.PI);
  c.save();
  c.translate(jx, -jump);
  artBlob(c, 0, -s * 0.5, s * 0.9, s * 0.6, '#7fd45a', { lineColor: '#3a8a3a', hi: 0.35 });
  if (blow > 0) artCircle(c, s * 0.1, -s * 0.15, s * 0.45 * blow, '#ffb0d0', { lineColor: '#c96a9a' });
  artCircle(c, -s * 0.4, -s * 1.0, s * 0.3, '#7fd45a', { lineColor: '#3a8a3a' });
  artCircle(c, s * 0.4, -s * 1.0, s * 0.3, '#7fd45a', { lineColor: '#3a8a3a' });
  artEye(c, -s * 0.4, -s * 1.0, s * 0.14, 0.2, k >= 0 && k < 0.15);
  artEye(c, s * 0.4, -s * 1.0, s * 0.14, 0.2, k >= 0 && k < 0.15);
  artBlush(c, -s * 0.7, -s * 0.55, s * 0.12);
  artBlush(c, s * 0.7, -s * 0.55, s * 0.12);
  c.restore();
}
function fishingDrawCat(c, H, p) {
  var s = H * 0.009, cat = fishing.cat, jump = 0, puff = 1, munch = 0, roll = p.t >= 0 && p.n % 3 === 0, tail, hx, hy;
  if (cat.jump > 0) { jump = Math.sin(Math.min(1, (1 - cat.jump) / 0.6) * Math.PI) * s * 6; puff = 1.15; }
  if (cat.eat > 0) munch = Math.abs(Math.sin(cat.eat * 12)) * s * 0.5;
  artShadow(c, 0, 0, s * 4, s * 1, 0.2);
  c.save();
  c.translate(0, -jump);
  if (roll) { c.translate(0, -s * 3); c.rotate(Math.sin(Math.min(1, p.t / 1.2) * Math.PI) * 0.9); c.translate(0, s * 3); }
  c.scale(puff, puff);
  tail = Math.sin(globalT * 2.5) * 0.4 + (p.t >= 0 ? Math.sin(p.t * 14) * 0.5 : 0);
  c.lineCap = 'round';
  c.strokeStyle = '#a0602a';
  c.lineWidth = s * 1.6;
  c.beginPath(); c.moveTo(s * 2.4, -s * 1); c.quadraticCurveTo(s * 5, -s * 2 + tail * s * 2, s * 4.2, -s * 5 + tail * s * 2); c.stroke();
  c.strokeStyle = '#f0a050';
  c.lineWidth = s * 1.1;
  c.stroke();
  artBlob(c, 0, -s * 3, s * 3, s * 3.2, '#f0a050', { lineColor: '#8a4a1a', hi: 0.3 });
  artBlob(c, -s * 0.6, -s * 2.2, s * 1.4, s * 1.8, '#fff0d8', { line: false });
  hx = -s * 1.4; hy = -s * 7 + munch;
  c.beginPath(); c.moveTo(hx - s * 2.2, hy - s * 0.8); c.lineTo(hx - s * 1.7, hy - s * 3.2); c.lineTo(hx - s * 0.6, hy - s * 1.8); c.closePath();
  artFillPath(c, '#f0a050', hy - s * 3.2, hy - s * 0.8, s, { lineColor: '#8a4a1a' });
  c.beginPath(); c.moveTo(hx + s * 2.2, hy - s * 0.8); c.lineTo(hx + s * 1.7, hy - s * 3.2); c.lineTo(hx + s * 0.6, hy - s * 1.8); c.closePath();
  artFillPath(c, '#f0a050', hy - s * 3.2, hy - s * 0.8, s, { lineColor: '#8a4a1a' });
  artCircle(c, hx, hy, s * 2.4, '#f0a050', { lineColor: '#8a4a1a', hi: 0.3 });
  var happy = cat.eat > 0 || (p.t >= 0 && p.t < 0.5);
  if (happy) {
    c.strokeStyle = '#3a2010';
    c.lineWidth = Math.max(1, s * 0.3);
    c.beginPath(); c.arc(hx - s * 0.9, hy, s * 0.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(hx + s * 0.5, hy, s * 0.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    artEye(c, hx - s * 0.9, hy - s * 0.1, s * 0.5, -0.6, cat.jump > 0 && cat.jump < 0.2);
    artEye(c, hx + s * 0.5, hy - s * 0.1, s * 0.5, -0.6, false);
  }
  artBlush(c, hx - s * 1.5, hy + s * 0.7, s * 0.4);
  artCircle(c, hx - s * 0.2, hy + s * 0.6, s * 0.3, '#ff7bac', { line: false });
  c.strokeStyle = 'rgba(60,30,10,0.6)';
  c.lineWidth = Math.max(1, s * 0.15);
  c.beginPath();
  c.moveTo(hx - s * 1, hy + s * 0.8); c.lineTo(hx - s * 3, hy + s * 0.5);
  c.moveTo(hx - s * 1, hy + s * 1); c.lineTo(hx - s * 3, hy + s * 1.3);
  c.stroke();
  if (cat.eat > 0) fishingDrawThing(c, 0, hx - s * 2.2, hy + s * 1.3, s * 1.3, 0.5, -1, false);
  if (cat.hat > 0) {
    c.save();
    c.translate(hx, hy - s * 2.6);
    c.rotate(-0.2);
    fishingDrawThing(c, 6, 0, 0, s * 2.2, 0.5, 1, false);
    c.restore();
  }
  c.restore();
  if (cat.jump > 0.3) {
    c.fillStyle = '#ff5f5f';
    c.font = 'bold ' + Math.round(s * 4) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', -s * 1, -s * 14 - jump);
  }
}
function fishingDrawVillager(c, H, p) {
  var s = H * 0.01, v = fishing.vill, wave = v.wave > 0 ? Math.sin(v.wave * 12) * 0.5 : 0, joy = v.joy > 0 ? Math.abs(Math.sin(v.joy * 8)) * s * 1.5 : 0, B = { x: s * 6.5, y: 0 };
  artShadow(c, 0, 0, s * 3.5, s * 0.9, 0.2);
  // Ämpäri
  artRoundRect(c, B.x - s * 1.6, -s * 2.6, s * 3.2, s * 2.6, s * 0.4, '#a8b8c8', { lineColor: '#4a5a6a', hi: 0.3 });
  c.strokeStyle = '#4a5a6a';
  c.lineWidth = Math.max(1, s * 0.25);
  c.beginPath(); c.arc(B.x, -s * 2.6, s * 1.5, Math.PI, 0); c.stroke();
  c.save();
  c.translate(0, -joy);
  artLimb(c, -s * 0.8, -s * 2.5, -s * 0.9, 0, s * 0.9, '#ffd9b8', '#c99a7a');
  artLimb(c, s * 0.8, -s * 2.5, s * 0.9, 0, s * 0.9, '#ffd9b8', '#c99a7a');
  c.beginPath(); c.moveTo(-s * 2.2, -s * 2.2); c.lineTo(-s * 1.4, -s * 8.5); c.lineTo(s * 1.4, -s * 8.5); c.lineTo(s * 2.2, -s * 2.2); c.closePath();
  artFillPath(c, '#5a8ae0', -s * 8.5, -s * 2.2, s * 2, { lineColor: '#2a4a8a' });
  artRoundRect(c, -s * 1.2, -s * 7, s * 2.4, s * 4.4, s * 0.5, '#ffffff', { lineColor: '#c9c0d8', shadeTo: '#ece4f8' });
  // Kädet: toinen vilkuttaa tai molemmat ylhäällä ilosta
  artLimb(c, s * 1.3, -s * 7.6, s * 3.2, -s * (v.joy > 0 ? 11 : 9.5) + wave * s * 2, s * 0.9, '#5a8ae0', '#2a4a8a');
  artLimb(c, -s * 1.3, -s * 7.6, -s * (v.joy > 0 ? 3.2 : 2.2), -s * (v.joy > 0 ? 11 : 4.8), s * 0.9, '#5a8ae0', '#2a4a8a');
  artCircle(c, s * 3.2, -s * (v.joy > 0 ? 11 : 9.5) + wave * s * 2, s * 0.6, '#ffd9b8', { lineColor: '#c99a7a' });
  artCircle(c, -s * (v.joy > 0 ? 3.2 : 2.2), -s * (v.joy > 0 ? 11 : 4.8), s * 0.6, '#ffd9b8', { lineColor: '#c99a7a' });
  artCircle(c, 0, -s * 10.8, s * 2.3, '#ffd9b8', { lineColor: '#c99a7a', hi: 0.25 });
  artEye(c, -s * 0.8, -s * 11, s * 0.35, -0.4, (globalT % 3.5) < 0.12);
  artEye(c, s * 0.6, -s * 11, s * 0.35, -0.4, (globalT % 3.5) < 0.12);
  artBlush(c, -s * 1.3, -s * 10.2, s * 0.45);
  artBlush(c, s * 1.2, -s * 10.2, s * 0.45);
  c.strokeStyle = '#8a3a2a';
  c.lineWidth = Math.max(1, s * 0.25);
  c.beginPath(); c.arc(-s * 0.1, -s * 10.2, s * 0.7, 0.3, Math.PI - 0.3); c.stroke();
  // Olkihattu
  artBlob(c, 0, -s * 12.6, s * 3.6, s * 0.8, '#f0d060', { lineColor: '#9a7a20' });
  artBlob(c, 0, -s * 13.4, s * 1.9, s * 1.2, '#f0d060', { lineColor: '#9a7a20', hi: 0.3 });
  artRoundRect(c, -s * 1.9, -s * 13.2, s * 3.8, s * 0.6, s * 0.2, '#e0403a', { line: false });
  c.restore();
}

// ---------- Piirto: saaliit ----------
// s = puolipituus; dir 1 = oikealle; open = arkun kansi auki
function fishingDrawThing(c, sp, x, y, s, v, dir, open) {
  var id = FISHING_SPECIES[sp].id, i, col;
  c.save();
  c.translate(x, y);
  if (dir < 0) c.scale(-1, 1);
  if (id === 'perch') {
    col = artShade('#9cc04a', (v - 0.5) * 0.3);
    fishingTail(c, s, '#ff8a4a');
    c.beginPath(); c.moveTo(-s * 0.45, -s * 0.35); c.lineTo(-s * 0.3, -s * 0.85); c.lineTo(-s * 0.1, -s * 0.5); c.lineTo(s * 0.05, -s * 0.85); c.lineTo(s * 0.25, -s * 0.42); c.closePath();
    artFillPath(c, '#ff8a4a', -s * 0.85, -s * 0.35, s * 0.4, { lineColor: '#a04a1a' });
    artBlob(c, 0, 0, s, s * 0.55, col, { lineColor: '#4a6a1a', hi: 0.35 });
    c.save();
    fishingOval(c, 0, 0, s * 0.95, s * 0.5);
    c.clip();
    c.fillStyle = 'rgba(40,70,20,0.4)';
    for (i = 0; i < 4; i++) c.fillRect(-s * 0.6 + i * s * 0.3, -s * 0.6, s * 0.12, s * 0.85);
    c.restore();
    artBlob(c, s * 0.1, s * 0.3, s * 0.55, s * 0.16, '#f4f0c0', { line: false, alpha: 0.8 });
    fishingFace(c, s, s * 0.6);
  } else if (id === 'pike') {
    col = artShade('#6aa04a', (v - 0.5) * 0.3);
    fishingTail(c, s * 0.85, '#8ab04a');
    c.beginPath(); c.moveTo(-s * 0.7, -s * 0.2); c.lineTo(-s * 0.5, -s * 0.5); c.lineTo(-s * 0.3, -s * 0.22); c.closePath();
    artFillPath(c, '#8ab04a', -s * 0.5, -s * 0.2, s * 0.2, { lineColor: '#3a5a1a' });
    c.beginPath();
    c.moveTo(-s * 0.9, 0);
    c.quadraticCurveTo(-s * 0.6, -s * 0.36, s * 0.5, -s * 0.28);
    c.lineTo(s * 1.3, -s * 0.05);
    c.lineTo(s * 1.25, s * 0.08);
    c.quadraticCurveTo(s * 0.4, s * 0.36, -s * 0.9, 0);
    c.closePath();
    artFillPath(c, col, -s * 0.36, s * 0.36, s * 0.35, { lineColor: '#2a4a1a' });
    c.fillStyle = 'rgba(230,250,170,0.7)';
    for (i = 0; i < 6; i++) { fishingOval(c, -s * 0.6 + i * s * 0.25, -s * 0.08 + (i % 2) * s * 0.1, s * 0.06, s * 0.03); c.fill(); }
    fishingFace(c, s * 0.7, s * 0.85);
  } else if (id === 'gold') {
    col = artShade('#ffa52a', (v - 0.5) * 0.25);
    artBlob(c, -s * 0.85, -s * 0.3, s * 0.45, s * 0.25, '#ffd24f', { lineColor: '#c07010', rot: -0.6 });
    artBlob(c, -s * 0.85, s * 0.3, s * 0.45, s * 0.25, '#ffd24f', { lineColor: '#c07010', rot: 0.6 });
    artBlob(c, -s * 0.1, -s * 0.55, s * 0.35, s * 0.18, '#ffd24f', { lineColor: '#c07010', rot: -0.3 });
    artBlob(c, 0, 0, s * 0.8, s * 0.62, col, { lineColor: '#a05a10', hi: 0.45 });
    artBlob(c, -s * 0.1, s * 0.25, s * 0.4, s * 0.2, '#fff0c0', { line: false, alpha: 0.8 });
    fishingFace(c, s * 0.85, s * 0.42);
  } else if (id === 'salmon') {
    col = artShade('#c8d0dc', (v - 0.5) * 0.2);
    fishingTail(c, s, '#a8b0c0');
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.38); c.quadraticCurveTo(-s * 0.1, -s * 0.8, s * 0.2, -s * 0.4); c.closePath();
    artFillPath(c, '#a8b0c0', -s * 0.8, -s * 0.38, s * 0.3, { lineColor: '#5a6070' });
    artBlob(c, 0, 0, s, s * 0.45, col, { lineColor: '#5a6070', hi: 0.45 });
    artBlob(c, 0, s * 0.05, s * 0.8, s * 0.1, '#ff9aa8', { line: false, alpha: 0.85 });
    c.fillStyle = 'rgba(40,50,70,0.6)';
    for (i = 0; i < 5; i++) { c.beginPath(); c.arc(-s * 0.5 + i * s * 0.22, -s * 0.22 + (i % 2) * s * 0.06, s * 0.035, 0, Math.PI * 2); c.fill(); }
    fishingFace(c, s, s * 0.6);
  } else if (id === 'crab') {
    col = artShade('#e0503a', (v - 0.5) * 0.25);
    c.lineCap = 'round';
    for (i = 0; i < 3; i++) {
      artLimb(c, -s * 0.3 + i * s * 0.25, s * 0.2, -s * 0.5 + i * s * 0.25, s * 0.55, Math.max(1.5, s * 0.08), col, '#7a1a10');
    }
    artLimb(c, s * 0.3, -s * 0.05, s * 0.75, -s * 0.35, Math.max(2, s * 0.12), col, '#7a1a10');
    artLimb(c, s * 0.3, s * 0.1, s * 0.8, s * 0.15, Math.max(2, s * 0.12), col, '#7a1a10');
    artBlob(c, s * 0.95, -s * 0.45, s * 0.3, s * 0.2, col, { lineColor: '#7a1a10', rot: -0.4, hi: 0.3 });
    artBlob(c, s * 1.0, s * 0.15, s * 0.3, s * 0.2, col, { lineColor: '#7a1a10', rot: 0.2, hi: 0.3 });
    artBlob(c, -s * 0.5, s * 0.05, s * 0.45, s * 0.25, artShade(col, -0.1), { lineColor: '#7a1a10' });
    artBlob(c, 0, 0, s * 0.6, s * 0.38, col, { lineColor: '#7a1a10', hi: 0.4 });
    artLimb(c, s * 0.3, -s * 0.25, s * 0.35, -s * 0.5, Math.max(1, s * 0.06), col, '#7a1a10');
    artLimb(c, s * 0.1, -s * 0.25, s * 0.1, -s * 0.5, Math.max(1, s * 0.06), col, '#7a1a10');
    artEye(c, s * 0.35, -s * 0.55, s * 0.12, 0.4, false);
    artEye(c, s * 0.1, -s * 0.55, s * 0.12, 0.4, false);
    c.strokeStyle = '#7a1a10';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.arc(s * 0.3, -s * 0.05, s * 0.12, 0.3, Math.PI - 0.3); c.stroke();
  } else if (id === 'frog') {
    col = artShade('#7fd45a', (v - 0.5) * 0.25);
    artBlob(c, -s * 0.5, s * 0.25, s * 0.4, s * 0.18, col, { lineColor: '#3a8a3a' });
    artBlob(c, s * 0.5, s * 0.25, s * 0.4, s * 0.18, col, { lineColor: '#3a8a3a' });
    artBlob(c, 0, 0, s * 0.75, s * 0.5, col, { lineColor: '#3a8a3a', hi: 0.35 });
    artBlob(c, 0, s * 0.12, s * 0.45, s * 0.25, '#e8f8b0', { line: false });
    artCircle(c, -s * 0.35, -s * 0.45, s * 0.25, col, { lineColor: '#3a8a3a' });
    artCircle(c, s * 0.35, -s * 0.45, s * 0.25, col, { lineColor: '#3a8a3a' });
    artEye(c, -s * 0.35, -s * 0.45, s * 0.13, 0.2, false);
    artEye(c, s * 0.35, -s * 0.45, s * 0.13, 0.2, false);
    artBlush(c, -s * 0.5, -s * 0.05, s * 0.1);
    artBlush(c, s * 0.5, -s * 0.05, s * 0.1);
    c.strokeStyle = '#2e6a2a';
    c.lineWidth = Math.max(1, s * 0.06);
    c.beginPath(); c.arc(0, -s * 0.15, s * 0.3, 0.3, Math.PI - 0.3); c.stroke();
  } else if (id === 'boot') {
    artRoundRect(c, -s * 0.45, -s * 0.85, s * 0.6, s * 1.05, s * 0.12, '#8a5a30', { lineColor: '#3a2010', hi: 0.2 });
    artRoundRect(c, -s * 0.45, -s * 0.05, s * 1.15, s * 0.45, s * 0.2, '#8a5a30', { lineColor: '#3a2010' });
    artRoundRect(c, -s * 0.5, s * 0.3, s * 1.25, s * 0.14, s * 0.06, '#3a2a20', { line: false });
    artRoundRect(c, -s * 0.5, -s * 0.9, s * 0.7, s * 0.16, s * 0.06, '#a8743c', { lineColor: '#3a2010' });
    artLimb(c, s * 0.05, -s * 0.85, s * 0.25, -s * 0.3, Math.max(1.5, s * 0.07), '#4fb356', '#2e7a3a');
    artBlob(c, s * 0.3, -s * 0.25, s * 0.08, s * 0.12, '#9fe8ff', { lineColor: '#4a8ab0' });
  } else if (id === 'chest') {
    if (open) artGlow(c, 0, -s * 0.3, s * 1.3, '#ffd24f', 0.6);
    artRoundRect(c, -s * 0.8, -s * 0.2, s * 1.6, s * 0.8, s * 0.1, '#a8703c', { lineColor: '#4a2a10', hi: 0.2 });
    if (open) {
      for (i = 0; i < 5; i++) artCircle(c, -s * 0.5 + i * s * 0.25, -s * 0.25 - (i % 2) * s * 0.12, s * 0.14, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
      artRoundRect(c, -s * 0.8, -s * 0.95, s * 1.6, s * 0.35, s * 0.12, '#8a5a30', { lineColor: '#4a2a10' });
    } else {
      c.beginPath(); c.moveTo(-s * 0.8, -s * 0.2); c.quadraticCurveTo(0, -s * 0.75, s * 0.8, -s * 0.2); c.closePath();
      artFillPath(c, '#8a5a30', -s * 0.6, -s * 0.2, s * 0.4, { lineColor: '#4a2a10' });
    }
    artRoundRect(c, -s * 0.55, -s * 0.2, s * 0.14, s * 0.8, s * 0.03, '#ffd24f', { lineColor: '#a07010' });
    artRoundRect(c, s * 0.41, -s * 0.2, s * 0.14, s * 0.8, s * 0.03, '#ffd24f', { lineColor: '#a07010' });
    artRoundRect(c, -s * 0.12, -s * 0.15, s * 0.24, s * 0.26, s * 0.05, '#ffd24f', { lineColor: '#a07010' });
  } else if (id === 'moon') {
    artGlow(c, 0, 0, s * 1.6, '#cfe0ff', 0.5);
    artBlob(c, -s * 0.85, 0, s * 0.35, s * 0.4, '#a8c0ff', { lineColor: '#4a5aa0' });
    artBlob(c, 0, 0, s * 0.82, s * 0.6, '#e0ecff', { lineColor: '#4a5aa0', hi: 0.5, shadeTo: '#b8c8f0' });
    artCircle(c, -s * 0.15, s * 0.02, s * 0.3, '#ffe27a', { line: false });
    artCircle(c, -s * 0.03, -s * 0.06, s * 0.27, '#e0ecff', { line: false });
    fishingFace(c, s * 0.85, s * 0.45);
  } else {
    // Sateenkaarikala
    artGlow(c, 0, 0, s * 1.4, '#ffe27a', 0.35);
    fishingTail(c, s, '#ff9ec6');
    artBlob(c, 0, 0, s, s * 0.5, '#ffffff', { lineColor: '#7a4ab0', hi: 0.4 });
    c.save();
    fishingOval(c, 0, 0, s * 0.95, s * 0.46);
    c.clip();
    for (i = 0; i < FISHING_RAINBOW.length; i++) {
      c.fillStyle = FISHING_RAINBOW[i];
      c.globalAlpha = 0.85;
      c.fillRect(-s + i * s * 0.32, -s, s * 0.32, s * 2);
    }
    c.globalAlpha = 1;
    c.restore();
    artHighlight(c, -s * 0.3, -s * 0.25, s * 0.3, s * 0.1, 0.5);
    fishingFace(c, s, s * 0.6);
    drawStar(c, s * 0.2, -s * 0.75, s * 0.18, globalT * 2, 0.6);
  }
  c.restore();
}
function fishingTail(c, s, col) {
  c.beginPath();
  c.moveTo(-s * 0.75, 0); c.lineTo(-s * 1.3, -s * 0.48); c.lineTo(-s * 1.15, 0); c.lineTo(-s * 1.3, s * 0.48); c.closePath();
  artFillPath(c, col, -s * 0.48, s * 0.48, s * 0.4, { lineColor: artShade(col, -0.5) });
}
function fishingFace(c, s, ex) {
  artEye(c, ex, -s * 0.12, s * 0.13, 0.5, false);
  artBlush(c, ex - s * 0.05, s * 0.14, s * 0.08);
  c.strokeStyle = 'rgba(40,30,30,0.7)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.arc(ex + s * 0.2, s * 0.06, s * 0.1, 0.4, Math.PI - 0.6); c.stroke();
}

// Varjo pinnan alla (muoto kertoo lajin, värisävy erikoiset)
function fishingDrawShadow(c, f, L) {
  var S = FISHING_SPECIES[f.sp], p = fishingPx(f), s = fishingShadowS(f, p.y, L), wig = Math.sin(f.ph) * 0.08, col;
  if (S.id === 'gold') col = 'rgba(255,170,40,0.55)';
  else if (S.id === 'moon') col = 'rgba(210,230,255,0.6)';
  else if (S.id === 'rainbow') col = 'hsla(' + Math.round((globalT * 90) % 360) + ',90%,65%,0.55)';
  else if (S.id === 'chest') col = 'rgba(70,50,20,0.45)';
  else col = 'rgba(14,44,78,0.36)';
  c.save();
  c.globalAlpha = f.alpha;
  c.translate(p.x, p.y);
  c.scale(f.dir, 1);
  c.rotate(wig * 0.5);
  c.fillStyle = col;
  if (S.shape === 'boot') {
    roundRect(c, -s * 0.45, -s * 0.5, s * 0.5, s * 0.8, s * 0.1); c.fill();
    roundRect(c, -s * 0.45, s * 0.05, s * 1.0, s * 0.3, s * 0.12); c.fill();
  } else if (S.shape === 'chest') {
    roundRect(c, -s * 0.7, -s * 0.35, s * 1.4, s * 0.7, s * 0.12); c.fill();
    if ((globalT + f.ph) % 2 < 0.25) drawStar(c, s * 0.3, -s * 0.3, s * 0.25, 0, 0.5);
  } else if (S.shape === 'crab') {
    fishingOval(c, 0, 0, s * 0.6, s * 0.4); c.fill();
    fishingOval(c, s * 0.75, -s * 0.35, s * 0.25, s * 0.16); c.fill();
    fishingOval(c, s * 0.75, s * 0.35, s * 0.25, s * 0.16); c.fill();
  } else if (S.shape === 'frog') {
    fishingOval(c, 0, 0, s * 0.55, s * 0.45); c.fill();
    fishingOval(c, -s * 0.6, -s * 0.35 + wig * s, s * 0.35, s * 0.12); c.fill();
    fishingOval(c, -s * 0.6, s * 0.35 - wig * s, s * 0.35, s * 0.12); c.fill();
  } else {
    var rx = S.shape === 'long' ? s * 1.3 : S.shape === 'round' ? s * 0.8 : s, ry = S.shape === 'long' ? s * 0.24 : S.shape === 'round' ? s * 0.55 : s * 0.4;
    fishingOval(c, 0, 0, rx, ry); c.fill();
    c.save();
    c.translate(-rx * 0.85, 0);
    c.rotate(wig * 3);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.5, -s * 0.35); c.lineTo(-s * 0.5, s * 0.35); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();
  // Uusi laji: pieni tähti välkähtää varjon yllä
  if (fishingIsNew(f.sp) && f.alpha > 0.5 && (globalT * 0.8 + f.ph * 0.1) % 1.6 < 0.5) {
    drawStar(c, p.x + s * 0.4, p.y - s * 0.7, s * 0.28, globalT * 2, 0);
  }
}

// ---------- Piirto: vene ----------
function fishingRodHand(L) {
  return { x: L.boatX + L.H * 0.1, y: L.boatY - L.H * 0.06 - (fishing.prHop > 0 ? Math.sin(fishing.prHop / 0.5 * Math.PI) * L.H * 0.02 : 0) };
}
function fishingRodTip(L) {
  var bend = fishing.st === 'bite' ? L.H * 0.03 : fishing.st === 'reel' ? L.H * 0.04 + Math.sin(globalT * 20) * L.H * 0.005 : fishing.st === 'nibble' ? L.H * 0.008 : 0;
  return { x: L.tipX - bend * 0.3, y: L.tipY + bend };
}
function fishingDrawBoat(c, L) {
  var H = L.H, x = L.boatX, rock = Math.sin(globalT * 1.3) * 0.02 + (fishing.prHop > 0 ? Math.sin(fishing.prHop * 20) * 0.02 : 0), y = L.boatY + Math.sin(globalT * 1.3 + 1) * H * 0.004, s = L.bs;
  var hop = fishing.prHop > 0 ? Math.sin(fishing.prHop / 0.5 * Math.PI) * H * 0.02 : 0, us = H / 800 * 1.25, ux, uy;
  // Vesirengas veneen ympärillä
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = Math.max(1.5, H * 0.004);
  fishingOval(c, x, y + s * 0.07, s * 0.62 + Math.sin(globalT * 2) * H * 0.004, s * 0.08);
  c.stroke();
  c.save();
  c.translate(x, y);
  c.rotate(rock);
  // Yksisarvinen takana, prinsessa edessä
  ux = -s * 0.2; uy = -s * 0.02;
  drawUnicorn(c, ux, uy, us, 1, 0, false, globalT);
  if (fishing.uniFlower) drawFlower(c, ux + us * 36, uy - us * 93, us * 7, '#ff7bac');
  drawPrincessFree(c, s * 0.26, -s * 0.03 - hop, H / 560 * 0.95, 1, 0, false, globalT);
  // Runko
  c.beginPath();
  c.moveTo(-s * 0.55, -s * 0.12);
  c.lineTo(s * 0.62, -s * 0.18);
  c.quadraticCurveTo(s * 0.5, s * 0.12, s * 0.25, s * 0.14);
  c.lineTo(-s * 0.35, s * 0.14);
  c.quadraticCurveTo(-s * 0.55, s * 0.1, -s * 0.55, -s * 0.12);
  c.closePath();
  artFillPath(c, '#d0844e', -s * 0.18, s * 0.14, s * 0.3, { lineColor: '#5a2e14' });
  c.strokeStyle = 'rgba(90,46,20,0.45)';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath(); c.moveTo(-s * 0.52, -s * 0.03); c.lineTo(s * 0.55, -s * 0.07); c.moveTo(-s * 0.45, s * 0.06); c.lineTo(s * 0.45, s * 0.04); c.stroke();
  artRoundRect(c, -s * 0.57, -s * 0.15, s * 1.2, s * 0.04, s * 0.02, '#ffffff', { lineColor: '#5a2e14' });
  // Airo levossa
  artLimb(c, -s * 0.15, -s * 0.12, -s * 0.62, s * 0.2, Math.max(2, H * 0.007), '#a8743c', '#4a2a10');
  artBlob(c, -s * 0.66, s * 0.23, s * 0.07, s * 0.03, '#a8743c', { lineColor: '#4a2a10', rot: 0.6 });
  // Veneen nimi: sydän keulassa
  drawTaskGlyph(c, 'heart', s * 0.42, -s * 0.06, s * 0.035, '#ff7bac', false);
  c.restore();
}
function fishingDrawRod(c, L) {
  var h = fishingRodHand(L), t = fishingRodTip(L), H = L.H, a;
  c.lineCap = 'round';
  c.strokeStyle = '#5a3418';
  c.lineWidth = Math.max(3, H * 0.011);
  c.beginPath(); c.moveTo(h.x - H * 0.02, h.y + H * 0.02); c.quadraticCurveTo(h.x + (t.x - h.x) * 0.5, h.y + (t.y - h.y) * 0.62 - H * 0.02, t.x, t.y); c.stroke();
  c.strokeStyle = '#c08a50';
  c.lineWidth = Math.max(1.5, H * 0.006);
  c.stroke();
  // Kela pyörii kelatessa
  a = fishing.st === 'reel' ? globalT * (holding ? 30 : 16) : 0;
  artCircle(c, h.x + H * 0.005, h.y + H * 0.012, H * 0.014, '#c0c8d8', { lineColor: '#4a5a6a', hi: 0.4 });
  artLimb(c, h.x + H * 0.005, h.y + H * 0.012, h.x + H * 0.005 + Math.cos(a) * H * 0.014, h.y + H * 0.012 + Math.sin(a) * H * 0.014, Math.max(1.5, H * 0.004), '#ffd24f', '#8a6a10');
}
// Siima ja koho; piirretään yön sävytyksen päälle, jotta koho näkyy aina
function fishingDrawLine(c, L) {
  var t = fishingRodTip(L), b, st = fishing.st, k, e, sag = 0, dip = 0, under = false, H = L.H, x, y;
  if (st === 'idle' || st === 'won' || st === 'show') {
    b = fishingRestBob(L);
    sag = 0;
  } else if (st === 'cast') {
    k = Math.min(1, fishing.stT / FISHING_CAST);
    b = fishingBobPx(L);
    x = fishing.castX0 + (b.x - fishing.castX0) * easeOutCubic(k);
    y = fishing.castY0 + (b.y - fishing.castY0) * k - Math.sin(k * Math.PI) * H * 0.15;
    b = { x: x, y: y };
    sag = H * 0.02 * k;
  } else if (st === 'reel') {
    e = fishingReelEnd(L);
    k = easeInOutSine(fishing.reelK);
    b = { x: fishing.catchX + (e.x - fishing.catchX) * k, y: fishing.catchY + (e.y - fishing.catchY) * k };
    under = true;
  } else {
    b = fishingBobPx(L);
    sag = st === 'bite' ? 0 : H * 0.05;
    if (st === 'nibble') {
      k = (fishing.stT % FISHING_NIBBLE) / FISHING_NIBBLE;
      if (Math.floor(fishing.stT / FISHING_NIBBLE) < fishing.nibN) dip = Math.sin(Math.min(1, k * 3) * Math.PI) * H * 0.01;
    }
    if (st === 'bite') under = true;
    if (fishing.bobWig > 0) dip += Math.sin(fishing.bobWig * 30) * H * 0.004;
  }
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1, H * 0.0025);
  c.beginPath();
  c.moveTo(t.x, t.y);
  c.quadraticCurveTo((t.x + b.x) / 2, Math.max(t.y, b.y) + sag, b.x, b.y - H * 0.012 + dip);
  c.stroke();
  if (st === 'reel') {
    // Saalis rimpuilee pinnan alla
    var sp = fishing.catchSp, ss = H * 0.03 * FISHING_SPECIES[sp].len * fishing.catchSize;
    c.save();
    c.globalAlpha = 0.6;
    c.translate(b.x, b.y);
    c.rotate(Math.sin(globalT * 22) * 0.25);
    fishingDrawThing(c, sp, 0, ss * 0.2, ss, fishing.catchV, -1, false);
    c.restore();
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1.5, H * 0.004);
    fishingOval(c, b.x, b.y, ss * 1.3, ss * 0.35);
    c.stroke();
    return;
  }
  fishingDrawBobber(c, b.x, b.y + dip, H * 0.017, under, st === 'bite' ? fishing.stT : -1);
}
function fishingDrawBobber(c, x, y, r, under, biteT) {
  var sh;
  if (fishing.dayK > 0.65) artGlow(c, x, y - r, r * 3.5, '#fff2a0', 0.35 * Math.min(1, (fishing.dayK - 0.65) / 0.2));
  if (under) {
    // Sukeltanut: vain kärki näkyy ja heiluu, pinta kuohuu
    sh = Math.sin(biteT * 26) * r * 0.25;
    c.save();
    c.beginPath(); c.rect(x - r * 3, y - r * 4, r * 6, r * 3.4); c.clip();
    artCircle(c, x + sh, y + r * 0.2, r, '#ff4a4a', { lineColor: '#9a1a1a' });
    artLimb(c, x + sh, y - r * 0.7, x + sh, y - r * 1.6, Math.max(1.5, r * 0.25), '#ffffff', '#9a1a1a');
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = Math.max(1.5, r * 0.18);
    fishingOval(c, x, y - r * 0.6, r * 2 + Math.sin(biteT * 14) * r * 0.3, r * 0.5);
    c.stroke();
    return;
  }
  c.save();
  c.beginPath(); c.rect(x - r * 2, y - r * 4, r * 4, r * 3.6); c.clip();
  artCircle(c, x, y - r * 0.9, r, '#ffffff', { lineColor: '#9a1a1a', shadeTo: '#e8e0f0' });
  c.beginPath(); c.arc(x, y - r * 0.9, r, Math.PI, 0); c.closePath();
  artFillPath(c, '#ff4a4a', y - r * 1.9, y - r * 0.9, r, { lineColor: '#9a1a1a' });
  artLimb(c, x, y - r * 1.8, x, y - r * 2.6, Math.max(1.5, r * 0.25), '#ffd24f', '#8a6a10');
  c.restore();
}

// ---------- Piirto: taivas ----------
function fishingSunPos(L) {
  var k = Math.min(1, fishing.dayK / 0.62);
  if (fishing.dayK >= 0.62) return null;
  return { x: L.W * (0.24 + 0.22 * k), y: L.H * 0.2 + (L.top - L.H * 0.18) * Math.pow(k, 1.6), r: L.H * (0.055 + k * 0.012), k: k };
}
function fishingMoonPos(L) {
  var a = (fishing.dayK - 0.55) / 0.25;
  if (a <= 0) return null;
  return { x: L.W * 0.3, y: L.H * (0.26 - Math.min(1, a) * 0.06), r: L.H * 0.045, a: Math.min(1, a) };
}
function fishingDrawSky(c, L) {
  var sun = fishingSunPos(L);
  bgSun = null;
  if (sun) {
    bgSun = { x: sun.x, y: sun.y, r: sun.r, speed: 0 };
    artGlow(c, sun.x, sun.y, sun.r * 3.2, sun.k > 0.6 ? '#ffb070' : '#fff4c8', 0.5);
    artCircle(c, sun.x, sun.y, sun.r, artMix('#ffd45a', '#ff8a3a', sun.k), { line: false, hi: 0.3 });
  }
}
function fishingDrawTint(c, L) {
  var d = fishing.dayK, sw = Math.max(0, 1 - Math.abs(d - 0.5) / 0.3), nw = fishingClamp((d - 0.55) / 0.4, 0, 1), g;
  if (sw > 0.01) {
    g = c.createLinearGradient(0, 0, 0, L.H);
    g.addColorStop(0, 'rgba(255,110,80,' + (0.3 * sw) + ')');
    g.addColorStop(1, 'rgba(255,180,110,' + (0.12 * sw) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, L.W, L.H);
  }
  if (nw > 0.01) {
    g = c.createLinearGradient(0, 0, 0, L.H);
    g.addColorStop(0, 'rgba(16,20,70,' + (0.55 * nw) + ')');
    g.addColorStop(1, 'rgba(10,30,70,' + (0.4 * nw) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, L.W, L.H);
  }
}
function fishingDrawNight(c, L) {
  var nw = fishingClamp((fishing.dayK - 0.6) / 0.35, 0, 1), m = fishingMoonPos(L), i, x, y, a, f, p;
  if (nw > 0) {
    c.fillStyle = '#fffbe0';
    for (i = 0; i < 28; i++) {
      x = L.W * ((i * 0.37 + 0.05) % 1);
      y = L.H * (0.02 + ((i * 0.53) % 1) * 0.2);
      if (x < L.W * 0.66 && y < L.H * 0.13) y += L.H * 0.1;
      a = L.H * (0.003 + (i % 3) * 0.0015) * (1 + Math.sin(globalT * 2 + i * 1.7) * 0.35);
      c.globalAlpha = nw * 0.9;
      c.beginPath();
      c.moveTo(x, y - a * 2.2); c.lineTo(x + a * 0.6, y - a * 0.6); c.lineTo(x + a * 2.2, y); c.lineTo(x + a * 0.6, y + a * 0.6);
      c.lineTo(x, y + a * 2.2); c.lineTo(x - a * 0.6, y + a * 0.6); c.lineTo(x - a * 2.2, y); c.lineTo(x - a * 0.6, y - a * 0.6);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  }
  if (m) {
    c.globalAlpha = m.a;
    artGlow(c, m.x, m.y, m.r * 3, '#fff6c0', 0.4);
    artCircle(c, m.x, m.y, m.r, '#fff6c0', { lineColor: '#c8b060', hi: 0.4 });
    artCircle(c, m.x + m.r * 0.3, m.y - m.r * 0.25, m.r * 0.18, '#ece0a0', { line: false });
    artCircle(c, m.x - m.r * 0.35, m.y + m.r * 0.3, m.r * 0.12, '#ece0a0', { line: false });
    if (fishing.moonT > 0) {
      artEye(c, m.x - m.r * 0.3, m.y - m.r * 0.05, m.r * 0.14, 0, false);
      artEye(c, m.x + m.r * 0.3, m.y - m.r * 0.05, m.r * 0.14, 0, fishing.moonT > 0.6 && fishing.moonT < 0.8);
      c.strokeStyle = '#a08030';
      c.lineWidth = Math.max(1.5, m.r * 0.08);
      c.beginPath(); c.arc(m.x, m.y + m.r * 0.15, m.r * 0.35, 0.2, Math.PI - 0.2); c.stroke();
    }
    // Kuunsilta järvellä
    c.fillStyle = 'rgba(255,246,192,' + (0.35 * m.a) + ')';
    for (i = 0; i < 8; i++) {
      y = L.top + L.H * (0.02 + i * 0.05);
      x = m.x + Math.sin(globalT * 1.5 + i) * L.H * 0.01;
      c.fillRect(x - L.H * (0.02 + i * 0.008), y, L.H * (0.04 + i * 0.016), Math.max(1.5, L.H * 0.004));
    }
    c.globalAlpha = 1;
  }
  // Hohtavat erikoiskalat näkyvät yössäkin
  for (i = 0; i < fishing.fish.length; i++) {
    f = fishing.fish[i];
    if (FISHING_SPECIES[f.sp].id !== 'moon' && (nw <= 0 || FISHING_SPECIES[f.sp].id !== 'rainbow')) continue;
    p = fishingPx(f);
    artGlow(c, p.x, p.y, fishingShadowS(f, p.y, L) * 2.2, FISHING_SPECIES[f.sp].id === 'moon' ? '#d8e8ff' : '#ffe27a', 0.45 * f.alpha);
  }
}
function fishingDrawWater(c, L) {
  var i, x, y, a, r, k, b;
  // Kimallus pinnalla
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1, L.H * 0.003);
  for (i = 0; i < 14; i++) {
    x = L.W * (0.35 + ((i * 0.41) % 1) * 0.6);
    y = L.top + L.H * (0.04 + ((i * 0.29) % 1) * 0.52);
    a = Math.sin(globalT * 1.6 + i * 2.3);
    if (a < 0.4) continue;
    c.globalAlpha = (a - 0.4) * 1.2;
    c.beginPath(); c.moveTo(x - L.H * 0.012, y); c.lineTo(x + L.H * 0.012, y); c.stroke();
  }
  c.globalAlpha = 1;
  // Renkaat
  for (i = 0; i < fishing.rip.length; i++) {
    r = fishing.rip[i];
    k = r.t / 1.1;
    c.strokeStyle = 'rgba(255,255,255,' + (0.75 * (1 - k)) + ')';
    c.lineWidth = Math.max(1, L.H * (r.big ? 0.004 : 0.0025));
    fishingOval(c, r.x, r.y, L.H * (0.012 + k * (r.big ? 0.07 : 0.04)), L.H * (0.005 + k * (r.big ? 0.025 : 0.014)));
    c.stroke();
  }
  // Kuplat
  c.fillStyle = 'rgba(230,248,255,0.8)';
  for (i = 0; i < fishing.bub.length; i++) {
    b = fishing.bub[i];
    if (b.t < 0) continue;
    c.globalAlpha = Math.max(0, 1 - b.t / b.life);
    c.beginPath(); c.arc(b.x + Math.sin(b.t * 9) * L.H * 0.004, b.y - b.t * L.H * 0.04, L.H * 0.005, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

// ---------- Piirto: kortti, lentävät, tilaus, käsi ----------
function fishingDrawCard(c, L) {
  var C = fishingCardPos(L), e = fishingReelEnd(L), k = Math.min(1, fishing.stT / 0.35), sc = easeOutBack(k), x, y, i, a, sp = fishing.catchSp, S = FISHING_SPECIES[sp];
  var fade = fishing.stT > FISHING_SHOW - 0.15 ? Math.max(0, (FISHING_SHOW - fishing.stT) / 0.15) : 1;
  x = e.x + (C.x - e.x) * easeOutCubic(k);
  y = e.y + (C.y - e.y) * easeOutCubic(k);
  c.save();
  c.globalAlpha = fade;
  // Pyörivät valonsäteet
  c.fillStyle = S.bonus ? 'rgba(255,226,122,0.45)' : 'rgba(255,255,255,0.4)';
  for (i = 0; i < 8; i++) {
    a = globalT * 0.8 + i * Math.PI / 4;
    c.beginPath(); c.moveTo(x, y);
    c.lineTo(x + Math.cos(a - 0.14) * C.r * 1.7 * sc, y + Math.sin(a - 0.14) * C.r * 1.7 * sc);
    c.lineTo(x + Math.cos(a + 0.14) * C.r * 1.7 * sc, y + Math.sin(a + 0.14) * C.r * 1.7 * sc);
    c.closePath(); c.fill();
  }
  if (fishing.catchSize > 1.18) artGlow(c, x, y, C.r * 1.5 * sc, '#ffd24f', 0.5);
  artCircle(c, x, y, C.r * sc, '#ffffff', { lineColor: S.ring, line: Math.max(3, C.r * 0.08), shadeTo: '#f0ecf8' });
  fishingDrawThing(c, sp, x, y + C.r * 0.05 * sc, C.r * 0.5 * sc * Math.min(1.2, fishing.catchSize) / FISHING_SPECIES[sp].len * (S.id === 'pike' ? 1.15 : 1), fishing.catchV, 1, S.id === 'chest');
  // Uusi laji: tähti kortin reunassa
  if (!fishing.book[sp] && !fishingFlyingSticker(sp)) drawStar(c, x + C.r * 0.75 * sc, y - C.r * 0.7 * sc, C.r * 0.2 * sc, globalT, 0.8);
  c.restore();
}
function fishingDrawFly(c, L) {
  var i, d, k, x, y, s;
  for (i = 0; i < fishing.fly.length; i++) {
    d = fishing.fly[i];
    if (d.delay > 0) {
      if (d.kind === 'item') fishingDrawThing(c, d.sp, d.x0, d.y0, d.s0, d.v, 1, d.sp === 7);
      continue;
    }
    k = Math.min(1, d.t / d.dur);
    x = d.x0 + (d.x1 - d.x0) * easeInOutSine(k);
    y = d.y0 + (d.y1 - d.y0) * easeInOutSine(k) - Math.sin(k * Math.PI) * d.hop;
    s = d.s0 + (d.s1 - d.s0) * k;
    if (d.kind === 'sticker') artCircle(c, x, y, s * 1.6, '#ffffff', { lineColor: FISHING_SPECIES[d.sp].ring, shadeTo: '#f0ecf8' });
    fishingDrawThing(c, d.sp, x, y, s, d.v, d.x1 < d.x0 ? -1 : 1, false);
  }
}
function fishingDrawOrder(c, L) {
  var o = fishing.order, s, x, y, w, h, i, pop, a;
  if (!o) return;
  s = L.H * 0.034;
  pop = o.pop > 0 ? 1 + o.pop * 0.4 : 1;
  a = easeOutBack(o.t);
  x = L.villX - L.H * 0.02;
  y = L.dockY - L.H * 0.27;
  w = s * 5.4; h = s * 3.6;
  c.save();
  c.translate(x, y);
  c.scale(a * pop, a * pop);
  if (o.done) c.globalAlpha = Math.max(0, 1 - Math.max(0, o.doneT - 1.4) / 0.8);
  drawPromptBubble(c, 0, 0, w, h);
  c.fillStyle = '#2a62c8';
  c.font = 'bold ' + Math.round(s * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(o.n), -s * 1.5, -s * 0.35);
  fishingDrawThing(c, o.sp, s * 0.9, -s * 0.35, s * 0.85, 0.5, -1, false);
  // Ämpärin pallot: täytetyt = saatu
  for (i = 0; i < o.n; i++) {
    var px = (i - (o.n - 1) / 2) * s * 0.9;
    if (i < o.got) artCircle(c, px, s * 1.0, s * 0.3, '#5fd06a', { lineColor: '#2a7a3a', hi: 0.4 });
    else artCircle(c, px, s * 1.0, s * 0.3, '#ffffff', { lineColor: '#9aa8b8' });
  }
  if (o.done) drawTaskGlyph(c, 'heart', s * 2.0, -s * 1.5, s * 0.6, '#ff7bac', true);
  c.restore();
}
function fishingHintPt(L) {
  var i, f, p, best = null, bd = 1e9, d, cx = L.W * 0.6, cy = L.H * 0.66;
  for (i = 0; i < fishing.fish.length; i++) {
    f = fishing.fish[i];
    if (f.mode !== 'swim' || f.alpha < 0.8) continue;
    p = fishingPx(f);
    d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bd) { bd = d; best = p; }
  }
  return best || { x: cx, y: cy };
}
function fishingDrawHint(c, L) {
  var p = null, k, press, s = L.H * 0.07;
  if (fishing.winT >= 0) return;
  if (fishing.st === 'idle' && ((fishing.casts === 0 && fishing.t > 0.8) || fishing.idleT > 9)) p = fishingHintPt(L);
  else if (fishing.st === 'bite' && fishing.catches === 0) p = fishingBobPx(L);
  if (!p) return;
  k = (globalT % 1.2) / 1.2;
  press = Math.max(0, Math.sin(k * Math.PI * 2));
  c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')';
  c.lineWidth = Math.max(2, L.H * 0.005);
  fishingOval(c, p.x, p.y, L.H * (0.02 + k * 0.05), L.H * (0.008 + k * 0.02));
  c.stroke();
  c.globalAlpha = 0.9;
  drawHand(c, p.x + s * 0.1, p.y - s * 0.9 - s * 0.3 * press, s);
  c.globalAlpha = 1;
}
function fishingDrawBite(c, L) {
  var b, s, k;
  if (fishing.st !== 'bite') return;
  b = fishingBobPx(L);
  s = L.H * 0.035;
  k = 1 + Math.sin(globalT * 16) * 0.08;
  artCircle(c, b.x + s * 1.2, b.y - s * 2.2, s * k, '#ffe27a', { lineColor: '#c8901e', hi: 0.4 });
  c.fillStyle = '#d8342a';
  c.font = 'bold ' + Math.round(s * 1.4 * k) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('!', b.x + s * 1.2, b.y - s * 2.15);
}

function drawFishing() {
  var c = ctx, L = fishingL(), i;
  if (!beginPlayWorld()) return;
  fishingDrawSky(c, L);
  if (fishing.shore && fishing.shore.width) c.drawImage(fishing.shore, 0, 0, fishing.shore.width, fishing.shore.height);
  fishingDrawWater(c, L);
  for (i = 0; i < fishing.fish.length; i++) fishingDrawShadow(c, fishing.fish[i], L);
  propsDraw(c);
  fishingDrawBoat(c, L);
  fishingDrawRod(c, L);
  fishingDrawTint(c, L);
  fishingDrawNight(c, L);
  fishingDrawLine(c, L);
  fishingDrawBite(c, L);
  fishingDrawOrder(c, L);
  if (fishing.st === 'show') fishingDrawCard(c, L);
  fishingDrawFly(c, L);
  fishingDrawHint(c, L);
  drawParticlesLayer(c);
  endPlayWorld();
  fishingDrawBook(c);
  drawTaskOverlay(c);
}
// Kalakirja: kuusi tavallista paikkaa ja neljä kultaista bonuspaikkaa
function fishingDrawBook(c) {
  var i, sl, S, pop, bx = hudX() + viewH * 0.06, by = viewH * 0.072, bs = viewH * 0.045, last = fishingSlot(FISHING_SPECIES.length - 1), g = fishing.golden;
  drawHudPanel(c, hudX(), viewH * 0.018, last.x + last.s * 0.7 - hudX(), viewH * 0.108, viewH * 0.025);
  // Kirja
  if (g) artGlow(c, bx, by, bs * 1.6, '#ffd24f', 0.5 + Math.sin(globalT * 3) * 0.15);
  artRoundRect(c, bx - bs * 0.85, by - bs * 0.6, bs * 0.85, bs * 1.2, bs * 0.12, g ? '#ffd24f' : '#5a8ae0', { lineColor: g ? '#a07010' : '#2a4a8a' });
  artRoundRect(c, bx, by - bs * 0.6, bs * 0.85, bs * 1.2, bs * 0.12, g ? '#ffd24f' : '#5a8ae0', { lineColor: g ? '#a07010' : '#2a4a8a' });
  artRoundRect(c, bx - bs * 0.75, by - bs * 0.5, bs * 0.7, bs * 1.0, bs * 0.08, '#fffaf0', { line: false });
  artRoundRect(c, bx + bs * 0.05, by - bs * 0.5, bs * 0.7, bs * 1.0, bs * 0.08, '#fffaf0', { line: false });
  fishingDrawThing(c, 0, bx - bs * 0.4, by, bs * 0.28, 0.5, 1, false);
  fishingDrawThing(c, 2, bx + bs * 0.42, by, bs * 0.3, 0.5, -1, false);
  for (i = 0; i < FISHING_SPECIES.length; i++) {
    sl = fishingSlot(i);
    S = FISHING_SPECIES[i];
    pop = fishing.slotPop[i] > 0 ? 1 + Math.sin(fishing.slotPop[i] / 0.6 * Math.PI) * 0.35 : 1;
    c.save();
    c.translate(sl.x, sl.y);
    c.scale(pop, pop);
    artRoundRect(c, -sl.s / 2, -sl.s / 2, sl.s, sl.s, sl.s * 0.18, S.bonus ? '#fff6d8' : '#fffaf0', { lineColor: S.bonus ? '#d8a020' : '#c9a070', line: Math.max(1.5, sl.s * (S.bonus ? 0.07 : 0.04)) });
    if (fishing.book[i]) {
      artCircle(c, 0, 0, sl.s * 0.42, '#ffffff', { lineColor: S.ring });
      fishingDrawThing(c, i, 0, 0, sl.s * 0.3 / Math.max(0.9, S.len), 0.5, 1, false);
    } else if (!S.bonus || fishing.saved[i]) {
      // Haalea kuva: mitä etsitään (bonuksesta vain jos joskus löydetty)
      c.globalAlpha = S.bonus ? 0.4 : 0.22;
      fishingDrawThing(c, i, 0, 0, sl.s * 0.3 / Math.max(0.9, S.len), 0.5, 1, false);
      c.globalAlpha = 1;
    } else {
      c.fillStyle = '#d8a020';
      c.font = 'bold ' + Math.round(sl.s * 0.55) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('?', 0, sl.s * 0.03);
    }
    c.restore();
  }
}

HUB_ICONS.fishing = function (c, x, y, s) {
  var r = s * 0.15, bob = Math.sin(globalT * 3) * r * 0.08;
  artBlob(c, x, y + r * 0.75, r * 1.4, r * 0.42, '#5fb4e0', { lineColor: '#2a6a9a', hi: 0.3 });
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, r * 0.06);
  fishingOval(c, x + r * 0.7, y + r * 0.7, r * 0.3, r * 0.08);
  c.stroke();
  c.save();
  c.translate(x - r * 0.25, y - r * 0.15 + bob);
  c.rotate(-0.45);
  fishingDrawThing(c, 0, 0, 0, r * 0.7, 0.5, 1, false);
  c.restore();
  c.save();
  c.beginPath(); c.rect(x + r * 0.3, y, r, r * 0.68); c.clip();
  artCircle(c, x + r * 0.7, y + r * 0.5, r * 0.22, '#ffffff', { lineColor: '#9a1a1a' });
  c.beginPath(); c.arc(x + r * 0.7, y + r * 0.5, r * 0.22, Math.PI, 0); c.closePath();
  artFillPath(c, '#ff4a4a', y + r * 0.28, y + r * 0.5, r * 0.2, { lineColor: '#9a1a1a' });
  c.restore();
};
