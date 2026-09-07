'use strict';

// Metsävaiheen kosketus, loitsut, keräily
// ---------- Kosketus ----------
function handleTap(px, py) {
  if (!running || celebrating) return;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  var i, d, dx, dy;

  if (taskActive()) {
    handleTaskTap(px, py);
    return;
  }

  // Loitsutila: vain palloihin voi koskea
  if (spellActive()) {
    if (activeGate.mode !== 'input') return;
    var op = orbPositions(activeGate.orbs);
    for (i = 0; i < op.xs.length; i++) {
      dx = px - op.xs[i];
      dy = py - op.y;
      if (Math.sqrt(dx * dx + dy * dy) < op.r * 1.4) {
        spellTapOrb(i);
        return;
      }
    }
    return;
  }

  var wx = px + camX;
  var wy = py;

  // Osuiko tähteen? Suora osuma nappaa, läheltä ohi mennyt säikäyttää
  // tähden uuteen paikkaan.
  var starHit = viewH * 0.07;
  var nearest = null, nearestD = 1e9;
  for (i = 0; i < stars.length; i++) {
    var st = stars[i];
    if (st.collected) continue;
    dx = wx - st.px;
    dy = wy - st.py;
    d = Math.sqrt(dx * dx + dy * dy);
    if (d < nearestD) { nearestD = d; nearest = st; }
  }
  if (nearest && nearestD < starHit) {
    collectStar(nearest);
    return;
  }
  if (nearest && nearestD < starHit * 2.3) {
    scareStar(nearest);
    return;
  }

  // Osuiko kurkkivaan pupuun? Pitää ehtiä napauttaa kun pupu on esillä.
  var bs = viewH * 0.055;
  for (i = 0; i < bunnies.length; i++) {
    var bn = bunnies[i];
    if (bn.state !== 'hidden') continue;
    var hy = groundTop + 12 - bs * 0.5 - bn.peek * bs * 1.6;
    dx = wx - bn.bushX;
    dy = wy - hy;
    if (Math.sqrt(dx * dx + dy * dy) < viewH * 0.09) {
      if (bn.peek > 0.5) {
        foundBunny(bn);
      } else {
        // Huti: korvat vilkuttavat, ja toisesta hudista pupu vaihtaa pensasta
        bn.earT += 6;
        bn.missCount = (bn.missCount || 0) + 1;
        if (bn.missCount >= 2) relocateBunny(bn);
      }
      return;
    }
  }

  // Muuten: kävele kohti kosketusta (suljettu portti pysäyttää)
  setWalkTarget(px, py);
}

function setWalkTarget(px, py) {
  if (!running || celebrating || puzzleBusy()) return;
  var wx = px + camX;
  var wy = py;
  var maxX = worldW - viewW * 0.03;
  var i;
  for (i = 0; i < gates.length; i++) {
    if (!gates[i].opened && gates[i].x > unicorn.x) {
      maxX = Math.min(maxX, gates[i].x - viewW * 0.09);
    }
  }
  for (i = 0; i < tasks.length; i++) {
    if (!tasks[i].opened && tasks[i].x > unicorn.x) {
      maxX = Math.min(maxX, tasks[i].x - viewW * 0.09);
    }
  }
  unicorn.tx = Math.min(Math.max(wx, viewW * 0.05), maxX);
  unicorn.ty = Math.min(Math.max(wy, groundTop), groundBottom);
  tapRing = { x: unicorn.tx, y: unicorn.ty, t: 0 };
}

function scareStar(st) {
  spawnSparkles(st.px, st.py, 8, '#fff3b0');
  playNote(520, 0, 0.12, 'sine', 0.3);
  playNote(360, 0.08, 0.15, 'sine', 0.25);
  var jump = (0.04 + Math.random() * 0.04) * worldW;
  var dir2 = Math.random() < 0.5 ? -1 : 1;
  // Pysytään maailman sisällä
  if (st.ax + dir2 * jump < viewW * 0.06 || st.ax + dir2 * jump > worldW - viewW * 0.05) dir2 = -dir2;
  st.ax += dir2 * jump;
  st.ay = groundTop - (0.14 + Math.random() * 0.16) * viewH;
  st.ox = 0; st.oy = 0;
  st.px = st.ax; st.py = st.ay;
  spawnSparkles(st.px, st.py, 8, '#ffe27a');
}

function relocateBunny(bn) {
  bn.missCount = 0;
  // Lähin muu pensas, ettei pupua tarvitse jahdata maailman toiselle laidalle
  var best = null, bd = 1e9;
  for (var i = 0; i < bushDefs.length; i++) {
    var bx2 = bushDefs[i].fx * worldW;
    var d = Math.abs(bx2 - bn.bushX);
    if (d > viewW * 0.05 && d < bd) { bd = d; best = bx2; }
  }
  if (best === null) return;
  spawnSparkles(bn.bushX, groundTop - viewH * 0.04, 10, '#9fdc7f');
  bn.bushX = best;
  bn.peek = 0.12;
  bn.phase = 'waiting';
  bn.phaseT = 0;
  bn.waitTime = 1.5 + Math.random() * 2.0;
  playNote(820, 0, 0.1, 'sine', 0.3);
  playNote(1040, 0.09, 0.12, 'sine', 0.3);
}

