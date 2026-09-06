'use strict';

// Kirjainniitty: Kirjainsaaren ensimmäinen kenttä. Ratsastus niityllä, jolla
// leijuu kirjaimia. Ylhäällä näkyy sana tavutettuna; napauta niityn kirjaimia
// sanan järjestyksessä (seuraava kirjain hehkuu sanassa). Väärä kirjain heilahtaa.
// Kolme sanaa kolmella alueella; valmis sana luetaan ja sen kuva paljastuu.
// Ei sydämiä: rauhallinen lukukenttä.

var LF_ZONES = [[0.05, 0.28], [0.36, 0.60], [0.68, 0.92]];
var lf = { words: [], letters: [], cur: 0, gate: { fx: 0.965, x: 0, open: false }, sayT: -1, sayWord: -1, bunnies: [] };

function lfPickWords() {
  var pool = [], i, n;
  for (i = 0; i < WORD_LIST.length; i++) {
    n = WORD_LIST[i].w.replace(/-/g, '').length;
    if (n >= 3 && n <= 5) pool.push(WORD_LIST[i]);
  }
  var picks = pickDistinct(pool, 3);
  // Helpoin (lyhin) ensin
  picks.sort(function (a, b) { return a.w.replace(/-/g, '').length - b.w.replace(/-/g, '').length; });
  lf.words = [];
  for (i = 0; i < picks.length; i++) {
    lf.words.push({ w: picks[i].w, icon: picks[i].icon, letters: picks[i].w.replace(/-/g, '').split(''), next: 0, done: false });
  }
}

// Kirjaimet alueelle: sanan kirjaimet + 2 hämäystä sekaisin, tasavälein ja korkeus vaihtelee
function lfLayoutLetters() {
  var i, k, word, zone, chars, n, extra, ch;
  lf.letters = [];
  for (i = 0; i < lf.words.length; i++) {
    word = lf.words[i];
    zone = LF_ZONES[i];
    chars = [];
    for (k = 0; k < word.letters.length; k++) chars.push({ ch: word.letters[k], distract: false });
    extra = 0;
    while (extra < 2) {
      ch = RAP_ALPHABET.charAt(randInt(RAP_ALPHABET.length));
      if (word.letters.indexOf(ch) >= 0) continue;
      chars.push({ ch: ch, distract: true });
      extra++;
    }
    chars = shuffleNums(chars);
    n = chars.length;
    for (k = 0; k < n; k++) {
      lf.letters.push({
        ch: chars[k].ch, distract: chars[k].distract, word: i,
        fx: zone[0] + (zone[1] - zone[0]) * (k + 0.5) / n,
        fy: 0.14 + ((k * 7) % 3) * 0.11,
        collected: false, wob: 0, phase: Math.random() * Math.PI * 2, flyT: -1
      });
    }
  }
}

function lfLetterPos(l) {
  return { x: l.fx * worldW + Math.sin(l.phase) * viewW * 0.008, y: groundTop - l.fy * viewH + Math.cos(l.phase * 1.3) * viewH * 0.012 };
}

