'use strict';

// TYNKÄ: Sateenkaariliuku. Korvataan oikealla kentällä.
var rbs = { t: 0 };
function initRbslide() { rbs.t = 0; renderBackground(); }
function respawnRbslide() {}
function resizeRbslide() {}
function handleRbslideTap(px, py) { startCelebration(); }
function updateRbslide(dt) { rbs.t += dt; updateParticles(dt); updateConfetti(dt); }
function renderRbslideBg(b, w, h) { b.fillStyle = '#bfe4ff'; b.fillRect(0, 0, w, h); }
function rbslideLayers() { return [{ speed: 1, render: renderRbslideBg }]; }
function drawRbslide() {
  if (!beginPlayWorld()) return;
  endPlayWorld();
}
HUB_ICONS.rbslide = function (c, x, y, s) { artCircle(c, x, y, s * 0.2, '#ff8fb8', {}); };
