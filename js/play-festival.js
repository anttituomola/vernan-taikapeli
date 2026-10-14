'use strict';

// Lyhtyjuhla (Kaukamaa, Pupula): rauhallinen ja helppo iltakenttä ilman
// sydämiä ja aikarajaa. Pupulan katu hämärässä, pupujen talot (korvakatot)
// rivissä. Jokaisen talon kattoikkunassa on tilaus: värillisiä pisteitä,
// esim. kolme pinkkiä = talo haluaa kolme pinkkiä lyhtyä.
//   - Lyhtykärryssä alhaalla on paperilyhtyjä eri väreissä (loputtomasti).
//     Lyhty raahataan kärrystä talolle (mihin tahansa talon kohdalle), ja se
//     lentää talon lyhtynauhaan, syttyy ja kattoikkunan piste sammuu.
//   - Väärä väri tai jo täysi väri: lyhty leijuu hiljaa takaisin kärryyn ja
//     talon ikkuna heilahtaa. Ei rangaistusta.
//   - Valmis talo: ikkunat syttyvät lämpimiksi, ovi aukeaa ja pupuperhe tulee
//     ovelle vilkuttamaan.
// Kolme katua (FEST_ROUNDS): 3 taloa × 1–3 lyhtyä; 4 taloa × 2–4; 3 taloa,
// kaksi väriä taloa kohti, yhteensä 3–5. Lopuksi ilotulitus kaupungin yllä:
// taivaan napautus ampuu lisää raketteja (myös loppujuhlan aikana).
// Haamukäsi näyttää ensimmäisen raahauksen heti ja seuraavan
// FEST_HINT_IDLE sekunnin toimettomuuden jälkeen. Tökättävät: kuu (3.:
// tähdenlento ja pupunkorvat), katulyhty (3.: sateenkaarivalo), lyhtykoju
// (taivaslyhty nousee, 3.: kolme) ja kissa kojun katolla (3.: hyppy ja sydän).

var FEST_COLS = { pink: '#ff7bac', yellow: '#ffd24f', blue: '#5fb8ff', green: '#6fd66f', purple: '#b678ff' };
var FEST_ORDER = ['pink', 'yellow', 'blue', 'green', 'purple'];
var FEST_ROUNDS = [
  { houses: 3, cols: 3, min: 1, max: 3, two: false },
  { houses: 4, cols: 4, min: 2, max: 4, two: false },
  { houses: 3, cols: 5, min: 3, max: 5, two: true }
];
var FEST_WALLS = ['#ffd0e0', '#d8f0c8', '#fff0a8', '#d8e0ff', '#ffd8b0', '#e8d4ff'];
var FEST_ROOFS = ['#e8705a', '#5fa8d8', '#c86aa8', '#e89a3a', '#6fb87a', '#9a7ad8'];
var FEST_HINT_IDLE = 7;   // vihjekäsi toimettomuuden jälkeen (s)
var FEST_SHOW_T = 8;      // ilotulitus ennen loppujuhlaa (s)
var FEST_HANG_T = 0.35;   // lyhdyn lento nauhaan (s)

var fest = {
  L: null, round: 0, houses: [], drag: null, flies: [], rockets: [], bursts: [], skyLanterns: [],
  flow: 'play', flowT: 0, idleT: 0, placed: 0, hintT: 0, slideX: 0, cartPop: 0, skyTaps: 0,
  autoT: 0, celT: 0, done: [], shoot: null, twinkle: []
};

// ---------- Mitat ----------
function festLayout() {
  var W = viewW, H = viewH;
  fest.L = {
    W: W, H: H,
    baseY: H * 0.66,           // talojen alareuna (jalkakäytävä)
    bodyH: H * 0.2,
    cartX: W / 2, cartY: H * 0.845, slotGap: H * 0.13
  };
}
function festHouseGeo(i) {
  var L = fest.L, H = L.H, n = fest.houses.length, m = H * 0.05;
  var slotW = (L.W - 2 * m) / n, hw = Math.min(H * 0.3, slotW * 0.82);
  var cx = m + slotW * (i + 0.5) + fest.slideX;
  var top = L.baseY - L.bodyH;
  return { cx: cx, hw: hw, slotW: slotW, top: top, base: L.baseY, domeRy: hw * 0.42, domeTop: top - hw * 0.42 };
}
function festHookPos(h, g, k) {
  var N = festTotal(h), u = (k + 0.5) / N, H = fest.L.H;
  var sy = g.top + H * 0.014;
  return { x: g.cx - g.hw * 0.45 + g.hw * 0.9 * u, y: sy + H * 0.03 * 4 * u * (1 - u) };
}
function festLanternR(h, g) {
  return Math.min(fest.L.H * 0.024, g.hw * 0.9 / festTotal(h) * 0.42);
}
function festSlotPos(j) {
  var L = fest.L, k = festCartCols().length;
  return { x: L.cartX + (j - (k - 1) / 2) * L.slotGap, y: L.cartY };
}
function festCartCols() {
  return FEST_ORDER.slice(0, FEST_ROUNDS[Math.min(fest.round, FEST_ROUNDS.length - 1)].cols);
}
function festTotal(h) {
  var i, t = 0;
  for (i = 0; i < h.need.length; i++) t += h.need[i].n;
  return t;
}

// ---------- Kadut ----------
function festRand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function festMakeStreet(r) {
  var R = FEST_ROUNDS[r], cols = FEST_ORDER.slice(0, R.cols), out = [], i, c1, c2, t, a, prev = null, wi, walls = FEST_WALLS.slice(), w;
  for (i = 0; i < R.houses; i++) {
    do { c1 = cols[festRand(0, cols.length - 1)]; } while (c1 === prev);
    prev = c1;
    wi = festRand(0, walls.length - 1);
    w = walls.splice(wi, 1)[0];
    var h = {
      wall: w, roof: FEST_ROOFS[FEST_WALLS.indexOf(w)], need: [], hung: [], done: false, doneT: 0,
      lightK: 0, doorK: 0, famK: 0, shake: 0, hop: 0, kids: festRand(1, 2), pulse: 0
    };
    if (!R.two) {
      // Ensimmäisellä kadulla ensimmäinen talo pyytää vain yhden: nopea onnistuminen
      h.need.push({ col: c1, n: r === 0 && i === 0 ? 1 : festRand(R.min, R.max), got: 0 });
    } else {
      do { c2 = cols[festRand(0, cols.length - 1)]; } while (c2 === c1);
      t = festRand(R.min, R.max);
      a = festRand(1, t - 1);
      h.need.push({ col: c1, n: a, got: 0 });
      h.need.push({ col: c2, n: t - a, got: 0 });
    }
    out.push(h);
  }
  return out;
}

// ---------- Alustus ----------
function initFestival() {
  var i;
  tasks = [];
  camX = 0;
  fest.round = 0;
  fest.houses = festMakeStreet(0);
  fest.drag = null;
  fest.flies = [];
  fest.rockets = [];
  fest.bursts = [];
  fest.skyLanterns = [];
  fest.flow = 'in';
  fest.flowT = 0;
  fest.slideX = 0;
  fest.idleT = 0;
  fest.placed = 0;
  fest.hintT = 0;
  fest.cartPop = 0;
  fest.skyTaps = 0;
  fest.autoT = 0;
  fest.celT = 0;
  fest.shoot = null;
  fest.done = [];
  for (i = 0; i < FEST_ROUNDS.length; i++) fest.done.push([]);
  fest.twinkle = [];
  for (i = 0; i < 26; i++) fest.twinkle.push({ fx: Math.random(), fy: Math.random() * 0.42, ph: Math.random() * 6, r: 0.004 + Math.random() * 0.005 });
  festLayout();
  fest.slideX = viewW * 1.1;
  festSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.25);
  playNote(659, 0.14, 0.2, 'triangle', 0.25);
  playNote(784, 0.28, 0.35, 'triangle', 0.25);
}
function respawnFestival() {}
function resizeFestival() {
  var i, j, h;
  camX = 0;
  festLayout();
  festSetupProps();
  // Pikselikoordinaatteihin sidotut lennot valmiiksi; raahaus palaa kärryyn
  for (i = 0; i < fest.houses.length; i++) {
    h = fest.houses[i];
    for (j = 0; j < h.hung.length; j++) h.hung[j].k = 1;
  }
  fest.flies = [];
  fest.drag = null;
  fest.rockets = [];
  fest.bursts = [];
  fest.skyLanterns = [];
  if (fest.flow === 'in' || fest.flow === 'out') fest.slideX = fest.flow === 'in' ? viewW * 1.1 * (1 - easeOutCubic(fest.flowT / 1.1)) : -viewW * 1.1 * easeInOutSine(fest.flowT / 1.1);
}

