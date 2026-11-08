'use strict';

// TYNKÄ: Helmipaja. Korvataan oikealla kentällä.
var psh = { t: 0 };
function initPearlshop() { psh.t = 0; renderBackground(); }
function respawnPearlshop() {}
function resizePearlshop() {}
function handlePearlshopTap(px, py) { startCelebration(); }
function updatePearlshop(dt) { psh.t += dt; updateParticles(dt); updateConfetti(dt); }
function renderPearlshopBg(b, w, h) { b.fillStyle = '#3a9ed0'; b.fillRect(0, 0, w, h); }
function drawPearlshop() {
  if (!beginPlayWorld()) return;
  endPlayWorld();
}
HUB_ICONS.pearlshop = function (c, x, y, s) { artCircle(c, x, y, s * 0.2, '#ff9fc8', {}); };
