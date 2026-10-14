'use strict';

// Tarina: kuvakirjan luvut (CONTEXT.md, "Tarina"). Luku näytetään kerran, kun
// sen ehto täyttyy ja pelaaja palaa kartalle (showSea/showLand kysyvät
// storyMaybe-funktiolta). Sivulla on animoitu kuva kortissa ja lyhyt iso
// teksti; napautus kääntää sivua, ⏩-nappi ohittaa luvun. Eteneminen päätellään
// läpäistyistä vartijoista, tallennus muistaa vain näytetyt luvut (storySeen).
// Linnan tarinakirja (storyBookOpen) näyttää kaikki jo nähdyt luvut uudestaan.

var storySeen = {};        // { lukuId: true }
var story = null;          // { ch, page, t, then, book }
var storyBook = null;      // { scroll } kun tarinakirjan luettelo on auki
var STORY_SPEAK = true;    // lue sivun teksti ääneen, jos laitteessa on suomenkielinen ääni

// Maailman vartija läpäisty (nimi kuten rekisterissä)
function storyWorldDone(name) {
  var i, w;
  for (i = 0; i < WORLDS.length; i++) {
    w = WORLDS[i];
    if (w.name === name) return !!hubCleared[(w.island || w.place).finaleKind];
  }
  return false;
}

// Luvut järjestyksessä. where: millä kartalla luku voi alkaa ('sea', 'land' tai
// 'any'). cond: tarinan kohta saavutettu. cover: kohtaus tarinakirjan kanteen.
var STORY_CHAPTERS = [
  {
    id: 'alku', title: 'ALKU', where: 'any', cover: 'castle',
    cond: function () { return true; },
    pages: [
      { scene: 'castle', text: 'OLIPA KERRAN LINNA SATEENKAAREN ALLA.' },
      { scene: 'friends', text: 'SIELLÄ ASUIVAT VERNA, YKSISARVINEN JA PUPUT.' },
      { scene: 'storm', text: 'ERÄÄNÄ PÄIVÄNÄ TULI MYRSKYNOITA JA VALTASI LINNAN.' },
      { scene: 'colors', text: 'MYRSKY PUHALSI SATEENKAAREN VÄRIT SAARILLE.' },
      { scene: 'depart', text: 'LÄHDETÄÄN PELASTAMAAN PUPUT!' }
    ]
  },
  {
    id: 'pako', title: 'PAKO', where: 'sea', cover: 'free',
    cond: function () { return storyWorldDone('Linnasaari'); },
    pages: [
      { scene: 'free', text: 'PUPUT OVAT VAPAINA! MYRSKYNOITA LENSI KARKUUN.' },
      { scene: 'home', text: 'LINNA ON TAAS KOTI. SINNE VOI PALATA AINA.' },
      { scene: 'red', text: 'PUNAINEN VÄRI PALASI. MUUT OVAT VIELÄ SAARILLA.' },
      { scene: 'cloud', text: 'SEURAA MYRSKYPILVEÄ! SIELLÄ ON SEURAAVA VÄRI.' }
    ]
  },
  {
    id: 'tahti', title: 'KULTATÄHTI', where: 'sea', cover: 'goldstar',
    cond: function () { return storyWorldDone('Tivolisaari'); },
    pages: [
      { scene: 'goldstar', text: 'SATEENKAARI ON EHJÄ! KULTATÄHTI LOISTAA.' },
      { scene: 'north', text: 'MYRSKYNOITA PAKENI POHJOISEEN, REVONTULTEN MAAHAN.' }
    ]
  },
  {
    id: 'revontuli', title: 'REVONTULET', where: 'sea', cover: 'fox',
    cond: function () { return storyWorldDone('Revontulimaa'); },
    pages: [
      { scene: 'fox', text: 'REVONTULIKETTU NÄYTTI TIEN MEREN YLI.' },
      { scene: 'farland', text: 'SIELLÄ ON KAUKAMAA. MYRSKYPILVI LENSI SINNE.' }
    ]
  },
  {
    id: 'kaukamaa', title: 'KAUKAMAA', where: 'land', cover: 'sunhidden',
    cond: function () { return true; },
    pages: [
      { scene: 'sunhidden', text: 'KAUKAMAAN AURINKO ON MYRSKYPILVEN TAKANA.' },
      { scene: 'rays', text: 'JOKAINEN PAIKKA ANTAA AURINGOLLE SÄTEEN.' }
    ]
  },
  {
    id: 'vuori', title: 'MYRSKYVUORI', where: 'land', cover: 'mountain',
    cond: function () { return !!landFinalPlace() && landRaysEarned() >= landRayPlaces().length; },
    pages: [
      { scene: 'sunfull', text: 'KAIKKI SÄTEET LOISTAVAT! AURINKO ON TÄYNNÄ VOIMAA.' },
      { scene: 'mountain', text: 'MYRSKYPILVI PAKENI VUORELLE. MENNÄÄN PERÄÄN!' }
    ]
  },
  {
    id: 'ystava', title: 'YSTÄVÄ', where: 'land', cover: 'rainbowbirth',
    cond: function () { return storyWorldDone('Myrskyvuori'); },
    pages: [
      { scene: 'witchsad', text: 'MYRSKYNOITA OLI SURULLINEN. HÄN OSAA TEHDÄ VAIN SADETTA.' },
      { scene: 'lonely', text: 'KUKAAN EI OLLUT KUTSUNUT HÄNTÄ SATEENKAARIJUHLIIN.' },
      { scene: 'rainbowbirth', text: 'MUTTA KUN SADE JA AURINKO KOHTAAVAT, SYNTYY SATEENKAARI!' },
      { scene: 'invite', text: 'TULE MEIDÄN LINNAAN, MYRSKYNOITA! OLLAAN YSTÄVIÄ.' },
      { scene: 'party', text: 'JA SITTEN JUHLITTIIN KAIKKI YHDESSÄ. LOPPU.' }
    ]
  }
];

function storyChapter(id) {
  var i;
  for (i = 0; i < STORY_CHAPTERS.length; i++) if (STORY_CHAPTERS[i].id === id) return STORY_CHAPTERS[i];
  return null;
}

