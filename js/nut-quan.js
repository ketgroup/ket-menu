(function(){try{
 if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
 function bind(){ document.querySelectorAll("#venue-list-home .venue-row").forEach(function(el){
  if (el._nq) return; el._nq=1;
  function mv(e){ var r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
   el.style.setProperty("--ry",((x-.5)*10).toFixed(2)+"deg"); el.style.setProperty("--rx",((.5-y)*12).toFixed(2)+"deg");
   el.style.setProperty("--mx",(x*100)+"%"); el.style.setProperty("--my",(y*100)+"%"); }
  function end(){ el.classList.remove("nq-lift"); el.style.setProperty("--rx","0deg"); el.style.setProperty("--ry","0deg"); }
  el.addEventListener("pointerdown",function(e){el.classList.add("nq-lift");mv(e);},{passive:true});
  el.addEventListener("pointermove",function(e){ if(e.pointerType==="mouse") el.classList.add("nq-lift"); mv(e);},{passive:true});
  ["pointerup","pointercancel","pointerleave"].forEach(function(t){el.addEventListener(t,end);});
 });}
 var root=document.getElementById("venue-list-home"); if(!root) return; bind();
 new MutationObserver(bind).observe(root,{childList:true});
}catch(e){}})();
