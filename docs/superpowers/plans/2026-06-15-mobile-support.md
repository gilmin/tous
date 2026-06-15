# tous 모바일 대응 구현 계획 (되게 만들기 패스)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `<768px` 차단(`MobileGuard`)을 풀고, 기존 탭 기반 상호작용을 그대로 둔 채 반응형·터치 보정을 입혀 폰에서 끝까지 쓸 수 있게 한다.

**Architecture:** 자동 카메라·탭 선택은 불변. 순수 로직(키보드 겹침 계산·라벨 컬링 임계)은 파라미터화해 vitest로, R3F/DOM 시각 배선은 사람 도그푸드로 검증(ADR-0002 D12). 새 코드는 repo 관행대로 "순수 코어 + 얇은 어댑터"(`lib/.../*-session.ts` 류).

**Tech Stack:** Next 16(App Router) · React 19 · React Three Fiber + three · zustand/zundo · vitest(happy-dom). 설계 단일 출처: `docs/superpowers/specs/2026-06-15-mobile-support-design.md`.

**검증 명령:**
- 타입: `npx tsc --noEmit` → 에러 0
- 테스트: `npm test` (= `vitest run`) → 전부 PASS (현재 126 베이스라인)
- 단일 테스트: `npx vitest run <파일>`

**커밋 트레일러:** 모든 커밋 메시지 끝에 빈 줄 후 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## 파일 구조 (생성/수정 맵)

**생성:**
- `app/_components/keyboard-inset.ts` — `computeKeyboardInset`(순수) + `useKeyboardInset`(훅)
- `app/_components/keyboard-inset.test.ts` — `computeKeyboardInset` 테스트
- `app/_components/useCoarsePointer.ts` — `(pointer: coarse)` 훅
- `app/_components/UndoRedoControls.tsx` — 터치 전용 ↩︎/↪︎ 플로팅 버튼

**수정:**
- `app/layout.tsx`, `app/globals.css` (U1)
- `app/_components/MobileGuard.tsx`(삭제), `app/me/page.tsx`, `app/discover/page.tsx`, `app/s/[short_code]/page.tsx` (U2)
- `app/scene/FocusPanel.tsx`, `app/_components/warp/WarpControls.tsx`, `app/_components/Nav.tsx`, `app/_components/OnboardingHint.tsx`, `app/_components/FocusLabel.tsx` (U3)
- `app/scene/FocusPanel.tsx` (U4, U3와 같은 파일)
- `app/me/page.tsx` (U5, U2와 같은 파일)
- `app/_components/OnboardingHint.tsx`, `app/scene/constants.ts`, `app/scene/label-cull.ts`, `app/scene/label-cull.test.ts`, `app/scene/System.tsx`, `app/scene/OrbitingBody.tsx` (U6)
- `app/scene/index.tsx`, `app/scene/PublicScene.tsx`, `app/scene/LandingScene.tsx` (U7)
- `app/page.tsx`, `app/why/page.tsx` (U8)

---

## Task 1 (U1): 뷰포트 & 전역 터치 기반

**Files:**
- Modify: `app/layout.tsx:1`, `app/layout.tsx:26-29`
- Modify: `app/globals.css:22-26`

- [ ] **Step 1: `layout.tsx` 임포트에 `Viewport` 타입 추가**

`app/layout.tsx:1` 교체:
```ts
import type { Metadata, Viewport } from "next";
```
(기존: `import type { Metadata } from "next";`)

- [ ] **Step 2: `viewport` export 추가**

`app/layout.tsx`의 `metadata` export(라인 26-29) 바로 아래에 추가:
```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치/홈 인디케이터 영역까지 채우고 safe-area 인셋을 활성화.
  viewportFit: "cover",
  // 키보드가 뜰 때 레이아웃 뷰포트를 수축(Android). iOS는 useKeyboardInset의
  // visualViewport 계산이 보정 (Task 4).
  interactiveWidget: "resizes-content",
};
```
> 주의: `userScalable`/`maximumScale`는 넣지 않음 — 핀치줌은 브라우저 기본 유지(D3).

