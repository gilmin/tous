"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useStore, type StoreApi } from "zustand";
import { CameraController } from "./CameraController";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import { COSMIC_BG, CosmicScenery } from "./cosmic-env";
import {
  SceneStoreProvider,
  useSceneStore,
  type ForeignUniverseStore,
} from "./store/scene-store-context";

// On each tree swap (behind the warp blackout) snap the camera far out so
// CameraController lerps it back to the default — reads as a zoom-in as the
// screen fades from black (ADR-0003 M4b warp). Store-driven and self-gating:
// when the tree never changes (/s/[code]) the effect early-returns forever, so
// it is inert without needing a prop to switch it off.
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

// Read-only viewer for a foreign Universe. Renders the injected read-only
// store through the editable scene's 3D components — same hover / focus / camera
// behaviour, no editing or persistence. The store is owned by the host
// (useForeignUniverseStore) so the host also drives tree swaps and renders the
// Focus-derived chrome (name label, keyboard nav) outside the Canvas; the
// viewer's whole interface is the store.
export default function PublicScene({
  store,
}: {
  store: StoreApi<ForeignUniverseStore>;
}) {
  const setFocus = useStore(store, (s) => s.setFocus);
  const focusedId = useStore(store, (s) => s.focusedId);

  // Selecting a moving body fires on pointerdown; the pointerup can land on
  // empty space → onPointerMissed would instantly clear it. Stamp each select
  // so a 300ms guard suppresses that follow-up clear (mirrors the editor).
  const lastSelectAtRef = useRef(0);
  useEffect(() => {
    if (focusedId !== null) lastSelectAtRef.current = performance.now();
  }, [focusedId]);

  return (
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
        <WarpCamera />
        <CameraController />
        <System />
        <FocusRing />
      </SceneStoreProvider>
    </Canvas>
  );
}
