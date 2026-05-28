import { type PlanetShape } from "../_components/Planet";

export type { PlanetShape };

export type SceneVariant = "mono" | "cosmic";

export type OrbitalBody = {
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
