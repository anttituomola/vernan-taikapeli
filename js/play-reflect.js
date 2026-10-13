'use strict';

// Peilipupu (Kaukamaa, Pupula): peilitalon pulma. Ruudulla on kaksi yhtä
// suurta lautaa rinnakkain, ja niiden välissä hohtaa taikapeili. Vasemmalla
// on pinkki pupu (pelaajan oma), oikealla sen peilikuva (hopeanlila).
// Yksi nuolen napautus hypäyttää MOLEMPIA pupuja yhtä aikaa: ylös ja alas
// ovat samat, mutta vasen ja oikea ovat peilikuvalle PEILATUT (vasen nuoli:
// pinkki vasemmalle, peilikuva oikealle). Nuolinapeissa iso pinkki nuoli on
// oman pupun suunta ja pieni lila nuoli peilikuvan.
//
// Pensasruukku tai laudan reuna pysäyttää pupun: se tömähtää paikallaan,
// kun toinen liikkuu. Laudoilla on eri pensaat, joten pupuja siirretään
// toistensa suhteen juuri näillä tömähdyksillä. Kierros on läpi, kun
// molemmat seisovat omalla porkkanallaan yhtä aikaa. Kolmannesta
// kierroksesta alkaen laudoilla on taikakuoppia: kuoppaan hypännyt pupu
// putoaa, ja molemmat palaavat kierroksen alkuun (takaisku, ei sydämiä).
// Neljännellä kierroksella tähtiä voi kerätä bonukseksi.
//
// Jokainen kierros arvotaan ja tarkistetaan leveyshaulla yhteisestä tilasta
// (vasemman ruutu, oikean ruutu): lyhin ratkaisu on kierroksen mittainen,
// ratkaisu vaatii vähintään `desync` tömähdystä (siirtoa, jossa tasan toinen
// pupu pysähtyy; laskettu 0-1-leveyshaulla kaikista ratkaisuista), mistään
// saavutettavasta tilasta ei jää jumiin ja kuopat uhkaavat reittiä.
// Peruutus (↶) on ilmainen, ↻ aloittaa kierroksen alusta. Vihjekäsi
// näyttää seuraavan nuolen, kun pelaaja on ollut 12 s hiljaa tai pudonnut
// kahdesti. Kultainen porkkana: ei vihjettä ja enintään 2 ylimääräistä
// hyppyä (tassunjäljet oikeassa yläkulmassa).

// Kierrokset: ruudukko, pensaita laudalle `walls` [min, max], kuoppia
// yhteensä `holes`, tähtiä `stars`, lyhimmän ratkaisun pituus `len`,
// tarvittavat tömähdykset `desync`, kuoppien uhka `threat` (montako
// ratkaisun tilaa on yhden väärän nuolen päässä kuopasta).
var REFL_ROUNDS = [
  { cols: 4, rows: 4, walls: [1, 3], holes: [0, 0], stars: 0, len: [5, 7], desync: [1, 1], threat: 0 },
  { cols: 5, rows: 5, walls: [3, 5], holes: [0, 0], stars: 0, len: [8, 10], desync: [2, 3], threat: 0 },
  { cols: 5, rows: 5, walls: [2, 4], holes: [2, 3], stars: 0, len: [8, 11], desync: [2, 3], threat: 2 },
  { cols: 6, rows: 5, walls: [3, 5], holes: [2, 3], stars: 2, len: [9, 12], desync: [2, 3], threat: 2 }
];
// Varalaudat, jos arvonta ei onnistu (merkit: . lattia, # pensas,
// o kuoppa, S lähtö, C porkkana, * tähti). Tarkistetaan samalla analyysillä.
var REFL_FALLBACK = [
  { L: ['.C..', '#..#', '....', '..S.'], R: ['..C.', '..#.', '....', 'S...'] },
  { L: ['...C.', '...#.', '..##.', '...#.', '...S.'], R: ['..C..', '.#.##', '.....', '...#S', '.....'] },
  { L: ['..#..', '.....', '....o', 'C..S.', '.#.##'], R: ['...o.', '...C.', '#....', '....#', 'S....'] },
  { L: ['...#..', '..C...', '.....S', '#.o...', '#...*.'], R: ['o....#', '......', '#o#...', '......', '#SC.*#'] }
];
var REFL_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];  // ylös, oikea, alas, vasen
var REFL_MIRROR = [0, 3, 2, 1];                      // peilikuvan suunta
var REFL_HOP_T = 0.18;       // hypyn kesto (s)
var REFL_BONK_T = 0.24;      // tömähdyksen kesto (s)
var REFL_HINT_IDLE = 12;     // vihje hiljaisuuden jälkeen (s)
var REFL_HINT_AGAIN = 6;     // kahden putoamisen jälkeen vihje tihenee (s)
var REFL_MAX_TRIES = 4000;   // arvontayrityksiä kierrosta kohti
var REFL_PCOL = ['#ff7bac', '#b8a4ff'];
var REFL_LAMP_COLS = ['#ffd24f', '#ff7bac', '#7fd0ff', '#9ff09a', '#c79bff'];

var refl = {
  round: 0, state: 'intro', t: 0, G: null, b: [], hist: [], queue: -1, idle: 0, hint: -1, hintUsed: false,
  hintSoon: false, falls: 0, waste: 0, gold: [], stars: [], taskDelay: -1, demo: null, press: {},
  waveT: 0, mirrorT: 0, bubbleT: 0, eatT: 0, mole: null, moleT: 3, wonT: 0, starsGot: 0, starsAll: 0
};
var reflOff = null;

// ---------- Säännöt ----------
function reflRand(n) { return Math.floor(Math.random() * n); }
function reflRange(a) { return a[0] + reflRand(a[1] - a[0] + 1); }
// Yksi nuoli d: palauttaa uudet ruudut ja kummankin tömähdyksen ja putoamisen
function reflStep(G, a, b, d) {
  var res = { a: a, b: b, ba: false, bb: false, fa: false, fb: false }, k, cur, dd, c, r, nc, nr, ni;
  for (k = 0; k < 2; k++) {
    cur = k ? b : a;
    dd = k ? REFL_MIRROR[d] : d;
    c = cur % G.cols; r = (cur - c) / G.cols;
    nc = c + REFL_DIRS[dd][0]; nr = r + REFL_DIRS[dd][1];
    ni = nc + nr * G.cols;
    if (nc < 0 || nr < 0 || nc >= G.cols || nr >= G.rows || G.wall[k][ni]) {
      if (k) res.bb = true; else res.ba = true;
      continue;
    }
    if (k) res.b = ni; else res.a = ni;
    if (G.hole[k][ni]) { if (k) res.fb = true; else res.fa = true; }
  }
  return res;
}
// Kelpaava siirto pelissä: ei tyhjää siirtoa (molemmat tömähtävät)
function reflValid(R) { return !R.fa && !R.fb && !(R.ba && R.bb); }

// Haun siirtotaulu: tila u = vasen * N + oikea. T[u * 4 + d] = uusi tila,
// -1 = ei kelpaa (putoaminen tai molemmat tömähtävät); D = tömähtikö tasan toinen.
function reflTable(G) {
  var N = G.cols * G.rows, S = N * N, T = new Int32Array(S * 4), D = new Uint8Array(S * 4), mv = [], k, i, d, c, r, nc, nr, a, b, na, nb;
  for (k = 0; k < 2; k++) {
    mv[k] = new Int16Array(N * 4);
    for (i = 0; i < N; i++) {
      c = i % G.cols; r = (i - c) / G.cols;
      for (d = 0; d < 4; d++) {
        nc = c + REFL_DIRS[d][0]; nr = r + REFL_DIRS[d][1];
        if (nc < 0 || nr < 0 || nc >= G.cols || nr >= G.rows || G.wall[k][nc + nr * G.cols]) mv[k][i * 4 + d] = -1;
        else if (G.hole[k][nc + nr * G.cols]) mv[k][i * 4 + d] = -2;
        else mv[k][i * 4 + d] = nc + nr * G.cols;
      }
    }
  }
  for (a = 0; a < N; a++) for (b = 0; b < N; b++) for (d = 0; d < 4; d++) {
    i = (a * N + b) * 4 + d;
    na = mv[0][a * 4 + d]; nb = mv[1][b * 4 + REFL_MIRROR[d]];
    if (na === -2 || nb === -2 || (na === -1 && nb === -1)) { T[i] = na === -2 || nb === -2 ? -2 : -1; continue; }
    D[i] = na === -1 || nb === -1 ? 1 : 0;
    T[i] = (na < 0 ? a : na) * N + (nb < 0 ? b : nb);
  }
  return { N: N, S: S, T: T, D: D };
}

// Leveyshaku tilasta (a, b) maaliin: lyhin nuolijono tai null
function reflSolveFrom(G, a, b, TB) {
  TB = TB || reflTable(G);
  var N = TB.N, S = TB.S, T = TB.T, seen = new Uint8Array(S), prevS = new Int32Array(S), prevD = new Int8Array(S);
  var q = new Int32Array(S), head = 0, tail = 0, s0 = a * N + b, goal = G.carrot[0] * N + G.carrot[1], u, d, v, path;
  if (s0 === goal) return [];
  seen[s0] = 1;
  q[tail++] = s0;
  while (head < tail) {
    u = q[head++];
    for (d = 0; d < 4; d++) {
      v = T[u * 4 + d];
      if (v < 0 || seen[v]) continue;
      seen[v] = 1; prevS[v] = u; prevD[v] = d;
      if (v === goal) {
        path = [];
        while (v !== s0) { path.unshift(prevD[v]); v = prevS[v]; }
        return path;
      }
      q[tail++] = v;
    }
  }
  return null;
}

// Etäisyys (hyppyjä) ja vähimmät tömähdykset lähtötilasta kaikkiin tiloihin.
// Tömähdykset: 0-1-leveyshaku kerroksittain (tömähdys maksaa 1, muu siirto 0).
function reflCosts(TB, s0) {
  var S = TB.S, T = TB.T, D = TB.D, dist = new Int16Array(S), cost = new Int16Array(S), q = new Int32Array(S), head = 0, tail = 0;
  var buckets = [[s0]], list, u, v, d, i, j, k, w;
  for (i = 0; i < S; i++) { dist[i] = -1; cost[i] = 999; }
  dist[s0] = 0;
  q[tail++] = s0;
  while (head < tail) {
    u = q[head++];
    for (d = 0; d < 4; d++) {
      v = T[u * 4 + d];
      if (v < 0 || dist[v] >= 0) continue;
      dist[v] = dist[u] + 1;
      q[tail++] = v;
    }
  }
  cost[s0] = 0;
  for (k = 0; k < buckets.length && k < 40; k++) {
    list = buckets[k];
    if (!list) continue;
    for (j = 0; j < list.length; j++) {
      u = list[j];
      if (cost[u] !== k) continue;
      for (d = 0; d < 4; d++) {
        v = T[u * 4 + d];
        if (v < 0) continue;
        w = k + D[u * 4 + d];
        if (w < cost[v]) {
          cost[v] = w;
          if (!buckets[w]) buckets[w] = [];
          buckets[w].push(v);
        }
      }
    }
  }
  return { dist: dist, cost: cost };
}

