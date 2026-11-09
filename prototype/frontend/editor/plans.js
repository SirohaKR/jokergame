import {SCENES} from './model.js';
const $=s=>document.querySelector(s),list=$('#list'),detail=$('#detail'),status=$('#status');
const date=s=>new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(s));
function tag(name,text,className){const node=document.createElement(name);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function link(text,href,className='button'){const node=tag('a',text,className);node.href=href;return node;}
async function get(url){const response=await fetch(url);const data=await response.json();if(!response.ok)throw new Error(data.message||'기획안을 불러오지 못했습니다.');return data;}
function showScene(plan,key){
 const s=plan.project.scenes[key];detail.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('active',b.dataset.scene===key);b.setAttribute('aria-pressed',String(b.dataset.scene===key));});
 const img=$('#wireframe-image');img.src=`/api/ui-plans/${plan.id}/${key}.svg`;img.alt=`${plan.title} · ${SCENES[key]} 와이어프레임`;$('#wireframe-caption').textContent=`${SCENES[key]} · ${s.width} × ${s.height} · 이미지 영역은 이름이 붙은 상자로 표시됩니다.`;
 $('#svg-download').href=img.src;$('#svg-download').download=`${plan.id}-${key}.svg`;$('#plan-notes').textContent=s.notes||'이 화면에 작성한 수정 메모가 없습니다.';
 const body=$('#element-rows');body.replaceChildren();s.elements.forEach((e,i)=>{const row=tag('tr');for(const text of [i+1,e.name,e.role||'—',`${e.x}, ${e.y}`,`${e.w} × ${e.h}`,e.visible?'표시':'숨김'])row.append(tag('td',text));body.append(row);});
}
async function load(){
 status.className='';status.textContent='기획안을 불러오는 중입니다.';list.replaceChildren();detail.replaceChildren();const id=new URLSearchParams(location.search).get('id');detail.hidden=true;list.hidden=Boolean(id);
 try{
  if(!id){const {plans}=await get('/api/ui-plans');status.textContent=`저장한 기획안 ${plans.length}개 · 같은 서버에서 저장한 기획안이 표시됩니다.`;
   if(!plans.length){const empty=tag('div',undefined,'empty');empty.append(tag('h2','첫 UI 기획안을 저장해 보세요'),tag('p','편집기에서 제목을 입력하고 ‘기획에 저장’을 누르면 이곳에 추가됩니다.'),link('편집기에서 시작하기','/editor.html'));list.append(empty);}
   for(const p of plans){const card=link('',`/ui-plans.html?id=${p.id}`,'plan-card');const image=tag('img');image.src=`/api/ui-plans/${p.id}/${p.activeScene}.svg`;image.alt=p.title+' 와이어프레임';image.loading='lazy';const meta=tag('div');meta.append(tag('h2',p.title),tag('p',date(p.createdAt)+' · KST'),tag('p','로비 · 대기실 · 게임 테이블 / 3개 화면'));card.append(image,meta);list.append(card);}return;
  }
  const p=await get('/api/ui-plans/'+encodeURIComponent(id));status.textContent='';detail.hidden=false;detail.append(link('← 기획 목록','/ui-plans.html','back'));
  const top=tag('div',undefined,'detail-top'),title=tag('div');title.append(tag('h2',p.title),tag('p',date(p.createdAt)+' 저장 · KST'));const actions=tag('div',undefined,'detail-actions');actions.append(link('편집기로 열기',`/editor.html?plan=${p.id}`),link('JSON 내려받기',`/api/ui-plans/${p.id}/project.json`));const svg=link('와이어프레임 SVG','#');svg.id='svg-download';actions.append(svg);top.append(title,actions);detail.append(top);
  const tabs=tag('nav',undefined,'tabs');tabs.setAttribute('aria-label','기획안 화면');for(const [key,label]of Object.entries(SCENES)){const b=tag('button',label);b.dataset.scene=key;b.onclick=()=>showScene(p,key);tabs.append(b);}detail.append(tabs);
  const figure=tag('figure',undefined,'wireframe'),img=tag('img'),caption=tag('figcaption');img.id='wireframe-image';caption.id='wireframe-caption';figure.append(img,caption);detail.append(figure,tag('h3','수정 메모'));const notes=tag('div',undefined,'notes');notes.id='plan-notes';detail.append(notes,tag('h3','요소 배치'),tag('p','좌표와 크기는 원본 캔버스 기준입니다. 숨긴 요소는 와이어프레임에서 제외됩니다.','muted'));
  const wrap=tag('div',undefined,'table-wrap'),table=tag('table'),head=tag('thead'),row=tag('tr');for(const text of ['순서','요소','용도','X, Y','너비 × 높이','상태'])row.append(tag('th',text));head.append(row);const body=tag('tbody');body.id='element-rows';table.append(head,body);wrap.append(table);detail.append(wrap);showScene(p,p.activeScene);
 }catch(e){status.className='error';status.textContent=e.message+' 새로고침으로 다시 시도할 수 있습니다.';}
}
$('#refresh').onclick=load;load();
