'use strict';

// Silmukka, syöte, käynnistys
// ---------- Silmukka ----------
function loop(ts) {
  if (!lastTime) lastTime = ts;
  var dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (mode === 'sea') {
    updateSea(dt);
    drawSea();
  } else if (mode === 'hub') {
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

// Kosketukset: ohjaussormi (juoksu/raahaus) tunnistetaan tunnisteesta, jotta toinen
// sormi (hyppy) ei siirrä sen paikkaa eikä sen nosto lopeta juoksua
var holdTouchId = null;
function touchById(list, id) {
  var i;
  if (!list || id === null || id === undefined) return null;
  for (i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
  return null;
}
function eventPos(e, id) {
  var t = null;
  if (e.touches) {
    t = touchById(e.touches, id);
    if (!t && e.changedTouches && e.changedTouches.length > 0) t = e.changedTouches[0];
    if (!t && e.touches.length > 0) t = e.touches[0];
  }
  if (t) return { x: t.clientX, y: t.clientY };
  return { x: e.clientX, y: e.clientY };
}
// Hyppyalue: vasen alakulma hyppynapin ympäriltä hyppää, vaikka napista osuisi ohi
function inJumpZone(px, py) {
  var vmin = Math.min(viewW, viewH) / 100;
  return px < vmin * 27 && py > viewH - vmin * 27;
}
function pointerDown(e) {
  e.preventDefault();
  var newTouch = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null;
  if (e.touches && e.touches.length > 1 && holdTouchId !== null) {
    // Toinen sormi, kun ohjaussormi on yhä ruudulla: juostessa hyppy mihin tahansa
    // tähtäämättä; tehtävän (esim. raahauksen) aikana toinen sormi ei tee mitään
    if (mode === 'play' && holding && !taskActive()) tryJump();
    return;
  }
  holdTouchId = newTouch ? newTouch.identifier : null;
  var p = eventPos(e, holdTouchId);
  lastPX = p.x; lastPY = p.y;
  if (mode === 'sea') {
    handleSeaTap(p.x, p.y);
    return;
  }
  if (mode === 'hub') {
    handleHubTap(p.x, p.y);
    return;
  }
  if (taskActive()) {
    handleTaskTap(p.x, p.y);
    return;
  }
  if (phaseNow().usesJump && inJumpZone(p.x, p.y)) {
    tryJump();
    return;
  }
  holding = true;
  holdSX = p.x; holdSY = p.y;
  holdStartG = globalT;
  holdMoved = false;
  holdWorldX = p.x + camX;
  var ph = phaseNow();
  if (ph.tap) ph.tap(p.x, p.y);
}
function pointerMove(e) {
  if (e.touches) e.preventDefault();
  var p = eventPos(e, holdTouchId);
  if (dragPiece) {
    lastPX = p.x; lastPY = p.y;
    taskDragMove(p.x, p.y);
    return;
  }
  if (mode !== 'play' || !holding) return;
  lastPX = p.x; lastPY = p.y;
  if (Math.abs(p.x - holdSX) + Math.abs(p.y - holdSY) > 22) holdMoved = true;
  if (phaseNow().control === 'draw') { penMove(p.x, p.y); return; }
  if (phaseNow().control === 'ride') setWalkTarget(p.x, p.y);
  else holdWorldX = p.x + camX;
}
function pointerUp(e) {
  if (e && e.touches && e.touches.length > 0) {
    // Ruudulle jäi sormia: vain ohjaussormen nosto lasketaan
    if (!touchById(e.changedTouches, holdTouchId)) return;
  }
  holdTouchId = null;
  if (dragPiece) {
    taskDrop(lastPX, lastPY);
    holding = false;
    return;
  }
  if (mode === 'play' && phaseNow().control === 'draw' && holding) penEnd();
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

// Vene-nappi: saaren sokkelosta takaisin saaristokartalle
document.getElementById('seaBtn').addEventListener('click', function () {
  if (mode === 'hub') showSea();
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
  world: function (w) { if (w) hubEnterIsland(w); return hubWorld; },
  sea: showSea,
  seaTap: handleSeaTap,
  seaTick: function (dt) { updateSea(dt); drawSea(); },
  boat: seaBoat,
  islands: ISLANDS,
  islandPos: seaIslandPos,
  reveal: function () { return seaReveal; },
  rainbow: function () { return { earned: rainbowEarned(), shown: rainbowShown }; },
  offer: function () { return hubOffer; },
  pen: function () { return { strokes: penStrokes, bubbles: penBubbles, ink: penInk, inkMax: penInkMax, wait: penWait, dir: penDir, clouds: penClouds, drops: penDrops, frame: penFrame }; },
  penStart: penStart,
  penMove: penMove,
  penEnd: penEnd,
  down: pointerDown,
  move: pointerMove,
  up: pointerUp,
  holding: function () { return { holding: holding, id: holdTouchId, wx: holdWorldX }; },
  hubTap: handleHubTap,
  hubPawn: hubPawn,
  hubLayout: hubLayout,
  offerButtons: function () { return hubOfferButtons(hubLayout()); },
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
hubWorld = lastIsland;
resize();
showSea();
requestAnimationFrame(loop);
