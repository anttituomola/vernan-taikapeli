'use strict';

// Pupujen leipomo (Kaukamaa, Pupula): pitkä ja helppo kenttä ilman sydämiä ja
// aikarajaa. Kaikki tehdään raahaamalla yhdellä ruudulla:
//   - Eläinasiakas (pupu, kana, possu, lammas, lehmä, ankka, poni, kissa)
//     tulee tiskille, ja kuplassa on kuva leivoksesta, jonka se haluaa.
//   - Pohja (kakku, sydänkakku, muffinssi, keksi, pulla) raahataan
//     taikinalaatikosta lautaselle, lautanen uuniin. Uuni paistaa (hehku ja
//     kellotaulu), kello kilahtaa ja ikkuna hehkuu kultaisena: leivos
//     raahataan ulos BAKE_GOLD sekunnin sisällä. Myöhemmin se tummuu "vähän
//     palaneeksi": asiakas ottaa sen silti, mutta huokaisee hassusti.
//   - Kuorrutus: pursotinpussi raahataan leivoksen päälle ja sitä
//     sutataan edestakaisin, kunnes kuorrute peittää pinnan. Toinen väri
//     maalautuu vanhan päälle.
//   - Koristeet (mansikat, kirsikat, kynttilät, sokeritähdet) raahataan
//     kulhosta yksi kerrallaan; määrä ratkaisee. Koristeen saa pois
//     raahaamalla sen takaisin kulhoon, väärän pohjan taikinalaatikkoon.
//   - Valmis leivos raahataan asiakkaalle. Väärä yksityiskohta: asiakas
//     ravistaa päätään ja kuplan väärä kohta sykkii; leivos palaa
//     lautaselle korjattavaksi. Ei rangaistusta.
// Kolme vaihetta (aamu, päivä, ilta; valo vaihtuu): pohja + kuorrute;
// + yksi koristelaji 1–3 kuvina; kaksi lajia numeroin (enintään 7), kynttilät
// laskuna "2 + 3" tai kaksi samanlaista leivosta. Tilaukset ja asiakkaat
// arvotaan joka kerta. Ensimmäisellä kerralla jokainen raahaus näytetään
// haamukädellä, ja 8 s toimettomuuden jälkeen käsi näyttää seuraavan
// vaiheen. Kultainen vispilä, jos kaikki tilaukset osuivat ensimmäisellä
// ojennuksella eikä mikään palanut. Tehtävät: kaksi tavarantoimittajan
// käyntiä (kysymykseen vastaus kirjaimin, kirjoita sana kuvasta).

var BAKE_BASES = ['round', 'heart', 'cup', 'cookie', 'bun'];
var BAKE_FROSTS = ['pink', 'choco', 'white', 'lemon'];
var BAKE_FROST_COL = { pink: '#ff9ec6', choco: '#8a5236', white: '#fffaf2', lemon: '#ffe066' };
var BAKE_FROST_LINE = { pink: '#c0507e', choco: '#4a2614', white: '#a898b8', lemon: '#c0a020' };
var BAKE_DECOS = ['straw', 'cherry', 'candle', 'star'];
var BAKE_CUSTOMERS = ['bunny', 'hen', 'pig', 'sheep', 'cow', 'duck', 'pony', 'cat'];
// Tilaukset vaiheittain: ph 0 pohja + kuorrute, ph 1 + koristeet kuvina
// (määrä n[0]..n[1]), ph 2 numerot: 'two' kaksi lajia, 'sum' kynttilät
// laskuna, 'double' kaksi samanlaista leivosta.
var BAKE_PLAN = [
  { ph: 0 }, { ph: 0 }, { ph: 0 },
  { ph: 1, n: [1, 2] }, { ph: 1, n: [2, 3] }, { ph: 1, n: [1, 3] }, { ph: 1, n: [2, 3] },
  { ph: 2 }, { ph: 2 }, { ph: 2 }
];
var BAKE_PHASE_AT = [0, 3, 7];      // vaiheen ensimmäinen tilaus
var BAKE_TASK_AFTER = [3, 7];       // tehtävä, kun näin monta tilausta on valmiina
var BAKE_T = 2.4;                   // paistoaika (s)
var BAKE_GOLD = 2.6;                // kultainen ikkuna kellon jälkeen (s)
var BAKE_BURN_T = 0.8;              // tummuminen ikkunan jälkeen (s)
var BAKE_FROST_NEED = 4.2;          // sutimismatka leivoksen säteinä
var BAKE_FROST_HOLD = 0.25;         // paikallaan pidon kuorrutus per s
var BAKE_HINT_IDLE = 8;             // vihjekäsi toimettomuuden jälkeen (s)
var BAKE_SLOTS = [
  [0, -0.05], [-0.6, -0.2], [0.6, -0.2], [-0.32, 0.5], [0.32, 0.5], [-0.28, -0.62], [0.28, -0.62], [0, 0.66]
];
var BAKE_DOUGH = {
  raw: ['#f8e6c2', '#c4a272'],
  baked: ['#e9a556', '#94561c'],
  burnt: ['#4e3a32', '#221410']
};

var bake = {
  L: null, t: 0, idleT: 0, orders: [], oi: 0, served: 0, P: null, drag: null,
  cu: null, leavers: [], flow: 'enter', flowT: 0, taskIdx: 0, van: null,
  flies: [], puffs: [], shown: {}, perfect: true, burnt: 0, dayK: 0, bowlsK: 0,
  miss: null, hintStep: null, hintT: 0, bagHide: [-1, -1], bellT: 0, ovenRing: 0,
  stars: [], celT: 0, actions: [], winT: -1, frostTick: 0
};

// ---------- Asettelu ----------
function bakeLayout() {
  var W = viewW, H = viewH, L = { W: W, H: H }, i, sp4, sp5;
  L.left = H * 0.34;
  L.right = W - H * 0.40;
  L.cx = (L.left + L.right) / 2;
  L.cw = L.right - L.left;
  L.R = H * 0.075;
  L.tableY = H * 0.63;
  L.plate = { x: L.cx, y: H * 0.715 };
  sp4 = Math.min(L.cw / 4, H * 0.16);
  sp5 = Math.min((L.cw - H * 0.03) / 5, H * 0.15);
  L.bowls = [];
  L.bags = [];
  L.bins = [];
  for (i = 0; i < 4; i++) L.bowls.push({ x: L.cx + (i - 1.5) * sp4, y: H * 0.215 });
  for (i = 0; i < 4; i++) L.bags.push({ x: L.cx + (i - 1.5) * sp4, y: H * 0.405 });
  for (i = 0; i < 5; i++) L.bins.push({ x: L.cx + (i - 2) * sp5, y: H * 0.885 });
  L.oven = { x0: H * 0.03, x1: H * 0.31, y0: H * 0.27, y1: H * 0.70, cx: H * 0.17, wy0: H * 0.39, wy1: H * 0.64, dialY: H * 0.33 };
  L.oven.wcy = (L.oven.wy0 + L.oven.wy1) / 2;
  L.counterY = H * 0.64;
  L.cust = { x: W - H * 0.175, y: H * 0.72, s: H * 0.145 };
  L.bubble = { x: W - H * 0.215, y: H * 0.255 };
  L.win = { x0: L.right + H * 0.03, x1: W - H * 0.03, y0: H * 0.13, y1: H * 0.6 };
  L.clock = { x: L.right - H * 0.055, y: H * 0.075 };
  bake.L = L;
}
function bakeTopOf(base, R) {
  if (base === 'round') return { y: -R * 0.72, rx: R * 0.86, ry: R * 0.3 };
  if (base === 'heart') return { y: -R * 0.64, rx: R * 0.62, ry: R * 0.26 };
  if (base === 'cup') return { y: -R * 1.0, rx: R * 0.58, ry: R * 0.22 };
  if (base === 'cookie') return { y: -R * 0.22, rx: R * 0.8, ry: R * 0.3 };
  return { y: -R * 0.66, rx: R * 0.62, ry: R * 0.26 };
}
// Leivos lautasella: piirtokohta (pohjan keskikohta)
function bakePlatePos() { var L = bake.L; return { x: L.plate.x, y: L.plate.y - L.H * 0.012 }; }
function bakePastryCenter() { var p = bakePlatePos(); return { x: p.x, y: p.y - bake.L.R * 0.55 }; }
// Tarttumakohta vihjeelle: leivoksen kylki koristeiden alapuolella
function bakeGrabPt() {
  var p = bakePlatePos(), P = bake.P;
  return { x: p.x, y: p.y - bake.L.R * (P && P.base === 'cookie' ? -0.1 : 0.28) };
}
function bakeTopWorld(P) {
  var p = bakePlatePos(), T = bakeTopOf(P.base, bake.L.R);
  return { x: p.x, y: p.y + T.y, rx: T.rx, ry: T.ry };
}
function bakeSlotWorld(P, k) {
  var T = bakeTopWorld(P), s = BAKE_SLOTS[k];
  return { x: T.x + s[0] * T.rx, y: T.y + s[1] * T.ry };
}
function bakeDecoR() { return viewH * 0.03; }
function bakeOvenPastryPos() { var o = bake.L.oven; return { x: o.cx, y: o.wy1 - viewH * 0.035 }; }

// ---------- Värit ja pienet apurit ----------
function bakeDoughCol(cook, k) {
  var D = BAKE_DOUGH;
  if (cook <= 1) return artMix(D.raw[k], D.baked[k], Math.max(0, cook));
  return artMix(D.baked[k], D.burnt[k], Math.min(1, cook - 1));
}
function bakeEll(c, x, y, rx, ry) {
  c.beginPath();
  if (c.ellipse) c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  else { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); }
}
function bakeEllArc(c, x, y, rx, ry, a0, a1, ccw) {
  if (c.ellipse) { c.ellipse(x, y, rx, ry, 0, a0, a1, !!ccw); return; }
  c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, a0, a1, !!ccw); c.restore();
}
function bakeHeartPath(c, x, y, s, sy) {
  c.beginPath();
  c.moveTo(x, y + s * 0.55 * sy);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1 * sy, x - s * 0.4, y - s * 0.9 * sy, x, y - s * 0.25 * sy);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9 * sy, x + s * 1.1, y - s * 0.1 * sy, x, y + s * 0.55 * sy);
  c.closePath();
}
function bakeText(c, txt, x, y, size, col, line) {
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
function bakePuff(x, y, n, col, big) {
  var i;
  for (i = 0; i < n; i++) {
    if (bake.puffs.length > 60) bake.puffs.shift();
    bake.puffs.push({
      x: x + (Math.random() - 0.5) * viewH * 0.03, y: y + (Math.random() - 0.5) * viewH * 0.02,
      vx: (Math.random() - 0.5) * viewH * (big ? 0.25 : 0.12), vy: -viewH * (0.03 + Math.random() * 0.08),
      r: viewH * (big ? 0.025 : 0.014) * (0.7 + Math.random() * 0.6), t: 0, life: 0.8 + Math.random() * 0.6, col: col || '#ffffff'
    });
  }
}
function bakeAct() {
  bake.idleT = 0;
  bake.actions.push(bake.t);
}

// ---------- Tilaukset ----------
function bakePickDiff(n, prev) {
  var k = randInt(n);
  if (k === prev) k = (k + 1 + randInt(n - 1)) % n;
  return k;
}
function bakeCustomerList(n) {
  var out = [], pool = [], k;
  while (out.length < n) {
    if (!pool.length) pool = shuffleNums(BAKE_CUSTOMERS.slice());
    k = pool.shift();
    if (out.length && out[out.length - 1] === k) { pool.push(k); if (pool.length === 1) pool = shuffleNums(BAKE_CUSTOMERS.slice()); continue; }
    out.push(k);
  }
  return out;
}
function bakeMakeOrders() {
  var out = [], i, P, o, kinds = bakeCustomerList(BAKE_PLAN.length), lb = -1, lf = -1, late = shuffleNums(['two', 'sum', 'double']), li = 0;
  var midTypes = shuffleNums([0, 1, 2, 3]), mi = 0, a, b, t2;
  for (i = 0; i < BAKE_PLAN.length; i++) {
    P = BAKE_PLAN[i];
    lb = bakePickDiff(BAKE_BASES.length, lb);
    lf = bakePickDiff(BAKE_FROSTS.length, lf);
    o = {
      ph: P.ph, base: BAKE_BASES[lb], frost: BAKE_FROSTS[lf], decos: [], n: 1, got: 0, pics: P.ph === 1,
      kind: kinds[i], coat: randInt(5), mane: randInt(6), perfect: true, late: null
    };
    if (P.ph === 1) {
      o.decos.push({ type: BAKE_DECOS[midTypes[mi++ % 4]], n: P.n[0] + randInt(P.n[1] - P.n[0] + 1) });
    } else if (P.ph === 2) {
      o.late = late[li++];
      if (o.late === 'two') {
        t2 = shuffleNums([0, 1, 2, 3]);
        a = 2 + randInt(4);
        b = 1 + randInt(Math.min(3, 7 - a));
        o.decos.push({ type: BAKE_DECOS[t2[0]], n: a });
        o.decos.push({ type: BAKE_DECOS[t2[1]], n: b });
      } else if (o.late === 'sum') {
        a = 1 + randInt(3);
        b = 1 + randInt(3);
        o.base = Math.random() < 0.5 ? 'round' : 'heart';
        o.decos.push({ type: 'candle', n: a + b, sum: [a, b] });
      } else {
        o.n = 2;
        o.decos.push({ type: BAKE_DECOS[randInt(4)], n: 2 + randInt(3) });
      }
    }
    out.push(o);
  }
  return out;
}
function bakeOrder() { return bake.cu ? bake.cu.order : null; }
function bakePhase() {
  var i, p = 0;
  for (i = 0; i < BAKE_PHASE_AT.length; i++) if (bake.oi >= BAKE_PHASE_AT[i]) p = i;
  return p;
}
function bakeCount(P, type) {
  var i, n = 0;
  for (i = 0; i < P.decos.length; i++) if (P.decos[i].type === type) n++;
  return n;
}
// Ensimmäinen ero tilaukseen: null = kaikki oikein
function bakeCheck(P, o) {
  var i, types = {};
  if (P.cook < 1) return { part: 'bake' };
  if (P.base !== o.base) return { part: 'base' };
  if (P.frost !== o.frost) return { part: 'frost' };
  for (i = 0; i < o.decos.length; i++) {
    types[o.decos[i].type] = true;
    if (bakeCount(P, o.decos[i].type) !== o.decos[i].n) return { part: 'deco', i: i };
  }
  for (i = 0; i < P.decos.length; i++) if (!types[P.decos[i].type]) return { part: 'extra', type: P.decos[i].type };
  return null;
}

// ---------- Alustus ----------
function initBakery() {
  tasks = [makeTask(-5, 'answer', { minLen: 4, maxLen: 9 }), makeTask(-5, 'spell', { minLen: 4, maxLen: 7 })];
  tasks[0].x = -1e6;
  tasks[1].x = -1e6;
  camX = 0;
  bakeLayout();
  bake.t = 0;
  bake.idleT = 0;
  bake.orders = bakeMakeOrders();
  bake.oi = 0;
  bake.served = 0;
  bake.P = null;
  bake.drag = null;
  bake.leavers = [];
  bake.flies = [];
  bake.puffs = [];
  bake.shown = {};
  bake.perfect = true;
  bake.burnt = 0;
  bake.dayK = 0;
  bake.bowlsK = 0;
  bake.miss = null;
  bake.hintStep = null;
  bake.hintT = 0;
  bake.taskIdx = 0;
  bake.van = null;
  bake.stars = [];
  bake.celT = 0;
  bake.actions = [];
  bake.winT = -1;
  bake.bellT = 0;
  bake.ovenRing = 0;
  bake.frostTick = 0;
  bake.cu = null;
  bakeNextCustomer();
  bakeSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.3);
  playNote(659, 0.14, 0.2, 'triangle', 0.3);
  playNote(784, 0.28, 0.35, 'triangle', 0.3);
}
function respawnBakery() {}
function resizeBakery() {
  camX = 0;
  bakeLayout();
  bakeSetupProps();
}
function bakeNextCustomer() {
  var o = bake.orders[bake.oi];
  if (!o) { bake.cu = null; return; }
  bake.cu = {
    order: o, kind: o.kind, x: bake.L.W + viewH * 0.25, state: 'enter', t: 0,
    hop: 0, lookT: 0, waveT: 0, shakeT: 0, sighT: 0, joyT: 0, hold: [], pop: 0
  };
  bake.flow = 'enter';
  bake.flowT = 0;
}