// ---------- Syöte ----------
function handleFestivalTap(px, py) {
  var i, s, cols, g, h;
  if (!running || puzzleBusy()) return;
  fest.idleT = 0;
  if (fest.drag) return;
  // Kärryn lyhdyt
  if (fest.flow === 'play') {
    cols = festCartCols();
    for (i = 0; i < cols.length; i++) {
      s = festSlotPos(i);
      if (Math.hypot(px - s.x, py - s.y) < fest.L.H * 0.068) { festStartDrag(cols[i], s.x, s.y); return; }
    }
  }
  if (propsTap(px, py)) return;
  // Talo: valmiin talon pupuperhe hypähtää ja vilkuttaa, keskeneräinen heilahtaa
  for (i = 0; i < fest.houses.length; i++) {
    h = fest.houses[i];
    g = festHouseGeo(i);
    if (Math.abs(px - g.cx) < g.hw * 0.55 && py > g.domeTop - g.hw * 0.25 && py < g.base + fest.L.H * 0.04) {
      if (h.done && h.famK > 0.9) { h.hop = 0.5; soundBunny(); spawnSparkles(g.cx, g.base - fest.L.H * 0.08, 6, '#ff9ec6'); }
      else if (!h.done) { h.pulse = 0.6; playNote(660, 0, 0.1, 'sine', 0.15); }
      return;
    }
  }
  // Taivas: ilotulituksen aikana raketti napautuskohtaan
  if (fest.flow === 'show' || fest.flow === 'end') {
    if (py < fest.L.H * 0.62) { fest.skyTaps++; festLaunch(px, Math.max(fest.L.H * 0.1, Math.min(py, fest.L.H * 0.5))); }
  }
}
function festStartDrag(col, x, y) {
  fest.drag = { col: col, x: x, y: y };
  playNote(880, 0, 0.07, 'sine', 0.18);
}

// ---------- Raahaus ja pudotus ----------
function festUpdateDrag(dt) {
  var d = fest.drag, k;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 20);
    d.x += (lastPX - d.x) * k;
    d.y += (lastPY - fest.L.H * 0.035 - d.y) * k;
    return;
  }
  fest.drag = null;
  festDrop(d, lastPX, lastPY);
}
function festDrop(d, px, py) {
  var i, g, h, best = -1, bd = 1e9, j, nd;
  if (py < fest.L.H * 0.8) {
    for (i = 0; i < fest.houses.length; i++) {
      g = festHouseGeo(i);
      if (Math.abs(px - g.cx) < g.slotW * 0.5 && Math.abs(px - g.cx) < bd) { bd = Math.abs(px - g.cx); best = i; }
    }
  }
  if (best < 0) { festFlyBack(d, false); return; }
  h = fest.houses[best];
  g = festHouseGeo(best);
  if (h.done) { festFlyBack(d, false); h.hop = 0.35; return; }
  nd = null;
  for (j = 0; j < h.need.length; j++) if (h.need[j].col === d.col && h.need[j].got < h.need[j].n) nd = h.need[j];
  if (!nd) {
    // Väärä väri tai väri jo täynnä: lyhty leijuu takaisin, ikkuna heilahtaa
    h.shake = 0.5;
    h.pulse = 0.8;
    festFlyBack(d, true);
    playNote(392, 0, 0.16, 'sine', 0.13);
    playNote(330, 0.13, 0.22, 'sine', 0.12);
    return;
  }
  nd.got++;
  h.hung.push({ col: d.col, k: 0, x0: d.x, y0: d.y, ph: Math.random() * 6, pop: 0 });
  fest.placed++;
  var hp = festHookPos(h, g, h.hung.length - 1);
  var notes = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  playNote(notes[Math.min(notes.length - 1, h.hung.length - 1 + (festTotal(h) > 3 ? 0 : 2))], 0.25, 0.3, 'triangle', 0.25);
  playNote(notes[Math.min(notes.length - 1, h.hung.length - 1 + (festTotal(h) > 3 ? 0 : 2))] * 2, 0.3, 0.25, 'sine', 0.12);
  // Kattoikkunan piste sammuu
  var dp = festDotPos(h, g, h.need.indexOf(nd), nd.got - 1);
  artPop(dp.x, dp.y, fest.L.H * 0.02, FEST_COLS[d.col], 'ring');
  spawnSparkles(hp.x, hp.y + fest.L.H * 0.04, 6, FEST_COLS[d.col]);
  if (festHouseFull(h)) {
    h.done = true;
    h.doneT = 0;
    fest.done[fest.round].push(h.need[0].col);
  }
}
function festHouseFull(h) {
  var j;
  for (j = 0; j < h.need.length; j++) if (h.need[j].got < h.need[j].n) return false;
  return true;
}
function festFlyBack(d, slow) {
  var j = festCartCols().indexOf(d.col), s = festSlotPos(Math.max(0, j));
  fest.flies.push({ col: d.col, x0: d.x, y0: d.y, x1: s.x, y1: s.y, t: 0, dur: slow ? 1.1 : 0.5, slow: slow });
}

