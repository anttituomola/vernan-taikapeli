'use strict';

// Sienipomppu (Kaukamaa, Hohtometsä): uusi verbi POMPPU. Prinsessa pomppii
// itsestään hohtosienten hatuilla ylöspäin kohti Kuukukkaa; sormi ohjaa
// sivusuunnassa (prinsessa hakeutuu sormen kohdalle pehmeästi, ei nykien).
// Rata arvotaan joka peluukerralla neljään kovenevaan osioon: tavalliset sienet,
// liikkuvat ja jousisienet, lakastuvat sienet (kestävät yhden pompun) ja
// takiaiset (piikkipallot, osuma vie sydämen). Jokaisen osion alussa on
// lyhtysieni (tarkistuspiste). Alas pudotessa menee sydän ja prinsessa palaa
// viimeiselle lyhdylle. Tulikärpäset ovat bonuksia (HUD n/12); ne sytyttävät
// Kuukukan lopussa. Tehtävät toisen ja neljännen lyhdyn kohdalla.

// Osiot: n sientä, pystyväli dy (× viewH), suurin sivusiirtymä dx (× viewW),
// liikkuvien, lakastuvien ja jousien osuus, liikkeen nopeus, takiaisia
// react: reaktioaika (s), jolla jokaisen hypyn on oltava mahdollinen, kun sormi
// siirtyy seuraavan sienen kohdalle vasta tämän viiveen jälkeen (bounceReachable)
var BOUNCE_SECTIONS = [
  { n: 8, dy: [0.12, 0.16], dx: 0.26, move: 0, wilt: 0, spring: 0, speed: 0, burrs: 0, react: 0.6 },
  { n: 9, dy: [0.14, 0.18], dx: 0.28, move: 0.3, wilt: 0, spring: 1, speed: 0.7, burrs: 0, react: 0.48 },
  { n: 9, dy: [0.15, 0.19], dx: 0.3, move: 0.25, wilt: 0.3, spring: 1, speed: 0.8, burrs: 1, react: 0.42 },
  { n: 10, dy: [0.16, 0.2], dx: 0.32, move: 0.3, wilt: 0.3, spring: 1, speed: 0.9, burrs: 2, react: 0.38 }
];
var BOUNCE_G = 1.7;          // painovoima × viewH / s²
var BOUNCE_APEX = 0.30;      // tavallisen pompun korkeus × viewH
var BOUNCE_SPRING = 0.52;    // jousisienen pompun korkeus
var BOUNCE_K = 20;           // ohjauksen jousi (sormen etäisyys -> kiihtyvyys)
var BOUNCE_D = 9;            // vaimennus (kriittinen: ei yli- eikä alilyöntiä)
var BOUNCE_VMAX = 0.6;      // suurin sivunopeus × viewW / s
var BOUNCE_FIREFLIES = 3;    // tulikärpäsiä osiota kohden

var bounce = {
  plats: [], burrs: [], flies: [], spores: [],
  x: 0, y: 0, vx: 0, vy: 0, facing: 1, squash: 0,
  camY: 0, cp: null, section: 0, goal: null, won: false, wonT: 0,
  fallT: 0, holdSeen: false, hintT: 0, taskDelay: -1, taskIdx: 0
};

function bounceVy(apex) { return -Math.sqrt(2 * BOUNCE_G * apex) * viewH; }
function bounceSize() { return viewH / 620; }
function bouncePlatW(type) {
  if (type === 'lantern') return viewH * 0.4;
  if (type === 'goal') return viewH * 0.5;
  return viewH * 0.21;
}

// Onnistuuko hyppy: lähtö sienen keskeltä, sormi siirtyy kohteen kohdalle
// `delay` sekunnin kuluttua. dxPx sivulle, dyPx ylös, wB kohteen leveys.
function bounceReachable(dxPx, dyPx, wB, delay, apex) {
  var h = viewH, W = viewW, dt = 1 / 120, x = 0, y = 0, vx = 0, vy = bounceVy(apex || BOUNCE_APEX), t = 0, prevY, i, finger, ax;
  for (i = 0; i < 400; i++) {
    finger = t < delay ? 0 : dxPx;
    ax = (finger - x) * BOUNCE_K - vx * BOUNCE_D;
    vx += ax * dt;
    vx = Math.max(-BOUNCE_VMAX * W, Math.min(BOUNCE_VMAX * W, vx));
    x += vx * dt;
    prevY = y;
    vy += BOUNCE_G * h * dt;
    y += vy * dt;
    t += dt;
    if (vy > 0 && prevY <= -dyPx && y >= -dyPx) return Math.abs(x - dxPx) <= wB / 2;
    if (vy > 0 && y > -dyPx) return false;
  }
  return false;
}

