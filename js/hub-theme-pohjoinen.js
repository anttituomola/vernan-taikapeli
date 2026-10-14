'use strict';

// Sokkeloteemat (ks. hub-themes.js): Revontulimaa (north) ja Kaukamaan kolme
// ensimmäistä paikkaa: Lohikäärmelaakso (dragon), Hohtometsä (glow) ja
// Aurinkodyynit (desert). Mantereen sokkelot ovat leveitä ja matalia, joten
// laatan sivuille jää paljon maisemaa: maisemat rakennetaan sivuille.

// ---------- Yhteiset apurit ----------
// Pysyvä näennäissatunnainen luku 0..1
function htPohjRnd(i) {
  var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}
// Laatan sivujen rajat: vasen kaista 0..l, oikea kaista r..w
function htPohjSides(lay, w) {
  var l = lay.ox - lay.cell * 0.3, r = lay.ox + lay.cols * lay.cell + lay.cell * 0.3;
  return { l: Math.max(0, l), r: Math.min(w, r), rw: Math.max(0, w - r) };
}
// Kohta sivukaistalla: side 0 = vasen, 1 = oikea; t 0..1 kaistan ulkoreunalta sisään
function htPohjSideX(sd, w, side, t) {
  return side ? w - t * sd.rw : t * sd.l;
}
// Aaltoileva maakaistale (dyyni, lumikinos): täyttö alas ruudun pohjaan
function htPohjRidge(b, w, h, y, amp, freq, ph, color, line) {
  var x;
  b.beginPath(); b.moveTo(0, h);
  for (x = 0; x <= w + 1; x += w / 48) b.lineTo(x, y - Math.sin(x / w * freq + ph) * amp - Math.sin(x / w * freq * 2.3 + ph * 1.7) * amp * 0.3);
  b.lineTo(w, h); b.closePath();
  artFillPath(b, color, y - amp, y + h * 0.25, h * 0.1, line ? { lineColor: line, line: Math.max(1, h * 0.002) } : { line: false });
}
// Täplä nykyiseen polkuun (moveTo erottaa täplät toisistaan)
function htPohjDot(b, x, y, r) {
  b.moveTo(x + r, y);
  b.arc(x, y, r, 0, Math.PI * 2);
}
// Tähdet taivaan yläosaan
function htPohjStars(b, w, h, n, y1, alpha) {
  var i, x, y, r;
  for (i = 0; i < n; i++) {
    x = htPohjRnd(i * 3 + 1) * w; y = htPohjRnd(i * 5 + 2) * h * y1; r = h * (0.0015 + htPohjRnd(i * 7) * 0.0025);
    b.fillStyle = 'rgba(255,255,240,' + (alpha * (0.5 + htPohjRnd(i * 11) * 0.5)) + ')';
    b.beginPath(); htPohjDot(b, x, y, r); b.fill();
    if (i % 6 === 0) drawStar(b, x, y, r * 3, 0.2, 0);
  }
}
// Kuu: pehmeä kehä ja sirppi
function htPohjMoon(b, x, y, r) {
  artGlow(b, x, y, r * 3.2, '#fff6d8', 0.45);
  b.save();
  b.beginPath(); b.rect(x - r * 2, y - r * 2, r * 4, r * 4);
  b.arc(x + r * 0.42, y - r * 0.18, r * 0.82, 0, Math.PI * 2, true);
  b.clip();
  artCircle(b, x, y, r, '#fff8e0', { shadeTo: '#ffe6a8', lineColor: '#e8c878', hi: 0.4 });
  b.restore();
}
// Tulikärpänen: hehku ja kirkas piste
function htPohjFirefly(b, x, y, r) {
  artGlow(b, x, y, r * 4, '#fff6a0', 0.55);
  artCircle(b, x, y, r * 0.6, '#fffbd0', { line: false, flat: true });
}

// ==================== Revontulimaa ====================
// Revontuliverho: pehmeä nauha, joka hehkuu alareunastaan ja haihtuu ylöspäin
function htPohjAurora(b, w, h, y0, amp, len, ph, col) {
  var x, g = b.createLinearGradient(0, y0 - len - amp, 0, y0 + amp);
  g.addColorStop(0, artRGBA(col, 0));
  g.addColorStop(0.5, artRGBA(col, 0.5));
  g.addColorStop(1, artRGBA(col, 0.95));
  b.fillStyle = g;
  b.beginPath();
  for (x = -10; x <= w + 10; x += w / 60) b.lineTo(x, y0 + Math.sin(x / w * 5 + ph) * amp - len - Math.sin(x / w * 11 + ph) * amp * 0.6);
  for (x = w + 10; x >= -10; x -= w / 60) b.lineTo(x, y0 + Math.sin(x / w * 5 + ph) * amp);
  b.closePath(); b.fill();
  // Verhon pystysäteet
  b.save(); b.clip();
  b.strokeStyle = artRGBA('#ffffff', 0.18);
  b.lineWidth = Math.max(1, w * 0.004);
  for (x = 0; x <= w; x += w / 70) {
    b.beginPath(); b.moveTo(x, y0 + amp * 2); b.lineTo(x + w * 0.004, y0 - len - amp * 2); b.stroke();
  }
  b.restore();
  // Kirkas alareuna
  b.strokeStyle = artRGBA('#ffffff', 0.5);
  b.lineWidth = Math.max(1, h * 0.003);
  b.beginPath();
  for (x = -10; x <= w + 10; x += w / 60) b.lineTo(x, y0 + Math.sin(x / w * 5 + ph) * amp);
  b.stroke();
}
// Lumikumpu kuusineen (kaukainen), sävytetään iltataivaaseen
function htPohjMountains(b, w, h, y, col, cap) {
  var i, x, pw, ph;
  for (i = 0; i < 9; i++) {
    x = (i / 8) * w + (htPohjRnd(i + 40) - 0.5) * w * 0.06;
    pw = h * (0.16 + htPohjRnd(i + 50) * 0.08); ph = h * (0.09 + htPohjRnd(i + 60) * 0.07);
    b.beginPath();
    b.moveTo(x - pw, y); b.quadraticCurveTo(x - pw * 0.2, y - ph * 0.9, x, y - ph);
    b.quadraticCurveTo(x + pw * 0.2, y - ph * 0.9, x + pw, y); b.closePath();
    artFillPath(b, col, y - ph, y, pw, { line: false });
    b.beginPath();
    b.moveTo(x - pw * 0.34, y - ph * 0.62); b.quadraticCurveTo(x - pw * 0.08, y - ph * 0.97, x, y - ph);
    b.quadraticCurveTo(x + pw * 0.08, y - ph * 0.97, x + pw * 0.34, y - ph * 0.62);
    b.quadraticCurveTo(x + pw * 0.15, y - ph * 0.55, x + pw * 0.05, y - ph * 0.66);
    b.quadraticCurveTo(x - pw * 0.12, y - ph * 0.54, x - pw * 0.34, y - ph * 0.62);
    b.fillStyle = cap; b.fill();
  }
}
// Pieni kettu istumassa, häntä kiertyneenä (katsoo oikealle; dir -1 peilaa)
function htPohjFox(b, x, y, s, dir) {
  var fur = '#f08c3c';
  b.save(); b.translate(x, y); b.scale(dir || 1, 1);
  artShadow(b, 0, 0, s * 0.6, s * 0.12, 0.16);
  artBlob(b, -s * 0.34, -s * 0.12, s * 0.34, s * 0.14, fur, { rot: -0.3, hi: 0.2 });
  artBlob(b, -s * 0.6, -s * 0.2, s * 0.12, s * 0.09, '#fff4e8', { rot: -0.3, line: false });
  artBlob(b, 0, -s * 0.3, s * 0.24, s * 0.3, fur, { hi: 0.25 });
  artBlob(b, s * 0.04, -s * 0.24, s * 0.12, s * 0.2, '#fff4e8', { line: false });
  artCircle(b, s * 0.08, -s * 0.66, s * 0.2, fur, { hi: 0.3 });
  artBlob(b, -s * 0.04, -s * 0.86, s * 0.07, s * 0.12, fur, { rot: -0.3 });
  artBlob(b, s * 0.2, -s * 0.86, s * 0.07, s * 0.12, fur, { rot: 0.3 });
  artBlob(b, s * 0.22, -s * 0.6, s * 0.11, s * 0.07, '#fff4e8', { line: false });
  artCircle(b, s * 0.32, -s * 0.61, s * 0.03, '#4a2810', { line: false });
  artEye(b, s * 0.12, -s * 0.7, s * 0.045, 0.3, false);
  artBlush(b, s * 0.16, -s * 0.58, s * 0.04);
  b.restore();
}
// Kimmeltävä jääkide (kolme piikkiä)
function htPohjCrystal(b, x, baseY, s, col) {
  var i, a, k;
  artGlow(b, x, baseY - s * 0.5, s * 1.1, col, 0.3);
  for (i = -1; i <= 1; i++) {
    a = i * 0.45; k = i === 0 ? 1 : 0.68;
    b.save(); b.translate(x + i * s * 0.16, baseY); b.rotate(a);
    b.beginPath(); b.moveTo(-s * 0.13 * k, 0); b.lineTo(-s * 0.13 * k, -s * 0.7 * k); b.lineTo(0, -s * 0.95 * k);
    b.lineTo(s * 0.13 * k, -s * 0.7 * k); b.lineTo(s * 0.13 * k, 0); b.closePath();
    artFillPath(b, col, -s * k, 0, s * 0.15, { lineColor: artShade(col, -0.4) });
    b.fillStyle = 'rgba(255,255,255,0.6)';
    b.fillRect(-s * 0.07 * k, -s * 0.66 * k, s * 0.04 * k, s * 0.5 * k);
    b.restore();
  }
}
// Kota: kartiomainen teltta, raidat, salot ja lämmin oviaukko
function htPohjKota(b, x, baseY, s) {
  var i, top = baseY - s * 0.82;
  artShadow(b, x, baseY, s * 0.55, s * 0.1, 0.16);
  for (i = -1; i <= 1; i += 2) artLimb(b, x + i * s * 0.03, top + s * 0.08, x - i * s * 0.12, top - s * 0.12, s * 0.035, '#8a5a30');
  b.beginPath(); b.moveTo(x - s * 0.45, baseY); b.quadraticCurveTo(x - s * 0.2, baseY - s * 0.4, x - s * 0.06, top);
  b.lineTo(x + s * 0.06, top); b.quadraticCurveTo(x + s * 0.2, baseY - s * 0.4, x + s * 0.45, baseY); b.closePath();
  artFillPath(b, '#e8c08a', top, baseY, s * 0.4, { shadeTo: '#c8945a', lineColor: '#7a4a24' });
  b.save(); b.clip();
  b.fillStyle = '#3a78d8'; b.fillRect(x - s * 0.5, baseY - s * 0.2, s, s * 0.07);
  b.fillStyle = '#ff5a5a'; b.fillRect(x - s * 0.5, baseY - s * 0.13, s, s * 0.04);
  b.fillStyle = '#ffd24f'; b.fillRect(x - s * 0.5, baseY - s * 0.09, s, s * 0.03);
  artBlob(b, x - s * 0.04, top + s * 0.12, s * 0.16, s * 0.08, '#ffffff', { line: false });
  b.restore();
  artGlow(b, x, baseY - s * 0.12, s * 0.35, '#ffd36a', 0.45);
  b.beginPath(); b.moveTo(x - s * 0.1, baseY); b.quadraticCurveTo(x, baseY - s * 0.42, x + s * 0.1, baseY); b.closePath();
  artFillPath(b, '#ffcf5a', baseY - s * 0.4, baseY, s * 0.1, { shadeTo: '#ff9a3a', lineColor: '#7a4a24' });
}
// Lumipensas puolukoineen
function htPohjSnowBush(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.42, s * 0.08, 0.14);
  artCircle(b, x - s * 0.18, baseY - s * 0.13, s * 0.15, '#4f9a78', {});
  artCircle(b, x + s * 0.17, baseY - s * 0.12, s * 0.14, '#4f9a78', {});
  artCircle(b, x, baseY - s * 0.2, s * 0.19, '#5fae86', { hi: 0.25 });
  artBlob(b, x - s * 0.02, baseY - s * 0.36, s * 0.16, s * 0.06, '#ffffff', { shadeTo: '#dfe8fa', line: false });
  artBlob(b, x - s * 0.2, baseY - s * 0.26, s * 0.08, s * 0.04, '#ffffff', { line: false });
  artCircle(b, x + s * 0.1, baseY - s * 0.2, s * 0.035, '#ff4f5e', { lineColor: '#a01a2a', hi: 0.5 });
  artCircle(b, x - s * 0.1, baseY - s * 0.12, s * 0.035, '#ff4f5e', { lineColor: '#a01a2a', hi: 0.5 });
  artCircle(b, x + s * 0.22, baseY - s * 0.1, s * 0.03, '#ff4f5e', { lineColor: '#a01a2a', hi: 0.5 });
}

