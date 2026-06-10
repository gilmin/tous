import * as THREE from "three";

// ─────────────────────────────────────────────────────────
// Procedural surface patterns for cartoon planets.
//
// Instead of image textures (which seam badly on the deformed icosahedron
// geometry), we tint a MeshToonMaterial in the fragment shader from the
// model-space direction. Seamless on any of the 20 shapes, and the cel
// lighting still bands on top → Earth/Jupiter-ish cartoon surfaces.
// ─────────────────────────────────────────────────────────

export type PlanetPattern =
  | "none"
  | "bands" // 목성 — 가로 줄무늬
  | "continents" // 지구 — 대륙과 바다
  | "spots" // 점박이
  | "swirl" // 소용돌이
  | "stripes" // 세로 줄
  | "bubbles" // 동글동글 방울
  | "marble"; // 마블 무늬 (대리석/유리구슬)

export const PLANET_PATTERNS: PlanetPattern[] = [
  "none",
  "bands",
  "continents",
  "spots",
  "swirl",
  "stripes",
  "bubbles",
  "marble",
];

// Korean labels for the FocusPanel pattern picker.
export const PATTERN_LABELS: Record<PlanetPattern, string> = {
  none: "없음",
  bands: "줄무늬",
  continents: "대륙",
  spots: "점박이",
  swirl: "소용돌이",
  stripes: "세로줄",
  bubbles: "방울",
  marble: "마블",
};

const PATTERN_TO_INT: Record<PlanetPattern, number> = {
  none: 0,
  bands: 1,
  continents: 2,
  spots: 3,
  swirl: 4,
  stripes: 5,
  bubbles: 6,
  marble: 7,
};

// Compact 3D value-noise + fbm, plus the per-kind mask. `d` is a unit
// direction in model space so the pattern wraps the body seamlessly.
const PATTERN_GLSL = /* glsl */ `
float pp_hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float pp_noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(pp_hash(i+vec3(0,0,0)),pp_hash(i+vec3(1,0,0)),f.x),
                 mix(pp_hash(i+vec3(0,1,0)),pp_hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(pp_hash(i+vec3(0,0,1)),pp_hash(i+vec3(1,0,1)),f.x),
                 mix(pp_hash(i+vec3(0,1,1)),pp_hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float pp_fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<4;i++){ v+=a*pp_noise(p); p*=2.03; a*=0.5; } return v; }
// Domain warp → organic, blobby shapes instead of round noise.
vec3 pp_warp(vec3 d, float amt){
  return d + amt*vec3(pp_fbm(d*1.7), pp_fbm(d*1.7+11.0), pp_fbm(d*1.7+23.0));
}
float pp_mask(int kind, vec3 d){
  if(kind==1){ // bands (jupiter) — wavy horizontal belts
    float b = sin(d.y*9.0 + pp_fbm(d*2.4)*3.0);
    return smoothstep(0.0,0.30,b);
  } else if(kind==2){ // continents (earth) — warped landmasses over ocean
    vec3 w = pp_warp(d, 0.38);
    float n = pp_fbm(w*1.7+5.0);
    return smoothstep(0.49,0.55,n);
  } else if(kind==3){ // spots — scattered freckles
    float n = pp_fbm(d*5.0+1.0);
    return smoothstep(0.62,0.67,n);
  } else if(kind==4){ // swirl — pinwheel
    float ang = atan(d.z, d.x);
    float s = sin(ang*3.0 + d.y*6.0 + pp_fbm(d*2.0)*4.0);
    return smoothstep(0.0,0.30,s);
  } else if(kind==5){ // vertical stripes
    float lon = atan(d.z, d.x);
    float s = sin(lon*8.0 + pp_fbm(d*3.0)*1.5);
    return smoothstep(0.0,0.30,s);
  } else if(kind==6){ // bubbles — round polka dots
    vec3 w = pp_warp(d, 0.12);
    float n = pp_noise(w*4.2);
    return smoothstep(0.66,0.74,n);
  } else if(kind==7){ // marble — veined swirl (glass marble)
    float n = pp_fbm(d*2.0 + pp_fbm(d*3.0)*2.2);
    float vein = abs(sin(n*12.566));
    return 1.0 - smoothstep(0.30,0.55,vein); // thin bright veins
  }
  return 0.0;
}
`;

