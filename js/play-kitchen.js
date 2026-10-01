'use strict';

// Taikakeittiö: Hoivasaaren vartija. Pupuasiakkaat tilaavat värillisiä
// taikajuomia; kaada pullosta värit pataan niin, että sekoitus vastaa tilausta.
// Punainen + keltainen = oranssi, keltainen + sininen = vihreä, punainen +
// sininen = violetti. Väärä sekoitus pöhähtää ja tyhjenee. Ei sydämiä, ei
// liikkumista: pelkkiä napautuksia. Hellan pata, seinäkaappi ja porkkananippu
// ovat tökättäviä koristeita (props.js); kaapin päälle kurkistaa hiiri joka
// kolmannella tökkäyksellä (yllätys).

var K_ORDERS = 6;
var kitchen = { mix: null, orders: [], served: 0, customer: { x: 0, hop: 0, earT: 0, happyT: 0, inT: 0 }, serveT: 0, finishT: 0 };
var KITCHEN_WOOD = '#a9743f';
var KITCHEN_WOOD_LINE = '#5a3a18';

function kBottlePos(i) {
  return { x: viewW * (0.14 + i * 0.11), y: viewH * 0.46 };
}
function kCauldronPos() {
  return { x: viewW * 0.55, y: viewH * 0.72 };
}
function kCustomerPos() {
  return { x: viewW * 0.84, y: viewH * 0.78 };
}

function kNextOrder() {
  kitchen.mix = mixStateNew(kitchen.orders[kitchen.served]);
  kitchen.customer.inT = 0.8;
  kitchen.customer.happyT = 0;
  kitchen.customer.hop = 1;
}

function initKitchen() {
  var i, k, tmp, prim = ['R', 'Y', 'B'], sec = ['RY', 'YB', 'RB', 'RY', 'YB', 'RB'];
  tasks = [];
  // Tilaukset: ensin kaksi perusväriä, sitten sekoitukset
  for (i = prim.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = prim[i]; prim[i] = prim[k]; prim[k] = tmp; }
  for (i = sec.length - 1; i > 0; i--) { k = randInt(i + 1); tmp = sec[i]; sec[i] = sec[k]; sec[k] = tmp; }
  kitchen.orders = [prim[0], prim[1], sec[0], sec[1], sec[2], sec[3]];
  kitchen.served = 0;
  kitchen.serveT = 0;
  kitchen.finishT = 0;
  kitchen.customer.earT = 0;
  kNextOrder();
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
  princess.facing = 1;
  princess.walkPhase = 0;
  kitchenSetupProps();
  renderBackground();
  playNote(523, 0, 0.2, 'triangle', 0.35);
  playNote(659, 0.12, 0.2, 'triangle', 0.35);
  playNote(784, 0.24, 0.3, 'triangle', 0.35);
}

function respawnKitchen() {}
function resizeKitchen() {
  princess.x = viewW * 0.42;
  princess.y = viewH * 0.8;
  kitchenSetupProps();
}

function handleKitchenTap(px, py) {
  if (!running || celebrating) return;
  var i, p, dx, dy;
  if (kitchen.mix) {
    for (i = 0; i < 3; i++) {
      p = kBottlePos(i);
      dx = px - p.x; dy = py - p.y;
      if (dx * dx + dy * dy < viewH * 0.08 * viewH * 0.08) {
        var cp = kCauldronPos();
        var r = mixPour(kitchen.mix, MIX_PRIMARY[i], p.x, p.y + viewH * 0.04);
        if (r === 'fail') spawnSparkles(cp.x, cp.y - viewH * 0.1, 10, '#8a7a6a');
        return;
      }
    }
    // Asiakkaan napautus: hyppy ja tilaus kuuluu uudestaan
    p = kCustomerPos();
    if (Math.abs(px - p.x) < viewH * 0.1 && py < p.y && py > p.y - viewH * 0.3) {
      kitchen.customer.hop = 1;
      playNote(1300, 0, 0.08, 'sine', 0.25);
      playNote(1600, 0.07, 0.1, 'sine', 0.2);
      return;
    }
  }
  // Koristeet (pata, kaappi, porkkanat) vain, kun napautus ei osunut peliin
  propsTap(px + camX, py);
}

