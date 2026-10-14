'use strict';

// Myrskynoita (Kaukamaa, Myrskyvuoren vartija): ystävyyden finaali, ei taistelu.
// Vuoren huipulla surullinen Myrskynoita istuu luudallaan, ja hänen iso
// sadepilvensä leijuu taivaalla. Pilven alla sataa: sadealue näkyy sadeverhona.
// Alhaalla korissa on seitsemän auringonsädettä hehkuvina palloina, kukin
// sateenkaaren värissä (RAINBOW_COLORS, punainen -> violetti). Haaleat
// pisteviivakaaret näyttävät, mihin sateenkaaren raidat kuuluvat.
//   Ohjaus: säde raahataan korista sateeseen. Kun säde päästetään sadealueella,
//   se lentää kaarelleen ja sen värinen raita kasvaa esiin (säde + sade =
//   sateenkaari). Järjestyksellä ei ole väliä: jokainen säde menee omalle
//   raidalleen. Sateen ulkopuolelle pudotettu säde leijuu rauhassa takaisin
//   koriin.
//   Jokainen raita ilahduttaa noitaa: surullinen -> murjottava -> iloinen, ja
//   pilvi vaalenee. Lempeä haaste: pilvi lipuu hitaasti, ja ensimmäisen
//   raidan jälkeen välillä jyrähtää: pilvi tärisee hetken (varoitus), salama
//   välähtää ja pilvi hyppää uuteen paikkaan, joten säde pitää tähdätä.
//   Kun kaikki seitsemän raitaa loistavat, noita nauraa, pilvestä tulee
//   valkoinen ja sataa kimalletta, noita lentää luudalla silmukan, ja
//   kenttä juhlii tavalliseen tapaan.
//   Tökättävät: noita (surullisena niiskaisee, iloisena kikattaa ja
//   puhaltaa sydämiä), pilvi mutisee, yksisarvinen hirnahtaa, vuorikauris ja
//   kivikasat (play-umbrella.js:n koristeet).

var MWITCH_BANDS = 7;
var MWITCH_DRIFT = 0.45;       // pilven lipumisen kulmanopeus (kasvaa raidoittain)
var MWITCH_DRIFT_UP = 0.05;    // ... lisäys per raita
var MWITCH_JUMP_GAP = [6.5, 9.5];  // jyrähdysten väli sekunteina
var MWITCH_JUMP_WARN = 1.0;    // pilvi tärisee ennen hyppyä
var MWITCH_JUMP_T = 0.55;      // hypyn kesto
var MWITCH_GROW_T = 1.4;       // raidan kasvuaika
var MWITCH_FLY_T = 0.55;       // säteen lento kaarelle
var MWITCH_BACK_T = 0.9;       // säteen paluu koriin
var MWITCH_HINT_IDLE = 8;      // vihjekäsi, jos mitään ei tapahdu

var mwitch = {
  built: false, orbs: [], bands: [], drag: null, done: 0, cloud: null, t: 0, idleT: 0, phase: 'play', finT: 0,
  hopT: 0, pokeT: 0, pokeN: 0, rain: [], flashT: 0, won: false, laughT: 0, cheerT: 0, neighT: 0
};

// ---------- Mitat ----------
function mwitchU() { return Math.min(viewH, viewW * 0.7); }
function mwitchGroundY() { return viewH * 0.82; }
function mwitchArcC() { return { x: viewW / 2, y: viewH * 0.86 }; }
function mwitchBandW() { return mwitchU() * 0.042; }
// Raidan i säde: punainen uloimpana, violetti sisimpänä
function mwitchBandR(i) { return mwitchU() * 0.4 + (MWITCH_BANDS - 1 - i + 0.5) * mwitchBandW(); }
function mwitchOrbR() { return mwitchU() * 0.042; }
function mwitchSlot(i) {
  var u = mwitchU();
  return { x: viewW / 2 + (i - (MWITCH_BANDS - 1) / 2) * u * 0.1, y: viewH * 0.885 - Math.abs(i - 3) * u * 0.004 };
}
function mwitchCloudS() { return mwitchU() * 0.14; }
function mwitchRainBottom() { return viewH * 0.74; }
function mwitchSeat() { return { x: Math.min(viewW / 2 + mwitchU() * 0.58, viewW - mwitchWitchS() * 3), y: mwitchGroundY() - viewH * 0.05 }; }
function mwitchWitchS() { return viewH * 0.06; }
function mwitchUS() { return viewH / 800 * 1.3; }
function mwitchUniX() { return Math.max(viewW / 2 - mwitchU() * 0.66, viewH * 0.09); }
// Pilven paikka nyt (lipuu perusviivan ympärillä, hyppää jyrähdyksessä)
function mwitchCloudPos() {
  var cl = mwitch.cloud, u = mwitchU(), bx, k, wob = 0, x;
  bx = cl.base;
  if (cl.state === 'jump') {
    k = easeInOutSine(cl.t / MWITCH_JUMP_T);
    bx = cl.from + (cl.base - cl.from) * k;
  }
  if (cl.state === 'warn') wob = Math.sin(globalT * 40) * u * 0.008;
  x = viewW * bx + Math.sin(cl.ph) * viewW * 0.08 + wob;
  return { x: x, y: viewH * 0.2 + Math.sin(globalT * 0.9) * viewH * 0.006 - (cl.state === 'jump' ? Math.sin(cl.t / MWITCH_JUMP_T * Math.PI) * viewH * 0.04 : 0) };
}
// Onko piste sadealueella (pilven alla tai pilvessä)?
function mwitchInRain(x, y) {
  var p = mwitchCloudPos(), S = mwitchCloudS(), r = mwitchOrbR();
  return Math.abs(x - p.x) <= S * 1.05 + r * 0.5 && y >= p.y - S * 0.6 && y <= mwitchRainBottom() + r * 0.5;
}
function mwitchMood() {
  if (mwitch.done >= 5 || mwitch.phase !== 'play') return 'happy';
  if (mwitch.done >= 3) return 'sulk';
  return 'sad';
}

