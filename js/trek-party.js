'use strict';

// Pikkupilven kotimatka, etappi 5: PIL-VI-LIN-NA (yö). Helppo palkintoluku ja
// koko pitkän matkan tunnehuipennus. Yksi ruutu (camX = 0).
// Pilvilinnan piha pilvien päällä yöllä: pilvistä tehty linna torneineen ja
// sateenkaariviireineen, mutta aluksi pimeä ja hiljainen (ikkunat sammuksissa,
// viirit lerpallaan), koska kaikki ovat surreet ja etsineet kadonnutta
// pikkupilveä. Iso Äitipilvi (laventeli, kruunu) istuu keskellä surullisena.
//   1. Jälleennäkeminen (~8 s): iso Pikkupilvi lentää vasemmalta prinsessa ja
//      yksisarvinen selässään, laskeutuu, yksisarvinen hyppää pihalle ja
//      Pikkupilvi kutistuu takaisin pieneksi (ylimääräinen auringonvalo
//      kipinöinä taivaalle). Käsi näyttää RAAHAUKSEN äidin luo. Lähellä äitiä
//      HALAUS: molemmat litistyvät, sydämiä, 'yay', äiti ilahtuu, kimalteleva
//      ilosade ja pieni sateenkaari.
//   2. Juhlan sytytys (päävaihe): neljällä jalustalla on lahjojen haaleat
//      siluetit (jalustan reunus lahjan värinen). Lahjat ovat prinsessan
//      korissa alhaalla; lahja raahataan omalle jalustalleen. Väärä jalusta:
//      'hmm', jalusta heilahtaa ja lahja leijuu takaisin koriin. Jalustojen
//      järjestys arvotaan joka pelikerralla.
//        kukka     -> kukat puhkeavat aaltona pihan pilviin, köynnösköynnökset linnaan
//        simpukka  -> kuplasuihkulähde; emo ja 5 ankanpoikasta polskivat siinä, saukko reunalla
//        kristalli -> ikkunat syttyvät yksi kerrallaan kellojen soidessa, juhlamelodia alkaa
//        tähti     -> yötaivas kirkastuu; taivaan napautus ampuu ilotulitteen
//      Jokaisen lahjan jälkeen vieraat nousevat pilvillä ja jäävät: siili ja
//      auringonkukka (niitty), ankat ja saukko (joki), hohtokoit ja myyrä
//      lyhtyineen (luola), viisi sisarpilveä (taivas). Matkalla löydetyt
//      piilopuput (trekBunnyEver) hyppivät paikalle; löytymättömät eivät tule.
//   3. Loppu: kaikki koolla, Pikkupilvi ja äiti sataavat yhdessä ja kuun ja
//      tähden valo tekee ison sateenkaaren linnan ylle ("sade ja aurinko
//      yhdessä tekevät sateenkaaren"), ilotulitus, kameran salama ja
//      juhlakuva hetkeksi, sitten trekChapterDone() -> kehyksen juhla.
//      Napautukset toimivat juhlan ajan (ilotulitteet, vieraat).
// Tökättävää: Äitipilvi (kikatus, 3.: kimallesade, 5.: sydämet), Pikkupilvi
// (kikatus, 3.: kuperkeikka), kuu (silmänisku, 3.: tähdenlento), ikkunat
// (välähdys / värin vaihto, 3.: pikkupilvi kurkistaa), viirit (lepatus, 3.:
// kimallepurkaus), ilmapallot (poksahtavat ja kasvavat takaisin), kuplat,
// jalustojen ihmeet, yksisarvinen ja jokainen vieras omalla äänellään.

var TKP_MOM_R = 0.17;        // äitipilven säde × viewH
var TKP_PUP_R = 0.068;       // Pikkupilven tavallinen säde × viewH
var TKP_BIG_R = 0.15;        // iso Pikkupilvi (etapista 4) × viewH
var TKP_ARRIVE = [0.4, 3.0]; // saapumislento alkaa / laskeutuu (s etapin alusta)
var TKP_SHRINK_T = 1.2;      // kutistuminen laskeutumisen jälkeen
var TKP_HUG_R = 1.35;        // halaus, kun Pikkupilvi on näin lähellä äitiä (× äidin säde)
var TKP_HUG_T = 3.2;         // halauksen kesto ennen juhlavaihetta
var TKP_SNAP = 0.13;         // lahjan pudotusalue jalustan ympärillä × viewH
var TKP_HINT_FIRST = 1.2;    // ensimmäinen vihjekäsi (s)
var TKP_HINT_IDLE = 4.5;     // vihjekäsi toimettomuuden jälkeen (s)
var TKP_GUEST_T = 1.8;       // vieraat lähtevät nousemaan näin kauan lahjan jälkeen
var TKP_RISE_T = 2.2;        // vieraan nousu pilvellä
var TKP_FIN_WAIT = 3.2;      // viimeisten vieraiden saapumisaika ennen loppunäytöstä
var TKP_FIN_T = 7.6;         // loppunäytös ennen kehyksen juhlaa
var TKP_STEP = 0.21;         // juhlamelodian kahdeksasosa (s)
var TKP_GIFTS = ['flower', 'shell', 'crystal', 'star'];
// Lahja -> etappi, josta se saatiin (trekGiftDraw / trekBunnyEver)
var TKP_GIFT_CH = { flower: 'meadow', shell: 'river', crystal: 'cave', star: 'sky' };
// Jalustan reunuksen väri: auttaa löytämään oikean paikan
var TKP_GCOL = { flower: '#ff7bac', shell: '#ffa98a', crystal: '#6fd8ff', star: '#ffd24f' };
var TKP_MOM_TINT = '#efe6ff';
var TKP_SIB_TINTS = ['#ffd3e6', '#cfeaff', '#fff1b8', '#d4f5d0', '#e6d4ff'];
var TKP_SIB_NOTES = [523, 587, 659, 784, 880];
var TKP_FLOWER_COLS = ['#ff7bac', '#ffd24f', '#c9a0ff', '#ffffff', '#ff9f6a', '#7fd0ff'];
var TKP_CHIMES = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637, 3136];
// Juhlamelodia (C-duuri, 32 kahdeksasosaa) ja basso tahdin iskuilla
var TKP_MELODY = [659, 784, 880, 784, 659, 0, 523, 0, 587, 659, 784, 659, 587, 0, 0, 0,
  659, 784, 880, 1047, 880, 784, 659, 0, 587, 659, 587, 523, 523, 0, 0, 0];
var TKP_BASS = [131, 110, 87, 98];

var tkp = {
  built: false, t: 0, stage: 'arrive', stT: 0, L: null, key: '',
  px: 0, py: 0, pr: 0, pdrag: null, pupPokeT: 0, pupLoopT: 0, pupWowT: 0, pupN: 0,
  momPokeT: 0, momN: 0, hugT: 0, hugged: false, rainK: 0, smallBowT: -1,
  slots: [], inBasket: {}, drag: null, flies: [], wig: {}, placedN: 0, order: [],
  rides: {}, spotN: 0, flowers: [], stars: [], drops: [], hearts: [], bubbles: [],
  rockets: [], bursts: [], shoot: null, skyK: 0, garK: 0, winLit: [], melOn: false, melT: 0, melI: 0,
  moonT: 0, moonN: 0, uniT: 0, uniN: 0, idleT: 0, partyT: 0, skyTaps: 0, finT: 0, autoT: 0,
  flashT: -1, basketShake: 0
};
var tkpLight = { tint: ['rgba(30,20,90,0.26)', 'rgba(15,10,50,0.16)'], vignette: 0.55 };
var tkpCastleCv = document.createElement('canvas');
var tkpFloorCv = document.createElement('canvas');
var tkpSkyLitCv = document.createElement('canvas');
var tkpSilCv = {};

trekRegister({
  id: 'party', order: 5, name: 'PIL-VI-LIN-NA', color: '#ff9fd0',
  ambient: 'sparkle', light: tkpLight, bunny: false,
  gift: null,
  init: function () { tkpInit(); },
  update: function (dt) { tkpUpdate(dt); },
  draw: function () { tkpDraw(); },
  tap: function (px, py) { tkpTap(px, py); },
  resize: function () { tkpResize(); },
  layers: function () { return [{ speed: 1, render: tkpRenderSky }]; },
  icon: function (c, x, y, s) { tkpIcon(c, x, y, s); }
});

function tkpRnd(a, b) { return a + Math.random() * (b - a); }
function tkpCross(t0, t1, th) { return t0 < th && t1 >= th; }
function tkpClamp(v) { return Math.max(0, Math.min(1, v)); }

// ---------- Asettelu ----------
// Kaikki paikat lasketaan ruudun koosta (resize ei riko mitään). sx = sivujen
// ulottuma keskeltä: 4:3-ruudulla tiivis, leveällä ruudulla väljempi.
function tkpL() {
  if (!tkp.L || tkp.L.W !== viewW || tkp.L.H !== viewH) tkp.L = tkpMakeLay();
  return tkp.L;
}
function tkpMakeLay() {
  var W = viewW, H = viewH, c = W / 2, sx = Math.min(W * 0.5 - H * 0.11, H * 0.82), inner = Math.max(H * 0.31, sx * 0.56), R = H * TKP_MOM_R;
  return {
    W: W, H: H, c: c, sx: sx,
    mom: { x: c, y: H * 0.535, r: R },
    home: { x: c - R * 1.13, y: H * 0.535 + R * 0.25 },
    hug: { x: c - R * 0.98, y: H * 0.535 + R * 0.12 },
    ped: [{ x: c - sx, y: H * 0.735 }, { x: c - inner, y: H * 0.775 }, { x: c + inner, y: H * 0.775 }, { x: c + sx, y: H * 0.735 }],
    basket: { x: c, y: H * 0.925, w: H * 0.37 },
    uni: { x: c - sx + H * 0.075, y: H * 0.965 },
    land: { x: c - sx * 0.5, y: H * 0.4 },
    spots: [{ x: c - sx * 0.96, y: H * 0.475 }, { x: c + sx * 0.96, y: H * 0.475 }],
    sibs: [{ x: c - sx * 0.66, y: H * 0.205 }, { x: c + sx * 0.7, y: H * 0.205 }, { x: c - sx * 0.95, y: H * 0.29 },
      { x: c + sx * 0.95, y: H * 0.29 }, { x: c + R * 1.22, y: H * 0.535 + R * 0.3 }],
    bun: [c - H * 0.29, c + H * 0.265, c + H * 0.36, c + H * 0.455],
    moon: { x: c - sx * 0.84, y: H * 0.12, r: H * 0.048 },
    floorY: H * 0.6
  };
}
// Linnan muoto (× viewH keskeltä): muuri, keskitorni ja kaksi sivutornia, ikkunat
function tkpGeo() {
  var L = tkpL(), H = L.H, c = L.c;
  if (L.geo) return L.geo;
  L.geo = {
    wallX: H * 0.39, wallTop: H * 0.43, base: H * 0.72,
    towers: [
      { x: c - H * 0.27, w: H * 0.065, top: H * 0.33, roofW: H * 0.088, tip: H * 0.222, roof: '#ff9fd0', pole: H * 0.05 },
      { x: c + H * 0.27, w: H * 0.065, top: H * 0.33, roofW: H * 0.088, tip: H * 0.222, roof: '#ff9fd0', pole: H * 0.05 },
      { x: c, w: H * 0.085, top: H * 0.25, roofW: H * 0.112, tip: H * 0.118, roof: '#c9a2ff', pole: H * 0.055 }
    ],
    // [x, y, r, kaari?] valojen syttymisjärjestyksessä: keskeltä ulospäin
    wins: [[0, 0.305, 0.03, 0], [-0.27, 0.385, 0.022, 1], [0.27, 0.385, 0.022, 1], [-0.185, 0.45, 0.02, 0], [0.185, 0.45, 0.02, 0],
      [-0.27, 0.5, 0.022, 1], [0.27, 0.5, 0.022, 1], [-0.352, 0.53, 0.018, 0], [0.352, 0.53, 0.018, 0]]
  };
  return L.geo;
}

// ---------- Alustus ----------
function tkpInit() {
  var i, ids, L;
  tkp.L = null;
  L = tkpL();
  tkp.built = true;
  tkp.t = 0;
  tkp.stage = 'arrive';
  tkp.stT = 0;
  tkp.px = -viewH;
  tkp.py = viewH * 0.3;
  tkp.pr = viewH * TKP_BIG_R;
  tkp.pdrag = null;
  tkp.pupPokeT = 0; tkp.pupLoopT = 0; tkp.pupWowT = 0; tkp.pupN = 0;
  tkp.momPokeT = 0; tkp.momN = 0;
  tkp.hugT = 0; tkp.hugged = false; tkp.rainK = 0; tkp.smallBowT = -1;
  // Jalustojen järjestys arvotaan
  ids = TKP_GIFTS.slice();
  for (i = ids.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), tmp = ids[i];
    ids[i] = ids[j]; ids[j] = tmp;
  }
  tkp.slots = [];
  for (i = 0; i < 4; i++) tkp.slots.push({ gift: ids[i], placed: false, t: 0, wob: 0, pulse: 0, boost: 0 });
  // Korissa ovat aina kaikki neljä lahjaa (myös testattaessa trekGo:lla).
  // trekGifts() kertoo ansaitut; ansaitsematonkin piirretään varakuvalla.
  tkp.inBasket = {};
  for (i = 0; i < TKP_GIFTS.length; i++) tkp.inBasket[TKP_GIFTS[i]] = true;
  tkp.earned = trekGifts();
  tkp.drag = null;
  tkp.flies = [];
  tkp.wig = {};
  tkp.placedN = 0;
  tkp.order = [];
  tkp.rides = {};
  tkp.spotN = 0;
  tkp.drops = []; tkp.hearts = []; tkp.bubbles = []; tkp.rockets = []; tkp.bursts = []; tkp.shoot = null;
  tkp.skyK = 0; tkp.garK = 0;
  tkp.winLit = [];
  for (i = 0; i < 9; i++) tkp.winLit.push(-1);
  tkp.melOn = false; tkp.melT = 0; tkp.melI = 0;
  tkp.moonT = 0; tkp.moonN = 0; tkp.uniT = 0; tkp.uniN = 0;
  tkp.idleT = 0; tkp.partyT = 0; tkp.skyTaps = 0; tkp.finT = 0; tkp.autoT = 0; tkp.flashT = -1; tkp.basketShake = 0;
  // Pihan kukat (puhkeavat kukkalahjasta) ja taivaan tähdet
  tkp.flowers = [];
  tkpMakeFlowers();
  tkp.stars = [];
  for (i = 0; i < 30; i++) tkp.stars.push({ fx: Math.random(), fy: tkpRnd(0.02, 0.5), ph: Math.random() * 6, r: tkpRnd(0.004, 0.009) });
  tkpLight.tint[0] = 'rgba(30,20,90,0.26)';
  tkpLight.tint[1] = 'rgba(15,10,50,0.16)';
  tkpLight.vignette = 0.55;
  camX = 0;
  tkp.key = '';
  tkpPrerender();
  tkpSetupProps();
}
function tkpResize() {
  if (!tkp.built) return;
  tkp.L = null;
  tkp.key = '';
  tkpPrerender();
  tkp.px = Math.max(viewH * 0.05, Math.min(viewW - viewH * 0.05, tkp.px));
  tkp.py = Math.max(viewH * 0.1, Math.min(viewH * 0.92, tkp.py));
  tkp.drag = null;
}
// Kukkien paikat pilvilattialla (osuudet ruudusta), kaukana korista ja jalustoista
function tkpMakeFlowers() {
  var L = tkpL(), n = 0, tries = 0, x, y, ok, i;
  while (n < 30 && tries < 600) {
    tries++;
    x = tkpRnd(0.03, 0.97) * L.W;
    y = tkpRnd(0.68, 0.985) * L.H;
    ok = !(Math.abs(x - L.basket.x) < L.basket.w * 0.6 && y > L.H * 0.82);
    if (Math.abs(x - L.uni.x) < L.H * 0.13 && y > L.H * 0.8) ok = false;
    if (Math.abs(x - L.mom.x) < L.mom.r * 1.1 && y < L.H * 0.74) ok = false;
    for (i = 0; i < 4; i++) if (Math.hypot(x - L.ped[i].x, (y - L.ped[i].y) * 1.6) < L.H * 0.085) ok = false;
    for (i = 0; i < tkp.flowers.length; i++) if (Math.hypot(x - tkp.flowers[i].fx * L.W, y - tkp.flowers[i].fy * L.H) < L.H * 0.055) ok = false;
    if (!ok) continue;
    tkp.flowers.push({ fx: x / L.W, fy: y / L.H, s: tkpRnd(0.011, 0.017), col: TKP_FLOWER_COLS[n % TKP_FLOWER_COLS.length], d: 99, rot: Math.random() * 6 });
    n++;
  }
}

