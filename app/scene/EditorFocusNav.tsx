"use client";

import { useUniverseStore } from "./store/universe-store";
import { FocusNavRow } from "../_components/warp/WarpControls";
import { useCoarsePointer } from "../_components/useCoarsePointer";

// Touch-only ← / → focus nav for the /me editor: cycle focus through bodies in
// DFS order, the same as the keyboard arrows. Shown only while a body is focused
// in normal mode (not while editing/adding) — the FocusPanel (edit · + child ·
// delete) sits above it.
export function EditorFocusNav() {
  const coarse = useCoarsePointer();
  const focusedId = useUniverseStore((s) => s.focusedId);
  const mode = useUniverseStore((s) => s.mode);
  const focusPrev = useUniverseStore((s) => s.focusPrev);
  const focusNext = useUniverseStore((s) => s.focusNext);
  if (!coarse || focusedId === null || mode !== "normal") return null;
  return <FocusNavRow onPrev={focusPrev} onNext={focusNext} />;
}