function initLetterfield() {
  var i;
  level = 27;
  celebrating = false;
  celebrateT = 0;
  particles = [];
  confetti = [];
  sparks = [];
  holding = false;
  camX = 0;
  gates = [];
  activeGate = null;
  activeTask = null;
  tasks = [makeTask(0.325, 'wordpick', { maxSyl: 2 }), makeTask(0.645, 'word', { maxSyl: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = tasks[i].fx * worldW;
  lfPickWords();
  lfLayoutLetters();
  lf.cur = 0;
  lf.gate.open = false;
  lf.gate.x = lf.gate.fx * worldW;
  lf.sayT = -1;
  lf.sayWord = -1;
  lf.bunnies = [];
  for (i = 0; i < 3; i++) lf.bunnies.push({ fx: LF_ZONES[i][1] + 0.02, hop: 0, earT: i });
  unicorn.speed = 265;
  unicorn.x = unicorn.tx = viewW * 0.04;
  unicorn.y = unicorn.ty = (groundTop + groundBottom) / 2;
  unicorn.facing = 1;
  unicorn.moving = false;
  document.body.style.background = '#d9f3ff';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.35);
  playNote(659, 0.12, 0.3, 'triangle', 0.3);
}

function respawnLetterfield() {}
function resizeLetterfield() { lf.gate.x = lf.gate.fx * worldW; }

function lfNeeded() {
  var w = lf.words[lf.cur];
  return w && !w.done ? w.letters[w.next] : null;
}

function lfCollect(l) {
  var w = lf.words[l.word], k;
  l.collected = true;
  l.flyT = 0;
  w.next++;
  playNote(523 + w.next * 60, 0, 0.25, 'triangle', 0.35);
  var p = lfLetterPos(l);
  spawnSparkles(p.x, p.y, 12, '#ffe27a');
  if (w.next >= w.letters.length) {
    w.done = true;
    lf.sayT = 0;
    lf.sayWord = l.word;
    var syl = w.w.split('-');
    for (k = 0; k < syl.length; k++) playNote(392 + k * 70, 0.4 + k * WORD_SYL_T, 0.32, 'triangle', 0.3);
    playNote(1047, 0.4 + syl.length * WORD_SYL_T, 0.5, 'triangle', 0.4);
    lf.bunnies[l.word].hop = 1;
    lf.cur++;
    if (lf.cur >= lf.words.length) {
      lf.gate.open = true;
      playNote(523, 1.6, 0.3, 'triangle', 0.4);
      playNote(659, 1.75, 0.3, 'triangle', 0.4);
      playNote(784, 1.9, 0.5, 'triangle', 0.4);
    }
  }
}

function handleLetterfieldTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX, i, l, p, dx, dy, need = lfNeeded();
  for (i = 0; i < lf.letters.length; i++) {
    l = lf.letters[i];
    if (l.collected) continue;
    p = lfLetterPos(l);
    dx = wx - p.x;
    dy = py - p.y;
    if (dx * dx + dy * dy < viewH * 0.06 * viewH * 0.06) {
      if (need && l.word === lf.cur && l.ch === need) lfCollect(l);
      else {
        l.wob = 1;
        playNote(220, 0, 0.12, 'triangle', 0.2);
        spawnSparkles(p.x, p.y, 4, '#c9c4d8');
      }
      return;
    }
  }
  setWalkTarget(px, py);
}

function updateLetterfield(dt) {
  var i, dx, dy, dist, step, l;
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
  for (i = 0; i < lf.letters.length; i++) {
    l = lf.letters[i];
    l.phase += dt * 1.5;
    if (l.wob > 0) l.wob = Math.max(0, l.wob - dt * 2.5);
    if (l.flyT >= 0) { l.flyT += dt * 1.6; if (l.flyT > 1) l.flyT = 2; }
  }
  if (lf.sayT >= 0) {
    lf.sayT += dt;
    if (lf.sayT > 0.4 + lf.words[lf.sayWord].w.split('-').length * WORD_SYL_T + 0.6) lf.sayT = -1;
  }
  for (i = 0; i < lf.bunnies.length; i++) if (lf.bunnies[i].hop > 0) lf.bunnies[i].hop = Math.max(0, lf.bunnies[i].hop - dt * 1.5);
  if (lf.gate.open && !celebrating && Math.abs(unicorn.x - lf.gate.x) < viewH * 0.09) startCelebration();
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function renderLetterfieldBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, groundTop);
  sky.addColorStop(0, '#9fdcff');
  sky.addColorStop(1, '#eaf7ff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, groundTop + 2);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 9; i++) cloudShape(b, w * (0.05 + i * 0.11), h * (0.08 + (i % 3) * 0.06), h * 0.03);
  b.fillStyle = '#a7dd8f';
  for (i = 0; i < 10; i++) {
    x = w * (i / 9);
    b.beginPath(); b.arc(x, groundTop + h * 0.02, h * (0.12 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
  var grass = b.createLinearGradient(0, groundTop, 0, h);
  grass.addColorStop(0, '#8fd97a');
  grass.addColorStop(1, '#5fb356');
  b.fillStyle = grass;
  b.fillRect(0, groundTop, w, h - groundTop);
  b.fillStyle = 'rgba(255,240,180,0.45)';
  b.fillRect(0, groundTop + h * 0.02, w, groundBottom - groundTop - h * 0.02);
  for (i = 0; i < 40; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, groundBottom + h * 0.02 + ((i * 37) % Math.max(1, Math.round(h - groundBottom - h * 0.04))), h * 0.012, ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
  }
  // Kyltit alueiden alussa ja portti lopussa
  for (i = 0; i < LF_ZONES.length; i++) drawSignPost(b, LF_ZONES[i][0] * w - h * 0.03, groundTop + h * 0.01, h * 0.09, String(i + 1));
  drawMoonGateFrame(b, lf.gate.x, groundTop - h * 0.02, h);
}

function drawSignPost(c, x, baseY, s, txt) {
  c.fillStyle = '#8a5a30';
  c.fillRect(x - s * 0.06, baseY - s * 1.1, s * 0.12, s * 1.1);
  c.fillStyle = '#fff6d8';
  roundRect(c, x - s * 0.45, baseY - s * 1.6, s * 0.9, s * 0.55, s * 0.1);
  c.fill();
  c.fillStyle = '#8a2be2';
  readFont(c, s * 0.42);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(txt, x, baseY - s * 1.3);
  c.textBaseline = 'alphabetic';
}

function drawFieldLetter(c, l) {
  var p = lfLetterPos(l), x = p.x - camX, y = p.y, r = viewH * 0.042;
  if (x < -r * 3 || x > viewW + r * 3) return;
  if (l.wob > 0) x += Math.sin(globalT * 40) * r * 0.25 * l.wob;
  var active = l.word === lf.cur;
  c.fillStyle = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)';
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = active ? '#ffd24f' : 'rgba(200,190,220,0.8)';
  c.lineWidth = Math.max(2, r * 0.1);
  c.stroke();
  readFont(c, r * 1.3);
  c.fillStyle = active ? '#8a2be2' : 'rgba(138,43,226,0.5)';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(l.ch, x, y + r * 0.06);
  c.textBaseline = 'alphabetic';
}

// Kirjain lentää kerätessä sanan kohdalle
function drawFlyingLetter(c, l) {
  if (l.flyT < 0 || l.flyT > 1) return;
  var p = lfLetterPos(l), t = l.flyT, r = viewH * 0.035;
  var x = (p.x - camX) + (viewW / 2 - (p.x - camX)) * t, y = p.y + (viewH * 0.075 - p.y) * t - Math.sin(t * Math.PI) * viewH * 0.1;
  c.globalAlpha = 1 - t * 0.5;
  readFont(c, r * 1.4);
  c.fillStyle = '#ff5f7e';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(l.ch, x, y);
  c.textBaseline = 'alphabetic';
  c.globalAlpha = 1;
}

// Sana-HUD: sana tavutettuna, kerätyt kirjaimet värillisinä, seuraava hehkuu
function drawLfWordHud(c) {
  var wi = lf.sayT >= 0 ? lf.sayWord : Math.min(lf.cur, lf.words.length - 1);
  var w = lf.words[wi], syl = w.w.split('-'), h = viewH * 0.085, i, k, x, li = 0;
  readFont(c, h * 0.62);
  var total = c.measureText(w.w).width, bw = total + h * 1.6 + h * 1.1, bx = viewW / 2, by = viewH * 0.075;
  var sayIdx = lf.sayT >= 0 ? Math.floor((lf.sayT - 0.4) / WORD_SYL_T) : -1;
  c.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(c, bx - bw / 2, by - h / 2, bw, h, h * 0.4);
  c.fill();
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  x = bx - bw / 2 + h * 0.5;
  for (i = 0; i < syl.length; i++) {
    for (k = 0; k < syl[i].length; k++) {
      var ch = syl[i].charAt(k), cw = c.measureText(ch).width, done = li < w.next, isNext = li === w.next && !w.done;
      if (isNext) {
        var g = c.createRadialGradient(x + cw / 2, by, h * 0.05, x + cw / 2, by, h * 0.55);
        g.addColorStop(0, 'rgba(255,230,140,' + (0.6 + Math.sin(globalT * 5) * 0.25) + ')');
        g.addColorStop(1, 'rgba(255,230,140,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x + cw / 2, by, h * 0.55, 0, Math.PI * 2); c.fill();
      }
      readFont(c, h * 0.62);
      c.fillStyle = i === sayIdx && w.done ? '#ff5f7e' : (done ? '#ff5f7e' : (isNext ? '#8a2be2' : 'rgba(138,43,226,0.35)'));
      if (w.done && sayIdx >= 0) c.fillStyle = i === sayIdx ? '#ff5f7e' : '#8a2be2';
      c.fillText(ch, x, by + h * 0.03);
      x += cw;
      li++;
    }
    if (i < syl.length - 1) { c.fillStyle = '#c9a0ff'; c.fillText('-', x, by + h * 0.03); x += c.measureText('-').width; }
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  var ix = bx + bw / 2 - h * 0.6;
  c.fillStyle = w.done ? '#fff6d8' : 'rgba(200,190,220,0.5)';
  c.beginPath(); c.arc(ix, by, h * 0.42, 0, Math.PI * 2); c.fill();
  if (w.done) drawWordIcon(c, w.icon, ix, by, h * 0.42);
  else {
    c.fillStyle = '#8a2be2';
    readFont(c, h * 0.55);
    c.textBaseline = 'middle';
    c.fillText('?', ix, by + h * 0.03);
    c.textBaseline = 'alphabetic';
  }
}

function drawLetterfield() {
  var i, l;
  if (!drawWorldBg()) return;
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);
  drawMoonGateGlowAt(ctx, lf.gate.x, lf.gate.open);
  for (i = 0; i < lf.letters.length; i++) {
    l = lf.letters[i];
    if (!l.collected) drawFieldLetter(ctx, l);
  }
  // Puput alueiden lopussa: valmiin sanan kuva kyltissä
  for (i = 0; i < lf.bunnies.length; i++) {
    var bx = lf.bunnies[i].fx * worldW - camX, by = groundTop + viewH * 0.02, s = viewH * 0.045;
    if (bx < -s * 4 || bx > viewW + s * 4) continue;
    drawBunny(ctx, bx, by, s, Math.sin(lf.bunnies[i].hop * Math.PI * 3) * viewH * 0.03 * lf.bunnies[i].hop, globalT * 3 + i, false);
    if (lf.words[i].done) {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(bx, by - s * 3.2, s * 1.1, 0, Math.PI * 2); ctx.fill();
      drawWordIcon(ctx, lf.words[i].icon, bx, by - s * 3.2, s * 1.1);
    }
  }
  var us = viewH / 800;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  for (i = 0; i < lf.letters.length; i++) drawFlyingLetter(ctx, lf.letters[i]);
  drawParticlesLayer(ctx);
  // Nuoli seuraavaan tarvittavaan kirjaimeen tai porttiin
  if (!celebrating) {
    var need = lfNeeded(), tx = null;
    if (need) {
      for (i = 0; i < lf.letters.length; i++) {
        l = lf.letters[i];
        if (!l.collected && l.word === lf.cur && l.ch === need) { tx = lfLetterPos(l).x; break; }
      }
    } else if (lf.gate.open) tx = lf.gate.x;
    if (tx !== null) drawEdgeArrow(ctx, tx);
  }
  drawCelebrateLayer();
  drawLfWordHud(ctx);
  drawTaskOverlay(ctx);
}

// Portin hehku kirjainniityn ja sanapajan käyttöön (kuutamometsän kehyksellä)
function drawMoonGateGlowAt(c, gx, open) {
  var x = gx - camX, h = viewH, s = h * 0.12;
  if (x < -s * 3 || x > viewW + s * 3) return;
  var baseY = groundTop - h * 0.02;
  if (open) {
    var g = c.createLinearGradient(0, baseY - s * 2.2, 0, baseY);
    g.addColorStop(0, 'rgba(255,240,180,' + (0.75 + Math.sin(globalT * 4) * 0.15) + ')');
    g.addColorStop(1, 'rgba(200,220,255,0.5)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, baseY - s * 1.6, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, baseY); c.lineTo(x - s * 0.5, baseY); c.closePath(); c.fill();
    drawStar(c, x, baseY - s * 2.7, h * 0.035, globalT, 1);
  } else {
    c.fillStyle = 'rgba(60,80,120,0.6)';
    c.beginPath(); c.arc(x, baseY - s * 1.6, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, baseY); c.lineTo(x - s * 0.5, baseY); c.closePath(); c.fill();
  }
}
