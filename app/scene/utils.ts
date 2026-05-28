import * as THREE from "three";
import type { OrbitalBody, SceneVariant } from "./types";

export function monoShade(size: number) {
  const norm = THREE.MathUtils.clamp(size / 0.7, 0.15, 0.92);
  const v = Math.round(norm * 175) + 55;
  return `rgb(${v},${v},${v})`;
}

export function getBodyColor(body: OrbitalBody, variant: SceneVariant) {
  return variant === "mono" ? monoShade(body.size) : body.color;
}

export function getEmissiveSettings(body: OrbitalBody, variant: SceneVariant) {
  if (variant === "mono") return { color: "#000000", intensity: 0 };
  if (!body.emissive) return { color: "#000000", intensity: 0 };
  return { color: body.emissive, intensity: 0.8 };
}

export function getLineColor(body: OrbitalBody, variant: SceneVariant) {
  if (variant === "mono") return "#444";
  return body.color;
}