HUB_THEMES.north = {
  sky: ['#5464cc', '#ffd8e8'],
  ground: ['#f7faff', '#e6eefc'],
  earth: '#8d8fc8',
  path: ['#8ea2dc', '#d9e6ff'],
  arch: '#e4efff',
  density: 0.94,
  backdrop: function (b, w, h, lay) {
    var sd = htPohjSides(lay, w), i, x, y, k, u = h * 0.1, side;
    htPohjStars(b, w, h, 70, 0.42, 0.9);
    // Revontulet: kolme pehmeää verhoa
    htPohjAurora(b, w, h, h * 0.1, h * 0.03, h * 0.08, 4.2, '#ff8ae8');
    htPohjAurora(b, w, h, h * 0.2, h * 0.045, h * 0.13, 0.4, '#30ff9a');
    htPohjAurora(b, w, h, h * 0.28, h * 0.035, h * 0.1, 2.1, '#40d0ff');
    htPohjMoon(b, w * 0.86, h * 0.11, h * 0.045);
    // Vuoret ja kinokset
    artGlow(b, w * 0.5, h * 0.48, w * 0.6, '#ffe0ec', 0.5);
    htPohjMountains(b, w, h, h * 0.46, '#b4b4ea', '#ffffff');
    htPohjRidge(b, w, h, h * 0.47, h * 0.025, 6, 0.5, '#e4e8fb');
    for (i = 0; i < 26; i++) {
      x = htPohjRnd(i + 90) * w;
      drawNorthPine(b, x, h * 0.48 + htPohjRnd(i + 91) * h * 0.03, u * (0.55 + htPohjRnd(i) * 0.3), '#8f9cd8');
    }
    htPohjRidge(b, w, h, h * 0.58, h * 0.03, 4, 2.2, '#f2f5ff', '#c8d0f0');
    // Jäinen järvi vasemmalla
    x = htPohjSideX(sd, w, 0, 0.42);
    artBlob(b, x, h * 0.66, u * 1.7, u * 0.32, '#bfe4f6', { shadeTo: '#8cc4e4', lineColor: '#7aa8d0', hi: 0.4 });
    artBlob(b, x - u * 0.5, h * 0.645, u * 0.5, u * 0.06, '#ffffff', { line: false, alpha: 0.7 });
    htPohjRidge(b, w, h, h * 0.75, h * 0.025, 7, 4.1, '#fbfcff', '#cdd6f2');
    // Sivujen kuuset, kodat, porot ja kettu
    for (side = 0; side < 2; side++) {
      for (i = 0; i < 6; i++) {
        k = htPohjRnd(i * 13 + side * 7);
        x = htPohjSideX(sd, w, side, 0.08 + i * 0.17 + k * 0.05);
        y = h * (i % 2 ? 0.6 : 0.56) + k * h * 0.02;
        drawNorthPine(b, x, y, u * (1.0 + k * 0.4), '#4a8f8a');
      }
    }
    htPohjKota(b, htPohjSideX(sd, w, 0, 0.3), h * 0.8, u * 1.6);
    htPohjKota(b, htPohjSideX(sd, w, 0, 0.62), h * 0.84, u * 1.2);
    drawNorthDeer(b, htPohjSideX(sd, w, 1, 0.55), h * 0.72, u * 0.75, -1, 0);
    drawNorthDeer(b, htPohjSideX(sd, w, 1, 0.3), h * 0.69, u * 0.55, -1, 0);
    drawNorthSnowman(b, htPohjSideX(sd, w, 1, 0.75), h * 0.86, u * 0.9);
    for (side = 0; side < 2; side++) {
      for (i = 0; i < 3; i++) {
        x = htPohjSideX(sd, w, side, 0.08 + i * 0.4);
        drawNorthPine(b, x, h * (0.98 + (i % 2) * 0.03), u * 1.6, '#3a8378');
      }
    }
    htPohjFox(b, htPohjSideX(sd, w, 0, 0.3), h * 0.97, u * 0.9, 1);
    // Lumihiutaleita
    for (i = 0; i < 40; i++) {
      b.fillStyle = 'rgba(255,255,255,0.8)';
      b.beginPath(); b.arc(htPohjRnd(i + 300) * w, h * (0.3 + htPohjRnd(i + 301) * 0.7), h * 0.003, 0, Math.PI * 2); b.fill();
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.6);
    if (rnd < 0.3) {
      artBlob(b, px, py, s * 0.14, s * 0.035, '#d4ddf6', { line: false });
    } else if (rnd < 0.48) {
      hubThemeTuft(b, px, py, s, '#a4ae8c');
    } else if (rnd < 0.58) {
      b.fillStyle = '#ffffff';
      drawStar(b, px, py, s * 0.05, 0.3, 0);
    } else if (rnd < 0.64) {
      artCircle(b, px, py, s * 0.035, '#ff5f6e', { lineColor: '#a01a2a', hi: 0.5 });
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.42) {
      // Kuusi tai kuusipari
      if (rnd2 < 0.4) {
        drawNorthPine(b, x - s * 0.2, baseY - s * 0.04, s * 1.05, '#3f8c80');
        drawNorthPine(b, x + s * 0.22, baseY, s * 0.8, '#4f9e8c');
      } else drawNorthPine(b, x, baseY, s * (1.25 + rnd2 * 0.35), rnd2 < 0.7 ? '#3f8c80' : '#4a7fa0');
      artShadow(b, x, baseY + s * 0.02, s * 0.4, s * 0.08, 0.12);
    } else if (rnd < 0.58) {
      drawNorthRock(b, x, baseY - s * 0.17, s * 0.42);
    } else if (rnd < 0.72) {
      artShadow(b, x, baseY, s * 0.36, s * 0.08, 0.14);
      htPohjCrystal(b, x, baseY, s * 0.55, rnd2 < 0.5 ? '#9fe6ff' : '#d4b8ff');
    } else if (rnd < 0.85) {
      htPohjSnowBush(b, x, baseY, s);
    } else if (rnd2 < 0.5) {
      drawNorthSnowman(b, x, baseY - s * 0.2, s * 0.6);
    } else {
      htPohjKota(b, x, baseY, s * 0.85);
    }
  },
  // Iglu: kentän kuva lämpimästi valaistussa oviaukossa, lippu kentän värissä
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#8a5cb8', base = y + s * 0.36, dw = s * 0.31, top = y - s * 0.12, i;
    artShadow(c, x, base + s * 0.02, s * 0.56, s * 0.11, 0.2);
    c.beginPath(); c.ellipse(x, base, s * 0.52, s * 0.8, 0, Math.PI, 0); c.closePath();
    artFillPath(c, '#ffffff', base - s * 0.8, base, s * 0.4, { shadeTo: '#cfdcf6', lineColor: '#8ea2dc', hi: 0 });
    // Lumilohkojen saumat
    c.strokeStyle = 'rgba(142,162,220,0.5)';
    c.lineWidth = Math.max(1, s * 0.02);
    for (i = 1; i < 4; i++) {
      c.beginPath(); c.ellipse(x, base, s * 0.52 * Math.sqrt(1 - i * i / 16), s * 0.8 * (i / 4), 0, Math.PI, 0); c.stroke();
    }
    artHighlight(c, x - s * 0.24, base - s * 0.62, s * 0.12, s * 0.06, 0.6);
    // Oviaukko kentän värin kehyksellä
    c.beginPath(); c.moveTo(x - dw, base); c.lineTo(x - dw, top); c.arc(x, top, dw, Math.PI, 0); c.lineTo(x + dw, base); c.closePath();
    var ig = c.createLinearGradient(0, top - dw, 0, base);
    ig.addColorStop(0, st.cleared ? '#fff3c4' : '#fffaf2');
    ig.addColorStop(1, st.cleared ? '#ffd36a' : '#ffe2b8');
    c.fillStyle = ig; c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.07; c.stroke();
    c.strokeStyle = artShade(col, -0.45); c.lineWidth = Math.max(1, s * 0.02); c.stroke();
    // Lippu kupolin päällä
    artLimb(c, x + s * 0.06, base - s * 0.78, x + s * 0.06, base - s * 1.08, s * 0.03, '#8a6a4a');
    c.beginPath(); c.moveTo(x + s * 0.08, base - s * 1.08); c.lineTo(x + s * 0.3, base - s * 1.0); c.lineTo(x + s * 0.08, base - s * 0.92); c.closePath();
    artFillPath(c, col, base - s * 1.08, base - s * 0.92, s * 0.1, {});
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

// ==================== Lohikäärmelaakso ====================
// Tulivuori: kartio, hehkuva kraatteri, laavapurot ja savutupsut
function htPohjVolcano(b, x, baseY, s) {
  var i;
  b.beginPath();
  b.moveTo(x - s * 1.4, baseY);
  b.quadraticCurveTo(x - s * 0.5, baseY - s * 0.5, x - s * 0.32, baseY - s * 1.2);
  b.lineTo(x + s * 0.32, baseY - s * 1.2);
  b.quadraticCurveTo(x + s * 0.5, baseY - s * 0.5, x + s * 1.4, baseY);
  b.closePath();
  artFillPath(b, '#b8738a', baseY - s * 1.2, baseY, s, { shadeTo: '#8a5070', line: false });
  artGlow(b, x, baseY - s * 1.25, s * 0.9, '#ffb84a', 0.55);
  artBlob(b, x, baseY - s * 1.2, s * 0.32, s * 0.07, '#ff7a3a', { shadeTo: '#ffd060', line: false });
  b.lineCap = 'round';
  for (i = 0; i < 3; i++) {
    b.strokeStyle = i === 1 ? '#ffb84a' : '#ff8a4a';
    b.lineWidth = s * (i === 1 ? 0.07 : 0.05);
    b.beginPath(); b.moveTo(x + (i - 1) * s * 0.18, baseY - s * 1.18);
    b.quadraticCurveTo(x + (i - 1) * s * 0.4, baseY - s * 0.85, x + (i - 1) * s * (0.35 + i * 0.1), baseY - s * (0.55 - i * 0.08));
    b.stroke();
  }
  for (i = 0; i < 5; i++) {
    b.fillStyle = 'rgba(255,240,235,' + (0.75 - i * 0.1) + ')';
    cloudShape(b, x + Math.sin(i * 1.3) * s * 0.18 + i * s * 0.12, baseY - s * (1.45 + i * 0.32), s * (0.12 + i * 0.05));
  }
}
// Lohikäärmeen muna: pilkut ja kiilto
function htPohjEgg(b, x, baseY, s, col, rot) {
  b.save(); b.translate(x, baseY - s * 0.5); b.rotate(rot || 0);
  artBlob(b, 0, 0, s * 0.36, s * 0.5, col, { lineColor: artShade(col, -0.45), hi: 0.45 });
  b.fillStyle = artShade(col, -0.22);
  b.beginPath(); htPohjDot(b, -s * 0.1, s * 0.12, s * 0.07); htPohjDot(b, s * 0.13, -s * 0.06, s * 0.06); htPohjDot(b, 0, -s * 0.28, s * 0.045); b.fill();
  b.restore();
}
// Pesä ja munat
function htPohjNest(b, x, baseY, s, cols) {
  var i;
  artShadow(b, x, baseY, s * 0.6, s * 0.12, 0.18);
  drawNestBowl(b, x, baseY - s * 0.2, s * 0.32, false);
  for (i = 0; i < cols.length; i++) htPohjEgg(b, x + (i - (cols.length - 1) / 2) * s * 0.26, baseY - s * 0.2, s * 0.5, cols[i], (i - 1) * 0.25);
  drawNestBowl(b, x, baseY - s * 0.2, s * 0.32, true);
}
// Lämmin kalliopiikki
function htPohjSpire(b, x, baseY, s, col) {
  b.beginPath();
  b.moveTo(x - s * 0.3, baseY);
  b.quadraticCurveTo(x - s * 0.28, baseY - s * 0.6, x - s * 0.1, baseY - s);
  b.quadraticCurveTo(x + s * 0.02, baseY - s * 1.08, x + s * 0.12, baseY - s * 0.92);
  b.quadraticCurveTo(x + s * 0.3, baseY - s * 0.5, x + s * 0.32, baseY);
  b.closePath();
  artFillPath(b, col, baseY - s, baseY, s * 0.3, { hi: 0.2 });
  b.strokeStyle = artRGBA(artShade(col, -0.4), 0.45);
  b.lineWidth = Math.max(1, s * 0.025);
  b.beginPath(); b.moveTo(x - s * 0.22, baseY - s * 0.35); b.lineTo(x + s * 0.24, baseY - s * 0.4); b.stroke();
  b.beginPath(); b.moveTo(x - s * 0.15, baseY - s * 0.68); b.lineTo(x + s * 0.18, baseY - s * 0.62); b.stroke();
  artHighlight(b, x - s * 0.1, baseY - s * 0.7, s * 0.05, s * 0.14, 0.3);
}
// Saniainen, jonka lehdillä on pienet lehdykät
function htPohjFern(b, x, baseY, s, col) {
  var i, a, k, ex, ey;
  for (i = 0; i < 5; i++) {
    a = -Math.PI / 2 + (i - 2) * 0.42;
    ex = x + Math.cos(a) * s * 0.55; ey = baseY + Math.sin(a) * s * 0.55;
    artLimb(b, x, baseY, ex, ey, s * 0.05, col, artShade(col, -0.4));
    for (k = 1; k < 4; k++) {
      artBlob(b, x + (ex - x) * k / 4, baseY + (ey - baseY) * k / 4, s * 0.07 * (1.2 - k * 0.2), s * 0.035, artShade(col, 0.12), { rot: a + 1.2, line: false });
      artBlob(b, x + (ex - x) * k / 4, baseY + (ey - baseY) * k / 4, s * 0.07 * (1.2 - k * 0.2), s * 0.035, artShade(col, 0.12), { rot: a - 1.2, line: false });
    }
  }
}

HUB_THEMES.dragon = {
  sky: ['#ffab8a', '#ffecc8'],
  ground: ['#a9cf6a', '#9cc35e'],
  earth: '#9a5a34',
  path: ['#b4693e', '#f8d8a8'],
  arch: '#ffe9cc',
  density: 0.94,
  backdrop: function (b, w, h, lay) {
    var sd = htPohjSides(lay, w), u = h * 0.1, i, x, side, k;
    artGlow(b, w * 0.5, h * 0.42, w * 0.55, '#fff2c0', 0.55);
    hubThemeClouds(b, w, h, 6, 0.7);
    // Kaukaiset vuoret ja tulivuori vasemmalla
    htPohjRidge(b, w, h, h * 0.42, h * 0.07, 7, 0.8, '#d9a0a8');
    htPohjVolcano(b, htPohjSideX(sd, w, 0, 0.45), h * 0.5, u * 2.6);
    htPohjVolcano(b, htPohjSideX(sd, w, 1, 0.35), h * 0.47, u * 1.5);
    htPohjRidge(b, w, h, h * 0.52, h * 0.035, 5, 2.4, '#c9b070');
    // Lentävä lohikäärme oikealla taivaalla
    drawBabyDragon(b, htPohjSideX(sd, w, 1, 0.6), h * 0.3, u * 0.32, '#ff8ab0', { flap: 0.6, noShadow: true });
    // Kalliopiikit ja metsä
    for (side = 0; side < 2; side++) {
      for (i = 0; i < 5; i++) {
        k = htPohjRnd(i * 7 + side * 3 + 5);
        x = htPohjSideX(sd, w, side, 0.06 + i * 0.22 + k * 0.05);
        htPohjSpire(b, x, h * 0.6 + k * h * 0.03, u * (1.1 + k * 0.6), i % 2 ? '#d98a5a' : '#c9704a');
      }
    }
    htPohjRidge(b, w, h, h * 0.62, h * 0.03, 6, 4, '#9cc35e', '#6f9a44');
    for (i = 0; i < 18; i++) {
      x = htPohjRnd(i + 120) * w;
      drawTree(b, x, h * 0.64 + htPohjRnd(i + 121) * h * 0.04, u * (0.45 + htPohjRnd(i + 122) * 0.2), 0, { leaf: i % 3 ? '#6cb85a' : '#8acb5c', trunk: '#8a5a34' });
    }
    htPohjRidge(b, w, h, h * 0.76, h * 0.02, 9, 1.3, '#b6d878', '#7ea24c');
    // Etualalla pesät munineen, saniaisia ja kristalleja
    htPohjNest(b, htPohjSideX(sd, w, 0, 0.55), h * 0.88, u * 1.7, ['#ffd0e0', '#b8e4ff', '#fff0a8']);
    htPohjNest(b, htPohjSideX(sd, w, 1, 0.5), h * 0.92, u * 1.4, ['#c9f0b0', '#ffc89a']);
    drawBabyDragon(b, htPohjSideX(sd, w, 1, 0.78), h * 0.86, u * 0.3, '#7fd0a0', { look: -0.2 });
    for (side = 0; side < 2; side++) {
      for (i = 0; i < 4; i++) {
        x = htPohjSideX(sd, w, side, 0.05 + i * 0.3);
        htPohjFern(b, x, h * (0.99 + (i % 2) * 0.02), u * 1.2, i % 2 ? '#4f9a50' : '#6cb85a');
      }
      drawNestCrystal(b, htPohjSideX(sd, w, side, side ? 0.2 : 0.2), h * 0.8, u * 0.35);
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.6);
    if (rnd < 0.4) hubThemeTuft(b, px, py, s, '#6f9a44');
    else if (rnd < 0.52) artBlob(b, px, py, s * 0.06, s * 0.04, '#d98a5a', { lineColor: '#8a4a2a' });
    else if (rnd < 0.6) drawFlower(b, px, py, s * 0.04, rnd2 < 0.5 ? '#ff8a5a' : '#ffd24f');
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.32) {
      artShadow(b, x, baseY, s * 0.38, s * 0.08, 0.16);
      htPohjSpire(b, x - s * 0.08, baseY, s * (0.9 + rnd2 * 0.4), rnd2 < 0.5 ? '#e8956a' : '#dc8a6a');
      if (rnd2 < 0.6) htPohjSpire(b, x + s * 0.24, baseY, s * 0.6, '#f2b080');
      htPohjFern(b, x + s * 0.2, baseY + s * 0.02, s * 0.35, '#6cb85a');
    } else if (rnd < 0.56) {
      htPohjFern(b, x, baseY, s * (0.95 + rnd2 * 0.3), rnd2 < 0.5 ? '#4f9a50' : '#6cb85a');
    } else if (rnd < 0.7) {
      htPohjNest(b, x, baseY, s * 0.75, rnd2 < 0.5 ? ['#ffd0e0', '#b8e4ff'] : ['#fff0a8', '#c9f0b0', '#ffc89a']);
    } else if (rnd < 0.84) {
      artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.15);
      drawNestCrystal(b, x - s * 0.06, baseY, s * 0.42);
      drawNestCrystal(b, x + s * 0.14, baseY, s * 0.26);
    } else {
      drawTree(b, x, baseY, s * 0.85, 0, { leaf: rnd2 < 0.5 ? '#6cb85a' : '#8acb5c', trunk: '#8a5a34' });
    }
  },
  // Kuoriutuva muna: kentän kuva haljenneen kuoren aukossa, pesä alla
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#ff8a5a', i, ex = s * 0.42, ey = s * 0.56, cy = y - s * 0.04;
    artShadow(c, x, y + s * 0.42, s * 0.56, s * 0.11, 0.2);
    artBlob(c, x, cy, ex, ey, '#fff4e0', { shadeTo: '#f0d4b0', lineColor: artShade(col, -0.45), hi: 0 });
    c.fillStyle = artRGBA(col, 0.75);
    c.beginPath();
    htPohjDot(c, x - ex * 0.72, cy - ey * 0.35, s * 0.06);
    htPohjDot(c, x + ex * 0.7, cy - ey * 0.45, s * 0.05);
    htPohjDot(c, x + ex * 0.15, cy - ey * 0.88, s * 0.045);
    htPohjDot(c, x - ex * 0.3, cy - ey * 0.8, s * 0.035);
    c.fill();
    // Halkeama-aukko sahalaitaisella reunalla
    c.beginPath();
    for (i = 0; i <= 16; i++) {
      var a = i / 16 * Math.PI * 2, rr = i % 2 ? 0.86 : 1;
      c.lineTo(x + Math.cos(a) * ex * 0.74 * rr, cy + s * 0.04 + Math.sin(a) * ey * 0.66 * rr);
    }
    c.closePath();
    var ig = c.createRadialGradient(x, cy, s * 0.05, x, cy, ey * 0.7);
    ig.addColorStop(0, st.cleared ? '#fff6cc' : '#fffaf0');
    ig.addColorStop(1, st.cleared ? '#ffc85a' : '#ffd9b0');
    c.fillStyle = ig; c.fill();
    c.strokeStyle = artShade(col, -0.3); c.lineWidth = Math.max(1.2, s * 0.03); c.lineJoin = 'round'; c.stroke();
    artHighlight(c, x - ex * 0.55, cy - ey * 0.6, s * 0.06, s * 0.1, 0.5);
    drawNestBowl(c, x, y + s * 0.3, s * 0.3, true);
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

