'use strict';

// Tähtikuviot (Kaukamaa, Pilvilinna, huone T): yö Pilvilinnan tähtitornin
// terassilla. Taivaalla on haalea tähtikuvion ääriviiva ja numeroidut tyhjät
// tähtipaikat 1..N. Kuunsirppiritsalla ammutaan tähti taivaalle samalla
// eleellä kuin Pesäkalliossa: paina mihin tahansa, vedä taakse ja päästä irti.
//   - Tähti lentää kaarena (kevyt painovoima). Pisteviiva näyttää vain lennon
//     alkuosan (ensimmäisellä kierroksella pidemmän), joten tähtäys on taito.
//     Edellisen laukauksen tähtipölyjälki jää taivaalle hetkeksi: siitä näkee,
//     mihin korjata.
//   - Seuraava numero hehkuu. Osuma -> tähti napsahtaa paikalleen kilahtaen
//     (kuvion oma sävel), ja viiva piirtyy edellisestä tähdestä. Kuvion henki
//     kuultaa sitä selvemmin, mitä useampi tähti on paikallaan.
//   - Väärä numero -> "boing", tähti kimpoaa ja putoaa pilviin. Ohi -> pilviin.
//     Pilvistä tähti palaa hetken päästä koriin. Korissa on N + 3 tähteä; jos
//     kori tyhjenee (liian monta tähteä yhtä aikaa pilvissä), tähtipupu tuo
//     uuden korillisen, mutta kultainen kaukoputki menetetään.
//   - Valmis kuvio herää eloon: silmät aukeavat, viivat hehkuvat ja kuvio
//     esittää numeronsa taivaalla (kala ui, poni laukkaa, valas suihkuttaa,
//     raketti lentää, lohikäärme lentää...) ja soittaa sävelmänsä. Sitten se
//     asettuu taivaan yläreunaan elämään. Napautus saa sen tekemään tempun.
// Neljä kierrosta, kuviot arvotaan joukoista (CST_ROUNDS):
//   1. 4 tähteä, lähellä, pitkä pisteviiva
//   2. 5–6 tähteä; väliin lipuva pilvi syö siihen osuvan tähden (kikattaa ja
//      sylkäisee sen takaisin koriin)
//   3. 6–7 tähteä; tuuli (näkyvät juovat, kimallus ja nuoli) kuljettaa tähteä
//   4. 7–8 tähteä; kuvio lipuu ja kääntyy hitaasti (liikkuva maali)
// Salaisuus: tähdenlento kiitää välillä taivaan poikki; siihen osuminen on
// toivomus: iso kimallus ja +1 tähti (kerran kentässä). Kultainen kaukoputki
// (+1 tähti): enintään CST_GOLD_MISS hutia koko kentässä eikä tyhjää koria.
// Välitehtävät toisen ja kolmannen kuvion jälkeen. Lopuksi kaikki kuviot
// paraatiin, ja Pikkupilvi-ystävät nousevat pilvistä hurraamaan.

// ---------- Säätövakiot ----------
// pool = kuviot, joista kierroksen kuvio arvotaan; dist = kuvion keskikohdan
// vaakaetäisyys ritsasta (× viewH, rajataan ruutuun); size = kuvion säde
// (× viewH); cy = keskikohdan korkeus (× viewH); preview = pisteviivan pituus
// lentoaikana (s); cloud = tähtiä syövä pilvi; wind = tuulen kiihtyvyys
// (× viewH / s², suunta arvotaan); move = kuvio lipuu ja kääntyy.
var CST_ROUNDS = [
  { pool: ['fish', 'bird', 'heart'], dist: 0.6, size: 0.15, cy: 0.47, preview: 0.85, cloud: false, wind: 0, move: false },
  { pool: ['bunny', 'whale', 'star5'], dist: 0.85, size: 0.17, cy: 0.46, preview: 0.5, cloud: true, wind: 0, move: false },
  { pool: ['pony', 'castle', 'rocket'], dist: 1.0, size: 0.18, cy: 0.46, preview: 0.42, cloud: false, wind: 0.18, move: false },
  { pool: ['unicorn', 'dragon'], dist: 1.0, size: 0.19, cy: 0.46, preview: 0.4, cloud: false, wind: 0, move: true }
];
var CST_G = 1.35;            // painovoima (× viewH / s²)
var CST_VMAX = 1.95;         // laukaisunopeus täydellä vedolla (× viewH / s)
var CST_PULL = 0.17;         // täyden vedon pituus (× viewH)
var CST_MIN_PULL = 0.03;     // lyhyempi veto ei laukaise
var CST_RELOAD = 0.45;       // uusi tähti ritsaan (s)
var CST_SNAP = 0.058;        // oikea paikka nappaa tähden tältä etäisyydeltä (× viewH)
var CST_WRONG_R = 0.03;      // väärä numero kimmottaa tältä etäisyydeltä (× viewH)
var CST_SPARE = 3;           // korissa varatähtiä kuvion tähtien lisäksi
var CST_RETURN = 2.4;        // pilviin pudonnut tähti palaa koriin (s)
var CST_GOLD_MISS = 8;       // kultainen kaukoputki: enintään näin monta hutia koko kentässä
var CST_CLOUD_PER = 5.5;     // syöjäpilven edestakainen jakso (s)
var CST_CLOUD_AMP = 0.15;    // ja liikelaajuus (× viewH)
var CST_MOVE_AMP = 0.07;     // kierroksen 4 kuvio lipuu sivuttain (× viewH)
var CST_MOVE_PER = 12;       // lipumisen jakso (s)
var CST_ROT_AMP = 0.2;       // ja kääntyy (rad)
var CST_SHOOT_GAP = [20, 32]; // tähdenlento kiitää taivaan poikki näin usein (s)
var CST_SHOOT_DUR = 2.4;     // tähdenlennon kesto (s)
var CST_WISH_R = 0.055;      // tähdenlennon osumasäde (× viewH)
var CST_ALIVE = 5.4;         // valmis kuvio elää ennen kuin asettuu taivaalle (s)
var CST_SETTLE = 1.4;        // asettuminen taivaan yläreunaan (s)
var CST_FINALE = 5;          // loppuparaati ennen juhlaa (s)
var CST_HINT_IDLE = 8;       // vihjekäsi toimettomuuden jälkeen (s)
var CST_TASK_AFTER = [1, 2]; // välitehtävä näiden kierrosten jälkeen (0 = ensimmäinen)
var CST_SKY = '#1c1a4a';

// ---------- Kuviot ----------
// pts = tähtipaikat järjestyksessä (normalisoitu, y alaspäin), close = viiva
// viimeisestä ensimmäiseen, extra = lisäviivat (indeksiparit), col = hengen
// väri, tune = sävelmä (tähti k soittaa sävelen k, herätessä koko sävelmä),
// anim(t, i, b) = pisteen i siirtymä (normalisoitu) elävänä, move(t, e) =
// kuvion liike taivaalla (× viewH, e = 0..1 kirjekuori), art = hengen kuva.
var CST_SHAPES = {
  fish: {
    pts: [[-0.15, -0.6], [0.9, -0.05], [-0.15, 0.55], [-0.6, 0]], close: true, extra: [],
    col: '#7fd8ff', tune: [659, 784, 880, 784, 659, 587, 523, 587],
    anim: function (t, i) {
      if (i === 3) return [0, Math.sin(t * 9) * 0.08];
      if (i === 1) return [0, Math.sin(t * 9 + 1.2) * 0.04];
      return [0, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 1.15) * 0.22 * e, y: Math.sin(t * 2.3) * 0.06 * e, rot: Math.cos(t * 1.15) * 0.25 * e }; }
  },
  bird: {
    pts: [[0.95, -0.2], [0.05, -0.85], [-0.95, 0.05], [0.05, 0.45]], close: true, extra: [],
    col: '#ffd27a', tune: [1047, 1175, 1319, 1568, 1319, 1175, 1047, 1568],
    anim: function (t, i) {
      if (i === 1) return [Math.sin(t * 11) * 0.05, (1 - Math.cos(t * 11)) * 0.45];
      return [0, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 0.95) * 0.3 * e, y: (-Math.sin(t * 1.9) * 0.12 - 0.05) * e, rot: Math.cos(t * 0.95) * 0.2 * e }; }
  },
  heart: {
    pts: [[0, -0.35], [0.75, -0.75], [0, 0.85], [-0.75, -0.75]], close: true, extra: [],
    col: '#ff8fb8', tune: [523, 659, 784, 1047, 784, 659, 784, 1047],
    anim: function (t, i, b) {
      var k = Math.pow(Math.max(0, Math.sin(t * 7)), 4) * 0.15;
      return [b[0] * k, b[1] * k];
    },
    move: function (t, e) { return { x: Math.sin(t * 1.3) * 0.16 * e, y: (-0.06 - Math.sin(t * 2.6) * 0.05) * e, rot: Math.sin(t * 1.3) * 0.15 * e }; }
  },
  bunny: {
    pts: [[0.85, -0.2], [0.45, -1.0], [0.1, -0.35], [-0.85, 0.25], [-0.35, 0.8], [0.45, 0.7]], close: true, extra: [],
    col: '#f0e6ff', tune: [784, 880, 784, 659, 784, 1047, 880, 784],
    anim: function (t, i) {
      if (i === 1) return [Math.sin(t * 6) * 0.09, Math.abs(Math.sin(t * 6)) * 0.04];
      if (i === 4 || i === 5) return [0, -Math.abs(Math.sin(t * 4.5)) * 0.08];
      return [0, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 0.8) * 0.28 * e, y: -Math.abs(Math.sin(t * 4.5)) * 0.14 * e, rot: -Math.abs(Math.sin(t * 4.5)) * 0.12 * e }; }
  },
  whale: {
    pts: [[-1.0, -0.55], [-0.65, 0.0], [0.0, -0.42], [0.9, -0.1], [0.6, 0.4], [-0.2, 0.4]], close: false, extra: [[5, 1]],
    col: '#6fb8ff', tune: [392, 440, 523, 587, 523, 440, 392, 523],
    anim: function (t, i) {
      if (i === 0) return [0, Math.sin(t * 3) * 0.14];
      if (i === 1) return [0, Math.sin(t * 3 - 0.6) * 0.04];
      return [0, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 0.7) * 0.25 * e, y: Math.sin(t * 1.4) * 0.05 * e, rot: Math.sin(t * 1.4) * 0.08 * e }; }
  },
  star5: {
    pts: [[0, -1], [0.59, 0.81], [-0.95, -0.31], [0.95, -0.31], [-0.59, 0.81]], close: true, extra: [],
    col: '#ffe27a', tune: [1319, 1175, 1047, 880, 1047, 1175, 1319, 1568],
    anim: function (t, i, b) {
      var k = Math.sin(t * 5 + i) * 0.05;
      return [b[0] * k, b[1] * k];
    },
    move: function (t, e) { return { x: Math.sin(t * 1.2) * 0.12 * e, y: (-0.05 - Math.sin(t * 2.4) * 0.04) * e, rot: Math.sin(t * 0.6) * 2.6 * e }; }
  },
  pony: {
    pts: [[0.95, -0.35], [0.55, -0.95], [0.15, -0.2], [-0.95, -0.25], [-0.55, 0.85], [0.0, 0.25], [0.45, 0.85]], close: false, extra: [[0, 2]],
    col: '#ffc49a', tune: [659, 587, 523, 587, 659, 659, 784, 1047],
    anim: function (t, i) { return cstGallop(t, i, 4, 6, 3); },
    move: function (t, e) { return { x: Math.sin(t * 0.75) * 0.3 * e, y: -Math.abs(Math.sin(t * 6)) * 0.05 * e, rot: Math.sin(t * 6) * 0.05 * e }; }
  },
  castle: {
    pts: [[-0.8, 0.8], [-0.8, -0.45], [-0.3, -0.1], [0, -0.95], [0.3, -0.1], [0.8, -0.45], [0.8, 0.8]], close: false, extra: [[6, 0]],
    col: '#d8c8ff', tune: [523, 659, 784, 1047, 1047, 784, 1047, 1319],
    anim: function (t, i) {
      if (i === 1 || i === 3 || i === 5) return [0, -Math.abs(Math.sin(t * 3 + i)) * 0.05];
      return [0, 0];
    },
    move: function (t, e) { return { x: 0, y: (-0.04 - Math.abs(Math.sin(t * 2.2)) * 0.04) * e, rot: Math.sin(t * 3) * 0.04 * e }; }
  },
  rocket: {
    pts: [[0, -1.0], [0.35, -0.35], [0.65, 0.75], [0, 0.5], [-0.65, 0.75], [-0.35, -0.35]], close: true, extra: [],
    col: '#ff9f8a', tune: [523, 587, 659, 784, 880, 1047, 1175, 1319],
    anim: function (t, i) {
      var k = Math.sin(t * 40) * 0.012;
      return [k, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 1.2) * 0.26 * e, y: (-0.22 - Math.sin(t * 1.6) * 0.08) * e, rot: Math.cos(t * 1.2) * 0.4 * e }; }
  },
  unicorn: {
    pts: [[1.0, -0.3], [0.9, -1.05], [0.45, -0.7], [0.1, -0.15], [-0.95, -0.3], [-0.55, 0.85], [0.0, 0.3], [0.5, 0.85]], close: false, extra: [[0, 2]],
    col: '#ffffff', tune: [784, 988, 1175, 1568, 1319, 1175, 988, 1568],
    anim: function (t, i) { return cstGallop(t, i, 5, 7, 4); },
    move: function (t, e) { return { x: Math.sin(t * 0.8) * 0.3 * e, y: (-Math.abs(Math.sin(t * 6)) * 0.05 - Math.sin(t * 1.6) * 0.05) * e, rot: Math.sin(t * 6) * 0.05 * e }; }
  },
  dragon: {
    pts: [[0.95, -0.45], [0.55, -0.1], [0.15, -1.0], [-0.2, -0.15], [-0.6, 0.15], [-1.0, -0.2], [-0.25, 0.7], [0.35, 0.6]], close: false, extra: [[7, 1]],
    col: '#8fe8b0', tune: [392, 523, 587, 659, 784, 659, 587, 784],
    anim: function (t, i) {
      if (i === 2) return [Math.sin(t * 7) * 0.05, (1 - Math.cos(t * 7)) * 0.42];
      if (i === 5) return [0, Math.sin(t * 4) * 0.12];
      if (i === 4) return [0, Math.sin(t * 4 + 1) * 0.05];
      return [0, 0];
    },
    move: function (t, e) { return { x: Math.sin(t * 0.8) * 0.3 * e, y: (-0.05 + Math.sin(t * 1.6) * 0.07) * e, rot: Math.cos(t * 0.8) * 0.15 * e }; }
  }
};
// Laukka: takajalka, etujalka ja häntä heiluvat
function cstGallop(t, i, hl, fl, tl) {
  var s = Math.sin(t * 12);
  if (i === hl) return [s * 0.25, -Math.max(0, -s) * 0.12];
  if (i === fl) return [-s * 0.25, -Math.max(0, s) * 0.12];
  if (i === tl) return [0, Math.sin(t * 12 + 1) * 0.1];
  return [0, 0];
}

var cst = {
  L: null, t: 0, round: 0, flow: 'play', flowT: 0, keys: [], fig: null, gallery: [], seq: 0,
  basket: 0, shots: [], rets: [], aim: { active: false, sx: 0, sy: 0, dx: 0, dy: 0 }, reload: 0,
  misses: 0, roundMiss: [0, 0, 0, 0], refills: 0, refill: null, shotsTotal: 0, idleT: 0,
  hintT: 0, hintSol: null, hintKey: '', hintAge: 0, trail: [], trailT: 0, puffs: [], streaks: [],
  wind: 0, cloud: null, moveT: 0, shoot: null, shootT: 20, wished: false, wishFly: null,
  goldLostT: 0, taskIdx: 0, celT: 0, auroraK: 0, auroraPink: 0, auroraDance: 0, tw: [], flies: [],
  peek: null, cheer: [], starsGiven: false
};

// ---------- Asettelu ----------
function cstLayout() {
  var W = viewW, H = viewH, L = { W: W, H: H }, i, g0, g1, seed = 7;
  L.floorY = H * 0.86;
  L.terrEnd = H * 0.78;
  L.fork = { x: H * 0.3, y: H * 0.665 };
  L.basket = { x: H * 0.165, y: H * 0.915 };
  L.bunny = { x: H * 0.06, y: H * 0.93 };
  L.scope = { x: H * 0.47, y: H * 0.905 };
  L.mbox = { x: H * 0.63, y: H * 0.93 };
  L.owl = { x: L.terrEnd, y: H * 0.735 };
  L.clock = { x: H * 0.1, y: H * 0.49 };
  L.lant1 = { x: H * 0.215, y: H * 0.37 };
  L.lant2 = { x: L.terrEnd - H * 0.065, y: L.floorY + H * 0.005 };
  L.sleeper = { x: L.terrEnd + H * 0.13, y: H * 0.905 };
  L.moon = { x: W - H * 0.09, y: H * 0.12 };
  L.cloudY = H * 0.9;
  // Taivaalle asettuneiden kuvioiden paikat yläreunassa
  g0 = H * 0.36;
  g1 = W - H * 0.25;
  L.gal = [];
  for (i = 0; i < 4; i++) L.gal.push({ x: g0 + (g1 - g0) * i / 3, y: H * 0.19 });
  L.galS = H * 0.07;
  // Tuikkivat tähdet (piirretään joka ruutu, kevyesti)
  cst.tw = [];
  for (i = 0; i < 34; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    var rx = seed / 233280;
    seed = (seed * 9301 + 49297) % 233280;
    var ry = seed / 233280;
    cst.tw.push({ x: H * 0.25 + rx * (W - H * 0.3), y: H * 0.04 + ry * H * 0.7, r: H * (0.004 + (i % 3) * 0.002), ph: i * 1.7 });
  }
  cst.L = L;
}
function cstRoundDef(r) { return CST_ROUNDS[Math.min(r, CST_ROUNDS.length - 1)]; }
// Kuvion kotipaikka (keskikohta) kierroksen säädöistä
function cstFigHome(fig) {
  var L = cst.L, H = viewH, d = cstRoundDef(fig.r), S = d.size * H, x;
  x = L.fork.x + d.dist * H;
  x = Math.min(x, L.W - S - H * 0.1 - (d.move ? CST_MOVE_AMP * H : 0));
  x = Math.max(x, L.fork.x + H * 0.45);
  return { x: x, y: d.cy * H, S: S };
}

