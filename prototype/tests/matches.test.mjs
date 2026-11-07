import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatchService} from '../backend/matches.mjs';
import {SKILL_STAGE_MS} from '../frontend/src/skill-presentation.js';
const profile={nickname:'플레이어',characterId:'seoha'};
function setup() {
 let time=1000;
 const service=createMatchService({now:()=>time,seed:()=>24});
 const host=service.create(profile),id=host.match.id;
 const clients=[host,...Array.from({length:3},()=>service.join(id,profile))];
 return {service,id,clients,advance:ms=>{time+=ms;}};
}
const code=expected=>error=>error.code===expected;
test('rooms enforce membership, capacity and host start; credentials never appear in summaries',()=>{
 const {service,id,clients}=setup();
 assert.throws(()=>service.info(id,'invalid'),code('FORBIDDEN'));
 assert.throws(()=>service.join(id,profile),code('CONFLICT'));
 assert.throws(()=>service.start(id,clients[1].token),code('FORBIDDEN'));
 const summary=service.start(id,clients[0].token);
 assert.equal(summary.status,'playing');
 assert.ok(!JSON.stringify(summary).includes(clients[0].token));
 assert.throws(()=>service.start(id,clients[0].token),code('CONFLICT'));
});
test('commands enforce actor, revision, replay identity, private views and server-only reveal timing',()=>{
 const {service,id,clients,advance}=setup();service.start(id,clients[0].token);
 let s=service.snapshot(id,clients[0].token),actor=clients[s.actor],other=clients[(s.actor+2)%4];
 const command={commandId:'begin',expectedRevision:s.revision,action:{type:'BEGIN_DRAW'}};
 assert.throws(()=>service.command(id,other.token,command),code('FORBIDDEN'));
 const result=service.command(id,actor.token,command);
 assert.deepEqual(service.command(id,actor.token,command),result);
 assert.throws(()=>service.command(id,actor.token,{...command,action:{type:'DRAW'}}),code('CONFLICT'));
 assert.throws(()=>service.command(id,actor.token,{...command,commandId:'stale'}),code('CONFLICT'));
 service.command(id,actor.token,{commandId:'draw',expectedRevision:result.revision,action:{type:'DRAW',index:0}});
 const own=service.snapshot(id,actor.token),hidden=service.snapshot(id,other.token);
 assert.ok(own.draw.card.id);assert.equal(hidden.draw,null);assert.equal(hidden.seed,undefined);
 for(const p of hidden.players)if(p.id!==other.seat)for(const c of p.hand){assert.equal(c.id,undefined);assert.equal(c.rank,undefined);}
 assert.throws(()=>service.command(id,actor.token,{commandId:'skip',expectedRevision:own.revision,action:{type:'END_REVEAL'}}),code('INVALID_INPUT'));
 advance(2999);assert.equal(service.snapshot(id,actor.token).phase,'reveal');
 advance(1);assert.notEqual(service.snapshot(id,actor.token).phase,'reveal');
});
test('server deadlines complete an unattended match and reorder cannot impersonate another seat',()=>{
 const {service,id,clients,advance}=setup();service.start(id,clients[0].token);
 let s=service.snapshot(id,clients[0].token);
 const before=structuredClone(s.players[1].hand);
 const ids=s.players[0].hand.map(c=>c.id).reverse();
 service.command(id,clients[0].token,{commandId:'sort',expectedRevision:s.revision,action:{type:'REORDER',seat:1,ids}});
 s=service.snapshot(id,clients[0].token);assert.deepEqual(s.players[1].hand,before);assert.deepEqual(s.players[0].hand.map(c=>c.id),ids);assert.equal(s.phaseDeadline,21000);
 let steps=0;
 while(s.phase!=='ended'&&steps++<5000){advance(20000);s=service.snapshot(id,clients[0].token);}
 assert.equal(s.phase,'ended');assert.equal(new Set(s.order).size,4);assert.equal(s.phaseDeadline,null);
 assert.equal(service.info(id,clients[0].token).status,'finished');
});
test('invalid profiles, incomplete rooms and capacity are rejected',()=>{
 const service=createMatchService({maxMatches:1});
 assert.throws(()=>service.create({...profile,characterId:'unknown'}),code('INVALID_INPUT'));
 const host=service.create(profile);
 assert.throws(()=>service.start(host.match.id,host.token),code('CONFLICT'));
 assert.throws(()=>service.create(profile),code('CAPACITY'));
});

test('background ticks finish unattended games without player requests',()=>{
 const {service,id,clients,advance}=setup();service.start(id,clients[0].token);
 let steps=0;
 while(service.info(id,clients[0].token).status!=='finished'&&steps++<5000){advance(20000);assert.equal(service.tick().advanced,1);}
 assert.equal(service.info(id,clients[0].token).status,'finished');
 const final=service.snapshot(id,clients[0].token);assert.equal(final.order.length,4);assert.equal(final.phaseDeadline,null);
 advance(15*60*1000);assert.equal(service.tick().removed,1);
 assert.throws(()=>service.info(id,clients[0].token),code('NOT_FOUND'));
});
test('expired lobbies free capacity and valid joins refresh lobby timeout',()=>{
 let time=0;const service=createMatchService({now:()=>time,maxMatches:1,lobbyTtlMs:100});
 const host=service.create(profile);time=90;service.join(host.match.id,profile);
 time=100;assert.equal(service.tick().removed,0);
 time=190;assert.equal(service.tick().removed,1);
 assert.throws(()=>service.info(host.match.id,host.token),code('NOT_FOUND'));
 assert.ok(service.create(profile).token);
});
test('a delayed tick advances only one phase and grants the next full deadline',()=>{
 const {service,id,clients,advance}=setup();service.start(id,clients[0].token);
 advance(120000);assert.equal(service.tick().advanced,1);
 const state=service.snapshot(id,clients[0].token);assert.equal(state.phase,'select');assert.equal(state.phaseDeadline,141000);
 assert.equal(service.tick().advanced,0);
});

test('skill animation preserves remaining deadline, locks commands and cannot be skipped',()=>{
 const {service,id,clients,advance}=setup();service.start(id,clients[0].token);
 let s=service.snapshot(id,clients[0].token);advance(7000);
 service.command(id,clients[0].token,{commandId:'skill',expectedRevision:s.revision,action:{type:'USE_SKILL',target:1,cardId:s.players[0].hand.find(c=>c.rank!==0).id}});
 s=service.snapshot(id,clients[0].token);assert.equal(s.phase,'skill');assert.equal(s.phaseDeadline,8000+SKILL_STAGE_MS);
 assert.equal(service.snapshot(id,clients[2].token).skill.card,null);
 assert.throws(()=>service.command(id,clients[0].token,{commandId:'skip',expectedRevision:s.revision,action:{type:'END_SKILL'}}),code('INVALID_INPUT'));
 assert.throws(()=>service.command(id,clients[0].token,{commandId:'draw',expectedRevision:s.revision,action:{type:'BEGIN_DRAW'}}),code('INVALID_ACTION'));
 advance(SKILL_STAGE_MS);service.tick();s=service.snapshot(id,clients[0].token);
 assert.equal(s.phase,'action');assert.equal(s.phaseDeadline,21000+SKILL_STAGE_MS);assert.equal(s.skillUsed[0],true);
});
