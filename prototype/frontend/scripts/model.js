// Dialogue script model. Shared by the script studio (browser) and the scripts API (Node).
import {CHARACTERS} from '../src/data.js';
import {SKILL_PRESENTATIONS} from '../src/skill-presentation.js';
import {SKILLS} from '../src/game.js';

export const SCRIPT_VERSION=1;
export const MAX_LINE=120,MAX_NOTE=500,MAX_EXTRA=60;
// game: how the current prototype uses the slot. 'own' = this character's text is shown, 'common' = one shared text for everyone today, 'plan' = not wired yet.
export const GROUPS=[
 {key:'base',label:'기본',slots:[
  {key:'entry',label:'등장',hint:'대기실에 앉을 때',game:'plan',emote:'hello'},
  {key:'affection',label:'호감',hint:'파트너 로비에서 친해졌을 때',game:'plan',emote:'laugh'}]},
 {key:'skill',label:'스킬',slots:[
  {key:'skill',label:'스킬 발동',hint:'스킬 컷인 대사',game:'own',emote:null}]},
 {key:'emote',label:'이모티콘 말풍선',slots:[
  {key:'laugh',label:'웃음',hint:'짧게 · 12자 안팎',game:'own',emote:'laugh',short:true},
  {key:'shock',label:'당황',hint:'짧게 · 12자 안팎',game:'own',emote:'shock',short:true},
  {key:'hello',label:'인사',hint:'짧게 · 12자 안팎',game:'own',emote:'hello',short:true},
  {key:'think',label:'의심',hint:'짧게 · 12자 안팎',game:'own',emote:'think',short:true}]},
 {key:'draw',label:'뽑기 반응',slots:[
  {key:'jokerGive',label:'조커를 넘겼을 때',hint:'상대가 내 조커를 뽑음',game:'common',emote:'laugh'},
  {key:'jokerTake',label:'조커를 받았을 때',hint:'내가 조커를 뽑음',game:'common',emote:'shock'},
  {key:'drawGive',label:'일반 카드를 줬을 때',hint:'상대가 내 카드를 뽑음',game:'common',emote:'think'},
  {key:'drawTake',label:'일반 카드를 가져왔을 때',hint:'내가 카드를 뽑음',game:'common',emote:'think'}]},
 {key:'result',label:'결과',slots:[
  {key:'win',label:'1등 종료',hint:'가장 먼저 손패를 털었을 때',game:'plan',emote:'laugh'},
  {key:'lose',label:'조커 패배',hint:'마지막까지 조커를 들고 있을 때',game:'plan',emote:'shock'}]}
];
export const SLOTS=GROUPS.flatMap(g=>g.slots.map(s=>({...s,group:g.key})));
export const GAME_LABEL={own:'게임 반영 중',common:'게임은 공통 문구',plan:'기획용'};
const COMMON={jokerGive:'휴… 이제 네 차례야.',jokerTake:'잠깐, 이건…!',drawGive:'어떤 카드였을까?',drawTake:'좋아, 다음은…'};
// Lines already written in docs/CHARACTERS.md, keyed by character asset id.
const WRITTEN={
 serena:{entry:'자기, 표정 관리부터 배워야겠는데?',affection:'오늘은 안 놀릴게. 그냥… 옆에 있어.',jokerTake:'……방금 웃은 거, 봤어.'},
 elysia:{entry:'저, 저도 같이 해도… 아, 이미 앉았네요.',affection:'제 얘기… 끝까지 들어준 사람, 처음이에요.'},
 lunea:{entry:'응… 시작하면 깨워 줘. 지금이라고?',affection:'안 졸려. 너랑 있을 땐… 조금 덜.'},
 rosette:{entry:'다 왔지? 오늘도 한 명만 울고 가는 거야!',affection:'오늘은 네가 나 좀 챙겨 주면 안 돼?'}
};
const EXTRA={lunea:[{situation:'방어 성공',text:'돌려줄게… 네가 가져.',emote:'',memo:'반사 결계가 스킬을 되돌렸을 때'}]};
export const characterKeys=()=>CHARACTERS.map(c=>c.assetId);
export function defaultLines(index){
 const c=CHARACTERS[index],lines={};
 for(const s of SLOTS)lines[s.key]=WRITTEN[c.assetId]?.[s.key]??(s.group==='emote'?c.emoteLabels[s.key]:s.key==='skill'?SKILL_PRESENTATIONS[index].quote:COMMON[s.key]??'');
 return lines;
}
export function newScript(){
 const characters={};
 CHARACTERS.forEach((c,i)=>{characters[c.assetId]={lines:defaultLines(i),extra:(EXTRA[c.assetId]??[]).map(e=>({...e})),notes:''};});
 return {version:SCRIPT_VERSION,title:'',characters};
}
export const skillName=index=>SKILLS[index].name;
const text=(v,max,field)=>{if(v==null)return '';if(typeof v!=='string')throw new Error(`${field}은(는) 문자열이어야 합니다.`);if(v.length>max)throw new Error(`${field}은(는) ${max}자 이하로 써 주세요.`);return v;};
// Accepts only the known shape; unknown slots/characters are dropped, missing ones fall back to blanks.
export function validateScript(input){
 if(!input||typeof input!=='object'||input.version!==SCRIPT_VERSION||!input.characters||typeof input.characters!=='object')throw new Error('대사 스크립트 형식(v1)이 아닙니다.');
 const out={version:SCRIPT_VERSION,title:text(input.title,100,'제목').trim(),characters:{}};
 CHARACTERS.forEach(c=>{
  const src=input.characters[c.assetId]??{},lines={};
  for(const s of SLOTS)lines[s.key]=text(src.lines?.[s.key],MAX_LINE,`${c.name} ${s.label}`);
  const extra=Array.isArray(src.extra)?src.extra:[];
  if(extra.length>MAX_EXTRA)throw new Error(`${c.name} 추가 대사는 ${MAX_EXTRA}개까지입니다.`);
  out.characters[c.assetId]={lines,notes:text(src.notes,MAX_NOTE,`${c.name} 메모`),extra:extra.map((e,i)=>({situation:text(e?.situation,40,`${c.name} 추가 ${i+1} 상황`),text:text(e?.text,MAX_LINE,`${c.name} 추가 ${i+1} 대사`),emote:['laugh','shock','hello','think'].includes(e?.emote)?e.emote:'',memo:text(e?.memo,200,`${c.name} 추가 ${i+1} 메모`)}))};
 });
 return out;
}
// Plain-text handoff document for writers or for whoever wires the lines into the game.
export function scriptMarkdown(script){
 const rows=[`# ${script.title||'라스트 원 대사 스크립트'}`,'',`작성 형식 v${script.version} · 표시: 게임 반영 중 / 게임은 공통 문구 / 기획용`,''];
 CHARACTERS.forEach((c,i)=>{
  const ch=script.characters[c.assetId];rows.push(`## ${c.name} — ${c.tag}`,'');
  for(const g of GROUPS){rows.push(`### ${g.label}`,'');for(const s of g.slots){const line=ch.lines[s.key];rows.push(`- ${s.key==='skill'?`${s.label} 「${skillName(i)}」`:s.label}: ${line?`“${line}”`:'(미작성)'} · ${GAME_LABEL[s.game]}`);}rows.push('');}
  if(ch.extra.length){rows.push('### 상황별 추가 대사','');for(const e of ch.extra)rows.push(`- ${e.situation||'상황 미정'}: ${e.text?`“${e.text}”`:'(미작성)'}${e.memo?` — ${e.memo}`:''}`);rows.push('');}
  if(ch.notes)rows.push('### 메모','',ch.notes,'');
 });
 return rows.join('\n');
}
