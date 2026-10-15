'use strict';

// HOH-TO-LUO-LA (Pikkupilven kotimatka, luku 3/5). Keskivaikea, n. 3 min.
// Luola on pimeä. Pikkupilvi joi vesiputouksen kimaltavaa vettä (luku 2) ja
// hohtaa nyt: luvun alussa se hämmästyy ("vau") ja syttyy loistamaan.
//   Liike: yksisarvinen kävelee itsestään oikealle, mutta VAIN kun polku sen
//   edessä on valaistu: sormi raahaa Pikkupilveä valona edellä (0..0,35 ×
//   viewW yksisarvisen edessä eikä liian ylhäällä). Pimeässä yksisarvinen
//   pysähtyy ja vapisee; liian kauas karannut valo saa sen hirnahtamaan
//   hermostuneesti. Sytytetyt valot (sienet, portit) valaisevat myös polkua.
//   Varjomöröt: pörröisiä tummia palleroita, joiden silmät tuikkivat pimeässä.
//   Silmät räpsyvät ensin (varoitus), sitten mörkö hiipii kohti yksisarvista.
//   Pikkupilven valo möröllä TKC_ZAP s -> se vinkaisee, kutistuu ja muuttuu
//   hohtavaksi koiperhoseksi, joka lepattaa ylös ja jää pieneksi valoksi.
//   Jos mörkö ehtii perille: yksisarvinen hypähtää taaksepäin, Pikkupilvi
//   säikähtää ja mörkö kikattaa takaisin pimeään (se palaa). Möröt eivät
//   astu muihin valoihin, vaan odottavat valon reunalla. Loppupuolella mörköjä
//   on enemmän, ja osa hiipii takaa (valo pitää viedä taaksepäin).
//   Seinäkristallit (10, HUD): valo kristallin luona TKC_HOVER s sytyttää sen
//   pysyvästi (kilahdus, sävel nousee). Vapaaehtoisia, laskuri HUD:ssa.
//   Numerokristalliovet (3): ovessa iso numero ja yhtä monta koloa
//   (kymppiruudukko). Edessä 4–5 numerokristallia (pisteet + numero).
//   Napautus sytyttää tai sammuttaa kristallin; sen pisteet lentävät oven
//   koloihin. Summa = numero -> ovi jyrisee auki. Liikaa -> kristallit
//   lepattavat hiljaa sammuksiin ("hmm") ja yritetään uudestaan.
//   Ovet 3–5 (1–2 kristallia), 6–8 (tasan kaksi), 9–10 (tasan kolme).
//   Arvot arvotaan joka kerta. Viimeisen oven takaa leijuu laulava kristalli
//   (luvun lahja) prinsessalle.
//   Piilopupu: yksi kolmesta seinäkolosta (arvotaan), näkyy vain valossa.
//   Tökättävät: lepakot katossa (3.: sydänmuodostelma), hohtosienet
//   (5.: itiösade), tippukivet (pisarat soittavat asteikkoa), myyrä-
//   kaivosmies lyhtyineen ja vaunuineen (3.: ajelu vaunulla).
//   Loppu: auringonsäde katon aukosta. Pikkupilvi raahataan säteeseen, se juo
//   auringonvaloa ja paisuu isoksi pilveksi; prinsessa ja yksisarvinen
//   hyppäävät kyytiin ja nousevat kuilua ylös valoon.
// Paikat ovat maailman yksiköissä U = worldW / 5 (koon muutos skaalaa ne).

var TKC_SPEED = 0.055;       // kävely × viewW / s
var TKC_START = 0.3;         // lähtöpaikka × U
var TKC_PUP_R = 0.05;        // Pikkupilven säde × viewH
var TKC_LIGHT_R = 0.24;      // Pikkupilven valon säde × viewH
var TKC_LEAD = 0.35;         // valo saa olla enintään näin paljon edellä × viewW
var TKC_PUP_MIN_Y = 0.28;    // valo liian ylhäällä, jos y < tämä × viewH
var TKC_DARK = 0.9;          // pimeyden peittävyys
var TKC_VIGNETTE = 0.8;      // reunojen tummennus
var TKC_HOVER = 0.5;         // seinäkristallin sytytys (s valoa)
var TKC_HOVER_R = 0.13;      // ... kun valo on näin lähellä × viewH
var TKC_ZAP = 0.4;           // möröstä koiperhonen (s valoa)
var TKC_TELL = 0.9;          // silmien räpsytys ennen hiipimistä (s)
var TKC_CREEP = [0.12, 0.16]; // mörön hiipimisnopeus alussa / lopussa × viewW / s
var TKC_SENSE = 0.42;        // mörkö herää, kun yksisarvinen on näin lähellä × viewW
var TKC_KNOCK = 0.15;        // takaisku × viewW
var TKC_REAR_T = 0.6;        // takaiskun kesto (s)
var TKC_COOLDOWN = 2.5;      // mörön tauko takaiskun jälkeen (s)
var TKC_GATE_U = [1.45, 2.55, 3.65];  // numero-ovet × U
var TKC_SUN_U = 4.62;        // auringonsäde × U
var TKC_CRYSTAL_U = [0.55, 0.8, 1.15, 1.75, 2.0, 2.3, 2.85, 3.1, 3.95, 4.2];  // seinäkristallit × U
var TKC_BUNNY_SPOTS = [[0.68, 0.4], [1.68, 0.44], [2.95, 0.38]];  // piilopupun kolot (U, y × viewH)
// Mörköjä osuuksittain [edestä, takaa]: alku, ovi 1 -> 2, ovi 2 -> 3, ovi 3 -> loppu
var TKC_CRITTERS = [[1, 0], [2, 1], [2, 1], [3, 2]];
var TKC_GROW_T = 2.0;        // Pikkupilvi paisuu säteessä (s)
var TKC_BOARD_T = 0.9;       // kyytiin hyppy (s)
var TKC_RISE_T = 2.8;        // nousu kuilua ylös (s)
var TKC_BIG = 3.4;           // ison pilven koko × TKC_PUP_R
var TKC_SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
var TKC_CRY_COLS = ['#8fd3ff', '#c9a0ff', '#ff9ec6', '#9fffd8', '#ffe27a'];
var TKC_NUM_COLS = ['#ffffff', '#ff9ec6', '#ffb86b', '#ffe27a', '#8fe3a0', '#8fc8ff'];

var tkc = { built: false, t: 0 };
var tkcLight = { vignette: TKC_VIGNETTE };
var tkcDarkCv = document.createElement('canvas');
var tkcHoleCv = null;
var tkcGlowCache = {};

trekRegister({
  id: 'cave', order: 3, name: 'HOH-TO-LUO-LA', color: '#7a6cd0',
  ambient: 'fireflies', light: tkcLight, bunny: true,
  gift: { draw: function (c, x, y, s) { tkcDrawGift(c, x, y, s, globalT); } },
  init: function () { tkcInit(); },
  update: function (dt) { tkcUpdate(dt); },
  draw: function () { tkcDraw(); },
  tap: function (px, py) { tkcTap(px, py); },
  resize: function () { tkcResize(); },
  layers: function () { return [{ speed: 0.35, render: tkcRenderFar }, { speed: 1, render: tkcRenderNear }]; },
  icon: function (c, x, y, s) { tkcIcon(c, x, y, s); }
});

// ---------- Apu ----------
function tkcRnd(a, b) { return a + Math.random() * (b - a); }
function tkcHash(i) { var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); }
function tkcU() { return Math.max(1, worldW) / 5; }
function tkcWX(u) { return u * tkcU(); }
function tkcSunX() { return tkcWX(TKC_SUN_U); }
function tkcStartX() { return tkcWX(TKC_START); }
function tkcEndStop() { return tkcSunX() - viewW * 0.3; }
function tkcFloorY(x) {
  var k = x / tkcU();
  return viewH * (0.83 + 0.012 * Math.sin(k * 6.3 + 0.5) + 0.007 * Math.sin(k * 15.7 + 1.1));
}
// Katto; auringonsäteen kohdalla katossa on aukko (y < 0)
function tkcCeilY(x) {
  var k = x / tkcU(), y = viewH * (0.11 + 0.025 * Math.sin(k * 4.9 + 2) + 0.015 * Math.sin(k * 13.1)), g;
  g = 1 - Math.abs(x - tkcSunX()) / (viewW * 0.15);
  if (g > 0) y = y + (-viewH * 0.06 - y) * easeInOutSine(Math.min(1, g * 2.2));
  return y;
}
function tkcPupR() { return viewH * TKC_PUP_R * (tkc.pup ? tkc.pup.scale : 1); }
function tkcLightR() { return viewH * TKC_LIGHT_R * tkc.pup.glow * (1 + Math.sin(globalT * 3) * 0.03); }
function tkcGateStop(g) { return g.x() - viewW * 0.62; }
function tkcNextGate() {
  var i;
  for (i = 0; i < tkc.gates.length; i++) if (tkc.gates[i].state !== 'open') return tkc.gates[i];
  return null;
}
function tkcNextStop() {
  var g = tkcNextGate();
  return g ? tkcGateStop(g) : tkcEndStop();
}
function tkcSay(mood, dur) { tkc.mood = mood; tkc.moodT = dur; }

// ---------- Alustus ----------
function tkcInit() {
  var vw = viewW, vh = viewH, i, u;
  tkc.built = true;
  tkc.state = 'intro';
  tkc.t = 0;
  tkc.stT = 0;
  tkc.lastW = worldW;
  tkc.lastH = viewH;
  tkc.ux = tkcStartX();
  tkc.v = 0;
  tkc.walkPhase = 0;
  tkc.moving = false;
  tkc.rearT = 0; tkc.rearFrom = 0; tkc.rearTo = 0;
  tkc.darkT = 0;
  tkc.neighT = 1.5;
  tkc.happyNeighT = 0;
  tkc.pup = { x: tkc.ux + vw * 0.17, y: vh * 0.55, glow: 0, vx: 0, scale: 1, wig: 0, glowed: false };
  tkc.grab = 'none';
  tkc.offX = 0; tkc.offY = 0;
  tkc.wasHolding = false;
  tkc.downT = 0; tkc.downMove = 0;
  tkc.mood = 'happy'; tkc.moodT = 0;
  tkc.idleT = 0;
  tkc.everDragged = false;
  tkc.scares = 0;
  tkc.zaps = 0;
  tkc.gateTries = 0;
  tkc.got = 0;
  tkc.flyers = [];
  tkc.hudBump = 0;
  tkc.moths = [];
  tkc.lights = null;
  tkc.gi = -1;
  tkc.gift = { state: 'none', t: 0, x: 0, y: 0, x0: 0, y0: 0 };
  tkc.end = { t: 0, cy: 0, cx: 0, uy: 0, ux0: 0, pan: 0, flood: 0, done: false, notes: 0 };
  tkc.pan = 0;
  tkcLight.vignette = TKC_VIGNETTE;
  // Seinäkristallit
  tkc.crystals = [];
  for (i = 0; i < TKC_CRYSTAL_U.length; i++) {
    tkc.crystals.push({ u: TKC_CRYSTAL_U[i] + tkcRnd(-0.05, 0.05), yf: tkcRnd(0.3, 0.55), lit: false, charge: 0, litT: 0,
      col: TKC_CRY_COLS[i % TKC_CRY_COLS.length], rot: tkcRnd(-0.25, 0.25), ph: Math.random() * 6 });
  }
  // Numero-ovet
  tkc.gates = [];
  for (i = 0; i < TKC_GATE_U.length; i++) tkc.gates.push(tkcMakeGate(i));
  // Hehkumadot katossa (osa lepakoiden luona)
  tkc.worms = [];
  var wu = [1.1, 3.3, 0.42, 0.95, 1.95, 2.45, 3.0, 3.85, 4.25];
  for (i = 0; i < wu.length; i++) {
    u = wu[i] + (i > 1 ? tkcRnd(-0.06, 0.06) : 0.05);
    tkc.worms.push({ u: u, n: 3 + Math.floor(Math.random() * 3), len: tkcRnd(0.05, 0.12), ph: Math.random() * 6 });
  }
  // Piilopupu
  i = Math.floor(Math.random() * TKC_BUNNY_SPOTS.length);
  tkc.bunnySpot = i;
  tkc.bunny = { u: TKC_BUNNY_SPOTS[i][0], yf: TKC_BUNNY_SPOTS[i][1], ph: Math.random() * 6 };
  tkcSetupProps();
  tkc.critters = tkcMakeCritters();
  camX = tkcCamTarget();
}

// Numero-ovi: tavoite ja kristallien arvot; ratkaisu taataan ja helpoin
// ratkaisu on tasan oikean kokoinen (ovi 2: kaksi kristallia, ovi 3: kolme)
function tkcMakeGate(i) {
  var T, n, vals, sols, ok = false, tries = 0, minSize, j;
  while (!ok && tries < 800) {
    tries++;
    if (i === 0) { T = 3 + Math.floor(Math.random() * 3); n = 4; }
    else if (i === 1) { T = 6 + Math.floor(Math.random() * 3); n = Math.random() < 0.5 ? 4 : 5; }
    else { T = 9 + Math.floor(Math.random() * 2); n = 5; }
    vals = [];
    for (j = 0; j < n; j++) vals.push(1 + Math.floor(Math.random() * 5));
    sols = tkcSubsets(vals, T);
    if (!sols.length) continue;
    minSize = 99;
    for (j = 0; j < sols.length; j++) minSize = Math.min(minSize, tkcBits(sols[j]));
    if (i === 0) ok = minSize <= 2;
    else if (i === 1) ok = minSize === 2;
    else ok = minSize === 3;
    // Kaikki kristallit yhteensä eivät saa olla ainoa ratkaisu
    if (ok && sols.length === 1 && tkcBits(sols[0]) === n) ok = false;
  }
  if (!ok) {
    if (i === 0) { T = 4; vals = [1, 3, 5, 2]; }
    else if (i === 1) { T = 7; vals = [3, 1, 4, 5]; }
    else { T = 10; vals = [2, 3, 1, 5, 4]; }
    sols = tkcSubsets(vals, T);
  }
  var g = { idx: i, u: TKC_GATE_U[i], target: T, crys: [], sols: sols, state: 'sleep', t: 0, order: [], flights: [],
    evalT: 0, over: false, idle: 0, openK: 0, solvedT: 0 };
  g.x = function () { return tkcWX(g.u); };
  for (j = 0; j < vals.length; j++) g.crys.push({ v: vals[j], lit: false, flick: 0, pop: 0, ph: Math.random() * 6 });
  return g;
}
function tkcSubsets(vals, T) {
  var out = [], n = vals.length, m, i, s;
  for (m = 1; m < (1 << n); m++) {
    s = 0;
    for (i = 0; i < n; i++) if (m & (1 << i)) s += vals[i];
    if (s === T) out.push(m);
  }
  return out;
}
function tkcBits(m) { var n = 0; while (m) { n += m & 1; m >>= 1; } return n; }

// Varjomöröt osuuksittain: edessä odottavat ja takaa hiipivät
function tkcMakeCritters() {
  var out = [], segs = [], i, j, k, a, b, x, ok, tries, gx, vh = viewH, vw = viewW;
  segs.push([tkcStartX() + vw * 0.22, tkcGateStop(tkc.gates[0]) - vw * 0.08]);
  for (i = 0; i < tkc.gates.length; i++) {
    gx = tkc.gates[i].x();
    segs.push([gx + vh * 0.42, (i + 1 < tkc.gates.length ? tkcGateStop(tkc.gates[i + 1]) : tkcEndStop()) - vw * 0.06]);
  }
  for (i = 0; i < segs.length; i++) {
    a = segs[i][0]; b = Math.max(a + vw * 0.05, segs[i][1]);
    for (j = 0; j < TKC_CRITTERS[i][0]; j++) {
      tries = 0;
      do {
        x = tkcRnd(a, b);
        ok = true;
        for (k = 0; k < props.length; k++) if (props[k].floorLight && Math.abs(props[k].x - x) < vh * 0.3) ok = false;
        for (k = 0; k < out.length; k++) if (Math.abs(out[k].x - x) < vw * 0.1) ok = false;
      } while (!ok && ++tries < 60);
      out.push(tkcNewCritter(x, 1, 0));
    }
    for (j = 0; j < TKC_CRITTERS[i][1]; j++) out.push(tkcNewCritter(0, -1, a + (b - a) * (0.35 + j * 0.3)));
  }
  return out;
}
function tkcNewCritter(x, side, trig) {
  return { x: x, side: side, trig: trig, state: 'wait', t: 0, light: 0, eek: false, blink: Math.random() * 3,
    seed: Math.random() * 6, tellDur: TKC_TELL, rdir: 1, hop: 0, popX: 0, popY: 0, n: 0 };
}

