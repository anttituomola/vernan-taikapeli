'use strict';

// Dyynilasku (Kaukamaa, Aurinkodyynit): verbi LIUKU. Prinsessa liukuu
// hiekkalaudalla itsestään tasaista vauhtia dyynien yli itään. Napautus
// hyppää: lyhyt napautus on matala hyppy, pohjassa pitäminen korkea ja pitkä
// hyppy. Esteet: kaktus (matala hyppy riittää), korkea kaktus (korkea hyppy),
// skorpioni (kulkee edestakaisin), tuplakaktus ja juoksuhiekka (pitkä hyppy).
// Törmäys vie sydämen ja hidastaa hetkeksi, jolloin takana seuraava
// hiekkamyrsky pääsee lähemmäs; kiinni saanut myrsky vie sydämen. Kolme
// osuutta, joiden lopussa on keidas (tarkistuspiste). Osuudet kovenevat: uusia
// estetyyppejä, tiheämmät esteet ja hieman kovempi vauhti. Jokaisen estetyypin
// kaksi ensimmäistä saavat hyppymerkin maahan. Aurinkokivet ovat bonuksia:
// osa matalalla, osa korkeiden hyppyjen lakipisteessä. Rata arvotaan joka
// kerralla, ja jokaisen esteen ajoitusikkuna tarkistetaan simuloimalla.
// Tehtävät ensimmäisellä ja toisella keitaalla.
// Aiempi painoon ja mäen kaarevuuteen perustuva liuku (Tiny Wings -tyyli)
// hylättiin 29.9.2026: se ei ollut intuitiivinen, eikä aikuinenkaan saanut
// laudan hyppäämään.
// Hiekkapyörre (play-whirl.js) käyttää samoja juoksu-, hyppy- ja estefunktioita.

// hills: dyynejä, half: puolikkaan leveys × viewW, amp: korkeus × viewH,
// speed: liukuvauhti × viewW / s, obs: esteitä, kinds: estetyypit,
// gap: esteiden väli sekunteina (vauhdin mukaan)
var DUNE_SECTIONS = [
  { hills: 5, half: [0.5, 0.75], amp: [0.03, 0.08], speed: 0.3, obs: 6, kinds: ['cactus'], gap: [1.7, 2.4] },
  { hills: 6, half: [0.45, 0.7], amp: [0.04, 0.1], speed: 0.33, obs: 8, kinds: ['cactus', 'tall', 'scorp'], gap: [1.5, 2.1] },
  { hills: 7, half: [0.42, 0.65], amp: [0.05, 0.11], speed: 0.36, obs: 10, kinds: ['cactus', 'tall', 'scorp', 'double', 'pit'], gap: [1.35, 1.9] }
];
var DUNE_JUMP_G = 1.8;       // painovoima hypyssä × viewH / s² (pieni = leijuva, lapselle aikaa)
var DUNE_JUMP_H = 0.3;       // korkean (pohjassa pidetyn) hypyn huippu × viewH; matala noin 0,17
var DUNE_JUMP_CUT = 0.5;     // irti päästäessä nousunopeus leikataan tähän osuuteen -> matala hyppy
var DUNE_MIN_HOLD = 0.1;     // lyhinkin napautus hyppää vähintään näin pitkän painalluksen verran (s)
var DUNE_BUFFER = 0.18;      // napautus ennen laskeutumista laukeaa laskeutuessa (s)
var DUNE_PW = 0.012;         // prinsessan osuma-alueen puolileveys × viewW
var DUNE_MIN_WIN = 0.3;      // esteen ajoitusikkunan vähimmäisleveys (s)
var DUNE_SLOW = 0.9;         // törmäyksen hidastus (s), vauhti silloin DUNE_SLOW_K
var DUNE_SLOW_K = 0.35;
var DUNE_STORM_K = 0.82;     // myrskyn vauhti suhteessa liukuvauhtiin
var DUNE_STORM_LAG = 0.5;    // myrsky pysyy enintään näin kaukana takana × viewW
var DUNE_STORM_HIT = 0.08;   // myrsky saa kiinni, kun väli on alle tämän × viewW
var DUNE_BASE = 0.9;         // notkojen korkeus × viewH
var DUNE_PLATEAU = 0.72;     // keitaiden tasanteen korkeus × viewH
var DUNE_OASIS_W = 1.3;      // keitaan leveys × viewW
// Estetyypit: hh = korkeus × viewH, hw = puolileveys × viewW, need = tarvittava hyppy
// (tarvittava hyppy, low / high, lasketaan ajoitusikkunasta arvonnassa: ob.need)
var DUNE_OBS = {
  cactus: { hh: 0.09, hw: 0.012 },
  tall: { hh: 0.2, hw: 0.015 },
  scorp: { hh: 0.05, hw: 0.02, move: 0.03 },
  double: { hh: 0.09, hw: 0.055 },
  pit: { hh: 0, hw: 0.12, pit: true }
};

var dune = {
  pts: [], secs: [], gems: [], obs: [], trail: [],
  p: { x: 0, y: 0, vy: 0, ground: true, ang: 0, cut: false, slowT: 0, buf: 0 },
  cam: 0, storm: 0, sec: 0, arrive: 0, state: 'rest', t: 0, jumped: false,
  gemGot: 0, taskDelay: -1, won: false, restT: 0, snortT: 0, palmPokes: 0
};

// ---------- Maasto ----------
function duneSeg(x) {
  var pts = dune.pts, lo = 0, hi = pts.length - 2, mid;
  if (x <= pts[0].x) return 0;
  if (x >= pts[hi + 1].x) return hi;
  while (lo < hi) {
    mid = (lo + hi + 1) >> 1;
    if (pts[mid].x <= x) lo = mid; else hi = mid - 1;
  }
  return lo;
}
// Kosini-interpolaatio pisteiden välillä: sileät harjat ja notkot
function duneY(x) {
  var i = duneSeg(x), a = dune.pts[i], b = dune.pts[i + 1], t = Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
  return a.y + (b.y - a.y) * (1 - Math.cos(Math.PI * t)) / 2;
}
function duneSlope(x) {
  var i = duneSeg(x), a = dune.pts[i], b = dune.pts[i + 1], dx = b.x - a.x, t = Math.max(0, Math.min(1, (x - a.x) / dx));
  return (b.y - a.y) * Math.PI / 2 * Math.sin(Math.PI * t) / dx;
}
function duneRand(a) { return a[0] + Math.random() * (a[1] - a[0]); }
// Dyynit x0:sta eteenpäin; palauttaa loppukohdan. Lopuksi nousu tasanteelle (yP).
function duneAddHills(pts, x, n, half, amp, yP) {
  var W = viewW, h = viewH, base = h * DUNE_BASE, k, big = false, a;
  for (k = 0; k < n; k++) {
    big = Math.random() < 0.55 ? !big : big;
    a = duneRand(amp) * h * (big ? 1 : 0.7);
    x += duneRand(half) * W;
    pts.push({ x: x, y: base - Math.random() * h * 0.02, valley: true });
    x += duneRand(half) * W;
    pts.push({ x: x, y: base - h * 0.06 - a, peak: true });
  }
  x += duneRand(half) * W;
  pts.push({ x: x, y: base - Math.random() * h * 0.02, valley: true });
  x += W * 0.6;
  pts.push({ x: x, y: yP });
  return x;
}