// ---------- Syöte ----------
function handleBakeryTap(px, py) {
  var L = bake.L, P = bake.P, i, d, o, c, R = L.R, s;
  if (!running || celebrating || puzzleBusy()) return;
  bake.idleT = 0;
  if (bake.drag) return;
  // Valmis leivos uunista
  o = L.oven;
  if (P && P.where === 'oven' && px > o.x0 - R * 0.3 && px < o.x1 + R * 0.3 && py > o.y0 && py < o.y1 + R * 0.3) {
    if (P.ovenT >= BAKE_T) { bakeStartDrag('past', px, py, { from: 'oven' }); return; }
    // Vielä paistumassa: uunin valo värähtää
    bake.ovenRing = Math.max(bake.ovenRing, 0.3);
    playNote(220, 0, 0.08, 'sine', 0.15);
    return;
  }
  if (P && P.where === 'plate') {
    // Koriste pois leivokselta
    for (i = P.decos.length - 1; i >= 0; i--) {
      s = bakeSlotWorld(P, P.decos[i].slot);
      d = Math.hypot(px - s.x, py - (s.y - bakeDecoR() * 0.6));
      if (d < bakeDecoR() * 0.8) { bakeStartDrag('deco', px, py, { type: P.decos[i].type, from: 'pastry', slot: P.decos[i].slot }); P.decos.splice(i, 1); return; }
    }
    c = bakePastryCenter();
    if (Math.hypot(px - c.x, (py - c.y) * 1.2) < R * 1.45) { bakeStartDrag('past', px, py, { from: 'plate' }); return; }
  }
  for (i = 0; i < L.bags.length; i++) {
    if (bake.bagHide[0] === i) continue;
    if (Math.hypot(px - L.bags[i].x, py - L.bags[i].y) < viewH * 0.068) { bakeStartDrag('bag', px, py, { frost: BAKE_FROSTS[i], idx: i }); return; }
  }
  if (bake.bowlsK > 0.9) {
    for (i = 0; i < L.bowls.length; i++) {
      if (Math.hypot(px - L.bowls[i].x, py - L.bowls[i].y) < viewH * 0.07) { bakeStartDrag('deco', px, py, { type: BAKE_DECOS[i], from: 'bowl' }); return; }
    }
  }
  for (i = 0; i < L.bins.length; i++) {
    if (Math.hypot(px - L.bins[i].x, py - L.bins[i].y) < viewH * 0.068) {
      if (P) {
        // Lautasella tai uunissa on jo leivos: laatikko hölskähtää
        bake.binShake = { i: i, t: 0.4 };
        playNote(196, 0, 0.12, 'triangle', 0.15);
        bakeAct();
        return;
      }
      bakeStartDrag('base', px, py, { base: BAKE_BASES[i], idx: i });
      return;
    }
  }
  if (bakeCustomerTap(px, py)) return;
  propsTap(px, py);
}
function bakeStartDrag(kind, px, py, o) {
  var d = { kind: kind, x: px, y: py, moved: 0, lx: px, ly: py };
  var k;
  for (k in o) if (o.hasOwnProperty(k)) d[k] = o[k];
  if (kind === 'past') {
    var P = bake.P, pos;
    if (d.from === 'oven') {
      pos = bakeOvenPastryPos();
      // Ulos uunista: kultainen ikkuna vai vähän palanut
      P.cook = P.ovenT > BAKE_T + BAKE_GOLD ? 2 : 1;
      if (P.cook >= 2) { P.burnt = true; bake.burnt++; }
      P.ovenT = 0;
      playNote(330, 0, 0.1, 'square', 0.08);
      playNote(660, 0.05, 0.12, 'triangle', 0.2);
    } else {
      pos = bakePlatePos();
    }
    d.x = pos.x;
    d.y = pos.y - bake.L.R * 0.5;
    P.where = 'drag';
  }
  if (kind === 'bag') bake.bagHide = [d.idx, 0];
  bake.drag = d;
  playNote(880, 0, 0.07, 'sine', 0.18);
  bakeAct();
}
function bakeCustomerTap(px, py) {
  var cu = bake.cu, L = bake.L;
  if (!cu || Math.abs(px - cu.x) > viewH * 0.11 || py < viewH * 0.38 || py > L.counterY + viewH * 0.02) return false;
  cu.hop = 0.45;
  cu.pop = 0.3;
  bakeAnimalSound(cu.kind);
  spawnSparkles(cu.x, viewH * 0.48, 6, '#ff9ec6');
  return true;
}
function bakeAnimalSound(kind) {
  if (kind === 'cat') { playNote(784, 0, 0.12, 'triangle', 0.22); playNote(988, 0.1, 0.12, 'triangle', 0.22); playNote(740, 0.22, 0.2, 'triangle', 0.18); return; }
  if (kind === 'pony') { playNote(523, 0, 0.08, 'square', 0.07); playNote(659, 0.08, 0.08, 'square', 0.07); playNote(784, 0.16, 0.08, 'square', 0.07); playNote(587, 0.24, 0.16, 'square', 0.07); return; }
  trainAnimalSound(kind);
}

// ---------- Raahaus ja pudotus ----------
function bakeUpdateDrag(dt) {
  var d = bake.drag, k, tx, ty, mv;
  if (!d) return;
  if (holding) {
    k = Math.min(1, dt * 20);
    tx = lastPX;
    ty = lastPY;
    if (d.kind === 'past') ty = lastPY + bake.L.R * 0.45;
    if (d.kind === 'deco') ty = lastPY + bakeDecoR() * 0.4;
    d.x += (tx - d.x) * k;
    d.y += (ty - d.y) * k;
    mv = Math.hypot(lastPX - d.lx, lastPY - d.ly);
    d.moved += mv;
    if (d.kind === 'bag') bakeFrostAt(lastPX, lastPY, mv, dt);
    d.lx = lastPX;
    d.ly = lastPY;
    return;
  }
  bake.drag = null;
  bakeDrop(d, lastPX, lastPY);
}
function bakeDrop(d, px, py) {
  var L = bake.L, P = bake.P, c, o = L.oven, best, bd, i, s, dd, T, used, pl;
  if (d.kind === 'base') {
    pl = L.plate;
    if (!P && Math.hypot(px - pl.x, py - (pl.y - viewH * 0.03)) < viewH * 0.17) {
      bake.P = { base: d.base, cook: 0, ovenT: 0, frost: null, cov: 0, covCol: null, blobs: [], decos: [], where: 'plate', pop: 0.35, burnt: false };
      c = bakePlatePos();
      artPop(c.x, c.y - L.R * 0.4, L.R * 1.2, '#ffe0b0', 'ring');
      bakePuff(c.x, c.y - L.R * 0.2, 4, '#fff6e8');
      playNote(330, 0, 0.1, 'sine', 0.3);
      playNote(495, 0.06, 0.14, 'triangle', 0.25);
      bake.shown.base = true;
      bakeAct();
    } else {
      bakeFly('base', d.x, d.y, L.bins[d.idx].x, L.bins[d.idx].y, { base: d.base });
    }
    return;
  }
  if (d.kind === 'past') {
    // Uuniin (vain raaka leivos)
    if (P.cook < 1 && px < o.x1 + viewH * 0.06 && py > o.y0 - viewH * 0.06 && py < o.y1 + viewH * 0.08) {
      P.where = 'oven';
      P.ovenT = 0;
      P.rang = false;
      playNote(147, 0, 0.18, 'square', 0.1);
      playNote(220, 0.08, 0.2, 'triangle', 0.2);
      bake.shown.oven = true;
      bakeAct();
      return;
    }
    // Asiakkaalle
    if (bake.cu && bake.cu.state === 'wait' && px > L.right - viewH * 0.04 && py < L.counterY + viewH * 0.16) {
      bakeDeliver(d);
      return;
    }
    // Taikinalaatikkoon: leivos pois (vain lautaselta, ei uunista tullut)
    if (d.from === 'plate' && py > L.bins[0].y - viewH * 0.085 && px > L.left - viewH * 0.02 && px < L.right + viewH * 0.02) {
      bakePuff(px, py, 8, '#fff6e8', true);
      playNote(392, 0, 0.1, 'sine', 0.25);
      playNote(262, 0.08, 0.16, 'sine', 0.2);
      bake.P = null;
      bake.shown.discard = true;
      bakeAct();
      return;
    }
    if (d.from === 'oven') bake.shown.out = true;
    bakePastryHome(d.x, d.y);
    return;
  }
  if (d.kind === 'bag') {
    bakeFly('bag', d.x, d.y, L.bags[d.idx].x, L.bags[d.idx].y, { idx: d.idx });
    return;
  }
  if (d.kind === 'deco') {
    if (P && P.where === 'plate' && P.cook >= 1) {
      T = bakeTopWorld(P);
      if (Math.hypot(px - T.x, py - T.y) < viewH * 0.13 && P.decos.length < BAKE_SLOTS.length) {
        used = {};
        for (i = 0; i < P.decos.length; i++) used[P.decos[i].slot] = true;
        best = -1; bd = 1e9;
        for (i = 0; i < BAKE_SLOTS.length; i++) {
          if (used[i]) continue;
          s = bakeSlotWorld(P, i);
          dd = Math.hypot(px - s.x, py - s.y);
          if (dd < bd) { bd = dd; best = i; }
        }
        P.decos.push({ type: d.type, slot: best, pop: 0.3 });
        s = bakeSlotWorld(P, best);
        artPop(s.x, s.y - bakeDecoR() * 0.5, bakeDecoR() * 1.3, '#ffffff', 'ring');
        spawnSparkles(s.x, s.y - bakeDecoR() * 0.5, 4, '#ffe27a');
        playNote(880 + P.decos.length * 70, 0, 0.12, 'triangle', 0.3);
        bake.shown.decoAdd = true;
        bakeAct();
        return;
      }
      if (P.cook < 1) P.wob = 0.4;
    } else if (P && P.where === 'plate') {
      P.wob = 0.4;
    }
    // Leivokselta otettu koriste lähtee pois vain hyllyn kulhoon; muualle
    // pudotettu (esim. vahingossa asiakkaalle) palaa omalle paikalleen
    if (d.from === 'pastry' && P && P.where === 'plate' && py > L.bags[0].y + viewH * 0.09) {
      P.decos.push({ type: d.type, slot: d.slot, pop: 0.3 });
      P.wob = 0.3;
      playNote(660, 0, 0.1, 'triangle', 0.2);
      return;
    }
    if (d.from === 'pastry') { bake.shown.decoRemove = true; bakeAct(); }
    i = BAKE_DECOS.indexOf(d.type);
    bakeFly('deco', d.x, d.y, L.bowls[i].x, L.bowls[i].y - viewH * 0.01, { type: d.type });
  }
}
function bakePastryHome(x, y) {
  var P = bake.P;
  P.where = 'fly';
  P.fly = { x0: x, y0: y, t: 0 };
}
function bakeFly(kind, x0, y0, x1, y1, o) {
  var f = { kind: kind, x0: x0, y0: y0, x1: x1, y1: y1, t: 0, dur: 0.4, o: o || {} };
  bake.flies.push(f);
  if (kind === 'bag') bake.bagHide = [o.idx, 1];
  return f;
}
// Kuorrutus: pussin kärki (sormen kohdalla) leivoksen päällä
function bakeFrostAt(px, py, mv, dt) {
  var P = bake.P, d = bake.drag, T, u, v, r, col, gain;
  if (!P || P.where !== 'plate') return;
  T = bakeTopWorld(P);
  u = (px - T.x) / (T.rx * 1.45);
  v = (py - viewH * 0.012 - T.y) / (T.ry * 2.6);
  if (u * u + v * v > 1) return;
  if (P.cook < 1) {
    // Raaka taikina: kuorrute ei tartu, leivos hytkähtää
    if (!P.wob || P.wob <= 0) { P.wob = 0.4; playNote(196, 0, 0.1, 'sine', 0.12); }
    return;
  }
  col = d.frost;
  if (P.covCol !== col) { P.covCol = col; P.cov = 0; }
  gain = mv / (bake.L.R * BAKE_FROST_NEED) + dt * BAKE_FROST_HOLD;
  P.cov += gain;
  d.trail = (d.trail || 0) + mv;
  if (d.trail > bake.L.R * 0.22 || !P.blobs.length) {
    d.trail = 0;
    r = Math.hypot(u, v);
    if (r > 0.8) { u = u / r * 0.8; v = v / r * 0.8; }
    if (P.blobs.length > 40) P.blobs.shift();
    P.blobs.push({ u: u * 1.1, v: v * 1.1, col: col });
  }
  bake.frostTick -= dt;
  if (mv > 1 && bake.frostTick <= 0) {
    bake.frostTick = 0.12;
    playNote(500 + Math.random() * 300, 0, 0.05, 'sine', 0.08);
  }
  if (P.cov >= 1) {
    P.frost = col;
    P.cov = 0;
    P.covCol = null;
    P.blobs = [];
    P.pop = 0.3;
    artPop(T.x, T.y, bake.L.R * 1.4, BAKE_FROST_COL[col], 'ring');
    spawnSparkles(T.x, T.y, 10, BAKE_FROST_COL[col]);
    playNote(659, 0, 0.12, 'triangle', 0.3);
    playNote(880, 0.08, 0.12, 'triangle', 0.3);
    playNote(1175, 0.16, 0.2, 'triangle', 0.3);
    bake.shown.frost = true;
    bakeAct();
  }
}

// ---------- Ojennus asiakkaalle ----------
function bakeDeliver(d) {
  var cu = bake.cu, o = cu.order, P = bake.P, miss = bakeCheck(P, o), i, n;
  if (miss) {
    // Ei rangaistusta: asiakas osoittaa kuplan väärää kohtaa, leivos palaa
    o.perfect = false;
    bake.perfect = false;
    bake.miss = { part: miss.part, i: miss.i, t: 2.6 };
    cu.shakeT = 0.9;
    cu.waveT = 1.6;
    playNote(392, 0, 0.16, 'triangle', 0.25);
    playNote(330, 0.16, 0.24, 'triangle', 0.25);
    bakePastryHome(d.x, d.y);
    bake.shown.deliver = true;
    bakeAct();
    return;
  }
  if (P.burnt) o.perfect = false;
  cu.hold.push(P);
  o.got++;
  bake.P = null;
  bake.miss = null;
  bake.shown.deliver = true;
  bakeAct();
  cu.joyT = 1.2;
  cu.hop = 0.5;
  if (P.burnt) {
    // Vähän palanut: hassu huokaus, mutta kelpaa
    cu.sighT = 1.4;
    bakePuff(cu.x - viewH * 0.05, viewH * 0.47, 5, '#9a8a8a');
    playNote(330, 0, 0.3, 'sawtooth', 0.06);
    playNote(247, 0.25, 0.4, 'sawtooth', 0.06);
  }
  for (i = 0; i < 6; i++) playNote([523, 659, 784, 1047, 1319, 1568][i], 0.05 + i * 0.07, 0.18, 'triangle', 0.25);
  spawnSparkles(cu.x, viewH * 0.5, 14, '#ff9ec6');
  // Kolikot kassaan
  n = 3;
  for (i = 0; i < n; i++) bakeFly('coin', cu.x - viewH * 0.04, viewH * 0.55, bake.L.right + viewH * 0.045, bake.L.counterY - viewH * 0.04, { delay: i * 0.12 });
  if (o.got >= o.n) {
    bakeFly('star', cu.x, viewH * 0.45, bakeHudSlot(bake.oi).x, bakeHudSlot(bake.oi).y, { gold: o.perfect, idx: bake.oi, delay: 0.3 });
    cu.state = 'happy';
    cu.t = 0;
    bake.flow = 'happy';
    bake.flowT = 0;
  }
}

