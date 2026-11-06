// Presentation takes only the player-filtered skill event, never the full hand state.
export const SKILL_PRESENTATIONS=[
 {type:'gift',quote:'선물이야. 반품은 사절.',result:'일반 카드 한 장을 전달했습니다. 생긴 페어는 자동으로 정리됩니다.'},
 {type:'peek',quote:'운명의 장막을… 한 장만 볼게요!',result:'한 장을 확인한 뒤, 열람한 손패의 순서를 섞었습니다.'},
 {type:'reflect',quote:'음… 이건 돌려줄게.',result:'다음 내 차례 전까지 나를 향한 첫 전달·열람 스킬을 반사합니다.'},
 {type:'redeal',quote:'잠깐! 이 분위기, 싹 바꾸자!',result:'남은 사람들의 패를 다시 나누고 페어를 정리했습니다.'}
];
export function skillFeedback(event){
 const p=SKILL_PRESENTATIONS[event.kind];
 return {...p,result:event.reflected?(event.kind===0?'반사! 카드는 보낸 사람에게 남고, 두 사람의 스킬 사용·보호 효과가 소모됐습니다.':'반사! 보호받던 상대가 시전자의 카드 한 장을 확인하고 그 손패를 섞었습니다.'):p.result,
 privateLabel:event.kind===0?'전달 당사자에게만 보이는 카드':'열람자에게만 보이는 카드'};
}
export function skillEffectMarkup(event){
 const type=SKILL_PRESENTATIONS[event.kind].type;
 const n=event.kind===3?8:event.kind===1?3:1;
 return `<div class="skill-effect effect-${type}${event.reflected?' is-reflected':''}" aria-hidden="true"><i class="skill-ring ring-one"></i><i class="skill-ring ring-two"></i>${Array.from({length:n},(_,i)=>`<span class="effect-card" style="--card-index:${i};--card-angle:${i*45}deg"><i></i></span>`).join('')}</div>`;
}
// Full-width character cut-in shown at the start of every skill. Purely decorative: no card data.
export function skillCutinMarkup(character,{name,skillName,cutin,standing}){
 const art=cutin?`<img class="cutin-art" src="${cutin}" alt="">`:`<img class="cutin-art is-standing" src="${standing}" alt="">`;
 return `<div class="skill-cutin" aria-hidden="true" style="--accent:${character.color}"><div class="cutin-band">${art}</div><div class="cutin-title"><small>SKILL</small><b>${skillName}</b><span>${name}</span></div><i class="cutin-flash"></i></div>`;
}
