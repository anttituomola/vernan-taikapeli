'use strict';

// Päivitys, piirto, HUD ja overlayt
// ---------- Päivitys ----------
function update(dt) {
  globalT += dt;
  if (hurtFlash > 0) hurtFlash -= dt;
  updateHearts(dt);
  updateAmbient(dt);
  if (introT > 0) introT -= dt;
  phaseNow().update(dt);
}

function updateForest(dt) {
  var i;

  // Yksisarvisen liike
  var dx = unicorn.tx - unicorn.x;
  var dy = unicorn.ty - unicorn.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 6 && !celebrating && !puzzleBusy()) {
    unicorn.moving = true;
    var step = Math.min(unicorn.speed * dt, dist);
    unicorn.x += (dx / dist) * step;
    unicorn.y += (dy / dist) * step;
    if (Math.abs(dx) > 4) unicorn.facing = dx > 0 ? 1 : -1;
    unicorn.walkPhase += dt * 10;
    // Kimallejälki
    if (Math.random() < dt * 12) {
      spawnSparkles(unicorn.x - unicorn.facing * 40, unicorn.y - 20, 1, '#d9b3ff');
    }
  } else {
    unicorn.moving = false;
  }

  // Kamera seuraa
  var targetCam = unicorn.x - viewW / 2;
  targetCam = Math.min(Math.max(targetCam, 0), worldW - viewW);
  camX += (targetCam - camX) * Math.min(1, dt * 4);

  // Tähdet: leijuvat ja väistelevät hitaasti, kun yksisarvinen lähestyy
  for (i = 0; i < stars.length; i++) {
    var st = stars[i];
    if (st.collected) continue;
    st.twinkle += dt * 3;
    var curX = st.ax + st.ox;
    var nearStar = Math.abs(curX - unicorn.x) < viewW * 0.16;
    if (nearStar) {
      var dir = (curX - unicorn.x) >= 0 ? 1 : -1;
      st.ox += dir * viewW * 0.06 * dt;
      st.oy -= viewH * 0.04 * dt;
    } else {
      st.ox -= st.ox * Math.min(1, dt * 0.8);
      st.oy -= st.oy * Math.min(1, dt * 0.8);
    }
    var oMax = viewW * 0.12;
    st.ox = Math.min(Math.max(st.ox, -oMax), oMax);
    st.oy = Math.min(Math.max(st.oy, -viewH * 0.10), 0);
    st.px = st.ax + st.ox + Math.sin(st.twinkle * 0.7 + i) * viewW * 0.012;
    st.py = st.ay + st.oy + Math.sin(st.twinkle + i) * viewH * 0.02;
  }

  // Puput: kurkkivat pensaasta vain hetken kerrallaan
  for (i = 0; i < bunnies.length; i++) {
    var bn = bunnies[i];
    bn.earT += dt * (bn.state === 'hidden' ? 4 : 8);
    if (bn.state === 'hidden') {
      var bnear = Math.abs(unicorn.x - bn.bushX) < viewW * 0.35;
      var peekTarget = 0.12;
      if (bnear && !puzzleBusy()) {
        bn.phaseT += dt;
        if (bn.phase === 'waiting' && bn.phaseT > bn.waitTime) {
          bn.phase = 'peeking';
          bn.phaseT = 0;
        } else if (bn.phase === 'peeking' && bn.phaseT > 1.2) {
          bn.phase = 'waiting';
          bn.phaseT = 0;
          bn.waitTime = 1.5 + Math.random() * 2.0;
        }
        if (bn.phase === 'peeking') peekTarget = 1;
      } else {
        bn.phase = 'waiting';
        bn.phaseT = 0;
      }
      bn.peek += (peekTarget - bn.peek) * Math.min(1, dt * 9);
    } else {
      // Seuraa jonossa: 1. pupu seuraa yksisarvista, seuraavat edellistä
      var leadX, leadY;
      if (i === 0 || bunnies[i - 1].state !== 'found') {
        leadX = unicorn.x - unicorn.facing * viewH * 0.16;
        leadY = unicorn.y + 4;
      } else {
        leadX = bunnies[i - 1].x - unicorn.facing * viewH * 0.09;
        leadY = bunnies[i - 1].y + 2;
      }
      var bdx = leadX - bn.x;
      var bdy = leadY - bn.y;
      var bd = Math.sqrt(bdx * bdx + bdy * bdy);
      if (celebrating) {
        bn.hopT += dt * 8;
      } else if (bd > viewH * 0.02) {
        var bstep = Math.min(unicorn.speed * 1.1 * dt, bd);
        bn.x += (bdx / bd) * bstep;
        bn.y += (bdy / bd) * bstep;
        bn.hopT += dt * 9;
      } else {
        bn.hopT += dt * 2;
      }
      bn.y = Math.min(Math.max(bn.y, groundTop), groundBottom);
    }
  }

  // Maali: kaikki kerätty ja perillä linnalla -> juhla
  if (goalReady && !celebrating && unicorn.x > worldW * 0.90) {
    startCelebration();
  }

  // Taikaportit
  updateTasks(dt);
  if (!activeGate && !celebrating) {
    for (i = 0; i < gates.length; i++) {
      if (!gates[i].opened && Math.abs(unicorn.x - gates[i].x) < viewW * 0.14) {
        spellStart(gates[i]);
        break;
      }
    }
  } else if (activeGate) {
    var ag = activeGate;
    if (ag.mode === 'show') {
      ag.timer += dt;
      if (ag.timer >= 0) {
        var stepLen = 0.85;
        var step = Math.floor(ag.timer / stepLen);
        if (step < ag.seq.length) {
          var inStep = ag.timer - step * stepLen;
          ag.litOrb = inStep < 0.55 ? ag.seq[step] : -1;
          if (ag.lastShown !== step && inStep < 0.55) {
            ag.lastShown = step;
            playNote(ORB_NOTES[ag.seq[step]], 0, 0.4, 'triangle', 0.4);
          }
        } else {
          ag.litOrb = -1;
          ag.mode = 'input';
          ag.inputIdx = 0;
        }
      }
    } else if (ag.mode === 'opening') {
      ag.timer += dt;
      if (Math.random() < dt * 20) {
        spawnSparkles(
          ag.x + (Math.random() - 0.5) * viewH * 0.2,
          groundTop - Math.random() * viewH * 0.25,
          3, '#ffe27a'
        );
      }
      if (ag.timer > 1.3) {
        ag.opened = true;
        ag.mode = 'done';
        activeGate = null;
      }
    }
    if (ag.litT > 0) ag.litT -= dt;
    if (ag.shakeT > 0) ag.shakeT -= dt;
  }

  // Myrskypilvet: seuraavat yksisarvista alueellaan ja tiputtavat pisaroita
  if (invulnT > 0) invulnT -= dt;
  var hazardsOn = !celebrating && !puzzleBusy();
  for (i = 0; i < clouds.length; i++) {
    var cl = clouds[i];
    var zMin = cl.zA * worldW, zMax = cl.zB * worldW;
    if (hazardsOn) {
      var uxIn = unicorn.x > zMin - viewW * 0.25 && unicorn.x < zMax + viewW * 0.25;
      if (uxIn) {
        var chaseX = Math.min(Math.max(unicorn.x, zMin), zMax);
        var cd = chaseX - cl.x;
        cl.x += Math.min(Math.max(cd, -viewW * 0.05 * dt), viewW * 0.05 * dt);
      } else {
        cl.x += cl.dir * viewW * 0.03 * dt;
        if (cl.x < zMin) { cl.x = zMin; cl.dir = 1; }
        if (cl.x > zMax) { cl.x = zMax; cl.dir = -1; }
      }
      cl.dropT -= dt;
      if (cl.dropT <= 0 && Math.abs(cl.x - unicorn.x) < viewH * 0.14 && cl.warnT <= 0) {
        cl.warnT = 0.8;
        cl.dropT = 3.5 + Math.random() * 2.0;
        playNote(140, 0, 0.2, 'sawtooth', 0.15);
      }
      if (cl.warnT > 0) {
        cl.warnT -= dt;
        if (cl.warnT <= 0) {
          drops.push({ x: cl.x, y: cl.fy * viewH + viewH * 0.045, vy: viewH * 0.35 });
        }
      }
    }
  }
  for (i = drops.length - 1; i >= 0; i--) {
    var dr = drops[i];
    dr.vy += viewH * 0.55 * dt;
    dr.y += dr.vy * dt;
    var hitX = Math.abs(dr.x - unicorn.x) < viewH * 0.075;
    var hitY = Math.abs(dr.y - (unicorn.y - viewH * 0.085)) < viewH * 0.10;
    if (hitX && hitY) {
      drops.splice(i, 1);
      hitUnicorn();
    } else if (dr.y > groundBottom) {
      spawnSparkles(dr.x, dr.y, 6, '#8fc7ff');
      drops.splice(i, 1);
    }
  }

  // Peikko: partioi alueellaan, jahtaa lähellä ja varastaa pupun kiinni jäädessä
  if (hazardsOn) {
    var tzA = troll.zA * worldW, tzB = troll.zB * worldW;
    var chasing = unicorn.x > tzA - viewW * 0.05 && unicorn.x < tzB + viewW * 0.05;
    if (chasing) troll.dir = unicorn.x > troll.x ? 1 : -1;
    troll.x += troll.dir * (chasing ? viewW * 0.045 : viewW * 0.025) * dt;
    if (troll.x < tzA) { troll.x = tzA; troll.dir = 1; }
    if (troll.x > tzB) { troll.x = tzB; troll.dir = -1; }
    troll.bounceT += dt * (chasing ? 8 : 6);
    if (troll.cooldown > 0) troll.cooldown -= dt;
    // Varastaa yhden pupun vain jos jää paikalleen peikon viereen hetkeksi.
    // Liikkeessä ohi ratsastus on turvallista.
    var inGrab = troll.cooldown <= 0 && Math.abs(troll.x - unicorn.x) < viewH * 0.09;
    if (inGrab && !unicorn.moving) {
      troll.stillT += dt;
      if (troll.stillT > 0.55) {
        var lastFound = null;
        for (i = bunnies.length - 1; i >= 0; i--) {
          if (bunnies[i].state === 'found') { lastFound = bunnies[i]; break; }
        }
        troll.stillT = 0;
        if (lastFound) {
          spawnSparkles(lastFound.x, lastFound.y - viewH * 0.05, 12, '#c9c9c9');
          lastFound.state = 'hidden';
          lastFound.peek = 0.12;
          lastFound.phase = 'waiting';
          lastFound.phaseT = 0;
          lastFound.waitTime = 1.5 + Math.random() * 2.0;
          lastFound.missCount = 0;
          relocateBunny(lastFound);
          goalReady = false;
          playNote(300, 0, 0.15, 'square', 0.25);
          playNote(200, 0.13, 0.25, 'square', 0.25);
          troll.cooldown = 5;
        }
      }
    } else {
      troll.stillT = 0;
    }
  }

  // Hiukkaset
  for (i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.age += dt;
    if (p.age >= p.life) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }

  // Konfetti
  if (celebrating) {
    celebrateT += dt;
    for (i = confetti.length - 1; i >= 0; i--) {
      var cf = confetti[i];
      cf.y += cf.vy * dt;
      cf.x += cf.vx * dt + Math.sin(globalT * 3 + i) * 30 * dt;
      cf.rot += cf.vr * dt;
      if (cf.y > viewH + 20) {
        cf.y = -20;
        cf.x = Math.random() * viewW;
      }
    }
  }

  if (tapRing) {
    tapRing.t += dt;
    if (tapRing.t > 0.5) tapRing = null;
  }
}