function updateKitchen(dt) {
  var k = kitchen, cp = kCauldronPos();
  k.customer.earT += dt * 3;
  if (k.customer.hop > 0) k.customer.hop = Math.max(0, k.customer.hop - dt * 3);
  if (k.customer.inT > 0) k.customer.inT -= dt;
  if (k.mix && !celebrating) {
    if (mixUpdate(k.mix, dt)) {
      // Tarjoilu: juoma valmis, pupu iloitsee
      k.served++;
      k.customer.happyT = 1.4;
      k.serveT = 1.4;
      spawnSparkles(cp.x, cp.y - viewH * 0.12, 20, mixColorOf(k.mix.target));
      k.mix = null;
      if (k.served >= K_ORDERS) k.finishT = 0.9;
    }
  }
  if (k.serveT > 0) {
    k.serveT -= dt;
    if (k.serveT <= 0 && k.served < K_ORDERS) kNextOrder();
  }
  if (k.finishT > 0 && !celebrating) {
    k.finishT -= dt;
    if (k.finishT <= 0) startCelebration();
  }
  if (k.customer.happyT > 0) {
    k.customer.happyT -= dt;
    k.customer.hop = Math.abs(Math.sin(globalT * 10));
  }
  propsUpdate(dt);
  updateParticles(dt);
  updateConfetti(dt);
}

// ---------- Koristeet (tökättävät) ----------
function kitchenSetupProps() {
  var vw = viewW, h = viewH;
  propsReset();
  propAdd({ x: vw * 0.14, y: h * 0.9, r: h * 0.07, hy: h * 0.08, color: '#ffd24f', amp: 0.04, note: 262, lidT: -1, bubT: -1,
    draw: kitchenDrawPot, poke: kitchenPokePot, update: kitchenUpdatePot });
  propAdd({ x: vw * 0.88, y: h * 0.38, r: h * 0.08, hy: h * 0.08, color: '#ffe27a', amp: 0.03, note: 330, mouse: -1,
    draw: kitchenDrawCupboard, poke: kitchenPokeCupboard, update: kitchenUpdateCupboard });
  propAdd({ x: vw * 0.76, y: h * 0.12, r: h * 0.06, hy: -h * 0.07, color: '#ff8f3a', amp: 0.14, note: 587,
    draw: kitchenDrawCarrots, poke: kitchenPokeCarrots });
}

// Hella ja kuparipata: kansi hypähtää ja pata kuplii tökkäyksestä
function kitchenDrawPot(c, p) {
  var s = viewH * 0.04, i, k, lid = 0, by;
  if (p.lidT >= 0) lid = Math.sin(Math.min(1, p.lidT / 0.45) * Math.PI) * s * 0.5;
  artShadow(c, 0, s * 0.1, s * 1.8, s * 0.3, 0.18);
  artRoundRect(c, -s * 1.6, -s * 1.6, s * 3.2, s * 1.6, s * 0.2, '#6a6a80', { lineColor: '#3a3346' });
  artBlob(c, 0, -s * 1.6, s * 1.2, s * 0.25, '#3a3346', { lineColor: '#1e1a28' });
  artCircle(c, -s * 1.1, -s * 0.8, s * 0.14, '#ff5f7e', { lineColor: '#8a1a28' });
  artCircle(c, s * 1.1, -s * 0.8, s * 0.14, '#7fd4ff', { lineColor: '#2a7ab8' });
  artRoundRect(c, -s * 1.0, -s * 2.7, s * 2.0, s * 1.1, s * 0.3, '#c9743f', { lineColor: '#6b3a18' });
  artLimb(c, -s * 1.0, -s * 2.3, -s * 1.4, -s * 2.3, s * 0.18, '#c9743f', '#6b3a18');
  artLimb(c, s * 1.0, -s * 2.3, s * 1.4, -s * 2.3, s * 0.18, '#c9743f', '#6b3a18');
  artBlob(c, 0, -s * 2.75 - lid, s * 1.1, s * 0.28, '#e0916a', { lineColor: '#6b3a18', hi: 0.4 });
  artCircle(c, 0, -s * 3.0 - lid, s * 0.14, '#6b3a18', { line: false });
  if (p.bubT >= 0) {
    k = p.bubT / 1.0;
    for (i = 0; i < 3; i++) {
      by = -s * 2.9 - k * s * (1.2 + i * 0.4);
      artCircle(c, (i - 1) * s * 0.5, by, s * (0.16 + i * 0.03) * (1 - k * 0.5), '#ffffff', { line: false, alpha: 0.7 * (1 - k) });
    }
  }
}
function kitchenPokePot(p) {
  p.lidT = 0;
  p.bubT = 0;
  playNote(196, 0, 0.12, 'triangle', 0.18);
  playNote(247, 0.1, 0.14, 'triangle', 0.16);
}
function kitchenUpdatePot(p, dt) {
  if (p.lidT >= 0) { p.lidT += dt; if (p.lidT > 0.45) p.lidT = -1; }
  if (p.bubT >= 0) { p.bubT += dt; if (p.bubT > 1.0) p.bubT = -1; }
}

