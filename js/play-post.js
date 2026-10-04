'use strict';

// Postireitti (Kaukamaa, Maalaiskylä): paikan vartija ja Pupupolun isompi
// sukulainen (palaute: pupun ohjelmointi on suosikki, ja siitä toivottiin
// isompaa ja haastavampaa). Postipupu jakaa kirjeitä kylän kaduilla.
// Ohjelma kootaan kuten Pupupolussa: nuolet ohjelmariville, ×2 / ×3 kertaa
// viimeisen nuolen, rivin ruudun napautus poistaa sen ja ▶ ajaa.
// Talon ovessa on numero ja ikkunassa asukas (lehmä, kana, possu...). Kirjeessä
// on numero tai asukkaan kuva. SÄÄNTÖ: kun pupu hyppää talon oven eteen
// (postilaatikon ruutuun), sinne kuuluva kirje lentää laatikkoon itsestään.
// Väärän talon ovella kirje pyrähtää laatikolle ja palaa (asukas pudistaa
// päätään), ajo jatkuu. Kierros ratkeaa heti, kun viimeinen kirje on perillä.
// Talo, puu, heinäpaali, joki, nostettu silta tai reuna pysäyttää pupun (!),
// ja kirjeet palaavat laukkuun; ohjelma jää korjattavaksi. Ei sydämiä.
// Uutta Pupupolkuun nähden: isompi kylä, useampi kirje samalla ajolla,
// JÄRJESTYS (laukussa kirjeet jonossa: vain ensimmäinen lähtee, muiden ovilla
// kirje palaa) ja SILTA, joka laskeutuu, kun pupu käy kääntämässä vivun.
// Neljä arvottua, kovenevaa kierrosta. Jokainen kylä tarkistetaan
// leveyshaulla ratkeavaksi, ja ehdot takaavat, että toistonapit, järjestys ja
// vipu todella tarvitaan. Ensimmäisellä ajolla onnistunut kierros antaa
// kultaisen postimerkin. Tehtävät 1. ja 2. kierroksen jälkeen (maksu, sana).
// Lopuksi kylän juhlat: asukkaat tulevat ulos ja liput liehuvat.

// cols × rows, letters: kirjeitä, houses: taloja (loput hämäystaloja),
// order: kirjeet jaetaan laukun järjestyksessä, bridge: joki, silta ja vipu,
// mult: toistonapit (pakollisia: reitti on pidempi kuin rivi), slots: rivin
// pituus, len: lyhimmän reitin askeleet, obst: puita ja paaleja,
// label: kirjeen merkki ('pic' asukas, 'num' numero, 'mix' sekaisin)
var POST_ROUNDS = [
  { cols: 6, rows: 5, letters: 2, houses: 3, order: false, bridge: false, mult: false, slots: 10, len: [6, 9], obst: 5, label: 'pic' },
  { cols: 7, rows: 5, letters: 2, houses: 4, order: false, bridge: true, mult: true, slots: 7, len: [9, 13], obst: 4, label: 'num' },
  { cols: 7, rows: 6, letters: 3, houses: 4, order: true, bridge: false, mult: true, slots: 8, len: [10, 14], obst: 7, label: 'pic' },
  { cols: 8, rows: 6, letters: 3, houses: 5, order: true, bridge: true, mult: true, slots: 10, len: [12, 16], obst: 5, label: 'mix' }
];
var POST_STEP_T = 0.42;  // askeleen kesto ajossa (s)
var POST_KINDS = ['cow', 'hen', 'pig', 'sheep', 'cat', 'dog'];
var POST_COLORS = ['#ffb3a8', '#ffe08a', '#a8d8ff', '#c4eea0', '#dcc0ff', '#ffcf9a'];

var post = {
  round: 0, state: 'intro', t: 0, R: null, L: null, prog: [], running: false, steps: [], step: -1, stepT: 0,
  bunny: { c: 0, r: 0, fc: 0, fr: 0, hop: 0, facing: 1 }, done: [], leverOn: false, bridgeA: 0,
  failT: 0, crash: '', runs: 0, gold: [], taskDelay: -1, hintT: 0, tapped: false, shakeT: 0,
  flies: [], showT: 0, showI: -1, wonT: 0, leverWig: 0, prep: null, bagT: 9
};

// ---------- Säännöt (puhtaita: arvonta, ratkaisija ja ajo käyttävät samoja) ----------
function postRand(n) { return Math.floor(Math.random() * n); }
function postKey(c, r) { return c + ',' + r; }
function postOpen(L, c, r, lever) {
  if (c < 0 || r < 0 || c >= L.cols || r >= L.rows) return false;
  if (L.block[postKey(c, r)]) return false;
  if (L.bridge && c === L.bridge.c && r === L.bridge.r && !lever) return false;
  return true;
}
// Ruutuun astuminen: palauttaa uuden jaettujen kirjeiden bittimaskin.
// Järjestyksessä kirje i lähtee vain, kun kaikki sitä ennen on jaettu.
function postDeliverAt(L, m, c, r, ordered) {
  var h = L.doorAt[postKey(c, r)], i;
  if (h === undefined) return m;
  i = L.letterOf[h];
  if (i < 0 || (m & (1 << i))) return m;
  if (ordered && m !== (1 << i) - 1) return m;
  return m | (1 << i);
}
// Leveyshaku tilassa (paikka, jaetut kirjeet, vipu): lyhin reitti suuntina
// Tila numerona: ((ruutu << n) | maski) << 1 | vipu. Säännöt postOpen / postDeliverAt.
function postSolve(L, ordered, noLever) {
  var n = L.letters.length, full = (1 << n) - 1, cols = L.cols, rows = L.rows, cells = cols * rows;
  var size = cells << (n + 1), prev = new Int32Array(size), pdir = new Int8Array(size), q = new Int32Array(size);
  var open = L.og, door = [], i, c, r, head = 0, tail = 0, goal = -1, s, cell, m, k, d, nc, nr, nm, nk, nid;
  var lever = !noLever && L.lever ? L.lever.r * cols + L.lever.c : -1, bridge = L.bridge ? L.bridge.r * cols + L.bridge.c : -1;
  for (i = 0; i < cells; i++) door.push(L.dh[i] < 0 ? -1 : L.letterOf[L.dh[i]]);
  for (i = 0; i < size; i++) prev[i] = -2;
  s = ((L.start.r * cols + L.start.c) << (n + 1));
  prev[s] = -1;
  q[tail++] = s;
  while (head < tail && goal < 0) {
    s = q[head++];
    k = s & 1; m = (s >> 1) & full; cell = s >> (n + 1);
    c = cell % cols; r = (cell - c) / cols;
    for (d = 0; d < 4; d++) {
      nc = c + BCODE_DIRS[d][0]; nr = r + BCODE_DIRS[d][1];
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      i = nr * cols + nc;
      if (!open[i] || (i === bridge && !k)) continue;
      nk = i === lever ? 1 : k;
      nm = m;
      if (door[i] >= 0 && !(m & (1 << door[i])) && (!ordered || m === (1 << door[i]) - 1)) nm = m | (1 << door[i]);
      nid = (((i << n) | nm) << 1) | nk;
      if (prev[nid] !== -2) continue;
      prev[nid] = s;
      pdir[nid] = d;
      if (nm === full) { goal = nid; break; }
      q[tail++] = nid;
    }
  }
  if (goal < 0) return null;
  var path = [];
  while (prev[goal] >= 0) { path.unshift(pdir[goal]); goal = prev[goal]; }
  return path;
}
// Reitti käskyiksi: peräkkäiset samat suunnat yhdeksi (toistonapilla enintään ×3)
function postCompress(path, mult) {
  var out = [], i = 0, run;
  while (i < path.length) {
    run = 1;
    while (mult && i + run < path.length && path[i + run] === path[i] && run < BCODE_MAX_RUN) run++;
    out.push({ dir: path[i], n: run });
    i += run;
  }
  return out;
}

