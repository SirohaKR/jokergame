export const CHARACTERS=[
 {id:'seoha',name:'서하',tag:'차분한 승부사',color:'#7c9acb',portrait:{size:'265%',x:'53%',y:'9%'}},
 {id:'orca',name:'오르카',tag:'느긋한 장난꾸러기',color:'#b5a3d1',portrait:{size:'260%',x:'50%',y:'12%'}},
 {id:'haru',name:'하루',tag:'다정한 포커페이스',color:'#d8b39b',portrait:{size:'275%',x:'49%',y:'8%'}},
 {id:'yuna',name:'유나',tag:'조용한 반전',color:'#a6c8bd',portrait:{size:'240%',x:'53%',y:'6%'}}
];
export const imagePath=c=>`assets/characters/${c.id}.png`;
export function readProfile(){try{const p=JSON.parse(localStorage.getItem('joker-profile-v1'));return {nickname:typeof p?.nickname==='string'?p.nickname.slice(0,16):'플레이어',character:Number.isInteger(p?.character)&&p.character>=0&&p.character<4?p.character:0,sound:p?.sound!==false,sets:Number.isInteger(p?.sets)?p.sets:0};}catch{return {nickname:'플레이어',character:0,sound:true,sets:0};}}
export function saveProfile(p){try{localStorage.setItem('joker-profile-v1',JSON.stringify(p));return true;}catch{return false;}}
