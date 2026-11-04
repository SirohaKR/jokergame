// Keep legacy IDs and numeric selection slots compatible with saved profiles and the dev API.
export const CHARACTERS=[
 {id:'seoha',assetId:'serena',name:'세레나',tag:'능청스러운 환영술사',color:'#b6a6cf',portrait:{size:'400%',x:'50%',y:'8%'},emoteLabels:{laugh:'후후, 귀여워',shock:'…잠깐?',hello:'왔어, 자기?',think:'정말 그럴까?'}},
 {id:'orca',assetId:'elysia',name:'엘리시아',tag:'상상 속에서는 대마법사',color:'#b8a4d8',portrait:{size:'400%',x:'50%',y:'9%'},emoteLabels:{laugh:'헤헤… 해냈다',shock:'이, 이럴 리가!',hello:'저… 안녕!',think:'단서를 찾았어…'}},
 {id:'haru',assetId:'lunea',name:'루네아',tag:'나른한 달빛 결계사',color:'#9eb5cc',portrait:{size:'400%',x:'50%',y:'10%'},emoteLabels:{laugh:'응… 좋네',shock:'…잠 다 깼어',hello:'하암… 안녕',think:'음… 수상해'}},
 {id:'yuna',assetId:'rosette',name:'로제트',tag:'살롱의 분위기 메이커',color:'#eb9caa',portrait:{size:'400%',x:'50%',y:'9%'},emoteLabels:{laugh:'아하하! 최고!',shock:'에에에?!',hello:'다들 안녕!',think:'너, 딱 걸렸어!'}}
];
export const imagePath=c=>`assets/characters/${c.assetId??c.id}.png`;
export function readProfile(){try{const p=JSON.parse(localStorage.getItem('joker-profile-v1'));return {nickname:typeof p?.nickname==='string'?p.nickname.slice(0,16):'플레이어',character:Number.isInteger(p?.character)&&p.character>=0&&p.character<4?p.character:0,sound:p?.sound!==false,sets:Number.isInteger(p?.sets)?p.sets:0};}catch{return {nickname:'플레이어',character:0,sound:true,sets:0};}}
export function saveProfile(p){try{localStorage.setItem('joker-profile-v1',JSON.stringify(p));return true;}catch{return false;}}