// ---------- Päivitys ----------
function updateFestival(dt) {
  var i, j, h, f, g;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  festUpdateFx(dt);
  if (celebrating) { fest.celT += dt; festAutoFireworks(dt, 1.1); return; }
  if (puzzleBusy()) return;
  if (!holding) fest.idleT += dt;
  festUpdateDrag(dt);
  for (i = 0; i < fest.houses.length; i++) {
    h = fest.houses[i];
    for (j = 0; j < h.hung.length; j++) {
      f = h.hung[j];
      if (f.k < 1) { f.k = Math.min(1, f.k + dt / FEST_HANG_T); if (f.k >= 1) f.pop = 0.3; }
      if (f.pop > 0) f.pop -= dt;
    }
    if (h.shake > 0) h.shake -= dt;
    if (h.pulse > 0) h.pulse -= dt;
    if (h.hop > 0) h.hop -= dt;
    if (h.done) {
      h.doneT += dt;
      if (h.doneT > 0.35) h.lightK = Math.min(1, h.lightK + dt * 3);
      if (h.doneT > 0.6) h.doorK = Math.min(1, h.doorK + dt * 3);
      if (h.doneT > 0.8 && h.famK === 0) {
        g = festHouseGeo(i);
        soundBunny();
        playNote(523, 0, 0.3, 'triangle', 0.2); playNote(659, 0.1, 0.3, 'triangle', 0.2);
        playNote(784, 0.2, 0.3, 'triangle', 0.2); playNote(1047, 0.3, 0.45, 'triangle', 0.22);
        spawnSparkles(g.cx, g.base - fest.L.H * 0.06, 12, '#ffe27a');
      }
      if (h.doneT > 0.8) h.famK = Math.min(1, h.famK + dt * 2.5);
    }
  }
  festUpdateFlow(dt);
  // Vihje: ensimmäinen raahaus heti, myöhemmin toimettomuuden jälkeen
  if (fest.flow === 'play' && !fest.drag && !holding && (fest.placed === 0 || fest.idleT > FEST_HINT_IDLE)) fest.hintT += dt;
  else fest.hintT = 0;
}
function festUpdateFx(dt) {
  var i, f, r, b, sl;
  for (i = fest.flies.length - 1; i >= 0; i--) {
    f = fest.flies[i];
    f.t += dt;
    if (f.t >= f.dur) { fest.flies.splice(i, 1); playNote(660, 0, 0.06, 'sine', 0.08); }
  }
  if (fest.cartPop > 0) fest.cartPop -= dt;
  // Raketit nousevat ja puhkeavat
  for (i = fest.rockets.length - 1; i >= 0; i--) {
    r = fest.rockets[i];
    r.t += dt;
    if (r.t >= r.dur) {
      fest.rockets.splice(i, 1);
      festBurst(r.tx, r.ty, r.col, r.col2, r.shape);
    }
  }
  for (i = fest.bursts.length - 1; i >= 0; i--) {
    b = fest.bursts[i];
    b.t += dt;
    if (b.t > 1.8) fest.bursts.splice(i, 1);
  }
  for (i = fest.skyLanterns.length - 1; i >= 0; i--) {
    sl = fest.skyLanterns[i];
    sl.t += dt;
    sl.y -= viewH * 0.09 * dt;
    sl.x += Math.sin(sl.t * 1.3 + sl.ph) * viewH * 0.02 * dt;
    if (sl.y < -viewH * 0.1) fest.skyLanterns.splice(i, 1);
  }
  if (fest.shoot) {
    fest.shoot.t += dt;
    if (fest.shoot.t > 1.2) fest.shoot = null;
  }
}
function festUpdateFlow(dt) {
  var i, all = true, D = 1.1;
  fest.flowT += dt;
  if (fest.flow === 'in') {
    fest.slideX = viewW * 1.1 * (1 - easeOutCubic(fest.flowT / D));
    if (fest.flowT >= D) { fest.slideX = 0; fest.flow = 'play'; fest.flowT = 0; fest.idleT = 0; }
    return;
  }
  if (fest.flow === 'play') {
    for (i = 0; i < fest.houses.length; i++) if (!fest.houses[i].done || fest.houses[i].famK < 1) all = false;
    if (all && !fest.drag && fest.flies.length === 0) { fest.flow = 'wave'; fest.flowT = 0; festChime(); }
    return;
  }
  if (fest.flow === 'wave') {
    // Koko katu vilkuttaa hetken
    if (fest.flowT < 2.2) return;
    fest.flowT = 0;
    if (fest.round >= FEST_ROUNDS.length - 1) {
      fest.flow = 'show';
      fest.autoT = 0.3;
      return;
    }
    fest.flow = 'out';
    return;
  }
  if (fest.flow === 'out') {
    fest.slideX = -viewW * 1.1 * easeInOutSine(fest.flowT / D);
    if (fest.flowT >= D) {
      fest.round++;
      fest.houses = festMakeStreet(fest.round);
      fest.cartPop = 0.5;
      playNote(784, 0, 0.15, 'triangle', 0.25);
      playNote(1047, 0.12, 0.25, 'triangle', 0.25);
      fest.flow = 'in';
      fest.flowT = 0;
      fest.slideX = viewW * 1.1;
    }
    return;
  }
  if (fest.flow === 'show') {
    festAutoFireworks(dt, 0.75);
    if (fest.flowT >= FEST_SHOW_T) {
      fest.flow = 'end';
      fest.celT = 0;
      startCelebration();
    }
  }
}
function festChime() {
  var i;
  for (i = 0; i < 4; i++) playNote([659, 784, 988, 1319][i], i * 0.12, 0.25, 'triangle', 0.25);
}

// ---------- Ilotulitus ----------
function festAutoFireworks(dt, every) {
  fest.autoT -= dt;
  if (fest.autoT > 0) return;
  fest.autoT = every * (0.7 + Math.random() * 0.6);
  festLaunch(viewW * (0.15 + Math.random() * 0.7), viewH * (0.1 + Math.random() * 0.22));
}
function festLaunch(tx, ty) {
  var i, cols = FEST_ORDER.concat(['#ffffff']), c1, c2, shapes = ['ring', 'ring', 'heart', 'star', 'willow'];
  if (fest.rockets.length > 6) return;
  c1 = FEST_COLS[FEST_ORDER[festRand(0, 4)]];
  c2 = cols[festRand(0, cols.length - 1)];
  if (FEST_COLS[c2]) c2 = FEST_COLS[c2];
  fest.rockets.push({ x0: tx + (Math.random() - 0.5) * viewH * 0.15, y0: viewH * 0.68, tx: tx, ty: ty, t: 0, dur: 0.75, col: c1, col2: c2, shape: shapes[festRand(0, shapes.length - 1)] });
  for (i = 0; i < 5; i++) playNote(500 + i * 140, i * 0.07, 0.09, 'sine', 0.05);
}
function festBurst(x, y, col, col2, shape) {
  var parts = [], n = shape === 'willow' ? 22 : 28, i, a, t, hx, hy, sp;
  for (i = 0; i < n; i++) {
    a = i / n * Math.PI * 2;
    if (shape === 'heart') {
      // Sydänkäyrä
      t = a;
      hx = 16 * Math.pow(Math.sin(t), 3) / 17;
      hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
      parts.push({ dx: hx, dy: hy, c: i % 2 ? col : col2 });
    } else if (shape === 'star') {
      sp = i % 2 ? 0.5 : 1;
      a = Math.floor(i / 2) / (n / 2) * Math.PI * 2 + (i % 2 ? Math.PI / 5 : 0) - Math.PI / 2;
      parts.push({ dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, c: sp === 1 ? col : col2 });
    } else {
      sp = 0.85 + Math.random() * 0.2;
      parts.push({ dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, c: i % 3 ? col : col2 });
    }
  }
  fest.bursts.push({ x: x, y: y, t: 0, parts: parts, col: col, R: viewH * (shape === 'heart' ? 0.16 : 0.19), willow: shape === 'willow' });
  playNote(95, 0, 0.45, 'triangle', 0.3);
  playNote(1500 + Math.random() * 800, 0.15, 0.08, 'sine', 0.06);
  playNote(1800 + Math.random() * 800, 0.27, 0.08, 'sine', 0.05);
  playNote(1300 + Math.random() * 800, 0.38, 0.08, 'sine', 0.05);
}

