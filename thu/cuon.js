(function(){
 // Bản thử: chặn gửi form thật
 window.addEventListener("submit", function(e){ e.preventDefault(); e.stopImmediatePropagation();
   var n=document.createElement("div"); n.className="cv-test-note"; n.textContent="Bản thử – không gửi";
   document.body.appendChild(n); setTimeout(function(){n.remove();},3000); }, true);
 try{
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");}); return; }
  function setup(){
   var root=document.documentElement;
   var SEL=".about-venue-tile, .about-block-inner > *, .form-section-title, .field, .apply-submit, .site-footer, .inset-group";
   var items=[].slice.call(document.querySelectorAll(".reveal"));
   document.querySelectorAll(SEL).forEach(function(el){
     if (el.closest(".ios-nav")||el.closest(".ios-tab-bar")) return;
     if (items.some(function(p){return p!==el && p.contains(el);})) { el.classList.add("cv-item"); items.push(el); return; }
     el.classList.add("cv-item"); items.push(el);
   });
   items.forEach(function(el){ el.classList.remove("sd-reveal","sd-in"); var r=el.getBoundingClientRect();
     if (r.top<innerHeight && r.bottom>0) el.classList.add("is-visible"); });
   root.classList.add("cv-js");
   var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var el=e.target;
     if (e.isIntersecting) { el.classList.add("is-visible"); }
     else { el.classList.toggle("cv-from-top", e.boundingClientRect.top < 0); el.classList.remove("is-visible"); }
   }); }, { threshold: 0.06 });
   items.forEach(function(el){ io.observe(el); });
  }
  if (document.readyState==="complete") setup(); else addEventListener("load", setup);
 }catch(e){ document.documentElement.classList.remove("cv-js"); document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");}); }
})();
