'use strict';

// Lumisana: ei liikkumista. Kuusi kierrosta vuorottelee sana–kuvaa,
// loppukirjainta ja puuttuvaa tavua. Tehtäväkaaret avautuvat keräilyn edetessä.

var SW_ROUNDS = 6;
var SW_KINDS = ['word', 'lastletter', 'gapsyl', 'word', 'lastletter', 'gapsyl'];
var sw = { done: 0, current: null, waiting: false };

function initSnowword() {
  var i;
  tasks = [makeTask(-5, 'count'), makeTask(-5, 'minus')];
  for (i = 0; i < tasks.length; i++) tasks[i].x = -1e6;
  sw.done = 0;
  sw.current = null;
  sw.waiting = false;
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
  princess.facing = 1;
  swSetupProps();
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.3);
  playNote(659, 0.12, 0.28, 'triangle', 0.3);
  swStartRound();
}

function respawnSnowword() {}
function resizeSnowword() {
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
  swSetupProps();
}

// Tökättävät koristeet (tehtävien välissä ja juhlinnan aikana): kota puhaltaa
// savurenkaan ja joka kolmannella tökkäyksellä sydämen (yllätys), lumiukko ja
// kuusi pudottavat lumitupsun, kivi heilahtaa.
function swSetupProps() {
  var h = viewH, w = worldW;
  propsReset();
  reinKotaProp(w * 0.78, groundTop + h * 0.02, h * 0.22, 3);
  propAdd({
    x: w * 0.18, y: groundTop - h * 0.02, r: h * 0.07, hy: h * 0.025, color: '#ffffff', note: 523, amp: 0.1,
    draw: function (c) { drawNorthSnowman(c, 0, 0, h * 0.1); },
    poke: function (p) { voySnowPuff(p.x + (Math.random() - 0.5) * h * 0.03, p.y - h * 0.065, h * 0.005, p.y + h * 0.015); }
  });
  voyPineProp(w * 0.32, groundTop, h * 0.15, '#1a3850');
  propAdd({
    x: w * 0.58, y: groundTop + h * 0.02, r: h * 0.055, hy: h * 0.008, color: '#dce8f4', note: 392, amp: 0.07,
    draw: function (c) { drawNorthRock(c, 0, 0, h * 0.04); },
    poke: function (p) { voySnowPuff(p.x, p.y - h * 0.016, h * 0.005, p.y + h * 0.004); }
  });
}

function swStartRound() {
  if (sw.done >= SW_ROUNDS) {
    if (!celebrating) startCelebration();
    return;
  }
  sw.current = makeTask(-5, SW_KINDS[sw.done]);
  sw.current.x = -1e6;
  taskStart(sw.current);
  sw.waiting = true;
}

function handleSnowwordTap(px, py) {
  if (!running) return;
  if (!celebrating && taskActive()) { handleTaskTap(px, py); return; }
  // Ei tehtävää auki: koriste saa heilahtaa (yhden ruudun kenttä, camX = 0)
  propsTap(px, py);
}

function updateSnowword(dt) {
  updateTasks(dt);
  propsUpdate(dt);
  if (sw.waiting && sw.current && sw.current.opened) {
    sw.waiting = false;
    sw.done++;
    spawnSparkles(viewW / 2, viewH * 0.4, 14, '#c8f0ff');
    if (sw.done === 2 && !tasks[0].opened) taskStart(tasks[0]);
    else if (sw.done === 4 && !tasks[1].opened) taskStart(tasks[1]);
    else if (sw.done >= SW_ROUNDS) startCelebration();
    else if (!activeTask) swStartRound();
  }
  if (!sw.waiting && !activeTask && !celebrating && sw.done < SW_ROUNDS) {
    if ((sw.done === 2 && tasks[0].opened) || (sw.done === 4 && tasks[1].opened) || (sw.done !== 2 && sw.done !== 4)) {
      swStartRound();
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
  // Kota, lumiukko, kuusi ja kivi ovat tökättäviä koristeita (swSetupProps)
  renderNorthGround(b, w, h);
}

function drawSnowword() {
  var i;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, 0);
  for (i = 0; i < sw.done; i++) {
    drawStar(ctx, viewW * (0.18 + i * 0.12), viewH * 0.08, viewH * 0.018, 0, 0.8);
  }
  propsDraw(ctx);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, SW_ROUNDS, function (k) { return k < sw.done; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawTaskOverlay(ctx);
}
