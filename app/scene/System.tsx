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
    // Touch taps jerk the pointer-driven rotation asymmetrically (tap side =
    // spin speed/direction); keep a steady idle spin on coarse pointers.
    const target = coarse
      ? IDLE_ROTATION_SPEED
      : IDLE_ROTATION_SPEED + pointer.x * MOUSE_INFLUENCE;
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
