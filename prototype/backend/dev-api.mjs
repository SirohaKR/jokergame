import {createMatchService, MatchError} from './matches.mjs';
const statuses={INVALID_INPUT:400,INVALID_ACTION:400,FORBIDDEN:403,NOT_FOUND:404,CONFLICT:409,CAPACITY:429};
export function createDevApi({service=createMatchService(),tickMs=250}={}) {
 let timer=null;
 async function handle(req,res,pathname) {
  if(!pathname.startsWith('/api/dev/'))return false;
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  try {
   const route=pathname.match(/^\/api\/dev\/matches(?:\/([a-f0-9-]+)(?:\/(join|start|snapshot|commands))?)?$/);
   if(!route){send(404,{code:'NOT_FOUND'});return true;}
   const [,id,operation]=route;
   const read=id&&(!operation||operation==='snapshot');
   if(req.method!==(read?'GET':'POST')){res.setHeader('Allow',read?'GET':'POST');send(405,{code:'METHOD_NOT_ALLOWED'});return true;}
   // Bearer credentials are explicitly supplied; cookies and cross-origin browser writes are unsupported.
   if(req.headers.origin){send(403,{code:'ORIGIN_NOT_ALLOWED'});return true;}
   const token=req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
   let body={};
   if(!read) {
    if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){send(415,{code:'JSON_REQUIRED'});return true;}
    const chunks=[];let length=0;
    for await(const chunk of req){length+=chunk.length;if(length>16384){send(413,{code:'BODY_TOO_LARGE'});return true;}chunks.push(chunk);}
    try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{send(400,{code:'INVALID_JSON'});return true;}
    if(!body||typeof body!=='object'||Array.isArray(body)){send(400,{code:'INVALID_INPUT'});return true;}
   }
   if(!id)send(201,service.create(body));
   else if(operation==='join')send(200,service.join(id,body));
   else if(operation==='start')send(200,service.start(id,token));
   else if(operation==='snapshot')send(200,service.snapshot(id,token));
   else if(operation==='commands')send(200,service.command(id,token,body));
   else send(200,service.info(id,token));
  }catch(error){
   if(error instanceof MatchError)send(statuses[error.code]??400,{code:error.code,message:error.message});
   else {console.error('Development API failure:',error.name);send(500,{code:'INTERNAL_ERROR'});}
  }
  return true;
 }
 handle.start=()=>{if(timer===null){timer=setInterval(()=>service.tick(),tickMs);timer.unref();}};
 handle.stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 return handle;
}
