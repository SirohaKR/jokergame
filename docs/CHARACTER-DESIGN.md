# 캐릭터 스킬·PixAI 제작 가이드

작성 기준: 2026-11-04.

캐릭터 이름·성격·외형·관계의 기준은 [캐릭터 설정집](CHARACTERS.md), 장소·마법·문화의 기준은 [세계관 문서](WORLD.md)다. 이 문서는 스킬 판정과 이미지 제작 지침을 관리한다. 2026-11-05: 신규 스탠딩과 16종 이모티콘은 게임에 연결했다. 스킬 4종은 AI 대전과 개발 서버에 구현했다.

## 원안 근거와 스킬 공통 규칙

원본 `docs/reference/original-plan.pdf` 4~5쪽의 ‘캐릭터 스킬 시스템’을 기준으로 재설계했다. 원안은 공격·정보·교란·판 뒤엎기·방어·블러핑을 예시로 제시한다. 카드 전달로 조커를 강제로 넘기는 것은 금지하며, 전체 재분배는 최다 손패 플레이어의 구제 수단이다. 위 네 캐릭터에 배정한 구체적 효과와 세부 판정은 신규 제안이며 원안 확정 내용과 구분한다.

- 판당 1회. 현재 단일 세트 기준이며 여러 세트 모드의 초기화 단위는 별도로 확정한다.
- 자기 차례의 ‘훔치기’ 진입 전만 사용 가능. 훔치기 진입 후나 페어 정리 단계에서 사용 불가.
- 효과 연출은 게임판에 공개한다. 연출 중 타이머 정지, 훔치기/추가 스킬/손패 조작 잠금. 완료 후 남은 행동 시간을 재개한다.
- 일반 뽑기의 비공개 규칙은 그대로 유지하되, 정보 스킬은 명시된 범위 안에서 예외적으로 정보를 제공한다. 공개 효과에 숨겨진 카드 정체나 조커 이동 여부를 덧붙이지 않는다.
- 유효하지 않은 대상/조건에서는 횟수를 소비하지 않는다. 유효하게 발동했지만 방어에 막힌 경우에는 소비한다.
- 서버가 권한·발동 단계·마감시간·조건·잔여 횟수·revision·commandId를 검증한다. 같은 명령 재전송으로 효과가 중복되지 않아야 한다.
- 스킬로 발생한 카드 이동/페어 제거/종료는 하나의 처리로 확정한다. 카드는 전체 53장, 조커는 1장 유지. 종료자의 순위와 버린 카드를 되돌리지 않는다.
- ‘자, 판 다시 짜자!’의 공동 최다 허용, 재분배 후 자동 페어 제거/동시 종료 순서, ‘이건 네 거♡’ 수신자의 자동 페어 제거, 반사 세부 판정과 보호 지속 시간은 플레이테스트 대상인 제안이다.
- 스킬 4종을 규칙 엔진·AI·선택 UI·개발 서버에 구현했다. 연출은 3초이며 스탠딩과 효과 결과를 표시한다. 위에 제안한 세부 판정을 현재 플레이테스트 규칙으로 사용한다. 기존 편의형 스킬 초안은 폐기한다.
- 전체 재분배는 시전자부터 시계 방향으로 분배하고 같은 순서로 자동 페어 제거와 동시 종료 순위를 판정한다. 이미 종료한 플레이어는 제외한다.

## PixAI 프롬프트

그림체 기준: [캐릭터 감성과 셀 채색 방향](ART-DIRECTION.md). 최신 사용자 Positive는 부드러운 애니메이션 음영·그라데이션과 셀 채색 태그를 함께 포함한다. 이전의 강한 셀 채색 전용 지침보다 아래 원문을 우선한다. 아래 프롬프트는 생성용 초안이며 PixAI에서 결과를 직접 검증하지는 않았다.

공통 Positive 뒤에 캐릭터별 Positive를 이어 붙인다. 기존 작품/작가 이름 없이 원본 캐릭터로 생성한다. 기본 스탠딩은 정면·양눈을 뜬 모습이며, 윙크/큰 동작은 별도 표정 컷에서 만든다. 인간형을 유지하기 위해 여우상도 fox girl 태그를 쓰지 않는다.

### 공통 Positive

사용자 제공 최신 원문이다. 부드러운 음영과 단단한 그림자, 파스텔 팔레트와 개별 의상 팔레트가 함께 있어 모델에 따라 혼합 결과가 달라질 수 있다. 문구를 임의로 삭제하지 않았으며 생성 결과는 아직 검증하지 않았다.