// ---------- Juoksu ja hyppy (yhteinen Hiekkapyörteen kanssa) ----------
function duneJumpV() { return Math.sqrt(2 * DUNE_JUMP_G * DUNE_JUMP_H) * viewH; }
function duneJumpRaw(p) {
  p.ground = false;
  p.vy = -duneJumpV();
  p.cut = false;
  p.jt = 0;
}
function duneJump(p) {
  if (p.ground) {
    duneJumpRaw(p);
    playNote(660, 0, 0.08, 'triangle', 0.25);
    playNote(880, 0.05, 0.1, 'triangle', 0.2);
    spawnDust(p.x, p.y, 4, 1);
    return true;
  }
  // Napautus juuri ennen laskeutumista puskuroituu
  p.buf = DUNE_BUFFER;
  return false;
}
// Yksi askel: vauhti vx (px/s), hold = sormi pohjassa. Palauttaa true laskeutuessa.
function duneRunStep(p, dt, vx, hold) {
  var gy;
  p.x += vx * dt;
  if (p.buf > 0) p.buf -= dt;
  if (p.ground) {
    p.y = duneY(p.x);
    return false;
  }
  // Irti päästetty sormi leikkaa nousun: lyhyt napautus = matala hyppy
  p.jt = (p.jt || 0) + dt;
  if (!hold && !p.cut && p.vy < 0 && p.jt >= DUNE_MIN_HOLD) { p.vy = Math.max(p.vy, -duneJumpV() * DUNE_JUMP_CUT); p.cut = true; }
  p.vy += DUNE_JUMP_G * viewH * dt;
  p.y += p.vy * dt;
  gy = duneY(p.x);
  if (p.y >= gy && p.vy > 0) {
    p.y = gy;
    p.ground = true;
    p.vy = 0;
    return true;
  }
  return false;
}
// Onko prinsessa esteen kohdalla sen sisällä (maassa juoksuhiekassa tai kaktusta matalammalla)
function duneObsTouch(p, ob) {
  var d = DUNE_OBS[ob.kind], W = viewW, h = viewH, ox = ob.x + (ob.off || 0);
  if (Math.abs(p.x - ox) > d.hw * W + DUNE_PW * W) return false;
  if (d.pit) return p.ground || p.y >= duneY(p.x) - h * 0.005;
  return p.y > duneY(ox) - d.hh * h;
}
function duneObsUpdate(obs, dt) {
  var i, ob, d;
  for (i = 0; i < obs.length; i++) {
    ob = obs[i];
    d = DUNE_OBS[ob.kind];
    if (ob.hit > 0) ob.hit -= dt;
    if (d.move) { ob.ph += dt * ob.sp; ob.off = Math.sin(ob.ph) * d.move * viewW; }
  }
}
// Ajoitusikkuna: millä lähtöetäisyyksillä hyppy (low / high) ylittää esteen.
// Palauttaa { lo, hi } lähtökohdan etäisyytenä esteen keskeltä (px) tai null.
function duneObsWindow(ob, jump, vx) {
  var dt = 1 / 120, best = null, run = null, d, x0, p, t, ok, n, hold, W = viewW;
  var span = W * 0.6, stepX = vx / 50;
  for (d = span; d > -W * 0.05; d -= stepX) {
    x0 = ob.x - d;
    p = { x: x0, y: duneY(x0), vy: 0, ground: true, cut: false, buf: 0 };
    // Lähtöpaikka ei saa olla esteen päällä (esim. juoksuhiekan sisällä)
    ok = Math.abs(x0 - ob.x) > DUNE_OBS[ob.kind].hw * W + DUNE_PW * W + (DUNE_OBS[ob.kind].move || 0) * W;
    duneJumpRaw(p);
    t = 0;
    for (n = 0; n < 600 && ok; n++) {
      // Matala: lyhin napautus; korkea: pohjassa koko nousun ajan
      hold = jump === 'high' && t < 0.6;
      var landed = duneRunStep(p, dt, vx, hold);
      t += dt;
      // Liikkuva skorpioni: tarkistetaan pahimmat asennot
      if (DUNE_OBS[ob.kind].move) {
        var m = DUNE_OBS[ob.kind].move * W, save = ob.off;
        ob.off = -m; if (duneObsTouch(p, ob)) ok = false;
        ob.off = m; if (duneObsTouch(p, ob)) ok = false;
        ob.off = 0; if (duneObsTouch(p, ob)) ok = false;
        ob.off = save;
      } else if (duneObsTouch(p, ob)) ok = false;
      if (!ok || landed) break;
    }
    // Laskeutuminen ennen estettä ei ylitä sitä
    if (ok && p.x < ob.x + DUNE_OBS[ob.kind].hw * W + DUNE_PW * W) ok = false;
    if (ok) { if (!run) run = { lo: d, hi: d }; else run.lo = d; }
    else if (run) { if (!best || run.hi - run.lo > best.hi - best.lo) best = run; run = null; }
  }
  if (run && (!best || run.hi - run.lo > best.hi - best.lo)) best = run;
  return best;
}
// Esteet väliltä [xa, xb]: tyypit ja välit sekunteina. Jokaisesta lasketaan
// ajoitusikkuna: jos matala hyppy riittää väljästi, este on matala (low),
// muuten korkea (high); liian tiukka este siirtyy hieman tai jää pois.
// Kaksi ensimmäistä kutakin tyyppiä saavat hyppymerkin (intro).
function duneObsFit(cand, vx) {
  var win = duneObsWindow(cand, 'low', vx);
  if (win && (win.hi - win.lo) / vx >= DUNE_MIN_WIN) { cand.need = 'low'; cand.win = win; return true; }
  win = duneObsWindow(cand, 'high', vx);
  if (win && (win.hi - win.lo) / vx >= DUNE_MIN_WIN) { cand.need = 'high'; cand.win = win; return true; }
  return false;
}
function duneBuildObstacles(xa, xb, S, seen) {
  var W = viewW, obs = [], x = xa + W * 0.8, k, kind, ob, tries, vx = S.speed * W, order, i;
  for (k = 0; k < S.obs && x < xb - W * 0.6; k++) {
    // Uusi tyyppi esitellään heti, sitten satunnaisesti
    order = S.kinds.filter(function (q) { return !seen[q]; });
    kind = order.length ? order[0] : S.kinds[Math.floor(Math.random() * S.kinds.length)];
    ob = null;
    for (tries = 0; tries < 5 && !ob; tries++) {
      var cand = { kind: kind, x: x + tries * W * 0.07, hit: 0, off: 0, ph: Math.random() * 6, sp: 1.4 + Math.random() * 0.6 };
      if (duneObsFit(cand, vx)) ob = cand;
    }
    if (!ob) { x += W * 0.25; continue; }
    seen[kind] = (seen[kind] || 0) + 1;
    ob.intro = seen[kind] <= 2;
    obs.push(ob);
    x = ob.x + duneRand(S.gap) * vx;
  }
  return obs;
}

