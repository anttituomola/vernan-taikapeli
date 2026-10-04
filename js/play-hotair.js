'use strict';

// Ilmapalloretki (Kaukamaa, Maalaiskylä): pitkä ja helppo lentokenttä ilman
// sydämiä, aikarajaa ja rangaistuksia. Prinsessa ja yksisarvinen lentävät
// kuumailmapallolla kylän yli: katot, kirkko ja tuulimyllyt, pellot ja
// lehmät, järvi kalastajineen, metsä, kukkulat sateenkaarineen ja lopuksi
// iltaruskossa kylän juhlakenttä, jolle laskeudutaan.
//   Ohjaus: tuuli vie palloa itsestään eteenpäin (kamera vierii). Sormi
//   ruudulla = pallo hakeutuu pehmeästi sormen korkeudelle (jousi ja
//   vaimennus, pystynopeus enintään HOTAIR_VMAX × viewW / s). Ilman sormea
//   pallo leijuu paikallaan. Mikään ei törmää: pilvet kikattavat ja
//   pöllähtävät, linnut pyrähtävät, latvat kahisevat.
//   Kerättävää eri korkeuksilla: tähdet, pilvilampaat (hyppäävät pallon
//   päälle), perhoset (lentävät pallon ympärillä), ilmapallot, latvojen
//   omenat ja kukkulan kukat (koriin).
//   Toiveet: neljä kyläläistä vilkuttaa, ja puhekuplassa on kuva (omena,
//   kukka tai ilmapallo, 1–2 kpl). Kyläläisen (tai kuplan) napautus pudottaa
//   korista yhden; kyläläinen juoksee ottamaan sen kiinni (lempeä tarkkuus).
//   Ohi mennyt putoaa nurmelle ja lentää takaisin koriin. Täytetty toive
//   antaa kolme tähteä. Ohi lennetty kyläläinen vain vilkuttaa hyvästit.
//   Maaystävät (ankanpoikanen ja karitsa) hyppäävät koriin, kun kori
//   laskeutuu niityn tasalle niiden kohdalla.
//   Kaksi unista tuulipilveä pysäyttää tuulen tehtävän ajaksi (yhdistä
//   pisteet, palapeli); herättyään pilvi nousee pois ja puuska vie eteenpäin.
//   Kultainen pallo: kaikki kuusi pilvilammasta kyydissä.
//   Yllätys: aurinkoon viides tökkäys tuo sateenkaaren ja lentävän pupun,
//   joka pudottaa tähtiä.

// Mitat: maailman x × viewW, korkeudet × viewH
var HOTAIR_V = 0.095;        // tuulen nopeus × viewW / s
var HOTAIR_ACC = 0.06;       // tuulen kiihtyvyys × viewW / s²
var HOTAIR_DEC = 0.035;      // pysähdyksen hidastuvuus × viewW / s²
var HOTAIR_SX = 0.36;        // pallon paikka ruudulla × viewW
var HOTAIR_R = 0.075;        // kuoren säde × viewH
var HOTAIR_BOT = 2.0;        // korin pohja kuoren keskeltä × R
var HOTAIR_GROUND = 0.86;    // maan pinta (laskeutuminen, maaystävät) × viewH
var HOTAIR_FEET = 0.93;      // kyläläisten jalat × viewH
var HOTAIR_YMIN = 0.2;       // kuoren keskikohta ylimmillään × viewH
var HOTAIR_CRUISE = 0.42;    // lähtökorkeus ja leijunta
var HOTAIR_K = 7;            // ohjauksen jousi (sormen korkeus)
var HOTAIR_C = 5;            // vaimennus (vaimennussuhde ≈ 0,95: ei ylitystä)
var HOTAIR_VMAX = 0.2;       // pystynopeus enintään × viewW / s
var HOTAIR_START = 0.45;
var HOTAIR_END = 13.0;       // juhlakentän laskeutumispaikka
var HOTAIR_THEMES = [[0, 'village'], [3.0, 'fields'], [5.4, 'lake'], [6.9, 'forest'], [9.0, 'hills'], [11.8, 'fest']];
var HOTAIR_LAKE = [5.55, 6.5];
var HOTAIR_VILL_U = [2.4, 5.0, 8.5, 11.2];
var HOTAIR_SRC_U = [1.3, 4.3, 7.5, 10.45];
var HOTAIR_GATE_U = [3.9, 9.7];
var HOTAIR_GATE_STOP = 0.3;  // pallo pysähtyy näin kauas pilven eteen
var HOTAIR_SHEEP_U = [1.8, 3.1, 5.8, 7.1, 8.9, 11.6];
var HOTAIR_BFLY_U = [2.0, 4.75, 6.2, 8.0, 10.75, 12.1];
var HOTAIR_KINDS = ['apple', 'flower', 'balloon'];
var HOTAIR_BAL_COLS = ['#ff6f9a', '#ffd24f', '#7fd4ff', '#8fe38f', '#c9a0ff'];
var HOTAIR_FLOWER_COLS = ['#ff7bac', '#b878ff', '#ffb84f', '#ff5a6a'];
// Kyläläisten asut: vaate, hiukset, päähine
var HOTAIR_LOOKS = [
  { cloth: '#5fa8ff', hair: '#a86a3a', hat: 'straw' },
  { cloth: '#ff9f5a', hair: '#4a3020', hat: 'cap' },
  { cloth: '#b878ff', hair: '#e8e4f0', hat: 'bun' },
  { cloth: '#5cc04a', hair: '#e8a040', hat: 'braids' }
];

var hotair = {
  built: false, x: 0, y: 0, vx: 0, vy: 0, cam: 0, state: 'ground', t: 0, idleT: 0,
  steered: false, noSteer: false, autoLift: false, inv: { apple: 0, flower: 0, balloon: 0 },
  invBump: { apple: 0, flower: 0, balloon: 0 }, items: [], sheep: [], clouds: [], vill: [],
  friends: [], gates: [], trees: [], drops: [], gifts: [], starN: 0, sheepN: 0, friendN: 0,
  wishN: 0, bfly: 0, gold: false, hudBump: 0, sunN: 0, secret: null, rainbowT: 0, landT: 0,
  won: false, burn: 0, waveT: 0, boostT: 0, giggleT: 0, dropHint: false, friendHint: false
};

