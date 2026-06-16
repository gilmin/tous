import { describe, expect, it } from "vitest";
import { touchSpinSpeed } from "./touch-spin";

describe("touchSpinSpeed", () => {
  const SCALE = 1.2;

  it("중앙(나 행성)을 누르면 회전 0", () => {
    expect(touchSpinSpeed(0, SCALE)).toBe(0);
  });

  it("오른쪽 끝은 +scale, 왼쪽 끝은 -scale", () => {
    expect(touchSpinSpeed(1, SCALE)).toBeCloseTo(SCALE);
    expect(touchSpinSpeed(-1, SCALE)).toBeCloseTo(-SCALE);
  });

  it("중앙에서 멀수록 비례해서 빠르다", () => {
    expect(touchSpinSpeed(0.5, SCALE)).toBeCloseTo(0.6);
    expect(touchSpinSpeed(0.25, SCALE)).toBeCloseTo(0.3);
  });

  it("좌우 대칭 — 같은 거리면 크기 같고 부호만 반대", () => {
    expect(touchSpinSpeed(-0.5, SCALE)).toBeCloseTo(-touchSpinSpeed(0.5, SCALE));
    expect(touchSpinSpeed(-0.8, SCALE)).toBeCloseTo(-touchSpinSpeed(0.8, SCALE));
  });

  it("범위(±1)를 벗어난 입력은 clamp — scale를 넘지 않는다", () => {
    expect(touchSpinSpeed(2, SCALE)).toBeCloseTo(SCALE);
    expect(touchSpinSpeed(-3, SCALE)).toBeCloseTo(-SCALE);
  });
});