// ==================== Hohtometsä ====================
// Hohtosieni: varsi, hehkuva hattu ja valopilkut
function htPohjShroom(b, x, baseY, s, col) {
  artGlow(b, x, baseY - s * 0.8, s * 0.8, col, 0.28);
  artRoundRect(b, x - s * 0.1, baseY - s * 0.7, s * 0.2, s * 0.7, s * 0.08, '#f0e8ff', { shadeTo: '#c0b0e8', lineColor: '#7a6ab0' });
  b.beginPath();
  b.moveTo(x - s * 0.48, baseY - s * 0.62);
  b.quadraticCurveTo(x - s * 0.46, baseY - s * 1.12, x, baseY - s * 1.14);
  b.quadraticCurveTo(x + s * 0.46, baseY - s * 1.12, x + s * 0.48, baseY - s * 0.62);
  b.quadraticCurveTo(x, baseY - s * 0.54, x - s * 0.48, baseY - s * 0.62);
  b.closePath();
  artFillPath(b, col, baseY - s * 1.14, baseY - s * 0.56, s * 0.4, { lineColor: artShade(col, -0.45) });
  b.fillStyle = 'rgba(240,255,252,0.9)';
  b.beginPath();
  htPohjDot(b, x - s * 0.22, baseY - s * 0.8, s * 0.06);
  htPohjDot(b, x + s * 0.08, baseY - s * 0.98, s * 0.07);
  htPohjDot(b, x + s * 0.28, baseY - s * 0.76, s * 0.05);
  b.fill();
}
// Hehkukello: kaartuva varsi ja roikkuvat valokellot
function htPohjBells(b, x, baseY, s, col) {
  var i, tx, ty;
  for (i = -1; i <= 1; i += 2) {
    tx = x + i * s * 0.18; ty = baseY - s * (0.7 + (i > 0 ? 0.1 : 0));
    b.strokeStyle = '#3f8a6a'; b.lineWidth = Math.max(1.2, s * 0.035); b.lineCap = 'round';
    b.beginPath(); b.moveTo(x, baseY); b.quadraticCurveTo(x, ty, tx, ty); b.stroke();
    artGlow(b, tx, ty + s * 0.12, s * 0.3, col, 0.5);
    b.beginPath(); b.arc(tx, ty + s * 0.1, s * 0.08, Math.PI, 0); b.lineTo(tx + s * 0.1, ty + s * 0.18); b.lineTo(tx - s * 0.1, ty + s * 0.18); b.closePath();
    artFillPath(b, col, ty, ty + s * 0.18, s * 0.08, { lineColor: artShade(col, -0.4) });
  }
  artBlob(b, x - s * 0.1, baseY - s * 0.12, s * 0.12, s * 0.04, '#4fae7a', { rot: -0.6, line: false });
  artBlob(b, x + s * 0.1, baseY - s * 0.16, s * 0.12, s * 0.04, '#4fae7a', { rot: 0.6, line: false });
}
// Pyöreä hämäräpuu (taustan siluetti tai seinän puu)
function htPohjDuskTree(b, x, baseY, s, col, glow) {
  artRoundRect(b, x - s * 0.07, baseY - s * 0.55, s * 0.14, s * 0.57, s * 0.05, artShade(col, -0.35), { line: false });
  artCircle(b, x - s * 0.28, baseY - s * 0.62, s * 0.3, col, { line: false });
  artCircle(b, x + s * 0.28, baseY - s * 0.64, s * 0.3, col, { line: false });
  artCircle(b, x, baseY - s * 0.86, s * 0.42, col, { line: false, hi: 0.12 });
  if (glow) {
    htPohjFirefly(b, x - s * 0.2, baseY - s * 0.9, s * 0.04);
    htPohjFirefly(b, x + s * 0.24, baseY - s * 0.7, s * 0.035);
  }
}

HUB_THEMES.glow = {
  sky: ['#4b4aa8', '#e8a8d8'],
  ground: ['#3f8f84', '#368276'],
  earth: '#5a4a8a',
  path: ['#8a78d8', '#f2ecff'],
  arch: '#e8e0ff',
  density: 0.95,
  backdrop: function (b, w, h, lay) {
    var sd = htPohjSides(lay, w), u = h * 0.1, i, x, side, k;
    htPohjStars(b, w, h, 60, 0.4, 0.85);
    htPohjMoon(b, w * 0.12, h * 0.12, h * 0.05);
    artGlow(b, w * 0.5, h * 0.5, w * 0.5, '#ffc8e8', 0.4);
    // Puurivit takaa eteen: sävy tummenee ja kylläistyy
    var rows = [['#9a86d0', 0.42, 0.5], ['#7a6cc0', 0.5, 0.7], ['#4f7f9a', 0.6, 0.9]];
    for (k = 0; k < rows.length; k++) {
      htPohjRidge(b, w, h, h * (rows[k][1] + 0.02), h * 0.02, 5 + k * 2, k, rows[k][0]);
      for (i = 0; i < 22; i++) {
        x = htPohjRnd(i + k * 50 + 200) * w;
        htPohjDuskTree(b, x, h * (rows[k][1] + 0.03 + htPohjRnd(i + k * 50 + 201) * 0.02), u * rows[k][2] * (0.8 + htPohjRnd(i + k * 9) * 0.5), rows[k][0], k === 2 && i % 3 === 0);
      }
    }
    htPohjRidge(b, w, h, h * 0.72, h * 0.02, 8, 2.5, '#3f8f84', '#2a6a60');
    // Jättisienet sivuilla
    for (side = 0; side < 2; side++) {
      htPohjShroom(b, htPohjSideX(sd, w, side, 0.35), h * 0.82, u * 2.2, side ? '#ff6ac8' : '#2fd0c0');
      htPohjShroom(b, htPohjSideX(sd, w, side, 0.72), h * 0.86, u * 1.3, side ? '#a070ff' : '#ffc83a');
      htPohjShroom(b, htPohjSideX(sd, w, side, 0.1), h * 0.88, u * 1.0, side ? '#2fd0c0' : '#ff6ac8');
      for (i = 0; i < 4; i++) {
        x = htPohjSideX(sd, w, side, 0.1 + i * 0.28);
        if (i % 2) htPohjBells(b, x, h * 0.97, u * 1.2, '#9ff0ff');
        else htPohjFern(b, x, h * 0.99, u * 1.1, '#3f9a7a');
      }
    }
    // Tulikärpäsiä
    for (i = 0; i < 30; i++) htPohjFirefly(b, htPohjRnd(i + 400) * w, h * (0.35 + htPohjRnd(i + 401) * 0.6), h * 0.004);
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.6);
    if (rnd < 0.4) hubThemeTuft(b, px, py, s, '#5fb89a');
    else if (rnd < 0.55) {
      artGlow(b, px, py, s * 0.1, '#9ff0ff', 0.5);
      artCircle(b, px, py, s * 0.025, '#e8ffff', { line: false, flat: true });
    } else if (rnd < 0.62) {
      artBlob(b, px, py, s * 0.05, s * 0.035, '#ff8ad8', { lineColor: '#9a3a8a' });
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    var cols = ['#2fd0c0', '#ff6ac8', '#a070ff', '#ffc83a'], col = cols[Math.floor(rnd2 * 4)];
    if (rnd < 0.45) {
      artShadow(b, x, baseY, s * 0.4, s * 0.08, 0.2);
      htPohjShroom(b, x - s * 0.08, baseY, s * (0.8 + rnd2 * 0.3), col);
      if (rnd2 < 0.6) htPohjShroom(b, x + s * 0.25, baseY, s * 0.45, cols[(Math.floor(rnd2 * 4) + 1) % 4]);
    } else if (rnd < 0.62) {
      htPohjFern(b, x, baseY, s * 0.95, rnd2 < 0.5 ? '#3f9a7a' : '#4fae8a');
    } else if (rnd < 0.8) {
      htPohjBells(b, x, baseY, s, rnd2 < 0.5 ? '#7fe8ff' : '#ffa8e8');
    } else {
      artShadow(b, x, baseY, s * 0.4, s * 0.08, 0.2);
      htPohjDuskTree(b, x, baseY, s * 1.1, rnd2 < 0.5 ? '#24857a' : '#5a4ac0', true);
    }
  },
  // Sieniportti: kaksi hohtavaa vartta ja leveä hattu kentän värissä
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#5fd4c8', base = y + s * 0.36, top = y - s * 0.3, i;
    artShadow(c, x, base + s * 0.02, s * 0.56, s * 0.11, 0.25);
    artGlow(c, x, y, s * 0.6, st.cleared ? '#ffe08a' : col, 0.45);
    artCircle(c, x, y + s * 0.02, s * 0.3, st.cleared ? '#fff3c4' : '#f6f2ff', { shadeTo: st.cleared ? '#ffd36a' : '#d8ccff', lineColor: artShade(col, -0.4) });
    for (i = -1; i <= 1; i += 2) artRoundRect(c, x + i * s * 0.36 - s * 0.07, top, s * 0.14, base - top, s * 0.06, '#f0e8ff', { shadeTo: '#c0b0e8', lineColor: '#7a6ab0' });
    c.beginPath();
    c.moveTo(x - s * 0.58, top + s * 0.06);
    c.quadraticCurveTo(x - s * 0.55, top - s * 0.42, x, top - s * 0.44);
    c.quadraticCurveTo(x + s * 0.55, top - s * 0.42, x + s * 0.58, top + s * 0.06);
    c.quadraticCurveTo(x, top - s * 0.04, x - s * 0.58, top + s * 0.06);
    c.closePath();
    artFillPath(c, col, top - s * 0.44, top + s * 0.06, s * 0.4, { lineColor: artShade(col, -0.45) });
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    htPohjDot(c, x - s * 0.3, top - s * 0.12, s * 0.05);
    htPohjDot(c, x + s * 0.04, top - s * 0.3, s * 0.06);
    htPohjDot(c, x + s * 0.34, top - s * 0.1, s * 0.045);
    c.fill();
    drawHubRoomIcon(c, room.kind, x, y + s * 0.02, s * 1.05);
  }
};

// ==================== Aurinkodyynit ====================
// Saguarokaktus käsivarsineen ja kukkineen
function htPohjCactus(b, x, baseY, s, flower) {
  var g = '#5fae54', line = '#2f6a2a';
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.16);
  artLimb(b, x - s * 0.2, baseY - s * 0.35, x - s * 0.2, baseY - s * 0.62, s * 0.11, g, line);
  artLimb(b, x - s * 0.2, baseY - s * 0.35, x, baseY - s * 0.35, s * 0.11, g, line);
  artLimb(b, x + s * 0.2, baseY - s * 0.5, x + s * 0.2, baseY - s * 0.72, s * 0.1, g, line);
  artLimb(b, x + s * 0.2, baseY - s * 0.5, x, baseY - s * 0.5, s * 0.1, g, line);
  artLimb(b, x, baseY, x, baseY - s * 0.9, s * 0.17, g, line);
  b.strokeStyle = 'rgba(255,255,255,0.35)'; b.lineWidth = Math.max(1, s * 0.025);
  b.beginPath(); b.moveTo(x - s * 0.03, baseY - s * 0.1); b.lineTo(x - s * 0.03, baseY - s * 0.85); b.stroke();
  if (flower) drawFlower(b, x, baseY - s * 0.98, s * 0.05, '#ff7bac');
}
// Pyöreä tynnyrikaktus kukkineen
function htPohjBarrel(b, x, baseY, s, col) {
  artShadow(b, x, baseY, s * 0.3, s * 0.07, 0.16);
  artBlob(b, x, baseY - s * 0.2, s * 0.22, s * 0.2, '#6cb85a', { lineColor: '#2f6a2a', hi: 0.3 });
  b.strokeStyle = 'rgba(47,106,42,0.5)'; b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.ellipse(x, baseY - s * 0.2, s * 0.1, s * 0.19, 0, 0, Math.PI * 2); b.stroke();
  drawFlower(b, x, baseY - s * 0.41, s * 0.045, col);
}
// Hiekkakivikasa
function htPohjSandRock(b, x, baseY, s) {
  artShadow(b, x, baseY, s * 0.4, s * 0.08, 0.16);
  artBlob(b, x + s * 0.14, baseY - s * 0.12, s * 0.2, s * 0.13, '#d99a5a', { hi: 0.2 });
  artBlob(b, x - s * 0.08, baseY - s * 0.2, s * 0.26, s * 0.2, '#e8ac68', { hi: 0.3 });
  b.strokeStyle = 'rgba(150,90,40,0.4)'; b.lineWidth = Math.max(1, s * 0.02);
  b.beginPath(); b.moveTo(x - s * 0.28, baseY - s * 0.2); b.lineTo(x + s * 0.12, baseY - s * 0.24); b.stroke();
}
// Kameli siluettina dyynin harjalla
function htPohjCamel(b, x, y, s, col) {
  b.fillStyle = col; b.strokeStyle = col; b.lineCap = 'round'; b.lineWidth = s * 0.08;
  var i;
  for (i = 0; i < 4; i++) {
    b.beginPath(); b.moveTo(x - s * 0.3 + i * s * 0.2, y - s * 0.45); b.lineTo(x - s * 0.32 + i * s * 0.2 + (i % 2) * s * 0.04, y); b.stroke();
  }
  b.beginPath(); b.ellipse(x, y - s * 0.55, s * 0.42, s * 0.16, 0, 0, Math.PI * 2); b.fill();
  b.beginPath(); b.arc(x - s * 0.12, y - s * 0.66, s * 0.16, Math.PI, 0); b.arc(x + s * 0.16, y - s * 0.64, s * 0.13, Math.PI, 0); b.fill();
  b.lineWidth = s * 0.11;
  b.beginPath(); b.moveTo(x + s * 0.36, y - s * 0.56); b.quadraticCurveTo(x + s * 0.55, y - s * 0.6, x + s * 0.56, y - s * 0.9); b.stroke();
  b.beginPath(); b.ellipse(x + s * 0.64, y - s * 0.92, s * 0.12, s * 0.06, 0.2, 0, Math.PI * 2); b.fill();
}
// Kameli tarrana: kyttyrät, satulaloimi ja hymy (katsoo oikealle)
function htPohjCamelSticker(b, x, y, s) {
  var fur = '#e0a868', dark = '#8a5a30', i;
  artShadow(b, x, y, s * 0.7, s * 0.12, 0.18);
  for (i = 0; i < 4; i++) artLimb(b, x - s * 0.32 + i * s * 0.2, y - s * 0.45, x - s * 0.33 + i * s * 0.2, y - s * 0.02, s * 0.09, i % 2 ? artShade(fur, -0.12) : fur, dark);
  artBlob(b, x - s * 0.12, y - s * 0.68, s * 0.2, s * 0.17, fur, { lineColor: dark, hi: 0.3 });
  artBlob(b, x + s * 0.16, y - s * 0.66, s * 0.17, s * 0.15, fur, { lineColor: dark, hi: 0.3 });
  artBlob(b, x, y - s * 0.52, s * 0.44, s * 0.17, fur, { lineColor: dark });
  artRoundRect(b, x - s * 0.18, y - s * 0.62, s * 0.36, s * 0.14, s * 0.05, '#ff7bac', { lineColor: '#a03a6a' });
  artLimb(b, x + s * 0.36, y - s * 0.55, x + s * 0.54, y - s * 0.86, s * 0.12, fur, dark);
  artBlob(b, x + s * 0.62, y - s * 0.9, s * 0.15, s * 0.09, fur, { rot: 0.2, lineColor: dark, hi: 0.3 });
  artBlob(b, x + s * 0.53, y - s * 1.0, s * 0.03, s * 0.05, fur, { lineColor: dark });
  artEye(b, x + s * 0.6, y - s * 0.93, s * 0.035, 0.4, false);
  artBlush(b, x + s * 0.66, y - s * 0.86, s * 0.03);
}
// Aavikkoteltta: raidallinen katos ja sidotut oviliepeet
function htPohjTent(b, x, baseY, s, col) {
  artShadow(b, x, baseY, s * 0.6, s * 0.1, 0.18);
  b.beginPath(); b.moveTo(x - s * 0.55, baseY); b.quadraticCurveTo(x - s * 0.2, baseY - s * 0.4, x, baseY - s * 0.75);
  b.quadraticCurveTo(x + s * 0.2, baseY - s * 0.4, x + s * 0.55, baseY); b.closePath();
  artFillPath(b, '#fff2dc', baseY - s * 0.75, baseY, s * 0.4, { shadeTo: '#f0d4a8', lineColor: artShade(col, -0.45) });
  b.save(); b.clip();
  b.fillStyle = artRGBA(col, 0.85);
  var i;
  for (i = -3; i <= 3; i += 2) b.fillRect(x + i * s * 0.12 - s * 0.05, baseY - s * 0.8, s * 0.1, s * 0.8);
  b.restore();
}

