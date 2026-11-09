(function () {
  "use strict";
  var P = new URLSearchParams(location.search);
  var t = (P.get("t") || "").trim(), TEST = P.get("test") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "ket_ct_" + t, ENDPOINT = window.KET_FORM_ENDPOINT || "";
  var DATA, ST = {}, quan = "all", filt = "all", q = "", sec = "chua";
  var KHO_LIST = [], KHO_BY_MA = {}, KHO_BY_TEN = {}, MENU_MA = {};
  var NEED_RESELECT = 0, DN_CTX = null, nlDropCloseTimer = 0;
  function hasCT(m) { return filled(st(m)); }
  function tang(m) { return /^make you happy$/i.test(String(m.nhom || "").trim()); }
  var UNITS = ["ml", "g", "gr", "dash", "giọt", "lát", "quả", "cái", "muỗng", "phần", "shot", "chai", "lon", "gói"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ st: ST, name: $("ct-name").value })); } catch (e) {} }
  function nlInit(x) {
    var o = { t: x.t || "", dl: x.dl || "", dv: x.dv || "", ma: x.ma || "", de_nghi_ten: x.de_nghi_ten || "", de_nghi_gc: x.de_nghi_gc || "", nl_cho_duyet: !!x.nl_cho_duyet };
    resolveMa(o);
    syncNlMoi(o);
    return o;
  }
  function st(m) {
    if (!ST[m.id]) ST[m.id] = { nl: m.nl.map(nlInit), ly: m.ly || "", gar: m.gar || "", note: m.note || "", done: false, sent: false, dirty: false };
    return ST[m.id];
  }
  function filled(s) { return s.nl.some(function (x) { return rowKhoOk(x) && String(x.dl).trim() !== ""; }); }
  function status(m) { var s = st(m); return s.done ? "done" : filled(s) ? "part" : "empty"; }
  function rowKhoOk(x) {
    if (x.ma && KHO_BY_MA[x.ma]) return true;
    if (x.nl_cho_duyet && String(x.de_nghi_ten || x.t || "").trim()) return true;
    return false;
  }
  function needsReselect(x) {
    if (rowKhoOk(x)) return false;
    if (!String(x.t || "").trim() && !String(x.dl || "").trim() && !String(x.dv || "").trim()) return false;
    return !!String(x.t || "").trim() || !!String(x.dl || "").trim();
  }
  function syncNlMoi(x) {
    if (x.ma && KHO_BY_MA[x.ma]) { x.nl_moi = false; x.nl_cho_duyet = false; return; }
    x.nl_moi = !!x.nl_cho_duyet;
  }
  function resolveMa(o) {
    if (o.ma && KHO_BY_MA[o.ma]) { o.t = KHO_BY_MA[o.ma].ten; return; }
    if (o.ma && !KHO_BY_MA[o.ma]) return;
    var hit = KHO_BY_TEN[norm(o.t)];
    if (hit) { o.ma = hit.ma; o.t = hit.ten; }
  }
  function applyPick(x, item) {
    x.ma = item.ma;
    x.t = item.ten;
    x.nl_cho_duyet = false;
    x.de_nghi_ten = "";
    x.de_nghi_gc = "";
    if (!String(x.dv || "").trim() && item.dv) x.dv = item.dv;
    syncNlMoi(x);
  }
  function filterKho(query, lim) {
    var parts = norm(query).split(/\s+/).filter(Boolean), L = lim || 28, out = [], i, h, hay;
    if (!parts.length) return KHO_LIST.slice(0, Math.min(12, L));
    for (i = 0; i < KHO_LIST.length && out.length < L; i++) {
      h = KHO_LIST[i];
      hay = norm(h.ten) + " " + norm(h.ma);
      if (parts.every(function (p) { return hay.indexOf(p) >= 0; })) out.push(h);
    }
    return out;
  }
  function nearestKho(ten, n) {
    var nt = norm(ten), parts = nt.split(/\s+/).filter(Boolean), scored = [], i, h, hay, s;
    if (!nt) return [];
    for (i = 0; i < KHO_LIST.length; i++) {
      h = KHO_LIST[i];
      hay = norm(h.ten);
      s = 0;
      if (hay === nt) s += 100;
      else if (hay.indexOf(nt) >= 0 || nt.indexOf(hay) >= 0) s += 40;
      parts.forEach(function (p) { if (p.length > 1 && hay.indexOf(p) >= 0) s += 12; });
      if (s) scored.push({ h: h, s: s });
    }
    scored.sort(function (a, b) { return b.s - a.s || a.h.ten.localeCompare(b.h.ten, "vi"); });
    return scored.slice(0, n).map(function (x) { return x.h; });
  }
  function qtyOk(dl) {
    var s = String(dl == null ? "" : dl).trim().replace(",", ".");
    if (!s) return false;
    var v = parseFloat(s);
    return isFinite(v) && v > 0;
  }
  function venueRef() { return quan === "all" ? null : quan; }
  function maThuocQuan(ma, q) {
    if (!ma || !q) return true;
    var set = MENU_MA[q];
    return !set || set[ma] === 1;
  }
  function venueWarn(m) {
    var vq = venueRef() || m.q;
    if (!m.ma || maThuocQuan(m.ma, vq)) return "";
    return "Mã " + m.ma + " không có trong menu " + vq;
  }
  function validateMon(m) {
    var s = st(m), errs = [], rowMsgs = {}, i, x, rows = 0;
    for (i = 0; i < s.nl.length; i++) {
      x = s.nl[i];
      if (!String(x.t || "").trim() && !String(x.dl || "").trim() && !String(x.dv || "").trim()) continue;
      rows++;
      var msgs = [];
      if (!rowKhoOk(x)) {
        if (needsReselect(x)) msgs.push("Cần chọn lại từ kho");
        else msgs.push("Chọn nguyên liệu từ kho");
      }
      if (!qtyOk(x.dl)) msgs.push("Định lượng phải > 0");
      if (!String(x.dv || "").trim()) msgs.push("Thiếu đơn vị");
      if (msgs.length) { errs.push({ i: i, msgs: msgs }); rowMsgs[i] = msgs.join(" · "); }
    }
    if (!rows) errs.unshift({ i: -1, msgs: ["Chưa có nguyên liệu"] });
    return { ok: !errs.length, rowMsgs: rowMsgs, dishMsg: rows ? "" : "Chưa có nguyên liệu", venueMsg: venueWarn(m) };
  }
  function displayTen(x) {
    if (x.ma && KHO_BY_MA[x.ma]) return KHO_BY_MA[x.ma].ten;
    if (x.nl_cho_duyet) return x.de_nghi_ten || x.t;
    return x.t || "";
  }
  function recipeText(m, s) {
    var L = s.nl.filter(function (x) { return rowKhoOk(x); }).map(function (x) { return "- " + displayTen(x) + ": " + x.dl + " " + x.dv; });
    if (s.ly) L.push("Ly: " + s.ly); if (s.gar) L.push("Garnish: " + s.gar);
    if (s.cach) L.push("Cách làm: " + s.cach); if (s.note) L.push("Ghi chú: " + s.note);
    return L.join("\n");
  }
  function csvRows(list) {
    var q2 = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var out = ["Quán,Mã,Món,Nhóm,Mã NVL,Nguyên liệu,Định lượng,Đơn vị,Ly,Garnish,Cách làm,Ghi chú,Xong"];
    list.forEach(function (m) {
      var s = st(m), nl = s.nl.filter(function (x) { return rowKhoOk(x); }); if (!nl.length) nl = [{ t: "", ma: "", dl: "", dv: "" }];
      nl.forEach(function (x, i) {
        out.push([m.q, m.ma, m.ten, m.nhom, x.ma || "", displayTen(x), x.dl, x.dv, i ? "" : s.ly, i ? "" : s.gar, i ? "" : s.cach, i ? "" : s.note, s.done ? "Xong" : "Chưa"].map(q2).join(","));
      });
    });
    return out.join("\n");
  }
  function rowWarnHtml(x) {
    if (x.nl_cho_duyet) return '<span class="ct-nl-warn">Chờ Kỹ thuật duyệt</span>';
    if (needsReselect(x)) return '<span class="ct-nl-warn ct-nl-reselect">Cần chọn lại từ kho</span>';
  }
  function paintValidation(it, m, v) {
    var b = it.querySelector(".ct-body");
    if (!b || !it.classList.contains("open")) return;
    var dishEl = b.querySelector(".ct-dish-err");
    if (dishEl) dishEl.textContent = v.dishMsg || "";
    if (dishEl) dishEl.hidden = !v.dishMsg;
    var vw = b.querySelector(".ct-venue-warn");
    if (vw) { vw.textContent = v.venueMsg || ""; vw.hidden = !v.venueMsg; }
    b.querySelectorAll(".ct-row-wrap").forEach(function (w) {
      var i = +w.dataset.i, el = w.querySelector(".ct-row-msg");
      var msg = v.rowMsgs[i] || "";
      if (el) { el.textContent = msg; el.hidden = !msg; }
    });
    b.querySelectorAll(".ct-row-wrap").forEach(function (w) {
      var row = w.querySelector(".ct-row"), i = +w.dataset.i, x = st(m).nl[i];
      if (!row) return;
      var cell = row.querySelector(".ct-nl-cell"), nw = cell && cell.querySelector(".ct-nl-warn");
      var wh = rowWarnHtml(x);
      if (wh) {
        if (!nw) { nw = document.createElement("span"); nw.className = "ct-nl-warn"; cell.appendChild(nw); }
        nw.outerHTML = wh;
      } else if (nw) nw.remove();
    });
  }
  function validateBeforeSend(list) {
    var bad = false;
    list.forEach(function (m) {
      var v = validateMon(m), it = document.querySelector('.ct-item[data-id="' + m.id + '"]');
      if (!v.ok) bad = true;
      if (it) {
        if (!it.classList.contains("open")) {
          it.querySelector(".ct-body").innerHTML = bodyHtml(m);
          it.classList.add("open");
        }
        paintValidation(it, m, v);
      }
    });
    if (bad) {
      $("ct-msg").textContent = "Kiểm tra lại nguyên liệu (đỏ) trước khi gửi.";
      return false;
    }
    $("ct-msg").textContent = "";
    return true;
  }
  function send(list, btn) {
    var name = $("ct-name").value.trim();
    if (!name) { $("ct-msg").textContent = "Điền tên người điền ở cuối trang trước khi gửi."; $("ct-name").focus(); return Promise.reject(); }
    if (!validateBeforeSend(list)) return Promise.reject();
    var pre = TEST ? "[TEST] " : "";
    var body = {
      _subject: pre + "Công thức món – " + name + " – " + (list.length === 1 ? list[0].q + " " + list[0].ten : list.length + " món"),
      nguoi_dien: name, so_mon: list.length, thoi_gian: new Date().toLocaleString("vi-VN"),
      cong_thuc: list.map(function (m) { return "【" + m.q + "】 " + m.ten + (m.ma ? " (" + m.ma + ")" : "") + (st(m).done ? " ✔" : "") + "\n" + recipeText(m, st(m)); }).join("\n\n")
    };
    var job = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), ids: list.map(function (m) { return m.id; }), body: body,
      payload: JSON.stringify({
        form: "cong-thuc", nguoi: name, thoi_gian: body.thoi_gian, trang: location.pathname, test: TEST || undefined,
        mon: list.map(function (m) {
          var x = st(m);
          return {
            q: m.q, ma: m.ma, ten: m.ten, nhom: m.nhom,
            nl: x.nl.filter(function (n) { return rowKhoOk(n); }).map(function (n) {
              syncNlMoi(n);
              var o = { t: displayTen(n), dl: n.dl, dv: n.dv };
              if (n.ma) o.ma = n.ma;
              if (n.nl_moi) o.nl_moi = true;
              return o;
            }),
            ly: x.ly, gar: x.gar, cach: x.cach, note: pre + x.note, done: x.done
          };
        })
      })
    };
    list.forEach(function (m) { st(m).sent = true; st(m).dirty = false; }); save();
    var Q = qLoad(); Q.push(job); qSave(Q);
    var old = btn.textContent; btn.textContent = "Đã gửi ✓"; $("ct-msg").textContent = "✅ Đã gửi " + list.length + " món. Cảm ơn!";
    setTimeout(function () { btn.textContent = old; render(); }, 1200);
    runJob(job, 0);
    return Promise.resolve();
  }
  var QKEY = KEY + "_q";
  function qLoad() { try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch (e) { return []; } }
  function qSave(Q) { try { localStorage.setItem(QKEY, JSON.stringify(Q)); } catch (e) {} }
  function qDone(job) { qSave(qLoad().filter(function (j) { return j.id !== job.id; })); }
  function post(job, mode) { return fetch(ENDPOINT, { method: "POST", mode: mode, redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: job.payload, keepalive: job.payload.length < 60000 }); }
  var WAIT = [3000, 10000, 30000, 60000];
  function runJob(job, n) {
    if (!ENDPOINT) return;
    post(job, "cors").then(function (r) { return r.json().then(function (j) { if (!j || j.ok !== true) throw { hard: true, message: (j && j.loi) || "máy chủ từ chối" }; }); },
      function () { return post(job, "no-cors"); })
      .then(function () { qDone(job); }, function (e) {
        if (n < WAIT.length && !(e && e.hard)) setTimeout(function () { runJob(job, n + 1); }, WAIT[n]); else failJob(job, e);
      });
  }
  function failJob(job, e) {
    qDone(job);
    job.ids.forEach(function (id) { var x = ST[id]; if (x) { x.sent = false; x.dirty = true; } }); save(); if (DATA) render();
    fallback(job.body, e);
  }
  function fallback(body, e) {
    var txt = "Người điền: " + body.nguoi_dien + "\nThời gian: " + body.thoi_gian + "\nSố món: " + body.so_mon + "\n\n" + body.cong_thuc;
    var mail = "mailto:ketcocktail@gmail.com?subject=" + encodeURIComponent(body._subject) + "&body=" + encodeURIComponent(txt);
    var m = $("ct-msg");
    m.innerHTML = "Gửi nền nhiều lần không được, CHƯA tới nơi (" + esc((e && e.message) || "lỗi mạng") + "). Bản đã điền vẫn lưu trên máy này. Bấm <b>Gửi qua ứng dụng Mail</b> (gửi tới ketcocktail@gmail.com) hoặc bấm «Gửi tất cả món đã sửa» lại sau.<br>" +
      '<a class="apply-submit" style="display:inline-block;margin-top:8px;text-decoration:none" href="' + esc(mail) + '">Gửi qua ứng dụng Mail</a> ' +
      '<button type="button" class="apply-submit" style="margin-top:8px" id="ct-copy">Sao chép nội dung</button>';
    $("ct-copy").onclick = function () { var b = this; (navigator.clipboard ? navigator.clipboard.writeText(body._subject + "\n\n" + txt) : Promise.reject()).then(function () { b.textContent = "Đã chép ✓ – dán vào Zalo/Mail"; }, function () { b.textContent = "Không chép được"; }); };
  }
  function nlPickHtml(x, i) {
    syncNlMoi(x);
    var disp = esc(displayTen(x));
    var reselect = needsReselect(x);
    var sug = reselect ? nearestKho(x.t, 3) : [];
    var sugHtml = sug.length ? '<div class="ct-nl-sug">' + sug.map(function (h) {
      return '<button type="button" class="ct-nl-sug-btn" data-ma="' + esc(h.ma) + '">' + esc(h.ten) + "</button>";
    }).join("") + "</div>" : "";
    return '<div class="ct-nl-pick' + (reselect ? " is-reselect" : "") + '" data-i="' + i + '">' +
      '<input type="search" class="nl-q" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" placeholder="Gõ tìm trong kho…" value="' + disp + '">' +
      '<div class="ct-nl-drop" hidden role="listbox"></div>' + (rowWarnHtml(x) || "") + sugHtml + "</div>";
  }
  function rowHtml(x, i) {
    var opts = UNITS.slice(); if (x.dv && opts.indexOf(x.dv) < 0) opts.unshift(x.dv);
    var dv0 = !String(x.dv || "").trim() ? '<option value="" selected disabled hidden>–</option>' : "";
    return '<div class="ct-row-wrap" data-i="' + i + '"><div class="ct-row" data-i="' + i + '"><span class="ct-nl-cell">' + nlPickHtml(x, i) +
      '</span><input class="dl" inputmode="decimal" placeholder="0" value="' + esc(x.dl) + '"><select class="dv">' + dv0 +
      opts.map(function (u) { return "<option" + (u === x.dv ? " selected" : "") + ">" + esc(u) + "</option>"; }).join("") + '</select><button type="button" class="ct-del" aria-label="Xoá">×</button></div><p class="ct-row-msg" hidden role="alert"></p></div>';
  }
  function fillDrop(drop, items, showDeNghi) {
    var html = items.map(function (h) {
      return '<button type="button" class="ct-nl-opt" role="option" data-ma="' + esc(h.ma) + '"><b>' + esc(h.ten) + '</b><small>' + esc(h.ma) + " · " + esc(h.nhom) + "</small></button>";
    }).join("");
    if (showDeNghi !== false) html += '<button type="button" class="ct-nl-de-nghi">Đề nghị thêm hàng</button>';
    drop.innerHTML = html;
    drop.hidden = !html;
  }
  function openDn(ctx, prefill) {
    DN_CTX = ctx;
    $("ct-dn-ten").value = prefill || "";
    $("ct-dn-dv").value = "";
    $("ct-dn-gc").value = "";
    $("ct-dn-err").hidden = true;
    $("ct-dn-mask").hidden = false;
    $("ct-dn-ten").focus();
  }
  function closeDn() { $("ct-dn-mask").hidden = true; DN_CTX = null; }
  function sendDeNghi() {
    if (!DN_CTX) return;
    var ten = $("ct-dn-ten").value.trim(), dv = $("ct-dn-dv").value.trim(), gc = $("ct-dn-gc").value.trim();
    var err = $("ct-dn-err");
    if (!ten || !dv) { err.textContent = "Điền tên hàng và đơn vị."; err.hidden = false; return; }
    var m = DN_CTX.m, i = DN_CTX.i, s = st(m), x = s.nl[i];
    x.ma = "";
    x.t = ten;
    x.dv = dv;
    x.de_nghi_ten = ten;
    x.de_nghi_gc = gc;
    x.nl_cho_duyet = true;
    syncNlMoi(x);
    save();
    var nguoi = $("ct-name").value.trim() || "(chưa điền tên)";
  var payload = JSON.stringify({
      form: "de-nghi-them-hang", nguoi: nguoi, ten: ten, don_vi: dv, ghi_chu: gc,
      quan: m.q, ma_mon: m.ma, mon: m.ten, thoi_gian: new Date().toISOString(), test: TEST || undefined
    });
    closeDn();
    var it = document.querySelector('.ct-item[data-id="' + m.id + '"]');
    if (it && it.classList.contains("open")) {
      it.querySelector(".ct-body").innerHTML = bodyHtml(m);
      touch(it, m);
      liveRowHints(it, m);
    }
    if (TEST || !ENDPOINT) return;
    fetch(ENDPOINT, { method: "POST", mode: "cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: payload })
      .catch(function () {
        fetch(ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: payload }).catch(function () {});
      });
  }
  function bodyHtml(m) {
    var s = st(m), vw = venueWarn(m);
    return '<div class="ct-hdr"><span>Nguyên liệu</span><span>Định lượng</span><span>Đơn vị</span><span></span></div>' +
      (vw ? '<p class="ct-venue-warn" role="status">' + esc(vw) + '</p>' : '<p class="ct-venue-warn" hidden role="status"></p>') +
      '<p class="ct-dish-err" hidden role="alert"></p><div class="ct-rows">' + s.nl.map(rowHtml).join("") + '</div>' +
      '<button type="button" class="ct-add">+ Thêm nguyên liệu</button>' +
      '<div class="ct-2"><label><span class="ct-lbl">Ly</span><input class="ct-in" data-k="ly" placeholder="VD: Rock, Coupe…" value="' + esc(s.ly) + '"></label><label><span class="ct-lbl">Garnish</span><input class="ct-in" data-k="gar" placeholder="VD: vỏ cam" value="' + esc(s.gar) + '"></label></div>' +
      '<label><span class="ct-lbl">Cách làm</span><textarea class="ct-in" data-k="cach" rows="2" placeholder="Shake / Stir / Build…">' + esc(s.cach) + '</textarea></label>' +
      '<label><span class="ct-lbl">Ghi chú</span><textarea class="ct-in" data-k="note" rows="1">' + esc(s.note) + '</textarea></label>' +
      '<div class="ct-acts"><button type="button" class="ct-done-btn' + (s.done ? " on" : "") + '">' + (s.done ? "✓ Đã xong" : "Đánh dấu Xong") + '</button><button type="button" class="ct-send-btn">Gửi món này</button></div>';
  }
  function headHtml(m) {
    var s = st(m), k = status(m), n = s.nl.filter(function (x) { return rowKhoOk(x); }).length;
    return '<span class="ct-dot ' + k + '"></span><span class="ct-title"><b>' + esc(m.ten) + '</b><small>' + m.q + (m.ma ? " · " + esc(m.ma) : "") + " · " + (n ? n + " nguyên liệu" : "Chưa có công thức") + '</small></span>' +
      (s.sent && !s.dirty ? '<span class="ct-tag sent">Đã gửi</span>' : s.dirty ? '<span class="ct-tag">Đã sửa</span>' : "");
  }
  function counts() {
    var all = DATA.mon.filter(function (m) { return !tang(m) && !m.an && (quan === "all" || m.q === quan); }), d = 0, se = 0; all.forEach(function (m) { if (st(m).done) d++; if (st(m).sent) se++; });
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
  function liveRowHints(it, m) { paintValidation(it, m, validateMon(m)); }
  function rowFromPick(it, m, i) {
    var b = it.querySelector(".ct-body");
    if (b) { b.innerHTML = bodyHtml(m); liveRowHints(it, m); touch(it, m); }
  }
  function bindDn() {
    $("ct-dn-cancel").addEventListener("click", closeDn);
    $("ct-dn-mask").addEventListener("click", function (e) { if (e.target === $("ct-dn-mask")) closeDn(); });
    $("ct-dn-send").addEventListener("click", sendDeNghi);
  }
  function bind() {
    var list = $("ct-list");
    list.addEventListener("click", function (e) {
      var it = e.target.closest(".ct-item"); if (!it) return; var m = byId(it.dataset.id), s = st(m), b = it.querySelector(".ct-body");
      if (e.target.closest(".ct-head")) { if (!it.classList.contains("open")) b.innerHTML = bodyHtml(m); it.classList.toggle("open"); return; }
      if (e.target.closest(".ct-nl-opt")) {
        var ma = e.target.closest(".ct-nl-opt").dataset.ma, item = KHO_BY_MA[ma], wrap = e.target.closest(".ct-row-wrap"), i = +wrap.dataset.i;
        if (item) { applyPick(s.nl[i], item); rowFromPick(it, m, i); }
        return;
      }
      if (e.target.closest(".ct-nl-sug-btn")) {
        var ma2 = e.target.closest(".ct-nl-sug-btn").dataset.ma, item2 = KHO_BY_MA[ma2], wrap2 = e.target.closest(".ct-row-wrap"), i2 = +wrap2.dataset.i;
        if (item2) { applyPick(s.nl[i2], item2); rowFromPick(it, m, i2); }
        return;
      }
      if (e.target.closest(".ct-nl-de-nghi")) {
        var wrap3 = e.target.closest(".ct-row-wrap"), i3 = +wrap3.dataset.i;
        var qv = wrap3.querySelector(".nl-q").value.trim();
        openDn({ m: m, i: i3 }, qv);
        return;
      }
      if (e.target.closest(".ct-add")) { s.nl.push(nlInit({ t: "", dl: "", dv: "ml" })); var r = b.querySelector(".ct-rows"); r.insertAdjacentHTML("beforeend", rowHtml(s.nl[s.nl.length - 1], s.nl.length - 1)); r.lastChild.querySelector(".nl-q").focus(); touch(it, m); return; }
      if (e.target.closest(".ct-del")) { var row = e.target.closest(".ct-row-wrap") || e.target.closest(".ct-row"); var ix = +row.dataset.i; s.nl.splice(ix, 1); b.innerHTML = bodyHtml(m); touch(it, m); return; }
      if (e.target.closest(".ct-done-btn")) { var was = hasCT(m); s.done = !s.done; b.innerHTML = bodyHtml(m); touch(it, m); if (hasCT(m) !== was) setTimeout(render, 600); return; }
      if (e.target.closest(".ct-send-btn")) { send([m], e.target.closest(".ct-send-btn")).then(function () { setTimeout(function () { it.querySelector(".ct-head").innerHTML = headHtml(m); counts(); }, 1300); }, function () {}); }
    });
    list.addEventListener("focusin", function (e) {
      if (!e.target.classList.contains("nl-q")) return;
      var pick = e.target.closest(".ct-nl-pick"), drop = pick && pick.querySelector(".ct-nl-drop");
      if (!drop) return;
      clearTimeout(nlDropCloseTimer);
      var x = st(byId(e.target.closest(".ct-item").dataset.id)).nl[+pick.closest(".ct-row-wrap").dataset.i];
      if (x.ma) { e.target.select(); }
      fillDrop(drop, filterKho(e.target.value), true);
    });
    list.addEventListener("input", function (e) {
      var it = e.target.closest(".ct-item"); if (!it) return; var m = byId(it.dataset.id), s = st(m);
      if (e.target.classList.contains("nl-q")) {
        var pick = e.target.closest(".ct-nl-pick"), wrap = pick.closest(".ct-row-wrap"), i = +wrap.dataset.i, x = s.nl[i];
        x.ma = "";
        x.nl_cho_duyet = false;
        x.de_nghi_ten = "";
        syncNlMoi(x);
        var drop = pick.querySelector(".ct-nl-drop");
        fillDrop(drop, filterKho(e.target.value), true);
        liveRowHints(it, m);
        touch(it, m);
        return;
      }
      var row = e.target.closest(".ct-row");
      if (row) {
        var wrap2 = row.closest(".ct-row-wrap") || row.parentElement;
        var ix = +wrap2.dataset.i;
        var xr = s.nl[ix];
        if (e.target.classList.contains("dl")) xr.dl = e.target.value.replace(",", ".");
        else if (e.target.classList.contains("dv")) xr.dv = e.target.value;
        liveRowHints(it, m);
      } else if (e.target.dataset.k) s[e.target.dataset.k] = e.target.value;
      touch(it, m);
    });
    list.addEventListener("focusout", function (e) {
      if (!e.target.classList.contains("nl-q")) return;
      var it = e.target.closest(".ct-item"), pick = e.target.closest(".ct-nl-pick");
      if (!it || !pick) return;
      nlDropCloseTimer = setTimeout(function () {
        var drop = pick.querySelector(".ct-nl-drop");
        if (drop) drop.hidden = true;
        var m = byId(it.dataset.id), i = +pick.closest(".ct-row-wrap").dataset.i, x = st(m).nl[i];
        e.target.value = displayTen(x);
      }, 180);
    });
    list.addEventListener("change", function (e) {
      if (!e.target.classList.contains("dv")) return;
      var it = e.target.closest(".ct-item"); if (!it) return;
      var m = byId(it.dataset.id), row = e.target.closest(".ct-row"), wrap = row && (row.closest(".ct-row-wrap") || row.parentElement);
      if (wrap) st(m).nl[+wrap.dataset.i].dv = e.target.value;
      touch(it, m);
      liveRowHints(it, m);
    });
    $("ct-q").addEventListener("input", function () { q = norm(this.value.trim()); render(); });
    $("ct-quan").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      quan = b.dataset.q;
      [].forEach.call(this.children, function (c) { c.classList.toggle("on", c === b); });
      render();
      document.querySelectorAll(".ct-item.open").forEach(function (it) {
        var m = byId(it.dataset.id); if (m) it.querySelector(".ct-body").innerHTML = bodyHtml(m);
      });
    });
    $("ct-tabs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; sec = b.dataset.s; [].forEach.call(this.children, function (c) { c.classList.toggle("on", c === b); }); render(); });
    $("ct-name").addEventListener("input", save);
    $("ct-sendall").addEventListener("click", function () {
      var L = DATA.mon.filter(function (m) { var sx = st(m); return sx.dirty || (sx.done && !sx.sent); });
      if (!L.length) { $("ct-msg").textContent = "Chưa có món nào sửa/đánh dấu xong mà chưa gửi."; return; }
      send(L, this).catch(function () {});
    });
    window.addEventListener("beforeunload", save);
    bindDn();
  }
  function khoFromMaster(file) {
    KHO_LIST = [];
    KHO_BY_MA = {};
    KHO_BY_TEN = {};
    (file.hang || []).forEach(function (h) {
      if (h.gop_vao) return;
      var item = { ma: h.ma, ten: String(h.ten || "").trim(), nhom: h.nhom || "", dv: h.don_vi_cong_thuc || h.don_vi || "" };
      if (!item.ma || !item.ten) return;
      KHO_LIST.push(item);
      KHO_BY_MA[item.ma] = item;
      var nk = norm(item.ten);
      if (!KHO_BY_TEN[nk]) KHO_BY_TEN[nk] = item;
    });
    KHO_LIST.sort(function (a, b) { return a.ten.localeCompare(b.ten, "vi"); });
  }
  function menuFromFile(menu) {
    Object.keys(menu || {}).forEach(function (q) {
      MENU_MA[q] = {};
      (menu[q] || []).forEach(function (x) { if (x && x.ma) MENU_MA[q][x.ma] = 1; });
    });
  }
  function countReselect() {
    NEED_RESELECT = 0;
    (DATA.mon || []).forEach(function (m) {
      st(m).nl.forEach(function (x) { if (needsReselect(x)) NEED_RESELECT++; });
    });
    window.__CT_NEED_RESELECT = NEED_RESELECT;
  }
  function tuSheet() {
    if (!ENDPOINT) return;
    fetch(ENDPOINT + (ENDPOINT.indexOf("?") < 0 ? "?" : "&") + "form=cong-thuc&t=" + encodeURIComponent(t), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (s) {
      if (!s || !s.ok || !s.mon || !s.mon.length) return;
      var by = {}; s.mon.forEach(function (x) { by[x.q + "|" + x.ma] = x; });
      var doi = 0;
      DATA.mon.forEach(function (m) {
        var x = by[m.q + "|" + m.ma]; if (!x || !x.nl || !x.nl.some(function (n) { return n.t; })) return;
        m.nl = x.nl.map(function (n) { return nlInit({ t: n.t, dl: n.dl, dv: n.dv, ma: n.ma }); });
        ["ly", "gar", "cach", "note"].forEach(function (f) { if (x[f]) m[f] = String(x[f]); });
        var y = ST[m.id]; if (y && !y.dirty) delete ST[m.id];
        doi++;
      });
      if (doi) { countReselect(); render(); }
    }).catch(function () {});
  }
  if (!/^[A-Za-z0-9]{16,40}$/.test(t)) { $("ct-loading").hidden = true; $("ct-error").hidden = false; return; }
  Promise.all([
    fetch("data/cong-thuc/" + t + ".json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
    fetch("data/kho/master.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : { hang: [] }; }).catch(function () { return { hang: [] }; }),
    fetch("data/emenu/menu.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
  ]).then(function (res) {
    var d = res[0];
    khoFromMaster(res[1]);
    menuFromFile(res[2]);
    try {
      var sv = JSON.parse(localStorage.getItem(KEY) || "{}");
      ST = sv.st || {};
      Object.keys(ST).forEach(function (id) {
        var x = ST[id];
        if (!x || (!x.dirty && !x.done && !x.sent)) delete ST[id];
        else if (x.nl) x.nl = x.nl.map(function (n) { return nlInit(n); });
      });
      $("ct-name").value = sv.name || "";
    } catch (e) { $("ct-name").value = ""; }
    d.mon = (d.mon || []).filter(function (m) { var x = ST[m.id]; return !m.an || (x && (x.dirty || (x.done && !x.sent))); });
    DATA = d;
    var qs = []; d.mon.forEach(function (m) { if (qs.indexOf(m.q) < 0) qs.push(m.q); });
    $("ct-quan").innerHTML = '<button type="button" data-q="all" class="on">4 quán</button>' + qs.map(function (x) { return '<button type="button" data-q="' + x + '">' + x + "</button>"; }).join("");
    countReselect();
    $("ct-loading").hidden = true; $("ct-app").hidden = false; bind(); render(); qLoad().forEach(function (j) { runJob(j, 0); });
    tuSheet();
  }).catch(function () { $("ct-loading").hidden = true; $("ct-error").hidden = false; });
})();
