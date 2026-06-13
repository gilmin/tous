"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSphereStore } from "@/app/scene/store/sphere-store";
import { countNodes } from "@/lib/sphere/serialize";
import {
  startSyncSession,
  type LoadResult,
  type SyncLocalStore,
  type SyncTransport,
} from "@/lib/sphere/sync-session";
import type { OrbitalBody } from "@/app/scene/types";

// Bridges the local zustand store to the owner's `spheres` row (eng-review D3:
// local-first + debounced background sync). All the sync policy now lives in the
// framework-free session (lib/sphere/sync-session, unit-tested); this component
// is the thin adapter that builds the two ports and runs the session for the
// mount's lifetime. Side-effect only — renders nothing. Mounted inside the
// auth-gated /me page, so `userId` is always a real owner and the browser
// client's session makes auth.uid() = userId (RLS owner check).
export default function SphereSync({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();

    // Server I/O port. The tree IS the JSONB blob (no parallel serialization,
    // D3); node_count is computed from the blob at push time (D8).
    const transport: SyncTransport = {
      load: async (): Promise<LoadResult> => {
        const { data, error } = await supabase
          .from("spheres")
          .select("tree")
          .eq("owner_id", userId)
          .maybeSingle();
        if (error) {
          console.warn("[sphere-sync] load 실패", error.message);
          return { status: "error" };
        }
        return data
          ? { status: "row", tree: data.tree as OrbitalBody }
          : { status: "empty" };
      },
      push: async (tree) => {
        const { error } = await supabase.from("spheres").upsert(
          { owner_id: userId, tree, node_count: countNodes(tree) },
          { onConflict: "owner_id" },
        );
        if (error) {
          console.warn("[sphere-sync] push 실패", error.message);
          return false;
        }
        return true;
      },
    };

    // Local state port. Only a tree-reference change is a real edit — focus /
    // mode / nav leave the tree ref stable (immer), so a ref check skips them.
    const store: SyncLocalStore = {
      getTree: () => useSphereStore.getState().tree,
      setTree: (tree) => useSphereStore.setState({ tree }),
      clearHistory: () => useSphereStore.temporal.getState().clear(),
      subscribe: (onChange) =>
        useSphereStore.subscribe((state, prev) => {
          if (state.tree !== prev.tree) onChange(state.tree);
        }),
    };

    const session = startSyncSession({ transport, store });
    return () => session.stop();
  }, [userId]);

  return null;
}