// Seinäkaappi: kaksi ovea ja nupit. Joka kolmannella tökkäyksellä kaapin
// päälle kurkistaa hiiri (yllätys).
function kitchenDrawCupboard(c, p) {
  var s = viewH * 0.04, k, my;
  artRoundRect(c, -s * 1.75, -s * 3.6, s * 3.5, s * 3.6, s * 0.2, '#c98b4a', { lineColor: KITCHEN_WOOD_LINE });
  artRoundRect(c, -s * 1.55, -s * 3.4, s * 1.5, s * 3.2, s * 0.15, KITCHEN_WOOD, { lineColor: KITCHEN_WOOD_LINE });
  artRoundRect(c, s * 0.05, -s * 3.4, s * 1.5, s * 3.2, s * 0.15, KITCHEN_WOOD, { lineColor: KITCHEN_WOOD_LINE });
  artCircle(c, -s * 0.3, -s * 1.8, s * 0.12, '#ffe27a', { lineColor: '#8a6a3a' });
  artCircle(c, s * 0.3, -s * 1.8, s * 0.12, '#ffe27a', { lineColor: '#8a6a3a' });
  if (p.mouse >= 0) {
    k = p.mouse < 0.4 ? easeOutBack(p.mouse / 0.4) : (p.mouse > 1.8 ? Math.max(0, 1 - (p.mouse - 1.8) / 0.4) : 1);
    my = -s * 3.3 - k * s * 0.75;
    c.save();
    c.beginPath(); c.rect(-s * 1.75, -s * 6, s * 3.5, s * 2.4); c.clip();
    artCircle(c, -s * 1.25, my - s * 0.4, s * 0.17, '#c9b3cf', { lineColor: '#6a5a78' });
    artCircle(c, -s * 0.55, my - s * 0.4, s * 0.17, '#c9b3cf', { lineColor: '#6a5a78' });
    artBlob(c, -s * 0.9, my, s * 0.5, s * 0.42, '#d8c8e0', { lineColor: '#6a5a78', hi: 0.3 });
    artEye(c, -s * 1.08, my - s * 0.08, s * 0.07, 0.3, false);
    artEye(c, -s * 0.72, my - s * 0.08, s * 0.07, 0.3, false);
    artCircle(c, -s * 0.9, my + s * 0.15, s * 0.07, '#ff8fbe', { line: false });
    c.restore();
  }
}
function kitchenPokeCupboard(p) {
  if (p.n % 3 === 0 && p.mouse < 0) {
    p.mouse = 0;
    playNote(1800, 0.05, 0.08, 'sine', 0.18);
    playNote(2400, 0.13, 0.1, 'sine', 0.15);
  }
}
function kitchenUpdateCupboard(p, dt) {
  if (p.mouse >= 0) { p.mouse += dt; if (p.mouse > 2.2) p.mouse = -1; }
}

// Porkkananippu koukussa: keinahtaa ja pudottaa porkkanan tiskille
function kitchenDrawCarrots(c, p) {
  var s = viewH * 0.03, i;
  artCircle(c, 0, 0, s * 0.22, KITCHEN_WOOD_LINE, { lineColor: '#2e1c08' });
  artLimb(c, 0, 0, 0, s * 1.2, s * 0.1, '#c9a97a', '#8a6a3a');
  for (i = -1; i <= 1; i++) kitchenDrawCarrot(c, i * s * 0.75, s * 1.2 + Math.abs(i) * s * 0.3, s * 1.1, i * 0.35);
}
// Porkkana kärki alaspäin: naatti ylhäällä, käännettynä rot verran
function kitchenDrawCarrot(c, x, y, s, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  c.beginPath();
  c.moveTo(-s * 0.45, s * 0.3);
  c.quadraticCurveTo(-s * 0.3, s * 1.2, 0, s * 1.8);
  c.quadraticCurveTo(s * 0.3, s * 1.2, s * 0.45, s * 0.3);
  c.closePath();
  artFillPath(c, '#ff8f3a', s * 0.3, s * 1.8, s * 0.45, { lineColor: '#b85a14' });
  artBlob(c, -s * 0.2, 0, s * 0.12, s * 0.35, '#5fd36b', { rot: -0.5, lineColor: '#2f7a3a' });
  artBlob(c, s * 0.2, 0, s * 0.12, s * 0.35, '#5fd36b', { rot: 0.5, lineColor: '#2f7a3a' });
  c.restore();
}
function kitchenPokeCarrots(p) {
  var h = viewH;
  propDrop({ x: p.x + (Math.random() - 0.5) * h * 0.03, y: p.y + h * 0.06, vx: (Math.random() - 0.5) * viewW * 0.04, vy: -h * 0.05, ground: h * 0.66, life: 2.4,
    draw: kitchenDrawDropCarrot });
}
function kitchenDrawDropCarrot(c, d) {
  kitchenDrawCarrot(c, 0, -viewH * 0.02, viewH * 0.025, 0);
}

