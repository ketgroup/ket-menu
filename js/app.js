(function () {
  "use strict";

  if (window.applyVenueTheme) {
    window.applyVenueTheme();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderHomeVenues() {
    var root = document.getElementById("venue-list-home");
    if (!root || !window.KET_VENUE_ORDER) return;
    var html = "";
    window.KET_VENUE_ORDER.forEach(function (id) {
      var v = window.KET_VENUES[id];
      if (!v) return;
      var hours = window.KET_hoursHome(v);
      var hoursHtml = hours
        ? '<span class="venue-row-hours">' + escapeHtml(hours) + "</span>"
        : "";
      var price = window.KET_priceLine ? window.KET_priceLine(v) : "";
      var priceHtml = price
        ? '<span class="venue-row-price">' + escapeHtml(price) + "</span>"
        : "";
      var row =
        '<a class="venue-row" href="' +
        escapeHtml(v.href) +
        '">' +
        '<img class="venue-app-icon" src="' +
        escapeHtml(v.logo) +
        '" alt="" width="44" height="44">' +
        '<div class="venue-row-text"><b>' +
        escapeHtml(v.code + " · " + v.title) +
        "</b><span>" +
        escapeHtml(v.tagline) +
        "</span>" +
        hoursHtml +
        priceHtml +
        "</div>" +
        '<span class="venue-row-chevron" aria-hidden="true">›</span></a>';
      if (id === "k5") {
        html +=
          '<div class="venue-group" style="--d:.31s">' + row +
          '<a class="venue-sub" href="pre-order-k5.html">' +
          '<span class="venue-sub-icon" aria-hidden="true">💃</span>' +
          '<span class="venue-sub-text"><b>Pre-order Latin Dance · Thứ 4 &amp; Thứ 6</b><span>Đặt món trước · Mua 1 cocktail tặng 1 món</span></span>' +
          '<span class="venue-row-chevron" aria-hidden="true">›</span></a></div>';
      } else {
        html += row;
      }
    });
    root.innerHTML = html;
  }

  var TRIPADVISOR_SVG =
    '<svg class="ios-btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"/></svg>';

  function renderPriceLines() {
    if (!window.KET_priceLine) return;
    document.querySelectorAll("[data-venue-price]").forEach(function (el) {
      var v = window.KET_VENUES[el.getAttribute("data-venue-price")];
      el.textContent = window.KET_priceLine(v);
      if (!el.textContent) el.hidden = true;
    });
  }

  function renderVenueInfoCard() {
    var mount = document.querySelector("[data-venue-info]");
    if (!mount) return;
    var venueId = document.body.getAttribute("data-current-venue");
    var v = venueId && window.KET_VENUES[venueId];
    if (!v) return;

    var hasHours = v.hours && v.hours.length;
    var hasAddress = v.address;
    var hasPhone = v.phone && v.phoneDisplay;
    if (!hasHours && !hasAddress && !hasPhone) {
      mount.remove();
      return;
    }

    var parts = '<div class="venue-info-card inset-card">';
    if (hasHours) {
      parts += '<div class="venue-info-block">';
      parts += '<p class="venue-info-label">Giờ mở cửa</p>';
      v.hours.forEach(function (line) {
        parts += '<p class="venue-info-value">' + escapeHtml(line) + "</p>";
      });
      parts += "</div>";
    }
    if (hasAddress) {
      var maps = window.KET_mapsUrl(v.address);
      parts += '<div class="venue-info-block">';
      parts += '<p class="venue-info-label">Địa chỉ</p>';
      parts +=
        '<a class="venue-info-link" href="' +
        escapeHtml(maps) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(v.address) +
        "</a></div>";
    }
    if (hasPhone || v.tripadvisor) {
      parts += '<div class="venue-info-actions">';
      if (hasPhone) {
        parts +=
          '<a class="ios-btn ios-btn--filled ios-btn--call" href="tel:' +
          escapeHtml(v.phone) +
          '">Gọi ' +
          escapeHtml(v.phoneDisplay) +
          "</a>";
      }
      if (v.tripadvisor) {
        parts +=
          '<a class="ios-btn ios-btn--tinted ios-btn--tripadvisor" href="' +
          escapeHtml(v.tripadvisor) +
          '" target="_blank" rel="noopener">' +
          TRIPADVISOR_SVG +
          "<span>Đánh giá trên Tripadvisor</span></a>";
      }
      parts += "</div>";
    }
    parts += "</div>";
    mount.innerHTML = parts;
  }

  renderHomeVenues();
  renderVenueInfoCard();
  renderPriceLines();

  var SEGMENT_ROOT = document.querySelector("[data-segment-control]");
  if (SEGMENT_ROOT) {
    var buttons = SEGMENT_ROOT.querySelectorAll(".segment-btn");
    var panels = document.querySelectorAll("[data-segment-panel]");
    var ids = Array.prototype.map.call(buttons, function (btn) {
      return btn.getAttribute("data-target");
    });

    function showPanel(id, scrollTop) {
      panels.forEach(function (panel) {
        var match = panel.id === id;
        panel.classList.toggle("is-hidden", !match);
        panel.setAttribute("aria-hidden", match ? "false" : "true");
      });
      buttons.forEach(function (btn) {
        var active = btn.getAttribute("data-target") === id;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (scrollTop) {
        var bar = document.querySelector(".segment-bar");
        var offset = bar ? bar.getBoundingClientRect().bottom + window.scrollY : 0;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
      if (history.replaceState) {
        history.replaceState(null, "", "#" + id);
      } else {
        location.hash = id;
      }
    }

    function panelFromHash() {
      var hash = (location.hash || "").replace(/^#/, "");
      if (ids.indexOf(hash) !== -1) return hash;
      return ids[0];
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        showPanel(btn.getAttribute("data-target"), true);
      });
    });

    window.addEventListener("hashchange", function () {
      showPanel(panelFromHash(), false);
    });

    showPanel(panelFromHash(), false);
  }

  var current = document.body.getAttribute("data-current-venue");
  if (current) {
    document.querySelectorAll(".ios-tab-bar .tab-item").forEach(function (tab) {
      if (tab.getAttribute("data-venue") === current) {
        tab.classList.add("is-selected");
        tab.setAttribute("aria-current", "page");
      }
    });
  }

  var siteTab = document.body.getAttribute("data-site-tab");
  if (siteTab) {
    document.querySelectorAll(".ios-tab-bar--site .tab-item").forEach(function (tab) {
      if (tab.getAttribute("data-site-tab") === siteTab) {
        tab.classList.add("is-selected");
        tab.setAttribute("aria-current", "page");
      }
    });
  }
})();