// ---------- Apu ----------
function hotairYMax() { return HOTAIR_GROUND - HOTAIR_R * HOTAIR_BOT; }
function hotairRnd(a, b) { return a + Math.random() * (b - a); }
function hotairHash(n) {
  var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function hotairShuffle(a) {
  var i, j, t;
  for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function hotairThemeAt(u) {
  var i, th = HOTAIR_THEMES[0][1];
  for (i = 0; i < HOTAIR_THEMES.length; i++) if (u >= HOTAIR_THEMES[i][0]) th = HOTAIR_THEMES[i][1];
  return th;
}
// Pallon kuoren keskikohta ja korin keskikohta pikseleinä (maailmakoordinaatit)
function hotairBX() { return hotair.x * viewW; }
function hotairBY() { return hotair.y * viewH; }
function hotairBasketY() { return hotairBY() + viewH * HOTAIR_R * 1.8; }
// Ilta: viimeinen kolmannes hämärtyy iltaruskoksi
function hotairEvening() {
  if (!hotair.built) return 0;
  return Math.max(0, Math.min(1, (hotair.x - (HOTAIR_END - 3.4)) / 3.0));
}
// Kerättävän paikka pikseleinä (puun omenat seuraavat puuta, perhoset lepattavat)
function hotairItemPos(it) {
  var W = viewW, H = viewH, tr;
  if (it.tree >= 0) {
    tr = hotair.trees[it.tree];
    return { x: tr.u * W + it.ox * tr.s * H, y: hotairTreeCrownY(tr) + it.oy * tr.s * H };
  }
  if (it.kind === 'butterfly') return { x: it.u * W + Math.sin(it.ph * 0.9) * H * 0.04, y: it.v * H + Math.cos(it.ph * 1.3) * H * 0.025 };
  if (it.kind === 'balloon') return { x: it.u * W, y: it.v * H + Math.sin(it.ph * 1.2) * H * 0.012 };
  return { x: it.u * W, y: it.v * H };
}
function hotairItemR(kind) {
  return viewH * ({ star: 0.026, apple: 0.022, flower: 0.028, balloon: 0.03, butterfly: 0.025 }[kind] || 0.025);
}
function hotairTreeCrownY(tr) { return viewH * (0.79 - 0.05) - tr.s * viewH * 0.5; }

// ---------- Maailma ----------
// Kaikki paikat tallennetaan yksikköinä (x × viewW, y × viewH), joten koon
// muutos vaatii vain koristeiden uudelleenrakennuksen.
function hotairBuild() {
  var H = hotair, i, j, u, v, typ, kinds, looks, near;
  H.items = []; H.sheep = []; H.clouds = []; H.vill = []; H.gates = []; H.friends = []; H.trees = [];
  kinds = hotairShuffle(HOTAIR_KINDS.slice());
  kinds.push(kinds[Math.floor(Math.random() * 2)]);
  looks = hotairShuffle([0, 1, 2, 3]);
  for (i = 0; i < 4; i++) {
    H.vill.push({
      u: HOTAIR_VILL_U[i] + hotairRnd(-0.08, 0.08), kind: kinds[i], n: i === 0 ? 1 : (Math.random() < 0.55 ? 2 : 1),
      got: 0, look: looks[i], state: 'wait', off: 0, t: Math.random() * 3, shake: 0, happyT: 0, catchT: 0
    });
    hotairAddSource(HOTAIR_SRC_U[i] + hotairRnd(-0.06, 0.06), kinds[i]);
  }
  for (i = 0; i < HOTAIR_GATE_U.length; i++) H.gates.push({ u: HOTAIR_GATE_U[i], task: i, state: 'wait', t: 0 });
  // Tähtiryhmät: matala viiva leijuntakorkeudella (ilman sormea saa nämä),
  // kaari ylös, korkea viiva ja matala kaari
  for (u = 0.95; u < HOTAIR_END - 0.8; u += 0.5) {
    near = false;
    for (i = 0; i < HOTAIR_GATE_U.length; i++) if (Math.abs(u - HOTAIR_GATE_U[i]) < 0.5) near = true;
    for (i = 0; i < HOTAIR_SRC_U.length; i++) if (Math.abs(u - HOTAIR_SRC_U[i]) < 0.3) near = true;
    if (near) continue;
    typ = u < 1 ? 0 : Math.random();
    if (typ < 0.38) {
      for (j = 0; j < 4; j++) hotairAddItem('star', u + j * 0.06, HOTAIR_CRUISE + 0.005);
    } else if (typ < 0.62) {
      for (j = 0; j < 5; j++) hotairAddItem('star', u + j * 0.055, 0.42 - Math.sin(j / 4 * Math.PI) * 0.17);
    } else if (typ < 0.82) {
      for (j = 0; j < 3; j++) hotairAddItem('star', u + j * 0.065, 0.25);
    } else {
      for (j = 0; j < 4; j++) hotairAddItem('star', u + j * 0.06, 0.69 - Math.sin(j / 3 * Math.PI) * 0.03);
    }
  }
  // Pilvilampaat korkealla pilvissä
  for (i = 0; i < HOTAIR_SHEEP_U.length; i++) {
    v = 0.2 + Math.random() * 0.08;
    H.clouds.push({ u: HOTAIR_SHEEP_U[i] + hotairRnd(-0.1, 0.1), v: v, s: 0.045, sheep: i, puffT: 0, inside: false });
    H.sheep.push({ state: 'cloud', t: 0, cloud: H.clouds.length - 1, seat: -1, x0: 0, y0: 0, face: i % 2 ? -1 : 1 });
  }
  // Koristepilvet (läpi lennetään kikattaen)
  for (u = 0.7; u < HOTAIR_END - 0.5; u += 0.75 + Math.random() * 0.45) {
    near = false;
    for (i = 0; i < HOTAIR_SHEEP_U.length; i++) if (Math.abs(u - HOTAIR_SHEEP_U[i]) < 0.35) near = true;
    for (i = 0; i < HOTAIR_GATE_U.length; i++) if (Math.abs(u - HOTAIR_GATE_U[i]) < 0.55) near = true;
    if (near) continue;
    H.clouds.push({ u: u, v: hotairRnd(0.16, 0.5), s: hotairRnd(0.028, 0.045), sheep: -1, puffT: 0, inside: false });
  }
  // Perhoset: pari korkealla ja pari niityn yllä
  for (i = 0; i < HOTAIR_BFLY_U.length; i++) {
    v = i % 2 ? 0.27 + Math.random() * 0.05 : 0.7 + Math.random() * 0.03;
    for (j = 0; j < 2; j++) hotairAddItem('butterfly', HOTAIR_BFLY_U[i] + j * 0.09, v + j * 0.02);
  }
  // Maaystävät: ankanpoikanen järven rannalla ja karitsa kukkulalla
  H.friends.push({ u: 6.72, kind: 'duck', state: 'wait', t: 0, seat: 0, x0: 0, y0: 0, waveT: 0 });
  H.friends.push({ u: 10.05, kind: 'sheep', state: 'wait', t: 0, seat: 1, x0: 0, y0: 0, waveT: 0 });
}
function hotairAddItem(kind, u, v, extra) {
  var it = { kind: kind, u: u, v: v, got: false, ph: Math.random() * 6, fly: 1, fx: 0, fy: 0, tree: -1, ox: 0, oy: 0, col: '#ffffff' };
  var k;
  if (extra) for (k in extra) it[k] = extra[k];
  hotair.items.push(it);
  return it;
}
// Toiveen lähde: kaksi omenapuuta (4 omenaa), neljä kukkaa tai neljä ilmapalloa
function hotairAddSource(u0, kind) {
  var H = hotair, j, tr;
  if (kind === 'apple') {
    for (j = 0; j < 2; j++) {
      H.trees.push({ u: u0 + j * 0.26, s: 0.1 + j * 0.012 });
      tr = H.trees.length - 1;
      hotairAddItem('apple', 0, 0, { tree: tr, ox: -0.45, oy: -0.35 });
      hotairAddItem('apple', 0, 0, { tree: tr, ox: 0.4, oy: 0.05 });
    }
  } else if (kind === 'flower') {
    for (j = 0; j < 4; j++) hotairAddItem('flower', u0 + j * 0.085, 0.69 + (j % 2) * 0.025, { col: HOTAIR_FLOWER_COLS[j % 4] });
  } else {
    for (j = 0; j < 4; j++) hotairAddItem('balloon', u0 + j * 0.1, 0.24 + hotairHash(u0 * 10 + j) * 0.08, { col: HOTAIR_BAL_COLS[(j + Math.floor(u0)) % 5] });
  }
}

// ---------- Alustus ----------
function initHotair() {
  var i;
  tasks = [makeTask(-5, 'dots'), makeTask(-5, 'jigsaw')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  hotairBuild();
  hotair.built = true;
  hotair.x = HOTAIR_START;
  hotair.y = hotairYMax();
  hotair.vx = 0;
  hotair.vy = 0;
  hotair.state = 'ground';
  hotair.t = 0;
  hotair.idleT = 0;
  hotair.steered = false;
  hotair.noSteer = false;
  hotair.autoLift = false;
  hotair.inv = { apple: 0, flower: 0, balloon: 0 };
  hotair.invBump = { apple: 0, flower: 0, balloon: 0 };
  hotair.drops = [];
  hotair.gifts = [];
  hotair.starN = 0;
  hotair.sheepN = 0;
  hotair.friendN = 0;
  hotair.wishN = 0;
  hotair.bfly = 0;
  hotair.gold = false;
  hotair.hudBump = 0;
  hotair.sunN = 0;
  hotair.secret = null;
  hotair.rainbowT = 0;
  hotair.landT = 0;
  hotair.won = false;
  hotair.burn = 0;
  hotair.waveT = 0;
  hotair.boostT = 0;
  hotair.giggleT = 0;
  hotair.dropHint = false;
  hotair.friendHint = false;
  hotair.cam = hotair.x * viewW - viewW * HOTAIR_SX;
  hotairSetupProps();
  renderBackground();
  playNote(392, 0, 0.25, 'sine', 0.3);
  playNote(523, 0.15, 0.35, 'triangle', 0.3);
}
function respawnHotair() {}
function resizeHotair() {
  camX = 0;
  if (!hotair.built) return;
  hotair.cam = hotair.x * viewW - viewW * HOTAIR_SX;
  hotairSetupProps();
}

// ---------- Tökättävät koristeet ----------
// Maailmakoordinaateissa (pikseleinä), rakennetaan uudestaan koon muuttuessa.
// Taso 0 piirretään pallon taakse.
function hotairSetupProps() {
  var W = viewW, H = viewH, i, tr;
  propsReset();
  // Kylä: talot, kirkko ja tuulimylly
  hotairAddHouse(0.75 * W, H * 0.785, H * 0.09, '#ff9f7a');
  hotairAddChurch(1.05 * W, H * 0.79, H * 0.12);
  hotairAddHouse(1.75 * W, H * 0.785, H * 0.08, '#7fc8ff');
  hotairAddHouse(2.1 * W, H * 0.79, H * 0.095, '#ffd24f');
  trainAddMill(2.75 * W, H * 0.78, H * 0.1);
  // Pellot: lehmät katsovat palloa, heinäpaali, variksenpelätin, mylly
  hotairAddCow(3.3 * W, H * 0.81, H * 0.045, 1);
  trainAddHay(3.65 * W, H * 0.8, H * 0.04);
  hotairAddCow(4.05 * W, H * 0.815, H * 0.05, -1);
  trainAddScarecrow(4.95 * W - H * 0.25, H * 0.8, H * 0.065);
  trainAddMill(4.7 * W, H * 0.775, H * 0.085);
  hotairAddCow(5.25 * W, H * 0.81, H * 0.042, 1);
  // Järvi: kalastajat veneessä, ankat
  hotairAddBoat(6.0 * W, H * 0.88, H * 0.06);
  trainAddGrazer(5.75 * W, H * 0.83, H * 0.028, 'duck', 1);
  trainAddGrazer(6.3 * W, H * 0.92, H * 0.026, 'duck', -1);
  // Metsä: pöllöpuu
  hotairAddOwlTree(7.95 * W, H * 0.79, H * 0.12);
  // Kukkulat: lohikäärmeleija ja lampaat
  hotairAddKite(10.75 * W, H * 0.3, H * 0.05);
  trainAddGrazer(9.35 * W, H * 0.8, H * 0.034, 'sheep', 1);
  trainAddGrazer(11.0 * W, H * 0.805, H * 0.036, 'sheep', -1);
  // Juhlakenttä: teltat
  hotairAddTent(12.35 * W, H * 0.79, H * 0.1, '#e85a4a');
  hotairAddTent(13.55 * W, H * 0.79, H * 0.11, '#7a3cb8');
  // Lintuparvet taivaalla
  hotairAddBirds(2.9 * W, H * 0.33);
  hotairAddBirds(6.3 * W, H * 0.27);
  hotairAddBirds(9.2 * W, H * 0.36);
  hotairAddBirds(12.0 * W, H * 0.3);
  // Omenapuut (omenat ovat kerättäviä, puu heilahtaa)
  for (i = 0; i < hotair.trees.length; i++) {
    tr = hotair.trees[i];
    hotairAddTree(tr.u * W, H * 0.79, tr.s * H);
  }
}

// Lehmä laiduntaa; kun pallo lentää yli, se nostaa päänsä ja ammuu kerran.
// Joka kolmas tökkäys: ilohyppy ja sydämet.
function hotairAddCow(x, y, s, face) {
  propAdd({
    x: x, y: y, r: s * 1.5, hy: s * 0.9, color: '#ffffff', note: 330, amp: 0.1, hopT: 0, lookK: 0, mooed: false, eatT: Math.random() * 5,
    update: function (p, dt) {
      var dx = Math.abs(hotairBX() - p.x), near = dx < viewW * 0.14 && hotair.state !== 'ground';
      p.lookK += ((near ? 1 : 0) - p.lookK) * Math.min(1, dt * 3);
      if (near && !p.mooed) { p.mooed = true; trainAnimalSound('cow'); }
      if (dx > viewW * 0.4) p.mooed = false;
      if (p.hopT > 0) p.hopT -= dt;
      p.eatT += dt;
    },
    draw: function (c, p) {
      var hop = p.hopT > 0 ? Math.sin((0.8 - p.hopT) / 0.8 * Math.PI) * s * 1.2 : 0;
      artShadow(c, 0, 0, s * 1.1, s * 0.25, 0.16);
      c.save();
      c.translate(0, -hop);
      c.rotate(-p.lookK * 0.2 * face);
      trainDrawAnimal(c, 'cow', 0, 0, s, { face: face, t: p.eatT, graze: p.lookK < 0.3 && p.t < 0 && hop === 0 });
      c.restore();
    },
    poke: function (p) {
      trainAnimalSound('cow');
      if (p.n % 3 === 0) { p.hopT = 0.8; trainHearts(p.x, p.y - s * 2.5, 3); }
    }
  });
}

// Kylän talo: tökkäys puhaltaa savupiipusta sydämen; joka kolmas: kissa katolla
function hotairAddHouse(x, y, s, col) {
  propAdd({
    x: x, y: y, r: s * 0.85, hy: s * 0.75, color: col, note: 587, amp: 0.04, heartT: 0, catT: 0, lightT: 0,
    update: function (p, dt) { if (p.heartT > 0) p.heartT -= dt; if (p.catT > 0) p.catT -= dt; if (p.lightT > 0) p.lightT -= dt; },
    draw: function (c, p) {
      var lit = p.lightT > 0 || hotairEvening() > 0.5, k, i;
      artShadow(c, 0, 0, s * 0.8, s * 0.12, 0.15);
      artRoundRect(c, s * 0.25, -s * 1.45, s * 0.18, s * 0.4, s * 0.04, '#c86a4a', { lineColor: '#6a3020' });
      // Savu: pienet pallot nousevat (tökkäyksestä sydän)
      for (i = 0; i < 3; i++) {
        k = (globalT * 0.4 + i / 3) % 1;
        c.globalAlpha = 0.5 * (1 - k);
        artCircle(c, s * 0.34 + Math.sin(k * 5 + i) * s * 0.08, -s * 1.5 - k * s * 0.7, s * (0.06 + k * 0.08), '#ffffff', { line: false });
      }
      c.globalAlpha = 1;
      if (p.heartT > 0) {
        k = 1 - p.heartT / 1.6;
        c.globalAlpha = Math.min(1, p.heartT * 2);
        trainDrawHeart(c, s * 0.34 + Math.sin(k * 6) * s * 0.06, -s * 1.6 - k * s * 1.1, s * (0.1 + k * 0.08));
        c.globalAlpha = 1;
      }
      artRoundRect(c, -s * 0.6, -s * 0.9, s * 1.2, s * 0.9, s * 0.06, '#fff4e8', { lineColor: '#a8806a', shadeTo: '#ead8c8' });
      c.beginPath(); c.moveTo(-s * 0.75, -s * 0.85); c.lineTo(0, -s * 1.45); c.lineTo(s * 0.75, -s * 0.85); c.closePath();
      artFillPath(c, col, -s * 1.45, -s * 0.85, s * 0.5, {});
      artRoundRect(c, s * 0.15, -s * 0.5, s * 0.26, s * 0.5, s * 0.06, '#a86a3a', { lineColor: '#6a4020' });
      if (lit) artGlow(c, -s * 0.25, -s * 0.55, s * 0.35, '#ffe890', 0.6);
      artRoundRect(c, -s * 0.42, -s * 0.72, s * 0.34, s * 0.3, s * 0.05, lit ? '#ffe890' : '#8fd4ff', { lineColor: '#6a4020' });
      // Kissa kurkkaa katon harjalta
      if (p.catT > 0) {
        k = Math.min(1, (2.5 - p.catT) * 4, p.catT * 3);
        c.save();
        c.translate(-s * 0.2, -s * 1.17 - k * s * 0.18);
        artCircle(c, 0, 0, s * 0.16, '#ffa850', { lineColor: '#a8601a' });
        c.beginPath(); c.moveTo(-s * 0.15, -s * 0.05); c.lineTo(-s * 0.12, -s * 0.24); c.lineTo(-s * 0.02, -s * 0.12); c.closePath();
        c.moveTo(s * 0.15, -s * 0.05); c.lineTo(s * 0.12, -s * 0.24); c.lineTo(s * 0.02, -s * 0.12); c.closePath();
        artFillPath(c, '#ffa850', -s * 0.24, -s * 0.05, s * 0.1, { lineColor: '#a8601a' });
        artEye(c, -s * 0.06, -s * 0.02, s * 0.035, 0.3, false);
        artEye(c, s * 0.06, -s * 0.02, s * 0.035, 0.3, false);
        c.restore();
      }
    },
    poke: function (p) {
      p.heartT = 1.6;
      p.lightT = 3;
      if (p.n % 3 === 0) {
        p.catT = 2.5;
        playNote(880, 0.1, 0.12, 'triangle', 0.2);
        playNote(740, 0.25, 0.2, 'triangle', 0.2);
      }
    }
  });
}

// Kirkko: tökkäys keinuttaa kelloa (ding-dong); joka kolmas: kyyhkyset lentävät tornista
function hotairAddChurch(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.9, hy: s * 1.3, color: '#ffe08a', note: 523, amp: 0.04, bellT: 0, doveT: 0,
    update: function (p, dt) { if (p.bellT > 0) p.bellT -= dt; if (p.doveT > 0) p.doveT -= dt; },
    draw: function (c, p) {
      var i, k, sw = p.bellT > 0 ? Math.sin(p.bellT * 9) * 0.5 * Math.min(1, p.bellT / 2) : Math.sin(globalT * 1.3) * 0.04;
      artShadow(c, -s * 0.2, 0, s * 1.1, s * 0.12, 0.15);
      artRoundRect(c, -s * 0.95, -s * 0.8, s * 1.1, s * 0.8, s * 0.05, '#fff4e8', { lineColor: '#a8806a', shadeTo: '#ead8c8' });
      c.beginPath(); c.moveTo(-s * 1.05, -s * 0.75); c.lineTo(-s * 0.4, -s * 1.2); c.lineTo(s * 0.25, -s * 0.75); c.closePath();
      artFillPath(c, '#e85a4a', -s * 1.2, -s * 0.75, s * 0.4, {});
      artRoundRect(c, -s * 0.62, -s * 0.38, s * 0.22, s * 0.38, s * 0.11, '#a86a3a', { lineColor: '#6a4020' });
      artCircle(c, -s * 0.4, -s * 0.97, s * 0.08, '#ffb8d8', { lineColor: '#a8806a' });
      // Torni
      artRoundRect(c, s * 0.1, -s * 1.65, s * 0.5, s * 1.65, s * 0.05, '#fff4e8', { lineColor: '#a8806a', shadeTo: '#ead8c8' });
      c.beginPath(); c.moveTo(s * 0.02, -s * 1.6); c.lineTo(s * 0.35, -s * 2.3); c.lineTo(s * 0.68, -s * 1.6); c.closePath();
      artFillPath(c, '#5f8fd8', -s * 2.3, -s * 1.6, s * 0.35, {});
      drawStar(c, s * 0.35, -s * 2.36, s * 0.07, 0, 0);
      artRoundRect(c, s * 0.2, -s * 1.45, s * 0.3, s * 0.32, s * 0.14, '#5a3a5a', { line: false });
      // Kello
      c.save();
      c.translate(s * 0.35, -s * 1.42);
      c.rotate(sw);
      c.beginPath();
      c.moveTo(-s * 0.06, 0); c.quadraticCurveTo(-s * 0.08, s * 0.14, -s * 0.12, s * 0.2); c.lineTo(s * 0.12, s * 0.2); c.quadraticCurveTo(s * 0.08, s * 0.14, s * 0.06, 0); c.closePath();
      artFillPath(c, '#ffd24f', 0, s * 0.2, s * 0.1, { lineColor: '#a8700a' });
      c.restore();
      artCircle(c, s * 0.35, -s * 0.8, s * 0.1, '#8fd4ff', { lineColor: '#6a4020' });
      // Kyyhkyset
      if (p.doveT > 0) {
        k = 1 - p.doveT / 2.5;
        for (i = 0; i < 3; i++) {
          var dx = s * 0.35 + (i - 1) * s * 0.4 * k + Math.sin(k * 8 + i) * s * 0.1, dy = -s * 1.3 - k * s * (1.6 + i * 0.4);
          c.globalAlpha = Math.min(1, p.doveT * 2);
          hotairDrawBird(c, dx, dy, s * 0.12, globalT * 3 + i, '#ffffff');
        }
        c.globalAlpha = 1;
      }
    },
    poke: function (p) {
      p.bellT = 2;
      playNote(523, 0, 0.9, 'triangle', 0.3);
      playNote(392, 0.45, 1.0, 'triangle', 0.3);
      if (p.n % 3 === 0) {
        p.doveT = 2.5;
        playNote(1568, 0.2, 0.08, 'sine', 0.15);
        playNote(1760, 0.32, 0.08, 'sine', 0.15);
      }
    }
  });
}

// Omenapuu (omenat ovat kerättäviä): tökkäys kahisuttaa; joka kolmas: lintu pyrähtää
function hotairAddTree(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.1, hy: s * 1.4, color: '#8fe38f', note: 440, amp: 0.05, birdT: 0,
    update: function (p, dt) { if (p.birdT > 0) p.birdT -= dt; },
    draw: function (c, p) {
      var cy = -viewH * 0.05 - s * 0.5;
      artShadow(c, 0, 0, s * 0.9, s * 0.15, 0.15);
      artRoundRect(c, -s * 0.14, -viewH * 0.06, s * 0.28, viewH * 0.06, s * 0.08, '#a8703a', { lineColor: '#5a3a1a' });
      artCircle(c, -s * 0.55, cy + s * 0.25, s * 0.6, '#5fbf55', {});
      artCircle(c, s * 0.55, cy + s * 0.25, s * 0.6, '#5fbf55', {});
      artCircle(c, 0, cy - s * 0.1, s * 0.85, '#6fcf5f', { hi: 0.3 });
      if (p.birdT > 0) {
        var k = 1 - p.birdT / 1.8;
        hotairDrawBird(c, s * 0.3 + k * s * 2.5, cy - s * 0.6 - Math.sin(k * Math.PI) * s * 1.2, s * 0.22, globalT * 3, '#5fa8ff');
      }
    },
    poke: function (p) {
      spawnSparkles(p.x, p.y - s * 1.2, 5, '#6fcf5f');
      if (p.n % 3 === 0) { p.birdT = 1.8; playNote(1568, 0, 0.08, 'sine', 0.2); playNote(1760, 0.1, 0.1, 'sine', 0.2); }
    }
  });
}

