'use strict';

// Pupupaimen: kolme pupua seuraa yksisarvista niityllä. Pöllön huuto pelästyttää
// lähellä olevat puput pensaisiin piiloon; piiloutunut pupu kootaan napauttamalla.
// Kaikki kolme viedään pupukoloon. Ei sydämiä: kiireetön hoivakenttä.
// Pensaat, kolo ja kyltti ovat tökättäviä koristeita (props.js); pöllöt ja
// seuraavat puput reagoivat napautukseen vain kosmeettisesti.

var HERD_N = 3;
var herdBunnies = [];
var herdBushes = [];
var herdOwls = [];
var herdBurrow = { fx: 0.95, x: 0 };
var herdBushDefs = [0.12, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.86];
var herdOwlDefs = [{ fx: 0.30 }, { fx: 0.58 }, { fx: 0.80 }];
var herdStartDefs = [{ fx: 0.06, fy: 0.25 }, { fx: 0.10, fy: 0.75 }, { fx: 0.14, fy: 0.5 }];
var HERD_OWL = '#8a6a44';
var HERD_OWL_LINE = '#4a3320';

function herdPathY(f) {
  return groundTop + (groundBottom - groundTop) * f;
}

function layoutHerd() {
  var i;
  herdBushes = [];
  for (i = 0; i < herdBushDefs.length; i++) herdBushes.push({ x: herdBushDefs[i] * worldW, y: groundTop - viewH * 0.01 });
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].px = herdOwlDefs[i].fx * worldW; herdOwls[i].py = viewH * 0.3; }
  herdBurrow.x = herdBurrow.fx * worldW;
}

function initHerd() {
  var i;
  tasks = [makeTask(0.36, 'word', { maxSyl: 2 }), makeTask(0.70, 'count')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  herdOwls = [];
  for (i = 0; i < herdOwlDefs.length; i++) herdOwls.push({ px: 0, py: 0, x: 0, y: 0, state: 'sleep', timer: 4 + i * 1.5, diveT: 0, tx: 0, ty: 0, scared: false, pokeT: -1 });
  layoutHerd();
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].x = herdOwls[i].px; herdOwls[i].y = herdOwls[i].py; }
  herdBunnies = [];
  for (i = 0; i < HERD_N; i++) {
    herdBunnies.push({ x: herdStartDefs[i].fx * worldW, y: herdPathY(herdStartDefs[i].fy), tx: 0, ty: 0, state: 'free', hop: 0, earT: i, idleT: 1 + i, bush: -1, facing: 1 });
    herdBunnies[i].tx = herdBunnies[i].x; herdBunnies[i].ty = herdBunnies[i].y;
  }
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = herdPathY(0.5);
  unicorn.facing = 1;
  unicorn.moving = false;
  herdSetupProps();
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnHerd() {}

function resizeHerd(ratio) {
  var i;
  layoutHerd();
  for (i = 0; i < herdBunnies.length; i++) { herdBunnies[i].x *= ratio; herdBunnies[i].tx *= ratio; }
  for (i = 0; i < herdOwls.length; i++) { herdOwls[i].x *= ratio; herdOwls[i].tx *= ratio; }
  herdSetupProps();
}

function herdHomeCount() {
  var i, n = 0;
  for (i = 0; i < herdBunnies.length; i++) if (herdBunnies[i].state === 'home') n++;
  return n;
}