// ---------- Radan arvonta ----------
function duneBuild() {
  var W = viewW, h = viewH, pts = [], secs = [], x, s, S, yP = h * DUNE_PLATEAU, seen = {}, i, ob, start;
  pts.push({ x: -W * 1.5, y: yP });
  x = W * 0.55;
  pts.push({ x: x, y: yP });
  for (s = 0; s < DUNE_SECTIONS.length; s++) {
    S = DUNE_SECTIONS[s];
    start = x;
    x = duneAddHills(pts, x, S.hills, S.half, S.amp, yP);
    secs.push({ start: start, oasis: x, rest: x + W * 0.45, end: x + W * DUNE_OASIS_W, speed: S.speed * W, last: s === DUNE_SECTIONS.length - 1 });
    x += W * DUNE_OASIS_W;
    pts.push({ x: x, y: yP });
  }
  pts.push({ x: x + W * 3, y: yP });
  dune.pts = pts;
  dune.secs = secs;
  dune.obs = [];
  dune.gems = [];
  for (s = 0; s < secs.length; s++) {
    var list = duneBuildObstacles(secs[s].start, secs[s].oasis, DUNE_SECTIONS[s], seen);
    for (i = 0; i < list.length; i++) {
      ob = list[i];
      ob.sec = s;
      dune.obs.push(ob);
      // Aurinkokivi: korkean hypyn esteen yllä lakipisteessä, muuten välillä matalalla
      if (ob.need === 'high' || Math.random() < 0.3) {
        dune.gems.push({ x: ob.x, y: duneY(ob.x) - h * (ob.need === 'high' ? 0.3 : 0.2), got: false, sec: s, t: Math.random() * 6 });
      }
      if (i + 1 < list.length && Math.random() < 0.5) {
        var gx = (ob.x + list[i + 1].x) / 2;
        dune.gems.push({ x: gx, y: duneY(gx) - h * 0.1, got: false, sec: s, t: Math.random() * 6 });
      }
    }
  }
}

