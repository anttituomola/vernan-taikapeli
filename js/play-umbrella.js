'use strict';

// Sateenvarjo (Kaukamaa, Myrskyvuori): pitkä ja helppo kenttä ilman sydämiä ja
// aikarajaa. Yksisarvinen kantaa prinsessaa itsestään mutkittelevaa vuoripolkua
// ylös huipulle, ja Myrskynoidan pilvet sataa ropsauttavat matkalla vettä ja
// pientä raetta.
//   Ohjaus: sormi raahaa isoa sateenkaarivarjoa (sormi pitää varren päästä,
//   varjo seuraa heti). Pisarat kimpoavat varjosta roiskahtaen ja rakeet
//   pomppaavat kilahtaen. Pilvi varoittaa ennen sadetta: se tummuu, mutisee
//   ja tiputtaa muutaman pisaran.
//   Kastuminen ei satu: prinsessa hytisee ja yksisarvinen hidastaa hetkeksi
//   ja ravistelee vedet pois. Kultainen sateenvarjo, jos prinsessa kastui
//   enintään UMBR_GOLD_WET kertaa.
//   Tavoite (HUD heti alussa): seitsemän aurinkokipinää, yksi jokaista
//   Kaukamaan sädettä kohti. Pilvien raosta laskeutuu kultainen säde, ja
//   kipinä leijuu alas; sen saa kiinni vain sateenvarjolla. Ohi mennyt
//   sammuu maahan, ja uusia tulee. Huipulla kipinät lentävät aurinkokiveen,
//   pilvet väistyvät ja aurinko nousee. Jos kipinöitä puuttuu, niitä
//   leijuu huipulle lisää.
//   Kaksi tehtäväkaarta polulla (kysymykseen vastaus kirjaimin, peilikuva).
//   Pilvien paikat, raekuurot ja kipinöiden paikat arvotaan joka kerta;
//   sade kestää loppua kohti pidempään ja rakeita tulee enemmän.
//   Tökättävät: vuorikauris (3. tökkäys: ilohyppy ja sydämet), kivikasa
//   (5. tökkäys: murmeli kurkkaa lehtisateenvarjon alta), lätäkön sammakko
//   (3. tökkäys: lumpeenlehti sateenvarjoksi), yksisarvinen hirnahtaa.
//   Matkan lopussa Myrskynoita istuu pilvellään, murjottaa ja lentää huipulle.

var UMBR_SPEED = 0.075;      // kävely × viewW / s
var UMBR_WET_SLOW = 0.35;    // nopeuskerroin, kun prinsessa hytisee
var UMBR_START = 0.3;        // lähtöpaikka × viewW
var UMBR_END = 0.42;         // huippu: maailman oikeasta reunasta × viewW
var UMBR_GOAL = 7;           // aurinkokipinät
var UMBR_R = 0.14;           // varjon säde × viewH
var UMBR_HANDLE = 0.2;       // varren pituus kuvun reunasta × viewH
var UMBR_PX = 0.33;          // yksisarvisen paikka ruudulla × viewW
var UMBR_TASK_F = [0.36, 0.68];  // tehtäväkaaret reitin osuutena
var UMBR_GOLD_WET = 2;       // kultainen sateenvarjo: kastui enintään näin monesti
var UMBR_WET_T = 1.4;        // hytinän kesto
var UMBR_WARN = 0.9;         // pilven varoitus ennen sadetta
var UMBR_POUR = [2.2, 3.4];  // sateen kesto reitin alussa / lopussa
var UMBR_REST = [1.8, 1.1];  // tauko sateiden välissä alussa / lopussa
var UMBR_HAIL = [0, 0.5];    // raekuurojen osuus alussa / lopussa
var UMBR_SPARK_GAP = [0.32, 0.46];  // kipinöiden väli × viewW (matkaa)
var UMBR_SPARK_FALL = 0.1;   // kipinän putoamisnopeus × viewH / s
var UMBR_PRIN_W = 0.085;     // prinsessan ja yksisarvisen osuma-alueen puolileveys × viewH
var UMBR_PRIN_H = 0.235;     // ... ja korkeus polusta × viewH

var umbr = {
  built: false, f: 0, walkPhase: 0, moving: false, wetT: 0, wetN: 0, ux: 0, uy: 0, uvx: 0, tilt: 0,
  clouds: [], sparks: [], drops: [], ripples: [], flyers: [], arches: [], got: 0,
  state: 'walk', t: 0, stopT: 0, sunT: 0, nextSparkX: 0, summitSpawnT: 0, hudBump: 0,
  everCaught: false, everCovered: false, idleT: 0, splashT: 0, neighT: 0, witch: null, won: false
};

// ---------- Apu ----------
function umbrRnd(a, b) { return a + Math.random() * (b - a); }
function umbrX() { return umbr.f * worldW; }
function umbrStartX() { return viewW * UMBR_START; }
function umbrSummitX() { return worldW - viewW * UMBR_END; }
// Reitin osuus 0..1 (lähtö -> huippu)
function umbrProg(x) { return Math.max(0, Math.min(1, (x - umbrStartX()) / (umbrSummitX() - umbrStartX()))); }
function umbrLerp(a, k) { return a[0] + (a[1] - a[0]) * k; }
// Polun pinta (yksisarvisen jalat) maailman x:ssä: nousee loivasti ylös, huipulla tasainen
function umbrPathY(x) {
  var f = x / Math.max(1, worldW), y = 0.8 - 0.06 * f + 0.022 * Math.sin(f * 19) + 0.012 * Math.sin(f * 47 + 1.3);
  var top = 0.725, k = (x - (umbrSummitX() - viewW * 0.3)) / (viewW * 0.25);
  if (k > 0) y = y + (top - y) * easeInOutSine(Math.min(1, k));
  return viewH * y;
}
function umbrUS() { return viewH / 800 * 1.6; }
function umbrCamFor(x) { return Math.min(Math.max(x - viewW * UMBR_PX, 0), Math.max(0, worldW - viewW)); }
// Kuvun yläpinta (ruudulla) etäisyydellä dx keskeltä
function umbrDomeTop(dx) {
  var R = viewH * UMBR_R, k = Math.max(0, 1 - (dx / R) * (dx / R));
  return umbr.uy - R * 0.64 * Math.sqrt(k);
}
// Varjon paikka prinsessan yllä (alku ja vihjekäsi)
function umbrCoverPos() {
  var x = umbrX();
  return { x: x - camX, y: umbrPathY(x) - viewH * 0.29 };
}
function umbrHudSlot(i) {
  var hs = viewH * 0.022, pad = hs * 1.4;
  return { x: hudX() + pad * 0.5 + hs * 1.6 + i * hs * 3.2, y: pad * 0.5 + hs * 1.7 };
}
// Aurinkokivi huipulla (maailmakoordinaatit) ja sen seitsemän koloa
function umbrStonePos() {
  var x = worldW - viewW * 0.2;
  return { x: x, y: umbrPathY(x) - viewH * 0.02, r: viewH * 0.1 };
}
function umbrStoneSlot(i) {
  var st = umbrStonePos(), a = Math.PI + (i / (UMBR_GOAL - 1)) * Math.PI;
  return { x: st.x + Math.cos(a) * st.r * 0.68, y: st.y - st.r * 1.05 + Math.sin(a) * st.r * 0.68 };
}

// ---------- Maailma ----------
// Paikat tallennetaan maailman osuuksina (x / worldW), joten koon muutos
// vaatii vain koristeiden uudelleenrakennuksen.
function umbrBuild() {
  var x, prog, i, sx = umbrStartX(), ex = umbrSummitX();
  umbr.clouds = [];
  x = sx + viewW * 0.75;
  while (x < ex - viewW * 0.45) {
    prog = umbrProg(x);
    umbr.clouds.push({
      f: x / worldW, v: umbrRnd(0.15, 0.24), s: umbrRnd(0.11, 0.15), hail: prog > 0.25 && Math.random() < umbrLerp(UMBR_HAIL, prog),
      state: 'rest', t: Math.random() * 1.2, rest: 1.2, ph: Math.random() * 6, spawn: 0, clear: 0, poke: 0
    });
    x += viewW * umbrRnd(0.5, 0.78);
  }
  umbr.arches = [];
  for (i = 0; i < UMBR_TASK_F.length; i++) umbr.arches.push({ k: UMBR_TASK_F[i], task: i, state: 'wait', t: 0 });
  // Noita odottaa pilvellään viimeisen mutkan takana
  umbr.witch = { k: 0.9, state: 'sit', t: 0, x: 0, y: 0 };
}
function umbrArchX(a) { return umbrStartX() + (umbrSummitX() - umbrStartX()) * a.k; }

