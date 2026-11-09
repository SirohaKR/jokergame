import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from '../backend/server.mjs';
import {newScript,validateScript,scriptMarkdown,SLOTS} from '../frontend/scripts/model.js';
import {CHARACTERS} from '../frontend/src/data.js';
import {SKILL_PRESENTATIONS} from '../frontend/src/skill-presentation.js';
async function start(dir){const server=createServer({scriptsDir:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};}
const post=(url,data)=>fetch(url+'/api/scripts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
test('a new script starts from the lines the game shows today',()=>{
 const s=newScript();
 CHARACTERS.forEach((c,i)=>{const lines=s.characters[c.assetId].lines;assert.equal(lines.skill,SKILL_PRESENTATIONS[i].quote);for(const k of ['laugh','shock','hello','think'])assert.equal(lines[k],c.emoteLabels[k]);assert.deepEqual(Object.keys(lines),SLOTS.map(x=>x.key));});
 assert.equal(s.characters.elysia.lines.skill,'힉…! 시, 실례할게요…!');
 assert.deepEqual(validateScript(s),s);
});
test('validation drops unknown fields and rejects oversized or wrong-typed lines',()=>{
 const s=newScript();s.characters.serena.lines.hack='x';s.characters.ghost={};s.characters.lunea.extra.push({situation:'연승',text:'또 나야?',emote:'bogus',memo:'',extra:1});
 const v=validateScript(s);assert.equal(v.characters.serena.lines.hack,undefined);assert.equal(v.characters.ghost,undefined);assert.equal(v.characters.lunea.extra.at(-1).emote,'');assert.equal(v.characters.lunea.extra.at(-1).extra,undefined);
 const long=newScript();long.characters.rosette.lines.win='가'.repeat(121);assert.throws(()=>validateScript(long),/120자/);
 const bad=newScript();bad.characters.rosette.lines.win=3;assert.throws(()=>validateScript(bad),/문자열/);
 assert.throws(()=>validateScript({version:2}),/v1/);
 const md=scriptMarkdown(validateScript(s));assert.match(md,/## 엘리시아/);assert.match(md,/연승: “또 나야\?”/);assert.match(md,/1등 종료: \(미작성\)/);
});
test('titled scripts persist, list newest first, export as JSON and Markdown, and retries do not duplicate',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'scripts-'));let server=await start(dir);
 try{
  assert.deepEqual(await(await fetch(server.url+'/api/scripts')).json(),{scripts:[]});
  const untitled={id:randomUUID(),script:newScript()};assert.equal((await post(server.url,untitled)).status,400);
  const script=newScript();script.title='1차 대사';script.characters.serena.lines.win='후후, 다음엔 봐줄게.';
  const data={id:randomUUID(),script};const rs=await Promise.all([post(server.url,data),post(server.url,data)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,201]);
  await server.close();server=await start(dir);
  const second={id:randomUUID(),script:{...script,title:'2차 대사'}};assert.equal((await post(server.url,second)).status,201);
  const {scripts}=await(await fetch(server.url+'/api/scripts')).json();assert.deepEqual(scripts.map(s=>s.title),['2차 대사','1차 대사']);assert.ok(scripts[0].lines>40);
  const json=await fetch(server.url+`/api/scripts/${data.id}/script.json`);assert.match(json.headers.get('content-disposition'),/attachment/);assert.equal((await json.json()).characters.serena.lines.win,'후후, 다음엔 봐줄게.');
  const md=await fetch(server.url+`/api/scripts/${data.id}/script.md`);assert.match(md.headers.get('content-type'),/markdown/);assert.match(await md.text(),/1등 종료: “후후, 다음엔 봐줄게\.”/);
  assert.equal((await fetch(server.url+'/api/scripts/not-an-id')).status,404);
  assert.equal((await fetch(server.url+'/api/scripts',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://evil.example'},body:JSON.stringify(second)})).status,403);
  for(const f of ['/scripts.html','/scripts/studio.js','/scripts/model.js','/scripts/studio.css'])assert.equal((await fetch(server.url+f)).status,200);
 }finally{await server.close();await rm(dir,{recursive:true,force:true});}
});
