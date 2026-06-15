# tous 모바일 대응 설계 — "되게 만들기 패스"

> 날짜: 2026-06-15 · 상태: 설계 승인 대기 → 구현 계획(writing-plans)으로 이어짐
> 한 줄: 현재 `<768px`를 차단하는 데스크탑 전용 정책을 풀고, **기존 탭 기반 상호작용을 그대로 둔 채** 반응형·터치 대응만 입혀 폰에서 끝까지 쓸 수 있게 한다.

---

## 1. 배경 & 핵심 발견

`tous`는 3D 태양계로 개인의 생각을 시각화한다. 지금은 `MobileGuard`가 `<768px`를 차단한다(근거: "드래그/키보드 인터랙션이 터치와 충돌").

코드를 읽어보니 그 근거는 **대체로 과장**이다:

- **카메라가 완전 자동이다.** 수동 회전/이동/줌이 없다(`OrbitControls` 없음). 탐험은 오직 "바디 탭 → 카메라가 그 앞으로 lerp / 빈 공간 탭 → 홈". 즉 3D를 터치로 옮길 때 가장 어려운 부분(한손가락 회전·두손가락 줌 제스처 매핑)이 **처음부터 없다.**
- 편집 패널·탐험 버튼·슬라이더·색/모양 선택은 전부 이미 DOM/포인터 기반 → 탭이 그대로 동작한다.
- 진짜 터치 등가물이 없는 것은 **키보드 단축키**뿐이다: `←/→` 포커스 순환, `Cmd/Ctrl+Z` 실행취소.

따라서 작업은 "재설계"가 아니라 **반응형 + 터치 보정 패스**다.

핵심 메커니즘(이 설계의 전제):

- **포커스가 곧 줌이다.** 어떤 바디든 탭하면 카메라가 그 앞까지 간다. 거리 ≈ `size×4 + 0.9`라 **작은 바디일수록 더 바짝** 다가가, 일단 포커스되면 화면의 상당 부분을 채운다(`app/scene/CameraController.tsx`).
- **드릴다운으로 깊은 바디에 닿는다.** 큰 부모 탭 → 카메라가 부모로 → 자식들이 충분히 커짐(포커스 중 공전 정지, `isPaused`) → 자식 탭. 한 단계씩 파고든다.

---

## 2. 범위 결정 (locked)

| # | 결정 | 비고 |
|---|---|---|
| D1 | **되게 만들기 패스** (재설계 아님) | 자동 카메라·탭 상호작용 보존, 반응형·터치 보정만 |
| D2 | **세로 우선, 가로는 "되기만"** | 방향 잠금 없음. 가로도 렌더·사용 가능하나 별도 튜닝 안 함 |
| D3 | **핀치줌(페이지 줌)은 손대지 않음** | 브라우저 기본 유지. viewport에서 scale 잠금을 넣지 않음. 3D에서 실수 확대 가능성은 감수 |
| D4 | **소프트 키보드 = 패널이 키보드 위로 떠오름** | `visualViewport`로 편집 패널을 키보드 높이만큼 올림 |
| D5 | **작은 바디 도달 = (A) 드릴다운만, 히트영역 확대 없음** | 균일 확대는 히트영역 겹침 → 오선택 유발하므로 배제. (B) 근접 구제는 §Unit 9의 예비안 |
| D6 | **실행취소/다시 = 오른쪽 아래 플로팅, `/me`·coarse 포인터에서만** | 데스크탑 크롬 불변 |
| D7 | **성능은 측정 우선** | 싸고 안전한 것(dpr 상한)만 선제 적용, 나머지는 도그푸드 후 |

---

## 3. 비범위 (Out of scope)

- 모바일 네이티브 재설계(바텀시트 편집, 핀치=전체 우주 오버뷰, 스와이프 바디 이동) — D1에서 제외.
- 수동 카메라(자유 회전/줌) 추가 — 자동 카메라는 제품 정체성.
- `InstancedMesh`/LOD 렌더 재설계 — 카툰 모양 20종과 비호환(PROGRESS M5-B 판정), 측정 전 금지.
- 가로 전용 레이아웃 튜닝(D2).
- `←/→` 포커스 순환의 터치 버튼화 — 탭이 직접 대체하므로 불필요.

---

## 4. 아키텍처 — 단위 분해

