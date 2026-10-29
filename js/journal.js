(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
// lazy images
var lio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=e.target;i.src=i.dataset.src;lio.unobserve(i)}})},{rootMargin:'600px'});
$$('img[data-src]').forEach(function(i){i.decoding='async';lio.observe(i)});
var vio=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){if(!v.src){v.src=v.dataset.src}if(!reduce){var p=v.play();p&&p.catch(function(){})}}else if(v.src)v.pause()})},{rootMargin:'200px'});
$$('video.lzv').forEach(function(v){vio.observe(v)});
// draw lengths
$$('.draw path,.draw circle').forEach(function(p){try{p.style.setProperty('--len',Math.ceil(p.getTotalLength())+2)}catch(e){}});
var dio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');dio.unobserve(e.target)}})},{threshold:.3});
$$('.draw').forEach(function(d){reduce?d.classList.add('on'):dio.observe(d)});
// notebook
var nb=$('#nb');$$('.person').forEach(function(b){b.addEventListener('click',function(){nb.showModal()})});
nb.addEventListener('click',function(e){if(e.target===nb)nb.close()});
function setCounts(){$$('.stat b[data-n]').forEach(function(b){b.textContent=b.dataset.n})}
if(reduce||!window.gsap||!window.ScrollTrigger){document.documentElement.classList.add('reduce');setCounts();$$('img[data-src]').forEach(function(i){i.src=i.dataset.src});$('.z2').style.opacity=1;return}
gsap.registerPlugin(ScrollTrigger);
var mob=innerWidth<860;
// hero
gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=100%',scrub:.6,pin:true}})
 .to('.hero-txt',{scale:.6,opacity:0,y:-60,transformOrigin:'left center',ease:'none'},0)
 .to('.hero-obj',{x:mob?160:'40vw',y:mob?-260:-120,rotate:35,opacity:0,ease:'none'},0)
 .to('.scroll-hint',{opacity:0},0);
gsap.to('.glass',{rotate:6,yoyo:true,repeat:-1,duration:3,ease:'sine.inOut',transformOrigin:'50% 80%'});
// counters
$$('.stat b[data-n]').forEach(function(b){var o={v:0};gsap.to(o,{v:+b.dataset.n,duration:1.6,ease:'power2.out',scrollTrigger:{trigger:b,start:'top 85%'},onUpdate:function(){b.textContent=Math.round(o.v)}})});
gsap.utils.toArray('.stat').forEach(function(s){gsap.from(s,{y:40,opacity:0,duration:.8,scrollTrigger:{trigger:s,start:'top 90%'}})});
// process
var st=$$('.steps li');
gsap.set('#stream',{strokeDasharray:120,strokeDashoffset:120});gsap.set('#pour',{strokeDasharray:60,strokeDashoffset:60,opacity:0});gsap.set('#garnish',{opacity:0,y:-30});gsap.set('#fill',{y:0});
var pt=gsap.timeline({scrollTrigger:{trigger:'.process',start:'top top',end:'+=300%',scrub:.5,pin:true,onUpdate:function(s){var k=Math.min(3,Math.floor(s.progress*4));st.forEach(function(l,i){l.classList.toggle('on',i===k)})}}});
pt.to('#bottle',{rotate:-70,x:30,y:20,transformOrigin:'50% 30%',duration:1})
  .to('#stream',{strokeDashoffset:0,duration:.6},'-=.4')
  .to('#stream',{opacity:0,duration:.3})
  .to('#bottle',{rotate:0,x:-40,opacity:.25,duration:.5},'<')
  .to('#shaker',{rotate:18,yoyo:true,repeat:5,duration:.18,transformOrigin:'50% 50%',ease:'sine.inOut'})
  .to('.ice rect',{y:-10,yoyo:true,repeat:5,duration:.18,stagger:.03},'<')
  .to('#shaker',{rotate:40,x:-6,duration:.4,transformOrigin:'50% 50%'})
  .to('#pour',{opacity:1,strokeDashoffset:0,duration:.3},'<.2')
  .to('#fill',{y:-90,duration:1})
  .to('#pour',{opacity:0,duration:.2})
  .to('#shaker',{rotate:0,x:0,opacity:.25,duration:.4},'<')
  .to('#garnish',{opacity:1,y:0,duration:.5,ease:'back.out(2)'});
