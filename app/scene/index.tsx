"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { CameraController } from "./CameraController";
import { FocusPanel } from "./FocusPanel";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import { useSphereStore } from "./store/sphere-store";
import type { SceneVariant } from "./types";

export type { SceneVariant } from "./types";

export default function Scene({
  variant = "mono",
}: {
  variant?: SceneVariant;
}) {
  const focusedId = useSphereStore((s) => s.focusedId);
  const setFocus = useSphereStore((s) => s.setFocus);
  // Selecting an orbiting body fires on pointerdown, but pointerup can land on
  // empty space (the body has moved) → onPointerMissed would immediately clear
  // the focus. Stamp the time of every select so the 300ms guard can suppress
  // that follow-up clear.
  const lastSelectAtRef = useRef(0);

  useEffect(() => {
    if (focusedId !== null) lastSelectAtRef.current = performance.now();
  }, [focusedId]);

  useEffect(() => {
    if (!focusedId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedId, setFocus]);

  const isMono = variant === "mono";

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{
          background: isMono
            ? "#f4f4f2"
            : "radial-gradient(circle at center, #0a0a1a 0%, #000 70%)",
        }}
        onPointerMissed={() => {
          if (performance.now() - lastSelectAtRef.current < 300) return;
          setFocus(null);
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
    </>
  );
}
