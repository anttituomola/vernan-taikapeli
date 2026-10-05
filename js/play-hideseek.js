'use strict';

// Kanojen piilosleikki (Kaukamaa, Maalaiskylä): bonushuone H Postireitin
// vartijan jälkeen (kuten Yhteispolku Porkkanakummussa). Linnan kanat ja
// muutama kylän kana ovat karanneet kylään piiloon. Palaute: "erityisplussaa"
// jatkuvista tökättävistä härpättimistä, joten kenttä rakentuu niiden varaan:
// lähes kaikki kylässä on piilopaikka, joka reagoi napautukseen hassusti
// (ämpäristä hyppää sammakko, ikkunasta kurkkaa mummo, kaivo kaikuu...), ja
// joskus sieltä pyrähtää kana. Väärä arvaus ei rankaise: se on itsessään
// palkitseva. Keskivaikea: ei sydämiä, mutta etsimisessä on haastetta.
//
// Eleet ovat tuttuja: kylä on 3–4 ruudun levyinen, ja sitä vieritetään
// raahaamalla. Lyhyt, liikkumaton kosketus = napautus (toteutetaan sormen
// noustessa); liikkuva sormi vierittää eikä koskaan napauta.
// Vihje: piilossa oleva kana kotkottaa välillä. Piilopaikka nytkähtää ja siitä
// leijuu pieni sulka; ääni on sitä kovempi, mitä lähempänä ruutua kana on.
// Ruudun ulkopuolinen kotkotus näkyy sulkana ruudun reunassa (ääni voi olla
// pois). HUD:n korissa näkyvät löydetyt kanat ja puuttuvat varjoina.
// Kierrokset (piilot arvotaan joka kerta):
//   1. 5 kanaa, vihje usein, vihjekäsi näyttää vierityksen ja napautuksen.
//   2. 6 kanaa, joista 2 naamioitunutta (näkyvissä mutta maastoutuneena:
//      heinäpaalin päällä, pyykkinarulla, halkopinossa, pensaasta pilkistäen).
//   3. 7 kanaa (1 naamioitunut) ja 2 ovelaa: löydettäessä ne juoksevat kerran
//      näkyvästi uuteen piiloon.
// Joka kierroksella yksi vapaaehtoinen kultakana vaikeassa piilossa (kaivo,
// puun latva, savupiippu, ladon luukku). Se kotkottaa harvoin ja vain
// kilisten; löytymätön kultakana lehahtaa kierroksen lopussa pois.
// Tehtävät 1. ja 2. kierroksen jälkeen (peilikuva, maksu). Lopuksi kanat
// kulkevat jonossa linnan kanalaan, ja jos kultakana löytyi, linnan
// kanatarhaan muuttaa kultainen kana (coopAddGoldHen, flow-coop.js).

var HIDESEEK_ROUNDS = [
  { hens: 5, camo: 0, sly: 0, hint: [3.5, 5.5], idle: 10 },
  { hens: 6, camo: 2, sly: 0, hint: [5, 8], idle: 14 },
  { hens: 7, camo: 1, sly: 2, hint: [6, 9], idle: 16 }
];
var HIDESEEK_GOLD_HINT = [12, 18];  // kultakanan kilinä (s)
var HIDESEEK_DRAG = 0.03;           // raahauksen kynnys (osuus ruudun korkeudesta)
var HIDESEEK_TAP_MAX = 1.5;         // pidempi paikallaan pito ei ole napautus (s)
var HIDESEEK_POP = 0.75;            // kanan pyrähdys piilosta (s)
var HIDESEEK_FLY = 0.85;            // lento koriin (s)

// Rakennukset (taustassa; ikkunat, ovet, piiput ja luukut ovat piilopaikkoja).
// fx = osuus kylän leveydestä, by = maan taso (osuus korkeudesta), sc = koko
var HIDESEEK_BUILDS = [
  { k: 'coop', fx: 0.05, by: 0.66, sc: 1.0 },
  { k: 'house', fx: 0.26, by: 0.64, sc: 1.25, col: '#ffd86a', roof: '#e0604a', who: ['granny', 'cat'], door: 'dog' },
  { k: 'barn', fx: 0.505, by: 0.65, sc: 1.5, door: 'pig' },
  { k: 'house', fx: 0.85, by: 0.64, sc: 1.2, col: '#a8d8ff', roof: '#7a6ad0', who: ['grandpa', 'granny'], door: 'sheep' }
];
// Vapaat piilopaikat. gold = kultakanan piilo, camo = naamioitumispaikka
var HIDESEEK_FREE = [
  { t: 'crate', fx: 0.095, by: 0.885, sc: 0.85 },
  { t: 'well', fx: 0.128, by: 0.73, sc: 1.0, gold: true },
  { t: 'bucket', fx: 0.163, by: 0.85, sc: 0.8 },
  { t: 'mailbox', fx: 0.19, by: 0.75, sc: 0.9 },
  { t: 'pot', fx: 0.212, by: 0.875, sc: 0.8, v: 0 },
  { t: 'pot', fx: 0.312, by: 0.85, sc: 0.75, v: 1 },
  { t: 'barrow', fx: 0.338, by: 0.94, sc: 0.9 },
  { t: 'laundry', fx: 0.378, by: 0.72, sc: 1.0, camo: true },
  { t: 'bush', fx: 0.418, by: 0.83, sc: 1.0, camo: true },
  { t: 'bale', fx: 0.458, by: 0.9, sc: 1.0, camo: true },
  { t: 'bale', fx: 0.565, by: 0.86, sc: 0.95, camo: true },
  { t: 'barrel', fx: 0.603, by: 0.955, sc: 0.85 },
  { t: 'tractor', fx: 0.612, by: 0.77, sc: 1.1 },
  { t: 'cow', fx: 0.662, by: 0.84, sc: 1.0 },
  { t: 'pumpkin', fx: 0.688, by: 0.95, sc: 0.9 },
  { t: 'tree', fx: 0.712, by: 0.72, sc: 1.3, gold: true },
  { t: 'hive', fx: 0.748, by: 0.87, sc: 0.85 },
  { t: 'bush', fx: 0.778, by: 0.76, sc: 0.9, camo: true },
  { t: 'sunflower', fx: 0.8, by: 0.93, sc: 1.0 },
  { t: 'woodpile', fx: 0.905, by: 0.84, sc: 1.0, camo: true },
  { t: 'doghouse', fx: 0.952, by: 0.8, sc: 1.0 },
  { t: 'barrel', fx: 0.982, by: 0.92, sc: 0.8 }
];

var hideseek = {
  round: 0, state: 'intro', t: 0, R: null, VW: 0, spots: [], order: [], hens: [], foundCols: [],
  feathers: [], edges: [], crit: [], press: null, camV: 0, camF: 0, follow: null,
  slotN: 0, goldFound: [], bump: [], goldBump: 0, hintT: 0, goldHintT: 0, sinceFind: 0,
  lastHint: null, dragged: false, finds: 0, taskDelay: -1, wonT: 0, march: [], coopResult: '',
  chorusT: 0, stats: null
};

function hideseekRand(a, b) { return a + Math.random() * (b - a); }
function hideseekHenSize() { return viewH * 0.062; }

// ---------- Kylä ja piilopaikat ----------
function hideseekLayout() {
  // Taustakuva on maailman levyinen (worldW), joten kylä ei saa olla sitä leveämpi
  return { VW: Math.min(Math.max(viewW * 3.2, viewH * 5), worldW || 1e9) };
}
function hideseekBuildGeom(B, VW) {
  return { x: B.fx * VW, by: B.by * viewH, s: viewH * 0.1 * B.sc };
}
// Talon osat (s = talon mittayksikkö): seinä, katto, ikkunat, ovi, piippu
function hideseekHouseParts(G) {
  var x = G.x, by = G.by, s = G.s;
  return {
    wins: [{ x: x - s * 0.78, y: by - s * 0.85 }, { x: x + s * 0.78, y: by - s * 0.85 }],
    door: { x: x, y: by },
    chimney: { x: x + s * 0.75, y: by - s * 2.35 }
  };
}
function hideseekMkSpot(t, x, y, s, o) {
  var sp = { t: t, x: x, y: y, s: s, gold: !!o.gold, camo: !!o.camo, v: o.v || 0, who: o.who || '', n: 0, tt: -1, a: 0, b: 0, g: 0, jig: 0, hen: null, flag: 0 };
  return sp;
}
// Paikat rakennetaan uudestaan koon muuttuessa; tila (kana, laskurit) säilyy
function hideseekBuildSpots() {
  var L = hideseekLayout(), list = [], i, B, G, P, d, old = hideseek.spots, k;
  hideseek.VW = L.VW;
  for (i = 0; i < HIDESEEK_BUILDS.length; i++) {
    B = HIDESEEK_BUILDS[i];
    G = hideseekBuildGeom(B, L.VW);
    if (B.k === 'house') {
      P = hideseekHouseParts(G);
      list.push(hideseekMkSpot('window', P.wins[0].x, P.wins[0].y, G.s, { who: B.who[0] }));
      list.push(hideseekMkSpot('window', P.wins[1].x, P.wins[1].y, G.s, { who: B.who[1] }));
      list.push(hideseekMkSpot('door', P.door.x, P.door.y, G.s, { who: B.door }));
      list.push(hideseekMkSpot('chimney', P.chimney.x, P.chimney.y, G.s, { gold: true }));
    } else if (B.k === 'barn') {
      list.push(hideseekMkSpot('door', G.x, G.by, G.s, { who: B.door, v: 1 }));
      list.push(hideseekMkSpot('loft', G.x, G.by - G.s * 2.05, G.s, { gold: true }));
    } else if (B.k === 'coop') {
      list.push(hideseekMkSpot('hatch', G.x - G.s * 0.42, G.by - G.s * 0.12, G.s, {}));
    }
  }
  for (i = 0; i < HIDESEEK_FREE.length; i++) {
    d = HIDESEEK_FREE[i];
    list.push(hideseekMkSpot(d.t, d.fx * L.VW, d.by * viewH, viewH * 0.1 * d.sc, d));
  }
  // Vanha tila talteen (sama järjestys)
  if (old && old.length === list.length) {
    for (i = 0; i < list.length; i++) {
      for (k in old[i]) if (k !== 'x' && k !== 'y' && k !== 's') list[i][k] = old[i][k];
    }
  }
  hideseek.spots = list;
  hideseek.order = list.map(function (sp, j) { return j; }).sort(function (a, b) { return list[a].y - list[b].y; });
  for (i = 0; i < hideseek.hens.length; i++) {
    var hn = hideseek.hens[i];
    if (hn.spot >= 0 && (hn.state === 'hidden' || hn.state === 'pop' || hn.state === 'bye')) {
      var an = hn.camo ? hideseekCamoPos(list[hn.spot]) : hideseekAnchor(list[hn.spot]);
      hn.x = an.x; hn.y = an.y;
    }
  }
}
function hideseekType(sp) { return HIDESEEK_TYPES[sp.t]; }
// Kanan pyrähdyskohta (jalat), maailmakoordinaateissa
function hideseekAnchor(sp) {
  var T = hideseekType(sp);
  return { x: sp.x + T.ax * sp.s, y: sp.y + T.ay * sp.s };
}
// Naamioituneen kanan paikka
function hideseekCamoPos(sp) {
  var T = hideseekType(sp);
  return { x: sp.x + T.camo.x * sp.s, y: sp.y + T.camo.y * sp.s };
}
function hideseekHitSpot(sp, wx, wy) {
  var T = hideseekType(sp), D = (T.hit && T.hit(sp)) || T, pad = viewH * 0.02, hw = D.w * sp.s / 2 + pad;
  return wx > sp.x - hw && wx < sp.x + hw && wy < sp.y + sp.s * 0.15 + pad && wy > sp.y - D.h * sp.s - pad;
}
function hideseekOnScreen(x, m) {
  m = m || 0;
  return x - camX > -m && x - camX < viewW + m;
}

// ---------- Äänet ----------
function hideseekCluck(d, vol, up) {
  var f = (520 + Math.random() * 90) * (up || 1);
  playNote(f, d, 0.05, 'square', vol);
  playNote(f * 0.9, d + 0.1, 0.05, 'square', vol);
  playNote(f * 1.05, d + 0.2, 0.08, 'square', vol);
}
function hideseekHappy(d) {
  hideseekCluck(d, 0.12, 1.15);
  playNote(880, d + 0.32, 0.08, 'square', 0.1);
  playNote(1175, d + 0.42, 0.18, 'square', 0.1);
}
function hideseekTinkle(d, vol) {
  playNote(1568, d, 0.12, 'sine', vol);
  playNote(2093, d + 0.08, 0.14, 'sine', vol * 0.8);
  playNote(2637, d + 0.16, 0.2, 'sine', vol * 0.6);
}
// Äänen voimakkuus etäisyyden mukaan (ruudun keskeltä)
function hideseekVol(x, base) {
  var d = Math.abs(x - (camX + viewW / 2)) / viewW;
  return Math.max(base * 0.18, base * (1 - Math.min(1, d / 1.7)));
}

