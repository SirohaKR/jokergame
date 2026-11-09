# 온라인 서버 기반 개발 현황

2026-11-04: `backend/matches.mjs`에 메모리 기반 4인 방, 참가자 토큰, 방장 시작, 좌석별 비공개 상태, 리비전 검사, 명령 재전송 방지, 20초 행동/3초 결과 시간을 추가했다. `backend/dev-api.mjs`는 `/api/dev/matches` 개발용 HTTP 경로를 제공한다. 기존 AI 화면은 그대로다.

prototype에서 `npm test`: 27개 테스트 통과. 기존 1,000시드 규칙 검증 및 새 HTTP 4인 참가/권한 검증 포함.

개발 API: POST /api/dev/matches 및 /:id/join 본문은 {nickname,characterId}. characterId는 seoha/orca/haru/yuna. 반환된 token은 참가자별 비밀이며 공유하지 않는다. GET /:id, POST /:id/start, GET /:id/snapshot, POST /:id/commands는 Authorization: Bearer <token>을 요구한다. POST는 application/json 본문 필수. 명령 본문은 {commandId,expectedRevision,action}. 지원 행동은 BEGIN_DRAW, SELECT(index), DRAW(index), DISCARD(cardId), REORDER(ids), USE_SKILL(전달: target/cardId, 열람: target, 반사·재분배: 추가 인자 없음). 결과 및 스킬 연출 종료는 클라이언트 명령으로 허용하지 않는다.

2026-11-05: 서버가 250ms 간격으로 만료된 턴을 처리한다. 요청이 없어도 게임은 진행되며, 지연 후에는 한 번에 한 단계만 넘기고 다음 단계의 시간을 온전히 부여한다. 마지막 참가 후 30분이 지난 대기방과 종료 후 15분이 지난 방은 정리한다. 타이머는 HTTP 서버 시작/종료와 함께 시작/정지한다.

현재 단계의 한계: 실시간 푸시 전송은 없고 참가자가 스냅샷을 조회해야 한다. 다음 단계는 인증 세션, 프론트 연결, 푸시 전송, DB, 탈퇴/방 정리, 요청 제한과 운영 보안이다. 재시작하면 모든 방과 토큰이 사라진다. 운영용 /api/v1 계약은 여전히 미구현이며 이 개발용 경로와 다르다. 공개 운영 배포용이 아니다. 사용자 화면에서 온라인 플레이는 아직 제공하지 않는다.

스킬은 세트당 1회이며 서버가 조건·대상·반사를 판정한다. 연출 3초 동안 모든 게임 명령을 잠그고 종료 후 기존 행동의 남은 시간을 재개한다. 열람 정보는 수신자 스냅샷에만 포함한다.
