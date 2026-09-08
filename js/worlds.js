'use strict';

// Saarirekisteri: pelin ainoa totuus maailmoista. Uusi saari = yksi WORLDS-alkio,
// uusi kenttä = yksi levels-alkio + play-*.js-tiedosto. Kaikki muu johdetaan:
//   PHASES         kentän julkinen sauma (init/update/draw/tap/resize/renderBg/respawn)
//   HUB_WORLDS     sokkelon kartta, huoneet ja järjestys (room-kentistä)
//   ISLANDS        saaristokartan saaret (island-kentästä)
//   scriptManifest index.html:n latauslista (script-kentistä)
// Kentän koukut: init() alustus, update(dt) logiikka, draw() piirto,
// tap(px, py) kosketus, resize(ratio) skaalaus, renderBg(b, w, h) tausta,
// respawn() paluu tarkistuspisteelle (vain usesHearts-kentät).
// Kutsut kääritään funktioihin, koska osa kohteista määritellään myöhemmin
// ladattavissa tiedostoissa.
var WORLDS = [
  {
    id: 1, name: 'Linnasaari',
    island: { fx: 0.24, fy: 0.70, size: 1.0, finaleKind: 'finale', deco: 'castle' },
    map: [
      '#############',
      '#B.........1#',
      '###########.#',
      '#2..........#',
      '#.###########',
      '#..........b#',
      '###########.#',
      '#.....d...c.#',
      '#.###########',
      '#e..........#',
      '###########.#',
      '#G....g...f.#',
      '#############'
    ],
    levels: [
      {
        kind: 'start', room: '1', name: 'Metsä', color: '#5dbe5a', script: 'play-forest',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#cfe9ff', ambient: 'butterflies', fg: { kind: 'grass', color: 'rgba(40,110,55,0.7)' },
        init: function () { initGame(); },
        update: function (dt) { updateForest(dt); },
        draw: function () { drawForest(); },
        tap: function (x, y) { handleTap(x, y); },
        resize: function (ratio) { resizeForest(ratio); },
        renderBg: function (b, w, h) { renderForestBg(b, w, h); }
      },
      {
        kind: 'garden', room: '2', name: 'Puutarha', color: '#8a5cff', script: 'play-garden',
        control: 'run', usesJump: true, usesWand: true, usesHearts: false,
        bgColor: '#1a1448', ambient: 'petals', fg: { kind: 'grass', color: 'rgba(20,60,40,0.75)' },
        init: function () { initLevel2(); },
        update: function (dt) { updateLevel2(dt); },
        draw: function () { drawLevel2(); },
        resize: function (ratio) { resizeGarden(ratio); },
        renderBg: function (b, w, h) { renderGardenBg(b, w, h); }
      },
      {
        kind: 'ice', room: 'b', name: 'Jää', color: '#8ecbff', script: 'play-ice',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        unicornStyle: 'ice',
        bgColor: '#3d6ea8', ambient: 'snow', fg: { kind: 'snow', color: 'rgba(255,255,255,0.8)' },
        init: function () { initIce(); },
        update: function (dt) { updateIce(dt); },
        draw: function () { drawIce(); },
        tap: function (x, y) { handleIceTap(x, y); },
        resize: function (ratio) { resizeIce(ratio); },
        renderBg: function (b, w, h) { renderIceBg(b, w, h); }
      },
      {
        kind: 'pond', room: 'c', name: 'Lampi', color: '#3ecfb0', script: 'play-pond',
        control: 'run', usesJump: true, usesWand: true, usesHearts: false,
        bgColor: '#0a4550', ambient: 'bubbles', fg: { kind: 'reeds', color: 'rgba(20,80,60,0.75)' },
        init: function () { initPond(); },
        update: function (dt) { updatePond(dt); },
        draw: function () { drawPond(); },
        resize: function (ratio) { resizePond(ratio); },
        renderBg: function (b, w, h) { renderPondBg(b, w, h); }
      },
      {
        kind: 'sky', room: 'd', name: 'Taivas', color: '#7a5cff', script: 'play-sky',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: false,
        bgColor: '#140832', ambient: 'stars', fg: null,
        init: function () { initSky(); },
        update: function (dt) { updateSky(dt); },
        draw: function () { drawSky(); },
        tap: function (x, y) { handleSkyTap(x, y); },
        resize: function (ratio) { resizeSky(ratio); },
        renderBg: function (b, w, h) { renderSkyBg(b, w, h); }
      },
      {
        kind: 'cave', room: 'e', name: 'Kristalliluola', color: '#4a3f8a', script: 'play-cave',
        control: 'run', usesJump: true, usesWand: true, usesHearts: true,
        bgColor: '#0b0a1e', ambient: 'dust', fg: null,
        init: function () { initCave(); },
        update: function (dt) { updateCave(dt); },
        draw: function () { drawCave(); },
        resize: function (ratio) { resizeCave(ratio); },
        renderBg: function (b, w, h) { renderCaveBg(b, w, h); },
        respawn: function () { respawnCave(); }
      },
      {
        kind: 'swamp', room: 'f', name: 'Noidan suo', color: '#3e7a4c', script: 'play-swamp',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#12241c', ambient: 'fireflies', fg: { kind: 'reeds', color: 'rgba(20,45,30,0.85)' },
        init: function () { initSwamp(); },
        update: function (dt) { updateSwamp(dt); },
        draw: function () { drawSwamp(); },
        tap: function (x, y) { handleSwampTap(x, y); },
        resize: function (ratio) { resizeSwamp(ratio); },
        renderBg: function (b, w, h) { renderSwampBg(b, w, h); },
        respawn: function () { respawnSwamp(); }
      },
      {
        kind: 'bridge', room: 'g', name: 'Sateenkaarisilta', color: '#ff8fc0', script: 'play-bridge',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
        bgColor: '#2a1f5e', ambient: 'sparkle', fg: null,
        init: function () { initBridge(); },
        update: function (dt) { updateBridge(dt); },
        draw: function () { drawBridge(); },
        tap: function (x, y) { handleBridgeTap(x, y); },
        resize: function (ratio) { resizeBridge(ratio); },
        renderBg: function (b, w, h) { renderBridgeBg(b, w, h); },
        respawn: function () { respawnBridge(); }
      },
      {
        kind: 'finale', script: 'play-finale',
        control: 'run', usesJump: true, usesWand: true, usesHearts: true,
        hidden: true, sparkLife: 1.0, celebrateMs: 7000,
        bgColor: '#2b1040', ambient: 'sparkle', fg: null,
        init: function () { initFinale(); },
        update: function (dt) { updateFinale(dt); },
        draw: function () { drawFinale(); },
        resize: function (ratio) { resizeFinale(ratio); },
        renderBg: function (b, w, h) { renderFinaleBg(b, w, h); },
        respawn: function () { respawnFinale(); }
      }
    ]
  },
  {
    id: 2, name: 'Karkkisaari',
    island: { fx: 0.55, fy: 0.58, size: 0.82, finaleKind: 'tower', deco: ['beach', 'candy', 'lollipop', 'tower'] },
    map: [
      '###########',
      '#B.......h#',
      '#########.#',
      '#j........#',
      '#.#########',
      '#........a#',
      '#########.#',
      '#k........#',
      '###########'
    ],
    levels: [
      {
        kind: 'beach', room: 'h', name: 'Rannikko', color: '#ffcf6b', script: 'play-beach',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#7fd0ff', ambient: 'sparkle', fg: { kind: 'snow', color: 'rgba(235,205,140,0.85)' },
        init: function () { initBeach(); },
        update: function (dt) { updateBeach(dt); },
        draw: function () { drawBeach(); },
        tap: function (x, y) { handleBeachTap(x, y); },
        resize: function (ratio) { resizeBeach(ratio); },
        renderBg: function (b, w, h) { renderBeachBg(b, w, h); },
        respawn: function () { respawnBeach(); }
      },
      {
        kind: 'candy', room: 'j', name: 'Karkkilaakso', color: '#ff8fd0', script: 'play-candy',
        control: 'run', usesJump: true, usesWand: false, usesHearts: true,
        bgColor: '#ffd9ec', ambient: 'petals', fg: { kind: 'grass', color: 'rgba(200,80,140,0.6)' },
        init: function () { initCandy(); },
        update: function (dt) { updateCandy(dt); },
        draw: function () { drawCandy_(); },
        resize: function (ratio) { resizeCandy(ratio); },
        renderBg: function (b, w, h) { renderCandyBg(b, w, h); },
        respawn: function () { respawnCandy(); }
      },
      {
        kind: 'lollipop', room: 'a', name: 'Tikkumetsä', color: '#ff6b9d', script: 'play-lollipop',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#ffc4e0', ambient: 'petals', fg: { kind: 'grass', color: 'rgba(200,80,140,0.6)' },
        init: function () { initLollipop(); },
        update: function (dt) { updateLollipop(dt); },
        draw: function () { drawLollipop(); },
        tap: function (x, y) { handleLollipopTap(x, y); },
        resize: function (ratio) { resizeLollipop(ratio); },
        renderBg: function (b, w, h) { renderLollipopBg(b, w, h); },
        respawn: function () { respawnLollipop(); }
      },
      {
        kind: 'tower', room: 'k', name: 'Arvoitusten torni', color: '#9b7bff', script: 'play-tower',
        control: 'run', usesJump: true, usesWand: false, usesHearts: true,
        bgColor: '#241c48', ambient: 'dust', fg: null,
        init: function () { initTower(); },
        update: function (dt) { updateTower(dt); },
        draw: function () { drawTower(); },
        resize: function (ratio) { resizeTower(ratio); },
        renderBg: function (b, w, h) { renderTowerBg(b, w, h); },
        respawn: function () { respawnTower(); }
      }
    ]
  },
  {
    id: 3, name: 'Kuutamosaari',
    island: { fx: 0.84, fy: 0.76, size: 0.82, finaleKind: 'moon', deco: ['reef', 'nightwood', 'clouds'] },
    map: [
      '###########',
      '#B.......m#',
      '#########.#',
      '#n........#',
      '#.#########',
      '#o.......p#',
      '###########'
    ],
    levels: [
      {
        kind: 'reef', room: 'm', name: 'Merenpohja', color: '#2f9fd6', script: 'play-reef',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
        bgColor: '#0b3a6b', ambient: 'bubbles', fg: { kind: 'reeds', color: 'rgba(15,70,95,0.75)' },
        init: function () { initReef(); },
        update: function (dt) { updateReef(dt); },
        draw: function () { drawReef(); },
        tap: function (x, y) { handleReefTap(x, y); },
        resize: function (ratio) { resizeReef(ratio); },
        renderBg: function (b, w, h) { renderReefBg(b, w, h); },
        respawn: function () { respawnReef(); }
      },
      {
        kind: 'nightwood', room: 'n', name: 'Kuutamometsä', color: '#3b3f8c', script: 'play-nightwood',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#0b1030', ambient: 'fireflies', fg: { kind: 'grass', color: 'rgba(16,26,60,0.9)' },
        init: function () { initNightwood(); },
        update: function (dt) { updateNightwood(dt); },
        draw: function () { drawNightwood(); },
        tap: function (x, y) { handleNightwoodTap(x, y); },
        resize: function (ratio) { resizeNightwood(ratio); },
        renderBg: function (b, w, h) { renderNightwoodBg(b, w, h); },
        respawn: function () { respawnNightwood(); }
      },
      {
        kind: 'clouds', room: 'o', name: 'Pilvipolku', color: '#a9c8ff', script: 'play-clouds',
        control: 'run', usesJump: true, usesWand: false, usesHearts: true,
        bgColor: '#3b3f8c', ambient: 'sparkle', fg: null,
        init: function () { initClouds(); },
        update: function (dt) { updateClouds(dt); },
        draw: function () { drawClouds(); },
        resize: function (ratio) { resizeClouds(ratio); },
        renderBg: function (b, w, h) { renderCloudsBg(b, w, h); },
        respawn: function () { respawnClouds(); }
      },
      {
        kind: 'moon', room: 'p', name: 'Kuun vartija', color: '#6b5fb0', script: 'play-moon',
        control: 'run', usesJump: true, usesWand: false, usesHearts: true, celebrateMs: 5000,
        bgColor: '#0a0a2a', ambient: 'stars', fg: null,
        init: function () { initMoon(); },
        update: function (dt) { updateMoon(dt); },
        draw: function () { drawMoon(); },
        resize: function (ratio) { resizeMoon(ratio); },
        renderBg: function (b, w, h) { renderMoonBg(b, w, h); },
        respawn: function () { respawnMoon(); }
      }
    ]
  },
  {
    id: 4, name: 'Taikakynän saari',
    island: { fx: 0.90, fy: 0.47, size: 0.62, finaleKind: 'scribble', deco: ['pen', 'rain', 'bunnybridge'] },
    map: [
      '###########',
      '#B.......q#',
      '#########.#',
      '#r........#',
      '#.#########',
      '#s.......t#',
      '###########'
    ],
    levels: [
      {
        kind: 'pen', room: 'q', name: 'Taikakynä', color: '#8a4dff', script: 'play-pen',
        control: 'draw', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#fdf6e3', ambient: 'sparkle', fg: null,
        init: function () { initPen(); },
        update: function (dt) { updatePen(dt); },
        draw: function () { drawPen(); },
        tap: function (x, y) { penStart(x, y); },
        resize: function (ratio) { resizePen(ratio); },
        renderBg: function (b, w, h) { renderPenBg(b, w, h); },
        respawn: function () { respawnPen(); }
      },
      {
        kind: 'rain', room: 'r', name: 'Sadesuoja', color: '#6f8fc8', script: 'play-rain',
        control: 'draw', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#e9eef7', ambient: null, fg: null,
        init: function () { initRain(); },
        update: function (dt) { updateRain(dt); },
        draw: function () { drawRain(); },
        tap: function (x, y) { penStart(x, y); },
        resize: function (ratio) { resizeRain(ratio); },
        renderBg: function (b, w, h) { renderRainBg(b, w, h); },
        respawn: function () { respawnRain(); }
      },
      {
        kind: 'bunnybridge', room: 's', name: 'Pupusilta', color: '#ff8fc0', script: 'play-bunnybridge',
        control: 'draw', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#f3f7e8', ambient: 'butterflies', fg: null,
        init: function () { initBunnyBridge(); },
        update: function (dt) { updateBunnyBridge(dt); },
        draw: function () { drawBunnyBridge(); },
        tap: function (x, y) { penStart(x, y); },
        resize: function (ratio) { resizeBunnyBridge(ratio); },
        renderBg: function (b, w, h) { renderBunnyBridgeBg(b, w, h); },
        respawn: function () { respawnBunnyBridge(); }
      },
      {
        kind: 'scribble', room: 't', name: 'Sotkumörkö', color: '#5a4a7a', script: 'play-scribble',
        control: 'draw', usesJump: false, usesWand: false, usesHearts: true, celebrateMs: 5000,
        bgColor: '#f2ecf7', ambient: 'dust', fg: null,
        init: function () { initScribble(); },
        update: function (dt) { updateScribble(dt); },
        draw: function () { drawScribble(); },
        tap: function (x, y) { penStart(x, y); },
        resize: function (ratio) { resizeScribble(ratio); },
        renderBg: function (b, w, h) { renderScribbleBg(b, w, h); },
        respawn: function () { respawnScribble(); }
      }
    ]
  },
  {
    id: 5, name: 'Hoivasaari',
    island: { fx: 0.11, fy: 0.46, size: 0.6, finaleKind: 'kitchen', deco: ['herd', 'berry', 'cafe', 'kitchen'] },
    map: [
      '###########',
      '#B.......u#',
      '#########.#',
      '#i........#',
      '#.#########',
      '#l.......v#',
      '###########'
    ],
    levels: [
      {
        kind: 'herd', room: 'u', name: 'Pupupaimen', color: '#8fd97a', script: 'play-herd',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#c9f0ff', ambient: 'butterflies', fg: { kind: 'grass', color: 'rgba(60,140,60,0.7)' },
        init: function () { initHerd(); },
        update: function (dt) { updateHerd(dt); },
        draw: function () { drawHerd(); },
        tap: function (x, y) { handleHerdTap(x, y); },
        resize: function (ratio) { resizeHerd(ratio); },
        renderBg: function (b, w, h) { renderHerdBg(b, w, h); },
        respawn: function () { respawnHerd(); }
      },
      {
        kind: 'berry', room: 'i', name: 'Marjaniitty', color: '#e06080', script: 'play-berry',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#dff4ff', ambient: 'butterflies', fg: { kind: 'grass', color: 'rgba(60,140,60,0.7)' },
        init: function () { initBerry(); },
        update: function (dt) { updateBerry(dt); },
        draw: function () { drawBerry(); },
        tap: function (x, y) { handleBerryTap(x, y); },
        resize: function (ratio) { resizeBerry(ratio); },
        renderBg: function (b, w, h) { renderBerryBg(b, w, h); },
        respawn: function () { respawnBerry(); }
      },
      {
        kind: 'cafe', room: 'l', name: 'Pupukahvila', color: '#d9a05f', script: 'play-cafe',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#ffe0d0', ambient: 'sparkle', fg: null,
        init: function () { initCafe(); },
        update: function (dt) { updateCafe(dt); },
        draw: function () { drawCafe(); },
        tap: function (x, y) { handleCafeTap(x, y); },
        resize: function () { resizeCafe(); },
        renderBg: function (b, w, h) { renderCafeBg(b, w, h); },
        respawn: function () { respawnCafe(); }
      },
      {
        kind: 'kitchen', room: 'v', name: 'Taikakeittiö', color: '#ff9f3a', script: 'play-kitchen',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 4000,
        bgColor: '#f7e6d2', ambient: 'sparkle', fg: null,
        init: function () { initKitchen(); },
        update: function (dt) { updateKitchen(dt); },
        draw: function () { drawKitchen(); },
        tap: function (x, y) { handleKitchenTap(x, y); },
        resize: function (ratio) { resizeKitchen(ratio); },
        renderBg: function (b, w, h) { renderKitchenBg(b, w, h); },
        respawn: function () { respawnKitchen(); }
      }
    ]
  },
  {
    id: 6, name: 'Vuorisaari',
    island: { fx: 0.40, fy: 0.46, size: 0.62, finaleKind: 'summit', deco: ['mine', 'rapids', 'lighthouse'] },
    map: [
      '###########',
      '#B.......w#',
      '#########.#',
      '#x........#',
      '#.#########',
      '#y.......z#',
      '###########'
    ],
    levels: [
      {
        kind: 'mine', room: 'w', name: 'Kaivos', color: '#8a6a4a', script: 'play-mine',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#2a1f2e', ambient: 'dust', fg: null,
        init: function () { initMine(); },
        update: function (dt) { updateMine(dt); },
        draw: function () { drawMine(); },
        tap: function (x, y) { handleMineTap(x, y); },
        resize: function (ratio) { resizeMine(ratio); },
        renderBg: function (b, w, h) { renderMineBg(b, w, h); },
        respawn: function () { respawnMine(); }
      },
      {
        kind: 'rapids', room: 'x', name: 'Koski', color: '#3aa0d8', script: 'play-rapids',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#3aa0d8', ambient: null, fg: null,
        init: function () { initRapids('logs'); },
        update: function (dt) { updateRapids(dt); },
        draw: function () { drawRapids(); },
        tap: function (x, y) { handleRapidsTap(x, y); },
        resize: function (ratio) { resizeRapids(ratio); },
        renderBg: function (b, w, h) { renderRapidsBg(b, w, h); },
        respawn: function () { respawnRapids(); }
      },
      {
        kind: 'lighthouse', room: 'y', name: 'Majakka', color: '#ff6b6b', script: 'play-lighthouse',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 4000,
        bgColor: '#ffd9a8', ambient: 'sparkle', fg: null,
        init: function () { initLighthouse(); },
        update: function (dt) { updateLighthouse(dt); },
        draw: function () { drawLighthouse(); },
        tap: function (x, y) { handleLighthouseTap(x, y); },
        resize: function (ratio) { resizeLighthouse(ratio); },
        renderBg: function (b, w, h) { renderLighthouseBg(b, w, h); },
        respawn: function () { respawnLighthouse(); }
      },
      {
        kind: 'summit', room: 'z', name: 'Tuulenhuippu', color: '#9fd0ff', script: 'play-summit',
        control: 'run', usesJump: true, usesWand: false, usesHearts: true, celebrateMs: 5000,
        bgColor: '#cfe6ff', ambient: 'snow', fg: { kind: 'snow', color: 'rgba(255,255,255,0.85)' },
        init: function () { initSummit(); },
        update: function (dt) { updateSummit(dt); },
        draw: function () { drawSummit(); },
        resize: function (ratio) { resizeSummit(ratio); },
        renderBg: function (b, w, h) { renderSummitBg(b, w, h); },
        respawn: function () { respawnSummit(); }
      }
    ]
  },
  {
    id: 7, name: 'Kirjainsaari',
    island: { fx: 0.68, fy: 0.43, size: 0.58, finaleKind: 'letterclouds', deco: ['letterfield', 'sylrapids', 'wordshop'] },
    map: [
      '###########',
      '#B.......A#',
      '#########.#',
      '#C........#',
      '#.#########',
      '#D.......E#',
      '###########'
    ],
    levels: [
      {
        kind: 'letterfield', room: 'A', name: 'Kirjainniitty', color: '#9fd97a', script: 'play-letterfield',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#d9f3ff', ambient: 'butterflies', fg: { kind: 'grass', color: 'rgba(60,140,60,0.7)' },
        init: function () { initLetterfield(); },
        update: function (dt) { updateLetterfield(dt); },
        draw: function () { drawLetterfield(); },
        tap: function (x, y) { handleLetterfieldTap(x, y); },
        resize: function (ratio) { resizeLetterfield(ratio); },
        renderBg: function (b, w, h) { renderLetterfieldBg(b, w, h); },
        respawn: function () { respawnLetterfield(); }
      },
      {
        kind: 'sylrapids', room: 'C', name: 'Tavukoski', color: '#4fa8e0', script: 'play-rapids',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#3aa0d8', ambient: null, fg: null,
        init: function () { initRapids('syl'); },
        update: function (dt) { updateRapids(dt); },
        draw: function () { drawRapids(); },
        tap: function (x, y) { handleRapidsTap(x, y); },
        resize: function (ratio) { resizeRapids(ratio); },
        renderBg: function (b, w, h) { renderRapidsBg(b, w, h); },
        respawn: function () { respawnRapids(); }
      },
      {
        kind: 'wordshop', room: 'D', name: 'Sanapaja', color: '#c9a0ff', script: 'play-wordshop',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 4000,
        bgColor: '#f3e6ff', ambient: 'sparkle', fg: null,
        init: function () { initWordshop(); },
        update: function (dt) { updateWordshop(dt); },
        draw: function () { drawWordshop(); },
        tap: function (x, y) { handleWordshopTap(x, y); },
        resize: function (ratio) { resizeWordshop(ratio); },
        renderBg: function (b, w, h) { renderWordshopBg(b, w, h); },
        respawn: function () { respawnWordshop(); }
      },
      {
        kind: 'letterclouds', room: 'E', name: 'Kirjainpilvet', color: '#8fc8ff', script: 'play-rapids',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true, celebrateMs: 5000,
        bgColor: '#8fc8ff', ambient: 'sparkle', fg: null,
        init: function () { initRapids('letters'); },
        update: function (dt) { updateRapids(dt); },
        draw: function () { drawRapids(); },
        tap: function (x, y) { handleRapidsTap(x, y); },
        resize: function (ratio) { resizeRapids(ratio); },
        renderBg: function (b, w, h) { renderRapidsBg(b, w, h); },
        respawn: function () { respawnRapids(); }
      }
    ]
  }
];

