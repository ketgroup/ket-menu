(function () {
  "use strict";

  var API =
    "https://script.google.com/macros/s/AKfycbzm-H___UuyyEowOE_y359i6l3MJHeXmMJP3LCGzr3imR8ZNeUQDkXhRDL2-FDZROCy/exec";
  var DEF_K = "C3SAItpttvE07U6visS6BZPG6UZ0zyEH";
  var V = window.KET_CAP_CACHE || "20261110c";

  var VENUES = {
    K1: { label: "Kết Bar", cls: "k1", logo: "../img/logos/k1.png" },
    K2: { label: "Kết High", cls: "k2", logo: "../img/logos/k2.png" },
    K5: { label: "Kết Fai", cls: "k5", logo: "../img/logos/k5.png" },
    K9: { label: "Kết Underground", cls: "k9", logo: "../img/logos/k9.png" },
  };

  var Q = window.KET_CAP_VENUE || null;
  var allowVenuePick = !!window.KET_CAP_PICK_VENUE;
  var DATA = null;
  var photoDataUrl = null;
  var photoFile = null;
  var pending = null;
  var uploadTimer = null;
  var cancelTimer = null;

  var $ = function (s) {
    return document.querySelector(s);
  };

  (function urlToken() {
    var m = location.search.match(/[?&]k=([^&#]+)/);
    if (m) {
      localStorage.setItem("ketUpK", decodeURIComponent(m[1]));
      history.replaceState(null, "", location.pathname + location.hash);
    }
  })();

  function tok() {
    return localStorage.getItem("ketUpK") || DEF_K;
  }

  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d");
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function jget(u) {
    return fetch(u, { cache: "no-store" }).then(function (r) {
      return r.json();
    });
  }

  function listPhotos() {
    return jget(API + "?api=list&k=" + encodeURIComponent(tok()) + "&t=" + Date.now())
      .then(function (x) {
        if (!x || !x.ok) throw 0;
        return x;
      })
      .catch(function () {
        return { photos: { K1: {}, K2: {}, K5: {}, K9: {} } };
      });
  }

  function loadData() {
    return Promise.all([
      jget("../data/emenu/menu.json?v=" + V),
      listPhotos(),
      jget("../data/emenu/co-anh.json?v=" + V).catch(function () {
        return {};
      }),
    ]).then(function (r) {
      var menu = r[0];
      var srv = r[1];
      var stat = r[2];
      var photos = {};
      ["K1", "K2", "K5", "K9"].forEach(function (q) {
        photos[q] = {};
        var st = stat[q] || {};
        Object.keys(st).forEach(function (ma) {
          photos[q][ma] = { id: "s:" + st[ma].f, local: true };
        });
        var ap = (srv.photos || {})[q] || {};
        Object.keys(ap).forEach(function (ma) {
          photos[q][ma] = ap[ma];
        });
      });
      DATA = { menu: menu, photos: photos };
      return DATA;
    });
  }

  function hasPhoto(ma) {
    return !!(DATA && DATA.photos[Q] && DATA.photos[Q][ma]);
  }

  function resize(f) {
    return new Promise(function (ok, no) {
      var img = new Image();
      var u = URL.createObjectURL(f);
      img.onload = function () {
        var m = 1600;
        var s = Math.min(1, m / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        ok(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = no;
      img.src = u;
    });
  }

  function uploadPhoto(ma, ten, dataUrl) {
    var delay = 0;
    var attempts = 0;
    function tryOnce() {
      attempts++;
      return fetch(API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          k: tok(),
          src: location.origin,
          quan: Q,
          ma: ma,
          data: dataUrl,
          nguoi: "",
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (x) {
          if (x && x.ok === false) throw new Error(x.error || "Lỗi máy chủ");
          if (!x || x.ok === undefined) return x || { ok: true };
          return x;
        })
        .catch(function (e) {
          if (attempts >= 6) throw e;
          var wait = Math.min(30000, 800 * Math.pow(2, attempts - 1));
          return new Promise(function (res) {
            setTimeout(res, wait);
          }).then(tryOnce);
        });
    }
    return tryOnce();
  }

  function setView(name) {
    ["camera", "pick", "sent"].forEach(function (v) {
      var el = $("#view-" + v);
      if (el) el.classList.toggle("on", v === name);
    });
  }

  function resetFlow() {
    clearTimeout(uploadTimer);
    clearTimeout(cancelTimer);
    pending = null;
    photoDataUrl = null;
    photoFile = null;
    var fi = $("#file-in");
    if (fi) fi.value = "";
    setView("camera");
  }

  function renderDishes() {
    var q = norm($("#search").value);
    var items = (DATA.menu[Q] || []).slice();
    items.sort(function (a, b) {
      var ha = hasPhoto(a.ma) ? 1 : 0;
      var hb = hasPhoto(b.ma) ? 1 : 0;
      if (ha !== hb) return ha - hb;
      return a.ten.localeCompare(b.ten, "vi");
    });
    var html = "";
    items.forEach(function (i) {
      if (q) {
        var hay = norm(i.ten + " " + i.ma + " " + (i.nhom || ""));
        if (hay.indexOf(q) < 0) return;
      }
      var got = hasPhoto(i.ma);
      html +=
        '<button type="button" class="dish' +
        (got ? "" : " miss") +
        '" data-ma="' +
        esc(i.ma) +
        '" data-ten="' +
        esc(i.ten) +
        '"><div><div class="name">' +
        esc(i.ten) +
        '</div><div class="code">' +
        esc(i.ma) +
        '</div></div><span class="mark">' +
        (got ? "✓" : "") +
        "</span></button>";
    });
    $("#dish-list").innerHTML = html || '<p style="padding:16px;color:var(--sub);text-align:center">Không có món</p>';
  }

  function startSent(dish) {
    pending = { ma: dish.ma, ten: dish.ten, data: photoDataUrl, cancelled: false };
    $("#sent-title").textContent = "Đã gửi ✓ " + dish.ten;
    $("#sent-img").src = photoDataUrl;
    $("#sent-status").textContent = "Huỷ trong 10 giây nếu chọn nhầm";
    $("#btn-cancel").style.display = "";
    setView("sent");

    cancelTimer = setTimeout(function () {
      $("#btn-cancel").style.display = "none";
      $("#sent-status").textContent = "Đang gửi…";
      uploadPhoto(dish.ma, dish.ten, photoDataUrl)
        .then(function () {
          if (pending && pending.cancelled) return;
          if (DATA.photos[Q]) DATA.photos[Q][dish.ma] = { id: "new", t: Date.now() };
          $("#sent-status").textContent = "Đã lưu lên Drive";
          setTimeout(resetFlow, 800);
        })
        .catch(function () {
          if (pending && pending.cancelled) return;
          $("#sent-status").textContent = "Đang gửi… (thử lại)";
        });
    }, 10000);
  }

  function buildShell() {
    var v = VENUES[Q];
    document.body.classList.add(v.cls);
    var change =
      allowVenuePick && !window.KET_CAP_VENUE
        ? '<button type="button" class="link-change" id="btn-change">Đổi quán</button>'
        : "";
    document.body.innerHTML =
      '<header class="hdr"><img src="' +
      v.logo +
      "?v=" +
      V +
      '" alt=""><div><h1>' +
      esc(v.label) +
      '</h1><div class="sub">Up ảnh món · Captain</div></div>' +
      change +
      '</header><div class="wrap">' +
      '<div id="view-camera" class="view on"><button type="button" class="btn-shoot" id="btn-shoot">📷 Chụp ảnh</button></div>' +
      '<div id="view-pick" class="view"><div class="thumb-row"><img id="pick-preview" alt=""><span>Chọn món cho ảnh này</span></div>' +
      '<input class="search" id="search" type="search" placeholder="Tìm món…" autocomplete="off">' +
      '<div class="dish-list" id="dish-list"></div></div>' +
      '<div id="view-sent" class="view"><div class="sent-card"><h2 id="sent-title"></h2>' +
      '<img id="sent-img" alt=""><p class="status" id="sent-status"></p>' +
      '<button type="button" class="btn-cancel" id="btn-cancel">Huỷ</button></div></div></div>' +
      '<input type="file" id="file-in" accept="image/*" capture="environment" hidden>';

    $("#btn-shoot").onclick = function () {
      $("#file-in").click();
    };
    $("#file-in").onchange = function () {
      var f = this.files && this.files[0];
      if (!f) return;
      photoFile = f;
      resize(f).then(function (d) {
        photoDataUrl = d;
        $("#pick-preview").src = d;
        renderDishes();
        setView("pick");
        $("#search").value = "";
        $("#search").focus();
      });
    };
    $("#search").oninput = renderDishes;
    $("#dish-list").onclick = function (e) {
      var b = e.target.closest(".dish");
      if (!b || !photoDataUrl) return;
      startSent({ ma: b.dataset.ma, ten: b.dataset.ten });
    };
    $("#btn-cancel").onclick = function () {
      if (pending) pending.cancelled = true;
      clearTimeout(cancelTimer);
      clearTimeout(uploadTimer);
      resetFlow();
    };
    var ch = $("#btn-change");
    if (ch) {
      ch.onclick = function () {
        localStorage.removeItem("ketCapQuan");
        location.reload();
      };
    }
  }

  function showVenuePicker() {
    var el = document.createElement("div");
    el.className = "pick-venue";
    el.innerHTML =
      '<h2>Chọn quán</h2>' +
      ['K1', 'K2', 'K5', 'K9']
        .map(function (k) {
          return (
            '<button type="button" class="v-' +
            k.toLowerCase() +
            '" data-q="' +
            k +
            '">' +
            esc(VENUES[k].label) +
            " (" +
            k +
            ")</button>"
          );
        })
        .join("");
    document.body.appendChild(el);
    el.onclick = function (e) {
      var b = e.target.closest("button[data-q]");
      if (!b) return;
      localStorage.setItem("ketCapQuan", b.dataset.q);
      Q = b.dataset.q;
      el.remove();
      init();
    };
  }

  function resolveVenue() {
    if (window.KET_CAP_VENUE) return window.KET_CAP_VENUE;
    if (allowVenuePick) {
      var s = localStorage.getItem("ketCapQuan");
      if (s && VENUES[s]) return s;
      return null;
    }
    return null;
  }

  function init() {
    buildShell();
    loadData().catch(function () {
      /* vẫn cho chụp; danh sách có thể trống */
    });
  }

  Q = resolveVenue();
  if (!Q && allowVenuePick) {
    showVenuePicker();
  } else if (!Q) {
    document.body.innerHTML = '<p style="padding:24px">Thiếu mã quán.</p>';
  } else {
    init();
  }
})();
