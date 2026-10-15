'use strict';

// Kukkaniitty (Pikkupilven kotimatka, luku 1): ruusukultainen aamu, helppo ja
// pitkä. Lapsen ensikosketus pitkään kenttään, joten oppiminen on lempeää.
//   Alku: yksisarvinen ja prinsessa saapuvat niitylle, jossa Pikkupilvi istuu
//   surullisena voikukan päällä ja tihkuttaa kyyneliä. Napautus (tai hetken
//   odotus) -> se katsoo ylös, ihastuu, pyrähtää prinsessan luo, kikattaa ja
//   vilkuttaa. Sitten käsi näyttää, miten pilvi raahataan ensimmäisen siemenen yli.
//   Ohjaus: sormi raahaa Pikkupilveä (se seuraa pienellä viiveellä ja kallistuu).
//   Pideltynä pilvi sataa: pisarat putoavat ja roiskahtavat. Sade kasvattaa
//   kasvia (n. 1,2 s), ja täysi kasvi pomahtaa esiin (venytys, kipinät, sävelet).
//   Vesi: pilvessä on vettä (1,0); sade kuluttaa sen vähitellen ja pilvi
//   kutistuu ja kalpenee (täysi pilvi = 8 s sadetta). Tyhjänä se ei sada vaan janoaa (kuivia kipinöitä,
//   hmm). Raahaa se veteen (puro, lampi, kastepisara lehdellä, joki) -> se
//   hörppää ja on taas pullea. Joka esteen lähellä on vettä, ja janoisesta
//   pilvestä käsi näyttää tien veden luo.
//   Esteet (polku kulkee itsestään ja pysähtyy esteelle):
//     1. Puro (aina ensin): siemen rannalla -> lumpeenlehdet sillaksi.
//     Väliin arvotussa järjestyksessä: Sieniportaat (2-4 sientä nousevaan
//     korkeuteen, yksisarvinen hyppii), Unikeko siili (herää, aivastaa,
//     kikattaa ja kieri pois), Nuupahtanut auringonkukka (nousee seisomaan ja
//     hymyilee), Pavunvarsi (kierteinen varsi jyrkänteelle, yksisarvinen kiipeää).
//     Lopuksi joenranta: jättisiemenestä kasvaa iso lumpeenlehti ja taikakukka;
//     prinsessa poimii kukan (luvun lahja), lehti lipuu pois -> trekChapterDone.
//   Keräiltävät: kymmenen nuppua polun varrella; sade avaa nupun ja siitepöly-
//   kipinä lentää HUD:iin. Kaikki auki -> lopussa kukat kiertyvät seppeleeksi.
//   Piilopupu: tavallinen multakeko ja pieni lehti yhdessä kolmesta paikasta;
//   sade kasvattaa jättiporkkanan, jonka naatin seasta pupu pomppaa esiin.
//   Tökättävät: etana (piiloutuu; 3. tökkäys: kuori pyörii sateenkaarena),
//   mehiläispesä puussa (pörinä; 5. tökkäys: mehiläiset sydämeksi), myyränkeko
//   (myyrä kurkkaa pikkulaseissa; 3.: kukka), voikukan siemenpallo (pöllähtää ja
//   kasvaa takaisin), Pikkupilven voikukka. Yksisarvinen hirnahtaa napautuksesta.
// Paikat tallennetaan U-yksikköinä (U = worldW / 5 ≈ ruudun leveys) ja korkeudet
// × viewH, joten koon muutos laskee vain pikselipaikat uudelleen (tkmPlace).
// Niitty on pidempi kuin maailma (TKM_LEN = 7 U): kaukainen ja keskikerros
// liukuvat skaalatulla kameralla, ja lähin kerros (polku, puro, joki) piirretään
// omiin ruudun puolikkaan levyisiin paloihin, jotka esirenderöidään tarpeen mukaan.

var TKM_SPEED = 0.052;        // kävely × U / s
var TKM_WAKE = 0.32;          // esteen siemen nousee maasta, kun yksisarvinen on näin lähellä × viewW
var TKM_INTRO_SPEED = 0.11;   // alun sisääntulo × U / s
var TKM_PX = 0.3;             // yksisarvisen paikka ruudulla × viewW
var TKM_PUP_R = 0.055;        // Pikkupilven säde × viewH
var TKM_FOLLOW = 10;          // pilven seurannan jäykkyys (pienempi = enemmän viivettä)
var TKM_GRIP = 0.035;         // pilvi sormen yläpuolella × viewH (sade ei jää sormen alle)
var TKM_DRAIN = 1 / 8;        // sade kuluttaa vettä / s (täysi pilvi = 8 s sadetta)
var TKM_REFILL = 1.1;         // juominen täyttää / s
var TKM_NEED = 1.2;           // sadetta kasvuun, s
var TKM_NEED_BUD = 0.45;      // nupun avautuminen, s
var TKM_NEED_BIG = 2.0;       // jättisiemen joen rannalla, s
var TKM_HOLD_RAIN = 0.12;     // sade alkaa, kun sormi on pitänyt pilveä näin kauan
var TKM_BUDS = 12;            // nuput
var TKM_LEN = 7;              // niityn pituus × U
var TKM_SLOTS = [0.85, 1.9, 3.05, 4.2, 5.35];  // esteiden paikat × U (1. = puro)
var TKM_MEET_X = 0.3;         // yksisarvinen pysähtyy tapaamaan Pikkupilven × U
var TKM_PUP_HOME = 0.56;      // Pikkupilven voikukka × U
var TKM_SEED = 6.46;          // jättisiemen × U
var TKM_BANK = 6.55;          // joen ranta × U
var TKM_MEET_WAIT = 2.6;      // alussa Pikkupilvi katsoo ylös itsestään, s
var TKM_HINT_IDLE = 4.5;      // vihjekäsi esteellä, kun lapsi on odottanut, s
var TKM_THIRST_IDLE = 1.2;    // vihjekäsi veden luo janoisena, s
var TKM_STEP = 0.042;         // sieniportaan nousu × viewH
var TKM_MUSH_D = 0.085;       // sienten väli × U
var TKM_G = 3.4;              // hypyn painovoima × viewH / s²
var TKM_PROPS = [1.3, 3.3, 4.47];  // etana, myyränkeko, voikukan siemenpallo × U
var TKM_TREES = [0.17, 1.4, 2.6, 3.7, 4.9, 6.1];  // puut polun takana × U
var TKM_BUD_COLS = ['#ff7bac', '#c9a0ff', '#ffb84f', '#7fc8ff', '#ff8f8f', '#ffe066'];

var tkm = {
  built: false, phase: 'intro', phaseT: 0, t: 0,
  ux: 0, uy: 0, uvy: 0, air: false, walkPhase: 0, moving: false, ust: 'walk', land: 0, neighT: 0, climb: null,
  pup: null, down: null, wasHolding: false, idleT: 0, everHeld: false, everGrew: false,
  obs: [], targets: [], elev: [], srcs: [], buds: [], fronts: [],
  drops: [], ripples: [], flyers: [], fluff: [], bunny: null, bunnyF: 0,
  bloomed: 0, hudBump: 0, endT: 0, done: false, allBloom: false, patT: 0, sayT: 0
};

