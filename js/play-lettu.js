'use strict';

// TYNKÄ: Lettukahvila. Korvataan oikealla kentällä.
var lkf = { t: 0 };
function initLettu() { lkf.t = 0; renderBackground(); }
function respawnLettu() {}
function resizeLettu() {}
function handleLettuTap(px, py) { startCelebration(); }
function updateLettu(dt) { lkf.t += dt; updateParticles(dt); updateConfetti(dt); }
function renderLettuBg(b, w, h) { b.fillStyle = '#bfe4ff'; b.fillRect(0, 0, w, h); }
function drawLettu() {
  if (!beginPlayWorld()) return;
  endPlayWorld();
}
HUB_ICONS.lettu = function (c, x, y, s) { artCircle(c, x, y, s * 0.2, '#ff8fb8', {}); };
