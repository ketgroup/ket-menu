(function(){
 var root=document.documentElement;
 function showAll(){ root.classList.remove("bv-js"); document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");}); }
 try{
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { showAll(); return; }
  function setup(){
   var items=[], side=0;
   function add(el, cls, d){ if (!el || el.classList.contains("bv")) return; el.classList.remove("sd-reveal","sd-in");
     el.classList.add("bv", cls); el.style.setProperty("--bv-d", (d||0)+"ms"); items.push(el); }
   // khối lớn xen kẽ trái/phải, nội dung bên trong từ dưới lên so le
   document.querySelectorAll(".about-block-inner, .form-section, .apply-intro").forEach(function(b){
     add(b, (side++%2) ? "bv-right" : "bv-left", 0);
   });
   document.querySelectorAll(".about-block-inner > *, .form-stack > *, .field, .apply-submit, .site-footer").forEach(function(el){
     if (el.classList.contains("bv")) return;
     var sib=[].indexOf.call(el.parentNode.children, el);
     add(el, el.classList.contains("about-venue-tile") ? ((sib%2)?"bv-right":"bv-left") : "bv-up", 120 + Math.min(sib,6)*90);
   });
   document.querySelectorAll(".about-venue-tile").forEach(function(el,i){ add(el, (i%2)?"bv-right":"bv-left", 120+i*110); });
   items.forEach(function(el){ var r=el.getBoundingClientRect(); if (r.top<innerHeight && r.bottom>0) el.classList.add("bv-in","bv-now"); });
   root.classList.add("bv-js");
   requestAnimationFrame(function(){ requestAnimationFrame(function(){ items.forEach(function(el){el.classList.remove("bv-now");}); }); });
   var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var el=e.target;
     if (e.isIntersecting) el.classList.add("bv-in");
     else { el.classList.toggle("bv-top", e.boundingClientRect.top < 0); el.classList.remove("bv-in"); }
   }); }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
   items.forEach(function(el){ io.observe(el); });
   document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");});
  }
  if (document.readyState==="complete") setup(); else addEventListener("load", setup);
 }catch(e){ showAll(); }
})();