// Laudan analyysi: lyhin ratkaisu, vähimmät tömähdykset, jumitilat, kuoppien
// uhka. R (valinnainen) karsii aikaisin, jos pituus tai tömähdykset eivät sovi.
function reflAnalyze(G, R) {
  var TB = reflTable(G), N = TB.N, S = TB.S, T = TB.T, q = new Int32Array(S), seen = new Uint8Array(S), head = 0, tail = 0;
  var s0 = G.start[0] * N + G.start[1], goal = G.carrot[0] * N + G.carrot[1], u, d, v, i, path;
  path = reflSolveFrom(G, G.start[0], G.start[1], TB);
  if (!path || !path.length) return null;
  if (R && (path.length < R.len[0] || path.length > R.len[1])) return null;
  var cost = reflCosts(TB, s0).cost;
  if (R && (cost[goal] < R.desync[0] || cost[goal] > R.desync[1])) return null;
  // Kuoppien uhka ratkaisun varrella ja reitin ruudut
  var threat = 0, onPath = [{}, {}];
  u = s0;
  for (i = 0; i <= path.length; i++) {
    onPath[0][(u / N) | 0] = true; onPath[1][u % N] = true;
    if (i === path.length) break;
    for (d = 0; d < 4; d++) if (T[u * 4 + d] === -2) { threat++; break; }
    u = T[u * 4 + path[i]];
  }
  if (R && threat < R.threat) return null;
  // Jumitilat: saavutettava tila, josta maaliin ei pääse
  seen[s0] = 1;
  q[tail++] = s0;
  while (head < tail) {
    u = q[head++];
    for (d = 0; d < 4; d++) {
      v = T[u * 4 + d];
      if (v < 0 || seen[v]) continue;
      seen[v] = 1;
      q[tail++] = v;
    }
  }
  var can = new Uint8Array(S), changed = true, traps = 0;
  can[goal] = 1;
  while (changed) {
    changed = false;
    for (i = tail - 1; i >= 0; i--) {
      u = q[i];
      if (can[u]) continue;
      for (d = 0; d < 4; d++) {
        v = T[u * 4 + d];
        if (v >= 0 && can[v]) { can[u] = 1; changed = true; break; }
      }
    }
  }
  for (i = 0; i < tail; i++) if (!can[q[i]]) traps++;
  return { len: path.length, path: path, desync: cost[goal], traps: traps, threat: threat, can: can, reach: q.subarray(0, tail), onPath: onPath, TB: TB };
}

// Lyhin ratkaisu, joka kerää kaikki tähdet (maali päättää kierroksen heti)
function reflStarLen(G, TB) {
  TB = TB || reflTable(G);
  var N = TB.N, S = TB.S, T = TB.T, n = G.stars.length, M = 1 << n, full = M - 1, TT = S * M;
  var dist = new Int16Array(TT), q = new Int32Array(TT), head = 0, tail = 0, u, d, v, m, st, nm, i, s0, goal = G.carrot[0] * N + G.carrot[1];
  for (i = 0; i < TT; i++) dist[i] = -1;
  function mask(m0, s) {
    for (var k = 0; k < n; k++) if (G.stars[k].i === (G.stars[k].s ? s % N : (s / N) | 0)) m0 |= 1 << k;
    return m0;
  }
  s0 = G.start[0] * N + G.start[1];
  m = mask(0, s0);
  dist[s0 * M + m] = 0;
  q[tail++] = s0 * M + m;
  while (head < tail) {
    u = q[head++];
    st = (u / M) | 0; m = u % M;
    if (st === goal) { if (m === full) return dist[u]; continue; }
    for (d = 0; d < 4; d++) {
      v = T[st * 4 + d];
      if (v < 0) continue;
      nm = mask(m, v);
      if (dist[v * M + nm] >= 0) continue;
      dist[v * M + nm] = dist[u] + 1;
      q[tail++] = v * M + nm;
    }
  }
  return -1;
}

function reflEmpty(R) {
  var G = { cols: R.cols, rows: R.rows, wall: [[], []], hole: [[], []], start: [0, 0], carrot: [0, 0], stars: [] }, k, i;
  for (k = 0; k < 2; k++) for (i = 0; i < R.cols * R.rows; i++) { G.wall[k][i] = false; G.hole[k][i] = false; }
  return G;
}
function reflFreeCell(G, k, avoid) {
  var i, n = 0, pick = -1, N = G.cols * G.rows;
  for (i = 0; i < N; i++) {
    if (G.wall[k][i] || G.hole[k][i] || (avoid && avoid[i])) continue;
    n++;
    if (reflRand(n) === 0) pick = i;
  }
  return pick;
}

// Yksi arvontayritys; null jos ehdot eivät täyty
function reflTryGenerate(R, ri) {
  var G = reflEmpty(R), k, n, i, A = null, cand, d, ok, St, TB, C, N, list, v;
  for (k = 0; k < 2; k++) {
    n = reflRange(R.walls);
    for (i = 0; i < n; i++) { d = reflFreeCell(G, k); if (d >= 0) G.wall[k][d] = true; }
  }
  n = reflRange(R.holes);
  for (i = 0; i < n; i++) { k = reflRand(2); d = reflFreeCell(G, k); if (d >= 0) G.hole[k][d] = true; }
  for (k = 0; k < 2; k++) {
    G.start[k] = reflFreeCell(G, k);
    if (G.start[k] < 0) return null;
  }
  // Ensimmäinen kierros: alussa vasen tai oikea nuoli liikuttaa molempia (esittely)
  G.demo = -1;
  if (ri === 0) {
    for (d = 1; d <= 3; d += 2) {
      St = reflStep(G, G.start[0], G.start[1], d);
      if (!St.ba && !St.bb && !St.fa && !St.fb) { G.demo = d; break; }
    }
    if (G.demo < 0) return null;
  }
  // Porkkanat valitaan tiloista, joiden etäisyys ja tömähdykset sopivat kierrokselle
  TB = reflTable(G);
  N = TB.N;
  C = reflCosts(TB, G.start[0] * N + G.start[1]);
  // Tavoitepituus arvotaan tasaisesti, jotta lyhyet ratkaisut eivät hallitse
  n = reflRange(R.len);
  for (i = 0; i < 2; i++) {
    list = [];
    for (v = 0; v < TB.S; v++) {
      if (C.dist[v] < R.len[0] || C.dist[v] > R.len[1] || C.cost[v] < R.desync[0] || C.cost[v] > R.desync[1]) continue;
      if (((v / N) | 0) === G.start[0] || v % N === G.start[1] || (!i && C.dist[v] !== n)) continue;
      list.push(v);
    }
    if (list.length) break;
  }
  for (k = 0; k < 4 && list.length; k++) {
    i = reflRand(list.length);
    v = list[i];
    list[i] = list[list.length - 1];
    list.pop();
    G.carrot = [(v / N) | 0, v % N];
    A = reflAnalyze(G, R);
    if (A && !A.traps) break;
    A = null;
  }
  if (!A) return null;
  G.len = A.len;
  G.desync = A.desync;
  G.lenStars = A.len;
  if (R.stars) {
    // Tähdet ruutuihin, joihin pupu pääsee, mutta jotka eivät ole lyhimmällä reitillä
    cand = [[], []];
    for (k = 0; k < 2; k++) {
      var seenC = {};
      for (i = 0; i < A.reach.length; i++) {
        if (!A.can[A.reach[i]]) continue;
        d = k ? A.reach[i] % (R.cols * R.rows) : (A.reach[i] / (R.cols * R.rows)) | 0;
        if (seenC[d] || A.onPath[k][d] || d === G.carrot[k]) continue;
        seenC[d] = true;
        cand[k].push(d);
      }
    }
    ok = false;
    for (n = 0; n < 6 && !ok; n++) {
      var all = [];
      for (k = 0; k < 2; k++) for (i = 0; i < cand[k].length; i++) all.push({ s: k, i: cand[k][i] });
      if (all.length < R.stars) return null;
      G.stars = [];
      for (i = 0; i < R.stars; i++) {
        d = i + reflRand(all.length - i);
        var tmp = all[i]; all[i] = all[d]; all[d] = tmp;
        G.stars.push(all[i]);
      }
      G.lenStars = reflStarLen(G, A.TB);
      ok = G.lenStars > G.len && G.lenStars <= G.len + 4;
    }
    if (!ok) return null;
  }
  return G;
}
function reflParse(def) {
  var rows = def.L.length, cols = def.L[0].length, G = reflEmpty({ cols: cols, rows: rows }), k, r, c, ch, i, A, d, St;
  for (k = 0; k < 2; k++) for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
    ch = (k ? def.R : def.L)[r].charAt(c);
    i = c + r * cols;
    if (ch === '#') G.wall[k][i] = true;
    else if (ch === 'o') G.hole[k][i] = true;
    else if (ch === 'S') G.start[k] = i;
    else if (ch === 'C') G.carrot[k] = i;
    else if (ch === '*') G.stars.push({ s: k, i: i });
  }
  A = reflAnalyze(G);
  G.len = A ? A.len : 8;
  G.desync = A ? A.desync : 0;
  G.lenStars = G.stars.length ? reflStarLen(G) : G.len;
  G.demo = 3;
  for (d = 1; d <= 3; d += 2) {
    St = reflStep(G, G.start[0], G.start[1], d);
    if (!St.ba && !St.bb && !St.fa && !St.fb) { G.demo = d; break; }
  }
  return G;
}
function reflGenerate(ri) {
  var R = REFL_ROUNDS[ri], i, G;
  for (i = 0; i < REFL_MAX_TRIES; i++) {
    G = reflTryGenerate(R, ri);
    if (G) { G.tries = i + 1; return G; }
  }
  G = reflParse(REFL_FALLBACK[ri]);
  G.tries = -1;
  return G;
}

// ---------- Kierros ----------
function reflNewBunny(k, i) {
  return { k: k, i: i, fi: i, t: 1, bonkD: -1, bonkT: 0, facing: k ? -1 : 1, fall: false, fallT: -1, waveT: 0, pokeT: 0, popT: 0 };
}
function reflStartRound() {
  var G = refl.G = reflGenerate(refl.round), i;
  refl.b = [reflNewBunny(0, G.start[0]), reflNewBunny(1, G.start[1])];
  refl.hist = [];
  refl.queue = -1;
  refl.idle = 0;
  refl.bubbleT = 0;
  refl.hint = -1;
  refl.hintUsed = false;
  refl.hintSoon = false;
  refl.falls = 0;
  refl.waste = 0;
  refl.eatT = 0;
  refl.stars = [];
  for (i = 0; i < G.stars.length; i++) refl.stars.push({ s: G.stars[i].s, i: G.stars[i].i, got: false });
  refl.starsAll = G.stars.length;
  refl.state = 'play';
  refl.t = 0;
  refl.demo = null;
  if (refl.round === 0) { refl.state = 'demo'; refl.demo = { d: G.demo, step: 0 }; }
  reflPlaceProps();
  playNote(523, 0, 0.12, 'triangle', 0.3);
  playNote(784, 0.1, 0.2, 'triangle', 0.3);
}