function tkcResize() {
  var kx, ky, i, m, cr;
  if (!tkc.built) return;
  kx = worldW / Math.max(1, tkc.lastW);
  ky = viewH / Math.max(1, tkc.lastH);
  tkc.ux *= kx; tkc.rearFrom *= kx; tkc.rearTo *= kx;
  tkc.pup.x *= kx; tkc.pup.y *= ky;
  for (i = 0; i < tkc.critters.length; i++) { cr = tkc.critters[i]; cr.x *= kx; cr.trig *= kx; }
  for (i = 0; i < tkc.moths.length; i++) {
    m = tkc.moths[i];
    m.x *= kx; m.y *= ky; m.sx *= kx; m.sy *= ky; m.tx *= kx; m.ty *= ky;
  }
  tkc.gift.x *= kx; tkc.gift.y *= ky; tkc.gift.x0 *= kx; tkc.gift.y0 *= ky;
  tkc.end.cx *= kx; tkc.end.cy *= ky; tkc.end.uy *= ky; tkc.end.ux0 *= kx; tkc.end.pan *= ky;
  tkc.pan *= ky;
  tkc.flyers = [];
  for (i = 0; i < tkc.gates.length; i++) tkc.gates[i].flights = [];
  tkc.lastW = worldW;
  tkc.lastH = viewH;
  tkcSetupProps();
  camX = tkcCamTarget();
  tkc.lights = null;
}

function tkcCamTarget() {
  var g = tkc.gates && tkc.gi >= 0 ? tkc.gates[tkc.gi] : null, t;
  if (g && (tkc.state === 'gate' || g.state === 'opening')) t = g.x() - viewW * 0.82;
  else t = tkc.ux - viewW * 0.28;
  return Math.min(Math.max(t, 0), Math.max(0, worldW - viewW));
}

// ---------- Tökättävät koristeet ----------
function tkcSetupProps() {
  propsReset();
  tkcAddBats(tkcWX(1.1), 0);
  tkcAddBats(tkcWX(3.3), 1);
  tkcAddMushrooms(tkcWX(0.62), 0);
  tkcAddMushrooms(tkcWX(1.72), 1);
  tkcAddMushrooms(tkcWX(4.0), 2);
  tkcAddDrip(tkcWX(0.95));
  tkcAddDrip(tkcWX(2.3));
  tkcAddMole(tkcWX(2.8));
}
// Nukkuvat lepakot katossa: tökkäys = räpytys ja vinkaisu, 3. = sydän
function tkcAddBats(x, seed) {
  var s = viewH * 0.036, y = tkcCeilY(x) + viewH * 0.01;
  propAdd({
    x: x, y: y, r: viewH * 0.09, hy: -viewH * 0.06, color: '#ff9fd0', note: 1175, amp: 0.1, flapT: 0, heartT: 0, seed: seed,
    light: function (p) { return p.heartT > 0 ? { x: p.x, y: p.y + viewH * 0.17, r: viewH * 0.2, a: 0.8, col: '#ff9fd0' } : null; },
    update: function (p, dt) {
      if (p.flapT > 0) p.flapT -= dt;
      if (p.heartT > 0) p.heartT -= dt;
    },
    poke: function (p) {
      p.flapT = 0.9;
      playNote(1760, 0, 0.05, 'square', 0.05);
      playNote(2093, 0.06, 0.06, 'triangle', 0.1);
      playNote(1976, 0.12, 0.07, 'triangle', 0.08);
      if (p.n % 3 === 0) {
        p.heartT = 3;
        playNote(784, 0.2, 0.15, 'triangle', 0.2);
        playNote(988, 0.32, 0.15, 'triangle', 0.2);
        playNote(1175, 0.44, 0.3, 'triangle', 0.2);
        spawnSparkles(p.x, p.y + viewH * 0.17, 14, '#ff9fd0');
        tkcSay('wow', 1.2);
      }
    },
    draw: function (c, p) {
      var i, hx, hy, k, ht = p.heartT, a, bx, by, flap;
      // Sydän: lepakot lentävät sydämen muotoon ja sydän hehkuu keskellä
      k = ht > 0 ? Math.min(1, Math.min(3 - ht, ht) / 0.5) : 0;
      k = easeInOutSine(k);
      if (k > 0) {
        c.globalAlpha = k * 0.85;
        tkcHeartPath(c, 0, viewH * 0.17, viewH * 0.006 * (1 + Math.sin(globalT * 6) * 0.06));
        artFillPath(c, '#ff8fc4', viewH * 0.1, viewH * 0.25, viewH * 0.05, { lineColor: '#d0507e' });
        c.globalAlpha = 1;
      }
      for (i = 0; i < 4; i++) {
        hx = (i - 1.5) * s * 1.3;
        hy = s * (0.3 + (i % 2) * 0.35);
        a = Math.PI * (0.25 + i * 0.5);
        bx = Math.sin(a) * viewH * 0.075;
        by = viewH * 0.17 - (Math.cos(a) * 0.065 - Math.cos(2 * a) * 0.025) * viewH;
        bx = hx + (bx - hx) * k;
        by = hy + (by - hy) * k;
        flap = p.flapT > 0 || k > 0 ? Math.sin(globalT * 26 + i) : -2;
        if (k < 0.05) {
          c.strokeStyle = '#6a5a9a';
          c.lineWidth = Math.max(1, s * 0.06);
          c.beginPath(); c.moveTo(hx, 0); c.lineTo(hx, hy - s * 0.55); c.stroke();
        }
        tkcDrawBat(c, bx, by, s * (i % 2 ? 0.9 : 1), flap, k > 0.05 || p.flapT > 0);
      }
    }
  });
}
// Lepakko: roikkuu ylösalaisin siivet kääreenä (flap < -1) tai levittää siipensä
function tkcDrawBat(c, x, y, s, flap, awake) {
  var i, w;
  c.save();
  c.translate(x, y);
  if (!awake) c.scale(1, -1);
  if (flap > -1.5) {
    w = 0.6 + flap * 0.4;
    for (i = -1; i <= 1; i += 2) {
      c.beginPath();
      c.moveTo(i * s * 0.3, -s * 0.1);
      c.quadraticCurveTo(i * s * 1.0, -s * (0.7 * w + 0.2), i * s * 1.35, -s * 0.2 * w);
      c.quadraticCurveTo(i * s * 1.1, s * 0.1, i * s * 0.95, s * 0.05);
      c.quadraticCurveTo(i * s * 0.75, s * 0.3, i * s * 0.55, s * 0.1);
      c.quadraticCurveTo(i * s * 0.4, s * 0.3, i * s * 0.25, s * 0.15);
      c.closePath();
      artFillPath(c, '#7a68b0', -s * 0.6, s * 0.3, s * 0.5, { lineColor: '#3a2a68' });
    }
  }
  artBlob(c, 0, 0, s * 0.42, s * 0.5, flap > -1.5 ? '#8a78c0' : '#6f5ea8', { lineColor: '#3a2a68', hi: 0.25 });
  // Korvat ja kasvot
  c.beginPath(); c.moveTo(-s * 0.3, -s * 0.3); c.lineTo(-s * 0.22, -s * 0.72); c.lineTo(-s * 0.05, -s * 0.4); c.closePath();
  c.moveTo(s * 0.3, -s * 0.3); c.lineTo(s * 0.22, -s * 0.72); c.lineTo(s * 0.05, -s * 0.4); c.closePath();
  artFillPath(c, '#8a78c0', -s * 0.72, -s * 0.3, s * 0.2, { lineColor: '#3a2a68' });
  if (awake) {
    artEye(c, -s * 0.15, -s * 0.12, s * 0.11, 0, false);
    artEye(c, s * 0.15, -s * 0.12, s * 0.11, 0, false);
  } else {
    c.strokeStyle = '#2a1a48';
    c.lineWidth = Math.max(1, s * 0.07);
    c.lineCap = 'round';
    c.beginPath();
    c.arc(-s * 0.15, -s * 0.14, s * 0.08, 0.15 * Math.PI, 0.85 * Math.PI);
    c.moveTo(s * 0.23, -s * 0.12);
    c.arc(s * 0.15, -s * 0.14, s * 0.08, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
  }
  artBlush(c, -s * 0.26, s * 0.05, s * 0.08);
  artBlush(c, s * 0.26, s * 0.05, s * 0.08);
  c.strokeStyle = '#2a1a48';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.arc(0, s * 0.02, s * 0.1, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
}
function tkcHeartPath(c, x, y, k) {
  var i, t;
  c.beginPath();
  for (i = 0; i <= 40; i++) {
    t = i / 40 * Math.PI * 2;
    c.lineTo(x + 16 * Math.pow(Math.sin(t), 3) * k, y - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k);
  }
  c.closePath();
}
// Hohtosienet: tökkäys pompauttaa ja kirkastaa, 5. = itiösade
function tkcAddMushrooms(x, seed) {
  var s = viewH * 0.04, y = tkcFloorY(x) + viewH * 0.005, cols = ['#7fe0ff', '#ff9fe0', '#b79cff'];
  propAdd({
    x: x, y: y, r: viewH * 0.075, hy: s * 0.9, color: cols[seed % 3], note: 659 + seed * 60, amp: 0.12, boost: 0, floorLight: true,
    bounceT: 0,
    light: function (p) { return { x: p.x, y: p.y - s, r: viewH * 0.13 * (1 + p.boost * 0.5), a: 0.85, col: cols[seed % 3] }; },
    update: function (p, dt) {
      if (p.boost > 0) p.boost = Math.max(0, p.boost - dt * 0.5);
      if (p.bounceT > 0) p.bounceT -= dt;
    },
    poke: function (p) {
      p.boost = 1;
      p.bounceT = 0.5;
      if (p.n % 5 === 0) {
        var i;
        for (i = 0; i < 4; i++) spawnSparkles(p.x + (i - 1.5) * s * 0.6, p.y - s * 1.5, 6, [cols[0], cols[1], cols[2], '#ffffff'][i]);
        for (i = 0; i < 5; i++) playNote(TKC_SCALE[i * 2], i * 0.08, 0.2, 'sine', 0.14);
        tkcSay('wow', 1.2);
      }
    },
    draw: function (c, p) {
      var i, mx, ms, col, b = p.bounceT > 0 ? Math.sin((0.5 - p.bounceT) / 0.5 * Math.PI) * 0.25 : 0;
      artShadow(c, 0, 0, s * 1.4, s * 0.25, 0.25);
      for (i = 0; i < 3; i++) {
        mx = [-0.75, 0.15, 0.85][i] * s;
        ms = [0.7, 1.0, 0.55][i] * s;
        col = artMix(cols[(seed + i) % 3], '#ffffff', p.boost * 0.45);
        c.save();
        c.translate(mx, 0);
        artSquash(c, b * (i === 1 ? 1 : 0.6) * (i % 2 ? 1 : -1));
        artLimb(c, 0, 0, 0, -ms * 1.0, ms * 0.32, '#efe6ff', '#8a78b8');
        c.beginPath();
        c.moveTo(-ms * 0.75, -ms * 0.95);
        c.quadraticCurveTo(-ms * 0.7, -ms * 1.75, 0, -ms * 1.8);
        c.quadraticCurveTo(ms * 0.7, -ms * 1.75, ms * 0.75, -ms * 0.95);
        c.quadraticCurveTo(0, -ms * 0.82, -ms * 0.75, -ms * 0.95);
        c.closePath();
        artFillPath(c, col, -ms * 1.8, -ms * 0.9, ms * 0.6, { lineColor: artShade(cols[(seed + i) % 3], -0.5) });
        artCircle(c, -ms * 0.3, -ms * 1.35, ms * 0.1, '#ffffff', { line: false });
        artCircle(c, ms * 0.28, -ms * 1.5, ms * 0.08, '#ffffff', { line: false });
        artCircle(c, ms * 0.05, -ms * 1.15, ms * 0.07, '#ffffff', { line: false });
        if (i === 1) {
          // Unelias pikkunaama
          c.strokeStyle = '#4a3a70';
          c.lineWidth = Math.max(1, ms * 0.05);
          c.lineCap = 'round';
          c.beginPath();
          c.arc(-ms * 0.1, -ms * 0.62, ms * 0.05, 0.1 * Math.PI, 0.9 * Math.PI);
          c.moveTo(ms * 0.15, -ms * 0.62);
          c.arc(ms * 0.1, -ms * 0.62, ms * 0.05, 0.1 * Math.PI, 0.9 * Math.PI);
          c.stroke();
          artBlush(c, -ms * 0.2, -ms * 0.5, ms * 0.06);
          artBlush(c, ms * 0.2, -ms * 0.5, ms * 0.06);
        }
        c.restore();
      }
    }
  });
}
// Tippukivi: pisara putoaa lammikkoon ja soittaa asteikon seuraavan sävelen
function tkcAddDrip(x) {
  var s = viewH * 0.03, y = tkcCeilY(x) + viewH * 0.005, len = viewH * 0.13;
  propAdd({
    x: x, y: y, r: viewH * 0.08, hy: -len * 0.6, color: '#9fe8ff', note: 880, amp: 0.06, drops: [], idx: 0, dripT: tkcRnd(1, 3),
    update: function (p, dt) {
      var i, d, fy = tkcFloorY(p.x) - p.y + viewH * 0.02;
      p.dripT -= dt;
      if (p.dripT <= 0) { p.dripT = tkcRnd(3, 5); p.drops.push({ y: len, v: 0, quiet: true }); }
      for (i = p.drops.length - 1; i >= 0; i--) {
        d = p.drops[i];
        d.v += viewH * 1.6 * dt;
        d.y += d.v * dt;
        if (d.y >= fy) {
          p.drops.splice(i, 1);
          playNote(TKC_SCALE[p.idx % 8], 0, 0.35, 'sine', d.quiet ? 0.06 : 0.22);
          if (!d.quiet) playNote(TKC_SCALE[p.idx % 8] * 2, 0.02, 0.2, 'sine', 0.06);
          p.idx++;
          artPop(p.x, p.y + fy, viewH * 0.03, '#9fe8ff', 'ring');
          if (!d.quiet) spawnSparkles(p.x, p.y + fy, 4, '#bff4ff');
        }
      }
    },
    poke: function (p) { p.drops.push({ y: len, v: 0, quiet: false }); },
    draw: function (c, p) {
      var i, fy = tkcFloorY(p.x) - p.y + viewH * 0.02, dk = 1 - Math.max(0, p.dripT) / 3;
      // Lammikko lattialla
      artBlob(c, 0, fy, viewH * 0.04, viewH * 0.009, '#5a7ad0', { lineColor: '#2e3a80', line: Math.max(1, viewH * 0.002) });
      artHighlight(c, -viewH * 0.012, fy - viewH * 0.002, viewH * 0.012, viewH * 0.003, 0.5);
      // Tippukivi
      c.beginPath();
      c.moveTo(-s * 0.9, 0);
      c.quadraticCurveTo(-s * 0.5, len * 0.5, -s * 0.08, len);
      c.quadraticCurveTo(0, len + s * 0.15, s * 0.08, len);
      c.quadraticCurveTo(s * 0.5, len * 0.5, s * 0.9, 0);
      c.closePath();
      artFillPath(c, '#8a7cc8', 0, len, s, { lineColor: '#3e2f78' });
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.lineWidth = Math.max(1, s * 0.12);
      c.beginPath(); c.moveTo(-s * 0.4, len * 0.1); c.quadraticCurveTo(-s * 0.25, len * 0.5, -s * 0.05, len * 0.85); c.stroke();
      // Kasvava pisara kärjessä ja putoavat pisarat
      artBlob(c, 0, len + s * 0.15 + dk * s * 0.1, s * 0.12 * (0.4 + dk * 0.6), s * 0.16 * (0.4 + dk * 0.6), '#bff4ff', { lineColor: '#4a8ad0', line: Math.max(1, s * 0.03) });
      for (i = 0; i < p.drops.length; i++) {
        artBlob(c, 0, p.drops[i].y + s * 0.2, s * 0.13, s * 0.19, '#bff4ff', { lineColor: '#4a8ad0', line: Math.max(1, s * 0.03) });
      }
    }
  });
}
// Myyräkaivosmies: lyhty, kypärälamppu ja kaivosvaunu kiskoilla
function tkcAddMole(x) {
  var s = viewH * 0.045, y = tkcFloorY(x) + viewH * 0.01;
  propAdd({
    x: x, y: y, r: viewH * 0.1, hy: s * 1.0, color: '#ffd27a', note: 392, amp: 0.08, waveT: 0, rideT: 0, floorLight: true, blink: 0,
    light: function (p) { return { x: p.x - s * 1.4, y: p.y - s * 2.0, r: viewH * 0.15, a: 0.9, col: '#ffd27a' }; },
    update: function (p, dt) {
      if (p.waveT > 0) p.waveT -= dt;
      if (p.rideT > 0) {
        var was = p.rideT;
        p.rideT -= dt;
        if (Math.floor(was * 3) !== Math.floor(p.rideT * 3) && p.rideT > 0.4) playNote(p.rideT > 1.7 ? 523 : 440, 0, 0.08, 'square', 0.05);
      }
      p.blink += dt;
    },
    poke: function (p) {
      p.waveT = 1.2;
      playNote(523, 0, 0.08, 'triangle', 0.15);
      playNote(659, 0.09, 0.12, 'triangle', 0.15);
      if (p.n % 3 === 0) {
        p.rideT = 3.4;
        playNote(784, 0.2, 0.1, 'triangle', 0.18);
        playNote(1047, 0.3, 0.2, 'triangle', 0.18);
      }
    },
    draw: function (c, p) {
      var i, rk = 0, cx, inCart = p.rideT > 0, wv, mx, my, blink = (p.blink % 3.6) < 0.12;
      if (inCart) rk = Math.sin(Math.min(1, (3.4 - p.rideT) / 3.4) * Math.PI);
      cx = s * 1.6 + rk * s * 3.2;
      // Kiskot
      c.strokeStyle = '#7a6a58';
      c.lineWidth = Math.max(1.5, s * 0.08);
      c.beginPath(); c.moveTo(-s * 0.5, -s * 0.05); c.lineTo(s * 6.5, -s * 0.05); c.stroke();
      for (i = 0; i < 8; i++) artRoundRect(c, -s * 0.3 + i * s * 0.95, -s * 0.12, s * 0.5, s * 0.14, s * 0.04, '#8a6a48', { line: false });
      // Lyhty tolpassa
      artLimb(c, -s * 1.4, 0, -s * 1.4, -s * 2.4, s * 0.12, '#8a6a48', '#4a3020');
      artLimb(c, -s * 1.4, -s * 2.4, -s * 1.1, -s * 2.4, s * 0.1, '#8a6a48', '#4a3020');
      artRoundRect(c, -s * 1.38, -s * 2.3, s * 0.5, s * 0.6, s * 0.1, '#ffe08a', { lineColor: '#8a5a20' });
      artCircle(c, -s * 1.13, -s * 2.0, s * 0.13, '#fff8d0', { line: false });
      // Vaunu ja kristallikuorma
      artShadow(c, cx, 0, s * 1.1, s * 0.2, 0.25);
      for (i = 0; i < 3; i++) tkcPrism(c, cx + (i - 1) * s * 0.4, -s * 0.85, s * 0.3, s * 0.6, TKC_CRY_COLS[i + 1], 0);
      if (inCart) tkcDrawMole(c, cx, -s * 0.75, s, Math.sin(globalT * 14) * 0.6, blink);
      artRoundRect(c, cx - s * 0.85, -s * 1.0, s * 1.7, s * 0.75, s * 0.12, '#a87850', { lineColor: '#5a3a20' });
      c.strokeStyle = 'rgba(90,58,32,0.5)';
      c.lineWidth = Math.max(1, s * 0.05);
      c.beginPath(); c.moveTo(cx - s * 0.8, -s * 0.62); c.lineTo(cx + s * 0.8, -s * 0.62); c.stroke();
      artCircle(c, cx - s * 0.5, -s * 0.18, s * 0.2, '#6a5a6a', { lineColor: '#2a2030' });
      artCircle(c, cx + s * 0.5, -s * 0.18, s * 0.2, '#6a5a6a', { lineColor: '#2a2030' });
      // Myyrä lattialla
      if (!inCart) {
        wv = p.waveT > 0 ? Math.sin(globalT * 16) : 0;
        mx = 0; my = 0;
        artShadow(c, mx, my, s * 0.8, s * 0.18, 0.25);
        tkcDrawMole(c, mx, my, s, wv, blink);
      }
    }
  });
}
function tkcDrawMole(c, x, y, s, wave, blink) {
  c.save();
  c.translate(x, y);
  artBlob(c, 0, -s * 0.6, s * 0.55, s * 0.62, '#8a6a5a', { lineColor: '#3a2820', hi: 0.25 });
  artBlob(c, 0, -s * 0.45, s * 0.32, s * 0.36, '#c8a898', { line: false });
  // Heiluttava käsi
  artLimb(c, s * 0.45, -s * 0.7, s * 0.85, -s * (1.0 + wave * 0.25), s * 0.18, '#8a6a5a', '#3a2820');
  artCircle(c, s * 0.88, -s * (1.05 + wave * 0.25), s * 0.13, '#ffb0c0', { lineColor: '#a05060' });
  artLimb(c, -s * 0.45, -s * 0.6, -s * 0.65, -s * 0.35, s * 0.18, '#8a6a5a', '#3a2820');
  // Pää, kypärä ja lamppu
  artCircle(c, 0, -s * 1.25, s * 0.42, '#8a6a5a', { lineColor: '#3a2820' });
  c.beginPath(); c.arc(0, -s * 1.35, s * 0.46, Math.PI, 0); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.8, -s * 1.35, s * 0.4, { lineColor: '#a8700a' });
  artCircle(c, 0, -s * 1.6, s * 0.12, '#fff8d0', { lineColor: '#a8700a' });
  if (blink) {
    c.strokeStyle = '#222'; c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.moveTo(-s * 0.22, -s * 1.2); c.lineTo(-s * 0.1, -s * 1.2); c.moveTo(s * 0.1, -s * 1.2); c.lineTo(s * 0.22, -s * 1.2); c.stroke();
  } else {
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-s * 0.16, -s * 1.2, s * 0.05, 0, Math.PI * 2); c.arc(s * 0.16, -s * 1.2, s * 0.05, 0, Math.PI * 2); c.fill();
  }
  artCircle(c, 0, -s * 1.08, s * 0.1, '#ff8fae', { lineColor: '#a04a6a' });
  artBlush(c, -s * 0.25, -s * 1.05, s * 0.08);
  artBlush(c, s * 0.25, -s * 1.05, s * 0.08);
  c.restore();
}