// ---------- Päivitys ----------
function updateBakery(dt) {
  var busy, i, f, P = bake.P, cu, target, o;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  bakeUpdateFx(dt);
  if (celebrating) { bake.celT += dt; return; }
  busy = puzzleBusy();
  if (busy) return;
  bake.t += dt;
  if (!holding) bake.idleT += dt;
  target = bakePhase();
  bake.dayK += Math.max(-dt * 0.3, Math.min(dt * 0.3, target - bake.dayK));
  if (target >= 1 && bake.bowlsK < 1) {
    if (bake.bowlsK === 0) { playNote(784, 0, 0.15, 'triangle', 0.3); playNote(1047, 0.12, 0.25, 'triangle', 0.3); }
    bake.bowlsK = Math.min(1, bake.bowlsK + dt * 1.5);
  }
  bakeUpdateDrag(dt);
  // Uuni
  if (P && P.where === 'oven') {
    P.ovenT += dt;
    if (P.ovenT < BAKE_T) P.cook = P.ovenT / BAKE_T;
    else if (P.ovenT < BAKE_T + BAKE_GOLD) P.cook = 1;
    else P.cook = 1 + Math.min(1, (P.ovenT - BAKE_T - BAKE_GOLD) / BAKE_BURN_T);
    if (P.ovenT >= BAKE_T && !P.rang) {
      P.rang = true;
      bake.ovenRing = 1.2;
      playNote(1568, 0, 0.5, 'sine', 0.3);
      playNote(2093, 0.12, 0.6, 'sine', 0.25);
      spawnSparkles(bake.L.oven.cx, bake.L.oven.wcy, 12, '#ffd24f');
    }
    if (P.cook > 1.2 && Math.random() < dt * 4) bakePuff(bake.L.oven.cx + (Math.random() - 0.5) * viewH * 0.1, bake.L.oven.y0, 1, '#8a8080');
  }
  if (P && P.where === 'fly') {
    P.fly.t += dt;
    if (P.fly.t >= 0.35) { P.where = 'plate'; P.pop = 0.25; }
  }
  if (P && P.burnt && P.where === 'plate' && Math.random() < dt * 1.5) {
    o = bakePastryCenter();
    bakePuff(o.x + (Math.random() - 0.5) * bake.L.R, o.y - bake.L.R * 0.5, 1, '#9a9090');
  }
  bakeUpdateFlow(dt);
  // Vihje
  bake.hintStep = bakeNextStep();
  if (bake.hintStep && !holding && !bake.drag && (!bake.shown[bake.hintStep.kind] || bake.idleT > BAKE_HINT_IDLE)) bake.hintT += dt;
  else bake.hintT = 0;
}
function bakeUpdateFx(dt) {
  var i, f, p, cu = bake.cu, P = bake.P;
  for (i = bake.flies.length - 1; i >= 0; i--) {
    f = bake.flies[i];
    f.t += dt;
    if (f.t - (f.o.delay || 0) >= f.dur) {
      bake.flies.splice(i, 1);
      if (f.kind === 'bag') bake.bagHide = [-1, 0];
      if (f.kind === 'coin') { playNote(1319 + Math.random() * 200, 0, 0.08, 'sine', 0.15); bake.regPop = 0.25; }
      if (f.kind === 'star') {
        bake.stars[f.o.idx] = f.o.gold ? 2 : 1;
        bake.starPop = 0.4;
        spawnSparkles(f.x1, f.y1, 10, f.o.gold ? '#ffd24f' : '#ffffff');
        playNote(1047, 0, 0.15, 'triangle', 0.3);
        playNote(1568, 0.1, 0.25, 'triangle', 0.3);
      }
    }
  }
  for (i = bake.puffs.length - 1; i >= 0; i--) {
    p = bake.puffs[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 2);
    if (p.t > p.life) bake.puffs.splice(i, 1);
  }
  if (bake.miss) { bake.miss.t -= dt; if (bake.miss.t <= 0) bake.miss = null; }
  if (bake.ovenRing > 0) bake.ovenRing -= dt;
  if (bake.bellT > 0) bake.bellT -= dt;
  if (bake.regPop > 0) bake.regPop -= dt;
  if (bake.starPop > 0) bake.starPop -= dt;
  if (bake.binShake && bake.binShake.t > 0) bake.binShake.t -= dt;
  if (P) {
    if (P.pop > 0) P.pop -= dt;
    if (P.wob > 0) P.wob -= dt;
    for (i = 0; i < P.decos.length; i++) if (P.decos[i].pop > 0) P.decos[i].pop -= dt;
  }
  if (cu) bakeCustFx(cu, dt);
  for (i = 0; i < bake.leavers.length; i++) bakeCustFx(bake.leavers[i], dt);
  if (bake.van) {
    bake.van.t += dt;
    if (bake.van.leave >= 0 && bake.van.t - bake.van.leave > 1.5) bake.van = null;
  }
}
function bakeCustFx(cu, dt) {
  cu.t += dt;
  if (cu.hop > 0) cu.hop -= dt;
  if (cu.lookT > 0) cu.lookT -= dt;
  if (cu.waveT > 0) cu.waveT -= dt;
  if (cu.shakeT > 0) cu.shakeT -= dt;
  if (cu.sighT > 0) cu.sighT -= dt;
  if (cu.joyT > 0) cu.joyT -= dt;
  if (cu.pop > 0) cu.pop -= dt;
}
// Asiakasvirta: tulo -> odotus -> ilo -> lähtö (+ toimittaja ja tehtävä)
function bakeUpdateFlow(dt) {
  var cu = bake.cu, L = bake.L, i, lv, sp = viewH * 0.75;
  for (i = bake.leavers.length - 1; i >= 0; i--) {
    lv = bake.leavers[i];
    lv.x += sp * dt;
    if (lv.x > L.W + viewH * 0.35) bake.leavers.splice(i, 1);
  }
  bake.flowT += dt;
  if (bake.flow === 'enter' && cu) {
    cu.x -= sp * dt;
    if (cu.x <= L.cust.x) {
      cu.x = L.cust.x;
      cu.state = 'wait';
      cu.pop = 0.4;
      bake.flow = 'wait';
      bake.flowT = 0;
      bakeAnimalSound(cu.kind);
    }
    return;
  }
  if (bake.flow === 'happy') {
    if (bake.flowT < 1.3) return;
    cu.state = 'leave';
    bake.leavers.push(cu);
    bake.oi++;
    bake.served++;
    bake.cu = null;
    if (bake.oi >= bake.orders.length) { bake.flow = 'end'; bake.flowT = 0; return; }
    if (bake.taskIdx < BAKE_TASK_AFTER.length && bake.served === BAKE_TASK_AFTER[bake.taskIdx]) {
      bake.flow = 'van';
      bake.flowT = 0;
      bake.van = { t: 0, leave: -1 };
      playNote(392, 0, 0.12, 'square', 0.08);
      playNote(392, 0.18, 0.12, 'square', 0.08);
      return;
    }
    if (BAKE_PHASE_AT.indexOf(bake.oi) > 0) bakePhaseChime();
    bakeNextCustomer();
    return;
  }
  if (bake.flow === 'van') {
    if (bake.flowT < 1.4) return;
    bakeCancelDrag();
    bake.flow = 'task';
    bake.flowT = 0;
    taskStart(tasks[bake.taskIdx]);
    return;
  }
  if (bake.flow === 'task') {
    if (!tasks[bake.taskIdx].opened) return;
    bake.taskIdx++;
    bake.van.leave = bake.van.t;
    if (BAKE_PHASE_AT.indexOf(bake.oi) > 0) bakePhaseChime();
    bakeNextCustomer();
    return;
  }
  if (bake.flow === 'end') {
    if (bake.flowT > 1.4 && !bake.drag) {
      bake.flow = 'done';
      startCelebration();
      if (bake.perfect && !bake.burnt) spawnSparkles(viewW / 2, viewH * 0.45, 30, '#ffd24f');
    }
  }
}
function bakePhaseChime() {
  var i;
  for (i = 0; i < 4; i++) playNote([659, 784, 988, 1319][i], i * 0.12, 0.25, 'triangle', 0.25);
}
function bakeCancelDrag() {
  var d = bake.drag;
  if (!d) return;
  bake.drag = null;
  if (d.kind === 'past') bakePastryHome(d.x, d.y);
  else if (d.kind === 'bag') bakeFly('bag', d.x, d.y, bake.L.bags[d.idx].x, bake.L.bags[d.idx].y, { idx: d.idx });
  else if (d.kind === 'deco') bakeFly('deco', d.x, d.y, bake.L.bowls[BAKE_DECOS.indexOf(d.type)].x, bake.L.bowls[BAKE_DECOS.indexOf(d.type)].y, { type: d.type });
  else bakeFly('base', d.x, d.y, bake.L.bins[d.idx].x, bake.L.bins[d.idx].y, { base: d.base });
}

// Seuraava vaihe (vihjekäsi ja testibotti): mistä mihin raahataan
function bakeNextStep() {
  var cu = bake.cu, o, P = bake.P, L = bake.L, i, n, c, T, k, s;
  if (!cu || cu.state !== 'wait' || bake.flow !== 'wait') return null;
  o = cu.order;
  if (!P) {
    i = BAKE_BASES.indexOf(o.base);
    return { kind: 'base', from: { x: L.bins[i].x, y: L.bins[i].y }, to: { x: L.plate.x, y: L.plate.y - viewH * 0.03 }, base: o.base };
  }
  if (P.where === 'fly' || P.where === 'drag') return null;
  c = bakeGrabPt();
  if (P.where === 'oven') {
    if (P.ovenT < BAKE_T) return null;
    return { kind: 'out', from: { x: L.oven.cx, y: L.oven.wcy }, to: { x: c.x, y: c.y } };
  }
  if (P.base !== o.base) {
    i = BAKE_BASES.indexOf(P.base);
    return { kind: 'discard', from: c, to: { x: L.bins[i].x, y: L.bins[i].y } };
  }
  if (P.cook < 1) return { kind: 'oven', from: c, to: { x: L.oven.cx, y: L.oven.wcy } };
  T = bakeTopWorld(P);
  if (P.frost !== o.frost) {
    i = BAKE_FROSTS.indexOf(o.frost);
    return { kind: 'frost', from: { x: L.bags[i].x, y: L.bags[i].y }, to: { x: T.x, y: T.y + viewH * 0.012 }, rx: T.rx, frost: o.frost };
  }
  // Ylimääräiset koristeet pois, puuttuvat lisää
  for (k = P.decos.length - 1; k >= 0; k--) {
    n = 0;
    for (i = 0; i < o.decos.length; i++) if (o.decos[i].type === P.decos[k].type) n = o.decos[i].n;
    if (bakeCount(P, P.decos[k].type) > n) {
      s = bakeSlotWorld(P, P.decos[k].slot);
      i = BAKE_DECOS.indexOf(P.decos[k].type);
      return { kind: 'decoRemove', from: { x: s.x, y: s.y - bakeDecoR() * 0.5 }, to: { x: L.bowls[i].x, y: L.bowls[i].y }, type: P.decos[k].type };
    }
  }
  for (i = 0; i < o.decos.length; i++) {
    if (bakeCount(P, o.decos[i].type) < o.decos[i].n) {
      k = BAKE_DECOS.indexOf(o.decos[i].type);
      return { kind: 'decoAdd', from: { x: L.bowls[k].x, y: L.bowls[k].y }, to: { x: T.x, y: T.y }, type: o.decos[i].type };
    }
  }
  return { kind: 'deliver', from: c, to: { x: L.cust.x - viewH * 0.02, y: viewH * 0.52 } };
}