// ---------- Tökättävät koristeet ----------
function festSetupProps() {
  var L = fest.L, H = L.H, W = L.W, lampX = Math.max(H * 0.09, W * 0.07), stallX = W - Math.max(H * 0.14, W * 0.1);
  propsReset();
  // Kuu: hymyilee; joka 3. tökkäys: tähdenlento ja pupunkorvat
  propAdd({
    x: W * 0.76, y: H * 0.2, r: H * 0.075, hy: H * 0.065, color: '#fff6c8', note: 988, amp: 0.05, ears: 0,
    update: function (p, dt) { if (p.ears > 0) p.ears -= dt; },
    draw: function (c, p) { festDrawMoon(c, 0, -H * 0.065, H * 0.058, p); },
    poke: function (p) {
      if (p.n % 3 === 0) {
        p.ears = 4;
        fest.shoot = { t: 0, x: W * 0.62, y: H * 0.06 };
        playNote(1568, 0.1, 0.2, 'sine', 0.2); playNote(2093, 0.25, 0.3, 'sine', 0.18); playNote(2637, 0.4, 0.4, 'sine', 0.14);
      }
    }
  });
  // Katulyhty: välähtää; joka 3.: sateenkaarivalo ja tulikärpäsparvi
  propAdd({
    x: lampX, y: H * 0.985, r: H * 0.07, hy: H * 0.29, color: '#ffe27a', note: 784, amp: 0.05, flare: 0, rainbow: 0,
    update: function (p, dt) { if (p.flare > 0) p.flare -= dt; if (p.rainbow > 0) p.rainbow -= dt; },
    draw: function (c, p) { festDrawLamp(c, H, p); },
    poke: function (p) {
      p.flare = 0.8;
      if (p.n % 3 === 0) {
        p.rainbow = 3.5;
        spawnSparkles(p.x, p.y - H * 0.3, 8, '#ff7bac');
        spawnSparkles(p.x, p.y - H * 0.3, 8, '#5fb8ff');
        spawnSparkles(p.x, p.y - H * 0.3, 8, '#d8ff9a');
        playNote(1047, 0.1, 0.15, 'sine', 0.2); playNote(1319, 0.2, 0.15, 'sine', 0.2); playNote(1568, 0.3, 0.25, 'sine', 0.2);
      }
    }
  });
  // Lyhtykoju: taivaslyhty nousee; joka 3.: kolme
  propAdd({
    x: stallX, y: H * 0.985, r: H * 0.1, hy: H * 0.08, color: '#ffd24f', note: 659, amp: 0.03,
    draw: function (c) { festDrawStall(c, H); },
    poke: function (p) {
      var i, n = p.n % 3 === 0 ? 3 : 1;
      for (i = 0; i < n; i++) fest.skyLanterns.push({ x: p.x + (i - (n - 1) / 2) * H * 0.06, y: p.y - H * 0.14 - i * H * 0.03, t: 0, ph: Math.random() * 6, col: FEST_COLS[FEST_ORDER[festRand(0, 4)]] });
      playNote(784, 0, 0.2, 'triangle', 0.2); playNote(988, 0.12, 0.25, 'triangle', 0.18);
    }
  });
  // Kissa kojun katolla: miau; joka 3.: hyppy ja sydän
  propAdd({
    x: stallX + H * 0.03, y: H * 0.985 - H * 0.205, r: H * 0.05, hy: H * 0.035, color: '#ffb870', note: 880, amp: 0.1, jump: 0, heart: 0,
    update: function (p, dt) { if (p.jump > 0) p.jump -= dt; if (p.heart > 0) p.heart -= dt; },
    draw: function (c, p) { festDrawCat(c, H * 0.042, p); },
    poke: function (p) {
      festMeow();
      if (p.n % 3 === 0) { p.jump = 0.7; p.heart = 1.8; spawnSparkles(p.x, p.y - H * 0.08, 8, '#ff7bac'); }
    }
  });
}
function festMeow() {
  playNote(784, 0, 0.12, 'triangle', 0.2);
  playNote(988, 0.1, 0.12, 'triangle', 0.2);
  playNote(740, 0.22, 0.2, 'triangle', 0.16);
}

