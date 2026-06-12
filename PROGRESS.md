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

**현재 상태 (2026-06-11, 세션 3)**: **🏁 M5-B 세 작업 전부 구현 완료 — 브랜치 `feat/m5b-label-culling` PR 대기.** ① **성능**: `/benchmark`로 prod 임시 100노드 sphere(`/s/perftest`, 수동 SQL Editor 시딩→측정→삭제) headed Chrome(Iris Xe iGPU·1080p) 측정 — **라벨ON 30fps median/20 p95 → 라벨 숨김만으로 59.9/30(목표 도달)**, textShadow 무죄, **병목=drei `<Html>` DOM 라벨 100개 컴포지팅 단독범인, WebGL 무죄 → InstancedMesh·LOD 불필요 판정**. 수정 = `nextLabelVisible` 순수함수(겉보기크기 size/distance, SHOW 0.014/HIDE 0.011 히스테리시스)로 작은/먼 라벨 `<Html>` 언마운트, hover 강제마운트·거리페이드 유지. dev 검증: wanderer 9→4 라벨, 포커스 줌인 시 위성 라벨 재마운트. ② **온보딩**: `OnboardingHint`(페이지별 localStorage 1회, 키→동작 칩 카드) — /discover(워프 키) + /me(편집 키). ③ **모바일 가드**: `MobileGuard`(<768px 안내 + '그래도 볼래요' 세션 해제) — /me·/discover·/s/[code]. vitest 105(+6 label-cull), tsc green(stale `.next` 삭제 후). 리포트 `.gstack/benchmark-reports/2026-06-11-benchmark.md`+baseline.json. ⚠️ 측정 노트: browse headless=SwiftShader라 FPS 무효 — **headed `browse connect` 필수**. **다음 = PR 머지 → prod 배포 후 perftest 재시딩·60fps 최종 검증(선택) → M5 완료 선언.** ↓ 이하 세션2 기록 ↓

