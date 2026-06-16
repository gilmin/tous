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

  // Explicit touch-steer state (coarse only). useThree's `pointer` keeps its last
  // value after release, so it can't tell "finger down" from "finger lifted" —
  // the analog model needs that, otherwise it would keep spinning after release.
  // We track press + signed NDC-x ourselves: steer only while pressed, idle when
  // released. Listening on the canvas (down) + window (move/up) catches a release
  // anywhere, even if the finger leaves the canvas.
  const pressedRef = useRef(false);
  const pointerXRef = useRef(0);
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
    const onDown = (e: PointerEvent) => {
      pressedRef.current = true;
      pointerXRef.current = ndcX(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (!pressedRef.current) return;
      pointerXRef.current = ndcX(e.clientX);
    };
    const onUp = () => {
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
      if (justUnfocused) rotationSpeedRef.current = IDLE_ROTATION_SPEED;
      // Steer only while a finger is down: far from center("나") = fast, near =
      // slow, left/right symmetric. Released → drift at idle (the 공전 the user
      // likes). Light lerp tracks the finger smoothly without cross-zero 저항감.
      const target = pressedRef.current
        ? touchSpinSpeed(pointerXRef.current, TOUCH_SPIN_SCALE)
        : IDLE_ROTATION_SPEED;
      rotationSpeedRef.current = THREE.MathUtils.lerp(
        rotationSpeedRef.current,
        target,
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
