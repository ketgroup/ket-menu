(function () {
  "use strict";
  var V = "20261110p";
  var DATA = { K5: {} };

  function normMa(ma) { return String(ma || "").trim().toUpperCase(); }

  function setForQuan(quan, block) {
    if (!quan || !block) return;
    if (!DATA[quan]) DATA[quan] = {};
    if (Array.isArray(block)) {
      block.forEach(function (m) { DATA[quan][normMa(m)] = true; });
      return;
    }
    Object.keys(block).forEach(function (k) { DATA[quan][normMa(k)] = block[k] || true; });
  }

  var loadP = fetch("data/an-mon.json?v=" + V, { cache: "no-store" }).then(function (r) {
    return r.ok ? r.json() : {};
  }).then(function (j) {
    Object.keys(j || {}).forEach(function (k) {
      if (k.charAt(0) === "_" || k === "ghi_chu" || k === "cap_nhat") return;
      setForQuan(k, j[k]);
    });
    return DATA;
  }).catch(function () { return DATA; });

  function hidden(quan, ma) {
    var q = DATA[quan] || {};
    return !!q[normMa(ma)];
  }

  function filterMon(quan, list, pickMa) {
    pickMa = pickMa || function (m) { return m.ma || m.ma_mon || m.id || m.code; };
    return (list || []).filter(function (m) { return !hidden(quan, pickMa(m)); });
  }

  function filterMenuObj(menuByQuan) {
    var out = {};
    Object.keys(menuByQuan || {}).forEach(function (q) {
      var arr = menuByQuan[q];
      out[q] = Array.isArray(arr) ? filterMon(q, arr) : arr;
    });
    return out;
  }

  window.KET_AN_MON = { data: DATA, load: loadP, hidden: hidden, filterMon: filterMon, filterMenuObj: filterMenuObj };
  window.KET_anMonReady = loadP;
  window.KET_isAnMon = hidden;
  window.KET_locMon = filterMon;
})();
