'use strict';

// KUP-LA-JO-KI (Pikkupilven kotimatka, luku 2, keskipäivä): keskitaso, n. 3 min.
// Kukkaniityn jättiläislumpeenlehti on nyt lautta: yksisarvinen ja prinsessa
// seisovat lehdellä, Pikkupilvi istuu ison kukan terälehdillä. Joki virtaa
// oikealle ja kamera liukuu itsestään (tyynessä hitaasti, koskessa nopeammin).
//   Ohjaus: RAAHAUS. Sormi missä tahansa vetää lauttaa: vesiraja hakeutuu
//   sormen korkeudelle joen kaistalla ja vaakapaikka sormen kohdalle
//   (TKR_X_MIN..TKR_X_MAX × viewW). Lautasta tarttuessa ote säilyy, joten
//   lautta ei hyppää sormen alle. Pehmennys ja nopeusraja, ei piilofysiikkaa.
//   Vedessä:
//    - kivet valkoisine vaahtorenkaineen: törmäys = tömähdys, lautta keikkuu,
//      iso roiske, prinsessa hytisee märkänä, Pikkupilvi säikähtää ja jonon
//      VIIMEINEN ankanpoikanen pelästyy ja melastaa eteenpäin (saa taas kiinni).
//    - kelluvat tukit (tönäisy, ei haittaa), pyörteet (lautta pyörähtää
//      kokonaisen kierroksen ja virta hidastuu hetkeksi), lumpeenlehdet
//      (keinahtavat), hyppäävät kalat (väreet varoittavat; kalan kohtaaminen
//      antaa kuplahelmen).
//    - kuplahelmiä (HUD-laskuri) ja viisi eksynyttä ankanpoikasta (HUD:ssa
//      viisi paikkaa): lautan kosketus -> piip ja poikanen ui jonossa perässä.
//      Ruudun vasemmalta ohi jäänyt poikanen ui myöhemmin vastaan edestä.
//   Osuudet: tyyni alku (ohjaus, helpot poikaset) -> koski 1 (vaahto varoittaa
//   edessä, kivirivien aukot vaihtavat puolta) -> suvanto ja saukko -> lyhyt
//   koski 2 ja pieni putousporras (lautta pomppaa, Pikkupilvi juo pärskeitä
//   ja kasvaa) -> emon lampi. Kivirivit, aukot ja kaislikon pupu arvotaan.
//   Lopetus: puuttuvat poikaset uivat lammella luokse, emo laskee poikaset
//   (HUD-paikat syttyvät 1..5), poikaset uivat iloisen ympyrän ja emo antaa
//   helmisimpukan, joka lentää prinsessalle. Joki virtaa kimaltelevan
//   vesiverhon takaa luolaan: Pikkupilvi juo kimallepärskeitä ja alkaa hohtaa
//   (luku 3), lautta lipuu sisään ja ruutu pimenee.
//   Piilopupu: kaislikko kaukaisella kaistalla yhdessä kolmesta paikasta;
//   kaislikon läpi ohjaaminen paljastaa tynnyrillä istuvan pupun. Muut
//   kaislikot ovat houkutuksia (lintu pyrähtää lentoon).
//   Tökättävät: sammakko lumpeenlehdellä (kurnuttaa; 3. tökkäys: hyppää
//   lautalle kyytiin), sudenkorento (3.: istuu Pikkupilven päähän), haikara
//   rannalla (kalastaa; 5.: nappaa saappaan), saukko suvannossa (kuperkeikka
//   ja taputus; 3.: heittää kuplahelmen), emo (kvaak). Pikkupilvi kikattaa.
// Oma koordinaatisto: u = matka (yksi u = viewH × 4/3, joki on yli 19 u pitkä), v = korkeus × viewH.

var TKR_WATER = 0.47;        // joen yläreuna (kaukainen ranta) × viewH
var TKR_V_TOP = 0.585;       // lautan vesiraja ylimmillään × viewH
var TKR_V_BOT = 0.915;       // ... alimmillaan (lähin kaista)
var TKR_X_MIN = 0.2;         // lautan paikka ruudulla vähintään × viewW
var TKR_X_MAX = 0.55;        // ... enintään
var TKR_X0 = 0.33;           // lähtöpaikka × viewW
var TKR_FOLLOW = 10;         // lautan pehmennys (1/s): suuri = suora
var TKR_VMAX_Y = 0.8;        // pystynopeus enintään × viewH / s
var TKR_VMAX_X = 0.6;        // vaakanopeus enintään × viewW / s
// Joen osuudet: [alku (kameran u), laji, virran nopeus u / s]
var TKR_SECTIONS = [[0, 'calm', 0.10], [5.0, 'rapids', 0.185], [9.6, 'pool', 0.09], [12.6, 'rapids', 0.19], [15.2, 'calm', 0.10]];
var TKR_RAMP = 0.5;          // nopeuden vaihtumismatka osuuksien rajalla (u)
var TKR_MOM_U = 18.72;       // emo lammella
var TKR_MOM_V = 0.7;
var TKR_CAVE_U = 18.94;      // luolakallion vasen reuna (näkyy lammelta)
var TKR_CURTAIN_U = 19.34;   // kimalteleva vesiverho luolan suulla
var TKR_FALL_U = 14.8;       // pieni putousporras koski 2:n lopussa
var TKR_CAVE_SPEED = 0.13;   // lautta lipuu luolaan
var TKR_RAFT_SC = 0.8;       // lautan ja yksisarvisen skaala × trekUS()
var TKR_RW = 0.095;          // lautan törmäysalueen puolileveys × viewH
var TKR_RH = 0.022;          // ... syvyyssuunnassa × viewH
var TKR_GAP = 0.105;         // kivirivin aukko: lähimmät kivet aukon keskeltä × viewH
var TKR_GAPS = [0.63, 0.7, 0.77, 0.84, 0.88];   // aukkojen keskikohdat × viewH
var TKR_ROWS1 = [0.44, 0.34, 0.31, 0.4, 0.31, 0.33, 0.42, 0.31, 0.33, 0.4];   // koski 1: rivien välit (u)
var TKR_ROWS2 = [0.33, 0.31, 0.33, 0.31];                                     // koski 2
var TKR_BUMP_INV = 1.2;      // törmäyksen jälkeinen suoja (s)
var TKR_WET_T = 1.6;         // prinsessan hytinä (s)
var TKR_SPIN_T = 1.5;        // pyörteen kierros (s)
var TKR_SPIN_SLOW = 0.45;    // virta pyörähdyksen aikana × nopeus
var TKR_DUCK_SP = 0.052;     // poikasten väli jonossa × viewH
var TKR_FLEE_AHEAD = 0.6;    // pelästynyt poikanen ui näin paljon lautan edelle (u)
var TKR_FISH_D = 0.26;       // kala hyppää, kun lautta on näin lähellä (u)
var TKR_HINT_IDLE = 4.5;     // vihjekäsi tämän joutilaisuuden jälkeen (s)
var TKR_PUP_R = 0.04;        // Pikkupilven säde × viewH
var TKR_REED_U = [2.05, 10.75, 16.85];  // kaislikoiden paikat (yhdessä pupu)

var tkr = {
  built: false, t: 0, camU: 0, prevRU: 0, speed: 0, state: 'river', stT: 0, r: null,
  rocks: [], logs: [], whirls: [], pads: [], pearls: [], fish: [], ducks: [], reeds: [], rows: [],
  chain: [], hearts: [], flyers: [], drops: [], nums: [], pearlsGot: 0, hits: 0, idleT: 0,
  steered: false, noSteer: false, grabOff: 0, hudBump: 0, slotBump: [0, 0, 0, 0, 0], count: 0,
  countIdx: 0, countNext: 0, gift: null, giftHeld: false, darkT: 0, spray: false, done: false,
  fallDone: false, frogRide: false, quackT: 2, momHop: 0, momT: 0, key: '', waterGrad: null, tw: 0
};
// Keskipäivän valo (säteet hiipuvat luolan suulla)
var TKR_LIGHT = { rays: true, raysColor: '#fff6d0', raysAlpha: 0.75, tint: ['rgba(255,250,220,0.06)', 'rgba(110,200,255,0.05)'], vignette: 0.22 };
var tkrFarCv = document.createElement('canvas');
var tkrBankCv = [document.createElement('canvas'), document.createElement('canvas')];
var tkrNearCv = document.createElement('canvas');
var tkrList = [];

trekRegister({
  id: 'river', order: 2, name: 'KUP-LA-JO-KI', color: '#6cc8f0',
  ambient: null,
  light: TKR_LIGHT,
  bunny: true,
  gift: { draw: function (c, x, y, s) { tkrDrawShell(c, x, y, s); } },
  init: function () { tkrInit(); },
  update: function (dt) { tkrUpdate(dt); },
  draw: function () { tkrDraw(); },
  tap: function (px, py) { tkrTap(px, py); },
  resize: function () { tkrResize(); },
  layers: function () { return [{ speed: 0, render: tkrRenderSky }]; },
  icon: function (c, x, y, s) { tkrIcon(c, x, y, s); }
});

