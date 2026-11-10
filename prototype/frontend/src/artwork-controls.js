import {icon} from './lobby-ui.js';

const STORAGE_KEY='last-one-artwork-layouts-v1';
export const DEFAULT_ARTWORK_LAYOUT=Object.freeze({x:0,y:0,scale:100});
const clamp=(value,min,max,fallback)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
export function normalizeArtworkLayout(value){
 return {x:clamp(value?.x,-40,40,0),y:clamp(value?.y,-40,40,0),scale:clamp(value?.scale,60,160,100)};
}
export function readArtworkLayouts(storage){
 try{
  const data=JSON.parse(storage.getItem(STORAGE_KEY));
  if(data?.version!==1||!data.layouts||Array.isArray(data.layouts)||typeof data.layouts!=='object')return {};
  return Object.fromEntries(Object.entries(data.layouts).filter(([key])=>/^home:[a-z0-9_-]+:(desktop|mobile)$/.test(key)).map(([key,value])=>[key,normalizeArtworkLayout(value)]));
 }catch{return {};}
}
export function saveArtworkLayout(storage,key,value){
 try{const layouts=readArtworkLayouts(storage);layouts[key]=normalizeArtworkLayout(value);storage.setItem(STORAGE_KEY,JSON.stringify({version:1,layouts}));return true;}catch{return false;}
}

