'use strict';

// Dyynilasku (Kaukamaa, Aurinkodyynit): uusi verbi LIUKU. Prinsessa laskee
// hiekkalaudalla dyynien yli itään. Pidä pohjassa, niin lauta painuu raskaaksi
// ja kiihtyy alamäessä; päästä irti ennen harjaa, niin lauta keventyy ja lentää
// dyynin harjalta (pohjassa pidetty lauta pysyy maassa). Ylämäkeen
// laskeutuminen töksähtää. Alamäkeen osuva lasku on täydellinen: kipinät ja
// vauhtia lisää. Hiekkamyrsky seuraa takana: jos se saa prinsessan kiinni,
// menee sydän ja puuska heittää eteenpäin. Kolme osuutta, joiden lopussa on
// keidas (tarkistuspiste: sydämet täyttyvät, myrsky jää jälkeen). Osuudet
// kovenevat: jyrkemmät dyynit, nopeampi myrsky ja kaktuksia harjojen takana
// (hyppää yli, osuma vie sydämen). Maasto arvotaan joka peluukerralla, ja
// aurinkokivet sijoitetaan hyvän laskun lentoradoille (bonus, HUD).
// Tehtävät ensimmäisellä ja toisella keitaalla.

// hills: dyynejä, half: puolikkaan leveys × viewW, amp: korkeus × viewH,
// storm: myrskyn nopeus × viewW / s, cacti: kaktuksia harjojen takana
var DUNE_SECTIONS = [
  { hills: 6, half: [0.42, 0.6], amp: [0.13, 0.2], storm: 0.32, cacti: 1 },
  { hills: 8, half: [0.38, 0.58], amp: [0.15, 0.24], storm: 0.38, cacti: 3 },
  { hills: 9, half: [0.36, 0.58], amp: [0.17, 0.28], storm: 0.44, cacti: 4 }
];
// Tahti: painovoima ja nopeudet on skaalattu hitaammiksi (aikakerroin 0,68 alkuperäisestä:
// painovoima × 0,68², nopeudet × 0,68), jolloin lentoradat pysyvät samoina mutta kaikki
// tapahtuu rauhallisemmin. Palaute 28.9.2026: kenttä meni hyppyjen onnistuessa liian nopeasti.
var DUNE_G = 0.694;         // painovoima × viewH / s² (sormi irti)
var DUNE_G_HOLD = 1.942;    // painovoima pohjassa pitäessä (raskas lauta)
// Irtoamisen herkkyys, kun sormi on irti: harjalta irtoaa, kun kaarevuuden vaatima
// voima ylittää tämän osuuden painovoimasta (1 = fysikaalinen, pienempi = helpompi)
var DUNE_LIFT = 0.6;
// Ylämäessä pohjassa pito jarruttaa (0 = ei lainkaan, 1 = täysi raskas lauta). 0:lla koko
// kentän pystyi paahtamaan läpi sormi pohjassa hyppäämättä; 1:llä myöhään irti päästävä ei
// lentänyt koskaan. 0,75 ja herkempi irtoaminen: paahtaja menettää osuuden, 0,45 s viive lentää.
var DUNE_UPHILL_BRAKE = 0.75;
var DUNE_VMIN = 0.136;      // pienin vauhti maassa × viewW / s (ei jää jumiin notkoon)
var DUNE_VMAX = 1.02;       // suurin vauhti × viewW / s
var DUNE_DRAG = 0.09;       // kitka maassa (osuus / s); ilmassa ei kitkaa, joten lento säilyttää vauhdin
var DUNE_PERFECT = 0.35;    // täydellinen lasku: kulma radan ja rinteen välillä (rad)
var DUNE_STORM_LAG = 0.9;   // myrsky pysyy enintään näin kaukana takana × viewW
var DUNE_STORM_HIT = 0.08;  // myrsky saa kiinni, kun väli on alle tämän × viewW
var DUNE_BASE = 0.9;        // notkojen korkeus × viewH
var DUNE_PLATEAU = 0.64;    // keitaiden tasanteen korkeus × viewH
var DUNE_OASIS_W = 1.3;     // keitaan leveys × viewW

var dune = {
  pts: [], secs: [], gems: [], cacti: [], trail: [],
  p: { x: 0, y: 0, vx: 0, vy: 0, ground: true, ang: 0 },
  cam: 0, storm: 0, sec: 0, arrive: 0, state: 'rest', t: 0, heldOnce: false, holdT: 0,
  perfect: 0, gemGot: 0, taskDelay: -1, won: false, flash: 0, flashT: 0, windT: 0, restT: 0
};

// ---------- Maasto ----------
function duneSeg(x) {
  var pts = dune.pts, lo = 0, hi = pts.length - 2, mid;
  if (x <= pts[0].x) return 0;
  if (x >= pts[hi + 1].x) return hi;
  while (lo < hi) {
    mid = (lo + hi + 1) >> 1;
    if (pts[mid].x <= x) lo = mid; else hi = mid - 1;
  }
  return lo;
}
// Kosini-interpolaatio pisteiden välillä: sileät harjat ja notkot
function duneY(x) {
  var i = duneSeg(x), a = dune.pts[i], b = dune.pts[i + 1], t = Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
  return a.y + (b.y - a.y) * (1 - Math.cos(Math.PI * t)) / 2;
}
function duneSlope(x) {
  var i = duneSeg(x), a = dune.pts[i], b = dune.pts[i + 1], dx = b.x - a.x, t = Math.max(0, Math.min(1, (x - a.x) / dx));
  return (b.y - a.y) * Math.PI / 2 * Math.sin(Math.PI * t) / dx;
}
function duneCurv(x) {
  var i = duneSeg(x), a = dune.pts[i], b = dune.pts[i + 1], dx = b.x - a.x, t = Math.max(0, Math.min(1, (x - a.x) / dx));
  return (b.y - a.y) * Math.PI * Math.PI / 2 * Math.cos(Math.PI * t) / (dx * dx);
}