// ---------- Arvonta ----------
function postTryGenerate(R) {
  var L = { R: R, cols: R.cols, rows: R.rows, block: {}, houses: [], letters: [], doorAt: {}, letterOf: [], start: null, lever: null, bridge: null, river: -1 };
  // Nopeat taulukot ratkaisijalle: og = ruutu auki, dh = oven talo (-1 = ei ovea)
  L.og = new Uint8Array(R.cols * R.rows); L.dh = new Int8Array(R.cols * R.rows);
  for (i = 0; i < R.cols * R.rows; i++) { L.og[i] = 1; L.dh[i] = -1; }
  var used = {}, cells = [], i, c, r, p, nums, kinds, cols, idx, path, k, free;
  if (R.bridge) {
    L.river = 2 + postRand(R.cols - 4);
    L.bridge = { c: L.river, r: postRand(R.rows) };
    for (r = 0; r < R.rows; r++) {
      used[postKey(L.river, r)] = true;
      if (r !== L.bridge.r) { L.block[postKey(L.river, r)] = 'water'; L.og[r * R.cols + L.river] = 0; }
    }
    // Sillan päät pidetään katuna
    used[postKey(L.river - 1, L.bridge.r)] = true;
    used[postKey(L.river + 1, L.bridge.r)] = true;
  }
  // Talot: talon ruutu ja sen alla oven edusta (postilaatikko), molemmat vapaita
  for (r = 0; r < R.rows - 1; r++) for (c = 0; c < R.cols; c++) cells.push({ c: c, r: r });
  shuffleNums(cells);
  for (i = 0; i < cells.length && L.houses.length < R.houses; i++) {
    p = cells[i];
    if (used[postKey(p.c, p.r)] || used[postKey(p.c, p.r + 1)]) continue;
    used[postKey(p.c, p.r)] = true;
    used[postKey(p.c, p.r + 1)] = true;
    L.block[postKey(p.c, p.r)] = 'house';
    L.og[p.r * R.cols + p.c] = 0;
    L.doorAt[postKey(p.c, p.r + 1)] = L.houses.length;
    L.dh[(p.r + 1) * R.cols + p.c] = L.houses.length;
    L.houses.push({ c: p.c, r: p.r, dc: p.c, dr: p.r + 1 });
  }
  if (L.houses.length < R.houses) return null;
  free = [];
  for (r = 0; r < R.rows; r++) for (c = 0; c < R.cols; c++) if (!used[postKey(c, r)]) free.push({ c: c, r: r });
  shuffleNums(free);
  if (free.length < 2 + R.obst) return null;
  L.start = free.pop();
  if (R.bridge) {
    // Vipu samalle puolelle jokea kuin lähtö (muuten kylä ei ratkea)
    for (i = free.length - 1; i >= 0; i--) if ((free[i].c < L.river) === (L.start.c < L.river)) break;
    if (i < 0) return null;
    L.lever = free.splice(i, 1)[0];
  }
  // Merkit: numero, asukas ja väri jokaiselle talolle
  nums = shuffleNums([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  kinds = shuffleNums(POST_KINDS.slice());
  cols = shuffleNums(POST_COLORS.slice());
  for (i = 0; i < L.houses.length; i++) {
    L.houses[i].num = nums[i];
    L.houses[i].kind = kinds[i];
    L.houses[i].color = cols[i];
    L.letterOf.push(-1);
  }
  // Kirjeet: muutama arvonta samaan kylään, kunnes reitti ei ole liian pitkä
  // (esteet voivat vain pidentää sitä)
  for (var pick = 0; pick < 6; pick++) {
    idx = [];
    for (i = 0; i < L.houses.length; i++) { idx.push(i); L.letterOf[i] = -1; }
    shuffleNums(idx);
    if (R.bridge) {
      // Ainakin yksi kirje joen toiselle puolelle, jotta vipu tarvitaan
      for (i = 0; i < idx.length; i++) if ((L.houses[idx[i]].c < L.river) !== (L.start.c < L.river)) break;
      if (i >= idx.length) return null;
      k = idx[i]; idx[i] = idx[0]; idx[0] = k;
      shuffleNums(idx.slice(0, R.letters)).forEach(function (v, j) { idx[j] = v; });
    }
    L.letters = [];
    for (i = 0; i < R.letters; i++) {
      L.letters.push({ h: idx[i], show: R.label === 'mix' ? (i % 2 ? 'num' : 'pic') : R.label });
      L.letterOf[idx[i]] = i;
    }
    path = postSolve(L, R.order);
    if (path && path.length <= R.len[1]) break;
  }
  if (!path || path.length > R.len[1]) return null;
  if (R.label === 'mix' && Math.random() < 0.5) for (i = 0; i < L.letters.length; i++) L.letters[i].show = L.letters[i].show === 'num' ? 'pic' : 'num';
  // Esteet yksi kerrallaan: reitin ulkopuolinen ei voi sulkea kylää, reitille
  // osuva hyväksytään vain, jos kylä ratkeaa yhä (reitti pitenee kiertoteistä)
  for (i = 0, k = 0; i < free.length && k < R.obst; i++) {
    p = free[i];
    L.block[postKey(p.c, p.r)] = 'obst';
    L.og[p.r * R.cols + p.c] = 0;
    if (postOnPath(L, path, p)) {
      var np = postSolve(L, R.order);
      if (!np || np.length > R.len[1]) { delete L.block[postKey(p.c, p.r)]; L.og[p.r * R.cols + p.c] = 1; continue; }
      path = np;
    }
    k++;
  }
  if (k < R.obst) return null;
  if (path.length < R.len[0] || path.length > R.len[1]) return null;
  if (bcodeTurns(path) < 3) return null;
  k = postCompress(path, R.mult).length;
  if (k > R.slots) return null;
  // Toistonapit on pakko käyttää: ilman niitä reitti ei mahdu riville
  if (R.mult && path.length <= R.slots) return null;
  // Järjestyksen on muutettava reittiä: vapaassa järjestyksessä se olisi lyhyempi
  if (R.order) {
    var free2 = postSolve(L, false);
    if (!free2 || free2.length >= path.length) return null;
  }
  // Vipu on pakko käydä kääntämässä
  if (R.bridge && postSolve(L, R.order, true)) return null;
  L.solution = path;
  return L;
}
function postOnPath(L, path, p) {
  var c = L.start.c, r = L.start.r, i;
  for (i = 0; i < path.length; i++) {
    c += BCODE_DIRS[path[i]][0]; r += BCODE_DIRS[path[i]][1];
    if (c === p.c && r === p.r) return true;
  }
  return false;
}
function postGenerate(R) {
  var i, L;
  for (i = 0; i < 20000; i++) {
    L = postTryGenerate(R);
    if (L) { L.tries = i + 1; return L; }
  }
  return null;
}

// Seuraavan kierroksen kylä arvotaan valmiiksi pätkissä edellisen kierroksen
// juhlan ja tehtävän aikana (enintään ~6 ms ruudussa), ettei vanha tabletti nyki
function postPump(ri) {
  var t0, L;
  if (ri >= POST_ROUNDS.length) return;
  if (!post.prep || post.prep.ri !== ri) post.prep = { ri: ri, L: null, tries: 0 };
  if (post.prep.L) return;
  t0 = Date.now();
  do { L = postTryGenerate(POST_ROUNDS[ri]); post.prep.tries++; } while (!L && Date.now() - t0 < 6);
  if (L) { L.tries = post.prep.tries; post.prep.L = L; }
}

// ---------- Kierros ----------
function postStartRound() {
  var R = POST_ROUNDS[post.round], L, i;
  L = post.prep && post.prep.ri === post.round && post.prep.L ? post.prep.L : postGenerate(R);
  post.prep = null;
  post.R = R;
  post.L = L;
  for (i = 0; i < L.houses.length; i++) {
    var H = L.houses[i];
    H.peek = 0; H.shake = 0; H.heart = 0; H.flag = 0; H.wig = 0;
  }
  post.prog = [];
  post.running = false;
  post.runs = 0;
  post.state = 'play';
  post.t = 0;
  post.hintT = 0;
  post.flies = [];
  post.showI = -1;
  // Ensimmäisellä kierroksella kirjeet näyttävät katkoviivalla taloonsa
  post.showT = post.round === 0 ? 3.0 : 0;
  // Kirjeet hyppäävät laukussa: järjestyksessä yksi kerrallaan, muuten yhtä aikaa
  post.bagT = 0;
  for (i = 0; i < L.letters.length; i++) playNote(R.order ? 659 + i * 130 : 784, 0.3 + (R.order ? i * 0.35 : 0), 0.12, 'triangle', 0.25);
  postResetRun();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}
function postResetRun() {
  var b = post.bunny, L = post.L, i;
  b.c = L.start.c; b.r = L.start.r; b.fc = b.c; b.fr = b.r; b.hop = 0;
  post.done = [];
  for (i = 0; i < L.letters.length; i++) post.done.push(false);
  for (i = 0; i < L.houses.length; i++) L.houses[i].flag = 0;
  post.leverOn = false;
  post.flies = [];
}
function postTop() {
  var i;
  for (i = 0; i < post.done.length; i++) if (!post.done[i]) return i;
  return -1;
}
function postAllDone() { return postTop() < 0; }

// ---------- Alustus ----------
function initPost() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'wordpick', { maxSyl: 3 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  post.round = 0;
  post.state = 'intro';
  post.t = 0;
  post.R = POST_ROUNDS[0];
  post.L = null;
  post.prep = null;
  post.gold = [];
  post.taskDelay = -1;
  post.hintT = 0;
  post.tapped = false;
  post.prog = [];
  post.flies = [];
  post.wonT = 0;
  postSetupProps();
  renderBackground();
}
function respawnPost() { postStartRound(); }
function resizePost() { camX = 0; postSetupProps(); }

// ---------- Asettelu ----------
function postLayoutFor(R) {
  var W = viewW, h = viewH, areaW = W * 0.54, areaH = h * 0.68;
  var cs = Math.min(areaW / R.cols, areaH / R.rows, h * 0.15);
  return { cs: cs, ox: W * 0.41 - cs * R.cols / 2, oy: h * 0.27 + (areaH - cs * R.rows) / 2 };
}
function postLayout() { return postLayoutFor(post.R || POST_ROUNDS[0]); }
function postCell(c, r, L) {
  L = L || postLayout();
  return { x: L.ox + (c + 0.5) * L.cs, y: L.oy + (r + 0.5) * L.cs };
}
// Postilaatikko oven edustan ruudun yläkulmassa (oven vieressä)
function postBoxPos(H, L) {
  var p = postCell(H.dc, H.dr, L);
  return { x: p.x + L.cs * 0.3, y: p.y - L.cs * 0.2 };
}
function postSlotPos(i) {
  var R = post.R || POST_ROUNDS[0], s = Math.min(viewH * 0.085, viewW * 0.6 / R.slots / 1.1);
  return { x: viewW * 0.41 - (R.slots - 1) * s * 0.55 + i * s * 1.1, y: viewH * 0.15, s: s };
}
function postButtons() {
  var h = viewH, W = viewW, g = Math.min(h * 0.12, W * 0.07), bx = W * 0.84, by = h * 0.4;
  return {
    arrows: [
      { dir: 0, x: bx, y: by - g }, { dir: 1, x: bx + g, y: by },
      { dir: 2, x: bx, y: by + g }, { dir: 3, x: bx - g, y: by }
    ],
    r: g * 0.44,
    play: { x: bx, y: h * 0.84, r: g * 0.55 },
    mult: [{ n: 2, x: bx - g * 0.7, y: h * 0.66 }, { n: 3, x: bx + g * 0.7, y: h * 0.66 }],
    mr: g * 0.36
  };
}
// Postilaukku oikeassa yläkulmassa: kirjeet rivissä (järjestyksessä ensimmäinen vasemmalla)
function postBagPos(i) {
  var n = post.L ? post.L.letters.length : 2, h = viewH, W = viewW;
  var ew = Math.min(h * 0.1, W * 0.25 / (n * 1.3)), gap = ew * 1.3;
  return { x: W * 0.845 - (n - 1) * gap / 2 + i * gap, y: h * 0.1, w: ew, h: ew * 0.7 };
}
// Postitalo vasemmalla ruudukon ulkopuolella (kapeimman kaistan mukaan, ettei osu laudalle)
function postOffice() {
  var w = 1e9, i;
  for (i = 0; i < POST_ROUNDS.length; i++) w = Math.min(w, postLayoutFor(POST_ROUNDS[i]).ox);
  w = Math.max(viewH * 0.12, w);
  var bw = Math.min(w * 0.72, viewH * 0.2);
  return { x: w * 0.47, base: viewH * 0.8, bw: bw, bh: bw * 0.78 };
}

// ---------- Napautus ----------
function handlePostTap(px, py) {
  var b, i, p, R = post.R, L, last;
  if (puzzleBusy() || celebrating) return;
  if (post.state !== 'play' || !post.L) { propsTap(px, py); return; }
  b = postButtons();
  L = postLayout();
  if (!post.running) {
    for (i = 0; i < b.arrows.length; i++) {
      if (Math.hypot(px - b.arrows[i].x, py - b.arrows[i].y) < b.r * 1.25) {
        post.tapped = true;
        if (post.prog.length >= R.slots) { postBuzz(); return; }
        post.prog.push({ dir: b.arrows[i].dir, n: 1, pop: 0.25 });
        playNote(523 + post.prog.length * 35, 0, 0.1, 'triangle', 0.3);
        return;
      }
    }
    if (R.mult) {
      for (i = 0; i < b.mult.length; i++) {
        if (Math.hypot(px - b.mult[i].x, py - b.mult[i].y) < b.mr * 1.3) {
          last = post.prog[post.prog.length - 1];
          if (!last) { postBuzz(); return; }
          last.n = last.n === b.mult[i].n ? 1 : b.mult[i].n;
          last.pop = 0.25;
          playNote(659 + last.n * 80, 0, 0.1, 'triangle', 0.3);
          playNote(880 + last.n * 80, 0.07, 0.1, 'triangle', 0.25);
          return;
        }
      }
    }
    if (Math.hypot(px - b.play.x, py - b.play.y) < b.play.r * 1.3) {
      if (!post.prog.length) { postBuzz(); return; }
      postRun();
      return;
    }
    // Ohjelmarivin ruutu: napautus poistaa sen
    for (i = 0; i < post.prog.length; i++) {
      p = postSlotPos(i);
      if (Math.abs(px - p.x) < p.s * 0.55 && Math.abs(py - p.y) < p.s * 0.6) {
        post.prog.splice(i, 1);
        spawnSparkles(p.x, p.y, 5, '#c9b8e0');
        playNote(392, 0, 0.1, 'sine', 0.25);
        return;
      }
    }
  }
  // Laukun kirje: katkoviiva näyttää, mihin taloon se kuuluu
  for (i = 0; i < post.L.letters.length; i++) {
    p = postBagPos(i);
    if (Math.abs(px - p.x) < p.w * 0.6 && Math.abs(py - p.y) < p.h * 0.75) {
      post.showI = i;
      post.showT = 1.8;
      post.L.houses[post.L.letters[i].h].peek = 1.2;
      playNote(880, 0, 0.08, 'sine', 0.25);
      playNote(1175, 0.08, 0.1, 'sine', 0.2);
      return;
    }
  }
  // Kylän asiat reagoivat
  var bp = postCell(post.bunny.fc, post.bunny.fr, L);
  if (Math.hypot(px - bp.x, py - bp.y) < L.cs * 0.45) { post.bunny.hop = 1; playNote(880, 0, 0.08, 'sine', 0.25); return; }
  var tc = Math.floor((px - L.ox) / L.cs), tr = Math.floor((py - L.oy) / L.cs);
  for (i = 0; i < post.L.houses.length; i++) {
    var H = post.L.houses[i];
    if (H.c === tc && H.r === tr) { H.peek = 1.4; H.wig = 0.4; postAnimalSound(H.kind, 0); return; }
  }
  if (post.L.lever && post.L.lever.c === tc && post.L.lever.r === tr) { post.leverWig = 0.4; playNote(330, 0, 0.08, 'triangle', 0.2); return; }
  propsTap(px, py);
}
function postBuzz() {
  post.shakeT = 0.3;
  playNote(170, 0, 0.2, 'sawtooth', 0.15);
}
function postRun() {
  var i, k;
  post.steps = [];
  for (i = 0; i < post.prog.length; i++) for (k = 0; k < post.prog[i].n; k++) post.steps.push({ dir: post.prog[i].dir, slot: i });
  postResetRun();
  post.failT = 0;
  post.running = true;
  post.step = -1;
  post.stepT = 0.25;
  post.runs++;
  post.showT = 0;
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.1, 0.16, 'triangle', 0.35);
}
function postFail(kind) {
  post.running = false;
  post.failT = 1.1;
  post.crash = kind;
  post.shakeT = 0.4;
  playNote(170, 0, 0.3, 'sawtooth', 0.2);
}
// Asukkaan ääni nuoteilla
function postAnimalSound(kind, delay) {
  var d = delay || 0;
  if (kind === 'cow') { playNote(147, d, 0.35, 'triangle', 0.35); playNote(131, d + 0.3, 0.4, 'triangle', 0.3); }
  else if (kind === 'hen') { playNote(880, d, 0.06, 'square', 0.12); playNote(988, d + 0.09, 0.06, 'square', 0.12); playNote(880, d + 0.18, 0.12, 'square', 0.12); }
  else if (kind === 'pig') { playNote(233, d, 0.08, 'square', 0.14); playNote(208, d + 0.12, 0.1, 'square', 0.14); }
  else if (kind === 'sheep') { playNote(330, d, 0.1, 'sawtooth', 0.12); playNote(349, d + 0.1, 0.1, 'sawtooth', 0.12); playNote(330, d + 0.2, 0.2, 'sawtooth', 0.1); }
  else if (kind === 'cat') { playNote(698, d, 0.12, 'sine', 0.25); playNote(523, d + 0.12, 0.25, 'sine', 0.22); }
  else { playNote(392, d, 0.08, 'square', 0.14); playNote(392, d + 0.16, 0.1, 'square', 0.14); }
}

// ---------- Ajo ----------
// Pupu saapuu ruutuun: vipu ja kirjeet
function postArrive(L, Lz) {
  var b = post.bunny, G = post.L, cp = postCell(b.c, b.r, Lz), h, i, H, top, bx;
  if (G.lever && !post.leverOn && b.c === G.lever.c && b.r === G.lever.r) {
    post.leverOn = true;
    post.leverWig = 0.4;
    artPop(cp.x, cp.y, Lz.cs * 0.4, '#ffd24f', 'burst');
    playNote(392, 0, 0.1, 'triangle', 0.3);
    playNote(523, 0.12, 0.1, 'triangle', 0.3);
    playNote(659, 0.24, 0.18, 'triangle', 0.3);
    var bp = postCell(G.bridge.c, G.bridge.r, Lz);
    spawnSparkles(bp.x, bp.y, 12, '#ffd24f');
  }
  h = G.doorAt[postKey(b.c, b.r)];
  if (h === undefined) return;
  H = G.houses[h];
  i = G.letterOf[h];
  top = postTop();
  bx = postBoxPos(H, Lz);
  if (i >= 0 && !post.done[i] && (!post.R.order || i === top)) {
    post.done[i] = true;
    post.flies.push({ i: i, x0: cp.x, y0: cp.y - Lz.cs * 0.2, x1: bx.x, y1: bx.y, t: 0, dur: 0.4, back: false, h: h });
    playNote(988, 0, 0.1, 'sine', 0.3);
    playNote(1319, 0.1, 0.14, 'sine', 0.3);
    if (postAllDone()) postRoundDone(Lz);
  } else if (top >= 0 && (i < 0 || !post.done[i])) {
    // Väärä talo tai ei vielä vuorossa: kirje pyrähtää laatikolle ja palaa
    post.flies.push({ i: top, x0: cp.x, y0: cp.y - Lz.cs * 0.2, x1: bx.x, y1: bx.y, t: 0, dur: 0.6, back: true, h: h });
    H.shake = 0.8;
    playNote(392, 0.15, 0.1, 'triangle', 0.22);
    playNote(330, 0.3, 0.14, 'triangle', 0.22);
  } else {
    H.peek = 1.0;
  }
}
function postRoundDone(Lz) {
  var p = postCell(post.bunny.c, post.bunny.r, Lz);
  post.running = false;
  post.state = 'roundDone';
  post.t = 0;
  post.gold[post.round] = post.runs === 1;
  artPop(p.x, p.y, Lz.cs * 0.8, '#ffe27a', 'ring');
  spawnSparkles(p.x, p.y, 22, post.runs === 1 ? '#ffd24f' : '#ffe27a');
  playNote(784, 0.2, 0.12, 'triangle', 0.35);
  playNote(988, 0.32, 0.12, 'triangle', 0.35);
  playNote(1319, 0.44, 0.35, 'triangle', 0.35);
  if (post.runs === 1) playNote(1760, 0.65, 0.3, 'sine', 0.3);
  if (post.round === 0 || post.round === 1) post.taskDelay = 1.8;
}

// ---------- Päivitys ----------
function updatePost(dt) {
  var busy, b = post.bunny, i, Lz, s, nc, nr, G = post.L, f;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  b.hop = Math.max(0, b.hop - dt * 4);
  b.fc += (b.c - b.fc) * Math.min(1, dt * 10);
  b.fr += (b.r - b.fr) * Math.min(1, dt * 10);
  if (post.shakeT > 0) post.shakeT -= dt;
  if (post.leverWig > 0) post.leverWig -= dt;
  if (post.showT > 0) post.showT -= dt;
  post.bagT += dt;
  post.bridgeA += ((post.leverOn ? 1 : 0) - post.bridgeA) * Math.min(1, dt * 5);
  for (i = 0; i < post.prog.length; i++) if (post.prog[i].pop > 0) post.prog[i].pop -= dt;
  if (G) {
    for (i = 0; i < G.houses.length; i++) {
      var H = G.houses[i];
      if (H.peek > 0) H.peek -= dt;
      if (H.shake > 0) H.shake -= dt;
      if (H.heart > 0) H.heart -= dt;
      if (H.wig > 0) H.wig -= dt;
    }
  }
  // Lentävät kirjeet
  for (i = post.flies.length - 1; i >= 0; i--) {
    f = post.flies[i];
    f.t += dt;
    if (f.t >= f.dur) {
      if (!f.back && G) {
        G.houses[f.h].flag = 1;
        G.houses[f.h].heart = 1.2;
        G.houses[f.h].peek = 1.4;
        postAnimalSound(G.houses[f.h].kind, 0);
        spawnSparkles(f.x1, f.y1, 8, '#ffe27a');
      }
      post.flies.splice(i, 1);
    }
  }
  if (post.taskDelay > 0 && !busy) {
    post.taskDelay -= dt;
    if (post.taskDelay <= 0) {
      if (post.round === 0 && !tasks[0].opened) taskStart(tasks[0]);
      else if (post.round === 1 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  if (post.state === 'intro') postPump(post.round);
  else if (post.state === 'roundDone') postPump(post.round + 1);
  if (busy || celebrating) return;
  post.t += dt;
  if (post.state === 'intro') { if (post.t > 0.6) postStartRound(); return; }
  if (post.state === 'roundDone') {
    if (post.t > 2.2 && post.taskDelay <= 0 && (post.round + 1 >= POST_ROUNDS.length || (post.prep && post.prep.L))) {
      post.round++;
      if (post.round >= POST_ROUNDS.length) postStartWon();
      else postStartRound();
    }
    return;
  }
  if (post.state === 'won') { postUpdateWon(dt); return; }
  if (!post.tapped) post.hintT += dt;
  if (post.failT > 0) {
    post.failT -= dt;
    if (post.failT <= 0) postResetRun();
  }
  if (!post.running) return;
  Lz = postLayout();
  post.stepT -= dt;
  if (post.stepT > 0) return;
  post.stepT = POST_STEP_T;
  post.step++;
  if (post.step >= post.steps.length) { postFail('lost'); return; }
  s = post.steps[post.step];
  nc = b.c + BCODE_DIRS[s.dir][0]; nr = b.r + BCODE_DIRS[s.dir][1];
  if (s.dir === 1) b.facing = 1; else if (s.dir === 3) b.facing = -1;
  if (!postOpen(G, nc, nr, post.leverOn)) {
    // Törmäys: pupu nytkähtää kohti estettä
    b.fc = b.c + BCODE_DIRS[s.dir][0] * 0.3; b.fr = b.r + BCODE_DIRS[s.dir][1] * 0.3;
    postFail('crash');
    return;
  }
  b.c = nc; b.r = nr; b.hop = 1;
  playNote(600 + post.step * 25, 0, 0.08, 'sine', 0.25);
  postArrive(G, Lz);
}

// ---------- Kylän juhlat ----------
function postStartWon() {
  post.state = 'won';
  post.t = 0;
  post.wonT = 0;
  soundFanfare();
}
function postUpdateWon(dt) {
  var before = post.wonT, G = post.L, i, Lz = postLayout();
  post.wonT += dt;
  for (i = 0; G && i < G.houses.length; i++) {
    var at = 0.4 + i * 0.35;
    if (before < at && post.wonT >= at) {
      var p = postCell(G.houses[i].dc, G.houses[i].dr, Lz);
      postAnimalSound(G.houses[i].kind, 0);
      artPop(p.x, p.y, Lz.cs * 0.5, G.houses[i].color, 'burst');
      spawnSparkles(p.x, p.y, 10, G.houses[i].color);
    }
  }
  if (before < 2.6 && post.wonT >= 2.6) postRoosterCrow(0);
  if (post.wonT > 4.4 && !celebrating) startCelebration();
}

// ---------- Tökättävät koristeet (ruudukon ulkopuolella) ----------
// Kukko postitalon katolla (kiekuu; joka viides tökkäys: kaikki asukkaat
// kurkistavat ikkunoista ja laulavat vuorotellen) ja postilaatikko
// (lippu nousee ja kirje pomppaa ulos).
function postSetupProps() {
  var O = postOffice(), s = O.bw;
  propsReset();
  propAdd({
    x: O.x, y: O.base - O.bh - O.bw * 0.42, r: s * 0.32, hy: s * 0.16, color: '#ff7a5a', note: 784, amp: 0.2, crowT: 0,
    update: function (p, dt) { if (p.crowT > 0) p.crowT -= dt; },
    draw: function (c, p) { postDrawRooster(c, s * 0.2, p.crowT > 0 ? Math.min(1, p.crowT * 2) : 0); },
    poke: function (p) {
      p.crowT = 1.0;
      postRoosterCrow(0);
      if (p.n % 5 === 0 && post.L) {
        for (var i = 0; i < post.L.houses.length; i++) {
          post.L.houses[i].peek = 2.2 + i * 0.3;
          postAnimalSound(post.L.houses[i].kind, 0.9 + i * 0.4);
        }
      }
    }
  });
  propAdd({
    x: O.x + O.bw * 0.22, y: viewH * 0.95, r: s * 0.3, hy: s * 0.3, color: '#ffc23a', note: 659, amp: 0.12, flagA: 0, flagUp: false,
    update: function (p, dt) { p.flagA += ((p.flagUp ? 1 : 0) - p.flagA) * Math.min(1, dt * 8); },
    draw: function (c, p) { postDrawMailbox(c, s * 0.26, p.flagA); },
    poke: function (p) {
      p.flagUp = !p.flagUp;
      var bx = p.x, by = p.y - s * 0.42;
      propDrop({
        x: bx, y: by, vx: viewW * 0.04, vy: -viewH * 0.5, ground: viewH * 0.97,
        draw: function (c) { postDrawEnvelope(c, 0, 0, s * 0.22, s * 0.15); }
      });
      playNote(1047, 0.05, 0.12, 'triangle', 0.25);
    }
  });
}
function postRoosterCrow(d) {
  playNote(523, d, 0.12, 'square', 0.12);
  playNote(659, d + 0.13, 0.12, 'square', 0.12);
  playNote(784, d + 0.26, 0.12, 'square', 0.12);
  playNote(698, d + 0.4, 0.35, 'square', 0.12);
}

// ---------- Piirto: hahmot ja esineet ----------
// Asukkaan kasvot (s = pään säde)
function postDrawAnimal(c, kind, x, y, s, shake) {
  var bl = (globalT * 0.9 + x * 0.013) % 4 < 0.12, ex = s * 0.33, ey = y - s * 0.12, er = s * 0.17;
  x += shake ? Math.sin(globalT * 30) * s * 0.18 : 0;
  if (kind === 'cow') {
    artBlob(c, x - s * 0.95, y - s * 0.3, s * 0.34, s * 0.17, '#f4f0ea', { lineColor: '#5a4a40', rot: -0.4 });
    artBlob(c, x + s * 0.95, y - s * 0.3, s * 0.34, s * 0.17, '#f4f0ea', { lineColor: '#5a4a40', rot: 0.4 });
    artBlob(c, x - s * 0.5, y - s * 0.82, s * 0.12, s * 0.24, '#f0e0b0', { lineColor: '#8a7a50', rot: -0.4 });
    artBlob(c, x + s * 0.5, y - s * 0.82, s * 0.12, s * 0.24, '#f0e0b0', { lineColor: '#8a7a50', rot: 0.4 });
    artBlob(c, x, y, s * 0.78, s * 0.86, '#f8f6f0', { lineColor: '#5a4a40', hi: 0.2 });
    artBlob(c, x + s * 0.38, y - s * 0.42, s * 0.28, s * 0.22, '#3a3030', { line: false });
    artBlob(c, x, y + s * 0.45, s * 0.6, s * 0.36, '#ffb8c0', { lineColor: '#c07080' });
    c.fillStyle = '#a05060';
    c.beginPath(); c.arc(x - s * 0.22, y + s * 0.45, s * 0.08, 0, Math.PI * 2); c.arc(x + s * 0.22, y + s * 0.45, s * 0.08, 0, Math.PI * 2); c.fill();
  } else if (kind === 'hen') {
    artCircle(c, x - s * 0.28, y - s * 0.86, s * 0.2, '#ff4f4f', { lineColor: '#a02020' });
    artCircle(c, x, y - s * 0.95, s * 0.22, '#ff4f4f', { lineColor: '#a02020' });
    artCircle(c, x + s * 0.28, y - s * 0.86, s * 0.2, '#ff4f4f', { lineColor: '#a02020' });
    artBlob(c, x, y, s * 0.8, s * 0.86, '#ffffff', { lineColor: '#8a7a70', hi: 0.2, shadeTo: '#e8e0f0' });
    artBlob(c, x, y + s * 0.5, s * 0.12, s * 0.2, '#ff4f4f', { lineColor: '#a02020' });
    c.beginPath(); c.moveTo(x - s * 0.18, y + s * 0.12); c.lineTo(x + s * 0.18, y + s * 0.12); c.lineTo(x, y + s * 0.4); c.closePath();
    artFillPath(c, '#ffb020', y + s * 0.1, y + s * 0.4, s * 0.2, { lineColor: '#a06010' });
  } else if (kind === 'pig') {
    c.beginPath(); c.moveTo(x - s * 0.75, y - s * 0.4); c.lineTo(x - s * 0.7, y - s * 1.0); c.lineTo(x - s * 0.25, y - s * 0.7); c.closePath();
    artFillPath(c, '#ff9ab0', y - s, y - s * 0.4, s * 0.3, { lineColor: '#b0506a' });
    c.beginPath(); c.moveTo(x + s * 0.75, y - s * 0.4); c.lineTo(x + s * 0.7, y - s * 1.0); c.lineTo(x + s * 0.25, y - s * 0.7); c.closePath();
    artFillPath(c, '#ff9ab0', y - s, y - s * 0.4, s * 0.3, { lineColor: '#b0506a' });
    artBlob(c, x, y, s * 0.88, s * 0.82, '#ffb6c6', { lineColor: '#b0506a', hi: 0.25 });
    artBlob(c, x, y + s * 0.3, s * 0.36, s * 0.26, '#ff8aa4', { lineColor: '#b0506a' });
    c.fillStyle = '#a0405a';
    c.beginPath(); c.arc(x - s * 0.13, y + s * 0.3, s * 0.07, 0, Math.PI * 2); c.arc(x + s * 0.13, y + s * 0.3, s * 0.07, 0, Math.PI * 2); c.fill();
    ey = y - s * 0.22;
  } else if (kind === 'sheep') {
    var k;
    for (k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2;
      artCircle(c, x + Math.cos(a) * s * 0.72, y - s * 0.05 + Math.sin(a) * s * 0.72, s * 0.34, '#fffaf0', { lineColor: '#a89a88', shadeTo: '#ece4f0' });
    }
    artBlob(c, x - s * 0.72, y - s * 0.05, s * 0.3, s * 0.13, '#5a5050', { lineColor: '#2a2020', rot: 0.3 });
    artBlob(c, x + s * 0.72, y - s * 0.05, s * 0.3, s * 0.13, '#5a5050', { lineColor: '#2a2020', rot: -0.3 });
    artBlob(c, x, y + s * 0.08, s * 0.5, s * 0.66, '#5a5050', { lineColor: '#2a2020', hi: 0.15 });
    artCircle(c, x, y - s * 0.62, s * 0.3, '#fffaf0', { lineColor: '#a89a88' });
  } else if (kind === 'cat') {
    c.beginPath(); c.moveTo(x - s * 0.8, y - s * 0.25); c.lineTo(x - s * 0.62, y - s * 1.05); c.lineTo(x - s * 0.15, y - s * 0.7); c.closePath();
    artFillPath(c, '#ffa040', y - s, y - s * 0.25, s * 0.3, { lineColor: '#a05a10' });
    c.beginPath(); c.moveTo(x + s * 0.8, y - s * 0.25); c.lineTo(x + s * 0.62, y - s * 1.05); c.lineTo(x + s * 0.15, y - s * 0.7); c.closePath();
    artFillPath(c, '#ffa040', y - s, y - s * 0.25, s * 0.3, { lineColor: '#a05a10' });
    artBlob(c, x, y, s * 0.86, s * 0.78, '#ffad55', { lineColor: '#a05a10', hi: 0.25 });
    artBlob(c, x, y + s * 0.32, s * 0.36, s * 0.24, '#fff0dc', { line: false });
    c.fillStyle = '#ff7a9a';
    c.beginPath(); c.moveTo(x - s * 0.1, y + s * 0.14); c.lineTo(x + s * 0.1, y + s * 0.14); c.lineTo(x, y + s * 0.26); c.closePath(); c.fill();
    c.strokeStyle = '#7a4a20';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath();
    c.moveTo(x - s * 0.3, y + s * 0.3); c.lineTo(x - s * 0.85, y + s * 0.2);
    c.moveTo(x - s * 0.3, y + s * 0.38); c.lineTo(x - s * 0.85, y + s * 0.45);
    c.moveTo(x + s * 0.3, y + s * 0.3); c.lineTo(x + s * 0.85, y + s * 0.2);
    c.moveTo(x + s * 0.3, y + s * 0.38); c.lineTo(x + s * 0.85, y + s * 0.45);
    c.stroke();
  } else {
    artBlob(c, x, y, s * 0.82, s * 0.8, '#d8a66a', { lineColor: '#7a5020', hi: 0.25 });
    artBlob(c, x - s * 0.8, y + s * 0.05, s * 0.24, s * 0.5, '#8a5a2a', { lineColor: '#5a3a10', rot: 0.25 });
    artBlob(c, x + s * 0.8, y + s * 0.05, s * 0.24, s * 0.5, '#8a5a2a', { lineColor: '#5a3a10', rot: -0.25 });
    artBlob(c, x, y + s * 0.35, s * 0.4, s * 0.28, '#f4dcb8', { line: false });
    artBlob(c, x, y + s * 0.2, s * 0.16, s * 0.11, '#2a2020', { line: false });
    artBlob(c, x, y + s * 0.55, s * 0.1, s * 0.12, '#ff7a8a', { line: false });
  }
  artEye(c, x - ex, ey, er, 0, bl);
  artEye(c, x + ex, ey, er, 0, bl);
}
function postDrawEnvelope(c, x, y, w, h) {
  artRoundRect(c, x - w / 2, y - h / 2, w, h, Math.max(1, h * 0.12), '#fffdf6', { lineColor: '#8a7a9a', shadeTo: '#ece6f4' });
  c.strokeStyle = 'rgba(138,122,154,0.6)';
  c.lineWidth = Math.max(1, h * 0.05);
  c.beginPath(); c.moveTo(x - w * 0.46, y - h * 0.42); c.lineTo(x, y + h * 0.05); c.lineTo(x + w * 0.46, y - h * 0.42); c.stroke();
}
// Kirje merkkeineen: numero tai asukas
function postDrawLetter(c, x, y, w, h, G, i) {
  var L = G.letters[i], H = G.houses[L.h];
  postDrawEnvelope(c, x, y, w, h);
  // Postimerkki oikeassa yläkulmassa
  c.fillStyle = '#ff7bac';
  c.fillRect(x + w * 0.28, y - h * 0.4, w * 0.15, h * 0.22);
  if (L.show === 'num') {
    c.fillStyle = '#3a2a6a';
    c.font = 'bold ' + Math.round(h * 0.7) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(H.num + '', x - w * 0.04, y + h * 0.08);
    c.textBaseline = 'alphabetic';
  } else {
    postDrawAnimal(c, H.kind, x - w * 0.04, y + h * 0.1, h * 0.3, false);
  }
}
// Talo ruudussaan: ikkunassa asukas, ovessa numero
function postDrawHouse(c, x, y, cs, H) {
  var wob = H.wig > 0 ? Math.sin(globalT * 30) * 0.04 : 0, s = cs;
  c.save();
  c.translate(x, y + s * 0.47);
  c.rotate(wob);
  // Seinä ja katto
  artRoundRect(c, -s * 0.42, -s * 0.66, s * 0.84, s * 0.64, s * 0.05, H.color, { lineColor: artShade(H.color, -0.45) });
  c.beginPath(); c.moveTo(-s * 0.5, -s * 0.6); c.lineTo(0, -s * 0.98); c.lineTo(s * 0.5, -s * 0.6); c.closePath();
  artFillPath(c, '#d8604a', -s * 0.98, -s * 0.6, s * 0.4, { lineColor: '#7a2a20' });
  // Ikkuna ja asukas (kurkistaa ulos napautuksesta)
  var pk = H.peek > 0 ? Math.min(1, H.peek * 3) : 0;
  artCircle(c, -s * 0.18, -s * 0.36, s * 0.19, '#cfeeff', { lineColor: '#6a5a4a' });
  postDrawAnimal(c, H.kind, -s * 0.18, -s * 0.34 - pk * s * 0.12, s * (0.15 + pk * 0.05), H.shake > 0);
  // Ovi ja numero
  artRoundRect(c, s * 0.08, -s * 0.3, s * 0.24, s * 0.28, s * 0.05, '#a06a3a', { lineColor: '#5a3a1a' });
  artCircle(c, s * 0.27, -s * 0.15, s * 0.025, '#ffd24f', { line: false });
  artRoundRect(c, s * 0.04, -s * 0.585, s * 0.32, s * 0.26, s * 0.05, '#ffffff', { lineColor: '#5a4a6a' });
  c.fillStyle = '#3a2a6a';
  c.font = 'bold ' + Math.round(s * 0.26) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(H.num + '', s * 0.2, -s * 0.445);
  c.textBaseline = 'alphabetic';
  if (H.heart > 0) drawPostHeart(c, -s * 0.18, -s * 0.7 - (1.2 - H.heart) * s * 0.4, s * 0.1, Math.min(1, H.heart * 2));
  c.restore();
}
function drawPostHeart(c, x, y, s, a) {
  c.globalAlpha = a;
  c.fillStyle = '#ff5f8a';
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.4, y, x - s * 0.7, y - s * 1.0, x, y - s * 0.35);
  c.bezierCurveTo(x + s * 0.7, y - s * 1.0, x + s * 1.4, y, x, y + s * 0.9);
  c.fill();
  c.globalAlpha = 1;
}
// Postilaatikko (origo = tolpan juuri); flag 0..1 = lippu ylhäällä
function postDrawMailbox(c, s, flag) {
  artRoundRect(c, -s * 0.12, -s * 1.3, s * 0.24, s * 1.3, s * 0.06, '#a06a3a', { lineColor: '#5a3a1a' });
  artRoundRect(c, -s * 0.6, -s * 1.95, s * 1.2, s * 0.75, s * 0.25, '#ffc23a', { lineColor: '#9a6a10' });
  c.fillStyle = '#5a3a10';
  roundRect(c, -s * 0.38, -s * 1.78, s * 0.76, s * 0.1, s * 0.04); c.fill();
  // Postitorvi
  c.strokeStyle = '#2a4a9a';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.arc(0, -s * 1.48, s * 0.14, 0, Math.PI * 2); c.stroke();
  c.save();
  c.translate(s * 0.6, -s * 1.5);
  c.rotate(-flag * Math.PI / 2);
  artRoundRect(c, -s * 0.04, -s * 0.06, s * 0.5, s * 0.1, s * 0.03, '#a06a3a', { line: false });
  artRoundRect(c, s * 0.34, -s * 0.12, s * 0.22, s * 0.2, s * 0.03, '#ff4f4f', { lineColor: '#8a2020' });
  c.restore();
}
// Kukko (origo = jalat); crow 0..1 = nokka auki ja siivet levällään
function postDrawRooster(c, s, crow) {
  var k;
  c.strokeStyle = '#d08a20';
  c.lineWidth = Math.max(1, s * 0.12);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-s * 0.2, 0); c.lineTo(-s * 0.15, -s * 0.5); c.moveTo(s * 0.2, 0); c.lineTo(s * 0.15, -s * 0.5); c.stroke();
  var tails = ['#2a8a5a', '#1a5a8a', '#3aaa6a'];
  for (k = 0; k < 3; k++) artBlob(c, s * 0.75 + k * s * 0.08, -s * 1.15 - k * s * 0.2, s * 0.18, s * 0.5, tails[k], { lineColor: '#1a3a2a', rot: 0.5 + k * 0.25 });
  artBlob(c, 0, -s * 0.95, s * 0.75, s * 0.55, '#c0502a', { lineColor: '#6a2a10', hi: 0.2 });
  artBlob(c, s * 0.05, -s * 0.95 - crow * s * 0.15, s * 0.42, s * 0.24, '#a04020', { lineColor: '#6a2a10', rot: -0.3 - crow * 0.8 });
  artCircle(c, -s * 0.5, -s * 1.65, s * 0.34, '#e8a040', { lineColor: '#8a5010', hi: 0.25 });
  for (k = 0; k < 3; k++) artCircle(c, -s * 0.66 + k * s * 0.15, -s * 2.0 + Math.abs(k - 1) * s * 0.07, s * 0.12, '#ff3f3f', { lineColor: '#9a1a1a' });
  c.beginPath();
  c.moveTo(-s * 0.8, -s * 1.72); c.lineTo(-s * 1.12, -s * 1.66 - crow * s * 0.12); c.lineTo(-s * 0.8, -s * 1.6); c.closePath();
  c.moveTo(-s * 0.8, -s * 1.6); c.lineTo(-s * 1.08, -s * 1.55 + crow * s * 0.14); c.lineTo(-s * 0.8, -s * 1.52); c.closePath();
  artFillPath(c, '#ffb020', -s * 1.75, -s * 1.4, s * 0.2, { lineColor: '#9a6010' });
  artBlob(c, -s * 0.72, -s * 1.38, s * 0.07, s * 0.13, '#ff3f3f', { line: false });
  artEye(c, -s * 0.55, -s * 1.72, s * 0.09, -0.6, false);
}
function postDrawLever(c, x, y, s, on, wig) {
  var a = (on ? 0.6 : -0.6) + (wig > 0 ? Math.sin(globalT * 30) * 0.1 : 0);
  artRoundRect(c, x - s * 0.5, y + s * 0.3, s, s * 0.35, s * 0.1, '#8a8a9a', { lineColor: '#4a4a5a' });
  c.save();
  c.translate(x, y + s * 0.35);
  c.rotate(a);
  artLimb(c, 0, 0, 0, -s * 1.0, s * 0.14, '#a06a3a', '#5a3a1a');
  artCircle(c, 0, -s * 1.05, s * 0.22, on ? '#5fd06a' : '#ff5f5f', { lineColor: on ? '#2a7a3a' : '#8a2020', hi: 0.4 });
  c.restore();
}
function postDrawObstacle(c, x, y, cs, kind) {
  if (kind === 0) {
    drawBush(c, x, y + cs * 0.35, cs * 0.25);
  } else if (kind === 1) {
    // Heinäpaali
    artRoundRect(c, x - cs * 0.36, y - cs * 0.12, cs * 0.72, cs * 0.46, cs * 0.12, '#f0cf6a', { lineColor: '#9a7a20' });
    c.strokeStyle = 'rgba(154,122,32,0.6)';
    c.lineWidth = Math.max(1, cs * 0.025);
    c.beginPath(); c.moveTo(x - cs * 0.14, y - cs * 0.1); c.lineTo(x - cs * 0.14, y + cs * 0.32); c.moveTo(x + cs * 0.14, y - cs * 0.1); c.lineTo(x + cs * 0.14, y + cs * 0.32); c.stroke();
  } else {
    // Omenapuu
    artLimb(c, x, y + cs * 0.38, x, y, cs * 0.12, '#8a5a2a', '#4a2a10');
    artCircle(c, x, y - cs * 0.08, cs * 0.32, '#5fbf55', { lineColor: '#2a6a2a', hi: 0.25 });
    artCircle(c, x - cs * 0.12, y - cs * 0.12, cs * 0.05, '#ff4f4f', { line: false });
    artCircle(c, x + cs * 0.14, y + cs * 0.02, cs * 0.05, '#ff4f4f', { line: false });
  }
}

// ---------- Piirto: tausta ----------
function renderPostBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x, O = postOffice();
  g.addColorStop(0, '#8fd4ff');
  g.addColorStop(0.45, '#d8f2ff');
  g.addColorStop(1, '#fff2d0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.6, h * 0.07, h * 0.04, 0.1);
  // Kaukaiset pellot kummuilla
  b.fillStyle = artMix('#9fd06a', '#d8f2ff', 0.45);
  b.beginPath(); b.moveTo(0, h * 0.4);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.33 - Math.sin(x / vw * 4.4 + 0.6) * 0.04));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  b.fillStyle = artMix('#e8c860', '#d8f2ff', 0.4);
  for (i = 0; i < 5; i++) {
    b.beginPath();
    b.ellipse ? b.ellipse(vw * (0.1 + i * 0.22), h * 0.38, vw * 0.07, h * 0.02, 0, 0, Math.PI * 2) : b.arc(vw * (0.1 + i * 0.22), h * 0.38, h * 0.02, 0, Math.PI * 2);
    b.fill();
  }
  b.fillStyle = '#9adc72';
  b.beginPath(); b.moveTo(0, h * 0.5);
  for (x = 0; x <= vw; x += vw / 24) b.lineTo(x, h * (0.45 - Math.sin(x / vw * 3.2 + 1.5) * 0.03));
  b.lineTo(vw, h); b.lineTo(0, h); b.closePath(); b.fill();
  // Postitalo vasemmalla: seinä, katto, POSTI-kyltti ja ovi
  var ox = O.x, base = O.base, bw = O.bw, bh = O.bh;
  artShadow(b, ox, base, bw * 0.7, bw * 0.12, 0.2);
  artRoundRect(b, ox - bw / 2, base - bh, bw, bh, bw * 0.04, '#ffe7b0', { lineColor: '#8a6a3a' });
  b.beginPath(); b.moveTo(ox - bw * 0.6, base - bh + bw * 0.04); b.lineTo(ox, base - bh - bw * 0.42); b.lineTo(ox + bw * 0.6, base - bh + bw * 0.04); b.closePath();
  artFillPath(b, '#3a6ac8', base - bh - bw * 0.42, base - bh, bw * 0.4, { lineColor: '#1a3a7a' });
  artRoundRect(b, ox - bw * 0.42, base - bh + bw * 0.08, bw * 0.84, bw * 0.24, bw * 0.05, '#ffc23a', { lineColor: '#8a5a10' });
  b.fillStyle = '#2a3a8a';
  b.font = 'bold ' + Math.round(bw * 0.17) + 'px ' + UI_FONT;
  b.textAlign = 'center';
  b.textBaseline = 'middle';
  b.fillText('POSTI', ox, base - bh + bw * 0.205);
  b.textBaseline = 'alphabetic';
  artRoundRect(b, ox - bw * 0.14, base - bw * 0.36, bw * 0.28, bw * 0.36, bw * 0.06, '#a06a3a', { lineColor: '#5a3a1a' });
  artRoundRect(b, ox - bw * 0.42, base - bw * 0.36, bw * 0.2, bw * 0.18, bw * 0.03, '#cfeeff', { lineColor: '#6a5a4a' });
  artRoundRect(b, ox + bw * 0.22, base - bw * 0.36, bw * 0.2, bw * 0.18, bw * 0.03, '#cfeeff', { lineColor: '#6a5a4a' });
  // Oikean paneelin tausta
  b.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(b, vw * 0.7, h * 0.22, vw * 0.28, h * 0.74, h * 0.04);
  b.fill();
  for (i = 0; i < 4; i++) drawFlower(b, vw * (0.015 + i * 0.045), h * 0.975, h * 0.011, ['#ff7bac', '#ffd24f', '#b98aff'][i % 3]);
}