HUB_THEMES.desert = {
  sky: ['#78c8f0', '#fff0c4'],
  ground: ['#f6d690', '#efca7e'],
  earth: '#c4864a',
  path: ['#d0884a', '#fff4d4'],
  arch: '#fff0d0',
  density: 0.86,
  backdrop: function (b, w, h, lay) {
    var sd = htPohjSides(lay, w), u = h * 0.1, i, x, side;
    // Aurinko vasemmalla ylhäällä
    x = htPohjSideX(sd, w, 0, 0.45);
    artGlow(b, x, h * 0.16, h * 0.28, '#fff4b0', 0.7);
    artCircle(b, x, h * 0.16, h * 0.06, '#ffe070', { shadeTo: '#ffb840', lineColor: '#f09a30', hi: 0.4 });
    hubThemeClouds(b, w, h, 5, 0.75);
    // Pöytävuoret kaukana
    for (i = 0; i < 6; i++) {
      x = htPohjRnd(i + 500) * w; var mw = u * (0.8 + htPohjRnd(i + 501)), mh = u * (0.5 + htPohjRnd(i + 502) * 0.6);
      b.beginPath(); b.moveTo(x - mw, h * 0.46); b.lineTo(x - mw * 0.7, h * 0.46 - mh); b.lineTo(x + mw * 0.7, h * 0.46 - mh); b.lineTo(x + mw, h * 0.46); b.closePath();
      artFillPath(b, '#efb48a', h * 0.46 - mh, h * 0.46, mw, { line: false });
    }
    htPohjRidge(b, w, h, h * 0.47, h * 0.03, 5, 0.3, '#fbe0b0');
    // Kamelikaravaani kaukaisen dyynin harjalla
    for (side = 0; side < 2; side++) {
      for (i = 0; i < 3; i++) htPohjCamel(b, htPohjSideX(sd, w, side, 0.25 + i * 0.2), h * 0.52 - (side ? i : 2 - i) * h * 0.008, u * 0.42, '#c08a68');
    }
    htPohjRidge(b, w, h, h * 0.55, h * 0.045, 4, 2.0, '#f8d290', '#e0a860');
    // Keidas oikealla: lampi ja palmut
    x = htPohjSideX(sd, w, 1, 0.5);
    artBlob(b, x, h * 0.68, u * 1.6, u * 0.32, '#7fd4f0', { shadeTo: '#4aa8d8', lineColor: '#3a88b8', hi: 0.45 });
    htPohjFern(b, x - u * 1.3, h * 0.69, u * 0.6, '#5fae54');
    drawPalm(b, x - u * 0.9, h * 0.66, u * 1.7);
    drawPalm(b, x + u * 0.8, h * 0.67, u * 1.4);
    drawPalm(b, x + u * 0.1, h * 0.64, u * 1.1);
    htPohjRidge(b, w, h, h * 0.76, h * 0.03, 6, 3.6, '#f6c878', '#d89a50');
    // Etuala: teltta, kaktuksia ja kiviä
    htPohjTent(b, htPohjSideX(sd, w, 0, 0.55), h * 0.74, u * 1.6, '#ff8a5a');
    htPohjCactus(b, htPohjSideX(sd, w, 0, 0.2), h * 0.72, u * 1.5, true);
    htPohjCactus(b, htPohjSideX(sd, w, 0, 0.82), h * 0.9, u * 1.3, false);
    htPohjBarrel(b, htPohjSideX(sd, w, 0, 0.4), h * 0.93, u * 1.3, '#ffd24f');
    htPohjCamelSticker(b, htPohjSideX(sd, w, 0, 0.62), h * 0.86, u * 1.3);
    htPohjSandRock(b, htPohjSideX(sd, w, 0, 0.12), h * 0.97, u * 1.1);
    htPohjSandRock(b, htPohjSideX(sd, w, 1, 0.25), h * 0.9, u * 1.4);
    htPohjCactus(b, htPohjSideX(sd, w, 1, 0.7), h * 0.94, u * 1.6, true);
    htPohjBarrel(b, htPohjSideX(sd, w, 1, 0.9), h * 0.82, u * 1.1, '#ff7bac');
    // Hiekan väreilevät aallot
    b.strokeStyle = 'rgba(200,130,60,0.3)'; b.lineWidth = Math.max(1, h * 0.003); b.lineCap = 'round';
    for (i = 0; i < 24; i++) {
      x = htPohjRnd(i + 600) * w; var y = h * (0.8 + htPohjRnd(i + 601) * 0.18);
      b.beginPath(); b.moveTo(x - u * 0.3, y); b.quadraticCurveTo(x, y - u * 0.08, x + u * 0.3, y); b.stroke();
    }
  },
  floor: function (b, x, y, s, rnd, rnd2) {
    var px = x + s * (0.2 + rnd2 * 0.6), py = y + s * (0.25 + rnd * 0.6);
    if (rnd < 0.4) {
      b.strokeStyle = 'rgba(200,130,60,0.35)'; b.lineWidth = Math.max(1, s * 0.03); b.lineCap = 'round';
      b.beginPath(); b.moveTo(px - s * 0.15, py); b.quadraticCurveTo(px, py - s * 0.06, px + s * 0.15, py); b.stroke();
    } else if (rnd < 0.52) {
      artBlob(b, px, py, s * 0.05, s * 0.035, '#d8a070', { lineColor: '#9a6a3a' });
    } else if (rnd < 0.58) {
      hubThemeTuft(b, px, py, s, '#9ab04a');
    }
  },
  wall: function (b, x, baseY, s, rnd, rnd2) {
    if (rnd < 0.3) htPohjCactus(b, x, baseY, s * (0.95 + rnd2 * 0.35), rnd2 < 0.5);
    else if (rnd < 0.46) drawPalm(b, x, baseY, s * (0.95 + rnd2 * 0.25));
    else if (rnd < 0.66) {
      htPohjBarrel(b, x - s * 0.15, baseY, s * 0.9, rnd2 < 0.5 ? '#ff7bac' : '#ffd24f');
      if (rnd2 < 0.6) htPohjBarrel(b, x + s * 0.2, baseY - s * 0.02, s * 0.6, '#ff8a5a');
    } else if (rnd < 0.84) htPohjSandRock(b, x, baseY, s);
    else {
      artShadow(b, x, baseY, s * 0.4, s * 0.08, 0.14);
      artBlob(b, x, baseY - s * 0.06, s * 0.4, s * 0.12, '#f8dca0', { lineColor: '#d89a50', hi: 0.4 });
      hubThemeTuft(b, x - s * 0.1, baseY - s * 0.12, s * 1.4, '#8aa84a');
      hubThemeTuft(b, x + s * 0.15, baseY - s * 0.1, s * 1.2, '#9ab04a');
    }
  },
  // Raidallinen teltta: kentän kuva avoimessa oviaukossa, viiri katolla
  landmark: function (c, x, y, s, room, st) {
    var col = room.color || '#ffb84a', base = y + s * 0.36, dw = s * 0.31, top = y - s * 0.14;
    htPohjTent(c, x, base, s * 1.3, col);
    c.beginPath(); c.moveTo(x - dw, base); c.lineTo(x - dw, top); c.arc(x, top, dw, Math.PI, 0); c.lineTo(x + dw, base); c.closePath();
    var ig = c.createLinearGradient(0, top - dw, 0, base);
    ig.addColorStop(0, st.cleared ? '#fff3c4' : '#fffaf0');
    ig.addColorStop(1, st.cleared ? '#ffd36a' : '#ffe6c0');
    c.fillStyle = ig; c.fill();
    c.strokeStyle = artShade(col, -0.45); c.lineWidth = Math.max(1.2, s * 0.03); c.stroke();
    artLimb(c, x, base - s * 0.96, x, base - s * 1.2, s * 0.03, '#8a5a30');
    c.beginPath(); c.moveTo(x + s * 0.02, base - s * 1.2); c.lineTo(x + s * 0.24, base - s * 1.13); c.lineTo(x + s * 0.02, base - s * 1.06); c.closePath();
    artFillPath(c, col, base - s * 1.2, base - s * 1.06, s * 0.1, {});
    drawHubRoomIcon(c, room.kind, x, y - s * 0.02, s * 1.05);
  }
};

// ==================== Tökkäysyllätykset ====================
// Moottori heilauttaa tökätyn koristeen; tässä piirretään lajikohtainen yllätys
// koristeen päälle (pokeDraw) ja maiseman kohteille (spots + spotDraw).
// Joka 3. tökkäys (n % 3 === 0) on isompi yllätys. Lajit päätellään samoilla
// rnd-rajoilla kuin teeman wall-funktiossa.

// Maiseman kohteiden tökkäyslaskurit (id -> määrä)
var htPohjPokeSpotN = {};

// ---------- Ajoitusapurit ----------
function htPohjPokeClamp(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
function htPohjPokeEase(t) { t = htPohjPokeClamp(t); return 1 - (1 - t) * (1 - t); }
// Täysi näkyvyys, lopussa hiipuu pois
function htPohjPokeFade(k) { return k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3); }
// Kaari 0..1..0
function htPohjPokeBump(k) { return Math.sin(htPohjPokeClamp(k) * Math.PI); }
// Nousee ajassa a, pysyy, painuu lopussa takaisin
function htPohjPokeRise(k, a) {
  if (k < a) return htPohjPokeEase(k / a);
  return k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1;
}
// Putoaminen pompulla: 0 = alku, 1 = maassa
function htPohjPokeFall(t) {
  if (t < 1) return t * t;
  if (t < 1.4) return 1 - Math.sin((t - 1) / 0.4 * Math.PI) * 0.18;
  return 1;
}

// ---------- Yhteiset palat ----------
function htPohjPokeHeartPath(c, x, y, s) {
  c.moveTo(x, y + s * 0.55);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.4, y - s * 0.9, x, y - s * 0.25);
  c.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
}
// Nousevat sydämet
function htPohjPokeHearts(c, x, y, s, k, n) {
  var i, t, fa = htPohjPokeFade(k);
  for (i = 0; i < n; i++) {
    t = k - i * 0.12;
    if (t <= 0) continue;
    c.save();
    c.globalAlpha *= fa;
    drawHeartShape(c, x + (i - (n - 1) / 2) * s * 0.35 + Math.sin(t * 7 + i * 2) * s * 0.08, y - t * s * 1.1, s * (0.06 + 0.08 * htPohjPokeEase(t * 4)), true);
    c.restore();
  }
}
// Nuotti
function htPohjPokeNote(c, x, y, s, col) {
  var d = artShade(col, -0.4);
  artLimb(c, x + s * 0.22, y, x + s * 0.22, y - s * 0.75, s * 0.08, col, d);
  artLimb(c, x + s * 0.22, y - s * 0.75, x + s * 0.48, y - s * 0.5, s * 0.08, col, d);
  artBlob(c, x, y, s * 0.27, s * 0.2, col, { rot: -0.4, lineColor: d, hi: 0.35 });
}
// Nousevat nuotit
function htPohjPokeNotes(c, x, y, s, k, n, col) {
  var i, t, fa = htPohjPokeFade(k);
  for (i = 0; i < n; i++) {
    t = k - i * 0.15;
    if (t <= 0) continue;
    c.save();
    c.globalAlpha *= fa;
    htPohjPokeNote(c, x + (i % 2 ? 1 : -1) * s * 0.2 + Math.sin(t * 8 + i) * s * 0.12, y - t * s * 1.2, s * 0.22 * htPohjPokeEase(t * 4), col);
    c.restore();
  }
}
// Leviävä tähtikehä
function htPohjPokeTwinkles(c, x, y, s, k, n, seed) {
  var i, a, rr, sz = s * 0.09 * htPohjPokeBump(k);
  if (sz <= 0.3) return;
  for (i = 0; i < n; i++) {
    a = i / n * Math.PI * 2 + seed;
    rr = s * (0.2 + 0.55 * htPohjPokeEase(k * 1.4)) * (0.8 + htPohjRnd(i + seed * 10) * 0.4);
    drawStar(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, sz, k * 3 + i, 0);
  }
}
// Savurengas (tai sydämen muotoinen)
function htPohjPokeRing(c, x, y, r, a, heart) {
  if (a <= 0 || r <= 0) return;
  c.save();
  c.globalAlpha *= Math.min(1, a);
  c.beginPath();
  if (heart) htPohjPokeHeartPath(c, x, y, r);
  else c.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
  c.lineJoin = 'round';
  // Tumma reuna erottaa renkaan vaaleasta taivaasta ja lumesta
  c.lineWidth = r * 0.36; c.strokeStyle = heart ? 'rgba(220,90,140,0.55)' : 'rgba(120,120,170,0.45)'; c.stroke();
  c.lineWidth = r * 0.2; c.strokeStyle = heart ? 'rgba(255,200,220,1)' : 'rgba(255,255,255,0.95)'; c.stroke();
  c.restore();
}
// Savurenkaat piipusta; iso yllätys puhaltaa sydämen
function htPohjPokeSmoke(c, x, topY, s, k, big) {
  var i, t;
  for (i = 0; i < 3; i++) {
    t = (k - i * 0.16) / 0.7;
    if (t < 0 || t > 1) continue;
    htPohjPokeRing(c, x + Math.sin(t * 4 + i) * s * 0.08, topY - t * s * 0.9, s * (0.06 + t * 0.12), (1 - t) * 1.4, false);
  }
  if (big) {
    t = (k - 0.25) / 0.75;
    if (t > 0) htPohjPokeRing(c, x, topY - s * 0.35 - t * s * 0.9, s * (0.08 + t * 0.2), (1 - t) * 2, true);
  }
}
// Pieni lintu (tilhi, papukaija): katsoo oikealle, dir -1 peilaa
function htPohjPokeBird(c, x, y, s, col, flap, dir) {
  c.save(); c.translate(x, y); c.scale(dir || 1, 1);
  artBlob(c, -s * 0.36, s * 0.04, s * 0.17, s * 0.07, artShade(col, -0.2), { rot: 0.4 });
  artBlob(c, 0, 0, s * 0.32, s * 0.24, col, { hi: 0.3 });
  artCircle(c, s * 0.26, -s * 0.16, s * 0.17, col, { hi: 0.3 });
  c.fillStyle = '#ffb02e';
  c.beginPath(); c.moveTo(s * 0.4, -s * 0.21); c.lineTo(s * 0.58, -s * 0.14); c.lineTo(s * 0.4, -s * 0.09); c.closePath(); c.fill();
  artEye(c, s * 0.3, -s * 0.2, s * 0.05, 0.4, false);
  artBlob(c, -s * 0.04, -s * 0.12 - flap * s * 0.1, s * 0.2, s * 0.1, artShade(col, 0.2), { rot: -0.4 - flap * 0.6 });
  c.restore();
}
// Perhonen
function htPohjPokeButterfly(c, x, y, s, col, flap) {
  var w = 0.3 + 0.7 * Math.abs(Math.sin(flap));
  c.save(); c.translate(x, y);
  artBlob(c, -s * 0.2 * w, -s * 0.1, s * 0.2 * w + 0.5, s * 0.16, col, { rot: 0.4 });
  artBlob(c, s * 0.2 * w, -s * 0.1, s * 0.2 * w + 0.5, s * 0.16, col, { rot: -0.4 });
  artBlob(c, -s * 0.14 * w, s * 0.1, s * 0.13 * w + 0.5, s * 0.1, artShade(col, 0.25), { rot: -0.3 });
  artBlob(c, s * 0.14 * w, s * 0.1, s * 0.13 * w + 0.5, s * 0.1, artShade(col, 0.25), { rot: 0.3 });
  artBlob(c, 0, 0, s * 0.04, s * 0.17, '#5a3a5a', { line: false });
  c.restore();
}
// Kala hyppyasennossa
function htPohjPokeFish(c, x, y, s, rot, col) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.moveTo(-s * 0.24, 0); c.lineTo(-s * 0.48, -s * 0.16); c.lineTo(-s * 0.48, s * 0.16); c.closePath();
  artFillPath(c, artShade(col, -0.1), -s * 0.16, s * 0.16, s * 0.2, {});
  artBlob(c, 0, 0, s * 0.3, s * 0.17, col, { hi: 0.35 });
  artEye(c, s * 0.15, -s * 0.04, s * 0.05, 0.3, false);
  c.restore();
}
// Roiskuvat pisarat ja renkaat veden pinnalla
function htPohjPokeSplash(c, x, y, s, k, col) {
  var i, t, a, fa = htPohjPokeFade(k);
  c.save();
  c.globalAlpha *= fa;
  for (i = 0; i < 3; i++) {
    t = htPohjPokeClamp((k - i * 0.15) / 0.7);
    if (t <= 0) continue;
    c.strokeStyle = 'rgba(255,255,255,' + (1 - t) * 0.9 + ')';
    c.lineWidth = Math.max(1.2, s * 0.03);
    c.beginPath(); c.ellipse(x, y, s * (0.1 + t * 0.7), s * (0.04 + t * 0.2), 0, 0, Math.PI * 2); c.stroke();
  }
  t = htPohjPokeClamp(k / 0.6);
  if (t < 1) {
    for (i = 0; i < 7; i++) {
      a = -Math.PI / 2 + (i - 3) * 0.32;
      artCircle(c, x + Math.cos(a) * s * 0.5 * t, y + Math.sin(a) * s * 0.7 * t + t * t * s * 0.6, s * 0.035 * (1 - t * 0.5), col, { lineColor: '#ffffff', hi: 0.5 });
    }
  }
  c.restore();
}
// Hehkupölyt (itiöt, tulikärpäset, kipinät) nousevat kiemurrellen
function htPohjPokeSpores(c, x, y, s, k, col, n, seed, spread) {
  var i, r1, t, px, py, fa = htPohjPokeFade(k);
  for (i = 0; i < n; i++) {
    r1 = htPohjRnd(i + seed);
    t = htPohjPokeEase(k * (0.8 + r1 * 0.5));
    px = x + (r1 - 0.5) * s * 0.7 + Math.cos(i * 2.4) * t * s * (spread || 0.3) + Math.sin(k * 9 + i) * s * 0.06;
    py = y - t * s * (0.5 + htPohjRnd(i + seed + 50) * 0.7);
    artGlow(c, px, py, s * 0.14, col, 0.75 * fa);
    artCircle(c, px, py, s * 0.028, artMix('#ffffff', col, 0.2), { line: false, flat: true });
  }
}
// Kimmellys: hehku, leviävät renkaat ja tähdet; iso yllätys: sateenkaarisäteet
function htPohjPokeChime(c, x, y, s, k, col, big) {
  var i, t, a, cols = ['#ff6a6a', '#ffb84a', '#ffe24a', '#6ae07a', '#5ab8ff', '#b07aff'];
  artGlow(c, x, y, s * 1.1, col, 0.65 * htPohjPokeBump(k));
  if (big) {
    t = htPohjPokeEase(k * 2.2);
    c.save();
    c.lineCap = 'round';
    c.lineWidth = Math.max(2, s * 0.08);
    c.globalAlpha *= 0.75 * htPohjPokeFade(k);
    for (i = 0; i < 6; i++) {
      a = -Math.PI / 2 + (i - 2.5) * 0.3 + Math.sin(k * 4) * 0.08;
      c.strokeStyle = cols[i];
      c.beginPath(); c.moveTo(x + Math.cos(a) * s * 0.2, y + Math.sin(a) * s * 0.2); c.lineTo(x + Math.cos(a) * s * 1.5 * t, y + Math.sin(a) * s * 1.5 * t); c.stroke();
    }
    c.restore();
  }
  for (i = 0; i < 3; i++) {
    t = (k - i * 0.15) / 0.6;
    if (t <= 0 || t >= 1) continue;
    c.strokeStyle = artRGBA(i === 1 ? '#ffffff' : col, (1 - t) * 0.95);
    c.lineWidth = Math.max(1.5, s * 0.05);
    c.beginPath(); c.arc(x, y, s * (0.15 + t * 0.75), 0, Math.PI * 2); c.stroke();
  }
  htPohjPokeTwinkles(c, x, y, s, k, big ? 8 : 5, 1.3);
}
// Saniaisen kiehkurat aukeavat lehtien kärkiin
function htPohjPokeUnfurl(c, x, baseY, s, k, col, glow) {
  var i, j, q, a, tx, ty, ang, px, py, pts, u = htPohjPokeEase(k / 0.55), L = s * 0.42, seg = L / 12;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  c.lineCap = 'round';
  for (i = 0; i < 5; i++) {
    a = -Math.PI / 2 + (i - 2) * 0.42;
    tx = x + Math.cos(a) * s * 0.55; ty = baseY + Math.sin(a) * s * 0.55;
    if (glow) artGlow(c, tx, ty, s * 0.25, glow, 0.6 * htPohjPokeBump(k));
    // Kierre: kaarevuus pienenee kun verso aukeaa
    pts = [[tx, ty]];
    px = tx; py = ty; ang = a;
    for (j = 0; j < 12; j++) {
      ang += (1 - u) * 0.75 * (i < 2 ? -1 : 1) + (i < 2 ? -0.03 : 0.03);
      px += Math.cos(ang) * seg * (0.4 + u * 0.6); py += Math.sin(ang) * seg * (0.4 + u * 0.6);
      pts.push([px, py]);
    }
    for (j = 0; j < 2; j++) {
      c.strokeStyle = j ? artShade(col, 0.15) : artShade(col, -0.4);
      c.lineWidth = s * (j ? 0.045 : 0.07);
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (q = 1; q < pts.length; q++) c.lineTo(pts[q][0], pts[q][1]);
      c.stroke();
    }
    artCircle(c, px, py, s * 0.03, artShade(col, 0.3), { lineColor: artShade(col, -0.4) });
  }
  c.restore();
}

