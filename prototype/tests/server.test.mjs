import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';
test('serves standalone SVG icons as images with nosniff for GET and HEAD',async()=>{
  const server=createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}/assets/ui/menu/svg/mode-ai.svg`;
    for(const method of ['GET','HEAD']){
      const response=await fetch(url,{method});
      assert.equal(response.status,200);
      assert.equal(response.headers.get('content-type'),'image/svg+xml');
      assert.equal(response.headers.get('x-content-type-options'),'nosniff');
      const body=await response.text();
      if(method==='GET')assert.match(body,/<svg\b/);
      else assert.equal(body,'');
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('serves frontend, health and explicit unimplemented API response',async()=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));try{const u=`http://127.0.0.1:${s.address().port}`;assert.equal((await fetch(u)).status,200);assert.equal((await (await fetch(u+'/api/health')).json()).database,'not-connected');assert.equal((await fetch(u+'/api/v1/matches')).status,501);assert.equal((await fetch(u+'/src/game.js')).headers.get('content-type'),'text/javascript; charset=utf-8');assert.equal((await fetch(u+'/missing')).status,404);}finally{await new Promise(r=>s.close(r));}});