// ---------- Alustus ----------
function initReflect() {
  var i;
  tasks = [makeTask(-5, 'answer', { minLen: 4, maxLen: 8 }), makeTask(-5, 'mirror')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  refl.round = 0;
  refl.state = 'intro';
  refl.t = 0;
  refl.G = null;
  refl.b = [];
  refl.gold = [];
  refl.starsGot = 0;
  refl.taskDelay = -1;
  refl.press = {};
  refl.wonT = 0;
  reflSetupProps();
  renderBackground();
}
function respawnReflect() { reflStartRound(); }
function resizeReflect() { camX = 0; reflPlaceProps(); }

// ---------- Asettelu ----------
function reflLayoutFor(R) {
  var W = viewW, h = viewH, top = h * 0.15, bot = h * 0.8;
  var cs = Math.min((bot - top) / R.rows, W * 0.84 / (2 * R.cols + 0.9), h * 0.16);
  var gap = cs * 0.9, bw = cs * R.cols;
  return { cs: cs, gap: gap, ox: [W * 0.5 - gap / 2 - bw, W * 0.5 + gap / 2], oy: top + (bot - top - cs * R.rows) / 2, bw: bw, bh: cs * R.rows };
}
function reflLayout() { return reflLayoutFor(refl.G || REFL_ROUNDS[refl.round] || REFL_ROUNDS[0]); }
function reflCellXY(k, c, r, Lz) {
  return { x: Lz.ox[k] + (c + 0.5) * Lz.cs, y: Lz.oy + (r + 0.5) * Lz.cs };
}
function reflCell(k, i, Lz) {
  var cols = refl.G.cols, c = i % cols;
  return reflCellXY(k, c, (i - c) / cols, Lz);
}
// Napit: nuolet rivissä alhaalla keskellä (vasen, ylös, alas, oikea), peruutus vasemmalla, alusta oikealla
function reflButtons() {
  var W = viewW, h = viewH, r = Math.min(h * 0.07, W * 0.045), sp = r * 2.35, y = h * 0.895, cx = W * 0.5, order = [3, 0, 2, 1], arrows = [], k;
  for (k = 0; k < 4; k++) arrows.push({ dir: order[k], x: cx + (k - 1.5) * sp, y: y, key: 'a' + order[k] });
  return {
    arrows: arrows, r: r,
    undo: { x: cx - 1.5 * sp - sp * 1.3, y: y, r: r * 0.92, key: 'undo' },
    restart: { x: cx + 1.5 * sp + sp * 1.3, y: y, r: r * 0.92, key: 'restart' }
  };
}
// Kapein sivumarginaali kaikilla kierroksilla (koristeet eivät osu laudoille)
function reflMargin() {
  var m = 1e9, i;
  for (i = 0; i < REFL_ROUNDS.length; i++) m = Math.min(m, reflLayoutFor(REFL_ROUNDS[i]).ox[0]);
  return m;
}

// ---------- Napautus ----------
function handleReflectTap(px, py) {
  var B, i, Lz, k, b, p, dx, dy, mx;
  if (puzzleBusy() || celebrating) return;
  B = reflButtons();
  if (refl.G && (refl.state === 'play' || refl.state === 'demo')) {
    for (i = 0; i < B.arrows.length; i++) {
      if (Math.hypot(px - B.arrows[i].x, py - B.arrows[i].y) < B.r * 1.15) {
        refl.press[B.arrows[i].key] = 0.18;
        if (refl.state === 'play') reflInput(B.arrows[i].dir);
        return;
      }
    }
    if (Math.hypot(px - B.undo.x, py - B.undo.y) < B.undo.r * 1.25) { refl.press.undo = 0.18; reflUndo(); return; }
    if (Math.hypot(px - B.restart.x, py - B.restart.y) < B.restart.r * 1.25) { refl.press.restart = 0.18; reflRestart(); return; }
  }
  if (propsTap(px, py)) return;
  if (refl.G) {
    Lz = reflLayout();
    // Taikapeili laudojen välissä: molemmat puput vilkuttavat
    mx = viewW * 0.5;
    if (Math.abs(px - mx) < Lz.gap * 0.5 && py > Lz.oy - Lz.cs * 0.5 && py < Lz.oy + Lz.bh + Lz.cs * 0.2) {
      reflMirrorPoke();
      return;
    }
    for (k = 0; k < 2; k++) {
      if (px < Lz.ox[k] || px > Lz.ox[k] + Lz.bw || py < Lz.oy || py > Lz.oy + Lz.bh) continue;
      b = refl.b[k];
      p = reflCell(k, b.i, Lz);
      dx = px - p.x; dy = py - p.y;
      if (Math.hypot(dx, dy) < Lz.cs * 0.55) {
        // Pupun tökkäys: pieni loikka paikallaan ja piippaus
        if (b.t >= 1 && b.bonkT <= 0) {
          b.pokeT = 0.45;
          playNote(k ? 1175 : 988, 0, 0.08, 'sine', 0.22);
          playNote(k ? 1568 : 1319, 0.08, 0.1, 'sine', 0.18);
        }
        return;
      }
      // Napautus laudalla pupun viereen: hyppy siihen suuntaan (oikealla laudalla peilattuna)
      if (refl.state === 'play') {
        if (Math.abs(dx) > Math.abs(dy)) i = dx > 0 ? 1 : 3; else i = dy > 0 ? 2 : 0;
        if (k) i = REFL_MIRROR[i];
        reflInput(i);
      }
      return;
    }
  }
  ambientPoke(px, py);
}
function reflMirrorPoke() {
  var i;
  refl.mirrorT = 1;
  for (i = 0; i < refl.b.length; i++) refl.b[i].waveT = 1.4;
  playNote(1319, 0, 0.12, 'sine', 0.2);
  playNote(1760, 0.1, 0.18, 'sine', 0.18);
  playNote(2093, 0.2, 0.25, 'sine', 0.12);
}
function reflBusy() {
  var i, b;
  for (i = 0; i < refl.b.length; i++) {
    b = refl.b[i];
    if (b.t < 1 || b.bonkT > 0) return true;
  }
  return false;
}
// Nuolen napautus: heti, tai jonoon (enintään yksi) hypyn ajaksi
function reflInput(d) {
  refl.idle = 0;
  refl.bubbleT = 0;
  if (refl.state !== 'play') return;
  if (reflBusy()) { refl.queue = d; return; }
  reflMove(d);
}
function reflMove(d) {
  var G = refl.G, R = reflStep(G, refl.b[0].i, refl.b[1].i, d), k, b, dd, bonked = false;
  refl.hist.push([refl.b[0].i, refl.b[1].i]);
  refl.hint = -1;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    dd = k ? REFL_MIRROR[d] : d;
    if (dd === 1) b.facing = 1; else if (dd === 3) b.facing = -1;
    if (k ? R.bb : R.ba) {
      b.bonkD = dd;
      b.bonkT = REFL_BONK_T;
      bonked = true;
    } else {
      b.fi = b.i;
      b.i = k ? R.b : R.a;
      b.t = 0;
      b.fall = k ? R.fb : R.fa;
    }
  }
  if (bonked) {
    playNote(196, 0, 0.09, 'square', 0.07);
    playNote(147, 0.05, 0.12, 'triangle', 0.18);
  }
  if (!R.ba || !R.bb) playNote(520 + refl.hist.length * 18, 0, 0.06, 'sine', 0.14);
}
function reflUndo() {
  var prev, k, b;
  if (refl.state !== 'play' || reflBusy() || !refl.hist.length) return;
  refl.queue = -1;
  refl.idle = 0;
  refl.hint = -1;
  prev = refl.hist.pop();
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    if (b.i === prev[k]) continue;
    b.fi = b.i;
    b.i = prev[k];
    b.t = 0;
  }
  playNote(784, 0, 0.06, 'triangle', 0.18);
  playNote(587, 0.06, 0.08, 'triangle', 0.18);
}
function reflRestart() {
  if (refl.state !== 'play' || reflBusy() || !refl.hist.length) return;
  refl.queue = -1;
  refl.idle = 0;
  refl.hint = -1;
  refl.hist = [];
  reflPoofHome();
}
// Molemmat puput pöllähtävät lähtöruutuunsa
function reflPoofHome() {
  var Lz = reflLayout(), k, b, p;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    p = reflCell(k, b.i, Lz);
    artPop(p.x, p.y, Lz.cs * 0.4, '#ffffff', 'ring');
    refl.b[k] = reflNewBunny(k, refl.G.start[k]);
    refl.b[k].facing = b.facing;
    refl.b[k].popT = 0.4;
    p = reflCell(k, refl.G.start[k], Lz);
    spawnSparkles(p.x, p.y, 10, REFL_PCOL[k]);
  }
  playNote(659, 0, 0.08, 'triangle', 0.2);
  playNote(988, 0.08, 0.12, 'triangle', 0.2);
}