function spellStart(g) {
  activeGate = g;
  g.mode = 'show';
  g.timer = -0.4;
  g.inputIdx = 0;
  g.litOrb = -1;
  g.lastShown = -1;
  g.seq = [];
  for (var i = 0; i < g.seqLen; i++) {
    g.seq.push(Math.floor(Math.random() * g.orbs));
  }
  unicorn.tx = unicorn.x;
  unicorn.ty = unicorn.y;
}

function spellTapOrb(k) {
  var g = activeGate;
  g.litOrb = k;
  g.litT = 0.35;
  if (k === g.seq[g.inputIdx]) {
    playNote(ORB_NOTES[k], 0, 0.35, 'triangle', 0.5);
    g.inputIdx++;
    if (g.inputIdx >= g.seq.length) {
      g.mode = 'opening';
      g.timer = 0;
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        playNote(notes[i], 0.2 + i * 0.12, 0.4, 'triangle', 0.45);
      }
    }
  } else {
    // Väärin: ei rangaistusta, loitsu näytetään uudelleen
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    g.shakeT = 0.5;
    g.mode = 'show';
    g.timer = -1.0;
    g.inputIdx = 0;
    g.lastShown = -1;
  }
}

function foundBunny(bn) {
  bn.state = 'found';
  bn.y = groundTop + 10;
  soundBunny();
  spawnSparkles(bn.bushX, bn.y - viewH * 0.08, 14, '#ff9ec6');
  checkComplete();
}

function collectStar(st) {
  st.collected = true;
  soundStar(countStars());
  spawnSparkles(st.px, st.py, 16, '#ffe27a');
  checkComplete();
}

// Pisaraosuma: enintään 3 kerättyä tähteä sirottuu takaisin maastoon
function hitUnicorn() {
  if (invulnT > 0 || celebrating) return;
  invulnT = 2.5;
  playNote(330, 0, 0.18, 'sawtooth', 0.3);
  playNote(220, 0.14, 0.3, 'sawtooth', 0.3);
  spawnSparkles(unicorn.x, unicorn.y - viewH * 0.10, 14, '#8fc7ff');
  goalReady = false;
  var lost = 0;
  for (var i = stars.length - 1; i >= 0 && lost < 3; i--) {
    var st = stars[i];
    if (!st.collected) continue;
    st.collected = false;
    lost++;
    var dir2 = Math.random() < 0.5 ? -1 : 1;
    var ax2 = unicorn.x + dir2 * (0.05 + Math.random() * 0.08) * worldW;
    st.ax = Math.min(Math.max(ax2, viewW * 0.06), worldW - viewW * 0.05);
    st.ay = groundTop - (0.14 + Math.random() * 0.16) * viewH;
    st.ox = 0; st.oy = 0;
    st.px = st.ax; st.py = st.ay;
    spawnSparkles(st.px, st.py, 8, '#ffe27a');
  }
}

function countStars() {
  var n = 0;
  for (var i = 0; i < stars.length; i++) if (stars[i].collected) n++;
  return n;
}
function countBunnies() {
  var n = 0;
  for (var i = 0; i < bunnies.length; i++) if (bunnies[i].state === 'found') n++;
  return n;
}
function checkComplete() {
  if (goalReady || celebrating) return;
  if (countStars() === STAR_COUNT && countBunnies() === BUNNY_COUNT) {
    // Kaikki kerätty: linnan majakka syttyy, juhla odottaa linnalla
    goalReady = true;
    playNote(523, 0, 0.3, 'triangle', 0.4);
    playNote(659, 0.15, 0.3, 'triangle', 0.4);
    playNote(784, 0.3, 0.5, 'triangle', 0.4);
  }
}

function startCelebration() {
  celebrating = true;
  celebrateT = 0;
  unicorn.tx = unicorn.x;
  princess.vx = 0;
  markPhaseCleared();
  awardStars();
  document.getElementById('jumpBtn').style.display = 'none';
  document.getElementById('replayBtn').style.display = 'none';
  document.getElementById('continueBtn').style.display = 'none';
  soundFanfare();
  spawnConfetti();
  celebrateReturnId += 1;
  var rid = celebrateReturnId;
  setTimeout(function () {
    if (rid !== celebrateReturnId) return;
    if (mode !== 'play' || !celebrating) return;
    showHub();
  }, phaseNow().celebrateMs || 2800);
}

