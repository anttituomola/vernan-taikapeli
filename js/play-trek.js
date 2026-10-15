'use strict';

// Pikkupilven kotimatka (Kaukamaa, Pilvilinna): pelin ensimmäinen PITKÄ kenttä.
// Yksi kenttä, viisi lukua ja yksi matka aamusta yöhön. Pieni pilvi on
// eksynyt, ja prinsessa ja yksisarvinen saattavat sen kotiin äidin luo
// Pilvilinnaan. Matkalla Pikkupilvi kasvaa ja oppii uutta, ja ne, joita
// autetaan, tulevat lopussa juhliin.
//   1. Kukkaniitty (aamu)    sormi raahaa Pikkupilveä; sade kasvattaa kasveista
//                            tien ja tyhjä pilvi juo purosta. Helppo ja pitkä.
//   2. Kuplajoki (päivä)     lumpeenlehtilautta virrassa; sormi ohjaa lauttaa,
//                            eksyneet ankanpoikaset jonoon emon luo. Keskitaso.
//   3. Hohtoluola (pimeä)    Pikkupilvi hohtaa; yksisarvinen kulkee vain valossa,
//                            varjomöröt ja numerokristalliovet. Keskivaikea.
//   4. Tähtitaivas (ilta-yö) iso Pikkupilvi kantaa; sisarpilvet jonoon, ukkonen
//                            varoittaa ennen iskua. Vaikein.
//   5. Pilvilinna (yö)       äiti, lahjat sytyttävät juhlan, ystävät saapuvat.
// Koko matkan ajan sama ele: RAAHAUS (pilvi, lautta, valo, iso pilvi, lahjat).
//
// Kehys (tämä tiedosto) hoitaa luvut, matkakartan, tallennuksen, piilopuput,
// lahjat ja Pikkupilven piirron. Luvut ovat omissa tiedostoissaan
// (js/trek-*.js) ja rekisteröityvät trekRegister-kutsulla:
//   trekRegister({
//     id: 'meadow', order: 1, name: 'KUK-KA-NIIT-TY', color: '#8fdc7a',
//     ambient: 'butterflies' | null, light: { ... } | null (ambient.js drawLight),
//     init(),             luvun alku (maailma, oliot, proppien propAdd)
//     update(dt),         logiikka; kun luku on valmis -> trekChapterDone()
//     draw(),             koko piirto: beginPlayWorld() ... endPlayWorld(), oma HUD
//                         (x hudX()..viewW*0.6) ja drawTaskOverlay(ctx)
//     tap(px, py),        kosketuksen alku (holding/lastPX/lastPY kertovat raahauksen)
//     resize(),           koon muutos
//     layers(),           parallaksikerrokset [{ speed, render(b, w, h) }]
//     icon(c, x, y, s),   aseman kuva matkakartalla ja HUD-nauhassa (s = halkaisija)
//     gift: { draw(c, x, y, s) } | null  luvun lahja (kukka, simpukka, kristalli, tähti)
//     bunny: true          luvussa on piilopupu (trekBunnyFound)
//   });
// Kehyksen palvelut luvuille:
//   trekDrawPup(c, x, y, r, o)   Pikkupilvi (o: mood, t, look, glow, rain, water...)
//   trekPupSound(kind)           'giggle' 'sad' 'wow' 'slurp' 'scared' 'yay' 'hmm' 'yawn'
//   trekBunnyFound(sx, sy)       piilopupu löytyi (ruutukoordinaatit): lentää nauhaan, +1 tähti
//   trekBunnyFoundNow()          löytyikö tämän luvun pupu jo tällä matkalla
//   trekChapterDone()            luku valmis -> matkakartta ja seuraava luku
//   trekUS()                     yksisarvisen piirtoskaala (kuten muissa kävelykentissä)
//   trekGifts()                  lahjat, jotka on ansaittu (juhlaluku käyttää)
//   trekGo(i)                    testaus: suoraan lukuun i (0..4)

var TREK_KEY = 'vt_trek_v1';
var TREK_CHAPTERS = [];
var TREK_WALK_T = 2.0;         // nappulan kävely asemalta toiselle matkakartalla
var TREK_FADE_T = 0.35;        // häivytys kartan ja luvun välillä
var TREK_CARD_T = 2.0;         // luvun alkukortti
// Asemien paikat matkakartalla (x × viewW, y × viewH): niitty, joki, luola, taivas, linna
var TREK_MAP_POS = [[0.15, 0.80], [0.39, 0.71], [0.67, 0.70], [0.47, 0.42], [0.80, 0.20]];
// Pikkupilven koko matkakartalla luvun mukaan (kasvaa matkan aikana)
var TREK_PUP_GROW = [0.8, 0.9, 1.0, 1.45, 1.2];

var trek = {
  built: false, ch: 0, mode: 'map', t: 0, cardT: 0, doneLock: false,
  map: { at: 0, from: -1, walkT: 0, idleT: 0, giftT: -1, shake: -1, shakeT: 0, pupT: 0, pupMood: 0 },
  fade: 0, fadeDir: 0, fadeThen: null,
  run: { bunnies: {} },
  save: { reached: 0, cleared: false, bunnies: {}, ever: 0 },
  flyers: [], stripBump: 0
};

function trekRegister(def) {
  TREK_CHAPTERS.push(def);
  TREK_CHAPTERS.sort(function (a, b) { return a.order - b.order; });
}
function trekDef() { return TREK_CHAPTERS[trek.ch] || null; }
function trekUS() { return viewH / 800 * 1.6; }
function trekRnd(a, b) { return a + Math.random() * (b - a); }

// ---------- Tallennus ----------
// Oma avain, jotta pitkän matkan edistyminen ei sotke yleistä tallennusta:
// reached = pisin luku, johon on päästy; cleared = koko matka tehty;
// bunnies = koskaan löydetyt piilopuput (ne tulevat juhliin).
function trekLoad() {
  var d;
  try { d = JSON.parse(localStorage.getItem(TREK_KEY) || 'null'); } catch (e) { d = null; }
  trek.save = { reached: 0, cleared: false, bunnies: {}, ever: 0 };
  if (!d) return;
  trek.save.reached = Math.max(0, Math.min(TREK_CHAPTERS.length - 1, d.reached | 0));
  trek.save.cleared = !!d.cleared || !!hubCleared.trek;
  trek.save.ever = d.ever | 0;
  if (d.bunnies && typeof d.bunnies === 'object') trek.save.bunnies = d.bunnies;
}
function trekSave() {
  try { localStorage.setItem(TREK_KEY, JSON.stringify(trek.save)); } catch (e) { /* ei tallennusta */ }
}
function trekReachable(i) { return trek.save.cleared || !!hubCleared.trek || i <= trek.save.reached; }
function trekStationDone(i) { return trek.save.cleared || !!hubCleared.trek || i < trek.save.reached; }
// Lahjat, jotka on ansaittu tällä tai aiemmilla matkoilla (juhlaluku sijoittaa ne)
function trekGifts() {
  var out = [], i;
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    if (TREK_CHAPTERS[i].gift && (trekStationDone(i) || i < trek.ch)) out.push(TREK_CHAPTERS[i].id);
  }
  return out;
}
function trekGiftDraw(id, c, x, y, s) {
  var i;
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    if (TREK_CHAPTERS[i].id === id && TREK_CHAPTERS[i].gift) TREK_CHAPTERS[i].gift.draw(c, x, y, s);
  }
}
function trekGiveStars(n) {
  starCoins += n;
  starGain.n = n;
  starGain.until = globalT + 3.2;
  saveProgress();
}