```text
soft anime shading, gentle gradients, smooth clean lineart, soft pink cheek blush, smooth grouped hair, rounded facial contours, large translucent eyes, pale pink skin, soft blue-purple-pink palette, gentle natural shadows, solo, 1girl, teenage girl, youthful face, soft cheeks, small softly rounded chin, human, original character, anime visual novel character sprite, appealing anime face, expressive detailed eyes, clean crisp lineart, 2D anime cel shading, flat base colors, hard-edged shadow shapes, two-tone shading, limited secondary shadows, simple graphic highlights, defined hair clumps, flat smooth skin colors, fantasy world, readable fantasy costume, restrained decorative details, magical adventurer, full body, front view, standing upright, both eyes open, looking at viewer, arms slightly away from torso, empty hands, visible fingers, feet visible, centered composition, generous margins, even neutral lighting, crisp color separation, plain white background, vertical composition, (symmetrical eyes:1.2), (matching eyes:1.1), well-proportioned facial features, small nose, small neat mouth, clean facial lineart, well-drawn hands, anatomically correct hands, five fingers on each hand, distinct separated fingers, natural finger proportions, slender fingers, natural thumb position, relaxed open hands, hands at sides, neat fingernails, clean hand lineart
```

### 세레나 — 능글맞은 여우상

의상 상세: [진주빛 밤의 장난꾼](SERENA-OUTFIT.md). 사용자가 제공한 최신 Positive 원문을 그대로 적용한다. 앞선 검은 머리·금색 장식·케이프·뒷리본 설정을 교체한다.

```text
18-year-old girl, teenage girl, youthful face, human ears, long straight silver hair with soft lilac gradient at the ends, blunt bangs, thin braid along the left side of the head, small silver crescent moon hairpin on the left side, golden yellow eyes, gentle closed-mouth smile, sheer ivory blouse with small frilled high collar, small silver rose brooch at the collar, thin black ribbon bow with long ribbon tails at the neck, small buttons down the front, sheer ivory bishop sleeves, buttoned ivory cuffs at wrists, black sweetheart corset bodice with pointed front waist, black A-line skirt with silver piped hem, sheer smoky grey organza overskirt, high-low hem longer at the back, opaque black tights, black pointed-toe pumps with thin ankle straps, lavender nails, black ivory and silver color scheme, elegant moonlit salon illusionist
```

### 엘리시아 — 소심한 공상가

의상 상세: [별을 접은 소녀](ELYSIA-OUTFIT.md). 아래는 개편된 기본 의상 프롬프트다.

```text
17-year-old girl, dusty lavender hair, loose low twin tails below shoulders, long bangs above eyes, two small star hairpins on right side, large rounded violet eyes, delicate small nose and mouth, timid shy expression, slight blush, small hesitant smile, ivory rounded collar, lilac knee-length bell-shaped dress, long sleeves with small gathered cuffs, short ink-colored double-layer cape opening like a book at front, small ribbon with a single star gemstone below collar, two narrow bookmark ribbons at side waist, single ivory underskirt edge, small crescent-shaped book satchel, opaque cream tights, lilac strap shoes, gentle rounded silhouette, lilac ivory and ink palette, human ears
```

### 루네아 — 느긋한 반전 승부사

의상 상세: [달구름의 낮잠](LUNEA-OUTFIT.md). 아래는 개편된 기본 의상 프롬프트다.

```text
19-year-old girl, human ears, long fluffy wavy milk tea beige hair, slightly messy hair, loose low side braid, single ahoge, wispy bangs, dusty blue sleep mask pushed up on head like a headband, small silver crescent moon embroidery on the sleep mask, droopy half-lidded blue gray eyes, tareme, soft youthful facial features, sleepy relaxed gentle smile, oversized dusty blue knit cardigan worn loosely, sleeves past wrists, fingertips visible, milky ivory loose knee-length dress with soft gathered waist, low rounded collar, small pale blue ribbon at the collar, oversized cozy silhouette, slouchy pearl white socks, ivory round-toe mary jane shoes, milk tea beige ivory and dusty blue palette, minimal accessories, refined fashion design, laid-back dreamy moonlit salon resident
```

### 로제트 — 인싸 분위기 메이커

의상 상세: [봄바람 앙코르](ROSETTE-OUTFIT.md). 아래는 개편된 기본 의상 프롬프트다.

```text
18-year-old girl, human ears, coral pink hair in a high bouncy ponytail, oversized ivory scrunchie, side-swept bangs, short sidelocks, a few lively loose strands, large bright aqua eyes, rounded lively cheeks, bright cheerful open smile, small canine tooth, cropped aqua jacket with sleeves rolled up to the elbows, coral fitted bodice dress, neat ivory collar, small heart-shaped gemstone at the collar, ivory high waistband, flared coral pleated skirt above the knees, aqua skirt lining, ivory knee-high socks, chunky white ankle boots with aqua laces, lively flared silhouette, coral ivory and aqua palette, minimal accessories, refined fashion design, cheerful mood-maker of the moonlit salon
```

### 세레나 전용 Negative — 사용자 제공 원문

공통 Negative와 섞지 않고 이 블록을 사용한다. `twin tails`, `cape`, `large bow` 등은 다른 캐릭터의 지정 디자인과 충돌하므로 다른 캐릭터에게 일괄 적용하지 않는다.

