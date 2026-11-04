import http from 'node:http';
import {createDevApi} from './dev-api.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,stat} from 'node:fs/promises';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {version}=JSON.parse(await readFile(path.join(base,'package.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8','.sql':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export function createServer(){const devApi=createDevApi();const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),p=decodeURIComponent(url.pathname);
    if(p==='/api/health'){if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}res.writeHead(200,{'Content-Type':types['.json']});res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',mode:'local-ai',version,database:'not-connected'}));return;}
    if(await devApi(req,res,p))return;
    if(p.startsWith('/api/')){res.writeHead(501,{'Content-Type':types['.json']});res.end(JSON.stringify({code:'NOT_IMPLEMENTED',message:'온라인 API는 설계 단계입니다.'}));return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const root=path.join(base,p.startsWith('/docs')?'docs':'frontend');
    let relative=p.startsWith('/docs')?p.slice(5):p;
    if(!relative||relative==='/')relative=p.startsWith('/docs')?'/design.html':'/index.html';
    const file=path.resolve(root,'.'+relative);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
 server.on('listening',devApi.start);server.on('close',devApi.stop);
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||4173,host=process.env.HOST||'127.0.0.1';
 createServer().listen(port,host,()=>console.log(`도둑잡기: http://${host}:${port}\n기획서: http://${host}:${port}/docs/\nSwagger: http://${host}:${port}/docs/api.html`));
}