// ---------- Elinkaari ----------
function initTrek() {
  trekLoad();
  trek.built = true;
  trek.run = { bunnies: {} };
  trek.flyers = [];
  trek.fade = 0;
  trek.fadeDir = 0;
  trek.fadeThen = null;
  trek.doneLock = false;
  trek.stripBump = 0;
  // Matka alkaa matkakartalta: nappula on pisimmällä saavutetulla asemalla
  // (läpi pelatulla matkalla alussa, ja kaikki asemat ovat auki)
  trekShowMap(trek.save.cleared || hubCleared.trek ? 0 : trek.save.reached, -1);
  playNote(392, 0, 0.2, 'sine', 0.25);
  playNote(523, 0.12, 0.2, 'sine', 0.25);
  playNote(659, 0.24, 0.3, 'triangle', 0.25);
}
function respawnTrek() {}
function resizeTrek() {
  var def = trekDef();
  trekMapKey = '';
  if (trek.mode === 'play' && def && def.resize) def.resize();
}
function trekLayers() {
  var def = trekDef();
  if (trek.mode === 'play' && def && def.layers) return def.layers();
  return [{ speed: 1, render: renderTrekBg }];
}
// Matkakartan aikana taustakerros on pelkkä tyhjä taivas (kartta piirretään itse)
function renderTrekBg(b, w, h) {
  b.fillStyle = '#cfe9ff';
  b.fillRect(0, 0, w, h);
}

// Matkakartta: at = asema, jolla nappula on; from >= 0 = nappula kävelee
// edelliseltä asemalta (luvun jälkeen), ja edellisen luvun lahja pomppaa esiin
function trekShowMap(at, from) {
  trek.mode = 'map';
  trek.map.at = Math.max(0, Math.min(TREK_CHAPTERS.length - 1, at));
  trek.map.from = from;
  trek.map.walkT = from >= 0 ? 0 : TREK_WALK_T;
  trek.map.idleT = 0;
  trek.map.giftT = from >= 0 ? 0 : -1;
  trek.map.shake = -1;
  trek.map.pupT = 0;
  trek.cardT = 0;
  holding = false;
  camX = 0;
  tasks = [];
  activeTask = null;
  particles = [];
  confetti = [];
  propsReset();
  PHASES.trek.light = null;
  ambientInit(null);
  renderBackground();
  trekMapKey = '';
}

function trekStartChapter(i) {
  var def = TREK_CHAPTERS[i];
  if (!def) return;
  trek.ch = i;
  trek.mode = 'play';
  trek.t = 0;
  trek.cardT = TREK_CARD_T;
  trek.doneLock = false;
  particles = [];
  confetti = [];
  sparks = [];
  artFxReset();
  propsReset();
  holding = false;
  camX = 0;
  tasks = [];
  activeTask = null;
  gates = [];
  activeGate = null;
  // Valo ja tunnelmahiukkaset vaihtuvat luvun mukaan (luvut ovat eri vuorokaudenaikoja)
  PHASES.trek.light = def.light || null;
  PHASES.trek.ambient = def.ambient || null;
  ambientInit(def.ambient || null);
  def.init();
  renderBackground();
  playNote(523, 0, 0.16, 'triangle', 0.28);
  playNote(659, 0.1, 0.16, 'triangle', 0.28);
  playNote(784, 0.2, 0.28, 'triangle', 0.28);
}

// Häivytys: ruutu vaalenee, then() vaihtaa näkymän, ruutu kirkastuu
function trekFadeTo(then) {
  if (trek.fadeDir === 1) return;
  trek.fadeDir = 1;
  trek.fadeThen = then;
}

// Luku valmis: tähti, tallennus ja matkakartalle kävelemään seuraavalle asemalle.
// Viimeinen luku (juhla) päättää koko kentän.
function trekChapterDone() {
  var i = trek.ch;
  if (trek.mode !== 'play' || trek.doneLock) return;
  trek.doneLock = true;
  if (i >= TREK_CHAPTERS.length - 1) {
    trek.save.cleared = true;
    trek.save.reached = TREK_CHAPTERS.length - 1;
    trek.save.ever = (trek.save.ever | 0) + 1;
    trekSave();
    startCelebration();
    return;
  }
  trek.save.reached = Math.max(trek.save.reached, i + 1);
  trekSave();
  trekGiveStars(1);
  soundFanfare();
  trekFadeTo(function () { trekShowMap(i + 1, i); });
}

// Testaus: suoraan lukuun i
function trekGo(i) {
  trek.fadeDir = 0;
  trek.fade = 0;
  trekStartChapter(i);
  trek.cardT = 0;
}

// ---------- Piilopuput ----------
// Jokaisessa pelillisessä luvussa on yksi piilopupu. Löytö lennättää pupun
// HUD-nauhan asemalle ja antaa tähden; koskaan löydetyt puput tulevat juhliin.
function trekBunnyFound(sx, sy) {
  var def = trekDef();
  if (!def || trek.run.bunnies[def.id]) return false;
  trek.run.bunnies[def.id] = true;
  trek.save.bunnies[def.id] = true;
  trekSave();
  soundBunny();
  spawnSparkles(sx + camX, sy, 14, '#ff9fd0');
  artPop(sx + camX, sy, viewH * 0.06, '#ff7bac', 'burst');
  trek.flyers.push({ x0: sx, y0: sy, t: 0, dur: 1.2, idx: trek.ch });
  return true;
}
function trekBunnyFoundNow() {
  var def = trekDef();
  return !!(def && trek.run.bunnies[def.id]);
}
function trekBunnyEver(id) { return !!trek.save.bunnies[id]; }

// ---------- Syöte ----------
function handleTrekTap(px, py) {
  var def = trekDef();
  if (!trek.built || trek.fadeDir !== 0) return;
  if (trek.mode === 'map') { trekMapTap(px, py); return; }
  if (trek.mode !== 'play' || !def) return;
  if (celebrating && def.order < TREK_CHAPTERS.length) return;
  if (def.tap) def.tap(px, py);
}

