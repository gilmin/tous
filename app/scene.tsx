"use client";

import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Stars, Line, Html } from "@react-three/drei";
import {
  useRef,
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import * as THREE from "three";
import { PlanetMesh, type PlanetShape } from "./_components/Planet";

const IDLE_ROTATION_SPEED = 0.05;
const MOUSE_INFLUENCE = 2.5;
const LERP_FACTOR = 0.08;

const LABEL_FADE_NEAR = 6;
const LABEL_FADE_FAR = 11;

const CAMERA_LERP = 0.06;
const DEFAULT_CAM_POS = new THREE.Vector3(0, 2, 8);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

export type SceneVariant = "mono" | "cosmic";

type OrbitalBody = {
  id: string;
  label?: string;
  size: number;
  color: string;
  emissive?: string;
  /**
   * Organic shape variant. Defaults to "smooth" (a clean sphere) so existing
   * data without a shape keeps the original look. See Planet.tsx for the full
   * set of 20 shape ids.
   */
  shape?: PlanetShape;
  selfRotation?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  inclination?: number;
  phase?: number;
  children?: OrbitalBody[];
};

type FocusedState = {
  id: string;
  label: string;
  position: THREE.Vector3;
  size: number;
};

type FocusContextValue = {
  focused: FocusedState | null;
  setFocused: (s: FocusedState | null) => void;
};

const FocusContext = createContext<FocusContextValue>({
  focused: null,
  setFocused: () => {},
});

// ─────────────────────────────────────────────────────────
// Shape mapping: each planet's meaning → organic shape variant.
// Add/edit `shape` on any body to remap. See Planet.tsx for the catalogue.
// ─────────────────────────────────────────────────────────
const SYSTEM: OrbitalBody = {
  id: "self",
  label: "나",
  size: 0.6,
  color: "#ffd97a",
  emissive: "#ff8c1a",
  shape: "smooth", // 매끄러운 중심
  selfRotation: 0.05,
  children: [
    {
      id: "p1",
      label: "자유",
      size: 0.18,
      color: "#7ab0d8",
      shape: "cluster", // 흩어진 덩어리 — 여러 갈래의 자유
      orbitRadius: 1.6,
      orbitSpeed: 0.45,
      inclination: 0.1,
      phase: 0,
      selfRotation: 0.3,
      children: [
        {
          id: "p1m1",
          label: "선택",
          size: 0.06,
          color: "#cfd8e3",
          shape: "smooth", // 작은 매끄러운 위성
          orbitRadius: 0.35,
          orbitSpeed: 1.5,
          inclination: 0.3,
          phase: 0,
        },
      ],
    },
    {
      id: "p2",
      label: "외로움",
      size: 0.22,
      color: "#d68ea8",
      shape: "oblong", // 길쭉한 비대칭 — 홀로 떠 있는
      orbitRadius: 2.4,
      orbitSpeed: 0.3,
      inclination: -0.15,
      phase: Math.PI * 0.7,
      selfRotation: 0.2,
      children: [
        {
          id: "p2m1",
          label: "관계",
          size: 0.07,
          color: "#e8d0d8",
          shape: "conjoined", // 두 덩어리 — 연결
          orbitRadius: 0.4,
          orbitSpeed: 1.2,
          inclination: 0.2,
          phase: 0,
        },
        {
          id: "p2m2",
          label: "고독",
          size: 0.05,
          color: "#f0e0e6",
          shape: "crystal", // 작고 날카로운 결정
          orbitRadius: 0.6,
          orbitSpeed: 0.9,
          inclination: -0.1,
          phase: Math.PI,
        },
      ],
    },
    {
      id: "p3",
      label: "호기심",
      size: 0.14,
      color: "#a8d68e",
      shape: "tentacle", // 사방으로 뻗어나가는
      orbitRadius: 3.2,
      orbitSpeed: 0.22,
      inclination: 0.25,
      phase: Math.PI * 1.3,
      selfRotation: 0.4,
    },
    {
      id: "p4",
      label: "두려움",
      size: 0.1,
      color: "#e0b070",
      shape: "cratered", // 패인 자국이 남은
      orbitRadius: 4.0,
      orbitSpeed: 0.15,
      inclination: -0.2,
      phase: Math.PI * 0.3,
      selfRotation: 0.25,
    },
  ],
};

function monoShade(size: number) {
  const norm = THREE.MathUtils.clamp(size / 0.7, 0.15, 0.92);
  const v = Math.round(norm * 175) + 55;
  return `rgb(${v},${v},${v})`;
}

function getBodyColor(body: OrbitalBody, variant: SceneVariant) {
  return variant === "mono" ? monoShade(body.size) : body.color;
}

function getEmissiveSettings(body: OrbitalBody, variant: SceneVariant) {
  if (variant === "mono") return { color: "#000000", intensity: 0 };
  if (!body.emissive) return { color: "#000000", intensity: 0 };
  return { color: body.emissive, intensity: 0.8 };
}

function getLineColor(body: OrbitalBody, variant: SceneVariant) {
  if (variant === "mono") return "#444";
  return body.color;
}

function FocusRing({ variant }: { variant: SceneVariant }) {
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

function CameraController() {
  const { focused } = useContext(FocusContext);
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3().copy(DEFAULT_LOOK_AT));

  useFrame(() => {
    let desiredPos: THREE.Vector3;
    let desiredLook: THREE.Vector3;

    if (focused) {
      const offset = new THREE.Vector3(
        0,
        focused.size * 0.6,
        focused.size * 4 + 0.9,
      );
      desiredPos = new THREE.Vector3().copy(focused.position).add(offset);
      desiredLook = focused.position;
    } else {
      desiredPos = DEFAULT_CAM_POS;
      desiredLook = DEFAULT_LOOK_AT;
    }

    camera.position.lerp(desiredPos, CAMERA_LERP);
    lookAtRef.current.lerp(desiredLook, CAMERA_LERP);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

function OrbitingBody({
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

function System({ variant }: { variant: SceneVariant }) {
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

function FocusPanel({ variant }: { variant: SceneVariant }) {
  const { focused, setFocused } = useContext(FocusContext);
  if (!focused) return null;

  const isMono = variant === "mono";

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 36,
        transform: "translateX(-50%)",
        zIndex: 30,
        padding: "14px 22px",
        minWidth: 220,
        textAlign: "center",
        background: isMono
          ? "rgba(255,255,255,0.85)"
          : "rgba(15,15,20,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: isMono
          ? "1px solid rgba(0,0,0,0.08)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        color: isMono ? "#1a1a1a" : "#f5f5f7",
        fontFamily: "system-ui, sans-serif",
        boxShadow: isMono
          ? "0 8px 24px rgba(0,0,0,0.06)"
          : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.01em" }}>
        {focused.label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          opacity: 0.55,
        }}
      >
        빈 공간 클릭 또는 ESC로 닫기
      </div>
      <button
        onClick={() => setFocused(null)}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          width: 24,
          height: 24,
          padding: 0,
          background: "transparent",
          border: "none",
          color: isMono ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}

export default function Scene({
  variant = "mono",
}: {
  variant?: SceneVariant;
}) {
  const [focused, setFocusedState] = useState<FocusedState | null>(null);
  // Selecting an orbiting body fires on pointerdown, but pointerup lands on
  // empty space (the body has moved) → onPointerMissed would immediately
  // clear the focus. Suppress that for a short window after a select.
  const lastSelectAtRef = useRef(0);

  const setFocused = useCallback((next: FocusedState | null) => {
    // Only stamp on select (next !== null) — clearing focus intentionally
    // leaves the old timestamp so onPointerMissed can still honor the guard.
    if (next !== null) lastSelectAtRef.current = performance.now();
    setFocusedState(next);
  }, []);

  useEffect(() => {
    if (!focused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, setFocused]);

  const isMono = variant === "mono";

  return (
    <FocusContext.Provider value={{ focused, setFocused }}>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{
          background: isMono
            ? "#f4f4f2"
            : "radial-gradient(circle at center, #0a0a1a 0%, #000 70%)",
        }}
        onPointerMissed={() => {
          // 300ms covers the gap between pointerdown (select) and pointerup
          // (which lands on empty space because the body has orbited away).
          if (performance.now() - lastSelectAtRef.current < 300) return;
          setFocused(null);
        }}
      >
        {isMono ? (
          <>
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 6, 5]} intensity={1.4} />
            <directionalLight position={[-3, -2, -4]} intensity={0.4} />
          </>
        ) : (
          <>
            <ambientLight intensity={0.3} />
            <pointLight
              position={[0, 0, 0]}
              intensity={12}
              distance={30}
              color="#ffaa55"
            />
          </>
        )}
        {!isMono && (
          <Stars
            radius={50}
            depth={50}
            count={3000}
            factor={3}
            fade
            speed={0.3}
          />
        )}
        <CameraController />
        <System variant={variant} />
        <FocusRing variant={variant} />
      </Canvas>
      <FocusPanel variant={variant} />
    </FocusContext.Provider>
  );
}