// Yksi fysiikka-askel (myös botti käyttää tätä). Palauttaa laskeutumisen tiedot.
function duneStep(p, hold, dt) {
  var h = viewH, W = viewW, g = (hold ? DUNE_G_HOLD : DUNE_G) * h, sl, len, vt, k, ty, ev = null;
  if (p.ground) {
    sl = duneSlope(p.x);
    len = Math.sqrt(1 + sl * sl);
    vt = p.vx * len;
    // Raskas lauta kiihdyttää alamäessä; ylämäessä pohjassa pito ei jarruta
    // enempää kuin kevyt (DUNE_UPHILL_BRAKE), jotta myöhäinen irtipäästö ei vie kaikkea vauhtia
    var ga = hold && sl < 0 ? (DUNE_G + (DUNE_G_HOLD - DUNE_G) * DUNE_UPHILL_BRAKE) * h : g;
    vt += ga * sl / len * dt;
    vt -= vt * DUNE_DRAG * dt;
    vt = Math.max(DUNE_VMIN * W, Math.min(DUNE_VMAX * W, vt));
    // Irtoaa harjalta, kun kaarevuus vaatii enemmän kuin painovoima pitää
    k = duneCurv(p.x) / (len * len * len);
    if (k > 0 && vt * vt * k > g * (hold ? 1 : DUNE_LIFT) / len) {
      p.ground = false;
      p.vx = vt / len;
      p.vy = vt * sl / len;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return { launch: true };
    }
    p.vx = vt / len;
    p.vy = vt * sl / len;
    p.x += p.vx * dt;
    p.y = duneY(p.x);
    return null;
  }
  p.vy += g * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  ty = duneY(p.x);
  if (p.y >= ty) {
    sl = duneSlope(p.x);
    len = Math.sqrt(1 + sl * sl);
    var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
    vt = (p.vx + p.vy * sl) / len;
    var ang = Math.acos(Math.max(-1, Math.min(1, vt / sp)));
    ev = { land: true, ang: ang, slope: sl, perfect: sl > 0.12 && ang < DUNE_PERFECT };
    if (ev.perfect) vt *= 1.08;
    vt = Math.max(DUNE_VMIN * W, Math.min(DUNE_VMAX * W, vt));
    p.vx = vt / len;
    p.vy = vt * sl / len;
    p.y = ty;
    p.ground = true;
  }
  return ev;
}

// ---------- Radan arvonta ----------
function duneRand(a) { return a[0] + Math.random() * (a[1] - a[0]); }
function duneBuild() {
  var W = viewW, h = viewH, pts = [], secs = [], x, s, S, k, base = h * DUNE_BASE, yP = h * DUNE_PLATEAU, amp, big = false;
  pts.push({ x: -W * 1.5, y: yP });
  x = W * 0.55;
  pts.push({ x: x, y: yP });
  for (s = 0; s < DUNE_SECTIONS.length; s++) {
    S = DUNE_SECTIONS[s];
    var start = x;
    for (k = 0; k < S.hills; k++) {
      // Rytmi: iso ja pieni dyyni vuorottelevat välillä
      big = Math.random() < 0.55 ? !big : big;
      amp = duneRand(S.amp) * h * (big ? 1 : 0.75);
      x += duneRand(S.half) * W;
      pts.push({ x: x, y: base - Math.random() * h * 0.03, valley: true });
      x += duneRand(S.half) * W * (big ? 1 : 0.85);
      pts.push({ x: x, y: base - amp, peak: true });
    }
    x += duneRand(S.half) * W;
    pts.push({ x: x, y: base - Math.random() * h * 0.03, valley: true });
    x += W * 0.6;
    pts.push({ x: x, y: yP });
    secs.push({ start: start, oasis: x, rest: x + W * 0.45, end: x + W * DUNE_OASIS_W, storm: S.storm * W, cacti: S.cacti, last: s === DUNE_SECTIONS.length - 1 });
    x += W * DUNE_OASIS_W;
    pts.push({ x: x, y: yP });
  }
  pts.push({ x: x + W * 3, y: yP });
  dune.pts = pts;
  dune.secs = secs;
  dune.gems = [];
  dune.cacti = [];
  duneSeed();
}

