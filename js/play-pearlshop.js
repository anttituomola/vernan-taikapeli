'use strict';

// Helmipaja (Meren valtakunta, Korallikylä): leipomon ja pizzerian
// tilaus-ja-kokoa-logiikka helminauhoilla, vaikean kentän tasolla.
// Yksi ruutu, kaikki raahaamalla:
//   - Asiakas (merenneito, kilpikonna tai mustekalan poikanen) ui tiskin
//     taakse, ja puhekuplassa on kuva helminauhasta: rivi helmiä ja koruja
//     (pinkki, turkoosi ja valkoinen helmi, simpukka, meritähti).
//   - Helmi raahataan lokerosta (enintään 5) tiskin samettilaudalle; se
//     napsahtaa nauhan seuraavaan paikkaan vasemmalta oikealle. Väärän helmen
//     saa pois raahaamalla sen nauhalta (takaisin lokeroon); nauhalle
//     takaisin pudotettu helmi asettuu siihen kohtaan, johon se pudotettiin.
//   - Valmis nauha raahataan asiakkaalle laudasta tai kultaisesta lukosta.
//     Oikein: asiakas pukee sen kaulaansa ja ui iloisena pois. Väärin: pää
//     ravistaa, kuplan väärä kohta sykkii ja nauha palaa laudalle.
// Kolme vaihetta (vesi tummuu illaksi), tilaukset arvotaan joka kerta:
//   aamu:  suora kopio (3, 4 ja 5 helmeä), ei kärsivällisyyttä
//   päivä: kuvion jatkaminen (kuplassa alku "AB AB" ja tyhjät paikat, täydennä
//          koko nauha) ja muistitilaus (kupla näkyy hetken ja sulkeutuu
//          simpukaksi; asiakkaan napautus avaa sen uudelleen, mutta kuluttaa
//          kärsivällisyyttä)
//   ilta:  kaksi asiakasta yhtä aikaa, lukumäärät numeroina kuvien seassa
//          ("3 [pinkki]"), lopuksi Merikuningatar ja hänen 8 helmen nauhansa.
// Kärsivällisyys (simpukkakello kuplan kulmassa) per asiakas päivästä alkaen;
// loppuessaan asiakas ui surullisena pois ja palaa jonon perältä myöhemmin.
// Ei game overia. Vaiheiden välissä kilpikonnakauppias tuo tavaraa: maksa ja
// laske. Kultainen helminauha (+1 tähti): epäonnistumisia enintään
// PSH_GOLD_MAX (väärä nauha 1, pois uinut asiakas PSH_PATOUT_FAIL).
// Tökättävät: simpukkakello, pallokala, kuplapiippu ja erakkorapu.

var PSH_TYPES = ['pink', 'aqua', 'pearl', 'shell', 'star'];
var PSH_COL = { pink: '#ff7eb6', aqua: '#36c6dc', pearl: '#fbf6ff', shell: '#ffb08a', star: '#ffcc3a' };
var PSH_LINE = { pink: '#b8407a', aqua: '#1a7a96', pearl: '#a890c8', shell: '#c0603a', star: '#c07a10' };
// Tilaukset: k = laji (copy, pat, mem, count, queen), n = helmiä, t = lajeja, unit = kuvion pituus
var PSH_PLAN = [
  { ph: 0, k: 'copy', n: 3, t: 2 }, { ph: 0, k: 'copy', n: 4, t: 3 }, { ph: 0, k: 'copy', n: 5, t: 2 },
  { ph: 1, k: 'pat', unit: 2 }, { ph: 1, k: 'pat', unit: 3 }, { ph: 1, k: 'mem', n: 5, t: 3 }, { ph: 1, k: 'mem', n: 6, t: 3 },
  { ph: 2, k: 'count', n: 5 }, { ph: 2, k: 'pat', unit: 3 }, { ph: 2, k: 'count', n: 6 }, { ph: 2, k: 'queen', n: 8 }
];
var PSH_PHASE_AT = [0, 3, 7];          // vaiheen ensimmäinen tilaus
var PSH_SPOTS = [1, 1, 2];             // asiakaspaikkoja tiskillä vaiheittain
var PSH_TRAYS = [4, 5, 5];             // lokeroita auki vaiheittain
var PSH_MAX = 8;                       // helmiä nauhalla enintään
var PSH_PAT = [0, 26, 38];             // kärsivällisyyden pohja (s); 0 = ei kärsivällisyyttä
var PSH_PAT_PER = 2.5;                 // + s per helmi
var PSH_MEM_SHOW = 2.6;                // muistitilauksen kupla näkyy (s) ...
var PSH_MEM_PER = 0.45;                // ... + s per helmi
var PSH_MEM_PEEK = 2.6;                // uudelleenkurkistus (s)
var PSH_PEEK_COST = 0.15;              // kurkistus vie kärsivällisyydestä
var PSH_ARRIVE_GAP = [1.0, 1.4, 1.4];  // seuraava asiakas lähdön jälkeen (s)
var PSH_SECOND_GAP = 6;                // toinen asiakas ensimmäisen jälkeen (s)
var PSH_BACK_GAP = 4;                  // pois uinut palaa aikaisintaan (s)
var PSH_BACK_PAT = 1.5;                // palaavan asiakkaan kärsivällisyys × (ei kierrettä)
var PSH_GOLD_MAX = 2;                  // epäonnistumisia enintään kultaiseen
var PSH_PATOUT_FAIL = 2;               // pois uinut asiakas = näin monta epäonnistumista
var PSH_HINT_IDLE = 8;                 // vihjekäsi toimettomuuden jälkeen (s)
var PSH_MISS_T = 2.6;                  // väärän kohdan sykkiminen (s)

var psh = {
  L: null, t: 0, idleT: 0, ph: 0, dayK: 0, orders: [], queue: [], custs: [], seq: 0, served: 0,
  str: [], drag: null, flies: [], puffs: [], bubs: [], neckBack: null, badI: -1, badT: 0,
  misses: 0, patOut: 0, peeks: 0, stars: [], starPop: 0, goldLostT: 0, flow: 'play', flowT: 0,
  taskIdx: 0, cour: null, arriveT: 0, shown: {}, hintStep: null, hintT: 0, celT: 0,
  spr: {}, trayCv: null, trayN: 0, trayPop: 0, claspWob: 0, fish: null
};

// ---------- Asettelu ----------
// u = mittayksikkö (16:10-näytöllä u = H). Tiski alhaalla koko leveydeltä:
// samettilauta ja nauha keskellä, lokerot alla. Asiakkaat tiskin takana oikealla.
function pshLayout() {
  var W = viewW, H = viewH, u = Math.min(H, W / 1.6), L = { W: W, H: H, u: u }, i;
  L.cy = H * 0.555;
  L.br = u * 0.034;
  L.sp = u * 0.082;
  L.cx = W * 0.45;
  L.strY = H * 0.70;
  L.x0 = L.cx - L.sp * (PSH_MAX - 1) / 2;
  L.clasp = { x: L.x0 + L.sp * (PSH_MAX - 1) + L.sp * 0.85, y: L.strY };
  L.claspL = { x: L.x0 - L.sp * 0.85, y: L.strY };
  L.board = { x0: L.claspL.x - u * 0.045, x1: L.clasp.x + u * 0.045, y0: L.strY - u * 0.075, y1: L.strY + u * 0.075 };
  L.trayY = H * 0.885;
  L.trayR = u * 0.064;
  L.trays = [];
  for (i = 0; i < 5; i++) L.trays.push({ x: L.cx + (i - 2) * u * 0.15, y: L.trayY });
  L.spots = [{ x: W - u * 0.17, y: H * 0.47 }, { x: W - u * 0.53, y: H * 0.47 }];
  L.cs = u * 0.13;
  L.clock = { x: u * 0.15, y: H * 0.33 };
  L.pipe = { x: u * 0.11, y: H * 0.8 };
  L.crab = { x: L.trays[0].x - u * 0.15, y: H * 0.95 };
  psh.L = L;
}
function pshSlotPos(i) { var L = psh.L; return { x: L.x0 + i * L.sp, y: L.strY }; }
function pshTrayPos(type) { var t = psh.L.trays[PSH_TYPES.indexOf(type)]; return { x: t.x, y: t.y - psh.L.u * 0.01 }; }

// ---------- Pienet apurit ----------
function pshText(c, txt, x, y, size, col, line) {
  c.font = 'bold ' + Math.round(size) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (line) {
    c.strokeStyle = line;
    c.lineWidth = Math.max(2, size * 0.16);
    c.lineJoin = 'round';
    c.strokeText(txt, x, y);
  }
  c.fillStyle = col;
  c.fillText(txt, x, y);
}
function pshPuff(x, y, n, col, o) {
  var i;
  o = o || {};
  for (i = 0; i < n; i++) {
    if (psh.puffs.length > 60) psh.puffs.shift();
    psh.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * (o.spread || 0.03), y: y,
      vx: (Math.random() - 0.5) * viewH * 0.06, vy: -viewH * (o.up !== undefined ? o.up : (0.05 + Math.random() * 0.06)),
      r: viewH * (o.r || 0.01) * (0.7 + Math.random() * 0.6), t: 0, life: o.life || (0.9 + Math.random() * 0.6),
      col: col || '#ffffff', heart: !!o.heart, note: !!o.note
    });
  }
}
function pshHeartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
  c.closePath();
}
function pshBub(x, y, r, vy) {
  if (psh.bubs.length > 40) psh.bubs.shift();
  psh.bubs.push({ x: x, y: y, r: r, vy: vy || viewH * (0.08 + Math.random() * 0.06), ph: Math.random() * 6, t: 0 });
}
function pshShuffle(a) { return shuffleNums(a.slice()); }
function pshFails() { return psh.misses + PSH_PATOUT_FAIL * psh.patOut; }
function pshGolden() { return pshFails() <= PSH_GOLD_MAX; }
function pshFail(n) {
  var was = pshGolden();
  if (n === 'miss') psh.misses++;
  else psh.patOut++;
  if (was && !pshGolden()) psh.goldLostT = 1.5;
}

// ---------- Helmet ----------
// Helmi piirretään valmiiksi pieneen canvasiin (ei liukuvärejä joka ruudulla)
function pshMakeSprites() {
  var i, cv, b, R = psh.L.br * 1.6, S = Math.ceil(R * 2.8);
  psh.spr = { R: R, S: S };
  for (i = 0; i < PSH_TYPES.length; i++) {
    cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    b = cv.getContext('2d');
    pshPaintBead(b, PSH_TYPES[i], S / 2, S / 2, R);
    psh.spr[PSH_TYPES[i]] = cv;
  }
}
function pshPaintBead(b, type, x, y, r) {
  var i, a, col = PSH_COL[type], line = PSH_LINE[type];
  if (type === 'shell') {
    // Kampasimpukka: viuhka ja uurteet
    b.beginPath();
    b.moveTo(x, y + r * 0.95);
    for (i = 0; i <= 10; i++) {
      a = Math.PI * (1.08 + i * 0.084);
      b.lineTo(x + Math.cos(a) * r * 1.1, y + r * 0.2 + Math.sin(a) * r * 1.15 + (i % 2 ? r * 0.06 : 0));
    }
    b.closePath();
    artFillPath(b, col, y - r, y + r, r, { lineColor: line });
    b.strokeStyle = artRGBA(line, 0.55);
    b.lineWidth = Math.max(1, r * 0.08);
    for (i = 1; i < 5; i++) {
      a = Math.PI * (1.12 + i * 0.152);
      b.beginPath(); b.moveTo(x, y + r * 0.85); b.lineTo(x + Math.cos(a) * r * 0.95, y + r * 0.2 + Math.sin(a) * r * 1.0); b.stroke();
    }
    artBlob(b, x, y + r * 0.85, r * 0.3, r * 0.16, artShade(col, -0.1), { lineColor: line });
    return;
  }
  if (type === 'star') {
    b.beginPath();
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5;
      b.lineTo(x + Math.cos(a) * r * (i % 2 ? 0.5 : 1.15), y + r * 0.08 + Math.sin(a) * r * (i % 2 ? 0.5 : 1.15));
    }
    b.closePath();
    b.lineJoin = 'round';
    artFillPath(b, col, y - r, y + r, r, { lineColor: line });
    b.fillStyle = artRGBA('#ffffff', 0.7);
    for (i = 0; i < 5; i++) {
      a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      b.beginPath(); b.arc(x + Math.cos(a) * r * 0.55, y + r * 0.08 + Math.sin(a) * r * 0.55, r * 0.08, 0, Math.PI * 2); b.fill();
    }
    return;
  }
  artCircle(b, x, y, r, col, { lineColor: line, shadeTo: type === 'pearl' ? '#dccaf0' : undefined, hi: 0.6 });
  b.fillStyle = 'rgba(255,255,255,0.85)';
  b.beginPath(); b.arc(x - r * 0.35, y - r * 0.38, r * 0.22, 0, Math.PI * 2); b.fill();
}
function pshBead(c, type, x, y, r) {
  var s = psh.spr, k;
  if (!s[type]) return;
  k = r / s.R;
  c.drawImage(s[type], x - s.S * k / 2, y - s.S * k / 2, s.S * k, s.S * k);
}