// ---------- Tökättävät ----------
// Vatkain (pyörii ja pöllyttää jauhoja; joka 3.: nonparelliryöppy, 5.:
// muffinssi pomppaa kulhosta), keksipurkki (keksi hyppää ulos, 5.:
// kultainen keksi), kassakone (kolikoita, 5.: kolikkosade ja tähtikolikko),
// tiskikello (asiakas katsoo ylös), keittiökello (viisarit pyörivät, 3.:
// käkipupu), kissa uunin päällä (miukuu, 3.: sydämiä, nukkuu kun uuni on
// lämmin), jauhosäkki (pöllähdys, 3.: hiiri kurkkaa, 5.: iso pilvi) ja
// kaulin (rullaa, 3.: piparkakkupupu hyppää).
function bakeSetupProps() {
  var L = bake.L, H = viewH;
  propsReset();
  propAdd({
    x: L.right - H * 0.075, y: L.tableY + H * 0.01, r: H * 0.075, hy: H * 0.07, color: '#ffffff', note: 600, amp: 0.05, spin: 0, ang: 0,
    update: function (p, dt) { if (p.spin > 0) { p.spin -= dt; p.ang += dt * 30; } },
    draw: function (c, p) { bakeDrawMixer(c, H, p); },
    poke: function (p) {
      p.spin = 1.2;
      bakePuff(p.x, p.y - H * 0.1, 6, '#ffffff');
      playNote(220, 0, 0.5, 'sawtooth', 0.04);
      playNote(233, 0.1, 0.5, 'sawtooth', 0.04);
      if (p.n % 3 === 0) {
        spawnSparkles(p.x, p.y - H * 0.12, 6, '#ff7bac');
        spawnSparkles(p.x, p.y - H * 0.12, 6, '#5fa8ff');
        spawnSparkles(p.x, p.y - H * 0.12, 6, '#ffe27a');
      }
      if (p.n % 5 === 0) {
        propDrop({
          x: p.x - H * 0.02, y: p.y - H * 0.08, vx: -H * 0.25, vy: -H * 0.7, ground: L.tableY + H * 0.015, life: 2.4,
          draw: function (c) { bakeDrawPastry(c, { base: 'cup', cook: 1, frost: 'pink', blobs: [], decos: [{ type: 'cherry', slot: 0 }] }, 0, H * 0.02, H * 0.028, { noShadow: true }); }
        });
        playNote(988, 0.1, 0.12, 'triangle', 0.25);
      }
    }
  });
  propAdd({
    x: L.oven.x1 - H * 0.055, y: L.oven.y0, r: H * 0.055, hy: H * 0.045, color: '#ffd9a0', note: 700, amp: 0.08, lid: 0,
    update: function (p, dt) { if (p.lid > 0) p.lid -= dt; },
    draw: function (c, p) { bakeDrawJar(c, H, p); },
    poke: function (p) {
      var gold = p.n % 5 === 0;
      p.lid = 0.6;
      playNote(1047, 0, 0.06, 'sine', 0.15);
      playNote(gold ? 1568 : 784, 0.12, 0.15, 'triangle', 0.25);
      propDrop({
        x: p.x, y: p.y - H * 0.06, vx: H * 0.12, vy: -H * 0.6, ground: L.oven.y0 - H * 0.004, life: 2.2,
        draw: function (c) {
          if (gold) artGlow(c, 0, 0, H * 0.03, '#ffe27a', 0.5);
          artBlob(c, 0, 0, H * 0.016, H * 0.011, gold ? '#ffd24f' : '#d99a50', { lineColor: gold ? '#a07010' : '#8a5020', hi: 0.4 });
          if (!gold) { c.fillStyle = '#5a3018'; c.fillRect(-H * 0.006, -H * 0.004, H * 0.004, H * 0.003); c.fillRect(H * 0.004, H * 0.001, H * 0.004, H * 0.003); }
        }
      });
      if (gold) spawnSparkles(p.x, p.y - H * 0.08, 14, '#ffd24f');
    }
  });
  propAdd({
    x: H * 0.1, y: L.oven.y0, r: H * 0.06, hy: H * 0.045, color: '#ffb870', note: 880, amp: 0.06, heart: 0,
    update: function (p, dt) { if (p.heart > 0) p.heart -= dt; },
    draw: function (c, p) { bakeDrawCat(c, 0, 0, H * 0.05, { sleep: bake.P && bake.P.where === 'oven' && p.t < 0, tail: p.t >= 0 ? Math.sin(p.t * 12) : 0, face: 1, heart: p.heart }); },
    poke: function (p) {
      bakeAnimalSound('cat');
      if (p.n % 3 === 0) { p.heart = 1.6; spawnSparkles(p.x, p.y - H * 0.08, 8, '#ff7bac'); }
    }
  });
  propAdd({
    x: L.right + H * 0.045, y: L.counterY, r: H * 0.06, hy: H * 0.04, color: '#ffd24f', note: 1319, amp: 0.05, layer: 1, open: 0,
    update: function (p, dt) { if (p.open > 0) p.open -= dt; },
    draw: function (c, p) { bakeDrawRegister(c, H, p); },
    poke: function (p) {
      var i, n = p.n % 5 === 0 ? 6 : 2, big;
      p.open = 0.8;
      playNote(1568, 0, 0.1, 'square', 0.06);
      playNote(2093, 0.1, 0.25, 'sine', 0.2);
      for (i = 0; i < n; i++) {
        big = p.n % 5 === 0 && i === 0;
        propDrop({
          x: p.x + H * 0.02, y: p.y - H * 0.03, vx: H * (0.1 + Math.random() * 0.25) * (Math.random() < 0.5 ? -1 : 1), vy: -H * (0.5 + Math.random() * 0.4),
          ground: L.counterY - H * 0.022, life: 2, big: big,
          draw: function (c, d) {
            if (d.big) { drawStar(c, 0, 0, H * 0.02, 0, 0.6); return; }
            artCircle(c, 0, 0, H * 0.011, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
          }
        });
      }
    }
  });
  propAdd({
    x: L.W - H * 0.06, y: L.counterY, r: H * 0.05, hy: H * 0.025, color: '#ffe27a', note: 1760, amp: 0.1, layer: 1,
    draw: function (c) { bakeDrawBell(c, H); },
    poke: function () {
      bake.bellT = 0.6;
      playNote(1760, 0, 0.5, 'sine', 0.3);
      playNote(2637, 0, 0.35, 'sine', 0.1);
      if (bake.cu) { bake.cu.lookT = 0.8; bake.cu.hop = 0.35; bake.cu.pop = 0.3; }
    }
  });
  propAdd({
    x: L.clock.x, y: L.clock.y + H * 0.045, r: H * 0.05, hy: H * 0.045, color: '#ffffff', note: 988, amp: 0.06, spin: 0, ang: 0, cuck: 0,
    update: function (p, dt) {
      if (p.spin > 0) { p.spin -= dt; p.ang += dt * 14; }
      if (p.cuck > 0) p.cuck -= dt;
    },
    draw: function (c, p) { bakeDrawClock(c, H, p); },
    poke: function (p) {
      p.spin = 1;
      playNote(1319, 0, 0.05, 'square', 0.05);
      playNote(1175, 0.15, 0.05, 'square', 0.05);
      if (p.n % 3 === 0) {
        p.cuck = 1.6;
        playNote(784, 0.3, 0.22, 'sine', 0.3);
        playNote(622, 0.55, 0.3, 'sine', 0.3);
        playNote(784, 0.95, 0.22, 'sine', 0.3);
        playNote(622, 1.2, 0.3, 'sine', 0.3);
      }
    }
  });
  propAdd({
    x: H * 0.085, y: H * 0.975, r: H * 0.065, hy: H * 0.05, color: '#ffffff', note: 330, amp: 0.08, mouse: 0,
    update: function (p, dt) { if (p.mouse > 0) p.mouse -= dt; },
    draw: function (c, p) { bakeDrawSack(c, H, p); },
    poke: function (p) {
      bakePuff(p.x, p.y - H * 0.09, p.n % 5 === 0 ? 16 : 6, '#ffffff', p.n % 5 === 0);
      playNote(180, 0, 0.15, 'sine', 0.2);
      if (p.n % 3 === 0) { p.mouse = 2; playNote(1760, 0.2, 0.05, 'sine', 0.15); playNote(1976, 0.3, 0.05, 'sine', 0.15); }
    }
  });
  propAdd({
    x: L.left + H * 0.075, y: L.tableY + H * 0.035, r: H * 0.06, hy: H * 0.02, color: '#ffd9a0', note: 440, amp: 0.03, roll: 0, rv: 0,
    update: function (p, dt) {
      p.rv -= p.roll * dt * 30;
      p.rv *= Math.max(0, 1 - dt * 3);
      p.roll += p.rv * dt;
    },
    draw: function (c, p) { bakeDrawPin(c, H, p); },
    poke: function (p) {
      p.rv += 0.6 * (p.n % 2 ? 1 : -1);
      playNote(262, 0, 0.2, 'triangle', 0.15);
      if (p.n % 3 === 0) {
        propDrop({
          x: p.x, y: p.y - H * 0.02, vx: H * 0.08, vy: -H * 0.8, ground: L.tableY + H * 0.02, life: 2.4,
          draw: function (c) { bakeDrawGinger(c, 0, 0, H * 0.026); }
        });
        playNote(784, 0.1, 0.1, 'triangle', 0.2);
        playNote(1047, 0.2, 0.15, 'triangle', 0.2);
      }
    }
  });
}

// ---------- Tausta ----------
function renderBakeryBg(b, w, h) {
  var L = bake.L, g, i, j, x, y, tw, o, H = h, cols;
  if (!L || L.W !== w || L.H !== h) { bakeLayout(); L = bake.L; }
  // Seinä: lämmin persikka, pystyraidat
  g = b.createLinearGradient(0, 0, 0, h * 0.8);
  g.addColorStop(0, '#ffe2c4');
  g.addColorStop(1, '#ffcfa8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  b.fillStyle = 'rgba(255,255,255,0.22)';
  for (x = h * 0.02; x < w; x += h * 0.09) b.fillRect(x, 0, h * 0.035, h * 0.8);
  // Viirinauha seinän yläosassa
  cols = ['#ff7bac', '#ffd24f', '#7fd4ff', '#8fe38f'];
  b.strokeStyle = '#c88a5a';
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath(); b.moveTo(L.left, h * 0.125); b.quadraticCurveTo(L.cx, h * 0.16, L.right - h * 0.11, h * 0.125); b.stroke();
  for (i = 0; i < 9; i++) {
    x = L.left + (L.right - h * 0.11 - L.left) * (i + 0.5) / 9;
    y = h * 0.125 + Math.sin((i + 0.5) / 9 * Math.PI) * h * 0.017;
    b.beginPath(); b.moveTo(x - h * 0.013, y); b.lineTo(x + h * 0.013, y); b.lineTo(x, y + h * 0.028); b.closePath();
    artFillPath(b, cols[i % 4], y, y + h * 0.028, h * 0.013, { line: false });
  }
  // Lattia: ruutulaatat
  y = h * 0.8;
  b.fillStyle = '#f6dcc0';
  b.fillRect(0, y, w, h - y);
  tw = h * 0.08;
  for (j = 0; y + j * tw * 0.5 < h; j++) {
    for (i = -1; i * tw < w; i++) {
      if ((i + j) % 2) continue;
      b.fillStyle = '#ecc6a4';
      b.fillRect(i * tw + (j % 2) * 0, y + j * tw * 0.5, tw, tw * 0.5);
    }
  }
  b.fillStyle = 'rgba(120,60,30,0.15)';
  b.fillRect(0, y, w, h * 0.008);
  // Koristehyllyt (kulhot ja pursottimet)
  bakeShelf(b, L.left + h * 0.01, L.right - h * 0.01, L.bowls[0].y + h * 0.04, h);
  bakeShelf(b, L.left + h * 0.01, L.right - h * 0.01, L.bags[0].y + h * 0.07, h);
  // Pursotinteline: tanko
  artRoundRect(b, L.left + h * 0.02, L.bags[0].y - h * 0.045, L.cw - h * 0.04, h * 0.014, h * 0.007, '#c88a5a', { lineColor: '#7a4a2a' });
  // Uunin alakaappi
  o = L.oven;
  artRoundRect(b, o.x0, o.y1 - h * 0.01, o.x1 - o.x0, h * 0.82 - o.y1, h * 0.015, '#f0b48a', { lineColor: '#9a5a3a' });
  for (i = 0; i < 2; i++) {
    artRoundRect(b, o.x0 + h * 0.02, o.y1 + h * 0.015 + i * h * 0.05, o.x1 - o.x0 - h * 0.04, h * 0.04, h * 0.008, '#f8c8a0', { lineColor: '#b0704a' });
    artCircle(b, o.cx, o.y1 + h * 0.035 + i * h * 0.05, h * 0.007, '#ffe8c8', { lineColor: '#9a5a3a' });
  }
  // Työpöytä: kansi, etupaneeli ja taikinalaatikot
  artRoundRect(b, L.left - h * 0.01, L.tableY + h * 0.02, L.right - L.left + h * 0.015, h * 1.0 - L.tableY, h * 0.01, '#e8a878', { lineColor: '#8a5030' });
  artRoundRect(b, L.left - h * 0.02, L.tableY - h * 0.005, L.right - L.left + h * 0.035, h * 0.035, h * 0.012, '#f6d8a8', { lineColor: '#9a6a3a' });
  b.strokeStyle = 'rgba(154,106,58,0.35)';
  b.lineWidth = Math.max(1, h * 0.002);
  for (i = 1; i < 4; i++) { b.beginPath(); b.moveTo(L.left, L.tableY + h * 0.006 * i + h * 0.002); b.lineTo(L.right, L.tableY + h * 0.006 * i + h * 0.002); b.stroke(); }
  for (i = 0; i < L.bins.length; i++) {
    artRoundRect(b, L.bins[i].x - h * 0.052, L.bins[i].y - h * 0.05, h * 0.104, h * 0.095, h * 0.02, '#c8845a', { lineColor: '#7a4422' });
    artRoundRect(b, L.bins[i].x - h * 0.043, L.bins[i].y - h * 0.04, h * 0.086, h * 0.075, h * 0.016, '#ecd2ae', { lineColor: '#b08a60' });
  }
  // Lautanen
  artShadow(b, L.plate.x, L.plate.y + h * 0.008, h * 0.14, h * 0.03, 0.2);
  b.save();
  bakeEll(b, L.plate.x, L.plate.y, h * 0.13, h * 0.038);
  artFillPath(b, '#ffffff', L.plate.y - h * 0.04, L.plate.y + h * 0.04, h * 0.05, { lineColor: '#a8a0c8', shadeTo: '#e4e0f4' });
  b.strokeStyle = 'rgba(160,150,200,0.5)';
  b.lineWidth = Math.max(1, h * 0.003);
  bakeEll(b, L.plate.x, L.plate.y, h * 0.1, h * 0.026);
  b.stroke();
  b.restore();
}
function bakeShelf(b, x0, x1, y, h) {
  artRoundRect(b, x0, y, x1 - x0, h * 0.02, h * 0.006, '#d8955f', { lineColor: '#7a4a2a' });
  b.fillStyle = 'rgba(120,60,30,0.12)';
  b.fillRect(x0 + h * 0.01, y + h * 0.02, x1 - x0 - h * 0.02, h * 0.01);
  artLimb(b, x0 + h * 0.03, y + h * 0.02, x0 + h * 0.03, y + h * 0.045, h * 0.008, '#c8845a', '#7a4a2a');
  artLimb(b, x1 - h * 0.03, y + h * 0.02, x1 - h * 0.03, y + h * 0.045, h * 0.008, '#c8845a', '#7a4a2a');
}

// ---------- Piirto: leivokset ja koristeet ----------
function bakeDrawPastry(c, P, x, y, R, o) {
  o = o || {};
  var base = P.base, cook = P.cook, body = bakeDoughCol(cook, 0), line = bakeDoughCol(cook, 1), top = artShade(body, 0.18);
  var fr = P.frost ? BAKE_FROST_COL[P.frost] : null, fl = P.frost ? BAKE_FROST_LINE[P.frost] : null, T = bakeTopOf(base, R), i, dk, s, list, h, w;
  c.save();
  c.translate(x, y);
  if (o.scale) c.scale(o.scale, o.scale);
  if (!o.noShadow) artShadow(c, 0, R * 0.02, R * 1.1, R * 0.25, 0.2);
  if (base === 'round') {
    h = R * 0.72;
    w = R * 0.9;
    c.beginPath(); c.moveTo(-w, -h); c.lineTo(-w, 0); bakeEllArc(c, 0, 0, w, R * 0.28, Math.PI, 0, true); c.lineTo(w, -h); c.closePath();
    artFillPath(c, body, -h, R * 0.3, R, { lineColor: line });
    if (!fr) { bakeEll(c, 0, -h, w, R * 0.3); artFillPath(c, top, -h - R * 0.3, -h + R * 0.3, R, { lineColor: line }); }
    else {
      for (i = 0; i < 6; i++) {
        dk = -w * 0.85 + i * w * 0.34;
        s = R * (0.14 + ((i * 37) % 5) * 0.04);
        artBlob(c, dk, -h + R * 0.22 + s * 0.5, R * 0.08, s, fr, { lineColor: fl, line: Math.max(1, R * 0.05) });
      }
      bakeEll(c, 0, -h, w * 1.02, R * 0.32);
      artFillPath(c, fr, -h - R * 0.3, -h + R * 0.3, R, { lineColor: fl, shadeTo: artShade(fr, -0.08) });
    }
  } else if (base === 'heart') {
    for (i = 0; i < 5; i++) {
      bakeHeartPath(c, 0, -R * 0.3 - i * R * 0.075, R * 0.95, 0.62);
      if (i === 0) artFillPath(c, body, -R * 0.9, R * 0.1, R, { lineColor: line });
      else { c.fillStyle = artShade(body, -0.05); c.fill(); }
    }
    bakeHeartPath(c, 0, -R * 0.62, R * 0.95, 0.62);
    artFillPath(c, fr || top, -R * 1.15, -R * 0.3, R, { lineColor: fr ? fl : line });
    if (fr) {
      for (i = 0; i < 4; i++) artBlob(c, -R * 0.45 + i * R * 0.3, -R * 0.42 + Math.abs(i - 1.5) * -R * 0.05, R * 0.07, R * 0.13, fr, { lineColor: fl, line: Math.max(1, R * 0.05) });
      bakeHeartPath(c, 0, -R * 0.62, R * 0.95, 0.62);
      c.fillStyle = fr; c.fill();
    }
  } else if (base === 'cup') {
    artBlob(c, 0, -R * 0.64, R * 0.84, R * 0.46, body, { lineColor: line, hi: 0.25 });
    if (fr) {
      artBlob(c, 0, -R * 0.8, R * 0.86, R * 0.3, fr, { lineColor: fl });
      artBlob(c, 0, -R * 0.98, R * 0.64, R * 0.24, fr, { lineColor: fl });
      artBlob(c, 0, -R * 1.14, R * 0.38, R * 0.17, fr, { lineColor: fl, hi: 0.35 });
      artCircle(c, 0, -R * 1.28, R * 0.1, fr, { lineColor: fl });
    }
    c.beginPath(); c.moveTo(-R * 0.82, -R * 0.6); c.lineTo(R * 0.82, -R * 0.6); c.lineTo(R * 0.58, 0); c.lineTo(-R * 0.58, 0); c.closePath();
    artFillPath(c, '#a8dcff', -R * 0.6, 0, R, { lineColor: '#4a8ac0' });
    c.strokeStyle = 'rgba(74,138,192,0.55)';
    c.lineWidth = Math.max(1, R * 0.05);
    for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * R * 0.23, -R * 0.56); c.lineTo(i * R * 0.165, -R * 0.04); c.stroke(); }
  } else if (base === 'cookie') {
    artBlob(c, 0, -R * 0.08, R * 1.0, R * 0.38, artShade(body, -0.12), { lineColor: line });
    artBlob(c, 0, -R * 0.22, R * 0.98, R * 0.36, body, { lineColor: line, hi: 0.2 });
    if (fr) artBlob(c, 0, -R * 0.24, R * 0.8, R * 0.28, fr, { lineColor: fl, hi: 0.3 });
    else {
      c.fillStyle = '#6a3a1e';
      list = [[-0.5, -0.1], [0.1, -0.35], [0.5, -0.05], [-0.15, 0.15], [0.35, 0.18], [-0.55, -0.4]];
      for (i = 0; i < list.length; i++) { c.beginPath(); c.arc(list[i][0] * R, -R * 0.22 + list[i][1] * R * 0.5, R * 0.07, 0, Math.PI * 2); c.fill(); }
    }
  } else {
    c.beginPath(); c.moveTo(-R * 0.92, 0); bakeEllArc(c, 0, 0, R * 0.92, R * 0.92, Math.PI, Math.PI * 2, false); bakeEllArc(c, 0, 0, R * 0.92, R * 0.14, 0, Math.PI, false); c.closePath();
    artFillPath(c, body, -R * 0.92, R * 0.1, R, { lineColor: line, hi: 0.25 });
    c.strokeStyle = artShade(line, 0.3);
    c.lineWidth = Math.max(1, R * 0.05);
    for (i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * R * 0.45, -R * 0.35, R * 0.28, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    if (fr) {
      for (i = 0; i < 3; i++) artBlob(c, -R * 0.35 + i * R * 0.35, -R * 0.5, R * 0.07, R * 0.15, fr, { lineColor: fl, line: Math.max(1, R * 0.05) });
      artBlob(c, 0, -R * 0.66, R * 0.66, R * 0.28, fr, { lineColor: fl, hi: 0.3 });
    } else if (cook >= 0.5) {
      c.fillStyle = '#ffffff';
      for (i = 0; i < 6; i++) c.fillRect(-R * 0.5 + i * R * 0.2, -R * (0.7 + (i % 2) * 0.12), R * 0.07, R * 0.07);
    }
  }
  // Palanut: hiiltyneitä läikkiä pinnalla (kuorrutteen alla ei näy)
  if (cook > 1.5 && !fr) {
    c.fillStyle = 'rgba(20,10,8,0.55)';
    for (i = 0; i < 4; i++) { c.beginPath(); c.arc((i - 1.5) * T.rx * 0.45, T.y + ((i * 7) % 3 - 1) * T.ry * 0.35, R * 0.09, 0, Math.PI * 2); c.fill(); }
  }
  // Raa'an taikinan jauhopilkut
  if (cook < 0.5) {
    c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - cook * 2)) + ')';
    for (i = 0; i < 5; i++) { c.beginPath(); c.arc((i - 2) * T.rx * 0.35, T.y + ((i * 13) % 3 - 1) * T.ry * 0.4, R * 0.05, 0, Math.PI * 2); c.fill(); }
  }
  // Keskeneräinen kuorrute: sutaistut täplät
  if (P.blobs && P.blobs.length) {
    for (i = 0; i < P.blobs.length; i++) {
      artCircle(c, P.blobs[i].u * T.rx, T.y + P.blobs[i].v * T.ry, R * 0.2, BAKE_FROST_COL[P.blobs[i].col], { lineColor: BAKE_FROST_LINE[P.blobs[i].col], line: Math.max(1, R * 0.03) });
    }
  }
  // Koristeet (takimmaiset ensin)
  if (P.decos && P.decos.length) {
    list = P.decos.slice().sort(function (a, b) { return BAKE_SLOTS[a.slot][1] - BAKE_SLOTS[b.slot][1]; });
    for (i = 0; i < list.length; i++) {
      s = BAKE_SLOTS[list[i].slot];
      bakeDrawDeco(c, list[i].type, s[0] * T.rx, T.y + s[1] * T.ry, R * 0.4 * (list[i].pop > 0 ? 1 + list[i].pop : 1));
    }
  }
  c.restore();
}
function bakeDrawDeco(c, type, x, y, r) {
  var f;
  if (type === 'straw') {
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x - r * 0.95, y - r * 0.35, x - r * 0.75, y - r * 1.15, x, y - r * 1.0);
    c.bezierCurveTo(x + r * 0.75, y - r * 1.15, x + r * 0.95, y - r * 0.35, x, y);
    c.closePath();
    artFillPath(c, '#ff4a5a', y - r * 1.1, y, r, { lineColor: '#a01a2a' });
    c.fillStyle = '#ffe9a0';
    c.fillRect(x - r * 0.3, y - r * 0.6, r * 0.1, r * 0.12);
    c.fillRect(x + r * 0.2, y - r * 0.7, r * 0.1, r * 0.12);
    c.fillRect(x - r * 0.05, y - r * 0.35, r * 0.1, r * 0.12);
    artBlob(c, x - r * 0.22, y - r * 1.02, r * 0.26, r * 0.11, '#5fbf4a', { rot: -0.4, lineColor: '#2a7a2a', line: Math.max(1, r * 0.08) });
    artBlob(c, x + r * 0.22, y - r * 1.02, r * 0.26, r * 0.11, '#5fbf4a', { rot: 0.4, lineColor: '#2a7a2a', line: Math.max(1, r * 0.08) });
  } else if (type === 'cherry') {
    c.strokeStyle = '#3a7a2a';
    c.lineWidth = Math.max(1.2, r * 0.12);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - r * 0.9); c.quadraticCurveTo(x + r * 0.05, y - r * 1.4, x + r * 0.45, y - r * 1.6); c.stroke();
    artBlob(c, x + r * 0.55, y - r * 1.55, r * 0.22, r * 0.1, '#5fbf4a', { rot: 0.5, lineColor: '#2a7a2a', line: Math.max(1, r * 0.06) });
    artCircle(c, x, y - r * 0.5, r * 0.52, '#e8203a', { lineColor: '#8a0a1a', hi: 0.5 });
  } else if (type === 'candle') {
    f = 1 + Math.sin(globalT * 13 + x) * 0.12;
    artGlow(c, x, y - r * 1.85, r * 1.0, '#ffd24f', 0.35);
    artRoundRect(c, x - r * 0.17, y - r * 1.5, r * 0.34, r * 1.5, r * 0.08, '#8fd4ff', { lineColor: '#3a7ab0', line: Math.max(1, r * 0.08) });
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1, r * 0.1);
    c.beginPath(); c.moveTo(x - r * 0.15, y - r * 1.1); c.lineTo(x + r * 0.15, y - r * 1.3); c.moveTo(x - r * 0.15, y - r * 0.55); c.lineTo(x + r * 0.15, y - r * 0.75); c.stroke();
    c.beginPath();
    c.moveTo(x, y - r * (2.25 * f));
    c.quadraticCurveTo(x + r * 0.32, y - r * 1.7, x, y - r * 1.55);
    c.quadraticCurveTo(x - r * 0.32, y - r * 1.7, x, y - r * (2.25 * f));
    artFillPath(c, '#ffb020', y - r * 2.2, y - r * 1.55, r * 0.3, { lineColor: '#e06010', line: Math.max(1, r * 0.06), shadeTo: '#ff7020' });
  } else {
    drawStar(c, x, y - r * 0.6, r * 0.62, 0, 0);
  }
}
function bakeDrawWhisk(c, x, y, s, gold, rot) {
  var col = gold ? '#ffd24f' : '#c8c0d8', line = gold ? '#a07010' : '#7a7090', i;
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  if (gold) artGlow(c, 0, -s * 0.2, s * 1.1, '#ffe27a', 0.45);
  artRoundRect(c, -s * 0.11, s * 0.05, s * 0.22, s * 0.6, s * 0.1, gold ? '#ffd24f' : '#ff9ec6', { lineColor: gold ? '#a07010' : '#b0507a' });
  c.strokeStyle = line;
  c.lineWidth = Math.max(2, s * 0.09);
  for (i = -1; i <= 1; i++) { bakeEll(c, 0, -s * 0.38, s * (0.12 + Math.abs(i) * 0.14), s * 0.45); c.stroke(); }
  c.strokeStyle = col;
  c.lineWidth = Math.max(1, s * 0.05);
  for (i = -1; i <= 1; i++) { bakeEll(c, 0, -s * 0.38, s * (0.12 + Math.abs(i) * 0.14), s * 0.45); c.stroke(); }
  c.restore();
}