// ---------- Alustus ----------
function initMwitch() {
  var i, sl;
  tasks = [];
  mwitch.orbs = [];
  mwitch.bands = [];
  for (i = 0; i < MWITCH_BANDS; i++) {
    sl = mwitchSlot(i);
    mwitch.orbs.push({ i: i, state: 'basket', x: sl.x, y: sl.y, t: 0, x0: 0, y0: 0, ph: Math.random() * 6 });
    mwitch.bands.push({ k: 0, a: Math.PI * 1.5, on: false });
  }
  mwitch.drag = null;
  mwitch.done = 0;
  mwitch.cloud = { base: 0.35 + Math.random() * 0.3, from: 0.5, ph: Math.random() * 6, state: 'drift', t: 0, next: MWITCH_JUMP_GAP[0], light: 0, pokeT: 0 };
  mwitch.t = 0;
  mwitch.idleT = 0;
  mwitch.phase = 'play';
  mwitch.finT = 0;
  mwitch.hopT = 0;
  mwitch.pokeT = 0;
  mwitch.pokeN = 0;
  mwitch.rain = [];
  mwitch.flashT = 0;
  mwitch.won = false;
  mwitch.laughT = 0;
  mwitch.cheerT = 0;
  mwitch.neighT = 0;
  mwitch.built = true;
  camX = 0;
  mwitchSetupProps();
  renderBackground();
  // Surullinen alkusointu
  playNote(392, 0, 0.3, 'sine', 0.22);
  playNote(349, 0.25, 0.3, 'sine', 0.22);
  playNote(311, 0.5, 0.5, 'sine', 0.22);
}
function respawnMwitch() {}
function resizeMwitch() {
  var i, o, sl;
  camX = 0;
  if (!mwitch.built) return;
  for (i = 0; i < mwitch.orbs.length; i++) {
    o = mwitch.orbs[i];
    sl = mwitchSlot(i);
    if (o.state === 'basket' || o.state === 'back') { o.state = 'basket'; o.x = sl.x; o.y = sl.y; }
    if (o.state === 'drag') { o.x = Math.min(o.x, viewW); o.y = Math.min(o.y, viewH); }
  }
  mwitch.rain = [];
  mwitchSetupProps();
}
function mwitchSetupProps() {
  var g = mwitchGroundY(), u = mwitchU();
  propsReset();
  umbrAddCairn(viewW / 2 - u * 0.4, g + viewH * 0.02, viewH * 0.04);
  umbrAddCairn(viewW * 0.97, g + viewH * 0.06, viewH * 0.045);
  umbrAddGoat(viewW * 0.04, g - viewH * 0.01, viewH * 0.04, 1);
  mwitchAddBells(viewW / 2 + u * 0.42, g + viewH * 0.05, viewH * 0.04);
}
// Kellokukat: soivat; kolmas tökkäys herättää kimalaisen
function mwitchAddBells(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.3, hy: s * 0.7, color: '#c9a0ff', note: 988, amp: 0.2, beeT: 0,
    update: function (p, dt) { if (p.beeT > 0) p.beeT -= dt; },
    poke: function (p) {
      playNote(1319, 0.05, 0.15, 'sine', 0.15);
      playNote(1568, 0.12, 0.2, 'sine', 0.12);
      if (p.n % 3 === 0) { p.beeT = 3; playNote(220, 0.1, 0.4, 'sawtooth', 0.05); }
    },
    draw: function (c, p) {
      var i, bx, by, k;
      for (i = 0; i < 3; i++) {
        bx = (i - 1) * s * 0.45; by = -s * (0.9 + (i % 2) * 0.25);
        artLimb(c, bx * 0.4, 0, bx, by, s * 0.06, '#5aa84a', '#2f6a2c');
        c.beginPath();
        c.moveTo(bx - s * 0.2, by + s * 0.25); c.quadraticCurveTo(bx - s * 0.22, by - s * 0.1, bx, by - s * 0.1);
        c.quadraticCurveTo(bx + s * 0.22, by - s * 0.1, bx + s * 0.2, by + s * 0.25);
        c.quadraticCurveTo(bx, by + s * 0.15, bx - s * 0.2, by + s * 0.25);
        c.closePath();
        artFillPath(c, i === 1 ? '#c9a0ff' : '#a98ff0', by - s * 0.1, by + s * 0.25, s * 0.2, { lineColor: '#5e3fa0' });
      }
      if (p.beeT > 0) {
        k = 3 - p.beeT;
        bx = Math.sin(k * 4) * s * 1.2; by = -s * 1.6 - Math.cos(k * 3) * s * 0.4;
        artBlob(c, bx, by, s * 0.2, s * 0.14, '#ffd24f', { lineColor: '#6a4a10' });
        c.fillStyle = '#4a3010'; c.fillRect(bx - s * 0.04, by - s * 0.13, s * 0.07, s * 0.26);
        artBlob(c, bx - s * 0.05, by - s * 0.18, s * 0.1, s * 0.07, 'rgba(255,255,255,0.8)', { line: false });
      }
    }
  });
}