// ---------- Revontulimaa ----------
// Kuusesta putoaa lunta; iso: tilhi lehahtaa latvasta
function htPohjPokeSnow(c, x, baseY, s, k, big) {
  var cl = [[-0.1, -0.38, 0.09], [0.08, -0.58, 0.075], [0, -0.82, 0.06], [0.22, -0.32, 0.06], [-0.24, -0.5, 0.055]];
  var i, d, t, y0, r1, fa = htPohjPokeFade(k);
  c.save();
  c.globalAlpha *= fa;
  for (i = 0; i < cl.length; i++) {
    d = cl[i]; t = (k - i * 0.05) / 0.38;
    if (t < 0) continue;
    y0 = baseY + d[1] * s;
    if (t < 1) artBlob(c, x + d[0] * s * (1 + t * 0.4), y0 + t * t * (baseY - y0), s * d[2], s * d[2] * 0.8, '#ffffff', { lineColor: '#c8d4f0', hi: 0.4 });
    else {
      t = htPohjPokeClamp((t - 1) * 1.5);
      artBlob(c, x + d[0] * s * 1.4, baseY - s * 0.02, s * d[2] * (1.2 + t * 0.6), s * d[2] * (0.6 - t * 0.2), '#ffffff', { lineColor: '#c8d4f0' });
    }
  }
  c.fillStyle = '#ffffff';
  for (i = 0; i < 9; i++) {
    r1 = htPohjRnd(i + 700);
    c.beginPath();
    htPohjDot(c, x + (r1 - 0.5) * s * 1.1 + Math.sin(k * 6 + i) * s * 0.06, baseY - s * (0.95 - k * (0.5 + r1 * 0.45)), s * 0.022);
    c.fill();
  }
  c.restore();
  if (big && k > 0.1) {
    t = htPohjPokeEase((k - 0.1) / 0.8);
    c.save();
    c.globalAlpha *= fa;
    htPohjPokeBird(c, x + t * s * 0.9, baseY - s * 0.85 - t * s * 0.6 - Math.sin(t * Math.PI) * s * 0.1, s * 0.32, '#e89a7a', Math.sin(k * 50), 1);
    c.restore();
    htPohjPokeHearts(c, x, baseY - s * 0.9, s, k, 2);
  }
}
// Lumijänis: pää kurkistaa kiven takaa (kiven alue rajataan pois)
function htPohjPokeHare(c, x, y, s, blink) {
  var i;
  for (i = -1; i <= 1; i += 2) {
    artBlob(c, x + i * s * 0.1, y - s * 0.32, s * 0.07, s * 0.2, '#ffffff', { rot: i * 0.15, lineColor: '#9aa8c0' });
    artBlob(c, x + i * s * 0.1, y - s * 0.3, s * 0.03, s * 0.13, '#ffc8d8', { rot: i * 0.15, line: false });
  }
  artCircle(c, x, y, s * 0.2, '#ffffff', { shadeTo: '#e4ecf8', lineColor: '#9aa8c0', hi: 0.4 });
  artEye(c, x - s * 0.07, y - s * 0.03, s * 0.04, 0.2, blink);
  artEye(c, x + s * 0.07, y - s * 0.03, s * 0.04, 0.2, blink);
  artCircle(c, x, y + s * 0.06, s * 0.03, '#ff8aa8', { line: false });
  artBlush(c, x - s * 0.12, y + s * 0.07, s * 0.035);
  artBlush(c, x + s * 0.12, y + s * 0.07, s * 0.035);
}
function htPohjPokeRockHare(c, x, clipY, s, k, big) {
  var up = htPohjPokeRise(k, 0.2), blink = k > 0.45 && k < 0.53;
  c.save();
  c.beginPath(); c.rect(x - s * 1.2, clipY - s * 2, s * 2.4, s * 2); c.clip();
  htPohjPokeHare(c, x + s * 0.06 + (big ? Math.sin(k * Math.PI * 3) * s * 0.06 : 0), clipY + s * 0.62 - up * s * (big ? 0.95 : 0.62), s * 0.9, blink);
  c.restore();
  if (big) htPohjPokeHearts(c, x, clipY - s * 0.6, s, k, 3);
}
// Puolukat ponnahtavat pensaasta; iso: marjoista syntyy sydän
function htPohjPokeBerries(c, x, baseY, s, k, big) {
  var st = [[0.1, -0.2], [-0.1, -0.12], [0.22, -0.1], [-0.2, -0.22]], i, t, bx, by, a, hx, hy, m = 12;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  if (!big) {
    for (i = 0; i < st.length; i++) {
      t = htPohjPokeClamp((k - i * 0.06) / 0.5);
      bx = x + s * st[i][0] * (1 + t * 2.4);
      by = baseY + s * st[i][1] * (1 - t) - Math.sin(t * Math.PI) * s * 0.45 + t * s * 0.02;
      artCircle(c, bx, by, s * 0.06, '#ff4f5e', { lineColor: '#a01a2a', hi: 0.5 });
    }
  } else {
    for (i = 0; i < m; i++) {
      a = i / m * Math.PI * 2;
      t = htPohjPokeEase((k - i * 0.03) / 0.3);
      hx = 16 * Math.pow(Math.sin(a), 3); hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      bx = x + hx * s * 0.022 * t; by = baseY - s * 0.2 + (hy * s * 0.022 - s * 0.6) * t;
      artCircle(c, bx, by, s * 0.06, '#ff4f5e', { lineColor: '#a01a2a', hi: 0.5 });
    }
  }
  c.restore();
}
// Lumiukon hattu pomppii päähän; iso: hattu tekee voltin. (x, y, ss) = drawNorthSnowmanin parametrit
function htPohjPokeSnowman(c, x, y, ss, k, big) {
  var hy = y - ss * 0.6, jump = Math.abs(Math.sin(k * Math.PI * (big ? 3 : 2))) * (1 - k) * ss * (big ? 0.8 : 0.4);
  var rot = big ? htPohjPokeEase(k / 0.8) * Math.PI * 4 : Math.sin(k * Math.PI * 4) * 0.3 * (1 - k);
  c.save();
  c.translate(x + ss * 0.01, hy - jump); c.rotate(rot);
  artRoundRect(c, -ss * 0.1, -ss * 0.22, ss * 0.2, ss * 0.22, ss * 0.03, '#3a3a5a', {});
  c.fillStyle = '#ff5a5a'; c.fillRect(-ss * 0.1, -ss * 0.08, ss * 0.2, ss * 0.045);
  artBlob(c, 0, 0, ss * 0.18, ss * 0.035, '#3a3a5a', {});
  c.restore();
  // Hymy
  c.strokeStyle = 'rgba(42,42,42,' + htPohjPokeFade(k) + ')';
  c.lineWidth = Math.max(1, ss * 0.018); c.lineCap = 'round';
  c.beginPath(); c.arc(x + ss * 0.01, y - ss * 0.46, ss * 0.06, 0.4, Math.PI - 0.4); c.stroke();
  if (big) {
    htPohjPokeTwinkles(c, x, y - ss * 0.6, ss * 1.4, k, 7, 0.4);
    htPohjPokeHearts(c, x, y - ss * 0.8, ss * 1.4, k, 2);
  }
}
// Kodan oviaukko lämpenee ja savureiästä nousee savurenkaita
function htPohjPokeKota(c, x, baseY, s, k, big) {
  artGlow(c, x, baseY - s * 0.15, s * (big ? 0.7 : 0.45), '#ffd36a', 0.6 * htPohjPokeBump(k));
  htPohjPokeSmoke(c, x, baseY - s * 0.92, s, k, big);
}
// Kuun ilme: vinkkaa ja hymyilee (sirppi on kuun vasemmassa reunassa)
function htPohjPokeMoonFace(c, x, y, r, k) {
  var wink = k > 0.3 && k < 0.6;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  artEye(c, x - r * 0.55, y - r * 0.25, r * 0.12, 0.3, wink);
  c.strokeStyle = '#a07a30'; c.lineWidth = Math.max(1, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.arc(x - r * 0.5, y + r * 0.1, r * 0.22, 0.3, Math.PI - 0.6); c.stroke();
  artBlush(c, x - r * 0.68, y + r * 0.12, r * 0.12);
  c.restore();
}
// Tähdenlento: pää ja hohtava vana
function htPohjPokeShoot(c, x, y, len, t) {
  if (t <= 0 || t >= 1) return;
  var hx = x - t * len, hy = y + t * len * 0.45, a = Math.sin(t * Math.PI);
  var g = c.createLinearGradient(hx, hy, hx + len * 0.35, hy - len * 0.16);
  g.addColorStop(0, 'rgba(255,250,210,' + 0.9 * a + ')');
  g.addColorStop(1, 'rgba(255,250,210,0)');
  c.strokeStyle = g; c.lineWidth = Math.max(2, len * 0.02); c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + len * 0.35, hy - len * 0.16); c.stroke();
  c.save(); c.globalAlpha *= a;
  drawStar(c, hx, hy, len * 0.04, t * 6, 1);
  c.restore();
}
// Kettu heiluttaa häntäänsä ja sulkee silmänsä tyytyväisenä. Piirretään taustan
// ketun päälle hieman venyneenä, jotta alkuperäinen jää kokonaan alle.
function htPohjPokeFox(c, x, y, s, k, big) {
  var fur = '#f08c3c', wag = Math.sin(k * Math.PI * (big ? 10 : 6)) * 0.2 * (1 - k), q = htPohjPokeBump(k * (big ? 3 : 2)) * (1 - k);
  var base = 0.04 * Math.min(1, (1 - k) * 5);
  c.save();
  c.translate(x, y);
  c.scale(1 + q * 0.06 + base, 1 + q * (big ? 0.18 : 0.1) + base);
  c.save();
  c.translate(-s * 0.08, -s * 0.12); c.rotate(wag); c.translate(s * 0.08, s * 0.12);
  artBlob(c, -s * 0.34, -s * 0.12, s * 0.34, s * 0.14, fur, { rot: -0.3, hi: 0.2 });
  artBlob(c, -s * 0.6, -s * 0.2, s * 0.12, s * 0.09, '#fff4e8', { rot: -0.3, line: false });
  c.restore();
  artBlob(c, 0, -s * 0.3, s * 0.24, s * 0.3, fur, { hi: 0.25 });
  artBlob(c, s * 0.04, -s * 0.24, s * 0.12, s * 0.2, '#fff4e8', { line: false });
  artCircle(c, s * 0.08, -s * 0.66, s * 0.2, fur, { hi: 0.3 });
  artBlob(c, -s * 0.04, -s * 0.86, s * 0.07, s * 0.12, fur, { rot: -0.3 });
  artBlob(c, s * 0.2, -s * 0.86, s * 0.07, s * 0.12, fur, { rot: 0.3 });
  artBlob(c, s * 0.22, -s * 0.6, s * 0.11, s * 0.07, '#fff4e8', { line: false });
  artCircle(c, s * 0.32, -s * 0.61, s * 0.03, '#4a2810', { line: false });
  artEye(c, s * 0.12, -s * 0.7, s * 0.045, 0.3, k > 0.2 && k < 0.7);
  artBlush(c, s * 0.16, -s * 0.58, s * 0.05);
  c.restore();
  htPohjPokeHearts(c, x + s * 0.1, y - s * 1.0, s * 1.2, k, big ? 3 : 1);
}
// Poro: piirretään päälle hieman venyneenä, kuono hehkuu punaisena
function htPohjPokeDeer(c, x, y, s, k, big) {
  var q = k < 0.5 ? htPohjPokeBump(k * 2) : 0;
  if (k < 0.85) {
    c.save();
    c.translate(x, y);
    c.scale(1 + q * 0.05, 1 + q * 0.1);
    drawNorthDeer(c, 0, 0, s, -1, 0, { noseT: 1, shakeT: big ? 1 : 0 });
    c.restore();
  }
  if (big) htPohjPokeTwinkles(c, x - s * 0.88, y - s * 0.62, s, k, 6, 0.7);
  htPohjPokeHearts(c, x - s * 0.5, y - s * 1.2, s * 1.3, k, big ? 3 : 1);
}
// Jäinen järvi: avannosta ponnahtaa kala
function htPohjPokeLake(c, x, y, s, k, big) {
  var t = htPohjPokeClamp((k - 0.1) / 0.6), hx = x + s * 0.35, o = htPohjPokeEase(k * 5);
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  artBlob(c, hx, y, s * 0.28 * o + 0.5, s * 0.09 * o + 0.5, '#3a78b8', { lineColor: '#ffffff', shadeTo: '#5aa0d8' });
  if (t > 0 && t < 1) htPohjPokeFish(c, hx - s * 0.5 * t + s * 0.25, y - Math.sin(t * Math.PI) * s * (big ? 1.0 : 0.6), s * 0.5, -Math.PI * 0.6 + t * Math.PI * 1.2, '#ff9a4a');
  c.restore();
  htPohjPokeSplash(c, hx, y, s * 0.6, k, '#bfe4f6');
  if (big) htPohjPokeHearts(c, hx, y - s * 0.9, s, k, 2);
}
// Revontulet välkähtävät kirkkaammiksi ja aaltoilevat
function htPohjPokeAurora(c, w, h, k, big) {
  var a = htPohjPokeBump(k);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.55 * a;
  htPohjAurora(c, w, h, h * 0.2, h * (0.045 + a * 0.02), h * 0.15, 0.4 + k * 3, '#30ff9a');
  if (big) {
    htPohjAurora(c, w, h, h * 0.12, h * 0.04, h * 0.1, 4.2 - k * 3, '#ff8ae8');
    htPohjAurora(c, w, h, h * 0.28, h * 0.04, h * 0.12, 2.1 + k * 2, '#40d0ff');
  }
  c.restore();
}