// ---------- Päivitys ----------
function updateTrek(dt) {
  var def = trekDef(), f, i;
  if (!trek.built) return;
  // Häivytys
  if (trek.fadeDir === 1) {
    trek.fade = Math.min(1, trek.fade + dt / TREK_FADE_T);
    if (trek.fade >= 1) {
      var then = trek.fadeThen;
      trek.fadeThen = null;
      trek.fadeDir = -1;
      if (then) then();
    }
  } else if (trek.fadeDir === -1) {
    trek.fade = Math.max(0, trek.fade - dt / TREK_FADE_T);
    if (trek.fade <= 0) trek.fadeDir = 0;
  }
  if (trek.stripBump > 0) trek.stripBump -= dt;
  for (i = trek.flyers.length - 1; i >= 0; i--) {
    f = trek.flyers[i];
    f.t += dt;
    if (f.t >= f.dur) {
      trek.flyers.splice(i, 1);
      trek.stripBump = 0.45;
      trekGiveStars(1);
      playNote(1319, 0, 0.12, 'triangle', 0.25);
      playNote(1760, 0.1, 0.18, 'triangle', 0.25);
    }
  }
  if (trek.mode === 'map') { trekUpdateMap(dt); return; }
  if (trek.cardT > 0) trek.cardT -= dt;
  trek.t += dt;
  if (def) def.update(dt);
}

// ---------- Piirto ----------
function drawTrek() {
  var c = ctx, def = trekDef();
  if (!trek.built || !viewW || !viewH) return;
  if (trek.mode === 'map') {
    trekDrawMap(c);
  } else if (def) {
    def.draw();
    if (!puzzleBusy()) trekDrawStrip(c);
    trekDrawCard(c);
  }
  trekDrawFlyers(c);
  if (trek.fade > 0) {
    c.fillStyle = 'rgba(255,248,236,' + easeInOutSine(trek.fade) + ')';
    c.fillRect(0, 0, viewW, viewH);
  }
}

// Luvun alkukortti: aseman mitali ja luvun nimi tavutettuna
function trekDrawCard(c) {
  var def = trekDef(), k, a, cx = viewW / 2, cy = viewH * 0.42, r = viewH * 0.12, fs;
  if (trek.cardT <= 0 || !def) return;
  k = 1 - trek.cardT / TREK_CARD_T;
  a = Math.min(1, trek.cardT / 0.4, k / 0.12);
  c.globalAlpha = a;
  c.fillStyle = 'rgba(30,20,60,0.32)';
  c.fillRect(0, 0, viewW, viewH);
  r *= 0.85 + easeOutBack(Math.min(1, k * 4)) * 0.15;
  trekDrawMedal(c, cx, cy, r, def, true, true);
  fs = Math.round(viewH * 0.055);
  c.font = 'bold ' + fs + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = fs * 0.22;
  c.strokeStyle = 'rgba(70,40,120,0.85)';
  c.lineJoin = 'round';
  c.strokeText(def.name, cx, cy + r * 1.55);
  c.fillStyle = '#ffffff';
  c.fillText(def.name, cx, cy + r * 1.55);
  c.textBaseline = 'alphabetic';
  c.globalAlpha = 1;
}

// Aseman mitali: kultareunus, luvun väri ja kuva. open = saavutettu
function trekDrawMedal(c, x, y, r, def, open, big) {
  var col = open ? (def.color || '#8fc8ff') : '#c4ccd8';
  artShadow(c, x, y + r * 0.95, r * 0.9, r * 0.2, 0.18);
  artCircle(c, x, y, r, open ? '#ffe27a' : '#dfe4ec', { lineColor: open ? '#c8901e' : '#a8b2c0' });
  artCircle(c, x, y, r * 0.82, col, { line: false });
  artHighlight(c, x - r * 0.3, y - r * 0.38, r * 0.3, r * 0.14, 0.35);
  if (def.icon) {
    if (!open) c.globalAlpha *= 0.4;
    c.save();
    c.beginPath(); c.arc(x, y, r * 0.8, 0, Math.PI * 2); c.clip();
    def.icon(c, x, y + r * 0.04, r * (big ? 1.7 : 1.6));
    c.restore();
    if (!open) c.globalAlpha = Math.min(1, c.globalAlpha / 0.4);
  }
}

// HUD-nauha oikeassa yläkulmassa (ääninapin vasemmalla puolella): matkan asemat,
// nykyinen asema isompana ja Pikkupilvi sen päällä; löydetyt piilopuput asemien yllä
function trekStripLayout() {
  var hs = viewH * 0.022, n = TREK_CHAPTERS.length, x1 = viewW - viewH * 0.135, w = Math.min(viewW * 0.3, hs * 3.4 * n + hs * 2);
  return { x0: x1 - w, x1: x1, y: hs * 0.7 + hs * 1.7, hs: hs, step: (w - hs * 3) / Math.max(1, n - 1) };
}
function trekStripPos(i) {
  var L = trekStripLayout();
  return { x: L.x0 + L.hs * 1.5 + i * L.step, y: L.y };
}
function trekDrawStrip(c) {
  var L = trekStripLayout(), i, p, def, r, cur, bump;
  if (L.x0 < viewW * 0.6) return;
  drawHudPanel(c, L.x0, L.hs * 0.7, L.x1 - L.x0, L.hs * 3.4, L.hs);
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = L.hs * 0.22;
  c.lineCap = 'round';
  c.setLineDash([L.hs * 0.3, L.hs * 0.45]);
  c.beginPath();
  c.moveTo(trekStripPos(0).x, L.y);
  c.lineTo(trekStripPos(TREK_CHAPTERS.length - 1).x, L.y);
  c.stroke();
  c.setLineDash([]);
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    def = TREK_CHAPTERS[i];
    p = trekStripPos(i);
    cur = i === trek.ch;
    bump = cur && trek.stripBump > 0 ? 1 + Math.sin(Math.PI * trek.stripBump / 0.45) * 0.3 : 1;
    r = L.hs * (cur ? 1.35 : 0.95) * bump;
    trekDrawMedal(c, p.x, p.y, r, def, i <= trek.ch || trekStationDone(i), false);
    if (def.bunny && trek.run.bunnies[def.id]) drawBunny(c, p.x + r * 0.75, p.y - r * 0.35, L.hs * 0.55, 0, globalT * 3, true);
  }
}

