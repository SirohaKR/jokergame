// In-memory authoritative match service. HTTP authentication/transport is a separate layer.
import {randomBytes, randomInt, randomUUID} from 'node:crypto';
import {createGame, dispatch, nextActive, viewFor} from '../frontend/src/game.js';

export class MatchError extends Error {
  constructor(code, message) { super(message); this.code=code; }
}
const fail=(code,message)=>{throw new MatchError(code,message);};
const characterIds=['seoha','orca','haru','yuna'];
export function createMatchService({now=Date.now, seed=()=>randomInt(0,0x7fffffff), maxMatches=100, lobbyTtlMs=30*60*1000, finishedTtlMs=15*60*1000}={}) {
  const matches=new Map();
  function member(match,token) {
    const seat=match.members.findIndex(p=>p.token===token);
    if(seat<0)fail('FORBIDDEN','참가 권한이 없습니다.');
    return seat;
  }
  function get(id) {
    const match=matches.get(id);
    if(!match)fail('NOT_FOUND','방을 찾을 수 없습니다.');
    return match;
  }
  function player(input) {
    if(!input||typeof input.nickname!=='string'||!input.nickname.trim()||input.nickname.trim().length>16||!characterIds.includes(input.characterId))fail('INVALID_INPUT','닉네임과 캐릭터를 확인하세요.');
    return {nickname:input.nickname.trim(),characterId:input.characterId,token:randomBytes(32).toString('hex')};
  }
  function deadline(match) {match.deadline=match.game.phase==='ended'?null:now()+(['reveal','skill'].includes(match.game.phase)?3000:20000);}
  function apply(match,action) {
    const previousActor=match.game.actor;
    const remaining=action.type==='USE_SKILL'?Math.max(1,match.deadline-now()):null;
    match.game=dispatch(match.game,action);
    if(action.type==='USE_SKILL')match.skillRemaining=remaining;
    if(action.type!=='REORDER')deadline(match);
    if(action.type==='END_SKILL'&&match.game.phase==='action'&&match.game.actor===previousActor)match.deadline=now()+match.skillRemaining;
    if(match.game.phase==='ended'){match.status='finished';match.finishedAt=now();}
  }
  function expire(match) {
    // Advance one expired phase per tick; do not replay a burst of missed phases after a stall.
    if(match.deadline===null||now()<match.deadline)return;
    const s=match.game;
    const action=s.phase==='skill'?{type:'END_SKILL'}:s.phase==='action'?{type:'BEGIN_DRAW'}:s.phase==='select'?{type:'DRAW',index:s.selected??randomInt(s.players[nextActive(s,s.actor)].hand.length)}:s.phase==='reveal'?{type:'END_REVEAL'}:{type:'DISCARD'};
    apply(match,action);
  }
  function summary(match) {
    return {id:match.id,status:match.status,plannedSets:1,players:match.members.map((p,seat)=>({seat,nickname:p.nickname,characterId:p.characterId,isBot:false}))};
  }
  return {
    tick() {
      let advanced=0,removed=0;
      for(const [id,match] of matches) {
        if((match.status==='lobby'&&now()-match.lastLobbyActivity>=lobbyTtlMs)||
           (match.status==='finished'&&now()-match.finishedAt>=finishedTtlMs)) {
          matches.delete(id);removed++;continue;
        }
        if(match.status==='playing'&&match.deadline!==null&&now()>=match.deadline){expire(match);advanced++;}
      }
      return {advanced,removed};
    },
    create(input) {
      const p=player(input);
      if(matches.size>=maxMatches)fail('CAPACITY','개발 서버의 방 수 제한에 도달했습니다.');
      const match={id:randomUUID(),status:'lobby',members:[p],game:null,deadline:null,lastLobbyActivity:now(),finishedAt:null,commands:new Map()};
      matches.set(match.id,match);
      return {match:summary(match),seat:0,token:p.token};
    },
    join(id,input) {
      const match=get(id),p=player(input);
      if(match.status!=='lobby'||match.members.length>=4)fail('CONFLICT','참가할 수 없는 방입니다.');
      match.members.push(p);match.lastLobbyActivity=now();
      return {match:summary(match),seat:match.members.length-1,token:p.token};
    },
    info(id,token) {const match=get(id);member(match,token);return summary(match);},
    start(id,token) {
      const match=get(id);
      if(member(match,token)!==0)fail('FORBIDDEN','방장만 시작할 수 있습니다.');
      if(match.status!=='lobby'||match.members.length!==4)fail('CONFLICT','대기 중인 네 명이 필요합니다.');
      match.game=createGame(seed(),match.members.map(p=>characterIds.indexOf(p.characterId)));
      match.status=match.game.phase==='ended'?'finished':'playing';
      if(match.status==='finished')match.finishedAt=now();
      deadline(match);
      return summary(match);
    },
    snapshot(id,token) {
      const match=get(id),seat=member(match,token);
      if(!match.game)fail('CONFLICT','아직 시작하지 않았습니다.');
      expire(match);
      return {...viewFor(match.game,seat),seat,phaseDeadline:match.deadline};
    },
    command(id,token,{commandId,expectedRevision,action}={}) {
      const match=get(id),seat=member(match,token);
      if(typeof commandId!=='string'||!commandId||commandId.length>128||!Number.isInteger(expectedRevision)||!action||!['BEGIN_DRAW','SELECT','DRAW','DISCARD','REORDER','USE_SKILL'].includes(action.type))fail('INVALID_INPUT','유효하지 않은 명령입니다.');
      const key=JSON.stringify([seat,commandId]),body=JSON.stringify({expectedRevision,action});
      const previous=match.commands.get(key);
      if(previous) {
        if(previous.body!==body)fail('CONFLICT','같은 명령 ID의 본문이 다릅니다.');
        return structuredClone(previous.result);
      }
      if(!match.game)fail('CONFLICT','아직 시작하지 않았습니다.');
      expire(match);
      if(expectedRevision!==match.game.revision)fail('CONFLICT','최신 상태를 다시 받아주세요.');
      if(action.type!=='REORDER'&&seat!==match.game.actor)fail('FORBIDDEN','자신의 차례가 아닙니다.');
      if(match.commands.size>=10000)fail('CAPACITY','개발 서버의 명령 수 제한에 도달했습니다.');
      try {apply(match,action.type==='REORDER'?{...action,seat}:action);}
      catch(error) {if(error instanceof MatchError)throw error;fail('INVALID_ACTION',error.message);}
      const result={revision:match.game.revision};
      match.commands.set(key,{body,result});
      return structuredClone(result);
    }
  };
}