// ---------- Pienet apurit ----------
function cstEll(c, x, y, rx, ry, rot) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  else c.arc(x, y, (rx + ry) / 2, 0, Math.PI * 2);
}
function cstText(c, txt, x, y, size, col, line) {
  c.font = 'bold ' + Math.round(size) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (line) {
    c.strokeStyle = line;
    c.lineWidth = Math.max(2, size * 0.18);
    c.lineJoin = 'round';
    c.strokeText(txt, x, y);
  }
  c.fillStyle = col;
  c.fillText(txt, x, y);
}
function cstHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
}
function cstPuff(x, y, n, col, o) {
  var i;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (cst.puffs.length > 60) cst.puffs.shift();
    cst.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * (o.spread || 0.04), y: y + (Math.random() - 0.5) * viewH * 0.015,
      vx: (Math.random() - 0.5) * viewH * (o.vx || 0.12), vy: -viewH * (o.up === undefined ? 0.03 + Math.random() * 0.05 : o.up),
      r: viewH * (o.r || 0.016) * (0.7 + Math.random() * 0.6), t: 0, life: o.life || (0.7 + Math.random() * 0.5),
      col: col || '#ffffff', kind: o.kind || 'puff'
    });
  }
}
// Hengen värit: tumma täyttö taivaan sävyyn sekoitettuna ja kirkas reuna
var cstDimCache = {};
function cstDim(col) {
  if (!cstDimCache[col]) cstDimCache[col] = artMix(col, CST_SKY, 0.5);
  return cstDimCache[col];
}
function cstPaint(c, col, S) {
  c.fillStyle = cstDim(col);
  c.fill();
  c.strokeStyle = col;
  c.lineWidth = Math.max(1.2, S * 0.03);
  c.lineJoin = 'round';
  c.stroke();
}
function cstLimb(c, x0, y0, x1, y1, w, col, S) {
  c.lineCap = 'round';
  c.strokeStyle = col;
  c.lineWidth = w + Math.max(1.2, S * 0.03) * 2;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = cstDim(col);
  c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}
// Silmä: kiinni (nukkuva kaari) tai auki (kiiltävä)
function cstEye(c, x, y, r, open) {
  if (!open) {
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(1.2, r * 0.45);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - r * 0.3, r, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    return;
  }
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a2a6a';
  c.beginPath(); c.arc(x + r * 0.15, y + r * 0.1, r * 0.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x - r * 0.05, y - r * 0.15, r * 0.22, 0, Math.PI * 2); c.fill();
}
function cstNoteAt(fig, k) { var tu = fig.sh.tune; return tu[k % tu.length]; }
function cstAct() { cst.idleT = 0; }

// ---------- Alustus ----------
function initConstel() {
  var r, d, prev = null, k;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'pattern')];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  cstLayout();
  cst.keys = [];
  for (r = 0; r < CST_ROUNDS.length; r++) {
    d = CST_ROUNDS[r];
    k = d.pool[randInt(d.pool.length)];
    cst.keys.push(k);
  }
  cst.t = 0;
  cst.gallery = [];
  cst.seq = 0;
  cst.shots = [];
  cst.rets = [];
  cst.aim = { active: false, sx: 0, sy: 0, dx: 0, dy: 0 };
  cst.reload = 0;
  cst.misses = 0;
  cst.roundMiss = [0, 0, 0, 0];
  cst.refills = 0;
  cst.refill = null;
  cst.shotsTotal = 0;
  cst.idleT = 0;
  cst.hintT = 0;
  cst.hintSol = null;
  cst.hintKey = '';
  cst.trail = [];
  cst.trailT = 0;
  cst.puffs = [];
  cst.streaks = [];
  cst.shoot = null;
  cst.shootT = 18 + Math.random() * 6;
  cst.wished = false;
  cst.wishFly = null;
  cst.goldLostT = 0;
  cst.taskIdx = 0;
  cst.celT = 0;
  cst.auroraK = 0;
  cst.auroraPink = 0;
  cst.auroraDance = 0;
  cst.flies = [];
  cst.peek = null;
  cst.cheer = [];
  cst.starsGiven = false;
  cstStartRound(0);
  cstSetupProps();
  renderBackground();
  playNote(659, 0, 0.25, 'sine', 0.25);
  playNote(988, 0.15, 0.25, 'sine', 0.22);
  playNote(1319, 0.3, 0.45, 'sine', 0.2);
}
function respawnConstel() {}
function resizeConstel() {
  var i, n = 0;
  camX = 0;
  cstLayout();
  cstSetupProps();
  // Lennossa olevat tähdet takaisin koriin
  for (i = 0; i < cst.shots.length; i++) if (!cst.shots[i].stale) n++;
  for (i = 0; i < cst.rets.length; i++) if (!cst.rets[i].stale) n++;
  cst.basket += n;
  cst.shots = [];
  cst.rets = [];
  cst.trail = [];
  cst.aim.active = false;
  cst.hintSol = null;
  if (cst.cloud) cstMakeCloud();
}
function cstStartRound(r) {
  var key = cst.keys[r], sh = CST_SHAPES[key], d = cstRoundDef(r), fig, i, h;
  fig = {
    key: key, sh: sh, r: r, N: sh.pts.length, next: 0, placed: [], pop: [], wob: [], lineT: [],
    state: 'play', x: 0, y: 0, rot: 0, sc: 1, k: 0, at: 0, aliveT: 0, settleT: 0, gi: -1,
    trickT: 0, wake: 0, px: 0, py: 0, prot: 0, seed: Math.random() * 10, introT: 0, paradeT: 0, gx: 0, gy: 0
  };
  for (i = 0; i < fig.N; i++) { fig.placed.push(false); fig.pop.push(0); fig.wob.push(0); fig.lineT.push(0); }
  h = cstFigHome(fig);
  fig.S = h.S;
  fig.x = h.x;
  fig.y = h.y;
  cst.fig = fig;
  cst.round = r;
  cst.flow = 'play';
  cst.flowT = 0;
  cst.basket = fig.N + CST_SPARE;
  cst.moveT = 0;
  cst.wind = d.wind ? d.wind * (Math.random() < 0.5 ? -1 : 1) : 0;
  cst.streaks = [];
  cst.cloud = null;
  if (d.cloud) cstMakeCloud();
  cst.trail = [];
  cst.hintSol = null;
  cst.hintT = 0;
  for (i = 0; i < cst.shots.length; i++) cst.shots[i].stale = true;
  for (i = 0; i < cst.rets.length; i++) cst.rets[i].stale = true;
  cst.rets = [];
  // Numerot ponnahtavat esiin yksi kerrallaan
  for (i = 0; i < fig.N; i++) playNote(cstNoteAt(fig, i) * 2, 0.25 + i * 0.12, 0.08, 'sine', 0.08);
}
function cstMakeCloud() {
  var L = cst.L, H = viewH, fig = cst.fig, h = cstFigHome(fig);
  cst.cloud = {
    x: L.fork.x + (h.x - h.S - L.fork.x) * 0.55, y0: H * 0.45, y: H * 0.45, rx: H * 0.075, ry: H * 0.05,
    ph: Math.random() * Math.PI * 2, eatT: 0, gigT: 0, pokeT: 0, full: []
  };
}

// ---------- Kuvion asento ja pisteet ----------
function cstFigUpdate(fig, dt) {
  var H = viewH, L = cst.L, h, e, m, T = CST_ALIVE, k, g, d = cstRoundDef(fig.r), tr, sl;
  for (k = 0; k < fig.N; k++) {
    if (fig.pop[k] > 0) fig.pop[k] -= dt;
    if (fig.wob[k] > 0) fig.wob[k] -= dt;
    if (fig.placed[k] && fig.lineT[k] < 1) fig.lineT[k] = Math.min(1, fig.lineT[k] + dt / 0.3);
  }
  if (fig.trickT > 0) fig.trickT -= dt;
  fig.introT += dt;
  if (fig.state === 'play') {
    h = cstFigHome(fig);
    fig.S = h.S;
    fig.x = h.x;
    fig.y = h.y;
    fig.rot = 0;
    if (d.move) {
      fig.x += Math.sin(cst.moveT * Math.PI * 2 / CST_MOVE_PER) * CST_MOVE_AMP * H;
      fig.y += Math.sin(cst.moveT * Math.PI * 2 / (CST_MOVE_PER * 0.5)) * 0.015 * H;
      fig.rot = Math.sin(cst.moveT * Math.PI * 2 / (CST_MOVE_PER * 1.3)) * CST_ROT_AMP;
    }
    fig.sc = 1;
    fig.k = 0;
    fig.at = globalT;
    return;
  }
  if (fig.state === 'alive') {
    fig.aliveT += dt;
    fig.at = fig.aliveT;
    e = easeInOutSine(Math.min(1, fig.aliveT / 0.9, (T - fig.aliveT) / 0.9));
    m = fig.sh.move(fig.aliveT, e);
    fig.x = fig.px + m.x * H;
    fig.y = fig.py + m.y * H;
    fig.rot = fig.prot * Math.max(0, 1 - fig.aliveT / 0.9) + m.rot;
    fig.sc = 1 + 0.1 * e;
    fig.k = Math.min(1, fig.aliveT / 0.6);
    fig.wake = Math.min(1, fig.wake + dt * 3);
    return;
  }
  if (fig.state === 'settle') {
    fig.settleT += dt;
    k = easeInOutSine(fig.settleT / CST_SETTLE);
    g = L.gal[fig.gi];
    fig.x = fig.px + (g.x - fig.px) * k;
    fig.y = fig.py + (g.y - fig.py) * k - Math.sin(k * Math.PI) * H * 0.06;
    fig.rot = fig.prot * (1 - k);
    fig.sc = 1 + (L.galS / fig.S - 1) * k;
    fig.k = 1 - k * 0.5;
    fig.at += dt;
    return;
  }
  if (fig.state === 'gal') {
    g = L.gal[fig.gi];
    fig.at += dt * 0.7;
    fig.x = g.x;
    fig.y = g.y + Math.sin(globalT * 1.2 + fig.seed) * H * 0.006;
    fig.rot = Math.sin(globalT * 0.8 + fig.seed) * 0.05;
    fig.sc = L.galS / fig.S;
    fig.k = 0.5;
    if (fig.trickT > 0) {
      tr = 1 - fig.trickT / 1.2;
      fig.y -= Math.sin(tr * Math.PI) * H * 0.06;
      fig.rot += easeInOutSine(tr) * Math.PI * 2;
      fig.sc *= 1 + Math.sin(tr * Math.PI) * 0.3;
      fig.k = 1;
      fig.at += dt * 1.5;
    }
    return;
  }
  if (fig.state === 'parade') {
    fig.paradeT += dt;
    fig.at += dt;
    sl = cstParadeSpot(fig.gi);
    g = L.gal[fig.gi];
    k = easeInOutSine(Math.min(1, fig.paradeT / 1.2));
    m = fig.sh.move(fig.paradeT, k);
    fig.x = g.x + (sl.x - g.x) * k + m.x * H * 0.7;
    fig.y = g.y + (sl.y - g.y) * k + m.y * H * 0.7;
    fig.rot = m.rot * 0.8;
    fig.sc = (L.galS + (sl.S - L.galS) * k) / fig.S;
    fig.k = 1;
    fig.wake = 1;
    if (fig.trickT > 0) {
      tr = 1 - fig.trickT / 1.2;
      fig.y -= Math.sin(tr * Math.PI) * H * 0.08;
      fig.rot += easeInOutSine(tr) * Math.PI * 2;
    }
  }
}
function cstParadeSpot(i) {
  var W = viewW, H = viewH, n = Math.max(1, cst.gallery.length);
  return { x: W * (0.16 + 0.72 * (n === 1 ? 0.5 : i / (n - 1))), y: H * (i % 2 ? 0.48 : 0.32), S: H * 0.12 };
}
// Pisteen i paikallinen sijainti (normalisoitu, animaatio mukana)
function cstLocal(fig, i) {
  var b = fig.sh.pts[i], o;
  if (fig.k <= 0) return [b[0], b[1]];
  o = fig.sh.anim(fig.at, i, b);
  return [b[0] + o[0] * fig.k, b[1] + o[1] * fig.k];
}
// Pisteen i maailmakoordinaatit
function cstWorld(fig, i) {
  var p = cstLocal(fig, i), s = fig.S * fig.sc, cr = Math.cos(fig.rot), sr = Math.sin(fig.rot);
  return { x: fig.x + (p[0] * cr - p[1] * sr) * s, y: fig.y + (p[0] * sr + p[1] * cr) * s };
}
// Kuvion paikat tietyllä lipumisajalla (botti ja vihje: ennakointi)
function cstWorldAt(fig, i, moveT) {
  var d = cstRoundDef(fig.r), h = cstFigHome(fig), x = h.x, y = h.y, rot = 0, b = fig.sh.pts[i], cr, sr, s = h.S;
  if (d.move) {
    x += Math.sin(moveT * Math.PI * 2 / CST_MOVE_PER) * CST_MOVE_AMP * viewH;
    y += Math.sin(moveT * Math.PI * 2 / (CST_MOVE_PER * 0.5)) * 0.015 * viewH;
    rot = Math.sin(moveT * Math.PI * 2 / (CST_MOVE_PER * 1.3)) * CST_ROT_AMP;
  }
  cr = Math.cos(rot);
  sr = Math.sin(rot);
  return { x: x + (b[0] * cr - b[1] * sr) * s, y: y + (b[0] * sr + b[1] * cr) * s };
}

// ---------- Lentorata ----------
function cstLaunchVel(dx, dy) {
  var maxP = CST_PULL * viewH, len = Math.sqrt(dx * dx + dy * dy), k;
  if (len > maxP) { dx *= maxP / len; dy *= maxP / len; len = maxP; }
  k = CST_VMAX * viewH / maxP;
  return { vx: -dx * k, vy: -dy * k, px: dx, py: dy, len: len };
}
function cstStep(s, h, wind) {
  s.vy += CST_G * viewH * h;
  s.vx += wind * viewH * h;
  s.x += s.vx * h;
  s.y += s.vy * h;
}
function cstCloudY(ph) { return cst.cloud.y0 + Math.sin(ph) * CST_CLOUD_AMP * viewH; }
function cstInCloud(x, y, cy) {
  var c = cst.cloud, dx, dy;
  if (!c) return false;
  dx = (x - c.x) / c.rx;
  dy = (y - cy) / c.ry;
  return dx * dx + dy * dy < 1;
}
// Ennakkopisteet: ensimmäiset 'dur' sekuntia lentoa
function cstPreview(vx, vy, dur) {
  var L = cst.L, s = { x: L.fork.x, y: L.fork.y, vx: vx, vy: vy }, h = 1 / 120, pts = [], t = 0, i = 0, hit = false, fig = cst.fig, p, dx, dy, r = CST_SNAP * viewH;
  while (t < dur) {
    cstStep(s, h, cst.wind);
    t += h;
    i++;
    if (i % 5 === 0) pts.push({ x: s.x, y: s.y, k: t / dur });
    if (fig && fig.state === 'play' && fig.next < fig.N && !hit) {
      p = cstWorld(fig, fig.next);
      dx = s.x - p.x; dy = s.y - p.y;
      if (dx * dx + dy * dy < r * r) { hit = true; break; }
    }
    if (s.y > viewH) break;
  }
  return { pts: pts, hit: hit };
}
// Ratkaisija: vetovektori, jolla tähti osuu paikkaan (tx, ty). opt: { wind, moveT,
// cloud: true = vältä pilveä nykyisellä vaiheella, aim: 'low'|'high' }
function cstSolve(target, opt) {
  var L = cst.L, H = viewH, fig = cst.fig, best = null, bc = 1e9, a, p, res, i, j, a0, p0, wind, da, dp;
  opt = opt || {};
  wind = opt.wind === undefined ? cst.wind : opt.wind;
  // Paikat valmiiksi (liikkuva kuvio lasketaan joka askeleella)
  var stat = [], moving = opt.moveT !== undefined, kk, lim = moving ? H * 0.2 : CST_WRONG_R * H * 1.6;
  for (kk = 0; kk < fig.N; kk++) stat.push(cstWorld(fig, kk));
  function sim(ang, pw) {
    var s = { x: L.fork.x, y: L.fork.y, vx: Math.cos(ang) * pw * CST_VMAX * H, vy: -Math.sin(ang) * pw * CST_VMAX * H }, h = 1 / 90, t = 0, minD = 1e9, minT = 0, wrongT = 1e9, cloudT = 1e9, k, q, dx, dy, d2, tgt, cph, rw = CST_WRONG_R * H * 1.25;
    while (t < 3.2) {
      cstStep(s, h, wind);
      t += h;
      tgt = moving ? cstWorldAt(fig, target, opt.moveT + t) : stat[target];
      dx = s.x - tgt.x; dy = s.y - tgt.y;
      d2 = Math.sqrt(dx * dx + dy * dy);
      if (d2 < minD) { minD = d2; minT = t; }
      if (wrongT > 1e8) {
        for (k = 0; k < fig.N; k++) {
          if (k === target || fig.placed[k]) continue;
          q = stat[k];
          if (Math.abs(s.x - q.x) > lim || Math.abs(s.y - q.y) > lim) continue;
          if (moving) q = cstWorldAt(fig, k, opt.moveT + t);
          if ((s.x - q.x) * (s.x - q.x) + (s.y - q.y) * (s.y - q.y) < rw * rw) { wrongT = t; break; }
        }
      }
      if (opt.cloud && cst.cloud && cloudT > 1e8) {
        cph = cst.cloud.ph + (t + (opt.cloudDt || 0)) * Math.PI * 2 / CST_CLOUD_PER;
        if (cstInCloud(s.x, s.y, cstCloudY(cph))) cloudT = t;
      }
      if (s.y > H * 0.95 || s.x > L.W + H * 0.2 || (s.x > tgt.x + H * 0.25 && t > minT + 0.3)) break;
    }
    return { minD: minD, t: minT, wrong: wrongT < minT, cloud: cloudT < minT };
  }
  function cost(r, ang) {
    var c = r.minD + H * 0.012 * Math.abs(r.t - 1.05);
    if (opt.aim === 'high') c -= H * 0.01 * ang;
    if (r.wrong) c += H * 0.5;
    if (r.cloud) c += H * 0.3;
    return c;
  }
  for (a = 0.1; a < 1.45; a += 0.045) {
    for (p = 0.3; p <= 1.0001; p += 0.035) {
      res = sim(a, p);
      res.c = cost(res, a);
      if (res.c < bc) { bc = res.c; best = { a: a, p: p, r: res }; }
    }
  }
  if (!best) return null;
  // Hienosäätö parhaan ympäriltä
  a0 = best.a; p0 = best.p;
  for (i = -3; i <= 3; i++) {
    for (j = -3; j <= 3; j++) {
      da = a0 + i * 0.012; dp = Math.min(1, Math.max(0.2, p0 + j * 0.009));
      res = sim(da, dp);
      res.c = cost(res, da);
      if (res.c < bc) { bc = res.c; best = { a: da, p: dp, r: res }; }
    }
  }
  return {
    a: best.a, p: best.p, t: best.r.t, minD: best.r.minD,
    dx: -Math.cos(best.a) * best.p * CST_PULL * H, dy: Math.sin(best.a) * best.p * CST_PULL * H
  };
}