// Pöllöpuu metsässä: pöllö räpäyttää ja huhuilee; joka kolmas: pöllönpoikanen
function hotairAddOwlTree(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.9, hy: s * 1.5, color: '#c8a070', note: 330, amp: 0.04, blinkT: 0, babyT: 0,
    update: function (p, dt) { if (p.blinkT > 0) p.blinkT -= dt; if (p.babyT > 0) p.babyT -= dt; },
    draw: function (c, p) {
      artShadow(c, 0, 0, s * 0.8, s * 0.14, 0.15);
      artRoundRect(c, -s * 0.2, -s * 1.3, s * 0.4, s * 1.3, s * 0.1, '#a8703a', { lineColor: '#5a3a1a' });
      artCircle(c, -s * 0.45, -s * 1.5, s * 0.5, '#3f9a45', {});
      artCircle(c, s * 0.45, -s * 1.5, s * 0.5, '#3f9a45', {});
      artCircle(c, 0, -s * 1.85, s * 0.65, '#4faa50', { hi: 0.25 });
      artBlob(c, 0, -s * 0.9, s * 0.13, s * 0.17, '#4a2a1a', { line: false });
      hotairDrawOwl(c, 0, -s * 0.88, s * 0.12, p.blinkT > 0 || (globalT % 4) < 0.12);
      if (p.babyT > 0) hotairDrawOwl(c, s * 0.22, -s * 1.12, s * 0.08, (globalT % 3) < 0.15);
    },
    poke: function (p) {
      p.blinkT = 0.4;
      playNote(392, 0, 0.25, 'sine', 0.25);
      playNote(330, 0.3, 0.35, 'sine', 0.25);
      if (p.n % 3 === 0) p.babyT = 4;
    }
  });
}
function hotairDrawOwl(c, x, y, s, blink) {
  artBlob(c, x, y, s * 0.8, s, '#b08060', { lineColor: '#5a3a1a' });
  artCircle(c, x - s * 0.32, y - s * 0.3, s * 0.3, '#fff4e0', { lineColor: '#5a3a1a' });
  artCircle(c, x + s * 0.32, y - s * 0.3, s * 0.3, '#fff4e0', { lineColor: '#5a3a1a' });
  artEye(c, x - s * 0.32, y - s * 0.3, s * 0.17, 0, blink);
  artEye(c, x + s * 0.32, y - s * 0.3, s * 0.17, 0, blink);
  c.beginPath(); c.moveTo(x - s * 0.1, y - s * 0.08); c.lineTo(x + s * 0.1, y - s * 0.08); c.lineTo(x, y + s * 0.12); c.closePath();
  artFillPath(c, '#ffb020', y - s * 0.1, y + s * 0.12, s * 0.1, { lineColor: '#a8700a' });
}

// Kalastajat veneessä (vihje Kalastusretkeen): tökkäys nostaa kalan;
// viides tökkäys: kultakala hyppää veneen yli
function hotairAddBoat(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.6, hy: s * 0.8, color: '#7fd4ff', note: 494, amp: 0.06, fishT: 0, gold: false,
    update: function (p, dt) { if (p.fishT > 0) p.fishT -= dt; },
    draw: function (c, p) {
      var bob = Math.sin(globalT * 1.6) * s * 0.06, k, fx, fy;
      c.save();
      c.translate(0, bob);
      // Vavat ja siimat
      c.strokeStyle = '#6a4020';
      c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.moveTo(-s * 0.6, -s * 0.9); c.lineTo(-s * 1.5, -s * 1.7); c.moveTo(s * 0.55, -s * 0.9); c.lineTo(s * 1.4, -s * 1.6); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(-s * 1.5, -s * 1.7); c.lineTo(-s * 1.6, s * 0.15); c.moveTo(s * 1.4, -s * 1.6); c.lineTo(s * 1.5, s * 0.15); c.stroke();
      artCircle(c, -s * 1.6, s * 0.12, s * 0.07, '#ff4a4a', { lineColor: '#8a2a2a' });
      artCircle(c, s * 1.5, s * 0.12, s * 0.07, '#ff4a4a', { lineColor: '#8a2a2a' });
      hotairDrawPerson(c, -s * 0.45, -s * 0.2, s * 0.42, HOTAIR_LOOKS[1], 0, false, globalT);
      hotairDrawPerson(c, s * 0.45, -s * 0.2, s * 0.38, HOTAIR_LOOKS[3], 0, false, globalT + 1);
      c.beginPath();
      c.moveTo(-s * 1.2, -s * 0.45); c.lineTo(s * 1.2, -s * 0.45); c.quadraticCurveTo(s * 1.0, s * 0.2, s * 0.6, s * 0.22); c.lineTo(-s * 0.6, s * 0.22); c.quadraticCurveTo(-s * 1.0, s * 0.2, -s * 1.2, -s * 0.45);
      c.closePath();
      artFillPath(c, '#e8704a', -s * 0.45, s * 0.22, s * 0.5, { lineColor: '#7a3020' });
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fillRect(-s * 1.0, -s * 0.3, s * 2.0, s * 0.07);
      c.restore();
      // Hyppäävä kala
      if (p.fishT > 0) {
        k = 1 - p.fishT / 1.1;
        fx = -s * 1.6 + k * s * 1.4;
        fy = s * 0.1 - Math.sin(k * Math.PI) * s * 1.6;
        c.save();
        c.translate(fx, fy);
        c.rotate(-Math.cos(k * Math.PI) * 0.8);
        trainDrawIcon(c, 'fish', 0, 0, s * (p.gold ? 0.45 : 0.32), p.gold ? '#ffd24f' : '#4aa8ff');
        c.restore();
        if (p.gold) artGlow(c, fx, fy, s * 0.6, '#ffe27a', 0.4);
      }
      // Vesirenkaat
      c.strokeStyle = 'rgba(255,255,255,0.45)';
      c.lineWidth = Math.max(1, s * 0.04);
      c.beginPath(); c.ellipse(0, s * 0.25, s * 1.4, s * 0.12, 0, 0, Math.PI * 2); c.stroke();
    },
    poke: function (p) {
      p.fishT = 1.1;
      p.gold = p.n % 5 === 0;
      playNote(p.gold ? 1319 : 784, 0, 0.15, 'sine', 0.25);
      playNote(p.gold ? 1760 : 988, 0.12, 0.2, 'sine', 0.25);
      spawnSparkles(p.x - s * 1.6, p.y, 6, p.gold ? '#ffe27a' : '#bfe8ff');
    }
  });
}

// Lohikäärmeleija: lapsi pitää narusta kukkulalla. Tökkäys tekee silmukan;
// viides tökkäys: leija puhaltaa sateenkaarikipinöitä
function hotairAddKite(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.5, hy: 0, color: '#ff6f9a', note: 659, amp: 0.15, loopT: 0, fireT: 0,
    update: function (p, dt) {
      if (p.loopT > 0) p.loopT -= dt;
      if (p.fireT > 0) {
        p.fireT -= dt;
        if (Math.random() < dt * 14) spawnSparkles(p.x + s * 1.1, p.y + s * 0.1, 1, maneColors[Math.floor(Math.random() * 6)]);
      }
    },
    draw: function (c, p) {
      var i, sw = Math.sin(globalT * 1.4) * 0.15, kidX = -viewW * 0.13, kidY = viewH * 0.8 - p.y, loop = p.loopT > 0 ? (1 - p.loopT / 1.2) * Math.PI * 2 : 0;
      // Naru ja lapsi kukkulalla
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = Math.max(1, viewH * 0.0025);
      c.beginPath(); c.moveTo(0, s * 0.6); c.quadraticCurveTo(kidX * 0.4, kidY * 0.7, kidX + s * 0.3, kidY - s * 1.1); c.stroke();
      hotairDrawPerson(c, kidX, kidY, s * 0.65, HOTAIR_LOOKS[0], 1, p.loopT > 0, globalT);
      c.save();
      c.rotate(sw + loop);
      // Häntä rusetteineen
      c.strokeStyle = '#8a4a6a';
      c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.moveTo(0, s * 0.6);
      for (i = 1; i <= 4; i++) c.lineTo(Math.sin(globalT * 3 + i) * s * 0.3, s * 0.6 + i * s * 0.45);
      c.stroke();
      for (i = 1; i <= 4; i++) artBlob(c, Math.sin(globalT * 3 + i) * s * 0.3, s * 0.6 + i * s * 0.45, s * 0.14, s * 0.08, maneColors[i], { line: false });
      // Leijan runko (vinoneliö) ja lohikäärmeen pää
      c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(s * 0.65, 0); c.lineTo(0, s * 0.65); c.lineTo(-s * 0.65, 0); c.closePath();
      artFillPath(c, '#6fd66f', -s * 0.9, s * 0.65, s * 0.6, { lineColor: '#2f7a3a' });
      c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, s * 0.65); c.moveTo(-s * 0.65, 0); c.lineTo(s * 0.65, 0);
      c.strokeStyle = 'rgba(47,122,58,0.5)'; c.stroke();
      artBlob(c, s * 0.05, -s * 0.2, s * 0.32, s * 0.26, '#8fe38f', { lineColor: '#2f7a3a' });
      c.beginPath(); c.moveTo(-s * 0.2, -s * 0.38); c.lineTo(-s * 0.28, -s * 0.62); c.lineTo(-s * 0.06, -s * 0.44); c.closePath();
      c.moveTo(s * 0.18, -s * 0.4); c.lineTo(s * 0.3, -s * 0.62); c.lineTo(s * 0.3, -s * 0.36); c.closePath();
      artFillPath(c, '#ffd24f', -s * 0.62, -s * 0.36, s * 0.1, { lineColor: '#a8700a' });
      artEye(c, -s * 0.08, -s * 0.25, s * 0.07, 0.4, (globalT % 3.3) < 0.12);
      artEye(c, s * 0.14, -s * 0.25, s * 0.07, 0.4, (globalT % 3.3) < 0.12);
      artBlush(c, s * 0.25, -s * 0.12, s * 0.06);
      c.restore();
    },
    poke: function (p) {
      p.loopT = 1.2;
      if (p.n % 5 === 0) {
        p.fireT = 1.5;
        playNote(220, 0, 0.3, 'sawtooth', 0.12);
        playNote(330, 0.2, 0.4, 'triangle', 0.2);
      }
    }
  });
}

// Juhlateltta: viiri heilahtaa; joka kolmas tökkäys: serpentiinisuihku
function hotairAddTent(x, y, s, col) {
  propAdd({
    x: x, y: y, r: s * 0.9, hy: s * 0.7, color: col, note: 698, amp: 0.05,
    draw: function (c, p) {
      var i;
      artShadow(c, 0, 0, s * 0.9, s * 0.12, 0.15);
      roundRect(c, -s * 0.7, -s * 0.6, s * 1.4, s * 0.6, s * 0.05);
      artFillPath(c, col, -s * 0.6, 0, s * 0.5, {});
      c.fillStyle = 'rgba(255,246,232,0.55)';
      for (i = 0; i < 4; i++) c.fillRect(-s * 0.7 + i * s * 0.35, -s * 0.6, s * 0.17, s * 0.6);
      c.beginPath(); c.moveTo(-s * 0.85, -s * 0.58); c.lineTo(s * 0.85, -s * 0.58); c.lineTo(0, -s * 1.15); c.closePath();
      artFillPath(c, col, -s * 1.15, -s * 0.58, s * 0.5, {});
      artRoundRect(c, -s * 0.18, -s * 0.38, s * 0.36, s * 0.38, s * 0.15, '#5a3a5a', { line: false });
      artLimb(c, 0, -s * 1.15, 0, -s * 1.4, s * 0.04, '#8a6a4a', false);
      c.beginPath();
      c.moveTo(0, -s * 1.4); c.lineTo(s * 0.25, -s * 1.34 + Math.sin(globalT * 5) * s * 0.03); c.lineTo(0, -s * 1.27); c.closePath();
      artFillPath(c, '#ffd24f', -s * 1.4, -s * 1.27, s * 0.1, { lineColor: '#a8700a' });
      if (hotairEvening() > 0.4) {
        for (i = 0; i < 3; i++) artGlow(c, -s * 0.5 + i * s * 0.5, -s * 0.66, s * 0.14, '#ffe890', 0.7);
      }
    },
    poke: function (p) {
      if (p.n % 3 === 0) {
        var i;
        for (i = 0; i < 6; i++) spawnSparkles(p.x, p.y - s * 1.3, 2, HOTAIR_BAL_COLS[i % 5]);
        playNote(1047, 0.1, 0.15, 'triangle', 0.2);
        playNote(1319, 0.2, 0.2, 'triangle', 0.2);
      }
    }
  });
}

// Lintuparvi lentää hitaasti vastatuuleen. Kun pallo osuu parveen, linnut
// pyrähtävät sivuun sirkuttaen (ei haittaa). Tökkäys: lintu tekee silmukan.
function hotairAddBirds(x, y) {
  propAdd({
    x: x, y: y, r: viewH * 0.07, hy: 0, color: '#ffffff', note: 1319, amp: 0.1, x0: x, scT: 0, loopT: 0, ph: Math.random() * 6,
    update: function (p, dt) {
      var bx = hotairBX(), by = hotairBY();
      p.ph += dt;
      p.x -= viewW * 0.02 * dt;
      if (p.scT > 0) p.scT -= dt;
      if (p.loopT > 0) p.loopT -= dt;
      if (p.scT <= 0 && Math.hypot(p.x - bx, p.y - by) < viewH * HOTAIR_R * 1.9) {
        p.scT = 1.6;
        playNote(1568, 0, 0.06, 'sine', 0.18);
        playNote(1865, 0.07, 0.06, 'sine', 0.18);
        playNote(1568, 0.14, 0.08, 'sine', 0.18);
      }
    },
    draw: function (c, p) {
      var i, s = viewH * 0.022, sc = p.scT > 0 ? Math.sin(p.scT / 1.6 * Math.PI) : 0, ox, oy, lp;
      for (i = 0; i < 3; i++) {
        ox = (i - 1) * s * 2.2 + (i - 1) * sc * s * 3;
        oy = Math.abs(i - 1) * s * 0.9 - sc * s * (i === 1 ? 2.5 : 1) + Math.sin(p.ph * 2 + i) * s * 0.3;
        if (i === 1 && p.loopT > 0) {
          lp = (1 - p.loopT / 1) * Math.PI * 2;
          ox += Math.sin(lp) * s * 1.6;
          oy += (Math.cos(lp) - 1) * s * 1.6;
        }
        hotairDrawBird(c, ox, oy, s, p.ph * 3 + i, i === 1 ? '#5fa8ff' : '#ff9f7a');
      }
    },
    poke: function (p) { p.loopT = 1; }
  });
}
function hotairDrawBird(c, x, y, s, ph, col) {
  var f = Math.sin(ph * 4) * 0.5;
  artBlob(c, x, y, s * 0.55, s * 0.4, col, { hi: 0.3 });
  artBlob(c, x - s * 0.1, y - s * 0.25 - f * s * 0.3, s * 0.42, s * 0.16, artShade(col, 0.25), { rot: -0.5 - f, lineColor: artShade(col, -0.45) });
  artCircle(c, x + s * 0.45, y - s * 0.25, s * 0.25, col, {});
  c.beginPath(); c.moveTo(x + s * 0.65, y - s * 0.3); c.lineTo(x + s * 0.9, y - s * 0.22); c.lineTo(x + s * 0.65, y - s * 0.15); c.closePath();
  artFillPath(c, '#ffb020', y - s * 0.3, y - s * 0.15, s * 0.1, { lineColor: '#a8700a' });
  artEye(c, x + s * 0.52, y - s * 0.3, s * 0.07, 0.5, false);
}

