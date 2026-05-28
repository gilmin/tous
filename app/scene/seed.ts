import type { OrbitalBody } from "./types";

// ─────────────────────────────────────────────────────────
// Shape mapping: each planet's meaning → organic shape variant.
// Add/edit `shape` on any body to remap. See Planet.tsx for the catalogue.
// ─────────────────────────────────────────────────────────
export const SYSTEM: OrbitalBody = {
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
