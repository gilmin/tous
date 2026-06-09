"use client";

import { Canvas } from "@react-three/fiber";
import { Stars, Sparkles } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { CameraController } from "./CameraController";
import { FocusPanel } from "./FocusPanel";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import { BackgroundLife } from "./BackgroundLife";
import { useSphereStore } from "./store/sphere-store";
import { keyReducer } from "./store/key-reducer";
import type { SceneVariant } from "./types";

export type { SceneVariant } from "./types";

export default function Scene({
  variant = "mono",
}: {
  variant?: SceneVariant;
}) {
  const focusedId = useSphereStore((s) => s.focusedId);
  const mode = useSphereStore((s) => s.mode);
  const setFocus = useSphereStore((s) => s.setFocus);
  const focusNext = useSphereStore((s) => s.focusNext);
  const focusPrev = useSphereStore((s) => s.focusPrev);
  const setMode = useSphereStore((s) => s.setMode);
  // Selecting an orbiting body fires on pointerdown, but pointerup can land on
  // empty space (the body has moved) → onPointerMissed would immediately clear
  // the focus. Stamp the time of every select so the 300ms guard can suppress
  // that follow-up clear.
  const lastSelectAtRef = useRef(0);

  useEffect(() => {
    if (focusedId !== null) lastSelectAtRef.current = performance.now();
  }, [focusedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = keyReducer(
        { mode, hasFocus: focusedId !== null },
        {
          key: e.key,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        },
      );
      switch (action.type) {
        case "exit-edit":
        case "exit-add":
          setMode("normal");
          break;
        case "clear-focus":
          setFocus(null);
          break;
        case "nav-prev":
          e.preventDefault(); // arrows otherwise scroll the page
          focusPrev();
          break;
        case "nav-next":
          e.preventDefault();
          focusNext();
          break;
        case "tree-undo":
          e.preventDefault();
          useSphereStore.temporal.getState().undo();
          break;
        case "tree-redo":
          e.preventDefault();
          useSphereStore.temporal.getState().redo();
          break;
        case "noop":
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, focusedId, setFocus, focusNext, focusPrev, setMode]);

  const isMono = variant === "mono";

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50, near: 0.01, far: 200 }}
        style={{
          background: isMono
            ? "#f4f4f2"
            : // Kitsch arcade space: 여러 색 글로우를 겹쳐 단색 void 탈피.
              // 가운데 보라 코어 + 좌상 마젠타 + 우하 시안 누아주.
              "radial-gradient(circle at 22% 18%, rgba(255,90,180,0.40) 0%, rgba(255,90,180,0) 42%)," +
              "radial-gradient(circle at 82% 88%, rgba(70,200,255,0.34) 0%, rgba(70,200,255,0) 46%)," +
              "radial-gradient(circle at 50% 44%, #7a4fd0 0%, #512f9e 24%, #2f1d6e 50%, #18103f 76%, #0d0828 100%)",
        }}
        onPointerMissed={() => {
          if (performance.now() - lastSelectAtRef.current < 300) return;
          if (mode === "edit" || mode === "add") {
            setMode("normal");
            return;
          }
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
            {/* Lower ambient so the toon ramp actually bands (cel look); strong
                front key carves the lit/shadow split, warm sun glows the core. */}
            <ambientLight intensity={0.45} />
            <pointLight
              position={[0, 0, 0]}
              intensity={9}
              distance={40}
              color="#ffd9a8"
            />
            <directionalLight
              position={[3, 5, 4]}
              intensity={1.1}
              color="#ffffff"
            />
            <directionalLight
              position={[-4, -2, -3]}
              intensity={0.35}
              color="#ff7ad0"
            />
          </>
        )}
        {!isMono && (
          <>
            <Stars
              radius={70}
              depth={50}
              count={2600}
              factor={4.5}
              saturation={0.7}
              fade
              speed={0.3}
            />
            {/* Chunky twinkling sparkles → arcade/kitsch foreground glitter. */}
            <Sparkles
              count={70}
              scale={16}
              size={6}
              speed={0.4}
              opacity={0.8}
              color="#ffe9a8"
            />
            <Sparkles
              count={40}
              scale={12}
              size={4}
              speed={0.3}
              opacity={0.7}
              color="#9fe8ff"
            />
            {/* Sparse, tiny, far-back drifters → subtle living background (#8). */}
            <BackgroundLife />
          </>
        )}
        <CameraController />
        <System variant={variant} />
        <FocusRing variant={variant} />
      </Canvas>
      <FocusPanel variant={variant} />
    </>
  );
}