// ---------- Esirenderöinti ----------
// Yötaivas on taustakerros. Linna, pihan pilvilattia ja kirkastunut taivas
// piirretään omiin kankaisiinsa kerran (koon muuttuessa), ja niiden päälle
// joka ruudulla vain elävät osat (valot, köynnökset, viirit).
function tkpRenderSky(b, w, h) {
  var g = b.createLinearGradient(0, 0, 0, h), i, x, y;
  g.addColorStop(0, '#141845');
  g.addColorStop(0.35, '#272468');
  g.addColorStop(0.62, '#463a8a');
  g.addColorStop(1, '#6a58a6');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,240,0.5)';
  for (i = 0; i < 70; i++) {
    x = ((i * 0.6180339) % 1) * Math.min(w, viewW * 1.05);
    y = ((i * 0.3819 + i * i * 0.0137) % 1) * h * 0.55;
    b.fillRect(x, y, 1.5, 1.5);
  }
  // Kaukaiset pilvivallit horisontissa
  for (i = 0; i < 9; i++) {
    b.fillStyle = i % 2 ? 'rgba(120,100,180,0.55)' : 'rgba(100,84,165,0.6)';
    cloudShape(b, viewW * (i * 0.13 - 0.02), h * (0.6 + (i % 3) * 0.02), h * (0.05 + (i % 2) * 0.015));
  }
}
function tkpCanvas(cv, w, h) {
  var b;
  cv.width = Math.max(1, Math.round(w * DPR));
  cv.height = Math.max(1, Math.round(h * DPR));
  b = cv.getContext('2d');
  b.setTransform(DPR, 0, 0, DPR, 0, 0);
  b.clearRect(0, 0, w, h);
  return b;
}
function tkpPrerender() {
  var key = viewW + 'x' + viewH;
  if (!viewW || !viewH || tkp.key === key) return;
  tkp.key = key;
  tkpRenderCastle(tkpCanvas(tkpCastleCv, viewW, viewH * 0.75));
  tkpRenderFloor(tkpCanvas(tkpFloorCv, viewW, viewH * 0.42));
  tkpRenderSkyLit(tkpCanvas(tkpSkyLitCv, viewW, viewH * 0.72));
  tkpRenderSils();
}
// Pilvimuoto reunaviivalla: polku vedetään paksulla viivalla ja täytetään
// päältä (sisäiset kaaret peittyvät, vain ulkoreuna jää näkyviin)
function tkpPuff(c, y0, y1, col, shade, line, lw) {
  var g = c.createLinearGradient(0, y0, 0, y1);
  c.strokeStyle = line;
  c.lineWidth = lw * 2;
  c.lineJoin = 'round';
  c.stroke();
  g.addColorStop(0, col);
  g.addColorStop(1, shade);
  c.fillStyle = g;
  c.fill();
}
function tkpRenderCastle(b) {
  var L = tkpL(), G = tkpGeo(), H = L.H, c = L.c, i, x, tw, lw = Math.max(1.2, H * 0.004), w;
  // Muuri: pilvipallerot harjalla
  b.beginPath();
  b.rect(c - G.wallX, G.wallTop, G.wallX * 2, G.base - G.wallTop);
  for (x = -G.wallX; x <= G.wallX + 1; x += H * 0.065) {
    b.moveTo(c + x + H * 0.036, G.wallTop);
    b.arc(c + x, G.wallTop, H * 0.036, 0, Math.PI * 2);
  }
  tkpPuff(b, G.wallTop - H * 0.04, G.base, '#fbf8ff', '#cfc2ef', '#9c8bd0', lw);
  // Muurin pehmeät pilvikuviot
  b.fillStyle = 'rgba(255,255,255,0.45)';
  for (i = 0; i < 7; i++) {
    x = c - G.wallX + H * 0.06 + i * G.wallX * 0.3;
    b.beginPath(); b.arc(x, G.wallTop + H * 0.09 + (i % 2) * H * 0.05, H * 0.018, 0, Math.PI * 2); b.fill();
  }
  // Tornit
  for (i = 0; i < G.towers.length; i++) {
    tw = G.towers[i];
    w = tw.w;
    b.beginPath();
    b.rect(tw.x - w, tw.top, w * 2, G.base - tw.top);
    for (x = -1; x <= 1; x += 0.5) {
      b.moveTo(tw.x + x * w + H * 0.026, tw.top + H * 0.008);
      b.arc(tw.x + x * w, tw.top + H * 0.008, H * 0.026, 0, Math.PI * 2);
    }
    tkpPuff(b, tw.top - H * 0.03, G.base, '#ffffff', '#d6caf2', '#9c8bd0', lw);
    artHighlight(b, tw.x - w * 0.5, tw.top + H * 0.05, w * 0.22, H * 0.04, 0.4);
    // Kartiokatto
    b.beginPath();
    b.moveTo(tw.x - tw.roofW, tw.top);
    b.quadraticCurveTo(tw.x - tw.roofW * 0.3, tw.top - (tw.top - tw.tip) * 0.45, tw.x, tw.tip);
    b.quadraticCurveTo(tw.x + tw.roofW * 0.3, tw.top - (tw.top - tw.tip) * 0.45, tw.x + tw.roofW, tw.top);
    b.closePath();
    artFillPath(b, tw.roof, tw.tip, tw.top, tw.roofW, { lineColor: artShade(tw.roof, -0.4) });
    // Katon raidat ja pilvireunus
    b.strokeStyle = 'rgba(255,255,255,0.4)';
    b.lineWidth = Math.max(1, H * 0.004);
    b.beginPath();
    b.moveTo(tw.x - tw.roofW * 0.45, tw.top - H * 0.006); b.quadraticCurveTo(tw.x - tw.roofW * 0.15, tw.top - (tw.top - tw.tip) * 0.5, tw.x, tw.tip + H * 0.01);
    b.stroke();
    b.beginPath();
    for (x = -1; x <= 1.01; x += 0.25) {
      b.moveTo(tw.x + x * tw.roofW + H * 0.016, tw.top);
      b.arc(tw.x + x * tw.roofW, tw.top, H * 0.016, 0, Math.PI * 2);
    }
    tkpPuff(b, tw.top - H * 0.016, tw.top + H * 0.016, '#ffffff', '#e2d8f8', '#9c8bd0', lw * 0.8);
    // Lipputanko ja kultapallo
    b.strokeStyle = '#8a74c4';
    b.lineWidth = Math.max(1.5, H * 0.005);
    b.lineCap = 'round';
    b.beginPath(); b.moveTo(tw.x, tw.tip); b.lineTo(tw.x, tw.tip - tw.pole); b.stroke();
    artCircle(b, tw.x, tw.tip - tw.pole, H * 0.008, '#ffd24f', { lineColor: '#c8901e', hi: 0.5 });
  }
  // Portti (äidin takana, reunat näkyvät)
  b.beginPath();
  b.moveTo(c - H * 0.07, G.base);
  b.lineTo(c - H * 0.07, H * 0.6);
  b.arc(c, H * 0.6, H * 0.07, Math.PI, 0);
  b.lineTo(c + H * 0.07, G.base);
  b.closePath();
  artFillPath(b, '#a98ad8', H * 0.53, G.base, H * 0.07, { lineColor: '#7a62b0' });
  // Sammuneet ikkunat
  for (i = 0; i < G.wins.length; i++) tkpWinShape(b, c + G.wins[i][0] * H, G.wins[i][1] * H, G.wins[i][2] * H, G.wins[i][3], '#3d3470', '#9c8bd0');
}
function tkpWinPath(c, x, y, r, arch) {
  c.beginPath();
  if (arch) {
    c.moveTo(x - r * 0.8, y + r * 1.2);
    c.lineTo(x - r * 0.8, y - r * 0.2);
    c.arc(x, y - r * 0.2, r * 0.8, Math.PI, 0);
    c.lineTo(x + r * 0.8, y + r * 1.2);
    c.closePath();
  } else {
    c.arc(x, y, r, 0, Math.PI * 2);
  }
}
function tkpWinShape(c, x, y, r, arch, fill, line) {
  tkpWinPath(c, x, y, r, arch);
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = line;
  c.lineWidth = Math.max(1.5, r * 0.28);
  c.stroke();
}
// Pihan pilvilattia: kolme riviä pullukoita pilviä, takana laventelimpia
function tkpRenderFloor(b) {
  var L = tkpL(), W = L.W, H = L.H, y0 = L.floorY, i, x, r, rows = [[0.035, 0.034, '#e6defa', '#b8aae0'], [0.11, 0.05, '#f2ecff', '#cbbfee'], [0.24, 0.07, '#fbf9ff', '#ddd4f6']], k, rw;
  b.save();
  b.translate(0, -y0);
  for (k = 0; k < rows.length; k++) {
    rw = rows[k];
    r = H * rw[1];
    b.beginPath();
    b.rect(-10, y0 + H * rw[0], W + 20, H);
    for (i = 0, x = -r * 0.5; x < W + r; i++, x += r * 1.35) {
      b.moveTo(x + r, y0 + H * rw[0] + (i % 2) * r * 0.25);
      b.arc(x, y0 + H * rw[0] + (i % 2) * r * 0.25, r * (0.9 + (i % 3) * 0.1), 0, Math.PI * 2);
    }
    tkpPuff(b, y0 + H * rw[0] - r, y0 + H * rw[0] + r * 2.2, rw[2], rw[3], '#9c8bd0', Math.max(1.2, H * 0.004));
    // Kiiltoja pilvien päällä
    b.fillStyle = 'rgba(255,255,255,0.5)';
    for (i = 0, x = -r * 0.5; x < W + r; i++, x += r * 1.35) {
      if (i % 2) continue;
      if (b.ellipse) { b.beginPath(); b.ellipse(x - r * 0.25, y0 + H * rw[0] - r * 0.55, r * 0.3, r * 0.12, -0.3, 0, Math.PI * 2); b.fill(); }
    }
  }
  b.restore();
}
// Kirkastunut taivas (tähtilahjan jälkeen): ristihäivytetään yötaivaan päälle
function tkpRenderSkyLit(b) {
  var L = tkpL(), W = L.W, H = L.H, g = b.createLinearGradient(0, 0, 0, H * 0.72), i;
  g.addColorStop(0, '#24307e');
  g.addColorStop(0.4, '#4b44a8');
  g.addColorStop(0.75, '#9a72c8');
  g.addColorStop(1, '#e09ccc');
  b.fillStyle = g;
  b.fillRect(0, 0, W, H * 0.72);
  // Pehmeät revontulimaiset juhlavalot
  for (i = 0; i < 3; i++) {
    b.strokeStyle = ['rgba(160,255,220,0.13)', 'rgba(255,170,230,0.12)', 'rgba(180,200,255,0.13)'][i];
    b.lineWidth = H * 0.06;
    b.lineCap = 'round';
    b.beginPath();
    b.moveTo(-W * 0.05, H * (0.14 + i * 0.07));
    b.bezierCurveTo(W * 0.3, H * (0.02 + i * 0.08), W * 0.6, H * (0.26 + i * 0.05), W * 1.05, H * (0.1 + i * 0.07));
    b.stroke();
  }
  b.fillStyle = 'rgba(255,255,240,0.85)';
  for (i = 0; i < 90; i++) b.fillRect(((i * 0.7548) % 1) * W, ((i * 0.5698 + i * i * 0.011) % 1) * H * 0.6, 1.6, 1.6);
}
// Lahjojen siluetit: lahja piirretään apukankaalle ja värjätään valkoiseksi
function tkpRenderSils() {
  var i, id, cv, b, sz = Math.round(viewH * 0.12);
  for (i = 0; i < TKP_GIFTS.length; i++) {
    id = TKP_GIFTS[i];
    cv = tkpSilCv[id] || (tkpSilCv[id] = document.createElement('canvas'));
    b = tkpCanvas(cv, sz, sz);
    tkpGiftDraw(id, b, sz / 2, sz / 2, viewH * 0.085, true);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = artShade(TKP_GCOL[id], -0.45);
    b.fillRect(0, 0, sz, sz);
    b.globalCompositeOperation = 'source-over';
  }
}

// ---------- Lahjat ----------
// Etapin oma lahjakuva (trekGiftDraw), tai varakuva, jos luvulla ei ole lahjaa
function tkpGiftDraw(id, c, x, y, s, still) {
  var ch = TKP_GIFT_CH[id], i, d;
  for (i = 0; i < TREK_CHAPTERS.length; i++) {
    d = TREK_CHAPTERS[i];
    if (d.id === ch && d.gift && d.gift.draw) { trekGiftDraw(ch, c, x, y, s); return; }
  }
  tkpGiftFallback(id, c, x, y, s, still);
}
function tkpGiftFallback(id, c, x, y, s, still) {
  var i, a, tw = still ? 0 : globalT;
  if (id === 'flower') {
    artLimb(c, x, y + s * 0.1, x, y + s * 0.44, s * 0.07, '#5fbf55');
    artBlob(c, x + s * 0.14, y + s * 0.32, s * 0.12, s * 0.06, '#6fd06a', { rot: -0.5 });
    for (i = 0; i < 6; i++) {
      a = i / 6 * Math.PI * 2 + tw * 0.4;
      artCircle(c, x + Math.cos(a) * s * 0.2, y - s * 0.06 + Math.sin(a) * s * 0.2, s * 0.15, '#ff7bac', { lineColor: '#c84a80' });
    }
    artCircle(c, x, y - s * 0.06, s * 0.13, '#ffe27a', { lineColor: '#d8a020', hi: 0.5 });
  } else if (id === 'shell') {
    c.beginPath();
    c.moveTo(x, y + s * 0.34);
    c.lineTo(x - s * 0.36, y - s * 0.02);
    c.arc(x, y - s * 0.02, s * 0.36, Math.PI, 0);
    c.closePath();
    artFillPath(c, '#ffb6a0', y - s * 0.38, y + s * 0.34, s * 0.36, { lineColor: '#c8685a' });
    c.strokeStyle = 'rgba(200,104,90,0.6)';
    c.lineWidth = Math.max(1, s * 0.03);
    c.beginPath();
    for (i = -2; i <= 2; i++) { c.moveTo(x, y + s * 0.3); c.lineTo(x + i * s * 0.15, y - s * 0.32 + Math.abs(i) * s * 0.06); }
    c.stroke();
    artBlob(c, x, y + s * 0.32, s * 0.12, s * 0.06, '#ffd0c0', { lineColor: '#c8685a' });
    artHighlight(c, x - s * 0.14, y - s * 0.2, s * 0.08, s * 0.05, 0.6);
  } else if (id === 'crystal') {
    artGlow(c, x, y, s * 0.55, '#9ff0ff', 0.35);
    tkpCrystal(c, x - s * 0.2, y + s * 0.3, s * 0.1, s * 0.34, -0.35, '#c9a8ff');
    tkpCrystal(c, x + s * 0.2, y + s * 0.3, s * 0.1, s * 0.3, 0.35, '#a8ffe0');
    tkpCrystal(c, x, y + s * 0.34, s * 0.15, s * 0.66, 0, '#7fe0ff');
  } else {
    drawStar(c, x, y, s * 0.42, still ? 0 : Math.sin(globalT * 2) * 0.1, 0.5);
  }
}
// Kristallipiikki: origo tyvessä, w = puolileveys, h = korkeus
function tkpCrystal(c, x, y, w, h, rot, col) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.moveTo(-w, 0); c.lineTo(-w, -h * 0.72); c.lineTo(0, -h); c.lineTo(w, -h * 0.72); c.lineTo(w, 0); c.closePath();
  artFillPath(c, col, -h, 0, w, { lineColor: artShade(col, -0.45) });
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath(); c.moveTo(-w * 0.6, -h * 0.1); c.lineTo(-w * 0.6, -h * 0.68); c.lineTo(-w * 0.1, -h * 0.9); c.lineTo(-w * 0.1, -h * 0.1); c.closePath(); c.fill();
  c.restore();
}
function tkpBasketSlot(i) {
  var L = tkpL();
  return { x: L.basket.x + (i - 1.5) * L.H * 0.088, y: L.basket.y - L.H * 0.068 };
}
function tkpGiftTop(i) {
  var L = tkpL(), p = L.ped[i];
  return { x: p.x, y: p.y - L.H * 0.085 - L.H * 0.048 };
}
function tkpSlotOf(id) {
  var i;
  for (i = 0; i < 4; i++) if (tkp.slots[i].gift === id) return i;
  return -1;
}

// ---------- Tökättävät: vieraat, ikkunat, viirit, ilmapallot ----------
// Kerrokset (propsDraw-kutsun layer): 5 linnan osat, 6 taivaan vieraat,
// 2 pilvien vieraat, 3 suihkulähde, 4 puput
function tkpSetupProps() {
  var G = tkpGeo(), i;
  propsReset();
  for (i = 0; i < G.wins.length; i++) {
    propAdd({ kind: 'win', idx: i, layer: 5, x: 0, y: 0, r: viewH * 0.045, hy: 0, amp: 0.05, color: '#ffe9a8', note: 880 + i * 60, tt: 0, flick: 0, hue: 0, peek: 0,
      update: tkpGuestUpdate, draw: tkpGuestDraw, poke: tkpGuestPoke });
  }
  for (i = 0; i < 3; i++) {
    propAdd({ kind: 'banner', idx: i, layer: 5, x: 0, y: 0, r: viewH * 0.06, hy: 0, amp: 0.06, color: '#ff9fd0', note: 660 + i * 110, tt: Math.random() * 5, fl: 0,
      update: tkpGuestUpdate, draw: tkpGuestDraw, poke: tkpGuestPoke });
  }
  for (i = 0; i < 6; i++) {
    propAdd({ kind: 'balloon', idx: i, layer: 5, x: 0, y: 0, r: viewH * 0.035, hy: 0, amp: 0.12, color: ['#ff7bac', '#ffd24f', '#7fd0ff', '#b678ff', '#6fd66f', '#ff9f6a'][i], note: 700 + i * 50,
      tt: Math.random() * 6, popT: -1, grow: 1, update: tkpGuestUpdate, draw: tkpGuestDraw, poke: tkpGuestPoke });
  }
}
function tkpAddGuest(kind, g, o) {
  var p = { kind: kind, g: g, layer: 2, x: -999, y: -999, r: viewH * 0.05, hy: viewH * 0.03, amp: 0.14, color: '#ffe27a', note: 600, tt: 0, act: 0,
    update: tkpGuestUpdate, draw: tkpGuestDraw, poke: tkpGuestPoke }, k;
  for (k in o) if (o.hasOwnProperty(k)) p[k] = o[k];
  return propAdd(p);
}
// Ryhmän pilvikyyti nousee alhaalta paikalleen
function tkpRidePos(g) {
  var L = tkpL(), rd = tkp.rides[g], k, tx, ty;
  if (!rd) return { x: -999, y: -999, k: 0 };
  if (g === 'river') { tx = L.ped[rd.slot].x + (rd.slot < 2 ? 1 : -1) * L.H * 0.05; ty = L.H * 0.48; }
  else { tx = L.spots[rd.spot].x; ty = L.spots[rd.spot].y; }
  k = easeOutCubic(rd.t / TKP_RISE_T);
  return { x: tx + Math.sin(rd.t * 2.2) * L.H * 0.03 * (1 - k), y: L.H * 1.15 + (ty - L.H * 1.15) * k + Math.sin(rd.t * 1.6 + rd.spot) * L.H * 0.006, k: k };
}
function tkpAddGuests(gift) {
  var L = tkpL(), H = L.H, i, slot = tkpSlotOf(gift), side;
  if (gift === 'flower') {
    tkp.rides.meadow = { t: 0, spot: tkp.spotN++ % 2, slot: slot, fade: 0 };
    tkpAddGuest('hedgehog', 'meadow', { ox: -0.045, fy: 0.012, color: '#c89a6a', note: 392, r: H * 0.06 });
    tkpAddGuest('sunflower', 'meadow', { ox: 0.045, fy: 0.006, color: '#ffd23f', note: 523, r: H * 0.07, hy: H * 0.09 });
  } else if (gift === 'shell') {
    tkp.rides.river = { t: 0, spot: 0, slot: slot, fade: 0 };
    tkpAddGuest('duck', 'river', { layer: 3, mom: true, idx: 0, ox: -0.05, color: '#ffffff', note: 330, r: H * 0.04, inT: -1 });
    for (i = 0; i < 5; i++) tkpAddGuest('duck', 'river', { layer: 3, mom: false, idx: i + 1, ox: -0.015 + i * 0.016, color: '#ffe066', note: 880 + i * 60, r: H * 0.026, hy: H * 0.015, inT: -1 });
    tkpAddGuest('otter', 'river', { layer: 3, idx: 6, ox: 0.06, color: '#c8946a', note: 466, r: H * 0.06, hy: H * 0.06, inT: -1 });
  } else if (gift === 'crystal') {
    tkp.rides.cave = { t: 0, spot: tkp.spotN++ % 2, slot: slot, fade: 0 };
    tkpAddGuest('mole', 'cave', { ox: 0, fy: 0.002, color: '#ffe9a8', note: 294, r: H * 0.07, hy: H * 0.05 });
    for (i = 0; i < 4; i++) {
      side = i % 2 ? 1 : -1;
      tkpAddGuest('moth', 'cave', { layer: 6, idx: i, color: '#eaffb0', note: 1175 + i * 90, r: H * 0.04, hy: 0, ph: Math.random() * 6,
        sx: L.c + side * L.W * 0.6, sy: H * tkpRnd(0.1, 0.5), flee: 0, born: i * 0.35 });
    }
  } else {
    for (i = 0; i < 5; i++) tkpAddGuest('sib', 'sky', { layer: i === 4 ? 3 : 6, idx: i, color: TKP_SIB_TINTS[i], note: TKP_SIB_NOTES[i], r: H * 0.055, hy: 0, born: i * 0.22, spin: 0 });
  }
  // Matkalla löydetty piilopupu tulee mukaan
  if (trekBunnyEver(TKP_GIFT_CH[gift])) tkpAddGuest('bunny', 'b', { layer: 4, idx: tkpBunnySlot(), color: '#ffc4dd', r: H * 0.05, hy: H * 0.04, born: 0, hopT: 0 });
}
function tkpBunnySlot() {
  var n = 0, i;
  for (i = 0; i < props.length; i++) if (props[i].kind === 'bunny') n++;
  return n;
}

