# tous

`tous`는 한 사람의 생각·가치·철학을 3D 태양계로 시각화하고, 낯선 타인의 태양계를 탐험하며 "다양한 개인"을 체감하게 하는 플랫폼이다. 이 문서는 구현 세부가 아니라 **도메인 용어집**이다 — 무엇을 무엇이라 부르는지만 기록한다.

## Language

**Universe**:
한 사람의 태양계 전체 — 그 사람이 만들고, 공개하고, 남이 탐험하는 마인드맵 우주 한 채. 한 사람은 하나의 Universe를 소유한다.
_Avoid_: sphere (개별 노드의 기하학적 구 모양과 충돌), system, cosmos (cosmic 테마와 충돌)

**Body**:
Universe 안의 개별 노드 하나 — 깊이와 무관하게 중심·행성·위성을 전부 가리키는 단일 용어 (천문학의 celestial body). 각 Body가 담는 생각·가치(예: "자유")는 Body의 **label** 속성이다.
_Avoid_: node, planet/moon(깊이별 상대 호칭일 뿐 표준어 아님), sphere

**Self**:
Universe의 루트 **Body** — 소유자 "나"를 나타낸다. Universe당 정확히 하나, 삭제 불가. 코드 id는 `self`.
_Avoid_: inner_core, 이름 노드, sun(태양은 Self의 시각 표현일 뿐)

**Orbit**:
자식 **Body**가 부모 주위를 도는 궤도. 그 기하(반지름·속도·기울기·위상)는 **자동 생성된 시각 요소일 뿐 의미를 담지 않는다** — 의미는 부모-자식 링크 자체가 진다.
_Avoid_: 궤도 파라미터가 개념의 거리·중요도를 뜻한다는 해석

**Focus**:
지금 선택되어 패널이 열린 단 하나의 **Body**, 또는 그것을 선택하는 행위. Universe당 동시에 하나만 Focus된다. 빈 공간 클릭 또는 ESC로 해제. Focus 패널은 그 Body를 깊이 읽고(M1) 편집·자식 추가·삭제하는(M2) 표면이다 — 단, **Self를 Focus하면 삭제는 제공되지 않는다**.
_Avoid_: select(선택)

**Warp**:
탐험 중 한 **Universe**에서 다른 **Universe**로 넘어가는 전환 — 줌아웃 → 암전 → 줌인으로, 보여주는 트리를 Canvas 재마운트 없이 제자리에서 교체한다(ADR-0003). 이 전환을 끌고 가는 세션(방문 기록 윈도·뒤로 스택·다음/뒤로 상태 기계)이 **Warp 세션**이다. 같은 메커니즘을 `/discover`(낯선 타인)와 그룹 탐험(친구)이 공유한다.
_Avoid_: transition(너무 일반적), navigation(라우팅과 혼동)

**Pool**:
한 **Warp** 세션이 다음 **Universe**를 길어 올리는 모집단. 오늘 두 종류 — 공개 Pool(낯선 타인, `/discover`)과 그룹 Pool(친구). Pool은 "최근 본 것들을 빼고 다음 Universe 하나를 달라"는 단일 요청에 답한다(소진되면 제외를 무시). Warp 세션이 Pool 위에 끼우는 어댑터다.
_Avoid_: feed(시간순·푸시 함의), source(코드 식별자로만)

## Relationships

- 하나의 **Universe**는 하나 이상의 **Body**로 이루어지며, 그 루트가 **Self**다
- **Body**는 0개 이상의 자식 **Body**를 가진다 (재귀, 깊이 무제한)
- **Self**는 부모가 없고, 그 외 모든 **Body**는 정확히 하나의 부모 **Body**를 가진다 (트리, 그래프 아님 — 교차 링크 없음)
- 자식 **Body**는 부모의 **더 구체적인 면 또는 거기서 뻗어나온 갈래**다 (중심=추상 → 바깥=구체, 방향성 있음). 자식은 **Orbit**으로 부모를 돈다.

## Example dialogue

> **Dev:** "'자유' Body에 '선택'을 자식으로 달면, Orbit 반지름은 어떻게 정해?"
> **도메인:** "사용자가 안 정해. 자동 생성이야 — Orbit 기하는 보기 좋으라고 있는 거지 '선택이 자유에서 얼마나 멀다'는 뜻이 아니야. 의미는 '선택은 자유의 구체적 갈래'라는 부모-자식 링크에만 있어."

## Flagged ambiguities

- "sphere"가 ① 한 사람의 태양계 전체 ② 개별 노드의 구 모양 두 가지로 쓰였음 → ①은 **Universe**로 확정. "sphere"는 개별 노드를 가리킬 때도 쓰지 않는다. 단 **영속·전송 층에서는 "sphere"가 잔존**한다(2026-06-13 결정) — `spheres` DB 테이블·마이그·RLS·RPC·`short_code`·`/s/[code]` 공유 URL·`tous:sphere:v1` localStorage 키. 즉 **"sphere" = 저장·공유된 형태, Universe = 살아있는 도메인 객체**이고 그 seam은 `lib/sphere/serialize.ts`. 도메인/앱 코드(store·viewer·sync 컴포넌트)는 Universe로 부른다.
- "cosmos/cosmic"은 시각 **테마 이름**(`/v/cosmic`)으로 예약됨 — 최상위 엔티티 이름으로 쓰지 않는다.
- 중심 노드가 코드 `self` / PROGRESS `inner_core` / 설계문서 "이름 노드" 3가지로 불렸음 → **Self**로 확정. PROGRESS.md의 `inner_core` 표기는 정리 대상.
