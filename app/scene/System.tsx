"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  IDLE_ROTATION_SPEED,
  MOUSE_INFLUENCE,
  LERP_FACTOR,
  LABEL_CULL_SHOW,
  LABEL_CULL_HIDE,
  LABEL_CULL_SHOW_MOBILE,
  LABEL_CULL_HIDE_MOBILE,
} from "./constants";
import { OrbitingBody } from "./OrbitingBody";
import { useSceneStore } from "./store/scene-store-context";
import { useCoarsePointer } from "../_components/useCoarsePointer";

export function System() {
  const rootId = useSceneStore((s) => s.tree.id);
  const focusedId = useSceneStore((s) => s.focusedId);
  const systemRef = useRef<THREE.Group>(null);
  const rotationSpeedRef = useRef(IDLE_ROTATION_SPEED);
  const { pointer } = useThree();
  const isPaused = focusedId !== null;
  // Touch has no hover to reveal labels → looser culling so more stay visible.
  const coarse = useCoarsePointer();
  const labelShow = coarse ? LABEL_CULL_SHOW_MOBILE : LABEL_CULL_SHOW;
  const labelHide = coarse ? LABEL_CULL_HIDE_MOBILE : LABEL_CULL_HIDE;

  useFrame((_, delta) => {
    if (!systemRef.current || isPaused) return;
    if (coarse) {
      // Touch: direction comes from which side of center was tapped, at a FIXED
      // magnitude so a left tap spins exactly as fast as a right tap (no slower,
      // position-dependent left). Assigned directly — no lerp — so a reversing tap
      // responds immediately instead of bleeding off the old spin across zero;
      // that easing was the lingering 저항감. Before the first touch (pointer at 0)
      // a gentle idle drift plays; the pointer holds its last value after release,
      // so the drift keeps going (공전).
      const dir = Math.sign(pointer.x);
      rotationSpeedRef.current =
        dir === 0 ? IDLE_ROTATION_SPEED : dir * MOUSE_INFLUENCE;
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