// ---------- Syöte ----------
function handleHotairTap(px, py) {
  var wx = px + hotair.cam, H = viewH, i, v, vx, bx, by, R = H * HOTAIR_R;
  if (!hotair.built || celebrating || puzzleBusy()) return;
  // Kyläläinen tai sen puhekupla: pudota korista toivottu asia
  for (i = 0; i < hotair.vill.length; i++) {
    v = hotair.vill[i];
    if (v.state !== 'wish') continue;
    vx = (v.u + v.off) * viewW;
    if ((Math.abs(wx - vx) < H * 0.075 && py > H * (HOTAIR_FEET - 0.15) && py < H * 0.99) ||
        Math.hypot(wx - vx, py - hotairWishY()) < H * 0.065) {
      hotair.noSteer = true;
      hotairDrop(i);
      return;
    }
  }
  // Aurinko: viides tökkäys tuo sateenkaaren ja lentävän pupun
  if (bgSun && Math.hypot(px - bgSun.x, py - bgSun.y) < bgSun.r * 1.6) {
    hotair.noSteer = true;
    hotair.sunN++;
    if (hotair.sunN % 5 === 0 && !hotair.secret) {
      hotair.secret = { t: 0, drops: 0 };
      hotair.rainbowT = 9;
      soundBunny();
      for (i = 0; i < 6; i++) playNote(784 * Math.pow(1.122, i), 0.15 + i * 0.09, 0.25, 'sine', 0.2);
    }
    return;
  }
  // Pallo itse: prinsessa vilkuttaa, yksisarvinen hirnahtaa
  bx = hotairBX(); by = hotairBY();
  if (Math.hypot(wx - bx, py - by) < R * 1.1 || (Math.abs(wx - bx) < R * 0.7 && py > by + R && py < by + R * HOTAIR_BOT)) {
    hotair.waveT = 1.2;
    playNote(660, 0, 0.12, 'triangle', 0.2);
    playNote(880, 0.1, 0.12, 'triangle', 0.2);
    playNote(740, 0.2, 0.2, 'triangle', 0.18);
    spawnSparkles(bx, by - R * 0.4, 5, '#ff9fb8');
    return;
  }
  // Pilvet pöllähtävät kikattaen
  for (i = 0; i < hotair.clouds.length; i++) {
    var cl = hotair.clouds[i];
    if (Math.hypot(wx - cl.u * viewW, py - cl.v * H) < cl.s * H * 1.6) {
      cl.puffT = 0.8;
      hotairGiggle();
      spawnSparkles(cl.u * viewW, cl.v * H, 4, '#ffffff');
      return;
    }
  }
  // Tuulipilvi
  for (i = 0; i < hotair.gates.length; i++) {
    var g = hotair.gates[i];
    if (g.state !== 'gone' && Math.hypot(wx - g.u * viewW, py - hotairGateY(g)) < H * 0.15) {
      g.pokeT = 0.6;
      playNote(330, 0, 0.3, 'sine', 0.2);
      playNote(262, 0.2, 0.4, 'sine', 0.2);
      return;
    }
  }
  propsTap(wx, py);
}
function hotairWishY() { return viewH * (HOTAIR_FEET - 0.19); }
function hotairGiggle() {
  if (hotair.giggleT > 0) return;
  hotair.giggleT = 0.35;
  playNote(1175, 0, 0.07, 'sine', 0.16);
  playNote(1397, 0.07, 0.07, 'sine', 0.16);
  playNote(1175, 0.14, 0.07, 'sine', 0.16);
  playNote(1568, 0.21, 0.1, 'sine', 0.16);
}
// Pudotus korista kyläläiselle. Tyhjästä korista ei putoa mitään: kupla
// heilahtaa ja HUD:n kuva vilkahtaa (näyttää mitä pitää etsiä).
function hotairDrop(vi) {
  var v = hotair.vill[vi], R = viewH * HOTAIR_R, i, falling = 0;
  for (i = 0; i < hotair.drops.length; i++) if (hotair.drops[i].vi === vi && hotair.drops[i].state === 'fall') falling++;
  if (v.got + falling >= v.n) return;
  if (hotair.inv[v.kind] <= 0) {
    v.shake = 0.5;
    hotair.invBump[v.kind] = 0.8;
    playNote(330, 0, 0.12, 'triangle', 0.15);
    playNote(294, 0.12, 0.16, 'triangle', 0.15);
    return;
  }
  hotair.inv[v.kind]--;
  hotair.dropHint = true;
  hotair.drops.push({
    kind: v.kind, vi: vi, u: hotair.x, v: (hotairBasketY() + R * 0.1) / viewH, vv: 0.05, state: 'fall', t: 0,
    home: Math.abs(v.u - hotair.x) * viewW < viewW * 0.32, u0: 0, v0: 0
  });
  playNote(784, 0, 0.1, 'triangle', 0.2);
  playNote(587, 0.08, 0.15, 'triangle', 0.2);
}

// ---------- Päivitys ----------
function updateHotair(dt) {
  var busy, i, it, W = viewW;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (!hotair.built) return;
  busy = puzzleBusy();
  if (!holding) hotair.noSteer = false;
  if (hotair.hudBump > 0) hotair.hudBump -= dt;
  if (hotair.waveT > 0) hotair.waveT -= dt;
  if (hotair.boostT > 0) hotair.boostT -= dt;
  if (hotair.giggleT > 0) hotair.giggleT -= dt;
  if (hotair.rainbowT > 0) hotair.rainbowT -= dt;
  for (i = 0; i < HOTAIR_KINDS.length; i++) if (hotair.invBump[HOTAIR_KINDS[i]] > 0) hotair.invBump[HOTAIR_KINDS[i]] -= dt;
  for (i = 0; i < hotair.items.length; i++) {
    it = hotair.items[i];
    it.ph += dt;
    if (it.got && it.fly < 1) it.fly = Math.min(1, it.fly + dt / 0.45);
  }
  for (i = 0; i < hotair.clouds.length; i++) if (hotair.clouds[i].puffT > 0) hotair.clouds[i].puffT -= dt;
  for (i = 0; i < hotair.gates.length; i++) if (hotair.gates[i].pokeT > 0) hotair.gates[i].pokeT -= dt;
  hotairUpdateSheep(dt);
  hotairUpdateFriends(dt);
  hotairUpdateVillagers(dt);
  hotairUpdateDrops(dt);
  hotairUpdateGifts(dt);
  hotairUpdateSecret(dt);
  if (!busy && !celebrating) {
    hotair.t += dt;
    hotairUpdateWind(dt);
    hotairSteer(dt);
    hotairCollide();
    hotairUpdateGates(dt);
    hotairUpdateLanding(dt);
  }
  hotair.cam = hotair.x * W - W * HOTAIR_SX;
  princess.x = hotairBX();
  princess.y = hotairBasketY();
}

// Tuuli: tasainen eteneminen; hiljenee toiveen esittäjän kohdalla ja niityn
// tasalla, pysähtyy unisen tuulipilven eteen ja juhlakentälle.
function hotairUpdateWind(dt) {
  var x = hotair.x, tv = HOTAIR_V, stop = HOTAIR_END, i, g, v, d, lim, low;
  if (hotair.state === 'ground' || hotair.state === 'land' || hotair.state === 'landed') {
    hotair.vx = 0;
    return;
  }
  for (i = 0; i < hotair.gates.length; i++) {
    g = hotair.gates[i];
    if ((g.state === 'wait' || g.state === 'ask') && g.u - HOTAIR_GATE_STOP < stop) stop = g.u - HOTAIR_GATE_STOP;
  }
  for (i = 0; i < hotair.vill.length; i++) {
    v = hotair.vill[i];
    if (v.state === 'wish' && v.u - x > -0.25 && v.u - x < 0.35) tv = Math.min(tv, HOTAIR_V * 0.55);
  }
  low = hotair.y > hotairYMax() - 0.04;
  if (low) tv = Math.min(tv, HOTAIR_V * 0.6);
  if (hotair.boostT > 0) tv *= 1 + hotair.boostT * 0.9;
  // Lähtö kiihtyy pehmeästi
  d = stop - x;
  tv = Math.min(tv, Math.max(0.008, Math.sqrt(2 * HOTAIR_DEC * Math.max(0, d))));
  lim = (tv < hotair.vx ? HOTAIR_DEC * 2 : HOTAIR_ACC) * dt;
  hotair.vx += Math.max(-lim, Math.min(lim, tv - hotair.vx));
  hotair.x += hotair.vx * dt;
  if (hotair.x >= stop - 0.002) {
    hotair.x = stop;
    hotair.vx = 0;
    if (stop >= HOTAIR_END - 1e-6) {
      hotair.state = 'land';
      hotair.landT = 0;
      hotair.idleT = 0;
    } else {
      for (i = 0; i < hotair.gates.length; i++) {
        g = hotair.gates[i];
        if (g.state === 'wait' && Math.abs(g.u - HOTAIR_GATE_STOP - stop) < 1e-6) { g.state = 'ask'; g.t = 0; playNote(392, 0, 0.3, 'sine', 0.2); }
      }
    }
  }
}

// Korkeus: sormi = kohde, jousi + vaimennus, enimmäisnopeus. Ilman sormea
// pallo leijuu (nopeus vaimenee). Lyhyt napautus (alle 0,08 s) ei ohjaa.
function hotairSteer(dt) {
  var ymax = hotairYMax(), ty = null, vmax = HOTAIR_VMAX * viewW / viewH, a, steer;
  if (hotair.state === 'landed') { hotair.vy = 0; hotair.y = ymax; hotair.burn = 0; return; }
  steer = holding && !hotair.noSteer && ((globalT - holdStartG) > 0.08 || holdMoved);
  if (steer) {
    // Kohde saa olla hieman maan alla, jotta kori todella koskettaa niittyä
    ty = Math.max(HOTAIR_YMIN, Math.min(ymax + 0.03, lastPY / viewH));
    hotair.idleT = 0;
    hotair.autoLift = false;
    if (Math.abs(ty - hotair.y) > 0.05) hotair.steered = true;
    if (hotair.state === 'ground') {
      if (ty < hotair.y - 0.02) { hotair.state = 'fly'; hotairLiftoff(); } else ty = null;
    }
  } else {
    hotair.idleT += dt;
    if (hotair.state === 'ground' && hotair.t > 4) { hotair.state = 'fly'; hotair.autoLift = true; hotairLiftoff(); }
    if (hotair.autoLift) {
      ty = HOTAIR_CRUISE;
      if (Math.abs(hotair.y - HOTAIR_CRUISE) < 0.01 && Math.abs(hotair.vy) < 0.02) hotair.autoLift = false;
    } else if (hotair.state === 'land' && hotair.idleT > 2.5) {
      // Juhlakentällä pallo laskeutuu itsestään, jos sormi ei ohjaa
      ty = ymax + 0.05;
      vmax = 0.12;
    }
  }
  if (hotair.state === 'ground') { hotair.vy = 0; hotair.y = ymax; return; }
  a = ty !== null ? HOTAIR_K * (ty - hotair.y) - HOTAIR_C * hotair.vy : -2.5 * hotair.vy;
  hotair.vy += a * dt;
  hotair.vy = Math.max(-vmax, Math.min(vmax, hotair.vy));
  hotair.y += hotair.vy * dt;
  if (hotair.y < HOTAIR_YMIN) { hotair.y = HOTAIR_YMIN; hotair.vy = Math.max(0, hotair.vy); }
  if (hotair.y > ymax) {
    hotair.y = ymax;
    if (hotair.vy > 0.05) playNote(196, 0, 0.12, 'triangle', 0.15);
    hotair.vy = Math.min(0, hotair.vy);
  }
  hotair.burn += ((hotair.vy < -0.04 ? 1 : 0) - hotair.burn) * Math.min(1, dt * 8);
}
function hotairLiftoff() {
  playNote(262, 0, 0.3, 'triangle', 0.25);
  playNote(392, 0.15, 0.35, 'triangle', 0.25);
  spawnSparkles(hotairBX(), viewH * HOTAIR_GROUND, 8, '#fff4c8');
}