// ---------- Alustus ----------
function initUmbrella() {
  tasks = [makeTask(-5, 'answer'), makeTask(-5, 'mirror')];
  // Kaaret käynnistetään itse (umbrUpdateWalk), ei updateTasksin etäisyydestä
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  umbr.f = umbrStartX() / Math.max(1, worldW);
  umbrBuild();
  umbr.built = true;
  umbr.walkPhase = 0;
  umbr.moving = false;
  umbr.wetT = 0;
  umbr.wetN = 0;
  umbr.sparks = [];
  umbr.drops = [];
  umbr.ripples = [];
  umbr.flyers = [];
  umbr.got = 0;
  umbr.state = 'walk';
  umbr.t = 0;
  umbr.stopT = 0;
  umbr.sunT = 0;
  umbr.nextSparkX = umbrStartX() + viewW * 0.1;
  umbr.summitSpawnT = 0;
  umbr.hudBump = 0;
  umbr.everCaught = false;
  umbr.everCovered = false;
  umbr.idleT = 0;
  umbr.splashT = 0;
  umbr.neighT = 0;
  umbr.won = false;
  camX = umbrCamFor(umbrX());
  var cp = umbrCoverPos();
  umbr.ux = cp.x;
  umbr.uy = cp.y;
  umbr.uvx = 0;
  umbr.tilt = 0;
  umbrSetupProps();
  renderBackground();
  playNote(392, 0, 0.2, 'sine', 0.25);
  playNote(494, 0.12, 0.2, 'sine', 0.25);
  playNote(587, 0.24, 0.3, 'triangle', 0.25);
}
function respawnUmbrella() {}
function resizeUmbrella() {
  var cp;
  if (!umbr.built) return;
  camX = umbrCamFor(umbrX());
  umbr.drops = [];
  umbr.ripples = [];
  cp = umbrCoverPos();
  umbr.ux = Math.min(Math.max(umbr.ux, 0), viewW);
  umbr.uy = cp.y;
  umbrSetupProps();
}

// ---------- Tökättävät koristeet ----------
function umbrSetupProps() {
  var W = worldW, sx = umbrStartX(), ex = umbrSummitX(), i, x, k;
  propsReset();
  // Vuorikauriit kalliolla polun takana
  for (i = 0; i < 2; i++) {
    x = sx + (ex - sx) * (0.18 + i * 0.5);
    umbrAddGoat(x, umbrPathY(x) - viewH * 0.045, viewH * 0.05, i ? -1 : 1);
  }
  // Kivikasat
  for (i = 0; i < 3; i++) {
    x = sx + (ex - sx) * (0.08 + i * 0.33) + viewW * 0.12;
    umbrAddCairn(x, umbrPathY(x) - viewH * 0.035, viewH * 0.045);
  }
  // Lätäköt ja sammakot polun etureunassa (piirretään yksisarvisen eteen)
  for (i = 0; i < 4; i++) {
    k = 0.12 + i * 0.25;
    x = sx + (ex - sx) * k - viewW * 0.08;
    umbrAddFrog(x, umbrPathY(x) + viewH * 0.085, viewH * 0.032);
  }
  // Huipun viirit
  umbrAddFlag(W - viewW * 0.08, umbrPathY(W - viewW * 0.08) - viewH * 0.01, viewH * 0.11);
}
// Vuorikauris: laventelinvalkoinen, kiertyneet sarvet; katsoo varjoa
function umbrAddGoat(x, y, s, face) {
  propAdd({
    x: x, y: y, r: s * 1.6, hy: s * 0.9, color: '#ffffff', note: 523, amp: 0.1, hopT: 0, face: face, chewT: Math.random() * 3,
    update: function (p, dt) {
      if (p.hopT > 0) p.hopT -= dt;
      p.chewT += dt;
    },
    poke: function (p) {
      playNote(392, 0, 0.09, 'sawtooth', 0.08);
      playNote(370, 0.09, 0.09, 'sawtooth', 0.08);
      playNote(392, 0.18, 0.16, 'sawtooth', 0.08);
      if (p.n % 3 === 0) {
        p.hopT = 0.8;
        spawnSparkles(p.x, p.y - s * 2, 8, '#ff9fb8');
        artPop(p.x, p.y - s * 2.2, s * 0.8, '#ff7bac', 'burst');
      }
    },
    draw: function (c, p) {
      var hop = p.hopT > 0 ? Math.sin((0.8 - p.hopT) / 0.8 * Math.PI) * s * 1.2 : 0, i;
      // Kallio
      artShadow(c, 0, s * 0.35, s * 1.6, s * 0.3, 0.16);
      artBlob(c, 0, s * 0.05, s * 1.5, s * 0.45, '#a99ad6', { lineColor: '#5e4f8e', hi: 0.25 });
      c.save();
      c.translate(0, -hop);
      c.scale(p.face, 1);
      for (i = 0; i < 4; i++) artLimb(c, (-0.55 + i * 0.36) * s, -s * 0.55, (-0.6 + i * 0.38) * s, -s * 0.1, s * 0.16, i % 2 ? '#e6dcf6' : '#f8f4ff', '#8a7ab0');
      artBlob(c, 0, -s * 0.72, s * 0.75, s * 0.42, '#ffffff', { lineColor: '#8a7ab0', shadeTo: '#e3d8f5', hi: 0.3 });
      artLimb(c, s * 0.45, -s * 0.85, s * 0.7, -s * 1.2, s * 0.26, '#ffffff', '#8a7ab0');
      artBlob(c, s * 0.82, -s * 1.28, s * 0.3, s * 0.24, '#ffffff', { lineColor: '#8a7ab0', shadeTo: '#e3d8f5' });
      // Sarvet
      c.strokeStyle = '#b8945a'; c.lineWidth = s * 0.1; c.lineCap = 'round';
      c.beginPath(); c.arc(s * 0.62, -s * 1.5, s * 0.2, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
      artEye(c, s * 0.9, -s * 1.33, s * 0.07, 0.4, (p.chewT % 3.7) < 0.12);
      // Parta
      artBlob(c, s * 0.95, -s * 1.03, s * 0.08, s * 0.14, '#efe8fa', { lineColor: '#8a7ab0', line: Math.max(1, s * 0.03) });
      c.restore();
    }
  });
}
// Kivikasa: viides tökkäys tuo murmelin kurkkaamaan lehtisateenvarjon alta
function umbrAddCairn(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.2, hy: s * 0.8, color: '#d8ccf2', note: 440, amp: 0.08, peekT: 0,
    update: function (p, dt) { if (p.peekT > 0) p.peekT -= dt; },
    poke: function (p) {
      if (p.n % 5 === 0) {
        p.peekT = 3;
        playNote(1175, 0.1, 0.08, 'sine', 0.18);
        playNote(1568, 0.2, 0.12, 'sine', 0.18);
        spawnSparkles(p.x + s * 0.9, p.y - s * 0.6, 6, '#8fe38f');
      }
    },
    draw: function (c, p) {
      var k = p.peekT > 0 ? Math.min(1, Math.min(p.peekT, 3 - p.peekT) * 3) : 0;
      artShadow(c, 0, s * 0.1, s * 1.3, s * 0.25, 0.16);
      if (k > 0) {
        // Murmeli ja lumpeenlehti
        c.save();
        c.translate(s * 0.9, -s * 0.15 * k);
        artBlob(c, 0, -s * 0.35, s * 0.3, s * 0.35, '#c8945a', { lineColor: '#6a4a2a', hi: 0.25 });
        artEye(c, -s * 0.1, -s * 0.48, s * 0.06, -0.2, false);
        artEye(c, s * 0.1, -s * 0.48, s * 0.06, 0.2, false);
        artBlob(c, 0, -s * 0.35, s * 0.08, s * 0.05, '#5a3a20', { line: false });
        artLimb(c, s * 0.2, -s * 0.3, s * 0.3, -s * 1.0, s * 0.05, '#5aa84a', '#2f6a2c');
        c.beginPath(); c.arc(s * 0.3, -s * 0.95, s * 0.42, Math.PI, 0); c.closePath();
        artFillPath(c, '#6cc45c', -s * 1.4, -s * 0.95, s * 0.4, { lineColor: '#2f7a2c' });
        c.restore();
      }
      artBlob(c, 0, -s * 0.22, s * 0.8, s * 0.3, '#b3a6dc', { lineColor: '#5e4f8e', hi: 0.2 });
      artBlob(c, -s * 0.05, -s * 0.66, s * 0.55, s * 0.24, '#c4b8e8', { lineColor: '#5e4f8e', hi: 0.2 });
      artBlob(c, s * 0.05, -s * 1.0, s * 0.33, s * 0.18, '#d4caf0', { lineColor: '#5e4f8e', hi: 0.3 });
    }
  });
}
// Lätäkkö ja sammakko: kolmas tökkäys avaa lumpeenlehden sateenvarjoksi
function umbrAddFrog(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.8, hy: s * 0.5, color: '#8fe38f', note: 330, amp: 0.06, layer: 1, hopT: 0, leafT: 0, blink: Math.random() * 4,
    update: function (p, dt) {
      if (p.hopT > 0) p.hopT -= dt;
      if (p.leafT > 0) p.leafT -= dt;
      p.blink += dt;
    },
    poke: function (p) {
      p.hopT = 0.6;
      playNote(196, 0, 0.08, 'square', 0.1);
      playNote(147, 0.08, 0.12, 'square', 0.1);
      umbrRipple(p.x, p.y, s * 1.2);
      if (p.n % 3 === 0) {
        p.leafT = 4;
        playNote(784, 0.15, 0.1, 'triangle', 0.18);
        playNote(1047, 0.25, 0.15, 'triangle', 0.18);
      }
    },
    draw: function (c, p) {
      var hop = p.hopT > 0 ? Math.sin((0.6 - p.hopT) / 0.6 * Math.PI) * s * 1.4 : 0;
      artBlob(c, 0, 0, s * 2.0, s * 0.5, '#8fb8f0', { lineColor: '#4a78b8', line: Math.max(1, s * 0.06) });
      artHighlight(c, -s * 0.7, -s * 0.12, s * 0.5, s * 0.1, 0.5);
      c.save();
      c.translate(s * 0.2, -hop);
      if (p.leafT > 0) {
        artLimb(c, s * 0.4, -s * 0.5, s * 0.5, -s * 1.7, s * 0.08, '#5aa84a', '#2f6a2c');
        c.beginPath(); c.arc(s * 0.5, -s * 1.65, s * 0.8, Math.PI, 0); c.closePath();
        artFillPath(c, '#6cc45c', -s * 2.4, -s * 1.65, s * 0.8, { lineColor: '#2f7a2c' });
      }
      artBlob(c, 0, -s * 0.35, s * 0.6, s * 0.42, '#7fd46a', { lineColor: '#3a8a3a', hi: 0.3 });
      artCircle(c, -s * 0.28, -s * 0.78, s * 0.2, '#7fd46a', { lineColor: '#3a8a3a' });
      artCircle(c, s * 0.28, -s * 0.78, s * 0.2, '#7fd46a', { lineColor: '#3a8a3a' });
      artEye(c, -s * 0.28, -s * 0.8, s * 0.12, 0, (p.blink % 4) < 0.12);
      artEye(c, s * 0.28, -s * 0.8, s * 0.12, 0, (p.blink % 4) < 0.12);
      c.strokeStyle = '#2a6a2a'; c.lineWidth = Math.max(1, s * 0.06); c.lineCap = 'round';
      c.beginPath(); c.arc(0, -s * 0.42, s * 0.25, 0.3, Math.PI - 0.3); c.stroke();
      artBlush(c, -s * 0.35, -s * 0.38, s * 0.1);
      artBlush(c, s * 0.35, -s * 0.38, s * 0.1);
      c.restore();
    }
  });
}
// Huipun sateenkaariviiri
function umbrAddFlag(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.6, hy: s * 0.7, color: '#ffd24f', note: 659, amp: 0.12,
    poke: function (p) { spawnSparkles(p.x, p.y - s * 0.8, 6, RAINBOW_COLORS[p.n % 7]); },
    draw: function (c, p) {
      var i, wv = Math.sin(globalT * 3) * s * 0.03;
      artShadow(c, 0, 0, s * 0.2, s * 0.05, 0.16);
      artLimb(c, 0, 0, 0, -s, s * 0.05, '#c8a070', '#6a4a2a');
      for (i = 0; i < 6; i++) {
        c.fillStyle = RAINBOW_COLORS[i];
        c.beginPath();
        c.moveTo(0, -s + i * s * 0.06);
        c.quadraticCurveTo(s * 0.25, -s + i * s * 0.06 + wv, s * 0.5, -s + i * s * 0.06 + wv * 2);
        c.lineTo(s * 0.5, -s + (i + 1) * s * 0.06 + wv * 2);
        c.quadraticCurveTo(s * 0.25, -s + (i + 1) * s * 0.06 + wv, 0, -s + (i + 1) * s * 0.06);
        c.closePath();
        c.fill();
      }
      artCircle(c, 0, -s * 1.02, s * 0.05, '#ffd24f', { lineColor: '#b8862a' });
    }
  });
}
function umbrRipple(x, y, r) {
  if (umbr.ripples.length > 40) umbr.ripples.shift();
  umbr.ripples.push({ x: x, y: y, r: r, t: 0 });
}