// ---------- Alustus ----------
function initHideseek() {
  tasks = [makeTask(-5, 'mirror'), makeTask(-5, 'pay')];
  for (var i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  hideseek.round = 0;
  hideseek.state = 'intro';
  hideseek.t = 0;
  hideseek.R = HIDESEEK_ROUNDS[0];
  hideseek.spots = [];
  hideseek.hens = [];
  hideseek.foundCols = [];
  hideseek.feathers = [];
  hideseek.edges = [];
  hideseek.crit = [];
  hideseek.press = null;
  hideseek.camV = 0;
  hideseek.camF = 0;
  hideseek.follow = null;
  hideseek.goldFound = [];
  hideseek.bump = [];
  hideseek.goldBump = 0;
  hideseek.dragged = false;
  hideseek.finds = 0;
  hideseek.taskDelay = -1;
  hideseek.wonT = 0;
  hideseek.march = [];
  hideseek.coopResult = '';
  hideseek.lastHint = null;
  hideseek.chorusT = 0;
  hideseek.allInT = 0;
  hideseek.stats = { taps: 0, wrong: 0, finds: 0, drags: 0, gold: 0, roundT: [] };
  hideseekBuildSpots();
  hideseekSetupProps();
  renderBackground();
}
function respawnHideseek() { hideseekStartRound(); }
function resizeHideseek() {
  hideseekBuildSpots();
  camX = Math.max(0, Math.min(hideseek.VW - viewW, hideseek.camF * Math.max(0, hideseek.VW - viewW)));
  hideseekSetupProps();
}

// Koristeet, jotka eivät ole piilopaikkoja (tökättäviä nekin)
function hideseekSetupProps() {
  var VW = hideseek.VW, h = viewH, G = hideseekBuildGeom(HIDESEEK_BUILDS[0], VW), s = G.s;
  propsReset();
  // Kukko kanalan katolla: kiekuu; viides tökkäys herättää kaikki piilossa olevat kotkottamaan
  propAdd({
    x: G.x + s * 0.05, y: G.by - s * 1.9, r: s * 0.5, hy: s * 0.3, color: '#ff7a5a', note: 784, amp: 0.2, crowT: 0,
    update: function (p, dt) { if (p.crowT > 0) p.crowT -= dt; },
    draw: function (c, p) { postDrawRooster(c, s * 0.24, p.crowT > 0 ? Math.min(1, p.crowT * 2) : 0); },
    poke: function (p) {
      p.crowT = 1.0;
      postRoosterCrow(0);
      if (p.n % 5 === 0 && hideseek.state === 'play') hideseek.chorusT = 0.9;
    }
  });
  trainAddMill(VW * 0.645, h * 0.575, h * 0.06);
  trainAddFenceSheep(VW * 0.752, h * 0.62, h * 0.045);
  trainAddScarecrow(VW * 0.684, h * 0.62, h * 0.05);
  trainAddCat(VW * 0.81, h * 0.645, h * 0.035, -1, 0);
  trainAddFlowers(VW * 0.07, h * 0.975, h * 0.04);
  trainAddFlowers(VW * 0.52, h * 0.985, h * 0.04);
  trainAddFlowers(VW * 0.86, h * 0.975, h * 0.04);
}

// ---------- Kierros ----------
function hideseekStartRound() {
  var R = HIDESEEK_ROUNDS[hideseek.round], spots = hideseek.spots, i, tries, pick, ok, nView, idx, gi, camoIdx, k, sp, hn, cols;
  hideseek.R = R;
  for (i = 0; i < spots.length; i++) spots[i].hen = null;
  hideseek.hens = [];
  hideseek.slotN = 0;
  hideseek.bump = [];
  hideseek.feathers = [];
  hideseek.edges = [];
  hideseek.follow = null;
  // Arvonta: kultakana kultapiiloon, naamioituneet naamiopaikkoihin, muut minne vain.
  // Nykyisessä näkymässä enintään kaksi kanaa (1. kierroksella vähintään yksi).
  for (tries = 0; tries < 80; tries++) {
    idx = shuffleNums(spots.map(function (s2, j) { return j; }));
    gi = -1;
    for (i = 0; i < idx.length; i++) if (spots[idx[i]].gold) { gi = idx[i]; break; }
    pick = [];
    camoIdx = [];
    for (i = 0; i < idx.length && camoIdx.length < R.camo; i++) if (spots[idx[i]].camo && idx[i] !== gi) camoIdx.push(idx[i]);
    for (i = 0; i < idx.length && pick.length + camoIdx.length < R.hens; i++) {
      k = idx[i];
      if (k === gi || camoIdx.indexOf(k) >= 0) continue;
      pick.push(k);
    }
    nView = 0;
    for (i = 0; i < pick.length; i++) if (hideseekOnScreen(spots[pick[i]].x, -viewH * 0.05)) nView++;
    for (i = 0; i < camoIdx.length; i++) if (hideseekOnScreen(spots[camoIdx[i]].x, -viewH * 0.05)) nView++;
    ok = nView <= 2 && (hideseek.round > 0 || nView >= 1) && !hideseekOnScreen(spots[gi].x, viewW * 0.2);
    if (ok) break;
  }
  cols = shuffleNums([0, 1, 2, 3, 0, 1, 2, 3]);
  for (i = 0; i < pick.length; i++) hideseek.hens.push(hideseekMkHen(pick[i], cols[i % cols.length], false, false));
  for (i = 0; i < camoIdx.length; i++) {
    sp = spots[camoIdx[i]];
    var cc = hideseekType(sp).camo.cols;
    hideseek.hens.push(hideseekMkHen(camoIdx[i], cc[Math.floor(Math.random() * cc.length)], false, true));
  }
  // Ovelat: tavallisia (ei naamioituneita), mieluummin näkymän ulkopuolelta
  var slyN = 0;
  for (i = 0; i < hideseek.hens.length && slyN < R.sly; i++) {
    hn = hideseek.hens[i];
    if (!hn.camo && !hideseekOnScreen(hn.x)) { hn.sly = true; slyN++; }
  }
  for (i = 0; i < hideseek.hens.length && slyN < R.sly; i++) {
    hn = hideseek.hens[i];
    if (!hn.camo && !hn.sly) { hn.sly = true; slyN++; }
  }
  hideseek.hens.push(hideseekMkHen(gi, COOP_GOLD_C, true, false));
  hideseek.state = 'play';
  hideseek.t = 0;
  hideseek.hintT = 2.2;
  hideseek.goldHintT = hideseekRand(HIDESEEK_GOLD_HINT[0], HIDESEEK_GOLD_HINT[1]) * 0.6;
  hideseek.sinceFind = 0;
  hideseek.lastHint = null;
  // Kanat juoksevat piiloon: kotkotuskuoro joka puolelta
  for (i = 0; i < hideseek.hens.length - 1; i++) hideseekCluck(0.1 + i * 0.18, hideseekVol(hideseek.hens[i].x, 0.1), 1);
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function hideseekMkHen(spotI, col, gold, camo) {
  var sp = hideseek.spots[spotI], an = camo ? hideseekCamoPos(sp) : hideseekAnchor(sp);
  var hn = { spot: spotI, col: col, gold: gold, camo: camo, sly: false, slyUsed: false, state: 'hidden', t: 0, x: an.x, y: an.y, dir: Math.random() < 0.5 ? -1 : 1, slot: -1, x0: 0, y0: 0, x1: 0, y1: 0, dur: 1, sx: 0, sy: 0, ph: Math.random() * 6 };
  sp.hen = hn;
  return hn;
}
function hideseekNormalLeft() {
  var i, n = 0;
  for (i = 0; i < hideseek.hens.length; i++) if (!hideseek.hens[i].gold && hideseek.hens[i].state !== 'home') n++;
  return n;
}
function hideseekGoldHen() {
  var i;
  for (i = 0; i < hideseek.hens.length; i++) if (hideseek.hens[i].gold) return hideseek.hens[i];
  return null;
}

// ---------- Napautus ja vieritys ----------
// Kosketus vain kirjataan; sormen noustessa (päivityksessä) päätetään,
// oliko se napautus vai raahaus.
function handleHideseekTap(px, py) {
  if (puzzleBusy()) return;
  hideseek.press = { x: px, y: py, t: globalT, cam0: camX, moved: false, lx: px, v: 0 };
  hideseek.camV = 0;
  hideseek.follow = null;
}
function hideseekUpdatePress(dt) {
  var p = hideseek.press, dx, dy, tgt, maxC = Math.max(0, hideseek.VW - viewW);
  if (!p) {
    if (hideseek.camV) {
      camX += hideseek.camV * dt;
      hideseek.camV *= Math.exp(-dt * 3.5);
      if (camX < 0 || camX > maxC) hideseek.camV = 0;
      if (Math.abs(hideseek.camV) < viewW * 0.02) hideseek.camV = 0;
    }
    camX = Math.max(0, Math.min(maxC, camX));
    return;
  }
  if (holding) {
    dx = lastPX - p.x;
    dy = lastPY - p.y;
    if (!p.moved && Math.abs(dx) + Math.abs(dy) > viewH * HIDESEEK_DRAG) {
      p.moved = true;
      hideseek.dragged = true;
      hideseek.stats.drags++;
    }
    if (p.moved) {
      tgt = Math.max(0, Math.min(maxC, p.cam0 - dx));
      if (dt > 0) p.v = p.v * 0.6 + ((lastPX - p.lx) / dt) * 0.4;
      p.lx = lastPX;
      camX = tgt;
    }
    return;
  }
  // Sormi nousi
  hideseek.press = null;
  if (p.moved) {
    hideseek.camV = Math.max(-viewW * 2.5, Math.min(viewW * 2.5, -p.v));
    return;
  }
  if (globalT - p.t < HIDESEEK_TAP_MAX) hideseekTapAt(p.x, p.y);
}
function hideseekTapAt(px, py) {
  var wx = px + camX, i, k, sp, hn, best = null, hs = hideseekHenSize(), H = hideseekHud();
  if (puzzleBusy()) return;
  hideseek.stats.taps++;
  // Kori: löydetyt kanat kotkottavat kuorossa
  if (px < H.x1 && py < H.y1 && px > H.left) {
    for (i = 0; i < hideseek.slotN; i++) { hideseek.bump[i] = 0.3 + i * 0.06; hideseekCluck(i * 0.12, 0.08, 1.1); }
    return;
  }
  // Juokseva tai näkyvä (naamioitunut) kana napautetaan suoraan
  if (hideseek.state === 'play') {
    for (i = 0; i < hideseek.hens.length; i++) {
      hn = hideseek.hens[i];
      if (hn.state === 'run' || (hn.state === 'hidden' && hn.camo)) {
        if (Math.hypot(wx - hn.x, py - (hn.y - hs * 0.7)) < hs * 1.0 + viewH * 0.02) { hideseekFind(hn); return; }
      }
    }
  }
  // Piilopaikka: etummainen osuma
  for (k = hideseek.order.length - 1; k >= 0; k--) {
    sp = hideseek.spots[hideseek.order[k]];
    if (hideseekHitSpot(sp, wx, py)) { best = sp; break; }
  }
  if (best) {
    hideseekReact(best);
    hn = best.hen;
    if (hn && hn.state === 'hidden' && hideseek.state === 'play') hideseekFind(hn);
    else hideseek.stats.wrong++;
    return;
  }
  if (propsTap(wx, py)) return;
  spawnSparkles(wx, py, 4, '#ffffff');
}
function hideseekReact(sp) {
  sp.n++;
  sp.tt = 0;
  var T = hideseekType(sp);
  if (T.react) T.react(sp, sp.s);
}

// ---------- Löytö ----------
function hideseekFind(hn) {
  var sp = hn.spot >= 0 ? hideseek.spots[hn.spot] : null, hs = hideseekHenSize();
  if (sp && sp.hen === hn) sp.hen = null;
  if (sp && hn.state === 'hidden' && !hn.camo) {
    var an = hideseekAnchor(sp);
    hn.x = an.x; hn.y = an.y;
  }
  hn.state = 'pop';
  hn.t = 0;
  hn.camo = false;
  hideseek.sinceFind = 0;
  hideseek.finds++;
  hideseek.stats.finds++;
  if (hn.gold) hideseek.stats.gold++;
  artPop(hn.x, hn.y - hs * 0.7, hs * 1.4, hn.gold ? '#ffd24f' : '#ffffff', 'burst');
  spawnSparkles(hn.x, hn.y - hs * 0.7, hn.gold ? 26 : 14, hn.gold ? '#ffd24f' : '#ffe27a');
  hideseekHappy(0);
  if (hn.gold) { hideseekTinkle(0.1, 0.25); hideseekTinkle(0.45, 0.2); }
  else playNote(784, 0.05, 0.1, 'triangle', 0.25);
}
// Ovelan kanan uusi piilo: vapaa paikka 0,35–1,1 ruudun päässä, mieluiten näkyvissä
function hideseekSlyTarget(hn) {
  var i, sp, d, best = -1, bs = -1e9, sc;
  for (i = 0; i < hideseek.spots.length; i++) {
    sp = hideseek.spots[i];
    if (sp.hen || i === hn.spot || sp.t === 'chimney' || sp.t === 'loft' || sp.t === 'window' || sp.t === 'tree') continue;
    d = Math.abs(sp.x - hn.x) / viewW;
    if (d < 0.35 || d > 1.1) continue;
    sc = Math.random() + (hideseekOnScreen(sp.x, -viewW * 0.1) ? 0.6 : 0);
    if (sc > bs) { bs = sc; best = i; }
  }
  return best;
}
function hideseekUpdateHens(dt) {
  var i, hn, k, sp, an, H = hideseekHud(), hs = hideseekHenSize(), done = true;
  for (i = 0; i < hideseek.hens.length; i++) {
    hn = hideseek.hens[i];
    hn.t += dt;
    hn.ph += dt;
    if (hn.state === 'pop' && hn.t >= HIDESEEK_POP) {
      k = hn.sly && !hn.slyUsed ? hideseekSlyTarget(hn) : -1;
      if (k >= 0) {
        // Ovela kana karkaa uuteen piiloon (näkyvä juoksu)
        hn.slyUsed = true;
        hn.state = 'run';
        hn.t = 0;
        hn.spot = k;
        hideseek.spots[k].hen = hn;
        an = hideseekAnchor(hideseek.spots[k]);
        hn.x0 = hn.x; hn.y0 = hn.y; hn.x1 = an.x; hn.y1 = Math.max(an.y, hideseek.spots[k].y - hideseek.spots[k].s * 0.1);
        hn.dur = Math.max(1.1, Math.min(2.4, Math.abs(hn.x1 - hn.x0) / (viewW * 0.45)));
        hn.dir = hn.x1 > hn.x0 ? 1 : -1;
        hideseek.follow = hn;
        playNote(988, 0, 0.06, 'square', 0.1);
        playNote(784, 0.08, 0.06, 'square', 0.1);
        playNote(988, 0.16, 0.06, 'square', 0.1);
        playNote(1319, 0.24, 0.12, 'square', 0.1);
      } else {
        hideseekStartFly(hn, H);
      }
    } else if (hn.state === 'run') {
      k = Math.min(1, hn.t / hn.dur);
      hn.x = hn.x0 + (hn.x1 - hn.x0) * easeInOutSine(k);
      hn.y = hn.y0 + (hn.y1 - hn.y0) * k - Math.abs(Math.sin(hn.t * 12)) * hs * 0.18;
      if (Math.random() < dt * 8) spawnDust(hn.x, hn.y, 1, hn.dir);
      if (k >= 1) {
        // Piiloon: paikka nytkähtää, ja kana kotkottaa pian
        hn.state = 'hidden';
        hn.x = hn.x1; hn.y = hn.y1;
        an = hideseekAnchor(hideseek.spots[hn.spot]);
        hn.x = an.x; hn.y = an.y;
        hideseek.spots[hn.spot].jig = 0.8;
        hideseek.follow = null;
        spawnDust(hn.x, hideseek.spots[hn.spot].y, 5, 0);
        playNote(392, 0, 0.08, 'triangle', 0.2);
        if (hideseek.hintT > 3) hideseek.hintT = 3;
      }
    } else if (hn.state === 'fly') {
      if (hn.t >= HIDESEEK_FLY) {
        hn.state = 'home';
        if (hn.gold) { hideseek.goldBump = 0.6; hideseekTinkle(0, 0.25); }
        else { hideseek.bump[hn.slot] = 0.45; soundStar(hn.slot); }
        hideseekCluck(0.05, 0.08, 1.1);
      }
    } else if (hn.state === 'bye' && hn.t > 2.2) {
      hn.state = 'gone';
    }
    if (!hn.gold && hn.state !== 'home') done = false;
  }
  for (i = 0; i < hideseek.bump.length; i++) if (hideseek.bump[i] > 0) hideseek.bump[i] -= dt;
  if (hideseek.goldBump > 0) hideseek.goldBump -= dt;
  if (done && hideseek.state === 'play') hideseekRoundDone();
}
function hideseekStartFly(hn, H) {
  var hs = hideseekHenSize();
  hn.state = 'fly';
  hn.t = 0;
  hn.sx = hn.x - camX;
  hn.sy = hn.y - hs * 0.4;
  if (!hn.gold) hn.slot = hideseek.slotN++;
  hideseek.foundCols.push({ col: hn.col, gold: hn.gold });
}
function hideseekFlyPos(hn) {
  var H = hideseekHud(), tg = hn.gold ? H.gold : H.slot(hn.slot), k = easeInOutSine(hn.t / HIDESEEK_FLY);
  return {
    x: hn.sx + (tg.x - hn.sx) * k,
    y: hn.sy + (tg.y - hn.sy) * k - Math.sin(k * Math.PI) * viewH * 0.18,
    sc: 1 - k * 0.55
  };
}
function hideseekRoundDone() {
  var g = hideseekGoldHen(), R = hideseek.R;
  hideseek.state = 'roundDone';
  hideseek.t = 0;
  hideseek.goldFound[hideseek.round] = !!(g && (g.state === 'fly' || g.state === 'home'));
  // Löytymätön kultakana lehahtaa pois ("ensi kerralla!")
  if (g && g.state === 'hidden') {
    if (hideseek.spots[g.spot].hen === g) hideseek.spots[g.spot].hen = null;
    g.state = 'bye';
    g.t = 0;
    hideseekTinkle(0.2, 0.15);
  }
  playNote(784, 0.2, 0.12, 'triangle', 0.35);
  playNote(988, 0.32, 0.12, 'triangle', 0.35);
  playNote(1319, 0.44, 0.35, 'triangle', 0.35);
  if (hideseek.goldFound[hideseek.round]) playNote(1760, 0.65, 0.3, 'sine', 0.3);
  for (var i = 0; i < hideseek.slotN; i++) hideseek.bump[i] = 0.5 + i * 0.08;
  if (hideseek.round < 2) hideseek.taskDelay = 2.0;
}

// ---------- Vihjeet ----------
function hideseekHint(strong) {
  var i, hn, list = [], cen = camX + viewW / 2, best = null, bd = 1e9;
  for (i = 0; i < hideseek.hens.length; i++) {
    hn = hideseek.hens[i];
    if (!hn.gold && hn.state === 'hidden') list.push(hn);
  }
  if (!list.length) return;
  hn = list[Math.floor(Math.random() * list.length)];
  if (hideseek.round === 0 && Math.random() < 0.6) {
    for (i = 0; i < list.length; i++) if (Math.abs(list[i].x - cen) < bd) { bd = Math.abs(list[i].x - cen); best = list[i]; }
    hn = best;
  }
  hideseekCluckHint(hn, strong);
}
function hideseekCluckHint(hn, strong) {
  var sp = hideseek.spots[hn.spot], vol = hideseekVol(hn.x, 0.16);
  sp.jig = strong ? 0.9 : 0.55;
  hideseekCluck(0, vol, 1);
  if (strong) hideseekCluck(0.45, vol * 0.8, 1.05);
  hideseekFeather(hn, strong);
  hideseek.lastHint = { hen: hn, t: globalT };
}
function hideseekFeather(hn, strong) {
  var hs = hideseekHenSize(), y = hn.y - hs * 0.6, side;
  if (hideseek.feathers.length < 12) hideseek.feathers.push({ x: hn.x, y: y, t: 0, life: strong ? 2.8 : 2.2, gold: hn.gold, ph: Math.random() * 6, col: hn.col });
  if (!hideseekOnScreen(hn.x)) {
    side = hn.x < camX ? -1 : 1;
    hideseek.edges.push({ side: side, y: Math.max(viewH * 0.3, Math.min(viewH * 0.85, y)), t: 0, life: strong ? 2.6 : 2.0, gold: hn.gold });
    if (hideseek.edges.length > 4) hideseek.edges.shift();
  }
}
function hideseekUpdateHints(dt) {
  var R = hideseek.R, g = hideseekGoldHen(), idle = hideseek.sinceFind > R.idle, i, hn;
  hideseek.sinceFind += dt;
  hideseek.hintT -= dt * (idle ? 1.8 : 1);
  if (hideseek.hintT <= 0) {
    hideseekHint(idle);
    hideseek.hintT = hideseekRand(R.hint[0], R.hint[1]);
  }
  if (g && g.state === 'hidden') {
    hideseek.goldHintT -= dt;
    if (hideseek.goldHintT <= 0) {
      hideseek.goldHintT = hideseekRand(HIDESEEK_GOLD_HINT[0], HIDESEEK_GOLD_HINT[1]);
      hideseek.spots[g.spot].jig = 0.35;
      hideseekTinkle(0, hideseekVol(g.x, 0.12));
      hideseekFeather(g, false);
    }
  }
  // Kukon salaisuus: kaikki piilossa olevat kotkottavat vuorotellen
  if (hideseek.chorusT > 0) {
    hideseek.chorusT -= dt;
    if (hideseek.chorusT <= 0) {
      var k = 0;
      for (i = 0; i < hideseek.hens.length; i++) {
        hn = hideseek.hens[i];
        if (hn.state !== 'hidden' || hn.gold) continue;
        hideseek.spots[hn.spot].jig = 0.6;
        hideseekCluck(k * 0.3, hideseekVol(hn.x, 0.14), 1);
        hideseekFeather(hn, false);
        k++;
      }
    }
  }
}

// ---------- Päivitys ----------
function updateHideseek(dt) {
  var busy, i, sp, T, f, e, cr, maxC = Math.max(0, hideseek.VW - viewW), fh;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  if (busy) { hideseek.press = null; hideseek.camV = 0; }
  else hideseekUpdatePress(dt);
  // Kamera seuraa juoksevaa ovelaa kanaa (ellei sormi vieritä)
  fh = hideseek.follow;
  if (fh && !hideseek.press && fh.state === 'run') {
    var sx = fh.x - camX, want = camX;
    if (sx < viewW * 0.22) want = fh.x - viewW * 0.22;
    else if (sx > viewW * 0.78) want = fh.x - viewW * 0.78;
    camX += (Math.max(0, Math.min(maxC, want)) - camX) * Math.min(1, dt * 5);
  }
  if (maxC > 0) hideseek.camF = camX / maxC;
  for (i = 0; i < hideseek.spots.length; i++) {
    sp = hideseek.spots[i];
    if (sp.tt >= 0) { sp.tt += dt; if (sp.tt > 3) sp.tt = -1; }
    if (sp.a > 0) sp.a -= dt;
    if (sp.b > 0) sp.b -= dt;
    if (sp.jig > 0) sp.jig -= dt;
    T = hideseekType(sp);
    if (T.update) T.update(sp, dt);
  }
  for (i = hideseek.feathers.length - 1; i >= 0; i--) {
    f = hideseek.feathers[i];
    f.t += dt;
    if (f.t > f.life) hideseek.feathers.splice(i, 1);
  }
  for (i = hideseek.edges.length - 1; i >= 0; i--) {
    e = hideseek.edges[i];
    e.t += dt;
    if (e.t > e.life) hideseek.edges.splice(i, 1);
  }
  for (i = hideseek.crit.length - 1; i >= 0; i--) {
    cr = hideseek.crit[i];
    cr.t += dt;
    cr.x += cr.vx * dt;
    cr.y += cr.vy * dt;
    if (cr.k === 'puff') { cr.vx *= Math.exp(-dt); cr.vy *= Math.exp(-dt * 0.5); }
    if (cr.t > cr.life) hideseek.crit.splice(i, 1);
  }
  hideseekUpdateHens(dt);
  if (hideseek.taskDelay > 0 && !busy) {
    hideseek.taskDelay -= dt;
    if (hideseek.taskDelay <= 0 && tasks[hideseek.round] && !tasks[hideseek.round].opened) taskStart(tasks[hideseek.round]);
  }
  if (busy || celebrating) return;
  hideseek.t += dt;
  if (hideseek.state === 'intro') { if (hideseek.t > 0.6) hideseekStartRound(); return; }
  if (hideseek.state === 'roundDone') {
    if (hideseek.t > 2.6 && hideseek.taskDelay <= 0) {
      hideseek.stats.roundT.push(+hideseek.t.toFixed(1));
      hideseek.round++;
      if (hideseek.round >= HIDESEEK_ROUNDS.length) hideseekStartWon();
      else hideseekStartRound();
    }
    return;
  }
  if (hideseek.state === 'won') { hideseekUpdateWon(dt); return; }
  hideseekUpdateHints(dt);
}

// ---------- Loppujuhla: kanat jonossa linnan kanalaan ----------
function hideseekCoopDoor() {
  var G = hideseekBuildGeom(HIDESEEK_BUILDS[0], hideseek.VW);
  return { x: G.x + G.s * 0.42, y: G.by };
}
function hideseekStartWon() {
  var i, D = hideseekCoopDoor(), gap = viewH * 0.085, list = hideseek.foundCols.slice(), gold = false;
  hideseek.state = 'won';
  hideseek.t = 0;
  hideseek.wonT = 0;
  hideseek.press = null;
  hideseek.camV = 0;
  // Kultakanat jonon viimeisiksi
  list.sort(function (a, b) { return (a.gold ? 1 : 0) - (b.gold ? 1 : 0); });
  for (i = 0; i < list.length; i++) if (list[i].gold) gold = true;
  hideseek.coopResult = gold && typeof coopAddGoldHen === 'function' ? coopAddGoldHen() : '';
  hideseek.march = [];
  hideseek.allInT = 0;
  for (i = 0; i < list.length; i++) hideseek.march.push({ col: list[i].col, gold: list[i].gold, d: viewW * 0.9 + i * gap, inT: -1 });
  hideseek.marchY = D.y + viewH * 0.06;
  soundFanfare();
}
function hideseekUpdateWon(dt) {
  var D = hideseekCoopDoor(), i, m, all = true, sp = viewH * 0.75;
  hideseek.wonT += dt;
  if (!hideseek.press) camX += (0 - camX) * Math.min(1, dt * 2.5);
  for (i = 0; i < hideseek.march.length; i++) {
    m = hideseek.march[i];
    if (m.inT >= 0) { m.inT += dt; continue; }
    all = false;
    m.d -= sp * dt;
    if (m.d <= 0) {
      m.inT = 0;
      spawnSparkles(D.x, D.y - viewH * 0.05, m.gold ? 20 : 8, m.gold ? '#ffd24f' : '#ffe27a');
      hideseekCluck(0, 0.06, 1.1);
      if (m.gold) hideseekTinkle(0.1, 0.25);
      playNote(660 + (i % 8) * 60, 0.05, 0.1, 'triangle', 0.15);
    }
  }
  if (all && !hideseek.allInT) hideseek.allInT = hideseek.wonT;
  if (hideseek.allInT && hideseek.wonT > hideseek.allInT + 1.2 && !celebrating) startCelebration();
  if (hideseek.wonT > 14 && !celebrating) startCelebration();
}

// ---------- Pienet hahmot ja pudotukset ----------
function hideseekDrawFrog(c, r, gold) {
  var col = gold ? '#ffd24f' : '#6fcf5a', ln = gold ? '#a8801a' : '#2f7a2a';
  artBlob(c, 0, 0, r, r * 0.72, col, { lineColor: ln, hi: 0.3 });
  artCircle(c, -r * 0.45, -r * 0.62, r * 0.32, col, { lineColor: ln });
  artCircle(c, r * 0.45, -r * 0.62, r * 0.32, col, { lineColor: ln });
  artEye(c, -r * 0.45, -r * 0.66, r * 0.18, 0, false);
  artEye(c, r * 0.45, -r * 0.66, r * 0.18, 0, false);
  c.strokeStyle = ln;
  c.lineWidth = Math.max(1, r * 0.1);
  c.beginPath(); c.arc(0, -r * 0.05, r * 0.4, 0.2, Math.PI - 0.2); c.stroke();
}
function hideseekDrawFeather(c, x, y, r, rot, gold) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  artBlob(c, 0, 0, r * 0.35, r, gold ? '#ffe070' : '#ffffff', { lineColor: gold ? '#b8862a' : '#a898b8', shadeTo: gold ? '#f0b830' : '#e6def0' });
  c.strokeStyle = gold ? '#b8862a' : '#a898b8';
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath(); c.moveTo(0, r * 1.25); c.lineTo(0, -r * 0.8); c.stroke();
  c.restore();
}
// Ikkunan asukas: mummo, vaari tai kissa (r = pään säde), kättä heiluttaen
function hideseekDrawFolk(c, who, x, y, r, wave) {
  if (who === 'cat') { postDrawAnimal(c, 'cat', x, y, r, false); return; }
  var bl = (globalT * 0.8 + x * 0.01) % 4 < 0.12;
  if (who === 'granny') {
    artCircle(c, x, y - r * 1.05, r * 0.42, '#e8e4f0', { lineColor: '#9a94aa' });
    artBlob(c, x, y - r * 0.45, r * 1.02, r * 0.6, '#e8e4f0', { lineColor: '#9a94aa' });
  }
  artCircle(c, x, y, r * 0.85, SKIN, { lineColor: SKIN_LINE, hi: 0.2 });
  if (who === 'granny') {
    artBlob(c, x, y - r * 0.62, r * 0.82, r * 0.32, '#e8e4f0', { lineColor: '#9a94aa' });
  } else {
    // Vaari: kalju päälaki, harmaat sivuhiukset ja viikset
    artCircle(c, x - r * 0.82, y - r * 0.15, r * 0.24, '#e8e4f0', { lineColor: '#9a94aa' });
    artCircle(c, x + r * 0.82, y - r * 0.15, r * 0.24, '#e8e4f0', { lineColor: '#9a94aa' });
    artBlob(c, x - r * 0.22, y + r * 0.32, r * 0.28, r * 0.12, '#e8e4f0', { lineColor: '#9a94aa', rot: 0.2 });
    artBlob(c, x + r * 0.22, y + r * 0.32, r * 0.28, r * 0.12, '#e8e4f0', { lineColor: '#9a94aa', rot: -0.2 });
  }
  artEye(c, x - r * 0.3, y - r * 0.05, r * 0.13, 0, bl);
  artEye(c, x + r * 0.3, y - r * 0.05, r * 0.13, 0, bl);
  c.strokeStyle = '#6a5a7a';
  c.lineWidth = Math.max(1, r * 0.07);
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.05, r * 0.24, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x + r * 0.3, y - r * 0.05, r * 0.24, 0, Math.PI * 2); c.stroke();
  if (who === 'granny') {
    c.strokeStyle = '#a0505a';
    c.beginPath(); c.arc(x, y + r * 0.3, r * 0.22, 0.3, Math.PI - 0.3); c.stroke();
  }
  artBlush(c, x - r * 0.55, y + r * 0.25, r * 0.14);
  artBlush(c, x + r * 0.55, y + r * 0.25, r * 0.14);
  if (wave) artCircle(c, x + r * 1.3, y + r * 0.2 - Math.abs(Math.sin(globalT * 9)) * r * 0.5, r * 0.28, SKIN, { lineColor: SKIN_LINE });
}
function hideseekDrop(x, y, vx, vy, ground, draw, life) {
  return propDrop({ x: x, y: y, vx: vx, vy: vy, ground: ground, draw: draw, life: life || 2.2 });
}
function hideseekPuff(x, y, r, vy) {
  if (hideseek.crit.length > 40) return;
  hideseek.crit.push({ k: 'puff', x: x, y: y, vx: (Math.random() - 0.5) * viewH * 0.05, vy: vy, t: 0, life: 1.6, r: r });
}
function hideseekBird(x, y, col) {
  if (hideseek.crit.length > 40) return;
  hideseek.crit.push({ k: 'bird', x: x, y: y, vx: (Math.random() < 0.5 ? -1 : 1) * viewH * (0.35 + Math.random() * 0.2), vy: -viewH * 0.35, t: 0, life: 2.4, r: viewH * 0.018, col: col || '#5fa8ff' });
  playNote(2093, 0.05, 0.06, 'sine', 0.12);
  playNote(2637, 0.13, 0.06, 'sine', 0.12);
  playNote(2349, 0.21, 0.08, 'sine', 0.1);
}
function hideseekHeartUp(x, y, n) {
  for (var i = 0; i < n && hideseek.crit.length < 40; i++) hideseek.crit.push({ k: 'heart', x: x + (i - (n - 1) / 2) * viewH * 0.03, y: y, vx: 0, vy: -viewH * 0.12, t: -i * 0.15, life: 1.6, r: viewH * 0.016 });
}
function hideseekNotes(x, y, n) {
  for (var i = 0; i < n && hideseek.crit.length < 40; i++) hideseek.crit.push({ k: 'note', x: x + (Math.random() - 0.5) * viewH * 0.05, y: y, vx: (Math.random() - 0.5) * viewH * 0.06, vy: -viewH * 0.14, t: -i * 0.2, life: 1.6, r: viewH * 0.015, col: ['#ff7bac', '#8a4dff', '#ffb84f'][i % 3] });
}
function hideseekLeaves(x, y, ground, n, col) {
  for (var i = 0; i < n; i++) {
    hideseekDrop(x + (Math.random() - 0.5) * viewH * 0.08, y, (Math.random() - 0.5) * viewW * 0.06, -viewH * (0.1 + Math.random() * 0.2), ground, function (c) {
      artBlob(c, 0, 0, viewH * 0.009, viewH * 0.005, col || '#5fbf55', { line: false });
    }, 1.8);
  }
}
function hideseekStraw(c) {
  c.strokeStyle = '#d8b040';
  c.lineWidth = Math.max(1, viewH * 0.003);
  c.beginPath(); c.moveTo(-viewH * 0.012, 0); c.lineTo(viewH * 0.012, 0); c.stroke();
}
function hideseekOpen(sp, dur) {
  return sp.a > 0 ? Math.min(1, sp.a * 3, (dur - sp.a) * 5) : 0;
}

