'use strict';

// TYNKÄ: Merihevoskyyti. Korvataan oikealla kentällä.
var shr = { t: 0 };
function initSeahorse() { shr.t = 0; renderBackground(); }
function respawnSeahorse() {}
function resizeSeahorse() {}
function handleSeahorseTap(px, py) { startCelebration(); }
function updateSeahorse(dt) { shr.t += dt; updateParticles(dt); updateConfetti(dt); }
function renderSeahorseBg(b, w, h) { b.fillStyle = '#3a9ed0'; b.fillRect(0, 0, w, h); }
function drawSeahorse() {
  if (!beginPlayWorld()) return;
  endPlayWorld();
}
HUB_ICONS.seahorse = function (c, x, y, s) { artCircle(c, x, y, s * 0.2, '#4fc8c0', {}); };
