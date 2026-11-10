import test from 'node:test';
import assert from 'node:assert/strict';
import {readProfile,saveProfile} from '../frontend/src/data.js';

test('legacy profiles retain mute and character choices; invalid volumes recover or clamp',()=>{
 const previous=globalThis.localStorage;
 let value;
 globalThis.localStorage={getItem:()=>value,setItem:(_,v)=>{value=v;}};
 try{
  value=JSON.stringify({nickname:'테스터',character:2,sound:false,sets:7});
  let p=readProfile();assert.equal(p.sound,false);assert.equal(p.soundVolume,100);assert.equal(p.character,2);
  p.soundVolume=37;assert.equal(saveProfile(p),true);assert.deepEqual(readProfile(),p);
  for(const [input,expected] of [[-20,0],[130,100],[22.6,23],[null,100],['80',100]]){
   value=JSON.stringify({...p,soundVolume:input});assert.equal(readProfile().soundVolume,expected);
  }
  value='{broken';assert.equal(readProfile().soundVolume,100);
  globalThis.localStorage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.equal(readProfile().soundVolume,100);assert.equal(saveProfile(p),false);
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
