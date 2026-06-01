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

**현재 상태 (2026-06-01)**: **🎉 M3 (Auth + 백엔드) 전 슬라이스 완료 (#24~#27 머지, PR #28~#31).** M2 전 슬라이스 완료(PR #14~#23). M3 eng-review 통과(D1~D9 락인). M3-1 인증(#28) · M3-2 클라우드 저장/복원(#29) · M3-3 공개 토글+공유 링크(#30) · M3-4 랜덤 공개 쿼리(#31). 마이그 0001~0003 적용. RLS 게이트 전부 통과. **다음 = M4 (탐험)** — `/discover` UI + 랜덤 넘겨보기 + sphere 간 카메라 워프 + 세션 히스토리. ⚠️ cold-start 공개 풀 빔(D4) → M4에서 데모 sphere 시딩/넛지 선행.

**다음에 가장 먼저 할 일** (M2 Phase 1 킥오프 — 전부 완료):
1. ✅ `/plan-ceo-review` — **DONE 2026-05-25**, SELECTIVE EXPANSION, Undo/Redo 추가. CEO plan: `~/.gstack/projects/gilmin-tous/ceo-plans/2026-05-22-m2-local-crud.md`
2. ✅ `/grill-with-docs` — **DONE 2026-05-26**, `CONTEXT.md`(Universe/Body/Self/Orbit/Focus) + `docs/adr/0001-orbital-metaphor.md` 생성
3. ✅ `/to-prd` — **DONE 2026-05-26**, [PRD] M2 = [issue #5](https://github.com/gilmin/tous/issues/5) (ready-for-agent). 테스트 대상 1/3/4 확정
4. ✅ `/to-issues` — **DONE 2026-05-27**, milestone `M2`(#1) + 8개 슬라이스 #6~#13 발행
5. ✅ `/plan-eng-review` — **DONE 2026-05-28**, ADR-0002 작성, 7개 결정 락인, 신규 슬라이스 #5.5/#5.6 신설. Eng review test plan: `~/.gstack/projects/gilmin-tous/gilmin-main-eng-review-test-plan-20260528.md`
6. ✅ **#5.5 scene split** — **DONE 2026-05-28**, PR #14 merged (`d7b5009`). scene.tsx → app/scene/ 11개 모듈
7. ✅ **#5.6 vitest 셋업** — **DONE 2026-05-28**, PR #15 merged (`7da6e70`). 7 smoke tests passing
8. ✅ **#6 (M2-1) 영속 store** — **DONE 2026-05-28**, PR #16 merged (`f595e07`). zustand+zundo+immer 도입, `FocusContext` 삭제, `useSphereStore` 단일 source, 100ms throttle persist, 손상 JSON·version mismatch fallback, 8개 store/persist unit test. mesh registry로 focus position을 store 밖에 유지(D5).
9. ✅ **#7 (M2-2) 이름 편집 + mode 기계** — **DONE 2026-05-31**, PR #17 merged (`e8423b5`). `tree-ops.editBody` 순수 함수(구조 공유 유지), store `editBody` 액션(immer in-place), `setFocus(null)→mode=normal` 불변식, `key-reducer.ts` 신규(NORMAL/EDIT 계약 — EDIT은 Enter/ESC만 exit-edit, 나머지 noop), FocusPanel `[편집]` + autoFocus input, Scene 전역 keydown을 keyReducer 디스패치로 교체, `onPointerMissed` EDIT 가드. vitest 36/36 (tree-ops 6, key-reducer 9, store 11).
10. ✅ **#8 + #11 머지 완료 (PR #18, #19).**
    - ✅ **#8 (M2-3) 자식 추가** — PR #19 merged (`5ee5a65`). orbit-gen(djb2)+addChild+childSize+ADD mode+FocusPanel `[+ 자식]`. vitest 53/53.
    - ✅ **#11 (M2-8) hover 폴리쉬** — PR #18 merged (`8d71289`). OrbitingBody 단독(5% lerp scale + 라벨 즉시). vitest 36/36.
11. ✅ **#9 (M2-4) 삭제 + Self 가드** — PR #20 merged (`5553195`). `tree-ops.deleteBody`(자손 통째 제거, 구조 공유, root/missing은 동일 ref), store `deleteBody` 액션(immer splice + Self id 거부 + 삭제된 focus 해제/lastFocused 보정), FocusPanel `[삭제]` 버튼(Self일 때 미렌더 — 2중 방어). vitest 64/64 (tree-ops deleteBody 7, store deleteBody 4).
12. ✅ **#10 (M2-5) 키보드 nav** — PR #21 merged (`5e95d02`). `tree-ops.flattenDFS`(pre-order, Self=idx 0) + `nextBodyId`/`prevBodyId`(circular; null/missing current는 끝에서 시작). key-reducer NORMAL ←/→ → nav-prev/nav-next. store `focusNext`/`focusPrev`(helper 래핑, NORMAL 유지). Scene preventDefault로 페이지 스크롤 차단. vitest 73/73.
13. ✅ **#12 (M2-6) Undo/Redo + 슬라이더 coalesce** — PR #22 merged (`6d759eb`). temporal에 **`equality: (a,b)=>a.tree===b.tree`** 추가(immer가 focus/nav 시 tree ref 보존 → 구조 변경만 추적; 기존 shell은 equality 없어 모든 setState가 중복 entry 남기던 버그 수정). `handleSet` coalesce + `beginSliderCoalesce`/`endSliderCoalesce`(드래그 첫 tick만 기록). key-reducer Cmd/Ctrl+Z→undo, Cmd+Shift+Z·Ctrl+Y→redo. Scene이 `useSphereStore.temporal.getState().undo/redo` 호출. 히스토리는 메모리 전용(리로드 시 비워짐). vitest 81/81.
14. ✅ **#13 (M2-7) 외형 편집** — PR #23 merged (`3e8531e`). FocusPanel EDIT 폼에 `AppearanceControls` 추가: 크기·자전·공전 range 슬라이더(드래그→coalesce, 공전은 궤도 있는 Body만), 모양 `<select>` PLANET_SHAPES 20종, 색 `<input type=color>`(cosmic 전용 — mono는 size 파생이라 dead control). 모두 `editBody`로 흐름. vitest 82/82, next build clean.
15. ⬜ `/plan-design-review` — hydration flash, cosmic 폴리쉬, label length cap (선택)
16. ⬜ **M2 전체 QA dogfood** — 외형 편집·nav·undo는 시각/인터랙션 검증 필요 (`/qa`)
17. ✅ **M3 eng-review** — **DONE 2026-06-01.** 9개 결정(D1~D9) 락인. test plan: `~/.gstack/projects/gilmin-tous/gilmin-main-eng-review-test-plan-20260601.md`
18. ✅ **M3 `/to-issues`** — **DONE 2026-06-01.** milestone `M3`(#2) + 슬라이스 #24~#27 발행(ready-for-agent)
19. ✅ **#24 (M3-1) 로그인/로그아웃** — **DONE 2026-06-01, PR #28 머지 (`f81402c`).** HITL 프로비저닝 완료(Supabase 프로젝트 `lrfucciojxrqctfswduk` + Google/GitHub OAuth 앱 + provider 활성화 + Redirect URL). `@supabase/ssr` browser/server 분리(`lib/supabase/`), `proxy.ts`(세션 갱신, getUser), `/login`(signInWithOAuth), `/auth/callback`(코드→세션 교환), `/me`(서버 게이팅 + 로그아웃 server action), Nav "내 우주". 실브라우저 OAuth 검증 완료. vitest 82/82.
20. ✅ **#25 (M3-2) 클라우드 저장/복원** — **DONE 2026-06-01, PR #29 머지 (`e57ede3`).** `spheres` 테이블(JSONB `tree` blob + owner_id FK·unique + is_public default false + short_code nullable + node_count + created/updated_at), owner-only RLS 4개 + updated_at 트리거(search_path 하드닝). `lib/sphere/serialize.ts`(`countNodes`=flattenDFS 재사용, D8) + 라운드트립 테스트. `app/me/SphereSync.tsx` 로컬 우선 sync(로드 maybeSingle→하이드레이트/seed, 디바운스 1.5s `upsert(onConflict owner_id)`, 언마운트 flush). `/me` → Scene 풀스크린 클라우드 편집기. vitest 85/85. 🚩 **RLS 4종 머지 게이트 통과**(음성 대조로 false-green 배제, 데이터 롤백 확인). **남은 HITL**: 실브라우저 편집→복원 왕복 데모(코드·DB·RLS 검증 완료, UI 왕복만 미확인).
21. ✅ **#26 (M3-3) 공개 토글+공유 링크** — **DONE 2026-06-01, PR #30 머지 (`4fbe25d`), 데모 확인.** 마이그 0002(`is_flagged` + 공개읽기 RLS `is_public AND NOT is_flagged`, anon+authenticated, owner-select와 permissive OR). `lib/sphere/short-code.ts` `generateShortCode()` 8자 base62(crypto)+단위테스트, 충돌 23505 재시도는 PublishToggle update 루프. **store 주입 리팩터**(`app/scene/store/scene-store-context.tsx`: SceneReadState, context 기본값=싱글톤 → 편집 경로 무변; System/OrbitingBody/CameraController/FocusRing가 `useSceneStore`). `app/scene/PublicScene.tsx`(read-only store로 Scene 재사용) + `app/s/[short_code]/page.tsx`(anon fetch, 비공개/flagged/없음 404). `app/me/PublishToggle.tsx`(공개 토글, short_code 발급·재사용, 링크 복사; unpublish는 short_code 보존). vitest 87/87. 🚩 **RLS 게이트 통과**(owner 3 + 익명 공개읽기/flagged 2, 음성 대조).
22. ✅ **#27 (M3-4) 랜덤 공개 sphere 쿼리** — **DONE 2026-06-01, PR #31 머지 (`f80f649`).** 마이그 0003: `random_public_sphere()` — TABLESAMPLE bernoulli(1) 1차 + not found fallback, 필터 `is_public AND NOT is_flagged AND node_count>=3`, security invoker + search_path 하드닝 + anon/authenticated execute. `lib/sphere/random-public.ts` `getRandomPublicSphere(client)` rpc 래퍼(빈 풀/에러 null). UI 없음(M4). SQL 검증(anon 40회, eligible만 반환, small001 노드부족 제외 입증, 음성 대조). **M3 완료.**

### M3 이슈 맵 (milestone M3 = #2)

| 이슈 | 슬라이스 | 유형 | blocked by | 레인 |
|---|---|---|---|---|
| ✅ #24 | M3-1 로그인/로그아웃 (Supabase+@supabase/ssr OAuth) — PR #28 머지 | 🙋 HITL(프로비저닝) | — | A |
| ✅ #25 | M3-2 내 sphere 클라우드 저장/복원 (JSONB+주인 RLS+local-first sync) ⭐핵심 — PR #29 머지 | 🤖 AFK(RLS 게이트 ✅) | #24 | 합류 |
| ✅ #26 | M3-3 공개 토글+공유 링크 (short_code+/s/[code]+공개읽기 RLS+anon) — PR #30 머지 | 🤖 AFK(RLS 게이트 ✅) | #25 | 합류 |
| ✅ #27 | M3-4 랜덤 공개 sphere 쿼리 (tablesample, M4 토대) — PR #31 머지 | 🤖 AFK·선택 | #26 | — |

**🚩 RLS 머지 게이트**: #25(주인 CUD/타인 차단), #26(익명 4종) 통합 테스트 통과 후에만 머지.

### M3 eng-review 락인 결정 (2026-06-01)

| # | 결정 | 근거 |
|---|---|---|
| D1 | M3을 M3-1~M3-6으로 슬라이스 + 데이터 모델 선해결 | 본질적 복잡도, 점진 |
| D2 | **JSONB 트리 blob** (`spheres.tree`) — 평면 nodes 테이블 안 씀 | 변환 레이어 0, RLS 단순, 색·모양 직접값 보존. ⚠️ 설계문서의 평면+seed 모델은 폐기(M2 구현이 hex/shape 직접값) |
| D3 | **로컬 우선 + debounce 백그라운드 동기화** | M2 즉각 UX·오프라인 유지. store `partialize:{tree}` 재사용, 평행 직렬화 금지 |
| D4 | **기본 비공개 + 명시적 공개 토글** | 프라이버시 우선. ⚠️ cold-start 공개 풀 비어있음 → M4 숙제(데모 시딩/넛지) |
| D5 | `@supabase/ssr` (browser/server 분리 + middleware 세션갱신), Google+GitHub OAuth | [Layer 1] 현재 표준 |
| D6 | blob 안 root id는 `"self"` 유지. `spheres.id`=별도 uuid. 노드 id=crypto.randomUUID(M2 그대로) | 변경 최소 |
| D7 | `short_code`=8자 base62, unique 제약 + 충돌 재생성 | URL용 |
| D8 | `node_count`는 sync가 스냅샷 푸시 시 blob에서 계산해 기록. M4 필터 `>=3` | 트리거보다 단순 |
| D9 | 익명 읽기 클라이언트(anon key) M3 셋업, `/discover` UI는 M4. 랜덤쿼리 `tablesample bernoulli(1)` | [Layer 1] M4 토대 |

**🚩 CRITICAL: RLS 4종 머지 게이트** — 익명→공개 읽기 OK / 익명→비공개 차단 / 주인 CUD / 타인 수정 차단. 통합(pgTAP/SQL) 테스트 통과 후에만 스키마 슬라이스 머지.

**M3 슬라이스 + 병렬 레인**:
- Lane A: M3-1(Supabase+`@supabase/ssr` 클라이언트 셋업) → M3-2(Auth/OAuth)
- Lane B: M3-1 → M3-3(spheres 스키마+RLS) → {M3-5(공개토글+short_code+`/s/[code]`), M3-6(익명읽기+랜덤쿼리)}
- 합류 후: M3-4(local-first sync 레이어 — auth+스키마 둘 다 필요)

**다음 세션 시작 시 읽을 것**:
- `PROGRESS.md` (이 파일)
- **🎉 M3 완료. 다음 = M4 (탐험).** M4 진입 전 `/plan-eng-review` 재실행 권장(카메라 워프·세션 히스토리 설계). M4 = `/discover` UI + 랜덤 공개 sphere 넘겨보기 + sphere 간 카메라 워프 트랜지션 + 뒤로가기 히스토리
- **M4 빌딩블록 이미 있음**: `lib/sphere/random-public.ts`(`getRandomPublicSphere`) · `app/scene/PublicScene.tsx`(read-only 뷰 — 랜덤 tree 먹이면 됨) · `app/scene/store/scene-store-context.tsx`(store 주입 — 워프는 provider/tree 교체)
- ⚠️ **M4 선행 숙제**: 기본 비공개(D4)라 공개 풀이 비어 `getRandomPublicSphere`가 null → 데모 sphere 시딩 또는 온보딩 넛지 먼저
- `supabase/migrations/` — `0001_spheres.sql`(스키마+owner RLS) · `0002_public_read.sql`(is_flagged+공개읽기 RLS) · `0003_random_public_sphere.sql`(랜덤 RPC). 컬럼: node_count·is_public·is_flagged·short_code
- `supabase/tests/` — `rls_spheres.sql`(RLS 게이트) · `random_public_sphere.sql`(랜덤 검증). 패턴: self-rollback DO 블록 + role 전환(reset+set local) + 음성 대조
- test plan: `~/.gstack/projects/gilmin-tous/gilmin-main-eng-review-test-plan-20260601.md`
- Supabase 프로젝트 id `lrfucciojxrqctfswduk`, env는 `.env.local`(gitignore)·템플릿 `.env.example`. **Supabase MCP는 OAuth 인증 필요(세션마다 만료 가능)** — 마이그레이션/SQL 적용 시 재인증

**현재 브랜치**: `main` 최신 (`f80f649`). 오픈 PR 없음. **M2 #6~#13 + M3 #24~#27 closed.** PR #14~#23, #28~#31 머지 완료. **M3 전 슬라이스 완료.**
**HITL 검증**: #25·#26 실브라우저 데모 확인 완료. #27은 UI 없어 SQL 검증으로 충분.
**참고**: worktree 에이전트는 샌드박스 쓰기 차단 → 다음 병렬 작업 시 브랜치 직접 생성 방식 사용. 단 #10/#12/#13은 직렬이라 병렬 불가.
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
✅ /plan-eng-review       (M2 진입 전 — ADR-0002, D1~D7 락인. M3 진입 전 재실행 예정)
🟡 구현                   (M1·M1.5·M2 완료, M3 미개시)
⬜ /plan-design-review    (mono 테마 굳어지면 visual 리뷰 — 선택)
⬜ /qa / /qa-only         (M2 전체 동작 QA — 다음)
⬜ /land-and-deploy       (배포)
```

**관찰**: `gh` CLI 설치 완료(gilmin 인증) → PR 생성·머지 자동화 가능. 워크플로: 슬라이스마다 `feat/*` 브랜치 직접 생성 → 구현+테스트 → `gh pr create` → 사용자가 머지 → main 동기화 후 다음.

---

## 4. Active

> **M2 완료 (2026-06-01).** 아래 체크리스트는 완료 기록으로 보존. 다음 Active는 M3 (Supabase) — 시작 시 `/plan-eng-review`부터.

### M2 — Local CRUD + Interaction Variety ✅ DONE (2026-05-20 ~ 2026-06-01)

**설계 문서**: `~/.gstack/projects/gilmin-tous/gilmin-main-design-20260520-174056.md` (APPROVED, quality 9/10)

Phase 1 킥오프 체크리스트:
- [x] `/office-hours` — M2 design doc APPROVED (7개 premise, 3개 알고리즘 계약, 8개 success criteria)
- [x] `/plan-ceo-review` — **DONE 2026-05-25**, SELECTIVE EXPANSION (1/6 accepted), 13개 결정 락인
- [x] `/grill-with-docs` — **DONE 2026-05-26**, `CONTEXT.md` + ADR-0001 생성. 도메인 명사 5개(Universe/Body/Self/Orbit/Focus) 락인, 용어 충돌 3건 해소
- [x] `/to-prd` — **DONE 2026-05-26**, [issue #5](https://github.com/gilmin/tous/issues/5) (ready-for-agent). 모듈 6개 분해, 테스트 대상 1/3/4(tree-ops·persistence·interaction-logic) 확정
- [x] `/to-issues` — **DONE 2026-05-27**, milestone `M2`(#1) + 8개 vertical-slice 이슈 발행 (아래 맵)
- [x] `/plan-eng-review` — **DONE 2026-05-28**, ADR-0002 작성. 7개 결정(D1~D7) 락인. #6 shipping gate 해제, 단 #5.5/#5.6 mechanical PR 두 개 사전 직렬.
- [ ] `/plan-design-review` — hydration flash + cosmic 폴리쉬 (선택)

### M2 이슈 맵 (milestone M2 = #1, parent PRD = #5)

| 이슈 | 슬라이스 | 유형 | blocked by | 병렬 lane |
|---|---|---|---|---|
| ✅ #5.5 | scene.tsx → app/scene/ mechanical 분할 (PR #14) | mechanical | — | — |
| ✅ #5.6 | vitest 설치 + config + smoke (PR #15) | mechanical | — | — |
| ✅ #6 | M2-1 영속 store 기반 (PR #16) | HITL | — | 직렬 |
| ✅ #7 | M2-2 이름 편집 + mode 기계 (PR #17) | AFK | #6 | 직렬 |
| ✅ #8 | M2-3 자식 추가 (orbit 자동생성, ADD mode, size clamp) — branch `feat/m2-3-add-child` | AFK | #7 | store/FocusPanel/tree-ops CRUD 표면 선점 |
| ✅ #11 | M2-8 hover 폴리쉬 — branch `feat/m2-8-hover-polish` | AFK | #6 | **진짜 병렬** (`OrbitingBody.tsx` 단독) |
| ✅ #9 | M2-4 삭제 + Self 가드 (PR #20) | AFK | #7, #8 | — |
| ✅ #10 | M2-5 키보드 nav (DFS 순환, PR #21) | AFK | #7·#8·#9 | — |
| ✅ #12 | M2-6 Undo/Redo (temporal equality + coalesce, PR #22) | AFK | #7·#8·#9 | — |
| ✅ #13 | M2-7 외형 편집 (크기·속도·모양·색, PR #23) | AFK | #7·#12 | — |

**M2 완료. #6~#13 전부 closed, PR #14~#23 머지.**

테스트 대상: tree-ops(#7·#8·#9), persistence(#6), interaction-logic(#7·#10), orbit-gen + djb2(#8). R3F component test 없음 (D12 락인).

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

### M3 — Auth + 백엔드 ✅ DONE (2026-06-01, PR #28~#31)
- **인증(M3-1, #28)**: Supabase `@supabase/ssr` OAuth(Google/GitHub), 세션 proxy, `/login`·`/auth/callback`·`/me` 게이팅.
- **클라우드 저장/복원(M3-2, #29)**: `spheres` JSONB tree blob(D2) + owner-only RLS + local-first debounce sync(`SphereSync`, D3). node_count는 push 시 계산(D8). 마이그 0001.
- **공개 토글+공유(M3-3, #30)**: `is_flagged` + 공개읽기 RLS(`is_public AND NOT is_flagged`). short_code 8자 base62(앱측 생성+충돌 재시도, D7). store 주입 리팩터(`scene-store-context`)로 Scene을 read-only 재사용 → `PublicScene` + `/s/[short_code]`. `PublishToggle`. 마이그 0002.
- **랜덤 쿼리(M3-4, #31)**: `random_public_sphere()` TABLESAMPLE bernoulli(1)+fallback, 필터 `is_public AND NOT is_flagged AND node_count>=3`(D9). `getRandomPublicSphere` 헬퍼. 마이그 0003.
- **RLS 게이트**: owner CUD/타인 차단 + 익명 공개읽기/비공개·flagged 차단 — self-rollback SQL + 음성 대조 전부 통과. security advisor clean.
- **테스트**: vitest 87개(+serialize, short-code). DB 로직은 `supabase/tests/` SQL 검증.

### M2 — Local CRUD + Interaction Variety ✅ DONE (2026-06-01, PR #14~#23)
- **상태 기반**: zustand + `persist(temporal(immer(...)))`. `useSphereStore` 단일 source, `FocusContext` 삭제. localStorage `tous:sphere:v1`, 100ms throttle, 손상·version mismatch → SYSTEM fallback. mesh registry로 focus position을 store 밖에 유지.
- **CRUD**: 이름 편집(editBody, 구조 공유) · 자식 추가(orbit djb2 자동생성, size clamp) · 삭제(자손 통째, Self 가드 2중) — FocusPanel EDIT/ADD 폼.
- **mode 기계**: `key-reducer.ts` 순수 디스패처 — NORMAL/EDIT/ADD. "mode가 키보드 독점" 원칙(edit/add는 input이 모든 키 점유).
- **키보드 nav**: ←/→ DFS pre-order 순환(`flattenDFS`+`next/prevBodyId`).
- **Undo/Redo**: temporal `equality: a.tree===b.tree`(구조 변경만 추적) + 슬라이더 coalesce(`begin/endSliderCoalesce`). Cmd/Ctrl+Z, Cmd+Shift+Z·Ctrl+Y.
- **외형 편집**: 크기·자전·공전 슬라이더 + 모양 20종 드롭다운 + 색 picker(cosmic).
- **hover**: OrbitingBody scale 5% lerp + 라벨 즉시.
- **테스트**: vitest 82개 (tree-ops, key-reducer, sphere-store, orbit-gen). R3F 컴포넌트 테스트 없음(D12).

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

- ✅ ~~`gh` CLI 미설치~~ — 설치+인증 완료(`C:\Program Files\GitHub CLI\gh.exe`, gilmin). PR 생성·머지 CLI로 가능.
- **deprecation 경고**: `THREE.Clock` deprecated → THREE.Timer (R3F 내부 사용, v1에서 무시)
- **`/v/cosmic`의 미니멀 nav 가독성** — Nav가 dark 테마 기준으로 디자인됨, mono에서 살짝 어색할 수 있음 (보고 결정)