// ---------- Syöte ----------
function tkcTap(px, py) {
  var wx = px + camX, p = tkc.pup, g, ci, b, d, us = trekUS(), x, y;
  if (!tkc.built) return;
  tkc.idleT = 0;
  tkc.grab = 'none';
  tkc.downT = 0;
  tkc.downMove = 0;
  if (tkc.state === 'grow' || tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done') {
    d = Math.hypot(wx - p.x, py - p.y);
    if (d < tkcPupR() * 1.3) { trekPupSound('giggle'); p.wig = 0.6; }
    return;
  }
  // 1. Numerokristalli (ei koskaan raahaa Pikkupilveä)
  g = tkc.state === 'gate' && tkc.gi >= 0 ? tkc.gates[tkc.gi] : null;
  if (g && g.state === 'puzzle') {
    ci = tkcHitNum(g, wx, py);
    if (ci >= 0) { tkcToggle(g, ci); g.idle = 0; return; }
  }
  // 2. Pikkupilvi, piilopupu (vain valossa) tai koriste: lähin voittaa;
  // suoraan Pikkupilveen osunut napautus tarttuu aina siihen
  d = Math.hypot(wx - p.x, py - p.y);
  b = tkcBunnyPos();
  b.d = !trekBunnyFoundNow() && tkcLitAmount(b.x, b.y) > 0.25 ? Math.hypot(wx - b.x, py - b.y) : 1e9;
  ci = tkcPropDist(wx, py);
  if (d > tkcPupR() * 1.1) {
    if (b.d < viewH * 0.075 && b.d < d) {
      trekBunnyFound(b.x - camX, b.y);
      tkcSay('wow', 1.4);
      return;
    }
    if (ci < d && propsTap(wx, py)) return;
  }
  if (d < tkcPupR() * 1.9) {
    tkc.grab = 'pup';
    tkc.offX = p.x - wx;
    tkc.offY = p.y - py;
    return;
  }
  if (ci < 1e9 && propsTap(wx, py)) return;
  // 3. Yksisarvinen hirnahtaa iloisesti
  x = tkc.ux; y = tkcFloorY(x);
  if (Math.abs(wx - x) < us * 45 && py > y - us * 110 && py < y + us * 4) {
    if (tkc.happyNeighT <= 0) {
      tkc.happyNeighT = 1;
      playNote(660, 0, 0.12, 'triangle', 0.2);
      playNote(880, 0.1, 0.12, 'triangle', 0.2);
      playNote(740, 0.2, 0.2, 'triangle', 0.18);
      spawnSparkles(x + us * 46, y - us * 114, 6, '#ffe27a');
    }
    return;
  }
  // 4. Muualle: Pikkupilvi lentää sormen luo (vähän sormen yläpuolelle)
  tkc.grab = 'fly';
  tkc.offX = 0;
  tkc.offY = -viewH * 0.05;
}

// Lähimmän osutun koristeen etäisyys (1e9 = ei osumaa)
function tkcPropDist(wx, wy) {
  var i, d, best = 1e9;
  for (i = 0; i < props.length; i++) {
    d = Math.hypot(wx - props[i].x, wy - propHitY(props[i]));
    if (d < props[i].r && d < best) best = d;
  }
  return best;
}

// ---------- Päivitys ----------
function tkcUpdate(dt) {
  updateParticles(dt);
  propsUpdate(dt);
  updateConfetti(dt);
  if (!tkc.built) return;
  tkc.t += dt;
  tkc.stT += dt;
  tkc.idleT += dt;
  if (tkc.moodT > 0) tkc.moodT -= dt;
  if (tkc.hudBump > 0) tkc.hudBump -= dt;
  if (tkc.happyNeighT > 0) tkc.happyNeighT -= dt;
  tkcUpdatePup(dt);
  tkc.lights = tkcCollectLights();
  if (tkc.state === 'intro') tkcUpdateIntro(dt);
  else if (tkc.state === 'walk') tkcUpdateWalk(dt);
  else if (tkc.state === 'gate') tkcUpdateGateState(dt);
  else tkcUpdateEnding(dt);
  if (tkc.rearT > 0 && tkc.state !== 'walk') tkcUpdateRear(dt);
  tkcUpdateGates(dt);
  tkcUpdateCrystals(dt);
  tkcUpdateCritters(dt);
  tkcUpdateMoths(dt);
  tkcUpdateGift(dt);
  tkcUpdateFlyers(dt);
  camX += (tkcCamFollow() - camX) * Math.min(1, dt * 4);
}
// Kamera ei peruuta turhaan (portilta lähtiessä), paitsi takaiskussa
function tkcCamFollow() {
  var t = tkcCamTarget();
  if (tkc.state === 'walk' && t < camX && tkc.rearT <= 0 && tkc.ux - camX > viewW * 0.14) t = camX;
  return t;
}

// Pikkupilvi seuraa sormea; irti ollessaan se leijuu paikallaan ruudun sisällä
function tkcUpdatePup(dt) {
  var p = tkc.pup, tx, ty, k, ox = p.x, oy = p.y, hold = holding && (tkc.grab === 'pup' || tkc.grab === 'fly');
  var free = tkc.state !== 'grow' && tkc.state !== 'board' && tkc.state !== 'rise' && tkc.state !== 'done';
  if (holding) {
    tkc.downT += dt;
    tkc.idleT = 0;
  }
  if (hold && free) {
    tx = lastPX + camX + tkc.offX;
    ty = lastPY + tkc.offY;
    ty = Math.min(Math.max(ty, viewH * 0.15), tkcFloorY(tx) - viewH * 0.04);
    tx = Math.min(Math.max(tx, camX + viewW * 0.03), camX + viewW * 0.97);
    k = 1 - Math.exp(-dt * (tkc.grab === 'pup' ? 18 : 10));
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    if (Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.5) tkc.everDragged = true;
  } else if (free) {
    // Pysyy ruudulla, vaikka kamera liikkuu
    tx = Math.min(Math.max(p.x, camX + viewW * 0.06), camX + viewW * 0.94);
    p.x += (tx - p.x) * Math.min(1, dt * 3);
  }
  tkc.downMove += Math.abs(p.x - ox) + Math.abs(p.y - oy);
  // Irrotus: lyhyt napautus Pikkupilveen = kikatus ja heilahdus
  if (tkc.wasHolding && !holding) {
    if (tkc.grab === 'pup' && tkc.downT < 0.35 && tkc.downMove < viewH * 0.03 && free) {
      p.wig = 0.6;
      trekPupSound('giggle');
      spawnSparkles(p.x, p.y, 8, '#fff3b8');
    }
    tkc.grab = 'none';
  }
  tkc.wasHolding = holding;
  p.vx = dt > 0 ? (p.x - ox) / dt : 0;
  if (p.wig > 0) p.wig -= dt;
}

function tkcUpdateIntro(dt) {
  var p = tkc.pup;
  // Alkukortin jälkeen: Pikkupilvi huomaa hohtavansa
  if (!p.glowed && tkc.stT > 2.1) {
    p.glowed = true;
    tkcSay('wow', 1.6);
    trekPupSound('wow');
    artPop(p.x, p.y, viewH * 0.12, '#fff3b8', 'burst');
    artPop(p.x, p.y, viewH * 0.08, '#ffffff', 'ring');
    spawnSparkles(p.x, p.y, 18, '#fff3b8');
  }
  if (p.glowed) p.glow = Math.min(1, p.glow + dt * 1.1);
  if (tkc.stT > 3.3) { tkc.state = 'walk'; tkc.stT = 0; }
}

// Valaiseeko jokin polun yksisarvisen edestä?
function tkcPathLit() {
  var p = tkc.pup, dx = p.x - tkc.ux, ax, ay;
  if (p.glow > 0.8 && dx > -viewW * 0.04 && dx < viewW * TKC_LEAD && p.y > viewH * TKC_PUP_MIN_Y) return true;
  ax = tkc.ux + viewW * 0.12;
  ay = tkcFloorY(ax) - viewH * 0.06;
  return tkcInStatic(ax, ay, 0.75);
}
function tkcUpdateRear(dt) {
  var k;
  tkc.rearT -= dt;
  k = easeOutCubic(1 - Math.max(0, tkc.rearT) / TKC_REAR_T);
  tkc.ux = tkc.rearFrom + (tkc.rearTo - tkc.rearFrom) * k;
  tkc.v = 0;
}
function tkcUpdateWalk(dt) {
  var stop = tkcNextStop(), lit, want, g, p = tkc.pup;
  tkc.moving = false;
  if (tkc.neighT > 0) tkc.neighT -= dt;
  if (tkc.rearT > 0) { tkcUpdateRear(dt); return; }
  lit = tkcPathLit();
  want = lit && tkc.ux < stop ? viewW * TKC_SPEED : 0;
  tkc.v += (want - tkc.v) * Math.min(1, dt * 6);
  if (tkc.ux < stop && tkc.v > 1) {
    tkc.ux = Math.min(stop, tkc.ux + tkc.v * dt);
    tkc.moving = tkc.v > viewW * TKC_SPEED * 0.15;
    tkc.walkPhase += dt * 9 * tkc.v / (viewW * TKC_SPEED);
  }
  if (!lit && tkc.ux < stop - 1) {
    tkc.darkT += dt;
    // Valo karkasi liian kauas: hermostunut hirnahdus
    if (p.x - tkc.ux > viewW * TKC_LEAD && tkc.neighT <= 0 && tkc.darkT > 0.4) {
      tkc.neighT = 2.6;
      playNote(740, 0, 0.07, 'triangle', 0.16);
      playNote(698, 0.07, 0.07, 'triangle', 0.16);
      playNote(740, 0.14, 0.07, 'triangle', 0.16);
      playNote(622, 0.21, 0.22, 'triangle', 0.14);
    }
  } else tkc.darkT = 0;
  // Perillä: numero-ovi tai auringonsäde
  if (tkc.ux >= stop - 0.5) {
    g = tkcNextGate();
    tkc.v = 0;
    tkc.darkT = 0;
    if (g) {
      tkc.state = 'gate';
      tkc.gi = g.idx;
      g.state = 'wake';
      g.t = 0;
      g.idle = 0;
      playNote(196, 0, 0.5, 'sine', 0.2);
      playNote(294, 0.15, 0.5, 'sine', 0.16);
      playNote(392, 0.3, 0.6, 'triangle', 0.14);
    } else {
      tkc.state = 'sun';
      tkc.stT = 0;
      tkcSay('wow', 1.5);
      trekPupSound('wow');
    }
  }
}
function tkcUpdateGateState(dt) {
  var g = tkc.gates[tkc.gi];
  tkc.moving = false;
  if (g.state === 'open') { tkc.state = 'walk'; tkc.stT = 0; }
}

