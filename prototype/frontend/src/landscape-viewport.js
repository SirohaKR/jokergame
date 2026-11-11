// Landscape phones: lay the page out on a 1280px-wide viewport so the PC lobby
// (lobby-style.css) is used and scaled to fit, instead of the portrait mobile layout.
(()=>{
 const meta=document.querySelector('meta[name="viewport"]');if(!meta)return;
 const portrait='width=device-width, initial-scale=1',landscape='width=1280';
 const apply=()=>{
  const short=Math.min(screen.width,screen.height);
  const isPhoneLandscape=matchMedia('(orientation: landscape) and (pointer: coarse)').matches&&short<600;
  const next=isPhoneLandscape?landscape:portrait;
  if(meta.content!==next)meta.content=next;
  document.documentElement.classList.toggle('phone-landscape',isPhoneLandscape);
 };
 apply();
 addEventListener('orientationchange',()=>setTimeout(apply,50));
 matchMedia('(orientation: landscape)').addEventListener?.('change',apply);
})();
