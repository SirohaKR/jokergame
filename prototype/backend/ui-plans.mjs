import path from 'node:path';
import {mkdir,readFile,readdir,writeFile,link,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateProject,SCENES} from '../frontend/editor/model.js';
import {wireframeSVG} from '../frontend/editor/wireframe.js';
const validId=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
const metadata=({id,title,createdAt,activeScene,project})=>({id,title,createdAt,activeScene,screens:Object.entries(project.scenes).map(([key,s])=>({key,width:s.width,height:s.height,count:s.elements.length}))});
const fail=(status,message)=>Object.assign(new Error(message),{status});
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'JSON 형식으로 저장해 주세요.');
 let bytes=0;const chunks=[];
 for await(const chunk of req){bytes+=chunk.length;if(bytes>16_100_000)throw fail(413,'기획안은 16MB 이하로 저장해 주세요.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'저장 데이터가 올바르지 않습니다.');}
}
export function createUIPlansApi(directory){
 const file=id=>path.join(directory,id+'.json');
 async function read(id){try{return JSON.parse(await readFile(file(id),'utf8'));}catch(e){if(e.code==='ENOENT')throw fail(404,'기획안을 찾을 수 없습니다.');throw e;}}
 return async(req,res,pathname)=>{
  if(!pathname.startsWith('/api/ui-plans'))return false;
  try{
   const match=/^\/api\/ui-plans(?:\/([^/]+)(?:\/(project\.json|home\.svg|room\.svg|game\.svg))?)?$/.exec(pathname);
   if(!match||match[1]&&!validId(match[1]))throw fail(404,'기획안을 찾을 수 없습니다.');
   const [,id,asset]=match;
   if(req.method==='POST'&&!id){
    // Same-origin JSON writes; no CORS permission or form-based writes.
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw fail(403,'같은 사이트에서 저장해 주세요.');
    const input=await body(req);
    if(!input||typeof input!=='object'||!validId(input.id)||typeof input.title!=='string'||!input.title.trim()||input.title.trim().length>100||!Object.hasOwn(SCENES,input.activeScene))throw fail(400,'제목과 화면을 확인하세요. 제목은 1~100자입니다.');
    let project;try{project=validateProject(input.project);}catch(e){throw fail(400,e.message);}
    const title=input.title.trim();project.name=title;
    const record={id:input.id,title,createdAt:new Date().toISOString(),activeScene:input.activeScene,project};
    await mkdir(directory,{recursive:true});
    // Publish a complete file atomically without replacing an existing save.
    const temporary=path.join(directory,`.${randomUUID()}.tmp`);
    let saved=record,status=201;
    try{await writeFile(temporary,JSON.stringify(record),{flag:'wx'});try{await link(temporary,file(record.id));}catch(e){if(e.code!=='EEXIST')throw e;saved=await read(record.id);if(saved.title!==title||saved.activeScene!==record.activeScene||JSON.stringify(saved.project)!==JSON.stringify(project))throw fail(409,'다른 저장 요청과 충돌했습니다. 다시 저장해 주세요.');status=200;}}
    finally{await unlink(temporary).catch(()=>{});}
    json(res,status,metadata(saved));return true;
   }
   if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow',id?'GET, HEAD':'GET, HEAD, POST');throw fail(405,'지원하지 않는 요청입니다.');}
   if(!id){
    let names;try{names=await readdir(directory);}catch(e){if(e.code!=='ENOENT')throw e;names=[];}
    const plans=[];for(const name of names){if(!name.endsWith('.json')||!validId(name.slice(0,-5)))continue;plans.push(metadata(await read(name.slice(0,-5))));}
    plans.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));json(res,200,req.method==='HEAD'?null:{plans});return true;
   }
   const record=await read(id);
   if(asset?.endsWith('.svg')){
    const key=asset.slice(0,-4);res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:wireframeSVG(record.project.scenes[key],record.title+' · '+SCENES[key]));return true;
   }
   if(asset==='project.json')res.setHeader('Content-Disposition',`attachment; filename="ui-plan-${id}.json"`);
   json(res,200,req.method==='HEAD'?null:asset?record.project:record);return true;
  }catch(e){json(res,e.status??500,{message:e.status?e.message:'기획안을 읽거나 저장하지 못했습니다. 저장 폴더 권한을 확인한 뒤 다시 시도해 주세요.'});return true;}
 };
}
