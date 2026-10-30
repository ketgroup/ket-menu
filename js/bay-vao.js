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
   document.querySelectorAll(".about-block-inner").forEach(function(b){
     add(b, (side++%2) ? "bv-right" : "bv-left", 0);
   });
   document.querySelectorAll(".about-block-inner > *, .site-footer").forEach(function(el){
     if (el.classList.contains("bv")) return;
     var sib=[].indexOf.call(el.parentNode.children, el);
     add(el, el.classList.contains("about-venue-tile") ? ((sib%2)?"bv-right":"bv-left") : "bv-up", 120 + Math.min(sib,6)*90);
   });
   var ap=document.querySelectorAll(".apply-intro, .apply-form .form-section, .apply-form .form-section-title, .apply-form .field, .apply-form .form-note");
   ap.forEach(function(el,i){ if (el.closest(".bv")&&!el.matches(".form-section")) { add(el,"bv-up",80+(i%4)*70); return; } add(el,(side++%2)?"bv-right":"bv-left",0); });
   document.querySelectorAll(".about-venue-tile").forEach(function(el,i){ add(el, (i%2)?"bv-right":"bv-left", 120+i*110); });
   items.forEach(function(el){ var r=el.getBoundingClientRect(); if (r.top<innerHeight && r.bottom>0) el.classList.add("bv-in","bv-now"); });
   root.classList.add("bv-js");
   requestAnimationFrame(function(){ requestAnimationFrame(function(){ items.forEach(function(el){el.classList.remove("bv-now");}); }); });
   var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var el=e.target;
     if (e.isIntersecting) el.classList.add("bv-in");
     else if (!el.closest(".apply-shell")) { el.classList.toggle("bv-top", e.boundingClientRect.top < 0); el.classList.remove("bv-in"); }
   }); }, { threshold: 0, rootMargin: "0px 0px 12% 0px" });
   items.forEach(function(el){ io.observe(el); });
   document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");});
   var apItems=items.filter(function(el){return el.closest(".apply-shell");});
   function apAll(){ apItems.forEach(function(el){el.classList.add("bv-in");}); }
   if (apItems.length){ setTimeout(apAll,1500);
     addEventListener("scroll",function(){ if (innerHeight+scrollY >= document.documentElement.scrollHeight-40) apAll(); },{passive:true}); }
  }
  if (document.readyState==="complete") setup(); else addEventListener("load", setup);
 }catch(e){ showAll(); }
})();
