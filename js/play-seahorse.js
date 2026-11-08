'use strict';

// Merihevoskyyti (Meren valtakunta, Korallikylä, huone M): pitkä ja helpohko
// flow-kenttä ilman sydämiä. Prinsessa ratsastaa merihevosella kolmen
// vyöhykkeen läpi: aurinkoinen kelponiitty -> korallikaaret -> hohtava luola.
//   Ohjaus: sormen pohjassa pitäminen ohjaa merihevosta sormen kohtaan
//   (etäisyyteen verrannollinen kiihtyvyys + vaimennus, enimmäisnopeus
//   SHR_VMAX × viewW / s). Ilman sormea merihevonen leijuu ja kelluu.
//   Maailma on pidempi kuin worldW (n. 7–8 ruutua), joten tausta piirretään
//   omista esirenderöidyistä, toistuvista kaistoista (kuten Kuplajoki).
//   Eksyneet pikkukalat (SHR_FISH, 12) odottavat kivillä surullisina:
//   lähelle uiminen saa kalan liittymään parveen, joka ui perässä jonona
//   (seuraa merihevosen jälkeä). Matkan päässä on kalojen koti (korallitalo,
//   12 ikkunaa): parvi ui ikkunoihin. Kun kaikki ovat kotona, alkaa juhla;
//   jos joku puuttuu, talon simpukkaovi sykkii ja sen napautus aloittaa
//   juhlan (ja kultainen nuoli näyttää, missä päin puuttuva kala odottaa).
//   Valohelmiä kerätään matkalla (HUD-laskuri, juhlassa talon valoiksi).
//   Lievä takaisku: ajelehtiva meduusa pomppauttaa pehmeästi taaksepäin
//   (merihevonen pyörryksissä hetken), ja parven 1–2 viimeistä kalaa
//   säikähtää lähimmälle vapaalle kivelle odottamaan (ne voi hakea).
//   Näkyvät virrat (kuplavirta + nuolikuvio) työntävät eteen/ylös/alas.
//   Kultainen simpukka (+1 tähti): kaikki 12 kalaa kotona.
//   Salaisuus: korallien juurella nukkuva merikilpikonna. Tökkäys herättää
//   sen; se ui hetken rinnalla ja odottaa sitten juhlaan talon vieressä.
//   Tökättävät: simpukka (5.: helmi), meritähti (3.: hyppy), etana, korallitorvi
//   (3.: iso kuplarengas), rapu (3.: tanssi), vuokko ja vuokkokala, kristalli
//   (3.: luola kirkastuu hetkeksi), mustekalan kolo (5.: helmi).
// Koordinaatit: u = viewH (x maailmassa = u × viewH), y = osuus viewH:sta.

// ---------- Säätövakiot ----------
var SHR_LEN = 12.6;          // maailman pituus (u)
var SHR_Z2 = 4.2;            // korallikaaret alkavat (u)
var SHR_Z3 = 8.4;            // luola alkaa (u)
var SHR_VMAX = 0.2;          // enimmäisnopeus × viewW / s
var SHR_K = 7;               // ohjauksen jousi (1/s²): kiihtyvyys = K × etäisyys
var SHR_D = 4.8;             // vaimennus (1/s); K 7 / D 4.8 ei ylitä (simuloitu)
var SHR_AMAX = 2.5;          // kiihtyvyysraja × enimmäisnopeus / s
var SHR_DRIFT_D = 2.2;       // vaimennus ilman sormea
var SHR_Y_TOP = 0.13;        // ylin sallittu korkeus (× viewH)
var SHR_Y_BOT = 0.8;         // alin
var SHR_CAVE_TOP = 0.27;     // luolan katto rajaa (× viewH)
var SHR_JOIN = 0.13;         // kala liittyy parveen tältä etäisyydeltä (u)
var SHR_PEARL_R = 0.075;     // helmen keräyssäde (u)
var SHR_HIT_R = 0.072;       // meduusan osumasäde (u)
var SHR_JELLY_SLOW = 1.4;     // meduusojen liikejakson kerroin (suurempi = hitaampi)
var SHR_KNOCK = 0.6;         // takaiskun nopeus (u / s)
var SHR_DIZZY = 0.6;         // ohjaus pois takaiskun jälkeen (s)
var SHR_INVULN = 1.6;        // suoja-aika takaiskun jälkeen (s)
var SHR_LOSE = [1, 2];       // säikähtävät kalat: parvi < 6 / muuten
var SHR_CUR_ACC = 0.4;       // virran kiihtyvyys (u / s²); pienempi kuin ohjauksen raja, joten virtaa vastaan pääsee
var SHR_CUR_VMAX = 1.5;      // virrassa enimmäisnopeuden kerroin
var SHR_SPACING = 0.08;      // kalojen väli jonossa (u)
var SHR_DARK = 0.6;          // luolan pimeys (peittävyys)
var SHR_DELIVER_R = 0.6;     // parvi ui kotiin tältä etäisyydeltä (u)
var SHR_TURTLE_FOLLOW = 20;  // kilpikonna ui rinnalla (s)
var SHR_PARTY = 4.2;         // juhla ennen tähtiä (s)

// Eksyneiden kalojen kivet [u, y]; samat kivet ovat säikähtäneiden pakopaikkoja
var SHR_FISH = [
  [1.9, 0.72], [2.85, 0.24], [3.75, 0.76], [4.95, 0.27], [5.75, 0.76], [6.6, 0.2],
  [7.65, 0.73], [8.95, 0.36], [9.65, 0.75], [10.35, 0.37], [10.95, 0.74], [11.45, 0.36]
];
var SHR_ROCKS = [
  [1.2, 0.76], [2.4, 0.76], [3.3, 0.3], [4.5, 0.76], [5.3, 0.33], [6.15, 0.77],
  [7.15, 0.3], [8.05, 0.76], [9.3, 0.4], [10.0, 0.76], [10.7, 0.42], [11.2, 0.76]
];
var SHR_FISH_COLS = ['#ffd24f', '#ff9d5c', '#7fe0ff', '#ff8fc8', '#b8f07a', '#c8a8ff'];
// Meduusat [u, y0, pystyliike, jakso s, vaihe, vaakaliike u, hohtava]
var SHR_JELLIES = [
  [2.35, 0.48, 0.16, 5.0, 0, 0, 0], [3.3, 0.52, 0.2, 6.0, 1.5, 0, 0],
  [4.6, 0.5, 0.2, 5.5, 0.5, 0, 0], [5.95, 0.45, 0.22, 6.5, 2, 0.3, 0],
  [6.9, 0.58, 0.15, 4.8, 1, 0, 0], [7.95, 0.42, 0.2, 5.2, 2.5, 0, 0],
  [9.2, 0.52, 0.18, 5.0, 0, 0, 1], [9.95, 0.55, 0.2, 6.0, 1.2, 0.25, 1],
  [10.65, 0.54, 0.2, 5.4, 2.2, 0, 1], [11.2, 0.5, 0.18, 4.6, 0.7, 0, 1]
];
// Virrat [x0, x1, y0, y1, suunta x, suunta y]
var SHR_CURRENTS = [
  [1.3, 2.2, 0.3, 0.46, 1, 0], [6.15, 6.45, 0.28, 0.8, 0, -1],
  [7.15, 7.4, 0.2, 0.66, 0, 1], [9.35, 10.2, 0.43, 0.58, 1, 0]
];
// Helmirivit [x0, y0, x1, y1, kpl, kaari]
var SHR_PEARLS = [
  [0.95, 0.5, 1.25, 0.42, 3, 0], [1.4, 0.38, 2.12, 0.38, 5, 0], [2.25, 0.6, 2.65, 0.32, 3, 0],
  [3.0, 0.36, 3.6, 0.7, 4, -0.08], [3.95, 0.58, 4.2, 0.46, 2, 0],
  [4.55, 0.24, 4.8, 0.24, 2, 0], [5.22, 0.66, 5.62, 0.66, 3, 0], [6.3, 0.72, 6.3, 0.34, 4, 0],
  [6.85, 0.25, 7.05, 0.3, 2, 0], [7.27, 0.3, 7.27, 0.6, 3, 0], [8.0, 0.56, 8.3, 0.46, 2, 0],
  [8.65, 0.5, 8.85, 0.46, 2, 0], [9.42, 0.5, 10.14, 0.5, 5, 0], [10.45, 0.56, 10.8, 0.62, 3, 0.05],
  [11.0, 0.46, 11.35, 0.52, 3, 0]
];
var SHR_ARCHES = [[SHR_Z2, 1.05], [5.42, 1.0], [7.0, 0.95]];   // korallikaaret [u, koko]
var SHR_TURTLE_AT = [6.0, 0.82];
var SHR_HOUSE_U = SHR_LEN - 0.8;

// ---------- Tila ----------
var shr = {
  built: false, x: 0, y: 0, vx: 0, vy: 0, facing: 1, cam: 0, t: 0, swimPh: 0,
  hitT: 0, invT: 0, hits: 0, fish: [], school: [], pearls: [], jellies: [], trail: [],
  got: 0, home: 0, windows: [], flying: [], deliverT: 0, state: 'swim', partyT: 0,
  turtle: null, noSteer: false, everHeld: false, hudBump: 0, pearlBump: 0,
  lightT: 0, bubbles: [], doorT: 0, key: '', spr: {}, won: false
};

// ---------- Apu ----------
function shrVmax() { return SHR_VMAX * viewW / Math.max(1, viewH); }
function shrViewU() { return viewW / Math.max(1, viewH); }
function shrCamFor(x) { return Math.min(Math.max(x - shrViewU() * 0.42, 0), Math.max(0, SHR_LEN - shrViewU())); }
function shrSx(u) { return u * viewH - camX; }
function shrHash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function shrCaveTop(u) {
  var k = Math.min(1, Math.max(0, (u - SHR_Z3 + 0.1) / 0.4));
  return SHR_Y_TOP + (SHR_CAVE_TOP - SHR_Y_TOP) * k;
}
function shrJellyPos(j) {
  var w = Math.PI * 2 / (j.per * SHR_JELLY_SLOW);
  return { x: j.x + Math.sin(shr.t * w * 0.5 + j.ph) * j.dx, y: j.y0 + Math.sin(shr.t * w + j.ph) * j.amp };
}
function shrHousePos() { return { x: SHR_HOUSE_U, y: 0.55 }; }
function shrHouseDoor() { return { x: SHR_HOUSE_U, y: 0.72 }; }
function shrWindowPos(i) {
  var c = i % 4, r = Math.floor(i / 4);
  return { x: SHR_HOUSE_U + (c - 1.5) * 0.15, y: 0.36 + r * 0.12 };
}
// Luolan pimeys ruudun kohdassa sx (0..1)
function shrDarkAt(u) { return Math.min(1, Math.max(0, (u - SHR_Z3 + 0.15) / 0.5)); }