// ---------- Päivitys ----------
function updateReflect(dt) {
  var busy, i, k, b;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  busy = puzzleBusy();
  for (k in refl.press) if (refl.press[k] > 0) refl.press[k] -= dt;
  if (refl.mirrorT > 0) refl.mirrorT -= dt;
  for (i = 0; i < refl.b.length; i++) {
    b = refl.b[i];
    if (b.waveT > 0) b.waveT -= dt;
    if (b.pokeT > 0) b.pokeT -= dt;
    if (b.popT > 0) b.popT -= dt;
  }
  reflUpdateMole(dt);
  if (refl.taskDelay > 0 && !busy) {
    refl.taskDelay -= dt;
    if (refl.taskDelay <= 0) {
      if (refl.round === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (refl.round === 2 && !tasks[1].opened) taskStart(tasks[1]);
      busy = puzzleBusy();
    }
  }
  if (busy || celebrating) return;
  refl.t += dt;
  if (refl.state === 'intro') { if (refl.t > 0.6) reflStartRound(); return; }
  if (refl.state === 'roundDone') {
    refl.eatT += dt;
    reflAnimate(dt);
    if (refl.t > 2.4 && refl.taskDelay <= 0) {
      refl.round++;
      if (refl.round >= REFL_ROUNDS.length) { refl.state = 'won'; refl.t = 0; refl.wonT = 0; soundFanfare(); }
      else reflStartRound();
    }
    return;
  }
  if (refl.state === 'won') {
    refl.wonT += dt;
    if (refl.wonT > 3.2 && !celebrating) startCelebration();
    return;
  }
  if (refl.state === 'demo') { reflAnimate(dt); reflUpdateDemo(); return; }
  if (refl.state === 'fall') { reflAnimate(dt); reflUpdateFall(dt); return; }
  reflAnimate(dt);
  if (reflBusy()) return;
  // Hyppy päättyi: putoaminen, jonossa oleva nuoli tai maali
  for (k = 0; k < 2; k++) {
    if (refl.b[k].fall && refl.b[k].fallT < 0) {
      refl.state = 'fall';
      refl.t = 0;
      refl.queue = -1;
      reflStartFall();
      return;
    }
  }
  if (refl.queue >= 0) { i = refl.queue; refl.queue = -1; reflMove(i); return; }
  if (refl.b[0].i === refl.G.carrot[0] && refl.b[1].i === refl.G.carrot[1]) { reflRoundDone(); return; }
  refl.idle += dt;
  refl.bubbleT += dt;
  reflUpdateHint();
}
// Hyppyjen ja tömähdysten eteneminen; laskeutuessa tähdet kerätään
function reflAnimate(dt) {
  var k, b, j, S, Lz, p;
  for (k = 0; k < refl.b.length; k++) {
    b = refl.b[k];
    if (b.bonkT > 0) b.bonkT = Math.max(0, b.bonkT - dt);
    if (b.t < 1) {
      b.t = Math.min(1, b.t + dt / REFL_HOP_T);
      if (b.t >= 1) {
        b.fi = b.i;
        for (j = 0; j < refl.stars.length; j++) {
          S = refl.stars[j];
          if (S.got || S.s !== k || S.i !== b.i || b.fall) continue;
          S.got = true;
          refl.starsGot++;
          Lz = reflLayout();
          p = reflCell(k, b.i, Lz);
          artPop(p.x, p.y, Lz.cs * 0.5, '#ffe27a', 'burst');
          spawnSparkles(p.x, p.y, 14, '#ffe27a');
          playNote(1319, 0, 0.1, 'triangle', 0.28);
          playNote(1760, 0.1, 0.22, 'triangle', 0.25);
        }
      }
    }
  }
}
function reflStartFall() {
  var k, b;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    if (b.fall) b.fallT = 0;
  }
  // Liukuva vihellys alas
  playNote(880, 0, 0.12, 'sine', 0.22);
  playNote(660, 0.1, 0.12, 'sine', 0.2);
  playNote(440, 0.2, 0.15, 'sine', 0.18);
  playNote(262, 0.32, 0.25, 'triangle', 0.18);
}
function reflUpdateFall(dt) {
  var k, b, Lz, p, was = refl.t - dt;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    if (b.fallT >= 0) b.fallT += dt;
  }
  if (was < 0.6 && refl.t >= 0.6) {
    Lz = reflLayout();
    for (k = 0; k < 2; k++) {
      b = refl.b[k];
      if (!b.fall) continue;
      p = reflCell(k, b.i, Lz);
      artPop(p.x, p.y, Lz.cs * 0.5, '#d8c8ff', 'burst');
      spawnSparkles(p.x, p.y, 12, '#c8b8ff');
    }
    playNote(330, 0, 0.1, 'square', 0.06);
  }
  if (refl.t >= 1.0) {
    refl.waste += refl.hist.length;
    refl.hist = [];
    refl.falls++;
    reflPoofHome();
    refl.state = 'play';
    refl.t = 0;
    refl.idle = 0;
    if (refl.falls >= 2 && !refl.hintSoon) { refl.hintSoon = true; refl.idle = REFL_HINT_IDLE; }
  }
}
function reflUpdateHint() {
  var lim = refl.hintSoon ? REFL_HINT_AGAIN : REFL_HINT_IDLE, P;
  if (refl.hint >= 0 || refl.idle < lim) return;
  P = reflSolveFrom(refl.G, refl.b[0].i, refl.b[1].i);
  if (!P || !P.length) return;
  refl.hint = P[0];
  refl.hintUsed = true;
}
// Esittely ensimmäisen kierroksen alussa: käsi painaa nuolta, puput hyppäävät
// eri suuntiin, ja sitten takaisin
function reflUpdateDemo() {
  var D = refl.demo;
  if (!D) { refl.state = 'play'; return; }
  if (D.step === 0 && refl.t > 1.0) { D.step = 1; refl.press['a' + D.d] = 0.25; reflMove(D.d); }
  else if (D.step === 1 && refl.t > 2.6 && !reflBusy()) { D.step = 2; refl.press['a' + REFL_MIRROR[D.d]] = 0.25; reflMove(REFL_MIRROR[D.d]); }
  else if (D.step === 2 && refl.t > 3.6 && !reflBusy()) {
    refl.hist = [];
    refl.demo = null;
    refl.state = 'play';
    refl.idle = 0;
  }
}
// Nuoli, jonka päällä esittelykäsi on (-1 = käsi poissa)
function reflDemoDir() {
  var D = refl.demo;
  if (!D || refl.state !== 'demo') return -1;
  if (D.step === 0 || (D.step === 1 && refl.t < 1.9)) return D.d;
  if (D.step === 1 || refl.t < 3.2) return REFL_MIRROR[D.d];
  return -1;
}
function reflRoundDone() {
  var Lz = reflLayout(), k, p, par, used;
  refl.state = 'roundDone';
  refl.t = 0;
  refl.eatT = 0;
  refl.hint = -1;
  par = refl.starsAll && reflStarsLeft() === 0 ? refl.G.lenStars : refl.G.len;
  used = refl.hist.length + refl.waste;
  refl.gold[refl.round] = !refl.hintUsed && used <= par + 2;
  for (k = 0; k < 2; k++) {
    p = reflCell(k, refl.b[k].i, Lz);
    artPop(p.x, p.y, Lz.cs * 0.8, REFL_PCOL[k], 'ring');
    spawnSparkles(p.x, p.y, 16, k ? '#d8c8ff' : '#ff9ec8');
    refl.b[k].waveT = 2;
  }
  playNote(784, 0, 0.12, 'triangle', 0.35);
  playNote(988, 0.12, 0.12, 'triangle', 0.35);
  playNote(1319, 0.24, 0.35, 'triangle', 0.35);
  if (refl.gold[refl.round]) playNote(1760, 0.45, 0.3, 'sine', 0.3);
  if (refl.round === 1 || refl.round === 2) refl.taskDelay = 2.6;
}
function reflStarsLeft() {
  var i, n = 0;
  for (i = 0; i < refl.stars.length; i++) if (!refl.stars[i].got) n++;
  return n;
}
// Myyrä kurkkaa välillä jostain kuopasta
function reflUpdateMole(dt) {
  var G = refl.G, list = [], k, i;
  if (refl.mole) {
    refl.mole.t += dt;
    if (refl.mole.t > 1.6) refl.mole = null;
    return;
  }
  if (!G) return;
  refl.moleT -= dt;
  if (refl.moleT > 0) return;
  refl.moleT = 4 + Math.random() * 4;
  for (k = 0; k < 2; k++) for (i = 0; i < G.cols * G.rows; i++) {
    if (G.hole[k][i] && refl.b[k] && refl.b[k].i !== i) list.push({ k: k, i: i });
  }
  if (list.length) { refl.mole = list[reflRand(list.length)]; refl.mole.t = 0; }
}

// ---------- Tökättävät koristeet ----------
// Vasemmalla seinällä vääristävä peili (venyttää pupun kuvaa; joka viides
// tökkäys: peilistä vilkuttaa yksisarvinen), oikealla jalkalamppu (vaihtaa
// väriä), alhaalla vasemmalla nukkuva kissa (herää ja haukottelee, joka
// kolmas kehrää sydämiä) ja oikealla vieterikaappi (pupu pomppaa esiin).
var reflPropRefs = null;
function reflSetupProps() {
  propsReset();
  reflPropRefs = {};
  reflPropRefs.fun = propAdd({
    x: 0, y: 0, r: 10, color: '#c79bff', note: 659, amp: 0.1, mode: 0, stretchT: 0, uniT: 0,
    update: function (p, dt) { if (p.stretchT > 0) p.stretchT -= dt; if (p.uniT > 0) p.uniT -= dt; },
    draw: function (c, p) { reflDrawFunMirror(c, p); },
    poke: function (p) {
      p.mode = (p.mode + 1) % 3;
      p.stretchT = 1.2;
      playNote(392, 0, 0.18, 'sine', 0.2);
      playNote(523, 0.12, 0.18, 'sine', 0.18);
      if (p.n % 5 === 0) {
        p.uniT = 4;
        playNote(1047, 0.2, 0.15, 'triangle', 0.25);
        playNote(1319, 0.32, 0.15, 'triangle', 0.25);
        playNote(1568, 0.44, 0.3, 'triangle', 0.25);
      }
    }
  });
  reflPropRefs.lamp = propAdd({
    x: 0, y: 0, r: 10, color: '#ffd24f', note: 880, amp: 0.08, col: 0,
    draw: function (c, p) { reflDrawLamp(c, p); },
    poke: function (p) {
      p.col = (p.col + 1) % REFL_LAMP_COLS.length;
      p.color = REFL_LAMP_COLS[p.col];
    }
  });
  reflPropRefs.cat = propAdd({
    x: 0, y: 0, r: 10, color: '#c8b8d8', note: 523, amp: 0.1, awakeT: 0, purrT: 0, layer: 1,
    update: function (p, dt) { if (p.awakeT > 0) p.awakeT -= dt; if (p.purrT > 0) p.purrT -= dt; },
    draw: function (c, p) { reflDrawCat(c, p); },
    poke: function (p) {
      p.awakeT = 2.2;
      playNote(659, 0.05, 0.12, 'triangle', 0.15);
      playNote(523, 0.2, 0.25, 'triangle', 0.12);
      if (p.n % 3 === 0) {
        p.purrT = 2;
        playNote(110, 0.4, 0.5, 'sawtooth', 0.04);
      }
    }
  });
  reflPropRefs.jack = propAdd({
    x: 0, y: 0, r: 10, color: '#ff9f7a', note: 784, amp: 0.12, popT: 0, layer: 1,
    update: function (p, dt) { if (p.popT > 0) p.popT -= dt; },
    draw: function (c, p) { reflDrawJack(c, p); },
    poke: function (p) {
      p.popT = 1.6;
      playNote(523, 0, 0.08, 'square', 0.08);
      playNote(1047, 0.1, 0.2, 'triangle', 0.25);
    }
  });
  reflPlaceProps();
}
function reflPlaceProps() {
  var P = reflPropRefs, h = viewH, m, B, s, w;
  if (!P || !viewW) return;
  m = reflMargin();
  B = reflButtons();
  // Seinäkoristeet sivumarginaaleihin
  w = Math.min(m * 0.78, h * 0.13);
  s = P.fun; s.w = w; s.hgt = Math.min(h * 0.34, w * 2.3);
  s.x = m * 0.5; s.y = h * 0.66; s.r = w * 0.75; s.hy = s.hgt * 0.5;
  s = P.lamp; s.w = w;
  s.x = viewW - m * 0.5; s.y = h * 0.78; s.hgt = Math.min(h * 0.5, w * 3.6); s.r = w * 0.7; s.hy = s.hgt * 0.85;
  // Lattiakoristeet alanurkkiin nappien ulkopuolelle
  w = Math.min((B.undo.x - B.undo.r) * 0.75, h * 0.16);
  s = P.cat; s.w = w; s.x = (B.undo.x - B.undo.r) * 0.48; s.y = h * 0.975; s.r = w * 0.5; s.hy = w * 0.25;
  s = P.jack; s.w = w * 0.7; s.x = viewW - (B.undo.x - B.undo.r) * 0.48; s.y = h * 0.975; s.r = w * 0.45; s.hy = w * 0.4;
}