- [ ] **Step 3: `globals.css`에 전역 터치 규칙 추가**

`app/globals.css`의 `body { ... }` 블록(라인 22-26)을 교체:
```css
html {
  /* iOS 고무줄 스크롤 / 당겨서 새로고침 차단 */
  overscroll-behavior: none;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-cute), system-ui, sans-serif;
  /* 탭 시 회색 하이라이트 플래시 제거 */
  -webkit-tap-highlight-color: transparent;
}
```
> `touch-action`은 손대지 않음 — `manipulation`은 더블탭 줌을 없애 D3와 어긋남.

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0

- [ ] **Step 5: 커밋**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(mobile): viewport-fit + 전역 터치 기반 (U1)"
```

---

## Task 2 (U2): MobileGuard 제거 (차단 해제)

**Files:**
- Delete: `app/_components/MobileGuard.tsx`
- Modify: `app/me/page.tsx:9,45`
- Modify: `app/discover/page.tsx:10,113`
- Modify: `app/s/[short_code]/page.tsx:5,32`

- [ ] **Step 1: 세 페이지에서 import + 사용 제거**

`app/me/page.tsx`: 라인 9 `import { MobileGuard } from "@/app/_components/MobileGuard";` 삭제, 라인 45 `<MobileGuard />` 삭제.
`app/discover/page.tsx`: 라인 10 import 삭제, 라인 113 `<MobileGuard />` 삭제.
`app/s/[short_code]/page.tsx`: 라인 5 import 삭제, 라인 32 `<MobileGuard />` 삭제.

- [ ] **Step 2: 컴포넌트 파일 삭제**

```bash
git rm app/_components/MobileGuard.tsx
```

- [ ] **Step 3: 잔존 참조 없음 확인**

Run: `grep -rn "MobileGuard" app` — 결과 0 줄
확인: `npx tsc --noEmit` → 에러 0 (import 끊김 없음)

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat(mobile): drop the <768px desktop-only guard (U2)"
```

---

## Task 3 (U3): 고정 패널 safe-area & 탭 타깃

모든 `position:fixed` 크롬에 safe-area 인셋을 더하고 작은 탭 타깃을 키운다. **순수 스타일 변경 → tsc + 도그푸드로 검증**(단위 테스트 없음).

**Files:**
- Modify: `app/_components/Nav.tsx:18-33,42`
- Modify: `app/_components/warp/WarpControls.tsx:24-32`
- Modify: `app/_components/FocusLabel.tsx:30`
- Modify: `app/_components/OnboardingHint.tsx:44`
- Modify: `app/scene/FocusPanel.tsx` (패널 컨테이너 + 삭제/× 버튼)

- [ ] **Step 1: Nav — safe-area + 탭 높이**

`app/_components/Nav.tsx`의 `<nav style={{ ... }}>`에서 `top: 16, left: 16,`를 교체:
```ts
        top: "calc(16px + env(safe-area-inset-top))",
        left: "calc(16px + env(safe-area-inset-left))",
```
그리고 링크 `<Link style={{ padding: "6px 14px", ... }}>`의 `padding: "6px 14px"`를 `padding: "9px 14px"`로 (탭 높이 ↑).

- [ ] **Step 2: WarpBottomNav — safe-area**

`app/_components/warp/WarpControls.tsx`의 `WarpBottomNav` 안 `bottom: 28,`를 교체:
```ts
        bottom: "calc(28px + env(safe-area-inset-bottom))",
```

- [ ] **Step 3: FocusLabel — safe-area**

`app/_components/FocusLabel.tsx:30`의 `bottom: lifted ? 92 : 36,`를 교체:
```ts
        bottom: lifted
          ? "calc(92px + env(safe-area-inset-bottom))"
          : "calc(36px + env(safe-area-inset-bottom))",
```

- [ ] **Step 4: OnboardingHint — safe-area**