// ---------- Alustus ----------
function shrBuild() {
  var i, j, r, k, x, y;
  shr.fish = [];
  for (i = 0; i < SHR_FISH.length; i++) {
    shr.fish.push({ x: SHR_FISH[i][0], y: SHR_FISH[i][1], tx: 0, ty: 0, rock: i, state: 'wait', cool: 0,
      col: SHR_FISH_COLS[i % SHR_FISH_COLS.length], ph: Math.random() * 6, dir: -1, pop: 0, win: -1 });
  }
  shr.pearls = [];
  for (i = 0; i < SHR_PEARLS.length; i++) {
    r = SHR_PEARLS[i];
    for (j = 0; j < r[4]; j++) {
      k = r[4] > 1 ? j / (r[4] - 1) : 0.5;
      x = r[0] + (r[2] - r[0]) * k;
      y = r[1] + (r[3] - r[1]) * k + Math.sin(k * Math.PI) * r[5];
      shr.pearls.push({ x: x, y: y, got: false, ph: Math.random() * 6 });
    }
  }
  shr.jellies = [];
  for (i = 0; i < SHR_JELLIES.length; i++) {
    r = SHR_JELLIES[i];
    shr.jellies.push({ x: r[0], y0: r[1], amp: r[2], per: r[3], ph: r[4], dx: r[5], glow: r[6], squish: 0 });
  }
  shr.turtle = { x: SHR_TURTLE_AT[0], y: SHR_TURTLE_AT[1], state: 'sleep', t: 0, dir: 1, ph: 0 };
  shr.bubbles = [];
  for (i = 0; i < 9; i++) shr.bubbles.push({ x: Math.random(), y: Math.random(), s: 0.004 + Math.random() * 0.006, v: 0.04 + Math.random() * 0.05, par: 0.4 + Math.random() * 0.5 });
}
function initSeahorse() {
  shrBuild();
  shr.built = true;
  shr.x = 0.6; shr.y = 0.5; shr.vx = 0; shr.vy = 0; shr.facing = 1;
  shr.t = 0; shr.swimPh = 0; shr.hitT = 0; shr.invT = 0; shr.hits = 0;
  shr.school = []; shr.trail = [{ x: shr.x, y: shr.y }];
  shr.got = 0; shr.home = 0; shr.windows = []; shr.flying = []; shr.deliverT = 0;
  shr.state = 'swim'; shr.partyT = 0; shr.noSteer = false; shr.everHeld = false;
  shr.hudBump = 0; shr.pearlBump = 0; shr.lightT = 0; shr.doorT = 0; shr.won = false;
  shr.cam = shrCamFor(shr.x);
  camX = shr.cam * viewH;
  shr.key = '';
  shrSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'sine', 0.25);
  playNote(659, 0.12, 0.2, 'sine', 0.25);
  playNote(784, 0.24, 0.3, 'triangle', 0.25);
}
function respawnSeahorse() {}
function resizeSeahorse() {
  if (!shr.built) return;
  shr.cam = shrCamFor(shr.x);
  camX = shr.cam * viewH;
  shrSetupProps();
}
function seahorseLayers() {
  return [{ speed: 0, render: renderSeahorseBg }];
}

// ---------- Tökättävät koristeet ----------
function shrFloor() { return viewH * 0.875; }
function shrSetupProps() {
  var H = viewH, fl = shrFloor();
  propsReset();
  // Kelponiitty: simpukka, meritähti, etana
  propAdd({ x: 1.5 * H, y: fl, r: H * 0.07, color: '#ffd0ec', note: 660, draw: shrDrawClam,
    poke: function (p) { if (p.n % 5 === 0) shrPropPearl(p.x / H, p.y / H - 0.08); } });
  propAdd({ x: 2.62 * H, y: fl + H * 0.01, r: H * 0.06, color: '#ffb04f', note: 740, draw: shrDrawStarfishProp, amp: 0.4 });
  propAdd({ x: 3.42 * H, y: fl, r: H * 0.06, color: '#c8f0a0', note: 520, draw: shrDrawSnail });
  // Korallikaaret: korallitorvi, rapu, vuokko
  propAdd({ x: 4.75 * H, y: fl, r: H * 0.08, color: '#ff9f7a', note: 392, draw: shrDrawHorn,
    poke: function (p) {
      var i;
      for (i = 0; i < (p.n % 3 === 0 ? 7 : 3); i++) spawnSparkles(p.x + H * 0.03, p.y - H * 0.12 - i * H * 0.02, 1, '#e8fbff');
      if (p.n % 3 === 0) { artPop(p.x + H * 0.02, p.y - H * 0.2, H * 0.12, '#ffffff', 'ring'); playNote(262, 0.1, 0.4, 'triangle', 0.22); }
    } });
  propAdd({ x: 7.25 * H, y: fl, r: H * 0.06, color: '#ff6a4a', note: 880, draw: shrDrawCrab });
  propAdd({ x: 8.05 * H, y: fl, r: H * 0.075, color: '#ff8fc8', note: 587, draw: shrDrawAnemone });
  // Luola: kristalli, mustekalan kolo
  propAdd({ x: 9.45 * H, y: fl, r: H * 0.07, color: '#bfe8ff', note: 1175, draw: shrDrawCrystal,
    poke: function (p) { if (p.n % 3 === 0) { shr.lightT = 6; playNote(1568, 0.1, 0.5, 'sine', 0.18); } } });
  propAdd({ x: 10.75 * H, y: fl, r: H * 0.08, color: '#c97ad8', note: 330, draw: shrDrawOctoHole,
    poke: function (p) { if (p.n % 5 === 0) shrPropPearl(p.x / H + 0.06, p.y / H - 0.1); } });
}
// Yllätyshelmi koristeesta: uusi kerättävä helmi pomppaa esiin
function shrPropPearl(u, y) {
  shr.pearls.push({ x: u, y: Math.max(0.3, y), got: false, ph: 0, born: 0 });
  artPop(u * viewH, y * viewH, viewH * 0.05, '#fff6ff', 'burst');
  playNote(1319, 0.05, 0.2, 'triangle', 0.2);
}

// ---------- Napautus ----------
function handleSeahorseTap(px, py) {
  var wx = px + camX, u = wx / viewH, v = py / viewH, tt = shr.turtle, hd;
  if (!running || celebrating) return;
  shr.everHeld = true;
  if (propsTap(wx, py)) { shr.noSteer = true; return; }
  if (tt.state === 'sleep' && Math.hypot(u - tt.x, v - (tt.y - 0.03)) < 0.11) {
    tt.state = 'wake'; tt.t = 0;
    shr.noSteer = true;
    spawnSparkles(tt.x * viewH, (tt.y - 0.05) * viewH, 10, '#c8f7a0');
    playNote(330, 0, 0.25, 'sine', 0.25);
    playNote(392, 0.2, 0.25, 'sine', 0.25);
    playNote(523, 0.4, 0.35, 'triangle', 0.22);
    return;
  }
  if (tt.state !== 'sleep' && tt.state !== 'wake' && Math.hypot(u - tt.x, v - tt.y) < 0.09) {
    tt.ph = 1;
    playNote(440, 0, 0.15, 'sine', 0.2);
    spawnSparkles(tt.x * viewH, (tt.y - 0.04) * viewH, 6, '#ff8fb8');
  }
  // Kalojen koti: ovi aloittaa juhlan, kun merihevonen on talolla
  hd = shrHousePos();
  if (shr.state === 'swim' && shr.home > 0 && shr.flying.length === 0 && Math.abs(u - hd.x) < 0.42 && v > 0.22 && v < 0.85 &&
      Math.hypot(shr.x - hd.x, shr.y - hd.y) < 1.1) {
    shr.noSteer = true;
    shrStartParty();
    return;
  }
  // Merihevosen tökkäys: kuplia ja kilahdus (ohjaus jatkuu)
  if (Math.hypot(u - shr.x, v - (shr.y - 0.03)) < 0.08) {
    spawnSparkles(shr.x * viewH, (shr.y - 0.08) * viewH, 6, '#bff4ff');
    playNote(988, 0, 0.1, 'sine', 0.18);
  }
}