각 단위는 한 관심사만 담고 독립적으로 이해·검증 가능하다.

| 단위 | 관심사 | 주요 파일 | 의존 |
|---|---|---|---|
| U1 | 뷰포트 & 전역 터치 기반 | `app/layout.tsx`, `app/globals.css` | — |
| U2 | MobileGuard 제거(차단 해제) | `app/_components/MobileGuard.tsx` + 사용처 | U1 |
| U3 | 고정 패널 safe-area & 반응형 | `FocusPanel`, `WarpControls`, `Nav`, `OnboardingHint`, `FocusLabel`, `HeartButton` | U1 |
| U4 | 소프트 키보드 inset | 신규 `useKeyboardInset` + `FocusPanel` | U1 |
| U5 | 되돌리기/다시 버튼 | 신규 `UndoRedoControls`, `app/me` | U1 |
| U6 | 온보딩 터치화 + 라벨 가시성 | `OnboardingHint`, `app/scene/label-cull.ts` + 호출부 | U1 |
| U7 | 모바일 성능(보수적) | `app/scene/index.tsx` 등 Canvas | U1 |
| U8 | 페이지 반응형(비캔버스 DOM) | `app/page.tsx`, `/why`, `/login`, `/groups` | U1 |
| U9 | 작은 바디 도달성(검증 + 예비 B) | — (검증), 예비: `Scene`/registry | dogfood |

---

## 5. 단위 상세

### U1 — 뷰포트 & 전역 터치 기반
- `layout.tsx`에 Next `viewport` export 추가:
  - `viewportFit: "cover"` — safe-area(노치/홈 인디케이터) 인셋 활성.
  - `interactiveWidget: "resizes-content"` — 키보드가 뜰 때 레이아웃 뷰포트 수축(U4 전제).
  - **scale 잠금(`userScalable`/`maximumScale`)은 넣지 않음**(D3).
- `globals.css`:
  - `html, body { overscroll-behavior: none; }` — iOS 고무줄/당겨서새로고침 차단.
  - `-webkit-tap-highlight-color: transparent;` — 탭 시 회색 플래시 제거.
  - safe-area 인셋을 쓰는 곳에서 `env(safe-area-inset-*)` 직접 사용.
  - **`touch-action`은 손대지 않음**: device-width 뷰포트면 300ms 탭 지연은 이미 없고, `manipulation`은 더블탭 줌을 없애 D3("줌 손 안 댐")와 어긋나므로 제외. 캔버스에도 `touch-action: none`을 걸지 않음(걸면 핀치줌이 막혀 D3 위반).
- 검증: 데스크탑에서 시각/동작 불변(인셋 0, overscroll/tap-highlight는 데스크탑 무해).

### U2 — MobileGuard 제거
- `MobileGuard.tsx` 삭제 + 사용처(`/me`, `/discover`, `/s/[short_code]`로 추정 — 구현 시 grep 확인) 제거.
- 첫 방문 터치 안내는 U6의 온보딩이 대체.
- 순서상 U1 직후 처리 → 이후 폰 도그푸드가 "그래도 볼래요" 없이 가능.

### U3 — 고정 패널 safe-area & 반응형
모든 `position:fixed` 크롬이 노치/홈바/URL바를 비켜가고 좁은 화면에 맞게:
- `FocusPanel`(`app/scene/FocusPanel.tsx`): `bottom: calc(36px + env(safe-area-inset-bottom))`; 폭 `min(360px, calc(100vw - 24px))`(현재 `minWidth:220`만).
- `WarpBottomNav`(`app/_components/warp/WarpControls.tsx`): `bottom`에 safe-area 합산.
- `Nav`(`app/_components/Nav.tsx`): `top`에 `safe-area-inset-top` 합산; 링크 세로 패딩↑로 탭 높이 ≥44px; 360px에서 4개 알약 수용 확인(초과 시 패딩/갭 축소).
- `OnboardingHint`: `bottom`(현재 96)에 safe-area 합산.
- `FocusLabel`(`lifted`): 하단 nav + safe-area 위로 유지 확인.
- `HeartButton`(`/me` 좌상단): Nav와 충돌 없는지 확인, 필요 시 위치 보정.
- 작은 탭 타깃 ≥44px로: `FocusPanel`의 `삭제`·`×` 닫기 버튼, nav 링크.

