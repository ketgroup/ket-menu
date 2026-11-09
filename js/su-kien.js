/* Dữ liệu sự kiện trang chủ. K5 Latin Dance: một thẻ Thứ 4 & Thứ 6 (không tách Social / Latin). Thêm sự kiện: thêm 1 object vào mảng KET_EVENTS.
   thu: ngày trong tuần theo giờ VN (0=CN … 6=T7) hoặc "moi" = mỗi ngày, dùng cho khung HÔM NAY; ten: tên; quan: mã quán; lich: chữ hiện dòng 2; href: link khi bấm; icon: emoji; mau/rgb: màu quán. */
window.KET_EVENTS = [
  { thu: [3, 5], ten: "Latin Dance", quan: "Kết Fai", lich: "Thứ 4 & Thứ 6", href: "pre-order-k5.html", preorder: true, freeEntry: true, badgeRow: true, icon: "💃", mau: "#d84cff", rgb: "216,76,255" },
  { thu: [5], ten: "Ladies Night", quan: "Kết Underground", lich: "Thứ 6 · Mua 1 tặng 1 cocktail", href: "k9.html", icon: "💋", mau: "#FF453A", rgb: "255,69,58" },
  { thu: [2], ten: "You Are Bartender", quan: "Kết Bar", lich: "Thứ 3 · Vào quầy tự pha, giảm 50% ly đó", href: "k1.html", icon: "🍸", mau: "#FF9F0A", rgb: "255,159,10" },
  { thu: [3], ten: "Extra Happy Hour", quan: "Kết High", lich: "Thứ 4 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k2.html", icon: "🎧", mau: "#F2F2F7", rgb: "242,242,247" },
  { thu: [0], ten: "Extra Happy Hour", quan: "Kết Fai", lich: "Chủ nhật · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k5.html", icon: "🎧", mau: "#BF5AF2", rgb: "191,90,242" },
  { thu: [6], ten: "Extra Happy Hour", quan: "Kết Underground", lich: "Thứ 7 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k9.html", icon: "🎧", mau: "#FF453A", rgb: "255,69,58" },
  { thu: "moi", ten: "Happy Hour", quan: "Tất cả các quán", lich: "Mỗi ngày 19:30–20:30 · Buy 1 round get 1 round", href: "#venue-list-home-wrap", icon: "🥂", mau: "#30D158", rgb: "48,209,88" },
  { thu: "moi", ten: "Giảm 15%", quan: "Tất cả các quán", lich: "Mỗi ngày · Phi công / tiếp viên / bartender (xuất trình ID hoặc trang cá nhân)", href: "#venue-list-home-wrap", icon: "✈️", mau: "#64D2FF", rgb: "100,210,255", teaserOnly: true }
];
(function(){
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function tagHtml(e){
    if (e.badgeRow && e.freeEntry && e.preorder) {
      return '<span class="event-badge-row">' +
        '<span class="event-tag event-tag--free">Free entry</span>' +
        '<span class="event-tag event-tag--po">Pre-order ›</span></span>';
    }
    var inner = "";
    if (e.freeEntry) inner += '<span class="event-tag event-tag--free">Vào cửa miễn phí</span>';
    if (e.preorder) inner += '<span class="event-tag event-tag--po">Pre-order ›</span>';
    if (!inner) return "";
    return '<span class="event-tags">' + inner + "</span>";
  }
  function badgeCls(e){
    if (e.badgeRow) return " has-badge-row";
    return e.freeEntry || e.preorder ? " has-event-tags" : "";
  }
  function render(){
    var root=document.getElementById("event-strip"); if(!root) return;
    var stripEvs = window.KET_EVENTS.filter(function(e){ return !e.teaserOnly; });
    root.classList.toggle('one', stripEvs.length===1);
    root.innerHTML = window.KET_EVENTS.map(function(e,i){
      if (e.teaserOnly) return "";
      return '<a data-ev="'+i+'" class="event-btn'+badgeCls(e)+'" href="'+esc(e.href)+'" style="--c:'+esc(e.mau)+';--glow:rgba('+esc(e.rgb)+',.38);--d:'+(i*.12)+'s">'+
        tagHtml(e)+'<span class="event-btn-icon" aria-hidden="true">'+esc(e.icon)+'</span><span class="event-btn-text"><b>'+esc(e.ten+" · "+e.quan)+'</b><small>'+esc(e.lich)+'</small></span></a>';
    }).join("");
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",render); else render();
})();
