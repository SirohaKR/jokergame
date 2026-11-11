import {settingsButton} from './settings.js';
import {CHARACTERS,imagePath,FACE_CROPS} from './data.js';
import {EMOTES,emoteSprite,emoteLabel} from './emotes.js';
import {SKILLS} from './game.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={move:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4',eyeOff:'M3 3l18 18M10 5a14 14 0 0 1 12 7 20 20 0 0 1-4 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 4-1M9 9a4 4 0 0 0 6 6',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm14 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6',shuffle:'M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4',cards:'M7 5 4 6l-2 13 11 2 1-4M8 2h12v15H8zM14 6v7m-3-3.5h6',person:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',smile:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 9h.01M16 9h.01M8 14s1 3 4 3 4-3 4-3',shop:'M3 9h18l-2-6H5L3 9Zm1 0v12h16V9M9 21v-7h6v7',friends:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5',record:'M5 3h14v18H5zM9 7h6M9 12h6M9 17h4',help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 8a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01',sound:'M4 9h4l5-5v16l-5-5H4V9Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',arrow:'m9 5 7 7-7 7',back:'m15 5-7 7 7 7',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3'};
export const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]??paths.cards}"/></svg>`;
const tools=()=>`<details class="hub-devtools"><summary aria-label="제작 도구">···</summary><nav aria-label="제작 도구"><a href="/editor.html">UI 편집</a><a href="/ui-plans.html">UI 디자인 기획</a><a href="/scripts.html">대사 편집</a></nav></details>`;
const stageBackdrop=()=>`<div class="hub-backdrop" aria-hidden="true"></div>`;
const skillIcon=index=>icon(['cards','eye','shield','shuffle'][index]??'cards');
// Independent semantic SVG symbols; no embedded raster artwork or background.
const MENU_ART={
 three:'mode-regular',short:'mode-short',friendMatch:'mode-friend',cards:'mode-ai',
 person:'menu-characters',shop:'menu-shop',friends:'menu-friends',record:'menu-record',help:'menu-help'
};
const menuArt=name=>`<img class="menu-art" src="assets/ui/menu/svg/${MENU_ART[name]??MENU_ART.cards}.svg" alt="" aria-hidden="true" draggable="false" width="80" height="80">`;
export function lobbyHomeMarkup({profile,selectedCharacter,homeLine,modes}){
 const c=CHARACTERS[selectedCharacter],emote=EMOTES[homeLine%EMOTES.length].id;
 return `<main class="game-hub">${stageBackdrop()}<header class="hub-header"><div class="hub-account">${collectionPortrait(c)}<label><small>PLAYER</small><input id="nickname" aria-label="닉네임" value="${esc(profile.nickname)}" maxlength="16" autocomplete="off"></label></div><div class="hub-header-right"><span class="hub-play-count">${icon('cards')}<span>플레이 <b>${profile.sets}</b></span></span>${settingsButton()}${tools()}</div></header>
 <section class="hub-character" aria-label="현재 파트너"><button class="hub-art-button" data-action="poke" aria-label="${c.name}에게 말 걸기"><img class="hub-art" draggable="false" src="${imagePath(c)}" alt="${c.name}"></button>${homeLine?`<div class="hub-dialogue" role="status">${emoteSprite(c,emote,'hub-dialogue-emote')}<span>${esc(emoteLabel(c,emote))}</span></div>`:''}</section>
 <nav class="hub-help" aria-label="도움말"><button data-action="help">${menuArt('help',c)}<span>게임 방법</span></button></nav>
 <nav class="hub-quick" aria-label="일러스트 도구"><button data-action="artwork-edit" aria-label="일러스트 위치와 크기 조정" title="크기·위치 조정" aria-expanded="false">${icon('move')}</button><button data-action="artwork-hide-ui" aria-label="UI 감추기" title="UI 감추기">${icon('eyeOff')}</button></nav>
 <section class="hub-play" aria-label="대전 모드"><div class="hub-play-heading"><span>대전</span><small>GAME MODE</small></div><div class="hub-modes">${modes.map(m=>`<button data-action="${m.open?'lobby':'locked'}" class="hub-mode mode-${m.id} mode-${m.size} ${m.open?'available':'unavailable'}" ${m.open?'':'aria-disabled="true"'}><span class="mode-art">${menuArt(m.art,c)}</span><span class="mode-label"><small>${m.open?'플레이 가능':'준비 중'}</small><b>${m.name}</b>${m.size!=='compact'?`<em>${m.sub}</em>`:''}</span><span class="mode-arrow">${icon(m.open?'arrow':'lock')}</span></button>`).join('')}</div></section>
 <footer class="hub-footer"><div class="hub-brand">${icon('cards')}<span>라스트 원<small>LAST ONE</small></span></div><nav class="hub-dock" aria-label="로비 메뉴">${[['person','캐릭터','characters',false],['shop','상점','locked',true],['friends','친구','locked',true],['record','전적','locked',true]].map(([glyph,label,action,locked])=>`<button class="hub-dock-item ${locked?'unavailable':''}" data-action="${action}" ${locked?'aria-disabled="true"':''}><span class="dock-emblem">${menuArt(glyph,c)}</span><span>${label}</span>${locked?'<small>준비 중</small>':''}</button>`).join('')}</nav></footer></main>`;
}
// Availability is deliberately separate from the selected partner. Replace this
// catalog policy with server-owned entitlements when currency unlocks are added.
export const CHARACTER_ACCESS=Object.fromEntries(CHARACTERS.map(c=>[c.assetId,{available:true}]));
export const canUseCharacter=index=>Boolean(CHARACTERS[index]&&CHARACTER_ACCESS[CHARACTERS[index].assetId]?.available);
const descriptions=[
 '상대의 반응을 살피며 장난을 거는 환영술사. 일반 카드를 상대에게 넘겨 손패를 줄입니다.',
 '책 속 이야기에 빠져 있는 마법 견습생. 상대 한 명의 손패를 확인해 다음 선택을 준비합니다.',
 '야간 점검을 맡는 결계사. 자신을 대상으로 하는 스킬을 되돌려 상대의 공격에 대응합니다.',
 '사람들과 어울리는 것을 좋아하는 음유시인. 손패가 가장 많을 때 남은 패를 다시 나눕니다.'
];
const roles=['카드 전달','패 확인','스킬 반사','패 재분배'];
// Square crops in the 1104×1824 lobby artwork. Match eye height and face scale,
// rather than the hair silhouette; these crops only affect the collection roster.
const collectionCrops=FACE_CROPS;
const collectionPortrait=c=>{
 const crop=collectionCrops[c.assetId];
 const framing=crop?`--face-zoom:${1104/crop.size*100}%;background-position:${crop.x/(1104-crop.size)*100}% ${crop.y/(1824-crop.size)*100}%`:`background-position:${c.portrait.x} ${c.portrait.y}`;
 return `<span class="collection-face" style="background-image:url('${imagePath(c)}');${framing}"></span>`;
};
export function characterScreenMarkup({selectedCharacter,viewedCharacter,previewEmote}){
 const c=CHARACTERS[viewedCharacter],skill=SKILLS[viewedCharacter],available=canUseCharacter(viewedCharacter),active=selectedCharacter===viewedCharacter;
 return `<main class="character-hub">${stageBackdrop()}<header class="collection-header"><button class="collection-back" data-action="home">${icon('back')} 로비</button><h1 tabindex="-1">캐릭터<small>CHARACTERS</small></h1><span class="collection-count">${CHARACTERS.filter((_,i)=>canUseCharacter(i)).length} / ${CHARACTERS.length} 사용 가능</span>${settingsButton()}</header>
 <section class="collection-art" tabindex="0" aria-label="${c.name} 일러스트. 좌우 방향키 또는 스와이프로 캐릭터 변경"><div class="collection-stage-status">${icon('person')} ${active?'현재 파트너':'캐릭터 미리보기'}</div><img draggable="false" src="${imagePath(c)}" alt="${c.name}"><button class="collection-arrow previous" data-action="previous-character" aria-label="이전 캐릭터">${icon('back')}</button><button class="collection-arrow next" data-action="next-character" aria-label="다음 캐릭터">${icon('arrow')}</button><div class="collection-name" aria-live="polite"><small>${c.tag}</small><h2>${c.name}</h2><span>${skillIcon(viewedCharacter)} ${roles[viewedCharacter]??''}</span></div><span class="collection-page">${viewedCharacter+1} / ${CHARACTERS.length}</span></section>
 <section class="collection-panel" aria-label="캐릭터 정보"><div class="collection-panel-cap"><span>${icon('person')} 캐릭터 정보</span><small>${String(viewedCharacter+1).padStart(2,'0')}</small></div><div class="collection-content"><div class="character-about"><h3>${c.name}<span>${available?'사용 가능':'미해금'}</span></h3><p>${descriptions[viewedCharacter]??c.tag}</p></div><section class="collection-skill"><div class="skill-heading"><span class="skill-emblem">${skillIcon(viewedCharacter)}</span><span>스킬<small>세트당 1회</small></span></div><h4>${skill?.name??'준비 중'}</h4><p>${skill?.description??''}</p><small class="skill-condition">사용 시점 · 내 차례, 카드 뽑기 전</small></section>
 <section class="collection-emote-section" aria-label="이모티콘"><h4>${icon('smile')} 이모티콘 <small>${EMOTES.length}종</small></h4><div class="collection-emotes">${EMOTES.map(e=>`<button class="${previewEmote===e.id?'selected':''}" data-action="character-emote" data-emote="${e.id}" aria-pressed="${previewEmote===e.id}">${emoteSprite(c,e.id)}<span>${e.description}</span></button>`).join('')}</div><p class="collection-emote-caption" role="status">${esc(emoteLabel(c,previewEmote))}</p></section></div>
 <div class="collection-apply"><span>${active?'현재 로비와 대전에서 사용 중':available?'로비와 대전에 사용할 캐릭터를 지정합니다.':'해금 후 파트너로 지정할 수 있습니다.'}</span><button data-action="equip-character" ${active||!available?'disabled':''}>${active?'✓ 현재 파트너':available?'파트너로 지정':'미해금 캐릭터'}${!active&&available?icon('arrow'):''}</button></div></section>
 <section class="collection-library" aria-label="캐릭터 목록"><div class="collection-library-heading"><span>${icon('person')} 캐릭터 목록 <b>${CHARACTERS.length}</b></span><small>좌우로 넘겨 선택</small></div><div class="collection-roster">${CHARACTERS.map((v,i)=>`<button class="roster-item ${i===viewedCharacter?'selected':''}" data-action="inspect-character" data-index="${i}" aria-pressed="${i===viewedCharacter}" aria-label="${v.name} 정보 보기">${collectionPortrait(v)}<span>${v.name}</span><small>${i===selectedCharacter?'파트너':canUseCharacter(i)?'사용 가능':'미해금'}</small></button>`).join('')}</div></section></main>`;
}
