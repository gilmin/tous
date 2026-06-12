"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initialWarpState,
  commitEntry,
  goBackState,
  noNextState,
  restoreState,
  canGoBack as canGoBackOf,
  type WarpEntry,
  type WarpState,
} from "@/lib/warp/session";

// A Pool (CONTEXT.md), as the Warp session sees it: "give me the next Universe,
// excluding these keys" → an entry, or null for an empty/exhausted pool or a
// transient error. Two adapters today (public, group) make this a real seam;
// a fake pool makes the session driveable in a test.
export type Pool = {
  next: (exclude: string[]) => Promise<WarpEntry | null>;
};

// Blackout half-duration: the streak overlay peaks and the tree swap both land
// around this mark, so the warp reads as zoom-out → dark → zoom-in (ADR-0003).
const BLACKOUT_MS = 320;
const FETCH_FAIL_MSG = "다음 우주를 불러오지 못했어요.";

// Drives one exploration host. All transition logic lives in lib/warp/session
// (pure, tested); this hook is the thin glue — fetch, blackout timing, the busy
// lock, keyboard — that reads fresh state from a ref and applies the transition
// plus its side-effects synchronously and once (the shape that fixed ISSUE-001).
export function useWarpSession({
  pool,
  restore,
  persist,
  onNavigate,
}: {
  pool: Pool;
  // The public pool restores/persists its exclude window + back stack across
  // reloads; the group pool passes neither (in-memory, tiny pool).
  restore?: () => { visited: string[]; history: WarpEntry[] };
  persist?: (state: { visited: string[]; history: WarpEntry[] }) => void;
  // Side-effect on each navigation (e.g. /discover mirrors the key into the URL).
  onNavigate?: (entry: WarpEntry) => void;
}) {
  const [state, setState] = useState<WarpState>(initialWarpState);
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  const [dark, setDark] = useState(false); // blackout/streak driver
  const [flash, setFlash] = useState<string | null>(null); // transient toast

  const apply = useCallback(
    (next: WarpState) => {
      stateRef.current = next;
      setState(next);
      persist?.({ visited: next.visited, history: next.history });
    },
    [persist],
  );

  const flashError = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  }, []);

  const goNext = useCallback(
    async (warp: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        if (warp) setDark(true);
        const wait = warp
          ? new Promise((r) => setTimeout(r, BLACKOUT_MS))
          : Promise.resolve();
        const [entry] = await Promise.all([
          pool.next(stateRef.current.visited),
          wait,
        ]);
        if (!entry) {
          // First load → empty pool; mid-session → transient miss (keep current).
          apply(noNextState(stateRef.current));
          if (warp) flashError(FETCH_FAIL_MSG);
          return;
        }
        apply(commitEntry(stateRef.current, entry)); // swap behind full black
        onNavigate?.(entry);
      } finally {
        if (warp) setDark(false); // fade back in to the swapped Universe
        busyRef.current = false;
      }
    },
    [pool, apply, flashError, onNavigate],
  );

  const goBack = useCallback(() => {
    if (busyRef.current) return;
    const next = goBackState(stateRef.current);
    if (next === stateRef.current) return; // empty stack → no-op
    apply(next);
    if (next.current) onNavigate?.(next.current);
  }, [apply, onNavigate]);

  // Initial load: restore the persisted session (if any) so the back button is
  // live immediately, then fetch the first Universe without a warp.
  useEffect(() => {
    if (restore) {
      const saved = restore();
      apply(restoreState(stateRef.current, saved.visited, saved.history));
    }
    void goNext(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sphere-level keys: Space → next Universe, Backspace → previous. The ←/→
  // arrows steer Focus between Bodies (PublicScene owns those, keyboardFocus);
  // the two key sets are disjoint. Unified across hosts (CONTEXT.md Warp).
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

  return {
    current: state.current,
    status: state.status,
    canGoBack: canGoBackOf(state),
    dark,
    flash,
    goNext,
    goBack,
  };
}
