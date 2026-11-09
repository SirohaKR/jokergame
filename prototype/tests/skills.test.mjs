import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,dispatch,viewFor,botSkillAction,seededRandom,nextActive,makeDeck,skillUnavailable} from '../frontend/src/game.js';
function fixture(hands,character=0){const s=createGame(24);s.actor=0;s.players.forEach((p,i)=>p.hand=hands[i]);s.players[0].character=character;s.order=hands.flatMap((h,i)=>h.length?[]:[i]);s.phase='action';s.discarded=[];return s;}
const c=(id,rank)=>({id,rank,suit:'♠'});
test('gift requires at least two cards, excludes joker, and resolves recipient pairs',()=>{
 for(const card of [c('a',1),c('joker',0)]){
  const s=fixture([[card],[c('b',1)],[c('c',2)],[c('d',3)]]);
  const before=structuredClone(s);
  assert.match(skillUnavailable(s),/1장/);
  assert.throws(()=>dispatch(s,{type:'USE_SKILL',target:1,cardId:card.id}),/1장/);
  assert.equal(botSkillAction(s,()=>0),null);assert.deepEqual(s,before);
 }
 const s=fixture([[c('a',1),c('joker',0)],[c('b',1)],[],[c('d',3)]]);
 assert.throws(()=>dispatch(s,{type:'USE_SKILL',target:0,cardId:'a'}));
 assert.throws(()=>dispatch(s,{type:'USE_SKILL',target:1,cardId:'joker'}));
 const n=dispatch(s,{type:'USE_SKILL',target:1,cardId:'a'});
 assert.deepEqual(n.order,[2,1]);assert.equal(s.players[0].hand.length,2);
 assert.equal(viewFor(n,0).skill.card.rank,1);assert.equal(viewFor(n,2).skill.card,null);
 assert.throws(()=>dispatch(n,{type:'REORDER',seat:3,ids:['d']}));
 assert.equal(dispatch(n,{type:'END_SKILL'}).actor,0);
});
test('reflection consumes once; reflected gift stays with caster; reflected peek visible only to defender',()=>{
 for(const kind of [0,1]){
 const s=fixture([[c('a',1),c('aa',4)],[c('b',2)],[c('c',3)],[c('joker',0)]],kind);s.shields[1]=true;
 const n=dispatch(s,{type:'USE_SKILL',target:1,cardId:'a',index:0});
 assert.equal(n.shields[1],false);assert.equal(n.skill.reflected,true);
 assert.equal(n.players[0].hand.length,2);
 assert.equal(viewFor(n,0).skill.card,null);
 if(kind===1){
  assert.deepEqual(viewFor(n,1).skill.cards,[{rank:1,suit:'♠'},{rank:4,suit:'♠'}]);
  const done=dispatch(n,{type:'END_SKILL'});
  assert.equal(viewFor(done,1).players[0].hand[0].rank,1);
  assert.deepEqual(viewFor(done,0).players[1].hand,[{slot:0}]);
 }
 assert.equal(viewFor(n,2).skill.card,null);
 const done=dispatch(n,{type:'END_SKILL'});assert.equal(done.actor,0);assert.ok(skillUnavailable(done));
 }
});
test('peek reveals no IDs or private records to anyone; shield expires on next own turn',()=>{
 let s=fixture([[c('a',1)],[c('b',2)],[c('c',3)],[c('joker',0)]],1);
 s=dispatch(s,{type:'USE_SKILL',target:1,index:0});
 assert.deepEqual(viewFor(s,0).skill.cards,[{rank:2,suit:'♠'}]);
 assert.equal(viewFor(s,1).skill.cards,null);
 assert.deepEqual(viewFor(s,0).players[1].hand,[{slot:0,rank:2,suit:'♠'}]);
 assert.equal(viewFor(s,0).knownHands,undefined);
 assert.equal(viewFor(s,1).skill.card,null);assert.equal(viewFor(s,0).skill.privateViews,undefined);
 s=fixture([[c('a',1)],[c('b',2)],[c('c',3)],[c('joker',0)]],2);
 s=dispatch(dispatch(s,{type:'USE_SKILL'}),{type:'END_SKILL'});assert.equal(s.shields[0],true);
 // A different player's turn advances to the protected seat.
 s.actor=3;s.phase='discard';s.players[3].hand.push(c('d',4),c('e',4));
 s=dispatch(s,{type:'DISCARD'});assert.equal(s.actor,0);assert.equal(s.shields[0],false);
});
test('redeal requires maximum, accepts ties and never resurrects finished seats',()=>{
 let s=fixture([[c('a',1)],[c('b',2),c('c',3)],[],[c('joker',0)]],3);
 assert.throws(()=>dispatch(s,{type:'USE_SKILL'}));
 s.players[0].hand.push(c('d',4));s=dispatch(s,{type:'USE_SKILL'});
 assert.equal(s.players[2].hand.length,0);assert.equal(s.order[0],2);
 assert.equal(s.players.flatMap(p=>p.hand).length+s.discarded.length,5);
});
test('100 seeded games with all skills conserve 53 unique cards and terminate',()=>{
 for(let seed=0;seed<100;seed++){
 let s=createGame(seed),steps=0;const random=seededRandom(seed+9000);
 while(s.phase!=='ended'&&steps++<5000){
 const action=s.phase==='action'?(botSkillAction(s,random)??{type:'BEGIN_DRAW'}):s.phase==='skill'?{type:'END_SKILL'}:s.phase==='select'?{type:'DRAW',index:Math.floor(random()*s.players[nextActive(s,s.actor)].hand.length)}:s.phase==='reveal'?{type:'END_REVEAL'}:{type:'DISCARD'};
 s=dispatch(s,action);
 const all=[...s.discarded,...s.players.flatMap(p=>p.hand)];assert.equal(all.length,53);assert.equal(new Set(all.map(c=>c.id)).size,53);
 }
 assert.equal(s.phase,'ended',`seed ${seed}`);assert.equal(new Set(s.order).size,4);
 }
});