// ---------- Radan arvonta ----------
function bounceBuild() {
  var W = viewW, h = viewH, plats = [], burrs = [], flies = [], y = groundTop, x = W * 0.5, s, S, k, p, type, r, prevX, lastIdx;
  bounce.plats = plats;
  bounce.burrs = burrs;
  bounce.flies = flies;
  // Lähtö: leveä lyhtysieni maassa
  plats.push(bounceMakePlat(x, y, 'lantern', 0));
  for (s = 0; s < BOUNCE_SECTIONS.length; s++) {
    S = BOUNCE_SECTIONS[s];
    var springAt = S.spring ? 2 + Math.floor(Math.random() * (S.n - 4)) : -1;
    var flyAt = [], fi;
    // Tulikärpäset arvotuille väleille
    while (flyAt.length < BOUNCE_FIREFLIES) {
      fi = 1 + Math.floor(Math.random() * (S.n - 1));
      if (flyAt.indexOf(fi) < 0) flyAt.push(fi);
    }
    for (k = 0; k < S.n; k++) {
      prevX = x;
      var last = plats[plats.length - 1], lastWasSpring = last.type === 'spring';
      var dyPx = h * (lastWasSpring ? 0.4 : S.dy[0] + Math.random() * (S.dy[1] - S.dy[0]));
      type = 'normal';
      r = Math.random();
      if (k === springAt) type = 'spring';
      else if (k > 0 && r < S.wilt) type = 'wilt';
      else if (k > 0 && r < S.wilt + S.move) type = 'move';
      // Kaksi lakastuvaa peräkkäin on liikaa: toinen on tavallinen
      if (type === 'wilt' && last.type === 'wilt') type = 'normal';
      var amp = type === 'move' ? W * (0.08 + Math.random() * 0.06) : 0;
      // Sivusiirtymä: vähintään kolmannes suurimmasta, suunta arvotaan, reunoilta käännetään.
      // Lyhennetään, kunnes hyppy onnistuu osion reaktioajalla (liikkuvaan sieneen
      // myös silloin, kun se on kauimmassa asennossaan).
      var dx = (S.dx * (0.35 + Math.random() * 0.65)) * W * (Math.random() < 0.5 ? -1 : 1), tries = 0;
      if (x + dx < W * 0.14 || x + dx > W * 0.86) dx = -dx;
      var apexFrom = lastWasSpring ? BOUNCE_SPRING : BOUNCE_APEX;
      while (tries < 12 && !bounceReachable(Math.abs(dx) + amp + Math.abs(last.amp || 0), dyPx, bouncePlatW(type), S.react, apexFrom)) { dx *= 0.85; tries++; }
      x = Math.min(Math.max(x + dx, W * 0.14), W * 0.86);
      y -= dyPx;
      p = bounceMakePlat(x, y, type, s);
      if (type === 'move') { p.amp = amp; p.speed = S.speed * (0.8 + Math.random() * 0.4); p.phase = Math.random() * 6; }
      plats.push(p);
      if (flyAt.indexOf(k) >= 0) {
        // Tulikärpänen leijuu sienten välissä pompun reitillä
        flies.push({ x: (prevX + x) / 2, y: y + h * 0.1, section: s, collected: false, t: Math.random() * 6 });
      }
    }
    // Takiaiset: leijuvat sienten välissä ja kulkevat sivuttain
    lastIdx = plats.length - 1;
    for (k = 0; k < S.burrs; k++) {
      var pb = plats[lastIdx - 2 - k * 3] || plats[lastIdx];
      burrs.push({ cx: W * (0.3 + Math.random() * 0.4), y: pb.y - h * 0.08, amp: W * (0.18 + Math.random() * 0.1), speed: 0.6 + Math.random() * 0.4 + s * 0.1, phase: Math.random() * 6, x: 0, section: s });
    }
    // Osion loppuun lyhtysieni (viimeisen jälkeen Kuukukka)
    y -= h * 0.17;
    x = Math.min(Math.max(x + (Math.random() - 0.5) * W * 0.2, W * 0.25), W * 0.75);
    plats.push(bounceMakePlat(x, y, s === BOUNCE_SECTIONS.length - 1 ? 'goal' : 'lantern', s + 1));
  }
  bounce.goal = plats[plats.length - 1];
}
function bounceMakePlat(x, y, type, section) {
  return { x: x, bx: x, y: y, w: bouncePlatW(type), type: type, section: section, lit: false, wiltT: 0, gone: false, press: 0, amp: 0, speed: 0, phase: 0 };
}