// ---------- Apu ----------
function tkmU() { return worldW / 5; }
function tkmX(f) { return f * tkmU(); }
function tkmRnd(a, b) { return a + Math.random() * (b - a); }
function tkmClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function tkmShuffle(a) {
  var i, j, t;
  for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function tkmPupR() { return viewH * TKM_PUP_R; }
function tkmObs(kind) {
  var i;
  for (i = 0; i < tkm.obs.length; i++) if (tkm.obs[i].kind === kind) return tkm.obs[i];
  return null;
}

// ---------- Maasto ----------
// Polun pohja: loivaa aaltoilua, joka tasoittuu esteiden kohdalla
function tkmBaseY(x) {
  var f = x / tkmU(), w = 1, i, d;
  for (i = 0; i < tkm.obs.length; i++) {
    d = Math.abs(f - tkm.obs[i].xf) / 0.32;
    if (d < w) w = d;
  }
  return viewH * (0.795 + (0.012 * Math.sin(f * 5.3 + 0.7) + 0.007 * Math.sin(f * 13.1 + 1.9)) * easeInOutSine(w));
}
// Kohouma (tasanne tai alamäki) × viewH
function tkmElev(f) {
  var i, s;
  for (i = 0; i < tkm.elev.length; i++) {
    s = tkm.elev[i];
    if (f >= s.a && f < s.b) return s.h0 + (s.h1 - s.h0) * easeInOutSine((f - s.a) / (s.b - s.a));
  }
  return 0;
}
// Polun pinta ilman kasvavia osia (taustan piirto, sijoittelu)
function tkmPathY0(x) {
  return tkmBaseY(x) - tkmElev(x / tkmU()) * viewH;
}
// Polun pinta nyt: purossa vesi tai lumpeenlehdet, sienet portaina, joessa vesi
function tkmPathY(x) {
  var f = x / tkmU(), o, i, t;
  o = tkm.obs[0];
  if (o && f >= o.xf && f < o.xf + o.wf) return tkmBaseY(x) + viewH * (o.seed.grown ? 0.032 : 0.06);
  if (f >= TKM_BANK) return tkmBaseY(tkmX(TKM_BANK)) + viewH * 0.06;
  o = tkmObs('mush');
  if (o) {
    for (i = 0; i < o.n; i++) {
      t = o.m[i];
      if (t.grown && f >= o.xf + (i - 0.5) * o.d && f < o.xf + (i + 0.5) * o.d) return tkmBaseY(x) - o.h[i] * viewH;
    }
  }
  return tkmPathY0(x);
}

// ---------- Rakennus ----------
// Kasvatettava kohde: kind, paikka (xf × U, dy × viewH polusta tai etualasta),
// puolileveys hw × viewH, tarvittava sade (s), omistaja (este)
function tkmTarget(kind, xf, dy, hw, need, o, ref) {
  var t = { kind: kind, xf: xf, dy: dy, hw: hw, need: need, o: o, ref: ref || 'path', fill: 0, grown: false, gt: 0, q: 0, wob: 0, x: 0, y: 0, hwpx: 0 };
  tkm.targets.push(t);
  return t;
}
function tkmFrontFree(xf, gap) {
  var i;
  for (i = 0; i < tkm.fronts.length; i++) if (Math.abs(tkm.fronts[i] - xf) < gap) return false;
  return true;
}
function tkmBuild() {
  var mids = tkmShuffle(['mush', 'hog', 'sun', 'bean']), i, o, s, a, H, f, n, tries, spots;
  tkm.obs = []; tkm.targets = []; tkm.elev = []; tkm.srcs = []; tkm.buds = []; tkm.fronts = [];
  // 1. Puro: siemen rannalla, lumpeenlehdet sillaksi
  o = { kind: 'brook', xf: TKM_SLOTS[0], wf: tkmRnd(0.16, 0.2), done: false };
  o.seed = tkmTarget('seed', o.xf - 0.04, 0, 0.04, TKM_NEED, o);
  o.seed.awake = true;
  o.pads = Math.max(3, Math.round(o.wf / 0.055));
  tkm.obs.push(o);
  tkm.srcs.push({ kind: 'brook', xf: o.xf + o.wf / 2, wf: o.wf / 2 + 0.01, dy: 0.05, ph: 0 });
  tkm.fronts.push(o.xf + o.wf / 2, o.xf - 0.03, o.xf + o.wf + 0.03);
  for (i = 0; i < 4; i++) {
    s = TKM_SLOTS[i + 1];
    o = { kind: mids[i], done: false };
    if (o.kind === 'mush') {
      o.n = 2 + Math.floor(Math.random() * 3);
      o.d = TKM_MUSH_D;
      o.xf = s - 0.05;
      o.h = []; o.m = []; o.cols = [];
      for (n = 0; n < o.n; n++) {
        o.h.push((n + 1) * TKM_STEP);
        o.m.push(tkmTarget('mush', o.xf + n * o.d, 0, 0.04, TKM_NEED * 0.85, o));
        o.m[n].i = n;
        o.cols.push(['#ff6b6b', '#c47bff', '#ff9f43', '#ff7bac'][(n + (Math.random() < 0.5 ? 0 : 2)) % 4]);
      }
      a = o.xf + (o.n - 0.5) * o.d;
      H = (o.n + 1) * TKM_STEP;
      o.wallF = a; o.H = H;
      tkm.elev.push({ a: a, b: a + 0.13, h0: H, h1: H }, { a: a + 0.13, b: a + 0.34, h0: H, h1: 0 });
    } else if (o.kind === 'hog') {
      o.xf = s;
      o.t0 = tkmTarget('hog', s, 0, 0.055, TKM_NEED, o);
      o.st = 'sleep'; o.st_t = 0; o.dx = 0; o.rot = 0;
      o.col = Math.random() < 0.5 ? '#a8754a' : '#c08a5a';
    } else if (o.kind === 'sun') {
      o.xf = s - 0.06;
      o.t0 = tkmTarget('sun', s - 0.06, 0, 0.2, TKM_NEED, o);
      o.t0.dxv = 0.17;
      o.lean = 0;
    } else {
      o.xf = s - 0.05;
      o.cf = o.xf + 0.045;
      o.H = tkmRnd(0.17, 0.2);
      o.t0 = tkmTarget('bean', o.xf, 0, 0.04, TKM_NEED, o);
      o.climbed = false;
      o.wallF = o.cf;
      tkm.elev.push({ a: o.cf, b: o.cf + 0.18, h0: o.H, h1: o.H }, { a: o.cf + 0.18, b: o.cf + 0.4, h0: o.H, h1: 0 });
    }
    tkm.obs.push(o);
    // Vettä esteen edessä (etualalla) ja toinen kastelehti esteiden välissä
    tkm.srcs.push({ kind: Math.random() < 0.5 ? 'pond' : 'dew', xf: s - 0.15, wf: 0.05, dy: 0.115, ph: Math.random() * 6 });
    tkm.fronts.push(s - 0.15);
    if (i < 3) { tkm.srcs.push({ kind: 'dew', xf: s + 0.5, wf: 0.045, dy: 0.105, ph: Math.random() * 6 }); tkm.fronts.push(s + 0.5); }
  }
  // Loppu: jättisiemen joen rannalla
  o = { kind: 'final', xf: TKM_SEED, done: false };
  o.t0 = tkmTarget('big', TKM_SEED, 0, 0.06, TKM_NEED_BIG, o);
  tkm.obs.push(o);
  tkm.srcs.push({ kind: 'river', xf: (TKM_BANK + TKM_LEN) / 2 + 0.05, wf: (TKM_LEN - TKM_BANK) / 2, dy: 0.06, ph: 0 });
  // Tökättävien paikat etualalla
  tkm.fronts.push(TKM_PROPS[0], TKM_PROPS[1], TKM_PROPS[2]);
  // Piilopupu: yksi kolmesta paikasta
  spots = [{ xf: 2.66, dy: 0.13, ref: 'base' }, { xf: 3.77, dy: -0.07, ref: 'path' }, { xf: 5.78, dy: 0.12, ref: 'base' }];
  s = spots[Math.floor(Math.random() * spots.length)];
  tkm.bunny = tkmTarget('bunny', s.xf, s.dy, 0.04, 1.0, null, s.ref);
  tkm.bunny.pop = 0;
  if (s.ref === 'base') tkm.fronts.push(s.xf);
  // Nuput etualalla tasavälein, vapaisiin kohtiin
  for (i = 0; i < TKM_BUDS; i++) {
    tries = 0;
    do {
      f = 0.45 + (i + 0.5) * ((TKM_BANK - 0.3) / TKM_BUDS) + tkmRnd(-0.14, 0.14);
      tries++;
    } while (!tkmFrontFree(f, 0.075) && tries < 30);
    tkm.fronts.push(f);
    a = tkmTarget('bud', f, tkmRnd(0.09, 0.15), 0.035, TKM_NEED_BUD, null, 'base');
    a.col = TKM_BUD_COLS[i % TKM_BUD_COLS.length];
    a.idx = -1;
    a.ph = Math.random() * 6;
    tkm.buds.push(a);
  }
}
// Pikselipaikat (alussa ja koon muutoksessa)
function tkmPlace() {
  var i, t, s;
  for (i = 0; i < tkm.targets.length; i++) {
    t = tkm.targets[i];
    t.x = tkmX(t.xf) + (t.dxv || 0) * viewH;
    t.y = (t.ref === 'base' ? tkmBaseY(t.x) : tkmPathY0(tkmX(t.xf))) + t.dy * viewH;
    t.hwpx = t.hw * viewH;
  }
  for (i = 0; i < tkm.srcs.length; i++) {
    s = tkm.srcs[i];
    s.x = tkmX(s.xf);
    s.hw = s.wf * tkmU();
    s.y = (s.kind === 'river' ? tkmBaseY(tkmX(TKM_BANK)) : tkmBaseY(s.x)) + s.dy * viewH;
  }
}

// ---------- Alustus ----------
function tkmInit() {
  tkm.seed = (tkm.seed || 0) + 1;
  tkmBuild();
  tkmPlace();
  tkm.built = true;
  tkm.phase = 'intro';
  tkm.phaseT = 0;
  tkm.t = 0;
  tkm.ux = tkmX(0.02);
  tkm.uy = tkmPathY(tkm.ux);
  tkm.uvy = 0;
  tkm.air = false;
  tkm.walkPhase = 0;
  tkm.moving = false;
  tkm.ust = 'walk';
  tkm.land = 0;
  tkm.neighT = 0;
  tkm.climb = null;
  tkm.down = null;
  tkm.wasHolding = false;
  tkm.idleT = 0;
  tkm.everHeld = false;
  tkm.everGrew = false;
  tkm.drops = [];
  tkm.ripples = [];
  tkm.flyers = [];
  tkm.fluff = [];
  tkm.bloomed = 0;
  tkm.hudBump = 0;
  tkm.endT = 0;
  tkm.end = null;
  tkm.done = false;
  tkm.allBloom = false;
  tkm.patT = 0;
  tkm.sayT = 0;
  tkm.pup = {
    x: 0, y: 0, vx: 0, tilt: 0, water: 1, holdT: 0, raining: false, drinking: false,
    mood: 'sad', moodT: 0, wig: 0, wave: 0, slurpT: 0, hmmT: 0, offX: 0, offY: 0, sit: true, look: 0, lookY: 0
  };
  tkmPupHomePos();
  camX = 0;
  tkmSetupProps();
}
// Pikkupilvi istuu voikukallaan (ruutukoordinaatit)
function tkmPupHomePos() {
  var x = tkmX(TKM_PUP_HOME), p = tkm.pup;
  p.x = x - camX;
  p.y = tkmPathY0(x) - viewH * 0.035 - viewH * 0.2 - tkmPupR() * 0.55;
}
function tkmResize() {
  var p = tkm.pup;
  if (!tkm.built) return;
  tkmPlace();
  if (tkm.ust === 'walk' && !tkm.air) tkm.uy = tkmPathY(tkm.ux);
  tkm.drops = [];
  tkm.ripples = [];
  camX = tkmCamFor(tkm.ux);
  if (p.sit) tkmPupHomePos();
  p.x = tkmClamp(p.x, tkmPupR(), viewW - tkmPupR());
  p.y = tkmClamp(p.y, viewH * 0.16, viewH * 0.97 - tkmPupR() * 0.6);
  tkmSetupProps();
}
function tkmCamFor(x) { return tkmClamp(x - viewW * TKM_PX, 0, Math.max(0, tkmX(TKM_LEN) - viewW)); }

// ---------- Tökättävät ----------
function tkmSetupProps() {
  var x;
  propsReset();
  x = tkmX(0.17);
  tkmAddHive(x + viewH * 0.1, tkmPathY0(x) - viewH * 0.145, viewH * 0.04);
  x = tkmX(TKM_PUP_HOME);
  tkmAddDandelion(x, tkmPathY0(x) - viewH * 0.035, viewH * 0.2);
  x = tkmX(TKM_PROPS[0]);
  tkmAddSnail(x, tkmBaseY(x) + viewH * 0.11, viewH * 0.04);
  x = tkmX(TKM_PROPS[1]);
  tkmAddMole(x, tkmBaseY(x) + viewH * 0.12, viewH * 0.045);
  x = tkmX(TKM_PROPS[2]);
  tkmAddClock(x, tkmBaseY(x) + viewH * 0.135, viewH * 0.13);
}
// Etana kivellä: piiloutuu kuoreensa; 3. tökkäys pyöräyttää kuoren sateenkaarena
function tkmAddSnail(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.6, hy: s * 0.7, color: '#ffb0d0', note: 587, amp: 0.1, layer: 1, hideT: 0, spinT: 0, ph: Math.random() * 6,
    update: function (p, dt) {
      if (p.hideT > 0) p.hideT -= dt;
      if (p.spinT > 0) p.spinT -= dt;
      p.ph += dt;
    },
    poke: function (p) {
      p.hideT = 1.6;
      playNote(880, 0.05, 0.08, 'sine', 0.12);
      playNote(660, 0.13, 0.12, 'sine', 0.12);
      if (p.n % 3 === 0) {
        p.spinT = 1.4;
        p.hideT = 1.8;
        for (var i = 0; i < 6; i++) playNote(523 * Math.pow(1.122, i), 0.1 + i * 0.07, 0.12, 'triangle', 0.15);
        spawnSparkles(p.x, p.y - s, 10, RAINBOW_COLORS[p.n % 7]);
      }
    },
    draw: function (c, p) {
      var hide = p.hideT > 0 ? Math.min(1, Math.min(p.hideT, 1.6 - Math.min(1.6, p.hideT)) * 6 + (p.hideT > 0.3 ? 1 : 0)) : 0, i, a, spin = p.spinT > 0 ? (1.4 - p.spinT) / 1.4 : 0;
      hide = Math.min(1, hide);
      artShadow(c, 0, 0, s * 1.6, s * 0.3, 0.16);
      // Kivi
      artBlob(c, s * 0.2, -s * 0.12, s * 1.3, s * 0.32, '#c8c0d8', { lineColor: '#7a7090', hi: 0.25 });
      // Sateenkaaripyrstö pyöriessä
      if (spin > 0) {
        c.lineCap = 'round';
        for (i = 0; i < 6; i++) {
          c.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.8 * (1 - spin));
          c.lineWidth = s * 0.12;
          c.beginPath(); c.arc(0, -s * 0.85, s * (0.95 + i * 0.13), spin * 14 - 1.6, spin * 14); c.stroke();
        }
      }
      // Etanan vartalo ja tuntosarvet (vetäytyvät piiloon)
      if (hide < 1) {
        c.save();
        c.translate(s * 0.45 * hide, 0);
        artBlob(c, s * 0.35, -s * 0.48, s * 0.85, s * 0.2, '#d8e88a', { lineColor: '#7a9040', hi: 0.3 });
        a = Math.sin(p.ph * 2) * 0.1;
        artLimb(c, s * 0.95, -s * 0.6, s * (1.15 + a), -s * (1.15 - hide * 0.5), s * 0.07, '#d8e88a', '#7a9040');
        artLimb(c, s * 0.8, -s * 0.6, s * (0.85 - a), -s * (1.2 - hide * 0.5), s * 0.07, '#c8d878', '#7a9040');
        artCircle(c, s * (1.15 + a), -s * (1.18 - hide * 0.5), s * 0.1, '#ffffff', { lineColor: '#7a9040' });
        artCircle(c, s * (1.16 + a), -s * (1.18 - hide * 0.5), s * 0.05, '#333333', { line: false });
        artBlush(c, s * 1.05, -s * 0.5, s * 0.08);
        c.restore();
      }
      // Kuori
      c.save();
      c.translate(0, -s * 0.85);
      c.rotate(spin * Math.PI * 4);
      artCircle(c, 0, 0, s * 0.6, '#ff9fc0', { lineColor: '#b0507a', hi: 0.35 });
      c.strokeStyle = '#c8608a';
      c.lineWidth = Math.max(1, s * 0.08);
      c.beginPath();
      for (i = 0; i < 26; i++) {
        a = i * 0.45;
        if (i === 0) c.moveTo(0, 0); else c.lineTo(Math.cos(a) * s * 0.02 * i, Math.sin(a) * s * 0.02 * i);
      }
      c.stroke();
      c.restore();
    }
  });
}
// Mehiläispesä puun oksalla: tökkäys pörisyttää; 5. tökkäys: mehiläiset sydämeksi
function tkmAddHive(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.5, hy: -s * 0.9, color: '#ffd24f', note: 494, amp: 0.2, buzzT: 0, heartT: 0, ph: Math.random() * 6,
    update: function (p, dt) {
      if (p.buzzT > 0) p.buzzT -= dt;
      if (p.heartT > 0) p.heartT -= dt;
      p.ph += dt * (p.buzzT > 0 ? 3 : 1);
    },
    poke: function (p) {
      var i;
      p.buzzT = 1.5;
      for (i = 0; i < 5; i++) playNote(180 + Math.random() * 40, i * 0.06, 0.08, 'sawtooth', 0.04);
      if (p.n % 5 === 0) {
        p.heartT = 3.2;
        playNote(784, 0.3, 0.12, 'triangle', 0.18);
        playNote(988, 0.42, 0.12, 'triangle', 0.18);
        playNote(1175, 0.54, 0.25, 'triangle', 0.18);
      }
    },
    draw: function (c, p) {
      var i, a, bx, by, hk, hx, hy, k;
      // Oksan tynkä ja naru
      artLimb(c, -s * 0.9, -s * 0.15, s * 0.3, 0, s * 0.18, '#9c6b3f', '#5a3a1e');
      artLimb(c, 0, 0, 0, s * 0.25, s * 0.05, '#7a5030', false);
      // Pesä: kerrokselliset pallerot
      for (i = 0; i < 4; i++) artBlob(c, 0, s * (0.45 + i * 0.32), s * (0.5 + Math.sin(i * 1.2 + 0.4) * 0.12 + (i === 1 || i === 2 ? 0.1 : 0)), s * 0.2, '#ffcf5a', { lineColor: '#b07a1a', hi: i === 0 ? 0.3 : 0 });
      artCircle(c, 0, s * 1.3, s * 0.13, '#5a3a1e', { line: false });
      // Mehiläiset: kiertävät pesää tai muodostavat sydämen
      hk = p.heartT > 0 ? Math.min(1, Math.min(3.2 - p.heartT, p.heartT) * 2.5) : 0;
      for (i = 0; i < 7; i++) {
        a = p.ph * (1.6 + i * 0.13) + i * 0.9;
        bx = Math.cos(a) * s * (1.0 + (i % 3) * 0.2);
        by = s * 0.8 + Math.sin(a * 1.3) * s * 0.55;
        if (hk > 0) {
          k = i / 7 * Math.PI * 2;
          hx = 16 * Math.pow(Math.sin(k), 3) * s * 0.07;
          hy = -(13 * Math.cos(k) - 5 * Math.cos(2 * k) - 2 * Math.cos(3 * k) - Math.cos(4 * k)) * s * 0.07 - s * 1.2;
          bx += (hx - bx) * easeInOutSine(hk);
          by += (hy - by) * easeInOutSine(hk);
        }
        tkmDrawBee(c, bx, by, s * 0.16, p.ph * 30 + i);
      }
      if (hk > 0.6) {
        c.globalAlpha = (hk - 0.6) / 0.4 * 0.5;
        artBlob(c, 0, -s * 1.25, s * 0.5, s * 0.45, '#ff9fc0', { line: false });
        c.globalAlpha = 1;
      }
    }
  });
}
function tkmDrawBee(c, x, y, s, t) {
  var w = Math.abs(Math.sin(t)) * 0.6 + 0.4;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath(); c.ellipse(x - s * 0.2, y - s * 0.7, s * 0.45, s * 0.6 * w, -0.4, 0, Math.PI * 2); c.fill();
  artBlob(c, x, y, s, s * 0.72, '#ffd84a', { lineColor: '#6a4a10', line: Math.max(1, s * 0.15) });
  c.fillStyle = '#4a3a20';
  c.fillRect(x - s * 0.1, y - s * 0.68, s * 0.28, s * 1.36);
  artEye(c, x + s * 0.55, y - s * 0.1, s * 0.2, 0.5, false);
}
// Myyränkeko: myyrä kurkkaa pikkulaseissa; 3. tökkäys: myyrä ojentaa kukan
function tkmAddMole(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 1.5, hy: s * 0.5, color: '#c89a6a', note: 392, amp: 0.1, layer: 1, peekT: 0, gift: false,
    update: function (p, dt) { if (p.peekT > 0) p.peekT -= dt; },
    poke: function (p) {
      p.peekT = 2.2;
      p.gift = p.n % 3 === 0;
      playNote(330, 0.08, 0.08, 'square', 0.06);
      playNote(440, 0.16, 0.12, 'triangle', 0.14);
      if (p.gift) { playNote(988, 0.35, 0.1, 'sine', 0.16); playNote(1319, 0.45, 0.2, 'sine', 0.16); }
    },
    draw: function (c, p) {
      var k = p.peekT > 0 ? Math.min(1, Math.min(p.peekT, 2.2 - p.peekT) * 4) : 0, my;
      artShadow(c, 0, 0, s * 1.5, s * 0.3, 0.16);
      if (k > 0) {
        my = -s * 0.25 - easeOutBack(k) * s * 0.75;
        artBlob(c, 0, my, s * 0.55, s * 0.55, '#6a5a7a', { lineColor: '#3a2e48', hi: 0.25 });
        artBlob(c, 0, my + s * 0.12, s * 0.2, s * 0.14, '#ff9fb8', { lineColor: '#b05a7a' });
        // Pikkulasit
        c.strokeStyle = '#3a2e48';
        c.lineWidth = Math.max(1, s * 0.06);
        c.fillStyle = 'rgba(200,230,255,0.6)';
        c.beginPath(); c.arc(-s * 0.2, my - s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.arc(s * 0.2, my - s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-s * 0.06, my - s * 0.15); c.lineTo(s * 0.06, my - s * 0.15); c.stroke();
        c.fillStyle = '#222';
        c.beginPath(); c.arc(-s * 0.2, my - s * 0.13, s * 0.05, 0, Math.PI * 2); c.arc(s * 0.2, my - s * 0.13, s * 0.05, 0, Math.PI * 2); c.fill();
        artCircle(c, -s * 0.45, my + s * 0.35, s * 0.13, '#ffb8c8', { lineColor: '#b05a7a' });
        if (p.gift) {
          artLimb(c, s * 0.45, my + s * 0.35, s * 0.6, my - s * 0.4, s * 0.06, '#5aa84a', '#2f6a2c');
          drawFlower(c, s * 0.6, my - s * 0.45, s * 0.14, '#ff7bac');
        } else artCircle(c, s * 0.45, my + s * 0.35, s * 0.13, '#ffb8c8', { lineColor: '#b05a7a' });
      }
      // Multakeko
      c.beginPath();
      c.moveTo(-s * 1.2, 0);
      c.quadraticCurveTo(-s * 0.7, -s * 0.75, 0, -s * 0.72);
      c.quadraticCurveTo(s * 0.7, -s * 0.75, s * 1.2, 0);
      c.closePath();
      artFillPath(c, '#a87a52', -s * 0.75, 0, s * 0.8, { lineColor: '#5e3e22' });
      if (k > 0) artBlob(c, 0, -s * 0.66, s * 0.45, s * 0.1, '#5e3e22', { line: false });
      artCircle(c, -s * 0.5, -s * 0.3, s * 0.07, '#8a6040', { line: false });
      artCircle(c, s * 0.6, -s * 0.2, s * 0.06, '#8a6040', { line: false });
    }
  });
}
// Voikukan siemenpallo: tökkäys pöllyttää siemenet lentoon; pallo kasvaa takaisin
function tkmAddClock(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.45, hy: s * 0.95, color: '#ffffff', note: 784, amp: 0.25, layer: 1, puff: 1,
    update: function (p, dt) { if (p.puff < 1) p.puff = Math.min(1, p.puff + dt / 2.6); },
    poke: function (p) {
      var i, a;
      if (p.puff > 0.6) {
        for (i = 0; i < 12; i++) {
          a = -Math.PI / 2 + tkmRnd(-1.4, 1.4);
          tkm.fluff.push({ x: p.x, y: p.y - s * 0.95, vx: Math.cos(a) * viewH * tkmRnd(0.08, 0.2) + viewH * 0.05, vy: Math.sin(a) * viewH * tkmRnd(0.05, 0.15), t: 0, life: tkmRnd(2, 3.4), ph: Math.random() * 6 });
        }
        for (i = 0; i < 4; i++) playNote(1568 + i * 200, i * 0.05, 0.1, 'sine', 0.07);
      }
      p.puff = 0;
    },
    draw: function (c, p) {
      var i, a, r = s * 0.24 * (0.25 + 0.75 * p.puff), n = Math.round(14 * p.puff);
      artShadow(c, 0, 0, s * 0.25, s * 0.06, 0.14);
      c.strokeStyle = '#6aa84a'; c.lineWidth = Math.max(1.5, s * 0.03); c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.06, -s * 0.5, 0, -s * 0.95); c.stroke();
      artBlob(c, -s * 0.1, -s * 0.12, s * 0.12, s * 0.035, '#6cc45c', { rot: -0.5, lineColor: '#2f7a2c' });
      artBlob(c, s * 0.1, -s * 0.2, s * 0.12, s * 0.035, '#6cc45c', { rot: 0.5, lineColor: '#2f7a2c' });
      artGlow(c, 0, -s * 0.95, r * 1.6, '#ffffff', 0.4);
      c.strokeStyle = 'rgba(255,255,255,0.95)';
      c.lineWidth = Math.max(1, s * 0.012);
      for (i = 0; i < n; i++) {
        a = i / Math.max(1, n) * Math.PI * 2 + 0.2;
        c.beginPath(); c.moveTo(0, -s * 0.95); c.lineTo(Math.cos(a) * r, -s * 0.95 + Math.sin(a) * r); c.stroke();
        artCircle(c, Math.cos(a) * r, -s * 0.95 + Math.sin(a) * r, r * 0.22, '#ffffff', { lineColor: '#d8dce8', line: Math.max(1, r * 0.04) });
      }
      artCircle(c, 0, -s * 0.95, s * 0.035, '#c8b070', { line: false });
    }
  });
}
// Pikkupilven voikukka: keltainen kukka, jonka päällä pilvi istuu alussa
function tkmAddDandelion(x, y, s) {
  propAdd({
    x: x, y: y, r: s * 0.3, hy: s * 0.95, color: '#ffe066', note: 698, amp: 0.15,
    draw: function (c) {
      var i, a;
      artShadow(c, 0, 0, s * 0.2, s * 0.05, 0.14);
      c.strokeStyle = '#5aa84a'; c.lineWidth = Math.max(2, s * 0.035); c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-s * 0.08, -s * 0.5, 0, -s * 0.92); c.stroke();
      artBlob(c, -s * 0.14, -s * 0.1, s * 0.16, s * 0.04, '#6cc45c', { rot: -0.4, lineColor: '#2f7a2c' });
      artBlob(c, s * 0.12, -s * 0.22, s * 0.15, s * 0.04, '#6cc45c', { rot: 0.5, lineColor: '#2f7a2c' });
      for (i = 0; i < 14; i++) {
        a = i / 14 * Math.PI * 2;
        artBlob(c, Math.cos(a) * s * 0.1, -s * 0.97 + Math.sin(a) * s * 0.045, s * 0.07, s * 0.022, '#ffd84a', { rot: a, lineColor: '#d89a10', line: Math.max(1, s * 0.006) });
      }
      artBlob(c, 0, -s * 0.98, s * 0.09, s * 0.04, '#ffe680', { lineColor: '#d89a10', hi: 0.3 });
    }
  });
}

