'use strict';

// Lumisana: ei liikkumista. Kuusi lukukierrosta vuorottelee sana–kuvaa,
// loppukirjainta ja puuttuvaa tavua; kahden kierroksen välein tulee
// laskutehtävä. Jokainen ratkaistu tehtävä tuo lumiukolle uuden osan
// (pallot, kasvot, kädet, napit, kaulahuivi ja hattu). Lumiukon haalea
// ääriviiva näkyy alusta asti, joten tavoite on selvä heti. Valmis lumiukko
// vilkuttaa, ja sitten juhlitaan.

var SW_ROUNDS = 6;
var SW_KINDS = ['word', 'lastletter', 'gapsyl', 'word', 'lastletter', 'gapsyl'];
var SW_PARTS = 8;          // 6 kierrosta + 2 laskutehtävää
var SW_PAUSE = 1.1;        // tauko osan saapumisen jälkeen ennen seuraavaa tehtävää
var sw = { done: 0, current: null, waiting: false, parts: 0, partT: [], pauseT: 0, finT: 0, credited: [false, false], wobT: 0 };

function swSnowmanX() { return viewW * 0.64; }
function swSnowmanS() { return viewH * 0.5; }

function initSnowword() {
  var i;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  sw.done = 0;
  sw.current = null;
  sw.waiting = false;
  sw.parts = 0;
  sw.partT = [];
  sw.pauseT = 0.6;
  sw.finT = 0;
  sw.credited = [false, false];
  sw.wobT = 0;
  princess.x = viewW * 0.22;
  princess.y = viewH * 0.86;
  princess.facing = 1;
  swSetupProps();
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.3);
  playNote(659, 0.12, 0.28, 'triangle', 0.3);
}

function respawnSnowword() {}
function resizeSnowword() {
  princess.x = viewW * 0.22;
  princess.y = viewH * 0.86;
  swSetupProps();
}

// Tökättävät koristeet (tehtävien välissä ja juhlinnan aikana): kota puhaltaa
// savurenkaan ja joka kolmannella tökkäyksellä sydämen (yllätys), kuusi
// pudottaa lumitupsun, kivi heilahtaa. Lumiukko itse hytkyy tökkäyksestä.
// Yhden ruudun kenttä: paikat ruudun leveydestä (viewW), ei maailmasta.
function swSetupProps() {
  var h = viewH, w = viewW;
  propsReset();
  reinKotaProp(w * 0.89, groundTop + h * 0.02, h * 0.15, 3);
  voyPineProp(w * 0.07, groundTop, h * 0.17, '#1a3850');
  propAdd({
    x: w * 0.4, y: groundTop + h * 0.02, r: h * 0.055, hy: h * 0.008, color: '#dce8f4', note: 392, amp: 0.07,
    draw: function (c) { drawNorthRock(c, 0, 0, h * 0.04); },
    poke: function (p) { voySnowPuff(p.x, p.y - h * 0.016, h * 0.005, p.y + h * 0.004); }
  });
  propAdd({
    x: swSnowmanX(), y: groundTop + h * 0.04, r: h * 0.12, hy: h * 0.15, color: '#ffffff', note: 587, amp: 0,
    draw: function () {},
    update: function (p) { p.x = sw.parts > 0 ? swSnowmanX() : -1e6; },
    poke: function (p) {
      sw.wobT = 0.6;
      voySnowPuff(p.x + (Math.random() - 0.5) * h * 0.08, p.y - h * 0.2, h * 0.008, p.y);
    }
  });
}

function swStartRound() {
  sw.current = makeTask(-5, SW_KINDS[sw.done]);
  sw.current.x = -1e6;
  taskStart(sw.current);
  sw.waiting = true;
}

// Uusi osa lentää paikalleen: pomppu, kipinät ja nouseva sävel
function swAddPart() {
  var k = sw.parts, pos = swPartPos(k);
  sw.partT[k] = 0;
  sw.parts++;
  sw.pauseT = SW_PAUSE;
  spawnSparkles(pos.x, pos.y, 14, '#c8f0ff');
  playNote(523 + k * 60, 0, 0.14, 'triangle', 0.3);
  playNote(784 + k * 60, 0.12, 0.22, 'triangle', 0.28);
}

function handleSnowwordTap(px, py) {
  if (!running) return;
  if (!celebrating && taskActive()) { handleTaskTap(px, py); return; }
  // Ei tehtävää auki: koriste saa heilahtaa (yhden ruudun kenttä, camX = 0)
  propsTap(px, py);
}