// ---------- Päivitys ----------
function updateSeahorse(dt) {
  if (!shr.built) return;
  dt = Math.min(dt, 0.05);
  shr.t += dt;
  if (!holding) shr.noSteer = false;
  updateParticles(dt);
  updateConfetti(dt);
  propsUpdate(dt);
  if (shr.hudBump > 0) shr.hudBump -= dt;
  if (shr.pearlBump > 0) shr.pearlBump -= dt;
  if (shr.lightT > 0) shr.lightT -= dt;
  shrUpdateRider(dt);
  shrUpdateTrail();
  shrUpdatePearls(dt);
  shrUpdateFish(dt);
  shrUpdateJellies(dt);
  shrUpdateTurtle(dt);
  shrUpdateHome(dt);
  shr.cam += (shrCamFor(shr.x) - shr.cam) * Math.min(1, dt * 3);
  camX = shr.cam * viewH;
}
function shrInCurrent(x, y) {
  var i, c;
  for (i = 0; i < SHR_CURRENTS.length; i++) {
    c = SHR_CURRENTS[i];
    if (x > c[0] && x < c[1] && y > c[2] && y < c[3]) return c;
  }
  return null;
}
function shrUpdateRider(dt) {
  var vm = shrVmax(), tx, ty, ax = 0, ay = 0, a, sp, cap = vm, cur, steer;
  steer = holding && !shr.noSteer && shr.hitT <= 0 && shr.state === 'swim' && !celebrating && introT <= 0;
  if (shr.hitT > 0) shr.hitT -= dt;
  if (shr.invT > 0) shr.invT -= dt;
  if (steer) {
    shr.everHeld = true;
    tx = (lastPX + camX) / viewH;
    ty = lastPY / viewH;
    ax = SHR_K * (tx - shr.x) - SHR_D * shr.vx;
    ay = SHR_K * (ty - shr.y) - SHR_D * shr.vy;
    a = Math.hypot(ax, ay);
    if (a > SHR_AMAX * vm) { ax *= SHR_AMAX * vm / a; ay *= SHR_AMAX * vm / a; }
  } else {
    ax = -SHR_DRIFT_D * shr.vx;
    ay = -SHR_DRIFT_D * shr.vy + Math.sin(shr.t * 1.3) * 0.02;
  }
  cur = shr.state === 'swim' ? shrInCurrent(shr.x, shr.y) : null;
  if (cur) {
    ax += cur[4] * SHR_CUR_ACC;
    ay += cur[5] * SHR_CUR_ACC;
    cap = vm * SHR_CUR_VMAX;
  }
  shr.vx += ax * dt;
  shr.vy += ay * dt;
  sp = Math.hypot(shr.vx, shr.vy);
  if (shr.hitT <= 0 && sp > cap) { shr.vx *= cap / sp; shr.vy *= cap / sp; }
  shr.x += shr.vx * dt;
  shr.y += shr.vy * dt;
  var top = shrCaveTop(shr.x);
  if (shr.y < top) { shr.y = top; if (shr.vy < 0) shr.vy = 0; }
  if (shr.y > SHR_Y_BOT) { shr.y = SHR_Y_BOT; if (shr.vy > 0) shr.vy = 0; }
  if (shr.x < 0.25) { shr.x = 0.25; if (shr.vx < 0) shr.vx = 0; }
  if (shr.x > SHR_LEN - 0.25) { shr.x = SHR_LEN - 0.25; if (shr.vx > 0) shr.vx = 0; }
  if (shr.vx > 0.06) shr.facing = 1; else if (shr.vx < -0.06) shr.facing = -1;
  shr.swimPh += dt * (3 + sp / vm * 9);
}
// Merihevosen jälki: parvi seuraa sitä jonona
function shrUpdateTrail() {
  var L = shr.trail[0], step = 0.012;
  if (Math.hypot(shr.x - L.x, shr.y - L.y) > step) {
    shr.trail.unshift({ x: shr.x, y: shr.y });
    if (shr.trail.length > 160) shr.trail.pop();
  }
}
function shrSchoolTarget(i) {
  var idx = Math.round((0.17 + i * SHR_SPACING) / 0.012), tr = shr.trail;
  return tr[Math.min(tr.length - 1, idx)];
}
function shrUpdatePearls(dt) {
  var i, p, n = 0;
  for (i = 0; i < shr.pearls.length; i++) {
    p = shr.pearls[i];
    if (p.got) continue;
    if (p.born !== undefined && p.born < 0.4) { p.born += dt; continue; }
    if (Math.hypot(p.x - shr.x, p.y - (shr.y - 0.02)) < SHR_PEARL_R ||
        (shr.turtle.state === 'follow' && Math.hypot(p.x - shr.turtle.x, p.y - shr.turtle.y) < SHR_PEARL_R)) {
      p.got = true;
      shr.got++;
      shr.pearlBump = 0.35;
      n++;
      spawnSparkles(p.x * viewH, p.y * viewH, 6, '#fff6ff');
      playNote(1047 * Math.pow(1.0595, shr.got % 12), 0, 0.12, 'sine', 0.2);
    }
  }
}
function shrUpdateFish(dt) {
  var i, f, tg, k, d, idx;
  for (i = 0; i < shr.fish.length; i++) {
    f = shr.fish[i];
    f.ph += dt * (f.state === 'school' ? 10 : 5);
    if (f.pop > 0) f.pop -= dt;
    if (f.cool > 0) f.cool -= dt;
    if (f.state === 'wait') {
      if (shr.state === 'swim' && f.cool <= 0 && Math.hypot(f.x - shr.x, f.y - shr.y) < SHR_JOIN) {
        f.state = 'school';
        shr.school.push(f);
        f.pop = 0.5;
        shr.hudBump = 0.4;
        artPop(f.x * viewH, f.y * viewH, viewH * 0.04, '#ffe27a', 'ring');
        playNote(660 + shr.school.length * 30, 0, 0.1, 'triangle', 0.25);
        playNote(990 + shr.school.length * 30, 0.08, 0.14, 'triangle', 0.22);
      }
    } else if (f.state === 'flee') {
      d = Math.hypot(f.tx - f.x, f.ty - f.y);
      k = Math.min(d, 0.7 * dt);
      if (d > 0.001) { f.x += (f.tx - f.x) / d * k; f.y += (f.ty - f.y) / d * k; f.dir = f.tx > f.x ? 1 : -1; }
      if (d < 0.01) { f.state = 'wait'; f.dir = shr.x > f.x ? 1 : -1; }
    } else if (f.state === 'school') {
      idx = shr.school.indexOf(f);
      tg = shrSchoolTarget(idx);
      k = 1 - Math.exp(-dt * 6);
      var ox = Math.sin(shr.t * 2 + i) * 0.012, oy = Math.cos(shr.t * 2.4 + i * 1.7) * 0.015;
      var nx = f.x + (tg.x + ox - f.x) * k;
      if (Math.abs(nx - f.x) > 0.0015) f.dir = nx > f.x ? 1 : -1;
      f.x = nx;
      f.y += (tg.y + oy - f.y) * k;
    }
  }
}
function shrUpdateJellies(dt) {
  var i, j, p, d, nx, ny;
  for (i = 0; i < shr.jellies.length; i++) {
    j = shr.jellies[i];
    if (j.squish > 0) j.squish -= dt;
    if (shr.state !== 'swim' || shr.invT > 0) continue;
    p = shrJellyPos(j);
    d = Math.hypot(p.x - shr.x, p.y - shr.y);
    if (d < SHR_HIT_R) {
      // Pehmeä pomppu taaksepäin (poispäin meduusasta, aina vähän vasemmalle)
      nx = (shr.x - p.x) / Math.max(0.001, d) - 0.6;
      ny = (shr.y - p.y) / Math.max(0.001, d);
      d = Math.hypot(nx, ny);
      shr.vx = nx / d * SHR_KNOCK;
      shr.vy = ny / d * SHR_KNOCK;
      shr.hitT = SHR_DIZZY;
      shr.invT = SHR_INVULN;
      shr.hits++;
      j.squish = 0.5;
      artPop(shr.x * viewH, shr.y * viewH, viewH * 0.06, '#ffb8f0', 'burst');
      playNote(330, 0, 0.12, 'sine', 0.3);
      playNote(247, 0.1, 0.16, 'sine', 0.26);
      playNote(392, 0.24, 0.12, 'sine', 0.18);
      shrScare(shr.school.length < 6 ? SHR_LOSE[0] : SHR_LOSE[1]);
    }
  }
}
// Parven viimeiset kalat säikähtävät lähimmälle vapaalle kivelle
function shrScare(n) {
  var k, f, i, best, bd, rx, ry, d, used, j;
  for (k = 0; k < n && shr.school.length > 0; k++) {
    f = shr.school.pop();
    best = -1; bd = 1e9;
    for (i = 0; i < SHR_FISH.length + SHR_ROCKS.length; i++) {
      rx = i < SHR_FISH.length ? SHR_FISH[i][0] : SHR_ROCKS[i - SHR_FISH.length][0];
      ry = i < SHR_FISH.length ? SHR_FISH[i][1] : SHR_ROCKS[i - SHR_FISH.length][1];
      if (Math.hypot(rx - shr.x, ry - shr.y) < 0.35) continue;
      used = false;
      for (j = 0; j < shr.fish.length; j++) {
        if (shr.fish[j] !== f && shr.fish[j].rock === i && (shr.fish[j].state === 'wait' || shr.fish[j].state === 'flee')) used = true;
      }
      if (used) continue;
      // Lähin kivi; ruudun ulkopuolinen kivi kelpaa vain hätätilassa
      d = Math.hypot(rx - f.x, ry - f.y) + (rx < shr.cam || rx > shr.cam + shrViewU() ? 5 : 0);
      if (d < bd) { bd = d; best = i; }
    }
    f.rock = best;
    f.tx = best < SHR_FISH.length ? SHR_FISH[best][0] : SHR_ROCKS[best - SHR_FISH.length][0];
    f.ty = best < SHR_FISH.length ? SHR_FISH[best][1] : SHR_ROCKS[best - SHR_FISH.length][1];
    f.state = 'flee';
    f.cool = 1.4;
    f.pop = 0;
    spawnSparkles(f.x * viewH, f.y * viewH, 4, f.col);
    playNote(1400 - k * 200, 0.05 + k * 0.08, 0.07, 'square', 0.05);
  }
  if (n > 0) shr.hudBump = 0.4;
}
function shrUpdateTurtle(dt) {
  var tt = shr.turtle, tx, ty, k, hd;
  tt.t += dt;
  if (tt.ph > 0) tt.ph -= dt;
  if (tt.state === 'wake') {
    tt.y -= dt * 0.04;
    if (tt.t > 1.3) { tt.state = 'follow'; tt.t = 0; }
  } else if (tt.state === 'follow' || tt.state === 'leave') {
    if (tt.state === 'follow') {
      tx = shr.x - shr.facing * 0.22; ty = Math.min(0.78, shr.y + 0.1);
      if (tt.t > SHR_TURTLE_FOLLOW) { tt.state = 'leave'; tt.t = 0; playNote(523, 0, 0.15, 'sine', 0.2); playNote(392, 0.15, 0.2, 'sine', 0.2); }
    } else {
      hd = shrHousePos();
      tx = hd.x - 0.58; ty = 0.72;
      if (Math.hypot(tx - tt.x, ty - tt.y) < 0.03) { tt.state = 'home'; tt.dir = 1; }
    }
    k = tt.state === 'leave' ? Math.min(1, 0.9 * dt / Math.max(0.01, Math.hypot(tx - tt.x, ty - tt.y))) : 1 - Math.exp(-dt * 1.6);
    if (Math.abs(tx - tt.x) > 0.02) tt.dir = tx > tt.x ? 1 : -1;
    tt.x += (tx - tt.x) * k;
    tt.y += (ty - tt.y) * k;
  }
}
// Kalojen koti: parvi ui ikkunoihin yksi kerrallaan
function shrUpdateHome(dt) {
  var hd = shrHouseDoor(), i, fl, f, w;
  if (shr.deliverT > 0) shr.deliverT -= dt;
  if (shr.state === 'swim') {
    if (shr.school.length > 0 && shr.deliverT <= 0 && Math.hypot(shr.x - hd.x, shr.y - hd.y) < SHR_DELIVER_R) {
      f = shr.school.shift();
      w = shr.home + shr.flying.length;
      f.state = 'fly'; f.win = w;
      shr.flying.push({ f: f, x0: f.x, y0: f.y, t: 0 });
      shr.deliverT = 0.3;
    }
    shr.doorT += dt;
  }
  for (i = shr.flying.length - 1; i >= 0; i--) {
    fl = shr.flying[i];
    fl.t += dt;
    w = shrWindowPos(fl.f.win);
    var k = easeInOutSine(Math.min(1, fl.t / 0.7));
    fl.f.x = fl.x0 + (w.x - fl.x0) * k;
    fl.f.y = fl.y0 + (w.y - fl.y0) * k - Math.sin(k * Math.PI) * 0.12;
    fl.f.dir = w.x > fl.x0 ? 1 : -1;
    if (fl.t >= 0.7) {
      fl.f.state = 'home';
      shr.windows[fl.f.win] = fl.f.col;
      shr.home++;
      shr.hudBump = 0.4;
      artPop(w.x * viewH, w.y * viewH, viewH * 0.04, '#fff3b8', 'ring');
      spawnSparkles(w.x * viewH, w.y * viewH, 6, fl.f.col);
      playNote(523 * Math.pow(1.0595, [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19][Math.min(11, shr.home - 1)]), 0, 0.18, 'triangle', 0.25);
      shr.flying.splice(i, 1);
      if (shr.home >= SHR_FISH.length && shr.state === 'swim') shrStartParty();
    }
  }
  if (shr.state === 'party') {
    var prev = shr.partyT;
    shr.partyT += dt;
    if (prev < 0.4 && shr.partyT >= 0.4) {
      artPop(SHR_HOUSE_U * viewH, 0.3 * viewH, viewH * 0.2, '#ffe27a', 'burst');
      spawnSparkles(SHR_HOUSE_U * viewH, 0.3 * viewH, 24, '#fff3b8');
      soundFanfare();
    }
    if (shr.partyT > SHR_PARTY && !shr.won) {
      shr.won = true;
      shr.state = 'done';
      startCelebration();
      if (shrGolden()) {
        // Kultainen simpukka: +1 tähti (startCelebration antoi jo 2)
        starCoins += 1;
        starGain.n += 1;
        starGain.until = globalT + 3.2;
        saveProgress();
        spawnSparkles(viewW / 2, viewH * 0.5, 30, '#ffd24f');
      }
    }
  }
}
function shrGolden() { return shr.home >= SHR_FISH.length; }
function shrStartParty() {
  if (shr.state !== 'swim') return;
  shr.state = 'party';
  shr.partyT = 0;
  shr.vx = 0; shr.vy = 0;
  if (shr.turtle.state === 'follow' || shr.turtle.state === 'leave') { shr.turtle.state = 'leave'; }
  playNote(784, 0, 0.2, 'triangle', 0.28);
  playNote(988, 0.12, 0.2, 'triangle', 0.28);
}