function herdNearestBush(x) {
  var i, best = 0, bd = 1e9;
  for (i = 0; i < herdBushes.length; i++) {
    var d = Math.abs(herdBushes[i].x - x);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

// Pupu pelästyy: juoksee lähimpään pensaaseen piiloon
function herdScare(b) {
  b.state = 'hiding';
  b.bush = herdNearestBush(b.x + (Math.random() - 0.5) * viewW * 0.2);
  b.tx = herdBushes[b.bush].x;
  b.ty = groundTop + viewH * 0.02;
  b.hop = 1;
  spawnSparkles(b.x, b.y - viewH * 0.1, 6, '#ffffff');
}

function herdRejoin(b) {
  b.state = 'follow';
  b.hop = 1;
  spawnSparkles(b.x, b.y - viewH * 0.12, 12, '#ff7bac');
  playNote(988, 0, 0.1, 'sine', 0.3);
  playNote(1319, 0.08, 0.15, 'sine', 0.3);
}

// ---------- Koristeet ja kosmeettiset reaktiot ----------
// Pensaat, pupukolo ja kyltti piirretään joka ruudulla (props.js), jotta ne
// heilahtavat napautuksesta. Paikat ovat samat kuin ennen taustakuvassa.
function herdSetupProps() {
  var i, h = viewH, s = h * 0.1;
  propsReset();
  for (i = 0; i < herdBushes.length; i++) {
    propAdd({ x: herdBushes[i].x, y: herdBushes[i].y, r: h * 0.11, hy: h * 0.05, color: '#ff7bac', amp: 0.1, note: 520 + (i % 4) * 40,
      draw: herdDrawBushProp, poke: herdPokeBush });
  }
  propAdd({ x: herdBurrow.x, y: groundTop + h * 0.02, r: s * 1.1, hy: s * 0.35, color: '#e8c9a0', amp: 0.03, note: 330, peek: -1,
    draw: herdDrawBurrow, poke: herdPokeBurrow, update: herdUpdateBurrow });
  propAdd({ x: herdBurrow.x + s * 1.25, y: groundTop, r: s * 0.6, hy: s * 1.15, color: '#fff6c8', note: 740,
    draw: herdDrawSign });
}

function herdDrawBushProp(c, p) {
  drawBush(c, 0, 0, viewH * 0.09);
}
// Pensas rapisee ja pudottaa pari kukkaa
function herdPokeBush(p) {
  var h = viewH;
  propDropBall(p.x - h * 0.03, p.y - h * 0.12, h * 0.011, '#ff7bac', p.y + h * 0.01, -viewW * 0.03);
  propDropBall(p.x + h * 0.04, p.y - h * 0.09, h * 0.011, '#ff7bac', p.y + h * 0.01, viewW * 0.03);
}

// Pupukolo: kumpu ja kolo. Kolmannella tökkäyksellä kolosta kurkistaa pupu (yllätys).
function herdDrawBurrow(c, p) {
  var s = viewH * 0.1, k;
  artShadow(c, 0, s * 0.08, s * 1.15, s * 0.22, 0.14);
  c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI, 0); c.closePath();
  artFillPath(c, '#8a6a44', -s * 0.95, 0, s * 0.95, { lineColor: '#4a3320' });
  artHighlight(c, -s * 0.38, -s * 0.6, s * 0.28, s * 0.12, 0.22);
  c.beginPath(); c.arc(0, 0, s * 0.62, Math.PI, 0); c.closePath();
  artFillPath(c, '#3a2a1a', -s * 0.62, 0, s * 0.62, { shadeTo: '#1e140c', lineColor: '#2a1c10' });
  if (p.peek >= 0) {
    k = p.peek < 0.4 ? easeOutBack(p.peek / 0.4) : (p.peek > 1.6 ? Math.max(0, 1 - (p.peek - 1.6) / 0.4) : 1);
    c.save();
    c.beginPath(); c.rect(-s, -s * 3, s * 2, s * 3); c.clip();
    drawBunny(c, 0, s * 0.6 - k * s * 0.9, s * 0.42, 0, p.peek * 4, true);
    c.restore();
  }
}
function herdUpdateBurrow(p, dt) {
  if (p.peek >= 0) {
    p.peek += dt;
    if (p.peek > 2.0) p.peek = -1;
  }
}
function herdPokeBurrow(p) {
  if (p.n % 3 === 0 && p.peek < 0) {
    p.peek = 0;
    soundBunny();
  }
}

// Kyltti kolon vieressä: tolppa, laatta ja pupun kuva
function herdDrawSign(c, p) {
  var s = viewH * 0.1;
  artShadow(c, 0, s * 0.03, s * 0.3, s * 0.07, 0.14);
  artLimb(c, 0, 0, 0, -s * 1.0, s * 0.1, '#c98b4a', '#6b4520');
  artRoundRect(c, -s * 0.35, -s * 1.4, s * 0.7, s * 0.4, s * 0.08, '#fff6c8', { lineColor: '#b89a5a', shadeTo: '#f0dca8' });
  drawBunny(c, 0, -s * 1.05, s * 0.16, 0, 0, true);
}

// Pöllö: oksalla nukkuva (tai huhuileva, syöksyvä) pöllö tarrakirjan ilmeellä.
// Tökkäys räpäyttää silmät auki hetkeksi; tila ei muutu.
function herdDrawOwl(c, o) {
  var x = o.x - camX, y = o.y, s = viewH * 0.045;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var awake = o.state !== 'sleep', pk = o.pokeT, lo = { lineColor: HERD_OWL_LINE };
  var eyesOpen = awake, blink = false, big = 1;
  if (pk >= 0) {
    if (pk < 0.22) { blink = true; eyesOpen = true; } else if (pk < 1.2) { eyesOpen = true; big = 1.12; }
  }
  if (o.state !== 'dive') artLimb(c, x - s * 1.6, y + s * 1.05, x + s * 1.6, y + s * 0.95, s * 0.2, '#6b4a2a', '#3a2a1a');
  c.save();
  c.translate(x, y);
  if (pk >= 0) c.rotate(Math.sin(pk * 18) * Math.exp(-pk * 3.5) * 0.12);
  if (o.state === 'dive') {
    c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(-s * 1.9, -s * 0.8); c.lineTo(-s * 0.6, s * 0.5); c.closePath();
    artFillPath(c, '#6b4a2a', -s * 0.8, s * 0.5, s * 0.5, lo);
    c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(s * 1.9, -s * 0.8); c.lineTo(s * 0.6, s * 0.5); c.closePath();
    artFillPath(c, '#6b4a2a', -s * 0.8, s * 0.5, s * 0.5, lo);
  }
  // Korvatupsut
  c.beginPath(); c.moveTo(-s * 0.6, -s * 0.6); c.lineTo(-s * 0.4, -s * 1.15); c.lineTo(-s * 0.1, -s * 0.7); c.closePath();
  artFillPath(c, HERD_OWL, -s * 1.15, -s * 0.6, s * 0.3, lo);
  c.beginPath(); c.moveTo(s * 0.6, -s * 0.6); c.lineTo(s * 0.4, -s * 1.15); c.lineTo(s * 0.1, -s * 0.7); c.closePath();
  artFillPath(c, HERD_OWL, -s * 1.15, -s * 0.6, s * 0.3, lo);
  // Vartalo ja maha
  artBlob(c, 0, 0, s * 0.75, s, HERD_OWL, { lineColor: HERD_OWL_LINE, hi: 0.25 });
  artBlob(c, 0, s * 0.25, s * 0.45, s * 0.6, '#c9a97a', { line: false });
  // Silmät
  if (eyesOpen && !blink) {
    var glow = o.state === 'hoot' ? 0.6 + Math.sin(globalT * 16) * 0.4 : 1;
    artCircle(c, -s * 0.3, -s * 0.35, s * 0.3 * big, '#ffe678', { lineColor: '#b8862e', alpha: glow });
    artCircle(c, s * 0.3, -s * 0.35, s * 0.3 * big, '#ffe678', { lineColor: '#b8862e', alpha: glow });
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.13 * big, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.13 * big, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(-s * 0.35, -s * 0.42, s * 0.05, 0, Math.PI * 2); c.arc(s * 0.25, -s * 0.42, s * 0.05, 0, Math.PI * 2); c.fill();
  } else {
    c.strokeStyle = '#3a2a1a';
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.lineCap = 'round';
    c.beginPath(); c.arc(-s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(s * 0.3, -s * 0.35, s * 0.25, 0.2, Math.PI - 0.2); c.stroke();
  }
  // Nokka
  c.beginPath(); c.moveTo(-s * 0.12, -s * 0.1); c.lineTo(s * 0.12, -s * 0.1); c.lineTo(0, s * 0.12); c.closePath();
  artFillPath(c, '#ffb84f', -s * 0.1, s * 0.12, s * 0.12, { lineColor: '#b8701a' });
  c.restore();
}
function herdPokeOwl(o) {
  var s = viewH * 0.045;
  o.pokeT = 0;
  spawnSparkles(o.x, o.y - s, 5, '#ffe9a0');
  artPop(o.x, o.y, s * 1.2, '#ffe9a0', 'ring');
  playNote(294, 0, 0.18, 'sine', 0.2);
  playNote(247, 0.16, 0.22, 'sine', 0.18);
}
// Seuraava pupu hypähtää ja vikisee napautuksesta (ei vaikuta peliin)
function herdPokeBunny(b) {
  b.hop = 1;
  spawnSparkles(b.x, b.y - viewH * 0.08, 6, '#ff9fd0');
  artPop(b.x, b.y - viewH * 0.05, viewH * 0.04, '#ff9fd0', 'ring');
  playNote(1300, 0, 0.08, 'sine', 0.25);
  playNote(1600, 0.07, 0.1, 'sine', 0.2);
}

function handleHerdTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, b, o, dx, dy;
  for (i = 0; i < herdBunnies.length; i++) {
    b = herdBunnies[i];
    if (b.state !== 'hiding' && b.state !== 'free') continue;
    dx = wx - b.x;
    dy = py - (b.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      herdRejoin(b);
      return;
    }
  }
  // Kosmeettiset reaktiot: seuraava pupu hypähtää, pöllö räpäyttää, koriste heilahtaa
  for (i = 0; i < herdBunnies.length; i++) {
    b = herdBunnies[i];
    if (b.state !== 'follow') continue;
    dx = wx - b.x;
    dy = py - (b.y - viewH * 0.06);
    if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) { herdPokeBunny(b); break; }
  }
  for (i = 0; i < herdOwls.length; i++) {
    o = herdOwls[i];
    if (o.state === 'dive') continue;
    dx = wx - o.x;
    dy = py - o.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) { herdPokeOwl(o); break; }
  }
  propsTap(wx, py);
  setWalkTarget(px, py);
}