// Hyvä lasku botilla: sen lentoradoille aurinkokivet, ja kaktukset harjojen
// taakse kohtiin, joiden yli botti lentää reilusti
function duneBotHold(p) {
  var sl = duneSlope(p.x + p.vx * 0.05);
  if (p.ground) return sl > 0.02;
  return p.vy > 0 && duneSlope(p.x + p.vx * 0.25) > 0.05;
}
function duneSeed() {
  var p, s, sec, dt = 1 / 120, n, flights = [], cur = null, i, f, W = viewW, h = viewH, g, ev;
  for (s = 0; s < dune.secs.length; s++) {
    sec = dune.secs[s];
    p = { x: s === 0 ? W * 0.3 : dune.secs[s - 1].rest, y: 0, vx: 0.24 * W, vy: 0, ground: true };
    p.y = duneY(p.x);
    flights = [];
    cur = null;
    for (n = 0; n < 60 * 120 && p.x < sec.oasis; n++) {
      ev = duneStep(p, duneBotHold(p), dt);
      if (ev && ev.launch) cur = { pts: [], x0: p.x };
      if (!p.ground && cur) cur.pts.push({ x: p.x, y: p.y, gy: duneY(p.x) });
      if (ev && ev.land && cur) { cur.x1 = p.x; if (cur.pts.length > 20) flights.push(cur); cur = null; }
    }
    // Aurinkokivet: korkeimmat lennot (lakipiste vähintään 0,15 viewH maan yllä)
    // saavat kiven lakipisteeseen, jonne maata pitkin ajava ei ylety
    for (i = 0; i < flights.length; i++) {
      f = flights[i];
      f.apex = 0;
      for (var j = 1; j < f.pts.length; j++) if (f.pts[j].gy - f.pts[j].y > f.pts[f.apex].gy - f.pts[f.apex].y) f.apex = j;
      f.air = f.pts[f.apex].gy - f.pts[f.apex].y;
    }
    var high = flights.filter(function (q) { return q.air > h * 0.15; }).sort(function (a, b) { return b.air - a.air; });
    for (i = 0; i < high.length && i < 4; i++) {
      var gp = high[i].pts[high[i].apex];
      dune.gems.push({ x: gp.x, y: gp.y - h * 0.05, got: false, sec: s, t: Math.random() * 6 });
    }
    // Maahan muutama kivi notkoihin, jotta jokainen saa jotain
    for (i = 0, g = 0; i < dune.pts.length - 1 && g < 2; i++) {
      var q = dune.pts[i];
      if (!q.valley || q.x < sec.start + W * 0.5 || q.x > sec.oasis) continue;
      if (Math.random() < 0.35) { dune.gems.push({ x: q.x, y: duneY(q.x) - h * 0.06, got: false, sec: s, t: Math.random() * 6 }); g++; }
    }
    // Kaktukset: lento, jonka keskivaiheilla botti on vähintään 0,12 viewH maan yllä
    var placed = 0, cand = flights.slice();
    for (i = cand.length - 1; i > 0; i--) { var k2 = Math.floor(Math.random() * (i + 1)), tmp = cand[i]; cand[i] = cand[k2]; cand[k2] = tmp; }
    for (i = 0; i < cand.length && placed < sec.cacti; i++) {
      f = cand[i];
      // Kaktus lennon korkeimman kohdan alle (vähintään 0,13 viewH maan yllä)
      var mid = null;
      f.pts.forEach(function (q) { if (!mid || q.gy - q.y > mid.gy - mid.y) mid = q; });
      if (!mid || mid.gy - mid.y < h * 0.13) continue;
      if (dune.cacti.some(function (c) { return Math.abs(c.x - mid.x) < W * 0.6; })) continue;
      dune.cacti.push({ x: mid.x, sec: s, hit: 0 });
      placed++;
    }
  }
}