// Ensimmäinen näyttämätön luku, jonka ehto täyttyy tällä kartalla
function storyPending(where) {
  var i, ch;
  for (i = 0; i < STORY_CHAPTERS.length; i++) {
    ch = STORY_CHAPTERS[i];
    if (storySeen[ch.id]) continue;
    if (ch.where !== 'any' && ch.where !== where) continue;
    if (ch.cond()) return ch;
  }
  return null;
}

// Kartan näyttäjä kysyy ensin: jos luku odottaa, se näytetään ja then() kutsutaan
// lopuksi (yleensä sama kartta uudestaan). Palauttaa true, jos luku alkoi.
function storyMaybe(where, then) {
  var ch = storyPending(where);
  if (!ch) return false;
  storyShow(ch.id, then, false);
  return true;
}

// Vanha tallennus (ennen tarinaa): jo ohitetut luvut merkitään nähdyiksi, ettei
// niitä tule monta peräkkäin. Alku näytetään silti, ja muut löytyvät tarinakirjasta.
function storyLegacySeen() {
  var i, ch;
  for (i = 0; i < STORY_CHAPTERS.length; i++) {
    ch = STORY_CHAPTERS[i];
    if (ch.id === 'alku' || ch.where === 'land') continue;
    if (ch.cond()) storySeen[ch.id] = true;
  }
}

var STORY_HIDE_BTNS = ['replayBtn', 'continueBtn', 'jumpBtn', 'fireBtn', 'penBtn', 'karttaBtn', 'seaBtn', 'castleBtn'];
function storyShow(id, then, book) {
  var ch = storyChapter(id), i;
  if (!ch) { if (then) then(); return; }
  mode = 'story';
  running = false;
  holding = false;
  celebrating = false;
  hubOffer = null;
  story = { ch: ch, page: 0, t: 0, then: then || null, book: !!book };
  fadeStart();
  document.getElementById('hubChrome').style.display = 'none';
  for (i = 0; i < STORY_HIDE_BTNS.length; i++) document.getElementById(STORY_HIDE_BTNS[i]).style.display = 'none';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#fff6e8';
  lastTime = 0;
  playNote(523, 0, 0.18, 'triangle', 0.3);
  playNote(784, 0.12, 0.25, 'triangle', 0.3);
  storySpeak();
}

function storyEnd() {
  var then = story && story.then, ch = story && story.ch;
  if (ch && !storySeen[ch.id]) {
    storySeen[ch.id] = true;
    saveProgress();
  }
  storyHush();
  story = null;
  if (then) then();
  else showSea();
}

// ---------- Ääneen luku ----------
function storyVoice() {
  if (!window.speechSynthesis || !speechSynthesis.getVoices) return null;
  var vs = speechSynthesis.getVoices(), i;
  for (i = 0; i < vs.length; i++) if (/^fi/i.test(vs[i].lang)) return vs[i];
  return null;
}
function storySpeak() {
  if (!STORY_SPEAK || muted || !story) return;
  var v = storyVoice();
  if (!v) return;
  try {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(story.ch.pages[story.page].text.toLowerCase());
    u.voice = v;
    u.lang = v.lang;
    u.rate = 0.9;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) { /* ei ääntä */ }
}
function storyHush() {
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ei ääntä */ }
}

// ---------- Asettelu ----------
function storyLayout() {
  var cw = Math.min(viewW * 0.9, viewH * 1.5), ch = Math.min(viewH * 0.64, cw * 0.56);
  var cx = (viewW - cw) / 2, cy = viewH * 0.05;
  var r = viewH * 0.08;
  return {
    card: { x: cx, y: cy, w: cw, h: ch },
    textY: cy + ch + viewH * 0.12,
    skip: { x: viewH * 0.1, y: viewH - viewH * 0.08, r: viewH * 0.05 },
    next: { x: viewW / 2, y: viewH - viewH * 0.07, r: r * 0.5 }
  };
}

function handleStoryTap(px, py) {
  if (!story) return;
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var lay = storyLayout();
  if (Math.hypot(px - lay.skip.x, py - lay.skip.y) < lay.skip.r * 1.4) {
    playNote(392, 0, 0.12, 'triangle', 0.25);
    storyEnd();
    return;
  }
  // Napautus heti sivun vaihduttua ei ohita sivua vahingossa
  if (story.t < 0.35) return;
  if (story.page < story.ch.pages.length - 1) {
    story.page++;
    story.t = 0;
    playNote(659 + story.page * 40, 0, 0.14, 'triangle', 0.25);
    storySpeak();
  } else {
    soundFanfare();
    storyEnd();
  }
}

function updateStory(dt) {
  globalT += dt;
  if (story) story.t += dt;
  updateParticles(dt);
}

function drawStory() {
  var c = ctx, lay = storyLayout(), cd = lay.card, i;
  if (!story) return;
  var pg = story.ch.pages[story.page];
  // Paperi
  var bg = c.createLinearGradient(0, 0, 0, viewH);
  bg.addColorStop(0, '#fff6e8');
  bg.addColorStop(1, '#f6e2ff');
  c.fillStyle = bg;
  c.fillRect(0, 0, viewW, viewH);
  for (i = 0; i < 14; i++) {
    drawStar(c, (i * 173.3) % viewW, (i * 97.1) % viewH, viewH * 0.008, globalT * 0.3 + i, 0);
  }
  // Kuva: kortti nousee esiin sivun alussa
  var k = easeOutBack(Math.min(1, story.t / 0.45));
  c.save();
  c.translate(cd.x + cd.w / 2, cd.y + cd.h / 2);
  c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k);
  c.globalAlpha = Math.min(1, story.t / 0.25);
  c.translate(-cd.w / 2, -cd.h / 2);
  storyDrawCard(c, pg.scene, cd.w, cd.h, story.t);
  c.restore();
  c.globalAlpha = 1;
  // Teksti
  storyText(c, pg.text, viewW / 2, lay.textY, Math.min(viewW * 0.9, viewH * 1.6), viewH * 0.062);
  // Sivupisteet ja kääntövihje
  var n = story.ch.pages.length, dr = viewH * 0.012;
  for (i = 0; i < n; i++) {
    c.fillStyle = i === story.page ? '#8a5cb8' : 'rgba(138,92,184,0.3)';
    c.beginPath();
    c.arc(viewW / 2 + (i - (n - 1) / 2) * dr * 3.4, lay.next.y + viewH * 0.035, dr, 0, Math.PI * 2);
    c.fill();
  }
  if (story.t > 1.2) {
    var bob = Math.sin(globalT * 4) * viewH * 0.008;
    storyArrow(c, viewW - viewH * 0.1 + bob, lay.next.y, viewH * 0.045, story.page === n - 1);
  }
  // Ohitus
  var sk = lay.skip;
  artCircle(c, sk.x, sk.y, sk.r, '#ffffff', { lineColor: '#c9a0ff' });
  c.fillStyle = '#8a5cb8';
  for (i = 0; i < 2; i++) {
    var ox = sk.x - sk.r * 0.42 + i * sk.r * 0.42;
    c.beginPath();
    c.moveTo(ox, sk.y - sk.r * 0.38); c.lineTo(ox + sk.r * 0.42, sk.y); c.lineTo(ox, sk.y + sk.r * 0.38);
    c.closePath(); c.fill();
  }
}