// Löytyneet piilopuput lentävät nauhaan
function trekDrawFlyers(c) {
  var i, f, k, to, x, y;
  for (i = 0; i < trek.flyers.length; i++) {
    f = trek.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    to = trekStripPos(f.idx);
    x = f.x0 + (to.x - f.x0) * k;
    y = f.y0 + (to.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    drawBunny(c, x, y + viewH * 0.03 * (1 - k), viewH * (0.05 - 0.03 * k), 0, globalT * 8, false);
  }
}

// ---------- Matkakartta ----------
var trekMapCv = document.createElement('canvas');
var trekMapKey = '';
function trekMapStation(i) {
  var p = TREK_MAP_POS[i] || TREK_MAP_POS[0];
  return { x: viewW * p[0], y: viewH * p[1], r: viewH * 0.068 };
}
// Polun kontrollipiste kahden aseman välissä (kaartuva polku)
function trekMapCtrl(a, b, i) {
  var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, bend = [0.06, -0.05, 0.08, -0.06][i] || 0.05;
  return { x: mx - (b.y - a.y) * bend * 2, y: my + (b.x - a.x) * bend * 2 - viewH * 0.04 };
}
function trekMapPathPoint(i, k) {
  var a = trekMapStation(i), b = trekMapStation(i + 1), q = trekMapCtrl(a, b, i), u = 1 - k;
  return { x: u * u * a.x + 2 * u * k * q.x + k * k * b.x, y: u * u * a.y + 2 * u * k * q.y + k * k * b.y };
}
function trekPawnSpot(i) {
  var s = trekMapStation(i);
  return { x: s.x, y: s.y + s.r * 1.25 };
}

function trekMapTap(px, py) {
  var i, s, dx, dy, at = trek.map.at, pp;
  initAudio();
  trek.map.idleT = 0;
  // Kävely kesken: napautus vie perille heti
  if (trek.map.walkT < TREK_WALK_T) { trek.map.walkT = TREK_WALK_T; trek.map.giftT = Math.max(trek.map.giftT, 1.2); return; }
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    s = trekMapStation(i);
    dx = px - s.x; dy = py - s.y;
    if (dx * dx + dy * dy > s.r * s.r * 2.2) continue;
    if (!trekReachable(i)) {
      trek.map.shake = i;
      trek.map.shakeT = 0.5;
      playNote(196, 0, 0.12, 'square', 0.12);
      playNote(185, 0.12, 0.16, 'square', 0.12);
      return;
    }
    artPop(s.x, s.y, s.r * 1.2, '#ffe27a', 'ring');
    spawnSparkles(s.x, s.y, 10, '#ffe27a');
    trekFadeTo(function () { trekStartChapter(i); });
    return;
  }
  // Pikkupilvi kikattaa kartallakin
  pp = trekMapPupPos();
  dx = px - pp.x; dy = py - pp.y;
  if (dx * dx + dy * dy < pp.r * pp.r * 3) {
    trek.map.pupT = 0.8;
    trekPupSound('giggle');
    spawnSparkles(pp.x, pp.y, 8, '#bfe0ff');
    return;
  }
  // Muualle napautus: seuraava asema hehkahtaa vihjeeksi
  s = trekMapStation(at);
  artPop(s.x, s.y, s.r * 1.3, '#ffffff', 'ring');
}

function trekUpdateMap(dt) {
  var m = trek.map, s;
  m.idleT += dt;
  if (m.shakeT > 0) m.shakeT -= dt;
  if (m.pupT > 0) m.pupT -= dt;
  if (m.walkT < TREK_WALK_T) {
    m.walkT += dt;
    if (m.walkT >= TREK_WALK_T) {
      s = trekMapStation(m.at);
      artPop(s.x, s.y, s.r * 1.3, '#ffe27a', 'burst');
      playNote(784, 0, 0.12, 'triangle', 0.25);
      playNote(1047, 0.1, 0.2, 'triangle', 0.25);
      m.idleT = 0;
    }
  }
  if (m.giftT >= 0) m.giftT += dt;
  updateParticles(dt);
}

// Nappulan paikka kartalla (kävelee polkua pitkin)
function trekMapPawn() {
  var m = trek.map, k, p, a, b;
  if (m.from >= 0 && m.walkT < TREK_WALK_T && m.from + 1 === m.at) {
    k = easeInOutSine(m.walkT / TREK_WALK_T);
    p = trekMapPathPoint(m.from, k);
    a = trekMapStation(m.from); b = trekMapStation(m.at);
    return { x: p.x, y: p.y + (a.r * 1.25) * (1 - k) + (b.r * 1.25) * k, moving: true, facing: b.x >= a.x ? 1 : -1 };
  }
  p = trekPawnSpot(m.at);
  return { x: p.x, y: p.y, moving: false, facing: 1 };
}
function trekMapPupPos() {
  var pw = trekMapPawn(), r = viewH * 0.028 * (TREK_PUP_GROW[trek.map.at] || 1);
  return { x: pw.x + viewH * 0.075 * pw.facing, y: pw.y - viewH * 0.11 + Math.sin(globalT * 2.2) * viewH * 0.006, r: r };
}

