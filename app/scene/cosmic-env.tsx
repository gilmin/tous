"use client";

import { Stars, Sparkles } from "@react-three/drei";
import { BackgroundLife } from "./BackgroundLife";

// The single visual theme (mono removed). Shared by the editor Scene and the
// read-only PublicScene so the cosmic backdrop can't drift between them.
//
// COSMIC_BG is the Canvas CSS background: several color glows layered over a
// purple core so the void isn't flat — magenta upper-left, cyan lower-right.
export const COSMIC_BG =
  "radial-gradient(circle at 22% 18%, rgba(255,90,180,0.40) 0%, rgba(255,90,180,0) 42%)," +
  "radial-gradient(circle at 82% 88%, rgba(70,200,255,0.34) 0%, rgba(70,200,255,0) 46%)," +
  "radial-gradient(circle at 50% 44%, #7a4fd0 0%, #512f9e 24%, #2f1d6e 50%, #18103f 76%, #0d0828 100%)";

// In-Canvas lights + sky for the cosmic theme.
export function CosmicScenery() {
  return (
    <>
      {/* Lower ambient so the toon ramp actually bands (cel look); strong front
          key carves the lit/shadow split, warm sun glows the core. */}
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 0]} intensity={9} distance={40} color="#ffd9a8" />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#ff7ad0" />
      <Stars
        radius={70}
        depth={50}
        count={2600}
        factor={4.5}
        saturation={0.7}
        fade
        speed={0.3}
      />
      {/* Chunky twinkling sparkles → arcade/kitsch foreground glitter. */}
      <Sparkles count={70} scale={16} size={6} speed={0.4} opacity={0.8} color="#ffe9a8" />
      <Sparkles count={40} scale={12} size={4} speed={0.3} opacity={0.7} color="#9fe8ff" />
      {/* Sparse, tiny, far-back drifters → subtle living background (#8). */}
      <BackgroundLife />
    </>
  );
}