// ---------- Syöte ----------
function handleMwitchTap(px, py) {
  var i, o, best = null, bd = 1e9, d, r = mwitchOrbR() * 1.7, seat, s, cp, ux, us;
  if (!mwitch.built || celebrating || mwitch.phase !== 'play') {
    if (mwitch.built) mwitchPokeWitch(px, py);
    return;
  }
  mwitch.idleT = 0;
  for (i = 0; i < mwitch.orbs.length; i++) {
    o = mwitch.orbs[i];
    if (o.state !== 'basket' && o.state !== 'back') continue;
    d = Math.hypot(px - o.x, py - o.y);
    if (d < r && d < bd) { bd = d; best = o; }
  }
  if (best) {
    mwitch.drag = best;
    best.state = 'drag';
    playNote(660 + best.i * 60, 0, 0.1, 'sine', 0.22);
    return;
  }
  if (mwitchPokeWitch(px, py)) return;
  // Pilvi mutisee (iloisena kikattaa)
  cp = mwitchCloudPos(); s = mwitchCloudS();
  if (Math.abs(px - cp.x) < s * 1.2 && Math.abs(py - cp.y) < s * 0.7) {
    mwitch.cloud.pokeT = 0.6;
    if (mwitch.done >= 5) { playNote(1175, 0, 0.07, 'sine', 0.15); playNote(1397, 0.07, 0.1, 'sine', 0.15); }
    else { playNote(147, 0, 0.25, 'triangle', 0.15); playNote(131, 0.15, 0.3, 'triangle', 0.12); }
    spawnSparkles(cp.x, cp.y, 5, '#ffffff');
    return;
  }
  // Yksisarvinen hirnahtaa
  ux = mwitchUniX(); us = mwitchUS();
  if (Math.abs(px - ux) < us * 45 && py > mwitchGroundY() - us * 100 && py < mwitchGroundY() + us * 10) {
    if (mwitch.neighT <= 0) {
      mwitch.neighT = 1;
      playNote(660, 0, 0.12, 'triangle', 0.2);
      playNote(880, 0.1, 0.12, 'triangle', 0.2);
      playNote(740, 0.2, 0.2, 'triangle', 0.18);
      spawnSparkles(ux, mwitchGroundY() - us * 70, 6, '#ff9fb8');
    }
    return;
  }
  propsTap(px, py);
}
function mwitchPokeWitch(px, py) {
  var p = mwitchWitchPos(), s = mwitchWitchS();
  if (Math.abs(px - p.x) > s * 1.6 || py < p.y - s * 2.8 || py > p.y + s * 1.4) return false;
  mwitch.pokeT = 0.8;
  mwitch.pokeN++;
  if (mwitchMood() === 'happy') {
    playNote(988, 0, 0.07, 'square', 0.08);
    playNote(1175, 0.08, 0.07, 'square', 0.08);
    playNote(1319, 0.16, 0.1, 'square', 0.08);
    if (mwitch.pokeN % 3 === 0) {
      artPop(p.x, p.y - s * 1.6, s * 0.8, '#ff7bac', 'burst');
      spawnSparkles(p.x, p.y - s * 1.6, 10, '#ff9fb8');
    }
  } else {
    // Niiskaisu
    playNote(523, 0, 0.12, 'sine', 0.12);
    playNote(440, 0.14, 0.2, 'sine', 0.1);
  }
  return true;
}

