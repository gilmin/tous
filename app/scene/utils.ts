import type { OrbitalBody } from "./types";

export function getEmissiveSettings(body: OrbitalBody) {
  if (!body.emissive) return { color: "#000000", intensity: 0 };
  return { color: body.emissive, intensity: 0.8 };
}
