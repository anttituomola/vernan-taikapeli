'use strict';

// Tökättävät koristeet. Kentän koriste piirretään joka ruudulla taustan
// sijaan, jotta se voi heilahtaa, kun lapsi napauttaa sitä ("kaikesta hiukan
// interaktiivista"). Kevyt: koristeita on kentässä kourallinen, ja ruudun
// ulkopuoliset ohitetaan.
//
// Käyttö kentässä:
//   init:   propsReset(); propAdd({ x, y, r, draw: function (c, p) {...}, color, note, poke })
//   update: propsUpdate(dt)
//   draw:   propsDraw(ctx)  tai  propsDraw(ctx, layer)   (maailmakoordinaatit)
//   tap:    propsTap(px + camX, py)   -> true jos osui; napautus saa jatkua muualle
// draw piirtää origoon (0, 0) = koristeen jalkojen kohta; heilahdus ja litistys
// on jo asetettu kontekstiin. p.n = montako kertaa tökätty (yllätyksiin),
// p.t = aika viime tökkäyksestä (-1 = lepo). Osuma-alue on ympyrä (säde r)
// pisteen (x, y - hy) ympärillä; hy on oletuksena 0,7 × r.
// Yhden ruudun kentissä camX on 0, joten samat kutsut toimivat sellaisinaan.
// Lisäksi propDrop pudottaa koristeesta jotain (kookos, omena, karkki), joka
// pomppaa kerran maassa ja haihtuu.

var props = [];
var propDrops = [];

function propsReset() {
  props = [];
  propDrops = [];
}

function propAdd(def) {
  def.t = -1;
  def.n = 0;
  if (def.r === undefined) def.r = viewH * 0.07;
  props.push(def);
  return def;
}

function propHitY(p) {
  return p.y - (p.hy !== undefined ? p.hy : p.r * 0.7);
}

function propsUpdate(dt) {
  var i, p, d;
  for (i = 0; i < props.length; i++) {
    p = props[i];
    if (p.t >= 0) {
      p.t += dt;
      if (p.t > 1.4) p.t = -1;
    }
    if (p.update) p.update(p, dt);
  }
  for (i = propDrops.length - 1; i >= 0; i--) {
    d = propDrops[i];
    d.t += dt;
    d.vy += viewH * 1.6 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.rot += d.vr * dt;
    if (d.ground !== undefined && d.y > d.ground && d.vy > 0) {
      d.y = d.ground;
      if (!d.bounced) {
        d.bounced = true;
        d.vy = -d.vy * 0.38;
        d.vx *= 0.6;
        if (d.onLand) d.onLand(d);
      } else {
        d.vy = 0;
        d.vx = 0;
        d.vr = 0;
      }
    }
    if (d.t > d.life) propDrops.splice(i, 1);
  }
}

// Heilahdus: nopea värähtely, joka vaimenee
function propWobble(p) {
  if (p.t < 0) return 0;
  return Math.sin(p.t * 18) * Math.exp(-p.t * 3.5) * (p.amp || 0.16);
}

function propsDraw(c, layer) {
  var i, p, d, sx, w, a;
  for (i = 0; i < props.length; i++) {
    p = props[i];
    if (layer !== undefined && (p.layer || 0) !== layer) continue;
    sx = p.x - camX;
    if (sx < -p.r * 4 || sx > viewW + p.r * 4) continue;
    w = propWobble(p);
    c.save();
    c.translate(sx, p.y);
    c.rotate(w);
    if (p.t >= 0) artSquash(c, Math.sin(Math.min(1, p.t / 0.25) * Math.PI) * 0.08);
    p.draw(c, p);
    c.restore();
  }
  if (layer !== undefined && layer !== 0) return;
  for (i = 0; i < propDrops.length; i++) {
    d = propDrops[i];
    sx = d.x - camX;
    if (sx < -viewH * 0.1 || sx > viewW + viewH * 0.1) continue;
    a = d.t > d.life - 0.4 ? Math.max(0, (d.life - d.t) / 0.4) : 1;
    c.save();
    c.globalAlpha = a;
    c.translate(sx, d.y);
    c.rotate(d.rot);
    d.draw(c, d);
    c.restore();
    c.globalAlpha = 1;
  }
}

// Osuiko napautus koristeeseen? Lähin osunut heilahtaa.
function propsTap(wx, wy) {
  var i, p, d, best = null, bd = 1e9;
  for (i = 0; i < props.length; i++) {
    p = props[i];
    d = Math.hypot(wx - p.x, wy - propHitY(p));
    if (d < p.r && d < bd) { bd = d; best = p; }
  }
  if (!best) return false;
  propPoke(best);
  return true;
}

function propPoke(p) {
  var cy = propHitY(p), note = p.note || 600 + (p.n % 4) * 90;
  p.t = 0;
  p.n++;
  spawnSparkles(p.x, cy, 7, p.color || '#ffe27a');
  artPop(p.x, cy, p.r * 0.6, p.color || '#ffffff', 'ring');
  playNote(note, 0, 0.12, 'sine', 0.25);
  playNote(note * 1.5, 0.07, 0.14, 'sine', 0.18);
  if (p.poke) p.poke(p);
}

// Pudotus: def { x, y, vx, vy, ground, draw: function (c, d), life, onLand }
function propDrop(def) {
  def.t = 0;
  def.vx = def.vx || 0;
  def.vy = def.vy || 0;
  def.rot = def.rot || 0;
  def.vr = def.vr === undefined ? (Math.random() - 0.5) * 6 : def.vr;
  def.life = def.life || 2.2;
  def.bounced = false;
  if (propDrops.length > 24) propDrops.shift();
  propDrops.push(def);
  return def;
}

// Valmis pyöreä pudotettava (kookos, omena, marja): väri ja säde
function propDropBall(x, y, r, color, ground, vx) {
  return propDrop({
    x: x, y: y, vx: vx || (Math.random() - 0.5) * viewW * 0.08, vy: -viewH * 0.1, ground: ground,
    draw: function (c) { artCircle(c, 0, 0, r, color, { hi: 0.4 }); }
  });
}
