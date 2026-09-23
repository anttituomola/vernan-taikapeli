'use strict';

// Tulikärpässieppo (Kaukamaa, Hohtometsä): uusi verbi SIPAISU. Prinsessan
// lasipurkissa on tyhjät paikat, joiden väri kertoo, minkä värisiä
// tulikärpäsiä pitää haavia. Sipaisu (sormi liikkeessä) vetää hohtavan haavin
// perässään; paikallaan oleva sormi ei nappaa. Väärän värinen tulikärpänen
// säikähtää ja vie purkista viimeksi napatun mukanaan. Varjokoit lepattavat
// joukossa: haavin osuminen koiin vie sydämen ja rikkoo haavin hetkeksi.
// Neljä kovenevaa kierrosta, värit arvotaan: 1) yksi väri, 2) toinen väri ja
// enemmän koita, 3) tulikärpäset välkkyvät (pimeänä ei voi napata), 4) värit
// järjestyksessä purkin paikkojen mukaan. Tehtävät 2. ja 3. kierroksen jälkeen.

var CATCH_COLORS = [
  { id: 'gold', c: '#ffe27a', d: '#b8860b' },
  { id: 'blue', c: '#7fd4ff', d: '#2a7ab8' },
  { id: 'pink', c: '#ff8ad8', d: '#b83a9a' }
];
// need: purkin paikat, flies: tulikärpäsiä ruudulla, speed × viewH/s,
// moths: koita, blink: välkkyvät, order: värit järjestyksessä,
// chase: koit hakeutuvat haavin valoa kohti (× viewH / s, kun sormi on ruudulla)
var CATCH_ROUNDS = [
  { need: 4, flies: 6, speed: 0.16, moths: 1, blink: false, order: false, chase: 0 },
  { need: 5, flies: 7, speed: 0.2, moths: 2, blink: false, order: false, chase: 0.06 },
  { need: 5, flies: 8, speed: 0.22, moths: 2, blink: true, order: false, chase: 0.12 },
  { need: 6, flies: 8, speed: 0.24, moths: 3, blink: false, order: true, chase: 0.14 }
];
var CATCH_NET_SPEED = 0.45;   // sormen vähimmäisnopeus × viewH / s, jotta haavi nappaa
var CATCH_HIT = 0.06;         // tulikärpäsen nappaussäde × viewH
var CATCH_MOTH_HIT = 0.055;   // koin osumasäde × viewH

var ctch = {
  round: 0, slots: [], got: 0, flies: [], moths: [], trail: [], flying: [],
  state: 'intro', t: 0, netBroken: 0, lastX: 0, lastY: 0, lastT: 0, netOn: false,
  swiped: false, hintT: 0, taskDelay: -1, jarShake: 0, perfect: true
};

function catchJar() { return { x: viewW * 0.5, y: groundTop + viewH * 0.04, s: viewH * 0.15 }; }