// ---------- Alustus ----------
function initDune() {
  var i;
  tasks = [makeTask(-5, 'give'), makeTask(-5, 'clock')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  camX = 0;
  duneBuild();
  dune.sec = 0;
  dune.gemGot = 0;
  dune.jumped = false;
  dune.taskDelay = -1;
  dune.won = false;
  dune.trail = [];
  dune.snortT = 0;
  dune.palmPokes = 0;
  duneRestAt(viewW * 0.3);
  duneSetupProps();
  renderBackground();
}

// Tökättävät koristeet keitailla (maailmakoordinaatit, kamera on dune.cam):
// palmut pudottavat taatelin (joka kolmas tökkäys samaan palmuun tai joka viides
// palmutökkäys pudottaa kookoksen, joka halkeaa ja kipinöi), pallokaktus
// pudottaa kukan (joka kolmas tökkäys puhkeaa sateenkaarikukkaan) ja viimeisen
// keitaan kameli tuhahtaa (joka kolmas tökkäys sylkäisee taatelin).
// Napautus hyppää tai lähtee liikkeelle silti: tökkäys ei muuta pelivastetta.
function duneSetupProps() {
  var W = viewW, h = viewH, i, sec, y = h * DUNE_PLATEAU;
  propsReset();
  for (i = 0; i < dune.secs.length; i++) {
    sec = dune.secs[i];
    duneAddPalm(sec.oasis + W * 0.3, h * 0.24);
    duneAddPalm(sec.oasis + W * 0.55, h * 0.3);
    duneAddPalm(sec.oasis + W * 0.95, h * 0.22);
    duneAddBarrel(sec.oasis + W * 1.03);
    if (sec.last) {
      duneAddPalm(sec.oasis + W * 1.1, h * 0.28);
      propAdd({
        x: sec.oasis + W * 0.86, y: y + h * 0.01, r: h * 0.1, hy: h * 0.12, color: '#e8b070', note: 196,
        draw: function () {},
        poke: function (p) {
          dune.snortT = 0.7;
          playNote(150, 0, 0.15, 'sawtooth', 0.12);
          playNote(110, 0.1, 0.25, 'sawtooth', 0.1);
          if (p.n % 3 === 0) propDropBall(p.x + h * 0.17, p.y - h * 0.2, h * 0.011, '#8a4a20', p.y - h * 0.02, W * 0.18);
        }
      });
    }
  }
}
function duneAddPalm(x, s) {
  var h = viewH, W = viewW;
  propAdd({
    x: x, y: h * DUNE_PLATEAU + h * 0.01, r: s * 0.6, hy: s * 0.85, color: '#4fb050', note: 440, amp: 0.08,
    draw: function (c) { drawPalm(c, 0, 0, s); },
    poke: function (p) {
      dune.palmPokes++;
      if (p.n % 3 === 0 || dune.palmPokes % 5 === 0) duneDropCoconut(p.x + s * 0.1, p.y - s * 0.9, p.y - h * 0.02);
      else propDropBall(p.x + s * 0.1 + (Math.random() - 0.5) * s * 0.3, p.y - s * 0.9, h * 0.011, '#8a4a20', p.y - h * 0.02, (Math.random() - 0.5) * W * 0.1);
    }
  });
}
// Kookos putoaa, pomppaa kerran ja halkeaa kahdeksi kuoreksi kipinöiden
function duneDropCoconut(x, y, ground) {
  var h = viewH;
  propDrop({
    x: x, y: y, vx: (Math.random() - 0.5) * viewW * 0.05, vy: 0, ground: ground, life: 2.4,
    draw: function (c, d) {
      if (d.bounced) {
        artBlob(c, -h * 0.013, 0, h * 0.012, h * 0.009, '#fff6e0', { lineColor: '#6a4020' });
        artBlob(c, h * 0.013, 0, h * 0.012, h * 0.009, '#fff6e0', { lineColor: '#6a4020' });
      } else {
        artCircle(c, 0, 0, h * 0.02, '#6a4020', { lineColor: '#3a2010', hi: 0.3 });
      }
    },
    onLand: function (d) {
      d.vy = 0; d.vx = 0; d.vr = 0; d.rot = 0;
      spawnSparkles(d.x, d.y, 14, '#ffffff');
      artPop(d.x, d.y, h * 0.06, '#fff6e0', 'burst');
      playNote(220, 0, 0.08, 'square', 0.15);
      playNote(1047, 0.08, 0.15, 'sine', 0.25);
      playNote(1319, 0.18, 0.2, 'sine', 0.25);
    }
  });
  playNote(330, 0, 0.1, 'triangle', 0.2);
}
function duneAddBarrel(x) {
  var h = viewH;
  propAdd({
    x: x, y: h * DUNE_PLATEAU, r: h * 0.06, hy: h * 0.04, color: '#ff8ad8', note: 587, bloomT: 0,
    update: function (p, dt) { if (p.bloomT > 0) p.bloomT -= dt; },
    draw: function (c, p) {
      var s = h * 0.045, i, k;
      artBlob(c, 0, -s * 0.8, s, s * 0.85, '#5aa84a', { shadeTo: '#3a7a30', lineColor: '#2f6a2a', hi: 0.2 });
      c.strokeStyle = 'rgba(40,90,30,0.6)';
      c.lineWidth = Math.max(1, s * 0.05);
      for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.45, -s * 0.05); c.quadraticCurveTo(i * s * 0.55, -s * 0.9, i * s * 0.3, -s * 1.6); c.stroke(); }
      if (p.bloomT > 0) {
        k = Math.min(1, (3 - p.bloomT) * 3);
        for (i = 0; i < 6; i++) duneDrawFlower(c, Math.cos(i * 1.05 - 0.5) * s * 0.95 * k, -s * 0.8 - Math.sin(i * 1.05 - 0.5) * s * 0.75 * k, s * 0.2 * k, maneColors[i]);
      }
      duneDrawFlower(c, 0, -s * 1.7, s * 0.25, '#ff8ad8');
    },
    poke: function (p) {
      var s = h * 0.045, i;
      propDrop({
        x: p.x + (Math.random() - 0.5) * s, y: p.y - s * 1.7, vx: (Math.random() - 0.5) * viewW * 0.08, vy: -h * 0.15, ground: p.y - h * 0.01,
        draw: function (c) { duneDrawFlower(c, 0, 0, s * 0.22, '#ff8ad8'); }
      });
      if (p.n % 3 === 0) {
        p.bloomT = 3;
        for (i = 0; i < 5; i++) playNote(523 * Math.pow(1.19, i), i * 0.08, 0.2, 'triangle', 0.22);
      }
    }
  });
}
function duneDrawFlower(c, x, y, r, color) {
  var i, a;
  c.fillStyle = color;
  c.beginPath();
  for (i = 0; i < 5; i++) { a = i * Math.PI * 2 / 5; c.moveTo(x, y); c.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2); }
  c.fill();
  artCircle(c, x, y, r * 0.3, '#fff6a0', { line: false });
}
// Koristeet piirretään maailmakoordinaateissa: käännetty kamera perutaan ja
// propsDraw siirtää itse camX:n verran, jotta ruudun ulkopuoliset karsiutuvat oikein
function duneDrawProps(c) {
  c.save();
  c.translate(dune.cam, 0);
  camX = dune.cam;
  propsDraw(c);
  camX = 0;
  c.restore();
}
function duneRestAt(x) {
  var p = dune.p;
  p.x = x; p.y = duneY(x); p.vy = 0; p.ground = true; p.ang = 0; p.cut = false; p.slowT = 0; p.buf = 0;
  dune.state = 'rest';
  dune.t = 0;
  dune.restT = 0;
  dune.storm = x - viewW * 1.2;
  dune.cam = x - viewW * 0.3;
}
function respawnDune() {
  // Sydämet loppu: takaisin edelliselle keitaalle, osuuden kivet palaavat
  var x = dune.sec === 0 ? viewW * 0.3 : dune.secs[dune.sec - 1].rest, i;
  for (i = 0; i < dune.gems.length; i++) {
    if (dune.gems[i].sec === dune.sec && dune.gems[i].got) { dune.gems[i].got = false; dune.gemGot--; }
  }
  dune.trail = [];
  duneRestAt(x);
}
function resizeDune() {
  camX = 0;
  // Maasto on mitoitettu ruudun mukaan: arvotaan uusi rata, mutta osuus säilyy
  var sec = dune.sec;
  duneBuild();
  dune.sec = sec;
  duneRestAt(sec === 0 ? viewW * 0.3 : dune.secs[sec - 1].rest);
  duneSetupProps();
}
function handleDuneTap(px, py) {
  if (puzzleBusy()) return;
  // Koristeet (palmut, pallokaktus, kameli) maailmakoordinaateissa; napautus jatkuu alla normaalisti
  if (px !== undefined) propsTap(px + dune.cam, py);
  // Keitaalta liikkeelle napautuksella, ajossa napautus hyppää
  if (dune.state === 'rest') {
    if (dune.taskDelay <= 0 && dune.restT > 0.4) duneGo();
    return;
  }
  if (dune.state === 'ride') {
    duneJump(dune.p);
    dune.jumped = true;
  }
}
function duneGo() {
  var p = dune.p;
  dune.state = 'ride';
  dune.t = 0;
  p.slowT = 0;
  dune.storm = p.x - viewW * DUNE_STORM_LAG * 1.6;
  playNote(523, 0, 0.1, 'triangle', 0.3);
  playNote(784, 0.08, 0.16, 'triangle', 0.3);
}

// Törmäys esteeseen: sydän, hidastus ja pieni pomppu
function duneBump(p, ob) {
  var h = viewH;
  ob.hit = 0.6;
  p.slowT = DUNE_SLOW;
  artShakeStart(h * 0.012, 0.3);
  spawnSparkles(p.x, p.y - h * 0.05, 10, ob.kind === 'scorp' ? '#c0402a' : (ob.kind === 'pit' ? '#d8b070' : '#7ac25a'));
  playNote(200, 0, 0.12, 'sawtooth', 0.15);
  if (p.ground) { p.ground = false; p.vy = -duneJumpV() * 0.35; p.cut = true; }
  loseHeart();
}
// Yksi ajokehys: liike, esteet, kivet ja myrsky. Palauttaa false, jos tila vaihtui.
function duneRideFrame(dt, speed, obs, gems, stormObj, alive) {
  var p = dune.p, W = viewW, h = viewH, i, n, vx, landed;
  vx = speed * (p.slowT > 0 ? DUNE_SLOW_K : 1);
  if (p.slowT > 0) p.slowT -= dt;
  for (n = 0; n < 4; n++) {
    landed = duneRunStep(p, dt / 4, vx, holding);
    if (landed) {
      spawnDust(p.x, p.y, 3, 1);
      playNote(330, 0, 0.05, 'triangle', 0.12);
      if (p.buf > 0) { p.buf = 0; duneJump(p); }
    }
  }
  var ta = p.ground ? Math.atan(duneSlope(p.x)) : Math.max(-0.4, Math.min(0.5, p.vy / (viewH * 4)));
  p.ang += (ta - p.ang) * Math.min(1, dt * 10);
  dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 5);
  if (p.ground && Math.random() < dt * 12) spawnDust(p.x, p.y, 1, 1);
  dune.trail.push({ x: p.x, y: p.y, t: globalT, fast: !p.ground });
  while (dune.trail.length && globalT - dune.trail[0].t > 0.35) dune.trail.shift();
  duneObsUpdate(obs, dt);
  for (i = 0; i < gems.length; i++) {
    var g = gems[i];
    if (g.got) continue;
    if (Math.abs(g.x - p.x) < h * 0.06 && Math.abs(g.y - (p.y - h * 0.06)) < h * 0.07) {
      g.got = true;
      dune.gemGot++;
      artPop(g.x, g.y, h * 0.05, '#ffd24f', 'burst');
      spawnSparkles(g.x, g.y, 10, '#ffd24f');
      playNote(1047 + dune.gemGot * 40, 0, 0.1, 'sine', 0.3);
      playNote(1568 + dune.gemGot * 40, 0.07, 0.15, 'sine', 0.25);
    }
  }
  for (i = 0; i < obs.length; i++) {
    var ob = obs[i];
    if (ob.hit > 0 || hurtT > 0) continue;
    if (duneObsTouch(p, ob)) {
      duneBump(p, ob);
      if (!alive()) return false;
    }
  }
  // Myrsky seuraa vähän liukuvauhtia hitaammin: vain törmäilevä jää kiinni
  stormObj.x += speed * DUNE_STORM_K * dt;
  stormObj.x = Math.max(stormObj.x, p.x - W * DUNE_STORM_LAG);
  if (p.x - stormObj.x < W * DUNE_STORM_HIT && hurtT <= 0) {
    artShakeStart(h * 0.015, 0.4);
    playNote(140, 0, 0.3, 'sawtooth', 0.12);
    p.slowT = 0;
    stormObj.x = p.x - W * DUNE_STORM_LAG;
    loseHeart();
    if (!alive()) return false;
  }
  return true;
}

