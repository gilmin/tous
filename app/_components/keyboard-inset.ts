"use client";

import { useEffect, useState } from "react";

// 키보드가 가린 화면 하단 높이(px). 레이아웃 뷰포트에서 visual viewport(키보드가
// 밀어낸 보이는 영역)와 그 스크롤 오프셋을 빼면 하단 겹침이 남는다. 순수 함수라
// vitest로 검증하고, 훅은 visualViewport 이벤트만 얇게 잇는다(repo 관행: 순수
// 코어 + 어댑터, cf. lib/sphere/sync-session.ts).
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
