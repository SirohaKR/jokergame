// Pure rules. No DOM, clock, storage or network dependencies.
export const POINTS = [1000, 500, 0, -500];
export const SUITS = ['♠', '♥', '♦', '♣'];
export function seededRandom(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function makeDeck() {
  return [...SUITS.flatMap((suit, s) => Array.from({length:13}, (_, i) => ({id:`${s}-${i+1}`,rank:i+1,suit}))), {id:'joker',rank:0,suit:'★'}];
}
export function shuffle(items, random=Math.random) {
  const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
export function pairs(hand) {
  const pending=new Map(), out=[];
  for(const card of hand){if(card.rank===0)continue; if(pending.has(card.rank)){out.push([pending.get(card.rank),card.id]);pending.delete(card.rank);}else pending.set(card.rank,card.id);}
  return out;
}
function removePair(state, seat, pair) {
  const hand=state.players[seat].hand;
  state.discarded.push(...hand.filter(c=>pair.includes(c.id)));
  state.players[seat].hand=hand.filter(c=>!pair.includes(c.id));
}
function finishEmpty(state, seat) {
  if(!state.players[seat].hand.length&&!state.order.includes(seat))state.order.push(seat);
}
function endIfDone(state) {
  if(state.order.length===3){const last=state.players.findIndex(p=>p.hand.length);state.order.push(last);state.phase='ended';return true;}return false;
}
export function nextActive(state, seat) {
  for(let n=1;n<=4;n++){const i=(seat+n)%4;if(state.players[i].hand.length)return i;}return -1;
}
export function createGame(seed=Date.now(), characters=[0,1,2,3]) {
  const random=seededRandom(seed),deck=shuffle(makeDeck(),random);
  const state={seed,players:characters.map((character,id)=>({id,character,hand:[]})),discarded:[],order:[],actor:seed%4,phase:'action',selected:null,draw:null,turn:1,revision:0,skillUsed:[false,false,false,false],shields:[false,false,false,false],skill:null};
  deck.forEach((c,i)=>state.players[i%4].hand.push(c));
  state.players.forEach((p,i)=>pairs(p.hand).forEach(pair=>removePair(state,i,pair)));
  // Rare opening ties: clockwise from the starting seat (documented provisional rule).
  for(let n=0;n<4;n++)finishEmpty(state,(state.actor+n)%4);
  if(!endIfDone(state)&&!state.players[state.actor].hand.length)state.actor=nextActive(state,state.actor);
  return state;
}
function advance(state) {
  finishEmpty(state,state.actor);
  if(endIfDone(state))return;
  state.actor=nextActive(state,state.actor);if(state.shields)state.shields[state.actor]=false;state.phase='action';state.selected=null;state.draw=null;state.turn++;
}
export const SKILLS = [
 {id:'gift',name:'이건 네 거♡',description:'조커를 제외한 내 카드 한 장을 상대에게 넘깁니다. 생긴 페어는 자동 제거됩니다.'},
 {id:'peek',name:'금지된 한 페이지',description:'상대 카드 한 장을 나만 확인하고 그 손패를 섞습니다.'},
 {id:'reflect',name:'반송할게…',description:'다음 내 차례 전까지 나를 향한 첫 스킬을 되돌립니다.'},
 {id:'redeal',name:'자, 판 다시 짜자!',description:'내 손패가 최다일 때 남은 모든 패를 다시 나눕니다. 공동 최다도 사용 가능합니다.'}
];
export function skillUnavailable(state,seat=state.actor) {
 if(state.phase!=='action'||seat!==state.actor||!state.players[seat]?.hand.length)return '내 차례에 카드 뽑기 전만 사용할 수 있어요.';
 if(state.skillUsed?.[seat])return '이번 세트에서 이미 사용했어요.';
 const kind=state.players[seat].character;
 if(!SKILLS[kind])return '알 수 없는 캐릭터입니다.';
 if(kind===0&&!state.players[seat].hand.some(c=>c.rank!==0))return '조커는 넘길 수 없어요.';
 if(kind===3&&state.players.some(p=>p.hand.length>state.players[seat].hand.length))return '손패가 가장 많을 때만 사용할 수 있어요.';
 return null;
}
function useSkill(s,action) {
 const reason=skillUnavailable(s);if(reason)throw new Error(reason);
 const actor=s.actor,kind=s.players[actor].character,target=action.target;
 if(kind===0||kind===1){
  if(!Number.isInteger(target)||target===actor||!s.players[target]?.hand.length)throw new Error('다른 생존자를 선택하세요.');
 }
 let chosen;
 if(kind===0){chosen=s.players[actor].hand.find(c=>c.id===action.cardId);if(!chosen||chosen.rank===0)throw new Error('넘길 일반 카드를 선택하세요.');}
 if(kind===1&&(!Number.isInteger(action.index)||!s.players[target].hand[action.index]))throw new Error('확인할 카드를 선택하세요.');
 s.skillUsed??=[false,false,false,false];s.shields??=[false,false,false,false];
 s.skillUsed[actor]=true;
 const reflected=(kind===0||kind===1)&&s.shields[target];
 if(reflected)s.shields[target]=false;
 const event={actor,kind,target:kind<2?target:null,reflected:Boolean(reflected),privateViews:[]};
 const random=seededRandom((s.seed??0)^Math.imul(s.revision,0x9e3779b1));
 if(kind===0&&!reflected){
  s.players[actor].hand=s.players[actor].hand.filter(c=>c.id!==chosen.id);
  s.players[target].hand.push(chosen);finishEmpty(s,actor);
  for(const pair of pairs(s.players[target].hand))removePair(s,target,pair);
  finishEmpty(s,target);
  event.privateViews=[{seat:actor,card:{rank:chosen.rank,suit:chosen.suit}},{seat:target,card:{rank:chosen.rank,suit:chosen.suit}}];
 }else if(kind===1){
  const subject=reflected?actor:target,viewer=reflected?target:actor;
  const hand=s.players[subject].hand,index=reflected?Math.floor(random()*hand.length):action.index;
  event.privateViews=[{seat:viewer,card:{rank:hand[index].rank,suit:hand[index].suit}}];
  s.players[subject].hand=shuffle(hand,random);
 }else if(kind===2){s.shields[actor]=true;}
 else if(kind===3){
  const seats=Array.from({length:4},(_,i)=>(actor+i)%4).filter(i=>s.players[i].hand.length);
  const deck=shuffle(seats.flatMap(i=>s.players[i].hand),random);
  for(const seat of seats)s.players[seat].hand=[];
  deck.forEach((card,i)=>s.players[seats[i%seats.length]].hand.push(card));
  for(const seat of seats){for(const pair of pairs(s.players[seat].hand))removePair(s,seat,pair);finishEmpty(s,seat);}
 }
 s.skill=event;s.draw=null;s.selected=null;s.phase='skill';
}
export function botSkillAction(state,random=Math.random) {
 if(skillUnavailable(state)||random()>.35)return null;
 const kind=state.players[state.actor].character;
 if(kind>=2)return {type:'USE_SKILL'};
 const targets=state.players.filter(p=>p.id!==state.actor&&p.hand.length);
 const target=kind===1?nextActive(state,state.actor):targets[Math.floor(random()*targets.length)].id;
 if(kind===1)return {type:'USE_SKILL',target,index:Math.floor(random()*state.players[target].hand.length)};
 const cards=state.players[state.actor].hand.filter(c=>c.rank!==0);
 return {type:'USE_SKILL',target,cardId:cards[Math.floor(random()*cards.length)].id};
}
export function dispatch(state, action) {
  if(state.phase==='ended')throw new Error('이미 종료된 세트입니다.');
  const s=structuredClone(state);s.revision++;
  if(s.phase==='skill'&&action.type!=='END_SKILL')throw new Error('스킬 연출 중입니다.');
  if(action.type==='USE_SKILL'){useSkill(s,action);
  }else if(action.type==='END_SKILL'){
    if(s.phase!=='skill')throw new Error('스킬 연출 단계가 아닙니다.');
    s.skill=null;s.phase='action';
    if(!endIfDone(s)&&!s.players[s.actor].hand.length)advance(s);
  }else if(action.type==='BEGIN_DRAW'){
    if(s.phase!=='action')throw new Error('뽑기를 시작할 수 없습니다.');
    s.phase='select';s.selected=null;
  }else if(action.type==='SELECT'){
    if(s.phase!=='select')throw new Error('카드 선택 단계가 아닙니다.');
    const source=nextActive(s,s.actor),hand=s.players[source].hand;
    if(!Number.isInteger(action.index)||!hand[action.index])throw new Error('유효하지 않은 카드입니다.');
    s.selected=action.index;
  }else if(action.type==='DRAW'){
    if(s.phase!=='select')throw new Error('카드를 뽑을 수 없습니다.');
    const source=nextActive(s,s.actor),index=action.index??s.selected;
    if(!Number.isInteger(index)||!s.players[source].hand[index])throw new Error('카드를 선택하세요.');
    const [card]=s.players[source].hand.splice(index,1);
    s.players[s.actor].hand.push(card);
    // Provider empties first, before the drawing player's pair is discarded.
    finishEmpty(s,source);
    s.draw={actor:s.actor,source,card};s.phase='reveal';
  }else if(action.type==='END_REVEAL'){
    if(s.phase!=='reveal')throw new Error('결과 단계가 아닙니다.');
    if(pairs(s.players[s.actor].hand).length)s.phase='discard';else advance(s);
  }else if(action.type==='DISCARD'){
    if(s.phase!=='discard')throw new Error('페어 정리 단계가 아닙니다.');
    const pair=pairs(s.players[s.actor].hand).find(p=>action.cardId==null||p.includes(action.cardId));
    if(!pair)throw new Error('버릴 수 있는 페어가 아닙니다.');
    removePair(s,s.actor,pair);
    if(!pairs(s.players[s.actor].hand).length)advance(s);
  }else if(action.type==='REORDER'){
    const seat=action.seat;
    if(!Number.isInteger(seat)||!s.players[seat])throw new Error('잘못된 좌석입니다.');
    const locked=(s.phase==='select'&&[s.actor,nextActive(s,s.actor)].includes(seat))||(s.phase==='reveal'&&[s.draw.actor,s.draw.source].includes(seat));
    if(locked||(s.phase==='discard'&&s.actor===seat))throw new Error('지금은 손패를 움직일 수 없습니다.');
    const hand=s.players[seat].hand;
    if(!Array.isArray(action.ids)||action.ids.length!==hand.length||new Set(action.ids).size!==hand.length||action.ids.some(id=>!hand.some(c=>c.id===id)))throw new Error('손패 순서가 올바르지 않습니다.');
    s.players[seat].hand=action.ids.map(id=>hand.find(c=>c.id===id));
  }else throw new Error('알 수 없는 행동입니다.');
  return s;
}
// Public/player-specific projection, usable by a future authoritative server.
export function viewFor(state, viewer) {
  const result=state.draw&&[state.draw.actor,state.draw.source].includes(viewer)?structuredClone(state.draw):null;
  const participants=state.phase==='reveal'&&state.draw?[state.draw.actor,state.draw.source]:[state.actor,nextActive(state,state.actor)];
  const skill=state.phase==='skill'&&state.skill?{actor:state.skill.actor,kind:state.skill.kind,target:state.skill.target,reflected:state.skill.reflected,card:structuredClone(state.skill.privateViews.find(v=>v.seat===viewer)?.card??null)}:null;
  return {skill,skillUsed:[...(state.skillUsed??[false,false,false,false])],shields:[...(state.shields??[false,false,false,false])],phase:state.phase,actor:state.actor,turn:state.turn,order:[...state.order],revision:state.revision,selected:participants.includes(viewer)?state.selected:null,draw:result,
    players:state.players.map(p=>({id:p.id,character:p.character,hand:p.id===viewer?structuredClone(p.hand):p.hand.map((_,i)=>({slot:i}))})),discardedCount:state.discarded.length};
}
export function label(card) {return card.rank===0?'JOKER':({1:'A',11:'J',12:'Q',13:'K'}[card.rank]??String(card.rank));}
