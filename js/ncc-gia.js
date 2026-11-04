(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var t = (new URLSearchParams(location.search).get("t") || "").trim();
  // API App Kết trả danh sách món + giá NCC gửi gần nhất (không để giá trong repo public). Đổi địa chỉ ở đây.
  var API_BASE = "https://ket-app.vercel.app/api/ncc/gia-gan-nhat", API_PARAM = "token", API_TIMEOUT = 6000;
  var data = null, base = [], lastVat = "", lastDate = "", lastNote = "", viaApi = false, LS = "ketNccGia:";
  function fail() { $("ncc-loading").hidden = true; $("ncc-error").hidden = false; }
  if (!/^[A-Za-z0-9]{16,64}$/.test(t)) { document.addEventListener("DOMContentLoaded", fail); return; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function fmt(d) { return d ? Number(d).toLocaleString("vi-VN") : ""; }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function splitQC(q) { var i = q.indexOf("("); return i > 0 ? [q.slice(0, i).trim(), q.slice(i + 1).replace(/\)\s*$/, "").trim()] : [q, ""]; }
  function norm(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); }
  // "2026-11-03" | "2026-11-03 10:11" → "03/11/2026" (+ giờ)
  function vnDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(s || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] + (m[4] ? " " + m[4] : "") : (s || ""); }
  function getJSON(u, opt) { return fetch(u, opt || { cache: "no-store" }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); }
  function sha16(s) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve("");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("").slice(0, 16);
    }).catch(function () { return ""; });
  }
  function getApi() {
    var ctl = window.AbortController ? new AbortController() : null, timer;
    var p = getJSON(API_BASE + "?" + API_PARAM + "=" + encodeURIComponent(t), { cache: "no-store", mode: "cors", credentials: "omit", signal: ctl ? ctl.signal : undefined });
    var to = new Promise(function (_, rej) { timer = setTimeout(function () { if (ctl) ctl.abort(); rej("timeout"); }, API_TIMEOUT); });
    return Promise.race([p, to]).then(function (j) {
      clearTimeout(timer);
      var d = fromApi(j);
      if (!d) throw "bad";
      return d;
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function slug(s) { return String(s || "ncc").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  // Chuyển đổi mềm định dạng API → dạng trang dùng (chấp nhận tên trường gần giống, vì App chưa chốt).
  function pick(o, keys) { if (!o || typeof o !== "object") return undefined; for (var i = 0; i < keys.length; i++) if (o[keys[i]] != null && o[keys[i]] !== "") return o[keys[i]]; return undefined; }
  function str(v) { return v == null ? "" : (typeof v === "object" ? String(pick(v, ["ten", "name", "label"]) || "") : String(v)); }
  function num(v) { if (v == null || v === "") return null; if (typeof v === "number") return isFinite(v) && v > 0 ? Math.round(v) : null; var d = String(v).replace(/[.,\s]/g, "").replace(/đ|vnd|₫/gi, ""); return /^\d+$/.test(d) && +d > 0 ? +d : null; }
  function day(v) { v = str(v); var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v); return m ? m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2) : v.replace("T", " ").slice(0, 16); }
  var K = {
    root: ["data", "result", "ket_qua"], ncc: ["ncc", "ten_ncc", "nha_cung_cap", "ten", "name", "supplier"], ma_ncc: ["ma_ncc", "slug", "code"],
    list: ["mon", "items", "mat_hang", "danh_sach", "ds_mon", "mons", "rows"], ngay: ["ngay_bao_gan_nhat", "ngay_gui", "ngay_bao", "lan_gui", "ngay", "updated_at"],
    vat: ["vat", "VAT", "thue", "vat_note"], ten: ["ten", "ten_mon", "mon", "name", "ten_hang", "mat_hang"], ma: ["ma", "ma_mon", "ma_hang", "code", "sku", "id"],
    dv: ["don_vi", "dv", "dvt", "unit"], qc: ["quy_cach", "qc", "spec"], gia: ["gia", "don_gia", "gia_gan_nhat", "gia_ncc", "price", "gia_cu"],
    mngay: ["ngay", "ngay_gui", "ngay_bao", "date", "updated_at"], note: ["ghi_chu", "note", "ghichu"],
    vatChu: ["vat_chu", "vat_text", "vat_label"], test: ["la_thu_thu", "test", "is_test"], sai: ["nghi_sai", "canh_bao", "nghi_ngo", "warning"],
    tt: ["trang_thai", "status"]
  };
  var VATS = ["Giá đã gồm VAT", "Giá chưa gồm VAT", "Không xuất hoá đơn VAT"];
  // Nhận cả mã (da_gom_vat, chua_gom, khong_xuat…) lẫn chữ gốc; «khong_ro» → trống.
  function vatText(v) {
    var x = str(v).trim(); if (!x) return "";
    var k = x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z]+/g, "_");
    if (/khong_ro|unknown/.test(k)) return "";
    if (/chua_gom|chua_bao_gom|chua_co_vat|chua_vat|excl/.test(k)) return VATS[1];
    if (/khong_xuat|khong_hoa_don|khong_vat|khong_co_vat|no_vat/.test(k)) return VATS[2];
    if (/da_gom|da_bao_gom|gom_vat|co_vat|incl/.test(k)) return VATS[0];
    return x;
  }
  function truthy(v) { return v === true || v === 1 || /^(1|true|co|yes)$/i.test(str(v)); }
  function fromApi(j) {
    var r = j, w = pick(j, K.root); if (w && typeof w === "object" && !Array.isArray(w)) r = w;
    var list = Array.isArray(r) ? r : pick(r, K.list), nccName = Array.isArray(r) ? "" : str(pick(r, K.ncc));
    if (!Array.isArray(list) || !list.length) return null;
    var items = [], prevMon = [];
    // Thư thử (la_thu_thu) hoặc NCC «chua_gui» → không điền sẵn giá.
    var rootTest = !Array.isArray(r) && (truthy(pick(r, K.test)) || /chua_gui/i.test(str(pick(r, K.tt))));
    var rootVat = Array.isArray(r) ? "" : (vatText(pick(r, K.vatChu)) || vatText(pick(r, K.vat)));
    list.forEach(function (m) {
      var ten = str(pick(m, K.ten)); if (!ten) return;
      var dv = str(pick(m, K.dv)), gia = num(pick(m, K.gia));
      items.push({ ma: str(pick(m, K.ma)), ten: ten, quy_cach: str(pick(m, K.qc)) || dv, dv: dv });
      if (gia && !rootTest && !truthy(pick(m, K.test))) {
        var sai = pick(m, K.sai);
        prevMon.push({ ma: str(pick(m, K.ma)), ten: ten, don_vi: dv, gia: gia, ngay: day(pick(m, K.mngay)), vat: vatText(pick(m, K.vatChu)) || vatText(pick(m, K.vat)),
          ghi_chu: str(pick(m, K.note)), nghi_sai: sai === true || (sai && str(sai)) ? true : false });
      }
    });
    if (!items.length || !nccName) return null;
    return { ncc: nccName, ma_ncc: str(pick(r, K.ma_ncc)) || slug(nccName), items: items,
      prev: { ngay_bao_gan_nhat: rootTest ? "" : day(pick(r, K.ngay)), vat: rootTest ? "" : rootVat, ghi_chu: rootTest ? "" : str(pick(r, K.note)), mon: prevMon } };
  }
  function loadLocal() { try { return JSON.parse(localStorage.getItem(LS + t) || "null"); } catch (e) { return null; } }

  // Giá cũ mỗi món, ưu tiên: lần gửi gần nhất của NCC (file Kho xuất, hoặc bản lưu trên máy NCC nếu mới hơn) → giá Kết đang ghi → trống.
  function buildBase(prev, local) {
    var byMa = {}, byTen = {};
    ((prev && prev.mon) || []).forEach(function (m) { if (m.ma) byMa[m.ma] = m; byTen[norm(m.ten)] = m; });
    lastVat = (prev && prev.vat) || ""; lastDate = (prev && prev.ngay_bao_gan_nhat) || "";
    lastNote = (prev && prev.ghi_chu) || "";
    var useLocal = local && local.thoi_gian && local.thoi_gian.slice(0, 10) >= (lastDate || "0");
    if (useLocal) { lastVat = local.vat || lastVat; lastDate = local.thoi_gian; }
    base = data.items.map(function (it) {
      var key = it.ma || norm(it.ten), lm = useLocal && local.items && local.items[key];
      if (lm && (lm.gia || lm.ghi_chu)) return { gia: lm.gia ? String(lm.gia) : "", ngay: local.thoi_gian, vat: local.vat || "", note: lm.ghi_chu || "", src: "ncc" };
      var m = (it.ma && byMa[it.ma]) || byTen[norm(it.ten)];
      if (m && m.gia) return { gia: String(Math.round(m.gia)), ngay: m.ngay || lastDate, vat: m.vat || lastVat, note: m.ghi_chu || "", dv: m.don_vi, sai: !!m.nghi_sai, src: "ncc" };
      // Dự phòng (API lỗi): file danh sách món cũ, KHÔNG điền giá; «giá Kết đang ghi» chỉ hiện để tham khảo.
      if (it.gia) return { gia: "", ref: String(Math.round(it.gia)), ngay: it.ngay || "", vat: "", note: "", src: "ket" };
      return { gia: "", ngay: "", vat: "", note: "", src: "" };
    });
  }
  function oldLine(b, it) {
    if (b.src === "ncc") return '<p class="ncc-item-ket ncc-prev">Anh/chị gửi lần trước: <b>' + fmt(b.gia) + 'đ</b>' + (b.dv || it.dv ? '/' + esc(b.dv || it.dv) : '') + ' · ' + esc(vnDate(b.ngay)) +
      '<span class="ncc-vat-tag">' + esc(b.vat || "VAT: chưa ghi") + '</span></p>' +
      (b.sai ? '<p class="ncc-warn">⚠️ Giá này có thể sai, nhờ anh/chị kiểm lại.</p>' : '');
    if (b.src === "ket") return '<p class="ncc-item-ket">Giá Kết đang ghi (tham khảo): ' + fmt(b.ref) + 'đ/' + esc(it.dv || "") + ' (' + esc(it.ngay || "") + ')' + (it.chua_chac ? ' – đọc chưa chắc' : '') + ' – anh/chị điền giá hiện tại</p>';
    return '<p class="ncc-item-ket ncc-missing">Chưa có giá</p>';
  }
  function render() {
    $("ncc-name").textContent = data.ncc;
    $("f-ncc").value = data.ncc;
    $("f-subject").value = "Báo giá NVL – " + data.ncc;
    $("ncc-total").textContent = data.items.length;
    $("ncc-items").innerHTML = data.items.map(function (it, i) {
      var b = base[i];
      return '<li class="ncc-item inset-card" id="ncc-it-' + i + '"><div class="ncc-item-head"><span class="ncc-no">' + (i + 1) + '</span><div><p class="ncc-item-name">' + esc(it.ten) +
        '</p><p class="ncc-item-qc">' + esc(it.quy_cach) + '</p>' + oldLine(b, it) + '</div></div>' +
        '<label class="ncc-price"><input class="field-control ncc-price-input" data-i="' + i + '" type="text" inputmode="numeric" pattern="[0-9.]*" autocomplete="off" placeholder="Đơn giá" value="' + fmt(b.gia) + '" aria-label="Đơn giá ' + esc(it.ten) + '"><span>đ</span></label>' +
        '<p class="ncc-edited" id="ncc-ed-' + i + '" hidden></p>' +
        '<input class="field-control ncc-note" data-i="' + i + '" type="text" value="' + esc(b.note) + '" placeholder="Ghi chú (quy cách, hãng, «không có»…)" aria-label="Ghi chú ' + esc(it.ten) + '"></li>';
    }).join("");
    var nOld = base.filter(function (b) { return b.src === "ncc"; }).length;
    if (nOld) {
      $("ncc-last").innerHTML = "Lần gửi gần nhất: <b>" + esc(vnDate(lastDate)) + "</b> · " + nOld + " món có giá" + (lastVat ? " · " + esc(lastVat) : "") + ". Món nào đổi giá thì sửa, còn lại giữ nguyên.";
      $("ncc-last").hidden = false;
    }
    if (base.some(function (b) { return b.gia; })) $("ncc-confirm-box").hidden = false;
    if (lastVat) { $("f-vat").value = lastVat; $("ncc-vat-prev").textContent = "Lần trước: " + lastVat; $("ncc-vat-prev").hidden = false; }
    if (lastNote && !$("f-note").value) $("f-note").value = lastNote;
    var lc = loadLocal();
    if (lc) { if (lc.name && !$("f-name").value) $("f-name").value = lc.name; if (lc.phone && !$("f-phone").value) $("f-phone").value = lc.phone; }
    count();
    $("ncc-loading").hidden = true; $("ncc-form").hidden = false;
  }
  function count() {
    var n = 0, ed = 0;
    document.querySelectorAll(".ncc-price-input").forEach(function (el) {
      var i = +el.dataset.i, v = digits(el.value), b = base[i];
      if (v) n++;
      var changed = v !== (b.gia || "");
      var box = $("ncc-ed-" + i);
      $("ncc-it-" + i).classList.toggle("is-edited", changed);
      if (changed) { ed++; box.textContent = "✏️ Đã sửa: " + (b.gia ? fmt(b.gia) : "trống") + " → " + (v ? fmt(v) : "xoá giá"); box.hidden = false; }
      else box.hidden = true;
    });
    $("ncc-done").textContent = n;
    $("ncc-edcount").textContent = ed ? " · ✏️ " + ed + " món đã sửa" : "";
    return n;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var form = $("ncc-form"), mode = "thuong";
    getApi().then(function (d) { viaApi = true; return [d, d.prev]; }, function () {
      // Dự phòng (API lỗi/timeout): file data/ncc/<sha256(token) 16 hex>.json (token mới, repo không chứa token), nếu không có thì data/ncc/<token>.json (kiểu cũ).
      // File định dạng API (Action lam-moi-ncc làm mới) → điền giá như API; file kiểu cũ (items) → không điền giá.
      function useFile(d) {
        var a = fromApi(d); if (a) return [a, a.prev];
        d.items = (d.items || []).map(function (it) { return { ma: it.ma || "", ten: it.ten, quy_cach: it.quy_cach || it.don_vi || "", dv: it.don_vi || it.dv || "", gia: it.gia, ngay: it.ngay, chua_chac: it.chua_chac }; });
        return [d, null];
      }
      function byToken() { return getJSON("data/ncc/" + t + ".json"); }
      return sha16(t).then(function (h) { return h ? getJSON("data/ncc/" + h + ".json").catch(byToken) : byToken(); }).then(useFile);
    }).then(function (r) { data = r[0]; buildBase(r[1], loadLocal()); render(); }).catch(fail);

    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("ncc-price-input")) { var d = digits(e.target.value).slice(0, 12); e.target.value = fmt(d); count(); }
    });
    $("ncc-confirm").addEventListener("click", function () {
      var msg = $("ncc-msg"); msg.textContent = "";
      var ed = document.querySelectorAll(".ncc-item.is-edited").length;
      if (ed && !confirm("Anh/chị đã sửa " + ed + " món. Bấm OK sẽ bỏ các sửa này và gửi lại toàn bộ giá cũ. Tiếp tục?")) return;
      document.querySelectorAll(".ncc-price-input").forEach(function (el) { el.value = fmt(base[+el.dataset.i].gia); });
      document.querySelectorAll(".ncc-note").forEach(function (el) { el.value = base[+el.dataset.i].note; });
      if (lastVat) $("f-vat").value = lastVat;
      count();
      if (!$("f-name").value.trim()) { msg.textContent = "Anh/chị điền giúp tên người báo giá (cuối trang) rồi bấm lại nút ✅."; $("f-name").focus(); return; }
      mode = "xac_nhan";
      if (form.requestSubmit) form.requestSubmit(); else if (form.dispatchEvent(new Event("submit", { cancelable: true }))) form.submit();
    });
    form.addEventListener("submit", function (e) {
      var confirmAll = mode === "xac_nhan"; mode = "thuong";
      var msg = $("ncc-msg"); msg.textContent = "";
      var n = count();
      if (!$("f-name").value.trim()) { e.preventDefault(); msg.textContent = "Anh/chị điền giúp tên người báo giá."; $("f-name").focus(); return; }
      var notes = document.querySelectorAll(".ncc-note"), prices = document.querySelectorAll(".ncc-price-input");
      var hasNote = Array.prototype.some.call(notes, function (x) { return x.value.trim(); });
      if (!n && !hasNote) { e.preventDefault(); msg.textContent = "Anh/chị điền ít nhất một đơn giá hoặc ghi chú."; return; }
      var now = new Date(), pad = function (x) { return ("0" + x).slice(-2); };
      var ts = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
      var name = $("f-name").value.trim(), phone = $("f-phone").value.trim();
      var who = name + (phone ? " (" + phone + ")" : "");
      var vat = $("f-vat").value;
      var rows = [["ncc", "ma", "ten_mon", "quy_cach", "don_vi", "don_gia", "da_sua", "gia_cu", "ngay_gia_cu", "nguon_gia_cu", "trang_thai", "vat", "ghi_chu", "gia_ket_dang_ghi", "nguoi_bao_gia", "thoi_gian", "gia_khong_doi"]];
      var changed = [], nEd = 0, local = { thoi_gian: ts, vat: vat, name: name, phone: phone, items: {} };
      data.items.forEach(function (it, i) {
        var b = base[i], qc = splitQC(it.quy_cach), note = notes[i].value.trim();
        var v = digits(prices[i].value), old = b.gia || "", st, mark = "";
        if (old) st = !v ? "NCC XOÁ GIÁ" : (v === old ? (confirmAll ? "xác nhận không đổi" : "giữ nguyên") : "NCC SỬA");
        else st = v ? "NCC ĐIỀN MỚI" : "chưa có giá";
        if (v !== old) { mark = "✏️"; nEd++; changed.push("✏️ " + it.ten + ": " + (old ? fmt(old) + (b.ngay ? " (" + vnDate(b.ngay) + ")" : "") : "trống") + " → " + (v ? fmt(v) : "xoá")); }
        else if (note !== (b.note || "")) { mark = "✏️ ghi chú"; st += ", sửa ghi chú"; }
        var src = b.src === "ncc" ? "NCC gửi" : "";
        rows.push([data.ncc, it.ma, it.ten, qc[1] || qc[0], it.dv || qc[0], v, mark, old, old && b.ngay ? vnDate(b.ngay) : "", src, st, vat, note, it.gia ? String(Math.round(it.gia)) : "", who, ts, confirmAll ? "1" : "0"]);
        if (v || note) local.items[it.ma || norm(it.ten)] = { gia: v ? +v : 0, ghi_chu: note };
      });
      if (lastVat && vat !== lastVat) changed.push("✏️ VAT: " + lastVat + " → " + (vat || "bỏ trống"));
      var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
      $("f-csv").value = csv;
      $("f-changed").value = confirmAll ? "✅ Giá không đổi – NCC xác nhận lại toàn bộ " + n + " giá cũ ngày " + vnDate(ts)
        : (changed.length ? changed.join("\n") : "Không sửa giá nào (giữ nguyên giá cũ)");
      $("f-nedit").value = confirmAll ? "0" : String(nEd);
      $("f-nochange").value = confirmAll ? "1" : "0";
      $("f-count").value = n + "/" + data.items.length; $("f-time").value = ts;
      try {
        var file = new File(["\uFEFF" + csv], "bao-gia-" + data.ma_ncc + "-" + ts.replace(/\D/g, "") + ".csv", { type: "text/csv" });
        var dt = new DataTransfer(); dt.items.add(file); $("f-file").files = dt.files;
      } catch (err) { $("f-file").disabled = true; }
      try { localStorage.setItem(LS + t, JSON.stringify(local)); } catch (err) {}
      prices.forEach(function (x) { x.removeAttribute("name"); }); notes.forEach(function (x) { x.removeAttribute("name"); });
      $("ncc-submit").disabled = true; $("ncc-confirm").disabled = true;
      (confirmAll ? $("ncc-confirm") : $("ncc-submit")).textContent = "Đang gửi…";
    });
  });
})();