// ---------- Lohikäärmelaakso ----------
// Kalliopiikki: kivensirut vierivät ja huipulta pöllähtää lämmin höyry;
// iso: lohikäärmeenpoikanen ilmestyy huipulle
function htPohjPokeSpire(c, x, baseY, s, k, big) {
  var i, t, dir, top = baseY - s;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  for (i = 0; i < 3; i++) {
    t = htPohjPokeClamp((k - i * 0.1) / 0.55);
    if (t <= 0) continue;
    dir = i % 2 ? 1 : -1;
    artCircle(c, x + dir * s * (0.1 + t * 0.45), top + s * 0.2 + htPohjPokeFall(t * 1.2) * s * 0.75, s * 0.07, '#c9704a', { hi: 0.3 });
  }
  for (i = 0; i < 3; i++) {
    t = (k - i * 0.12) / 0.7;
    if (t > 0 && t < 1) {
      c.fillStyle = 'rgba(255,240,230,' + (1 - t) * 0.8 + ')';
      cloudShape(c, x + Math.sin(t * 3 + i) * s * 0.08, top - t * s * 0.6, s * (0.08 + t * 0.1));
    }
  }
  c.restore();
  if (big) {
    t = htPohjPokeRise(k, 0.25);
    c.save();
    c.globalAlpha *= Math.min(1, t * 2);
    drawBabyDragon(c, x, top + s * 0.05, s * 0.12, '#ff8ab0', { flap: Math.sin(k * 40), noShadow: true, squash: (1 - t) * 0.2 });
    c.restore();
    htPohjPokeHearts(c, x - s * 0.1, top - s * 0.35, s, k, 2);
  }
}
// Kuoriutuva muna: keikkuu, halkeaa ja poikasen pää kurkistaa; iso: sisarus lentää
// ex, ecy = munan keskikohta, es = munan koko (htPohjEgg), nest = [x, y, s] pesän etureunalle
function htPohjPokeHatch(c, ex, ecy, es, col, dcol, nest, k, big) {
  var rx = es * 0.36, ry = es * 0.5, fa = htPohjPokeFade(k), i, t, w;
  if (k < 0.32) {
    w = Math.sin(k * 60) * 0.2 * (k / 0.32);
    c.save();
    c.translate(ex, ecy + ry); c.rotate(w); c.translate(-ex, -(ecy + ry));
    htPohjEgg(c, ex, ecy + ry, es, col, 0);
    c.strokeStyle = artShade(col, -0.5); c.lineWidth = Math.max(1.2, es * 0.03); c.lineJoin = 'round';
    c.beginPath();
    for (i = 0; i <= Math.floor(8 * k / 0.32); i++) c.lineTo(ex - rx * 0.8 + i * rx * 0.2, ecy - ry * 0.05 + (i % 2 ? -1 : 1) * ry * 0.1);
    c.stroke();
    c.restore();
  } else {
    t = (k - 0.32) / 0.68;
    c.save();
    c.globalAlpha *= fa;
    drawDragonHead(c, ex, ecy - ry * 0.15 - htPohjPokeEase(t * 3) * ry * 0.45, rx * 0.85, dcol);
    // Alempi kuorenpuolikas sahalaitaisella reunalla
    c.beginPath();
    for (i = 0; i <= 8; i++) c.lineTo(ex - rx + i * rx / 4, ecy - ry * 0.05 + (i % 2 ? -1 : 1) * ry * 0.12);
    c.ellipse(ex, ecy, rx, ry, 0, 0, Math.PI);
    c.closePath();
    artFillPath(c, col, ecy, ecy + ry, rx, { lineColor: artShade(col, -0.45) });
    // Kuoren kansi lentää kaarena sivuun
    c.save();
    c.translate(ex + htPohjPokeEase(t * 1.5) * rx * 1.6, ecy - ry * 0.5 - Math.sin(htPohjPokeClamp(t * 1.5) * Math.PI) * ry * 0.9 + htPohjPokeClamp(t * 1.5 - 0.5) * ry * 0.9);
    c.rotate(t * 4);
    c.beginPath(); c.ellipse(0, 0, rx, ry * 0.5, 0, Math.PI, 0); c.closePath();
    artFillPath(c, col, -ry * 0.5, 0, rx, { lineColor: artShade(col, -0.45), hi: 0.3 });
    c.restore();
    c.restore();
  }
  if (nest) drawNestBowl(c, nest[0], nest[1], nest[2], true);
  if (big && k > 0.3) {
    t = htPohjPokeEase((k - 0.3) / 0.7);
    c.save();
    c.globalAlpha *= fa;
    drawBabyDragon(c, ex - es * 0.4 - t * es * 0.5, ecy - t * es * 1.4, es * 0.16, dcol === '#7fd0a0' ? '#ff8ab0' : '#7fd0a0', { flap: Math.sin(k * 45), noShadow: true });
    c.restore();
    htPohjPokeHearts(c, ex, ecy - es * 0.9, es * 1.6, k, 3);
  }
}
// Pesän keskimmäinen muna kuoriutuu (pesä htPohjNest(x, baseY, S, cols))
function htPohjPokeNest(c, x, baseY, S, cols, k, big) {
  var i = cols.length > 2 ? 1 : 0, es = S * 0.5, ex = x + (i - (cols.length - 1) / 2) * S * 0.26;
  var dcols = ['#ff8ab0', '#7fd0a0', '#8ab8ff', '#ffb84a'];
  htPohjPokeHatch(c, ex, baseY - S * 0.2 - es * 0.5, es, cols[i], dcols[cols.length % 4], [x, baseY - S * 0.2, S * 0.32], k, big);
}
// Tulikristalli hehkuu ja kipinöi
function htPohjPokeEmber(c, x, baseY, s, k, big) {
  htPohjPokeChime(c, x, baseY - s * 0.4, s, k, '#ffb84a', big);
  htPohjPokeSpores(c, x, baseY - s * 0.5, s * 1.4, k, '#ff8a4a', big ? 10 : 6, 30, 0.4);
}
// Puusta putoaa hedelmiä, jotka pomppivat maahan
function htPohjPokeFruit(c, x, baseY, s, k, big) {
  var f = [[-0.3, -0.7, '#ff8a3a'], [0.25, -0.85, '#ff5a6a'], [0.05, -1.05, '#ffc83a'], [-0.1, -0.6, '#ff5a6a'], [0.38, -0.62, '#ff8a3a']];
  var i, t, fx, fy, n = big ? 5 : 3, y0;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  for (i = 0; i < n; i++) {
    t = (k - i * 0.1) / 0.35;
    if (t < 0) continue;
    y0 = baseY + f[i][1] * s;
    fx = x + f[i][0] * s * (1 + htPohjPokeClamp(t - 1) * 0.5);
    fy = y0 + htPohjPokeFall(t) * (baseY - s * 0.04 - y0);
    artCircle(c, fx, fy, s * 0.08, f[i][2], { hi: 0.5 });
    artBlob(c, fx + s * 0.03, fy - s * 0.06, s * 0.03, s * 0.015, '#4f9a50', { line: false, rot: -0.5 });
  }
  c.restore();
  if (big) htPohjPokeHearts(c, x, baseY - s * 1.1, s, k, 2);
}
// Tulivuori puhaltaa ystävällisen savurenkaan
function htPohjPokeVolcano(c, x, baseY, s, k, big) {
  var top = baseY - s * 1.2;
  artGlow(c, x, top, s * 0.8, '#ffb84a', 0.5 * htPohjPokeBump(k));
  htPohjPokeSmoke(c, x, top - s * 0.1, s * 1.4, k, big);
  if (big) htPohjPokeSpores(c, x, top, s * 1.2, k, '#ffd060', 10, 60, 0.6);
}
// Lohikäärmeenpoikanen hihkaisee (suu auki) ja puhaltaa värikkään kipinäpilven
function htPohjPokeBaby(c, x, y, s, col, k, big, fly) {
  var q = k < 0.5 ? htPohjPokeBump(k * 2) : 0, i, t, mx = x - s * 1.25, my = y - s * 1.35, cols = ['#ff6a6a', '#ffb84a', '#ffe24a', '#ff8ae8'];
  if (k < 0.8) {
    c.save();
    c.translate(x, y);
    c.scale(1 + q * 0.06, 1 + q * 0.08);
    drawBabyDragon(c, 0, 0, s, col, { mouth: q, flap: fly ? 0.6 + Math.sin(k * 40) * 0.6 : Math.sin(k * 30) * q, noShadow: fly, look: -0.2 });
    c.restore();
  }
  for (i = 0; i < (big ? 9 : 5); i++) {
    t = (k - 0.1 - i * 0.04) / 0.6;
    if (t <= 0 || t >= 1) continue;
    c.save();
    c.globalAlpha *= 1 - t;
    artCircle(c, mx - t * s * (1.6 + i * 0.25), my + Math.sin(i * 1.7) * t * s * 0.6, s * (0.12 + t * 0.15), cols[i % 4], { line: false, hi: 0.4 });
    c.restore();
  }
  if (big) htPohjPokeHearts(c, x - s * 0.5, y - s * 2.6, s * 3, k, 3);
}

// ---------- Hohtometsä ----------
// Sieni hehkuu kirkkaasti ja päästää itiöitä; iso: tulikärpäsparvi kiertää
function htPohjPokeShroom(c, x, baseY, S, col, k, big) {
  var cy = baseY - S * 0.9, i, a, t;
  artGlow(c, x, cy, S * 1.0, col, 0.7 * htPohjPokeBump(k));
  artGlow(c, x, cy, S * 0.45, '#ffffff', 0.35 * htPohjPokeBump(k * 1.5));
  htPohjPokeSpores(c, x, cy - S * 0.1, S, k, col, big ? 6 : 9, 80, 0.35);
  if (big) {
    t = htPohjPokeEase(k * 1.3);
    for (i = 0; i < 8; i++) {
      a = i / 8 * Math.PI * 2 + k * 7;
      htPohjFirefly(c, x + Math.cos(a) * S * (0.2 + t * 0.6), cy - S * 0.2 + Math.sin(a) * S * (0.15 + t * 0.35) - t * S * 0.3, S * 0.035 * htPohjPokeFade(k) + 0.1);
    }
  }
}
// Hehkukellot keinuvat ja soivat
function htPohjPokeBells(c, x, baseY, s, col, k, big) {
  var i, j, tx, ty, sw = Math.sin(k * Math.PI * 5) * 0.5 * (1 - k), fa = htPohjPokeFade(k), t;
  for (i = -1; i <= 1; i += 2) {
    tx = x + i * s * 0.18; ty = baseY - s * (0.7 + (i > 0 ? 0.1 : 0));
    artGlow(c, tx, ty + s * 0.12, s * 0.45, col, 0.7 * htPohjPokeBump(k));
    c.save();
    c.globalAlpha *= fa;
    c.translate(tx, ty); c.rotate(sw * i); c.translate(-tx, -ty);
    c.beginPath(); c.arc(tx, ty + s * 0.1, s * 0.08, Math.PI, 0); c.lineTo(tx + s * 0.1, ty + s * 0.18); c.lineTo(tx - s * 0.1, ty + s * 0.18); c.closePath();
    artFillPath(c, artShade(col, 0.2), ty, ty + s * 0.18, s * 0.08, { lineColor: artShade(col, -0.4) });
    artCircle(c, tx, ty + s * 0.2, s * 0.025, '#ffffff', { lineColor: artShade(col, -0.4) });
    c.restore();
    // Ääniaallot
    for (j = 0; j < 2; j++) {
      t = (k - j * 0.18 - (i > 0 ? 0.1 : 0)) / 0.6;
      if (t <= 0 || t >= 1) continue;
      c.strokeStyle = artRGBA('#ffffff', (1 - t) * fa); c.lineWidth = Math.max(1.2, s * 0.025); c.lineCap = 'round';
      c.beginPath(); c.arc(tx, ty + s * 0.12, s * (0.14 + t * 0.25), i > 0 ? -0.7 : Math.PI - 0.7, i > 0 ? 0.7 : Math.PI + 0.7); c.stroke();
    }
  }
  if (big) htPohjPokeNotes(c, x, baseY - s * 0.9, s * 1.2, k, 3, col);
}
// Hämäräpuu: tulikärpäset pölähtävät latvuksesta; iso: pöllö avaa silmänsä
function htPohjPokeDusk(c, x, baseY, S, k, big) {
  var cy = baseY - S * 0.86, i, a, t = htPohjPokeEase(k * 1.2), fa = htPohjPokeFade(k), ex, op, blink;
  for (i = 0; i < 9; i++) {
    a = i / 9 * Math.PI * 2 + htPohjRnd(i + 90) * 0.5;
    htPohjFirefly(c, x + Math.cos(a) * S * (0.15 + t * 0.6), cy + Math.sin(a) * S * (0.1 + t * 0.4) - t * S * 0.15 + Math.sin(k * 12 + i) * S * 0.03, S * 0.03 * fa + 0.1);
  }
  if (big) {
    op = htPohjPokeRise(k, 0.2);
    blink = k > 0.45 && k < 0.52;
    for (i = -1; i <= 1; i += 2) {
      ex = x + i * S * 0.12;
      artGlow(c, ex, cy, S * 0.16, '#fff4a0', 0.5 * op);
      artBlob(c, ex, cy, S * 0.1, S * 0.1 * op + 0.3, '#fff4b0', { lineColor: '#5a4a20' });
      if (!blink && op > 0.4) {
        artCircle(c, ex, cy + S * 0.01, S * 0.05 * op, '#2a2a3a', { line: false });
        artCircle(c, ex - S * 0.02, cy - S * 0.02, S * 0.015, '#ffffff', { line: false, flat: true });
      }
    }
    c.fillStyle = 'rgba(255,170,60,' + op + ')';
    c.beginPath(); c.moveTo(x - S * 0.04, cy + S * 0.08); c.lineTo(x + S * 0.04, cy + S * 0.08); c.lineTo(x, cy + S * 0.15); c.closePath(); c.fill();
  }
}

// ---------- Aurinkodyynit ----------
// Kaktus kukkii: kukat aukeavat käsivarsien päihin; iso: kukkia joka puolelle ja terälehtisade
function htPohjPokeCactus(c, x, baseY, S, k, big) {
  var f = [[-0.2, -0.69, '#ff7bac'], [0.2, -0.78, '#ffd24f'], [0, -1.0, '#ff8a5a'], [-0.09, -0.55, '#ffd24f'], [0.09, -0.3, '#ff7bac'], [-0.09, -0.15, '#ff8a5a']];
  var i, t, n = big ? 6 : 3;
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  for (i = 0; i < n; i++) {
    t = htPohjPokeEase((k - i * 0.08) / 0.3);
    if (t <= 0) continue;
    drawFlower(c, x + f[i][0] * S, baseY + f[i][1] * S, S * 0.07 * t * (1 + htPohjPokeBump(k * 3) * 0.2), f[i][2]);
    artCircle(c, x + f[i][0] * S, baseY + f[i][1] * S, S * 0.035 * t + 0.1, '#fff4b0', { line: false });
  }
  if (big) {
    t = htPohjPokeClamp((k - 0.2) / 0.8);
    for (i = 0; i < 8; i++) {
      artBlob(c, x + (htPohjRnd(i + 900) - 0.5) * S * 1.2 + Math.sin(k * 6 + i) * S * 0.1, baseY - S * 1.1 + t * S * (0.8 + htPohjRnd(i + 910) * 0.4), S * 0.04, S * 0.025, i % 2 ? '#ff7bac' : '#ffd24f', { line: false, rot: k * 6 + i });
    }
  }
  c.restore();
}
// Palmusta putoaa kookospähkinä; iso: papukaija lehahtaa latvasta
function htPohjPokePalm(c, x, baseY, S, k, big) {
  var t = k / 0.3, y0 = baseY - S * 0.98, cx = x + S * 0.1 + htPohjPokeClamp(t - 1) * S * 0.35, cy;
  cy = y0 + htPohjPokeFall(t) * (baseY + S * 0.02 - y0);
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  artCircle(c, cx, cy, S * 0.065, '#8a5a30', { lineColor: '#4a2e14', hi: 0.3 });
  c.restore();
  if (t > 1 && t < 1.6) {
    c.fillStyle = 'rgba(240,215,160,' + (1.6 - t) + ')';
    cloudShape(c, cx, baseY, S * 0.08 * (t - 0.6));
  }
  if (big && k > 0.15) {
    t = htPohjPokeEase((k - 0.15) / 0.8);
    c.save();
    c.globalAlpha *= htPohjPokeFade(k);
    htPohjPokeBird(c, x - t * S * 0.8, baseY - S * 1.0 - t * S * 0.6, S * 0.3, '#ff5a5a', Math.sin(k * 45), -1);
    c.restore();
    htPohjPokeHearts(c, x, baseY - S * 1.1, S, k, 2);
  }
}
// Tynnyrikaktuksen kukka kasvaa ja pyörähtää; iso: mehiläinen pörrää ympäri
function htPohjPokeBarrel(c, x, baseY, s, col, k, big) {
  var fy = baseY - s * 0.41, b = htPohjPokeBump(k), t, bx, by;
  artGlow(c, x, fy, s * 0.3, '#fff4b0', 0.6 * b);
  c.save();
  c.translate(x, fy); c.rotate(k * 3);
  drawFlower(c, 0, 0, s * 0.045 * (1 + b * 0.8), col);
  artCircle(c, 0, 0, s * 0.03 * (1 + b * 0.6), '#fff4b0', { line: false });
  c.restore();
  htPohjPokeSpores(c, x, fy, s, k, '#ffe24a', 5, 120, 0.3);
  if (big) {
    t = k * Math.PI * 4;
    bx = x + Math.cos(t) * s * 0.4; by = fy - s * 0.2 + Math.sin(t * 1.5) * s * 0.15;
    c.save();
    c.globalAlpha *= htPohjPokeFade(k);
    artBlob(c, bx - s * 0.03, by - s * 0.07, s * 0.06, s * 0.04, '#ffffff', { line: false, rot: Math.sin(k * 80) * 0.6 });
    artBlob(c, bx, by, s * 0.08, s * 0.055, '#ffd24f', { lineColor: '#5a3a10' });
    c.fillStyle = '#3a2a10';
    c.fillRect(bx - s * 0.02, by - s * 0.05, s * 0.025, s * 0.1);
    artEye(c, bx + s * 0.045, by - s * 0.01, s * 0.018, 0, false);
    c.restore();
  }
}
// Lisko: pää kurkistaa kiven takaa ja kieli lipsahtaa; iso: lisko juoksee kiven yli
function htPohjPokeLizard(c, x, y, s, flip, tongue) {
  c.save(); c.translate(x, y); c.scale(flip, 1);
  artLimb(c, -s * 0.2, 0, -s * 0.55, s * 0.08, s * 0.07, '#7cc85a', '#2f6a2a');
  artBlob(c, 0, 0, s * 0.24, s * 0.1, '#7cc85a', { lineColor: '#2f6a2a', hi: 0.3 });
  artCircle(c, s * 0.27, -s * 0.04, s * 0.1, '#8cd86a', { lineColor: '#2f6a2a', hi: 0.3 });
  if (tongue > 0.05) artLimb(c, s * 0.35, -s * 0.02, s * 0.35 + s * 0.12 * tongue, -s * 0.02, s * 0.025, '#ff6a8a', false);
  artEye(c, s * 0.28, -s * 0.11, s * 0.04, 0.4, false);
  c.restore();
}
function htPohjPokeRock(c, x, baseY, s, k, big) {
  var t, up, tongue = (k > 0.3 && k < 0.7) ? Math.max(0, Math.sin(k * Math.PI * 8)) : 0;
  if (!big) {
    up = htPohjPokeRise(k, 0.2);
    c.save();
    c.beginPath(); c.rect(x - s, baseY - s * 2, s * 2, s * 1.62); c.clip();
    htPohjPokeLizard(c, x + s * 0.05, baseY - s * 0.26 - up * s * 0.16, s * 0.8, 1, tongue);
    c.restore();
  } else {
    t = htPohjPokeClamp(k / 0.8);
    c.save();
    c.globalAlpha *= htPohjPokeFade(k);
    htPohjPokeLizard(c, x - s * 0.5 + t * s * 1.1, baseY - s * 0.36 - Math.sin(t * Math.PI) * s * 0.12 + Math.abs(Math.sin(k * 40)) * s * 0.02, s * 0.8, 1, 0);
    c.restore();
    htPohjPokeHearts(c, x, baseY - s * 0.7, s, k, 2);
  }
}
// Kerä (rullaruoho) vierii hyppien; iso: pieni pölypyörre
function htPohjPokeTumbleweed(c, x, y, r, rot, a) {
  var i;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot);
  c.lineCap = 'round';
  c.strokeStyle = '#a8763e'; c.lineWidth = Math.max(1, r * 0.13);
  for (i = 0; i < 5; i++) { c.beginPath(); c.ellipse(0, 0, r, r * (0.3 + i * 0.15), i * 0.65, 0, Math.PI * 2); c.stroke(); }
  c.strokeStyle = '#e0b878'; c.lineWidth = Math.max(1, r * 0.07);
  for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(0, 0, r * 0.8, r * 0.35, i * 0.8 + 0.3, 0, Math.PI * 2); c.stroke(); }
  c.restore();
}
function htPohjPokeTuft(c, x, baseY, s, k, big) {
  var t = htPohjPokeClamp(k / 0.85), r = s * 0.2, i, a;
  htPohjPokeTumbleweed(c, x - s * 0.3 + t * s * 1.1, baseY - r - Math.abs(Math.sin(t * Math.PI * 3)) * s * 0.22 * (1 - t * 0.5), r, t * 9, htPohjPokeFade(k));
  if (big) {
    c.save();
    c.globalAlpha *= htPohjPokeFade(k) * 0.7;
    c.strokeStyle = '#d8a868'; c.lineCap = 'round'; c.lineWidth = Math.max(1, s * 0.03);
    for (i = 0; i < 5; i++) {
      a = k * 14 + i;
      c.beginPath(); c.ellipse(x + Math.sin(k * 6 + i) * s * 0.04, baseY - s * (0.1 + i * 0.13) * htPohjPokeEase(k * 2), s * (0.06 + i * 0.04), s * 0.025 * (1 + i * 0.3), 0, a, a + 4); c.stroke();
    }
    c.restore();
  }
}
// Aurinko hymyilee ja säteet pyörähtävät; iso: vinkkaa
function htPohjPokeSun(c, x, y, r, k, big) {
  var i, a, b = htPohjPokeBump(k), shut = k > 0.35 && k < 0.6;
  artGlow(c, x, y, r * 4, '#fff4b0', 0.6 * b);
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  c.strokeStyle = '#ffc840'; c.lineCap = 'round'; c.lineWidth = Math.max(2, r * 0.18);
  for (i = 0; i < 10; i++) {
    a = i / 10 * Math.PI * 2 + k * (big ? 6 : 2);
    c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25); c.lineTo(x + Math.cos(a) * r * (1.3 + b * 0.6), y + Math.sin(a) * r * (1.3 + b * 0.6)); c.stroke();
  }
  artEye(c, x - r * 0.35, y - r * 0.15, r * 0.14, 0, shut);
  artEye(c, x + r * 0.35, y - r * 0.15, r * 0.14, 0, shut && !big);
  c.strokeStyle = '#c87a20'; c.lineWidth = Math.max(1, r * 0.09);
  c.beginPath(); c.arc(x, y + r * 0.1, r * 0.35, 0.3, Math.PI - 0.3); c.stroke();
  artBlush(c, x - r * 0.6, y + r * 0.2, r * 0.14);
  artBlush(c, x + r * 0.6, y + r * 0.2, r * 0.14);
  c.restore();
}
// Kameli hymisee: nuotteja ja pieni keinahdus (tarrakameli piirretään päälle)
function htPohjPokeCamel(c, x, y, s, k, big, sticker) {
  var q = k < 0.5 ? htPohjPokeBump(k * 2) : 0;
  if (sticker && k < 0.8) {
    c.save();
    c.translate(x, y); c.scale(1 + q * 0.05, 1 + q * 0.08);
    htPohjCamelSticker(c, 0, 0, s);
    if (k > 0.3 && k < 0.6) {
      // Tyytyväiset silmät kiinni hymistessä
      artCircle(c, s * 0.6, -s * 0.93, s * 0.045, '#e0a868', { line: false });
      c.strokeStyle = '#4a2810'; c.lineWidth = Math.max(1, s * 0.02); c.lineCap = 'round';
      c.beginPath(); c.arc(s * 0.6, -s * 0.94, s * 0.03, 0.3, Math.PI - 0.3); c.stroke();
    }
    c.restore();
  }
  htPohjPokeNotes(c, x + s * 0.65, y - s * 1.05, s * (sticker ? 1 : 1.6), k, big ? 4 : 2, big ? '#ff7bac' : '#8a5cb8');
  if (big) htPohjPokeHearts(c, x, y - s * 1.0, s * 1.4, k, 2);
}
// Teltta: lyhty syttyy oviaukkoon ja katolta lepattaa viiri
function htPohjPokeTent(c, x, baseY, s, col, k, big) {
  var b = htPohjPokeBump(k), wv = Math.sin(k * 30) * s * 0.03;
  artGlow(c, x, baseY - s * 0.2, s * 0.5, '#ffd36a', 0.7 * b);
  c.save();
  c.globalAlpha *= htPohjPokeFade(k);
  artLimb(c, x, baseY - s * 0.73, x, baseY - s * 1.0, s * 0.025, '#8a5a30');
  c.beginPath(); c.moveTo(x + s * 0.01, baseY - s * 1.0); c.quadraticCurveTo(x + s * 0.12, baseY - s * 0.98 + wv, x + s * 0.24, baseY - s * 0.94 - wv); c.lineTo(x + s * 0.01, baseY - s * 0.86); c.closePath();
  artFillPath(c, col, baseY - s * 1.0, baseY - s * 0.86, s * 0.1, {});
  artCircle(c, x, baseY - s * 0.18, s * 0.06 * (0.5 + b * 0.5), '#ffe68a', { lineColor: '#c87a20', hi: 0.6 });
  c.restore();
  if (big) htPohjPokeTwinkles(c, x, baseY - s * 0.6, s, k, 7, 0.9);
}

