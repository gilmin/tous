/**
 * Touch steering speed as a symmetric, proportional (analog) function of where
 * the finger is, relative to "나"(Self/root) at screen center.
 *
 * `pointerX` is the normalized device x (−1 at the left edge, 0 at center, +1 at
 * the right edge) — i.e. the signed horizontal distance from center. The spin is
 * `pointerX * scale`: zero at center, ±scale at the edges, and the same speed for
 * equal distances on either side (no idle bias — that asymmetry was the round-4
 * 저항감). Far from center = fast, near center = slow, sign = direction.
 *
 * Input is clamped to [−1, 1] so an overshoot past the canvas can't exceed scale.
 */
export function touchSpinSpeed(pointerX: number, scale: number): number {
  const clamped = Math.max(-1, Math.min(1, pointerX));
  return clamped * scale;
}