// ---------- Syöte ----------
function handleConstelTap(px, py) {
  var i, fig, p, hit = false;
  if (!running || celebrating || puzzleBusy()) return;
  cst.idleT = 0;
  propsTap(px, py);
  // Taivaalle asettuneet kuviot ja elävä kuvio tekevät tempun
  for (i = 0; i < cst.gallery.length; i++) {
    fig = cst.gallery[i];
    if ((fig.state === 'gal' || fig.state === 'parade') && Math.hypot(px - fig.x, py - fig.y) < fig.S * fig.sc * 1.1 && fig.trickT <= 0) {
      cstTrick(fig);
      hit = true;
    }
  }
  fig = cst.fig;
  if (fig && fig.state === 'alive' && Math.hypot(px - fig.x, py - fig.y) < fig.S * 1.2 && fig.trickT <= 0) {
    fig.trickT = 1.2;
    cstVoice(fig.key);
    spawnSparkles(px, py, 12, fig.sh.col);
    hit = true;
  }
  // Pilvi kikattaa
  if (cst.cloud && cstInCloud(px, py, cst.cloud.y) && cst.cloud.pokeT <= 0) {
    cst.cloud.pokeT = 0.8;
    cstGiggle(0);
    spawnSparkles(px, py, 6, '#ffffff');
  }
  // Tähtipaikka: numero heilahtaa ja soi
  if (fig && fig.state === 'play') {
    for (i = 0; i < fig.N; i++) {
      p = cstWorld(fig, i);
      if (!fig.placed[i] && Math.hypot(px - p.x, py - p.y) < viewH * 0.035) {
        fig.wob[i] = 0.4;
        playNote(cstNoteAt(fig, i), 0, 0.15, 'sine', 0.15);
      }
    }
  }
  if (cst.flow === 'play' && fig && fig.state === 'play') {
    cst.aim.active = true;
    cst.aim.sx = px;
    cst.aim.sy = py;
    cst.aim.dx = 0;
    cst.aim.dy = 0;
  }
  return hit;
}
function cstRelease() {
  var a = cst.aim, v;
  a.active = false;
  v = cstLaunchVel(a.dx, a.dy);
  if (v.len < CST_MIN_PULL * viewH) return;
  if (cst.flow !== 'play' || cst.fig.state !== 'play') return;
  cstFire(a.dx, a.dy);
}
// Laukaisu vetovektorilla (dx, dy) = sormen siirtymä painalluksesta
function cstFire(dx, dy) {
  var L = cst.L, v = cstLaunchVel(dx, dy);
  if (cst.reload > 0) return false;
  if (cst.basket <= 0) {
    // Kori tyhjä: tähtipupu tuo uuden korillisen (kultainen kaukoputki menee)
    if (!cst.refill) {
      cst.refill = { t: 0 };
      cst.refills++;
      cst.goldLostT = 1.5;
      soundBunny();
      playNote(523, 0.2, 0.12, 'triangle', 0.2);
      playNote(659, 0.32, 0.12, 'triangle', 0.2);
    }
    return false;
  }
  cst.basket--;
  cst.reload = CST_RELOAD;
  cst.shotsTotal++;
  cst.shots.push({ x: L.fork.x, y: L.fork.y, vx: v.vx, vy: v.vy, t: 0, state: 'fly', trail: [], path: [], pathT: 0, rot: 0, missed: false, stale: false, r: cst.round, waitT: 0 });
  cst.trail = [];
  cst.trailT = 0;
  spawnSparkles(L.fork.x, L.fork.y, 6, '#fff2a8');
  playNote(330, 0, 0.08, 'triangle', 0.25);
  playNote(660, 0.04, 0.12, 'sine', 0.2);
  playNote(1320, 0.09, 0.2, 'sine', 0.1);
  cstAct();
  cst.hintT = 0;
  return true;
}
function cstTrick(fig) {
  var i, tu = fig.sh.tune;
  fig.trickT = 1.2;
  for (i = 0; i < 3; i++) playNote(tu[i], i * 0.1, 0.16, 'triangle', 0.22);
  spawnSparkles(fig.x, fig.y, 10, fig.sh.col);
  artPop(fig.x, fig.y, fig.S * fig.sc * 1.1, fig.sh.col, 'ring');
}

// ---------- Äänet ----------
function cstGiggle(d) {
  var i;
  for (i = 0; i < 5; i++) playNote(i % 2 ? 1397 : 1175, d + i * 0.07, 0.06, 'sine', 0.14 - i * 0.015);
}
function cstBoing() {
  playNote(520, 0, 0.06, 'square', 0.05);
  playNote(392, 0.05, 0.1, 'sine', 0.25);
  playNote(294, 0.13, 0.12, 'sine', 0.22);
  playNote(392, 0.24, 0.1, 'sine', 0.12);
}
function cstSplash() {
  playNote(196, 0, 0.2, 'sine', 0.15);
  playNote(147, 0.08, 0.3, 'sine', 0.12);
}
// Herätessä kuvion oma ääntely
function cstVoice(key) {
  var i;
  if (key === 'pony' || key === 'unicorn') {
    for (i = 0; i < 6; i++) playNote(880 + (i % 2) * 220 - i * 40, i * 0.06, 0.07, 'triangle', 0.15);
    if (key === 'unicorn') for (i = 0; i < 5; i++) playNote(1568 * Math.pow(1.122, i), 0.4 + i * 0.07, 0.15, 'sine', 0.12);
    return;
  }
  if (key === 'bunny') { soundBunny(); return; }
  if (key === 'whale') { playNote(196, 0, 0.6, 'sine', 0.25); playNote(262, 0.4, 0.7, 'sine', 0.2); playNote(330, 0.9, 0.5, 'sine', 0.12); return; }
  if (key === 'bird') { playNote(1760, 0, 0.06, 'sine', 0.18); playNote(2093, 0.08, 0.06, 'sine', 0.18); playNote(1976, 0.16, 0.1, 'sine', 0.18); return; }
  if (key === 'fish') { for (i = 0; i < 4; i++) playNote(1047 + i * 220, i * 0.09, 0.05, 'sine', 0.15); return; }
  if (key === 'heart') { playNote(147, 0, 0.12, 'sine', 0.35); playNote(147, 0.2, 0.12, 'sine', 0.3); playNote(1319, 0.35, 0.3, 'triangle', 0.15); return; }
  if (key === 'star5') { for (i = 0; i < 6; i++) playNote(2093 - i * 150, i * 0.05, 0.1, 'sine', 0.12); return; }
  if (key === 'castle') { playNote(523, 0, 0.15, 'square', 0.06); playNote(659, 0.15, 0.15, 'square', 0.06); playNote(784, 0.3, 0.35, 'square', 0.07); return; }
  if (key === 'rocket') { for (i = 0; i < 8; i++) playNote(220 + i * 90, i * 0.05, 0.06, 'sawtooth', 0.05); return; }
  if (key === 'dragon') { playNote(147, 0, 0.3, 'sawtooth', 0.08); playNote(196, 0.15, 0.35, 'sawtooth', 0.07); playNote(1047, 0.5, 0.2, 'triangle', 0.15); return; }
}

// ---------- Päivitys ----------
function updateConstel(dt) {
  var i, fig;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  cstUpdateFx(dt);
  for (i = 0; i < cst.gallery.length; i++) cstFigUpdate(cst.gallery[i], dt);
  if (cst.fig && cst.gallery.indexOf(cst.fig) < 0) cstFigUpdate(cst.fig, dt);
  if (celebrating) { cst.celT += dt; return; }
  if (puzzleBusy()) { cst.aim.active = false; return; }
  cst.t += dt;
  if (!holding) cst.idleT += dt;
  if (cst.reload > 0) cst.reload -= dt;
  fig = cst.fig;
  if (cst.flow === 'play' && fig.state === 'play') cst.moveT += dt;
  // Tähtäys: sormi pohjassa vetää, nosto laukaisee
  if (cst.aim.active) {
    if (holding) {
      cst.aim.dx = lastPX - cst.aim.sx;
      cst.aim.dy = lastPY - cst.aim.sy;
    } else cstRelease();
  }
  cstUpdateShots(dt);
  cstUpdateCloud(dt);
  cstUpdateShooter(dt);
  cstUpdateFlow(dt);
  cstUpdateHint(dt);
}
function cstUpdateShots(dt) {
  var L = cst.L, H = viewH, i, j, s, n, h, k, fig = cst.fig, p, dx, dy, d2, snap = CST_SNAP * H, wr = CST_WRONG_R * H, done, cy, sh = cst.shoot, rt;
  for (i = cst.shots.length - 1; i >= 0; i--) {
    s = cst.shots[i];
    s.t += dt;
    if (s.state === 'fly' || s.state === 'fall') {
      n = Math.max(1, Math.ceil(dt * 120));
      h = dt / n;
      done = false;
      for (k = 0; k < n && !done; k++) {
        cstStep(s, h, s.state === 'fly' ? cst.wind : cst.wind * 0.5);
        s.rot += h * (s.state === 'fly' ? 6 : 14);
        // Tähdenlento: toivomus
        if (sh && !sh.hit && s.state === 'fly') {
          p = cstShootPos(sh);
          if (Math.hypot(s.x - p.x, s.y - p.y) < CST_WISH_R * H) cstWish(p);
        }
        if (s.state === 'fly' && !s.stale) {
          // Syöjäpilvi
          if (cst.cloud && cstInCloud(s.x, s.y, cst.cloud.y)) {
            s.state = 'eaten';
            s.waitT = 0.9;
            cst.cloud.eatT = 0.9;
            cst.cloud.gigT = 1.2;
            cstMiss(s);
            cstGiggle(0.05);
            cstPuff(s.x, s.y, 5, '#ffffff', { r: 0.012 });
            done = true;
            break;
          }
          // Tähtipaikat
          if (fig && fig.state === 'play') {
            for (j = 0; j < fig.N; j++) {
              if (fig.placed[j]) continue;
              p = cstWorld(fig, j);
              dx = s.x - p.x; dy = s.y - p.y;
              d2 = dx * dx + dy * dy;
              if (j === fig.next && d2 < snap * snap) { cstPlace(s, j, p); done = true; break; }
              if (j !== fig.next && d2 < wr * wr) { cstBounce(s, j, p); break; }
            }
            if (done) break;
          }
        }
        // Rajat: terassi, pilvimeri tai ruudun ulkopuoli
        if (s.vy > 0 && s.x < L.terrEnd && s.y > L.floorY + H * 0.02) {
          s.state = 'ground';
          s.waitT = 1.0;
          s.y = L.floorY + H * 0.02;
          cstMiss(s);
          cstPuff(s.x, s.y, 3, '#c8c0e8', { r: 0.01 });
          playNote(392, 0, 0.06, 'sine', 0.15);
          playNote(330, 0.08, 0.08, 'sine', 0.12);
          done = true;
        } else if (s.y > L.cloudY && s.x >= L.terrEnd) {
          s.state = 'cloud';
          s.waitT = CST_RETURN;
          s.y = L.cloudY;
          cstMiss(s);
          cstPuff(s.x, s.y, 6, '#e8e4ff', { up: 0.04, r: 0.02, vx: 0.08 });
          cstSplash();
          done = true;
        } else if (s.x > L.W + H * 0.15 || s.x < -H * 0.15) {
          s.state = 'cloud';
          s.waitT = CST_RETURN;
          s.x = Math.max(L.terrEnd + H * 0.1, Math.min(L.W - H * 0.05, s.x));
          s.y = L.cloudY;
          cstMiss(s);
          done = true;
        }
      }
      if (s.state === 'fly' || s.state === 'fall') {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 10) s.trail.shift();
        if (s.state === 'fly' && !s.stale && cst.shots.length) {
          s.pathT += dt;
          if (s.pathT > 0.035) { s.pathT = 0; cst.trail.push({ x: s.x, y: s.y }); }
        }
      }
      continue;
    }
    if (s.state === 'placed') { cst.shots.splice(i, 1); continue; }
    // Odottaa pilvissä (tai pilven suussa), sitten palaa koriin
    s.waitT -= dt;
    if (s.state === 'eaten' && cst.cloud) { s.x = cst.cloud.x; s.y = cst.cloud.y; }
    if (s.waitT <= 0) {
      cst.shots.splice(i, 1);
      if (s.stale) continue;
      if (s.state === 'eaten') {
        // Pilvi sylkäisee tähden takaisin koriin
        cstPuff(s.x - viewH * 0.06, s.y, 4, '#ffffff', { r: 0.01 });
        playNote(784, 0, 0.08, 'sine', 0.2);
        playNote(523, 0.06, 0.1, 'sine', 0.15);
      }
      rt = { x0: s.x, y0: s.y, t: 0, dur: s.state === 'ground' ? 0.5 : 0.8, stale: false };
      cst.rets.push(rt);
    }
  }
  for (i = cst.rets.length - 1; i >= 0; i--) {
    rt = cst.rets[i];
    rt.t += dt;
    if (rt.t >= rt.dur) {
      cst.rets.splice(i, 1);
      if (rt.stale) continue;
      cst.basket++;
      artPop(L.basket.x, L.basket.y - H * 0.05, H * 0.04, '#ffe27a', 'ring');
      playNote(1568, 0, 0.06, 'sine', 0.12);
      playNote(2093, 0.05, 0.08, 'sine', 0.1);
    }
  }
  if (cst.refill) {
    cst.refill.t += dt;
    if (cst.refill.t >= 1.5) {
      cst.basket += CST_SPARE;
      cst.refill = null;
      spawnSparkles(L.basket.x, L.basket.y - H * 0.05, 14, '#ffe27a');
      for (i = 0; i < 3; i++) playNote([1047, 1319, 1568][i], i * 0.08, 0.15, 'triangle', 0.22);
    }
  }
}
function cstMiss(s) {
  if (s.missed || s.stale) return;
  s.missed = true;
  cst.misses++;
  cst.roundMiss[s.r]++;
  if (cst.misses === CST_GOLD_MISS + 1) cst.goldLostT = 1.5;
}
function cstPlace(s, j, p) {
  var fig = cst.fig, k, n = 0;
  s.state = 'placed';
  fig.placed[j] = true;
  fig.pop[j] = 0.45;
  fig.lineT[j] = 0;
  fig.next++;
  while (fig.next < fig.N && fig.placed[fig.next]) fig.next++;
  for (k = 0; k < fig.N; k++) if (fig.placed[k]) n++;
  artPop(p.x, p.y, viewH * 0.05, '#fff2a8', 'ring');
  artPop(p.x, p.y, viewH * 0.035, '#ffffff', 'burst');
  spawnSparkles(p.x, p.y, 10, '#ffe27a');
  playNote(cstNoteAt(fig, j), 0, 0.3, 'triangle', 0.3);
  playNote(cstNoteAt(fig, j) * 2, 0.03, 0.25, 'sine', 0.12);
  playNote(2637, 0.06, 0.08, 'sine', 0.06);
  cst.hintSol = null;
  cstAct();
  if (n >= fig.N) {
    // Valmis: herää eloon pienen tauon jälkeen
    cst.flow = 'wake';
    cst.flowT = 0;
    cst.aim.active = false;
  }
}
function cstBounce(s, j, p) {
  var fig = cst.fig;
  s.state = 'fall';
  s.vx = -s.vx * 0.35 - viewH * 0.15;
  s.vy = -Math.abs(s.vy) * 0.25 - viewH * 0.35;
  fig.wob[j] = 0.6;
  cstMiss(s);
  cstBoing();
  spawnSparkles(p.x, p.y, 5, '#b8c8ff');
  artPop(p.x, p.y, viewH * 0.04, '#b8c8ff', 'ring');
  // Oikea numero välähtää vihjeeksi
  if (fig.next < fig.N) fig.wob[fig.next] = 0.01;
}
function cstUpdateCloud(dt) {
  var c = cst.cloud;
  if (!c) return;
  c.ph += dt * Math.PI * 2 / CST_CLOUD_PER;
  c.y = cstCloudY(c.ph);
  if (c.eatT > 0) c.eatT -= dt;
  if (c.gigT > 0) c.gigT -= dt;
  if (c.pokeT > 0) c.pokeT -= dt;
}
// ---------- Tähdenlento ----------
function cstShootPos(sh) {
  var k = sh.t / sh.dur;
  return { x: sh.x0 + (sh.x1 - sh.x0) * k, y: sh.y0 + (sh.y1 - sh.y0) * k + Math.sin(k * Math.PI) * viewH * 0.04 };
}
function cstUpdateShooter(dt) {
  var W = viewW, H = viewH, sh = cst.shoot;
  if (sh) {
    sh.t += dt;
    if (sh.t >= sh.dur) cst.shoot = null;
    return;
  }
  if (cst.flow !== 'play') return;
  cst.shootT -= dt;
  if (cst.shootT > 0) return;
  cst.shootT = cst.wished ? 30 + Math.random() * 15 : CST_SHOOT_GAP[0] + Math.random() * (CST_SHOOT_GAP[1] - CST_SHOOT_GAP[0]);
  cst.shoot = {
    t: 0, dur: CST_SHOOT_DUR, hit: false,
    x0: W + H * 0.1, y0: H * (0.06 + Math.random() * 0.05), x1: W * 0.25, y1: H * (0.15 + Math.random() * 0.07)
  };
  playNote(2637, 0, 0.3, 'sine', 0.06);
  playNote(2349, 0.25, 0.4, 'sine', 0.05);
}
function cstWish(p) {
  var i;
  cst.shoot.hit = true;
  spawnSparkles(p.x, p.y, 30, '#fff2a8');
  spawnSparkles(p.x, p.y, 16, '#ff9ec6');
  artPop(p.x, p.y, viewH * 0.12, '#fff2a8', 'burst');
  artPop(p.x, p.y, viewH * 0.09, '#ffffff', 'ring');
  for (i = 0; i < 7; i++) playNote([1047, 1319, 1568, 2093, 1568, 2093, 2637][i], i * 0.08, 0.25, 'triangle', 0.22);
  if (!cst.wished) {
    // Toivomus: +1 tähti (kerran kentässä)
    cst.wished = true;
    starCoins += 1;
    starGain.n = 1;
    starGain.until = globalT + 3.2;
    saveProgress();
    cst.wishFly = { x0: p.x, y0: p.y, t: 0 };
  }
}

