/* Dữ liệu sự kiện trang chủ. Thêm sự kiện: thêm 1 object vào mảng KET_EVENTS.
   ten: tên; quan: mã quán; lich: chữ hiện dòng 2; href: link khi bấm; icon: emoji; mau/rgb: màu quán. */
window.KET_EVENTS = [
  { ten: "Latin Dance", quan: "K5", lich: "Thứ 4 & Thứ 6 · Pre-order", href: "pre-order-k5.html", icon: "💃", mau: "#d84cff", rgb: "216,76,255" },
  { ten: "Ladies Night", quan: "K9", lich: "Thứ 6 · Mua 1 tặng 1 cocktail · DJ Minh", href: "k9.html", icon: "💋", mau: "#FF453A", rgb: "255,69,58" },
  { ten: "You Are Bartender", quan: "K1", lich: "Thứ 3 · Vào quầy tự pha, giảm 50% ly đó", href: "k1.html", icon: "🍸", mau: "#FF9F0A", rgb: "255,159,10" },
  { ten: "Extra Happy Hour", quan: "K2", lich: "Thứ 4 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k2.html", icon: "🎧", mau: "#F2F2F7", rgb: "242,242,247" },
  { ten: "Extra Happy Hour", quan: "K5", lich: "Chủ nhật · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k5.html", icon: "🎧", mau: "#BF5AF2", rgb: "191,90,242" },
  { ten: "Extra Happy Hour", quan: "K9", lich: "Thứ 7 · Mua 1 tặng 1 tới 21:30 · DJ Minh", href: "k9.html", icon: "🎧", mau: "#FF453A", rgb: "255,69,58" },
  { ten: "Happy Hour", quan: "K1 · K2 · K5 · K9", lich: "Mỗi ngày 19:30–20:30 · Buy 1 round get 1 round", href: "#venue-list-home", icon: "🥂", mau: "#30D158", rgb: "48,209,88" }
];
(function(){
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function render(){
    var root=document.getElementById("event-strip"); if(!root) return;
    root.classList.toggle('one', window.KET_EVENTS.length===1);
    root.innerHTML = window.KET_EVENTS.map(function(e,i){
      return '<a class="event-btn" href="'+esc(e.href)+'" style="--c:'+esc(e.mau)+';--glow:rgba('+esc(e.rgb)+',.38);--d:'+(i*.12)+'s">'+
        '<span class="event-btn-icon" aria-hidden="true">'+esc(e.icon)+'</span><span><b>'+esc(e.ten+" · "+e.quan)+'</b><small>'+esc(e.lich)+'</small></span></a>';
    }).join("");
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",render); else render();
})();