// ---------- Piirto ----------
function kitchenLayers() {
  return [
    { speed: 0.22, render: renderKitchenFar },
    { speed: 0.55, render: renderKitchenMid },
    { speed: 1, render: renderKitchenNear }
  ];
}
function renderKitchenBg(b, w, h) {
  renderKitchenFar(b, w, h);
  renderKitchenMid(b, w, h);
  renderKitchenNear(b, w, h);
}
function renderKitchenFar(b, w, h) {
  var wall = b.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#fff1dc');
  wall.addColorStop(1, '#f5d9bd');
  b.fillStyle = wall;
  b.fillRect(0, 0, w, h);
  drawBgSun(b, w * 0.62, h * 0.2, h * 0.055, 0.22, '#fff4c8', '#fffdf0', '#ffd45a');
}
function renderKitchenMid(b, w, h) {
  var i, x, y;
  b.fillStyle = 'rgba(255,255,255,0.35)';
  for (i = 0; i < 12; i++) for (y = 0; y < 5; y++) {
    x = h * 0.05 + i * h * 0.12 + (y % 2) * h * 0.06;
    b.beginPath(); b.arc(x, h * 0.06 + y * h * 0.11, h * 0.012, 0, Math.PI * 2); b.fill();
  }
}
function renderKitchenNear(b, w, h) {
  var vw = viewW, y;
  var wx = vw * 0.62, wy = h * 0.26, ww = h * 0.22, wh = h * 0.24;
  // Ikkuna: kehys, taivas, kukkula, pilvi ja ristikko
  artRoundRect(b, wx - ww / 2 - h * 0.012, wy - wh / 2 - h * 0.012, ww + h * 0.024, wh + h * 0.024, h * 0.02, KITCHEN_WOOD, { lineColor: KITCHEN_WOOD_LINE });
  var sky = b.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  sky.addColorStop(0, '#8fd0ff');
  sky.addColorStop(1, '#dff3ff');
  b.fillStyle = sky;
  b.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  b.save();
  b.beginPath(); b.rect(wx - ww / 2, wy - wh / 2, ww, wh); b.clip();
  b.beginPath(); b.arc(wx, wy + wh * 0.62, ww * 0.6, Math.PI, 0); b.closePath();
  artFillPath(b, '#7fcf68', wy + wh * 0.62 - ww * 0.6, wy + wh * 0.62, ww * 0.6, { line: false });
  drawCloud(b, wx - ww * 0.2, wy - wh * 0.2, h * 0.014, 0.9);
  b.restore();
  artLimb(b, wx, wy - wh / 2, wx, wy + wh / 2, h * 0.012, KITCHEN_WOOD, KITCHEN_WOOD_LINE);
  artLimb(b, wx - ww / 2, wy, wx + ww / 2, wy, h * 0.012, KITCHEN_WOOD, KITCHEN_WOOD_LINE);
  // Hylly pulloille
  artRoundRect(b, vw * 0.08, h * 0.52, vw * 0.36, h * 0.03, h * 0.01, '#c98b4a', { lineColor: KITCHEN_WOOD_LINE });
  artRoundRect(b, vw * 0.10, h * 0.55, h * 0.02, h * 0.05, h * 0.006, KITCHEN_WOOD, { lineColor: KITCHEN_WOOD_LINE });
  artRoundRect(b, vw * 0.42, h * 0.55, h * 0.02, h * 0.05, h * 0.006, KITCHEN_WOOD, { lineColor: KITCHEN_WOOD_LINE });
  // Lattia
  var floor = b.createLinearGradient(0, h * 0.62, 0, h);
  floor.addColorStop(0, '#e2b98a');
  floor.addColorStop(1, '#c48f5c');
  b.fillStyle = floor;
  b.fillRect(0, h * 0.62, w, h * 0.38);
  b.fillStyle = 'rgba(120,70,30,0.2)';
  for (y = h * 0.68; y < h; y += h * 0.07) b.fillRect(0, y, w, 2);
  // Jalkalista laventelina
  artRoundRect(b, -h * 0.02, h * 0.6, w + h * 0.04, h * 0.025, h * 0.004, '#c9a0ff', { lineColor: '#8a62b8' });
  // Tiski asiakkaalle
  artRoundRect(b, vw * 0.73, h * 0.72, vw * 0.22, h * 0.2, h * 0.01, KITCHEN_WOOD, { lineColor: '#4a2c12' });
  artRoundRect(b, vw * 0.72, h * 0.66, vw * 0.24, h * 0.06, h * 0.015, '#8a5a30', { lineColor: '#4a2c12' });
  artHighlight(b, vw * 0.76, h * 0.675, vw * 0.025, h * 0.005, 0.25);
}

