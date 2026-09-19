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
  renderBackground();
  playNote(523, 0, 0.22, 'sine', 0.3);
  playNote(659, 0.12, 0.28, 'triangle', 0.3);
  swStartRound();
}

function respawnSnowword() {}
function resizeSnowword() {
  princess.x = viewW * 0.5;
  princess.y = viewH * 0.86;
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
  if (!running || celebrating) return;
  if (taskActive()) handleTaskTap(px, py);
}

function updateSnowword(dt) {
  updateTasks(dt);
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
  renderNorthGround(b, w, h);
  drawNorthKota(b, w * 0.78, groundTop + h * 0.02, h * 0.22);
  drawNorthSnowman(b, w * 0.18, groundTop - h * 0.02, h * 0.1);
  drawNorthPine(b, w * 0.32, groundTop, h * 0.15, '#1a3850');
  drawNorthRock(b, w * 0.58, groundTop + h * 0.02, h * 0.04);
}

function drawSnowword() {
  var i;
  if (!beginPlayWorld()) return;
  drawAuroraCurtain(ctx, viewW, viewH, globalT, 0);
  for (i = 0; i < sw.done; i++) {
    drawStar(ctx, viewW * (0.18 + i * 0.12), viewH * 0.08, viewH * 0.018, 0, 0.8);
  }
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawPickupHud(ctx, SW_ROUNDS, function (k) { return k < sw.done; },
    function (c, x, y, sz) { drawStar(c, x, y, sz, 0, 0); });
  drawTaskOverlay(ctx);
}
