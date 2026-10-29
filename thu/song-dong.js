(function () {
  try {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.documentElement;
    if (reduce || !("IntersectionObserver" in window)) return;
    var SEL = ".promo-card, .inset-group, .about-block, .about-venue-tile, .venue-social, .menu-content > *, .site-footer, .form-section-title, .field, .home-tagline, main h2, main p";
    function setup() {
      var seen = [], groups = new Map();
      document.querySelectorAll(SEL).forEach(function (el) {
        if (el.closest(".reveal") || el.closest(".sd-reveal") || el.closest(".ios-tab-bar") || el.closest(".ios-nav")) return;
        el.classList.add("sd-reveal"); seen.push(el);
        var p = el.parentNode, i = groups.get(p) || 0; groups.set(p, i + 1);
        el.style.setProperty("--sd-delay", Math.min(i, 6) * 70 + "ms");
      });
      root.classList.add("sd-js");
      var vh = innerHeight;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("sd-in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      seen.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) { el.classList.add("sd-now", "sd-in"); } else io.observe(el);
      });
      requestAnimationFrame(function () { seen.forEach(function (el) { el.classList.remove("sd-now"); }); });
      // an toàn: sau 4s hiện hết nếu có gì kẹt
      setTimeout(function () { seen.forEach(function (el) { el.classList.add("sd-in"); }); }, 4000);
    }
    // gợn sóng khi chạm
    document.addEventListener("pointerdown", function (ev) {
      var t = ev.target.closest && ev.target.closest(".ios-btn, .tab-item, .promo-card, .venue-social-btn, .about-cta-btn, .about-venue-tile, button");
      if (!t) return;
      var r = t.getBoundingClientRect(), d = Math.max(r.width, r.height);
      if (getComputedStyle(t).position === "static") t.classList.add("sd-ripple-host");
      else t.style.overflow = t.style.overflow || "hidden";
      var s = document.createElement("span"); s.className = "sd-ripple";
      s.style.width = s.style.height = d + "px";
      s.style.left = ev.clientX - r.left - d / 2 + "px"; s.style.top = ev.clientY - r.top - d / 2 + "px";
      t.appendChild(s); setTimeout(function () { s.remove(); }, 700);
    }, { passive: true });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
  } catch (e) { document.documentElement.classList.remove("sd-js"); }
})();