// ---------- Syöte ----------
function tkmTap(px, py) {
  var p = tkm.pup, r = tkmPupR(), onPup;
  if (!tkm.built) return;
  onPup = Math.hypot(px - p.x, py - p.y) < r * 1.5;
  tkm.down = { t: 0, x: px, y: py, onPup: onPup, ignore: false };
  tkm.idleT = 0;
  if (tkm.phase === 'intro' || tkm.phase === 'meet') {
    if (onPup && tkm.phase === 'meet' && tkm.phaseT > 0.3) tkmMeetStart();
    else if (onPup) { p.wig = 0.5; trekPupSound('sad'); }
    tkm.down.ignore = true;
    if (!onPup) tkmTapWorld(px, py);
    return;
  }
  if (tkm.phase !== 'play') { tkm.down.ignore = true; tkmTapWorld(px, py); return; }
  if (onPup) {
    p.offX = p.x - px;
    p.offY = p.y - py;
    return;
  }
  // Yksisarvinen tai koriste: napautus tökkää eikä tartu pilveen
  if (tkmTapWorld(px, py)) { tkm.down.ignore = true; return; }
  p.offX = 0;
  p.offY = -viewH * TKM_GRIP;
}
function tkmTapWorld(px, py) {
  var us = trekUS(), x = tkm.ux - camX, y = tkm.uy;
  if (Math.abs(px - x) < us * 45 && py > y - us * 120 && py < y + us * 4) {
    if (tkm.neighT <= 0) {
      tkm.neighT = 1;
      playNote(660, 0, 0.12, 'triangle', 0.2);
      playNote(880, 0.1, 0.12, 'triangle', 0.2);
      playNote(740, 0.2, 0.2, 'triangle', 0.18);
      spawnSparkles(tkm.ux + us * 44, y - us * 100, 6, '#ff9fb8');
    }
    return true;
  }
  return propsTap(px + camX, py);
}

// ---------- Päivitys ----------
function tkmUpdate(dt) {
  updateParticles(dt);
  propsUpdate(dt);
  updateConfetti(dt);
  if (!tkm.built) return;
  tkm.t += dt;
  tkm.phaseT += dt;
  if (tkm.neighT > 0) tkm.neighT -= dt;
  if (tkm.hudBump > 0) tkm.hudBump -= dt;
  if (tkm.sayT > 0) tkm.sayT -= dt;
  if (tkm.down) tkm.down.t += dt;
  if (holding) tkm.idleT = 0; else tkm.idleT += dt;
  tkmUpdateIntro(dt);
  tkmUpdatePup(dt);
  tkmUpdateTargets(dt);
  tkmUpdateObs(dt);
  tkmUpdateUnicorn(dt);
  tkmUpdateEnding(dt);
  tkmUpdateFx(dt);
  camX += (tkmCamFor(tkm.ux) - camX) * Math.min(1, dt * 4);
  if (tkm.pup.sit) tkmPupHomePos();
  tkm.wasHolding = holding;
}

// Alku: yksisarvinen saapuu, Pikkupilvi on surullinen, katsoo ylös ja pyrähtää prinsessan luo
function tkmUpdateIntro(dt) {
  var p = tkm.pup, us = trekUS(), hx, hy, k;
  if (tkm.phase === 'intro') {
    p.mood = 'sad';
    if (!tkm.moving && tkm.ux >= tkmX(TKM_MEET_X) - 1) { tkm.phase = 'meet'; tkm.phaseT = 0; trekPupSound('sad'); }
  } else if (tkm.phase === 'meet') {
    p.mood = 'sad';
    if (tkm.phaseT > TKM_MEET_WAIT) tkmMeetStart();
  } else if (tkm.phase === 'hello') {
    // 0..0.7 ihastus, 0.7..1.4 lento prinsessan luo, 1.4..2.6 kikatus ja vilkutus
    hx = tkm.ux - camX + us * 30;
    hy = tkm.uy - us * 128;
    if (tkm.phaseT < 0.7) { p.mood = 'wow'; p.look = -1; }
    else if (tkm.phaseT < 1.4) {
      k = easeInOutSine((tkm.phaseT - 0.7) / 0.7);
      p.sit = false;
      p.x = p.sx + (hx - p.sx) * k;
      p.y = p.sy + (hy - p.sy) * k - Math.sin(k * Math.PI) * viewH * 0.08;
      p.mood = 'happy';
      p.look = -1;
    } else {
      if (!p.giggled) { p.giggled = true; trekPupSound('giggle'); p.wig = 0.6; spawnSparkles(hx + camX, hy, 10, '#ffd0e8'); artPop(hx + camX, hy, viewH * 0.06, '#ff9fd0', 'ring'); }
      p.x = hx + Math.sin(tkm.phaseT * 3) * viewH * 0.01;
      p.y = hy;
      p.mood = 'happy';
      p.wave = 0.3;
      p.look = -1;
      if (tkm.phaseT > 2.7) {
        tkm.phase = 'play';
        tkm.phaseT = 0;
        tkm.idleT = 0;
        playNote(659, 0, 0.12, 'triangle', 0.2);
        playNote(784, 0.1, 0.12, 'triangle', 0.2);
        playNote(1047, 0.2, 0.2, 'triangle', 0.2);
      }
    }
  }
}
function tkmMeetStart() {
  var p = tkm.pup;
  if (tkm.phase !== 'meet') return;
  tkm.phase = 'hello';
  tkm.phaseT = 0;
  p.sx = p.x; p.sy = p.y;
  p.giggled = false;
  trekPupSound('wow');
  artPop(p.x + camX, p.y, tkmPupR() * 1.6, '#ffffff', 'ring');
}

// Pikkupilvi: seuraa sormea, sataa, janoaa ja juo
function tkmUpdatePup(dt) {
  var p = tkm.pup, r = tkmPupR(), tx, ty, k, ox = p.x, ctl, src, wx, d = tkm.down, n;
  if (p.wig > 0) p.wig -= dt;
  if (p.wave > 0) p.wave -= dt;
  if (p.moodT > 0) p.moodT -= dt;
  ctl = tkm.phase === 'play' && holding && d && !d.ignore && !celebrating;
  // Lyhyt napautus pilveen (ei raahausta) -> kikatus ja heilahdus
  if (tkm.wasHolding && !holding && d && d.onPup && !d.ignore && d.t < 0.3 && tkm.phase === 'play' && Math.hypot(lastPX - d.x, lastPY - d.y) < viewH * 0.04) {
    p.wig = 0.6;
    trekPupSound('giggle');
    spawnSparkles(p.x + camX, p.y - r * 0.5, 6, '#ffd0e8');
  }
  if (ctl) {
    tx = tkmClamp(lastPX + p.offX, r * 1.1, viewW - r * 1.1);
    ty = tkmClamp(lastPY + p.offY, viewH * 0.16, viewH * 0.97 - r * 0.6);
    k = 1 - Math.exp(-dt * TKM_FOLLOW);
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    p.holdT += dt;
    tkm.everHeld = true;
  } else {
    p.holdT = 0;
  }
  p.vx = dt > 0 ? (p.x - ox) / dt : 0;
  k = tkmClamp(-p.vx / viewH * 0.12, -0.4, 0.4);
  p.tilt += (k - p.tilt) * Math.min(1, dt * 8);
  if (tkm.phase !== 'play') { p.raining = false; p.drinking = false; return; }
  // Juominen: pilven pohja koskettaa vettä
  wx = p.x + camX;
  src = tkmSrcAt(wx, p.y + r * 0.6);
  p.drinking = !!src;
  if (src) {
    if (p.water < 1) {
      p.water = Math.min(1, p.water + dt * TKM_REFILL);
      p.slurpT -= dt;
      if (p.slurpT <= 0) {
        p.slurpT = 0.45;
        trekPupSound('slurp');
        tkmRipple(wx, src.kind === 'dew' ? src.y - viewH * 0.02 : src.y, r * 0.8);
      }
      if (Math.random() < dt * 14) particles.push({ x: wx + tkmRnd(-r, r) * 0.6, y: p.y + r * 0.5, vx: tkmRnd(-10, 10), vy: -viewH * tkmRnd(0.05, 0.12), life: 0.6, age: 0, size: 3 + Math.random() * 4, color: 'rgba(160,215,255,0.9)', noGravity: true });
      if (p.water >= 1) {
        artPop(wx, p.y, r * 1.5, '#9fd8ff', 'ring');
        playNote(784, 0, 0.1, 'sine', 0.18);
        playNote(1175, 0.08, 0.16, 'sine', 0.18);
        p.wig = 0.4;
      }
    }
    src.wob = 0.4;
  }
  // Sade
  p.raining = ctl && p.holdT > TKM_HOLD_RAIN && p.water > 0 && !p.drinking;
  if (p.raining) {
    p.water = Math.max(0, p.water - dt * TKM_DRAIN);
    n = dt * 32;
    while (n > 0) {
      if (Math.random() < n) tkmSpawnDrop(wx + tkmRnd(-0.7, 0.7) * r * (0.72 + 0.28 * p.water), p.y + r * 0.55);
      n -= 1;
    }
    tkm.patT -= dt;
    if (tkm.patT <= 0) { tkm.patT = 0.11; playNote(1500 + Math.random() * 900, 0, 0.03, 'sine', 0.035); }
    if (p.water <= 0) {
      trekPupSound('hmm');
      p.hmmT = 1.4;
      artPop(wx, p.y, r * 1.2, '#e8eef6', 'ring');
    }
  }
  // Tyhjä pilvi: kuivia kipinöitä ja hmm
  if (ctl && p.water <= 0 && !p.drinking) {
    p.hmmT -= dt;
    if (p.hmmT <= 0) { p.hmmT = 1.6; trekPupSound('hmm'); }
    if (Math.random() < dt * 8) particles.push({ x: wx + tkmRnd(-r, r) * 0.7, y: p.y + r * 0.5, vx: tkmRnd(-20, 20), vy: tkmRnd(10, 40), life: 0.5, age: 0, size: 2 + Math.random() * 3, color: '#efe6d0' });
  }
  p.mood = p.moodT > 0 ? p.mood : (p.drinking && p.water < 1 ? 'happy' : (p.water < 0.12 ? 'thirsty' : 'happy'));
}
// Vesi pisteen kohdalla (pilven pohja), tai null
function tkmSrcAt(wx, by) {
  var i, s, r = tkmPupR();
  for (i = 0; i < tkm.srcs.length; i++) {
    s = tkm.srcs[i];
    if (Math.abs(wx - s.x) > s.hw + r * 0.35) continue;
    if (s.kind === 'pond' || s.kind === 'dew') {
      if (by > s.y - viewH * 0.035 && by < s.y + viewH * 0.09) return s;
    } else if (by > s.y - r * 0.2) return s;
  }
  return null;
}
function tkmSpawnDrop(x, y) {
  var land = tkmLandY(x, y);
  if (tkm.drops.length > 60) tkm.drops.shift();
  tkm.drops.push({ x: x, y: y, vy: viewH * tkmRnd(0.75, 0.95), land: land.y, water: land.water });
}
// Mihin pisara osuu: kasvin latvaan, veteen tai maahan
function tkmLandY(x, y) {
  var best = 1e9, water = false, i, t, top, s, g;
  for (i = 0; i < tkm.targets.length; i++) {
    t = tkm.targets[i];
    if (Math.abs(x - t.x) > t.hwpx) continue;
    if (t.kind === 'bud' && t.grown) continue;
    top = tkmTop(t);
    if (top > y + 2 && top < best) best = top;
  }
  for (i = 0; i < tkm.srcs.length; i++) {
    s = tkm.srcs[i];
    if (Math.abs(x - s.x) < s.hw && s.y > y + 2 && s.y < best) { best = s.y; water = true; }
  }
  g = tkmPathY(x);
  if (g > y + 4 && g < best) { best = g; water = false; }
  if (best > viewH) { best = Math.min(viewH * 0.99, y + viewH * 0.1); water = false; }
  return { y: best, water: water };
}
// Kohteen latva (pisarat pysähtyvät tähän, sade kasvattaa kun pilvi on yllä)
function tkmTop(t) {
  var H = viewH, o = t.o;
  if (t.kind === 'seed') return t.y - H * 0.03;
  if (t.kind === 'mush') return t.grown ? t.y - o.h[t.i] * H : t.y - H * 0.025;
  if (t.kind === 'hog') return t.y - H * 0.075;
  if (t.kind === 'sun') return t.y - H * 0.09;
  if (t.kind === 'bean') return t.y - H * 0.035;
  if (t.kind === 'big') return t.y - H * 0.065;
  if (t.kind === 'bud') return t.y - H * 0.05;
  return t.y - H * 0.03;
}

// Kasvatus: sade kohteen yllä täyttää sen
function tkmUpdateTargets(dt) {
  var p = tkm.pup, r = tkmPupR(), i, t, wx = p.x + camX, bottom = p.y + r * 0.5, q;
  for (i = 0; i < tkm.targets.length; i++) {
    t = tkm.targets[i];
    if (t.wob > 0) t.wob -= dt;
    if (t.grown) { t.gt += dt; continue; }
    // Esteen siemen nousee maasta vasta, kun yksisarvinen lähestyy (näyttää, mihin sataa seuraavaksi)
    if (t.o && !t.awake) {
      if (tkm.phase !== 'play' || t.x - tkm.ux > viewW * TKM_WAKE) continue;
      t.awake = true;
      t.awT = 0;
      if (t.x - camX < viewW) {
        artPop(t.x, t.y - viewH * 0.03, viewH * 0.05, '#fff2a0', 'ring');
        spawnSparkles(t.x, t.y - viewH * 0.03, 8, '#fff2a0');
        playNote(659, 0, 0.1, 'sine', 0.16);
        playNote(988, 0.08, 0.14, 'sine', 0.16);
      }
    }
    if (t.awT !== undefined) t.awT += dt;
    if (p.raining && Math.abs(wx - t.x) < t.hwpx + r * 0.5 && bottom < tkmTop(t) + viewH * 0.03) {
      t.fill += dt / t.need;
      t.wob = 0.2;
      q = Math.floor(t.fill * 4);
      if (q > t.q && q < 4) { t.q = q; playNote(523 * [1, 1.26, 1.5][q - 1], 0, 0.12, 'sine', 0.14); }
      if (t.fill >= 1) tkmGrow(t);
    }
  }
}
function tkmGrow(t) {
  var p = tkm.pup, i, base = t.kind === 'bud' ? 784 : 523, sx = t.x - camX;
  t.grown = true;
  t.gt = 0;
  t.fill = 1;
  if (t.kind === 'bud') {
    t.idx = tkm.bloomed++;
    artPop(t.x, t.y - viewH * 0.04, viewH * 0.04, t.col, 'ring');
    spawnSparkles(t.x, t.y - viewH * 0.04, 8, t.col);
    tkm.flyers.push({ x0: sx, y0: t.y - viewH * 0.04, idx: t.idx, t: 0, dur: 0.75, col: t.col });
    playNote(784 * Math.pow(1.06, t.idx), 0, 0.14, 'triangle', 0.2);
    playNote(1175 * Math.pow(1.06, t.idx), 0.08, 0.18, 'triangle', 0.18);
    if (tkm.bloomed >= TKM_BUDS) tkm.allBloom = true;
    if (tkm.sayT <= 0) { p.mood = 'wow'; p.moodT = 0.5; }
    return;
  }
  tkm.everGrew = true;
  artPop(t.x, tkmTop(t) - viewH * 0.04, viewH * 0.09, '#ffe27a', 'burst');
  artPop(t.x, tkmTop(t) - viewH * 0.04, viewH * 0.07, '#8fe38f', 'ring');
  spawnSparkles(t.x, tkmTop(t) - viewH * 0.04, 14, '#ffe27a');
  spawnSparkles(t.x, tkmTop(t) - viewH * 0.04, 8, '#8fe38f');
  for (i = 0; i < 4; i++) playNote(base * Math.pow(1.26, i), i * 0.08, 0.2, 'triangle', 0.2);
  if (tkm.sayT <= 0) { trekPupSound('yay'); tkm.sayT = 0.9; }
  p.mood = 'wow';
  p.moodT = 0.6;
  p.wave = 1.0;
  if (t.kind === 'bunny') { t.pop = 0; playNote(392, 0.3, 0.2, 'triangle', 0.2); }
  if (t.kind === 'hog') { t.o.st = 'wake'; t.o.st_t = 0; }
}

