(function () {
  "use strict";

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
    document.querySelectorAll(".venue-pill").forEach(function (pill) {
      if (pill.getAttribute("data-venue") === current) {
        pill.classList.add("is-current");
        pill.setAttribute("aria-current", "page");
      }
    });
  }
})();