function updateSnowword(dt) {
  var i;
  updateTasks(dt);
  propsUpdate(dt);
  for (i = 0; i < sw.partT.length; i++) sw.partT[i] += dt;
  if (sw.wobT > 0) sw.wobT -= dt;
  if (sw.waiting && sw.current && sw.current.opened) {
    sw.waiting = false;
    sw.done++;
    swAddPart();
  }
  for (i = 0; i < tasks.length; i++) {
    if (tasks[i].opened && !sw.credited[i]) { sw.credited[i] = true; swAddPart(); }
  }
  if (!celebrating && !activeTask && !sw.waiting) {
    if (sw.pauseT > 0) sw.pauseT -= dt;
    else if (sw.done === 2 && !tasks[0].opened) taskStart(tasks[0]);
    else if (sw.done === 4 && !tasks[1].opened) taskStart(tasks[1]);
    else if (sw.done < SW_ROUNDS) swStartRound();
    else if (sw.finT <= 0) {
      // Valmis: lumiukko vilkuttaa hetken ennen juhlaa
      sw.finT = 1.6;
      playNote(659, 0, 0.15, 'triangle', 0.3);
      playNote(784, 0.15, 0.15, 'triangle', 0.3);
      playNote(1047, 0.3, 0.3, 'triangle', 0.3);
    } else {
      sw.finT -= dt;
      if (sw.finT <= 0) startCelebration();
    }
  }
  updateParticles(dt);
  updateConfetti(dt);
}

function snowwordLayers() {
  return [
    { speed: 0.22, render: renderSnowwordFar },
    { speed: 0.55, render: renderSnowwordMid },
    { speed: 1, render: renderSnowwordNear }
  ];
}
function renderSnowwordBg(b, w, h) {
  renderSnowwordFar(b, w, h); renderSnowwordMid(b, w, h); renderSnowwordNear(b, w, h);
}
function renderSnowwordFar(b, w, h) { renderNorthSky(b, w, h); }
function renderSnowwordMid(b, w, h) {
  renderNorthHills(b, w, h);
  drawNorthPine(b, w * 0.12, groundTop - h * 0.01, h * 0.2, '#1a3850');
  drawNorthPine(b, w * 0.84, groundTop - h * 0.01, h * 0.18, '#245068');
}
function renderSnowwordNear(b, w, h) {
  // Kota, kuusi, kivi ja lumiukko ovat tökättäviä tai piirretään erikseen
  renderNorthGround(b, w, h);
}

// Lumiukon osien mitat: pallot alhaalta ylös (s = koko lumiukon korkeus)
function swBalls() {
  var s = swSnowmanS(), gy = groundTop + viewH * 0.06, r0 = s * 0.17, r1 = s * 0.13, r2 = s * 0.1;
  var y0 = gy - r0 * 0.95, y1 = y0 - r0 * 0.85 - r1 * 0.8, y2 = y1 - r1 * 0.85 - r2 * 0.8;
  return { x: swSnowmanX(), r0: r0, r1: r1, r2: r2, y0: y0, y1: y1, y2: y2, gy: gy };
}
// Osien järjestys: 0 alapallo, 1 keskipallo, 2 pää, 3 kasvot, 4 kädet,
// 5 napit, 6 kaulahuivi, 7 hattu
function swPartPos(k) {
  var b = swBalls();
  var ys = [b.y0, b.y1, b.y2, b.y2, b.y1, b.y1, b.y1 - b.r1 * 0.9, b.y2 - b.r2 * 1.2];
  return { x: b.x, y: ys[k] };
}

// Osa ponnahtaa näkyviin (pomppuskaala); ansaitsematon osa on haalea ääriviiva
function swPartScale(k) {
  if (k >= sw.parts) return 0;
  return easeOutBack(Math.min(1, (sw.partT[k] || 0) / 0.45));
}