// Esteiden omat animaatiot ja läpäisy
function tkmUpdateObs(dt) {
  var i, o, t, n, b = tkm.bunny;
  for (i = 0; i < tkm.obs.length; i++) {
    o = tkm.obs[i];
    if (o.kind === 'brook') {
      if (!o.done && o.seed.grown) {
        n = Math.floor(o.seed.gt / 0.22);
        if (n !== o.lastPad && n <= o.pads) { o.lastPad = n; if (n > 0) playNote(659 * Math.pow(1.12, n), 0, 0.1, 'sine', 0.18); }
        if (o.seed.gt > o.pads * 0.22 + 0.35) o.done = true;
      }
    } else if (o.kind === 'mush') {
      n = 0;
      for (t = 0; t < o.n; t++) if (o.m[t].grown && o.m[t].gt > 0.45) n++;
      o.done = n === o.n;
    } else if (o.kind === 'hog') {
      tkmUpdateHog(o, dt);
    } else if (o.kind === 'sun') {
      if (o.t0.grown && o.t0.gt > 0.8) o.done = true;
    } else if (o.kind === 'bean') {
      if (o.t0.grown && o.t0.gt > 1.5) o.done = true;
    }
  }
  // Piilopupu porkkanan naatista
  if (b.grown) {
    b.pop += dt;
    if (b.pop >= 0.9 && !b.found) {
      b.found = true;
      trekBunnyFound(b.x - camX, b.y - viewH * 0.2);
      trekPupSound('wow');
    }
  }
  // Voikukan siemenet leijuvat
  for (i = tkm.fluff.length - 1; i >= 0; i--) {
    t = tkm.fluff[i];
    t.t += dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt + Math.sin(t.t * 3 + t.ph) * viewH * 0.02 * dt;
    t.vx *= 1 - dt * 0.6;
    t.vy = t.vy * (1 - dt * 1.2) - viewH * 0.015 * dt;
    if (t.t > t.life) tkm.fluff.splice(i, 1);
  }
}
// Siili: nukkuu -> herää, aivastaa, kikattaa -> kierii pois
function tkmUpdateHog(o, dt) {
  var t = o.t0, prev = o.st_t;
  if (o.st === 'sleep') {
    o.st_t += dt;
    return;
  }
  o.st_t += dt;
  if (o.st === 'wake') {
    if (prev < 0.75 && o.st_t >= 0.75) {
      // Aivastus
      playNote(523, 0, 0.06, 'triangle', 0.18);
      playNote(392, 0.06, 0.1, 'square', 0.12);
      spawnSparkles(t.x + viewH * 0.05, t.y - viewH * 0.04, 10, '#bfe0ff');
      artPop(t.x + viewH * 0.05, t.y - viewH * 0.04, viewH * 0.04, '#bfe0ff', 'burst');
      artShakeStart(viewH * 0.003, 0.2);
    }
    if (prev < 1.3 && o.st_t >= 1.3) {
      playNote(1047, 0, 0.06, 'triangle', 0.14);
      playNote(1175, 0.07, 0.06, 'triangle', 0.14);
      playNote(1319, 0.14, 0.08, 'triangle', 0.14);
      trekPupSound('giggle');
    }
    if (o.st_t > 1.9) {
      o.st = 'roll';
      o.st_t = 0;
      o.done = true;
      playNote(330, 0, 0.3, 'triangle', 0.12);
      playNote(494, 0.1, 0.3, 'triangle', 0.12);
    }
  } else if (o.st === 'roll') {
    o.dx += tkmU() * (0.25 + o.st_t * 0.8) * dt;
    o.rot += dt * 9;
    if (o.dx > viewW * 1.4) o.st = 'gone';
  }
}

// Yksisarvinen kävelee itsestään ja pysähtyy esteille
function tkmObsStop(o) {
  var i, H = viewH;
  if (o.kind === 'brook') return tkmX(o.seed.xf) - H * 0.1;
  if (o.kind === 'mush') {
    for (i = 0; i < o.n; i++) if (!o.m[i].grown || o.m[i].gt < 0.45) return tkmX(o.xf + (i - 0.5) * o.d) - H * 0.03;
    return 1e9;
  }
  if (o.kind === 'hog') return tkmX(o.xf) - H * 0.13;
  if (o.kind === 'sun') return tkmX(o.xf) - H * 0.09;
  if (o.kind === 'bean') return tkmX(o.xf) - H * 0.1;
  return tkmX(o.xf) - H * 0.11;
}
function tkmStopX() {
  var i, o, s = 1e9;
  if (tkm.phase === 'intro' || tkm.phase === 'meet' || tkm.phase === 'hello') return tkmX(TKM_MEET_X);
  for (i = 0; i < tkm.obs.length; i++) {
    o = tkm.obs[i];
    if (o.kind === 'final' || !o.done || (o.kind === 'bean' && !o.climbed)) s = Math.min(s, tkmObsStop(o));
  }
  return s;
}
// Este, jota yksisarvinen odottaa (vihjekäsi)
function tkmWaiting() {
  var i, o, st;
  for (i = 0; i < tkm.obs.length; i++) {
    o = tkm.obs[i];
    if (o.kind === 'final' ? o.t0.grown : o.done) continue;
    st = tkmObsStop(o);
    if (tkm.ux >= st - viewH * 0.02) {
      if (o.kind === 'brook') return o.seed.grown ? null : o.seed;
      if (o.kind === 'mush') {
        for (st = 0; st < o.n; st++) if (!o.m[st].grown) return o.m[st];
        return null;
      }
      return o.t0.grown ? null : o.t0;
    }
    return null;
  }
  return null;
}
function tkmUpdateUnicorn(dt) {
  var x = tkm.ux, sp, stop, g, o, c, k, step, lk, H = viewH;
  if (tkm.land > 0) tkm.land -= dt;
  tkm.moving = false;
  if (tkm.ust === 'walk') {
    stop = tkmStopX();
    sp = tkmU() * (tkm.phase === 'intro' ? TKM_INTRO_SPEED : TKM_SPEED);
    if (x < stop - 0.5) {
      x = Math.min(stop, x + sp * dt);
      tkm.moving = true;
      tkm.walkPhase += dt * 9 * (tkm.phase === 'intro' ? 1.4 : 1);
    }
    tkm.ux = x;
    // Pavunvarsi: kiipeäminen alkaa varren juurelta
    o = tkmObs('bean');
    if (o && o.done && !o.climbed && x >= tkmObsStop(o) - 1 && !tkm.air) {
      tkm.ust = 'climb';
      tkm.climb = { t: 0, x0: x, y0: tkm.uy, x1: tkmX(o.cf + 0.07), dur: 2.2, n: 4, last: -1, o: o };
      tkm.climb.y1 = tkmPathY(tkm.climb.x1);
      return;
    }
    // Joenranta: loppu alkaa, kun lehti on valmis ja yksisarvinen perillä
    o = tkm.obs[tkm.obs.length - 1];
    if (o.t0.grown && o.t0.gt > 2.5 && x >= tkmObsStop(o) - 1 && !tkm.air && tkm.phase === 'play') {
      tkm.ust = 'end';
      tkm.phase = 'end';
      tkm.endT = 0;
      tkm.end = { x0: x, y0: tkm.uy };
      return;
    }
    // Pystysuunta: hyppy portaalle, pudotus alas
    g = tkmPathY(x);
    if (tkm.air) {
      tkm.uvy += TKM_G * H * dt;
      tkm.uy += tkm.uvy * dt;
      if (tkm.uvy > 0 && tkm.uy >= g) {
        tkm.uy = g;
        tkm.air = false;
        tkm.land = 0.25;
        spawnDust(x, g, 5, 1);
        playNote(220, 0, 0.06, 'triangle', 0.1);
      }
    } else if (g < tkm.uy - H * 0.008) {
      tkm.air = true;
      tkm.uvy = -Math.sqrt(2 * TKM_G * H * (tkm.uy - g + H * 0.035));
      playNote(587, 0, 0.08, 'sine', 0.14);
      playNote(784, 0.06, 0.1, 'sine', 0.14);
    } else if (g > tkm.uy + H * 0.012) {
      tkm.air = true;
      tkm.uvy = 0;
    } else tkm.uy = g;
  } else if (tkm.ust === 'climb') {
    c = tkm.climb;
    c.t += dt;
    k = Math.min(1, c.t / c.dur);
    step = Math.min(c.n - 1, Math.floor(k * c.n));
    lk = k * c.n - step;
    if (step !== c.last) {
      c.last = step;
      playNote(523 * Math.pow(1.19, step), 0, 0.1, 'triangle', 0.18);
      playNote(659 * Math.pow(1.19, step), 0.06, 0.12, 'triangle', 0.16);
      spawnSparkles(tkmX(c.o.xf), c.y0 - (c.y0 - c.y1) * (step + 0.5) / c.n, 4, '#8fe38f');
    }
    tkm.ux = c.x0 + (c.x1 - c.x0) * easeInOutSine(k);
    tkm.uy = c.y0 + (c.y1 - c.y0) * (step + easeOutCubic(lk)) / c.n - Math.sin(lk * Math.PI) * H * 0.04;
    tkm.moving = true;
    tkm.walkPhase += dt * 12;
    if (k >= 1) {
      tkm.ust = 'walk';
      c.o.climbed = true;
      tkm.uy = c.y1;
      tkm.land = 0.25;
      trekPupSound('yay');
      spawnSparkles(tkm.ux, tkm.uy - H * 0.1, 12, '#ffe27a');
    }
  }
}

// Loppu: lehti ja taikakukka, prinsessa poimii kukan, lehti lipuu pois
function tkmLeaf() {
  var o = tkm.obs[tkm.obs.length - 1], x = tkmX(TKM_BANK + 0.2), y = tkmBaseY(tkmX(TKM_BANK)) + viewH * 0.065;
  return { x: x + (tkm.end && tkm.end.dx ? tkm.end.dx : 0), y: y, rx: tkmU() * 0.17, k: o.t0.grown ? easeOutBack(Math.min(1, o.t0.gt / 1.4)) : 0, bloom: o.t0.grown ? easeOutCubic(tkmClamp((o.t0.gt - 1.4) / 1.0, 0, 1)) : 0 };
}
function tkmUpdateEnding(dt) {
  var o = tkm.obs[tkm.obs.length - 1], t = o.t0, e = tkm.end, prev, L, us = trekUS(), i, p = tkm.pup, hx, hy, k;
  if (t.grown) {
    if (t.gt - dt < 1.4 && t.gt >= 1.4) { trekPupSound('wow'); for (i = 0; i < 5; i++) playNote(659 * Math.pow(1.12, i), i * 0.1, 0.25, 'sine', 0.18); }
    if (t.gt - dt < 2.4 && t.gt >= 2.4) {
      L = tkmLeaf();
      artPop(L.x + L.rx * 0.3, L.y - viewH * 0.08, viewH * 0.12, '#ff9fd0', 'burst');
      spawnSparkles(L.x + L.rx * 0.3, L.y - viewH * 0.08, 18, '#ffe27a');
    }
  }
  if (tkm.phase !== 'end') return;
  prev = tkm.endT;
  tkm.endT += dt;
  L = tkmLeaf();
  // Pikkupilvi leijuu prinsessan yllä
  hx = tkm.ux - camX + us * 40;
  hy = tkm.uy - us * 150 + Math.sin(tkm.t * 2.5) * viewH * 0.01;
  k = 1 - Math.exp(-dt * 4);
  p.x += (hx - p.x) * k;
  p.y += (hy - p.y) * k;
  p.raining = false;
  p.water = Math.min(1, p.water + dt * 0.6);
  p.mood = 'happy';
  // Kukka lentää prinsessalle
  if (prev < 0.1 && tkm.endT >= 0.1) { playNote(784, 0, 0.15, 'sine', 0.2); playNote(1047, 0.12, 0.2, 'sine', 0.2); }
  if (prev < 1.3 && tkm.endT >= 1.3) {
    trekPupSound('yay');
    p.wave = 1.5;
    spawnSparkles(tkm.ux + us * 14, tkm.uy - us * 80, 16, '#ff9fd0');
    artPop(tkm.ux + us * 14, tkm.uy - us * 80, viewH * 0.06, '#ffe27a', 'burst');
    if (tkm.allBloom) {
      for (i = 0; i < 6; i++) playNote(784 * Math.pow(1.12, i), 0.2 + i * 0.08, 0.2, 'triangle', 0.18);
      for (i = 0; i < 6; i++) spawnSparkles(L.x + Math.cos(i) * L.rx * 0.6, L.y - viewH * 0.03, 5, TKM_BUD_COLS[i]);
    }
  }
  // Astuu lehdelle
  if (tkm.endT >= 1.6 && tkm.endT < 2.5) {
    k = (tkm.endT - 1.6) / 0.9;
    tkm.ux = e.x0 + (L.x - L.rx * 0.25 - e.x0) * easeInOutSine(k);
    tkm.uy = e.y0 + (L.y - viewH * 0.012 - e.y0) * easeInOutSine(k) - Math.sin(k * Math.PI) * viewH * 0.06;
    tkm.moving = true;
    tkm.walkPhase += dt * 9;
    if (prev < 1.6) { playNote(587, 0, 0.08, 'sine', 0.14); playNote(784, 0.06, 0.1, 'sine', 0.14); }
  }
  if (prev < 2.5 && tkm.endT >= 2.5) { tkm.land = 0.3; tkmRipple(L.x, L.y, L.rx * 1.2); playNote(330, 0, 0.12, 'sine', 0.15); }
  // Lehti lipuu oikealle
  if (tkm.endT >= 2.5) {
    e.v = Math.min(tkmU() * 0.32, (e.v || 0) + tkmU() * 0.18 * dt);
    e.dx = (e.dx || 0) + e.v * dt;
    L = tkmLeaf();
    tkm.ux = L.x - L.rx * 0.25;
    tkm.uy = L.y - viewH * 0.012 + Math.sin(tkm.t * 2.2) * viewH * 0.004;
    if (Math.random() < dt * 6) tkmRipple(L.x - L.rx, L.y + viewH * 0.005, L.rx * 0.3);
  }
  if (tkm.endT > 5.6 && !tkm.done) {
    tkm.done = true;
    trekChapterDone();
  }
}

function tkmUpdateFx(dt) {
  var i, d, f;
  for (i = tkm.drops.length - 1; i >= 0; i--) {
    d = tkm.drops[i];
    d.y += d.vy * dt;
    if (d.y >= d.land) {
      if (d.water) tkmRipple(d.x, d.land, viewH * 0.014);
      else if (Math.random() < 0.35 && particles.length < 100) particles.push({ x: d.x, y: d.land - 2, vx: tkmRnd(-40, 40), vy: -tkmRnd(30, 70), life: 0.3, age: 0, size: 2 + Math.random() * 2, color: 'rgba(130,180,245,0.9)' });
      tkm.drops.splice(i, 1);
    }
  }
  for (i = tkm.ripples.length - 1; i >= 0; i--) {
    tkm.ripples[i].t += dt;
    if (tkm.ripples[i].t > 0.6) tkm.ripples.splice(i, 1);
  }
  for (i = tkm.flyers.length - 1; i >= 0; i--) {
    f = tkm.flyers[i];
    f.t += dt;
    if (f.t >= f.dur) {
      tkm.flyers.splice(i, 1);
      tkm.hudBump = 0.4;
      playNote(1319, 0, 0.08, 'sine', 0.14);
    }
  }
  for (i = 0; i < tkm.srcs.length; i++) if (tkm.srcs[i].wob > 0) tkm.srcs[i].wob -= dt;
}
function tkmRipple(x, y, r) {
  if (tkm.ripples.length > 30) tkm.ripples.shift();
  tkm.ripples.push({ x: x, y: y, r: r, t: 0 });
}

