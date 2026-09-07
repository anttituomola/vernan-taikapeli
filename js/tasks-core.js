'use strict';

// Tehtävien ajonaikainen ydin: rekisterin (TASK_TYPES) takana oleva silmukka.
// Tänne keskittyy kaikki mitä kaikki tehtävätyypit jakavat — käynnistys,
// kosketusten reititys, päivitys, pallorivi — jotta kukin tyyppi voi elää
// omassa tasks-*.js-tiedostossaan pienen rajapinnan takana.
//
// Uusi tehtävätyyppi = yksi rekisteröinti omassa tiedostossaan, ei muutoksia tänne.

// ---------- Jaetut apurit ----------

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

function otherIndex(n, count) {
  return (n + 1 + Math.floor(Math.random() * (count - 1))) % count;
}

function pickNumberAnswers(correct, extras) {
  var pool = shuffleNums([correct - 2, correct - 1, correct + 1, correct + 2].concat(extras || []));
  var wrong = [], i, n;
  for (i = 0; i < pool.length && wrong.length < 2; i++) {
    n = pool[i];
    if (n < 1 || n === correct || wrong.indexOf(n) >= 0) continue;
    wrong.push(n);
  }
  while (wrong.length < 2) {
    n = correct + wrong.length + 3;
    if (wrong.indexOf(n) < 0) wrong.push(n);
  }
  return shuffleNums([correct, wrong[0], wrong[1]]);
}

// ---------- Käynnistys ja ratkaisu ----------

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
  t.prompt = null;
  t.choices = null;
  t.regenT = 0;
  var tt = TASK_TYPES[t.type];
  if (!tt) return;
  tt.make(t);
  t.mode = tt.showMode ? 'show' : 'input';
  if (tt.start) tt.start(t);
  if (tt.pitch) playNote(tt.pitch, 0, 0.2, 'triangle', 0.35);
}

function taskSolved() {
  var t = activeTask;
  dragPiece = null;
  t.mode = 'opening';
  t.timer = 0;
  var notes = [523, 659, 784, 1047];
  for (var i = 0; i < notes.length; i++) {
    playNote(notes[i], 0.1 + i * 0.1, 0.35, 'triangle', 0.4);
  }
}

// Väärän vastauksen jälkeen arvotaan uusi tehtävä samasta tyypistä.
// Oletus: ajetaan tyypin make uudelleen; tyyppi voi korvata tämän regen-koukulla.
function regenerateTask(t) {
  var tt = TASK_TYPES[t.type];
  if (!tt) return;
  if (tt.regen) tt.regen(t);
  else tt.make(t);
  t.litOrb = -1;
  t.litT = 0;
  playNote(494, 0, 0.1, 'triangle', 0.25);
  playNote(659, 0.08, 0.14, 'triangle', 0.25);
}

// ---------- Kosketus ----------

function taskUsesDrag(t) {
  var tt = TASK_TYPES[t.type];
  return !!(tt && tt.drag);
}

// Osuiko kosketus vastauspalloon? Palauttaa pallon indeksin tai -1.
function orbHit(t, px, py) {
  var op = orbPositions(t.orbs);
  for (var i = 0; i < t.orbs; i++) {
    var dx = px - op.xs[i];
    var dy = py - op.y;
    if (Math.sqrt(dx * dx + dy * dy) < op.r * 1.4) return i;
  }
  return -1;
}

// Lukutehtävät (math, count, minus): oikea luku pallossa, väärä vain ravistaa.
function tapNumberAnswer(t, px, py) {
  var i = orbHit(t, px, py);
  if (i < 0) return;
  t.litOrb = i;
  t.litT = 0.3;
  if (t.answers[i] === t.correct) {
    playNote(TASK_BF_NOTES[Math.min(i, 3)], 0, 0.3, 'triangle', 0.45);
    taskSolved();
  } else {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
  }
}

// Valintatehtävät (match, odd, pattern): väärästä arvotaan uusi tehtävä,
// jotta arvaamalla ei pääse läpi.
function tapChoiceRegen(t, px, py) {
  var i = orbHit(t, px, py);
  if (i < 0) return;
  answerChoice(t, i, true);
}

