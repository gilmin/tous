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
    // Touch: symmetric directional spin — tapping left of center spins left,
    // right spins right (same magnitude, no idle bias). Desktop keeps the idle
    // drift + pointer parallax.
    const target = coarse
      ? pointer.x * MOUSE_INFLUENCE
      : IDLE_ROTATION_SPEED + pointer.x * MOUSE_INFLUENCE;
    // Touch: a tap opposing the current spin snaps straight to the new direction
    // instead of easing across zero. Without this the leftward tap has to bleed
    // off the residual rightward spin first — felt as 저항감 / a slower left. A
    // same-direction change still eases. Desktop always eases (floaty drift).
    const reversing =
      coarse &&
      Math.abs(target) > 1e-3 &&
      Math.sign(target) !== Math.sign(rotationSpeedRef.current);
    rotationSpeedRef.current = reversing
      ? target
      : THREE.MathUtils.lerp(rotationSpeedRef.current, target, LERP_FACTOR);
    systemRef.current.rotation.y += rotationSpeedRef.current * delta;
  });

  return (
    <group ref={systemRef}>
      <OrbitingBody id={rootId} labelShow={labelShow} labelHide={labelHide} />
    </group>
  );
}