// ---------- Piirto: tausta ----------
function renderReflectBg(b, w, h) {
  var W = viewW, g, x, i, y, k, sw;
  // Seinä: lila raitatapetti
  g = b.createLinearGradient(0, 0, 0, h * 0.82);
  g.addColorStop(0, '#d8c4ff');
  g.addColorStop(1, '#f2e6ff');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  sw = h * 0.06;
  b.fillStyle = 'rgba(255,170,220,0.22)';
  for (x = 0; x < W + sw; x += sw * 2) b.fillRect(x, 0, sw, h * 0.82);
  for (i = 0; i < 14; i++) {
    x = (i * 0.137 + 0.05) % 1 * W;
    y = h * (0.2 + ((i * 0.31) % 1) * 0.55);
    drawStar(b, x, y, h * 0.008, i, 0);
  }
  // Paneeli ja lattia (ruudukko)
  artRoundRect(b, -10, h * 0.8, W + 20, h * 0.03, 0, '#c79bff', { lineColor: '#8a5cc8' });
  g = b.createLinearGradient(0, h * 0.83, 0, h);
  g.addColorStop(0, '#ffe4f2');
  g.addColorStop(1, '#ffc8e4');
  b.fillStyle = g;
  b.fillRect(0, h * 0.83, w, h * 0.17);
  sw = h * 0.055;
  b.fillStyle = 'rgba(200,140,220,0.25)';
  for (k = 0; k < 4; k++) for (x = (k % 2) * sw; x < W; x += sw * 2) b.fillRect(x, h * 0.83 + k * sw, sw, sw);
  // Esirippu ylhäällä: samettikaari ja kultaiset tupsut
  b.fillStyle = '#d0408a';
  b.beginPath();
  b.moveTo(0, 0);
  b.lineTo(W, 0);
  b.lineTo(W, h * 0.05);
  for (x = W; x >= 0; x -= h * 0.12) b.quadraticCurveTo(x - h * 0.06, h * 0.1, x - h * 0.12, h * 0.05);
  b.closePath();
  artFillPath(b, '#d0408a', 0, h * 0.09, h * 0.05, { lineColor: '#8a1f58' });
  // Tupsut vain keskellä, jotta HUD-paneelit pysyvät selkeinä
  for (x = h * 0.06; x < W; x += h * 0.12) {
    if (x > W * 0.33 && x < W * 0.67) artCircle(b, x, h * 0.088, h * 0.011, '#ffd24f', { lineColor: '#b8862a' });
  }
  // Sivuverhot kulmissa (koriste ruutujen yläpuolella)
  for (i = 0; i < 2; i++) {
    x = i ? W : 0;
    b.beginPath();
    b.moveTo(x, 0);
    b.lineTo(x + (i ? -1 : 1) * h * 0.2, 0);
    b.quadraticCurveTo(x + (i ? -1 : 1) * h * 0.06, h * 0.12, x + (i ? -1 : 1) * h * 0.03, h * 0.3);
    b.lineTo(x, h * 0.32);
    b.closePath();
    artFillPath(b, '#e0559a', 0, h * 0.32, h * 0.1, { lineColor: '#8a1f58' });
  }
}

