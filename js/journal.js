(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.draw path,.draw circle').forEach(function(p){try{p.style.setProperty('--len',Math.ceil(p.getTotalLength())+2)}catch(e){}});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add(e.target.classList.contains('draw')?'on':'in');io.unobserve(e.target)}})},{threshold:.2});
document.querySelectorAll('.draw,.reveal').forEach(function(el){if(reduce){el.classList.add('on','in')}else io.observe(el)});
var hero=document.getElementById('hero'),ph=document.querySelector('.hero-photo'),sk=document.querySelector('.hero-sketch');
function onScroll(){var t=Math.min(1,Math.max(0,scrollY/(hero.offsetHeight-innerHeight)));ph.style.opacity=t*.9;ph.style.filter='brightness('+(.4+t*.6)+') sepia('+(.3-t*.2)+')';sk.style.opacity=1-t}
addEventListener('scroll',onScroll,{passive:true});onScroll();
document.querySelectorAll('.flip').forEach(function(f){f.addEventListener('click',function(){f.classList.toggle('flipped')});f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();f.classList.toggle('flipped')}})});
var d=document.getElementById('notebook');
document.querySelectorAll('.person').forEach(function(b){b.addEventListener('click',function(){var g=d.querySelector('.draw');g.classList.remove('on');d.showModal();requestAnimationFrame(function(){requestAnimationFrame(function(){g.classList.add('on')})})})});
d.addEventListener('click',function(e){if(e.target===d)d.close()});
})();
