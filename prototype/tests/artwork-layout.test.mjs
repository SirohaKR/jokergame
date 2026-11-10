import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeArtworkLayout,readArtworkLayouts,saveArtworkLayout} from '../frontend/src/artwork-controls.js';
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};

test('artwork preferences recover from malformed data and clamp unsafe transforms',()=>{
 assert.deepEqual(normalizeArtworkLayout({x:Infinity,y:-400,scale:NaN}),{x:0,y:-40,scale:100});
 const db=storage();db.setItem('last-one-artwork-layouts-v1','{broken');assert.deepEqual(readArtworkLayouts(db),{});
 db.setItem('last-one-artwork-layouts-v1',JSON.stringify({version:1,layouts:{'home:serena:desktop':{x:999,y:5,scale:999},'unknown':{x:1}}}));
 assert.deepEqual(readArtworkLayouts(db),{'home:serena:desktop':{x:40,y:5,scale:160}});
});
test('saving one character preserves other characters and independent mobile framing',()=>{
 const db=storage();
 assert.ok(saveArtworkLayout(db,'home:serena:desktop',{x:12,y:-3,scale:80}));
 assert.ok(saveArtworkLayout(db,'home:elysia:desktop',{x:-8,y:2,scale:115}));
 assert.ok(saveArtworkLayout(db,'home:serena:mobile',{x:4,y:1,scale:92}));
 assert.deepEqual(readArtworkLayouts(db),{'home:serena:desktop':{x:12,y:-3,scale:80},'home:elysia:desktop':{x:-8,y:2,scale:115},'home:serena:mobile':{x:4,y:1,scale:92}});
});
test('unavailable browser storage reports save failure rather than success',()=>{
 const blocked={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};
 assert.deepEqual(readArtworkLayouts(blocked),{});
 assert.equal(saveArtworkLayout(blocked,'home:serena:desktop',{x:0,y:0,scale:100}),false);
});