function updateHerd(dt) {
  var i, dx, dy, dist, step, b, o;
  updateTasks(dt);
  var busy = puzzleBusy();

  dx = unicorn.tx - unicorn.x;
  dy = unicorn.ty - unicorn.y;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !busy) {
    unicorn.moving = true;
    step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 10;
    if (Math.random() < dt * 8) spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 6, 1, '#fff3c8');
  } else {
    unicorn.moving = false;
  }
  followCam(unicorn.x, dt);

  // Pöllöt: uni -> huhuilu -> syöksy; syöksy ei satuta, mutta pelästyttää puput lähellä
  for (i = 0; i < herdOwls.length; i++) {
    o = herdOwls[i];
    if (o.pokeT >= 0) { o.pokeT += dt; if (o.pokeT > 1.4) o.pokeT = -1; }
    if (busy || celebrating) continue;
    if (o.state === 'sleep') {
      o.timer -= dt;
      if (o.timer <= 0) {
        if (Math.abs(unicorn.x - o.px) < viewW * 0.4) {
          o.state = 'hoot';
          o.timer = 1.2;
          playNote(294, 0, 0.25, 'sine', 0.3);
          playNote(247, 0.3, 0.35, 'sine', 0.3);
        } else o.timer = 1.2;
      }
    } else if (o.state === 'hoot') {
      o.timer -= dt;
      if (o.timer <= 0) {
        o.state = 'dive';
        o.diveT = 0;
        o.scared = false;
        o.tx = unicorn.x;
        o.ty = unicorn.y - viewH * 0.06;
        playNote(880, 0, 0.3, 'sawtooth', 0.08);
      }
    } else if (o.state === 'dive') {
      o.diveT += dt * 1.3;
      var s = o.diveT < 1 ? Math.sin(o.diveT * Math.PI / 2) : Math.sin(Math.max(0, 2 - o.diveT) * Math.PI / 2);
      o.x = o.px + (o.tx - o.px) * s;
      o.y = o.py + (o.ty - o.py) * s;
      if (!o.scared && o.diveT > 0.8) {
        o.scared = true;
        var k, n = 0;
        for (k = 0; k < herdBunnies.length; k++) {
          b = herdBunnies[k];
          if (b.state === 'follow' && Math.abs(b.x - o.tx) < viewW * 0.35) { herdScare(b); n++; }
        }
        if (n > 0) { playNote(1500, 0, 0.08, 'sine', 0.25); playNote(1200, 0.08, 0.1, 'sine', 0.25); }
      }
      if (o.diveT >= 2) {
        o.state = 'sleep';
        o.x = o.px; o.y = o.py;
        o.timer = 5 + Math.random() * 3;
      }
    }
  }

  // Puput
  var slot = 0;
  for (i = 0; i < herdBunnies.length; i++) {
    b = herdBunnies[i];
    b.earT += dt * 3;
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt * 2.5);
    if (b.state === 'home') continue;
    if (b.state === 'free') {
      b.idleT -= dt;
      if (b.idleT <= 0) { b.idleT = 1.5 + Math.random() * 2; b.hop = 1; }
      dx = unicorn.x - b.x; dy = unicorn.y - b.y;
      if (dx * dx + dy * dy < viewW * 0.12 * viewW * 0.12) herdRejoin(b);
      continue;
    }
    if (b.state === 'follow') {
      b.tx = unicorn.x - unicorn.facing * viewW * (0.07 + slot * 0.05);
      b.ty = Math.min(Math.max(unicorn.y + (slot - 1) * viewH * 0.035, groundTop), groundBottom);
      slot++;
      // Kolo: seuraaja hyppää sisään perillä
      if (Math.abs(unicorn.x - herdBurrow.x) < viewW * 0.1 && Math.abs(b.x - herdBurrow.x) < viewW * 0.16) {
        b.state = 'home';
        spawnSparkles(b.x, b.y - viewH * 0.08, 14, '#ffe27a');
        playNote(880 + herdHomeCount() * 120, 0, 0.2, 'sine', 0.35);
        playNote(1320 + herdHomeCount() * 120, 0.1, 0.3, 'sine', 0.3);
        if (herdHomeCount() === herdBunnies.length) startCelebration();
        continue;
      }
    }
    dx = b.tx - b.x; dy = b.ty - b.y;
    dist = Math.sqrt(dx * dx + dy * dy);
    var sp = (b.state === 'hiding' ? viewW * 0.4 : viewW * 0.26) * dt;
    if (dist > 6 && !busy && !celebrating) {
      if (sp > dist) sp = dist;
      b.x += (dx / dist) * sp;
      b.y += (dy / dist) * sp;
      if (Math.abs(dx) > 4) b.facing = dx > 0 ? 1 : -1;
      b.hop = Math.abs(Math.sin(globalT * 9 + i));
    }
  }

  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function herdLayers() {
  return [
    { speed: 0.22, render: renderHerdFar },
    { speed: 0.55, render: renderHerdMid },
    { speed: 1, render: renderHerdNear }
  ];
}
function renderHerdBg(b, w, h) {
  renderHerdFar(b, w, h);
  renderHerdMid(b, w, h);
  renderHerdNear(b, w, h);
}
function renderHerdFar(b, w, h) { meadowFar(b, w, h, '#7ec8ff', '#c8ecff', '#c8e8b8'); }
function renderHerdMid(b, w, h) { meadowMid(b, w, h, '#a7dd8f'); }
// Lähin kerros: nurmi ja kukat. Pensaat, kolo ja kyltti ovat koristeita (herdSetupProps).
function renderHerdNear(b, w, h) {
  var i, x;
  meadowNearGrass(b, w, h);
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
  }
}

