import path from 'node:path';
import {mkdir,readFile,readdir,writeFile,link,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateScript,scriptMarkdown,SLOTS} from '../frontend/scripts/model.js';
const validId=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const filled=script=>Object.values(script.characters).reduce((n,c)=>n+SLOTS.filter(s=>c.lines[s.key].trim()).length+c.extra.filter(e=>e.text.trim()).length,0);
const metadata=({id,title,createdAt,script})=>({id,title,createdAt,lines:filled(script)});
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'JSON 형식으로 저장해 주세요.');
 let bytes=0;const chunks=[];
 for await(const chunk of req){bytes+=chunk.length;if(bytes>1_000_000)throw fail(413,'대사 스크립트는 1MB 이하로 저장해 주세요.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'저장 데이터가 올바르지 않습니다.');}
}
// Same storage rules as UI plans: one immutable JSON file per save, retries with the same id are idempotent.
export function createScriptsApi(directory){
 const file=id=>path.join(directory,id+'.json');
 async function read(id){try{return JSON.parse(await readFile(file(id),'utf8'));}catch(e){if(e.code==='ENOENT')throw fail(404,'대사 스크립트를 찾을 수 없습니다.');throw e;}}
 return async(req,res,pathname)=>{
  if(!pathname.startsWith('/api/scripts'))return false;
  try{
   const match=/^\/api\/scripts(?:\/([^/]+)(?:\/(script\.json|script\.md))?)?$/.exec(pathname);
   if(!match||match[1]&&!validId(match[1]))throw fail(404,'대사 스크립트를 찾을 수 없습니다.');
   const [,id,asset]=match;
   if(req.method==='POST'&&!id){
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw fail(403,'같은 사이트에서 저장해 주세요.');
    const input=await body(req);
    if(!input||typeof input!=='object'||!validId(input.id))throw fail(400,'저장 요청이 올바르지 않습니다.');
    let script;try{script=validateScript(input.script);}catch(e){throw fail(400,e.message);}
    if(!script.title)throw fail(400,'제목을 입력해 주세요. 제목은 1~100자입니다.');
    const record={id:input.id,title:script.title,createdAt:new Date().toISOString(),script};
    await mkdir(directory,{recursive:true});
    const temporary=path.join(directory,`.${randomUUID()}.tmp`);
    let saved=record,status=201;
    try{await writeFile(temporary,JSON.stringify(record),{flag:'wx'});try{await link(temporary,file(record.id));}catch(e){if(e.code!=='EEXIST')throw e;saved=await read(record.id);if(JSON.stringify(saved.script)!==JSON.stringify(script))throw fail(409,'다른 저장 요청과 충돌했습니다. 다시 저장해 주세요.');status=200;}}
    finally{await unlink(temporary).catch(()=>{});}
    json(res,status,metadata(saved));return true;
   }
   if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow',id?'GET, HEAD':'GET, HEAD, POST');throw fail(405,'지원하지 않는 요청입니다.');}
   if(!id){
    let names;try{names=await readdir(directory);}catch(e){if(e.code!=='ENOENT')throw e;names=[];}
    const scripts=[];for(const name of names){if(!name.endsWith('.json')||!validId(name.slice(0,-5)))continue;scripts.push(metadata(await read(name.slice(0,-5))));}
    scripts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));json(res,200,req.method==='HEAD'?null:{scripts});return true;
   }
   const record=await read(id);
   if(asset==='script.md'){res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="script-${id}.md"`,'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:scriptMarkdown(record.script));return true;}
   if(asset==='script.json')res.setHeader('Content-Disposition',`attachment; filename="script-${id}.json"`);
   json(res,200,req.method==='HEAD'?null:asset?record.script:record);return true;
  }catch(e){json(res,e.status??500,{message:e.status?e.message:'대사 스크립트를 읽거나 저장하지 못했습니다. 저장 폴더 권한을 확인한 뒤 다시 시도해 주세요.'});return true;}
 };
}