function trekDrawMap(c) {
  var m = trek.map, i, s, def, open, pw, pp, k, n, sh, gk, cur;
  trekRenderMap();
  c.clearRect(0, 0, viewW, viewH);
  c.drawImage(trekMapCv, 0, 0, trekMapCv.width, trekMapCv.height, 0, 0, viewW, viewH);
  // Tähdet tuikkivat yötaivaalla
  for (i = 0; i < 14; i++) {
    k = 0.5 + 0.5 * Math.sin(globalT * (1.3 + i * 0.17) + i * 2.1);
    drawStar(c, viewW * ((i * 0.173 + 0.31) % 0.62 + 0.36), viewH * (0.03 + ((i * 0.37) % 1) * 0.2), viewH * 0.007 * (0.6 + k * 0.6), globalT * 0.3 + i, 0.3 * k);
  }
  // Polku: saavutettu osuus kirkkaana, tuleva haaleana
  for (i = 0; i + 1 < TREK_CHAPTERS.length; i++) {
    n = 18;
    for (k = 1; k < n; k++) {
      s = trekMapPathPoint(i, k / n);
      open = trekStationDone(i) || (m.from === i && m.walkT >= TREK_WALK_T * k / n);
      c.fillStyle = open ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)';
      c.beginPath(); c.arc(s.x, s.y, viewH * (open ? 0.0065 : 0.005), 0, Math.PI * 2); c.fill();
    }
  }
  // Asemat
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    def = TREK_CHAPTERS[i];
    s = trekMapStation(i);
    open = trekReachable(i);
    cur = i === m.at && m.walkT >= TREK_WALK_T;
    sh = m.shake === i && m.shakeT > 0 ? Math.sin(m.shakeT * 40) * s.r * 0.08 : 0;
    if (cur) {
      var gl = c.createRadialGradient(s.x, s.y, s.r * 0.9, s.x, s.y, s.r * 1.8);
      gl.addColorStop(0, 'rgba(255,230,140,' + (0.45 + Math.sin(globalT * 4) * 0.15) + ')');
      gl.addColorStop(1, 'rgba(255,230,140,0)');
      c.fillStyle = gl;
      c.beginPath(); c.arc(s.x, s.y, s.r * 1.8, 0, Math.PI * 2); c.fill();
    }
    trekDrawMedal(c, s.x + sh, s.y, s.r * (cur ? 1 + Math.sin(globalT * 3) * 0.04 : 1), def, open, true);
    if (!open) drawHubLock(c, s.x + sh, s.y + s.r * 0.15, s.r * 0.75);
    // Läpäisty asema: lahja tai tähti mitalin kulmassa
    if (trekStationDone(i) && !(m.giftT >= 0 && i === m.from && m.giftT < 1.2)) trekDrawStationBadge(c, s, def, 1);
    // Piilopupun paikka: löydetty pupu tai katkoviivainen ympyrä
    if (def.bunny) trekDrawBunnyBadge(c, s, def);
  }
  // Juuri saatu lahja pomppaa mitalin kulmaan
  if (m.giftT >= 0 && m.from >= 0 && m.giftT < 1.2) {
    s = trekMapStation(m.from);
    gk = easeOutBack(Math.min(1, m.giftT / 0.8));
    trekDrawStationBadge(c, s, TREK_CHAPTERS[m.from], gk);
    if (m.giftT < 0.05) {
      spawnSparkles(s.x + s.r * 0.8, s.y - s.r * 0.8, 14, '#ffe27a');
      trekPupSound('yay');
    }
  }
  // Nappula ja Pikkupilvi
  pw = trekMapPawn();
  drawUnicorn(c, pw.x, pw.y, viewH * 0.00062, pw.facing, globalT * 9, pw.moving, globalT);
  pp = trekMapPupPos();
  trekDrawPup(c, pp.x, pp.y, pp.r, { mood: m.pupT > 0 ? 'wow' : (trek.save.cleared ? 'happy' : (m.at === 0 && m.from < 0 ? 'sad' : 'happy')), t: globalT, look: pw.facing * 0.6, wave: m.pupT > 0 || pw.moving });
  // Vihjenuoli seuraavan aseman yllä; käsi napauttaa, jos lapsi odottaa
  if (m.walkT >= TREK_WALK_T && trek.fadeDir === 0) {
    s = trekMapStation(m.at);
    drawHintArrow(c, s.x, s.y - s.r * 1.75);
    if (m.idleT > 4) {
      k = (m.idleT % 1.4) / 1.4;
      drawHand(c, s.x + s.r * 0.35, s.y + s.r * 0.25 - Math.abs(Math.sin(k * Math.PI)) * s.r * 0.35, s.r * 0.45);
    }
  }
  drawParticlesLayer(c);
  trekDrawTitle(c);
}

// Otsikko vasemmassa yläkulmassa (karttanapin oikealla puolella), tavutettuna
function trekDrawTitle(c) {
  var fs = Math.round(viewH * 0.038), txt = 'PIK-KU-PIL-VEN KO-TI-MAT-KA', x = hudX(), y = viewH * 0.03, w;
  c.font = 'bold ' + fs + 'px ' + UI_FONT;
  w = c.measureText(txt).width + fs * 1.4;
  drawHudPanel(c, x, y, w, fs * 1.8, fs * 0.5);
  c.fillStyle = '#6a3ca8';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(txt, x + fs * 0.7, y + fs * 0.95);
  c.textBaseline = 'alphabetic';
}
function trekDrawStationBadge(c, s, def, k) {
  var x = s.x + s.r * 0.82, y = s.y - s.r * 0.78, r = s.r * 0.42 * k;
  if (k <= 0.01) return;
  artCircle(c, x, y, r, '#ffffff', { lineColor: '#c8901e', line: Math.max(1.2, r * 0.12) });
  if (def.gift) def.gift.draw(c, x, y, r * 1.5);
  else drawStar(c, x, y, r * 0.75, globalT * 0.5, 0.6);
}
function trekDrawBunnyBadge(c, s, def) {
  var x = s.x - s.r * 0.95, y = s.y + s.r * 0.62, r = s.r * 0.3;
  if (trek.save.bunnies[def.id]) {
    artCircle(c, x, y, r, '#ffffff', { lineColor: '#d98ab0', line: Math.max(1, r * 0.1) });
    drawBunny(c, x, y + r * 0.25, r * 1.1, 0, globalT * 2 + s.x, true);
  } else {
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = Math.max(1, r * 0.12);
    c.setLineDash([r * 0.25, r * 0.25]);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.font = 'bold ' + Math.round(r * 1.2) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', x, y + r * 0.05);
    c.textBaseline = 'alphabetic';
  }
}

