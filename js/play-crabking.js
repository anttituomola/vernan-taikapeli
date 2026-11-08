'use strict';

// TYNKÄ: Rapukuningas. Korvataan oikealla kentällä.
var crk = { t: 0 };
function initCrabking() { crk.t = 0; renderBackground(); }
function respawnCrabking() {}
function resizeCrabking() {}
function handleCrabkingTap(px, py) { startCelebration(); }
function updateCrabking(dt) { crk.t += dt; updateParticles(dt); updateConfetti(dt); }
function renderCrabkingBg(b, w, h) { b.fillStyle = '#3a9ed0'; b.fillRect(0, 0, w, h); }
function drawCrabking() {
  if (!beginPlayWorld()) return;
  endPlayWorld();
}
HUB_ICONS.crabking = function (c, x, y, s) { artCircle(c, x, y, s * 0.2, '#ff7a5a', {}); };