```text
worst quality, low quality, normal quality, lowres, blurry, jpeg artifacts, noise, watermark, signature, text, logo, username, cropped, out of frame, cut off feet, cut off head, bad anatomy, bad proportions, deformed, disfigured, mutated, extra limbs, extra arms, extra legs, missing limbs, long neck, long torso, distorted body, (asymmetrical eyes:1.3), (mismatched eyes:1.2), (bad eyes:1.2), uneven eyes, different eye sizes, misaligned eyes, cross-eyed, deformed pupils, extra pupils, uneven pupils, heterochromia, messy eye highlights, distorted face, ugly face, bad hands, malformed hands, extra fingers, missing fingers, fused fingers, too many fingers, twisted fingers, extra hands, bad feet, deformed feet, extra toes, multiple characters, duplicate, clone, different outfit, inconsistent design, changed hair color, short hair, twin tails, hat, cape, cloak, large bow, back bow, gold accessories, extra accessories, cluttered outfit, frills overload, weapon, holding object, nsfw, revealing clothes, cleavage, background scenery, complex background, shadow on background, 3d, realistic, photo
```

### 공통 Negative — 범용

```text
worst quality, low quality, normal quality, lowres, blurry, jpeg artifacts, noise, watermark, signature, text, logo, username, cropped, out of frame, cut off feet, cut off head, bad anatomy, bad proportions, deformed, disfigured, mutated, extra limbs, extra arms, extra legs, missing limbs, long neck, long torso, distorted body, (asymmetrical eyes:1.3), (mismatched eyes:1.2), (bad eyes:1.2), uneven eyes, different eye sizes, misaligned eyes, cross-eyed, deformed pupils, extra pupils, uneven pupils, messy eye highlights, distorted face, ugly face, bad hands, malformed hands, extra fingers, missing fingers, fused fingers, too many fingers, twisted fingers, extra hands, bad feet, deformed feet, extra toes, multiple characters, duplicate, clone, inconsistent design, extra accessories, cluttered outfit, weapon, holding object, nsfw, revealing clothes, cleavage, background scenery, complex background, shadow on background, 3d, realistic, photo
```

캐릭터마다 표정 강조를 추가할 때 기본 표정 태그를 교체한다. 세레나의 당황에는 `flustered, averted gaze, blush`, 엘리시아의 스킬에는 `determined expression, dramatic confident smile`, 루네아의 당황에는 `wide open eyes, surprised`, 로제트의 패배에는 `puffed cheeks, frustrated expression`을 사용한다. 동일인 유지에는 같은 모델/참조 이미지를 활용하며 텍스트와 시드만으로 일관성이 보장되지는 않는다.

### 생성 순서와 납품 기준

1. 세로 2:3 전후, 가능하면 1024×1536 이상으로 캐릭터마다 중립 전신 한 장을 먼저 생성한다. 특정 모델이 지원하는 해상도를 따른다.
2. 마음에 드는 한 장을 기준 이미지로 고정하고 같은 모델·LoRA·시드·설정값을 기록한다. 시드만 같다고 동일 인물이 보장되지는 않는다. 참조 이미지/이미지 투 이미지로 의상과 얼굴을 유지한다.
3. 같은 구도에서 표정만 바꿔 각각 생성한다: `gentle happy smile`, `flustered expression, subtle blush`, `friendly greeting smile`, `skeptical expression, one eyebrow slightly raised`. 자세를 바꾸지 않아야 표정 교체 시 흔들림이 적다.
4. 배경 제거 후 투명 PNG로 내보낸다. ‘transparent background’라는 프롬프트만으로 실제 알파 채널이 생기지는 않는다. 머리카락 가장자리, 손가락, 눈동자, 좌우 장식 위치를 확인한다.
5. 현재 게임은 캐릭터별 개별 스탠딩 PNG와 2×2 이모티콘 아틀라스를 사용한다. 생성된 표정 네 장을 곧바로 기존 아틀라스 자리에 넣지 말고 칸 크기·얼굴 크롭·좌표를 맞춘다. 파일명은 캐릭터 채택 후 결정한다.

### Live2D로 이어갈 때

정면·중립·팔을 몸에서 조금 떨어뜨린 기준 이미지를 선택한다. 머리카락이 눈을 과하게 가리거나 팔/소품이 몸통을 가리는 이미지는 피한다. 얼굴·좌우 눈 흰자/눈동자/눈꺼풀·눈썹·입·앞/옆/뒷머리·목·몸통·팔을 레이어로 분리하고 가려진 영역을 복원한 PSD를 제작해야 한다. 그림 한 장의 배경을 제거하는 것만으로 리깅 가능한 모델이 되지 않는다.

리깅 후 웹 연동에 필요한 것은 model3.json, moc3, 텍스처와 선택적 physics3.json / motion3.json / exp3.json이다. 모델 제작자가 허용한 범위와 Cubism SDK 배포 조건에 맞춰 제공한다. 웹에는 모델 로딩 실패/모션 감소 설정을 위한 정적 PNG 대체 표시를 남긴다.
