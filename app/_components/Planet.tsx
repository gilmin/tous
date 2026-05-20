"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ─────────────────────────────────────────────────────────
// 3D value noise
// ─────────────────────────────────────────────────────────
function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453123;
  return n - Math.floor(n);
}
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const w = smoothstep(zf);
  const c000 = hash3(xi,     yi,     zi    );
  const c100 = hash3(xi + 1, yi,     zi    );
  const c010 = hash3(xi,     yi + 1, zi    );
  const c110 = hash3(xi + 1, yi + 1, zi    );
  const c001 = hash3(xi,     yi,     zi + 1);
  const c101 = hash3(xi + 1, yi,     zi + 1);
  const c011 = hash3(xi,     yi + 1, zi + 1);
  const c111 = hash3(xi + 1, yi + 1, zi + 1);
  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return (y0 + (y1 - y0) * w) * 2 - 1;
}
function fbm(x: number, y: number, z: number, octaves = 3): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    v += noise3(x * f, y * f, z * f) * a;
    f *= 2;
    a *= 0.5;
  }
  return v;
}

// ─────────────────────────────────────────────────────────
// SDF helpers for metaball variants
// ─────────────────────────────────────────────────────────
function smoothMinSDF(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * h * k * (1 / 6);
}
function sphereSDF(p: THREE.Vector3, c: THREE.Vector3, r: number): number {
  return p.distanceTo(c) - r;
}
const _tmpV = new THREE.Vector3();
function metaballSurface(
  dir: THREE.Vector3,
  centers: THREE.Vector3[],
  radii: number[],
  kSmooth: number,
  maxT = 2.4,
): THREE.Vector3 {
  let lo = 0;
  let hi = maxT;
  for (let i = 0; i < 28; i++) {
    const m = (lo + hi) / 2;
    _tmpV.copy(dir).multiplyScalar(m);
    let sdf = sphereSDF(_tmpV, centers[0], radii[0]);
    for (let j = 1; j < centers.length; j++) {
      sdf = smoothMinSDF(sdf, sphereSDF(_tmpV, centers[j], radii[j]), kSmooth);
    }
    if (sdf > 0) hi = m;
    else lo = m;
  }
  const t = (lo + hi) / 2;
  return new THREE.Vector3().copy(dir).multiplyScalar(t);
}

// ─────────────────────────────────────────────────────────
// Variant catalogue (20 shapes)
// ─────────────────────────────────────────────────────────
export type PlanetShape =
  | "smooth"
  | "pebble"
  | "lumpy"
  | "potato"
  | "oblong"
  | "kidney"
  | "dimpled"
  | "cratered"
  | "fissured"
  | "rippled"
  | "facet"
  | "crystal"
  | "ringed"
  | "banded"
  | "doubleRing"
  | "tentacle"
  | "spike"
  | "finned"
  | "conjoined"
  | "cluster";

type AccessoryMaterialProps = {
  color: THREE.ColorRepresentation;
  emissive: THREE.ColorRepresentation;
  emissiveIntensity: number;
};

type Variant = {
  id: PlanetShape;
  detail: number;
  flat?: boolean;
  build: (p: THREE.Vector3, r: number) => THREE.Vector3;
  accessory?: (r: number, mat: AccessoryMaterialProps) => THREE.Object3D[];
  breath: number;
};

function makeAccessoryMaterial(props: AccessoryMaterialProps): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: props.color,
    emissive: props.emissive,
    emissiveIntensity: props.emissiveIntensity * 0.6,
    roughness: 0.55,
    metalness: 0.15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });
}