// ---------- Tausta: esirenderöidyt kaistat ----------
function renderSeahorseBg(b, w, h) {
  var g = b.createLinearGradient(0, 0, 0, h), i, x;
  g.addColorStop(0, '#a8ecf4');
  g.addColorStop(0.35, '#5cc4e2');
  g.addColorStop(0.75, '#2f92c8');
  g.addColorStop(1, '#2378b0');
  b.fillStyle = g;
  b.fillRect(0, 0, w, h);
  // Pinnan väreily ylhäällä
  b.strokeStyle = 'rgba(255,255,255,0.35)';
  b.lineWidth = Math.max(1.5, h * 0.004);
  for (i = 0; i < 2; i++) {
    b.beginPath();
    for (x = 0; x <= w; x += 12) b.lineTo(x, h * (0.03 + i * 0.03) + Math.sin(x * 0.02 + i * 2) * h * 0.006);
    b.stroke();
  }
}
function shrCanvas(w, h) {
  var cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w));
  cv.height = Math.max(1, Math.round(h));
  return { cv: cv, b: cv.getContext('2d') };
}
function shrWave(x, w, k, ph) { return Math.sin(x / w * Math.PI * 2 * k + (ph || 0)); }
function shrPrepare() {
  var key = viewW + 'x' + viewH, S = shr.spr, H = viewH, g;
  if (shr.key === key) return;
  shr.key = key;
  S.tw = Math.round(viewW * 1.5);
  S.far = shrRenderFar(S.tw, Math.round(H * 0.55));
  S.kelp = shrRenderFloor(S.tw, Math.round(H * 0.55), 'kelp');
  S.coral = shrRenderFloor(S.tw, Math.round(H * 0.55), 'coral');
  S.cave = shrRenderFloor(S.tw, Math.round(H * 0.55), 'cave');
  S.ceil = shrRenderCeil(S.tw, Math.round(H * 0.3));
  S.arch = shrRenderArch(H * 1.0, H * 0.62);
  S.mouth = shrRenderMouth(H * 0.9, H);
  S.house = shrRenderHouse(H * 0.78, H * 0.72);
  S.pearl = shrRenderPearl(H * 0.016);
  g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
  g.addColorStop(0, 'rgba(235,252,255,0.16)');
  g.addColorStop(1, 'rgba(235,252,255,0)');
  S.rayGrad = g;
}
function shrRenderFar(w, h) {
  var o = shrCanvas(w, h), b = o.b, H = viewH, i, x, y;
  fillHillBand(b, w, h, h * 0.5, '#5aa6cc', function (px) { return h * (0.45 - 0.13 * shrWave(px, w, 3) - 0.05 * shrWave(px, w, 7, 1)); });
  // Kaukaiset levät ja korallit siluetteina
  b.strokeStyle = '#4f9cc4';
  b.lineCap = 'round';
  for (i = 0; i < 18; i++) {
    x = w * (i + shrHash(i) * 0.7) / 18;
    y = h * (0.45 - 0.13 * shrWave(x, w, 3) - 0.05 * shrWave(x, w, 7, 1)) + H * 0.01;
    b.lineWidth = Math.max(2, H * 0.008);
    b.beginPath(); b.moveTo(x, y);
    b.quadraticCurveTo(x + H * 0.03, y - H * 0.08, x - H * 0.01, y - H * (0.12 + shrHash(i + 3) * 0.08));
    b.stroke();
  }
  fillHillBand(b, w, h, h * 0.75, '#4a95c0', function (px) { return h * (0.72 - 0.06 * shrWave(px, w, 5, 2) - 0.03 * shrWave(px, w, 11)); });
  return o.cv;
}
// Pohjan pinta kaistan sisällä (kaistan koordinaatit)
function shrFloorY(x, w, h) { return h - viewH * (0.15 + 0.022 * shrWave(x, w, 4) + 0.012 * shrWave(x, w, 9, 1)); }
function shrRenderFloor(w, h, kind) {
  var o = shrCanvas(w, h), b = o.b, H = viewH, x, i, y, s, cols;
  var sand = kind === 'cave' ? '#4a4f82' : (kind === 'coral' ? '#f4d8c0' : '#f2e2b0');
  var line = kind === 'cave' ? '#2a2c58' : '#b89a6a';
  // Lähiesineet ensin taakse (levät/korallit), sitten pohja niiden juurelle
  if (kind === 'kelp') {
    for (i = 0; i < 9; i++) {
      x = w * (i + 0.2 + shrHash(i + 40) * 0.6) / 9;
      drawKelp(b, x, shrFloorY(x, w, h) + H * 0.02, H * (0.14 + shrHash(i + 7) * 0.2), 0, (shrHash(i) - 0.5) * 1.2);
    }
  } else if (kind === 'coral') {
    cols = ['#ff7a8a', '#ffb04f', '#c88aff', '#ff9fc8', '#7fd8c8'];
    for (i = 0; i < 11; i++) {
      x = w * (i + 0.2 + shrHash(i + 20) * 0.6) / 11;
      s = H * (0.06 + shrHash(i + 5) * 0.06);
      if (i % 3 === 1) shrDrawFan(b, x, shrFloorY(x, w, h) + H * 0.01, s * 1.3, cols[(i + 2) % 5]);
      else drawCoral(b, x, shrFloorY(x, w, h) + H * 0.015, s, cols[i % 5], false);
    }
  } else {
    for (i = 0; i < 9; i++) {
      x = w * (i + 0.3 + shrHash(i + 60) * 0.4) / 9;
      y = shrFloorY(x, w, h) + H * 0.02;
      s = H * (0.07 + shrHash(i + 9) * 0.09);
      b.beginPath(); b.moveTo(x - s * 0.35, y); b.lineTo(x - s * 0.05, y - s); b.lineTo(x + s * 0.12, y - s * 0.9); b.lineTo(x + s * 0.35, y); b.closePath();
      artFillPath(b, '#5a5f96', y - s, y, s * 0.3, { lineColor: '#2a2c58' });
      if (i % 2 === 0) shrCrystalShape(b, x + s * 0.45, y, H * 0.035, '#9fe0ff');
    }
  }
  // Polku jatkuu kaistan reunojen yli, ettei reunaviiva piirry saumaan
  b.beginPath();
  b.moveTo(-20, h + 20);
  for (x = -16; x <= w + 16; x += 8) b.lineTo(x, shrFloorY(x, w, h));
  b.lineTo(w + 20, h + 20); b.closePath();
  artFillPath(b, sand, h - H * 0.18, h, H * 0.05, { lineColor: line });
  // Pikkukivet ja simpukat
  for (i = 0; i < 26; i++) {
    x = w * (i + shrHash(i + 80)) / 26;
    y = shrFloorY(x, w, h) + H * (0.03 + shrHash(i + 81) * 0.08);
    if (kind === 'cave') artBlob(b, x, y, H * 0.012, H * 0.007, '#6a70a8', { line: false });
    else if (i % 4 === 0) drawDeepStarfish(b, x, y, H * 0.016, ['#ff8f6a', '#ffb04f', '#ff8fc8'][i % 3], i);
    else artBlob(b, x, y, H * 0.01, H * 0.006, kind === 'coral' ? '#e8b8a0' : '#d8c08a', { line: false });
  }
  return o.cv;
}
function shrDrawFan(b, x, y, s, col) {
  var i, a;
  b.beginPath();
  b.moveTo(x, y);
  b.arc(x, y - s * 0.55, s * 0.55, Math.PI * 0.95, Math.PI * 2.05);
  b.closePath();
  artFillPath(b, col, y - s * 1.1, y, s * 0.5, {});
  b.strokeStyle = artShade(col, -0.3);
  b.lineWidth = Math.max(1, s * 0.03);
  for (i = 0; i < 6; i++) {
    a = Math.PI * (1.05 + i * 0.18);
    b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(a) * s * 0.95, y - s * 0.55 + Math.sin(a) * s * 0.5); b.stroke();
  }
}
function shrCrystalShape(b, x, y, s, col) {
  b.beginPath();
  b.moveTo(x - s * 0.4, y); b.lineTo(x - s * 0.3, y - s * 0.9); b.lineTo(x, y - s * 1.4); b.lineTo(x + s * 0.3, y - s * 0.9); b.lineTo(x + s * 0.4, y);
  b.closePath();
  artFillPath(b, col, y - s * 1.4, y, s * 0.4, { lineColor: artShade(col, -0.45) });
  b.fillStyle = 'rgba(255,255,255,0.5)';
  b.beginPath(); b.moveTo(x - s * 0.15, y - s * 0.2); b.lineTo(x - s * 0.1, y - s * 0.9); b.lineTo(x, y - s * 1.2); b.closePath(); b.fill();
}
function shrRenderCeil(w, h) {
  var o = shrCanvas(w, h), b = o.b, H = viewH, x, i, s, y;
  b.beginPath();
  b.moveTo(-20, -20);
  for (x = -16; x <= w + 16; x += 8) b.lineTo(x, H * (0.17 + 0.03 * shrWave(x, w, 5) + 0.015 * shrWave(x, w, 13, 2)));
  b.lineTo(w + 20, -20); b.closePath();
  artFillPath(b, '#4a4f82', 0, H * 0.2, H * 0.05, { lineColor: '#2a2c58' });
  for (i = 0; i < 10; i++) {
    x = w * (i + 0.2 + shrHash(i + 90) * 0.6) / 10;
    y = H * (0.17 + 0.03 * shrWave(x, w, 5) + 0.015 * shrWave(x, w, 13, 2)) - H * 0.01;
    s = H * (0.04 + shrHash(i + 91) * 0.06);
    b.beginPath(); b.moveTo(x - s * 0.3, y); b.lineTo(x, y + s); b.lineTo(x + s * 0.3, y); b.closePath();
    artFillPath(b, '#5a5f96', y, y + s, s * 0.3, { lineColor: '#2a2c58' });
  }
  return o.cv;
}
// Korallikaari: kaari, jonka aukon läpi voi uida (taustaa)
function shrRenderArch(w, h) {
  var o = shrCanvas(w, h), b = o.b, i, a, x, y, cols = ['#ffb0c8', '#ffd27a', '#c8a8ff'];
  b.beginPath();
  b.moveTo(w * 0.02, h);
  b.lineTo(w * 0.04, h * 0.5);
  b.bezierCurveTo(w * 0.06, h * 0.02, w * 0.94, h * 0.02, w * 0.96, h * 0.5);
  b.lineTo(w * 0.98, h);
  b.lineTo(w * 0.76, h);
  b.lineTo(w * 0.74, h * 0.55);
  b.bezierCurveTo(w * 0.72, h * 0.28, w * 0.28, h * 0.28, w * 0.26, h * 0.55);
  b.lineTo(w * 0.24, h);
  b.closePath();
  var g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff9fb0');
  g.addColorStop(1, '#e0607a');
  b.fillStyle = g;
  b.fill();
  b.strokeStyle = '#a83a52';
  b.lineWidth = Math.max(2, h * 0.012);
  b.lineJoin = 'round';
  b.stroke();
  // Polyypit kaaren pinnalla
  for (i = 0; i < 22; i++) {
    a = i / 21;
    x = w * (0.08 + a * 0.84);
    y = h * (0.5 - Math.sin(a * Math.PI) * 0.36) + (i % 2) * h * 0.06;
    artCircle(b, x, y, h * (0.022 + (i % 3) * 0.008), cols[i % 3], { hi: 0.4 });
  }
  for (i = 0; i < 4; i++) drawCoral(b, w * (0.18 + i * 0.22), h * (0.16 + Math.abs(i - 1.5) * 0.08), h * 0.06, ['#ffb04f', '#c88aff', '#7fd8c8', '#ff7a8a'][i], false);
  drawDeepStarfish(b, w * 0.12, h * 0.8, h * 0.035, '#ffb04f', 1);
  drawDeepStarfish(b, w * 0.88, h * 0.7, h * 0.03, '#ff8fc8', 2);
  return o.cv;
}
// Luolan suu: kalliot katosta ja pohjasta
function shrRenderMouth(w, h) {
  var o = shrCanvas(w, h), b = o.b, x;
  b.beginPath();
  b.moveTo(0, 0); b.lineTo(w, 0);
  for (x = w; x >= 0; x -= 10) b.lineTo(x, h * (0.18 + 0.03 * Math.sin(x * 0.05)) + h * 0.12 * (1 - Math.abs(x / w - 0.5) * 2));
  b.closePath();
  artFillPath(b, '#4a5288', 0, h * 0.35, h * 0.1, { lineColor: '#2a2c58' });
  b.beginPath();
  b.moveTo(0, h); b.lineTo(w, h);
  for (x = w; x >= 0; x -= 10) b.lineTo(x, h * (0.84 + 0.03 * Math.sin(x * 0.06)) - h * 0.1 * (1 - Math.abs(x / w - 0.5) * 2));
  b.closePath();
  artFillPath(b, '#4a5288', h * 0.7, h, h * 0.1, { lineColor: '#2a2c58' });
  b.fillStyle = 'rgba(120,200,120,0.6)';
  for (x = 0; x < 6; x++) { b.beginPath(); b.ellipse(w * (0.15 + x * 0.14), h * (0.27 + (x % 2) * 0.04), h * 0.025, h * 0.01, 0.3, 0, Math.PI * 2); b.fill(); }
  return o.cv;
}
// Kalojen koti: korallitalo (ikkunat ja ovi piirretään päälle joka ruudulla)
function shrRenderHouse(w, h) {
  var o = shrCanvas(w, h), b = o.b, i;
  b.beginPath();
  b.moveTo(w * 0.1, h);
  b.bezierCurveTo(w * 0.02, h * 0.5, w * 0.12, h * 0.12, w * 0.5, h * 0.1);
  b.bezierCurveTo(w * 0.88, h * 0.12, w * 0.98, h * 0.5, w * 0.9, h);
  b.closePath();
  artFillPath(b, '#ff9f8a', h * 0.1, h, w * 0.4, { lineColor: '#a8483a' });
  for (i = 0; i < 18; i++) artCircle(b, w * (0.14 + shrHash(i + 200) * 0.72), h * (0.2 + shrHash(i + 201) * 0.7), h * (0.012 + shrHash(i + 202) * 0.012), '#ffc8b8', { line: false });
  drawCoral(b, w * 0.12, h * 0.98, h * 0.12, '#c88aff', false);
  drawCoral(b, w * 0.88, h * 0.98, h * 0.1, '#ffb04f', false);
  return o.cv;
}
function shrRenderPearl(r) {
  var o = shrCanvas(r * 6, r * 6), b = o.b;
  artGlow(b, r * 3, r * 3, r * 2.9, '#fff6ff', 0.55);
  artCircle(b, r * 3, r * 3, r, '#fdf3ff', { shadeTo: '#e0c8f0', lineColor: '#b89ad0', hi: 0.6 });
  return o.cv;
}
// Toistuva kaista maailman väliltä [ux0, ux1] (u); speed = parallaksi
function shrDrawStrip(c, cv, y, speed, ux0, ux1) {
  var tw = cv.width, off = camX * speed, x0 = Math.max(ux0 * viewH * speed, off), x1 = Math.min(ux1 * viewH * speed, off + viewW);
  var k, a, bnd;
  if (x1 <= x0) return;
  for (k = Math.floor(x0 / tw); k * tw < x1; k++) {
    a = Math.max(x0, k * tw);
    bnd = Math.min(x1, (k + 1) * tw);
    if (bnd - a < 1) continue;
    c.drawImage(cv, a - k * tw, 0, bnd - a, cv.height, Math.floor(a - off), y, bnd - a + 1, cv.height);
  }
}