// Vieraiden ja koristeiden paikat lasketaan joka ruudulla asettelusta
function tkpGuestUpdate(p, dt) {
  var L = tkpL(), H = L.H, G, w, rp, k, a, tw, sp, bx, by, tgt;
  p.tt += dt;
  if (p.act > 0) p.act -= dt;
  switch (p.kind) {
    case 'win':
      G = tkpGeo();
      w = G.wins[p.idx];
      p.x = L.c + w[0] * H; p.y = w[1] * H;
      if (p.flick > 0) p.flick -= dt;
      if (p.peek > 0) p.peek -= dt;
      break;
    case 'banner':
      G = tkpGeo();
      tw = G.towers[p.idx === 2 ? 2 : p.idx];
      p.px0 = tw.x; p.py0 = tw.tip - tw.pole + H * 0.004;
      p.len = H * (p.idx === 2 ? 0.1 : 0.075);
      a = tkpBannerAng();
      p.x = p.px0 + Math.cos(a) * p.len * 0.5; p.y = p.py0 + Math.sin(a) * p.len * 0.5;
      if (p.fl > 0) p.fl -= dt;
      break;
    case 'balloon':
      sp = p.idx < 3 ? -1 : 1;
      k = p.idx % 3;
      p.ax = L.c + sp * H * 0.4; p.ay = H * 0.48;
      p.x = p.ax + sp * H * (k - 1) * 0.032 + Math.sin(p.tt * 1.3 + p.idx) * H * 0.006;
      p.y = H * (0.335 + (k === 1 ? -0.03 : 0)) + Math.sin(p.tt * 1.7 + p.idx * 2) * H * 0.006;
      if (p.popT >= 0) { p.popT += dt; if (p.popT > 1.6) { p.popT = -1; p.grow = 0; } }
      if (p.grow < 1) p.grow = Math.min(1, p.grow + dt * 2.2);
      break;
    case 'hedgehog':
    case 'sunflower':
    case 'mole':
      rp = tkpRidePos(p.g);
      p.x = rp.x + p.ox * H;
      p.y = rp.y + p.fy * H;
      break;
    case 'duck':
    case 'otter':
      rp = tkpRidePos('river');
      sp = tkp.rides.river ? tkp.rides.river.slot : 0;
      bx = L.ped[sp].x; by = L.ped[sp].y - H * 0.085 - H * 0.005;
      if (p.inT < 0) {
        p.x = rp.x + p.ox * H; p.y = rp.y - H * 0.03;
        if (rp.k >= 1 && tkp.rides.river.t > TKP_RISE_T + 0.2 + p.idx * 0.28 ) {
          p.inT = 0; p.fx = p.x; p.fy = p.y;
          tkpSplash(bx, by);
          if (p.kind === 'duck') tkpQuack(p.mom ? 330 : 880 + p.idx * 50);
        }
      } else {
        p.inT += dt;
        if (p.kind === 'otter') tgt = { x: bx + (sp < 2 ? 1 : -1) * H * 0.105, y: by + H * 0.002 };
        else {
          a = p.idx * 1.05 + p.tt * (p.mom ? 0.35 : 0.5);
          tgt = { x: bx + Math.cos(a) * H * (p.mom ? 0.045 : 0.068), y: by + Math.sin(a) * H * 0.012 + H * 0.004 };
        }
        k = Math.min(1, p.inT / 0.5);
        p.x = p.fx + (tgt.x - p.fx) * k;
        p.y = p.fy + (tgt.y - p.fy) * k - Math.sin(k * Math.PI) * H * 0.07;
        p.face = Math.cos(p.idx * 1.05 + p.tt * 0.5) > 0 ? -1 : 1;
      }
      break;
    case 'moth':
      k = easeInOutSine(Math.min(1, Math.max(0, p.tt - p.born) / 2));
      G = tkpGeo();
      w = G.wins[(p.idx * 2 + 1) % G.wins.length];
      tgt = { x: L.c + w[0] * H + Math.cos(p.tt * 1.7 + p.ph) * H * 0.05, y: w[1] * H + Math.sin(p.tt * 2.3 + p.ph) * H * 0.035 };
      if (p.flee > 0) {
        p.flee -= dt;
        a = Math.sin(Math.PI * Math.min(1, p.flee / 1.2));
        tgt.x += Math.cos(p.ph + p.idx) * H * 0.18 * a;
        tgt.y -= H * 0.12 * a;
      }
      p.x = p.sx + (tgt.x - p.sx) * k;
      p.y = p.sy + (tgt.y - p.sy) * k;
      break;
    case 'sib':
      k = easeOutCubic(Math.min(1, Math.max(0, p.tt - p.born) / TKP_RISE_T));
      tgt = L.sibs[p.idx];
      p.x = tgt.x + Math.sin(p.tt * 1.4 + p.idx) * H * 0.008;
      p.y = H * 1.15 + (tgt.y - H * 1.15) * k + Math.sin(p.tt * 1.9 + p.idx * 1.3) * H * 0.007 + p.r * 0.5;
      p.hy = p.r * 0.5;
      if (p.spin > 0) p.spin -= dt;
      break;
    case 'bunny':
      sp = p.idx === 0 ? -1 : 1;
      tgt = L.bun[Math.min(3, p.idx)];
      k = Math.min(1, p.tt / 1.8);
      p.x = (sp < 0 ? -H * 0.08 : L.W + H * 0.08) + (tgt - (sp < 0 ? -H * 0.08 : L.W + H * 0.08)) * k;
      p.y = H * 0.985;
      p.face = k < 1 ? -sp : (p.idx === 0 ? 1 : -1);
      p.hop = k < 1 ? Math.abs(Math.sin(k * Math.PI * 6)) * H * 0.035 : (p.act > 0 ? Math.sin(Math.PI * Math.min(1, (0.7 - p.act) / 0.7)) * H * 0.07 : Math.max(0, Math.sin(p.tt * 2.2 + p.idx)) > 0.97 ? H * 0.01 : 0);
      break;
  }
}
// Viirien kulma: lerpallaan (alas) -> liehuu oikealle juhlan edetessä
function tkpBannerAng() {
  var lift = Math.min(1, (tkp.hugged ? 0.3 : 0) + tkp.placedN * 0.2 + (tkp.stage === 'finale' || tkp.stage === 'done' ? 0.2 : 0));
  return Math.PI * 0.47 * (1 - lift) + Math.sin(globalT * 1.3) * 0.05 * lift;
}

function tkpGuestDraw(c, p) {
  var H = viewH, s, k, a, lit;
  switch (p.kind) {
    case 'win':
      lit = tkp.winLit[p.idx] >= 0 ? Math.min(1, (tkp.t - tkp.winLit[p.idx]) / 0.35) : 0;
      if (p.flick > 0) lit = Math.max(lit, Math.sin(Math.PI * p.flick / 0.7) * 0.8);
      tkpDrawWindow(c, p, lit);
      break;
    case 'banner':
      tkpDrawBanner(c, p);
      break;
    case 'balloon':
      tkpDrawBalloon(c, p);
      break;
    case 'hedgehog': tkpDrawHedgehog(c, H * 0.045, p); break;
    case 'sunflower': tkpDrawSunflower(c, H * 0.04, p); break;
    case 'mole': tkpDrawMole(c, H * 0.046, p); break;
    case 'duck':
      s = p.mom ? H * 0.034 : H * 0.02;
      if (p.inT >= 0 && p.inT > 0.45) {
        // Uiva ankka: vesirengas
        c.strokeStyle = 'rgba(255,255,255,0.6)';
        c.lineWidth = Math.max(1, H * 0.003);
        k = (p.tt * 0.8 + p.idx * 0.3) % 1;
        if (c.ellipse) { c.beginPath(); c.ellipse(0, 0, s * (0.8 + k * 0.6), s * (0.2 + k * 0.15), 0, 0, Math.PI * 2); c.globalAlpha = 1 - k; c.stroke(); c.globalAlpha = 1; }
      }
      tkpDrawDuck(c, s, p.mom ? '#ffffff' : '#ffe066', p.face || 1, p.act > 0 && !p.mom ? p.act : 0, p.tt + p.idx);
      break;
    case 'otter': tkpDrawOtter(c, H * 0.036, p); break;
    case 'moth': tkpDrawMoth(c, H * 0.021, p); break;
    case 'sib':
      if (p.tt < p.born) return;
      c.translate(0, -p.r * 0.5);
      if (p.spin > 0) c.rotate((1 - p.spin / 0.7) * Math.PI * 2);
      trekDrawPup(c, 0, 0, H * 0.04, { mood: p.act > 0 || tkp.stage === 'finale' ? 'wow' : 'happy', t: globalT, tint: p.color, seed: p.idx * 0.7, wave: p.act > 0 || tkp.stage !== 'party', look: p.idx === 4 ? -0.6 : 0, squint: p.idx % 2 === 0 && tkp.stage === 'done' });
      break;
    case 'bunny':
      drawBunny(c, 0, 0, H * 0.042, p.hop || 0, globalT * 3 + p.idx, false);
      if (p.act > 0) {
        a = 1 - p.act / 0.7;
        c.globalAlpha = 1 - a;
        tkpHeart(c, H * 0.03, -H * 0.1 - a * H * 0.06, H * 0.016, '#ff7bac');
        c.globalAlpha = 1;
      }
      break;
  }
}

function tkpGuestPoke(p) {
  var L = tkpL(), H = L.H, i, q, n = p.n;
  tkp.idleT = 0;
  switch (p.kind) {
    case 'win':
      if (tkp.winLit[p.idx] < 0) { p.flick = 0.7; }
      else { p.hue = (p.hue + 1) % 4; tkpChime(p.idx); }
      if (n % 3 === 0) p.peek = 1.6;
      break;
    case 'banner':
      p.fl = 1.2;
      playNote(523 + p.idx * 130, 0.05, 0.2, 'triangle', 0.12);
      if (n % 3 === 0) for (i = 0; i < maneColors.length; i++) spawnSparkles(p.x, p.y, 3, maneColors[i]);
      break;
    case 'balloon':
      if (p.popT >= 0 || p.grow < 1) return;
      p.popT = 0;
      artPop(p.x, p.y, H * 0.05, p.color, 'burst');
      spawnSparkles(p.x, p.y, 12, p.color);
      playNote(180, 0, 0.06, 'square', 0.18);
      playNote(1400, 0.02, 0.05, 'triangle', 0.1);
      break;
    case 'hedgehog':
      p.act = 1.1;
      playNote(392, 0, 0.08, 'triangle', 0.18); playNote(494, 0.09, 0.08, 'triangle', 0.18); playNote(587, 0.18, 0.12, 'triangle', 0.16);
      if (n % 3 === 0) propDropBall(p.x, p.y - H * 0.05, H * 0.012, '#ff5a5a', H * 0.985, (Math.random() - 0.5) * H * 0.3);
      break;
    case 'sunflower':
      p.act = 1.2;
      playNote(659, 0, 0.18, 'sine', 0.18); playNote(784, 0.16, 0.25, 'sine', 0.16);
      if (n % 3 === 0) { spawnSparkles(p.x, p.y - H * 0.08, 14, '#ffd23f'); spawnSparkles(p.x, p.y - H * 0.08, 8, '#8a5a2c'); playNote(1047, 0.3, 0.3, 'sine', 0.14); }
      break;
    case 'mole':
      p.act = 1;
      playNote(294, 0, 0.1, 'triangle', 0.18); playNote(247, 0.1, 0.12, 'triangle', 0.16);
      artPop(p.x + H * 0.03, p.y - H * 0.035, H * 0.05, '#ffe9a8', 'ring');
      if (n % 3 === 0) {
        q = p;
        propDrop({ x: q.x, y: q.y - H * 0.05, vx: (Math.random() - 0.5) * H * 0.3, vy: -H * 0.5, ground: H * 0.97, life: 2.6,
          draw: function (c) { tkpCrystal(c, 0, H * 0.012, H * 0.008, H * 0.028, 0, '#c9a8ff'); } });
        tkpChime(4); tkpChime(6);
      }
      break;
    case 'duck':
      p.act = 0.8;
      tkpQuack(p.mom ? 330 : 880 + p.idx * 50);
      if (p.mom && n % 3 === 0) {
        // Kaikki poikaset vastaavat vuorotellen
        for (i = 0; i < props.length; i++) if (props[i].kind === 'duck' && !props[i].mom) { props[i].act = 0.8; tkpQuackAt(880 + props[i].idx * 60, 0.15 + props[i].idx * 0.13); }
      }
      if (p.inT >= 0) spawnSparkles(p.x, p.y, 6, '#bfe8ff');
      break;
    case 'otter':
      p.act = n % 3 === 0 ? 2 : 0.8;
      playNote(698, 0, 0.07, 'triangle', 0.15); playNote(932, 0.07, 0.07, 'triangle', 0.15); playNote(1175, 0.14, 0.1, 'triangle', 0.14);
      break;
    case 'moth':
      p.flee = 1.2;
      playNote(1568, 0, 0.1, 'sine', 0.1); playNote(2093, 0.06, 0.12, 'sine', 0.08);
      spawnSparkles(p.x, p.y, 6, '#eaffb0');
      break;
    case 'sib':
      p.act = 1;
      p.spin = 0.7;
      playNote(TKP_SIB_NOTES[p.idx] * 2, 0.08, 0.16, 'triangle', 0.14);
      if (n % 3 === 0) for (i = 0; i < 8; i++) tkpDrop(p.x + (Math.random() - 0.5) * H * 0.06, p.y + H * 0.01, p.color);
      break;
    case 'bunny':
      p.act = 0.7;
      soundBunny();
      break;
  }
}

