'use strict';

// WebAudio, ei äänitiedostoja
// ---------- Äänet (WebAudio, ei tiedostoja) ----------
var audioCtx = null, masterGain = null, muted = false;

function initAudio() {
  if (audioCtx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(audioCtx.destination);
}
function playNote(freq, startDelay, dur, type, vol) {
  if (!audioCtx || muted) return;
  var t0 = audioCtx.currentTime + startDelay;
  var osc = audioCtx.createOscillator();
  var g = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol || 0.5, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function soundStar(n) { // joka tähti hieman edellistä korkeampi
  var base = 620 * Math.pow(1.07, n);
  playNote(base, 0, 0.35, 'sine', 0.5);
  playNote(base * 1.5, 0.07, 0.4, 'sine', 0.35);
}
function soundBunny() {
  if (!audioCtx || muted) return;
  var t0 = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var g = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(250, t0);
  osc.frequency.linearRampToValueAtTime(620, t0 + 0.12);
  osc.frequency.linearRampToValueAtTime(420, t0 + 0.25);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.5, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  osc.connect(g); g.connect(masterGain);
  osc.start(t0); osc.stop(t0 + 0.35);
}
function soundFanfare() {
  var notes = [523, 659, 784, 1047, 784, 1047, 1319];
  for (var i = 0; i < notes.length; i++) {
    playNote(notes[i], i * 0.16, 0.5, 'triangle', 0.4);
  }
  playNote(523, 1.2, 1.2, 'sine', 0.3);
  playNote(659, 1.2, 1.2, 'sine', 0.3);
  playNote(784, 1.2, 1.2, 'sine', 0.3);
}

