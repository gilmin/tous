import { LABEL_CULL_SHOW, LABEL_CULL_HIDE } from "./constants";

/**
 * Decides whether a body's DOM label should be mounted at all.
 *
 * Benchmark (2026-06-11, .gstack/benchmark-reports): 100 mounted drei <Html>
 * labels drop the scene from 60fps to ~30fps median — the per-frame style
 * writes + compositing of 100 absolutely-positioned DOM elements, not the
 * WebGL scene, are the bottleneck. The existing distance fade only changes
 * opacity, so an invisible label still pays full pipeline cost. Culling
 * unmounts labels too small to read instead.
 *
 * Criterion: apparent size (world size / camera distance). Hysteresis — show
 * above LABEL_CULL_SHOW, hide below LABEL_CULL_HIDE, keep previous state in
 * between — so idle orbit motion at the boundary doesn't flicker mounts.
 */
export function nextLabelVisible(
  prev: boolean,
  size: number,
  distance: number,
  show: number = LABEL_CULL_SHOW,
  hide: number = LABEL_CULL_HIDE,
): boolean {
  if (distance <= 0) return true; // camera at/inside the body — degenerate, show
  const apparent = size / distance;
  if (apparent >= show) return true;
  if (apparent <= hide) return false;
  return prev;
}