const VARIANTS: Variant[] = [
  {
    id: "smooth",
    detail: 4,
    build: (p, r) => p.clone().multiplyScalar(r),
    breath: 0.022,
  },
  {
    id: "pebble",
    detail: 4,
    build: (p, r) => {
      const n = fbm(p.x * 8, p.y * 8, p.z * 8, 3);
      return p.clone().multiplyScalar(r * (1 + 0.04 * n));
    },
    breath: 0.015,
  },
  {
    id: "lumpy",
    detail: 4,
    build: (p, r) => {
      const n = fbm(p.x * 2.4 + 3.1, p.y * 2.4, p.z * 2.4, 2);
      return p.clone().multiplyScalar(r * (1 + 0.13 * n));
    },
    breath: 0.020,
  },
  {
    id: "potato",
    detail: 4,
    build: (p, r) => {
      const n = fbm(p.x * 1.2 + 5, p.y * 1.2 - 2, p.z * 1.2 + 1, 2);
      return p.clone().multiplyScalar(r * (1 + 0.22 * n));
    },
    breath: 0.018,
  },
  {
    id: "oblong",
    detail: 4,
    build: (p, r) => {
      const q = p.clone();
      q.z *= 1.55;
      q.x *= 0.82;
      q.y *= 0.9;
      const n = fbm(p.x * 2 + 9, p.y * 2, p.z * 2, 2);
      q.multiplyScalar(r * (1 + 0.05 * n));
      return q;
    },
    breath: 0.022,
  },
  {
    id: "kidney",
    detail: 4,
    build: (p, r) => {
      const pinch = Math.max(0, p.x - 0.15);
      const factor = 1 - 0.38 * Math.pow(pinch, 1.4);
      const n = fbm(p.x * 2 - 4, p.y * 2 + 7, p.z * 2, 2);
      return p.clone().multiplyScalar(r * factor * (1 + 0.04 * n));
    },
    breath: 0.020,
  },
  {
    id: "dimpled",
    detail: 5,
    build: (p, r) => {
      const n = fbm(p.x * 6, p.y * 6, p.z * 6, 2);
      const dimple = Math.max(0, n - 0.15) * 0.5;
      return p.clone().multiplyScalar(r * (1 - dimple));
    },
    breath: 0.014,
  },
  {
    id: "cratered",
    detail: 5,
    build: (p, r) => {
      const craters = [
        { c: new THREE.Vector3( 1.0,  0.5,  0.2).normalize(), s: 0.30, d: 0.22 },
        { c: new THREE.Vector3(-0.6, -0.4,  0.7).normalize(), s: 0.34, d: 0.18 },
        { c: new THREE.Vector3( 0.2,  0.9, -0.3).normalize(), s: 0.26, d: 0.16 },
        { c: new THREE.Vector3(-0.3,  0.6,  0.8).normalize(), s: 0.20, d: 0.12 },
        { c: new THREE.Vector3( 0.8, -0.5, -0.4).normalize(), s: 0.24, d: 0.15 },
      ];
      let disp = 0.04 * fbm(p.x * 3, p.y * 3, p.z * 3, 2);
      for (const cr of craters) {
        const d = p.distanceTo(cr.c);
        if (d < cr.s * 1.6) {
          const t = d / cr.s;
          if (t < 1) disp += -cr.d * (1 - t * t);
          else disp += cr.d * 0.35 * (1 - (t - 1) / 0.6);
        }
      }
      return p.clone().multiplyScalar(r * (1 + disp));
    },
    breath: 0.012,
  },
  {
    id: "fissured",
    detail: 5,
    build: (p, r) => {
      const t = Math.atan2(p.y, p.x);
      const ridge = Math.sin(t * 5) * 0.5 + 0.5;
      const valley = Math.pow(ridge, 8) * 0.20;
      const n = fbm(p.x * 4, p.y * 4, p.z * 2, 2);
      return p.clone().multiplyScalar(r * (1 - valley + 0.025 * n));
    },
    breath: 0.014,
  },
  {
    id: "rippled",
    detail: 5,
    build: (p, r) => {
      const lat = Math.asin(THREE.MathUtils.clamp(p.y, -1, 1));
      const ripple = Math.sin(lat * 8) * 0.045;
      return p.clone().multiplyScalar(r * (1 + ripple));
    },
    breath: 0.016,
  },
  {
    id: "facet",
    detail: 1,
    flat: true,
    build: (p, r) => {
      const n = fbm(p.x * 1.2, p.y * 1.2, p.z * 1.2, 1);
      return p.clone().multiplyScalar(r * (1 + 0.04 * n));
    },
    breath: 0.022,
  },
  {
    id: "crystal",
    detail: 1,
    flat: true,
    build: (p, r) => {
      const q = p.clone();
      q.z *= 1.5;
      q.normalize().multiplyScalar(r);
      q.z *= 1.4;
      return q;
    },
    breath: 0.020,
  },
  {
    id: "ringed",
    detail: 4,
    build: (p, r) => p.clone().multiplyScalar(r * (1 + 0.03 * fbm(p.x * 2, p.y * 2, p.z * 2, 2))),
    accessory: (r, mat) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r * 1.7, r * 0.025, 10, 96),
        makeAccessoryMaterial(mat),
      );
      ring.rotation.x = Math.PI / 2 + 0.22;
      ring.rotation.z = 0.05;
      return [ring];
    },
    breath: 0.018,
  },
  {
    id: "banded",
    detail: 4,
    build: (p, r) => {
      const band = Math.max(0, 1 - Math.abs(p.y) * 6);
      const n = fbm(p.x * 3, p.y * 3, p.z * 3, 2);
      return p.clone().multiplyScalar(r * (1 + 0.13 * band + 0.025 * n));
    },
    breath: 0.018,
  },
  {
    id: "doubleRing",
    detail: 4,
    build: (p, r) => p.clone().multiplyScalar(r * (1 + 0.025 * fbm(p.x * 2.4, p.y * 2.4, p.z * 2.4, 2))),
    accessory: (r, mat) => {
      const m = makeAccessoryMaterial(mat);
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.65, r * 0.022, 10, 96), m);
      ring1.rotation.x = Math.PI / 2 + 0.15;
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.4, r * 0.022, 10, 96), m.clone());
      ring2.rotation.x = Math.PI / 2 - 0.7;
      ring2.rotation.y = 0.5;
      return [ring1, ring2];
    },
    breath: 0.016,
  },
  {
    id: "tentacle",
    detail: 5,
    build: (p, r) => {
      const axes = [
        new THREE.Vector3( 1.0,  0.2,  0.3).normalize(),
        new THREE.Vector3(-0.5,  0.8,  0.2).normalize(),
        new THREE.Vector3(-0.3, -0.7, -0.6).normalize(),
        new THREE.Vector3( 0.4, -0.6,  0.7).normalize(),
        new THREE.Vector3( 0.2,  0.6, -0.8).normalize(),
        new THREE.Vector3(-0.9,  0.0,  0.4).normalize(),
      ];
      let bump = 0;
      for (const a of axes) {
        const d = Math.max(0, p.dot(a));
        bump += Math.pow(d, 8) * 0.50;
      }
      return p.clone().multiplyScalar(r * (1 + bump));
    },
    breath: 0.020,
  },
  {
    id: "spike",
    detail: 5,
    build: (p, r) => {
      let spike = 0;
      for (let i = 0; i < 18; i++) {
        const t = (i + 1) * 1.732;
        const ax = new THREE.Vector3(
          Math.sin(t) * Math.cos(t * 1.31),
          Math.cos(t * 0.71),
          Math.sin(t * 1.13),
        ).normalize();
        const d = Math.max(0, p.dot(ax));
        spike += Math.pow(d, 28) * 0.55;
      }
      const n = fbm(p.x * 4, p.y * 4, p.z * 4, 1);
      return p.clone().multiplyScalar(r * (1 + spike + 0.025 * n));
    },
    breath: 0.014,
  },
  {
    id: "finned",
    detail: 4,
    build: (p, r) => {
      const phi = Math.atan2(p.z, p.x);
      const lat = 1 - Math.abs(p.y);
      const fin = Math.pow(Math.max(0, Math.cos(phi * 3)), 12) * lat * 0.30;
      return p.clone().multiplyScalar(r * (1 + fin));
    },
    breath: 0.018,
  },
  {
    id: "conjoined",
    detail: 5,
    build: (p, r) => {
      const cz = 0.40 * r;
      const centers = [
        new THREE.Vector3(0, 0,  cz),
        new THREE.Vector3(0, 0, -cz),
      ];
      const rad = r * 0.78;
      return metaballSurface(p, centers, [rad, rad], r * 0.42);
    },
    breath: 0.018,
  },
  {
    id: "cluster",
    detail: 5,
    build: (p, r) => {
      const centers = [
        new THREE.Vector3( 0.40,  0.15,  0.05).multiplyScalar(r),
        new THREE.Vector3(-0.32,  0.18,  0.28).multiplyScalar(r),
        new THREE.Vector3(-0.08, -0.30, -0.28).multiplyScalar(r),
        new THREE.Vector3( 0.18, -0.22,  0.32).multiplyScalar(r),
      ];
      const radii = [r * 0.62, r * 0.58, r * 0.56, r * 0.52];
      return metaballSurface(p, centers, radii, r * 0.34);
    },
    breath: 0.016,
  },
];

