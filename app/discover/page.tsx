"use client";

import { useCallback, useMemo, useState } from "react";
import PublicScene from "@/app/scene/PublicScene";
import { useForeignUniverseStore } from "@/app/scene/useForeignUniverseStore";
import { FocusLabel } from "@/app/_components/FocusLabel";
import { WarpOverlay } from "@/app/_components/WarpOverlay";
import { HeartButton } from "@/app/_components/HeartButton";
import { OnboardingHint } from "@/app/_components/OnboardingHint";
import {
  useWarpSession,
  type Pool,
} from "@/app/_components/warp/useWarpSession";
import { useFocusKeys } from "@/app/_components/warp/useFocusKeys";
import {
  WarpNav,
  WarpMessage,
  WarpFlash,
} from "@/app/_components/warp/WarpControls";
import { createClient } from "@/lib/supabase/client";
import { getRandomPublicSphere } from "@/lib/sphere/random-public";
import { loadDiscoverState, saveDiscoverState } from "@/lib/discover/history";
import type { WarpEntry } from "@/lib/warp/session";

// /discover — wander through strangers' public Universes (M4, ADR-0003). The
// Warp session (lib/warp/session + useWarpSession) owns the warp mechanics —
// blackout, exclude window, back stack, keyboard — shared with group warp. This
// host supplies the public Pool and the bits unique to /discover: hearts,
// onboarding, localStorage persistence, and URL deep-linking.

export default function DiscoverPage() {
  const [supabase] = useState(() => createClient());

  // The public Pool: one random published Universe, keyed by short_code.
  const pool: Pool = useMemo(
    () => ({
      next: async (exclude) => {
        const r = await getRandomPublicSphere(supabase, exclude);
        return r ? { key: r.short_code, tree: r.tree } : null;
      },
    }),
    [supabase],
  );

  // Persistence + restore bridge the session's key-agnostic WarpEntry to the
  // existing `tous:discover:v1` Seen shape (short_code-keyed), so saved sessions
  // stay compatible.
  const restore = useCallback(() => {
    const saved = loadDiscoverState();
    return {
      visited: saved.visited,
      history: saved.history.map((s) => ({ key: s.shortCode, tree: s.tree })),
    };
  }, []);

  const persist = useCallback(
    (s: { visited: string[]; history: WarpEntry[] }) => {
      saveDiscoverState({
        visited: s.visited,
        history: s.history.map((e) => ({ shortCode: e.key, tree: e.tree })),
      });
    },
    [],
  );

  // Mirror the current Universe in the URL (replace — our own back stack drives
  // navigation). Shareable as a deep link.
  const onNavigate = useCallback((entry: WarpEntry) => {
    window.history.replaceState(null, "", `/discover?s=${entry.key}`);
  }, []);

  const { current, status, canGoBack, dark, flash, goNext, goBack } =
    useWarpSession({ pool, restore, persist, onNavigate });

  // The host owns the read-only store so it can render Focus-derived chrome (the
  // name label, lifted clear of the bottom nav; the ←/→ keyboard nav) alongside
  // the viewer instead of inside it.
  const store = useForeignUniverseStore(current?.tree ?? null);
  useFocusKeys(store);

  return (
    <div className="w-screen h-screen">
      {store && <PublicScene store={store} />}
      {store && <FocusLabel store={store} lifted />}
      {status === "ready" && current && (
        <HeartButton key={current.key} shortCode={current.key} />
      )}

      {/* Spaceship warp — hyperspace streaks + tint cover the tree swap +
          registry clear (D3), and a boot burst plays on entry ("켜질 때"). */}
      <WarpOverlay warping={dark} bootOnMount />

      {status === "loading" && <WarpMessage>우주를 찾는 중…</WarpMessage>}
      {status === "empty" && (
        <WarpMessage>아직 공개된 우주가 없어요. 첫 번째가 되어보세요.</WarpMessage>
      )}

      {flash && <WarpFlash message={flash} />}

      {status === "ready" && (
        <OnboardingHint
          storageKey="tous:onboarding:discover:v1"
          title="낯선 우주를 탐험하는 법"
          lines={[
            ["클릭 · ←/→", "행성 하나를 살펴보기"],
            ["Esc", "살펴보기 끝내기"],
            ["Space", "다음 우주로 워프"],
            ["Backspace", "이전 우주로 돌아가기"],
          ]}
          touchLines={[
            ["행성 탭", "행성 하나 살펴보기"],
            ["← →", "옆 행성으로 이동 (살펴보는 중)"],
            ["빈 곳 탭", "살펴보기 끝내기"],
            ["다음 우주 · 뒤로", "다른 우주로 워프"],
            ["가로로 돌리기", "전체를 더 넓게"],
          ]}
        />
      )}
      {status === "ready" && store && (
        <WarpNav
          store={store}
          canGoBack={canGoBack}
          onBack={goBack}
          onNext={() => void goNext(true)}
        />
      )}
    </div>
  );
}
