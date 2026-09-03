'use strict';

// Vaiheen julkinen sauma. Uusi kenttä = yksi play-*.js-tiedosto + rivi tähän
// + huone HUB_ROOMS-karttaan. Silmukka, syöte ja koko kulkevat näiden koukkujen kautta:
//   init()            alustus
//   update(dt)        pelilogiikka (globalT kasvatetaan jo ennen kutsua)
//   draw()            piirto
//   tap(px, py)       napautus/kosketuksen alku (ride- ja fly-ohjaus)
//   resize(ratio)     olioiden skaalaus näytön kääntyessä (ratio = uusi/vanha maailman leveys)
//   renderBg(b, w, h) taustan esirenderöinti
//   respawn()         paluu tarkistuspisteelle (vain usesHearts-kentät)
// Kutsut kääritään funktioihin, koska osa kohteista määritellään myöhemmin ladattavissa tiedostoissa.
var PHASES = {
  start: {
    level: 1, control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
    next: 'garden', bgColor: '#cfe9ff',
    ambient: 'butterflies', fg: { kind: 'grass', color: 'rgba(40,110,55,0.7)' },
    init: function () { initGame(); },
    update: function (dt) { updateForest(dt); },
    draw: function () { drawForest(); },
    tap: function (x, y) { handleTap(x, y); },
    resize: function (ratio) { resizeForest(ratio); },
    renderBg: function (b, w, h) { renderForestBg(b, w, h); }
  },
  garden: {
    level: 2, control: 'run', usesJump: true, usesWand: true, usesHearts: false,
    next: 'ice', bgColor: '#1a1448',
    ambient: 'petals', fg: { kind: 'grass', color: 'rgba(20,60,40,0.75)' },
    init: function () { initLevel2(); },
    update: function (dt) { updateLevel2(dt); },
    draw: function () { drawLevel2(); },
    resize: function (ratio) { resizeGarden(ratio); },
    renderBg: function (b, w, h) { renderGardenBg(b, w, h); }
  },
  ice: {
    level: 3, control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
    unicornStyle: 'ice',
    next: 'pond', bgColor: '#3d6ea8',
    ambient: 'snow', fg: { kind: 'snow', color: 'rgba(255,255,255,0.8)' },
    init: function () { initIce(); },
    update: function (dt) { updateIce(dt); },
    draw: function () { drawIce(); },
    tap: function (x, y) { handleIceTap(x, y); },
    resize: function (ratio) { resizeIce(ratio); },
    renderBg: function (b, w, h) { renderIceBg(b, w, h); }
  },
  pond: {
    level: 4, control: 'run', usesJump: true, usesWand: true, usesHearts: false,
    next: 'sky', bgColor: '#0a4550',
    ambient: 'bubbles', fg: { kind: 'reeds', color: 'rgba(20,80,60,0.75)' },
    init: function () { initPond(); },
    update: function (dt) { updatePond(dt); },
    draw: function () { drawPond(); },
    resize: function (ratio) { resizePond(ratio); },
    renderBg: function (b, w, h) { renderPondBg(b, w, h); }
  },
  sky: {
    level: 5, control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: false,
    next: 'cave', bgColor: '#140832',
    ambient: 'stars', fg: null,
    init: function () { initSky(); },
    update: function (dt) { updateSky(dt); },
    draw: function () { drawSky(); },
    tap: function (x, y) { handleSkyTap(x, y); },
    resize: function (ratio) { resizeSky(ratio); },
    renderBg: function (b, w, h) { renderSkyBg(b, w, h); }
  },
  cave: {
    level: 6, control: 'run', usesJump: true, usesWand: true, usesHearts: true,
    next: 'swamp', bgColor: '#0b0a1e',
    ambient: 'dust', fg: null,
    init: function () { initCave(); },
    update: function (dt) { updateCave(dt); },
    draw: function () { drawCave(); },
    resize: function (ratio) { resizeCave(ratio); },
    renderBg: function (b, w, h) { renderCaveBg(b, w, h); },
    respawn: function () { respawnCave(); }
  },
  swamp: {
    level: 7, control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
    next: 'bridge', bgColor: '#12241c',
    ambient: 'fireflies', fg: { kind: 'reeds', color: 'rgba(20,45,30,0.85)' },
    init: function () { initSwamp(); },
    update: function (dt) { updateSwamp(dt); },
    draw: function () { drawSwamp(); },
    tap: function (x, y) { handleSwampTap(x, y); },
    resize: function (ratio) { resizeSwamp(ratio); },
    renderBg: function (b, w, h) { renderSwampBg(b, w, h); },
    respawn: function () { respawnSwamp(); }
  },
  bridge: {
    level: 8, control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
    next: null, bgColor: '#2a1f5e',
    ambient: 'sparkle', fg: null,
    init: function () { initBridge(); },
    update: function (dt) { updateBridge(dt); },
    draw: function () { drawBridge(); },
    tap: function (x, y) { handleBridgeTap(x, y); },
    resize: function (ratio) { resizeBridge(ratio); },
    renderBg: function (b, w, h) { renderBridgeBg(b, w, h); },
    respawn: function () { respawnBridge(); }
  },
  finale: {
    level: 9, control: 'run', usesJump: true, usesWand: true, usesHearts: true,
    next: null, bgColor: '#2b1040', hidden: true, sparkLife: 1.0, celebrateMs: 7000,
    ambient: 'sparkle', fg: null,
    init: function () { initFinale(); },
    update: function (dt) { updateFinale(dt); },
    draw: function () { drawFinale(); },
    resize: function (ratio) { resizeFinale(ratio); },
    renderBg: function (b, w, h) { renderFinaleBg(b, w, h); },
    respawn: function () { respawnFinale(); }
  }
};

function phaseNow() {
  var k;
  for (k in PHASES) {
    if (PHASES[k].level === level) return PHASES[k];
  }
  return PHASES.start;
}

function phaseKeyNow() {
  var k;
  for (k in PHASES) {
    if (PHASES[k].level === level) return k;
  }
  return 'start';
}
