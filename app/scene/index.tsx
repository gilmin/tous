"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { FocusContext } from "./FocusContext";
import { CameraController } from "./CameraController";
import { FocusPanel } from "./FocusPanel";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import type { FocusedState, SceneVariant } from "./types";

export type { SceneVariant } from "./types";

export default function Scene({
  variant = "mono",
}: {
  variant?: SceneVariant;
}) {
  const [focused, setFocusedState] = useState<FocusedState | null>(null);
  // Selecting an orbiting body fires on pointerdown, but pointerup lands on
  // empty space (the body has moved) → onPointerMissed would immediately
  // clear the focus. Suppress that for a short window after a select.
  const lastSelectAtRef = useRef(0);

  const setFocused = useCallback((next: FocusedState | null) => {
    // Only stamp on select (next !== null) — clearing focus intentionally
    // leaves the old timestamp so onPointerMissed can still honor the guard.
    if (next !== null) lastSelectAtRef.current = performance.now();
    setFocusedState(next);
  }, []);

  useEffect(() => {
    if (!focused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, setFocused]);

  const isMono = variant === "mono";

  return (
    <FocusContext.Provider value={{ focused, setFocused }}>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{
          background: isMono
            ? "#f4f4f2"
            : "radial-gradient(circle at center, #0a0a1a 0%, #000 70%)",
        }}
        onPointerMissed={() => {
          // 300ms covers the gap between pointerdown (select) and pointerup
          // (which lands on empty space because the body has orbited away).
          if (performance.now() - lastSelectAtRef.current < 300) return;
          setFocused(null);
        }}
      >
        {isMono ? (
          <>
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 6, 5]} intensity={1.4} />
            <directionalLight position={[-3, -2, -4]} intensity={0.4} />
          </>
        ) : (
          <>
            <ambientLight intensity={0.3} />
            <pointLight
              position={[0, 0, 0]}
              intensity={12}
              distance={30}
              color="#ffaa55"
            />
          </>
        )}
        {!isMono && (
          <Stars
            radius={50}
            depth={50}
            count={3000}
            factor={3}
            fade
            speed={0.3}
          />
        )}
        <CameraController />
        <System variant={variant} />
        <FocusRing variant={variant} />
      </Canvas>
      <FocusPanel variant={variant} />
    </FocusContext.Provider>
  );
}
