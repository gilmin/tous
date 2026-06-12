"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { CameraController } from "./CameraController";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import { COSMIC_BG, CosmicScenery } from "./cosmic-env";
import { clearBodyMeshRegistry } from "./store/body-mesh-registry";
import {
  SceneStoreProvider,
  createPublicSphereStore,
  useSceneStore,
} from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import { focusForKey } from "./store/focus-key";
import type { OrbitalBody } from "./types";

// /discover only: on each tree swap (behind the blackout), snap the camera far
// out so CameraController lerps it back to the default — reads as a zoom-in as
// the screen fades from black (ADR-0003 M4b warp). Gated by a prop so /s/[code]
// (stable tree) is untouched.
function WarpCamera() {
  const tree = useSceneStore((s) => s.tree);
  const { camera } = useThree();
  const prevTree = useRef(tree);
  useEffect(() => {
    if (tree === prevTree.current) return;
    prevTree.current = tree;
    camera.position.set(0, 4, 18);
  }, [tree, camera]);
  return null;
}

// Read-only viewer for a foreign (public) sphere at /s/[code]. Reuses the
// editable scene's 3D components via an injected read-only store — same
// hover / focus / camera behaviour, but no editing, persistence, or keyboard.
export default function PublicScene({
  tree,
  warp = false,
  keyboardFocus = false,
  bottomNav = false,
}: {
  tree: OrbitalBody;
  warp?: boolean;
  keyboardFocus?: boolean;
  // When the host page renders a bottom-center nav row (/discover, group warp),
  // lift the focused-body name label above it so the buttons don't cover it.
  bottomNav?: boolean;
}) {
  // One store per Canvas (lazy init → created once, never on rerender). On
  // /discover the same component instance stays mounted while the `tree` prop
  // changes; we swap the store's tree in place so the Canvas/camera persist
  // across spheres (ADR-0003 D1). On /s/[code] the tree never changes.
  const [store] = useState(() => createPublicSphereStore(tree));
  const setFocus = useStore(store, (s) => s.setFocus);
  const setTree = useStore(store, (s) => s.setTree);
  const focusedId = useStore(store, (s) => s.focusedId);
  const focusedLabel = useStore(store, (s) =>
    s.focusedId ? (selectBodyById(s.tree, s.focusedId)?.label ?? null) : null,
  );

  // Apply tree changes after the initial mount (the store already holds the
  // first tree). Clear the mesh registry first: every sphere's root id is
  // "self", so stale meshes from the outgoing sphere must not linger (D3).
  const appliedTreeRef = useRef(tree);
  useEffect(() => {
    if (tree === appliedTreeRef.current) return;
    appliedTreeRef.current = tree;
    clearBodyMeshRegistry();
    setTree(tree);
  }, [tree, setTree]);

  // Selecting a moving body fires on pointerdown; the pointerup can land on
  // empty space → onPointerMissed would instantly clear it. Stamp each select
  // so a 300ms guard suppresses that follow-up clear (mirrors the editor).
  const lastSelectAtRef = useRef(0);
  useEffect(() => {
    if (focusedId !== null) lastSelectAtRef.current = performance.now();
  }, [focusedId]);

  // /discover only: ←/→ cycle focus through this sphere's bodies, Esc clears.
  // Gated by prop so /s/[code] (a stable single sphere) stays keyboard-free.
  // Reads fresh tree/focus from the store so it never closes over a stale tree
  // across warp swaps. Sphere-level keys (Space=next, Backspace=back) live in
  // the discover page; the two key sets are disjoint.
  useEffect(() => {
    if (!keyboardFocus) return;
    const onKey = (e: KeyboardEvent) => {
      const { tree: t, focusedId: f, setFocus: set } = store.getState();
      const result = focusForKey(t, f, e.code);
      if (!result) return;
      e.preventDefault();
      set(result.focusId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboardFocus, store]);

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50, near: 0.01, far: 200 }}
        style={{ background: COSMIC_BG }}
        onPointerMissed={() => {
          if (performance.now() - lastSelectAtRef.current < 300) return;
          setFocus(null);
        }}
      >
        <CosmicScenery />
        <SceneStoreProvider store={store}>
          {warp && <WarpCamera />}
          <CameraController />
          <System />
          <FocusRing />
        </SceneStoreProvider>
      </Canvas>
      {focusedLabel && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: bottomNav ? 92 : 36,
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
          {focusedLabel}
        </div>
      )}
    </>
  );
}
