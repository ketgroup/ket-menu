/* Dữ liệu sự kiện trang chủ. Thêm sự kiện: thêm 1 object vào mảng KET_EVENTS.
   ten: tên; quan: mã quán; lich: chữ hiện dòng 2; href: link khi bấm; icon: emoji; mau/rgb: màu quán. */
window.KET_EVENTS = [
  { ten: "Latin Dance", quan: "K5", lich: "Thứ 4 & Thứ 6 · Pre-order", href: "pre-order-k5.html", icon: "💃", mau: "#d84cff", rgb: "216,76,255" }
];
(function(){
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function render(){
    var root=document.getElementById("event-strip"); if(!root) return;
    root.innerHTML = window.KET_EVENTS.map(function(e,i){
      return '<a class="event-btn" href="'+esc(e.href)+'" style="--c:'+esc(e.mau)+';--glow:rgba('+esc(e.rgb)+',.38);--d:'+(i*.12)+'s">'+
        '<span class="event-btn-icon" aria-hidden="true">'+esc(e.icon)+'</span><span><b>'+esc(e.ten+" · "+e.quan)+'</b><small>'+esc(e.lich)+'</small></span></a>';
    }).join("");
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",render); else render();
})();
