# 모바일 도그푸드 — 피드백 라운드 5 (다음 세션에서 구현)

> **상태:** 기록만 됨, 구현 X. 사용자가 폰에서 라운드 4까지 머지/도그푸드 후 남긴 4건.
> 다음 세션에서 이 문서를 단일 출처로 진행한다. 브랜치: `feat/mobile-support`
> (라운드 4b 2커밋이 최신 `main` 위에 리베이스된 채 PR 대기 중 — 아래 §0 참조).

> **검증 관례 (ADR-0002 D12):** 순수 함수는 vitest, R3F/DOM 배선은 사람 도그푸드.
> "pure core + thin adapter" 패턴 따를 것 (cf. `lib/warp/session.ts`, `app/scene/label-cull.ts`).
> 코어 페인티드: 데스크탑(파인 포인터)은 절대 바꾸지 말 것 — 전부 `useCoarsePointer()` 게이트.

---

## 0. 먼저 읽을 것 — 라운드 4b와의 충돌 (중요)

라운드 4(b)에서 터치 회전을 **고정 크기**(`Math.sign(pointer.x) * MOUSE_INFLUENCE`, lerp 제거)로
바꿔 푸시했다(`app/scene/System.tsx`의 `coarse` 분기). **라운드 5 item 4가 이것을 뒤집는다** —
사용자는 사실 *비례(아날로그) 제어*를 원한다(가운데서 멀수록 빠름). 라운드 4의 "저항감/같은 빠르기"
불만은 **상수 속도를 원한 게 아니라**, 같은 거리에서 왼쪽이 오른쪽보다 느린 **비대칭**(우향 idle 바이어스 +
lerp 지연) 때문이었다. 그러니 다음 세션에서:

- 터치 회전을 **대칭 비례 제어**로 되돌린다(`target ≈ pointer.x * SCALE`).
- idle 드리프트(공전)는 유지하되, **한쪽을 더 빠르게 만들지 않도록**(= "약간 차이") 구조화한다.
- → item 3 + item 4를 **함께** 다룬다(둘 다 같은 회전 모델 + idle + 리셋 문제).

라운드 4b 커밋(고정 크기 회전 + 하트 safe-area)은 *틀린* 건 아니다. 하트 정렬은 부분적 개선이고
(item 1이 더 다듬음), 회전은 item 4가 대체한다. 사용자가 라운드 4b PR을 먼저 머지해도 무방하다.

---

## 1. nav와 하트 버튼 최상단 높이 안 맞음 (하트가 더 높다)

> 원문: "아직도 최상단 안 맞아. 하트가 더 높아."

라운드 4b에서 `HeartButton`(fixed/non-inline)에 `top: calc(16px + env(safe-area-inset-top))`를
줘서 nav와 맞추려 했으나 **여전히 하트가 더 위에 있다**(`/discover`·`/s` 우상단).

**유력 원인 (사용자 기기 inset이 0일 가능성 큼 → safe-area가 범인이 아님):**
- 두 알약(pill)의 **높이가 다르고** 상단 정렬돼서, 더 짧은 하트의 시각적 덩어리가 위로 떠 보인다.
  - Nav 바깥 높이 ≈ border4 + padding(4·2) + 링크 padding(6·2) + 텍스트 ~14 ≈ **38px**
  - 하트(compact) ≈ border4 + padding(7·2) + 이모지 ~17 ≈ **35px** → 하트가 ~3px 짧음, 상단정렬이면 아래가 떠서 "위에 있다"로 보임.
- 또는 nav와 하트의 실제 렌더 top이 다름(devtools로 측정 필수, 가정 금지).

**다음 세션 접근:** 브라우저 devtools로 nav vs 하트의 실제 top·height를 **측정**한 뒤,
(a) compact 하트의 바깥 높이를 nav 바와 동일하게 맞추거나, (b) top 오프셋이 실제로 다르면 그걸 교정.
高이 맞추는 게 가장 견고함(상단 정렬 시 두 알약이 같은 높이여야 윗줄이 일치).

- 파일: `app/_components/HeartButton.tsx`(compact 사이즈), 참조 `app/_components/Nav.tsx`(높이).
- 수용 기준: 사용자 폰 `/discover`에서 좌상단 nav와 우상단 하트의 **윗변이 육안상 일직선**(단차 0).