// The editor changes image presentation only. It never changes the selected partner.
export function createArtworkControls({root,getCharacter,notify}){
 let draft=null,gesture=null,hidden=false,contextKey=null;
 const getContext=()=>{const c=getCharacter();return c?{key:`home:${c.assetId??c.id}:${innerWidth<=800?'mobile':'desktop'}`,character:c}:null;};
 const image=()=>root.querySelector('.hub-art');
 const currentLayout=()=>{
  if(draft)return draft.layout;
  try{return readArtworkLayouts(localStorage)[contextKey]??DEFAULT_ARTWORK_LAYOUT;}catch{return DEFAULT_ARTWORK_LAYOUT;}
 };
 function paint(){const el=image();if(!el)return;const layout=currentLayout();el.style.translate=`${layout.x}% ${layout.y}%`;el.style.scale=String(layout.scale/100);el.style.transformOrigin='50% 50%';}
 const panelMarkup=()=>`<section class="artwork-panel" aria-labelledby="artwork-title"><header><h2 id="artwork-title">일러스트 조정</h2><button data-action="artwork-cancel" aria-label="조정 취소">×</button></header><p>일러스트를 드래그해 위치를 옮기세요.</p><div class="artwork-nudge"><span>위치</span>${[['left','왼쪽','←'],['up','위','↑'],['down','아래','↓'],['right','오른쪽','→']].map(([direction,label,glyph])=>`<button data-action="artwork-nudge" data-direction="${direction}" aria-label="일러스트 ${label}으로 이동">${glyph}</button>`).join('')}</div><label class="artwork-scale"><span>크기 <output id="artwork-scale-value">${Math.round(draft.layout.scale)}%</output></span><input data-art-scale aria-label="일러스트 크기" type="range" min="60" max="160" step="1" value="${draft.layout.scale}" aria-valuetext="${Math.round(draft.layout.scale)}퍼센트"></label><div class="artwork-reset-row"><button data-action="artwork-reset">기본 위치·크기</button><small>이 브라우저에 저장됩니다.</small></div><p class="artwork-error" role="alert" hidden></p><footer><button data-action="artwork-cancel">취소</button><button data-action="artwork-save">저장</button></footer></section>`;
 function sync(){
  const ctx=getContext();
  if(!ctx){draft=null;gesture=null;hidden=false;contextKey=null;return;}
  if(contextKey!==ctx.key){draft=null;gesture=null;hidden=false;contextKey=ctx.key;}
  const main=root.querySelector('.game-hub');
  main.classList.toggle('artwork-editing',Boolean(draft));main.classList.toggle('artwork-ui-hidden',hidden);
  for(const el of main.querySelectorAll('.hub-header,.hub-help,.hub-quick,.hub-play,.hub-footer'))el.inert=hidden;
  for(const el of main.querySelectorAll('.artwork-panel,.artwork-show-ui'))el.remove();
  const button=main.querySelector('[data-action="artwork-edit"]');button?.setAttribute('aria-expanded',String(Boolean(draft)));
  const stage=main.querySelector('.hub-art-button');
  if(stage){stage.setAttribute('aria-label',draft?'일러스트 위치 조정. 드래그 또는 방향키로 이동':`${ctx.character.name}에게 말 걸기`);stage.inert=hidden;}
  if(draft)main.insertAdjacentHTML('beforeend',panelMarkup());
  if(hidden)main.insertAdjacentHTML('beforeend',`<button class="artwork-show-ui" data-action="artwork-show-ui" aria-label="UI 다시 표시">${icon('eye')}<span>UI 표시</span></button>`);
  paint();
 }
 function finish(){draft=null;gesture=null;sync();root.querySelector('[data-action="artwork-edit"]')?.focus({preventScroll:true});}
 function update(value){
  if(!draft)return;draft.layout=normalizeArtworkLayout(value);paint();
  const range=root.querySelector('[data-art-scale]');if(range){range.value=draft.layout.scale;range.setAttribute('aria-valuetext',`${Math.round(draft.layout.scale)}퍼센트`);}
  const output=root.querySelector('#artwork-scale-value');if(output)output.value=`${Math.round(draft.layout.scale)}%`;
 }
 function nudge(direction,amount=1){const moves={left:[-amount,0],right:[amount,0],up:[0,-amount],down:[0,amount]},delta=moves[direction];if(draft&&delta)update({...draft.layout,x:draft.layout.x+delta[0],y:draft.layout.y+delta[1]});}
 root.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]'),action=button?.dataset.action;
  if(!getContext())return;
  if(draft&&action==='poke'){e.preventDefault();e.stopImmediatePropagation();return;}
  if(!action?.startsWith('artwork-'))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(action==='artwork-edit'){
   if(draft){finish();return;}
   const ctx=getContext();contextKey=ctx.key;const layout={...currentLayout()};draft={key:ctx.key,layout};hidden=false;sync();root.querySelector('[data-art-scale]')?.focus({preventScroll:true});
  }else if(action==='artwork-hide-ui'){draft=null;gesture=null;hidden=true;sync();root.querySelector('.artwork-show-ui')?.focus({preventScroll:true});}
  else if(action==='artwork-show-ui'){hidden=false;sync();root.querySelector('[data-action="artwork-hide-ui"]')?.focus({preventScroll:true});}
  else if(action==='artwork-cancel')finish();
  else if(action==='artwork-reset')update(DEFAULT_ARTWORK_LAYOUT);
  else if(action==='artwork-nudge')nudge(button.dataset.direction);
  else if(action==='artwork-save'&&draft){
   let saved=false;try{saved=saveArtworkLayout(localStorage,draft.key,draft.layout);}catch{}
   if(saved){finish();notify('일러스트 위치와 크기를 저장했습니다.');}
   else{const error=root.querySelector('.artwork-error');error.hidden=false;error.textContent='저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도하세요.';}
  }
 },true);
 root.addEventListener('input',e=>{if(draft&&e.target.matches('[data-art-scale]'))update({...draft.layout,scale:Number(e.target.value)});});
 root.addEventListener('pointerdown',e=>{
  const stage=e.target.closest('.hub-art-button');if(!draft||!stage||!e.isPrimary||e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();const el=image();
  gesture={id:e.pointerId,stage,x:e.clientX,y:e.clientY,width:el.clientWidth,height:el.clientHeight,layout:{...draft.layout}};
  stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});
 },true);
 root.addEventListener('pointermove',e=>{
  if(!draft||gesture?.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();
  update({...gesture.layout,x:gesture.layout.x+(e.clientX-gesture.x)/Math.max(1,gesture.width)*100,y:gesture.layout.y+(e.clientY-gesture.y)/Math.max(1,gesture.height)*100});
 },true);
 const endGesture=e=>{if(gesture?.id!==e.pointerId)return;const stage=gesture.stage;gesture=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);};
 root.addEventListener('pointerup',endGesture,true);root.addEventListener('pointercancel',endGesture,true);root.addEventListener('lostpointercapture',()=>{gesture=null;},true);
 root.addEventListener('keydown',e=>{
  if(!getContext()||e.target.closest('.modal'))return;
  if(e.key==='Escape'&&(draft||hidden)){
   e.preventDefault();e.stopImmediatePropagation();if(draft)finish();else{hidden=false;sync();root.querySelector('[data-action="artwork-hide-ui"]')?.focus({preventScroll:true});}return;
  }
  if(draft&&e.target.closest('.hub-art-button')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();nudge(e.key.slice(5).toLowerCase(),e.shiftKey?5:1);}
 },true);
 addEventListener('resize',()=>{if(getContext())sync();});
 return {afterRender:sync};
}
