(function () {
  "use strict";
  var P = new URLSearchParams(location.search);
  var t = (P.get("t") || "").trim(), TEST = P.get("test") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "ket_ct_" + t, URL_FS = "https://formsubmit.co/ajax/ketcocktail@gmail.com";
  var DATA, ST = {}, quan = "all", filt = "all", q = "", sec = "chua";
  function hasCT(m) { return st(m).done || m.nl.some(function (x) { return x.t && String(x.dl).trim() !== ""; }); }
  var UNITS = ["ml", "g", "gr", "dash", "giọt", "lát", "quả", "cái", "muỗng", "phần", "shot"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ st: ST, name: $("ct-name").value })); } catch (e) {} }
  function st(m) {
    if (!ST[m.id]) ST[m.id] = { nl: m.nl.map(function (x) { return { t: x.t, dl: x.dl, dv: x.dv }; }), ly: m.ly || "", gar: m.gar || "", cach: m.cach || "", note: m.note || "", done: false, sent: false, dirty: false };
    return ST[m.id];
  }
  function filled(s) { return s.nl.some(function (x) { return x.t && String(x.dl).trim() !== ""; }); }
  function status(m) { var s = st(m); return s.done ? "done" : filled(s) ? "part" : "empty"; }
  function recipeText(m, s) {
    var L = s.nl.filter(function (x) { return x.t; }).map(function (x) { return "- " + x.t + ": " + x.dl + " " + x.dv; });
    if (s.ly) L.push("Ly: " + s.ly); if (s.gar) L.push("Garnish: " + s.gar);
    if (s.cach) L.push("Cách làm: " + s.cach); if (s.note) L.push("Ghi chú: " + s.note);
    return L.join("\n");
  }
  function csvRows(list) {
    var q2 = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var out = ["Quán,Mã,Món,Nhóm,Nguyên liệu,Định lượng,Đơn vị,Ly,Garnish,Cách làm,Ghi chú,Xong"];
    list.forEach(function (m) {
      var s = st(m), nl = s.nl.filter(function (x) { return x.t; }); if (!nl.length) nl = [{ t: "", dl: "", dv: "" }];
      nl.forEach(function (x, i) {
        out.push([m.q, m.ma, m.ten, m.nhom, x.t, x.dl, x.dv, i ? "" : s.ly, i ? "" : s.gar, i ? "" : s.cach, i ? "" : s.note, s.done ? "Xong" : "Chưa"].map(q2).join(","));
      });
    });
    return out.join("\n");
  }
  function send(list, btn) {
    var name = $("ct-name").value.trim();
    if (!name) { $("ct-msg").textContent = "Điền tên người điền ở cuối trang trước khi gửi."; $("ct-name").focus(); return Promise.reject(); }
    var pre = TEST ? "[TEST] " : "";
    var body = {
      _subject: pre + "Công thức món – " + name + " – " + (list.length === 1 ? list[0].q + " " + list[0].ten : list.length + " món"),
      _template: "table", _captcha: "false",
      nguoi_dien: name, so_mon: list.length, thoi_gian: new Date().toLocaleString("vi-VN"),
      cong_thuc: list.map(function (m) { return "【" + m.q + "】 " + m.ten + (m.ma ? " (" + m.ma + ")" : "") + (st(m).done ? " ✔" : "") + "\n" + recipeText(m, st(m)); }).join("\n\n"),
      bang_csv: csvRows(list)
    };
    if (TEST) body.TEST = "ĐÂY LÀ TIN GỬI THỬ – BỎ QUA";
    var old = btn.textContent; btn.disabled = true; btn.textContent = "Đang gửi…"; $("ct-msg").textContent = "";
    btn.textContent = "Đang gửi… (có thể mất ~1 phút)";
    var ac = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ac) ac.abort(); }, 150000);
    return fetch(URL_FS, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined })
      .finally(function () { clearTimeout(to); })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) !== "true") throw j; }); })
      .then(function () { list.forEach(function (m) { st(m).sent = true; st(m).dirty = false; }); save(); btn.textContent = "Đã gửi ✓"; $("ct-msg").textContent = "✅ Đã gửi thành công " + list.length + " món. Cảm ơn!"; setTimeout(function () { btn.disabled = false; btn.textContent = old; render(); }, 1200); })
      .catch(function (e) { btn.disabled = false; btn.textContent = old; $("ct-msg").textContent = "Máy chủ nhận form đang chậm, có thể chưa gửi được. Đợi 1 phút rồi bấm gửi lại (gửi trùng không sao). " + ((e && e.message) || ""); throw e; });
  }
  function rowHtml(x, i) {
    var opts = UNITS.slice(); if (x.dv && opts.indexOf(x.dv) < 0) opts.unshift(x.dv);
    return '<div class="ct-row" data-i="' + i + '"><input list="ct-nl" class="nl" placeholder="Nguyên liệu" value="' + esc(x.t) + '"><input class="dl" inputmode="decimal" placeholder="0" value="' + esc(x.dl) + '"><select class="dv">' +
      opts.map(function (u) { return "<option" + (u === x.dv ? " selected" : "") + ">" + esc(u) + "</option>"; }).join("") + '</select><button type="button" class="ct-del" aria-label="Xoá">×</button></div>';
  }
  function bodyHtml(m) {
    var s = st(m);
    return '<div class="ct-hdr"><span>Nguyên liệu</span><span>Định lượng</span><span>Đơn vị</span><span></span></div><div class="ct-rows">' + s.nl.map(rowHtml).join("") + '</div>' +
      '<button type="button" class="ct-add">+ Thêm nguyên liệu</button>' +
      '<div class="ct-2"><label><span class="ct-lbl">Ly</span><input class="ct-in" data-k="ly" placeholder="VD: Rock, Coupe…" value="' + esc(s.ly) + '"></label><label><span class="ct-lbl">Garnish</span><input class="ct-in" data-k="gar" placeholder="VD: vỏ cam" value="' + esc(s.gar) + '"></label></div>' +
      '<label><span class="ct-lbl">Cách làm</span><textarea class="ct-in" data-k="cach" rows="2" placeholder="Shake / Stir / Build…">' + esc(s.cach) + '</textarea></label>' +
      '<label><span class="ct-lbl">Ghi chú</span><textarea class="ct-in" data-k="note" rows="1">' + esc(s.note) + '</textarea></label>' +
      '<div class="ct-acts"><button type="button" class="ct-done-btn' + (s.done ? " on" : "") + '">' + (s.done ? "✓ Đã xong" : "Đánh dấu Xong") + '</button><button type="button" class="ct-send-btn">Gửi món này</button></div>';
  }
  function headHtml(m) {
    var s = st(m), k = status(m), n = s.nl.filter(function (x) { return x.t; }).length;
    return '<span class="ct-dot ' + k + '"></span><span class="ct-title"><b>' + esc(m.ten) + '</b><small>' + m.q + (m.ma ? " · " + esc(m.ma) : "") + " · " + (n ? n + " nguyên liệu" : "Chưa có công thức") + '</small></span>' +
      (s.sent && !s.dirty ? '<span class="ct-tag sent">Đã gửi</span>' : s.dirty ? '<span class="ct-tag">Đã sửa</span>' : "");
  }
  function counts() {
    var all = DATA.mon, d = 0, se = 0; all.forEach(function (m) { if (st(m).done) d++; if (st(m).sent) se++; });
    $("ct-done").textContent = d; $("ct-total").textContent = all.length; $("ct-sent").textContent = se;
    var nc = 0; all.forEach(function (m) { if (hasCT(m)) nc++; }); $("ct-n-co").textContent = nc; $("ct-n-chua").textContent = all.length - nc;
    $("ct-barfill").style.width = (all.length ? d * 100 / all.length : 0) + "%";
  }
  function visible(m) {
    if ((hasCT(m) ? "co" : "chua") !== sec) return false;
    if (quan !== "all" && m.q !== quan) return false;
    return !q || norm(m.ten + " " + m.ma + " " + m.nhom).indexOf(q) >= 0;
  }
  function render() {
    var box = $("ct-list"), html = "", last = "", n = 0;
    DATA.mon.forEach(function (m) {
      if (!visible(m)) return; n++;
      var g = m.q + " · " + m.nhom; if (g !== last) { html += '<h3 class="ct-group">' + esc(g) + "</h3>"; last = g; }
      html += '<div class="ct-item" data-id="' + m.id + '"><button type="button" class="ct-head">' + headHtml(m) + '</button><div class="ct-body"></div></div>';
    });
    box.innerHTML = html; $("ct-empty").hidden = n > 0; counts();
  }
  function byId(id) { for (var i = 0; i < DATA.mon.length; i++) if (DATA.mon[i].id === id) return DATA.mon[i]; }
  function touch(el, m) { var s = st(m); s.dirty = true; save(); el.querySelector(".ct-head").innerHTML = headHtml(m); counts(); }
  function bind() {
    var list = $("ct-list");
    list.addEventListener("click", function (e) {
      var it = e.target.closest(".ct-item"); if (!it) return; var m = byId(it.dataset.id), s = st(m), b = it.querySelector(".ct-body");
      if (e.target.closest(".ct-head")) { if (!it.classList.contains("open")) b.innerHTML = bodyHtml(m); it.classList.toggle("open"); return; }
      if (e.target.closest(".ct-add")) { s.nl.push({ t: "", dl: "", dv: "ml" }); var r = b.querySelector(".ct-rows"); r.insertAdjacentHTML("beforeend", rowHtml(s.nl[s.nl.length - 1], s.nl.length - 1)); r.lastChild.querySelector(".nl").focus(); touch(it, m); return; }
      if (e.target.closest(".ct-del")) { var i = +e.target.closest(".ct-row").dataset.i; s.nl.splice(i, 1); b.innerHTML = bodyHtml(m); touch(it, m); return; }
      if (e.target.closest(".ct-done-btn")) { var was = hasCT(m); s.done = !s.done; b.innerHTML = bodyHtml(m); touch(it, m); if (hasCT(m) !== was) setTimeout(render, 600); return; }
      if (e.target.closest(".ct-send-btn")) { send([m], e.target.closest(".ct-send-btn")).then(function () { setTimeout(function () { it.querySelector(".ct-head").innerHTML = headHtml(m); counts(); }, 1300); }, function () {}); }
    });
    list.addEventListener("input", function (e) {
      var it = e.target.closest(".ct-item"); if (!it) return; var m = byId(it.dataset.id), s = st(m), row = e.target.closest(".ct-row");
      if (row) { var x = s.nl[+row.dataset.i]; if (e.target.classList.contains("nl")) x.t = e.target.value; else if (e.target.classList.contains("dl")) x.dl = e.target.value.replace(",", "."); else x.dv = e.target.value; }
      else if (e.target.dataset.k) s[e.target.dataset.k] = e.target.value;
      touch(it, m);
    });
    $("ct-q").addEventListener("input", function () { q = norm(this.value.trim()); render(); });
    $("ct-quan").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; quan = b.dataset.q; [].forEach.call(this.children, function (c) { c.classList.toggle("on", c === b); }); render(); });
    $("ct-tabs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; sec = b.dataset.s; [].forEach.call(this.children, function (c) { c.classList.toggle("on", c === b); }); render(); });
    $("ct-name").addEventListener("input", save);
    $("ct-sendall").addEventListener("click", function () {
      var L = DATA.mon.filter(function (m) { var s = st(m); return s.dirty || (s.done && !s.sent); });
      if (!L.length) { $("ct-msg").textContent = "Chưa có món nào sửa/đánh dấu xong mà chưa gửi."; return; }
      send(L, this).catch(function () {});
    });
    window.addEventListener("beforeunload", save);
  }
  if (!/^[A-Za-z0-9]{16,40}$/.test(t)) { $("ct-loading").hidden = true; $("ct-error").hidden = false; return; }
  fetch("data/cong-thuc/" + t + ".json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    d.mon = (d.mon || []).filter(function (m) { return !m.an; }); // chỉ hiện món đang bán trong CukCuk (an=true là ẩn)
    DATA = d;
    try { var sv = JSON.parse(localStorage.getItem(KEY) || "{}"); ST = sv.st || {}; Object.keys(ST).forEach(function (id) { var x = ST[id]; if (!x || (!x.dirty && !x.done && !x.sent)) delete ST[id]; }); $("ct-name").value = sv.name || ""; } catch (e) { $("ct-name").value = ""; }
    var qs = []; d.mon.forEach(function (m) { if (qs.indexOf(m.q) < 0) qs.push(m.q); });
    $("ct-quan").innerHTML = '<button type="button" data-q="all" class="on">4 quán</button>' + qs.map(function (x) { return '<button type="button" data-q="' + x + '">' + x + "</button>"; }).join("");
    var nls = {}; d.mon.forEach(function (m) { m.nl.forEach(function (x) { if (x.t) nls[x.t] = 1; }); });
    $("ct-nl").innerHTML = Object.keys(nls).sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join("");
    $("ct-loading").hidden = true; $("ct-app").hidden = false; bind(); render();
  }).catch(function () { $("ct-loading").hidden = true; $("ct-error").hidden = false; });
})();