// ---------- Kulku ----------
function cstUpdateFlow(dt) {
  var fig = cst.fig, i;
  cst.flowT += dt;
  if (cst.flow === 'wake') {
    if (cst.flowT < 0.45) return;
    // Herää eloon
    fig.state = 'alive';
    fig.aliveT = 0;
    fig.px = fig.x;
    fig.py = fig.y;
    fig.prot = fig.rot;
    cst.flow = 'alive';
    cst.flowT = 0;
    artPop(fig.x, fig.y, fig.S * 1.6, '#ffffff', 'ring');
    artPop(fig.x, fig.y, fig.S * 1.3, fig.sh.col, 'burst');
    spawnSparkles(fig.x, fig.y, 24, fig.sh.col);
    for (i = 0; i < fig.N; i++) spawnSparkles(cstWorld(fig, i).x, cstWorld(fig, i).y, 3, '#fff2a8');
    cstVoice(fig.key);
    for (i = 0; i < 8; i++) playNote(fig.sh.tune[i], 0.5 + i * 0.22, 0.3, 'triangle', 0.24);
    playNote(fig.sh.tune[0] / 2, 0.5, 1.2, 'sine', 0.12);
    playNote(fig.sh.tune[4] / 2, 1.38, 1.2, 'sine', 0.12);
    return;
  }
  if (cst.flow === 'alive') {
    cstAliveFx(fig, dt);
    if (fig.aliveT < CST_ALIVE) return;
    fig.state = 'settle';
    fig.settleT = 0;
    fig.gi = cst.gallery.length;
    fig.px = fig.x;
    fig.py = fig.y;
    fig.prot = fig.rot;
    cst.flow = 'settle';
    cst.flowT = 0;
    playNote(1319, 0, 0.2, 'sine', 0.15);
    playNote(1047, 0.2, 0.3, 'sine', 0.12);
    return;
  }
  if (cst.flow === 'settle') {
    if (fig.settleT < CST_SETTLE) return;
    fig.state = 'gal';
    fig.at = globalT;
    cst.gallery.push(fig);
    spawnSparkles(fig.x, fig.y, 10, fig.sh.col);
    playNote(2093, 0, 0.12, 'sine', 0.15);
    if (cst.round >= CST_ROUNDS.length - 1) {
      cst.flow = 'finale';
      cst.flowT = 0;
      cstStartFinale();
      return;
    }
    if (CST_TASK_AFTER.indexOf(cst.round) >= 0 && cst.taskIdx < tasks.length) {
      cst.flow = 'task';
      cst.flowT = 0;
      cst.aim.active = false;
      taskStart(tasks[cst.taskIdx]);
      return;
    }
    cstStartRound(cst.round + 1);
    return;
  }
  if (cst.flow === 'task') {
    if (!tasks[cst.taskIdx].opened) return;
    cst.taskIdx++;
    cstStartRound(cst.round + 1);
    return;
  }
  if (cst.flow === 'finale') {
    cstUpdateCheer(dt);
    if (cst.flowT < CST_FINALE) return;
    cst.flow = 'done';
    startCelebration();
    if (cstGolden()) {
      // Kultainen kaukoputki: +1 tähti (startCelebration antoi jo 2)
      starCoins += 1;
      starGain.n += 1;
      starGain.until = globalT + 3.2;
      saveProgress();
      spawnSparkles(viewW / 2, viewH * 0.5, 30, '#ffd24f');
    }
    return;
  }
  if (cst.flow === 'done') cstUpdateCheer(dt);
}
function cstGolden() { return cst.misses <= CST_GOLD_MISS && cst.refills === 0; }
// Elävän kuvion erikoistehosteet
function cstAliveFx(fig, dt) {
  var t = fig.aliveT, S = fig.S * fig.sc, p, r = Math.random();
  if (fig.key === 'whale' && r < dt * 10) {
    p = cstWorld(fig, 2);
    cstPuff(p.x + S * 0.25, p.y - S * 0.1, 1, '#bfe8ff', { up: 0.25 + Math.random() * 0.1, vx: 0.15, r: 0.008, life: 0.8, kind: 'drop' });
  } else if (fig.key === 'dragon' && (t % 1.6) < dt) {
    p = cstWorld(fig, 0);
    spawnSparkles(p.x + S * 0.15, p.y, 10, '#ffb050');
    playNote(330, 0, 0.12, 'sawtooth', 0.04);
  } else if (fig.key === 'rocket' && r < dt * 20) {
    p = cstWorld(fig, 3);
    cstPuff(p.x, p.y + S * 0.1, 1, Math.random() < 0.5 ? '#ffd27a' : '#ff8f6a', { up: -0.15, vx: 0.06, r: 0.012, life: 0.5 });
  } else if (fig.key === 'castle' && (t % 1.1) < dt && t > 0.8) {
    spawnSparkles(fig.x + (Math.random() - 0.5) * S * 1.6, fig.y - S * (1.2 + Math.random() * 0.4), 14, ['#ff9ec6', '#ffe27a', '#9fd8ff'][randInt(3)]);
    playNote(1568 + Math.random() * 400, 0, 0.1, 'sine', 0.1);
  } else if ((fig.key === 'heart' || fig.key === 'fish') && r < dt * 4) {
    cstPuff(fig.x + (Math.random() - 0.5) * S, fig.y - S * 0.3, 1, fig.key === 'heart' ? '#ff8fb8' : '#bfe8ff', { up: 0.08, r: 0.012, life: 1.2, kind: fig.key === 'heart' ? 'heart' : 'bubble' });
  } else if ((fig.key === 'unicorn' || fig.key === 'star5') && r < dt * 14) {
    cstPuff(fig.x - S * 0.8, fig.y + (Math.random() - 0.3) * S * 0.6, 1, RAINBOW_COLORS[randInt(RAINBOW_COLORS.length)], { up: 0.01, vx: 0.05, r: 0.01, life: 0.9 });
  }
}
// ---------- Loppuparaati ja Pikkupilvi-ystävät ----------
function cstStartFinale() {
  var i, W = viewW, H = viewH, tints = [null, '#ffd6e8', '#d8f5e4', '#fff3c4', '#e6dcff'];
  for (i = 0; i < cst.gallery.length; i++) {
    cst.gallery[i].state = 'parade';
    cst.gallery[i].paradeT = 0;
  }
  cst.cheer = [];
  for (i = 0; i < 5; i++) {
    cst.cheer.push({ x: cst.L.terrEnd + (W - cst.L.terrEnd) * (0.1 + i * 0.2), t: -0.3 - i * 0.25, tint: tints[i], seed: i * 1.3 });
  }
  for (i = 0; i < 8; i++) playNote([523, 659, 784, 1047, 784, 1047, 1319, 1568][i], 0.3 + i * 0.16, 0.25, 'triangle', 0.22);
}
function cstUpdateCheer(dt) {
  var i, ch, H = viewH;
  for (i = 0; i < cst.cheer.length; i++) {
    ch = cst.cheer[i];
    ch.t += dt;
    if (ch.t > 0.6 && Math.random() < dt * 0.8) {
      spawnSparkles(ch.x, H * 0.72, 8, ['#ffe27a', '#ff9ec6', '#9fd8ff'][randInt(3)]);
      playNote(1319 + randInt(4) * 200, 0, 0.08, 'sine', 0.08);
    }
  }
  if (Math.random() < dt * 1.5) spawnSparkles(viewW * (0.2 + Math.random() * 0.7), H * (0.1 + Math.random() * 0.3), 16, ['#ffe27a', '#ff9ec6', '#9fd8ff', '#b8f0a0'][randInt(4)]);
}

// ---------- Vihjekäsi ----------
function cstUpdateHint(dt) {
  var fig = cst.fig, key, want, i, flying = 0;
  for (i = 0; i < cst.shots.length; i++) if (cst.shots[i].state === 'fly' && !cst.shots[i].stale) flying++;
  want = cst.flow === 'play' && fig.state === 'play' && !cst.aim.active && !flying && (cst.shotsTotal === 0 ? cst.t > 1.2 : cst.idleT > CST_HINT_IDLE);
  if (!want) { cst.hintT = 0; return; }
  cst.hintT += dt;
  cst.hintAge += dt;
  key = cst.round + ':' + fig.next;
  if (!cst.hintSol || cst.hintKey !== key || (cstRoundDef(cst.round).move && cst.hintAge > 1.2)) {
    cst.hintSol = cstSolve(fig.next, { cloud: true });
    cst.hintKey = key;
    cst.hintAge = 0;
  }
}

// ---------- Tehosteet ----------
function cstUpdateFx(dt) {
  var i, p, s, W = viewW, H = viewH, f;
  for (i = cst.puffs.length - 1; i >= 0; i--) {
    p = cst.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'drop') p.vy += H * 0.9 * dt;
    p.vx *= Math.max(0, 1 - dt * 2);
    if (p.t > p.life) cst.puffs.splice(i, 1);
  }
  if (cst.goldLostT > 0) cst.goldLostT -= dt;
  if (cst.auroraK > 0) cst.auroraK = Math.max(0, cst.auroraK - dt * 0.5);
  if (cst.auroraDance > 0) cst.auroraDance -= dt;
  if (cst.peek) { cst.peek.t += dt; if (cst.peek.t > 2.8) cst.peek = null; }
  if (cst.wishFly) { cst.wishFly.t += dt; if (cst.wishFly.t > 1.2) cst.wishFly = null; }
  if (cst.trail.length) {
    cst.trailT += dt;
  }
  // Tuulijuovat ja kimallus
  if (cst.wind) {
    if (cst.streaks.length < 16 && Math.random() < dt * 12) {
      cst.streaks.push({ x: cst.wind > 0 ? -H * 0.2 : W + H * 0.2, y: H * (0.08 + Math.random() * 0.62), len: H * (0.06 + Math.random() * 0.1), sp: H * (0.7 + Math.random() * 0.6), t: 0, leaf: Math.random() < 0.35, ph: Math.random() * 6 });
    }
  }
  for (i = cst.streaks.length - 1; i >= 0; i--) {
    s = cst.streaks[i];
    s.t += dt;
    s.x += (cst.wind >= 0 ? 1 : -1) * s.sp * dt;
    if (s.x < -H * 0.4 || s.x > W + H * 0.4) cst.streaks.splice(i, 1);
  }
  // Tulikärpäset (lyhdystä)
  for (i = cst.flies.length - 1; i >= 0; i--) {
    f = cst.flies[i];
    f.t += dt;
    f.x += Math.cos(f.t * 1.3 + f.ph) * H * 0.06 * dt + f.vx * dt;
    f.y += Math.sin(f.t * 1.9 + f.ph) * H * 0.05 * dt - H * 0.01 * dt;
    if (f.t > 9) cst.flies.splice(i, 1);
  }
}

// ---------- Tökättävät ----------
// Kaukoputki (kurkistus: kuupupu vilkuttaa kuussa; 3.: ufopupu), pöllö-
// tähtitieteilijä (huhuilee; 5.: lukulasit putoavat), kuu (haukottelee; 3.:
// kääntää kylkeä; 5.: lähettää sydämen), tähtikello (viisarit pyörivät; 3.:
// kello soi ja tähtikäki ponnahtaa), soittorasia (soittaa viimeisimmän kuvion
// sävelmää; 3.: nuotteja leijuu; 5.: kaikki kuviot tekevät tempun), nukkuva
// Pikkupilvi (kuorsaa sadetta; herää; 3.: sateenkaari; 5.: aivastaa tähtiä),
// lyhdyt (heilahtavat ja kirkastuvat; 3.: tulikärpänen lentää), revontulet
// (kirkastuvat; 3.: vaaleanpunaiset; 5.: tanssivat), tähtikori ja tähtipupu.
function cstSetupProps() {
  var L = cst.L, H = viewH;
  propsReset();
  propAdd({
    x: L.moon.x, y: L.moon.y + H * 0.05, r: H * 0.065, hy: H * 0.05, color: '#fff2c0', note: 784, amp: 0.08, layer: 0, yawn: 0, side: 0, sideT: 0,
    update: function (p, dt) { if (p.yawn > 0) p.yawn -= dt; if (p.sideT > 0) p.sideT -= dt; p.side += ((p.sideT > 0 ? 1 : 0) - p.side) * Math.min(1, dt * 3); },
    draw: function (c, p) { cstDrawMoon(c, H, p); },
    poke: function (p) {
      p.yawn = 1.4;
      playNote(392, 0.05, 0.4, 'sine', 0.15);
      playNote(330, 0.35, 0.5, 'sine', 0.12);
      if (p.n % 3 === 0) { p.sideT = 3; playNote(262, 0.6, 0.4, 'sine', 0.12); }
      if (p.n % 5 === 0) { cstPuff(p.x - H * 0.05, p.y - H * 0.06, 5, '#ff8fb8', { kind: 'heart', up: 0.04, vx: 0.2, r: 0.014, life: 2 }); playNote(1319, 0.3, 0.3, 'triangle', 0.18); }
    }
  });
  propAdd({
    x: viewW * 0.55, y: H * 0.12, r: H * 0.1, hy: 0, color: '#7fffc8', note: 988, amp: 0, layer: 0,
    draw: function () {},
    poke: function (p) {
      var i;
      cst.auroraK = 1;
      for (i = 0; i < 4; i++) playNote(988 * Math.pow(1.122, i), i * 0.1, 0.35, 'sine', 0.08);
      if (p.n % 3 === 0) cst.auroraPink = 1 - cst.auroraPink;
      if (p.n % 5 === 0) { cst.auroraDance = 3; for (i = 0; i < 6; i++) playNote(1319 * Math.pow(1.06, i), 0.4 + i * 0.12, 0.3, 'sine', 0.07); }
    }
  });
  propAdd({
    x: L.clock.x, y: L.clock.y + H * 0.05, r: H * 0.055, hy: H * 0.05, color: '#ffe27a', note: 1175, amp: 0.05, layer: 1, spin: 0, ang: 0, cuck: 0,
    update: function (p, dt) {
      if (p.spin > 0) { p.spin -= dt; p.ang += dt * 14; }
      if (p.cuck > 0) p.cuck -= dt;
    },
    draw: function (c, p) { cstDrawClock(c, H, p); },
    poke: function (p) {
      p.spin = 1;
      playNote(1319, 0, 0.05, 'square', 0.04);
      playNote(1175, 0.15, 0.05, 'square', 0.04);
      if (p.n % 3 === 0) {
        p.cuck = 1.8;
        playNote(1568, 0.3, 0.25, 'sine', 0.2);
        playNote(1319, 0.6, 0.3, 'sine', 0.2);
        playNote(1568, 1.0, 0.25, 'sine', 0.2);
        playNote(1319, 1.3, 0.35, 'sine', 0.2);
      }
    }
  });
  propAdd({
    x: L.lant1.x, y: L.lant1.y, r: H * 0.05, hy: -H * 0.07, color: '#ffe27a', note: 1568, amp: 0.35, layer: 1, glow: 0,
    update: function (p, dt) { if (p.glow > 0) p.glow -= dt * 0.5; },
    draw: function (c, p) { cstDrawLantern(c, H, p, true); },
    poke: function (p) { cstPokeLantern(p, H * 0.07); }
  });
  propAdd({
    x: L.lant2.x, y: L.lant2.y, r: H * 0.05, hy: H * 0.08, color: '#ffe27a', note: 1319, amp: 0.12, layer: 1, glow: 0,
    update: function (p, dt) { if (p.glow > 0) p.glow -= dt * 0.5; },
    draw: function (c, p) { cstDrawLantern(c, H, p, false); },
    poke: function (p) { cstPokeLantern(p, -H * 0.08); }
  });
  propAdd({
    x: L.owl.x, y: L.owl.y, r: H * 0.06, hy: H * 0.05, color: '#c0a4e0', note: 392, amp: 0.1, layer: 1, hoot: 0, noGlass: 0,
    update: function (p, dt) { if (p.hoot > 0) p.hoot -= dt; if (p.noGlass > 0) p.noGlass -= dt; },
    draw: function (c, p) { cstDrawOwl(c, H, p); },
    poke: function (p) {
      p.hoot = 1.2;
      playNote(392, 0, 0.25, 'sine', 0.25);
      playNote(330, 0.3, 0.35, 'sine', 0.25);
      if (p.n % 5 === 0) {
        p.noGlass = 4;
        playNote(1760, 0.2, 0.05, 'triangle', 0.15);
        playNote(1568, 0.3, 0.05, 'triangle', 0.15);
        propDrop({
          x: p.x, y: p.y - H * 0.05, vx: H * 0.12, vy: -H * 0.3, ground: cst.L.floorY + H * 0.03, life: 3.5,
          draw: function (c) { cstDrawGlasses(c, 0, 0, H * 0.012); }
        });
      }
    }
  });
  propAdd({
    x: L.scope.x, y: L.scope.y, r: H * 0.06, hy: H * 0.06, color: '#ffe27a', note: 880, amp: 0.08, layer: 1,
    draw: function (c, p) { cstDrawScope(c, 0, 0, H * 0.05, true, -0.75); },
    poke: function (p) {
      cst.peek = { t: 0, ufo: p.n % 3 === 0 };
      playNote(659, 0, 0.12, 'sine', 0.2);
      playNote(988, 0.1, 0.2, 'sine', 0.18);
      if (p.n % 3 === 0) { for (var i = 0; i < 5; i++) playNote(1200 + Math.sin(i) * 300, 0.3 + i * 0.08, 0.08, 'square', 0.04); }
    }
  });
  propAdd({
    x: L.mbox.x, y: L.mbox.y, r: H * 0.05, hy: H * 0.03, color: '#ff9ec6', note: 1047, amp: 0.1, layer: 1, open: 0,
    update: function (p, dt) { if (p.open > 0) p.open -= dt; },
    draw: function (c, p) { cstDrawMusicBox(c, H, p); },
    poke: function (p) {
      var tu = cst.gallery.length ? cst.gallery[cst.gallery.length - 1].sh.tune : [523, 523, 784, 784, 880, 880, 784, 784], i, n = p.n % 3 === 0 ? 8 : 4;
      p.open = n * 0.25 + 0.8;
      for (i = 0; i < n; i++) playNote(tu[i] * 2, i * 0.25, 0.3, 'sine', 0.13);
      if (p.n % 3 === 0) for (i = 0; i < 5; i++) cstPuff(p.x, p.y - H * 0.06, 1, ['#ff9ec6', '#ffe27a', '#9fd8ff'][i % 3], { kind: 'note', up: 0.06 + i * 0.01, vx: 0.08, r: 0.014, life: 2 });
      if (p.n % 5 === 0) for (i = 0; i < cst.gallery.length; i++) if (cst.gallery[i].state === 'gal') cstTrick(cst.gallery[i]);
    }
  });
  propAdd({
    x: L.sleeper.x, y: L.sleeper.y, r: H * 0.065, hy: H * 0.05, color: '#ffffff', note: 659, amp: 0.05, layer: 1, awake: 0, bow: 0,
    update: function (p, dt) { if (p.awake > 0) p.awake -= dt; if (p.bow > 0) p.bow -= dt; },
    draw: function (c, p) { cstDrawSleeper(c, H, p); },
    poke: function (p) {
      var i;
      p.awake = 1.8;
      playNote(523, 0, 0.3, 'sine', 0.15);
      playNote(392, 0.25, 0.4, 'sine', 0.12);
      if (p.n % 3 === 0) { p.bow = 2.4; playNote(1047, 0.2, 0.2, 'triangle', 0.2); playNote(1319, 0.35, 0.3, 'triangle', 0.2); }
      if (p.n % 5 === 0) {
        playNote(1568, 0.5, 0.08, 'square', 0.06);
        spawnSparkles(p.x, p.y - H * 0.05, 14, '#ffd24f');
        for (i = 0; i < 4; i++) {
          propDrop({
            x: p.x, y: p.y - H * 0.05, vx: H * (Math.random() - 0.5) * 0.5, vy: -H * (0.4 + Math.random() * 0.3), ground: cst.L.cloudY, life: 1.8,
            draw: function (c) { drawStar(c, 0, 0, H * 0.013, 0, 0.3); }
          });
        }
      }
    }
  });
  propAdd({
    x: L.basket.x, y: L.basket.y, r: H * 0.055, hy: H * 0.035, color: '#ffe27a', note: 1319, amp: 0.08, layer: 1,
    draw: function (c, p) { cstDrawBasket(c, H, p); },
    poke: function (p) {
      playNote(1568, 0, 0.06, 'sine', 0.15);
      playNote(2093, 0.06, 0.08, 'sine', 0.12);
      if (cst.basket > 0) {
        propDrop({
          x: p.x, y: p.y - H * 0.05, vx: H * (Math.random() - 0.5) * 0.2, vy: -H * 0.45, ground: p.y - H * 0.04, life: 1.1,
          draw: function (c) { drawStar(c, 0, 0, H * 0.014, 0, 0.3); }
        });
      }
    }
  });
  propAdd({
    x: L.bunny.x, y: L.bunny.y, r: H * 0.055, hy: H * 0.05, color: '#ffffff', note: 784, amp: 0.1, layer: 1, hop: 0, jug: 0, wheel: 0,
    update: function (p, dt) { if (p.hop > 0) p.hop -= dt; if (p.jug > 0) p.jug -= dt; if (p.wheel > 0) p.wheel -= dt; },
    draw: function (c, p) { cstDrawStarBunny(c, H, p); },
    poke: function (p) {
      p.hop = 0.5;
      soundBunny();
      if (p.n % 3 === 0) { p.jug = 2.4; for (var i = 0; i < 6; i++) playNote(1047 + (i % 3) * 262, 0.2 + i * 0.3, 0.08, 'sine', 0.12); }
      if (p.n % 5 === 0) { p.wheel = 0.9; playNote(784, 0.1, 0.1, 'triangle', 0.2); playNote(1175, 0.3, 0.2, 'triangle', 0.2); }
    }
  });
}
function cstPokeLantern(p, fy) {
  var H = viewH;
  p.glow = 1;
  if (p.n % 3 === 0) {
    cst.flies.push({ x: p.x, y: p.y + fy, vx: H * 0.03 * (Math.random() < 0.5 ? -1 : 1), t: 0, ph: Math.random() * 6 });
    playNote(2093, 0.15, 0.1, 'sine', 0.12);
    playNote(2637, 0.25, 0.12, 'sine', 0.1);
  }
}

