import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';
test('serves frontend, health and explicit unimplemented API response',async()=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));try{const u=`http://127.0.0.1:${s.address().port}`;assert.equal((await fetch(u)).status,200);assert.equal((await (await fetch(u+'/api/health')).json()).database,'not-connected');assert.equal((await fetch(u+'/api/v1/matches')).status,501);assert.equal((await fetch(u+'/src/game.js')).headers.get('content-type'),'text/javascript; charset=utf-8');assert.equal((await fetch(u+'/missing')).status,404);}finally{await new Promise(r=>s.close(r));}});
