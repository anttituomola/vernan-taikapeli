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