// ---------- Piirto: kaluste ja koristeet ----------
function bakeDrawMixer(c, H, p) {
  var s = H * 0.05, k = p.spin > 0 ? 1 : 0, a = p.ang;
  artRoundRect(c, -s * 1.1, -s * 0.3, s * 2.0, s * 0.3, s * 0.12, '#ff9ec6', { lineColor: '#b0507a' });
  artRoundRect(c, s * 0.45, -s * 2.3, s * 0.5, s * 2.05, s * 0.2, '#ff9ec6', { lineColor: '#b0507a' });
  c.beginPath(); c.moveTo(-s * 0.95, -s * 1.15); c.lineTo(s * 0.05, -s * 1.15); c.lineTo(-s * 0.1, -s * 0.32); c.lineTo(-s * 0.8, -s * 0.32); c.closePath();
  artFillPath(c, '#e8eef8', -s * 1.15, -s * 0.3, s, { lineColor: '#8a90a8' });
  artBlob(c, -s * 0.45, -s * 1.15, s * 0.48, s * 0.1, '#fff6e8', { lineColor: '#c0a888' });
  c.strokeStyle = '#8a90a8';
  c.lineWidth = Math.max(1.5, s * 0.08);
  c.beginPath(); c.moveTo(-s * 0.45, -s * 1.9); c.lineTo(-s * 0.45 + Math.sin(a) * s * 0.15 * k, -s * 0.95); c.stroke();
  bakeEll(c, -s * 0.45, -s * 1.05, s * (0.14 + Math.abs(Math.sin(a)) * 0.1 * k + 0.04), s * 0.2);
  c.stroke();
  artBlob(c, -s * 0.05, -s * 2.15, s * 1.0, s * 0.4, '#ff9ec6', { lineColor: '#b0507a', hi: 0.4 });
  artCircle(c, s * 0.5, -s * 2.1, s * 0.12, '#ffffff', { lineColor: '#b0507a' });
}
function bakeDrawJar(c, H, p) {
  var s = H * 0.04, lift = p.lid > 0 ? Math.sin(p.lid / 0.6 * Math.PI) * s * 0.6 : 0;
  artBlob(c, 0, -s * 0.85, s * 0.85, s * 0.9, '#d8f0ff', { lineColor: '#7aa0c0', hi: 0.45, alpha: 0.85 });
  artBlob(c, -s * 0.2, -s * 0.5, s * 0.3, s * 0.18, '#d99a50', { lineColor: '#8a5020' });
  artBlob(c, s * 0.25, -s * 0.6, s * 0.28, s * 0.17, '#d99a50', { lineColor: '#8a5020' });
  artBlob(c, 0, -s * 0.9, s * 0.3, s * 0.17, '#d99a50', { lineColor: '#8a5020' });
  artRoundRect(c, -s * 0.6, -s * 1.85 - lift, s * 1.2, s * 0.3, s * 0.12, '#ff9ec6', { lineColor: '#b0507a' });
  artCircle(c, 0, -s * 1.95 - lift, s * 0.15, '#ff9ec6', { lineColor: '#b0507a' });
}
function bakeDrawRegister(c, H, p) {
  var s = H * 0.045, op = p.open > 0 ? Math.min(1, p.open * 4) : 0;
  artRoundRect(c, -s * 0.95, -s * 0.35 + 0, s * 1.9, s * 0.35, s * 0.08, '#e8b84a', { lineColor: '#8a6010' });
  if (op > 0) artRoundRect(c, -s * 0.8, -s * 0.2 + op * s * 0.25, s * 1.6, s * 0.3, s * 0.06, '#f0c860', { lineColor: '#8a6010' });
  c.beginPath(); c.moveTo(-s * 0.9, -s * 0.35); c.lineTo(s * 0.9, -s * 0.35); c.lineTo(s * 0.7, -s * 1.15); c.lineTo(-s * 0.7, -s * 1.15); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.15, -s * 0.35, s, { lineColor: '#8a6010' });
  artRoundRect(c, -s * 0.5, -s * 1.55, s * 1.0, s * 0.42, s * 0.08, '#fff6d8', { lineColor: '#8a6010' });
  c.fillStyle = '#6a4a10';
  c.font = 'bold ' + Math.round(s * 0.34) + 'px ' + UI_FONT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(bake.served), 0, -s * 1.33);
  artCircle(c, -s * 0.35, -s * 0.75, s * 0.1, '#ff7bac', { lineColor: '#8a3050' });
  artCircle(c, 0, -s * 0.75, s * 0.1, '#7fd4ff', { lineColor: '#3a6a90' });
  artCircle(c, s * 0.35, -s * 0.75, s * 0.1, '#8fe38f', { lineColor: '#3a8a3a' });
  if (bake.regPop > 0) artGlow(c, 0, -s * 0.8, s * 1.4, '#ffe27a', bake.regPop * 2);
}
function bakeDrawBell(c, H) {
  var s = H * 0.028, w = bake.bellT > 0 ? Math.sin(bake.bellT * 40) * 0.15 : 0;
  artBlob(c, 0, -s * 0.12, s * 1.1, s * 0.22, '#c8a060', { lineColor: '#6a4a20' });
  c.save();
  c.rotate(w);
  c.beginPath(); c.moveTo(-s * 0.9, -s * 0.25); bakeEllArc(c, 0, -s * 0.25, s * 0.9, s * 0.95, Math.PI, Math.PI * 2, false); c.closePath();
  artFillPath(c, '#ffd24f', -s * 1.2, -s * 0.25, s, { lineColor: '#a07010', hi: 0.4 });
  artHighlight(c, -s * 0.35, -s * 0.75, s * 0.2, s * 0.12, 0.6);
  artCircle(c, 0, -s * 1.25, s * 0.18, '#ffd24f', { lineColor: '#a07010' });
  c.restore();
}
function bakeDrawClock(c, H, p) {
  var s = H * 0.042, cy = -s * 1.05, i, a, m = globalT * 0.4 + p.ang, ck = p.cuck > 0 ? Math.min(1, Math.min(p.cuck, 1.6 - p.cuck) * 5) : 0;
  c.beginPath(); c.moveTo(-s * 0.95, cy - s * 0.4); c.lineTo(0, cy - s * 1.35); c.lineTo(s * 0.95, cy - s * 0.4); c.closePath();
  artFillPath(c, '#c8784a', cy - s * 1.35, cy - s * 0.4, s, { lineColor: '#6a3a1a' });
  if (ck > 0) {
    c.save();
    c.translate(0, cy - s * 0.95 - ck * s * 0.55);
    drawBunny(c, 0, s * 0.35, s * 0.4, 0, globalT * 6, true);
    c.restore();
  }
  artRoundRect(c, -s * 0.2, cy - s * 1.15, s * 0.4, s * 0.38, s * 0.06, ck > 0 ? '#5a3a20' : '#e89a6a', { lineColor: '#6a3a1a' });
  artCircle(c, 0, cy, s, '#fff6e8', { lineColor: '#9a5a3a', line: Math.max(1.5, s * 0.14) });
  c.fillStyle = '#9a5a3a';
  for (i = 0; i < 12; i++) { a = i * Math.PI / 6; c.beginPath(); c.arc(Math.cos(a) * s * 0.75, cy + Math.sin(a) * s * 0.75, s * 0.05, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = '#5a3a20';
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.5, s * 0.1);
  c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(m / 12 - 1.6) * s * 0.42, cy + Math.sin(m / 12 - 1.6) * s * 0.42); c.stroke();
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(m - 1.6) * s * 0.65, cy + Math.sin(m - 1.6) * s * 0.65); c.stroke();
  artLimb(c, 0, cy + s, Math.sin(globalT * 3) * s * 0.3, cy + s * 1.6, s * 0.06, '#c8a060', '#6a4a20');
  artCircle(c, Math.sin(globalT * 3) * s * 0.3, cy + s * 1.65, s * 0.14, '#ffd24f', { lineColor: '#a07010' });
}
function bakeDrawSack(c, H, p) {
  var s = H * 0.05, m = p.mouse > 0 ? Math.min(1, Math.min(p.mouse, 2 - p.mouse) * 4) : 0;
  c.beginPath(); c.moveTo(-s * 0.8, 0); c.quadraticCurveTo(-s * 1.0, -s * 0.9, -s * 0.5, -s * 1.4); c.lineTo(s * 0.5, -s * 1.4); c.quadraticCurveTo(s * 1.0, -s * 0.9, s * 0.8, 0); c.closePath();
  artFillPath(c, '#f2e2c4', -s * 1.4, 0, s, { lineColor: '#9a8060' });
  artBlob(c, 0, -s * 1.42, s * 0.55, s * 0.14, '#ffffff', { lineColor: '#c8b8a0' });
  artCircle(c, 0, -s * 0.65, s * 0.32, '#ffffff', { lineColor: '#c8a070', line: Math.max(1, s * 0.05) });
  bakeDrawDeco(c, 'star', 0, -s * 0.48, s * 0.4);
  if (m > 0) {
    artCircle(c, s * 0.3, -s * 1.42 - m * s * 0.3, s * 0.2, '#b8b0c0', { lineColor: '#6a6070' });
    artCircle(c, s * 0.15, -s * 1.6 - m * s * 0.3, s * 0.09, '#ffc0d0', { lineColor: '#6a6070' });
    artCircle(c, s * 0.45, -s * 1.6 - m * s * 0.3, s * 0.09, '#ffc0d0', { lineColor: '#6a6070' });
    artEye(c, s * 0.24, -s * 1.45 - m * s * 0.3, s * 0.04, 0, false);
    artEye(c, s * 0.38, -s * 1.45 - m * s * 0.3, s * 0.04, 0, false);
  }
}
function bakeDrawPin(c, H, p) {
  var s = H * 0.05, x = p.roll * s;
  artShadow(c, x, 0, s * 1.2, s * 0.12, 0.15);
  artLimb(c, x - s * 1.2, -s * 0.22, x - s * 0.7, -s * 0.22, s * 0.14, '#c8844a', '#7a4422');
  artLimb(c, x + s * 0.7, -s * 0.22, x + s * 1.2, -s * 0.22, s * 0.14, '#c8844a', '#7a4422');
  artRoundRect(c, x - s * 0.75, -s * 0.44, s * 1.5, s * 0.44, s * 0.2, '#f2c890', { lineColor: '#9a6a3a', hi: 0.3 });
}
function bakeDrawGinger(c, x, y, s) {
  artBlob(c, x, y - s * 0.6, s * 0.45, s * 0.6, '#c87a3a', { lineColor: '#6a3a10' });
  artCircle(c, x, y - s * 1.35, s * 0.4, '#c87a3a', { lineColor: '#6a3a10' });
  artBlob(c, x - s * 0.18, y - s * 1.85, s * 0.12, s * 0.35, '#c87a3a', { lineColor: '#6a3a10' });
  artBlob(c, x + s * 0.18, y - s * 1.85, s * 0.12, s * 0.35, '#c87a3a', { lineColor: '#6a3a10' });
  c.fillStyle = '#ffffff';
  c.fillRect(x - s * 0.18, y - s * 1.42, s * 0.08, s * 0.08);
  c.fillRect(x + s * 0.1, y - s * 1.42, s * 0.08, s * 0.08);
  c.fillRect(x - s * 0.04, y - s * 0.8, s * 0.08, s * 0.08);
  c.fillRect(x - s * 0.04, y - s * 0.5, s * 0.08, s * 0.08);
}
// Istuva kissa: origo jalkojen kohdalla. o: { sleep, tail, face, heart, blink }
function bakeDrawCat(c, x, y, s, o) {
  var body = o.coat || '#ffb870', line = o.line || '#a0602a', sh = artShade(body, -0.15), tw = o.tail || 0;
  c.save();
  c.translate(x, y);
  c.scale(o.face || 1, 1);
  c.strokeStyle = line;
  c.lineWidth = s * 0.3;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(s * 0.5, -s * 0.2); c.quadraticCurveTo(s * 1.3, -s * 0.3, s * 1.1 + tw * s * 0.3, -s * 1.1); c.stroke();
  c.strokeStyle = body;
  c.lineWidth = s * 0.18;
  c.stroke();
  artBlob(c, 0, -s * 0.6, s * 0.7, s * 0.62, body, { lineColor: line, shadeTo: sh, hi: 0.3 });
  artBlob(c, -s * 0.25, -s * 0.08, s * 0.2, s * 0.12, body, { lineColor: line });
  artBlob(c, s * 0.25, -s * 0.08, s * 0.2, s * 0.12, body, { lineColor: line });
  c.beginPath(); c.moveTo(-s * 0.6, -s * 1.5); c.lineTo(-s * 0.52, -s * 2.05); c.lineTo(-s * 0.15, -s * 1.7); c.closePath();
  artFillPath(c, body, -s * 2.05, -s * 1.5, s * 0.3, { lineColor: line });
  c.beginPath(); c.moveTo(s * 0.6, -s * 1.5); c.lineTo(s * 0.52, -s * 2.05); c.lineTo(s * 0.15, -s * 1.7); c.closePath();
  artFillPath(c, body, -s * 2.05, -s * 1.5, s * 0.3, { lineColor: line });
  artCircle(c, 0, -s * 1.45, s * 0.58, body, { lineColor: line, shadeTo: sh, hi: 0.3 });
  c.strokeStyle = artShade(body, -0.25);
  c.lineWidth = Math.max(1, s * 0.07);
  c.beginPath(); c.moveTo(-s * 0.15, -s * 1.95); c.lineTo(-s * 0.1, -s * 1.75); c.moveTo(s * 0.15, -s * 1.95); c.lineTo(s * 0.1, -s * 1.75); c.stroke();
  artEye(c, -s * 0.22, -s * 1.5, s * 0.11, 0, o.sleep || o.blink);
  artEye(c, s * 0.22, -s * 1.5, s * 0.11, 0, o.sleep || o.blink);
  artCircle(c, 0, -s * 1.32, s * 0.06, '#ff7b9c', { line: false });
  artBlush(c, -s * 0.36, -s * 1.28, s * 0.1);
  artBlush(c, s * 0.36, -s * 1.28, s * 0.1);
  c.strokeStyle = 'rgba(80,50,30,0.6)';
  c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath(); c.moveTo(-s * 0.2, -s * 1.3); c.lineTo(-s * 0.7, -s * 1.35); c.moveTo(-s * 0.2, -s * 1.26); c.lineTo(-s * 0.68, -s * 1.18); c.moveTo(s * 0.2, -s * 1.3); c.lineTo(s * 0.7, -s * 1.35); c.moveTo(s * 0.2, -s * 1.26); c.lineTo(s * 0.68, -s * 1.18); c.stroke();
  if (o.sleep) bakeText(c, 'z', s * 0.75, -s * 2.1 - (globalT % 1.5) * s * 0.3, s * 0.5, '#8a7aa8');
  c.restore();
  if (o.heart > 0) drawHeartShape(c, x, y - s * 2.4 - (1.6 - o.heart) * s * 0.6, s * 0.35, true);
}