// ---------- Apu ----------
function tkrClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function tkrHash(n) {
  var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
// Matkayksikkö u = viewH × 4/3 pikseliä (4:3-ruudun leveys), joten vaikeus ja
// kesto ovat samat kaikilla kuvasuhteilla; leveällä ruudulla näkyy pidemmälle.
function tkrUW() { return viewH * 4 / 3; }
function tkrSW() { return viewW / tkrUW(); }
function tkrX(u) { return (u - tkr.camU) * tkrUW(); }
function tkrRU() { return tkr.camU + tkr.r.sx * tkrSW(); }
// Kamera pysähtyy niin, että emo on ruudun oikealla puolella
function tkrCamStop() { return TKR_MOM_U - 0.72 * tkrSW(); }
// Syvyysskaala: kaukainen vesi (ylempänä) pienempi, lähin isompi
function tkrK(v) { return 0.86 + 0.28 * tkrClamp((v - TKR_V_TOP) / (TKR_V_BOT - TKR_V_TOP), -0.4, 1.2); }
function tkrActive() { return tkr.state === 'river' || tkr.state === 'pool'; }
function tkrSecIdx(u) {
  var i;
  for (i = TKR_SECTIONS.length - 1; i > 0; i--) if (u >= TKR_SECTIONS[i][0]) return i;
  return 0;
}
// Virran nopeus: vaihtuu pehmeästi osuuksien rajalla
function tkrSecSpeed(u) {
  var i = tkrSecIdx(u), sp = TKR_SECTIONS[i][2], nx = TKR_SECTIONS[i + 1], k;
  if (nx && u > nx[0] - TKR_RAMP) {
    k = (u - (nx[0] - TKR_RAMP)) / TKR_RAMP;
    sp += (nx[2] - sp) * easeInOutSine(k);
  }
  return sp;
}
// Kuohun määrä 0..1 kohdassa u (alkaa jo ennen koskea: vaahto varoittaa)
function tkrRapidsW(u) {
  var i, s, a, b, w = 0;
  for (i = 0; i < TKR_SECTIONS.length; i++) {
    s = TKR_SECTIONS[i];
    if (s[1] !== 'rapids') continue;
    a = s[0];
    b = TKR_SECTIONS[i + 1] ? TKR_SECTIONS[i + 1][0] : 1e9;
    w = Math.max(w, Math.min(tkrClamp((u - (a - 0.75)) / 0.6, 0, 1), tkrClamp((b + 0.25 - u) / 0.5, 0, 1)));
  }
  return w;
}
// Pyörähdyksen aikana yksisarvinen kääntyy: cos(kulma), ei koskaan aivan nolla
function tkrFacing() {
  var r = tkr.r, f;
  if (r.spinT < 0) return 1;
  f = Math.cos(r.spinT / TKR_SPIN_T * Math.PI * 2);
  return f < 0 ? Math.min(-0.06, f) : Math.max(0.06, f);
}

// ---------- Alustus ----------
function tkrInit() {
  tkr.built = true;
  tkr.t = 0;
  tkr.camU = 0;
  tkr.speed = TKR_SECTIONS[0][2];
  tkr.state = 'river';
  tkr.stT = 0;
  tkr.pearlsGot = 0;
  tkr.hits = 0;
  tkr.idleT = 0;
  tkr.steered = false;
  tkr.noSteer = false;
  tkr.grabOff = 0;
  tkr.hudBump = 0;
  tkr.slotBump = [0, 0, 0, 0, 0];
  tkr.count = 0;
  tkr.countIdx = 0;
  tkr.countNext = 0;
  tkr.chain = [];
  tkr.hearts = [];
  tkr.flyers = [];
  tkr.drops = [];
  tkr.nums = [];
  tkr.gift = null;
  tkr.giftHeld = false;
  tkr.darkT = 0;
  tkr.spray = false;
  tkr.done = false;
  tkr.fallDone = false;
  tkr.rapidsWarn = false;
  tkr.frogRide = false;
  tkr.quackT = 2;
  tkr.momHop = 0;
  tkr.momT = 0;
  tkr.r = {
    sx: TKR_X0, v: 0.74, vy: 0, push: 0, tilt: 0, wobT: 0, spinT: -1, whirl: null, invT: 0, wetT: 0,
    hopT: -1, mood: 'happy', moodT: 0, pupS: 1, pupSTo: 1, glow: 0, glowTo: 0, wigT: 0, dflyT: 0
  };
  tkrBuild();
  tkrSetupProps();
  camX = 0;
}
function tkrResize() {
  var i;
  if (!tkr.built) return;
  for (i = 0; i < props.length; i++) if (props[i].u !== undefined) tkrPropXY(props[i]);
  tkr.drops = [];
  tkr.key = '';
  camX = tkr.camU * tkrUW();
}

// ---------- Joen rakennus ----------
// Kaikki paikat ovat u/v-yksiköissä, joten koon muutos ei vaadi uudelleenrakennusta.
function tkrBuild() {
  var i, rows, real;
  tkr.rocks = []; tkr.logs = []; tkr.whirls = []; tkr.pads = []; tkr.pearls = [];
  tkr.fish = []; tkr.ducks = []; tkr.reeds = []; tkr.rows = [];
  // Tyyni alku: helmijono ylös, ensimmäinen poikanen alempana, lumpeenlehtiä
  tkrPearls([[0.92, 0.66], [1.02, 0.66], [1.12, 0.66]]);
  tkrDuck(1.34, 0.8);
  for (i = 0; i < 7; i++) tkr.pads.push({ u: 1.55 + i * 0.12 + trekRnd(-0.03, 0.03), v: trekRnd(0.69, 0.9), s: trekRnd(0.026, 0.034), dip: 0, flower: i % 3 === 0, ph: Math.random() * 6 });
  tkrDuck(2.62, 0.72);
  tkrPearls([[2.98, 0.84], [3.1, 0.78]]);
  tkrLog(3.28, 0.8);
  tkrRock(3.52, 0.67, 0.036);
  tkrWhirl(3.9, trekRnd(0.77, 0.84));
  tkrPearls([[3.74, 0.68]]);
  tkrFish(4.35, trekRnd(0.68, 0.8));
  tkrRock(4.62, 0.63, 0.034);
  tkrRock(4.78, 0.88, 0.036);
  tkrPearls([[4.7, 0.76]]);
  // Koski 1: kivirivit, aukko vaihtaa puolta; poikanen keskellä aukossa
  rows = tkrRows(5.5, TKR_ROWS1);
  tkrDuck(rows[4].u, rows[4].g);
  tkrPearls([[rows[1].u, rows[1].g], [rows[6].u, rows[6].g], [rows[8].u, rows[8].g]]);
  // Suvanto: saukko, pyörre ja sen vieressä poikanen
  tkrLog(9.95, 0.72);
  for (i = 0; i < 5; i++) tkr.pads.push({ u: 10.0 + i * 0.13 + trekRnd(-0.03, 0.03), v: trekRnd(0.7, 0.9), s: trekRnd(0.026, 0.034), dip: 0, flower: i % 2 === 0, ph: Math.random() * 6 });
  tkrFish(10.3, trekRnd(0.76, 0.86));
  tkrWhirl(11.15, 0.79);
  tkrDuck(11.34, 0.68);
  tkrPearls([[11.28, 0.88]]);
  tkrFish(11.98, trekRnd(0.68, 0.76));
  tkrPearls([[12.25, 0.62], [12.37, 0.7]]);
  // Koski 2 ja putousporras
  rows = tkrRows(12.95, TKR_ROWS2);
  tkrPearls([[rows[2].u, rows[2].g], [14.98, 0.75]]);
  // Emon lammen alku: poikanen kiven lähellä, pyörre
  tkrRock(15.92, 0.73, 0.036);
  tkrDuck(16.06, 0.86);
  tkrRock(16.28, 0.67, 0.034);
  tkrFish(16.5, trekRnd(0.72, 0.82));
  tkrWhirl(17.2, trekRnd(0.7, 0.78));
  tkrLog(17.0, 0.86);
  tkrPearls([[17.55, 0.8], [17.68, 0.8]]);
  for (i = 0; i < 4; i++) tkr.pads.push({ u: 18.3 + i * 0.16, v: trekRnd(0.82, 0.92), s: trekRnd(0.026, 0.034), dip: 0, flower: i % 2 === 1, ph: Math.random() * 6 });
  // Kaislikot: yhdessä pupu, muut houkutuksia
  real = Math.floor(Math.random() * TKR_REED_U.length);
  for (i = 0; i < TKR_REED_U.length; i++) {
    tkr.reeds.push({ u: TKR_REED_U[i], v: 0.6, real: i === real, part: 0, shown: false, showT: 0, found: false, bird: false, ph: Math.random() * 6 });
  }
}
function tkrPearls(list) {
  var i;
  for (i = 0; i < list.length; i++) tkr.pearls.push({ u: list[i][0], v: list[i][1], got: false, ph: Math.random() * 6 });
}
function tkrDuck(u, v) {
  tkr.ducks.push({
    id: tkr.ducks.length, u: u, v: v, tu: u, tv: v, state: 'wait', ph: Math.random() * 6, peepT: Math.random() * 2,
    noteT: 0, joyT: 0, hopT: 0, fleeT: 0, delay: 0, ang: 0, slot: 0, dir: -1
  });
}
function tkrRock(u, v, r) {
  tkr.rocks.push({ u: u, v: v, r: r, ph: Math.random() * 6, moss: Math.random() < 0.5 });
}
function tkrLog(u, v) {
  tkr.logs.push({ u: u, v: v, v0: v, vv: (Math.random() < 0.5 ? -1 : 1) * 0.02, bumpT: 0, ph: Math.random() * 6, rot: 0 });
}
function tkrWhirl(u, v) {
  tkr.whirls.push({ u: u, v: v, cool: 0, ph: Math.random() * 6 });
}
function tkrFish(u, v) {
  tkr.fish.push({ u: u, v: v, state: 'wait', t: 0, cu: u, ph: Math.random() * 6 });
}
// Kivirivit: aukko (TKR_GAPS) vaihtaa paikkaa joka rivillä, kivet aukon ulkopuolella
function tkrRows(u0, spacings) {
  var out = [], u = u0, prev = 0.75, i, g, cand, j, y, rr;
  for (i = 0; i <= spacings.length; i++) {
    cand = [];
    for (j = 0; j < TKR_GAPS.length; j++) if (Math.abs(TKR_GAPS[j] - prev) >= 0.13) cand.push(TKR_GAPS[j]);
    g = cand[Math.floor(Math.random() * cand.length)];
    prev = g;
    out.push({ u: u, g: g });
    tkr.rows.push({ u: u, g: g });
    for (y = g - TKR_GAP; y > 0.55; y -= 0.085) {
      rr = trekRnd(0.032, 0.042);
      tkrRock(u + trekRnd(-0.015, 0.015), y - (y === g - TKR_GAP ? 0 : trekRnd(0, 0.01)), rr);
    }
    for (y = g + TKR_GAP; y < 0.96; y += 0.085) {
      rr = trekRnd(0.032, 0.042);
      tkrRock(u + trekRnd(-0.015, 0.015), y + (y === g + TKR_GAP ? 0 : trekRnd(0, 0.01)), rr);
    }
    if (i < spacings.length) u += spacings[i];
  }
  return out;
}
// Turvallinen korkeus kohdassa u (pelästynyt tai palaava poikanen): kauimpana kivistä
function tkrSafeV(u) {
  var best = 0.75, bs = -1, v, s, i, o, d;
  for (v = 0.62; v <= 0.9; v += 0.04) {
    s = 1;
    for (i = 0; i < tkr.rocks.length; i++) {
      o = tkr.rocks[i];
      if (Math.abs(o.u - u) > 0.14) continue;
      d = Math.abs(o.v - v) + Math.abs(o.u - u) * 0.3;
      if (d < s) s = d;
    }
    for (i = 0; i < tkr.whirls.length; i++) {
      o = tkr.whirls[i];
      if (Math.abs(o.u - u) < 0.12) s = Math.min(s, Math.abs(o.v - v) + 0.02);
    }
    s += Math.random() * 0.02;
    if (s > bs) { bs = s; best = v; }
  }
  return best;
}

// ---------- Tökättävät koristeet (kaukaisella rannalla ja rantavedessä) ----------
function tkrPropXY(p) {
  p.x = p.u * tkrUW();
  p.y = p.v * viewH;
  p.r = viewH * p.hr;
  p.hy = viewH * p.hh;
}
function tkrSetupProps() {
  propsReset();
  tkrAddFrog(1.8);
  tkrAddFrog(11.8);
  tkrAddDfly(2.95, 0.4);
  tkrAddDfly(15.7, 0.38);
  tkrAddHeron(4.0);
  tkrAddHeron(16.95);
  tkrAddOtter(10.55);
}
// Sammakko lumpeenlehdellä: kurnuttaa; kolmas tökkäys = hyppää lautalle kyytiin
function tkrAddFrog(u) {
  var p = propAdd({
    u: u, v: 0.508, hr: 0.065, hh: 0.03, sz: 0.024, color: '#8fe38f', note: 330, amp: 0.08, hopT: 0, gone: false, blink: Math.random() * 4,
    update: function (p, dt) { if (p.hopT > 0) p.hopT -= dt; p.blink += dt; },
    poke: function (p) {
      if (p.gone) return;
      p.hopT = 0.55;
      playNote(196, 0, 0.08, 'square', 0.1);
      playNote(147, 0.09, 0.14, 'square', 0.1);
      if (p.n === 3 && !tkr.frogRide && tkrActive()) {
        p.gone = true;
        tkr.flyers.push({ kind: 'frog', x0: p.x - camX, y0: p.y - viewH * p.sz, t: 0, dur: 0.75 });
        playNote(523, 0.15, 0.08, 'triangle', 0.18);
        playNote(784, 0.25, 0.12, 'triangle', 0.18);
      } else if (p.n % 3 === 0) {
        p.hopT = 0.9;
        tkrSplash(p.x, p.y, 8);
      }
    },
    draw: function (c, p) {
      var s = viewH * p.sz, hop = p.hopT > 0 ? Math.sin(Math.min(1, (0.55 - p.hopT) / 0.55) * Math.PI) * s * 1.6 : 0;
      tkrDrawPad(c, 0, 0, s * 2.1, 0, false);
      if (!p.gone) tkrDrawFrog(c, 0, -s * 0.15 - Math.abs(hop), s, (p.blink % 4) < 0.12);
    }
  });
  tkrPropXY(p);
}
// Sudenkorento: tökkäys = silmukka; kolmas = istahtaa Pikkupilven päähän
function tkrAddDfly(u, v) {
  var p = propAdd({
    u: u, v: v, hr: 0.06, hh: 0, sz: 0.02, color: '#7fd4ff', note: 880, amp: 0.05, loopT: 0, away: 0, ph: Math.random() * 6,
    update: function (p, dt) {
      if (p.loopT > 0) p.loopT -= dt;
      if (p.away > 0) p.away -= dt;
    },
    poke: function (p) {
      if (p.away > 0) return;
      p.loopT = 0.8;
      playNote(1175, 0, 0.05, 'sine', 0.12);
      playNote(1568, 0.05, 0.05, 'sine', 0.12);
      playNote(1976, 0.1, 0.08, 'sine', 0.12);
      if (p.n === 3 && tkr.r.dflyT <= 0 && tkrActive()) {
        p.away = 6;
        tkr.r.dflyT = 6;
        tkrPupMood('wow', 1);
        trekPupSound('giggle');
      }
    },
    draw: function (c, p) {
      var s = viewH * p.sz, t = globalT + p.ph, x = Math.sin(t * 1.3) * s * 1.5, y = Math.sin(t * 2.1) * s * 0.6, k;
      if (p.away > 0) return;
      if (p.loopT > 0) {
        k = (0.8 - p.loopT) / 0.8 * Math.PI * 2;
        x += Math.sin(k) * s * 2.5;
        y += (1 - Math.cos(k)) * -s * 1.6;
      }
      tkrDrawDfly(c, x, y, s, t, 1);
    }
  });
  tkrPropXY(p);
}
// Haikara rantavedessä: tökkäys = nokka veteen; viides = saapas!
function tkrAddHeron(u) {
  var p = propAdd({
    u: u, v: 0.482, hr: 0.085, hh: 0.1, sz: 0.05, color: '#c8d4ff', note: 262, amp: 0.06, dipT: 0, boot: 0,
    update: function (p, dt) {
      if (p.dipT > 0) p.dipT -= dt;
      if (p.boot > 0) {
        p.boot -= dt;
        if (p.boot <= 0) {
          tkrSplash(p.x + viewH * p.sz * 0.9, p.y, 10);
          playNote(392, 0, 0.1, 'sine', 0.15);
          playNote(196, 0.08, 0.16, 'sine', 0.12);
        }
      }
    },
    poke: function (p) {
      if (p.boot > 0) return;
      if (p.dipT > 0 && p.n % 5 !== 0) return;
      p.dipT = 0.9;
      playNote(220, 0, 0.12, 'sawtooth', 0.06);
      playNote(196, 0.12, 0.14, 'sawtooth', 0.06);
      tkrSplash(p.x + viewH * p.sz * 1.2, p.y + viewH * 0.005, 6);
      if (p.n % 5 === 0) {
        p.dipT = 0;
        p.boot = 2.6;
        playNote(659, 0.2, 0.1, 'triangle', 0.18);
        playNote(523, 0.32, 0.1, 'triangle', 0.18);
        playNote(392, 0.44, 0.2, 'triangle', 0.18);
        tkrPupMood('wow', 1.4);
        trekPupSound('giggle');
      }
    },
    draw: function (c, p) { tkrDrawHeron(c, 0, 0, viewH * p.sz, p); }
  });
  tkrPropXY(p);
}
// Saukko suvannossa: kuperkeikka ja taputus; joka kolmas = heittää kuplahelmen
function tkrAddOtter(u) {
  var p = propAdd({
    u: u, v: 0.515, hr: 0.075, hh: 0.04, sz: 0.04, color: '#e8c49a', note: 523, amp: 0.06, flipT: 0, clapT: 0, clapN: 0, gifts: 0, blink: 0,
    update: function (p, dt) {
      p.blink += dt;
      if (p.flipT > 0) {
        p.flipT -= dt;
        if (p.flipT <= 0) { p.clapT = 1.2; p.clapN = 0; tkrSplash(p.x, p.y, 6); }
      } else if (p.clapT > 0) {
        p.clapT -= dt;
        if (p.clapT < 1.2 - p.clapN * 0.2 && p.clapN < 6) {
          p.clapN++;
          playNote(1400 + (p.clapN % 2) * 200, 0, 0.03, 'square', 0.06);
        }
      }
    },
    poke: function (p) {
      if (p.n % 3 === 0 && p.gifts < 2) {
        p.gifts++;
        tkr.flyers.push({ kind: 'pearl', x0: p.x - camX, y0: p.y - viewH * 0.06, t: 0, dur: 1.0 });
      }
      if (p.flipT > 0) return;
      p.flipT = 0.8;
      p.clapT = 0;
      tkrSplash(p.x, p.y, 8);
      playNote(523, 0, 0.08, 'triangle', 0.18);
      playNote(784, 0.1, 0.08, 'triangle', 0.18);
      playNote(1047, 0.2, 0.12, 'triangle', 0.18);
    },
    draw: function (c, p) { tkrDrawOtter(c, 0, 0, viewH * p.sz, p); }
  });
  tkrPropXY(p);
}

// ---------- Syöte ----------
function tkrTap(px, py) {
  var pp, g, d, i, dk, x, y;
  if (!tkr.built || tkr.done) return;
  tkr.idleT = 0;
  tkr.noSteer = false;
  tkr.grabOff = 0;
  // Pikkupilvi kikattaa
  pp = tkrRaftGeo();
  if (Math.hypot(px - pp.px, py - pp.py) < pp.pr * 1.5) {
    tkr.r.wigT = 0.7;
    trekPupSound('giggle');
    spawnSparkles(pp.px + camX, pp.py, 8, '#bfe0ff');
    artPop(pp.px + camX, pp.py, pp.pr * 1.4, '#ffffff', 'ring');
    tkr.noSteer = true;
    return;
  }
  if (propsTap(px + camX, py)) { tkr.noSteer = true; return; }
  // Emo kvaakkaa
  x = tkrX(TKR_MOM_U); y = TKR_MOM_V * viewH;
  if (Math.hypot(px - x, py - (y - viewH * 0.05)) < viewH * 0.08) {
    tkrQuack();
    tkr.momHop = 0.5;
    spawnSparkles(TKR_MOM_U * tkrUW(), y - viewH * 0.06, 6, '#ffffff');
    tkr.noSteer = true;
    return;
  }
  // Kala ilmassa: napautus kelpaa kiinniotoksi
  for (i = 0; i < tkr.fish.length; i++) {
    d = tkr.fish[i];
    if (d.state === 'leap' && Math.hypot(px - tkrX(d.cu), py - tkrFishY(d)) < viewH * 0.06) tkrFishCatch(d);
  }
  // Ankanpoikanen piipittää (ohjaus jatkuu: lautta lähtee sormen perään)
  for (i = 0; i < tkr.ducks.length; i++) {
    dk = tkr.ducks[i];
    if (Math.hypot(px - tkrX(dk.u), py - (dk.v - 0.02) * viewH) < viewH * 0.05) {
      dk.hopT = 0.35;
      tkrPeep(1);
    }
  }
  // Ote lautasta: lautta ei hyppää sormen alle
  g = pp;
  if (Math.abs(px - g.x) < g.rx * 1.1 && py > g.y - 125 * g.rs && py < g.y + viewH * 0.04) tkr.grabOff = g.y - py;
}

// ---------- Päivitys ----------
function tkrUpdate(dt) {
  updateParticles(dt);
  propsUpdate(dt);
  updateConfetti(dt);
  if (!tkr.built) return;
  if (dt > 0.1) dt = 0.1;
  tkr.t += dt;
  tkr.stT += dt;
  tkr.idleT += dt;
  if (!holding) tkr.noSteer = false;
  if (tkr.hudBump > 0) tkr.hudBump -= dt;
  tkr.prevRU = tkrRU();
  tkrUpdateCamera(dt);
  tkrUpdateRaft(dt);
  if (tkrActive()) tkrCollide(dt);
  tkrUpdateThings(dt);
  tkrUpdateDucks(dt);
  tkrUpdateEnding(dt);
  tkrUpdateFx(dt);
  camX = tkr.camU * tkrUW();
}
function tkrUpdateCamera(dt) {
  var target, r = tkr.r;
  if (tkr.state === 'river') {
    target = tkrSecSpeed(tkr.camU + 0.4);
    target = Math.min(target, 0.03 + Math.max(0, tkrCamStop() - tkr.camU) * 0.35);
  } else if (tkr.state === 'cave') {
    target = TKR_CAVE_SPEED;
  } else {
    target = 0;
  }
  if (r.spinT >= 0) target *= TKR_SPIN_SLOW;
  tkr.speed += (target - tkr.speed) * Math.min(1, dt * 1.6);
  tkr.camU += tkr.speed * dt;
  if (tkr.state === 'river' && tkr.camU >= tkrCamStop()) {
    tkr.camU = tkrCamStop();
    tkr.speed = 0;
    tkrStartPool();
  }
}
function tkrUpdateRaft(dt) {
  var r = tkr.r, tx = r.sx, tv = r.v, k, d, lim, ov = r.v, ou = tkr.prevRU, w, auto;
  auto = tkr.state === 'count' || tkr.state === 'hug' || tkr.state === 'gift' || tkr.state === 'cave';
  if (r.invT > 0) r.invT -= dt;
  if (r.wetT > 0) {
    r.wetT -= dt;
    if (r.wetT <= 0) {
      // Prinsessa ravistelee vedet pois
      spawnSparkles(tkrRU() * tkrUW(), r.v * viewH - viewH * 0.15, 8, '#a8d8ff');
      playNote(880, 0, 0.06, 'sine', 0.12);
      playNote(988, 0.06, 0.06, 'sine', 0.12);
      playNote(1175, 0.12, 0.1, 'sine', 0.12);
    }
  }
  if (r.wobT > 0) r.wobT -= dt;
  if (r.moodT > 0) r.moodT -= dt;
  if (r.wigT > 0) r.wigT -= dt;
  if (r.dflyT > 0) r.dflyT -= dt;
  r.pupS += (r.pupSTo - r.pupS) * Math.min(1, dt * 2.5);
  r.glow += (r.glowTo - r.glow) * Math.min(1, dt * 1.2);
  if (r.spinT >= 0) {
    // Pyörre pitää lautan otteessaan kokonaisen kierroksen
    r.spinT += dt;
    w = r.whirl;
    k = 1 - Math.exp(-dt * 6);
    r.sx += (tkrClamp((w.u - tkr.camU) / tkrSW(), 0.05, 0.95) - r.sx) * k;
    r.v += (w.v - r.v) * k;
    if (Math.random() < dt * 14) spawnSparkles(w.u * tkrUW() + trekRnd(-1, 1) * viewH * 0.06, w.v * viewH, 1, '#ffffff');
    if (r.spinT >= TKR_SPIN_T) {
      r.spinT = -1;
      w.cool = 2.5;
      trekPupSound('giggle');
      tkrPupMood('happy', 0.5);
    }
  } else {
    if (auto) {
      tx = 0.4;
      tv = tkr.state === 'cave' ? 0.76 : 0.78;
    } else if (holding && !tkr.noSteer && !celebrating) {
      tx = tkrClamp(lastPX / viewW, TKR_X_MIN, TKR_X_MAX);
      tv = tkrClamp((lastPY + tkr.grabOff) / viewH, TKR_V_TOP, TKR_V_BOT);
      tkr.steered = true;
      tkr.idleT = 0;
    }
    k = 1 - Math.exp(-dt * (auto ? 2.5 : TKR_FOLLOW));
    lim = TKR_VMAX_X * dt;
    d = (tx - r.sx) * k;
    r.sx += tkrClamp(d, -lim, lim);
    lim = TKR_VMAX_Y * dt;
    d = (tv - r.v) * k;
    r.v += tkrClamp(d, -lim, lim);
  }
  // Tönäisy kivestä tai tukista
  r.v += r.push * dt;
  r.push *= Math.exp(-dt * 6);
  if (r.spinT < 0) {
    r.sx = tkrClamp(r.sx, TKR_X_MIN - 0.05, TKR_X_MAX);
    r.v = tkrClamp(r.v, TKR_V_TOP, TKR_V_BOT);
  }
  r.vy = dt > 0 ? (r.v - ov) / dt : 0;
  r.tilt += (tkrClamp(r.vy * 0.35, -0.12, 0.12) - r.tilt) * Math.min(1, dt * 8);
  // Putousporras: lautta pomppaa alas ja Pikkupilvi juo pärskeitä
  if (r.hopT >= 0) {
    var prevHop = r.hopT;
    r.hopT += dt;
    if (prevHop < 0.3 && r.hopT >= 0.3) {
      tkrSplash(tkrRU() * tkrUW(), r.v * viewH, 22);
      artPop(tkrRU() * tkrUW(), r.v * viewH, viewH * 0.09, '#ffffff', 'ring');
      artShakeStart(viewH * 0.005, 0.3);
      tkrSplashSound();
    }
    if (prevHop < 0.6 && r.hopT >= 0.6) {
      trekPupSound('slurp');
      r.pupSTo = 1.18;
      tkrPupMood('wow', 1.8);
      spawnSparkles(tkrRU() * tkrUW() - 50 * trekUS() * TKR_RAFT_SC, r.v * viewH - viewH * 0.08, 14, '#bfe8ff');
    }
    if (prevHop < 1.0 && r.hopT >= 1.0) trekPupSound('wow');
    if (r.hopT >= 1.2) r.hopT = -1;
  }
  // Koski lähestyy: vaahto näkyy edessä, Pikkupilvi rohkaistuu ja sanoo "hmm"
  w = tkrRapidsW(tkrRU() + 0.7) > 0.3;
  if (w && !tkr.rapidsWarn && tkr.state === 'river') {
    trekPupSound('hmm');
    tkrPupMood('brave', 1.6);
    playNote(262, 0.3, 0.12, 'triangle', 0.14);
    playNote(330, 0.42, 0.12, 'triangle', 0.14);
    playNote(392, 0.54, 0.2, 'triangle', 0.14);
  }
  tkr.rapidsWarn = w;
  if (!tkr.fallDone && ou < TKR_FALL_U && tkrRU() >= TKR_FALL_U) {
    tkr.fallDone = true;
    r.hopT = 0;
    tkrPupMood('scared', 0.3);
  }
}
function tkrPupMood(m, t) {
  tkr.r.mood = m;
  tkr.r.moodT = t;
}
// Törmäykset ja kosketukset lautan kanssa (px-yksiköissä)
function tkrCollide(dt) {
  var r = tkr.r, ru = tkrRU(), rxp = r.sx * viewW, RW = TKR_RW * viewH, RH = TKR_RH * viewH, i, o, dx, dy, rr, s;
  for (i = 0; i < tkr.rocks.length; i++) {
    o = tkr.rocks[i];
    if (Math.abs(o.u - ru) > 0.4) continue;
    dx = Math.abs(tkrX(o.u) - rxp);
    dy = Math.abs(o.v - r.v) * viewH;
    rr = o.r * viewH;
    if (dx < RW + rr && dy < RH + rr * 0.6) {
      if (r.invT <= 0 && r.spinT < 0) tkrBump(o);
      else r.v += (r.v >= o.v ? 1 : -1) * 0.25 * dt;
    }
  }
  for (i = 0; i < tkr.logs.length; i++) {
    o = tkr.logs[i];
    if (Math.abs(o.u - ru) > 0.4) continue;
    dx = Math.abs(tkrX(o.u) - rxp);
    dy = Math.abs(o.v - r.v) * viewH;
    if (dx < RW + viewH * 0.07 && dy < RH + viewH * 0.02 && o.bumpT <= 0) {
      s = o.v >= r.v ? 1 : -1;
      o.bumpT = 0.9;
      o.vv = s * 0.16;
      r.push = -s * 0.15;
      r.wobT = 0.5;
      playNote(147, 0, 0.1, 'triangle', 0.2);
      playNote(196, 0.06, 0.1, 'triangle', 0.14);
      tkrSplash(o.u * tkrUW(), o.v * viewH, 6);
      trekPupSound('hmm');
    }
  }
  for (i = 0; i < tkr.whirls.length; i++) {
    o = tkr.whirls[i];
    if (o.cool > 0 || r.spinT >= 0 || Math.abs(o.u - ru) > 0.4) continue;
    dx = Math.abs(tkrX(o.u) - rxp);
    dy = Math.abs(o.v - r.v) * viewH;
    if (dx < RW * 0.55 && dy < viewH * 0.045) {
      r.spinT = 0;
      r.whirl = o;
      tkrPupMood('wow', TKR_SPIN_T);
      trekPupSound('wow');
      for (s = 0; s < 6; s++) playNote(392 * Math.pow(1.122, s * 1.5), s * 0.09, 0.12, 'sine', 0.13);
      artPop(o.u * tkrUW(), o.v * viewH, viewH * 0.08, '#ffffff', 'ring');
    }
  }
  for (i = 0; i < tkr.pads.length; i++) {
    o = tkr.pads[i];
    if (Math.abs(o.u - ru) > 0.3 || o.dip > 0.3) continue;
    if (Math.abs(tkrX(o.u) - rxp) < RW + o.s * viewH && Math.abs(o.v - r.v) * viewH < viewH * 0.04) {
      o.dip = 1;
      playNote(880 + Math.random() * 200, 0, 0.05, 'sine', 0.06);
    }
  }
  for (i = 0; i < tkr.pearls.length; i++) {
    o = tkr.pearls[i];
    if (o.got || Math.abs(o.u - ru) > 0.3) continue;
    if (Math.abs(tkrX(o.u) - rxp) < RW + viewH * 0.02 && Math.abs(o.v - r.v) * viewH < viewH * 0.055) {
      o.got = true;
      tkrPearlFly(tkrX(o.u), (o.v - 0.03) * viewH);
    }
  }
  for (i = 0; i < tkr.fish.length; i++) {
    o = tkr.fish[i];
    if (o.state !== 'leap') continue;
    if (Math.abs(tkrX(o.cu) - rxp) < RW && Math.abs(o.v - r.v) * viewH < viewH * 0.06) tkrFishCatch(o);
  }
  for (i = 0; i < tkr.reeds.length; i++) {
    o = tkr.reeds[i];
    o.hit = Math.abs(tkrX(o.u) - rxp) < RW + viewW * 0.04 && r.v < o.v + 0.035;
  }
}
// Kivitörmäys: tömähdys ja roiske, ei sydämiä. Viimeinen poikanen pelästyy.
function tkrBump(o) {
  var r = tkr.r, wx = (tkrRU() + (o.u - tkrRU()) * 0.5) * tkrUW(), wy = (r.v + o.v) * 0.5 * viewH;
  r.invT = TKR_BUMP_INV;
  r.wetT = TKR_WET_T;
  r.wobT = 0.9;
  tkr.hits++;
  r.push = (r.v >= o.v ? 1 : -1) * 0.45;
  r.sx = Math.max(TKR_X_MIN, r.sx - 0.03);
  tkrSplash(wx, wy, 18);
  artPop(wx, wy - viewH * 0.02, viewH * 0.06, '#ffffff', 'ring');
  artShakeStart(viewH * 0.006, 0.3);
  playNote(110, 0, 0.12, 'triangle', 0.3);
  playNote(98, 0.05, 0.14, 'square', 0.08);
  tkrSplashSound();
  tkrPupMood('scared', 1.3);
  trekPupSound('scared');
  tkrScareLast();
}
function tkrScareLast() {
  var d;
  if (!tkr.chain.length) return;
  d = tkr.chain.pop();
  d.state = 'flee';
  d.fleeT = 0;
  d.tu = Math.min(tkrRU() + TKR_FLEE_AHEAD, TKR_MOM_U - 0.1);
  d.tv = tkrSafeV(d.tu);
  d.dir = 1;
  tkr.slotBump[tkr.chain.length] = -0.5;
  playNote(1760, 0, 0.05, 'square', 0.06);
  playNote(1568, 0.06, 0.05, 'square', 0.06);
  playNote(1760, 0.12, 0.05, 'square', 0.06);
}
function tkrFishY(f) {
  var k = tkrClamp(f.t / 1.1, 0, 1);
  return f.v * viewH - Math.sin(k * Math.PI) * viewH * 0.14;
}
function tkrFishCatch(f) {
  var x = tkrX(f.cu), y = tkrFishY(f);
  f.state = 'caught';
  f.t = 0;
  tkrPearlFly(x, y);
  spawnSparkles(f.cu * tkrUW(), y, 10, '#ffb8d8');
  artPop(f.cu * tkrUW(), y, viewH * 0.05, '#ffffff', 'burst');
  tkrPupMood('wow', 1.2);
  trekPupSound('wow');
}
function tkrPearlFly(sx, sy) {
  tkr.flyers.push({ kind: 'pearl', x0: sx, y0: sy, t: 0, dur: 0.7 });
  artPop(sx + camX, sy, viewH * 0.04, '#ffd0ec', 'ring');
  playNote(1319 + (tkr.pearlsGot % 5) * 110, 0, 0.1, 'sine', 0.16);
  playNote(1760 + (tkr.pearlsGot % 5) * 110, 0.06, 0.12, 'sine', 0.12);
}

// Liikkuvat oliot: tukit, lehdet, pyörteet, kalat, kaislikot
function tkrUpdateThings(dt) {
  var i, o, k, r = tkr.r, sx;
  for (i = 0; i < tkr.logs.length; i++) {
    o = tkr.logs[i];
    if (o.bumpT > 0) o.bumpT -= dt;
    o.v += o.vv * dt;
    if (o.v < 0.62) { o.v = 0.62; o.vv = Math.abs(o.vv); }
    if (o.v > 0.9) { o.v = 0.9; o.vv = -Math.abs(o.vv); }
    o.vv += ((o.vv >= 0 ? 0.02 : -0.02) - o.vv) * Math.min(1, dt * 1.2);
    o.rot += (o.bumpT > 0 ? o.vv * 0.6 : -o.rot * 0.8) * dt;
  }
  for (i = 0; i < tkr.pads.length; i++) {
    o = tkr.pads[i];
    if (o.dip > 0) o.dip = Math.max(0, o.dip - dt * 1.2);
  }
  for (i = 0; i < tkr.whirls.length; i++) {
    o = tkr.whirls[i];
    if (o.cool > 0 && r.spinT < 0) o.cool -= dt;
  }
  for (i = 0; i < tkr.fish.length; i++) {
    o = tkr.fish[i];
    sx = tkrX(o.u);
    if (o.state === 'wait') {
      if (tkr.state === 'river' && sx < r.sx * viewW + tkrUW() * TKR_FISH_D && sx > r.sx * viewW) { o.state = 'warn'; o.t = 0; }
    } else if (o.state === 'warn') {
      o.t += dt;
      if (o.t > 0.9) {
        o.state = 'leap';
        o.t = 0;
        tkrSplash(o.u * tkrUW(), o.v * viewH, 6);
        playNote(659, 0, 0.08, 'sine', 0.14);
        playNote(988, 0.08, 0.1, 'sine', 0.14);
      }
    } else if (o.state === 'leap') {
      o.t += dt;
      k = tkrClamp(o.t / 1.1, 0, 1);
      o.cu = o.u - 0.14 * k;
      if (k >= 1) {
        o.state = 'gone';
        tkrSplash(o.cu * tkrUW(), o.v * viewH, 8);
        playNote(523, 0, 0.06, 'sine', 0.1);
      }
    } else if (o.state === 'caught') {
      o.t += dt;
    }
  }
  for (i = 0; i < tkr.reeds.length; i++) {
    o = tkr.reeds[i];
    if (o.hit && tkrActive()) {
      o.part = Math.min(1, o.part + dt * 4);
      if (o.part > 0.8 && !o.shown) {
        o.shown = true;
        o.showT = 0;
        playNote(784, 0, 0.06, 'triangle', 0.12);
        playNote(659, 0.06, 0.06, 'triangle', 0.12);
        if (!o.real && !o.bird) {
          // Houkutus: lintu pyrähtää kaislikosta
          o.bird = true;
          tkr.flyers.push({ kind: 'bird', x0: tkrX(o.u), y0: o.v * viewH - viewH * 0.06, t: 0, dur: 1.6 });
          playNote(1976, 0.1, 0.05, 'sine', 0.12);
          playNote(2349, 0.16, 0.05, 'sine', 0.12);
          playNote(1976, 0.22, 0.07, 'sine', 0.12);
        } else if (o.real) {
          tkrPupMood('wow', 1.5);
          trekPupSound('wow');
        }
      }
    } else {
      o.part = Math.max(0, o.part - dt * 1.2);
    }
    if (o.shown) {
      o.showT += dt;
      if (o.real && !o.found && o.showT > 0.7) {
        o.found = true;
        trekBunnyFound(tkrX(o.u), o.v * viewH - viewH * 0.09);
      }
      if (o.part <= 0) o.shown = false;
    }
  }
}

// ---------- Ankanpoikaset ----------
function tkrWithUs() {
  var i, n = tkr.chain.length;
  for (i = 0; i < tkr.ducks.length; i++) if (tkr.ducks[i].state === 'toMom' || tkr.ducks[i].state === 'mom') n++;
  return n;
}
function tkrJoin(d) {
  d.state = 'chain';
  d.joyT = 1.2;
  d.dir = 1;
  tkr.chain.push(d);
  tkr.slotBump[tkr.chain.length - 1] = 0.45;
  tkrPeep(2);
  trekPupSound('yay');
  tkrPupMood('happy', 0.8);
  tkr.r.wigT = 0.4;
  spawnSparkles(d.u * tkrUW(), d.v * viewH - viewH * 0.03, 10, '#ffe27a');
  artPop(d.u * tkrUW(), d.v * viewH - viewH * 0.03, viewH * 0.05, '#ffe27a', 'burst');
}
// Poikanen jäi ruudun vasemmalle: se ui myöhemmin vastaan edestä
function tkrDuckReturn(d) {
  d.u = tkr.camU + tkrSW() * 1.08;
  d.tu = tkr.camU + tkrSW() * (0.74 + Math.random() * 0.1 + (d.id % 3) * 0.06);
  d.tv = tkrSafeV(d.tu);
  d.v = d.tv;
  d.state = 'swimIn';
  d.dir = -1;
}
function tkrUpdateDucks(dt) {
  var r = tkr.r, ru = tkrRU(), i, d, du, dv, dist, sp, k, lead, dxp, dyp, rs, RW = TKR_RW * viewH, a, mx, my;
  for (i = 0; i < tkr.ducks.length; i++) {
    d = tkr.ducks[i];
    d.ph += dt;
    if (d.joyT > 0) d.joyT -= dt;
    if (d.hopT > 0) d.hopT -= dt;
    if (d.noteT > 0) d.noteT -= dt;
    if (d.state === 'wait') {
      d.peepT -= dt;
      if (d.peepT <= 0) {
        d.peepT = 2.2 + Math.random() * 1.5;
        if (tkrX(d.u) > 0 && tkrX(d.u) < viewW) { d.noteT = 0.9; d.hopT = 0.3; tkrPeep(0); }
      }
      d.dir = d.u > ru ? -1 : 1;
      if (tkrX(d.u) < -viewW * 0.08 && tkr.state === 'river') tkrDuckReturn(d);
    } else if (d.state === 'swimIn' || d.state === 'flee') {
      d.fleeT += dt;
      sp = (d.state === 'flee' ? 0.5 : 0.28) * dt;
      du = d.tu - d.u;
      dv = d.tv - d.v;
      dist = Math.hypot(du, dv * 0.75);
      if (dist <= sp) { d.u = d.tu; d.v = d.tv; d.state = 'wait'; d.peepT = 0.4; }
      else { d.u += du / dist * sp; d.v += dv / dist * sp * 0.75; }
      d.dir = du >= 0 ? 1 : -1;
      if (tkrX(d.u) < -viewW * 0.08 && tkr.state === 'river') tkrDuckReturn(d);
    } else if (d.state === 'home') {
      // Lammella puuttuvat poikaset uivat itse lautan luo
      if (d.delay > 0) { d.delay -= dt; continue; }
      sp = 0.3 * dt;
      du = ru - d.u;
      dv = r.v - d.v;
      dist = Math.hypot(du, dv * 0.75);
      if (dist > 0.001) { d.u += du / dist * Math.min(sp, dist); d.v += dv / dist * Math.min(sp, dist) * 0.75; }
      d.dir = du >= 0 ? 1 : -1;
    } else if (d.state === 'toMom') {
      mx = TKR_MOM_U + Math.cos(d.ang) * 0.085;
      my = TKR_MOM_V + Math.sin(d.ang) * 0.07 + 0.01;
      sp = 0.32 * dt;
      du = mx - d.u;
      dv = my - d.v;
      dist = Math.hypot(du, dv);
      d.dir = du >= 0 ? 1 : -1;
      if (dist <= sp) {
        d.u = mx; d.v = my;
        d.state = 'mom';
        tkr.count++;
        tkr.slotBump[tkr.count - 1] = 0.5;
        tkr.nums.push({ u: d.u, v: d.v - 0.1, n: tkr.count, t: 0 });
        if (tkr.count >= tkr.ducks.length) tkr.countNext = 0;
        playNote(523 * Math.pow(1.122, tkr.count * 2), 0, 0.18, 'triangle', 0.24);
        tkrPeep(1);
        spawnSparkles(d.u * tkrUW(), d.v * viewH - viewH * 0.03, 8, '#ffe27a');
      } else {
        d.u += du / dist * sp;
        d.v += dv / dist * sp;
      }
    } else if (d.state === 'mom') {
      d.ang += dt * (tkr.state === 'hug' ? 1.7 : 0.35);
      d.u = TKR_MOM_U + Math.cos(d.ang) * 0.085;
      d.v = TKR_MOM_V + Math.sin(d.ang) * 0.07 + 0.01;
      d.dir = -Math.sin(d.ang) >= 0 ? 1 : -1;
    }
    // Kosketus lautan kanssa
    if ((d.state === 'wait' || d.state === 'swimIn' || d.state === 'home' || (d.state === 'flee' && d.fleeT > 0.7)) && tkrActive()) {
      if (Math.abs(tkrX(d.u) - r.sx * viewW) < RW + viewH * 0.03 && Math.abs(d.v - r.v) * viewH < viewH * 0.05) tkrJoin(d);
    }
  }
  // Jono: jokainen poikanen seuraa edellistä (köysi), ensimmäinen lautan perää
  rs = trekUS() * TKR_RAFT_SC * tkrK(r.v);
  lead = { u: ru - 78 * rs / tkrUW(), v: r.v + 0.006 };
  for (i = 0; i < tkr.chain.length; i++) {
    d = tkr.chain[i];
    dxp = (lead.u - d.u) * tkrUW();
    dyp = (lead.v - d.v) * viewH;
    dist = Math.hypot(dxp, dyp);
    sp = TKR_DUCK_SP * viewH * (i === 0 ? 0.9 : 1);
    if (dist > sp) {
      k = (dist - sp) / dist * Math.min(1, dt * 9);
      d.u += dxp * k / tkrUW();
      d.v += dyp * k / viewH;
    }
    a = (lead.u - d.u);
    d.dir = a >= 0 ? 1 : -1;
    lead = d;
  }
}

// ---------- Lopetus: emon lampi, simpukka ja luola ----------
function tkrStartPool() {
  var i, d, n = 0;
  tkr.state = 'pool';
  tkr.stT = 0;
  for (i = 0; i < tkr.ducks.length; i++) {
    d = tkr.ducks[i];
    if (d.state === 'chain') continue;
    d.state = 'home';
    d.delay = n * 0.8 + 0.3;
    n++;
    if (tkrX(d.u) < -viewW * 0.02 || tkrX(d.u) > viewW * 1.02) {
      d.u = tkr.camU + tkrSW() * 1.06;
      d.v = 0.62 + Math.random() * 0.26;
    }
  }
  tkrQuack();
}
function tkrUpdateEnding(dt) {
  var i, d, prev, gx, gy, rg;
  // Auringon säteet hiipuvat, kun luolakallio peittää taivaan
  TKR_LIGHT.raysAlpha = 0.75 * (1 - 0.9 * tkrClamp((viewW - tkrX(TKR_CAVE_U)) / (viewW * 0.7), 0, 1));
  if (tkr.momHop > 0) tkr.momHop -= dt;
  tkr.momT += dt;
  // Emo kutsuu poikasiaan, kun se näkyy ruudulla
  tkr.quackT -= dt;
  if (tkr.quackT <= 0 && (tkr.state === 'river' || tkr.state === 'pool')) {
    tkr.quackT = 3.2;
    if (tkrX(TKR_MOM_U) < viewW * 1.02) { tkrQuack(); tkr.momHop = 0.4; }
  }
  if (tkr.state === 'pool') {
    if (tkr.chain.length >= tkr.ducks.length && tkr.stT > 0.5) {
      tkr.state = 'count';
      tkr.stT = 0;
      tkr.countIdx = 0;
      tkr.countNext = 0.5;
      tkrPupMood('happy', 1);
    }
  } else if (tkr.state === 'count') {
    tkr.countNext -= dt;
    if (tkr.countNext <= 0 && tkr.chain.length) {
      d = tkr.chain.shift();
      d.state = 'toMom';
      d.ang = Math.PI * 0.75 + tkr.countIdx * Math.PI * 2 / 5;
      tkr.countIdx++;
      tkr.countNext = 0.45;
    }
    if (tkr.count >= tkr.ducks.length) {
      if (tkr.countNext < -0.6) {
        tkr.state = 'hug';
        tkr.stT = 0;
        tkrQuack();
        tkr.momHop = 0.6;
        trekPupSound('yay');
        tkrPupMood('happy', 3);
        for (i = 0; i < 10; i++) tkr.hearts.push({ x: TKR_MOM_U * tkrUW() + trekRnd(-1, 1) * viewH * 0.1, y: TKR_MOM_V * viewH - viewH * trekRnd(0.04, 0.12), vy: -viewH * trekRnd(0.06, 0.12), t: -i * 0.12, life: 1.8, s: trekRnd(0.6, 1.1) });
        artPop(TKR_MOM_U * tkrUW(), TKR_MOM_V * viewH - viewH * 0.06, viewH * 0.14, '#ff7bac', 'burst');
      }
    }
  } else if (tkr.state === 'hug') {
    prev = tkr.stT - dt;
    if (prev < 1.3 && tkr.stT >= 1.3) { tkrQuack(); tkr.momHop = 0.5; }
    if (Math.random() < dt * 4) tkr.hearts.push({ x: TKR_MOM_U * tkrUW() + trekRnd(-1, 1) * viewH * 0.12, y: TKR_MOM_V * viewH - viewH * 0.05, vy: -viewH * 0.08, t: 0, life: 1.6, s: trekRnd(0.5, 0.9) });
    if (tkr.stT > 2.6) {
      tkr.state = 'gift';
      tkr.stT = 0;
      tkr.gift = { t: 0 };
      tkr.momHop = 0.5;
      tkrSplash(TKR_MOM_U * tkrUW(), TKR_MOM_V * viewH, 10);
      playNote(784, 0, 0.12, 'triangle', 0.22);
      playNote(988, 0.1, 0.12, 'triangle', 0.22);
      playNote(1319, 0.2, 0.25, 'triangle', 0.22);
    }
  } else if (tkr.state === 'gift') {
    prev = tkr.stT - dt;
    tkr.gift.t = tkr.stT;
    if (prev < 2.0 && tkr.stT >= 2.0) {
      // Simpukka prinsessan syliin
      tkr.giftHeld = true;
      rg = tkrRaftGeo();
      gx = rg.ux + 4 * rg.rs;
      gy = rg.uy - 70 * rg.rs;
      spawnSparkles(gx + camX, gy, 18, '#ffd0ec');
      artPop(gx + camX, gy, viewH * 0.07, '#ffe27a', 'burst');
      soundBunny();
      trekPupSound('wow');
      tkrPupMood('wow', 1.4);
    }
    if (tkr.stT > 3.1) {
      tkr.state = 'cave';
      tkr.stT = 0;
      tkr.gift = null;
      tkrQuack();
    }
  } else if (tkr.state === 'cave') {
    if (!tkr.spray && tkrRU() > TKR_CURTAIN_U - 0.04) {
      // Kimallepärskeet: Pikkupilvi juo ja alkaa hohtaa (luolaluku)
      tkr.spray = true;
      tkr.r.glowTo = 0.55;
      trekPupSound('slurp');
      tkrPupMood('wow', 4);
      rg = tkrRaftGeo();
      spawnSparkles(rg.px + camX, rg.py, 20, '#fff3b8');
      artPop(rg.px + camX, rg.py, viewH * 0.08, '#fff3b8', 'burst');
    }
    if (tkr.spray && tkr.stT > 0 && tkrRU() > TKR_CURTAIN_U + 0.05) {
      if (tkr.darkT === 0) trekPupSound('wow');
      tkr.darkT += dt;
      if (tkr.darkT > 1.7 && !tkr.done) {
        tkr.done = true;
        tkr.state = 'done';
        trekChapterDone();
      }
    }
  }
}
// Hiukkaset: roiskeet, sydämet, numerot ja lentävät helmet
function tkrUpdateFx(dt) {
  var i, o, rg, tx, ty;
  for (i = tkr.drops.length - 1; i >= 0; i--) {
    o = tkr.drops[i];
    o.t += dt;
    o.vy += viewH * 1.6 * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t > o.life) tkr.drops.splice(i, 1);
  }
  for (i = tkr.hearts.length - 1; i >= 0; i--) {
    o = tkr.hearts[i];
    o.t += dt;
    if (o.t > 0) o.y += o.vy * dt;
    if (o.t > o.life) tkr.hearts.splice(i, 1);
  }
  for (i = tkr.nums.length - 1; i >= 0; i--) {
    tkr.nums[i].t += dt;
    if (tkr.nums[i].t > 1.4) tkr.nums.splice(i, 1);
  }
  for (i = 0; i < 5; i++) {
    if (tkr.slotBump[i] > 0) tkr.slotBump[i] = Math.max(0, tkr.slotBump[i] - dt);
    else if (tkr.slotBump[i] < 0) tkr.slotBump[i] = Math.min(0, tkr.slotBump[i] + dt);
  }
  for (i = tkr.flyers.length - 1; i >= 0; i--) {
    o = tkr.flyers[i];
    o.t += dt;
    if (o.t < o.dur) continue;
    tkr.flyers.splice(i, 1);
    if (o.kind === 'pearl') {
      tkr.pearlsGot++;
      tkr.hudBump = 0.4;
      playNote(1568, 0, 0.08, 'triangle', 0.15);
    } else if (o.kind === 'frog') {
      tkr.frogRide = true;
      rg = tkrRaftGeo();
      tx = rg.x + rg.rx * 0.6;
      ty = rg.y - rg.ry * 0.3;
      spawnSparkles(tx + camX, ty, 8, '#8fe38f');
      playNote(196, 0, 0.08, 'square', 0.1);
      playNote(262, 0.1, 0.1, 'square', 0.1);
      trekPupSound('giggle');
      tkr.r.wobT = 0.35;
    }
  }
}
function tkrSplash(wx, wy, n) {
  var i;
  for (i = 0; i < n; i++) {
    if (tkr.drops.length > 90) break;
    tkr.drops.push({
      x: wx + trekRnd(-1, 1) * viewH * 0.03, y: wy, vx: trekRnd(-1, 1) * viewH * 0.25, vy: -viewH * trekRnd(0.25, 0.6),
      t: 0, life: trekRnd(0.4, 0.7), r: viewH * trekRnd(0.004, 0.009), w: Math.random() < 0.5
    });
  }
}

