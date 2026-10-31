/* Đa ngôn ngữ cho menu Kết. Dữ liệu: i18n/<mã>.json (bản js/lang/<mã>.js để tải).
   Khoá từ điển = chữ tiếng Việt gốc. Chỉ đổi chữ hiển thị, không đổi giá trị gửi đi. */
(function () {
  var V = "20261031zm";
  var LANGS = [
    ["vi","Tiếng Việt","VI"],["en","English","EN"],["zh-Hans","中文简体","简"],["zh-Hant","中文繁體","繁"],
    ["ko","한국어","KO"],["ja","日本語","JA"],["th","ภาษาไทย","TH"],["fr","Français","FR"],["de","Deutsch","DE"],
    ["es","Español","ES"],["ru","Русский","RU"],["it","Italiano","IT"],["pt","Português","PT"],
    ["id","Bahasa Indonesia","ID"],["ms","Bahasa Melayu","MS"],["fil","Filipino","FIL"],["hi","हिन्दी","HI"],
    ["ar","العربية","AR"],["nl","Nederlands","NL"],["tr","Türkçe","TR"]
  ];
  var KEY = "ket-lang";
  function find(c) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === c) return LANGS[i]; return null; }
  function detect() {
    var s; try { s = localStorage.getItem(KEY); } catch (e) {}
    if (s && find(s)) return s;
    var navs = navigator.languages || [navigator.language || "vi"];
    for (var i = 0; i < navs.length; i++) {
      var n = String(navs[i]).toLowerCase();
      if (/^zh-(tw|hk|mo)|^zh-hant/.test(n)) return "zh-Hant";
      if (/^zh/.test(n)) return "zh-Hans";
      if (/^(tl|fil)/.test(n)) return "fil";
      var b = n.split("-")[0]; if (find(b)) return b;
    }
    return "vi";
  }
  var lang = detect(), cur = find(lang);
  var root = document.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  window.KET_LANG = lang;

  var D = null, P = null, U = null;
  function fill(t, o) { return t.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function seg(s) {
    if (D.hasOwnProperty(s)) return D[s];
    var m;
    if ((m = s.match(/^Đã chọn (\d+)\/(\d+) món free$/))) return fill(P.gift, { a: m[1], b: m[2] });
    if ((m = s.match(/^Bạn còn (\d+) món free có thể chọn\.$/))) return fill(P.left, { n: m[1] });
    if ((m = s.match(/^(\d+) món · tạm tính (.+?)( \+ món giá theo quán)?$/))) return fill(P.total, { n: m[1], x: m[2] }) + (m[3] ? P.plusvenue : "");
    if ((m = s.match(/^Gọi (.+)$/))) return fill(P.call, { x: m[1] });
    if ((m = s.match(/^Từ (\S+) – (\S+)$/))) return fill(P.from, { a: m[1], b: m[2] });
    if ((m = s.match(/^TB ~(\S+)\/ly$/))) return fill(P.avg, { x: m[1] });
    if ((m = s.match(/^Đánh giá trên (.+)$/))) return fill(P.reviewon, { x: m[1] });
    if ((m = s.match(/^(Thứ [2-7]|Chủ nhật), (\d\d\/\d\d\/\d{4})( \(hôm nay\))?$/))) return (D[m[1]] || m[1]) + ", " + m[2] + (m[3] ? " (" + P.today + ")" : "");
    if ((m = s.match(/^Kênh của (.+)$/)) && P.channels) return fill(P.channels, { x: m[1] });
    if ((m = s.match(/^(Menu .+?) – (?:(Đồ uống|Bếp) )?trang (\d+)$/)) && P.page) return fill(P.page, { x: m[1] + (m[2] ? " – " + D[m[2]] : ""), n: m[3] });
    if ((m = s.match(/^(.+) – (Kết .+)$/)) && D[m[1]]) return D[m[1]] + " – " + m[2];
    if ((m = s.match(/^Mỗi ngày (\d.*)$/))) return D["Mỗi ngày"] + " " + m[1];
    if ((m = s.match(/^(.+) \((Đồ uống|Bếp)\)$/)) && D[m[1]]) return D[m[1]] + " (" + D[m[2]] + ")";
    if (/– khuya/.test(s)) return s.replace(/– khuya/g, "– " + P.late);
    if (s.length > 1 && s === s.toUpperCase()) {
      if (!U) { U = {}; for (var k in D) if (D.hasOwnProperty(k)) U[k.toUpperCase()] = D[k]; }
      if (U.hasOwnProperty(s)) return U[s].toLocaleUpperCase(lang);
    }
    return null;
  }
  function tr(s) {
    var t = s.trim(); if (!t || !/[^\s\d.,:;–\-~/()+*%&·đk]/i.test(t)) return null;
    var r = seg(t);
    if (r == null && t.indexOf(" · ") > 0) {
      var parts = t.split(" · "), ch = false;
      parts = parts.map(function (p) { var x = seg(p); if (x != null) { ch = true; return x; } return p; });
      if (ch) r = parts.join(" · ");
    }
    if (r == null) return null;
    return s.replace(t, r);
  }
  var done = new WeakMap();
  function doText(n) {
    var v = n.nodeValue; if (done.get(n) === v) return;
    var r = tr(v);
    if (r != null) {
      if (r.trim() === "" && n.parentElement && n.parentElement.childNodes.length === 1) n.parentElement.style.display = "none";
      n.nodeValue = r; done.set(n, r);
    } else done.set(n, v);
  }
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function doEl(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute && el.getAttribute(ATTRS[i]); if (!a) continue;
      var r = tr(a); if (r != null && r !== a) el.setAttribute(ATTRS[i], r);
    }
  }
  function walk(node) {
    if (node.nodeType === 3) { var p = node.parentElement; if (p && !/^(SCRIPT|STYLE)$/.test(p.tagName) && !p.closest(".kg-lang-sheet")) doText(node); return; }
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(node.tagName) || node.classList.contains("kg-lang-sheet")) return;
    doEl(node);
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 1) { if (n.closest(".kg-lang-sheet")) continue; doEl(n); }
      else { var pe = n.parentElement; if (pe && !/^(SCRIPT|STYLE)$/.test(pe.tagName) && !pe.closest(".kg-lang-sheet")) doText(n); }
    }
  }
  function startTranslate() {
    walk(document.body);
    var tt = tr(document.title); if (tt != null) document.title = tt;
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") walk(m.target);
        else if (m.type === "attributes") doEl(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    var al = window.alert;
    window.alert = function (msg) { var r = tr(String(msg)); return al.call(window, r != null ? r : msg); };
    root.classList.remove("kg-i18n-wait");
  }

  /* Nút + sheet chọn ngôn ngữ */
  var GLOBE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/></svg>';
  function label() { return P ? P.language : "Ngôn ngữ"; }
  function openSheet() {
    var sh = document.createElement("div");
    sh.className = "kg-lang-sheet";
    var h = '<div class="kg-lang-backdrop" data-x></div><div class="kg-lang-panel" role="dialog" aria-modal="true" aria-label="' + label() + '"><span class="kg-lang-grab"></span><div class="kg-lang-head"><b>' + GLOBE + label() + '</b><button type="button" class="kg-lang-close" data-x aria-label="Close">✕</button></div><ul class="kg-lang-list">';
    LANGS.forEach(function (l) {
      h += '<li><button type="button" data-l="' + l[0] + '" lang="' + l[0] + '"' + (l[0] === "ar" ? ' dir="rtl"' : "") + (l[0] === lang ? ' aria-current="true"' : "") + '><span>' + l[1] + '</span>' + (l[0] === lang ? '<i aria-hidden="true">✓</i>' : "") + "</button></li>";
    });
    sh.innerHTML = h + "</ul></div>";
    document.body.appendChild(sh);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sh.classList.add("open"); });
    sh.addEventListener("click", function (e) {
      var b = e.target.closest("[data-l]");
      if (b) { try { localStorage.setItem(KEY, b.getAttribute("data-l")); } catch (_) {} location.reload(); return; }
      if (e.target.closest("[data-x]")) { sh.classList.remove("open"); document.body.style.overflow = ""; setTimeout(function () { sh.remove(); }, 260); }
    });
  }
  function makeBtn(extra) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "kg-lang " + (extra || "");
    b.setAttribute("aria-label", label() + ": " + cur[1]);
    b.innerHTML = GLOBE + "<span>" + cur[2] + "</span>";
    b.addEventListener("click", openSheet);
    return b;
  }
  function mountButtons() {
    document.querySelectorAll(".ios-nav-code").forEach(function (old) {
      var b = makeBtn("ios-nav-code" + (old.classList.contains("kg-code") ? " kg-code" : ""));
      old.replaceWith(b);
    });
    var hero = document.querySelector(".home-hero");
    if (hero && !hero.querySelector(".kg-lang")) hero.appendChild(makeBtn("kg-lang--home"));
  }
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  if (lang === "vi") { ready(mountButtons); return; }
  root.classList.add("kg-i18n-wait");
  setTimeout(function () { root.classList.remove("kg-i18n-wait"); }, 2500);
  var s = document.createElement("script");
  s.src = "js/lang/" + lang + ".js?v=" + V;
  s.onload = function () { D = window.KET_I18N_DATA.t; P = window.KET_I18N_DATA.p; ready(function () { mountButtons(); startTranslate(); }); };
  s.onerror = function () { root.classList.remove("kg-i18n-wait"); ready(mountButtons); };
  document.head.appendChild(s);
})();
