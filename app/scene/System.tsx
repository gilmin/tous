"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useRef } from "react";
import * as THREE from "three";
import { FocusContext } from "./FocusContext";
import { IDLE_ROTATION_SPEED, MOUSE_INFLUENCE, LERP_FACTOR } from "./constants";
import { OrbitingBody } from "./OrbitingBody";
import { SYSTEM } from "./seed";
import type { SceneVariant } from "./types";

export function System({ variant }: { variant: SceneVariant }) {
  const systemRef = useRef<THREE.Group>(null);
  const rotationSpeedRef = useRef(IDLE_ROTATION_SPEED);
  const { pointer } = useThree();
  const { focused } = useContext(FocusContext);
  const isPaused = focused !== null;

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
      <OrbitingBody body={SYSTEM} variant={variant} />
    </group>
  );
}