// ---------- Kierrokset ----------
function catchStartRound() {
  var R = CATCH_ROUNDS[ctch.round], i, pool = [0, 1, 2], a, b;
  ctch.slots = [];
  ctch.got = 0;
  if (R.order) {
    // Järjestys: kaksi tai kolme väriä sekaisin, ei kolmea samaa peräkkäin
    for (i = 0; i < R.need; i++) {
      do { a = Math.floor(Math.random() * 3); } while (i >= 2 && ctch.slots[i - 1] === a && ctch.slots[i - 2] === a);
      ctch.slots.push(a);
    }
  } else {
    // Yksi väri, eri kuin edellisellä kierroksella
    b = ctch.prevColor === undefined ? -1 : ctch.prevColor;
    do { a = pool[Math.floor(Math.random() * 3)]; } while (a === b);
    ctch.prevColor = a;
    for (i = 0; i < R.need; i++) ctch.slots.push(a);
  }
  ctch.flies = [];
  for (i = 0; i < R.flies; i++) ctch.flies.push(catchNewFly(R, i));
  ctch.moths = [];
  for (i = 0; i < R.moths; i++) ctch.moths.push(catchNewMoth(i, R.moths));
  ctch.state = 'play';
  ctch.t = 0;
  playNote(659, 0, 0.12, 'sine', 0.3);
  playNote(880, 0.1, 0.2, 'sine', 0.3);
}
// Uusi tulikärpänen: värit jaetaan niin, että tarvittavaa väriä on aina tarjolla
function catchNewFly(R, i) {
  var need = ctch.slots[Math.min(ctch.got, ctch.slots.length - 1)], col;
  col = i % 3 === 0 ? need : Math.floor(Math.random() * 3);
  var dir = Math.random() < 0.5 ? -1 : 1;
  return {
    x: viewW * (0.08 + Math.random() * 0.84), y: viewH * (0.16 + Math.random() * 0.42),
    dir: dir, sp: R.speed * viewH * (0.8 + Math.random() * 0.4), ph: Math.random() * 6, wob: 0.6 + Math.random() * 0.8,
    col: col, blinkPh: Math.random() * 3, dark: false, scare: 0
  };
}
function catchNewMoth(i, n) {
  return {
    cx: viewW * (0.2 + (i + 0.5) / n * 0.6), cy: viewH * (0.25 + Math.random() * 0.25),
    rx: viewW * (0.14 + Math.random() * 0.08), ry: viewH * (0.1 + Math.random() * 0.06),
    sp: 0.45 + Math.random() * 0.25 + ctch.round * 0.08, ph: Math.random() * 6, x: 0, y: 0, flap: Math.random() * 6, ox: 0, oy: 0
  };
}

