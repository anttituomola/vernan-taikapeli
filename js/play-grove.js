'use strict';

// Kirjainpuutarha: kiireetön lukukenttä ilman sydämiä ja ilman liikkumista.
// Pensaissa kylpee kirjaimia; ylhäällä näkyy tavutettu sana ja sen kuva.
// Napauta pensasta, jossa on sanan seuraava kirjain —
// kirjain lentää sanaan ja pensaat sekoittuvat. Kolme sanaa.
// Tehtävät avautuvat sanojen valmistuessa (käsin, kuten Kaivoksessa).

var GROVE_WORDS = 3;
var GROVE_BUSHES = 6;
var grove = {
  words: [], wi: 0, next: 0, done: 0,
  letters: [], // pensaiden kirjaimet
  anims: [],   // liikkuvat kirjaimet {ch, x0, y0, x1, y1, t}
  wrongT: 0, wrongIdx: -1, sayT: -1, hudRect: null
};
var GROVE_DISTRACTORS = 'AEIOUYHKLMNPRSTV';

function groveBushPos(i) {
  return { x: viewW * (0.18 + (i % 3) * 0.32), y: viewH * (0.52 + Math.floor(i / 3) * 0.24) };
}

// Sanan kirjaimet ilman tavuviivoja
function groveLettersOf(w) {
  return w.w.replace(/-/g, '').split('');
}

// Pensaisiin: sanan jäljellä olevat kirjaimet + hämääjät, sekoitettuna
function groveDealLetters() {
  var need = groveLettersOf(grove.words[grove.wi]).slice(grove.next);
  var pool = need.slice(), k, ch, guard = 0;
  while (pool.length < GROVE_BUSHES && guard++ < 60) {
    ch = GROVE_DISTRACTORS[randInt(GROVE_DISTRACTORS.length)];
    if (need.indexOf(ch) >= 0 || pool.indexOf(ch) >= 0) continue;
    pool.push(ch);
  }
  while (pool.length < GROVE_BUSHES) pool.push(GROVE_DISTRACTORS[randInt(GROVE_DISTRACTORS.length)]);
  var order = shuffleNums(pool.map(function (_, i) { return i; }));
  grove.letters = [];
  for (k = 0; k < GROVE_BUSHES; k++) grove.letters.push(pool[order[k]]);
}

function grovePickWords() {
  var pool = wordsBySyl(1, 3).filter(function (w) { return w.w.replace(/-/g, '').length <= 5; });
  if (pool.length < GROVE_WORDS) pool = wordsBySyl(1, 3);
  grove.words = [];
  var idx = shuffleNums(pool.map(function (_, i) { return i; }));
  for (var i = 0; i < GROVE_WORDS; i++) grove.words.push(pool[idx[i]]);
}

function groveWordSay() {
  var syl = grove.words[grove.wi].w.split('-'), k;
  grove.sayT = 0;
  for (k = 0; k < syl.length; k++) playNote(392 + k * 70, k * WORD_SYL_T, 0.32, 'triangle', 0.3);
}