// ---------- Piirto: kenttä ----------
function drawPost() {
  var c = ctx, Lz, R = post.R, G = post.L, i, k, p, b = postButtons(), sh = post.shakeT > 0 ? Math.sin(globalT * 50) * viewH * 0.006 : 0;
  if (!beginPlayWorld()) return;
  propsDraw(c);
  if (G) {
    Lz = postLayout();
    postDrawBoard(c, G, Lz);
    if (post.state === 'won') postDrawParty(c, G, Lz);
    postDrawProgram(c, R, b, sh);
    postDrawBag(c, G, sh);
    postDrawShow(c, G, Lz);
    // Lentävät kirjeet päällimmäisinä
    for (i = 0; i < post.flies.length; i++) {
      var f = post.flies[i], u = Math.min(1, f.t / f.dur), v = f.back ? 1 - Math.abs(2 * u - 1) : easeOutCubic(u);
      var fx = f.x0 + (f.x1 - f.x0) * v, fy = f.y0 + (f.y1 - f.y0) * v - Math.sin(v * Math.PI) * Lz.cs * 0.4;
      var sc = f.back ? 1 : 1 - u * 0.4;
      postDrawLetter(c, fx, fy, Lz.cs * 0.5 * sc, Lz.cs * 0.35 * sc, G, f.i);
    }
    postDrawHint(c, b, G);
  }
  drawParticlesLayer(c);
  endPlayWorld();
  drawPostHud(c);
  drawTaskOverlay(c);
}
function postDrawBoard(c, G, Lz) {
  var i, k, p, cs = Lz.cs, key, bl, H, bnR = Math.round(post.bunny.fr);
  // Ruudut: kadut hiekkaa, talojen ja esteiden ruudut nurmea, joki vettä
  for (k = 0; k < G.rows; k++) for (i = 0; i < G.cols; i++) {
    p = postCell(i, k, Lz);
    key = postKey(i, k);
    bl = G.block[key];
    if (bl === 'water' || (G.bridge && G.bridge.c === i && G.bridge.r === k)) {
      artRoundRect(c, p.x - cs * 0.5, p.y - cs * 0.5, cs, cs, cs * 0.02, '#6ec0f0', { line: false, flat: true });
      c.strokeStyle = 'rgba(255,255,255,0.55)';
      c.lineWidth = Math.max(1, cs * 0.03);
      var wv = Math.sin(globalT * 2 + k) * cs * 0.06;
      c.beginPath(); c.moveTo(p.x - cs * 0.3 + wv, p.y - cs * 0.15); c.quadraticCurveTo(p.x + wv, p.y - cs * 0.25, p.x + cs * 0.3 + wv, p.y - cs * 0.15); c.stroke();
      c.beginPath(); c.moveTo(p.x - cs * 0.3 - wv, p.y + cs * 0.2); c.quadraticCurveTo(p.x - wv, p.y + cs * 0.1, p.x + cs * 0.3 - wv, p.y + cs * 0.2); c.stroke();
    } else if (bl) {
      artRoundRect(c, p.x - cs * 0.47, p.y - cs * 0.47, cs * 0.94, cs * 0.94, cs * 0.12, (i + k) % 2 ? '#9fdc7f' : '#8fd06f', { lineColor: '#5a9a4a', line: Math.max(1, cs * 0.02) });
    } else {
      artRoundRect(c, p.x - cs * 0.47, p.y - cs * 0.47, cs * 0.94, cs * 0.94, cs * 0.12, (i + k) % 2 ? '#f4dfae' : '#efd6a0', { lineColor: '#c8a870', line: Math.max(1, cs * 0.02) });
    }
  }
  // Silta: nostettuna pystyssä, vivun jälkeen laskeutuu
  if (G.bridge) postDrawBridge(c, postCell(G.bridge.c, G.bridge.r, Lz), cs, post.bridgeA);
  // Lähtöruutu
  p = postCell(G.start.c, G.start.r, Lz);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.arc(p.x, p.y + cs * 0.28, cs * 0.3, 0, Math.PI * 2); c.fill();
  // Oven edustat: polku ovelta ja postilaatikko (lippu nousee, kun kirje on perillä)
  for (i = 0; i < G.houses.length; i++) {
    H = G.houses[i];
    p = postCell(H.dc, H.dr, Lz);
    c.fillStyle = 'rgba(200,160,110,0.55)';
    roundRect(c, p.x + cs * 0.05, p.y - cs * 0.5, cs * 0.3, cs * 0.3, cs * 0.06); c.fill();
    var bx = postBoxPos(H, Lz);
    c.save(); c.translate(bx.x + cs * 0.1, bx.y + cs * 0.18);
    postDrawMailbox(c, cs * 0.12, H.flag);
    c.restore();
  }
  // Rivi kerrallaan: talot, esteet, vipu ja pupu (alemmat rivit edessä)
  for (k = 0; k < G.rows; k++) {
    for (i = 0; i < G.cols; i++) {
      key = postKey(i, k);
      p = postCell(i, k, Lz);
      if (G.block[key] === 'obst') postDrawObstacle(c, p.x, p.y, cs, (i * 7 + k * 3) % 3);
    }
    for (i = 0; i < G.houses.length; i++) {
      H = G.houses[i];
      if (H.r !== k) continue;
      p = postCell(H.c, H.r, Lz);
      postDrawHouse(c, p.x, p.y, cs, H);
    }
    if (G.lever && G.lever.r === k) { p = postCell(G.lever.c, G.lever.r, Lz); postDrawLever(c, p.x, p.y, cs * 0.3, post.leverOn, post.leverWig); }
    if (k === bnR) postDrawBunny(c, G, Lz);
  }
}
function postDrawBridge(c, p, cs, a) {
  var i, len = cs * (0.3 + a * 0.7), x0 = p.x - cs * 0.5;
  // Laskettu silta: lankut joen yli vasemmalta oikealle; ylhäällä lyhyt ja pystyssä
  c.save();
  c.translate(x0, p.y);
  c.rotate(-(1 - a) * Math.PI * 0.42);
  for (i = 0; i < 4; i++) artRoundRect(c, i * len / 4, -cs * 0.34, len / 4 - cs * 0.02, cs * 0.68, cs * 0.04, i % 2 ? '#c89060' : '#b88050', { lineColor: '#6a4a28' });
  c.restore();
  // Ketjut torneista
  c.strokeStyle = '#6a6a7a';
  c.lineWidth = Math.max(1, cs * 0.025);
  var ex = x0 + Math.cos(-(1 - a) * Math.PI * 0.42) * len, ey = p.y + Math.sin(-(1 - a) * Math.PI * 0.42) * len;
  c.beginPath(); c.moveTo(p.x + cs * 0.45, p.y - cs * 0.45); c.lineTo(ex, ey - cs * 0.2); c.stroke();
  artRoundRect(c, p.x + cs * 0.36, p.y - cs * 0.55, cs * 0.14, cs * 0.3, cs * 0.04, '#9a9aaa', { lineColor: '#4a4a5a' });
}
function postDrawBunny(c, G, Lz) {
  var bp = postCell(post.bunny.fc, post.bunny.fr, Lz), cs = Lz.cs, hop = Math.sin(post.bunny.hop * Math.PI) * cs * 0.22;
  c.save();
  c.translate(bp.x, 0);
  c.scale(post.bunny.facing, 1);
  drawBunny(c, 0, bp.y + cs * 0.33, cs * 0.26, hop, globalT * 3, false);
  // Postilaukku ja lakki
  artRoundRect(c, -cs * 0.3, bp.y + cs * 0.02 - hop, cs * 0.2, cs * 0.18, cs * 0.04, '#a8703a', { lineColor: '#5a3a1a' });
  c.restore();
  if (post.failT > 0) {
    c.fillStyle = post.crash === 'lost' ? '#8a2be2' : '#ff5f5f';
    c.font = 'bold ' + Math.round(cs * 0.5) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(post.crash === 'lost' ? '?' : '!', bp.x, bp.y - cs * 0.6);
    c.textBaseline = 'alphabetic';
  }
}
// Juhlat: liput ruudukon yli ja asukkaat ovien edessä pomppimassa
function postDrawParty(c, G, Lz) {
  var cs = Lz.cs, x0 = Lz.ox, x1 = Lz.ox + cs * G.cols, i, k, n = 14, cols = ['#ff5f7e', '#ffd24f', '#5fa8ff', '#6fd66f', '#b678ff'];
  for (k = 0; k < 2; k++) {
    var y0 = Lz.oy + cs * (k === 0 ? 0.1 : G.rows * 0.5);
    c.strokeStyle = '#7a5a3a';
    c.lineWidth = Math.max(1, cs * 0.02);
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + cs * 0.5, x1, y0); c.stroke();
    for (i = 0; i < n; i++) {
      var u = (i + 0.5) / n, fx = x0 + (x1 - x0) * u, fy = y0 + cs * 0.5 * 2 * u * (1 - u) * 1.0;
      var sw = Math.sin(globalT * 4 + i) * cs * 0.03;
      c.fillStyle = cols[(i + k) % cols.length];
      c.beginPath(); c.moveTo(fx - cs * 0.12, fy); c.lineTo(fx + cs * 0.12, fy); c.lineTo(fx + sw, fy + cs * 0.24); c.closePath(); c.fill();
    }
  }
  for (i = 0; i < G.houses.length; i++) {
    var H = G.houses[i], p = postCell(H.dc, H.dr, Lz), at = 0.4 + i * 0.35;
    if (post.wonT < at) continue;
    var jy = Math.abs(Math.sin(globalT * 5 + i)) * cs * 0.15, s = cs * 0.24 * Math.min(1, (post.wonT - at) * 4);
    postDrawAnimal(c, H.kind, p.x - cs * 0.1, p.y + cs * 0.05 - jy, s, false);
    // Juhlahattu
    c.beginPath(); c.moveTo(p.x - cs * 0.1 - s * 0.35, p.y + cs * 0.05 - jy - s * 0.7); c.lineTo(p.x - cs * 0.1, p.y + cs * 0.05 - jy - s * 1.6); c.lineTo(p.x - cs * 0.1 + s * 0.35, p.y + cs * 0.05 - jy - s * 0.7); c.closePath();
    artFillPath(c, cols[i % cols.length], p.y - jy - s * 1.6, p.y - jy, s * 0.3, { lineColor: '#5a3a6a' });
  }
}
function postDrawProgram(c, R, b, sh) {
  var i, p;
  for (i = 0; i < R.slots; i++) {
    p = postSlotPos(i);
    var cmd = post.prog[i], active = post.running && post.steps[post.step] && post.steps[post.step].slot === i;
    var ps = p.s * (cmd && cmd.pop > 0 ? 1 + cmd.pop * 0.6 : 1);
    c.fillStyle = active ? '#ffe27a' : (cmd ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)');
    roundRect(c, p.x - ps / 2 + sh, p.y - ps / 2, ps, ps, ps * 0.2);
    c.fill();
    if (cmd) {
      drawArrowGlyph(c, p.x + sh, p.y, ps * 0.3, cmd.dir, '#5a3a8a');
      if (cmd.n > 1) {
        artCircle(c, p.x + ps * 0.38 + sh, p.y - ps * 0.38, ps * 0.22, '#ff7bac', { lineColor: '#fff' });
        c.fillStyle = '#fff';
        c.font = 'bold ' + Math.round(ps * 0.3) + 'px ' + UI_FONT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(cmd.n + '', p.x + ps * 0.38 + sh, p.y - ps * 0.36);
        c.textBaseline = 'alphabetic';
      }
    }
  }
  for (i = 0; i < b.arrows.length; i++) {
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.beginPath(); c.arc(b.arrows[i].x, b.arrows[i].y + b.r * 0.12, b.r, 0, Math.PI * 2); c.fill();
    artCircle(c, b.arrows[i].x, b.arrows[i].y, b.r, post.running ? '#d8cce8' : '#ffffff', { lineColor: '#b8a8d8' });
    drawArrowGlyph(c, b.arrows[i].x, b.arrows[i].y, b.r * 0.5, b.arrows[i].dir, '#8a2be2');
  }
  if (R.mult) {
    for (i = 0; i < b.mult.length; i++) {
      var m = b.mult[i], lastC = post.prog[post.prog.length - 1], on = lastC && lastC.n === m.n;
      artCircle(c, m.x, m.y, b.mr, on ? '#ff7bac' : '#ffffff', { lineColor: '#d86a9a' });
      c.fillStyle = on ? '#fff' : '#d8508a';
      c.font = 'bold ' + Math.round(b.mr * 0.9) + 'px ' + UI_FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('×' + m.n, m.x, m.y + b.mr * 0.05);
      c.textBaseline = 'alphabetic';
    }
  }
  var pulse = post.prog.length && !post.running ? 1 + Math.sin(globalT * 5) * 0.05 : 1;
  artCircle(c, b.play.x, b.play.y, b.play.r * pulse, post.running ? '#8fd06f' : '#3ccf6a', { lineColor: '#1f8a40' });
  c.fillStyle = '#fff';
  c.beginPath();
  c.moveTo(b.play.x - b.play.r * 0.3, b.play.y - b.play.r * 0.42);
  c.lineTo(b.play.x + b.play.r * 0.48, b.play.y);
  c.lineTo(b.play.x - b.play.r * 0.3, b.play.y + b.play.r * 0.42);
  c.closePath(); c.fill();
}
// Postilaukku: järjestyskierroksilla kirjeet jonossa (nuolet välissä) ja
// ensimmäinen isompana ja hehkuvana; muuten kirjeet vapaasti viuhkana.
function postDrawBag(c, G, sh) {
  var n = G.letters.length, p0 = postBagPos(0), p1 = postBagPos(n - 1), i, p, top = postTop(), ord = post.R.order;
  var bw = p1.x - p0.x + p0.w * 1.5, by = p0.y + p0.h * 0.35;
  // Laukku
  c.strokeStyle = '#7a4a20';
  c.lineWidth = Math.max(2, p0.h * 0.08);
  c.beginPath(); c.moveTo((p0.x + p1.x) / 2 - bw * 0.42, by); c.quadraticCurveTo((p0.x + p1.x) / 2, by - p0.h * 1.8, (p0.x + p1.x) / 2 + bw * 0.42, by); c.stroke();
  artRoundRect(c, (p0.x + p1.x) / 2 - bw / 2, by, bw, p0.h * 0.75, p0.h * 0.2, '#b07840', { lineColor: '#5a3a1a' });
  for (i = 0; i < n; i++) {
    p = postBagPos(i);
    var flying = false, k;
    for (k = 0; k < post.flies.length; k++) if (post.flies[k].i === i) flying = true;
    if (post.done[i] || flying) {
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(1, p.h * 0.05);
      roundRect(c, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, p.h * 0.12); c.stroke();
      continue;
    }
    var big = ord && i === top, sc = big ? 1.12 + Math.sin(globalT * 4) * 0.03 : 1, rot = ord ? 0 : (i - (n - 1) / 2) * 0.12;
    var hu = (post.bagT - 0.3 - (ord ? i * 0.35 : 0)) / 0.3, hop = hu > 0 && hu < 1 ? Math.sin(hu * Math.PI) * p.h * 0.6 : 0;
    if (big) artGlow(c, p.x, p.y, p.w * 0.9, '#ffe27a', 0.7);
    c.save();
    c.translate(p.x + sh, p.y - hop);
    c.rotate(rot);
    postDrawLetter(c, 0, 0, p.w * sc, p.h * sc, G, i);
    c.restore();
    if (ord && i < n - 1) drawArrowGlyph(c, (p.x + postBagPos(i + 1).x) / 2, p.y, p.h * 0.17, 1, '#8a5a2a');
  }
}
// Katkoviiva kirjeestä taloon (alussa 1. kierroksella ja kirjettä napautettaessa)
function postDrawShow(c, G, Lz) {
  var i, p, H, bx, a;
  if (post.showT <= 0) return;
  a = Math.min(1, post.showT * 2);
  c.save();
  if (c.setLineDash) c.setLineDash([Lz.cs * 0.1, Lz.cs * 0.08]);
  c.lineDashOffset = -globalT * Lz.cs * 0.5;
  c.strokeStyle = 'rgba(255,90,140,' + (0.85 * a) + ')';
  c.lineWidth = Math.max(2, Lz.cs * 0.04);
  for (i = 0; i < G.letters.length; i++) {
    if (post.showI >= 0 && i !== post.showI) continue;
    if (post.done[i]) continue;
    p = postBagPos(i);
    H = G.houses[G.letters[i].h];
    bx = postBoxPos(H, Lz);
    c.beginPath();
    c.moveTo(p.x, p.y + p.h * 0.5);
    c.quadraticCurveTo((p.x + bx.x) / 2, Math.min(p.y, bx.y) - Lz.cs, bx.x, bx.y);
    c.stroke();
  }
  c.restore();
  for (i = 0; i < G.letters.length; i++) {
    if (post.showI >= 0 && i !== post.showI) continue;
    if (post.done[i]) continue;
    bx = postBoxPos(G.houses[G.letters[i].h], Lz);
    artGlow(c, bx.x, bx.y, Lz.cs * 0.4, '#ff7bac', 0.5 * a);
  }
}
// Vihje ensimmäisellä kierroksella: käsi näyttää kaksi ensimmäistä nuolta, ja kun
// rivillä on koko reitin verran käskyjä, ▶:n. Loput lapsi päättelee itse.
function postDrawHint(c, b, G) {
  var sol = G.solution || [], tgt = null, k;
  if (post.round !== 0 || post.state !== 'play' || post.running || post.runs > 0) return;
  if (!(post.hintT > 3.2 || post.prog.length)) return;
  if (post.prog.length < 2 && !post.prog.some(function (q, qi) { return q.dir !== sol[qi]; })) tgt = b.arrows[sol[post.prog.length]];
  else if (post.prog.length >= sol.length) tgt = b.play;
  if (!tgt) return;
  k = (globalT % 1.2) / 1.2;
  drawHand(c, tgt.x + viewH * 0.01, tgt.y + viewH * 0.02 + Math.abs(Math.sin(k * Math.PI)) * viewH * 0.03, viewH * 0.04);
}

