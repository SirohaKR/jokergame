# 한 장의 비밀 · 도둑잡기

캐릭터 4명이 함께하는 도둑잡기 웹 프로토타입입니다. 현재 버전은 **나 1명 + AI 3명, 단일 세트**로 실행됩니다. 온라인 멀티플레이와 DB 연결은 아직 구현하지 않았습니다.

## 다른 PC에서 시작하기

Git과 Node.js 22 이상을 설치한 뒤 실행합니다. Windows, macOS, Linux에서 같은 명령을 사용할 수 있습니다.

```sh
git clone https://github.com/SirohaKR/jokergame.git
cd jokergame/prototype
npm start
```

브라우저에서 <http://127.0.0.1:4173/>에 접속합니다. 현재 외부 npm 의존성이 없어 `npm install`은 필요하지 않습니다. Windows에서는 `prototype/START.cmd`를 실행해도 됩니다. 서버 종료는 `Ctrl+C`입니다.

```sh
# prototype 디렉터리에서 게임 규칙 및 서버 테스트
npm test
```

기획서는 <http://127.0.0.1:4173/docs/>, Swagger UI는 <http://127.0.0.1:4173/docs/api.html>입니다. Swagger UI 라이브러리는 인터넷에서 불러옵니다. 현재 실제 API는 `/api/health`뿐이며 나머지 온라인 API는 설계 계약입니다.

## 개발을 이어가기 전에

**[개발 인수인계](docs/DEVELOPMENT.md)**를 먼저 읽으세요. 확정된 게임 규칙, 화면/정보 공개 범위, 수정 이력, 다음 개발 항목을 기록했습니다. Codex 등 다른 도구에서 이 저장소를 열고 이 문서를 읽도록 요청하면 대화 기록 없이도 이어갈 수 있습니다.

```sh
# 다른 PC에서 작업 전 최신 변경 받기
git pull --ff-only
# 작업 후 변경 기록과 업로드
git add .
git commit -m "변경 내용"
git push
```

## 캐릭터·세계관 기획

- [캐릭터 감성·셀 채색 방향](docs/ART-DIRECTION.md): 참고 작품별 검토 방향과 선화·명암 기준

- [캐릭터 설정집](docs/CHARACTERS.md): 네 여성 캐릭터의 성격·외형·과거·대사·관계와 스킬 콘셉트
- [세계관](docs/WORLD.md): 마도도시 루미에르, 주점 ‘별의 끝’, 마법과 카드놀이 문화
- [스킬·PixAI 제작 가이드](docs/CHARACTER-DESIGN.md): 스킬 판정 초안, 이미지 생성 프롬프트, Live2D 준비 조건

세레나·엘리시아·루네아·로제트의 스탠딩과 16종 이모티콘을 게임에 적용했습니다. 설정 문서의 스킬과 호감도 이야기는 후속 개발 범위입니다.

## 구성

- `prototype/frontend/`: HTML/CSS/JavaScript, 캐릭터 스탠딩 및 이모티콘 자산
- `prototype/backend/`: Node HTTP 서버
- `prototype/tests/`: Node 내장 테스트 러너용 테스트
- `prototype/docs/`: 상세 기획서, PostgreSQL DDL, OpenAPI 계약
- `prototype/deploy/`: Synology Container Manager용 Docker 초안
- `docs/reference/`: 사용자가 제공한 원안 PDF
- `output/wireframes/`: FigCraft용 SVG, 화면 목록 및 미리보기

## 현재 기능

53장 덱, 페어 버리기, 20초 행동 제한, AI 대전, 결과 순위/점수, 당사자 전용 뽑기 연출, 캐릭터별 이모티콘 16종, 모바일 세로 테이블과 터치 손패 정렬을 구현했습니다.

닉네임/선택 캐릭터/설정은 기기별 브라우저에 저장됩니다. 진행 중인 게임과 설정이 다른 PC로 자동 이전되지는 않습니다. 기존 임시 공개 링크는 원래 PC의 서버와 터널에 연결되어 있어 저장소를 복제한다고 유지되지 않습니다.

NAS 실제 배포, DB 적용, 로그인, 온라인 멀티플레이, 여러 세트 합산, 랭크/재화/스킬은 후속 개발 범위입니다. 캐릭터명은 임시 이름이며 이미지 권리나 재배포 라이선스를 이 저장소에서 새로 부여하지 않습니다.
