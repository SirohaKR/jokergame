import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,dispatch,nextActive} from '../frontend/src/game.js';
test('waiting players can reorder during selection, reveal and another player discard',()=>{
 let s=createGame(24);s=dispatch(s,{type:'BEGIN_DRAW'});
 const source=nextActive(s,s.actor),waiting=[0,1,2,3].find(i=>![s.actor,source].includes(i));
 for(const phase of ['select','reveal','discard']){
  if(phase==='reveal')s=dispatch(s,{type:'DRAW',index:0});
  if(phase==='discard')s={...s,phase:'discard'};
  const ids=s.players[waiting].hand.map(c=>c.id).reverse();
  const before=JSON.stringify(s.players[s.actor].hand);
  s=dispatch(s,{type:'REORDER',seat:waiting,ids});
  assert.deepEqual(s.players[waiting].hand.map(c=>c.id),ids);
  assert.equal(JSON.stringify(s.players[s.actor].hand),before);
  assert.equal(s.phase,phase);
  assert.throws(()=>dispatch(s,{type:'REORDER',seat:s.actor,ids:s.players[s.actor].hand.map(c=>c.id)}));
 }
});