// ---------- Piirto: hahmot ja esineet ----------
// Pupu: valkoinen pupu ja värikäs rusetti; peilikuva piirretään sivukankaalle
// ja sävytetään lilaksi ja läpikuultavaksi.
function reflDrawBunnyRaw(c, x, y, s, hop, col, facing, wave) {
  artBlob(c, x, y + s * 0.02, s * 0.8, s * 0.26, col, { line: false, alpha: 0.5 });
  c.save();
  c.translate(x, 0);
  c.scale(facing, 1);
  drawBunny(c, 0, y, s, hop, globalT * 3, false);
  c.restore();
  artBlob(c, x, y - hop - s * 0.66, s * 0.4, s * 0.13, col, { lineColor: artShade(col, -0.4) });
  artBlob(c, x + facing * s * 0.24, y - hop - s * 0.5, s * 0.1, s * 0.2, col, { lineColor: artShade(col, -0.4) });
  if (wave > 0) {
    var a = Math.sin(globalT * 14) * 0.5;
    artLimb(c, x - facing * s * 0.3, y - hop - s * 0.45, x - facing * s * (0.55 + Math.cos(a) * 0.1), y - hop - s * (0.95 + Math.sin(a) * 0.15), s * 0.12, '#ffffff', '#c8b8c8');
  }
}
function reflDrawBunny(c, k, x, y, s, hop, facing, wave, sc) {
  var bw, bh, off, g, ox, oy;
  sc = sc === undefined ? 1 : sc;
  if (!k) {
    if (sc !== 1) { c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y); }
    reflDrawBunnyRaw(c, x, y, s, hop, REFL_PCOL[0], facing, wave);
    if (sc !== 1) c.restore();
    return;
  }
  // Peilikuva: piirretään ensin omalle kankaalle, jotta läpikuultavuus ei näytä päällekkäisiä osia
  bw = Math.ceil(s * 2.6);
  bh = Math.ceil(s * 3.4 + hop);
  if (!reflOff) reflOff = document.createElement('canvas');
  off = reflOff;
  if (off.width < bw * DPR || off.height < bh * DPR) {
    off.width = Math.ceil(Math.max(off.width / DPR, bw) * DPR);
    off.height = Math.ceil(Math.max(off.height / DPR, bh) * DPR);
  }
  g = off.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, off.width, off.height);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  ox = bw / 2; oy = bh - s * 0.3;
  reflDrawBunnyRaw(g, ox, oy, s, hop, REFL_PCOL[1], facing, wave);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(160,140,255,0.32)';
  g.fillRect(0, 0, bw, bh);
  // Peilin kiiltojuova
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.moveTo(bw * 0.15, bh); g.lineTo(bw * 0.45, 0); g.lineTo(bw * 0.6, 0); g.lineTo(bw * 0.3, bh);
  g.closePath(); g.fill();
  g.globalCompositeOperation = 'source-over';
  c.save();
  c.translate(x, y);
  c.scale(sc, sc);
  c.globalAlpha = 0.8;
  c.drawImage(off, 0, 0, bw * DPR, bh * DPR, -ox, -oy, bw, bh);
  c.globalAlpha = 1;
  c.restore();
  // Kimallus
  var t = globalT * 2 + x * 0.01, j;
  for (j = 0; j < 2; j++) {
    var tw = Math.max(0, Math.sin(t + j * 2.4));
    if (tw > 0.2) reflDrawGlint(c, x + Math.sin(j * 3.1 + 1) * s * 0.7, y - hop - s * (0.9 + j * 0.7), s * 0.16 * tw * sc);
  }
}
function reflDrawGlint(c, x, y, r) {
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}
// Pensasruukku (este). Peilin puolella hopeisempi.
function reflDrawHedge(c, x, y, s, k, seed) {
  var leaf = k ? '#86d6b8' : '#5fbf6a', pot = k ? '#c8b8ff' : '#ff9fc8';
  artShadow(c, x, y + s * 0.85, s * 0.8, s * 0.16, 0.2);
  c.beginPath();
  c.moveTo(x - s * 0.5, y + s * 0.25); c.lineTo(x + s * 0.5, y + s * 0.25); c.lineTo(x + s * 0.38, y + s * 0.85); c.lineTo(x - s * 0.38, y + s * 0.85);
  c.closePath();
  artFillPath(c, pot, y + s * 0.25, y + s * 0.85, s * 0.4, {});
  artRoundRect(c, x - s * 0.58, y + s * 0.15, s * 1.16, s * 0.2, s * 0.08, artShade(pot, -0.1), {});
  artCircle(c, x - s * 0.32, y - s * 0.12, s * 0.38, leaf, {});
  artCircle(c, x + s * 0.32, y - s * 0.12, s * 0.38, leaf, {});
  artCircle(c, x, y - s * 0.38, s * 0.48, leaf, { hi: 0.3 });
  artCircle(c, x + (seed % 2 ? 0.2 : -0.25) * s, y - s * 0.55, s * 0.09, k ? '#ffffff' : '#ff7bac', {});
}
// Taikakuoppa; myyrä kurkkaa välillä
function reflDrawHole(c, x, y, s, k, i) {
  var M = refl.mole, up;
  artBlob(c, x, y + s * 0.1, s * 0.82, s * 0.5, k ? '#b8a8e0' : '#c890b8', { lineColor: k ? '#7a68b0' : '#8a4a78' });
  artBlob(c, x, y + s * 0.14, s * 0.62, s * 0.36, '#2a1840', { line: false });
  c.save();
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y + s * 0.14, s * 0.62, s * 0.36, 0, 0, Math.PI * 2); else c.arc(x, y + s * 0.14, s * 0.4, 0, Math.PI * 2);
  c.clip();
  // Pyörre
  c.strokeStyle = 'rgba(190,150,255,0.6)';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath();
  var a, rr;
  for (a = 0; a < Math.PI * 4; a += 0.3) {
    rr = s * 0.04 * a;
    c.lineTo(x + Math.cos(a + globalT * 2) * rr, y + s * 0.14 + Math.sin(a + globalT * 2) * rr * 0.55);
  }
  c.stroke();
  if (M && M.k === k && M.i === i) {
    up = Math.sin(Math.min(1, M.t / 1.6) * Math.PI);
    reflDrawMole(c, x, y + s * 0.5 - up * s * 0.55, s * 0.32);
  }
  c.restore();
  drawStar(c, x + s * 0.45, y - s * 0.12, s * 0.08, globalT, 0);
}
function reflDrawMole(c, x, y, s) {
  artCircle(c, x, y, s, '#8a6a58', { lineColor: '#4a3428' });
  artBlob(c, x, y + s * 0.3, s * 0.4, s * 0.28, '#e8c4b0', { lineColor: '#8a6a58' });
  artCircle(c, x, y + s * 0.18, s * 0.14, '#ff8fbe', { line: false });
  artEye(c, x - s * 0.35, y - s * 0.2, s * 0.13, 0, false);
  artEye(c, x + s * 0.35, y - s * 0.2, s * 0.13, 0, false);
}
// Ajatuskupla, jossa on porkkana
function reflDrawBubble(c, x, y, s, side) {
  var dir = side ? -1 : 1, bx = x + dir * s * 0.75, by = y - s * 1.7, r = s * 0.42, wob = Math.sin(globalT * 3 + side) * s * 0.04;
  artCircle(c, x + dir * s * 0.3, y - s * 1.0, s * 0.07, '#ffffff', { lineColor: '#b8a8c8' });
  artCircle(c, x + dir * s * 0.5, y - s * 1.25, s * 0.11, '#ffffff', { lineColor: '#b8a8c8' });
  artCircle(c, bx, by + wob, r, '#ffffff', { lineColor: '#b8a8c8' });
  drawCarrotGlyph(c, bx, by + wob - r * 0.2, r * 0.6);
}
// Taikapeili laudojen välissä
function reflDrawMirror(c, Lz) {
  var x = viewW * 0.5, w = Lz.gap * 0.72, y0 = Lz.oy - Lz.cs * 0.3, y1 = Lz.oy + Lz.bh + Lz.cs * 0.1, s = Lz.cs, g, k, sx;
  artShadow(c, x, y1 + s * 0.05, w * 0.8, s * 0.08, 0.25);
  // Kehys
  c.beginPath();
  c.moveTo(x - w / 2 - s * 0.08, y1);
  c.lineTo(x - w / 2 - s * 0.08, y0 + w * 0.5);
  c.arc(x, y0 + w * 0.5, w / 2 + s * 0.08, Math.PI, 0);
  c.lineTo(x + w / 2 + s * 0.08, y1);
  c.closePath();
  artFillPath(c, '#ffd24f', y0, y1, s * 0.3, { lineColor: '#b8862a' });
  // Lasi
  c.save();
  c.beginPath();
  c.moveTo(x - w / 2, y1 - s * 0.05);
  c.lineTo(x - w / 2, y0 + w * 0.5);
  c.arc(x, y0 + w * 0.5, w / 2, Math.PI, 0);
  c.lineTo(x + w / 2, y1 - s * 0.05);
  c.closePath();
  g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#e8f4ff');
  g.addColorStop(0.5, '#c8b8ff');
  g.addColorStop(1, '#ffd8f0');
  c.fillStyle = g;
  c.fill();
  c.clip();
  // Liukuvat kiiltojuovat
  c.fillStyle = 'rgba(255,255,255,0.55)';
  for (k = 0; k < 2; k++) {
    sx = y0 + ((globalT * s * 0.9 + k * (y1 - y0) * 0.55) % ((y1 - y0) * 1.3)) - s;
    c.beginPath();
    c.moveTo(x - w, sx + w * 0.6); c.lineTo(x + w, sx - w * 0.6); c.lineTo(x + w, sx - w * 0.6 + s * 0.25); c.lineTo(x - w, sx + w * 0.6 + s * 0.25);
    c.closePath(); c.fill();
  }
  if (refl.mirrorT > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (refl.mirrorT * 0.6) + ')';
    c.fillRect(x - w, y0, w * 2, y1 - y0);
  }
  c.restore();
  // Kruunu ja kimallukset
  drawStar(c, x, y0 - s * 0.08, s * 0.16, Math.sin(globalT) * 0.2, 0.6);
  for (k = 0; k < 3; k++) {
    var tw = Math.max(0, Math.sin(globalT * 2.2 + k * 2.1));
    if (tw > 0.3) reflDrawGlint(c, x + Math.sin(k * 2.7) * w * 0.3, y0 + (y1 - y0) * (0.25 + k * 0.25), s * 0.1 * tw);
  }
}
// Vääristävä peili seinällä (origo = alareunan keskikohta)
function reflDrawFunMirror(c, p) {
  var w = p.w, h = p.hgt, k = p.stretchT > 0 ? p.stretchT / 1.2 : 0, wob = Math.sin(globalT * 9) * k, sx = 1, sy = 1, i, y;
  if (p.mode === 0) { sx = 1 - 0.35 * k; sy = 1 + 0.5 * k; }
  else if (p.mode === 1) { sx = 1 + 0.45 * k; sy = 1 - 0.35 * k; }
  else { sx = 1 + wob * 0.25; sy = 1 - wob * 0.2; }
  // Aaltoileva kehys
  c.beginPath();
  for (i = 0; i <= 40; i++) {
    var a = i / 40 * Math.PI * 2;
    var rr = 1 + Math.sin(a * 6 + globalT) * 0.04;
    c.lineTo(Math.cos(a) * w * 0.5 * rr, -h * 0.5 + Math.sin(a) * h * 0.5 * rr);
  }
  c.closePath();
  artFillPath(c, '#ffb84f', -h, 0, w * 0.4, { lineColor: '#a8641a' });
  c.save();
  c.beginPath();
  if (c.ellipse) c.ellipse(0, -h * 0.5, w * 0.4, h * 0.42, 0, 0, Math.PI * 2); else c.arc(0, -h * 0.5, w * 0.4, 0, Math.PI * 2);
  var g = c.createLinearGradient(-w * 0.4, -h, w * 0.4, 0);
  g.addColorStop(0, '#f4f0ff');
  g.addColorStop(1, '#b8d8ff');
  c.fillStyle = g;
  c.fill();
  c.clip();
  // Kuva peilissä (pupu tai yllätys: yksisarvinen)
  c.save();
  c.translate(0, -h * 0.12);
  c.scale(sx, sy);
  if (p.uniT > 0) {
    reflDrawUniHead(c, 0, -h * 0.3, w * 0.3);
  } else {
    drawBunny(c, 0, 0, w * 0.26, 0, globalT * 3, false);
  }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  for (y = -h; y < 0; y += h * 0.5) c.fillRect(-w, y + ((globalT * h * 0.2) % (h * 0.5)), w * 2, h * 0.05);
  c.restore();
  if (p.uniT > 0) {
    for (i = 0; i < 3; i++) drawStar(c, Math.sin(globalT * 2 + i * 2) * w * 0.55, -h * (0.3 + i * 0.25), w * 0.08, globalT, 0.5);
  }
}
// Yksisarvisen pää (peilin yllätys)
function reflDrawUniHead(c, x, y, s) {
  var i;
  for (i = 0; i < 4; i++) artBlob(c, x - s * 0.55 - i * s * 0.05, y - s * 0.2 + i * s * 0.32, s * 0.28, s * 0.2, maneColors[i], { line: false });
  artBlob(c, x, y, s * 0.62, s * 0.7, '#ffffff', { lineColor: '#b89ad0', shadeTo: '#ece0f8' });
  artBlob(c, x + s * 0.25, y + s * 0.42, s * 0.42, s * 0.3, '#ffe8f2', { lineColor: '#b89ad0' });
  c.beginPath();
  c.moveTo(x - s * 0.1, y - s * 0.6); c.lineTo(x + s * 0.12, y - s * 1.3); c.lineTo(x + s * 0.2, y - s * 0.58);
  c.closePath();
  artFillPath(c, '#ffd24f', y - s * 1.3, y - s * 0.6, s * 0.2, { lineColor: '#b8862a' });
  artEye(c, x + s * 0.12, y - s * 0.08, s * 0.12, 0.3, (globalT % 1.4) < 0.15);
  artBlush(c, x + s * 0.35, y + s * 0.15, s * 0.1);
  var wv = Math.sin(globalT * 10) * 0.4;
  artLimb(c, x - s * 0.2, y + s * 0.7, x - s * 0.5 + Math.sin(wv) * s * 0.2, y + s * 0.2, s * 0.18, '#ffffff', '#b89ad0');
}
// Jalkalamppu (origo = jalan kohta)
function reflDrawLamp(c, p) {
  var w = p.w, h = p.hgt, col = REFL_LAMP_COLS[p.col], ty = -h * 0.82;
  artShadow(c, 0, 0, w * 0.45, w * 0.1, 0.2);
  artGlow(c, 0, ty + w * 0.25, w * 1.3, col, 0.45);
  artBlob(c, 0, -w * 0.06, w * 0.34, w * 0.1, '#b8862a', { lineColor: '#7a5418' });
  artLimb(c, 0, -w * 0.08, 0, ty + w * 0.2, Math.max(2, w * 0.07), '#ffd24f', '#b8862a');
  c.beginPath();
  c.moveTo(-w * 0.22, ty - w * 0.15); c.lineTo(w * 0.22, ty - w * 0.15); c.lineTo(w * 0.42, ty + w * 0.35); c.lineTo(-w * 0.42, ty + w * 0.35);
  c.closePath();
  artFillPath(c, col, ty - w * 0.15, ty + w * 0.35, w * 0.4, {});
  for (var i = 0; i < 5; i++) artCircle(c, -w * 0.36 + i * w * 0.18, ty + w * 0.4, w * 0.045, '#ffffff', { lineColor: artShade(col, -0.4) });
}
// Nukkuva kissa tyynyllä (origo = tyynyn pohja)
function reflDrawCat(c, p) {
  var s = p.w * 0.5, awake = p.awakeT > 0, yawn = awake && p.awakeT > 1.4 ? Math.sin((2.2 - p.awakeT) / 0.8 * Math.PI) : 0, i, z;
  artShadow(c, 0, 0, s * 1.1, s * 0.16, 0.2);
  artBlob(c, 0, -s * 0.18, s * 1.05, s * 0.24, '#ff9fc8', { lineColor: '#b8487a', hi: 0.3 });
  artBlob(c, 0, -s * 0.5, s * 0.7, s * 0.38, '#c8b8d8', { lineColor: '#6a5a7a', hi: 0.25 });
  artLimb(c, s * 0.55, -s * 0.38, s * 0.85 + Math.sin(globalT * (awake ? 6 : 1.5)) * s * 0.12, -s * 0.7, s * 0.14, '#c8b8d8', '#6a5a7a');
  var hx = -s * 0.5, hy = -s * 0.7 - (awake ? s * 0.12 : 0);
  c.beginPath(); c.moveTo(hx - s * 0.3, hy - s * 0.1); c.lineTo(hx - s * 0.22, hy - s * 0.5); c.lineTo(hx - s * 0.02, hy - s * 0.22); c.closePath();
  artFillPath(c, '#c8b8d8', hy - s * 0.5, hy, s * 0.2, { lineColor: '#6a5a7a' });
  c.beginPath(); c.moveTo(hx + s * 0.3, hy - s * 0.1); c.lineTo(hx + s * 0.22, hy - s * 0.5); c.lineTo(hx + s * 0.02, hy - s * 0.22); c.closePath();
  artFillPath(c, '#c8b8d8', hy - s * 0.5, hy, s * 0.2, { lineColor: '#6a5a7a' });
  artCircle(c, hx, hy, s * 0.32, '#c8b8d8', { lineColor: '#6a5a7a', hi: 0.25 });
  if (awake && yawn <= 0) {
    artEye(c, hx - s * 0.12, hy - s * 0.04, s * 0.07, 0, false);
    artEye(c, hx + s * 0.12, hy - s * 0.04, s * 0.07, 0, false);
  } else {
    c.strokeStyle = '#4a3a5a';
    c.lineWidth = Math.max(1, s * 0.04);
    c.beginPath(); c.arc(hx - s * 0.12, hy - s * 0.05, s * 0.06, 0.2, Math.PI - 0.2); c.stroke();
    c.beginPath(); c.arc(hx + s * 0.12, hy - s * 0.05, s * 0.06, 0.2, Math.PI - 0.2); c.stroke();
  }
  if (yawn > 0) artBlob(c, hx, hy + s * 0.14, s * 0.08, s * 0.1 * yawn + s * 0.02, '#8a3a5a', { line: false });
  else artCircle(c, hx, hy + s * 0.08, s * 0.04, '#ff8fbe', { line: false });
  if (!awake) {
    c.fillStyle = 'rgba(122,60,184,0.7)';
    c.font = 'bold ' + Math.round(s * 0.3) + 'px ' + UI_FONT;
    c.textAlign = 'center';
    for (i = 0; i < 2; i++) {
      z = (globalT * 0.5 + i * 0.5) % 1;
      c.globalAlpha = Math.sin(z * Math.PI) * 0.8;
      c.fillText('Z', hx + s * 0.3 + z * s * 0.4, hy - s * 0.4 - z * s * 0.6);
    }
    c.globalAlpha = 1;
  }
  if (p.purrT > 0) {
    for (i = 0; i < 3; i++) {
      z = ((2 - p.purrT) * 0.7 + i * 0.33) % 1;
      c.globalAlpha = Math.sin(z * Math.PI);
      reflDrawHeart(c, hx + Math.sin(i * 2 + z * 3) * s * 0.3, hy - s * 0.5 - z * s * 0.9, s * 0.13);
    }
    c.globalAlpha = 1;
  }
}
function reflDrawHeart(c, x, y, s) {
  c.fillStyle = '#ff5f9e';
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
  c.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  c.fill();
}
// Vieterikaappi: kannen alta ponnahtaa pupu jousen päässä
function reflDrawJack(c, p) {
  var w = p.w, k = p.popT > 0 ? Math.min(1, (1.6 - p.popT) / 0.2) * Math.min(1, p.popT / 0.4) : 0, bob = Math.sin(globalT * 14) * (p.popT > 0.4 ? 0.1 : 0), i, y;
  artShadow(c, 0, 0, w * 0.6, w * 0.1, 0.2);
  if (k > 0) {
    c.strokeStyle = '#b8b8c8';
    c.lineWidth = Math.max(1.5, w * 0.05);
    c.beginPath();
    for (i = 0; i <= 16; i++) {
      y = -w * 0.8 - i / 16 * w * 0.55 * k;
      c.lineTo(Math.sin(i * 1.6) * w * 0.12, y);
    }
    c.stroke();
    c.save();
    c.translate(0, -w * 0.8 - w * 0.55 * k);
    c.rotate(bob);
    artBlob(c, -w * 0.1, -w * 0.32, w * 0.07, w * 0.2, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE, rot: -0.2 });
    artBlob(c, w * 0.1, -w * 0.32, w * 0.07, w * 0.2, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE, rot: 0.2 });
    artCircle(c, 0, -w * 0.05, w * 0.2, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE, hi: 0.4 });
    artEye(c, -w * 0.07, -w * 0.08, w * 0.035, 0, false);
    artEye(c, w * 0.07, -w * 0.08, w * 0.035, 0, false);
    artCircle(c, 0, 0, w * 0.03, '#ff8fbe', { line: false });
    artBlush(c, -w * 0.12, w * 0.0, w * 0.035);
    artBlush(c, w * 0.12, w * 0.0, w * 0.035);
    c.restore();
  }
  artRoundRect(c, -w * 0.45, -w * 0.82, w * 0.9, w * 0.82, w * 0.08, '#ff9f7a', { lineColor: '#a8483a', hi: 0.2 });
  artRoundRect(c, -w * 0.3, -w * 0.62, w * 0.6, w * 0.42, w * 0.06, '#ffe08a', { lineColor: '#b8862a' });
  drawStar(c, 0, -w * 0.41, w * 0.14, 0, 0);
  c.save();
  c.translate(-w * 0.45, -w * 0.82);
  c.rotate(-k * 1.8);
  artRoundRect(c, 0, -w * 0.1, w * 0.9, w * 0.12, w * 0.04, '#c79bff', { lineColor: '#6a3c9a' });
  c.restore();
  // Kampi kyljessä
  artLimb(c, w * 0.45, -w * 0.4, w * 0.62, -w * 0.4 + Math.sin(globalT * 3) * w * 0.1, w * 0.06, '#ffd24f', '#b8862a');
}