// ---------- Piilopaikkatyypit ----------
// w, h: osuma-alue (s-yksiköissä, h maasta ylös); ax, ay: kanan pyrähdyskohta;
// fixed: talon osa (ei kallistu); camo: naamioituneen kanan paikka ja värit
// (behind = piirretään paikan taakse, sit = istuu, over = peite kanan päälle).
// react(sp, s) on paikan oma hassu reaktio; sp.n = tökkäysten määrä.
var HIDESEEK_TYPES = {
  window: {
    w: 0.85, h: 0.85, ax: 0, ay: -0.05, fixed: true,
    draw: function (c, sp, s) {
      var w = s * 0.62, op = hideseekOpen(sp, 2.4), cu = w * (0.3 - op * 0.2);
      artRoundRect(c, -w * 0.58, -w * 1.1, w * 1.16, w * 1.12, w * 0.08, '#ffffff', { lineColor: '#8a6a4a' });
      c.fillStyle = '#bfe6ff';
      roundRect(c, -w * 0.48, -w * 1.0, w * 0.96, w * 0.92, w * 0.05);
      c.fill();
      if (op > 0) {
        c.save();
        roundRect(c, -w * 0.48, -w * 1.0, w * 0.96, w * 0.92, w * 0.05);
        c.clip();
        hideseekDrawFolk(c, sp.who, 0, -w * 0.25 + (1 - op) * w * 0.6, w * 0.3, true);
        c.restore();
      } else {
        c.strokeStyle = '#ffffff';
        c.lineWidth = Math.max(1, w * 0.06);
        c.beginPath(); c.moveTo(0, -w * 1.0); c.lineTo(0, -w * 0.08); c.moveTo(-w * 0.48, -w * 0.54); c.lineTo(w * 0.48, -w * 0.54); c.stroke();
      }
      artBlob(c, -w * 0.48 + cu * 0.5, -w * 0.62, cu * 0.5, w * 0.42, '#ff9ab8', { lineColor: '#c0607a' });
      artBlob(c, w * 0.48 - cu * 0.5, -w * 0.62, cu * 0.5, w * 0.42, '#ff9ab8', { lineColor: '#c0607a' });
      artRoundRect(c, -w * 0.66, -w * 0.1, w * 1.32, w * 0.16, w * 0.05, '#c8945a', { lineColor: '#7a5028' });
      drawFlower(c, -w * 0.4, -w * 0.13, w * 0.07, '#ff7bac');
      drawFlower(c, w * 0.4, -w * 0.13, w * 0.07, '#ffd24f');
    },
    react: function (sp, s) {
      var who = sp.who;
      sp.a = 2.4;
      if (who === 'cat') { playNote(784, 0.1, 0.12, 'triangle', 0.15); playNote(659, 0.22, 0.25, 'triangle', 0.15); }
      else if (who === 'granny') { playNote(988, 0.1, 0.1, 'sine', 0.2); playNote(1175, 0.22, 0.1, 'sine', 0.2); playNote(988, 0.34, 0.15, 'sine', 0.2); }
      else { playNote(262, 0.1, 0.15, 'triangle', 0.25); playNote(220, 0.3, 0.2, 'triangle', 0.25); }
      // Joka kolmas kerta ikkunasta lentää jotain: mummolta pulla, vaarilta pipo, kissalta kerä
      if (sp.n % 3 === 0) {
        hideseekDrop(sp.x, sp.y - s * 0.3, (Math.random() - 0.5) * viewW * 0.08, -viewH * 0.35, sp.y + s * 0.9, function (c) {
          var r = viewH * 0.016;
          if (who === 'cat') { artCircle(c, 0, 0, r, '#ff7bac', { lineColor: '#a83a6a' }); c.strokeStyle = '#a83a6a'; c.beginPath(); c.arc(0, 0, r * 0.55, 0, 3); c.stroke(); }
          else if (who === 'granny') { artCircle(c, 0, 0, r, '#e0a050', { lineColor: '#8a5a20', hi: 0.3 }); c.strokeStyle = '#8a5a20'; c.beginPath(); c.arc(0, 0, r * 0.5, 0, 5); c.stroke(); }
          else { artBlob(c, 0, 0, r * 1.1, r * 0.7, '#5fa8ff', { lineColor: '#2a5a9a' }); artCircle(c, 0, -r * 0.8, r * 0.3, '#ffffff', { lineColor: '#2a5a9a' }); }
        }, 2.6);
      }
    }
  },
  door: {
    w: 0.75, h: 1.15, ax: 0.1, ay: 0, fixed: true,
    hit: function (sp) { return sp.v ? { w: 1.05, h: 1.35 } : null; },
    draw: function (c, sp, s) {
      var dw = s * (sp.v ? 1.0 : 0.62), dh = s * (sp.v ? 1.3 : 1.05), op = hideseekOpen(sp, 2.2), lw = dw * (1 - op * 0.75);
      var col = sp.v ? '#c8483a' : '#a06a3a', ln = sp.v ? '#7a2a20' : '#5a3a1a';
      artRoundRect(c, -dw / 2 - s * 0.05, -dh - s * 0.05, dw + s * 0.1, dh + s * 0.05, s * 0.07, '#f4ead8', { lineColor: '#8a6a4a' });
      c.fillStyle = '#4a3434';
      roundRect(c, -dw / 2, -dh, dw, dh, s * 0.05);
      c.fill();
      if (op > 0) postDrawAnimal(c, sp.who, dw * 0.12, -dh * 0.42 + (1 - op) * dh * 0.2, dw * (sp.v ? 0.24 : 0.3), false);
      artRoundRect(c, -dw / 2, -dh, lw, dh, s * 0.05, col, { lineColor: ln });
      if (sp.v) {
        c.strokeStyle = '#fff4e8';
        c.lineWidth = Math.max(1, s * 0.05);
        c.beginPath(); c.moveTo(-dw / 2 + s * 0.06, -dh + s * 0.06); c.lineTo(-dw / 2 + lw - s * 0.06, -s * 0.06); c.moveTo(-dw / 2 + lw - s * 0.06, -dh + s * 0.06); c.lineTo(-dw / 2 + s * 0.06, -s * 0.06); c.stroke();
      }
      artCircle(c, -dw / 2 + lw * 0.82, -dh * 0.48, s * 0.04, '#ffd24f', { line: false });
      artRoundRect(c, -dw / 2 - s * 0.08, -s * 0.04, dw + s * 0.16, s * 0.08, s * 0.03, '#b8a890', { lineColor: '#7a6a50' });
    },
    react: function (sp, s) {
      sp.a = 2.2;
      playNote(300, 0, 0.15, 'sawtooth', 0.04);
      postAnimalSound(sp.who, 0.25);
      if (sp.n % 4 === 0) hideseekHeartUp(sp.x, sp.y - s * 1.2, 3);
    }
  },
  chimney: {
    w: 0.6, h: 1.0, ax: 0, ay: -0.72, fixed: true,
    update: function (sp, dt) {
      if (sp.b <= 0) { sp.b = 1.6 + Math.random(); if (hideseekOnScreen(sp.x, viewW * 0.2)) hideseekPuff(sp.x + sp.s * 0.02, sp.y - sp.s * 0.78, sp.s * 0.1, -viewH * 0.07); }
    },
    draw: function (c, sp, s) {
      artRoundRect(c, -s * 0.18, -s * 0.72, s * 0.36, s * 0.8, s * 0.04, '#c8604a', { lineColor: '#7a3020' });
      c.strokeStyle = 'rgba(122,48,32,0.45)';
      c.lineWidth = Math.max(1, s * 0.03);
      c.beginPath(); c.moveTo(-s * 0.18, -s * 0.45); c.lineTo(s * 0.18, -s * 0.45); c.moveTo(-s * 0.18, -s * 0.2); c.lineTo(s * 0.18, -s * 0.2); c.moveTo(0, -s * 0.72); c.lineTo(0, -s * 0.45); c.stroke();
      artRoundRect(c, -s * 0.24, -s * 0.8, s * 0.48, s * 0.12, s * 0.04, '#8a4a3a', { lineColor: '#5a2a1a' });
    },
    react: function (sp, s) {
      var i;
      for (i = 0; i < 3; i++) hideseekPuff(sp.x, sp.y - s * 0.8, s * (0.14 + i * 0.05), -viewH * (0.12 + i * 0.05));
      if (sp.n % 5 === 0) hideseekHeartUp(sp.x, sp.y - s * 1.2, 1);
      playNote(196, 0, 0.12, 'triangle', 0.2);
      playNote(175, 0.18, 0.16, 'triangle', 0.18);
    }
  },
  loft: {
    w: 0.8, h: 0.8, ax: 0, ay: -0.05, fixed: true,
    draw: function (c, sp, s) {
      var w = s * 0.62, op = hideseekOpen(sp, 2.0), lw = w / 2 * (1 - op * 0.75);
      artRoundRect(c, -w / 2 - s * 0.05, -w - s * 0.05, w + s * 0.1, w + s * 0.1, s * 0.05, '#fff4e8', { lineColor: '#8a6a4a' });
      c.fillStyle = '#3a2a2a';
      c.fillRect(-w / 2, -w, w, w);
      if (op > 0) artBlob(c, 0, -w * 0.25, w * 0.4, w * 0.25, '#f2cf6a', { lineColor: '#a8803a' });
      artRoundRect(c, -w / 2, -w, lw, w, s * 0.03, '#c8483a', { lineColor: '#7a2a20' });
      artRoundRect(c, w / 2 - lw, -w, lw, w, s * 0.03, '#c8483a', { lineColor: '#7a2a20' });
    },
    react: function (sp, s) {
      var i;
      sp.a = 2.0;
      playNote(330, 0, 0.12, 'sawtooth', 0.04);
      for (i = 0; i < 5; i++) hideseekDrop(sp.x + (Math.random() - 0.5) * s * 0.4, sp.y - s * 0.2, (Math.random() - 0.5) * viewW * 0.05, -viewH * 0.05, sp.y + s * 2.05, hideseekStraw, 2.2);
      if (sp.n % 3 === 0) hideseekBird(sp.x, sp.y - s * 0.4, '#a8805a');
    }
  },
  hatch: {
    w: 0.65, h: 0.65, ax: 0.1, ay: 0.12, fixed: true,
    draw: function (c, sp, s) {
      var w = s * 0.42, op = hideseekOpen(sp, 2.0);
      artLimb(c, s * 0.05, -s * 0.02, s * 0.5, s * 0.12, s * 0.08, '#c8945a', '#7a5028');
      c.fillStyle = '#3a2a2a';
      roundRect(c, -w / 2, -w, w, w, s * 0.05);
      c.fill();
      if (op > 0) drawCoopBirdShape(c, 'chick', 0, s * 0.02, -s * 0.02 - (1 - op) * w * 0.5, s * 0.38, 1, { flap: false, peck: 0, sit: true, blink: false, crow: false, age: 0 });
      c.save();
      c.translate(0, -w);
      c.scale(1, 1 - op * 0.85);
      artRoundRect(c, -w / 2, 0, w, w, s * 0.05, '#ff9a6a', { lineColor: '#8a4a2a' });
      c.restore();
    },
    react: function (sp, s) {
      sp.a = 2.0;
      coopCheep(0.15);
      coopCheep(0.4);
    }
  },
  well: {
    w: 1.3, h: 2.3, ax: 0, ay: -0.8,
    draw: function (c, sp, s) {
      var bob = sp.a > 0 ? Math.sin(sp.a * 8) * s * 0.12 * sp.a : 0;
      artShadow(c, 0, 0, s * 0.75, s * 0.15, 0.16);
      artLimb(c, -s * 0.5, -s * 0.7, -s * 0.5, -s * 1.95, s * 0.1, '#a06a3a', '#5a3a1a');
      artLimb(c, s * 0.5, -s * 0.7, s * 0.5, -s * 1.95, s * 0.1, '#a06a3a', '#5a3a1a');
      c.beginPath(); c.moveTo(-s * 0.72, -s * 1.85); c.lineTo(0, -s * 2.35); c.lineTo(s * 0.72, -s * 1.85); c.closePath();
      artFillPath(c, '#d8604a', -s * 2.35, -s * 1.85, s * 0.4, { lineColor: '#7a2a20' });
      artLimb(c, -s * 0.5, -s * 1.6, s * 0.5, -s * 1.6, s * 0.06, '#8a5a30', '#5a3a1a');
      c.strokeStyle = '#8a7a5a';
      c.lineWidth = Math.max(1, s * 0.025);
      c.beginPath(); c.moveTo(0, -s * 1.6); c.lineTo(0, -s * 1.2 + bob); c.stroke();
      artRoundRect(c, -s * 0.12, -s * 1.22 + bob, s * 0.24, s * 0.2, s * 0.04, '#9ab8d0', { lineColor: '#4a6a8a' });
      artRoundRect(c, -s * 0.58, -s * 0.78, s * 1.16, s * 0.8, s * 0.12, '#c4bcd2', { lineColor: '#6a6280' });
      c.strokeStyle = 'rgba(106,98,128,0.5)';
      c.lineWidth = Math.max(1, s * 0.03);
      c.beginPath(); c.moveTo(-s * 0.58, -s * 0.4); c.lineTo(s * 0.58, -s * 0.4); c.moveTo(-s * 0.2, -s * 0.78); c.lineTo(-s * 0.2, -s * 0.4); c.moveTo(s * 0.25, -s * 0.4); c.lineTo(s * 0.25, 0); c.stroke();
      artBlob(c, 0, -s * 0.78, s * 0.52, s * 0.1, '#3a4a6a', { lineColor: '#6a6280' });
    },
    react: function (sp, s) {
      var i;
      sp.a = 1.2;
      // Kaivon kaiku: huhuu... huhuu... huhuu
      for (i = 0; i < 3; i++) {
        playNote(523, i * 0.45, 0.25, 'sine', 0.22 / (1 + i * 1.5));
        playNote(392, i * 0.45 + 0.15, 0.3, 'sine', 0.2 / (1 + i * 1.5));
      }
      for (i = 0; i < 3; i++) hideseekDrop(sp.x + (Math.random() - 0.5) * s * 0.5, sp.y - s * 0.8, (Math.random() - 0.5) * viewW * 0.04, -viewH * 0.3, sp.y - s * 0.75, function (c) { artCircle(c, 0, 0, viewH * 0.006, '#7fd4ff', { line: false }); }, 0.8);
      // Viides huhuilu: kaivosta loikkaa kultainen sammakko
      if (sp.n % 5 === 0) {
        hideseekDrop(sp.x, sp.y - s * 0.85, viewW * 0.05, -viewH * 0.55, sp.y + s * 0.05, function (c) { hideseekDrawFrog(c, viewH * 0.02, true); }, 2.4);
        hideseekTinkle(0.3, 0.2);
      }
    }
  },
  bucket: {
    w: 1.0, h: 1.2, ax: 0, ay: -0.85, amp: 0.25,
    draw: function (c, sp, s) {
      artShadow(c, 0, 0, s * 0.45, s * 0.1, 0.16);
      c.strokeStyle = '#4a6a8a';
      c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.arc(0, -s * 0.85, s * 0.36, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.4, -s * 0.85); c.lineTo(s * 0.4, -s * 0.85); c.lineTo(s * 0.3, 0); c.lineTo(-s * 0.3, 0); c.closePath();
      artFillPath(c, '#9ab8d0', -s * 0.85, 0, s * 0.4, { lineColor: '#4a6a8a' });
      artBlob(c, 0, -s * 0.85, s * 0.4, s * 0.09, '#5a7a98', { lineColor: '#4a6a8a' });
      c.strokeStyle = 'rgba(74,106,138,0.5)';
      c.beginPath(); c.moveTo(-s * 0.36, -s * 0.55); c.lineTo(s * 0.36, -s * 0.55); c.stroke();
    },
    react: function (sp, s) {
      var gold = sp.n % 5 === 0;
      playNote(1200, 0, 0.04, 'square', 0.07);
      playNote(900, 0.05, 0.04, 'square', 0.07);
      playNote(1400, 0.1, 0.05, 'square', 0.05);
      hideseekDrop(sp.x, sp.y - s * 0.9, (Math.random() < 0.5 ? -1 : 1) * viewW * 0.07, -viewH * 0.6, sp.y + s * 0.05, function (c) { hideseekDrawFrog(c, viewH * 0.02, gold); }, 2.2);
      playNote(196, 0.2, 0.12, 'square', 0.08);
      playNote(165, 0.36, 0.15, 'square', 0.08);
      if (gold) hideseekTinkle(0.4, 0.2);
    }
  },
  crate: {
    w: 1.1, h: 1.0, ax: 0, ay: -0.8,
    draw: function (c, sp, s) {
      var op = hideseekOpen(sp, 2.0);
      artShadow(c, 0, 0, s * 0.6, s * 0.12, 0.16);
      if (op > 0) postDrawAnimal(c, 'cat', 0, -s * 0.75 - op * s * 0.15, s * 0.24, false);
      artRoundRect(c, -s * 0.5, -s * 0.72, s * 1.0, s * 0.72, s * 0.06, '#d8a86a', { lineColor: '#7a5028' });
      c.strokeStyle = 'rgba(122,80,40,0.6)';
      c.lineWidth = Math.max(1, s * 0.04);
      c.beginPath(); c.moveTo(-s * 0.5, -s * 0.36); c.lineTo(s * 0.5, -s * 0.36); c.moveTo(-s * 0.45, -s * 0.68); c.lineTo(s * 0.45, -s * 0.04); c.stroke();
      c.save();
      c.translate(-s * 0.52, -s * 0.72);
      c.rotate(-op * 0.6);
      artRoundRect(c, 0, -s * 0.1, s * 1.04, s * 0.12, s * 0.04, '#c8945a', { lineColor: '#7a5028' });
      c.restore();
    },
    react: function (sp, s) {
      sp.a = 2.0;
      playNote(784, 0.15, 0.12, 'triangle', 0.15);
      playNote(659, 0.27, 0.25, 'triangle', 0.15);
      if (sp.n % 3 === 0) hideseekHeartUp(sp.x, sp.y - s * 1.2, 2);
    }
  },
  mailbox: {
    w: 0.8, h: 1.2, ax: 0, ay: -1.1, amp: 0.15,
    update: function (sp, dt) { sp.flag += ((sp.g ? 1 : 0) - sp.flag) * Math.min(1, dt * 8); },
    draw: function (c, sp, s) { artShadow(c, 0, 0, s * 0.4, s * 0.08, 0.16); postDrawMailbox(c, s * 0.55, sp.flag); },
    react: function (sp, s) {
      sp.g = sp.g ? 0 : 1;
      hideseekDrop(sp.x, sp.y - s * 0.95, viewW * 0.04, -viewH * 0.5, sp.y + s * 0.15, function (c) { postDrawEnvelope(c, 0, 0, s * 0.3, s * 0.2); }, 2.2);
      playNote(1047, 0.05, 0.12, 'triangle', 0.25);
    }
  },
  pot: {
    w: 0.9, h: 1.7, ax: 0, ay: -0.6,
    draw: function (c, sp, s) {
      var top = -s * (0.9 + sp.g * 0.32), col = sp.v ? '#b98aff' : '#ff7bac';
      artShadow(c, 0, 0, s * 0.35, s * 0.08, 0.16);
      c.strokeStyle = '#3f9a3a';
      c.lineWidth = Math.max(1, s * 0.06);
      c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, top); c.stroke();
      artBlob(c, -s * 0.15, -s * 0.7 - sp.g * s * 0.12, s * 0.14, s * 0.06, '#5fbf55', { lineColor: '#2f7a2a', rot: -0.5 });
      artBlob(c, s * 0.15, -s * 0.8 - sp.g * s * 0.2, s * 0.14, s * 0.06, '#5fbf55', { lineColor: '#2f7a2a', rot: 0.5 });
      drawFlower(c, 0, top, s * (0.13 + sp.g * 0.03), col);
      c.beginPath(); c.moveTo(-s * 0.32, -s * 0.55); c.lineTo(s * 0.32, -s * 0.55); c.lineTo(s * 0.24, 0); c.lineTo(-s * 0.24, 0); c.closePath();
      artFillPath(c, '#e07a4a', -s * 0.55, 0, s * 0.3, { lineColor: '#8a3a1a' });
      artRoundRect(c, -s * 0.36, -s * 0.6, s * 0.72, s * 0.12, s * 0.04, '#e88a5a', { lineColor: '#8a3a1a' });
    },
    react: function (sp, s) {
      var i;
      // Kukka kasvaa joka napautuksella; neljännellä terälehdet sataa ja se aloittaa alusta
      sp.g++;
      if (sp.g > 3) {
        sp.g = 0;
        for (i = 0; i < 6; i++) {
          hideseekDrop(sp.x, sp.y - s * 2, (Math.random() - 0.5) * viewW * 0.08, -viewH * (0.2 + Math.random() * 0.2), sp.y + s * 0.1, (function (cc) {
            return function (c) { artBlob(c, 0, 0, viewH * 0.008, viewH * 0.005, cc, { line: false }); };
          })(maneColors[i % maneColors.length]), 2.0);
        }
        for (i = 0; i < 5; i++) playNote(659 * Math.pow(1.12, i), i * 0.07, 0.18, 'sine', 0.16);
      } else {
        playNote(523 + sp.g * 130, 0, 0.12, 'triangle', 0.2);
        playNote(784 + sp.g * 130, 0.08, 0.14, 'triangle', 0.16);
      }
    }
  },
  barrow: {
    w: 1.8, h: 1.0, ax: -0.1, ay: -0.75, amp: 0.08,
    draw: function (c, sp, s) {
      var roll = sp.a > 0 ? Math.sin((1.2 - sp.a) * 9) * s * 0.18 * sp.a : 0, hop = sp.a > 0 ? Math.abs(Math.sin(sp.a * 12)) * s * 0.15 : 0;
      c.save();
      c.translate(roll, 0);
      artShadow(c, 0, 0, s * 0.8, s * 0.12, 0.16);
      artLimb(c, -s * 0.45, -s * 0.38, -s * 0.5, 0, s * 0.06, '#8a5a30', '#5a3a1a');
      artLimb(c, -s * 0.6, -s * 0.55, -s * 1.05, -s * 0.62, s * 0.07, '#8a5a30', '#5a3a1a');
      artCircle(c, -s * 0.05, -s * 0.85 - hop, s * 0.26, '#ff9a3a', { lineColor: '#a8501a', hi: 0.3 });
      artLimb(c, -s * 0.05, -s * 1.08 - hop, s * 0.02, -s * 1.2 - hop, s * 0.06, '#5a8a2a', false);
      c.beginPath(); c.moveTo(-s * 0.75, -s * 0.78); c.lineTo(s * 0.6, -s * 0.78); c.lineTo(s * 0.42, -s * 0.35); c.lineTo(-s * 0.6, -s * 0.35); c.closePath();
      artFillPath(c, '#5fa8ff', -s * 0.78, -s * 0.35, s * 0.4, { lineColor: '#2a5a9a' });
      trainDrawWheel(c, s * 0.48, -s * 0.2, s * 0.2, roll / (s * 0.2), '#ffd24f');
      c.restore();
    },
    react: function (sp, s) {
      sp.a = 1.2;
      playNote(1319, 0, 0.05, 'sine', 0.1);
      playNote(1175, 0.15, 0.05, 'sine', 0.1);
      playNote(1319, 0.3, 0.05, 'sine', 0.1);
      playNote(196, 0.2, 0.12, 'triangle', 0.15);
    }
  },
  laundry: {
    w: 2.5, h: 2.1, ax: 0, ay: -1.0, amp: 0.03,
    camo: { x: 0.02, y: -1.66, cols: [0], sit: true },
    draw: function (c, sp, s) {
      var i, C, x, ry, fl, cl = HIDESEEK_CLOTHES;
      artShadow(c, 0, 0, s * 1.2, s * 0.12, 0.14);
      artLimb(c, -s * 1.15, 0, -s * 1.15, -s * 2.0, s * 0.08, '#a06a3a', '#5a3a1a');
      artLimb(c, s * 1.15, 0, s * 1.15, -s * 2.0, s * 0.08, '#a06a3a', '#5a3a1a');
      c.strokeStyle = '#8a7a6a';
      c.lineWidth = Math.max(1, s * 0.025);
      c.beginPath(); c.moveTo(-s * 1.15, -s * 1.9); c.quadraticCurveTo(0, -s * 1.5, s * 1.15, -s * 1.9); c.stroke();
      for (i = 0; i < cl.length; i++) {
        C = cl[i];
        x = C.x * s;
        ry = -s * 1.9 + s * 0.2 * (1 - Math.pow(C.x / 1.15, 2)) + s * 0.02;
        fl = Math.sin(globalT * 2.2 + i * 1.3) * 0.05 + (sp.a > 0 ? Math.sin(sp.a * 22 + i) * 0.35 * Math.min(1, sp.a) : 0);
        c.save();
        c.translate(x, ry);
        c.rotate(fl);
        if (C.k === 'shirt') {
          artRoundRect(c, -s * C.w / 2, 0, s * C.w, s * C.hh, s * 0.05, C.col, { lineColor: artShade(C.col, -0.4) });
          artRoundRect(c, -s * C.w * 0.85, 0, s * C.w * 0.4, s * 0.18, s * 0.04, C.col, { lineColor: artShade(C.col, -0.4) });
          artRoundRect(c, s * C.w * 0.45, 0, s * C.w * 0.4, s * 0.18, s * 0.04, C.col, { lineColor: artShade(C.col, -0.4) });
        } else if (C.k === 'sock') {
          if (sp.b <= 0) {
            artRoundRect(c, -s * C.w / 2, 0, s * C.w, s * C.hh, s * 0.05, C.col, { lineColor: '#2a5a9a' });
            artBlob(c, s * 0.04, s * C.hh, s * 0.12, s * 0.07, C.col, { lineColor: '#2a5a9a' });
          }
        } else {
          artRoundRect(c, -s * C.w / 2, 0, s * C.w, s * C.hh, s * 0.03, C.col, { lineColor: '#a898b8', shadeTo: '#ece4f4' });
        }
        artRoundRect(c, -s * 0.03, -s * 0.05, s * 0.06, s * 0.1, s * 0.02, '#ffd24f', { line: false });
        c.restore();
      }
    },
    react: function (sp, s) {
      sp.a = 1.2;
      playNote(880, 0, 0.2, 'sine', 0.08);
      playNote(660, 0.1, 0.25, 'sine', 0.06);
      // Joka toisella lepatuksella sukka lentää narulta (ja palaa hetken päästä)
      if (sp.n % 2 === 1 && sp.b <= 0) {
        sp.b = 2.4;
        hideseekDrop(sp.x + s * 0.82, sp.y - s * 1.8, viewW * 0.08, -viewH * 0.4, sp.y + s * 0.1, function (c) {
          artRoundRect(c, -viewH * 0.006, -viewH * 0.014, viewH * 0.012, viewH * 0.028, viewH * 0.004, '#5fa8ff', { lineColor: '#2a5a9a' });
        }, 2.2);
      }
    }
  },
  bush: {
    w: 2.0, h: 1.3, ax: 0, ay: -0.95, amp: 0.08,
    camo: { x: 0.35, y: -0.08, cols: [2, 1], behind: true, dir: 1 },
    draw: function (c, sp, s) { drawBush(c, 0, 0, s * 0.7); },
    react: function (sp, s) {
      hideseekLeaves(sp.x, sp.y - s * 0.9, sp.y + s * 0.1, 3);
      playNote(1100, 0, 0.05, 'sine', 0.05);
      playNote(900, 0.06, 0.05, 'sine', 0.05);
      if (sp.n % 2 === 1) hideseekBird(sp.x, sp.y - s * 1.0, ['#5fa8ff', '#ffd24f', '#ff7bac'][sp.n % 3]);
    }
  },
  bale: {
    w: 2.2, h: 1.5, ax: 0.3, ay: -1.3, amp: 0.06,
    camo: {
      x: -0.2, y: -1.28, cols: [1, 3], sit: true,
      over: function (c, sp, s, hx, hy) {
        c.strokeStyle = '#d8b040';
        c.lineWidth = Math.max(1, s * 0.04);
        c.beginPath();
        c.moveTo(hx - s * 0.45, hy - s * 0.02); c.lineTo(hx + s * 0.3, hy - s * 0.12);
        c.moveTo(hx - s * 0.3, hy + s * 0.04); c.lineTo(hx + s * 0.45, hy - s * 0.2);
        c.moveTo(hx - s * 0.1, hy - s * 0.05); c.lineTo(hx + s * 0.55, hy + s * 0.02);
        c.stroke();
      }
    },
    draw: function (c, sp, s) {
      var i, mk = hideseekOpen(sp, 2.0);
      artShadow(c, 0, 0, s * 1.2, s * 0.22, 0.16);
      if (mk > 0) {
        // Hiiri kurkistaa paalin takaa
        artCircle(c, s * 0.85, -s * 0.3 - mk * s * 0.35, s * 0.2, '#b8a8a0', { lineColor: '#6a5a50' });
        artCircle(c, s * 0.73, -s * 0.46 - mk * s * 0.35, s * 0.09, '#ffc0c8', { lineColor: '#6a5a50' });
        artCircle(c, s * 0.97, -s * 0.46 - mk * s * 0.35, s * 0.09, '#ffc0c8', { lineColor: '#6a5a50' });
        artEye(c, s * 0.9, -s * 0.33 - mk * s * 0.35, s * 0.04, 0.5, false);
      }
      artBlob(c, 0, -s * 0.7, s * 1.05, s * 0.7, '#f2cf6a', { lineColor: '#a8803a', hi: 0.25 });
      c.strokeStyle = 'rgba(168,128,58,0.6)';
      c.lineWidth = Math.max(1, s * 0.05);
      for (i = 0; i < 3; i++) { c.beginPath(); c.arc(-s * 0.4, -s * 0.7, s * (0.14 + i * 0.16), 0, Math.PI * 2); c.stroke(); }
      c.beginPath(); c.moveTo(s * 0.3, -s * 1.36); c.lineTo(s * 0.3, -s * 0.05); c.stroke();
    },
    react: function (sp, s) {
      var i;
      for (i = 0; i < 4; i++) hideseekDrop(sp.x + (Math.random() - 0.5) * s, sp.y - s * 1.3, (Math.random() - 0.5) * viewW * 0.06, -viewH * 0.25, sp.y + s * 0.1, hideseekStraw, 1.6);
      playNote(220, 0, 0.1, 'triangle', 0.12);
      if (sp.n % 3 === 0) { sp.a = 2; playNote(1568, 0.15, 0.08, 'sine', 0.2); playNote(1760, 0.25, 0.08, 'sine', 0.2); }
    }
  },
  barrel: {
    w: 1.1, h: 1.5, ax: 0, ay: -1.35, amp: 0.12,
    draw: function (c, sp, s) {
      var lid = sp.a > 0 ? Math.sin(Math.min(1, (0.8 - sp.a) / 0.8) * Math.PI) * s * 0.35 : 0;
      artShadow(c, 0, 0, s * 0.55, s * 0.12, 0.16);
      artBlob(c, 0, -s * 0.62, s * 0.5, s * 0.66, '#b87a42', { lineColor: '#5a3a1a', hi: 0.2 });
      c.strokeStyle = '#6a6a7a';
      c.lineWidth = Math.max(1, s * 0.07);
      c.beginPath(); c.moveTo(-s * 0.45, -s * 0.3); c.lineTo(s * 0.45, -s * 0.3); c.moveTo(-s * 0.45, -s * 0.95); c.lineTo(s * 0.45, -s * 0.95); c.stroke();
      artBlob(c, 0, -s * 1.25 - lid, s * 0.36, s * 0.09, '#a06a3a', { lineColor: '#5a3a1a' });
    },
    react: function (sp, s) {
      var i, n = sp.n % 4 === 0 ? 3 : 1, d;
      sp.a = 0.8;
      playNote(330, 0, 0.1, 'triangle', 0.18);
      playNote(392, 0.1, 0.1, 'triangle', 0.18);
      for (i = 0; i < n; i++) {
        d = propDropBall(sp.x, sp.y - s * 1.3, s * 0.12, i === 2 ? '#ffd24f' : '#ff4a4a', sp.y + s * 0.1, (Math.random() - 0.5) * viewW * 0.1);
        d.vy = -viewH * 0.5;
      }
    }
  },
  tractor: {
    w: 1.8, h: 1.35, ax: 0.15, ay: -1.0, amp: 0.05,
    draw: function (c, sp, s) {
      var hop = sp.a > 0 ? Math.abs(Math.sin((0.9 - sp.a) * 10)) * s * 0.12 : 0;
      artShadow(c, 0, 0, s * 0.95, s * 0.15, 0.18);
      c.save();
      c.translate(0, -hop);
      artRoundRect(c, -s * 0.8, -s * 0.78, s * 1.05, s * 0.46, s * 0.12, '#4fbf4f', { lineColor: '#1f6a2a', hi: 0.2 });
      artRoundRect(c, -s * 0.12, -s * 1.3, s * 0.6, s * 0.65, s * 0.08, '#4fbf4f', { lineColor: '#1f6a2a' });
      artRoundRect(c, -s * 0.04, -s * 1.22, s * 0.44, s * 0.32, s * 0.05, '#cfeeff', { lineColor: '#1f6a2a' });
      artLimb(c, -s * 0.6, -s * 0.78, -s * 0.6, -s * 1.08, s * 0.08, '#5a5a5a', '#2a2a2a');
      artCircle(c, -s * 0.85, -s * 0.55, s * 0.07, '#ffe890', { lineColor: '#a08a2a' });
      c.restore();
      trainDrawWheel(c, s * 0.22, -s * 0.36, s * 0.36, globalT * 0.3, '#ffd24f');
      trainDrawWheel(c, -s * 0.6, -s * 0.2, s * 0.2, globalT * 0.3, '#ffd24f');
    },
    react: function (sp, s) {
      var i;
      sp.a = 0.9;
      playNote(220, 0, 0.18, 'square', 0.1);
      playNote(220, 0.22, 0.25, 'square', 0.1);
      for (i = 0; i < 3; i++) hideseekPuff(sp.x - s * 0.6, sp.y - s * 1.15, s * (0.1 + i * 0.04), -viewH * (0.1 + i * 0.04));
      if (sp.n % 3 === 0) hideseekHeartUp(sp.x, sp.y - s * 1.5, 2);
    }
  },
  cow: {
    w: 2.0, h: 1.4, ax: 0.75, ay: -0.1, amp: 0.04,
    draw: function (c, sp, s) {
      artShadow(c, 0, 0, s * 0.95, s * 0.18, 0.16);
      trainDrawAnimal(c, 'cow', 0, 0, s * 0.62, { face: -1, t: globalT + sp.x * 0.01, wave: sp.a > 0 ? sp.a : 0, graze: sp.a <= 0 });
    },
    react: function (sp, s) {
      sp.a = 1.0;
      postAnimalSound('cow', 0);
      if (sp.n % 3 === 0) hideseekHeartUp(sp.x - s * 0.5, sp.y - s * 1.3, 3);
    }
  },
  pumpkin: {
    w: 1.1, h: 0.95, ax: 0, ay: -0.7, amp: 0.1,
    draw: function (c, sp, s) {
      var k = sp.g ? 1.3 : 1, sq = sp.a > 0 ? Math.sin(sp.a * 14) * 0.12 * sp.a : 0;
      artShadow(c, 0, 0, s * 0.55 * k, s * 0.12, 0.16);
      c.save();
      c.scale(1 + sq, 1 - sq);
      artBlob(c, -s * 0.22 * k, -s * 0.34 * k, s * 0.28 * k, s * 0.34 * k, '#ff9a3a', { lineColor: '#a8501a' });
      artBlob(c, s * 0.22 * k, -s * 0.34 * k, s * 0.28 * k, s * 0.34 * k, '#ff9a3a', { lineColor: '#a8501a' });
      artBlob(c, 0, -s * 0.36 * k, s * 0.3 * k, s * 0.36 * k, '#ffaa4a', { lineColor: '#a8501a', hi: 0.3 });
      artLimb(c, 0, -s * 0.7 * k, s * 0.08, -s * 0.85 * k, s * 0.08, '#5a8a2a', '#2a5a1a');
      c.restore();
    },
    react: function (sp, s) {
      sp.a = 0.8;
      playNote(110, 0, 0.25, 'sine', 0.35);
      playNote(147, 0.05, 0.2, 'triangle', 0.15);
      // Viides bong: kurpitsa kasvaa isoksi (tai kutistuu takaisin)
      if (sp.n % 5 === 0) { sp.g = sp.g ? 0 : 1; hideseekTinkle(0.1, 0.15); }
    }
  },
  tree: {
    w: 1.5, h: 1.6, ax: 0.05, ay: -1.18, amp: 0.05,
    draw: function (c, sp, s) {
      var i, ow = hideseekOpen(sp, 3.0), ox, oy, bl;
      artShadow(c, 0, 0, s * 0.6, s * 0.12, 0.15);
      drawTree(c, 0, 0, s, 0, {});
      for (i = 0; i < 5; i++) artCircle(c, Math.cos(i * 1.3 + 0.4) * s * 0.42, -s * 0.85 + Math.sin(i * 1.3 + 0.4) * s * 0.3, s * 0.06, '#ff4a4a', { hi: 0.4 });
      if (ow > 0) {
        // Pöllö avaa silmänsä lehvistössä
        ox = -s * 0.28; oy = -s * 1.12 + (1 - ow) * s * 0.2; bl = (globalT % 1.2) < 0.15;
        artBlob(c, ox, oy, s * 0.17 * ow, s * 0.2 * ow, '#a8805a', { lineColor: '#5a3a1a' });
        artEye(c, ox - s * 0.07, oy - s * 0.05, s * 0.06 * ow, 0, bl);
        artEye(c, ox + s * 0.07, oy - s * 0.05, s * 0.06 * ow, 0, bl);
      }
    },
    react: function (sp, s) {
      var gold = sp.n % 7 === 0, r = s * (gold ? 0.08 : 0.06);
      hideseekLeaves(sp.x, sp.y - s * 1.1, sp.y + s * 0.05, 2);
      hideseekDrop(sp.x + (Math.random() - 0.5) * s * 0.6, sp.y - s * 0.8, (Math.random() - 0.5) * viewW * 0.05, 0, sp.y + viewH * 0.005, function (c) {
        artCircle(c, 0, 0, r, gold ? '#ffd24f' : '#ff4a4a', { hi: 0.4 });
        artLimb(c, 0, -r, r * 0.3, -r * 1.5, r * 0.25, '#6a4020', false);
      }, 2.2);
      playNote(494, 0, 0.1, 'sine', 0.15);
      if (sp.n % 4 === 0) { sp.a = 3.0; playNote(392, 0.2, 0.25, 'sine', 0.2); playNote(330, 0.55, 0.35, 'sine', 0.2); }
    }
  },
  hive: {
    w: 0.9, h: 1.4, ax: 0.1, ay: -1.25, amp: 0.1,
    draw: function (c, sp, s) {
      var i, n = sp.a > 0 ? 5 : 1, k, bx, by;
      artShadow(c, 0, 0, s * 0.4, s * 0.08, 0.16);
      artLimb(c, -s * 0.25, -s * 0.5, -s * 0.3, 0, s * 0.06, '#8a5a30', '#5a3a1a');
      artLimb(c, s * 0.25, -s * 0.5, s * 0.3, 0, s * 0.06, '#8a5a30', '#5a3a1a');
      artRoundRect(c, -s * 0.4, -s * 0.58, s * 0.8, s * 0.1, s * 0.03, '#a06a3a', { lineColor: '#5a3a1a' });
      artBlob(c, 0, -s * 0.9, s * 0.38, s * 0.36, '#f0b84a', { lineColor: '#8a5a10', hi: 0.25 });
      c.strokeStyle = 'rgba(138,90,16,0.55)';
      c.lineWidth = Math.max(1, s * 0.03);
      for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-s * (0.3 - i * 0.04), -s * (0.75 + i * 0.16)); c.lineTo(s * (0.3 - i * 0.04), -s * (0.75 + i * 0.16)); c.stroke(); }
      artCircle(c, 0, -s * 0.68, s * 0.07, '#5a3a10', { line: false });
      for (i = 0; i < n; i++) {
        k = globalT * (2.5 + i * 0.4) + i * 1.3;
        bx = Math.cos(k) * s * (0.55 + i * 0.08);
        by = -s * 0.9 + Math.sin(k * 1.7) * s * 0.35;
        artBlob(c, bx, by, s * 0.07, s * 0.05, '#ffd24f', { lineColor: '#3a2a1a' });
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath(); c.arc(bx, by - s * 0.06, s * 0.04 * (0.6 + Math.abs(Math.sin(globalT * 30))), 0, Math.PI * 2); c.fill();
      }
    },
    react: function (sp, s) {
      sp.a = 2.5;
      playNote(220, 0, 0.5, 'sawtooth', 0.03);
      playNote(233, 0.05, 0.5, 'sawtooth', 0.03);
      if (sp.n % 3 === 0) hideseekNotes(sp.x, sp.y - s * 1.3, 3);
    }
  },
  sunflower: {
    w: 0.9, h: 2.1, ax: 0.35, ay: 0, amp: 0.12,
    draw: function (c, sp, s) {
      var i, a, spin = sp.a > 0 ? (1.5 - sp.a) * 8 : 0, hy = -s * 1.9;
      artShadow(c, 0, 0, s * 0.3, s * 0.07, 0.14);
      artLimb(c, 0, 0, 0, hy, s * 0.08, '#4f9a3a', '#2a5a1a');
      artBlob(c, -s * 0.22, -s * 0.8, s * 0.24, s * 0.1, '#5fbf55', { lineColor: '#2f7a2a', rot: 0.5 });
      artBlob(c, s * 0.22, -s * 1.2, s * 0.24, s * 0.1, '#5fbf55', { lineColor: '#2f7a2a', rot: -0.5 });
      c.save();
      c.translate(0, hy);
      c.rotate(spin);
      for (i = 0; i < 10; i++) {
        a = i / 10 * Math.PI * 2;
        artBlob(c, Math.cos(a) * s * 0.32, Math.sin(a) * s * 0.32, s * 0.15, s * 0.07, '#ffd24f', { lineColor: '#c89a10', rot: a });
      }
      artCircle(c, 0, 0, s * 0.24, '#8a5a2a', { lineColor: '#5a3a1a' });
      c.restore();
      artEye(c, -s * 0.08, hy - s * 0.03, s * 0.05, 0, false);
      artEye(c, s * 0.08, hy - s * 0.03, s * 0.05, 0, false);
      c.strokeStyle = '#3a2a1a';
      c.lineWidth = Math.max(1, s * 0.03);
      c.beginPath(); c.arc(0, hy + s * 0.04, s * 0.08, 0.3, Math.PI - 0.3); c.stroke();
    },
    react: function (sp, s) {
      var i;
      sp.a = 1.5;
      for (i = 0; i < 4; i++) playNote(784 * Math.pow(1.12, i), i * 0.06, 0.12, 'triangle', 0.14);
      for (i = 0; i < 3; i++) hideseekDrop(sp.x, sp.y - s * 1.9, (Math.random() - 0.5) * viewW * 0.06, -viewH * 0.2, sp.y + s * 0.05, function (c) { artBlob(c, 0, 0, viewH * 0.005, viewH * 0.003, '#3a2a1a', { line: false }); }, 1.6);
    }
  },
  woodpile: {
    w: 1.8, h: 1.25, ax: 0, ay: -1.1, amp: 0.04,
    camo: { x: 0.42, y: -0.72, cols: [1, 3], sit: true },
    draw: function (c, sp, s) {
      var rows = [[-0.6, -0.2, 0.2, 0.6], [-0.4, 0, 0.4], [-0.2]], i, j, x, y, r = s * 0.2;
      artShadow(c, 0, 0, s * 0.9, s * 0.14, 0.16);
      artRoundRect(c, -s * 0.85, -s * 0.06, s * 1.7, s * 0.1, s * 0.03, '#8a6a4a', { lineColor: '#4a3a2a' });
      for (j = 0; j < rows.length; j++) {
        for (i = 0; i < rows[j].length; i++) {
          x = rows[j][i] * s;
          y = -s * (0.26 + j * 0.36);
          artCircle(c, x, y, r, '#d8a46a', { lineColor: '#7a5028' });
          c.strokeStyle = 'rgba(122,80,40,0.55)';
          c.lineWidth = Math.max(1, s * 0.025);
          c.beginPath(); c.arc(x, y, r * 0.55, 0, Math.PI * 2); c.stroke();
        }
      }
    },
    react: function (sp, s) {
      var dir = Math.random() < 0.5 ? -1 : 1;
      hideseekDrop(sp.x - s * 0.2, sp.y - s * 1.0, dir * viewW * 0.06, -viewH * 0.2, sp.y + s * 0.05, function (c) {
        artCircle(c, 0, 0, viewH * 0.016, '#d8a46a', { lineColor: '#7a5028' });
      }, 1.8);
      playNote(392, 0, 0.06, 'square', 0.08);
      playNote(330, 0.25, 0.06, 'square', 0.08);
      playNote(294, 0.4, 0.06, 'square', 0.06);
    }
  },
  doghouse: {
    w: 1.3, h: 1.4, ax: 0.35, ay: 0.02, amp: 0.05,
    draw: function (c, sp, s) {
      var op = hideseekOpen(sp, 2.0);
      artShadow(c, 0, 0, s * 0.7, s * 0.12, 0.16);
      artRoundRect(c, -s * 0.55, -s * 0.85, s * 1.1, s * 0.85, s * 0.05, '#ff6a5a', { lineColor: '#8a2a20' });
      c.beginPath(); c.moveTo(-s * 0.7, -s * 0.8); c.lineTo(0, -s * 1.35); c.lineTo(s * 0.7, -s * 0.8); c.closePath();
      artFillPath(c, '#8a5ac8', -s * 1.35, -s * 0.8, s * 0.4, { lineColor: '#4a2a7a' });
      c.fillStyle = '#3a2a2a';
      c.beginPath(); c.arc(0, -s * 0.32, s * 0.27, Math.PI, 0); c.lineTo(s * 0.27, 0); c.lineTo(-s * 0.27, 0); c.closePath(); c.fill();
      if (op > 0) postDrawAnimal(c, 'dog', 0, -s * 0.28 - op * s * 0.1, s * 0.2, false);
      artRoundRect(c, -s * 0.22, -s * 0.78, s * 0.44, s * 0.14, s * 0.04, '#fff4e8', { lineColor: '#8a6a4a' });
    },
    react: function (sp, s) {
      sp.a = 2.0;
      postAnimalSound('dog', 0.1);
      // Joka kolmas kerta koira heittää luun
      if (sp.n % 3 === 0) {
        hideseekDrop(sp.x, sp.y - s * 0.4, (Math.random() < 0.5 ? -1 : 1) * viewW * 0.05, -viewH * 0.35, sp.y + s * 0.1, function (c) {
          var r = viewH * 0.01;
          artLimb(c, -r * 1.4, 0, r * 1.4, 0, r * 0.8, '#fffaf0', '#a89a88');
          artCircle(c, -r * 1.6, -r * 0.5, r * 0.6, '#fffaf0', { lineColor: '#a89a88' });
          artCircle(c, -r * 1.6, r * 0.5, r * 0.6, '#fffaf0', { lineColor: '#a89a88' });
          artCircle(c, r * 1.6, -r * 0.5, r * 0.6, '#fffaf0', { lineColor: '#a89a88' });
          artCircle(c, r * 1.6, r * 0.5, r * 0.6, '#fffaf0', { lineColor: '#a89a88' });
        }, 2.4);
      }
    }
  }
};
var HIDESEEK_CLOTHES = [
  { x: -0.75, w: 0.36, hh: 0.5, col: '#ff9ab8', k: 'shirt' }, { x: -0.3, w: 0.42, hh: 0.75, col: '#ffffff', k: 'sheet' },
  { x: 0.38, w: 0.42, hh: 0.7, col: '#ffffff', k: 'sheet' }, { x: 0.82, w: 0.16, hh: 0.36, col: '#5fa8ff', k: 'sock' }
];

