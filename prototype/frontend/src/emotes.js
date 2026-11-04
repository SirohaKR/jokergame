export const EMOTES = [
  {id:'laugh',label:'후후!',description:'웃음',x:0,y:0},
  {id:'shock',label:'앗!',description:'당황',x:100,y:0},
  {id:'hello',label:'안녕!',description:'인사',x:0,y:100},
  {id:'think',label:'수상한데…',description:'의심',x:100,y:100}
];
export const EMOTE_DURATION=2000;
export const EMOTE_COOLDOWN=3000;
export function emoteById(id){return EMOTES.find(e=>e.id===id)??null;}
export function canSendEmote(id,lastSent,now){return Boolean(emoteById(id))&&(lastSent==null||now-lastSent>=EMOTE_COOLDOWN);}
export function privateDrawCue(state,viewer=0){
  if(state.phase!=='reveal'||!state.draw||![state.draw.actor,state.draw.source].includes(viewer))return null;
  return state.draw.card.rank===0?{giver:'laugh',taker:'shock',sound:'joker'}:{giver:null,taker:null,sound:'click'};
}
// One 2x2 transparent atlas per character, kept intact; no destructive image crops.
export function emoteSprite(character,id,extraClass=''){
  const e=emoteById(id);if(!e)return '';
  return `<span class="emote-sprite ${extraClass}" role="img" aria-label="${character.name} ${e.description}" style="--emote-image:url('assets/emotes/${character.id}.png');--emote-x:${e.x}%;--emote-y:${e.y}%"></span>`;
}