`app/_components/OnboardingHint.tsx:44`의 `bottom: 96,`를 교체:
```ts
        bottom: "calc(96px + env(safe-area-inset-bottom))",
```

- [ ] **Step 5: FocusPanel — safe-area + 폭 클램프 + 탭 타깃**

`app/scene/FocusPanel.tsx`의 패널 컨테이너 `<div style={{ ... bottom: 36, ... minWidth: 220, ... }}>`에서:
- `bottom: 36,` → `bottom: "calc(36px + env(safe-area-inset-bottom))",`
- `minWidth: 220,` 다음 줄에 추가: `maxWidth: "calc(100vw - 24px)", boxSizing: "border-box",`

같은 파일 `편집`/`+ 자식` 버튼의 `padding: "6px 16px",`(2곳)를 `padding: "9px 18px",`로.
`삭제` 버튼의 `padding: "4px 12px", fontSize: 12, ... borderRadius: 6,`를 `padding: "8px 16px", fontSize: 13, ... borderRadius: 999,`로(형제 버튼과 통일·탭 타깃 ↑).
`×` 닫기 버튼의 `width: 24, height: 24, ... fontSize: 16,`를 `width: 32, height: 32, ... fontSize: 18,`로.

- [ ] **Step 6: 타입 체크 + 커밋**

Run: `npx tsc --noEmit` → 에러 0
```bash
git add app/_components/Nav.tsx app/_components/warp/WarpControls.tsx app/_components/FocusLabel.tsx app/_components/OnboardingHint.tsx app/scene/FocusPanel.tsx
git commit -m "feat(mobile): safe-area insets + larger tap targets on fixed chrome (U3)"
```

---

## Task 4 (U4): 소프트 키보드 inset — 패널 떠오름

**Files:**
- Create: `app/_components/keyboard-inset.ts`
- Create: `app/_components/keyboard-inset.test.ts`
- Modify: `app/scene/FocusPanel.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `app/_components/keyboard-inset.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeKeyboardInset } from "./keyboard-inset";

describe("computeKeyboardInset", () => {
  it("visual viewport가 레이아웃을 꽉 채우면 0 (키보드 없음)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 800, offsetTop: 0 }),
    ).toBe(0);
  });

  it("visual viewport가 줄면 그 차이가 키보드 겹침 (iOS)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 500, offsetTop: 0 }),
    ).toBe(300);
  });

  it("visual viewport 스크롤 오프셋을 반영", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 500, offsetTop: 50 }),
    ).toBe(250);
  });

  it("음수가 되지 않음 (고무줄/오버스크롤)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 850, offsetTop: 0 }),
    ).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run app/_components/keyboard-inset.test.ts`
Expected: FAIL — "Failed to resolve import ./keyboard-inset" 또는 "computeKeyboardInset is not a function"

- [ ] **Step 3: 최소 구현 작성**

Create `app/_components/keyboard-inset.ts`:
```ts
"use client";

import { useEffect, useState } from "react";

// 키보드가 가린 화면 하단 높이(px). 레이아웃 뷰포트에서 visual viewport(키보드가
// 밀어낸 보이는 영역)와 그 스크롤 오프셋을 빼면 하단 겹침이 남는다. 순수 함수라
// vitest로 검증하고, 훅은 visualViewport 이벤트만 얇게 잇는다(repo 관행: 순수
// 코어 + 어댑터).
export function computeKeyboardInset({
  layoutHeight,
  viewportHeight,
  offsetTop,
}: {
  layoutHeight: number;
  viewportHeight: number;
  offsetTop: number;
}): number {
  return Math.max(0, layoutHeight - viewportHeight - offsetTop);
}

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // 미지원 브라우저 → 0 유지(패널 하단 고정, graceful)
    const update = () =>
      setInset(
        computeKeyboardInset({
          layoutHeight: window.innerHeight,
          viewportHeight: vv.height,
          offsetTop: vv.offsetTop,
        }),
      );
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run app/_components/keyboard-inset.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: FocusPanel이 inset만큼 떠오르게 배선**