// HUD: kierrokset postimerkkeinä; kultainen = onnistui ensimmäisellä ajolla
function drawPostHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i, n = POST_ROUNDS.length;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, left, pad * 0.5, hs * 2.6 * n + hs * 1.2, hs * 3.6, hs);
  c.fill();
  for (i = 0; i < n; i++) {
    var done = i < post.round || post.state === 'won' || (i === post.round && post.state === 'roundDone');
    var x = left + hs * 1.9 + i * hs * 2.6, y = pad * 0.5 + hs * 1.8;
    c.globalAlpha = done ? 1 : 0.3;
    if (done && post.gold[i]) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.7);
    postDrawStamp(c, x, y, hs * 0.95, done && post.gold[i]);
    c.globalAlpha = 1;
  }
}
function postDrawStamp(c, x, y, s, gold) {
  var k;
  c.fillStyle = '#ffffff';
  roundRect(c, x - s, y - s * 1.15, s * 2, s * 2.3, s * 0.1); c.fill();
  // Hammastettu reuna
  c.fillStyle = 'rgba(120,100,140,0.35)';
  for (k = 0; k < 5; k++) {
    c.beginPath(); c.arc(x - s + k * s * 0.5, y - s * 1.15, s * 0.1, 0, Math.PI * 2); c.arc(x - s + k * s * 0.5, y + s * 1.15, s * 0.1, 0, Math.PI * 2); c.fill();
  }
  artRoundRect(c, x - s * 0.75, y - s * 0.9, s * 1.5, s * 1.8, s * 0.08, gold ? '#ffd24f' : '#ff9ab8', { lineColor: gold ? '#b8862a' : '#b0506a' });
  drawPostHeart(c, x, y, s * 0.4, 1);
}

HUB_ICONS.post = function (c, x, y, s) {
  var H = { color: '#ffe08a', num: 3, kind: 'hen', peek: 0, shake: 0, heart: 0, wig: 0 };
  postDrawHouse(c, x + s * 0.1, y - s * 0.08, s * 0.4, H);
  postDrawEnvelope(c, x - s * 0.16, y + s * 0.12, s * 0.26, s * 0.18);
  c.fillStyle = '#ff7bac';
  c.fillRect(x - s * 0.1, y + s * 0.05, s * 0.05, s * 0.05);
};