// Keräys ja ystävälliset kosketukset
function hotairCollide() {
  var H = viewH, R = H * HOTAIR_R, bx = hotairBX(), by = hotairBY(), ky = hotairBasketY(), i, it, p, r, cl, d, sh;
  if (hotair.state === 'ground') return;
  for (i = 0; i < hotair.items.length; i++) {
    it = hotair.items[i];
    if (it.got) continue;
    p = hotairItemPos(it);
    if (Math.abs(p.x - bx) > R * 2.5) continue;
    r = hotairItemR(it.kind);
    if (Math.hypot(p.x - bx, p.y - by) < R * 1.05 + r || Math.hypot(p.x - bx, p.y - ky) < R * 0.75 + r ||
        (Math.abs(p.x - bx) < R * 0.6 && p.y > by + R * 0.9 && p.y < by + R * HOTAIR_BOT)) {
      hotairCollect(it, p);
    }
  }
  for (i = 0; i < hotair.clouds.length; i++) {
    cl = hotair.clouds[i];
    d = Math.hypot(cl.u * viewW - bx, cl.v * H - by);
    if (cl.sheep >= 0) {
      sh = hotair.sheep[cl.sheep];
      if (sh.state === 'cloud' && d < R * 1.4) hotairSheepHop(sh, cl);
    }
    if (d < R + cl.s * H * 1.3) {
      if (!cl.inside) { cl.inside = true; cl.puffT = 0.8; hotairGiggle(); spawnSparkles(cl.u * viewW, cl.v * H, 4, '#ffffff'); }
    } else if (d > R + cl.s * H * 1.6) {
      cl.inside = false;
    }
  }
  for (i = 0; i < hotair.friends.length; i++) {
    var f = hotair.friends[i];
    if (f.state === 'wait' && Math.abs(f.u * viewW - bx) < H * 0.14 && by + R * HOTAIR_BOT > H * (HOTAIR_GROUND - 0.035)) {
      f.state = 'hop';
      f.t = 0;
      f.x0 = f.u * viewW;
      f.y0 = H * HOTAIR_GROUND;
      hotair.friendN++;
      trainAnimalSound(f.kind);
      playNote(988, 0.2, 0.15, 'triangle', 0.2);
    }
  }
}
function hotairCollect(it, p) {
  it.got = true;
  it.fly = 0;
  it.fx = p.x;
  it.fy = p.y;
  if (it.kind === 'star') {
    it.fly = 1;
    hotair.starN++;
    hotair.hudBump = 0.35;
    soundStar(Math.min(14, hotair.starN % 15));
    artPop(p.x, p.y, viewH * 0.05, '#ffe27a', 'ring');
    spawnSparkles(p.x, p.y, 6, '#ffe27a');
  } else if (it.kind === 'butterfly') {
    it.fly = 1;
    hotair.bfly++;
    playNote(1319, 0, 0.1, 'sine', 0.2);
    playNote(1568, 0.08, 0.12, 'sine', 0.2);
    spawnSparkles(p.x, p.y, 5, '#ff9fd8');
  } else {
    hotair.inv[it.kind]++;
    hotair.invBump[it.kind] = 0.5;
    playNote(it.kind === 'apple' ? 659 : (it.kind === 'flower' ? 784 : 880), 0, 0.15, 'triangle', 0.25);
    playNote(it.kind === 'apple' ? 988 : (it.kind === 'flower' ? 1175 : 1319), 0.1, 0.2, 'triangle', 0.25);
    artPop(p.x, p.y, viewH * 0.04, it.kind === 'apple' ? '#ff6a5a' : (it.col || '#ffffff'), 'ring');
    spawnSparkles(p.x, p.y, 5, it.kind === 'apple' ? '#ff6a5a' : it.col);
  }
}
function hotairSheepHop(sh, cl) {
  sh.state = 'hop';
  sh.t = 0;
  sh.x0 = cl.u * viewW;
  sh.y0 = cl.v * viewH;
  sh.seat = hotair.sheepN;
  hotair.sheepN++;
  cl.puffT = 0.8;
  trainAnimalSound('sheep');
  spawnSparkles(sh.x0, sh.y0, 8, '#ffffff');
  if (hotair.sheepN === hotair.sheep.length) {
    // Kultainen pallo
    hotair.gold = true;
    for (var i = 0; i < 6; i++) playNote(1047 * Math.pow(1.122, i), 0.5 + i * 0.08, 0.25, 'sine', 0.25);
    spawnSparkles(hotairBX(), hotairBY(), 24, '#ffd24f');
    artPop(hotairBX(), hotairBY(), viewH * HOTAIR_R * 2, '#ffd24f', 'burst');
  }
}
// Lampaan istumapaikka kuoren päällä (seat 0–5)
function hotairSeatPos(seat) {
  var R = viewH * HOTAIR_R, a = -0.8 + seat * 0.32;
  return { x: hotairBX() + Math.sin(a) * R * 0.95, y: hotairBY() - Math.cos(a) * R * 1.05 };
}
function hotairUpdateSheep(dt) {
  var i, sh;
  for (i = 0; i < hotair.sheep.length; i++) {
    sh = hotair.sheep[i];
    if (sh.state === 'hop') {
      sh.t += dt / 0.7;
      if (sh.t >= 1) { sh.state = 'ride'; playNote(1047 + sh.seat * 60, 0, 0.12, 'triangle', 0.2); }
    }
  }
}
// Maaystävät heiluttavat, kun pallo lähestyy; kyydissä ne kurkkaavat korista
function hotairUpdateFriends(dt) {
  var i, f;
  for (i = 0; i < hotair.friends.length; i++) {
    f = hotair.friends[i];
    f.t += dt;
    if (f.state === 'hop' && f.t >= 0.6) { f.state = 'ride'; spawnSparkles(hotairBX(), hotairBasketY(), 6, '#ffe27a'); }
  }
}
function hotairUpdateVillagers(dt) {
  var i, v, dx, tgt, k, d;
  for (i = 0; i < hotair.vill.length; i++) {
    v = hotair.vill[i];
    v.t += dt;
    if (v.shake > 0) v.shake -= dt;
    if (v.happyT > 0) v.happyT -= dt;
    if (v.catchT > 0) v.catchT -= dt;
    dx = v.u - hotair.x;
    if (v.state === 'wait' && dx < 0.75 && hotair.state !== 'ground') {
      v.state = 'wish';
      playNote(659, 0, 0.12, 'triangle', 0.2);
      playNote(784, 0.14, 0.18, 'triangle', 0.2);
    } else if (v.state === 'wish' && dx < -0.45) {
      v.state = 'bye';
    }
    // Kyläläinen juoksee putoavan tavaran alle (enintään 0,09 × viewW)
    tgt = 0;
    for (k = 0; k < hotair.drops.length; k++) {
      d = hotair.drops[k];
      if (d.vi === i && d.state === 'fall') tgt = Math.max(-0.09, Math.min(0.09, d.u - v.u));
    }
    v.off += Math.max(-0.12 * dt, Math.min(0.12 * dt, tgt - v.off));
  }
}
function hotairUpdateDrops(dt) {
  var i, d, v, vx, k, bx, by;
  for (i = hotair.drops.length - 1; i >= 0; i--) {
    d = hotair.drops[i];
    d.t += dt;
    v = hotair.vill[d.vi];
    if (d.state === 'fall') {
      d.vv = Math.min(0.34, d.vv + 0.9 * dt);
      d.v += d.vv * dt;
      vx = v.u + v.off;
      if (d.home) d.u += Math.max(-0.2, Math.min(0.2, (vx - d.u) * 2.2)) * dt;
      if (d.v >= HOTAIR_FEET - 0.11 && d.v < HOTAIR_FEET - 0.04 && Math.abs(vx - d.u) * viewW < viewH * 0.08) {
        hotairCaught(d, v);
        hotair.drops.splice(i, 1);
        continue;
      }
      if (d.v >= HOTAIR_FEET + 0.01) {
        // Ohi: pomppaa nurmelle ja lentää takaisin koriin
        d.state = 'back';
        d.t = 0;
        d.u0 = d.u;
        d.v0 = HOTAIR_FEET + 0.01;
        playNote(262, 0, 0.1, 'triangle', 0.15);
        spawnSparkles(d.u * viewW, d.v0 * viewH, 4, '#ffffff');
      }
    } else if (d.state === 'back') {
      k = Math.min(1, d.t / 1.0);
      if (k >= 1) {
        hotair.inv[d.kind]++;
        hotair.invBump[d.kind] = 0.5;
        playNote(880, 0, 0.1, 'sine', 0.18);
        spawnSparkles(hotairBX(), hotairBasketY(), 4, '#ffe27a');
        hotair.drops.splice(i, 1);
        continue;
      }
      bx = hotairBX() / viewW; by = hotairBasketY() / viewH;
      d.u = d.u0 + (bx - d.u0) * easeInOutSine(k);
      d.v = d.v0 + (by - d.v0) * easeInOutSine(k) - Math.sin(k * Math.PI) * 0.12;
    }
  }
}
function hotairCaught(d, v) {
  var i, x = (v.u + v.off) * viewW, y = viewH * (HOTAIR_FEET - 0.1);
  v.got++;
  v.catchT = 0.6;
  playNote(784, 0, 0.12, 'triangle', 0.25);
  playNote(1047, 0.1, 0.18, 'triangle', 0.25);
  spawnSparkles(x, y, 8, '#ffe27a');
  if (v.got >= v.n) {
    v.state = 'happy';
    v.happyT = 2;
    hotair.wishN++;
    trainHearts(x, y - viewH * 0.06, 3);
    for (i = 0; i < 3; i++) hotair.gifts.push({ x0: x, y0: y - viewH * 0.05, t: -i * 0.25, dur: 1.0 });
    playNote(1047, 0.3, 0.2, 'triangle', 0.25);
    playNote(1319, 0.42, 0.3, 'triangle', 0.25);
  }
}
// Lahjatähdet lentävät kyläläiseltä (tai lentävältä pupulta) koriin
function hotairUpdateGifts(dt) {
  var i, g;
  for (i = hotair.gifts.length - 1; i >= 0; i--) {
    g = hotair.gifts[i];
    g.t += dt;
    if (g.t >= g.dur) {
      hotair.starN++;
      hotair.hudBump = 0.35;
      soundStar(Math.min(14, hotair.starN % 15));
      spawnSparkles(hotairBX(), hotairBasketY(), 5, '#ffe27a');
      hotair.gifts.splice(i, 1);
    }
  }
}
function hotairGiftPos(g) {
  var k = easeInOutSine(Math.max(0, g.t) / g.dur), bx = hotairBX(), by = hotairBasketY() - viewH * 0.02;
  return { x: g.x0 + (bx - g.x0) * k, y: g.y0 + (by - g.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12 };
}
// Yllätys: lentävä pupu ylittää taivaan ja pudottaa viisi tähteä koriin
function hotairUpdateSecret(dt) {
  var s = hotair.secret, x;
  if (!s) return;
  s.t += dt;
  x = -viewW * 0.1 + s.t * viewW * 0.22;
  if (s.drops < 5 && s.t > 1.0 + s.drops * 0.7) {
    s.drops++;
    hotair.gifts.push({ x0: x + hotair.cam, y0: viewH * 0.2, t: 0, dur: 1.2 });
    playNote(1319 + s.drops * 80, 0, 0.1, 'sine', 0.2);
  }
  if (x > viewW * 1.15) hotair.secret = null;
}

// Unisen tuulipilven tehtävä: herättyään pilvi nousee pois ja puuska vie eteenpäin
function hotairUpdateGates(dt) {
  var i, g, tk;
  for (i = 0; i < hotair.gates.length; i++) {
    g = hotair.gates[i];
    g.t += dt;
    if (g.state === 'ask') {
      tk = tasks[g.task];
      if (tk.opened) {
        g.state = 'blow';
        g.t = 0;
        hotair.boostT = 1.4;
        playNote(523, 0, 0.2, 'triangle', 0.3);
        playNote(784, 0.15, 0.3, 'triangle', 0.3);
        spawnSparkles(g.u * viewW, hotairGateY(g), 16, '#ffffff');
      } else if (g.t > 0.7 && !activeTask) {
        taskStart(tk);
      }
    } else if (g.state === 'blow' && g.t > 3) {
      g.state = 'gone';
    }
  }
}
function hotairGateY(g) {
  var lift = g.state === 'blow' ? easeInOutSine(g.t / 3) * 0.6 : (g.state === 'gone' ? 0.6 : 0);
  return viewH * (0.45 - lift) + Math.sin(globalT * 0.8 + g.u) * viewH * 0.01;
}
// Laskeutuminen juhlakentälle
function hotairUpdateLanding(dt) {
  var i;
  if (hotair.state === 'land' && hotair.y >= hotairYMax() - 0.003) {
    hotair.state = 'landed';
    hotair.landT = 0;
    playNote(196, 0, 0.2, 'triangle', 0.25);
    spawnSparkles(hotairBX(), viewH * HOTAIR_GROUND, 14, '#fff4c8');
    for (i = 0; i < 5; i++) playNote(523 * Math.pow(1.122, i * 2), 0.3 + i * 0.1, 0.25, 'triangle', 0.22);
    if (hotair.gold) spawnSparkles(hotairBX(), hotairBY(), 24, '#ffd24f');
  }
  if (hotair.state === 'landed') {
    hotair.landT += dt;
    if (hotair.landT > 2.4 && !hotair.won) { hotair.won = true; startCelebration(); }
  }
}

// ---------- Piirto: tausta ----------
function renderHotairBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h * 0.74);
  g.addColorStop(0, '#62b8ff');
  g.addColorStop(0.7, '#bfe6ff');
  g.addColorStop(1, '#eaf8ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.85, h * 0.15, h * 0.065, 1, '#fff4c8', '#fffdf0', '#ffd45a');
}
// Parallaksi: kohde maailmapisteessä wx näkyy ruudulla nopeudella speed
function hotairPar(wx, speed) { return viewW * 0.5 + (wx - hotair.cam - viewW * 0.5) * speed; }
function hotairDrawHills(c, speed, y0, amp, color, wl, seed) {
  var W = viewW, h = viewH, off = hotair.cam * speed, x, step = W / 28, wx;
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
function hotairDrawSky(c) {
  var W = viewW, h = viewH, eve = hotairEvening(), g, i, x, k, haze = '#dff3ff';
  if (eve > 0) {
    g = c.createLinearGradient(0, 0, 0, h * 0.75);
    g.addColorStop(0, 'rgba(120,90,200,' + (eve * 0.45) + ')');
    g.addColorStop(0.6, 'rgba(255,150,120,' + (eve * 0.42) + ')');
    g.addColorStop(1, 'rgba(255,200,140,' + (eve * 0.38) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, W, h * 0.76);
    haze = artMix('#dff3ff', '#ffc8a0', eve * 0.6);
  }
  // Sateenkaari kukkuloiden yllä (hidas parallaksi)
  x = hotairPar(10.4 * W, 0.35);
  if (x > -h * 0.8 && x < W + h * 0.8) hotairDrawRainbow(c, x, h * 0.76, h * 0.5, 0.5);
  // Yllätyssateenkaari koko taivaalle
  if (hotair.rainbowT > 0) {
    k = Math.min(1, (9 - hotair.rainbowT) * 1.5, hotair.rainbowT * 0.5);
    hotairDrawRainbow(c, W * 0.55, h * 0.8, h * 0.62, 0.7 * k);
  }
  hotairDrawHills(c, 0.08, 0.66, 0.12, artMix('#7fbf8a', haze, 0.55 + eve * 0.1), 1.6, 0.3);
  hotairDrawHills(c, 0.22, 0.71, 0.08, artMix('#6cb860', haze, 0.32), 1.1, 1.7);
  // Keskikerroksen puurivi ja kaukaiset talot
  var off = hotair.cam * 0.22, k0 = Math.floor(off / (W * 0.13)) - 1, kk, ty, s;
  c.fillStyle = artMix('#4f9a4a', haze, 0.3);
  for (kk = k0; kk < k0 + 11; kk++) {
    if (hotairHash(kk) < 0.45) continue;
    x = kk * W * 0.13 - off + hotairHash(kk + 9) * W * 0.06;
    ty = h * (0.69 + hotairHash(kk + 3) * 0.02);
    s = h * (0.025 + hotairHash(kk + 5) * 0.015);
    c.fillRect(x - s * 0.12, ty - s * 0.6, s * 0.24, s * 0.7);
    c.beginPath(); c.arc(x, ty - s, s * 0.75, 0, Math.PI * 2); c.fill();
  }
}
function hotairDrawRainbow(c, x, y, r, alpha) {
  var i, w = r * 0.035;
  if (alpha <= 0.01) return;
  c.globalAlpha = alpha;
  c.lineWidth = w;
  for (i = 0; i < 6; i++) {
    c.strokeStyle = maneColors[i];
    c.beginPath(); c.arc(x, y, r - i * w, Math.PI, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 1;
}

// ---------- Piirto: maisema (maailmakoordinaatit, kamera käännetty) ----------
function hotairDrawGround(c) {
  var W = viewW, h = viewH, x0 = hotair.cam - 4, x1 = hotair.cam + W + 4, g, k, x, th, col, i, u0, u1;
  g = c.createLinearGradient(0, h * 0.73, 0, h);
  g.addColorStop(0, '#a8de80');
  g.addColorStop(1, '#6fbf4f');
  c.fillStyle = g;
  c.fillRect(x0, h * 0.735, x1 - x0, h * 0.27);
  // Pellot: raidalliset tilkut takarinteessä
  for (k = Math.floor(x0 / (W * 0.5)) - 1; k <= Math.floor(x1 / (W * 0.5)); k++) {
    x = k * W * 0.5;
    th = hotairThemeAt((x + W * 0.25) / W);
    if (th !== 'fields' && th !== 'village' && th !== 'hills') continue;
    col = ['#f2d36a', '#c9e27a', '#d8b07a', '#e8e07a'][((k % 4) + 4) % 4];
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + W * 0.02, h * 0.775); c.lineTo(x + W * 0.06, h * 0.74); c.lineTo(x + W * 0.47, h * 0.74); c.lineTo(x + W * 0.45, h * 0.775);
    c.closePath(); c.fill();
    c.strokeStyle = artShade(col, -0.18);
    c.lineWidth = Math.max(1, h * 0.003);
    for (i = 1; i < 3; i++) {
      c.beginPath(); c.moveTo(x + W * (0.02 + i * 0.013), h * (0.775 - i * 0.012)); c.lineTo(x + W * (0.455 - i * 0.002), h * (0.775 - i * 0.012)); c.stroke();
    }
  }
  // Metsän pohja tummempi
  u0 = 6.9 * W; u1 = 9.0 * W;
  if (u1 > x0 && u0 < x1) {
    c.fillStyle = 'rgba(40,110,50,0.18)';
    c.fillRect(Math.max(x0, u0), h * 0.735, Math.min(x1, u1) - Math.max(x0, u0), h * 0.27);
  }
  // Tie kylässä ja juhlakentällä
  c.fillStyle = '#e8cf98';
  for (k = 0; k < 2; k++) {
    u0 = (k === 0 ? 0 : 11.6) * W; u1 = (k === 0 ? 3.0 : 14.5) * W;
    if (u1 < x0 || u0 > x1) continue;
    roundRect(c, Math.max(x0 - 20, u0), h * 0.835, Math.min(x1 + 20, u1) - Math.max(x0 - 20, u0), h * 0.035, h * 0.015);
    c.fill();
  }
  // Järvi
  u0 = HOTAIR_LAKE[0] * W; u1 = HOTAIR_LAKE[1] * W;
  if (u1 > x0 && u0 < x1) {
    var mx = (u0 + u1) / 2, rx = (u1 - u0) / 2;
    c.beginPath(); c.ellipse(mx, h * 0.865, rx + h * 0.02, h * 0.105, 0, 0, Math.PI * 2);
    c.fillStyle = '#8fcf6a'; c.fill();
    c.beginPath(); c.ellipse(mx, h * 0.865, rx, h * 0.09, 0, 0, Math.PI * 2);
    g = c.createLinearGradient(0, h * 0.78, 0, h * 0.96);
    g.addColorStop(0, '#9fdcff');
    g.addColorStop(1, '#4aa0e0');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = Math.max(1, h * 0.003);
    for (i = 0; i < 6; i++) {
      x = mx + (hotairHash(i + 40) - 0.5) * rx * 1.4 + Math.sin(globalT * 0.7 + i) * h * 0.01;
      c.beginPath(); c.moveTo(x - h * 0.03, h * (0.82 + i * 0.022)); c.lineTo(x + h * 0.03, h * (0.82 + i * 0.022)); c.stroke();
    }
    // Kaislat
    for (i = 0; i < 6; i++) {
      x = (i < 3 ? u0 + h * 0.02 : u1 - h * 0.02) + (i % 3) * h * 0.025 * (i < 3 ? 1 : -1);
      artLimb(c, x, h * 0.88, x + Math.sin(globalT + i) * h * 0.005, h * 0.81, h * 0.006, '#5a9a3a', false);
      artBlob(c, x + Math.sin(globalT + i) * h * 0.005, h * 0.815, h * 0.006, h * 0.016, '#8a5a30', { line: false });
    }
  }
  // Kukkulat: pyöreät mäet takarinteessä
  for (k = Math.floor(x0 / (W * 0.4)) - 1; k <= Math.floor(x1 / (W * 0.4)) + 1; k++) {
    x = k * W * 0.4 + hotairHash(k + 70) * W * 0.15;
    if (hotairThemeAt(x / W) !== 'hills') continue;
    artBlob(c, x, h * 0.775, W * 0.16, h * 0.06, '#8fd46a', { line: false });
  }
}
// Metsän puurivi (ei tökättävä; pöllöpuu ja omenapuut ovat koristeita)
function hotairDrawForest(c) {
  var W = viewW, h = viewH, x0 = hotair.cam - h * 0.2, x1 = hotair.cam + W + h * 0.2, step = h * 0.11, k, x, s, cy, col;
  for (k = Math.floor(x0 / step); k <= Math.floor(x1 / step); k++) {
    x = k * step + hotairHash(k + 200) * step * 0.5;
    if (hotairThemeAt(x / W) !== 'forest' || Math.abs(x - 7.95 * W) < h * 0.12) continue;
    s = h * (0.07 + hotairHash(k + 300) * 0.04);
    cy = h * 0.77 - s * 1.2;
    col = hotairHash(k + 400) < 0.5 ? '#3f9a45' : '#4faa50';
    artRoundRect(c, x - s * 0.12, cy, s * 0.24, h * 0.77 - cy, s * 0.06, '#8a5a30', { line: false });
    if (hotairHash(k + 500) < 0.4) {
      // Kuusi
      c.beginPath(); c.moveTo(x - s * 0.7, cy + s * 0.3); c.lineTo(x, cy - s * 1.3); c.lineTo(x + s * 0.7, cy + s * 0.3); c.closePath();
      artFillPath(c, '#2f8a4a', cy - s * 1.3, cy + s * 0.3, s * 0.5, { line: false });
    } else {
      artCircle(c, x, cy - s * 0.3, s * 0.7, col, { line: false, hi: 0.2 });
    }
  }
}
// Kukat varsineen (kerättävät kukkapäät piirretään erikseen)
function hotairDrawStems(c) {
  var i, it, x, h = viewH;
  for (i = 0; i < hotair.items.length; i++) {
    it = hotair.items[i];
    if (it.kind !== 'flower') continue;
    x = it.u * viewW;
    if (x < hotair.cam - h * 0.1 || x > hotair.cam + viewW + h * 0.1) continue;
    artLimb(c, x, h * 0.8, x + Math.sin(globalT + i) * h * 0.004, it.v * h + h * 0.01, h * 0.008, '#4faa3a', '#2a6a2a');
    artBlob(c, x - h * 0.012, h * 0.76, h * 0.016, h * 0.007, '#5fbf55', { rot: 0.5, lineColor: '#2a6a2a' });
    if (it.got) artCircle(c, x, it.v * h + h * 0.01, h * 0.008, '#8fd46a', { lineColor: '#2a6a2a' });
  }
}
// Juhlakenttä: viirinauhat, lyhdyt, laskeutumisalue ja juhlaväki
function hotairDrawFest(c) {
  var W = viewW, h = viewH, ex = HOTAIR_END * W, i, x, y, eve = hotairEvening(), cheer = hotair.state === 'landed', hop;
  if (ex - hotair.cam > W + h * 1.2) return;
  // Laskeutumisalue: ruutuliina ja kukkarengas
  artBlob(c, ex, h * (HOTAIR_GROUND + 0.005), h * 0.13, h * 0.03, '#fff4f4', { lineColor: '#c84a5a' });
  c.fillStyle = 'rgba(232,90,106,0.55)';
  for (i = -2; i <= 2; i++) c.fillRect(ex + i * h * 0.045 - h * 0.012, h * (HOTAIR_GROUND - 0.015), h * 0.024, h * 0.04);
  for (i = 0; i < 8; i++) drawFlower(c, ex + Math.cos(i / 8 * Math.PI * 2) * h * 0.16, h * (HOTAIR_GROUND + 0.005) + Math.sin(i / 8 * Math.PI * 2) * h * 0.038, h * 0.007, HOTAIR_FLOWER_COLS[i % 4]);
  // Viirinauhat ja lyhdyt kahden salon välissä
  for (i = 0; i < 2; i++) {
    x = ex + (i === 0 ? -1 : 1) * W * 0.32;
    artLimb(c, x, h * 0.8, x, h * 0.55, h * 0.008, '#c8945a', '#6a4020');
  }
  c.strokeStyle = '#8a6a4a';
  c.lineWidth = Math.max(1, h * 0.002);
  c.beginPath(); c.moveTo(ex - W * 0.32, h * 0.56); c.quadraticCurveTo(ex, h * 0.64, ex + W * 0.32, h * 0.56); c.stroke();
  for (i = 1; i < 12; i++) {
    var k = i / 12, px = ex - W * 0.32 + W * 0.64 * k, py = h * 0.56 + 4 * k * (1 - k) * h * 0.04;
    if (i % 2) {
      c.beginPath(); c.moveTo(px - h * 0.012, py); c.lineTo(px + h * 0.012, py); c.lineTo(px, py + h * 0.03); c.closePath();
      artFillPath(c, HOTAIR_BAL_COLS[i % 5], py, py + h * 0.03, h * 0.01, { line: false });
    } else {
      if (eve > 0.3) artGlow(c, px, py + h * 0.02, h * 0.04, '#ffe890', 0.6 * eve);
      artRoundRect(c, px - h * 0.009, py + h * 0.005, h * 0.018, h * 0.026, h * 0.006, eve > 0.3 ? '#ffe890' : '#ffb84f', { lineColor: '#a8700a' });
    }
  }
  // Juhlaväki: kyläläiset ja eläimet hyppivät laskeutuessa
  for (i = 0; i < 4; i++) {
    x = ex + [-0.26, -0.17, 0.2, 0.28][i] * W;
    hop = cheer ? Math.abs(Math.sin(hotair.landT * 6 + i)) * h * 0.02 : 0;
    hotairDrawPerson(c, x, h * HOTAIR_FEET - hop, h * 0.045, HOTAIR_LOOKS[(i + 1) % 4], cheer ? 1 : 0, cheer, globalT + i);
  }
  hop = cheer ? Math.abs(Math.sin(hotair.landT * 7)) * h * 0.02 : 0;
  trainDrawAnimal(c, 'pig', ex - W * 0.08, h * 0.95 - hop, h * 0.028, { face: 1, t: globalT });
  trainDrawAnimal(c, 'hen', ex + W * 0.1, h * 0.95 - hop, h * 0.025, { face: -1, t: globalT + 1, wave: cheer ? 1 : 0 });
}
// Etualan nurmi ja kukat
function hotairDrawFront(c) {
  var W = viewW, h = viewH, x0 = hotair.cam - h * 0.05, x1 = hotair.cam + W + h * 0.05, step = h * 0.06, k, x, th;
  c.strokeStyle = 'rgba(70,140,60,0.55)';
  c.lineWidth = Math.max(1, h * 0.004);
  c.lineCap = 'round';
  for (k = Math.floor(x0 / step); k <= Math.floor(x1 / step); k++) {
    x = k * step + hotairHash(k + 600) * step;
    th = hotairThemeAt(x / W);
    if (th === 'lake' && x > HOTAIR_LAKE[0] * W - h * 0.05 && x < HOTAIR_LAKE[1] * W + h * 0.05) continue;
    c.beginPath();
    c.moveTo(x - h * 0.01, h); c.lineTo(x - h * 0.014, h * 0.97);
    c.moveTo(x, h); c.lineTo(x, h * 0.962);
    c.moveTo(x + h * 0.01, h); c.lineTo(x + h * 0.014, h * 0.97);
    c.stroke();
    if (hotairHash(k + 700) < 0.3) drawFlower(c, x + h * 0.02, h * 0.975, h * 0.007, HOTAIR_FLOWER_COLS[k & 3]);
  }
}

// ---------- Piirto: hahmot ja esineet ----------
// Kyläläinen: origo jaloissa, s ≈ puolet pituudesta. wave: 1 = vilkuttaa,
// up: kädet ylhäällä (kiinniotto, ilo)
function hotairDrawPerson(c, x, y, s, look, wave, up, t) {
  var line = artShade(look.cloth, -0.45), sw = Math.sin(t * 9) * s * 0.25, hy = -s * 1.85, blink = (t % 3.9) < 0.12;
  artShadow(c, x, y, s * 0.6, s * 0.14, 0.15);
  artLimb(c, x - s * 0.18, y - s * 0.7, x - s * 0.2, y, s * 0.16, '#5a4a6a', '#3a2a4a');
  artLimb(c, x + s * 0.18, y - s * 0.7, x + s * 0.2, y, s * 0.16, '#5a4a6a', '#3a2a4a');
  if (up) {
    artLimb(c, x - s * 0.3, y - s * 1.3, x - s * 0.55, y - s * 2.05 - sw * 0.3, s * 0.15, SKIN, SKIN_LINE);
    artLimb(c, x + s * 0.3, y - s * 1.3, x + s * 0.55, y - s * 2.05 + sw * 0.3, s * 0.15, SKIN, SKIN_LINE);
  } else {
    artLimb(c, x - s * 0.3, y - s * 1.3, x - s * 0.45, y - s * 0.8, s * 0.15, SKIN, SKIN_LINE);
    if (wave) artLimb(c, x + s * 0.3, y - s * 1.3, x + s * 0.6 + sw * 0.4, y - s * 1.95, s * 0.15, SKIN, SKIN_LINE);
    else artLimb(c, x + s * 0.3, y - s * 1.3, x + s * 0.45, y - s * 0.8, s * 0.15, SKIN, SKIN_LINE);
  }
  c.beginPath();
  c.moveTo(x - s * 0.28, y - s * 1.45); c.lineTo(x + s * 0.28, y - s * 1.45); c.lineTo(x + s * 0.45, y - s * 0.6); c.lineTo(x - s * 0.45, y - s * 0.6);
  c.closePath();
  artFillPath(c, look.cloth, y - s * 1.45, y - s * 0.6, s * 0.4, { lineColor: line });
  if (look.hat === 'braids') {
    artCircle(c, x - s * 0.42, y + hy + s * 0.15, s * 0.14, look.hair, {});
    artCircle(c, x + s * 0.42, y + hy + s * 0.15, s * 0.14, look.hair, {});
  }
  artCircle(c, x, y + hy, s * 0.4, SKIN, { lineColor: SKIN_LINE, hi: 0.3 });
  if (look.hat === 'straw') {
    artBlob(c, x, y + hy - s * 0.25, s * 0.62, s * 0.12, '#f2cf6a', { lineColor: '#a8803a' });
    artBlob(c, x, y + hy - s * 0.38, s * 0.3, s * 0.18, '#f2cf6a', { lineColor: '#a8803a' });
    c.fillStyle = '#e85a4a';
    c.fillRect(x - s * 0.3, y + hy - s * 0.32, s * 0.6, s * 0.06);
  } else if (look.hat === 'cap') {
    artBlob(c, x, y + hy - s * 0.25, s * 0.38, s * 0.2, '#4a7ad8', { lineColor: '#2a4a8a' });
    artBlob(c, x + s * 0.32, y + hy - s * 0.18, s * 0.2, s * 0.07, '#4a7ad8', { lineColor: '#2a4a8a' });
  } else if (look.hat === 'bun') {
    artBlob(c, x, y + hy - s * 0.22, s * 0.4, s * 0.2, look.hair, { lineColor: '#a8a0b8' });
    artCircle(c, x, y + hy - s * 0.5, s * 0.16, look.hair, { lineColor: '#a8a0b8' });
  } else {
    artBlob(c, x, y + hy - s * 0.24, s * 0.4, s * 0.18, look.hair, { lineColor: artShade(look.hair, -0.4) });
  }
  artEye(c, x - s * 0.14, y + hy, s * 0.07, 0, blink);
  artEye(c, x + s * 0.14, y + hy, s * 0.07, 0, blink);
  c.strokeStyle = '#8a4a4a';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.arc(x, y + hy + s * 0.1, s * (up ? 0.13 : 0.1), 0.2, Math.PI - 0.2); c.stroke();
  artBlush(c, x - s * 0.24, y + hy + s * 0.1, s * 0.07);
  artBlush(c, x + s * 0.24, y + hy + s * 0.1, s * 0.07);
}
// Kerättävän / toiveen kuva: omena, kukka tai ilmapallo
function hotairDrawThing(c, kind, x, y, r, col) {
  if (kind === 'apple') {
    artLimb(c, x, y - r * 0.7, x + r * 0.1, y - r * 1.05, r * 0.12, '#6a4020', false);
    artBlob(c, x + r * 0.35, y - r * 0.9, r * 0.28, r * 0.13, '#4fae3a', { rot: -0.4, lineColor: '#2a6a2a' });
    artCircle(c, x, y, r * 0.8, '#ff4a4a', { lineColor: '#8a1a1a', hi: 0.45 });
  } else if (kind === 'flower') {
    trainDrawIcon(c, 'flower', x, y, r, col || '#ff7bac');
  } else if (kind === 'balloon') {
    col = col || '#ff6f9a';
    c.strokeStyle = 'rgba(90,70,90,0.7)';
    c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath(); c.moveTo(x, y + r * 0.9); c.quadraticCurveTo(x - r * 0.2, y + r * 1.3, x + r * 0.05, y + r * 1.7); c.stroke();
    artBlob(c, x, y, r * 0.72, r * 0.88, col, { hi: 0.45 });
    c.beginPath(); c.moveTo(x - r * 0.12, y + r * 0.98); c.lineTo(x + r * 0.12, y + r * 0.98); c.lineTo(x, y + r * 0.84); c.closePath();
    artFillPath(c, col, y + r * 0.84, y + r * 0.98, r * 0.1, {});
  }
}
// Pilvilammas: pörröinen valkoinen lammas (trainDrawAnimal) ja pieni kiilto
function hotairDrawSheep(c, x, y, s, face) {
  trainDrawAnimal(c, 'sheep', x, y, s, { face: face, t: globalT + s });
}
function hotairDrawCloud(c, cl) {
  var W = viewW, h = viewH, x = cl.u * W, y = cl.v * h, s = cl.s * h, k = cl.puffT > 0 ? Math.sin(cl.puffT / 0.8 * Math.PI) * 0.12 : 0, sh;
  if (x < hotair.cam - s * 4 || x > hotair.cam + W + s * 4) return;
  c.save();
  c.translate(x, y);
  c.scale(1 + k, 1 - k * 0.6);
  drawCloud(c, 0, 0, s, 0.95);
  c.restore();
  if (cl.sheep >= 0) {
    sh = hotair.sheep[cl.sheep];
    if (sh.state === 'cloud') {
      hotairDrawSheep(c, x - s * 0.1, y + s * 0.15 + Math.sin(globalT * 2 + cl.u) * s * 0.06, s * 0.55, sh.face);
    }
  }
}
function hotairDrawItems(c) {
  var i, it, p, r, x0 = hotair.cam - viewH * 0.1, x1 = hotair.cam + viewW + viewH * 0.1, k, bx, by;
  for (i = 0; i < hotair.items.length; i++) {
    it = hotair.items[i];
    if (it.got) {
      if (it.fly >= 1) continue;
      // Lentää koriin
      k = easeInOutSine(it.fly);
      bx = hotairBX(); by = hotairBasketY();
      p = { x: it.fx + (bx - it.fx) * k, y: it.fy + (by - it.fy) * k - Math.sin(k * Math.PI) * viewH * 0.05 };
      r = hotairItemR(it.kind) * (1 - k * 0.4);
    } else {
      p = hotairItemPos(it);
      r = hotairItemR(it.kind);
    }
    if (p.x < x0 || p.x > x1) continue;
    if (it.kind === 'star') {
      drawStar(c, p.x, p.y + Math.sin(it.ph * 2) * viewH * 0.004, r, Math.sin(it.ph) * 0.2, 0.6);
    } else if (it.kind === 'butterfly') {
      drawButterfly(c, p.x, p.y, r, it.ph, HOTAIR_FLOWER_COLS[i % 4]);
    } else {
      if (!it.got && it.kind !== 'flower') artGlow(c, p.x, p.y, r * 2, '#fff4c8', 0.35);
      hotairDrawThing(c, it.kind, p.x, p.y, r, it.col);
    }
  }
}
// Unisen tuulipilven kasvot: Zzz odottaessa, hymy ja puhallus herättyä
function hotairDrawGate(c, g) {
  var W = viewW, h = viewH, x = g.u * W, y = hotairGateY(g), s = h * 0.075, i, k, awake = g.state === 'blow' || g.state === 'gone', pk = g.pokeT > 0 ? Math.sin(g.pokeT / 0.6 * Math.PI) * 0.08 : 0, a;
  if (x < hotair.cam - s * 4 || x > hotair.cam + W + s * 4) return;
  a = g.state === 'blow' ? Math.max(0, 1 - Math.max(0, g.t - 2) / 1) : (g.state === 'gone' ? 0 : 1);
  if (a <= 0) return;
  c.globalAlpha = a;
  c.save();
  c.translate(x, y);
  c.scale(1 + pk, 1 - pk);
  artUnion(c, function (cc, xx, yy, ss) {
    cc.beginPath();
    cc.arc(xx - ss * 1.2, yy + ss * 0.25, ss * 0.85, 0, Math.PI * 2);
    cc.moveTo(xx + ss * 2.05, yy + ss * 0.25);
    cc.arc(xx + ss * 1.2, yy + ss * 0.25, ss * 0.85, 0, Math.PI * 2);
    cc.moveTo(xx + ss * 1.25, yy - ss * 0.2);
    cc.arc(xx, yy - ss * 0.2, ss * 1.25, 0, Math.PI * 2);
    cc.moveTo(xx + ss * 1.6, yy + ss * 0.6);
    cc.arc(xx, yy + ss * 0.6, ss * 1.6, 0, Math.PI);
  }, 0, 0, s, -s * 1.5, s * 1.4, '#ffffff', { lineColor: '#a8c8e8', shadeTo: '#d8e8fa' });
  if (awake) {
    artEye(c, -s * 0.45, -s * 0.15, s * 0.16, -0.5, false);
    artEye(c, s * 0.45, -s * 0.15, s * 0.16, -0.5, false);
    artBlush(c, -s * 0.85, s * 0.2, s * 0.22);
    artBlush(c, s * 0.85, s * 0.2, s * 0.22);
    c.strokeStyle = '#6a7aa8';
    c.lineWidth = Math.max(1.5, s * 0.07);
    c.beginPath(); c.arc(0, s * 0.18, s * 0.3, 0.2, Math.PI - 0.2); c.stroke();
  } else {
    artEye(c, -s * 0.45, -s * 0.1, s * 0.16, 0, true);
    artEye(c, s * 0.45, -s * 0.1, s * 0.16, 0, true);
    artBlush(c, -s * 0.85, s * 0.2, s * 0.22);
    artBlush(c, s * 0.85, s * 0.2, s * 0.22);
    artBlob(c, 0, s * 0.3, s * 0.12, s * 0.1 + Math.sin(globalT * 2) * s * 0.03, '#8a6a9a', { line: false });
    // Zzz
    c.fillStyle = '#7a8ac8';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (i = 0; i < 3; i++) {
      k = (globalT * 0.5 + i / 3) % 1;
      c.globalAlpha = a * Math.sin(k * Math.PI);
      c.font = 'bold ' + Math.round(s * (0.35 + k * 0.3)) + 'px ' + UI_FONT;
      c.fillText('Z', s * (1.4 + k * 0.6), -s * (1.0 + k * 1.2));
    }
    c.globalAlpha = a;
    c.textBaseline = 'alphabetic';
  }
  c.restore();
  c.globalAlpha = 1;
}
// Puuskan viivat ruudun poikki tehtävän jälkeen (ruutukoordinaatit)
function hotairDrawGust(c) {
  var W = viewW, h = viewH, i, k, x, y, a = Math.min(1, hotair.boostT);
  if (hotair.boostT <= 0) return;
  c.strokeStyle = 'rgba(255,255,255,' + (0.7 * a) + ')';
  c.lineWidth = Math.max(2, h * 0.006);
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    k = (globalT * 0.9 + hotairHash(i + 90)) % 1;
    x = -W * 0.2 + k * W * 1.4;
    y = h * (0.15 + hotairHash(i + 91) * 0.55);
    c.beginPath(); c.moveTo(x - W * 0.12, y); c.quadraticCurveTo(x - W * 0.04, y - h * 0.02, x, y); c.stroke();
  }
}

// Pallo: vaaleanpunaiset ja kermanväriset kaistaleet (kultainen, kun kaikki
// pilvilampaat ovat kyydissä), tähtivyö, köydet, kori, matkustajat ja lampaat.
function hotairDrawBalloon(c) {
  var R = viewH * HOTAIR_R, bx = hotairBX(), by = hotairBY(), i, j, f0, f1, y, w, n = 8, steps = 10, gold = hotair.gold, sw = Math.sin(globalT * 1.3) * 0.025;
  var colA = gold ? '#ffd24f' : '#ff8fb0', colB = gold ? '#fff4c8' : '#fff4f8', line = gold ? '#a8700a' : '#b8507a', rim = by + R * 1.62, bot = by + R * HOTAIR_BOT, lw = Math.max(1.5, R * 0.045);
  // Kumppaniperhoset pallon takana (puolet) ja edessä (puolet)
  hotairDrawCompanions(c, bx, by, R, false);
  // Lampaat hyppäämässä
  for (i = 0; i < hotair.sheep.length; i++) {
    var sh = hotair.sheep[i];
    if (sh.state !== 'hop') continue;
    var sp = hotairSeatPos(sh.seat), k = easeInOutSine(sh.t);
    hotairDrawSheep(c, sh.x0 + (sp.x - sh.x0) * k, sh.y0 + (sp.y - sh.y0) * k - Math.sin(k * Math.PI) * viewH * 0.06, R * 0.22, sh.face);
  }
  if (hotair.state === 'ground' || hotair.state === 'landed' || hotair.y > hotairYMax() - 0.03) artShadow(c, bx, viewH * HOTAIR_GROUND, R * 0.9, R * 0.2, 0.2);
  c.save();
  c.translate(bx, by + R * 1.0);
  c.rotate(sw);
  c.translate(-bx, -(by + R * 1.0));
  // Köydet
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(1.2, R * 0.03);
  c.beginPath();
  c.moveTo(bx - R * 0.42, by + R * 1.0); c.lineTo(bx - R * 0.58, rim);
  c.moveTo(bx + R * 0.42, by + R * 1.0); c.lineTo(bx + R * 0.58, rim);
  c.moveTo(bx - R * 0.15, by + R * 1.12); c.lineTo(bx - R * 0.2, rim);
  c.moveTo(bx + R * 0.15, by + R * 1.12); c.lineTo(bx + R * 0.2, rim);
  c.stroke();
  // Poltin
  if (hotair.burn > 0.05) {
    artGlow(c, bx, by + R * 1.2, R * 0.35 * hotair.burn, '#ffb040', 0.8);
    artBlob(c, bx, by + R * 1.15, R * 0.07 * hotair.burn, R * 0.16 * hotair.burn, '#ffe27a', { line: false });
  }
  // Helma
  c.beginPath();
  c.moveTo(bx - R * 0.6, by + R * 0.75); c.lineTo(bx - R * 0.2, by + R * 1.13); c.lineTo(bx + R * 0.2, by + R * 1.13); c.lineTo(bx + R * 0.6, by + R * 0.75);
  c.closePath();
  artFillPath(c, colA, by + R * 0.75, by + R * 1.13, R * 0.3, { lineColor: line, line: lw });
  // Kuori: pohja ja joka toinen kaistale
  c.beginPath(); c.ellipse(bx, by, R, R * 1.06, 0, 0, Math.PI * 2);
  artFillPath(c, colB, by - R, by + R, R, { line: false, shadeTo: gold ? '#ffe090' : '#ffd8e6' });
  for (i = 0; i < n; i += 2) {
    f0 = -1 + i * 2 / n; f1 = -1 + (i + 1) * 2 / n;
    c.beginPath();
    for (j = 0; j <= steps; j++) { y = -1 + j * 2 / steps; w = Math.sqrt(Math.max(0, 1 - y * y)); c.lineTo(bx + f0 * R * w, by + y * R * 1.06); }
    for (j = steps; j >= 0; j--) { y = -1 + j * 2 / steps; w = Math.sqrt(Math.max(0, 1 - y * y)); c.lineTo(bx + f1 * R * w, by + y * R * 1.06); }
    c.closePath();
    artFillPath(c, colA, by - R, by + R, R, { line: false });
  }
  // Tähtivyö
  for (i = 0; i < 5; i++) {
    var sx = (i - 2) * 0.38, sy = by + R * 0.28;
    drawStar(c, bx + sx * R * Math.sqrt(1 - 0.07), sy, R * 0.09, 0, 0);
  }
  c.beginPath(); c.ellipse(bx, by, R, R * 1.06, 0, 0, Math.PI * 2);
  c.strokeStyle = line;
  c.lineWidth = lw;
  c.stroke();
  artHighlight(c, bx - R * 0.4, by - R * 0.45, R * 0.24, R * 0.15, 0.5);
  c.restore();
  // Lampaat kuoren päällä
  for (i = 0; i < hotair.sheep.length; i++) {
    if (hotair.sheep[i].state !== 'ride') continue;
    var seat = hotairSeatPos(hotair.sheep[i].seat);
    hotairDrawSheep(c, seat.x, seat.y + R * 0.08 - Math.abs(Math.sin(globalT * 2 + i)) * R * 0.03, R * 0.2, hotair.sheep[i].face);
  }
  // Matkustajat korissa (yläosa näkyy reunan yli)
  c.save();
  c.beginPath(); c.rect(bx - R * 0.8, by + R * 0.9, R * 1.6, bot - (by + R * 0.9)); c.clip();
  var u = R * 0.0125;
  drawUnicorn(c, bx + R * 0.32 - 44 * u, by + R * 1.36 + 82 * u, u, 1, 0, false, globalT);
  for (i = 0; i < hotair.friends.length; i++) {
    var fr = hotair.friends[i];
    if (fr.state !== 'ride') continue;
    trainDrawAnimal(c, fr.kind, bx + (fr.kind === 'duck' ? -R * 0.52 : R * 0.02), rim + R * 0.2 - Math.abs(Math.sin(globalT * 3 + i)) * R * 0.04, R * 0.24, { face: fr.kind === 'duck' ? -1 : 1, t: globalT + i });
  }
  var ps = R * 0.02;
  drawPrincessFree(c, bx - R * 0.22, by + R * 2.15, ps, 1, 0, false, globalT);
  if (hotair.waveT > 0 || hotair.state === 'landed') artLimb(c, bx - R * 0.08, by + R * 1.6, bx + R * 0.02 + Math.sin(globalT * 14) * R * 0.06, by + R * 1.3, ps * 3.2, SKIN, SKIN_LINE);
  c.restore();
  // Korin sisältö reunalla: omenat, kukat ja ilmapallot
  hotairDrawCargo(c, bx, rim, R);
  // Kori
  artRoundRect(c, bx - R * 0.6, rim, R * 1.2, bot - rim, R * 0.08, '#c08a4a', { lineColor: '#5a3a1e', line: lw });
  c.strokeStyle = 'rgba(90,58,30,0.55)';
  c.lineWidth = Math.max(1, R * 0.02);
  for (i = 1; i < 3; i++) { c.beginPath(); c.moveTo(bx - R * 0.58, rim + i * (bot - rim) / 3); c.lineTo(bx + R * 0.58, rim + i * (bot - rim) / 3); c.stroke(); }
  for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(bx + i * R * 0.22, rim + R * 0.02); c.lineTo(bx + i * R * 0.22, bot - R * 0.02); c.stroke(); }
  artRoundRect(c, bx - R * 0.66, rim - R * 0.04, R * 1.32, R * 0.1, R * 0.05, '#d8a46a', { lineColor: '#5a3a1e', line: Math.max(1, lw * 0.8) });
  hotairDrawCompanions(c, bx, by, R, true);
}
// Korin tavarat näkyvinä: ilmapallot naruissa vasemmalla, omenat ja kukat reunalla
function hotairDrawCargo(c, bx, rim, R) {
  var i, n, inv = hotair.inv, x, y;
  n = Math.min(4, inv.balloon);
  for (i = 0; i < n; i++) {
    x = bx - R * 0.75 - i * R * 0.12;
    y = rim - R * (0.65 + (i % 2) * 0.25) + Math.sin(globalT * 2 + i) * R * 0.04;
    c.strokeStyle = 'rgba(90,70,90,0.7)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx - R * 0.58, rim + R * 0.05); c.lineTo(x, y + R * 0.16); c.stroke();
    artBlob(c, x, y, R * 0.13, R * 0.16, HOTAIR_BAL_COLS[i % 5], { hi: 0.45 });
  }
  n = Math.min(3, inv.apple);
  for (i = 0; i < n; i++) artCircle(c, bx + R * (0.3 - i * 0.16), rim - R * 0.02, R * 0.09, '#ff4a4a', { lineColor: '#8a1a1a', hi: 0.4 });
  n = Math.min(3, inv.flower);
  for (i = 0; i < n; i++) {
    x = bx + R * (0.5 + i * 0.07);
    artLimb(c, x, rim + R * 0.05, x + R * 0.05 * i, rim - R * (0.3 + i * 0.08), R * 0.025, '#4faa3a', false);
    drawFlower(c, x + R * 0.05 * i, rim - R * (0.32 + i * 0.08), R * 0.045, HOTAIR_FLOWER_COLS[i]);
  }
}
// Perhoset lentävät pallon ympäri (front = etupuolen kaari)
function hotairDrawCompanions(c, bx, by, R, front) {
  var n = Math.min(8, hotair.bfly), i, a, x, y;
  for (i = 0; i < n; i++) {
    a = globalT * 0.9 + i * Math.PI * 2 / n;
    if ((Math.sin(a) > 0) !== front) continue;
    x = bx + Math.cos(a) * R * 1.55;
    y = by + R * 0.3 + Math.sin(a) * R * 0.35 + Math.sin(globalT * 3 + i) * R * 0.1;
    drawButterfly(c, x, y, R * 0.16, globalT * 1.3 + i, HOTAIR_FLOWER_COLS[i % 4]);
  }
}
// Kyläläiset ja toivekuplat
function hotairDrawVillagers(c) {
  var i, v, x, h = viewH, y = h * HOTAIR_FEET, s = h * 0.05, wave, up, bob, br, k, j, left, hop;
  for (i = 0; i < hotair.vill.length; i++) {
    v = hotair.vill[i];
    x = (v.u + v.off) * viewW;
    if (x < hotair.cam - h * 0.2 || x > hotair.cam + viewW + h * 0.2) continue;
    wave = v.state === 'wish' || v.state === 'bye' ? 1 : 0;
    up = v.catchT > 0 || v.happyT > 0 || v.state === 'happy';
    hop = v.happyT > 0 ? Math.abs(Math.sin(v.happyT * 8)) * h * 0.02 : 0;
    hotairDrawPerson(c, x, y - hop, s, HOTAIR_LOOKS[v.look], wave, up, v.t);
    // Puhekupla: toivottu asia (määrä kuvina); täytetty -> sydän
    if (v.state === 'wish' || v.state === 'happy') {
      bob = Math.sin(v.t * 2.2) * h * 0.006 + (v.shake > 0 ? Math.sin(v.shake * 40) * h * 0.008 : 0);
      left = v.n - v.got;
      br = h * 0.045 * (left > 1 ? 1.25 : 1);
      if (v.state === 'happy') br = h * 0.04;
      var bx = x + (v.shake > 0 ? Math.sin(v.shake * 40) * h * 0.008 : 0), byy = hotairWishY() + bob;
      c.beginPath(); c.moveTo(bx - br * 0.25, byy + br * 0.8); c.lineTo(bx, byy + br * 1.35); c.lineTo(bx + br * 0.25, byy + br * 0.8); c.closePath();
      artFillPath(c, '#ffffff', byy, byy + br * 1.35, br * 0.3, { lineColor: '#b8a8c8', flat: true });
      artBlob(c, bx, byy, br * (left > 1 ? 1.35 : 1), br, '#ffffff', { lineColor: '#b8a8c8', flat: true });
      if (v.state === 'happy') {
        trainDrawHeart(c, bx, byy, br * 0.45);
      } else {
        for (j = 0; j < left; j++) {
          k = left > 1 ? (j - (left - 1) / 2) * br * 0.95 : 0;
          hotairDrawThing(c, v.kind, bx + k, byy - br * (v.kind === 'balloon' ? 0.18 : 0), br * (v.kind === 'balloon' ? 0.5 : 0.6), v.kind === 'balloon' ? HOTAIR_BAL_COLS[(i + j) % 5] : HOTAIR_FLOWER_COLS[(i + j) % 4]);
        }
      }
    }
  }
}
// Putoavat tavarat (pieni lehtivarjo hidastaa pudotusta)
function hotairDrawDrops(c) {
  var i, d, x, y, r = viewH * 0.026;
  for (i = 0; i < hotair.drops.length; i++) {
    d = hotair.drops[i];
    x = d.u * viewW; y = d.v * viewH;
    if (d.state === 'fall') {
      c.strokeStyle = 'rgba(90,70,90,0.6)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - r * 0.9, y - r * 1.6); c.lineTo(x, y - r * 0.6); c.lineTo(x + r * 0.9, y - r * 1.6); c.stroke();
      c.beginPath(); c.moveTo(x - r * 1.1, y - r * 1.55); c.quadraticCurveTo(x, y - r * 2.9, x + r * 1.1, y - r * 1.55); c.closePath();
      artFillPath(c, '#8fe38f', y - r * 2.4, y - r * 1.55, r, { lineColor: '#2f7a3a' });
    } else {
      artGlow(c, x, y, r * 1.8, '#fff4c8', 0.5);
    }
    hotairDrawThing(c, d.kind, x, y, r, d.kind === 'balloon' ? '#ff6f9a' : '#ff7bac');
  }
}
// Maaystävät niityllä: hyppivät ja vilkuttavat, kun pallo on lähellä
function hotairDrawFriends(c) {
  var i, f, x, y, h = viewH, near, hop, k;
  for (i = 0; i < hotair.friends.length; i++) {
    f = hotair.friends[i];
    if (f.state === 'ride') continue;
    if (f.state === 'hop') {
      k = easeInOutSine(Math.min(1, f.t / 0.6));
      x = f.x0 + (hotairBX() - f.x0) * k;
      y = f.y0 + (hotairBasketY() - f.y0) * k - Math.sin(k * Math.PI) * h * 0.08;
    } else {
      x = f.u * viewW; y = h * HOTAIR_GROUND;
      if (x < hotair.cam - h * 0.2 || x > hotair.cam + viewW + h * 0.2) continue;
    }
    near = f.state === 'wait' && Math.abs(x - hotairBX()) < viewW * 0.45;
    hop = near ? Math.abs(Math.sin(f.t * 5)) * h * 0.015 : 0;
    if (f.state === 'wait') artShadow(c, x, y, h * 0.03, h * 0.007, 0.15);
    trainDrawAnimal(c, f.kind, x, y - hop, h * (f.kind === 'duck' ? 0.026 : 0.03), { face: -1, t: f.t, wave: near ? 1 : 0 });
    if (f.state === 'wait' && near) {
      // Kupla: pieni kori (= haluaa kyytiin)
      var byy = y - h * 0.11 + Math.sin(f.t * 2) * h * 0.005;
      artBlob(c, x, byy, h * 0.03, h * 0.026, '#ffffff', { lineColor: '#b8a8c8', flat: true });
      artRoundRect(c, x - h * 0.014, byy - h * 0.004, h * 0.028, h * 0.016, h * 0.004, '#c08a4a', { lineColor: '#5a3a1e', line: 1 });
      trainDrawHeart(c, x, byy - h * 0.01, h * 0.007);
    }
  }
}
function hotairDrawGifts(c) {
  var i, p;
  for (i = 0; i < hotair.gifts.length; i++) {
    if (hotair.gifts[i].t < 0) continue;
    p = hotairGiftPos(hotair.gifts[i]);
    drawStar(c, p.x, p.y, viewH * 0.022, globalT * 3, 0.6);
  }
}
// Lentävä pupu (ruutukoordinaatit): korvat lepattavat siipinä
function hotairDrawSecret(c) {
  var s = hotair.secret, x, y, h = viewH, e;
  if (!s) return;
  x = -viewW * 0.1 + s.t * viewW * 0.22;
  y = h * 0.2 + Math.sin(s.t * 2.5) * h * 0.03;
  e = Math.sin(s.t * 14) * 0.6;
  c.save();
  c.translate(x, y);
  artBlob(c, -h * 0.02, -h * 0.045, h * 0.012, h * 0.035, '#ffffff', { rot: -0.9 - e, lineColor: BUNNY_LINE });
  artBlob(c, h * 0.02, -h * 0.045, h * 0.012, h * 0.035, '#ffffff', { rot: 0.9 + e, lineColor: BUNNY_LINE });
  drawBunny(c, 0, h * 0.02, h * 0.035, 0, s.t * 6, false);
  c.restore();
}