function initGrove() {
  var i;
  tasks = [makeTask(-5, 'letter'), makeTask(-5, 'wordpick', { maxSyl: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  grovePickWords();
  grove.wi = 0;
  grove.next = 0;
  grove.done = 0;
  grove.anims = [];
  grove.wrongT = 0;
  grove.wrongIdx = -1;
  groveDealLetters();
  groveWordSay();
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.92;
  princess.facing = 1;
  princess.walkPhase = 0;
  renderBackground();
  playNote(523, 0.6, 0.25, 'sine', 0.3);
  playNote(659, 0.75, 0.3, 'triangle', 0.3);
}

function respawnGrove() {}
function resizeGrove() {
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.92;
}

// Sana-HUD: tavutettu sana + kuva, kerätyt kirjaimet värillisinä, seuraava hehkuu
function groveHudGeom() {
  var w = grove.words[grove.wi], h = viewH * 0.085;
  readFont(ctx, h * 0.62);
  var bw = ctx.measureText(w.w).width + h * 1.6 + h * 1.1;
  return { w: w, syl: w.w.split('-'), h: h, bw: bw, bx: viewW / 2, by: viewH * 0.17 };
}

function groveWordLayout() {
  var g = groveHudGeom(), letters = groveLettersOf(g.w), xs = [], i, k, cw;
  var x = g.bx - g.bw / 2 + g.h * 0.5;
  readFont(ctx, g.h * 0.62);
  for (i = 0; i < g.syl.length; i++) {
    for (k = 0; k < g.syl[i].length; k++) {
      cw = ctx.measureText(g.syl[i].charAt(k)).width;
      xs.push(x + cw / 2);
      x += cw;
    }
    if (i < g.syl.length - 1) x += ctx.measureText('-').width;
  }
  grove.hudRect = { x: g.bx - g.bw / 2, y: g.by - g.h / 2, w: g.bw, h: g.h };
  return { xs: xs, letters: letters, y: g.by };
}

function drawGroveWordHud(c) {
  var g = groveHudGeom(), w = g.w, syl = g.syl, h = g.h, bx = g.bx, by = g.by, i, k, x, li = 0;
  var sayIdx = grove.sayT >= 0 ? Math.floor(grove.sayT / WORD_SYL_T) : -1;
  groveWordLayout();
  c.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(c, bx - g.bw / 2, by - h / 2, g.bw, h, h * 0.4);
  c.fill();
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  x = bx - g.bw / 2 + h * 0.5;
  readFont(c, h * 0.62);
  for (i = 0; i < syl.length; i++) {
    for (k = 0; k < syl[i].length; k++) {
      var ch = syl[i].charAt(k), cw = c.measureText(ch).width;
      var done = li < grove.next, isNext = li === grove.next;
      if (isNext) {
        var glow = c.createRadialGradient(x + cw / 2, by, h * 0.05, x + cw / 2, by, h * 0.55);
        glow.addColorStop(0, 'rgba(255,230,140,' + (0.6 + Math.sin(globalT * 5) * 0.25) + ')');
        glow.addColorStop(1, 'rgba(255,230,140,0)');
        c.fillStyle = glow;
        c.beginPath(); c.arc(x + cw / 2, by, h * 0.55, 0, Math.PI * 2); c.fill();
      }
      readFont(c, h * 0.62);
      c.fillStyle = done ? '#ff5f7e' : (isNext ? '#8a2be2' : 'rgba(138,43,226,0.55)');
      if (sayIdx >= 0) c.fillStyle = i === sayIdx ? '#ff5f7e' : (done ? '#c94f7e' : '#8a2be2');
      c.fillText(ch, x, by + h * 0.03);
      x += cw;
      li++;
    }
    if (i < syl.length - 1) { c.fillStyle = '#c9a0ff'; c.fillText('-', x, by + h * 0.03); x += c.measureText('-').width; }
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  var ix = bx + g.bw / 2 - h * 0.6;
  c.fillStyle = '#fff6d8';
  c.beginPath(); c.arc(ix, by, h * 0.42, 0, Math.PI * 2); c.fill();
  drawWordIcon(c, w.icon, ix, by, h * 0.42);
}

function groveWordDone() {
  grove.done++;
  var wy = groveWordLayout().y;
  spawnSparkles(viewW / 2, wy, 24, '#ffe27a');
  groveWordSay();
  playNote(784, grove.words[grove.wi].w.split('-').length * WORD_SYL_T + 0.1, 0.35, 'triangle', 0.35);
  if (!activeTask && !celebrating) {
    if (grove.done === 1 && !tasks[0].opened) taskStart(tasks[0]);
    else if (grove.done === 2 && !tasks[1].opened) taskStart(tasks[1]);
  }
  if (grove.done >= GROVE_WORDS) { startCelebration(); return; }
  grove.wi++;
  grove.next = 0;
  groveDealLetters();
}

function handleGroveTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, p, dx, dy;
  // Sanakuplan napautus lukee sanan uudelleen
  var lay = groveWordLayout();
  var hr = grove.hudRect;
  if (hr && px >= hr.x && px <= hr.x + hr.w && py >= hr.y && py <= hr.y + hr.h) {
    groveWordSay();
    return;
  }
  var need = groveLettersOf(grove.words[grove.wi])[grove.next];
  for (i = 0; i < GROVE_BUSHES; i++) {
    p = groveBushPos(i);
    dx = px - p.x;
    dy = py - p.y;
    if (dx * dx + dy * dy < viewH * 0.075 * viewH * 0.075) {
      if (grove.letters[i] === need) {
        // Kirjain lentää sanan seuraavaan paikkaan
        grove.anims.push({
          ch: need, x0: p.x, y0: p.y, x1: lay.xs[grove.next], y1: lay.y, t: 0
        });
        grove.next++;
        grove.letters[i] = '';
        playNote(523 + grove.next * 55, 0, 0.2, 'sine', 0.35);
        if (grove.next >= lay.letters.length) groveWordDone();
        else groveDealLettersKeepUsed();
      } else {
        grove.wrongT = 0.5;
        grove.wrongIdx = i;
        playNote(170, 0, 0.25, 'sawtooth', 0.2);
      }
      return;
    }
  }
}

// Jaa kirjaimet uudelleen paikoilleen, käytetty pensas jää tyhjäksi hetkeksi
function groveDealLettersKeepUsed() {
  var i, kept = [];
  for (i = 0; i < GROVE_BUSHES; i++) if (grove.letters[i]) kept.push(grove.letters[i]);
  var need = groveLettersOf(grove.words[grove.wi]).slice(grove.next);
  var pool = kept.slice(), ch, guard = 0;
  while (pool.length < GROVE_BUSHES && guard++ < 60) {
    ch = GROVE_DISTRACTORS[randInt(GROVE_DISTRACTORS.length)];
    if (need.indexOf(ch) >= 0 || pool.indexOf(ch) >= 0) continue;
    pool.push(ch);
  }
  while (pool.length < GROVE_BUSHES) pool.push(GROVE_DISTRACTORS[randInt(GROVE_DISTRACTORS.length)]);
  var order = shuffleNums(pool.map(function (_, k) { return k; }));
  grove.letters = [];
  for (i = 0; i < GROVE_BUSHES; i++) grove.letters.push(pool[order[i]]);
}

function updateGrove(dt) {
  var i;
  updateTasks(dt);
  if (grove.sayT >= 0) {
    grove.sayT += dt;
    if (grove.sayT > grove.words[grove.wi].w.split('-').length * WORD_SYL_T + 0.3) grove.sayT = -1;
  }
  if (grove.wrongT > 0) grove.wrongT -= dt;
  for (i = grove.anims.length - 1; i >= 0; i--) {
    grove.anims[i].t += dt * 2.2;
    if (grove.anims[i].t >= 1) {
      spawnSparkles(grove.anims[i].x1, grove.anims[i].y1, 8, '#ffe27a');
      grove.anims.splice(i, 1);
    }
  }
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function groveLayers() {
  return [
    { speed: 0.22, render: renderGroveFar },
    { speed: 0.55, render: renderGroveMid },
    { speed: 1, render: renderGroveNear }
  ];
}
function renderGroveBg(b, w, h) {
  renderGroveFar(b, w, h);
  renderGroveMid(b, w, h);
  renderGroveNear(b, w, h);
}
function renderGroveFar(b, w, h) { meadowFar(b, w, h, '#7ec8ff', '#eefaff', '#c8e8b8'); }
function renderGroveMid(b, w, h) { meadowMid(b, w, h, '#a7dd8f'); }
function renderGroveNear(b, w, h) {
  var i, x;
  var grass = b.createLinearGradient(0, h * 0.44, 0, h);
  grass.addColorStop(0, '#8fd97a');
  grass.addColorStop(1, '#5fb356');
  b.fillStyle = grass;
  b.fillRect(0, h * 0.44, w, h * 0.56);
  for (i = 0; i < 26; i++) {
    x = (i * 173.7) % w;
    drawFlower(b, x, h * 0.5 + ((i * 37) % Math.max(1, Math.round(h * 0.44))), h * 0.011,
      ['#ff7bac', '#ffe27a', '#c9a0ff', '#7fd4ff'][i % 4]);
  }
}

function groveDrawBush(c, p, ch, wrong) {
  var jx = wrong ? Math.sin(globalT * 40) * viewH * 0.006 : 0;
  drawBush(c, p.x + jx, p.y + viewH * 0.045, viewH * 0.075);
  if (!ch) return;
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.beginPath(); c.arc(p.x + jx, p.y - viewH * 0.02, viewH * 0.042, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c9a0ff';
  c.lineWidth = Math.max(2, viewH * 0.005);
  c.stroke();
  c.fillStyle = '#8a2be2';
  c.font = 'bold ' + Math.round(viewH * 0.05) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, p.x + jx, p.y - viewH * 0.017);
  c.textBaseline = 'alphabetic';
}

function drawGrove() {
  var i, p;
  if (!beginPlayWorld()) return;
  // Pensaat kirjaimineen
  for (i = 0; i < GROVE_BUSHES; i++) {
    p = groveBushPos(i);
    groveDrawBush(ctx, p, grove.letters[i], grove.wrongT > 0 && grove.wrongIdx === i);
  }
  // Liikkuvat kirjaimet
  for (i = 0; i < grove.anims.length; i++) {
    var an = grove.anims[i], f = Math.min(1, an.t);
    var ax = an.x0 + (an.x1 - an.x0) * f;
    var ay = an.y0 + (an.y1 - an.y0) * f - Math.sin(f * Math.PI) * viewH * 0.1;
    ctx.fillStyle = '#ff5f7e';
    ctx.font = 'bold ' + Math.round(viewH * 0.055) + 'px ' + UI_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(an.ch, ax, ay);
    ctx.textBaseline = 'alphabetic';
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawGroveWordHud(ctx);
  drawPickupHud(ctx, GROVE_WORDS, function (i2) { return i2 < grove.done; },
    function (c, x, y, s) { drawWordIcon(c, 'book', x, y, s); });
  drawTaskOverlay(ctx);
}
