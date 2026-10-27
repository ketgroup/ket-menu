/** Cấu hình quán & logo — chỉnh màu/logo tại đây */
window.KET_VENUES = {
  k1: {
    id: "k1",
    code: "K1",
    title: "Kết Bar",
    tabLabel: "K1 Bar",
    href: "k1.html",
    logo: "img/logos/k1.png",
    accent: "#FF9F0A",
    accentRgb: "255, 159, 10",
  },
  k2: {
    id: "k2",
    code: "K2",
    title: "Kết High",
    tabLabel: "K2 High",
    href: "k2.html",
    logo: "img/logos/k2.png",
    accent: "#F2F2F7",
    accentRgb: "242, 242, 247",
    lightAccent: true,
  },
  k5: {
    id: "k5",
    code: "K5",
    title: "Kết Fai",
    tabLabel: "K5 Fai",
    href: "k5.html",
    logo: "img/logos/k5.png",
    accent: "#BF5AF2",
    accentRgb: "191, 90, 242",
  },
  k9: {
    id: "k9",
    code: "K9",
    title: "Kết Underground",
    tabLabel: "K9 UG",
    href: "k9.html",
    logo: "img/logos/k9.png",
    accent: "#FF453A",
    accentRgb: "255, 69, 58",
  },
};

window.KET_BRAND = {
  name: "Kết Group",
  homeLogo: "img/logos/logo-vang.png",
  homeLogoAlt: "Kết Group",
  favicon: "img/logos/favicon.png",
  appleTouchIcon: "img/logos/apple-touch-icon.png",
};

(function applyTheme() {
  var venueId = document.body && document.body.getAttribute("data-current-venue");
  if (!venueId || !window.KET_VENUES[venueId]) return;
  var v = window.KET_VENUES[venueId];
  var root = document.documentElement;
  root.style.setProperty("--venue-accent", v.accent);
  root.style.setProperty("--venue-accent-rgb", v.accentRgb);
  if (v.lightAccent) {
    document.body.setAttribute("data-venue-light-accent", "true");
  }
})();
