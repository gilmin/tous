"use client";

import { useEffect, useRef } from "react";
import type { StoreApi } from "zustand";
import { clearBodyMeshRegistry } from "./store/body-mesh-registry";
import {
  createPublicSphereStore,
  type PublicSphereStore,
} from "./store/scene-store-context";
import type { OrbitalBody } from "./types";

// Owns the read-only store for a foreign (public) sphere and keeps it in sync as
// the displayed tree changes. /discover and group warp swap between spheres;
// /s/[code] passes a stable tree (the sync effect never fires). On every swap
// the mesh registry is cleared first: every sphere's root id is "self", so stale
// meshes from the outgoing sphere must not linger (ADR-0003 D3) — the rule lives
// here now, right next to the swap, rather than inside the viewer. The store is
// born with the first tree, so a host with no tree yet (warp before its first
// fetch) passes null and gets null back.
export function useForeignSphereStore(
  tree: OrbitalBody | null,
): StoreApi<PublicSphereStore> | null {
  const storeRef = useRef<StoreApi<PublicSphereStore> | null>(null);
  const appliedRef = useRef<OrbitalBody | null>(null);

  // Lazy-create once, when the first tree arrives. Mark it applied so the sync
  // effect below only fires for *subsequent* swaps, not this initial tree.
  if (tree && !storeRef.current) {
    storeRef.current = createPublicSphereStore(tree);
    appliedRef.current = tree;
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store || !tree || tree === appliedRef.current) return;
    appliedRef.current = tree;
    clearBodyMeshRegistry();
    store.getState().setTree(tree);
  }, [tree]);

  return storeRef.current;
}