// lab horizontal
var tr=$('.track'),cards=$$('.card');
function mid(){var c=innerWidth/2;cards.forEach(function(k){var r=k.getBoundingClientRect();k.classList.toggle('mid',r.left<c&&r.right>c)})}
gsap.to(tr,{x:function(){return -(tr.scrollWidth-innerWidth)},ease:'none',scrollTrigger:{trigger:'.lab',start:'top top',end:function(){return '+='+(tr.scrollWidth-innerWidth)},scrub:.5,pin:true,invalidateOnRefresh:true,onUpdate:mid,onEnter:mid}});
mid();
// infinite zoom
gsap.timeline({scrollTrigger:{trigger:'.zoom',start:'top top',end:'+=220%',scrub:.6,pin:true}})
 .fromTo('.z1',{scale:1},{scale:7,ease:'power2.in',duration:1})
 .to('.zt1',{opacity:0,y:-40,duration:.4},0.3)
 .to('.z1',{opacity:0,duration:.3},.8)
 .fromTo('.z2',{scale:2.6,opacity:0},{scale:1,opacity:1,duration:1,ease:'power2.out'},.8)
 .to('.zt2',{opacity:1,y:-20,duration:.4},1.3);
// recipe pages + bp reveal
gsap.utils.toArray('.bp,.page,.person,.strip figure').forEach(function(e){gsap.from(e,{y:40,opacity:0,duration:.7,ease:'power2.out',scrollTrigger:{trigger:e,start:'top 92%'}})});
// outro mask
gsap.set('.foot',{yPercent:100});
gsap.timeline({scrollTrigger:{trigger:'.outro',start:'top top',end:'+=150%',scrub:.6,pin:true}})
 .fromTo('.mask',{scale:1},{scale:9,ease:'power2.in',duration:1})
 .to('.foot',{yPercent:0,duration:.6,ease:'power2.out'},.55)
 .from('.big',{y:80,opacity:0,duration:.4},.85);
// smoke canvas (cheap, only animates for ~1.4s on section change)
var cv=$('#smoke'),cx=cv.getContext('2d'),W,H,dpr=Math.min(devicePixelRatio,1.5),run=0,parts=[];
function size(){W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr}size();addEventListener('resize',size);
var spr=document.createElement('canvas');spr.width=spr.height=128;var sx=spr.getContext('2d'),g=sx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(230,200,170,.35)');g.addColorStop(1,'rgba(230,200,170,0)');sx.fillStyle=g;sx.fillRect(0,0,128,128);
var last=0;
function puff(){var n=performance.now();if(n-last<900)return;last=n;parts=[];for(var i=0;i<14;i++)parts.push({x:-0.3*W+Math.random()*W*.4,y:Math.random()*H,r:(.25+Math.random()*.35)*Math.max(W,H),v:(.9+Math.random()*.6)*W/60});if(!run){run=1;gsap.to(cv,{opacity:.55,duration:.3});requestAnimationFrame(tick)}gsap.to(cv,{opacity:0,duration:.8,delay:.9,onComplete:function(){run=0}})}
function tick(){if(!run){cx.clearRect(0,0,W,H);return}cx.clearRect(0,0,W,H);parts.forEach(function(p){p.x+=p.v;cx.drawImage(spr,p.x-p.r,p.y-p.r,p.r*2,p.r*2)});requestAnimationFrame(tick)}
// background colour transitions
$$('section[data-bg]').forEach(function(s){ScrollTrigger.create({trigger:s,start:'top 55%',end:'bottom 55%',onToggle:function(st){if(st.isActive){gsap.to('body',{backgroundColor:s.dataset.bg,duration:.8,overwrite:'auto'});puff()}}})});
addEventListener('load',function(){ScrollTrigger.refresh()});
})();
