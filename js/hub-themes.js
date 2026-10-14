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
// Tökkäys (valinnainen; moottori hoitaa heilahduksen, kimalteen ja äänen kaikille):
//   pokeColor: '#hex'                  kimalteiden väri
//   pokeDur:   sekuntia                 tehosteen kesto (oletus 1,4)
//   pokeDraw:  function (c, x, baseY, s, rnd, rnd2, k, n)  tökätyn koristeen päälle
//                                      piirrettävä yllätys; k = 0..1 kesto, n = tökkäysten
//                                      määrä (esim. joka 3. tökkäys isompi yllätys)
//   poke:      function (p)            tökkäyksen hetkellä (ääni tms.), p = koriste
//   spots:     function (w, h, lay)    maiseman tökättävät kohteet laatan ulkopuolella:
//                                      [{ id, x, y, r, dur?, sound? }] (samat paikat kuin backdrop)
//   spotDraw:  function (c, spot, k, lay)  kohteen elävä tehoste (k = 0..1)
//   spotDur:   sekuntia                 oletuskesto kohteille (oletus 2)
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
  },
  // Tökkäys (apupalat hub-theme-linna.js:ssä, htLinnaPoke*): puusta putoaa omena
  // ja lehtiä (iso: kolme omenaa ja lintu lentää pois), pensaasta lehahtaa
  // perhonen (iso: pupu pilkistää), kivi avaa silmänsä ja hymyilee (iso: tähti)
  pokeColor: '#b8f08a',
  pokeDur: 2.2,
  poke: function (p) {
    var big = p.n % 3 === 0;
    if (p.rnd < 0.62) { htLinnaPokePlop(0.3); if (big) htLinnaPokeTweet(0.15); }
    else if (p.rnd < 0.82) {
      if (big) soundBunny();
      else { playNote(1047, 0.1, 0.1, 'sine', 0.18); playNote(1319, 0.2, 0.1, 'sine', 0.16); }
    } else { playNote(196, 0.05, 0.18, 'triangle', 0.3); playNote(294, 0.2, 0.2, 'triangle', 0.25); if (big) soundStar(3); }
  },
  pokeDraw: function (c, x, baseY, s, rnd, rnd2, k, n) {
    var big = n % 3 === 0, bs;
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    if (rnd < 0.62) htLinnaPokeTreeFx(c, x, baseY, s * (0.8 + rnd2 * 0.35), k, big, '#6cc45c', rnd2, '#ff5a5a');
    else if (rnd < 0.82) {
      bs = s * 0.28;
      if (big) htLinnaPokePeek(c, x + (rnd2 - 0.5) * bs, baseY - s * 0.05 - bs * 1.1, bs * 0.7, k);
      else htLinnaPokeFlutter(c, x, baseY - s * 0.05 - bs * 0.6, s * 1.2, k, 1, rnd2 < 0.5 ? '#ff9ad0' : '#ffd24f');
    } else {
      c.save();
      htLinnaPokeWobble(c, x, baseY, k, 2.2);
      htLinnaPokeFace(c, x, baseY - s * 0.15, s * 0.2, k, big, false);
      c.restore();
      if (big) drawStar(c, x, baseY - s * 0.35 - htLinnaPokeEase(k / 0.4) * s * 0.6, s * 0.13, k * 4, 1);
    }
    c.restore();
  },
  // Linnasaaren maisema: kaukaisista puista varisee lehtiä (joka 3. lintu),
  // pilvistä sataa (joka 3. sateenkaari), kummuilla loikkii pupu
  spotDur: 2.4,
  spots: function (w, h, lay) {
    var out = [], i, x, by, ts;
    for (i = 0; i < 18; i++) {
      x = (i / 17) * w;
      by = lay.oy + lay.rows * lay.cell * 0.3 + h * 0.2 + (i % 3) * h * 0.05;
      if (x > lay.ox - lay.cell && x < lay.ox + lay.cols * lay.cell + lay.cell) continue;
      ts = h * (0.07 + (i % 3) * 0.02);
      out.push(htLinnaPokeSpot('forest-tree' + i, 'tree', x, by - ts * 0.9, ts * 0.8, ts, function (sp, big) {
        htLinnaPokePlop(0.35); if (big) htLinnaPokeTweet(0.2);
      }));
      out[out.length - 1].by = by;
    }
    htLinnaPokeCloudSpots('forest', w, h, 7, out);
    htLinnaPokeHillSpots('forest', w, h, lay, out);
    return out;
  },
  spotDraw: function (c, sp, k, lay) {
    if (sp.kind === 'cloud') { htLinnaPokeCloudFx(c, sp, k); return; }
    if (sp.kind === 'hill') { htLinnaPokeHillFx(c, sp, k); return; }
    c.save();
    c.globalAlpha = htLinnaPokeFade(k);
    htLinnaPokeTreeFx(c, sp.x, sp.by, sp.size, k, sp.n % 3 === 0, '#9ccf8c', htLinnaPokeHash(sp.x, 1), '#ff6a6a');
    c.restore();
  }
};
