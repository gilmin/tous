# 아키텍처 개선 계획 — 2026-06-12

> `/improve-codebase-architecture` 스킬로 도출한 deepening 후보 5개. shallow module을 deep module로 바꿔 testability·AI 탐색성을 높이는 게 목표.
> 어휘: 도메인은 CONTEXT.md(Universe/Body/Self/Orbit/Focus/Warp/Pool), 아키텍처는 module/interface/implementation/depth/seam/adapter/leverage/locality.
> 원본 비주얼 리포트(before/after 다이어그램 포함)는 세션 당시 temp HTML로 생성됨(휘발성). 이 문서가 영구 사본.

**진행 상태**: 후보 1 ✅ 구현 완료(브랜치 `refactor/warp-session`). 후보 2~5 미착수.

---

## 후보 1 — 워프 세션 deep module ✅ 구현 완료

**강도**: Strong · **분류**: in-process

**파일**: `app/discover/page.tsx` · `app/groups/[id]/GroupDiscover.tsx` · `lib/discover/history.ts`

**Problem** — 탐험 워프 세션(블랙아웃 320ms·busy 잠금·back 스택·exclude 윈도·키보드·하단 nav·에러 toast)이 두 호스트에 통째로 중복되고, 그룹 호스트는 테스트된 `history.ts`를 우회해 cap 상수(10/20)까지 인라인으로 재구현 — locality 없음. ISSUE-001(back 스택 off-by-one)이 이 비테스트 glue에서 났음.

**Solution** — 워프 세션을 하나의 deep module로 모으고, 호스트는 "다음 Universe 공급" Pool adapter(공개/그룹)만 끼운다. adapter가 둘이라 real seam.

**Wins** — locality: 버그 수정이 한 곳 · leverage: 한 interface, 호스트 N개 · fake adapter로 세션 테스트 가능 · 키 드리프트 해소 · 중복 ~150줄 삭제 · Overlay·btnStyle 사본 2→1.

**ADR** — ADR-0003(지속 Canvas·registry clear·exclude RPC)와 충돌 없음. 오히려 락인 사항을 한 곳에서 집행.

**구현 결과** — `lib/warp/session.ts`(순수 reducer, 11테스트) + `app/_components/warp/useWarpSession.ts`(훅) + `WarpControls.tsx`(공유 크롬). 호스트 277→122 / 261→124. 키 통일(그룹이 ←/→ Body focus + Backspace=뒤로 획득). tsc green, vitest 117.

---

## 후보 2 — PublicScene의 seam 누수(boolean 프롭 누적)

**강도**: Worth exploring · **분류**: in-process

**파일**: `app/scene/PublicScene.tsx`(149줄, 테스트 없음) · 호스트 3곳(`/s/[short_code]`, `/discover`, `GroupDiscover`)

**Problem** — PublicScene의 interface가 호스트당 boolean 프롭을 늘리는 중(`warp` → `keyboardFocus` → `bottomNav`). focused Body 라벨이라는 **호스트 크롬이 뷰어 implementation 안에** 있어 seam 양쪽이 서로의 레이아웃을 모름 — 직전 라벨 가림 버그(`7b13c94`)가 그 직접 증거(수정도 boolean 프롭 추가라 누수가 한 칸 더 깊어짐).

**Solution** — 뷰어는 Universe 렌더 + Focus 상태 노출까지만. 크롬(라벨·키보드·하단 nav)은 호스트 쪽 한 곳으로 모은다.

**Wins** — interface 축소(프롭 4→1~2) · locality: 크롬 충돌이 한 파일 안 · 같은 버그 클래스 재발 차단 · `/s/[code]` 경로 단순화.

**메모** — 후보 1과 한 묶음. 워프 세션 module이 생긴 지금 크롬의 귀속처가 저절로 정해짐 → **다음 착수 1순위**.

---

## 후보 3 — SphereSync: 동기화 정책이 useEffect 클로저에 갇힘

**강도**: Worth exploring · **분류**: local-substitutable

**파일**: `app/me/SphereSync.tsx`(106줄, 테스트 0)

**Problem** — local-first 동기화의 실질 정책 6가지(에코 억제·1.5s 디바운스·server-wins·첫 로그인 시드·언마운트 flush·undo 스택 clear)가 전부 한 useEffect 클로저 안 → interface가 아무것도 드러내지 않고 테스트가 0. ISSUE-001과 같은 패턴(순수부만 테스트, 배선 비테스트)이 가장 미묘한 module에 남아 있음.

**Solution** — 정책을 프레임워크 없는 sync 세션 module로 추출, transport(supabase)는 adapter로 주입. 컴포넌트는 얇은 adapter(mount/unmount→start/stop)로.

**Wins** — interface가 정책을 드러냄 · 테스트가 interface 통과 · 유실 시나리오(편집 후 이탈) 검증 가능 · 멀티탭(D7 연기분) 착수 지점 한 곳.

**ADR** — eng-review D3는 "local-first + 디바운스"만 락인. 구현 형태 자유 → 충돌 없음.

---

## 후보 4 — lib/ 데이터 접근: 패스스루를 adapter로 승격하거나 인라인

**강도**: Speculative · **분류**: ports & adapters

**파일**: `lib/sphere/random-public.ts`(24, 호출자 1) · `lib/group/group-discover.ts`(22, 호출자 1) · `lib/sphere/hearts.ts`(51) · `lib/group/groups.ts`(53) · `lib/sphere/serialize.ts`(17)

**Problem** — 다섯 module이 전부 단일 호출자용 1:1 RPC 랩 → deletion test 통과 못 하는 패스스루(adapter 하나뿐인 hypothetical seam).

**Solution** — 후보 1의 "다음 Universe 공급" seam이 생기면 `random-public`·`group-discover`는 같은 interface의 두 adapter로 승격되어 밥값을 함. 나머지(hearts·serialize)는 인라인하거나 현상 유지.

**Wins** — seam이 real이 됨(adapter 2개) · fake adapter로 세션 테스트 토대.

**메모** — 단독으로 손대지 말 것. 후보 1에 딸려갈 때만 의미. (후보 1 구현 시 Pool adapter로 일부 이미 반영됨.)

---

## 후보 5 — 용어 드리프트: 코드의 "sphere" ≠ 도메인의 Universe

**강도**: Speculative · **분류**: in-process

**파일**: `useSphereStore` · `createPublicSphereStore` · `SphereSync` · `OrbitalBody` 타입 · "tree" 변수 전반

**Problem** — CONTEXT.md가 금지한 "sphere"가 코드 표면 전체(스토어·타입·컴포넌트 이름)에 남아 도메인 용어집과 코드가 다른 언어를 씀. 개념 하나 추적에 grep 세 번.

**Solution** — 코드 레벨 이름을 Universe/Body로 수렴(기계적 rename, DB 테이블 `spheres`는 제외).

**Wins** — 한 개념 = grep 한 번 · 용어집과 코드 일치.

**메모** — rename 전용 PR은 열린 브랜치와 충돌 비용 큼 → 후보 1/2 건드릴 때 그 파일만 함께 개명하는 점진 방식 권장.

---

## Top recommendation

**후보 1**(완료) → 다음은 **후보 2**. 워프 세션 module이 생긴 지금 크롬 귀속이 자연 후속이고, 직전 두 버그(ISSUE-001·라벨 가림)가 모두 그 seam에서 났음. 이후 후보 3 → 4 → 5 순.