`app/scene/FocusPanel.tsx` 상단 import에 추가:
```ts
import { useKeyboardInset } from "../_components/keyboard-inset";
```
`FocusPanel` 컴포넌트 본문에서 다른 훅들과 함께(이른 `return null` **이전**) 추가:
```ts
  const kbInset = useKeyboardInset();
```
패널 컨테이너 `<div>`의 `transform: "translateX(-50%)",`를 교체:
```ts
        transform: `translateX(-50%) translateY(-${
          isEditing || isAdding ? kbInset : 0
        }px)`,
        transition: "transform 0.18s ease",
```
> `isEditing`/`isAdding`은 이미 `return null` 이전(라인 229-230)에 계산됨. 키보드는 입력 포커스(편집/추가) 때만 뜨므로 그때만 들어올림.

- [ ] **Step 6: 타입 체크 + 전체 테스트 + 커밋**

Run: `npx tsc --noEmit` → 0
Run: `npm test` → 전부 PASS (베이스라인 +4)
```bash
git add app/_components/keyboard-inset.ts app/_components/keyboard-inset.test.ts app/scene/FocusPanel.tsx
git commit -m "feat(mobile): lift the edit panel above the soft keyboard (U4)"
```

---

## Task 5 (U5): 되돌리기/다시 버튼 (터치 전용, /me)

**Files:**
- Create: `app/_components/useCoarsePointer.ts`
- Create: `app/_components/UndoRedoControls.tsx`
- Modify: `app/me/page.tsx`

- [ ] **Step 1: coarse-pointer 훅 작성**

Create `app/_components/useCoarsePointer.ts`:
```ts
"use client";

import { useEffect, useState } from "react";

// 터치(거친 포인터) 기기 여부. SSR/첫 렌더는 false(데스크탑 기본)로 시작해 effect
// 에서 갱신 → 하이드레이션 불일치 회피(OnboardingHint와 같은 패턴).
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return coarse;
}
```

- [ ] **Step 2: UndoRedoControls 작성**

Create `app/_components/UndoRedoControls.tsx`:
```tsx
"use client";

import type { CSSProperties } from "react";
import { useStore } from "zustand";
import { useUniverseStore } from "@/app/scene/store/universe-store";
import { useCoarsePointer } from "./useCoarsePointer";

// 터치 전용 실행취소/다시실행. 데스크탑은 키보드(Cmd/Ctrl+Z, Ctrl+Y)가 처리하고
// 폰엔 키보드가 없으므로 /me 편집기 우하단(엄지 영역)에 ↩︎/↪︎를 띄운다. 히스토리는
// 포커스와 무관 → FocusPanel이 아닌 독립 플로팅. coarse 포인터에서만 렌더(데스크탑
// 크롬 불변).
export function UndoRedoControls() {
  const coarse = useCoarsePointer();
  const canUndo = useStore(
    useUniverseStore.temporal,
    (s) => s.pastStates.length > 0,
  );
  const canRedo = useStore(
    useUniverseStore.temporal,
    (s) => s.futureStates.length > 0,
  );
  if (!coarse) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: "calc(16px + env(safe-area-inset-right))",
        bottom: "calc(20px + env(safe-area-inset-bottom))",
        zIndex: 45,
        display: "flex",
        gap: 8,
        fontFamily: "var(--font-cute), system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => useUniverseStore.temporal.getState().undo()}
        disabled={!canUndo}
        aria-label="실행 취소"
        style={btnStyle(!canUndo)}
      >
        ↩︎
      </button>
      <button
        onClick={() => useUniverseStore.temporal.getState().redo()}
        disabled={!canRedo}
        aria-label="다시 실행"
        style={btnStyle(!canRedo)}
      >
        ↪︎
      </button>
    </div>
  );
}

function btnStyle(disabled: boolean): CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.22)",
    background: disabled ? "rgba(43,28,84,0.35)" : "rgba(43,28,84,0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
    fontSize: 20,
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 6px 18px rgba(20,10,50,0.35)",
  };
}
```
> `useUniverseStore.temporal`은 zundo가 붙인 vanilla store. `useStore(store, selector)`로 구독해 `pastStates`/`futureStates` 길이를 읽는다.

