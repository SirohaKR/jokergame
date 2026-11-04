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
  const state={seed,players:characters.map((character,id)=>({id,character,hand:[]})),discarded:[],order:[],actor:seed%4,phase:'action',selected:null,draw:null,turn:1,revision:0};
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
  state.actor=nextActive(state,state.actor);state.phase='action';state.selected=null;state.draw=null;state.turn++;
}
export function dispatch(state, action) {
  if(state.phase==='ended')throw new Error('이미 종료된 세트입니다.');
  const s=structuredClone(state);s.revision++;
  if(action.type==='BEGIN_DRAW'){
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
  return {phase:state.phase,actor:state.actor,turn:state.turn,order:[...state.order],revision:state.revision,selected:participants.includes(viewer)?state.selected:null,draw:result,
    players:state.players.map(p=>({id:p.id,character:p.character,hand:p.id===viewer?structuredClone(p.hand):p.hand.map((_,i)=>({slot:i}))})),discardedCount:state.discarded.length};
}
export function label(card) {return card.rank===0?'JOKER':({1:'A',11:'J',12:'Q',13:'K'}[card.rank]??String(card.rank));}
