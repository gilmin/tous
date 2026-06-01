"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSphereStore } from "@/app/scene/store/sphere-store";
import { countNodes } from "@/lib/sphere/serialize";
import type { OrbitalBody } from "@/app/scene/types";

// Bridges the local zustand store to the owner's `spheres` row (eng-review D3:
// local-first + debounced background sync). Side-effect only — renders nothing.
// Mounted inside the auth-gated /me page, so `userId` is always a real owner and
// the browser client's session makes auth.uid() = userId (RLS owner check).
const PUSH_DEBOUNCE_MS = 1500;

export default function SphereSync({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    // The tree value currently matching the server. Lets the subscription (a)
    // suppress the echo right after we hydrate from the server and (b) skip a
    // redundant push of a value the server already has.
    let serverTree: OrbitalBody | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingTree: OrbitalBody | null = null;

    async function push(tree: OrbitalBody) {
      // No parallel serialization (D3): the store tree IS the JSONB blob.
      // node_count is computed from the blob at push time (D8).
      const { error } = await supabase.from("spheres").upsert(
        { owner_id: userId, tree, node_count: countNodes(tree) },
        { onConflict: "owner_id" },
      );
      if (error) {
        console.warn("[sphere-sync] push 실패", error.message);
        return;
      }
      serverTree = tree;
    }

    function schedule(tree: OrbitalBody) {
      pendingTree = tree;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (pendingTree) {
          void push(pendingTree);
          pendingTree = null;
        }
      }, PUSH_DEBOUNCE_MS);
    }

    // Load-on-mount: the server is the source of truth across browsers/devices
    // (last-write-wins). With no row yet, seed it from the current local tree —
    // first login carries the existing local sphere up to the cloud.
    async function load() {
      const { data, error } = await supabase
        .from("spheres")
        .select("tree")
        .eq("owner_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[sphere-sync] load 실패", error.message);
        return;
      }
      if (data) {
        const tree = data.tree as OrbitalBody;
        // Set serverTree BEFORE setState so the subscription treats the
        // hydration as an echo and does not push it straight back.
        serverTree = tree;
        // Server wins over anything edited during the load window.
        if (timer) {
          clearTimeout(timer);
          timer = null;
          pendingTree = null;
        }
        useSphereStore.setState({ tree });
        // Don't let undo walk back past the freshly-loaded server state.
        useSphereStore.temporal.getState().clear();
      } else {
        await push(useSphereStore.getState().tree);
      }
    }

    void load();

    const unsub = useSphereStore.subscribe((state, prev) => {
      if (state.tree === prev.tree) return; // focus/mode/nav — not a tree edit
      if (state.tree === serverTree) return; // echo from load()
      schedule(state.tree);
    });

    return () => {
      cancelled = true;
      unsub();
      // Flush the last pending edit so an edit-then-leave isn't lost.
      if (timer) {
        clearTimeout(timer);
        if (pendingTree) void push(pendingTree);
      }
    };
  }, [userId]);

  return null;
}