// ---------- Syöte ----------
function tkpTap(px, py) {
  var L = tkpL(), H = L.H, i, s, d, id;
  if (!tkp.built) return;
  initAudio();
  tkp.idleT = 0;
  if (tkp.drag || tkp.pdrag) return;
  // Korin lahja tarttuu sormeen
  if (tkp.stage === 'party' || tkp.stage === 'hug') {
    for (i = 0; i < TKP_GIFTS.length; i++) {
      id = TKP_GIFTS[i];
      if (!tkp.inBasket[id]) continue;
      s = tkpBasketSlot(i);
      if (Math.hypot(px - s.x, py - s.y) < H * 0.06) {
        tkp.inBasket[id] = false;
        tkp.drag = { id: id, x: s.x, y: s.y };
        playNote(880, 0, 0.07, 'sine', 0.18);
        playNote(1175, 0.05, 0.08, 'sine', 0.14);
        return;
      }
    }
  }
  // Pikkupilvi: raahaus alkaa (lyhyt napautus = kikatus)
  if (tkp.stage === 'reunion' || tkp.stage === 'party' || tkp.stage === 'done') {
    if (Math.hypot(px - tkp.px, py - tkp.py) < tkp.pr * 1.45) {
      tkp.pdrag = { t0: tkp.t, x0: px, y0: py, moved: false };
      return;
    }
  } else if (Math.hypot(px - tkp.px, py - tkp.py) < tkp.pr * 1.2) {
    tkpPupPoke();
    return;
  }
  if (propsTap(px, py)) return;
  // Kuplat poksahtavat
  for (i = tkp.bubbles.length - 1; i >= 0; i--) {
    d = tkp.bubbles[i];
    if (Math.hypot(px - d.x, py - d.y) < d.r + H * 0.02) {
      tkp.bubbles.splice(i, 1);
      artPop(d.x, d.y, d.r * 2, '#bfe8ff', 'ring');
      spawnSparkles(d.x, d.y, 5, '#bfe8ff');
      playNote(700 + Math.random() * 500, 0, 0.06, 'sine', 0.16);
      return;
    }
  }
  // Äitipilvi
  if (Math.hypot(px - L.mom.x, (py - L.mom.y) * 1.15) < L.mom.r * 1.05) { tkpMomPoke(); return; }
  // Jalustat
  for (i = 0; i < 4; i++) {
    s = L.ped[i];
    if (Math.abs(px - s.x) < H * 0.075 && py > s.y - H * 0.19 && py < s.y + H * 0.02) { tkpPedPoke(i); return; }
  }
  // Yksisarvinen
  if (Math.abs(px - L.uni.x - H * 0.01) < H * 0.11 && py > L.uni.y - H * 0.23 && py < L.uni.y && tkp.t > TKP_ARRIVE[1] + 0.8) {
    tkp.uniT = 0.8;
    tkp.uniN++;
    playNote(660, 0, 0.12, 'triangle', 0.2); playNote(880, 0.1, 0.12, 'triangle', 0.2); playNote(740, 0.2, 0.2, 'triangle', 0.18);
    spawnSparkles(L.uni.x + H * 0.08, L.uni.y - H * 0.2, 6, '#ff9fb8');
    if (tkp.uniN % 3 === 0) for (i = 0; i < 3; i++) tkpAddHeart(L.uni.x + H * (0.02 + i * 0.03), L.uni.y - H * 0.22, 0.2 * i);
    return;
  }
  // Kori heilahtaa
  if (Math.abs(px - L.basket.x) < L.basket.w * 0.55 && py > L.basket.y - H * 0.06) {
    tkp.basketShake = 0.5;
    playNote(330, 0, 0.08, 'triangle', 0.14);
    return;
  }
  // Kuu
  if (Math.hypot(px - L.moon.x, py - L.moon.y) < L.moon.r * 1.6) {
    tkp.moonT = 0.9;
    tkp.moonN++;
    playNote(988, 0, 0.12, 'sine', 0.15); playNote(1319, 0.1, 0.2, 'sine', 0.13);
    spawnSparkles(L.moon.x, L.moon.y, 8, '#fff4c4');
    if (tkp.moonN % 3 === 0) tkpShootingStar();
    return;
  }
  // Taivas: tähtilahjan jälkeen ilotulite napautuskohtaan, ennen sitä tuike
  if (py < H * 0.5) {
    if (tkpStarLit()) {
      tkp.skyTaps++;
      tkpLaunch(px, Math.max(H * 0.08, Math.min(py, H * 0.42)));
    } else {
      spawnSparkles(px, py, 6, '#fff4c4');
      artPop(px, py, H * 0.03, '#ffffff', 'ring');
      playNote(1319 + Math.random() * 600, 0, 0.12, 'sine', 0.08);
    }
  }
}
function tkpStarLit() {
  var i = tkpSlotOf('star');
  return i >= 0 && tkp.slots[i].placed && tkp.slots[i].t > 0.5;
}
function tkpPupPoke() {
  tkp.pupPokeT = 0.8;
  tkp.pupN++;
  trekPupSound('giggle');
  spawnSparkles(tkp.px, tkp.py, 8, '#bfe0ff');
  if (tkp.pupN % 3 === 0 && tkp.stage !== 'arrive') tkp.pupLoopT = 0.9;
}
function tkpMomPoke() {
  var L = tkpL(), i;
  tkp.momPokeT = 0.6;
  tkp.momN++;
  if (!tkp.hugged) {
    // Surullinen äiti huokaisee ja katsoo Pikkupilveä
    playNote(392, 0, 0.3, 'sine', 0.14); playNote(330, 0.25, 0.4, 'sine', 0.12);
    return;
  }
  playNote(494, 0, 0.07, 'triangle', 0.16); playNote(587, 0.08, 0.07, 'triangle', 0.16);
  playNote(659, 0.16, 0.07, 'triangle', 0.16); playNote(587, 0.24, 0.12, 'triangle', 0.14);
  spawnSparkles(L.mom.x, L.mom.y - L.mom.r * 0.5, 8, '#e6d4ff');
  if (tkp.momN % 3 === 0) for (i = 0; i < 16; i++) tkpDrop(L.mom.x + (Math.random() - 0.5) * L.mom.r * 1.6, L.mom.y + L.mom.r * 0.5, null);
  if (tkp.momN % 5 === 0) for (i = 0; i < 4; i++) tkpAddHeart(L.mom.x + (i - 1.5) * L.mom.r * 0.4, L.mom.y - L.mom.r * 0.8, i * 0.12);
}
function tkpPedPoke(i) {
  var s = tkp.slots[i], g = tkpGiftTop(i), H = viewH, k, j;
  s.pulse = 0.8;
  if (!s.placed) {
    // Siluetti hehkahtaa ja korin oikea lahja heilahtaa vihjeeksi
    tkp.wig[s.gift] = 0.8;
    artPop(g.x, g.y, H * 0.05, TKP_GCOL[s.gift], 'ring');
    playNote(587, 0, 0.1, 'sine', 0.12); playNote(784, 0.1, 0.14, 'sine', 0.1);
    return;
  }
  s.boost = 1;
  if (s.gift === 'flower') {
    spawnSparkles(g.x, g.y, 14, '#ff7bac');
    for (j = 0; j < 3; j++) playNote(1047 + j * 262, j * 0.07, 0.12, 'sine', 0.12);
  } else if (s.gift === 'shell') {
    for (j = 0; j < 6; j++) tkpBubble(g.x, g.y, true);
    playNote(523, 0, 0.08, 'sine', 0.15); playNote(784, 0.06, 0.1, 'sine', 0.13);
  } else if (s.gift === 'crystal') {
    for (j = 0; j < 4; j++) tkpChime(j * 2);
    for (k = 0; k < tkp.winLit.length; k++) if (tkp.winLit[k] >= 0) tkp.winLit[k] = tkp.t - 0.1;
  } else {
    tkpShootingStar();
  }
}

// ---------- Päivitys ----------
function tkpUpdate(dt) {
  var L = tkpL(), H = L.H, t0 = tkp.t, t1, i, k, p;
  if (!tkp.built) return;
  tkp.t += dt;
  t1 = tkp.t;
  tkp.stT += dt;
  tkp.idleT += dt;
  if (holding) tkp.idleT = 0;
  updateParticles(dt);
  propsUpdate(dt);
  updateConfetti(dt);
  if (tkp.pupPokeT > 0) tkp.pupPokeT -= dt;
  if (tkp.pupLoopT > 0) tkp.pupLoopT -= dt;
  if (tkp.pupWowT > 0) tkp.pupWowT -= dt;
  if (tkp.momPokeT > 0) tkp.momPokeT -= dt;
  if (tkp.moonT > 0) tkp.moonT -= dt;
  if (tkp.uniT > 0) tkp.uniT -= dt;
  if (tkp.basketShake > 0) tkp.basketShake -= dt;
  for (k in tkp.wig) if (tkp.wig[k] > 0) tkp.wig[k] -= dt;

  // Jälleennäkemisen lento ja laskeutuminen
  if (tkp.stage === 'arrive') {
    tkpUpdateArrive(dt, t0, t1, L);
  } else if (tkp.stage === 'reunion') {
    tkpUpdatePupDrag(dt, L);
    if (!tkp.pdrag) tkp.py += Math.sin(t1 * 2) * H * 0.006 * dt;
  } else if (tkp.stage === 'hug') {
    tkp.hugT += dt;
    tkpUpdateHug(dt, L);
  } else {
    if (tkp.stage === 'party') tkp.partyT += dt;
    tkpUpdatePupDrag(dt, L);
  }
  // Lahjat
  tkpUpdateDrag(dt);
  tkpUpdateFlies(dt);
  for (i = 0; i < 4; i++) tkpUpdateSlot(i, dt, L);
  for (k in tkp.rides) {
    p = tkp.rides[k];
    p.t += dt;
    if (k === 'river' && p.t > TKP_RISE_T + 3.6) p.fade = Math.min(1, p.fade + dt);
  }
  if (tkp.stage === 'party' && tkp.placedN >= 4 && tkpAllShown()) {
    tkp.stage = 'finale';
    tkp.finT = 0;
  }
  if (tkp.stage === 'finale') tkpUpdateFinale(dt, L);
  if (tkp.stage === 'done') {
    // Kehyksen juhlan aikana ilotulitteita silloin tällöin
    tkp.autoT -= dt;
    if (tkp.autoT <= 0) { tkp.autoT = tkpRnd(1.1, 1.8); tkpLaunch(L.W * tkpRnd(0.15, 0.85), H * tkpRnd(0.1, 0.3)); }
  }
  // Ilosade (halauksesta ja lopusta)
  if (tkp.rainK > 0) {
    if (Math.random() < dt * 26 * tkp.rainK) tkpDrop(L.mom.x + (Math.random() - 0.5) * L.mom.r * 1.6, L.mom.y + L.mom.r * 0.55, null);
    if (Math.random() < dt * 12 * tkp.rainK) tkpDrop(tkp.px + (Math.random() - 0.5) * tkp.pr * 1.4, tkp.py + tkp.pr * 0.6, null);
  }
  tkpUpdateFx(dt, L);
  tkpUpdateMelody(dt);
  // Valaistus kirkastuu juhlan edetessä
  k = Math.min(1, (tkp.hugged ? 0.2 : 0) + tkp.placedN * 0.17 + (tkp.stage === 'finale' || tkp.stage === 'done' ? 0.12 : 0));
  tkpLight.tint[0] = 'rgba(30,20,90,' + (0.26 - 0.2 * k).toFixed(3) + ')';
  tkpLight.tint[1] = 'rgba(15,10,50,' + (0.16 - 0.12 * k).toFixed(3) + ')';
  tkpLight.vignette = 0.55 - 0.3 * k;
}
function tkpUpdateArrive(dt, t0, t1, L) {
  var H = L.H, k, a, b, q, u;
  if (tkpCross(t0, t1, TKP_ARRIVE[0])) {
    for (k = 0; k < 6; k++) playNote(392 + k * 98, k * 0.09, 0.14, 'sine', 0.1);
  }
  if (t1 < TKP_ARRIVE[0]) { tkp.px = -H; tkp.py = H * 0.3; tkp.pr = H * TKP_BIG_R; return; }
  if (t1 < TKP_ARRIVE[1]) {
    k = easeInOutSine((t1 - TKP_ARRIVE[0]) / (TKP_ARRIVE[1] - TKP_ARRIVE[0]));
    a = { x: -H * 0.3, y: H * 0.46 }; b = L.land; q = { x: L.c - L.sx * 0.95, y: H * 0.36 };
    u = 1 - k;
    tkp.px = u * u * a.x + 2 * u * k * q.x + k * k * b.x;
    tkp.py = u * u * a.y + 2 * u * k * q.y + k * k * b.y;
    tkp.pr = H * TKP_BIG_R;
    return;
  }
  if (tkpCross(t0, t1, TKP_ARRIVE[1])) {
    trekPupSound('yay');
    artPop(L.land.x, L.land.y, H * 0.12, '#ffe27a', 'ring');
  }
  // Kutistuminen: ylimääräinen auringonvalo kipinöinä taivaalle
  k = Math.min(1, (t1 - TKP_ARRIVE[1] - 0.35) / TKP_SHRINK_T);
  if (k > 0) {
    if (tkpCross(t0, t1, TKP_ARRIVE[1] + 0.4)) for (a = 0; a < 7; a++) playNote(1568 - a * 150, a * 0.12, 0.16, 'sine', 0.09);
    if (Math.random() < dt * 22 * (1 - k)) {
      particles.push({ x: tkp.px + (Math.random() - 0.5) * tkp.pr * 1.5, y: tkp.py - tkp.pr * 0.3, vx: (Math.random() - 0.5) * H * 0.15, vy: -H * tkpRnd(0.3, 0.6), life: 1.2, age: 0, size: 4 + Math.random() * 4, color: Math.random() < 0.5 ? '#ffe27a' : '#fff4c4', noGravity: true });
    }
  }
  k = easeInOutSine(Math.max(0, k));
  tkp.pr = H * (TKP_BIG_R + (TKP_PUP_R - TKP_BIG_R) * k);
  tkp.px = L.land.x + H * 0.04 * k;
  tkp.py = L.land.y + H * 0.06 * k;
  if (t1 >= TKP_ARRIVE[1] + 0.35 + TKP_SHRINK_T) {
    tkp.stage = 'reunion';
    tkp.stT = 0;
    tkp.idleT = 0;
    trekPupSound('wow');
  }
}
// Pikkupilven raahaus (jälleennäkeminen: halaus äidin luona, juhlassa vapaa leikki)
function tkpUpdatePupDrag(dt, L) {
  var H = L.H, d = tkp.pdrag, k, home;
  if (d) {
    if (holding) {
      if (Math.hypot(lastPX - d.x0, lastPY - d.y0) > H * 0.025) d.moved = true;
      if (d.moved) {
        k = Math.min(1, dt * 16);
        tkp.px += (lastPX - tkp.px) * k;
        tkp.py += (lastPY - tkp.py) * k;
        tkp.px = Math.max(tkp.pr, Math.min(L.W - tkp.pr, tkp.px));
        tkp.py = Math.max(H * 0.12, Math.min(H * 0.92, tkp.py));
      }
    } else {
      tkp.pdrag = null;
      if (!d.moved && tkp.t - d.t0 < 0.5) tkpPupPoke();
    }
    if (tkp.stage === 'reunion' && Math.hypot(tkp.px - L.mom.x, tkp.py - L.mom.y) < L.mom.r * TKP_HUG_R) tkpStartHug();
    return;
  }
  if (tkp.stage !== 'reunion') {
    home = L.home;
    k = Math.min(1, dt * 3.5);
    tkp.px += (home.x - tkp.px) * k;
    tkp.py += (home.y + Math.sin(tkp.t * 2) * H * 0.008 - tkp.py) * k;
  }
}
function tkpStartHug() {
  var L = tkpL(), i;
  tkp.pdrag = null;
  tkp.stage = 'hug';
  tkp.hugT = 0;
  tkp.hugged = true;
  tkp.rainK = 1;
  tkp.smallBowT = 0;
  trekPupSound('yay');
  playNote(262, 0.3, 0.9, 'sine', 0.16); playNote(330, 0.3, 0.9, 'sine', 0.14); playNote(392, 0.3, 0.9, 'sine', 0.14);
  playNote(523, 0.75, 0.25, 'triangle', 0.16); playNote(659, 0.9, 0.25, 'triangle', 0.16); playNote(784, 1.05, 0.5, 'triangle', 0.16);
  artPop(L.hug.x + L.mom.r * 0.5, L.mom.y, L.mom.r * 1.2, '#ff9fd0', 'burst');
  for (i = 0; i < 6; i++) tkpAddHeart(L.mom.x + (Math.random() - 0.7) * L.mom.r * 1.4, L.mom.y - L.mom.r * 0.6, i * 0.18);
  spawnSparkles(L.hug.x + L.mom.r * 0.4, L.mom.y, 18, '#ff9fd0');
}
function tkpUpdateHug(dt, L) {
  var k = Math.min(1, dt * 6), h = tkp.hugT;
  tkp.px += (L.hug.x - tkp.px) * k;
  tkp.py += (L.hug.y - tkp.py) * k;
  if (h > 1 && h - dt <= 1) for (k = 0; k < 4; k++) tkpAddHeart(L.mom.x + (k - 1.5) * L.mom.r * 0.5, L.mom.y - L.mom.r, k * 0.15);
  tkp.rainK = h < 2.2 ? 1 : Math.max(0, 1 - (h - 2.2) / 1.6);
  if (h >= TKP_HUG_T) {
    tkp.stage = 'party';
    tkp.stT = 0;
    tkp.partyT = 0;
    tkp.idleT = 0;
    playNote(784, 0, 0.1, 'sine', 0.14); playNote(1047, 0.1, 0.18, 'sine', 0.14);
  }
}
// Raahattu lahja seuraa sormea; irrotus jalustan kohdalla sijoittaa sen
function tkpUpdateDrag(dt) {
  var d = tkp.drag, k, H = viewH, i, best, bd, p, g, s;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 20);
    d.x += (lastPX - d.x) * k;
    d.y += (lastPY - H * 0.035 - d.y) * k;
    return;
  }
  tkp.drag = null;
  best = -1; bd = 1e9;
  for (i = 0; i < 4; i++) {
    g = tkpGiftTop(i);
    p = Math.hypot(d.x - g.x, (d.y - g.y) * 0.8);
    if (p < H * TKP_SNAP && p < bd) { bd = p; best = i; }
  }
  if (best >= 0 && !tkp.slots[best].placed && tkp.slots[best].gift === d.id) {
    g = tkpGiftTop(best);
    tkp.flies.push({ id: d.id, x0: d.x, y0: d.y, x1: g.x, y1: g.y, t: 0, dur: 0.3, to: best });
    return;
  }
  if (best >= 0 && !tkp.slots[best].placed) {
    // Väärä jalusta: hmm, jalusta heilahtaa ja lahja leijuu takaisin
    tkp.slots[best].wob = 0.6;
    trekPupSound('hmm');
    tkp.wig[d.id] = 0;
  }
  s = tkpBasketSlot(TKP_GIFTS.indexOf(d.id));
  tkp.flies.push({ id: d.id, x0: d.x, y0: d.y, x1: s.x, y1: s.y, t: 0, dur: 0.55, to: -1 });
}
function tkpUpdateFlies(dt) {
  var i, f;
  for (i = tkp.flies.length - 1; i >= 0; i--) {
    f = tkp.flies[i];
    f.t += dt;
    if (f.t < f.dur) continue;
    tkp.flies.splice(i, 1);
    if (f.to >= 0) tkpPlace(f.to);
    else { tkp.inBasket[f.id] = true; playNote(523, 0, 0.06, 'sine', 0.08); }
  }
}
function tkpPlace(i) {
  var s = tkp.slots[i], g = tkpGiftTop(i), H = viewH, j, L = tkpL();
  s.placed = true;
  s.t = 0;
  tkp.placedN++;
  tkp.order.push(s.gift);
  tkp.pupWowT = 1.4;
  tkp.momPokeT = 0.4;
  trekPupSound('wow');
  artPop(g.x, g.y, H * 0.09, TKP_GCOL[s.gift], 'burst');
  artPop(g.x, g.y, H * 0.06, '#ffffff', 'ring');
  spawnSparkles(g.x, g.y, 18, TKP_GCOL[s.gift]);
  if (s.gift === 'flower') {
    // Kukat puhkeavat aaltona jalustasta ulospäin
    for (j = 0; j < tkp.flowers.length; j++) tkp.flowers[j].d = 0.25 + Math.hypot(tkp.flowers[j].fx * L.W - g.x, tkp.flowers[j].fy * L.H - g.y) / H * 0.85;
  }
}
// Lahjan näytös jalustalla (aika s.t sijoituksesta)
function tkpUpdateSlot(i, dt, L) {
  var s = tkp.slots[i], H = L.H, t0 = s.t, t1, j, f, g;
  if (s.wob > 0) s.wob -= dt;
  if (s.pulse > 0) s.pulse -= dt;
  if (s.boost > 0) s.boost -= dt;
  if (!s.placed) return;
  s.t += dt;
  t1 = s.t;
  g = tkpGiftTop(i);
  if (tkpCross(t0, t1, TKP_GUEST_T)) {
    tkpAddGuests(s.gift);
    for (j = 0; j < 5; j++) playNote(523 + j * 131, j * 0.1, 0.16, 'triangle', 0.1);
  }
  if (s.gift === 'flower') {
    for (j = 0; j < tkp.flowers.length; j++) {
      f = tkp.flowers[j];
      if (tkpCross(t0, t1, f.d)) {
        if (j % 2 === 0) playNote(1047 + (j % 7) * 120, 0, 0.1, 'sine', 0.07);
        spawnSparkles(f.fx * L.W, f.fy * H, 3, f.col);
      }
    }
    tkp.garK = tkpClamp((t1 - 0.6) / 1.6);
    if (tkpCross(t0, t1, 0.05)) { playNote(523, 0, 0.2, 'triangle', 0.14); playNote(659, 0.1, 0.2, 'triangle', 0.14); playNote(784, 0.2, 0.3, 'triangle', 0.14); }
  } else if (s.gift === 'shell') {
    if (Math.random() < dt * (4 + (s.boost > 0 ? 14 : 0)) && t1 > 0.5) tkpBubble(g.x, g.y - H * 0.02, false);
    if (tkpCross(t0, t1, 0.1)) { tkpSplash(g.x, g.y + H * 0.04); playNote(392, 0, 0.12, 'sine', 0.16); playNote(523, 0.1, 0.12, 'sine', 0.16); playNote(784, 0.2, 0.2, 'sine', 0.14); }
  } else if (s.gift === 'crystal') {
    for (j = 0; j < 9; j++) {
      if (tkpCross(t0, t1, 0.35 + j * 0.22)) {
        tkp.winLit[j] = tkp.t;
        tkpChime(j);
        g = tkpGeo().wins[j];
        spawnSparkles(L.c + g[0] * H, g[1] * H, 6, '#ffe9a8');
        artPop(L.c + g[0] * H, g[1] * H, H * 0.04, '#ffe9a8', 'ring');
      }
    }
    if (tkpCross(t0, t1, 0.35 + 9 * 0.22 + 0.3)) { tkp.melOn = true; tkp.melT = 0; tkp.melI = 0; }
  } else {
    tkp.skyK = tkpClamp(t1 / 1.6);
    if (tkpCross(t0, t1, 0.05)) for (j = 0; j < 8; j++) playNote(784 + j * 110, j * 0.06, 0.2, 'sine', 0.08);
    if (tkpCross(t0, t1, 0.7)) tkpLaunch(L.c - L.sx * 0.5, H * 0.16);
    if (tkpCross(t0, t1, 1.1)) tkpLaunch(L.c + L.sx * 0.45, H * 0.13);
    if (tkpCross(t0, t1, 1.5)) tkpLaunch(L.c, H * 0.07);
  }
}
function tkpAllShown() {
  var i;
  for (i = 0; i < 4; i++) if (!tkp.slots[i].placed || tkp.slots[i].t < TKP_GUEST_T + TKP_FIN_WAIT) return false;
  return true;
}
// Loppunäytös: koolla, yhteinen sade ja iso sateenkaari, ilotulitus, juhlakuva
function tkpUpdateFinale(dt, L) {
  var H = L.H, t0 = tkp.finT, t1, i, xs = [0.25, 0.75, 0.5, 0.15, 0.85, 0.4, 0.62, 0.5];
  tkp.finT += dt;
  t1 = tkp.finT;
  if (tkpCross(t0, t1, 0.1)) {
    trekPupSound('yay');
    for (i = 0; i < props.length; i++) if (props[i].kind !== 'win' && props[i].kind !== 'balloon') { props[i].t = 0; props[i].act = Math.max(props[i].act || 0, 0.7); }
  }
  if (tkpCross(t0, t1, 0.6)) { tkp.rainK = 1; playNote(1319, 0, 0.3, 'sine', 0.1); playNote(1568, 0.15, 0.3, 'sine', 0.1); }
  if (tkpCross(t0, t1, 1.0)) for (i = 0; i < 7; i++) playNote([523, 587, 659, 784, 880, 1047, 1319][i], i * 0.12, 0.4, 'triangle', 0.13);
  for (i = 0; i < xs.length; i++) if (tkpCross(t0, t1, 2.6 + i * 0.38)) tkpLaunch(L.W * xs[i], H * (0.08 + (i % 3) * 0.06));
  if (t1 > 3.4) tkp.rainK = Math.max(0.35, tkp.rainK - dt * 0.4);
  if (tkpCross(t0, t1, 6.0)) {
    tkp.flashT = 0;
    playNote(1800, 0, 0.03, 'square', 0.1); playNote(900, 0.05, 0.05, 'square', 0.08); playNote(1400, 0.2, 0.25, 'sine', 0.1);
  }
  if (tkp.flashT >= 0) tkp.flashT += dt;
  if (t1 >= TKP_FIN_T) {
    tkp.stage = 'done';
    tkp.flashT = -1;
    tkp.autoT = 1.5;
    trekChapterDone();
  }
}
function tkpUpdateFx(dt, L) {
  var H = L.H, i, d, r, b, f;
  for (i = tkp.drops.length - 1; i >= 0; i--) {
    d = tkp.drops[i];
    d.y += d.vy * dt;
    d.vy += H * 0.4 * dt;
    if (d.y > d.floor) {
      tkp.drops.splice(i, 1);
      if (Math.random() < 0.4) spawnSparkles(d.x, d.floor, 2, d.col);
    }
  }
  for (i = tkp.hearts.length - 1; i >= 0; i--) {
    d = tkp.hearts[i];
    d.t += dt;
    if (d.t < 0) continue;
    d.y -= H * 0.12 * dt;
    d.x += Math.sin(d.t * 4 + d.ph) * H * 0.04 * dt;
    if (d.t > d.life) tkp.hearts.splice(i, 1);
  }
  for (i = tkp.bubbles.length - 1; i >= 0; i--) {
    b = tkp.bubbles[i];
    b.t += dt;
    b.y -= b.vy * dt;
    b.x += Math.sin(b.t * 3 + b.ph) * H * 0.03 * dt;
    if (b.t > b.life) {
      tkp.bubbles.splice(i, 1);
      artPop(b.x, b.y, b.r * 1.6, '#bfe8ff', 'ring');
      if (Math.random() < 0.3) playNote(900 + Math.random() * 600, 0, 0.05, 'sine', 0.05);
    }
  }
  for (i = tkp.rockets.length - 1; i >= 0; i--) {
    r = tkp.rockets[i];
    r.t += dt;
    if (r.t >= r.dur) { tkp.rockets.splice(i, 1); tkpBurst(r.tx, r.ty, r.col, r.col2, r.shape); }
  }
  for (i = tkp.bursts.length - 1; i >= 0; i--) {
    tkp.bursts[i].t += dt;
    if (tkp.bursts[i].t > 1.8) tkp.bursts.splice(i, 1);
  }
  f = tkp.shoot;
  if (f) { f.t += dt; if (f.t > 1.1) tkp.shoot = null; }
  if (tkp.smallBowT >= 0) tkp.smallBowT += dt;
}
// Juhlamelodia soi kristallilahjasta loppuun asti; nuotti kerrallaan, joten
// se loppuu heti, kun etappi (tai kenttä) päättyy
function tkpUpdateMelody(dt) {
  var i, f;
  if (!tkp.melOn) return;
  tkp.melT += dt;
  while (tkp.melT >= TKP_STEP) {
    tkp.melT -= TKP_STEP;
    i = tkp.melI % TKP_MELODY.length;
    f = TKP_MELODY[i];
    if (f) playNote(f, 0, TKP_STEP * 1.6, 'triangle', 0.055);
    if (i % 4 === 0) playNote(TKP_BASS[Math.floor(i / 8) % 4] * (i % 8 === 4 ? 1.5 : 1), 0, TKP_STEP * 2.6, 'sine', 0.08);
    if (i % 8 === 6 && tkp.stage !== 'party') playNote(f ? f * 2 : 2093, 0, 0.08, 'sine', 0.025);
    tkp.melI++;
  }
}