// ---------- Piirto: tausta ----------
function tkmLayers() {
  return [
    { speed: 0.15, render: tkmRenderFar },
    { speed: 0.45, render: tkmRenderMid },
    { speed: 1, render: function () {} }
  ];
}
var TKM_HAZE = '#f6dce4';
function tkmRenderFar(b, w, h) {
  var horizon = h * 0.64, g, i, x, y, s;
  g = b.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#8ec3f0');
  g.addColorStop(0.45, '#d8c8f0');
  g.addColorStop(0.75, '#ffd0d4');
  g.addColorStop(1, '#ffe8c8');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Aamuaurinko nousee matalalta
  drawBgSun(b, viewW * 0.74, h * 0.33, h * 0.075, 0.15, '#ffe2b0', '#fffbea', '#ffbf6a');
  // Ruusuiset aamupilvet
  for (i = 0; i < 10; i++) {
    x = w * (0.04 + i * 0.1) + (i % 2) * h * 0.1;
    y = h * (0.08 + (i % 3) * 0.075);
    s = h * (0.022 + (i % 3) * 0.008);
    b.fillStyle = 'rgba(255,190,205,0.75)';
    cloudShape(b, x, y + s * 0.25, s * 1.04);
    b.fillStyle = 'rgba(255,248,250,0.92)';
    cloudShape(b, x, y, s);
  }
  // Kaukaiset kukkulat aamu-usvassa
  fillHillBand(b, w, h, horizon, artMix('#b8d8a8', TKM_HAZE, 0.55), function (px) {
    return horizon - h * 0.08 - Math.sin(px * 0.0021 + 0.4) * h * 0.05 - Math.sin(px * 0.0067) * h * 0.02;
  });
  fillHillBand(b, w, h, horizon, artMix('#a8d898', TKM_HAZE, 0.38), function (px) {
    return horizon - h * 0.02 - Math.sin(px * 0.0037 + 1.1) * h * 0.035;
  });
  // Kaukaisia puita
  for (i = 0; i < w / (h * 0.16); i++) {
    x = i * h * 0.16 + (i * 37 % 13) * h * 0.006;
    y = horizon - h * 0.02 - Math.sin(x * 0.0037 + 1.1) * h * 0.035;
    if (i % 3 === 1) drawTree(b, x, y + h * 0.01, h * 0.06, 0.6, { haze: TKM_HAZE });
  }
}
function tkmRenderMid(b, w, h) {
  var i, x, y, base = h * 0.7, ridge, g;
  ridge = function (px) { return base - h * 0.035 - Math.sin(px * 0.0042 + 0.6) * h * 0.035 - Math.abs(Math.sin(px * 0.0091)) * h * 0.02; };
  fillHillBand(b, w, h, base, artMix('#98d47e', TKM_HAZE, 0.22), ridge);
  for (i = 0; i < w / (h * 0.12); i++) {
    x = i * h * 0.12 + (i * 53 % 17) * h * 0.004;
    y = ridge(x);
    if (i % 4 === 0) drawTree(b, x, y + h * 0.02, h * (0.12 + (i % 3) * 0.02), 0.3, { haze: TKM_HAZE });
    else if (i % 4 === 2) {
      artCircle(b, x, y + h * 0.012, h * 0.03, artMix('#7cc466', TKM_HAZE, 0.3), { line: false, hi: 0.15 });
      artCircle(b, x + h * 0.03, y + h * 0.018, h * 0.022, artMix('#86cc6e', TKM_HAZE, 0.3), { line: false });
    }
  }
  // Kukkaläikkiä rinteessä
  for (i = 0; i < w / (h * 0.05); i++) {
    x = i * h * 0.05 + (i * 29 % 7) * h * 0.005;
    y = ridge(x) + h * (0.02 + (i * 7 % 5) * 0.008);
    b.fillStyle = artRGBA(['#ffb0d0', '#fff0a0', '#e0c8ff', '#ffffff'][i % 4], 0.75);
    b.beginPath(); b.arc(x, y, h * 0.0045, 0, Math.PI * 2); b.fill();
  }
  // Aamu-usva kukkuloiden juurella
  g = b.createLinearGradient(0, base - h * 0.03, 0, base + h * 0.05);
  g.addColorStop(0, 'rgba(255,240,245,0)');
  g.addColorStop(0.5, 'rgba(255,240,245,0.45)');
  g.addColorStop(1, 'rgba(255,240,245,0)');
  b.fillStyle = g;
  b.fillRect(0, base - h * 0.03, w, h * 0.08);
}
// Lähin kerros maailmakoordinaateissa välillä x0..x1 (palan piirto). Silmukat
// kulkevat yhteisessä ruudukossa, jotta vierekkäiset palat sopivat yhteen.
function tkmRenderNear(b, x0, x1, h) {
  var x, y, i, g, o, m = h * 0.35, step = 6, bank = tkmX(TKM_BANK), br = tkm.obs[0], gx0 = tkmX(br.xf), gx1 = tkmX(br.xf + br.wf), U = tkmU();
  var xa = Math.floor((x0 - m) / step) * step, xb = x1 + m, ia, ib, d;
  // Niitty polun takana (nousee tasanteilla)
  b.beginPath();
  b.moveTo(xa, h);
  for (x = xa; x <= xb; x += step) b.lineTo(x, tkmBackY(x));
  b.lineTo(xb, h);
  b.closePath();
  g = b.createLinearGradient(0, h * 0.62, 0, h);
  g.addColorStop(0, '#a6e08a');
  g.addColorStop(1, '#6cbf5a');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#5aa04a';
  b.lineWidth = Math.max(1.2, h * 0.003);
  b.beginPath();
  for (x = xa; x <= xb; x += step) { if (x === xa) b.moveTo(x, tkmBackY(x)); else b.lineTo(x, tkmBackY(x)); }
  b.stroke();
  // Puut polun takana (ensimmäisessä mehiläispesä)
  for (i = 0; i < TKM_TREES.length; i++) {
    x = tkmX(TKM_TREES[i]);
    if (x < x0 - h * 0.3 || x > x1 + h * 0.3) continue;
    drawTree(b, x, tkmPathY0(x) - h * 0.045, h * (i === 0 ? 0.28 : 0.2 + (i % 2) * 0.05));
  }
  // Kalliot tasanteiden reunassa
  for (i = 0; i < tkm.obs.length; i++) {
    o = tkm.obs[i];
    if (o.wallF === undefined) continue;
    x = tkmX(o.wallF);
    if (x < x0 - m || x > x1 + m) continue;
    tkmRock(b, x, tkmBaseY(x) + h * 0.02, tkmPathY0(x + 2) - h * 0.03, h);
  }
  // Polku (puron kohdalta poikki, päättyy joen rantaan)
  if (gx0 > xa) tkmPathBand(b, Math.max(xa, 0), Math.min(xb, gx0 + h * 0.01), h);
  if (gx1 < xb && bank > xa) tkmPathBand(b, Math.max(xa, Math.floor((gx1 - h * 0.01) / step) * step), Math.min(xb, bank + h * 0.02), h);
  // Polun pikkukivet
  d = h * 0.055;
  ia = Math.max(0, Math.floor(xa / d)); ib = Math.ceil(xb / d);
  for (i = ia; i <= ib; i++) {
    x = i * d + ((i * 37) % 11) * h * 0.003;
    if ((x > gx0 - h * 0.02 && x < gx1 + h * 0.02) || x > bank) continue;
    y = tkmPathY0(x) + h * (0.004 + ((i * 13) % 5) * 0.007);
    artBlob(b, x, y, h * 0.008, h * 0.005, '#e2c49a', { line: false });
  }
  // Kukat ja tupsut takarinteessä, kastepisarat kimaltavat
  d = h * 0.045;
  ia = Math.max(0, Math.floor(xa / d)); ib = Math.ceil(xb / d);
  for (i = ia; i <= ib; i++) {
    x = i * d + ((i * 53) % 17) * h * 0.003;
    if (x > bank) break;
    if (x > gx0 - h * 0.03 && x < gx1 + h * 0.03) continue;
    y = tkmPathY0(x) - h * (0.04 + ((i * 7) % 4) * 0.006);
    if (i % 3 === 0) drawFlower(b, x, y, h * 0.0065, ['#ff9fc8', '#ffe066', '#c9a0ff', '#ffffff'][(i >> 1) % 4]);
    else tkmTuft(b, x, y + h * 0.008, h * 0.028, '#5fb04e');
    if (i % 5 === 2) { b.fillStyle = 'rgba(255,255,255,0.85)'; b.beginPath(); b.arc(x + h * 0.01, y - h * 0.004, h * 0.0028, 0, Math.PI * 2); b.fill(); }
  }
  // Etuala: tasainen niittykaistale (tasanteiden edessä)
  b.beginPath();
  b.moveTo(xa, h);
  for (x = xa; x <= xb; x += step) b.lineTo(x, tkmFrontY(x));
  b.lineTo(xb, h);
  b.closePath();
  g = b.createLinearGradient(0, h * 0.84, 0, h);
  g.addColorStop(0, '#94d878');
  g.addColorStop(1, '#5aae4c');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#5aa04a';
  b.lineWidth = Math.max(1.2, h * 0.003);
  b.beginPath();
  for (x = xa; x <= xb; x += step) { if (x === xa) b.moveTo(x, tkmFrontY(x)); else b.lineTo(x, tkmFrontY(x)); }
  b.stroke();
  d = h * 0.06;
  ia = Math.max(0, Math.floor(xa / d)); ib = Math.ceil(xb / d);
  for (i = ia; i <= ib; i++) {
    x = i * d + ((i * 31) % 13) * h * 0.004;
    y = tkmBaseY(x) + h * (0.1 + ((i * 11) % 6) * 0.017);
    if (i % 4 === 0) drawFlower(b, x, y, h * 0.008, ['#ffffff', '#ffb0d0', '#ffe066'][(i >> 2) % 3]);
    else tkmTuft(b, x, y, h * 0.035, '#4e9c42');
  }
  // Puro: tulee kukkuloilta, kulkee polun ali ja virtaa kohti katsojaa
  if (gx1 + U * 0.15 > xa && gx0 - U * 0.15 < xb) tkmBrook(b, gx0, gx1, h);
  // Joki: lehti lipuu tänne lopussa
  if (xb > bank - U * 0.15) tkmRiver(b, bank, tkmX(TKM_LEN) + h, h);
}
function tkmBackY(x) { return tkmPathY0(x) - viewH * 0.06 - Math.sin(x * 0.011) * viewH * 0.006; }
function tkmFrontY(x) { return tkmBaseY(x) + viewH * 0.07 + Math.sin(x * 0.02) * viewH * 0.004; }
// Puron uoma: mutkitteleva vesi takarinteestä ruudun alareunaan
function tkmBrookEdge(gx0, gx1, h, k, side) {
  var w = gx1 - gx0, xc = (gx0 + gx1) / 2 + Math.sin(k * 4.2 + 0.5) * w * 0.12, hw = w * (0.32 + 0.18 * k) + tkmU() * 0.05 * k * k;
  return xc + side * hw;
}
function tkmBrook(b, gx0, gx1, h) {
  var pts = [], i, n = 18, k, yTop = tkmBackY(gx0) + h * 0.01;
  for (i = 0; i <= n; i++) { k = i / n; pts.push([tkmBrookEdge(gx0, gx1, h, k, -1), yTop + (h * 1.01 - yTop) * k]); }
  for (i = n; i >= 0; i--) { k = i / n; pts.push([tkmBrookEdge(gx0, gx1, h, k, 1), yTop + (h * 1.01 - yTop) * k]); }
  tkmWaterBody(b, pts, h);
  for (i = 0; i < 4; i++) {
    k = 0.55 + i * 0.12;
    artBlob(b, tkmBrookEdge(gx0, gx1, h, k, i % 2 ? 0.5 : -0.5), yTop + (h - yTop) * k, h * 0.018, h * 0.009, '#b8b0c8', { lineColor: '#7a7090', hi: 0.3 });
  }
  tkmReed(b, tkmBrookEdge(gx0, gx1, h, 0.7, -1) - h * 0.02, yTop + (h - yTop) * 0.72, h * 0.07);
  tkmReed(b, tkmBrookEdge(gx0, gx1, h, 0.85, 1) + h * 0.02, yTop + (h - yTop) * 0.86, h * 0.06);
}
function tkmRiver(b, x0, w, h) {
  var y = tkmBaseY(x0), i, x, U = tkmU(), step = 6;
  tkmWaterBody(b, [[x0 - h * 0.01, y - h * 0.012], [x0 + U * 0.08, h * 0.665], [w + 4, h * 0.665], [w + 4, h * 1.01], [x0 - U * 0.12, h * 1.01]], h);
  // Vastaranta ja kaislat
  b.beginPath();
  b.moveTo(x0 + U * 0.06, h * 0.67);
  for (x = x0 + U * 0.06; x <= w + 8; x += step) b.lineTo(x, h * 0.655 - Math.sin(x * 0.03) * h * 0.004);
  b.lineTo(w + 8, h * 0.6);
  b.lineTo(x0 + U * 0.08, h * 0.62);
  b.closePath();
  b.fillStyle = '#8cd070';
  b.fill();
  for (i = 0; i < 14; i++) {
    x = x0 + U * 0.1 + i * (w - x0) / 14;
    tkmReed(b, x, h * 0.665, h * (0.05 + (i % 3) * 0.012));
  }
  // Rantakivet ja kaislat lähirannalla
  for (i = 0; i < 3; i++) artBlob(b, x0 - h * 0.03 - i * h * 0.04, y + h * (0.03 + i * 0.03), h * 0.022, h * 0.012, '#c8c0d8', { lineColor: '#7a7090', hi: 0.3 });
  tkmReed(b, x0 - h * 0.11, y + h * 0.1, h * 0.08);
  tkmReed(b, x0 - h * 0.14, y + h * 0.13, h * 0.06);
}

// Lähimmän kerroksen palat: ruudun puolikkaan levyisiä, esirenderöidään
// tarpeen mukaan ja muistissa pidetään muutama (vanha tabletti: ei koko niittyä kerralla)
var tkmChunks = [];
var tkmChunkKey = '';
var tkmChunkUse = 0;
function tkmChunkW() { return Math.max(64, Math.round(viewW * 0.5)); }
function tkmChunkGet(k) {
  var i, key = viewW + 'x' + viewH + ':' + tkm.seed;
  if (key !== tkmChunkKey) { tkmChunkKey = key; for (i = 0; i < tkmChunks.length; i++) tkmChunks[i].k = -1; }
  for (i = 0; i < tkmChunks.length; i++) if (tkmChunks[i].k === k) { tkmChunks[i].used = ++tkmChunkUse; return tkmChunks[i].cv; }
  return null;
}
function tkmChunkRender(k) {
  var i, ch = null, CW = tkmChunkW(), b;
  if (tkmChunks.length < 6) { ch = { k: -1, used: -1, cv: document.createElement('canvas') }; tkmChunks.push(ch); }
  else {
    // Vapaa paikka tai pisimpään käyttämättä ollut pala
    for (i = 0; i < tkmChunks.length; i++) if (!ch || (tkmChunks[i].k < 0 ? -1 : tkmChunks[i].used) < (ch.k < 0 ? -1 : ch.used)) ch = tkmChunks[i];
  }
  ch.k = k;
  ch.used = ++tkmChunkUse;
  ch.cv.width = CW;
  ch.cv.height = Math.round(viewH);
  b = ch.cv.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, CW, ch.cv.height);
  b.save();
  b.beginPath(); b.rect(0, 0, CW, viewH); b.clip();
  b.translate(-k * CW, 0);
  tkmRenderNear(b, k * CW, (k + 1) * CW, viewH);
  b.restore();
  return ch.cv;
}
function tkmDrawNear(c) {
  var CW = tkmChunkW(), k0 = Math.floor(camX / CW), k1 = Math.floor((camX + viewW) / CW), k, cv, made = 0, last = Math.ceil(tkmX(TKM_LEN) / CW);
  for (k = Math.max(0, k0); k <= k1; k++) {
    cv = tkmChunkGet(k);
    if (!cv) { cv = tkmChunkRender(k); made++; }
    c.drawImage(cv, 0, 0, cv.width, cv.height, Math.round(k * CW - camX), 0, CW, viewH);
  }
  // Seuraava pala valmiiksi, kun tällä ruudulla ei piirretty uutta
  if (!made && k1 + 1 <= last && !tkmChunkGet(k1 + 1)) tkmChunkRender(k1 + 1);
}
function tkmPathBand(b, x0, x1, h) {
  var x, step = 6;
  b.beginPath();
  for (x = x0; x <= x1; x += step) { if (x === x0) b.moveTo(x, tkmPathY0(x) - h * 0.022); else b.lineTo(x, tkmPathY0(x) - h * 0.022); }
  for (x = x1; x >= x0; x -= step) b.lineTo(x, tkmPathY0(x) + h * 0.042);
  b.closePath();
  artFillPath(b, '#f4dcb8', h * 0.7, h * 0.85, h * 0.04, { lineColor: '#c09a70', line: Math.max(1.2, h * 0.003) });
  // Nurmireunus polun takana
  b.strokeStyle = '#7cc864';
  b.lineWidth = h * 0.009;
  b.lineCap = 'round';
  b.beginPath();
  for (x = x0; x <= x1; x += step) { if (x === x0) b.moveTo(x, tkmPathY0(x) - h * 0.025); else b.lineTo(x, tkmPathY0(x) - h * 0.025); }
  b.stroke();
}
// Kallioseinä tasanteen reunassa: pyöreitä kiviä päällekkäin
function tkmRock(b, x, yb, yt, h) {
  var n = Math.max(2, Math.round((yb - yt) / (h * 0.045))), i, y, s;
  for (i = 0; i < n; i++) {
    y = yb - (i + 0.5) * (yb - yt) / n;
    s = h * (0.03 + (i % 2) * 0.006);
    artBlob(b, x + (i % 2 ? -1 : 1) * h * 0.008, y, s * 1.2, (yb - yt) / n * 0.6, ['#c8b8a0', '#b8a890'][i % 2], { lineColor: '#7a6a50', hi: 0.25 });
  }
  tkmTuft(b, x - h * 0.01, yt + h * 0.012, h * 0.03, '#5fb04e');
}
function tkmWaterBody(b, pts, h) {
  var i, g, cx = 0;
  for (i = 0; i < pts.length; i++) cx += pts[i][0] / pts.length;
  b.beginPath();
  for (i = 0; i < pts.length; i++) { if (i) b.lineTo(pts[i][0], pts[i][1]); else b.moveTo(pts[i][0], pts[i][1]); }
  b.closePath();
  g = b.createLinearGradient(0, pts[0][1], 0, h);
  g.addColorStop(0, '#9edcff');
  g.addColorStop(1, '#4aa6e0');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#8a6a48';
  b.lineWidth = Math.max(2, h * 0.008);
  b.lineJoin = 'round';
  b.stroke();
  b.strokeStyle = 'rgba(255,255,255,0.5)';
  b.lineWidth = Math.max(1, h * 0.004);
  b.lineCap = 'round';
  for (i = 0; i < 6; i++) {
    var y = pts[0][1] + (h - pts[0][1]) * (0.15 + i * 0.14), x = cx + (i % 2 ? 1 : -1) * h * 0.02;
    b.beginPath(); b.moveTo(x - h * 0.02, y); b.lineTo(x + h * 0.02, y); b.stroke();
  }
}
function tkmTuft(b, x, y, s, col) {
  var i;
  b.strokeStyle = col;
  b.lineWidth = Math.max(1.2, s * 0.09);
  b.lineCap = 'round';
  b.beginPath();
  for (i = -2; i <= 2; i++) { b.moveTo(x + i * s * 0.08, y); b.quadraticCurveTo(x + i * s * 0.14, y - s * 0.4, x + i * s * 0.22, y - s * (0.75 - Math.abs(i) * 0.12)); }
  b.stroke();
}
function tkmReed(b, x, y, s) {
  b.strokeStyle = '#5a9a48';
  b.lineWidth = Math.max(1.5, s * 0.06);
  b.lineCap = 'round';
  b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + s * 0.05, y - s * 0.5, x, y - s); b.stroke();
  b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x - s * 0.25, y - s * 0.4, x - s * 0.35, y - s * 0.7); b.stroke();
  artBlob(b, x, y - s * 1.05, s * 0.07, s * 0.18, '#9a6a3a', { lineColor: '#5a3a1e' });
}