const VARIANT_BY_ID: Record<PlanetShape, Variant> = Object.fromEntries(
  VARIANTS.map((v) => [v.id, v]),
) as Record<PlanetShape, Variant>;

export const PLANET_SHAPES = VARIANTS.map((v) => v.id);

// ─────────────────────────────────────────────────────────
// Geometry build & breathing
// ─────────────────────────────────────────────────────────

type GeomUserData = {
  basePositions: Float32Array;
  baseNormals: Float32Array;
  breath: number;
  phase: number;
};

function buildGeometry(shape: PlanetShape, baseR: number): THREE.BufferGeometry {
  const variant = VARIANT_BY_ID[shape] ?? VARIANT_BY_ID.smooth;
  let geom: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, variant.detail);
  // IcosahedronGeometry is non-indexed → computeVertexNormals produces flat shading.
  // Merge coincident vertices first so smooth shading actually works.
  if (!variant.flat) {
    geom = mergeVertices(geom);
  }
  const pos = geom.attributes.position;
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i);
    const out = variant.build(dir, baseR);
    pos.setXYZ(i, out.x, out.y, out.z);
  }
  geom.computeVertexNormals();

  const userData: GeomUserData = {
    basePositions: new Float32Array(pos.array as Float32Array),
    baseNormals: new Float32Array(geom.attributes.normal.array as Float32Array),
    breath: variant.breath,
    phase: Math.random() * Math.PI * 2,
  };
  geom.userData = userData;
  return geom;
}

