import { describe, expect, it } from "vitest";
import { nextLabelVisible } from "./label-cull";
import { LABEL_CULL_SHOW, LABEL_CULL_HIDE } from "./constants";

describe("nextLabelVisible", () => {
  it("shows a large/near body regardless of previous state", () => {
    // sun-sized at default camera distance: 0.6 / 8.25 ≈ 0.073 >> SHOW
    expect(nextLabelVisible(false, 0.6, 8.25)).toBe(true);
    expect(nextLabelVisible(true, 0.6, 8.25)).toBe(true);
  });

  it("hides a small/far body regardless of previous state", () => {
    // moon at default camera distance: 0.06 / 8.25 ≈ 0.0073 << HIDE
    expect(nextLabelVisible(true, 0.06, 8.25)).toBe(false);
    expect(nextLabelVisible(false, 0.06, 8.25)).toBe(false);
  });

  it("keeps the previous state inside the hysteresis band", () => {
    // pick a ratio strictly between HIDE and SHOW
    const mid = (LABEL_CULL_SHOW + LABEL_CULL_HIDE) / 2;
    const size = 0.1;
    const distance = size / mid;
    expect(nextLabelVisible(true, size, distance)).toBe(true);
    expect(nextLabelVisible(false, size, distance)).toBe(false);
  });

  it("treats exact thresholds as crossings (>= SHOW shows, <= HIDE hides)", () => {
    const size = 0.1;
    expect(nextLabelVisible(false, size, size / LABEL_CULL_SHOW)).toBe(true);
    expect(nextLabelVisible(true, size, size / LABEL_CULL_HIDE)).toBe(false);
  });

  it("shows a moon once the camera zooms in (focus distance)", () => {
    // focused planet puts the camera ~1.5-2 world units away from its moons
    expect(nextLabelVisible(false, 0.06, 1.7)).toBe(true);
  });

  it("shows on degenerate non-positive distance", () => {
    expect(nextLabelVisible(false, 0.1, 0)).toBe(true);
    expect(nextLabelVisible(false, 0.1, -1)).toBe(true);
  });
});
