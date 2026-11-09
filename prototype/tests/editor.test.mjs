import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,validateProject,element,moveElement,safeSource} from '../frontend/editor/model.js';
test('editor round-trips three scenes, uploaded images and delivery notes without shared references',()=>{
 const p=newProject();p.scenes.home.notes='대전 버튼을 오른쪽으로';p.scenes.home.elements.push(element('image',{src:'data:image/png;base64,YQ=='}));
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);assert.equal(Object.keys(p.scenes).length,3);
 const restored=validateProject(p);restored.scenes.home.elements[0].x=999;assert.notEqual(p.scenes.home.elements[0].x,999);
});
test('editor rejects unsafe sources, invalid properties, duplicate IDs and oversized scenes',()=>{
 for(const src of ['javascript:alert(1)','https://example.com/track.png','data:image/svg+xml;base64,YQ==','assets/../secret']){assert.equal(safeSource(src),false);const p=newProject();p.scenes.home.elements[0].src=src;assert.throws(()=>validateProject(p));}
 for(const [key,value]of [['x',NaN],['h',0],['opacity',2],['rotation',181],['background','url(x)'],['fit','invalid']]){const p=newProject();p.scenes.home.elements[0][key]=value;assert.throws(()=>validateProject(p));}
 const p=newProject();p.scenes.home.elements.push({...p.scenes.home.elements[0]});assert.throws(()=>validateProject(p),/중복/);
 p.scenes.home.elements=Array.from({length:201},()=>element('text'));assert.throws(()=>validateProject(p),/200/);assert.throws(()=>validateProject({...newProject(),version:2}));
});
test('drag snapping uses canvas coordinates and clamps to bounds',()=>{
 const e=element('button',{x:100,y:100,w:200,h:60}),s={width:1280,height:720};
 assert.deepEqual([moveElement(e,13,21,s,8).x,moveElement(e,13,21,s,8).y],[112,120]);assert.equal(moveElement(e,-500,0,s).x,0);assert.equal(moveElement(e,2000,2000,s).x,1080);assert.equal(moveElement(e,2000,2000,s).y,660);assert.equal(e.x,100);
});
