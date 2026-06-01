"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PlanetMesh } from "../_components/Planet";
import { LABEL_FADE_NEAR, LABEL_FADE_FAR } from "./constants";
import { useSceneStore } from "./store/scene-store-context";
import { selectBodyById } from "./store/tree-ops";
import {
  registerBodyMesh,
  unregisterBodyMesh,
} from "./store/body-mesh-registry";
import { getBodyColor, getEmissiveSettings, getLineColor } from "./utils";
import type { SceneVariant } from "./types";

export const OrbitingBody = memo(function OrbitingBody({
  id,
  variant,
}: {
  id: string;
  variant: SceneVariant;
}) {
  const body = useSceneStore((s) => selectBodyById(s.tree, id));
  const focusedId = useSceneStore((s) => s.focusedId);
  const setFocus = useSceneStore((s) => s.setFocus);

  const orbitRef = useRef<THREE.Group>(null);
  const selfRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const worldPos = useRef(new THREE.Vector3());
  const isPaused = focusedId !== null;
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const mesh = selfRef.current;
    if (!mesh) return;
    registerBodyMesh(id, mesh);
    return () => unregisterBodyMesh(id, mesh);
  }, [id]);

  useFrame((state, delta) => {
    if (!body) return;
    if (orbitRef.current && body.orbitSpeed && !isPaused) {
      orbitRef.current.rotation.y += body.orbitSpeed * delta;
    }
    if (selfRef.current && body.selfRotation) {
      selfRef.current.rotation.y += body.selfRotation * delta;
    }
    if (selfRef.current) {
      // Hover grows the body ~5%. Lerp (not snap) to match the scene's
      // existing lerp-based motion feel; frame-rate independent.
      const target = hovered ? 1.05 : 1;
      const next = THREE.MathUtils.lerp(
        selfRef.current.scale.x,
        target,
        1 - Math.exp(-12 * delta),
      );
      selfRef.current.scale.setScalar(next);
    }
    if (selfRef.current && labelRef.current) {
      selfRef.current.getWorldPosition(worldPos.current);
      const distance = state.camera.position.distanceTo(worldPos.current);
      const opacity = THREE.MathUtils.clamp(
        1 - (distance - LABEL_FADE_NEAR) / (LABEL_FADE_FAR - LABEL_FADE_NEAR),
        0,
        1,
      );
      // Hover forces the label visible, ignoring distance fade.
      labelRef.current.style.opacity = hovered ? "1" : opacity.toFixed(3);
    }
  });

  const handleSelect = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!body?.label) return;
      setFocus(id);
    },
    [body?.label, id, setFocus],
  );

  if (!body) return null;

  const hasOrbit = (body.orbitRadius ?? 0) > 0;
  const color = getBodyColor(body, variant);
  const emissive = getEmissiveSettings(body, variant);
  const lineColor = getLineColor(body, variant);

  const labelYOffset = body.size + 0.18;
  const labelMono = variant === "mono";

  return (
    <group ref={orbitRef} rotation={[body.inclination ?? 0, body.phase ?? 0, 0]}>
      {hasOrbit && (
        <Line
          points={[
            [0, 0, 0],
            [body.orbitRadius ?? 0, 0, 0],
          ]}
          color={lineColor}
          lineWidth={variant === "mono" ? 1.2 : 1}
          opacity={variant === "mono" ? 0.5 : 0.25}
          transparent
        />
      )}
      <group
        position={[body.orbitRadius ?? 0, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <PlanetMesh
          meshRef={selfRef}
          shape={body.shape ?? "smooth"}
          size={body.size}
          color={color}
          emissive={emissive.color}
          emissiveIntensity={emissive.intensity}
          roughness={variant === "mono" ? 0.75 : 0.5}
          metalness={variant === "mono" ? 0.05 : 0.1}
          onSelect={handleSelect}
        />
        {body.label && focusedId !== body.id && (
          <Html
            position={[0, labelYOffset, 0]}
            center
            distanceFactor={8}
            zIndexRange={[0, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              ref={labelRef}
              style={{
                color: labelMono
                  ? "rgba(30,30,30,0.9)"
                  : "rgba(255,255,255,0.94)",
                fontSize: "11px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                textShadow: labelMono
                  ? "none"
                  : "0 0 5px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
                letterSpacing: "0.02em",
                userSelect: "none",
                transform: "translate(-50%, -50%)",
              }}
            >
              {body.label}
            </div>
          </Html>
        )}
        {body.children?.map((child) => (
          <OrbitingBody key={child.id} id={child.id} variant={variant} />
        ))}
      </group>
    </group>
  );
});