// Matkakartan maisema esirenderöidään: aamuniitty vasemmalla alhaalla, joki
// virtaa vuoren luolaan, iltataivas ja yöllä tähtien keskellä Pilvilinna.
// Koko matka on yksi päivä: aamu -> päivä -> ilta -> yö.
function trekRenderMap() {
  var key = viewW + 'x' + viewH, b, w = viewW, h = viewH, g, i, x, y, k, s;
  if (trekMapKey === key) return;
  trekMapKey = key;
  trekMapCv.width = Math.round(w * DPR);
  trekMapCv.height = Math.round(h * DPR);
  b = trekMapCv.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  // Taivas: yö ylhäällä, ilta keskellä, päivä horisontissa
  g = b.createLinearGradient(0, 0, 0, h * 0.66);
  g.addColorStop(0, '#2a2c6e');
  g.addColorStop(0.28, '#5b4fa8');
  g.addColorStop(0.52, '#d98cc0');
  g.addColorStop(0.72, '#ffc6a0');
  g.addColorStop(1, '#ffe9c8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Aamuaurinko nousee vasemmalla, kuu loistaa linnan vieressä
  artGlow(b, w * 0.06, h * 0.6, h * 0.28, '#fff0b0', 0.55);
  drawBgSun(b, w * 0.06, h * 0.6, h * 0.05, 0, '#fff4c8', '#fffdf0', '#ffc85a');
  bgSun = null;
  artGlow(b, w * 0.64, h * 0.1, h * 0.12, '#fff6d8', 0.4);
  artCircle(b, w * 0.64, h * 0.1, h * 0.038, '#fff4cc', { lineColor: '#d8c48a', hi: 0.3 });
  artCircle(b, w * 0.655, h * 0.092, h * 0.008, '#efe0a8', { line: false });
  // Iltapilvet
  for (i = 0; i < 6; i++) {
    x = w * (0.08 + i * 0.17);
    y = h * (0.36 + (i % 2) * 0.07);
    b.fillStyle = 'rgba(255,200,215,0.55)';
    cloudShape(b, x, y, h * (0.022 + (i % 3) * 0.006));
  }
  // Kaukaiset laventelivuoret
  fillHillBand(b, w, h, h * 0.6, '#b9a6dc', function (px) { return h * 0.6 - Math.abs(Math.sin(px / w * 7.3)) * h * 0.07 - Math.sin(px / w * 3 + 1) * h * 0.02; });
  // Iso vuori oikealla: huippu kurottaa kohti Pilvilinnaa, juurella luola
  b.beginPath();
  b.moveTo(w * 0.5, h * 0.8);
  b.quadraticCurveTo(w * 0.66, h * 0.5, w * 0.8, h * 0.33);
  b.quadraticCurveTo(w * 0.86, h * 0.31, w * 0.9, h * 0.38);
  b.quadraticCurveTo(w * 1.0, h * 0.52, w * 1.05, h * 0.8);
  b.closePath();
  artFillPath(b, '#8f7cc4', h * 0.32, h * 0.8, h * 0.2, { lineColor: '#5e4a96' });
  b.fillStyle = 'rgba(255,255,255,0.18)';
  b.beginPath();
  b.moveTo(w * 0.8, h * 0.33); b.quadraticCurveTo(w * 0.7, h * 0.5, w * 0.62, h * 0.66); b.lineTo(w * 0.66, h * 0.66);
  b.quadraticCurveTo(w * 0.75, h * 0.5, w * 0.82, h * 0.34); b.closePath(); b.fill();
  // Lumihuippu
  b.beginPath();
  b.moveTo(w * 0.775, h * 0.355); b.quadraticCurveTo(w * 0.8, h * 0.325, w * 0.84, h * 0.32);
  b.quadraticCurveTo(w * 0.875, h * 0.33, w * 0.885, h * 0.36); b.lineTo(w * 0.86, h * 0.35); b.lineTo(w * 0.84, h * 0.37); b.lineTo(w * 0.81, h * 0.35); b.lineTo(w * 0.79, h * 0.37); b.closePath();
  artFillPath(b, '#ffffff', h * 0.32, h * 0.37, h * 0.02, { lineColor: '#c8bce8' });
  // Luolan suu vuoren juurella (luolan aseman takana)
  s = trekMapStation(2);
  artBlob(b, s.x + s.r * 1.25, s.y + s.r * 0.15, s.r * 0.75, s.r * 0.95, '#3a2e68', { lineColor: '#2a2050' });
  artGlow(b, s.x + s.r * 1.25, s.y + s.r * 0.3, s.r * 0.6, '#9fe8ff', 0.5);
  // Vihreä niitty (aamu) vasemmalla ja maa koko alareunassa
  fillHillBand(b, w, h, h * 0.7, '#9edc7c', function (px) { return h * 0.7 - Math.sin(px / w * 4 + 0.4) * h * 0.035 - Math.sin(px / w * 11) * h * 0.01; });
  fillHillBand(b, w, h, h * 0.78, '#86cf6a', function (px) { return h * 0.8 - Math.sin(px / w * 6 + 2) * h * 0.03; });
  // Joki niityltä vuoren luolaan
  b.strokeStyle = '#5ab8ec';
  b.lineCap = 'round';
  b.lineWidth = h * 0.045;
  b.beginPath();
  b.moveTo(-w * 0.02, h * 0.71);
  b.bezierCurveTo(w * 0.2, h * 0.66, w * 0.3, h * 0.82, w * 0.46, h * 0.78);
  b.bezierCurveTo(w * 0.56, h * 0.755, w * 0.62, h * 0.76, s.x + s.r * 1.2, s.y + s.r * 0.6);
  b.stroke();
  b.strokeStyle = 'rgba(255,255,255,0.55)';
  b.lineWidth = h * 0.008;
  b.setLineDash([h * 0.025, h * 0.03]);
  b.stroke();
  b.setLineDash([]);
  // Puut ja kukat niityllä
  for (i = 0; i < 5; i++) drawTree(b, w * (0.03 + i * 0.065), h * (0.73 + (i % 2) * 0.03), h * 0.045);
  for (i = 0; i < 22; i++) {
    x = w * ((i * 0.137 + 0.05) % 0.55);
    y = h * (0.82 + ((i * 0.29) % 0.16));
    drawFlower(b, x, y, h * 0.007, ['#ff7bac', '#ffe27a', '#c9a0ff', '#ffffff'][i % 4]);
  }
  // Taivaan aseman pilvisaari ja Pilvilinna
  s = trekMapStation(3);
  drawCloud(b, s.x + s.r * 0.2, s.y + s.r * 0.95, s.r * 0.6, 0.9);
  s = trekMapStation(4);
  drawCloud(b, s.x - s.r * 1.2, s.y + s.r * 0.95, s.r * 0.75, 0.95);
  drawCloud(b, s.x + s.r * 1.1, s.y + s.r * 1.05, s.r * 0.65, 0.95);
  b.globalAlpha = 0.9;
  drawCastle(b, s.x + s.r * 1.55, s.y + s.r * 0.9, s.r * 1.35);
  b.globalAlpha = 1;
  // Sateenkaari linnan takana
  for (i = 0; i < 7; i++) {
    b.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.55);
    b.lineWidth = h * 0.007;
    b.beginPath(); b.arc(s.x + s.r * 1.5, s.y + s.r * 1.2, h * (0.11 - i * 0.007), Math.PI * 1.05, Math.PI * 1.95); b.stroke();
  }
}