// ---------- Piirto: tausta ----------
function hideseekHash(i) {
  var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function renderHideseekBg(b, w, h) {
  var VW = hideseekLayout().VW, i, x, g, B, G, s;
  g = b.createLinearGradient(0, 0, 0, h * 0.6);
  g.addColorStop(0, '#8fd4ff');
  g.addColorStop(0.7, '#d8f2ff');
  g.addColorStop(1, '#fff6dc');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, VW * 0.14, h * 0.1, h * 0.055, 1);
  for (i = 0; i * h * 0.85 < VW; i++) {
    x = h * 0.5 + i * h * 0.85 + hideseekHash(i) * h * 0.3;
    if (Math.abs(x - VW * 0.14) < h * 0.18) continue;
    drawCloud(b, x, h * (0.07 + (i % 3) * 0.045), h * (0.02 + hideseekHash(i + 9) * 0.012), 0.85);
  }
  // Kaukaiset kummut peltoineen
  fillHillBand(b, w, h, h * 0.45, artMix('#a8d880', '#d8f2ff', 0.5), function (px) {
    return h * (0.44 - Math.sin(px / h * 1.1 + 0.6) * 0.035 - Math.sin(px / h * 2.9) * 0.012);
  });
  for (i = 0; i * h * 0.55 < VW; i++) {
    x = i * h * 0.55 + hideseekHash(i + 3) * h * 0.2;
    b.fillStyle = artMix(['#e8c860', '#c8e070', '#f0d890', '#b0d860'][i % 4], '#d8f2ff', 0.35);
    b.beginPath();
    b.ellipse(x, h * (0.475 + hideseekHash(i + 5) * 0.02), h * 0.17, h * 0.018, 0, 0, Math.PI * 2);
    b.fill();
  }
  fillHillBand(b, w, h, h * 0.5, '#a6de7c', function (px) {
    return h * (0.52 - Math.sin(px / h * 0.8 + 1.5) * 0.02);
  });
  // Lähinurmi tummuu alaspäin
  g = b.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, '#9ad870');
  g.addColorStop(1, '#7cc458');
  b.fillStyle = g;
  b.beginPath(); b.moveTo(0, h * 0.6);
  for (x = 0; x <= w; x += h * 0.1) b.lineTo(x, h * (0.585 - Math.sin(x / h * 1.7) * 0.012));
  b.lineTo(w, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Kylätie
  b.fillStyle = '#ecd8a8';
  b.beginPath(); b.moveTo(0, h * 0.67);
  for (x = 0; x <= w; x += h * 0.1) b.lineTo(x, h * (0.67 + Math.sin(x / h * 1.3) * 0.012));
  for (x = w; x >= 0; x -= h * 0.1) b.lineTo(x, h * (0.735 + Math.sin(x / h * 1.3 + 0.4) * 0.012));
  b.closePath(); b.fill();
  b.strokeStyle = 'rgba(200,170,110,0.5)';
  b.lineWidth = Math.max(1, h * 0.004);
  b.stroke();
  // Aidat rakennusten välissä
  var fences = [[0.115, 0.205], [0.3, 0.44], [0.57, 0.63], [0.755, 0.815], [0.9, 1.0]];
  for (i = 0; i < fences.length; i++) {
    var fy = h * 0.615;
    b.fillStyle = '#fff4e8';
    b.strokeStyle = '#a8906a';
    b.lineWidth = Math.max(1, h * 0.003);
    b.fillRect(fences[i][0] * VW, fy - h * 0.035, (fences[i][1] - fences[i][0]) * VW, h * 0.008);
    b.fillRect(fences[i][0] * VW, fy - h * 0.018, (fences[i][1] - fences[i][0]) * VW, h * 0.008);
    for (x = fences[i][0] * VW; x <= fences[i][1] * VW; x += h * 0.04) {
      b.beginPath(); b.moveTo(x - h * 0.007, fy); b.lineTo(x - h * 0.007, fy - h * 0.045); b.lineTo(x, fy - h * 0.055); b.lineTo(x + h * 0.007, fy - h * 0.045); b.lineTo(x + h * 0.007, fy); b.closePath();
      b.fill(); b.stroke();
    }
  }
  // Linna kylän laidalla (linnan kanala on sen edessä)
  drawCastle(b, h * 0.1, h * 0.62, h * 0.3);
  for (i = 0; i < HIDESEEK_BUILDS.length; i++) {
    B = HIDESEEK_BUILDS[i];
    G = hideseekBuildGeom(B, VW);
    hideseekDrawBuilding(b, B, G);
  }
  // Nurmitupsut ja kukat
  for (i = 0; i * h * 0.12 < VW; i++) {
    x = i * h * 0.12 + hideseekHash(i + 21) * h * 0.1;
    var gy = h * (0.76 + hideseekHash(i + 40) * 0.22);
    if (hideseekHash(i + 60) < 0.35) drawFlower(b, x, gy, h * 0.008, ['#ff7bac', '#ffd24f', '#b98aff', '#ffffff'][i % 4]);
    else {
      b.strokeStyle = '#5fa840';
      b.lineWidth = Math.max(1, h * 0.003);
      b.beginPath(); b.moveTo(x - h * 0.008, gy); b.lineTo(x - h * 0.012, gy - h * 0.018); b.moveTo(x, gy); b.lineTo(x, gy - h * 0.024); b.moveTo(x + h * 0.008, gy); b.lineTo(x + h * 0.012, gy - h * 0.018); b.stroke();
    }
  }
}
function hideseekDrawBuilding(b, B, G) {
  var x = G.x, by = G.by, s = G.s, k;
  if (B.k === 'coop') {
    artShadow(b, x, by, s * 1.2, s * 0.15, 0.18);
    artRoundRect(b, x - s * 0.95, by - s * 1.15, s * 1.9, s * 1.15, s * 0.05, '#fff0f6', { lineColor: '#9a6fc4' });
    b.beginPath(); b.moveTo(x - s * 1.15, by - s * 1.05); b.lineTo(x, by - s * 1.95); b.lineTo(x + s * 1.15, by - s * 1.05); b.closePath();
    artFillPath(b, '#c286e0', by - s * 1.95, by - s * 1.05, s * 0.6, { lineColor: '#7a4fb0' });
    // Ovi, josta kanat kulkevat sisään, ja kanakyltti
    b.fillStyle = '#4a3434';
    b.beginPath(); b.moveTo(x + s * 0.24, by); b.lineTo(x + s * 0.24, by - s * 0.45); b.arc(x + s * 0.42, by - s * 0.45, s * 0.18, Math.PI, 0); b.lineTo(x + s * 0.6, by); b.closePath(); b.fill();
    artCircle(b, x, by - s * 1.32, s * 0.22, '#fffaf0', { lineColor: '#9a6fc4' });
    drawCoopBirdShape(b, 'hen', 1, x - s * 0.02, by - s * 1.17, s * 0.24, 1, { flap: false, peck: 0, sit: false, blink: false, crow: false, age: 1 });
  } else if (B.k === 'house') {
    artShadow(b, x, by, s * 1.6, s * 0.18, 0.18);
    artRoundRect(b, x - s * 1.3, by - s * 1.75, s * 2.6, s * 1.75, s * 0.05, B.col, { lineColor: artShade(B.col, -0.45) });
    b.beginPath(); b.moveTo(x - s * 1.55, by - s * 1.65); b.lineTo(x, by - s * 3.0); b.lineTo(x + s * 1.55, by - s * 1.65); b.closePath();
    artFillPath(b, B.roof, by - s * 3.0, by - s * 1.65, s * 0.8, { lineColor: artShade(B.roof, -0.45) });
    b.strokeStyle = artRGBA(artShade(B.roof, -0.45), 0.4);
    b.lineWidth = Math.max(1, s * 0.03);
    for (k = 1; k < 4; k++) {
      var yy = by - s * 3.0 + k * s * 0.34, hw = (k * 0.34 / 1.35) * s * 1.55;
      b.beginPath(); b.moveTo(x - hw, yy); b.lineTo(x + hw, yy); b.stroke();
    }
    // Polku ovelta tielle
    b.fillStyle = '#ecd8a8';
    b.beginPath(); b.moveTo(x - s * 0.3, by); b.lineTo(x + s * 0.3, by); b.lineTo(x + s * 0.4, by + s * 0.45); b.lineTo(x - s * 0.4, by + s * 0.45); b.closePath(); b.fill();
  } else if (B.k === 'barn') {
    artShadow(b, x, by, s * 2.0, s * 0.2, 0.18);
    b.beginPath();
    b.moveTo(x - s * 1.7, by); b.lineTo(x - s * 1.7, by - s * 1.75); b.lineTo(x - s * 1.25, by - s * 2.6); b.lineTo(x, by - s * 3.1);
    b.lineTo(x + s * 1.25, by - s * 2.6); b.lineTo(x + s * 1.7, by - s * 1.75); b.lineTo(x + s * 1.7, by); b.closePath();
    artFillPath(b, '#d8483a', by - s * 3.1, by, s, { lineColor: '#7a2a20' });
    b.strokeStyle = '#fff4e8';
    b.lineWidth = Math.max(1.5, s * 0.07);
    b.lineJoin = 'round';
    b.beginPath(); b.moveTo(x - s * 1.85, by - s * 1.65); b.lineTo(x - s * 1.35, by - s * 2.65); b.lineTo(x, by - s * 3.2); b.lineTo(x + s * 1.35, by - s * 2.65); b.lineTo(x + s * 1.85, by - s * 1.65); b.stroke();
    b.strokeStyle = 'rgba(122,42,32,0.35)';
    b.lineWidth = Math.max(1, s * 0.025);
    for (k = -5; k <= 5; k++) { b.beginPath(); b.moveTo(x + k * s * 0.3, by - s * 0.02); b.lineTo(x + k * s * 0.3, by - s * (Math.abs(k) < 4 ? 2.6 - Math.abs(k) * 0.12 : 1.75)); b.stroke(); }
    b.fillStyle = '#ecd8a8';
    b.beginPath(); b.moveTo(x - s * 0.5, by); b.lineTo(x + s * 0.5, by); b.lineTo(x + s * 0.6, by + s * 0.35); b.lineTo(x - s * 0.6, by + s * 0.35); b.closePath(); b.fill();
  }
}