// ---------- Äänet ----------
function tkrPeep(kind) {
  if (kind === 2) {
    playNote(1568, 0, 0.05, 'sine', 0.16);
    playNote(1760, 0.06, 0.05, 'sine', 0.16);
    playNote(2093, 0.12, 0.08, 'sine', 0.16);
  } else if (kind === 1) {
    playNote(1760, 0, 0.05, 'sine', 0.14);
    playNote(1976, 0.07, 0.06, 'sine', 0.14);
  } else {
    playNote(1760, 0, 0.04, 'sine', 0.06);
    playNote(1568, 0.06, 0.05, 'sine', 0.06);
  }
}
function tkrQuack() {
  playNote(330, 0, 0.09, 'square', 0.07);
  playNote(294, 0.08, 0.12, 'square', 0.07);
  playNote(330, 0.26, 0.09, 'square', 0.06);
  playNote(277, 0.34, 0.14, 'square', 0.06);
}
function tkrSplashSound() {
  playNote(880, 0, 0.05, 'sine', 0.12);
  playNote(660, 0.04, 0.06, 'sine', 0.12);
  playNote(440, 0.09, 0.08, 'sine', 0.1);
  playNote(1320, 0.12, 0.05, 'triangle', 0.06);
}

// ---------- Taustakaistat (esirenderöidyt, toistuvat) ----------
// Maailma on pidempi kuin worldW, joten kaukaiset kukkulat, rannat ja
// etualan heinät piirretään kerran saumattomiksi kaistoiksi (2 × viewW) ja
// toistetaan. Jaksolliset aallot: sin(2π k x / leveys).
function tkrRenderSky(b, w, h) {
  var g = b.createLinearGradient(0, 0, 0, h * 0.5), i;
  g.addColorStop(0, '#6ec6f5');
  g.addColorStop(0.6, '#b8e4fb');
  g.addColorStop(1, '#e8f8ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.52, h * 0.12, h * 0.055, 0, '#fff6c8', '#fffef0', '#ffd860');
  if (bgSun) bgSun.speed = 0;
  for (i = 0; i < 4; i++) drawCloud(b, w * (0.1 + i * 0.27), h * (0.2 + (i % 2) * 0.06), h * (0.022 + (i % 3) * 0.006), 0.85);
}
function tkrPrepare() {
  var key = viewW + 'x' + viewH, g;
  if (tkr.key === key) return;
  tkr.key = key;
  tkr.tw = Math.round(viewW * 2);
  tkrRenderFar();
  tkrRenderBank(0);
  tkrRenderBank(1);
  tkrRenderNear();
  g = ctx.createLinearGradient(0, viewH * TKR_WATER, 0, viewH);
  g.addColorStop(0, '#a8e4f6');
  g.addColorStop(0.12, '#7fd2f0');
  g.addColorStop(0.5, '#56bce8');
  g.addColorStop(1, '#3aa0dc');
  tkr.waterGrad = g;
}
function tkrWave(x, w, k) { return Math.sin(x / w * Math.PI * 2 * k); }
function tkrRenderFar() {
  var w = tkr.tw, h = viewH, ch = Math.round(h * 0.5), b, i, x, y;
  tkrFarCv.width = w;
  tkrFarCv.height = ch;
  b = tkrFarCv.getContext('2d');
  b.clearRect(0, 0, w, ch);
  // Kaukaiset sinivihreät vaarat
  fillHillBand(b, w, ch, h * 0.33, '#b6dcd8', function (px) { return h * (0.33 - 0.035 * tkrWave(px, w, 3) - 0.012 * tkrWave(px + w * 0.2, w, 8)); });
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 6; i++) {
    x = w * (i + 0.3) / 6;
    y = h * (0.33 - 0.035 * tkrWave(x, w, 3) - 0.012 * tkrWave(x + w * 0.2, w, 8));
    b.beginPath(); b.ellipse(x, y + h * 0.01, h * 0.04, h * 0.008, 0, 0, Math.PI * 2); b.fill();
  }
  // Lähemmät vihreät kunnaat ja puurivi
  fillHillBand(b, w, ch, h * 0.39, '#9ed49a', function (px) { return h * (0.39 - 0.025 * tkrWave(px, w, 5) - 0.01 * tkrWave(px, w, 11)); });
  for (i = 0; i < 26; i++) {
    x = w * (i + tkrHash(i) * 0.6) / 26;
    y = h * (0.39 - 0.025 * tkrWave(x, w, 5) - 0.01 * tkrWave(x, w, 11)) + h * 0.012;
    drawTree(b, x, y, h * (0.03 + tkrHash(i + 9) * 0.015), 0.45, { haze: '#d8f0ff' });
    if (x < h * 0.06) drawTree(b, x + w, y, h * (0.03 + tkrHash(i + 9) * 0.015), 0.45, { haze: '#d8f0ff' });
    if (x > w - h * 0.06) drawTree(b, x - w, y, h * (0.03 + tkrHash(i + 9) * 0.015), 0.45, { haze: '#d8f0ff' });
  }
}
// Kaukainen ranta: 0 = niitty (pajut, puut, kukat), 1 = kivikko (kosken ranta)
function tkrBankTop(x, w, h) { return h * (0.425 + 0.01 * tkrWave(x, w, 5) + 0.006 * tkrWave(x, w, 13)); }
function tkrShore(x, w, h) { return h * (TKR_WATER + 0.006 + 0.004 * tkrWave(x, w, 9)); }
function tkrRenderBank(kind) {
  var w = tkr.tw, h = viewH, ch = Math.round(h * 0.56), cv = tkrBankCv[kind], b, i, x, y, s, k, g, n;
  cv.width = w;
  cv.height = ch;
  b = cv.getContext('2d');
  b.clearRect(0, 0, w, ch);
  // Puut rannan takana
  n = kind ? 16 : 14;
  for (i = 0; i < n; i++) {
    x = w * (i + tkrHash(i * 3 + kind) * 0.7) / n;
    y = tkrBankTop(x, w, h) + h * 0.008;
    s = h * (0.07 + tkrHash(i * 7 + kind) * 0.04);
    for (k = -1; k <= 1; k++) {
      if (x + k * w < -s || x + k * w > w + s) continue;
      if (kind) drawPine(b, x + k * w, y, s * 1.5, i % 2 ? '#4f9a6a' : '#5aa874', false);
      else if (i % 3 === 1) tkrWillow(b, x + k * w, y, s * 1.1);
      else drawTree(b, x + k * w, y, s);
    }
  }
  // Rantapenger
  b.beginPath();
  b.moveTo(0, tkrBankTop(0, w, h));
  for (x = 0; x <= w; x += 8) b.lineTo(x, tkrBankTop(x, w, h));
  for (x = w; x >= 0; x -= 8) b.lineTo(x, tkrShore(x, w, h));
  b.closePath();
  artFillPath(b, '#86d470', h * 0.42, h * 0.48, h * 0.03, { lineColor: '#4f9a48', line: Math.max(1.2, h * 0.003) });
  // Rantavesi: vihreä heijastus
  g = b.createLinearGradient(0, h * TKR_WATER, 0, h * (TKR_WATER + 0.05));
  g.addColorStop(0, 'rgba(70,150,90,0.32)');
  g.addColorStop(1, 'rgba(70,150,90,0)');
  b.fillStyle = g;
  b.beginPath();
  for (x = 0; x <= w; x += 8) b.lineTo(x, tkrShore(x, w, h) - 1);
  b.lineTo(w, h * (TKR_WATER + 0.05)); b.lineTo(0, h * (TKR_WATER + 0.05)); b.closePath();
  b.fill();
  b.strokeStyle = 'rgba(255,255,255,0.55)';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath();
  for (x = 0; x <= w; x += 8) { y = tkrShore(x, w, h) + h * 0.006; if (x) b.lineTo(x, y); else b.moveTo(x, y); }
  b.stroke();
  // Penkan koristeet: kukat ja kivet, rantaviivalla kaislatupsut
  n = 40;
  for (i = 0; i < n; i++) {
    x = w * (i + 0.1 + tkrHash(i + 50 + kind) * 0.8) / n;
    y = tkrBankTop(x, w, h) + (tkrShore(x, w, h) - tkrBankTop(x, w, h)) * (0.3 + tkrHash(i + 70) * 0.5);
    if (kind) {
      if (i % 3 === 0) artBlob(b, x, y, h * 0.022, h * 0.014, '#b7b0cf', { lineColor: '#6e6890', hi: 0.3 });
      else if (i % 5 === 1) drawFlower(b, x, y, h * 0.005, '#ffffff');
      else hubThemeTuft(b, x, y + h * 0.004, h * 0.1, 'rgba(70,130,70,0.8)');
    } else {
      if (i % 2 === 0) drawFlower(b, x, y, h * 0.006, ['#ff7bac', '#ffe27a', '#c9a0ff', '#ffffff'][i % 4]);
      else hubThemeTuft(b, x, y + h * 0.004, h * 0.1, 'rgba(60,140,60,0.8)');
    }
  }
  n = kind ? 12 : 18;
  for (i = 0; i < n; i++) {
    x = w * (i + 0.25 + tkrHash(i + 90 + kind) * 0.5) / n;
    y = tkrShore(x, w, h) + h * 0.004;
    if (kind) {
      artBlob(b, x, y - h * 0.008, h * (0.03 + tkrHash(i) * 0.015), h * 0.02, '#a69fc4', { lineColor: '#5e5886', hi: 0.25 });
      artBlob(b, x + h * 0.03, y - h * 0.004, h * 0.016, h * 0.011, '#b8b2d4', { lineColor: '#5e5886' });
    } else {
      tkrReedClump(b, x, y, h * (0.05 + tkrHash(i + 3) * 0.03));
    }
  }
}
// Paju: riippuvat oksat
function tkrWillow(b, x, y, s) {
  var i, a;
  b.beginPath(); b.rect(x - s * 0.06, y - s * 0.6, s * 0.12, s * 0.6);
  artFillPath(b, '#9c6b3f', y - s * 0.6, y, s * 0.06, {});
  artCircle(b, x, y - s * 0.85, s * 0.48, '#8fd06a', { lineColor: '#4f9a3a', hi: 0.25 });
  b.strokeStyle = '#6cbc52';
  b.lineWidth = Math.max(1.2, s * 0.035);
  b.lineCap = 'round';
  for (i = 0; i < 9; i++) {
    a = -0.9 + i * 0.22;
    b.beginPath();
    b.moveTo(x + Math.sin(a) * s * 0.45, y - s * 0.75);
    b.quadraticCurveTo(x + Math.sin(a) * s * 0.62, y - s * 0.45, x + Math.sin(a) * s * 0.58, y - s * (0.12 + (i % 3) * 0.06));
    b.stroke();
  }
}
// Kaislatupsu: lehdet ja ruskeat osmankäämit
function tkrReedClump(b, x, y, s) {
  var i, lx;
  b.lineCap = 'round';
  for (i = 0; i < 5; i++) {
    lx = x + (i - 2) * s * 0.12;
    b.strokeStyle = i % 2 ? '#4f9a48' : '#6cbc58';
    b.lineWidth = Math.max(1.2, s * 0.05);
    b.beginPath();
    b.moveTo(lx, y);
    b.quadraticCurveTo(lx + (i - 2) * s * 0.06, y - s * 0.5, lx + (i - 2) * s * 0.16, y - s * (0.75 + (i % 2) * 0.25));
    b.stroke();
  }
  artBlob(b, x - s * 0.04, y - s * 0.82, s * 0.05, s * 0.13, '#8a5a34', { lineColor: '#4a2e18', line: Math.max(1, s * 0.02) });
  artBlob(b, x + s * 0.14, y - s * 0.68, s * 0.045, s * 0.12, '#8a5a34', { lineColor: '#4a2e18', line: Math.max(1, s * 0.02) });
}
// Etuala: harvat heinätupsut ja kaislat aivan alareunassa
function tkrRenderNear() {
  var w = tkr.tw, h = viewH, ch = Math.round(h * 0.1), b, i, x, y, n = 14;
  tkrNearCv.width = w;
  tkrNearCv.height = ch;
  b = tkrNearCv.getContext('2d');
  b.clearRect(0, 0, w, ch);
  for (i = 0; i < n; i++) {
    x = w * (i + 0.2 + tkrHash(i + 200) * 0.6) / n;
    y = ch + h * 0.004;
    if (i % 3 === 0) tkrReedClump(b, x, y, h * 0.09);
    else {
      artBlob(b, x, y - h * 0.004, h * 0.04, h * 0.012, '#4fa84c', { lineColor: '#2a6a30' });
      hubThemeTuft(b, x - h * 0.02, y - h * 0.008, h * 0.2, 'rgba(50,120,60,0.9)');
      hubThemeTuft(b, x + h * 0.02, y - h * 0.006, h * 0.16, 'rgba(70,150,70,0.9)');
    }
  }
}
function tkrBlit(c, cv, speed, y) {
  var tw = tkr.tw, off;
  if (!cv.width) return;
  off = ((camX * speed) % tw + tw) % tw;
  c.drawImage(cv, -off, y);
  if (tw - off < viewW) c.drawImage(cv, tw - off, y);
}