// ---------- Tausta ----------
function renderConstelBg(b, w, h) {
  var L = cst.L, g, i, x, y, r, seed = 11, rnd, tx;
  if (!L || L.W !== w || L.H !== h) { cstLayout(); L = cst.L; }
  rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  // Yötaivas
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0f0e38');
  g.addColorStop(0.45, '#221e62');
  g.addColorStop(0.8, '#3c3282');
  g.addColorStop(1, '#5a4a9a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Linnunrata: haaleita pilviä vinosti
  for (i = 0; i < 9; i++) {
    x = w * (0.15 + i * 0.1);
    y = h * (0.62 - i * 0.055);
    artGlow(b, x, y, h * (0.16 + (i % 3) * 0.04), i % 2 ? '#8a7cff' : '#b0a0ff', 0.1);
  }
  // Pysyvät tähdet
  for (i = 0; i < 170; i++) {
    x = rnd() * w;
    y = rnd() * h * 0.8;
    r = h * (0.0015 + rnd() * 0.003);
    b.fillStyle = 'rgba(255,255,' + Math.round(220 + rnd() * 35) + ',' + (0.35 + rnd() * 0.5) + ')';
    b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
  }
  // Pilvimeri tornin ympärillä
  for (y = h * 0.8, i = 0; i < 3; i++, y += h * 0.055) {
    for (x = -h * 0.05 + (i % 2) * h * 0.06; x < w + h * 0.1; x += h * 0.13) {
      b.fillStyle = ['#6a5ca8', '#8478c0', '#a49ad6'][i];
      cloudShape(b, x, y + Math.sin(x * 0.01) * h * 0.01, h * (0.05 + i * 0.008));
    }
  }
  b.fillStyle = 'rgba(200,190,255,0.25)';
  for (x = 0; x < w; x += h * 0.2) { b.beginPath(); b.arc(x + h * 0.05, h * 0.83, h * 0.004, 0, Math.PI * 2); b.fill(); }
  // Torni: pyöreä torninhuippu vasemmalla
  tx = h * 0.105;
  artRoundRect(b, tx - h * 0.105, h * 0.3, h * 0.21, L.floorY - h * 0.3 + h * 0.02, h * 0.01, '#5e5490', { lineColor: '#2e2858' });
  b.fillStyle = 'rgba(30,24,70,0.25)';
  for (y = h * 0.34; y < L.floorY; y += h * 0.045) {
    for (x = ((y / (h * 0.045)) % 2) * h * 0.035; x < h * 0.21; x += h * 0.07) b.fillRect(x + h * 0.004, y, h * 0.062, h * 0.004);
  }
  b.beginPath();
  b.moveTo(tx - h * 0.13, h * 0.31);
  b.lineTo(tx, h * 0.13);
  b.lineTo(tx + h * 0.13, h * 0.31);
  b.closePath();
  artFillPath(b, '#7a5cc8', h * 0.13, h * 0.31, h * 0.1, { lineColor: '#3a2a6a' });
  artCircle(b, tx, h * 0.125, h * 0.014, '#ffe27a', { lineColor: '#a07010' });
  // Torniikkuna, jossa lämmin valo
  artGlow(b, tx, h * 0.69, h * 0.1, '#ffd890', 0.35);
  b.beginPath();
  b.moveTo(tx - h * 0.035, h * 0.75);
  b.lineTo(tx - h * 0.035, h * 0.67);
  b.arc(tx, h * 0.67, h * 0.035, Math.PI, 0);
  b.lineTo(tx + h * 0.035, h * 0.75);
  b.closePath();
  artFillPath(b, '#ffd890', h * 0.63, h * 0.75, h * 0.03, { lineColor: '#5a3a2a', flat: true });
  b.strokeStyle = '#5a3a2a';
  b.lineWidth = Math.max(1, h * 0.004);
  b.beginPath(); b.moveTo(tx, h * 0.635); b.lineTo(tx, h * 0.75); b.moveTo(tx - h * 0.035, h * 0.69); b.lineTo(tx + h * 0.035, h * 0.69); b.stroke();
  // Terassin kaide takareunassa
  y = L.floorY;
  b.fillStyle = '#4a4280';
  b.fillRect(h * 0.2, y - h * 0.075, L.terrEnd - h * 0.2, h * 0.016);
  for (x = h * 0.23; x < L.terrEnd - h * 0.01; x += h * 0.045) {
    artRoundRect(b, x - h * 0.008, y - h * 0.06, h * 0.016, h * 0.06, h * 0.006, '#6a60a8', { lineColor: '#2e2858' });
  }
  artRoundRect(b, h * 0.2, y - h * 0.085, L.terrEnd - h * 0.2, h * 0.018, h * 0.008, '#8a80c8', { lineColor: '#2e2858' });
  // Päätypylväs (pöllön paikka)
  artRoundRect(b, L.terrEnd - h * 0.03, L.owl.y + h * 0.01, h * 0.06, L.floorY - L.owl.y, h * 0.01, '#7a70b8', { lineColor: '#2e2858' });
  artRoundRect(b, L.terrEnd - h * 0.04, L.owl.y, h * 0.08, h * 0.02, h * 0.008, '#9a90d8', { lineColor: '#2e2858' });
  // Terassin lattia: kivilaatat
  g = b.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, '#7c72b8');
  g.addColorStop(1, '#5a5094');
  b.fillStyle = g;
  b.fillRect(0, y, L.terrEnd + h * 0.03, h - y);
  b.strokeStyle = 'rgba(40,32,90,0.35)';
  b.lineWidth = Math.max(1, h * 0.003);
  for (i = 1; i < 4; i++) { b.beginPath(); b.moveTo(0, y + i * h * 0.035); b.lineTo(L.terrEnd + h * 0.03, y + i * h * 0.035); b.stroke(); }
  for (x = h * 0.05; x < L.terrEnd; x += h * 0.09) { b.beginPath(); b.moveTo(x, y); b.lineTo(x - h * 0.03, h); b.stroke(); }
  // Tornin reuna pilvien yllä
  artRoundRect(b, L.terrEnd + h * 0.005, y - h * 0.005, h * 0.03, h - y + h * 0.01, h * 0.006, '#4a4280', { lineColor: '#2e2858' });
  b.fillStyle = 'rgba(255,255,255,0.12)';
  b.fillRect(0, y, L.terrEnd + h * 0.03, h * 0.006);
}