- [ ] **Step 3: /me에 마운트**

`app/me/page.tsx` import에 추가:
```ts
import { UndoRedoControls } from "@/app/_components/UndoRedoControls";
```
`<UniverseSync userId={user.id} />` 다음 줄에 추가:
```tsx
      <UndoRedoControls />
```

- [ ] **Step 4: /me 상단 우측 클러스터 safe-area (U3 연장)**

`app/me/page.tsx`의 우상단 클러스터 `<div style={{ position: "fixed", top: 14, right: 14, ... }}>`에서:
- `top: 14,` → `top: "calc(14px + env(safe-area-inset-top))",`
- `right: 14,` → `right: "calc(14px + env(safe-area-inset-right))",`

- [ ] **Step 5: 타입 체크 + 커밋**

Run: `npx tsc --noEmit` → 0
```bash
git add app/_components/useCoarsePointer.ts app/_components/UndoRedoControls.tsx app/me/page.tsx
git commit -m "feat(mobile): touch undo/redo controls in the /me editor (U5)"
```

---

## Task 6 (U6): 온보딩 터치 문구 + 라벨 가시성

**Files:**
- Modify: `app/_components/OnboardingHint.tsx`
- Modify: `app/me/page.tsx`, `app/discover/page.tsx` (touchLines 전달)
- Modify: `app/scene/constants.ts`, `app/scene/label-cull.ts`, `app/scene/label-cull.test.ts`
- Modify: `app/scene/System.tsx`, `app/scene/OrbitingBody.tsx`

### 6a. 온보딩 터치 문구

- [ ] **Step 1: OnboardingHint에 touchLines prop + coarse 분기**

`app/_components/OnboardingHint.tsx` import에 추가:
```ts
import { useCoarsePointer } from "./useCoarsePointer";
```
props 타입에 `touchLines`를 추가하고(시그니처):
```ts
export function OnboardingHint({
  storageKey,
  title,
  lines,
  touchLines,
}: {
  storageKey: string;
  title: string;
  lines: [key: string, action: string][];
  touchLines?: [key: string, action: string][];
}) {
```
컴포넌트 본문 `const [show, setShow] = useState(false);` 다음에 추가:
```ts
  const coarse = useCoarsePointer();
  const rows = coarse && touchLines ? touchLines : lines;
```
렌더의 `{lines.map(([key, action]) => (`를 `{rows.map(([key, action]) => (`로 교체.

- [ ] **Step 2: /me 호출부에 touchLines 추가**

`app/me/page.tsx`의 `<OnboardingHint ... lines={[...]} />`에 `lines` 다음으로 추가:
```tsx
        touchLines={[
          ["행성 탭", "포커스 — 편집·자식 추가·삭제"],
          ["↩︎ ↪︎", "실행 취소 · 다시 실행"],
          ["빈 곳 탭", "포커스 해제"],
        ]}
```

- [ ] **Step 3: /discover 호출부에 touchLines 추가**

`app/discover/page.tsx`의 `<OnboardingHint ... lines={[...]} />`에 `lines` 다음으로 추가:
```tsx
          touchLines={[
            ["행성 탭", "행성 하나를 살펴보기"],
            ["빈 곳 탭", "살펴보기 끝내기"],
            ["다음 우주 →", "다음 우주로 워프"],
            ["← 뒤로", "이전 우주로 돌아가기"],
          ]}
```

### 6b. 라벨 컬링 모바일 프로파일

- [ ] **Step 4: 모바일 임계 상수 추가**

