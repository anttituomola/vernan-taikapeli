'use strict';

// Saarirekisteri: pelin ainoa totuus maailmoista. Uusi saari = yksi WORLDS-alkio,
// uusi kenttä = yksi levels-alkio + play-*.js-tiedosto. Kaikki muu johdetaan:
//   PHASES         kentän julkinen sauma (init/update/draw/tap/resize/renderBg/respawn)
//   HUB_WORLDS     sokkelon kartta, huoneet ja järjestys (room-kentistä)
//   ISLANDS        saaristokartan saaret (island-kentästä)
//   scriptManifest index.html:n latauslista (script-kentistä)
// Kentän koukut: init() alustus, update(dt) logiikka, draw() piirto,
// tap(px, py) kosketus, resize(ratio) skaalaus, renderBg(b, w, h) tausta,
// renderBgLayers() valinnainen parallaksi: [{ speed, render(b, w, h) }],
// light valinnainen valaistus { rays, tint, vignette } (ambient.js drawLight),
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
        renderBg: function (b, w, h) { renderForestBg(b, w, h); },
        renderBgLayers: function () { return forestLayers(); },
        light: { rays: true, tint: ['rgba(255,225,160,0.12)', 'rgba(255,190,140,0)'], vignette: 0.4 }
      },
      {
        kind: 'garden', room: '2', name: 'Puutarha', color: '#8a5cff', script: 'play-garden',
        control: 'run', usesJump: true, usesWand: true, usesHearts: false,
        bgColor: '#1a1448', ambient: 'petals', fg: { kind: 'grass', color: 'rgba(20,60,40,0.75)' },
        init: function () { initLevel2(); },
        update: function (dt) { updateLevel2(dt); },
        draw: function () { drawLevel2(); },
        resize: function (ratio) { resizeGarden(ratio); },
        renderBg: function (b, w, h) { renderGardenBg(b, w, h); },
        renderBgLayers: function () { return gardenLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.85, tint: ['rgba(70,40,130,0.16)', 'rgba(40,20,80,0.06)'], vignette: 0.55 }
      },
      {
        kind: 'ice', room: 'b', name: 'Jää', color: '#8ecbff', script: 'play-ice',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        unicornStyle: 'ice',
        bgColor: '#8ecbff', ambient: 'snow', fg: { kind: 'snow', color: 'rgba(255,255,255,0.8)' },
        init: function () { initIce(); },
        update: function (dt) { updateIce(dt); },
        draw: function () { drawIce(); },
        tap: function (x, y) { handleIceTap(x, y); },
        resize: function (ratio) { resizeIce(ratio); },
        renderBg: function (b, w, h) { renderIceBg(b, w, h); },
        renderBgLayers: function () { return iceLayers(); },
        light: { rays: true, raysColor: '#e8f4ff', raysAlpha: 0.8, tint: ['rgba(180,220,255,0.10)', 'rgba(120,170,220,0.06)'], vignette: 0.35 }
      },
      {
        kind: 'pond', room: 'c', name: 'Lampi', color: '#3ecfb0', script: 'play-pond',
        control: 'run', usesJump: true, usesWand: true, usesHearts: false,
        bgColor: '#4ec4f0', ambient: 'bubbles', fg: { kind: 'reeds', color: 'rgba(20,80,60,0.75)' },
        init: function () { initPond(); },
        update: function (dt) { updatePond(dt); },
        draw: function () { drawPond(); },
        resize: function (ratio) { resizePond(ratio); },
        renderBg: function (b, w, h) { renderPondBg(b, w, h); },
        renderBgLayers: function () { return pondLayers(); },
        light: { rays: true, tint: ['rgba(255,230,160,0.10)', 'rgba(80,180,170,0.06)'], vignette: 0.32 }
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
        renderBg: function (b, w, h) { renderSkyBg(b, w, h); },
        renderBgLayers: function () { return skyLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.85, tint: ['rgba(70,40,130,0.14)', 'rgba(40,20,80,0.06)'], vignette: 0.5 }
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
        renderBgLayers: function () { return caveLayers(); },
        light: { rays: true, raysColor: '#c8b8ff', raysAlpha: 0.55, tint: ['rgba(40,20,80,0.16)', 'rgba(10,5,30,0.10)'], vignette: 0.45 },
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
        renderBgLayers: function () { return swampLayers(); },
        light: { rays: true, raysColor: '#d8ffd0', raysAlpha: 0.7, tint: ['rgba(20,50,40,0.14)', 'rgba(10,30,20,0.08)'], vignette: 0.5 },
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
        renderBgLayers: function () { return bridgeLayers(); },
        light: { rays: true, raysColor: '#f0d8ff', raysAlpha: 0.8, tint: ['rgba(80,40,140,0.12)', 'rgba(50,20,90,0.06)'], vignette: 0.4 },
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
        renderBgLayers: function () { return finaleLayers(); },
        light: { rays: true, raysColor: '#ffe9a0', raysAlpha: 0.45, tint: ['rgba(80,30,90,0.12)', 'rgba(40,15,50,0.08)'], vignette: 0.4 },
        respawn: function () { respawnFinale(); }
      }
    ]
  },
  {
    id: 2, name: 'Karkkisaari',
    island: { fx: 0.55, fy: 0.58, size: 0.82, finaleKind: 'tower', deco: ['beach', 'candy', 'candysky', 'lollipop', 'tower'] },
    map: [
      '###########',
      '#B.......h#',
      '#########.#',
      '#j........#',
      '#.#########',
      '#........a#',
      '#########.#',
      '#c........#',
      '#.#########',
      '#........N#',
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
        renderBgLayers: function () { return beachLayers(); },
        light: { rays: true, tint: ['rgba(255,220,140,0.12)', 'rgba(80,180,220,0.06)'], vignette: 0.28 },
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
        renderBgLayers: function () { return candyLayers(); },
        light: { rays: true, raysColor: '#ffe0f0', tint: ['rgba(255,180,210,0.10)', 'rgba(255,200,160,0.06)'], vignette: 0.28 },
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
        renderBgLayers: function () { return lollipopLayers(); },
        light: { rays: true, raysColor: '#ffe0f0', tint: ['rgba(255,160,200,0.10)', 'rgba(180,230,180,0.06)'], vignette: 0.28 },
        respawn: function () { respawnLollipop(); }
      },
      {
        kind: 'candysky', room: 'c', name: 'Karkkitaivas', color: '#ff9fd0', script: 'play-candysky',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
        bgColor: '#ffd9ec', ambient: 'petals', fg: null,
        init: function () { initCandysky(); },
        update: function (dt) { updateCandysky(dt); },
        draw: function () { drawCandysky(); },
        tap: function (x, y) { handleCandyskyTap(x, y); },
        resize: function (ratio) { resizeCandysky(ratio); },
        renderBg: function (b, w, h) { renderCandyskyBg(b, w, h); },
        renderBgLayers: function () { return candyskyLayers(); },
        light: { rays: true, raysColor: '#ffe0f0', tint: ['rgba(255,160,200,0.10)', 'rgba(255,200,230,0.06)'], vignette: 0.3 },
        respawn: function () { respawnCandysky(); }
      },
      {
        kind: 'sweetclock', room: 'N', name: 'Karkkikello', color: '#e0a060', script: 'play-sweetclock',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#ffd4ec', ambient: 'sparkle', fg: { kind: 'grass', color: 'rgba(200,120,80,0.55)' },
        init: function () { initSweetclock(); },
        update: function (dt) { updateSweetclock(dt); },
        draw: function () { drawSweetclock(); },
        tap: function (x, y) { handleSweetclockTap(x, y); },
        resize: function (ratio) { resizeSweetclock(ratio); },
        renderBg: function (b, w, h) { renderSweetclockBg(b, w, h); },
        renderBgLayers: function () { return sweetclockLayers(); },
        light: { rays: true, raysColor: '#ffe0c0', tint: ['rgba(255,180,140,0.10)', 'rgba(255,200,160,0.06)'], vignette: 0.28 },
        respawn: function () { respawnSweetclock(); }
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
        renderBgLayers: function () { return towerLayers(); },
        light: { rays: true, raysColor: '#ffe9a0', raysAlpha: 0.5, tint: ['rgba(40,20,80,0.14)', 'rgba(20,10,40,0.08)'], vignette: 0.42 },
        respawn: function () { respawnTower(); }
      }
    ]
  },
  {
    id: 3, name: 'Kuutamosaari',
    island: { fx: 0.84, fy: 0.76, size: 0.82, finaleKind: 'moon', deco: ['reef', 'nightwood', 'stars', 'clouds'] },
    map: [
      '###########',
      '#B.......m#',
      '#########.#',
      '#n........#',
      '#.#########',
      '#........o#',
      '#########.#',
      '#u........#',
      '#.#########',
      '#........L#',
      '#########.#',
      '#p........#',
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
        renderBgLayers: function () { return reefLayers(); },
        light: { rays: true, raysColor: '#c8f4ff', raysAlpha: 0.7, tint: ['rgba(40,140,200,0.12)', 'rgba(10,40,80,0.10)'], vignette: 0.4 },
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
        renderBgLayers: function () { return nightwoodLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.85, tint: ['rgba(20,30,80,0.16)', 'rgba(10,15,40,0.08)'], vignette: 0.5 },
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
        renderBgLayers: function () { return cloudsLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(140,120,220,0.10)', 'rgba(255,180,160,0.06)'], vignette: 0.32 },
        respawn: function () { respawnClouds(); }
      },
      {
        kind: 'stars', room: 'u', name: 'Tähtisumu', color: '#5a6fd0', script: 'play-stars',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#0b1030', ambient: 'stars', fg: null,
        init: function () { initStars(); },
        update: function (dt) { updateStars(dt); },
        draw: function () { drawStars(); },
        tap: function (x, y) { handleStarsTap(x, y); },
        resize: function () { resizeStars(); },
        renderBg: function (b, w, h) { renderStarsBg(b, w, h); },
        renderBgLayers: function () { return starsLayers(); },
        light: { rays: true, raysColor: '#ffe9a0', raysAlpha: 0.7, tint: ['rgba(20,30,80,0.16)', 'rgba(10,15,40,0.08)'], vignette: 0.45 },
        respawn: function () { respawnStars(); }
      },
      {
        kind: 'moonword', room: 'L', name: 'Tähtisana', color: '#c8b8ff', script: 'play-moonword',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#0b1030', ambient: 'stars', fg: { kind: 'grass', color: 'rgba(16,26,60,0.9)' },
        init: function () { initMoonword(); },
        update: function (dt) { updateMoonword(dt); },
        draw: function () { drawMoonword(); },
        tap: function (x, y) { handleMoonwordTap(x, y); },
        resize: function (ratio) { resizeMoonword(ratio); },
        renderBg: function (b, w, h) { renderMoonwordBg(b, w, h); },
        renderBgLayers: function () { return moonwordLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.8, tint: ['rgba(20,30,80,0.16)', 'rgba(10,15,40,0.08)'], vignette: 0.45 },
        respawn: function () { respawnMoonword(); }
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
        renderBgLayers: function () { return moonLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.8, tint: ['rgba(20,20,70,0.14)', 'rgba(10,10,40,0.08)'], vignette: 0.45 },
        respawn: function () { respawnMoon(); }
      }
    ]
  },
  {
    id: 4, name: 'Taikakynän saari',
    island: { fx: 0.90, fy: 0.47, size: 0.62, finaleKind: 'scribble', deco: ['pen', 'rain', 'orchard', 'bunnybridge'] },
    map: [
      '###########',
      '#B.......q#',
      '#########.#',
      '#r........#',
      '#.#########',
      '#........s#',
      '#########.#',
      '#o........#',
      '#.#########',
      '#........t#',
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
        renderBgLayers: function () { return penLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(255,230,180,0.10)', 'rgba(200,180,140,0.06)'], vignette: 0.28 },
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
        renderBgLayers: function () { return rainLayers(); },
        light: { rays: true, raysColor: '#c8d8ff', raysAlpha: 0.55, tint: ['rgba(160,180,220,0.12)', 'rgba(120,140,180,0.06)'], vignette: 0.32 },
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
        renderBgLayers: function () { return bunnyBridgeLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(200,230,160,0.10)', 'rgba(180,210,140,0.05)'], vignette: 0.28 },
        respawn: function () { respawnBunnyBridge(); }
      },
      {
        kind: 'orchard', room: 'o', name: 'Omenavarat', color: '#8fc85a', script: 'play-orchard',
        control: 'draw', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#f6f3e0', ambient: 'butterflies', fg: null,
        init: function () { initOrchard(); },
        update: function (dt) { updateOrchard(dt); },
        draw: function () { drawOrchard(); },
        tap: function (x, y) { handleOrchardTap(x, y); },
        resize: function (ratio) { resizeOrchard(ratio); },
        renderBg: function (b, w, h) { renderOrchardBg(b, w, h); },
        renderBgLayers: function () { return orchardLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(220,230,160,0.10)', 'rgba(180,200,120,0.05)'], vignette: 0.28 },
        respawn: function () { respawnOrchard(); }
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
        renderBgLayers: function () { return scribbleLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.7, tint: ['rgba(80,60,120,0.12)', 'rgba(50,40,90,0.06)'], vignette: 0.36 },
        respawn: function () { respawnScribble(); }
      }
    ]
  },
  {
    id: 5, name: 'Hoivasaari',
    island: { fx: 0.11, fy: 0.46, size: 0.6, finaleKind: 'kitchen', deco: ['herd', 'berry', 'naptime', 'cafe', 'kitchen'] },
    map: [
      '###########',
      '#B.......u#',
      '#########.#',
      '#i........#',
      '#.#########',
      '#........l#',
      '#########.#',
      '#n........#',
      '#.#########',
      '#........H#',
      '#########.#',
      '#v........#',
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
        renderBgLayers: function () { return herdLayers(); },
        light: { rays: true, tint: ['rgba(255,225,160,0.12)', 'rgba(255,190,140,0)'], vignette: 0.32 },
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
        renderBgLayers: function () { return berryLayers(); },
        light: { rays: true, tint: ['rgba(255,200,180,0.12)', 'rgba(255,160,140,0.04)'], vignette: 0.32 },
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
        renderBgLayers: function () { return cafeLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(255,200,180,0.12)', 'rgba(220,140,120,0.06)'], vignette: 0.3 },
        respawn: function () { respawnCafe(); }
      },
      {
        kind: 'naptime', room: 'n', name: 'Uniaika', color: '#9a7ab8', script: 'play-naptime',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#4a3f78', ambient: null, fg: null,
        init: function () { initNaptime(); },
        update: function (dt) { updateNaptime(dt); },
        draw: function () { drawNaptime(); },
        tap: function (x, y) { handleNaptimeTap(x, y); },
        resize: function () { resizeNaptime(); },
        renderBg: function (b, w, h) { renderNaptimeBg(b, w, h); },
        renderBgLayers: function () { return naptimeLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.8, tint: ['rgba(40,30,90,0.16)', 'rgba(20,15,50,0.08)'], vignette: 0.45 },
        respawn: function () { respawnNaptime(); }
      },
      {
        kind: 'bedtime', room: 'H', name: 'Unikello', color: '#7a6ab0', script: 'play-bedtime',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#3a2a78', ambient: 'stars', fg: { kind: 'grass', color: 'rgba(40,30,70,0.8)' },
        init: function () { initBedtime(); },
        update: function (dt) { updateBedtime(dt); },
        draw: function () { drawBedtime(); },
        tap: function (x, y) { handleBedtimeTap(x, y); },
        resize: function (ratio) { resizeBedtime(ratio); },
        renderBg: function (b, w, h) { renderBedtimeBg(b, w, h); },
        renderBgLayers: function () { return bedtimeLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.75, tint: ['rgba(40,30,90,0.16)', 'rgba(20,15,50,0.08)'], vignette: 0.42 },
        respawn: function () { respawnBedtime(); }
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
        renderBgLayers: function () { return kitchenLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(255,210,160,0.12)', 'rgba(220,160,100,0.05)'], vignette: 0.3 },
        respawn: function () { respawnKitchen(); }
      }
    ]
  },
  {
    id: 6, name: 'Vuorisaari',
    island: { fx: 0.40, fy: 0.46, size: 0.62, finaleKind: 'summit', deco: ['mine', 'rapids', 'glide', 'lighthouse'] },
    map: [
      '###########',
      '#B.......w#',
      '#########.#',
      '#x........#',
      '#.#########',
      '#........y#',
      '#########.#',
      '#g........#',
      '#.#########',
      '#........z#',
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
        renderBgLayers: function () { return mineLayers(); },
        light: { rays: true, raysColor: '#ffe9a0', raysAlpha: 0.45, tint: ['rgba(40,20,30,0.18)', 'rgba(20,10,20,0.08)'], vignette: 0.5 },
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
        renderBgLayers: function () { return rapidsLayers(); },
        light: { rays: true, raysColor: '#c8e8ff', tint: ['rgba(80,160,220,0.10)', 'rgba(40,100,160,0.05)'], vignette: 0.32 },
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
        renderBgLayers: function () { return lighthouseLayers(); },
        light: { rays: true, raysColor: '#ffe0b0', tint: ['rgba(255,180,120,0.14)', 'rgba(200,120,80,0.06)'], vignette: 0.34 },
        respawn: function () { respawnLighthouse(); }
      },
      {
        kind: 'glide', room: 'g', name: 'Kotkalento', color: '#9fc8f0', script: 'play-glide',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
        bgColor: '#cfe6ff', ambient: 'sparkle', fg: null,
        init: function () { initGlide(); },
        update: function (dt) { updateGlide(dt); },
        draw: function () { drawGlide(); },
        tap: function (x, y) { handleGlideTap(x, y); },
        resize: function (ratio) { resizeGlide(ratio); },
        renderBg: function (b, w, h) { renderGlideBg(b, w, h); },
        renderBgLayers: function () { return glideLayers(); },
        light: { rays: true, raysColor: '#c8e4ff', tint: ['rgba(140,180,220,0.10)', 'rgba(80,120,180,0.05)'], vignette: 0.32 },
        respawn: function () { respawnGlide(); }
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
        renderBgLayers: function () { return summitLayers(); },
        light: { rays: true, raysColor: '#c8e4ff', tint: ['rgba(160,190,230,0.10)', 'rgba(80,120,180,0.05)'], vignette: 0.34 },
        respawn: function () { respawnSummit(); }
      }
    ]
  },
  {
    id: 7, name: 'Kirjainsaari',
    island: { fx: 0.68, fy: 0.43, size: 0.58, finaleKind: 'letterclouds', deco: ['letterfield', 'sylrapids', 'grove', 'wordshop'] },
    map: [
      '###########',
      '#B.......A#',
      '#########.#',
      '#C........#',
      '#.#########',
      '#........D#',
      '#########.#',
      '#F........#',
      '#.#########',
      '#........E#',
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
        renderBgLayers: function () { return letterfieldLayers(); },
        light: { rays: true, tint: ['rgba(255,225,160,0.12)', 'rgba(255,190,140,0)'], vignette: 0.32 },
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
        renderBgLayers: function () { return rapidsLayers(); },
        light: { rays: true, raysColor: '#c8e8ff', tint: ['rgba(80,160,220,0.10)', 'rgba(40,100,160,0.05)'], vignette: 0.32 },
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
        renderBgLayers: function () { return wordshopLayers(); },
        light: { rays: true, raysColor: '#e8d4ff', tint: ['rgba(200,160,240,0.12)', 'rgba(140,100,200,0.05)'], vignette: 0.3 },
        respawn: function () { respawnWordshop(); }
      },
      {
        kind: 'grove', room: 'F', name: 'Kirjainpuutarha', color: '#7fc86a', script: 'play-grove',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#d9f3ff', ambient: 'butterflies', fg: null,
        init: function () { initGrove(); },
        update: function (dt) { updateGrove(dt); },
        draw: function () { drawGrove(); },
        tap: function (x, y) { handleGroveTap(x, y); },
        resize: function () { resizeGrove(); },
        renderBg: function (b, w, h) { renderGroveBg(b, w, h); },
        renderBgLayers: function () { return groveLayers(); },
        light: { rays: true, tint: ['rgba(255,225,160,0.12)', 'rgba(255,190,140,0)'], vignette: 0.32 },
        respawn: function () { respawnGrove(); }
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
        renderBgLayers: function () { return rapidsLayers(); },
        light: { rays: true, raysColor: '#c8e8ff', tint: ['rgba(80,160,220,0.10)', 'rgba(40,100,160,0.05)'], vignette: 0.32 },
        respawn: function () { respawnRapids(); }
      }
    ]
  },
  {
    // Sateenkaaren päässä: aukeaa, kun kaikki seitsemän väriä on palautettu.
    // Vartija (Taikurin teltta) kruunaa sateenkaaren kultatähdellä.
    id: 8, name: 'Tivolisaari',
    island: { fx: 0.60, fy: 0.885, size: 0.58, finaleKind: 'magician', deco: ['circus', 'balloon', 'magician'] },
    map: [
      '###########',
      '#B.......T#',
      '#########.#',
      '#R........#',
      '#.#########',
      '#........W#',
      '#########.#',
      '#P........#',
      '#.#########',
      '#........J#',
      '#########.#',
      '#O........#',
      '#.#########',
      '#........M#',
      '###########'
    ],
    levels: [
      {
        kind: 'circus', room: 'T', name: 'Sirkusteltta', color: '#e84a5a', script: 'play-circus',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#3a1030', ambient: 'sparkle', fg: null,
        init: function () { initCircus(); },
        update: function (dt) { updateCircus(dt); },
        draw: function () { drawCircus(); },
        tap: function (x, y) { handleCircusTap(x, y); },
        resize: function (ratio) { resizeCircus(ratio); },
        renderBg: function (b, w, h) { renderCircusBg(b, w, h); },
        renderBgLayers: function () { return circusLayers(); },
        light: { rays: true, raysColor: '#ffd24f', raysAlpha: 0.7, tint: ['rgba(120,20,50,0.16)', 'rgba(40,10,30,0.08)'], vignette: 0.42 },
        respawn: function () { respawnCircus(); }
      },
      {
        kind: 'trapeze', room: 'R', name: 'Trapetsi', color: '#e8c04a', script: 'play-circus',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#120c32', ambient: 'sparkle', fg: null,
        init: function () { initCircus('hard'); },
        update: function (dt) { updateCircus(dt); },
        draw: function () { drawCircus(); },
        tap: function (x, y) { handleCircusTap(x, y); },
        resize: function (ratio) { resizeCircus(ratio); },
        renderBg: function (b, w, h) { renderCircusBg(b, w, h); },
        renderBgLayers: function () { return circusLayers(); },
        light: { rays: true, raysColor: '#ffe08a', raysAlpha: 0.75, tint: ['rgba(40,20,90,0.16)', 'rgba(20,10,50,0.08)'], vignette: 0.44 },
        respawn: function () { respawnCircus(); }
      },
      {
        kind: 'wire', room: 'W', name: 'Nuorallakävely', color: '#4ec4c8', script: 'play-wire',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#162040', ambient: 'sparkle', fg: null,
        init: function () { initWire(); },
        update: function (dt) { updateWire(dt); },
        draw: function () { drawWire(); },
        tap: function (x, y) { handleWireTap(x, y); },
        resize: function (ratio) { resizeWire(ratio); },
        renderBg: function (b, w, h) { renderWireBg(b, w, h); },
        renderBgLayers: function () { return wireLayers(); },
        light: { rays: true, raysColor: '#b8f0e8', raysAlpha: 0.7, tint: ['rgba(20,40,80,0.14)', 'rgba(10,20,50,0.08)'], vignette: 0.4 },
        respawn: function () { respawnWire(); }
      },
      {
        kind: 'balloon', room: 'P', name: 'Kuumailmapallo', color: '#ff9d5c', script: 'play-balloon',
        control: 'fly', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#5a3a8a', ambient: 'stars', fg: null,
        init: function () { initBalloon(); },
        update: function (dt) { updateBalloon(dt); },
        draw: function () { drawBalloon(); },
        tap: function (x, y) { handleBalloonTap(x, y); },
        resize: function (ratio) { resizeBalloon(ratio); },
        renderBg: function (b, w, h) { renderBalloonBg(b, w, h); },
        renderBgLayers: function () { return balloonLayers(); },
        light: { rays: true, raysColor: '#ffe0b0', tint: ['rgba(120,40,90,0.14)', 'rgba(255,160,80,0.06)'], vignette: 0.38 },
        respawn: function () { respawnBalloon(); }
      },
      {
        kind: 'icecream', room: 'J', name: 'Jäätelökoju', color: '#ff8fb8', script: 'play-icecream',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 4000,
        bgColor: '#e8f6ff', ambient: 'sparkle', fg: null,
        init: function () { initIcecream(); },
        update: function (dt) { updateIcecream(dt); },
        draw: function () { drawIcecream(); },
        tap: function (x, y) { handleIcecreamTap(x, y); },
        resize: function () { resizeIcecream(); },
        renderBg: function (b, w, h) { renderIcecreamBg(b, w, h); },
        renderBgLayers: function () { return icecreamLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(255,180,200,0.10)', 'rgba(180,220,255,0.05)'], vignette: 0.3 },
        respawn: function () { respawnIcecream(); }
      },
      {
        kind: 'ducks', room: 'O', name: 'Ankkaonginta', color: '#ffc832', script: 'play-ducks',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#8ed3ff', ambient: 'butterflies', fg: null,
        init: function () { initDucks(); },
        update: function (dt) { updateDucks(dt); },
        draw: function () { drawDucks(); },
        tap: function (x, y) { handleDucksTap(x, y); },
        resize: function () { resizeDucks(); },
        renderBg: function (b, w, h) { renderDucksBg(b, w, h); },
        renderBgLayers: function () { return ducksLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(140,200,255,0.10)', 'rgba(80,160,220,0.05)'], vignette: 0.3 },
        respawn: function () { respawnDucks(); }
      },
      {
        kind: 'magician', room: 'M', name: 'Taikurin teltta', color: '#5a2a9a', script: 'play-magician',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true, celebrateMs: 6000,
        bgColor: '#0f0a2e', ambient: 'stars', fg: null,
        init: function () { initMagician(); },
        update: function (dt) { updateMagician(dt); },
        draw: function () { drawMagician(); },
        tap: function (x, y) { handleMagicianTap(x, y); },
        resize: function () { resizeMagician(); },
        renderBg: function (b, w, h) { renderMagicianBg(b, w, h); },
        renderBgLayers: function () { return magicianLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.75, tint: ['rgba(30,20,80,0.16)', 'rgba(15,10,40,0.08)'], vignette: 0.48 },
        respawn: function () { respawnMagician(); }
      }
    ]
  },
  {
    // Horisontin takana: aukeaa Tivolisaaren jälkeen. Sateenkaari jää
    // seitsemään väriin + kultatähteen; tämä saari ei lisää kaistetta.
    id: 9, name: 'Revontulimaa',
    island: { fx: 0.16, fy: 0.90, size: 0.68, finaleKind: 'foxguard', deco: ['voyage', 'aurora', 'foxguard'] },
    map: [
      '###########',
      '#B.......H#',
      '#########.#',
      '#R........#',
      '#.#########',
      '#........P#',
      '#########.#',
      '#K........#',
      '#.#########',
      '#........L#',
      '#########.#',
      '#........F#',
      '###########'
    ],
    levels: [
      {
        kind: 'voyage', room: 'H', name: 'Horisontti', color: '#3a88a8', script: 'play-voyage',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#1a4060', ambient: 'sparkle', fg: null,
        init: function () { initVoyage(); },
        update: function (dt) { updateVoyage(dt); },
        draw: function () { drawVoyage(); },
        tap: function (x, y) { handleVoyageTap(x, y); },
        resize: function (ratio) { resizeVoyage(ratio); },
        renderBg: function (b, w, h) { renderVoyageBg(b, w, h); },
        renderBgLayers: function () { return voyageLayers(); },
        light: { rays: true, raysColor: '#c8f0ff', raysAlpha: 0.7, tint: ['rgba(20,50,80,0.14)', 'rgba(10,30,50,0.08)'], vignette: 0.4 },
        respawn: function () { respawnVoyage(); }
      },
      {
        kind: 'aurora', room: 'R', name: 'Revontulipolku', color: '#7cffc4', script: 'play-aurora',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: true,
        bgColor: '#123048', ambient: 'sparkle', fg: { kind: 'snow', color: 'rgba(200,230,240,0.75)' },
        init: function () { initAurora(); },
        update: function (dt) { updateAurora(dt); },
        draw: function () { drawAurora(); },
        tap: function (x, y) { handleAuroraTap(x, y); },
        resize: function (ratio) { resizeAurora(ratio); },
        renderBg: function (b, w, h) { renderAuroraBg(b, w, h); },
        renderBgLayers: function () { return auroraLayers(); },
        light: { rays: true, raysColor: '#a8ffe0', raysAlpha: 0.75, tint: ['rgba(20,60,70,0.14)', 'rgba(10,30,50,0.08)'], vignette: 0.42 },
        respawn: function () { respawnAurora(); }
      },
      {
        kind: 'reindeer', room: 'P', name: 'Porolaakso', color: '#8a5a30', script: 'play-reindeer',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#1a3a50', ambient: 'sparkle', fg: { kind: 'snow', color: 'rgba(200,230,240,0.75)' },
        init: function () { initReindeer(); },
        update: function (dt) { updateReindeer(dt); },
        draw: function () { drawReindeer(); },
        tap: function (x, y) { handleReindeerTap(x, y); },
        resize: function (ratio) { resizeReindeer(ratio); },
        renderBg: function (b, w, h) { renderReindeerBg(b, w, h); },
        renderBgLayers: function () { return reindeerLayers(); },
        light: { rays: true, raysColor: '#ffe9c8', tint: ['rgba(30,50,70,0.12)', 'rgba(20,40,60,0.06)'], vignette: 0.36 },
        respawn: function () { respawnReindeer(); }
      },
      {
        kind: 'sled', room: 'K', name: 'Kelkkamäki', color: '#c46b3a', script: 'play-sled',
        control: 'fly', usesJump: true, jumpKind: 'flap', usesWand: false, usesHearts: true,
        bgColor: '#123048', ambient: 'sparkle', fg: null,
        init: function () { initSled(); },
        update: function (dt) { updateSled(dt); },
        draw: function () { drawSled(); },
        tap: function (x, y) { handleSledTap(x, y); },
        resize: function (ratio) { resizeSled(ratio); },
        renderBg: function (b, w, h) { renderSledBg(b, w, h); },
        renderBgLayers: function () { return sledLayers(); },
        light: { rays: true, raysColor: '#c8f0ff', tint: ['rgba(30,50,80,0.12)', 'rgba(20,40,70,0.06)'], vignette: 0.38 },
        respawn: function () { respawnSled(); }
      },
      {
        kind: 'snowword', room: 'L', name: 'Lumisana', color: '#c8b8ff', script: 'play-snowword',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false,
        bgColor: '#123048', ambient: 'sparkle', fg: null,
        init: function () { initSnowword(); },
        update: function (dt) { updateSnowword(dt); },
        draw: function () { drawSnowword(); },
        tap: function (x, y) { handleSnowwordTap(x, y); },
        resize: function () { resizeSnowword(); },
        renderBg: function (b, w, h) { renderSnowwordBg(b, w, h); },
        renderBgLayers: function () { return snowwordLayers(); },
        light: { rays: true, raysColor: '#c8d4ff', raysAlpha: 0.75, tint: ['rgba(30,40,80,0.14)', 'rgba(20,30,60,0.06)'], vignette: 0.4 },
        respawn: function () { respawnSnowword(); }
      },
      {
        kind: 'foxguard', room: 'F', name: 'Revontulikettu', color: '#e88a3a', script: 'play-foxguard',
        control: 'ride', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 5000,
        bgColor: '#0e2438', ambient: 'stars', fg: { kind: 'snow', color: 'rgba(200,230,240,0.75)' },
        init: function () { initFoxguard(); },
        update: function (dt) { updateFoxguard(dt); },
        draw: function () { drawFoxguard(); },
        tap: function (x, y) { handleFoxguardTap(x, y); },
        resize: function (ratio) { resizeFoxguard(ratio); },
        renderBg: function (b, w, h) { renderFoxguardBg(b, w, h); },
        renderBgLayers: function () { return foxguardLayers(); },
        light: { rays: true, raysColor: '#ffe08a', raysAlpha: 0.7, tint: ['rgba(40,30,20,0.12)', 'rgba(20,20,40,0.08)'], vignette: 0.42 },
        respawn: function () { respawnFoxguard(); }
      }
    ]
  },
  {
    // Kaukamaa: saariston takainen manner (region 'land'), oma kartta
    // flow-land.js:ssä. Paikka (place) vastaa saaren island-kenttää; band on
    // sokkelon maaston teema. Lohikäärmelaakso on mantereen ensimmäinen alue.
    id: 10, name: 'Lohikäärmelaakso', region: 'land', band: 'dragon',
    place: { fx: 0.34, fy: 0.55, size: 1.0, finaleKind: 'nest', deco: ['nest'] },
    // '?' = tuleva huone usvan peitossa (paikanpitäjä tuleville kentille)
    map: [
      '###########',
      '#B.......D#',
      '#########.#',
      '#?........#',
      '#.#########',
      '#........?#',
      '#########.#',
      '#?.......?#',
      '###########'
    ],
    levels: [
      {
        kind: 'nest', room: 'D', name: 'Pesäkallio', color: '#ff8a5a', script: 'play-nest',
        control: 'tap', usesJump: false, usesWand: false, usesHearts: false, celebrateMs: 6000,
        bgColor: '#43297a', ambient: 'sparkle', fg: { kind: 'grass', color: 'rgba(110,50,40,0.7)' },
        init: function () { initNest(); },
        update: function (dt) { updateNest(dt); },
        draw: function () { drawNest(); },
        tap: function (x, y) { handleNestTap(x, y); },
        resize: function (ratio) { resizeNest(ratio); },
        renderBg: function (b, w, h) { renderNestBg(b, w, h); },
        renderBgLayers: function () { return nestLayers(); },
        light: { rays: true, raysColor: '#ffd8a0', raysAlpha: 0.9, tint: ['rgba(120,40,110,0.10)', 'rgba(255,150,80,0.08)'], vignette: 0.38 },
        respawn: function () { respawnNest(); }
      }
    ]
  }
];

// Johdetut näkymät rekisteriin. Älä muokkaa näitä käsin — muuta WORLDS-listaa.
var PHASES = {};
var HUB_WORLDS = {};
var ISLANDS = [];       // saaristokartan saaret (region 'sea')
var LAND_PLACES = [];   // Kaukamaan paikat (region 'land')
var WORLD_INFO = {};    // id -> { name, region, band }
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
      if (lv.renderBgLayers) p.renderBgLayers = lv.renderBgLayers;
      if (lv.light) p.light = lv.light;
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
    WORLD_INFO[w.id] = { name: w.name, region: w.region || 'sea', band: w.band || null };
    if (w.island) {
      ISLANDS.push({
        world: w.id, name: w.name,
        fx: w.island.fx, fy: w.island.fy, size: w.island.size,
        finaleKind: w.island.finaleKind, deco: w.island.deco
      });
    }
    if (w.place) {
      LAND_PLACES.push({
        world: w.id, name: w.name,
        fx: w.place.fx, fy: w.place.fy, size: w.place.size,
        finaleKind: w.place.finaleKind, deco: w.place.deco
      });
    }
  }
})();

// Skriptien latauslista: ydin ensin (state aina 1.), kenttäskriptit rekisterin
// järjestyksessä (kukin kerran), pääsilmukka viimeisenä (main aina vika).
function scriptManifest() {
  var files = [
    'state', 'art', 'audio', 'progress', 'world', 'draw-actors', 'fx', 'ambient',
    'flow-hub', 'flow-sea', 'flow-land', 'flow-home',
    'tasks-core', 'tasks-extra', 'tasks-drag', 'tasks-mix', 'tasks-more', 'tasks-read', 'tasks-fair', 'tasks-north',
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