// ---------- Piirto ----------
function drawSeahorse() {
  var c = ctx, S = shr.spr, H = viewH, i, dk, ex, g;
  if (!beginPlayWorld()) return;
  if (!shr.built) { endPlayWorld(); return; }
  shrPrepare();
  // Kaukainen kaista, valokeilat, vyöhykkeiden pohjat
  shrDrawStrip(c, S.far, H - S.far.height, 0.35, -1e4, 1e4);
  shrDrawRays(c);
  // Korallikaarien jalat jäävät hiekan alle
  for (i = 0; i < SHR_ARCHES.length; i++) shrDrawArch(c, SHR_ARCHES[i][0], SHR_ARCHES[i][1]);
  shrDrawStrip(c, S.kelp, H - S.kelp.height, 1, -1, SHR_Z2);
  shrDrawStrip(c, S.coral, H - S.coral.height, 1, SHR_Z2, SHR_Z3);
  shrDrawStrip(c, S.cave, H - S.cave.height, 1, SHR_Z3, SHR_LEN + 2);
  shrDrawStrip(c, S.ceil, 0, 1, SHR_Z3, SHR_LEN + 2);
  ex = shrSx(SHR_Z3);
  if (ex > -H && ex < viewW + H) c.drawImage(S.mouth, ex - S.mouth.width / 2, 0);
  shrDrawCurrents(c);
  shrDrawRocks(c);
  propsDraw(c);
  // Luolan pimeys: kaikki pelin oliot piirretään sen päälle hehkuen
  // Kristallin 3. tökkäys kirkastaa luolaa hetkeksi
  dk = SHR_DARK * (shr.lightT > 0 ? (shr.lightT < 1 ? 1 - shr.lightT * 0.6 : 0.4) : 1);
  if (ex < viewW) {
    var fx0 = ex - H * 0.35;
    if (fx0 < viewW && ex > 0) {
      g = c.createLinearGradient(fx0, 0, ex + H * 0.15, 0);
      g.addColorStop(0, 'rgba(10,22,52,0)');
      g.addColorStop(1, 'rgba(10,22,52,' + dk + ')');
      c.fillStyle = g;
      c.fillRect(Math.max(0, fx0), 0, ex + H * 0.15 - Math.max(0, fx0), H);
    }
    c.fillStyle = 'rgba(10,22,52,' + dk + ')';
    c.fillRect(Math.max(0, ex + H * 0.15), 0, viewW - Math.max(0, ex + H * 0.15), H);
  }
  shrDrawHouse(c);
  shrDrawLanterns(c);
  shrDrawPearls(c);
  shrDrawJellies(c);
  shrDrawFishAll(c);
  shrDrawTurtle(c);
  shrDrawRiderNow(c);
  shrDrawBubbles(c);
  drawParticlesLayer(c);
  shrDrawHint(c);
  endPlayWorld();
  shrDrawHud(c);
}
function shrDrawRays(c) {
  var cu = shr.cam + shrViewU() / 2, k = 1 - Math.min(1, Math.max(0, (cu - SHR_Z3 + 0.3) / 1.2)), i, x, w = viewW, h = viewH;
  if (k <= 0) return;
  c.fillStyle = shr.spr.rayGrad;
  for (i = 0; i < 5; i++) {
    x = w * (0.1 + i * 0.21) - (camX * 0.1) % (w * 0.21) + Math.sin(shr.t * 0.3 + i) * w * 0.02;
    c.globalAlpha = k * (0.7 + Math.sin(shr.t * 0.7 + i * 1.7) * 0.3);
    c.beginPath();
    c.moveTo(x - w * 0.03, 0); c.lineTo(x + w * 0.03, 0);
    c.lineTo(x + w * 0.11, h * 0.85); c.lineTo(x - w * 0.01, h * 0.85);
    c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
}
function shrDrawArch(c, u, s) {
  var cv = shr.spr.arch, w = cv.width * s, h = cv.height * s, x = shrSx(u);
  if (x < -w || x > viewW + w) return;
  c.drawImage(cv, x - w / 2, viewH * 0.9 - h, w, h);
}
function shrDrawCurrents(c) {
  var i, cr, x0, x1, y0, y1, j, k, bx, by, len, H = viewH, a, ax, ay, n;
  for (i = 0; i < SHR_CURRENTS.length; i++) {
    cr = SHR_CURRENTS[i];
    x0 = shrSx(cr[0]); x1 = shrSx(cr[1]); y0 = cr[2] * H; y1 = cr[3] * H;
    if (x1 < -20 || x0 > viewW + 20) continue;
    c.fillStyle = 'rgba(220,250,255,0.08)';
    roundRect(c, x0, y0, x1 - x0, y1 - y0, H * 0.04);
    c.fill();
    len = cr[4] ? x1 - x0 : y1 - y0;
    // Kuplat virtaavat suuntaan
    n = Math.round(len / (H * 0.05)) + 3;
    for (j = 0; j < n; j++) {
      k = (shr.t * 0.35 + shrHash(j + i * 31)) % 1;
      if (cr[4]) { bx = x0 + k * len; by = y0 + (y1 - y0) * (0.15 + shrHash(j + 7 + i) * 0.7) + Math.sin(shr.t * 3 + j) * H * 0.006; }
      else { by = cr[5] < 0 ? y1 - k * len : y0 + k * len; bx = x0 + (x1 - x0) * (0.15 + shrHash(j + 7 + i) * 0.7) + Math.sin(shr.t * 3 + j) * H * 0.006; }
      a = Math.sin(k * Math.PI);
      c.globalAlpha = a * 0.8;
      c.strokeStyle = '#ffffff';
      c.lineWidth = Math.max(1, H * 0.003);
      c.beginPath(); c.arc(bx, by, H * (0.006 + shrHash(j) * 0.006), 0, Math.PI * 2); c.stroke();
    }
    // Nuolikuvio
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, H * 0.007);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (j = 0; j < 3; j++) {
      k = (shr.t * 0.5 + j / 3) % 1;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.55;
      if (cr[4]) { ax = x0 + len * (0.1 + k * 0.8); ay = (y0 + y1) / 2; }
      else { ay = cr[5] < 0 ? y1 - len * (0.1 + k * 0.8) : y0 + len * (0.1 + k * 0.8); ax = (x0 + x1) / 2; }
      c.beginPath();
      if (cr[4]) { c.moveTo(ax - H * 0.02, ay - H * 0.025); c.lineTo(ax + H * 0.005, ay); c.lineTo(ax - H * 0.02, ay + H * 0.025); }
      else { var d = cr[5]; c.moveTo(ax - H * 0.025, ay - d * H * 0.02); c.lineTo(ax, ay + d * H * 0.005); c.lineTo(ax + H * 0.025, ay - d * H * 0.02); }
      c.stroke();
    }
    c.globalAlpha = 1;
  }
}
// Kivet, joilla eksyneet kalat odottavat (korkealla kelluva levakivi)
function shrDrawRocks(c) {
  var i, n = SHR_FISH.length + SHR_ROCKS.length, r, x, y, H = viewH, cave;
  for (i = 0; i < n; i++) {
    r = i < SHR_FISH.length ? SHR_FISH[i] : SHR_ROCKS[i - SHR_FISH.length];
    x = shrSx(r[0]); y = (r[1] + 0.045) * H;
    if (x < -H * 0.1 || x > viewW + H * 0.1) continue;
    cave = r[0] > SHR_Z3;
    if (r[1] > 0.6) {
      artBlob(c, x, y + H * 0.02, H * 0.05, H * 0.03, cave ? '#7a80b8' : '#b8b0a0', { hi: 0.3 });
      if (!cave) artBlob(c, x - H * 0.02, y + H * 0.0, H * 0.018, H * 0.008, '#8fd47a', { line: false });
    } else {
      c.strokeStyle = cave ? '#6a9a8a' : '#3fae78';
      c.lineWidth = Math.max(2, H * 0.006);
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - H * 0.025, y + H * 0.01); c.quadraticCurveTo(x - H * 0.035, y + H * 0.06, x - H * 0.02 + Math.sin(shr.t + i) * H * 0.01, y + H * 0.09); c.stroke();
      c.beginPath(); c.moveTo(x + H * 0.02, y + H * 0.01); c.quadraticCurveTo(x + H * 0.03, y + H * 0.05, x + H * 0.015 + Math.sin(shr.t * 1.2 + i) * H * 0.01, y + H * 0.07); c.stroke();
      artBlob(c, x, y, H * 0.045, H * 0.022, cave ? '#7a80b8' : '#a8b8b0', { hi: 0.3 });
    }
  }
}
function shrDrawHouse(c) {
  var cv = shr.spr.house, hp = shrHousePos(), x = shrSx(hp.x), H = viewH, i, w, wx, wy, r, k, pulse, party = shr.state !== 'swim';
  if (x < -cv.width || x > viewW + cv.width) return;
  // Koti hehkuu lämpimänä luolan hämärässä
  artGlow(c, x, H * 0.55, H * 0.62, '#ffd8a8', party ? 0.55 : 0.32);
  // Vuokkolonkerot katolla aaltoilevat
  c.lineCap = 'round';
  for (i = 0; i < 9; i++) {
    k = (i - 4) / 4;
    var bx = x + k * cv.width * 0.3, by = H * 0.92 - cv.height * 0.95 + Math.abs(k) * H * 0.06;
    var sw = Math.sin(shr.t * 1.8 + i) * H * 0.02 * (party ? 2 : 1);
    artLimb(c, bx, by, bx + k * H * 0.05 + sw, by - H * 0.09, H * 0.022, i % 2 ? '#ff8fc8' : '#c88aff', '#8a3a7a');
    artCircle(c, bx + k * H * 0.05 + sw, by - H * 0.09, H * 0.014, '#ffe0f0', { line: false });
  }
  c.drawImage(cv, x - cv.width / 2, H * 0.92 - cv.height);
  r = H * 0.038;
  for (i = 0; i < 12; i++) {
    w = shrWindowPos(i);
    wx = shrSx(w.x); wy = w.y * H;
    if (shr.windows[i]) {
      if (party) artGlow(c, wx, wy, r * 2.4, '#fff3b8', 0.5);
      artCircle(c, wx, wy, r, '#fff3b8', { lineColor: '#a8483a' });
      drawDeepFish(c, wx + Math.sin(shr.t * 2 + i) * r * 0.15, wy, r * 0.5, shr.windows[i], (i % 2) ? 1 : -1, shr.t * 6 + i);
    } else {
      artCircle(c, wx, wy, r, '#5a3a5a', { lineColor: '#a8483a', flat: true });
    }
  }
  // Simpukkaovi: sykkii, kun parvi on tuotu mutta joku puuttuu
  var dr = shrHouseDoor(), dx = shrSx(dr.x), dy = H * 0.82, ds = H * 0.075;
  pulse = shr.state === 'swim' && shr.home > 0 && shr.school.length === 0 && shr.flying.length === 0 && Math.hypot(shr.x - hp.x, shr.y - hp.y) < 1.1;
  k = pulse ? 1 + Math.sin(shr.t * 6) * 0.08 : 1;
  if (pulse) artGlow(c, dx, dy - ds * 0.4, ds * 2.2, '#ffe27a', 0.45 + Math.sin(shr.t * 6) * 0.15);
  c.save();
  c.translate(dx, dy);
  c.scale(k, k);
  c.beginPath();
  c.moveTo(-ds, 0);
  c.arc(0, 0, ds, Math.PI, 0);
  c.closePath();
  artFillPath(c, '#ffd8a8', -ds, 0, ds, { lineColor: '#a8683a' });
  c.strokeStyle = '#c8885a';
  c.lineWidth = Math.max(1, ds * 0.05);
  for (i = 0; i < 5; i++) {
    var a = Math.PI * (1.1 + i * 0.2);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * ds * 0.9, Math.sin(a) * ds * 0.9); c.stroke();
  }
  c.restore();
}
function shrDrawLanterns(c) {
  var i, x, y, H = viewH, base = [9.1, 10.2, 11.0], sx, ph;
  for (i = 0; i < 3; i++) {
    ph = i * 2.1;
    x = base[i] + Math.sin(shr.t * 0.18 + ph) * 0.45;
    y = 0.38 + i * 0.12 + Math.sin(shr.t * 0.5 + ph) * 0.06;
    sx = shrSx(x);
    if (sx < -H * 0.3 || sx > viewW + H * 0.3) continue;
    var dir = Math.cos(shr.t * 0.18 + ph) > 0 ? 1 : -1;
    artGlow(c, sx + dir * H * 0.05, y * H - H * 0.035, H * 0.16, '#bff4ff', 0.3);
    drawDeepFish(c, sx, y * H, H * 0.022, '#3a4a7a', dir, shr.t * 5 + i);
    c.strokeStyle = '#3a4a7a';
    c.lineWidth = Math.max(1, H * 0.003);
    c.beginPath(); c.moveTo(sx + dir * H * 0.01, y * H - H * 0.012); c.quadraticCurveTo(sx + dir * H * 0.03, y * H - H * 0.05, sx + dir * H * 0.05, y * H - H * 0.035); c.stroke();
    artCircle(c, sx + dir * H * 0.05, y * H - H * 0.035, H * 0.008, '#eaffff', { line: false });
  }
}
function shrDrawPearls(c) {
  var i, p, x, y, cv = shr.spr.pearl, s;
  for (i = 0; i < shr.pearls.length; i++) {
    p = shr.pearls[i];
    if (p.got) continue;
    x = shrSx(p.x);
    if (x < -40 || x > viewW + 40) continue;
    y = p.y * viewH + Math.sin(shr.t * 2 + p.ph) * viewH * 0.006;
    s = p.born !== undefined && p.born < 0.4 ? easeOutBack(p.born / 0.4) : 1;
    c.drawImage(cv, x - cv.width / 2 * s, y - cv.height / 2 * s, cv.width * s, cv.height * s);
  }
}
function shrDrawJellies(c) {
  var i, j, p, x, y, r = viewH * 0.042, sq, k, col, cave;
  for (i = 0; i < shr.jellies.length; i++) {
    j = shr.jellies[i];
    p = shrJellyPos(j);
    x = shrSx(p.x); y = p.y * viewH;
    if (x < -r * 3 || x > viewW + r * 3) continue;
    cave = !!j.glow;
    col = cave ? '#9ff0ff' : '#c8a8ff';
    sq = j.squish > 0 ? Math.sin(j.squish * 20) * 0.15 : Math.sin(shr.t * 3 + i) * 0.06;
    if (cave) artGlow(c, x, y, r * 3, '#9ff0ff', 0.35);
    // Lonkerot
    c.strokeStyle = artRGBA(artShade(col, -0.2), 0.8);
    c.lineWidth = Math.max(1.5, r * 0.08);
    c.lineCap = 'round';
    for (k = -1.5; k <= 1.5; k += 1) {
      c.beginPath();
      c.moveTo(x + k * r * 0.4, y + r * 0.1);
      c.quadraticCurveTo(x + k * r * 0.45 + Math.sin(shr.t * 4 + k + i) * r * 0.3, y + r * 0.8, x + k * r * 0.35 + Math.sin(shr.t * 3 + k * 2) * r * 0.25, y + r * 1.5);
      c.stroke();
    }
    c.save();
    c.translate(x, y);
    c.scale(1 + sq, 1 - sq);
    c.globalAlpha = 0.88;
    c.beginPath();
    c.arc(0, 0, r, Math.PI, 0);
    c.quadraticCurveTo(r * 0.5, r * 0.3, 0, r * 0.18);
    c.quadraticCurveTo(-r * 0.5, r * 0.3, -r, 0);
    c.closePath();
    artFillPath(c, col, -r, r * 0.2, r, { lineColor: artShade(col, -0.4) });
    c.globalAlpha = 1;
    artHighlight(c, -r * 0.4, -r * 0.55, r * 0.25, r * 0.14, 0.5);
    artEye(c, -r * 0.3, -r * 0.25, r * 0.12, 0, (shr.t + i) % 3.7 < 0.12);
    artEye(c, r * 0.3, -r * 0.25, r * 0.12, 0, (shr.t + i) % 3.7 < 0.12);
    c.strokeStyle = '#8a3a7a';
    c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath(); c.arc(0, -r * 0.08, r * 0.12, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
  }
}
function shrDrawFishAll(c) {
  var i, f, x, y, s = viewH * 0.027, bob, cave;
  for (i = 0; i < shr.fish.length; i++) {
    f = shr.fish[i];
    if (f.state === 'home') continue;
    x = shrSx(f.x);
    if (x < -s * 4 || x > viewW + s * 4) continue;
    bob = f.state === 'wait' ? Math.sin(shr.t * 2 + f.ph) * viewH * 0.006 : 0;
    y = f.y * viewH + bob;
    cave = f.x > SHR_Z3 - 0.2;
    if (f.state === 'wait' || f.state === 'flee') {
      if (cave) artGlow(c, x, y, s * 4, f.col, 0.3);
      // Surullinen odottaja: kuplahuokaus ja pieni hyppy, kun merihevonen lähestyy
      if (f.state === 'wait') {
        var near = Math.hypot(f.x - shr.x, f.y - shr.y) < 0.6;
        if (near) y -= Math.abs(Math.sin(shr.t * 6 + f.ph)) * viewH * 0.012;
        var bk = (shr.t * 0.5 + f.ph) % 1;
        drawDeepBubble(c, x + f.dir * s * 0.8, y - s - bk * s * 3, s * 0.25, 1 - bk);
      }
      drawDeepFish(c, x, y, s, f.col, f.dir, f.ph);
      if (f.state === 'wait') shrFishBrow(c, x, y, s, f.dir);
    } else {
      if (cave) artGlow(c, x, y, s * 3, f.col, 0.25);
      var sc = f.pop > 0 ? 1 + Math.sin((0.5 - f.pop) / 0.5 * Math.PI) * 0.4 : 1;
      drawDeepFish(c, x, y, s * sc, f.col, f.dir, f.ph);
    }
  }
}
// Surulliset kulmat eksyneelle kalalle
function shrFishBrow(c, x, y, s, dir) {
  c.strokeStyle = '#3a3a5a';
  c.lineWidth = Math.max(1, s * 0.1);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x + dir * s * 0.3, y - s * 0.42);
  c.lineTo(x + dir * s * 0.62, y - s * 0.3);
  c.stroke();
}
function shrDrawTurtle(c) {
  var tt = shr.turtle, x = shrSx(tt.x), y = tt.y * viewH, s = viewH * 0.05, sw, H = viewH, k, open;
  if (x < -s * 4 || x > viewW + s * 4) return;
  sw = tt.state === 'sleep' ? 0 : Math.sin(tt.t * 4);
  if (tt.state === 'home' || shr.state === 'party') y += Math.sin(shr.t * 2) * H * 0.008;
  c.save();
  c.translate(x, y);
  c.scale(tt.dir, 1);
  // Räpylät
  artBlob(c, s * 0.7, s * 0.35 + sw * s * 0.15, s * 0.45, s * 0.16, '#8fd47a', { rot: 0.5 + sw * 0.3, lineColor: '#3a7a3a' });
  artBlob(c, -s * 0.75, s * 0.35 - sw * s * 0.1, s * 0.32, s * 0.13, '#8fd47a', { rot: -0.4 - sw * 0.2, lineColor: '#3a7a3a' });
  // Pää
  open = tt.state !== 'sleep';
  artCircle(c, s * 1.15, s * 0.05 + (open ? 0 : s * 0.15), s * 0.3, '#a8e08a', { lineColor: '#3a7a3a' });
  if (open) {
    artEye(c, s * 1.25, -s * 0.03, s * 0.08, 0.4, (tt.t % 3.5) < 0.12 || tt.state === 'wake' && tt.t < 0.5);
    c.strokeStyle = '#3a6a3a';
    c.lineWidth = Math.max(1, s * 0.04);
    c.beginPath(); c.arc(s * 1.25, s * 0.1, s * 0.1, 0.2, Math.PI - 0.6); c.stroke();
    if (tt.ph > 0) artBlush(c, s * 1.1, s * 0.12, s * 0.07);
  } else {
    c.strokeStyle = '#3a6a3a';
    c.lineWidth = Math.max(1, s * 0.04);
    c.beginPath(); c.arc(s * 1.25, s * 0.15, s * 0.06, 0.1, Math.PI - 0.1); c.stroke();
  }
  // Kilpi
  c.beginPath();
  c.arc(0, s * 0.3, s, Math.PI, 0);
  c.closePath();
  artFillPath(c, '#5fb86a', -s * 0.7, s * 0.3, s, { lineColor: '#2f6a3a' });
  c.strokeStyle = '#3f8a4a';
  c.lineWidth = Math.max(1, s * 0.05);
  for (k = -1; k <= 1; k++) { c.beginPath(); c.arc(k * s * 0.45, s * 0.05, s * 0.22, 0, Math.PI * 2); c.stroke(); }
  c.restore();
  // Unikuplat
  if (tt.state === 'sleep') {
    for (k = 0; k < 3; k++) {
      var bk = (shr.t * 0.4 + k / 3) % 1;
      drawDeepBubble(c, x + s * 1.2 + Math.sin(bk * 6) * s * 0.2, y - s * 0.3 - bk * s * 2, s * (0.1 + bk * 0.15), 1 - bk);
    }
  }
}
function shrDrawRiderNow(c) {
  var x = shrSx(shr.x), y = shr.y * viewH, s = viewH * 0.075, cave = shr.x > SHR_Z3 - 0.3, bob, tilt, vm = shrVmax(), i, a;
  bob = Math.sin(shr.t * 2) * viewH * 0.006;
  tilt = Math.max(-0.3, Math.min(0.3, shr.vy / vm * 0.25)) * shr.facing;
  if (shr.hitT > 0) tilt += Math.sin(shr.hitT * 25) * 0.25;
  if (cave) artGlow(c, x, y, viewH * 0.24, '#d8f8ff', 0.28);
  if (shr.invT > 0 && shr.hitT <= 0 && Math.sin(shr.t * 20) > 0.3) c.globalAlpha = 0.6;
  c.save();
  c.translate(x, y + bob);
  c.rotate(tilt);
  shrDrawSeahorseBody(c, 0, 0, s, shr.facing, shr.swimPh, true);
  c.restore();
  c.globalAlpha = 1;
  // Pyörrytähdet osuman jälkeen
  if (shr.hitT > 0) {
    for (i = 0; i < 3; i++) {
      a = shr.t * 8 + i * 2.1;
      drawStar(c, x + Math.cos(a) * s * 0.5, y - s * 1.6 + Math.sin(a) * s * 0.15, s * 0.14, a, 0.5);
    }
  }
}
// Merihevonen (ja halutessa prinsessa selässä). Origo vartalon keskellä, s = mittayksikkö.
function shrDrawSeahorseBody(c, x, y, s, facing, ph, rider) {
  var col = '#4fc8c0', dark = '#2a7a78', belly = '#bff0e0', fin = Math.sin(ph * 2) * 0.25, i;
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  // Kiertyvä häntä
  c.lineCap = 'round';
  c.strokeStyle = dark;
  c.lineWidth = s * 0.32;
  c.beginPath(); c.moveTo(-s * 0.05, s * 0.3); c.bezierCurveTo(-s * 0.2, s * 0.85, s * 0.05, s * 1.2, s * 0.32, s * 1.05); c.stroke();
  c.lineWidth = s * 0.22;
  c.beginPath(); c.moveTo(s * 0.3, s * 1.06); c.quadraticCurveTo(s * 0.5, s * 0.82, s * 0.3, s * 0.78); c.stroke();
  c.strokeStyle = col;
  c.lineWidth = s * 0.24;
  c.beginPath(); c.moveTo(-s * 0.05, s * 0.3); c.bezierCurveTo(-s * 0.2, s * 0.85, s * 0.05, s * 1.2, s * 0.32, s * 1.05); c.stroke();
  c.lineWidth = s * 0.14;
  c.beginPath(); c.moveTo(s * 0.3, s * 1.06); c.quadraticCurveTo(s * 0.5, s * 0.82, s * 0.3, s * 0.78); c.stroke();
  // Selkäevä lepattaa
  c.save();
  c.translate(-s * 0.36, s * 0.05);
  c.rotate(-0.3 + fin);
  artBlob(c, -s * 0.12, 0, s * 0.22, s * 0.12, '#bff4ff', { lineColor: dark, alpha: 0.9 });
  c.restore();
  // Vartalo ja vatsa
  artBlob(c, 0, 0, s * 0.36, s * 0.55, col, { rot: -0.2, lineColor: dark, hi: 0.3 });
  artBlob(c, s * 0.14, s * 0.06, s * 0.17, s * 0.4, belly, { rot: -0.25, lineColor: dark });
  c.strokeStyle = artRGBA(dark, 0.5);
  c.lineWidth = Math.max(1, s * 0.03);
  for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(s * 0.02, -s * 0.2 + i * s * 0.14); c.lineTo(s * 0.26, -s * 0.24 + i * s * 0.14); c.stroke(); }
  // Pää ja kuono
  artLimb(c, s * 0.25, -s * 0.66, s * 0.72, -s * 0.52, s * 0.15, col, dark);
  artBlob(c, s * 0.1, -s * 0.68, s * 0.3, s * 0.25, col, { rot: 0.35, lineColor: dark, hi: 0.3 });
  // Harjapiikit
  for (i = 0; i < 3; i++) artBlob(c, -s * 0.12 - i * s * 0.04, -s * (0.9 - i * 0.16), s * 0.08, s * 0.05, '#ff9fc8', { rot: -0.6, lineColor: '#a83a72' });
  artEye(c, s * 0.18, -s * 0.73, s * 0.085, 0.4, (ph * 0.3 % 4.3) < 0.1);
  artBlush(c, s * 0.3, -s * 0.6, s * 0.06);
  if (rider) {
    drawRiderPrincess(c, -s * 0.1, -s * 0.14, s * 0.028, shr.t, Math.hypot(shr.vx, shr.vy) > 0.05);
    // Ohjakset
    c.strokeStyle = '#ffd24f';
    c.lineWidth = Math.max(1, s * 0.025);
    c.beginPath(); c.moveTo(s * 0.4, -s * 0.6); c.quadraticCurveTo(s * 0.35, -s * 0.5, s * 0.42, -s * 0.6); c.lineTo(s * 0.43, -s * 0.57); c.stroke();
  }
  c.restore();
}
function shrDrawBubbles(c) {
  var i, b, x, y, H = viewH;
  for (i = 0; i < shr.bubbles.length; i++) {
    b = shr.bubbles[i];
    y = ((b.y - shr.t * b.v) % 1 + 1) % 1;
    x = ((b.x * viewW * 1.3 - camX * b.par) % (viewW * 1.3) + viewW * 1.3) % (viewW * 1.3) - viewW * 0.15;
    drawDeepBubble(c, x + Math.sin(shr.t + i) * H * 0.01, y * H, b.s * H, 0.6);
  }
}
// Alkuvihje: käsi painaa merihevosen kohdalla ja liukuu eteenpäin
function shrDrawHint(c) {
  var k, x, y, H = viewH;
  if (shr.everHeld || shr.t > 30 || introT > 0) return;
  k = (shr.t % 2.4) / 2.4;
  x = shrSx(shr.x) + H * 0.05 + easeInOutSine(Math.min(1, k * 1.4)) * H * 0.45;
  y = shr.y * H + H * 0.04;
  c.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2);
  artCircle(c, x, y - H * 0.01, H * 0.025, '#ffffff', { line: false, alpha: 0.5 });
  drawHand(c, x + H * 0.015, y, H * 0.06);
  c.globalAlpha = 1;
}
// Puuttuva kala: kultainen nuoli talolta
function shrNearestWaiting() {
  var i, f, best = null, bd = 1e9, d;
  for (i = 0; i < shr.fish.length; i++) {
    f = shr.fish[i];
    if (f.state !== 'wait' && f.state !== 'flee') continue;
    d = Math.abs(f.x - shr.x);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}
function shrDrawHud(c) {
  var H = viewH, x0 = hudX(), y = H * 0.06, i, f, x, s = H * 0.016, st, cols = [], sc, nw;
  for (i = 0; i < shr.fish.length; i++) {
    f = shr.fish[i];
    if (f.state === 'home') cols.push({ c: f.col, home: true });
    else if (f.state === 'school' || f.state === 'fly') cols.push({ c: f.col, home: false });
  }
  sc = shr.hudBump > 0 ? 1 + Math.sin(shr.hudBump / 0.4 * Math.PI) * 0.15 : 1;
  c.fillStyle = 'rgba(255,255,255,0.55)';
  roundRect(c, x0 - s, y - s * 1.6, s * 3.1 * SHR_FISH.length + s * 0.6, s * 3.2, s * 1.4);
  c.fill();
  for (i = 0; i < SHR_FISH.length; i++) {
    x = x0 + s * 1.2 + i * s * 3.1;
    st = cols[i];
    if (st) {
      if (st.home) artGlow(c, x, y, s * 2, '#fff3b8', 0.7);
      drawDeepFish(c, x, y, s * sc, st.c, 1, shr.t * 6 + i);
    } else {
      c.globalAlpha = 0.35;
      drawDeepFish(c, x, y, s, '#6a7a9a', 1, 0);
      c.globalAlpha = 1;
    }
  }
  // Helmet
  nw = shr.pearlBump > 0 ? 1 + Math.sin(shr.pearlBump / 0.35 * Math.PI) * 0.25 : 1;
  y = H * 0.125;
  c.fillStyle = 'rgba(255,255,255,0.55)';
  roundRect(c, x0 - s, y - s * 1.5, s * 7, s * 3, s * 1.4);
  c.fill();
  drawDeepPearl(c, x0 + s * 0.9, y, s * 0.9 * nw, 1);
  c.fillStyle = '#5a3a7a';
  c.font = 'bold ' + Math.round(H * 0.034) + 'px ' + UI_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(String(shr.got), x0 + s * 2.4, y + H * 0.002);
  // Talolla, mutta joku puuttuu: kultainen nuoli puuttuvan suuntaan
  var hp = shrHousePos();
  if (shr.state === 'swim' && shr.home > 0 && Math.abs(shr.x - hp.x) < 1.6) {
    f = shrNearestWaiting();
    if (f) drawEdgeArrow(c, f.x * viewH);
  }
}

// ---------- Koristeiden piirrot (origo = jalkojen kohta) ----------
function shrDrawClam(c, p) {
  var H = viewH, s = H * 0.05, open = p.t >= 0 ? Math.sin(Math.min(1, p.t / 0.7) * Math.PI) * 0.6 : 0.05;
  c.beginPath(); c.arc(0, -s * 0.2, s, 0, Math.PI); c.closePath();
  artFillPath(c, '#ffc8e0', -s * 0.2, s * 0.8, s, { lineColor: '#b0608a' });
  if (open > 0.1) drawDeepPearl(c, 0, -s * 0.35, s * 0.25, open);
  c.save();
  c.translate(-s, -s * 0.2);
  c.rotate(-open);
  c.beginPath(); c.arc(s, 0, s, Math.PI, 0); c.closePath();
  artFillPath(c, '#ffd8ec', -s, 0, s, { lineColor: '#b0608a' });
  c.strokeStyle = '#d088aa';
  c.lineWidth = Math.max(1, s * 0.05);
  for (var i = 0; i < 4; i++) { var a = Math.PI * (1.15 + i * 0.23); c.beginPath(); c.moveTo(s, 0); c.lineTo(s + Math.cos(a) * s * 0.9, Math.sin(a) * s * 0.9); c.stroke(); }
  c.restore();
}
function shrDrawStarfishProp(c, p) {
  var H = viewH, r = H * 0.04, hop = p.t >= 0 && p.n % 3 === 0 ? Math.sin(Math.min(1, p.t / 0.8) * Math.PI) * H * 0.08 : 0;
  c.save();
  c.translate(0, -r * 0.6 - hop);
  c.rotate(p.t >= 0 ? p.t * 6 : 0);
  drawDeepStarfish(c, 0, 0, r, '#ffb04f', 0);
  c.restore();
  artEye(c, -r * 0.2, -r * 0.7 - hop, r * 0.12, 0, false);
  artEye(c, r * 0.2, -r * 0.7 - hop, r * 0.12, 0, false);
}
function shrDrawSnail(c, p) {
  var H = viewH, s = H * 0.035, hide = p.t >= 0 && p.t < 0.9 ? 1 : 0, peek = p.t >= 0 && p.n % 3 === 0 && p.t > 0.9;
  if (!hide) {
    artBlob(c, s * 0.7, -s * 0.3, s * 0.8, s * 0.3, '#c8f0a0', { lineColor: '#5a8a3a' });
    artLimb(c, s * 1.3, -s * 0.5, s * 1.5, -s * 1.1, s * 0.12, '#c8f0a0', '#5a8a3a');
    artCircle(c, s * 1.5, -s * 1.15, s * 0.14, '#ffffff', { lineColor: '#5a8a3a' });
  }
  artCircle(c, 0, -s * 0.8, s * 0.75, '#ffb88a', { lineColor: '#a8603a', hi: 0.3 });
  c.strokeStyle = '#a8603a';
  c.lineWidth = Math.max(1, s * 0.08);
  c.beginPath(); c.arc(0, -s * 0.8, s * 0.4, 0, Math.PI * 1.6); c.stroke();
  if (peek) drawDeepBubble(c, s * 1.6, -s * 2 - (p.t - 0.9) * s * 2, s * 0.3, 1.4 - p.t);
}
function shrDrawHorn(c, p) {
  var H = viewH, s = H * 0.05;
  c.beginPath();
  c.moveTo(-s * 0.3, 0); c.quadraticCurveTo(-s * 0.4, -s * 1.2, s * 0.1, -s * 2.0);
  c.lineTo(s * 0.6, -s * 2.3); c.lineTo(s * 0.5, -s * 1.7);
  c.quadraticCurveTo(s * 0.2, -s * 1.0, s * 0.3, 0); c.closePath();
  artFillPath(c, '#ff9f7a', -s * 2.3, 0, s * 0.5, { lineColor: '#a84a2a' });
  artBlob(c, s * 0.55, -s * 2.0, s * 0.18, s * 0.32, '#ffd8b8', { rot: 0.5, lineColor: '#a84a2a' });
}
function shrDrawCrab(c, p) {
  var H = viewH, s = H * 0.03, dance = p.t >= 0 && p.n % 3 === 0 ? Math.sin(p.t * 12) * s * 0.6 : 0, snap = p.t >= 0 ? Math.abs(Math.sin(p.t * 14)) : 0;
  c.translate(dance, 0);
  for (var k = -1; k <= 1; k += 2) {
    artLimb(c, k * s * 0.7, -s * 0.5, k * s * 1.3, -s * 0.05, s * 0.2, '#ff6a4a', '#a83a2a');
    artLimb(c, k * s * 0.8, -s * 0.9, k * s * 1.3, -s * 1.5, s * 0.25, '#ff6a4a', '#a83a2a');
    artBlob(c, k * s * 1.35, -s * 1.7, s * 0.35, s * (0.25 + snap * 0.1), '#ff7a5a', { rot: k * 0.5, lineColor: '#a83a2a' });
  }
  artBlob(c, 0, -s * 0.7, s * 1.0, s * 0.6, '#ff7a5a', { lineColor: '#a83a2a', hi: 0.3 });
  artLimb(c, -s * 0.3, -s * 1.2, -s * 0.35, -s * 1.6, s * 0.1, '#ff7a5a', '#a83a2a');
  artLimb(c, s * 0.3, -s * 1.2, s * 0.35, -s * 1.6, s * 0.1, '#ff7a5a', '#a83a2a');
  artEye(c, -s * 0.35, -s * 1.65, s * 0.18, 0, false);
  artEye(c, s * 0.35, -s * 1.65, s * 0.18, 0, false);
}
function shrDrawAnemone(c, p) {
  var H = viewH, s = H * 0.05, shrink = p.t >= 0 ? Math.sin(Math.min(1, p.t / 1.2) * Math.PI) : 0, i, a, ex, peek;
  peek = p.t >= 0 ? Math.sin(Math.min(1, p.t / 1.3) * Math.PI) : 0;
  if (peek > 0) {
    ex = p.n % 5 === 0 ? Math.cos(p.t * 5) * s * 1.2 : s * 0.3;
    drawDeepFish(c, ex, -s * 1.3 - peek * s * 0.6, s * 0.35, '#ff8a3a', 1, p.t * 10);
  }
  c.lineCap = 'round';
  for (i = 0; i < 8; i++) {
    a = -Math.PI * (0.1 + i * 0.8 / 7) - Math.PI * 0.0;
    var len = s * (1.1 - shrink * 0.6);
    var tx = Math.cos(a) * len + Math.sin(shr.t * 2 + i) * s * 0.1, ty = -s * 0.5 + Math.sin(a) * len;
    artLimb(c, 0, -s * 0.5, tx, ty, s * 0.16, i % 2 ? '#ff8fc8' : '#ffb0d8', '#a83a72');
  }
  artBlob(c, 0, -s * 0.3, s * 0.55, s * 0.35, '#c85a9a', { lineColor: '#7a2a5a' });
}
function shrDrawCrystal(c, p) {
  var H = viewH, s = H * 0.05, gl = p.t >= 0 ? Math.sin(Math.min(1, p.t / 1.2) * Math.PI) : 0;
  artGlow(c, 0, -s * 0.8, s * (1.5 + gl * 1.5), '#bfe8ff', 0.35 + gl * 0.4);
  shrCrystalShape(c, -s * 0.4, 0, s * 0.6, '#a8d8ff');
  shrCrystalShape(c, s * 0.35, 0, s * 0.7, '#d8b8ff');
  shrCrystalShape(c, 0, 0, s, '#bff4ff');
}
function shrDrawOctoHole(c, p) {
  var H = viewH, s = H * 0.06, hide = p.t >= 0 && p.t < 0.8, wave = p.t >= 0 && p.n % 3 === 0 && p.t >= 0.8;
  artBlob(c, 0, -s * 0.5, s * 1.1, s * 0.7, '#5a5f96', { lineColor: '#2a2c58' });
  artBlob(c, 0, -s * 0.45, s * 0.6, s * 0.38, '#14183a', { line: false, flat: true });
  if (!hide) {
    artCircle(c, -s * 0.18, -s * 0.5, s * 0.1, '#ffffff', { line: false });
    artCircle(c, s * 0.18, -s * 0.5, s * 0.1, '#ffffff', { line: false });
    c.fillStyle = '#2a1a3a';
    c.beginPath(); c.arc(-s * 0.16, -s * 0.48, s * 0.05, 0, Math.PI * 2); c.arc(s * 0.2, -s * 0.48, s * 0.05, 0, Math.PI * 2); c.fill();
  }
  if (wave) {
    c.strokeStyle = '#c97ad8';
    c.lineWidth = s * 0.12;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(s * 0.45, -s * 0.3); c.quadraticCurveTo(s * 0.9, -s * 0.6 + Math.sin(p.t * 10) * s * 0.3, s * 1.0, -s * 1.0); c.stroke();
  }
}

HUB_ICONS.seahorse = function (c, x, y, s) {
  var r = s * 0.15;
  artCircle(c, x, y, r * 2.2, '#3a9ed0', { lineColor: '#1d5a88', flat: true });
  drawDeepBubble(c, x - r * 1.2, y - r * 1.0, r * 0.3, 1);
  drawDeepBubble(c, x - r * 1.5, y - r * 0.2, r * 0.2, 1);
  shrDrawSeahorseBody(c, x + r * 0.1, y - r * 0.1, r * 1.3, 1, 0, false);
};
