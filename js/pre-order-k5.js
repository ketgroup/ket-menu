(function () {
  "use strict";
  // Nối app Kết: đặt URL vào đây. Lỗi mạng/404/khác 2xx => dự phòng FormSubmit.
  var USE_API = true; // Chỉ gửi về app Kết. Đã bỏ FormSubmit (31/10 22:30).
  var PREORDER_ENDPOINT = USE_API ? "https://ket-app.vercel.app/api/pre-order" : "";
  var MENU_ENDPOINT = "https://ket-app.vercel.app/api/menu?quan=K5";
  var MENU_FALLBACK = "data/menu-k5.json?v=20261031n";
  var GET_TIMEOUT = 6000;
  var THANKS = "pre-order-k5-thanh-cong.html";

  var form = document.getElementById("po-form");
  if (!form) return;
  var box = document.getElementById("po_menu"), totalEl = document.getElementById("po_total");
  var btn = document.getElementById("po_submit");
  var menu = [], qty = {}, fromApi = false;
  // Món tặng: mua 1 cocktail/mocktail tặng 1 món. Giá gốc lấy từ menu K5 theo mã (null = menu chưa có giá).
  // ma = mã món trong API (chỉ map khi chắc chắn). Món chưa có ma ghi vào ghi_chu.
  // Giá gốc đặt cứng ở đây cho dễ sửa (null = chưa có giá, chỉ hiện 0đ).
  // Wine: app nói CSB (Citra Spumante Bianco) hoặc SW (Vieux Papes Brut), CHƯA CHỐT -> null = ghi vào ghi_chu.
  var WINE_CODE = null;
  var GIFTS = [
    { key: "wine", ten: "Wine", gia_goc: 129000, ma: WINE_CODE },
    { key: "coconut", ten: "Coconut", gia_goc: 59000, ma: "m167" },
    { key: "soft", ten: "Soft Drink", gia_goc: null },
    { key: "beer", ten: "Beer", gia_goc: 59000, ma: "HB" },
    { key: "water", ten: "3 Bottles of Water", gia_goc: null }
  ];
  var gq = {};
  // Bước 1 (mở khoá món free): chỉ Signature/Classic Cocktail; API tách classic thành Low/Medium/High ABV.
  // Non-Alcoholic (Signature), Mocktail/Custom Mocktail, nhóm "COCKTAIL" (Custom ...) KHÔNG tính.
  var COCKTAIL_GROUPS = /^(signature cocktail|classic cocktail|low abv|medium abv|high abv)$/i;
  var giftBox = document.getElementById("po_gifts"), giftCount = document.getElementById("po_gift_count"), giftHint = document.getElementById("po_gift_hint");
  function giftPrice(g) { return g.gia_goc != null ? g.gia_goc : null; }
  function cocktailQty() { var n = 0; menu.forEach(function (m) { if (COCKTAIL_GROUPS.test(m.nhom)) n += qty[m.ma] || 0; }); return n; }
  function giftTotal() { var n = 0; GIFTS.forEach(function (g) { n += gq[g.key] || 0; }); return n; }
  function renderGifts() {
    giftBox.innerHTML = GIFTS.map(function (g) {
      var p = giftPrice(g);
      return '<div class="po-item" data-g-key="' + g.key + '"><div class="po-item-meta"><b>' + esc(g.ten) + '</b><span>' + (p != null ? '<s class="po-old">' + money(p) + '</s>' : '') + '<span class="po-free">0đ</span></span></div>' +
        '<div class="po-stepper"><button type="button" data-g="-1" aria-label="Bớt">−</button><output>0</output><button type="button" data-g="1" aria-label="Thêm">+</button></div></div>';
    }).join("");
  }
  function syncGifts() {
    var max = cocktailQty(), t = giftTotal();
    for (var i = GIFTS.length - 1; i >= 0 && t > max; i--) { var k = GIFTS[i].key; while ((gq[k] || 0) > 0 && t > max) { gq[k]--; t--; } }
    GIFTS.forEach(function (g) { var row = giftBox.querySelector('[data-g-key="' + g.key + '"]'); if (!row) return; row.querySelector("output").textContent = gq[g.key] || 0; row.classList.toggle("is-picked", (gq[g.key] || 0) > 0); });
    giftBox.classList.toggle("is-locked", t >= max);
    document.getElementById("po_step2").classList.toggle("is-locked", !max);
    giftBox.querySelectorAll('button[data-g="1"]').forEach(function (b) { b.disabled = t >= max; });
    giftCount.textContent = "Đã chọn " + t + "/" + max + " món free";
    giftHint.textContent = max ? (t < max ? "Bạn còn " + (max - t) + " món free có thể chọn." : "Đã đủ số món free.") : "Chọn cocktail ở Bước 1 để mở khoá.";
  }
  giftBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-g]"); if (!b || b.disabled) return;
    var k = b.closest(".po-item").getAttribute("data-g-key"), d = Number(b.getAttribute("data-g"));
    if (d > 0 && giftTotal() >= cocktailQty()) return;
    gq[k] = Math.max(0, (gq[k] || 0) + d); syncGifts();
  });
  function giftData() {
    return GIFTS.filter(function (g) { return gq[g.key] > 0; }).map(function (g) { return { ma: g.ma || null, ten: g.ten, so_luong: gq[g.key], gia_goc: giftPrice(g), gia: 0 }; });
  }

  function money(n) { return n == null ? "" : n.toLocaleString("vi-VN").replace(/,/g, ".") + "đ"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); }); }
  function getJSON(url) {
    return Promise.race([fetch(url, { headers: { Accept: "application/json" } }), timeout(6000)]).then(function (r) {
      if (!r.ok || r.redirected) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function norm(d) {
    var arr = Array.isArray(d) ? d : (d.mon || d.items || d.data || []);
    return arr.map(function (m) {
      return { ma: m.ma || m.ma_mon || m.id || m.code, ten: m.ten || m.ten_mon || m.name, gia: m.gia != null ? Number(m.gia) : (m.price != null ? Number(m.price) : null), nhom: m.nhom || m.group || "Khác" };
    }).filter(function (m) { return m.ma && m.ten; }).map(function (m) { return m;
    }).filter(function (m) { return m.ma && m.ten; });
  }
  function render() {
    var groups = {}, order = [];
    menu.forEach(function (m) { if (!groups[m.nhom]) { groups[m.nhom] = []; order.push(m.nhom); } groups[m.nhom].push(m); });
    function html(list) { return list.map(function (g, i) {
      return '<details class="po-group" data-nhom="' + esc(g) + '"' + (i === 0 ? " open" : "") + '><summary aria-expanded="' + (i === 0) + '"><span class="po-g-name">' + esc(g) + '</span><span class="po-g-right"><b class="po-g-badge" hidden>0</b><small>' + groups[g].length + '</small><i class="po-g-chev" aria-hidden="true"></i></span></summary>' +
        groups[g].map(function (m) {
          return '<div class="po-item" data-ma="' + esc(m.ma) + '"><div class="po-item-meta"><b>' + esc(m.ten) + '</b><span>' + (m.gia == null ? "Giá theo quán" : money(m.gia)) + '</span></div>' +
            '<div class="po-stepper"><button type="button" data-d="-1" aria-label="Bớt">−</button><output>0</output><button type="button" data-d="1" aria-label="Thêm">+</button></div></div>';
        }).join("") + '</details>';
    }).join(""); }
    var top = order.filter(function (g) { return COCKTAIL_GROUPS.test(g); });
    var rest = order.filter(function (g) { return !COCKTAIL_GROUPS.test(g); });
    document.getElementById("po_menu_top").innerHTML = html(top);
    box.innerHTML = html(rest);
    document.querySelectorAll(".po-group").forEach(function (d) { d.addEventListener("toggle", function () { d.querySelector("summary").setAttribute("aria-expanded", String(d.open)); }); });
    updateBadges();
  }
  function updateBadges() {
    document.querySelectorAll(".po-group[data-nhom]").forEach(function (d) {
      var n = 0; d.querySelectorAll(".po-item[data-ma]").forEach(function (r) { n += qty[r.getAttribute("data-ma")] || 0; });
      var b = d.querySelector(".po-g-badge"); b.textContent = n; b.hidden = !n;
    });
  }
  function updateTotal() {
    var n = 0, sum = 0, unknown = false;
    menu.forEach(function (m) { var q = qty[m.ma] || 0; if (q) { n += q; if (m.gia == null) unknown = true; else sum += q * m.gia; } });
    totalEl.textContent = n ? (n + " món · tạm tính " + money(sum) + (unknown ? " + món giá theo quán" : "")) : "Chưa chọn món";
  }
  var poClick = function (e) {
    var b = e.target.closest("button[data-d]"); if (!b) return;
    var row = b.closest(".po-item"), ma = row.getAttribute("data-ma");
    var q = Math.max(0, Math.min(99, (qty[ma] || 0) + Number(b.getAttribute("data-d"))));
    qty[ma] = q; row.querySelector("output").textContent = q; row.classList.toggle("is-picked", q > 0); updateBadges(); updateTotal(); syncGifts();
  };
  box.addEventListener("click", poClick); document.getElementById("po_menu_top").addEventListener("click", poClick);
  (USE_API ? getJSON(MENU_ENDPOINT) : Promise.reject(0)).then(norm).then(function (m) { if (!m.length) throw 0; fromApi = true; return m; })
    .catch(function () { return getJSON(MENU_FALLBACK).then(norm); })
    .then(function (m) { menu = m; render(); renderGifts(); updateTotal(); syncGifts(); })
    .catch(function () { document.getElementById("po_menu_top").innerHTML = ""; box.innerHTML = '<p class="po-loading">Không tải được menu, bạn ghi món vào ô Ghi chú nhé.</p>'; });

  // Ngày thứ 4 / thứ 6 trong 8 tuần tới, theo giờ Việt Nam
  function vnToday() { var d = new Date(Date.now() + 7 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function okDay(s) { var d = new Date(s + "T00:00:00Z"); return !isNaN(d) && (d.getUTCDay() === 3 || d.getUTCDay() === 5) && d >= vnToday(); }
  (function fillDays() {
    var sel = document.getElementById("po_ngay"), t = vnToday(), h = '<option value="">— Chọn thứ 4 hoặc thứ 6 —</option>';
    for (var i = 0; i < 56; i++) { var d = new Date(t.getTime() + i * 864e5), w = d.getUTCDay();
      if (w === 3 || w === 5) h += '<option value="' + iso(d) + '">' + (w === 3 ? "Thứ 4" : "Thứ 6") + ", " + pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear() + (i === 0 ? " (hôm nay)" : "") + "</option>"; }
    sel.innerHTML = h;
  })();
  // Cảnh báo đặt sau 12:00 trưa (giờ VN) cho chính hôm nay
  function vnHour() { return new Date(Date.now() + 7 * 3600e3).getUTCHours(); }
  function checkLate() { var v = document.getElementById("po_ngay").value, w = document.getElementById("po_ngay_warn");
    if (w) w.hidden = !(v && v === iso(vnToday()) && vnHour() >= 12); }
  document.getElementById("po_ngay").addEventListener("change", checkLate); checkLate();
  function val(id) { return (document.getElementById(id).value || "").trim(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function makeId() {
    var d = new Date(), s = "", c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (var i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
    return "PK5-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + s;
  }
  function phoneOk(p) { p = p.replace(/[\s.\-()]/g, "").replace(/^\+84/, "0").replace(/^84(?=\d{9}$)/, "0"); return /^0(3|5|7|8|9)\d{8}$/.test(p) ? p : null; }
  function fail(id, msg) { window.alert(msg); var el = document.getElementById(id); if (el) el.focus(); return false; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form._honey && form._honey.value) return;
    var ten = val("po_ten"), sdt = phoneOk(val("po_sdt")), email = val("po_email"), den = (val("po_ngay") && val("po_gio")) ? val("po_ngay") + "T" + val("po_gio") : "", nguoi = parseInt(val("po_nguoi"), 10);
    if (!ten) return fail("po_ten", "Vui lòng nhập tên.");
    if (!sdt) return fail("po_sdt", "Số điện thoại chưa đúng (VD 0896789768).");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("po_email", "Email chưa đúng.");
    if (!val("po_ngay") || !okDay(val("po_ngay"))) return fail("po_ngay", "Pre-order chỉ nhận ngày thứ 4 hoặc thứ 6 (sự kiện Latin Dance) từ hôm nay.");
    if (!val("po_gio")) return fail("po_gio", "Vui lòng chọn giờ đến.");
    if (!(nguoi >= 1)) return fail("po_nguoi", "Số người tối thiểu là 1.");
    var data = {
      id: makeId(), tao_luc: new Date().toISOString(), quan: "K5", ten: ten, sdt: sdt, email: email,
      su_kien: "Latin Dance", ngay_gio_den: den, so_nguoi: nguoi,
      mon: menu.filter(function (m) { return qty[m.ma] > 0; }).map(function (m) { return { ma: m.ma, ten: m.ten, so_luong: qty[m.ma], gia: m.gia, buoc: COCKTAIL_GROUPS.test(m.nhom) ? 1 : 3 }; }),
      mon_tang: giftData(),
      ghi_chu: val("po_ghichu")
    };
    if (USE_API && !email || email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("po_email", "Vui lòng nhập email để quán xác nhận đơn.");
    if (!data.mon.length) return fail("po_menu_top", "Vui lòng chọn ít nhất 1 món.");
    btn.disabled = true; btn.textContent = "Đang gửi…";
    var tangMa = data.mon_tang.filter(function (g) { return g.ma && menu.some(function (m) { return m.ma === g.ma; }); }).slice(0, 10);
    var tang = data.mon_tang.filter(function (g) { return tangMa.indexOf(g) < 0; }).map(function (g) { return g.so_luong + " × " + g.ten; }).join(", ");
    var tom = function (b) { return data.mon.filter(function (m) { return m.buoc === b; }).map(function (m) { return m.so_luong + "×" + m.ten; }).join(", ") || "-"; };
    var tomTat = "Latin Dance | B1 Cocktail: " + tom(1) + " | B2 Free: " + (data.mon_tang.map(function (g) { return g.so_luong + "×" + g.ten; }).join(", ") || "-") + " | B3 Khác: " + tom(3);
    var api = { quan: "K5", ten_khach: ten.slice(0, 80), email: email, dong_y_nhan_tin: false, sdt: sdt,
      ngay_den: val("po_ngay"), gio_den: val("po_gio"), so_khach: Math.min(50, nguoi),
      mon: data.mon.slice(0, 40).map(function (m) { return { ma: m.ma, so_luong: m.so_luong, buoc: m.buoc }; }).concat(tangMa.map(function (g) { return { ma: g.ma, so_luong: g.so_luong, tang: true, buoc: 2 }; })),
      ghi_chu: (tomTat + (tang ? " | Free chưa có mã: " + tang : "") + (data.ghi_chu ? " · " + data.ghi_chu : "")).slice(0, 500),
      website: form._honey ? form._honey.value : "" };
    var errBox = document.getElementById("po_err"), doneBox = document.getElementById("po_done");
    errBox.hidden = true;
    function again(msg) { btn.disabled = false; btn.textContent = "Gửi đặt món"; errBox.innerHTML = esc(msg) + ' <a href="tel:0896789768">Gọi 089 6789768</a>'; errBox.hidden = false; errBox.scrollIntoView({ block: "center", behavior: "smooth" }); }
    function done(ma) { form.hidden = true; doneBox.innerHTML = '<h2>Cảm ơn bạn! 💃</h2><p>Quán đã nhận đơn pre-order. Mã đơn: <b>' + esc(ma) + '</b></p><p>Quán sẽ gọi lại xác nhận. Cần gấp gọi <a href="tel:0896789768">089 6789768</a>.</p>'; doneBox.hidden = false; window.scrollTo(0, 0); }
    Promise.race([fetch(PREORDER_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(api) }), timeout(8000)])
      .then(function (r) {
        if (r.status === 201 || r.ok) return r.json().catch(function () { return {}; }).then(function (j) { done(j.id || data.id); });
        if (r.status === 429) return again("Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau khoảng 10 phút hoặc gọi quán.");
        if (r.status === 400) return r.json().then(function (j) { again(j.error || "Thông tin chưa hợp lệ, bạn kiểm tra lại nhé."); }, function () { again("Thông tin chưa hợp lệ, bạn kiểm tra lại nhé."); });
        throw new Error("HTTP " + r.status);
      })
      .catch(function () { again("Chưa gửi được đơn (lỗi mạng). Bạn thử lại sau ít phút hoặc gọi quán."); });
  });
})();
