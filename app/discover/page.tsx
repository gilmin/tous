"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PublicScene from "@/app/scene/PublicScene";
import { WarpOverlay } from "@/app/_components/WarpOverlay";
import { HeartButton } from "@/app/_components/HeartButton";
import { createClient } from "@/lib/supabase/client";
import { COSMIC_BG } from "@/app/scene/cosmic-env";
import { getRandomPublicSphere } from "@/lib/sphere/random-public";
import {
  loadDiscoverState,
  saveDiscoverState,
  pushVisited,
  pushHistory,
  back,
  shouldReset,
  type Seen,
} from "@/lib/discover/history";
import type { OrbitalBody } from "@/app/scene/types";

// /discover — wander through strangers' public spheres (M4, ADR-0003).
// A single persistent PublicScene/Canvas stays mounted; "next" fetches a random
// public sphere (excluding recently-seen ones) and swaps the tree in place
// behind a blackout so the warp reads as zoom-out → dark → zoom-in (D1/D3).
// "Back" restores the previous sphere from a session stack. Empty pool, load
// failures, and deleted spheres are all graceful — never a dead-end (M4c).

// Blackout half-duration: fade-out and the swap both complete around this mark.
const BLACKOUT_MS = 320;

type Status = "loading" | "ready" | "empty";

export default function DiscoverPage() {
  const [supabase] = useState(() => createClient());
  const [current, setCurrent] = useState<Seen | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [canGoBack, setCanGoBack] = useState(false);
  const [dark, setDark] = useState(false); // blackout overlay opacity driver
  const [flash, setFlash] = useState<string | null>(null); // transient error toast

  // Session lists live in refs (drive fetches/back, no re-render of their own).
  const visitedRef = useRef<string[]>([]);
  const historyRef = useRef<Seen[]>([]);
  // Mirror of `current` so commit/back know what sphere we're leaving without
  // reading it inside a setState updater (updaters are deferred + double-invoked
  // under StrictMode, which previously double-pushed history and left canGoBack
  // one step stale).
  const currentRef = useRef<Seen | null>(null);
  const busyRef = useRef(false);

  const persist = useCallback(() => {
    saveDiscoverState({ visited: visitedRef.current, history: historyRef.current });
  }, []);

  // Reflect the current sphere in the URL (replace, not push — our own back
  // stack drives navigation). Shareable as a deep link.
  const syncUrl = useCallback((code: string) => {
    window.history.replaceState(null, "", `/discover?s=${code}`);
  }, []);

  const flashError = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  }, []);

  // Commit a fetched sphere as the current one, pushing the one we're leaving
  // onto the back stack and recording it in the visited (exclude) list.
  const commit = useCallback(
    (next: { short_code: string; tree: OrbitalBody }) => {
      const base = shouldReset(visitedRef.current, next.short_code)
        ? [] // exhaustion: server ignored exclude → restart the exclude window
        : visitedRef.current;
      // Push the sphere we're leaving onto the back stack — synchronously and
      // outside the updater, so it happens exactly once and canGoBack below
      // reads the fresh stack.
      const leaving = currentRef.current;
      if (leaving) historyRef.current = pushHistory(historyRef.current, leaving);
      const seen: Seen = { shortCode: next.short_code, tree: next.tree };
      currentRef.current = seen;
      setCurrent(seen);
      visitedRef.current = pushVisited(base, next.short_code);
      setCanGoBack(historyRef.current.length > 0);
      setStatus("ready");
      syncUrl(next.short_code);
      persist();
    },
    [persist, syncUrl],
  );

  // Fetch + warp to the next sphere. `warp` runs the blackout; the initial load
  // skips it (no sphere to fade out of).
  const goNext = useCallback(
    async (warp: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        if (warp) setDark(true);
        const wait = warp
          ? new Promise((r) => setTimeout(r, BLACKOUT_MS))
          : Promise.resolve();
        const [next] = await Promise.all([
          getRandomPublicSphere(supabase, visitedRef.current),
          wait,
        ]);

        if (!next) {
          // Nothing to show. On first load → empty pool. Mid-session → transient
          // failure: keep the current sphere, fade back in, surface a hint.
          setStatus((s) => (s === "loading" ? "empty" : s));
          if (warp) flashError("다음 우주를 불러오지 못했어요.");
          return;
        }
        commit(next); // swap happens behind full black
      } finally {
        if (warp) setDark(false); // fade back in (peak black → swapped sphere)
        busyRef.current = false;
      }
    },
    [supabase, commit, flashError],
  );

  const goBack = useCallback(() => {
    if (busyRef.current) return;
    const { history, entry } = back(historyRef.current);
    if (!entry) return; // empty stack → no-op (button is disabled anyway)
    historyRef.current = history;
    currentRef.current = entry;
    setCurrent(entry);
    setCanGoBack(history.length > 0);
    syncUrl(entry.shortCode);
    persist();
  }, [persist, syncUrl]);

  // Initial load: restore session lists, then fetch the first sphere (no warp).
  useEffect(() => {
    const saved = loadDiscoverState();
    visitedRef.current = saved.visited;
    historyRef.current = saved.history;
    setCanGoBack(saved.history.length > 0);
    void goNext(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard (sphere-level): Space → next universe, Backspace → previous. The
  // ←/→ arrows steer focus between bodies within the current sphere instead —
  // PublicScene owns those (keyboardFocus), mirroring the editor. preventDefault
  // stops page scroll and the browser's Backspace-back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        void goNext(true);
      } else if (e.code === "Backspace") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goBack]);

  return (
    <div className="w-screen h-screen">
      {current && (
        <PublicScene tree={current.tree as OrbitalBody} warp keyboardFocus />
      )}
      {status === "ready" && current && (
        <HeartButton key={current.shortCode} shortCode={current.shortCode} />
      )}

      {/* Spaceship warp — hyperspace streaks + tint cover the tree swap +
          registry clear (D3), and a boot burst plays on entry ("켜질 때"). */}
      <WarpOverlay warping={dark} bootOnMount />

      {status === "loading" && <Overlay>우주를 찾는 중…</Overlay>}
      {status === "empty" && (
        <Overlay>아직 공개된 우주가 없어요. 첫 번째가 되어보세요.</Overlay>
      )}

      {flash && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 45,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(20,20,24,0.8)",
            color: "#fff",
            fontFamily: "var(--font-cute), system-ui, sans-serif",
            fontSize: 13,
          }}
        >
          {flash}
        </div>
      )}

      {status === "ready" && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            display: "flex",
            gap: 10,
            fontFamily: "var(--font-cute), system-ui, sans-serif",
          }}
        >
          <button onClick={goBack} disabled={!canGoBack} style={btnStyle(!canGoBack)}>
            ← 뒤로
          </button>
          <button onClick={() => void goNext(true)} style={btnStyle(false)}>
            다음 우주 →
          </button>
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 16,
        background: COSMIC_BG,
      }}
    >
      {children}
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.22)",
    background: disabled ? "rgba(43,28,84,0.35)" : "rgba(43,28,84,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: disabled ? "rgba(255,255,255,0.4)" : "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 6px 18px rgba(20,10,50,0.35)",
  };
}