`app/scene/constants.ts`의 `LABEL_CULL_HIDE = 0.011;` 다음에 추가:
```ts
// coarse-pointer(터치)용 더 느슨한 쌍 — hover로 라벨을 띄울 수 없으니 더 작은
// 겉보기 크기에서도 보이게 한다(데스크탑 대비 ~35% 낮춤).
export const LABEL_CULL_SHOW_MOBILE = 0.009;
export const LABEL_CULL_HIDE_MOBILE = 0.007;
```

- [ ] **Step 5: 실패하는 테스트 추가**

`app/scene/label-cull.test.ts` import에 모바일 상수 추가:
```ts
import {
  LABEL_CULL_SHOW,
  LABEL_CULL_HIDE,
  LABEL_CULL_SHOW_MOBILE,
  LABEL_CULL_HIDE_MOBILE,
} from "./constants";
```
`describe` 안에 케이스 추가:
```ts
  it("느슨한 모바일 임계에선 더 작은 바디도 보인다", () => {
    // 겉보기 0.06/6 = 0.01 — 데스크탑 SHOW(0.014) 아래, 모바일 SHOW(0.009) 위
    expect(nextLabelVisible(false, 0.06, 6)).toBe(false);
    expect(
      nextLabelVisible(false, 0.06, 6, LABEL_CULL_SHOW_MOBILE, LABEL_CULL_HIDE_MOBILE),
    ).toBe(true);
  });
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npx vitest run app/scene/label-cull.test.ts`
Expected: FAIL — `nextLabelVisible`이 아직 4·5번째 인자를 안 받아 둘째 expect가 false

- [ ] **Step 7: `nextLabelVisible` 파라미터화**

`app/scene/label-cull.ts`의 함수를 교체:
```ts
export function nextLabelVisible(
  prev: boolean,
  size: number,
  distance: number,
  show: number = LABEL_CULL_SHOW,
  hide: number = LABEL_CULL_HIDE,
): boolean {
  if (distance <= 0) return true; // camera at/inside the body — degenerate, show
  const apparent = size / distance;
  if (apparent >= show) return true;
  if (apparent <= hide) return false;
  return prev;
}
```
(기존 import `LABEL_CULL_SHOW, LABEL_CULL_HIDE`는 기본값으로 계속 사용.)

- [ ] **Step 8: 테스트 통과 확인**

Run: `npx vitest run app/scene/label-cull.test.ts`
Expected: PASS (기존 6 + 신규 1)

- [ ] **Step 9: System이 coarse 임계를 OrbitingBody로 전달**

`app/scene/System.tsx`의 constants import를 확장:
```ts
import {
  IDLE_ROTATION_SPEED,
  MOUSE_INFLUENCE,
  LERP_FACTOR,
  LABEL_CULL_SHOW,
  LABEL_CULL_HIDE,
  LABEL_CULL_SHOW_MOBILE,
  LABEL_CULL_HIDE_MOBILE,
} from "./constants";
```
import 추가:
```ts
import { useCoarsePointer } from "../_components/useCoarsePointer";
```
컴포넌트 본문 `const isPaused = ...` 다음에 추가:
```ts
  const coarse = useCoarsePointer();
  const labelShow = coarse ? LABEL_CULL_SHOW_MOBILE : LABEL_CULL_SHOW;
  const labelHide = coarse ? LABEL_CULL_HIDE_MOBILE : LABEL_CULL_HIDE;
```
렌더의 `<OrbitingBody id={rootId} />`를 교체:
```tsx
      <OrbitingBody id={rootId} labelShow={labelShow} labelHide={labelHide} />
```
> System은 Canvas 안 컴포넌트지만 일반 React 컴포넌트라 DOM 훅 사용 가능. Context가 아닌 prop 스레딩 → 추가 파일/리스너 없음(리스너 1개).

- [ ] **Step 10: OrbitingBody가 임계를 받아 재귀로 전달 + 컬링에 사용**