// ---------- Piirto: kenttä ----------
function hideseekHenDraw(c, col, x, y, s, dir, o) {
  drawCoopBirdShape(c, 'hen', col, x, y, s, dir, { flap: !!o.flap, peck: o.peck || 0, sit: !!o.sit, blink: !!o.blink, crow: !!o.crow, age: 1 });
}
function hideseekBlink(hn) { return Math.sin(hn.ph * 1.3) > 0.985; }
function hideseekDrawSpot(c, sp) {
  var T = hideseekType(sp), s = sp.s, sx = sp.x - camX, hw = (T.w * 0.5 + 1) * s, sh = 0, q;
  if (sx < -hw || sx > viewW + hw) return;
  if (sp.jig > 0) sh = Math.sin(globalT * 45) * s * 0.07 * Math.min(1, sp.jig * 2);
  c.save();
  c.translate(sx + sh, sp.y);
  if (sp.tt >= 0) {
    q = Math.sin(Math.min(1, sp.tt / 0.25) * Math.PI) * 0.06;
    if (!T.fixed) c.rotate(Math.sin(sp.tt * 18) * Math.exp(-sp.tt * 3.5) * (T.amp || 0.1));
    if (sp.tt < 0.25) artSquash(c, T.fixed ? -q * 0.5 : q);
  } else if (sp.jig > 0 && !T.fixed) {
    c.rotate(Math.sin(globalT * 38) * 0.04 * Math.min(1, sp.jig * 2));
  }
  T.draw(c, sp, s);
  c.restore();
}
function hideseekDrawCamo(c, sp, hn) {
  var T = hideseekType(sp), C = T.camo, hs = hideseekHenSize(), x = hn.x - camX, y = hn.y;
  if (x < -hs * 2 || x > viewW + hs * 2) return;
  if (sp.jig > 0) x += Math.sin(globalT * 45) * sp.s * 0.07 * Math.min(1, sp.jig * 2);
  hideseekHenDraw(c, hn.col, x, y, hs, C.dir || hn.dir, { sit: C.sit, blink: hideseekBlink(hn) });
  if (C.over) C.over(c, sp, sp.s, x, y - hs * 0.45);
}
function hideseekDrawHenWorld(c, hn) {
  var hs = hideseekHenSize(), x = hn.x - camX, y = hn.y, k, sc, a;
  if (x < -hs * 3 || x > viewW + hs * 3) return;
  if (hn.state === 'pop') {
    k = hn.t / HIDESEEK_POP;
    sc = easeOutBack(Math.min(1, k * 2.2));
    y -= Math.sin(Math.min(1, k) * Math.PI) * hs * 0.6;
    if (hn.gold) artGlow(c, x, y - hs * 0.7, hs * 1.6, '#ffe678', 0.6);
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    hideseekHenDraw(c, hn.col, 0, 0, hs, hn.dir, { flap: true, crow: k < 0.6 });
    c.restore();
  } else if (hn.state === 'run') {
    artShadow(c, x, hn.y + hs * 0.05, hs * 0.6, hs * 0.15, 0.16);
    hideseekHenDraw(c, hn.col, x, y, hs, hn.dir, { flap: true });
  } else if (hn.state === 'bye') {
    a = hn.t > 1.4 ? Math.max(0, 1 - (hn.t - 1.4) / 0.8) : 1;
    c.globalAlpha = a;
    artGlow(c, x + Math.sin(hn.t * 4) * hs * 0.5, y - hn.t * viewH * 0.22 - hs * 0.7, hs * 1.5, '#ffe678', 0.5);
    hideseekHenDraw(c, hn.col, x + Math.sin(hn.t * 4) * hs * 0.5, y - hn.t * viewH * 0.22, hs, hn.dir, { flap: true });
    c.globalAlpha = 1;
  }
}
function hideseekDrawCrit(c) {
  var i, cr, x, a, k;
  for (i = 0; i < hideseek.crit.length; i++) {
    cr = hideseek.crit[i];
    if (cr.t < 0) continue;
    x = cr.x - camX;
    if (x < -viewH * 0.2 || x > viewW + viewH * 0.2) continue;
    a = Math.max(0, Math.min(1, (cr.life - cr.t) / 0.5));
    c.globalAlpha = a;
    if (cr.k === 'puff') {
      k = cr.t / cr.life;
      c.fillStyle = 'rgba(240,240,248,' + (0.75 * (1 - k)) + ')';
      c.beginPath(); c.arc(x, cr.y, cr.r * (1 + k * 1.5), 0, Math.PI * 2); c.fill();
    } else if (cr.k === 'bird') {
      var fl = Math.sin(globalT * 26) * 0.8;
      c.save();
      c.translate(x, cr.y);
      c.scale(cr.vx > 0 ? 1 : -1, 1);
      artBlob(c, 0, 0, cr.r, cr.r * 0.7, cr.col, { lineColor: artShade(cr.col, -0.45) });
      artBlob(c, -cr.r * 0.1, -cr.r * 0.3, cr.r * 0.55, cr.r * 0.25, artShade(cr.col, 0.3), { lineColor: artShade(cr.col, -0.45), rot: -0.4 - fl });
      artCircle(c, cr.r * 0.75, -cr.r * 0.35, cr.r * 0.45, cr.col, { lineColor: artShade(cr.col, -0.45) });
      c.fillStyle = '#ffb030';
      c.beginPath(); c.moveTo(cr.r * 1.15, -cr.r * 0.4); c.lineTo(cr.r * 1.5, -cr.r * 0.3); c.lineTo(cr.r * 1.15, -cr.r * 0.22); c.fill();
      artEye(c, cr.r * 0.85, -cr.r * 0.45, cr.r * 0.14, 0.5, false);
      c.restore();
    } else if (cr.k === 'heart') {
      trainDrawHeart(c, x + Math.sin(cr.t * 5) * cr.r * 0.4, cr.y, cr.r);
    } else if (cr.k === 'note') {
      c.fillStyle = cr.col;
      c.beginPath(); c.arc(x, cr.y, cr.r * 0.5, 0, Math.PI * 2); c.fill();
      c.fillRect(x + cr.r * 0.35, cr.y - cr.r * 1.6, cr.r * 0.18, cr.r * 1.6);
      c.fillRect(x + cr.r * 0.35, cr.y - cr.r * 1.6, cr.r * 0.7, cr.r * 0.2);
    }
    c.globalAlpha = 1;
  }
}
function hideseekDrawFeathers(c) {
  var i, f, k, x, y, a, r = viewH * 0.016;
  for (i = 0; i < hideseek.feathers.length; i++) {
    f = hideseek.feathers[i];
    k = f.t / f.life;
    x = f.x - camX + Math.sin(f.t * 3 + f.ph) * viewH * 0.03;
    y = f.y - easeOutCubic(Math.min(1, f.t / 0.6)) * viewH * 0.09 + Math.max(0, f.t - 0.6) * viewH * 0.03;
    a = k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
    if (x < -r * 3 || x > viewW + r * 3) continue;
    c.globalAlpha = a;
    if (f.gold) artGlow(c, x, y, r * 2.5, '#ffe678', 0.5);
    hideseekDrawFeather(c, x, y, r, Math.sin(f.t * 3 + f.ph) * 0.6, f.gold);
    c.globalAlpha = 1;
  }
}
function drawHideseek() {
  var c = ctx, i, k, sp, hn, T;
  if (!beginPlayWorld()) return;
  propsDraw(c, 0);
  for (k = 0; k < hideseek.order.length; k++) {
    sp = hideseek.spots[hideseek.order[k]];
    hn = sp.hen;
    T = hideseekType(sp);
    var camo = hn && hn.camo && hn.state === 'hidden' && T.camo;
    if (camo && T.camo.behind) hideseekDrawCamo(c, sp, hn);
    hideseekDrawSpot(c, sp);
    if (camo && !T.camo.behind) hideseekDrawCamo(c, sp, hn);
  }
  for (i = 0; i < hideseek.hens.length; i++) {
    hn = hideseek.hens[i];
    if (hn.state === 'pop' || hn.state === 'run' || hn.state === 'bye') hideseekDrawHenWorld(c, hn);
  }
  if (hideseek.state === 'won') hideseekDrawMarch(c);
  propsDraw(c, 1);
  hideseekDrawCrit(c);
  hideseekDrawFeathers(c);
  drawParticlesLayer(c);
  hideseekDrawHand(c);
  endPlayWorld();
  hideseekDrawEdges(c);
  drawHideseekHud(c);
  for (i = 0; i < hideseek.hens.length; i++) {
    hn = hideseek.hens[i];
    if (hn.state !== 'fly') continue;
    var P = hideseekFlyPos(hn);
    if (hn.gold) artGlow(c, P.x, P.y - viewH * 0.03, viewH * 0.07, '#ffe678', 0.6);
    hideseekHenDraw(c, hn.col, P.x, P.y, hideseekHenSize() * P.sc, P.x < hn.sx ? -1 : 1, { flap: true });
  }
  drawTaskOverlay(c);
}
// Kanajono kulkee kanalan ovelle ja katoaa sisään
function hideseekDrawMarch(c) {
  var D = hideseekCoopDoor(), hs = hideseekHenSize() * 0.9, i, m, x, y;
  for (i = hideseek.march.length - 1; i >= 0; i--) {
    m = hideseek.march[i];
    if (m.inT >= 0) continue;
    x = D.x + m.d - camX;
    if (x > viewW + hs * 2) continue;
    y = hideseek.marchY - Math.abs(Math.sin(hideseek.wonT * 9 + i)) * hs * 0.15;
    // Viimeiset askeleet: kana pienenee ovelle päin
    var sc = m.d < viewH * 0.12 ? 0.6 + 0.4 * (m.d / (viewH * 0.12)) : 1;
    var yy = y - (1 - sc) * viewH * 0.06;
    artShadow(c, x, hideseek.marchY + hs * 0.05, hs * 0.6 * sc, hs * 0.14 * sc, 0.15);
    if (m.gold) artGlow(c, x, yy - hs * 0.7 * sc, hs * 1.5 * sc, '#ffe678', 0.6);
    hideseekHenDraw(c, m.col, x, yy, hs * sc, -1, { peck: Math.max(0, Math.sin(hideseek.wonT * 4 + i * 1.7)) * 0.3 });
  }
  if (hideseek.coopResult && hideseek.allInT) {
    var k = Math.min(1, (hideseek.wonT - hideseek.allInT) * 2), bx = D.x - camX - viewH * 0.04, byy = D.y - viewH * 0.27 - k * viewH * 0.03;
    artGlow(c, bx, byy, viewH * 0.08 * k, '#ffe678', 0.7);
    if (hideseek.coopResult === 'hen') hideseekHenDraw(c, COOP_GOLD_C, bx, byy + viewH * 0.04, viewH * 0.045 * k, 1, { flap: true });
    else drawCoopEgg(c, bx, byy, viewH * 0.025 * k, 0, 1);
  }
}
// Vihjekäsi (1. kierros): ruudulla oleva kotkotus -> napautus; ruudun ulkopuolinen -> raahaus
function hideseekDrawHand(c) {
  var lh = hideseek.lastHint, sp, T, sx, k, dir, hx, hy;
  if (hideseek.round !== 0 || hideseek.state !== 'play' || puzzleBusy() || hideseek.press) return;
  if (!lh || lh.hen.state !== 'hidden' || globalT - lh.t > 4.5) return;
  if (hideseek.finds >= 3 && hideseek.sinceFind < 12) return;
  sp = hideseek.spots[lh.hen.spot];
  T = hideseekType(sp);
  sx = sp.x - camX;
  if (sx > viewW * 0.05 && sx < viewW * 0.95) {
    k = (globalT % 1.2) / 1.2;
    drawHand(c, sx + viewH * 0.01, sp.y - T.h * sp.s * 0.45 + viewH * 0.02 + Math.abs(Math.sin(k * Math.PI)) * viewH * 0.03, viewH * 0.045);
    return;
  }
  // Sormi liukuu vastakkaiseen suuntaan kuin minne kylää pitää katsoa
  dir = sx > viewW ? -1 : 1;
  k = Math.min(1, ((globalT % 1.6) / 1.6) * 1.3);
  hx = viewW * 0.5 - dir * viewW * 0.15 + dir * viewW * 0.3 * easeInOutSine(k);
  hy = viewH * 0.5;
  c.globalAlpha = 0.5 * (1 - k);
  c.strokeStyle = '#ffffff';
  c.lineWidth = viewH * 0.012;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(viewW * 0.5 - dir * viewW * 0.15, hy); c.lineTo(hx, hy); c.stroke();
  c.globalAlpha = 1;
  drawHand(c, hx, hy, viewH * 0.045);
}
// Ruudun ulkopuolinen kotkotus: sulka ja nuoli ruudun reunassa
function hideseekDrawEdges(c) {
  var i, e, x, a, r = viewH * 0.022, p;
  for (i = 0; i < hideseek.edges.length; i++) {
    e = hideseek.edges[i];
    a = Math.min(1, e.t * 4, (e.life - e.t) / 0.4);
    p = 1 + Math.sin(e.t * 9) * 0.12;
    x = e.side < 0 ? viewW * 0.035 : viewW * 0.965;
    c.globalAlpha = Math.max(0, a);
    artGlow(c, x, e.y, r * 2.6, e.gold ? '#ffe678' : '#ffffff', 0.7);
    hideseekDrawFeather(c, x - e.side * r * 0.4, e.y, r * p, 0.5 * e.side, e.gold);
    c.fillStyle = e.gold ? '#e8a820' : '#ff7bac';
    c.beginPath();
    c.moveTo(x + e.side * r * 1.5, e.y);
    c.lineTo(x + e.side * r * 0.75, e.y - r * 0.6);
    c.lineTo(x + e.side * r * 0.75, e.y + r * 0.6);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
  }
}