// ---------- Päivitys ----------
function updateDune(dt) {
  var busy, p = dune.p, W = viewW, h = viewH, sec, i;
  updateTasks(dt);
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (dune.snortT > 0) dune.snortT -= dt;
  busy = puzzleBusy();
  if (dune.taskDelay > 0 && !busy) {
    dune.taskDelay -= dt;
    if (dune.taskDelay <= 0) {
      if (dune.sec === 1 && !tasks[0].opened) taskStart(tasks[0]);
      else if (dune.sec === 2 && !tasks[1].opened) taskStart(tasks[1]);
    }
  }
  for (i = 0; i < dune.gems.length; i++) dune.gems[i].t += dt;
  if (busy || celebrating) return;
  dune.t += dt;
  sec = dune.secs[Math.min(dune.sec, dune.secs.length - 1)];

  if (dune.state === 'rest') {
    dune.restT += dt;
    dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 3);
    return;
  }
  if (dune.state === 'won') {
    dune.cam += (p.x - W * 0.35 - dune.cam) * Math.min(1, dt * 2);
    if (dune.t > 1.4 && !dune.won) { dune.won = true; startCelebration(); }
    return;
  }
  if (dune.state === 'arrive') {
    // Keitaalla lauta liukuu palmun luo ja pysähtyy
    sec = dune.secs[dune.arrive];
    if (!p.ground) duneRunStep(p, dt, 0, false);
    p.x += (sec.rest - p.x) * Math.min(1, dt * 3);
    if (p.ground) p.y = duneY(p.x);
    p.ang += (0 - p.ang) * Math.min(1, dt * 6);
    dune.cam += (p.x - W * 0.3 - dune.cam) * Math.min(1, dt * 3);
    if (Math.abs(sec.rest - p.x) < W * 0.01 && p.ground) {
      if (sec.last) { dune.state = 'won'; dune.t = 0; soundFanfare(); spawnSparkles(p.x, p.y - h * 0.1, 30, '#ffe27a'); }
      else {
        if (dune.sec === 1 || dune.sec === 2) dune.taskDelay = 0.6;
        duneRestAt(p.x);
      }
    }
    return;
  }
  var stormObj = { x: dune.storm };
  var ok = duneRideFrame(dt, sec.speed, dune.obs, dune.gems, stormObj, function () { return dune.state === 'ride'; });
  if (dune.state === 'ride') dune.storm = stormObj.x;
  if (!ok || dune.state !== 'ride') return;
  // Keitaalle: osuus valmis, seuraava alkaa keitaalta
  if (p.x >= sec.oasis + W * 0.05) {
    dune.state = 'arrive';
    dune.t = 0;
    dune.arrive = dune.sec;
    if (!sec.last) dune.sec++;
    hearts = HEART_MAX;
    sectionItems = [];
    spawnSparkles(sec.rest, duneY(sec.rest) - h * 0.2, 16, '#7fd4ff');
    playNote(659, 0, 0.18, 'triangle', 0.35);
    playNote(988, 0.1, 0.3, 'triangle', 0.35);
  }
}

// ---------- Piirto ----------
function renderDuneBg(b, w, h) {
  var vw = viewW, g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#5ec8e8');
  g.addColorStop(0.55, '#bfe8f0');
  g.addColorStop(1, '#ffe2b0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, vw * 0.78, h * 0.18, h * 0.08, 0.1, '#fff0b0', '#fffbe8', '#ffd24f');
  // Kaukaiset pöytävuoret ja pyramidit
  b.fillStyle = artMix('#d8905a', '#bfe8f0', 0.55);
  for (i = 0; i < 3; i++) {
    x = vw * (0.1 + i * 0.35);
    b.beginPath();
    b.moveTo(x - h * 0.2, h * 0.62); b.lineTo(x - h * 0.13, h * 0.5); b.lineTo(x + h * 0.1, h * 0.5); b.lineTo(x + h * 0.18, h * 0.62);
    b.closePath(); b.fill();
  }
  b.fillStyle = artMix('#e0a060', '#bfe8f0', 0.45);
  b.beginPath(); b.moveTo(vw * 0.5, h * 0.62); b.lineTo(vw * 0.58, h * 0.44); b.lineTo(vw * 0.66, h * 0.62); b.closePath(); b.fill();
  b.fillStyle = artMix('#c88a50', '#bfe8f0', 0.45);
  b.beginPath(); b.moveTo(vw * 0.58, h * 0.44); b.lineTo(vw * 0.66, h * 0.62); b.lineTo(vw * 0.6, h * 0.62); b.closePath(); b.fill();
  b.fillStyle = artMix('#e0a060', '#bfe8f0', 0.55);
  b.beginPath(); b.moveTo(vw * 0.68, h * 0.62); b.lineTo(vw * 0.72, h * 0.53); b.lineTo(vw * 0.76, h * 0.62); b.closePath(); b.fill();
}

// Kaukaiset dyynit parallaksina (piirretään joka ruudulla, kevyt siniaalto)
function drawDuneFar(c, speed, y0, amp, color, wl) {
  var W = viewW, h = viewH, off = dune.cam * speed, x, step = W / 32;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, h);
  for (x = 0; x <= W + step; x += step) {
    var wx = (x + off) / (W * wl);
    c.lineTo(x, h * (y0 - amp * (0.5 + 0.5 * Math.sin(wx * Math.PI * 2) * Math.cos(wx * 1.3))));
  }
  c.lineTo(W, h);
  c.closePath();
  c.fill();
}

