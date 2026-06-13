"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { CameraController } from "./CameraController";
import { FocusPanel } from "./FocusPanel";
import { FocusRing } from "./FocusRing";
import { System } from "./System";
import { COSMIC_BG, CosmicScenery } from "./cosmic-env";
import { useUniverseStore } from "./store/universe-store";
import { keyReducer } from "./store/key-reducer";

export default function Scene() {
  const focusedId = useUniverseStore((s) => s.focusedId);
  const mode = useUniverseStore((s) => s.mode);
  const setFocus = useUniverseStore((s) => s.setFocus);
  const focusNext = useUniverseStore((s) => s.focusNext);
  const focusPrev = useUniverseStore((s) => s.focusPrev);
  const setMode = useUniverseStore((s) => s.setMode);
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
          useUniverseStore.temporal.getState().undo();
          break;
        case "tree-redo":
          e.preventDefault();
          useUniverseStore.temporal.getState().redo();
          break;
        case "noop":
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, focusedId, setFocus, focusNext, focusPrev, setMode]);

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50, near: 0.01, far: 200 }}
        style={{ background: COSMIC_BG }}
        onPointerMissed={() => {
          if (performance.now() - lastSelectAtRef.current < 300) return;
          if (mode === "edit" || mode === "add") {
            setMode("normal");
            return;
          }
          setFocus(null);
        }}
      >
        <CosmicScenery />
        <CameraController />
        <System />
        <FocusRing />
      </Canvas>
      <FocusPanel />
    </>
  );
}