---

## 2. focus 창(FocusPanel) 드래그 이동 + 재focus 시 초기 위치 리셋

> 원문: "focus했을 때 뜨는 창을 드래그해서 옮길 수 있게 해줘. 나갔다가 다시 focus할 때는 항상 초기 위치로 띄우고."

대상 = `app/scene/FocusPanel.tsx`의 fixed 패널(`<div>`, 현재 line 277 부근):
`position: fixed; left: 50%; bottom: calc(...); transform: translateX(-50%) translateY(-kbInset)`.

**원하는 동작:**
- 패널을 **드래그해서 화면 어디로든** 이동(터치 + 마우스).
- focus를 나갔다가(빈 곳 탭/Esc/× → `focusedId=null`) 다시 focus하면 **항상 기본 위치**(하단 중앙)로 뜬다 = 드래그 오프셋 리셋.

**구현 (pure core + thin adapter):**
- 순수: 포인터 델타 + 뷰포트 경계로 **화면 안에 가두는** 오프셋 계산.
  예) `app/scene/panel-drag.ts` — `clampPanelOffset(offset, panelRect, viewport)` 또는
  `nextDragOffset(start, current, bounds)` + `.test.ts`(vitest).
- 어댑터(FocusPanel.tsx): 드래그 핸들(이름 라벨/패널 배경 등 **비대화 영역**)에 pointerdown→capture,
  pointermove→오프셋 갱신(순수 fn), pointerup→해제. 오프셋을 **기존 transform에 합성**
  (`translateX(-50%) translateY(-kbInset)` + `translate(dragX, dragY)`).
- **재focus 리셋:** FocusPanel은 언마운트되지 않고 `if (!focusedBody) return null`만 한다(컴포넌트는 상시 마운트).
  따라서 `useState` 오프셋은 focus/unfocus로 자동 리셋되지 않음 → **`useEffect([focusedId])`에서 명시적으로
  setOffset(0,0)** 해야 한다(사용자가 "항상 초기 위치" 명시).

**주의 (꼭 기록):**
- 패널 안엔 input·슬라이더·버튼·× 가 있다. 드래그가 이들을 가로채면 안 됨 → **드래그는 비대화 영역에서만 시작**
  (전용 핸들/이름 라벨 권장). 슬라이더는 이미 pointerdown으로 coalesce 윈도를 연다(`startSliderDrag`) — 충돌 주의.
- 키보드 inset 리프트(`kbInset`)는 계속 동작해야 함(transform 합성 순서 유지).
- 파일: `app/scene/FocusPanel.tsx`, 신규 `app/scene/panel-drag.ts`(+test).
- 수용 기준: 패널을 핸들로 잡아 아무 데나 옮김 → 손 떼면 그 자리. focus 닫고 다른 행성 focus → 하단 중앙 기본 위치.

---

## 3. focus 나오면 항상 초기 공전 속도로 (idle 공전은 매우 좋음, 약간 차이 남)

> 원문: "아직도 약간 차이가 나. 기본적인 공전은 너무 좋아. focus했다가 다시 나오면 항상 초기 공전 속도로 돌게 해줘."

- "기본 공전 너무 좋아" → 부드러운 idle 드리프트(공전) **유지**.
- "focus 나오면 초기 공전 속도로" → focus 해제 시(`focusedId→null`, `isPaused→false`)
  회전 속도를 **`IDLE_ROTATION_SPEED`로 리셋**. 현재 `System.tsx`의 `rotationSpeedRef`는 ref라 focus 전후로
  유지되고, 해제 시 **held pointer 기준의 빠른 회전으로 재개**된다 → 이걸 막아야 함.
  - `isPaused` false 전이(언focus)에서 `rotationSpeedRef.current = IDLE_ROTATION_SPEED`.
  - 그리고 held pointer가 즉시 다시 가속하지 않도록 **터치 스티어 상태도 리셋**(item 4의 터치-상태 배선과 연계).
- "약간 차이가 나" → 좌우 미세 비대칭(우향 idle 바이어스). **item 4의 대칭 비례 모델로 해소**.