// ---------- Alustus ----------
function initBounce() {
  var i;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'pattern')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  bounce.vw = viewW;
  bounce.vh = viewH;
  bounceBuild();
  bounce.cp = bounce.plats[0];
  bounce.cp.lit = true;
  bounce.section = 0;
  bounce.won = false;
  bounce.wonT = 0;
  bounce.fallT = 0;
  bounce.holdSeen = false;
  bounce.hintT = 0;
  bounce.taskDelay = -1;
  bounce.taskIdx = 0;
  bounce.spores = [];
  bounceSpawnAt(bounce.cp);
  renderBackground();
  playNote(523, 0, 0.12, 'sine', 0.25);
  playNote(784, 0.1, 0.2, 'sine', 0.25);
}
function bounceSpawnAt(p) {
  bounce.x = p.x;
  bounce.y = p.y;
  bounce.vx = 0;
  bounce.vy = bounceVy(BOUNCE_APEX);
  bounce.camY = p.y - viewH * 0.72;
}
// Putoaminen tai sydänten loppuminen: takaisin viimeiselle lyhdylle.
// Lakastuneet sienet kasvavat takaisin tarkistuspisteen yläpuolella.
function respawnBounce() {
  var i, p;
  for (i = 0; i < bounce.plats.length; i++) {
    p = bounce.plats[i];
    if (p.y <= bounce.cp.y && p.type === 'wilt') { p.gone = false; p.wiltT = 0; }
  }
  bounceSpawnAt(bounce.cp);
  spawnSparkles(bounce.x, bounce.y - viewH * 0.08, 14, '#bff8ff');
}
// Ruudun koko muuttui: rata skaalataan uusiin mittoihin (eteneminen säilyy)
function resizeBounce() {
  var sx = bounce.vw ? viewW / bounce.vw : 1, sy = bounce.vh ? viewH / bounce.vh : 1, i, o, lists = [bounce.plats, bounce.flies, bounce.burrs, bounce.spores], L;
  for (L = 0; L < lists.length; L++) {
    for (i = 0; i < lists[L].length; i++) {
      o = lists[L][i];
      if (o.x !== undefined) o.x *= sx;
      if (o.bx !== undefined) o.bx *= sx;
      if (o.cx !== undefined) o.cx *= sx;
      if (o.amp !== undefined) o.amp *= sx;
      if (o.w !== undefined) o.w *= sy;
      o.y *= sy;
    }
  }
  bounce.x *= sx; bounce.y *= sy; bounce.vx *= sx; bounce.vy *= sy; bounce.camY *= sy;
  bounce.vw = viewW;
  bounce.vh = viewH;
  camX = 0;
}

function handleBounceTap() {
  bounce.holdSeen = true;
}

