import {settingsButton} from './settings.js';
import {CHARACTERS,waitingArtwork,FACE_CROPS} from './data.js';
import {SKILLS} from './game.js';
import {EMOTES,emoteSprite,emoteLabel} from './emotes.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const star='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2c0 10-4 14-14 14 10 0 14 4 14 14 0-10 4-14 14-14C20 16 16 12 16 2Z" stroke="currentColor"/></svg>';
export function waitingRoomMarkup({seats,nickname,aiLabel,emote=null}){
 const me=CHARACTERS[seats[0]];
 const back='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>';
 const chevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
 return `<main class="game-hub room-hub"><div class="hub-backdrop" aria-hidden="true"></div>
 <header class="room-bar"><button class="room-bar-back" data-action="home">${back}<span>로비</span></button><div class="room-bar-title"><small>WAITING ROOM</small><h1>대기실</h1><span>AI 대전</span></div><div class="room-bar-rules" aria-label="규칙"><span><small>SET</small><b>1</b>세트</span><span><small>TURN</small><b>20</b>초</span><span><small>SKILL</small><b>1</b>회</span></div>${settingsButton()}</header>
 <section class="room-seats" aria-label="대기실 참가자 4명">${seats.map((ci,i)=>{
  const c=CHARACTERS[ci],art=waitingArtwork(c),mine=i===0,name=mine?nickname:aiLabel(seats,i);
  return `<article class="room-seat ${mine?'is-you':''}" style="--seat-index:${i}"><div class="room-seat-art">${(()=>{const f=FACE_CROPS[c.assetId??c.id];return f?`<img class="is-framed" src="${esc(art.src)}" alt="${c.name} 대기 일러스트" style="--fx:${f.x};--fy:${f.y};--fs:${f.size}">`:`<img src="${esc(art.src)}" alt="${c.name} 대기 일러스트" style="--art-position:${esc(art.position)};--art-scale:${art.scale};--art-fit:${art.fit}">`;})()}</div><span class="room-seat-no" aria-hidden="true">0${i+1}</span><span class="room-seat-tag">${mine?'PLAYER':'AI'}</span>${mine&&emote?`<div class="room-bubble" role="status">${emoteSprite(c,emote,'bubble-emote')}<span>${esc(emoteLabel(c,emote))}</span></div>`:''}
  <div class="room-seat-plate"><div class="room-seat-name"><span class="room-ready" aria-label="준비 완료">✓</span><h2>${esc(name)}</h2>${mine?'<span class="room-you">나</span>':''}</div><p>${c.name} · ${c.tag}</p><span class="room-skill" title="${esc(SKILLS[ci].description)}"><small>SKILL</small>${SKILLS[ci].name}</span></div></article>`;
 }).join('')}</section>
 <footer class="room-foot"><div class="room-emote-bar"><small>EMOTE</small><div class="room-emotes" aria-label="대기실 이모티콘">${EMOTES.map(e=>`<button data-action="room-emote" data-value="${e.id}" aria-label="${e.description}">${emoteSprite(me,e.id)}</button>`).join('')}</div></div><div class="room-status"><b>준비 완료</b><small>4 / 4명 · 나 + AI 3명</small></div><button class="room-start" data-action="start"><span><small>GAME START</small><b>게임 시작</b></span>${chevron}</button></footer>
 </main>`;
}
