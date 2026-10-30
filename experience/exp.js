(function(){
var V=window.KET_VENUES||{},O=window.KET_VENUE_ORDER||["k1","k2","k5","k9"];
var MAU={k1:"#FFC300",k2:"#FFFFFF",k5:"#BF5AF2",k9:"#FF2A1F"};
var ANH={k1:"k1-1.jpg",k2:"k2-1.jpg",k5:"k5-douong-1.jpg",k9:"k9-1.jpg"};
var tr=document.getElementById("truyen"),nq=document.getElementById("nutquan");
O.forEach(function(id){var v=V[id];if(!v)return;
  var d=document.createElement("a");d.className="o-quan";d.href="../"+v.href;
  d.innerHTML='<img class="anh" src="../img/'+ANH[id]+'" alt=""><div class="phu" style="background:'+MAU[id]+'"></div><img class="logo" src="../'+v.logo+'" alt=""><div class="the"><b>'+v.code+' · '+v.title+'</b>'+v.tagline+'<br>'+v.hours.join(" · ")+'</div>';
  tr.appendChild(d);
  var a=document.createElement("a");a.href="../"+v.href;a.style.background=MAU[id];a.textContent=v.code+" · "+v.title;nq.appendChild(a);
});
var ct=document.getElementById("contro");
addEventListener("pointermove",function(e){if(e.pointerType!=="mouse")return;ct.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)";});
document.querySelectorAll("a,.rot").forEach(function(el){el.addEventListener("pointerenter",function(){ct.classList.add("to")});el.addEventListener("pointerleave",function(){ct.classList.remove("to")});});
var cv=document.getElementById("nhieu"),cx=cv.getContext("2d");cv.width=120;cv.height=220;
var nhieuOn=0;
function veNhieu(){if(nhieuOn>0.01){var im=cx.createImageData(120,220),p=im.data;
  for(var y=0;y<220;y++){var soc=Math.random()<.18?(Math.random()<.5?0:255):-1;
    for(var x=0;x<120;x++){var i=(y*120+x)*4,c=soc>=0?soc:(Math.random()<.5?0:255);p[i]=p[i+1]=p[i+2]=c;p[i+3]=255;}}
  cx.putImageData(im,0,0);}cv.style.opacity=nhieuOn;requestAnimationFrame(veNhieu);}
veNhieu();
if(!window.gsap||!window.ScrollTrigger){return;}
gsap.registerPlugin(ScrollTrigger);
function pin(id,tl,len){ScrollTrigger.create({trigger:id,start:"top top",end:"+="+len,pin:true,scrub:0.6,animation:tl});}
var t1=gsap.timeline();
t1.to("#c1 .thanhpho",{yPercent:12,scale:1.1,ease:"none"},0).to("#c1 .nhanvat",{xPercent:-30,scale:1.25,ease:"none"},0)
  .to("#c1 .nen",{yPercent:-6,ease:"none"},0).to("#c1 .chu",{y:-120,ease:"none"},0);
pin("#c1",t1,"120%");
var t2=gsap.timeline();
t2.from("#c2 .o-thoai",{scale:0,stagger:.1,ease:"back.out(2)"},0).to("#ke",{scale:3.4,y:"8%",ease:"power1.in"},.2)
  .to("#c2 .chu",{y:-200,opacity:0,ease:"none"},.3).to("#ke",{scale:7,ease:"power2.in"},.75);
pin("#c2",t2,"150%");
var t3=gsap.timeline();
t3.from(".o-quan",{scale:.2,rotation:function(i){return i%2?8:-8},opacity:0,stagger:.2,ease:"back.out(1.6)"})
  .to(".o-quan img.anh",{yPercent:-8,ease:"none"},0).to(".o-quan .the",{y:-10,ease:"none"},0);
pin("#c3",t3,"160%");
["#c2","#c3","#c4","#c5"].forEach(function(id){ScrollTrigger.create({trigger:id,start:"top 85%",end:"top 15%",
  onUpdate:function(s){nhieuOn=Math.sin(s.progress*Math.PI)*.95;},onLeave:function(){nhieuOn=0},onLeaveBack:function(){nhieuOn=0}});});
gsap.from("#c4 .rot",{scrollTrigger:{trigger:"#c4",start:"top 80%",end:"top 20%",scrub:.5},y:200,scale:.7});
gsap.from(".nut-quan a",{scrollTrigger:{trigger:"#c5",start:"top 70%"},y:60,opacity:0,stagger:.08,ease:"back.out(2)"});
})();
(function(){
var rot=document.getElementById("rot"),chai=document.getElementById("chairot"),dong=document.getElementById("dong"),
ruou=document.getElementById("ruou"),giot=document.getElementById("giot"),loi=document.getElementById("loirot");
var dangRot=false,muc=0,goc=0,dai=0,NS="http://www.w3.org/2000/svg",hat=[];
function bat(e){e.preventDefault();dangRot=true;try{rot.setPointerCapture(e.pointerId)}catch(_){}}
function tat(){dangRot=false;}
rot.addEventListener("pointerdown",bat);rot.addEventListener("pointerup",tat);rot.addEventListener("pointercancel",tat);rot.addEventListener("lostpointercapture",tat);
rot.addEventListener("contextmenu",function(e){e.preventDefault()});
rot.addEventListener("touchstart",function(e){e.preventDefault()},{passive:false});
function lap(){
  goc+=((dangRot?180:0)-goc)*.14;chai.setAttribute("transform","rotate("+goc+" 150 100)");
  var dich=dangRot&&goc>165?220:0;dai+=(dich-dai)*.25;
  dong.setAttribute("height",Math.max(0,dai-muc));
  if(dai>150&&muc<88){muc+=.35;
    if(Math.random()<.5){var c=document.createElementNS(NS,"circle");c.setAttribute("r",2+Math.random()*4);c.setAttribute("fill","#FFC300");c.setAttribute("stroke","#000");
      giot.appendChild(c);hat.push({el:c,x:150,y:420-muc,vx:(Math.random()-.5)*6,vy:-2-Math.random()*4,s:0});}}
  hat=hat.filter(function(h){h.vy+=.35;h.x+=h.vx;h.y+=h.vy;h.s++;h.el.setAttribute("cx",h.x);h.el.setAttribute("cy",h.y);
    if(h.s>40){h.el.remove();return false}return true;});
  ruou.setAttribute("y",420-muc);ruou.setAttribute("height",muc);
  loi.textContent=muc>=88?"ĐẦY LY! CẠN THÔI.":(dangRot?"ĐANG RÓT…":"GIỮ ĐỂ RÓT");
  requestAnimationFrame(lap);}
lap();
})();
