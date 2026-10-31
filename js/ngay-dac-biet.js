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
  function run() {
    var h = document.querySelector(".home-hero"); if (!h) return;
    var d = homNay(), md = d.slice(5), hit = null;
    window.KET_NGAY_DAC_BIET.forEach(function (r) { if (!hit && (r[0] === d || r[0] === md)) hit = r; });
    if (!hit) return;
    var a = document.createElement("a");
    a.className = "teaser-dac-biet"; a.href = "#event-strip";
    a.innerHTML = '<span class="teaser-shine" aria-hidden="true"></span><span class="teaser-live"><i aria-hidden="true"></i><span>Hôm nay</span></span>' +
      '<b class="teaser-dip"></b><span class="teaser-cau">Hôm nay các quán Kết có bất ngờ đang chờ bạn…</span>';
    a.querySelector(".teaser-dip").textContent = hit[1];
    h.appendChild(a);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
