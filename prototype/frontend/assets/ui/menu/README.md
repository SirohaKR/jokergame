# 로비 메뉴 일러스트

모든 메뉴 그림은 **독립된 RGBA PNG**이며 배경은 실제 알파 투명이다.
합쳐진 스프라이트 시트나 배경이 그려진 미리보기가 아니다.
텍스트와 버튼 프레임은 그림에 포함하지 않고 게임에서 별도로 배치한다.

| 파일 | 사용 위치 |
| --- | --- |
| mode-regular.png | 정규전 |
| mode-short.png | 단기전 |
| mode-friend.png | 친구대전 |
| mode-ai.png | AI대전 |
| menu-characters.png | 캐릭터 |
| menu-shop.png | 상점 |
| menu-friends.png | 친구 |
| menu-record.png | 전적 |
| menu-help.png | 게임 방법 |

이 프로젝트를 위해 이미지 생성 도구로 제작했다. 파일별 원본 경로와
해상도, 투명도 검증 정보는 `manifest.json`에 기록한다.
`menu-characters.png`는 캐릭터 컬렉션을 나타내는 고정 메뉴 그림이며
선택한 파트너의 실제 초상화가 아니다.

## Unity 이관

- Texture Type: Sprite (2D and UI)
- Sprite Mode: Single
- Alpha Source: Input Texture Alpha / Alpha Is Transparency: On
- Pivot: Center (0.5, 0.5), Preserve Aspect: On
- 기본 원본 크기를 보존하고, 플랫폼별 Max Size/압축은 Unity에서 설정한다.
- 각 버튼의 Image에 해당 PNG를 지정하고, 메뉴 이름은 별도 텍스트로 둔다.

이 폴더는 메뉴 그림만 포함한다. 장면 배경은 `assets/backgrounds/`,
캐릭터 일러스트는 `assets/lobby/`에 독립 파일로 유지한다.
