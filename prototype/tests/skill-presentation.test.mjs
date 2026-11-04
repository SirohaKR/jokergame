import test from 'node:test';
import assert from 'node:assert/strict';
import {skillFeedback,skillEffectMarkup} from '../frontend/src/skill-presentation.js';
import {createGame,dispatch,viewFor} from '../frontend/src/game.js';
test('each skill has a distinct effect; public markup never contains revealed card information',()=>{
 const types=new Set();
 for(let kind=0;kind<4;kind++){
  const event={kind,reflected:false,card:{rank:13,suit:'♥'}};
  types.add(skillFeedback(event).type);
  assert.equal(skillEffectMarkup(event),skillEffectMarkup({...event,card:null}));
  assert.ok(!skillEffectMarkup(event).includes('♥'));
 }
 assert.equal(types.size,4);
 assert.match(skillFeedback({kind:0,reflected:true}).result,/반사/);
 assert.match(skillEffectMarkup({kind:0,reflected:true}),/is-reflected/);
});
test('peek presentation retains viewer privacy even when reflected',()=>{
 for(const reflected of [false,true]){
  const s=createGame(24,[1,2,0,3]);s.shields[1]=reflected;
  const n=dispatch(s,{type:'USE_SKILL',target:1,index:0});
  for(let seat=0;seat<4;seat++){
   const event=viewFor(n,seat).skill;
   assert.equal(Boolean(event.card),seat===(reflected?1:0));
   assert.match(skillFeedback(event).privateLabel,/열람자/);
  }
 }
});
