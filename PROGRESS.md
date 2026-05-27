# Progress

> 세션 간 컨텍스트 유지용 마일스톤 추적 파일. **새 세션 시작 시 가장 먼저 읽을 것.**
> 이 파일 + CLAUDE.md만 읽으면 같은 방향으로 이어갈 수 있도록 작성한다.

---

## 0. Read First (next-session onboarding)

**Project**: `tous` — 개인의 생각/철학을 3D 태양계로 시각화하고, 낯선 타인의 sphere를 탐험하며 "다양한 개인"을 체감하게 하는 플랫폼.

**Vision (한 줄)**: SNS의 획일화에 대한 정반대 경험 — 자기 자신을 보여주는 거울이자, 타인의 내면을 들여다보는 창문.

**전체 설계 문서 (저장소 밖)**:
- `~/.gstack/projects/gilmin-tous/rlfal-main-design-20260518-163947.md` — M1 전체 설계, APPROVED
- `~/.gstack/projects/gilmin-tous/gilmin-main-design-20260520-174056.md` — **M2 설계, APPROVED (2026-05-20)**

**다음에 가장 먼저 할 일** (M2 Phase 1 킥오프 계속):
1. ✅ `/plan-ceo-review` — **DONE 2026-05-25**, SELECTIVE EXPANSION, Undo/Redo 추가. CEO plan: `~/.gstack/projects/gilmin-tous/ceo-plans/2026-05-22-m2-local-crud.md`
2. ✅ `/grill-with-docs` — **DONE 2026-05-26**, `CONTEXT.md`(Universe/Body/Self/Orbit/Focus) + `docs/adr/0001-orbital-metaphor.md` 생성
3. ✅ `/to-prd` — **DONE 2026-05-26**, [PRD] M2 = [issue #5](https://github.com/gilmin/tous/issues/5) (ready-for-agent). 테스트 대상 1/3/4 확정
4. ✅ `/to-issues` — **DONE 2026-05-27**, milestone `M2`(#1) + 8개 슬라이스 #6~#13 발행
5. ⬜ `/plan-eng-review` — **shipping gate**. ADR-0002(store factory·해시·id·parentId). #6 이게 막혀 있음 ← **다음**
4. ⬜ `/to-issues` — GitHub milestone `M2` + vertical-slice 이슈 7~8개 (T1~T8 task 참조)
5. ⬜ `/plan-eng-review` — zustand store factory, persist+temporal 결합, ADR-0002. **shipping gate**
6. ⬜ `/plan-design-review` — hydration flash, cosmic 폴리쉬, label length cap

**현재 브랜치**: `main` (PR #1~#4 모두 머지, main 최신)
**gh CLI**: 설치됨 (`C:\Program Files\GitHub CLI\gh.exe`), gilmin 계정 인증 완료

---

## 1. Vision — 다음 세션이 알아야 할 큰 그림

원본 manifesto (사용자가 직접 쓴 글):

> SNS의 발달로 우리는 유례없는 연결성과 편리함을 누리게 됐다. 그러나 끊임없이 올라오는 릴스, 실시간 공유에도 불구하고 우리 대부분은 스크롤에 시간을 쏟으며 소비자로서 존재하는 시간이 늘었다. 연결된 듯하면서도 단절감은 극대화된다. 다함께 유행을 따라가는데 익숙해지면서 개개인의 존재감은 사라지고 취향은 획일화되고 있다. 우리는 모두 같은 것을 본다. 우리는 모두 같은 정답을 말한다. 그 밖에 있는 사람은 새로운 '우리'를 만들거나 배척된다. 하지만 세상은 언제나 인간보다 넓다. `tous`는 각자의 마음 깊은 곳에 묻혀있는 개인을 다시 불러내고, 자기 자신에 대해 더 깊이 이해하고, 다양한 개인이 있음을 실감하고, 더 넓은 세상을 인식하게 돕는다.

**핵심 메타포 (확정)**: 태양계.
- 중심 sphere = "나" (태양)
- 행성 = 1차 개념 (자유, 외로움, 호기심, 두려움 ...)
- 위성 = 2차 개념 (자유→선택, 외로움→관계/고독 ...)
- mindmap의 parent-child를 **orbital 계층**으로 표현 (재귀 깊이 무제한)

**플랫폼 범위 (확정)**: 멀티유저. 회원가입 → 자기 sphere 만들기 → 공개 → 익명 방문자가 랜덤 탐험.
초기에 personal site / discovery-first 모델도 검토했으나 풀 플랫폼 (Approach B) 선택.

---

## 2. 핵심 아키텍처 결정 (재논의 금지 — 바꾸려면 명시적으로)

| 결정 | 내용 | 이유 |
|---|---|---|
| 메타포 | 표면 부착 노드 ❌ → **태양계 orbit 계층** ✅ | "덕지덕지" 회피, 3D 깊이 + 부모-자식 자연스럽게 표현 |
| 입력 | 직접 노드 하나씩 (AI 자동 생성 ❌) | 사용자 의지 명확 |
| 디폴트 테마 | **mono** (무채색 미니멀). cosmic은 `/v/cosmic` 보관 | 형태부터 잡고 비주얼은 나중에 덮어쓰기 — 테마 스위칭 |
| 라벨 가시성 | 거리 기반 fade + 클릭 focus 시 패널 (D 하이브리드) | 정적 둘러보기 + 깊이 읽기 동시에 |
| 변형 시각 | 100노드 × 고폴리 sphere CPU 변형 ❌. v1은 **개별 모양 variant** ✅ (Planet.tsx 카탈로그) | GPU shader displacement 처음 안에서 빠짐 — 더 단순/유연 |
| 모바일 | **v1 제외** (Desktop-only) | drag 충돌 + 시간 절약 |
| 도메인 | 추후 결정 | — |
| 백엔드 | Supabase (Postgres + Auth + RLS), Vercel 배포 | 익명 RLS 필요 |
| 익명 탐험 | RLS `is_public AND NOT is_flagged` 정책으로 anon key 접근 | cold-start 완화 |

---

## 3. gstack 워크플로 위치

```
✅ /office-hours          (설계 문서 작성, 적대적 리뷰 1회, APPROVED — 2026-05-18)
🟡 구현 (지금)            (M1 완료, M1.5 진행, M2 미개시)
⬜ /plan-eng-review       (M2/M3 진입 전 — RLS/익명/랜덤쿼리 락인)
⬜ /plan-design-review    (mono 테마 굳어지면 visual 리뷰)
⬜ /review                (PR 머지 전 diff 리뷰)
⬜ /qa / /qa-only         (전체 동작 QA)
⬜ /ship                  (PR 생성·푸시 — 지금은 gh CLI 부재로 수동)
⬜ /land-and-deploy       (배포)
```

**관찰**: `gh` CLI 미설치 → PR은 브라우저 URL 한 번 클릭. 향후 `gh` 깔면 `/ship`/`/land-and-deploy` 자동화 가능.

---

## 4. Active

### M2 — Local CRUD + Interaction Variety (Phase 1 킥오프 진행 중, 2026-05-20)

**설계 문서**: `~/.gstack/projects/gilmin-tous/gilmin-main-design-20260520-174056.md` (APPROVED, quality 9/10)

Phase 1 킥오프 체크리스트:
- [x] `/office-hours` — M2 design doc APPROVED (7개 premise, 3개 알고리즘 계약, 8개 success criteria)
- [x] `/plan-ceo-review` — **DONE 2026-05-25**, SELECTIVE EXPANSION (1/6 accepted), 13개 결정 락인
- [x] `/grill-with-docs` — **DONE 2026-05-26**, `CONTEXT.md` + ADR-0001 생성. 도메인 명사 5개(Universe/Body/Self/Orbit/Focus) 락인, 용어 충돌 3건 해소
- [x] `/to-prd` — **DONE 2026-05-26**, [issue #5](https://github.com/gilmin/tous/issues/5) (ready-for-agent). 모듈 6개 분해, 테스트 대상 1/3/4(tree-ops·persistence·interaction-logic) 확정
- [x] `/to-issues` — **DONE 2026-05-27**, milestone `M2`(#1) + 8개 vertical-slice 이슈 발행 (아래 맵)
- [ ] `/plan-eng-review` — zustand store factory + ADR-0002. **#6 이게 막혀 있음 (shipping gate)**
- [ ] `/plan-design-review` — hydration flash + cosmic 폴리쉬

### M2 이슈 맵 (milestone M2 = #1, parent PRD = #5)

| 이슈 | 슬라이스 | 유형 | blocked by |
|---|---|---|---|
| [#6](https://github.com/gilmin/tous/issues/6) | M2-1 영속 store 기반 (SYSTEM→zustand, FocusContext 삭제, fallback, memo) | HITL | eng-review 게이트 |
| [#7](https://github.com/gilmin/tous/issues/7) | M2-2 이름 편집 + mode 기계 도입 | AFK | #6 |
| [#8](https://github.com/gilmin/tous/issues/8) | M2-3 자식 추가 (orbit 자동생성, ADD mode, size clamp) | AFK | #6 |
| [#9](https://github.com/gilmin/tous/issues/9) | M2-4 삭제 + Self 가드 | AFK | #6 |
| [#10](https://github.com/gilmin/tous/issues/10) | M2-5 키보드 nav (DFS 순환) | AFK | #6 |
| [#11](https://github.com/gilmin/tous/issues/11) | M2-8 hover 폴리쉬 | AFK | #6 |
| [#12](https://github.com/gilmin/tous/issues/12) | M2-6 Undo/Redo (temporal + coalesce) | AFK | #7·#8·#9 |
| [#13](https://github.com/gilmin/tous/issues/13) | M2-7 외형 편집 (크기·속도·모양·색) | AFK | #7·#12 |

테스트 대상: tree-ops(#7·#8·#9), persistence(#6), interaction-logic(#7·#10). orbit-gen 별도 테스트 안 함.

### CEO 리뷰 결정 락인 (2026-05-25)

| # | 결정 | 영역 |
|---|---|---|
| D1 | **zustand + persist middleware** (zundo + persist 결합, `persist(temporal(...))`, `partialize: (s)=>({tree, lastFocused})`) | state lib |
| D3 | **Undo/Redo** scope 추가 — Cmd+Z/Cmd+Shift+Z, 50 step, add/edit/delete만 추적, slider drag pause/resume | expansion |
| D5 | **FocusContext 삭제**, 4개 소비자 → `useSphereStore` 직접 구독 | architecture |
| D6 | localStorage `QuotaExceededError` → M3 deferral | architecture |
| D7 | Multi-tab concurrent write → M3 deferral | architecture |
| D8 | 행성 **깊이 무제한** + `size = max(0.05, parent.size * 0.6)` | error map |
| D9 | Add Enter → **자동 NORMAL mode 복귀** (연속 입력 안 함) | UX |
| D10 | Edit mode ←/→ → input 텍스트 커서만 (DFS nav 비활성) | UX |
| D11 | Edit mode Cmd+Z → input 텍스트 undo만 (트리 undo 비활성) | UX |
| D12 | **vitest** + store/순수 함수 unit test (R3F component test 안 함) | test setup |

**원칙**: "mode가 키보드 독점" (D10/D11/D9 공통) — edit/add mode에서는 input이 모든 키 점유, ESC로 나가야 글로벌 nav 활성.

### Implementation Tasks (T1~T8)

CEO plan 참조. P1 5개 (re-render 최적화, inner_core 가드 테스트, 손상 fallback 테스트, size clamp, mode keyboard 계약). P2 3개 (slider coalesce, add Enter 자동 복귀, dfs helper). 7~8개 vertical slice issue로 분해 가능.

### Eng Review로 넘기는 핵심 노트

1. **Re-render 최적화 필수**: `OrbitingBody`에 `React.memo` + 노드별 zustand selector. body prop → id로 변경 후 컴포넌트 내부에서 store 구독.
2. **Slider history coalesce 범위**: slider(size·속도)만 pause/resume 필요. shape 드롭다운·color picker는 single-event라 coalesce 불필요. ADR-0002에서 필드별 명시.
3. **잔여 temporal interrogation 7개**: id 생성(crypto.randomUUID), parentId 필드 필요?, immer vs spread, 재클릭 no-op 위치, color picker 구현, hash 함수(djb2/FNV-1a/MD5), reducer 단위테스트 entry.

**M2 핵심 결정 (확정)**:
- 노드 추가: focus 패널 → `[+ 자식]` → 이름 입력 → orbit param 자동 생성
- 노드 편집/삭제: focus 패널 3버튼 (편집·+자식·삭제). Self는 삭제 버튼 미렌더 + reducer 차단
- 키보드 nav: ←/→ DFS pre-order, circular (sun ↔ 마지막)
- hover: scale 5% + label 즉시 (M2 포함)
- localStorage: 키 `tous:sphere:v1`, JSON 손상 시 SYSTEM fallback
- 예상 기간: 7~8일 human / 1.5~2일 CC

### M1.5 — 행성 다양성 패스 ✅ DONE (2026-05-20, PR #1~#4 머지)

**20개 모양 카탈로그**: smooth, pebble, lumpy, potato, oblong, kidney, dimpled,
cratered, fissured, rippled, facet, crystal, ringed, banded, doubleRing,
tentacle, spike, finned, conjoined, cluster.

**현재 매핑 (의미 → 모양)**:
- 나 (태양) → `smooth`
- 자유 → `cluster` (흩어진 덩어리)
- 선택 → `smooth` (작은 매끄러운 위성)
- 외로움 → `oblong` (길쭉한 비대칭)
- 관계 → `conjoined` (두 덩어리 연결)
- 고독 → `crystal` (작고 날카로운 결정)
- 호기심 → `tentacle` (사방으로 뻗어나가는)
- 두려움 → `cratered` (패인 자국)

**새 행성 추가 시**: `OrbitalBody`에 `shape: "..."` 한 줄만. 지정 안 하면 `"smooth"`.

---

## 5. Done

### M1 — 3D 솔라시스템 마인드맵 + 포커스 모드 (2026-05-19)
- 재귀 `OrbitingBody` (sun → planets → moons, 임의 깊이)
- 마우스 X 회전 lerp (`IDLE_ROTATION_SPEED=0.05, MOUSE_INFLUENCE=2.5, LERP_FACTOR=0.08`)
- 클릭 포커스 모드, ESC/빈공간 해제
- 부모-자식 연결선, 거리 기반 라벨 페이드
- 테마 2종: minimal (`/`), cosmic (`/v/cosmic`)
- Commit: `2983287`

### M0 — 프로젝트 스캐폴드 (2026-05-18)
- Next.js 16.2.6, React 19.2.4, Tailwind v4 (App Router, TypeScript, no src dir, no ESLint)
- @react-three/fiber 9.6.1, drei 10.7.7, three 0.184
- CLAUDE.md에 gstack routing rules + 코딩 가이드라인 (Karpathy 기반)
- Commit: `18315e4`

---

## 6. Backlog (설계 문서 기준 마일스톤)

> 자세한 명세는 `~/.gstack/projects/gilmin-tous/rlfal-main-design-*.md` 참조.

- **M2 — Local CRUD + 인터랙션 다양성** (2~2.5주차 예상)
  - 노드 추가/삭제/편집 UI (이름 → 부모 선택 → orbit params 자동 계산 또는 입력)
  - localStorage 저장 (백엔드 없이 작동)
  - 덩어리 hover 인터랙션 강화 (현재는 fade만, 살짝 강조/떨림 등)
  - Self (루트 Body) 삭제 불가 enforce

- **M3 — Auth + 백엔드** (3.5주차)
  - Supabase 셋업 + 마이그레이션
  - Google/GitHub OAuth
  - 데이터 모델 (spheres, nodes, orbital params 컬럼 — 설계 문서 §데이터 모델 참조)
  - RLS 정책 (익명 SELECT public, owner INSERT/UPDATE/DELETE)
  - `is_public` 토글
  - node_count 트리거

- **M4 — 탐험** (4.5주차)
  - 익명 클라이언트로 public sphere fetch
  - 랜덤 sphere 쿼리 (`tablesample bernoulli(1)` 전략)
  - sphere 간 카메라 워프 트랜지션 (4a: scene swap → 4b: 줌 애니메이션 → 4c: 에러 케이스)
  - 세션 히스토리 (`/discover` back)

- **M5 — 폴리시 + 배포** (5~6주차)
  - InstancedMesh로 노드 렌더링, sphere LOD
  - 첫 진입 온보딩
  - 모바일 v1 제외 명시
  - 성능 측정 + 튜닝 (목표: M1 MacBook Air iGPU 60fps median, 30fps p95, 100노드, 1080p)

---

## 7. 외부 디자인 작업 통합 로그

| 날짜 | 출처 | 가져온 것 | 결과 |
|---|---|---|---|
| 2026-05-19 | Claude Design 번들 `oyZF9xRlnHVlEyOOAy3zcg` | `app/_components/Planet.tsx` (20 shapes + `<PlanetMesh>`), `scene.tsx`에 `shape?` 필드 연결 | tsc 통과, 시각 검증 대기 |

**다음 외부 가져오기 시**: 이 표에 한 줄 추가 + Active 섹션에 체크리스트로 정리.

---

## 8. 알려진 미해결 사항

- **`gh` CLI 미설치** — PR 생성·머지 자동화 안 됨. 브라우저 URL 또는 `winget install GitHub.cli` 권장
- **deprecation 경고**: `THREE.Clock` deprecated → THREE.Timer (R3F 내부 사용, v1에서 무시)
- **`/v/cosmic`의 미니멀 nav 가독성** — Nav가 dark 테마 기준으로 디자인됨, mono에서 살짝 어색할 수 있음 (보고 결정)