function drawDuneGround(c) {
  var W = viewW, h = viewH, x0 = dune.cam - 4, x1 = dune.cam + W + 4, i, a, b, x, step = Math.max(4, W / 110), k;
  var pts = dune.pts, i0 = duneSeg(x0), i1 = duneSeg(x1);
  // Jokainen notkosta notkoon ulottuva dyyni omalla sävyllään (raidat kuin Tiny-maisemissa)
  var starts = [];
  for (i = i0; i <= i1 + 1 && i < pts.length; i++) if (pts[i].valley || i === i0) starts.push(i);
  for (k = 0; k < starts.length; k++) {
    a = pts[starts[k]].x;
    b = k + 1 < starts.length ? pts[starts[k + 1]].x : x1;
    a = Math.max(a, x0); b = Math.min(b, x1);
    if (b <= a) continue;
    var idx = starts[k], col = (idx >> 1) % 2 ? '#f3c074' : '#f7cf86';
    c.beginPath();
    c.moveTo(a, h * 1.02);
    for (x = a; x < b; x += step) c.lineTo(x, duneY(x));
    c.lineTo(b, duneY(b));
    c.lineTo(b, h * 1.02);
    c.closePath();
    var g = c.createLinearGradient(0, h * 0.55, 0, h);
    g.addColorStop(0, artShade(col, 0.12));
    g.addColorStop(1, artShade(col, -0.18));
    c.fillStyle = g;
    c.fill();
  }
  // Harjan vaalea reuna
  c.strokeStyle = 'rgba(255,248,220,0.9)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.beginPath();
  for (x = x0; x <= x1; x += step) { if (x === x0) c.moveTo(x, duneY(x)); else c.lineTo(x, duneY(x)); }
  c.stroke();
  // Tuulen piirtämät väreet
  c.strokeStyle = 'rgba(200,140,70,0.25)';
  c.lineWidth = Math.max(1, h * 0.003);
  for (x = Math.floor(x0 / (h * 0.18)) * h * 0.18; x < x1; x += h * 0.18) {
    var yy = duneY(x) + h * 0.05 + ((x / (h * 0.18)) % 3) * h * 0.03;
    c.beginPath(); c.moveTo(x - h * 0.04, yy); c.quadraticCurveTo(x, yy - h * 0.012, x + h * 0.04, yy); c.stroke();
  }
}

function drawDuneOasis(c, sec, final) {
  var h = viewH, y = viewH * DUNE_PLATEAU, x = sec.oasis;
  if (x > dune.cam + viewW * 1.5 || sec.end < dune.cam - viewW * 0.5) return;
  // Palmut ovat tökättäviä koristeita (duneSetupProps); lampi piirretään maan päälle (duneDrawPond)
  // Lippu kertoo keitaan: sininen viiri
  c.strokeStyle = '#8a5a30';
  c.lineWidth = Math.max(2, h * 0.006);
  c.beginPath(); c.moveTo(x + viewW * 0.08, y); c.lineTo(x + viewW * 0.08, y - h * 0.16); c.stroke();
  c.fillStyle = '#7fd4ff';
  c.beginPath(); c.moveTo(x + viewW * 0.08, y - h * 0.16); c.lineTo(x + viewW * 0.08 + h * 0.08 + Math.sin(globalT * 6) * h * 0.008, y - h * 0.135); c.lineTo(x + viewW * 0.08, y - h * 0.11); c.closePath(); c.fill();
}

function duneDrawPond(c, sec, final) {
  var h = viewH, y = viewH * DUNE_PLATEAU, x = sec.oasis;
  if (x > dune.cam + viewW * 1.5 || sec.end < dune.cam - viewW * 0.5) return;
  artBlob(c, x + viewW * 0.72, y + h * 0.04, h * (final ? 0.3 : 0.2), h * 0.03, '#4fc3e0', { lineColor: '#2a8ab0', hi: 0.4 });
  artBlob(c, x + viewW * 0.72 - h * 0.05, y + h * 0.035, h * 0.04, h * 0.008, '#bff0ff', { line: false });
  if (final) duneDrawCamel(c, x + viewW * 0.86, y + h * 0.01, h * 0.0024);
}

function duneDrawCamel(c, x, y, s) {
  // Tuhahdus (tökkäys): pää tärähtää ja sieraimista pöllähtää
  var sn = dune.snortT > 0 ? dune.snortT : 0, shake = sn > 0 ? Math.sin(sn * 40) * s * 3 : 0;
  var bob = Math.sin(globalT * 2) * s * 3 + shake;
  artShadow(c, x, y + s * 2, s * 60, s * 10);
  c.lineCap = 'round';
  artLimb(c, x - s * 30, y - s * 30, x - s * 32, y, s * 9, '#d9a060', '#8a5a30');
  artLimb(c, x + s * 26, y - s * 30, x + s * 28, y, s * 9, '#d9a060', '#8a5a30');
  artBlob(c, x, y - s * 42, s * 45, s * 20, '#e8b070', { lineColor: '#8a5a30' });
  artBlob(c, x - s * 5, y - s * 62, s * 20, s * 16, '#e8b070', { lineColor: '#8a5a30' });
  artLimb(c, x + s * 38, y - s * 48, x + s * 52, y - s * 78 + bob, s * 11, '#e8b070', '#8a5a30');
  artBlob(c, x + s * 60, y - s * 82 + bob, s * 15, s * 9, '#e8b070', { lineColor: '#8a5a30' });
  artEye(c, x + s * 62, y - s * 86 + bob, s * 3.5, 1, sn > 0.3);
  if (sn > 0) {
    c.fillStyle = 'rgba(255,240,200,' + Math.min(0.8, sn) + ')';
    c.beginPath(); c.arc(x + s * 78 + (0.7 - sn) * s * 20, y - s * 80 + bob, s * (3 + (0.7 - sn) * 6), 0, Math.PI * 2); c.fill();
  }
}

function duneDrawCactus(c, x, y, s, hit) {
  var wg = hit > 0 ? Math.sin(globalT * 40) * s * 0.05 : 0;
  artShadow(c, x, y + s * 0.02, s * 0.3, s * 0.06);
  artLimb(c, x + wg, y, x + wg, y - s * 0.85, s * 0.22, '#5aa84a', '#2f6a2a');
  artLimb(c, x - s * 0.1 + wg, y - s * 0.45, x - s * 0.3 + wg, y - s * 0.45, s * 0.14, '#5aa84a', '#2f6a2a');
  artLimb(c, x - s * 0.3 + wg, y - s * 0.45, x - s * 0.3 + wg, y - s * 0.7, s * 0.14, '#5aa84a', '#2f6a2a');
  artLimb(c, x + s * 0.1 + wg, y - s * 0.3, x + s * 0.28 + wg, y - s * 0.3, s * 0.13, '#5aa84a', '#2f6a2a');
  artLimb(c, x + s * 0.28 + wg, y - s * 0.3, x + s * 0.28 + wg, y - s * 0.52, s * 0.13, '#5aa84a', '#2f6a2a');
  c.fillStyle = '#ff8ad8';
  c.beginPath(); c.arc(x + wg, y - s * 0.98, s * 0.07, 0, Math.PI * 2); c.fill();
}