// Iso teksti rivitettynä, valkoinen reunus
function storyText(c, text, x, y, maxW, size) {
  var words = text.split(' '), lines = [], line = '', i, test;
  c.font = 'bold ' + Math.round(size) + 'px ' + UI_FONT;
  for (i = 0; i < words.length; i++) {
    test = line ? line + ' ' + words[i] : words[i];
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
  }
  lines.push(line);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  var y0 = y - (lines.length - 1) * size * 0.6;
  for (i = 0; i < lines.length; i++) {
    c.lineWidth = size * 0.22;
    c.strokeStyle = '#ffffff';
    c.strokeText(lines[i], x, y0 + i * size * 1.2);
    c.fillStyle = '#5a2d91';
    c.fillText(lines[i], x, y0 + i * size * 1.2);
  }
  c.textBaseline = 'alphabetic';
}

function storyArrow(c, x, y, s, last) {
  if (last) { drawStar(c, x, y, s * 0.9, globalT, 1); return; }
  c.fillStyle = '#ffd24f';
  c.strokeStyle = '#c8901e';
  c.lineWidth = s * 0.12;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - s * 0.7, y - s * 0.3); c.lineTo(x, y - s * 0.3); c.lineTo(x, y - s * 0.75);
  c.lineTo(x + s * 0.85, y); c.lineTo(x, y + s * 0.75); c.lineTo(x, y + s * 0.3); c.lineTo(x - s * 0.7, y + s * 0.3);
  c.closePath(); c.fill(); c.stroke();
}

// Kuvakortti: kehys, leikattu kohtaus ja kiilto
function storyDrawCard(c, scene, w, h, t) {
  var rr = h * 0.07;
  c.fillStyle = 'rgba(90,45,145,0.18)';
  roundRect(c, h * 0.015, h * 0.03, w, h, rr);
  c.fill();
  c.save();
  roundRect(c, 0, 0, w, h, rr);
  c.clip();
  (STORY_SCENES[scene] || STORY_SCENES.castle)(c, w, h, t);
  c.restore();
  c.strokeStyle = '#ffffff';
  c.lineWidth = h * 0.03;
  roundRect(c, 0, 0, w, h, rr);
  c.stroke();
  c.strokeStyle = '#c9a0ff';
  c.lineWidth = h * 0.008;
  roundRect(c, -h * 0.015, -h * 0.015, w + h * 0.03, h + h * 0.03, rr * 1.1);
  c.stroke();
}

// ---------- Kohtausten palat ----------
function storySky(c, w, h, top, bottom) {
  var g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}
