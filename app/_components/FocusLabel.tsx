"use client";

import { useStore, type StoreApi } from "zustand";
import { selectBodyById } from "@/app/scene/store/tree-ops";
import type { SceneReadState } from "@/app/scene/store/scene-store-context";

// The focused-Body name label — an HTML overlay over the Canvas, shown whenever
// a Body is focused in a read-only sphere (/s/[code], /discover, group warp).
// It used to live inside the viewer (PublicScene), which forced the viewer to
// know whether the host drew a bottom nav so it could lift the label clear of it
// — the seam that produced the label-occlusion bug (7b13c94). Now the host
// renders it next to its own chrome and passes `lifted` when a bottom nav sits
// underneath, so the two are positioned together in one place.
export function FocusLabel({
  store,
  lifted = false,
}: {
  store: StoreApi<SceneReadState>;
  lifted?: boolean;
}) {
  const label = useStore(store, (s) =>
    s.focusedId ? (selectBodyById(s.tree, s.focusedId)?.label ?? null) : null,
  );
  if (!label) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: lifted
          ? "calc(92px + env(safe-area-inset-bottom))"
          : "calc(36px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        zIndex: 30,
        padding: "12px 22px",
        minWidth: 180,
        textAlign: "center",
        background: "rgba(38,25,72,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 24,
        color: "#f7f3ff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "0.01em",
        boxShadow: "0 10px 30px rgba(15,8,40,0.5)",
      }}
    >
      {label}
    </div>
  );
}
