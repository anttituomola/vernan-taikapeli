'use strict';

// Metsävaiheen kosketus, loitsut, keräily
// ---------- Kosketus ----------
function orbPositions(n) {
  var r = viewH * 0.085;
  var cy = viewH * 0.45;
  var gap = Math.min(viewW * 0.9 / n, r * 3.0);
  var xs = [];
  for (var i = 0; i < n; i++) {
    xs.push(viewW / 2 + (i - (n - 1) / 2) * gap);
  }
  return { r: r, xs: xs, y: cy };
}

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

function shuffleNums(arr) {
  var i, j, t;
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function taskStart(t) {
  activeTask = t;
  holding = false;
  unicorn.tx = unicorn.x;
  unicorn.ty = unicorn.y;
  princess.vx = 0;
  t.timer = -0.35;
  t.inputIdx = 0;
  t.litOrb = -1;
  t.lastShown = -1;
  t.shakeT = 0;
  t.litT = 0;
  if (t.type === 'math') {
    t.a = 1 + Math.floor(Math.random() * 3);
    t.b = 1 + Math.floor(Math.random() * 2);
    t.correct = t.a + t.b;
    var w1 = t.correct === 2 ? 3 : t.correct - 1;
    var w2 = t.correct + 1;
    if (w1 < 1) w1 = t.correct + 2;
    t.answers = shuffleNums([t.correct, w1, w2]);
    t.mode = 'input';
    playNote(659, 0, 0.2, 'triangle', 0.35);
  } else {
    t.seq = [];
    for (var i = 0; i < 3; i++) t.seq.push(Math.floor(Math.random() * 3));
    t.mode = 'show';
  }
}

function taskSolved() {
  var t = activeTask;
  t.mode = 'opening';
  t.timer = 0;
  var notes = [523, 659, 784, 1047];
  for (var i = 0; i < notes.length; i++) {
    playNote(notes[i], 0.1 + i * 0.1, 0.35, 'triangle', 0.4);
  }
}

function handleTaskTap(px, py) {
  var t = activeTask;
  if (!t || t.mode !== 'input') return;
  var op = orbPositions(3);
  var i, dx, dy;
  for (i = 0; i < 3; i++) {
    dx = px - op.xs[i];
    dy = py - op.y;
    if (Math.sqrt(dx * dx + dy * dy) >= op.r * 1.4) continue;
    if (t.type === 'math') {
      t.litOrb = i;
      t.litT = 0.3;
      if (t.answers[i] === t.correct) {
        playNote(TASK_BF_NOTES[Math.min(i, 2)], 0, 0.3, 'triangle', 0.45);
        taskSolved();
      } else {
        playNote(170, 0, 0.3, 'sawtooth', 0.2);
        t.shakeT = 0.5;
      }
      return;
    }
    t.litOrb = i;
    t.litT = 0.35;
    if (i === t.seq[t.inputIdx]) {
      playNote(TASK_BF_NOTES[i], 0, 0.3, 'triangle', 0.45);
      t.inputIdx++;
      if (t.inputIdx >= t.seq.length) taskSolved();
    } else {
      playNote(170, 0, 0.3, 'sawtooth', 0.2);
      t.shakeT = 0.5;
      t.mode = 'show';
      t.timer = -0.9;
      t.inputIdx = 0;
      t.lastShown = -1;
    }
    return;
  }
}

function updateTasks(dt) {
  var i, t, actorX;
  if (level === 2) actorX = princess.x;
  else actorX = unicorn.x;
  if (!activeTask && !celebrating) {
    for (i = 0; i < tasks.length; i++) {
      t = tasks[i];
      if (!t.opened && Math.abs(actorX - t.x) < viewW * 0.14) {
        taskStart(t);
        break;
      }
    }
  } else if (activeTask) {
    t = activeTask;
    if (t.mode === 'show') {
      t.timer += dt;
      if (t.timer >= 0) {
        var stepLen = 0.8;
        var step = Math.floor(t.timer / stepLen);
        if (step < t.seq.length) {
          var inStep = t.timer - step * stepLen;
          t.litOrb = inStep < 0.5 ? t.seq[step] : -1;
          if (t.lastShown !== step && inStep < 0.5) {
            t.lastShown = step;
            playNote(TASK_BF_NOTES[t.seq[step]], 0, 0.35, 'triangle', 0.4);
          }
        } else {
          t.litOrb = -1;
          t.mode = 'input';
          t.inputIdx = 0;
        }
      }
    } else if (t.mode === 'opening') {
      t.timer += dt;
      if (Math.random() < dt * 16) {
        spawnSparkles(
          t.x + (Math.random() - 0.5) * viewH * 0.18,
          groundTop - Math.random() * viewH * 0.22,
          3, '#ffe27a'
        );
      }
      if (t.timer > 1.1) {
        t.opened = true;
        t.mode = 'done';
        activeTask = null;
      }
    }
    if (t.litT > 0) t.litT -= dt;
    if (t.shakeT > 0) t.shakeT -= dt;
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
  }, 2800);
}