// ---------- Piirto ----------
function tkmDraw() {
  var c = ctx, i, us = trekUS(), x, y, q, o;
  var cam = camX, ratio = Math.max(0, worldW - viewW) / Math.max(1, tkmX(TKM_LEN) - viewW), ok;
  // Kaukaiset kerrokset ovat maailman levyisiä: niille skaalattu kamera
  camX = cam * ratio;
  ok = beginPlayWorld();
  camX = cam;
  if (!ok) return;
  if (bgSun) bgSun.speed = 0.15 * ratio;
  if (!tkm.built) { endPlayWorld(); return; }
  tkmDrawNear(c);
  // Taka-ala: puroon kasvavat lehdet, sienet, pavunvarsi, auringonkukka, mehiläispesä
  propsDraw(c, 0);
  for (i = 0; i < tkm.srcs.length; i++) tkmDrawSrcBack(c, tkm.srcs[i]);
  for (i = 0; i < tkm.obs.length; i++) tkmDrawObs(c, tkm.obs[i]);
  if (tkm.bunny.ref === 'path') tkmDrawBunnySpot(c, tkm.bunny);
  tkmDrawRipples(c, false);
  // Yksisarvinen ja prinsessa
  x = tkm.ux - camX; y = tkm.uy;
  q = tkm.land > 0 ? Math.sin(tkm.land / 0.25 * Math.PI) * 0.08 : (tkm.air ? -0.05 : 0);
  c.save();
  c.translate(x, y);
  artSquash(c, -q);
  drawUnicorn(c, 0, 0, us, 1, tkm.walkPhase, tkm.moving, globalT);
  c.restore();
  if (tkm.phase === 'end') tkmDrawPick(c);
  // Etuala: vedet, nuput, tökättävät, piilopupu
  for (i = 0; i < tkm.srcs.length; i++) tkmDrawSrcFront(c, tkm.srcs[i]);
  for (i = 0; i < tkm.buds.length; i++) tkmDrawBud(c, tkm.buds[i]);
  if (tkm.bunny.ref === 'base') tkmDrawBunnySpot(c, tkm.bunny);
  propsDraw(c, 1);
  tkmDrawFluff(c);
  tkmDrawRipples(c, true);
  tkmDrawDrops(c);
  tkmDrawPup(c);
  drawParticlesLayer(c);
  tkmDrawHint(c);
  endPlayWorld();
  tkmDrawHud(c);
}