// Puhekupla: valkoinen, laventeliin varjostettu, reunaviiva ja häntä alas oikealle
function kitchenDrawBubble(c, bx, by, s) {
  c.beginPath(); c.moveTo(bx + s * 0.5, by + s * 0.85); c.lineTo(bx + s * 0.95, by + s * 0.85); c.lineTo(bx + s * 1.1, by + s * 1.3); c.closePath();
  artFillPath(c, '#ffffff', by + s * 0.6, by + s * 1.3, s * 0.4, { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
  artRoundRect(c, bx - s * 1.0, by - s * 0.9, s * 2.0, s * 1.8, s * 0.4, '#ffffff', { lineColor: '#c9b3cf', shadeTo: '#e3d8f5' });
}

function drawKitchenCustomer(c) {
  var k = kitchen, p = kCustomerPos(), s = viewH * 0.055;
  var y = p.y - viewH * 0.12;
  var slide = k.customer.inT > 0 ? k.customer.inT / 0.8 : 0;
  var x = p.x + slide * viewW * 0.2;
  drawBunny(c, x, y, s, k.customer.hop * viewH * 0.025, k.customer.earT, false);
  if (k.customer.happyT > 0) {
    drawHeartShape(c, x, y - s * 2.6 - Math.sin(globalT * 4) * s * 0.1, s * 0.25, true);
  } else if (k.mix && k.customer.inT <= 0) {
    // Tilauskupla: pupu näyttää haluamansa juoman
    var bx = x - s * 1.4, by = y - s * 2.9;
    kitchenDrawBubble(c, bx, by, s);
    drawPotionBottle(c, bx, by + s * 0.15, s * 0.55, mixColorOf(k.mix.target));
  }
}

function drawKitchen() {
  var i, p, k = kitchen;
  if (!beginPlayWorld()) return;
  propsDraw(ctx);
  // Pullot hyllyllä
  for (i = 0; i < 3; i++) {
    p = kBottlePos(i);
    var used = k.mix && k.mix.pour.indexOf(MIX_PRIMARY[i]) >= 0;
    c_glow(ctx, p.x, p.y, viewH * 0.075, used ? 0.15 : 0.4);
    ctx.globalAlpha = used ? 0.5 : 1;
    drawPotionBottle(ctx, p.x, p.y, viewH * 0.05, MIX_COLORS[MIX_PRIMARY[i]]);
    ctx.globalAlpha = 1;
  }
  var cp = kCauldronPos();
  var key = k.mix ? mixKey(k.mix.pour) : '';
  var liquid = k.mix ? (k.mix.failT > 0 ? MIX_COLORS.X : (key ? mixColorOf(key) : null)) : (k.serveT > 0 ? null : null);
  drawCauldron(ctx, cp.x, cp.y, viewH * 0.1, liquid, !!(k.mix && k.mix.failT > 0), k.mix ? k.mix.splash : 0, !!(k.mix && k.mix.doneT > 0));
  if (k.mix) drawMixDrops(ctx, k.mix, cp.x, cp.y - viewH * 0.08);
  drawPrincessFree(ctx, princess.x, princess.y, viewH / 520, 1, 0, false, globalT);
  drawKitchenCustomer(ctx);
  drawParticlesLayer(ctx);
  endPlayWorld();
  drawKitchenHud(ctx);
  drawTaskOverlay(ctx);
}

// Tilausrivi HUDiin: tarjoillut juomat värillisinä, tulevat haaleina
function drawKitchenHud(c) {
  var hs = viewH * 0.022, pad = hs * 1.4, left = hudX(), i;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  roundRect(c, left, pad * 0.5, hs * 3.2 * K_ORDERS + pad, hs * 3.4, hs);
  c.fill();
  for (i = 0; i < K_ORDERS; i++) {
    c.globalAlpha = i < kitchen.served ? 1 : 0.3;
    drawPotionBottle(c, left + pad * 0.5 + hs * 1.6 + i * hs * 3.2, pad * 0.5 + hs * 1.8, hs * 0.55, mixColorOf(kitchen.orders[i] || 'R'));
    c.globalAlpha = 1;
  }
}

function c_glow(c, x, y, r, a) {
  var g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}