// ---------- Lokerot (esirenderöity) ----------
function pshRenderTrays() {
  var L = psh.L, n = PSH_TRAYS[psh.ph], cv = psh.trayCv || document.createElement('canvas'), b, i, j, t, x, y, r = L.trayR;
  cv.width = Math.ceil(L.W);
  cv.height = Math.ceil(L.H);
  b = cv.getContext('2d');
  b.clearRect(0, 0, cv.width, cv.height);
  for (i = 0; i < n; i++) {
    t = L.trays[i];
    // Simpukkakulho
    artShadow(b, t.x, t.y + r * 0.55, r * 1.15, r * 0.3, 0.2);
    b.beginPath();
    if (b.ellipse) b.ellipse(t.x, t.y, r * 1.08, r * 0.62, 0, 0, Math.PI * 2);
    else b.arc(t.x, t.y, r, 0, Math.PI * 2);
    artFillPath(b, '#fff0f4', t.y - r * 0.6, t.y + r * 0.6, r, { lineColor: '#c88aa0' });
    b.beginPath();
    if (b.ellipse) b.ellipse(t.x, t.y + r * 0.04, r * 0.86, r * 0.44, 0, 0, Math.PI * 2);
    else b.arc(t.x, t.y, r * 0.8, 0, Math.PI * 2);
    b.fillStyle = '#f2c8d8';
    b.fill();
    // Kasa helmiä
    for (j = 0; j < 6; j++) {
      x = t.x + [-0.5, 0, 0.5, -0.25, 0.25, 0][j] * r;
      y = t.y + [0.12, 0.16, 0.12, -0.14, -0.14, -0.4][j] * r;
      pshPaintBead(b, PSH_TYPES[i], x, y, L.br * 0.82);
    }
  }
  psh.trayCv = cv;
  psh.trayN = n;
}

// ---------- Tilaukset ----------
function pshPickTypes(n, pool) { return pshShuffle(pool).slice(0, n); }
function pshPartition(n, minBig) {
  var opts = {
    5: [[1, 3, 1], [2, 3], [3, 2], [2, 1, 2]],
    6: [[1, 4, 1], [3, 3], [2, 2, 2], [1, 3, 2], [2, 3, 1]],
    8: [[1, 3, 1, 3], [2, 1, 2, 1, 2], [3, 2, 3], [1, 2, 2, 3], [2, 3, 1, 2]]
  }[n], p, big, i, tries = 0;
  do {
    p = opts[randInt(opts.length)];
    big = 0;
    for (i = 0; i < p.length; i++) if (p[i] >= 2) big++;
    tries++;
  } while (big < (minBig || 1) && tries < 20);
  return p;
}
function pshMakeOrder(pl, idx) {
  var pool = PSH_TYPES.slice(0, PSH_TRAYS[pl.ph]), o = { idx: idx, k: pl.k, ph: pl.ph, seq: [], items: [], perfect: true, mem: pl.k === 'mem', back: false },
    i, ty, unit, v, total, shown, parts, prev;
  if (pl.k === 'copy' || pl.k === 'mem') {
    ty = pshPickTypes(pl.t, pool);
    for (i = 0; i < pl.n; i++) o.seq.push(i < pl.t ? ty[i] : ty[randInt(pl.t)]);
    // Sekoita, mutta ei kolmea samaa peräkkäin
    do { o.seq = pshShuffle(o.seq); } while (pshTriple(o.seq));
    for (i = 0; i < o.seq.length; i++) o.items.push({ type: o.seq[i], n: 1, s: i });
  } else if (pl.k === 'pat') {
    ty = pshPickTypes(3, pool);
    if (pl.unit === 2) unit = [ty[0], ty[1]];
    else {
      v = randInt(3);
      unit = v === 0 ? [ty[0], ty[1], ty[1]] : v === 1 ? [ty[0], ty[0], ty[1]] : [ty[0], ty[1], ty[2]];
    }
    total = pl.unit === 2 ? 7 : 8;
    shown = pl.unit === 2 ? 4 : 5;
    for (i = 0; i < total; i++) {
      o.seq.push(unit[i % unit.length]);
      o.items.push(i < shown ? { type: o.seq[i], n: 1, s: i } : { type: o.seq[i], n: 1, s: i, empty: true });
    }
  } else {
    // Lukumäärät: [simpukka] [3 pinkki] [simpukka]
    parts = pshPartition(pl.n, pl.k === 'queen' ? 2 : 1);
    prev = null;
    for (i = 0; i < parts.length; i++) {
      do { ty = pool[randInt(pool.length)]; } while (ty === prev);
      prev = ty;
      o.items.push({ type: ty, n: parts[i], s: o.seq.length });
      for (v = 0; v < parts[i]; v++) o.seq.push(ty);
    }
  }
  return o;
}
function pshTriple(s) {
  var i;
  for (i = 2; i < s.length; i++) if (s[i] === s[i - 1] && s[i] === s[i - 2]) return true;
  return false;
}
function pshItemOf(o, k) {
  var i, it;
  for (i = 0; i < o.items.length; i++) { it = o.items[i]; if (k >= it.s && k < it.s + it.n) return i; }
  return -1;
}

// ---------- Init ----------
function initPearlshop() {
  var i;
  tasks = [makeTask(-5, 'pay'), makeTask(-5, 'count')];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  pshLayout();
  psh.t = 0;
  psh.idleT = 0;
  psh.ph = 0;
  psh.dayK = 0;
  psh.orders = [];
  for (i = 0; i < PSH_PLAN.length; i++) psh.orders.push(pshMakeOrder(PSH_PLAN[i], i));
  psh.queue = pshPhaseOrders(0);
  psh.custs = [];
  psh.seq = 0;
  psh.served = 0;
  psh.str = [];
  psh.drag = null;
  psh.flies = [];
  psh.puffs = [];
  psh.bubs = [];
  psh.neckBack = null;
  psh.badI = -1;
  psh.badT = 0;
  psh.misses = 0;
  psh.patOut = 0;
  psh.peeks = 0;
  psh.stars = [];
  psh.starPop = 0;
  psh.goldLostT = 0;
  psh.flow = 'play';
  psh.flowT = 0;
  psh.taskIdx = 0;
  psh.cour = null;
  psh.arriveT = 1.0;
  psh.shown = {};
  psh.hintStep = null;
  psh.hintT = 0;
  psh.celT = 0;
  psh.trayPop = 0;
  psh.claspWob = 0;
  psh.trophy = null;
  pshMakeSprites();
  pshRenderTrays();
  pshSetupProps();
  renderBackground();
  for (i = 0; i < 3; i++) playNote([659, 784, 988][i], i * 0.13, 0.25, 'sine', 0.25);
  playNote(1319, 0.42, 0.4, 'triangle', 0.22);
}
function pshPhaseOrders(ph) {
  var out = [], i;
  for (i = 0; i < psh.orders.length; i++) if (psh.orders[i].ph === ph) out.push(psh.orders[i]);
  return out;
}
function respawnPearlshop() {}
function resizePearlshop() {
  var i, g;
  camX = 0;
  pshLayout();
  if (psh.drag) pshCancelDrag();
  psh.flies = [];
  psh.neckBack = null;
  for (i = 0; i < psh.str.length; i++) psh.str[i].ft = 1;
  pshMakeSprites();
  pshRenderTrays();
  pshSetupProps();
  for (i = psh.custs.length - 1; i >= 0; i--) {
    g = psh.custs[i];
    if (g.state === 'leave' || g.state === 'sad') { psh.custs.splice(i, 1); continue; }
    g.x = psh.L.spots[g.spot].x;
    g.y = psh.L.spots[g.spot].y;
    g.geom = pshBubbleGeom(g);
  }
}

// ---------- Asiakkaat ----------
var PSH_LOOKS = [
  { kind: 'mermaid', hair: '#ff9fc8', tail: '#4fc8c0' }, { kind: 'mermaid', hair: '#ffd24f', tail: '#7a8cff' },
  { kind: 'mermaid', hair: '#8a4a2a', tail: '#ff8a7a', skin: '#e8b48a' }, { kind: 'mermaid', hair: '#ff7a3a', tail: '#5cc07a' },
  { kind: 'mermaid', hair: '#3a3050', tail: '#ff9fc8', skin: '#c8906a' }, { kind: 'turtle' }, { kind: 'octo' }
];
function pshSpotBusy(s) {
  var i, g;
  for (i = 0; i < psh.custs.length; i++) {
    g = psh.custs[i];
    if (g.spot === s && g.state !== 'leave' && g.state !== 'sad') return true;
  }
  return false;
}
function pshActiveCount() {
  var i, n = 0;
  for (i = 0; i < psh.custs.length; i++) if (psh.custs[i].state !== 'leave' && psh.custs[i].state !== 'sad') n++;
  return n;
}
function pshFreeSpot() {
  var i;
  for (i = 0; i < PSH_SPOTS[psh.ph]; i++) if (!pshSpotBusy(i)) return i;
  return -1;
}
function pshSpawn(spot) {
  var o = psh.queue.shift(), L = psh.L, look, g, i, used = {};
  i = -1;
  if (o.k === 'queen') look = { kind: 'mermaid', hair: '#c8a8ff', tail: '#8a5ad8', crown: 'pearls', queen: true };
  else {
    // Ei samannäköistä kahta yhtä aikaa
    for (i = 0; i < psh.custs.length; i++) used[psh.custs[i].lookI] = true;
    do { i = randInt(PSH_LOOKS.length); } while (used[i]);
    look = PSH_LOOKS[i];
  }
  g = {
    o: o, spot: spot, look: look, lookI: i, x: L.W + L.cs * 1.5, y: L.spots[spot].y + L.u * 0.05, state: 'enter', t: 0,
    pat: 1, patT: 999, shakeT: 0, joyT: 0, pop: 0, miss: null, memT: 0, memK: 0, wear: null, seq: psh.seq++, peekPop: 0,
    ph: Math.random() * 6
  };
  if (PSH_PAT[psh.ph] > 0) g.patT = (PSH_PAT[psh.ph] + PSH_PAT_PER * o.seq.length) * (o.back ? PSH_BACK_PAT : 1);
  g.geom = pshBubbleGeom(g);
  psh.custs.push(g);
  if (look.queen) {
    for (i = 0; i < 5; i++) playNote([523, 659, 784, 1047, 1319][i], i * 0.12, 0.3, 'triangle', 0.22);
    spawnSparkles(L.W - L.u * 0.1, L.spots[spot].y - L.cs, 14, '#ffe27a');
  } else {
    playNote(1175, 0, 0.08, 'sine', 0.12);
    playNote(1568, 0.1, 0.12, 'sine', 0.12);
  }
  for (i = 0; i < 4; i++) pshBub(g.x - L.cs * 0.3, g.y, L.u * (0.006 + Math.random() * 0.008));
}
function pshScale(g) { return psh.L.cs * (g.look.queen ? 1.15 : 1); }
function pshUpdateCusts(dt) {
  var i, g, L = psh.L, sp, tx, ty, live = psh.flow === 'play';
  for (i = psh.custs.length - 1; i >= 0; i--) {
    g = psh.custs[i];
    g.t += dt;
    if (g.shakeT > 0) g.shakeT -= dt;
    if (g.joyT > 0) g.joyT -= dt;
    if (g.pop > 0) g.pop -= dt;
    if (g.peekPop > 0) g.peekPop -= dt;
    if (g.miss) { g.miss.t -= dt; if (g.miss.t <= 0) g.miss = null; }
    if (g.memT > 0) g.memT -= dt;
    g.memK += ((g.o.mem && g.memT <= 0 && g.state === 'wait' && !g.miss) ? 1 : -1) * dt * 4;
    g.memK = Math.max(0, Math.min(1, g.memK));
    sp = L.spots[g.spot];
    if (g.state === 'enter') {
      tx = sp.x; ty = sp.y;
      g.x += (tx - g.x) * Math.min(1, dt * 3.2) - L.u * 0.05 * dt;
      g.y += (ty - g.y) * Math.min(1, dt * 3);
      if (g.x <= tx + L.u * 0.004) {
        g.x = tx;
        g.state = 'wait';
        g.pop = 0.4;
        if (g.o.mem) g.memT = PSH_MEM_SHOW + PSH_MEM_PER * g.o.seq.length;
        playNote(784, 0, 0.1, 'sine', 0.18);
        playNote(988, 0.09, 0.1, 'sine', 0.18);
        playNote(1175, 0.18, 0.16, 'sine', 0.18);
      }
    } else if (g.state === 'wait') {
      g.y += (sp.y - g.y) * Math.min(1, dt * 3);
      if (live && g.patT < 999) {
        g.pat -= dt / g.patT;
        if (g.pat <= 0) pshSadLeave(g);
      }
    } else if (g.state === 'happy') {
      if (g.t > 1.9) { g.state = 'leave'; g.t = 0; }
    } else if (g.state === 'leave') {
      g.x += L.u * 0.55 * dt;
      g.y -= L.u * 0.18 * dt;
      if (Math.random() < dt * 4) pshBub(g.x - L.cs * 0.4, g.y + L.cs * 0.3, L.u * 0.006);
      if (g.x > L.W + L.cs * 1.5) psh.custs.splice(i, 1);
    } else if (g.state === 'sad') {
      g.x += L.u * 0.32 * dt;
      g.y += Math.sin(g.t * 3) * L.u * 0.02 * dt;
      if (g.x > L.W + L.cs * 1.5) psh.custs.splice(i, 1);
    }
  }
}
function pshSadLeave(g) {
  var L = psh.L;
  g.pat = 0;
  g.state = 'sad';
  g.t = 0;
  g.miss = null;
  g.o.perfect = false;
  g.o.back = true;
  pshFail('pat');
  psh.queue.push(g.o);
  psh.arriveT = Math.max(psh.arriveT, psh.queue.length > 1 ? PSH_ARRIVE_GAP[psh.ph] : PSH_BACK_GAP);
  pshPuff(g.x, g.y - L.cs * 1.1, 4, '#bfe6ff', { up: 0.06 });
  playNote(392, 0, 0.3, 'sine', 0.15);
  playNote(330, 0.28, 0.3, 'sine', 0.13);
  playNote(262, 0.56, 0.5, 'sine', 0.12);
}

