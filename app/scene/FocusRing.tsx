"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useRef } from "react";
import * as THREE from "three";
import { FocusContext } from "./FocusContext";
import type { SceneVariant } from "./types";

export function FocusRing({ variant }: { variant: SceneVariant }) {
  const { focused } = useContext(FocusContext);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current || !focused) return;
    groupRef.current.position.copy(focused.position);
    groupRef.current.lookAt(camera.position);
    if (ringRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 2.4) * 0.05;
      ringRef.current.scale.setScalar(scale);
    }
  });

  if (!focused) return null;

  const inner = focused.size * 1.5;
  const outer = focused.size * 1.54;
  const color = variant === "mono" ? "#1a1a1a" : "#ffffff";

  return (
    <group ref={groupRef}>
      <mesh ref={ringRef}>
        <ringGeometry args={[inner, outer, 96]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