// Kasvun edistyminen: vesirengas kohteen ympärillä
function tkmDrawFill(c, t, x, y, r) {
  if (t.grown || t.fill <= 0) return;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(2, r * 0.22);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#5ab8f0';
  c.lineWidth = Math.max(2, r * 0.16);
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.fill); c.stroke();
}
// Odottava siemen hehkuu ja kimaltaa, jotta lapsi huomaa sen
function tkmSeedGlow(c, x, y, r, t) {
  if (!t.awake) return;
  var k = 0.5 + 0.5 * Math.sin(globalT * 4 + t.xf * 9);
  artGlow(c, x, y, r * (2.2 + k * 0.5), '#fff2a0', 0.45 + k * 0.2);
  if ((globalT * 2 + t.xf * 3) % 1.6 < 0.08 && Math.random() < 0.5) spawnSparkles(x + camX, y - r, 1, '#fff2a0');
}
// Uinuva siemen: pieni multakumpu polulla
function tkmDrawMound(c, x, y, s) {
  c.beginPath();
  c.moveTo(x - s * 0.9, y + s * 0.1);
  c.quadraticCurveTo(x, y - s * 0.55, x + s * 0.9, y + s * 0.1);
  c.closePath();
  artFillPath(c, '#c8a07a', y - s * 0.35, y + s * 0.1, s * 0.5, { lineColor: '#8a6a48', line: Math.max(1, s * 0.06) });
}
// Maasta pomppaava siemen (venytys)
function tkmPopScale(c, t) {
  var k;
  if (t.awT === undefined || t.awT > 0.5) return;
  k = easeOutBack(Math.min(1, t.awT / 0.4));
  c.scale(0.4 + 0.6 * k, 0.2 + 0.8 * k);
}
// Siemen ja sen verso, joka kasvaa sateessa
function tkmDrawSeed(c, x, y, s, t, col, line) {
  var wob = t.wob > 0 ? Math.sin(globalT * 40) * 0.08 : 0, k = t.grown ? 1 : t.fill;
  if (!t.awake) { tkmDrawMound(c, x, y, s); return; }
  artShadow(c, x, y + s * 0.15, s * 1.1, s * 0.25, 0.18);
  c.save();
  c.translate(x, y);
  c.rotate(wob);
  tkmPopScale(c, t);
  // Verso
  if (k > 0.02) {
    artLimb(c, 0, -s * 0.3, 0, -s * (0.3 + k * 0.9), s * 0.14, '#6cc45c', '#2f7a2c');
    artBlob(c, -s * 0.28 * k, -s * (0.3 + k * 0.9), s * 0.35 * k, s * 0.14 * k, '#7fd46a', { rot: -0.5, lineColor: '#2f7a2c' });
    artBlob(c, s * 0.28 * k, -s * (0.32 + k * 0.85), s * 0.32 * k, s * 0.13 * k, '#7fd46a', { rot: 0.5, lineColor: '#2f7a2c' });
  }
  artBlob(c, 0, -s * 0.15, s * 0.6, s * 0.4, col, { lineColor: line, hi: 0.4 });
  c.restore();
}
function tkmDrawObs(c, o) {
  var H = viewH, x, y, i, t, k, s;
  if (o.kind === 'brook') {
    t = o.seed;
    x = t.x - camX; y = t.y;
    if (x < -H * 0.5 || x > viewW + tkmU() * 0.4) return;
    // Lumpeenlehdet ilmestyvät yksi kerrallaan purolle
    if (t.grown) {
      for (i = 0; i < o.pads; i++) {
        k = easeOutBack(tkmClamp((t.gt - i * 0.22) / 0.35, 0, 1));
        if (k <= 0) continue;
        tkmDrawPad(c, tkmX(o.xf) + (i + 0.5) * tkmX(o.wf) / o.pads - camX, tkmBaseY(tkmX(o.xf)) + H * 0.04 + Math.sin(globalT * 2 + i) * H * 0.003, tkmX(o.wf) / o.pads * 0.78 * k, i);
      }
    }
    if (!t.grown) tkmSeedGlow(c, x, y - H * 0.02, H * 0.03, t);
    tkmDrawSeed(c, x, y, H * 0.032, t, '#c8945a', '#6a4a2a');
    if (t.grown) tkmDrawSprout(c, x, y, H, t.gt);
    tkmDrawFill(c, t, x, y - H * 0.02, H * 0.045);
  } else if (o.kind === 'mush') {
    for (i = 0; i < o.n; i++) {
      t = o.m[i];
      x = t.x - camX; y = t.y;
      if (x < -H * 0.3 || x > viewW + H * 0.3) continue;
      if (t.grown) {
        k = easeOutBack(Math.min(1, t.gt / 0.45));
        tkmDrawMushroom(c, x, y, tkmX(o.d) * 0.56, o.h[i] * H * k, o.cols[i], t.gt);
      } else if (!t.awake) {
        tkmDrawMound(c, x, y, H * 0.026);
      } else {
        tkmSeedGlow(c, x, y - H * 0.015, H * 0.026, t);
        tkmDrawMushroom(c, x, y, H * (0.016 + t.fill * 0.012), H * (0.018 + t.fill * 0.01), o.cols[i], 9);
        tkmDrawFill(c, t, x, y - H * 0.02, H * 0.04);
      }
    }
  } else if (o.kind === 'hog') {
    tkmDrawHog(c, o);
  } else if (o.kind === 'sun') {
    tkmDrawSunflower(c, o);
  } else if (o.kind === 'bean') {
    tkmDrawBean(c, o);
  } else if (o.kind === 'final') {
    tkmDrawFinal(c, o);
  }
}
// Kasvanut verso puron rannalla (pieni lehti heiluu)
function tkmDrawSprout(c, x, y, H, gt) {
  var k = easeOutBack(Math.min(1, gt / 0.4)), sw = Math.sin(globalT * 2) * 0.1;
  artLimb(c, x, y - H * 0.02, x + sw * H * 0.03, y - H * 0.02 - H * 0.045 * k, H * 0.006, '#6cc45c', '#2f7a2c');
  artBlob(c, x + H * 0.022 * k + sw * H * 0.03, y - H * 0.06 * k, H * 0.024 * k, H * 0.011 * k, '#7fd46a', { rot: 0.4, lineColor: '#2f7a2c' });
}
function tkmDrawPad(c, x, y, rx, i) {
  c.beginPath();
  c.ellipse(x, y, rx, rx * 0.3, 0, 0.25, Math.PI * 2 - 0.05);
  c.lineTo(x, y);
  c.closePath();
  artFillPath(c, '#6cc45c', y - rx * 0.3, y + rx * 0.3, rx * 0.4, { lineColor: '#2f7a2c', hi: 0 });
  artHighlight(c, x - rx * 0.4, y - rx * 0.1, rx * 0.25, rx * 0.06, 0.4);
  if (i % 2 === 0) drawFlower(c, x - rx * 0.35, y - rx * 0.08, rx * 0.09, '#ff9fc8');
}
function tkmDrawMushroom(c, x, y, cw, h, col, gt) {
  var sw = gt < 0.6 ? Math.sin(gt * 20) * Math.exp(-gt * 5) * 0.12 : 0, ct = Math.min(h * 0.4, cw * 0.55);
  artShadow(c, x, y + 2, cw * 0.9, cw * 0.2, 0.18);
  c.save();
  c.translate(x, y);
  artSquash(c, sw);
  // Jalka
  artRoundRect(c, -cw * 0.28, -h + ct * 0.4, cw * 0.56, h - ct * 0.4, cw * 0.18, '#fff4e0', { lineColor: '#b89a74' });
  // Lakki: tasainen yläpinta (yksisarvinen seisoo sen päällä)
  c.beginPath();
  c.moveTo(-cw, -h + ct);
  c.quadraticCurveTo(-cw, -h, -cw * 0.6, -h);
  c.lineTo(cw * 0.6, -h);
  c.quadraticCurveTo(cw, -h, cw, -h + ct);
  c.quadraticCurveTo(0, -h + ct * 1.35, -cw, -h + ct);
  c.closePath();
  artFillPath(c, col, -h, -h + ct, cw * 0.5, {});
  artCircle(c, -cw * 0.5, -h + ct * 0.45, ct * 0.18, '#ffffff', { line: false });
  artCircle(c, cw * 0.15, -h + ct * 0.35, ct * 0.22, '#ffffff', { line: false });
  artCircle(c, cw * 0.65, -h + ct * 0.55, ct * 0.15, '#ffffff', { line: false });
  if (h > viewH * 0.03) {
    artEye(c, -cw * 0.12, -h * 0.45, cw * 0.07, 0, (globalT + x * 0.01) % 3.5 < 0.12);
    artEye(c, cw * 0.12, -h * 0.45, cw * 0.07, 0, (globalT + x * 0.01) % 3.5 < 0.12);
    artBlush(c, -cw * 0.2, -h * 0.36, cw * 0.05);
    artBlush(c, cw * 0.2, -h * 0.36, cw * 0.05);
  }
  c.restore();
}
function tkmDrawHog(c, o) {
  var t = o.t0, x = t.x - camX + o.dx, y = t.y, H = viewH, s = H * 0.045, k, i, a, sp, open, wet;
  if (o.st === 'gone' || x < -H * 0.3 || x > viewW + H * 0.3) return;
  open = o.st === 'wake' ? easeOutBack(Math.min(1, o.st_t / 0.5)) : (o.st === 'roll' ? 0 : 0);
  artShadow(c, x, y + 2, s * 1.4, s * 0.3, 0.18);
  if (!t.grown) tkmSeedGlow(c, x, y - s, s * 0.9, t);
  c.save();
  c.translate(x, y - s * 0.95);
  if (o.st === 'roll') c.rotate(o.rot);
  if (o.st === 'sleep') artSquash(c, Math.sin(globalT * 2) * 0.03 - 0.05);
  // Piikit
  sp = o.col;
  for (i = 0; i < 14; i++) {
    a = -Math.PI * (0.05 + i / 13 * 1.1) - (o.st === 'roll' ? 0 : 0.0);
    if (o.st === 'roll') a = i / 14 * Math.PI * 2;
    c.beginPath();
    c.moveTo(Math.cos(a - 0.22) * s * 0.8, Math.sin(a - 0.22) * s * 0.8);
    c.lineTo(Math.cos(a) * s * 1.35, Math.sin(a) * s * 1.35);
    c.lineTo(Math.cos(a + 0.22) * s * 0.8, Math.sin(a + 0.22) * s * 0.8);
    c.closePath();
    artFillPath(c, artShade(sp, -0.15), -s * 1.35, 0, s * 0.3, { lineColor: '#5a3a1e', line: Math.max(1, s * 0.05) });
  }
  artCircle(c, 0, 0, s, sp, { lineColor: '#5a3a1e', hi: 0.25 });
  if (o.st !== 'roll') {
    // Kasvot: nukkuu rullalla, herätessä kurkistaa
    c.save();
    c.translate(s * (0.55 + open * 0.25), s * 0.25 - open * s * 0.15);
    artBlob(c, 0, 0, s * 0.5, s * 0.42, '#f4d8b0', { lineColor: '#8a6040' });
    artCircle(c, s * 0.48, s * 0.02, s * 0.1, '#3a2a20', { line: false });
    if (o.st === 'sleep') {
      c.strokeStyle = '#3a2a20'; c.lineWidth = Math.max(1, s * 0.06); c.lineCap = 'round';
      c.beginPath(); c.arc(s * 0.08, -s * 0.08, s * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    } else {
      artEye(c, s * 0.08, -s * 0.1, s * 0.11, 0.5, false);
      if (o.st_t > 1.2) { c.strokeStyle = '#3a2a20'; c.lineWidth = Math.max(1, s * 0.05); c.beginPath(); c.arc(s * 0.2, s * 0.12, s * 0.12, 0.2, Math.PI - 0.2); c.stroke(); }
    }
    artBlush(c, s * 0.12, s * 0.15, s * 0.09);
    c.restore();
  } else {
    artEye(c, 0, 0, s * 0.12, 0, false);
  }
  c.restore();
  // Unikuplat
  if (o.st === 'sleep') {
    for (i = 0; i < 3; i++) {
      k = (globalT * 0.5 + i / 3) % 1;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      artCircle(c, x + s * (0.9 + k * 0.7), y - s * (1.6 + k * 1.6), s * (0.12 + k * 0.18), '#e8f4ff', { lineColor: '#9ab8d8', line: Math.max(1, s * 0.03) });
    }
    c.globalAlpha = 1;
  }
  wet = !t.grown && t.fill > 0;
  if (wet) tkmDrawFill(c, t, x, y - s * 0.95, s * 1.7);
}
function tkmDrawSunflower(c, o) {
  var t = o.t0, bx = tkmX(o.xf) - camX, by = t.y - viewH * 0.03, H = viewH, L = H * 0.34, hr = H * 0.065, a, k, i, hx, hy, ang, sm;
  if (bx < -L * 1.5 || bx > viewW + L * 0.3) return;
  a = Math.acos(Math.min(0.98, (hr + H * 0.01) / L));
  k = t.grown ? easeOutBack(Math.min(1, t.gt / 1.1)) : 0;
  ang = a * (1 - k) - (t.grown ? 0 : Math.sin(globalT * 1.5) * 0.015 - t.wob * 0.05);
  if (!t.grown) tkmSeedGlow(c, t.x - camX, t.y - H * 0.05, H * 0.07, t);
  c.save();
  c.translate(bx, by);
  c.rotate(ang);
  // Varsi ja lehdet
  artLimb(c, 0, 0, 0, -L, H * 0.016, '#6cc45c', '#2f7a2c');
  for (i = 0; i < 2; i++) artBlob(c, (i ? 1 : -1) * H * 0.035, -L * (0.35 + i * 0.22), H * 0.04, H * 0.016, '#7fd46a', { rot: (i ? -0.5 : 0.5) + (t.grown ? Math.sin(globalT * 3 + i) * 0.15 : 0), lineColor: '#2f7a2c' });
  // Kukka: terälehdet ja kasvot
  hx = 0; hy = -L;
  for (i = 0; i < 14; i++) {
    sm = i / 14 * Math.PI * 2;
    artBlob(c, hx + Math.cos(sm) * hr * 0.95, hy + Math.sin(sm) * hr * 0.95, hr * 0.42, hr * 0.17, t.grown ? '#ffd84a' : '#e8c060', { rot: sm, lineColor: '#c88a10', line: Math.max(1, hr * 0.04) });
  }
  artCircle(c, hx, hy, hr * 0.68, '#8a5a2a', { lineColor: '#5a3a1e', hi: 0.2 });
  c.save();
  c.translate(hx, hy);
  c.rotate(-ang);
  if (t.grown) {
    artEye(c, -hr * 0.22, -hr * 0.1, hr * 0.13, 0, (globalT % 3.1) < 0.12);
    artEye(c, hr * 0.22, -hr * 0.1, hr * 0.13, 0, (globalT % 3.1) < 0.12);
    c.strokeStyle = '#3a2010'; c.lineWidth = Math.max(1.5, hr * 0.07); c.lineCap = 'round';
    c.beginPath(); c.arc(0, hr * 0.1, hr * 0.25, 0.2, Math.PI - 0.2); c.stroke();
    artBlush(c, -hr * 0.4, hr * 0.15, hr * 0.12);
    artBlush(c, hr * 0.4, hr * 0.15, hr * 0.12);
  } else {
    c.strokeStyle = '#3a2010'; c.lineWidth = Math.max(1.5, hr * 0.06); c.lineCap = 'round';
    c.beginPath(); c.arc(-hr * 0.22, -hr * 0.12, hr * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.beginPath(); c.arc(hr * 0.22, -hr * 0.12, hr * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.beginPath(); c.arc(0, hr * 0.32, hr * 0.15, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
  }
  c.restore();
  c.restore();
  if (!t.grown) tkmDrawFill(c, t, bx + Math.sin(ang) * L, by - Math.cos(ang) * L, hr * 1.25);
}
function tkmDrawBean(c, o) {
  var t = o.t0, x = t.x - camX, y = t.y, H = viewH, k, top, i, n = 4, ly, sx, a, len;
  if (x < -H * 0.5 || x > viewW + H * 0.5) return;
  if (t.grown) {
    k = easeOutCubic(Math.min(1, t.gt / 1.4));
    top = (o.H + 0.13) * H * k;
    // Kierteinen varsi
    c.lineCap = 'round';
    len = 40;
    for (i = 0; i < 2; i++) {
      c.strokeStyle = i ? '#7fd46a' : '#2f7a2c';
      c.lineWidth = i ? H * 0.014 : H * 0.022;
      c.beginPath();
      for (a = 0; a <= len; a++) {
        ly = y - top * a / len;
        sx = x + Math.sin(a / len * Math.PI * 3 + globalT * 0.6) * H * 0.025 * (a / len + 0.3);
        if (a === 0) c.moveTo(sx, ly); else c.lineTo(sx, ly);
      }
      c.stroke();
    }
    // Lehtiportaat
    for (i = 0; i < n; i++) {
      if ((i + 1) / (n + 0.5) > k) continue;
      ly = y - o.H * H * (i + 0.6) / n;
      sx = x + (i % 2 ? 1 : -1) * H * 0.04;
      artBlob(c, sx, ly, H * 0.045, H * 0.016, '#7fd46a', { rot: (i % 2 ? -0.25 : 0.25), lineColor: '#2f7a2c', hi: 0.3 });
    }
    // Kiehkura latvassa
    c.strokeStyle = '#2f7a2c';
    c.lineWidth = H * 0.006;
    c.beginPath(); c.arc(x + H * 0.015, y - top - H * 0.01, H * 0.015 * k, 0, Math.PI * 1.6); c.stroke();
  } else {
    tkmSeedGlow(c, x, y - H * 0.02, H * 0.032, t);
  }
  tkmDrawSeed(c, x, y, H * 0.034, t, '#b07ad8', '#5a3a80');
  artCircle(c, x - H * 0.008, y - H * 0.012, H * 0.004, '#e8d0ff', { line: false });
  if (!t.grown) tkmDrawFill(c, t, x, y - H * 0.02, H * 0.045);
}
function tkmDrawFinal(c, o) {
  var t = o.t0, x = t.x - camX, y = t.y, H = viewH, L, s;
  if (x < -viewW || x > viewW + H * 0.5) return;
  L = tkmLeaf();
  if (L.k > 0) tkmDrawBigLeaf(c, L.x - camX, L.y, L.rx * L.k, L.bloom, tkm.phase === 'end' && tkm.endT > 0.1);
  if (!t.awake) { tkmDrawMound(c, x, y, H * 0.05); return; }
  if (!t.grown) {
    tkmSeedGlow(c, x, y - H * 0.04, H * 0.06, t);
    s = H * 0.055 * (1 + t.fill * 0.15);
    artShadow(c, x, y + 2, s * 1.1, s * 0.25, 0.2);
    c.save();
    c.translate(x, y);
    c.rotate(t.wob > 0 ? Math.sin(globalT * 40) * 0.06 : 0);
    tkmPopScale(c, t);
    artBlob(c, 0, -s * 0.6, s * 0.75, s * 0.62, '#ffc8a0', { lineColor: '#b0704a', hi: 0.45 });
    c.strokeStyle = 'rgba(176,112,74,0.5)';
    c.lineWidth = Math.max(1, s * 0.05);
    c.beginPath(); c.arc(0, -s * 0.6, s * 0.4, -2.2, -0.9); c.stroke();
    if (t.fill > 0.05) {
      artLimb(c, 0, -s * 1.15, 0, -s * (1.15 + t.fill * 0.6), s * 0.1, '#6cc45c', '#2f7a2c');
      artBlob(c, s * 0.18, -s * (1.15 + t.fill * 0.6), s * 0.22 * t.fill, s * 0.1 * t.fill, '#7fd46a', { rot: 0.4, lineColor: '#2f7a2c' });
    }
    c.restore();
    tkmDrawFill(c, t, x, y - s * 0.6, s * 1.1);
  }
}
// Jättilumpeenlehti (luvun 2 lautta) ja taikakukka sen keskellä
function tkmDrawBigLeaf(c, x, y, rx, bloom, picked) {
  var ry = rx * 0.24, i, k, a, H = viewH;
  artShadow(c, x, y + ry * 0.6, rx * 1.05, ry * 0.6, 0.2);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  artFillPath(c, '#5cb84c', y - ry, y + ry, ry, { lineColor: '#2a6a24' });
  c.beginPath();
  c.ellipse(x, y - ry * 0.15, rx * 0.9, ry * 0.75, 0, 0, Math.PI * 2);
  artFillPath(c, '#7fd46a', y - ry, y + ry * 0.6, ry, { lineColor: '#4a9a3c', line: Math.max(1, ry * 0.05) });
  c.strokeStyle = 'rgba(42,106,36,0.35)';
  c.lineWidth = Math.max(1, ry * 0.05);
  for (i = 0; i < 8; i++) {
    a = i / 8 * Math.PI * 2;
    c.beginPath(); c.moveTo(x, y - ry * 0.15); c.lineTo(x + Math.cos(a) * rx * 0.85, y - ry * 0.15 + Math.sin(a) * ry * 0.7); c.stroke();
  }
  artHighlight(c, x - rx * 0.45, y - ry * 0.45, rx * 0.2, ry * 0.12, 0.4);
  // Seppele: kaikki nuput auki -> kukat kiertävät lehden reunaa
  if (tkm.allBloom && tkm.phase === 'end' && tkm.endT > 1.3) {
    for (i = 0; i < TKM_BUDS; i++) {
      a = i / TKM_BUDS * Math.PI * 2 + tkm.t * 0.3;
      drawFlower(c, x + Math.cos(a) * rx * 0.8, y - ry * 0.15 + Math.sin(a) * ry * 0.62, H * 0.008, TKM_BUD_COLS[i % TKM_BUD_COLS.length]);
    }
  }
  // Taikakukka (kunnes prinsessa poimii sen)
  if (bloom > 0 && !picked) {
    artGlow(c, x + rx * 0.3, y - H * 0.06, H * 0.1 * bloom, '#ffd0e8', 0.5);
    tkmGiftDraw(c, x + rx * 0.3, y - H * 0.055, H * 0.11 * (0.4 + bloom * 0.6), bloom);
  } else if (bloom <= 0 && rx > 0) {
    // Nuppu ennen avautumista
    artLimb(c, x + rx * 0.3, y - ry * 0.2, x + rx * 0.3, y - H * 0.035, H * 0.006, '#6cc45c', '#2f7a2c');
    artBlob(c, x + rx * 0.3, y - H * 0.045, H * 0.012, H * 0.02, '#ff9fc8', { lineColor: '#c0507a' });
  }
}
// Prinsessa poimii kukan: lahja lentää kipinöiden kanssa hänen käteensä
function tkmDrawPick(c) {
  var us = trekUS(), L = tkmLeaf(), k, fx, fy, tx, ty, s = viewH * 0.11;
  tx = tkm.ux - camX + us * 16;
  ty = tkm.uy - us * 84;
  if (tkm.endT < 1.3) {
    k = easeInOutSine(Math.max(0, (tkm.endT - 0.1) / 1.2));
    fx = L.x - camX + L.rx * 0.3 + (tx - (L.x - camX + L.rx * 0.3)) * k;
    fy = L.y - viewH * 0.055 + (ty - (L.y - viewH * 0.055)) * k - Math.sin(k * Math.PI) * viewH * 0.2;
    if (Math.random() < 0.5) spawnSparkles(fx + camX, fy, 1, Math.random() < 0.5 ? '#ffe27a' : '#ff9fd0');
    artGlow(c, fx, fy, s * 0.9, '#fff0f8', 0.6);
    tkmGiftDraw(c, fx, fy, s * (1 - k * 0.45), 1);
  } else {
    artGlow(c, tx, ty, s * 0.5, '#fff0f8', 0.4 + Math.sin(globalT * 4) * 0.1);
    tkmGiftDraw(c, tx, ty, s * 0.55, 1);
  }
}
function tkmDrawBunnySpot(c, t) {
  var x = t.x - camX, y = t.y, H = viewH, k, s, bk;
  if (x < -H * 0.3 || x > viewW + H * 0.3) return;
  s = H * (t.ref === 'path' ? 0.03 : 0.036);
  artShadow(c, x, y + 2, s * 1.3, s * 0.3, 0.16);
  if (t.grown) {
    // Jättiporkkana nousee maasta, pupu pomppaa naatista
    k = easeOutBack(Math.min(1, t.gt / 0.6));
    c.save();
    c.translate(x, y);
    c.beginPath();
    c.moveTo(-s * 0.8 * k, -s * 1.8 * k);
    c.quadraticCurveTo(-s * 0.6, s * 0.2, 0, s * 0.3);
    c.quadraticCurveTo(s * 0.6, s * 0.2, s * 0.8 * k, -s * 1.8 * k);
    c.closePath();
    artFillPath(c, '#ff9a3c', -s * 1.8, s * 0.3, s * 0.6, { lineColor: '#b05a10' });
    c.strokeStyle = 'rgba(176,90,16,0.5)';
    c.lineWidth = Math.max(1, s * 0.06);
    c.beginPath(); c.moveTo(-s * 0.5 * k, -s * 1.1 * k); c.lineTo(-s * 0.1, -s * 1.0 * k); c.moveTo(s * 0.45 * k, -s * 0.5 * k); c.lineTo(s * 0.1, -s * 0.45 * k); c.stroke();
    artBlob(c, -s * 0.35, -s * 2.2 * k, s * 0.2, s * 0.55 * k, '#6cc45c', { rot: -0.4, lineColor: '#2f7a2c' });
    artBlob(c, s * 0.35, -s * 2.2 * k, s * 0.2, s * 0.55 * k, '#6cc45c', { rot: 0.4, lineColor: '#2f7a2c' });
    artBlob(c, 0, -s * 2.4 * k, s * 0.2, s * 0.6 * k, '#7fd46a', { lineColor: '#2f7a2c' });
    c.restore();
    if (t.pop > 0.3 && !t.found) {
      bk = easeOutBack(Math.min(1, (t.pop - 0.3) / 0.5));
      drawBunny(c, x, y - s * 1.9 - bk * s * 1.4, s * 1.4, 0, globalT * 6, false);
    }
  } else {
    // Tavallinen multakeko ja pieni lehti
    c.save();
    c.translate(x, y);
    c.rotate(t.wob > 0 ? Math.sin(globalT * 40) * 0.05 : 0);
    c.beginPath();
    c.moveTo(-s, 0); c.quadraticCurveTo(-s * 0.6, -s * 0.6, 0, -s * 0.6); c.quadraticCurveTo(s * 0.6, -s * 0.6, s, 0); c.closePath();
    artFillPath(c, '#b0845a', -s * 0.6, 0, s * 0.6, { lineColor: '#6a4a2a' });
    artLimb(c, 0, -s * 0.55, s * 0.05, -s * (0.85 + t.fill * 0.5), s * 0.07, '#6cc45c', '#2f7a2c');
    artBlob(c, s * 0.18, -s * (0.9 + t.fill * 0.5), s * 0.16, s * 0.08, '#7fd46a', { rot: 0.5, lineColor: '#2f7a2c' });
    c.restore();
    if (t.fill > 0) tkmDrawFill(c, t, x, y - s * 0.4, s * 1.1);
  }
}
function tkmDrawBud(c, t) {
  var x = t.x - camX, y = t.y, H = viewH, s = H * 0.022, k, i, a, sw;
  if (x < -H * 0.1 || x > viewW + H * 0.1) return;
  sw = Math.sin(globalT * 1.6 + t.ph) * 0.06 + (t.wob > 0 ? Math.sin(globalT * 40) * 0.08 : 0);
  artShadow(c, x, y + 2, s * 0.8, s * 0.2, 0.14);
  c.save();
  c.translate(x, y);
  c.rotate(sw);
  artLimb(c, 0, 0, 0, -s * 1.7, s * 0.14, '#6cc45c', '#2f7a2c');
  artBlob(c, -s * 0.35, -s * 0.5, s * 0.35, s * 0.13, '#7fd46a', { rot: 0.5, lineColor: '#2f7a2c' });
  if (t.grown) {
    k = easeOutBack(Math.min(1, t.gt / 0.4));
    for (i = 0; i < 6; i++) {
      a = i / 6 * Math.PI * 2 + 0.3;
      artBlob(c, Math.cos(a) * s * 0.55 * k, -s * 2 + Math.sin(a) * s * 0.55 * k, s * 0.42 * k, s * 0.26 * k, t.col, { rot: a, lineColor: artShade(t.col, -0.4), line: Math.max(1, s * 0.06) });
    }
    artCircle(c, 0, -s * 2, s * 0.32 * k, '#ffe680', { lineColor: '#c89a20', hi: 0.4 });
    artEye(c, -s * 0.1, -s * 2.03, s * 0.06, 0, false);
    artEye(c, s * 0.1, -s * 2.03, s * 0.06, 0, false);
  } else {
    // Nuppu: suljettu terälehtipisara verholehdissä, avautuu hiukan sateessa
    k = t.fill;
    artBlob(c, 0, -s * 2, s * (0.32 + k * 0.15), s * 0.5, t.col, { lineColor: artShade(t.col, -0.4), hi: 0.4 });
    artBlob(c, -s * 0.2, -s * 1.7, s * 0.2, s * 0.32, '#7fd46a', { rot: 0.4, lineColor: '#2f7a2c' });
    artBlob(c, s * 0.2, -s * 1.7, s * 0.2, s * 0.32, '#7fd46a', { rot: -0.4, lineColor: '#2f7a2c' });
  }
  c.restore();
}
// Vesi taka-alalla: purossa ja joessa välke
function tkmDrawSrcBack(c, s) {
  var x = s.x - camX, i, k, y;
  if (s.kind !== 'brook' && s.kind !== 'river') return;
  if (x < -s.hw - viewH * 0.2 || x > viewW + s.hw + viewH * 0.2) return;
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = Math.max(1.2, viewH * 0.003);
  c.lineCap = 'round';
  for (i = 0; i < 6; i++) {
    k = (globalT * 0.35 + i / 6) % 1;
    y = s.y + (viewH - s.y) * k * 0.9;
    c.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    c.beginPath();
    c.moveTo(x + Math.sin(i * 2.3) * s.hw * 0.5 - viewH * 0.015, y);
    c.lineTo(x + Math.sin(i * 2.3) * s.hw * 0.5 + viewH * 0.015, y);
    c.stroke();
  }
  c.globalAlpha = 1;
}
// Etualan vedet: lampi ja kastepisara jättilehdellä
function tkmDrawSrcFront(c, s) {
  var x = s.x - camX, y = s.y, H = viewH, w = s.wob > 0 ? Math.sin(globalT * 30) * 0.05 : 0, r;
  if (x < -s.hw * 2 || x > viewW + s.hw * 2) return;
  if (s.kind === 'pond') {
    artBlob(c, x, y, s.hw * 1.15, H * 0.028, '#8a6a48', { line: false });
    c.beginPath();
    c.ellipse(x, y, s.hw, H * 0.022, 0, 0, Math.PI * 2);
    artFillPath(c, '#8fd4ff', y - H * 0.022, y + H * 0.022, H * 0.02, { lineColor: '#4a8ac8', line: Math.max(1, H * 0.003) });
    artHighlight(c, x - s.hw * 0.4, y - H * 0.006, s.hw * 0.3, H * 0.005, 0.6);
    tkmReed(c, x + s.hw * 1.05, y + H * 0.01, H * 0.06);
    if ((globalT + s.ph) % 2.4 < 0.05) tkmRipple(s.x + tkmRnd(-0.5, 0.5) * s.hw, y, H * 0.012);
  } else if (s.kind === 'dew') {
    // Lehti kaartuu maasta, kärjessä iso kastepisara
    c.save();
    c.translate(x, y + H * 0.06);
    c.rotate(w);
    artLimb(c, 0, 0, 0, -H * 0.04, H * 0.009, '#5aa84a', '#2f6a2c');
    artBlob(c, 0, -H * 0.045, H * 0.068, H * 0.022, '#5cb84c', { lineColor: '#2a6a24' });
    artBlob(c, 0, -H * 0.05, H * 0.054, H * 0.012, '#8fe07a', { line: false });
    c.strokeStyle = 'rgba(42,106,36,0.5)';
    c.lineWidth = Math.max(1, H * 0.0025);
    c.beginPath(); c.moveTo(-H * 0.055, -H * 0.047); c.lineTo(H * 0.055, -H * 0.047); c.stroke();
    c.translate(0, H * 0.015);
    r = H * 0.022 * (0.9 + Math.sin(globalT * 2 + s.ph) * 0.05);
    artGlow(c, 0, -H * 0.07 - r * 0.6, r * 2, '#c8f0ff', 0.5);
    c.beginPath();
    c.moveTo(0, -H * 0.07 - r * 2.1);
    c.quadraticCurveTo(r * 1.1, -H * 0.07 - r * 0.6, 0, -H * 0.07);
    c.quadraticCurveTo(-r * 1.1, -H * 0.07 - r * 0.6, 0, -H * 0.07 - r * 2.1);
    artFillPath(c, '#a8e2ff', -H * 0.07 - r * 2.1, -H * 0.07, r, { lineColor: '#4a8ac8', line: Math.max(1, r * 0.1) });
    artHighlight(c, -r * 0.25, -H * 0.07 - r * 0.9, r * 0.2, r * 0.12, 0.8);
    c.restore();
  }
}
function tkmDrawRipples(c, front) {
  var i, rp, k;
  c.lineWidth = Math.max(1, viewH * 0.0025);
  for (i = 0; i < tkm.ripples.length; i++) {
    rp = tkm.ripples[i];
    k = rp.t / 0.6;
    c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')';
    c.beginPath();
    c.ellipse(rp.x - camX, rp.y, rp.r * (0.4 + k), rp.r * (0.4 + k) * 0.3, 0, 0, Math.PI * 2);
    c.stroke();
  }
}
function tkmDrawDrops(c) {
  var i, d, x;
  if (!tkm.drops.length) return;
  c.strokeStyle = 'rgba(100,160,240,0.9)';
  c.lineWidth = Math.max(1.5, viewH * 0.005);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i < tkm.drops.length; i++) {
    d = tkm.drops[i]; x = d.x - camX;
    c.moveTo(x, d.y); c.lineTo(x, d.y - viewH * 0.022);
  }
  c.stroke();
}
function tkmDrawFluff(c) {
  var i, f, x, a;
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 1;
  for (i = 0; i < tkm.fluff.length; i++) {
    f = tkm.fluff[i];
    x = f.x - camX;
    a = Math.min(1, (f.life - f.t) / 0.5);
    c.globalAlpha = a;
    c.beginPath(); c.moveTo(x, f.y); c.lineTo(x, f.y + viewH * 0.012); c.stroke();
    artCircle(c, x, f.y, viewH * 0.006, '#ffffff', { lineColor: '#d8dce8', line: 1 });
  }
  c.globalAlpha = 1;
}
function tkmDrawPup(c) {
  var p = tkm.pup, r = tkmPupR(), x = p.x, y = p.y, mood = p.mood, sq = 0, look = p.look, tgt, bob;
  bob = holding && tkm.phase === 'play' ? 0 : Math.sin(tkm.t * 2.2) * viewH * 0.006;
  if (p.sit) bob = 0;
  if (p.wig > 0) sq = Math.sin(p.wig * 30) * 0.12 * Math.min(1, p.wig * 2);
  else if (p.drinking && p.water < 1) sq = Math.sin(tkm.t * 14) * 0.06;
  if (tkm.phase === 'play') {
    tgt = tkmWaiting();
    look = tgt ? tkmClamp((tgt.x - camX - x) / (viewH * 0.3), -1, 1) : tkmClamp(p.vx / (viewH * 0.5), -1, 1);
  }
  artShadow(c, x, Math.min(viewH * 0.98, tkmPathY(x + camX)), r * 0.9 * (0.72 + 0.28 * p.water), r * 0.2, 0.1);
  c.save();
  c.translate(x, y + bob);
  c.rotate(p.tilt);
  trekDrawPup(c, 0, 0, r, { mood: mood, t: tkm.t, look: look, lookY: p.raining ? 0.8 : 0, rain: tkm.phase === 'meet' || tkm.phase === 'intro' ? 0.7 : (p.raining ? 1 : 0), water: p.water, squash: sq, wave: p.wave > 0, squint: p.raining || (p.drinking && p.water < 1) });
  c.restore();
}

// Vihjekäsi: ensimmäinen siemen heti alussa, janoisena veden luo, esteellä odottaessa
function tkmDrawHint(c) {
  var p = tkm.pup, to = null, t, k, hx, hy, H = viewH, s, i, best = 1e9, d, r = tkmPupR();
  if (tkm.phase !== 'play' || holding || celebrating) return;
  if (p.water < 0.05 && tkm.idleT > TKM_THIRST_IDLE) {
    for (i = 0; i < tkm.srcs.length; i++) {
      s = tkm.srcs[i];
      d = Math.abs(tkmClamp(s.x - camX, H * 0.05, viewW - H * 0.05) - p.x) + Math.max(0, Math.abs(s.x - camX - viewW / 2) - viewW / 2) * 3;
      if (d < best) { best = d; to = { x: tkmClamp(s.x - camX, H * 0.08, viewW - H * 0.08), y: (s.kind === 'dew' ? s.y : s.y + H * 0.01) - r * 0.4 }; }
    }
  } else if (!tkm.everGrew || tkm.idleT > TKM_HINT_IDLE) {
    t = tkmWaiting();
    if (t) to = { x: t.x - camX, y: tkmTop(t) - H * 0.17 };
    if (!to && !tkm.everGrew && tkm.obs[0].seed && !tkm.obs[0].seed.grown) {
      t = tkm.obs[0].seed;
      to = { x: t.x - camX, y: tkmTop(t) - H * 0.17 };
    }
  }
  if (!to) return;
  k = (tkm.t % 2.0) / 2.0;
  hx = p.x + (to.x - p.x) * easeInOutSine(Math.min(1, k * 1.4));
  hy = p.y + (to.y - p.y) * easeInOutSine(Math.min(1, k * 1.4));
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  if (k > 0.08) {
    c.globalAlpha *= 0.45;
    trekDrawPup(c, hx, hy, r, { mood: 'happy', t: tkm.t, water: p.water, rain: k > 0.7 && p.water > 0.05 ? 1 : 0 });
    c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2) * 0.9;
  }
  drawHand(c, hx + r * 0.2, hy + r * 0.1, H * 0.045);
  c.globalAlpha = 1;
}

// HUD: vesimittari ja kymmenen nuppua
function tkmHudSlot(i) {
  var hs = viewH * 0.022;
  return { x: hudX() + hs * 4.4 + i * hs * 2.15, y: hs * 0.7 + hs * 1.7 };
}
function tkmDrawHud(c) {
  var hs = viewH * 0.022, top = hs * 0.7, i, sl, shown, bump, f, k, x, y, gx = hudX() + hs * 1.9, gy = top + hs * 1.75, p = tkm.pup, wl, col;
  if (tkm.phase === 'intro' || tkm.phase === 'meet') return;
  drawHudPanel(c, hudX(), top, hs * (4.4 + 2.15 * TKM_BUDS - 0.6), hs * 3.4, hs);
  // Vesimittari: pisara täyttyy alhaalta
  c.save();
  tkmDropPath(c, gx, gy, hs * 1.15);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fill();
  c.clip();
  wl = gy + hs * 1.15 - hs * 2.35 * p.water;
  c.fillStyle = p.water < 0.12 ? '#c8d8e8' : '#5ab8f0';
  c.fillRect(gx - hs * 1.3, wl, hs * 2.6, hs * 3);
  c.restore();
  tkmDropPath(c, gx, gy, hs * 1.15);
  c.strokeStyle = p.water < 0.12 && Math.sin(tkm.t * 8) > 0 ? '#e0705a' : '#3a78b8';
  c.lineWidth = Math.max(1.5, hs * 0.14);
  c.lineJoin = 'round';
  c.stroke();
  for (i = 0; i < TKM_BUDS; i++) {
    sl = tkmHudSlot(i);
    shown = i < tkm.bloomed && !tkmFlying(i);
    bump = shown && tkm.hudBump > 0 && i === tkm.bloomed - 1 ? 1 + Math.sin(Math.PI * tkm.hudBump / 0.4) * 0.45 : 1;
    if (tkm.allBloom && tkm.phase === 'end' && tkm.endT > 0.2) shown = false;
    col = tkmBudCol(i);
    if (shown) drawFlower(c, sl.x, sl.y, hs * 0.42 * bump, col);
    else {
      c.strokeStyle = 'rgba(90,150,80,0.5)';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(sl.x, sl.y, hs * 0.6, 0, Math.PI * 2); c.stroke();
      artBlob(c, sl.x, sl.y + hs * 0.1, hs * 0.2, hs * 0.32, '#cfe6c4', { line: false });
    }
  }
  for (i = 0; i < tkm.flyers.length; i++) {
    f = tkm.flyers[i];
    k = easeInOutSine(f.t / f.dur);
    sl = tkmHudSlot(f.idx);
    x = f.x0 + (sl.x - f.x0) * k;
    y = f.y0 + (sl.y - f.y0) * k - Math.sin(k * Math.PI) * viewH * 0.12;
    artGlow(c, x, y, hs * 1.6, '#fff2a0', 0.6);
    drawStar(c, x, y, hs * 0.55, tkm.t * 4, 0);
  }
  // Seppele: kaikki kukat lentävät lehdelle
  if (tkm.allBloom && tkm.phase === 'end' && tkm.endT > 0.2 && tkm.endT < 1.3) {
    var L = tkmLeaf();
    for (i = 0; i < TKM_BUDS; i++) {
      k = easeInOutSine(tkmClamp((tkm.endT - 0.2 - i * 0.04) / 0.62, 0, 1));
      sl = tkmHudSlot(i);
      x = sl.x + (L.x - camX - sl.x) * k;
      y = sl.y + (L.y - sl.y) * k - Math.sin(k * Math.PI) * viewH * 0.1;
      drawFlower(c, x, y, hs * 0.42, tkmBudCol(i));
    }
  }
}
function tkmBudCol(idx) {
  var i;
  for (i = 0; i < tkm.buds.length; i++) if (tkm.buds[i].idx === idx) return tkm.buds[i].col;
  return '#ff9fc8';
}
function tkmFlying(idx) {
  var i;
  for (i = 0; i < tkm.flyers.length; i++) if (tkm.flyers[i].idx === idx) return true;
  return false;
}
function tkmDropPath(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r * 1.25);
  c.quadraticCurveTo(x + r * 1.05, y - r * 0.1, x + r * 0.8, y + r * 0.45);
  c.arc(x, y + r * 0.2, r * 0.85, 0.3, Math.PI - 0.3);
  c.quadraticCurveTo(x - r * 1.05, y - r * 0.1, x, y - r * 1.25);
  c.closePath();
}

// ---------- Lahja: taikakukka ----------
// Vaaleanpunainen taikakukka, kultainen keskusta ja kimalle (s = laatikon koko)
function tkmGiftDraw(c, x, y, s, open) {
  var i, a, r = s * 0.42, k = open === undefined ? 1 : open, pr;
  // Lehdet
  artBlob(c, x - r * 0.75, y + r * 0.62, r * 0.42, r * 0.16, '#7fd46a', { rot: 0.5, lineColor: '#2f7a2c' });
  artBlob(c, x + r * 0.75, y + r * 0.62, r * 0.42, r * 0.16, '#7fd46a', { rot: -0.5, lineColor: '#2f7a2c' });
  // Terälehdet: ulompi ja sisempi kehä
  for (i = 0; i < 6; i++) {
    a = i / 6 * Math.PI * 2 - Math.PI / 2;
    pr = r * (0.3 + 0.32 * k);
    artBlob(c, x + Math.cos(a) * pr, y + Math.sin(a) * pr, r * (0.25 + 0.17 * k), r * 0.28, '#ff8fc8', { rot: a + Math.PI / 2, lineColor: '#c0507a', line: Math.max(1, r * 0.05) });
  }
  for (i = 0; i < 6; i++) {
    a = i / 6 * Math.PI * 2 - Math.PI / 2 + Math.PI / 6;
    pr = r * (0.2 + 0.18 * k);
    artBlob(c, x + Math.cos(a) * pr, y + Math.sin(a) * pr, r * 0.26, r * 0.18, '#ffc0e0', { rot: a + Math.PI / 2, lineColor: '#d0709a', line: Math.max(1, r * 0.04) });
  }
  artCircle(c, x, y, r * 0.28, '#ffd24f', { lineColor: '#c8901e', hi: 0.5 });
  // Kimalle
  drawStar(c, x + r * 0.95, y - r * 0.85, r * 0.2 * (0.8 + 0.2 * Math.sin(globalT * 5)), globalT, 0);
  drawStar(c, x - r * 0.9, y - r * 0.55, r * 0.13 * (0.8 + 0.2 * Math.sin(globalT * 5 + 2)), -globalT, 0);
}

// ---------- Mitali: niitty, kukka ja satava Pikkupilvi ----------
function tkmIcon(c, x, y, s) {
  var g = c.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.5), b = Math.sin(globalT * 2) * s * 0.015, i;
  g.addColorStop(0, '#9fd0f8');
  g.addColorStop(0.55, '#ffd8dc');
  g.addColorStop(1, '#ffe8c8');
  c.fillStyle = g;
  c.fillRect(x - s * 0.5, y - s * 0.5, s, s);
  artGlow(c, x + s * 0.3, y - s * 0.05, s * 0.2, '#fff0b0', 0.6);
  artCircle(c, x + s * 0.3, y - s * 0.05, s * 0.09, '#ffd87a', { line: false });
  c.fillStyle = '#8fdc7a';
  c.beginPath();
  c.moveTo(x - s * 0.5, y + s * 0.14);
  c.quadraticCurveTo(x, y + s * 0.02, x + s * 0.5, y + s * 0.16);
  c.lineTo(x + s * 0.5, y + s * 0.5); c.lineTo(x - s * 0.5, y + s * 0.5);
  c.closePath();
  c.fill();
  for (i = 0; i < 4; i++) drawFlower(c, x - s * 0.34 + i * s * 0.1, y + s * (0.27 + (i % 2) * 0.06), s * 0.022, ['#ffffff', '#ffe066', '#c9a0ff', '#ff9fc8'][i]);
  // Kukka kasvaa Pikkupilven sateessa
  artLimb(c, x + s * 0.08, y + s * 0.34, x + s * 0.08, y + s * 0.12, s * 0.028, '#6cc45c', '#2f7a2c');
  artBlob(c, x + s * 0.15, y + s * 0.25, s * 0.06, s * 0.025, '#7fd46a', { rot: -0.5, lineColor: '#2f7a2c' });
  tkmGiftDraw(c, x + s * 0.08, y + s * 0.07, s * 0.34, 1);
  c.strokeStyle = 'rgba(90,150,235,0.95)';
  c.lineWidth = Math.max(1, s * 0.016);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i < 4; i++) { c.moveTo(x - s * 0.2 + i * s * 0.06, y - s * 0.12 + (i % 2) * s * 0.05); c.lineTo(x - s * 0.21 + i * s * 0.06, y - s * 0.06 + (i % 2) * s * 0.05); }
  c.stroke();
  trekDrawPup(c, x - s * 0.11, y - s * 0.24 + b, s * 0.14, { mood: 'happy', t: globalT, squint: true });
}

trekRegister({
  id: 'meadow', order: 1, name: 'KUK-KA-NIIT-TY', color: '#8fdc7a',
  ambient: 'butterflies',
  light: { rays: true, raysColor: '#ffd8b8', raysAlpha: 0.9, tint: ['rgba(255,190,205,0.12)', 'rgba(255,225,160,0.05)'], vignette: 0.28 },
  bunny: true,
  gift: { draw: function (c, x, y, s) { tkmGiftDraw(c, x, y, s, 1); } },
  init: tkmInit,
  update: tkmUpdate,
  draw: tkmDraw,
  tap: tkmTap,
  resize: tkmResize,
  layers: tkmLayers,
  icon: tkmIcon
});