// ---------- Kulku ----------
function pshUpdateFlow(dt) {
  var fs, i;
  psh.flowT += dt;
  if (psh.flow === 'play') {
    if (psh.queue.length) {
      fs = pshFreeSpot();
      if (fs >= 0 && !(psh.queue[0].k === 'queen' && pshActiveCount() > 0)) {
        psh.arriveT -= dt;
        if (psh.arriveT <= 0) {
          pshSpawn(fs);
          psh.arriveT = PSH_SECOND_GAP;
        }
      }
    } else if (!psh.custs.length) {
      if (psh.ph < 2) {
        psh.flow = 'turtle';
        psh.flowT = 0;
        psh.cour = { t: 0, leave: -1 };
        playNote(392, 0, 0.15, 'triangle', 0.2);
        playNote(523, 0.18, 0.2, 'triangle', 0.2);
      } else {
        psh.flow = 'end';
        psh.flowT = 0;
      }
    }
    return;
  }
  if (psh.flow === 'turtle') {
    if (psh.flowT < 2.2) return;
    pshCancelDrag();
    psh.flow = 'task';
    psh.flowT = 0;
    taskStart(tasks[psh.taskIdx]);
    return;
  }
  if (psh.flow === 'task') {
    if (!tasks[psh.taskIdx].opened) return;
    psh.taskIdx++;
    psh.cour.leave = psh.cour.t;
    psh.ph++;
    psh.queue = pshPhaseOrders(psh.ph);
    psh.flow = 'play';
    psh.flowT = 0;
    psh.arriveT = 1.8;
    if (PSH_TRAYS[psh.ph] !== psh.trayN) {
      pshRenderTrays();
      psh.trayPop = 0.6;
      i = psh.L.trays[PSH_TRAYS[psh.ph] - 1];
      spawnSparkles(i.x, i.y, 14, '#ffe27a');
    }
    for (i = 0; i < 4; i++) playNote([659, 784, 988, 1319][i], i * 0.12, 0.25, 'triangle', 0.25);
    return;
  }
  if (psh.flow === 'end') {
    if (psh.flowT > 1.2 && !psh.drag) {
      psh.flow = 'done';
      startCelebration();
      if (pshGolden()) {
        // Kultainen helminauha: +1 tähti (startCelebration antoi jo 2)
        starCoins += 1;
        starGain.n += 1;
        starGain.until = globalT + 3.2;
        saveProgress();
        spawnSparkles(viewW / 2, viewH * 0.45, 30, '#ffd24f');
      }
    }
  }
}

// ---------- Syöte ----------
function pshCustAt(x, y, margin) {
  var i, g, s;
  for (i = psh.custs.length - 1; i >= 0; i--) {
    g = psh.custs[i];
    if (g.state !== 'wait') continue;
    s = pshScale(g);
    if (Math.abs(x - g.x) < s * (0.6 + (margin || 0)) && y > g.y - s * (1.2 + (margin || 0)) && y < g.y + s * (0.5 + (margin || 0))) return g;
    if (g.geom && Math.abs(x - g.geom.x) < g.geom.w / 2 && Math.abs(y - g.geom.y) < g.geom.h / 2) return g;
  }
  return null;
}
function handlePearlshopTap(px, py) {
  var L = psh.L, i, s, d, g, B = L.board, u = L.u;
  if (!running || celebrating || puzzleBusy()) return;
  psh.idleT = 0;
  if (psh.drag) return;
  if (psh.flow === 'play' || psh.flow === 'turtle' || psh.flow === 'end') {
    // Nauhan helmi pois
    for (i = psh.str.length - 1; i >= 0; i--) {
      s = pshSlotPos(i);
      if (Math.abs(px - s.x) < L.sp * 0.5 && Math.abs(py - s.y) < L.br * 1.6) {
        pshStartDrag('bead', px, py, { type: psh.str[i].type, from: 'str', x: s.x, y: s.y });
        psh.str.splice(i, 1);
        psh.badT = 0;
        return;
      }
    }
    // Lauta tai lukko: koko nauha
    if (px > B.x0 - u * 0.02 && px < B.x1 + u * 0.03 && py > B.y0 - u * 0.02 && py < B.y1 + u * 0.02) {
      if (psh.str.length && !psh.neckBack) {
        pshStartDrag('neck', px, py, {});
      } else {
        psh.claspWob = 0.4;
        playNote(1568, 0, 0.06, 'sine', 0.12);
        playNote(1319, 0.06, 0.08, 'sine', 0.1);
      }
      return;
    }
    // Lokerot
    for (i = 0; i < PSH_TRAYS[psh.ph]; i++) {
      if (Math.hypot(px - L.trays[i].x, (py - L.trays[i].y) * 1.3) < L.trayR * 1.2) {
        pshStartDrag('bead', px, py, { type: PSH_TYPES[i], from: 'tray', x: L.trays[i].x, y: L.trays[i].y - u * 0.01 });
        return;
      }
    }
  }
  // Asiakas tai kupla: muistitilauksen kurkistus, muuten vilkutus
  g = pshCustAt(px, py, 0);
  if (g) {
    if (g.o.mem && g.memT <= 0 && psh.flow === 'play') {
      g.memT = PSH_MEM_PEEK;
      g.peekPop = 0.4;
      psh.peeks++;
      if (g.patT < 999) g.pat = Math.max(0.02, g.pat - PSH_PEEK_COST);
      playNote(988, 0, 0.1, 'sine', 0.16);
      playNote(1319, 0.08, 0.14, 'sine', 0.14);
      psh.shown.peek = true;
    } else {
      g.pop = 0.35;
      g.joyT = Math.max(g.joyT, 0.6);
      playNote(880, 0, 0.08, 'sine', 0.18);
      playNote(1175, 0.08, 0.1, 'sine', 0.14);
      spawnSparkles(g.x, g.y - pshScale(g) * 0.9, 5, '#ff9ec6');
    }
    return;
  }
  if (propsTap(px, py)) return;
  // Vesi: kupla
  d = u * (0.008 + Math.random() * 0.01);
  pshBub(px, py, d, viewH * 0.15);
  playNote(1400 + Math.random() * 300, 0, 0.05, 'sine', 0.08);
}
function pshStartDrag(kind, px, py, o) {
  var d = { kind: kind, x: px, y: py, moved: 0 }, k;
  for (k in o) if (o.hasOwnProperty(k)) d[k] = o[k];
  if (kind === 'bead') playNote(880 + PSH_TYPES.indexOf(d.type) * 110, 0, 0.06, 'sine', 0.18);
  else {
    d.n = psh.str.length;
    playNote(659, 0, 0.07, 'triangle', 0.18);
    playNote(988, 0.06, 0.09, 'triangle', 0.15);
  }
  psh.drag = d;
  psh.idleT = 0;
}
function pshCancelDrag() {
  var d = psh.drag;
  if (!d) return;
  psh.drag = null;
  if (d.kind === 'bead' && d.from === 'str') psh.str.push({ type: d.type, ft: 1, fx: 0, fy: 0, pop: 0 });
}
function pshUpdateDrag(dt) {
  var d = psh.drag, k, tx, ty, mx, my;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 24);
    tx = lastPX;
    ty = lastPY + (d.kind === 'bead' ? -psh.L.u * 0.045 : 0);
    mx = d.x; my = d.y;
    d.x += (tx - d.x) * k;
    d.y += (ty - d.y) * k;
    d.moved += Math.hypot(d.x - mx, d.y - my);
    return;
  }
  psh.drag = null;
  pshDrop(d);
}
function pshOverString(x, y) {
  var B = psh.L.board;
  return x > B.x0 - psh.L.sp * 0.4 && x < B.x1 + psh.L.sp * 0.4 && Math.abs(y - psh.L.strY) < psh.L.u * 0.11;
}
function pshDrop(d) {
  var L = psh.L, idx, g, tp;
  psh.idleT = 0;
  if (d.kind === 'bead') {
    if (pshOverString(d.x, d.y)) {
      if (psh.str.length >= PSH_MAX) {
        psh.claspWob = 0.4;
        playNote(196, 0, 0.12, 'triangle', 0.2);
      } else {
        idx = d.from === 'str' ? Math.max(0, Math.min(psh.str.length, Math.round((d.x - L.x0) / L.sp))) : psh.str.length;
        psh.str.splice(idx, 0, { type: d.type, ft: 0, fx: d.x, fy: d.y, pop: 0.3 });
        psh.badT = 0;
        psh.shown.add = true;
        playNote(1047 + idx * 70, 0, 0.06, 'triangle', 0.2);
        playNote(1568 + idx * 70, 0.05, 0.05, 'sine', 0.1);
        return;
      }
    }
    if (d.from === 'str') psh.shown.off = true;
    tp = pshTrayPos(d.type);
    psh.flies.push({ kind: 'bead', type: d.type, x0: d.x, y0: d.y, x1: tp.x, y1: tp.y, t: 0, dur: 0.3 });
    return;
  }
  // Koko nauha
  g = pshCustAt(d.x, d.y, 0.25);
  if (g && psh.flow !== 'task') { pshDeliver(d, g); return; }
  if (d.y > L.trayY - L.trayR * 1.6) { pshClearString(d); return; }
  psh.neckBack = { x0: d.x, y0: d.y, t: 0 };
  playNote(523, 0, 0.08, 'triangle', 0.14);
}
// Nauha lokeroiden päälle: helmet ropisevat takaisin lokeroihinsa
function pshClearString(d) {
  var n = psh.str.length, p = pshNeckPts(n, d.x, d.y, Math.min(n, 8) * psh.L.sp * 0.55), i, tp;
  for (i = 0; i < n; i++) {
    tp = pshTrayPos(psh.str[i].type);
    psh.flies.push({ kind: 'bead', type: psh.str[i].type, x0: p[i].x, y0: p[i].y, x1: tp.x, y1: tp.y, t: 0, dur: 0.3, delay: i * 0.04 });
  }
  psh.str = [];
  psh.badT = 0;
  psh.shown.clear = true;
  pshGlide(900, 400, 0, 0.25, 'triangle', 0.12);
}
function pshGlide(f0, f1, delay, dur, type, vol) {
  var t0, osc, g;
  if (!audioCtx || muted) return;
  t0 = audioCtx.currentTime + delay;
  osc = audioCtx.createOscillator();
  g = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
function pshDeliver(d, g) {
  var o = g.o, s = psh.str, k = 0, i, hs, L = psh.L, sc = pshScale(g);
  psh.shown.serve = true;
  while (k < o.seq.length && k < s.length && s[k].type === o.seq[k]) k++;
  if (k === o.seq.length && s.length === o.seq.length) {
    // Oikein: asiakas pukee nauhan
    g.state = 'happy';
    g.t = 0;
    g.joyT = 2;
    g.miss = null;
    g.wear = [];
    for (i = 0; i < s.length; i++) g.wear.push(s[i].type);
    psh.str = [];
    psh.served++;
    psh.arriveT = Math.max(psh.arriveT, PSH_ARRIVE_GAP[psh.ph]);
    if (g.patT < 999 && g.pat < 0.15) o.perfect = false;
    for (i = 0; i < 6; i++) playNote([659, 784, 988, 1175, 1319, 1568][i], 0.05 + i * 0.07, 0.18, 'triangle', 0.24);
    spawnSparkles(g.x, g.y - sc * 0.6, 18, '#ff9ec6');
    artPop(g.x, g.y - sc * 0.55, sc * 0.5, '#ffe27a', 'ring');
    pshPuff(g.x, g.y - sc * 1.1, 3, '#ff8fb8', { heart: true, up: 0.08, life: 1.4 });
    hs = pshHudSlot(o.idx);
    psh.flies.push({ kind: 'star', x0: g.x, y0: g.y - sc, x1: hs.x, y1: hs.y, t: 0, dur: 0.6, delay: 0.4, gold: o.perfect, idx: o.idx });
    return;
  }
  // Väärin: pää ravistaa, kuplan väärä kohta sykkii, nauha palaa laudalle
  o.perfect = false;
  pshFail('miss');
  g.miss = { i: k < o.seq.length ? pshItemOf(o, k) : -1, t: PSH_MISS_T };
  g.shakeT = 0.9;
  if (o.mem) g.memT = Math.max(g.memT, PSH_MISS_T);
  psh.badI = k;
  psh.badT = PSH_MISS_T;
  psh.neckBack = { x0: d.x, y0: d.y, t: 0 };
  playNote(392, 0, 0.16, 'triangle', 0.24);
  playNote(330, 0.16, 0.24, 'triangle', 0.24);
}

// ---------- Päivitys ----------
function updatePearlshop(dt) {
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  pshUpdateFx(dt);
  if (celebrating) { psh.celT += dt; return; }
  if (puzzleBusy()) return;
  psh.t += dt;
  if (!holding) psh.idleT += dt;
  psh.dayK += Math.max(-dt * 0.3, Math.min(dt * 0.3, psh.ph - psh.dayK));
  pshUpdateDrag(dt);
  pshUpdateCusts(dt);
  pshUpdateFlow(dt);
  psh.hintStep = pshNextStep();
  if (psh.hintStep && !holding && !psh.drag && (!psh.shown[psh.hintStep.kind] || psh.idleT > PSH_HINT_IDLE)) psh.hintT += dt;
  else psh.hintT = 0;
}
function pshUpdateFx(dt) {
  var i, f, p, b, L = psh.L;
  if (!L) return;
  for (i = psh.flies.length - 1; i >= 0; i--) {
    f = psh.flies[i];
    f.t += dt;
    if (f.t - (f.delay || 0) < f.dur) continue;
    psh.flies.splice(i, 1);
    if (f.kind === 'bead') playNote(1200 + Math.random() * 200, 0, 0.04, 'sine', 0.08);
    if (f.kind === 'star') {
      psh.stars[f.idx] = f.gold ? 2 : 1;
      psh.starPop = 0.4;
      spawnSparkles(f.x1, f.y1, 10, f.gold ? '#ffd24f' : '#ffffff');
      playNote(1047, 0, 0.15, 'triangle', 0.3);
      playNote(1568, 0.1, 0.25, 'triangle', 0.3);
    }
  }
  for (i = 0; i < psh.str.length; i++) {
    p = psh.str[i];
    if (p.ft < 1) p.ft = Math.min(1, p.ft + dt / 0.15);
    if (p.pop > 0) p.pop -= dt;
  }
  if (psh.neckBack) {
    psh.neckBack.t += dt;
    if (psh.neckBack.t > 0.3) psh.neckBack = null;
  }
  for (i = psh.puffs.length - 1; i >= 0; i--) {
    p = psh.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t > p.life) psh.puffs.splice(i, 1);
  }
  for (i = psh.bubs.length - 1; i >= 0; i--) {
    b = psh.bubs[i];
    b.t += dt;
    b.y -= b.vy * dt;
    b.x += Math.sin(b.t * 3 + b.ph) * L.u * 0.03 * dt;
    if (b.y < -b.r * 2) psh.bubs.splice(i, 1);
  }
  // Kuplapiippu puhaltaa silloin tällöin
  if (Math.random() < dt * 0.6) pshBub(L.pipe.x + L.u * 0.03, L.pipe.y - L.u * 0.07, L.u * (0.005 + Math.random() * 0.006));
  if (psh.badT > 0) psh.badT -= dt;
  if (psh.goldLostT > 0) psh.goldLostT -= dt;
  if (psh.starPop > 0) psh.starPop -= dt;
  if (psh.trayPop > 0) psh.trayPop -= dt;
  if (psh.claspWob > 0) psh.claspWob -= dt;
  if (psh.cour) {
    psh.cour.t += dt;
    if (psh.cour.leave >= 0 && psh.cour.t - psh.cour.leave > 2) psh.cour = null;
  }
}