// ---------- Efektit ----------
function tkpDrop(x, y, col) {
  if (tkp.drops.length > 90) return;
  tkp.drops.push({ x: x, y: y, vy: viewH * tkpRnd(0.12, 0.25), col: col || maneColors[Math.floor(Math.random() * maneColors.length)], floor: viewH * tkpRnd(0.66, 0.8) });
}
function tkpAddHeart(x, y, delay) {
  if (tkp.hearts.length > 30) return;
  tkp.hearts.push({ x: x, y: y, t: -(delay || 0), life: 1.6, ph: Math.random() * 6, s: viewH * tkpRnd(0.014, 0.022), col: ['#ff7bac', '#ff5f7e', '#ff9fd0'][Math.floor(Math.random() * 3)] });
}
function tkpBubble(x, y, big) {
  if (tkp.bubbles.length > 24) return;
  tkp.bubbles.push({ x: x + (Math.random() - 0.5) * viewH * 0.03, y: y, r: viewH * (big ? tkpRnd(0.012, 0.02) : tkpRnd(0.006, 0.013)), vy: viewH * tkpRnd(0.07, 0.13), t: 0, life: tkpRnd(1.6, 2.8), ph: Math.random() * 6 });
}
function tkpSplash(x, y) {
  var i;
  for (i = 0; i < 8; i++) {
    particles.push({ x: x + (Math.random() - 0.5) * viewH * 0.05, y: y, vx: (Math.random() - 0.5) * viewH * 0.3, vy: -viewH * tkpRnd(0.2, 0.45), life: 0.6, age: 0, size: 3 + Math.random() * 3, color: '#bfe8ff' });
  }
  playNote(600, 0, 0.05, 'sine', 0.1);
  playNote(400, 0.04, 0.08, 'sine', 0.08);
}
function tkpQuack(f) { tkpQuackAt(f, 0); }
function tkpQuackAt(f, d) {
  playNote(f, d, 0.07, 'square', 0.06);
  playNote(f * 0.82, d + 0.06, 0.09, 'square', 0.05);
}
function tkpChime(i) {
  var f = TKP_CHIMES[i % TKP_CHIMES.length];
  playNote(f, 0, 0.6, 'sine', 0.1);
  playNote(f * 2, 0.01, 0.3, 'sine', 0.035);
}
function tkpShootingStar() {
  var H = viewH;
  tkp.shoot = { t: 0, x0: viewW * tkpRnd(0.15, 0.5), y0: H * tkpRnd(0.05, 0.15), dx: viewW * 0.45, dy: H * 0.18 };
  playNote(2093, 0, 0.2, 'sine', 0.08); playNote(1760, 0.1, 0.2, 'sine', 0.07); playNote(1319, 0.2, 0.3, 'sine', 0.06);
}
function tkpLaunch(tx, ty) {
  var i, cols = ['#ff7bac', '#ffd24f', '#7fd0ff', '#6fd66f', '#b678ff', '#ff9f6a', '#ffffff'], shapes = ['ring', 'ring', 'heart', 'star', 'willow'];
  if (tkp.rockets.length > 6) return;
  tkp.rockets.push({ x0: tx + (Math.random() - 0.5) * viewH * 0.15, y0: viewH * 0.62, tx: tx, ty: ty, t: 0, dur: 0.7,
    col: cols[Math.floor(Math.random() * 6)], col2: cols[Math.floor(Math.random() * 7)], shape: shapes[Math.floor(Math.random() * shapes.length)] });
  for (i = 0; i < 5; i++) playNote(500 + i * 140, i * 0.07, 0.09, 'sine', 0.05);
}
function tkpBurst(x, y, col, col2, shape) {
  var parts = [], n = shape === 'willow' ? 22 : 28, i, a, hx, hy, sp;
  for (i = 0; i < n; i++) {
    a = i / n * Math.PI * 2;
    if (shape === 'heart') {
      hx = 16 * Math.pow(Math.sin(a), 3) / 17;
      hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17;
      parts.push({ dx: hx, dy: hy, c: i % 2 ? col : col2 });
    } else if (shape === 'star') {
      sp = i % 2 ? 0.5 : 1;
      a = Math.floor(i / 2) / (n / 2) * Math.PI * 2 + (i % 2 ? Math.PI / 5 : 0) - Math.PI / 2;
      parts.push({ dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, c: sp === 1 ? col : col2 });
    } else {
      sp = 0.85 + Math.random() * 0.2;
      parts.push({ dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, c: i % 3 ? col : col2 });
    }
  }
  if (tkp.bursts.length > 8) tkp.bursts.shift();
  tkp.bursts.push({ x: x, y: y, t: 0, parts: parts, col: col, R: viewH * (shape === 'heart' ? 0.13 : 0.16), willow: shape === 'willow' });
  playNote(95, 0, 0.45, 'triangle', 0.25);
  playNote(1500 + Math.random() * 800, 0.15, 0.08, 'sine', 0.05);
  playNote(1800 + Math.random() * 800, 0.27, 0.08, 'sine', 0.04);
}

// ---------- Piirto ----------
function tkpDraw() {
  var c = ctx, L, H, i, p;
  if (!beginPlayWorld()) return;
  tkpPrerender();
  L = tkpL();
  H = L.H;
  // Taivas: kirkastuminen, tähdet, kuu, tähdenlento ja iso sateenkaari
  if (tkp.skyK > 0) {
    c.globalAlpha = tkp.skyK;
    c.drawImage(tkpSkyLitCv, 0, 0, tkpSkyLitCv.width, tkpSkyLitCv.height, 0, 0, L.W, H * 0.72);
    c.globalAlpha = 1;
  }
  tkpDrawStars(c, L);
  tkpDrawMoon(c, L);
  tkpDrawShoot(c);
  if (tkp.stage === 'finale' || tkp.stage === 'done') tkpDrawBigRainbow(c, tkp.stage === 'done' ? 1 : easeInOutSine((tkp.finT - 1) / 1.8));
  // Linna ja sen elävät osat
  c.drawImage(tkpCastleCv, 0, 0, tkpCastleCv.width, tkpCastleCv.height, 0, 0, L.W, H * 0.75);
  tkpDrawGarlands(c, L);
  propsDraw(c, 5);
  tkpDrawFireworks(c);
  // Vieraiden pilvikyydit, taivaan vieraat ja pilvien vieraat
  tkpDrawRides(c, L);
  propsDraw(c, 6);
  propsDraw(c, 2);
  // Piha
  c.drawImage(tkpFloorCv, 0, 0, tkpFloorCv.width, tkpFloorCv.height, 0, L.floorY, L.W, H * 0.42);
  tkpDrawFlowers(c, L);
  tkpDrawSmallRainbow(c, L);
  tkpDrawFamily(c, L);
  for (i = 0; i < 4; i++) tkpDrawPedestal(c, L, i);
  propsDraw(c, 3);
  for (i = 0; i < tkp.bubbles.length; i++) tkpDrawBubble(c, tkp.bubbles[i]);
  tkpDrawDrops(c);
  propsDraw(c, 4);
  tkpDrawUnicorn(c, L);
  tkpDrawBasket(c, L);
  for (i = 0; i < tkp.flies.length; i++) {
    p = tkp.flies[i];
    var k = easeInOutSine(p.t / p.dur);
    tkpGiftDraw(p.id, c, p.x0 + (p.x1 - p.x0) * k, p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * H * (p.to >= 0 ? 0.03 : 0.07), H * 0.08);
  }
  if (tkp.drag) {
    artShadow(c, tkp.drag.x, tkp.drag.y + H * 0.08, H * 0.035, H * 0.009, 0.2);
    artGlow(c, tkp.drag.x, tkp.drag.y, H * 0.08, TKP_GCOL[tkp.drag.id], 0.35);
    tkpGiftDraw(tkp.drag.id, c, tkp.drag.x, tkp.drag.y, H * 0.09);
  }
  tkpDrawHearts(c);
  drawParticlesLayer(c);
  propsDraw(c, 0);
  tkpDrawHints(c, L);
  endPlayWorld();
  // Kehyksen juhlasateenkaari piirtyy kaiken päälle: taivaan ja pilvien
  // vieraat nostetaan sen yli, jotta ne näkyvät kirkkaina juhlan loppuun
  if (celebrating) {
    tkpDrawRides(c, L);
    propsDraw(c, 6);
    propsDraw(c, 2);
  }
  tkpDrawPhoto(c, L);
}

