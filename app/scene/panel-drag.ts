export interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DragBounds {
  viewportWidth: number;
  viewportHeight: number;
  /** Keep this many px between the panel and each viewport edge. */
  margin?: number;
}

export interface Offset {
  x: number;
  y: number;
}

function clampAxis(off: number, lo: number, hi: number): number {
  // Panel bigger than the available space → lo > hi. Pin to lo so the
  // panel's leading (left/top) edge sits at the margin and stays reachable.
  if (lo > hi) return lo;
  return Math.min(hi, Math.max(lo, off));
}

/**
 * Clamp a desired drag `offset` (px translate added on top of the panel's base
 * transform) so the panel — whose un-offset rect is `rect` — stays inside the
 * viewport minus `margin`. Pure: the FocusPanel adapter measures the rect and
 * passes the live viewport (see item 2, round-5 plan).
 */
export function clampPanelOffset(
  offset: Offset,
  rect: PanelRect,
  bounds: DragBounds,
): Offset {
  const margin = bounds.margin ?? 8;
  const minDx = margin - rect.left;
  const maxDx = bounds.viewportWidth - margin - (rect.left + rect.width);
  const minDy = margin - rect.top;
  const maxDy = bounds.viewportHeight - margin - (rect.top + rect.height);
  return {
    x: clampAxis(offset.x, minDx, maxDx),
    y: clampAxis(offset.y, minDy, maxDy),
  };
}