// ---------- Alustus ----------
function initDune() {
  var i;
  tasks = [makeTask(-5, 'give'), makeTask(-5, 'clock')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  duneBuild();
  dune.sec = 0;
  dune.gemGot = 0;
  dune.perfect = 0;
  dune.heldOnce = false;
  dune.taskDelay = -1;
  dune.won = false;
  dune.trail = [];
  duneRestAt(viewW * 0.3);
  renderBackground();
}
function duneRestAt(x) {
  var p = dune.p;
  p.x = x; p.y = duneY(x); p.vx = 0; p.vy = 0; p.ground = true; p.ang = 0;
  dune.state = 'rest';
  dune.t = 0;
  dune.restT = 0;
  dune.storm = x - viewW * 1.2;
  dune.cam = x - viewW * 0.3;
}
function respawnDune() {
  // Sydämet loppu: takaisin edelliselle keitaalle, osuuden kivet palaavat
  var x = dune.sec === 0 ? viewW * 0.3 : dune.secs[dune.sec - 1].rest, i;
  for (i = 0; i < dune.gems.length; i++) {
    if (dune.gems[i].sec === dune.sec && dune.gems[i].got) { dune.gems[i].got = false; dune.gemGot--; }
  }
  dune.trail = [];
  duneRestAt(x);
}
function resizeDune() {
  camX = 0;
  // Maasto on mitoitettu ruudun mukaan: arvotaan uusi rata, mutta osuus säilyy
  var sec = dune.sec;
  duneBuild();
  dune.sec = sec;
  duneRestAt(sec === 0 ? viewW * 0.3 : dune.secs[sec - 1].rest);
}
function handleDuneTap() {
  // Lepotilasta liikkeelle painamalla (sama ele kuin laskussa)
  if (dune.state === 'rest' && !puzzleBusy() && dune.taskDelay <= 0 && dune.restT > 0.4) {
    duneGo();
  }
}
function duneGo() {
  var p = dune.p;
  dune.state = 'ride';
  dune.t = 0;
  p.vx = 0.24 * viewW;
  dune.storm = p.x - viewW * DUNE_STORM_LAG;
  playNote(523, 0, 0.1, 'triangle', 0.3);
  playNote(784, 0.08, 0.16, 'triangle', 0.3);
}

// ---------- Päivitys ----------
function updateDune(dt) {
  var busy, p = dune.p, W = viewW, h = viewH, sec, n, sub, ev, hold, i, g;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  if (dune.flashT > 0) dune.flashT -= dt;
  busy = puzzleBusy();
  if (dune.taskDelay > 0 && !busy) {
    dune.taskDelay -= dt;
    if (dune.taskDelay <= 0) {
      if (dune.sec === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (dune.sec === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  for (i = 0; i < dune.gems.length; i++) dune.gems[i].t += dt;
  for (i = 0; i < dune.cacti.length; i++) if (dune.cacti[i].hit > 0) dune.cacti[i].hit -= dt;
  if (busy || celebrating) return;
  dune.t += dt;
  sec = dune.secs[Math.min(dune.sec, dune.secs.length - 1)];

  if (dune.state === 'rest') {
    dune.restT += dt;
    dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 3);
    return;
  }
  if (dune.state === 'won') {
    dune.cam += (p.x - W * 0.35 - dune.cam) * Math.min(1, dt * 2);
    if (dune.t > 1.4 && !dune.won) { dune.won = true; startCelebration(); }
    return;
  }
  if (dune.state === 'arrive') {
    // Keitaalla lauta liukuu palmun luo ja pysähtyy
    sec = dune.secs[dune.arrive];
    p.x += (sec.rest - p.x) * Math.min(1, dt * 3);
    p.y = duneY(p.x);
    p.ang += (0 - p.ang) * Math.min(1, dt * 6);
    dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 3);
    if (Math.abs(sec.rest - p.x) < W * 0.01) {
      if (sec.last) { dune.state = 'won'; dune.t = 0; soundFanfare(); spawnSparkles(p.x, p.y - h * 0.1, 30, '#ffe27a'); }
      else {
        if (dune.sec === 1 || dune.sec === 2) dune.taskDelay = 0.6;
        duneRestAt(p.x);
      }
    }
    return;
  }

  // Ajo
  hold = holding;
  if (hold) { dune.heldOnce = true; dune.holdT += dt; } else dune.holdT = 0;
  sub = 4;
  for (n = 0; n < sub; n++) {
    ev = duneStep(p, hold, dt / sub);
    if (ev && ev.land) duneLanded(ev);
    if (ev && ev.launch) playNote(660, 0, 0.12, 'sine', 0.18);
  }
  // Kulma: maassa rinteen mukaan, ilmassa radan mukaan pehmeästi
  var ta = Math.atan2(p.vy, p.vx);
  if (p.ground) ta = Math.atan(duneSlope(p.x));
  p.ang += (ta - p.ang) * Math.min(1, dt * (p.ground ? 14 : 5));
  // Kamera: prinsessa kolmanneksen kohdalla, vauhdissa hieman edempänä
  var camT = p.x - W * (0.3 - Math.min(0.08, p.vx / W * 0.05));
  dune.cam += (camT - dune.cam) * Math.min(1, dt * 5);
  // Hiekkaa lentää laudan alta vauhdissa
  if (p.ground && p.vx > W * 0.41 && Math.random() < dt * 25) spawnDust(p.x, p.y, 1, 1);
  // Jälki
  dune.trail.push({ x: p.x, y: p.y, t: globalT, fast: p.vx > W * 0.65 });
  while (dune.trail.length && globalT - dune.trail[0].t > 0.35) dune.trail.shift();
  if (!p.ground) {
    dune.windT -= dt;
    if (dune.windT <= 0) { dune.windT = 0.5; playNote(300 + Math.random() * 60, 0, 0.3, 'sine', 0.04); }
  }

  // Aurinkokivet
  for (i = 0; i < dune.gems.length; i++) {
    g = dune.gems[i];
    if (g.got) continue;
    if (Math.abs(g.x - p.x) < h * 0.06 && Math.abs(g.y - (p.y - h * 0.06)) < h * 0.065) {
      g.got = true;
      dune.gemGot++;
      artPop(g.x, g.y, h * 0.05, '#ffd24f', 'burst');
      spawnSparkles(g.x, g.y, 10, '#ffd24f');
      playNote(1047 + dune.gemGot * 40, 0, 0.1, 'sine', 0.3);
      playNote(1568 + dune.gemGot * 40, 0.07, 0.15, 'sine', 0.25);
    }
  }
  // Kaktukset: osuma maassa tai matalalla
  for (i = 0; i < dune.cacti.length; i++) {
    var ca = dune.cacti[i], cy = duneY(ca.x);
    if (Math.abs(ca.x - p.x) < h * 0.05 && p.y > cy - h * 0.09 && ca.hit <= 0 && hurtT <= 0) {
      ca.hit = 0.6;
      artShakeStart(h * 0.012, 0.3);
      spawnSparkles(p.x, p.y - h * 0.05, 10, '#7ac25a');
      p.vx *= 0.6;
      if (!p.ground) p.vy = Math.min(p.vy, -h * 0.3);
      loseHeart();
      if (dune.state !== 'ride') return;
    }
  }
  // Myrsky
  dune.storm += sec.storm * dt;
  dune.storm = Math.max(dune.storm, p.x - W * DUNE_STORM_LAG);
  if (p.x - dune.storm < W * DUNE_STORM_HIT && hurtT <= 0) {
    artShakeStart(h * 0.015, 0.4);
    playNote(140, 0, 0.3, 'sawtooth', 0.12);
    // Puuska heittää eteenpäin ja myrsky jää hetkeksi
    p.vx = Math.max(p.vx, W * 0.41);
    if (p.ground) { p.ground = false; p.vy = -h * 0.34; }
    dune.storm = p.x - W * 0.55;
    loseHeart();
    if (dune.state !== 'ride') return;
  }
  // Keitaalle: osuus valmis, seuraava alkaa keitaalta
  if (p.x >= sec.oasis + W * 0.05 && p.ground) {
    dune.state = 'arrive';
    dune.t = 0;
    dune.arrive = dune.sec;
    if (!sec.last) dune.sec++;
    hearts = HEART_MAX;
    sectionItems = [];
    spawnSparkles(sec.rest, duneY(sec.rest) - h * 0.2, 16, '#7fd4ff');
    playNote(659, 0, 0.18, 'triangle', 0.35);
    playNote(988, 0.1, 0.3, 'triangle', 0.35);
  }
}
function duneLanded(ev) {
  var p = dune.p, h = viewH;
  if (ev.perfect) {
    dune.perfect++;
    dune.flashT = 0.5;
    spawnSparkles(p.x, p.y - h * 0.02, 12, '#fff2a0');
    artPop(p.x, p.y - h * 0.03, h * 0.06, '#fff2a0', 'ring');
    playNote(988, 0, 0.1, 'triangle', 0.28);
    playNote(1319, 0.07, 0.16, 'triangle', 0.28);
  } else if (ev.slope < -0.1) {
    // Töksähdys ylämäkeen
    spawnDust(p.x, p.y, 6, -1);
    artShakeStart(h * 0.006, 0.18);
    playNote(180, 0, 0.1, 'triangle', 0.25);
  } else {
    spawnDust(p.x, p.y, 3, 1);
    playNote(330, 0, 0.06, 'triangle', 0.15);
  }
}

// ---------- Piirto ----------
function renderDuneBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#5ec8e8');
  g.addColorStop(0.55, '#bfe8f0');
  g.addColorStop(1, '#ffe2b0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.78, h * 0.18, h * 0.08, 0.1, '#fff0b0', '#fffbe8', '#ffd24f');
  // Kaukaiset pöytävuoret ja pyramidit
  b.fillStyle = artMix('#d8905a', '#bfe8f0', 0.55);
  for (i = 0; i < 3; i++) {
    x = vw * (0.1 + i * 0.35);
    b.beginPath();
    b.moveTo(x - h * 0.2, h * 0.62); b.lineTo(x - h * 0.13, h * 0.5); b.lineTo(x + h * 0.1, h * 0.5); b.lineTo(x + h * 0.18, h * 0.62);
    b.closePath(); b.fill();
  }
  b.fillStyle = artMix('#e0a060', '#bfe8f0', 0.45);
  b.beginPath(); b.moveTo(vw * 0.5, h * 0.62); b.lineTo(vw * 0.58, h * 0.44); b.lineTo(vw * 0.66, h * 0.62); b.closePath(); b.fill();
  b.fillStyle = artMix('#c88a50', '#bfe8f0', 0.45);
  b.beginPath(); b.moveTo(vw * 0.58, h * 0.44); b.lineTo(vw * 0.66, h * 0.62); b.lineTo(vw * 0.6, h * 0.62); b.closePath(); b.fill();
  b.fillStyle = artMix('#e0a060', '#bfe8f0', 0.55);
  b.beginPath(); b.moveTo(vw * 0.68, h * 0.62); b.lineTo(vw * 0.72, h * 0.53); b.lineTo(vw * 0.76, h * 0.62); b.closePath(); b.fill();
}

// Kaukaiset dyynit parallaksina (piirretään joka ruudulla, kevyt siniaalto)
function drawDuneFar(c, speed, y0, amp, color, wl) {
  var W = viewW, h = viewH, off = dune.cam * speed, x, step = W / 32;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, h);
  for (x = 0; x <= W + step; x += step) {
    var wx = (x + off) / (W * wl);
    c.lineTo(x, h * (y0 - amp * (0.5 + 0.5 * Math.sin(wx * Math.PI * 2) * Math.cos(wx * 1.3))));
  }
  c.lineTo(W, h);
  c.closePath();
  c.fill();
}

function drawDuneGround(c) {
  var W = viewW, h = viewH, x0 = dune.cam - 4, x1 = dune.cam + W + 4, i, a, b, x, step = Math.max(4, W / 110), k;
  var pts = dune.pts, i0 = duneSeg(x0), i1 = duneSeg(x1);
  // Jokainen notkosta notkoon ulottuva dyyni omalla sävyllään (raidat kuin Tiny-maisemissa)
  var starts = [];
  for (i = i0; i <= i1 + 1 && i < pts.length; i++) if (pts[i].valley || i === i0) starts.push(i);
  for (k = 0; k < starts.length; k++) {
    a = pts[starts[k]].x;
    b = k + 1 < starts.length ? pts[starts[k + 1]].x : x1;
    a = Math.max(a, x0); b = Math.min(b, x1);
    if (b <= a) continue;
    var idx = starts[k], col = (idx >> 1) % 2 ? '#f3c074' : '#f7cf86';
    c.beginPath();
    c.moveTo(a, h * 1.02);
    for (x = a; x < b; x += step) c.lineTo(x, duneY(x));
    c.lineTo(b, duneY(b));
    c.lineTo(b, h * 1.02);
    c.closePath();
    var g = c.createLinearGradient(0, h * 0.55, 0, h);
    g.addColorStop(0, artShade(col, 0.12));
    g.addColorStop(1, artShade(col, -0.18));
    c.fillStyle = g;
    c.fill();
  }
  // Harjan vaalea reuna
  c.strokeStyle = 'rgba(255,248,220,0.9)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.beginPath();
  for (x = x0; x <= x1; x += step) { if (x === x0) c.moveTo(x, duneY(x)); else c.lineTo(x, duneY(x)); }
  c.stroke();
  // Tuulen piirtämät väreet
  c.strokeStyle = 'rgba(200,140,70,0.25)';
  c.lineWidth = Math.max(1, h * 0.003);
  for (x = Math.floor(x0 / (h * 0.18)) * h * 0.18; x < x1; x += h * 0.18) {
    var yy = duneY(x) + h * 0.05 + ((x / (h * 0.18)) % 3) * h * 0.03;
    c.beginPath(); c.moveTo(x - h * 0.04, yy); c.quadraticCurveTo(x, yy - h * 0.012, x + h * 0.04, yy); c.stroke();
  }
}

function drawDuneOasis(c, sec, final) {
  var h = viewH, y = viewH * DUNE_PLATEAU, x = sec.oasis;
  if (x > dune.cam + viewW * 1.5 || sec.end < dune.cam - viewW * 0.5) return;
  // Palmut (lampi piirretään maan päälle: duneDrawPond)
  drawPalm(c, x + viewW * 0.3, y + h * 0.01, h * 0.24);
  drawPalm(c, x + viewW * 0.55, y + h * 0.01, h * 0.3);
  drawPalm(c, x + viewW * 0.95, y + h * 0.01, h * 0.22);
  if (final) {
    drawPalm(c, x + viewW * 1.1, y + h * 0.01, h * 0.28);
  }
  // Lippu kertoo keitaan: sininen viiri
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2, h * 0.006);
  c.beginPath(); c.moveTo(x + viewW * 0.08, y); c.lineTo(x + viewW * 0.08, y - h * 0.16); c.stroke();
  c.fillStyle = '#7fd4ff';
  c.beginPath(); c.moveTo(x + viewW * 0.08, y - h * 0.16); c.lineTo(x + viewW * 0.08 + h * 0.08 + Math.sin(globalT * 6) * h * 0.008, y - h * 0.135); c.lineTo(x + viewW * 0.08, y - h * 0.11); c.closePath(); c.fill();
}

function duneDrawPond(c, sec, final) {
  var h = viewH, y = viewH * DUNE_PLATEAU, x = sec.oasis;
  if (x > dune.cam + viewW * 1.5 || sec.end < dune.cam - viewW * 0.5) return;
  artBlob(c, x + viewW * 0.72, y + h * 0.04, h * (final ? 0.3 : 0.2), h * 0.03, '#4fc3e0', { lineColor: '#2a8ab0', hi: 0.4 });
  artBlob(c, x + viewW * 0.72 - h * 0.05, y + h * 0.035, h * 0.04, h * 0.008, '#bff0ff', { line: false });
  if (final) duneDrawCamel(c, x + viewW * 0.86, y + h * 0.01, h * 0.0024);
}

function duneDrawCamel(c, x, y, s) {
  var bob = Math.sin(globalT * 2) * s * 3;
  artShadow(c, x, y + s * 2, s * 60, s * 10);
  c.lineCap = 'round';
  artLimb(c, x - s * 30, y - s * 30, x - s * 32, y, s * 9, '#d9a060', '#8a5a30');
  artLimb(c, x + s * 26, y - s * 30, x + s * 28, y, s * 9, '#d9a060', '#8a5a30');
  artBlob(c, x, y - s * 42, s * 45, s * 20, '#e8b070', { lineColor: '#8a5a30' });
  artBlob(c, x - s * 5, y - s * 62, s * 20, s * 16, '#e8b070', { lineColor: '#8a5a30' });
  artLimb(c, x + s * 38, y - s * 48, x + s * 52, y - s * 78 + bob, s * 11, '#e8b070', '#8a5a30');
  artBlob(c, x + s * 60, y - s * 82 + bob, s * 15, s * 9, '#e8b070', { lineColor: '#8a5a30' });
  artEye(c, x + s * 62, y - s * 86 + bob, s * 3.5, 1, false);
}

function duneDrawCactus(c, x, y, s, hit) {
  var wg = hit > 0 ? Math.sin(globalT * 40) * s * 0.05 : 0;
  artShadow(c, x, y + s * 0.02, s * 0.3, s * 0.06);
  artLimb(c, x + wg, y, x + wg, y - s * 0.85, s * 0.22, '#5aa84a', '#2f6a2a');
  artLimb(c, x - s * 0.1 + wg, y - s * 0.45, x - s * 0.3 + wg, y - s * 0.45, s * 0.14, '#5aa84a', '#2f6a2a');
  artLimb(c, x - s * 0.3 + wg, y - s * 0.45, x - s * 0.3 + wg, y - s * 0.7, s * 0.14, '#5aa84a', '#2f6a2a');
  artLimb(c, x + s * 0.1 + wg, y - s * 0.3, x + s * 0.28 + wg, y - s * 0.3, s * 0.13, '#5aa84a', '#2f6a2a');
  artLimb(c, x + s * 0.28 + wg, y - s * 0.3, x + s * 0.28 + wg, y - s * 0.52, s * 0.13, '#5aa84a', '#2f6a2a');
  c.fillStyle = '#ff8ad8';
  c.beginPath(); c.arc(x + wg, y - s * 0.98, s * 0.07, 0, Math.PI * 2); c.fill();
}

function duneDrawGem(c, x, y, s, t) {
  var bob = Math.sin(t * 3) * s * 0.15;
  artGlow(c, x, y + bob, s * 2.2, '#ffd24f', 0.45);
  c.save();
  c.translate(x, y + bob);
  c.rotate(t * 1.5);
  c.beginPath();
  for (var i = 0; i < 8; i++) {
    var r = i % 2 ? s * 0.5 : s, a = i / 8 * Math.PI * 2;
    if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
  artFillPath(c, '#ffc83a', -s, s, s, { lineColor: '#c07a10' });
  c.restore();
  artCircle(c, x, y + bob, s * 0.3, '#fff6c8', { line: false });
}

// Prinsessa hiekkalaudalla. Origo laudan pohjassa, kulma rinteen mukaan.
function duneDrawRider(c, x, y, ang, crouch) {
  var h = viewH, s = h / 520;
  artShadow(c, x, duneY(x) + h * 0.005, h * 0.05 * (dune.p.ground ? 1 : 0.6), h * 0.012, dune.p.ground ? 0.2 : 0.1);
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  // Lauta
  artRoundRect(c, -h * 0.055, -h * 0.018, h * 0.11, h * 0.018, h * 0.009, '#ff6fb0', { lineColor: '#b83a7a' });
  c.fillStyle = '#ffe27a';
  c.fillRect(-h * 0.02, -h * 0.013, h * 0.04, h * 0.006);
  c.translate(0, -h * 0.016);
  if (crouch) artSquash(c, -0.14);
  drawPrincessFree(c, 0, 0, s, 1, 0, false, globalT);
  c.restore();
}

function duneDrawStorm(c) {
  var W = viewW, h = viewH, sx = dune.storm - dune.cam, i, a, x, y;
  if (sx < -W * 0.4) return;
  // Pyörteinen hiekkaseinä vasemmalta
  var g = c.createLinearGradient(sx - W * 0.4, 0, sx + W * 0.06, 0);
  g.addColorStop(0, 'rgba(170,110,60,0.95)');
  g.addColorStop(0.8, 'rgba(200,140,80,0.75)');
  g.addColorStop(1, 'rgba(220,170,110,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, Math.max(0, sx + W * 0.06), h);
  c.strokeStyle = 'rgba(255,230,190,0.5)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    a = globalT * (2 + i * 0.3) + i;
    x = sx - W * 0.05 - (i % 3) * W * 0.06;
    y = h * (0.15 + i * 0.12);
    c.beginPath(); c.arc(x, y, h * (0.04 + (i % 3) * 0.015), a, a + 3.6); c.stroke();
  }
  // Myrskyn silmät, kun se on lähellä
  if (dune.p.x - dune.storm < W * 0.35) {
    artEye(c, sx - W * 0.02, h * 0.45, h * 0.018, 1, Math.sin(globalT * 3) > 0.95);
    artEye(c, sx + W * 0.012, h * 0.45, h * 0.018, 1, Math.sin(globalT * 3) > 0.95);
  }
}

function drawDune() {
  var c = ctx, W = viewW, h = viewH, i, p = dune.p, g, sec, k;
  if (!beginPlayWorld()) return;
  drawDuneFar(c, 0.15, 0.7, 0.08, artMix('#f0b878', '#bfe8f0', 0.45), 1.3);
  drawDuneFar(c, 0.35, 0.76, 0.09, artMix('#f3c074', '#ffe2b0', 0.25), 0.9);
  c.save();
  c.translate(-dune.cam, 0);
  for (i = 0; i < dune.secs.length; i++) drawDuneOasis(c, dune.secs[i], dune.secs[i].last);
  drawDuneGround(c);
  for (i = 0; i < dune.secs.length; i++) duneDrawPond(c, dune.secs[i], dune.secs[i].last);
  for (i = 0; i < dune.cacti.length; i++) {
    var ca = dune.cacti[i];
    if (ca.x < dune.cam - W * 0.1 || ca.x > dune.cam + W * 1.1) continue;
    duneDrawCactus(c, ca.x, duneY(ca.x) + h * 0.01, h * 0.1, ca.hit);
  }
  for (i = 0; i < dune.gems.length; i++) {
    g = dune.gems[i];
    if (g.got || g.x < dune.cam - W * 0.1 || g.x > dune.cam + W * 1.1) continue;
    duneDrawGem(c, g.x, g.y, h * 0.025, g.t);
  }
  // Vauhtijälki
  if (dune.trail.length > 1) {
    c.lineCap = 'round';
    for (i = 1; i < dune.trail.length; i++) {
      var a = 1 - (globalT - dune.trail[i].t) / 0.35;
      c.strokeStyle = dune.trail[i].fast ? 'rgba(255,230,120,' + (a * 0.8) + ')' : 'rgba(255,255,255,' + (a * 0.45) + ')';
      c.lineWidth = h * 0.012 * a;
      c.beginPath(); c.moveTo(dune.trail[i - 1].x, dune.trail[i - 1].y - h * 0.01); c.lineTo(dune.trail[i].x, dune.trail[i].y - h * 0.01); c.stroke();
    }
  }
  if (dune.flashT > 0) artGlow(c, p.x, p.y - h * 0.04, h * 0.12, '#fff2a0', dune.flashT);
  var blink = hurtT > 0 && Math.sin(globalT * 30) > 0;
  if (!blink) duneDrawRider(c, p.x, p.y, p.ang, holding && dune.state === 'ride');
  c.restore();
  // Hiukkaset ja pop-efektit ovat maailmakoordinaateissa: kamera vain piirron ajaksi
  camX = dune.cam;
  drawParticlesLayer(c);
  duneDrawStorm(c);
  // Korkealla ruudun yläpuolella: nuoli näyttää paikan
  if (p.y < h * 0.02) {
    artCircle(c, p.x - dune.cam, h * 0.03, h * 0.015, '#ff6fb0', { lineColor: '#fff' });
  }
  // Vihje: käsi painaa alamäessä ja nousee ylämäessä, kunnes lapsi on painanut
  if (dune.state === 'rest' && dune.restT > 0.8 && !puzzleBusy() && dune.taskDelay <= 0) {
    k = (globalT % 1.2) / 1.2;
    drawHand(c, W * 0.62, h * 0.4 + Math.abs(Math.sin(k * Math.PI)) * h * 0.05, h * 0.045);
  } else if (!dune.heldOnce && dune.state === 'ride' && p.ground && duneSlope(p.x) > 0.05) {
    k = (globalT % 0.8) / 0.8;
    drawHand(c, W * 0.62, h * 0.4 + k * h * 0.03, h * 0.045);
  }
  endPlayWorld();
  camX = 0;
  drawDuneHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: aurinkokivet ja matkamittari (myrsky, prinsessa, keitaat)
function drawDuneHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX() + viewH * 0.2, W = viewW, i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 6, hs * 3.6, hs);
  c.fill();
  duneDrawGem(c, left + hs * 1.8, pad * 0.5 + hs * 1.8, hs * 0.8, globalT);
  c.fillStyle = '#8a4a10';
  c.font = 'bold ' + Math.round(hs * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(dune.gemGot + '', left + hs * 3.2, pad * 0.5 + hs * 1.9);
  c.textBaseline = 'alphabetic';
  // Matkamittari
  var mx0 = W * 0.6, mx1 = W * 0.86, my = pad * 0.5 + hs * 1.8, total = dune.secs.length ? dune.secs[dune.secs.length - 1].oasis : 1, x0 = viewW * 0.3;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = hs * 0.5;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(mx0, my); c.lineTo(mx1, my); c.stroke();
  for (i = 0; i < dune.secs.length; i++) {
    var ox = mx0 + (mx1 - mx0) * (dune.secs[i].oasis - x0) / (total - x0);
    drawPalm(c, ox, my + hs * 0.6, hs * 2);
  }
  var f = Math.max(0, Math.min(1, (dune.p.x - x0) / (total - x0))), sf = Math.max(0, Math.min(1, (dune.storm - x0) / (total - x0)));
  if (dune.state === 'ride') artCircle(c, mx0 + (mx1 - mx0) * sf, my, hs * 0.55, '#b8804a', { lineColor: '#6a4a28' });
  artCircle(c, mx0 + (mx1 - mx0) * f, my, hs * 0.7, '#ff6fb0', { lineColor: '#ffffff' });
}

HUB_ICONS.dune = function (c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s * 0.26, y + s * 0.14);
  c.quadraticCurveTo(x - s * 0.08, y - s * 0.12, x + s * 0.08, y + s * 0.02);
  c.quadraticCurveTo(x + s * 0.18, y - s * 0.06, x + s * 0.26, y + s * 0.14);
  c.closePath();
  artFillPath(c, '#f7cf86', y - s * 0.1, y + s * 0.14, s * 0.2, { lineColor: '#c08a40' });
  c.save();
  c.translate(x - s * 0.06, y - s * 0.03);
  c.rotate(0.5);
  artRoundRect(c, -s * 0.08, -s * 0.02, s * 0.16, s * 0.035, s * 0.015, '#ff6fb0', { lineColor: '#b83a7a' });
  c.restore();
  duneDrawGem(c, x + s * 0.14, y - s * 0.2, s * 0.05, 0);
};

// Aurinkodyynien sokkelon maasto: hiekkaväreet, pienet kaktukset ja kivet
HUB_TILE_DECOR.desert = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.85;
  if (rnd < 0.2) {
    artLimb(b, bx, by, bx, by - s * 0.3, s * 0.08, '#5aa84a', '#2f6a2a');
    artLimb(b, bx, by - s * 0.15, bx - s * 0.1, by - s * 0.15, s * 0.05, '#5aa84a', false);
    artLimb(b, bx - s * 0.1, by - s * 0.15, bx - s * 0.1, by - s * 0.24, s * 0.05, '#5aa84a', false);
  } else if (rnd < 0.4) {
    b.strokeStyle = 'rgba(190,130,60,0.35)';
    b.lineWidth = Math.max(1, s * 0.03);
    b.beginPath(); b.moveTo(bx - s * 0.15, by - s * 0.1); b.quadraticCurveTo(bx, by - s * 0.16, bx + s * 0.15, by - s * 0.1); b.stroke();
  } else if (rnd < 0.5) {
    artBlob(b, bx, by - s * 0.04, s * 0.08, s * 0.05, '#c8a070', { line: false });
  }
};
