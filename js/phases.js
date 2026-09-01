'use strict';

// Vaiheen julkinen sauma: init, ohjaus ja seuraava seikkailu.
var PHASES = {
  start:  { level: 1, init: function () { initGame(); },   control: 'ride', usesJump: false, usesWand: false, next: 'garden', bg: '#cfe9ff' },
  garden: { level: 2, init: function () { initLevel2(); }, control: 'run',  usesJump: true,  usesWand: true,  next: 'ice',    bg: '#1a1448' },
  ice:    { level: 3, init: function () { initIce(); },    control: 'ride', usesJump: false, usesWand: false, next: 'pond',   bg: '#3d6ea8' },
  pond:   { level: 4, init: function () { initPond(); },   control: 'run',  usesJump: true,  usesWand: true,  next: 'sky',    bg: '#0a4550' },
  sky:    { level: 5, init: function () { initSky(); },    control: 'fly',  usesJump: true,  usesWand: false, next: null,     bg: '#140832' }
};

function phaseNow() {
  var k;
  for (k in PHASES) {
    if (PHASES[k].level === level) return PHASES[k];
  }
  return PHASES.start;
}