// ---------- Piirto: tökättävät ----------
function cstDrawMoon(c, H, p) {
  var r = H * 0.05, y = -H * 0.05, yw = p.yawn > 0 ? Math.sin(Math.min(1, (1.4 - p.yawn) / 0.4) * Math.PI * 0.5) * Math.min(1, p.yawn / 0.3) : 0;
  artGlow(c, 0, y, r * 2.6, '#fff2c0', 0.3);
  c.save();
  c.translate(0, y);
  c.rotate(p.side * 0.6);
  artCircle(c, 0, 0, r, '#fff6d0', { lineColor: '#c8b070', hi: 0.4 });
  c.fillStyle = 'rgba(200,180,120,0.25)';
  c.beginPath(); c.arc(r * 0.4, r * 0.35, r * 0.18, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(-r * 0.45, r * 0.45, r * 0.12, 0, Math.PI * 2); c.fill();
  // Kasvot: unelias, haukottelu avaa suun
  c.strokeStyle = '#8a7040';
  c.lineWidth = Math.max(1.2, r * 0.07);
  c.lineCap = 'round';
  c.beginPath(); c.arc(-r * 0.32, -r * 0.1, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.beginPath(); c.arc(r * 0.32, -r * 0.1, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  if (yw > 0.05) {
    cstEll(c, 0, r * 0.35, r * 0.13 * yw + r * 0.04, r * 0.2 * yw + r * 0.03, 0);
    c.fillStyle = '#8a5040';
    c.fill();
  } else {
    c.beginPath(); c.arc(0, r * 0.25, r * 0.15, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  }
  artBlush(c, -r * 0.55, r * 0.15, r * 0.12);
  artBlush(c, r * 0.55, r * 0.15, r * 0.12);
  c.restore();
  if (p.sideT > 0) cstText(c, 'Z', r * 1.1, y - r * 1.0 - (globalT % 1.4) * r * 0.5, r * 0.5, '#fff6d0', null);
}
function cstDrawClock(c, H, p) {
  var r = H * 0.042, y = -H * 0.05, i, a, k;
  artCircle(c, 0, y, r * 1.15, '#ffe27a', { lineColor: '#a07010' });
  artCircle(c, 0, y, r, '#2a2468', { line: false, flat: true });
  for (i = 0; i < 12; i++) {
    a = i / 12 * Math.PI * 2;
    if (i % 3 === 0) drawStar(c, Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * 0.13, 0, 0);
    else { c.fillStyle = '#fff2c0'; c.beginPath(); c.arc(Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.04, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = '#fff2c0';
  c.lineCap = 'round';
  a = globalT * 0.1 + p.ang;
  c.lineWidth = Math.max(1.5, r * 0.09);
  c.beginPath(); c.moveTo(0, y); c.lineTo(Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); c.stroke();
  a = globalT * 0.6 + p.ang * 3;
  c.lineWidth = Math.max(1.2, r * 0.06);
  c.beginPath(); c.moveTo(0, y); c.lineTo(Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68); c.stroke();
  drawStar(c, Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68, r * 0.12, a, 0);
  artCircle(c, 0, y, r * 0.09, '#ffe27a', { line: false });
  // Tähtikäki ponnahtaa jousella kellon päältä
  if (p.cuck > 0) {
    k = Math.sin(Math.min(1, (1.8 - p.cuck) / 0.3) * Math.PI * 0.5) * Math.min(1, p.cuck / 0.3);
    c.strokeStyle = '#c8b0ff';
    c.lineWidth = Math.max(1, r * 0.05);
    c.beginPath();
    for (i = 0; i <= 8; i++) c.lineTo(Math.sin(i * 1.6) * r * 0.12, y - r * 1.1 - i / 8 * r * 0.9 * k);
    c.stroke();
    drawStar(c, 0, y - r * 1.1 - r * 1.05 * k, r * 0.35, Math.sin(globalT * 8) * 0.3, 0.6);
  }
}
function cstDrawLantern(c, H, p, hanging) {
  var s = H * 0.026, y0 = hanging ? H * 0.07 : -H * 0.08, gl = 0.45 + p.glow * 0.5 + Math.sin(globalT * 3 + p.x) * 0.05;
  c.strokeStyle = '#3a2e6a';
  c.lineWidth = Math.max(1, H * 0.003);
  if (hanging) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, y0 - s * 1.3); c.stroke(); }
  else { artLimb(c, 0, 0, 0, y0 + s * 1.2, H * 0.008, '#5a4a8a', '#2e2858'); }
  artGlow(c, 0, y0, s * (3.2 + p.glow * 2), '#ffd890', gl * 0.6);
  artRoundRect(c, -s * 0.75, y0 - s * 1.0, s * 1.5, s * 2.0, s * 0.45, '#ffe6a0', { lineColor: '#a06a20' });
  c.fillStyle = artRGBA('#fff8d8', Math.min(1, gl));
  cstEll(c, 0, y0, s * 0.4, s * 0.62, 0);
  c.fill();
  artRoundRect(c, -s * 0.9, y0 - s * 1.25, s * 1.8, s * 0.35, s * 0.15, '#7a5cc8', { lineColor: '#3a2a6a' });
  artRoundRect(c, -s * 0.8, y0 + s * 0.95, s * 1.6, s * 0.3, s * 0.12, '#7a5cc8', { lineColor: '#3a2a6a' });
}
function cstDrawOwl(c, H, p) {
  var s = H * 0.036, cy = -s * 0.95, i;
  lkfDrawOwl(c, 0, cy, s, { t: globalT, wave: p.hoot > 0, blink: (globalT % 4) < 0.15, look: Math.sin(globalT * 0.5) * 0.6 });
  // Tähtitieteilijän hattu
  c.beginPath();
  c.moveTo(-s * 0.55, cy - s * 0.72);
  c.lineTo(s * 0.12, cy - s * 1.9);
  c.lineTo(s * 0.55, cy - s * 0.72);
  c.closePath();
  artFillPath(c, '#4a5ad8', cy - s * 1.9, cy - s * 0.72, s * 0.4, { lineColor: '#1a2a6a' });
  for (i = 0; i < 3; i++) drawStar(c, -s * 0.15 + i * s * 0.18, cy - s * (0.95 + (i % 2) * 0.35), s * 0.09, 0, 0);
  artBlob(c, 0, cy - s * 0.72, s * 0.62, s * 0.1, '#4a5ad8', { lineColor: '#1a2a6a' });
  if (p.noGlass <= 0) cstDrawGlasses(c, 0, cy - s * 0.22, s * 0.3);
  if (p.hoot > 0) cstText(c, 'hu-huu', s * 0.2, cy - s * 2.3 - (1.2 - p.hoot) * s * 0.5, s * 0.42, '#fff2c0', '#3a2a6a');
}
function cstDrawGlasses(c, x, y, r) {
  c.strokeStyle = '#ffd24f';
  c.lineWidth = Math.max(1.2, r * 0.25);
  c.beginPath(); c.arc(x - r * 0.95, y, r, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x + r * 0.95, y, r, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x - r * 0.1, y - r * 0.1); c.lineTo(x + r * 0.1, y - r * 0.1); c.stroke();
}
// Kaukoputki: (x, y) = jalustan alapää, ang = putken suunta
function cstDrawScope(c, x, y, s, gold, ang) {
  var col = gold ? '#ffd24f' : '#b8b0d0', line = gold ? '#a07010' : '#6a6488', hx = x, hy = y - s * 0.95;
  artLimb(c, hx, hy, x - s * 0.5, y, s * 0.08, '#8a6040', '#4a2a10');
  artLimb(c, hx, hy, x + s * 0.45, y, s * 0.08, '#8a6040', '#4a2a10');
  artLimb(c, hx, hy, x, y, s * 0.08, '#8a6040', '#4a2a10');
  c.save();
  c.translate(hx, hy);
  c.rotate(ang);
  artRoundRect(c, -s * 0.55, -s * 0.13, s * 1.25, s * 0.26, s * 0.1, col, { lineColor: line, hi: 0.3 });
  artRoundRect(c, s * 0.6, -s * 0.18, s * 0.22, s * 0.36, s * 0.08, artShade(col, -0.1), { lineColor: line });
  artRoundRect(c, -s * 0.7, -s * 0.09, s * 0.2, s * 0.18, s * 0.06, artShade(col, -0.15), { lineColor: line });
  c.restore();
  artCircle(c, hx, hy, s * 0.09, '#5a3a20', { line: false });
}
function cstDrawMusicBox(c, H, p) {
  var w = H * 0.07, h = H * 0.04, op = p.open > 0 ? Math.min(1, p.open * 3, (2.8 - Math.min(2.8, p.open)) * 4 + 0.2) : 0, k = Math.min(1, op);
  artShadow(c, 0, 0, w * 0.7, h * 0.2, 0.2);
  artRoundRect(c, -w / 2, -h, w, h, H * 0.008, '#ff9ec6', { lineColor: '#9a4a6a' });
  c.fillStyle = 'rgba(255,255,255,0.5)';
  for (var i = 0; i < 3; i++) drawStar(c, -w * 0.3 + i * w * 0.3, -h * 0.5, H * 0.007, 0, 0);
  // Kansi ja tähtitanssija
  c.save();
  c.translate(-w / 2, -h);
  c.rotate(-k * 1.4);
  artRoundRect(c, 0, -H * 0.012, w, H * 0.012, H * 0.005, '#ffb8d8', { lineColor: '#9a4a6a' });
  c.restore();
  if (k > 0.2) {
    artLimb(c, 0, -h, 0, -h - H * 0.03 * k, H * 0.004, '#ffe27a', false);
    drawStar(c, 0, -h - H * 0.035 * k, H * 0.014, globalT * 6, 0.5);
  }
  // Veivi
  artLimb(c, w / 2, -h * 0.5, w / 2 + H * 0.012, -h * 0.5 + Math.sin(globalT * (k > 0 ? 8 : 0)) * H * 0.01, H * 0.005, '#ffe27a', '#a07010');
}
function cstDrawSleeper(c, H, p) {
  var s = H * 0.03, aw = p.awake > 0 ? 1 : 0, snore = (Math.sin(globalT * 1.6) + 1) / 2;
  htCloudPuff(c, 0, -s * 0.2, s * 2.4, '#c8c0f0');
  if (p.bow > 0) htMannerPokeRainbow(c, 0, -s * 1.3, s * 1.7, Math.min(1, p.bow));
  trekDrawPup(c, 0, -s * 1.1 - aw * s * 0.3, s, { mood: aw ? 'wow' : 'sleepy', t: globalT, tint: '#e6dcff', squash: aw ? 0 : (snore - 0.5) * 0.08, rain: aw ? 0 : snore * 0.8 });
  if (!aw) cstText(c, 'Z', s * 1.1, -s * 2.0 - (globalT % 1.6) * s * 0.4, s * 0.6, '#d8d0ff', '#3a2e6a');
}
function cstDrawBasket(c, H, p) {
  var w = H * 0.085, h = H * 0.045, n = Math.min(cst.basket, 12), i, x, y, row;
  artShadow(c, 0, 0, w * 0.6, h * 0.25, 0.22);
  // Tähtikasa
  for (i = 0; i < n; i++) {
    row = i < 5 ? 0 : (i < 9 ? 1 : 2);
    x = row === 0 ? (i - 2) * w * 0.19 : (row === 1 ? (i - 6.5) * w * 0.19 : (i - 10) * w * 0.19);
    y = -h * 0.95 - row * h * 0.35;
    drawStar(c, x, y + Math.sin(globalT * 3 + i) * H * 0.002, H * 0.014, i * 0.7, 0);
  }
  if (n > 0) artGlow(c, 0, -h, w * 0.8, '#ffe27a', 0.25);
  c.beginPath();
  c.moveTo(-w / 2, -h);
  c.lineTo(w / 2, -h);
  c.lineTo(w * 0.4, 0);
  c.lineTo(-w * 0.4, 0);
  c.closePath();
  artFillPath(c, '#c8945a', -h, 0, h, { lineColor: '#6a4020' });
  c.strokeStyle = 'rgba(106,64,32,0.5)';
  c.lineWidth = Math.max(1, H * 0.003);
  for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-w / 2 + i * w * 0.02, -h + i * h * 0.25); c.lineTo(w / 2 - i * w * 0.02, -h + i * h * 0.25); c.stroke(); }
  artRoundRect(c, -w * 0.54, -h - H * 0.006, w * 1.08, H * 0.012, H * 0.005, '#dcaa6a', { lineColor: '#6a4020' });
}
function cstDrawStarBunny(c, H, p) {
  var s = H * 0.032, hop = p.hop > 0 ? Math.sin(p.hop / 0.5 * Math.PI) * s * 0.8 : 0, i, a, rf = cst.refill;
  if (rf) hop = Math.abs(Math.sin(rf.t * 9)) * s * 0.9;
  c.save();
  if (p.wheel > 0) { c.translate(0, -s); c.rotate((1 - p.wheel / 0.9) * Math.PI * 2); c.translate(0, s); }
  drawBunny(c, 0, 0, s, hop, globalT * 3, false);
  drawStar(c, s * 0.05, -s * 2.05 - hop, s * 0.3, Math.sin(globalT * 2) * 0.3, 0.3);
  c.restore();
  // Jongleeraus
  if (p.jug > 0) {
    for (i = 0; i < 3; i++) {
      a = globalT * 6 + i * Math.PI * 2 / 3;
      drawStar(c, Math.cos(a) * s * 0.6, -s * 2.6 - Math.abs(Math.sin(a)) * s * 1.2, s * 0.25, a, 0.3);
    }
  }
  // Uusi korillinen: tähdet lentävät pupun tassuista koriin
  if (rf) {
    for (i = 0; i < 3; i++) {
      a = Math.max(0, Math.min(1, (rf.t - 0.3 - i * 0.25) / 0.6));
      if (a <= 0 || a >= 1) continue;
      drawStar(c, (cst.L.basket.x - cst.L.bunny.x) * a, -s * 2 - Math.sin(a * Math.PI) * s * 1.5 + a * s * 1, s * 0.3, a * 6, 0.5);
    }
  }
}

// ---------- Piirto: kuviot ----------
// Hengen kuva paikallisissa koordinaateissa: P = pisteet (px), S = mittakaava,
// open = silmät auki (herännyt)
function cstDrawArt(c, fig, P, S, open) {
  var k = fig.key, col = fig.sh.col, t = fig.at, i, a, x, y;
  if (k === 'fish') {
    x = (P[1].x + P[3].x) / 2 + S * 0.05;
    y = (P[0].y + P[2].y) / 2;
    a = Math.sin(t * 9) * 0.3 * fig.k;
    c.beginPath();
    c.moveTo(P[3].x + S * 0.05, P[3].y);
    c.lineTo(P[3].x - S * 0.45, P[3].y - S * 0.45 + a * S);
    c.quadraticCurveTo(P[3].x - S * 0.3, P[3].y, P[3].x - S * 0.45, P[3].y + S * 0.45 + a * S);
    c.closePath();
    cstPaint(c, col, S);
    cstEll(c, x, y, (P[1].x - P[3].x) / 2 * 1.05, (P[2].y - P[0].y) / 2 * 0.92, 0);
    cstPaint(c, col, S);
    c.beginPath(); c.moveTo(x - S * 0.1, P[0].y + S * 0.08); c.quadraticCurveTo(x + S * 0.05, P[0].y - S * 0.3, x + S * 0.3, P[0].y + S * 0.12); cstPaint(c, col, S);
    c.strokeStyle = col;
    c.lineWidth = Math.max(1, S * 0.025);
    c.beginPath(); c.arc(P[1].x - S * 0.55, y, S * 0.3, -0.9, 0.9); c.stroke();
    cstEye(c, P[1].x - S * 0.32, y - S * 0.1, S * 0.09, open);
    return;
  }
  if (k === 'bird') {
    x = (P[0].x + P[2].x) / 2 + S * 0.1;
    y = (P[1].y * 0 + P[3].y + P[0].y) / 2;
    // Pyrstö
    for (i = -1; i <= 1; i++) { cstEll(c, P[2].x + S * 0.2, P[2].y + i * S * 0.08, S * 0.28, S * 0.08, i * 0.35); cstPaint(c, col, S); }
    cstEll(c, x, y, S * 0.58, S * 0.3, -0.1);
    cstPaint(c, col, S);
    // Siipi pisteeseen 2
    c.beginPath();
    c.moveTo(x - S * 0.35, y - S * 0.05);
    c.quadraticCurveTo((x + P[1].x) / 2 - S * 0.2, (y + P[1].y) / 2, P[1].x, P[1].y);
    c.quadraticCurveTo((x + P[1].x) / 2 + S * 0.3, (y + P[1].y) / 2 + S * 0.1, x + S * 0.25, y - S * 0.05);
    c.closePath();
    cstPaint(c, col, S);
    artCircle(c, P[0].x - S * 0.28, P[0].y + S * 0.05, S * 0.22, cstDim(col), { lineColor: col, flat: true, line: Math.max(1.2, S * 0.03) });
    c.beginPath(); c.moveTo(P[0].x - S * 0.1, P[0].y - S * 0.04); c.lineTo(P[0].x + S * 0.06, P[0].y + S * 0.05); c.lineTo(P[0].x - S * 0.1, P[0].y + S * 0.12); c.closePath();
    cstPaint(c, '#ffb040', S);
    cstEye(c, P[0].x - S * 0.28, P[0].y, S * 0.07, open);
    return;
  }
  if (k === 'heart') {
    a = Math.abs(P[1].x - P[3].x) / 1.5;
    cstHeartPath(c, (P[1].x + P[3].x) / 2, (P[0].y + P[2].y) / 2 + S * 0.02, a * 1.18);
    cstPaint(c, col, S);
    cstEye(c, -S * 0.25, -S * 0.12, S * 0.09, open);
    cstEye(c, S * 0.25, -S * 0.12, S * 0.09, open);
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1.2, S * 0.035);
    c.beginPath(); c.arc(0, S * 0.08, S * 0.13, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    return;
  }
  if (k === 'bunny') {
    cstEll(c, P[1].x - S * 0.16, (P[1].y + P[2].y) / 2 - S * 0.05, S * 0.11, Math.hypot(P[1].x - P[2].x, P[1].y - P[2].y) * 0.48, Math.atan2(P[1].x - P[2].x - S * 0.2, -(P[1].y - P[2].y)) * 0.8);
    cstPaint(c, col, S);
    cstEll(c, P[3].x + S * 0.05, P[3].y - S * 0.02, S * 0.15, S * 0.14, 0);
    cstPaint(c, col, S);
    cstEll(c, -S * 0.15, S * 0.22, S * 0.62, S * 0.48, -0.15);
    cstPaint(c, col, S);
    cstEll(c, P[4].x + S * 0.05, P[4].y - S * 0.06, S * 0.25, S * 0.1, 0);
    cstPaint(c, col, S);
    cstEll(c, P[5].x - S * 0.02, P[5].y - S * 0.06, S * 0.13, S * 0.09, 0);
    cstPaint(c, col, S);
    // Pää ja etummainen korva
    cstEll(c, (P[1].x + P[2].x) / 2 + S * 0.05, (P[1].y + P[2].y) / 2, S * 0.12, Math.hypot(P[1].x - P[2].x, P[1].y - P[2].y) * 0.55, Math.atan2(P[1].x - P[2].x, -(P[1].y - P[2].y)));
    cstPaint(c, col, S);
    cstEll(c, P[0].x - S * 0.35, P[0].y + S * 0.02, S * 0.36, S * 0.3, 0);
    cstPaint(c, col, S);
    cstEye(c, P[0].x - S * 0.32, P[0].y - S * 0.05, S * 0.08, open);
    artCircle(c, P[0].x - S * 0.02, P[0].y + S * 0.02, S * 0.05, '#ff9ec6', { line: false, flat: true });
    return;
  }
  if (k === 'whale') {
    c.beginPath();
    c.moveTo(P[1].x + S * 0.1, P[1].y - S * 0.05);
    c.lineTo(P[0].x, P[0].y);
    c.quadraticCurveTo(P[0].x + S * 0.05, P[1].y, P[0].x + S * 0.02, P[1].y + (P[1].y - P[0].y) * 0.8);
    c.closePath();
    cstPaint(c, col, S);
    cstEll(c, S * 0.08, S * 0.02, S * 0.8, S * 0.42, 0.02);
    cstPaint(c, col, S);
    c.strokeStyle = col;
    c.lineWidth = Math.max(1, S * 0.025);
    for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(S * (-0.2 + i * 0.25), S * 0.25); c.lineTo(S * (-0.1 + i * 0.25), S * 0.38); c.stroke(); }
    c.beginPath(); c.moveTo(S * 0.45, S * 0.12); c.quadraticCurveTo(S * 0.65, S * 0.2, S * 0.85, S * 0.06); c.stroke();
    cstEye(c, S * 0.55, -S * 0.08, S * 0.08, open);
    cstEll(c, S * 0.0, S * 0.3, S * 0.18, S * 0.07, 0.5);
    cstPaint(c, col, S);
    return;
  }
  if (k === 'star5') {
    c.beginPath();
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5;
      x = i % 2 ? Math.cos(a) * S * 0.42 : Math.cos(a) * S * 1.0;
      y = i % 2 ? Math.sin(a) * S * 0.42 : Math.sin(a) * S * 1.0;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    cstPaint(c, col, S);
    cstEye(c, -S * 0.15, -S * 0.05, S * 0.08, open);
    cstEye(c, S * 0.15, -S * 0.05, S * 0.08, open);
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1.2, S * 0.03);
    c.beginPath(); c.arc(0, S * 0.08, S * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    return;
  }
  if (k === 'pony') { cstDrawHorse(c, P, S, t, { n: 0, e: 1, w: 2, tl: 3, hl: 4, b: 5, fl: 6, horn: -1, col: col, mane: ['#ff9ec6', '#ffd27a'] }, open, fig.k); return; }
  if (k === 'unicorn') { cstDrawHorse(c, P, S, t, { n: 0, e: 2, w: 3, tl: 4, hl: 5, b: 6, fl: 7, horn: 1, col: col, mane: RAINBOW_COLORS }, open, fig.k); return; }
  if (k === 'castle') {
    // Tornit, katot ja liput
    cstCastleTower(c, P[1], -S * 0.15, S * 0.32, P[0].y, col, S, t, open, 0);
    cstCastleTower(c, P[5], -S * 0.15, S * 0.32, P[6].y, col, S, t, open, 2);
    c.beginPath();
    c.rect(P[2].x - S * 0.05, P[2].y, P[4].x - P[2].x + S * 0.1, P[0].y - P[2].y);
    cstPaint(c, col, S);
    for (i = 0; i < 4; i++) { c.beginPath(); c.rect(P[2].x - S * 0.05 + i * S * 0.19, P[2].y - S * 0.08, S * 0.1, S * 0.08); cstPaint(c, col, S); }
    cstCastleTower(c, P[3], -S * 0.12, S * 0.3, P[2].y + S * 0.05, col, S, t, open, 1);
    c.beginPath();
    c.moveTo(-S * 0.14, P[0].y);
    c.lineTo(-S * 0.14, P[0].y - S * 0.25);
    c.arc(0, P[0].y - S * 0.25, S * 0.14, Math.PI, 0);
    c.lineTo(S * 0.14, P[0].y);
    c.closePath();
    c.fillStyle = open ? '#ffd890' : cstDim('#ffd890');
    c.fill();
    return;
  }
  if (k === 'rocket') {
    // Liekki
    if (fig.k > 0.2) {
      a = 0.7 + Math.sin(t * 30) * 0.3;
      c.beginPath(); c.moveTo(-S * 0.22, S * 0.45); c.lineTo(0, S * (0.7 + a * 0.5)); c.lineTo(S * 0.22, S * 0.45); c.closePath();
      c.fillStyle = '#ffd27a'; c.fill();
      c.beginPath(); c.moveTo(-S * 0.12, S * 0.45); c.lineTo(0, S * (0.6 + a * 0.3)); c.lineTo(S * 0.12, S * 0.45); c.closePath();
      c.fillStyle = '#fff6d0'; c.fill();
    }
    c.beginPath(); c.moveTo(S * 0.28, S * 0.05); c.lineTo(P[2].x, P[2].y); c.lineTo(S * 0.3, S * 0.5); c.closePath(); cstPaint(c, col, S);
    c.beginPath(); c.moveTo(-S * 0.28, S * 0.05); c.lineTo(P[4].x, P[4].y); c.lineTo(-S * 0.3, S * 0.5); c.closePath(); cstPaint(c, col, S);
    c.beginPath();
    c.moveTo(P[0].x, P[0].y);
    c.quadraticCurveTo(S * 0.38, -S * 0.65, S * 0.34, -S * 0.2);
    c.lineTo(S * 0.3, S * 0.5);
    c.lineTo(-S * 0.3, S * 0.5);
    c.lineTo(-S * 0.34, -S * 0.2);
    c.quadraticCurveTo(-S * 0.38, -S * 0.65, P[0].x, P[0].y);
    c.closePath();
    cstPaint(c, '#e8e0ff', S);
    artCircle(c, 0, -S * 0.15, S * 0.17, '#2a3a8a', { lineColor: col, flat: true, line: Math.max(1.2, S * 0.04) });
    // Ikkunassa pupu
    if (open) {
      drawBunny(c, 0, -S * 0.08, S * 0.09, 0, globalT * 3, true);
    }
    c.beginPath(); c.moveTo(-S * 0.3, S * 0.3); c.lineTo(S * 0.3, S * 0.3); c.strokeStyle = col; c.lineWidth = Math.max(1, S * 0.03); c.stroke();
    return;
  }
  if (k === 'dragon') {
    // Siipi (takana), häntä, jalat, vartalo, kaula ja pää
    c.beginPath();
    c.moveTo(P[1].x - S * 0.1, P[1].y);
    c.quadraticCurveTo((P[1].x + P[2].x) / 2 + S * 0.15, (P[1].y + P[2].y) / 2 - S * 0.1, P[2].x, P[2].y);
    c.quadraticCurveTo(P[2].x - S * 0.05, (P[2].y + P[3].y) / 2, P[3].x, P[3].y);
    c.quadraticCurveTo((P[3].x + P[1].x) / 2, P[3].y - S * 0.1, P[1].x - S * 0.1, P[1].y);
    c.closePath();
    cstPaint(c, '#c8a0ff', S);
    cstLimb(c, -S * 0.2, S * 0.25, P[4].x, P[4].y, S * 0.2, col, S);
    cstLimb(c, P[4].x, P[4].y, P[5].x + S * 0.08, P[5].y, S * 0.11, col, S);
    c.beginPath(); c.moveTo(P[5].x + S * 0.05, P[5].y - S * 0.08); c.lineTo(P[5].x - S * 0.12, P[5].y); c.lineTo(P[5].x + S * 0.05, P[5].y + S * 0.08); c.closePath(); cstPaint(c, '#ff9ec6', S);
    cstLimb(c, -S * 0.1, S * 0.35, P[6].x, P[6].y, S * 0.12, col, S);
    cstLimb(c, S * 0.25, S * 0.3, P[7].x, P[7].y, S * 0.12, col, S);
    cstEll(c, S * 0.05, S * 0.2, S * 0.42, S * 0.28, -0.1);
    cstPaint(c, col, S);
    cstLimb(c, S * 0.3, S * 0.05, P[1].x, P[1].y - S * 0.05, S * 0.2, col, S);
    cstLimb(c, P[1].x, P[1].y - S * 0.05, P[0].x - S * 0.25, P[0].y + S * 0.02, S * 0.2, col, S);
    cstEll(c, P[0].x - S * 0.18, P[0].y + S * 0.02, S * 0.26, S * 0.17, 0.15);
    cstPaint(c, col, S);
    for (i = 0; i < 2; i++) {
      c.beginPath(); c.moveTo(P[0].x - S * (0.35 - i * 0.12), P[0].y - S * 0.1); c.lineTo(P[0].x - S * (0.42 - i * 0.12), P[0].y - S * 0.32); c.lineTo(P[0].x - S * (0.27 - i * 0.12), P[0].y - S * 0.12); c.closePath();
      cstPaint(c, '#ffe27a', S);
    }
    cstEye(c, P[0].x - S * 0.2, P[0].y - S * 0.03, S * 0.07, open);
    return;
  }
}
// Linnan torni: huippu (katon kärki) p, leveys w, pohja yb
function cstCastleTower(c, p, x0, w, yb, col, S, t, open, idx) {
  var y0 = p.y + S * 0.32, f = Math.sin(t * 6 + idx) * S * 0.04;
  c.beginPath(); c.rect(p.x + x0, y0, w, yb - y0); cstPaint(c, col, S);
  c.beginPath(); c.moveTo(p.x + x0 - S * 0.06, y0 + S * 0.01); c.lineTo(p.x, p.y); c.lineTo(p.x + x0 + w + S * 0.06, y0 + S * 0.01); c.closePath();
  cstPaint(c, '#ff9ec6', S);
  // Lippu
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1, S * 0.02);
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - S * 0.22); c.stroke();
  c.beginPath(); c.moveTo(p.x, p.y - S * 0.22); c.quadraticCurveTo(p.x + S * 0.1, p.y - S * 0.2 + f, p.x + S * 0.2, p.y - S * 0.17 + f * 1.5); c.lineTo(p.x, p.y - S * 0.12); c.closePath();
  c.fillStyle = ['#ffe27a', '#9fd8ff', '#b8f0a0'][idx];
  c.fill();
  // Ikkuna
  c.beginPath();
  c.arc(p.x + x0 + w / 2, y0 + S * 0.2, S * 0.06, Math.PI, 0);
  c.lineTo(p.x + x0 + w / 2 + S * 0.06, y0 + S * 0.3);
  c.lineTo(p.x + x0 + w / 2 - S * 0.06, y0 + S * 0.3);
  c.closePath();
  c.fillStyle = open ? '#ffd890' : cstDim('#ffd890');
  c.fill();
}
// Hevonen (poni ja yksisarvinen): o = pisteiden roolit
function cstDrawHorse(c, P, S, t, o, open, k) {
  var col = o.col, hip = { x: -S * 0.45, y: S * 0.1 }, sh = { x: S * 0.22, y: S * 0.12 }, sw = Math.sin(t * 12) * k, hc, ang, i, nose = P[o.n], ear = P[o.e], m, mx, my;
  // Kauemmat jalat
  cstLimb(c, hip.x + S * 0.08, hip.y, P[o.hl].x + S * 0.2 + sw * S * 0.35, P[o.hl].y - S * 0.03, S * 0.1, artShade(col, -0.25), S);
  cstLimb(c, sh.x - S * 0.06, sh.y, P[o.fl].x - S * 0.2 - sw * S * 0.35, P[o.fl].y - S * 0.03, S * 0.1, artShade(col, -0.25), S);
  // Häntä
  for (i = 0; i < o.mane.length && i < 3; i++) {
    c.strokeStyle = o.mane[(i * 2) % o.mane.length];
    c.lineWidth = Math.max(2, S * (0.1 - i * 0.02));
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-S * 0.72, -S * 0.08);
    c.quadraticCurveTo((P[o.tl].x - S * 0.72) / 2 - S * 0.1, P[o.tl].y - S * 0.15 + i * S * 0.06, P[o.tl].x, P[o.tl].y + i * S * 0.08);
    c.stroke();
  }
  cstEll(c, -S * 0.2, S * 0.0, S * 0.58, S * 0.3, 0);
  cstPaint(c, col, S);
  // Kaula ja pää
  hc = { x: nose.x * 0.6 + ear.x * 0.4, y: nose.y * 0.6 + ear.y * 0.4 + S * 0.12 };
  cstLimb(c, S * 0.15, -S * 0.02, hc.x - S * 0.1, hc.y + S * 0.03, S * 0.24, col, S);
  ang = Math.atan2(nose.y - hc.y, nose.x - hc.x);
  cstEll(c, hc.x + S * 0.05, hc.y, S * 0.3, S * 0.17, ang * 0.6);
  cstPaint(c, col, S);
  c.beginPath(); c.moveTo(ear.x - S * 0.07, hc.y - S * 0.1); c.lineTo(ear.x, ear.y); c.lineTo(ear.x + S * 0.08, hc.y - S * 0.12); c.closePath();
  cstPaint(c, col, S);
  // Sarvi
  if (o.horn >= 0) {
    m = P[o.horn];
    mx = hc.x + S * 0.12;
    my = hc.y - S * 0.12;
    c.beginPath(); c.moveTo(mx - S * 0.06, my); c.lineTo(m.x, m.y); c.lineTo(mx + S * 0.06, my + S * 0.02); c.closePath();
    cstPaint(c, '#ffe27a', S);
    c.strokeStyle = '#fff6d0';
    c.lineWidth = Math.max(1, S * 0.02);
    for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(mx + (m.x - mx) * i / 4 - S * 0.04, my + (m.y - my) * i / 4); c.lineTo(mx + (m.x - mx) * i / 4 + S * 0.04, my + (m.y - my) * i / 4 + S * 0.03); c.stroke(); }
  }
  // Harja
  for (i = 0; i < 4; i++) {
    c.strokeStyle = o.mane[i % o.mane.length];
    c.lineWidth = Math.max(2, S * 0.07);
    c.lineCap = 'round';
    mx = ear.x - S * 0.05 + (P[o.w].x - ear.x) * i / 3.5;
    my = hc.y - S * 0.12 + (P[o.w].y - hc.y + S * 0.1) * i / 3.5;
    c.beginPath(); c.moveTo(mx, my); c.quadraticCurveTo(mx - S * 0.12, my + S * 0.02 + Math.sin(t * 8 + i) * S * 0.03 * k, mx - S * 0.18, my + S * 0.12); c.stroke();
  }
  // Lähemmät jalat
  cstLimb(c, hip.x, hip.y + S * 0.05, P[o.hl].x, P[o.hl].y - S * 0.03, S * 0.11, col, S);
  cstLimb(c, sh.x, sh.y + S * 0.05, P[o.fl].x, P[o.fl].y - S * 0.03, S * 0.11, col, S);
  cstEll(c, P[o.hl].x, P[o.hl].y - S * 0.02, S * 0.08, S * 0.05, 0);
  cstPaint(c, '#c8a0ff', S);
  cstEll(c, P[o.fl].x, P[o.fl].y - S * 0.02, S * 0.08, S * 0.05, 0);
  cstPaint(c, '#c8a0ff', S);
  cstEye(c, hc.x + S * 0.08, hc.y - S * 0.04, S * 0.06, open);
  artCircle(c, nose.x - S * 0.06, nose.y + S * 0.03, S * 0.025, '#ffffff', { line: false, flat: true });
}
// Kuvio kokonaisuudessaan: henki, viivat, tähdet ja numerot
function cstDrawFig(c, fig) {
  var H = viewH, S = fig.S, n = fig.N, i, j, P = [], W = [], lp, play = fig.state === 'play', placed = 0, a, ed, e0, e1, k, nx, pulse, p, q, r, glowA, open, sc = fig.sc;
  for (i = 0; i < n; i++) {
    lp = cstLocal(fig, i);
    P.push({ x: lp[0] * S, y: lp[1] * S });
    W.push(cstWorld(fig, i));
    if (fig.placed[i]) placed++;
  }
  open = fig.state !== 'play' && fig.wake > 0.5;
  // Henki: kuultaa sitä selvemmin, mitä useampi tähti on paikallaan
  a = play ? 0.18 * Math.pow(placed / n, 1.6) : (fig.state === 'alive' ? Math.min(1, fig.aliveT / 0.7) : 1);
  if (cst.flow === 'wake' && play) a = 0.18 + Math.min(1, cst.flowT / 0.45) * 0.3;
  if (!play) artGlow(c, fig.x, fig.y, S * sc * 1.7, fig.sh.col, 0.22 * a);
  if (a > 0.01) {
    c.save();
    c.translate(fig.x, fig.y);
    c.rotate(fig.rot);
    c.scale(sc, sc);
    c.globalAlpha = a;
    cstDrawArt(c, fig, P, S, open);
    c.restore();
    c.globalAlpha = 1;
  }
  // Viivat
  ed = [];
  for (i = 1; i < n; i++) ed.push([i - 1, i, true]);
  if (fig.sh.close) ed.push([n - 1, 0, false]);
  for (i = 0; i < fig.sh.extra.length; i++) ed.push([fig.sh.extra[i][0], fig.sh.extra[i][1], false]);
  c.lineCap = 'round';
  for (i = 0; i < ed.length; i++) {
    e0 = ed[i][0]; e1 = ed[i][1];
    p = W[e0]; q = W[e1];
    if (fig.placed[e0] && fig.placed[e1]) {
      k = ed[i][2] ? fig.lineT[e1] : (play ? 0 : 1);
      if (!ed[i][2] && play) continue;
      if (k <= 0) continue;
      glowA = play ? 0.35 : 0.5 + Math.sin(globalT * 4 + i) * 0.15;
      c.strokeStyle = artRGBA('#fff2a8', glowA);
      c.lineWidth = Math.max(3, H * 0.014 * sc);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k); c.stroke();
      c.strokeStyle = '#fffbe0';
      c.lineWidth = Math.max(1.5, H * 0.005 * sc);
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k); c.stroke();
    } else if (play) {
      // Haalea ääriviiva: pisteviiva
      c.fillStyle = 'rgba(200,200,255,0.3)';
      r = Math.hypot(q.x - p.x, q.y - p.y);
      nx = Math.max(2, Math.floor(r / (H * 0.022)));
      for (j = 1; j < nx; j++) { c.beginPath(); c.arc(p.x + (q.x - p.x) * j / nx, p.y + (q.y - p.y) * j / nx, Math.max(1, H * 0.003), 0, Math.PI * 2); c.fill(); }
    }
  }
  // Tähdet ja numerot
  for (i = 0; i < n; i++) {
    p = W[i];
    if (fig.placed[i]) {
      k = fig.pop[i] > 0 ? 1 + Math.sin(fig.pop[i] / 0.45 * Math.PI) * 0.6 : 1;
      drawStar(c, p.x, p.y, H * 0.022 * k * (play ? 1 : Math.max(0.5, sc)) * (0.92 + Math.sin(globalT * 3 + i) * 0.08), Math.sin(globalT + i) * 0.2, play ? 0.4 : 0.6);
      continue;
    }
    if (!play) continue;
    // Tyhjä paikka: ponnahtaa esiin kierroksen alussa
    k = easeOutBack(Math.min(1, Math.max(0, (fig.introT - 0.25 - i * 0.12) / 0.3)));
    if (k <= 0) continue;
    nx = i === fig.next;
    j = fig.wob[i] > 0 ? Math.sin(fig.wob[i] * 30) * H * 0.006 : 0;
    pulse = nx ? 1 + Math.sin(globalT * 5) * 0.12 : 1;
    r = H * (nx ? 0.03 : 0.022) * k * pulse;
    if (nx) {
      artGlow(c, p.x, p.y, r * 2.4, '#fff2a8', 0.45 + Math.sin(globalT * 5) * 0.15);
      c.strokeStyle = 'rgba(255,240,160,0.9)';
      c.lineWidth = Math.max(2, H * 0.005);
      c.beginPath(); c.arc(p.x + j, p.y, r, 0, Math.PI * 2); c.stroke();
    } else {
      c.strokeStyle = 'rgba(200,200,255,0.55)';
      c.lineWidth = Math.max(1.5, H * 0.003);
      c.beginPath(); c.arc(p.x + j, p.y, r, 0, Math.PI * 2); c.stroke();
    }
    cstText(c, String(i + 1), p.x + j, p.y + H * 0.002, H * (nx ? 0.034 : 0.026) * k, nx ? '#fff6c0' : 'rgba(220,220,255,0.8)', nx ? '#5a3a8a' : null);
  }
}

