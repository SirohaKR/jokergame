import {CHARACTERS,imagePath,cutinPath} from '../src/data.js';
import {EMOTES,emoteSprite as gameSprite} from '../src/emotes.js';
import {GROUPS,SLOTS,GAME_LABEL,MAX_LINE,MAX_EXTRA,newScript,validateScript,scriptMarkdown,skillName} from './model.js';
// The game resolves sprite URLs from the site root; this page's stylesheet lives one folder down.
const emoteSprite=(c,id)=>gameSprite(c,id).replace("url('assets/","url('/assets/");
const KEY='last-one-script-draft-v1',$=s=>document.querySelector(s);
let script=load(),current=0,focusSlot='entry',saveId=null,timer;
function load(){try{return validateScript(JSON.parse(localStorage.getItem(KEY)));}catch{return newScript();}}
function tag(name,props={},...children){const n=document.createElement(name);for(const [k,v]of Object.entries(props)){if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k in n)n[k]=v;else n.setAttribute(k,v);}n.append(...children);return n;}
function status(text,kind=''){const s=$('#save-status');s.textContent=text;s.className=kind;}
// Any edit after a server save starts a new archive entry on the next save.
function changed(){saveId=null;clearTimeout(timer);timer=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(script));status('이 브라우저에 자동 저장됨');}catch{status('브라우저 저장 공간이 부족합니다. JSON 저장으로 백업하세요.','error');}},300);renderTabs();}
const ch=()=>script.characters[CHARACTERS[current].assetId];
const filled=i=>{const c=script.characters[CHARACTERS[i].assetId];return SLOTS.filter(s=>c.lines[s.key].trim()).length;};
function renderTabs(){
 const nav=$('#characters');nav.replaceChildren();
 CHARACTERS.forEach((c,i)=>{const b=tag('button',{class:'char-tab'+(i===current?' active':''),type:'button','aria-pressed':String(i===current)});b.style.setProperty('--accent',c.color);
  const sprite=tag('span');sprite.innerHTML=emoteSprite(c,'hello');const done=filled(i);const bar=tag('div',{class:'progress'},tag('i'));bar.firstChild.style.width=`${done/SLOTS.length*100}%`;
  b.append(sprite.firstChild,tag('span',{},tag('b',{text:c.name}),tag('small',{text:`${done}/${SLOTS.length}칸 · 추가 ${script.characters[c.assetId].extra.length}`}),bar));
  b.onclick=()=>{current=i;focusSlot='entry';renderTabs();renderEditor();renderPreview();};nav.append(b);});
}
function counter(input,node,short){const n=input.value.length;node.textContent=`${n}/${MAX_LINE}${short&&n>12?' · 말풍선에서 길어요':''}`;node.classList.toggle('warn',Boolean(short&&n>12));}
function renderEditor(){
 const c=CHARACTERS[current],data=ch(),root=$('#editor');root.replaceChildren();root.style.setProperty('--accent',c.color);
 root.append(tag('h1',{},c.name,tag('small',{text:c.tag})),tag('div',{class:'legend'},...Object.entries(GAME_LABEL).map(([k,v])=>tag('span',{class:'badge badge-'+k,text:v}))));
 for(const g of GROUPS){
  root.append(tag('h2',{text:g.label}));
  for(const s of g.slots){
   const label=s.key==='skill'?`${s.label} 「${skillName(current)}」`:s.label;
   const input=tag(s.short?'input':'textarea',{value:data.lines[s.key],maxLength:MAX_LINE,placeholder:'대사를 입력하세요','aria-label':`${c.name} ${label}`});if(!s.short)input.rows=2;
   const count=tag('span',{class:'count'}),row=tag('div',{class:'slot'+(focusSlot===s.key?' focus':'')},tag('div',{class:'slot-label'},tag('b',{text:label}),tag('small',{text:s.hint}),tag('span',{class:'badge badge-'+s.game,text:GAME_LABEL[s.game]})),input,count);
   row.dataset.slot=s.key;counter(input,count,s.short);
   input.addEventListener('input',()=>{data.lines[s.key]=input.value;counter(input,count,s.short);changed();renderPreview();});
   input.addEventListener('focus',()=>{focusSlot=s.key;root.querySelectorAll('.slot').forEach(r=>r.classList.toggle('focus',r.dataset.slot===s.key));renderPreview();});
   root.append(row);
  }
 }
 root.append(tag('h2',{text:'상황별 추가 대사'}),tag('p',{class:'muted',text:'정해진 칸에 없는 상황(스킬 반사, 연승, 특정 캐릭터와 마주쳤을 때 등)을 자유롭게 적으세요.'}));
 const list=tag('div');root.append(list);
 const draw=()=>{list.replaceChildren();data.extra.forEach((e,i)=>{
  const situation=tag('input',{value:e.situation,maxLength:40,placeholder:'상황','aria-label':`추가 ${i+1} 상황`}),line=tag('input',{value:e.text,maxLength:MAX_LINE,placeholder:'대사','aria-label':`추가 ${i+1} 대사`}),emote=tag('select',{'aria-label':`추가 ${i+1} 표정`},tag('option',{value:'',text:'표정 없음'}),...EMOTES.map(m=>tag('option',{value:m.id,text:m.description}))),memo=tag('input',{class:'memo',value:e.memo,maxLength:200,placeholder:'연출 메모 (선택)','aria-label':`추가 ${i+1} 메모`}),del=tag('button',{type:'button',text:'×','aria-label':`추가 ${i+1} 삭제`,title:'삭제'});
  emote.value=e.emote;
  for(const [field,node]of [['situation',situation],['text',line],['emote',emote],['memo',memo]])node.addEventListener('input',()=>{e[field]=node.value;changed();renderPreview();});
  line.addEventListener('focus',()=>{focusSlot='extra:'+i;renderPreview();});
  del.onclick=()=>{data.extra.splice(i,1);if(focusSlot.startsWith('extra:'))focusSlot='entry';changed();draw();renderPreview();};
  list.append(tag('div',{class:'extra-row'},situation,line,emote,del,memo));});};
 draw();
 const add=tag('button',{type:'button',text:'+ 추가 대사'});add.onclick=()=>{if(data.extra.length>=MAX_EXTRA){status(`추가 대사는 ${MAX_EXTRA}개까지입니다.`,'error');return;}data.extra.push({situation:'',text:'',emote:'',memo:''});changed();draw();list.lastChild?.querySelector('input')?.focus();};
 const notes=tag('textarea',{value:data.notes,maxLength:500,rows:4,placeholder:'말투 규칙, 호칭, 금지어 등 캐릭터 대사 메모','aria-label':`${c.name} 메모`});notes.addEventListener('input',()=>{data.notes=notes.value;changed();});
 root.append(add,tag('h2',{text:'대사 메모'}),notes);
}
function renderPreview(){
 const c=CHARACTERS[current],data=ch(),stage=$('#stage');stage.replaceChildren();stage.style.setProperty('--accent',c.color);
 let text,emote,label;
 if(focusSlot.startsWith('extra:')){const e=data.extra[Number(focusSlot.slice(6))];text=e?.text;emote=e?.emote;label=`추가 · ${e?.situation||'상황 미정'}`;}
 else{const s=SLOTS.find(x=>x.key===focusSlot);text=data.lines[s.key];emote=s.emote;label=s.key==='skill'?'스킬 컷인':s.label;}
 $('#preview-label').textContent=`${c.name} · ${label}`;
 stage.append(tag('img',{class:'standing',src:imagePath(c),alt:''}));
 if(focusSlot==='skill'){
  const band=tag('div',{class:'cutin'});band.append(tag('img',{src:cutinPath(c)??imagePath(c),alt:''}));
  stage.append(band,tag('div',{class:'cutin-title'},tag('small',{text:'SKILL'}),tag('b',{text:skillName(current)}),tag('p',{text:text?`“${text}”`:'스킬 대사를 입력하세요'})));return;
 }
 const bubble=tag('div',{class:'bubble'+(text?'':' empty')});if(emote){const s=tag('span');s.innerHTML=emoteSprite(c,emote);bubble.append(s.firstChild);}
 bubble.append(tag('span',{text:text||'대사를 입력하면 여기에 보여요'}));stage.append(bubble);
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=tag('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const fileName=()=>(script.title.trim()||'last-one-script').replace(/[\\/:*?"<>|]/g,'_');
function replace(next){script=next;saveId=null;$('#script-title').value=script.title;current=0;focusSlot='entry';localStorage.setItem(KEY,JSON.stringify(script));renderTabs();renderEditor();renderPreview();}
async function archive(){
 const list=$('#archive'),info=$('#archive-status');info.className='muted';info.textContent='불러오는 중…';
 try{const r=await fetch('/api/scripts'),d=await r.json();if(!r.ok)throw new Error(d.message);list.replaceChildren();info.textContent=d.scripts.length?`${d.scripts.length}개 · 이 서버에 보관됨`:'아직 저장한 대본이 없어요. 제목을 쓰고 ‘대본에 저장’을 누르세요.';
  for(const s of d.scripts){const open=tag('button',{type:'button',class:'small',text:'편집기로 열기'});open.onclick=async()=>{if(!confirm(`‘${s.title}’을(를) 열까요? 지금 작성 중인 초안은 이 대본으로 바뀝니다.`))return;try{const r=await fetch(`/api/scripts/${s.id}/script.json`),x=await r.json();if(!r.ok)throw new Error(x.message);replace(validateScript(x));status(`‘${s.title}’을(를) 열었습니다`,'ok');}catch(e){status(e.message,'error');}};
   list.append(tag('li',{},tag('b',{text:s.title}),tag('small',{text:`${new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(s.createdAt))} · 대사 ${s.lines}줄`}),tag('div',{},open,tag('a',{href:`/api/scripts/${s.id}/script.md`,text:'문서'}),tag('a',{href:`/api/scripts/${s.id}/script.json`,text:'JSON'}))));}
 }catch(e){info.className='error';info.textContent=(e.message||'목록을 불러오지 못했습니다.')+' 새로고침으로 다시 시도하세요.';}
}
$('#script-title').value=script.title;
$('#script-title').addEventListener('input',e=>{script.title=e.target.value;changed();});
$('#reset').onclick=()=>{if(confirm('게임 기본 대사로 새 대본을 시작할까요? 지금 초안은 사라집니다. 필요하면 먼저 JSON 저장을 하세요.')){replace(newScript());status('기본 대사로 새로 시작했습니다');}};
$('#export-json').onclick=()=>download(fileName()+'.json',JSON.stringify(script,null,2),'application/json');
$('#export-md').onclick=()=>download(fileName()+'.md',scriptMarkdown(script),'text/markdown');
$('#import').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{replace(validateScript(JSON.parse(await f.text())));status(`${f.name}을(를) 불러왔습니다`,'ok');}catch(err){status('불러오지 못했어요: '+err.message,'error');}};
$('#save').onclick=async()=>{
 if(!script.title.trim()){status('제목을 먼저 입력하세요','error');$('#script-title').focus();return;}
 saveId??=crypto.randomUUID();const btn=$('#save');btn.disabled=true;status('서버에 저장하는 중…');
 try{const r=await fetch('/api/scripts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:saveId,script})}),d=await r.json();if(!r.ok)throw new Error(d.message);status(`‘${d.title}’ 저장 완료 · 대사 ${d.lines}줄`,'ok');archive();}
 catch(e){status((e.message||'저장하지 못했습니다.')+' 초안은 그대로 남아 있어요.','error');}finally{btn.disabled=false;}
};
$('#refresh').onclick=archive;
renderTabs();renderEditor();renderPreview();archive();
