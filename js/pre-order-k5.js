(function () {
  "use strict";
  // Nối app Kết: đặt URL vào đây. Lỗi mạng/404/khác 2xx => dự phòng FormSubmit.
  var PREORDER_ENDPOINT = "https://ket-app.vercel.app/api/pre-order";
  var MENU_ENDPOINT = "https://ket-app.vercel.app/api/menu?quan=K5";
  var MENU_FALLBACK = "data/menu-k5.json?v=20261031c";
  var THANKS = "pre-order-k5-thanh-cong.html";

  var form = document.getElementById("po-form");
  if (!form) return;
  var box = document.getElementById("po_menu"), totalEl = document.getElementById("po_total");
  var btn = document.getElementById("po_submit");
  var menu = [], qty = {};
  // Món tặng: mua 1 cocktail/mocktail tặng 1 món. Giá gốc lấy từ menu K5 theo mã (null = menu chưa có giá).
  var GIFTS = [
    { key: "wine", ten: "Wine", ma: "K5-077", nhan: "ly Vieux Papes Brut" },
    { key: "coconut", ten: "Coconut", ma: "K5-040" },
    { key: "soft", ten: "Soft Drink", ma: null },
    { key: "beer", ten: "Beer", ma: "K5-093", nhan: "Huda" },
    { key: "water", ten: "3 Bottles of Water", ma: null, x: 3 }
  ];
  var gq = {};
  var COCKTAIL_GROUPS = /cocktail|non-alcoholic|mocktail/i;
  var giftBox = document.getElementById("po_gifts"), giftCount = document.getElementById("po_gift_count"), giftHint = document.getElementById("po_gift_hint");
  function giftPrice(g) {
    if (!g.ma) return null;
    var m = menu.filter(function (x) { return x.ma === g.ma; })[0];
    return m && m.gia != null ? m.gia * (g.x || 1) : null;
  }
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
    giftBox.querySelectorAll('button[data-g="1"]').forEach(function (b) { b.disabled = t >= max; });
    giftCount.textContent = "Đã chọn " + t + "/" + max + " món tặng";
    giftHint.textContent = max ? (t < max ? "Bạn còn " + (max - t) + " món tặng có thể chọn." : "Đã đủ số món tặng.") : "Chọn cocktail hoặc mocktail ở trên để mở món tặng.";
  }
  giftBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-g]"); if (!b || b.disabled) return;
    var k = b.closest(".po-item").getAttribute("data-g-key"), d = Number(b.getAttribute("data-g"));
    if (d > 0 && giftTotal() >= cocktailQty()) return;
    gq[k] = Math.max(0, (gq[k] || 0) + d); syncGifts();
  });
  function giftData() {
    return GIFTS.filter(function (g) { return gq[g.key] > 0; }).map(function (g) { return { ten: g.ten, so_luong: gq[g.key], gia_goc: giftPrice(g), gia: 0 }; });
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
    }).filter(function (m) { return m.ma && m.ten; });
  }
  function render() {
    var groups = {}, order = [];
    menu.forEach(function (m) { if (!groups[m.nhom]) { groups[m.nhom] = []; order.push(m.nhom); } groups[m.nhom].push(m); });
    function html(list) { return list.map(function (g) {
      return '<details class="po-group"' + (g === list[0] ? " open" : "") + '><summary>' + esc(g) + ' <small>' + groups[g].length + '</small></summary>' +
        groups[g].map(function (m) {
          return '<div class="po-item" data-ma="' + esc(m.ma) + '"><div class="po-item-meta"><b>' + esc(m.ten) + '</b><span>' + (m.gia == null ? "Giá theo quán" : money(m.gia)) + '</span></div>' +
            '<div class="po-stepper"><button type="button" data-d="-1" aria-label="Bớt">−</button><output>0</output><button type="button" data-d="1" aria-label="Thêm">+</button></div></div>';
        }).join("") + '</details>';
    }).join(""); }
    var top = order.filter(function (g) { return COCKTAIL_GROUPS.test(g); });
    var rest = order.filter(function (g) { return !COCKTAIL_GROUPS.test(g); });
    document.getElementById("po_menu_top").innerHTML = html(top);
    box.innerHTML = html(rest);
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
    qty[ma] = q; row.querySelector("output").textContent = q; row.classList.toggle("is-picked", q > 0); updateTotal(); syncGifts();
  };
  box.addEventListener("click", poClick); document.getElementById("po_menu_top").addEventListener("click", poClick);
  getJSON(MENU_ENDPOINT).then(norm).then(function (m) { if (!m.length) throw 0; return m; })
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
  function val(id) { return (document.getElementById(id).value || "").trim(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function makeId() {
    var d = new Date(), s = "", c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (var i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
    return "PK5-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + s;
  }
  function phoneOk(p) { p = p.replace(/[\s.\-()]/g, "").replace(/^\+84/, "0").replace(/^84(?=\d{9}$)/, "0"); return /^0(3|5|7|8|9)\d{8}$/.test(p) ? p : null; }
  function fail(id, msg) { window.alert(msg); var el = document.getElementById(id); if (el) el.focus(); return false; }

  function fallback(data) {
    var add = function (k, v) { var i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; form.appendChild(i); };
    add("Mã đơn", data.id); add("Quán", "K5"); add("Tên khách", data.ten); add("SĐT", data.sdt); add("Email", data.email || "");
    add("Sự kiện", data.su_kien); add("Ngày giờ đến", data.ngay_gio_den); add("Số người", data.so_nguoi);
    add("Món", data.mon.map(function (m) { return m.so_luong + " × " + m.ten + " [" + m.ma + "]" + (m.gia != null ? " (" + money(m.gia) + ")" : ""); }).join("\n") || "(chưa chọn)");
    add("Món tặng", data.mon_tang.map(function (g) { return g.so_luong + " × " + g.ten + " (tặng, giá gốc " + (g.gia_goc != null ? money(g.gia_goc) : "chưa có") + " → 0đ)"; }).join("\n") || "(không)");
    add("Ghi chú", data.ghi_chu); add("JSON", JSON.stringify(data));
    form.submit();
  }

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
      mon: menu.filter(function (m) { return qty[m.ma] > 0; }).map(function (m) { return { ma: m.ma, ten: m.ten, so_luong: qty[m.ma], gia: m.gia }; }),
      mon_tang: giftData(),
      ghi_chu: val("po_ghichu")
    };
    btn.disabled = true; btn.textContent = "Đang gửi…";
    if (!PREORDER_ENDPOINT) return fallback(data);
    Promise.race([fetch(PREORDER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), timeout(8000)])
      .then(function (r) { if (!r.ok || r.redirected) throw new Error("HTTP " + r.status); location.href = THANKS + "?ma=" + encodeURIComponent(data.id); })
      .catch(function () { fallback(data); });
  });
})();