// ---------- Piirto ----------
function tkrDraw() {
  var c = ctx, i, o;
  if (!beginPlayWorld()) return;
  if (!tkr.built) { endPlayWorld(); return; }
  tkrPrepare();
  tkrDrawClouds(c);
  tkrBlit(c, tkrFarCv, 0.18, 0);
  tkrDrawWater(c);
  tkrDrawBanks(c);
  tkrDrawFall(c);
  tkrDrawCave(c, false);
  tkrDrawNest(c);
  propsDraw(c);
  for (i = 0; i < tkr.whirls.length; i++) tkrDrawWhirl(c, tkr.whirls[i]);
  tkrDrawBand(c);
  tkrDrawDrops(c);
  drawParticlesLayer(c);
  tkrDrawCave(c, true);
  tkrBlit(c, tkrNearCv, 1.25, viewH - tkrNearCv.height);
  for (i = 0; i < tkr.hearts.length; i++) {
    o = tkr.hearts[i];
    if (o.t <= 0) continue;
    c.globalAlpha = Math.max(0, Math.min(1, (o.life - o.t) / 0.5));
    tkrHeart(c, o.x - camX + Math.sin(o.t * 4 + i) * viewH * 0.01, o.y, viewH * 0.02 * o.s);
    c.globalAlpha = 1;
  }
  tkrDrawNums(c);
  tkrDrawGiftFly(c);
  tkrDrawFlyersWorld(c);
  tkrDrawHint(c);
  endPlayWorld();
  tkrDrawDark(c);
  tkrDrawHud(c);
}
// Ranta vaihtuu niitystä kivikoksi koskien kohdalla: saumakohdassa iso puuryhmä
var TKR_BANK_SEAMS = [4.45, 9.75, 12.05, 15.4];
function tkrDrawBanks(c) {
  var i, a = -1e9, b, k = 0, x0, x1, sx, h = viewH, y;
  for (i = 0; i <= TKR_BANK_SEAMS.length; i++) {
    b = i < TKR_BANK_SEAMS.length ? TKR_BANK_SEAMS[i] : 1e9;
    x0 = Math.max(0, tkrX(a));
    x1 = Math.min(viewW, tkrX(b));
    if (x1 > x0) {
      c.save();
      c.beginPath(); c.rect(x0, 0, x1 - x0, h * 0.6); c.clip();
      tkrBlit(c, tkrBankCv[k], 1, 0);
      c.restore();
    }
    a = b;
    k = 1 - k;
  }
  for (i = 0; i < TKR_BANK_SEAMS.length; i++) {
    sx = tkrX(TKR_BANK_SEAMS[i]);
    if (sx < -h * 0.3 || sx > viewW + h * 0.3) continue;
    y = tkrBankTop(sx + camX, tkr.tw, h) + h * 0.01;
    drawTree(c, sx - h * 0.07, y, h * 0.1);
    drawPine(c, sx + h * 0.08, y + h * 0.005, h * 0.17, '#4f9a6a', false);
    drawTree(c, sx + h * 0.01, y + h * 0.012, h * 0.12);
    artBlob(c, sx + h * 0.05, tkrShore(sx + camX, tkr.tw, h) - h * 0.012, h * 0.045, h * 0.022, '#a69fc4', { lineColor: '#5e5886', hi: 0.25 });
    drawBush(c, sx - h * 0.06, tkrShore(sx + camX, tkr.tw, h) - h * 0.004, h * 0.03);
  }
}
function tkrDrawClouds(c) {
  var i, x;
  for (i = 0; i < 3; i++) {
    x = ((i * 0.43 + 0.15 - tkr.t * 0.003 - tkr.camU * 0.04) % 1.3 + 1.3) % 1.3 - 0.15;
    drawCloud(c, x * viewW, viewH * (0.12 + i * 0.05), viewH * (0.03 + i * 0.006), 0.9);
  }
}
// Vesi: liukuväri, kimallus (liukuu hitaammin kuin kivet) ja kosken kuohu
function tkrDrawWater(c) {
  var top = viewH * TKR_WATER, i, i0, i1, cell, uu, x, v, y, len, k, P, a, b, s;
  c.fillStyle = tkr.waterGrad;
  c.fillRect(0, top, viewW, viewH - top);
  // Kimallus
  cell = 0.055;
  P = tkr.camU * 0.6 + tkr.t * 0.012;
  i0 = Math.floor(P / cell) - 1;
  i1 = Math.ceil((P + tkrSW()) / cell) + 1;
  c.lineCap = 'round';
  for (a = 0; a < 2; a++) {
    c.strokeStyle = a ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)';
    c.lineWidth = Math.max(1.2, viewH * 0.003);
    c.beginPath();
    for (i = i0; i <= i1; i++) {
      if ((i & 1) !== a) continue;
      uu = i * cell + tkrHash(i) * cell * 0.8;
      v = TKR_WATER + 0.035 + tkrHash(i + 0.5) * (0.98 - TKR_WATER - 0.035);
      k = tkrK(v);
      x = (uu - P) * tkrUW();
      y = v * viewH;
      len = viewW * (0.012 + tkrHash(i + 0.25) * 0.02) * k;
      if (Math.sin(tkr.t * 1.7 + i * 1.3) < -0.3) continue;
      c.moveTo(x - len, y);
      c.quadraticCurveTo(x, y - viewH * 0.004 * k, x + len, y);
    }
    c.stroke();
  }
  // Kosken kuohu: maailmaan kiinnitetyt vaahtojuovat (varoittavat koskesta jo ennen kiviä)
  cell = 0.04;
  i0 = Math.floor(tkr.camU / cell) - 1;
  i1 = Math.ceil((tkr.camU + tkrSW()) / cell) + 1;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1.5, viewH * 0.0045);
  c.beginPath();
  for (i = i0; i <= i1; i++) {
    uu = i * cell;
    b = tkrRapidsW(uu);
    if (b <= 0) continue;
    for (s = 0; s < 3; s++) {
      if (tkrHash(i * 3 + s) > b * 0.85) continue;
      v = TKR_WATER + 0.04 + tkrHash(i * 3 + s + 0.7) * 0.5;
      k = tkrK(v);
      x = tkrX(uu + tkrHash(i * 7 + s) * cell) + Math.sin(tkr.t * 6 + i + s) * viewH * 0.004;
      y = v * viewH;
      len = viewW * 0.018 * k;
      c.moveTo(x - len, y + viewH * 0.004);
      c.quadraticCurveTo(x, y - viewH * 0.008 * k, x + len, y + viewH * 0.004);
    }
  }
  c.stroke();
}
// Syvyysjärjestys: kaikki joen oliot piirretään vesirajan mukaan takaa eteen
function tkrDrawBand(c) {
  var L = tkrList, i, o, x, n = 0;
  L.length = 0;
  for (i = 0; i < tkr.rocks.length; i++) { o = tkr.rocks[i]; x = tkrX(o.u); if (x > -viewW * 0.1 && x < viewW * 1.1) L.push({ v: o.v, k: 0, o: o }); }
  for (i = 0; i < tkr.logs.length; i++) { o = tkr.logs[i]; x = tkrX(o.u); if (x > -viewW * 0.15 && x < viewW * 1.15) L.push({ v: o.v, k: 1, o: o }); }
  for (i = 0; i < tkr.pads.length; i++) { o = tkr.pads[i]; x = tkrX(o.u); if (x > -viewW * 0.1 && x < viewW * 1.1) L.push({ v: o.v - 0.01, k: 2, o: o }); }
  for (i = 0; i < tkr.pearls.length; i++) { o = tkr.pearls[i]; x = tkrX(o.u); if (!o.got && x > -viewW * 0.1 && x < viewW * 1.1) L.push({ v: o.v, k: 3, o: o }); }
  for (i = 0; i < tkr.fish.length; i++) { o = tkr.fish[i]; x = tkrX(o.u); if (o.state !== 'wait' && o.state !== 'gone' && x > -viewW * 0.2 && x < viewW * 1.2) L.push({ v: o.v + 0.001, k: 4, o: o }); }
  for (i = 0; i < tkr.ducks.length; i++) { o = tkr.ducks[i]; x = tkrX(o.u); if (x > -viewW * 0.1 && x < viewW * 1.1) L.push({ v: o.v, k: 5, o: o }); }
  for (i = 0; i < tkr.reeds.length; i++) { o = tkr.reeds[i]; x = tkrX(o.u); if (x > -viewW * 0.2 && x < viewW * 1.2) L.push({ v: o.v + 0.02, k: 6, o: o }); }
  x = tkrX(TKR_MOM_U);
  if (x > -viewW * 0.2 && x < viewW * 1.2) L.push({ v: TKR_MOM_V, k: 7, o: null });
  L.push({ v: tkr.r.v, k: 8, o: null });
  L.sort(function (a, b) { return a.v - b.v; });
  for (i = 0; i < L.length; i++) {
    o = L[i];
    if (o.k === 0) tkrDrawRockAt(c, o.o);
    else if (o.k === 1) tkrDrawLogAt(c, o.o);
    else if (o.k === 2) tkrDrawPadAt(c, o.o);
    else if (o.k === 3) tkrDrawPearlAt(c, o.o);
    else if (o.k === 4) tkrDrawFishAt(c, o.o);
    else if (o.k === 5) tkrDrawDuckAt(c, o.o);
    else if (o.k === 6) tkrDrawReeds(c, o.o);
    else if (o.k === 7) tkrDrawMom(c);
    else tkrDrawRaft(c);
    n++;
  }
}

