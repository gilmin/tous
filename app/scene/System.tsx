"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  IDLE_ROTATION_SPEED,
  MOUSE_INFLUENCE,
  LERP_FACTOR,
  TOUCH_SPIN_SCALE,
  TOUCH_LERP_FACTOR,
  LABEL_CULL_SHOW,
  LABEL_CULL_HIDE,
  LABEL_CULL_SHOW_MOBILE,
  LABEL_CULL_HIDE_MOBILE,
} from "./constants";
import { touchSpinSpeed } from "./touch-spin";
import { OrbitingBody } from "./OrbitingBody";
import { useSceneStore } from "./store/scene-store-context";
import { useCoarsePointer } from "../_components/useCoarsePointer";

export function System() {
  const rootId = useSceneStore((s) => s.tree.id);
  const focusedId = useSceneStore((s) => s.focusedId);
  const systemRef = useRef<THREE.Group>(null);
  const rotationSpeedRef = useRef(IDLE_ROTATION_SPEED);
  const { pointer, gl } = useThree();
  const isPaused = focusedId !== null;
  // Touch has no hover to reveal labels → looser culling so more stay visible.
  const coarse = useCoarsePointer();
  const labelShow = coarse ? LABEL_CULL_SHOW_MOBILE : LABEL_CULL_SHOW;
  const labelHide = coarse ? LABEL_CULL_HIDE_MOBILE : LABEL_CULL_HIDE;

  // Touch steering state (coarse only). A tap (or drag) sets the spin from where
  // it lands — speed ∝ distance from center("나"), via touchSpinSpeed — and it
  // KEEPS going after the finger lifts, until the next tap (tap, don't hold).
  // targetSpeedRef persists that across release; pressedRef only gates the move
  // handler so a stray hover doesn't re-steer. Coming out of focus resets to idle.
  // Listening on canvas (down) + window (move/up) catches a release anywhere.
  const pressedRef = useRef(false);
  const targetSpeedRef = useRef(IDLE_ROTATION_SPEED);
  // Track focus state across frames so we can spot the unfocus transition.
  const wasPausedRef = useRef(false);

  useEffect(() => {
    if (!coarse) return;
    const canvas = gl.domElement;
    const ndcX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return 0;
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      return Math.max(-1, Math.min(1, x));
    };
    const steer = (clientX: number) => {
      targetSpeedRef.current = touchSpinSpeed(ndcX(clientX), TOUCH_SPIN_SCALE);
    };
    const onDown = (e: PointerEvent) => {
      pressedRef.current = true;
      steer(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (pressedRef.current) steer(e.clientX);
    };
    const onUp = () => {
      // Finger lifted — keep the last tap's spin (don't reset to idle).
      pressedRef.current = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [coarse, gl]);

  useFrame((_, delta) => {
    if (!systemRef.current) return;
    // On the focus→unfocus transition resume at the gentle idle speed rather than
    // whatever steer speed was held before focus (touch only; desktop unchanged).
    const justUnfocused = wasPausedRef.current && !isPaused;
    wasPausedRef.current = isPaused;
    if (isPaused) return;

    if (coarse) {
      // Coming out of focus, resume the gentle idle drift rather than whatever
      // speed the last tap left spinning.
      if (justUnfocused) {
        targetSpeedRef.current = IDLE_ROTATION_SPEED;
        rotationSpeedRef.current = IDLE_ROTATION_SPEED;
      }
      // Hold the last tap's speed (far from center("나") = fast, near = slow,
      // left/right symmetric); a light lerp eases the change between taps.
      rotationSpeedRef.current = THREE.MathUtils.lerp(
        rotationSpeedRef.current,
        targetSpeedRef.current,
        TOUCH_LERP_FACTOR,
      );
      systemRef.current.rotation.y += rotationSpeedRef.current * delta;
      return;
    }

    // Desktop: gentle idle drift + pointer parallax, eased for a floaty feel.
    const target = IDLE_ROTATION_SPEED + pointer.x * MOUSE_INFLUENCE;
    rotationSpeedRef.current = THREE.MathUtils.lerp(
      rotationSpeedRef.current,
      target,
      LERP_FACTOR,
    );
    systemRef.current.rotation.y += rotationSpeedRef.current * delta;
  });

  return (
    <group ref={systemRef}>
      <OrbitingBody id={rootId} labelShow={labelShow} labelHide={labelHide} />
    </group>
  );
}