// ---------- Vihje ----------
function pshWaiting() {
  var out = [], i;
  for (i = 0; i < psh.custs.length; i++) if (psh.custs[i].state === 'wait') out.push(psh.custs[i]);
  out.sort(function (a, b) { return a.seq - b.seq; });
  return out;
}
function pshMatchLen(o) {
  var k = 0, s = psh.str;
  while (k < o.seq.length && k < s.length && s[k].type === o.seq[k]) k++;
  return k;
}
// Kenelle nauhaa ollaan tekemässä: pisimmälle osuva, tasapelissä vanhin
function pshTarget() {
  var W = pshWaiting(), i, best = null, bs = -1, m;
  for (i = 0; i < W.length; i++) {
    m = pshMatchLen(W[i].o);
    if (m > bs) { bs = m; best = W[i]; }
  }
  return best;
}
function pshNextStep() {
  var g = pshTarget(), o, k, s = psh.str, L = psh.L, n;
  if (psh.flow !== 'play' || !g || psh.neckBack) return null;
  o = g.o;
  k = pshMatchLen(o);
  n = s.length;
  if (k === o.seq.length && n === k) return { kind: 'serve', from: { x: L.clasp.x, y: L.clasp.y }, to: { x: g.x, y: g.y - pshScale(g) * 0.5 }, g: g };
  if (o.mem && g.memT <= 0 && !g.miss) return { kind: 'peek', from: { x: g.geom.x, y: g.geom.y }, to: { x: g.geom.x, y: g.geom.y }, g: g };
  if (k < n) {
    // Monta väärää: koko nauha lokeroiden päälle; muuten oikeanpuoleisin pois
    if (n - k >= 3) return { kind: 'clear', from: { x: L.clasp.x, y: L.clasp.y }, to: { x: L.cx, y: L.trayY } };
    return { kind: 'off', from: pshSlotPos(n - 1), to: pshTrayPos(s[n - 1].type), type: s[n - 1].type };
  }
  return { kind: 'add', from: pshTrayPos(o.seq[n]), to: pshSlotPos(n), type: o.seq[n] };
}

// ---------- Kuplan mitat ----------
function pshItemW(it) { var u = psh.L.u; return it.n > 1 ? u * 0.128 : u * 0.062; }
function pshBubbleGeom(g) {
  var L = psh.L, u = L.u, o = g.o, maxW = PSH_SPOTS[o.ph] > 1 && o.k !== 'queen' ? u * 0.32 : u * 0.6, rows = [], row = [], rw = 0, i, w, it,
    pad = u * 0.03, rh = u * 0.075, bw = 0, bh, sp = L.spots[g.spot], sc = L.cs * (g.look.queen ? 1.15 : 1), bx, by, r, x;
  for (i = 0; i < o.items.length; i++) {
    it = o.items[i];
    w = pshItemW(it);
    if (row.length && rw + w > maxW - pad * 2) { rows.push({ items: row, w: rw }); row = []; rw = 0; }
    row.push({ i: i, w: w });
    rw += w;
  }
  rows.push({ items: row, w: rw });
  for (i = 0; i < rows.length; i++) bw = Math.max(bw, rows[i].w);
  bw += pad * 2;
  bh = rows.length * rh + pad * 1.4;
  bx = Math.max(L.W * 0.5, Math.min(L.W - bw / 2 - u * 0.045, sp.x - u * 0.04));
  by = sp.y - sc * (g.look.queen ? 1.32 : 1.08) - u * 0.05 - bh / 2;
  by = Math.max(bh / 2 + viewH * 0.02, by);
  for (r = 0; r < rows.length; r++) {
    x = bx - rows[r].w / 2;
    for (i = 0; i < rows[r].items.length; i++) {
      rows[r].items[i].x = x + rows[r].items[i].w / 2;
      rows[r].items[i].y = by - bh / 2 + pad * 0.7 + rh * (r + 0.5);
      x += rows[r].items[i].w;
    }
  }
  return { x: bx, y: by, w: bw, h: bh, rows: rows, tx: sp.x, ty: sp.y - sc * 1.05 };
}

// ---------- Piirto: asiakkaat ----------
function pshDrawTurtle(c, x, y, s, o) {
  var t = o.t || 0, fl = Math.sin(t * 3) * 0.3 + (o.wave ? Math.sin(t * 9) * 0.5 : 0), i, a;
  // Evät
  artLimb(c, x - s * 0.42, y - s * 0.15, x - s * 0.78, y - s * 0.3 - fl * s * 0.2, s * 0.16, '#7ccf7a', '#3a7a3a');
  artLimb(c, x + s * 0.42, y - s * 0.15, x + s * 0.78, y - s * 0.3 + fl * s * 0.2 - (o.wave ? s * 0.25 : 0), s * 0.16, '#7ccf7a', '#3a7a3a');
  // Kuori
  artBlob(c, x, y + s * 0.05, s * 0.55, s * 0.45, '#5aa85a', { lineColor: '#2a5a2a', hi: 0.3 });
  artBlob(c, x, y + s * 0.12, s * 0.4, s * 0.3, '#f0e0a0', { lineColor: '#a89050', flat: true });
  c.strokeStyle = 'rgba(160,130,60,0.6)';
  c.lineWidth = Math.max(1, s * 0.03);
  for (i = 0; i < 3; i++) { a = i - 1; c.beginPath(); c.moveTo(x + a * s * 0.18, y - s * 0.12); c.lineTo(x + a * s * 0.18, y + s * 0.38); c.stroke(); }
  // Pää
  artLimb(c, x, y - s * 0.3, x, y - s * 0.5, s * 0.22, '#8ad888', '#3a7a3a');
  artCircle(c, x, y - s * 0.68, s * 0.27, '#8ad888', { lineColor: '#3a7a3a' });
  pshFace(c, x, y - s * 0.68, s * 0.27, o.mood);
}
function pshDrawOcto(c, x, y, s, o) {
  var t = o.t || 0, i, a, col = '#ff9a8a', line = '#b04a4a', w = o.wave ? Math.sin(t * 9) * 0.4 : 0;
  for (i = 0; i < 2; i++) {
    a = i ? 1 : -1;
    c.lineCap = 'round';
    c.strokeStyle = line;
    c.lineWidth = s * 0.17;
    c.beginPath();
    c.moveTo(x + a * s * 0.25, y - s * 0.2);
    c.quadraticCurveTo(x + a * s * 0.75, y - s * (0.2 + Math.sin(t * 2 + i) * 0.1), x + a * s * 0.7, y - s * (0.55 + (i ? w : 0)));
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = s * 0.12;
    c.stroke();
  }
  for (i = 0; i < 4; i++) artLimb(c, x + (i - 1.5) * s * 0.16, y, x + (i - 1.5) * s * 0.22 + Math.sin(t * 2 + i) * s * 0.06, y + s * 0.5, s * 0.13, col, line);
  artBlob(c, x, y - s * 0.4, s * 0.44, s * 0.48, col, { lineColor: line, hi: 0.35 });
  c.fillStyle = 'rgba(255,255,255,0.45)';
  for (i = 0; i < 3; i++) { c.beginPath(); c.arc(x + (i - 1) * s * 0.2, y - s * 0.72 + Math.abs(i - 1) * s * 0.06, s * 0.045, 0, Math.PI * 2); c.fill(); }
  pshFace(c, x, y - s * 0.32, s * 0.3, o.mood);
}
function pshFace(c, x, y, r, mood) {
  artEye(c, x - r * 0.35, y - r * 0.1, r * 0.2, 0, false);
  artEye(c, x + r * 0.35, y - r * 0.1, r * 0.2, 0, false);
  c.fillStyle = 'rgba(255,120,150,0.4)';
  c.beginPath(); c.arc(x - r * 0.6, y + r * 0.22, r * 0.13, 0, Math.PI * 2); c.arc(x + r * 0.6, y + r * 0.22, r * 0.13, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#5a2a3a';
  c.lineWidth = Math.max(1, r * 0.09);
  c.lineCap = 'round';
  c.beginPath();
  if (mood === 'sad') c.arc(x, y + r * 0.5, r * 0.2, Math.PI * 1.15, Math.PI * 1.85);
  else if (mood === 'wow') c.arc(x, y + r * 0.32, r * 0.12, 0, Math.PI * 2);
  else c.arc(x, y + r * 0.18, r * 0.24, Math.PI * 0.2, Math.PI * 0.8);
  c.stroke();
}
function pshNeck(g, x, y, s) {
  var k = g.look.kind;
  if (k === 'turtle') return { x: x, y: y - s * 0.42, r: s * 0.24 };
  if (k === 'octo') return { x: x, y: y - s * 0.02, r: s * 0.3 };
  return { x: x, y: y - s * 0.56, r: s * 0.2 };
}
function pshDrawWear(c, beads, n) {
  var i, a, k = beads.length;
  for (i = 0; i < k; i++) {
    a = Math.PI * (0.15 + 0.7 * (k > 1 ? i / (k - 1) : 0.5));
    pshBead(c, beads[i], n.x + Math.cos(a) * n.r, n.y + Math.sin(a) * n.r * 0.75, n.r * 0.26);
  }
}
function pshDrawCust(c, g) {
  var L = psh.L, s = pshScale(g), bob = Math.sin(globalT * 2 + g.ph) * L.u * 0.006, x = g.x, y = g.y + bob, mood, lk = g.look, n, k;
  if (g.shakeT > 0) x += Math.sin(g.shakeT * 30) * s * 0.06;
  mood = g.state === 'sad' ? 'sad' : (g.shakeT > 0 ? 'sad' : (g.joyT > 0 || g.state === 'happy' || g.state === 'leave' ? 'happy' : (g.pat < 0.3 && g.patT < 999 ? 'sad' : (g.state === 'enter' ? 'wow' : 'happy'))));
  if (g.pop > 0) { k = 1 + Math.sin(g.pop / 0.4 * Math.PI) * 0.06; c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); }
  if (lk.queen) artGlow(c, x, y - s * 0.6, s * 1.4, '#e8d8ff', 0.35);
  if (lk.kind === 'turtle') pshDrawTurtle(c, x, y, s, { t: globalT + g.ph, mood: mood, wave: g.joyT > 0 });
  else if (lk.kind === 'octo') pshDrawOcto(c, x, y, s, { t: globalT + g.ph, mood: mood, wave: g.joyT > 0 });
  else drawDeepMermaid(c, x, y, s, { hair: lk.hair, tail: lk.tail, skin: lk.skin, crown: lk.crown, mood: mood, t: globalT + g.ph, facing: -1, wave: g.joyT > 0 });
  if (g.wear) {
    n = pshNeck(g, x, y, s);
    pshDrawWear(c, g.wear, n);
  }
  if (g.state === 'sad') {
    c.fillStyle = 'rgba(140,200,255,0.8)';
    k = (g.t * 1.5) % 1;
    c.beginPath(); c.arc(x - s * 0.12, y - s * 0.7 + k * s * 0.3, s * 0.04, 0, Math.PI * 2); c.fill();
  }
  if (g.pop > 0) c.restore();
}

