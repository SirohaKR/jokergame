import {settingsButton} from './settings.js';
import {CHARACTERS,waitingArtwork} from './data.js';
import {SKILLS} from './game.js';
import {EMOTES,emoteSprite,emoteLabel} from './emotes.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const star='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2c0 10-4 14-14 14 10 0 14 4 14 14 0-10 4-14 14-14C20 16 16 12 16 2Z" stroke="currentColor"/></svg>';
export function waitingRoomMarkup({seats,nickname,aiLabel,emote=null}){
 const me=CHARACTERS[seats[0]];
 return `<main class="salon-room"><div class="salon-atmosphere" aria-hidden="true"><i class="salon-orbit orbit-a"></i><i class="salon-orbit orbit-b"></i><span class="salon-moon">☾</span><span class="salon-spark spark-a">✧</span><span class="salon-spark spark-b">✧</span></div>
 <header class="salon-nav"><button class="salon-back" data-action="home"><span aria-hidden="true">←</span> 로비로</button><div class="salon-wordmark">${star}<span>LAST ONE<small>라스트 원</small></span></div><div class="salon-tools"><span>AI 연습 대전</span>${settingsButton('salon-sound')}</div></header>
 <section class="salon-intro"><div><p class="salon-eyebrow">AI 대전</p><h1>대기실</h1></div><div class="salon-rules"><span><b>01</b> 세트</span><i></i><span><b>20</b> 초 / 턴</span><i></i><span>스킬 <b>1</b> 회</span></div></section>
 <section class="salon-guests" aria-label="대기실 참가자 4명">${seats.map((ci,i)=>{
  const c=CHARACTERS[ci],art=waitingArtwork(c),mine=i===0,name=mine?nickname:aiLabel(seats,i);
  return `<article class="salon-guest ${mine?'is-you':''}" style="--guest-color:${c.color};--guest-index:${i}"><div class="guest-art"><div class="guest-arch"><img class="guest-illustration" src="${esc(art.src)}" alt="${c.name} 대기 일러스트" style="--art-position:${esc(art.position)};--art-scale:${art.scale};--art-fit:${art.fit}"><div class="guest-wash"></div></div><span class="guest-ornament" aria-hidden="true">${star}</span><span class="guest-number" aria-hidden="true">0${i+1}</span><span class="guest-seat-label">${mine?'내 좌석':'AI'}</span>${mine&&emote?`<div class="salon-bubble" role="status">${emoteSprite(c,emote,'bubble-emote')}<span>${esc(emoteLabel(c,emote))}</span></div>`:''}</div>
  <div class="guest-caption"><div class="guest-identity"><span class="guest-ready" aria-label="준비 완료">✓</span><h2>${esc(name)}</h2>${mine?'<span class="guest-you">나</span>':''}</div><p>${c.name}<span> / </span>${c.tag}</p><span class="guest-skill" title="${esc(SKILLS[ci].description)}"><span aria-hidden="true">✧</span> ${SKILLS[ci].name}</span></div></article>`;
 }).join('')}</section>
 <footer class="salon-footer"><div class="salon-reactions"><span class="reactions-label">이모티콘</span><div class="salon-emotes" aria-label="대기실 이모티콘">${EMOTES.map(e=>`<button data-action="room-emote" data-value="${e.id}" aria-label="${e.description}">${emoteSprite(me,e.id)}</button>`).join('')}</div></div><div class="salon-ready"><span class="ready-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>준비 완료<small>4 / 4명 · 나 + AI 3명</small></span></div><button class="salon-start" data-action="start"><span>게임 시작</span><span class="start-arrow" aria-hidden="true">↗</span></button></footer>
 </main>`;
}