// ---------- Kivet, tukit, lehdet, pyörteet, helmet, kalat ----------
function tkrDrawRockAt(c, o) {
  var k = tkrK(o.v), x = tkrX(o.u), y = o.v * viewH, r = o.r * viewH * k, t = tkr.t + o.ph, q, i;
  // Takavaahto ja sykkivä rengas
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.ellipse(x, y, r * 1.45, r * 0.42, 0, 0, Math.PI * 2); c.fill();
  q = (t * 0.9) % 1;
  c.strokeStyle = 'rgba(255,255,255,' + (0.85 * (1 - q)) + ')';
  c.lineWidth = Math.max(1.5, r * 0.12);
  c.beginPath(); c.ellipse(x, y, r * (1.45 + q * 0.9), r * (0.42 + q * 0.26), 0, 0, Math.PI * 2); c.stroke();
  // Vana alavirtaan (oikealle)
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1.2, r * 0.1);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i < 3; i++) {
    q = (t * 1.3 + i * 0.33) % 1;
    c.moveTo(x + r * (1.2 + q * 1.4), y + (i - 1) * r * 0.25);
    c.lineTo(x + r * (1.5 + q * 1.4), y + (i - 1) * r * 0.25);
  }
  c.stroke();
  // Kivi
  artBlob(c, x, y - r * 0.42, r, r * 0.8, '#a59cc8', { lineColor: '#5a5084', hi: 0.3 });
  artBlob(c, x + r * 0.55, y - r * 0.15, r * 0.45, r * 0.38, '#b4acd4', { lineColor: '#5a5084' });
  if (o.moss) artBlob(c, x - r * 0.2, y - r * 1.05, r * 0.4, r * 0.16, '#7fcf6a', { lineColor: '#3f8a3a', line: Math.max(1, r * 0.06) });
  // Etuvaahto peittää kiven juuren
  c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(x, y, r * 1.2, r * 0.32, 0, 0, Math.PI); c.fill();
  for (i = 0; i < 4; i++) {
    q = Math.sin(t * 3 + i * 1.7);
    c.beginPath(); c.arc(x - r * 0.9 + i * r * 0.6, y + r * 0.08 + q * r * 0.05, r * (0.14 + 0.04 * q), 0, Math.PI * 2); c.fill();
  }
}
function tkrDrawLogAt(c, o) {
  var k = tkrK(o.v), x = tkrX(o.u), y = o.v * viewH + Math.sin(tkr.t * 2 + o.ph) * viewH * 0.002, L = viewH * 0.075 * k, R = viewH * 0.018 * k;
  c.fillStyle = 'rgba(20,80,130,0.18)';
  c.beginPath(); c.ellipse(x, y + R * 0.2, L * 1.1, R * 0.7, 0, 0, Math.PI * 2); c.fill();
  c.save();
  c.translate(x, y - R * 0.5);
  c.rotate(o.rot);
  artRoundRect(c, -L, -R, L * 2, R * 2, R, '#b07a48', { lineColor: '#5a3a1e' });
  c.strokeStyle = 'rgba(90,58,30,0.5)';
  c.lineWidth = Math.max(1, R * 0.12);
  c.beginPath();
  c.moveTo(-L * 0.6, -R * 0.3); c.lineTo(L * 0.2, -R * 0.3);
  c.moveTo(-L * 0.3, R * 0.35); c.lineTo(L * 0.5, R * 0.35);
  c.stroke();
  artBlob(c, L * 0.92, 0, R * 0.42, R * 0.95, '#e8c48a', { lineColor: '#5a3a1e' });
  c.strokeStyle = 'rgba(150,100,50,0.7)';
  c.beginPath(); c.ellipse(L * 0.92, 0, R * 0.2, R * 0.5, 0, 0, Math.PI * 2); c.stroke();
  // Pieni oksa ja lehti
  artLimb(c, -L * 0.2, -R * 0.8, -L * 0.05, -R * 1.9, Math.max(1.5, R * 0.18), '#8a5a34', '#4a2e18');
  artBlob(c, -L * 0.0, -R * 2.0, R * 0.42, R * 0.22, '#7fd468', { lineColor: '#3f8a3a', rot: -0.4 });
  c.restore();
  c.fillStyle = 'rgba(90,190,235,0.5)';
  c.beginPath(); c.ellipse(x, y, L * 1.05, R * 0.45, 0, 0, Math.PI); c.fill();
}
function tkrDrawPad(c, x, y, s, dip, flower) {
  var n = 0.28, sq = 0.34;
  c.beginPath();
  c.moveTo(x, y);
  c.ellipse(x, y, s, s * sq, 0, n, Math.PI * 2 - n);
  c.closePath();
  artFillPath(c, '#5cc45a', y - s * sq, y + s * sq, s * sq, { lineColor: '#2f7a3a', line: Math.max(1.2, s * 0.06) });
  artHighlight(c, x - s * 0.35, y - s * 0.1, s * 0.3, s * 0.06, 0.35);
  c.strokeStyle = 'rgba(47,122,58,0.4)';
  c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath();
  c.moveTo(x, y); c.lineTo(x - s * 0.7, y - s * 0.12);
  c.moveTo(x, y); c.lineTo(x - s * 0.5, y + s * 0.2);
  c.moveTo(x, y); c.lineTo(x + s * 0.2, y + s * 0.25);
  c.stroke();
  if (flower) {
    tkrDrawLily(c, x - s * 0.25, y - s * 0.05, s * 0.32);
  }
}
function tkrDrawPadAt(c, o) {
  var k = tkrK(o.v), x = tkrX(o.u), y = o.v * viewH + Math.sin(tkr.t * 1.6 + o.ph) * viewH * 0.0015 + o.dip * viewH * 0.006;
  if (o.dip > 0) {
    c.strokeStyle = 'rgba(255,255,255,' + (0.7 * o.dip) + ')';
    c.lineWidth = Math.max(1, viewH * 0.002);
    c.beginPath(); c.ellipse(x, y, o.s * viewH * k * (2.2 - o.dip), o.s * viewH * k * 0.5 * (2.2 - o.dip), 0, 0, Math.PI * 2); c.stroke();
  }
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(tkr.t * 0.7 + o.ph) * 0.05 + o.dip * Math.sin(tkr.t * 14) * 0.12);
  tkrDrawPad(c, 0, 0, o.s * viewH * k * 1.6, o.dip, o.flower);
  c.restore();
}
// Pieni lumpeenkukka (lehdillä) ja iso (lautan kukka)
function tkrDrawLily(c, x, y, s) {
  var i;
  for (i = 0; i < 5; i++) tkrPetal(c, x + (i - 2) * s * 0.35, y, s * 0.9, s * 0.3, (i - 2) * 0.45, '#ffb0d0', '#d0608e');
  artCircle(c, x, y - s * 0.25, s * 0.22, '#ffe27a', { lineColor: '#c8901e' });
}
function tkrPetal(c, x, y, len, wid, ang, col, line) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(wid * 1.4, -len * 0.45, 0, -len);
  c.quadraticCurveTo(-wid * 1.4, -len * 0.45, 0, 0);
  c.closePath();
  artFillPath(c, col, -len, 0, wid, { lineColor: line, line: Math.max(1, wid * 0.14) });
  c.restore();
}
// Pyörre: litistetty spiraali, joka kiertää (lautta pyörähtää siinä)
function tkrDrawWhirl(c, o) {
  var x = tkrX(o.u), y = o.v * viewH, k = tkrK(o.v), R = viewH * 0.085 * k, rot = tkr.t * 3 + o.ph, i, a;
  if (x < -R * 2 || x > viewW + R * 2) return;
  c.save();
  c.translate(x, y);
  c.scale(1, 0.36);
  artGlow(c, 0, 0, R * 1.1, '#1f78b8', 0.35);
  c.fillStyle = 'rgba(30,100,170,0.35)';
  c.beginPath(); c.arc(0, 0, R * 0.32, 0, Math.PI * 2); c.fill();
  c.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    a = rot + i * Math.PI * 2 / 3;
    c.strokeStyle = 'rgba(255,255,255,' + (0.85 - i * 0.12) + ')';
    c.lineWidth = Math.max(1.5, R * 0.09);
    c.beginPath(); c.arc(0, 0, R * (0.45 + i * 0.22), a, a + 2.3); c.stroke();
  }
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = Math.max(1, R * 0.05);
  c.beginPath(); c.arc(0, 0, R * 1.05, rot * 0.7, rot * 0.7 + 4); c.stroke();
  c.restore();
}
// Kuplahelmi: hohtava saippuakupla, jonka sisällä kimaltaa helmi
function tkrDrawPearl(c, x, y, r, t) {
  var hue = Math.round((t * 50) % 360);
  artGlow(c, x, y, r * 2.4, '#ffd8f0', 0.5);
  c.fillStyle = 'rgba(225,245,255,0.4)';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'hsla(' + hue + ',85%,72%,0.95)';
  c.lineWidth = Math.max(1.2, r * 0.12);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = 'hsla(' + ((hue + 140) % 360) + ',85%,75%,0.8)';
  c.beginPath(); c.arc(x, y, r * 0.93, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
  artCircle(c, x + r * 0.1, y + r * 0.15, r * 0.42, '#fff4fa', { lineColor: '#d8a8c8', hi: 0.7 });
  artHighlight(c, x - r * 0.38, y - r * 0.4, r * 0.28, r * 0.14, 0.85);
}
function tkrDrawPearlAt(c, o) {
  var k = tkrK(o.v), x = tkrX(o.u), y = (o.v - 0.035) * viewH + Math.sin(tkr.t * 2.4 + o.ph) * viewH * 0.006, r = viewH * 0.02 * k;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.ellipse(x, o.v * viewH, r * 1.1, r * 0.3, 0, 0, Math.PI * 2); c.fill();
  tkrDrawPearl(c, x, y, r, tkr.t + o.ph);
}
// Kala: väreet varoittavat, sitten kaari virtaa vastaan
function tkrDrawFishAt(c, o) {
  var k = tkrK(o.v), x, y, s = viewH * 0.028 * k, q, a, i;
  if (o.state === 'warn') {
    x = tkrX(o.u); y = o.v * viewH;
    c.lineWidth = Math.max(1.2, viewH * 0.003);
    for (i = 0; i < 3; i++) {
      q = (o.t * 1.5 + i / 3) % 1;
      c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - q)) + ')';
      c.beginPath(); c.ellipse(x, y, s * (0.6 + q * 2), s * (0.2 + q * 0.6), 0, 0, Math.PI * 2); c.stroke();
    }
    // Evä vilahtaa
    c.fillStyle = '#ff9a6a';
    c.beginPath(); c.moveTo(x - s * 0.3, y); c.lineTo(x, y - s * 0.5 * Math.abs(Math.sin(o.t * 6))); c.lineTo(x + s * 0.3, y); c.closePath(); c.fill();
    return;
  }
  if (o.state === 'caught') {
    if (o.t > 0.8) return;
    x = tkrX(o.cu) + o.t * viewW * 0.1; y = tkrFishY(o) + o.t * viewH * 0.3;
    c.globalAlpha = 1 - o.t / 0.8;
  } else {
    x = tkrX(o.cu); y = tkrFishY(o);
  }
  a = o.state === 'leap' ? (o.t / 1.1 - 0.5) * 1.6 : 1;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.scale(-1, 1);
  c.beginPath(); c.moveTo(-s * 0.9, 0); c.lineTo(-s * 1.5, -s * 0.5); c.lineTo(-s * 1.4, 0); c.lineTo(-s * 1.5, s * 0.5); c.closePath();
  artFillPath(c, '#ff8a6a', -s * 0.5, s * 0.5, s * 0.5, { lineColor: '#b84a3a' });
  artBlob(c, 0, 0, s, s * 0.55, '#ffb07a', { lineColor: '#b84a3a', hi: 0.4 });
  c.strokeStyle = 'rgba(255,240,200,0.8)';
  c.lineWidth = Math.max(1, s * 0.1);
  c.beginPath(); c.moveTo(-s * 0.2, -s * 0.45); c.lineTo(-s * 0.2, s * 0.45); c.stroke();
  artEye(c, s * 0.5, -s * 0.1, s * 0.18, 0.4, false);
  artBlush(c, s * 0.45, s * 0.2, s * 0.12);
  c.restore();
  c.globalAlpha = 1;
}