// ---------- Kohteet ja äänet ----------
// Maiseman kohde: (bx, by, s) piirtopaikka, (x, y, r) napautusalue
function htPohjPokeSpot(list, id, kind, bx, by, s, x, y, r, extra) {
  var key, sp = { id: id, kind: kind, bx: bx, by: by, s: s, x: x, y: y, r: r, n: 0 };
  if (extra) for (key in extra) sp[key] = extra[key];
  sp.sound = function () {
    sp.n = htPohjPokeSpotN[id] = (htPohjPokeSpotN[id] || 0) + 1;
    htPohjPokeSound(kind, sp.n % 3 === 0);
  };
  list.push(sp);
}
// Lajikohtaiset äänet (moottorin perusääni soi lisäksi)
function htPohjPokeSound(kind, big) {
  var i;
  switch (kind) {
    case 'pine':
      playNote(196, 0.15, 0.3, 'sine', 0.25);
      for (i = 0; i < 4; i++) playNote(1568 - i * 160, 0.05 + i * 0.06, 0.08, 'sine', 0.1);
      if (big) { playNote(2093, 0.3, 0.06, 'sine', 0.15); playNote(2349, 0.38, 0.06, 'sine', 0.15); playNote(2093, 0.46, 0.08, 'sine', 0.15); }
      break;
    case 'hare': case 'lizard':
      playNote(kind === 'hare' ? 392 : 784, 0.05, 0.1, 'triangle', 0.2); playNote(kind === 'hare' ? 587 : 1047, 0.14, 0.12, 'triangle', 0.2);
      if (big) for (i = 0; i < 4; i++) playNote(880 + i * 110, 0.25 + i * 0.07, 0.07, 'triangle', 0.14);
      break;
    case 'crystal': case 'ember':
      for (i = 0; i < (big ? 5 : 3); i++) playNote([1047, 1319, 1568, 2093, 2637][i] * (kind === 'ember' ? 0.75 : 1), i * 0.09, 0.5, 'sine', 0.15);
      break;
    case 'bush': case 'cactus':
      for (i = 0; i < (big ? 6 : 3); i++) playNote(660 + i * 120, 0.05 + i * 0.07, 0.06, 'square', 0.06);
      break;
    case 'snowman': case 'sun':
      playNote(523, 0.05, 0.12, 'triangle', 0.2); playNote(659, 0.17, 0.12, 'triangle', 0.2);
      if (big) { playNote(784, 0.29, 0.12, 'triangle', 0.2); playNote(1047, 0.41, 0.25, 'triangle', 0.2); }
      break;
    case 'kota': case 'volcano':
      playNote(kind === 'kota' ? 220 : 147, 0.05, 0.35, 'sine', 0.3); playNote(kind === 'kota' ? 262 : 175, 0.3, 0.35, 'sine', 0.25);
      if (big) { playNote(659, 0.55, 0.15, 'sine', 0.18); playNote(784, 0.7, 0.15, 'sine', 0.18); playNote(1047, 0.85, 0.3, 'sine', 0.18); }
      break;
    case 'aurora':
      for (i = 0; i < (big ? 10 : 6); i++) playNote(880 * Math.pow(1.12, i), i * 0.07, 0.4, 'sine', 0.07);
      break;
    case 'moon':
      playNote(1175, 0.05, 0.3, 'sine', 0.15); playNote(1568, 0.25, 0.4, 'sine', 0.12);
      if (big) playNote(2093, 0.45, 0.5, 'sine', 0.1);
      break;
    case 'lake': case 'pond':
      playNote(440, 0.1, 0.08, 'sine', 0.25); playNote(880, 0.16, 0.12, 'sine', 0.2); playNote(330, 0.5, 0.06, 'triangle', 0.15);
      break;
    case 'deer':
      playNote(587, 0.05, 0.15, 'sine', 0.22); playNote(880, 0.2, 0.25, 'sine', 0.2);
      if (big) { playNote(1175, 0.4, 0.1, 'sine', 0.15); playNote(1397, 0.5, 0.2, 'sine', 0.15); }
      break;
    case 'fox':
      playNote(988, 0.05, 0.07, 'triangle', 0.18); playNote(1175, 0.14, 0.09, 'triangle', 0.18);
      if (big) playNote(1319, 0.24, 0.12, 'triangle', 0.18);
      break;
    case 'spire':
      for (i = 0; i < 3; i++) playNote(1300 - i * 150, 0.05 + i * 0.1, 0.04, 'triangle', 0.12);
      if (big) { playNote(1175, 0.4, 0.1, 'sine', 0.18); playNote(1397, 0.5, 0.15, 'sine', 0.18); }
      break;
    case 'fern':
      for (i = 0; i < 4; i++) playNote(523 * Math.pow(1.19, i), i * 0.1, 0.25, 'sine', 0.12);
      break;
    case 'nest':
      playNote(1500, 0.05, 0.03, 'square', 0.08); playNote(1400, 0.2, 0.03, 'square', 0.08); playNote(1600, 0.35, 0.03, 'square', 0.08);
      playNote(1568, 0.6, 0.1, 'sine', 0.2); playNote(1760, 0.72, 0.12, 'sine', 0.2);
      break;
    case 'tree':
      for (i = 0; i < (big ? 5 : 3); i++) playNote(330 + i * 40, 0.35 + i * 0.1, 0.08, 'triangle', 0.18);
      break;
    case 'baby':
      playNote(330, 0.05, 0.15, 'sawtooth', 0.06); playNote(523, 0.15, 0.2, 'triangle', 0.2); playNote(784, 0.3, 0.15, 'triangle', 0.15);
      break;
    case 'shroom':
      playNote(392, 0.05, 0.12, 'sine', 0.22); playNote(523, 0.13, 0.12, 'sine', 0.22); playNote(784, 0.21, 0.25, 'sine', 0.18);
      if (big) for (i = 0; i < 5; i++) playNote(1760 + i * 200, 0.35 + i * 0.06, 0.08, 'sine', 0.08);
      break;
    case 'bells':
      playNote(1319, 0.05, 0.6, 'sine', 0.2); playNote(1047, 0.3, 0.7, 'sine', 0.2);
      if (big) { playNote(1568, 0.55, 0.5, 'sine', 0.18); playNote(2093, 0.8, 0.7, 'sine', 0.16); }
      break;
    case 'dusk':
      for (i = 0; i < 4; i++) playNote(1760 + i * 220, 0.05 + i * 0.06, 0.06, 'sine', 0.08);
      if (big) { playNote(392, 0.35, 0.3, 'sine', 0.3); playNote(330, 0.75, 0.4, 'sine', 0.3); }
      break;
    case 'palm':
      playNote(196, 0.48, 0.1, 'square', 0.1); playNote(294, 0.56, 0.12, 'triangle', 0.15);
      if (big) { playNote(1397, 0.3, 0.08, 'square', 0.06); playNote(1047, 0.4, 0.1, 'square', 0.06); }
      break;
    case 'barrel':
      playNote(784, 0.05, 0.1, 'triangle', 0.18); playNote(988, 0.15, 0.15, 'triangle', 0.18);
      if (big) playNote(220, 0.2, 0.7, 'sawtooth', 0.04);
      break;
    case 'tumble':
      for (i = 0; i < 6; i++) playNote(440 - i * 30, i * 0.12, 0.08, 'triangle', 0.1);
      break;
    case 'camel': case 'camelS':
      playNote(196, 0.05, 0.4, 'sine', 0.28); playNote(247, 0.45, 0.4, 'sine', 0.25); playNote(220, 0.85, 0.5, 'sine', 0.22);
      break;
    case 'tent':
      playNote(440, 0.05, 0.2, 'sine', 0.18); playNote(554, 0.18, 0.2, 'sine', 0.18); playNote(659, 0.31, 0.35, 'sine', 0.18);
      break;
  }
}