// ---------- Päivitys ----------
function updateBounce(dt) {
  var i, p, b, f, h = viewH, W = viewW, busy, prevY, ax, s = bounceSize(), dx, dy, t;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (bounce.taskDelay > 0 && !busy) {
    bounce.taskDelay -= dt;
    if (bounce.taskDelay <= 0 && tasks[bounce.taskIdx] && !tasks[bounce.taskIdx].opened) taskStart(tasks[bounce.taskIdx]);
  }
  if (!bounce.holdSeen) bounce.hintT += dt;
  for (i = 0; i < bounce.plats.length; i++) {
    p = bounce.plats[i];
    if (p.press > 0) p.press = Math.max(0, p.press - dt * 4);
    if (busy) continue;
    if (p.type === 'move') p.x = p.bx + Math.sin(globalT * p.speed + p.phase) * p.amp;
    if (p.wiltT > 0 && !p.gone) {
      p.wiltT += dt;
      if (p.wiltT > 0.45) {
        p.gone = true;
        for (var k = 0; k < 6; k++) bounce.spores.push({ x: p.x + (Math.random() - 0.5) * p.w * 0.6, y: p.y - h * 0.03, vx: (Math.random() - 0.5) * h * 0.2, vy: -Math.random() * h * 0.2, t: 0 });
      }
    }
  }
  for (i = 0; i < bounce.flies.length; i++) bounce.flies[i].t += dt;
  for (i = bounce.spores.length - 1; i >= 0; i--) {
    f = bounce.spores[i];
    f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += h * 0.4 * dt;
    if (f.t > 1.2) bounce.spores.splice(i, 1);
  }
  if (busy || celebrating) return;
  if (bounce.won) {
    bounce.wonT += dt;
    if (bounce.wonT > 1.6) startCelebration();
    return;
  }
  for (i = 0; i < bounce.burrs.length; i++) {
    b = bounce.burrs[i];
    b.x = b.cx + Math.sin(globalT * b.speed + b.phase) * b.amp;
  }

  // Sivuohjaus: kiihtyvyys sormen etäisyyden mukaan ja vaimennus
  if (holding) {
    bounce.holdSeen = true;
    ax = (lastPX - bounce.x) * BOUNCE_K - bounce.vx * BOUNCE_D;
  } else {
    ax = -bounce.vx * 3;
  }
  bounce.vx += ax * dt;
  bounce.vx = Math.max(-BOUNCE_VMAX * W, Math.min(BOUNCE_VMAX * W, bounce.vx));
  if (Math.abs(bounce.vx) > W * 0.02) bounce.facing = bounce.vx > 0 ? 1 : -1;
  bounce.x += bounce.vx * dt;
  if (bounce.x < W * 0.04) { bounce.x = W * 0.04; bounce.vx = 0; }
  if (bounce.x > W * 0.96) { bounce.x = W * 0.96; bounce.vx = 0; }
  prevY = bounce.y;
  bounce.vy += BOUNCE_G * h * dt;
  bounce.y += bounce.vy * dt;
  if (bounce.squash > 0) bounce.squash = Math.max(0, bounce.squash - dt * 5);

  // Laskeutuminen sienen hatulle vain ylhäältä päin
  if (bounce.vy > 0) {
    for (i = 0; i < bounce.plats.length; i++) {
      p = bounce.plats[i];
      if (p.gone) continue;
      if (prevY <= p.y && bounce.y >= p.y && Math.abs(bounce.x - p.x) <= p.w / 2 + h * 0.015) {
        bounceLand(p);
        break;
      }
    }
  }
  // Tulikärpäset
  for (i = 0; i < bounce.flies.length; i++) {
    f = bounce.flies[i];
    if (f.collected) continue;
    dx = bounce.x - f.x; dy = (bounce.y - h * 0.06) - f.y;
    if (dx * dx + dy * dy < h * h * 0.0064) {
      f.collected = true;
      registerCollected(f);
      artPop(f.x, f.y - bounce.camY, h * 0.05, '#fff6a0', 'burst');
      spawnSparkles(f.x, f.y - bounce.camY, 12, '#fff6a0');
      playNote(1319, 0, 0.1, 'sine', 0.3);
      playNote(1760, 0.08, 0.16, 'sine', 0.25);
    }
  }
  // Takiaiset: osuma vie sydämen ja töytäisee alas
  for (i = 0; i < bounce.burrs.length; i++) {
    b = bounce.burrs[i];
    dx = bounce.x - b.x; dy = (bounce.y - h * 0.06) - b.y;
    if (dx * dx + dy * dy < h * h * 0.0036) {
      if (loseHeart()) {
        bounce.vy = Math.max(bounce.vy, h * 0.4);
        bounce.vx = (dx >= 0 ? 1 : -1) * W * 0.25;
        artShakeStart(h * 0.01, 0.3);
        spawnSparkles(bounce.x, bounce.y - bounce.camY - h * 0.06, 10, '#ff8a8a');
      }
    }
  }
  // Kamera nousee prinsessan mukana, mutta ei laskeudu
  t = bounce.y - h * 0.62;
  if (t < bounce.camY) bounce.camY += (t - bounce.camY) * Math.min(1, dt * 5);
  // Putoaminen ruudun alareunan alle
  if (bounce.y - bounce.camY > h * 1.12) {
    // Sydän menee (sydänten loppuessa failSection palauttaa myös osion tulikärpäset)
    loseHeart();
    respawnBounce();
    playNote(330, 0, 0.2, 'triangle', 0.25);
    playNote(220, 0.15, 0.3, 'triangle', 0.25);
  }
}