// ---------- Syöte ----------
function handleUmbrellaTap(px, py) {
  var x, y, us = umbrUS();
  if (!umbr.built || celebrating || puzzleBusy()) return;
  umbr.idleT = 0;
  // Napautus tarttuu aina varjoon (se tulee sormen kohdalle); samalla
  // yksisarvinen hirnahtaa tai koriste heilahtaa. Prinsessan napautus tuo
  // siis varjon suoraan hänen ylleen.
  x = umbrX() - camX; y = umbrPathY(umbrX());
  if (Math.abs(px - x) < us * 45 && py > y - us * 70 && py < y + us * 4) {
    if (umbr.neighT <= 0) {
      umbr.neighT = 1;
      playNote(660, 0, 0.12, 'triangle', 0.2);
      playNote(880, 0.1, 0.12, 'triangle', 0.2);
      playNote(740, 0.2, 0.2, 'triangle', 0.18);
      spawnSparkles(umbrX(), y - us * 70, 6, '#ff9fb8');
    }
    return;
  }
  propsTap(px + camX, py);
}

// ---------- Päivitys ----------
function updateUmbrella(dt) {
  var busy;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (!umbr.built) return;
  busy = puzzleBusy();
  if (umbr.hudBump > 0) umbr.hudBump -= dt;
  if (umbr.splashT > 0) umbr.splashT -= dt;
  if (umbr.neighT > 0) umbr.neighT -= dt;
  umbrUpdateUmbrella(dt, busy);
  umbrUpdateFlyers(dt);
  umbrUpdateRipples(dt);
  if (busy) return;
  umbr.t += dt;
  umbr.idleT += dt;
  umbrUpdateWalk(dt);
  umbrUpdateClouds(dt);
  umbrUpdateDrops(dt);
  umbrUpdateSparks(dt);
  umbrUpdateWitch(dt);
  umbrUpdateSummit(dt);
  camX += (umbrCamFor(umbrX()) - camX) * Math.min(1, dt * 5);
}
// Varjo seuraa sormea; sormi pitää varren päästä
function umbrUpdateUmbrella(dt, busy) {
  var tx, ty, k, ox = umbr.ux, py = umbrPathY(umbrX());
  if (holding && !busy && !celebrating) {
    tx = lastPX;
    ty = lastPY - viewH * UMBR_HANDLE;
    ty = Math.min(Math.max(ty, viewH * 0.13), py - viewH * 0.27);
    tx = Math.min(Math.max(tx, viewH * 0.05), viewW - viewH * 0.05);
    k = 1 - Math.exp(-dt * 18);
    umbr.ux += (tx - umbr.ux) * k;
    umbr.uy += (ty - umbr.uy) * k;
    umbr.idleT = 0;
  }
  umbr.uvx = dt > 0 ? (umbr.ux - ox) / dt : 0;
  k = Math.max(-0.35, Math.min(0.35, -umbr.uvx / viewH * 0.12));
  umbr.tilt += (k - umbr.tilt) * Math.min(1, dt * 8);
}
function umbrCovering() {
  var x = umbrX() - camX;
  return Math.abs(umbr.ux - x) < viewH * (UMBR_R - UMBR_PRIN_W * 0.4);
}
// Yksisarvinen kävelee itsestään: pysähtyy tehtäväkaarelle ja huipulle
function umbrUpdateWalk(dt) {
  var x = umbrX(), sp, stop = umbrSummitX(), i, a, ax;
  if (umbr.wetT > 0) {
    umbr.wetT -= dt;
    if (umbr.wetT <= 0) {
      // Ravistelee vedet pois
      spawnSparkles(x, umbrPathY(x) - viewH * 0.12, 10, '#a8d0ff');
      playNote(880, 0, 0.06, 'sine', 0.12);
      playNote(988, 0.06, 0.06, 'sine', 0.12);
      playNote(1175, 0.12, 0.1, 'sine', 0.12);
    }
  }
  umbr.moving = false;
  if (umbr.state === 'walk') {
    for (i = 0; i < umbr.arches.length; i++) {
      a = umbr.arches[i];
      ax = umbrArchX(a) - viewH * 0.14;
      if (a.state !== 'open' && ax < stop) stop = ax;
    }
    sp = viewW * UMBR_SPEED * (umbr.wetT > 0 ? UMBR_WET_SLOW : 1);
    if (x < stop) {
      x = Math.min(stop, x + sp * dt);
      umbr.moving = true;
      umbr.walkPhase += dt * 9 * (umbr.wetT > 0 ? UMBR_WET_SLOW : 1);
    }
    umbr.f = x / worldW;
    if (x >= umbrSummitX() - 0.5) { umbr.state = 'summit'; umbr.stopT = 0; }
  }
  // Tehtäväkaaret
  for (i = 0; i < umbr.arches.length; i++) {
    a = umbr.arches[i];
    a.t += dt;
    if (a.state === 'wait' && x >= umbrArchX(a) - viewH * 0.14 - 1) {
      a.state = 'ask'; a.t = 0;
    } else if (a.state === 'ask') {
      if (tasks[a.task].opened) {
        a.state = 'open';
        playNote(523, 0, 0.2, 'triangle', 0.3);
        playNote(784, 0.15, 0.3, 'triangle', 0.3);
      } else if (a.t > 0.6 && !activeTask) {
        taskStart(tasks[a.task]);
      }
    }
  }
}
// Pilvet: lepo -> varoitus -> sade. Vain ruudun lähellä olevat pilvet sataa.
function umbrUpdateClouds(dt) {
  var i, cl, sx, prog, S, n, H = viewH;
  for (i = 0; i < umbr.clouds.length; i++) {
    cl = umbr.clouds[i];
    if (cl.poke > 0) cl.poke -= dt;
    if (umbr.state === 'sun' || umbr.state === 'done') {
      cl.clear = Math.min(1, cl.clear + dt * 0.7);
      cl.state = 'rest';
      continue;
    }
    sx = cl.f * worldW - camX;
    if (sx < -viewW * 0.3 || sx > viewW * 1.25) continue;
    prog = umbrProg(cl.f * worldW);
    cl.t += dt;
    if (cl.state === 'rest' && cl.t > cl.rest) {
      cl.state = 'warn'; cl.t = 0;
      if (sx > 0 && sx < viewW) {
        playNote(98, 0, 0.35, 'triangle', 0.12);
        playNote(87, 0.2, 0.4, 'triangle', 0.1);
      }
    } else if (cl.state === 'warn' && cl.t > UMBR_WARN) {
      cl.state = 'pour'; cl.t = 0;
      cl.dur = umbrLerp(UMBR_POUR, prog) + Math.random() * 0.5;
    } else if (cl.state === 'pour' && cl.t > cl.dur) {
      cl.state = 'rest'; cl.t = 0;
      cl.rest = umbrLerp(UMBR_REST, prog) + Math.random() * 1.2;
    }
    if (cl.state === 'warn' || cl.state === 'pour') {
      S = cl.s * H;
      cl.spawn += dt * (cl.state === 'warn' ? 3 : (cl.hail ? 8 : 24));
      while (cl.spawn >= 1) {
        cl.spawn -= 1;
        n = umbrCloudCenter(cl);
        umbr.drops.push({
          x: n.x + umbrRnd(-1, 1) * S * 0.95, y: n.y + S * 0.3, vx: -H * 0.05 + umbrRnd(-1, 1) * H * 0.01,
          vy: H * (cl.hail ? 0.7 : 0.95) * umbrRnd(0.9, 1.1), hail: cl.hail, bounced: false, t: 0
        });
      }
    }
  }
}
// Pilven keskikohta maailmassa (leijuu hiukan)
function umbrCloudCenter(cl) {
  var wob = cl.state === 'warn' ? Math.sin(globalT * 30) * viewH * 0.004 : 0;
  return { x: cl.f * worldW + Math.sin(globalT * 0.5 + cl.ph) * viewH * 0.03 + wob, y: cl.v * viewH + Math.sin(globalT * 0.8 + cl.ph) * viewH * 0.008 };
}
function umbrUpdateDrops(dt) {
  var i, d, sx, R = viewH * UMBR_R, ux = umbr.ux, x = umbrX(), px = x - camX, py = umbrPathY(x), gy, cover;
  for (i = umbr.drops.length - 1; i >= 0; i--) {
    d = umbr.drops[i];
    d.t += dt;
    if (d.bounced) d.vy += viewH * 2.2 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    sx = d.x - camX;
    // Sateenvarjo
    if (!d.bounced && Math.abs(sx - ux) < R && d.y >= umbrDomeTop(sx - ux) && d.y <= umbr.uy + viewH * 0.045) {
      umbr.everCovered = true;
      if (d.hail) {
        d.bounced = true;
        d.y = umbrDomeTop(sx - ux) - 2;
        d.vy = -viewH * umbrRnd(0.35, 0.55);
        d.vx = (sx - ux) / R * viewH * 0.5 + umbr.uvx * 0.3;
        if (umbr.splashT <= 0) { umbr.splashT = 0.06; playNote(1800 + Math.random() * 600, 0, 0.04, 'triangle', 0.06); }
      } else {
        if (Math.random() < 0.35) spawnSparkles(d.x, d.y, 2, '#b8d4ff');
        if (umbr.splashT <= 0) { umbr.splashT = 0.08; playNote(1100 + Math.random() * 500, 0, 0.03, 'sine', 0.05); }
        umbr.drops.splice(i, 1);
      }
      continue;
    }
    // Prinsessa ja yksisarvinen
    if (!d.bounced && Math.abs(sx - px) < viewH * UMBR_PRIN_W && d.y > py - viewH * UMBR_PRIN_H && d.y < py) {
      umbrSoak();
      umbr.drops.splice(i, 1);
      continue;
    }
    gy = umbrPathY(d.x) + viewH * 0.01;
    if (d.y > gy || d.t > 3) {
      if (!d.hail && Math.random() < 0.4) umbrRipple(d.x, gy, viewH * 0.012);
      umbr.drops.splice(i, 1);
    }
  }
  cover = umbrCovering();
  if (cover && umbrRainNear()) umbr.everCovered = true;
}
function umbrRainNear() {
  var i, cl, x = umbrX();
  for (i = 0; i < umbr.clouds.length; i++) {
    cl = umbr.clouds[i];
    if ((cl.state === 'warn' || cl.state === 'pour') && Math.abs(umbrCloudCenter(cl).x - x) < viewH * (cl.s + 0.12)) return cl;
  }
  return null;
}
function umbrSoak() {
  if (umbr.wetT <= 0) {
    umbr.wetN++;
    playNote(330, 0, 0.08, 'square', 0.07);
    playNote(311, 0.08, 0.08, 'square', 0.07);
    playNote(294, 0.16, 0.08, 'square', 0.07);
    playNote(277, 0.24, 0.14, 'square', 0.07);
  }
  umbr.wetT = UMBR_WET_T;
}
// Aurinkokipinät: säde pilvien raosta, sitten kipinä leijuu alas
function umbrUpdateSparks(dt) {
  var i, sp, x = umbrX(), sx, R = viewH * UMBR_R, dx, dy, need;
  need = umbr.got + umbr.sparks.length < UMBR_GOAL + 2 && umbr.got < UMBR_GOAL;
  if (umbr.state === 'walk' && umbr.moving && need && x >= umbr.nextSparkX) {
    umbrSpawnSpark(camX + viewW * umbrRnd(0.55, 0.88));
    umbr.nextSparkX = x + viewW * umbrRnd(UMBR_SPARK_GAP[0], UMBR_SPARK_GAP[1]);
  }
  for (i = umbr.sparks.length - 1; i >= 0; i--) {
    sp = umbr.sparks[i];
    sp.t += dt;
    if (sp.state === 'beam') {
      if (sp.t > 0.9) { sp.state = 'fall'; sp.t = 0; playNote(1319, 0, 0.12, 'sine', 0.15); }
    } else if (sp.state === 'fall') {
      sp.y += viewH * UMBR_SPARK_FALL * dt;
      sp.x = sp.x0 + Math.sin(sp.t * 1.6 + sp.ph) * viewH * 0.025;
      sx = sp.x - camX;
      dx = (sx - umbr.ux) / R;
      dy = (sp.y - (umbr.uy - R * 0.25)) / (R * 0.75);
      if (dx * dx + dy * dy <= 1.15 && umbr.got < UMBR_GOAL) {
        umbrCatch(sp);
        umbr.sparks.splice(i, 1);
        continue;
      }
      if (sp.y > umbrPathY(sp.x) - viewH * 0.02) { sp.state = 'fade'; sp.t = 0; playNote(392, 0, 0.12, 'sine', 0.1); }
    } else if (sp.state === 'fade' && sp.t > 0.7) {
      umbr.sparks.splice(i, 1);
    }
  }
}
function umbrSpawnSpark(wx) {
  umbr.sparks.push({ x0: wx, x: wx, y: viewH * 0.08, t: 0, state: 'beam', ph: Math.random() * 6 });
}
function umbrCatch(sp) {
  var sx = sp.x - camX, idx = umbr.got, i;
  umbr.got++;
  umbr.everCaught = true;
  artPop(sp.x, sp.y, viewH * 0.05, '#ffd24f', 'burst');
  spawnSparkles(sp.x, sp.y, 10, '#ffe27a');
  for (i = 0; i < 3; i++) playNote(784 * Math.pow(1.122, idx + i * 2), i * 0.07, 0.18, 'triangle', 0.25);
  umbr.flyers.push({ x0: sx, y0: sp.y, idx: idx, t: 0, dur: 0.65 });
}
function umbrUpdateFlyers(dt) {
  var i, f;
  for (i = umbr.flyers.length - 1; i >= 0; i--) {
    f = umbr.flyers[i];
    f.t += dt;
    if (f.t >= f.dur) { umbr.hudBump = 0.4; umbr.flyers.splice(i, 1); }
  }
}
function umbrUpdateRipples(dt) {
  var i;
  for (i = umbr.ripples.length - 1; i >= 0; i--) {
    umbr.ripples[i].t += dt;
    if (umbr.ripples[i].t > 0.5) umbr.ripples.splice(i, 1);
  }
}
// Myrskynoita murjottaa pilvellään ja lentää huipulle, kun yksisarvinen lähestyy
function umbrUpdateWitch(dt) {
  var w = umbr.witch, wx = umbrStartX() + (umbrSummitX() - umbrStartX()) * w.k;
  w.t += dt;
  if (w.state === 'sit') {
    w.x = wx; w.y = viewH * 0.2;
    if (wx - umbrX() < viewW * 0.45) {
      w.state = 'fly'; w.t = 0;
      playNote(784, 0, 0.08, 'square', 0.1);
      playNote(698, 0.09, 0.08, 'square', 0.1);
      playNote(622, 0.18, 0.08, 'square', 0.1);
      playNote(587, 0.27, 0.16, 'square', 0.1);
    }
  } else if (w.state === 'fly') {
    w.x += viewW * 0.35 * dt;
    w.y -= viewH * 0.12 * dt;
    if (w.t > 4) w.state = 'gone';
  }
}
// Huippu: kipinät aurinkokiveen, pilvet väistyvät ja aurinko nousee
function umbrUpdateSummit(dt) {
  if (umbr.state === 'summit') {
    umbr.stopT += dt;
    if (umbr.got >= UMBR_GOAL && umbr.flyers.length === 0 && umbr.stopT > 0.6) {
      umbr.state = 'sun';
      umbr.sunT = 0;
      umbr.drops = [];
      playNote(523, 0, 0.3, 'triangle', 0.3);
      return;
    }
    // Puuttuvia kipinöitä leijuu huipulle lisää
    umbr.summitSpawnT += dt;
    if (umbr.got < UMBR_GOAL && umbr.summitSpawnT > 2.2 && umbr.sparks.length < 2) {
      umbr.summitSpawnT = 0;
      umbrSpawnSpark(camX + viewW * umbrRnd(0.3, 0.8));
    }
  } else if (umbr.state === 'sun') {
    var prev = umbr.sunT, i, sl;
    umbr.sunT += dt;
    // Kipinät lentävät koloihinsa yksi kerrallaan
    for (i = 0; i < UMBR_GOAL; i++) {
      if (prev < 0.3 + i * 0.25 + 0.55 && umbr.sunT >= 0.3 + i * 0.25 + 0.55) {
        sl = umbrStoneSlot(i);
        artPop(sl.x, sl.y, viewH * 0.03, RAINBOW_COLORS[i], 'ring');
        playNote(523 * Math.pow(1.122, i), 0, 0.2, 'triangle', 0.25);
      }
    }
    if (prev < 2.6 && umbr.sunT >= 2.6) {
      var st = umbrStonePos();
      artPop(st.x, st.y - st.r, viewH * 0.2, '#ffe27a', 'burst');
      spawnSparkles(st.x, st.y - st.r, 24, '#ffe27a');
      artShakeStart(viewH * 0.006, 0.4);
      soundFanfare();
    }
    if (umbr.sunT > 4.2 && !umbr.won) {
      umbr.won = true;
      umbr.state = 'done';
      startCelebration();
    }
  }
}

