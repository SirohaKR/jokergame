import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,dispatch,makeDeck,pairs,nextActive,viewFor,seededRandom} from '../frontend/src/game.js';
const card=(id,rank)=>({id,rank,suit:'♠'});
test('deck has 52 standard cards and exactly one joker',()=>{const d=makeDeck();assert.equal(d.length,53);assert.equal(new Set(d.map(c=>c.id)).size,53);assert.equal(d.filter(c=>c.rank===0).length,1);for(let r=1;r<=13;r++)assert.equal(d.filter(c=>c.rank===r).length,4);});
test('provider finishes before drawing player when both empty in a draw',()=>{
 let s={players:[{id:0,hand:[card('a',7)]},{id:1,hand:[card('b',7)]},{id:2,hand:[card('c',8)]},{id:3,hand:[card('d',8),card('joker',0)]}],actor:0,order:[],phase:'action',discarded:[],turn:1,revision:0};
 s=dispatch(s,{type:'BEGIN_DRAW'});s=dispatch(s,{type:'DRAW',index:0});assert.deepEqual(s.order,[1]);
 s=dispatch(s,{type:'END_REVEAL'});assert.equal(s.phase,'discard');s=dispatch(s,{type:'DISCARD'});assert.deepEqual(s.order,[1,0]);assert.equal(s.actor,2);
});
test('invalid actions rejected and inputs remain immutable',()=>{const s=createGame(31),old=JSON.stringify(s);assert.throws(()=>dispatch(s,{type:'DRAW',index:0}));const a=dispatch(s,{type:'BEGIN_DRAW'});assert.throws(()=>dispatch(a,{type:'SELECT',index:-1}));assert.equal(JSON.stringify(s),old);});
test('only draw participants see the card and selection',()=>{let s=createGame(12);s=dispatch(s,{type:'BEGIN_DRAW'});const source=nextActive(s,s.actor),other=[0,1,2,3].find(i=>![s.actor,source].includes(i));s=dispatch(s,{type:'SELECT',index:0});assert.equal(viewFor(s,other).selected,null);s=dispatch(s,{type:'DRAW',index:0});assert.equal(viewFor(s,other).draw,null);assert.ok(viewFor(s,source).draw.card);assert.ok(viewFor(s,s.actor).draw.card);for(const p of viewFor(s,other).players)if(p.id!==other)for(const c of p.hand){assert.equal(c.rank,undefined);assert.equal(c.id,undefined);}});
test('1000 seeded games finish, conserve cards and leave one joker',()=>{
 for(let seed=1;seed<=1000;seed++){
  let s=createGame(seed),n=0;const rng=seededRandom(seed+91);
  for(const p of s.players)assert.equal(pairs(p.hand).length,0);
  while(s.phase!=='ended'&&n++<5000){
   const a=s.phase==='action'?{type:'BEGIN_DRAW'}:s.phase==='select'?{type:'DRAW',index:Math.floor(rng()*s.players[nextActive(s,s.actor)].hand.length)}:s.phase==='reveal'?{type:'END_REVEAL'}:{type:'DISCARD'};
   s=dispatch(s,a);const cards=[...s.discarded,...s.players.flatMap(p=>p.hand)];assert.equal(cards.length,53);assert.equal(new Set(cards.map(c=>c.id)).size,53);
  }
  assert.equal(s.phase,'ended',`seed ${seed}`);assert.equal(new Set(s.order).size,4);assert.deepEqual(s.players[s.order[3]].hand.map(c=>c.rank),[0]);assert.equal(s.discarded.length,52);
 }
});
test('reorder preserves exact hand and rejects edits while being drawn from',()=>{let s=createGame(24);const source=nextActive(s,s.actor),ids=s.players[source].hand.map(c=>c.id).reverse();s=dispatch(s,{type:'REORDER',seat:source,ids});assert.deepEqual(s.players[source].hand.map(c=>c.id),ids);assert.throws(()=>dispatch(s,{type:'REORDER',seat:source,ids:['fake']}));s=dispatch(s,{type:'BEGIN_DRAW'});assert.throws(()=>dispatch(s,{type:'REORDER',seat:source,ids}));});
test('public projections never expose RNG seed or selection to replacement source',()=>{
 let s={seed:42,players:[{id:0,hand:[card('a',7)]},{id:1,hand:[card('b',7)]},{id:2,hand:[card('c',8)]},{id:3,hand:[card('d',8),card('joker',0)]}],actor:0,order:[],phase:'action',discarded:[],turn:1,revision:0};
 s=dispatch(s,{type:'BEGIN_DRAW'});s=dispatch(s,{type:'SELECT',index:0});s=dispatch(s,{type:'DRAW'});
 assert.equal(viewFor(s,2).selected,null);assert.equal(viewFor(s,2).draw,null);assert.equal(viewFor(s,0).seed,undefined);
});
