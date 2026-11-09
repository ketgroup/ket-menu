(function () {
  try {
    if (!document.body.classList.contains("page-home")) return;
  } catch (e) {
    return;
  }

  var reduce = false;
  try {
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e2) {}

  function motionOf(tile) {
    return tile.closest(".the-motion");
  }

  function bindTouch() {
    if (reduce) return;
    document.querySelectorAll(".page-home .home-venues .about-venue-tile").forEach(function (tile) {
      if (tile._theTouch) return;
      tile._theTouch = 1;
      function lift() {
        tile.classList.add("the-touch");
      }
      function unlift() {
        tile.classList.remove("the-touch");
      }
      tile.addEventListener("pointerdown", lift, { passive: true });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        tile.addEventListener(ev, unlift);
      });
    });
  }

  function startMotion() {
    if (reduce) return;
    var motions = [].slice.call(document.querySelectorAll(".page-home .home-venues .the-motion"));
    if (!motions.length) return;
    motions.forEach(function (motion, i) {
      motion.style.setProperty("--the-phase", String(i * 1.35));
    });
    var lastY = window.scrollY || 0;
    var tilt = 0;
    var vel = 0;
    var scrollIdle = 0;
    var t0 = performance.now();

    function clamp(n, a, b) {
      return n < a ? a : n > b ? b : n;
    }

    function tick(now) {
      var dy = (window.scrollY || 0) - lastY;
      lastY = window.scrollY || 0;
      vel = vel * 0.82 + dy * 0.18;
      if (Math.abs(dy) > 0.2) scrollIdle = 0;
      else scrollIdle += 1;
      var targetTilt = clamp(-vel * 0.06, -2.5, 2.5);
      tilt += (targetTilt - tilt) * (scrollIdle < 4 ? 0.22 : 0.08);
      if (scrollIdle > 18) tilt *= 0.92;

      var t = (now - t0) * 0.001;
      motions.forEach(function (motion, i) {
        var tile = motion.querySelector(".about-venue-tile");
        if (!tile || !tile.classList.contains("bv-settled")) {
          motion.style.setProperty("--the-dy", "0px");
          motion.style.setProperty("--the-tilt", "0deg");
          return;
        }
        var phase = parseFloat(motion.style.getPropertyValue("--the-phase")) || i * 1.35;
        var bob = Math.sin(t * 0.9 + phase) * 2.5;
        var side = tile.classList.contains("bv-left") ? -0.45 : 0.45;
        var r = tilt * side;
        if (!tile.classList.contains("the-touch")) {
          motion.style.setProperty("--the-dy", bob.toFixed(2) + "px");
          motion.style.setProperty("--the-tilt", r.toFixed(2) + "deg");
        }
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function ready() {
    bindTouch();
    startMotion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