**이전 상태 (2026-06-11, 세션 2)**: **🚀 배포 헬스 재검증 완료 + M5-B 미시작(시작 직전 대기).** 다른 데스크탑 작업분(PR #35~#39, 21커밋)을 main으로 fast-forward(`bdcde5c`). `/browse` headless로 prod 라이브 재확인 — `/` 200(랜딩 박동 '나'+탐험 CTA), `/discover` 200(카툰 워프), `/s/wanderer` 200(하트), `/s/zzzznope` 404. 콘솔은 알려진 무해 경고뿐(THREE.Clock deprecation + GPU stall ReadPixels), 네트워크 4xx/5xx 0건. **다음 = M5-B 시작** — 세 작업(성능·온보딩·모바일 가드) **시작 순서 + 성능 접근(측정후 LOD vs InstancedMesh 재설계 vs 보류) 결정 대기 중**(AUQ 던졌으나 사용자가 다음 세션 업그레이드 모델로 미룸). 렌더 구조 파악됨: 재귀 `OrbitingBody`가 노드별 mesh+글로스 sprite+drei `<Html>` DOM 라벨(OrbitingBody.tsx:163) → **진짜 성능 비용은 100노드 DOM 라벨일 가능성, 측정 먼저**. cartoon 방향(shape 20종+패턴+툰 외곽선)이 InstancedMesh와 사실상 비호환. ↓ 이하 세션1 기록 ↓

**이전 상태 (2026-06-11, 세션 1)**: **🚀 M5-A ship-first 배포 라이브 — `https://tous-sigma.vercel.app`.** Vercel(Linux) 빌드, 기존 Supabase `lrfucciojxrqctfswduk`를 prod로 재사용(마이그 0001~0008·RLS·데모5개 유지), env 2개(`NEXT_PUBLIC_*`), Supabase Auth URL Config에 prod 도메인(Site URL + `/auth/callback` + `/**`) 추가. **스모크 전부 통과** — 랜딩·`/discover`·`/s/wanderer` 200·무효코드 404는 headless 확인 / OAuth 로그인·`/me` 저장왕복·`/groups`는 사용자 직접 확인("잘 돼"). 추가로 이 세션: **`/discover` 키보드 focus 이동** 구현 — ←/→ body DFS 순환·Esc 해제(에디터 미러), sphere-back은 `←`→`Backspace`로 이동, Space=다음우주 유지. `focusForKey` 순수헬퍼 + 8테스트(vitest 99). 인터랙티브 동작은 dogfood 검증 예정. 설계/런북: `docs/superpowers/{specs,plans}/2026-06-11-m5-ship-first-deploy*`. ⚠️ **알려진 이슈**: 로컬 `next build`(Windows+Turbopack)가 전 페이지 `workStore` invariant로 깨짐 — **Next 16 프레임워크 버그**(16.2.6·16.2.9 동일, Node24, 앱코드 무관: 트레이스 전부 프레임워크 내부). **Vercel/Linux 빌드는 정상** 확인됨 → Vercel 빌드를 프리플라이트로 사용. `NEXT_DISABLE_TURBOPACK`은 16.2.x에서 무효. tsc green. **다음 = M5-B(폴리시): 성능 튜닝(InstancedMesh는 노드별 모양20종/색과 충돌 → 재설계 필요, LOD/측정), 첫진입 온보딩, 모바일 가드.** 브랜치 `feat/m5-deploy` PR 예정. 상세 §9·§10.

**이전 상태 (2026-06-10)**: **카툰 dogfood + #12 친구 그룹 완성.** 브랜치 `feat/cartoon-direction` (이 세션 작업 전부 누적, origin 푸시 완료 → 사용자 PR 머지 예정). main은 `3e9919b`(M2·M3·M4 완료). 이 세션: (A) **/me 하트 표시**(공개 시 좌상단, HeartButton `side` prop) · (B) **궤도 길이 슬라이더**(hasOrbit, 0.3~8) · (C) **mono 제거 → cosmic 단일**(SceneVariant/variant prop 삭제, `cosmic-env.tsx` 공유, /discover·PublicScene cosmic화, `/v/cosmic`·Nav '미니멀' 삭제, utils는 `getEmissiveSettings`만) · (D) **`/` 유입 랜딩**(박동 '나'+"당신의 우주는 어떤 모양인가요?"+탐험 CTA, 로컬 에디터 제거→제작은 /me, `LandingScene.tsx`) · (E) **`/why` 매니페스토**(랜딩 '절대 누르지 마시오' 버튼) · (F) **/me 버튼 nav 토글 톤+둥근미소** · (G) **#12 친구 그룹 전 슬라이스**(코드 그룹 생성/참여 + 그룹원 비공개 우주 공유 + 그룹 전용 워프 탐험; 마이그 0007·0008, RLS 게이트 2종 통과 — 아래 §10 E 참조). tsc green, vitest 91. **다음 = 두 계정 dogfood(그룹 비공개 공유 실검증) → M5(폴리시+배포).** 상세 §9·§10.

**이전 상태 (2026-06-02)**: **🎉 M4 (탐험) 완료 + 누적 QA 통과.** `/discover` 랜덤 넘겨보기+암전 워프+세션 히스토리 (PR #33). 누적 QA에서 ISSUE-001(/discover 뒤로 버튼) 수정 (PR #34, Health 9/10). main `3e9919b`, 오픈 PR 없음. **다음 = 사용자 직접 dogfood → UI/UX taste 패스 → M5(폴리시+배포).** (자세한 건 아래 §0 끝의 "현재 브랜치" 블록)

**이전 상태 (2026-06-01)**: **🎉 M3 (Auth + 백엔드) 전 슬라이스 완료 (#24~#27 머지, PR #28~#31).** M2 전 슬라이스 완료(PR #14~#23). M3 eng-review 통과(D1~D9 락인). M3-1 인증(#28) · M3-2 클라우드 저장/복원(#29) · M3-3 공개 토글+공유 링크(#30) · M3-4 랜덤 공개 쿼리(#31). 마이그 0001~0003 적용. RLS 게이트 전부 통과. **✅ M4 선행 숙제(cold-start 데모 시딩) 완료** — 마이그 0004 적용, 공개 풀에 데모 sphere 5개(서로 다른 성향: 여행자/만드는 사람/돌보는 사람/질문하는 사람/고요한 사람) 시딩. anon 관점에서 eligible=5, `random_public_sphere()` 다양성 확인. **✅ M4 eng-review 통과 (2026-06-01)** — 4개 결정(D1~D4) 락인, ADR-0003 작성, 구현 태스크 T1~T7 도출. **다음 = M4 (탐험) 구현** — `/discover` UI + 랜덤 넘겨보기 + sphere 간 카메라 워프 + 세션 히스토리. (M4 슬라이스/결정 맵은 아래 §M4 참조)

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

### M4 eng-review 락인 결정 (2026-06-01) — ADR-0003

| # | 결정 | 근거 |
|---|---|---|
| D1 | **지속 Canvas + 트리 교체** — `/discover`가 단일 Canvas/Scene을 들고 보여줄 tree를 discover store에 둠. "다음"=새 tree fetch→줌아웃→tree 교체→줌인. PublicScene이 "바뀌는 tree"를 받도록 소폭 수정(현재 마운트 시 useState 고정) | 설계가 줌 워프(M4b)를 원함. 재마운트는 카메라 끊김 |
| D2 | **RPC에 제외 목록 인자** — 마이그 0005 `random_public_sphere(exclude text[])` + 소진 시 제외 무시 폴백. `getRandomPublicSphere`가 exclude 전달 | 설계 "최근 20개 NOT IN". 5개 풀 중복 회피. tablesample O(N) 회피 유지 |
| D3 | **워프 교체 직전 mesh 레지스트리 `clear()`** | 모든 sphere 루트 id=`"self"` 충돌. 암전 틈 워프라 겹침 없음→clear로 충분. 크로스페이드 원하면 그때 네임스페이스/스코프드 |
| D4 | **홈 `/` 개편은 M4에서 미룸** — `/discover`만 신설 | 홈 개편=랜딩+로그인 분기+온보딩, 별도 슬라이스(CEO 리뷰) |

**M4 구현 태스크** (test plan: `~/.gstack/projects/gilmin-tous/gilmin-main-eng-review-test-plan-20260601-214525.md`, tasks JSONL 동 디렉토리):
- T1(P1) `/discover` 지속 Canvas + store + 다음/back/space — `app/discover/page.tsx`
- T2(P1) PublicScene/store 바뀌는 tree 지원 + 워프 시 registry clear — `app/scene/*`
- T3(P1) 마이그 0005 제외 RPC + 소진 폴백 + `getRandomPublicSphere` 확장
- T4(P1) `lib/discover/history.ts` 순수함수(visited 20 cap·history 10 cap·back·shouldReset) + `history.test.ts` 7케이스
- T5(P2) 카메라 워프 애니메이션(줌아웃→암전→줌인, M4b)
- T6(P2) 에러 케이스(로딩 실패/삭제됨/빈 풀 graceful, M4c)
- T7(P2) `supabase/tests/random_public_sphere_exclude.sql` 2케이스
- **병렬 레인**: Lane A=T3+T7(DB) · Lane B=T4(순수 TS) · Lane C=T1+T2(app/scene). 셋은 모듈 안 겹침→병렬 가능. T5/T6은 T1·T2 이후.

**M4 빌딩블록 이미 있음**: `lib/sphere/random-public.ts`(`getRandomPublicSphere` — D2서 exclude 확장) · `app/scene/PublicScene.tsx`(D1서 tree 교체 지원) · `app/scene/store/scene-store-context.tsx`(`createPublicSphereStore`) · `app/s/[short_code]/page.tsx`(워프 중 history.replace)

**다음 세션 시작 시 읽을 것**:
- `PROGRESS.md` (이 파일) + `docs/adr/0003-discovery-warp-architecture.md` (M4 결정 전문)
- ✅ **M4 선행 숙제 완료**: 마이그 0004로 공개 풀에 데모 sphere 5개 시딩(`getRandomPublicSphere`가 이제 null 안 나옴). 제거하려면 `delete from auth.users where raw_app_meta_data->>'provider'='seed';`(spheres 연쇄 삭제). short_code: wanderer/themaker/caregivr/theseekr/stillone
- `supabase/migrations/` — `0001_spheres.sql`(스키마+owner RLS) · `0002_public_read.sql`(is_flagged+공개읽기 RLS) · `0003_random_public_sphere.sql`(랜덤 RPC) · `0004_seed_demo_spheres.sql`(데모 5개 시딩 — 가짜 auth 유저 5명 FK 앵커). 컬럼: node_count·is_public·is_flagged·short_code
- `supabase/tests/` — `rls_spheres.sql`(RLS 게이트) · `random_public_sphere.sql`(랜덤 검증). 패턴: self-rollback DO 블록 + role 전환(reset+set local) + 음성 대조
- Supabase 프로젝트 id `lrfucciojxrqctfswduk`, env는 `.env.local`(gitignore)·템플릿 `.env.example`. **Supabase MCP 두 종류 중 plugin 버전(`mcp__plugin_supabase_supabase__*`)이 OAuth로 이미 인증돼 동작**(`mcp__supabase__*`는 액세스 토큰 만료). 마이그/SQL은 plugin 쪽으로.
- ⚠️ **이 환경에 `jq` 없음** → `gstack-review-log`/대시보드 바이너리 동작 안 함(부가 기능). JSONL은 node로 생성. bash 툴은 git-bash라 PowerShell here-string(`@'...'@`) 안 먹힘 — 멀티라인은 단일 따옴표.

**현재 브랜치**: `feat/cartoon-direction` (origin 푸시 완료 → **사용자 PR 머지 예정**). 마지막 기능 커밋 `0e64da7`(#12 slice 3). main은 `3e9919b`(M2·M3·M4 완료 + 누적 QA). 카툰 리디자인 + 이 세션 작업(cosmic 단일화/랜딩/`/why`/하트·/me 폴리시/**#12 친구 그룹 전 슬라이스**)이 누적. **머지된 뒤 이 '현재 브랜치' 블록을 main 기준으로 되돌릴 것.**

**M4 탐험 구현 완료 (PR #33, `8198eed`)** = T3 마이그0005 exclude RPC+소진폴백 · T4 `lib/discover/history.ts` 순수함수(+9테스트) · T2 PublicScene tree 교체+`clearBodyMeshRegistry` · T1 `/discover` 지속 Canvas+다음/뒤로/Space/← · T5 암전 워프+WarpCamera 줌인 · T6 graceful(빈풀/실패/삭제) · T7 제외 RPC SQL 2케이스. (ADR-0003 D1~D4)

**누적 QA 통과 (2026-06-02, `/qa` 실브라우저, PR #34, `99880d3`)** — Health 9/10. **ISSUE-001(HIGH) 발견·수정**: `/discover` "뒤로" 버튼 off-by-one + StrictMode 히스토리 중복. 원인=`historyRef`를 `setCurrent` 업데이터 안에서 변형(지연+이중호출). 수정=`currentRef`로 떠나는 sphere 추적, push를 업데이터 밖 동기·1회. 검증: /discover 워프·다음/뒤로·키보드 · /s/[code] 유효200/무효404 · / 에디터 포커스패널·Self삭제가드·이름/외형편집·nav·undo/redo · /v/cosmic. 콘솔은 알려진 경고(THREE.Clock/GPU stall)+dev HMR 노이즈뿐. 리포트: `.gstack/qa-reports/qa-report-tous-2026-06-02.md`. **단위테스트 96개로 못 잡는 컴포넌트-호출 버그였음(pushHistory 순수함수는 정확, 호출 방식이 버그).**

**남은 미검증(HITL)**: 워프 애니메이션의 *시각적 매끄러움*(블랙아웃→줌인 연속성) — 동작은 확인, 사람 눈 필요. **사용자가 직접 dogfood 예정.** `/me` 클라우드 왕복·공개토글은 OAuth라 headless 불가(이미 #25/#26 HITL 검증).

**다음 단계 결정 (2026-06-02 논의)**: 사용자가 직접 써보며 UI/UX 개선·추가사항 확인 중. → 그 다음 = **(A) UI/UX taste 패스**(`/design-review` 보조, 사용자 직접 지적→surgical 수정) 먼저, 그 다음 **(B) M5(폴리시+배포)**. 근거: M5 폴리시=성능(InstancedMesh/LOD/온보딩/튜닝)이라 UX taste와 거의 직교 + 온보딩은 UX 굳은 뒤 + 성능튜닝은 최종 디자인 위에서. (M5 backlog는 §6 참조)
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

---

## 9. 비주얼 리디자인 WIP — cartoon/kitsch/arcade (M5 전 선행, 2026-06-07)

> **브랜치 `feat/cartoon-direction` (미머지/미PR, 로컬이 origin보다 2커밋 앞섬·미푸시).** 커밋: `1b8819f`(카툰 리디자인 WIP) + `f708cee`(#7~#10 비주얼 + #13 하트 + 폰트 통일) + `a5dc5d1`(하트 on /me) + `bc09db3`(cosmic 단일화 + 랜딩 + 궤도 편집 — 2026-06-10). 사용자 주도 dogfood 중 "M5 전에 비주얼부터 바꾸자"로 시작. 키워드 = **cartoon · kitsch · arcade**. 레퍼런스 = 데스크톱 `Cartoon Space Wallpaper Top Background.png`(두꺼운 외곽선+파스텔 플랫 카툰 지구). 미리보기는 기존 `/` 에디터 보존 위해 **`/v/cosmic`** 에만 적용 중. 확정되면 mono 제거 → cosmic을 기본으로 굳히기로 함.

**확정 방향(사용자 선택)**: 풀 카툰(툰 셰이딩 + 외곽선). 폰트 = **학교안심 둥근미소**(`app/fonts/Dunggeunmiso-{R,B}.ttf`, `next/font/local`, `--font-cute`). 사용자가 폰트는 "마음에 듦" 확정.

**구현 완료(이 브랜치)**:
- `layout.tsx`/`globals.css` — 둥근미소를 기본 UI 폰트로.
- `_components/Planet.tsx` — `meshToonMaterial`(4단계 gradientMap) + drei `<Outlines>`(잉크 외곽선, screenspace `thickness={0.008}`). `toon` prop으로 cosmic만.
- `_components/planet-pattern.ts` (신규) — **셰이더 절차적 표면 무늬** 7종(`bands·continents·spots·swirl·stripes·bubbles·marble`). meshToonMaterial `onBeforeCompile`로 모델 방향 기반 마스크 주입(이미지 텍스처 X — 변형 지오메트리 솔기 회피). `derivePattern(id,color)`로 기존 바디도 id 해시 자동 배정(localStorage 안 지워도 적용). 무늬색 기본=본체색 어두운 톤. 타입에 `pattern`/`patternColor` 옵셔널 필드 추가.
- `scene/OrbitingBody.tsx` — 캔디 광택 `<sprite>`(좌상단 빌보드, AdditiveBlending) + 패턴 전달.
- `scene/index.tsx` — 배경을 멀티컬러 그라데이션(보라 코어+마젠타/시안 누아주)으로, 카메라 `near 0.01`, ambient 0.45+키라이트로 셀 밴딩, drei `<Sparkles>` 2겹(노랑/하늘).
- `scene/constants.ts` — `MOUSE_INFLUENCE 2.5 → 0.8`(회전 속도 과속 수정).
- `scene/CameraController.tsx` — **매 프레임 `useSceneStoreApi().getState()`로 store 직접 읽기**(구독 타이밍 의존 제거). `scene-store-context.tsx`에 `useSceneStoreApi()` 추가.

**🐛 해결한 버그**: 외곽선 `thickness`를 px로 오인해 3.5(=350%) 줬다가 외곽선 껍데기가 화면 전체를 덮어 별·배경이 가려졌음 → 0.008로 수정.

**✅ 해결 확인 (issue 1, 2026-06-09 사용자 검증)**: focus 상태 `←/→` 키보드 nav 시 카메라가 따라감 — CameraController를 매 프레임 `getState()`로 직접 읽는 리팩터가 수정이었음. 실브라우저 dogfood로 정상 동작 확인.

**사용자 다음 피드백 대기 중인 튜닝**: 무늬 종류 의미 매핑(자동→고정?) 또는 FocusPanel에 무늬 선택 드롭다운 추가 / 무늬 세기·색 / 외곽선 두께 / 배경 채도. 사용자가 레퍼런스 추가 제공 가능.

**남은 정리(머지 전)**: ✅ **mono 제거 완료**(2026-06-10, `bc09db3` — `isMono`/SceneVariant/variant prop 전부 삭제, cosmic 단일) + ✅ **Nav "미니멀" 제거**. 남은 건 **브랜치 머지/PR**뿐. 테스트는 vitest 91 green(utils 테스트는 `getEmissiveSettings`로 교체), tsc green.

---

## 10. 추가 요청 큐 (2026-06-09, 사용자 dogfood)

> 사용자가 dogfood 중 추가 요청 7건. 규모별로 묶음. 7~10=비주얼(cartoon 브랜치 연속), 11=UX 정리, 12~13=백엔드 신기능(Supabase, M3급 — eng-review 필요).

**A. 비주얼 폴리시 (cartoon 브랜치 위, 바로 가능)**
- ✅ **#7 우주선 컨셉 화면 전환** (1차 구현, dogfood 대기) — `app/_components/WarpOverlay.tsx` 신규: 2D 캔버스 하이퍼스페이스 스트릭 오버레이(방사형 별빛+인디고 틴트, idle 시 투명, pointer-events none). `warping` prop으로 전환 중 sphere 교체 은폐, `bootOnMount`로 진입 "감속 도착" 연출. `/discover` 기존 검정 암전 → 워프 오버레이 교체. `/v/cosmic` 진입 boot 연출. tsc+build green. ⚠️ /discover PublicScene 배경 아직 mono 흰색 → cosmic 적용은 #11(mono 제거)과 함께.
- ✅ **#8 배경 미세 오브젝트** (dogfood 반영, 별똥별만 유지) — `app/scene/BackgroundLife.tsx`: **별똥별 2개**(둥근 head glow + 둥근 점 7개 꼬리, 높은 곳서 느리게 낙하, 4~12s 간격, cosmic 전용). 외계인·로켓 이미지 flyer는 사용자가 "별로"라 **전부 제거**(Flyer 컴포넌트·`public/alien.png`·`public/rocket.png`·`scripts/prep-flyers.mjs` 삭제). 튜닝: `STAR_SIZE`/`TAIL`/`TAIL_GAP` + spawn 범위. tsc green.
- ✅ **#9 행성 투톤 대비** (10%만, dogfood 반영) — `planet-pattern.ts` `deriveColor()`: `hashStr(id+"twotone")%10===0`인 **~10%만** `twoTone()`(hue 45~80° 회전+채도↑·명도↓ → 대륙/해양 대비), 나머지 90%는 기존 동일톤(본체색 ×0.62). 결정적. 비율/세기 튜닝은 함수 내 상수. cosmic 전용.
- ✅ **#10 생성 시 패턴 자동 매칭** — `sphere-store.ts` `addChild`에서 `derivePattern(id, child color)`로 `pattern`/`patternColor`를 생성 시 body에 직접 baking → 렌더 파생이 아닌 실데이터로 영속(클라우드 blob 포함)+편집 가능. mono는 렌더 시 "none" 오버라이드라 무영향.
- ✅ **생성/외형 추가 튜닝 (dogfood)** — (1) **루트 '나' 무늬 제거**: `OrbitingBody` `isRoot` 셀렉터 → 루트 pattern="none". (2) **자식 색 동일금지**: `childColor()` — 루트 자식은 기존 hue서 가장 먼 색(24분할 스캔)으로 새 패밀리, 그 외는 부모 hue 유지+명도/약간 hue 변형. (3) **생성 거리**: `orbitRadius`를 `max(형제반경)+자식지름+0.6`(최소 parent.size+size+0.4)로 → 태양/형제 겹침 해소. tsc+vitest 96 green.

**B. UX 정리**
- 🟡 **#11 불필요한 UX 제거** — ✅ **mono(미니멀) 테마 + 로컬 `/` 에디터 제거 완료**(2026-06-10): `/`를 유입 랜딩(박동 '나' + 문구 + 탐험 CTA)으로 교체, `/v/cosmic`·Nav "미니멀" 삭제, cosmic 단일. **남은 후보는 여전히 미확정**(undo/redo, 외형 슬라이더 등 — 뺄지 말지 사용자 결정 대기).

**C. 백엔드 신기능 (eng-review/설계 필요 — M3급 Supabase 작업)**
- ✅ **#12 친구 그룹** (2026-06-10 완료, 3슬라이스) — 코드로 그룹 생성/참여, 그룹원끼리 비공개 우주 공유 + 그룹 전용 워프 탐험. 마이그 0007(테이블·RLS·create/join RPC·닉네임)+0008(`random_group_sphere`). RLS 게이트 2종 통과(`groups.sql`·`random_group_sphere.sql`). 상세는 아래 §10 'E'.
- 🟡 **#13 하트(좋아요)** (코드 완성, **마이그 적용 HITL 대기**) — 익명 "누구나" 하트. 핵심 난점=익명 신원검증 불가 → 직접 RLS `delete using(true)`는 `.delete().eq('sphere_id',X)` 대량삭제 취약 → **테이블 RLS 무정책 락다운 + SECURITY DEFINER RPC**(단일 (sphere_id,voter)만 조작)로 해결. `voter`=localStorage 랜덤 uuid(익명·로그인 공통, 추측불가 → unheart 스코핑 가능).
  - `supabase/migrations/0006_sphere_hearts.sql` — `sphere_hearts(sphere_id,voter,created_at)` PK(sphere_id,voter) dedup + RPC `heart_sphere`/`unheart_sphere`/`sphere_heart_state`(공개+미flagged만, search_path 하드닝, anon/auth grant) + 내부 helper `heartable_sphere_id`.
  - `supabase/tests/sphere_hearts.sql` — 게이트: 익명하트·dedup·idempotent·unheart 스코핑·비공개차단·직접DML거부(음성대조), self-rollback.
  - `lib/sphere/hearts.ts`(voter+RPC 래퍼) · `app/_components/HeartButton.tsx`(우상단 토글, 낙관적+서버 reconcile) · `/s/[code]`+`/discover` 연결(전환마다 remount).
  - tsc+build green. **✅ 마이그 0006 적용 완료(2026-06-09) + anon RPC로 라이브 검증**(heart/unheart/state 정상 카운트, dedup·hearted 정상). `/discover`·`/s/[code]` 우상단 하트 동작. 폰트 둥근미소로 통일(discover 버튼/오버레이/토스트/공개라벨). 테스트 SQL은 `select count` 모호성 버그 수정(별칭 `hs.count`)—재실행 시 `hearts: all checks passed`. **남은 HITL: security advisor clean 확인(선택).**

**D. 2026-06-10 세션 완료** (커밋 `a5dc5d1`·`bc09db3`, 브랜치 `feat/cartoon-direction`)
- ✅ **하트 on /me** — 공개된 내 우주에서도 하트 표시(좌상단). `HeartButton`에 `side?: "left"|"right"`(기본 right) 추가, `/me`는 `is_public && short_code`일 때만 좌상단 렌더(우상단 공개토글/로그아웃과 비충돌). (`a5dc5d1`)
- ✅ **궤도 길이 편집** — FocusPanel 편집 폼 `AppearanceControls`에 "궤도" 슬라이더(`hasOrbit`일 때, 0.3~8, `editBody`→즉시/영속/undo coalesce). 공전 슬라이더 위. 생성은 기존 자동배치 유지. (`bc09db3`)
- ✅ **mono(미니멀) 테마 완전 제거 → cosmic 단일** (#11 일부, `bc09db3`): `SceneVariant` 타입 + 모든 `variant` prop 삭제. `app/scene/cosmic-env.tsx` 신규(`COSMIC_BG` + `<CosmicScenery>` 공유) → Scene·PublicScene 공용 → `/discover`·`/s/[code]`도 cosmic. `utils.ts`는 `getEmissiveSettings`만 남김(`monoShade`/`getBodyColor`/`getLineColor` 삭제, 테스트 교체). `/v/cosmic` 라우트 삭제(부트 워프는 `/`로 이관), Nav "미니멀" 제거. `/discover` 흰 오버레이·버튼도 cosmic화. **안 건드림**: `layout.tsx` `--font-geist-mono`(폰트), `Planet.tsx`(shape variant/toon은 자체 기능).
- ✅ **`/` 유입 랜딩** (#11 일부, `bc09db3`): `app/scene/LandingScene.tsx` 신규 — 자식·스토어·상호작용 없이 '나' 행성 하나만 박동(scale sine)+느린 회전. `page.tsx`는 박동 행성 + "당신의 우주는 어떤 모양인가요?" + 골드 그라데이션 **탐험** CTA(→/discover). **로컬 샌드박스 에디터 제거** — 우주 제작은 로그인 후 `/me`에서만(에디터 `Scene`은 /me 전용으로 잔존). Nav 3항목(우주`/`·내 우주`/me`·탐험`/discover`).
- 검증: tsc green, vitest 91/91, mono 잔여물 스캔(`SceneVariant`/`isMono`/`variant=`/`미니멀`/`/v/cosmic`/`mono`) **0건**. 데브 서버 `/`·`/discover` 200, `/v/cosmic` 404.
- **남은 일**: 브랜치 머지/PR · #11 잔여 후보 UX(undo/redo·외형 슬라이더) 결정 · 랜딩 Nav 표시 여부 · 박동 세기/문구 튜닝(사용자 보고 결정).

**E. 2026-06-10 세션 — `/why` + /me 폴리시 + #12 친구 그룹**
- ✅ **`/why` 매니페스토 페이지** (`db80d26`) — 프로젝트 의의 설명(사용자 작성 원문). 자체 스크롤 다크 cosmic 리딩 페이지(둥근미소). 랜딩 '탐험' 옆 **'절대 누르지 마시오.'** 역심리 버튼으로 진입. 하단 탐험 CTA + 돌아가기.
- ✅ **/me 버튼 폴리시** (`7c09692`) — 공개토글/복사/로그아웃을 mono 흰색 → cosmic 글래스 + nav 토글 뉘앙스(공개 ON=골드 그라데이션). PublishToggle `system-ui` 폰트를 둥근미소로 교정.
- ✅ **#12 친구 그룹 — 3 슬라이스** (코드로 친구 묶기, 비공개 우주 사적 공유 + 그룹 전용 워프 탐험. 설계 = 사용자 선택 "옵션 1+3", 닉네임=그룹별):
  - **슬라이스 1 백엔드** (`2274264`, 마이그 `0007_groups.sql`): `groups`(id·name·invite_code unique·created_by) + `group_members`(PK group_id+user_id·nickname). DEFINER 헬퍼 `is_group_member`/`shares_group_with`(RLS 재귀 회피). RLS: groups/group_members 멤버 읽기, 멤버 자기 닉네임 update·탈퇴 delete, **`spheres`에 "그룹 코멤버 읽기" SELECT 정책**(비공개도 같은 그룹원이면 읽힘 — 민감 권한). 쓰기는 `create_group`/`join_group` RPC(초대코드 6자 base62 `gen_invite_code`, 충돌 재시도, on conflict 닉네임 갱신). **RLS 게이트 `groups.sql` 통과**(비멤버 차단→가입후 비공개읽기→탈퇴후 차단, 음성 대조, self-rollback).
  - **슬라이스 2 UI** (`9538788`): `/groups`(auth-gated) — 내 그룹 카드(닉네임 칩·내 건 골드+"(나)"·초대코드 복사·나가기) + 그룹 만들기 + 코드 참여. `lib/group/groups.ts`(createGroup/joinGroup/leaveGroup). Nav에 '그룹' 추가. cosmic 글래스.
  - **슬라이스 3 그룹 탐험** (`0e64da7`, 마이그 `0008_random_group_sphere.sql`): `random_group_sphere(group, exclude[])` RPC(DEFINER+is_group_member 가드, 본인·기방문 제외, 소진 시 exclude 무시 폴백). `/groups/[id]` = `/discover` 트림 워프(인메모리 visited/back, 하트 없음, "○○의 우주" 닉네임 라벨). 그룹 카드에 "이 그룹 탐험 →". `lib/group/group-discover.ts`. **게이트 `random_group_sphere.sql` 통과**(멤버 코멤버 우주·본인 제외, 비멤버 차단).
  - 마이그 0007·0008 **라이브 DB 적용 완료**(사용자가 SQL 에디터로). ⚠️ Supabase MCP가 이 세션엔 미로드라 적용은 HITL이었음.
- **남은 HITL**: **두 계정 dogfood** — 실제 그룹 만들어 친구 비공개 우주가 워프로 보이는지(OAuth라 헤드리스 불가). security advisor clean 확인(선택).