// ---------- Piirto: taivas ----------
function cstDrawSkyFx(c) {
  var W = viewW, H = viewH, i, j, t = globalT, s, a, x, y, cols, k, dance = cst.auroraDance > 0 ? 1 : 0;
  // Revontulet
  cols = cst.auroraPink > 0.5 ? ['#ff9fe0', '#c8a0ff', '#ffb0d0'] : ['#7fffc8', '#7fd8ff', '#b0ffa0'];
  k = 0.08 + cst.auroraK * 0.12 + dance * 0.06;
  c.lineCap = 'round';
  for (j = 0; j < 3; j++) {
    c.strokeStyle = artRGBA(cols[j], k);
    c.lineWidth = H * (0.05 - j * 0.01);
    c.beginPath();
    for (i = 0; i <= 18; i++) {
      x = W * (0.2 + i / 18 * 0.8);
      y = H * (0.07 + j * 0.035) + Math.sin(i * 0.6 + t * (0.5 + j * 0.2) + j) * H * (0.025 + dance * 0.03) + Math.sin(i * 1.3 - t * 0.7) * H * 0.01;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  // Tuikkivat tähdet
  for (i = 0; i < cst.tw.length; i++) {
    s = cst.tw[i];
    a = 0.4 + Math.sin(t * 2 + s.ph) * 0.4;
    if (a < 0.1) continue;
    c.fillStyle = 'rgba(255,250,220,' + a + ')';
    c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill();
    if (a > 0.7) {
      c.strokeStyle = 'rgba(255,250,220,' + (a - 0.6) + ')';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(s.x - s.r * 3, s.y); c.lineTo(s.x + s.r * 3, s.y); c.moveTo(s.x, s.y - s.r * 3); c.lineTo(s.x, s.y + s.r * 3); c.stroke();
    }
  }
}
function cstDrawShooter(c) {
  var sh = cst.shoot, p, k, i, tx, ty, H = viewH;
  if (!sh) return;
  p = cstShootPos(sh);
  k = sh.t / sh.dur;
  tx = sh.x1 - sh.x0;
  ty = sh.y1 - sh.y0;
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    c.strokeStyle = 'rgba(255,245,200,' + (0.35 - i * 0.1) + ')';
    c.lineWidth = H * (0.012 - i * 0.003);
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - tx * (0.08 + i * 0.05), p.y - ty * (0.08 + i * 0.05) - H * 0.01); c.stroke();
  }
  drawStar(c, p.x, p.y, H * 0.022 * (sh.hit ? 1.5 : 1), globalT * 8, 1);
  if (!sh.hit && Math.random() < 0.5) spawnSparkles(p.x, p.y, 1, '#fff2a8');
}
function cstDrawCloud(c) {
  var cl = cst.cloud, H = viewH, s, eat, gig, x, y;
  if (!cl) return;
  x = cl.x;
  y = cl.y;
  eat = cl.eatT > 0 ? Math.sin((0.9 - cl.eatT) / 0.9 * Math.PI) : 0;
  gig = cl.gigT > 0 || cl.pokeT > 0 ? Math.sin(globalT * 30) * H * 0.003 : 0;
  s = H * 0.032 * (1 + eat * 0.15);
  c.save();
  c.translate(x + gig, y);
  trekDrawPup(c, 0, 0, s * 1.15, { mood: eat > 0.2 ? 'happy' : (cl.gigT > 0 || cl.pokeT > 0 ? 'happy' : 'wow'), t: globalT, tint: '#f4f0ff', squint: cl.gigT > 0 || cl.pokeT > 0, look: -0.6, squash: eat * 0.12 });
  c.restore();
  if (cl.gigT > 0) cstText(c, 'hi hi', x + H * 0.03, y - H * 0.08 - (1.2 - cl.gigT) * H * 0.03, H * 0.024, '#ffffff', '#5a4a9a');
}
function cstDrawWind(c) {
  var H = viewH, i, s, a, dir = cst.wind >= 0 ? 1 : -1, ax, ay, k, L = cst.L;
  if (!cst.wind) return;
  c.lineCap = 'round';
  for (i = 0; i < cst.streaks.length; i++) {
    s = cst.streaks[i];
    if (s.leaf) {
      drawStar(c, s.x, s.y + Math.sin(s.t * 6 + s.ph) * H * 0.012, H * 0.007, s.t * 8, 0);
    } else {
      c.strokeStyle = 'rgba(220,230,255,0.28)';
      c.lineWidth = Math.max(1.5, H * 0.004);
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - dir * s.len, s.y + Math.sin(s.t * 3) * H * 0.006); c.stroke();
    }
  }
  // Nuoli taivaalla: tähtipölystä, sykkii tuulen suuntaan
  ax = L.fork.x + H * 0.42;
  ay = H * 0.31;
  k = (globalT * 1.2) % 1;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(3, H * 0.01);
  c.beginPath(); c.moveTo(ax - dir * H * 0.06, ay); c.lineTo(ax + dir * H * 0.06, ay); c.stroke();
  c.beginPath(); c.moveTo(ax + dir * H * 0.03, ay - H * 0.03); c.lineTo(ax + dir * H * 0.065, ay); c.lineTo(ax + dir * H * 0.03, ay + H * 0.03); c.stroke();
  for (i = 0; i < 3; i++) {
    a = (k + i / 3) % 1;
    c.fillStyle = 'rgba(255,240,170,' + (1 - a) + ')';
    c.beginPath(); c.arc(ax - dir * H * 0.06 + dir * a * H * 0.14, ay, H * 0.006, 0, Math.PI * 2); c.fill();
  }
  // Kuunsirpin kasvot puhaltavat (pieni pilvi nuolen takana)
  htCloudPuff(c, ax - dir * H * 0.11, ay, H * 0.05, '#e8e4ff');
}
function cstDrawTrail(c) {
  var i, n = cst.trail.length, p, a, H = viewH, fade = cst.shots.length ? 1 : Math.max(0, 1 - cst.trailT / 12);
  if (!n || fade <= 0) return;
  for (i = 0; i < n; i++) {
    p = cst.trail[i];
    a = (0.15 + 0.25 * (i / n)) * fade;
    c.fillStyle = 'rgba(255,240,200,' + a + ')';
    c.beginPath(); c.arc(p.x, p.y, Math.max(1.2, H * 0.004), 0, Math.PI * 2); c.fill();
  }
}