// ---------- Piirto: puhekupla ----------
function pshDrawBubble(c, g) {
  var G = g.geom, L = psh.L, u = L.u, o = g.o, m = g.miss, pulse = 0.5 + Math.sin(globalT * 10) * 0.5, r, i, ri, it, x, y, a, k, sc,
    pop = g.pop > 0 ? 1 + Math.sin(g.pop / 0.4 * Math.PI) * 0.06 : (g.peekPop > 0 ? 1 + Math.sin(g.peekPop / 0.4 * Math.PI) * 0.1 : 1),
    tx = Math.max(G.x - G.w * 0.38, Math.min(G.x + G.w * 0.38, G.tx));
  c.save();
  c.translate(G.x, G.y);
  c.scale(pop, pop);
  c.translate(-G.x, -G.y);
  c.beginPath(); c.moveTo(tx - u * 0.02, G.y + G.h / 2 - u * 0.01); c.lineTo(tx + u * 0.01, G.y + G.h / 2 + u * 0.035); c.lineTo(tx + u * 0.025, G.y + G.h / 2 - u * 0.01); c.closePath();
  artFillPath(c, '#ffffff', G.y, G.y + G.h, u * 0.05, { lineColor: '#9ac8d8', flat: true });
  artRoundRect(c, G.x - G.w / 2, G.y - G.h / 2, G.w, G.h, u * 0.035, g.look.queen ? '#fff8e0' : '#ffffff', { lineColor: g.look.queen ? '#d8b040' : '#9ac8d8', flat: true });
  c.fillStyle = g.look.queen ? '#fff8e0' : '#ffffff';
  c.fillRect(tx - u * 0.016, G.y + G.h / 2 - u * 0.02, u * 0.036, u * 0.02);
  // Sisältö (muistitilauksessa simpukka sulkeutuu sen päälle)
  a = 1 - Math.min(1, g.memK * 2);
  if (a > 0) {
    c.globalAlpha = a;
    // Nauhan lanka
    for (ri = 0; ri < G.rows.length; ri++) {
      r = G.rows[ri];
      c.strokeStyle = 'rgba(200,150,190,0.6)';
      c.lineWidth = Math.max(1, u * 0.004);
      c.beginPath(); c.moveTo(r.items[0].x - r.items[0].w / 2, r.items[0].y); c.lineTo(r.items[r.items.length - 1].x + r.items[r.items.length - 1].w / 2, r.items[0].y); c.stroke();
    }
    for (ri = 0; ri < G.rows.length; ri++) {
      for (i = 0; i < G.rows[ri].items.length; i++) {
        r = G.rows[ri].items[i];
        it = o.items[r.i];
        if (m && m.i === r.i) {
          c.fillStyle = 'rgba(255,80,90,' + (0.18 + pulse * 0.32) + ')';
          c.beginPath(); c.arc(r.x, r.y, u * 0.034 + (it.n > 1 ? u * 0.018 : 0), 0, Math.PI * 2); c.fill();
        }
        if (it.empty) {
          c.strokeStyle = '#a8c8e0';
          c.lineWidth = Math.max(1.5, u * 0.005);
          if (c.setLineDash) c.setLineDash([u * 0.008, u * 0.007]);
          c.beginPath(); c.arc(r.x, r.y, u * 0.022, 0, Math.PI * 2); c.stroke();
          if (c.setLineDash) c.setLineDash([]);
        } else if (it.n > 1) {
          artRoundRect(c, r.x - r.w * 0.46, r.y - u * 0.03, r.w * 0.92, u * 0.06, u * 0.026, '#fff0f6', { lineColor: '#f0b8d0', flat: true });
          pshText(c, String(it.n), r.x - r.w * 0.23, r.y + u * 0.002, u * 0.05, '#8a3a6a', '#ffffff');
          pshBead(c, it.type, r.x + r.w * 0.22, r.y, L.br * 0.78);
        } else pshBead(c, it.type, r.x, r.y, L.br * 0.78);
      }
    }
    // Ylimääräinen helmi lopussa: punainen ruksi kuplan oikeaan reunaan
    if (m && m.i < 0) {
      x = G.x + G.w / 2 - u * 0.025;
      y = G.y;
      c.strokeStyle = 'rgba(232,48,64,' + (0.6 + pulse * 0.4) + ')';
      c.lineWidth = Math.max(2, u * 0.006);
      c.beginPath(); c.moveTo(x - u * 0.014, y - u * 0.014); c.lineTo(x + u * 0.014, y + u * 0.014); c.moveTo(x + u * 0.014, y - u * 0.014); c.lineTo(x - u * 0.014, y + u * 0.014); c.stroke();
    }
    c.globalAlpha = 1;
  }
  if (g.memK > 0.5) {
    // Suljettu simpukka: napauta, niin se aukeaa
    k = (g.memK - 0.5) * 2;
    c.globalAlpha = k;
    sc = Math.min(G.h * 0.45, u * 0.065);
    pshDrawClam(c, G.x, G.y + sc * 0.2, sc, 0, Math.sin(globalT * 3) * 0.06);
    c.globalAlpha = 1;
  }
  c.restore();
  if (g.patT < 999) pshDrawPatience(c, G.x + G.w / 2 - u * 0.008, G.y - G.h / 2 + u * 0.008, g);
}
// Simpukka (open 0..1 = kansi auki)
function pshDrawClam(c, x, y, s, open, rot) {
  var i, a;
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  artBlob(c, 0, s * 0.15, s * 1.0, s * 0.5, '#f8b8d0', { lineColor: '#b0607a' });
  if (open > 0) drawDeepPearl(c, 0, s * 0.05 - open * s * 0.2, s * 0.3, open);
  c.save();
  c.translate(0, s * 0.05);
  c.rotate(-open * 0.9);
  c.beginPath();
  c.moveTo(-s, 0);
  for (i = 0; i <= 8; i++) { a = Math.PI + i * Math.PI / 8; c.lineTo(Math.cos(a) * s, Math.sin(a) * s * 0.85 + (i % 2 ? s * 0.06 : 0)); }
  c.closePath();
  artFillPath(c, '#ffc8dc', -s * 0.85, 0, s, { lineColor: '#b0607a' });
  c.strokeStyle = 'rgba(176,96,122,0.45)';
  c.lineWidth = Math.max(1, s * 0.06);
  for (i = 1; i < 4; i++) { a = Math.PI + i * Math.PI / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.75); c.stroke(); }
  c.restore();
  c.restore();
}
// Simpukkakello: täysi ympyrä hupenee kohti punaista
function pshDrawPatience(c, x, y, g) {
  var u = psh.L.u, s = u * 0.024, p = Math.max(0, Math.min(1, g.pat)), pul = p < 0.3 ? 1 + Math.sin(globalT * 12) * 0.12 : 1, col;
  s *= pul;
  artCircle(c, x, y, s * 1.2, '#ffffff', { lineColor: '#88b8c8', flat: true });
  col = p < 0.3 ? '#ff5a6a' : (p < 0.6 ? '#ffc040' : '#4fc8a0');
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x, y); c.arc(x, y, s * 0.95, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); c.closePath(); c.fill();
  c.strokeStyle = '#5a8a9a';
  c.lineWidth = Math.max(1, s * 0.12);
  c.beginPath(); c.arc(x, y, s * 0.95, 0, Math.PI * 2); c.stroke();
  // Simpukan kuvio päällä
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.moveTo(x, y + s * 0.6); c.lineTo(x - s * 0.5, y - s * 0.4); c.moveTo(x, y + s * 0.6); c.lineTo(x, y - s * 0.6); c.moveTo(x, y + s * 0.6); c.lineTo(x + s * 0.5, y - s * 0.4); c.stroke();
}

