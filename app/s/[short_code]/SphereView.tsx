"use client";

import PublicScene from "@/app/scene/PublicScene";
import { useForeignSphereStore } from "@/app/scene/useForeignSphereStore";
import { FocusLabel } from "@/app/_components/FocusLabel";
import type { OrbitalBody } from "@/app/scene/types";

// Client wrapper for the public share page (a server component): it owns the
// read-only store and renders the viewer plus the focused-Body label. The tree
// is stable here (no warp), so the label sits at its default position — no bottom
// nav to clear.
export function SphereView({ tree }: { tree: OrbitalBody }) {
  const store = useForeignSphereStore(tree);
  if (!store) return null;
  return (
    <>
      <PublicScene store={store} />
      <FocusLabel store={store} />
    </>
  );
}