// ---------- Alustus ----------
function initCatch() {
  var i;
  tasks = [makeTask(-5, 'odd'), makeTask(-5, 'order')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  ctch.round = 0;
  ctch.prevColor = undefined;
  ctch.trail = [];
  ctch.flying = [];
  ctch.netBroken = 0;
  ctch.swiped = false;
  ctch.hintT = 0;
  ctch.taskDelay = -1;
  ctch.jarShake = 0;
  ctch.perfect = true;
  ctch.state = 'intro';
  ctch.t = 0;
  ctch.slots = [];
  ctch.flies = [];
  ctch.moths = [];
  renderBackground();
}
function respawnCatch() {
  // Sydämet loppu: kierros alkaa alusta tyhjällä purkilla
  ctch.trail = [];
  ctch.flying = [];
  catchStartRound();
}
function resizeCatch() { camX = 0; }

function handleCatchTap(px, py) {
  ctch.lastX = px;
  ctch.lastY = py;
  ctch.lastT = globalT;
  ctch.trail = [];
}

// ---------- Nappaus ----------
// Etäisyys pisteestä janaan
function catchSegDist(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0, qx, qy;
  t = Math.max(0, Math.min(1, t));
  qx = ax + dx * t; qy = ay + dy * t;
  return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
}
function catchNeed() {
  return ctch.got < ctch.slots.length ? ctch.slots[ctch.got] : -1;
}
function catchFly(f) {
  var jar = catchJar(), need = catchNeed(), R = CATCH_ROUNDS[ctch.round];
  if (f.col === need) {
    ctch.flying.push({ x: f.x, y: f.y, x0: f.x, y0: f.y, slot: ctch.got, col: f.col, t: 0 });
    ctch.got++;
    artPop(f.x, f.y, viewH * 0.05, CATCH_COLORS[f.col].c, 'burst');
    playNote(988 + ctch.got * 90, 0, 0.1, 'sine', 0.3);
    playNote(1319 + ctch.got * 90, 0.07, 0.14, 'sine', 0.25);
  } else {
    // Väärä väri: säikähtää ja vie viimeksi napatun mukanaan
    ctch.perfect = false;
    ctch.jarShake = 0.5;
    spawnSparkles(f.x, f.y, 8, CATCH_COLORS[f.col].c);
    playNote(300, 0, 0.12, 'square', 0.12);
    playNote(250, 0.1, 0.15, 'square', 0.1);
    if (ctch.got > 0) {
      ctch.got--;
      var lost = ctch.slots[ctch.got];
      ctch.flies.push({ x: jar.x, y: jar.y - jar.s * 0.8, dir: Math.random() < 0.5 ? -1 : 1, sp: R.speed * viewH * 1.6, ph: 0, wob: 1, col: lost, blinkPh: 0, dark: false, scare: 1.2 });
    }
  }
  // Napattu tai säikähtänyt kärpänen korvataan uudella ruudun reunalta
  var nf = catchNewFly(R, Math.floor(Math.random() * 3));
  nf.x = Math.random() < 0.5 ? -viewW * 0.03 : viewW * 1.03;
  nf.dir = nf.x < 0 ? 1 : -1;
  ctch.flies[ctch.flies.indexOf(f)] = nf;
}

// ---------- Päivitys ----------
function updateCatch(dt) {
  var i, f, m, h = viewH, W = viewW, busy, R, px, py, sp, seg, k, jar = catchJar();
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  busy = puzzleBusy();
  if (ctch.jarShake > 0) ctch.jarShake -= dt;
  if (ctch.netBroken > 0) ctch.netBroken -= dt;
  if (ctch.taskDelay > 0 && !busy) {
    ctch.taskDelay -= dt;
    if (ctch.taskDelay <= 0) {
      // Viive asetetaan 2. ja 3. kierroksen lopussa (round on silloin vielä 1 tai 2)
      if (ctch.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (ctch.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (busy || celebrating) { ctch.trail = []; return; }
  ctch.t += dt;
  if (ctch.state === 'intro') {
    if (ctch.t > 1.0) catchStartRound();
    return;
  }
  if (ctch.state === 'roundDone') {
    if (ctch.t > 1.6 && ctch.taskDelay <= 0) {
      ctch.round++;
      if (ctch.round >= CATCH_ROUNDS.length) { ctch.state = 'won'; ctch.t = 0; soundFanfare(); }
      else catchStartRound();
    }
    return;
  }
  if (ctch.state === 'won') {
    if (ctch.t > 1.4) startCelebration();
    return;
  }
  R = CATCH_ROUNDS[ctch.round];
  if (!ctch.swiped) ctch.hintT += dt;

  // Tulikärpäset lentävät aaltoillen; reunalta ne kääntyvät takaisin
  for (i = 0; i < ctch.flies.length; i++) {
    f = ctch.flies[i];
    if (f.scare > 0) f.scare -= dt;
    f.ph += dt * f.wob * 2;
    f.x += f.dir * f.sp * dt * (f.scare > 0 ? 1.8 : 1);
    f.y += Math.sin(f.ph) * f.sp * 0.8 * dt;
    if (f.y < h * 0.12) f.y = h * 0.12;
    if (f.y > h * 0.62) f.y = h * 0.62;
    if ((f.x < W * 0.04 && f.dir < 0) || (f.x > W * 0.96 && f.dir > 0)) f.dir = -f.dir;
    if (Math.random() < dt * 0.25) f.dir = -f.dir;
    f.dark = R.blink && ((globalT + f.blinkPh) % 2.6) > 1.9;
  }
  // Koit kiertävät soikiota; myöhemmillä kierroksilla ne hakeutuvat haavin valoa kohti
  for (i = 0; i < ctch.moths.length; i++) {
    m = ctch.moths[i];
    m.ph += dt * m.sp;
    m.flap += dt * 14;
    var bx = m.cx + Math.cos(m.ph) * m.rx + Math.sin(m.ph * 2.3) * W * 0.03, by = m.cy + Math.sin(m.ph * 1.3) * m.ry;
    if (holding && R.chase > 0) {
      var cdx = lastPX - (bx + m.ox), cdy = lastPY - (by + m.oy), cd = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
      m.ox += cdx / cd * R.chase * h * dt;
      m.oy += cdy / cd * R.chase * h * dt;
    } else {
      m.ox *= Math.max(0, 1 - dt * 0.8);
      m.oy *= Math.max(0, 1 - dt * 0.8);
    }
    m.x = bx + m.ox;
    m.y = Math.min(h * 0.66, Math.max(h * 0.08, by + m.oy));
  }
  catchEnsureNeed();
  // Napatut lentävät purkkiin
  for (i = ctch.flying.length - 1; i >= 0; i--) {
    f = ctch.flying[i];
    f.t += dt;
    k = easeInOutSine(Math.min(1, f.t / 0.5));
    var sl = catchSlotPos(f.slot);
    f.x = f.x0 + (sl.x - f.x0) * k;
    f.y = f.y0 + (sl.y - f.y0) * k - Math.sin(k * Math.PI) * h * 0.08;
    if (f.t >= 0.5) ctch.flying.splice(i, 1);
  }

  // Haavi: sormen jäljen viimeinen jana nappaa, jos sormi liikkuu tarpeeksi nopeasti
  if (holding && ctch.netBroken <= 0) {
    px = lastPX; py = lastPY;
    var ddt = Math.max(1e-3, globalT - ctch.lastT);
    sp = Math.sqrt((px - ctch.lastX) * (px - ctch.lastX) + (py - ctch.lastY) * (py - ctch.lastY)) / ddt;
    ctch.netOn = sp > CATCH_NET_SPEED * h;
    if (ctch.netOn) {
      ctch.swiped = true;
      ctch.trail.push({ x: px, y: py, t: globalT });
      for (i = 0; i < ctch.moths.length; i++) {
        m = ctch.moths[i];
        if (catchSegDist(m.x, m.y, ctch.lastX, ctch.lastY, px, py) < CATCH_MOTH_HIT * h) {
          catchMothHit(m);
          break;
        }
      }
      for (i = 0; i < ctch.flies.length && ctch.netBroken <= 0; i++) {
        f = ctch.flies[i];
        if (f.dark || f.scare > 0) continue;
        if (catchSegDist(f.x, f.y, ctch.lastX, ctch.lastY, px, py) < CATCH_HIT * h) {
          catchFly(f);
          if (ctch.got >= ctch.slots.length) break;
        }
      }
    }
    ctch.lastX = px; ctch.lastY = py; ctch.lastT = globalT;
  } else {
    ctch.netOn = false;
  }
  for (i = ctch.trail.length - 1; i >= 0; i--) if (globalT - ctch.trail[i].t > 0.22) ctch.trail.splice(i, 1);

  if (ctch.got >= ctch.slots.length && ctch.flying.length === 0) {
    ctch.state = 'roundDone';
    ctch.t = 0;
    ctch.trail = [];
    artPop(jar.x, jar.y - jar.s * 0.8, jar.s * 1.6, '#fff6a0', 'ring');
    spawnSparkles(jar.x, jar.y - jar.s, 24, '#fff6a0');
    playNote(784, 0, 0.12, 'triangle', 0.35);
    playNote(1047, 0.12, 0.15, 'triangle', 0.35);
    playNote(1319, 0.24, 0.3, 'triangle', 0.35);
    if (ctch.round === 1 || ctch.round === 2) ctch.taskDelay = 1.2;
  }
}

// Seuraavaksi tarvittavaa väriä on aina vähintään kaksi (järjestyskierroksella väri vaihtuu):
// puuttuva tulee uutena ruudun reunalta, ja sen tilalta poistuu kaukaisin muunvärinen
function catchEnsureNeed() {
  var need = catchNeed(), n = 0, i, f, far = -1, fd = -1, R = CATCH_ROUNDS[ctch.round], d;
  if (need < 0) return;
  for (i = 0; i < ctch.flies.length; i++) if (ctch.flies[i].col === need) n++;
  if (n >= 2) return;
  for (i = 0; i < ctch.flies.length; i++) {
    f = ctch.flies[i];
    if (f.col === need || f.scare > 0) continue;
    d = Math.abs(f.x - viewW * 0.5);
    if (d > fd) { fd = d; far = i; }
  }
  if (far < 0) return;
  f = catchNewFly(R, 0);
  f.col = need;
  f.x = Math.random() < 0.5 ? -viewW * 0.03 : viewW * 1.03;
  f.dir = f.x < 0 ? 1 : -1;
  ctch.flies[far] = f;
}

function catchMothHit(m) {
  ctch.netBroken = 0.6;
  ctch.trail = [];
  artShakeStart(viewH * 0.01, 0.3);
  spawnSparkles(m.x, m.y, 14, '#6a4a9a');
  if (!loseHeart()) playNote(200, 0, 0.15, 'sawtooth', 0.15);
}

// ---------- Piirto ----------
function renderCatchBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#0b1238');
  g.addColorStop(0.55, '#1c3458');
  g.addColorStop(1, '#23505e');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  for (i = 0; i < 45; i++) {
    x = vw * ((i * 0.137 + 0.05) % 1);
    b.fillStyle = 'rgba(255,255,240,' + (0.2 + (i % 4) * 0.15) + ')';
    b.beginPath(); b.arc(x, h * ((i * 0.071) % 0.45), 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
  }
  drawBgSun(b, vw * 0.84, h * 0.13, h * 0.05, 0.2, '#e8f4ff', '#ffffff', '#cfe0ff');
  // Puiden siluetit reunoilla
  for (i = 0; i < 6; i++) {
    x = i < 3 ? vw * (0.02 + i * 0.07) : vw * (0.8 + (i - 3) * 0.07);
    b.fillStyle = 'rgba(20,40,60,0.85)';
    b.fillRect(x - h * 0.025, h * 0.1, h * 0.05, groundTop);
    b.beginPath(); b.arc(x, h * (0.16 + (i % 2) * 0.06), h * (0.1 + (i % 3) * 0.02), 0, Math.PI * 2); b.fill();
  }
  // Niitty ja hohtosienet
  g = b.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, '#1f5a52');
  g.addColorStop(1, '#0e2a30');
  b.fillStyle = g;
  b.fillRect(0, groundTop, w, h - groundTop);
  for (i = 0; i < 12; i++) {
    x = vw * (0.04 + i * 0.085);
    if (Math.abs(x - vw * 0.5) < h * 0.2) continue;
    var ms = h * (0.025 + (i % 3) * 0.01), col = ['#5fd4c8', '#ff8ad8', '#b98aff'][i % 3];
    b.fillStyle = '#e8e0ff';
    b.fillRect(x - ms * 0.2, groundTop + h * 0.03 - ms, ms * 0.4, ms);
    artGlow(b, x, groundTop + h * 0.03 - ms, ms * 2.2, col, 0.4);
    b.beginPath(); b.arc(x, groundTop + h * 0.03 - ms, ms * 0.8, Math.PI, 0); b.closePath();
    artFillPath(b, col, groundTop + h * 0.03 - ms * 1.8, groundTop + h * 0.03 - ms, ms, { line: false });
  }
}

// Purkin paikat: rivissä purkin kyljessä
function catchSlotPos(i) {
  var jar = catchJar(), n = ctch.slots.length || 1, sx = jar.s * 0.36;
  return { x: jar.x + (i - (n - 1) / 2) * sx, y: jar.y - jar.s * 0.55 - (i % 2) * jar.s * 0.18 };
}

function drawCatchFireflyAt(c, x, y, col, r, dark, t) {
  var cc = CATCH_COLORS[col];
  if (!dark) artGlow(c, x, y, r * 4, cc.c, 0.6 + Math.sin(t * 6) * 0.2);
  c.fillStyle = 'rgba(220,240,255,' + (dark ? 0.25 : 0.7) + ')';
  c.beginPath(); c.ellipse(x - r * 0.9, y - r * 0.8, r * 0.8, r * 0.45, -0.5 + Math.sin(t * 30) * 0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + r * 0.9, y - r * 0.8, r * 0.8, r * 0.45, 0.5 - Math.sin(t * 30) * 0.4, 0, Math.PI * 2); c.fill();
  artBlob(c, x, y, r * 0.75, r, dark ? '#4a4a6a' : cc.c, { lineColor: dark ? '#2a2a3a' : cc.d });
}

function drawCatchMoth(c, m) {
  var h = viewH, s = h * 0.06, fl = Math.sin(m.flap) * 0.35;
  artGlow(c, m.x, m.y, s * 2.2, '#2a1040', 0.5);
  c.fillStyle = '#3a2a5a';
  c.beginPath(); c.ellipse(m.x - s * 0.7, m.y - s * 0.1, s * 0.8, s * (0.55 + fl * 0.3), -0.6 + fl, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(m.x + s * 0.7, m.y - s * 0.1, s * 0.8, s * (0.55 + fl * 0.3), 0.6 - fl, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#5a3a8a';
  c.beginPath(); c.arc(m.x - s * 0.8, m.y - s * 0.15, s * 0.22, 0, Math.PI * 2); c.arc(m.x + s * 0.8, m.y - s * 0.15, s * 0.22, 0, Math.PI * 2); c.fill();
  artBlob(c, m.x, m.y, s * 0.28, s * 0.55, '#241838', { lineColor: '#0e0818' });
  artGlow(c, m.x - s * 0.1, m.y - s * 0.35, s * 0.25, '#ff5f7e', 0.8);
  artGlow(c, m.x + s * 0.1, m.y - s * 0.35, s * 0.25, '#ff5f7e', 0.8);
  c.fillStyle = '#ff8aa0';
  c.beginPath(); c.arc(m.x - s * 0.1, m.y - s * 0.35, s * 0.06, 0, Math.PI * 2); c.arc(m.x + s * 0.1, m.y - s * 0.35, s * 0.06, 0, Math.PI * 2); c.fill();
}

function drawCatchJar(c) {
  var jar = catchJar(), s = jar.s, sh = ctch.jarShake > 0 ? Math.sin(globalT * 50) * s * 0.04 : 0, x = jar.x + sh, y = jar.y, i, sl, done;
  // Prinsessa pitää purkkia
  drawPrincessFree(c, x - s * 0.9, y, viewH / 560, 1, 0, false, globalT);
  var fill = ctch.slots.length ? ctch.got / ctch.slots.length : 0;
  artGlow(c, x, y - s * 0.55, s * (0.8 + fill * 0.8), '#fff6a0', 0.25 + fill * 0.4);
  c.fillStyle = 'rgba(210,240,255,0.28)';
  roundRect(c, x - s * 0.62, y - s * 1.05, s * 1.24, s * 1.05, s * 0.2);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, s * 0.04);
  c.stroke();
  artRoundRect(c, x - s * 0.5, y - s * 1.18, s * 1.0, s * 0.16, s * 0.05, '#c98b4a', { lineColor: '#8a5a30' });
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(x - s * 0.5, y - s * 0.95, s * 0.08, s * 0.7);
  // Paikat: tyhjä paikka näyttää haettavan värin, täytetty loistaa
  for (i = 0; i < ctch.slots.length; i++) {
    sl = catchSlotPos(i);
    done = i < ctch.got && !ctch.flying.some(function (f) { return f.slot === i; });
    var cc = CATCH_COLORS[ctch.slots[i]];
    if (done) {
      drawCatchFireflyAt(c, sl.x + sh, sl.y, ctch.slots[i], viewH * 0.016, false, globalT + i);
    } else {
      c.strokeStyle = cc.c;
      c.lineWidth = Math.max(2, s * 0.035);
      c.setLineDash([s * 0.05, s * 0.04]);
      c.beginPath(); c.arc(sl.x + sh, sl.y, s * 0.13, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      // Seuraava haettava paikka sykkii
      if (i === ctch.got && ctch.state === 'play') {
        artGlow(c, sl.x + sh, sl.y, s * 0.35, cc.c, 0.4 + Math.sin(globalT * 6) * 0.2);
      }
    }
  }
}

function drawCatch() {
  var c = ctx, h = viewH, i, f, a, p;
  if (!beginPlayWorld()) return;
  drawCatchJar(c);
  for (i = 0; i < ctch.flies.length; i++) {
    f = ctch.flies[i];
    c.globalAlpha = f.scare > 0 ? 0.6 : 1;
    drawCatchFireflyAt(c, f.x, f.y, f.col, h * 0.022, f.dark, globalT + i);
    c.globalAlpha = 1;
  }
  for (i = 0; i < ctch.moths.length; i++) drawCatchMoth(c, ctch.moths[i]);
  for (i = 0; i < ctch.flying.length; i++) drawCatchFireflyAt(c, ctch.flying[i].x, ctch.flying[i].y, ctch.flying[i].col, h * 0.022, false, globalT);
  // Haavin hohtava jälki
  if (ctch.trail.length > 1) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (i = 1; i < ctch.trail.length; i++) {
      a = 1 - (globalT - ctch.trail[i].t) / 0.22;
      c.strokeStyle = 'rgba(200,255,250,' + Math.max(0, a * 0.8) + ')';
      c.lineWidth = h * 0.02 * Math.max(0.2, a);
      c.beginPath(); c.moveTo(ctch.trail[i - 1].x, ctch.trail[i - 1].y); c.lineTo(ctch.trail[i].x, ctch.trail[i].y); c.stroke();
    }
    p = ctch.trail[ctch.trail.length - 1];
    artGlow(c, p.x, p.y, h * 0.05, '#c8fff4', 0.6);
  }
  if (ctch.netBroken > 0 && holding) {
    c.strokeStyle = 'rgba(255,120,140,0.8)';
    c.lineWidth = h * 0.006;
    c.beginPath(); c.arc(lastPX, lastPY, h * 0.03, 0, Math.PI * 2); c.stroke();
  }
  // Vihje: käsi sipaisee kaaren tarvittavan värisen tulikärpäsen kautta
  if (!ctch.swiped && ctch.state === 'play' && ctch.hintT > 1.0) {
    var need = catchNeed(), tg = null;
    for (i = 0; i < ctch.flies.length; i++) if (ctch.flies[i].col === need && !ctch.flies[i].dark) { tg = ctch.flies[i]; break; }
    if (tg) {
      var k = (ctch.hintT % 1.6) / 1.6;
      drawHand(c, tg.x - h * 0.15 + k * h * 0.3, tg.y + h * 0.04 + Math.sin(k * Math.PI) * -h * 0.05, h * 0.035);
    }
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawCatchHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: kierrokset tulikärpäsinä (täytetty = läpäisty)
function drawCatchHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = CATCH_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, left, pad * 0.5, hs * 3 * n + pad, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    c.globalAlpha = i < ctch.round || ctch.state === 'won' ? 1 : (i === ctch.round ? 0.7 : 0.25);
    drawCatchFireflyAt(c, left + pad * 0.5 + hs * 1.5 + i * hs * 3, pad * 0.5 + hs * 1.9, i % 3, hs * 0.6, i > ctch.round, globalT + i);
    c.globalAlpha = 1;
  }
}

HUB_ICONS.catch = function (c, x, y, s) {
  c.fillStyle = 'rgba(210,240,255,0.45)';
  roundRect(c, x - s * 0.12, y - s * 0.1, s * 0.24, s * 0.24, s * 0.05);
  c.fill();
  artRoundRect(c, x - s * 0.1, y - s * 0.14, s * 0.2, s * 0.05, s * 0.02, '#c98b4a', { line: false });
  drawCatchFireflyAt(c, x - s * 0.04, y + s * 0.03, 0, s * 0.03, false, 0);
  drawCatchFireflyAt(c, x + s * 0.05, y - s * 0.01, 1, s * 0.03, false, 1);
  drawCatchFireflyAt(c, x + s * 0.16, y - s * 0.2, 2, s * 0.03, false, 2);
};