function drawHotair() {
  var c = ctx, h = viewH, W = viewW, i, hand = null, k, cam;
  if (!beginPlayWorld()) return;
  if (!hotair.built) { endPlayWorld(); return; }
  cam = hotair.cam;
  hotairDrawSky(c);
  c.save();
  c.translate(-cam, 0);
  for (i = 0; i < hotair.clouds.length; i++) if (hotair.clouds[i].v < 0.3) hotairDrawCloud(c, hotair.clouds[i]);
  hotairDrawGround(c);
  hotairDrawForest(c);
  hotairDrawStems(c);
  // Koristeet: kamera perutaan, propsDraw siirtää itse camX:n verran
  c.save();
  c.translate(cam, 0);
  camX = cam;
  propsDraw(c, 0);
  camX = 0;
  c.restore();
  hotairDrawFest(c);
  for (i = 0; i < hotair.gates.length; i++) hotairDrawGate(c, hotair.gates[i]);
  for (i = 0; i < hotair.clouds.length; i++) if (hotair.clouds[i].v >= 0.3) hotairDrawCloud(c, hotair.clouds[i]);
  hotairDrawItems(c);
  hotairDrawFriends(c);
  hotairDrawBalloon(c);
  hotairDrawVillagers(c);
  hotairDrawDrops(c);
  hotairDrawGifts(c);
  hotairDrawFront(c);
  c.restore();
  hotairDrawGust(c);
  hotairDrawSecret(c);
  // Hiukkaset ja pop-efektit ovat maailmakoordinaateissa
  camX = cam;
  drawParticlesLayer(c);
  // Vihjekäsi: alussa noston ele, ensimmäisellä toiveella napautus kyläläiseen,
  // ensimmäisen maaystävän kohdalla lasku, juhlakentällä lasku
  if (!puzzleBusy() && !celebrating) {
    var bx = hotairBX() - cam, by = hotairBY(), mv = null;
    if (hotair.state === 'ground' || (!hotair.steered && hotair.t < 9)) {
      mv = { x: bx + h * 0.16, y0: by + h * 0.12, y1: by - h * 0.2 };
    } else if (hotair.state === 'land' && hotair.idleT < 2.5) {
      mv = { x: bx + h * 0.16, y0: by - h * 0.05, y1: by + h * 0.2 };
    } else {
      if (!hotair.dropHint) {
        for (i = 0; i < hotair.vill.length; i++) {
          var v = hotair.vill[i];
          if (v.state === 'wish' && hotair.inv[v.kind] > 0 && Math.abs(v.u - hotair.x) < 0.3) hand = { x: (v.u + v.off) * W - cam, y: h * (HOTAIR_FEET - 0.1) };
        }
      }
      var f = hotair.friends[0];
      if (!hand && f.state === 'wait' && f.u - hotair.x < 0.55 && f.u - hotair.x > 0.05 && hotair.y < hotairYMax() - 0.06) {
        mv = { x: bx + h * 0.16, y0: by - h * 0.05, y1: Math.min(h * 0.85, by + h * 0.25) };
      }
    }
    if (mv) {
      k = (globalT % 1.6) / 1.6;
      c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2);
      drawHand(c, mv.x, mv.y0 + (mv.y1 - mv.y0) * easeInOutSine(Math.min(1, k * 1.3)), h * 0.045);
      c.globalAlpha = 1;
    } else if (hand) {
      k = (globalT % 1.1) / 1.1;
      drawHand(c, hand.x - h * 0.005, hand.y - h * 0.04 - Math.abs(Math.sin(k * Math.PI)) * h * 0.04, h * 0.045);
    }
  }
  endPlayWorld();
  camX = 0;
  hotairDrawHud(c);
  drawTaskOverlay(c);
}