// ---------- Piirto: tausta ----------
var UMBR_HAZE = '#e6defa';
function umbrellaLayers() {
  return [
    { speed: 0.15, render: renderUmbrellaFar },
    { speed: 0.45, render: renderUmbrellaMid },
    { speed: 1, render: renderUmbrellaNear }
  ];
}
function renderUmbrellaBg(b, w, h) {
  renderUmbrellaFar(b, w, h);
  renderUmbrellaMid(b, w, h);
  renderUmbrellaNear(b, w, h);
}
function renderUmbrellaFar(b, w, h) {
  var i, x, y, horizon = h * 0.62, g, px, pk;
  g = b.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#9a8fd8');
  g.addColorStop(0.55, '#cfc3f2');
  g.addColorStop(1, '#f6eefc');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Kalpea aurinko kurkkaa pilven takaa
  drawBgSun(b, w * 0.06 + viewW * 0.1, h * 0.15, h * 0.055, 0.15, '#fff4c8', '#fffdf0', '#ffe08a');
  b.fillStyle = 'rgba(210,200,240,0.95)';
  cloudShape(b, w * 0.06 + viewW * 0.1 + h * 0.07, h * 0.18, h * 0.035);
  for (i = 0; i < 10; i++) {
    x = w * (0.03 + i * 0.1);
    drawCloud(b, x, h * (0.07 + (i % 3) * 0.06), h * (0.022 + (i % 2) * 0.01), 0.55);
  }
  // Kaukaiset vuoret laventelina
  fillHillBand(b, w, h, horizon, artMix('#a596d6', UMBR_HAZE, 0.5), function (px) {
    return horizon - h * 0.12 - Math.abs(Math.sin(px * 0.004 + 0.4)) * h * 0.13 - Math.sin(px * 0.013) * h * 0.02;
  });
  b.fillStyle = 'rgba(255,255,255,0.7)';
  for (i = 0; i < 14; i++) {
    x = w * (0.02 + i * 0.072);
    y = horizon - h * 0.12 - Math.abs(Math.sin(x * 0.004 + 0.4)) * h * 0.13 - Math.sin(x * 0.013) * h * 0.02;
    b.beginPath(); b.moveTo(x - h * 0.025, y + h * 0.03); b.lineTo(x, y); b.lineTo(x + h * 0.025, y + h * 0.03); b.closePath(); b.fill();
  }
  // Pieni sateenkaari kurkkaa vuorten takaa
  umbrBgRainbow(b, w * 0.42, horizon - h * 0.1, h * 0.09, 0.45);
  umbrBgRainbow(b, w * 0.78, horizon - h * 0.14, h * 0.06, 0.35);
  // Myrskyvuori: iso huippu oikealla, polku siksakkina ja pilvihattu
  px = w - viewW * 0.35; pk = h * 0.1;
  b.beginPath();
  b.moveTo(px - h * 0.6, horizon + h * 0.02);
  b.quadraticCurveTo(px - h * 0.2, pk + h * 0.12, px - h * 0.03, pk);
  b.lineTo(px + h * 0.04, pk + h * 0.01);
  b.quadraticCurveTo(px + h * 0.25, pk + h * 0.15, px + h * 0.6, horizon + h * 0.02);
  b.closePath();
  artFillPath(b, artMix('#8f80c8', UMBR_HAZE, 0.25), pk, horizon, h * 0.3, { line: false });
  b.strokeStyle = 'rgba(255,240,215,0.75)';
  b.lineWidth = h * 0.006;
  b.lineCap = 'round';
  b.beginPath();
  for (i = 0; i <= 6; i++) {
    y = horizon - i * (horizon - pk - h * 0.06) / 6;
    x = px + (i % 2 ? 1 : -1) * h * (0.32 - i * 0.045);
    if (i === 0) b.moveTo(x, y); else b.lineTo(x, y);
  }
  b.stroke();
  b.fillStyle = 'rgba(120,110,170,0.85)';
  cloudShape(b, px, pk - h * 0.01, h * 0.04);
}
// Haalea sateenkaaren kaari taustaan
function umbrBgRainbow(b, x, y, r, alpha) {
  var i, bw = r * 0.09;
  b.globalAlpha = alpha;
  b.lineWidth = bw;
  for (i = 0; i < 7; i++) {
    b.strokeStyle = RAINBOW_COLORS[i];
    b.beginPath(); b.arc(x, y, r - i * bw, Math.PI, 0); b.stroke();
  }
  b.globalAlpha = 1;
}
function renderUmbrellaMid(b, w, h) {
  var i, x, y, base = h * 0.66;
  var ridge = function (px) { return base - h * 0.06 - Math.sin(px * 0.0031 + 0.6) * h * 0.05 - Math.abs(Math.sin(px * 0.0083)) * h * 0.04; };
  fillHillBand(b, w, h, base, artMix('#9d8fd0', UMBR_HAZE, 0.15), ridge);
  // Kallionkielekkeet ja männyt
  for (i = 0; i < Math.ceil(w / (h * 0.35)); i++) {
    x = i * h * 0.35 + (i % 3) * h * 0.05;
    y = ridge(x);
    if (i % 3 === 0) {
      artBlob(b, x, y + h * 0.035, h * 0.075, h * 0.04, artMix('#a596d6', UMBR_HAZE, 0.2), { line: false });
      artBlob(b, x + h * 0.02, y + h * 0.01, h * 0.04, h * 0.028, artMix('#b8acdf', UMBR_HAZE, 0.2), { line: false, hi: 0.15 });
    }
    else drawPine(b, x, y + h * 0.03, h * (0.09 + (i % 2) * 0.03), artMix('#6f9c8a', UMBR_HAZE, 0.3), true);
  }
  // Pieniä sateenkaaria kurkkii harjanteen takaa
  for (i = 0; i < 3; i++) {
    x = w * (0.2 + i * 0.3);
    umbrBgRainbow(b, x, ridge(x) + h * 0.012, h * 0.05, 0.6);
  }
}
function renderUmbrellaNear(b, w, h) {
  var x, y, i, g, sx = umbrSummitX();
  // Rinne polun alla
  b.beginPath();
  b.moveTo(0, h);
  for (x = 0; x <= w; x += 10) b.lineTo(x, umbrPathY(x) - h * 0.03);
  b.lineTo(w, h); b.closePath();
  g = b.createLinearGradient(0, h * 0.65, 0, h);
  g.addColorStop(0, '#b8aae2');
  g.addColorStop(1, '#8676b8');
  b.fillStyle = g;
  b.fill();
  // Nurmireuna polun takana
  b.strokeStyle = '#8fd07a';
  b.lineWidth = h * 0.016;
  b.lineJoin = 'round';
  b.beginPath();
  for (x = 0; x <= w; x += 10) { y = umbrPathY(x) - h * 0.032; if (x === 0) b.moveTo(x, y); else b.lineTo(x, y); }
  b.stroke();
  // Polku
  b.beginPath();
  for (x = 0; x <= w; x += 10) { y = umbrPathY(x) - h * 0.025; if (x === 0) b.moveTo(x, y); else b.lineTo(x, y); }
  for (x = w; x >= 0; x -= 10) b.lineTo(x, umbrPathY(x) + h * 0.045);
  b.closePath();
  artFillPath(b, '#f0dfc0', h * 0.7, h * 0.85, h * 0.04, { lineColor: '#b89a74', line: Math.max(1.2, h * 0.003) });
  // Polun kivet ja sora
  for (i = 0; i < w / (h * 0.06); i++) {
    x = i * h * 0.06 + ((i * 37) % 11) * h * 0.003;
    y = umbrPathY(x) + h * (0.005 + ((i * 13) % 5) * 0.007);
    artBlob(b, x, y, h * 0.008, h * 0.005, '#d8c4a4', { line: false });
  }
  // Nurmitupsut ja kukat rinteessä
  for (i = 0; i < w / (h * 0.09); i++) {
    x = i * h * 0.09 + ((i * 53) % 17) * h * 0.004;
    y = umbrPathY(x) + h * (0.08 + ((i * 7) % 6) * 0.02);
    if (y > h * 0.98) continue;
    if (i % 3 === 0) drawFlower(b, x, y, h * 0.007, ['#c9a0ff', '#ff9fc8', '#ffffff'][i % 3 === 0 ? (i >> 1) % 3 : 0]);
    else if (i % 4 === 1) artBlob(b, x, y, h * 0.022, h * 0.012, '#c4b8e8', { lineColor: '#6e5fa0', hi: 0.25 });
    else hubThemeTuft(b, x, y, h * 0.12, 'rgba(90,160,80,0.75)');
  }
  // Viitta alussa: vuori ja aurinko
  x = viewW * 0.12; y = umbrPathY(x) - h * 0.03;
  artLimb(b, x, y, x, y - h * 0.13, h * 0.012, '#c8a070', '#6a4a2a');
  artRoundRect(b, x - h * 0.02, y - h * 0.17, h * 0.11, h * 0.055, h * 0.01, '#f4e2c0', { lineColor: '#8a6a40' });
  b.beginPath(); b.moveTo(x + h * 0.09, y - h * 0.17); b.lineTo(x + h * 0.115, y - h * 0.1425); b.lineTo(x + h * 0.09, y - h * 0.115); b.closePath();
  artFillPath(b, '#f4e2c0', y - h * 0.17, y - h * 0.115, h * 0.02, { lineColor: '#8a6a40' });
  b.beginPath(); b.moveTo(x - h * 0.005, y - h * 0.122); b.lineTo(x + h * 0.025, y - h * 0.16); b.lineTo(x + h * 0.055, y - h * 0.122); b.closePath();
  b.fillStyle = '#8f80c8'; b.fill();
  artCircle(b, x + h * 0.07, y - h * 0.15, h * 0.009, '#ffd24f', { line: false });
  // Huipun kukkarivi
  for (i = 0; i < 5; i++) drawFlower(b, sx + viewW * (0.05 + i * 0.07), umbrPathY(sx + viewW * 0.1) + h * 0.06 + (i % 2) * h * 0.02, h * 0.008, RAINBOW_COLORS[i]);
}

