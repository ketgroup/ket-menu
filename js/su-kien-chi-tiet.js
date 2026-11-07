/* Sheet chi tiết sự kiện — mỗi thẻ mở đúng một sự kiện, không nhảy thẳng menu + Chương trình. */
(function () {
  "use strict";
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function venueMenuHref(e) {
    if (e.menuHref) return e.menuHref;
    if (e.href && /\.html$/.test(e.href) && e.href.indexOf("pre-order") < 0) return e.href;
    return null;
  }
  function detailsFor(e) {
    if (e.chiTiet && e.chiTiet.length) return e.chiTiet;
    return [e.lich];
  }
  function closeSheet(sh) {
    if (!sh) return;
    sh.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { sh.remove(); }, 280);
  }
  function openEvent(i) {
    var list = window.KET_EVENTS;
    if (!list || list[i] == null) return;
    var e = list[i];
    var existing = document.querySelector(".ev-sheet");
    if (existing) closeSheet(existing);

    var menu = venueMenuHref(e);
    var sh = document.createElement("div");
    sh.className = "ev-sheet";
    sh.setAttribute("role", "presentation");
    var body =
      '<div class="ev-sheet-backdrop" data-ev-x tabindex="-1"></div>' +
      '<div class="ev-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="ev-sheet-title" style="--c:' +
      esc(e.mau) +
      '">' +
      '<button type="button" class="ev-sheet-close" data-ev-x aria-label="Đóng chi tiết">✕</button>' +
      '<div class="ev-sheet-hero"><span class="ev-sheet-icon" aria-hidden="true">' +
      esc(e.icon) +
      "</span>" +
      '<p class="ev-sheet-venue">' +
      esc(e.quan) +
      "</p>" +
      '<h2 class="ev-sheet-title" id="ev-sheet-title">' +
      esc(e.ten) +
      "</h2></div>" +
      '<ul class="ev-sheet-list">' +
      detailsFor(e)
        .map(function (line) {
          return "<li>" + esc(line) + "</li>";
        })
        .join("") +
      "</ul>" +
      '<div class="ev-sheet-actions">';
    if (e.preorder && e.href) {
      body +=
        '<a class="ios-btn ios-btn--filled ev-sheet-primary" href="' +
        esc(e.href) +
        '">Pre-order ›</a>';
    } else if (e.href && e.href.charAt(0) === "#") {
      body +=
        '<button type="button" class="ios-btn ios-btn--filled ev-sheet-primary" data-ev-scroll="' +
        esc(e.href.slice(1)) +
        '">Xem các quán</button>';
    }
    if (menu) {
      body +=
        '<a class="ios-btn ios-btn--tinted ev-sheet-menu" href="' +
        esc(menu) +
        '">Xem menu</a>';
    }
    body += "</div></div>";
    sh.innerHTML = body;
    document.body.appendChild(sh);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sh.classList.add("open"); });

    sh.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-ev-x]")) {
        ev.preventDefault();
        closeSheet(sh);
        return;
      }
      var scrollBtn = ev.target.closest("[data-ev-scroll]");
      if (scrollBtn) {
        ev.preventDefault();
        var id = scrollBtn.getAttribute("data-ev-scroll");
        var el = document.getElementById(id);
        closeSheet(sh);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  window.KET_openEvent = openEvent;

  function intercept(ev) {
    var btn = ev.target.closest(".event-btn[data-ev]");
    if (!btn) return;
    ev.preventDefault();
    openEvent(+btn.getAttribute("data-ev"));
  }

  function bindTeaser() {
    document.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".teaser-chip[data-ev]");
      if (!chip) return;
      ev.preventDefault();
      openEvent(+chip.getAttribute("data-ev"));
    });
  }

  function init() {
    var strip = document.getElementById("event-strip");
    if (strip) strip.addEventListener("click", intercept);
    bindTeaser();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
