(function(){
 var root=document.documentElement;
 function showAll(){ root.classList.remove("bv-js"); document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");}); }
 try{
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { showAll(); return; }
  function setup(){
   var items=[], side=0;
   var isHome=document.body.classList.contains("page-home");
   function add(el, cls, d){ if (!el || el.classList.contains("bv")) return; el.classList.remove("sd-reveal","sd-in");
     el.classList.add("bv", cls); el.style.setProperty("--bv-d", (d||0)+"ms"); items.push(el); }
   var homeTiles=[];
   function wrapHomeTile(tile){
     var slot, motion;
     if (tile.parentNode && tile.parentNode.classList.contains("the-motion")) {
       motion=tile.parentNode; slot=motion.parentNode;
       if (slot&&slot.classList.contains("bv-slot")) return slot;
     }
     if (tile.parentNode&&tile.parentNode.classList.contains("bv-slot")) slot=tile.parentNode;
     else {
       slot=document.createElement("div");
       slot.className="bv-slot";
       tile.parentNode.insertBefore(slot,tile);
       slot.appendChild(tile);
     }
     motion=slot.querySelector(":scope > .the-motion");
     if (!motion){
       motion=document.createElement("div");
       motion.className="the-motion";
       var inner=slot.querySelector(":scope > .about-venue-tile");
       if (inner){ slot.insertBefore(motion,inner); motion.appendChild(inner); }
     }
     return slot;
   }
   function tileFromSlot(slot){
     var m=slot.querySelector(":scope > .the-motion");
     return m ? m.querySelector(".about-venue-tile") : slot.querySelector(".about-venue-tile");
   }
   function armSettle(tile){
     if (tile._bvSettle) clearTimeout(tile._bvSettle);
     var d=parseInt(String(tile.style.getPropertyValue("--bv-d")||"0").replace("ms",""),10)||0;
     var wait=Math.min(1500, Math.max(750, d+720));
     tile._bvSettle=setTimeout(function(){
       tile.classList.add("bv-in","bv-settled");
     }, wait);
   }
   if (isHome) {
    document.querySelectorAll(".home-venues .about-venue-tile").forEach(function(el,i){
     add(el, (i%2)?"bv-right":"bv-left", i*120);
     homeTiles.push({tile:el, slot:wrapHomeTile(el)});
    });
   } else {
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
   }
   if (isHome) {
    homeTiles.forEach(function(p){ var r=p.slot.getBoundingClientRect(); if (r.top<innerHeight*0.9&&r.bottom>innerHeight*0.12) p.tile.classList.add("bv-now"); });
   } else {
    items.forEach(function(el){ var r=el.getBoundingClientRect(); if (r.top<innerHeight && r.bottom>0) el.classList.add("bv-in","bv-now"); });
   }
   root.classList.add("bv-js");
   requestAnimationFrame(function(){ requestAnimationFrame(function(){
     items.forEach(function(el){ el.classList.remove("bv-now"); });
     if (isHome) homeTiles.forEach(function(p,i){
       var r=p.slot.getBoundingClientRect();
       if (r.top<innerHeight*0.95&&r.bottom>innerHeight*0.05)
         setTimeout(function(){ p.tile.classList.add("bv-in"); armSettle(p.tile); }, 50+i*120);
     });
   }); });
   if (isHome) {
    function showTile(tile, fromTop){
     tile.classList.toggle("bv-top", !!fromTop);
     if (!tile.classList.contains("bv-in")) {
       requestAnimationFrame(function(){ requestAnimationFrame(function(){
         tile.classList.add("bv-in");
         armSettle(tile);
       }); });
     } else armSettle(tile);
    }
    function hideTile(tile){
     var r=tile.closest(".bv-slot").getBoundingClientRect();
     if (r.bottom<0||r.top>innerHeight){
       tile.classList.toggle("bv-top", r.bottom<0);
       tile.classList.remove("bv-in","bv-settled");
       if (tile._bvSettle) clearTimeout(tile._bvSettle);
     }
    }
    function syncHomeVisible(){
     homeTiles.forEach(function(p){
       var r=p.slot.getBoundingClientRect();
       if (r.bottom>2&&r.top<innerHeight-2){
         p.tile.classList.add("bv-in");
         armSettle(p.tile);
       }
     });
    }
    var ioHome=new IntersectionObserver(function(es){ es.forEach(function(e){
     var slot=e.target, tile=tileFromSlot(slot);
     if (!tile) return;
     if (e.isIntersecting){ showTile(tile, e.boundingClientRect.top<0); }
     else hideTile(tile);
    }); }, { threshold:[0,0.05,0.12], rootMargin:"0px 0px 0px 0px" });
    homeTiles.forEach(function(p){ ioHome.observe(p.slot); });
    var syncT=0;
    addEventListener("scroll",function(){ clearTimeout(syncT); syncT=setTimeout(syncHomeVisible,120); },{passive:true});
    addEventListener("scrollend",syncHomeVisible,{passive:true});
    setTimeout(syncHomeVisible,1200);
   } else {
   var ioOpts={ threshold:0, rootMargin:"0px 0px 12% 0px" };
   var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var el=e.target;
     if (e.isIntersecting) el.classList.add("bv-in");
     else if (!el.closest(".apply-shell")) { el.classList.toggle("bv-top", e.boundingClientRect.top < 0); el.classList.remove("bv-in"); }
   }); }, ioOpts);
   items.forEach(function(el){ io.observe(el); });
   }
   document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("is-visible");});
   var apItems=items.filter(function(el){return el.closest(".apply-shell");});
   function apAll(){ apItems.forEach(function(el){el.classList.add("bv-in");}); }
   if (apItems.length){ setTimeout(apAll,1500);
     addEventListener("scroll",function(){ if (innerHeight+scrollY >= document.documentElement.scrollHeight-40) apAll(); },{passive:true}); }
  }
  if (document.readyState==="complete") setup(); else addEventListener("load", setup);
 }catch(e){ showAll(); }
})();
