# 0003 — M4 탐험(discovery)·워프 아키텍처

**상태**: ACCEPTED (2026-06-01, `/plan-eng-review`)
**관련**: ADR-0001 (orbital metaphor), ADR-0002 (state store), 원본 설계 §"랜덤 탐험"·§"페이지 구조"
**대체**: 원본 설계 doc의 M4 Open Questions

## 결정 요약

M4(탐험)는 `/discover`에서 낯선 공개 sphere를 랜덤으로 넘겨보고, sphere 사이를 카메라 워프로 전환하며, 뒤로가기로 직전 것을 복귀하는 경험이다. 네 가지 결정을 락인한다.

| # | 결정 | 근거 |
|---|---|---|
| D1 | **지속 Canvas + 트리 교체** — `/discover`가 단일 Canvas/Scene을 들고, 보여줄 sphere의 tree를 discover 레벨 store에 둔다. "다음"은 새 tree fetch → 카메라 줌아웃 → tree 교체 → 줌인. PublicScene을 "바뀌는 tree"를 받도록 소폭 수정(현재는 마운트 시 useState로 고정). | 설계가 명시적으로 줌 워프(M4b)를 원함. 구마다 재마운트하면 Canvas·카메라가 끊겨 연속 워프 불가. |
| D2 | **RPC에 제외 목록 인자** — 마이그 0005로 `random_public_sphere(exclude text[])` 신설. 클라이언트가 최근 본 short_code를 넘기면 서버가 제외하고 랜덤. 제외가 풀 전체를 덮으면(소진) 제외 무시 폴백. | 설계의 "최근 20개 NOT IN" 전략. 5개 시드 풀에서 중복 반복 회피. tablesample 1차/폴백 양쪽에 `<> ALL(exclude)` → O(N) 회피 유지. |
| D3 | **워프 교체 직전 mesh 레지스트리 비우기** — `registry.clear()` 한 줄. | 모든 sphere 루트 id가 `"self"`로 충돌. D1 워프는 "줌아웃→암전→줌인"이라 두 sphere가 동시 표시되지 않음(암전 틈) → clear로 충분. 크로스페이드(겹침)를 원하면 그때 id 네임스페이스/스코프드 레지스트리로. |
| D4 | **홈 `/` 개편은 M4에서 미룸** — M4는 `/discover` 신설만. | 홈을 "랜덤 공개+CTA"로 바꾸는 건 랜딩 개편·로그인 분기·온보딩이 얽힌 별도 슬라이스(CEO 리뷰 대상). M4를 탐험 메커니즘에 집중. |

## 빌딩블록 (이미 있음, 재사용)

- `lib/sphere/random-public.ts` `getRandomPublicSphere(client)` — D2에서 `exclude` 인자 받도록 확장
- `app/scene/PublicScene.tsx` — D1에서 "바뀌는 tree" 지원하도록 소폭 수정
- `app/scene/store/scene-store-context.tsx` `createPublicSphereStore(tree)` — discover store 토대
- `app/s/[short_code]/page.tsx` — 단일 공개 뷰(무변), 워프 중 `history.replace`로 URL 동기화
- `supabase/migrations/0003_random_public_sphere.sql` — tablesample 전략(0005가 확장)
- 마이그 0004 데모 5개 시딩 — 풀 cold-start 해소

## 신규 모듈

- `app/discover/page.tsx` — 지속 Canvas + discover store + "다음"/back/space 컨트롤
- `lib/discover/history.ts` — 순수 함수: `pushVisited`(중복제거+20 cap), `pushHistory`(back 스택 10 cap), `back`, `shouldReset`(소진 판정). localStorage 영속.
- `supabase/migrations/0005_random_public_sphere_exclude.sql` — 제외 인자 + 소진 폴백

## 단계적 구현 (설계 M4a/b/c)

- **M4a**: tree 교체 + scene swap (애니메이션 없이 작동). 랜덤 제외/히스토리 포함.
- **M4b**: 카메라 줌아웃 → 암전 → 줌인 워프 애니메이션.
- **M4c**: 에러 케이스 — 로딩 실패 / 삭제된 sphere / 빈 풀(소진) → graceful.

## 테스트

- `lib/discover/history.ts` → `history.test.ts` 7케이스 (vitest, tree-ops 선례)
- `supabase/tests/random_public_sphere_exclude.sql` 2케이스 (self-rollback + role 전환 + 음성 대조)
- 워프/카메라/스왑(R3F)은 단위 테스트 안 함(ADR-0002 D12 선례) → `/qa` 수동 검증

## NOT in scope (명시적 연기)

- 홈 `/` 개편 (D4) — 별도 슬라이스/CEO 리뷰
- 크로스페이드 워프 (D3) — v1은 암전 틈 워프만
- 즐겨찾기/저장 — 설계 v1 제외
- 모바일 — 설계 v1 제외
- `public_sphere_index` 캐시 테이블 — 설계상 베타 후 트래픽 늘면 검토
