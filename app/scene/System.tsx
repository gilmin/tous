"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { IDLE_ROTATION_SPEED, MOUSE_INFLUENCE, LERP_FACTOR } from "./constants";
import { OrbitingBody } from "./OrbitingBody";
import { useSceneStore } from "./store/scene-store-context";
import type { SceneVariant } from "./types";

export function System({ variant }: { variant: SceneVariant }) {
  const rootId = useSceneStore((s) => s.tree.id);
  const focusedId = useSceneStore((s) => s.focusedId);
  const systemRef = useRef<THREE.Group>(null);
  const rotationSpeedRef = useRef(IDLE_ROTATION_SPEED);
  const { pointer } = useThree();
  const isPaused = focusedId !== null;

  useFrame((_, delta) => {
    if (!systemRef.current || isPaused) return;
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
      <OrbitingBody id={rootId} variant={variant} />
    </group>
  );
}