function bounceLand(p) {
  var h = viewH, sy = p.y - bounce.camY, apex = p.type === 'spring' ? BOUNCE_SPRING : BOUNCE_APEX;
  bounce.y = p.y;
  bounce.vy = bounceVy(apex);
  bounce.squash = 1;
  p.press = 1;
  spawnDust(bounce.x, sy, 4, 0);
  if (p.type === 'spring') {
    artPop(p.x, sy - h * 0.03, h * 0.08, '#ff9ee0', 'ring');
    playNote(392, 0, 0.1, 'sine', 0.3);
    playNote(784, 0.06, 0.12, 'sine', 0.3);
    playNote(1175, 0.12, 0.2, 'sine', 0.25);
  } else {
    playNote(440 + Math.min(12, p.section * 3 + (bounce.plats.indexOf(p) % 5)) * 30, 0, 0.08, 'sine', 0.2);
  }
  if (p.type === 'wilt' && p.wiltT === 0) {
    p.wiltT = 0.001;
    playNote(260, 0.05, 0.2, 'triangle', 0.18);
  }
  if ((p.type === 'lantern' || p.type === 'goal') && !p.lit) {
    p.lit = true;
    bounce.cp = p;
    bounce.section = p.section;
    // Tarkistuspiste: sydämet täyteen, kerätyt jäävät pysyviksi
    sectionItems = [];
    hearts = HEART_MAX;
    spawnSparkles(p.x, sy - h * 0.1, 16, '#ffe27a');
    playNote(659, 0, 0.18, 'triangle', 0.35);
    playNote(988, 0.1, 0.3, 'triangle', 0.35);
    if (p.type === 'goal') {
      bounce.won = true;
      bounce.wonT = 0;
      bounce.vy = bounceVy(0.12);
      soundFanfare();
      for (var i = 0; i < bounceFliesGot(); i++) artPop(p.x + (i - 6) * h * 0.03, sy - h * 0.3, h * 0.04, '#fff6a0', 'burst');
    } else if (p.section === 1 || p.section === 3) {
      bounce.taskIdx = p.section === 1 ? 0 : 1;
      bounce.taskDelay = 0.5;
    }
  }
}
function bounceFliesGot() {
  var i, n = 0;
  for (i = 0; i < bounce.flies.length; i++) if (bounce.flies[i].collected) n++;
  return n;
}

