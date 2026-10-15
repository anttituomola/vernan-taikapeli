'use strict';

// Sokkeloteema (ks. hub-themes.js): Pilvilinna (cloud), Kaukamaan taivaalla
// leijuva bonuspaikka ja Pikkupilven kotimatkan maali. Iltaruskon taivas,
// pulleat pilvet maana, sateenkaaripolku, tähtilyhdyt ja nukkuvat
// pikkupilvet. Sivuilla sankarikoristeina Pilvilinna ja Äitipilvi, joka
// odottaa Pikkupilveä kotiin. Käyttää Kaukamaan teemojen yhteisiä paloja
// (hub-theme-manner.js: sivut, horisontti, sironta, oviaukko ja tökkäykset).

HUB_TILE_COLORS.cloud = ['#dcd8f8', '#d2cdf4'];
var HT_CLOUD_LINE = '#aaa2dc';
var HT_CLOUD_TINTS = ['#ffd6e8', '#d8f5e4', '#fff3c4', '#e6dcff', '#ffe2cc'];

// Pullea pilvi kevyellä laventelireunalla (koriste ja maa)
function htCloudPuff(b, x, y, r, col) {
  b.fillStyle = HT_CLOUD_LINE;
  cloudShape(b, x, y + r * 0.035, r * 0.53);
  var g = b.createLinearGradient(0, y - r * 0.8, 0, y + r * 0.6);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, col || '#e6e4fa');
  b.fillStyle = g;
  cloudShape(b, x, y, r * 0.5);
  artHighlight(b, x - r * 0.3, y - r * 0.45, r * 0.22, r * 0.09, 0.5);
}
// Tähtilyhty tolpan päässä
function htCloudLantern(b, x, baseY, s, lit) {
  artShadow(b, x, baseY, s * 0.12, s * 0.03, 0.12);
  artLimb(b, x, baseY, x, baseY - s * 0.5, s * 0.035, '#c8b8f0', HT_CLOUD_LINE);
  if (lit) artGlow(b, x, baseY - s * 0.58, s * 0.22, '#fff2a8', 0.6 * lit);
  htMannerPokeStar(b, x, baseY - s * 0.58, s * 0.09, '#ffe27a');
}
// Pieni sateenkaari pilvien välissä
function htCloudBow(b, x, baseY, s, alpha) {
  htMannerPokeRainbow(b, x, baseY - s * 0.05, s * 0.32, alpha === undefined ? 0.85 : alpha);
  htCloudPuff(b, x - s * 0.3, baseY - s * 0.04, s * 0.32);
  htCloudPuff(b, x + s * 0.3, baseY - s * 0.04, s * 0.3);
}
// Ilmapallo narun päässä (naru kiinni pilvessä)
function htCloudBalloon(b, x, baseY, s, col) {
  var top = baseY - s * 0.62;
  b.strokeStyle = 'rgba(120,110,170,0.8)';
  b.lineWidth = Math.max(1, s * 0.012);
  b.beginPath(); b.moveTo(x, baseY - s * 0.05); b.quadraticCurveTo(x + s * 0.06, baseY - s * 0.3, x, top + s * 0.12); b.stroke();
  artBlob(b, x, top, s * 0.1, s * 0.12, col, { hi: 0.45 });
  htCloudPuff(b, x, baseY - s * 0.03, s * 0.24);
}
// Nukkuva pikkupilvi (Pikkupilven serkku) pienessä pilvisängyssä
function htCloudSleeper(b, x, baseY, s, tint) {
  htCloudPuff(b, x, baseY - s * 0.04, s * 0.38, '#ece8ff');
  trekDrawPup(b, x, baseY - s * 0.2, s * 0.13, { mood: 'sleepy', t: 0, tint: tint });
}
// Seinäruudun ja sivumaiseman koristeet
function htCloudProp(b, x, baseY, s, rnd, rnd2) {
  if (rnd < 0.34) {
    htCloudPuff(b, x, baseY - s * 0.12, s * (0.55 + rnd2 * 0.25));
    if (rnd2 > 0.6) htCloudPuff(b, x + s * 0.25, baseY - s * 0.04, s * 0.32);
  } else if (rnd < 0.52) htCloudLantern(b, x, baseY, s, 0.6);
  else if (rnd < 0.66) htCloudBow(b, x, baseY, s);
  else if (rnd < 0.8) htCloudBalloon(b, x, baseY, s, ['#ff9fd0', '#9fd8ff', '#ffe27a', '#b8f0a0'][Math.floor(rnd2 * 4)]);
  else htCloudSleeper(b, x, baseY, s, HT_CLOUD_TINTS[Math.floor(rnd2 * HT_CLOUD_TINTS.length)]);
}
function htCloudPokeKind(rnd) {
  return rnd < 0.34 ? 'puff' : rnd < 0.52 ? 'lantern' : rnd < 0.66 ? 'bow' : rnd < 0.8 ? 'balloon' : 'pup';
}
// Sankari: Pilvilinna pilvien päällä, sateenkaari takana
function htCloudCastle(b, x, baseY, sz) {
  var i;
  for (i = 0; i < 7; i++) {
    b.strokeStyle = artRGBA(RAINBOW_COLORS[i], 0.7);
    b.lineWidth = sz * 0.035;
    b.beginPath(); b.arc(x, baseY - sz * 0.15, sz * (0.62 - i * 0.035), Math.PI * 1.05, Math.PI * 1.95); b.stroke();
  }
  drawCastle(b, x, baseY - sz * 0.1, sz * 0.75);
  htCloudPuff(b, x - sz * 0.32, baseY - sz * 0.05, sz * 0.42);
  htCloudPuff(b, x + sz * 0.3, baseY - sz * 0.04, sz * 0.4);
  htCloudPuff(b, x, baseY + sz * 0.02, sz * 0.36);
}
// Sankari: Äitipilvi odottaa ja katselee polulle päin
function htCloudMother(b, x, baseY, sz) {
  htCloudPuff(b, x, baseY - sz * 0.02, sz * 0.6, '#ece8ff');
  trekDrawPup(b, x, baseY - sz * 0.42, sz * 0.26, { mood: 'happy', t: 0, tint: '#ece4ff', look: -0.8 });
  htCloudLantern(b, x + sz * 0.42, baseY, sz * 0.9, 1);
}