// ---------- Päivitys ----------
function updateMwitch(dt) {
  var i, o, k, sl, cl, a, c, p;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (!mwitch.built) return;
  mwitch.t += dt;
  mwitch.idleT += dt;
  if (mwitch.hopT > 0) mwitch.hopT -= dt;
  if (mwitch.pokeT > 0) mwitch.pokeT -= dt;
  if (mwitch.flashT > 0) mwitch.flashT -= dt;
  if (mwitch.laughT > 0) mwitch.laughT -= dt;
  if (mwitch.cheerT > 0) mwitch.cheerT -= dt;
  if (mwitch.neighT > 0) mwitch.neighT -= dt;
  mwitchUpdateCloud(dt);
  mwitchUpdateRain(dt);
  // Raahaus
  if (mwitch.drag) {
    o = mwitch.drag;
    if (holding && mwitch.phase === 'play') {
      k = 1 - Math.exp(-dt * 22);
      o.x += (lastPX - o.x) * k;
      o.y += (lastPY - mwitchOrbR() * 0.6 - o.y) * k;
      mwitch.idleT = 0;
    } else {
      mwitch.drag = null;
      mwitchDrop(o);
    }
  }
  for (i = 0; i < mwitch.orbs.length; i++) {
    o = mwitch.orbs[i];
    o.ph += dt;
    if (o.state === 'back') {
      o.t += dt;
      sl = mwitchSlot(o.i);
      k = easeInOutSine(Math.min(1, o.t / MWITCH_BACK_T));
      o.x = o.x0 + (sl.x - o.x0) * k;
      o.y = o.y0 + (sl.y - o.y0) * k - Math.sin(k * Math.PI) * viewH * 0.05;
      if (o.t >= MWITCH_BACK_T) o.state = 'basket';
    } else if (o.state === 'basket') {
      sl = mwitchSlot(o.i);
      o.x = sl.x;
      o.y = sl.y + Math.sin(o.ph * 2) * viewH * 0.004;
    } else if (o.state === 'fly') {
      o.t += dt;
      c = mwitchArcC();
      a = mwitch.bands[o.i].a;
      p = { x: c.x + Math.cos(a) * mwitchBandR(o.i), y: c.y + Math.sin(a) * mwitchBandR(o.i) };
      k = easeInOutSine(Math.min(1, o.t / MWITCH_FLY_T));
      o.x = o.x0 + (p.x - o.x0) * k;
      o.y = o.y0 + (p.y - o.y0) * k;
      if (o.t >= MWITCH_FLY_T) {
        o.state = 'done';
        mwitch.bands[o.i].on = true;
        artPop(p.x, p.y, mwitchOrbR() * 1.6, RAINBOW_COLORS[o.i], 'burst');
        spawnSparkles(p.x, p.y, 12, RAINBOW_COLORS[o.i]);
        // Sävel nousee raita raidalta
        playNote(523 * Math.pow(1.122, mwitch.done), 0, 0.3, 'triangle', 0.3);
        playNote(784 * Math.pow(1.122, mwitch.done), 0.1, 0.35, 'triangle', 0.25);
      }
    }
  }
  // Raidat kasvavat esiin
  for (i = 0; i < mwitch.bands.length; i++) {
    if (mwitch.bands[i].on && mwitch.bands[i].k < 1) {
      mwitch.bands[i].k = Math.min(1, mwitch.bands[i].k + dt / MWITCH_GROW_T);
      if (mwitch.bands[i].k >= 1) mwitchBandDone(i);
    }
  }
  cl = mwitch.cloud;
  cl.light += (mwitch.done / MWITCH_BANDS - cl.light) * Math.min(1, dt * 1.5);
  if (cl.pokeT > 0) cl.pokeT -= dt;
  if (mwitch.phase === 'finale') mwitchUpdateFinale(dt);
}
function mwitchDrop(o) {
  var c = mwitchArcC(), a;
  if (mwitchInRain(o.x, o.y)) {
    // Säde kohtaa sateen: lentää omalle raidalleen kohtaan, josta se tuli
    a = Math.atan2(o.y - c.y, o.x - c.x);
    if (a > 0) a = o.x < c.x ? Math.PI : Math.PI * 2;
    if (a < 0) a += Math.PI * 2;
    a = Math.max(Math.PI * 1.08, Math.min(Math.PI * 1.92, a));
    mwitch.bands[o.i].a = a;
    o.state = 'fly'; o.t = 0; o.x0 = o.x; o.y0 = o.y;
    spawnSparkles(o.x, o.y, 8, '#ffffff');
    playNote(1047, 0, 0.12, 'sine', 0.2);
  } else {
    o.state = 'back'; o.t = 0; o.x0 = o.x; o.y0 = o.y;
    playNote(440, 0, 0.12, 'sine', 0.12);
    playNote(392, 0.1, 0.15, 'sine', 0.1);
  }
}
// Valmis raita: noita ilahtuu askeleen
function mwitchBandDone(i) {
  var p = mwitchWitchPos(), before = mwitchMood();
  mwitch.done++;
  mwitch.hopT = 0.6;
  mwitch.cheerT = 1.2;
  if (mwitchMood() !== before) {
    artPop(p.x, p.y - mwitchWitchS() * 1.2, mwitchWitchS(), '#ffe27a', 'ring');
    spawnSparkles(p.x, p.y - mwitchWitchS() * 1.2, 8, '#ffe27a');
  }
  if (mwitch.done >= MWITCH_BANDS && mwitch.phase === 'play') {
    mwitch.phase = 'finale';
    mwitch.finT = 0;
    mwitch.drag = null;
  }
}
function mwitchUpdateCloud(dt) {
  var cl = mwitch.cloud, nb;
  cl.ph += dt * (MWITCH_DRIFT + MWITCH_DRIFT_UP * mwitch.done) * (mwitch.phase === 'play' ? 1 : 0.3);
  cl.t += dt;
  if (mwitch.phase !== 'play') { if (cl.state !== 'drift' && cl.state !== 'jump') cl.state = 'drift'; }
  if (cl.state === 'drift') {
    // Jyrähdykset alkavat vasta ensimmäisen raidan jälkeen
    if (mwitch.done >= 1 && mwitch.phase === 'play') {
      cl.next -= dt;
      if (cl.next <= 0) {
        cl.state = 'warn'; cl.t = 0;
        playNote(82, 0, 0.6, 'triangle', 0.16);
        playNote(98, 0.2, 0.5, 'triangle', 0.12);
      }
    }
  } else if (cl.state === 'warn' && cl.t > MWITCH_JUMP_WARN) {
    cl.state = 'jump'; cl.t = 0;
    cl.from = cl.base;
    do { nb = 0.3 + Math.random() * 0.4; } while (Math.abs(nb - cl.base) < 0.2);
    cl.base = nb;
    mwitch.flashT = 0.25;
    artShakeStart(viewH * 0.005, 0.3);
    playNote(1400, 0, 0.05, 'square', 0.08);
    playNote(110, 0.03, 0.5, 'sawtooth', 0.1);
  } else if (cl.state === 'jump' && cl.t > MWITCH_JUMP_T) {
    cl.state = 'drift'; cl.t = 0;
    cl.next = MWITCH_JUMP_GAP[0] + Math.random() * (MWITCH_JUMP_GAP[1] - MWITCH_JUMP_GAP[0]);
  }
}
// Sadepisarat (vain kuva): lopussa kimallesadetta
function mwitchUpdateRain(dt) {
  var i, d, p = mwitchCloudPos(), S = mwitchCloudS(), n, bottom = mwitchRainBottom();
  mwitch.rainAcc = (mwitch.rainAcc || 0) + dt * 30;
  n = Math.floor(mwitch.rainAcc);
  mwitch.rainAcc -= n;
  for (i = 0; i < n && mwitch.rain.length < 70; i++) {
    mwitch.rain.push({ x: p.x + (Math.random() * 2 - 1) * S, y: p.y + S * 0.3, v: viewH * (0.8 + Math.random() * 0.25), c: Math.floor(Math.random() * 7) });
  }
  for (i = mwitch.rain.length - 1; i >= 0; i--) {
    d = mwitch.rain[i];
    d.y += d.v * dt * (mwitch.phase === 'play' ? 1 : 0.45);
    d.x -= viewH * 0.03 * dt;
    if (d.y > bottom) mwitch.rain.splice(i, 1);
  }
}
// Finaali: sateenkaari välkkyy, noita nauraa ja lentää silmukan
function mwitchUpdateFinale(dt) {
  var prev = mwitch.finT;
  mwitch.finT += dt;
  if (prev < 0.4 && mwitch.finT >= 0.4) {
    mwitch.laughT = 1.4;
    var i;
    for (i = 0; i < 6; i++) playNote(i % 2 ? 1175 : 1397, i * 0.12, 0.1, 'square', 0.09);
  }
  if (prev < 1.3 && mwitch.finT >= 1.3 && !mwitch.won) {
    mwitch.won = true;
    startCelebration();
  }
}
// Noidan paikka: istuu luudallaan kiven päällä; finaalissa silmukka ja leijunta
function mwitchWitchPos() {
  var seat = mwitchSeat(), t, k, cx, cy, r, a, hop;
  hop = mwitch.hopT > 0 ? Math.sin((0.6 - mwitch.hopT) / 0.6 * Math.PI) * viewH * 0.04 : 0;
  if (mwitch.phase !== 'finale') return { x: seat.x, y: seat.y - hop, dir: -1 };
  t = mwitch.finT - 1.5;
  cx = viewW * 0.62; r = mwitchU() * 0.17; cy = viewH * 0.4;
  if (t < 0) return { x: seat.x, y: seat.y - hop, dir: -1 };
  if (t < 0.7) {
    k = easeInOutSine(t / 0.7);
    return { x: seat.x + (cx - seat.x) * k, y: seat.y + (cy + r - seat.y) * k, dir: -1 };
  }
  if (t < 2.9) {
    a = Math.PI / 2 + ((t - 0.7) / 2.2) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, dir: Math.sin(a) > 0 ? -1 : 1 };
  }
  return { x: cx, y: cy + r + Math.sin(mwitch.finT * 2) * viewH * 0.01, dir: -1 };
}