function storyHill(c, w, h, gy, color, wave) {
  var x;
  c.beginPath();
  c.moveTo(0, h);
  for (x = 0; x <= w; x += w / 24) c.lineTo(x, gy + Math.sin(x / w * Math.PI * 2 * (wave || 1) + 0.7) * h * 0.03);
  c.lineTo(w, h);
  c.closePath();
  artFillPath(c, color, gy - h * 0.04, h, h * 0.2, { line: false });
}
function storySun(c, x, y, r, t) {
  var i, a;
  c.strokeStyle = 'rgba(255,210,79,0.7)';
  c.lineWidth = r * 0.16;
  c.lineCap = 'round';
  for (i = 0; i < 10; i++) {
    a = t * 0.4 + i * Math.PI / 5;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    c.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7);
    c.stroke();
  }
  artGlow(c, x, y, r * 2.4, '#fff4c8', 0.5);
  artCircle(c, x, y, r, '#ffd24f', { lineColor: '#e0a020', hi: 0.4 });
}
// Sateenkaari: n ensimmäistä väriä täysinä, loput haaleina katkoviivoina
function storyRainbow(c, cx, cy, R, bw, n, alpha) {
  var i, col;
  c.lineCap = 'butt';
  for (i = 0; i < RAINBOW_COLORS.length; i++) {
    col = RAINBOW_COLORS[i];
    c.lineWidth = bw;
    if (i < n) {
      c.strokeStyle = artRGBA(col, alpha === undefined ? 0.95 : alpha);
      c.setLineDash([]);
    } else {
      c.strokeStyle = 'rgba(225,220,240,0.4)';
      c.setLineDash([]);
    }
    c.beginPath();
    c.arc(cx, cy, R - i * bw, Math.PI, 0);
    c.stroke();
  }
  c.setLineDash([]);
}
function storySea(c, w, h, sy, t, dark) {
  var g = c.createLinearGradient(0, sy, 0, h), i, x, y;
  g.addColorStop(0, dark ? '#5a6aa8' : '#6cc0f0');
  g.addColorStop(1, dark ? '#3a4a80' : '#3a8ad0');
  c.fillStyle = g;
  c.fillRect(0, sy, w, h - sy);
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = h * 0.006;
  c.lineCap = 'round';
  for (i = 0; i < 12; i++) {
    x = ((i * 137 + t * 30) % (w + 40)) - 20;
    y = sy + h * 0.05 + (i * 53) % (h - sy - h * 0.08);
    c.beginPath(); c.arc(x, y, h * 0.02, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
}
function storyIsland(c, x, y, r, top) {
  artBlob(c, x, y, r * 1.1, r * 0.42, '#f2d79a', { lineColor: '#c8a060' });
  artBlob(c, x, y - r * 0.12, r * 0.85, r * 0.36, top || '#7fcf68', { lineColor: '#4a9a40' });
}
function storyBunnies(c, x, y, s, n, t, hop, gap) {
  var i, hy;
  for (i = 0; i < n; i++) {
    hy = hop ? Math.abs(Math.sin(t * 5 + i * 1.3)) * s * 0.8 : 0;
    drawBunny(c, x + i * s * (gap || 1.5), y - hy, s, hy, t * 3 + i, false);
  }
}
function storyRider(c, x, y, s, facing, moving, t) {
  drawUnicorn(c, x, y, s, facing, t * 7, moving, t);
}
function storyFlowers(c, w, gy, h, n) {
  var i, cols = ['#ff7bac', '#ffd24f', '#c9a0ff', '#ff9f3a'];
  for (i = 0; i < n; i++) drawFlower(c, (i * 0.137 % 1) * w, gy + h * (0.06 + (i * 0.31 % 1) * 0.14), h * 0.012, cols[i % 4]);
}
function storyClouds(c, w, h, t) {
  c.fillStyle = 'rgba(255,255,255,0.92)';
  cloudShape(c, (w * 0.15 + t * 6) % (w * 1.2), h * 0.15, h * 0.035);
  cloudShape(c, (w * 0.7 + t * 4) % (w * 1.2), h * 0.1, h * 0.03);
}

// ---------- Kohtaukset (c, w, h, t): kortin koordinaatit ----------
var STORY_SCENES = {
  castle: function (c, w, h, t) {
    storySky(c, w, h, '#8fd0ff', '#e6f6ff');
    storyRainbow(c, w * 0.5, h * 0.82, h * 0.62, h * 0.045, 7);
    storyClouds(c, w, h, t);
    storyHill(c, w, h, h * 0.76, '#8fd673', 1);
    drawCastle(c, w * 0.5, h * 0.8, h * 0.36);
    storyBunnies(c, w * 0.2, h * 0.9, h * 0.06, 2, t, true);
    storyBunnies(c, w * 0.74, h * 0.92, h * 0.06, 1, t + 1, true);
    storyFlowers(c, w, h * 0.76, h, 18);
  },
  friends: function (c, w, h, t) {
    storySky(c, w, h, '#a8dcff', '#f0faff');
    storySun(c, w * 0.85, h * 0.2, h * 0.08, t);
    storyClouds(c, w, h, t);
    storyHill(c, w, h, h * 0.72, '#8fd673', 0.7);
    drawTree(c, w * 0.1, h * 0.76, h * 0.22, 0);
    drawTree(c, w * 0.9, h * 0.78, h * 0.2, 0);
    storyRider(c, w * 0.38, h * 0.72, h * 0.0032, 1, false, t);
    storyBunnies(c, w * 0.56, h * 0.88, h * 0.07, 3, t, true, 1.6);
    storyFlowers(c, w, h * 0.72, h, 22);
  },
  storm: function (c, w, h, t) {
    storySky(c, w, h, '#4a4878', '#8a86b8');
    storyHill(c, w, h, h * 0.78, '#5a8a5a', 1);
    drawCastle(c, w * 0.32, h * 0.82, h * 0.34);
    drawWitchCloud(c, w * 0.32, h * 0.2, h * 0.16, t, 1);
    drawWitchCloud(c, w * 0.75, h * 0.14, h * 0.12, t + 1.3, 0.6);
    var wx = w * (0.95 - Math.min(1, t / 2.5) * 0.3), wy = h * 0.42 + Math.sin(t * 2) * h * 0.03;
    drawStormWitch(c, wx, wy, h * 0.075, -1, 'grumpy');
  },
  colors: function (c, w, h, t) {
    storySky(c, w, h, '#6a7ab8', '#b8c8f0');
    storySea(c, w, h, h * 0.6, t, false);
    storyIsland(c, w * 0.15, h * 0.75, h * 0.1);
    storyIsland(c, w * 0.45, h * 0.86, h * 0.09);
    storyIsland(c, w * 0.8, h * 0.72, h * 0.11);
    drawWitchCloud(c, w * 0.5, h * 0.17, h * 0.13, t, 0.4);
    // Värit lentävät pisaroina pilvestä saarille
    var i, k, sx, sy, ex, ey, x, y, isl = [[0.15, 0.68], [0.45, 0.8], [0.8, 0.64]];
    for (i = 0; i < RAINBOW_COLORS.length; i++) {
      k = ((t * 0.35 + i / RAINBOW_COLORS.length) % 1);
      sx = w * 0.5; sy = h * 0.25;
      ex = w * isl[i % 3][0] + (i - 3) * h * 0.02; ey = h * isl[i % 3][1];
      x = sx + (ex - sx) * k;
      y = sy + (ey - sy) * k - Math.sin(k * Math.PI) * h * 0.18;
      artBlob(c, x, y, h * 0.022, h * 0.03, RAINBOW_COLORS[i], { lineColor: artShade(RAINBOW_COLORS[i], -0.35) });
    }
  },
  depart: function (c, w, h, t) {
    storySky(c, w, h, '#ffd8a8', '#fff2d8');
    storySun(c, w * 0.85, h * 0.62, h * 0.12, t);
    storySea(c, w, h, h * 0.68, t, false);
    storyHill(c, w, h, h * 0.8, '#8fd673', 0.5);
    var ux = w * (0.2 + Math.min(1, t / 3) * 0.25);
    storyRider(c, ux, h * 0.84, h * 0.003, 1, true, t);
    drawStar(c, w * 0.7, h * 0.3, h * 0.04, t, 1);
  },
  free: function (c, w, h, t) {
    storySky(c, w, h, '#8fd0ff', '#e6f6ff');
    storyHill(c, w, h, h * 0.74, '#8fd673', 1);
    drawCastle(c, w * 0.22, h * 0.78, h * 0.3);
    var k = Math.min(1, t / 3);
    drawStormWitch(c, w * (0.6 + k * 0.35), h * (0.35 - k * 0.2), h * 0.06 * (1 - k * 0.4), 1, 'sulk');
    storyBunnies(c, w * 0.42, h * 0.9, h * 0.07, 3, t, true, 1.7);
    storyFlowers(c, w, h * 0.74, h, 18);
    if ((t % 1.4) < 0.7) drawStar(c, w * 0.5, h * 0.62, h * 0.03, t * 2, 1);
  },
  home: function (c, w, h, t) {
    storySky(c, w, h, '#ffe0f0', '#fff6e8');
    storyHill(c, w, h, h * 0.8, '#8fd673', 0.5);
    drawCastle(c, w * 0.5, h * 0.84, h * 0.4);
    artGlow(c, w * 0.5, h * 0.74, h * 0.16, '#ffe27a', 0.35 + Math.sin(t * 3) * 0.15);
    storyRider(c, w * 0.18, h * 0.8, h * 0.0026, 1, false, t);
    storyBunnies(c, w * 0.66, h * 0.92, h * 0.06, 3, t, true, 1.6);
  },
  red: function (c, w, h, t) {
    storySky(c, w, h, '#8fd0ff', '#e6f6ff');
    storySea(c, w, h, h * 0.7, t, false);
    storyRainbow(c, w * 0.5, h * 0.78, h * 0.6, h * 0.05, 1);
    if ((t % 1.2) < 0.8) artGlow(c, w * 0.5 - h * 0.6, h * 0.74, h * 0.1, '#ff5a5a', 0.6);
    storyIsland(c, w * 0.5, h * 0.84, h * 0.13);
    drawCastle(c, w * 0.5, h * 0.8, h * 0.16);
  },
  cloud: function (c, w, h, t) {
    storySky(c, w, h, '#8fd0ff', '#e6f6ff');
    storySea(c, w, h, h * 0.5, t, false);
    storyIsland(c, w * 0.2, h * 0.78, h * 0.12);
    storyIsland(c, w * 0.72, h * 0.66, h * 0.1, '#ffb3d1');
    drawWitchCloud(c, w * 0.72, h * 0.3, h * 0.11, t, 0.8);
    // Vene seuraa pilveä
    var k = (t * 0.12) % 1, bx = w * (0.22 + k * 0.35), by = h * (0.8 - k * 0.1);
    drawBoatWithRider(c, bx, by, h * 0.16, 1, true);
  },
  goldstar: function (c, w, h, t) {
    storySky(c, w, h, '#8fd0ff', '#f0faff');
    storySea(c, w, h, h * 0.72, t, false);
    storyRainbow(c, w * 0.5, h * 0.8, h * 0.6, h * 0.05, 7);
    var i;
    for (i = 0; i < 8; i++) {
      var a = t * 1.2 + i * Math.PI / 4;
      drawStar(c, w * 0.5 + Math.cos(a) * h * 0.14, h * 0.2 + Math.sin(a) * h * 0.1, h * 0.015, a, 0);
    }
    drawStar(c, w * 0.5, h * 0.2, h * 0.075, t * 0.5, 1);
  },
  north: function (c, w, h, t) {
    storySky(c, w, h, '#2a2a6a', '#5a6ab0');
    if (typeof drawAuroraCurtain === 'function') drawAuroraCurtain(c, w, h, t, 0);
    storySea(c, w, h, h * 0.7, t, true);
    storyIsland(c, w * 0.75, h * 0.76, h * 0.12, '#e8f4ff');
    var k = Math.min(1, t / 3);
    drawWitchCloud(c, w * (0.3 + k * 0.4), h * (0.35 - k * 0.12), h * 0.1, t, 0.5);
  },
  fox: function (c, w, h, t) {
    storySky(c, w, h, '#2a2a6a', '#5a6ab0');
    if (typeof drawAuroraCurtain === 'function') drawAuroraCurtain(c, w, h, t, 0);
    storyHill(c, w, h, h * 0.72, '#eef6ff', 0.6);
    if (typeof drawFoxShrine === 'function') drawFoxShrine(c, w * 0.62, h * 0.74, h * 0.18, true);
    storyRider(c, w * 0.25, h * 0.72, h * 0.0028, 1, false, t);
    // Tähtipolku näyttää suunnan
    var i;
    for (i = 0; i < 6; i++) {
      var k2 = (i / 6 + t * 0.15) % 1;
      drawStar(c, w * (0.7 + k2 * 0.3), h * (0.6 - k2 * 0.35), h * 0.015, t + i, 1);
    }
  },
  farland: function (c, w, h, t) {
    storySky(c, w, h, '#ffd8a8', '#fff2d8');
    storySea(c, w, h, h * 0.62, t, false);
    // Manner horisontissa: vuoret ja tulivuori
    c.beginPath();
    c.moveTo(w * 0.35, h * 0.63);
    c.lineTo(w * 0.48, h * 0.42); c.lineTo(w * 0.56, h * 0.52); c.lineTo(w * 0.68, h * 0.34);
    c.lineTo(w * 0.8, h * 0.5); c.lineTo(w * 0.9, h * 0.44); c.lineTo(w * 1.02, h * 0.63);
    c.closePath();
    artFillPath(c, '#9a88c8', h * 0.34, h * 0.63, h * 0.2, { lineColor: '#6a5aa0' });
    drawWitchCloud(c, w * 0.68, h * 0.24, h * 0.1, t, 0.6);
    drawBoatWithRider(c, w * 0.22, h * 0.8, h * 0.18, 1, true);
  },
  sunhidden: function (c, w, h, t) {
    storySky(c, w, h, '#9a9ac8', '#e0e0f0');
    storySun(c, w * 0.6, h * 0.3, h * 0.11, t);
    drawWitchCloud(c, w * 0.6, h * 0.32, h * 0.2, t, 0.9);
    storyHill(c, w, h, h * 0.74, '#9ac87a', 1);
    storyRider(c, w * 0.22, h * 0.76, h * 0.003, 1, false, t);
  },
  rays: function (c, w, h, t) {
    storySky(c, w, h, '#a8dcff', '#fff2d8');
    var i, n = landRayPlaces().length, lit = Math.min(n, Math.floor(t * 1.5)), a;
    var sx = w * 0.5, sy = h * 0.42, r = h * 0.12;
    for (i = 0; i < n; i++) {
      a = Math.PI + (i + 0.5) / n * Math.PI;
      c.strokeStyle = i < lit ? '#ffd24f' : 'rgba(200,190,220,0.6)';
      c.lineWidth = h * 0.035;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(sx + Math.cos(a) * r * 1.35, sy + Math.sin(a) * r * 1.35);
      c.lineTo(sx + Math.cos(a) * r * 2.2, sy + Math.sin(a) * r * 2.2);
      c.stroke();
    }
    artCircle(c, sx, sy, r, '#ffd24f', { lineColor: '#e0a020', hi: 0.4 });
    artEye(c, sx - r * 0.3, sy - r * 0.1, r * 0.12, 0, false);
    artEye(c, sx + r * 0.3, sy - r * 0.1, r * 0.12, 0, false);
    c.strokeStyle = '#b06a10';
    c.lineWidth = r * 0.08;
    c.beginPath(); c.arc(sx, sy + r * 0.15, r * 0.3, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    storyHill(c, w, h, h * 0.8, '#8fd673', 1);
  }
};

// Lopun kohtaukset (Myrskyvuori ja ystävyys)
function storyMountain(c, w, h, top) {
  c.beginPath();
  c.moveTo(w * 0.15, h);
  c.lineTo(w * 0.45, top); c.lineTo(w * 0.52, top + h * 0.05); c.lineTo(w * 0.58, top - h * 0.02);
  c.lineTo(w * 0.9, h);
  c.closePath();
  artFillPath(c, '#8a86b8', top, h, h * 0.3, { lineColor: '#5a5688' });
  c.beginPath();
  c.moveTo(w * 0.4, top + h * 0.08); c.lineTo(w * 0.45, top); c.lineTo(w * 0.52, top + h * 0.05);
  c.lineTo(w * 0.58, top - h * 0.02); c.lineTo(w * 0.63, top + h * 0.09);
  c.lineTo(w * 0.55, top + h * 0.12); c.lineTo(w * 0.48, top + h * 0.1);
  c.closePath();
  artFillPath(c, '#f4f2ff', top, top + h * 0.12, h * 0.1, { lineColor: '#9a96c8' });
}
function storySunRays(c, x, y, r, t, n) {
  var i, a;
  c.lineCap = 'round';
  for (i = 0; i < n; i++) {
    a = -Math.PI / 2 + i / n * Math.PI * 2 + t * 0.3;
    c.strokeStyle = 'rgba(255,190,40,0.9)';
    c.lineWidth = r * 0.3;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    c.lineTo(x + Math.cos(a) * r * (2.2 + Math.sin(t * 3 + i) * 0.15), y + Math.sin(a) * r * (2.2 + Math.sin(t * 3 + i) * 0.15));
    c.stroke();
  }
  artCircle(c, x, y, r, '#ffd24f', { lineColor: '#e0a020', hi: 0.4 });
  artEye(c, x - r * 0.3, y - r * 0.1, r * 0.12, 0, false);
  artEye(c, x + r * 0.3, y - r * 0.1, r * 0.12, 0, false);
  c.strokeStyle = '#b06a10';
  c.lineWidth = r * 0.08;
  c.beginPath(); c.arc(x, y + r * 0.15, r * 0.3, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
}
STORY_SCENES.sunfull = function (c, w, h, t) {
  storySky(c, w, h, '#ffe9a8', '#fff8e0');
  storySunRays(c, w * 0.5, h * 0.42, h * 0.13, t, 7);
  storyHill(c, w, h, h * 0.82, '#8fd673', 1);
  storyRider(c, w * 0.2, h * 0.84, h * 0.0026, 1, false, t);
};
STORY_SCENES.mountain = function (c, w, h, t) {
  storySky(c, w, h, '#a8b8e8', '#e8ecff');
  storyMountain(c, w, h, h * 0.25);
  drawWitchCloud(c, w * 0.52, h * 0.16, h * 0.12, t, 0.8);
  storyHill(c, w, h, h * 0.84, '#8fd673', 0.6);
  storySunRays(c, w * 0.12, h * 0.18, h * 0.06, t, 7);
  storyRider(c, w * 0.25 + Math.min(1, t / 3) * w * 0.1, h * 0.88, h * 0.0024, 1, true, t);
};
STORY_SCENES.witchsad = function (c, w, h, t) {
  storySky(c, w, h, '#8a8ab8', '#c8c8e8');
  storyMountain(c, w, h, h * 0.45);
  drawWitchCloud(c, w * 0.5, h * 0.16, h * 0.15, t, 1);
  drawStormWitch(c, w * 0.52, h * 0.5 + Math.sin(t * 1.5) * h * 0.01, h * 0.075, -1, 'sad');
};
STORY_SCENES.lonely = function (c, w, h, t) {
  storySky(c, w, h, '#8fd0ff', '#e6f6ff');
  storyHill(c, w, h, h * 0.74, '#8fd673', 1);
  // Kaukana juhlat: liput ja ilmapallot, noita katsoo vuoren rinteeltä
  var i;
  for (i = 0; i < 4; i++) {
    var bx = w * (0.62 + i * 0.08), by = h * (0.4 + Math.sin(t * 2 + i) * 0.02);
    c.strokeStyle = 'rgba(90,60,120,0.5)';
    c.lineWidth = h * 0.004;
    c.beginPath(); c.moveTo(bx, by + h * 0.05); c.lineTo(bx, h * 0.72); c.stroke();
    artBlob(c, bx, by, h * 0.035, h * 0.045, RAINBOW_COLORS[i * 2 % 7], { lineColor: artShade(RAINBOW_COLORS[i * 2 % 7], -0.35) });
  }
  storyBunnies(c, w * 0.66, h * 0.88, h * 0.05, 3, t, true, 1.8);
  storyMountain(c, w * 0.6, h, h * 0.4);
  drawStormWitch(c, w * 0.26, h * 0.62, h * 0.06, 1, 'sad');
};
STORY_SCENES.rainbowbirth = function (c, w, h, t) {
  storySky(c, w, h, '#a8dcff', '#fff2d8');
  var n = Math.min(7, Math.floor(t * 2.5));
  storyRainbow(c, w * 0.5, h * 0.86, h * 0.62, h * 0.05, n);
  drawWitchCloud(c, w * 0.22, h * 0.22, h * 0.11, t, 1);
  storySunRays(c, w * 0.8, h * 0.2, h * 0.07, t, 7);
  storyHill(c, w, h, h * 0.84, '#8fd673', 0.6);
  drawStormWitch(c, w * 0.22, h * 0.5, h * 0.06, 1, n >= 7 ? 'happy' : 'sad');
};
STORY_SCENES.invite = function (c, w, h, t) {
  storySky(c, w, h, '#ffe0f0', '#fff6e8');
  storyRainbow(c, w * 0.5, h * 0.9, h * 0.75, h * 0.04, 7, 0.6);
  storyHill(c, w, h, h * 0.8, '#8fd673', 0.5);
  drawCastle(c, w * 0.78, h * 0.84, h * 0.3);
  storyRider(c, w * 0.3, h * 0.82, h * 0.0028, 1, false, t);
  drawStormWitch(c, w * 0.55, h * 0.55 + Math.sin(t * 2) * h * 0.02, h * 0.06, -1, 'happy');
};
STORY_SCENES.party = function (c, w, h, t) {
  storySky(c, w, h, '#8fd0ff', '#e6f6ff');
  storyRainbow(c, w * 0.5, h * 0.82, h * 0.62, h * 0.045, 7);
  drawStar(c, w * 0.5, h * 0.17, h * 0.05, t, 1);
  storyHill(c, w, h, h * 0.76, '#8fd673', 1);
  drawCastle(c, w * 0.5, h * 0.8, h * 0.3);
  storyRider(c, w * 0.18, h * 0.86, h * 0.0026, 1, false, t);
  storyBunnies(c, w * 0.32, h * 0.92, h * 0.05, 3, t, true, 1.6);
  drawStormWitch(c, w * 0.78, h * 0.58 + Math.sin(t * 3) * h * 0.02, h * 0.055, -1, 'happy');
  // Konfetti
  var i;
  for (i = 0; i < 24; i++) {
    var k = (t * 0.25 + i * 0.137) % 1;
    c.fillStyle = RAINBOW_COLORS[i % 7];
    c.save();
    c.translate(w * ((i * 0.293) % 1), h * k);
    c.rotate(t * 3 + i);
    c.fillRect(-h * 0.008, -h * 0.004, h * 0.016, h * 0.008);
    c.restore();
  }
};

// ---------- Tarinakirja (linnasta) ----------
// Luettelo nähdyistä luvuista kansikuvina; kannen napautus lukee luvun ja
// palaa luetteloon. Takaisin-nappi (karttaBtn) palaa linnakartalle.
function storyBookChapters() {
  var out = [], i;
  for (i = 0; i < STORY_CHAPTERS.length; i++) if (storySeen[STORY_CHAPTERS[i].id]) out.push(STORY_CHAPTERS[i]);
  return out;
}
function storyBookOpen() {
  var i;
  mode = 'book';
  running = false;
  holding = false;
  storyBook = { t: 0 };
  fadeStart();
  document.getElementById('hubChrome').style.display = 'none';
  for (i = 0; i < STORY_HIDE_BTNS.length; i++) document.getElementById(STORY_HIDE_BTNS[i]).style.display = 'none';
  document.getElementById('karttaBtn').style.display = 'block';
  document.getElementById('muteBtn').style.display = 'block';
  document.body.style.background = '#fff6e8';
  lastTime = 0;
}
function storyBookLayout() {
  var chs = storyBookChapters(), n = chs.length, cols = Math.min(3, Math.max(1, n));
  var rows = Math.max(1, Math.ceil(n / cols));
  var top = viewH * 0.2, gap = viewH * 0.04;
  var cw = Math.min((viewW * 0.9 - gap * (cols - 1)) / cols, viewH * 0.5);
  var ch = Math.min(cw * 0.6, (viewH * 0.75 - gap * (rows - 1)) / rows - viewH * 0.06);
  cw = ch / 0.6;
  var x0 = (viewW - (cols * cw + (cols - 1) * gap)) / 2, out = [], i;
  for (i = 0; i < n; i++) {
    out.push({ ch: chs[i], x: x0 + (i % cols) * (cw + gap), y: top + Math.floor(i / cols) * (ch + gap + viewH * 0.06), w: cw, h: ch });
  }
  return out;
}
function handleBookTap(px, py) {
  var lay = storyBookLayout(), i, r;
  initAudio();
  for (i = 0; i < lay.length; i++) {
    r = lay[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h + viewH * 0.06) {
      storyShow(r.ch.id, storyBookOpen, true);
      return;
    }
  }
}
function updateBook(dt) {
  globalT += dt;
  if (storyBook) storyBook.t += dt;
}
function drawBook() {
  var c = ctx, lay = storyBookLayout(), i, r;
  var bg = c.createLinearGradient(0, 0, 0, viewH);
  bg.addColorStop(0, '#fff6e8');
  bg.addColorStop(1, '#f6e2ff');
  c.fillStyle = bg;
  c.fillRect(0, 0, viewW, viewH);
  storyText(c, 'TARINAKIRJA', viewW / 2, viewH * 0.09, viewW * 0.8, viewH * 0.07);
  for (i = 0; i < lay.length; i++) {
    r = lay[i];
    c.save();
    c.translate(r.x, r.y);
    storyDrawCard(c, r.ch.cover, r.w, r.h, globalT);
    c.restore();
    storyText(c, r.ch.title, r.x + r.w / 2, r.y + r.h + viewH * 0.045, r.w, viewH * 0.04);
  }
}

// ---------- Myrskypilvi kartoilla ----------
// Noidan pilvi leijuu sen paikan yllä, jonne hän pakeni: ennen finaalia
// Linnasaaren yllä, sitten aina seuraavan saaren yllä, lopuksi avomerimerkin
// yllä (Kaukamaalle). Kun vartija palauttaa värin, pilvi lähtee läpäistyltä
// saarelta seuraavalle paljastuksen jälkeen. Napautus: noita kurkistaa ja kikattaa.
var mapWitch = { x: 0, y: 0, delay: 0, poke: 0, on: false };

function seaWitchSpot(isl) {
  var p = seaIslandPos(isl);
  return { x: p.x + p.r * 0.75, y: p.y - p.r * 1.05 };
}
function seaWitchTarget() {
  var nx;
  if (!storyWorldDone('Linnasaari')) return seaWitchSpot(ISLANDS[0]);
  nx = seaNextIsland();
  if (nx) return seaWitchSpot(nx);
  if (landUnlocked()) {
    var e = seaExitPos();
    return { x: e.x - e.r * 0.4, y: e.y - e.r * 2.6 };
  }
  return null;
}
// Kartan avaus: pilvi paikalleen, tai juuri läpäistyn saaren ylle odottamaan
function seaWitchReset(fromIsl) {
  var t = seaWitchTarget(), f;
  mapWitch.on = !!t;
  mapWitch.poke = 0;
  if (!t) return;
  f = fromIsl ? seaWitchSpot(fromIsl) : t;
  mapWitch.x = f.x;
  mapWitch.y = f.y;
  mapWitch.delay = fromIsl ? 2.6 : 0;
}
function landWitchReset() {
  mapWitch.on = true;
  mapWitch.poke = 0;
  mapWitch.delay = 0;
  // Pilvi peittää Kaukamaan auringon reunaa (säteet näkyvät sen takaa)
  mapWitch.x = viewW * 0.80;
  mapWitch.y = viewH * 0.15;
}
function mapWitchUpdate(dt, target) {
  if (!mapWitch.on) return;
  if (mapWitch.poke > 0) mapWitch.poke -= dt;
  if (mapWitch.delay > 0) { mapWitch.delay -= dt; return; }
  if (!target) return;
  var k = Math.min(1, dt * 1.2);
  mapWitch.x += (target.x - mapWitch.x) * k;
  mapWitch.y += (target.y - mapWitch.y) * k;
}
function drawMapWitch(c) {
  if (!mapWitch.on) return;
  var s = viewH * 0.045, bob = Math.sin(globalT * 1.6) * viewH * 0.006;
  var x = mapWitch.x, y = mapWitch.y + bob;
  if (mapWitch.poke > 0) {
    // Noita nousee pilven takaa ja painuu takaisin
    var k = Math.sin(Math.min(1, (1.4 - mapWitch.poke) / 1.4) * Math.PI);
    drawStormWitch(c, x + s * 0.2, y - s * 0.2 - k * s * 1.3, s * 0.45, -1, 'grumpy');
  }
  drawWitchCloud(c, x, y, s, globalT, 0.7);
}
function mapWitchTap(px, py) {
  if (!mapWitch.on) return false;
  var s = viewH * 0.045;
  if (Math.abs(px - mapWitch.x) > s * 1.3 || Math.abs(py - mapWitch.y) > s * 1.0) return false;
  if (mapWitch.poke <= 0) {
    mapWitch.poke = 1.4;
    playNote(784, 0, 0.08, 'square', 0.12);
    playNote(698, 0.09, 0.08, 'square', 0.12);
    playNote(622, 0.18, 0.08, 'square', 0.12);
    playNote(587, 0.27, 0.16, 'square', 0.12);
  }
  return true;
}

// ---------- Kaukamaan aurinko ----------
// Jokaisen Kaukamaan paikan vartija antaa auringolle yhden säteen (luku 'kaukamaa').
// Säteet piirretään kartan aurinkoon; uusi säde kasvaa esiin, kun kartalle palataan.
var landRays = { reveal: -1, t: 0 };
// Kaukamaan viimeinen paikka (rekisterissä place.final): Myrskyvuori
function landFinalPlace() {
  var i;
  for (i = 0; i < LAND_PLACES.length; i++) if (LAND_PLACES[i].final) return LAND_PLACES[i];
  return null;
}
function landRayPlaces() {
  var out = [], i;
  for (i = 0; i < LAND_PLACES.length; i++) if (!LAND_PLACES[i].final) out.push(LAND_PLACES[i]);
  return out;
}
function landRaysEarned() {
  var n = 0, i, ps = landRayPlaces();
  for (i = 0; i < ps.length; i++) if (islandDone(ps[i])) n++;
  return n;
}
function landRaysShown() {
  return storySeen.rays | 0;
}
// Kartan avaus: aloita seuraavan ansaitun säteen paljastus
function landRaysCheck() {
  landRays.reveal = -1;
  if (landRaysEarned() > landRaysShown()) {
    landRays.reveal = landRaysShown();
    landRays.t = 0;
    if (landRaysEarned() - landRays.reveal > 1) playNote(659 + landRays.reveal * 60, 0, 0.2, 'triangle', 0.3);
    else soundFanfare();
  }
}
function landRaysUpdate(dt) {
  if (landRays.reveal < 0) return;
  landRays.t += dt;
  // Monta odottavaa sädettä (esim. vanha tallennus): paljastetaan reippaammin peräkkäin
  if (landRays.t > (landRaysEarned() - landRays.reveal > 1 ? 0.9 : 2.2)) {
    storySeen.rays = landRays.reveal + 1;
    saveProgress();
    landRaysCheck();
  }
}
function drawLandRays(c) {
  var n = landRayPlaces().length, got = landRaysShown(), i, a, len, k, x0, y0;
  var sx = viewW * 0.86, sy = viewH * 0.10, r = viewH * 0.045;
  c.lineCap = 'round';
  for (i = 0; i < n; i++) {
    a = -Math.PI / 2 + (i / n) * Math.PI * 2 + Math.sin(globalT * 0.4) * 0.03;
    x0 = sx + Math.cos(a) * r * 1.35;
    y0 = sy + Math.sin(a) * r * 1.35;
    if (i < got || i === landRays.reveal) {
      k = i === landRays.reveal ? easeOutBack(Math.min(1, landRays.t / 1.2)) : 1;
      len = r * (1.1 + Math.sin(globalT * 3 + i) * 0.08) * k;
      c.strokeStyle = 'rgba(255,190,40,0.9)';
      c.lineWidth = r * 0.34;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); c.stroke();
      c.strokeStyle = '#fff1a8';
      c.lineWidth = r * 0.16;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); c.stroke();
      if (i === landRays.reveal && landRays.t < 1.6) {
        drawStar(c, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, r * 0.35 * (1 - landRays.t / 1.6), globalT * 3, 1);
      }
    } else {
      c.strokeStyle = 'rgba(200,190,220,0.6)';
      c.lineWidth = r * 0.2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * r * 0.35, y0 + Math.sin(a) * r * 0.35); c.stroke();
    }
  }
}