HUB_THEMES.cloud = {
  sky: ['#b9a8ec', '#ffe4ec'],
  ground: ['#dcd8f8', '#d0cbf4'],
  earth: '#a49ad8',
  path: ['#f6b8d4', '#fff6e8'],
  arch: '#fffaf2',
  density: 0.7,
  backdrop: function (b, w, h, lay) {
    var hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x, y;
    // Iltaruskon taivas: tähdet ylhäällä, aurinko laskee pilvien taa
    for (i = 0; i < 16; i++) {
      htMannerPokeStar(b, w * ((i * 0.271 + 0.05) % 1), h * (0.02 + ((i * 0.413) % 1) * 0.16), h * (0.005 + (i % 3) * 0.002), '#fff6c8');
    }
    htMannerSun(b, w * 0.9, h * 0.2, h * 0.045);
    for (i = 0; i < 7; i++) {
      x = w * (0.04 + i * 0.16);
      y = h * (0.12 + (i % 3) * 0.05);
      b.fillStyle = 'rgba(255,214,232,0.75)';
      cloudShape(b, x, y, h * (0.016 + (i % 2) * 0.008));
    }
    // Pilvimeri horisontissa (kauempana sinertävä, lähempänä valkoinen)
    for (i = 0; i < 26; i++) {
      x = (i / 25) * w;
      htCloudPuff(b, x, hz - h * 0.02 + Math.sin(i * 1.7) * h * 0.012, h * 0.075, '#dcd6f8');
    }
    for (i = 0; i < 22; i++) {
      x = ((i + 0.5) / 22) * w;
      htCloudPuff(b, x, hz + h * 0.05 + Math.sin(i * 2.3) * h * 0.012, h * 0.09, '#ebe7fc');
    }
    b.fillStyle = '#f1eefd';
    b.fillRect(0, hz + h * 0.07, w, h);
    // Kaukaiset pikkusateenkaaret
    for (i = 0; i < 4; i++) {
      x = i % 2 ? sd.R + (w - sd.R) * (0.3 + (i >> 1) * 0.35) : sd.L * (0.3 + (i >> 1) * 0.35);
      htMannerPokeRainbow(b, x, hz + h * 0.01, lay.cell * 0.4, 0.45);
    }
    htCloudCastle(b, htMannerHeroX(w, lay, false), hz + h * 0.13, hs * 1.1);
    htCloudMother(b, htMannerHeroX(w, lay, true), hz + h * 0.14, hs * 0.95);
    // Sironta: pilvimaan "kukat" ovat pieniä tähtiä ja kimalteita
    for (i = 0; i < 50; i++) {
      x = hubHash(i, 41) * w; y = hz + h * 0.1 + hubHash(41, i) * (h - hz);
      if (x > sd.L - lay.cell * 0.2 && x < sd.R + lay.cell * 0.2) continue;
      if (i % 3) htCloudPuff(b, x, y, lay.cell * 0.12);
      else htMannerPokeStar(b, x, y, lay.cell * 0.035, ['#ffe27a', '#ffb8d8', '#bfe4ff'][i % 3]);
    }
    htCloudScatter(b, w, h, lay, 18);
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.3 + rnd * 0.55);
    if (rnd < 0.3) {
      b.fillStyle = 'rgba(200,190,240,0.45)';
      cloudShape(b, px, py, s * 0.05);
    } else if (rnd < 0.4) htMannerPokeStar(b, px, py, s * 0.03, rnd2 < 0.5 ? '#ffe27a' : '#ffb8d8');
    else if (rnd < 0.48) {
      b.fillStyle = 'rgba(255,255,255,0.8)';
      b.beginPath(); b.arc(px, py, s * 0.015, 0, Math.PI * 2); b.fill();
    }
  },
  wall: htCloudProp,
  landmark: function (c, x, y, s, room, st) {
    // Pilviportti, jonka yllä sateenkaari; Pikkupilvi kurkistaa portin päältä
    var col = room.color || '#8fc8ff', base = y + s * 0.34, i, bob = Math.sin(globalT * 2) * s * 0.02;
    artShadow(c, x, base, s * 0.5, s * 0.1, 0.18);
    c.lineWidth = s * 0.05;
    c.lineCap = 'butt';
    for (i = 0; i < 7; i++) {
      c.strokeStyle = RAINBOW_COLORS[i];
      c.beginPath(); c.arc(x, y - s * 0.12, s * (0.58 - i * 0.045), Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    }
    htCloudPuff(c, x - s * 0.4, base - s * 0.12, s * 0.42);
    htCloudPuff(c, x + s * 0.4, base - s * 0.12, s * 0.42);
    htMannerOpening(c, x, y, s, room, st, col, 0.3);
    trekDrawPup(c, x + s * 0.34, y - s * 0.52 + bob, s * 0.11, { mood: st.cleared ? 'happy' : 'wow', t: globalT, wave: true, look: -0.5 });
  }
};
// Sivumaiseman koristeet takaa eteen (samat paikat kuin tökkäyskohteet)
function htCloudScatter(b, w, h, lay, n) {
  var s = lay.cell, sd = htMannerSides(lay), hz = htMannerHz(lay, h) + h * 0.05, i, t, x, y, x0, x1, k;
  for (i = 0; i < n; i++) {
    t = i / Math.max(1, n - 1);
    x0 = i % 2 ? sd.R + s * 0.35 : s * 0.35;
    x1 = i % 2 ? w - s * 0.35 : sd.L - s * 0.35;
    if (x1 <= x0) continue;
    x = x0 + hubHash(i, 17) * (x1 - x0);
    y = hz + t * (h * 0.99 - hz);
    k = s * (0.75 + t * 0.6);
    htCloudProp(b, x, y, k, hubHash(17, i) * 0.95, hubHash(i, 11));
  }
}

