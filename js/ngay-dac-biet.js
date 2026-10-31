/* Danh sách ngày đặc biệt cho dòng teaser trang chủ (theo giờ VN).
   Mỗi dòng: [ngày "MM-DD" (lặp mỗi năm) hoặc "YYYY-MM-DD" (lễ âm lịch), tên dịp (tiếng Việt, là khoá dịch trong i18n/*.json), loại "lon"/"nho", chú thích].
   Ngày "lon" = đúng danh sách ×3 lương (300%) trong Quy định Kết mục 3.1.1.4 + trang Nội quy mục 11d (ket-brain).
   Thêm tên dịp mới thì nhớ thêm khoá dịch vào i18n/*.json và js/lang/*.js. */
window.KET_NGAY_DAC_BIET = [
  ["01-01", "Chúc mừng năm mới 🎆", "lon", "Tết Dương lịch (×3)"],
  ["02-14", "Happy Valentine 💘", "lon", "Valentine – ngày đặc biệt của quán (×3)"],
  ["04-30", "Mừng ngày Thống nhất 30/4 🇻🇳", "lon", "Giải phóng miền Nam (×3)"],
  ["05-01", "Mừng Quốc tế Lao động 1/5 🛠️", "lon", "Quốc tế Lao động (×3)"],
  ["09-02", "Mừng Quốc khánh 2/9 🇻🇳", "lon", "Quốc khánh, chỉ 02/09 – đã chốt (×3)"],
  ["12-24", "Đêm Giáng sinh an lành 🎄", "lon", "Noel 24/12 – ngày đặc biệt của quán (×3)"],
  /* Tết Nguyên Đán 2027: Thông báo 11483/TB-BNV ngày 09/10/2026 (Bộ Nội vụ), 03–07/02/2027, mùng 1 = 06/02/2027 */
  ["2027-02-03", "Chúc mừng năm mới – Tết Nguyên Đán 🧧", "lon", "Tết 2027 (29 tháng Chạp)"],
  ["2027-02-04", "Chúc mừng năm mới – Tết Nguyên Đán 🧧", "lon", "Tết 2027"],
  ["2027-02-05", "Chúc mừng năm mới – Tết Nguyên Đán 🧧", "lon", "Tết 2027 (30 Tết)"],
  ["2027-02-06", "Chúc mừng năm mới – Tết Nguyên Đán 🧧", "lon", "Tết 2027 (mùng 1)"],
  ["2027-02-07", "Chúc mừng năm mới – Tết Nguyên Đán 🧧", "lon", "Tết 2027 (mùng 2)"],
  ["2027-04-16", "Giỗ Tổ Hùng Vương 🏮", "lon", "10/3 âm lịch năm 2027"],
  ["03-08", "Mừng Quốc tế Phụ nữ 8/3 🌷", "nho", "Quốc tế Phụ nữ"],
  ["06-01", "Mừng Quốc tế Thiếu nhi 1/6 🎈", "nho", "Quốc tế Thiếu nhi"],
  ["10-20", "Mừng ngày Phụ nữ Việt Nam 20/10 🌹", "nho", "Phụ nữ Việt Nam"],
  ["10-31", "Happy Halloween 🎃", "nho", "Halloween"],
  ["11-20", "Mừng ngày Nhà giáo Việt Nam 20/11 💐", "nho", "Nhà giáo Việt Nam"],
  ["12-25", "Merry Christmas 🎄", "nho", "Noel 25/12"]
];
(function () {
  function homNay() {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    return o.year + "-" + o.month + "-" + o.day;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function run() {
    var h = document.querySelector(".home-hero"); if (!h) return;
    var d = homNay(), md = d.slice(5), hit = null;
    var thu = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))).getUTCDay();
    window.KET_NGAY_DAC_BIET.forEach(function (r) { if (!hit && (r[0] === d || r[0] === md)) hit = r; });
    var evs = [];
    (window.KET_EVENTS || []).forEach(function (e, i) {
      if (e.thu === "moi" || (Array.isArray(e.thu) && e.thu.indexOf(thu) >= 0)) evs.push([e, i]);
    });
    /* Sự kiện theo ngày lên trước, sự kiện hằng ngày xếp sau */
    evs.sort(function (a, b) { return (a[0].thu === "moi") - (b[0].thu === "moi") || a[1] - b[1]; });
    if (!hit && !evs.length) return;
    var box = document.createElement("div");
    box.className = "teaser-dac-biet" + (hit ? "" : " teaser-thuong");
    var html = '<span class="teaser-shine" aria-hidden="true"></span><span class="teaser-live"><i aria-hidden="true"></i><span>Hôm nay</span></span>';
    if (hit) html += '<a class="teaser-dip-link" href="#event-strip"><b class="teaser-dip">' + esc(hit[1]) + '</b><span class="teaser-cau">Hôm nay các quán Kết có bất ngờ đang chờ bạn…</span></a>';
    if (evs.length) {
      html += '<div class="teaser-ev"><span class="teaser-ev-tit">Sự kiện hôm nay</span><div class="teaser-chips" role="list">' + evs.map(function (x) {
        var e = x[0];
        return '<a role="listitem" class="teaser-chip" data-ev="' + x[1] + '" href="' + (e.preorder ? esc(e.href) : "#event-strip") + '" style="--c:' + esc(e.mau) + '">' +
          '<span class="teaser-chip-ic" aria-hidden="true">' + esc(e.icon) + '</span><span class="teaser-chip-tx"><b>' + esc(e.ten) + '</b><small>' + esc(e.quan) + '</small></span>' +
          (e.preorder ? '<span class="teaser-chip-po">Pre-order ›</span>' : '') + '</a>';
      }).join("") + '</div></div>';
    }
    box.innerHTML = html;
    h.appendChild(box);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.addEventListener("click", function (ev) {
      var c = ev.target.closest(".teaser-chip"); if (!c) return;
      var e = window.KET_EVENTS[+c.getAttribute("data-ev")]; if (e && e.preorder) return;
      var t = document.querySelector('.event-btn[data-ev="' + c.getAttribute("data-ev") + '"]'); if (!t) return;
      ev.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      t.classList.remove("ev-noi"); void t.offsetWidth; t.classList.add("ev-noi");
      setTimeout(function () { t.classList.remove("ev-noi"); }, 2200);
    });
  }
  /* Chạy sau su-kien.js (cần KET_EVENTS) */
  if (document.readyState === "complete") run(); else document.addEventListener("DOMContentLoaded", run);
})();
