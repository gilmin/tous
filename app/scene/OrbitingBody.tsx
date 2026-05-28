"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import { useCallback, useContext, useRef } from "react";
import * as THREE from "three";
import { PlanetMesh } from "../_components/Planet";
import { FocusContext } from "./FocusContext";
import { LABEL_FADE_NEAR, LABEL_FADE_FAR } from "./constants";
import { getBodyColor, getEmissiveSettings, getLineColor } from "./utils";
import type { OrbitalBody, SceneVariant } from "./types";

export function OrbitingBody({
  body,
  variant,
}: {
  body: OrbitalBody;
  variant: SceneVariant;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const selfRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const worldPos = useRef(new THREE.Vector3());
  const { focused, setFocused } = useContext(FocusContext);
  const isPaused = focused !== null;

  useFrame((state, delta) => {
    if (orbitRef.current && body.orbitSpeed && !isPaused) {
      orbitRef.current.rotation.y += body.orbitSpeed * delta;
    }
    if (selfRef.current && body.selfRotation) {
      selfRef.current.rotation.y += body.selfRotation * delta;
    }
    if (selfRef.current && labelRef.current) {
      selfRef.current.getWorldPosition(worldPos.current);
      const distance = state.camera.position.distanceTo(worldPos.current);
      const opacity = THREE.MathUtils.clamp(
        1 - (distance - LABEL_FADE_NEAR) / (LABEL_FADE_FAR - LABEL_FADE_NEAR),
        0,
        1,
      );
      labelRef.current.style.opacity = opacity.toFixed(3);
    }
  });

  const handleSelect = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!selfRef.current || !body.label) return;
      const pos = new THREE.Vector3();
      selfRef.current.getWorldPosition(pos);
      setFocused({
        id: body.id,
        label: body.label,
        position: pos,
        size: body.size,
      });
    },
    [body.id, body.label, body.size, setFocused],
  );

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
      <group position={[body.orbitRadius ?? 0, 0, 0]}>
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
        {body.label && focused?.id !== body.id && (
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
          <OrbitingBody key={child.id} body={child} variant={variant} />
        ))}
      </group>
    </group>
  );
}