// Esteet ja hyppymerkit (yhteinen Hiekkapyörteen kanssa). Kamera on käännetty jo.
function duneDrawAllObs(c, obs, marks) {
  var W = viewW, h = viewH, i, ob, x;
  for (i = 0; i < obs.length; i++) {
    ob = obs[i];
    x = ob.x + (ob.off || 0);
    if (x < dune.cam - W * 0.2 || x > dune.cam + W * 1.2) continue;
    duneDrawObs(c, ob, x);
    // Hyppymerkki: hehkuva kohta maassa, josta hyppy onnistuu (kaksi ensimmäistä kutakin tyyppiä)
    if (marks && ob.intro && ob.win && dune.p.x < ob.x) {
      var mx = ob.x - (ob.win.lo + ob.win.hi) / 2, my = duneY(mx), high = ob.need === 'high';
      var pulse = 0.5 + Math.sin(globalT * 6) * 0.25;
      artGlow(c, mx, my - h * 0.01, h * 0.05, high ? '#ff8ad8' : '#fff2a0', pulse);
      c.strokeStyle = high ? 'rgba(255,110,190,0.95)' : 'rgba(255,230,120,0.95)';
      c.lineWidth = Math.max(2, h * 0.007);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(mx - h * 0.02, my - h * 0.03); c.lineTo(mx, my - h * 0.055); c.lineTo(mx + h * 0.02, my - h * 0.03); c.stroke();
      if (high) { c.beginPath(); c.moveTo(mx - h * 0.02, my - h * 0.06); c.lineTo(mx, my - h * 0.085); c.lineTo(mx + h * 0.02, my - h * 0.06); c.stroke(); }
    }
  }
}
function duneDrawObs(c, ob, x) {
  var h = viewH, W = viewW, y = duneY(x), d = DUNE_OBS[ob.kind];
  if (ob.kind === 'cactus') duneDrawCactus(c, x, y + h * 0.01, h * 0.1, ob.hit);
  else if (ob.kind === 'tall') duneDrawCactus(c, x, y + h * 0.01, h * 0.2, ob.hit);
  else if (ob.kind === 'double') {
    duneDrawCactus(c, x - d.hw * W * 0.62, y + h * 0.01, h * 0.1, ob.hit);
    duneDrawCactus(c, x + d.hw * W * 0.62, y + h * 0.01, h * 0.095, ob.hit);
  } else if (ob.kind === 'scorp') {
    c.save(); c.translate(x, y - h * 0.025); c.scale(Math.cos(ob.ph) > 0 ? 1 : -1, 1);
    drawDowseScorp(c, 0, 0, h * 0.055, globalT);
    c.restore();
  } else if (ob.kind === 'pit') {
    // Juoksuhiekka: pyörteinen kuoppa, kuplat
    var r = d.hw * W;
    artBlob(c, x, y + h * 0.012, r, h * 0.022, '#b8884a', { lineColor: '#7a5428' });
    c.strokeStyle = 'rgba(120,80,40,0.55)';
    c.lineWidth = Math.max(1.5, h * 0.004);
    for (var k = 0; k < 3; k++) {
      c.beginPath(); c.ellipse(x, y + h * 0.012, r * (0.3 + k * 0.22), h * (0.006 + k * 0.005), 0, globalT * (1 + k * 0.4) + k, globalT * (1 + k * 0.4) + k + 4); c.stroke();
    }
  }
}