// ---------- Ankat ----------
var TKR_DUCKLING = { body: '#ffd84a', shade: '#f2b22a', line: '#c8901e', head: '#ffe066', wing: '#ffc93a', beak: '#ff9a3a', beakLine: '#c8601e' };
var TKR_MOTHER = { body: '#ffffff', shade: '#e3dcf0', line: '#9a8fb8', head: '#ffffff', wing: '#efe8f8', beak: '#ff9a3a', beakLine: '#c8601e' };
// Ankka vesirajassa (x, y); s = koko, dir = katse (1 oikealle)
function tkrDrawDuck(c, x, y, s, dir, pal, o) {
  o = o || {};
  var hop = o.hop || 0, flap = o.flap ? Math.sin(globalT * 22) * 0.5 : 0;
  c.save();
  c.translate(x, y);
  if (!o.dry) {
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = Math.max(1, s * 0.08);
    c.beginPath(); c.ellipse(0, s * 0.05, s * 1.3, s * 0.28, 0, 0, Math.PI * 2); c.stroke();
  }
  c.translate(0, -hop);
  c.scale(dir, 1);
  if (o.tilt) c.rotate(o.tilt);
  // Pyrstö
  c.beginPath(); c.moveTo(-s * 0.75, -s * 0.3); c.lineTo(-s * 1.2, -s * 0.78); c.lineTo(-s * 0.5, -s * 0.62); c.closePath();
  artFillPath(c, pal.body, -s * 0.8, -s * 0.3, s * 0.3, { lineColor: pal.line });
  // Vartalo ja siipi
  artBlob(c, 0, -s * 0.38, s * 0.95, s * 0.6, pal.body, { lineColor: pal.line, shadeTo: pal.shade, hi: 0.3 });
  artBlob(c, -s * 0.15, -s * 0.48, s * 0.48, s * 0.28, pal.wing, { lineColor: pal.line, rot: -0.25 - flap });
  // Pää
  artCircle(c, s * 0.55, -s * 1.12, s * 0.5, pal.head, { lineColor: pal.line, shadeTo: pal.shade, hi: 0.4 });
  c.strokeStyle = pal.line;
  c.lineWidth = Math.max(1, s * 0.07);
  c.lineCap = 'round';
  c.beginPath(); c.arc(s * 0.5, -s * 1.68, s * 0.12, Math.PI * 0.9, Math.PI * 2.2); c.stroke();
  // Nokka (auki piipittäessä)
  if (o.peep) {
    artBlob(c, s * 1.0, -s * 1.1, s * 0.27, s * 0.09, pal.beak, { lineColor: pal.beakLine, line: Math.max(1, s * 0.05), rot: -0.2 });
    artBlob(c, s * 0.98, -s * 0.94, s * 0.22, s * 0.07, pal.beak, { lineColor: pal.beakLine, line: Math.max(1, s * 0.05), rot: 0.25 });
  } else {
    artBlob(c, s * 1.0, -s * 1.02, s * 0.27, s * 0.12, pal.beak, { lineColor: pal.beakLine, line: Math.max(1, s * 0.05) });
  }
  // Silmä
  if (o.happy) {
    c.strokeStyle = '#333';
    c.lineWidth = Math.max(1, s * 0.07);
    c.beginPath(); c.arc(s * 0.68, -s * 1.17, s * 0.1, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  } else {
    artEye(c, s * 0.68, -s * 1.22, s * 0.13, 0.5, ((globalT + (o.seed || 0)) % 3.1) < 0.12);
  }
  artBlush(c, s * 0.48, -s * 1.0, s * 0.12);
  if (o.bow) {
    artBlob(c, s * 0.28, -s * 1.55, s * 0.17, s * 0.12, '#ff7bac', { lineColor: '#c8507a', rot: 0.5 });
    artBlob(c, s * 0.08, -s * 1.48, s * 0.17, s * 0.12, '#ff7bac', { lineColor: '#c8507a', rot: -0.5 });
    artCircle(c, s * 0.18, -s * 1.52, s * 0.07, '#ff9fc8', { lineColor: '#c8507a' });
  }
  c.restore();
  if (o.dry) return;
  // Vesi peittää pohjan
  c.fillStyle = 'rgba(80,180,230,0.55)';
  c.beginPath(); c.ellipse(x, y + s * 0.1, s * 1.05, s * 0.2, 0, 0, Math.PI * 2); c.fill();
}
function tkrDrawDuckAt(c, d) {
  var k = tkrK(d.v), x = tkrX(d.u), s = viewH * 0.026 * k, y = d.v * viewH, hop = 0, peep = false, tilt = 0, o;
  if (d.state === 'chain') {
    y += Math.sin(tkr.t * 5 + d.id * 1.3) * viewH * 0.003;
    tilt = Math.sin(tkr.t * 7 + d.id) * 0.1;
  } else {
    y += Math.sin(tkr.t * 2.2 + d.ph) * viewH * 0.003;
  }
  if (d.hopT > 0) { hop = Math.sin(d.hopT / 0.35 * Math.PI) * s * 0.6; peep = true; }
  if (d.state === 'flee' || d.state === 'swimIn' || d.state === 'home') tilt = Math.sin(tkr.t * 18) * 0.12;
  if (d.state === 'mom' && tkr.state === 'hug') hop = Math.abs(Math.sin(tkr.t * 6 + d.id)) * s * 0.4;
  o = { hop: hop, peep: peep || d.noteT > 0.6, tilt: tilt, happy: d.joyT > 0 || d.state === 'mom', seed: d.id, flap: d.state === 'flee' };
  if (d.state === 'flee' || d.state === 'swimIn') {
    // Vauhtiviivat ja roiskeet melastaessa
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = Math.max(1, s * 0.1);
    c.beginPath();
    c.moveTo(x - d.dir * s * 1.5, y - s * 0.2); c.lineTo(x - d.dir * s * 2.4, y - s * 0.2);
    c.moveTo(x - d.dir * s * 1.4, y + s * 0.1); c.lineTo(x - d.dir * s * 2.1, y + s * 0.1);
    c.stroke();
  }
  tkrDrawDuck(c, x, y, s, d.dir, TKR_DUCKLING, o);
  // Eksyneen poikasen piipitys: nuotti nousee
  if (d.noteT > 0 && d.state === 'wait') {
    c.globalAlpha = Math.min(1, d.noteT * 2);
    tkrDrawNote(c, x + s * 0.8, y - s * 2.2 - (0.9 - d.noteT) * s * 1.5, s * 0.55);
    c.globalAlpha = 1;
  }
}
function tkrDrawNote(c, x, y, s) {
  c.fillStyle = '#ff7bac';
  c.beginPath(); c.ellipse(x, y, s * 0.55, s * 0.42, -0.4, 0, Math.PI * 2); c.fill();
  c.fillRect(x + s * 0.38, y - s * 1.7, s * 0.18, s * 1.7);
  c.beginPath(); c.moveTo(x + s * 0.47, y - s * 1.7); c.quadraticCurveTo(x + s * 1.2, y - s * 1.3, x + s * 0.9, y - s * 0.8);
  c.strokeStyle = '#ff7bac'; c.lineWidth = Math.max(1, s * 0.18); c.stroke();
}
function tkrDrawMom(c) {
  var x = tkrX(TKR_MOM_U), y = TKR_MOM_V * viewH + Math.sin(tkr.t * 1.8) * viewH * 0.003, s = viewH * 0.05 * tkrK(TKR_MOM_V), hop = 0, ru = tkrRU();
  if (tkr.momHop > 0) hop = Math.sin(tkr.momHop / 0.5 * Math.PI) * s * 0.35;
  tkrDrawDuck(c, x, y, s, tkr.state === 'cave' && ru > TKR_MOM_U ? 1 : -1, TKR_MOTHER, {
    hop: Math.max(0, hop), bow: true, peep: tkr.momHop > 0, flap: tkr.state === 'hug' || tkr.state === 'cave', happy: tkr.state === 'hug' || tkr.state === 'gift', seed: 7
  });
}
// Emon pesä rantakaislikossa
function tkrDrawNest(c) {
  var x = tkrX(TKR_MOM_U + 0.18), y = TKR_WATER * viewH + viewH * 0.002, s = viewH * 0.05, i;
  if (x < -s * 3 || x > viewW + s * 3) return;
  artBlob(c, x, y, s * 1.3, s * 0.38, '#c89a5a', { lineColor: '#6a4a24', hi: 0.2 });
  c.strokeStyle = 'rgba(106,74,36,0.6)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath();
  for (i = 0; i < 5; i++) { c.moveTo(x - s * 1.1 + i * s * 0.5, y - s * 0.2); c.lineTo(x - s * 0.8 + i * s * 0.5, y + s * 0.15); }
  c.stroke();
  tkrReedClump(c, x - s * 1.6, y + s * 0.1, s * 1.4);
  tkrReedClump(c, x + s * 1.5, y + s * 0.1, s * 1.2);
}

// ---------- Kaislikko ja piilopupu ----------
function tkrDrawReeds(c, o) {
  var x = tkrX(o.u), y = o.v * viewH, k = tkrK(o.v), s = viewH * 0.12 * k, W = viewW * 0.06, i, sx, lean, tip, h, sway, ear, bs = viewH * 0.04 * k;
  // Tynnyri (ja pupu) kaislojen takana
  if (o.real && o.part > 0.05) {
    bs *= 0.4 + 0.6 * easeOutBack(Math.min(1, o.part / 0.8));
    artBlob(c, x, y - bs * 0.2, bs * 0.75, bs * 0.95, '#c0884a', { lineColor: '#5a3a1e', hi: 0.25 });
    c.strokeStyle = '#7a6a5a';
    c.lineWidth = Math.max(1.5, bs * 0.12);
    c.beginPath(); c.moveTo(x - bs * 0.72, y - bs * 0.55); c.lineTo(x + bs * 0.72, y - bs * 0.55);
    c.moveTo(x - bs * 0.72, y + bs * 0.2); c.lineTo(x + bs * 0.72, y + bs * 0.2); c.stroke();
    artBlob(c, x, y - bs * 1.1, bs * 0.62, bs * 0.16, '#d8a468', { lineColor: '#5a3a1e' });
    if (o.real && !o.found) drawBunny(c, x, y - bs * 1.15, bs * 0.95, 0, globalT * 6, false);
    c.fillStyle = 'rgba(80,180,230,0.55)';
    c.beginPath(); c.ellipse(x, y + bs * 0.45, bs * 0.95, bs * 0.25, 0, 0, Math.PI * 2); c.fill();
  }
  c.lineCap = 'round';
  for (i = 0; i < 11; i++) {
    sx = x + (i - 5) / 5 * W;
    h = s * (0.8 + tkrHash(i + o.u * 10) * 0.5);
    sway = Math.sin(tkr.t * 1.6 + i * 0.7 + o.ph) * s * 0.04;
    lean = o.part * (i < 5 ? -1 : 1) * s * 0.55 * (1 - Math.abs(i - 5) / 7) + (i - 5) * s * 0.03;
    tip = { x: sx + lean + sway, y: y - h * (1 - o.part * 0.25) };
    c.strokeStyle = i % 2 ? '#4f9a48' : '#6cbc58';
    c.lineWidth = Math.max(1.5, s * 0.035);
    c.beginPath(); c.moveTo(sx, y + s * 0.05); c.quadraticCurveTo(sx + lean * 0.2, y - h * 0.5, tip.x, tip.y); c.stroke();
    if (i % 3 === 1) artBlob(c, tip.x - lean * 0.06, tip.y + s * 0.12, s * 0.04, s * 0.11, '#8a5a34', { lineColor: '#4a2e18', line: Math.max(1, s * 0.015) });
  }
  // Pupun korvanpäät vilahtavat kaislojen yllä (utelias lapsi huomaa)
  if (o.real && !o.found && o.part < 0.3) {
    ear = (tkr.t + o.ph) % 3.4;
    if (ear < 0.7) {
      h = Math.sin(ear / 0.7 * Math.PI) * s * 0.12;
      artBlob(c, x - s * 0.04, y - s * 0.92 - h, s * 0.035, s * 0.09, '#ffffff', { lineColor: BUNNY_LINE, rot: -0.2 });
      artBlob(c, x + s * 0.05, y - s * 0.9 - h, s * 0.035, s * 0.09, '#ffffff', { lineColor: BUNNY_LINE, rot: 0.25 });
    }
  }
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath(); c.ellipse(x, y + s * 0.05, W * 1.15, s * 0.07, 0, 0, Math.PI * 2); c.fill();
}

// ---------- Lautta ----------
// Lautan mitat ruudulla: vesiraja, lehden säteet, yksisarvisen jalat, kukka ja Pikkupilvi
function tkrRaftGeo() {
  var r = tkr.r, k = tkrK(r.v), rs = trekUS() * TKR_RAFT_SC * k, x = r.sx * viewW, y = r.v * viewH, hk, drop = 0, f = tkrFacing(), rx, ry, pr, fx, fy;
  y += Math.sin(tkr.t * 2.1) * viewH * 0.003;
  if (r.hopT >= 0) {
    // Putousporras: lautta lipsahtaa alas, roiskahtaa ja pomppaa takaisin
    hk = r.hopT / 1.2;
    drop = viewH * 0.04 * easeOutCubic(Math.min(1, hk / 0.25)) * (1 - easeInOutSine((hk - 0.25) / 0.75)) - viewH * 0.035 * Math.sin(Math.PI * tkrClamp((hk - 0.25) / 0.45, 0, 1));
    y += drop;
  }
  rx = 72 * rs;
  ry = 19 * rs;
  pr = TKR_PUP_R * viewH * k * r.pupS;
  fx = x - 50 * rs * f;
  fy = y - ry * 0.3;
  return { x: x, y: y, k: k, rs: rs, rx: rx, ry: ry, f: f, ux: x + 10 * rs * f, uy: y - ry * 0.15, fx: fx, fy: fy, px: fx, py: fy - pr * 0.75, pr: pr };
}
function tkrDrawRaft(c) {
  var r = tkr.r, g = tkrRaftGeo(), wob = r.wobT > 0 ? Math.sin(r.wobT * 22) * 0.08 * Math.min(1, r.wobT / 0.5) : 0, q, i, hk, rot, mood, jit, a;
  // Varjo ja vesirenkaat
  c.fillStyle = 'rgba(20,80,130,0.2)';
  c.beginPath(); c.ellipse(g.x, g.y + g.ry * 0.45, g.rx * 1.1, g.ry * 1.1, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = Math.max(1.2, viewH * 0.0025);
  for (i = 0; i < 2; i++) {
    q = (tkr.t * 0.7 + i * 0.5) % 1;
    c.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - q)) + ')';
    c.beginPath(); c.ellipse(g.x, g.y + g.ry * 0.2, g.rx * (1.05 + q * 0.3), g.ry * (1.1 + q * 0.5), 0, 0, Math.PI * 2); c.stroke();
  }
  // Pyörteessä vauhtikiekurat
  if (r.spinT >= 0) {
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    for (i = 0; i < 3; i++) {
      a = tkr.t * 8 + i * 2.1;
      c.beginPath(); c.ellipse(g.x, g.y - g.ry * 2, g.rx * 1.15, g.ry * 2.2, 0, a, a + 1.2); c.stroke();
    }
  }
  rot = r.tilt + wob;
  if (r.hopT >= 0) { hk = r.hopT / 1.2; rot += Math.sin(tkrClamp(hk / 0.5, 0, 1) * Math.PI) * 0.14; }
  c.save();
  c.translate(g.x, g.y);
  c.rotate(rot);
  // Jättilumpeenlehti: ylös kääntynyt reuna, suonet
  c.beginPath(); c.ellipse(0, g.ry * 0.15, g.rx, g.ry, 0, 0, Math.PI * 2);
  artFillPath(c, '#3f9a48', -g.ry, g.ry * 1.2, g.ry, { lineColor: '#22602e' });
  c.beginPath(); c.ellipse(0, -g.ry * 0.15, g.rx * 0.96, g.ry * 0.8, 0, 0, Math.PI * 2);
  artFillPath(c, '#7fd468', -g.ry, g.ry * 0.6, g.ry, { lineColor: '#2f7a3a' });
  c.fillStyle = '#95e27e';
  c.beginPath(); c.ellipse(0, -g.ry * 0.12, g.rx * 0.84, g.ry * 0.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(47,122,58,0.35)';
  c.lineWidth = Math.max(1, g.rs * 1.2);
  c.beginPath();
  for (i = 0; i < 10; i++) {
    a = i / 10 * Math.PI * 2;
    c.moveTo(0, -g.ry * 0.12);
    c.lineTo(Math.cos(a) * g.rx * 0.82, -g.ry * 0.12 + Math.sin(a) * g.ry * 0.58);
  }
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1, g.rs * 1.5);
  c.beginPath(); c.ellipse(0, -g.ry * 0.15, g.rx * 0.93, g.ry * 0.74, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
  // Yksisarvinen ja prinsessa (märkänä hytisee)
  jit = r.wetT > 0 ? Math.sin(globalT * 70) * viewH * 0.003 * Math.min(1, r.wetT) : 0;
  drawUnicorn(c, g.ux - g.x + jit, g.uy - g.y, g.rs, g.f, 0, false, globalT);
  if (r.wetT > 0) tkrDrawWet(c, g.ux - g.x + jit - 4 * g.rs * g.f, g.uy - g.y - 93 * g.rs, g.rs, r.wetT);
  if (tkr.giftHeld) tkrDrawShell(c, g.ux - g.x + 10 * g.rs * g.f, g.uy - g.y - 64 * g.rs, 30 * g.rs);
  // Sammakko kyydissä lehden etureunalla
  if (tkr.frogRide) tkrDrawFrog(c, g.rx * 0.62 * g.f, -g.ry * 0.25 - Math.abs(Math.sin(tkr.t * 1.3)) * g.rs * 2, viewH * 0.02 * g.k, (globalT % 3.7) < 0.12);
  // Iso kukka takaosassa ja Pikkupilvi sen terälehdillä
  tkrDrawRaftFlower(c, g.fx - g.x, g.fy - g.y, g.pr, false);
  mood = r.moodT > 0 ? r.mood : (tkr.state === 'cave' && tkr.spray ? 'wow' : (tkrRapidsW(tkrRU()) > 0.5 ? 'brave' : 'happy'));
  trekDrawPup(c, g.px - g.x, g.py - g.y + (r.wigT > 0 ? -Math.abs(Math.sin(r.wigT * 18)) * g.pr * 0.2 : 0), g.pr, {
    mood: mood, t: globalT, look: tkrPupLook(), lookY: 0.2, glow: r.glow, wave: r.wigT > 0 || tkr.state === 'hug',
    squash: r.wigT > 0 ? Math.sin(r.wigT * 30) * 0.1 : 0, squint: r.wigT > 0
  });
  tkrDrawRaftFlower(c, g.fx - g.x, g.fy - g.y, g.pr, true);
  if (r.dflyT > 0) tkrDrawDfly(c, g.px - g.x + g.pr * 0.2, g.py - g.y - g.pr * 1.05, viewH * 0.016, globalT, Math.min(1, r.dflyT));
  c.restore();
}
function tkrPupLook() {
  var i, d, best = 0.6, bd = 1e9, ru = tkrRU(), dist;
  for (i = 0; i < tkr.ducks.length; i++) {
    d = tkr.ducks[i];
    if (d.state === 'chain' || d.state === 'mom') continue;
    dist = Math.abs(d.u - ru);
    if (dist < 0.8 && dist < bd) { bd = dist; best = d.u > ru ? 1 : -1; }
  }
  return best;
}
// Lautan kukka: takaterälehdet ennen Pikkupilveä, etuterälehdet sen jälkeen
function tkrDrawRaftFlower(c, x, y, pr, front) {
  var i, L = pr * 1.25, W = pr * 0.42;
  if (!front) {
    for (i = 0; i < 6; i++) tkrPetal(c, x + (i - 2.5) * pr * 0.32, y, L, W, (i - 2.5) * 0.42, '#ff9cc4', '#c8508a');
    artBlob(c, x, y + pr * 0.05, pr * 0.95, pr * 0.3, '#ffd24f', { lineColor: '#c8901e' });
  } else {
    for (i = 0; i < 4; i++) tkrPetal(c, x + (i - 1.5) * pr * 0.42, y + pr * 0.32, L * 0.6, W * 0.9, (i - 1.5) * 0.55, '#ffb8d4', '#c8508a');
  }
}
// Märkä prinsessa: hytinäviivat ja tippuvat pisarat
function tkrDrawWet(c, hx, hy, us, wetT) {
  var i, k, a = Math.min(1, wetT * 2);
  c.globalAlpha = a;
  c.strokeStyle = '#6f8fe0';
  c.lineWidth = Math.max(1.5, us * 1.4);
  c.lineCap = 'round';
  for (i = -1; i <= 1; i += 2) {
    c.beginPath();
    c.moveTo(hx + i * us * 12, hy - us * 8);
    c.lineTo(hx + i * us * 15, hy - us * 4);
    c.lineTo(hx + i * us * 12, hy);
    c.lineTo(hx + i * us * 15, hy + us * 4);
    c.stroke();
  }
  for (i = 0; i < 3; i++) {
    k = (globalT * 1.6 + i * 0.33) % 1;
    artBlob(c, hx + (i - 1) * us * 9, hy + us * 6 + k * us * 30, us * 1.6, us * 2.3, '#8fc0ff', { lineColor: '#4a78c8', line: Math.max(1, us * 0.5) });
  }
  c.globalAlpha = 1;
}

// ---------- Tökättävien piirto ----------
function tkrDrawFrog(c, x, y, s, blink) {
  artBlob(c, x, y - s * 0.35, s * 0.6, s * 0.42, '#7fd46a', { lineColor: '#3a8a3a', hi: 0.3 });
  artCircle(c, x - s * 0.28, y - s * 0.78, s * 0.2, '#7fd46a', { lineColor: '#3a8a3a' });
  artCircle(c, x + s * 0.28, y - s * 0.78, s * 0.2, '#7fd46a', { lineColor: '#3a8a3a' });
  artEye(c, x - s * 0.28, y - s * 0.8, s * 0.12, 0, blink);
  artEye(c, x + s * 0.28, y - s * 0.8, s * 0.12, 0, blink);
  c.strokeStyle = '#2a6a2a';
  c.lineWidth = Math.max(1, s * 0.06);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - s * 0.42, s * 0.25, 0.3, Math.PI - 0.3); c.stroke();
  artBlush(c, x - s * 0.35, y - s * 0.38, s * 0.1);
  artBlush(c, x + s * 0.35, y - s * 0.38, s * 0.1);
}
function tkrDrawDfly(c, x, y, s, t, a) {
  var i, fl = Math.sin(t * 40) * 0.25;
  c.globalAlpha = a;
  c.fillStyle = 'rgba(220,245,255,0.7)';
  c.strokeStyle = 'rgba(80,150,200,0.7)';
  c.lineWidth = Math.max(1, s * 0.06);
  for (i = 0; i < 4; i++) {
    c.save();
    c.translate(x + (i < 2 ? -s * 0.1 : s * 0.25), y - s * 0.1);
    c.rotate((i % 2 ? 1 : -1) * (0.5 + fl) + (i < 2 ? -0.2 : 0.2));
    c.beginPath(); c.ellipse(0, -s * 0.7, s * 0.22, s * 0.7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  }
  artLimb(c, x - s * 1.3, y + s * 0.05, x, y, Math.max(1.5, s * 0.22), '#3a8ad8', '#1a4a88');
  artCircle(c, x + s * 0.3, y - s * 0.02, s * 0.3, '#5fb0ff', { lineColor: '#1a4a88', hi: 0.4 });
  artEye(c, x + s * 0.4, y - s * 0.08, s * 0.13, 0.5, false);
  c.globalAlpha = 1;
}
// Haikara rantavedessä: dipT = nokka veteen, boot = saapas nokassa
function tkrDrawHeron(c, x, y, s, p) {
  var dk = p.dipT > 0 ? Math.sin((0.9 - p.dipT) / 0.9 * Math.PI) : 0, nx, ny, hx, hy, shake = p.boot > 0 ? Math.sin(globalT * 14) * 0.15 : 0;
  artShadow(c, x, y + s * 0.02, s * 0.7, s * 0.12, 0.15);
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.ellipse(x, y, s * 0.6, s * 0.1, 0, 0, Math.PI * 2); c.stroke();
  artLimb(c, x - s * 0.1, y, x - s * 0.08, y - s * 0.9, Math.max(1.5, s * 0.06), '#ffb050', '#a8601a');
  artLimb(c, x + s * 0.12, y, x + s * 0.08, y - s * 0.9, Math.max(1.5, s * 0.06), '#ffb050', '#a8601a');
  artBlob(c, x, y - s * 1.1, s * 0.55, s * 0.32, '#dfe6fa', { lineColor: '#6a74a8', shadeTo: '#b8c2e6', hi: 0.3, rot: -0.2 });
  artBlob(c, x - s * 0.15, y - s * 1.12, s * 0.38, s * 0.2, '#b8c2e6', { lineColor: '#6a74a8', rot: -0.3 });
  // Kaula: S-mutka, joka ojentuu veteen
  nx = x + s * (0.45 + dk * 0.55);
  ny = y - s * (1.75 - dk * 1.55);
  c.lineCap = 'round';
  c.strokeStyle = '#6a74a8';
  c.lineWidth = s * 0.2;
  c.beginPath(); c.moveTo(x + s * 0.35, y - s * 1.2); c.quadraticCurveTo(x + s * (0.1 + dk * 0.5), y - s * (1.5 - dk * 0.6), nx, ny); c.stroke();
  c.strokeStyle = '#eef2fe';
  c.lineWidth = s * 0.14;
  c.stroke();
  hx = nx; hy = ny;
  c.save();
  c.translate(hx, hy);
  c.rotate(dk * 1.2 + shake);
  artCircle(c, 0, 0, s * 0.17, '#eef2fe', { lineColor: '#6a74a8' });
  c.strokeStyle = '#4a5488';
  c.lineWidth = Math.max(1, s * 0.04);
  c.beginPath(); c.moveTo(-s * 0.05, -s * 0.14); c.quadraticCurveTo(-s * 0.3, -s * 0.2, -s * 0.38, -s * 0.08); c.stroke();
  c.beginPath(); c.moveTo(s * 0.12, -s * 0.04); c.lineTo(s * 0.62, s * 0.04); c.lineTo(s * 0.12, s * 0.08); c.closePath();
  artFillPath(c, '#ffb050', -s * 0.05, s * 0.08, s * 0.1, { lineColor: '#a8601a', line: Math.max(1, s * 0.03) });
  artEye(c, s * 0.04, -s * 0.03, s * 0.055, 0.5, (globalT % 4.2) < 0.12);
  if (p.boot > 0) {
    // Vanha saapas roikkuu nokassa
    c.save();
    c.translate(s * 0.55, s * 0.08);
    c.rotate(Math.sin(globalT * 6) * 0.3);
    c.scale(1.5, 1.5);
    artRoundRect(c, -s * 0.12, 0, s * 0.24, s * 0.42, s * 0.06, '#7a5a3a', { lineColor: '#3a2a1a' });
    artRoundRect(c, -s * 0.12, s * 0.32, s * 0.42, s * 0.16, s * 0.07, '#7a5a3a', { lineColor: '#3a2a1a' });
    c.fillStyle = 'rgba(140,200,255,0.8)';
    c.beginPath(); c.arc(s * 0.2, s * 0.6 + ((globalT * 2) % 1) * s * 0.3, s * 0.04, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  c.restore();
}
// Saukko: pää ja tassut vedestä; flipT = kuperkeikka, clapT = taputus
function tkrDrawOtter(c, x, y, s, p) {
  var fk = p.flipT > 0 ? (0.8 - p.flipT) / 0.8 : 0, clap = p.clapT > 0 ? Math.abs(Math.sin(p.clapT * 16)) : 0.6, i;
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = Math.max(1, s * 0.05);
  c.beginPath(); c.ellipse(x, y, s * 1.1, s * 0.22, 0, 0, Math.PI * 2); c.stroke();
  c.save();
  c.translate(x, y - s * 0.5 - Math.sin(fk * Math.PI) * s * 0.9);
  c.rotate(fk * Math.PI * 2);
  artBlob(c, 0, s * 0.1, s * 0.55, s * 0.65, '#a8724a', { lineColor: '#5a3a20', hi: 0.25 });
  artBlob(c, 0, s * 0.2, s * 0.32, s * 0.42, '#f0d8b0', { line: false });
  // Tassut
  for (i = -1; i <= 1; i += 2) artCircle(c, i * s * (0.12 + clap * 0.18), -s * 0.05, s * 0.12, '#8a5a38', { lineColor: '#5a3a20' });
  // Pää
  artCircle(c, 0, -s * 0.55, s * 0.42, '#a8724a', { lineColor: '#5a3a20', hi: 0.3 });
  artCircle(c, -s * 0.33, -s * 0.86, s * 0.1, '#8a5a38', { lineColor: '#5a3a20' });
  artCircle(c, s * 0.33, -s * 0.86, s * 0.1, '#8a5a38', { lineColor: '#5a3a20' });
  artBlob(c, 0, -s * 0.42, s * 0.24, s * 0.16, '#f0d8b0', { line: false });
  artEye(c, -s * 0.16, -s * 0.62, s * 0.08, 0, (p.blink % 3.6) < 0.12);
  artEye(c, s * 0.16, -s * 0.62, s * 0.08, 0, (p.blink % 3.6) < 0.12);
  artCircle(c, 0, -s * 0.48, s * 0.06, '#3a2a1a', { line: false });
  c.strokeStyle = 'rgba(60,40,20,0.6)';
  c.lineWidth = Math.max(1, s * 0.02);
  c.beginPath();
  c.moveTo(-s * 0.1, -s * 0.44); c.lineTo(-s * 0.36, -s * 0.48);
  c.moveTo(s * 0.1, -s * 0.44); c.lineTo(s * 0.36, -s * 0.48);
  c.moveTo(-s * 0.08, -s * 0.36); c.quadraticCurveTo(0, -s * 0.3, s * 0.08, -s * 0.36);
  c.stroke();
  artBlush(c, -s * 0.24, -s * 0.42, s * 0.07);
  artBlush(c, s * 0.24, -s * 0.42, s * 0.07);
  c.restore();
  c.fillStyle = 'rgba(80,180,230,0.55)';
  c.beginPath(); c.ellipse(x, y + s * 0.05, s * 0.75, s * 0.18, 0, 0, Math.PI * 2); c.fill();
}

// ---------- Putousporras ja luola ----------
function tkrDrawFall(c) {
  var x = tkrX(TKR_FALL_U), top = TKR_WATER * viewH, i, y, q, fw = viewW * 0.03, cw = viewW * 0.07, g, k;
  if (x < -viewW * 0.25 || x > viewW * 1.2) return;
  // Ylempi vesi kimaltaa kynnyksellä, alempi vesi (portaan alla) tummempana
  g = c.createLinearGradient(x - viewW * 0.06, 0, x, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(230,250,255,0.45)');
  c.fillStyle = g;
  c.fillRect(x - viewW * 0.06, top, viewW * 0.06, viewH - top);
  g = c.createLinearGradient(x, 0, x + viewW * 0.2, 0);
  g.addColorStop(0, 'rgba(20,80,150,0.38)');
  g.addColorStop(1, 'rgba(20,80,150,0)');
  c.fillStyle = g;
  c.fillRect(x, top, viewW * 0.2, viewH - top);
  // Putoava vesiseinämä
  g = c.createLinearGradient(x, 0, x + fw, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(190,232,255,0.85)');
  c.fillStyle = g;
  c.fillRect(x, top + viewH * 0.008, fw, viewH - top);
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(2, viewH * 0.005);
  c.beginPath(); c.moveTo(x, top + viewH * 0.008); c.lineTo(x, viewH); c.stroke();
  c.strokeStyle = 'rgba(120,190,240,0.7)';
  c.lineWidth = Math.max(1.2, viewH * 0.0025);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i < 26; i++) {
    q = (tkr.t * 1.1 + tkrHash(i + 700)) % 1;
    y = top + viewH * 0.02 + (viewH - top) * ((i + 0.5) / 26);
    c.moveTo(x + fw * 0.15, y - viewH * 0.006);
    c.quadraticCurveTo(x + fw * (0.4 + q * 0.3), y - viewH * 0.004, x + fw * (0.6 + q * 0.4), y + viewH * 0.01 * q);
  }
  c.stroke();
  // Kuohu portaan juurella
  for (i = 0; i < 30; i++) {
    k = tkrHash(i + 800);
    q = (tkr.t * (0.6 + k * 0.6) + k) % 1;
    y = top + viewH * 0.02 + (viewH - top - viewH * 0.02) * tkrHash(i + 900);
    c.fillStyle = 'rgba(255,255,255,' + (0.95 - q * 0.7) + ')';
    c.beginPath(); c.arc(x + fw + q * cw, y + Math.sin(tkr.t * 5 + i) * viewH * 0.003, viewH * (0.006 + 0.009 * (1 - q)) * tkrK(y / viewH), 0, Math.PI * 2); c.fill();
  }
  artGlow(c, x + fw + cw * 0.3, viewH * 0.72, viewH * 0.22, '#ffffff', 0.32);
  // Kynnyskivet rannoilla
  artBlob(c, x + fw * 0.5, top + viewH * 0.004, viewH * 0.055, viewH * 0.026, '#a59cc8', { lineColor: '#5a5084', hi: 0.3 });
  artBlob(c, x + fw * 0.5, viewH * 0.99, viewH * 0.07, viewH * 0.035, '#a59cc8', { lineColor: '#5a5084', hi: 0.3 });
}
// Kallion harja (q = matka kallion reunasta × viewW): jyrkkä seinä, sitten loiva rinne
function tkrCliffTop(q) {
  if (q < 0.08) return viewH * (TKR_WATER + 0.03 - (TKR_WATER - 0.15) * Math.sqrt(q / 0.08));
  return viewH * Math.max(-0.02, 0.18 - (q - 0.08) * 0.38);
}
// Luolakallio, suu ja (front = true) kimalteleva vesiverho lautan edessä
function tkrDrawCave(c, front) {
  var x0 = tkrX(TKR_CAVE_U), mx = tkrX(TKR_CURTAIN_U), top = TKR_WATER * viewH, i, q, x, y, g, mh = viewH * 0.3, cw = viewW * 0.1;
  if (x0 > viewW + 10) return;
  if (!front) {
    // Kallio: kumpuileva vuorenrinne, sammalta ja kukkia harjalla
    c.beginPath();
    c.moveTo(x0, top + viewH * 0.03);
    for (q = 0; q <= 0.9; q += 0.02) c.lineTo(x0 + q * viewW, tkrCliffTop(q));
    c.lineTo(Math.max(viewW, x0 + viewW) + 20, tkrCliffTop(0.9));
    c.lineTo(Math.max(viewW, x0 + viewW) + 20, viewH);
    c.lineTo(mx - viewW * 0.02, viewH);
    c.lineTo(mx - viewW * 0.02, top + viewH * 0.01);
    c.quadraticCurveTo((x0 + mx) / 2, top + viewH * 0.02, x0, top + viewH * 0.03);
    c.closePath();
    artFillPath(c, '#a497cc', viewH * 0.05, viewH * 0.6, viewH * 0.2, { lineColor: '#5a4e88' });
    // Halkeamat ja kivikerrokset
    c.strokeStyle = 'rgba(90,78,136,0.35)';
    c.lineWidth = Math.max(1.2, viewH * 0.003);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0 + viewW * 0.03, viewH * 0.3); c.quadraticCurveTo(x0 + viewW * 0.12, viewH * 0.27, x0 + viewW * 0.2, viewH * 0.29);
    c.moveTo(x0 + viewW * 0.2, viewH * 0.2); c.quadraticCurveTo(x0 + viewW * 0.3, viewH * 0.17, x0 + viewW * 0.42, viewH * 0.19);
    c.moveTo(x0 + viewW * 0.5, viewH * 0.1); c.quadraticCurveTo(x0 + viewW * 0.6, viewH * 0.08, x0 + viewW * 0.72, viewH * 0.11);
    c.stroke();
    for (i = 0; i < 6; i++) {
      x = x0 + viewW * (0.06 + i * 0.1);
      y = tkrCliffTop(0.06 + i * 0.1) + viewH * 0.006;
      artBlob(c, x, y, viewW * 0.05, viewH * 0.02, '#7fcf6a', { lineColor: '#3f8a3a', hi: 0.25 });
      drawFlower(c, x + viewW * 0.015, y - viewH * 0.012, viewH * 0.006, ['#ff7bac', '#ffe27a', '#ffffff'][i % 3]);
    }
    // Suu: tumma holvi, jonka sisällä tuikkii kristalleja (luolaluku)
    c.beginPath();
    c.moveTo(mx - viewW * 0.02, viewH);
    c.lineTo(mx - viewW * 0.02, viewH * 0.45);
    c.quadraticCurveTo(mx, mh - viewH * 0.02, mx + viewW * 0.2, mh);
    c.lineTo(mx + viewW * 1.5, mh);
    c.lineTo(mx + viewW * 1.5, viewH);
    c.closePath();
    g = c.createLinearGradient(mx, 0, mx + viewW * 0.5, 0);
    g.addColorStop(0, '#3a2e6a');
    g.addColorStop(1, '#140e2c');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = '#5a4e88';
    c.lineWidth = Math.max(1.5, viewH * 0.006);
    c.stroke();
    for (i = 0; i < 9; i++) {
      x = mx + viewW * (0.08 + tkrHash(i + 300) * 0.6);
      y = viewH * (0.34 + tkrHash(i + 310) * 0.12);
      q = 0.5 + 0.5 * Math.sin(tkr.t * 2 + i * 1.7);
      artGlow(c, x, y, viewH * 0.03, '#9fe8ff', 0.4 * q);
      drawStar(c, x, y, viewH * 0.006 * (0.6 + q * 0.5), i, 0);
    }
    // Tumma vesi luolassa
    c.fillStyle = 'rgba(20,14,50,0.45)';
    c.fillRect(mx - viewW * 0.02, top, viewW * 1.6, viewH - top);
  } else {
    // Kimalteleva vesiverho holvin edessä
    c.fillStyle = 'rgba(220,240,255,0.28)';
    c.fillRect(mx - cw * 0.5, mh - viewH * 0.01, cw, viewH - mh);
    c.strokeStyle = 'rgba(255,255,255,0.65)';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    c.lineCap = 'round';
    c.beginPath();
    for (i = 0; i < 12; i++) {
      x = mx - cw * 0.45 + i * cw * 0.08;
      q = (tkr.t * 1.2 + tkrHash(i + 400)) % 1;
      y = mh + (viewH - mh) * q;
      c.moveTo(x, y - viewH * 0.12);
      c.lineTo(x, y);
    }
    c.stroke();
    for (i = 0; i < 10; i++) {
      x = mx - cw * 0.45 + tkrHash(i + 500) * cw * 0.9;
      y = mh + ((tkr.t * 0.25 + tkrHash(i + 510)) % 1) * (viewH - mh);
      q = 0.5 + 0.5 * Math.sin(tkr.t * 6 + i * 2.3);
      drawStar(c, x, y, viewH * 0.008 * (0.5 + q), tkr.t + i, 0.4 * q);
    }
    artGlow(c, mx, viewH * 0.9, viewH * 0.12, '#ffffff', 0.4);
    // Köynnökset roikkuvat holvin suulla
    c.strokeStyle = '#5fb050';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    for (i = 0; i < 6; i++) {
      x = mx - viewW * 0.01 + i * viewW * 0.04;
      y = (i ? mh : viewH * 0.45) + viewH * (0.05 + tkrHash(i + 600) * 0.06);
      c.beginPath();
      c.moveTo(x, i ? mh - viewH * 0.01 : viewH * 0.42);
      c.quadraticCurveTo(x + Math.sin(tkr.t * 1.3 + i) * viewH * 0.01, (y + mh) / 2, x, y);
      c.stroke();
      artBlob(c, x, y, viewH * 0.008, viewH * 0.012, '#7fcf6a', { lineColor: '#3f8a3a', line: 1 });
    }
  }
}
// Luolan pimeys lopussa; Pikkupilven hohde näkyy pimeän läpi
function tkrDrawDark(c) {
  var a, g;
  if (tkr.darkT <= 0 && tkr.state !== 'done') return;
  a = Math.min(1, tkr.darkT / 1.4);
  c.fillStyle = 'rgba(14,8,34,' + a + ')';
  c.fillRect(0, 0, viewW, viewH);
  g = tkrRaftGeo();
  artGlow(c, g.px, g.py, g.pr * 3.5, '#fff3b8', 0.55 * a);
  if (a > 0.6) trekDrawPup(c, g.px, g.py, g.pr, { mood: 'wow', t: globalT, glow: 0.8, look: 1 });
}
function tkrDrawDrops(c) {
  var i, d, a;
  for (i = 0; i < tkr.drops.length; i++) {
    d = tkr.drops[i];
    a = Math.max(0, 1 - d.t / d.life);
    c.fillStyle = d.w ? 'rgba(255,255,255,' + a + ')' : 'rgba(150,215,255,' + a + ')';
    c.beginPath(); c.arc(d.x - camX, d.y, d.r, 0, Math.PI * 2); c.fill();
  }
}
function tkrHeart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.0, y - s * 0.35, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 1.0, y - s * 0.35, x, y + s * 0.35);
  c.closePath();
  artFillPath(c, '#ff6f9a', y - s, y + s * 0.4, s * 0.6, { lineColor: '#c83a6a' });
}
// Emon laskemat numerot poikasten yllä
function tkrDrawNums(c) {
  var i, n, k, fs;
  for (i = 0; i < tkr.nums.length; i++) {
    n = tkr.nums[i];
    k = n.t / 1.4;
    fs = Math.round(viewH * 0.05 * (1 + easeOutBack(Math.min(1, n.t * 4)) * 0.2));
    c.globalAlpha = Math.min(1, (1 - k) * 3);
    c.font = 'bold ' + fs + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = fs * 0.18;
    c.strokeStyle = '#c8901e';
    c.lineJoin = 'round';
    c.strokeText(String(n.n), tkrX(n.u), n.v * viewH - k * viewH * 0.05);
    c.fillStyle = '#ffffff';
    c.fillText(String(n.n), tkrX(n.u), n.v * viewH - k * viewH * 0.05);
    c.textBaseline = 'alphabetic';
    c.globalAlpha = 1;
  }
}
// Emon lahja: simpukka nousee emon yltä ja lentää prinsessalle
function tkrDrawGiftFly(c) {
  var t, x0, y0, x1, y1, k, x, y, s, g;
  if (!tkr.gift) return;
  t = tkr.gift.t;
  x0 = tkrX(TKR_MOM_U);
  y0 = TKR_MOM_V * viewH - viewH * 0.16;
  s = viewH * 0.12;
  if (t < 1.0) {
    // Emo nostaa simpukan lammen pohjasta: se kohoaa ja kimaltaa
    k = easeOutBack(Math.min(1, t / 0.6));
    artGlow(c, x0, y0, s * 1.6 * k, '#ffe0f0', 0.75);
    tkrDrawShell(c, x0, y0 + (1 - k) * viewH * 0.08 + Math.sin(t * 6) * viewH * 0.004, s * k);
    if (Math.random() < 0.4) spawnSparkles(x0 + camX + trekRnd(-1, 1) * s * 0.5, y0, 1, '#ffd0ec');
  } else if (t < 2.0) {
    g = tkrRaftGeo();
    x1 = g.ux + 10 * g.rs; y1 = g.uy - 64 * g.rs;
    k = easeInOutSine(t - 1.0);
    x = x0 + (x1 - x0) * k;
    y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * viewH * 0.14;
    artGlow(c, x, y, s * 1.3, '#ffe0f0', 0.6);
    tkrDrawShell(c, x, y, s + (30 * g.rs - s) * k * k);
    if (Math.random() < 0.5) spawnSparkles(x + camX, y, 1, '#ffd0ec');
  }
}
// Lentävät: helmet HUD:iin, sammakko lautalle, lintu kaislikosta
function tkrDrawFlyersWorld(c) {
  var i, f, k, x, y, to, g;
  for (i = 0; i < tkr.flyers.length; i++) {
    f = tkr.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    if (f.kind === 'frog') {
      g = tkrRaftGeo();
      to = { x: g.x + g.rx * 0.62, y: g.y - g.ry * 0.25 };
      x = f.x0 + (to.x - f.x0) * k;
      y = f.y0 + (to.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.14;
      tkrDrawFrog(c, x, y, viewH * 0.022, false);
    } else if (f.kind === 'bird') {
      x = f.x0 + f.t * viewW * 0.25;
      y = f.y0 - f.t * viewH * 0.2 - Math.sin(f.t * 5) * viewH * 0.01;
      c.globalAlpha = Math.max(0, 1 - f.t / f.dur);
      tkrDrawBird(c, x, y, viewH * 0.018, f.t);
      c.globalAlpha = 1;
    }
  }
}
function tkrDrawBird(c, x, y, s, t) {
  var w = Math.sin(t * 25) * 0.6;
  artBlob(c, x, y, s, s * 0.7, '#7fc4ff', { lineColor: '#2a6aa8', hi: 0.4 });
  artBlob(c, x - s * 0.2, y - s * 0.5, s * 0.6, s * 0.25, '#a8d8ff', { lineColor: '#2a6aa8', rot: -0.6 + w });
  artBlob(c, x + s * 0.8, y + s * 0.05, s * 0.28, s * 0.1, '#ffb050', { lineColor: '#a8601a' });
  artEye(c, x + s * 0.4, y - s * 0.2, s * 0.15, 0.5, false);
}

// ---------- Vihjekäsi ----------
// Alussa ja joutilaana: käsi näyttää, miten sormi vie lautan eksyneen poikasen luo
function tkrDrawHint(c) {
  var g, to = null, i, d, k, hx, hy, bd = 1e9, x, s = viewH * 0.045, a;
  if (!tkrActive() || holding || trek.cardT > 0 || tkr.r.spinT >= 0) return;
  if (tkr.steered && tkr.idleT < TKR_HINT_IDLE) return;
  if (!tkr.steered && tkr.t < 1.0) return;
  g = tkrRaftGeo();
  for (i = 0; i < tkr.ducks.length; i++) {
    d = tkr.ducks[i];
    if (d.state !== 'wait' && d.state !== 'home') continue;
    x = tkrX(d.u);
    if (x < g.x || x > viewW * 0.95) continue;
    if (x - g.x < bd) { bd = x - g.x; to = { x: Math.min(x, viewW * TKR_X_MAX), y: d.v * viewH }; }
  }
  if (!to && !tkr.steered) to = { x: g.x, y: (tkr.r.v > 0.75 ? 0.64 : 0.86) * viewH };
  if (!to) return;
  k = (globalT % 1.8) / 1.8;
  a = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  hx = g.x + (to.x - g.x) * easeInOutSine(Math.min(1, k * 1.4));
  hy = g.y + (to.y - g.y) * easeInOutSine(Math.min(1, k * 1.4));
  c.globalAlpha = a * 0.5;
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(2, viewH * 0.005);
  c.setLineDash([viewH * 0.012, viewH * 0.012]);
  c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(to.x, to.y); c.stroke();
  c.setLineDash([]);
  c.globalAlpha = a;
  drawHand(c, hx + s * 0.1, hy + s * 0.2, s);
  c.globalAlpha = 1;
}

// ---------- HUD ----------
function tkrHudSlot(i) {
  var hs = viewH * 0.022;
  return { x: hudX() + hs * 2.0 + i * hs * 3.1, y: hs * 0.7 + hs * 1.7 };
}
function tkrHudPearlPos() {
  var hs = viewH * 0.022;
  return { x: hudX() + hs * 3.1 * 5 + hs * 0.9 + hs * 0.6 + hs * 1.8, y: hs * 0.7 + hs * 1.7 };
}
function tkrDrawHud(c) {
  var hs = viewH * 0.022, top = hs * 0.7, i, sl, n = tkrWithUs(), w, x, pw, b, k, f, p, x0, x1, y, j, a;
  w = hs * 3.1 * 5 + hs * 0.9;
  drawHudPanel(c, hudX(), top, w, hs * 3.4, hs);
  for (i = 0; i < 5; i++) {
    sl = tkrHudSlot(i);
    b = tkr.slotBump[i];
    if (i < n) {
      k = b > 0 ? 1 + Math.sin(Math.PI * b / 0.5) * 0.4 : 1;
      if (tkr.count > i) artGlow(c, sl.x, sl.y, hs * 1.9, '#ffe27a', 0.8);
      tkrDrawDuck(c, sl.x - hs * 0.1, sl.y + hs * 0.65, hs * 0.62 * k, 1, TKR_DUCKLING, { happy: tkr.count > i, dry: true });
    } else {
      x = sl.x + (b < 0 ? Math.sin(b * 40) * hs * 0.3 : 0);
      c.strokeStyle = 'rgba(200,150,40,0.6)';
      c.lineWidth = 1.5;
      c.setLineDash([hs * 0.25, hs * 0.2]);
      c.beginPath(); c.arc(x, sl.y, hs * 1.1, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 0.28;
      tkrDrawDuck(c, x - hs * 0.1, sl.y + hs * 0.65, hs * 0.62, 1, TKR_DUCKLING, { dry: true });
      c.globalAlpha = 1;
    }
  }
  // Kuplahelmet
  x = hudX() + w + hs * 0.6;
  pw = hs * 6.6;
  drawHudPanel(c, x, top, pw, hs * 3.4, hs);
  p = tkrHudPearlPos();
  k = tkr.hudBump > 0 ? 1 + Math.sin(Math.PI * tkr.hudBump / 0.4) * 0.35 : 1;
  tkrDrawPearl(c, p.x, p.y, hs * 0.95 * k, globalT);
  c.font = 'bold ' + Math.round(hs * 2.0 * k) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillStyle = '#4a5ab0';
  c.fillText(String(tkr.pearlsGot), p.x + hs * 1.5, p.y + hs * 0.1);
  c.textBaseline = 'alphabetic';
  // Lentävät helmet HUD:iin
  for (i = 0; i < tkr.flyers.length; i++) {
    f = tkr.flyers[i];
    if (f.kind !== 'pearl') continue;
    k = easeInOutSine(f.t / f.dur);
    tkrDrawPearl(c, f.x0 + (p.x - f.x0) * k, f.y0 + (p.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.1, viewH * 0.022 * (1 - k * 0.3), globalT * 2);
  }
  // Jokireitti: kosket vaahtona, emo lopussa, lautta etenee
  x0 = x + pw + hs * 1.6;
  x1 = viewW * 0.6 - hs * 1.4;
  if (x1 - x0 < hs * 7) return;
  drawHudPanel(c, x0 - hs * 1.0, top, x1 - x0 + hs * 2.0, hs * 3.4, hs);
  y = top + hs * 1.7;
  c.strokeStyle = '#6cc8f0';
  c.lineWidth = hs * 0.7;
  c.lineCap = 'round';
  c.beginPath();
  for (j = 0; j <= 20; j++) {
    a = x0 + (x1 - x0) * j / 20;
    if (j) c.lineTo(a, y + Math.sin(j * 1.3) * hs * 0.2); else c.moveTo(a, y);
  }
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = hs * 0.25;
  c.setLineDash([hs * 0.25, hs * 0.2]);
  for (j = 0; j < TKR_SECTIONS.length; j++) {
    if (TKR_SECTIONS[j][1] !== 'rapids') continue;
    c.beginPath();
    c.moveTo(x0 + (x1 - x0) * TKR_SECTIONS[j][0] / tkrCamStop(), y);
    c.lineTo(x0 + (x1 - x0) * TKR_SECTIONS[j + 1][0] / tkrCamStop(), y);
    c.stroke();
  }
  c.setLineDash([]);
  tkrDrawDuck(c, x1 + hs * 0.2, y + hs * 0.6, hs * 0.7, -1, TKR_MOTHER, { bow: true, dry: true });
  k = Math.min(1, tkr.camU / tkrCamStop());
  artBlob(c, x0 + (x1 - x0) * k, y + hs * 0.1, hs * 0.75, hs * 0.32, '#7fd468', { lineColor: '#2f7a3a' });
  trekDrawPup(c, x0 + (x1 - x0) * k, y - hs * 0.35, hs * 0.45, { mood: 'happy', t: globalT });
}

// ---------- Lahja ja kuvake ----------
// Helmisimpukka: vaaleanpunavalkoinen kampasimpukka, jonka edessä hohtaa helmi
function tkrDrawShell(c, x, y, s) {
  var R = s * 0.46, bx = x, by = y + R * 0.42, n = 7, i, a0 = Math.PI * 1.1, a1 = Math.PI * 1.9, a, am, g;
  if (s < 2) return;
  c.beginPath();
  c.moveTo(bx, by);
  for (i = 0; i <= n; i++) {
    a = a0 + (a1 - a0) * i / n;
    if (i === 0) c.lineTo(bx + Math.cos(a) * R, by + Math.sin(a) * R);
    else {
      am = a0 + (a1 - a0) * (i - 0.5) / n;
      c.quadraticCurveTo(bx + Math.cos(am) * R * 1.12, by + Math.sin(am) * R * 1.12, bx + Math.cos(a) * R, by + Math.sin(a) * R);
    }
  }
  c.closePath();
  artFillPath(c, '#ffd0e2', by - R, by, R, { lineColor: '#c8789c', line: Math.max(1, R * 0.07) });
  // Uurteet ja helmiäishohde
  c.strokeStyle = 'rgba(200,120,155,0.55)';
  c.lineWidth = Math.max(0.8, R * 0.04);
  c.beginPath();
  for (i = 1; i < n; i++) {
    a = a0 + (a1 - a0) * i / n;
    c.moveTo(bx + Math.cos(a) * R * 0.18, by + Math.sin(a) * R * 0.18);
    c.lineTo(bx + Math.cos(a) * R * 0.97, by + Math.sin(a) * R * 0.97);
  }
  c.stroke();
  c.lineWidth = Math.max(1, R * 0.06);
  c.strokeStyle = 'rgba(150,215,255,0.45)';
  c.beginPath(); c.arc(bx, by, R * 0.55, a0 + 0.1, a1 - 0.1); c.stroke();
  c.strokeStyle = 'rgba(210,170,255,0.45)';
  c.beginPath(); c.arc(bx, by, R * 0.78, a0 + 0.1, a1 - 0.1); c.stroke();
  artHighlight(c, bx - R * 0.35, by - R * 0.62, R * 0.2, R * 0.1, 0.6);
  // Sarana
  artRoundRect(c, bx - R * 0.3, by - R * 0.1, R * 0.6, R * 0.22, R * 0.08, '#f4b0c8', { lineColor: '#c8789c', line: Math.max(1, R * 0.05) });
  // Helmi
  artGlow(c, bx, by - R * 0.12, R * 0.6, '#ffffff', 0.7);
  artCircle(c, bx, by - R * 0.12, R * 0.24, '#fff8fc', { lineColor: '#d8a8c8', line: Math.max(1, R * 0.05), hi: 0.8 });
  g = 0.5 + 0.5 * Math.sin(globalT * 3 + x * 0.01);
  if (s > 20) drawStar(c, bx + R * 0.5, by - R * 0.75, R * 0.12 * (0.6 + g * 0.5), globalT, 0);
}
// Aseman mitali: joki, lehtilautta, Pikkupilvi ja ankanpoikanen
function tkrIcon(c, x, y, s) {
  var g;
  g = c.createLinearGradient(0, y - s * 0.5, 0, y);
  g.addColorStop(0, '#8fd4ff');
  g.addColorStop(1, '#e0f6ff');
  c.fillStyle = g;
  c.fillRect(x - s * 0.5, y - s * 0.5, s, s * 0.5);
  c.fillStyle = '#86d470';
  c.fillRect(x - s * 0.5, y - s * 0.06, s, s * 0.08);
  c.fillStyle = '#56bce8';
  c.fillRect(x - s * 0.5, y + s * 0.02, s, s * 0.5);
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1, s * 0.012);
  c.beginPath();
  c.moveTo(x - s * 0.4, y + s * 0.1); c.lineTo(x - s * 0.3, y + s * 0.1);
  c.moveTo(x + s * 0.1, y + s * 0.34); c.lineTo(x + s * 0.24, y + s * 0.34);
  c.moveTo(x - s * 0.2, y + s * 0.38); c.lineTo(x - s * 0.08, y + s * 0.38);
  c.stroke();
  tkrDrawPearl(c, x + s * 0.24, y - s * 0.2, s * 0.06, globalT);
  artBlob(c, x - s * 0.06, y + s * 0.2, s * 0.3, s * 0.08, '#3f9a48', { lineColor: '#22602e' });
  artBlob(c, x - s * 0.06, y + s * 0.18, s * 0.28, s * 0.065, '#7fd468', { lineColor: '#2f7a3a' });
  tkrDrawRaftFlower(c, x - s * 0.08, y + s * 0.15, s * 0.11, false);
  trekDrawPup(c, x - s * 0.08, y + s * 0.07, s * 0.11, { mood: 'happy', t: globalT, look: 1 });
  tkrDrawRaftFlower(c, x - s * 0.08, y + s * 0.15, s * 0.11, true);
  tkrDrawDuck(c, x + s * 0.3, y + s * 0.24, s * 0.06, -1, TKR_DUCKLING, {});
}