// ---------- Piirto: uuni, ikkuna, tiski ----------
function bakeDrawOven(c) {
  var L = bake.L, o = L.oven, H = viewH, P = bake.P, inO = P && P.where === 'oven', k, ready, burnt, glow, pos, a, wx0 = o.x0 + H * 0.035, wx1 = o.x1 - H * 0.035;
  artRoundRect(c, o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0, H * 0.025, '#e8806a', { lineColor: '#8a3a2a', hi: 0.15 });
  artRoundRect(c, o.x0 + H * 0.015, o.y0 + H * 0.015, o.x1 - o.x0 - H * 0.03, H * 0.07, H * 0.015, '#ffe8d0', { lineColor: '#b06a4a' });
  // Nupit ja kellotaulu
  artCircle(c, o.x0 + H * 0.05, o.dialY, H * 0.014, '#ffffff', { lineColor: '#8a3a2a' });
  artCircle(c, o.x1 - H * 0.05, o.dialY, H * 0.014, '#ffffff', { lineColor: '#8a3a2a' });
  ready = inO && P.ovenT >= BAKE_T;
  burnt = inO && P.ovenT > BAKE_T + BAKE_GOLD;
  artCircle(c, o.cx, o.dialY, H * 0.03, '#fffaf0', { lineColor: '#8a3a2a' });
  if (inO) {
    // Kultainen sektori: ottoikkuna
    a = -Math.PI / 2;
    c.fillStyle = 'rgba(255,200,40,0.55)';
    c.beginPath(); c.moveTo(o.cx, o.dialY);
    c.arc(o.cx, o.dialY, H * 0.026, a + Math.PI * 2 * BAKE_T / (BAKE_T + BAKE_GOLD + 0.6), a + Math.PI * 2 * (BAKE_T + BAKE_GOLD) / (BAKE_T + BAKE_GOLD + 0.6));
    c.closePath(); c.fill();
    k = Math.min(1, P.ovenT / (BAKE_T + BAKE_GOLD + 0.6));
    c.strokeStyle = '#c03020';
    c.lineWidth = Math.max(1.5, H * 0.005);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(o.cx, o.dialY); c.lineTo(o.cx + Math.cos(a + k * Math.PI * 2) * H * 0.024, o.dialY + Math.sin(a + k * Math.PI * 2) * H * 0.024); c.stroke();
  }
  // Ikkuna
  glow = !inO ? 0 : (burnt ? 0.25 : (ready ? 0.75 + Math.sin(globalT * 8) * 0.2 : 0.35 + Math.sin(globalT * 5) * 0.08));
  artRoundRect(c, wx0, o.wy0, wx1 - wx0, o.wy1 - o.wy0, H * 0.02, '#5a2e28', { lineColor: '#8a3a2a' });
  if (inO) {
    c.save();
    roundRect(c, wx0, o.wy0, wx1 - wx0, o.wy1 - o.wy0, H * 0.02);
    c.clip();
    artGlow(c, o.cx, o.wy1, H * 0.2, ready && !burnt ? '#ffd24f' : '#ff8a3a', glow);
    // Lämpövastukset
    c.strokeStyle = 'rgba(255,120,60,' + (0.5 + Math.sin(globalT * 6) * 0.2) + ')';
    c.lineWidth = Math.max(1.5, H * 0.005);
    c.beginPath(); c.moveTo(wx0 + H * 0.01, o.wy1 - H * 0.012); c.lineTo(wx1 - H * 0.01, o.wy1 - H * 0.012); c.stroke();
    pos = bakeOvenPastryPos();
    bakeDrawPastry(c, P, pos.x, pos.y, L.R * 0.85, { noShadow: true });
    if (burnt) { c.fillStyle = 'rgba(80,70,70,0.25)'; c.fillRect(wx0, o.wy0, wx1 - wx0, o.wy1 - o.wy0); }
    c.restore();
  }
  artHighlight(c, wx0 + H * 0.04, o.wy0 + H * 0.03, H * 0.035, H * 0.012, 0.3);
  artRoundRect(c, wx0 + H * 0.02, o.wy0 - H * 0.03, wx1 - wx0 - H * 0.04, H * 0.016, H * 0.008, '#ffe8d0', { lineColor: '#8a3a2a' });
  if (ready && !burnt) {
    artGlow(c, o.cx, o.wcy, H * 0.22, '#ffe27a', 0.35 + Math.sin(globalT * 8) * 0.15);
    // Kello soi
    c.save();
    c.translate(o.cx + H * 0.12, o.y0 - H * 0.005);
    c.rotate(Math.sin(globalT * 18) * 0.25);
    bakeDrawBell(c, H * 0.8);
    c.restore();
  }
  if (bake.ovenRing > 0 && !ready) artGlow(c, o.cx, o.wcy, H * 0.12, '#ff9a5a', bake.ovenRing);
}
function bakeSkyCols() {
  var k = bake.dayK, A = ['#bfe0ff', '#ffe2c8'], B = ['#7cc4ff', '#d8f0ff'], C = ['#6a5aa8', '#ffa070'];
  if (k <= 1) return [artMix(A[0], B[0], k), artMix(A[1], B[1], k)];
  return [artMix(B[0], C[0], k - 1), artMix(B[1], C[1], k - 1)];
}
function bakeDrawWindow(c) {
  var L = bake.L, w = L.win, H = viewH, sky = bakeSkyCols(), g, i, x, hx, ev = Math.max(0, bake.dayK - 1), vx, v = bake.van, k;
  c.save();
  roundRect(c, w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0, H * 0.02);
  c.clip();
  g = c.createLinearGradient(0, w.y0, 0, w.y1);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
  // Aurinko / kuu
  if (ev < 0.6) artCircle(c, w.x0 + (w.x1 - w.x0) * (0.2 + bake.dayK * 0.3), w.y0 + H * (0.09 - Math.min(1, bake.dayK) * 0.03 + ev * 0.2), H * 0.035, '#fff2a0', { line: false });
  else artCircle(c, w.x1 - H * 0.07, w.y0 + H * 0.07, H * 0.025, '#fffbe0', { line: false });
  // Pupulan katu: talojen siluetit
  for (i = 0; i < 4; i++) {
    hx = w.x0 + (w.x1 - w.x0) * (i + 0.2) / 4;
    x = H * (0.05 + (i % 2) * 0.012);
    c.fillStyle = artMix(['#ffb8a0', '#a8d8b8', '#ffd890', '#c8b0f0'][i], sky[1], 0.35);
    c.fillRect(hx - x, w.y1 - H * (0.17 + (i % 3) * 0.03), x * 2, H * 0.2);
    c.beginPath(); c.moveTo(hx - x * 1.2, w.y1 - H * (0.17 + (i % 3) * 0.03)); c.lineTo(hx, w.y1 - H * (0.23 + (i % 3) * 0.03)); c.lineTo(hx + x * 1.2, w.y1 - H * (0.17 + (i % 3) * 0.03)); c.closePath();
    c.fillStyle = artMix('#d86a5a', sky[1], 0.35);
    c.fill();
    c.fillStyle = ev > 0.4 ? 'rgba(255,220,120,0.9)' : 'rgba(255,255,255,0.6)';
    c.fillRect(hx - H * 0.012, w.y1 - H * (0.12 + (i % 3) * 0.03), H * 0.024, H * 0.024);
  }
  c.fillStyle = '#d8c0a8';
  c.fillRect(w.x0, w.y1 - H * 0.05, w.x1 - w.x0, H * 0.05);
  // Katulyhty
  x = w.x0 + (w.x1 - w.x0) * 0.62;
  artLimb(c, x, w.y1 - H * 0.04, x, w.y1 - H * 0.2, H * 0.008, '#4a4a6a', '#2a2a3a');
  if (ev > 0.3) artGlow(c, x, w.y1 - H * 0.21, H * 0.06, '#ffe27a', ev * 0.8);
  artCircle(c, x, w.y1 - H * 0.21, H * 0.014, ev > 0.3 ? '#fff2a0' : '#e8e8f0', { lineColor: '#2a2a3a' });
  bakeDrawQueue(c);
  // Tavarantoimittajan pakettiauto
  if (v) {
    k = v.leave >= 0 ? -easeInOutSine((v.t - v.leave) / 1.4) : 1 - easeOutCubic(Math.min(1, v.t / 1.3));
    vx = (w.x0 + w.x1) / 2 + k * (w.x1 - w.x0) * 0.9;
    bakeDrawVan(c, vx, w.y1 - H * 0.012, H * 0.065);
  }
  c.restore();
  // Puitteet ja markiisi
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(3, H * 0.012);
  roundRect(c, w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0, H * 0.02);
  c.stroke();
  c.beginPath(); c.moveTo((w.x0 + w.x1) / 2, w.y0); c.lineTo((w.x0 + w.x1) / 2, w.y1); c.stroke();
  c.strokeStyle = '#c88a6a';
  c.lineWidth = Math.max(1, H * 0.003);
  roundRect(c, w.x0 - H * 0.006, w.y0 - H * 0.006, w.x1 - w.x0 + H * 0.012, w.y1 - w.y0 + H * 0.012, H * 0.024);
  c.stroke();
  for (i = 0; i < 6; i++) {
    x = w.x0 + (w.x1 - w.x0) * i / 6;
    c.beginPath(); c.moveTo(x, w.y0 - H * 0.01); c.lineTo(x + (w.x1 - w.x0) / 6, w.y0 - H * 0.01); c.lineTo(x + (w.x1 - w.x0) / 6, w.y0 + H * 0.025); c.quadraticCurveTo(x + (w.x1 - w.x0) / 12, w.y0 + H * 0.045, x, w.y0 + H * 0.025); c.closePath();
    artFillPath(c, i % 2 ? '#ffffff' : '#ff8fa8', w.y0 - H * 0.01, w.y0 + H * 0.04, H * 0.02, { lineColor: '#c0506a', line: Math.max(1, H * 0.002) });
  }
}
function bakeDrawVan(c, x, y, s) {
  artRoundRect(c, x - s * 1.6, y - s * 1.3, s * 2.4, s * 1.1, s * 0.25, '#ff9ec6', { lineColor: '#b0507a' });
  artRoundRect(c, x + s * 0.7, y - s * 1.0, s * 0.9, s * 0.8, s * 0.25, '#ff9ec6', { lineColor: '#b0507a' });
  artRoundRect(c, x + s * 0.85, y - s * 0.9, s * 0.5, s * 0.35, s * 0.1, '#bfe8ff', { lineColor: '#4a7aa0' });
  drawBunny(c, x + s * 1.1, y - s * 0.62, s * 0.3, 0, globalT * 4, true);
  bakeDrawPastry(c, { base: 'cup', cook: 1, frost: 'pink', blobs: [], decos: [{ type: 'cherry', slot: 0 }] }, x - s * 0.4, y - s * 0.4, s * 0.38, { noShadow: true });
  artCircle(c, x - s * 1.0, y - s * 0.15, s * 0.28, '#4a4a5a', { lineColor: '#2a2a3a' });
  artCircle(c, x + s * 1.1, y - s * 0.15, s * 0.28, '#4a4a5a', { lineColor: '#2a2a3a' });
  artCircle(c, x - s * 1.0, y - s * 0.15, s * 0.1, '#e0e0f0', { line: false });
  artCircle(c, x + s * 1.1, y - s * 0.15, s * 0.1, '#e0e0f0', { line: false });
}
function bakeDrawCounter(c) {
  var L = bake.L, H = viewH, x0 = L.right - H * 0.01, y = L.counterY;
  artRoundRect(c, x0, y + H * 0.015, L.W - x0 + H * 0.02, H - y, H * 0.012, '#ff9f7a', { lineColor: '#9a4a2a' });
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(x0 + H * 0.02, y + H * 0.06, L.W - x0, H * 0.012);
  c.fillRect(x0 + H * 0.02, y + H * 0.13, L.W - x0, H * 0.012);
  artRoundRect(c, x0 - H * 0.01, y - H * 0.01, L.W - x0 + H * 0.03, H * 0.035, H * 0.012, '#fff2e0', { lineColor: '#9a6a3a' });
}