// ---------- Piirto: ritsa ja tähdet ----------
function cstDrawSling(c) {
  var L = cst.L, H = viewH, f = L.fork, r = H * 0.05, v = null, pouch, aiming = cst.aim.active, tl, tr, ready;
  if (aiming) v = cstLaunchVel(cst.aim.dx, cst.aim.dy);
  pouch = { x: f.x + (v ? v.px : 0), y: f.y + (v ? v.py : 0) };
  tl = { x: f.x - r * 0.95, y: f.y - r * 0.2 };
  tr = { x: f.x + r * 0.95, y: f.y - r * 0.2 };
  // Jalusta
  artLimb(c, f.x, f.y + r * 0.9, f.x, L.floorY + H * 0.02, H * 0.018, '#8a80c8', '#2e2858');
  artRoundRect(c, f.x - H * 0.04, L.floorY + H * 0.005, H * 0.08, H * 0.025, H * 0.01, '#9a90d8', { lineColor: '#2e2858' });
  // Takakuminauha
  c.strokeStyle = 'rgba(190,220,255,0.9)';
  c.lineWidth = Math.max(2, H * 0.006);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(tl.x, tl.y); c.lineTo(pouch.x, pouch.y); c.stroke();
  // Kuunsirppi: sarvet ylöspäin
  artGlow(c, f.x, f.y + r * 0.2, r * 2.2, '#fff2a8', 0.25);
  c.beginPath();
  c.arc(f.x, f.y - r * 0.2, r, 0.05 * Math.PI, 0.95 * Math.PI, false);
  c.arc(f.x, f.y - r * 0.55, r * 0.92, 0.88 * Math.PI, 0.12 * Math.PI, true);
  c.closePath();
  artFillPath(c, '#ffe27a', f.y - r * 0.2, f.y + r * 0.8, r, { lineColor: '#a07010', shadeTo: '#ffb62e' });
  // Sirpin kasvot
  c.strokeStyle = '#a07010';
  c.lineWidth = Math.max(1.2, r * 0.06);
  c.beginPath(); c.arc(f.x - r * 0.25, f.y + r * 0.45, r * 0.08, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.beginPath(); c.arc(f.x + r * 0.25, f.y + r * 0.45, r * 0.08, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.beginPath(); c.arc(f.x, f.y + r * 0.55, r * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  ready = cst.basket > 0 && cst.reload <= 0 && cst.flow === 'play' && cst.fig.state === 'play';
  if (ready) drawStar(c, pouch.x, pouch.y, H * 0.024 * (aiming ? 1.1 : 1 + Math.sin(globalT * 4) * 0.05), aiming ? 0 : Math.sin(globalT * 2) * 0.2, 0.7);
  // Etukuminauha
  c.strokeStyle = 'rgba(220,240,255,0.95)';
  c.lineWidth = Math.max(2, H * 0.006);
  c.beginPath(); c.moveTo(tr.x, tr.y); c.lineTo(pouch.x, pouch.y); c.stroke();
  artCircle(c, tl.x, tl.y, H * 0.007, '#fff6d0', { line: false });
  artCircle(c, tr.x, tr.y, H * 0.007, '#fff6d0', { line: false });
}
function cstDrawShots(c) {
  var i, j, s, p, k, H = viewH, L = cst.L, rt, x, y;
  for (i = 0; i < cst.shots.length; i++) {
    s = cst.shots[i];
    if (s.state === 'fly' || s.state === 'fall') {
      for (j = 0; j < s.trail.length; j++) {
        p = s.trail[j];
        c.fillStyle = 'rgba(255,240,170,' + (j / s.trail.length * 0.5) + ')';
        c.beginPath(); c.arc(p.x, p.y, H * 0.012 * j / s.trail.length, 0, Math.PI * 2); c.fill();
      }
      drawStar(c, s.x, s.y, H * 0.022, s.rot, 0.6);
    } else if (s.state === 'cloud') {
      // Tuikkii pilvissä ennen paluuta
      c.globalAlpha = 0.5 + Math.sin(globalT * 10) * 0.3;
      drawStar(c, s.x, s.y + H * 0.01, H * 0.012, 0, 0.4);
      c.globalAlpha = 1;
    } else if (s.state === 'ground') {
      drawStar(c, s.x, s.y - H * 0.012, H * 0.016, s.rot, 0.2);
    }
  }
  for (i = 0; i < cst.rets.length; i++) {
    rt = cst.rets[i];
    k = easeInOutSine(rt.t / rt.dur);
    x = rt.x0 + (L.basket.x - rt.x0) * k;
    y = rt.y0 + (L.basket.y - H * 0.06 - rt.y0) * k - Math.sin(k * Math.PI) * H * 0.2;
    drawStar(c, x, y, H * 0.016, k * 8, 0.4);
  }
}
function cstDrawAim(c) {
  var v, pv, i, p, a, H = viewH, d = cstRoundDef(cst.round), fig = cst.fig, q;
  if (!cst.aim.active || cst.flow !== 'play' || fig.state !== 'play' || cst.basket <= 0 || cst.reload > 0) return;
  v = cstLaunchVel(cst.aim.dx, cst.aim.dy);
  if (v.len < CST_MIN_PULL * H) return;
  pv = cstPreview(v.vx, v.vy, d.preview);
  for (i = 0; i < pv.pts.length; i++) {
    p = pv.pts[i];
    a = Math.max(0, 0.9 - p.k * 0.85);
    c.fillStyle = pv.hit ? 'rgba(255,240,150,' + a + ')' : 'rgba(255,255,255,' + a + ')';
    c.beginPath(); c.arc(p.x, p.y, Math.max(2, H * (0.008 - p.k * 0.004)), 0, Math.PI * 2); c.fill();
  }
  if (pv.hit) {
    q = cstWorld(fig, fig.next);
    c.strokeStyle = 'rgba(255,240,150,' + (0.5 + Math.sin(globalT * 8) * 0.3) + ')';
    c.lineWidth = Math.max(2, H * 0.006);
    c.beginPath(); c.arc(q.x, q.y, H * 0.045, 0, Math.PI * 2); c.stroke();
  }
  // Vedon voima: kuunsirpin ympärillä kasvava kaari
  a = v.len / (CST_PULL * H);
  c.strokeStyle = a > 0.98 ? 'rgba(255,180,200,0.8)' : 'rgba(255,240,170,0.6)';
  c.lineWidth = Math.max(2, H * 0.006);
  c.beginPath(); c.arc(cst.L.fork.x, cst.L.fork.y, H * 0.075, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * a)); c.stroke();
}
function cstDrawHint(c) {
  var sol = cst.hintSol, H = viewH, f = cst.L.fork, per = 3.2, ph, k, hx, hy, v, pv, i, p, s = H * 0.07, a;
  if (!sol || cst.hintT < 0.5) return;
  ph = (cst.hintT - 0.5) % per;
  a = Math.min(1, (cst.hintT - 0.5) * 3);
  if (ph < 0.4) k = 0;
  else if (ph < 1.8) k = easeInOutSine((ph - 0.4) / 1.4);
  else if (ph < 2.4) k = 1;
  else k = -1;
  if (k < 0) {
    // Päästö: käsi nousee, tähti lähtee (vain vihjeen kuvana)
    hx = f.x + sol.dx;
    hy = f.y + sol.dy - (ph - 2.4) * H * 0.1;
    c.globalAlpha = 0.85 * a * Math.max(0, 1 - (ph - 2.4) / 0.8);
    drawHand(c, hx + s * 0.1, hy - s * 0.7, s);
    c.globalAlpha = 1;
    return;
  }
  hx = f.x + sol.dx * k;
  hy = f.y + sol.dy * k;
  if (k > 0.05) {
    v = cstLaunchVel(sol.dx * k, sol.dy * k);
    pv = cstPreview(v.vx, v.vy, cstRoundDef(cst.round).preview);
    for (i = 0; i < pv.pts.length; i++) {
      p = pv.pts[i];
      c.fillStyle = 'rgba(255,255,255,' + (Math.max(0, 0.7 - p.k * 0.65) * a) + ')';
      c.beginPath(); c.arc(p.x, p.y, Math.max(2, H * 0.006), 0, Math.PI * 2); c.fill();
    }
  }
  c.globalAlpha = 0.9 * a;
  if (ph < 0.4) {
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(2, H * 0.005);
    c.beginPath(); c.arc(f.x, f.y, H * (0.02 + ph * 0.1), 0, Math.PI * 2); c.stroke();
  }
  drawHand(c, hx + s * 0.1, hy - s * 0.75 + (ph < 0.4 ? (1 - ph / 0.4) * -s * 0.25 : 0), s);
  c.globalAlpha = 1;
}
function cstDrawFront(c) {
  var L = cst.L, H = viewH, x, i;
  // Pilvimeren etureuna: pudonneet tähdet painuvat pilviin
  c.fillStyle = '#a49ad6';
  for (i = 0, x = L.terrEnd + H * 0.04; x < L.W + H * 0.1; x += H * 0.11, i++) {
    cloudShape(c, x + Math.sin(globalT * 0.5 + i) * H * 0.008, L.cloudY + H * 0.035, H * 0.04);
  }
}
function cstDrawPuffs(c) {
  var i, p, a, r;
  for (i = 0; i < cst.puffs.length; i++) {
    p = cst.puffs[i];
    a = Math.max(0, 1 - p.t / p.life);
    r = p.r * (p.kind === 'puff' ? 1 + p.t : 1);
    c.globalAlpha = a * 0.8;
    if (p.kind === 'heart') { cstHeartPath(c, p.x, p.y, r * 1.2); c.fillStyle = p.col; c.fill(); }
    else if (p.kind === 'note') {
      c.fillStyle = p.col;
      cstEll(c, p.x, p.y, r * 0.7, r * 0.5, -0.4); c.fill();
      c.strokeStyle = p.col; c.lineWidth = Math.max(1.5, r * 0.25);
      c.beginPath(); c.moveTo(p.x + r * 0.6, p.y); c.lineTo(p.x + r * 0.6, p.y - r * 2); c.lineTo(p.x + r * 1.2, p.y - r * 1.6); c.stroke();
    } else if (p.kind === 'bubble') {
      c.strokeStyle = p.col; c.lineWidth = Math.max(1, r * 0.2);
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke();
    } else {
      c.fillStyle = p.col;
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
    }
  }
  c.globalAlpha = 1;
  // Tulikärpäset
  for (i = 0; i < cst.flies.length; i++) {
    p = cst.flies[i];
    a = Math.min(1, p.t, 9 - p.t) * (0.5 + Math.sin(p.t * 6) * 0.5);
    artGlow(c, p.x, p.y, viewH * 0.02, '#e8ff90', 0.6 * a);
    c.fillStyle = 'rgba(240,255,170,' + a + ')';
    c.beginPath(); c.arc(p.x, p.y, viewH * 0.004, 0, Math.PI * 2); c.fill();
  }
}
function cstDrawPeek(c) {
  var pk = cst.peek, H = viewH, L = cst.L, x, y, r, k, bx, i;
  if (!pk) return;
  k = Math.min(1, pk.t / 0.25, (2.8 - pk.t) / 0.3);
  x = L.scope.x + H * 0.13;
  y = L.scope.y - H * 0.31;
  r = H * 0.1 * easeOutBack(k);
  if (r <= 1) return;
  // Kurkistusympyrä: kuun pinta läheltä
  artCircle(c, x, y, r * 1.08, '#ffd24f', { lineColor: '#a07010' });
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#141244';
  c.fillRect(x - r, y - r, r * 2, r * 2);
  for (i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,230,0.7)'; c.beginPath(); c.arc(x - r + ((i * 37) % 20) / 20 * r * 2, y - r + ((i * 53) % 13) / 13 * r, H * 0.003, 0, Math.PI * 2); c.fill(); }
  artCircle(c, x, y + r * 1.2, r * 1.0, '#fff6d0', { lineColor: '#c8b070' });
  c.fillStyle = 'rgba(200,180,120,0.3)';
  c.beginPath(); c.arc(x - r * 0.4, y + r * 0.45, r * 0.14, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.5, y + r * 0.6, r * 0.1, 0, Math.PI * 2); c.fill();
  if (pk.ufo) {
    // Ufopupu kiitää ohi
    bx = x - r * 1.3 + ((pk.t * 0.8) % 1.2) * r * 2.2;
    drawBunny(c, bx, y - r * 0.05, r * 0.16, 0, globalT * 4, true);
    cstEll(c, bx, y + r * 0.08, r * 0.38, r * 0.1, 0);
    artFillPath(c, '#9fd8ff', y, y + r * 0.18, r * 0.3, { lineColor: '#3a5a8a' });
    for (i = 0; i < 3; i++) artCircle(c, bx + (i - 1) * r * 0.22, y + r * 0.1, r * 0.03, i === Math.floor(globalT * 6) % 3 ? '#ffe27a' : '#ff9ec6', { line: false });
  } else {
    drawBunny(c, x, y + r * 0.28, r * 0.22, Math.abs(Math.sin(pk.t * 5)) * r * 0.05, globalT * 6, false);
    // Vilkuttava tassu
    artCircle(c, x + r * 0.28, y - r * 0.15 + Math.sin(pk.t * 12) * r * 0.06, r * 0.06, '#ffffff', { lineColor: '#9a8ab8' });
  }
  c.restore();
}
function cstDrawCheer(c) {
  var i, ch, H = viewH, k, hop;
  for (i = 0; i < cst.cheer.length; i++) {
    ch = cst.cheer[i];
    if (ch.t <= 0) continue;
    k = easeOutBack(Math.min(1, ch.t / 0.6));
    hop = Math.abs(Math.sin(ch.t * 5 + ch.seed)) * H * 0.03;
    trekDrawPup(c, ch.x, cst.L.cloudY + H * 0.03 - k * H * 0.13 - hop, H * 0.04, { mood: 'wow', t: globalT + ch.seed, tint: ch.tint, wave: true, seed: ch.seed });
  }
}
function cstDrawWishFly(c) {
  var w = cst.wishFly, k, x, y, H = viewH;
  if (!w) return;
  k = easeInOutSine(w.t / 1.2);
  x = w.x0 + (viewW / 2 - w.x0) * k;
  y = w.y0 + (H * 0.2 - w.y0) * k;
  drawStar(c, x, y, H * 0.03 * (1 + Math.sin(k * Math.PI) * 0.8), k * 10, 1);
}

// ---------- Piirto: kokonaisuus ----------
function drawConstel() {
  var c = ctx, i, fig = cst.fig;
  if (!beginPlayWorld()) return;
  cstDrawSkyFx(c);
  propsDraw(c, 0);
  cstDrawShooter(c);
  for (i = 0; i < cst.gallery.length; i++) cstDrawFig(c, cst.gallery[i]);
  if (fig && fig.state !== 'gal' && cst.gallery.indexOf(fig) < 0) cstDrawFig(c, fig);
  cstDrawWind(c);
  cstDrawCloud(c);
  cstDrawTrail(c);
  propsDraw(c, 1);
  cstDrawSling(c);
  cstDrawShots(c);
  cstDrawFront(c);
  cstDrawPuffs(c);
  cstDrawCheer(c);
  cstDrawAim(c);
  cstDrawPeek(c);
  cstDrawHint(c);
  cstDrawWishFly(c);
  drawParticlesLayer(c);
  if (celebrating) cstDrawTrophy(c);
  endPlayWorld();
  cstDrawHud(c);
  drawTaskOverlay(c);
}

// ---------- HUD ja juhla ----------
function cstDrawHud(c) {
  var H = viewH, x0 = hudX(), i, x, y = H * 0.063, n = CST_ROUNDS.length, done, cur, left, w, gold = cstGolden(), sh;
  w = n * H * 0.055 + H * 0.2;
  drawHudPanel(c, x0, H * 0.018, w, H * 0.09, H * 0.025);
  for (i = 0; i < n; i++) {
    x = x0 + H * 0.045 + i * H * 0.055;
    done = i < cst.gallery.length;
    cur = i === cst.round && !done;
    if (done) drawStar(c, x, y, H * 0.02, 0, 0.3);
    else {
      artCircle(c, x, y, H * (cur ? 0.018 + Math.sin(globalT * 4) * 0.002 : 0.014), cur ? '#e8e0ff' : 'rgba(255,255,255,0.5)', { lineColor: cur ? '#8a7cff' : '#c8b0c8', flat: true });
      if (cur) cstText(c, String(cst.fig.N), x, y + H * 0.001, H * 0.02, '#5a4aa8', null);
    }
  }
  // Kultainen kaukoputki ja jäljellä olevat hutit
  x = x0 + H * 0.045 + n * H * 0.055 + H * 0.02;
  sh = cst.goldLostT > 0 ? Math.sin(cst.goldLostT * 30) * 0.2 : 0;
  c.globalAlpha = gold ? 1 : 0.45;
  cstDrawScope(c, x, y + H * 0.035, H * 0.032, gold, -0.6 + sh);
  c.globalAlpha = 1;
  if (gold) {
    left = Math.max(0, CST_GOLD_MISS - cst.misses);
    for (i = 0; i < CST_GOLD_MISS; i++) {
      c.fillStyle = i < left ? '#ffd24f' : 'rgba(160,150,200,0.45)';
      c.beginPath(); c.arc(x + H * 0.045 + (i % 4) * H * 0.016, y - H * 0.012 + Math.floor(i / 4) * H * 0.02, H * 0.0055, 0, Math.PI * 2); c.fill();
    }
  }
}
function cstDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, cst.celT / 0.8)), gold = cstGolden(), x = viewW / 2, y = H * 0.66, i;
  if (k <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(k * 1.6, k * 1.6);
  artGlow(c, 0, -H * 0.04, H * 0.18, gold ? '#ffe27a' : '#c8b8ff', 0.5);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.13, -H * 0.04 + Math.sin(globalT + i * Math.PI / 4) * H * 0.09, H * 0.011, globalT * 2, 0.4);
  if (gold) cstDrawScope(c, 0, H * 0.04, H * 0.07, true, -0.7 + Math.sin(globalT * 2) * 0.08);
  else drawStar(c, 0, -H * 0.03, H * 0.05, Math.sin(globalT) * 0.2, 0.8);
  c.restore();
}

// ---------- Kartan kuvake ----------
// Tähtikuvio (pupu) yötaivaalla ja kuunsirppi
HUB_ICONS.constel = function (c, x, y, s) {
  var r = s * 0.15, pts = [[0.55, -0.1], [0.3, -0.75], [0.05, -0.2], [-0.6, 0.15], [-0.25, 0.6], [0.35, 0.5]], i, px, py, qx, qy;
  artCircle(c, x, y, r * 2.2, '#2a2470', { lineColor: '#141244', flat: true });
  artGlow(c, x, y, r * 2.4, '#8a7cff', 0.35);
  c.strokeStyle = 'rgba(255,245,190,0.85)';
  c.lineWidth = Math.max(1.5, r * 0.12);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i <= pts.length; i++) {
    px = x + pts[i % pts.length][0] * r * 2;
    py = y + pts[i % pts.length][1] * r * 2;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();
  for (i = 0; i < pts.length; i++) {
    qx = x + pts[i][0] * r * 2;
    qy = y + pts[i][1] * r * 2;
    drawStar(c, qx, qy, r * (i === 1 ? 0.42 : 0.32), 0, 0.4);
  }
  c.beginPath();
  c.arc(x - r * 1.35, y + r * 1.25, r * 0.6, 0.05 * Math.PI, 0.95 * Math.PI, false);
  c.arc(x - r * 1.35, y + r * 0.95, r * 0.55, 0.88 * Math.PI, 0.12 * Math.PI, true);
  c.closePath();
  artFillPath(c, '#ffe27a', y + r * 0.9, y + r * 1.9, r, { lineColor: '#a07010' });
};
