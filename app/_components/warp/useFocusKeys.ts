"use client";

import { useEffect } from "react";
import type { StoreApi } from "zustand";
import { focusForKey } from "@/app/scene/store/focus-key";
import type { SceneReadState } from "@/app/scene/store/scene-store-context";

// ←/→ cycle Focus through a sphere's Bodies (DFS, circular), Esc clears — the
// within-sphere navigation for warp hosts. Reads fresh tree/focus from the store
// on each keypress so it never closes over a stale tree across warp swaps.
// Sphere-level keys (Space=next, Backspace=back) live in useWarpSession; the two
// key sets are disjoint. Pass null before the first sphere has loaded.
export function useFocusKeys(store: StoreApi<SceneReadState> | null): void {
  useEffect(() => {
    if (!store) return;
    const onKey = (e: KeyboardEvent) => {
      const { tree, focusedId, setFocus } = store.getState();
      const result = focusForKey(tree, focusedId, e.code);
      if (!result) return;
      e.preventDefault();
      setFocus(result.focusId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);
}
