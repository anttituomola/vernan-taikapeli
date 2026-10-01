'use strict';

// Tähtisumu: kiireetön kuutamokenttä ilman sydämiä ja ilman liikkumista.
// Pilvet ajelehtivat tähtien päällä. Napauta pilveä puhaltaaksesi sen hetkeksi
// pois, ja napauta paljastunutta tähteä kerätäksesi sen. Kuusi tähteä.
// Tehtävät avautuvat keräilyn edetessä (käsin, kuten Kaivoksessa).

var STARS_COUNT = 6;
var nebStars = [];
var nebClouds = [];
var nebCollected = 0;

var nebStarDefs = [
  { fx: 0.16, fy: 0.30 }, { fx: 0.36, fy: 0.22 }, { fx: 0.55, fy: 0.34 },
  { fx: 0.74, fy: 0.24 }, { fx: 0.86, fy: 0.40 }, { fx: 0.45, fy: 0.46 }
];
var nebCloudDefs = [
  { fx: 0.26, fy: 0.28, amp: 0.07, f: 0.5 },
  { fx: 0.62, fy: 0.30, amp: 0.09, f: 0.4 },
  { fx: 0.82, fy: 0.36, amp: 0.06, f: 0.6 }
];
// Tökättävät koristeet maassa: kolme kidettä ja tähtikukka (osuudet ruudusta)
var starsPropDefs = [
  { fx: 0.12, fy: 0.90, kind: 'crystal', color: '#9fd8ff', note: 659 },
  { fx: 0.30, fy: 0.95, kind: 'crystal', color: '#d9a7ff', note: 784 },
  { fx: 0.88, fy: 0.92, kind: 'crystal', color: '#ffb3d9', note: 988 },
  { fx: 0.70, fy: 0.90, kind: 'flower', color: '#ffe27a', note: 880 }
];
// Yllätys: tähtikuvio (kruunu) syttyy taivaalle kiteen 5. tökkäyksestä
var STARS_CONST = [[0.30, 0.13], [0.35, 0.07], [0.40, 0.12], [0.45, 0.05], [0.50, 0.12], [0.55, 0.07], [0.60, 0.13], [0.58, 0.19], [0.32, 0.19]];
var starsConst = null;

function initStars() {
  var i;
  tasks = [makeTask(-5, 'matrix'), makeTask(-5, 'memory', { seqLen: 4, orbs: 4 })];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  nebStars = [];
  for (i = 0; i < STARS_COUNT; i++) {
    nebStars.push({
      x: nebStarDefs[i].fx * viewW, y: nebStarDefs[i].fy * viewH,
      collected: false, phase: Math.random() * Math.PI * 2
    });
  }
  nebClouds = [];
  for (i = 0; i < nebCloudDefs.length; i++) {
    nebClouds.push({
      bx: nebCloudDefs[i].fx * viewW, by: nebCloudDefs[i].fy * viewH,
      x: 0, y: 0, amp: nebCloudDefs[i].amp * viewW, f: nebCloudDefs[i].f,
      t: i * 2.3, blowT: 0
    });
  }
  nebCollected = 0;
  starsConst = null;
  starsProps();
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
  princess.facing = 1;
  princess.walkPhase = 0;
  renderBackground();
  playNote(523, 0, 0.25, 'sine', 0.3);
  playNote(784, 0.15, 0.35, 'triangle', 0.3);
}

function respawnStars() {}
function resizeStars() {
  var i;
  for (i = 0; i < nebStars.length; i++) {
    nebStars[i].x = nebStarDefs[i].fx * viewW;
    nebStars[i].y = nebStarDefs[i].fy * viewH;
  }
  for (i = 0; i < nebClouds.length; i++) {
    nebClouds[i].bx = nebCloudDefs[i].fx * viewW;
    nebClouds[i].by = nebCloudDefs[i].fy * viewH;
    nebClouds[i].amp = nebCloudDefs[i].amp * viewW;
  }
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
  starsProps();
}