// HUD: tähdet, korin tavarat, pilvilampaat ja reittikartta
function hotairDrawHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), W = viewW, top = pad * 0.5, i, x, y, k, bump = hotair.hudBump > 0 ? 1 + hotair.hudBump * 0.6 : 1, n, a, b;
  if (!hotair.built) return;
  drawHudPanel(c, left, top, hs * 6.4, hs * 3.4, hs);
  drawStar(c, left + hs * 1.7, top + hs * 1.7, hs * 1.0 * bump, 0, 0.4);
  c.fillStyle = '#7a3cb8';
  c.font = 'bold ' + Math.round(hs * 1.6) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(hotair.starN + '', left + hs * 3.1, top + hs * 1.85);
  // Kori: omena, kukka, ilmapallo
  x = left + hs * 7.0;
  drawHudPanel(c, x, top, hs * 10.6, hs * 3.4, hs);
  for (i = 0; i < 3; i++) {
    var kind = HOTAIR_KINDS[i], cx = x + hs * (1.5 + i * 3.4), fl = hotair.invBump[kind] > 0 ? 1 + Math.sin(hotair.invBump[kind] * 20) * 0.15 + 0.15 : 1;
    n = hotair.inv[kind];
    c.globalAlpha = n > 0 ? 1 : 0.4;
    hotairDrawThing(c, kind, cx, top + hs * (kind === 'balloon' ? 1.4 : 1.7), hs * (kind === 'balloon' ? 0.85 : 1.0) * fl, kind === 'flower' ? '#ff7bac' : '#ff6f9a');
    c.globalAlpha = 1;
    c.fillStyle = '#7a3cb8';
    c.font = 'bold ' + Math.round(hs * 1.3) + 'px ' + UI_FONT;
    c.fillText(n + '', cx + hs * 1.05, top + hs * 1.95);
  }
  // Pilvilampaat (kaikki kyydissä = kultainen pallo)
  y = top + hs * 3.9;
  drawHudPanel(c, left, y, hs * 13.2, hs * 2.4, hs);
  for (i = 0; i < hotair.sheep.length; i++) {
    x = left + hs * (1.3 + i * 2.1);
    c.globalAlpha = i < hotair.sheepN ? 1 : 0.3;
    hotairDrawSheep(c, x, y + hs * 2.0, hs * 0.75, 1);
    c.globalAlpha = 1;
  }
  if (hotair.gold) artCircle(c, left + hs * 12.6, y + hs * 1.2, hs * 0.5, '#ffd24f', { lineColor: '#a8700a', hi: 0.5 });
  // Reitti: toiveet, tuulipilvet ja juhlakenttä
  var x0 = Math.max(W * 0.5, left + hs * 20), x1 = W * 0.86, ry = top + hs * 1.7;
  a = HOTAIR_START; b = HOTAIR_END;
  if (x1 - x0 < hs * 10) { c.textBaseline = 'alphabetic'; return; }
  drawHudPanel(c, x0 - hs * 1.6, top, x1 - x0 + hs * 3.2, hs * 3.4, hs);
  c.strokeStyle = 'rgba(122,80,56,0.7)';
  c.lineWidth = hs * 0.35;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, ry); c.lineTo(x1, ry); c.stroke();
  for (i = 0; i < hotair.gates.length; i++) {
    x = x0 + (x1 - x0) * (hotair.gates[i].u - a) / (b - a);
    c.globalAlpha = hotair.gates[i].state === 'gone' || hotair.gates[i].state === 'blow' ? 0.45 : 1;
    drawCloud(c, x, ry + hs * 0.2, hs * 0.55, 1);
    c.globalAlpha = 1;
  }
  for (i = 0; i < hotair.vill.length; i++) {
    var v = hotair.vill[i];
    x = x0 + (x1 - x0) * (v.u - a) / (b - a);
    c.globalAlpha = v.state === 'bye' ? 0.45 : 1;
    artCircle(c, x, ry, hs * 1.1, '#ffffff', { lineColor: '#ff9fb8', line: hs * 0.2 });
    hotairDrawThing(c, v.kind, x, ry - (v.kind === 'balloon' ? hs * 0.15 : 0), hs * (v.kind === 'balloon' ? 0.55 : 0.7), v.kind === 'flower' ? '#ff7bac' : '#ff6f9a');
    if (v.state === 'happy') artCircle(c, x + hs * 0.8, ry - hs * 0.8, hs * 0.38, '#5cc04a', { lineColor: '#ffffff', line: hs * 0.12 });
    c.globalAlpha = 1;
  }
  trainDrawIcon(c, 'flag', x1, ry, hs * 0.9, '#ff7bac');
  k = Math.max(0, Math.min(1, (hotair.x - a) / (b - a)));
  x = x0 + (x1 - x0) * k;
  artCircle(c, x, ry - hs * 0.1, hs * 0.6, hotair.gold ? '#ffd24f' : '#ff8fb0', { lineColor: hotair.gold ? '#a8700a' : '#b8507a', line: hs * 0.1 });
  artRoundRect(c, x - hs * 0.25, ry + hs * 0.6, hs * 0.5, hs * 0.35, hs * 0.08, '#c08a4a', { lineColor: '#5a3a1e', line: hs * 0.08 });
  c.textBaseline = 'alphabetic';
}

HUB_ICONS.hotair = function (c, x, y, s) {
  var b = Math.sin(globalT * 1.5) * s * 0.02, R = s * 0.15;
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(1, s * 0.012);
  c.beginPath();
  c.moveTo(x - R * 0.5, y - s * 0.06 + b + R * 0.8); c.lineTo(x - R * 0.4, y + s * 0.1 + b);
  c.moveTo(x + R * 0.5, y - s * 0.06 + b + R * 0.8); c.lineTo(x + R * 0.4, y + s * 0.1 + b);
  c.stroke();
  artBlob(c, x, y - s * 0.06 + b, R, R * 1.06, '#ff8fb0', { lineColor: '#b8507a', hi: 0.4 });
  c.fillStyle = '#fff4f8';
  c.beginPath(); c.ellipse(x, y - s * 0.06 + b, R * 0.35, R * 1.0, 0, 0, Math.PI * 2); c.fill();
  artRoundRect(c, x - R * 0.45, y + s * 0.1 + b, R * 0.9, R * 0.5, R * 0.1, '#c08a4a', { lineColor: '#5a3a1e' });
};
