(function () {
  "use strict";
  // Link cố định mỗi NCC: ncc-gia.html?ncc=<slug>. Ai mở cũng điền được, không mã, không mật khẩu, không captcha (anh Lan 20:45–20:49 04/11).
  // Đường gửi chính: Google Apps Script web app (ghi vào Google Sheet của Kết). Để trống = chỉ dùng nút Gửi qua Mail/Sao chép.
  var ENDPOINT = window.KET_FORM_ENDPOINT || "";
  var MAIL = "ketcocktail@gmail.com", LS = "ketNccGia2:", QUEUE = "ketNccGiaHang";
  // Link cũ ?t=/?token= (đã gửi ra, token đã lộ, anh Lan bỏ mã) → chuyển sang ?ncc=<slug>.
  var CU = {"3K1j5uS5CWDk6Ckj93N3Jk2l": "trai-cay", "7GJuEBH8PUIjilGtCDVnOzUq": "cho-snack", "Gz5xbvTtrIkssnaKRv9VpCq9y1wtuxF7": "online-cho-le", "J5y4rUZlgWftIdwxr5PUL2K5": "ruou-hai-gia-cat", "MeXqBX7NzcBLxJGCnxNlTq720KKgn4m1": "cho-snack", "XB8csaR7hFvBzlmNDshM22zFcz6u8Pv5": "ruou-hai-gia-cat", "dutleFgjiGzi0TJS14UcBJW8": "online-cho-le", "gSqouxt0u7BL6lZOsqOLURtZ": "bia", "lFqIvAUg3qzzNcSC9xAH1FsT": "hoa", "npCrsTBvbFKBr7XdvM56IwUg9yOpsh7A": "hoa", "qYu8kUP5LfI8ymGBYTmO1tJdBq8487Bd": "trai-cay", "swKvV5lGcMLScPw1yM6xkpbB": "vinamilk", "vynIWnYsTPqKBdarkAaW6OVsZ1OrHccO": "nuoc-ngot", "xf76ewqBfRzOvvlqRk6MP5qe": "nuoc-ngot", "zcx5tjaOyrqaXxM8qjJG8yzk": "syrup", "zxg1XkJ0vwKvWyKveY4YMh7R": "chi-hong-cho-han"};
  // Alias slug cũ → file canonical (data/ncc/ma-ncc.json)
  var ALIAS = {"bia-huda": "bia", "chi-hong": "chi-hong-cho-han", "cho-le": "online-cho-le", "hai-gia-cat": "ruou-hai-gia-cat"};
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search), oldTk = (q.get("t") || q.get("token") || "").trim();
  if (!q.get("ncc") && oldTk && CU[oldTk]) { location.replace(location.pathname + "?ncc=" + CU[oldTk]); return; }
  var slug = (q.get("ncc") || "").trim().toLowerCase();
  var fileSlug = ALIAS[slug] || slug;
  var data = null, items = [];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function fmt(d) { return d ? Number(d).toLocaleString("vi-VN") : ""; }
  function num(v) { if (v == null || v === "") return 0; if (typeof v === "number") return v > 0 ? Math.round(v) : 0; var d = String(v).replace(/[.,\s]|đ|vnd|₫/gi, ""); return /^\d+$/.test(d) ? +d : 0; }
  function vnDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : (s || ""); }
  function getJSON(u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); }
  function fail() { $("ncc-loading").hidden = true; $("ncc-error").hidden = false; $("ncc-error").dataset.kind = "generic"; }
  function failMissing() {
    $("ncc-loading").hidden = true; $("ncc-form").hidden = true;
    $("ncc-error").hidden = false; $("ncc-error").dataset.kind = "missing";
    $("ncc-error").querySelector("h2").textContent = "Chưa có bảng giá cho link này";
    $("ncc-error").querySelector("p").textContent = "Mã nhà cung cấp «" + esc(slug) + "» chưa có trên hệ thống (hoặc file chưa được đồng bộ). Anh/chị báo Kết Group (089 6789768) hoặc dùng link trong nhóm Zalo.";
  }
  function key(m) { return m.ma || String(m.ten).trim().toLowerCase(); }
  function lsGet(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // Giá cũ giữ ĐÚNG đơn vị lúc ghi giá (dvg), không đổi theo ô chọn đơn vị (anh Lan 13:37 05/11).
  function oldHtml(it) { return it.gia_cu ? 'Giá cũ: <b>' + fmt(it.gia_cu) + 'đ</b>' + (it.dvg ? '<span class="ncc-u">/' + esc(it.dvg) + '</span>' : '') + (it.ngay ? ' · <span class="ncc-ng">' + esc(vnDate(it.ngay)) + '</span>' : '') : '<span class="ncc-chua">«chưa có giá»</span>'; }
  var UNITS = ["kg", "g", "quả", "trái", "nải", "chai", "lon", "gói", "hộp", "cuộn", "lốc", "thùng", "bó", "cái", "lít", "ml"];
  function hang(it) { return !it.gia_cu ? 0 : (String(it.ngay || "").slice(0, 10) < cuoi30() ? 1 : 2); }

  // Giá cũ hiện ngay từ data/ncc/<slug>.json (Action làm mới mỗi 20 phút từ ket-app); Sheet (GET ENDPOINT) chỉ cập nhật ngầm sau.
  function fromFile(f) {
    var list = (f && f.mon) || [];
    if (!list.length && f && f.ncc && !f.chuyen_het) {
      data = { ncc: f.ncc, ma_ncc: f.ma_ncc || fileSlug, chuyen_het: "" }; items = []; return;
    }
    if (!list.length && !(f && f.ncc && f.chuyen_het)) throw "empty";
    data = { ncc: f.ncc || slug, ma_ncc: f.ma_ncc || fileSlug, chuyen_het: f.chuyen_het || "" };
    items = list.map(function (m) { return { ma: m.ma || "", ten: m.ten, dv: m.don_vi || m.dv || m.don_vi_sheet || m.don_vi_bo_sung || "", gia_cu: 0, ngay: "", nguon: "" }; }).map(function (it, i) {
      // Giá cũ: giá NCC gửi (form) vs giá kho (bảng giá/hoá đơn) — lấy ngày mới hơn; bằng ngày giữ giá NCC gửi.
      // Ứng viên: Sheet form (gia_sheet), API (gia), kho (gia_kho) — ngày mới nhất thắng; bằng ngày ưu tiên theo thứ tự này.
      var m = list[i], c = [[num(m.gia_sheet), m.ngay_sheet, "NCC báo"], [m.la_thu_thu ? 0 : num(m.gia), m.ngay, "NCC báo"], [num(m.gia_kho), m.ngay_kho, m.nguon_kho || "Bảng giá kho"]], b = null;
      c.forEach(function (x) { if (x[0] && (!b || String(x[1] || "") > String(b[1] || ""))) b = x; });
      if (b) { it.gia_cu = b[0]; it.ngay = b[1] || ""; it.nguon = b[2]; } else it.gia_cu = num(m.gia_ket_dang_ghi);
      it.dvg = (b === c[0] && m.don_vi_sheet) || it.dv; // đơn vị của giá cũ
      it.dvc = /^chanh(?! dây)/i.test(String(it.ten).trim()) ? "kg" : it.dv; // đơn vị mặc định ô chọn; chanh bán theo kg (anh Lan 13:36)
      return it; });
  }
  function sheetUpdate() {
    if (!ENDPOINT) return;
    getJSON(ENDPOINT + (ENDPOINT.indexOf("?") < 0 ? "?" : "&") + "form=ncc&ncc=" + encodeURIComponent(fileSlug)).then(function (s) {
      var by = {}; ((s && (s.items || s.mon)) || []).forEach(function (m) { if (m && (m.ma || m.ten)) by[key(m)] = m; });
      items.forEach(function (it, i) {
        var x = by[key(it)], g = x && num(x.gia_moi || x.gia); if (!g) return;
        var nd = String(x.ngay || x.gio_vn || x.thoi_gian || "").slice(0, 10); if (it.gia_cu && nd && nd < String(it.ngay || "")) return; // giá trong file mới hơn thì giữ
        it.gia_cu = g; it.ngay = nd || it.ngay; it.nguon = "NCC báo";
        if (x.don_vi) { it.dvg = String(x.don_vi); it.dvc = String(x.don_vi); if (!it.dv) it.dv = it.dvc; } // bản gửi mới nhất thắng: giá cũ theo đơn vị đã gửi, ô chọn mặc định đơn vị đó
        else if (!it.dvg) it.dvg = it.dv;
        var el = $("ncc-old-" + i); if (el) { el.innerHTML = oldHtml(it); el.className = "ncc-item-ket"; }
      });
      demGiaCu();
      var ae = document.activeElement, dangGo = ae && ae.classList && ae.classList.contains("ncc-price-input");
      if (!dangGo) { saveDraft(); sapXep(); render(); } // giá Sheet về sau → xếp lại (giữ giá đang nhập qua nháp)
    }).catch(function () {});
  }
  // Đếm lại MỌI món đang hiện giá cũ (file + Sheet, mọi ngày) — sửa lỗi 05/11 hộp chỉ đếm giá từ file.
  function demGiaCu() {
    var n = items.filter(function (it) { return it.gia_cu; }).length, el = $("ncc-last");
    if (n) { el.textContent = n + "/" + items.length + " món đã có giá cũ."; el.hidden = false; } else el.hidden = true;
  }
  // Thứ tự món (anh Lan 05/11): chưa có giá lên đầu → giá cũ hơn 30 ngày (cũ nhất trước) → giá mới; bằng nhau giữ thứ tự gốc.
  function cuoi30() { var d = new Date(Date.now() - 30 * 864e5); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function sapXep() {
    var c = cuoi30(), truoc = items.map(key).join("|");
    items = items.map(function (it, i) { var n = String(it.ngay || "").slice(0, 10), h = !it.gia_cu ? 0 : (n < c ? 1 : 2); return { it: it, h: h, n: n, i: i }; })
      .sort(function (a, b) { return a.h - b.h || (a.h === 1 && a.n !== b.n ? (a.n < b.n ? -1 : 1) : 0) || a.i - b.i; })
      .map(function (x) { return x.it; });
    return items.map(key).join("|") !== truoc;
  }
  function saveDraft() {
    var d = { name: $("f-name").value, note: $("f-note").value, gia: {} };
    document.querySelectorAll(".ncc-price-input").forEach(function (el) { var v = digits(el.value); if (v) d.gia[key(items[+el.dataset.i])] = v; });
    d.dv = {}; document.querySelectorAll(".ncc-dv").forEach(function (el) { var it = items[+el.dataset.i]; if (el.value !== it.dvc) d.dv[key(it)] = el.value; });
    lsSet(LS + slug, d);
  }
  function render() {
    var dr = lsGet(LS + slug, {});
    $("ncc-name").textContent = data.ncc;
    document.title = "Báo giá – " + data.ncc + " – Kết Group";
    $("ncc-items").innerHTML = items.map(function (it, i) {
      var v = (dr.gia || {})[key(it)] || "", h = hang(it), dv = (dr.dv || {})[key(it)] || it.dvc || "";
      var opts = UNITS.slice(); if (dv && opts.indexOf(dv) < 0) opts.unshift(dv); if (!dv) opts.unshift("");
      return '<li class="ncc-item ncc-st' + h + '"><p class="ncc-item-name">' + esc(it.ten) + ' <span class="ncc-badge">' + ["Chưa có giá", "Giá cũ >30 ngày", "Giá mới"][h] + '</span></p>' +
        '<p class="ncc-item-ket" id="ncc-old-' + i + '">' + oldHtml(it) + '</p>' +
        '<div class="ncc-row"><label class="ncc-price"><input class="field-control ncc-price-input" data-i="' + i + '" type="text" inputmode="numeric" autocomplete="off" placeholder="Giá mới" value="' + fmt(v) + '" aria-label="Giá mới ' + esc(it.ten) + '"><span>đ</span></label>' +
        '<label class="ncc-dv-wrap"><span>/</span><select class="ncc-dv" data-i="' + i + '" aria-label="Đơn vị ' + esc(it.ten) + '">' + opts.map(function (u) { return '<option' + (u === dv ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join("") + '</select></label></div></li>';
    }).join("") || (data.chuyen_het
      ? ('<li class="ncc-item inset-card"><p class="ncc-item-name">Các món của nhóm này đã chuyển sang trang <a href="ncc-gia.html?ncc=' + esc(String(data.chuyen_het)) + '">' + esc(String(data.chuyen_het)) + "</a>.</p></li>")
      : '<li class="ncc-item inset-card"><p class="ncc-item-name">Chưa có món — đang cập nhật</p><p class="ncc-item-ket">Kết sẽ bổ sung danh sách món sớm. Anh/chị có thể ghi chú bên dưới nếu cần.</p></li>');
    $("ncc-submit").hidden = !!(data.chuyen_het && !items.length);
    demGiaCu();
    if (dr.name) $("f-name").value = dr.name;
    if (dr.note) $("f-note").value = dr.note;
    $("ncc-loading").hidden = true; $("ncc-form").hidden = false;
  }
  function payload() {
    var out = [];
    document.querySelectorAll(".ncc-price-input").forEach(function (el) { var it = items[+el.dataset.i]; var u = document.querySelector('.ncc-dv[data-i="' + el.dataset.i + '"]'); out.push({ ma: it.ma, ten: it.ten, don_vi: (u && u.value) || it.dv, gia_cu: it.gia_cu || "", gia_moi: digits(el.value) ? +digits(el.value) : "" }); });
    return { form: "ncc", ncc: data.ncc, ma_ncc: data.ma_ncc, slug: fileSlug, nguoi: $("f-name").value.trim(), ghi_chu: $("f-note").value.trim(), thoi_gian: new Date().toLocaleString("vi-VN"), id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), items: out };
  }
  function text(p) {
    var ch = p.items.filter(function (x) { return x.gia_moi !== ""; });
    return "Báo giá " + p.ncc + (p.nguoi ? " – " + p.nguoi : "") + " – " + p.thoi_gian + "\n" +
      (ch.length ? ch.map(function (x) { return "• " + x.ten + (x.don_vi ? " (" + x.don_vi + ")" : "") + ": " + fmt(x.gia_moi) + "đ" + (x.gia_cu ? " (cũ " + fmt(x.gia_cu) + "đ)" : ""); }).join("\n") : "(Không đổi giá món nào)") +
      (p.ghi_chu ? "\nGhi chú: " + p.ghi_chu : "");
  }
  function fallback(p, why) {
    var t = text(p), subj = "Báo giá NVL – " + p.ncc + (p.nguoi ? " – " + p.nguoi : "");
    var mail = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(t);
    $("ncc-msg").innerHTML = (why ? esc(why) + " " : "") + "Bấm <b>Gửi qua ứng dụng Mail</b> (tới " + MAIL + "), hoặc <b>Sao chép</b> rồi dán vào nhóm Zalo với Kết.<br>" +
      '<a class="apply-submit ncc-fb" id="ncc-mail" href="' + esc(mail) + '">Gửi qua ứng dụng Mail</a>' +
      '<button type="button" class="apply-submit ncc-fb" id="ncc-copy">Sao chép nội dung</button>';
    $("ncc-copy").onclick = function () {
      var b = this, done = function () { b.textContent = "Đã chép ✓ – dán vào Zalo/Mail"; };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { prompt("Chép nội dung:", t); });
      else prompt("Chép nội dung:", t);
    };
  }
  // POST text/plain (không preflight). Lỗi CORS/mạng → thử no-cors. Thất bại → thử lại ở nền.
  function post(p) {
    var body = JSON.stringify(p), h = { "Content-Type": "text/plain;charset=utf-8" };
    return fetch(ENDPOINT, { method: "POST", headers: h, body: body, keepalive: body.length < 60000 })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text().then(function (s) { var j = null; try { j = JSON.parse(s); } catch (e) {} if (j && (j.ok === false || j.success === false)) throw new Error(j.error || "lỗi"); }); },
        function (e) { if (e instanceof TypeError) return fetch(ENDPOINT, { method: "POST", mode: "no-cors", headers: h, body: body }).then(function () {}); throw e; });
  }
  function queue() { return lsGet(QUEUE, []); }
  function unqueue(id) { lsSet(QUEUE, queue().filter(function (x) { return x.id !== id; })); }
  var WAIT = [3000, 10000, 30000, 60000];
  function deliver(p, tries, onFail) {
    post(p).then(function () { unqueue(p.id); }, function (err) {
      if (tries < WAIT.length) return setTimeout(function () { deliver(p, tries + 1, onFail); }, WAIT[tries]);
      if (onFail) onFail(p, err);
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) return fail();
    getJSON("data/ncc/" + fileSlug + ".json").then(function (f) { fromFile(f); sapXep(); render(); sheetUpdate(); }).catch(function (st) { if (st === 404) failMissing(); else fail(); });
    // Bản chưa gửi được lần trước (mất mạng, đóng trang) → gửi lại ngầm.
    if (ENDPOINT) queue().forEach(function (p) { deliver(p, WAIT.length - 1, null); });
    $("ncc-form").addEventListener("input", function (e) {
      if (e.target.classList.contains("ncc-price-input")) e.target.value = fmt(digits(e.target.value).slice(0, 12));
      saveDraft();
    });
    $("ncc-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var p = payload(), n = p.items.filter(function (x) { return x.gia_moi !== ""; }).length;
      if (!n && !p.ghi_chu) { $("ncc-msg").textContent = "Anh/chị ghi giá mới cho ít nhất 1 món (hoặc ghi chú) rồi bấm Gửi."; return; }
      saveDraft();
      if (!ENDPOINT) return fallback(p, "");
      lsSet(QUEUE, queue().concat([p]));
      $("ncc-submit").textContent = "Đã gửi ✓"; $("ncc-msg").textContent = "✅ Đã gửi " + n + " giá. Cảm ơn anh/chị!";
      lsSet(LS + slug, null);
      deliver(p, 0, function (pp, err) { $("ncc-submit").textContent = "Gửi"; fallback(pp, "Mạng lỗi, chưa gửi được (" + ((err && err.message) || "lỗi mạng") + ")."); });
    });
  });
})();