// ---------- HUD: kanakori ----------
function hideseekHud() {
  var hs = viewH * 0.022, left = hudX(), top = hs * 0.6, R = hideseek.R || HIDESEEK_ROUNDS[0], n = R.hens, gap = hs * 2.7;
  var x0 = left + hs * 5.4, y = top + hs * 3.3, gx = x0 + n * gap + hs * 0.4, ex = gx + gap * 1.15;
  return {
    hs: hs, left: left, top: top, n: n, gap: gap, x1: ex + hs * 4.6, y1: top + hs * 4.4,
    basket: { x: left + hs * 2.6, y: top + hs * 3.6 },
    slot: function (i) { return { x: x0 + i * gap, y: y }; },
    gold: { x: gx, y: y }, eggX: ex
  };
}
function hideseekDrawHenShadow(c, x, y, s, col) {
  c.fillStyle = col;
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y - s * 0.68, s * 0.6, s * 0.45, 0, 0, Math.PI * 2); else c.arc(x, y - s * 0.68, s * 0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.arc(x + s * 0.42, y - s * 1.12, s * 0.25, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.6, y - s * 0.95, s * 0.2, 0, Math.PI * 2); c.fill();
}
function drawHideseekHud(c) {
  var H = hideseekHud(), hs = H.hs, i, j, hn, P, b, done, g = hideseekGoldHen(), cs = hs * 1.25;
  drawHudPanel(c, H.left, H.top, H.x1 - H.left, H.y1 - H.top, hs);
  // Kori
  var bx = H.basket.x, by = H.basket.y;
  c.beginPath(); c.moveTo(bx - hs * 1.6, by - hs * 1.2); c.lineTo(bx + hs * 1.6, by - hs * 1.2); c.lineTo(bx + hs * 1.2, by + hs * 0.4); c.lineTo(bx - hs * 1.2, by + hs * 0.4); c.closePath();
  artFillPath(c, '#d8a05a', by - hs * 1.2, by + hs * 0.4, hs, { lineColor: '#7a5028' });
  c.strokeStyle = 'rgba(122,80,40,0.55)';
  c.lineWidth = Math.max(1, hs * 0.12);
  c.beginPath(); c.moveTo(bx - hs * 1.4, by - hs * 0.6); c.lineTo(bx + hs * 1.4, by - hs * 0.6); c.moveTo(bx - hs * 1.3, by - hs * 0.1); c.lineTo(bx + hs * 1.3, by - hs * 0.1); c.stroke();
  c.strokeStyle = '#a0703a';
  c.lineWidth = Math.max(1.5, hs * 0.22);
  c.beginPath(); c.arc(bx, by - hs * 1.2, hs * 1.15, Math.PI, 0); c.stroke();
  // Paikat: löydetty kana värissään, puuttuva varjona
  for (i = 0; i < H.n; i++) {
    P = H.slot(i);
    hn = null;
    for (j = 0; j < hideseek.hens.length; j++) if (hideseek.hens[j].slot === i && hideseek.hens[j].state === 'home') hn = hideseek.hens[j];
    b = hideseek.bump[i] > 0 ? 1 + Math.sin(hideseek.bump[i] * 14) * 0.15 : 1;
    if (hn) hideseekHenDraw(c, hn.col, P.x, P.y, cs * b, 1, { flap: hideseek.bump[i] > 0 });
    else hideseekDrawHenShadow(c, P.x, P.y, cs, 'rgba(110,90,140,0.28)');
  }
  // Kultakanan paikka
  P = H.gold;
  done = g && g.state === 'home';
  b = hideseek.goldBump > 0 ? 1 + Math.sin(hideseek.goldBump * 14) * 0.18 : 1;
  artGlow(c, P.x, P.y - cs * 0.7, cs * (done ? 1.6 : 1.2), '#ffe678', done ? 0.7 : 0.35);
  if (done) hideseekHenDraw(c, COOP_GOLD_C, P.x, P.y, cs * b, 1, { flap: hideseek.goldBump > 0 });
  else hideseekDrawHenShadow(c, P.x, P.y, cs, 'rgba(200,150,40,0.35)');
  // Kierrokset munina (kultainen, jos kultakana löytyi)
  for (i = 0; i < HIDESEEK_ROUNDS.length; i++) {
    var ex = H.eggX + i * hs * 1.5, ey = H.top + hs * 2.4;
    done = i < hideseek.round || hideseek.state === 'won' || (i === hideseek.round && hideseek.state === 'roundDone');
    c.globalAlpha = done ? 1 : (i === hideseek.round ? 0.55 + Math.sin(globalT * 4) * 0.15 : 0.3);
    drawCoopEgg(c, ex, ey, hs * 0.6, 0, done && hideseek.goldFound[i] ? 1 : 0);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.hideseek = function (c, x, y, s) {
  var k = Math.sin(globalT * 3) > 0.6 ? 0.06 : 0;
  drawCoopBirdShape(c, 'hen', 1, x + s * 0.12, y - s * 0.02 - k * s, s * 0.32, -1, { flap: false, peck: 0, sit: true, blink: false, crow: false, age: 1 });
  artBlob(c, x, y + s * 0.12, s * 0.38, s * 0.24, '#f2cf6a', { lineColor: '#a8803a', hi: 0.25 });
  c.strokeStyle = 'rgba(168,128,58,0.6)';
  c.lineWidth = Math.max(1, s * 0.025);
  c.beginPath(); c.arc(x - s * 0.15, y + s * 0.12, s * 0.12, 0, Math.PI * 2); c.stroke();
  hideseekDrawFeather(c, x - s * 0.3, y - s * 0.2, s * 0.08, -0.5, false);
};