// ---------- Tökkäysyllätykset ----------
// Pilvi sataa ja sitten loistaa sateenkaari (joka 3.: pikkupilvi kurkistaa ja
// kikattaa), tähtilyhty syttyy ja tähdet nousevat (iso: tähdenlento), pieni
// sateenkaari kirkastuu, ilmapallo nousee ja palaa, nukkuva pikkupilvi herää.
var HT_CLOUD_POKE_FX = {
  puff: function (c, x, baseY, s, rnd2, k, n, wob) {
    var big = htMannerPokeBig(n), g = Math.sin(Math.max(0, Math.min(1, (k - 0.35) * 3)) * Math.PI / 2) * htMannerPokeFade(k, 0.25), cy = baseY - s * 0.12, r = s * (0.55 + rnd2 * 0.25), up;
    htStormPokeRain(c, x, cy, r * 0.5, htMannerPokeSeg(k, 0, 0.6));
    if (g > 0) htMannerPokeRainbow(c, x, cy + r * 0.9, r * 0.55 * (0.6 + g * 0.4), g * 0.9);
    if (!big) return;
    up = htMannerPokeBack(Math.min(1, htMannerPokeSeg(k, 0.05, 1) * 4)) * htMannerPokeFade(k, 0.15);
    if (k > 0.05 && up > 0.02) trekDrawPup(c, x + r * 0.2, cy - r * 0.35 - up * r * 0.25, r * 0.22 * up, { mood: 'happy', t: globalT, wave: true, squint: true, tint: HT_CLOUD_TINTS[Math.floor(rnd2 * 5)] });
  },
  lantern: function (c, x, baseY, s, rnd2, k, n) {
    var g = Math.sin(Math.min(1, k * 4) * Math.PI / 2) * htMannerPokeFade(k, 0.3), i, q;
    artGlow(c, x, baseY - s * 0.58, s * 0.35, '#fff2a8', 0.8 * g);
    for (i = 0; i < 4; i++) {
      q = htMannerPokeSeg(k, i * 0.1, i * 0.1 + 0.6);
      if (q < 0) continue;
      c.save();
      c.globalAlpha *= 1 - q;
      htMannerPokeStar(c, x + Math.sin(q * 6 + i) * s * 0.15, baseY - s * 0.6 - q * s * 0.6, s * 0.035, '#fff6a0');
      c.restore();
    }
    if (!htMannerPokeBig(n)) return;
    // Iso: tähdenlento kaartaa lyhdyn yli
    q = htMannerPokeSeg(k, 0.15, 0.75);
    if (q < 0) return;
    c.save();
    c.strokeStyle = 'rgba(255,240,170,' + (1 - q) + ')';
    c.lineWidth = Math.max(1.5, s * 0.02);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s * 0.6 + q * s * 1.2 - s * 0.25, baseY - s * 1.1 + q * s * 0.3 - s * 0.08); c.lineTo(x - s * 0.6 + q * s * 1.2, baseY - s * 1.1 + q * s * 0.3); c.stroke();
    htMannerPokeStar(c, x - s * 0.6 + q * s * 1.2, baseY - s * 1.1 + q * s * 0.3, s * 0.05, '#fff6a0');
    c.restore();
  },
  bow: function (c, x, baseY, s, rnd2, k, n) {
    var g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3);
    artGlow(c, x, baseY - s * 0.3, s * 0.45, '#fff6d0', 0.6 * g);
    htMannerPokeRainbow(c, x, baseY - s * 0.05, s * (0.32 + g * 0.1), g);
    if (htMannerPokeBig(n)) htMannerPokeHearts(c, x, baseY - s * 0.35, s, htMannerPokeSeg(k, 0.3, 1), 3, s * 0.5);
  },
  balloon: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), q = htMannerPokeHold(k), lift = (big ? 0.9 : 0.25) * q * s, col = ['#ff9fd0', '#9fd8ff', '#ffe27a', '#b8f0a0'][Math.floor(rnd2 * 4)];
    // Pallo nousee narun päässä (iso: irtoaa hetkeksi ja palaa)
    c.save();
    artBlob(c, x + Math.sin(k * 9) * s * 0.03, baseY - s * 0.62 - lift, s * 0.11, s * 0.13, col, { hi: 0.45 });
    c.restore();
    htMannerPokeHearts(c, x, baseY - s * 0.75 - lift, s, htMannerPokeSeg(k, 0.2, 1), big ? 3 : 1, s * 0.4);
  },
  pup: function (c, x, baseY, s, rnd2, k, n) {
    var big = htMannerPokeBig(n), up = htMannerPokeHold(k), tint = HT_CLOUD_TINTS[Math.floor(rnd2 * HT_CLOUD_TINTS.length)];
    // Herää, venyttelee ja kikattaa
    c.save();
    c.globalAlpha *= Math.min(1, up * 3);
    htCloudPuff(c, x, baseY - s * 0.04, s * 0.38, '#ece8ff');
    trekDrawPup(c, x, baseY - s * 0.2 - up * s * (big ? 0.25 : 0.08), s * 0.13 * (1 + up * 0.15), { mood: k < 0.15 ? 'sleepy' : 'happy', t: globalT, wave: true, squint: !big, tint: tint });
    c.restore();
    if (big) htMannerPokeHearts(c, x, baseY - s * 0.4, s, htMannerPokeSeg(k, 0.25, 1), 3, s * 0.4);
  }
};
var HT_CLOUD_POKE_SND = {
  puff: function (n) {
    htMannerPokeTune([1568, 1319, 1760, 1175], 0.08, 'sine', 0.12);
    htMannerPokeTune(htMannerPokeBig(n) ? [988, 1175, 1319, 1175] : [523, 659, 784, 1047], 0.08, 'triangle', 0.15, 0.7);
  },
  lantern: function (n) {
    htMannerPokeTune([1319, 1568, 1976], 0.08, 'sine', 0.15);
    if (htMannerPokeBig(n)) htMannerPokeTune([2093, 1760, 1568, 1319, 1047], 0.06, 'sine', 0.1, 0.4);
  },
  bow: function (n) {
    htMannerPokeTune([523, 659, 784, 1047, 1319], 0.07, 'triangle', 0.16);
  },
  balloon: function (n) {
    playNote(660, 0, 0.1, 'sine', 0.14); playNote(880, 0.12, 0.14, 'sine', 0.14);
    if (htMannerPokeBig(n)) htMannerPokeTune([784, 988, 1175, 1568], 0.1, 'triangle', 0.14, 0.4);
  },
  pup: function (n) {
    playNote(523, 0, 0.3, 'sine', 0.1);
    htMannerPokeTune([988, 1175, 1319, 1175], 0.07, 'triangle', 0.15, 0.35);
  }
};
htMannerPokeSetup(HUB_THEMES.cloud, '#ffd6ec', htCloudPokeKind, HT_CLOUD_POKE_FX, HT_CLOUD_POKE_SND, function (w, h, lay) {
  var th = HUB_THEMES.cloud, list = [], hz = htMannerHz(lay, h), sd = htMannerSides(lay), hs = htMannerHeroSize(w, h, lay), i, x;
  var cx = htMannerHeroX(w, lay, false), cy = hz + h * 0.13, csz = hs * 1.1, mx = htMannerHeroX(w, lay, true), my = hz + h * 0.14, msz = hs * 0.95;
  htMannerPokeScatter(list, th, 'cloud-s', w, h, lay, 18, null, 0.95, 11);
  // Pilvilinna: ikkunat syttyvät ja sateenkaari loistaa
  list.push(htMannerPokeSpot('cloud-castle', cx, cy - csz * 0.45, csz * 0.5, function (c, sp, k) {
    var g = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * htMannerPokeFade(k, 0.3);
    artGlow(c, cx, cy - csz * 0.5, csz * 0.6, '#fff2a8', 0.45 * g);
    htMannerPokeRainbow(c, cx, cy - csz * 0.15, csz * (0.62 + g * 0.06), g * 0.8);
    htMannerPokeHearts(c, cx, cy - csz * 0.8, csz, htMannerPokeSeg(k, 0.2, 1), htMannerPokeBig(sp.n) ? 5 : 2, csz * 0.4);
  }, function (n) { htMannerPokeTune([523, 659, 784, 1047, 1319, 1568], 0.08, 'triangle', 0.16); }, 2.4));
  // Äitipilvi: kikattaa ja sataa hetken iloisesti
  list.push(htMannerPokeSpot('cloud-mother', mx, my - msz * 0.42, msz * 0.4, function (c, sp, k) {
    var up = htMannerPokeHold(k);
    htStormPokeRain(c, mx, my - msz * 0.3, msz * 0.22, htMannerPokeSeg(k, 0.1, 0.7));
    trekDrawPup(c, mx, my - msz * 0.42 - up * msz * 0.05, msz * 0.26, { mood: k < 0.5 ? 'happy' : 'wow', squint: k < 0.5, t: globalT, tint: '#ece4ff', wave: true });
    htMannerPokeHearts(c, mx, my - msz * 0.75, msz, htMannerPokeSeg(k, 0.2, 1), 3, msz * 0.4);
  }, function (n) { trekPupSound(htMannerPokeBig(n) ? 'yay' : 'giggle'); }, 2.2));
  // Ruskopilvet ja aurinko
  for (i = 0; i < 7; i++) {
    x = w * (0.04 + i * 0.16);
    list.push(htCloudPokeSkySpot('cloud-c' + i, x, h * (0.12 + (i % 3) * 0.05), h * (0.016 + (i % 2) * 0.008)));
  }
  list.push(htMannerPokeSunSpot('cloud-sun', w * 0.9, h * 0.2, h * 0.045));
  return list;
});
function htCloudPokeSkySpot(id, x, y, r) {
  return htMannerPokeSpot(id, x, y, r * 2.4, function (c, sp, k) {
    var puff = 1 + 0.12 * Math.sin(k * Math.PI * 4) * (1 - k), g = Math.sin(Math.max(0, Math.min(1, (k - 0.3) * 3)) * Math.PI / 2) * htMannerPokeFade(k, 0.25);
    htStormPokeRain(c, x, y, r * 1.6, htMannerPokeSeg(k, 0, 0.6));
    if (g > 0) htMannerPokeRainbow(c, x, y + r * 3, r * 2.2 * (0.6 + g * 0.4), g * 0.85);
    c.save();
    c.translate(x, y);
    c.scale(puff, puff);
    c.fillStyle = 'rgba(255,214,232,0.95)';
    cloudShape(c, 0, 0, r);
    c.restore();
  }, function (n) { htMannerPokeTune([1568, 1319, 1760], 0.08, 'sine', 0.12); }, 2.2);
}
