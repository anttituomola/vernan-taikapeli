'use strict';

// Sokkelon teemat: jokainen vyöhyke (hubBand, rekisterin `band`) saa oman
// pienoismaailmansa ilmeen. Sokkelo piirretään laattana, jonka maareuna näkyy;
// laatan ympärillä on maailman maisema. Teema on olio HUB_THEMES[band]:
//
//   sky:      ['#ylä', '#ala']         taivas koko ruudulle (lähtöruudun vyöhyke)
//   backdrop: function (b, w, h, lay)  maisema laatan takana ja sivuilla (koko ruutu;
//                                      laatta peittää keskustan). lay: { ox, oy, cell, cols, rows }
//   ground:   ['#a', '#b']             laatan pinta (ruudut vaihtelevat a:n ja a/b-sekoituksen välillä)
//   earth:    '#hex'                   laatan maareunan väri (näkyy laatan alla)
//   path:     ['#reunus', '#päällyste'] polku
//   arch:     '#hex'                   valinnainen: kenttäportin aukon väri
//   floor:    function (b, x, y, s, rnd, rnd2)    pieni maayksityiskohta joka ruutuun
//                                      (ruohotupsu, kivi, simpukka; (x, y) ruudun vasen yläkulma)
//   wall:     function (b, x, baseY, s, rnd, rnd2) seinäruudun maisemakoriste: seisoo
//                                      kohdassa (x, baseY) ruudun alareunalla ja saa kurottaa
//                                      ylöspäin n. 0,6 ruutua yli; piirretään takaa eteen
//   density:  0..1                     osuus seinäruuduista, joissa on koriste (oletus 0,9)
//   landmark: function (c, x, y, s, room, st)    valinnainen: kentän maamerkki portin
//                                      tilalle (st = { cleared, next }); piirrä kentän kuva
//                                      drawHubRoomIcon(c, room.kind, x, y, s * 1.05)
//
// rnd ja rnd2 ovat ruudun pysyviä satunnaislukuja 0..1. Kaikki piirretään art.js:n
// tarrakirjailmeellä (artBlob, artCircle, artFillPath, artShadow...). Teema voi olla
// omassa tiedostossaan (js/hub-theme-*.js), joka lisätään worlds.js:n scriptManifestiin.

// Yleiset palat teemoille
function hubThemeHills(b, w, h, lay, colors, amp) {
  var i, x, k, hz = lay.oy + lay.rows * lay.cell * 0.3;
  for (k = 0; k < colors.length; k++) {
    b.fillStyle = colors[k];
    b.beginPath(); b.moveTo(0, h);
    for (x = 0; x <= w; x += w / 40) {
      b.lineTo(x, hz + k * h * 0.12 - Math.sin(x / w * (5 + k * 3) + k * 1.7) * h * (amp || 0.05) - Math.sin(x / w * 13 + k) * h * 0.01);
    }
    b.lineTo(w, h); b.closePath(); b.fill();
  }
}
function hubThemeClouds(b, w, h, n, alpha) {
  var i;
  b.fillStyle = 'rgba(255,255,255,' + (alpha === undefined ? 0.85 : alpha) + ')';
  for (i = 0; i < n; i++) cloudShape(b, w * (0.04 + ((i * 0.37) % 1) * 0.92), h * (0.05 + (i % 3) * 0.045), h * (0.018 + (i % 2) * 0.008));
}
function hubThemeTuft(b, x, y, s, color) {
  var k;
  b.strokeStyle = color;
  b.lineWidth = Math.max(1, s * 0.04);
  b.lineCap = 'round';
  for (k = -1; k <= 1; k++) {
    b.beginPath(); b.moveTo(x + k * s * 0.05, y); b.lineTo(x + k * s * 0.09, y - s * (0.12 + (k === 0 ? 0.05 : 0))); b.stroke();
  }
}

// ---------- Metsä (Linnasaaren yläosa) ----------
HUB_THEMES.forest = {
  sky: ['#bfe6ff', '#eaf7e0'],
  ground: ['#6cc45c', '#5fb653'],
  earth: '#9c6b3f',
  path: ['#b8965e', '#f3e2b3'],
  backdrop: function (b, w, h, lay) {
    var i;
    hubThemeClouds(b, w, h, 7);
    hubThemeHills(b, w, h, lay, ['#cfe8c0', '#a8d898', '#86c878'], 0.05);
    for (i = 0; i < 18; i++) {
      var x = (i / 17) * w, by = lay.oy + lay.rows * lay.cell * 0.3 + h * 0.2 + (i % 3) * h * 0.05;
      if (x > lay.ox - lay.cell && x < lay.ox + lay.cols * lay.cell + lay.cell) continue;
      drawTree(b, x, by, h * (0.07 + (i % 3) * 0.02), 0.35);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    if (rnd < 0.5) hubThemeTuft(b, x + s * (0.2 + rnd2 * 0.6), y + s * (0.3 + rnd * 0.6), s, '#4fa046');
    else if (rnd < 0.62) drawFlower(b, x + s * rnd2, y + s * (0.2 + rnd * 0.6), s * 0.05, rnd2 < 0.5 ? '#ff7bac' : '#ffe27a');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.62) drawTree(b, x, baseY, s * (0.8 + rnd2 * 0.35), 0);
    else if (rnd < 0.82) drawBush(b, x, baseY - s * 0.05, s * 0.28);
    else {
      artShadow(b, x, baseY, s * 0.3, s * 0.08, 0.15);
      artBlob(b, x, baseY - s * 0.14, s * 0.3, s * 0.18, '#b8b4c8', { lineColor: '#6e6a80' });
    }
  }
};