// ---------- Piirto: nauha ----------
function pshNeckPts(n, x, y, w) {
  var i, k, out = [], depth = psh.L.u * 0.07 + n * psh.L.u * 0.006;
  for (i = 0; i < n; i++) {
    k = n > 1 ? i / (n - 1) : 0.5;
    out.push({ x: x - w / 2 + w * k, y: y + psh.L.u * 0.02 + depth * (1 - Math.pow(2 * k - 1, 2)) });
  }
  return out;
}
function pshDrawString(c) {
  var L = psh.L, u = L.u, i, p, s, x, y, k, tg = pshTarget(), markN = tg ? tg.o.seq.length : 0, away = psh.drag && psh.drag.kind === 'neck',
    ready = tg && psh.str.length === markN && markN > 0, wob = psh.claspWob > 0 ? Math.sin(psh.claspWob * 40) * u * 0.006 : 0, nb = psh.neckBack;
  // Lanka
  c.lineCap = 'round';
  c.strokeStyle = '#8a5a8a';
  c.lineWidth = Math.max(2, u * 0.009);
  c.beginPath(); c.moveTo(L.claspL.x, L.strY); c.lineTo(L.clasp.x, L.strY); c.stroke();
  c.strokeStyle = away || nb ? 'rgba(255,220,240,0.35)' : '#ffd8ec';
  c.lineWidth = Math.max(1, u * 0.005);
  c.stroke();
  // Paikat: tilauksen pituus selvästi, loput himmeinä
  for (i = 0; i < PSH_MAX; i++) {
    s = pshSlotPos(i);
    if (i < markN) {
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath(); c.arc(s.x, s.y, L.br * 0.62, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,240,250,0.85)';
      c.lineWidth = Math.max(1, u * 0.003);
      c.stroke();
    } else {
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath(); c.arc(s.x, s.y, L.br * 0.18, 0, Math.PI * 2); c.fill();
    }
  }
  // Lukot
  k = ready && !away ? 1 + Math.sin(globalT * 6) * 0.15 : 1;
  if (ready && !away) artGlow(c, L.clasp.x, L.clasp.y, u * 0.06, '#fff2a0', 0.5);
  pshDrawClasp(c, L.clasp.x + wob, L.clasp.y, u * 0.022 * k);
  pshDrawClasp(c, L.claspL.x - wob, L.claspL.y, u * 0.016);
  if (away) return;
  if (nb) {
    // Nauha lentää takaisin laudalle
    k = easeOutCubic(nb.t / 0.3);
    p = pshNeckPts(psh.str.length, nb.x0, nb.y0, Math.min(psh.str.length, 8) * L.sp * 0.55);
    for (i = 0; i < psh.str.length; i++) {
      s = pshSlotPos(i);
      pshBead(c, psh.str[i].type, p[i].x + (s.x - p[i].x) * k, p[i].y + (s.y - p[i].y) * k, L.br);
    }
    return;
  }
  for (i = 0; i < psh.str.length; i++) {
    p = psh.str[i];
    s = pshSlotPos(i);
    k = easeOutCubic(p.ft);
    x = p.ft < 1 ? p.fx + (s.x - p.fx) * k : s.x;
    y = p.ft < 1 ? p.fy + (s.y - p.fy) * k : s.y;
    if (psh.badT > 0 && i >= psh.badI) {
      c.fillStyle = 'rgba(255,80,90,' + (0.25 + Math.sin(globalT * 10) * 0.2) + ')';
      c.beginPath(); c.arc(x, y, L.br * 1.45, 0, Math.PI * 2); c.fill();
    }
    pshBead(c, p.type, x, y - (p.pop > 0 ? Math.sin(p.pop / 0.3 * Math.PI) * u * 0.012 : 0), L.br);
  }
  // Puuttuva helmi: tyhjä paikka sykkii
  if (psh.badT > 0 && psh.badI >= psh.str.length && psh.badI < PSH_MAX) {
    s = pshSlotPos(psh.badI);
    c.strokeStyle = 'rgba(255,80,90,' + (0.5 + Math.sin(globalT * 10) * 0.4) + ')';
    c.lineWidth = Math.max(2, u * 0.005);
    c.beginPath(); c.arc(s.x, s.y, L.br * 1.1, 0, Math.PI * 2); c.stroke();
  }
}
function pshDrawClasp(c, x, y, r) {
  c.strokeStyle = '#a07010';
  c.lineWidth = r * 0.65;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#ffd24f';
  c.lineWidth = r * 0.4;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.arc(x - r * 0.5, y - r * 0.7, r * 0.18, 0, Math.PI * 2); c.fill();
}
function pshDrawDragged(c, d) {
  var L = psh.L, u = L.u, p, i, w, n = psh.str.length;
  if (d.kind === 'bead') {
    artShadow(c, d.x, d.y + u * 0.05, L.br, L.br * 0.35, 0.18);
    pshBead(c, d.type, d.x, d.y, L.br * 1.2);
    return;
  }
  w = Math.min(n, 8) * L.sp * 0.55;
  p = pshNeckPts(n, d.x, d.y, w);
  c.strokeStyle = '#ffd8ec';
  c.lineWidth = Math.max(1.5, u * 0.005);
  c.beginPath();
  c.moveTo(d.x - w / 2 - u * 0.02, d.y);
  for (i = 0; i < n; i++) c.lineTo(p[i].x, p[i].y);
  c.lineTo(d.x + w / 2 + u * 0.02, d.y);
  c.stroke();
  for (i = 0; i < n; i++) pshBead(c, psh.str[i].type, p[i].x, p[i].y, L.br * 0.95);
  pshDrawClasp(c, d.x - w / 2 - u * 0.02, d.y, u * 0.016);
  pshDrawClasp(c, d.x + w / 2 + u * 0.02, d.y, u * 0.016);
}

// ---------- Tökättävät ----------
// Simpukkakello seinällä (kilahtaa ja viisarit pyörähtävät; 3.: käkikala
// kurkistaa, 5.: helmiä putoaa tiskille), pallokala ui ikkunan edessä
// (pullistuu piikkipalloksi; 3.: sydänkuplia, 5.: pyörähdys ja kalaparvi),
// kuplapiippu tiskin kulmalla (kuplasuihku; 3.: iso kupla, jonka sisällä
// merihevonen, 5.: kuplarenkaat ja sävel) ja erakkorapu lokeroiden vieressä
// (piiloutuu kuoreen; 3.: kurkistaa helmi päässä, 5.: tanssii).
function pshSetupProps() {
  var L = psh.L, u = L.u, H = viewH;
  propsReset();
  propAdd({
    x: L.clock.x, y: L.clock.y, r: u * 0.07, hy: u * 0.06, color: '#ffc8dc', note: 1319, amp: 0.1, layer: 0, spin: 0, cuckoo: 0,
    update: function (p, dt) { if (p.spin > 0) p.spin -= dt; if (p.cuckoo > 0) p.cuckoo -= dt; },
    draw: function (c, p) { pshDrawClock(c, u, p); },
    poke: function (p) {
      var j;
      p.spin = 1;
      playNote(1568, 0.1, 0.3, 'sine', 0.15);
      playNote(2093, 0.25, 0.3, 'sine', 0.12);
      if (p.n % 3 === 0) {
        p.cuckoo = 1.8;
        playNote(784, 0.4, 0.15, 'triangle', 0.2);
        playNote(622, 0.6, 0.2, 'triangle', 0.2);
        playNote(784, 0.95, 0.15, 'triangle', 0.2);
        playNote(622, 1.15, 0.2, 'triangle', 0.2);
      }
      if (p.n % 5 === 0) {
        for (j = 0; j < 5; j++) {
          propDrop({
            x: p.x, y: p.y - u * 0.06, vx: u * (0.1 + Math.random() * 0.35), vy: -u * (0.2 + Math.random() * 0.3), ground: L.cy + u * 0.03, life: 2,
            k: j, draw: function (c, d) { pshBead(c, PSH_TYPES[d.k], 0, 0, L.br * 0.7); }
          });
        }
      }
    }
  });
  psh.fish = propAdd({
    x: u * 0.42, y: H * 0.36, r: u * 0.06, hy: 0, color: '#ffd24f', note: 988, amp: 0.2, layer: 0, puff: 0, hearts: 0, spinT: 0, dir: 1, ph: 0,
    update: function (p, dt) {
      var x0 = u * 0.3, x1 = Math.min(u * 0.75, L.spots[1].x - u * 0.2);
      if (p.puff > 0) p.puff -= dt;
      if (p.spinT > 0) p.spinT -= dt;
      p.ph += dt;
      if (p.puff <= 0) p.x += p.dir * u * 0.04 * dt;
      if (p.x > x1) p.dir = -1;
      if (p.x < x0) p.dir = 1;
      p.y = H * 0.36 + Math.sin(p.ph * 1.3) * u * 0.02;
      if (p.hearts > 0) {
        p.hearts -= dt;
        if (Math.random() < dt * 6) pshPuff(p.x + p.dir * u * 0.04, p.y, 1, '#ff8fb8', { heart: true, up: 0.07, life: 1.3 });
      }
    },
    draw: function (c, p) { pshDrawPuffer(c, u, p); },
    poke: function (p) {
      var j;
      p.puff = 1.6;
      playNote(300, 0, 0.1, 'sine', 0.2);
      playNote(600, 0.08, 0.15, 'sine', 0.18);
      playNote(400, 1.3, 0.15, 'sine', 0.12);
      if (p.n % 3 === 0) { p.hearts = 1.5; }
      if (p.n % 5 === 0) {
        p.spinT = 1;
        for (j = 0; j < 6; j++) pshBub(p.x, p.y, u * (0.006 + Math.random() * 0.01), H * (0.15 + Math.random() * 0.1));
        spawnSparkles(p.x, p.y, 12, '#ffe27a');
      }
    }
  });
  propAdd({
    x: L.pipe.x, y: L.pipe.y, r: u * 0.065, hy: u * 0.04, color: '#bff4ff', note: 784, amp: 0.12, layer: 1, horse: 0,
    update: function (p, dt) { if (p.horse > 0) p.horse -= dt; },
    draw: function (c, p) { pshDrawPipe(c, u, p); },
    poke: function (p) {
      var j, mel = [784, 988, 1175, 1568];
      for (j = 0; j < 8; j++) pshBub(p.x + u * 0.03 + (Math.random() - 0.5) * u * 0.02, p.y - u * 0.07 - j * u * 0.012, u * (0.005 + Math.random() * 0.008), H * (0.12 + Math.random() * 0.1));
      for (j = 0; j < 4; j++) playNote(1200 + Math.random() * 600, j * 0.06, 0.04, 'sine', 0.08);
      if (p.n % 3 === 0) {
        p.horse = 4;
        psh.bubs.push({ x: p.x + u * 0.03, y: p.y - u * 0.1, r: u * 0.04, vy: H * 0.08, ph: 0, t: 0, horse: true });
      }
      if (p.n % 5 === 0) {
        for (j = 0; j < mel.length; j++) playNote(mel[j], 0.2 + j * 0.12, 0.2, 'triangle', 0.18);
        for (j = 0; j < 3; j++) psh.bubs.push({ x: p.x + u * 0.03, y: p.y - u * 0.1 - j * u * 0.05, r: u * 0.025, vy: H * 0.14, ph: j, t: 0, ring: true });
      }
    }
  });
  propAdd({
    x: L.crab.x, y: L.crab.y, r: u * 0.06, hy: u * 0.035, color: '#ff8a6a', note: 659, amp: 0.1, layer: 1, hide: 0, peek: 0, dance: 0,
    update: function (p, dt) { if (p.hide > 0) p.hide -= dt; if (p.peek > 0) p.peek -= dt; if (p.dance > 0) p.dance -= dt; },
    draw: function (c, p) { pshDrawCrab(c, u, p); },
    poke: function (p) {
      var j;
      p.hide = 1.1;
      playNote(1800, 0, 0.03, 'square', 0.05);
      playNote(1500, 0.05, 0.03, 'square', 0.05);
      if (p.n % 3 === 0) { p.peek = 3; p.hide = 0; playNote(1047, 0.1, 0.12, 'triangle', 0.2); playNote(1319, 0.2, 0.15, 'triangle', 0.2); }
      if (p.n % 5 === 0) {
        p.dance = 2.4; p.hide = 0;
        for (j = 0; j < 8; j++) playNote(j % 2 ? 1700 : 1400, j * 0.25, 0.04, 'square', 0.05);
        spawnSparkles(p.x, p.y - u * 0.05, 10, '#ff9ec6');
      }
    }
  });
}
function pshDrawClock(c, u, p) {
  var s = u * 0.06, i, a, sp = p.spin > 0 ? (1 - p.spin) * Math.PI * 6 : 0, ck;
  artShadow(c, 0, -s * 0.15, s * 1.0, s * 0.3, 0.12);
  // Simpukkakehys
  c.beginPath();
  for (i = 0; i <= 12; i++) {
    a = Math.PI + i * Math.PI / 12;
    c.lineTo(Math.cos(a) * s * 1.15, -s * 0.9 + Math.sin(a) * s * 1.05 + (i % 2 ? s * 0.07 : 0));
  }
  c.lineTo(s * 0.6, -s * 0.2); c.lineTo(-s * 0.6, -s * 0.2);
  c.closePath();
  artFillPath(c, '#ffc8dc', -s * 2, -s * 0.2, s, { lineColor: '#b0607a' });
  artCircle(c, 0, -s * 0.95, s * 0.62, '#fffaf2', { lineColor: '#b0607a', flat: true });
  for (i = 0; i < 4; i++) { a = i * Math.PI / 2; drawDeepPearl(c, Math.cos(a) * s * 0.48, -s * 0.95 + Math.sin(a) * s * 0.48, s * 0.07, 0); }
  // Viisarit
  a = globalT * 0.3 + sp;
  artLimb(c, 0, -s * 0.95, Math.cos(a) * s * 0.3, -s * 0.95 + Math.sin(a) * s * 0.3, s * 0.07, '#8a5a8a', false);
  a = globalT * 2 + sp * 2;
  artLimb(c, 0, -s * 0.95, Math.cos(a) * s * 0.45, -s * 0.95 + Math.sin(a) * s * 0.45, s * 0.045, '#c06a90', false);
  artCircle(c, 0, -s * 0.95, s * 0.08, '#ffd24f', { lineColor: '#a07010', flat: true });
  if (p.cuckoo > 0) {
    ck = Math.min(1, p.cuckoo * 2, (1.8 - p.cuckoo) * 4);
    drawDeepFish(c, 0, -s * 2.0 - ck * s * 0.3, s * 0.35 * ck + 0.01, '#ff9a5a', Math.sin(p.cuckoo * 10) > 0 ? 1 : -1, globalT * 12);
  }
}
function pshDrawPuffer(c, u, p) {
  var s = u * 0.032 * (p.puff > 0 ? 1 + Math.min(1, p.puff * 3, (1.6 - p.puff) * 4) * 0.7 : 1), sp = p.puff > 0, i, a, rot = p.spinT > 0 ? p.spinT * Math.PI * 4 : 0;
  c.save();
  c.rotate(rot);
  c.scale(p.dir, 1);
  if (sp) {
    c.strokeStyle = '#a07010';
    c.lineWidth = Math.max(1, s * 0.08);
    for (i = 0; i < 12; i++) { a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.9, Math.sin(a) * s * 0.9); c.lineTo(Math.cos(a) * s * 1.25, Math.sin(a) * s * 1.25); c.stroke(); }
  }
  c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.4, -s * 0.45 + Math.sin(globalT * 10) * s * 0.1); c.lineTo(-s * 1.4, s * 0.45 + Math.sin(globalT * 10) * s * 0.1); c.closePath();
  artFillPath(c, '#ffb03a', -s * 0.5, s * 0.5, s * 0.4, { lineColor: '#a06010' });
  artCircle(c, 0, 0, s, '#ffd24f', { lineColor: '#a07010', hi: 0.4 });
  artBlob(c, 0, s * 0.35, s * 0.7, s * 0.45, '#fff2c0', { line: false, flat: true });
  artEye(c, s * 0.42, -s * 0.22, s * 0.24, 0.4, false);
  c.strokeStyle = '#a06010';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath();
  if (sp) c.arc(s * 0.82, s * 0.12, s * 0.1, 0, Math.PI * 2);
  else c.arc(s * 0.72, s * 0.05, s * 0.12, Math.PI * 0.2, Math.PI * 0.9);
  c.stroke();
  c.restore();
}
function pshDrawPipe(c, u, p) {
  var s = u * 0.05;
  artShadow(c, 0, 0, s * 1.1, s * 0.25, 0.18);
  // Kotilo kyljellään, suu ylöspäin
  artBlob(c, -s * 0.2, -s * 0.45, s * 0.85, s * 0.48, '#ffe0c8', { lineColor: '#b07a5a', rot: -0.3, hi: 0.35 });
  c.strokeStyle = 'rgba(176,122,90,0.6)';
  c.lineWidth = Math.max(1, s * 0.07);
  c.beginPath(); c.arc(-s * 0.45, -s * 0.4, s * 0.25, 0, Math.PI * 1.6); c.stroke();
  c.beginPath(); c.arc(-s * 0.45, -s * 0.4, s * 0.12, 0, Math.PI * 1.6); c.stroke();
  artBlob(c, s * 0.55, -s * 1.0, s * 0.3, s * 0.38, '#ffb8c8', { lineColor: '#b06a7a', rot: 0.4 });
  artBlob(c, s * 0.6, -s * 1.12, s * 0.16, s * 0.2, '#c86a8a', { line: false, flat: true, rot: 0.4 });
}
function pshDrawCrab(c, u, p) {
  var s = u * 0.04, hid = p.hide > 0, bob = p.dance > 0 ? Math.abs(Math.sin(p.dance * 8)) * s * 0.3 : 0, sw = p.dance > 0 ? Math.sin(p.dance * 8) * 0.3 : 0, i, a;
  artShadow(c, 0, 0, s * 1.2, s * 0.25, 0.18);
  c.save();
  c.translate(0, -bob);
  c.rotate(sw);
  if (!hid) {
    for (i = 0; i < 3; i++) { a = i - 1; artLimb(c, -s * 0.5 + a * s * 0.2, -s * 0.2, -s * 1.0 + a * s * 0.25, s * 0.0, s * 0.1, '#ff8a6a', '#a04a3a'); }
    artLimb(c, s * 0.3, -s * 0.4, s * 0.9, -s * 0.9 - (p.dance > 0 ? Math.sin(p.dance * 16) * s * 0.3 : 0), s * 0.12, '#ff8a6a', '#a04a3a');
    artCircle(c, s * 0.95, -s * 0.98 - (p.dance > 0 ? Math.sin(p.dance * 16) * s * 0.3 : 0), s * 0.2, '#ff8a6a', { lineColor: '#a04a3a' });
    artLimb(c, s * 0.1, -s * 0.6, s * 0.1, -s * 0.95, s * 0.05, '#a04a3a', false);
    artLimb(c, s * 0.35, -s * 0.6, s * 0.4, -s * 0.95, s * 0.05, '#a04a3a', false);
    artEye(c, s * 0.1, -s * 1.0, s * 0.12, 0.3, false);
    artEye(c, s * 0.4, -s * 1.0, s * 0.12, 0.3, false);
    if (p.peek > 0) drawDeepPearl(c, s * 0.25, -s * 1.25, s * 0.18, 1);
  }
  // Kuori
  artBlob(c, -s * 0.1, -s * 0.5, s * 0.75, s * 0.55, '#c8a0f0', { lineColor: '#6a4aa0', hi: 0.35 });
  c.strokeStyle = 'rgba(106,74,160,0.6)';
  c.lineWidth = Math.max(1, s * 0.07);
  c.beginPath(); c.arc(-s * 0.1, -s * 0.5, s * 0.35, 0.3, Math.PI * 1.8); c.stroke();
  c.beginPath(); c.arc(-s * 0.1, -s * 0.5, s * 0.15, 0.3, Math.PI * 1.8); c.stroke();
  c.restore();
}