// ---------- Tausta ----------
function festSeed(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function renderFestivalBg(b, w, h) {
  var g, i, x, y, r, hw, col, by, k;
  if (!fest.L || fest.L.W !== w || fest.L.H !== h) festLayout();
  // Iltataivas: syvä sini ylhäällä, hämärän pinkki horisontissa
  g = b.createLinearGradient(0, 0, 0, h * 0.64);
  g.addColorStop(0, '#191846');
  g.addColorStop(0.5, '#33306e');
  g.addColorStop(0.82, '#6c4a8e');
  g.addColorStop(1, '#b0709a');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Tähdet
  for (i = 0; i < 90; i++) {
    x = festSeed(i) * w;
    y = festSeed(i + 500) * h * 0.5;
    r = h * (0.0015 + festSeed(i + 900) * 0.0025);
    b.fillStyle = 'rgba(255,250,230,' + (0.35 + festSeed(i + 1300) * 0.5) + ')';
    b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
  }
  // Kaukaiset pupujen talot siluettina, ikkunoissa valoa
  by = h * 0.62;
  for (i = 0, x = -h * 0.05; x < w + h * 0.1; i++) {
    hw = h * (0.08 + festSeed(i + 40) * 0.06);
    col = artMix('#3a2e6a', '#6c4a8e', 0.25 + festSeed(i + 70) * 0.2);
    k = h * (0.06 + festSeed(i + 90) * 0.06);
    b.fillStyle = col;
    b.fillRect(x, by - k, hw, k + h * 0.05);
    b.beginPath(); if (b.ellipse) b.ellipse(x + hw / 2, by - k, hw / 2, hw * 0.38, 0, Math.PI, 0); b.fill();
    // Korvat
    b.beginPath(); if (b.ellipse) b.ellipse(x + hw * 0.32, by - k - hw * 0.42, hw * 0.08, hw * 0.22, -0.2, 0, Math.PI * 2); b.fill();
    b.beginPath(); if (b.ellipse) b.ellipse(x + hw * 0.68, by - k - hw * 0.42, hw * 0.08, hw * 0.22, 0.2, 0, Math.PI * 2); b.fill();
    if (festSeed(i + 20) < 0.75) {
      artGlow(b, x + hw * 0.5, by - k * 0.5, hw * 0.4, '#ffd27a', 0.25);
      b.fillStyle = '#ffd890';
      b.fillRect(x + hw * 0.4, by - k * 0.62, hw * 0.2, hw * 0.16);
    }
    x += hw + h * (0.01 + festSeed(i + 120) * 0.03);
  }
  // Kaukaiset valonauhat talojen välillä
  for (i = 0; i < 3; i++) {
    var x0 = w * (i / 3) + h * 0.05, x1 = x0 + w * 0.3, y0 = h * (0.5 + festSeed(i + 3) * 0.04), j, u;
    b.strokeStyle = 'rgba(40,30,70,0.5)';
    b.lineWidth = Math.max(1, h * 0.002);
    b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo((x0 + x1) / 2, y0 + h * 0.05, x1, y0); b.stroke();
    for (j = 1; j < 10; j++) {
      u = j / 10;
      x = x0 + (x1 - x0) * u;
      y = y0 + h * 0.05 * 2 * u * (1 - u);
      col = FEST_COLS[FEST_ORDER[(i + j) % 5]];
      artGlow(b, x, y + h * 0.006, h * 0.016, col, 0.5);
      b.fillStyle = col;
      b.beginPath(); b.arc(x, y + h * 0.006, h * 0.005, 0, Math.PI * 2); b.fill();
    }
  }
  // Jalkakäytävä
  y = h * 0.64;
  g = b.createLinearGradient(0, y, 0, h * 0.71);
  g.addColorStop(0, '#9a88b8');
  g.addColorStop(1, '#7a6a9a');
  b.fillStyle = g;
  b.fillRect(0, y, w, h * 0.07);
  b.strokeStyle = 'rgba(60,40,90,0.35)';
  b.lineWidth = Math.max(1, h * 0.002);
  for (x = 0; x < w; x += h * 0.09) { b.beginPath(); b.moveTo(x, y + h * 0.005); b.lineTo(x - h * 0.01, h * 0.71); b.stroke(); }
  b.fillStyle = '#5e4f80';
  b.fillRect(0, h * 0.705, w, h * 0.012);
  // Mukulakivikatu
  y = h * 0.717;
  b.fillStyle = '#5a4c7c';
  b.fillRect(0, y, w, h - y);
  for (i = 0; i < 260; i++) {
    x = festSeed(i + 2000) * w;
    r = festSeed(i + 2600);
    k = y + h * 0.01 + r * (h - y);
    b.fillStyle = festSeed(i + 3000) < 0.5 ? 'rgba(120,100,160,0.45)' : 'rgba(40,30,70,0.3)';
    b.beginPath();
    if (b.ellipse) b.ellipse(x, k, h * (0.018 + r * 0.012), h * (0.008 + r * 0.006), 0, 0, Math.PI * 2);
    else b.arc(x, k, h * 0.012, 0, Math.PI * 2);
    b.fill();
  }
}

// ---------- Piirto: osat ----------
// Paperilyhty: runko, ripsut, kannet ja tupsu. glow 0..1
function festDrawLanternAt(c, x, y, r, col, glow) {
  var hex = FEST_COLS[col] || col, ry = r * 1.15;
  if (glow > 0) artGlow(c, x, y, r * 2.8, hex, 0.42 * glow);
  // Kannet
  artRoundRect(c, x - r * 0.45, y - ry - r * 0.18, r * 0.9, r * 0.28, r * 0.08, '#5a4470', { line: false });
  artRoundRect(c, x - r * 0.45, y + ry - r * 0.1, r * 0.9, r * 0.28, r * 0.08, '#5a4470', { line: false });
  artBlob(c, x, y, r, ry, hex, { hi: 0.4 });
  if (glow > 0) artGlow(c, x, y + r * 0.1, r * 0.95, '#fff6c8', 0.55 * glow);
  // Ripsut
  c.strokeStyle = artRGBA(artShade(hex, -0.35), 0.55);
  c.lineWidth = Math.max(1, r * 0.07);
  c.beginPath();
  if (c.ellipse) {
    c.ellipse(x, y, r * 0.45, ry * 0.97, 0, 0, Math.PI * 2);
    c.moveTo(x, y - ry); c.lineTo(x, y + ry);
  }
  c.stroke();
  // Tupsu
  artLimb(c, x, y + ry + r * 0.15, x, y + ry + r * 0.55, Math.max(1.2, r * 0.14), artShade(hex, -0.15), false);
}
function festDrawMoon(c, x, y, r, p) {
  var smile = p.t >= 0 ? Math.sin(Math.min(1, p.t / 1.4) * Math.PI) : 0, e = p.ears > 0 ? Math.min(1, p.ears, (4 - p.ears) * 4) : 0;
  artGlow(c, x, y, r * 2.6, '#fff2b0', 0.28);
  if (e > 0) {
    // Pupunkorvat
    c.save();
    c.globalAlpha = e;
    artBlob(c, x - r * 0.42, y - r * 1.1, r * 0.2, r * 0.48, '#fff6d0', { rot: -0.25, lineColor: '#d8c070' });
    artBlob(c, x + r * 0.42, y - r * 1.1, r * 0.2, r * 0.48, '#fff6d0', { rot: 0.25, lineColor: '#d8c070' });
    artBlob(c, x - r * 0.42, y - r * 1.08, r * 0.09, r * 0.32, '#ffc4dd', { rot: -0.25, line: false, flat: true });
    artBlob(c, x + r * 0.42, y - r * 1.08, r * 0.09, r * 0.32, '#ffc4dd', { rot: 0.25, line: false, flat: true });
    c.restore();
  }
  artCircle(c, x, y, r, '#fff3c0', { lineColor: '#d8c070', hi: 0.4 });
  c.fillStyle = 'rgba(220,200,120,0.35)';
  c.beginPath(); c.arc(x + r * 0.35, y + r * 0.25, r * 0.16, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - r * 0.1, y + r * 0.5, r * 0.1, 0, Math.PI * 2); c.fill();
  if (smile > 0 || e > 0) {
    c.globalAlpha = Math.max(smile, e);
    artEye(c, x - r * 0.3, y - r * 0.12, r * 0.12, 0, false);
    artEye(c, x + r * 0.3, y - r * 0.12, r * 0.12, 0, smile > 0.4 && smile < 0.8);
    artBlush(c, x - r * 0.5, y + r * 0.15, r * 0.13);
    artBlush(c, x + r * 0.5, y + r * 0.15, r * 0.13);
    c.strokeStyle = '#a08840';
    c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath(); c.arc(x, y + r * 0.08, r * 0.2, 0.3, Math.PI - 0.3); c.stroke();
    c.globalAlpha = 1;
  }
}
function festDrawLamp(c, H, p) {
  var top = -H * 0.29, col = '#fff2a0', k = p.flare > 0 ? p.flare / 0.8 : 0;
  if (p.rainbow > 0) col = FEST_COLS[FEST_ORDER[Math.floor(globalT * 5) % 5]];
  artShadow(c, 0, 0, H * 0.04, H * 0.01, 0.2);
  artRoundRect(c, -H * 0.022, -H * 0.03, H * 0.044, H * 0.03, H * 0.008, '#4a4a6a');
  artLimb(c, 0, -H * 0.02, 0, top + H * 0.02, H * 0.014, '#4a4a6a', '#2a2a3a');
  artGlow(c, 0, top, H * (0.14 + k * 0.08), col, 0.4 + k * 0.3);
  artRoundRect(c, -H * 0.025, top - H * 0.03, H * 0.05, H * 0.055, H * 0.012, col, { lineColor: '#2a2a3a' });
  c.beginPath(); c.moveTo(-H * 0.035, top - H * 0.028); c.lineTo(0, top - H * 0.058); c.lineTo(H * 0.035, top - H * 0.028); c.closePath();
  artFillPath(c, '#4a4a6a', top - H * 0.058, top - H * 0.028, H * 0.02, { lineColor: '#2a2a3a' });
}
function festDrawStall(c, H) {
  var w = H * 0.2, top = -H * 0.17, i, cols = ['#ff7bac', '#fff4f8'];
  artShadow(c, 0, 0, w * 0.6, H * 0.015, 0.25);
  artLimb(c, -w * 0.42, 0, -w * 0.42, top, H * 0.01, '#8a5a3a', '#4a2a1a');
  artLimb(c, w * 0.42, 0, w * 0.42, top, H * 0.01, '#8a5a3a', '#4a2a1a');
  // Tiski ja myytävät lyhdyt
  artRoundRect(c, -w * 0.5, -H * 0.07, w, H * 0.07, H * 0.01, '#d8955f', { lineColor: '#6a3a1a' });
  for (i = 0; i < 4; i++) festDrawLanternAt(c, -w * 0.33 + i * w * 0.22, -H * 0.1, H * 0.016, FEST_ORDER[i], 0.6);
  // Raidallinen markiisi
  for (i = 0; i < 6; i++) {
    c.beginPath();
    c.moveTo(-w * 0.55 + i * w * 1.1 / 6, top);
    c.lineTo(-w * 0.55 + (i + 1) * w * 1.1 / 6, top);
    c.lineTo(-w * 0.55 + (i + 1) * w * 1.1 / 6, top + H * 0.03);
    c.arc(-w * 0.55 + (i + 0.5) * w * 1.1 / 6, top + H * 0.03, w * 1.1 / 12, 0, Math.PI);
    c.closePath();
    artFillPath(c, cols[i % 2], top, top + H * 0.05, H * 0.02, { lineColor: '#b0507a' });
  }
  c.beginPath(); c.moveTo(-w * 0.58, top + H * 0.002); c.lineTo(-w * 0.4, top - H * 0.035); c.lineTo(w * 0.4, top - H * 0.035); c.lineTo(w * 0.58, top + H * 0.002); c.closePath();
  artFillPath(c, '#ff9ec6', top - H * 0.035, top, H * 0.02, { lineColor: '#b0507a' });
}
function festDrawCat(c, s, p) {
  var j = p.jump > 0 ? Math.sin((1 - p.jump / 0.7) * Math.PI) * s * 1.6 : 0, tail = p.t >= 0 ? Math.sin(p.t * 12) * 0.5 : Math.sin(globalT * 1.5) * 0.2;
  var body = '#ffb870', line = '#a0602a';
  artShadow(c, 0, 0, s * 0.7, s * 0.15, 0.2);
  c.save();
  c.translate(0, -j);
  // Häntä
  c.strokeStyle = line; c.lineWidth = s * 0.22; c.lineCap = 'round';
  c.beginPath(); c.moveTo(s * 0.4, -s * 0.15); c.quadraticCurveTo(s * 1.0, -s * 0.2, s * 0.9 + Math.sin(tail) * s * 0.3, -s * 0.75); c.stroke();
  c.strokeStyle = body; c.lineWidth = s * 0.14;
  c.beginPath(); c.moveTo(s * 0.4, -s * 0.15); c.quadraticCurveTo(s * 1.0, -s * 0.2, s * 0.9 + Math.sin(tail) * s * 0.3, -s * 0.75); c.stroke();
  artBlob(c, 0, -s * 0.38, s * 0.5, s * 0.4, body, { lineColor: line, hi: 0.3 });
  // Pää ja korvat
  c.beginPath(); c.moveTo(-s * 0.4, -s * 0.95); c.lineTo(-s * 0.32, -s * 1.3); c.lineTo(-s * 0.08, -s * 1.08); c.closePath();
  artFillPath(c, body, -s * 1.3, -s * 0.95, s * 0.2, { lineColor: line });
  c.beginPath(); c.moveTo(s * 0.4, -s * 0.95); c.lineTo(s * 0.32, -s * 1.3); c.lineTo(s * 0.08, -s * 1.08); c.closePath();
  artFillPath(c, body, -s * 1.3, -s * 0.95, s * 0.2, { lineColor: line });
  artCircle(c, 0, -s * 0.9, s * 0.38, body, { lineColor: line, hi: 0.3 });
  artEye(c, -s * 0.14, -s * 0.94, s * 0.08, 0, p.t < 0 && Math.sin(globalT * 0.7) > 0.95);
  artEye(c, s * 0.14, -s * 0.94, s * 0.08, 0, p.t < 0 && Math.sin(globalT * 0.7) > 0.95);
  c.fillStyle = '#ff8fbe';
  c.beginPath(); c.arc(0, -s * 0.8, s * 0.045, 0, Math.PI * 2); c.fill();
  artBlush(c, -s * 0.24, -s * 0.78, s * 0.07);
  artBlush(c, s * 0.24, -s * 0.78, s * 0.07);
  c.restore();
  if (p.heart > 0) {
    var hy = -s * 1.6 - (1.8 - p.heart) * s * 0.6;
    c.globalAlpha = Math.min(1, p.heart);
    c.fillStyle = '#ff5f8e';
    c.beginPath();
    c.moveTo(0, hy + s * 0.25);
    c.bezierCurveTo(-s * 0.4, hy, -s * 0.2, hy - s * 0.3, 0, hy - s * 0.1);
    c.bezierCurveTo(s * 0.2, hy - s * 0.3, s * 0.4, hy, 0, hy + s * 0.25);
    c.fill();
    c.globalAlpha = 1;
  }
}
// Pupun vilkuttava tassu
function festWave(c, x, y, s, t) {
  var a = -1.1 + Math.sin(t * 9) * 0.45, ex = x + Math.cos(a) * s * 0.45, ey = y + Math.sin(a) * s * 0.45;
  artLimb(c, x, y, ex, ey, s * 0.14, '#ffffff', BUNNY_LINE);
  artCircle(c, ex, ey, s * 0.11, '#ffffff', { lineColor: BUNNY_LINE, shadeTo: BUNNY_SHADE });
}
function festDotPos(h, g, ni, k) {
  var H = fest.L.H, N = festTotal(h), gap = h.need.length > 1 ? 0.5 : 0, sp = Math.min(H * 0.042, g.hw * 0.66 / (N + gap + 0.2)), idx = k, x0;
  if (ni > 0) idx = h.need[0].n + gap + k;
  x0 = g.cx - (N - 1 + gap) * sp / 2;
  return { x: x0 + idx * sp, y: g.top - g.domeRy * 0.42, r: sp * 0.38 };
}
function festDrawHouse(c, h, i, hintOn) {
  var g = festHouseGeo(i), H = fest.L.H, hw = g.hw, x0 = g.cx - hw / 2, k, j, n, d, wall, sh = 0, f, hp, r, a, win, wy, ww, dx, dw, dh, fy, s, hop, wave, lit;
  if (g.cx < -hw || g.cx > fest.L.W + hw) return;
  if (h.shake > 0) sh = Math.sin(h.shake * 40) * H * 0.006 * (h.shake / 0.5);
  wall = artMix(h.wall, '#4a3e7a', 0.28 * (1 - h.lightK));
  // Vihjeen hehku talon takana
  if (hintOn) artGlow(c, g.cx, g.top, hw * 1.05, '#ffe27a', 0.42 + Math.sin(globalT * 4) * 0.12);
  if (h.lightK > 0) artGlow(c, g.cx, g.top + H * 0.05, hw * 1.1, '#ffcf7a', 0.25 * h.lightK);
  artShadow(c, g.cx, g.base, hw * 0.6, H * 0.012, 0.25);
  c.save();
  c.translate(sh, 0);
  // Korvat (katon yläpuolella)
  k = g.domeRy;
  artBlob(c, g.cx - hw * 0.22, g.domeTop - k * 0.35, hw * 0.08, k * 0.62, h.roof, { rot: -0.22 });
  artBlob(c, g.cx + hw * 0.22, g.domeTop - k * 0.35, hw * 0.08, k * 0.62, h.roof, { rot: 0.22 });
  artBlob(c, g.cx - hw * 0.22, g.domeTop - k * 0.3, hw * 0.038, k * 0.42, '#ffc4dd', { rot: -0.22, line: false, flat: true });
  artBlob(c, g.cx + hw * 0.22, g.domeTop - k * 0.3, hw * 0.038, k * 0.42, '#ffc4dd', { rot: 0.22, line: false, flat: true });
  // Kupolikatto
  c.beginPath();
  if (c.ellipse) c.ellipse(g.cx, g.top, hw * 0.56, k, 0, Math.PI, 0);
  c.closePath();
  artFillPath(c, h.roof, g.domeTop, g.top, hw * 0.3, {});
  // Seinä
  artRoundRect(c, x0, g.top, hw, g.base - g.top, H * 0.008, wall, {});
  // Ikkunat
  wy = g.top + (g.base - g.top) * 0.42;
  ww = hw * 0.17;
  for (j = -1; j <= 1; j += 2) {
    win = g.cx + j * hw * 0.32 - ww / 2;
    if (h.lightK > 0) artGlow(c, win + ww / 2, wy + ww * 0.6, ww * 1.6, '#ffd890', 0.5 * h.lightK);
    c.beginPath();
    c.moveTo(win, wy + ww * 1.2); c.lineTo(win, wy + ww * 0.5); c.arc(win + ww / 2, wy + ww * 0.5, ww / 2, Math.PI, 0); c.lineTo(win + ww, wy + ww * 1.2); c.closePath();
    artFillPath(c, artMix('#3a3462', '#ffd77a', h.lightK), wy, wy + ww * 1.2, ww * 0.5, { lineColor: artShade(h.wall, -0.5) });
    c.strokeStyle = artShade(h.wall, -0.5);
    c.lineWidth = Math.max(1, ww * 0.07);
    c.beginPath(); c.moveTo(win + ww / 2, wy); c.lineTo(win + ww / 2, wy + ww * 1.2); c.moveTo(win, wy + ww * 0.7); c.lineTo(win + ww, wy + ww * 0.7); c.stroke();
  }
  // Ovi: avautuu, kun talo on valmis
  dw = hw * 0.26; dh = H * 0.105; dx = g.cx - dw / 2;
  c.beginPath(); c.moveTo(dx, g.base); c.lineTo(dx, g.base - dh + dw / 2); c.arc(g.cx, g.base - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw, g.base); c.closePath();
  artFillPath(c, artMix('#3a2a4a', '#ffcf7a', h.doorK), g.base - dh, g.base, dw * 0.5, { lineColor: '#4a2a1a' });
  c.save();
  c.translate(dx, 0);
  c.scale(1 - h.doorK * 0.75, 1);
  c.beginPath(); c.moveTo(0, g.base); c.lineTo(0, g.base - dh + dw / 2); c.arc(dw / 2, g.base - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dw, g.base); c.closePath();
  artFillPath(c, '#b0704a', g.base - dh, g.base, dw * 0.5, { lineColor: '#4a2a1a' });
  artCircle(c, dw * 0.78, g.base - dh * 0.42, dw * 0.07, '#ffd24f', { line: false });
  c.restore();
  // Kattoikkuna: tilaus pisteinä
  a = festDotPos(h, g, 0, 0);
  n = festTotal(h);
  ww = Math.max(hw * 0.4, (n + (h.need.length > 1 ? 0.5 : 0)) * a.r / 0.38 + H * 0.02);
  fy = h.pulse > 0 ? 1 + Math.sin(h.pulse * 20) * 0.06 : 1;
  c.save();
  c.translate(g.cx, a.y);
  c.scale(fy, fy);
  artRoundRect(c, -ww / 2, -H * 0.028, ww, H * 0.056, H * 0.026, h.done ? '#ffe7a8' : '#2c2754', { lineColor: artShade(h.roof, -0.5), line: Math.max(1.5, H * 0.004) });
  c.restore();
  for (j = 0; j < h.need.length; j++) {
    d = h.need[j];
    for (k = 0; k < d.n; k++) {
      f = festDotPos(h, g, j, k);
      f.x = g.cx + (f.x - g.cx) * fy;
      if (k < d.got) {
        // Täytetty: pieni haalea rengas
        c.strokeStyle = artRGBA(FEST_COLS[d.col], h.done ? 0.9 : 0.45);
        c.lineWidth = Math.max(1, f.r * 0.3);
        c.beginPath(); c.arc(f.x, f.y, f.r * 0.6, 0, Math.PI * 2); c.stroke();
      } else {
        artGlow(c, f.x, f.y, f.r * 2.4, FEST_COLS[d.col], 0.45);
        artCircle(c, f.x, f.y, f.r * (1 + (h.pulse > 0 ? Math.sin(h.pulse * 14) * 0.15 : 0)), FEST_COLS[d.col], { hi: 0.4 });
      }
    }
  }
  c.restore();
  // Lyhtynauha ja koukut
  n = festTotal(h);
  r = festLanternR(h, g);
  a = festHookPos(h, g, 0);
  c.strokeStyle = '#3a2a4a';
  c.lineWidth = Math.max(1, H * 0.003);
  c.beginPath();
  c.moveTo(g.cx - hw * 0.5, g.top + H * 0.006);
  c.quadraticCurveTo(g.cx, g.top + H * 0.014 + H * 0.06, g.cx + hw * 0.5, g.top + H * 0.006);
  c.stroke();
  for (k = h.hung.length; k < n; k++) {
    hp = festHookPos(h, g, k);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(hp.x, hp.y + r * 0.2, Math.max(1.5, r * 0.18), 0, Math.PI * 2); c.fill();
  }
  for (k = 0; k < h.hung.length; k++) {
    f = h.hung[k];
    hp = festHookPos(h, g, k);
    var ly = hp.y + H * 0.008 + r * 1.35;
    if (f.k < 1) {
      a = easeOutCubic(f.k);
      festDrawLanternAt(c, f.x0 + (hp.x - f.x0) * a, f.y0 + (ly - f.y0) * a - Math.sin(a * Math.PI) * H * 0.05, r * (1.3 - 0.3 * a), f.col, 0.5);
      continue;
    }
    c.save();
    c.translate(hp.x, hp.y);
    c.rotate(Math.sin(globalT * 1.6 + f.ph) * 0.07);
    c.strokeStyle = '#3a2a4a';
    c.lineWidth = Math.max(1, H * 0.002);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, ly - hp.y - r * 1.2); c.stroke();
    if (f.pop > 0) artSquash(c, Math.sin(f.pop / 0.3 * Math.PI) * 0.15);
    lit = 0.85 + Math.sin(globalT * 3 + f.ph) * 0.15;
    festDrawLanternAt(c, 0, ly - hp.y, r, f.col, lit);
    c.restore();
  }
  // Pupuperhe ovella
  if (h.famK > 0) {
    s = H * 0.058 * easeOutBack(h.famK);
    hop = h.hop > 0 ? Math.sin(h.hop / 0.5 * Math.PI) * H * 0.03 : 0;
    wave = fest.flow === 'wave' || fest.flow === 'show' || h.doneT < 3.5 || h.hop > 0;
    drawBunny(c, g.cx - hw * 0.02, g.base + H * 0.012, s, hop, globalT * 3);
    if (wave) festWave(c, g.cx - hw * 0.02 + s * 0.3, g.base + H * 0.012 - hop - s * 0.7, s, globalT + i);
    for (j = 0; j < h.kids; j++) {
      var kx = g.cx + hw * (j ? -0.27 : 0.22), ks = s * 0.62, khop = Math.abs(Math.sin(globalT * 4 + j * 1.5 + i)) * H * 0.012 * (wave ? 1 : 0) + hop;
      drawBunny(c, kx, g.base + H * 0.016, ks, khop, globalT * 4 + j);
      if (wave) festWave(c, kx + ks * 0.3, g.base + H * 0.016 - khop - ks * 0.7, ks, globalT * 1.2 + j);
      // Rusetti
      artCircle(c, kx - ks * 0.12, g.base + H * 0.016 - khop - ks * 1.42, ks * 0.09, ['#ff7bac', '#b678ff'][j], { lineColor: '#8a3a6a' });
    }
  }
}
function festDrawCart(c) {
  var L = fest.L, H = L.H, cols = festCartCols(), w = cols.length * L.slotGap + H * 0.07, x0 = L.cartX - w / 2, top = L.cartY + H * 0.02, j, s, pop;
  artShadow(c, L.cartX, H * 0.975, w * 0.55, H * 0.015, 0.3);
  // Aisa
  artLimb(c, x0 + w, top + H * 0.03, x0 + w + H * 0.07, top - H * 0.01, H * 0.012, '#a06a3a', '#4a2a1a');
  // Pyörät
  for (j = 0; j < 2; j++) {
    s = x0 + w * (j ? 0.8 : 0.2);
    artCircle(c, s, H * 0.94, H * 0.035, '#c8845a', { lineColor: '#4a2a1a' });
    artCircle(c, s, H * 0.94, H * 0.01, '#6a4a2a', { line: false });
  }
  artRoundRect(c, x0, top, w, H * 0.075, H * 0.015, '#e8a868', { lineColor: '#6a3a1a', hi: 0.3 });
  c.fillStyle = 'rgba(120,60,30,0.25)';
  c.fillRect(x0 + H * 0.01, top + H * 0.035, w - H * 0.02, H * 0.006);
  // Lyhdyt: kaksi päällekkäin = niitä riittää
  for (j = 0; j < cols.length; j++) {
    s = festSlotPos(j);
    pop = fest.cartPop > 0 ? 1 + Math.sin(fest.cartPop / 0.5 * Math.PI) * 0.2 : 1;
    festDrawLanternAt(c, s.x - H * 0.022, s.y + H * 0.005, H * 0.024, cols[j], 0.2);
    festDrawLanternAt(c, s.x + H * 0.022, s.y + H * 0.008, H * 0.022, cols[j], 0.2);
    festDrawLanternAt(c, s.x, s.y - H * 0.012, H * 0.032 * pop, cols[j], 0.55);
  }
}
function festDrawFireworks(c) {
  var i, j, r, b, k, p, x, y, a, tt, H = viewH;
  for (i = 0; i < fest.rockets.length; i++) {
    r = fest.rockets[i];
    k = easeOutCubic(r.t / r.dur);
    x = r.x0 + (r.tx - r.x0) * k;
    y = r.y0 + (r.ty - r.y0) * k;
    for (j = 0; j < 5; j++) {
      tt = Math.max(0, k - j * 0.04);
      c.globalAlpha = 0.6 - j * 0.1;
      c.fillStyle = '#ffe9a8';
      c.beginPath(); c.arc(r.x0 + (r.tx - r.x0) * tt, r.y0 + (r.ty - r.y0) * tt, H * (0.006 - j * 0.0008), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  for (i = 0; i < fest.bursts.length; i++) {
    b = fest.bursts[i];
    k = easeOutCubic(Math.min(1, b.t / 0.9));
    a = Math.max(0, 1 - b.t / 1.8);
    if (b.t < 0.3) artGlow(c, b.x, b.y, b.R * 1.2, b.col, 0.5 * (1 - b.t / 0.3));
    for (j = 0; j < b.parts.length; j++) {
      p = b.parts[j];
      x = b.x + p.dx * b.R * k;
      y = b.y + p.dy * b.R * k + b.t * b.t * H * (b.willow ? 0.08 : 0.03);
      c.globalAlpha = a * (0.75 + 0.25 * Math.sin(b.t * 25 + j));
      c.fillStyle = p.c;
      if (b.t < 1) artGlow(c, x, y, H * 0.02, p.c, 0.35 * a);
      c.globalAlpha = a * (0.75 + 0.25 * Math.sin(b.t * 25 + j));
      c.fillStyle = p.c;
      c.beginPath(); c.arc(x, y, H * 0.008 * (1 - b.t / 2.4), 0, Math.PI * 2); c.fill();
      if (b.willow || b.t < 0.6) {
        c.strokeStyle = p.c;
        c.lineWidth = Math.max(1, H * 0.004);
        c.globalAlpha = a * 0.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(b.x + p.dx * b.R * k * 0.8, b.y + p.dy * b.R * k * 0.8); c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
}
function festDrawSky(c) {
  var i, t, x, y, r, a, s;
  for (i = 0; i < fest.twinkle.length; i++) {
    t = fest.twinkle[i];
    a = 0.5 + 0.5 * Math.sin(globalT * 2 + t.ph);
    if (a < 0.4) continue;
    x = t.fx * viewW; y = t.fy * viewH; r = t.r * viewH * a;
    c.fillStyle = 'rgba(255,250,220,' + a + ')';
    c.beginPath();
    c.moveTo(x, y - r * 2); c.lineTo(x + r * 0.4, y - r * 0.4); c.lineTo(x + r * 2, y); c.lineTo(x + r * 0.4, y + r * 0.4);
    c.lineTo(x, y + r * 2); c.lineTo(x - r * 0.4, y + r * 0.4); c.lineTo(x - r * 2, y); c.lineTo(x - r * 0.4, y - r * 0.4);
    c.closePath(); c.fill();
  }
  if (fest.shoot) {
    s = fest.shoot;
    a = s.t / 1.2;
    x = s.x - a * viewW * 0.45; y = s.y + a * viewH * 0.18;
    c.strokeStyle = 'rgba(255,250,210,' + (1 - a) + ')';
    c.lineWidth = Math.max(1.5, viewH * 0.004);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + viewW * 0.08, y - viewH * 0.032); c.stroke();
    drawStar(c, x, y, viewH * 0.012, globalT * 4, 0.6);
  }
  for (i = 0; i < fest.skyLanterns.length; i++) {
    t = fest.skyLanterns[i];
    c.globalAlpha = Math.min(1, t.t * 2, Math.max(0, t.y / (viewH * 0.25)));
    festDrawLanternAt(c, t.x, t.y, viewH * 0.02, t.col, 0.9);
    c.globalAlpha = 1;
  }
}

// ---------- Vihje ----------
function festHintStep() {
  var i, j, h, g, s, hp, cols = festCartCols(), r;
  for (i = 0; i < fest.houses.length; i++) {
    h = fest.houses[i];
    if (h.done) continue;
    for (j = 0; j < h.need.length; j++) {
      if (h.need[j].got >= h.need[j].n) continue;
      g = festHouseGeo(i);
      s = festSlotPos(cols.indexOf(h.need[j].col));
      hp = festHookPos(h, g, h.hung.length);
      r = festLanternR(h, g);
      return { house: i, col: h.need[j].col, from: { x: s.x, y: s.y }, to: { x: hp.x, y: hp.y + r * 1.6 } };
    }
  }
  return null;
}
function festDrawHint(c, st) {
  var k, p, s = viewH * 0.07, a, m;
  if (!st || fest.hintT < 0.5) return;
  k = ((fest.hintT - 0.5) % 2.4) / 2.4;
  if (k < 0.2) p = { x: st.from.x, y: st.from.y, press: k / 0.2 };
  else if (k < 0.78) {
    m = easeInOutSine((k - 0.2) / 0.58);
    p = { x: st.from.x + (st.to.x - st.from.x) * m, y: st.from.y + (st.to.y - st.from.y) * m - Math.sin(m * Math.PI) * viewH * 0.06, press: 1 };
  } else p = { x: st.to.x, y: st.to.y, press: Math.max(0, 1 - (k - 0.78) / 0.12) };
  a = Math.min(1, (fest.hintT - 0.5) * 3);
  if (p.press > 0.3) {
    c.globalAlpha = 0.6 * a * p.press;
    festDrawLanternAt(c, p.x, p.y - viewH * 0.035, viewH * 0.03, st.col, 0.4);
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (k < 0.2) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - p.press) * s * -0.25, s);
  c.globalAlpha = 1;
}
// Ilotulituksen alussa käsi näyttää taivaan napautuksen
function festDrawSkyHint(c) {
  var k, s = viewH * 0.07, x = viewW * 0.45, y = viewH * 0.25;
  if (fest.flow !== 'show' || fest.skyTaps > 0 || fest.flowT < 1.5) return;
  k = ((fest.flowT - 1.5) % 1.4) / 1.4;
  c.globalAlpha = 0.85;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (k < 0.4) { c.beginPath(); c.arc(x, y, viewH * (0.02 + k * 0.15), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, x + s * 0.1, y - s * 0.75 - (k < 0.3 ? 0 : s * 0.2), s);
  c.globalAlpha = 1;
}

// ---------- HUD ----------
function festHudSlot(r, i) {
  var H = viewH, x = hudX() + H * 0.045, q;
  for (q = 0; q < r; q++) x += FEST_ROUNDS[q].houses * H * 0.046 + H * 0.025;
  return { x: x + i * H * 0.046, y: H * 0.063 };
}
function festDrawHud(c) {
  var r, i, sl, last = festHudSlot(FEST_ROUNDS.length - 1, FEST_ROUNDS[FEST_ROUNDS.length - 1].houses - 1), cur;
  drawHudPanel(c, hudX(), viewH * 0.018, last.x + viewH * 0.045 - hudX(), viewH * 0.09, viewH * 0.025);
  for (r = 0; r < FEST_ROUNDS.length; r++) {
    for (i = 0; i < FEST_ROUNDS[r].houses; i++) {
      sl = festHudSlot(r, i);
      if (i < fest.done[r].length) festDrawLanternAt(c, sl.x, sl.y, viewH * 0.014, fest.done[r][i], 0.8);
      else {
        cur = r === fest.round && !celebrating;
        artCircle(c, sl.x, sl.y, viewH * (cur ? 0.013 + Math.sin(globalT * 4) * 0.0015 : 0.011), cur ? 'rgba(255,246,224,0.9)' : 'rgba(255,255,255,0.4)', { lineColor: cur ? '#d89a5a' : '#c8b0a0', flat: true });
      }
    }
  }
}

// ---------- Piirto: kokonaisuus ----------
function drawFestival() {
  var c = ctx, i, f, k, x, y, d, st = null;
  if (!beginPlayWorld()) return;
  festDrawSky(c);
  festDrawFireworks(c);
  propsDraw(c, 0);
  if (fest.flow === 'play') st = festHintStep();
  for (i = 0; i < fest.houses.length; i++) festDrawHouse(c, fest.houses[i], i, !!st && st.house === i && fest.hintT > 0.3);
  festDrawCart(c);
  for (i = 0; i < fest.flies.length; i++) {
    f = fest.flies[i];
    k = easeInOutSine(f.t / f.dur);
    x = f.x0 + (f.x1 - f.x0) * k + (f.slow ? Math.sin(f.t * 8) * viewH * 0.012 * (1 - k) : 0);
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * viewH * (f.slow ? 0.08 : 0.04);
    festDrawLanternAt(c, x, y, viewH * 0.03, f.col, 0.4);
  }
  d = fest.drag;
  if (d) {
    artShadow(c, d.x, d.y + viewH * 0.07, viewH * 0.03, viewH * 0.008, 0.2);
    festDrawLanternAt(c, d.x, d.y, viewH * 0.034, d.col, 0.7);
  }
  festDrawHint(c, st && fest.hintT > 0 ? st : null);
  festDrawSkyHint(c);
  drawParticlesLayer(c);
  endPlayWorld();
  festDrawHud(c);
}

// ---------- Kartan kuvake ----------
HUB_ICONS.festival = function (c, x, y, s) {
  var r = s * 0.16;
  c.strokeStyle = '#3a2a4a';
  c.lineWidth = Math.max(1, s * 0.02);
  c.beginPath(); c.moveTo(x, y - r * 2.1); c.lineTo(x, y - r * 1.3); c.stroke();
  festDrawLanternAt(c, x, y, r, 'pink', 0.9);
};