// ---------- Piirto: asiakkaat ja kupla ----------
function bakeDrawCustomer(c, cu, y, s) {
  var L = bake.L, H = viewH, x = cu.x, hop = 0, walk = cu.state === 'enter' || cu.state === 'leave', o, sh = 0;
  s = s || L.cust.s;
  y = y || L.cust.y;
  if (walk) hop = Math.abs(Math.sin(cu.t * 9)) * H * 0.02;
  if (cu.hop > 0) hop += Math.sin(cu.hop / 0.5 * Math.PI) * H * 0.03;
  if (cu.shakeT > 0) sh = Math.sin(cu.shakeT * 30) * H * 0.008;
  c.save();
  c.translate(x + sh, y - hop);
  if (cu.lookT > 0) c.rotate(Math.sin(cu.lookT * 10) * 0.04);
  if (cu.kind === 'pony') {
    drawStabPonyShape(c, { k: 'pony', c: cu.order.coat, m: cu.order.mane, u: false, ph: 0 }, 0, 0, s * 1.15, -1, { blink: (cu.t % 3.7) < 0.12 ? 1 : 0, head: cu.lookT > 0 ? -0.3 : 0, toss: cu.joyT });
  } else if (cu.kind === 'cat') {
    bakeDrawCat(c, 0, 0, s * 0.62, { face: -1, tail: Math.sin(cu.t * 3), blink: (cu.t % 3.7) < 0.12, coat: '#c8c0d0', line: '#5a5068' });
  } else {
    o = { face: -1, t: cu.t, wave: cu.waveT > 0 ? 1 : 0 };
    trainDrawAnimal(c, cu.kind, 0, 0, cu.kind === 'bunny' ? s * 0.85 : s, o);
  }
  c.restore();
  if (cu.sighT > 0) bakeText(c, '...', x - H * 0.07, y - s * 1.9 - (1.4 - cu.sighT) * H * 0.03, H * 0.04, '#8a7a8a', '#ffffff');
  if (cu.joyT > 0) drawHeartShape(c, x + H * 0.02, y - s * 2.0 - (1.2 - cu.joyT) * H * 0.06, H * 0.018, true);
}
function bakeDrawHeld(c, cu) {
  var i, L = bake.L;
  for (i = 0; i < cu.hold.length; i++) bakeDrawPastry(c, cu.hold[i], cu.x - viewH * (0.07 + i * 0.045), L.counterY + viewH * 0.005, L.R * 0.55, {});
}
// Kuplan mitat ja osien paikat
function bakeBubbleBox(o, small) {
  var L = bake.L, H = viewH, nd = o.decos.length, w = nd ? H * 0.35 : H * 0.2, h = H * 0.19, x = L.bubble.x, y = L.bubble.y, b, i;
  if (nd && !o.pics && o.decos[0].sum) w = H * 0.37;
  b = { x: x, y: y, w: w, h: h, picX: nd ? x - w / 2 + H * 0.09 : x, picY: y + H * 0.06, picR: H * 0.068, rows: [] };
  for (i = 0; i < nd; i++) b.rows.push({ x: x + H * 0.07, y: nd > 1 ? y - H * 0.04 + i * H * 0.08 : y });
  return b;
}
function bakeDrawBubble(c, cu) {
  var o = cu.order, H = viewH, B = bakeBubbleBox(o), pop = cu.pop > 0 ? 1 + Math.sin(cu.pop / 0.4 * Math.PI) * 0.08 : 1, i, d, j, r = H * 0.026, m = bake.miss, pulse, n, x0, txt;
  c.save();
  c.translate(B.x, B.y);
  c.scale(pop, pop);
  c.translate(-B.x, -B.y);
  // Kuplan häntä asiakkaan päähän
  c.beginPath(); c.moveTo(B.x - H * 0.02, B.y + B.h / 2 - H * 0.01); c.lineTo(B.x + H * 0.0, B.y + B.h / 2 + H * 0.05); c.lineTo(B.x + H * 0.04, B.y + B.h / 2 - H * 0.01); c.closePath();
  artFillPath(c, '#ffffff', B.y, B.y + B.h, H * 0.05, { lineColor: '#c8a8c8', flat: true });
  artRoundRect(c, B.x - B.w / 2, B.y - B.h / 2, B.w, B.h, H * 0.04, '#ffffff', { lineColor: '#c8a8c8', flat: true });
  c.fillStyle = '#ffffff';
  c.fillRect(B.x - H * 0.015, B.y + B.h / 2 - H * 0.02, H * 0.05, H * 0.02);
  pulse = m ? 0.5 + Math.sin(globalT * 10) * 0.5 : 0;
  // Leivoskuva (paistettu, kuorrutettu, ei koristeita)
  if (m && (m.part === 'base' || m.part === 'bake' || m.part === 'frost' || m.part === 'extra')) {
    artGlow(c, B.picX, B.picY - B.picR * 0.5, B.picR * 1.6, '#ff6a6a', 0.35 + pulse * 0.3);
    c.strokeStyle = 'rgba(255,74,90,' + (0.5 + pulse * 0.5) + ')';
    c.lineWidth = Math.max(2, H * 0.007);
    bakeEll(c, B.picX, B.picY - B.picR * (m.part === 'frost' ? 0.75 : 0.5), B.picR * (1.15 + pulse * 0.12), B.picR * (m.part === 'frost' ? 0.55 : 0.95) * (1 + pulse * 0.12));
    c.stroke();
  }
  bakeDrawPastry(c, { base: o.base, cook: 1, frost: o.frost, blobs: [], decos: [] }, B.picX, B.picY, B.picR, { noShadow: true });
  if (m && m.part === 'bake') {
    // Raaka: pieni uunin liekki kuvan viereen
    artCircle(c, B.picX - B.picR * 0.9, B.picY - B.picR * 1.3, H * 0.02, '#ffe0c0', { lineColor: '#c06a3a' });
    bakeDrawDeco(c, 'candle', B.picX - B.picR * 0.9, B.picY - B.picR * 0.85, H * 0.012);
  }
  if (m && m.part === 'extra') {
    // Ylimääräinen koriste: kuva ja punainen ruksi
    bakeDrawDeco(c, m.type, B.picX + B.picR * 0.9, B.picY - B.picR * 1.0, r * 0.8);
    c.strokeStyle = '#e83040';
    c.lineWidth = Math.max(2, H * 0.006);
    c.beginPath(); c.moveTo(B.picX + B.picR * 0.65, B.picY - B.picR * 1.5); c.lineTo(B.picX + B.picR * 1.15, B.picY - B.picR * 0.85); c.moveTo(B.picX + B.picR * 1.15, B.picY - B.picR * 1.5); c.lineTo(B.picX + B.picR * 0.65, B.picY - B.picR * 0.85); c.stroke();
  }
  for (i = 0; i < o.decos.length; i++) {
    d = o.decos[i];
    if (m && m.part === 'deco' && m.i === i) {
      c.fillStyle = 'rgba(255,90,90,' + (0.18 + pulse * 0.25) + ')';
      roundRect(c, B.rows[i].x - H * 0.13, B.rows[i].y - H * 0.04, H * 0.26, H * 0.075, H * 0.03);
      c.fill();
      c.strokeStyle = 'rgba(255,74,90,' + (0.5 + pulse * 0.5) + ')';
      c.lineWidth = Math.max(2, H * 0.006);
      c.stroke();
    }
    if (o.pics) {
      // Kuvina: n kappaletta rivissä
      x0 = B.rows[i].x - (d.n - 1) * H * 0.03;
      for (j = 0; j < d.n; j++) bakeDrawDeco(c, d.type, x0 + j * H * 0.06, B.rows[i].y + H * 0.025, r);
    } else {
      txt = d.sum ? d.sum[0] + '+' + d.sum[1] : String(d.n);
      bakeText(c, txt, B.rows[i].x - H * (d.sum ? 0.035 : 0.02), B.rows[i].y, H * 0.055, '#6a3a8a', '#ffffff');
      bakeDrawDeco(c, d.type, B.rows[i].x + H * (d.sum ? 0.075 : 0.05), B.rows[i].y + H * 0.025, r);
    }
  }
  // Kaksi samanlaista: "2x"-merkki, joka vähenee ojennuksesta
  if (o.n > 1) {
    n = o.n - o.got;
    artCircle(c, B.x - B.w / 2 + H * 0.01, B.y - B.h / 2 + H * 0.01, H * 0.032, '#ffd24f', { lineColor: '#a07010' });
    bakeText(c, n + '×', B.x - B.w / 2 + H * 0.01, B.y - B.h / 2 + H * 0.012, H * 0.034, '#6a3a10');
  }
  c.restore();
}
// Illalla seuraava asiakas odottaa jo ulkona ikkunan takana
function bakeDrawQueue(c) {
  var o = bake.orders[bake.oi + 1], w = bake.L.win, H = viewH, x = w.x1 - H * 0.08, y = w.y1 - H * 0.012;
  if (!o || bakePhase() < 2 || bake.flow !== 'wait') return;
  bakeDrawCustomer(c, { kind: o.kind, order: o, x: x, t: globalT + 1, state: 'wait', hop: 0, lookT: 0, waveT: 0, shakeT: 0, sighT: 0, joyT: 0 }, y, H * 0.065);
  artCircle(c, x - H * 0.045, y - H * 0.13, H * 0.006, '#ffffff', { lineColor: '#c8a8c8' });
  artCircle(c, x - H * 0.06, y - H * 0.15, H * 0.009, '#ffffff', { lineColor: '#c8a8c8' });
}

// ---------- Piirto: hyllyt, kulhot, pussit, laatikot ----------
function bakeDrawStations(c) {
  var L = bake.L, H = viewH, i, x, y, k, sh, b, fill;
  // Koristekulhot (avautuvat päivällä)
  for (i = 0; i < L.bowls.length; i++) {
    x = L.bowls[i].x;
    y = L.bowls[i].y + H * 0.04;
    if (bake.bowlsK <= 0) {
      artRoundRect(c, x - H * 0.04, y - H * 0.06, H * 0.08, H * 0.06, H * 0.015, '#fff2e0', { lineColor: '#c89a70' });
      artBlob(c, x, y - H * 0.065, H * 0.042, H * 0.012, '#ff9ec6', { lineColor: '#b0507a' });
      continue;
    }
    k = easeOutBack(bake.bowlsK);
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    for (b = 0; b < 3; b++) bakeDrawDeco(c, BAKE_DECOS[i], (b - 1) * H * 0.022, -H * (0.035 + (b % 2) * 0.008), H * 0.02);
    c.beginPath(); c.moveTo(-H * 0.05, -H * 0.04); c.quadraticCurveTo(-H * 0.045, 0, 0, 0); c.quadraticCurveTo(H * 0.045, 0, H * 0.05, -H * 0.04); c.closePath();
    artFillPath(c, ['#ffd0e0', '#ffe0c0', '#d8eeff', '#fff2b0'][i], -H * 0.04, 0, H * 0.04, { lineColor: '#b08080' });
    c.restore();
  }
  // Pursotinpussit telineessä
  for (i = 0; i < L.bags.length; i++) {
    if (bake.bagHide[0] === i) continue;
    bakeDrawBag(c, BAKE_FROSTS[i], L.bags[i].x, L.bags[i].y + H * 0.055, H * 0.058, 0);
  }
  // Taikinalaatikot
  for (i = 0; i < L.bins.length; i++) {
    sh = bake.binShake && bake.binShake.i === i && bake.binShake.t > 0 ? Math.sin(bake.binShake.t * 40) * H * 0.006 : 0;
    bakeDrawPastry(c, { base: BAKE_BASES[i], cook: 0.3, frost: null, blobs: [], decos: [] }, L.bins[i].x + sh, L.bins[i].y + H * 0.03, H * 0.046, { noShadow: true });
  }
}
// Pursotinpussi: kärki pisteessä (x, y) alaspäin
function bakeDrawBag(c, fr, x, y, s, tilt) {
  var col = BAKE_FROST_COL[fr], line = BAKE_FROST_LINE[fr];
  c.save();
  c.translate(x, y);
  c.rotate(tilt || 0);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.55, -s * 1.3); c.quadraticCurveTo(0, -s * 1.6, s * 0.55, -s * 1.3); c.closePath();
  artFillPath(c, '#f4f0ff', -s * 1.5, 0, s, { lineColor: '#8a80a8' });
  c.beginPath(); c.moveTo(0, -s * 0.05); c.lineTo(-s * 0.4, -s * 0.95); c.quadraticCurveTo(0, -s * 1.1, s * 0.4, -s * 0.95); c.closePath();
  artFillPath(c, col, -s * 1.1, 0, s * 0.6, { lineColor: line, line: Math.max(1, s * 0.05) });
  artRoundRect(c, -s * 0.12, -s * 0.12, s * 0.24, s * 0.16, s * 0.04, '#c8c8d8', { lineColor: '#6a6a80' });
  artBlob(c, 0, -s * 1.42, s * 0.3, s * 0.1, '#ff9ec6', { lineColor: '#b0507a' });
  c.restore();
}