type ToonPatternOpts = {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  gradientMap: THREE.Texture;
  pattern: PlanetPattern;
  patternColor: string;
};

/**
 * A MeshToonMaterial whose base color is overlaid with a procedural pattern.
 * Pattern kind/color are baked into the shader at compile, so build a fresh
 * material when they change (and dispose the old one).
 */
export function makeToonPatternMaterial(opts: ToonPatternOpts): THREE.MeshToonMaterial {
  const kind = PATTERN_TO_INT[opts.pattern] ?? 0;
  const mat = new THREE.MeshToonMaterial({
    color: opts.color,
    emissive: opts.emissive,
    emissiveIntensity: opts.emissiveIntensity,
    gradientMap: opts.gradientMap,
  });

  if (kind === 0) return mat; // plain — no shader patch

  const patternColor = new THREE.Color(opts.patternColor);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPattern = { value: kind };
    shader.uniforms.uPatternColor = { value: patternColor };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vModelDir;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vModelDir = normalize(position);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vModelDir;\nuniform int uPattern;\nuniform vec3 uPatternColor;\n" +
          PATTERN_GLSL,
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, uPatternColor, pp_mask(uPattern, normalize(vModelDir)));",
      );
  };
  // Distinct programs per pattern kind so cached shaders don't bleed.
  mat.customProgramCacheKey = () => `toon-pattern-${kind}`;
  return mat;
}

// Deterministic fallback so existing bodies (no `pattern` field yet) still get
// a surface. Hash the id → pick a pattern; pattern color = a darker shade of
// the base so it stays tonal and harmonious.
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}

const FALLBACK_PATTERNS: PlanetPattern[] = [
  "bands",
  "continents",
  "spots",
  "swirl",
  "stripes",
  "bubbles",
  "marble",
];

export function derivePattern(
  id: string,
  baseColor: string,
  explicit?: PlanetPattern,
  explicitColor?: string,
): { pattern: PlanetPattern; patternColor: string } {
  const pattern = explicit ?? FALLBACK_PATTERNS[hashStr(id) % FALLBACK_PATTERNS.length];
  const patternColor = explicitColor ?? deriveColor(id, baseColor);
  return { pattern, patternColor };
}

// Pattern colour: ~10% of bodies get a bold two-tone (continents-on-ocean)
// contrast; the rest keep a subtle same-hue darker shade so the field stays
// calm and the two-tone ones feel special.
function deriveColor(id: string, baseColor: string): string {
  if (hashStr(id + "twotone") % 10 === 0) return twoTone(id, baseColor);
  return "#" + new THREE.Color(baseColor).multiplyScalar(0.62).getHexString();
}

// A *contrasting* second colour for the surface pattern: a hue-rotated, more
// saturated, slightly darker sibling of the base. This gives planets a two-tone
// continents-on-ocean read (e.g. green land over blue sea) instead of a flat
// single hue. Deterministic per id, so a body keeps its look across reloads.
function twoTone(id: string, baseColor: string): string {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(baseColor).getHSL(hsl);
  const h32 = hashStr(id + "tone");
  const sign = h32 & 1 ? 1 : -1;
  const shift = 0.12 + (((h32 >>> 1) % 100) / 100) * 0.1; // ~0.12..0.22 turn (~45-80°)
  const h2 = (hsl.h + sign * shift + 1) % 1;
  const s2 = Math.min(1, hsl.s * 1.15 + 0.28); // bolder so the contrast reads
  const l2 = THREE.MathUtils.clamp(hsl.l * 0.72, 0.24, 0.6);
  return "#" + new THREE.Color().setHSL(h2, s2, l2).getHexString();
}
