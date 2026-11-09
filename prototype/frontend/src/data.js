// Keep legacy IDs and numeric selection slots compatible with saved profiles and the dev API.
export const CHARACTERS=[
 {id:'seoha',assetId:'serena',name:'세레나',tag:'능청스러운 환영술사',color:'#b6a6cf',portrait:{size:'220%',x:'38%',y:'2%'},emoteLabels:{laugh:'후후, 귀여워',shock:'…잠깐?',hello:'왔어, 자기?',think:'정말 그럴까?'}},
 {id:'orca',assetId:'elysia',name:'엘리시아',tag:'상상 속에서는 대마법사',color:'#b8a4d8',portrait:{size:'220%',x:'51%',y:'6%'},emoteLabels:{laugh:'헤헤… 해냈다',shock:'이, 이럴 리가!',hello:'저… 안녕!',think:'단서를 찾았어…'}},
 {id:'haru',assetId:'lunea',name:'루네아',tag:'나른한 달빛 결계사',color:'#9eb5cc',portrait:{size:'220%',x:'36%',y:'10%'},emoteLabels:{laugh:'응… 좋네',shock:'…잠 다 깼어',hello:'하암… 안녕',think:'음… 수상해'}},
 {id:'yuna',assetId:'rosette',name:'로제트',tag:'살롱의 분위기 메이커',color:'#eb9caa',portrait:{size:'220%',x:'66%',y:'6%'},emoteLabels:{laugh:'아하하! 최고!',shock:'에에에?!',hello:'다들 안녕!',think:'너, 딱 걸렸어!'}}
];
// Character art shown on every screen: thigh-up lobby illustrations (transparent PNG, 1104×1824).
export const imagePath=c=>`assets/lobby/${c.assetId??c.id}.png`;
// Skill cut-in art from the shared Drive (스킬 folder). Characters without one fall back to their standing art.
export const SKILL_CUTINS={serena:'assets/skills/serena.webp',elysia:'assets/skills/elysia.webp',lunea:'assets/skills/lunea.webp',rosette:'assets/skills/rosette.webp'};
export const cutinPath=c=>SKILL_CUTINS[c.assetId??c.id]??null;
export function readProfile(){try{const p=JSON.parse(localStorage.getItem('joker-profile-v1'));return {nickname:typeof p?.nickname==='string'?p.nickname.slice(0,16):'플레이어',character:Number.isInteger(p?.character)&&p.character>=0&&p.character<4?p.character:0,sound:p?.sound!==false,sets:Number.isInteger(p?.sets)?p.sets:0};}catch{return {nickname:'플레이어',character:0,sound:true,sets:0};}}
export function saveProfile(p){try{localStorage.setItem('joker-profile-v1',JSON.stringify(p));return true;}catch{return false;}}
