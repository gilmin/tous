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
