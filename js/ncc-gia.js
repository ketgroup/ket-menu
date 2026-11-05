(function () {
  "use strict";
  // Link cố định mỗi NCC: ncc-gia.html?ncc=<slug>. Ai mở cũng điền được, không mã, không mật khẩu, không captcha (anh Lan 20:45–20:49 04/11).
  // Đường gửi chính: Google Apps Script web app (ghi vào Google Sheet của Kết). Để trống = chỉ dùng nút Gửi qua Mail/Sao chép.
  var ENDPOINT = window.KET_FORM_ENDPOINT || "";
  var MAIL = "ketcocktail@gmail.com", LS = "ketNccGia2:", QUEUE = "ketNccGiaHang";
  // Link cũ ?t=/?token= (đã gửi ra, token đã lộ, anh Lan bỏ mã) → chuyển sang ?ncc=<slug>.
  var CU = {"3K1j5uS5CWDk6Ckj93N3Jk2l": "trai-cay", "7GJuEBH8PUIjilGtCDVnOzUq": "cho-snack", "Gz5xbvTtrIkssnaKRv9VpCq9y1wtuxF7": "cho-le", "J5y4rUZlgWftIdwxr5PUL2K5": "hai-gia-cat", "MeXqBX7NzcBLxJGCnxNlTq720KKgn4m1": "cho-snack", "XB8csaR7hFvBzlmNDshM22zFcz6u8Pv5": "hai-gia-cat", "dutleFgjiGzi0TJS14UcBJW8": "cho-le", "gSqouxt0u7BL6lZOsqOLURtZ": "bia-huda", "lFqIvAUg3qzzNcSC9xAH1FsT": "hoa", "npCrsTBvbFKBr7XdvM56IwUg9yOpsh7A": "hoa", "qYu8kUP5LfI8ymGBYTmO1tJdBq8487Bd": "trai-cay", "swKvV5lGcMLScPw1yM6xkpbB": "vinamilk", "vynIWnYsTPqKBdarkAaW6OVsZ1OrHccO": "nuoc-ngot", "xf76ewqBfRzOvvlqRk6MP5qe": "nuoc-ngot", "zcx5tjaOyrqaXxM8qjJG8yzk": "syrup", "zxg1XkJ0vwKvWyKveY4YMh7R": "chi-hong"};
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search), oldTk = (q.get("t") || q.get("token") || "").trim();
  if (!q.get("ncc") && oldTk && CU[oldTk]) { location.replace(location.pathname + "?ncc=" + CU[oldTk]); return; }
  var slug = (q.get("ncc") || "").trim().toLowerCase();
  var data = null, items = [];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function fmt(d) { return d ? Number(d).toLocaleString("vi-VN") : ""; }
  function num(v) { if (v == null || v === "") return 0; if (typeof v === "number") return v > 0 ? Math.round(v) : 0; var d = String(v).replace(/[.,\s]|đ|vnd|₫/gi, ""); return /^\d+$/.test(d) ? +d : 0; }
  function vnDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : (s || ""); }
  function getJSON(u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); }
  function fail() { $("ncc-loading").hidden = true; $("ncc-error").hidden = false; }
  function key(m) { return m.ma || String(m.ten).trim().toLowerCase(); }
  function lsGet(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function oldHtml(it) { return it.gia_cu ? 'Giá cũ: <b>' + fmt(it.gia_cu) + 'đ</b>' + (it.ngay ? ' · ' + esc(vnDate(it.ngay)) : '') : 'Chưa có giá'; }

  // Giá cũ hiện ngay từ data/ncc/<slug>.json (Action làm mới mỗi 20 phút từ ket-app); Sheet (GET ENDPOINT) chỉ cập nhật ngầm sau.
  function fromFile(f) {
    var list = (f && f.mon) || [];
    if (!list.length) throw "empty";
    data = { ncc: f.ncc || slug, ma_ncc: f.ma_ncc || slug };
    items = list.map(function (m) { return { ma: m.ma || "", ten: m.ten, dv: m.don_vi || m.dv || "", gia_cu: (m.la_thu_thu ? 0 : num(m.gia)) || num(m.gia_ket_dang_ghi), ngay: m.ngay || "" }; });
  }
  function sheetUpdate() {
    if (!ENDPOINT) return;
    getJSON(ENDPOINT + (ENDPOINT.indexOf("?") < 0 ? "?" : "&") + "form=ncc&ncc=" + encodeURIComponent(slug)).then(function (s) {
      var by = {}; ((s && (s.items || s.mon)) || []).forEach(function (m) { if (m && (m.ma || m.ten)) by[key(m)] = m; });
      items.forEach(function (it, i) {
        var x = by[key(it)], g = x && num(x.gia_moi || x.gia); if (!g) return;
        it.gia_cu = g; it.ngay = x.ngay || x.thoi_gian || it.ngay;
        var el = $("ncc-old-" + i); if (el) { el.innerHTML = oldHtml(it); el.classList.remove("ncc-missing"); }
      });
      demGiaCu();
    }).catch(function () {});
  }
  // Đếm lại MỌI món đang hiện giá cũ (file + Sheet, mọi ngày) — sửa lỗi 05/11 hộp chỉ đếm giá từ file.
  function demGiaCu() {
    var n = items.filter(function (it) { return it.gia_cu; }).length, el = $("ncc-last");
    if (n) { el.textContent = n + "/" + items.length + " món đã có giá cũ."; el.hidden = false; } else el.hidden = true;
  }
  function saveDraft() {
    var d = { name: $("f-name").value, note: $("f-note").value, gia: {} };
    document.querySelectorAll(".ncc-price-input").forEach(function (el) { var v = digits(el.value); if (v) d.gia[key(items[+el.dataset.i])] = v; });
    lsSet(LS + slug, d);
  }
  function render() {
    var dr = lsGet(LS + slug, {});
    $("ncc-name").textContent = data.ncc;
    document.title = "Báo giá – " + data.ncc + " – Kết Group";
    $("ncc-items").innerHTML = items.map(function (it, i) {
      var v = (dr.gia || {})[key(it)] || "";
      return '<li class="ncc-item inset-card"><p class="ncc-item-name">' + esc(it.ten) + (it.dv ? ' <small>(' + esc(it.dv) + ')</small>' : '') + '</p>' +
        '<p class="ncc-item-ket' + (it.gia_cu ? '' : ' ncc-missing') + '" id="ncc-old-' + i + '">' + oldHtml(it) + '</p>' +
        '<label class="ncc-price"><input class="field-control ncc-price-input" data-i="' + i + '" type="text" inputmode="numeric" autocomplete="off" placeholder="Giá mới (trống = không đổi)" value="' + fmt(v) + '" aria-label="Giá mới ' + esc(it.ten) + '"><span>đ</span></label></li>';
    }).join("");
    demGiaCu();
    if (dr.name) $("f-name").value = dr.name;
    if (dr.note) $("f-note").value = dr.note;
    $("ncc-loading").hidden = true; $("ncc-form").hidden = false;
  }
  function payload() {
    var out = [];
    document.querySelectorAll(".ncc-price-input").forEach(function (el) { var it = items[+el.dataset.i]; out.push({ ma: it.ma, ten: it.ten, don_vi: it.dv, gia_cu: it.gia_cu || "", gia_moi: digits(el.value) ? +digits(el.value) : "" }); });
    return { form: "ncc", ncc: data.ncc, ma_ncc: data.ma_ncc, slug: slug, nguoi: $("f-name").value.trim(), ghi_chu: $("f-note").value.trim(), thoi_gian: new Date().toLocaleString("vi-VN"), id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), items: out };
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
    getJSON("data/ncc/" + slug + ".json").then(function (f) { fromFile(f); render(); sheetUpdate(); }).catch(fail);
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