`app/scene/OrbitingBody.tsx`의 constants import를 확장:
```ts
import {
  LABEL_FADE_NEAR,
  LABEL_FADE_FAR,
  LABEL_CULL_SHOW,
  LABEL_CULL_HIDE,
} from "./constants";
```
컴포넌트 시그니처를 교체:
```tsx
export const OrbitingBody = memo(function OrbitingBody({
  id,
  labelShow = LABEL_CULL_SHOW,
  labelHide = LABEL_CULL_HIDE,
}: {
  id: string;
  labelShow?: number;
  labelHide?: number;
}) {
```
컬링 호출(라인 84 부근) `const visible = nextLabelVisible(labelVisible, body.size, distance);`를 교체:
```tsx
      const visible = nextLabelVisible(
        labelVisible,
        body.size,
        distance,
        labelShow,
        labelHide,
      );
```
자식 재귀 렌더 `<OrbitingBody key={child.id} id={child.id} />`를 교체:
```tsx
        {body.children?.map((child) => (
          <OrbitingBody
            key={child.id}
            id={child.id}
            labelShow={labelShow}
            labelHide={labelHide}
          />
        ))}
```

- [ ] **Step 11: 타입 체크 + 전체 테스트 + 커밋**

Run: `npx tsc --noEmit` → 0
Run: `npm test` → PASS (베이스라인 +5)
```bash
git add app/_components/OnboardingHint.tsx app/me/page.tsx app/discover/page.tsx app/scene/constants.ts app/scene/label-cull.ts app/scene/label-cull.test.ts app/scene/System.tsx app/scene/OrbitingBody.tsx
git commit -m "feat(mobile): touch onboarding copy + looser label culling (U6)"
```

---

## Task 7 (U7): 모바일 성능 (보수적 dpr 상한)

레티나 폰의 프래그먼트 부하를 줄이도록 세 Canvas의 dpr을 2배로 캡(3배 폰 대응). 데스크탑 무해. **측정 우선 — 그 이상은 도그푸드에서 끊김 관측 시.**

**Files:**
- Modify: `app/scene/index.tsx:76`, `app/scene/PublicScene.tsx:56`, `app/scene/LandingScene.tsx:40`

- [ ] **Step 1: 세 Canvas에 `dpr={[1, 2]}` 추가**

`app/scene/index.tsx`의 `<Canvas camera={...}`에 prop 추가:
```tsx
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2, 8], fov: 50, near: 0.01, far: 200 }}
```
`app/scene/PublicScene.tsx`의 `<Canvas camera={...}`에 동일하게 `dpr={[1, 2]}` 추가.
`app/scene/LandingScene.tsx`의 `<Canvas camera={...}`에 동일하게 `dpr={[1, 2]}` 추가.

- [ ] **Step 2: 타입 체크 + 커밋**

Run: `npx tsc --noEmit` → 0
```bash
git add app/scene/index.tsx app/scene/PublicScene.tsx app/scene/LandingScene.tsx
git commit -m "feat(mobile): cap canvas dpr at 2x to ease retina-phone fill cost (U7)"
```

---

## Task 8 (U8): 페이지 반응형 (비캔버스 DOM)

이미 대체로 반응형(clamp·Tailwind·%). `%`로 배치된 랜딩과 글 페이지의 `100vh`만 `100dvh`로 보정하고 좁은 폭에서 버튼 줄바꿈을 허용.

**Files:**
- Modify: `app/page.tsx:9,41-50`
- Modify: `app/why/page.tsx:40`

- [ ] **Step 1: 랜딩 — dvh + 버튼 줄바꿈**

`app/page.tsx:9`의 `<main style={{ position: "relative", width: "100vw", height: "100vh" }}>`에서 `height: "100vh"`를 `height: "100dvh"`로.
버튼 컨테이너 `<div style={{ position: "absolute", bottom: "17%", ... display: "flex", gap: 12, alignItems: "center" }}>`에 추가:
```ts
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "92vw",
```

- [ ] **Step 2: /why — dvh**

`app/why/page.tsx:40`의 `height: "100vh",`를 `height: "100dvh",`로(`overflowY: "auto"` 유지).