function breatheGeometry(geom: THREE.BufferGeometry, time: number): void {
  const ud = geom.userData as GeomUserData;
  if (!ud.basePositions) return;
  const base = ud.basePositions;
  const normals = ud.baseNormals;
  const amp = ud.breath;
  const phase = ud.phase;
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ix = i * 3;
    const bx = base[ix];
    const by = base[ix + 1];
    const bz = base[ix + 2];
    const nx = normals[ix];
    const ny = normals[ix + 1];
    const nz = normals[ix + 2];
    const len = Math.hypot(bx, by, bz) || 1;
    const dx = bx / len;
    const dy = by / len;
    const dz = bz / len;
    const t = time * 0.55 + phase;
    const n =
      Math.sin(t + dx * 1.6 + dy * 1.1) * 0.5 +
      Math.sin(t * 0.78 + dy * 1.3 + dz * 1.4) * 0.5;
    const d = amp * n;
    pos.setXYZ(i, bx + nx * d, by + ny * d, bz + nz * d);
  }
  pos.needsUpdate = true;
}

// ─────────────────────────────────────────────────────────
// <PlanetMesh /> — drop-in replacement for <sphereGeometry/>
// ─────────────────────────────────────────────────────────

type PlanetMeshProps = {
  shape: PlanetShape;
  size: number;
  meshRef: RefObject<THREE.Mesh | null>;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  // Fires on pointerdown — onClick would miss when the body is orbiting,
  // because pointerup lands off-target by the time the user releases.
  onSelect?: (e: ThreeEvent<PointerEvent>) => void;
};

export function PlanetMesh({
  shape,
  size,
  meshRef,
  color,
  emissive,
  emissiveIntensity,
  roughness,
  metalness,
  onSelect,
}: PlanetMeshProps) {
  const variant = VARIANT_BY_ID[shape] ?? VARIANT_BY_ID.smooth;

  // Build the deformed geometry once per (shape, size). Dispose on swap.
  const geometry = useMemo(() => buildGeometry(shape, size), [shape, size]);
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Rebuild accessories whenever shape, size, or appearance changes
  const accessoryRoot = useRef<THREE.Group>(null);
  const accessories = useMemo(() => {
    if (!variant.accessory) return [];
    return variant.accessory(size, { color, emissive, emissiveIntensity });
  }, [variant, size, color, emissive, emissiveIntensity]);

  useEffect(() => {
    return () => {
      for (const obj of accessories) {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            const m = child.material;
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
            else m?.dispose();
          }
        });
      }
    };
  }, [accessories]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    breatheGeometry(mesh.geometry, state.clock.elapsedTime);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} onPointerDown={onSelect}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
        flatShading={!!variant.flat}
      />
      <group ref={accessoryRoot}>
        {accessories.map((obj, i) => (
          <primitive key={i} object={obj} />
        ))}
      </group>
    </mesh>
  );
}