function swDrawSnowman(c) {
  var b = swBalls(), x = b.x, k, sc, ghost = { line: false }, snow = { shadeTo: '#d4e4f0', lineColor: '#9ab4c8', hi: 0.35 };
  var wave = sw.finT > 0 || celebrating ? Math.sin(globalT * 10) * 0.5 : 0, wob = sw.wobT > 0 ? Math.sin(sw.wobT * 30) * 0.06 * sw.wobT : 0;
  var hop = sw.finT > 0 || celebrating ? Math.abs(Math.sin(globalT * 5)) * viewH * 0.02 : 0;
  c.save();
  c.translate(x, b.gy);
  c.rotate(wob);
  c.translate(-x, -b.gy - hop);
  // Haalea ääriviiva koko lumiukosta: näin tavoite näkyy heti
  c.globalAlpha = 0.22;
  if (sw.parts < 1) artCircle(c, x, b.y0, b.r0, '#ffffff', ghost);
  if (sw.parts < 2) artCircle(c, x, b.y1, b.r1, '#ffffff', ghost);
  if (sw.parts < 3) artCircle(c, x, b.y2, b.r2, '#ffffff', ghost);
  if (sw.parts < 8) artRoundRect(c, x - b.r2 * 0.6, b.y2 - b.r2 * 2.0, b.r2 * 1.2, b.r2 * 1.0, 3, '#ffffff', ghost);
  c.globalAlpha = 1;
  if (sw.parts >= 1) artShadow(c, x, b.gy - viewH * 0.005, b.r0 * 1.4, b.r0 * 0.3, 0.16);
  // Pallot
  for (k = 0; k < 3; k++) {
    sc = swPartScale(k);
    if (sc <= 0) continue;
    artCircle(c, x, [b.y0, b.y1, b.y2][k], [b.r0, b.r1, b.r2][k] * sc, '#ffffff', snow);
  }
  // Kasvot: hiilisilmät, porkkananenä ja hymy
  sc = swPartScale(3);
  if (sc > 0) {
    c.save();
    c.translate(x, b.y2);
    c.scale(sc, sc);
    artEye(c, -b.r2 * 0.32, -b.r2 * 0.2, b.r2 * 0.13, 0, false);
    artEye(c, b.r2 * 0.32, -b.r2 * 0.2, b.r2 * 0.13, 0, false);
    artBlob(c, b.r2 * 0.32, b.r2 * 0.08, b.r2 * 0.38, b.r2 * 0.12, '#f08a30', { rot: 0.1, lineColor: '#a8541a' });
    c.strokeStyle = '#2a2a2a';
    c.lineWidth = Math.max(2, b.r2 * 0.07);
    c.lineCap = 'round';
    c.beginPath(); c.arc(0, b.r2 * 0.18, b.r2 * 0.4, 0.5, Math.PI - 0.5); c.stroke();
    artBlush(c, -b.r2 * 0.55, b.r2 * 0.15, b.r2 * 0.12);
    artBlush(c, b.r2 * 0.55, b.r2 * 0.15, b.r2 * 0.12);
    c.restore();
  }
  // Oksakädet (vilkuttavat lopussa)
  sc = swPartScale(4);
  if (sc > 0) {
    artLimb(c, x - b.r1 * 0.9, b.y1 - b.r1 * 0.2, x - b.r1 * (0.9 + 1.0 * sc), b.y1 - b.r1 * (0.7 + wave * 0.8) * sc, b.r1 * 0.09, '#6a4020');
    artLimb(c, x + b.r1 * 0.9, b.y1 - b.r1 * 0.2, x + b.r1 * (0.9 + 1.0 * sc), b.y1 - b.r1 * (0.8 - wave) * sc, b.r1 * 0.09, '#6a4020');
  }
  // Napit
  sc = swPartScale(5);
  if (sc > 0) {
    for (k = 0; k < 3; k++) artCircle(c, x, b.y1 - b.r1 * 0.35 + k * b.r1 * 0.38, b.r1 * 0.1 * sc, '#3a3a4a', { line: false, hi: 0.3 });
  }
  // Kaulahuivi
  sc = swPartScale(6);
  if (sc > 0) {
    artRoundRect(c, x - b.r2 * 1.05 * sc, b.y1 - b.r1 * 0.98, b.r2 * 2.1 * sc, b.r2 * 0.36, b.r2 * 0.15, '#e8505a', { hi: 0.2 });
    artRoundRect(c, x + b.r2 * 0.35, b.y1 - b.r1 * 0.9, b.r2 * 0.32, b.r2 * 0.9 * sc, b.r2 * 0.12, '#d03a48', {});
  }
  // Hattu
  sc = swPartScale(7);
  if (sc > 0) {
    c.save();
    c.translate(x, b.y2 - b.r2 * 0.85);
    c.rotate(-0.12 + wave * 0.1);
    c.scale(sc, sc);
    artRoundRect(c, -b.r2 * 0.95, -b.r2 * 0.14, b.r2 * 1.9, b.r2 * 0.24, b.r2 * 0.1, '#3a3a5a', {});
    artRoundRect(c, -b.r2 * 0.6, -b.r2 * 1.05, b.r2 * 1.2, b.r2 * 0.95, b.r2 * 0.12, '#4a4a6e', { hi: 0.2 });
    artRoundRect(c, -b.r2 * 0.6, -b.r2 * 0.4, b.r2 * 1.2, b.r2 * 0.2, 2, '#c9a0ff', { line: false });
    c.restore();
  }
  c.restore();
}

function drawSnowword() {
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, 0);
  propsDraw(ctx);
  swDrawSnowman(ctx);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, SW_PARTS, function (k) { return k < sw.parts; },
    function (c, x, y, sz) { artCircle(c, x, y, sz * 0.5, '#ffffff', { shadeTo: '#d4e4f0', lineColor: '#9ab4c8', hi: 0.4 }); });
  drawTaskOverlay(ctx);
}