### U4 — 소프트 키보드 inset (D4)
- **순수함수** `computeKeyboardInset({ layoutHeight, viewportHeight, offsetTop }): number`
  - 겹침 = `layoutHeight - viewportHeight - offsetTop`, 음수는 0으로 clamp. → vitest.
- **훅** `useKeyboardInset(): number` — `window.visualViewport`의 `resize`/`scroll` 구독, 위 함수로 inset 계산. `visualViewport` 미지원 시 0 반환.
- `FocusPanel`이 편집/추가 중일 때 `transform`에 `translateY(-inset)` 합성 → 키보드 바로 위 안착, 닫히면 0 복귀.
- 데스크탑 무영향(키보드 없음 → inset 0 → 항상 배선 안전).
- 패턴: 순수 코어 + 얇은 DOM 어댑터(repo 관행 `lib/sphere/sync-session.ts`·`lib/warp/session.ts`와 동일).

### U5 — 되돌리기/다시 버튼 (D6)
- 터치 등가물 없는 유일 키보드 동작(`Cmd+Z`/`Cmd+Y`).
- **헬퍼** `useCoarsePointer(): boolean` — `matchMedia('(pointer: coarse)')`.
- **컴포넌트** `UndoRedoControls` — ↩︎/↪︎ 한 쌍, 우하단 플로팅(`bottom`/`right`에 safe-area), 엄지 영역.
  - 클릭 → `useUniverseStore.temporal.getState().undo()/redo()`.
  - `temporal`의 `pastStates`/`futureStates` 비면 각각 비활성.
- **`/me` 편집기에서만, coarse 포인터에서만** 렌더(discover/share는 읽기전용·히스토리 없음; 데스크탑 크롬 불변).
- 실행취소는 포커스와 무관 → `FocusPanel`(포커스 시에만 표시)에 묶지 않고 독립.
- 엣지: 편집 중 키보드가 우하단 버튼을 가릴 수 있으나, 실행취소는 주로 일반 모드에서 사용 → v1 허용.

### U6 — 온보딩 터치화 + 라벨 가시성
- `OnboardingHint`(`app/_components/OnboardingHint.tsx`): 현재 `[key, action]` 쌍 → 터치엔 무의미.
  - coarse 포인터면 탭 기반 문구로("행성 탭 → 선택", "빈 공간 탭 → 닫기", "↩︎ → 되돌리기"). 호출부(`/me`, `/discover`)가 `touchLines`를 함께 넘기고 coarse면 그쪽을 표시.
- 라벨 컬링(`app/scene/label-cull.ts` `nextLabelVisible`): SHOW/HIDE 임계 상수를 파라미터화 → **모바일 프로파일(약간 완화)**을 coarse 포인터(+좁은 화면)에서 선택. hover로 라벨을 못 띄우는 손실을 평소 가시 라벨 증가로 보완.
  - 순수함수 → vitest로 프로파일 검증.

### U7 — 모바일 성능 (D7, 보수적)
- Canvas `dpr` 상한: 모바일에서 낮춰(레티나 폰 프래그먼트 부하↓) 안전 마진 확보. `app/scene/index.tsx` 및 다른 Canvas 마운트.
- 그 이상(라벨 예산 추가 축소 등)은 **폰 도그푸드에서 끊김이 관측될 때만**. `InstancedMesh`/LOD는 비범위.

### U8 — 페이지 반응형 (비캔버스 DOM)
- 랜딩 `app/page.tsx`: `100vh → 100dvh`(URL바 보정); 버튼 행(`탐험`/`절대 누르지 마시오`)이 360px에서 넘치면 세로 스택 허용(히어로 텍스트는 이미 `clamp()`).
- `/groups`(`GroupsClient`), `/login`, `/why`: 고정폭/데스크탑 가정 점검 → 패딩·스택·탭타깃 ≥44px. 페이지별 가벼운 감사+수정.

