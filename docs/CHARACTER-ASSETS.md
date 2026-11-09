# 캐릭터 투명 PNG

현재 게임 스탠딩은 사용자가 ZIP으로 제공한 원본 4장의 **배경 알파 채널만 변경한 이미지**다. 이전 이미지 생성 기반 편집본은 교체했다.

| 캐릭터 | 게임 파일 | 원본 파일 |
| --- | --- | --- |
| 로제트 | `prototype/frontend/assets/characters/rosette.png` | `pixai-fill-modified_1793807638703.png` |
| 엘리시아 | `prototype/frontend/assets/characters/elysia.png` | `pixai-fill-modified_1793807637018.png` |
| 세레나 | `prototype/frontend/assets/characters/serena.png` | `pixai-fill-modified_1793807635045.png` |
| 루네아 | `prototype/frontend/assets/characters/lunea.png` | `pixai-fill-modified_1793807465034.png` |

- 모두 원본과 같은 768×1280 RGBA PNG다. 리사이즈·크롭·재생성·색 보정은 하지 않았다.
- 전체 RGB 배열을 원본과 비교해 **변경 픽셀 0개**를 확인했다. 배경으로 분류하지 않은 픽셀은 RGBA 모두 동일하다.
- 외곽과 연결된 흰 배경 및 눈으로 확인한 머리카락·손가락·다리 사이 배경을 투명화했다. 흰 의상과 눈·머리 하이라이트는 보존했다.
- 원본의 경계색도 유지했으므로 어두운 배경에서는 기존 흰 안티앨리어싱이 가느다랗게 보일 수 있다. 색 제거·재채색은 하지 않았다.
- `new-characters.json`에 원본/결과 SHA-256과 픽셀 검증 수치를 기록했다.
- `output/character-assets/original-characters.zip`: 캐릭터명으로 정리한 수정 전 원본.
- `output/character-assets/transparent-characters.zip`: 게임에 적용한 투명 PNG 4장과 manifest.

피부톤·얼굴·눈·머리·의상·체형·포즈를 임의로 수정하지 않는다. 이모티콘과 게임 코드는 이번 교체에서 변경하지 않았다.

## 스킬 컷인

2026-11-06: 스킬 발동 3초 연출의 처음 약 1.2초에 캐릭터 컷인이 기울어진 띠로 들어왔다가 플래시와 함께 사라지고, 기존 카드 이펙트가 이어진다. 일시정지 시 다른 스킬 이펙트와 같이 멈춘다. 카드 정보는 컷인에 표시하지 않는다.

| 캐릭터 | 게임 파일 | 원본 (드라이브 `조커게임/1차작업/스킬`) |
| --- | --- | --- |
| 세레나 | `prototype/frontend/assets/skills/serena.webp` | `serena-skill.png` 1888×1056 |
| 엘리시아 | `prototype/frontend/assets/skills/elysia.webp` | `elysia-skill.png` 1888×1056 |
| 루네아 | `prototype/frontend/assets/skills/lunea.webp` | `lunea-skill.png` 1280×720 |
| 로제트 | `prototype/frontend/assets/skills/rosette.webp` | 2026-11-06 사용자 업로드 1280×720 |

- 1280px 너비 WebP(품질 86)로 줄여 저장했다. 다른 보정은 하지 않았다.
- 컷인이 없는 캐릭터는 스탠딩으로 대체된다. 새 컷인은 `assets/skills/<id>.webp`로 넣고 `data.js`의 `SKILL_CUTINS`에 한 줄 추가한다.

## 로비 파트너 일러스트 (2026-11-09)

PixAI로 만든 로비용 허벅지 위 일러스트 4장(세레나·로제트·엘리시아·루네아). 프롬프트는 프로젝트의 PixAI 프롬프트 시트 10번.

- `prototype/frontend/assets/lobby/original/<이름>.png`: 받은 원본(흰 배경, 1104×1824).
- `prototype/frontend/assets/lobby/<이름>.png`: 배경 투명화본. 위·왼쪽·오른쪽 가장자리와 이어진 거의 흰색 영역(min RGB ≥ 236)을 지우고, 팔·머리카락 사이에 갇힌 흰 배경(400px 이상·평균 ≥ 247, 또는 바깥 배경 8px 안의 작은 틈·평균 ≥ 249)도 지웠다. 흰 하이라이트로 오인되는 세레나 앞머리, 루네아 원피스·안대 영역은 눈으로 확인해 보호했다. 아래 가장자리는 허벅지에서 잘린 그림이라 시작점에서 뺐다.
- 바깥 경계 4px은 흰색과의 거리로 알파를 정하고 섞인 흰색을 걷어냈다(색 복원). 그래서 가는 머리카락 끝에 흰 테두리가 남지 않는다.
- 게임의 모든 캐릭터 그림(로비·대기실·캐릭터 화면·게임 초상·뽑기 반응·스킬 화면·대사 스튜디오)이 `imagePath()`로 이 그림을 쓴다. 원형 초상 위치는 `data.js`의 `portrait`로 맞췄다. 로비에서는 허벅지 아래 잘린 선이 보이지 않게 아래쪽을 페이드한다. 이전 전신 스탠딩(`assets/characters/`)은 UI 편집기의 "이전 스탠딩" 에셋으로만 남겼다.
