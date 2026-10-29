(function(){
 var sh=document.getElementById("qr-sheet"); if(!sh) return;
 var panel=sh.querySelector(".qr-panel"), last;
 function open(b){ last=b; var row=b.closest(".review-row");
  panel.style.setProperty("--c", row.style.getPropertyValue("--c")); panel.style.setProperty("--rgb", row.style.getPropertyValue("--rgb"));
  document.getElementById("qr-kind").textContent="Đánh giá trên "+b.dataset.kind;
  document.getElementById("qr-title").textContent=b.dataset.title;
  document.getElementById("qr-img").src=b.dataset.qr;
  document.getElementById("qr-open").href=b.dataset.url;
  sh.classList.remove("closing"); sh.hidden=false; document.body.style.overflow="hidden"; sh.querySelector(".qr-open").focus({preventScroll:true}); }
 function close(){ sh.classList.add("closing"); setTimeout(function(){ sh.hidden=true; sh.classList.remove("closing"); document.body.style.overflow=""; if(last) last.focus(); }, 240); }
 document.querySelectorAll(".review-btn").forEach(function(b){ b.addEventListener("click", function(){ open(b); }); });
 sh.querySelectorAll("[data-close]").forEach(function(el){ el.addEventListener("click", close); });
 document.addEventListener("keydown", function(e){ if(e.key==="Escape" && !sh.hidden) close(); });
})();
