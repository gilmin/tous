"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSceneStore } from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import { getBodyMesh } from "./store/body-mesh-registry";
import type { SceneVariant } from "./types";

export function FocusRing({ variant }: { variant: SceneVariant }) {
  const focusedId = useSceneStore((s) => s.focusedId);
  const focusedBody = useSceneStore((s) =>
    s.focusedId ? selectBodyById(s.tree, s.focusedId) : null,
  );
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const worldPos = useRef(new THREE.Vector3());
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current || !focusedId) return;
    const mesh = getBodyMesh(focusedId);
    if (!mesh) return;
    mesh.getWorldPosition(worldPos.current);
    groupRef.current.position.copy(worldPos.current);
    groupRef.current.lookAt(camera.position);
    if (ringRef.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 2.4) * 0.05;
      ringRef.current.scale.setScalar(scale);
    }
  });

  if (!focusedId || !focusedBody) return null;

  const inner = focusedBody.size * 1.5;
  const outer = focusedBody.size * 1.54;
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