// ---------- Piirto ----------
function drawUmbrella() {
  var c = ctx, i, x, y, us = umbrUS(), a, cl, n, S, jit;
  if (!beginPlayWorld()) return;
  if (!umbr.built) { endPlayWorld(); return; }
  // Auringonnousu huipulla: lämmin hehku taivaalle
  if (umbr.state === 'sun' || umbr.state === 'done') umbrDrawSunrise(c);
  umbrDrawWitch(c);
  for (i = 0; i < umbr.clouds.length; i++) umbrDrawCloud(c, umbr.clouds[i]);
  umbrDrawBeams(c);
  propsDraw(c, 0);
  for (i = 0; i < umbr.arches.length; i++) {
    a = umbr.arches[i];
    var g0 = groundTop;
    groundTop = umbrPathY(umbrArchX(a)) - viewH * 0.02;
    drawTaskArch(c, { x: umbrArchX(a), type: tasks[a.task].type, opened: tasks[a.task].opened });
    groundTop = g0;
  }
  umbrDrawStone(c);
  // Yksisarvinen ja prinsessa (märkänä hytisee)
  x = umbrX() - camX; y = umbrPathY(umbrX());
  jit = umbr.wetT > 0 ? Math.sin(globalT * 70) * viewH * 0.004 * Math.min(1, umbr.wetT) : 0;
  drawUnicorn(c, x + jit, y, us, 1, umbr.walkPhase, umbr.moving, globalT);
  if (umbr.wetT > 0) umbrDrawWet(c, x + jit, y, us);
  propsDraw(c, 1);
  umbrDrawRipples(c);
  umbrDrawDrops(c);
  umbrDrawUmbrella(c, umbr.ux, umbr.uy, viewH * UMBR_R, umbr.tilt);
  umbrDrawSparks(c);
  drawParticlesLayer(c);
  umbrDrawHint(c);
  endPlayWorld();
  umbrDrawHud(c);
  drawTaskOverlay(c);
}
function umbrDrawSunrise(c) {
  var k = umbr.state === 'done' ? 1 : easeInOutSine(Math.max(0, (umbr.sunT - 2.3) / 1.5)), st, sx, sy, r, i, a;
  if (k <= 0) return;
  st = umbrStonePos();
  sx = st.x - camX - viewW * 0.12; sy = viewH * (0.42 - 0.22 * k); r = viewH * 0.09;
  c.globalAlpha = k * 0.6;
  c.fillStyle = '#fff2c8';
  c.fillRect(0, 0, viewW, viewH);
  c.globalAlpha = 1;
  artGlow(c, sx, sy, r * 4, '#ffe08a', 0.6 * k);
  c.strokeStyle = 'rgba(255,214,90,' + (0.8 * k) + ')';
  c.lineWidth = r * 0.22;
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    a = -Math.PI / 2 + (i / 7) * Math.PI * 2 + globalT * 0.2;
    c.beginPath();
    c.moveTo(sx + Math.cos(a) * r * 1.35, sy + Math.sin(a) * r * 1.35);
    c.lineTo(sx + Math.cos(a) * r * 2.1, sy + Math.sin(a) * r * 2.1);
    c.stroke();
  }
  artCircle(c, sx, sy, r, '#ffd84a', { lineColor: '#f0a830', hi: 0.4 });
  artEye(c, sx - r * 0.3, sy - r * 0.1, r * 0.12, 0, false);
  artEye(c, sx + r * 0.3, sy - r * 0.1, r * 0.12, 0, (globalT % 3) < 0.12);
  artBlush(c, sx - r * 0.5, sy + r * 0.15, r * 0.12);
  artBlush(c, sx + r * 0.5, sy + r * 0.15, r * 0.12);
  c.strokeStyle = '#c0602a'; c.lineWidth = r * 0.07;
  c.beginPath(); c.arc(sx, sy + r * 0.1, r * 0.3, 0.3, Math.PI - 0.3); c.stroke();
}
// Pilvi: äreä pikkunaama; varoitus tummentaa ja täristää, lopussa pilvi vaalenee
function umbrDrawCloud(c, cl) {
  var n = umbrCloudCenter(cl), x = n.x - camX, y = n.y, S = cl.s * viewH, blink;
  if (x < -S * 2 || x > viewW + S * 2) return;
  if (cl.clear < 1 && (cl.state === 'pour' || cl.state === 'warn')) {
    // Sadeverho: näyttää, mihin sataa
    var gy = umbrPathY(n.x), g = c.createLinearGradient(0, y, 0, gy);
    g.addColorStop(0, 'rgba(110,130,215,' + (cl.state === 'pour' ? 0.22 : 0.08) + ')');
    g.addColorStop(1, 'rgba(110,130,215,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - S * 0.95, y + S * 0.2); c.lineTo(x + S * 0.95, y + S * 0.2);
    c.lineTo(x + S * 0.95 - viewH * 0.03, gy); c.lineTo(x - S * 0.95 - viewH * 0.03, gy);
    c.closePath();
    c.fill();
  }
  if (cl.clear < 1) {
    c.globalAlpha = 1 - cl.clear;
    drawWitchCloud(c, x, y, S, globalT + cl.ph, 0);
    if (cl.state === 'warn' || cl.state === 'pour') {
      c.fillStyle = 'rgba(60,40,110,' + (cl.state === 'warn' ? 0.1 + Math.sin(globalT * 20) * 0.05 : 0.15) + ')';
      c.beginPath(); c.arc(x - S * 0.15, y - S * 0.2, S * 0.55, 0, Math.PI * 2); c.arc(x + S * 0.3, y - S * 0.12, S * 0.45, 0, Math.PI * 2); c.fill();
    }
    // Kasvot: pour = silmät kiinni ja posket pullollaan
    blink = cl.state === 'pour' || (globalT + cl.ph) % 3.3 < 0.12;
    artEye(c, x - S * 0.22, y - S * 0.08, S * 0.09, 0, blink);
    artEye(c, x + S * 0.22, y - S * 0.08, S * 0.09, 0, blink);
    c.strokeStyle = '#2a1a4a'; c.lineWidth = Math.max(1, S * 0.04); c.lineCap = 'round';
    c.beginPath();
    if (cl.state === 'pour') { c.arc(x, y + S * 0.14, S * 0.09, 0, Math.PI * 2); }
    else { c.arc(x, y + S * 0.2, S * 0.1, Math.PI * 1.15, Math.PI * 1.85); }
    c.stroke();
    if (cl.hail) {
      // Raepilven tunnus: pienet jääpallot pilven reunassa
      artCircle(c, x - S * 0.75, y + S * 0.25, S * 0.06, '#ffffff', { lineColor: '#8fa8d8' });
      artCircle(c, x + S * 0.78, y + S * 0.28, S * 0.06, '#ffffff', { lineColor: '#8fa8d8' });
    }
    c.globalAlpha = 1;
  }
  if (cl.clear > 0) drawCloud(c, x, y - cl.clear * viewH * 0.08, S * 0.45, cl.clear * 0.95);
}
// Kultainen säde pilvien raosta ennen kipinää
function umbrDrawBeams(c) {
  var i, sp, x, k, g;
  for (i = 0; i < umbr.sparks.length; i++) {
    sp = umbr.sparks[i];
    if (sp.state !== 'beam' && !(sp.state === 'fall' && sp.t < 0.6)) continue;
    k = sp.state === 'beam' ? Math.min(1, sp.t / 0.5) : 1 - sp.t / 0.6;
    x = sp.x0 - camX;
    g = c.createLinearGradient(0, 0, 0, viewH * 0.6);
    g.addColorStop(0, 'rgba(255,230,140,' + (0.55 * k) + ')');
    g.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - viewH * 0.03, 0); c.lineTo(x + viewH * 0.03, 0);
    c.lineTo(x + viewH * 0.08, viewH * 0.6); c.lineTo(x - viewH * 0.08, viewH * 0.6);
    c.closePath();
    c.fill();
  }
}
function umbrDrawSparks(c) {
  var i, sp, a;
  for (i = 0; i < umbr.sparks.length; i++) {
    sp = umbr.sparks[i];
    if (sp.state === 'beam') {
      a = Math.min(1, sp.t / 0.9);
      umbrDrawSpark(c, sp.x - camX, sp.y, viewH * 0.03 * a, sp.t);
    } else if (sp.state === 'fall') {
      umbrDrawSpark(c, sp.x - camX, sp.y, viewH * 0.03, sp.t + sp.ph);
    } else {
      c.globalAlpha = Math.max(0, 1 - sp.t / 0.7);
      umbrDrawSpark(c, sp.x - camX, sp.y, viewH * 0.03 * (1 - sp.t * 0.8), sp.t);
      c.globalAlpha = 1;
    }
  }
}
// Aurinkokipinä: pieni hymyilevä aurinko säteineen
function umbrDrawSpark(c, x, y, r, t) {
  var i, a;
  if (r <= 0.5) return;
  artGlow(c, x, y, r * 2.6, '#ffe678', 0.55);
  c.strokeStyle = '#ffc93a';
  c.lineWidth = Math.max(1.5, r * 0.22);
  c.lineCap = 'round';
  for (i = 0; i < 8; i++) {
    a = i * Math.PI / 4 + t * 1.5;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
    c.lineTo(x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45);
    c.stroke();
  }
  artCircle(c, x, y, r * 0.8, '#ffd84a', { lineColor: '#e09a20', hi: 0.45 });
  if (r > viewH * 0.015) {
    c.fillStyle = '#a8600a';
    c.beginPath(); c.arc(x - r * 0.25, y - r * 0.08, r * 0.08, 0, Math.PI * 2); c.arc(x + r * 0.25, y - r * 0.08, r * 0.08, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#a8600a'; c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath(); c.arc(x, y + r * 0.05, r * 0.22, 0.3, Math.PI - 0.3); c.stroke();
  }
}
function umbrDrawDrops(c) {
  var i, d, x, rain = [], hail = [];
  for (i = 0; i < umbr.drops.length; i++) (umbr.drops[i].hail ? hail : rain).push(umbr.drops[i]);
  if (rain.length) {
    c.strokeStyle = 'rgba(110,140,225,0.85)';
    c.lineWidth = Math.max(1.5, viewH * 0.0045);
    c.lineCap = 'round';
    c.beginPath();
    for (i = 0; i < rain.length; i++) {
      d = rain[i]; x = d.x - camX;
      c.moveTo(x, d.y); c.lineTo(x - d.vx * 0.03, d.y - viewH * 0.028);
    }
    c.stroke();
  }
  for (i = 0; i < hail.length; i++) {
    d = hail[i];
    artCircle(c, d.x - camX, d.y, viewH * 0.008, '#ffffff', { lineColor: '#8fa8d8', line: Math.max(1, viewH * 0.002) });
  }
}
function umbrDrawRipples(c) {
  var i, rp, k;
  c.lineWidth = Math.max(1, viewH * 0.002);
  for (i = 0; i < umbr.ripples.length; i++) {
    rp = umbr.ripples[i];
    k = rp.t / 0.5;
    c.strokeStyle = 'rgba(150,180,240,' + (0.8 * (1 - k)) + ')';
    c.beginPath();
    c.ellipse(rp.x - camX, rp.y, rp.r * (0.5 + k), rp.r * (0.5 + k) * 0.35, 0, 0, Math.PI * 2);
    c.stroke();
  }
}
// Märkä prinsessa: tippuvat pisarat ja hytinäviivat pään vieressä
function umbrDrawWet(c, x, y, us) {
  var hx = x - us * 4, hy = y - us * 93, i, k, a = Math.min(1, umbr.wetT * 2);
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
    k = ((globalT * 1.6 + i * 0.33) % 1);
    artBlob(c, hx + (i - 1) * us * 9, hy + us * 6 + k * us * 30, us * 1.6, us * 2.3, '#8fc0ff', { lineColor: '#4a78c8', line: Math.max(1, us * 0.5) });
  }
  c.globalAlpha = 1;
}
// Iso sateenkaarivarjo: kupu kuudesta väristä, aaltoileva reuna, J-varsi
function umbrDrawUmbrella(c, x, y, R, tilt, gold) {
  var i, n = 7, x0, x1, xm, top = -R * 0.64, hl = R * UMBR_HANDLE / UMBR_R;
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  // Varsi
  artLimb(c, 0, top, 0, hl, Math.max(2, R * 0.06), gold ? '#ffd24f' : '#8a5ab8', gold ? '#a8700a' : '#4a2a70');
  c.strokeStyle = gold ? '#a8700a' : '#4a2a70';
  c.lineWidth = Math.max(2, R * 0.06) + 2.4;
  c.lineCap = 'round';
  c.beginPath(); c.arc(-R * 0.1, hl, R * 0.1, 0, Math.PI * 0.95); c.stroke();
  c.strokeStyle = gold ? '#ffd24f' : '#8a5ab8';
  c.lineWidth = Math.max(2, R * 0.06);
  c.beginPath(); c.arc(-R * 0.1, hl, R * 0.1, 0, Math.PI * 0.95); c.stroke();
  // Kupu
  c.save();
  umbrDomePath(c, R, n);
  c.clip();
  for (i = 0; i < n; i++) {
    x0 = -R + i * 2 * R / n; x1 = x0 + 2 * R / n;
    c.beginPath();
    c.moveTo(0, top * 1.05);
    c.lineTo(x0 * 1.6, R * 0.3);
    c.lineTo(x1 * 1.6, R * 0.3);
    c.closePath();
    c.fillStyle = gold ? (i % 2 ? '#ffe27a' : '#ffc93a') : RAINBOW_COLORS[i];
    c.fill();
  }
  var g = c.createLinearGradient(0, top, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(60,30,90,0.18)');
  c.fillStyle = g;
  c.fillRect(-R, top * 1.1, R * 2, -top * 1.2);
  c.restore();
  umbrDomePath(c, R, n);
  c.strokeStyle = gold ? '#a8700a' : '#4a2a70';
  c.lineWidth = Math.max(1.5, R * 0.035);
  c.lineJoin = 'round';
  c.stroke();
  // Ruoteet
  c.lineWidth = Math.max(1, R * 0.015);
  c.strokeStyle = 'rgba(74,42,112,0.5)';
  c.beginPath();
  for (i = 1; i < n; i++) {
    xm = -R + i * 2 * R / n;
    c.moveTo(0, top);
    c.quadraticCurveTo(xm * 0.85, top * 0.75, xm, -R * 0.02);
  }
  c.stroke();
  artHighlight(c, -R * 0.45, top * 0.6, R * 0.22, R * 0.08, 0.45);
  artCircle(c, 0, top - R * 0.06, R * 0.07, gold ? '#ffd24f' : '#ffd24f', { lineColor: '#a8700a' });
  c.restore();
}
function umbrDomePath(c, R, n) {
  var i, x0, x1;
  c.beginPath();
  c.moveTo(-R, 0);
  c.bezierCurveTo(-R, -R * 0.85, R, -R * 0.85, R, 0);
  for (i = 0; i < n; i++) {
    x0 = R - i * 2 * R / n; x1 = x0 - 2 * R / n;
    c.quadraticCurveTo((x0 + x1) / 2, -R * 0.13, x1, 0);
  }
  c.closePath();
}
// Aurinkokivi huipulla: seitsemän koloa, jotka täyttyvät lopussa
function umbrDrawStone(c) {
  var st = umbrStonePos(), x = st.x - camX, y = st.y, r = st.r, i, sl, k, t;
  if (x < -r * 3 || x > viewW + r * 3) return;
  artShadow(c, x, y + r * 0.1, r * 1.3, r * 0.25, 0.2);
  artRoundRect(c, x - r * 0.35, y - r * 0.6, r * 0.7, r * 0.6, r * 0.1, '#b3a6dc', { lineColor: '#5e4f8e' });
  c.beginPath(); c.arc(x, y - r * 1.05, r, Math.PI, 0); c.closePath();
  artFillPath(c, '#c8bdea', y - r * 2.05, y - r * 1.05, r, { lineColor: '#5e4f8e', hi: 0.2 });
  if (umbr.state === 'sun' || umbr.state === 'done') artGlow(c, x, y - r * 1.3, r * 2.2, '#ffe27a', 0.5 * Math.min(1, umbr.state === 'done' ? 1 : umbr.sunT / 2.6));
  for (i = 0; i < UMBR_GOAL; i++) {
    sl = umbrStoneSlot(i);
    artCircle(c, sl.x - camX, sl.y, r * 0.15, '#8f80c0', { lineColor: '#4e3f7e', line: Math.max(1, r * 0.03) });
    if (umbr.state === 'sun' || umbr.state === 'done') {
      t = umbr.state === 'done' ? 99 : umbr.sunT - (0.3 + i * 0.25);
      if (t > 0) {
        // Kipinä lentää HUD:sta koloonsa
        k = easeInOutSine(Math.min(1, t / 0.55));
        var hs = umbrHudSlot(i), fx = hs.x + (sl.x - camX - hs.x) * k, fy = hs.y + (sl.y - hs.y) * k - Math.sin(k * Math.PI) * viewH * 0.12;
        umbrDrawSpark(c, fx, fy, r * 0.17 * (k >= 1 ? 1 + Math.sin(globalT * 5 + i) * 0.08 : 1), globalT);
      }
    }
  }
}
// Noita pilvellään: murjottaa ja lentää huipulle
function umbrDrawWitch(c) {
  var w = umbr.witch, x, s = viewH * 0.05;
  if (!w || w.state === 'gone') return;
  x = w.x - camX;
  if (x < -s * 4 || x > viewW + s * 4) return;
  drawStormWitch(c, x + s * 0.2, w.y - s * 0.6 + Math.sin(globalT * 2) * s * 0.1, s * 0.6, w.state === 'fly' ? 1 : -1, 'sulk');
  drawWitchCloud(c, x, w.y, s * 1.3, globalT, 0.6);
}
// Vihjekäsi: ensimmäinen kipinä kiinni ja varjo prinsessan ylle ensimmäisessä sateessa
function umbrDrawHint(c) {
  var from, to = null, k, i, sp, cp, hx, hy, h = viewH;
  if (puzzleBusy() || celebrating || umbr.state === 'sun' || umbr.state === 'done') return;
  if (holding) return;
  if ((!umbr.everCaught && umbr.idleT > 0.8) || umbr.idleT > 6) {
    for (i = 0; i < umbr.sparks.length; i++) {
      sp = umbr.sparks[i];
      if (sp.state === 'fall') { to = { x: sp.x - camX, y: sp.y + h * 0.06 }; break; }
    }
  }
  if (!to && !umbr.everCovered && umbrRainNear() && !umbrCovering()) {
    cp = umbrCoverPos();
    to = { x: cp.x, y: cp.y };
  }
  if (!to) return;
  from = { x: umbr.ux, y: umbr.uy };
  k = (globalT % 1.6) / 1.6;
  hx = from.x + (to.x - from.x) * easeInOutSine(Math.min(1, k * 1.3));
  hy = from.y + (to.y - from.y) * easeInOutSine(Math.min(1, k * 1.3)) + h * UMBR_HANDLE;
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  if (k > 0.1) {
    c.globalAlpha *= 0.45;
    umbrDrawUmbrella(c, hx, hy - h * UMBR_HANDLE, h * UMBR_R, 0);
    c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  }
  drawHand(c, hx + h * 0.02, hy + h * 0.01, h * 0.045);
  c.globalAlpha = 1;
}
// HUD: seitsemän aurinkokipinää, sateenvarjo (kultainen = kuiva) ja vuoren reitti
function umbrDrawHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, top = pad * 0.5, i, f, k, x, y, sl, bump, left, W = viewW;
  drawHudPanel(c, hudX(), top, hs * 3.2 * UMBR_GOAL + pad, hs * 3.4, hs);
  for (i = 0; i < UMBR_GOAL; i++) {
    sl = umbrHudSlot(i);
    var shown = i < umbr.got - umbr.flyers.length || (i < umbr.got && !umbrFlying(i));
    if (umbr.state === 'sun' || umbr.state === 'done') shown = false;
    bump = shown && umbr.hudBump > 0 && i === umbr.got - 1 ? 1 + Math.sin(Math.PI * umbr.hudBump / 0.4) * 0.45 : 1;
    if (shown) umbrDrawSpark(c, sl.x, sl.y, hs * 0.85 * bump, globalT);
    else {
      c.strokeStyle = 'rgba(150,120,40,0.55)';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(sl.x, sl.y, hs * 0.75, 0, Math.PI * 2); c.stroke();
    }
  }
  // Lentävät kipinät HUD:iin
  for (i = 0; i < umbr.flyers.length; i++) {
    f = umbr.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    sl = umbrHudSlot(f.idx);
    x = f.x0 + (sl.x - f.x0) * k;
    y = f.y0 + (sl.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.1;
    umbrDrawSpark(c, x, y, viewH * 0.03 * (1 - k * 0.4), globalT * 2);
  }
  // Sateenvarjo: kultainen, kun prinsessa on pysynyt kuivana
  left = hudX() + hs * 3.2 * UMBR_GOAL + pad + hs * 0.6;
  drawHudPanel(c, left, top, hs * 3.4 + hs * 1.6 * Math.min(3, umbr.wetN), hs * 3.4, hs);
  umbrDrawUmbrella(c, left + hs * 1.7, top + hs * 2.0, hs * 1.15, 0, umbr.wetN <= UMBR_GOLD_WET);
  for (i = 0; i < Math.min(3, umbr.wetN); i++) {
    artBlob(c, left + hs * (3.6 + i * 1.6), top + hs * 1.8, hs * 0.38, hs * 0.55, '#8fc0ff', { lineColor: '#4a78c8' });
  }
  // Reitti: vuori, siksakpolku ja yksisarvisen pallo
  var x0 = Math.max(W * 0.6, left + hs * 12), x1 = W * 0.86, by = top + hs * 3.0, ty = top + hs * 0.5, pts = [], p, seg;
  if (x1 - x0 < hs * 6) return;
  drawHudPanel(c, x0 - hs * 1.2, top, x1 - x0 + hs * 2.4, hs * 3.4, hs);
  c.beginPath(); c.moveTo(x0 - hs * 0.4, by); c.lineTo((x0 + x1) / 2 + hs, ty); c.lineTo(x1 + hs * 0.4, by); c.closePath();
  c.fillStyle = 'rgba(160,140,220,0.6)';
  c.fill();
  for (i = 0; i <= 4; i++) {
    k = i / 4;
    pts.push({ x: (i % 2 ? x1 - hs * 1.6 * (1 - k) : x0 + hs * 1.6 * (1 - k) + (x1 - x0) * 0.25 * k), y: by - (by - ty - hs * 0.4) * k });
  }
  pts[4].x = (x0 + x1) / 2 + hs;
  c.strokeStyle = 'rgba(255,240,215,0.95)';
  c.lineWidth = hs * 0.3;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  for (i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i].x, pts[i].y); else c.moveTo(pts[i].x, pts[i].y); }
  c.stroke();
  umbrDrawSpark(c, pts[4].x, pts[4].y - hs * 0.2, hs * 0.5, globalT);
  p = umbrProg(umbrX()) * 4;
  seg = Math.min(3, Math.floor(p));
  k = p - seg;
  x = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * k;
  y = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * k;
  artCircle(c, x, y - hs * 0.15, hs * 0.55, '#ff8fb0', { lineColor: '#b8507a', line: hs * 0.1 });
}
function umbrFlying(idx) {
  var i;
  for (i = 0; i < umbr.flyers.length; i++) if (umbr.flyers[i].idx === idx) return true;
  return false;
}

// ---------- Kartan kuvake ----------
HUB_ICONS.umbrella = function (c, x, y, s) {
  var b = Math.sin(globalT * 1.6) * s * 0.02;
  umbrDrawUmbrella(c, x, y - s * 0.05 + b, s * 0.26, Math.sin(globalT * 1.2) * 0.08);
  c.strokeStyle = 'rgba(110,140,225,0.85)';
  c.lineWidth = Math.max(1, s * 0.015);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - s * 0.34, y - s * 0.2); c.lineTo(x - s * 0.36, y - s * 0.13);
  c.moveTo(x + s * 0.34, y - s * 0.24); c.lineTo(x + s * 0.32, y - s * 0.17);
  c.moveTo(x + s * 0.38, y - s * 0.06); c.lineTo(x + s * 0.36, y + s * 0.01);
  c.stroke();
};