// Jaettu valintalogiikka myös tyypeille, joilla on oma osuma-alueensa (compare).
function answerChoice(t, i, regen) {
  t.litOrb = i;
  t.litT = 0.3;
  if (i === t.correct) {
    playNote(TASK_BF_NOTES[Math.min(i, 3)], 0, 0.3, 'triangle', 0.45);
    taskSolved();
  } else {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
    if (regen) t.regenT = 0.6;
  }
}

// Muistitehtävä: toista näytetty pallosarja.
function tapMemorySeq(t, px, py) {
  var i = orbHit(t, px, py);
  if (i < 0) return;
  t.litOrb = i;
  t.litT = 0.35;
  if (i === t.seq[t.inputIdx]) {
    playNote(TASK_BF_NOTES[i], 0, 0.3, 'triangle', 0.45);
    t.inputIdx++;
    if (t.inputIdx >= t.seq.length) taskSolved();
  } else {
    // Väärin: ei rangaistusta, sarja näytetään uudelleen
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
    t.mode = 'show';
    t.timer = -0.9;
    t.inputIdx = 0;
    t.lastShown = -1;
  }
}

function handleTaskTap(px, py) {
  var t = activeTask;
  if (!t || t.mode !== 'input') return;
  var tt = TASK_TYPES[t.type];
  if (!tt) return;
  if (tt.drag) {
    taskDragStart(t, px, py);
    return;
  }
  if (tt.tap) tt.tap(t, px, py);
}

// ---------- Päivitys ----------

function updateTasks(dt) {
  var i, t, actorX;
  actorX = phaseNow().control === 'ride' ? unicorn.x : princess.x;
  if (!activeTask && !celebrating) {
    for (i = 0; i < tasks.length; i++) {
      t = tasks[i];
      if (!t.opened && Math.abs(actorX - t.x) < viewW * 0.14) {
        taskStart(t);
        break;
      }
    }
    return;
  }
  if (!activeTask) return;
  t = activeTask;
  var tt = TASK_TYPES[t.type];
  if (tt && tt.update) tt.update(t, dt);
  if (t.word && t.sayT >= 0) {
    // Sanan lukeminen (word, wordpick, build, letter): tavut korostuvat vuorotellen
    t.sayT += dt;
    if (t.sayT > wordSyllables(t).length * WORD_SYL_T + 0.3) t.sayT = -1;
  }
  if (t.regenT > 0) {
    t.regenT -= dt;
    if (t.regenT <= 0) regenerateTask(t);
  }
  if (t.mode === 'show' && !(tt && tt.replaceShow)) {
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

// ---------- Jaettu pallorivi ----------

// Piirtää vastauspallot (hehku, reunaväri) ja kutsuu contentFn:ää kunkin
// pallon sisällölle. Ilman contentFn:ää palloon piirretään perhonen.
function drawTaskOrbs(c, t, shake, op, contentFn) {
  for (var i = 0; i < t.orbs; i++) {
    var lit = t.litOrb === i && (t.mode === 'show' ? true : t.litT > 0);
    var r = op.r * (lit ? 1.16 : 1);
    var x = op.xs[i] + shake;
    var y = op.y;
    if (lit) {
      var glow = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2);
      glow.addColorStop(0, 'rgba(255,255,255,0.5)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(x, y, r * 2, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = TASK_BF_COLORS[i % TASK_BF_COLORS.length];
    c.lineWidth = viewH * 0.008;
    c.stroke();
    if (contentFn) contentFn(c, t, i, x, y, r);
    else drawButterfly(c, x, y, r * 0.42, globalT + i, TASK_BF_COLORS[i % TASK_BF_COLORS.length]);
  }
}

// ---------- Muistitehtävä (ei omaa tasks-*.js-kotia) ----------

function makeMemoryProblem(t) {
  t.seq = [];
  for (var i = 0; i < t.seqLen; i++) t.seq.push(Math.floor(Math.random() * t.orbs));
}

function drawMemoryTask(c, t, shake, op) {
  var dotR = viewH * 0.012;
  for (var i = 0; i < t.seq.length; i++) {
    c.fillStyle = i < t.inputIdx ? '#ffe27a' : 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.arc(viewW / 2 + (i - (t.seq.length - 1) / 2) * dotR * 4 + shake, op.y - op.r * 2.15, dotR, 0, Math.PI * 2);
    c.fill();
  }
  drawTaskOrbs(c, t, shake, op);
}

TASK_TYPES.memory = {
  make: makeMemoryProblem,
  showMode: true,
  tap: tapMemorySeq,
  draw: drawMemoryTask
};
