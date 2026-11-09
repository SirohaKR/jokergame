import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from '../backend/server.mjs';
import {newProject} from '../frontend/editor/model.js';
import {wireframeSVG} from '../frontend/editor/wireframe.js';
async function start(dir){const server=createServer({uiPlansDir:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};}
const input=()=>({id:randomUUID(),title:'로비 배치 수정안',activeScene:'home',project:newProject()});
const post=(url,data,headers={})=>fetch(url+'/api/ui-plans',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
test('named plans persist across server restarts, render all wireframes and reopen the original project',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ui-plans-'));let server=await start(dir);
 try{
  assert.deepEqual(await(await fetch(server.url+'/api/ui-plans')).json(),{plans:[]});
  const data=input();data.project.scenes.home.notes='대전 버튼 위치 조정';
  const response=await post(server.url,data);assert.equal(response.status,201);const meta=await response.json();assert.equal(meta.title,data.title);assert.equal(meta.screens.length,3);
  await server.close();server=await start(dir);
  const listing=await(await fetch(server.url+'/api/ui-plans')).json();assert.equal(listing.plans.length,1);assert.equal(listing.plans[0].id,data.id);assert.equal(listing.plans[0].project,undefined);
  const record=await(await fetch(server.url+'/api/ui-plans/'+data.id)).json();assert.equal(record.project.scenes.home.notes,'대전 버튼 위치 조정');assert.equal(record.project.name,data.title);
  const project=await fetch(server.url+`/api/ui-plans/${data.id}/project.json`);assert.match(project.headers.get('content-disposition'),/attachment/);assert.deepEqual(await project.json(),record.project);
  for(const key of ['home','room','game']){const svg=await fetch(server.url+`/api/ui-plans/${data.id}/${key}.svg`);assert.equal(svg.status,200);assert.match(svg.headers.get('content-type'),/image\/svg/);assert.match(await svg.text(),/<svg/);}
  for(const file of ['/ui-plans.html','/editor/plans.js'])assert.equal((await fetch(server.url+file)).status,200);
 }finally{await server.close();await rm(dir,{recursive:true,force:true});}
});
test('save retries are idempotent and subsequent saves preserve older designs',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ui-plans-')),server=await start(dir);
 try{
  const data=input();const responses=await Promise.all([post(server.url,data),post(server.url,data)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);
  assert.equal((await(await fetch(server.url+'/api/ui-plans')).json()).plans.length,1);
  assert.equal((await post(server.url,{...data,title:'changed'})).status,409);
  assert.equal((await post(server.url,{...data,id:randomUUID()})).status,201);
  assert.equal((await(await fetch(server.url+'/api/ui-plans')).json()).plans.length,2);
  assert.equal((await readdir(dir)).filter(n=>n.endsWith('.tmp')).length,0);
 }finally{await server.close();await rm(dir,{recursive:true,force:true});}
});
test('invalid plans and cross-origin writes do not create records; disk failures are reported',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ui-plans-')),server=await start(dir);
 try{
  for(const data of [null,{...input(),id:'../../escape'},{...input(),title:'  '},{...input(),activeScene:'__proto__'},{...input(),project:{}}])assert.equal((await post(server.url,data)).status,400);
  assert.equal((await post(server.url,input(),{Origin:'https://other.example'})).status,403);
  assert.equal((await fetch(server.url+'/api/ui-plans/'+randomUUID())).status,404);
  assert.equal((await fetch(server.url+'/api/ui-plans',{method:'DELETE'})).status,405);
  assert.deepEqual(await readdir(dir),[]);
 }finally{await server.close();}
 const blocked=path.join(dir,'blocked');await writeFile(blocked,'file');const other=await start(blocked);
 try{const response=await post(other.url,input());assert.equal(response.status,500);assert.match((await response.json()).message,/저장하지 못했습니다/);}finally{await other.close();await rm(dir,{recursive:true,force:true});}
});
test('wireframes escape user content and show image placeholders without scripts or asset data',()=>{
 const p=newProject(),s=p.scenes.home;s.elements[0].text='<script>alert("x")</script>&';s.elements[1].visible=false;s.elements[1].text='HIDDEN-SENTINEL';
 const svg=wireframeSVG(s,'<unsafe>');assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('HIDDEN-SENTINEL'));assert.ok(!svg.includes('<image'));assert.ok(!svg.includes('assets/'));assert.match(svg,/&lt;unsafe&gt;/);assert.match(svg,/캐릭터/);assert.match(svg,/clipPath/);
});
