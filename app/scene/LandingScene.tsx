"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PlanetMesh } from "../_components/Planet";
import { COSMIC_BG, CosmicScenery } from "./cosmic-env";
import { SYSTEM } from "./seed";

// The lone "나" (Self), gently pulsing — the heart of an as-yet-unmade universe.
// Used only on the landing (/), with no children, interaction, or store: a calm
// hero that invites the visitor in.
function PulsingSelf() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Slow heartbeat-ish swell + a lazy spin.
    ref.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.07);
    ref.current.rotation.y += 0.0015;
  });
  return (
    <PlanetMesh
      meshRef={ref}
      shape={SYSTEM.shape ?? "smooth"}
      size={SYSTEM.size}
      color={SYSTEM.color}
      emissive={SYSTEM.emissive ?? "#000000"}
      emissiveIntensity={SYSTEM.emissive ? 0.8 : 0}
      roughness={0.5}
      metalness={0.1}
      toon
      pattern="none"
    />
  );
}

export default function LandingScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 50, near: 0.01, far: 200 }}
      style={{ background: COSMIC_BG }}
    >
      <CosmicScenery />
      <PulsingSelf />
    </Canvas>
  );
}
