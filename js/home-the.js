(function () {
  try {
    if (!document.body.classList.contains("page-home")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  } catch (e) {}
})();
