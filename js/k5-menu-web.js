(function () {
  "use strict";
  if (document.body.getAttribute("data-current-venue") !== "k5") return;
  var root = document.getElementById("k5-menu-web");
  var body = document.getElementById("k5-menu-body");
  var qEl = document.getElementById("k5-menu-q");
  if (!root || !body) return;

  var MENU_ENDPOINT = "https://ket-app.vercel.app/api/menu?quan=K5";
  var MENU_FALLBACK = "data/menu-k5.json?v=20261110p";
  var menu = [];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(n) { return n == null ? "Giá theo quán" : Number(n).toLocaleString("vi-VN").replace(/,/g, ".") + "đ"; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); }
  function normMenu(d) {
    var arr = Array.isArray(d) ? d : (d.mon || d.items || d.data || []);
    return arr.map(function (m) {
      return { ma: m.ma || m.ma_mon || m.id, ten: m.ten || m.ten_mon || m.name, gia: m.gia != null ? Number(m.gia) : (m.price != null ? Number(m.price) : null), nhom: m.nhom || m.group || "Khác" };
    }).filter(function (m) { return m.ma && m.ten; });
  }

  function render() {
    var q = norm((qEl && qEl.value) || "").trim();
    var list = menu.filter(function (m) {
      if (!q) return true;
      var hay = norm(m.ten + " " + m.ma + " " + m.nhom);
      return hay.indexOf(q) >= 0;
    });
    if (!list.length) {
      body.innerHTML = '<p class="k5-menu-empty">' + (q ? "Không thấy món khớp tìm kiếm." : "Menu trống.") + "</p>";
      return;
    }
    var groups = {}, order = [];
    list.forEach(function (m) { if (!groups[m.nhom]) { groups[m.nhom] = []; order.push(m.nhom); } groups[m.nhom].push(m); });
    body.innerHTML = order.map(function (g, i) {
      return '<details class="k5-menu-group"' + (i === 0 ? " open" : "") + '><summary>' + esc(g) + ' <small>(' + groups[g].length + ')</small></summary><ul class="k5-menu-items">' +
        groups[g].map(function (m) {
          return '<li><span class="k5-menu-ten">' + esc(m.ten) + '</span><span class="k5-menu-meta"><code>' + esc(m.ma) + "</code> · " + money(m.gia) + "</span></li>";
        }).join("") + "</ul></details>";
    }).join("");
    var probe = ["bom", "extra caramel", "extra vanilla"];
    if (probe.some(function (p) { return q.indexOf(norm(p)) >= 0; })) {
      body.insertAdjacentHTML("beforeend", '<p class="k5-menu-note">3 món BOM, Extra Caramel, Extra Vanilla đã ẩn khỏi web (Capt không dùng).</p>');
    }
  }

  function loadMenu(raw) {
    menu = window.KET_locMon("K5", normMenu(raw));
    render();
  }

  function fetchJSON(url) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
  }

  Promise.all([
    window.KET_anMonReady,
    fetchJSON(MENU_ENDPOINT).catch(function () { return fetchJSON(MENU_FALLBACK); })
  ]).then(function (res) {
    loadMenu(res[1]);
  }).catch(function () {
    body.innerHTML = '<p class="k5-menu-empty">Không tải được danh sách món.</p>';
  });

  if (qEl) qEl.addEventListener("input", render);
})();