// ---------- Piirto: tausta ----------
function renderMwitchBg(b, w, h) {
  var i, x, y, g = b.createLinearGradient(0, 0, 0, h * 0.75), gy = mwitchGroundY();
  g.addColorStop(0, '#a99de0');
  g.addColorStop(0.6, '#d9cff4');
  g.addColorStop(1, '#f7f0fd');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 8; i++) drawCloud(b, w * (0.05 + i * 0.13), h * (0.07 + (i % 3) * 0.05), h * (0.02 + (i % 2) * 0.008), 0.5);
  // Kaukaiset huiput pilvimeren yllä
  fillHillBand(b, w, h, h * 0.66, artMix('#a596d6', '#efe8fb', 0.55), function (px) {
    return h * 0.66 - Math.abs(Math.sin(px / w * 9 + 0.5)) * h * 0.1;
  });
  b.fillStyle = 'rgba(255,255,255,0.8)';
  for (i = 0; i < 12; i++) cloudShape(b, w * (i / 11), h * 0.68 + (i % 2) * h * 0.015, h * 0.03);
  // Huipun tasanne
  b.beginPath();
  b.moveTo(0, h);
  b.lineTo(0, gy + h * 0.02);
  for (x = 0; x <= w; x += 10) b.lineTo(x, gy - Math.sin(x / w * Math.PI) * h * 0.035 + Math.sin(x * 0.02) * h * 0.004);
  b.lineTo(w, h);
  b.closePath();
  artFillPath(b, '#b6a8e2', gy - h * 0.04, h, h * 0.1, { lineColor: '#6e5fa0' });
  b.strokeStyle = '#8fd07a';
  b.lineWidth = h * 0.014;
  b.lineCap = 'round';
  b.beginPath();
  for (x = 0; x <= w; x += 10) { y = gy - Math.sin(x / w * Math.PI) * h * 0.035 + Math.sin(x * 0.02) * h * 0.004 + h * 0.004; if (x) b.lineTo(x, y); else b.moveTo(x, y); }
  b.stroke();
  for (i = 0; i < 26; i++) {
    x = w * ((i * 0.137 + 0.03) % 1);
    y = gy + h * (0.04 + ((i * 0.31) % 1) * 0.13);
    if (i % 3 === 0) drawFlower(b, x, y, h * 0.007, RAINBOW_COLORS[i % 7]);
    else if (i % 3 === 1) hubThemeTuft(b, x, y, h * 0.1, 'rgba(90,160,80,0.75)');
    else artBlob(b, x, y, h * 0.018, h * 0.01, '#c8bdea', { lineColor: '#6e5fa0' });
  }
  // Lätäköt
  artBlob(b, w * 0.24, gy + h * 0.1, h * 0.06, h * 0.014, '#a8c4f4', { lineColor: '#6a88c8', line: Math.max(1, h * 0.002) });
  artBlob(b, w * 0.78, gy + h * 0.13, h * 0.05, h * 0.012, '#a8c4f4', { lineColor: '#6a88c8', line: Math.max(1, h * 0.002) });
  // Noidan kivi
  var st = mwitchSeat();
  artShadow(b, st.x, gy + h * 0.03, h * 0.09, h * 0.02, 0.2);
  artBlob(b, st.x, gy + h * 0.005, h * 0.075, h * 0.035, '#a596d6', { lineColor: '#5e4f8e', hi: 0.25 });
}

