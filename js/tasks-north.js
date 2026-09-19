'use strict';

// Revontulimaan lukutehtävät (Kirjainsaaren jälkeen):
//   lastletter – loppukirjain: iso kirjain kuplassa, valitse kuva jonka sana LOPPUU sillä
//   gapsyl     – puuttuva tavu: TA-?-VAS, valitse oikea tavu kolmesta
// Sana–kuva käyttää TASK_TYPES.word. Sanat TIKKUKIRJAIMIN ja tavutettuina.

function wordBare(w) {
  return w.w.replace(/-/g, '');
}
function wordLastCh(w) {
  var b = wordBare(w);
  return b.charAt(b.length - 1);
}

// ---------- Loppukirjain ----------
function makeLastLetterProblem(t) {
  var picks = pickDistinct(WORD_LIST, 4, function (w) { return wordLastCh(w); }), slot = randInt(4), i;
  var choices = [];
  for (i = 0; i < 4; i++) choices.push({ icon: picks[i].icon, w: picks[i].w, wrong: false });
  t.word = picks[slot];
  t.orbs = 4;
  t.sayT = -1;
  return { letter: wordLastCh(picks[slot]), choices: choices, correct: slot };
}

function drawLastLetterPrompt(c, t, shake) {
  var h = viewH * 0.17, cx = viewW / 2 + shake, cy = viewH * 0.22;
  drawPromptBubble(c, cx, cy, h * 1.8, h);
  readFont(c, h * 0.55);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#c9a0ff';
  c.fillText('…', cx - h * 0.45, cy + h * 0.04);
  c.fillStyle = t.sayT >= 0 ? '#ff5f7e' : '#8a2be2';
  readFont(c, h * 0.7);
  c.fillText(t.data.letter, cx + h * 0.25, cy + h * 0.04);
  c.textBaseline = 'alphabetic';
}

function tapLastLetterTask(t, px, py) {
  var h = viewH * 0.17;
  if (Math.abs(px - viewW / 2) < h * 0.9 && Math.abs(py - viewH * 0.22) < h / 2) {
    t.sayT = 0;
    playNote(523, 0, 0.35, 'triangle', 0.3);
    return;
  }
  var i = orbHit(t, px, py);
  if (i < 0) return;
  if (t.data.choices[i].wrong) return;
  t.litOrb = i;
  t.litT = 0.3;
  if (i === t.data.correct) {
    wordSay(t);
    taskSolved();
  } else {
    playNote(170, 0, 0.3, 'sawtooth', 0.2);
    t.shakeT = 0.5;
    t.data.choices[i].wrong = true;
  }
}

TASK_TYPES.lastletter = {
  make: makeLastLetterProblem, pitch: 698,
  tap: tapLastLetterTask,
  draw: function (c, t, shake, op) {
    drawLastLetterPrompt(c, t, shake);
    drawTaskOrbs(c, t, shake, op, orbWordIconContent);
  }
};

// ---------- Puuttuva tavu ----------
function makeGapsylProblem(t) {
  var pool = wordsBySyl(2, 3), word, syls, hide, i, others, choices, cards;
  word = pool[randInt(pool.length)] || WORD_LIST[0];
  syls = word.w.split('-');
  hide = syls.length >= 3 ? 1 : syls.length - 1;
  others = [];
  for (i = 0; i < WORD_LIST.length; i++) {
    cards = WORD_LIST[i].w.split('-');
    for (var k = 0; k < cards.length; k++) {
      if (cards[k] !== syls[hide] && others.indexOf(cards[k]) < 0) others.push(cards[k]);
    }
  }
  others = shuffleNums(others);
  choices = shuffleNums([syls[hide], others[0] || 'TA', others[1] || 'LI']);
  t.word = word;
  t.orbs = 0;
  t.sayT = -1;
  return { syls: syls, hide: hide, choices: choices, correct: choices.indexOf(syls[hide]), picked: -1 };
}

function gapsylCardRect(i) {
  var h = viewH * 0.14, w = viewH * 0.28, gap = viewW * 0.32;
  return { x: viewW / 2 + (i - 1) * gap, y: viewH * 0.62, w: w, h: h };
}

function drawGapsylOverlay(c, t, shake) {
  var d = t.data, i, s, shown, rc, sayIdx = t.sayT >= 0 ? Math.floor(t.sayT / WORD_SYL_T) : -1;
  var cx = viewW / 2 + shake, cy = viewH * 0.26;
  shown = [];
  for (i = 0; i < d.syls.length; i++) shown.push(i === d.hide ? '?' : d.syls[i]);
  drawPromptBubble(c, cx, cy, viewH * 0.5, viewH * 0.2);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.arc(cx - viewH * 0.16, cy, viewH * 0.078, 0, Math.PI * 2); c.fill();
  drawWordIcon(c, t.word.icon, cx - viewH * 0.16, cy, viewH * 0.078);
  drawWordCard(c, cx + viewH * 0.1, cy, Math.min(viewW * 0.42, viewH * 0.4), viewH * 0.13, shown.join('-'),
    sayIdx, false, false);
  for (i = 0; i < d.choices.length; i++) {
    rc = gapsylCardRect(i);
    s = d.choices[i];
    drawWordCard(c, rc.x + shake, rc.y, rc.w, rc.h, s, -1, false, d.picked === i);
  }
}

function tapGapsylTask(t, px, py) {
  var i, rc, d = t.data;
  if (Math.abs(px - viewW / 2) < viewH * 0.25 && Math.abs(py - viewH * 0.26) < viewH * 0.1) {
    wordSay(t);
    return;
  }
  for (i = 0; i < d.choices.length; i++) {
    rc = gapsylCardRect(i);
    if (px < rc.x - rc.w / 2 || px > rc.x + rc.w / 2 || py < rc.y - rc.h / 2 || py > rc.y + rc.h / 2) continue;
    d.picked = i;
    t.litT = 0.3;
    if (i === d.correct) {
      wordSay(t);
      taskSolved();
    } else {
      playNote(170, 0, 0.3, 'sawtooth', 0.2);
      t.shakeT = 0.5;
    }
    return;
  }
}

TASK_TYPES.gapsyl = {
  make: makeGapsylProblem, start: wordSay,
  tap: tapGapsylTask,
  draw: drawGapsylOverlay
};