// ---------- Teemoihin kytkentä ----------
function htPohjPokeNorthKind(rnd, rnd2) {
  if (rnd < 0.42) return 'pine';
  if (rnd < 0.58) return 'hare';
  if (rnd < 0.72) return 'crystal';
  if (rnd < 0.85) return 'bush';
  return rnd2 < 0.5 ? 'snowman' : 'kota';
}
HUB_THEMES.north.pokeColor = '#bfefff';
HUB_THEMES.north.pokeDur = 1.6;
HUB_THEMES.north.spotDur = 2.2;
HUB_THEMES.north.poke = function (p) { htPohjPokeSound(htPohjPokeNorthKind(p.rnd, p.rnd2), p.n % 3 === 0); };
HUB_THEMES.north.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0;
  switch (htPohjPokeNorthKind(rnd, rnd2)) {
    case 'pine': htPohjPokeSnow(c, rnd2 < 0.4 ? x - s * 0.2 : x, baseY, rnd2 < 0.4 ? s * 1.05 : s * (1.25 + rnd2 * 0.35), k, big); break;
    case 'hare': htPohjPokeRockHare(c, x, baseY - s * 0.3, s, k, big); break;
    case 'crystal': htPohjPokeChime(c, x, baseY - s * 0.3, s * 0.7, k, rnd2 < 0.5 ? '#9fe6ff' : '#d4b8ff', big); break;
    case 'bush': htPohjPokeBerries(c, x, baseY, s, k, big); break;
    case 'snowman': htPohjPokeSnowman(c, x, baseY - s * 0.2, s * 0.6, k, big); break;
    default: htPohjPokeKota(c, x, baseY, s * 0.85, k, big);
  }
};
// Kohteet etualalta taaksepäin: ensimmäinen osuma voittaa
HUB_THEMES.north.spots = function (w, h, lay) {
  var sd = htPohjSides(lay, w), u = h * 0.1, L = [], side, i, x, y;
  x = htPohjSideX(sd, w, 0, 0.3);
  htPohjPokeSpot(L, 'n-fox', 'fox', x, h * 0.97, u * 0.9, x, h * 0.97 - u * 0.45, u * 0.55);
  for (side = 0; side < 2; side++) {
    for (i = 0; i < 3; i++) {
      x = htPohjSideX(sd, w, side, 0.08 + i * 0.4); y = h * (0.98 + (i % 2) * 0.03);
      htPohjPokeSpot(L, 'n-pine' + side + i, 'pine', x, y, u * 1.6, x, y - u * 0.8, u * 0.55);
    }
  }
  x = htPohjSideX(sd, w, 1, 0.75);
  htPohjPokeSpot(L, 'n-snowman', 'snowman', x, h * 0.86, u * 0.9, x, h * 0.86 - u * 0.25, u * 0.5);
  x = htPohjSideX(sd, w, 0, 0.62);
  htPohjPokeSpot(L, 'n-kota2', 'kota', x, h * 0.84, u * 1.2, x, h * 0.84 - u * 0.45, u * 0.55);
  x = htPohjSideX(sd, w, 0, 0.3);
  htPohjPokeSpot(L, 'n-kota1', 'kota', x, h * 0.8, u * 1.6, x, h * 0.8 - u * 0.6, u * 0.7);
  x = htPohjSideX(sd, w, 1, 0.55);
  htPohjPokeSpot(L, 'n-deer1', 'deer', x, h * 0.72, u * 0.75, x, h * 0.72 - u * 0.4, u * 0.6);
  x = htPohjSideX(sd, w, 1, 0.3);
  htPohjPokeSpot(L, 'n-deer2', 'deer', x, h * 0.69, u * 0.55, x, h * 0.69 - u * 0.3, u * 0.45);
  x = htPohjSideX(sd, w, 0, 0.42);
  htPohjPokeSpot(L, 'n-lake', 'lake', x, h * 0.66, u, x, h * 0.66, u * 1.3);
  htPohjPokeSpot(L, 'n-moon', 'moon', w * 0.86, h * 0.11, h * 0.045, w * 0.86, h * 0.11, h * 0.075);
  for (side = 0; side < 2; side++) {
    x = htPohjSideX(sd, w, side, 0.5);
    htPohjPokeSpot(L, 'n-aurora' + side, 'aurora', x, h * 0.2, u, x, h * 0.2, u * 1.4);
  }
  if (lay.oy > h * 0.2) htPohjPokeSpot(L, 'n-aurora', 'aurora', w * 0.5, h * 0.16, u, w * 0.5, h * 0.16, u * 1.4);
  return L;
};
HUB_THEMES.north.spotDraw = function (c, sp, k, lay) {
  var big = sp.n % 3 === 0;
  switch (sp.kind) {
    case 'fox': htPohjPokeFox(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'pine': htPohjPokeSnow(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'snowman': htPohjPokeSnowman(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'kota': htPohjPokeKota(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'deer': htPohjPokeDeer(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'lake': htPohjPokeLake(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'moon':
      htPohjPokeMoonFace(c, sp.bx, sp.by, sp.s, k);
      htPohjPokeShoot(c, sp.bx - sp.s * 2, sp.by + sp.s, sp.s * 14, k / 0.7);
      if (big) {
        htPohjPokeShoot(c, sp.bx - sp.s * 5, sp.by - sp.s * 0.5, sp.s * 12, (k - 0.15) / 0.7);
        htPohjPokeShoot(c, sp.bx - sp.s * 8, sp.by + sp.s * 2, sp.s * 10, (k - 0.3) / 0.65);
      }
      break;
    case 'aurora':
      htPohjPokeAurora(c, viewW, viewH, k, big);
      htPohjPokeTwinkles(c, sp.x, sp.y, sp.s * 1.5, k, big ? 9 : 5, 0.2);
      break;
  }
};

function htPohjPokeDragonKind(rnd) {
  if (rnd < 0.32) return 'spire';
  if (rnd < 0.56) return 'fern';
  if (rnd < 0.7) return 'nest';
  if (rnd < 0.84) return 'ember';
  return 'tree';
}
// Perhosia lehahtaa saniaisesta
function htPohjPokeButterflies(c, x, baseY, s, k, n) {
  var i, t;
  for (i = 0; i < n; i++) {
    t = htPohjPokeEase((k - 0.15 - i * 0.1) / 0.8);
    if (t <= 0) continue;
    c.save();
    c.globalAlpha *= htPohjPokeFade(k);
    htPohjPokeButterfly(c, x + Math.sin(t * 5 + i * 2) * s * 0.4, baseY - s * 0.5 - t * s * (0.6 + i * 0.2), s * 0.6, ['#ffb84a', '#ff7bac', '#8ab8ff'][i % 3], k * 40 + i);
    c.restore();
  }
}
HUB_THEMES.dragon.pokeColor = '#ffc860';
HUB_THEMES.dragon.pokeDur = 1.8;
HUB_THEMES.dragon.spotDur = 2.2;
HUB_THEMES.dragon.poke = function (p) { htPohjPokeSound(htPohjPokeDragonKind(p.rnd), p.n % 3 === 0); };
HUB_THEMES.dragon.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, fs;
  switch (htPohjPokeDragonKind(rnd)) {
    case 'spire': htPohjPokeSpire(c, x - s * 0.08, baseY, s * (0.9 + rnd2 * 0.4), k, big); break;
    case 'fern':
      fs = s * (0.95 + rnd2 * 0.3);
      htPohjPokeUnfurl(c, x, baseY, fs, k, rnd2 < 0.5 ? '#4f9a50' : '#6cb85a', null);
      htPohjPokeButterflies(c, x, baseY, fs, k, big ? 3 : 1);
      break;
    case 'nest': htPohjPokeNest(c, x, baseY, s * 0.75, rnd2 < 0.5 ? ['#ffd0e0', '#b8e4ff'] : ['#fff0a8', '#c9f0b0', '#ffc89a'], k, big); break;
    case 'ember': htPohjPokeEmber(c, x, baseY, s * 0.42, k, big); break;
    default: htPohjPokeFruit(c, x, baseY, s * 0.85, k, big);
  }
};
HUB_THEMES.dragon.spots = function (w, h, lay) {
  var sd = htPohjSides(lay, w), u = h * 0.1, L = [], side, i, x, y;
  for (side = 0; side < 2; side++) {
    for (i = 0; i < 4; i++) {
      x = htPohjSideX(sd, w, side, 0.05 + i * 0.3); y = h * (0.99 + (i % 2) * 0.02);
      htPohjPokeSpot(L, 'd-fern' + side + i, 'fern', x, y, u * 1.2, x, y - u * 0.4, u * 0.45, { col: i % 2 ? '#4f9a50' : '#6cb85a' });
    }
  }
  x = htPohjSideX(sd, w, 1, 0.78);
  htPohjPokeSpot(L, 'd-baby', 'baby', x, h * 0.86, u * 0.3, x - u * 0.15, h * 0.86 - u * 0.5, u * 0.55);
  x = htPohjSideX(sd, w, 1, 0.5);
  htPohjPokeSpot(L, 'd-nest2', 'nest', x, h * 0.92, u * 1.4, x, h * 0.92 - u * 0.45, u * 0.6, { cols: ['#c9f0b0', '#ffc89a'] });
  x = htPohjSideX(sd, w, 0, 0.55);
  htPohjPokeSpot(L, 'd-nest1', 'nest', x, h * 0.88, u * 1.7, x, h * 0.88 - u * 0.55, u * 0.7, { cols: ['#ffd0e0', '#b8e4ff', '#fff0a8'] });
  for (side = 0; side < 2; side++) {
    x = htPohjSideX(sd, w, side, 0.2);
    htPohjPokeSpot(L, 'd-crystal' + side, 'ember', x, h * 0.8, u * 0.35, x, h * 0.8 - u * 0.2, u * 0.4);
  }
  x = htPohjSideX(sd, w, 1, 0.6);
  htPohjPokeSpot(L, 'd-sky', 'baby', x, h * 0.3, u * 0.32, x, h * 0.3 - u * 0.4, u * 0.6, { fly: true, col: '#ff8ab0' });
  x = htPohjSideX(sd, w, 0, 0.45);
  htPohjPokeSpot(L, 'd-volcano1', 'volcano', x, h * 0.5, u * 2.6, x, h * 0.5 - u * 2.2, u * 1.2);
  x = htPohjSideX(sd, w, 1, 0.35);
  htPohjPokeSpot(L, 'd-volcano2', 'volcano', x, h * 0.47, u * 1.5, x, h * 0.47 - u * 1.2, u * 0.8);
  return L;
};
HUB_THEMES.dragon.spotDraw = function (c, sp, k, lay) {
  var big = sp.n % 3 === 0;
  switch (sp.kind) {
    case 'fern':
      htPohjPokeUnfurl(c, sp.bx, sp.by, sp.s, k, sp.col, null);
      htPohjPokeButterflies(c, sp.bx, sp.by, sp.s * 0.8, k, big ? 3 : 1);
      break;
    case 'baby': htPohjPokeBaby(c, sp.bx, sp.by, sp.s, sp.col || '#7fd0a0', k, big, sp.fly); break;
    case 'nest': htPohjPokeNest(c, sp.bx, sp.by, sp.s, sp.cols, k, big); break;
    case 'ember': htPohjPokeEmber(c, sp.bx, sp.by, sp.s * 1.6, k, big); break;
    case 'volcano': htPohjPokeVolcano(c, sp.bx, sp.by, sp.s, k, big); break;
  }
};

function htPohjPokeGlowKind(rnd) {
  if (rnd < 0.45) return 'shroom';
  if (rnd < 0.62) return 'fern';
  if (rnd < 0.8) return 'bells';
  return 'dusk';
}
HUB_THEMES.glow.pokeColor = '#9ff0ff';
HUB_THEMES.glow.pokeDur = 1.8;
HUB_THEMES.glow.spotDur = 2.2;
HUB_THEMES.glow.poke = function (p) { htPohjPokeSound(htPohjPokeGlowKind(p.rnd), p.n % 3 === 0); };
HUB_THEMES.glow.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0, cols = ['#2fd0c0', '#ff6ac8', '#a070ff', '#ffc83a'];
  switch (htPohjPokeGlowKind(rnd)) {
    case 'shroom': htPohjPokeShroom(c, x - s * 0.08, baseY, s * (0.8 + rnd2 * 0.3), cols[Math.floor(rnd2 * 4)], k, big); break;
    case 'fern':
      htPohjPokeUnfurl(c, x, baseY, s * 0.95, k, rnd2 < 0.5 ? '#3f9a7a' : '#4fae8a', '#9ff0ff');
      htPohjPokeSpores(c, x, baseY - s * 0.5, s, k, '#fff6a0', big ? 10 : 4, 140, 0.6);
      break;
    case 'bells': htPohjPokeBells(c, x, baseY, s, rnd2 < 0.5 ? '#7fe8ff' : '#ffa8e8', k, big); break;
    default: htPohjPokeDusk(c, x, baseY, s * 1.1, k, big);
  }
};
HUB_THEMES.glow.spots = function (w, h, lay) {
  var sd = htPohjSides(lay, w), u = h * 0.1, L = [], side, i, x;
  for (side = 0; side < 2; side++) {
    for (i = 0; i < 4; i++) {
      x = htPohjSideX(sd, w, side, 0.1 + i * 0.28);
      if (i % 2) htPohjPokeSpot(L, 'g-bell' + side + i, 'bells', x, h * 0.97, u * 1.2, x, h * 0.97 - u * 0.6, u * 0.45, { col: '#9ff0ff' });
      else htPohjPokeSpot(L, 'g-fern' + side + i, 'fern', x, h * 0.99, u * 1.1, x, h * 0.99 - u * 0.4, u * 0.4, { col: '#3f9a7a' });
    }
  }
  for (side = 0; side < 2; side++) {
    x = htPohjSideX(sd, w, side, 0.1);
    htPohjPokeSpot(L, 'g-shroom3' + side, 'shroom', x, h * 0.88, u * 1.0, x, h * 0.88 - u * 0.75, u * 0.5, { col: side ? '#2fd0c0' : '#ff6ac8' });
    x = htPohjSideX(sd, w, side, 0.72);
    htPohjPokeSpot(L, 'g-shroom2' + side, 'shroom', x, h * 0.86, u * 1.3, x, h * 0.86 - u * 0.95, u * 0.6, { col: side ? '#a070ff' : '#ffc83a' });
    x = htPohjSideX(sd, w, side, 0.35);
    htPohjPokeSpot(L, 'g-shroom1' + side, 'shroom', x, h * 0.82, u * 2.2, x, h * 0.82 - u * 1.6, u * 1.0, { col: side ? '#ff6ac8' : '#2fd0c0' });
  }
  htPohjPokeSpot(L, 'g-moon', 'moon', w * 0.12, h * 0.12, h * 0.05, w * 0.12, h * 0.12, h * 0.08);
  return L;
};
HUB_THEMES.glow.spotDraw = function (c, sp, k, lay) {
  var big = sp.n % 3 === 0;
  switch (sp.kind) {
    case 'bells': htPohjPokeBells(c, sp.bx, sp.by, sp.s, sp.col, k, big); break;
    case 'fern':
      htPohjPokeUnfurl(c, sp.bx, sp.by, sp.s, k, sp.col, '#9ff0ff');
      htPohjPokeSpores(c, sp.bx, sp.by - sp.s * 0.5, sp.s, k, '#fff6a0', big ? 10 : 4, 140, 0.6);
      break;
    case 'shroom': htPohjPokeShroom(c, sp.bx, sp.by, sp.s, sp.col, k, big); break;
    case 'moon':
      htPohjPokeMoonFace(c, sp.bx, sp.by, sp.s, k);
      htPohjPokeShoot(c, sp.bx + sp.s * 9, sp.by - sp.s * 0.5, sp.s * 7, k / 0.7);
      if (big) htPohjPokeSpores(c, sp.bx, sp.by + sp.s * 2, sp.s * 4, k, '#fff6a0', 10, 160, 0.8);
      break;
  }
};

function htPohjPokeDesertKind(rnd) {
  if (rnd < 0.3) return 'cactus';
  if (rnd < 0.46) return 'palm';
  if (rnd < 0.66) return 'barrel';
  if (rnd < 0.84) return 'lizard';
  return 'tumble';
}
HUB_THEMES.desert.pokeColor = '#ffe27a';
HUB_THEMES.desert.pokeDur = 1.7;
HUB_THEMES.desert.spotDur = 2.2;
HUB_THEMES.desert.poke = function (p) { htPohjPokeSound(htPohjPokeDesertKind(p.rnd), p.n % 3 === 0); };
HUB_THEMES.desert.pokeDraw = function (c, x, baseY, s, rnd, rnd2, k, n) {
  var big = n % 3 === 0;
  switch (htPohjPokeDesertKind(rnd)) {
    case 'cactus': htPohjPokeCactus(c, x, baseY, s * (0.95 + rnd2 * 0.35), k, big); break;
    case 'palm': htPohjPokePalm(c, x, baseY, s * (0.95 + rnd2 * 0.25), k, big); break;
    case 'barrel': htPohjPokeBarrel(c, x - s * 0.15, baseY, s * 0.9, rnd2 < 0.5 ? '#ff7bac' : '#ffd24f', k, big); break;
    case 'lizard': htPohjPokeRock(c, x, baseY, s, k, big); break;
    default: htPohjPokeTuft(c, x, baseY, s, k, big);
  }
};
HUB_THEMES.desert.spots = function (w, h, lay) {
  var sd = htPohjSides(lay, w), u = h * 0.1, L = [], side, i, x, pm;
  x = htPohjSideX(sd, w, 0, 0.12);
  htPohjPokeSpot(L, 's-rock1', 'lizard', x, h * 0.97, u * 1.1, x, h * 0.97 - u * 0.25, u * 0.4);
  x = htPohjSideX(sd, w, 1, 0.7);
  htPohjPokeSpot(L, 's-cactus3', 'cactus', x, h * 0.94, u * 1.6, x, h * 0.94 - u * 0.75, u * 0.5);
  x = htPohjSideX(sd, w, 0, 0.4);
  htPohjPokeSpot(L, 's-barrel1', 'barrel', x, h * 0.93, u * 1.3, x, h * 0.93 - u * 0.3, u * 0.4, { col: '#ffd24f' });
  x = htPohjSideX(sd, w, 0, 0.82);
  htPohjPokeSpot(L, 's-cactus2', 'cactus', x, h * 0.9, u * 1.3, x, h * 0.9 - u * 0.6, u * 0.45);
  x = htPohjSideX(sd, w, 1, 0.25);
  htPohjPokeSpot(L, 's-rock2', 'lizard', x, h * 0.9, u * 1.4, x, h * 0.9 - u * 0.3, u * 0.45);
  x = htPohjSideX(sd, w, 0, 0.62);
  htPohjPokeSpot(L, 's-camel', 'camelS', x, h * 0.86, u * 1.3, x + u * 0.2, h * 0.86 - u * 0.75, u * 0.75);
  x = htPohjSideX(sd, w, 1, 0.9);
  htPohjPokeSpot(L, 's-barrel2', 'barrel', x, h * 0.82, u * 1.1, x, h * 0.82 - u * 0.25, u * 0.35, { col: '#ff7bac' });
  x = htPohjSideX(sd, w, 0, 0.55);
  htPohjPokeSpot(L, 's-tent', 'tent', x, h * 0.74, u * 1.6, x, h * 0.74 - u * 0.5, u * 0.7, { col: '#ff8a5a' });
  x = htPohjSideX(sd, w, 0, 0.2);
  htPohjPokeSpot(L, 's-cactus1', 'cactus', x, h * 0.72, u * 1.5, x, h * 0.72 - u * 0.7, u * 0.5);
  // Keitaan palmut ja lampi
  x = htPohjSideX(sd, w, 1, 0.5);
  pm = [[x - u * 0.9, h * 0.66, u * 1.7], [x + u * 0.8, h * 0.67, u * 1.4], [x + u * 0.1, h * 0.64, u * 1.1]];
  for (i = 0; i < 3; i++) htPohjPokeSpot(L, 's-palm' + i, 'palm', pm[i][0], pm[i][1], pm[i][2], pm[i][0] + pm[i][2] * 0.08, pm[i][1] - pm[i][2], pm[i][2] * 0.35);
  htPohjPokeSpot(L, 's-pond', 'pond', x, h * 0.68, u, x, h * 0.68, u * 1.3);
  for (side = 0; side < 2; side++) {
    for (i = 0; i < 3; i++) {
      x = htPohjSideX(sd, w, side, 0.25 + i * 0.2);
      htPohjPokeSpot(L, 's-car' + side + i, 'camel', x, h * 0.52 - (side ? i : 2 - i) * h * 0.008, u * 0.42, x + u * 0.1, h * 0.52 - u * 0.3, u * 0.32);
    }
  }
  x = htPohjSideX(sd, w, 0, 0.45);
  htPohjPokeSpot(L, 's-sun', 'sun', x, h * 0.16, h * 0.06, x, h * 0.16, h * 0.1);
  return L;
};
HUB_THEMES.desert.spotDraw = function (c, sp, k, lay) {
  var big = sp.n % 3 === 0, t;
  switch (sp.kind) {
    case 'lizard': htPohjPokeRock(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'cactus': htPohjPokeCactus(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'barrel': htPohjPokeBarrel(c, sp.bx, sp.by, sp.s, sp.col, k, big); break;
    case 'camelS': htPohjPokeCamel(c, sp.bx, sp.by, sp.s, k, big, true); break;
    case 'camel': htPohjPokeCamel(c, sp.bx, sp.by, sp.s, k, big, false); break;
    case 'tent': htPohjPokeTent(c, sp.bx, sp.by, sp.s, sp.col, k, big); break;
    case 'palm': htPohjPokePalm(c, sp.bx, sp.by, sp.s, k, big); break;
    case 'pond':
      htPohjPokeSplash(c, sp.bx, sp.by, sp.s * 0.8, k, '#7fd4f0');
      if (big) {
        t = htPohjPokeClamp((k - 0.1) / 0.6);
        if (t > 0 && t < 1) htPohjPokeFish(c, sp.bx + sp.s * 0.3 - t * sp.s * 0.6, sp.by - Math.sin(t * Math.PI) * sp.s * 0.9, sp.s * 0.5, -Math.PI * 0.6 + t * Math.PI * 1.2, '#ffb84a');
        htPohjPokeHearts(c, sp.bx, sp.by - sp.s * 0.9, sp.s, k, 2);
      }
      break;
    case 'sun': htPohjPokeSun(c, sp.bx, sp.by, sp.s, k, big); break;
  }
};