// ---------- Piirto ----------
function drawMwitch() {
  var c = ctx, i, o, cp, S, u = mwitchU(), wp, us;
  if (!beginPlayWorld()) return;
  if (!mwitch.built) { mwitchEndWorld(); return; }
  mwitchDrawSun(c);
  mwitchDrawArcs(c);
  propsDraw(c);
  // Yksisarvinen ja prinsessa katsovat
  us = mwitchUS();
  drawUnicorn(c, mwitchUniX(), mwitchGroundY() + viewH * 0.02 - (mwitch.cheerT > 0 ? Math.abs(Math.sin(mwitch.cheerT * 8)) * viewH * 0.015 : 0), us, 1, 0, false, globalT);
  mwitchDrawRainCurtain(c);
  mwitchDrawCloud(c);
  mwitchDrawWitch(c);
  mwitchDrawBasket(c, false);
  for (i = 0; i < mwitch.orbs.length; i++) {
    o = mwitch.orbs[i];
    if (o.state === 'done' || o === mwitch.drag) continue;
    mwitchDrawOrb(c, o.x, o.y, mwitchOrbR() * (o.state === 'fly' ? 1 - Math.min(1, o.t / MWITCH_FLY_T) * 0.4 : 1), o.i, o.ph);
  }
  mwitchDrawBasket(c, true);
  if (mwitch.drag) {
    o = mwitch.drag;
    // Kohdekorostus: sadealue hehkuu, kun säde on sateessa
    if (mwitchInRain(o.x, o.y)) artGlow(c, o.x, o.y, mwitchOrbR() * 3, '#ffffff', 0.6);
    mwitchDrawOrb(c, o.x, o.y, mwitchOrbR() * 1.12, o.i, o.ph);
  }
  drawParticlesLayer(c);
  mwitchDrawHint(c);
  // Salaman välähdys
  if (mwitch.flashT > 0) {
    c.fillStyle = 'rgba(255,255,240,' + (mwitch.flashT / 0.25 * 0.4) + ')';
    c.fillRect(0, 0, viewW, viewH);
  }
  mwitchEndWorld();
  mwitchDrawHud(c);
}
// Kuten endPlayWorld, mutta ilman yleistä juhlasateenkaarta (oma sateenkaari on jo taivaalla)
function mwitchEndWorld() {
  var i, cf;
  artPopsDraw(ctx, camX);
  if (celebrating) {
    for (i = 0; i < confetti.length; i++) {
      cf = confetti[i];
      ctx.save();
      ctx.translate(cf.x, cf.y);
      ctx.rotate(cf.rot);
      ctx.fillStyle = cf.color;
      ctx.fillRect(-cf.size / 2, -cf.size / 3, cf.size, cf.size * 0.66);
      ctx.restore();
    }
  }
  ctx.restore();
  drawLight(ctx, phaseNow().light);
}
// Aurinko vasemmassa yläkulmassa: kirkastuu raita raidalta
function mwitchDrawSun(c) {
  var k = mwitch.cloud.light, x = viewW * 0.1, y = viewH * 0.14, r = viewH * 0.055 * (1 + k * 0.25), i, a;
  artGlow(c, x, y, r * (2.5 + k * 2), '#ffe08a', 0.3 + k * 0.4);
  c.strokeStyle = 'rgba(255,200,60,' + (0.3 + k * 0.6) + ')';
  c.lineWidth = r * 0.2;
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    a = (i / 7) * Math.PI * 2 + globalT * 0.15;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    c.lineTo(x + Math.cos(a) * r * (1.7 + 0.5 * (i < mwitch.done ? 1 : 0)), y + Math.sin(a) * r * (1.7 + 0.5 * (i < mwitch.done ? 1 : 0)));
    c.stroke();
  }
  artCircle(c, x, y, r, artMix('#fff0b0', '#ffd84a', 0.4 + k * 0.6), { lineColor: '#f0a830', hi: 0.4 });
  artEye(c, x - r * 0.3, y - r * 0.08, r * 0.12, 0.5, (globalT % 3.4) < 0.12);
  artEye(c, x + r * 0.3, y - r * 0.08, r * 0.12, 0.5, (globalT % 3.4) < 0.12);
  c.strokeStyle = '#c0602a'; c.lineWidth = r * 0.07;
  c.beginPath(); c.arc(x, y + r * 0.12, r * 0.28, 0.3, Math.PI - 0.3); c.stroke();
}
// Sateenkaari: valmiit raidat ja haaleat pisteviivakaaret puuttuville
function mwitchDrawArcs(c) {
  var cc = mwitchArcC(), bw = mwitchBandW(), i, b, r, a0, a1, span, fin = mwitch.phase === 'finale';
  c.lineCap = 'butt';
  for (i = 0; i < MWITCH_BANDS; i++) {
    b = mwitch.bands[i];
    r = mwitchBandR(i);
    if (b.k < 1) {
      c.setLineDash ? c.setLineDash([bw * 0.25, bw * 0.55]) : 0;
      c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.45);
      c.lineWidth = Math.max(1.5, bw * 0.18);
      c.lineCap = 'round';
      c.beginPath(); c.arc(cc.x, cc.y, r, Math.PI, Math.PI * 2); c.stroke();
      if (c.setLineDash) c.setLineDash([]);
      c.lineCap = 'butt';
    }
    if (b.k > 0) {
      span = Math.PI * easeOutCubic(b.k);
      a0 = Math.max(Math.PI, b.a - span);
      a1 = Math.min(Math.PI * 2, b.a + span);
      c.strokeStyle = RAINBOW_COLORS[i];
      c.globalAlpha = fin ? 0.85 + Math.sin(globalT * 6 + i) * 0.15 : 0.9;
      c.lineWidth = bw * 1.02;
      c.beginPath(); c.arc(cc.x, cc.y, r, a0, a1); c.stroke();
      c.globalAlpha = 1;
      // Kasvavan raidan kärjet kipinöivät
      if (b.k < 1) {
        drawStar(c, cc.x + Math.cos(a0) * r, cc.y + Math.sin(a0) * r, bw * 0.45, globalT * 4, 1);
        drawStar(c, cc.x + Math.cos(a1) * r, cc.y + Math.sin(a1) * r, bw * 0.45, -globalT * 4, 1);
      }
    }
  }
  // Valmiin kaaren kiilto
  if (mwitch.done > 0) {
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.lineWidth = bw * 0.3;
    c.beginPath(); c.arc(cc.x, cc.y, mwitchBandR(0) + bw * 0.2, Math.PI * 1.15, Math.PI * 1.5); c.stroke();
  }
}
// Sadeverho pilven alla: näyttää, minne säde pitää viedä
function mwitchDrawRainCurtain(c) {
  var p = mwitchCloudPos(), S = mwitchCloudS(), bottom = mwitchRainBottom(), i, d, g, fin = mwitch.phase !== 'play', top = p.y + S * 0.25;
  g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, fin ? 'rgba(255,255,255,0.25)' : 'rgba(120,140,220,0.3)');
  g.addColorStop(1, 'rgba(120,140,220,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(p.x - S * 0.95, top); c.lineTo(p.x + S * 0.95, top);
  c.lineTo(p.x + S * 0.95 - viewH * 0.015, bottom); c.lineTo(p.x - S * 0.95 - viewH * 0.015, bottom);
  c.closePath();
  c.fill();
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.5, viewH * 0.004);
  if (!fin) {
    c.strokeStyle = 'rgba(100,125,215,0.75)';
    c.beginPath();
    for (i = 0; i < mwitch.rain.length; i++) { d = mwitch.rain[i]; c.moveTo(d.x, d.y); c.lineTo(d.x + viewH * 0.004, d.y - viewH * 0.026); }
    c.stroke();
  } else {
    for (i = 0; i < mwitch.rain.length; i++) {
      d = mwitch.rain[i];
      c.fillStyle = RAINBOW_COLORS[d.c];
      c.fillRect(d.x - 2, d.y - 2, 4, 4);
    }
  }
}
// Iso pilvi: tumma ja surullinen, vaalenee ja hymyilee raita raidalta
function mwitchDrawCloud(c) {
  var p = mwitchCloudPos(), S = mwitchCloudS(), k = mwitch.cloud.light, x = p.x, y = p.y, col, warn = mwitch.cloud.state === 'warn', i, fin = mwitch.phase !== 'play';
  var po = mwitch.cloud.pokeT > 0 ? Math.sin(mwitch.cloud.pokeT * 20) * S * 0.04 : 0;
  col = fin ? '#ffffff' : artMix(warn ? '#5a5488' : '#6f6a9a', '#f2eefc', k * 0.85);
  // Salama hypyssä
  if (mwitch.cloud.state === 'jump' && mwitch.cloud.t < 0.2) {
    c.strokeStyle = '#ffe27a';
    c.lineWidth = Math.max(2, S * 0.06);
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x + S * 0.1, y + S * 0.35); c.lineTo(x - S * 0.15, y + S * 0.85); c.lineTo(x + S * 0.08, y + S * 0.85); c.lineTo(x - S * 0.2, y + S * 1.5);
    c.stroke();
  }
  artUnion(c, mwitchCloudPath, x + po, y, S, y - S * 0.8, y + S * 0.5, col, { lineColor: artShade(col, -0.35) });
  artHighlight(c, x - S * 0.35, y - S * 0.45, S * 0.25, S * 0.1, 0.35);
  // Kasvot
  var blink = (globalT % 3.1) < 0.12, mood = fin ? 1 : k;
  artEye(c, x - S * 0.25, y - S * 0.05, S * 0.08, 0, blink);
  artEye(c, x + S * 0.25, y - S * 0.05, S * 0.08, 0, blink);
  c.strokeStyle = '#3a2a5a';
  c.lineWidth = Math.max(1.5, S * 0.035);
  c.lineCap = 'round';
  c.beginPath();
  if (mood > 0.6) c.arc(x, y + S * 0.08, S * 0.14, 0.25, Math.PI - 0.25);
  else if (mood > 0.3) { c.moveTo(x - S * 0.1, y + S * 0.16); c.lineTo(x + S * 0.1, y + S * 0.16); }
  else c.arc(x, y + S * 0.25, S * 0.12, Math.PI * 1.2, Math.PI * 1.8);
  c.stroke();
  if (mood > 0.3) { artBlush(c, x - S * 0.42, y + S * 0.08, S * 0.08); artBlush(c, x + S * 0.42, y + S * 0.08, S * 0.08); }
  if (warn) {
    // Mutina: pienet viivat pilven ympärillä
    c.strokeStyle = 'rgba(60,40,110,0.6)';
    c.lineWidth = Math.max(1.5, S * 0.03);
    for (i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(x + S * (1.2 + i * 0.1), y - S * 0.3 + i * S * 0.25); c.lineTo(x + S * (1.4 + i * 0.1), y - S * 0.35 + i * S * 0.25); c.stroke();
    }
  }
}
function mwitchCloudPath(c, x, y, s) {
  var P = [[-0.62, 0.08, 0.42], [0.62, 0.1, 0.4], [-0.18, -0.22, 0.56], [0.3, -0.14, 0.48], [0, 0.12, 0.4]], i;
  c.beginPath();
  // moveTo ennen jokaista kaarta: muuten kaaret yhdistyvät viivoilla (kiila reunaan)
  for (i = 0; i < P.length; i++) {
    c.moveTo(x + (P[i][0] + P[i][2]) * s, y + P[i][1] * s);
    c.arc(x + P[i][0] * s, y + P[i][1] * s, P[i][2] * s, 0, Math.PI * 2);
  }
}
// Noita: istuu luudallaan kivellä oma pikkupilvi päänsä päällä (haihtuu, kun hän ilahtuu)
function mwitchDrawWitch(c) {
  var p = mwitchWitchPos(), s = mwitchWitchS(), mood = mwitchMood(), k = 1 - mwitch.done / MWITCH_BANDS, pk, x, y, i;
  pk = mwitch.pokeT > 0 ? Math.sin(mwitch.pokeT * 25) * s * 0.05 : 0;
  x = p.x + pk; y = p.y;
  if (mwitch.phase !== 'finale' || mwitch.finT < 1.5) artShadow(c, x, mwitchGroundY() + viewH * 0.01, s * 1.6, s * 0.3, 0.18);
  if (mwitch.laughT > 0) y -= Math.abs(Math.sin(mwitch.laughT * 14)) * s * 0.12;
  drawStormWitch(c, x, y, s, p.dir, mood);
  // Pieni oma sadepilvi (surullisena)
  if (k > 0.05 && mwitch.phase === 'play') {
    c.globalAlpha = Math.min(1, k * 1.3);
    drawWitchCloud(c, x + s * 0.1, y - s * 3.4, s * 0.7 * (0.6 + k * 0.4), globalT, k);
    c.globalAlpha = 1;
  }
  // Toive puhekuplassa ennen ensimmäistä raitaa: pieni sateenkaari
  if (mwitch.done === 0 && mwitch.phase === 'play' && !mwitch.drag) {
    var bx = x - s * 2.2, by = y - s * 3.2, br = s * 0.75;
    c.globalAlpha = 0.95;
    artBlob(c, bx, by, br * 1.25, br, '#ffffff', { lineColor: '#b8a8e0' });
    artCircle(c, bx + br * 0.9, by + br * 1.05, br * 0.18, '#ffffff', { lineColor: '#b8a8e0' });
    artCircle(c, bx + br * 1.3, by + br * 1.35, br * 0.1, '#ffffff', { lineColor: '#b8a8e0' });
    c.lineWidth = br * 0.09;
    for (i = 0; i < 7; i++) {
      c.strokeStyle = RAINBOW_COLORS[i];
      c.beginPath(); c.arc(bx, by + br * 0.45, br * (0.85 - i * 0.09), Math.PI, 0); c.stroke();
    }
    c.globalAlpha = 1;
  }
  // Iloisena sydämiä
  if (mwitch.phase === 'finale' && mwitch.laughT > 0 && Math.random() < 0.15) spawnSparkles(x, y - s * 1.2, 2, '#ff9fb8');
}
// Kori: takareuna ennen palloja, etureuna niiden päälle
function mwitchDrawBasket(c, front) {
  var u = mwitchU(), x = viewW / 2, y = viewH * 0.9, w = u * 0.38, h = viewH * 0.06, i;
  if (!front) {
    artShadow(c, x, y + h * 0.9, w * 1.1, h * 0.25, 0.2);
    artBlob(c, x, y - h * 0.15, w, h * 0.35, '#a8703c', { lineColor: '#5a3a1a' });
    artBlob(c, x, y - h * 0.15, w * 0.94, h * 0.26, '#6a4422', { line: false });
    // Hehku korista
    artGlow(c, x, y - h * 0.3, w * 0.9, '#ffe08a', 0.25 + Math.sin(globalT * 2) * 0.05);
    return;
  }
  c.beginPath();
  c.moveTo(x - w, y - h * 0.15);
  c.quadraticCurveTo(x, y + h * 0.25, x + w, y - h * 0.15);
  c.lineTo(x + w * 0.85, y + h * 0.75);
  c.quadraticCurveTo(x, y + h * 1.05, x - w * 0.85, y + h * 0.75);
  c.closePath();
  artFillPath(c, '#c08a4a', y - h * 0.15, y + h, h, { lineColor: '#5a3a1a' });
  // Punos
  c.strokeStyle = 'rgba(90,58,26,0.45)';
  c.lineWidth = Math.max(1, h * 0.06);
  for (i = 1; i < 10; i++) {
    c.beginPath(); c.moveTo(x - w + i * w * 0.2, y + h * 0.05); c.lineTo(x - w * 0.88 + i * w * 0.177, y + h * 0.82); c.stroke();
  }
  c.beginPath(); c.moveTo(x - w * 0.95, y + h * 0.35); c.quadraticCurveTo(x, y + h * 0.65, x + w * 0.95, y + h * 0.35); c.stroke();
  artLimb(c, x - w, y - h * 0.15, x + w, y - h * 0.15, h * 0.12, '#d8a060', '#5a3a1a');
}
// Auringonsäde-pallo: hehkuva pallo omassa värissään, pienet säteet ympärillä
function mwitchDrawOrb(c, x, y, r, i, ph) {
  var col = RAINBOW_COLORS[i], k, a;
  artGlow(c, x, y, r * 2.4, col, 0.5);
  c.strokeStyle = artMix(col, '#ffffff', 0.4);
  c.lineWidth = Math.max(1.5, r * 0.16);
  c.lineCap = 'round';
  for (k = 0; k < 6; k++) {
    a = k * Math.PI / 3 + ph * 0.8;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1);
    c.lineTo(x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45);
    c.stroke();
  }
  artCircle(c, x, y, r, col, { lineColor: artShade(col, -0.35), hi: 0.5 });
  artCircle(c, x, y, r * 0.42, artMix(col, '#ffffff', 0.65), { line: false });
}
// Vihjekäsi: säde korista sateeseen alussa ja pitkän tauon jälkeen
function mwitchDrawHint(c) {
  var o = null, i, k, p, hx, hy, sl;
  if (mwitch.phase !== 'play' || mwitch.drag || celebrating) return;
  if (!(mwitch.done === 0 && mwitch.idleT > 1.2) && mwitch.idleT < MWITCH_HINT_IDLE) return;
  for (i = 0; i < mwitch.orbs.length; i++) if (mwitch.orbs[i].state === 'basket') { o = mwitch.orbs[i]; break; }
  if (!o) return;
  sl = mwitchSlot(o.i);
  p = mwitchCloudPos();
  k = (mwitch.idleT % 2.2) / 2.2;
  var m = easeInOutSine(Math.min(1, k * 1.35));
  hx = sl.x + (p.x - sl.x) * m;
  hy = sl.y + (viewH * 0.5 - sl.y) * m;
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.85;
  if (m > 0.05) {
    c.globalAlpha *= 0.6;
    mwitchDrawOrb(c, hx, hy, mwitchOrbR(), o.i, 0);
    c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.85;
  }
  drawHand(c, hx + mwitchOrbR() * 0.6, hy + mwitchOrbR() * 1.1, viewH * 0.045);
  c.globalAlpha = 1;
}
// HUD: seitsemän raitaa (täyttyvät väreillään)
function mwitchDrawHud(c) {
  drawPickupHud(c, MWITCH_BANDS, function (i) { return mwitch.bands[i].k >= 1; }, function (cc, x, y, s) {
    var idx = Math.round((x - hudX() - viewH * 0.022 * 1.4 * 0.5 - viewH * 0.022 * 1.6) / (viewH * 0.022 * 3.2));
    mwitchDrawOrb(cc, x, y, s * 0.75, Math.max(0, Math.min(6, idx)), globalT);
  });
}

// ---------- Kartan kuvake ----------
HUB_ICONS.witch = function (c, x, y, s) {
  var i, b = Math.sin(globalT * 1.5) * s * 0.02;
  c.lineWidth = s * 0.035;
  c.lineCap = 'butt';
  for (i = 0; i < 7; i++) {
    c.strokeStyle = RAINBOW_COLORS[i];
    c.beginPath(); c.arc(x, y + s * 0.22, s * (0.36 - i * 0.035), Math.PI, 0); c.stroke();
  }
  drawWitchCloud(c, x + s * 0.18, y - s * 0.2 + b, s * 0.14, globalT, 0.5);
  drawStormWitch(c, x - s * 0.05, y + s * 0.08 - b, s * 0.11, 1, 'happy');
};
