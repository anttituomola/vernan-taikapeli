'use strict';

// Kirjainpuutarha: kiireetön lukukenttä ilman sydämiä ja ilman liikkumista.
// Pensaissa kylpee kirjaimia; sanakupla ylhäällä näyttää tavutettuna, mikä
// sana on vuorossa. Napauta pensasta, jossa on sanan seuraava kirjain —
// kirjain lentää sanaan ja pensaat sekoittuvat. Kolme sanaa.
// Tehtävät avautuvat sanojen valmistuessa (käsin, kuten Kaivoksessa).

var GROVE_WORDS = 3;
var GROVE_BUSHES = 6;
var grove = {
  words: [], wi: 0, next: 0, done: 0,
  letters: [], // pensaiden kirjaimet
  anims: [],   // liikkuvat kirjaimet {ch, x0, y0, x1, y1, t}
  wrongT: 0, wrongIdx: -1, sayT: -1
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

// Sanan kirjainpaikkojen asettelu kuplassa
function groveWordLayout() {
  var letters = groveLettersOf(grove.words[grove.wi]);
  var syl = grove.words[grove.wi].w.split('-');
  var gap = viewH * 0.055, dash = viewH * 0.03, total = 0, i, j, k = 0, xs = [];
  for (i = 0; i < syl.length; i++) {
    total += syl[i].length * gap;
    if (i < syl.length - 1) total += dash;
  }
  var x = viewW / 2 - total / 2 + gap / 2;
  for (i = 0; i < syl.length; i++) {
    for (j = 0; j < syl[i].length; j++) { xs.push(x); x += gap; k++; }
    x += dash;
  }
  return { xs: xs, letters: letters, y: viewH * 0.17 };
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
  if (Math.abs(py - lay.y) < viewH * 0.08 && Math.abs(px - viewW / 2) < viewW * 0.3) {
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
function renderGroveBg(b, w, h) {
  var i, x;
  var sky = b.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#b8e6ff');
  sky.addColorStop(1, '#eefaff');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h * 0.5 + 2);
  b.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = 0; i < 6; i++) cloudShape(b, w * (0.08 + i * 0.17), h * (0.1 + (i % 2) * 0.08), h * 0.03);
  // Kukkulat ja nurmi
  b.fillStyle = '#a7dd8f';
  for (i = 0; i < 8; i++) {
    x = w * (i / 7);
    b.beginPath(); b.arc(x, h * 0.52, h * (0.12 + (i % 3) * 0.04), Math.PI, 0); b.fill();
  }
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
  c.font = 'bold ' + Math.round(viewH * 0.05) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(ch, p.x + jx, p.y - viewH * 0.017);
  c.textBaseline = 'alphabetic';
}

function drawGrove() {
  var i, p;
  if (!drawWorldBg()) return;
  // Sanakupla: kerätyt kirjaimet paikoillaan, seuraava hehkuu
  var lay = groveWordLayout();
  var totalW = lay.xs.length * viewH * 0.055 + viewH * 0.1;
  drawPromptBubble(ctx, viewW / 2, lay.y, totalW, viewH * 0.11);
  var syl = grove.words[grove.wi].w.split('-');
  var sayIdx = grove.sayT >= 0 ? Math.floor(grove.sayT / WORD_SYL_T) : -1;
  var sylOf = [], acc = 0;
  for (i = 0; i < syl.length; i++) { acc += syl[i].length; sylOf.push(acc); }
  ctx.font = 'bold ' + Math.round(viewH * 0.052) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (i = 0; i < lay.letters.length; i++) {
    var si = 0;
    while (i >= sylOf[si]) si++;
    var isNext = i === grove.next;
    if (isNext) {
      var g = ctx.createRadialGradient(lay.xs[i], lay.y, viewH * 0.005, lay.xs[i], lay.y, viewH * 0.04);
      g.addColorStop(0, 'rgba(255,240,160,' + (0.7 + Math.sin(globalT * 5) * 0.3) + ')');
      g.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(lay.xs[i], lay.y, viewH * 0.04, 0, Math.PI * 2); ctx.fill();
    }
    if (i < grove.next) {
      ctx.fillStyle = si === sayIdx ? '#ff5f7e' : '#8a2be2';
      ctx.fillText(lay.letters[i], lay.xs[i], lay.y);
    } else {
      ctx.fillStyle = 'rgba(138,43,226,0.35)';
      ctx.fillText(isNext ? '·' : '_', lay.xs[i], lay.y);
    }
  }
  ctx.textBaseline = 'alphabetic';
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
    ctx.font = 'bold ' + Math.round(viewH * 0.055) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(an.ch, ax, ay);
    ctx.textBaseline = 'alphabetic';
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  drawCelebrateLayer();
  drawPickupHud(ctx, GROVE_WORDS, function (i2) { return i2 < grove.done; },
    function (c, x, y, s) { drawWordIcon(c, 'book', x, y, s); });
  drawTaskOverlay(ctx);
}