// ---------- Pikkupilvi ----------
// Pyöreä pikkupilvi: pallerot muodostavat pulleän vartalon, jonka alareuna on
// tasaisempi. r = vartalon säde (leveys n. 2 r). o:
//   mood: 'happy' | 'sad' | 'scared' | 'wow' | 'sleepy' | 'thirsty' | 'brave'
//   t: aika (räpytys, käsien heilutus), look / lookY: katse -1..1
//   glow 0..1 (hohtaa luolassa), rain 0..1 (tihkuu), water 0..1 (täysi = pullea,
//   tyhjä = pieni ja kalpea), tint (sisarpilvien väri), squash (venytys),
//   wave: kädet heiluvat, flip: peilaus vaakasuunnassa
var TREK_PUP_BLOBS = [[0, 0.1, 0.62], [-0.56, 0.22, 0.42], [0.57, 0.2, 0.43], [-0.27, -0.32, 0.46], [0.25, -0.38, 0.5], [0, 0.34, 0.5], [-0.82, 0.4, 0.24], [0.85, 0.38, 0.25]];
function trekPupPath(c, x, y, s) {
  var B = TREK_PUP_BLOBS, i;
  c.beginPath();
  for (i = 0; i < B.length; i++) {
    c.moveTo(x + B[i][0] * s + B[i][2] * s, y + B[i][1] * s);
    c.arc(x + B[i][0] * s, y + B[i][1] * s, B[i][2] * s, 0, Math.PI * 2);
  }
}
function trekDrawPup(c, x, y, r, o) {
  o = o || {};
  var t = o.t === undefined ? globalT : o.t, mood = o.mood || 'happy', water = o.water === undefined ? 1 : o.water;
  var body = o.tint || '#ffffff', shade = o.tint ? artShade(o.tint, -0.18) : '#d8def8', line = o.tint ? artShade(o.tint, -0.45) : '#8592cf';
  var look = o.look || 0, lookY = o.lookY || 0, blink = ((t * 0.9 + (o.seed || 0)) % 3.3) < 0.13, i, k, ex, ey, er, s;
  s = r * (0.72 + 0.28 * Math.max(0, Math.min(1, water)));
  if (water < 0.35) {
    body = artMix(body, '#e9edf4', 0.6);
    shade = artMix(shade, '#c9d0dc', 0.6);
  }
  if (o.glow) {
    artGlow(c, x, y, s * 3.4, '#fff3b8', 0.55 * o.glow);
    body = artMix(body, '#fffbe0', o.glow * 0.7);
    shade = artMix(shade, '#ffe9a8', o.glow * 0.6);
    line = artMix(line, '#c8a050', o.glow * 0.5);
  }
  // Tihkusade vartalon alla
  if (o.rain) {
    c.strokeStyle = 'rgba(110,170,240,' + (0.75 * o.rain) + ')';
    c.lineWidth = Math.max(1.2, s * 0.07);
    c.lineCap = 'round';
    for (i = 0; i < 6; i++) {
      k = (t * 2.4 + i * 0.37) % 1;
      ex = x + (i - 2.5) * s * 0.3;
      ey = y + s * 0.65 + k * s * 1.3;
      c.globalAlpha = 1 - k;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - s * 0.04, ey + s * 0.16); c.stroke();
    }
    c.globalAlpha = 1;
  }
  c.save();
  c.translate(x, y);
  if (o.flip) c.scale(-1, 1);
  if (o.squash) artSquash(c, o.squash);
  if (mood === 'scared') c.translate(Math.sin(t * 60) * s * 0.03, 0);
  // Pienet kädet (heiluvat iloisena)
  k = o.wave ? Math.sin(t * 12) * 0.5 : Math.sin(t * 2) * 0.12;
  artBlob(c, -s * 1.02, s * 0.22 - k * s * 0.25, s * 0.17, s * 0.13, body, { lineColor: line, shadeTo: shade, rot: -0.5 - k });
  artBlob(c, s * 1.02, s * 0.22 + k * s * 0.25, s * 0.17, s * 0.13, body, { lineColor: line, shadeTo: shade, rot: 0.5 + k });
  // Vartalo
  artUnion(c, trekPupPath, 0, 0, s, -s * 0.9, s * 0.85, body, { lineColor: line, shadeTo: shade });
  artHighlight(c, -s * 0.38, -s * 0.5, s * 0.26, s * 0.12, 0.55);
  if (water < 0.35) {
    // Kuiva pilvi: pieni halkeama-kiehkura
    c.strokeStyle = artRGBA(line, 0.5);
    c.lineWidth = Math.max(1, s * 0.04);
    c.beginPath(); c.arc(s * 0.55, -s * 0.15, s * 0.1, 0, Math.PI * 1.5); c.stroke();
  }
  // Kasvot
  ey = s * 0.04 + lookY * s * 0.04;
  er = s * (mood === 'wow' || mood === 'scared' ? 0.19 : 0.16);
  for (i = -1; i <= 1; i += 2) {
    ex = i * s * 0.27 + look * s * 0.05;
    if (mood === 'sleepy') {
      c.strokeStyle = '#4a4a6a';
      c.lineWidth = Math.max(1.2, s * 0.05);
      c.lineCap = 'round';
      c.beginPath(); c.arc(ex, ey, er * 0.7, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    } else if (mood === 'happy' && o.squint) {
      c.strokeStyle = '#4a4a6a';
      c.lineWidth = Math.max(1.2, s * 0.05);
      c.lineCap = 'round';
      c.beginPath(); c.arc(ex, ey + er * 0.3, er * 0.7, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
    } else {
      artEye(c, ex, ey, er, look, blink);
      if (mood === 'wow' && !blink) {
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(ex + er * 0.35, ey + er * 0.35, er * 0.16, 0, Math.PI * 2); c.fill();
      }
    }
    // Kulmakarvat
    if (mood === 'sad' || mood === 'scared' || mood === 'brave') {
      c.strokeStyle = '#5a5a80';
      c.lineWidth = Math.max(1, s * 0.035);
      c.lineCap = 'round';
      c.beginPath();
      if (mood === 'brave') { c.moveTo(ex - i * er * 0.9, ey - er * 1.55); c.lineTo(ex + i * er * 0.6, ey - er * 1.25); }
      else { c.moveTo(ex - i * er * 0.9, ey - er * 1.62); c.lineTo(ex + i * er * 0.6, ey - er * 1.25); }
      c.stroke();
    }
  }
  artBlush(c, -s * 0.5, s * 0.24, s * 0.11);
  artBlush(c, s * 0.5, s * 0.24, s * 0.11);
  // Suu
  c.strokeStyle = '#5a4a70';
  c.lineWidth = Math.max(1.2, s * 0.045);
  c.lineCap = 'round';
  c.beginPath();
  if (mood === 'sad') {
    c.arc(0, s * 0.36, s * 0.11, 1.15 * Math.PI, 1.85 * Math.PI);
    c.stroke();
    // Kyynel
    k = (t * 0.7) % 1;
    artBlob(c, -s * 0.36, ey + er * 1.2 + k * s * 0.35, s * 0.05, s * 0.075, '#9fd0ff', { lineColor: '#5a90d0', line: Math.max(1, s * 0.015) });
  } else if (mood === 'wow') {
    artBlob(c, 0, s * 0.3, s * 0.07, s * 0.09, '#c45a7a', { lineColor: '#5a4a70', line: Math.max(1, s * 0.03) });
  } else if (mood === 'scared') {
    c.moveTo(-s * 0.12, s * 0.3);
    for (i = 1; i <= 4; i++) c.lineTo(-s * 0.12 + i * s * 0.06, s * 0.3 + (i % 2 ? -1 : 1) * s * 0.03);
    c.stroke();
  } else if (mood === 'thirsty') {
    c.arc(0, s * 0.26, s * 0.09, 0.1 * Math.PI, 0.9 * Math.PI);
    c.stroke();
    artBlob(c, s * 0.03, s * 0.36, s * 0.05, s * 0.06, '#ff8fae', { lineColor: '#c45a7a', line: Math.max(1, s * 0.015) });
  } else if (mood === 'sleepy') {
    c.arc(0, s * 0.3, s * 0.05, 0, Math.PI * 2);
    c.stroke();
  } else {
    // Iloinen: avoin hymy
    c.moveTo(-s * 0.13, s * 0.24);
    c.quadraticCurveTo(0, s * 0.42, s * 0.13, s * 0.24);
    c.closePath();
    c.fillStyle = '#c45a7a';
    c.fill();
    c.stroke();
  }
  c.restore();
}

// Pikkupilven äänet: lyhyitä, lempeitä sävelkulkuja
function trekPupSound(kind) {
  if (kind === 'giggle') {
    playNote(988, 0, 0.06, 'triangle', 0.15);
    playNote(1175, 0.07, 0.06, 'triangle', 0.15);
    playNote(1319, 0.14, 0.06, 'triangle', 0.15);
    playNote(1175, 0.21, 0.1, 'triangle', 0.13);
  } else if (kind === 'sad') {
    playNote(659, 0, 0.25, 'sine', 0.16);
    playNote(587, 0.22, 0.25, 'sine', 0.16);
    playNote(494, 0.44, 0.4, 'sine', 0.14);
  } else if (kind === 'wow') {
    playNote(523, 0, 0.08, 'sine', 0.2);
    playNote(784, 0.07, 0.08, 'sine', 0.2);
    playNote(1047, 0.14, 0.1, 'sine', 0.2);
    playNote(1568, 0.22, 0.25, 'sine', 0.18);
  } else if (kind === 'slurp') {
    playNote(196, 0, 0.07, 'square', 0.07);
    playNote(247, 0.09, 0.07, 'square', 0.07);
    playNote(294, 0.18, 0.09, 'square', 0.07);
  } else if (kind === 'scared') {
    playNote(440, 0, 0.06, 'triangle', 0.12);
    playNote(415, 0.07, 0.06, 'triangle', 0.12);
    playNote(440, 0.14, 0.06, 'triangle', 0.12);
    playNote(392, 0.21, 0.12, 'triangle', 0.12);
  } else if (kind === 'yay') {
    playNote(784, 0, 0.08, 'triangle', 0.2);
    playNote(988, 0.08, 0.08, 'triangle', 0.2);
    playNote(1175, 0.16, 0.08, 'triangle', 0.2);
    playNote(1568, 0.24, 0.22, 'triangle', 0.2);
  } else if (kind === 'hmm') {
    playNote(392, 0, 0.12, 'sine', 0.14);
    playNote(370, 0.13, 0.18, 'sine', 0.14);
  } else if (kind === 'yawn') {
    playNote(523, 0, 0.3, 'sine', 0.12);
    playNote(392, 0.25, 0.45, 'sine', 0.1);
  }
}

// ---------- Kartan ja sokkelon kuvake ----------
HUB_ICONS.trek = function (c, x, y, s) {
  var b = Math.sin(globalT * 1.6) * s * 0.02;
  // Pilvilinna ja Pikkupilvi sen edessä
  c.globalAlpha = 0.95;
  drawCastle(c, x + s * 0.12, y + s * 0.12, s * 0.42);
  c.globalAlpha = 1;
  trekDrawPup(c, x - s * 0.14, y + s * 0.06 + b, s * 0.14, { mood: 'happy', t: globalT, wave: true });
};

// ---------- Tarina: Pilvilinnan alkuluku ----------
// Maan alku (CONTEXT.md, Tarina): kerrotaan mitä on edessä, tavutettuna
STORY_CHAPTERS.push({
  id: 'maa18', title: 'PIL-VI-LIN-NA', where: 'world', cover: 'treklost', world: 18,
  pages: [
    { scene: 'treklost', text: 'PIK-KU-PIL-VI ON EK-SY-NYT JA SUR-KE-A.' },
    { scene: 'trekcastle', text: 'SEN KO-TI ON PIL-VI-LIN-NAS-SA KOR-KEAL-LA TAI-VAAL-LA.' },
    { scene: 'trekroute', text: 'MAT-KA ON PIT-KÄ. SAA-TE-TAAN SE KO-TIIN!' }
  ]
});
// Eksynyt Pikkupilvi istuu kukkaniityllä ja tihkuttaa kyyneliä
STORY_SCENES.treklost = function (c, w, h, t) {
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffd8c8');
  g.addColorStop(0.6, '#fff0d8');
  g.addColorStop(1, '#bfe8a8');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  fillHillBand(c, w, h, h * 0.68, '#9edc7c', function (px) { return h * 0.68 - Math.sin(px / w * 5) * h * 0.04; });
  var i;
  for (i = 0; i < 9; i++) drawFlower(c, w * (0.08 + i * 0.11), h * (0.8 + (i % 2) * 0.08), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff'][i % 3]);
  trekDrawPup(c, w * 0.5, h * 0.52 + Math.sin(t * 2) * h * 0.01, h * 0.13, { mood: 'sad', t: t, rain: 0.6 });
};
// Pilvilinna korkealla tähtitaivaalla
STORY_SCENES.trekcastle = function (c, w, h, t) {
  var g = c.createLinearGradient(0, 0, 0, h), i;
  g.addColorStop(0, '#2a2c6e');
  g.addColorStop(1, '#a88cd8');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (i = 0; i < 16; i++) drawStar(c, w * ((i * 0.271) % 1), h * ((i * 0.413) % 0.6), h * 0.012, t + i, 0.4);
  drawCloud(c, w * 0.35, h * 0.72, h * 0.12, 0.95);
  drawCloud(c, w * 0.68, h * 0.75, h * 0.1, 0.95);
  drawCastle(c, w * 0.5, h * 0.7 + Math.sin(t) * h * 0.01, h * 0.42);
  trekDrawPup(c, w * 0.2, h * 0.75, h * 0.07, { mood: 'wow', t: t, look: 1 });
};
// Matka: Pikkupilvi, prinsessa ja yksisarvinen lähtevät
STORY_SCENES.trekroute = function (c, w, h, t) {
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#8fd0ff');
  g.addColorStop(1, '#e6f6ff');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  fillHillBand(c, w, h, h * 0.72, '#9edc7c', function (px) { return h * 0.72 - Math.sin(px / w * 4) * h * 0.03; });
  drawCloud(c, w * 0.82, h * 0.18, h * 0.06, 0.9);
  drawCastle(c, w * 0.84, h * 0.17, h * 0.13);
  drawUnicorn(c, w * 0.42, h * 0.86, h * 0.0024, 1, t * 9, true, t);
  trekDrawPup(c, w * 0.62, h * 0.48 + Math.sin(t * 3) * h * 0.02, h * 0.075, { mood: 'happy', t: t, wave: true, look: 1 });
};
