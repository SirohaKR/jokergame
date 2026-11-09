// Portable layout proposals. No scripts, arbitrary URLs, or game state in saved files.
export const VERSION=1;
export const SCENES={home:'메인 로비',room:'대기실',game:'게임 테이블'};
export const CHARACTERS=[['serena','세레나'],['elysia','엘리시아'],['lunea','루네아'],['rosette','로제트']];
export const ASSETS=CHARACTERS.flatMap(([id,name])=>[
 {src:`assets/characters/${id}.png`,name:`${name} 스탠딩`,kind:'character'},
 {src:`assets/skills/${id}.webp`,name:`${name} 스킬 컷인`,kind:'image'},
 {src:`assets/emotes/${id}.png`,name:`${name} 이모티콘 시트`,kind:'image'}]);
export const uid=()=>globalThis.crypto.randomUUID();
export function element(type,props={}){
 return {id:uid(),type,name:({text:'텍스트',button:'버튼',panel:'패널',character:'캐릭터',image:'이미지',card:'카드'})[type],x:80,y:80,w:type==='character'?300:220,h:type==='character'?480:type==='panel'?160:64,text:type==='text'?'텍스트를 입력하세요':type==='button'?'버튼':type==='card'?'♧':'',src:type==='character'?ASSETS[0].src:'',color:'#f6f1ff',background:type==='text'||type==='character'||type==='image'?'transparent':'#39314f',fontSize:type==='card'?40:24,radius:16,opacity:1,rotation:0,align:'center',fit:'contain',visible:true,locked:false,role:'',...props};
}
export function sceneTemplate(key){
 const scene={width:1280,height:720,background:'#1e1a2e',notes:'',elements:[]};
 const add=(type,p)=>scene.elements.push(element(type,p));
 if(key==='home'){
  add('panel',{name:'플레이어 정보',x:36,y:24,w:280,h:64,text:'PLAYER  ·  플레이어',fontSize:18,role:'profile'});
  add('text',{name:'게임 제목',x:1000,y:24,w:240,h:64,text:'♧ 라스트 원',fontSize:30,role:'title'});
  add('character',{x:100,y:100,w:500,h:540,role:'partner'});
  add('panel',{name:'파트너 대사',x:470,y:154,w:250,h:68,text:'왔어, 자기?',fontSize:20,background:'#f6f1ff',color:'#30243e',role:'partner-dialogue'});
  add('text',{x:70,y:530,w:260,h:70,text:'세레나',fontSize:42,role:'partner-name'});
  add('button',{name:'대전 버튼',x:850,y:270,w:340,h:150,text:'대전  ▶',fontSize:44,background:'#82649e',role:'battle'});
  ['캐릭터','이모티콘','게임 방법','상점 · 친구 · 전적'].forEach((text,i)=>add('button',{name:text,x:36+i*306,y:624,w:286,h:64,text,fontSize:20,role:['characters','emotes','help','social'][i]}));
 }else if(key==='room'){
  add('button',{x:32,y:22,w:140,h:52,text:'← 로비',role:'back'});
  add('text',{x:210,y:22,w:600,h:52,text:'AI 대전 · 1세트 · 턴 20초',role:'room-rules'});
  CHARACTERS.forEach(([id,name],i)=>{
   add('panel',{name:`${name} 좌석`,x:32+i*312,y:105,w:280,h:480,background:'#352e48',role:`seat-${i}`});
   add('character',{name,x:42+i*312,y:130,w:260,h:390,src:`assets/characters/${id}.png`,fit:'cover',role:`standing-${i}`});
   add('panel',{name:`${name} 이름표`,x:42+i*312,y:510,w:260,h:64,text:`${i===0?'나':'AI'} · ${name}`,fontSize:20,role:`name-${i}`});
  });
  add('button',{x:32,y:628,w:320,h:60,text:'이모티콘  ♡  !  ?',role:'emotes'});
  add('button',{x:910,y:620,w:338,h:76,text:'게임 시작 →',background:'#82649e',role:'start'});
 }else{
  scene.background='#234548';
  add('panel',{name:'테이블',x:280,y:130,w:720,h:400,radius:150,background:'#356568',role:'table'});
  [[48,230],[520,20],[1060,230]].forEach(([x,y],i)=>{add('panel',{name:`상대 ${i+1}`,x,y,w:170,h:100,text:`AI ${i+1}`,role:`opponent-${i+1}`});for(let n=0;n<4;n++)add('card',{x:x+n*34,y:y+110,w:50,h:72,fontSize:26,role:`opponent-${i+1}-card-${n}`});});
  add('text',{x:450,y:280,w:380,h:70,text:'내 차례입니다',fontSize:32,role:'turn-status'});
  add('button',{x:510,y:374,w:260,h:70,text:'카드 뽑기 →',background:'#82649e',role:'draw'});
  for(let i=0;i<7;i++)add('card',{name:`내 카드 ${i+1}`,x:280+i*86,y:565,w:78,h:120,text:['♠ A','♥ 2','♦ 3','♣ 4','♠ 5','♥ 6','★'][i],fontSize:24,background:'#f6f1e5',color:'#28383c',role:`hand-${i}`});
  add('button',{x:1020,y:590,w:210,h:64,text:'캐릭터 스킬',role:'skill'});
 }
 return scene;
}
export const newProject=()=>({format:'last-one-ui',version:VERSION,name:'라스트 원 UI 수정안',scenes:Object.fromEntries(Object.keys(SCENES).map(key=>[key,sceneTemplate(key)]))});
const number=(value,min,max,name)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`${name} 값이 올바르지 않습니다.`);return value;};
const string=(v,max=2000)=>{if(typeof v!=='string'||v.length>max)throw new Error('텍스트 길이 또는 형식이 올바르지 않습니다.');return v;};
const choice=(v,values)=>{if(!values.includes(v))throw new Error('지원하지 않는 속성입니다.');return v;};
const color=v=>{if(typeof v!=='string'||! /^(#[0-9a-f]{6}|transparent)$/i.test(v))throw new Error('색상 형식이 올바르지 않습니다.');return v;};
export function safeSource(src){return src===''||ASSETS.some(a=>a.src===src)||(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)&&src.length<=4_100_000);}
export function validateProject(raw){
 if(!raw||raw.format!=='last-one-ui'||raw.version!==VERSION)throw new Error('라스트 원 UI 편집 파일(JSON v1)을 선택하세요.');
 const result={format:raw.format,version:VERSION,name:string(raw.name,100),scenes:{}};
 for(const key of Object.keys(SCENES)){
  const s=raw.scenes?.[key];if(!s||!Array.isArray(s.elements)||s.elements.length>200)throw new Error('화면별 요소는 최대 200개입니다.');
  const ids=new Set();
  result.scenes[key]={width:number(s.width,320,3840,'가로'),height:number(s.height,320,3840,'세로'),background:color(s.background),notes:string(s.notes,4000),elements:s.elements.map(e=>{
   const id=string(e.id,100);if(ids.has(id))throw new Error('중복된 요소 ID입니다.');ids.add(id);
   if(!safeSource(e.src))throw new Error('프로젝트 에셋 또는 PNG/JPG/WebP 이미지만 사용할 수 있습니다.');
   return {id,type:choice(e.type,['text','button','panel','character','image','card']),name:string(e.name,100),text:string(e.text),role:string(e.role,100),src:e.src,x:number(e.x,-3840,7680,'X'),y:number(e.y,-3840,7680,'Y'),w:number(e.w,16,3840,'너비'),h:number(e.h,16,3840,'높이'),fontSize:number(e.fontSize,8,160,'글자 크기'),radius:number(e.radius,0,300,'모서리'),opacity:number(e.opacity,0,1,'불투명도'),rotation:number(e.rotation,-180,180,'회전'),color:color(e.color),background:color(e.background),align:choice(e.align,['left','center','right']),fit:choice(e.fit,['contain','cover']),visible:typeof e.visible==='boolean'?e.visible:true,locked:typeof e.locked==='boolean'?e.locked:false};
  })};
 }
 if(new TextEncoder().encode(JSON.stringify(result)).length>16_000_000)throw new Error('수정본이 16MB를 넘었습니다. 업로드 이미지 크기나 개수를 줄여 주세요.');
 return result;
}
export function moveElement(e,dx,dy,scene,snap=1){
 return {...e,x:Math.max(0,Math.min(Math.max(0,scene.width-e.w),Math.round((e.x+dx)/snap)*snap)),y:Math.max(0,Math.min(Math.max(0,scene.height-e.h),Math.round((e.y+dy)/snap)*snap))};
}
