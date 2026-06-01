"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { CameraController } from "./CameraController";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import {
  SceneStoreProvider,
  createPublicSphereStore,
} from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import type { OrbitalBody } from "./types";

// Read-only viewer for a foreign (public) sphere at /s/[code]. Reuses the
// editable scene's 3D components via an injected read-only store — same
// hover / focus / camera behaviour, but no editing, persistence, or keyboard.
export default function PublicScene({ tree }: { tree: OrbitalBody }) {
  // One store per view (lazy init → created once, never on rerender).
  const [store] = useState(() => createPublicSphereStore(tree));
  const setFocus = useStore(store, (s) => s.setFocus);
  const focusedId = useStore(store, (s) => s.focusedId);
  const focusedLabel = useStore(store, (s) =>
    s.focusedId ? (selectBodyById(s.tree, s.focusedId)?.label ?? null) : null,
  );

  // Selecting a moving body fires on pointerdown; the pointerup can land on
  // empty space → onPointerMissed would instantly clear it. Stamp each select
  // so a 300ms guard suppresses that follow-up clear (mirrors the editor).
  const lastSelectAtRef = useRef(0);
  useEffect(() => {
    if (focusedId !== null) lastSelectAtRef.current = performance.now();
  }, [focusedId]);

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: "#f4f4f2" }}
        onPointerMissed={() => {
          if (performance.now() - lastSelectAtRef.current < 300) return;
          setFocus(null);
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <directionalLight position={[-3, -2, -4]} intensity={0.4} />
        <SceneStoreProvider store={store}>
          <CameraController />
          <System variant="mono" />
          <FocusRing variant="mono" />
        </SceneStoreProvider>
      </Canvas>
      {focusedLabel && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 36,
            transform: "translateX(-50%)",
            zIndex: 30,
            padding: "12px 22px",
            minWidth: 180,
            textAlign: "center",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            color: "#1a1a1a",
            fontFamily: "system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.01em",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {focusedLabel}
        </div>
      )}
    </>
  );
}