// ---------- Piirto ----------
function draw() {
  phaseNow().draw();
  if (!puzzleBusy()) {
    drawForeground(ctx);
    drawAmbient(ctx);
  }
  drawIntro(ctx);
  drawHurtFlash(ctx);
}

function drawForest() {
  var i;
  // Piilossa oleva/0-kokoinen ikkuna: taustaa ei ole voitu piirtää
  if (!bgCanvas.width || !viewW || !viewH) return;
  ctx.clearRect(0, 0, viewW, viewH);

  // Tausta (piirretty pienennettynä, skaalataan ruudulle)
  ctx.drawImage(bgCanvas, 0, 0, bgCanvas.width, bgCanvas.height, -camX, 0, worldW, viewH);

  // Liikkuvat pilvet
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  var c1x = ((globalT * 12) % (viewW + 300)) - 150;
  var c2x = ((globalT * 8 + viewW * 0.6) % (viewW + 300)) - 150;
  cloudShape(ctx, c1x, viewH * 0.08, viewH * 0.025);
  cloudShape(ctx, c2x, viewH * 0.20, viewH * 0.020);

  // Kosketusrengas
  if (tapRing) {
    var tr = tapRing.t / 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,' + (1 - tr) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tapRing.x - camX, tapRing.y, 10 + tr * 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Taikaportit
  for (i = 0; i < gates.length; i++) drawGate(ctx, gates[i]);
  for (i = 0; i < tasks.length; i++) drawTaskArch(ctx, tasks[i]);

  // Myrskypilvet
  for (i = 0; i < clouds.length; i++) drawStormCloud(ctx, clouds[i]);

  // Tähdet
  var starR = viewH * 0.038;
  for (i = 0; i < stars.length; i++) {
    var st = stars[i];
    if (st.collected) continue;
    var glow = 0.6 + Math.sin(st.twinkle * 1.7) * 0.4;
    drawStar(ctx, st.px - camX, st.py, starR, Math.sin(st.twinkle * 0.6) * 0.2, glow);
  }

  // Piilossa olevat puput kurkkivat pensaan takaa
  var bs = viewH * 0.055;
  for (i = 0; i < bunnies.length; i++) {
    var bn = bunnies[i];
    if (bn.state === 'hidden') {
      ctx.save();
      ctx.translate(bn.bushX - camX, groundTop + 12 - bs * 0.5 - bn.peek * bs * 1.6);
      drawBunny(ctx, 0, 0, bs * 0.9, 0, bn.earT, true);
      ctx.restore();
    }
  }
  // Pensaiden etuosat pupujen eteen
  for (i = 0; i < bunnies.length; i++) {
    drawBushFront(ctx, bunnies[i].bushX - camX, groundTop + 12, bs);
  }

  // Löytyneet puput
  for (i = 0; i < bunnies.length; i++) {
    var bn2 = bunnies[i];
    if (bn2.state !== 'found') continue;
    var hop = Math.abs(Math.sin(bn2.hopT)) * viewH * 0.03;
    drawBunny(ctx, bn2.x - camX, bn2.y, viewH * 0.045, hop, bn2.earT, false);
  }

  // Peikko
  drawTroll(ctx);

  // Yksisarvinen ja prinsessa (vilkkuu osuman jälkeen)
  var us = viewH / 800;
  if (invulnT > 0 && Math.sin(globalT * 20) > 0) ctx.globalAlpha = 0.45;
  drawUnicorn(ctx, unicorn.x - camX, unicorn.y, us * 1.6, unicorn.facing, unicorn.walkPhase, unicorn.moving, globalT);
  ctx.globalAlpha = 1;

  // Salamapisarat
  for (i = 0; i < drops.length; i++) drawDrop(ctx, drops[i]);

  // Hiukkaset
  for (i = 0; i < particles.length; i++) {
    var p = particles[i];
    var alpha = 1 - p.age / p.life;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(p.x - camX, p.y);
    ctx.rotate(p.age * 3);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Juhla: sateenkaari + konfetti
  if (celebrating) {
    drawRainbow(ctx);
    for (i = 0; i < confetti.length; i++) {
      var cf = confetti[i];
      ctx.save();
      ctx.translate(cf.x, cf.y);
      ctx.rotate(cf.rot);
      ctx.fillStyle = cf.color;
      ctx.fillRect(-cf.size / 2, -cf.size / 3, cf.size, cf.size * 0.66);
      ctx.restore();
    }
  }

  drawGuide(ctx);
  drawHUD();
  drawSpellOverlay(ctx);
  drawTaskOverlay(ctx);
}

function drawBushFront(c, x, baseY, s) {
  if (x < -s * 2.5 || x > viewW + s * 2.5) return;
  var g = c.createRadialGradient(x, baseY - s * 0.3, s * 0.2, x, baseY - s * 0.3, s * 1.3);
  g.addColorStop(0, '#6cbe55');
  g.addColorStop(1, '#358a3c');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, baseY - s * 0.35, s * 0.85, 0, Math.PI * 2);
  c.arc(x - s * 0.85, baseY - s * 0.2, s * 0.6, 0, Math.PI * 2);
  c.arc(x + s * 0.85, baseY - s * 0.2, s * 0.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ff7bac';
  c.beginPath(); c.arc(x + s * 0.3, baseY - s * 0.75, s * 0.11, 0, Math.PI * 2); c.fill();
}

function drawGate(c, gate) {
  var gx = gate.x - camX;
  var gw = viewH * 0.11;   // pilarien etäisyys keskeltä
  var gh = viewH * 0.32;   // pilarien korkeus
  if (gx < -gw * 3 || gx > viewW + gw * 3) return;
  var baseY = groundTop + viewH * 0.02;
  var pw = viewH * 0.035;
  var i;

  // Hohtava "verho" suljetussa portissa
  if (!gate.opened) {
    var shimmer = 0.30 + Math.sin(globalT * 2.5) * 0.10;
    var cg = c.createLinearGradient(0, baseY - gh, 0, baseY);
    cg.addColorStop(0, 'rgba(190,130,255,' + shimmer + ')');
    cg.addColorStop(1, 'rgba(255,180,240,' + (shimmer * 0.6) + ')');
    c.fillStyle = cg;
    c.fillRect(gx - gw + pw / 2, baseY - gh, (gw - pw / 2) * 2, gh);
  }

  // Pilarit
  for (i = -1; i <= 1; i += 2) {
    var px = gx + i * gw;
    var pg = c.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
    pg.addColorStop(0, '#cba3ee');
    pg.addColorStop(0.5, '#f0e0fb');
    pg.addColorStop(1, '#a97fd0');
    c.fillStyle = pg;
    c.fillRect(px - pw / 2, baseY - gh, pw, gh);
    c.fillStyle = '#e8d5f2';
    c.fillRect(px - pw * 0.8, baseY - gh - pw * 0.6, pw * 1.6, pw * 0.6);
    c.fillRect(px - pw * 0.8, baseY - pw * 0.4, pw * 1.6, pw * 0.4);
  }

  // Kaari
  c.strokeStyle = '#e8d5f2';
  c.lineWidth = pw * 0.8;
  c.beginPath();
  c.arc(gx, baseY - gh, gw, Math.PI, 0);
  c.stroke();

  // Kaaren jalokivet loitsuväreissä
  for (i = 0; i < gate.orbs; i++) {
    var a = Math.PI + Math.PI * (i + 1) / (gate.orbs + 1);
    var jx = gx + Math.cos(a) * gw;
    var jy = baseY - gh + Math.sin(a) * gw;
    var lit = gate.opened || (activeGate === gate && spellActive() && gate.litOrb === i);
    c.fillStyle = ORB_COLORS[i];
    c.globalAlpha = lit ? 1 : 0.75;
    c.beginPath();
    c.arc(jx, jy, pw * (lit ? 0.55 : 0.4), 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
}

function taskArchStyle(type) {
  if (type === 'math') return { veil: '255,210,80', pillar: '#f0d48a' };
  if (type === 'minus') return { veil: '255,170,90', pillar: '#f2c39a' };
  if (type === 'count') return { veil: '130,225,175', pillar: '#9ee6b8' };
  if (type === 'compare') return { veil: '110,200,230', pillar: '#a8dcec' };
  if (type === 'match') return { veil: '255,140,190', pillar: '#f5b3d2' };
  if (type === 'pattern') return { veil: '120,220,200', pillar: '#a6e6d8' };
  if (type === 'odd') return { veil: '190,150,255', pillar: '#d0b8f8' };
  if (type === 'rhythm') return { veil: '255,120,150', pillar: '#f5a8bc' };
  return { veil: '120,210,255', pillar: '#b8d4ff' };
}

// variant 1 = pieni yksityiskohtaero: 8 terälehteä / 6 sakaraa / kimallus sydämessä
function drawTaskGlyph(c, kind, x, y, s, color, variant) {
  var i, a, n, rr;
  c.fillStyle = color;
  if (kind === 'flower') {
    n = variant ? 8 : 5;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      c.beginPath();
      c.arc(x + Math.cos(a) * s * 0.52, y + Math.sin(a) * s * 0.52, s * (variant ? 0.3 : 0.42), 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = variant ? '#ff7bac' : '#fff3b0';
    c.beginPath(); c.arc(x, y, s * 0.36, 0, Math.PI * 2); c.fill();
    return;
  }
  if (kind === 'heart') {
    c.beginPath();
    c.moveTo(x, y + s * 0.52);
    c.bezierCurveTo(x - s * 1.05, y - s * 0.05, x - s * 0.35, y - s * 0.85, x, y - s * 0.22);
    c.bezierCurveTo(x + s * 0.35, y - s * 0.85, x + s * 1.05, y - s * 0.05, x, y + s * 0.52);
    c.fill();
    if (variant) {
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.beginPath(); c.arc(x - s * 0.32, y - s * 0.28, s * 0.17, 0, Math.PI * 2); c.fill();
    }
    return;
  }
  n = variant ? 6 : 5;
  c.save();
  c.translate(x, y);
  c.beginPath();
  for (i = 0; i < n * 2; i++) {
    rr = (i % 2 === 0) ? s : s * (variant ? 0.55 : 0.42);
    a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.restore();
}

function drawTaskArch(c, task) {
  var gx = task.x - camX;
  var gw = viewH * 0.11;
  var gh = viewH * 0.32;
  if (gx < -gw * 3 || gx > viewW + gw * 3) return;
  var baseY = groundTop + viewH * 0.02;
  var pw = viewH * 0.035;
  var style = taskArchStyle(task.type);
  var veil = style.veil;
  var pillar = style.pillar;
  if (!task.opened) {
    var shimmer = 0.32 + Math.sin(globalT * 2.5) * 0.10;
    var cg = c.createLinearGradient(0, baseY - gh, 0, baseY);
    cg.addColorStop(0, 'rgba(' + veil + ',' + shimmer + ')');
    cg.addColorStop(1, 'rgba(' + veil + ',' + (shimmer * 0.45) + ')');
    c.fillStyle = cg;
    c.fillRect(gx - gw + pw / 2, baseY - gh, (gw - pw / 2) * 2, gh);
  }
  var i;
  for (i = -1; i <= 1; i += 2) {
    var px = gx + i * gw;
    c.fillStyle = pillar;
    c.fillRect(px - pw / 2, baseY - gh, pw, gh);
    c.fillStyle = '#fff6d8';
    c.fillRect(px - pw * 0.8, baseY - gh - pw * 0.5, pw * 1.6, pw * 0.5);
  }
  c.strokeStyle = '#fff6d8';
  c.lineWidth = pw * 0.8;
  c.beginPath();
  c.arc(gx, baseY - gh, gw, Math.PI, 0);
  c.stroke();
}

function drawTaskOverlay(c) {
  if (!taskActive()) return;
  var t = activeTask;
  var op = orbPositions(t.orbs || 3);
  var shake = t.shakeT > 0 ? Math.sin(globalT * 45) * 10 * t.shakeT : 0;
  var hint = t.mode === 'input' && t.idleT > 4;
  var i;
  c.fillStyle = 'rgba(40,20,70,0.52)';
  c.fillRect(0, 0, viewW, viewH);

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (t.type === 'rhythm') {
    drawRhythmOverlay(c, t, shake, hint);
    return;
  }
  if (t.type === 'math' || t.type === 'minus') {
    c.fillStyle = '#ffe27a';
    c.font = 'bold ' + Math.round(viewH * 0.09) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    c.fillText(t.a + (t.type === 'math' ? ' + ' : ' − ') + t.b + ' = ?', viewW / 2 + shake, viewH * 0.32);
  } else if (t.type === 'pattern') {
    drawPatternPrompt(c, t, shake);
  } else if (t.type === 'compare') {
    drawComparePrompt(c, t, op, shake);
  } else if (t.type === 'count') {
    drawCountPrompt(c, t, shake);
  } else if (t.type === 'match' && t.prompt) {
    drawMatchPrompt(c, t, shake);
  } else if (t.type === 'odd') {
    drawOddPrompt(c, shake);
  } else if (t.type === 'memory') {
    var dotR = viewH * 0.012;
    for (i = 0; i < t.seq.length; i++) {
      c.fillStyle = i < t.inputIdx ? '#ffe27a' : 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.arc(viewW / 2 + (i - (t.seq.length - 1) / 2) * dotR * 4 + shake, op.y - op.r * 2.15, dotR, 0, Math.PI * 2);
      c.fill();
    }
  }

  for (i = 0; i < t.orbs; i++) {
    var lit = t.litOrb === i && (t.mode === 'show' ? true : t.litT > 0);
    var r = op.r * (lit ? 1.16 : 1);
    var x = op.xs[i] + shake;
    var y = op.y + (hint ? Math.sin(globalT * 6 + i) * viewH * 0.006 : 0);
    if (lit) {
      var glow = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2);
      glow.addColorStop(0, 'rgba(255,255,255,0.5)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(x, y, r * 2, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = TASK_BF_COLORS[i % TASK_BF_COLORS.length];
    c.lineWidth = viewH * 0.008;
    c.stroke();
    if (t.type === 'math' || t.type === 'count' || t.type === 'minus') {
      var ans = String(t.answers[i]);
      c.fillStyle = '#8a2be2';
      c.font = 'bold ' + Math.round(r * (ans.length > 1 ? 0.7 : 0.9)) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
      c.fillText(ans, x, y + r * 0.08);
    } else if (t.type === 'match') {
      var grp = t.choices && t.choices[i];
      if (grp) drawGlyphRow(c, grp.items, x, y, r * 0.28, r * 0.62);
    } else if (t.type === 'odd' || t.type === 'pattern') {
      var ch = t.choices && t.choices[i];
      if (ch) drawTaskGlyph(c, ch.kind, x, y, r * 0.5, TASK_BF_COLORS[ch.color], ch.variant);
    } else if (t.type === 'compare') {
      c.fillStyle = '#8a2be2';
      c.beginPath();
      c.moveTo(x, y - r * 0.5);
      c.lineTo(x + r * 0.42, y + r * 0.2);
      c.lineTo(x - r * 0.42, y + r * 0.2);
      c.closePath();
      c.fill();
    } else {
      drawButterfly(c, x, y, r * 0.42, globalT + i, TASK_BF_COLORS[i % TASK_BF_COLORS.length]);
    }
  }

  // Vihje: pomppiva nuoli näyttää mihin napautetaan
  if (hint) {
    if (t.type === 'compare') {
      var side = Math.sin(globalT * 2) > 0 ? 1 : 0;
      drawHintArrow(c, op.xs[side] + shake, viewH * 0.24 - viewH * 0.17);
    } else {
      var k = Math.floor(globalT * 1.5) % t.orbs;
      drawHintArrow(c, op.xs[k] + shake, op.y - op.r * 1.75);
    }
  }
}

function drawStormCloud(c, cl) {
  var x = cl.x - camX;
  var y = cl.fy * viewH;
  var s = viewH * 0.035;
  if (x < -s * 6 || x > viewW + s * 6) return;
  var warn = cl.warnT > 0;
  c.fillStyle = warn ? '#5d6472' : '#7d8593';
  cloudShape(c, x, y, s);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  cloudShape(c, x - s * 0.4, y - s * 0.5, s * 0.55);
  // Silmät: vihainen ilme
  c.fillStyle = '#2f3540';
  c.beginPath(); c.arc(x - s * 0.5, y + s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + s * 0.5, y + s * 0.15, s * 0.14, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2f3540';
  c.lineWidth = s * 0.12;
  c.beginPath();
  c.moveTo(x - s * 0.85, y - s * 0.25); c.lineTo(x - s * 0.25, y - s * 0.05);
  c.moveTo(x + s * 0.85, y - s * 0.25); c.lineTo(x + s * 0.25, y - s * 0.05);
  c.stroke();
  // Varoitussalama ennen pisaraa
  if (warn && Math.sin(globalT * 25) > -0.2) {
    c.fillStyle = '#ffe94f';
    c.beginPath();
    c.moveTo(x, y + s * 1.1);
    c.lineTo(x - s * 0.35, y + s * 1.9);
    c.lineTo(x + s * 0.05, y + s * 1.9);
    c.lineTo(x - s * 0.25, y + s * 2.6);
    c.lineTo(x + s * 0.45, y + s * 1.7);
    c.lineTo(x + s * 0.05, y + s * 1.7);
    c.lineTo(x + s * 0.35, y + s * 1.1);
    c.closePath();
    c.fill();
  }
}

function drawDrop(c, dr) {
  var x = dr.x - camX;
  if (x < -20 || x > viewW + 20) return;
  var s = viewH * 0.014;
  c.fillStyle = '#5aa9ff';
  c.beginPath();
  c.moveTo(x, dr.y - s * 1.6);
  c.quadraticCurveTo(x + s, dr.y - s * 0.3, x + s * 0.8, dr.y + s * 0.3);
  c.arc(x, dr.y + s * 0.3, s * 0.8, 0, Math.PI);
  c.quadraticCurveTo(x - s, dr.y - s * 0.3, x, dr.y - s * 1.6);
  c.fill();
  c.fillStyle = '#ffe94f';
  c.beginPath(); c.arc(x, dr.y, s * 0.35, 0, Math.PI * 2); c.fill();
}

function drawTroll(c) {
  var x = troll.x - camX;
  var s = viewH * 0.05;
  if (x < -s * 4 || x > viewW + s * 4) return;
  var y = groundTop + viewH * 0.06;
  var hop = Math.abs(Math.sin(troll.bounceT)) * s * 0.35;
  c.save();
  c.translate(x, y - hop);
  c.scale(troll.dir, 1);
  // Jalat
  c.fillStyle = '#5e8c4a';
  c.beginPath(); c.arc(-s * 0.45, 0, s * 0.28, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.45, 0, s * 0.28, 0, Math.PI * 2); c.fill();
  // Vartalo
  var bg2 = c.createRadialGradient(0, -s * 0.9, s * 0.2, 0, -s * 0.9, s * 1.3);
  bg2.addColorStop(0, '#8fb56f');
  bg2.addColorStop(1, '#6a9552');
  c.fillStyle = bg2;
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 0.9, s * 0.95, s * 1.05, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 0.9, s, 0, Math.PI * 2);
  c.fill();
  // Maha
  c.fillStyle = '#c6dba9';
  c.beginPath();
  c.ellipse ? c.ellipse(0, -s * 0.65, s * 0.5, s * 0.6, 0, 0, Math.PI * 2)
            : c.arc(0, -s * 0.65, s * 0.5, 0, Math.PI * 2);
  c.fill();
  // Kädet
  c.strokeStyle = '#6a9552';
  c.lineWidth = s * 0.35;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s * 0.8, -s * 1.1);
  c.lineTo(-s * 1.25, -s * 0.45 + Math.sin(troll.bounceT) * s * 0.2);
  c.moveTo(s * 0.8, -s * 1.1);
  c.lineTo(s * 1.25, -s * 0.45 - Math.sin(troll.bounceT) * s * 0.2);
  c.stroke();
  // Korvat, tukka
  c.fillStyle = '#6a9552';
  c.beginPath(); c.arc(-s * 0.85, -s * 1.75, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(s * 0.85, -s * 1.75, s * 0.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4c7440';
  c.lineWidth = s * 0.1;
  c.beginPath();
  c.moveTo(-s * 0.2, -s * 2.15); c.lineTo(-s * 0.3, -s * 2.5);
  c.moveTo(0, -s * 2.2); c.lineTo(0, -s * 2.6);
  c.moveTo(s * 0.2, -s * 2.15); c.lineTo(s * 0.3, -s * 2.5);
  c.stroke();
  // Nenä
  c.fillStyle = '#a4c583';
  c.beginPath(); c.arc(s * 0.45, -s * 1.55, s * 0.28, 0, Math.PI * 2); c.fill();
  // Silmät ja kulmakarvat
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(s * 0.15, -s * 1.75, s * 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#333';
  c.beginPath(); c.arc(s * 0.22, -s * 1.73, s * 0.09, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#3d5c33';
  c.lineWidth = s * 0.12;
  c.beginPath();
  c.moveTo(-s * 0.05, -s * 2.0); c.lineTo(s * 0.35, -s * 1.93);
  c.stroke();
  // Suu
  c.strokeStyle = '#3d5c33';
  c.lineWidth = s * 0.1;
  c.beginPath();
  c.arc(s * 0.3, -s * 1.2, s * 0.22, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
}

// Opastenuoli: näyttää suunnan lähimpään keräämättömään asiaan tai
// (kaiken kerättyä) linnaan, jotta maali löytyy aina ilman tekstiä.
function drawGuide(c) {
  if (!running || celebrating || puzzleBusy()) return;
  var targetX = null;
  var i, d;
  if (goalReady) {
    targetX = worldW * 0.945;
    // Majakkatähti linnan yllä
    var bx = worldW * 0.955 - camX;
    if (bx > -viewH * 0.3 && bx < viewW + viewH * 0.3) {
      var by = viewH * 0.22 + Math.sin(globalT * 2) * viewH * 0.012;
      drawStar(c, bx, by, viewH * 0.05, Math.sin(globalT * 0.9) * 0.35, 1);
    }
  } else {
    var bd = 1e9;
    for (i = 0; i < stars.length; i++) {
      if (stars[i].collected) continue;
      d = Math.abs(stars[i].px - unicorn.x);
      if (d < bd) { bd = d; targetX = stars[i].px; }
    }
    for (i = 0; i < bunnies.length; i++) {
      if (bunnies[i].state !== 'hidden') continue;
      d = Math.abs(bunnies[i].bushX - unicorn.x);
      if (d < bd) { bd = d; targetX = bunnies[i].bushX; }
    }
  }
  if (targetX === null) return;
  var sx = targetX - camX;
  var margin = viewW * 0.05;
  if (sx >= margin && sx <= viewW - margin) return; // kohde jo näkyvissä
  var dir = sx < margin ? -1 : 1;
  var ax = dir < 0 ? viewH * 0.10 : viewW - viewH * 0.10;
  var ay = viewH * 0.42;
  var pulse = 1 + Math.sin(globalT * 4) * 0.12;
  var r = viewH * 0.034 * pulse;
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath(); c.arc(ax, ay, r * 1.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffb300';
  c.beginPath();
  c.moveTo(ax + dir * r, ay);
  c.lineTo(ax - dir * r * 0.6, ay - r * 0.85);
  c.lineTo(ax - dir * r * 0.2, ay);
  c.lineTo(ax - dir * r * 0.6, ay + r * 0.85);
  c.closePath();
  c.fill();
}

function drawSpellOverlay(c) {
  if (!spellActive()) return;
  var g = activeGate;
  c.fillStyle = 'rgba(50,20,70,0.5)';
  c.fillRect(0, 0, viewW, viewH);

  var op = orbPositions(g.orbs);
  var shake = g.shakeT > 0 ? Math.sin(globalT * 45) * 10 * g.shakeT : 0;
  var i;

  // Edistymispisteet: montako väriä loitsusta on jo toistettu
  var dotR = viewH * 0.012;
  for (i = 0; i < g.seq.length; i++) {
    var dx2 = viewW / 2 + (i - (g.seq.length - 1) / 2) * dotR * 4;
    c.fillStyle = i < g.inputIdx ? '#ffe27a' : 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.arc(dx2 + shake, op.y - op.r * 2.1, dotR, 0, Math.PI * 2);
    c.fill();
  }

  // Väripallot
  for (i = 0; i < g.orbs; i++) {
    var lit = g.litOrb === i && (g.mode === 'show' ? true : g.litT > 0);
    var r = op.r * (lit ? 1.18 : 1);
    var x = op.xs[i] + shake;
    if (lit) {
      var glow = c.createRadialGradient(x, op.y, r * 0.4, x, op.y, r * 2);
      glow.addColorStop(0, 'rgba(255,255,255,0.5)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(x, op.y, r * 2, 0, Math.PI * 2); c.fill();
    }
    var og = c.createRadialGradient(x - r * 0.3, op.y - r * 0.3, r * 0.1, x, op.y, r);
    og.addColorStop(0, lit ? '#ffffff' : 'rgba(255,255,255,0.65)');
    og.addColorStop(0.35, ORB_COLORS[i]);
    og.addColorStop(1, ORB_COLORS[i]);
    c.fillStyle = og;
    c.beginPath(); c.arc(x, op.y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = viewH * 0.006;
    c.stroke();
  }
}

function drawRainbow(c) {
  var appear = Math.min(1, celebrateT / 1.5);
  var cx = viewW / 2;
  var cy = viewH * 0.95;
  var baseR = viewH * 0.75;
  var band = viewH * 0.025;
  c.save();
  c.globalAlpha = 0.75 * appear;
  var sweep = Math.PI * appear;
  for (var i = 0; i < maneColors.length; i++) {
    c.strokeStyle = maneColors[i];
    c.lineWidth = band;
    c.beginPath();
    c.arc(cx, cy, baseR + i * band, Math.PI, Math.PI + sweep);
    c.stroke();
  }
  c.restore();
}

function drawHUD() {
  var s = viewH * 0.022;
  var pad = s * 1.4;
  var left = hudX();
  var i;
  // Tausta
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(ctx, left, pad * 0.5, s * 2.4 * STAR_COUNT + pad, s * 3.4, s);
  ctx.fill();
  // Tähdet
  for (i = 0; i < STAR_COUNT; i++) {
    var x = left + pad * 0.5 + s * 1.2 + i * s * 2.4;
    var y = pad * 0.5 + s * 1.7;
    if (stars[i] && stars[i].collected) {
      drawStar(ctx, x, y, s, 0, 0);
    } else {
      ctx.strokeStyle = 'rgba(150,120,40,0.55)';
      ctx.lineWidth = 1.5;
      starOutline(ctx, x, y, s);
    }
  }
  // Puput
  var bx = left;
  var by = pad * 0.5 + s * 4.2;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(ctx, bx, by, s * 3.4 * BUNNY_COUNT + pad, s * 3.6, s);
  ctx.fill();
  for (i = 0; i < BUNNY_COUNT; i++) {
    var fx = bx + pad * 0.5 + s * 1.6 + i * s * 3.4;
    var fy = by + s * 2.3;
    ctx.save();
    ctx.globalAlpha = (bunnies[i] && bunnies[i].state === 'found') ? 1 : 0.25;
    drawBunny(ctx, fx, fy, s * 1.5, 0, 0, true);
    ctx.restore();
  }
}
function starOutline(c, x, y, r) {
  c.beginPath();
  for (var i = 0; i < 10; i++) {
    var rr = (i % 2 === 0) ? r : r * 0.45;
    var a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.stroke();
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