function tkpDrawStars(c, L) {
  var i, s, a, x, y, r, b = 0.35 + 0.65 * tkp.skyK;
  for (i = 0; i < tkp.stars.length; i++) {
    s = tkp.stars[i];
    a = (0.5 + 0.5 * Math.sin(globalT * (1.2 + i * 0.07) + s.ph)) * b;
    if (a < 0.15) continue;
    x = s.fx * L.W; y = s.fy * L.H; r = s.r * L.H * (0.6 + a * 0.6);
    c.fillStyle = 'rgba(255,250,220,' + a.toFixed(2) + ')';
    c.beginPath();
    c.moveTo(x, y - r * 2); c.quadraticCurveTo(x, y, x + r * 2, y); c.quadraticCurveTo(x, y, x, y + r * 2); c.quadraticCurveTo(x, y, x - r * 2, y); c.quadraticCurveTo(x, y, x, y - r * 2);
    c.fill();
  }
}
// Kuu: nukkuu surun aikana, herää halauksesta, iskee silmää napautuksesta
function tkpDrawMoon(c, L) {
  var m = L.moon, x = m.x, y = m.y + Math.sin(globalT * 0.8) * L.H * 0.004, r = m.r, awake = tkp.hugged, i, wink = tkp.moonT > 0;
  artGlow(c, x, y, r * 3, '#fff6d0', 0.3 + 0.25 * tkp.skyK);
  artCircle(c, x, y, r, '#fff4c4', { lineColor: '#d8bf7a', hi: 0.35 });
  artCircle(c, x + r * 0.45, y - r * 0.4, r * 0.14, '#f3e3a6', { line: false, flat: true });
  artCircle(c, x - r * 0.5, y + r * 0.45, r * 0.1, '#f3e3a6', { line: false, flat: true });
  c.strokeStyle = '#8a6a3a';
  c.lineWidth = Math.max(1.2, r * 0.07);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i += 2) {
    c.beginPath();
    if (!awake || (wink && i > 0)) c.arc(x + i * r * 0.33, y - r * 0.05, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    else { c.fillStyle = '#5a4a3a'; c.arc(x + i * r * 0.33, y - r * 0.05, r * 0.1, 0, Math.PI * 2); c.fill(); }
    c.stroke();
  }
  c.beginPath();
  if (awake) c.arc(x, y + r * 0.2, r * 0.25, 0.15 * Math.PI, 0.85 * Math.PI);
  else c.arc(x, y + r * 0.35, r * 0.06, 0, Math.PI * 2);
  c.stroke();
  artBlush(c, x - r * 0.55, y + r * 0.2, r * 0.15);
  artBlush(c, x + r * 0.55, y + r * 0.2, r * 0.15);
  if (!awake) {
    // Unen zzz
    c.fillStyle = 'rgba(255,250,220,0.7)';
    c.font = 'bold ' + Math.round(r * 0.55) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.fillText('z', x + r * 1.2, y - r * 0.8 - ((globalT * 0.5) % 1) * r * 0.6);
  }
}
function tkpDrawShoot(c) {
  var f = tkp.shoot, k, x, y, g;
  if (!f) return;
  k = easeOutCubic(f.t / 1.1);
  x = f.x0 + f.dx * k; y = f.y0 + f.dy * k;
  g = c.createLinearGradient(x - f.dx * 0.3, y - f.dy * 0.3, x, y);
  g.addColorStop(0, 'rgba(255,250,220,0)');
  g.addColorStop(1, 'rgba(255,250,220,' + (1 - k * 0.6) + ')');
  c.strokeStyle = g;
  c.lineWidth = viewH * 0.006;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - f.dx * 0.3, y - f.dy * 0.3); c.lineTo(x, y); c.stroke();
  drawStar(c, x, y, viewH * 0.016, globalT * 4, 0.6 * (1 - k));
}
// Iso sateenkaari samassa paikassa kuin kehyksen juhlasateenkaari (drawRainbow)
function tkpDrawBigRainbow(c, k) {
  var i, cx = viewW / 2, cy = viewH * 0.95, R0 = viewH * 0.75, band = viewH * 0.025;
  if (k <= 0) return;
  artGlow(c, cx, cy - R0 * 0.9, R0 * 0.5, '#fff0ff', 0.15 * k);
  c.globalAlpha = 0.85;
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = band + 1;
    c.beginPath();
    c.arc(cx, cy, R0 + i * band, Math.PI, Math.PI + Math.PI * Math.min(1, k));
    c.stroke();
  }
  c.globalAlpha = 1;
}
// Kukkaköynnökset linnaan (kukkalahjasta)
function tkpDrawGarlands(c, L) {
  var H = L.H, cx = L.c, segs, i, j, s, k, n, x, y, u, lw = Math.max(1.5, H * 0.005);
  if (tkp.garK <= 0) return;
  segs = [[-0.085, 0.31, -0.205, 0.37, 0.045], [0.085, 0.31, 0.205, 0.37, 0.045], [-0.335, 0.4, -0.39, 0.445, 0.02], [0.335, 0.4, 0.39, 0.445, 0.02],
    [-0.085, 0.262, 0.085, 0.262, 0.03], [-0.335, 0.342, -0.205, 0.342, 0.02], [0.205, 0.342, 0.335, 0.342, 0.02]];
  for (i = 0; i < segs.length; i++) {
    s = segs[i];
    k = tkpClamp(tkp.garK * segs.length * 0.6 - i * 0.6 + 0.6);
    if (k <= 0) continue;
    n = 8;
    c.strokeStyle = '#4f9e48';
    c.lineWidth = lw;
    c.lineCap = 'round';
    c.beginPath();
    for (j = 0; j <= n * k; j++) {
      u = j / n;
      x = cx + (s[0] + (s[2] - s[0]) * u) * H;
      y = (s[1] + (s[3] - s[1]) * u + Math.sin(u * Math.PI) * s[4]) * H;
      if (j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    for (j = 0; j <= n * k; j++) {
      u = j / n;
      x = cx + (s[0] + (s[2] - s[0]) * u) * H;
      y = (s[1] + (s[3] - s[1]) * u + Math.sin(u * Math.PI) * s[4]) * H;
      if (j % 2) artBlob(c, x, y + H * 0.004, H * 0.007, H * 0.004, '#6fd06a', { line: false, flat: true, rot: j });
      else drawFlower(c, x, y, H * 0.0055 * (1 + Math.sin(globalT * 3 + j + i) * 0.08), TKP_FLOWER_COLS[(i + j) % TKP_FLOWER_COLS.length]);
    }
  }
}
function tkpDrawWindow(c, p, lit) {
  var G = tkpGeo(), w = G.wins[p.idx], r = w[2] * viewH, cols = ['#ffe9a8', '#ffc4e8', '#c8f0ff', '#d8ffc0'], col = cols[p.hue || 0];
  if (lit <= 0) return;
  c.globalAlpha = lit;
  artGlow(c, 0, 0, r * 3.2, col, 0.45);
  tkpWinShape(c, 0, 0, r, w[3], col, '#c8a050');
  c.strokeStyle = 'rgba(200,150,60,0.6)';
  c.lineWidth = Math.max(1, r * 0.12);
  c.beginPath(); c.moveTo(-r * 0.8, r * 0.1); c.lineTo(r * 0.8, r * 0.1); c.moveTo(0, -r); c.lineTo(0, r * 1.15); c.stroke();
  if (p.peek > 0) {
    // Pieni pilvi kurkistaa ikkunasta
    c.save();
    tkpWinPath(c, 0, 0, r, w[3]);
    c.clip();
    trekDrawPup(c, 0, r * (0.9 - Math.sin(Math.PI * Math.min(1, p.peek / 1.6)) * 0.75), r * 0.7, { mood: 'happy', t: globalT, tint: TKP_SIB_TINTS[p.idx % 5] });
    c.restore();
  }
  c.globalAlpha = 1;
}
// Sateenkaariviiri: kuusi raitaa nauhana, lerpallaan tai liehuen
function tkpDrawBanner(c, p) {
  var a = tkpBannerAng(), len = p.len, n = 7, j, b, bw = viewH * 0.0055, x0 = p.px0 - p.x, y0 = p.py0 - p.y, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, u, wv, amp, x, y;
  amp = (1 - a / (Math.PI * 0.47)) * 0.6 + 0.15 + (p.fl > 0 ? p.fl * 0.8 : 0);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (b = 0; b < maneColors.length; b++) {
    c.strokeStyle = maneColors[b];
    c.lineWidth = bw + 0.6;
    c.beginPath();
    for (j = 0; j <= n; j++) {
      u = j / n;
      wv = Math.sin(globalT * 6 - u * 5 + p.idx) * bw * 2.2 * amp * u;
      x = x0 + dx * len * u + nx * ((b - 2.5) * bw * (1 - u * 0.55) + wv);
      y = y0 + dy * len * u + ny * ((b - 2.5) * bw * (1 - u * 0.55) + wv);
      if (j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
}
function tkpDrawBalloon(c, p) {
  var r = viewH * 0.024 * (p.popT >= 0 ? 0 : easeOutBack(p.grow));
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, viewH * 0.0025);
  c.beginPath(); c.moveTo(0, r); c.quadraticCurveTo(viewH * 0.01, (p.ay - p.y) * 0.5, p.ax - p.x, p.ay - p.y); c.stroke();
  if (r < 1) return;
  artBlob(c, 0, 0, r * 0.88, r, p.color, { hi: 0.5 });
  c.fillStyle = artShade(p.color, -0.3);
  c.beginPath(); c.moveTo(0, r * 0.95); c.lineTo(-r * 0.15, r * 1.15); c.lineTo(r * 0.15, r * 1.15); c.closePath(); c.fill();
}
function tkpDrawFireworks(c) {
  var i, j, r, b, k, p, x, y, a, tt, H = viewH;
  for (i = 0; i < tkp.rockets.length; i++) {
    r = tkp.rockets[i];
    k = easeOutCubic(r.t / r.dur);
    for (j = 0; j < 5; j++) {
      tt = Math.max(0, k - j * 0.04);
      c.globalAlpha = 0.6 - j * 0.1;
      c.fillStyle = '#ffe9a8';
      c.beginPath(); c.arc(r.x0 + (r.tx - r.x0) * tt, r.y0 + (r.ty - r.y0) * tt, H * (0.006 - j * 0.0008), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  for (i = 0; i < tkp.bursts.length; i++) {
    b = tkp.bursts[i];
    k = easeOutCubic(Math.min(1, b.t / 0.9));
    a = Math.max(0, 1 - b.t / 1.8);
    if (b.t < 0.3) artGlow(c, b.x, b.y, b.R * 1.2, b.col, 0.5 * (1 - b.t / 0.3));
    for (j = 0; j < b.parts.length; j++) {
      p = b.parts[j];
      x = b.x + p.dx * b.R * k;
      y = b.y + p.dy * b.R * k + b.t * b.t * H * (b.willow ? 0.08 : 0.03);
      c.globalAlpha = a * (0.75 + 0.25 * Math.sin(b.t * 25 + j));
      c.fillStyle = p.c;
      c.beginPath(); c.arc(x, y, H * 0.008 * (1 - b.t / 2.4), 0, Math.PI * 2); c.fill();
      if (b.willow || b.t < 0.6) {
        c.strokeStyle = p.c;
        c.lineWidth = Math.max(1, H * 0.004);
        c.globalAlpha = a * 0.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(b.x + p.dx * b.R * k * 0.8, b.y + p.dy * b.R * k * 0.8); c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
}
// Pikkuruinen pilvi (vieraiden kyyti)
function tkpCloudPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x + s * 1.2, y); c.arc(x, y, s * 1.2, 0, Math.PI * 2);
  c.moveTo(x + s * 2.3, y + s * 0.3); c.arc(x + s * 1.4, y + s * 0.3, s * 0.9, 0, Math.PI * 2);
  c.moveTo(x - s * 0.5, y + s * 0.3); c.arc(x - s * 1.4, y + s * 0.3, s * 0.9, 0, Math.PI * 2);
  c.moveTo(x + s * 1.3, y - s * 0.5); c.arc(x + s * 0.5, y - s * 0.5, s * 0.8, 0, Math.PI * 2);
  c.moveTo(x - s * 0.2, y - s * 0.4); c.arc(x - s * 0.8, y - s * 0.4, s * 0.6, 0, Math.PI * 2);
}
function tkpDrawRides(c, L) {
  var k, rp, s = L.H * 0.044, a;
  for (k in tkp.rides) {
    rp = tkpRidePos(k);
    a = 1 - tkp.rides[k].fade;
    if (a <= 0) continue;
    c.globalAlpha = a;
    artShadow(c, rp.x, rp.y + s * 3, s * 2, s * 0.35, 0.12 * rp.k);
    tkpCloudPath(c, rp.x, rp.y + s * 1.05, s);
    tkpPuff(c, rp.y - s * 0.6, rp.y + s * 1.6, '#ffffff', '#ddd4f6', '#9c8bd0', Math.max(1.2, s * 0.08));
    c.globalAlpha = 1;
  }
}
function tkpDrawFlowers(c, L) {
  var i, f, sl = tkpSlotOf('flower'), t, k, x, y, s;
  if (sl < 0 || !tkp.slots[sl].placed) return;
  t = tkp.slots[sl].t;
  for (i = 0; i < tkp.flowers.length; i++) {
    f = tkp.flowers[i];
    k = (t - f.d) / 0.5;
    if (k <= 0) continue;
    k = easeOutBack(Math.min(1, k));
    x = f.fx * L.W; y = f.fy * L.H; s = f.s * L.H * k;
    artLimb(c, x, y, x, y + s * 1.6, s * 0.35, '#5fbf55', false);
    artBlob(c, x - s * 0.9, y + s * 1.3, s * 0.7, s * 0.35, '#6fd06a', { line: false, flat: true, rot: 0.5 });
    drawFlower(c, x, y, s * (1 + Math.sin(globalT * 2 + f.rot) * 0.06), f.col);
  }
}
function tkpDrawSmallRainbow(c, L) {
  var k, i, m = L.mom, cx = m.x - m.r * 0.45, cy = m.y + m.r * 0.55, R = m.r * 1.75, bw = m.r * 0.075;
  if (tkp.smallBowT < 0) return;
  k = easeInOutSine((tkp.smallBowT - 0.9) / 1.3);
  if (tkp.stage === 'finale') k *= 1 - tkpClamp((tkp.finT - 0.8) / 1.2);
  if (tkp.stage === 'done') k = 0;
  if (k <= 0) return;
  c.globalAlpha = 0.65;
  for (i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = bw + 0.8;
    c.beginPath();
    c.arc(cx, cy, R + (maneColors.length - 1 - i) * bw, Math.PI * 1.08, Math.PI * (1.08 + 0.84 * k));
    c.stroke();
  }
  c.globalAlpha = 1;
}
// Äitipilvi ja Pikkupilvi (myös iso Pikkupilvi saapumisessa)
function tkpDrawFamily(c, L) {
  var m = L.mom, H = L.H, mood, look, sq = 0, psq = 0, h = tkp.hugT, rain, pm, k, by = Math.sin(globalT * 1.3) * H * 0.006, crownY;
  // Äiti
  if (!tkp.hugged) { mood = 'sad'; look = tkp.px > -H * 0.5 ? Math.max(-1, Math.min(1, (tkp.px - m.x) / (H * 0.4))) : 0; }
  else if (tkp.stage === 'hug' && h < 1.1) { mood = 'wow'; look = -0.8; }
  else { mood = 'happy'; look = tkp.momPokeT > 0 ? 0 : Math.sin(globalT * 0.4) * 0.4; }
  if (tkp.stage === 'hug') sq = Math.sin(h * 9) * 0.07 * Math.max(0, 1 - h / 2.4);
  if (tkp.momPokeT > 0) sq += Math.sin(tkp.momPokeT * 25) * 0.06;
  rain = tkp.hugged ? 0 : 0.35;
  artShadow(c, m.x, m.y + m.r * 0.95, m.r * 1.2, m.r * 0.2, 0.22);
  trekDrawPup(c, m.x, m.y + by, m.r, { mood: mood, t: globalT, tint: TKP_MOM_TINT, look: look, squash: sq, rain: rain, seed: 1.7,
    squint: mood === 'happy' && (tkp.stage === 'hug' || tkp.stage === 'finale' || tkp.momPokeT > 0), wave: tkp.stage === 'finale' || tkp.stage === 'done' });
  // Kruunu
  crownY = m.y + by - m.r * 0.86 * (1 + sq);
  tkpCrown(c, m.x + m.r * 0.22, crownY, m.r * 0.26, 0.2);
  // Pikkupilvi
  if (tkp.px < -H * 0.4) return;
  if (tkp.stage === 'arrive') pm = tkp.t < TKP_ARRIVE[1] ? 'brave' : 'wow';
  else if (tkp.stage === 'reunion') pm = tkp.pdrag && tkp.pdrag.moved ? 'happy' : 'wow';
  else if (tkp.stage === 'hug') pm = 'happy';
  else pm = tkp.pupWowT > 0 || tkp.pupPokeT > 0 ? 'wow' : 'happy';
  if (tkp.stage === 'hug') psq = Math.sin(h * 9 + 1) * 0.1 * Math.max(0, 1 - h / 2.4);
  if (tkp.pupPokeT > 0) psq += Math.sin(tkp.pupPokeT * 30) * 0.08;
  c.save();
  if (tkp.pupLoopT > 0) {
    k = 1 - tkp.pupLoopT / 0.9;
    c.translate(tkp.px, tkp.py - Math.sin(k * Math.PI) * H * 0.06);
    c.rotate(-k * Math.PI * 2);
    c.translate(-tkp.px, -tkp.py);
  }
  if (tkp.stage !== 'arrive' || tkp.t > TKP_ARRIVE[1]) artShadow(c, tkp.px, Math.max(tkp.py + tkp.pr * 1.2, H * 0.68), tkp.pr * 0.9, tkp.pr * 0.18, 0.14);
  trekDrawPup(c, tkp.px, tkp.py, tkp.pr, { mood: pm, t: globalT, look: tkp.stage === 'reunion' || tkp.stage === 'hug' ? 0.8 : (tkp.stage === 'arrive' ? 1 : 0.3),
    squash: psq, squint: tkp.stage === 'hug' && h > 0.4, wave: tkp.stage === 'arrive' || (tkp.pdrag && tkp.pdrag.moved) || tkp.pupWowT > 0 || tkp.stage === 'finale' || tkp.stage === 'done',
    rain: tkp.stage === 'finale' || tkp.stage === 'done' ? 0.8 : 0, glow: tkp.stage === 'arrive' ? 0.6 * (1 - Math.max(0, Math.min(1, (tkp.t - TKP_ARRIVE[1] - 0.35) / TKP_SHRINK_T))) : 0 });
  c.restore();
}
function tkpCrown(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.moveTo(-s * 0.5, 0); c.lineTo(-s * 0.55, -s * 0.5); c.lineTo(-s * 0.25, -s * 0.25); c.lineTo(0, -s * 0.62);
  c.lineTo(s * 0.25, -s * 0.25); c.lineTo(s * 0.55, -s * 0.5); c.lineTo(s * 0.5, 0); c.closePath();
  artFillPath(c, '#ffd24f', -s * 0.62, 0, s * 0.5, { lineColor: '#c8901e' });
  artCircle(c, 0, -s * 0.18, s * 0.09, '#ff7bac', { line: false });
  artCircle(c, 0, -s * 0.62, s * 0.07, '#ffffff', { line: false });
  c.restore();
}
function tkpDrawPedestal(c, L, i) {
  var s = tkp.slots[i], p = L.ped[i], H = L.H, w = H * 0.052, top = p.y - H * 0.085, col = TKP_GCOL[s.gift], wob = s.wob > 0 ? Math.sin(s.wob * 35) * H * 0.006 : 0, g = tkpGiftTop(i), k, near, sz, a, t = s.t, j;
  var x = p.x + wob;
  artShadow(c, p.x, p.y + H * 0.004, w * 1.6, H * 0.014, 0.25);
  artRoundRect(c, x - w * 1.1, p.y - H * 0.024, w * 2.2, H * 0.028, H * 0.012, '#efe8ff', { lineColor: '#9c8bd0' });
  artRoundRect(c, x - w * 0.72, top + H * 0.014, w * 1.44, p.y - top - H * 0.034, H * 0.01, '#f7f3ff', { lineColor: '#9c8bd0', shadeTo: '#d4c8f0' });
  c.strokeStyle = 'rgba(156,139,208,0.35)';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath();
  for (j = -1; j <= 1; j++) { c.moveTo(x + j * w * 0.36, top + H * 0.03); c.lineTo(x + j * w * 0.36, p.y - H * 0.03); }
  c.stroke();
  if (s.gift === 'shell' && s.placed) { tkpDrawFountain(c, L, i, x, top); return; }
  artRoundRect(c, x - w * 1.15, top, w * 2.3, H * 0.024, H * 0.011, col, { hi: 0.3 });
  if (!s.placed) {
    // Siluetti: hehkuu, kun oikea lahja on lähellä tai vihje osoittaa sitä
    near = tkp.drag && tkp.drag.id === s.gift && Math.hypot(tkp.drag.x - g.x, tkp.drag.y - g.y) < H * TKP_SNAP * 1.3;
    k = 0.32 + 0.12 * Math.sin(globalT * 3 + i) + (near ? 0.4 : 0) + (s.pulse > 0 ? 0.3 * s.pulse : 0) + (tkp.stage === 'party' ? 0.08 : 0);
    if (near || s.pulse > 0) artGlow(c, g.x, g.y, H * 0.08, col, 0.5);
    c.strokeStyle = artRGBA(col, 0.6);
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.setLineDash([H * 0.01, H * 0.008]);
    c.beginPath(); c.arc(g.x, g.y, H * 0.05 * (near ? 1.1 : 1), 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    sz = tkpSilCv[s.gift] ? tkpSilCv[s.gift].width / DPR : 0;
    artGlow(c, g.x, g.y, H * 0.065, '#ffffff', 0.35);
    if (sz) {
      c.globalAlpha = Math.min(0.9, k + 0.15);
      c.drawImage(tkpSilCv[s.gift], g.x + wob - sz / 2, g.y - sz / 2, sz, sz);
      c.globalAlpha = 1;
    }
    return;
  }
  // Lahja jalustalla ja sen ihme
  a = easeOutBack(Math.min(1, t / 0.45));
  if (s.gift === 'flower') {
    k = tkpClamp(t / 1.2);
    c.strokeStyle = '#4f9e48';
    c.lineWidth = Math.max(1.5, H * 0.004);
    c.beginPath();
    for (j = 0; j <= 10 * k; j++) c.lineTo(x + Math.sin(j * 1.3) * w * 0.7, p.y - H * 0.03 - (p.y - top - H * 0.04) * j / 10);
    c.stroke();
    for (j = 0; j < 5; j++) if (k > j / 5) drawFlower(c, x + Math.sin(j * 2.6 + 0.6) * w * 0.75, p.y - H * 0.035 - (p.y - top - H * 0.04) * (j + 0.5) / 5, H * 0.006, TKP_FLOWER_COLS[j]);
    artGlow(c, g.x, g.y, H * 0.08, '#ff9fd0', 0.35 + (s.boost > 0 ? 0.3 : 0));
  } else if (s.gift === 'crystal') {
    // Pyörivät valonsäteet
    c.save();
    c.translate(g.x, g.y);
    c.rotate(globalT * 0.5);
    for (j = 0; j < 6; j++) {
      c.fillStyle = artRGBA(['#9ff0ff', '#e0b8ff', '#b8ffd8'][j % 3], 0.12 * Math.min(1, t) + (s.boost > 0 ? 0.1 : 0));
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(j * 1.047 - 0.12) * H * 0.2, Math.sin(j * 1.047 - 0.12) * H * 0.2); c.lineTo(Math.cos(j * 1.047 + 0.12) * H * 0.2, Math.sin(j * 1.047 + 0.12) * H * 0.2); c.closePath(); c.fill();
    }
    c.restore();
    artGlow(c, g.x, g.y, H * 0.09, '#9ff0ff', 0.45);
  } else {
    // Tähden valopylväs taivaalle
    k = t < 2.2 ? Math.sin(Math.PI * t / 2.2) : 0;
    if (k > 0) {
      var gr = c.createLinearGradient(0, 0, 0, g.y);
      gr.addColorStop(0, 'rgba(255,240,180,0)');
      gr.addColorStop(1, 'rgba(255,240,180,' + (0.45 * k) + ')');
      c.fillStyle = gr;
      c.fillRect(g.x - H * 0.03, 0, H * 0.06, g.y);
    }
    artGlow(c, g.x, g.y, H * 0.1, '#ffe678', 0.4 + (s.boost > 0 ? 0.3 : 0));
  }
  tkpGiftDraw(s.gift, c, g.x, g.y + Math.sin(globalT * 2 + i) * H * 0.004, H * 0.085 * a);
}
// Kuplasuihkulähde (simpukkalahja): allas, simpukka suuttimena, vesikaaret
function tkpDrawFountain(c, L, i, x, top) {
  var H = L.H, s = tkp.slots[i], k = easeOutBack(Math.min(1, s.t / 0.6)), rx = H * 0.1 * k, ry = H * 0.03 * k, j, u, jx, jy, h, sp = H * 0.04;
  if (k <= 0.01) return;
  // Altaan reuna
  c.beginPath();
  if (c.ellipse) c.ellipse(x, top + ry * 0.4, rx, ry * 1.5, 0, 0, Math.PI);
  c.lineTo(x - rx, top + ry * 0.4);
  artFillPath(c, '#efe8ff', top - ry, top + ry * 2, rx, { lineColor: '#9c8bd0' });
  artBlob(c, x, top, rx, ry, '#f7f3ff', { lineColor: '#9c8bd0' });
  artBlob(c, x, top + ry * 0.12, rx * 0.86, ry * 0.72, '#7fd0ff', { line: false });
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, H * 0.003);
  for (j = 0; j < 2; j++) {
    u = (globalT * 0.7 + j * 0.5) % 1;
    if (c.ellipse) { c.globalAlpha = 1 - u; c.beginPath(); c.ellipse(x, top + ry * 0.1, rx * 0.25 + rx * 0.55 * u, ry * 0.18 + ry * 0.45 * u, 0, 0, Math.PI * 2); c.stroke(); }
  }
  c.globalAlpha = 1;
  // Suihku: pisarakaaret simpukasta
  h = H * (0.07 + (s.boost > 0 ? 0.05 * s.boost : 0)) * Math.min(1, s.t / 0.8);
  c.fillStyle = 'rgba(200,240,255,0.85)';
  for (j = 0; j < 18; j++) {
    u = (globalT * 1.3 + j / 18) % 1;
    jx = x + (j % 2 ? 1 : -1) * u * rx * 0.75;
    jy = top - sp - h * 4 * u * (1 - u) + u * sp;
    c.beginPath(); c.arc(jx, jy, H * 0.004 * (1 - u * 0.4), 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = 'rgba(220,248,255,0.6)';
  c.fillRect(x - H * 0.003, top - sp - h, H * 0.006, h);
  // Simpukka suuttimena
  artLimb(c, x, top, x, top - sp * 0.6, H * 0.012, '#efe8ff', '#9c8bd0');
  tkpGiftDraw('shell', c, x, top - sp + Math.sin(globalT * 3) * H * 0.002, H * 0.06 * k);
}
function tkpDrawBubble(c, b) {
  var a = b.t < 0.2 ? b.t / 0.2 : Math.min(1, (b.life - b.t) / 0.3 + 0.3);
  c.globalAlpha = Math.min(1, a);
  c.fillStyle = 'rgba(200,240,255,0.25)';
  c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(1, b.r * 0.15);
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
}
function tkpDrawDrops(c) {
  var i, d, s = viewH * 0.006;
  for (i = 0; i < tkp.drops.length; i++) {
    d = tkp.drops[i];
    c.fillStyle = d.col;
    c.beginPath();
    c.moveTo(d.x, d.y - s * 1.8);
    c.quadraticCurveTo(d.x + s, d.y, d.x, d.y + s);
    c.quadraticCurveTo(d.x - s, d.y, d.x, d.y - s * 1.8);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(d.x - s * 0.3, d.y - s * 0.3, s * 0.4, s * 0.4);
  }
}
function tkpHeart(c, x, y, s, col) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.4);
  c.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  c.closePath();
  artFillPath(c, col, y - s, y + s, s, { lineColor: artShade(col, -0.35) });
}
function tkpDrawHearts(c) {
  var i, d, k;
  for (i = 0; i < tkp.hearts.length; i++) {
    d = tkp.hearts[i];
    if (d.t < 0) continue;
    k = d.t / d.life;
    c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    tkpHeart(c, d.x, d.y, d.s * easeOutBack(Math.min(1, d.t / 0.3)), d.col);
  }
  c.globalAlpha = 1;
}
// Yksisarvinen ja prinsessa: selässä saapuessa, hyppy pihalle, sitten paikallaan
function tkpDrawUnicorn(c, L) {
  var H = L.H, us = trekUS(), t = tkp.t, x, y, k, onPup = tkp.stage === 'arrive' && t < TKP_ARRIVE[1] + 0.05, f;
  if (onPup) {
    if (t < TKP_ARRIVE[0]) return;
    x = tkp.px - us * 6; y = tkp.py - tkp.pr * 0.72;
    drawUnicorn(c, x, y, us, 1, globalT * 9, false, globalT);
    return;
  }
  k = Math.min(1, (t - TKP_ARRIVE[1]) / 0.75);
  f = { x: L.land.x - us * 6, y: L.land.y - H * TKP_BIG_R * 0.72 };
  x = f.x + (L.uni.x - f.x) * easeInOutSine(k);
  y = f.y + (L.uni.y - f.y) * k - Math.sin(k * Math.PI) * H * 0.12;
  if (k < 1 && tkpCross(t - 1 / 60, t, TKP_ARRIVE[1] + 0.74)) spawnSparkles(L.uni.x, L.uni.y, 8, '#ffffff');
  drawUnicorn(c, x, y - (tkp.uniT > 0 ? Math.sin(Math.PI * tkp.uniT / 0.8) * H * 0.03 : 0), us, 1, globalT * 9, k < 1, globalT);
}
// Prinsessan kori: lahjat näkyvät reunan yli, laskeutuu laskeutumisen jälkeen
function tkpDrawBasket(c, L) {
  var H = L.H, b = L.basket, k = easeOutBack(tkpClamp((tkp.t - TKP_ARRIVE[1] - 0.6) / 0.5)), w = b.w * 0.5, h = H * 0.058, i, id, s, wig, sh = tkp.basketShake > 0 ? Math.sin(tkp.basketShake * 30) * 0.03 : 0, any = false;
  if (k <= 0) return;
  c.save();
  c.translate(b.x, b.y);
  c.rotate(sh);
  c.scale(k, k);
  artShadow(c, 0, h * 0.95, w * 1.1, H * 0.016, 0.22);
  // Kahva ja takareuna
  c.strokeStyle = '#b07a3a';
  c.lineWidth = H * 0.012;
  c.lineCap = 'round';
  c.beginPath(); c.arc(0, -h * 0.25, w * 0.82, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  artBlob(c, 0, -h * 0.3, w * 0.95, h * 0.28, '#7a4e22', { lineColor: '#5a3612', flat: true });
  c.restore();
  // Lahjat korissa
  for (i = 0; i < TKP_GIFTS.length; i++) {
    id = TKP_GIFTS[i];
    if (!tkp.inBasket[id]) continue;
    any = true;
    s = tkpBasketSlot(i);
    wig = tkp.wig[id] > 0 ? Math.sin(tkp.wig[id] * 25) * 0.25 : 0;
    c.save();
    c.translate(s.x, s.y + Math.sin(globalT * 2.5 + i) * H * 0.003);
    c.rotate(wig + sh);
    if (tkp.stage === 'party') artGlow(c, 0, 0, H * 0.06, TKP_GCOL[id], 0.3 + 0.1 * Math.sin(globalT * 3 + i));
    tkpGiftDraw(id, c, 0, 0, H * 0.085 * k);
    c.restore();
  }
  c.save();
  c.translate(b.x, b.y);
  c.rotate(sh);
  c.scale(k, k);
  // Etuosa: punottu kori
  c.beginPath();
  c.moveTo(-w, -h * 0.3);
  c.lineTo(w, -h * 0.3);
  c.quadraticCurveTo(w * 0.95, h * 0.8, w * 0.7, h * 0.85);
  c.lineTo(-w * 0.7, h * 0.85);
  c.quadraticCurveTo(-w * 0.95, h * 0.8, -w, -h * 0.3);
  c.closePath();
  artFillPath(c, '#e0a55a', -h * 0.3, h * 0.85, h, { lineColor: '#9a6420' });
  c.strokeStyle = 'rgba(154,100,32,0.55)';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath();
  for (i = 1; i < 4; i++) { c.moveTo(-w * (0.98 - i * 0.03), -h * 0.3 + i * h * 0.28); c.lineTo(w * (0.98 - i * 0.03), -h * 0.3 + i * h * 0.28); }
  for (i = -4; i <= 4; i++) { c.moveTo(i * w * 0.2, -h * 0.3); c.lineTo(i * w * 0.17, h * 0.85); }
  c.stroke();
  artRoundRect(c, -w * 1.04, -h * 0.42, w * 2.08, h * 0.24, h * 0.12, '#f0b868', { lineColor: '#9a6420' });
  // Rusetti
  artBlob(c, -w * 0.86, -h * 0.05, w * 0.07, h * 0.16, '#ff7bac', { rot: 0.6 });
  artBlob(c, -w * 0.68, -h * 0.05, w * 0.07, h * 0.16, '#ff7bac', { rot: -0.6 });
  artCircle(c, -w * 0.77, -h * 0.05, h * 0.09, '#ff5f9e', {});
  c.restore();
  if (!any && tkp.stage === 'finale') return;
}
// Vihjekäsi: Pikkupilvi äidin luo, lahja jalustalle tai taivaan napautus
function tkpDrawHints(c, L) {
  var H = L.H, from = null, to = null, i, id, sl, k, p, m, s = H * 0.07, a;
  if (tkp.drag || tkp.pdrag || holding) return;
  if (tkp.stage === 'reunion' && tkp.stT > TKP_HINT_FIRST && (tkp.idleT > 1 || tkp.stT < 8)) {
    from = { x: tkp.px, y: tkp.py };
    to = { x: L.mom.x - L.mom.r * 0.4, y: L.mom.y };
    a = tkp.stT - TKP_HINT_FIRST;
  } else if (tkp.stage === 'party' && tkp.flies.length === 0 && ((tkp.placedN === 0 && tkp.partyT > TKP_HINT_FIRST) || tkp.idleT > TKP_HINT_IDLE)) {
    for (i = 0; i < TKP_GIFTS.length; i++) {
      id = TKP_GIFTS[i];
      if (!tkp.inBasket[id]) continue;
      sl = tkpSlotOf(id);
      from = tkpBasketSlot(i);
      to = tkpGiftTop(sl);
      break;
    }
    a = tkp.placedN === 0 ? tkp.partyT - TKP_HINT_FIRST : tkp.idleT - TKP_HINT_IDLE;
  }
  if (from && to) {
    k = (a % 2.4) / 2.4;
    if (k < 0.2) p = { x: from.x, y: from.y, press: k / 0.2 };
    else if (k < 0.78) {
      m = easeInOutSine((k - 0.2) / 0.58);
      p = { x: from.x + (to.x - from.x) * m, y: from.y + (to.y - from.y) * m - Math.sin(m * Math.PI) * H * 0.08, press: 1 };
    } else p = { x: to.x, y: to.y, press: Math.max(0, 1 - (k - 0.78) / 0.12) };
    c.globalAlpha = 0.9 * Math.min(1, a * 3);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(2, H * 0.005);
    if (k < 0.2) { c.beginPath(); c.arc(from.x, from.y, H * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
    drawHand(c, p.x + s * 0.1, p.y - s * 0.2 + (1 - p.press) * s * -0.25, s);
    c.globalAlpha = 1;
    return;
  }
  // Taivaan napautus: kerran tähtilahjan jälkeen, kunnes lapsi kokeilee
  sl = tkpSlotOf('star');
  if ((tkp.stage === 'party' || tkp.stage === 'done') && tkp.skyTaps === 0 && tkp.slots[sl].placed && tkp.slots[sl].t > 2.6 && tkp.idleT > 1.2) {
    k = ((tkp.slots[sl].t - 2.6) % 1.4) / 1.4;
    p = { x: L.c + L.sx * 0.35, y: H * 0.2 };
    c.globalAlpha = 0.85;
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(2, H * 0.005);
    if (k < 0.4) { c.beginPath(); c.arc(p.x, p.y, H * (0.02 + k * 0.15), 0, Math.PI * 2); c.stroke(); }
    drawHand(c, p.x + s * 0.1, p.y - s * 0.2 - (k < 0.3 ? 0 : s * 0.2), s);
    c.globalAlpha = 1;
  }
}
// Kameran salama ja juhlakuva (polaroid) hetkeksi ennen juhlaa
function tkpDrawPhoto(c, L) {
  var t = tkp.flashT, H = L.H, W = L.W, k, m, bot, i;
  if (t < 0) return;
  k = easeOutBack(Math.min(1, t / 0.35));
  m = H * 0.035 * k;
  bot = H * 0.11 * k;
  c.save();
  c.fillStyle = '#fffdf8';
  c.beginPath();
  c.rect(0, 0, W, H);
  c.moveTo(m, m); c.lineTo(m, H - bot); c.lineTo(W - m, H - bot); c.lineTo(W - m, m); c.closePath();
  c.fill('evenodd');
  c.strokeStyle = 'rgba(120,100,150,0.35)';
  c.lineWidth = Math.max(1.5, H * 0.004);
  c.strokeRect(m, m, W - m * 2, H - m - bot);
  // Kuvan alareunassa sydämet ja tähdet
  for (i = 0; i < 5; i++) {
    if (i % 2) drawStar(c, W / 2 + (i - 2) * H * 0.07, H - bot * 0.5, H * 0.018, 0, 0);
    else tkpHeart(c, W / 2 + (i - 2) * H * 0.07, H - bot * 0.5, H * 0.017, '#ff7bac');
  }
  c.restore();
  if (t < 0.5) {
    c.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.5) + ')';
    c.fillRect(0, 0, W, H);
  }
}

// ---------- Vieraiden piirto (origo jalkojen kohdalla) ----------
function tkpDrawHedgehog(c, s, p) {
  var i, a, r, curl = p.act > 0, k;
  artShadow(c, 0, 0, s * 0.9, s * 0.2, 0.15);
  if (curl) {
    k = 1 - p.act / 1.1;
    c.save();
    c.translate(0, -s * 0.6 - Math.abs(Math.sin(k * Math.PI * 2)) * s * 0.8);
    c.rotate(k * Math.PI * 4);
    c.beginPath();
    for (i = 0; i < 24; i++) { a = i / 24 * Math.PI * 2; r = i % 2 ? s * 0.62 : s * 0.78; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath();
    artFillPath(c, '#8a5a3c', -s * 0.8, s * 0.8, s * 0.6, { lineColor: '#5a3a24' });
    artCircle(c, s * 0.2, s * 0.1, s * 0.12, '#3a2a2a', { line: false });
    c.restore();
    return;
  }
  // Piikkiselkä
  c.beginPath();
  c.moveTo(s * 0.55, -s * 0.15);
  for (i = 0; i <= 14; i++) { a = Math.PI * (1.05 + i / 14 * 0.95); r = i % 2 ? s * 0.62 : s * 0.85; c.lineTo(-s * 0.1 + Math.cos(a) * r, -s * 0.2 + Math.sin(a) * r * 0.9); }
  c.lineTo(-s * 0.7, -s * 0.05);
  c.closePath();
  artFillPath(c, '#8a5a3c', -s, 0, s * 0.6, { lineColor: '#5a3a24' });
  // Kasvot ja jalat
  artCircle(c, -s * 0.3, -s * 0.03, s * 0.12, '#f3d7b0', { lineColor: '#b08a60' });
  artCircle(c, s * 0.2, -s * 0.03, s * 0.12, '#f3d7b0', { lineColor: '#b08a60' });
  artBlob(c, s * 0.45, -s * 0.32, s * 0.35, s * 0.27, '#f3d7b0', { lineColor: '#b08a60', rot: 0.25 });
  artCircle(c, s * 0.8, -s * 0.25, s * 0.07, '#3a2a2a', { line: false });
  artEye(c, s * 0.48, -s * 0.42, s * 0.07, 0.5, ((globalT + 0.7) % 3.7) < 0.13);
  artBlush(c, s * 0.55, -s * 0.22, s * 0.07);
}
function tkpDrawSunflower(c, s, p) {
  var i, a, sing = p.act > 0 ? Math.sin(p.act * 14) * 0.2 : 0, hx = 0, hy = -s * 2.3, spin = p.act > 0 && p.n % 3 === 0 ? (1.2 - p.act) * 5 : 0;
  // Ruukku
  c.beginPath();
  c.moveTo(-s * 0.45, -s * 0.55); c.lineTo(s * 0.45, -s * 0.55); c.lineTo(s * 0.33, 0); c.lineTo(-s * 0.33, 0); c.closePath();
  artFillPath(c, '#e07a4a', -s * 0.55, 0, s * 0.4, { lineColor: '#9a4a2a' });
  artRoundRect(c, -s * 0.52, -s * 0.66, s * 1.04, s * 0.18, s * 0.06, '#f08a5a', { lineColor: '#9a4a2a' });
  // Varsi ja lehdet
  artLimb(c, 0, -s * 0.6, hx + sing * s, hy, s * 0.14, '#5fbf55');
  artBlob(c, -s * 0.3, -s * 1.2, s * 0.32, s * 0.13, '#6fd06a', { rot: 0.5 });
  artBlob(c, s * 0.3, -s * 1.55, s * 0.32, s * 0.13, '#6fd06a', { rot: -0.5 });
  // Kukkapää
  c.save();
  c.translate(hx + sing * s, hy);
  c.rotate(sing * 0.6 + Math.sin(globalT * 1.5) * 0.06);
  for (i = 0; i < 12; i++) {
    a = i / 12 * Math.PI * 2 + spin;
    artBlob(c, Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6, s * 0.3, s * 0.13, '#ffd23f', { rot: a, lineColor: '#d89a10' });
  }
  artCircle(c, 0, 0, s * 0.45, '#8a5a2c', { lineColor: '#5a3a1a' });
  artEye(c, -s * 0.16, -s * 0.08, s * 0.09, 0, ((globalT + 1.9) % 4.1) < 0.13);
  artEye(c, s * 0.16, -s * 0.08, s * 0.09, 0, ((globalT + 1.9) % 4.1) < 0.13);
  c.strokeStyle = '#ffe9a8';
  c.lineWidth = Math.max(1, s * 0.06);
  c.lineCap = 'round';
  c.beginPath();
  if (p.act > 0) c.arc(0, s * 0.14, s * 0.1, 0, Math.PI * 2);
  else c.arc(0, s * 0.08, s * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  c.stroke();
  artBlush(c, -s * 0.28, s * 0.1, s * 0.07);
  artBlush(c, s * 0.28, s * 0.1, s * 0.07);
  c.restore();
}
function tkpDrawMole(c, s, p) {
  var lift = p.act > 0 ? Math.sin(Math.PI * p.act) : 0, lx = s * 0.85, ly = -s * 0.75 - lift * s * 0.5, fl = 0.5 + 0.1 * Math.sin(globalT * 7);
  artShadow(c, 0, 0, s * 0.8, s * 0.18, 0.15);
  artBlob(c, 0, -s * 0.55, s * 0.62, s * 0.58, '#6a5a72', { lineColor: '#3e3248' });
  artBlob(c, 0, -s * 0.42, s * 0.36, s * 0.34, '#9a8aa2', { line: false });
  // Kädet ja lyhty
  artLimb(c, s * 0.4, -s * 0.55, lx, ly + s * 0.15, s * 0.16, '#6a5a72', '#3e3248');
  artLimb(c, -s * 0.4, -s * 0.5, -s * 0.6, -s * 0.25, s * 0.16, '#6a5a72', '#3e3248');
  artCircle(c, -s * 0.62, -s * 0.22, s * 0.11, '#ffb0c0', { lineColor: '#c06a80' });
  artGlow(c, lx, ly + s * 0.35, s * (1.6 + lift), '#ffe9a8', fl + lift * 0.4);
  c.strokeStyle = '#5a4a30';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.arc(lx, ly + s * 0.18, s * 0.14, Math.PI, 0); c.stroke();
  artRoundRect(c, lx - s * 0.17, ly + s * 0.18, s * 0.34, s * 0.4, s * 0.06, '#ffe9a8', { lineColor: '#a07a30' });
  artCircle(c, lx, ly + s * 0.38, s * 0.08, '#fff8d0', { line: false });
  // Pää: kärsä, silmät viivoina, kypärä ja otsalamppu
  artCircle(c, 0, -s * 1.15, s * 0.4, '#6a5a72', { lineColor: '#3e3248' });
  artBlob(c, 0, -s * 1.02, s * 0.15, s * 0.11, '#ff9fb8', { lineColor: '#c06a80' });
  c.strokeStyle = '#2a2030';
  c.lineWidth = Math.max(1, s * 0.05);
  c.lineCap = 'round';
  c.beginPath();
  c.arc(-s * 0.16, -s * 1.2, s * 0.06, 0.1 * Math.PI, 0.9 * Math.PI);
  c.moveTo(s * 0.22, -s * 1.2); c.arc(s * 0.16, -s * 1.2, s * 0.06, 0.1 * Math.PI, 0.9 * Math.PI);
  c.stroke();
  c.beginPath(); c.arc(0, -s * 1.3, s * 0.42, Math.PI * 1.05, Math.PI * 1.95); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.72, -s * 1.3, s * 0.4, { lineColor: '#c8901e' });
  artGlow(c, 0, -s * 1.58, s * 0.5, '#fff6c0', 0.55);
  artCircle(c, 0, -s * 1.58, s * 0.1, '#fffbe0', { lineColor: '#c8901e' });
}
function tkpDrawDuck(c, s, col, face, dive, t) {
  var line = col === '#ffffff' ? '#a8a0c0' : '#c8a020';
  c.save();
  c.scale(face, 1);
  if (dive > 0) {
    // Sukellus: pyrstö pystyssä
    c.rotate(-Math.sin(Math.PI * Math.min(1, dive / 0.8)) * 1.1);
  }
  artBlob(c, -s * 0.05, -s * 0.35, s * 0.62, s * 0.4, col, { lineColor: line, shadeTo: col === '#ffffff' ? '#e2dcf2' : undefined, hi: 0.4 });
  c.beginPath(); c.moveTo(-s * 0.55, -s * 0.5); c.lineTo(-s * 0.85, -s * 0.72); c.lineTo(-s * 0.6, -s * 0.3); c.closePath();
  artFillPath(c, col, -s * 0.72, -s * 0.3, s * 0.2, { lineColor: line });
  artBlob(c, -s * 0.1, -s * 0.38, s * 0.28, s * 0.16, col, { lineColor: line, rot: -0.2 });
  artCircle(c, s * 0.38, -s * 0.85, s * 0.3, col, { lineColor: line, shadeTo: col === '#ffffff' ? '#e2dcf2' : undefined, hi: 0.4 });
  artBlob(c, s * 0.72, -s * 0.8, s * 0.17, s * 0.08, '#ff9f3a', { lineColor: '#c86a10' });
  artEye(c, s * 0.45, -s * 0.92, s * 0.08, 0.6, ((t + 2) % 3.6) < 0.12);
  artBlush(c, s * 0.48, -s * 0.74, s * 0.07);
  c.restore();
}
function tkpDrawOtter(c, s, p) {
  var spin = p.act > 0 ? p.act : 0, k, i, jug = p.act > 0.9;
  artShadow(c, 0, 0, s * 0.8, s * 0.18, 0.15);
  c.save();
  if (spin > 0 && !jug) { c.translate(0, -s * 0.8); c.rotate((1 - spin / 0.8) * Math.PI * 2); c.translate(0, s * 0.8); }
  artBlob(c, 0, -s * 0.7, s * 0.48, s * 0.7, '#9a6a48', { lineColor: '#5e3e28' });
  artBlob(c, 0, -s * 0.6, s * 0.3, s * 0.5, '#f0d8b8', { line: false });
  artLimb(c, s * 0.35, -s * 0.15, s * 0.75, s * 0.0, s * 0.18, '#9a6a48', '#5e3e28');
  artCircle(c, 0, -s * 1.45, s * 0.42, '#9a6a48', { lineColor: '#5e3e28', hi: 0.3 });
  artCircle(c, -s * 0.33, -s * 1.78, s * 0.1, '#9a6a48', { lineColor: '#5e3e28' });
  artCircle(c, s * 0.33, -s * 1.78, s * 0.1, '#9a6a48', { lineColor: '#5e3e28' });
  artBlob(c, 0, -s * 1.32, s * 0.24, s * 0.16, '#f0d8b8', { line: false });
  artCircle(c, 0, -s * 1.42, s * 0.07, '#3a2a2a', { line: false });
  artEye(c, -s * 0.17, -s * 1.55, s * 0.07, 0, ((globalT + 0.4) % 3.9) < 0.12);
  artEye(c, s * 0.17, -s * 1.55, s * 0.07, 0, ((globalT + 0.4) % 3.9) < 0.12);
  c.strokeStyle = 'rgba(90,60,40,0.6)';
  c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath();
  for (i = -1; i <= 1; i += 2) { c.moveTo(i * s * 0.12, -s * 1.32); c.lineTo(i * s * 0.42, -s * 1.36); c.moveTo(i * s * 0.12, -s * 1.28); c.lineTo(i * s * 0.4, -s * 1.22); }
  c.stroke();
  // Tassut ja simpukka (3.: jongleeraa)
  k = jug ? Math.abs(Math.sin((2 - p.act) * 6)) : 0;
  artCircle(c, -s * 0.22, -s * 0.95, s * 0.1, '#7a5238', { line: false });
  artCircle(c, s * 0.22, -s * 0.95, s * 0.1, '#7a5238', { line: false });
  tkpGiftFallback('shell', c, 0, -s * 1.0 - k * s * 1.4, s * 0.45, true);
  c.restore();
}
function tkpDrawMoth(c, s, p) {
  var fl = Math.abs(Math.sin(globalT * 18 + p.idx)), g = 0.45 + 0.2 * Math.sin(globalT * 3 + p.idx) + (p.flee > 0 ? 0.3 : 0);
  if (p.tt < p.born) return;
  artGlow(c, 0, 0, s * 3, '#eaffb0', g);
  artBlob(c, -s * 0.7 * (0.4 + fl * 0.6), -s * 0.2, s * 0.75 * (0.4 + fl * 0.6), s * 0.55, '#f8f4d0', { lineColor: '#b8a878' });
  artBlob(c, s * 0.7 * (0.4 + fl * 0.6), -s * 0.2, s * 0.75 * (0.4 + fl * 0.6), s * 0.55, '#f8f4d0', { lineColor: '#b8a878' });
  artBlob(c, 0, 0, s * 0.18, s * 0.5, '#a8906a', { lineColor: '#6a5a3a' });
  c.strokeStyle = '#6a5a3a';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.moveTo(-s * 0.05, -s * 0.45); c.lineTo(-s * 0.3, -s * 0.85); c.moveTo(s * 0.05, -s * 0.45); c.lineTo(s * 0.3, -s * 0.85); c.stroke();
}

// ---------- Aseman kuva ----------
// Pilvilinna yötaivaalla, ilotulitteita ja Pikkupilvi edessä
function tkpIcon(c, x, y, s) {
  var i, j, a, b = Math.sin(globalT * 1.6) * s * 0.015, cols = ['#ff7bac', '#ffd24f', '#7fd0ff'], fx, fy, k;
  c.fillStyle = '#2a2870';
  c.beginPath(); c.arc(x, y, s * 0.5, 0, Math.PI * 2); c.fill();
  for (i = 0; i < 3; i++) {
    fx = x + (i - 1) * s * 0.26; fy = y - s * (0.24 + (i % 2) * 0.08);
    k = 0.75 + 0.25 * Math.sin(globalT * 2 + i * 2);
    for (j = 0; j < 8; j++) {
      a = j / 8 * Math.PI * 2;
      c.fillStyle = cols[i];
      c.beginPath(); c.arc(fx + Math.cos(a) * s * 0.09 * k, fy + Math.sin(a) * s * 0.09 * k, s * 0.018, 0, Math.PI * 2); c.fill();
    }
  }
  // Linna
  c.fillStyle = '#f4efff';
  c.fillRect(x - s * 0.2, y - s * 0.02, s * 0.4, s * 0.3);
  c.fillRect(x - s * 0.26, y - s * 0.1, s * 0.1, s * 0.4);
  c.fillRect(x + s * 0.16, y - s * 0.1, s * 0.1, s * 0.4);
  c.fillRect(x - s * 0.06, y - s * 0.16, s * 0.12, s * 0.4);
  c.fillStyle = '#ff9fd0';
  c.beginPath(); c.moveTo(x - s * 0.28, y - s * 0.1); c.lineTo(x - s * 0.21, y - s * 0.24); c.lineTo(x - s * 0.14, y - s * 0.1); c.fill();
  c.beginPath(); c.moveTo(x + s * 0.14, y - s * 0.1); c.lineTo(x + s * 0.21, y - s * 0.24); c.lineTo(x + s * 0.28, y - s * 0.1); c.fill();
  c.fillStyle = '#c9a2ff';
  c.beginPath(); c.moveTo(x - s * 0.08, y - s * 0.16); c.lineTo(x, y - s * 0.32); c.lineTo(x + s * 0.08, y - s * 0.16); c.fill();
  c.fillStyle = '#ffe9a8';
  c.beginPath(); c.arc(x, y - s * 0.06, s * 0.025, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - s * 0.21, y + s * 0.0, s * 0.02, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.21, y + s * 0.0, s * 0.02, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  cloudShape(c, x - s * 0.2, y + s * 0.3, s * 0.1);
  cloudShape(c, x + s * 0.2, y + s * 0.32, s * 0.1);
  trekDrawPup(c, x - s * 0.14, y + s * 0.18 + b, s * 0.12, { mood: 'happy', t: globalT, wave: true });
}
