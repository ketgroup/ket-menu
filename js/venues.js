/** Cấu hình quán & logo — chỉnh màu/logo tại đây */
window.KET_HOTLINE = {
  phone: "0896789768",
  phoneDisplay: "089 6789768",
};

window.KET_VENUE_ORDER = ["k1", "k2", "k5", "k9"];

window.KET_VENUES = {
  k1: {
    maps: "https://maps.app.goo.gl/Jw4EJ4yAvNu57tPE9",
    id: "k1",
    price: { from: 99, to: 489, avg: 170 },
    code: "K1",
    title: "Kết Bar",
    tagline: "Tiệm chữa lành · Pain killer",
    tabLabel: "Bar",
    href: "k1.html",
    tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g298085-d27147348-Reviews-Ket_Bar-Da_Nang.html",
    logo: "img/logos/k1.png",
    accent: "#FF9F0A",
    accentRgb: "255, 159, 10",
    hours: ["19:00 – 02:30"],
    address: "04 Phan Kế Bính, Thuận Phước, Hải Châu, Đà Nẵng",
    phone: window.KET_HOTLINE.phone,
    phoneDisplay: window.KET_HOTLINE.phoneDisplay,
  },
  k2: {
    maps: "https://maps.app.goo.gl/gfpqagx7jqnNx8gx8",
    id: "k2",
    price: { from: 100, to: 480, avg: 175 },
    code: "K2",
    title: "Kết High",
    tagline: "F.U.N in the house · Nơi mượn niềm vui",
    tabLabel: "High",
    href: "k2.html",
    tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g298085-d27699650-Reviews-Ket_High_Cocktail_Bar-Da_Nang.html",
    logo: "img/logos/k2.png",
    accent: "#F2F2F7",
    accentRgb: "242, 242, 247",
    lightAccent: true,
    hours: ["19:00 – 02:30"],
    address: "Tầng 3, 200 Bạch Đằng, Hải Châu, Đà Nẵng",
    phone: window.KET_HOTLINE.phone,
    phoneDisplay: window.KET_HOTLINE.phoneDisplay,
  },
  k5: {
    maps: "https://maps.app.goo.gl/jHd6d3vSBdpbnT3x6",
    id: "k5",
    price: { from: 39, to: 209, avg: 125 },
    code: "K5",
    title: "Kết Fai",
    tagline: "Kitchen · Bar",
    tabLabel: "Fai",
    href: "k5.html",
    tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g298085-d34677504-Reviews-K_t_Fai-Da_Nang.html",
    logo: "img/logos/k5.png",
    accent: "#BF5AF2",
    accentRgb: "191, 90, 242",
    hours: ["Kitchen 10:30 – 14:00, 17:30 – 22:00", "Cocktail 18:00 – khuya"],
    address: "138 Đỗ Bá, An Thượng, Đà Nẵng",
    phone: window.KET_HOTLINE.phone,
    phoneDisplay: window.KET_HOTLINE.phoneDisplay,
  },
  k9: {
    maps: "https://maps.app.goo.gl/dxzVkypfbmShgBUCA",
    id: "k9",
    price: { from: 50, to: 490, avg: 180 },
    code: "K9",
    title: "Kết Underground",
    tagline: "Dammm",
    tabLabel: "Underground",
    href: "k9.html",
    tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g298085-d34676378-Reviews-K_t_Underground-Da_Nang.html",
    logo: "img/logos/k9.png",
    accent: "#FF453A",
    accentRgb: "255, 69, 58",
    hours: ["19:30 – 02:30"],
    address: "106 Bạch Đằng – 04 Hùng Vương",
    /* Link tìm kiếm Google Maps (chưa tìm được link listing riêng) */
    phone: window.KET_HOTLINE.phone,
    phoneDisplay: window.KET_HOTLINE.phoneDisplay,
  },
};

window.KET_BRAND = {
  name: "Kết Group",
  homeLogo: "img/logos/ket-logo-mau.png",
  homeLogoAlt: "Kết Group",
  favicon: "img/logos/favicon.png",
  appleTouchIcon: "img/logos/apple-touch-icon.png",
};

/**
 * Dòng giá nhỏ trên nút chọn quán (cập nhật 27/10/2026), đơn vị nghìn đồng.
 * Chỉ tính đồ uống bán ly: cocktail, mocktail, shot, bia, rượu mạnh bán ly,
 * vang ly, cà phê/nước (K5). Bỏ chai/carafe/jug/combo, món 0đ, thuốc lá,
 * đồ ăn/snack, nước mixer, topping thêm.
 * from/to = giá ly thấp nhất / cao nhất; avg = trung bình cộng giá các món
 * đồ uống bán ly, làm tròn 5k. K1 theo menu PDF mới pdf/menu-k1.pdf (27/10/2026):
 * 109 món bán ly (28 cocktail + 81 mocktail/bia/shot/rượu ly), TB 169,1 → 170;
 * K2/K5/K9 theo giá trên ảnh menu của trang.
 */
window.KET_priceLine = function (venue) {
  var p = venue && venue.price;
  if (!p) return "";
  return "Từ " + p.from + "k – " + p.to + "k · TB ~" + p.avg + "k/ly";
};

window.KET_mapsUrl = function (address) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address)
  );
};

window.KET_hoursHome = function (venue) {
  if (!venue.hours || !venue.hours.length) return "";
  return venue.hours.join(" · ");
};

window.applyVenueTheme = function () {
  var body = document.body;
  if (!body) return;
  var venueId = body.getAttribute("data-current-venue");
  body.removeAttribute("data-venue-light-accent");
  if (!venueId || !window.KET_VENUES[venueId]) return;
  var v = window.KET_VENUES[venueId];
  var root = document.documentElement;
  root.style.setProperty("--venue-accent", v.accent);
  root.style.setProperty("--venue-accent-rgb", v.accentRgb);
  if (v.lightAccent) {
    body.setAttribute("data-venue-light-accent", "true");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", window.applyVenueTheme);
} else {
  window.applyVenueTheme();
}