- 파일: `app/scene/System.tsx`(이미 `focusedId`/`isPaused` 읽음 — `useSceneStore`). prev `isPaused` 추적 또는 `useEffect`.
- 수용 기준: 행성 focus → 나오면 **매번 부드러운 idle 속도**로 재개(빠른 스핀 잔류 X).

---

## 4. 터치 회전 = '나' 행성에서 멀수록 빠른 비례(아날로그) 제어

> 원문: "'나' 행성에서 멀어진 곳을 누를 수록 속도가 빨라지게 해줘. 예를 들어 화면 맨 오른쪽을 누른 상태에서
> 맨 왼쪽 까지 누른 상태로 간다고 하면 오른쪽으로 엄청 빨리 돌다가 가까워질 수록 천천히 돌다가
> 나 행성 왼쪽으로 가면 왼쪽으로 돌다가 왼쪽 끝으로 갈 수록 점점 빨라지게."

'나'(Self/root)는 기본 뷰에서 **화면 중앙**에 있다(카메라가 root=`(0,0,0)`를 바라봄). 즉 `pointer.x`(NDC −1..+1)가
**중앙(나)으로부터의 부호 있는 가로 거리**다. 원하는 것 = **속도 ∝ 중앙으로부터의 거리, 부호는 좌우**:
오른쪽 끝=아주 빠른 우회전 → 중앙 가까울수록 느림 → 중앙 통과 → 왼쪽=좌회전, 왼쪽 끝으로 갈수록 빨라짐.
이게 곧 `target = pointer.x * SCALE`(아날로그). **§0의 충돌 노트 반드시 먼저 읽을 것** — 라운드 4b의 고정 크기를
**비례로 되돌리는** 것.

**모델 목표:**
- **대칭 비례:** 같은 거리 좌/우 → 같은 속도 크기. (idle 바이어스가 한쪽을 빠르게 만들지 않도록.)
- **idle 공전 유지:** 중앙/정지 상태의 부드러운 드리프트. 구조화 옵션:
  (i) 중앙 근처 데드존에서만 idle, 그 밖은 순수 대칭 비례; (ii) idle을 스티어 항에 상수로 더하지 말 것(비대칭 원인).
- **응답성:** 라운드 4b는 lerp를 완전히 제거했지만, 아날로그엔 **가벼운 lerp**가 더 부드럽다 — 도그푸드로 튜닝.
- **놓으면 idle로:** 현재 코드는 pointerup에서 pointer를 리셋하지 않아, 손을 떼도 가운데/idle로 안 돌아온다.
  아날로그가 자연스러우려면 **명시적 터치 상태(pointerdown/move/up)** 를 캔버스에 배선해
  (useThree의 잔류 pointer 대신) "누르는 동안만 스티어, 떼면 idle"로 만드는 게 깔끔하다.
  → item 3의 언focus 리셋도 이 터치-상태로 자연히 해결된다. **이게 더 큰 리팩터 — 미리 인지.**

**구현 (pure core + thin adapter):**
- 순수: `touchSpinSpeed(pointerX, scale, ...)` 같은 매핑(+ vitest). 대칭·중앙0·엣지max 검증.
- 어댑터: `app/scene/System.tsx` 회전 모델 + 터치 상태 배선(캔버스 pointer 이벤트).
- 상수: `app/scene/constants.ts`에 터치 스핀 스케일 추가(기존 `MOUSE_INFLUENCE=0.8`·`IDLE_ROTATION_SPEED=0.05` 참조).
- 수용 기준: 손가락을 우엣지→중앙→좌엣지로 슬라이드하면 빠른우 → 느림 → 빠른좌가 **부드럽고 대칭**;
  떼면 부드러운 idle로 복귀; focus 나와도 idle(item 3).

---

## 묶음/순서 제안
- **item 3 + 4 함께** (같은 회전 모델). 터치 상태 배선을 먼저 깔면 둘 다 깔끔.
- item 2(패널 드래그)·item 1(하트 높이)은 독립 — 아무 순서.
- 전부 `useCoarsePointer()` 게이트, 데스크탑 무변. tsc + vitest(현재 138) 그린 유지, 사람 도그푸드.