// ---------- Piirto: lauta ----------
function drawReflect() {
  var c = ctx, G = refl.G, Lz, s, k, i, r, p, b;
  if (!beginPlayWorld()) return;
  propsDraw(c, 0);
  if (G) {
    Lz = reflLayout();
    s = Lz.cs;
    for (k = 0; k < 2; k++) reflDrawBoard(c, G, Lz, k);
    reflDrawMirror(c, Lz);
    // Rivi kerrallaan: pensaat ja pupu oikeassa järjestyksessä
    for (r = 0; r < G.rows; r++) {
      for (k = 0; k < 2; k++) {
        for (i = 0; i < G.cols; i++) {
          if (!G.wall[k][i + r * G.cols]) continue;
          p = reflCellXY(k, i, r, Lz);
          reflDrawHedge(c, p.x, p.y - s * 0.05, s * 0.4, k, i * 7 + r * 3);
        }
        b = refl.b[k];
        if (b && reflBunnyRow(b) === r) reflDrawBunnyAt(c, b, Lz);
      }
    }
    reflDrawBubbles(c, Lz);
    reflDrawDemoArrows(c, Lz);
  }
  propsDraw(c, 1);
  drawParticlesLayer(c);
  endPlayWorld();
  if (G) reflDrawButtons(c);
  drawReflectHud(c);
  if (refl.state === 'won') reflDrawWon(c);
  drawTaskOverlay(c);
}
function reflDrawBoard(c, G, Lz, k) {
  var s = Lz.cs, i, r, p, idx, light = k ? ['#ece6ff', '#dcd2ff'] : ['#ffe4f0', '#ffd0e6'], lc = k ? '#a898d8' : '#d890b8', S, ca;
  artShadow(c, Lz.ox[k] + Lz.bw / 2, Lz.oy + Lz.bh + s * 0.15, Lz.bw * 0.55, s * 0.15, 0.2);
  artRoundRect(c, Lz.ox[k] - s * 0.14, Lz.oy - s * 0.14, Lz.bw + s * 0.28, Lz.bh + s * 0.28, s * 0.22, k ? '#c8b8ff' : '#ff9fc8', { lineColor: k ? '#7a68b0' : '#b8487a' });
  for (r = 0; r < G.rows; r++) for (i = 0; i < G.cols; i++) {
    p = reflCellXY(k, i, r, Lz);
    artRoundRect(c, p.x - s * 0.47, p.y - s * 0.47, s * 0.94, s * 0.94, s * 0.12, light[(i + r) % 2], { lineColor: lc, line: Math.max(1, s * 0.02) });
  }
  if (k) {
    // Peilin puolen lattiassa hento kiilto
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.beginPath();
    c.moveTo(Lz.ox[k] + Lz.bw * 0.1, Lz.oy + Lz.bh); c.lineTo(Lz.ox[k] + Lz.bw * 0.45, Lz.oy);
    c.lineTo(Lz.ox[k] + Lz.bw * 0.58, Lz.oy); c.lineTo(Lz.ox[k] + Lz.bw * 0.23, Lz.oy + Lz.bh);
    c.closePath(); c.fill();
  }
  // Lähtöruutu
  p = reflCell(k, G.start[k], Lz);
  c.fillStyle = artRGBA(REFL_PCOL[k], 0.35);
  c.beginPath(); c.arc(p.x, p.y + s * 0.28, s * 0.28, 0, Math.PI * 2); c.fill();
  for (idx = 0; idx < G.cols * G.rows; idx++) {
    if (!G.hole[k][idx]) continue;
    p = reflCell(k, idx, Lz);
    reflDrawHole(c, p.x, p.y, s * 0.42, k, idx);
  }
  // Porkkana (syödään kierroksen lopussa)
  p = reflCell(k, G.carrot[k], Lz);
  ca = refl.state === 'roundDone' || refl.state === 'won' ? Math.max(0, 1 - refl.eatT / 0.8) : 1;
  if (ca > 0) {
    var on = refl.b[k] && refl.b[k].i === G.carrot[k] && refl.b[k].t >= 1;
    artGlow(c, p.x, p.y, s * 0.6, on ? '#ffe27a' : '#ffb070', on ? 0.7 : 0.35 + Math.sin(globalT * 3 + k) * 0.1);
    c.save();
    c.translate(p.x + (on ? s * 0.22 : 0), p.y);
    c.scale(ca, ca);
    c.rotate(Math.sin(globalT * 2 + k) * 0.06);
    drawCarrotGlyph(c, 0, -s * 0.08, s * 0.26);
    c.restore();
    if (k) reflDrawGlint(c, p.x + s * 0.12, p.y - s * 0.2, s * 0.06 * Math.max(0, Math.sin(globalT * 2)));
  }
  for (i = 0; i < refl.stars.length; i++) {
    S = refl.stars[i];
    if (S.got || S.s !== k) continue;
    p = reflCell(k, S.i, Lz);
    drawStar(c, p.x, p.y + Math.sin(globalT * 3 + i) * s * 0.04, s * 0.22, Math.sin(globalT + i) * 0.3, 0.8);
  }
}
function reflBunnyRow(b) {
  var cols = refl.G.cols, r0 = Math.floor(b.fi / cols), r1 = Math.floor(b.i / cols);
  return b.t < 0.5 ? Math.max(r0, r1) : r1;
}
function reflDrawBunnyAt(c, b, Lz) {
  var s = Lz.cs, p0 = reflCell(b.k, b.fi, Lz), p1 = reflCell(b.k, b.i, Lz), e = easeInOutSine(b.t), x, y, hop, sc = 1, bk, d;
  x = p0.x + (p1.x - p0.x) * e;
  y = p0.y + (p1.y - p0.y) * e;
  hop = Math.sin(b.t * Math.PI) * s * 0.22;
  if (b.pokeT > 0) hop = Math.max(hop, Math.sin((0.45 - b.pokeT) / 0.45 * Math.PI) * s * 0.3);
  if (b.popT > 0) sc = 1 - b.popT * 0.8;
  if (b.bonkT > 0) {
    bk = Math.sin((1 - b.bonkT / REFL_BONK_T) * Math.PI);
    d = REFL_DIRS[b.bonkD];
    x += d[0] * bk * s * 0.2;
    y += d[1] * bk * s * 0.2;
  }
  if ((refl.state === 'roundDone' || refl.state === 'won') && b.t >= 1) hop = Math.abs(Math.sin(globalT * 6 + b.k)) * s * 0.18;
  if (b.fallT >= 0) {
    var f = Math.min(1, b.fallT / 0.6);
    if (f >= 1) return;
    sc = 1 - f;
    c.save();
    c.translate(x, y + s * 0.3);
    c.rotate(f * 5 * b.facing);
    c.translate(-x, -(y + s * 0.3));
    reflDrawBunny(c, b.k, x, y + s * 0.36, s * 0.36, 0, b.facing, 0, sc);
    c.restore();
    return;
  }
  reflDrawBunny(c, b.k, x, y + s * 0.36, s * 0.36, hop, b.facing, b.waveT, sc);
  if (b.bonkT > 0) {
    // Tömähdys: pienet tähdet pään ympärillä
    for (var j = 0; j < 3; j++) {
      var a = globalT * 8 + j * 2.1;
      drawStar(c, x + Math.cos(a) * s * 0.25, y - s * 0.62 + Math.sin(a) * s * 0.08, s * 0.07, a, 0);
    }
  }
}
function reflDrawBubbles(c, Lz) {
  var k, b, p;
  if (refl.state !== 'play' || refl.bubbleT < 3 || reflBusy()) return;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    if (b.i === refl.G.carrot[k]) continue;
    p = reflCell(k, b.i, Lz);
    reflDrawBubble(c, p.x, p.y + Lz.cs * 0.36, Lz.cs * 0.62, k);
  }
}
// Esittelyssä nuolet pupujen yllä: kumpi suunta kummallekin
function reflDrawDemoArrows(c, Lz) {
  var D = refl.demo, k, b, p, dd, a;
  if (!D || refl.state !== 'demo' || D.step === 0 && refl.t < 0.6) return;
  for (k = 0; k < 2; k++) {
    b = refl.b[k];
    dd = reflDemoDir();
    if (dd < 0) return;
    if (k) dd = REFL_MIRROR[dd];
    p = reflCell(k, b.t < 1 ? b.fi : b.i, Lz);
    p.x += REFL_DIRS[dd][0] * Lz.cs * 0.55;
    p.y += REFL_DIRS[dd][1] * Lz.cs * 0.55 - Lz.cs * 0.1;
    a = 0.6 + Math.sin(globalT * 8) * 0.3;
    c.globalAlpha = a;
    artGlow(c, p.x, p.y, Lz.cs * 0.35, REFL_PCOL[k], 0.6);
    drawArrowGlyph(c, p.x, p.y, Lz.cs * 0.2, dd, k ? '#7a5ae8' : '#ff3f8e');
    c.globalAlpha = 1;
  }
}