// ---------- Piirto: kokonaisuus ----------
function drawBakery() {
  var c = ctx, L = bake.L, P = bake.P, i, d, pos, f, k, x, y, H = viewH;
  if (!beginPlayWorld()) return;
  bakeDrawWindow(c);
  bakeDrawOven(c);
  propsDraw(c, 0);
  for (i = 0; i < bake.leavers.length; i++) bakeDrawCustomer(c, bake.leavers[i]);
  if (bake.cu) bakeDrawCustomer(c, bake.cu);
  bakeDrawCounter(c);
  propsDraw(c, 1);
  for (i = 0; i < bake.leavers.length; i++) bakeDrawHeld(c, bake.leavers[i]);
  if (bake.cu) bakeDrawHeld(c, bake.cu);
  bakeDrawStations(c);
  // Leivos lautasella
  if (P && (P.where === 'plate' || P.where === 'fly')) {
    pos = bakePlatePos();
    x = pos.x; y = pos.y;
    if (P.where === 'fly') {
      k = easeOutCubic(P.fly.t / 0.35);
      x = P.fly.x0 + (pos.x - P.fly.x0) * k;
      y = P.fly.y0 + (pos.y - P.fly.y0) * k - Math.sin(k * Math.PI) * H * 0.05;
    }
    c.save();
    c.translate(x, y);
    if (P.wob > 0) c.rotate(Math.sin(P.wob * 30) * 0.08);
    if (P.pop > 0) artSquash(c, Math.sin(P.pop / 0.35 * Math.PI) * 0.12);
    bakeDrawPastry(c, P, 0, 0, L.R, {});
    c.restore();
  }
  // Palaavat esineet
  for (i = 0; i < bake.flies.length; i++) {
    f = bake.flies[i];
    k = Math.max(0, f.t - (f.o.delay || 0)) / f.dur;
    if (f.t < (f.o.delay || 0)) continue;
    k = easeOutCubic(k);
    x = f.x0 + (f.x1 - f.x0) * k;
    y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * H * 0.06;
    if (f.kind === 'base') bakeDrawPastry(c, { base: f.o.base, cook: 0, frost: null, blobs: [], decos: [] }, x, y + H * 0.03, H * 0.042, { noShadow: true });
    else if (f.kind === 'bag') bakeDrawBag(c, BAKE_FROSTS[f.o.idx], x, y + H * 0.055, H * 0.058, 0);
    else if (f.kind === 'deco') bakeDrawDeco(c, f.o.type, x, y + H * 0.02, bakeDecoR());
    else if (f.kind === 'coin') artCircle(c, x, y, H * 0.012, '#ffd24f', { lineColor: '#a07010', hi: 0.5 });
    else if (f.kind === 'star') drawStar(c, x, y, H * 0.022 * (1 + Math.sin(k * Math.PI) * 0.6), k * 6, f.o.gold ? 0.8 : 0);
  }
  // Raahattava
  d = bake.drag;
  if (d) {
    if (d.kind === 'base') bakeDrawPastry(c, { base: d.base, cook: 0, frost: null, blobs: [], decos: [] }, d.x, d.y + H * 0.03, L.R * 0.8, { noShadow: true });
    else if (d.kind === 'past') { artShadow(c, d.x, d.y + H * 0.04, L.R, L.R * 0.25, 0.15); bakeDrawPastry(c, P, d.x, d.y, L.R, { noShadow: true }); }
    else if (d.kind === 'bag') bakeDrawBag(c, d.frost, d.x, d.y - H * 0.004, H * 0.055, Math.sin(globalT * 8) * 0.06 * Math.min(1, d.moved / H));
    else bakeDrawDeco(c, d.type, d.x, d.y, bakeDecoR() * 1.15);
  }
  bakeDrawPuffs(c);
  if (bake.cu && bake.cu.state === 'wait') bakeDrawBubble(c, bake.cu);
  bakeDrawHint(c);
  bakeDrawEvening(c);
  drawParticlesLayer(c);
  if (celebrating) bakeDrawTrophy(c);
  endPlayWorld();
  bakeDrawHud(c);
  drawTaskOverlay(c);
}
function bakeDrawPuffs(c) {
  var i, p, a;
  for (i = 0; i < bake.puffs.length; i++) {
    p = bake.puffs[i];
    a = 1 - p.t / p.life;
    c.globalAlpha = Math.max(0, a * 0.75);
    c.fillStyle = p.col;
    c.beginPath(); c.arc(p.x, p.y, p.r * (1 + p.t), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
// Ilta: lämmin sävy ja lamppujen hehku
function bakeDrawEvening(c) {
  var ev = Math.max(0, bake.dayK - 1), mo = Math.max(0, 1 - bake.dayK), L = bake.L;
  if (mo > 0) { c.fillStyle = 'rgba(255,225,190,' + (0.07 * mo) + ')'; c.fillRect(0, 0, viewW, viewH); }
  if (ev <= 0) return;
  c.fillStyle = 'rgba(255,140,90,' + (0.1 * ev) + ')';
  c.fillRect(0, 0, viewW, viewH);
  artGlow(c, L.plate.x, L.plate.y - viewH * 0.1, viewH * 0.35, '#ffd890', 0.18 * ev);
}
function bakeHintPos(st, k) {
  // Raahauskäden paikka syklin kohdassa k (0..1)
  var a = st.from, b = st.to, m, w;
  if (k < 0.2) return { x: a.x, y: a.y, press: k / 0.2 };
  if (k < 0.75) {
    m = easeInOutSine((k - 0.2) / 0.55);
    if (st.kind === 'frost' && m > 0.5) {
      w = (m - 0.5) * 2;
      return { x: b.x + Math.sin(w * Math.PI * 4) * st.rx * 0.7, y: b.y + Math.cos(w * Math.PI * 4) * viewH * 0.008, press: 1 };
    }
    if (st.kind === 'frost') m = m * 2;
    return { x: a.x + (b.x - a.x) * Math.min(1, m), y: a.y + (b.y - a.y) * Math.min(1, m) - Math.sin(Math.min(1, m) * Math.PI) * viewH * 0.05, press: 1 };
  }
  return { x: b.x, y: b.y, press: Math.max(0, 1 - (k - 0.75) / 0.12) };
}
function bakeDrawHint(c) {
  var st = bake.hintStep, k, p, s = viewH * 0.07, a;
  if (!st || bake.hintT < 0.5) return;
  k = ((bake.hintT - 0.5) % (st.kind === 'frost' ? 3.2 : 2.2)) / (st.kind === 'frost' ? 3.2 : 2.2);
  p = bakeHintPos(st, k);
  a = Math.min(1, (bake.hintT - 0.5) * 3);
  c.globalAlpha = 0.55 * a * p.press;
  if (p.press > 0.3) {
    if (st.kind === 'base') bakeDrawPastry(c, { base: st.base, cook: 0, frost: null, blobs: [], decos: [] }, p.x, p.y + viewH * 0.03, bake.L.R * 0.8, { noShadow: true });
    else if (st.kind === 'frost') bakeDrawBag(c, st.frost, p.x, p.y, viewH * 0.055, 0);
    else if (st.kind === 'decoAdd' || st.kind === 'decoRemove') bakeDrawDeco(c, st.type, p.x, p.y + viewH * 0.012, bakeDecoR());
    else if (bake.P) bakeDrawPastry(c, bake.P, p.x, p.y + bake.L.R * 0.45, bake.L.R, { noShadow: true });
  }
  c.globalAlpha = 0.9 * a;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(2, viewH * 0.005);
  if (k < 0.2) { c.beginPath(); c.arc(st.from.x, st.from.y, viewH * (0.02 + k * 0.25), 0, Math.PI * 2); c.stroke(); }
  drawHand(c, p.x + s * 0.1, p.y - s * 0.75 + (1 - p.press) * s * -0.25, s);
  c.globalAlpha = 1;
}
function bakeHudSlot(i) {
  var gap = viewH * 0.054, x = hudX() + viewH * 0.05 + i * gap + (i >= 3 ? viewH * 0.016 : 0) + (i >= 7 ? viewH * 0.016 : 0);
  return { x: x, y: viewH * 0.063 };
}
function bakeDrawHud(c) {
  var i, sl, n = bake.orders.length, last = bakeHudSlot(n - 1), w, cur, gold = bake.perfect && !bake.burnt, pop;
  w = last.x + viewH * 0.11 - hudX();
  drawHudPanel(c, hudX(), viewH * 0.018, w, viewH * 0.09, viewH * 0.025);
  for (i = 0; i < n; i++) {
    sl = bakeHudSlot(i);
    cur = i === bake.oi && !celebrating;
    if (bake.stars[i]) {
      pop = bake.starPop > 0 && i === bake.served - 1 ? 1 + bake.starPop : 1;
      if (bake.stars[i] === 2) drawStar(c, sl.x, sl.y, viewH * 0.022 * pop, 0, 0.3);
      else { c.globalAlpha = 0.85; drawStar(c, sl.x, sl.y, viewH * 0.02 * pop, 0, 0); c.globalAlpha = 1; artCircle(c, sl.x + viewH * 0.014, sl.y + viewH * 0.012, viewH * 0.006, '#ff9ec6', { line: false }); }
    } else {
      artCircle(c, sl.x, sl.y, viewH * (cur ? 0.019 + Math.sin(globalT * 4) * 0.002 : 0.015), cur ? '#fff6e0' : 'rgba(255,255,255,0.5)', { lineColor: cur ? '#d89a5a' : '#c8b0a0', flat: true });
      if (cur) bakeDrawPastry(c, { base: bake.orders[i].base, cook: 1, frost: bake.orders[i].frost, blobs: [], decos: [] }, sl.x, sl.y + viewH * 0.01, viewH * 0.013, { noShadow: true });
    }
  }
  if (!gold) c.globalAlpha = 0.5;
  bakeDrawWhisk(c, last.x + viewH * 0.06, viewH * 0.075, viewH * 0.04, gold, 0.3);
  c.globalAlpha = 1;
}
// Loppujuhla: iso kakku (kultainen, jos kaikki osui) ja vispilä
function bakeDrawTrophy(c) {
  var H = viewH, k = easeOutBack(Math.min(1, bake.celT / 0.8)), gold = bake.perfect && !bake.burnt, x = viewW / 2, y = H * 0.62, i, P;
  if (k <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  artGlow(c, 0, -H * 0.12, H * 0.32, gold ? '#ffe27a' : '#ffd0e0', 0.6);
  for (i = 0; i < 8; i++) drawStar(c, Math.cos(globalT + i * Math.PI / 4) * H * 0.24, -H * 0.12 + Math.sin(globalT + i * Math.PI / 4) * H * 0.17, H * 0.02, globalT * 2, 0.4);
  P = { base: 'round', cook: 1, frost: gold ? 'lemon' : 'pink', blobs: [], decos: [{ type: 'candle', slot: 0 }, { type: 'straw', slot: 1 }, { type: 'straw', slot: 2 }, { type: 'cherry', slot: 3 }, { type: 'cherry', slot: 4 }] };
  bakeDrawPastry(c, P, 0, 0, H * 0.15, {});
  if (gold) {
    bakeDrawWhisk(c, -H * 0.2, -H * 0.05, H * 0.12, true, -0.5 + Math.sin(globalT * 3) * 0.1);
    bakeDrawWhisk(c, H * 0.2, -H * 0.05, H * 0.12, true, 0.5 - Math.sin(globalT * 3) * 0.1);
  }
  c.restore();
}

// ---------- Kartan kuvake ja sokkelon maasto ----------
HUB_ICONS.bakery = function (c, x, y, s) {
  var r = s * 0.15;
  bakeDrawPastry(c, { base: 'round', cook: 1, frost: 'pink', blobs: [], decos: [{ type: 'candle', slot: 0 }, { type: 'cherry', slot: 1 }, { type: 'cherry', slot: 2 }, { type: 'straw', slot: 7 }] }, x, y + r * 0.85, r * 1.3, { noShadow: true });
};

// Pupulan sokkelon maasto: pikkutalot, katulyhdyt, kukkalaatikot ja mukulakivet
HUB_TILE_DECOR.town = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.8, i, col, roof;
  if (rnd < 0.14) {
    // Pieni talo
    col = ['#ffd0b0', '#d8f0c8', '#fff0a8', '#e0d0ff'][Math.floor(rnd2 * 4)];
    roof = ['#e8705a', '#5fa8d8', '#c86aa8', '#e89a3a'][Math.floor(rnd2 * 4)];
    artRoundRect(b, bx - s * 0.13, by - s * 0.24, s * 0.26, s * 0.22, s * 0.02, col, { lineColor: artShade(col, -0.45), line: Math.max(1, s * 0.015) });
    b.beginPath(); b.moveTo(bx - s * 0.17, by - s * 0.23); b.lineTo(bx, by - s * 0.38); b.lineTo(bx + s * 0.17, by - s * 0.23); b.closePath();
    artFillPath(b, roof, by - s * 0.38, by - s * 0.23, s * 0.1, { lineColor: artShade(roof, -0.45), line: Math.max(1, s * 0.015) });
    b.fillStyle = '#8a5a3a';
    b.fillRect(bx - s * 0.03, by - s * 0.1, s * 0.06, s * 0.08);
    b.fillStyle = '#bfe8ff';
    b.fillRect(bx + s * 0.05, by - s * 0.18, s * 0.05, s * 0.05);
  } else if (rnd < 0.24) {
    // Katulyhty
    artLimb(b, bx, by, bx, by - s * 0.32, s * 0.025, '#4a4a6a', '#2a2a3a');
    artCircle(b, bx, by - s * 0.34, s * 0.045, '#fff2a0', { lineColor: '#4a4a6a', line: Math.max(1, s * 0.012) });
    artGlow(b, bx, by - s * 0.34, s * 0.12, '#ffe27a', 0.35);
  } else if (rnd < 0.36) {
    // Kukkalaatikko
    artRoundRect(b, bx - s * 0.14, by - s * 0.08, s * 0.28, s * 0.08, s * 0.02, '#c8845a', { lineColor: '#7a4422', line: Math.max(1, s * 0.012) });
    for (i = 0; i < 3; i++) drawFlower(b, bx - s * 0.09 + i * s * 0.09, by - s * 0.11, s * 0.03, ['#ff7bac', '#ffd24f', '#b678ff'][(i + Math.floor(rnd2 * 3)) % 3]);
  } else if (rnd < 0.52) {
    // Mukulakivet
    b.fillStyle = 'rgba(160,130,110,0.35)';
    for (i = 0; i < 5; i++) {
      b.beginPath();
      if (b.ellipse) b.ellipse(x + s * (0.2 + ((i * 37 + rnd2 * 100) % 60) / 100), y + s * (0.3 + ((i * 53) % 50) / 100), s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
      else b.arc(x + s * (0.2 + ((i * 37 + rnd2 * 100) % 60) / 100), y + s * (0.3 + ((i * 53) % 50) / 100), s * 0.045, 0, Math.PI * 2);
      b.fill();
    }
  } else if (rnd < 0.6) {
    // Penkki
    artRoundRect(b, bx - s * 0.13, by - s * 0.1, s * 0.26, s * 0.04, s * 0.01, '#d8955f', { lineColor: '#7a4a2a', line: Math.max(1, s * 0.012) });
    artLimb(b, bx - s * 0.1, by - s * 0.06, bx - s * 0.1, by, s * 0.02, '#4a4a6a', false);
    artLimb(b, bx + s * 0.1, by - s * 0.06, bx + s * 0.1, by, s * 0.02, '#4a4a6a', false);
  }
};
