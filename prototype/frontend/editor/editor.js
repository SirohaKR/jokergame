import {ASSETS,SCENES,element,newProject,sceneTemplate,validateProject,moveElement,uid} from './model.js';
const $=s=>document.querySelector(s), storageKey='last-one-ui-editor-v1';
let project=newProject(),sceneKey='home',selected=null,scale=.5,preview=false,undo=[],redo=[],drag=null,toastTimer;
try{const saved=localStorage.getItem(storageKey);if(saved)project=validateProject(JSON.parse(saved));}catch{setTimeout(()=>toast('저장본을 읽지 못했습니다. 기본 배치로 열었습니다.'),0);}
const scene=()=>project.scenes[sceneKey], chosen=()=>scene().elements.find(e=>e.id===selected);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(project));$('#save-status').textContent='이 브라우저에 저장됨';}catch{$('#save-status').textContent='자동 저장 실패 · JSON으로 저장하세요';toast('브라우저 저장 공간이 부족합니다. JSON으로 저장하세요.');}}
function change(fn){
 const previous=JSON.stringify(project);fn();
 try{validateProject(project);}catch(err){project=JSON.parse(previous);toast(err.message);render();return false;}
 undo.push(previous);if(undo.length>40)undo.shift();redo=[];save();render();return true;
}
function history(back){const from=back?undo:redo,to=back?redo:undo;if(!from.length)return;to.push(JSON.stringify(project));project=JSON.parse(from.pop());selected=null;save();render();}
function input(label,value,key,type='text',attrs={}){
 const wrap=document.createElement('label');wrap.textContent=label;
 const field=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')field.type=type;field.value=value;field.dataset.prop=key;Object.assign(field,attrs);wrap.append(field);return wrap;
}
function select(label,value,key,options){const wrap=document.createElement('label');wrap.textContent=label;const field=document.createElement('select');field.dataset.prop=key;for(const [v,text]of options){const o=new Option(text,v);field.add(o);}field.value=value;wrap.append(field);return wrap;}
function group(...items){const div=document.createElement('div');div.className='two';div.append(...items);return div;}
function renderProperties(){
 const box=$('#properties'),e=chosen();box.replaceChildren();$('#selection-name').textContent=e?.name??'화면';
 if(!e){const p=document.createElement('p');p.className='empty';p.textContent='요소를 선택해 위치·크기·텍스트를 수정하세요. 왼쪽의 요소를 캔버스에 끌어 넣을 수 있습니다.';box.append(p);return;}
 box.append(input('요소 이름',e.name,'name','text',{maxLength:100}),input('연결할 기능 / 용도',e.role,'role','text',{maxLength:100,placeholder:'예: battle, partner, skill'}));
 box.append(group(input('X',e.x,'x','number',{min:-3840,max:7680}),input('Y',e.y,'y','number',{min:-3840,max:7680})),group(input('너비',e.w,'w','number',{min:16,max:3840}),input('높이',e.h,'h','number',{min:16,max:3840})));
 if(['image','character'].includes(e.type)){
  box.append(select('에셋',ASSETS.some(a=>a.src===e.src)?e.src:'uploaded','src',[...ASSETS.map(a=>[a.src,a.name]),...(e.src.startsWith('data:')?[['uploaded','업로드한 이미지']]:[])]),select('이미지 맞춤',e.fit,'fit',[['contain','전체 보이기'],['cover','영역 채우기 · 상단 기준']]));
 }else box.append(input('텍스트',e.text,'text','textarea',{rows:3,maxLength:2000}),group(input('글자 크기',e.fontSize,'fontSize','number',{min:8,max:160}),select('정렬',e.align,'align',[['left','왼쪽'],['center','가운데'],['right','오른쪽']])),input('글자색',e.color==='transparent'?'#ffffff':e.color,'color','color'));
 box.append(group(input('배경색',e.background==='transparent'?'#39314f':e.background,'background','color'),input('모서리',e.radius,'radius','number',{min:0,max:300})),group(input('불투명도',e.opacity,'opacity','number',{min:0,max:1,step:.05}),input('회전 (°)',e.rotation,'rotation','number',{min:-180,max:180})));
 const controls=document.createElement('div');controls.className='element-actions';
 for(const [action,label]of [['transparent','배경 투명'],['back','뒤로'],['front','앞으로'],['duplicate','복제'],['delete','삭제'],['lock',e.locked?'잠금 해제':'위치 잠금'],['visible',e.visible?'숨기기':'보이기']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>elementAction(action);controls.append(b);}box.append(controls);
}
function nodeStyle(node,e){Object.assign(node.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',color:e.color,background:e.background,fontSize:e.fontSize+'px',borderRadius:e.radius+'px',opacity:e.opacity,transform:`rotate(${e.rotation}deg)`,textAlign:e.align,justifyContent:({left:'flex-start',center:'center',right:'flex-end'})[e.align]});}
function renderCanvas(){
 const stage=$('#stage'),s=scene();stage.replaceChildren();stage.classList.toggle('preview',preview);stage.style.width=s.width+'px';stage.style.height=s.height+'px';stage.style.background=s.background;stage.style.transform=`scale(${scale})`;$('#stage-wrap').style.width=s.width*scale+'px';$('#stage-wrap').style.height=s.height*scale+'px';
 for(const e of s.elements){if(!e.visible)continue;const node=document.createElement('div');node.className=`node ${e.type} ${e.id===selected?'selected':''} ${e.locked?'locked':''}`;node.dataset.id=e.id;node.setAttribute('aria-label',e.name);nodeStyle(node,e);const content=document.createElement('div');content.className='content';if(e.src){const img=document.createElement('img');img.src=e.src;img.alt=e.name;img.draggable=false;img.style.objectFit=e.fit;content.append(img);}else content.textContent=e.text;node.append(content);if(e.id===selected&&!e.locked&&!preview){const handle=document.createElement('div');handle.className='handle';handle.setAttribute('aria-label','크기 조절');node.append(handle);}stage.append(node);}
 $('#dimensions').textContent=`${s.width} × ${s.height} · ${Math.round(scale*100)}%`;
}
function renderLayers(){const list=$('#layers');list.replaceChildren();for(const e of [...scene().elements].reverse()){const row=document.createElement('div');row.className='layer'+(e.id===selected?' selected':'');const b=document.createElement('button');b.textContent=(e.locked?'🔒 ':'')+e.name;b.onclick=()=>{selected=e.id;render();};const eye=document.createElement('button');eye.textContent=e.visible?'◉':'○';eye.title=e.visible?'숨기기':'보이기';eye.setAttribute('aria-label',`${e.name} ${eye.title}`);eye.onclick=()=>change(()=>e.visible=!e.visible);row.append(b,eye);list.append(row);}}
function render(){renderCanvas();renderLayers();renderProperties();$('#project-name').value=project.name;$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;$('#canvas-width').value=scene().width;$('#canvas-height').value=scene().height;$('#canvas-color').value=scene().background==='transparent'?'#1e1a2e':scene().background;$('#notes').value=scene().notes;const size=`${scene().width},${scene().height}`;$('#preset').value=['1280,720','1920,1080','390,844'].includes(size)?size:'custom';document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===sceneKey));$('#preview').textContent=preview?'편집으로':'미리보기';}
function fit(){const v=$('#viewport');scale=Math.min(1,(v.clientWidth-80)/scene().width,(v.clientHeight-80)/scene().height);scale=Math.max(.1,scale);$('#zoom').value='';renderCanvas();}
function add(type,props={},position){
 if(scene().elements.length>=200){toast('한 화면에는 최대 200개까지 넣을 수 있습니다.');return false;}
 if(preview){toast('편집 모드로 전환한 뒤 추가하세요.');return false;}
 const e=element(type,props),center=position??{x:scene().width/2,y:scene().height/2};
 Object.assign(e,moveElement(e,center.x-e.w/2-e.x,center.y-e.h/2-e.y,scene(),$('#snap').checked?8:1));
 const next=structuredClone(project);next.scenes[sceneKey].elements.push(e);
 try{validateProject(next);}catch(err){toast(err.message);return false;}
 change(()=>{scene().elements.push(e);selected=e.id;});return true;
}
function elementAction(action){const e=chosen();if(!e)return;if(action==='duplicate'&&scene().elements.length>=200){toast('최대 200개입니다.');return;}change(()=>{const all=scene().elements,i=all.indexOf(e);if(action==='delete'){all.splice(i,1);selected=null;}else if(action==='duplicate'){const copy={...e,id:uid(),name:e.name+' 복사',x:e.x+16,y:e.y+16};all.splice(i+1,0,copy);selected=copy.id;}else if(action==='front'&&i<all.length-1)[all[i],all[i+1]]=[all[i+1],all[i]];else if(action==='back'&&i>0)[all[i],all[i-1]]=[all[i-1],all[i]];else if(action==='transparent')e.background='transparent';else if(action==='lock')e.locked=!e.locked;else if(action==='visible')e.visible=!e.visible;});}
function paletteButton(label,payload,container,src){const b=document.createElement('button');b.draggable=true;if(src){b.className='asset';const img=document.createElement('img');img.src=src;img.alt='';const span=document.createElement('span');span.textContent=label;b.append(img,span);}else b.textContent=label;b.onclick=()=>add(payload.type,payload.props);b.ondragstart=ev=>{ev.dataTransfer.setData('application/x-last-one-element',JSON.stringify(payload));ev.dataTransfer.effectAllowed='copy';};container.append(b);}
for(const [type,label]of [['text','T  텍스트'],['button','▣  버튼'],['panel','▤  패널'],['card','♧  카드']])paletteButton(label,{type},$('#palette'));
function renderAssets(){const kind=$('#asset-kind').value;$('#assets').replaceChildren();for(const a of ASSETS.filter(a=>kind==='character'?a.kind==='character':a.src.includes(kind==='skill'?'/skills/':'/emotes/')))paletteButton(a.name,{type:a.kind,props:{name:a.name,src:a.src,w:a.kind==='character'?300:320,h:a.kind==='character'?480:240}},$('#assets'),a.src);}
$('#asset-kind').onchange=renderAssets;renderAssets();
for(const [key,name]of Object.entries(SCENES)){const b=document.createElement('button');b.dataset.scene=key;b.textContent=name;b.onclick=()=>{sceneKey=key;selected=null;render();fit();};$('#scenes').append(b);}
$('#stage').onpointerdown=ev=>{
 if(preview||ev.button!==0)return;const node=ev.target.closest('.node');if(!node){selected=null;render();return;}const resize=ev.target.classList.contains('handle');selected=node.dataset.id;const e=chosen();
 // Keep the pressed node/handle attached until pointer capture is established.
 // Replacing it during pointerdown can cancel the browser's pointer stream.
 for(const n of $('#stage').children){n.classList.toggle('selected',n===node);if(n!==node)n.querySelector('.handle')?.remove();}
 if(!e.locked&&!node.querySelector('.handle')){const handle=document.createElement('div');handle.className='handle';handle.setAttribute('aria-label','크기 조절');node.append(handle);}
 renderLayers();renderProperties();if(e.locked)return;
 drag={id:e.id,startX:ev.clientX,startY:ev.clientY,original:{...e},resize,snapshot:JSON.stringify(project),changed:false};$('#stage').setPointerCapture(ev.pointerId);ev.preventDefault();$('#stage').focus({preventScroll:true});
};
window.addEventListener('pointermove',ev=>{
 if(!drag)return;const e=chosen(),dx=(ev.clientX-drag.startX)/scale,dy=(ev.clientY-drag.startY)/scale,step=$('#snap').checked?8:1;if(Math.abs(dx)+Math.abs(dy)<1)return;
 if(drag.resize){const a=drag.original.rotation*Math.PI/180;e.w=Math.max(16,Math.min(3840,Math.round((drag.original.w+dx*Math.cos(a)+dy*Math.sin(a))/step)*step));e.h=Math.max(16,Math.min(3840,Math.round((drag.original.h-dx*Math.sin(a)+dy*Math.cos(a))/step)*step));}else Object.assign(e,moveElement(drag.original,dx,dy,scene(),step));drag.changed=true;nodeStyle($('#stage').querySelector(`[data-id="${CSS.escape(e.id)}"]`),e);
});
function endDrag(cancel=false){if(!drag)return;if(cancel)project=JSON.parse(drag.snapshot);else if(drag.changed){undo.push(drag.snapshot);if(undo.length>40)undo.shift();redo=[];save();}drag=null;render();}
window.addEventListener('pointerup',()=>endDrag());window.addEventListener('pointercancel',()=>endDrag(true));window.addEventListener('blur',()=>endDrag(true));
$('#stage').ondragover=ev=>{if(!preview&&ev.dataTransfer.types.includes('application/x-last-one-element')){ev.preventDefault();ev.dataTransfer.dropEffect='copy';}};
$('#stage').ondrop=ev=>{ev.preventDefault();if(preview)return;try{const p=JSON.parse(ev.dataTransfer.getData('application/x-last-one-element'));const valid=['text','button','panel','card','character','image'];if(!valid.includes(p.type)||p.props?.src&&!ASSETS.some(a=>a.src===p.props.src))return;const rect=$('#stage').getBoundingClientRect();add(p.type,p.props,{x:(ev.clientX-rect.left)/scale,y:(ev.clientY-rect.top)/scale});}catch{toast('라이브러리의 요소를 끌어 넣으세요.');}};
$('#properties').onchange=ev=>{const field=ev.target,key=field.dataset.prop,e=chosen();if(!key||!e)return;let value=field.type==='number'?Number(field.value):field.value;if(key==='src'&&value==='uploaded')return;const copy=structuredClone(project);copy.scenes[sceneKey].elements.find(n=>n.id===e.id)[key]=value;try{validateProject(copy);change(()=>e[key]=value);}catch(err){toast(err.message);renderProperties();}};
$('#project-name').onchange=ev=>change(()=>project.name=ev.target.value.trim());
$('#notes').onchange=ev=>change(()=>scene().notes=ev.target.value);
$('#canvas-color').onchange=ev=>change(()=>scene().background=ev.target.value);
for(const key of ['width','height'])$('#canvas-'+key).onchange=ev=>{const n=Number(ev.target.value);if(!Number.isFinite(n)||n<320||n>3840){toast('320~3840 사이로 입력하세요.');render();return;}change(()=>scene()[key]=Math.round(n));fit();};
$('#preset').onchange=ev=>{if(ev.target.value==='custom')return;const [width,height]=ev.target.value.split(',').map(Number);change(()=>Object.assign(scene(),{width,height}));fit();};
$('#reset').onclick=()=>{if(confirm(`${SCENES[sceneKey]} 배치를 초기화할까요? 실행 취소로 복구할 수 있습니다.`)){change(()=>{project.scenes[sceneKey]=sceneTemplate(sceneKey);selected=null;});fit();}};
$('#undo').onclick=()=>history(true);$('#redo').onclick=()=>history(false);$('#fit').onclick=fit;$('#zoom').onchange=ev=>{if(ev.target.value===''){fit();return;}scale=Number(ev.target.value);renderCanvas();};$('#preview').onclick=()=>{preview=!preview;render();};
document.addEventListener('keydown',ev=>{if(ev.target.closest('input,textarea,select'))return;if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();history(!ev.shiftKey);return;}if(preview)return;if(ev.key==='Escape'){selected=null;render();return;}const e=chosen();if(!e)return;if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='d'){ev.preventDefault();elementAction('duplicate');return;}if(e.locked)return;if(['Delete','Backspace'].includes(ev.key)){ev.preventDefault();elementAction('delete');}const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];if(d){ev.preventDefault();const n=ev.shiftKey?10:1;change(()=>Object.assign(e,moveElement(e,d[0]*n,d[1]*n,scene())));}});
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
const filename=()=>project.name.replace(/[^\p{L}\p{N}_ -]/gu,'_').slice(0,60)||'last-one-ui';
$('#export').onclick=()=>{try{download(new Blob([JSON.stringify(validateProject(project),null,2)],{type:'application/json'}),filename()+'.json');toast('세 화면과 메모를 JSON으로 저장했습니다.');}catch(e){toast(e.message);}};
$('#import').onclick=()=>$('#json-file').click();
$('#json-file').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>16_000_000)throw new Error('파일은 16MB 이하로 선택하세요.');const next=validateProject(JSON.parse(await file.text()));change(()=>{project=next;selected=null;});fit();toast('수정본을 불러왔습니다. 실행 취소로 이전 배치를 복구할 수 있습니다.');}catch(e){toast('불러오기 실패: '+e.message);}finally{ev.target.value='';}};
$('#upload').onclick=()=>$('#image-file').click();
$('#image-file').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3_000_000)throw new Error('3MB 이하의 PNG/JPG/WebP 이미지를 선택하세요.');const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const img=await loadImage(src);if(add('image',{name:file.name.slice(0,100),src,w:320,h:Math.max(16,Math.min(720,Math.round(320*img.naturalHeight/img.naturalWidth)))}))toast('이미지를 추가했습니다. JSON에도 함께 저장됩니다.');}catch(e){toast(e.message||'이미지를 읽을 수 없습니다.');}finally{ev.target.value='';}};
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('이미지를 불러오지 못했습니다.'));img.src=src;});}
async function exportPNG(){
 const exportName=filename()+'-'+sceneKey+'.png',s=structuredClone(scene()),canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const ctx=canvas.getContext('2d');await document.fonts.ready;ctx.fillStyle=s.background;ctx.fillRect(0,0,s.width,s.height);
 for(const e of s.elements){if(!e.visible)continue;ctx.save();ctx.globalAlpha=e.opacity;ctx.translate(e.x+e.w/2,e.y+e.h/2);ctx.rotate(e.rotation*Math.PI/180);ctx.translate(-e.w/2,-e.h/2);ctx.beginPath();ctx.roundRect(0,0,e.w,e.h,Math.min(e.radius,e.w/2,e.h/2));ctx.clip();if(e.background!=='transparent'){ctx.fillStyle=e.background;ctx.fillRect(0,0,e.w,e.h);}if(e.src){const img=await loadImage(e.src),factor=(e.fit==='cover'?Math.max:Math.min)(e.w/img.naturalWidth,e.h/img.naturalHeight);const w=img.naturalWidth*factor,h=img.naturalHeight*factor;ctx.drawImage(img,(e.w-w)/2,0,w,h);}else{ctx.font=`${e.fontSize}px Inter, "Malgun Gothic", sans-serif`;ctx.fillStyle=e.color;ctx.textAlign=e.align;ctx.textBaseline='middle';const lines=[];for(const paragraph of e.text.split('\n')){let line='';for(const char of paragraph){if(line&&ctx.measureText(line+char).width>e.w-16){lines.push(line);line='';}line+=char;}lines.push(line);}lines.forEach((line,i)=>ctx.fillText(line,e.align==='left'?8:e.align==='right'?e.w-8:e.w/2,e.h/2+(i-(lines.length-1)/2)*e.fontSize*1.3));}ctx.restore();}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG를 생성하지 못했습니다.');download(blob,exportName);
}
$('#png').onclick=async()=>{$('#png').disabled=true;try{await exportPNG();toast('현재 화면을 PNG로 저장했습니다. 편집용 JSON도 함께 전달해 주세요.');}catch(e){toast(e.message);}finally{$('#png').disabled=false;}};
// A saved plan is an immutable snapshot; editing it creates a new entry.
let pendingPlan=null;
$('#save-plan').onclick=async()=>{
 const title=$('#project-name').value.trim();if(!title){toast('기획안 제목을 입력해 주세요.');$('#project-name').focus();return;}
 const button=$('#save-plan');button.disabled=true;button.textContent='저장 중…';
 try{
  const snapshot=validateProject({...project,name:title}),payload=JSON.stringify({title,project:snapshot,activeScene:sceneKey});
  if(pendingPlan?.payload!==payload)pendingPlan={id:uid(),payload};
  const response=await fetch('/api/ui-plans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:pendingPlan.id,...JSON.parse(payload)})});
  const result=await response.json();if(!response.ok){if(response.status===409)pendingPlan=null;throw new Error(result.message||'저장하지 못했습니다.');}
  pendingPlan=null;const link=$('#saved-plan');link.href='/ui-plans.html?id='+result.id;link.hidden=false;toast('UI 디자인 기획에 추가했습니다. 아래 링크에서 와이어프레임을 확인하세요.');
 }catch(e){toast('기획 저장 실패: '+e.message+' 현재 편집본은 유지됩니다.');}
 finally{button.disabled=false;button.textContent='기획에 저장';}
};
const planId=new URLSearchParams(location.search).get('plan');
if(planId){
 $('.workspace').inert=true;$('.actions').inert=true;
 try{const response=await fetch('/api/ui-plans/'+encodeURIComponent(planId));const record=await response.json();if(!response.ok)throw new Error(record.message);const next=validateProject(record.project);undo.push(JSON.stringify(project));project=next;sceneKey=Object.hasOwn(SCENES,record.activeScene)?record.activeScene:'home';save();toast('저장한 기획안을 열었습니다. 수정 후 저장하면 새 기획안으로 추가됩니다.');}
 catch(e){toast('기획안 열기 실패: '+e.message);}
 finally{$('.workspace').inert=false;$('.actions').inert=false;}
}
render();requestAnimationFrame(fit);
new ResizeObserver(()=>{document.documentElement.style.setProperty('--top-height',$('.top').offsetHeight+'px');if($('#zoom').value==='')fit();}).observe($('.top'));
window.addEventListener('resize',()=>{if($('#zoom').value==='')fit();});