// Peittääkö joku leijaileva pilvi tähden?
function nebCovered(s) {
  var i, dx, dy, r = viewH * 0.085;
  for (i = 0; i < nebClouds.length; i++) {
    if (nebClouds[i].blowT > 0) continue;
    dx = nebClouds[i].x - s.x;
    dy = nebClouds[i].y - s.y;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function collectNebStar(s) {
  s.collected = true;
  nebCollected++;
  spawnSparkles(s.x, s.y, 16, '#ffe9a0');
  playNote(660 + nebCollected * 66, 0, 0.25, 'sine', 0.4);
  playNote(990 + nebCollected * 66, 0.08, 0.3, 'triangle', 0.3);
  // Tehtäväkaaret avautuvat keräilyn edetessä
  if (!activeTask && !celebrating) {
    if (nebCollected === 2 && !tasks[0].opened) taskStart(tasks[0]);
    else if (nebCollected === 4 && !tasks[1].opened) taskStart(tasks[1]);
  }
  if (nebCollected === STARS_COUNT) startCelebration();
}

function handleStarsTap(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var i, dx, dy;
  // Pilven napautus puhaltaa sen pois pariksi sekunniksi
  for (i = 0; i < nebClouds.length; i++) {
    if (nebClouds[i].blowT > 0) continue;
    dx = px - nebClouds[i].x;
    dy = py - nebClouds[i].y;
    if (dx * dx + dy * dy < viewH * 0.1 * viewH * 0.1) {
      nebClouds[i].blowT = 2.2;
      spawnSparkles(nebClouds[i].x, nebClouds[i].y, 10, '#dfe9ff');
      playNote(392, 0, 0.15, 'sine', 0.25);
      playNote(523, 0.08, 0.2, 'sine', 0.2);
      return;
    }
  }
  // Paljastuneen tähden napautus kerää sen
  for (i = 0; i < nebStars.length; i++) {
    var s = nebStars[i];
    if (s.collected || nebCovered(s)) continue;
    dx = px - s.x;
    dy = py - s.y;
    if (dx * dx + dy * dy < viewH * 0.07 * viewH * 0.07) {
      collectNebStar(s);
      return;
    }
  }
  // Tyhjä kohta: maan koristeet heilahtavat (yhden ruudun kenttä, camX = 0)
  propsTap(px, py);
}

function updateStars(dt) {
  var i;
  updateTasks(dt);
  for (i = 0; i < nebClouds.length; i++) {
    var cl = nebClouds[i];
    cl.t += dt;
    cl.x = cl.bx + Math.sin(cl.t * cl.f) * cl.amp;
    cl.y = cl.by + Math.sin(cl.t * cl.f * 1.7) * viewH * 0.02;
    if (cl.blowT > 0) cl.blowT -= dt;
  }
  for (i = 0; i < nebStars.length; i++) nebStars[i].phase += dt * 2;
  if (starsConst) {
    starsConst.t += dt;
    if (starsConst.t > 3.6) starsConst = null;
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Piirto ----------
function starsLayers() {
  return [
    { speed: 0.22, render: renderStarsFar },
    { speed: 0.55, render: renderStarsMid },
    { speed: 1, render: renderStarsNear }
  ];
}
function renderStarsBg(b, w, h) {
  renderStarsFar(b, w, h);
  renderStarsMid(b, w, h);
  renderStarsNear(b, w, h);
}
function renderStarsFar(b, w, h) {
  var i;
  var sky = b.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(0.7, '#1c2450');
  sky.addColorStop(1, '#2c3468');
  b.fillStyle = sky;
  b.fillRect(0, 0, w, h);
  b.fillStyle = '#fff6c8';
  for (i = 0; i < 90; i++) {
    b.globalAlpha = 0.25 + (i % 5) * 0.13;
    b.beginPath();
    b.arc((i * 173.3) % w, (i * 97.1) % (h * 0.7), 1.2 + (i % 3), 0, Math.PI * 2);
    b.fill();
  }
  b.globalAlpha = 1;
  drawBgSun(b, w * 0.82, h * 0.14, h * 0.055, 0.22, '#ffe9a0', '#ffffff', '#ffe9a8');
}
function renderStarsMid(b, w, h) {
  var i;
  // Kaukaiset kummut taivaan sävyyn hälvennettyinä, ilman reunaviivaa
  for (i = 0; i < 7; i++) {
    b.beginPath();
    b.arc(w * (i / 6), h * 0.82, h * (0.1 + (i % 3) * 0.04), Math.PI, 0);
    b.closePath();
    artFillPath(b, artMix('#1a2148', '#2c3468', 0.35), h * 0.68, h * 0.82, h * 0.1, { line: false });
  }
}
function renderStarsNear(b, w, h) {
  var i;
  var gr = b.createLinearGradient(0, h * 0.78, 0, h);
  gr.addColorStop(0, '#2c3468');
  gr.addColorStop(1, '#171c40');
  b.fillStyle = gr;
  b.fillRect(0, h * 0.78, w, h * 0.22);
  // Maan elämää: kiviä ja pieniä kiteitä (isot kiteet ovat tökättäviä koristeita)
  for (i = 0; i < 4; i++) artBlob(b, w * (0.05 + i * 0.27), h * (0.965 + (i % 2) * 0.015), h * 0.022, h * 0.013, '#3e4878', { lineColor: '#1a2048', hi: 0.2 });
  b.save(); b.translate(w * 0.21, h * 0.975); starsDrawCrystal(b, h * 0.014, '#d9a7ff', 0.25); b.restore();
  b.save(); b.translate(w * 0.58, h * 0.965); starsDrawCrystal(b, h * 0.012, '#9fd8ff', 0.25); b.restore();
  b.save(); b.translate(w * 0.95, h * 0.985); starsDrawCrystal(b, h * 0.011, '#ffb3d9', 0.25); b.restore();
}

// Kide (origo = juuri): hehku, viisikulmainen särmikäs runko reunaviivalla ja kiilto
function starsDrawCrystal(c, s, color, glow) {
  if (glow > 0) artGlow(c, 0, -s * 0.7, s * 1.8, color, glow);
  artShadow(c, 0, s * 0.05, s * 0.7, s * 0.14, 0.2);
  c.beginPath(); c.moveTo(-s * 0.35, 0); c.lineTo(-s * 0.3, -s * 0.9); c.lineTo(0, -s * 1.5); c.lineTo(s * 0.3, -s * 0.9); c.lineTo(s * 0.35, 0); c.closePath();
  artFillPath(c, color, -s * 1.5, 0, s * 0.5, { lineColor: artShade(color, -0.45) });
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = Math.max(1, s * 0.06);
  c.beginPath(); c.moveTo(0, -s * 1.5); c.lineTo(0, 0); c.stroke();
  artHighlight(c, -s * 0.14, -s * 1.0, s * 0.07, s * 0.28, 0.5);
}

// Tähtikukka (origo = juuri): varsi, viisi laventelinsävyistä terälehteä ja tähtikeskus.
// spin = terälehtien kierto (tökkäys pyöräyttää)
function starsDrawFlower(c, s, spin) {
  var i, a;
  artShadow(c, 0, s * 0.05, s * 0.6, s * 0.12, 0.2);
  artLimb(c, 0, 0, 0, -s * 1.3, s * 0.14, '#5fae7a', '#2f6a46');
  artBlob(c, -s * 0.3, -s * 0.5, s * 0.3, s * 0.12, '#5fae7a', { rot: -0.5, lineColor: '#2f6a46' });
  for (i = 0; i < 5; i++) {
    a = spin + i * Math.PI * 2 / 5;
    artBlob(c, Math.cos(a) * s * 0.42, -s * 1.3 + Math.sin(a) * s * 0.42, s * 0.3, s * 0.18, '#e3d8f5', { rot: a, lineColor: '#9a8ac8', shadeTo: '#c9b8ee' });
  }
  artGlow(c, 0, -s * 1.3, s * 0.6, '#ffe27a', 0.5);
  artCircle(c, 0, -s * 1.3, s * 0.22, '#ffe27a', { lineColor: '#b08a2a', hi: 0.5 });
}

function starsProps() {
  var i, d, h = viewH;
  propsReset();
  for (i = 0; i < starsPropDefs.length; i++) {
    d = starsPropDefs[i];
    if (d.kind === 'crystal') {
      propAdd({
        x: d.fx * viewW, y: d.fy * h, s: h * 0.045, r: h * 0.06, hy: h * 0.035, amp: 0.1, color: d.color, note: d.note,
        draw: function (c, p) { starsDrawCrystal(c, p.s, p.color, p.t >= 0 && p.t < 0.6 ? 0.9 - p.t : 0.3); },
        poke: starsCrystalPoke
      });
    } else {
      propAdd({
        x: d.fx * viewW, y: d.fy * h, s: h * 0.04, r: h * 0.06, hy: h * 0.05, amp: 0.14, color: d.color, note: d.note,
        draw: function (c, p) {
          var k = p.t >= 0 ? 1 - easeOutCubic(p.t / 1.2) : 0;
          starsDrawFlower(c, p.s, (p.n - k) * Math.PI * 2 / 5);
        },
        poke: function (p) {
          // Kukasta karkaa pieni tähti, joka putoaa maahan
          propDrop({
            x: p.x, y: p.y - p.s * 1.3, vx: (Math.random() - 0.5) * viewW * 0.08, vy: -h * 0.12, ground: p.y, life: 1.8,
            draw: function (c) { nebDrawStar(c, 0, 0, h * 0.012, true); }
          });
        }
      });
    }
  }
}

// Kide helähtää; joka viides tökkäys sytyttää tähtikuvion taivaalle (yllätys)
function starsCrystalPoke(p) {
  playNote(p.note * 2, 0.05, 0.3, 'triangle', 0.12);
  if (p.n % 5 === 0 && !starsConst) {
    starsConst = { t: 0 };
    playNote(523, 0.2, 0.3, 'sine', 0.25);
    playNote(659, 0.4, 0.3, 'sine', 0.25);
    playNote(784, 0.6, 0.3, 'sine', 0.25);
    playNote(1047, 0.8, 0.6, 'triangle', 0.25);
  }
}

// Tähtikuvio: pisteet syttyvät vuorotellen ja viivat yhdistävät ne; häipyy lopuksi
function starsDrawConst(c) {
  var k = starsConst;
  if (!k) return;
  var i, n = STARS_CONST.length, x, y, px, py, a = k.t > 2.8 ? Math.max(0, 1 - (k.t - 2.8) / 0.8) : 1;
  var lit = Math.min(n, Math.floor(k.t / 0.18) + 1);
  c.strokeStyle = 'rgba(223,233,255,' + (a * 0.6) + ')';
  c.lineWidth = Math.max(1.2, viewH * 0.003);
  c.lineCap = 'round';
  c.beginPath();
  for (i = 0; i < lit; i++) {
    x = STARS_CONST[i][0] * viewW; y = STARS_CONST[i][1] * viewH;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  if (lit === n && k.t > n * 0.18 + 0.2) { px = STARS_CONST[0][0] * viewW; py = STARS_CONST[0][1] * viewH; c.lineTo(px, py); }
  c.stroke();
  for (i = 0; i < lit; i++) {
    x = STARS_CONST[i][0] * viewW; y = STARS_CONST[i][1] * viewH;
    artGlow(c, x, y, viewH * 0.025, '#fff6c8', a * 0.6);
    artCircle(c, x, y, viewH * 0.006, '#ffffff', { line: false, alpha: a });
  }
}

// Tähti (keräiltävä; sama kuva HUD:ssa): hehku, reunaviiva ja kiilto.
// Peitetty tähti piirretään himmeänä ilman hehkua.
function nebDrawStar(c, x, y, s, lit) {
  var i, a, r;
  if (lit) artGlow(c, x, y, s * 2, '#ffe27a', 0.45);
  c.beginPath();
  for (i = 0; i < 10; i++) {
    a = -Math.PI / 2 + i * Math.PI / 5;
    r = i % 2 ? s * 0.45 : s;
    if (i === 0) c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
  artFillPath(c, '#ffe27a', y - s, y + s, s, lit ? { lineColor: '#b08a2a' } : { lineColor: '#b08a2a', alpha: 0.35 });
  if (lit) artHighlight(c, x - s * 0.25, y - s * 0.3, s * 0.2, s * 0.1, 0.5);
}

function drawStars() {
  var i, s, cl;
  if (!beginPlayWorld()) return;
  starsDrawConst(ctx);
  propsDraw(ctx);
  // Tähdet (peitetyt himmeämpinä)
  for (i = 0; i < nebStars.length; i++) {
    s = nebStars[i];
    if (s.collected) continue;
    var tw = 1 + Math.sin(s.phase * 2) * 0.1;
    nebDrawStar(ctx, s.x, s.y, viewH * 0.032 * tw, !nebCovered(s));
  }
  // Pilvet (poispuhalletut häipyvät ja palaavat): reunaviiva ja laventelivarjo
  for (i = 0; i < nebClouds.length; i++) {
    cl = nebClouds[i];
    var alpha = 1, cx = cl.x, cy = cl.y, cs = viewH * 0.045;
    if (cl.blowT > 0) {
      var f = cl.blowT > 1.6 ? (2.2 - cl.blowT) / 0.6 : Math.min(1, cl.blowT / 0.6);
      alpha = Math.max(0, Math.min(1, f));
      cx += (2.2 - cl.blowT) * viewW * 0.12;
      cy -= (2.2 - cl.blowT) * viewH * 0.05;
    }
    ctx.globalAlpha = alpha * 0.95;
    artUnion(ctx, cloudPath, cx, cy, cs, cy - cs * 1.4, cy + cs * 1.1, '#8fa3d8', { lineColor: '#4a5a98', shadeTo: '#6f7fc0' });
    artHighlight(ctx, cx - cs * 0.5, cy - cs * 0.6, cs * 0.6, cs * 0.25, 0.35);
    ctx.globalAlpha = 1;
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, STARS_COUNT, function (i2) { return nebStars[i2] && nebStars[i2].collected; },
    function (c, x, y, s2) { nebDrawStar(c, x, y, s2, true); });
  drawTaskOverlay(ctx);
}
