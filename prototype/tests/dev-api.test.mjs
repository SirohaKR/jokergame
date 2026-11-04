import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';
test('development HTTP API creates a four-player match and protects snapshots and commands',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/dev/matches`;
 const post=(url,body={},token,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} :{}),...headers},body:JSON.stringify(body)});
 const profile={nickname:'테스트',characterId:'seoha'};
 try{
  const created=await post(base,profile);assert.equal(created.status,201);
  const host=await created.json(),url=base+'/'+host.match.id,clients=[host];
  for(let i=0;i<3;i++){const res=await post(url+'/join',profile);assert.equal(res.status,200);clients.push(await res.json());}
  assert.equal((await post(url+'/start',{},clients[1].token)).status,403);
  assert.equal((await post(url+'/start',{},host.token)).status,200);
  assert.equal((await fetch(url+'/snapshot')).status,403);
  const response=await fetch(url+'/snapshot',{headers:{Authorization:`Bearer ${host.token}`}});
  assert.equal(response.headers.get('cache-control'),'no-store');
  const state=await response.json();assert.equal(state.seed,undefined);
  for(const player of state.players)if(player.id!==0)assert.ok(player.hand.every(c=>c.id===undefined));
  const command={commandId:'begin',expectedRevision:state.revision,action:{type:'BEGIN_DRAW'}};
  assert.equal((await post(url+'/commands',command,clients[state.actor].token)).status,200);
  assert.equal((await post(url+'/commands',command,clients[state.actor].token)).status,200);
  assert.equal((await post(base,profile,undefined,{Origin:'https://example.com'})).status,403);
  assert.equal((await post(base,null)).status,400);
  const malformed=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
  assert.equal((await fetch(base)).status,405);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('development API clock starts once, stops and can restart',async t=>{
 const {createDevApi}=await import('../backend/dev-api.mjs');
 t.mock.timers.enable({apis:['setInterval']});
 let ticks=0;const api=createDevApi({service:{tick(){ticks++;}},tickMs:250});
 api.start();api.start();t.mock.timers.tick(750);assert.equal(ticks,3);
 api.stop();t.mock.timers.tick(1000);assert.equal(ticks,3);
 api.start();t.mock.timers.tick(250);assert.equal(ticks,4);api.stop();
});