// Johdetut näkymät rekisteriin. Älä muokkaa näitä käsin — muuta WORLDS-listaa.
var PHASES = {};
var HUB_WORLDS = {};
var ISLANDS = [];
(function () {
  var lvl = 0, wi, li, ni, w, lv, p, rooms, order, nxt;
  for (wi = 0; wi < WORLDS.length; wi++) {
    w = WORLDS[wi];
    rooms = {};
    order = [];
    for (li = 0; li < w.levels.length; li++) {
      lv = w.levels[li];
      lvl++;
      p = {
        level: lvl, control: lv.control, usesJump: lv.usesJump,
        usesWand: lv.usesWand, usesHearts: lv.usesHearts,
        next: null, bgColor: lv.bgColor,
        ambient: lv.ambient, fg: lv.fg,
        init: lv.init, update: lv.update, draw: lv.draw,
        resize: lv.resize, renderBg: lv.renderBg
      };
      if (lv.tap) p.tap = lv.tap;
      if (lv.respawn) p.respawn = lv.respawn;
      if (lv.jumpKind) p.jumpKind = lv.jumpKind;
      if (lv.unicornStyle) p.unicornStyle = lv.unicornStyle;
      if (lv.celebrateMs) p.celebrateMs = lv.celebrateMs;
      if (lv.hidden) p.hidden = true;
      if (lv.sparkLife !== undefined) p.sparkLife = lv.sparkLife;
      PHASES[lv.kind] = p;
      if (lv.room) {
        rooms[lv.room] = { kind: lv.kind, name: lv.name, color: lv.color };
        order.push(lv.kind);
      }
    }
    // next = seuraava ei-piilotettu kenttä samassa maailmassa (finaali jää ketjun ulkopuolelle)
    for (li = 0; li < w.levels.length; li++) {
      if (w.levels[li].hidden) continue;
      nxt = null;
      for (ni = li + 1; ni < w.levels.length; ni++) {
        if (!w.levels[ni].hidden) { nxt = w.levels[ni].kind; break; }
      }
      PHASES[w.levels[li].kind].next = nxt;
    }
    HUB_WORLDS[w.id] = { map: w.map, rooms: rooms, order: order };
    ISLANDS.push({
      world: w.id, name: w.name,
      fx: w.island.fx, fy: w.island.fy, size: w.island.size,
      finaleKind: w.island.finaleKind, deco: w.island.deco
    });
  }
})();

// Skriptien latauslista: ydin ensin (state aina 1.), kenttäskriptit rekisterin
// järjestyksessä (kukin kerran), pääsilmukka viimeisenä (main aina vika).
function scriptManifest() {
  var files = [
    'state', 'audio', 'progress', 'world', 'draw-actors', 'fx', 'ambient',
    'flow-hub', 'flow-sea', 'flow-home',
    'tasks-core', 'tasks-extra', 'tasks-drag', 'tasks-mix', 'tasks-more', 'tasks-read',
    'platformer', 'pen-core'
  ];
  var seen = {}, wi, li, s;
  for (wi = 0; wi < WORLDS.length; wi++) {
    for (li = 0; li < WORLDS[wi].levels.length; li++) {
      s = WORLDS[wi].levels[li].script;
      if (s && !seen[s]) {
        seen[s] = true;
        files.push(s);
      }
    }
  }
  files.push('update-draw', 'main');
  return files;
}

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