// ---------- Tausta ----------
function renderPearlshopBg(b, w, h) {
  var L = psh.L, u, g, i, x, y, B;
  if (!L || L.W !== w || L.H !== h) { pshLayout(); L = psh.L; }
  u = L.u;
  // Vesi
  g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#a8e6f0');
  g.addColorStop(0.55, '#5ab8d8');
  g.addColorStop(1, '#2a7aa8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Takaseinä: vaaleaa korallikiveä kaarina
  b.beginPath();
  b.moveTo(0, h * 0.12);
  b.quadraticCurveTo(w * 0.25, h * 0.04, w * 0.5, h * 0.1);
  b.lineTo(w * 0.5, L.cy + u * 0.02);
  b.lineTo(0, L.cy + u * 0.02);
  b.closePath();
  artFillPath(b, '#f4d8c8', h * 0.05, L.cy, u * 0.2, { lineColor: '#c49a8a' });
  b.fillStyle = 'rgba(255,255,255,0.25)';
  for (i = 0; i < 26; i++) {
    x = ((i * 0.618) % 1) * w * 0.48;
    y = h * 0.15 + ((i * 0.377) % 1) * (L.cy - h * 0.18);
    b.beginPath(); b.arc(x, y, u * (0.006 + (i % 3) * 0.004), 0, Math.PI * 2); b.fill();
  }
  // Pyöreä ikkuna merelle (pallokala ui sen edessä)
  x = u * 0.52; y = h * 0.34;
  b.beginPath(); b.arc(x, y, u * 0.13, 0, Math.PI * 2);
  b.fillStyle = '#3a8ab8';
  b.fill();
  b.save();
  b.beginPath(); b.arc(x, y, u * 0.13, 0, Math.PI * 2); b.clip();
  for (i = 0; i < 4; i++) drawKelp(b, x - u * 0.1 + i * u * 0.065, y + u * 0.14, u * (0.12 + (i % 2) * 0.05), 0.5, i);
  b.fillStyle = 'rgba(200,240,255,0.25)';
  b.fillRect(x - u * 0.13, y - u * 0.13, u * 0.26, u * 0.07);
  b.restore();
  b.strokeStyle = '#c49a8a';
  b.lineWidth = u * 0.024;
  b.beginPath(); b.arc(x, y, u * 0.135, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#ffe8dc';
  b.lineWidth = u * 0.012;
  b.stroke();
  // Kyltti: iso simpukka ja helminauha
  x = w * 0.5 - u * 0.02; y = h * 0.11;
  artCircle(b, x, y + u * 0.02, u * 0.055, '#ffd0e0', { lineColor: '#b0607a' });
  for (i = 0; i < 7; i++) {
    pshPaintBead(b, i % 2 ? 'pearl' : 'pink', x - u * 0.09 + i * u * 0.03, y + u * 0.09 + Math.sin(i / 6 * Math.PI) * u * 0.03, u * 0.012);
  }
  pshPaintBead(b, 'shell', x, y + u * 0.02, u * 0.04);
  // Oviaukko oikealla: asiakkaat uivat sisään
  b.beginPath();
  b.moveTo(w * 0.5, h * 0.1);
  b.quadraticCurveTo(w * 0.75, h * 0.0, w, h * 0.08);
  b.lineTo(w, L.cy + u * 0.02);
  b.lineTo(w * 0.5, L.cy + u * 0.02);
  b.closePath();
  b.fillStyle = 'rgba(30,90,140,0.22)';
  b.fill();
  for (i = 0; i < 5; i++) drawKelp(b, w * 0.56 + i * (w * 0.44 / 5), L.cy + u * 0.02, u * (0.16 + (i % 3) * 0.05), 0.65, i * 1.3);
  for (i = 0; i < 4; i++) drawCoral(b, w * 0.6 + i * w * 0.11, L.cy + u * 0.02, u * 0.05, ['#ff9ab0', '#ffb07a', '#c8a0ff', '#ff8aa0'][i], 0.6);
  // Reunalevät
  drawKelp(b, u * 0.03, L.cy + u * 0.02, u * 0.3, 0, 0.4);
  drawKelp(b, w - u * 0.03, L.cy + u * 0.02, u * 0.26, 0, -0.4);
  // Tiski
  y = L.cy;
  artRoundRect(b, -u * 0.02, y, w + u * 0.04, h - y + u * 0.02, u * 0.02, '#f6d2bc', { lineColor: '#a0705a' });
  artRoundRect(b, -u * 0.02, y - u * 0.012, w + u * 0.04, u * 0.03, u * 0.012, '#ffe8da', { lineColor: '#a0705a' });
  b.fillStyle = 'rgba(160,112,90,0.12)';
  for (i = 0; i < 12; i++) {
    x = ((i * 0.618 + 0.1) % 1) * w;
    y = L.cy + u * 0.06 + ((i * 0.41) % 1) * (h - L.cy - u * 0.08);
    drawDeepStarfish(b, x, y, u * 0.012, '#f0c4ac', i);
  }
  // Samettilauta
  B = L.board;
  artShadow(b, (B.x0 + B.x1) / 2, B.y1 + u * 0.01, (B.x1 - B.x0) * 0.52, u * 0.03, 0.2);
  artRoundRect(b, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, u * 0.04, '#6a5aa8', { lineColor: '#d8a83a' });
  artRoundRect(b, B.x0 + u * 0.012, B.y0 + u * 0.012, B.x1 - B.x0 - u * 0.024, B.y1 - B.y0 - u * 0.024, u * 0.03, '#5a4a98', { line: false, flat: true });
  // Kassasimpukan paikka ja lokeroiden alusta
  b.fillStyle = 'rgba(255,255,255,0.18)';
  for (i = 0; i < 5; i++) {
    b.beginPath();
    if (b.ellipse) b.ellipse(L.trays[i].x, L.trayY + u * 0.02, L.trayR * 1.2, L.trayR * 0.5, 0, 0, Math.PI * 2);
    else b.arc(L.trays[i].x, L.trayY, L.trayR, 0, Math.PI * 2);
    b.fill();
  }
}

// ---------- Kilpikonnakauppias (vaiheiden välissä) ----------
function pshDrawCourier(c) {
  var C = psh.cour, L = psh.L, u = L.u, k, x, y;
  if (!C) return;
  k = easeOutCubic(Math.min(1, C.t / 1.5));
  x = -u * 0.3 + (u * 0.62) * k;
  y = viewH * 0.4 + Math.sin(C.t * 2) * u * 0.01;
  if (C.leave >= 0) {
    k = Math.min(1, (C.t - C.leave) / 1.8);
    x -= k * u * 0.8;
    y -= k * u * 0.2;
  }
  pshDrawTurtle(c, x, y, u * 0.12, { t: C.t, mood: 'happy', wave: C.t < 2.5 });
  // Laukku täynnä helmiä
  artRoundRect(c, x - u * 0.05, y + u * 0.0, u * 0.1, u * 0.065, u * 0.015, '#c8884a', { lineColor: '#6a3a14' });
  pshBead(c, 'pink', x - u * 0.025, y - u * 0.002, L.br * 0.6);
  pshBead(c, 'star', x + u * 0.005, y - u * 0.008, L.br * 0.6);
  pshBead(c, 'aqua', x + u * 0.03, y - u * 0.002, L.br * 0.6);
}

// ---------- Vihjekäsi ----------
function pshDrawHint(c) {
  var st = psh.hintStep, per = 2.2, k, p, a, m, s = viewH * 0.07, L = psh.L, u = L.u, press;
  if (!st || psh.hintT < 0.4) return;
  k = ((psh.hintT - 0.4) % per) / per;
  a = Math.min(1, (psh.hintT - 0.4) * 3);
  if (st.kind === 'peek') {
    press = k < 0.3 ? k / 0.3 : (k < 0.5 ? 1 : 0);
    p = { x: st.from.x, y: st.from.y };
    c.globalAlpha = 0.9 * a;
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = Math.max(2, viewH * 0.005);
    if (k > 0.3 && k < 0.7) { c.beginPath(); c.arc(p.x, p.y, viewH * (0.02 + (k - 0.3) * 0.2), 0, Math.PI * 2); c.stroke(); }
    drawHand(c, p.x + s * 0.1, p.y - s * 0.4 - (1 - press) * s * 0.3, s);
    c.globalAlpha = 1;
    return;
  }
  if (k < 0.2) { p = { x: st.from.x, y: st.from.y }; press = k / 0.2; }
  else if (k < 0.75) {
    m = easeInOutSine((k - 0.2) / 0.55);
    p = { x: st.from.x + (st.to.x - st.from.x) * m, y: st.from.y + (st.to.y - st.from.y) * m - Math.sin(m * Math.PI) * viewH * 0.05 };
    press = 1;
  } else { p = { x: st.to.x, y: st.to.y }; press = Math.max(0, 1 - (k - 0.75) / 0.12); }
  if (press > 0.3) {
    c.globalAlpha = 0.75 * a * press;
    if (st.kind === 'serve' || st.kind === 'clear') {
      m = pshNeckPts(psh.str.length, p.x, p.y, Math.min(psh.str.length, 8) * L.sp * 0.5);
      for (k = 0; k < m.length; k++) pshBead(c, psh.str[k].type, m[k].x, m[k].y, L.br * 0.85);
    } else pshBead(c, st.type, p.x, p.y, L.br * 1.1);
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (k < 0.2 && st.kind !== 'serve' && st.kind !== 'clear') { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - press) * s * -0.25, s);
  c.globalAlpha = 1;
}

// ---------- HUD ja juhla ----------
function pshHudSlot(i) {
  var gap = viewH * 0.05, x = hudX() + viewH * 0.045 + i * gap + (i >= PSH_PHASE_AT[1] ? viewH * 0.014 : 0) + (i >= PSH_PHASE_AT[2] ? viewH * 0.014 : 0);
  return { x: x, y: viewH * 0.063 };
}
function pshDrawGoldNeck(c, x, y, s, gold) {
  var i, a;
  if (gold) artGlow(c, x, y, s * 1.4, '#ffe27a', 0.45);
  c.strokeStyle = gold ? '#a07010' : '#9a8aa0';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.arc(x, y - s * 0.3, s * 0.7, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
  for (i = 0; i < 7; i++) {
    a = Math.PI * (0.12 + i * 0.76 / 6);
    artCircle(c, x + Math.cos(a) * s * 0.7, y - s * 0.3 + Math.sin(a) * s * 0.7, s * (i === 3 ? 0.22 : 0.14), i === 3 ? '#fdf3ff' : (gold ? '#ffd24f' : '#d8c8b0'), { lineColor: gold ? '#a07010' : '#8a7a70', flat: true });
  }
}
function pshDrawHud(c) {
  var i, sl, n = psh.orders.length, last = pshHudSlot(n - 1), w, cur, gold = pshGolden(), pop, j, g;
  w = last.x + viewH * 0.1 - hudX();
  drawHudPanel(c, hudX(), viewH * 0.018, w, viewH * 0.09, viewH * 0.025);
  for (i = 0; i < n; i++) {
    sl = pshHudSlot(i);
    cur = false;
    for (j = 0; j < psh.custs.length; j++) { g = psh.custs[j]; if (g.o.idx === i && (g.state === 'wait' || g.state === 'enter')) cur = true; }
    if (psh.stars[i]) {
      pop = psh.starPop > 0 ? 1 + psh.starPop * 0.5 : 1;
      if (psh.stars[i] === 2) drawStar(c, sl.x, sl.y, viewH * 0.02 * pop, 0, 0.3);
      else { c.globalAlpha = 0.85; drawStar(c, sl.x, sl.y, viewH * 0.018 * pop, 0, 0); c.globalAlpha = 1; }
    } else {
      artCircle(c, sl.x, sl.y, viewH * (cur ? 0.018 + Math.sin(globalT * 4) * 0.002 : 0.014), cur ? '#fff6fa' : 'rgba(255,255,255,0.5)', { lineColor: cur ? '#d88ab0' : '#c8b0c8', flat: true });
      if (cur) drawDeepPearl(c, sl.x, sl.y, viewH * 0.009, 0);
      if (i === n - 1) {
        // Kuningattaren paikka: pieni kruunu
        c.fillStyle = '#ffd24f';
        c.beginPath();
        c.moveTo(sl.x - viewH * 0.01, sl.y - viewH * 0.012); c.lineTo(sl.x - viewH * 0.012, sl.y - viewH * 0.026); c.lineTo(sl.x - viewH * 0.004, sl.y - viewH * 0.018);
        c.lineTo(sl.x, sl.y - viewH * 0.03); c.lineTo(sl.x + viewH * 0.004, sl.y - viewH * 0.018); c.lineTo(sl.x + viewH * 0.012, sl.y - viewH * 0.026); c.lineTo(sl.x + viewH * 0.01, sl.y - viewH * 0.012);
        c.closePath(); c.fill();
      }
    }
  }
  c.globalAlpha = gold ? 1 : 0.45;
  c.save();
  c.translate(last.x + viewH * 0.058, viewH * 0.06);
  c.rotate(psh.goldLostT > 0 ? Math.sin(psh.goldLostT * 30) * 0.2 : 0);
  pshDrawGoldNeck(c, 0, 0, viewH * 0.032, gold);
  c.restore();
  c.globalAlpha = 1;
}
function pshDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, psh.celT / 0.8)), gold = pshGolden(), x = viewW / 2, y = H * 0.55, i, a, q = psh.orders[psh.orders.length - 1].seq, n = q.length;
  if (k <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  artGlow(c, 0, 0, H * 0.26, gold ? '#ffe27a' : '#ffd0e0', 0.6);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.24, Math.sin(globalT + i * Math.PI / 4) * H * 0.17, H * 0.014, globalT * 2, 0.4);
  // Kuningattaren helminauha isona
  c.strokeStyle = '#ffd8ec';
  c.lineWidth = Math.max(2, H * 0.006);
  c.beginPath(); c.arc(0, -H * 0.06, H * 0.14, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
  for (i = 0; i < n; i++) {
    a = Math.PI * (0.08 + 0.84 * i / (n - 1));
    pshBead(c, q[i], Math.cos(a) * H * 0.14, -H * 0.06 + Math.sin(a) * H * 0.14, H * 0.03);
  }
  // Kruunu
  c.beginPath();
  c.moveTo(-H * 0.07, -H * 0.1); c.lineTo(-H * 0.08, -H * 0.19); c.lineTo(-H * 0.035, -H * 0.14); c.lineTo(0, -H * 0.21);
  c.lineTo(H * 0.035, -H * 0.14); c.lineTo(H * 0.08, -H * 0.19); c.lineTo(H * 0.07, -H * 0.1); c.closePath();
  artFillPath(c, '#ffd24f', -H * 0.21, -H * 0.1, H * 0.05, { lineColor: '#a07010' });
  drawDeepPearl(c, 0, -H * 0.135, H * 0.014, 1);
  if (gold) pshDrawGoldNeck(c, 0, H * 0.16, H * 0.06, true);
  c.restore();
}

// ---------- Piirto: kokonaisuus ----------
function drawPearlshop() {
  var c = ctx, L = psh.L, i, f, k, x, y, H = viewH, u, b;
  if (!L || !beginPlayWorld()) return;
  u = L.u;
  // Taustakuplat
  for (i = 0; i < psh.bubs.length; i++) {
    b = psh.bubs[i];
    if (b.horse) {
      drawDeepBubble(c, b.x, b.y, b.r, 1);
      pshDrawSeahorse(c, b.x, b.y, b.r * 0.7);
    } else if (b.ring) {
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = Math.max(1.5, b.r * 0.2);
      c.beginPath();
      if (c.ellipse) c.ellipse(b.x, b.y, b.r * (1 + b.t * 0.4), b.r * 0.35 * (1 + b.t * 0.4), 0, 0, Math.PI * 2);
      else c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      c.stroke();
    } else drawDeepBubble(c, b.x, b.y, b.r, 0.8);
  }
  propsDraw(c, 0);
  pshDrawCourier(c);
  // Asiakkaat tiskin takana (häntä piiloon tiskin taakse)
  c.save();
  c.beginPath(); c.rect(0, 0, L.W, L.cy + u * 0.004); c.clip();
  for (i = 0; i < psh.custs.length; i++) pshDrawCust(c, psh.custs[i]);
  c.restore();
  pshDrawString(c);
  if (psh.trayCv) {
    if (psh.trayPop > 0) {
      k = 1 + Math.sin(psh.trayPop / 0.6 * Math.PI) * 0.03;
      c.save(); c.translate(L.cx, L.trayY); c.scale(k, k); c.translate(-L.cx, -L.trayY);
      c.drawImage(psh.trayCv, 0, 0);
      c.restore();
    } else c.drawImage(psh.trayCv, 0, 0);
  }
  propsDraw(c, 1);
  // Lentävät
  for (i = 0; i < psh.flies.length; i++) {
    f = psh.flies[i];
    if (f.t < (f.delay || 0)) continue;
    k = easeOutCubic((f.t - (f.delay || 0)) / f.dur);
    x = f.x0 + (f.x1 - f.x0) * k;
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * H * 0.05;
    if (f.kind === 'bead') pshBead(c, f.type, x, y, L.br);
    else drawStar(c, x, y, H * 0.022 * (1 + Math.sin(k * Math.PI) * 0.6), k * 6, f.gold ? 0.8 : 0);
  }
  for (i = 0; i < psh.custs.length; i++) if (psh.custs[i].state === 'wait') pshDrawBubble(c, psh.custs[i]);
  if (psh.drag) pshDrawDragged(c, psh.drag);
  pshDrawPuffs(c);
  pshDrawHint(c);
  if (psh.dayK > 1) { c.fillStyle = 'rgba(40,30,120,' + (0.1 * (psh.dayK - 1)) + ')'; c.fillRect(0, 0, viewW, viewH); }
  drawParticlesLayer(c);
  if (celebrating) pshDrawTrophy(c);
  endPlayWorld();
  pshDrawHud(c);
  drawTaskOverlay(c);
}
function pshDrawSeahorse(c, x, y, s) {
  artBlob(c, x, y, s * 0.3, s * 0.5, '#ffb03a', { lineColor: '#a06010' });
  artCircle(c, x + s * 0.1, y - s * 0.5, s * 0.25, '#ffb03a', { lineColor: '#a06010' });
  artLimb(c, x + s * 0.25, y - s * 0.5, x + s * 0.5, y - s * 0.45, s * 0.1, '#ffb03a', '#a06010');
  c.strokeStyle = '#a06010';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.arc(x - s * 0.05, y + s * 0.55, s * 0.15, -Math.PI / 2, Math.PI); c.stroke();
  artEye(c, x + s * 0.15, y - s * 0.55, s * 0.08, 0.3, false);
}
function pshDrawPuffs(c) {
  var i, p, a, r;
  for (i = 0; i < psh.puffs.length; i++) {
    p = psh.puffs[i];
    a = 1 - p.t / p.life;
    c.globalAlpha = Math.max(0, a * 0.8);
    r = p.r * (1 + p.t * 0.5);
    if (p.heart) { pshHeartPath(c, p.x, p.y, r * 1.2); c.fillStyle = p.col; c.fill(); }
    else if (p.note) pshText(c, '♪', p.x, p.y, r * 2.4, p.col, '#ffffff');
    else { c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill(); }
  }
  c.globalAlpha = 1;
}

// ---------- Kartan kuvake ----------
// Helminauha kaarella ja simpukkakoriste keskellä
HUB_ICONS.pearlshop = function (c, x, y, s) {
  var r = s * 0.3, i, a, cols = ['#ff7eb6', '#fbf6ff', '#36c6dc', '#fbf6ff', '#36c6dc', '#fbf6ff', '#ff7eb6'];
  c.strokeStyle = '#8a5a8a';
  c.lineWidth = Math.max(1.5, s * 0.025);
  c.beginPath(); c.arc(x, y - r * 0.55, r, Math.PI * 0.08, Math.PI * 0.92); c.stroke();
  for (i = 0; i < 7; i++) {
    if (i === 3) continue;
    a = Math.PI * (0.12 + i * 0.76 / 6);
    artCircle(c, x + Math.cos(a) * r, y - r * 0.55 + Math.sin(a) * r, r * 0.17, cols[i], { lineColor: i % 2 ? '#a890c8' : artShade(cols[i], -0.45), hi: 0.5 });
  }
  // Simpukka
  c.beginPath();
  c.moveTo(x, y + r * 0.75);
  for (i = 0; i <= 10; i++) {
    a = Math.PI * (1.08 + i * 0.084);
    c.lineTo(x + Math.cos(a) * r * 0.36, y + r * 0.5 + Math.sin(a) * r * 0.4 + (i % 2 ? r * 0.02 : 0));
  }
  c.closePath();
  artFillPath(c, '#ffb08a', y + r * 0.1, y + r * 0.75, r * 0.3, { lineColor: '#c0603a' });
};
