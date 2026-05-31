// Deterministic orbit-parameter generation for newly added bodies.
//
// Orbit geometry carries no meaning (ADR-0001) — it is purely aesthetic
// dispersion. We seed it from a djb2 hash (ADR-0002 D4) of the body id so the
// same body always lands on the same orbit (stable across reloads) while
// siblings spread out instead of stacking.

export type OrbitParams = {
  orbitRadius: number;
  orbitSpeed: number;
  inclination: number;
  phase: number;
};

// djb2 string hash → unsigned 32-bit. Classic `hash * 33 + c` variant.
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Slice four independent byte-ranges out of one hash so each param varies on
// its own. Ranges chosen to match the moon-scale bodies in seed.ts.
export function generateOrbitParams(seed: string): OrbitParams {
  const h = djb2(seed);
  const r1 = (h & 0xff) / 0xff;
  const r2 = ((h >>> 8) & 0xff) / 0xff;
  const r3 = ((h >>> 16) & 0xff) / 0xff;
  const r4 = ((h >>> 24) & 0xff) / 0xff;
  return {
    orbitRadius: 0.4 + r1 * 0.8, // 0.4 .. 1.2
    orbitSpeed: 0.1 + r2 * 0.2, // 0.1 .. 0.3
    inclination: (r3 - 0.5) * 0.6, // -0.3 .. 0.3
    phase: r4 * Math.PI * 2, // 0 .. 2π
  };
}
