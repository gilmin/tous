import { type PlanetShape } from "../_components/Planet";
import { type PlanetPattern } from "../_components/planet-pattern";

export type { PlanetShape, PlanetPattern };

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
  /** Procedural surface pattern (cartoon mode). Falls back to an id-derived
   *  pattern when unset so existing bodies still get a surface. */
  pattern?: PlanetPattern;
  /** Pattern overlay color. Defaults to a darker shade of `color`. */
  patternColor?: string;
  selfRotation?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  inclination?: number;
  phase?: number;
  children?: OrbitalBody[];
};