- [ ] **Step 3: groups/login 육안 확인 (코드 변경은 도그푸드 후)**

`/login`은 Tailwind(`min-h-screen`·`max-w-xs`·`px-6`)로 이미 반응형, `/groups`(`GroupsClient`)도 확인. 360px에서 넘침/잘림 있으면 그때 패딩/스택 보정. **선제 변경 없음.**

- [ ] **Step 4: 타입 체크 + 커밋**

Run: `npx tsc --noEmit` → 0
```bash
git add app/page.tsx app/why/page.tsx
git commit -m "feat(mobile): dvh + button wrap on landing and /why (U8)"
```

---

## Task 9 (U9): 작은 바디 도달성 — 검증 (코드 없음, D5-A)

v1은 드릴다운에만 의존(히트영역 확대 없음). 사람 도그푸드로 충분성만 확인한다.

- [ ] **Step 1: 도그푸드 — 깊은 작은 위성 도달**

실폰(또는 devtools 기기 에뮬)에서:
- 큰 부모(행성) 탭 → 카메라가 다가가 자식 위성이 충분히 커지는지.
- 그 위성 탭 → 또 다가가는지(드릴다운 반복).
- 의도적으로 만든 아주 작은 위성까지 2~3단계로 닿는지.
- 포커스 중 공전이 멈춰 탭이 쉬운지.

판정: 닿으면 **U9 종료**. "큰 형제 옆 아주 작은 형제"가 반복적으로 답답하면 → 부록 B 실행.

---

## Task 10: 최종 검증

- [ ] **Step 1: 타입 + 전체 테스트**

Run: `npx tsc --noEmit` → 에러 0
Run: `npm test` → 전부 PASS (베이스라인 126 + 신규 5 = 131; keyboard-inset 4 + label-cull 1)

- [ ] **Step 2: 도그푸드 체크리스트 (세로 폰)**

- 탭→포커스, 빈 곳 탭→홈/닫기.
- 편집: `편집` 탭 → 키보드 위로 패널 떠오름 → 이름 수정.
- 자식 추가: `+ 자식` → 키보드 완료/return 키로 추가.
- 되돌리기/다시 버튼 동작·비활성 상태.
- Nav 360px 수용, 노치/홈바 여백(safe-area).
- `/discover` 워프(다음/뒤로 버튼), `/s/[code]`, 그룹 탐험.
- 랜딩·/why·/login·/groups 레이아웃 안 깨짐.
- 가로로 돌려도 렌더·사용 가능(별도 튜닝 없음 — D2).

- [ ] **Step 3: (선택) PROGRESS.md에 세션 기록 추가**

repo 관행대로 `PROGRESS.md` §0 상단에 모바일 대응 세션 한 항목 추가.

---

## 부록 B (deferred): 근접 구제 (near-miss rescue)

> U9 도그푸드에서 작은 바디 탭이 답답할 때만 실행. v1 범위 아님.

히트영역을 **키우지 않고**(겹침 회피), 빈 공간 탭일 때만 최근접 바디로 스냅:

- 순수함수 `nearestBodyAtTap({ x, y }, candidates, thresholdPx)` — 후보(레지스트리의 바디 월드좌표를 화면 투영)들 중 탭 지점에서 가장 가까운 중심 1개가 임계 안이면 그 id, 아니면 null. → vitest.
- `app/scene/index.tsx`·`PublicScene.tsx`의 `onPointerMissed`에서: 정확한 탭은 그대로(바디가 직접 잡힘), **빈 탭일 때만** `nearestBodyAtTap` 호출 → 있으면 `setFocus(id)`, 없으면 기존대로 `setFocus(null)`.
- 후보 좌표원: `app/scene/store/body-mesh-registry.ts`. 화면 투영은 카메라 + canvas 크기.
- 결과: 정확한 탭이 항상 우선, 겹치는 충돌체 0 → 오선택 구조적 차단. 명백히 빈 곳 탭은 닫기 유지.