// ---------- Numero-ovet ----------
function tkcUpdateGates(dt) {
  var i, g, j, f, cr, sum, any;
  for (i = 0; i < tkc.gates.length; i++) {
    g = tkc.gates[i];
    g.t += dt;
    for (j = 0; j < g.crys.length; j++) {
      cr = g.crys[j];
      if (cr.pop > 0) cr.pop -= dt;
      if (cr.flick > 0) {
        cr.flick -= dt;
        if (cr.flick <= 0) { cr.flick = 0; cr.lit = false; }
      }
    }
    if (g.state === 'wake') {
      for (j = 0; j < g.crys.length; j++) {
        if (g.t - dt < 0.25 + j * 0.12 && g.t >= 0.25 + j * 0.12) {
          g.crys[j].pop = 0.35;
          playNote(TKC_SCALE[g.crys[j].v + 2], 0, 0.15, 'sine', 0.14);
        }
      }
      if (g.t > 0.9 + g.crys.length * 0.12) { g.state = 'puzzle'; g.t = 0; }
    } else if (g.state === 'puzzle') {
      g.idle += dt;
      // Pisteet lentävät oven koloihin
      for (j = g.flights.length - 1; j >= 0; j--) {
        f = g.flights[j];
        f.t += dt;
        if (f.t >= f.dur) {
          g.flights.splice(j, 1);
          if (!f.back) {
            var sp = tkcSocketPos(g, f.sock);
            playNote(TKC_SCALE[Math.min(9, f.sock)], 0, 0.12, 'triangle', 0.14);
            spawnSparkles(sp.x, sp.y, 3, f.col);
          }
        }
      }
      any = false;
      for (j = 0; j < g.flights.length; j++) if (!g.flights[j].back) any = true;
      if (g.over) {
        any = false;
        for (j = 0; j < g.crys.length; j++) if (g.crys[j].flick > 0) any = true;
        if (!any) { g.over = false; g.order = []; g.evalT = 0; }
        continue;
      }
      if (any) { g.evalT = 0; continue; }
      g.evalT += dt;
      if (g.evalT < 0.35) continue;
      sum = tkcGateSum(g);
      if (sum === g.target && g.order.length) tkcGateSolve(g);
      else if (sum > g.target) tkcGateOver(g);
      g.evalT = -99;
    } else if (g.state === 'opening') {
      g.openK = easeInOutSine(Math.min(1, g.t / 1.4));
      if (Math.random() < dt * 20) spawnDust(g.x() + tkcRnd(-1, 1) * viewH * 0.12, tkcFloorY(g.x()) - viewH * 0.01, 1, 0);
      if (g.t >= 1.4) {
        g.state = 'open';
        g.openK = 1;
        g.t = 0;
        playNote(784, 0, 0.15, 'triangle', 0.22);
        playNote(1047, 0.12, 0.3, 'triangle', 0.22);
        if (g.idx === tkc.gates.length - 1) tkcGiftEmerge(g);
      }
    }
  }
}
function tkcGateSum(g) {
  var s = 0, j;
  for (j = 0; j < g.crys.length; j++) if (g.crys[j].lit && g.crys[j].flick <= 0) s += g.crys[j].v;
  return s;
}
function tkcToggle(g, ci) {
  var cr = g.crys[ci], base, j, cp = tkcNumPos(g, ci), col = TKC_NUM_COLS[cr.v], k;
  if (g.over || cr.flick > 0) return;
  g.evalT = 0;
  if (!cr.lit) {
    base = tkcGateSum(g);
    cr.lit = true;
    cr.pop = 0.35;
    g.order.push(ci);
    for (j = 0; j < cr.v; j++) g.flights.push({ ci: ci, sock: base + j, t: -j * 0.08, dur: 0.5, col: col, back: false });
    playNote(TKC_SCALE[cr.v + 1], 0, 0.18, 'triangle', 0.22);
    playNote(TKC_SCALE[cr.v + 3], 0.06, 0.22, 'sine', 0.14);
    artPop(cp.x, cp.y - viewH * 0.06, viewH * 0.06, col, 'ring');
    spawnSparkles(cp.x, cp.y - viewH * 0.07, 6, col);
  } else {
    cr.lit = false;
    cr.pop = 0.25;
    k = g.order.indexOf(ci);
    if (k >= 0) g.order.splice(k, 1);
    // Lennossa olevat pisteet laskeutuvat heti, sammutetun pisteet palaavat kristalliin
    for (j = g.flights.length - 1; j >= 0; j--) if (!g.flights[j].back) g.flights.splice(j, 1);
    for (j = 0; j < cr.v; j++) g.flights.push({ ci: ci, sock: j, t: -j * 0.05, dur: 0.4, col: col, back: true });
    playNote(TKC_SCALE[cr.v + 1], 0, 0.12, 'sine', 0.14);
    playNote(TKC_SCALE[cr.v], 0.07, 0.16, 'sine', 0.12);
  }
}
function tkcGateSolve(g) {
  var dx = g.x(), dy = tkcFloorY(dx) - viewH * 0.25;
  g.state = 'opening';
  g.t = 0;
  tkcSay('wow', 1.8);
  trekPupSound('yay');
  artShakeStart(viewH * 0.008, 1.3);
  artPop(dx, dy, viewH * 0.18, '#bff6ff', 'burst');
  spawnSparkles(dx, dy, 22, '#bff6ff');
  spawnSparkles(dx, dy, 10, '#ffe27a');
  playNote(65, 0, 1.2, 'sawtooth', 0.06);
  playNote(82, 0.1, 1.1, 'sawtooth', 0.05);
  playNote(523, 0.25, 0.3, 'triangle', 0.2);
  playNote(659, 0.37, 0.3, 'triangle', 0.2);
  playNote(784, 0.49, 0.3, 'triangle', 0.2);
  playNote(1047, 0.61, 0.5, 'triangle', 0.22);
}
function tkcGateOver(g) {
  var j;
  g.over = true;
  tkc.gateTries++;
  for (j = 0; j < g.crys.length; j++) if (g.crys[j].lit) g.crys[j].flick = 0.9;
  tkcSay('sad', 0.8);
  trekPupSound('hmm');
  playNote(262, 0.15, 0.25, 'sine', 0.12);
  playNote(247, 0.35, 0.35, 'sine', 0.1);
}
// Numerokristallien paikat: yksisarvisen pään ja oven välissä kahdessa rivissä
function tkcNumPos(g, i) {
  var x0 = g.x() - viewW * 0.82, a = x0 + viewW * 0.2 + viewH * 0.15, b = g.x() - viewH * 0.2, n = g.crys.length;
  var x = a + (b - a) * (i + 0.5) / n;
  return { x: x, y: tkcFloorY(x) + viewH * (i % 2 ? 0.075 : -0.005) };
}
function tkcHitNum(g, wx, wy) {
  var i, p, d, best = -1, bd = viewH * 0.085;
  for (i = 0; i < g.crys.length; i++) {
    p = tkcNumPos(g, i);
    d = Math.hypot(wx - p.x, wy - (p.y - viewH * 0.055));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
// Oven kolo i: kymppiruudukko (5 / rivi); liian monet pisteet omalle rivilleen alle
function tkcSocketPos(g, i) {
  var x = g.x(), top = tkcFloorY(x) - viewH * 0.44, T = g.target, rows = Math.ceil(T / 5), row, col, inRow, sp = viewH * 0.045;
  if (i < T) {
    row = Math.floor(i / 5); col = i % 5;
    inRow = Math.min(5, T - row * 5);
  } else {
    row = rows + Math.floor((i - T) / 5); col = (i - T) % 5;
    inRow = 5;
  }
  return { x: x + (col - (inRow - 1) / 2) * sp, y: top + viewH * 0.2 + row * viewH * 0.055 };
}
// Vihje: seuraava kristalli jostakin ratkaisusta, joka sisältää jo sytytetyt
function tkcGateHint(g) {
  var lit = 0, i, j, s;
  for (i = 0; i < g.crys.length; i++) if (g.crys[i].lit) lit |= 1 << i;
  for (j = 0; j < g.sols.length; j++) {
    s = g.sols[j];
    if ((s & lit) === lit) {
      for (i = 0; i < g.crys.length; i++) if ((s & (1 << i)) && !(lit & (1 << i))) return i;
    }
  }
  for (i = g.crys.length - 1; i >= 0; i--) if (lit & (1 << i)) return i;
  return 0;
}

// ---------- Seinäkristallit ----------
function tkcCryPos(cr) { return { x: tkcWX(cr.u), y: cr.yf * viewH }; }
function tkcUpdateCrystals(dt) {
  var i, cr, cp, p = tkc.pup, d;
  for (i = 0; i < tkc.crystals.length; i++) {
    cr = tkc.crystals[i];
    if (cr.lit) { cr.litT += dt; continue; }
    cp = tkcCryPos(cr);
    d = Math.hypot(p.x - cp.x, p.y - cp.y);
    if (p.glow > 0.8 && d < viewH * TKC_HOVER_R) {
      if (cr.charge === 0) playNote(TKC_SCALE[tkc.got % 10], 0, 0.08, 'sine', 0.06);
      cr.charge += dt;
    } else cr.charge = Math.max(0, cr.charge - dt * 0.6);
    if (cr.charge >= TKC_HOVER) {
      cr.lit = true;
      cr.litT = 0;
      tkc.flyers.push({ x0: cp.x - camX, y0: cp.y, idx: tkc.got, t: 0, dur: 0.7, col: cr.col });
      tkc.got++;
      playNote(TKC_SCALE[(tkc.got - 1) % 10], 0, 0.4, 'triangle', 0.22);
      playNote(TKC_SCALE[(tkc.got - 1) % 10] * 1.5, 0.08, 0.5, 'sine', 0.12);
      playNote(TKC_SCALE[(tkc.got - 1) % 10] * 2, 0.16, 0.6, 'sine', 0.08);
      artPop(cp.x, cp.y, viewH * 0.08, cr.col, 'burst');
      artPop(cp.x, cp.y, viewH * 0.06, '#ffffff', 'ring');
      spawnSparkles(cp.x, cp.y, 12, cr.col);
      tkcSay('wow', 1.0);
    }
  }
}
function tkcUpdateFlyers(dt) {
  var i, f;
  for (i = tkc.flyers.length - 1; i >= 0; i--) {
    f = tkc.flyers[i];
    f.t += dt;
    if (f.t >= f.dur) { tkc.flyers.splice(i, 1); tkc.hudBump = 0.4; }
  }
}

// ---------- Valot ----------
// Kaikki valonlähteet maailmakoordinaateissa: { x, y, r, a, col, kind }
function tkcCollectLights() {
  var L = [], p = tkc.pup, i, cr, cp, g, gx, gy, pr, l, m, us = trekUS(), sx = tkcSunX(), ux = tkc.ux, uy;
  var vis = function (x, r) { return x + r > camX - viewW * 0.3 && x - r < camX + viewW * 1.3; };
  if (p.glow > 0) L.push({ x: p.x, y: p.y, r: tkcLightR() * (tkc.state === 'grow' || tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done' ? p.scale * 0.6 + 0.4 : 1), a: 1, col: '#fff3b8', kind: 'pup' });
  uy = tkcFloorY(ux);
  L.push({ x: ux + us * 46, y: uy - us * 100, r: viewH * 0.13, a: 0.55, col: '#fff3b8', kind: 'horn' });
  L.push({ x: -viewW * 0.02, y: viewH * 0.5, r: viewH * 0.8, a: 1, col: '#fff6d0', kind: 'static' });
  for (i = 0; i < tkc.crystals.length; i++) {
    cr = tkc.crystals[i];
    cp = tkcCryPos(cr);
    if (!vis(cp.x, viewH * 0.2)) continue;
    if (cr.lit) L.push({ x: cp.x, y: cp.y, r: viewH * 0.17 * Math.min(1, 0.4 + cr.litT * 2), a: 0.95, col: cr.col, kind: 'static' });
    else if (cr.charge > 0) L.push({ x: cp.x, y: cp.y, r: viewH * 0.1 * cr.charge / TKC_HOVER, a: 0.6, col: cr.col, kind: 'glim' });
  }
  for (i = 0; i < tkc.worms.length; i++) {
    m = tkc.worms[i];
    gx = tkcWX(m.u);
    if (!vis(gx, viewH * 0.15)) continue;
    L.push({ x: gx, y: tkcCeilY(gx) + viewH * m.len * 0.7, r: viewH * 0.11, a: 0.55, col: '#b8fff0', kind: 'static' });
  }
  for (i = 0; i < props.length; i++) {
    if (!props[i].light || !vis(props[i].x, viewH * 0.3)) continue;
    l = props[i].light(props[i]);
    if (l) { l.kind = 'static'; L.push(l); }
  }
  for (i = 0; i < tkc.moths.length; i++) {
    m = tkc.moths[i];
    if (!vis(m.x, viewH * 0.15)) continue;
    L.push({ x: m.x, y: m.y, r: viewH * 0.11 * Math.min(1, m.t * 1.5), a: 0.85, col: '#fff2b0', kind: 'static' });
  }
  for (i = 0; i < tkc.gates.length; i++) {
    g = tkc.gates[i];
    gx = g.x();
    if (!vis(gx, viewH * 0.8)) continue;
    gy = tkcFloorY(gx);
    if (g.state === 'sleep') {
      // Nukkuvan oven riimut hehkuvat himmeästi: maamerkki kaukaa
      L.push({ x: gx, y: gy - viewH * 0.26, r: viewH * 0.17, a: 0.65, col: '#9fe8ff', kind: 'gatefar' });
    } else if (g.state === 'open') {
      // Avattu ovi: kaari hehkuu, kristallialue hiipuu
      pr = Math.max(0, 1 - g.t / 1.5);
      if (pr > 0) {
        cp = tkcNumPos(g, Math.floor(g.crys.length / 2));
        L.push({ x: (cp.x + gx) / 2 - viewH * 0.1, y: gy - viewH * 0.1, r: viewH * 0.5 * pr, a: 1, col: '#9fe8ff', kind: 'static' });
      }
      L.push({ x: gx, y: gy - viewH * 0.3, r: viewH * (0.32 - 0.12 * (1 - pr)), a: 0.9, col: '#bff6ff', kind: 'static' });
    } else {
      pr = g.state === 'wake' ? Math.min(1, g.t / 0.6) : 1;
      cp = tkcNumPos(g, Math.floor(g.crys.length / 2));
      L.push({ x: (cp.x + gx) / 2 - viewH * 0.1, y: gy - viewH * 0.1, r: viewH * 0.5 * pr, a: 1, col: '#9fe8ff', kind: 'static' });
      L.push({ x: gx, y: gy - viewH * 0.28, r: viewH * 0.32 * pr, a: 1, col: '#bff6ff', kind: 'static' });
    }
  }
  // Auringonsäde
  if (vis(sx, viewH * 0.4)) {
    L.push({ x: sx, y: viewH * 0.15, r: viewH * 0.24, a: 1, col: '#fff2b0', kind: 'static' });
    L.push({ x: sx, y: viewH * 0.45, r: viewH * 0.27, a: 1, col: '#fff2b0', kind: 'static' });
    L.push({ x: sx, y: tkcFloorY(sx) - viewH * 0.08, r: viewH * 0.32, a: 1, col: '#fff2b0', kind: 'static' });
  }
  if (tkc.gift.state === 'held' || tkc.gift.state === 'fly' || tkc.gift.state === 'emerge') {
    L.push({ x: tkc.gift.x, y: tkc.gift.y, r: viewH * 0.12, a: 0.8, col: '#b49cff', kind: 'static' });
  }
  return L;
}
// Onko piste muiden kuin Pikkupilven valossa (f = säteen osuus)
function tkcInStatic(x, y, f) {
  var L = tkc.lights || [], i, l;
  for (i = 0; i < L.length; i++) {
    l = L[i];
    if (l.kind !== 'static') continue;
    if (Math.hypot(x - l.x, y - l.y) < l.r * f) return true;
  }
  return false;
}
// Valon määrä pisteessä 0..1 (piilopupu)
function tkcLitAmount(x, y) {
  var L = tkc.lights || [], i, l, best = 0, d;
  for (i = 0; i < L.length; i++) {
    l = L[i];
    if (l.kind === 'horn' || l.kind === 'gatefar') continue;
    d = Math.hypot(x - l.x, y - l.y) / l.r;
    if (d < 1) best = Math.max(best, (1 - d) * l.a * 1.6);
  }
  return Math.min(1, best);
}
function tkcPupLit(x, y) {
  var p = tkc.pup;
  return p.glow > 0.8 && Math.hypot(x - p.x, y - p.y) < tkcLightR() * 0.85;
}

// ---------- Varjomöröt ----------
function tkcCritterY(cr) { return tkcFloorY(cr.x) - viewH * 0.035; }
function tkcUpdateCritters(dt) {
  var i, cr, d, dir, nx, k, walk = tkc.state === 'walk', ux = tkc.ux, vw = viewW, y, us = trekUS();
  for (i = 0; i < tkc.critters.length; i++) {
    cr = tkc.critters[i];
    cr.t += dt;
    cr.blink += dt;
    if (cr.state === 'gone') continue;
    if (cr.state === 'pop') {
      if (cr.t >= 0.45) { tkcSpawnMoth(cr.x, tkcCritterY(cr)); cr.state = 'gone'; }
      continue;
    }
    if (cr.state === 'wait') {
      if (!walk) continue;
      if (cr.side > 0 && cr.x - ux < vw * 0.8) { cr.state = 'hide'; cr.t = -tkcRnd(0.2, 1); }
      else if (cr.side < 0 && ux >= cr.trig) {
        cr.x = Math.max(camX + vw * 0.03, ux - vw * 0.3);
        cr.state = 'tell';
        cr.t = 0;
        cr.tellDur = 1.4;
        tkcCritterCue();
      }
      continue;
    }
    y = tkcCritterY(cr);
    // Pikkupilven valo: mörkö jähmettyy ja muuttuu koiperhoseksi
    if (cr.state !== 'retreat' && tkcPupLit(cr.x, y - viewH * 0.01)) {
      if (!cr.eek) { cr.eek = true; playNote(1568, 0, 0.05, 'square', 0.04); playNote(1760, 0.06, 0.05, 'square', 0.04); }
      cr.light += dt;
      if (cr.light >= TKC_ZAP) tkcZap(cr);
      continue;
    }
    cr.eek = false;
    cr.light = Math.max(0, cr.light - dt * 0.8);
    d = ux + us * 5 - cr.x;
    dir = d > 0 ? 1 : -1;
    if (cr.state === 'retreat') {
      cr.x += cr.rdir * vw * 0.24 * dt;
      cr.hop += dt * 12;
      if (cr.t > 1.3) { cr.state = 'hide'; cr.t = -TKC_COOLDOWN; }
      continue;
    }
    if (!walk) {
      if (cr.state === 'creep' || cr.state === 'tell') { cr.state = 'hide'; cr.t = -1; }
      continue;
    }
    // Kosketus: yksisarvinen säikähtää
    if (Math.abs(d) < us * 48 && tkc.rearT <= 0) { tkcScare(cr); continue; }
    if (cr.state === 'hide') {
      // Takaa tulevat seuraavat huomaamatta ruudun reunalle
      if (cr.side < 0 && cr.x < camX + vw * 0.03) cr.x = Math.min(ux - vw * 0.2, camX + vw * 0.03);
      if (cr.t > 0 && Math.abs(d) < vw * TKC_SENSE) {
        cr.state = 'tell';
        cr.t = 0;
        cr.tellDur = cr.side < 0 ? 1.1 : TKC_TELL;
        if (cr.x > camX && cr.x < camX + vw) tkcCritterCue();
      }
    } else if (cr.state === 'tell') {
      if (cr.t >= cr.tellDur) { cr.state = 'creep'; cr.t = 0; }
    } else if (cr.state === 'creep') {
      k = Math.min(1, Math.max(0, cr.x / tkcEndStop()));
      nx = cr.x + dir * vw * (TKC_CREEP[0] + (TKC_CREEP[1] - TKC_CREEP[0]) * k) * dt;
      // Muihin valoihin mörkö ei astu: se odottaa valon reunalla
      if (!tkcInStatic(nx + dir * viewH * 0.02, y, 0.6)) { cr.x = nx; cr.hop += dt * 10; }
    }
  }
}
// Silmät räpsyvät: hiljainen kikatus kertoo, että mörkö lähtee liikkeelle
function tkcCritterCue() {
  playNote(330, 0, 0.07, 'triangle', 0.07);
  playNote(294, 0.09, 0.07, 'triangle', 0.07);
  playNote(330, 0.18, 0.09, 'triangle', 0.06);
}
function tkcZap(cr) {
  var y = tkcCritterY(cr);
  cr.state = 'pop';
  cr.t = 0;
  tkc.zaps++;
  playNote(1760, 0, 0.06, 'square', 0.05);
  playNote(2093, 0.06, 0.08, 'triangle', 0.12);
  playNote(1047, 0.2, 0.15, 'triangle', 0.16);
  playNote(1319, 0.3, 0.15, 'triangle', 0.16);
  playNote(1568, 0.4, 0.3, 'triangle', 0.16);
  artPop(cr.x, y, viewH * 0.06, '#fff2b0', 'ring');
  spawnSparkles(cr.x, y, 10, '#fff2b0');
  tkcSay('wow', 1.0);
}
function tkcScare(cr) {
  var dirC = cr.x > tkc.ux ? 1 : -1, to, lo = tkcStartX() - viewW * 0.1, hi = tkcNextStop();
  tkc.scares++;
  to = tkc.ux - dirC * viewW * TKC_KNOCK;
  to = Math.max(lo, Math.min(hi, to));
  tkc.rearFrom = tkc.ux;
  tkc.rearTo = to;
  tkc.rearT = TKC_REAR_T;
  tkc.v = 0;
  cr.state = 'retreat';
  cr.t = 0;
  cr.rdir = dirC;
  cr.n++;
  tkcSay('scared', 1.5);
  trekPupSound('scared');
  // Hirnahdus ja mörön kikatus
  playNote(880, 0, 0.1, 'triangle', 0.18);
  playNote(1047, 0.08, 0.14, 'triangle', 0.16);
  playNote(392, 0.25, 0.06, 'square', 0.05);
  playNote(440, 0.32, 0.06, 'square', 0.05);
  playNote(392, 0.39, 0.06, 'square', 0.05);
  playNote(440, 0.46, 0.08, 'square', 0.05);
  artShakeStart(viewH * 0.005, 0.3);
  spawnSparkles(tkc.ux, tkcFloorY(tkc.ux) - viewH * 0.12, 6, '#b8a8e8');
}
function tkcSpawnMoth(x, y) {
  var tx = x + tkcRnd(-0.08, 0.08) * viewW;
  tkc.moths.push({ x: x, y: y, sx: x, sy: y, tx: tx, ty: tkcCeilY(tx) + viewH * tkcRnd(0.07, 0.18), t: 0, ph: Math.random() * 6 });
  playNote(1319, 0, 0.2, 'sine', 0.1);
  playNote(1760, 0.1, 0.3, 'sine', 0.08);
}
function tkcUpdateMoths(dt) {
  var i, m, k;
  for (i = 0; i < tkc.moths.length; i++) {
    m = tkc.moths[i];
    m.t += dt;
    k = easeInOutSine(Math.min(1, m.t / 1.8));
    m.x = m.sx + (m.tx - m.sx) * k + Math.sin(m.t * 5 + m.ph) * viewH * 0.02 * (1 - k * 0.5);
    m.y = m.sy + (m.ty - m.sy) * k + Math.sin(m.t * 3.1 + m.ph) * viewH * 0.012;
  }
}

// ---------- Lahja: laulava kristalli ----------
function tkcGiftEmerge(g) {
  var x = g.x();
  tkc.gift = { state: 'emerge', t: 0, x: x, y: tkcFloorY(x) - viewH * 0.22, x0: x, y0: tkcFloorY(x) - viewH * 0.22 };
  tkcSay('wow', 2);
  trekPupSound('wow');
}
function tkcGiftHome() {
  var us = trekUS(), x = tkc.ux, y = tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done' ? tkc.end.uy : tkcFloorY(x);
  return { x: x - us * 30, y: y - us * 104 + Math.sin(globalT * 2.4) * us * 3 };
}
function tkcUpdateGift(dt) {
  var gf = tkc.gift, h, k, i;
  if (gf.state === 'none') return;
  gf.t += dt;
  if (gf.state === 'emerge') {
    // Kristalli laulaa oven aukossa
    for (i = 0; i < 4; i++) if (gf.t - dt < 0.3 + i * 0.22 && gf.t >= 0.3 + i * 0.22) playNote([784, 988, 1175, 1568][i], 0, 0.5, 'sine', 0.16);
    gf.y = gf.y0 - Math.sin(Math.min(1, gf.t / 1.2) * Math.PI * 0.5) * viewH * 0.06;
    if (gf.t > 1.4) { gf.state = 'fly'; gf.t = 0; gf.x0 = gf.x; gf.y0 = gf.y; }
  } else if (gf.state === 'fly') {
    h = tkcGiftHome();
    k = easeInOutSine(Math.min(1, gf.t / 1.2));
    gf.x = gf.x0 + (h.x - gf.x0) * k;
    gf.y = gf.y0 + (h.y - gf.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    if (gf.t >= 1.2) {
      gf.state = 'held';
      artPop(h.x, h.y, viewH * 0.06, '#b49cff', 'burst');
      spawnSparkles(h.x, h.y, 12, '#c9b8ff');
      playNote(1047, 0, 0.2, 'triangle', 0.2);
      playNote(1319, 0.1, 0.2, 'triangle', 0.2);
      playNote(1568, 0.2, 0.4, 'triangle', 0.2);
    }
  } else if (gf.state === 'held') {
    h = tkcGiftHome();
    gf.x = h.x; gf.y = h.y;
    if (Math.random() < dt * 0.4) playNote(TKC_SCALE[5 + Math.floor(Math.random() * 5)], 0, 0.4, 'sine', 0.04);
  }
}

// ---------- Loppu: auringonsäde ----------
function tkcPupInBeam() {
  var p = tkc.pup, sx = tkcSunX();
  return Math.abs(p.x - sx) < viewW * 0.1 && p.y < tkcFloorY(sx) - viewH * 0.03;
}
function tkcUpdateEnding(dt) {
  var e = tkc.end, p = tkc.pup, sx = tkcSunX(), k, i, prev, fy = tkcFloorY(sx), r, us = trekUS();
  tkc.moving = false;
  if (tkc.state === 'sun') {
    if (tkcPupInBeam()) {
      tkc.state = 'grow';
      tkc.stT = 0;
      e.t = 0;
      e.notes = 0;
      tkc.grab = 'none';
      tkcSay('wow', TKC_GROW_T + 0.4);
      trekPupSound('slurp');
    }
  } else if (tkc.state === 'grow') {
    e.t += dt;
    k = 1 - Math.exp(-dt * 4);
    p.x += (sx - p.x) * k;
    p.y += (fy - viewH * 0.24 - p.y) * k;
    p.scale = 1 + (TKC_BIG - 1) * easeOutBack(Math.min(1, e.t / TKC_GROW_T));
    while (e.notes < 8 && e.t >= 0.25 + e.notes * 0.19) {
      playNote([392, 523, 659, 784, 1047, 1319, 1568, 2093][e.notes], 0, 0.25, 'triangle', 0.17);
      e.notes++;
    }
    if (Math.random() < dt * 14) spawnSparkles(p.x + tkcRnd(-1, 1) * tkcPupR(), p.y + tkcRnd(-0.6, 0.6) * tkcPupR(), 2, Math.random() < 0.5 ? '#fff3b8' : '#ffffff');
    if (e.t > 0.35 && e.t - dt <= 0.35) trekPupSound('wow');
    if (e.t >= TKC_GROW_T) {
      tkc.state = 'board';
      e.t = 0;
      e.ux0 = tkc.ux;
      e.cx = p.x;
      e.cy = p.y;
      artPop(p.x, p.y, viewH * 0.25, '#fff3b8', 'burst');
      trekPupSound('yay');
      playNote(660, 0.1, 0.12, 'triangle', 0.2);
      playNote(880, 0.2, 0.2, 'triangle', 0.2);
    }
  } else if (tkc.state === 'board') {
    e.t += dt;
    k = Math.min(1, e.t / TKC_BOARD_T);
    r = tkcPupR();
    tkc.ux = e.ux0 + (e.cx - us * 4 - e.ux0) * easeInOutSine(k);
    e.uy = tkcFloorY(e.ux0) + (e.cy - r * 0.62 - tkcFloorY(e.ux0)) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    tkc.walkPhase += dt * 6;
    if (k >= 1) {
      tkc.state = 'rise';
      e.t = 0;
      spawnSparkles(e.cx, e.cy - r * 0.6, 14, '#ffffff');
      tkcSay('happy', 0);
      // Valo tulvii: jäljellä olevat möröt muuttuvat koiperhosiksi
      for (i = 0; i < tkc.critters.length; i++) {
        if (tkc.critters[i].state !== 'gone' && tkc.critters[i].state !== 'wait' && tkc.critters[i].state !== 'pop') { tkc.critters[i].state = 'pop'; tkc.critters[i].t = 0; }
      }
    }
  } else if (tkc.state === 'rise' || tkc.state === 'done') {
    e.t += dt;
    k = Math.min(1, e.t / TKC_RISE_T);
    r = tkcPupR();
    p.y = e.cy - viewH * 1.2 * (k * k * 0.7 + k * 0.3) - (tkc.state === 'done' ? (e.t - TKC_RISE_T) * viewH * 0.3 : 0);
    p.x = e.cx + Math.sin(e.t * 1.5) * viewH * 0.01;
    e.uy = p.y - r * 0.62;
    tkc.ux = p.x - us * 4;
    e.pan = viewH * 0.9 * easeInOutSine(k);
    e.flood = easeInOutSine(Math.min(1, e.t / (TKC_RISE_T * 0.9)));
    tkcLight.vignette = TKC_VIGNETTE * (1 - e.flood);
    if (Math.random() < dt * 8) spawnSparkles(p.x + tkcRnd(-1, 1) * r, p.y + r * 0.7, 1, '#fff3b8');
    prev = e.t - dt;
    if (prev < 0.4 && e.t >= 0.4) { playNote(523, 0, 0.6, 'triangle', 0.16); playNote(659, 0, 0.6, 'triangle', 0.14); playNote(784, 0, 0.8, 'triangle', 0.14); }
    if (tkc.state === 'rise' && e.t >= TKC_RISE_T - 0.2) {
      tkc.state = 'done';
      trekChapterDone();
    }
  }
  tkc.pan = e.pan;
}

// ---------- Piirto: tausta ----------
function tkcRenderFar(b, w, h) {
  var g, i, x, y, k, hh;
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a2266');
  g.addColorStop(0.5, '#221a54');
  g.addColorStop(1, '#2c2262');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Kaukaiset kivipylväät
  for (i = 0; i < w / (h * 0.32); i++) {
    x = i * h * 0.32 + tkcHash(i) * h * 0.15;
    k = 0.05 + tkcHash(i + 7) * 0.05;
    b.fillStyle = 'rgba(70,56,140,0.55)';
    b.beginPath();
    b.moveTo(x - h * k, h);
    b.quadraticCurveTo(x - h * k * 0.4, h * 0.5, x - h * k, 0);
    b.lineTo(x + h * k, 0);
    b.quadraticCurveTo(x + h * k * 0.4, h * 0.5, x + h * k, h);
    b.closePath();
    b.fill();
  }
  // Kaukaiset kristallit hehkuvat himmeästi
  for (i = 0; i < w / (h * 0.22); i++) {
    x = i * h * 0.22 + tkcHash(i + 31) * h * 0.2;
    y = h * (0.35 + tkcHash(i + 13) * 0.4);
    hh = h * (0.03 + tkcHash(i + 5) * 0.04);
    artGlow(b, x, y - hh * 0.5, hh * 2.4, TKC_CRY_COLS[i % 5], 0.18);
    b.globalAlpha = 0.55;
    tkcPrism(b, x, y, hh * 0.45, hh, artMix(TKC_CRY_COLS[i % 5], '#3a2c80', 0.45), (tkcHash(i) - 0.5) * 0.6);
    b.globalAlpha = 1;
  }
  for (i = 0; i < w / (h * 0.04); i++) {
    b.fillStyle = 'rgba(180,160,255,' + (0.15 + tkcHash(i + 99) * 0.25) + ')';
    b.beginPath(); b.arc(tkcHash(i + 3) * w, tkcHash(i + 61) * h, 0.6 + tkcHash(i) * 1.4, 0, Math.PI * 2); b.fill();
  }
}
function tkcRenderNear(b, w, h) {
  var x, y, i, g, U = w / 5, sx = tkcSunX(), len, k, cy;
  // Luolan suu alussa: ulkona päivänvaloa, vihreä rinne ja kukkia
  b.save();
  b.beginPath();
  b.moveTo(-2, h * 0.16);
  b.quadraticCurveTo(U * 0.13, h * 0.14, U * 0.14, h * 0.5);
  b.lineTo(U * 0.13, h * 0.9);
  b.lineTo(-2, h * 0.9);
  b.closePath();
  b.clip();
  g = b.createLinearGradient(0, h * 0.15, 0, h * 0.85);
  g.addColorStop(0, '#9fd8ff');
  g.addColorStop(0.6, '#e6f6ff');
  g.addColorStop(1, '#fff4c8');
  b.fillStyle = g;
  b.fillRect(-2, 0, U * 0.16, h);
  drawCloud(b, U * 0.05, h * 0.3, h * 0.025, 0.95);
  fillHillBand(b, U * 0.16, h, h * 0.62, '#9edc7c', function (px) { return h * 0.66 - Math.sin(px / h * 9) * h * 0.03; });
  fillHillBand(b, U * 0.16, h, h * 0.74, '#86cf6a', function (px) { return h * 0.76 - Math.sin(px / h * 6 + 1) * h * 0.02; });
  for (i = 0; i < 6; i++) drawFlower(b, U * (0.012 + i * 0.02), h * (0.79 + (i % 2) * 0.03), h * 0.008, ['#ff7bac', '#ffe27a', '#ffffff'][i % 3]);
  b.restore();
  b.strokeStyle = '#2a2060';
  b.lineWidth = h * 0.03;
  b.beginPath();
  b.moveTo(-2, h * 0.16);
  b.quadraticCurveTo(U * 0.13, h * 0.14, U * 0.14, h * 0.5);
  b.lineTo(U * 0.13, h * 0.9);
  b.stroke();
  b.strokeStyle = '#6656b0';
  b.lineWidth = h * 0.012;
  b.stroke();
  // Auringonkuilun aukko katossa: lämmin valo
  g = b.createLinearGradient(0, 0, 0, h * 0.25);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(1, 'rgba(255,240,190,0)');
  b.fillStyle = g;
  b.fillRect(sx - viewW * 0.16, 0, viewW * 0.32, h * 0.25);
  // Takaseinän kivikerrokset: loivia raitoja
  for (i = 0; i < 5; i++) {
    y = h * (0.26 + i * 0.1);
    b.strokeStyle = i % 2 ? 'rgba(90,74,170,0.22)' : 'rgba(30,22,70,0.25)';
    b.lineWidth = h * (0.008 + (i % 3) * 0.005);
    b.lineCap = 'round';
    b.beginPath();
    for (x = U * 0.2; x <= w; x += 16) {
      k = y + Math.sin(x / h * 2.1 + i * 1.7) * h * 0.03 + Math.sin(x / h * 5.3 + i) * h * 0.01;
      if (Math.abs(x - sx) < viewW * 0.17 || (x > U * 0.2 && x < U * 0.2 + 16)) b.moveTo(x, k); else b.lineTo(x, k);
    }
    b.stroke();
  }
  // Tippukivipylväät taustalla
  for (i = 0; i < w / (h * 0.5); i++) {
    x = i * h * 0.5 + tkcHash(i + 41) * h * 0.3;
    if (Math.abs(x - sx) < viewW * 0.2 || x < U * 0.2) continue;
    y = tkcFloorY(x) - h * 0.02;
    len = h * (0.08 + tkcHash(i + 17) * 0.12);
    b.beginPath();
    b.moveTo(x - h * 0.035, y);
    b.quadraticCurveTo(x - h * 0.012, y - len * 0.6, x, y - len);
    b.quadraticCurveTo(x + h * 0.012, y - len * 0.6, x + h * 0.035, y);
    b.closePath();
    artFillPath(b, '#4a3d8e', y - len, y, h * 0.03, { lineColor: '#2a2060' });
  }
  // Katto
  b.beginPath();
  b.moveTo(0, -h * 0.1);
  for (x = 0; x <= w; x += 8) b.lineTo(x, tkcCeilY(x));
  b.lineTo(w, -h * 0.1);
  b.closePath();
  g = b.createLinearGradient(0, 0, 0, h * 0.16);
  g.addColorStop(0, '#2e2468');
  g.addColorStop(1, '#4e40a0');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#231a50';
  b.lineWidth = Math.max(1.5, h * 0.004);
  b.stroke();
  // Tippukivet katosta
  for (i = 0; i < w / (h * 0.06); i++) {
    x = i * h * 0.06 + tkcHash(i + 71) * h * 0.03;
    if (Math.abs(x - sx) < viewW * 0.16) continue;
    cy = tkcCeilY(x) - h * 0.005;
    len = h * (0.02 + tkcHash(i + 3) * tkcHash(i + 8) * 0.07);
    k = h * (0.008 + tkcHash(i + 9) * 0.012);
    b.beginPath();
    b.moveTo(x - k, cy);
    b.quadraticCurveTo(x - k * 0.3, cy + len * 0.6, x, cy + len);
    b.quadraticCurveTo(x + k * 0.3, cy + len * 0.6, x + k, cy);
    b.closePath();
    artFillPath(b, '#4e40a0', cy, cy + len, k, { lineColor: '#2a2060' });
  }
  // Lattia
  b.beginPath();
  b.moveTo(0, h);
  for (x = 0; x <= w; x += 8) b.lineTo(x, tkcFloorY(x) - h * 0.012);
  b.lineTo(w, h);
  b.closePath();
  g = b.createLinearGradient(0, h * 0.78, 0, h);
  g.addColorStop(0, '#6656b0');
  g.addColorStop(1, '#2c2264');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#9080d8';
  b.lineWidth = Math.max(1.5, h * 0.005);
  b.beginPath();
  for (x = 0; x <= w; x += 8) { y = tkcFloorY(x) - h * 0.012; if (x === 0) b.moveTo(x, y); else b.lineTo(x, y); }
  b.stroke();
  // Pikkukivet ja lattian kristallinsirut
  for (i = 0; i < w / (h * 0.05); i++) {
    x = i * h * 0.05 + tkcHash(i + 5) * h * 0.04;
    y = tkcFloorY(x) + h * (0.01 + tkcHash(i + 19) * 0.13);
    if (y > h * 0.99) continue;
    if (i % 5 === 2) tkcPrism(b, x, y, h * 0.01, h * 0.022, artMix(TKC_CRY_COLS[i % 5], '#4a3d8e', 0.4), (tkcHash(i) - 0.5));
    else artBlob(b, x, y, h * (0.008 + tkcHash(i) * 0.01), h * 0.005, '#4e4294', { line: false, hi: 0.15 });
  }
  // Ruohoa luolan suulla ja auringonkuilun alla
  for (i = 0; i < 16; i++) {
    x = U * 0.01 + i * U * 0.007;
    hubThemeTuft(b, x, tkcFloorY(x) - h * 0.008, h * 0.1, 'rgba(110,190,90,0.95)');
  }
  for (i = 0; i < 10; i++) {
    x = sx - viewW * 0.09 + i * viewW * 0.02;
    hubThemeTuft(b, x, tkcFloorY(x) - h * 0.008, h * 0.09, 'rgba(120,200,100,0.9)');
    if (i % 3 === 1) drawFlower(b, x + h * 0.01, tkcFloorY(x) + h * 0.01, h * 0.007, ['#ffe27a', '#ff9ec6', '#ffffff'][i % 3]);
  }
}

// ---------- Piirto ----------
function tkcHoleSprite() {
  var b, g;
  if (tkcHoleCv) return tkcHoleCv;
  tkcHoleCv = document.createElement('canvas');
  tkcHoleCv.width = 64; tkcHoleCv.height = 64;
  b = tkcHoleCv.getContext('2d');
  g = b.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  b.fillStyle = g;
  b.fillRect(0, 0, 64, 64);
  return tkcHoleCv;
}
// Värillinen hehku esipiirrettynä (ei liukuväriä joka ruudulla)
function tkcGlow(c, x, y, r, col, a) {
  var cv = tkcGlowCache[col], b, g, a0 = c.globalAlpha;
  if (r <= 0.5 || a <= 0) return;
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    b = cv.getContext('2d');
    g = b.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, artRGBA(col, 1));
    g.addColorStop(0.4, artRGBA(col, 0.45));
    g.addColorStop(1, artRGBA(col, 0));
    b.fillStyle = g;
    b.fillRect(0, 0, 64, 64);
    tkcGlowCache[col] = cv;
  }
  c.globalAlpha = a0 * Math.min(1, a);
  c.drawImage(cv, x - r, y - r, r * 2, r * 2);
  c.globalAlpha = a0;
}
// Pimeys: yksi puolikokoinen kangas, valoihin leikataan reiät (destination-out)
function tkcDrawDark(c, L, alpha, pan) {
  var w = Math.max(1, Math.ceil(viewW * 0.5)), h = Math.max(1, Math.ceil(viewH * 0.5)), d, i, l, x, y, r, hole = tkcHoleSprite();
  if (alpha <= 0.01) return;
  if (tkcDarkCv.width !== w || tkcDarkCv.height !== h) { tkcDarkCv.width = w; tkcDarkCv.height = h; }
  d = tkcDarkCv.getContext('2d');
  d.setTransform(1, 0, 0, 1, 0, 0);
  d.globalCompositeOperation = 'source-over';
  d.globalAlpha = 1;
  d.clearRect(0, 0, w, h);
  d.fillStyle = 'rgba(10,8,30,' + alpha + ')';
  d.fillRect(0, 0, w, h);
  d.globalCompositeOperation = 'destination-out';
  for (i = 0; i < L.length; i++) {
    l = L[i];
    x = (l.x - camX) * 0.5; y = (l.y + pan) * 0.5; r = l.r * 0.5;
    if (r < 1 || x + r < 0 || x - r > w || y + r < 0 || y - r > h) continue;
    d.globalAlpha = l.a;
    d.drawImage(hole, x - r, y - r, r * 2, r * 2);
  }
  d.globalAlpha = 1;
  d.globalCompositeOperation = 'source-over';
  c.drawImage(tkcDarkCv, 0, 0, w, h, -4, -pan - 4, viewW + 8, viewH + 8);
}

function tkcDraw() {
  var c = ctx, L, pan, ending, i, l, x;
  if (!beginPlayWorld()) return;
  if (!tkc.built) { endPlayWorld(); return; }
  if (!tkc.lights) tkc.lights = tkcCollectLights();
  L = tkc.lights;
  pan = tkc.pan || 0;
  ending = tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done';
  if (pan > 0.5) {
    // Kamera nousee kuilua ylös: maailma alas, yläpuolelle kuilu ja taivas
    c.translate(0, pan);
    drawWorldBg();
    tkcDrawShaft(c, pan);
  }
  tkcDrawNiches(c);
  tkcDrawWorms(c, false);
  for (i = 0; i < tkc.crystals.length; i++) tkcDrawWallCrystal(c, tkc.crystals[i]);
  propsDraw(c, 0);
  for (i = 0; i < tkc.gates.length; i++) tkcDrawGate(c, tkc.gates[i]);
  for (i = 0; i < tkc.critters.length; i++) tkcDrawCritter(c, tkc.critters[i]);
  if (!ending) tkcDrawUnicorn(c);
  propsDraw(c, 1);
  // Pimeys valoaukkoineen
  tkcDrawDark(c, L, TKC_DARK * (1 - tkc.end.flood), pan);
  // Hehkuvat asiat pimeyden päällä
  tkcDrawBeam(c);
  for (i = 0; i < L.length; i++) {
    l = L[i];
    if (l.kind !== 'static' && l.kind !== 'gatefar') continue;
    x = l.x - camX;
    if (x < -l.r || x > viewW + l.r) continue;
    tkcGlow(c, x, l.y, l.r * 0.7, l.col, 0.16);
  }
  for (i = 0; i < tkc.crystals.length; i++) tkcDrawCrystalShine(c, tkc.crystals[i]);
  tkcDrawWorms(c, true);
  for (i = 0; i < tkc.critters.length; i++) tkcDrawCritterEyes(c, tkc.critters[i]);
  for (i = 0; i < tkc.moths.length; i++) tkcDrawMoth(c, tkc.moths[i]);
  for (i = 0; i < tkc.gates.length; i++) tkcDrawGateGlow(c, tkc.gates[i]);
  tkcDrawBunnyTwinkle(c);
  tkcDrawHorn(c);
  tkcDrawPupNow(c);
  if (ending) tkcDrawUnicorn(c);
  tkcDrawGiftNow(c);
  drawParticlesLayer(c);
  if (tkc.end.flood > 0) {
    c.globalAlpha = tkc.end.flood * 0.55;
    c.fillStyle = '#fff6dc';
    c.fillRect(-4, -pan - 4, viewW + 8, viewH + 8);
    c.globalAlpha = 1;
  }
  tkcDrawHint(c);
  endPlayWorld();
  tkcDrawHud(c);
}

// Auringonkuilu katon yläpuolella (näkyy vain lopun nousussa)
function tkcDrawShaft(c, pan) {
  var sx = tkcSunX() - camX, hw = viewW * 0.11, top = -pan - 6, g, i, y;
  c.fillStyle = '#2e2468';
  c.fillRect(-4, top, viewW + 8, pan + 10);
  c.beginPath();
  c.moveTo(sx - hw, 2);
  c.quadraticCurveTo(sx - hw * 1.1, -viewH * 0.5, sx - hw * 1.9, top);
  c.lineTo(sx + hw * 1.9, top);
  c.quadraticCurveTo(sx + hw * 1.1, -viewH * 0.5, sx + hw, 2);
  g = c.createLinearGradient(0, 0, 0, -viewH);
  g.addColorStop(0, '#fff2c0');
  g.addColorStop(0.5, '#d8f0ff');
  g.addColorStop(1, '#8fd0ff');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = '#231a50';
  c.lineWidth = Math.max(2, viewH * 0.005);
  c.stroke();
  // Aurinko ja pilvet kuilun suulla
  y = -viewH * 0.82;
  artGlow(c, sx, y, viewH * 0.25, '#fff0a0', 0.7);
  artCircle(c, sx, y, viewH * 0.06, '#ffd84a', { lineColor: '#f0a830', hi: 0.4 });
  drawCloud(c, sx - hw * 0.9, -viewH * 0.66, viewH * 0.03, 0.9);
  drawCloud(c, sx + hw * 1.0, -viewH * 0.74, viewH * 0.025, 0.9);
  // Kuilun reunan ruohot ja kukat
  for (i = 0; i < 6; i++) {
    hubThemeTuft(c, sx - hw * 1.45 + i * viewH * 0.012, -viewH * 0.9, viewH * 0.06, 'rgba(110,190,90,0.95)');
    hubThemeTuft(c, sx + hw * 1.45 - i * viewH * 0.012, -viewH * 0.9, viewH * 0.06, 'rgba(110,190,90,0.95)');
  }
  // Seinien kristallit hohtavat
  for (i = 0; i < 5; i++) {
    tkcPrism(c, sx - hw * (1.1 + (i % 2) * 0.15), -viewH * (0.12 + i * 0.15), viewH * 0.02, viewH * 0.05, TKC_CRY_COLS[i], 0.9);
    tkcPrism(c, sx + hw * (1.1 + (i % 2) * 0.12), -viewH * (0.2 + i * 0.14), viewH * 0.02, viewH * 0.05, TKC_CRY_COLS[(i + 2) % 5], -0.9);
  }
}
// Auringonsäde: lämmin valokiila ja leijuvat pölyhiukkaset
function tkcDrawBeam(c) {
  var sx = tkcSunX() - camX, fy = tkcFloorY(tkcSunX()), g, i, k, x, y, a;
  if (sx < -viewW * 0.3 || sx > viewW * 1.3) return;
  a = 0.5 + Math.sin(globalT * 1.3) * 0.06;
  g = c.createLinearGradient(0, 0, 0, fy);
  g.addColorStop(0, 'rgba(255,244,200,' + (a * 0.9) + ')');
  g.addColorStop(1, 'rgba(255,236,170,' + (a * 0.25) + ')');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(sx - viewW * 0.09, -viewH * 0.1);
  c.lineTo(sx + viewW * 0.09, -viewH * 0.1);
  c.lineTo(sx + viewW * 0.14, fy);
  c.lineTo(sx - viewW * 0.14, fy);
  c.closePath();
  c.fill();
  artBlob(c, sx, fy, viewW * 0.14, viewH * 0.02, '#fff4c8', { line: false, flat: true, alpha: 0.5 });
  c.fillStyle = 'rgba(255,255,230,0.85)';
  for (i = 0; i < 14; i++) {
    k = (globalT * 0.05 + tkcHash(i)) % 1;
    x = sx + (tkcHash(i + 3) - 0.5) * viewW * 0.2 + Math.sin(globalT + i) * viewH * 0.01;
    y = fy - k * fy;
    c.beginPath(); c.arc(x, y, 1 + tkcHash(i + 5) * 2, 0, Math.PI * 2); c.fill();
  }
}

function tkcDrawUnicorn(c) {
  var us = trekUS(), x = tkc.ux - camX, y, k, ang, jit = 0, hop = 0, e = tkc.end;
  if (x < -viewW * 0.3 || x > viewW * 1.3) return;
  if (tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done') {
    drawUnicorn(c, x, e.uy, us, 1, tkc.walkPhase, tkc.state === 'board', globalT);
    // Kaviot uppoavat pilven pörröön
    k = tkc.state === 'board' ? Math.max(0, (e.t / TKC_BOARD_T - 0.75) * 4) : 1;
    if (k > 0) {
      hop = us * 10 * Math.min(1, k);
      artUnion(c, tkcFluffPath, x, e.uy - us * 2, hop, e.uy - us * 12, e.uy + us * 8, '#fffbe6', { lineColor: '#b8a8a0', shadeTo: '#ffefc0' });
    }
    return;
  }
  y = tkcFloorY(tkc.ux);
  if (tkc.darkT > 0.5) jit = Math.sin(globalT * 55) * viewH * 0.0025;
  if (tkc.rearT > 0) {
    k = 1 - tkc.rearT / TKC_REAR_T;
    ang = Math.sin(k * Math.PI) * 0.32;
    hop = Math.sin(k * Math.PI) * viewH * 0.03;
    c.save();
    c.translate(x - us * 26, y - hop);
    c.rotate(-ang);
    drawUnicorn(c, us * 26, 0, us, 1, tkc.walkPhase, false, globalT);
    c.restore();
    return;
  }
  drawUnicorn(c, x + jit, y, us, 1, tkc.walkPhase, tkc.moving, globalT);
  // Pimeässä: pieni hikipisara ja vapina
  if (tkc.darkT > 1.2 && tkc.state === 'walk') {
    k = (globalT * 0.8) % 1;
    artBlob(c, x + us * 30, y - us * 96 + k * us * 10, us * 2, us * 3, '#bfe4ff', { lineColor: '#5a90d0', line: Math.max(1, us * 0.5), alpha: 1 - k });
  }
}
function tkcFluffPath(c, x, y, s) {
  var j;
  c.beginPath();
  for (j = -2; j <= 2; j++) {
    c.moveTo(x + j * s * 1.5 + s * (1 - Math.abs(j) * 0.12), y + Math.abs(j) * s * 0.2);
    c.arc(x + j * s * 1.5, y + Math.abs(j) * s * 0.2, s * (1 - Math.abs(j) * 0.12), 0, Math.PI * 2);
  }
}
function tkcDrawHorn(c) {
  var us = trekUS(), x = tkc.ux - camX, y = tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done' ? tkc.end.uy : tkcFloorY(tkc.ux);
  if (tkc.rearT > 0) return;
  tkcGlow(c, x + us * 46, y - us * 112, viewH * 0.035, '#fff3b0', 0.5 + Math.sin(globalT * 3) * 0.15);
}
function tkcDrawPupNow(c) {
  var p = tkc.pup, mood = tkc.moodT > 0 ? tkc.mood : 'happy', i, cr, look, sq = 0, x = p.x - camX, r = tkcPupR(), e = tkc.end;
  if (tkc.moodT <= 0) {
    // Rohkea, kun mörkö hiipii lähellä
    for (i = 0; i < tkc.critters.length; i++) {
      cr = tkc.critters[i];
      if ((cr.state === 'creep' || cr.state === 'tell') && Math.abs(cr.x - p.x) < viewW * 0.4) { mood = 'brave'; break; }
    }
    if (tkc.state === 'intro' && !p.glowed) mood = 'happy';
  }
  look = Math.max(-1, Math.min(1, p.vx / (viewW * 0.4)));
  if (Math.abs(look) < 0.1) look = Math.sin(globalT * 0.7) * 0.4;
  if (p.wig > 0) sq = Math.sin(p.wig * 22) * 0.12 * p.wig / 0.6;
  if (tkc.state === 'grow') sq += Math.sin(e.t * 13) * 0.14 * (1 - Math.min(1, e.t / TKC_GROW_T));
  trekDrawPup(c, x, p.y + (tkc.state === 'grow' || tkc.state === 'rise' ? 0 : Math.sin(globalT * 2.4) * viewH * 0.006), r, {
    mood: mood, t: globalT, look: look, glow: p.glow, squash: sq,
    wave: tkc.state === 'board' || tkc.state === 'rise' || tkc.state === 'done' || (tkc.moodT > 0 && mood === 'wow')
  });
}
function tkcDrawGiftNow(c) {
  var gf = tkc.gift, s;
  if (gf.state === 'none') return;
  s = gf.state === 'held' ? viewH * 0.06 : viewH * (gf.state === 'emerge' ? 0.06 + Math.min(1, gf.t / 0.6) * 0.04 : 0.1 - Math.min(1, gf.t / 1.2) * 0.04);
  tkcDrawGift(c, gf.x - camX, gf.y, s, globalT);
  if (gf.state !== 'held' || Math.sin(globalT * 1.7) > 0.6) {
    // Laulaa: pieni nuotti nousee
    var k = (globalT * 0.7) % 1;
    c.globalAlpha = 1 - k;
    tkcNote(c, gf.x - camX + s * 0.5 + k * s * 0.3, gf.y - s * 0.5 - k * s * 0.8, s * 0.22);
    c.globalAlpha = 1;
  }
}
function tkcNote(c, x, y, s) {
  c.fillStyle = '#e8e0ff';
  c.strokeStyle = '#e8e0ff';
  c.lineWidth = Math.max(1, s * 0.18);
  c.beginPath(); c.ellipse(x, y, s * 0.4, s * 0.3, -0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x + s * 0.35, y); c.lineTo(x + s * 0.35, y - s * 1.2); c.quadraticCurveTo(x + s * 0.8, y - s * 0.9, x + s * 0.75, y - s * 0.5); c.stroke();
}

// Kristallisärmiö: pohja (x, y), leveys w, korkeus h, kallistus rot
function tkcPrism(c, x, y, w, h, col, rot) {
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(-w / 2, -h * 0.72);
  c.lineTo(0, -h);
  c.lineTo(w / 2, -h * 0.72);
  c.lineTo(w / 2, 0);
  c.closePath();
  artFillPath(c, col, -h, 0, w, { lineColor: artShade(col, -0.5), line: Math.max(1, w * 0.1) });
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.beginPath();
  c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h * 0.72); c.lineTo(0, -h); c.lineTo(-w * 0.08, 0);
  c.closePath();
  c.fill();
  c.restore();
}
function tkcDrawWallCrystal(c, cr) {
  var p = tkcCryPos(cr), x = p.x - camX, y = p.y, s = viewH * 0.05, col, k, pop;
  if (x < -s * 3 || x > viewW + s * 3) return;
  k = cr.lit ? 1 : Math.min(1, cr.charge / TKC_HOVER) * 0.6;
  col = artMix(artMix(cr.col, '#3a3270', 0.6), cr.col, k);
  pop = cr.lit && cr.litT < 0.4 ? 1 + Math.sin(cr.litT / 0.4 * Math.PI) * 0.25 : 1;
  c.save();
  c.translate(x, y);
  c.rotate(cr.rot);
  c.scale(pop, pop);
  artBlob(c, 0, s * 0.15, s * 0.7, s * 0.3, '#4a3d8e', { lineColor: '#2a2060', hi: 0.1 });
  tkcPrism(c, -s * 0.35, s * 0.1, s * 0.32, s * 0.75, col, -0.45);
  tkcPrism(c, s * 0.35, s * 0.1, s * 0.3, s * 0.65, col, 0.45);
  tkcPrism(c, 0, s * 0.15, s * 0.42, s * 1.15, col, 0);
  c.restore();
}
// Seinäkristallin kiilto pimeässä, latausrengas ja syttyneen hehku
function tkcDrawCrystalShine(c, cr) {
  var p = tkcCryPos(cr), x = p.x - camX, y = p.y, s = viewH * 0.05, k;
  if (x < -s * 3 || x > viewW + s * 3) return;
  if (cr.lit) {
    tkcGlow(c, x, y - s * 0.4, s * 2.2, cr.col, 0.35 + Math.sin(globalT * 2 + cr.ph) * 0.08);
    return;
  }
  // Himmeä kimallus kertoo, että kristalli on siellä
  k = Math.max(0, Math.sin(globalT * 1.6 + cr.ph));
  tkcGlow(c, x, y - s * 0.4, s * 0.9, cr.col, 0.12 + k * 0.15);
  if (k > 0.85) drawStar(c, x + s * 0.12, y - s * 0.95, s * 0.14 * (k - 0.85) / 0.15, globalT, 0);
  if (cr.charge > 0) {
    k = Math.min(1, cr.charge / TKC_HOVER);
    tkcGlow(c, x, y - s * 0.4, s * 1.8, cr.col, k * 0.5);
    c.strokeStyle = artRGBA(cr.col, 0.95);
    c.lineWidth = Math.max(2, s * 0.12);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - s * 0.4, s * 1.1, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke();
  }
}
function tkcDrawWorms(c, glow) {
  var i, j, m, x, y, cy, k;
  for (i = 0; i < tkc.worms.length; i++) {
    m = tkc.worms[i];
    x = tkcWX(m.u) - camX;
    if (x < -viewH * 0.1 || x > viewW + viewH * 0.1) continue;
    cy = tkcCeilY(tkcWX(m.u));
    for (j = 0; j < m.n; j++) {
      k = (j - (m.n - 1) / 2) * viewH * 0.018;
      y = cy + viewH * m.len * (0.6 + 0.4 * tkcHash(j + i * 7)) + Math.sin(globalT * 1.5 + j + m.ph) * viewH * 0.004;
      if (!glow) {
        c.strokeStyle = 'rgba(200,230,255,0.4)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(x + k, cy); c.lineTo(x + k, y); c.stroke();
      } else {
        tkcGlow(c, x + k, y, viewH * 0.016, '#b8fff0', 0.6 + Math.sin(globalT * 2 + j * 1.7 + m.ph) * 0.25);
        c.fillStyle = '#e8fff8';
        c.beginPath(); c.arc(x + k, y, Math.max(1.2, viewH * 0.0035), 0, Math.PI * 2); c.fill();
      }
    }
  }
}
// Piilopupun kolot: yksi kolmesta on asuttu
function tkcBunnyPos() { var x = tkcWX(tkc.bunny.u); return { x: x, y: tkc.bunny.yf * viewH }; }
function tkcDrawNiches(c) {
  var i, x, y, s = viewH * 0.05, bp, k, peek;
  for (i = 0; i < TKC_BUNNY_SPOTS.length; i++) {
    x = tkcWX(TKC_BUNNY_SPOTS[i][0]) - camX;
    y = TKC_BUNNY_SPOTS[i][1] * viewH;
    if (x < -s * 3 || x > viewW + s * 3) continue;
    artBlob(c, x, y + s * 0.15, s * 1.15, s * 0.8, '#5a4aa0', { lineColor: '#2a2060' });
    artBlob(c, x, y + s * 0.25, s * 0.9, s * 0.58, '#1c1440', { line: false });
    if (i === tkc.bunnySpot && !trekBunnyFoundNow()) {
      bp = tkcBunnyPos();
      k = (globalT * 0.3 + tkc.bunny.ph) % 1;
      peek = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) * 8) + Math.max(0, (k - 0.9) * 10);
      c.save();
      c.beginPath();
      c.rect(x - s * 1.5, y - s * 2.5, s * 3, s * 2.5 + s * 0.3);
      c.clip();
      drawBunny(c, x, y + s * 0.3 + (1 - Math.min(1, peek)) * s * 0.4, s * 0.9, 0, globalT * 2, true);
      c.restore();
    }
    // Kolon etureuna
    c.beginPath(); c.ellipse(x, y + s * 0.55, s * 1.0, s * 0.28, 0, 0, Math.PI); c.closePath();
    artFillPath(c, '#6656b0', y + s * 0.5, y + s * 0.85, s * 0.5, { lineColor: '#2a2060' });
  }
}
// Piilopupun silmät välähtävät joskus pimeässä (utelias lapsi huomaa)
function tkcDrawBunnyTwinkle(c) {
  var bp, x, k;
  if (trekBunnyFoundNow()) return;
  bp = tkcBunnyPos();
  x = bp.x - camX;
  if (x < -50 || x > viewW + 50) return;
  if (tkcLitAmount(bp.x, bp.y) > 0.25) return;
  k = (globalT * 0.25 + tkc.bunny.ph) % 1;
  if (k > 0.12) return;
  k = Math.sin(k / 0.12 * Math.PI);
  c.fillStyle = 'rgba(255,190,230,' + (0.75 * k) + ')';
  c.beginPath();
  c.arc(x - viewH * 0.0065, bp.y + viewH * 0.013, viewH * 0.0045, 0, Math.PI * 2);
  c.arc(x + viewH * 0.0065, bp.y + viewH * 0.013, viewH * 0.0045, 0, Math.PI * 2);
  c.fill();
}

// Varjomörkö: pörröinen tumma pallero (silmät piirretään pimeyden päälle)
function tkcDrawCritter(c, cr) {
  var x = cr.x - camX, y, s = viewH * 0.035, k, i, a, rr, sh = 0, sc = 1, hop;
  if (cr.state === 'wait' || cr.state === 'gone') return;
  if (x < -s * 3 || x > viewW + s * 3) return;
  y = tkcCritterY(cr);
  if (cr.state === 'pop') sc = Math.max(0, 1 - cr.t / 0.45);
  if (cr.eek) sh = Math.sin(globalT * 60) * s * 0.06;
  hop = cr.state === 'creep' || cr.state === 'retreat' ? Math.abs(Math.sin(cr.hop)) * s * 0.35 : 0;
  artShadow(c, x, y + s * 0.95, s * 1.1, s * 0.22, 0.3);
  c.save();
  c.translate(x + sh, y - hop);
  if (cr.state === 'pop') c.rotate(cr.t * 8);
  c.scale(sc, sc * (1 + Math.sin(cr.hop) * 0.06));
  c.beginPath();
  for (i = 0; i < 18; i++) {
    a = i / 18 * Math.PI * 2;
    rr = s * (i % 2 ? 0.95 : 1.15 + Math.sin(globalT * 6 + i + cr.seed) * 0.05);
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  artFillPath(c, cr.eek ? '#5a4a8a' : '#3a2c64', -s, s, s, { lineColor: '#1a1030' });
  artHighlight(c, -s * 0.35, -s * 0.45, s * 0.3, s * 0.14, 0.15);
  // Pikkujalat
  artBlob(c, -s * 0.4, s * 0.95, s * 0.22, s * 0.12, '#2a1e4c', { line: false });
  artBlob(c, s * 0.4, s * 0.95, s * 0.22, s * 0.12, '#2a1e4c', { line: false });
  k = cr.state === 'pop' ? 1 - sc : 0;
  if (k > 0) tkcGlow(c, 0, 0, s * 2.5, '#fff2b0', k);
  c.restore();
}
function tkcDrawCritterEyes(c, cr) {
  var x = cr.x - camX, y, s = viewH * 0.035, blink, er, i, hop, open, giggle, look;
  if (cr.state === 'wait' || cr.state === 'gone' || cr.state === 'pop') return;
  if (x < -s * 3 || x > viewW + s * 3) return;
  y = tkcCritterY(cr);
  hop = cr.state === 'creep' || cr.state === 'retreat' ? Math.abs(Math.sin(cr.hop)) * s * 0.35 : 0;
  y -= hop + s * 0.15;
  if (cr.eek) x += Math.sin(globalT * 60) * s * 0.06;
  // Varoitus: silmät räpsyvät nopeasti ja suurenevat
  if (cr.state === 'tell') blink = Math.sin(cr.t * 22) > 0.3;
  else blink = ((cr.blink + cr.seed) % 3.2) < 0.15;
  er = s * (cr.eek ? 0.3 : cr.state === 'tell' ? 0.26 : 0.22);
  giggle = cr.state === 'retreat';
  look = tkc.ux > cr.x ? 1 : -1;
  tkcGlow(c, x, y, s * 1.3, '#e8ff8a', cr.state === 'tell' ? 0.45 : 0.22);
  for (i = -1; i <= 1; i += 2) {
    open = !blink && !giggle;
    if (open) {
      artBlob(c, x + i * s * 0.36, y, er, er * 1.15, cr.eek ? '#ffffff' : '#eaff9a', { line: false });
      c.fillStyle = '#1a1030';
      c.beginPath(); c.arc(x + i * s * 0.36 + look * er * 0.3, y + er * 0.15, er * (cr.eek ? 0.35 : 0.5), 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(x + i * s * 0.36 + look * er * 0.3 - er * 0.2, y - er * 0.15, er * 0.18, 0, Math.PI * 2); c.fill();
    } else {
      c.strokeStyle = '#eaff9a';
      c.lineWidth = Math.max(1.5, er * 0.4);
      c.lineCap = 'round';
      c.beginPath();
      if (giggle) c.arc(x + i * s * 0.36, y + er * 0.4, er * 0.7, 1.15 * Math.PI, 1.85 * Math.PI);
      else { c.moveTo(x + i * s * 0.36 - er, y); c.lineTo(x + i * s * 0.36 + er, y); }
      c.stroke();
    }
  }
  // Valossa näkyy pieni "o"-suu; kikattaessa leveä hymy
  if (cr.eek || giggle) {
    c.strokeStyle = '#eaff9a';
    c.lineWidth = Math.max(1.2, s * 0.06);
    c.beginPath();
    if (cr.eek) c.arc(x, y + s * 0.45, s * 0.1, 0, Math.PI * 2);
    else c.arc(x, y + s * 0.3, s * 0.2, 0.2, Math.PI - 0.2);
    c.stroke();
  }
}
// Koiperhonen: hohtavat siivet, pieni valonlähde
function tkcDrawMoth(c, m) {
  var x = m.x - camX, y = m.y, s = viewH * 0.022, f = Math.abs(Math.sin(m.t * 14 + m.ph)), i;
  if (x < -s * 5 || x > viewW + s * 5) return;
  tkcGlow(c, x, y, s * 4, '#fff2b0', 0.55);
  for (i = -1; i <= 1; i += 2) {
    c.save();
    c.translate(x, y);
    c.scale(i * (0.35 + f * 0.65), 1);
    artBlob(c, s * 0.7, -s * 0.35, s * 0.75, s * 0.55, '#fff6d8', { lineColor: '#c8a8e8', rot: -0.4, line: Math.max(1, s * 0.08) });
    artBlob(c, s * 0.55, s * 0.4, s * 0.5, s * 0.38, '#f0e0ff', { lineColor: '#c8a8e8', rot: 0.4, line: Math.max(1, s * 0.08) });
    artCircle(c, s * 0.8, -s * 0.4, s * 0.15, '#ffd0f0', { line: false });
    c.restore();
  }
  artBlob(c, x, y, s * 0.18, s * 0.5, '#e8d8ff', { lineColor: '#9a80c8', line: Math.max(1, s * 0.06) });
  c.strokeStyle = '#9a80c8';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath();
  c.moveTo(x - s * 0.05, y - s * 0.45); c.quadraticCurveTo(x - s * 0.3, y - s * 0.9, x - s * 0.45, y - s * 0.8);
  c.moveTo(x + s * 0.05, y - s * 0.45); c.quadraticCurveTo(x + s * 0.3, y - s * 0.9, x + s * 0.45, y - s * 0.8);
  c.stroke();
}

// Numero-ovi: kivikaari, laatta (numero + kolot) ja edessä numerokristallit
function tkcDrawGate(c, g) {
  var gx = g.x(), x = gx - camX, fy = tkcFloorY(gx), W = viewH * 0.25, H = viewH * 0.44, top = fy - H, i, sp, filled, cols, j, cr, k, slide;
  if (x < -viewW * 0.9 || x > viewW + W * 2) return;
  if (x > -W * 2) {
    // Pylväät ja kaari
    artRoundRect(c, x - W / 2 - viewH * 0.07, top - viewH * 0.05, viewH * 0.07, H + viewH * 0.05, viewH * 0.02, '#5a4aa8', { lineColor: '#241a58', hi: 0.15 });
    artRoundRect(c, x + W / 2, top - viewH * 0.05, viewH * 0.07, H + viewH * 0.05, viewH * 0.02, '#5a4aa8', { lineColor: '#241a58', hi: 0.15 });
    // Oven takana: hämärä käytävä, josta kajastaa valoa
    c.beginPath();
    c.moveTo(x - W / 2, fy);
    c.lineTo(x - W / 2, top + viewH * 0.02);
    c.arc(x, top + viewH * 0.02, W / 2, Math.PI, 0);
    c.lineTo(x + W / 2, fy);
    c.closePath();
    artFillPath(c, '#2a2058', top - W / 2, fy, W * 0.5, { line: false, shadeTo: '#3e3080' });
    // Laatta liukuu ylös kiviholvin taakse avautuessa
    slide = g.openK * (H + viewH * 0.1);
    if (g.openK < 1) {
      c.save();
      c.beginPath();
      c.rect(x - W / 2 - 2, top + viewH * 0.02, W + 4, H);
      c.clip();
      c.translate(0, -slide);
      c.beginPath();
      c.moveTo(x - W / 2, fy);
      c.lineTo(x - W / 2, top + viewH * 0.02);
      c.arc(x, top + viewH * 0.02, W / 2, Math.PI, 0);
      c.lineTo(x + W / 2, fy);
      c.closePath();
      artFillPath(c, '#4c3e96', top - W / 2, fy, W * 0.5, { lineColor: '#241a58' });
      // Riimureuna
      c.strokeStyle = g.state === 'sleep' ? 'rgba(159,232,255,0.35)' : 'rgba(159,232,255,' + (0.6 + Math.sin(globalT * 3) * 0.2) + ')';
      c.lineWidth = Math.max(1.5, viewH * 0.004);
      c.setLineDash([viewH * 0.012, viewH * 0.01]);
      c.beginPath();
      c.moveTo(x - W * 0.4, fy - viewH * 0.02);
      c.lineTo(x - W * 0.4, top + viewH * 0.03);
      c.arc(x, top + viewH * 0.03, W * 0.4, Math.PI, 0);
      c.lineTo(x + W * 0.4, fy - viewH * 0.02);
      c.stroke();
      c.setLineDash([]);
      // Tavoite: iso numero
      tkcDigit(c, '' + g.target, x, top + viewH * 0.075, viewH * 0.1, g.state === 'sleep' ? '#8f86c8' : '#dffaff', '#2a1e68');
      // Kolot ja täytetyt pisteet
      cols = [];
      for (j = 0; j < g.order.length; j++) {
        cr = g.crys[g.order[j]];
        for (k = 0; k < cr.v; k++) cols.push(TKC_NUM_COLS[cr.v]);
      }
      filled = {};
      for (j = 0; j < g.flights.length; j++) if (!g.flights[j].back) filled[g.flights[j].sock] = true;
      for (i = 0; i < Math.max(g.target, cols.length); i++) {
        sp = tkcSocketPos(g, i);
        if (i < g.target) artCircle(c, sp.x - camX, sp.y, viewH * 0.017, '#2a2062', { lineColor: '#8f86d8', line: Math.max(1, viewH * 0.003) });
        if (i < cols.length && !filled[i]) {
          k = i >= g.target ? Math.sin(globalT * 18 + i) * viewH * 0.003 : 0;
          artCircle(c, sp.x - camX + k, sp.y, viewH * 0.014, cols[i], { lineColor: i >= g.target ? '#e04a4a' : artShade(cols[i], -0.45), line: Math.max(1.2, viewH * (i >= g.target ? 0.004 : 0.003)), hi: 0.4 });
        }
      }
      c.restore();
    }
    c.beginPath();
    c.arc(x, top + viewH * 0.02, W / 2 + viewH * 0.07, Math.PI, 0);
    c.arc(x, top + viewH * 0.02, W / 2, 0, Math.PI, true);
    c.closePath();
    artFillPath(c, '#6656b8', top - W / 2 - viewH * 0.05, top, viewH * 0.05, { lineColor: '#241a58' });
    artHighlight(c, x - W * 0.35, top - W * 0.32, W * 0.12, W * 0.04, 0.25);
    // Avattu ovi: ratkaisu loistaa holvissa
    if (g.state === 'open') tkcDigit(c, '' + g.target, x, top - W * 0.3, viewH * 0.045, '#dffaff', '#2a1e68');
  }
  // Numerokristallit
  if (g.state !== 'sleep' && g.state !== 'open') {
    for (i = 0; i < g.crys.length; i++) tkcDrawNumCrystal(c, g, i);
  } else if (g.state === 'sleep') {
    // Uinuvat kristallit: himmeitä kivenmurikoita
    for (i = 0; i < g.crys.length; i++) {
      sp = tkcNumPos(g, i);
      artBlob(c, sp.x - camX, sp.y - viewH * 0.01, viewH * 0.035, viewH * 0.018, '#4a3d8e', { lineColor: '#2a2060' });
    }
  }
}
// Numerokristalli: väri, pisteet (kuten nopassa) ja numero kivessä
var TKC_PIPS = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]];
function tkcDrawNumCrystal(c, g, i) {
  var cr = g.crys[i], p = tkcNumPos(g, i), x = p.x - camX, y = p.y, w = viewH * 0.066, h = viewH * 0.13, col = TKC_NUM_COLS[cr.v];
  var on = cr.lit && !(cr.flick > 0 && Math.sin(cr.flick * 34) < 0), sc = 1, j, pp, pr = viewH * 0.0085, cy, a;
  if (g.state === 'wake') {
    a = (g.t - 0.25 - i * 0.12) / 0.3;
    if (a <= 0) return;
    sc = easeOutBack(Math.min(1, a));
  }
  if (cr.pop > 0) sc *= 1 + Math.sin(cr.pop / 0.35 * Math.PI) * 0.15;
  if (g.state === 'opening') {
    // Ovi aukeaa: kristallit vajoavat lattiaan
    a = Math.min(1, g.t / 1.2);
    sc *= 1 - easeInOutSine(a);
    if (sc < 0.02) return;
    on = cr.lit;
  }
  artShadow(c, x, y + viewH * 0.005, w * 0.9, w * 0.2, 0.3);
  c.save();
  c.translate(x, y);
  c.scale(sc, sc);
  if (on) {
    // Sytytetty: kirkas hehku ja valopylväs ylöspäin
    tkcGlow(c, 0, -h * 0.5, h * 1.2, col, 0.85);
    c.fillStyle = artRGBA(col, 0.22 + Math.sin(globalT * 4 + cr.ph) * 0.06);
    c.beginPath();
    c.moveTo(-w * 0.3, -h * 0.9); c.lineTo(w * 0.3, -h * 0.9); c.lineTo(w * 0.7, -h * 2.4); c.lineTo(-w * 0.7, -h * 2.4);
    c.closePath();
    c.fill();
    artBlob(c, 0, 0, w * 0.9, w * 0.22, '#ffffff', { line: false, flat: true, alpha: 0.35 });
  }
  tkcPrism(c, 0, 0, w, h, on ? artMix(col, '#ffffff', 0.3) : artMix(col, '#2e2660', 0.62), 0);
  // Pisteet
  cy = -h * 0.42;
  for (j = 0; j < TKC_PIPS[cr.v].length; j++) {
    pp = TKC_PIPS[cr.v][j];
    artCircle(c, pp[0] * w * 0.24, cy + pp[1] * w * 0.3, pr, on ? '#ffffff' : '#b0a8d8', { lineColor: on ? artShade(col, -0.5) : '#2a2260', line: Math.max(1, pr * 0.35) });
  }
  // Numero kivessä
  artCircle(c, 0, viewH * 0.028, viewH * 0.026, on ? '#6a5ab8' : '#4a3d8e', { lineColor: '#241a58' });
  tkcDigit(c, '' + cr.v, 0, viewH * 0.03, viewH * 0.036, on ? '#ffffff' : '#c8c0e8', '#241a58');
  c.restore();
}
function tkcDigit(c, txt, x, y, fs, fill, stroke) {
  c.font = 'bold ' + Math.round(fs) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = Math.max(2, fs * 0.16);
  c.strokeStyle = stroke;
  c.strokeText(txt, x, y);
  c.fillStyle = fill;
  c.fillText(txt, x, y);
  c.textBaseline = 'alphabetic';
}
// Oven hehku ja lentävät pisteet pimeyden päällä
function tkcDrawGateGlow(c, g) {
  var gx = g.x(), x = gx - camX, fy = tkcFloorY(gx), j, f, k, a, b, cp, sp, px, py;
  if (x < -viewW * 0.9 || x > viewW + viewH * 0.5) return;
  if (g.state !== 'open' && g.state !== 'opening') tkcGlow(c, x, fy - viewH * 0.36, viewH * 0.1, '#bff6ff', g.state === 'sleep' ? 0.25 : 0.4);
  for (j = 0; j < g.flights.length; j++) {
    f = g.flights[j];
    if (f.t < 0) continue;
    k = easeInOutSine(Math.min(1, f.t / f.dur));
    cp = tkcNumPos(g, f.ci);
    a = { x: cp.x, y: cp.y - viewH * 0.06 };
    b = f.back ? a : tkcSocketPos(g, f.sock);
    if (f.back) { a = { x: gx, y: fy - viewH * 0.2 }; }
    px = a.x + (b.x - a.x) * k - camX;
    py = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * viewH * 0.1;
    tkcGlow(c, px, py, viewH * 0.03, f.col, 0.7);
    artCircle(c, px, py, viewH * 0.012, f.col, { lineColor: artShade(f.col, -0.45), hi: 0.5 });
  }
  if (g.state === 'opening' || (g.state === 'open' && g.t < 0.6)) {
    a = g.state === 'opening' ? 1 : 1 - g.t / 0.6;
    tkcGlow(c, x, fy - viewH * 0.22, viewH * 0.3, '#ffffff', 0.4 * a);
  }
}

// Laulava kristalli (luvun lahja): violetinsininen kolmen särmiön ryhmä
function tkcDrawGift(c, x, y, s, t) {
  var b = Math.sin(t * 2.2) * s * 0.03, col = '#8f9bff';
  tkcGlow(c, x, y, s * 0.75, '#b49cff', 0.5 + Math.sin(t * 3) * 0.1);
  c.save();
  c.translate(x, y + b);
  tkcPrism(c, -s * 0.17, s * 0.36, s * 0.2, s * 0.45, '#b49cff', -0.45);
  tkcPrism(c, s * 0.17, s * 0.36, s * 0.2, s * 0.42, '#7fb0ff', 0.45);
  tkcPrism(c, 0, s * 0.38, s * 0.28, s * 0.78, col, 0);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.arc(-s * 0.04, -s * 0.12, s * 0.035, 0, Math.PI * 2); c.fill();
  c.restore();
  if (s > viewH * 0.03) drawStar(c, x + s * 0.22, y - s * 0.3 + b, s * 0.06 * (1 + Math.sin(t * 5) * 0.4), t, 0);
}

// Vihjekäsi: valon raahaus eteen, mörön luo, numerokristalli tai säteeseen
function tkcDrawHint(c) {
  var p = tkc.pup, from = null, to = null, tap = null, g, i, cr, k, hx, hy, s = viewH * 0.045, sp;
  if (holding) return;
  if (tkc.state === 'walk' && tkc.rearT <= 0) {
    for (i = 0; i < tkc.critters.length; i++) {
      cr = tkc.critters[i];
      if (cr.state === 'creep' && Math.abs(cr.x - tkc.ux) < viewW * 0.45 && tkc.idleT > 1.2) {
        from = { x: p.x - camX, y: p.y };
        to = { x: cr.x - camX, y: tkcCritterY(cr) - viewH * 0.03 };
        break;
      }
    }
    if (!to && ((!tkc.everDragged && tkc.stT > 0.6) || tkc.darkT > 3.5)) {
      from = { x: p.x - camX, y: p.y };
      to = { x: tkc.ux - camX + viewW * 0.22, y: tkcFloorY(tkc.ux) - viewH * 0.17 };
    }
  } else if (tkc.state === 'gate') {
    g = tkc.gates[tkc.gi];
    if (g.state === 'puzzle' && !g.over && g.idle > 5 && g.flights.length === 0) {
      sp = tkcNumPos(g, tkcGateHint(g));
      tap = { x: sp.x - camX, y: sp.y - viewH * 0.13 };
    }
  } else if (tkc.state === 'sun' && tkc.idleT > 2) {
    from = { x: p.x - camX, y: p.y };
    to = { x: tkcSunX() - camX, y: viewH * 0.5 };
  }
  if (tap) {
    k = (globalT % 1.2) / 1.2;
    drawHand(c, tap.x + s * 0.15, tap.y - s * 0.9 - Math.abs(Math.sin(k * Math.PI)) * s * 0.6, s);
    if (k > 0.45 && k < 0.6) artPop(tap.x + camX, tap.y, viewH * 0.04, '#ffffff', 'ring');
    return;
  }
  if (!to) return;
  k = (globalT % 1.8) / 1.8;
  hx = from.x + (to.x - from.x) * easeInOutSine(Math.min(1, k * 1.25));
  hy = from.y + (to.y - from.y) * easeInOutSine(Math.min(1, k * 1.25));
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  if (k > 0.1) {
    c.globalAlpha *= 0.4;
    trekDrawPup(c, hx, hy, tkcPupR(), { mood: 'happy', t: globalT, glow: 0.5 });
    c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  }
  drawHand(c, hx + s * 0.1, hy - s * 0.2, s);
  c.globalAlpha = 1;
}

// HUD: kymmenen seinäkristallia
function tkcHudSlot(i) {
  var hs = viewH * 0.022, pad = hs * 1.4;
  return { x: hudX() + pad * 0.5 + hs * 1.3 + i * hs * 2.5, y: pad * 0.5 + hs * 2.55 };
}
function tkcDrawHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, top = pad * 0.5, i, sl, f, k, x, y, n = TKC_CRYSTAL_U.length, shown, bump, flying;
  if (tkc.state === 'rise' || tkc.state === 'done') c.globalAlpha = Math.max(0, 1 - tkc.end.t);
  drawHudPanel(c, hudX(), top, hs * 2.5 * n + pad * 0.6, hs * 3.4, hs);
  flying = {};
  for (i = 0; i < tkc.flyers.length; i++) flying[tkc.flyers[i].idx] = true;
  for (i = 0; i < n; i++) {
    sl = tkcHudSlot(i);
    shown = i < tkc.got && !flying[i];
    bump = shown && tkc.hudBump > 0 && i === tkc.got - 1 ? 1 + Math.sin(Math.PI * tkc.hudBump / 0.4) * 0.45 : 1;
    if (shown) {
      tkcGlow(c, sl.x, sl.y - hs * 0.7, hs * 1.6, TKC_CRY_COLS[i % 5], 0.45);
      tkcPrism(c, sl.x, sl.y + hs * 0.2 * bump, hs * 0.85 * bump, hs * 1.9 * bump, TKC_CRY_COLS[i % 5], 0);
    } else {
      c.strokeStyle = 'rgba(110,90,190,0.6)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(sl.x - hs * 0.42, sl.y + hs * 0.2); c.lineTo(sl.x - hs * 0.42, sl.y - hs * 1.17);
      c.lineTo(sl.x, sl.y - hs * 1.7); c.lineTo(sl.x + hs * 0.42, sl.y - hs * 1.17); c.lineTo(sl.x + hs * 0.42, sl.y + hs * 0.2);
      c.closePath();
      c.stroke();
    }
  }
  for (i = 0; i < tkc.flyers.length; i++) {
    f = tkc.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    sl = tkcHudSlot(f.idx);
    x = f.x0 + (sl.x - f.x0) * k;
    y = f.y0 + (sl.y - hs * 0.7 - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.1;
    tkcGlow(c, x, y, viewH * 0.05, f.col, 0.6);
    tkcPrism(c, x, y + hs, hs * 1.1, hs * 2.4, f.col, 0);
  }
  c.globalAlpha = 1;
}

// ---------- Kartan kuvake ----------
function tkcIcon(c, x, y, s) {
  var g = c.createRadialGradient(x, y, s * 0.05, x, y, s * 0.55), i, b = Math.sin(globalT * 2) * s * 0.02;
  g.addColorStop(0, '#4a3c98');
  g.addColorStop(1, '#16102e');
  c.fillStyle = g;
  c.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2);
  // Katto ja lattia
  c.fillStyle = '#2a2060';
  c.beginPath();
  c.moveTo(x - s * 0.6, y - s * 0.6);
  for (i = 0; i <= 6; i++) c.lineTo(x - s * 0.6 + i * s * 0.2, y - s * (0.36 - (i % 2) * 0.06));
  c.lineTo(x + s * 0.6, y - s * 0.6);
  c.closePath();
  c.fill();
  c.fillStyle = '#5a4aa8';
  c.beginPath();
  c.moveTo(x - s * 0.6, y + s * 0.6);
  c.lineTo(x - s * 0.6, y + s * 0.28);
  c.quadraticCurveTo(x, y + s * 0.2, x + s * 0.6, y + s * 0.3);
  c.lineTo(x + s * 0.6, y + s * 0.6);
  c.closePath();
  c.fill();
  // Hehkumadot
  for (i = 0; i < 4; i++) tkcGlow(c, x - s * 0.3 + i * s * 0.18, y - s * (0.26 - (i % 2) * 0.05), s * 0.05, '#b8fff0', 0.8);
  // Hohtava kristalli ja Pikkupilvi
  tkcGlow(c, x + s * 0.2, y + s * 0.05, s * 0.3, '#9fe8ff', 0.6);
  tkcPrism(c, x + s * 0.13, y + s * 0.26, s * 0.09, s * 0.2, '#c9a0ff', -0.4);
  tkcPrism(c, x + s * 0.2, y + s * 0.27, s * 0.12, s * 0.34, '#8fd3ff', 0);
  tkcPrism(c, x + s * 0.28, y + s * 0.26, s * 0.08, s * 0.18, '#ff9ec6', 0.45);
  trekDrawPup(c, x - s * 0.16, y - s * 0.02 + b, s * 0.13, { mood: 'wow', t: globalT, glow: 1, look: 0.6 });
}
