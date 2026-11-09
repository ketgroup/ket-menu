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
    var tiles = [].slice.call(document.querySelectorAll(".page-home .home-venues .about-venue-tile"));
    if (!tiles.length) return;
    tiles.forEach(function (el, i) {
      el.style.setProperty("--the-phase", String(i * 1.35));
    });
    var scrollY = window.scrollY || 0;
    var lastY = scrollY;
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
      var targetTilt = clamp(-vel * 0.14, -6, 6);
      tilt += (targetTilt - tilt) * (scrollIdle < 4 ? 0.22 : 0.08);
      if (scrollIdle > 18) tilt *= 0.92;

      var t = (now - t0) * 0.001;
      tiles.forEach(function (el, i) {
        if (!el.classList.contains("bv-in")) return;
        var phase = parseFloat(el.style.getPropertyValue("--the-phase")) || i * 1.35;
        var bob = Math.sin(t * 1.05 + phase) * 5;
        var side = el.classList.contains("bv-left") ? -0.35 : 0.35;
        var r = tilt * side;
        if (!el.classList.contains("the-touch") && !(el.matches && el.matches(":hover"))) {
          el.style.setProperty("--the-dy", bob.toFixed(2) + "px");
          el.style.setProperty("--the-tilt", r.toFixed(2) + "deg");
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