function duneDrawGem(c, x, y, s, t) {
  var bob = Math.sin(t * 3) * s * 0.15;
  artGlow(c, x, y + bob, s * 2.2, '#ffd24f', 0.45);
  c.save();
  c.translate(x, y + bob);
  c.rotate(t * 1.5);
  c.beginPath();
  for (var i = 0; i < 8; i++) {
    var r = i % 2 ? s * 0.5 : s, a = i / 8 * Math.PI * 2;
    if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
  artFillPath(c, '#ffc83a', -s, s, s, { lineColor: '#c07a10' });
  c.restore();
  artCircle(c, x, y + bob, s * 0.3, '#fff6c8', { line: false });
}

// Prinsessa hiekkalaudalla. Origo laudan pohjassa, kulma rinteen mukaan.
function duneDrawRider(c, x, y, ang, crouch) {
  var h = viewH, s = h / 520;
  artShadow(c, x, duneY(x) + h * 0.005, h * 0.05 * (dune.p.ground ? 1 : 0.6), h * 0.012, dune.p.ground ? 0.2 : 0.1);
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  // Lauta
  artRoundRect(c, -h * 0.055, -h * 0.018, h * 0.11, h * 0.018, h * 0.009, '#ff6fb0', { lineColor: '#b83a7a' });
  c.fillStyle = '#ffe27a';
  c.fillRect(-h * 0.02, -h * 0.013, h * 0.04, h * 0.006);
  c.translate(0, -h * 0.016);
  if (crouch) artSquash(c, -0.14);
  drawPrincessFree(c, 0, 0, s, 1, 0, false, globalT);
  c.restore();
}

function duneDrawStorm(c) {
  var W = viewW, h = viewH, sx = dune.storm - dune.cam, i, a, x, y;
  if (sx < -W * 0.4) return;
  // Pyörteinen hiekkaseinä vasemmalta
  var g = c.createLinearGradient(sx - W * 0.4, 0, sx + W * 0.06, 0);
  g.addColorStop(0, 'rgba(170,110,60,0.95)');
  g.addColorStop(0.8, 'rgba(200,140,80,0.75)');
  g.addColorStop(1, 'rgba(220,170,110,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, Math.max(0, sx + W * 0.06), h);
  c.strokeStyle = 'rgba(255,230,190,0.5)';
  c.lineWidth = Math.max(2, h * 0.006);
  c.lineCap = 'round';
  for (i = 0; i < 7; i++) {
    a = globalT * (2 + i * 0.3) + i;
    x = sx - W * 0.05 - (i % 3) * W * 0.06;
    y = h * (0.15 + i * 0.12);
    c.beginPath(); c.arc(x, y, h * (0.04 + (i % 3) * 0.015), a, a + 3.6); c.stroke();
  }
  // Myrskyn silmät, kun se on lähellä
  if (dune.p.x - dune.storm < W * 0.35) {
    artEye(c, sx - W * 0.02, h * 0.45, h * 0.018, 1, Math.sin(globalT * 3) > 0.95);
    artEye(c, sx + W * 0.012, h * 0.45, h * 0.018, 1, Math.sin(globalT * 3) > 0.95);
  }
}

function drawDune() {
  var c = ctx, W = viewW, h = viewH, i, p = dune.p, g, sec, k;
  if (!beginPlayWorld()) return;
  drawDuneFar(c, 0.15, 0.7, 0.08, artMix('#f0b878', '#bfe8f0', 0.45), 1.3);
  drawDuneFar(c, 0.35, 0.76, 0.09, artMix('#f3c074', '#ffe2b0', 0.25), 0.9);
  c.save();
  c.translate(-dune.cam, 0);
  for (i = 0; i < dune.secs.length; i++) drawDuneOasis(c, dune.secs[i], dune.secs[i].last);
  duneDrawProps(c);
  drawDuneGround(c);
  for (i = 0; i < dune.secs.length; i++) duneDrawPond(c, dune.secs[i], dune.secs[i].last);
  duneDrawAllObs(c, dune.obs, true);
  for (i = 0; i < dune.gems.length; i++) {
    g = dune.gems[i];
    if (g.got || g.x < dune.cam - W * 0.1 || g.x > dune.cam + W * 1.1) continue;
    duneDrawGem(c, g.x, g.y, h * 0.025, g.t);
  }
  // Vauhtijälki
  if (dune.trail.length > 1) {
    c.lineCap = 'round';
    for (i = 1; i < dune.trail.length; i++) {
      var a = 1 - (globalT - dune.trail[i].t) / 0.35;
      c.strokeStyle = dune.trail[i].fast ? 'rgba(255,230,120,' + (a * 0.8) + ')' : 'rgba(255,255,255,' + (a * 0.45) + ')';
      c.lineWidth = h * 0.012 * a;
      c.beginPath(); c.moveTo(dune.trail[i - 1].x, dune.trail[i - 1].y - h * 0.01); c.lineTo(dune.trail[i].x, dune.trail[i].y - h * 0.01); c.stroke();
    }
  }
  var blink = hurtT > 0 && Math.sin(globalT * 30) > 0;
  if (!blink) duneDrawRider(c, p.x, p.y, p.ang, false);
  c.restore();
  // Hiukkaset ja pop-efektit ovat maailmakoordinaateissa: kamera vain piirron ajaksi
  camX = dune.cam;
  drawParticlesLayer(c);
  duneDrawStorm(c);
  // Korkealla ruudun yläpuolella: nuoli näyttää paikan
  if (p.y < h * 0.02) {
    artCircle(c, p.x - dune.cam, h * 0.03, h * 0.015, '#ff6fb0', { lineColor: '#fff' });
  }
  // Vihje: käsi napauttaa keitaalla (liikkeelle) ja ennen ensimmäistä hyppyä
  if (dune.state === 'rest' && dune.restT > 0.8 && !puzzleBusy() && dune.taskDelay <= 0) {
    k = (globalT % 1.2) / 1.2;
    drawHand(c, W * 0.62, h * 0.4 + Math.abs(Math.sin(k * Math.PI)) * h * 0.05, h * 0.045);
  } else if (!dune.jumped && dune.state === 'ride') {
    k = (globalT % 0.8) / 0.8;
    drawHand(c, W * 0.62, h * 0.4 + Math.abs(Math.sin(k * Math.PI)) * h * 0.04, h * 0.045);
  }
  endPlayWorld();
  camX = 0;
  drawDuneHud(c);
  drawHearts(c);
  drawTaskOverlay(c);
}

// HUD: aurinkokivet ja matkamittari (myrsky, prinsessa, keitaat)
function drawDuneHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX() + viewH * 0.2, W = viewW, i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 6, hs * 3.6, hs);
  c.fill();
  duneDrawGem(c, left + hs * 1.8, pad * 0.5 + hs * 1.8, hs * 0.8, globalT);
  c.fillStyle = '#8a4a10';
  c.font = 'bold ' + Math.round(hs * 1.5) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(dune.gemGot + '', left + hs * 3.2, pad * 0.5 + hs * 1.9);
  c.textBaseline = 'alphabetic';
  // Matkamittari
  var mx0 = W * 0.6, mx1 = W * 0.86, my = pad * 0.5 + hs * 1.8, total = dune.secs.length ? dune.secs[dune.secs.length - 1].oasis : 1, x0 = viewW * 0.3;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = hs * 0.5;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(mx0, my); c.lineTo(mx1, my); c.stroke();
  for (i = 0; i < dune.secs.length; i++) {
    var ox = mx0 + (mx1 - mx0) * (dune.secs[i].oasis - x0) / (total - x0);
    drawPalm(c, ox, my + hs * 0.6, hs * 2);
  }
  var f = Math.max(0, Math.min(1, (dune.p.x - x0) / (total - x0))), sf = Math.max(0, Math.min(1, (dune.storm - x0) / (total - x0)));
  if (dune.state === 'ride') artCircle(c, mx0 + (mx1 - mx0) * sf, my, hs * 0.55, '#b8804a', { lineColor: '#6a4a28' });
  artCircle(c, mx0 + (mx1 - mx0) * f, my, hs * 0.7, '#ff6fb0', { lineColor: '#ffffff' });
}

HUB_ICONS.dune = function (c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s * 0.26, y + s * 0.14);
  c.quadraticCurveTo(x - s * 0.08, y - s * 0.12, x + s * 0.08, y + s * 0.02);
  c.quadraticCurveTo(x + s * 0.18, y - s * 0.06, x + s * 0.26, y + s * 0.14);
  c.closePath();
  artFillPath(c, '#f7cf86', y - s * 0.1, y + s * 0.14, s * 0.2, { lineColor: '#c08a40' });
  c.save();
  c.translate(x - s * 0.06, y - s * 0.03);
  c.rotate(0.5);
  artRoundRect(c, -s * 0.08, -s * 0.02, s * 0.16, s * 0.035, s * 0.015, '#ff6fb0', { lineColor: '#b83a7a' });
  c.restore();
  duneDrawGem(c, x + s * 0.14, y - s * 0.2, s * 0.05, 0);
};

// Aurinkodyynien sokkelon maasto: hiekkaväreet, pienet kaktukset ja kivet
HUB_TILE_DECOR.desert = function (b, x, y, s, rnd, rnd2) {
  var cx = x + s / 2, bx = cx + (rnd2 - 0.5) * s * 0.4, by = y + s * 0.85;
  if (rnd < 0.2) {
    artLimb(b, bx, by, bx, by - s * 0.3, s * 0.08, '#5aa84a', '#2f6a2a');
    artLimb(b, bx, by - s * 0.15, bx - s * 0.1, by - s * 0.15, s * 0.05, '#5aa84a', false);
    artLimb(b, bx - s * 0.1, by - s * 0.15, bx - s * 0.1, by - s * 0.24, s * 0.05, '#5aa84a', false);
  } else if (rnd < 0.4) {
    b.strokeStyle = 'rgba(190,130,60,0.35)';
    b.lineWidth = Math.max(1, s * 0.03);
    b.beginPath(); b.moveTo(bx - s * 0.15, by - s * 0.1); b.quadraticCurveTo(bx, by - s * 0.16, bx + s * 0.15, by - s * 0.1); b.stroke();
  } else if (rnd < 0.5) {
    artBlob(b, bx, by - s * 0.04, s * 0.08, s * 0.05, '#c8a070', { line: false });
  }
};