// ---------- Piirto: napit ja HUD ----------
function reflDrawButtons(c) {
  var B = reflButtons(), i, A, pr, r, x, y, act = refl.state === 'play' || refl.state === 'demo', hand = null, k;
  for (i = 0; i < B.arrows.length; i++) {
    A = B.arrows[i];
    pr = refl.press[A.key] > 0 ? 1 : 0;
    r = B.r;
    x = A.x; y = A.y + pr * r * 0.08;
    c.fillStyle = 'rgba(80,40,120,0.2)';
    c.beginPath(); c.arc(A.x, A.y + r * 0.12, r, 0, Math.PI * 2); c.fill();
    if (refl.hint === A.dir && refl.state === 'play') artGlow(c, x, y, r * 1.8, '#ffe27a', 0.6 + Math.sin(globalT * 6) * 0.25);
    artCircle(c, x, y, r * (pr ? 0.95 : 1), act ? '#ffffff' : '#e8e0f0', { lineColor: '#b8a0d8', hi: 0.3 });
    // Iso pinkki nuoli = oma pupu, pieni lila = peilikuva
    drawArrowGlyph(c, x, y - r * 0.14, r * 0.46, A.dir, '#ff4f96');
    drawArrowGlyph(c, x, y + r * 0.6, r * 0.2, REFL_MIRROR[A.dir], '#8a6ae8');
    if (refl.hint === A.dir && refl.state === 'play') hand = A;
  }
  reflDrawRoundBtn(c, B.undo, '#fff1b8', '#c8961e', refl.hist.length > 0, 0);
  reflDrawRoundBtn(c, B.restart, '#ffd0e6', '#c8508a', refl.hist.length > 0, 1);
  // Esittelykäsi tai vihjekäsi
  if (refl.state === 'demo') {
    k = reflDemoDir();
    for (i = 0; i < B.arrows.length; i++) if (B.arrows[i].dir === k) hand = B.arrows[i];
  }
  if (hand) {
    var t = (globalT % 1) / 1;
    c.globalAlpha = refl.state === 'demo' ? 0.9 : 0.8;
    drawHand(c, hand.x + B.r * 0.1, hand.y - B.r * 1.45 + Math.abs(Math.sin(t * Math.PI)) * B.r * 0.45, B.r * 0.6);
    c.globalAlpha = 1;
  }
}
// Peruutus (kaari ja nuolenkärki) tai alusta (ympyränuoli)
function reflDrawRoundBtn(c, P, fill, line, on, kind) {
  var pr = refl.press[P.key] > 0, r = P.r, x = P.x, y = P.y + (pr ? r * 0.08 : 0), a0, a1, ex, ey, ang;
  c.globalAlpha = on ? 1 : 0.55;
  c.fillStyle = 'rgba(80,40,120,0.2)';
  c.beginPath(); c.arc(P.x, P.y + r * 0.12, r, 0, Math.PI * 2); c.fill();
  artCircle(c, x, y, r, fill, { lineColor: line, hi: 0.3 });
  c.strokeStyle = line;
  c.lineWidth = Math.max(2.5, r * 0.16);
  c.lineCap = 'round';
  if (kind === 0) { a0 = -Math.PI * 0.95; a1 = Math.PI * 0.35; }
  else { a0 = -Math.PI * 0.4; a1 = Math.PI * 1.3; }
  c.beginPath(); c.arc(x, y + r * 0.05, r * 0.45, a0, a1); c.stroke();
  // Nuolenkärki kaaren alussa
  ex = x + Math.cos(a0) * r * 0.45; ey = y + r * 0.05 + Math.sin(a0) * r * 0.45;
  ang = a0 - Math.PI / 2;
  c.fillStyle = line;
  c.beginPath();
  c.moveTo(ex + Math.cos(ang) * r * 0.3, ey + Math.sin(ang) * r * 0.3);
  c.lineTo(ex + Math.cos(ang + 2.3) * r * 0.24, ey + Math.sin(ang + 2.3) * r * 0.24);
  c.lineTo(ex + Math.cos(ang - 2.3) * r * 0.24, ey + Math.sin(ang - 2.3) * r * 0.24);
  c.closePath(); c.fill();
  c.globalAlpha = 1;
}
// HUD: kierrokset porkkanoina vasemmalla (kultainen = ilman vihjettä ja
// lähes lyhin reitti), tähdet niiden perässä, tassunjäljet oikealla
function drawReflectHud(c) {
  var hs = viewH * 0.022, left = hudX(), n = REFL_ROUNDS.length, i, x, y = viewH * 0.06, done, w;
  w = hs * 2.6 * n + hs * 1.2 + (refl.round === 3 || refl.starsGot ? hs * 2.4 * 2 + hs : 0);
  drawHudPanel(c, left, y - hs * 1.7, w, hs * 3.4, hs);
  for (i = 0; i < n; i++) {
    done = i < refl.round || refl.state === 'won' || (i === refl.round && refl.state === 'roundDone');
    x = left + hs * 1.9 + i * hs * 2.6;
    c.globalAlpha = done ? 1 : 0.4;
    if (done && refl.gold[i]) artGlow(c, x, y, hs * 1.7, '#ffd24f', 0.75);
    reflDrawHudCarrot(c, x, y, hs, done && refl.gold[i]);
    c.globalAlpha = 1;
  }
  if (refl.round === 3 || refl.starsGot) {
    for (i = 0; i < 2; i++) {
      x = left + hs * 2.6 * n + hs * 1.6 + i * hs * 2.4;
      c.globalAlpha = i < refl.starsGot ? 1 : 0.3;
      drawStar(c, x, y, hs * 0.9, 0, i < refl.starsGot ? 0.5 : 0);
      c.globalAlpha = 1;
    }
  }
  reflDrawSteps(c);
}
function reflDrawHudCarrot(c, x, y, hs, gold) {
  if (!gold) { drawCarrotGlyph(c, x, y - hs * 0.2, hs * 0.9); return; }
  c.save();
  c.translate(x, y - hs * 0.2);
  c.fillStyle = '#ffd24f';
  c.beginPath();
  c.moveTo(-hs * 0.4, -hs * 0.3);
  c.quadraticCurveTo(-hs * 0.25, hs * 0.6, 0, hs);
  c.quadraticCurveTo(hs * 0.25, hs * 0.6, hs * 0.4, -hs * 0.3);
  c.closePath();
  c.fill();
  c.strokeStyle = '#b8862a';
  c.lineWidth = Math.max(1, hs * 0.08);
  c.stroke();
  c.restore();
  artCircle(c, x - hs * 0.32, y - hs * 0.8, hs * 0.2, '#5fd36b', { line: false });
  artCircle(c, x, y - hs * 0.9, hs * 0.22, '#5fd36b', { line: false });
  artCircle(c, x + hs * 0.32, y - hs * 0.8, hs * 0.2, '#5fd36b', { line: false });
  reflDrawGlint(c, x - hs * 0.1, y, hs * 0.25);
}
// Tassunjäljet: tavoite + 2 ruutua; käytetyt hypyt täyttyvät pinkeiksi
function reflDrawSteps(c) {
  var G = refl.G, hs = viewH * 0.02, par, slots, used, i, x, y, w, right = viewW - viewH * 0.13, row = 0, perRow, filled;
  if (!G || refl.state === 'won' || refl.state === 'intro') return;
  par = refl.starsAll && reflStarsLeft() === 0 ? G.lenStars : G.len;
  slots = par + 2;
  used = refl.hist.length + refl.waste;
  if (refl.state === 'demo') used = 0;
  perRow = 7;
  w = Math.min(slots, perRow) * hs * 1.7 + hs * 0.8;
  drawHudPanel(c, right - w, viewH * 0.06 - hs * 1.9 + (slots > perRow ? -hs * 0.8 : 0), w, hs * 3.8 + (slots > perRow ? hs * 1.6 : 0), hs);
  for (i = 0; i < slots; i++) {
    row = Math.floor(i / perRow);
    x = right - w + hs * 1.25 + (i % perRow) * hs * 1.7;
    y = viewH * 0.06 + (slots > perRow ? (row - 0.5) * hs * 1.7 : 0);
    filled = i < used;
    reflDrawPaw(c, x, y, hs * 0.62, filled ? (used > slots ? '#c8a8d8' : '#ff7bac') : (i >= par ? 'rgba(240,190,60,0.7)' : 'rgba(150,110,190,0.45)'));
  }
}
function reflDrawPaw(c, x, y, s, col) {
  c.fillStyle = col;
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y + s * 0.3, s * 0.55, s * 0.45, 0, 0, Math.PI * 2); else c.arc(x, y + s * 0.3, s * 0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.arc(x - s * 0.5, y - s * 0.35, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x, y - s * 0.6, s * 0.22, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.5, y - s * 0.35, s * 0.2, 0, Math.PI * 2); c.fill();
}
// Loppuruutu: kaikki porkkanat (kultaiset hehkuvat) ja kerätyt tähdet
function reflDrawWon(c) {
  var h = viewH, n = REFL_ROUNDS.length, s = h * 0.05, k = Math.min(1, refl.wonT / 0.5), w = s * 3 * n + s * 2, x0 = viewW / 2 - w / 2, y = h * 0.3, i, x;
  c.globalAlpha = k;
  c.fillStyle = 'rgba(255,255,255,0.88)';
  roundRect(c, x0, y - s * 1.8, w, s * (refl.starsGot ? 5.6 : 3.6), s);
  c.fill();
  c.strokeStyle = '#c79bff';
  c.lineWidth = Math.max(2, s * 0.08);
  c.stroke();
  for (i = 0; i < n; i++) {
    x = x0 + s * 2.5 + i * s * 3;
    if (refl.gold[i]) artGlow(c, x, y, s * 1.8, '#ffd24f', 0.6 + Math.sin(globalT * 4 + i) * 0.2);
    reflDrawHudCarrot(c, x, y + Math.sin(globalT * 5 + i) * s * 0.1, s, refl.gold[i]);
  }
  for (i = 0; i < refl.starsGot; i++) drawStar(c, viewW / 2 + (i - (refl.starsGot - 1) / 2) * s * 2, y + s * 2.4, s * 0.8, globalT, 0.6);
  c.globalAlpha = 1;
}

HUB_ICONS.reflect = function (c, x, y, s) {
  var w = s * 0.12, g;
  artRoundRect(c, x - w / 2 - s * 0.02, y - s * 0.34, w + s * 0.04, s * 0.58, w * 0.5, '#ffd24f', { lineColor: '#b8862a' });
  g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#e8f4ff');
  g.addColorStop(1, '#c8b8ff');
  c.fillStyle = g;
  roundRect(c, x - w / 2, y - s * 0.32, w, s * 0.54, w * 0.45);
  c.fill();
  reflDrawBunnyRaw(c, x - s * 0.2, y + s * 0.2, s * 0.1, 0, REFL_PCOL[0], 1, 0);
  c.globalAlpha = 0.75;
  reflDrawBunnyRaw(c, x + s * 0.2, y + s * 0.2, s * 0.1, 0, REFL_PCOL[1], -1, 0);
  c.globalAlpha = 1;
  reflDrawGlint(c, x + s * 0.26, y - s * 0.12, s * 0.04);
};
