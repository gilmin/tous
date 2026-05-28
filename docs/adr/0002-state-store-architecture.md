# 0002 — M2 상태 저장소 아키텍처

**상태**: ACCEPTED (2026-05-28, `/plan-eng-review`)
**관련**: ADR-0001 (orbital metaphor), CEO plan 2026-05-22 (M2 local CRUD)
**대체**: M2 design doc Open Questions, CEO plan §"Open Questions for /plan-eng-review"

## 결정 요약

M2 상태를 단일 zustand store로 관리한다. 세 미들웨어를 결합한다: `persist(temporal(immer(...)))`. `FocusContext`는 제거한다. Body id는 `crypto.randomUUID()`로, orbit speed seed는 djb2 hash로 분리한다. focus의 position은 store에 들어가지 않는다.

## 의존성

```json
{
  "dependencies": {
    "zustand": "^5",
    "zundo": "^2",
    "immer": "^10"
  }
}
```

세 라이브러리 모두 5년 이상 검증된 표준. zundo는 zustand 공식 temporal middleware.

## Store factory (코드 템플릿)

```ts
// app/scene/store/sphere-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import type { OrbitalBody } from "../types";
import { SYSTEM } from "../SYSTEM";

type Mode = "normal" | "edit" | "add" | "delete-confirm";

type SphereState = {
  tree: OrbitalBody;
  lastFocused: string | null;
  focusedId: string | null;
  mode: Mode;
  // actions
  addBody: (parentId: string, label: string) => void;
  editBody: (id: string, patch: Partial<OrbitalBody>) => void;
  deleteBody: (id: string) => void;
  setFocus: (id: string | null) => void;
  setMode: (m: Mode) => void;
};

const STORAGE_KEY = "tous:sphere:v1";
const PERSIST_THROTTLE_MS = 100;

let lastWriteAt = 0;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

const throttledStorage = createJSONStorage(() => ({
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    const now = Date.now();
    const elapsed = now - lastWriteAt;
    if (elapsed >= PERSIST_THROTTLE_MS) {
      lastWriteAt = now;
      localStorage.setItem(name, value);
    } else {
      if (pendingTimeout) clearTimeout(pendingTimeout);
      pendingTimeout = setTimeout(() => {
        lastWriteAt = Date.now();
        localStorage.setItem(name, value);
        pendingTimeout = null;
      }, PERSIST_THROTTLE_MS - elapsed);
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}));

export const useSphereStore = create<SphereState>()(
  persist(
    temporal(
      immer((set) => ({
        tree: structuredClone(SYSTEM),
        lastFocused: "self",
        focusedId: null,
        mode: "normal",
        addBody: (parentId, label) => set((s) => { /* ... */ }),
        editBody: (id, patch) => set((s) => { /* ... */ }),
        deleteBody: (id) => set((s) => {
          if (id === "self") return; // Self 보호 (D3)
          /* ... cascade ... */
        }),
        setFocus: (id) => set((s) => { s.focusedId = id; if (id) s.lastFocused = id; }),
        setMode: (m) => set((s) => { s.mode = m; }),
      })),
      {
        // temporal: 어떤 상태 변경을 undo 스택에 추적할지
        // D3: add/edit/delete만 추적. focus/mode 변경은 제외.
        partialize: (state) => ({ tree: state.tree }),
        limit: 50,
      }
    ),
    {
      name: STORAGE_KEY,
      storage: throttledStorage,
      // persist: 디스크에 무엇을 저장할지
      // history(pastStates/futureStates)는 영속화 안 함 — 새로고침 시 undo 초기화.
      partialize: (state) => ({
        tree: state.tree,
        lastFocused: state.lastFocused,
      }),
      version: 1,
      migrate: (persisted, version) => {
        // version mismatch → SYSTEM seed fallback
        if (version !== 1) return { tree: structuredClone(SYSTEM), lastFocused: "self" };
        return persisted as Partial<SphereState>;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[sphere] localStorage 손상, SYSTEM seed로 fallback", error);
        }
      },
    }
  )
);
```

## 핵심 결정

### D1. 미들웨어 wrapping 순서
`persist(temporal(immer(...)))`. immer가 가장 안쪽(set 함수가 producer 형식 받음), temporal이 중간(불변 트리만 스택에 쌓음), persist가 가장 바깥(디스크 직렬화는 최종 상태 기준).

### D2. partialize 이중 명세
- `temporal.partialize: (s) => ({ tree: s.tree })` — undo는 트리만 추적. focus/mode 변경은 Cmd+Z 영향 없음 (CEO plan D3 락인).
- `persist.partialize: (s) => ({ tree, lastFocused })` — 디스크에는 트리 + 마지막 focus만. focusedId/mode/temporal history는 새로고침 시 초기화.

