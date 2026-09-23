'use strict';

// Varjoperhonen (Kaukamaa, Hohtometsä): alueen vartija. Yhdistää alueen kaksi
// verbiä: SIPAISU (Tulikärpässieppo) ja POMPPU (Sienipomppu). Varjoperhonen
// on vienyt metsän valot. Joka kierroksessa:
//  1) Parvi: perhonen lähettää varjokoita prinsessaa kohti. Prinsessa seisoo
//     hohtokuplassa keskisienellä; sipaisu hajottaa koit. Perille päässyt koi
//     vie sydämen.
//  2) Syöksy: perhonen laskeutuu matalalle ja lipuu sivuttain, ja sen
//     sydänpilkku hehkuu hetken (valkoinen aikakaari kutistuu). Prinsessa
//     pomppii kolmella sienellä; sormi ohjaa sivuttain. Pompun huipulla pää
//     yltää pilkkuun: osuma! Perhonen pudottaa varjoitiöitä (osuma vie sydämen).
//     Sienten välistä maahan pudonnut pomppii matalalle, kunnes ohjaa takaisin
//     sienelle. Jos aika loppuu, perhonen nousee ja lähettää uuden parven.
// Kolme kierrosta: enemmän koita, nopeampi lipuminen, lyhyempi ikkuna.
// Kolmas osuma palauttaa valot: perhonen muuttuu vaaleaksi kuukehrääjäksi.
// Tehtävät osumien välissä: peili, muistiloitsu 5/4.

// koi: parven koit, gap: lähtöväli (s), koiSpeed × viewH/s, jink: väistöjä per koi,
// drift: perhosen lipumisnopeus syöksyssä, bob: sydänpilkun pystyheilunta × viewH,
// window: syöksyn kesto (s), spore: itiöiden väli (s)
var MOTH_ROUNDS = [
  { koi: 5, gap: 0.85, koiSpeed: 0.24, jink: 1, drift: 0.7, bob: 0.03, window: 5.5, spore: 1.3 },
  { koi: 8, gap: 0.6, koiSpeed: 0.29, jink: 1, drift: 0.9, bob: 0.04, window: 4.6, spore: 1.0 },
  { koi: 11, gap: 0.45, koiSpeed: 0.33, jink: 2, drift: 1.1, bob: 0.05, window: 3.8, spore: 0.8 }
];
var MOTH_APEX = 0.34;       // pompun korkeus sieneltä × viewH
var MOTH_GROUND_APEX = 0.1; // maasta vain matala pomppu
var MOTH_SPOT_R = 0.06;     // sydänpilkun osumasäde × viewH
var MOTH_KOI_R = 0.05;      // koin osumasäde (haavi) × viewH

var mth = {
  state: 'sleep', t: 0, round: 0, hits: 0,
  kois: [], spores: [], trail: [], sent: 0, nextKoi: 0,
  x: 0, y: 0, baseY: 0, drift: 0, winT: 0, hurtT: 0, calmT: 0, wake: 0,
  px: 0, py: 0, vx: 0, vy: 0, facing: 1, squash: 0, bouncing: false,
  lastX: 0, lastY: 0, lastT: 0, netBroken: 0, swiped: false, steered: false, hintT: 0,
  taskDelay: 0, sporeT: 0, lights: []
};

function mothShrooms() {
  var W = viewW, top = groundTop - viewH * 0.04, w = viewH * 0.24;
  return [
    { x: W * 0.24, y: top, w: w, press: 0 },
    { x: W * 0.5, y: top, w: w, press: 0 },
    { x: W * 0.76, y: top, w: w, press: 0 }
  ];
}
var mothShroomState = [0, 0, 0];
function mothSpot() { return { x: mth.x, y: mth.y + viewH * 0.02 }; }
function mothHead() { return { x: mth.px, y: mth.py - viewH * 0.12 }; }