### U9 — 작은 바디 도달성 (검증 + 예비안)
- **v1 = 검증 항목**(코드 없음, D5-A): 도그푸드에서 드릴다운으로 깊은 작은 위성까지 닿는지 확인. 전제(포커스=줌인, 공전 정지)가 실제로 충분한지 사람 눈으로 본다.
- **예비안 (B) 근접 구제** — 도그푸드에서 "큰 형제 옆 아주 작은 형제"가 답답하면 얹는다. 히트영역을 **키우지 않고**:
  - 빈 공간 탭(`onPointerMissed`)일 때만, 탭 지점에서 화면상 가장 가까운 바디 중심 1개가 임계(~44px) 안이면 그걸 포커스.
  - 정확한 탭은 그대로 그 바디가 이김(겹치는 충돌체가 없으니 오선택 구조적 차단). 명백히 빈 곳 탭은 닫기 유지.
  - 재사용: 기존 `onPointerMissed`(`app/scene/index.tsx`) + 바디 메시 레지스트리(`app/scene/store/body-mesh-registry.ts`)로 화면 투영·최근접 계산.
  - 순수함수(후보 투영 → 최근접 within 임계)로 분리 → vitest.

---

## 6. 제어 흐름 (터치 상호작용 모델)

- **탐험(드릴다운)**: 바디 탭 → R3F 포인터 → `setFocus(id)` → `CameraController`가 카메라를 바디로 lerp → 바디+자식 커짐 → 반복.
- **닫기/홈**: 명백히 빈 공간 탭 → `onPointerMissed` → `setFocus(null)` → 카메라 홈 복귀.
- **편집**: `편집` 탭 → 입력 autofocus → 키보드 상승 → `visualViewport` 수축 → `useKeyboardInset` → `FocusPanel`이 키보드 위로 상승. `Enter/Esc` 없이 `×`/빈 공간 탭으로 종료.
- **자식 추가**: `+ 자식` 탭 → 동일 키보드 흐름 → 입력 후 모바일 키보드의 **완료/return 키가 기존 Enter 핸들러(`commitAdd`)를 그대로 발생**시켜 추가됨 → 별도 버튼 불필요(도그푸드로 확인). 빈 공간 탭으로 취소.
- **실행취소**: ↩︎ 탭(coarse·/me) → `temporal.undo()`.
- **탐험 워프**: `다음 우주`/`뒤로` 버튼(기존 DOM) 탭 — 변경 없음.

---

## 7. 엣지 / 폴백

- `visualViewport` 미지원(구형 브라우저): inset 0 → 패널 하단 고정 유지(키보드에 일부 가릴 수 있으나 graceful).
- `sessionStorage`/`localStorage` 불가(프라이빗 모드): 기존 try/catch 패턴 보존(온보딩·게이트는 조용히 skip).
- coarse 포인터 오탐(터치 노트북/하이브리드): 되돌리기 버튼이 숨겨져도 키보드가 있으니 기능 손실 없음.
- 가로 + 키보드: 패널이 상승하나 세로 공간 협소 → "되기만"(D2) 허용.
- 방향 전환/ dpr 변화: Canvas 리사이즈 자동 처리.

---

## 8. 테스트 전략

- **vitest(순수 로직)**: `computeKeyboardInset`(U4), 라벨 컬링 모바일 프로파일(U6), `useCoarsePointer`/근접 헬퍼(모킹 가능), (B 채택 시) 최근접 투영(U9). 현재 **126 그린 유지**.
- **사람 도그푸드(R3F/DOM 시각)**(ADR-0002 D12): 실폰 또는 devtools 기기 에뮬 + 배포본(`tous-sigma.vercel.app`). 체크리스트:
  - 탭→포커스, 드릴다운으로 작은 위성 도달, 빈 공간 탭→닫기.
  - 편집 시 키보드가 패널을 안 가림(패널 상승), 자식 추가.
  - 되돌리기/다시 버튼 동작·비활성.
  - Nav 360px 수용, safe-area 여백(노치/홈바), 가로 렌더.
  - 랜딩·/why·/login·/groups 레이아웃 안 깨짐.

---

## 9. 진행 순서 & 완료 기준

순서: `U1 → U2 → (U3·U4·U5·U6 병렬) → U7 → U8 → U9 검증 → (필요시 B)`

완료 기준:
- `MobileGuard` 제거됨, 세로 폰에서 탐험·드릴다운·키보드 편집·실행취소·워프·공유·그룹이 **탭으로 끝까지** 동작.
- `tsc` green, vitest green(≥126).
- 사람 도그푸드 통과(위 체크리스트).
- ≤360 세로 + 기본 가로에서 눈에 띄는 레이아웃 깨짐 없음.