// ---------- Piirto: tausta ----------
function renderBounceBg(b, w, h) {
  var g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#0e1540');
  g.addColorStop(0.6, '#1d3a5a');
  g.addColorStop(1, '#27566a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 50; i++) {
    x = viewW * ((i * 0.137 + 0.05) % 1);
    b.fillStyle = 'rgba(255,255,240,' + (0.2 + (i % 4) * 0.15) + ')';
    b.beginPath(); b.arc(x, h * ((i * 0.071) % 0.7), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
}

// Kaukaiset jättisienet ja rungot liikkuvat pystysuunnassa hitaammin (parallaksi)
function drawBounceParallax(c) {
  var h = viewH, W = viewW, i, x, y, cam = bounce.camY, span = h * 1.6, k;
  for (i = 0; i < 7; i++) {
    x = W * ((i * 0.23 + 0.08) % 1);
    y = ((i * 0.37 * span - cam * 0.25) % span + span) % span - h * 0.3;
    k = 0.5 + (i % 3) * 0.2;
    c.fillStyle = 'rgba(40,70,110,0.55)';
    c.fillRect(x - h * 0.03 * k, y, h * 0.06 * k, h * 0.8);
    c.fillStyle = 'rgba(60,110,140,0.55)';
    c.beginPath(); c.ellipse(x, y, h * 0.2 * k, h * 0.08 * k, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(160,255,240,0.25)';
    c.beginPath(); c.arc(x - h * 0.05 * k, y - h * 0.03 * k, h * 0.012 * k, 0, Math.PI * 2); c.arc(x + h * 0.06 * k, y - h * 0.04 * k, h * 0.01 * k, 0, Math.PI * 2); c.fill();
  }
  // Metsänpohja lähtösienen alla
  var fy = bounce.plats.length ? bounce.plats[0].y - cam + h * 0.2 : h;
  if (fy < h) {
    var fg = c.createLinearGradient(0, fy, 0, fy + h * 0.2);
    fg.addColorStop(0, '#1f4a4a');
    fg.addColorStop(1, '#0e2a30');
    c.fillStyle = fg;
    c.fillRect(0, fy, W, h - fy + h * 0.05);
    for (i = 0; i < 9; i++) artBlob(c, W * (i * 0.12 + 0.03), fy, h * 0.07, h * 0.03, '#2a6a5a', { line: false });
  }
  // Kuu ja Kuukukka odottavat ylhäällä: kuu laskeutuu näkyviin lopussa
  var goalY = bounce.goal ? bounce.goal.y - cam : -h;
  var my = Math.max(h * 0.12, goalY - h * 0.55);
  if (my < h * 0.9) {
    artGlow(c, W * 0.82, my, h * 0.2, '#e8f4ff', 0.35);
    artCircle(c, W * 0.82, my, h * 0.07, '#f4f8ff', { line: false });
  }
}

// ---------- Piirto: sienet ----------
// part: 'stem' piirtää vain varren, muuten hattu (varret ensin, jotta ne eivät peitä alempia hattuja)
function drawBounceMushroom(c, p, sy, part) {
  var h = viewH, w = p.w, press = p.press, x = p.x, i;
  // p.y on hatun yläpinta (prinsessan jalat): hatun alareuna on sen alla
  sy += h * 0.078;
  var fade = p.wiltT > 0 ? Math.max(0, 1 - p.wiltT / 0.45) : 1;
  if (p.gone) return;
  var cols = { normal: ['#5fd4c8', '#2a8a8a'], move: ['#8ab8ff', '#3a5ab8'], spring: ['#ff8ad8', '#b83a9a'], wilt: ['#c9a98a', '#7a5a3a'], lantern: ['#b98aff', '#5a3ab8'], goal: ['#fff3a0', '#c9a02a'] }[p.type];
  c.globalAlpha = fade;
  var droop = p.wiltT > 0 ? p.wiltT * h * 0.08 : 0;
  var wob = p.type === 'wilt' && p.wiltT === 0 ? Math.sin(globalT * 7 + x) * h * 0.002 : 0;
  // Varsi
  var stemH = p.type === 'lantern' || p.type === 'goal' ? h * 0.3 : h * 0.16;
  if (part === 'stem') {
    artRoundRect(c, x - w * 0.09, sy + droop, w * 0.18, stemH, w * 0.06, '#f0e8ff', { lineColor: '#8a7ab8', shadeTo: '#c9bfe8' });
    c.globalAlpha = 1;
    return;
  }
  // Hattu (painuu pompussa)
  var capH = h * 0.06 * (1 - press * 0.3), cy = sy + droop + press * h * 0.012;
  if (p.type !== 'normal' && p.type !== 'wilt') artGlow(c, x, cy - capH * 0.5, w * 0.7, cols[0], 0.35);
  c.beginPath();
  c.moveTo(x - w / 2 + wob, cy + h * 0.006);
  c.quadraticCurveTo(x - w * 0.55, cy - capH * 1.3, x, cy - capH * 1.4);
  c.quadraticCurveTo(x + w * 0.55, cy - capH * 1.3, x + w / 2 - wob, cy + h * 0.006);
  c.closePath();
  artFillPath(c, cols[0], cy - capH * 1.4, cy, w * 0.3, { lineColor: cols[1], line: Math.max(1.5, h * 0.004) });
  // Hohtopilkut
  c.fillStyle = p.type === 'wilt' ? 'rgba(90,60,30,0.5)' : 'rgba(230,255,250,0.85)';
  for (i = 0; i < 4; i++) {
    c.beginPath(); c.arc(x + (i - 1.5) * w * 0.2, cy - capH * (0.55 + (i % 2) * 0.35), h * (0.007 + (i % 2) * 0.004), 0, Math.PI * 2); c.fill();
  }
  if (p.type === 'spring') {
    // Jousikierre hatun päällä
    c.strokeStyle = '#fff';
    c.lineWidth = Math.max(1.5, h * 0.004);
    c.beginPath();
    for (i = 0; i < 3; i++) c.arc(x, cy - capH * 1.4 - h * 0.008 - i * h * 0.012, h * 0.012, Math.PI, Math.PI * 3);
    c.stroke();
  } else if (p.type === 'move') {
    // Nuolet kertovat liikkeestä
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (i = -1; i <= 1; i += 2) {
      c.beginPath(); c.moveTo(x + i * w * 0.62, cy - capH * 0.5); c.lineTo(x + i * w * 0.52, cy - capH * 0.9); c.lineTo(x + i * w * 0.52, cy - capH * 0.1); c.closePath(); c.fill();
    }
  } else if (p.type === 'lantern') {
    // Lyhty roikkuu hatun reunalta: syttyy tarkistuspisteenä
    var lx = x + w * 0.38, ly = cy + h * 0.05;
    c.strokeStyle = '#8a7ab8'; c.lineWidth = Math.max(1, h * 0.003);
    c.beginPath(); c.moveTo(lx, cy); c.lineTo(lx, ly - h * 0.02); c.stroke();
    if (p.lit) artGlow(c, lx, ly, h * 0.07, '#ffe27a', 0.6 + Math.sin(globalT * 4) * 0.1);
    artRoundRect(c, lx - h * 0.014, ly - h * 0.02, h * 0.028, h * 0.036, h * 0.008, p.lit ? '#ffe27a' : '#6a5a8a', { lineColor: '#3a2a5a' });
  } else if (p.type === 'goal') {
    // Kuukukka: terälehdet aukeavat, kun sinne päästään
    var open = bounce.won ? Math.min(1, bounce.wonT / 0.8) : 0.2;
    for (i = 0; i < 7; i++) {
      var a = -Math.PI + (i / 6) * Math.PI;
      artBlob(c, x + Math.cos(a) * w * (0.2 + open * 0.15), cy - capH * 1.3 + Math.sin(a) * h * (0.04 + open * 0.05), h * 0.035, h * 0.06, '#fff8d0', { rot: a + Math.PI / 2, lineColor: '#d9b84a' });
    }
    artGlow(c, x, cy - capH * 1.6, h * (0.12 + open * 0.2), '#fff6a0', 0.5 + open * 0.3);
  }
  c.globalAlpha = 1;
}

function drawBounceBurr(c, b, sy) {
  var h = viewH, r = h * 0.03, i, a;
  c.strokeStyle = '#3a2a1a';
  c.lineWidth = Math.max(1.5, h * 0.004);
  for (i = 0; i < 12; i++) {
    a = i * Math.PI / 6 + globalT * 2;
    c.beginPath(); c.moveTo(b.x + Math.cos(a) * r * 0.8, sy + Math.sin(a) * r * 0.8); c.lineTo(b.x + Math.cos(a) * r * 1.5, sy + Math.sin(a) * r * 1.5); c.stroke();
  }
  artCircle(c, b.x, sy, r, '#8a6a3a', { lineColor: '#3a2a1a', hi: 0.2 });
  artEye(c, b.x - r * 0.35, sy - r * 0.1, r * 0.25, 0, false);
  artEye(c, b.x + r * 0.35, sy - r * 0.1, r * 0.25, 0, false);
}

function drawBounceFirefly(c, f, sy) {
  var h = viewH, bob = Math.sin(f.t * 3) * h * 0.012, gl = 0.6 + Math.sin(f.t * 6) * 0.25;
  artGlow(c, f.x, sy + bob, h * 0.06, '#fff6a0', gl);
  artBlob(c, f.x, sy + bob, h * 0.011, h * 0.015, '#ffe27a', { line: false });
  c.fillStyle = 'rgba(220,240,255,0.7)';
  c.beginPath(); c.ellipse(f.x - h * 0.012, sy + bob - h * 0.012, h * 0.01, h * 0.006, -0.5 + Math.sin(f.t * 30) * 0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(f.x + h * 0.012, sy + bob - h * 0.012, h * 0.01, h * 0.006, 0.5 - Math.sin(f.t * 30) * 0.4, 0, Math.PI * 2); c.fill();
}

function drawBounce() {
  var c = ctx, h = viewH, i, p, sy, cam = bounce.camY, s = bounceSize();
  if (!beginPlayWorld()) return;
  drawBounceParallax(c);
  var part, pass;
  for (pass = 0; pass < 2; pass++) {
    part = pass === 0 ? 'stem' : 'cap';
    for (i = 0; i < bounce.plats.length; i++) {
      p = bounce.plats[i];
      sy = p.y - cam;
      if (sy < -h * 0.1 || sy > h * 1.4) continue;
      drawBounceMushroom(c, p, sy, part);
    }
  }
  for (i = 0; i < bounce.flies.length; i++) {
    if (bounce.flies[i].collected) continue;
    sy = bounce.flies[i].y - cam;
    if (sy > -h * 0.1 && sy < h * 1.1) drawBounceFirefly(c, bounce.flies[i], sy);
  }
  for (i = 0; i < bounce.burrs.length; i++) {
    sy = bounce.burrs[i].y - cam;
    if (sy > -h * 0.1 && sy < h * 1.1) drawBounceBurr(c, bounce.burrs[i], sy);
  }
  for (i = 0; i < bounce.spores.length; i++) {
    p = bounce.spores[i];
    c.globalAlpha = Math.max(0, 1 - p.t / 1.2);
    artCircle(c, p.x, p.y - cam, h * 0.008, '#c9a98a', { line: false });
    c.globalAlpha = 1;
  }
  // Prinsessa: litistyy pompussa, venyy ilmassa
  var px = bounce.x, py = bounce.y - cam, sq = bounce.squash;
  var stretch = bounce.vy < 0 ? Math.min(0.12, -bounce.vy / (h * 8)) : 0;
  c.save();
  c.translate(px, py);
  c.scale(1 + sq * 0.18 - stretch * 0.5, 1 - sq * 0.18 + stretch);
  if (hurtT > 0 && Math.sin(globalT * 22) > 0) c.globalAlpha = 0.45;
  drawPrincessFree(c, 0, 0, s, bounce.facing, 0, false, globalT);
  c.globalAlpha = 1;
  c.restore();
  // Vihje: käsi liikkuu sivuttain, kunnes lapsi koskee ruutuun
  if (!bounce.holdSeen && bounce.hintT > 0.8) {
    var k = Math.sin(bounce.hintT * 2.2);
    drawHand(c, viewW * 0.5 + k * viewW * 0.18, h * 0.86, h * 0.035);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawBounceHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: tulikärpäset n / 12 ja korkeusmittari (prinsessa matkalla Kuukukalle)
function drawBounceHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), total = bounce.flies.length, got = bounceFliesGot();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 7.5, hs * 3.6, hs);
  c.fill();
  artGlow(c, left + hs * 1.8, pad * 0.5 + hs * 1.8, hs * 1.6, '#fff6a0', 0.7);
  artBlob(c, left + hs * 1.8, pad * 0.5 + hs * 1.8, hs * 0.55, hs * 0.75, '#ffe27a', { lineColor: '#b8860b' });
  c.fillStyle = '#2a4a6a';
  c.font = 'bold ' + Math.round(hs * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(got + '/' + total, left + hs * 3.2, pad * 0.5 + hs * 1.85);
  c.textBaseline = 'alphabetic';
  // Korkeusmittari oikeassa reunassa
  if (!bounce.goal) return;
  var x = viewW - viewH * 0.05, top = viewH * 0.16, bot = viewH * 0.86, start = bounce.plats[0].y, goal = bounce.goal.y;
  var k = Math.min(1, Math.max(0, (start - bounce.y) / (start - goal))), i;
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = hs * 0.5;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot); c.stroke();
  for (i = 0; i < bounce.plats.length; i++) {
    var p = bounce.plats[i];
    if (p.type !== 'lantern') continue;
    var ly = bot - (bot - top) * ((start - p.y) / (start - goal));
    artCircle(c, x, ly, hs * 0.45, p.lit ? '#ffe27a' : '#6a5a8a', { line: false });
  }
  artGlow(c, x, top, hs * 1.8, '#fff6a0', 0.6);
  artCircle(c, x, top, hs * 0.6, '#fff8d0', { lineColor: '#d9b84a' });
  artCircle(c, x, bot - (bot - top) * k, hs * 0.7, '#ff6fb0', { lineColor: '#fff' });
}

HUB_ICONS.bounce = function (c, x, y, s) {
  artRoundRect(c, x - s * 0.035, y, s * 0.07, s * 0.16, s * 0.03, '#f0e8ff', { lineColor: '#8a7ab8' });
  c.beginPath(); c.moveTo(x - s * 0.17, y + s * 0.01); c.quadraticCurveTo(x, y - s * 0.2, x + s * 0.17, y + s * 0.01); c.closePath();
  artFillPath(c, '#5fd4c8', y - s * 0.12, y, s * 0.1, { lineColor: '#2a8a8a' });
  c.fillStyle = 'rgba(230,255,250,0.9)';
  c.beginPath(); c.arc(x - s * 0.06, y - s * 0.05, s * 0.018, 0, Math.PI * 2); c.arc(x + s * 0.05, y - s * 0.07, s * 0.015, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = Math.max(1.5, s * 0.025);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y - s * 0.14); c.lineTo(x, y - s * 0.28); c.moveTo(x - s * 0.05, y - s * 0.23); c.lineTo(x, y - s * 0.28); c.lineTo(x + s * 0.05, y - s * 0.23); c.stroke();
};

// Hohtometsän sokkelon maasto: pienet hohtosienet, saniaiset ja tulikärpäset
HUB_TILE_DECOR.glow = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.85;
  if (rnd < 0.35) {
    b.fillStyle = '#e8e0ff';
    b.fillRect(bx - s * 0.03, by - s * 0.16, s * 0.06, s * 0.16);
    artGlow(b, bx, by - s * 0.18, s * 0.2, rnd2 < 0.5 ? '#5fd4c8' : '#ff8ad8', 0.4);
    b.beginPath(); b.arc(bx, by - s * 0.16, s * 0.11, Math.PI, 0); b.closePath();
    artFillPath(b, rnd2 < 0.5 ? '#5fd4c8' : '#ff8ad8', by - s * 0.27, by - s * 0.16, s * 0.1, { line: false });
  } else if (rnd < 0.5) {
    artGlow(b, bx, y + s * 0.4, s * 0.12, '#fff6a0', 0.7);
    artCircle(b, bx, y + s * 0.4, s * 0.025, '#fff6a0', { line: false });
  } else if (rnd < 0.62) {
    artBlob(b, bx, by - s * 0.05, s * 0.18, s * 0.08, '#3a7a6a', { shadeTo: '#1a4a3a', line: false });
  }
};