test('full-hand peek persists across reorder, hides new cards and forgets cards that leave then return',()=>{
 let s=fixture([[c('a',1),c('aa',4)],[c('b',2),c('joker',0)],[c('new',3)],[c('d',5)]],1);
 const before=structuredClone(s);
 s=dispatch(s,{type:'USE_SKILL',target:1});
 assert.deepEqual(before.players[1].hand,s.players[1].hand);
 assert.equal(before.skillUsed[0],false);
 assert.deepEqual(viewFor(s,0).skill.cards,[{rank:2,suit:'♠'},{rank:0,suit:'♠'}]);
 for(const seat of [1,2,3,-1]){
  assert.equal(viewFor(s,seat).skill.cards,null);
  if(seat!==1)assert.deepEqual(viewFor(s,seat).players[1].hand,[{slot:0},{slot:1}]);
 }
 s=dispatch(s,{type:'END_SKILL'});
 s=dispatch(s,{type:'REORDER',seat:1,ids:['joker','b']});
 assert.deepEqual(viewFor(s,0).players[1].hand.map(c=>c.rank),[0,2]);
 s.actor=1;s=dispatch(s,{type:'BEGIN_DRAW'});s=dispatch(s,{type:'DRAW',index:0});
 assert.deepEqual(viewFor(s,0).players[1].hand,[{slot:0,rank:0,suit:'♠'},{slot:1,rank:2,suit:'♠'},{slot:2}]);
 s=dispatch(s,{type:'END_REVEAL'});
 s.actor=0;s=dispatch(s,{type:'BEGIN_DRAW'});s=dispatch(s,{type:'DRAW',index:1});
 s=dispatch(s,{type:'END_REVEAL'});
 s.actor=0;s.players[0].character=0;s.skillUsed[0]=false;
 s=dispatch(s,{type:'USE_SKILL',target:1,cardId:'b'});
 assert.deepEqual(viewFor(s,0).players[1].hand,[{slot:0,rank:0,suit:'♠'},{slot:1},{slot:2}]);
});

test('pair removal forgets observed cards; redeal clears every observation',()=>{
 let s=fixture([[c('a',1)],[c('b',2),c('joker',0)],[c('pair',2),c('c',3)],[c('d',4)]],1);
 s=dispatch(dispatch(s,{type:'USE_SKILL',target:1}),{type:'END_SKILL'});
 s.actor=1;s=dispatch(s,{type:'BEGIN_DRAW'});s=dispatch(s,{type:'DRAW',index:0});
 s=dispatch(s,{type:'END_REVEAL'});s=dispatch(s,{type:'DISCARD'});
 assert.deepEqual(s.knownHands[0].ids,['joker']);
 assert.deepEqual(viewFor(s,0).players[1].hand,[{slot:0,rank:0,suit:'♠'}]);
 s.actor=3;s=dispatch(s,{type:'USE_SKILL'});
 assert.deepEqual(s.knownHands,[]);
 assert.ok(viewFor(s,0).players.filter(p=>p.id!==0).every(p=>p.hand.every(c=>c.rank===undefined)));
});
