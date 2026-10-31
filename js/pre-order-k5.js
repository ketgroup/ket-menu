(function () {
  "use strict";
  // Nối app Kết: đặt URL vào đây. Lỗi mạng/404/khác 2xx => dự phòng FormSubmit.
  var PREORDER_ENDPOINT = "https://ket-app.vercel.app/api/pre-order";
  var MENU_ENDPOINT = "https://ket-app.vercel.app/api/menu?quan=K5";
  var MENU_FALLBACK = "data/menu-k5.json?v=20261031a";
  var THANKS = "pre-order-k5-thanh-cong.html";

  var form = document.getElementById("po-form");
  if (!form) return;
  var box = document.getElementById("po_menu"), totalEl = document.getElementById("po_total");
  var btn = document.getElementById("po_submit");
  var menu = [], qty = {};

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
    box.innerHTML = order.map(function (g) {
      return '<details class="po-group"' + (g === order[0] ? " open" : "") + '><summary>' + esc(g) + ' <small>' + groups[g].length + '</small></summary>' +
        groups[g].map(function (m) {
          return '<div class="po-item" data-ma="' + esc(m.ma) + '"><div class="po-item-meta"><b>' + esc(m.ten) + '</b><span>' + (m.gia == null ? "Giá theo quán" : money(m.gia)) + '</span></div>' +
            '<div class="po-stepper"><button type="button" data-d="-1" aria-label="Bớt">−</button><output>0</output><button type="button" data-d="1" aria-label="Thêm">+</button></div></div>';
        }).join("") + '</details>';
    }).join("");
  }
  function updateTotal() {
    var n = 0, sum = 0, unknown = false;
    menu.forEach(function (m) { var q = qty[m.ma] || 0; if (q) { n += q; if (m.gia == null) unknown = true; else sum += q * m.gia; } });
    totalEl.textContent = n ? (n + " món · tạm tính " + money(sum) + (unknown ? " + món giá theo quán" : "")) : "Chưa chọn món";
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-d]"); if (!b) return;
    var row = b.closest(".po-item"), ma = row.getAttribute("data-ma");
    var q = Math.max(0, Math.min(99, (qty[ma] || 0) + Number(b.getAttribute("data-d"))));
    qty[ma] = q; row.querySelector("output").textContent = q; row.classList.toggle("is-picked", q > 0); updateTotal();
  });
  getJSON(MENU_ENDPOINT).then(norm).then(function (m) { if (!m.length) throw 0; return m; })
    .catch(function () { return getJSON(MENU_FALLBACK).then(norm); })
    .then(function (m) { menu = m; render(); updateTotal(); })
    .catch(function () { box.innerHTML = '<p class="po-loading">Không tải được menu, bạn ghi món vào ô Ghi chú nhé.</p>'; });

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
    add("Đồng ý nhận KM", data.dong_y_km ? "Có" : "Không"); add("Ngày giờ đến", data.ngay_gio_den); add("Số người", data.so_nguoi);
    add("Món", data.mon.map(function (m) { return m.so_luong + " × " + m.ten + " [" + m.ma + "]" + (m.gia != null ? " (" + money(m.gia) + ")" : ""); }).join("\n") || "(chưa chọn)");
    add("Ghi chú", data.ghi_chu); add("JSON", JSON.stringify(data));
    form.submit();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form._honey && form._honey.value) return;
    var ten = val("po_ten"), sdt = phoneOk(val("po_sdt")), email = val("po_email"), den = val("po_den"), nguoi = parseInt(val("po_nguoi"), 10);
    if (!ten) return fail("po_ten", "Vui lòng nhập tên.");
    if (!sdt) return fail("po_sdt", "Số điện thoại chưa đúng (VD 0896789768).");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("po_email", "Email chưa đúng.");
    if (!den) return fail("po_den", "Vui lòng chọn ngày giờ đến.");
    if (!(nguoi >= 1)) return fail("po_nguoi", "Số người tối thiểu là 1.");
    var data = {
      id: makeId(), tao_luc: new Date().toISOString(), quan: "K5", ten: ten, sdt: sdt, email: email,
      dong_y_km: document.getElementById("po_km").checked, ngay_gio_den: den, so_nguoi: nguoi,
      mon: menu.filter(function (m) { return qty[m.ma] > 0; }).map(function (m) { return { ma: m.ma, ten: m.ten, so_luong: qty[m.ma], gia: m.gia }; }),
      ghi_chu: val("po_ghichu")
    };
    btn.disabled = true; btn.textContent = "Đang gửi…";
    if (!PREORDER_ENDPOINT) return fallback(data);
    Promise.race([fetch(PREORDER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), timeout(8000)])
      .then(function (r) { if (!r.ok || r.redirected) throw new Error("HTTP " + r.status); location.href = THANKS + "?ma=" + encodeURIComponent(data.id); })
      .catch(function () { fallback(data); });
  });
})();
