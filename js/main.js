'use strict';

// Silmukka, syöte, käynnistys
// ---------- Silmukka ----------
function loop(ts) {
  if (!lastTime) lastTime = ts;
  var dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (mode === 'hub') {
    updateHub(dt);
    drawHub();
  } else if (running) {
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}

// ---------- Tapahtumat ----------
window.addEventListener('resize', function () {
  resize();
});

function eventPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}
function pointerDown(e) {
  e.preventDefault();
  var p = eventPos(e);
  lastPX = p.x; lastPY = p.y;
  if (mode === 'hub') {
    handleHubTap(p.x, p.y);
    return;
  }
  if (taskActive()) {
    handleTaskTap(p.x, p.y);
    return;
  }
  holding = true;
  lastPX = p.x; lastPY = p.y;
  holdSX = p.x; holdSY = p.y;
  holdStartG = globalT;
  holdMoved = false;
  holdWorldX = p.x + camX;
  var ph = phaseNow();
  if (ph.tap) ph.tap(p.x, p.y);
}
function pointerMove(e) {
  if (e.touches) e.preventDefault();
  if (dragPiece) {
    var dp = eventPos(e);
    lastPX = dp.x; lastPY = dp.y;
    taskDragMove(dp.x, dp.y);
    return;
  }
  if (mode === 'hub' || !holding) return;
  var p = eventPos(e);
  lastPX = p.x; lastPY = p.y;
  if (Math.abs(p.x - holdSX) + Math.abs(p.y - holdSY) > 22) holdMoved = true;
  if (phaseNow().control === 'ride') setWalkTarget(p.x, p.y);
  else holdWorldX = p.x + camX;
}
function pointerUp(e) {
  if (e && e.touches && e.touches.length > 0) return;
  if (dragPiece) {
    taskDrop(lastPX, lastPY);
    holding = false;
    return;
  }
  if (mode === 'play' && phaseNow().usesWand && !puzzleBusy() && holding && !holdMoved && (globalT - holdStartG) < 0.22) {
    shootWand(lastPX, lastPY);
  }
  holding = false;
}
canvas.addEventListener('touchstart', pointerDown, { passive: false });
canvas.addEventListener('mousedown', function (e) {
  // Vältetään tuplakäsittely kosketuslaitteilla
  if (e.button === 0) pointerDown(e);
});
document.addEventListener('touchmove', pointerMove, { passive: false });
window.addEventListener('mousemove', pointerMove);
document.addEventListener('touchend', pointerUp);
document.addEventListener('touchcancel', pointerUp);
window.addEventListener('mouseup', pointerUp);

document.getElementById('karttaBtn').addEventListener('click', function () {
  showHub();
});

document.getElementById('replayBtn').addEventListener('click', function () {
  phaseNow().init();
});

document.getElementById('continueBtn').addEventListener('click', function () {
  var n = phaseNow().next;
  if (n) skipTo(n);
});

function jumpPress(e) {
  e.preventDefault();
  e.stopPropagation();
  tryJump();
}
document.getElementById('jumpBtn').addEventListener('touchstart', jumpPress, { passive: false });
document.getElementById('jumpBtn').addEventListener('mousedown', jumpPress);

document.getElementById('muteBtn').addEventListener('click', function () {
  muted = !muted;
  this.innerHTML = muted ? '&#128263;' : '&#128266;';
});

// Debug-kahva testausta varten
window.VT = {
  u: unicorn,
  gates: function () { return gates; },
  active: function () { return activeGate; },
  troll: troll,
  clouds: function () { return clouds; },
  drops: function () { return drops; },
  stars: function () { return stars; },
  bunnies: function () { return bunnies; },
  cam: function () { return camX; },
  tick: function (dt) { update(dt); draw(); },
  tap: handleTap,
  princess: princess,
  startL2: initLevel2,
  showHub: showHub,
  play: beginPlay,
  task: function () { return activeTask; },
  taskTap: handleTaskTap,
  jump: tryJump,
  hold: function (on, px, py) { holding = on; if (on) { holdWorldX = px + camX; lastPX = px; lastPY = py; } },
  hearts: function () { return { hearts: hearts, hurtT: hurtT, cp: checkpoint.x, cps: checkpoints }; },
  drag: function (px, py) { var t = activeTask; if (t && taskUsesDrag(t)) return taskDragStart(t, px, py); return false; },
  dragMove: taskDragMove,
  drop: taskDrop,
  world: function (w) { if (w) hubEnterWorld(w); return hubWorld; },
  resetProgress: resetProgress,
  info: function () {
    return {
      running: running, mode: mode, worldW: worldW, viewW: viewW, viewH: viewH,
      camX: camX, ux: unicorn.x, utx: unicorn.tx, uy: unicorn.y,
      stars: countStars(), bunnies: countBunnies(),
      goalReady: goalReady, celebrating: celebrating,
      level: level, butterflies: countButterflies(),
      flakes: countCollected(flakes), pearls: countCollected(pearls),
      moons: countCollected(moons),
      px: princess.x, py: princess.y, hearts: hearts,
      hub: { c: hubPawn.c, r: hubPawn.r, cleared: hubCleared, next: typeof hubNextKind === 'function' ? hubNextKind() : null }
    };
  }
};

loadProgress();
resize();
showHub();
var hubStart = hubFind('S');
hubPawn.c = hubStart.c;
hubPawn.r = hubStart.r;
requestAnimationFrame(loop);
