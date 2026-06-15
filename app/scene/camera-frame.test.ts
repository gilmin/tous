import { describe, expect, it } from "vitest";
import { defaultCamDistanceScale } from "./camera-frame";

describe("defaultCamDistanceScale", () => {
  it("가로/데스크탑(aspect >= 1)은 그대로", () => {
    expect(defaultCamDistanceScale(1.5)).toBe(1);
    expect(defaultCamDistanceScale(1)).toBe(1);
  });

  it("세로(aspect < 1)에선 카메라를 뒤로 빼 더 멀리", () => {
    // aspect 0.5 → 1 + (1 - 0.5) = 1.5
    expect(defaultCamDistanceScale(0.5)).toBeCloseTo(1.5);
  });

  it("과도하게 멀어지지 않게 1.7로 클램프", () => {
    expect(defaultCamDistanceScale(0.1)).toBe(1.7);
  });
});
