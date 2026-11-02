(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var t = (new URLSearchParams(location.search).get("t") || "").trim();
  var data = null;
  function fail() { $("ncc-loading").hidden = true; $("ncc-error").hidden = false; }
  if (!/^[A-Za-z0-9]{16,64}$/.test(t)) { document.addEventListener("DOMContentLoaded", fail); return; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function fmt(d) { return d ? Number(d).toLocaleString("vi-VN") : ""; }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function splitQC(q) { var i = q.indexOf("("); return i > 0 ? [q.slice(0, i).trim(), q.slice(i + 1).replace(/\)\s*$/, "").trim()] : [q, ""]; }
  function render() {
    $("ncc-name").textContent = data.ncc;
    $("f-ncc").value = data.ncc;
    $("f-subject").value = "Báo giá NVL – " + data.ncc;
    $("ncc-total").textContent = data.items.length;
    $("ncc-items").innerHTML = data.items.map(function (it, i) {
      return '<li class="ncc-item inset-card"><div class="ncc-item-head"><span class="ncc-no">' + (i + 1) + '</span><div><p class="ncc-item-name">' + esc(it.ten) +
        '</p><p class="ncc-item-qc">' + esc(it.quy_cach) + '</p>' + (it.gia ? '<p class="ncc-item-ket">Giá Kết đang ghi: ' + fmt(it.gia) + 'đ/' + esc(it.dv || "") + ' (' + esc(it.ngay || "") + ')' + (it.chua_chac ? ' – đọc chưa chắc' : '') + '</p>' : '<p class="ncc-item-ket ncc-missing">Chưa có giá</p>') + '</div></div>' +
        '<label class="ncc-price"><input class="field-control ncc-price-input" data-i="' + i + '" type="text" inputmode="numeric" pattern="[0-9.]*" autocomplete="off" placeholder="Đơn giá" value="' + (it.gia ? fmt(it.gia) : '') + '" aria-label="Đơn giá ' + esc(it.ten) + '"><span>đ</span></label>' +
        '<input class="field-control ncc-note" data-i="' + i + '" type="text" placeholder="Ghi chú (quy cách, hãng, «không có»…)" aria-label="Ghi chú ' + esc(it.ten) + '"></li>';
    }).join("");
    $("ncc-loading").hidden = true; $("ncc-form").hidden = false;
  }
  function count() { var n = 0; document.querySelectorAll(".ncc-price-input").forEach(function (el) { if (digits(el.value)) n++; }); $("ncc-done").textContent = n; return n; }
  document.addEventListener("DOMContentLoaded", function () {
    fetch("data/ncc/" + t + ".json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { data = j; render(); }).catch(fail);
    var form = $("ncc-form");
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("ncc-price-input")) { var d = digits(e.target.value).slice(0, 12); e.target.value = fmt(d); count(); }
    });
    form.addEventListener("submit", function (e) {
      var msg = $("ncc-msg"); msg.textContent = "";
      var n = count();
      if (!$("f-name").value.trim()) { e.preventDefault(); msg.textContent = "Anh/chị điền giúp tên người báo giá."; $("f-name").focus(); return; }
      var notes = document.querySelectorAll(".ncc-note"), prices = document.querySelectorAll(".ncc-price-input");
      var hasNote = Array.prototype.some.call(notes, function (x) { return x.value.trim(); });
      if (!n && !hasNote) { e.preventDefault(); msg.textContent = "Anh/chị điền ít nhất một đơn giá hoặc ghi chú."; return; }
      var now = new Date(), pad = function (x) { return ("0" + x).slice(-2); };
      var ts = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
      var who = $("f-name").value.trim() + ($("f-phone").value.trim() ? " (" + $("f-phone").value.trim() + ")" : "");
      var vat = $("f-vat").value;
      var rows = [["ncc", "ma", "ten_mon", "quy_cach", "don_vi", "don_gia", "gia_ket_dang_ghi", "trang_thai", "ghi_chu", "nguoi_bao_gia", "thoi_gian"]];
      var changed = [];
      data.items.forEach(function (it, i) {
        var qc = splitQC(it.quy_cach), note = notes[i].value.trim();
        if (vat) note = note ? note + "; " + vat : vat;
        var v = digits(prices[i].value), old = it.gia ? String(Math.round(it.gia)) : "", st;
        if (old) st = !v ? "NCC XOÁ GIÁ" : (v === old ? "giữ nguyên" : "NCC SỬA");
        else st = v ? "NCC ĐIỀN MỚI" : "chưa có giá";
        if (st !== "giữ nguyên" && st !== "chưa có giá") changed.push(it.ten + ": " + (old ? fmt(old) : "trống") + " → " + (v ? fmt(v) : "xoá"));
        rows.push([data.ncc, it.ma, it.ten, qc[1] || qc[0], it.dv || qc[0], v, old, st, note, who, ts]);
      });
      var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
      $("f-csv").value = csv; $("f-changed").value = changed.length ? changed.join("\n") : "Không sửa giá nào (giữ nguyên giá Kết đang ghi)"; $("f-count").value = n + "/" + data.items.length; $("f-time").value = ts;
      try {
        var file = new File(["\uFEFF" + csv], "bao-gia-" + data.ma_ncc + "-" + ts.replace(/\D/g, "") + ".csv", { type: "text/csv" });
        var dt = new DataTransfer(); dt.items.add(file); $("f-file").files = dt.files;
      } catch (err) { $("f-file").disabled = true; }
      prices.forEach(function (x) { x.removeAttribute("name"); }); notes.forEach(function (x) { x.removeAttribute("name"); });
      $("ncc-submit").disabled = true; $("ncc-submit").textContent = "Đang gửi…";
    });
  });
})();
