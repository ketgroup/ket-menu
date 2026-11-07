/* Dữ liệu sự kiện trang chủ. Thêm sự kiện: thêm 1 object vào mảng KET_EVENTS.
   thu: ngày trong tuần theo giờ VN (0=CN … 6=T7) hoặc "moi" = mỗi ngày, dùng cho khung HÔM NAY; ten: tên; quan: mã quán; lich: chữ hiện dòng 2; href: link khi bấm; icon: emoji; mau/rgb: màu quán.
   chiTiet: dòng chi tiết trong sheet (nếu trống thì dùng lich). menuHref: nút Xem menu trong sheet. */
window.KET_EVENTS = [
  {
    thu: [5],
    ten: "KET FAI Social Dance Night",
    quan: "Kết Fai",
    lich: "Thứ 6 · Bachata & Zouk · Vào cửa miễn phí",
    href: "pre-order-k5.html",
    menuHref: "k5.html",
    preorder: true,
    freeEntry: true,
    icon: "💃",
    mau: "#d84cff",
    rgb: "216,76,255",
    chiTiet: [
      "Vào cửa miễn phí",
      "Bachata & Zouk · 21:30–23:30",
      "Pre-order (tùy chọn): mỗi 1 cocktail Signature/Classic được chọn 1 món free — Wine, Coconut, Soft drink, 1 Tiger (bia), hoặc 3 chai nước suối",
      "Quán gọi lại xác nhận đơn pre-order"
    ]
  },
  { thu: [5], ten: "Ladies Night", quan: "Kết Underground", lich: "Thứ 6 · Mua 1 tặng 1 cocktail", href: "k9.html", menuHref: "k9.html", icon: "💋", mau: "#FF453A", rgb: "255,69,58" },
  { thu: [2], ten: "You Are Bartender", quan: "Kết Bar", lich: "Thứ 3 · Vào quầy tự pha, giảm 50% ly đó", href: "k1.html", menuHref: "k1.html", icon: "🍸", mau: "#FF9F0A", rgb: "255,159,10" },
  { thu: [3], ten: "Extra Happy Hour", quan: "Kết High", lich: "Thứ 4 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k2.html", menuHref: "k2.html", icon: "🎧", mau: "#F2F2F7", rgb: "242,242,247" },
  { thu: [0], ten: "Extra Happy Hour", quan: "Kết Fai", lich: "Chủ nhật · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k5.html", menuHref: "k5.html", icon: "🎧", mau: "#BF5AF2", rgb: "191,90,242" },
  {
    thu: [3],
    ten: "Latin dance",
    quan: "Kết Fai",
    lich: "Thứ 4 · Kizomba & Bachata · Vào cửa miễn phí",
    href: "k5.html",
    menuHref: "k5.html",
    freeEntry: true,
    icon: "💃",
    mau: "#BF5AF2",
    rgb: "191,90,242",
    chiTiet: [
      "Vào cửa miễn phí",
      "19:30–21:30 Kizomba · 21:30–23:30 Bachata & Salsa",
      "Mua 1 cocktail/mocktail tặng 1: wine, dừa (Coconut), 3 nước suối, hoặc 1 Tiger"
    ]
  },
  { thu: [6], ten: "Extra Happy Hour", quan: "Kết Underground", lich: "Thứ 7 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k9.html", menuHref: "k9.html", icon: "🎧", mau: "#FF453A", rgb: "255,69,58" },
  { thu: "moi", ten: "Happy Hour", quan: "Tất cả các quán", lich: "Mỗi ngày 19:30–20:30 · Buy 1 round get 1 round", href: "#venue-list-home-wrap", icon: "🥂", mau: "#30D158", rgb: "48,209,88" },
  { thu: "moi", ten: "Giảm 15%", quan: "Tất cả các quán", lich: "Mỗi ngày · Phi công / tiếp viên / bartender (xuất trình ID hoặc trang cá nhân)", href: "#venue-list-home-wrap", icon: "✈️", mau: "#64D2FF", rgb: "100,210,255" }
];
(function(){
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function render(){
    var root=document.getElementById("event-strip"); if(!root) return;
    root.classList.toggle('one', window.KET_EVENTS.length===1);
    root.innerHTML = window.KET_EVENTS.map(function(e,i){
      var tags = '';
      if (e.freeEntry) tags += '<span class="event-tag event-tag--free">Vào cửa miễn phí</span>';
      if (e.preorder) tags += '<span class="event-tag event-tag--po">Pre-order ›</span>';
      var cls = 'event-btn' + (e.preorder ? ' has-preorder' : '') + (e.freeEntry ? ' has-free' : '');
      return '<a data-ev="'+i+'" class="'+cls+'" href="#" style="--c:'+esc(e.mau)+';--glow:rgba('+esc(e.rgb)+',.38);--d:'+(i*.12)+'s">'+
        tags+'<span class="event-btn-icon" aria-hidden="true">'+esc(e.icon)+'</span><span class="event-btn-text"><b>'+esc(e.ten+" · "+e.quan)+'</b><small>'+esc(e.lich)+'</small></span></a>';
    }).join("");
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",render); else render();
})();