// ---------- Alustus ----------
function initMoth() {
  var i;
  tasks = [makeTask(-5, 'mirror'), makeTask(-5, 'memory', { seqLen: 5, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  mth.state = 'sleep';
  mth.t = 0;
  mth.round = 0;
  mth.hits = 0;
  mth.kois = [];
  mth.spores = [];
  mth.trail = [];
  mth.lights = [];
  mth.winT = 0;
  mth.hurtT = 0;
  mth.calmT = 0;
  mth.wake = 0;
  mth.swiped = false;
  mth.steered = false;
  mth.hintT = 0;
  mth.taskDelay = 0;
  mth.netBroken = 0;
  mth.x = viewW * 0.5;
  mth.baseY = viewH * 0.2;
  mth.y = mth.baseY;
  mothStand();
  renderBackground();
  playNote(196, 0, 0.5, 'triangle', 0.25);
  playNote(233, 0.3, 0.6, 'triangle', 0.22);
}
// Prinsessa seisoo keskisienellä (parven aikana)
function mothStand() {
  var s = mothShrooms()[1];
  mth.px = s.x;
  mth.py = s.y;
  mth.vx = 0;
  mth.vy = 0;
  mth.bouncing = false;
}
function respawnMoth() {
  // Sydämet loppu: kierros alkaa uudelleen parvesta
  mth.kois = [];
  mth.spores = [];
  mth.trail = [];
  mothStand();
  mothStartSwarm();
  spawnSparkles(mth.px, mth.py - viewH * 0.1, 14, '#bff8ff');
}
function resizeMoth() {
  camX = 0;
  if (!mth.bouncing) mothStand();
}

function handleMothTap(px, py) {
  mth.lastX = px;
  mth.lastY = py;
  mth.lastT = globalT;
  mth.trail = [];
}

function mothStartSwarm() {
  mth.state = 'swarm';
  mth.t = 0;
  mth.sent = 0;
  mth.nextKoi = 0.6;
  mth.drift = 0;
  playNote(262, 0, 0.3, 'triangle', 0.2);
  playNote(233, 0.2, 0.4, 'triangle', 0.2);
}
function mothStartDive() {
  var R = MOTH_ROUNDS[mth.round];
  mth.state = 'dive';
  mth.t = 0;
  mth.winT = R.window;
  mth.sporeT = R.spore;
  mth.bouncing = true;
  mth.vy = bounceVy(MOTH_APEX);
  artPop(mth.x, mth.y, viewH * 0.12, '#ffe27a', 'ring');
  playNote(1047, 0, 0.15, 'sine', 0.3);
  playNote(1319, 0.1, 0.25, 'sine', 0.3);
}

// ---------- Päivitys ----------
function updateMoth(dt) {
  var i, k, R = MOTH_ROUNDS[Math.min(mth.round, MOTH_ROUNDS.length - 1)], h = viewH, W = viewW, busy, sh = mothShrooms(), dx, dy, sp, px, py, s;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (mth.hurtT > 0) mth.hurtT -= dt;
  if (mth.netBroken > 0) mth.netBroken -= dt;
  for (i = 0; i < 3; i++) if (mothShroomState[i] > 0) mothShroomState[i] = Math.max(0, mothShroomState[i] - dt * 4);
  if (mth.taskDelay > 0 && !busy) {
    mth.taskDelay -= dt;
    if (mth.taskDelay <= 0) {
      if (mth.hits === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (mth.hits === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) { mth.trail = []; return; }
  mth.t += dt;
  for (i = mth.lights.length - 1; i >= 0; i--) { mth.lights[i].t += dt; }

  // Perhosen liike: leijuu ylhäällä, syöksyssä matalammalla ja sivuttain
  // Syöksyssä pilkku on juuri pompun huipun korkeudella: ylttää vain sienen kohdalta,
  // huipulla ja kun pilkku on heilunnan alaosassa
  var targetY = mth.state === 'dive' ? h * 0.2 : h * 0.18;
  mth.baseY += (targetY - mth.baseY) * Math.min(1, dt * 2);
  if (mth.state === 'dive') mth.drift += dt * R.drift;
  else mth.drift += dt * 0.35;
  var amp = mth.state === 'dive' ? W * 0.3 : W * 0.12;
  mth.x = W * 0.5 + Math.sin(mth.drift) * amp;
  mth.y = mth.baseY + Math.sin(globalT * 2.2) * h * (mth.state === 'dive' ? R.bob : 0.015);

  if (mth.state === 'sleep') {
    mth.wake = 0;
    if (mth.t > 1.6) { mth.state = 'wake'; mth.t = 0; artShakeStart(h * 0.008, 0.6); playNote(98, 0, 0.8, 'sawtooth', 0.18); }
  } else if (mth.state === 'wake') {
    mth.wake = Math.min(1, mth.t / 1.0);
    if (mth.t > 1.2) mothStartSwarm();
  } else if (mth.state === 'swarm') {
    if (!mth.swiped) mth.hintT += dt;
    mth.nextKoi -= dt;
    if (mth.sent < R.koi && mth.nextKoi <= 0) {
      mothSendKoi(R);
      mth.sent++;
      mth.nextKoi = R.gap;
    }
    if (mth.sent >= R.koi && mth.kois.length === 0) mothStartDive();
  } else if (mth.state === 'dive') {
    if (!mth.steered) mth.hintT += dt;
    mth.winT -= dt;
    mth.sporeT -= dt;
    if (mth.sporeT <= 0) {
      mth.sporeT = R.spore;
      // Itiö putoaa prinsessan kohdalle (lipuu perhoselta sivuttain)
      mth.spores.push({ x: mth.x, y: mth.y + h * 0.05, tx: mth.px + (Math.random() - 0.5) * h * 0.08, vy: h * 0.32, t: 0 });
      playNote(180, 0, 0.1, 'triangle', 0.1);
    }
    if (mth.winT <= 0) {
      // Aika loppui: perhonen nousee ja lähettää uuden parven
      mth.spores = [];
      mothStand();
      mothStartSwarm();
      playNote(300, 0, 0.2, 'triangle', 0.2);
    }
  } else if (mth.state === 'hurt') {
    if (mth.t > 1.3) {
      if (mth.hits >= MOTH_ROUNDS.length) { mth.state = 'calm'; mth.t = 0; mth.calmT = 0; soundFanfare(); mothLightsReturn(); }
      else { mth.round = mth.hits; mothStand(); mothStartSwarm(); }
    }
  } else if (mth.state === 'calm') {
    mth.calmT += dt;
    if (mth.calmT > 2.6 && !celebrating) startCelebration();
  }

  // Varjokoit lepattavat aaltoillen prinsessaa kohti
  for (i = mth.kois.length - 1; i >= 0; i--) {
    var ko = mth.kois[i];
    ko.flap += dt * 14;
    ko.ph += dt * 2.4;
    dx = mth.px - ko.x; dy = (mth.py - h * 0.08) - ko.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    // Väistö: kun haavi lähestyy, koi syöksähtää hetkeksi sivuun
    if (ko.jinks > 0 && holding && mth.state === 'swarm' && mth.trail.length) {
      var hx = lastPX - ko.x, hy = lastPY - ko.y, hd2 = Math.sqrt(hx * hx + hy * hy);
      if (hd2 < h * 0.16 && hd2 > h * 0.07) {
        ko.jinks--;
        ko.jt = 0.35;
        var sgn = Math.random() < 0.5 ? -1 : 1;
        ko.jx = -hy / hd2 * sgn * h * 0.7;
        ko.jy = hx / hd2 * sgn * h * 0.7;
        playNote(1500, 0, 0.05, 'triangle', 0.08);
      }
    }
    if (ko.jt > 0) { ko.jt -= dt; ko.x += ko.jx * dt; ko.y += ko.jy * dt; }
    ko.x += (dx / d * ko.sp + Math.cos(ko.ph) * ko.sp * 0.9) * dt;
    ko.y += (dy / d * ko.sp + Math.sin(ko.ph * 1.3) * ko.sp * 0.5) * dt;
    ko.y = Math.max(viewH * 0.05, ko.y);
    ko.moth = { x: ko.x, y: ko.y, flap: ko.flap };
    if (d < h * 0.07) {
      // Perillä: kupla välähtää ja sydän menee
      mth.kois.splice(i, 1);
      spawnSparkles(ko.x, ko.y, 12, '#6a4a9a');
      artShakeStart(h * 0.008, 0.25);
      var koisBefore = mth.kois;
      if (!loseHeart()) playNote(200, 0, 0.12, 'sawtooth', 0.12);
      // Viimeinen sydän: respawnMoth aloitti kierroksen alusta ja vaihtoi listan
      if (mth.kois !== koisBefore) break;
    }
  }
  // Haavi (vain parven aikana): sama sipaisu kuin Tulikärpässiepossa
  if (holding && mth.state === 'swarm' && mth.netBroken <= 0) {
    px = lastPX; py = lastPY;
    var ddt = Math.max(1e-3, globalT - mth.lastT);
    sp = Math.sqrt((px - mth.lastX) * (px - mth.lastX) + (py - mth.lastY) * (py - mth.lastY)) / ddt;
    if (sp > CATCH_NET_SPEED * h) {
      mth.swiped = true;
      mth.trail.push({ x: px, y: py, t: globalT });
      for (i = mth.kois.length - 1; i >= 0; i--) {
        ko = mth.kois[i];
        if (catchSegDist(ko.x, ko.y, mth.lastX, mth.lastY, px, py) < MOTH_KOI_R * h) {
          mth.kois.splice(i, 1);
          artPop(ko.x, ko.y, h * 0.06, '#c8fff4', 'burst');
          spawnSparkles(ko.x, ko.y, 12, '#c8fff4');
          playNote(880 + Math.random() * 200, 0, 0.1, 'sine', 0.25);
          playNote(1319, 0.06, 0.12, 'sine', 0.2);
        }
      }
    }
    mth.lastX = px; mth.lastY = py; mth.lastT = globalT;
  }
  for (i = mth.trail.length - 1; i >= 0; i--) if (globalT - mth.trail[i].t > 0.22) mth.trail.splice(i, 1);

  // Pomppu syöksyn aikana
  if (mth.bouncing) {
    var ax;
    if (holding) { mth.steered = true; ax = (lastPX - mth.px) * BOUNCE_K - mth.vx * BOUNCE_D; }
    else ax = -mth.vx * 3;
    mth.vx += ax * dt;
    mth.vx = Math.max(-BOUNCE_VMAX * W, Math.min(BOUNCE_VMAX * W, mth.vx));
    if (Math.abs(mth.vx) > W * 0.02) mth.facing = mth.vx > 0 ? 1 : -1;
    mth.px = Math.min(Math.max(mth.px + mth.vx * dt, W * 0.05), W * 0.95);
    var prevY = mth.py;
    mth.vy += BOUNCE_G * h * dt;
    mth.py += mth.vy * dt;
    if (mth.squash > 0) mth.squash = Math.max(0, mth.squash - dt * 5);
    if (mth.vy > 0) {
      var landed = false;
      for (i = 0; i < sh.length; i++) {
        s = sh[i];
        if (prevY <= s.y && mth.py >= s.y && Math.abs(mth.px - s.x) <= s.w / 2 + h * 0.015) {
          mth.py = s.y;
          mth.vy = bounceVy(MOTH_APEX);
          mth.squash = 1;
          mothShroomState[i] = 1;
          spawnDust(mth.px, s.y, 4, 0);
          playNote(440 + i * 110, 0, 0.08, 'sine', 0.2);
          landed = true;
          break;
        }
      }
      // Maahan: matala pomppu
      if (!landed && mth.py >= groundTop + h * 0.03) {
        mth.py = groundTop + h * 0.03;
        mth.vy = bounceVy(MOTH_GROUND_APEX);
        mth.squash = 1;
        spawnDust(mth.px, mth.py, 3, 0);
        playNote(220, 0, 0.08, 'triangle', 0.15);
      }
    }
    // Osuma sydänpilkkuun
    if (mth.state === 'dive') {
      var hd = mothHead(), spot = mothSpot();
      dx = hd.x - spot.x; dy = hd.y - spot.y;
      if (dx * dx + dy * dy < MOTH_SPOT_R * MOTH_SPOT_R * h * h) mothHit();
    }
  }
  // Itiöt putoavat
  for (i = mth.spores.length - 1; i >= 0; i--) {
    var sp2 = mth.spores[i];
    sp2.t += dt;
    sp2.y += sp2.vy * dt;
    if (sp2.tx !== undefined) sp2.x += (sp2.tx - sp2.x) * Math.min(1, dt * 2.5);
    dx = sp2.x - mth.px; dy = sp2.y - (mth.py - h * 0.07);
    if (dx * dx + dy * dy < h * h * 0.0036) {
      mth.spores.splice(i, 1);
      spawnSparkles(sp2.x, sp2.y, 8, '#6a4a9a');
      var sporesBefore = mth.spores;
      loseHeart();
      if (mth.spores !== sporesBefore) break;
      continue;
    }
    if (sp2.y > groundTop + h * 0.05) { spawnSparkles(sp2.x, groundTop + h * 0.04, 4, '#6a4a9a'); mth.spores.splice(i, 1); }
  }
}

function mothSendKoi(R) {
  var h = viewH, side = Math.random() < 0.5 ? -1 : 1;
  // Koit lähtevät perhosen siiviltä vuorotellen vasemmalta ja oikealta
  mth.kois.push({ x: mth.x + side * h * 0.2, y: mth.y, sp: R.koiSpeed * h * (0.85 + Math.random() * 0.3), ph: Math.random() * 6, flap: 0, jinks: R.jink, jx: 0, jy: 0, jt: 0 });
  playNote(330, 0, 0.1, 'triangle', 0.15);
}

function mothHit() {
  var spot = mothSpot();
  mth.hits++;
  mth.state = 'hurt';
  mth.t = 0;
  mth.hurtT = 1.2;
  mth.spores = [];
  mth.vy = Math.max(mth.vy, 0);
  artPop(spot.x, spot.y, viewH * 0.16, '#fff6a0', 'burst');
  spawnSparkles(spot.x, spot.y, 28, '#fff6a0');
  artShakeStart(viewH * 0.014, 0.5);
  playNote(523, 0, 0.2, 'triangle', 0.4);
  playNote(784, 0.12, 0.25, 'triangle', 0.4);
  playNote(1047, 0.25, 0.4, 'triangle', 0.45);
  // Hehkupilkku irtoaa tulikärpäsiksi, jotka lentävät metsään
  mothLightsBurst(spot.x, spot.y, 5);
  if (mth.hits === 1 || mth.hits === 2) mth.taskDelay = 1.5;
}
function mothLightsBurst(x, y, n) {
  var i, a;
  for (i = 0; i < n; i++) {
    a = Math.random() * Math.PI * 2;
    mth.lights.push({ x0: x, y0: y, x1: viewW * (0.05 + Math.random() * 0.9), y1: viewH * (0.1 + Math.random() * 0.55), t: 0, col: i % 3 });
  }
}
function mothLightsReturn() {
  mothLightsBurst(mth.x, mth.y, 18);
}

// ---------- Piirto ----------
function renderMothBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#07091f');
  g.addColorStop(0.6, '#161f45');
  g.addColorStop(1, '#1d3a4a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 40; i++) {
    x = vw * ((i * 0.137 + 0.05) % 1);
    b.fillStyle = 'rgba(255,255,240,' + (0.15 + (i % 4) * 0.12) + ')';
    b.beginPath(); b.arc(x, h * ((i * 0.071) % 0.5), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  // Himmeät jättisienet ja puunrungot
  for (i = 0; i < 7; i++) {
    x = vw * (0.04 + i * 0.155);
    b.fillStyle = 'rgba(30,40,80,0.8)';
    b.fillRect(x - h * 0.02, h * 0.3, h * 0.04, groundTop - h * 0.3);
    b.beginPath(); b.ellipse(x, h * 0.3, h * (0.1 + (i % 2) * 0.04), h * 0.05, 0, Math.PI, 0); b.fill();
  }
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#1a3a44');
  g.addColorStop(1, '#0a1a22');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
}

function drawMothShroom(c, s, press, i) {
  var k, h = viewH, w = s.w, x = s.x, cy = s.y + h * 0.075 + press * h * 0.012, capH = h * 0.06 * (1 - press * 0.3);
  var col = ['#5fd4c8', '#b98aff', '#ff8ad8'][i];
  artRoundRect(c, x - w * 0.09, cy, w * 0.18, groundTop + h * 0.06 - cy, w * 0.06, '#f0e8ff', { lineColor: '#8a7ab8', shadeTo: '#c9bfe8' });
  artGlow(c, x, cy - capH * 0.5, w * 0.7, col, mth.state === 'dive' ? 0.45 : 0.25);
  c.beginPath();
  c.moveTo(x - w / 2, cy + h * 0.006);
  c.quadraticCurveTo(x - w * 0.55, cy - capH * 1.3, x, cy - capH * 1.4);
  c.quadraticCurveTo(x + w * 0.55, cy - capH * 1.3, x + w / 2, cy + h * 0.006);
  c.closePath();
  artFillPath(c, col, cy - capH * 1.4, cy, w * 0.3, { lineColor: artShade(col, -0.45), line: Math.max(1.5, h * 0.004) });
  c.fillStyle = 'rgba(230,255,250,0.85)';
  for (k = 0; k < 4; k++) { c.beginPath(); c.arc(x + (k - 1.5) * w * 0.2, cy - capH * (0.55 + (k % 2) * 0.35), h * (0.007 + (k % 2) * 0.004), 0, Math.PI * 2); c.fill(); }
}

// Varjoperhonen: tummat siivet silmätäplineen; rauhoituttuaan vaalea kuukehrääjä
function drawMothBoss(c) {
  var h = viewH, s = h * 0.13, x = mth.x, y = mth.y, calm = mth.state === 'calm', dive = mth.state === 'dive';
  var hurt = mth.hurtT > 0 ? Math.sin(mth.hurtT * 30) * s * 0.06 : 0, fl = Math.sin(globalT * (mth.state === 'sleep' ? 1.5 : 5)) * 0.18, i;
  x += hurt;
  var wing = calm ? '#d8ffe8' : '#2e2050', wing2 = calm ? '#a8f0d0' : '#4a3478', line = calm ? '#6ab89a' : '#140a28';
  artGlow(c, x, y, s * 3.2, calm ? '#c8fff0' : '#3a1a6a', calm ? 0.5 : 0.45);
  for (i = -1; i <= 1; i += 2) {
    // Yläsiipi ja alasiipi
    c.save();
    c.translate(x, y);
    c.scale(i, 1);
    c.rotate(-fl);
    c.beginPath();
    c.moveTo(0, -s * 0.1);
    c.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.9, -s * 1.0, s * 1.8, -s * 0.2);
    c.bezierCurveTo(s * 1.6, s * 0.2, s * 0.6, s * 0.2, 0, s * 0.05);
    artFillPath(c, wing, -s * 1.2, s * 0.2, s, { lineColor: line, line: Math.max(2, s * 0.03) });
    c.beginPath();
    c.moveTo(0, s * 0.05);
    c.bezierCurveTo(s * 0.9, s * 0.1, s * 1.2, s * 0.9, s * 0.6, s * 1.1);
    c.bezierCurveTo(s * 0.3, s * 1.2, s * 0.1, s * 0.6, 0, s * 0.3);
    artFillPath(c, wing2, s * 0.05, s * 1.2, s, { lineColor: line, line: Math.max(2, s * 0.03) });
    // Silmätäplä
    artCircle(c, s * 1.05, -s * 0.5, s * 0.22, calm ? '#fff8d0' : '#6a3aa0', { lineColor: line });
    artCircle(c, s * 1.05, -s * 0.5, s * 0.1, calm ? '#ffd24f' : '#ff5f7e', { line: false });
    c.restore();
  }
  // Ruumis ja tuntosarvet
  artBlob(c, x, y + s * 0.2, s * 0.2, s * 0.6, calm ? '#f0fff8' : '#1a1030', { lineColor: line });
  c.strokeStyle = line;
  c.lineWidth = Math.max(2, s * 0.03);
  c.beginPath(); c.moveTo(x - s * 0.06, y - s * 0.35); c.quadraticCurveTo(x - s * 0.3, y - s * 0.8, x - s * 0.45, y - s * 0.75); c.stroke();
  c.beginPath(); c.moveTo(x + s * 0.06, y - s * 0.35); c.quadraticCurveTo(x + s * 0.3, y - s * 0.8, x + s * 0.45, y - s * 0.75); c.stroke();
  artCircle(c, x, y - s * 0.3, s * 0.2, calm ? '#f0fff8' : '#1a1030', { lineColor: line });
  if (mth.state === 'sleep') {
    artEye(c, x - s * 0.08, y - s * 0.32, s * 0.05, 0, true);
    artEye(c, x + s * 0.08, y - s * 0.32, s * 0.05, 0, true);
  } else if (calm) {
    artEye(c, x - s * 0.08, y - s * 0.32, s * 0.055, 0.3, (globalT % 3.3) < 0.12);
    artEye(c, x + s * 0.08, y - s * 0.32, s * 0.055, 0.3, (globalT % 3.3) < 0.12);
    artBlush(c, x - s * 0.15, y - s * 0.22, s * 0.04);
    artBlush(c, x + s * 0.15, y - s * 0.22, s * 0.04);
  } else {
    artGlow(c, x - s * 0.08, y - s * 0.32, s * 0.14, '#ff5f7e', 0.6 * Math.max(0.3, mth.wake));
    artGlow(c, x + s * 0.08, y - s * 0.32, s * 0.14, '#ff5f7e', 0.6 * Math.max(0.3, mth.wake));
    artCircle(c, x - s * 0.08, y - s * 0.32, s * 0.045, '#ff8aa0', { line: false });
    artCircle(c, x + s * 0.08, y - s * 0.32, s * 0.045, '#ff8aa0', { line: false });
  }
  // Sydänpilkku: syöksyssä kirkas ja aikakaari, muuten himmeä
  var spot = mothSpot();
  if (dive) {
    var k = Math.max(0, mth.winT / MOTH_ROUNDS[Math.min(mth.round, 2)].window);
    artGlow(c, spot.x + hurt, spot.y, h * 0.12, '#fff6a0', 0.6 + Math.sin(globalT * 8) * 0.2);
    c.fillStyle = '#ffe27a';
    drawHeartShape(c, spot.x + hurt, spot.y, h * 0.03, true);
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, h * 0.007);
    c.beginPath(); c.arc(spot.x + hurt, spot.y, h * 0.06, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
  } else if (!calm) {
    c.globalAlpha = 0.35;
    drawHeartShape(c, spot.x + hurt, spot.y, h * 0.022, false);
    c.globalAlpha = 1;
  }
}

function drawMoth() {
  var c = ctx, h = viewH, i, a, p, sh = mothShrooms(), ps = viewH / 620;
  if (!beginPlayWorld()) return;
  // Palanneet valot tulikärpäsinä
  for (i = 0; i < mth.lights.length; i++) {
    var L = mth.lights[i], k = easeOutCubic(Math.min(1, L.t / 1.4));
    drawCatchFireflyAt(c, L.x0 + (L.x1 - L.x0) * k, L.y0 + (L.y1 - L.y0) * k + Math.sin(L.t * 3 + i) * h * 0.01, L.col, h * 0.016, false, L.t + i);
  }
  drawMothBoss(c);
  for (i = 0; i < sh.length; i++) drawMothShroom(c, sh[i], mothShroomState[i], i);
  // Prinsessa: parven aikana hohtokuplassa, syöksyssä pomppii
  if (!mth.bouncing) {
    artGlow(c, mth.px, mth.py - h * 0.07, h * 0.12, '#c8fff4', 0.35 + Math.sin(globalT * 3) * 0.08);
    c.strokeStyle = 'rgba(200,255,244,0.6)';
    c.lineWidth = Math.max(2, h * 0.005);
    c.beginPath(); c.arc(mth.px, mth.py - h * 0.07, h * 0.1, 0, Math.PI * 2); c.stroke();
  }
  c.save();
  c.translate(mth.px, mth.py);
  var stretch = mth.vy < 0 ? Math.min(0.12, -mth.vy / (h * 8)) : 0;
  c.scale(1 + mth.squash * 0.18 - stretch * 0.5, 1 - mth.squash * 0.18 + stretch);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) c.globalAlpha = 0.45;
  drawPrincessFree(c, 0, 0, ps, mth.facing, 0, false, globalT);
  c.globalAlpha = 1;
  c.restore();
  for (i = 0; i < mth.kois.length; i++) drawCatchMoth(c, mth.kois[i].moth || { x: mth.kois[i].x, y: mth.kois[i].y, flap: 0 });
  for (i = 0; i < mth.spores.length; i++) {
    p = mth.spores[i];
    artGlow(c, p.x, p.y, h * 0.04, '#6a3aa0', 0.5);
    artCircle(c, p.x, p.y, h * 0.018, '#3a2a5a', { lineColor: '#140a28' });
  }
  // Haavin jälki
  if (mth.trail.length > 1) {
    c.lineCap = 'round';
    for (i = 1; i < mth.trail.length; i++) {
      a = 1 - (globalT - mth.trail[i].t) / 0.22;
      c.strokeStyle = 'rgba(200,255,250,' + Math.max(0, a * 0.8) + ')';
      c.lineWidth = h * 0.02 * Math.max(0.2, a);
      c.beginPath(); c.moveTo(mth.trail[i - 1].x, mth.trail[i - 1].y); c.lineTo(mth.trail[i].x, mth.trail[i].y); c.stroke();
    }
  }
  // Vihjeet: parvessa käsi sipaisee koin kautta, syöksyssä käsi liikkuu sivuttain
  if (mth.state === 'swarm' && !mth.swiped && mth.kois.length && mth.hintT > 0.8) {
    var ko = mth.kois[0], hk = (mth.hintT % 1.4) / 1.4;
    drawHand(c, ko.x - h * 0.12 + hk * h * 0.24, ko.y + h * 0.04, h * 0.035);
  } else if (mth.state === 'dive' && !mth.steered && mth.hintT > 0.5) {
    drawHand(c, mth.x + Math.sin(mth.hintT * 2) * h * 0.1, groundTop + h * 0.12, h * 0.035);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawMothHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: osumat sydänpilkkuun (palautetut valot)
function drawMothHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = MOTH_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * n + pad, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    c.globalAlpha = i < mth.hits ? 1 : 0.3;
    if (i < mth.hits) artGlow(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 1.6, '#fff6a0', 0.6);
    drawHeartShape(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 0.9, i < mth.hits);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.moth = function (c, x, y, s) {
  var i;
  for (i = -1; i <= 1; i += 2) {
    artBlob(c, x + i * s * 0.12, y - s * 0.05, s * 0.12, s * 0.09, '#4a3478', { rot: i * 0.5, lineColor: '#140a28' });
    artBlob(c, x + i * s * 0.08, y + s * 0.08, s * 0.07, s * 0.06, '#6a4a9a', { rot: -i * 0.4, lineColor: '#140a28' });
    artCircle(c, x + i * s * 0.14, y - s * 0.06, s * 0.03, '#ff5f7e', { line: false });
  }
  artBlob(c, x, y + s * 0.02, s * 0.03, s * 0.1, '#1a1030', { line: false });
  artGlow(c, x, y + s * 0.02, s * 0.1, '#fff6a0', 0.6);
};
