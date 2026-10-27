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
      html +=
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
        "</div>" +
        '<span class="venue-row-chevron" aria-hidden="true">›</span></a>';
    });
    root.innerHTML = html;
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
    if (hasPhone) {
      parts +=
        '<div class="venue-info-actions"><a class="ios-btn ios-btn--filled ios-btn--call" href="tel:' +
        escapeHtml(v.phone) +
        '">Gọi ' +
        escapeHtml(v.phoneDisplay) +
        "</a></div>";
    }
    parts += "</div>";
    mount.innerHTML = parts;
  }

  renderHomeVenues();
  renderVenueInfoCard();

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