### D3. Body id 생성 = `crypto.randomUUID()`
- 브라우저 빌트인 (Safari 15.4+, Chrome 92+, Firefox 95+). 폴리필 불필요 (desktop-only).
- 36자 opaque 식별자. parent와 무관 → reparenting 미래 기능에 영향 없음.
- M3 Postgres `uuid` 컬럼과 1:1 매핑.

### D4. Orbit speed seed = djb2 hash
- `generateOrbitParams(parentId, N)`의 speed 선택에만 사용.
- `hash = djb2(`${parentId}-${N}`)` → `speeds[hash % 6]` (`speeds = [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5]`).
- 동기 함수, 6줄. MD5(crypto.subtle 비동기)는 generateOrbitParams 동기 컨트랙트와 안 맞음.

```ts
// app/scene/orbit-gen/djb2.ts
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
```

### D5. focus position은 store에 없음
- store: `{ focusedId: string | null, mode: Mode }`.
- 3D position은 매 프레임 `selfRef.current.getWorldPosition()`로 ref에서 직접 읽음. 현재 `OrbitingBody`/`FocusRing`/`CameraController` 패턴 그대로 유지.
- 이유: position을 store에 넣으면 60Hz 공전이 60Hz store write → 모든 selector 재실행 → 30개 행성 모두 매 프레임 재렌더. 60fps 목표 불가.
- 비용: `getBodyMeshById(id)` 헬퍼 약 10줄.

### D6. parentId 필드 추가 안 함
- `OrbitalBody`는 `children: OrbitalBody[]`만 유지. 부모 참조 없음.
- 삭제 시 부모 찾기는 root에서 O(N) DFS. N=100 노드 기준 무시.
- 이유: 트리 구조 유지가 immer 구조 공유와 자연스럽게 결합. parentId 추가시 mutation마다 양방향 갱신 필요.

### D7. 재렌더 최적화 = immer + React.memo + per-node selector
- `OrbitingBody`는 `id: string` prop만 받음.
- 내부에서 `useSphereStore((s) => selectBodyById(s.tree, id))` 구독.
- immer의 structural sharing 덕에 변경되지 않은 subtree는 ref 동일 → selector가 동일 ref 반환 → React.memo가 재렌더 skip.
- React.memo 단독으로는 부족. zustand 기본 spread는 매번 새 트리 참조.

### D8. localStorage write 100ms throttle
- persist middleware의 storage adapter에서 throttle 구현 (위 `throttledStorage`).
- slider drag 60Hz dispatch → 100ms 간격으로만 디스크 write → main thread 부담 회피.
- trailing 보장: 마지막 변경 후 100ms 안에 항상 저장.
- zundo의 history pause/resume과 별개 메커니즘 — undo 스택 폭주는 별도로 D3에서 처리.

### D9. FocusContext 완전 제거
- 4개 소비자 (FocusRing, CameraController, OrbitingBody, FocusPanel)는 `useSphereStore` 직접 구독.
- Context provider 계층 제거. Scene.tsx의 `FocusContext.Provider` wrapping 삭제.

### D10. localStorage schema 손상 fallback
- `migrate`: version mismatch → SYSTEM seed.
- `onRehydrateStorage`: JSON parse 실패 또는 missing field → `console.warn` + zustand 자동 init state (SYSTEM seed).
- `lastFocused`가 트리에 없는 id면 store 초기화 시 `focusedId = null`로 강제.

### D11. ID re-generation on seed load
- SYSTEM seed의 id (`"self"`, `"p1"`, `"p1m1"` 등)는 초기 시연용. SYSTEM은 deep clone 후 그대로 사용.
- 사용자가 add한 신규 노드만 `crypto.randomUUID()`. seed 노드는 기존 string id 유지 (Self의 `"self"`는 D3 락인 — 변경 안 됨).

## Considered Options (거부)

- **useReducer + Context** — temporal middleware 동등물 없음, Undo/Redo 직접 구현 필요. 거부.
- **Redux Toolkit** — 코드 라인 4x, Next.js 16 App Router에서 SSR 통합 마찰. 거부.
- **id를 djb2(parentId + seq)로 통합** — id에 parent 정보 인코딩 → 미래 reparenting 불가능. 거부.
- **focus position을 store에 포함** — 60Hz store write → 재렌더 폭주 → 60fps 불가. 거부.

## Consequences

- 새 의존성 3개: zustand, zundo, immer. 번들 +30KB 정도. M2 success criteria(60fps, 30 노드)는 변함없이 달성.
- `FocusContext` 제거로 scene.tsx의 4개 소비자 동시 수정 필요 → #6 PR scope.
- ADR-0001(orbital metaphor)에 영향 없음. orbit param 결정 로직은 D4 djb2만 추가.
- M3에서 Supabase 도입 시: zustand store의 `tree`를 Postgres jsonb 또는 nodes 테이블로 옮김. randomUUID는 그대로 uuid 컬럼에 매핑.
- M3 schema 변경 시 `migrate` 함수에서 v1 → v2 변환 진입점 보장.