function drawHerdBunny(c, b) {
  var x = b.x - camX, y = b.y, s = viewH * 0.04;
  if (x < -s * 4 || x > viewW + s * 4) return;
  if (b.state === 'hiding' && Math.abs(b.x - b.tx) < 8) {
    // Piilossa pensaan takana: korvat ja huutomerkki näkyvät
    var bob = Math.sin(globalT * 3) * s * 0.1;
    drawBunny(c, x, y - viewH * 0.02, s * 0.8, 0, b.earT, true);
    artRoundRect(c, x - s * 0.09, y - s * 2.45 - bob, s * 0.18, s * 0.55, s * 0.09, '#ff5f7e', { lineColor: '#a8243f' });
    artCircle(c, x, y - s * 1.75 - bob, s * 0.11, '#ff5f7e', { lineColor: '#a8243f' });
    return;
  }
  drawBunny(c, x, y, s, b.hop * viewH * 0.025, b.earT, false);
  if (b.state === 'follow') drawHeartShape(c, x, y - s * 2.3 + Math.sin(globalT * 3) * s * 0.1, s * 0.14, true);
}

function drawHerd() {
  var i, order = [];
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  for (i = 0; i < herdOwls.length; i++) if (herdOwls[i].state !== 'dive') herdDrawOwl(ctx, herdOwls[i]);
  // Puput ja yksisarvinen syvyysjärjestyksessä
  for (i = 0; i < herdBunnies.length; i++) if (herdBunnies[i].state !== 'home') order.push({ y: herdBunnies[i].y, b: herdBunnies[i] });
  order.push({ y: unicorn.y, u: true });
  order.sort(function (a, b) { return a.y - b.y; });
  var us = viewH / 800;
  for (i = 0; i < order.length; i++) {
    if (order[i].u) drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
    else drawHerdBunny(ctx, order[i].b);
  }
  for (i = 0; i < herdOwls.length; i++) if (herdOwls[i].state === 'dive') herdDrawOwl(ctx, herdOwls[i]);
  drawParticlesLayer(ctx);
  // Nuoli: piilossa olevaan pupuun tai koloon
  if (!celebrating) {
    var hid = null, allFollow = true;
    for (i = 0; i < herdBunnies.length; i++) {
      if (herdBunnies[i].state === 'hiding' || herdBunnies[i].state === 'free') { allFollow = false; if (!hid) hid = herdBunnies[i]; }
    }
    if (hid) drawEdgeArrow(ctx, hid.x);
    else if (allFollow && herdHomeCount() < herdBunnies.length) drawEdgeArrow(ctx, herdBurrow.x);
  }
  endPlayWorld();
  drawPickupHud(ctx, HERD_N, function (i2) { return herdBunnies[i2] && herdBunnies[i2].state === 'home'; },
    function (c, x, y, s2) { drawBunny(c, x, y + s2 * 0.3, s2 * 0.9, 0, 0, true); });
  drawTaskOverlay(ctx);
}
