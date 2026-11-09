import test from 'node:test';
import assert from 'node:assert/strict';
import {canSendEmote,privateDrawCue,EMOTES} from '../frontend/src/emotes.js';
test('공개 이모티콘은 유효한 종류만 3초마다 전송',()=>{
 assert.equal(canSendEmote('hello',null,0),true);
 assert.equal(canSendEmote('hello',0,2999),false);
 assert.equal(canSendEmote('hello',0,3000),true);
 assert.equal(canSendEmote('invalid',null,4000),false);
 assert.equal(new Set(EMOTES.map(e=>`${e.x},${e.y}`)).size,4);
});
test('조커 자동 반응과 효과음은 뽑기 당사자만 수신',()=>{
 const s={phase:'reveal',draw:{actor:1,source:2,card:{rank:0}}};
 assert.equal(privateDrawCue(s,0),null);
 assert.equal(privateDrawCue(s,3),null);
 for(const viewer of [1,2])assert.deepEqual(privateDrawCue(s,viewer),{giver:'laugh',taker:'shock',sound:'joker'});
 assert.equal(privateDrawCue({...s,phase:'select'},1),null);
 s.draw.card.rank=7;assert.deepEqual(privateDrawCue(s,1),{giver:null,taker:null,sound:'click'});
});

test('new character artwork and captions keep legacy selections compatible',async()=>{
 const {CHARACTERS,imagePath}=await import('../frontend/src/data.js');
 const {emoteSprite,emoteLabel}=await import('../frontend/src/emotes.js');
 assert.deepEqual(CHARACTERS.map(c=>c.id),['seoha','orca','haru','yuna']);
 assert.deepEqual(CHARACTERS.map(c=>c.assetId),['serena','elysia','lunea','rosette']);
 for(const e of EMOTES)assert.equal(new Set(CHARACTERS.map(c=>emoteLabel(c,e.id))).size,4);
 for(const c of CHARACTERS){assert.equal(imagePath(c),`assets/lobby/${c.assetId}.png`);assert.ok(emoteSprite(c,'laugh').includes(`assets/emotes/${c.assetId}.png`));}
});
