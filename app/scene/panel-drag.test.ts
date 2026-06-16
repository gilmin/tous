import { describe, expect, it } from "vitest";
import { clampPanelOffset } from "./panel-drag";

// The panel's rect when no drag offset is applied (where it sits by default).
const rect = { left: 100, top: 500, width: 200, height: 100 };
const bounds = { viewportWidth: 1000, viewportHeight: 800 }; // margin defaults to 8

describe("clampPanelOffset", () => {
  it("화면 안에 있으면 그대로 통과", () => {
    expect(clampPanelOffset({ x: 50, y: -50 }, rect, bounds)).toEqual({
      x: 50,
      y: -50,
    });
  });

  it("오른쪽으로 너무 밀면 오른쪽 가장자리에서 멈춘다", () => {
    // maxDx = 1000 - 8 - (100 + 200) = 692
    expect(clampPanelOffset({ x: 5000, y: 0 }, rect, bounds).x).toBe(692);
  });

  it("왼쪽으로 너무 밀면 왼쪽 가장자리에서 멈춘다", () => {
    // minDx = 8 - 100 = -92
    expect(clampPanelOffset({ x: -5000, y: 0 }, rect, bounds).x).toBe(-92);
  });

  it("아래/위로 너무 밀면 세로로도 가둔다", () => {
    // maxDy = 800 - 8 - (500 + 100) = 192 ; minDy = 8 - 500 = -492
    expect(clampPanelOffset({ x: 0, y: 5000 }, rect, bounds).y).toBe(192);
    expect(clampPanelOffset({ x: 0, y: -5000 }, rect, bounds).y).toBe(-492);
  });

  it("패널이 화면보다 크면 왼쪽/위 가장자리(margin)에 고정 — 핸들이 닿게", () => {
    const huge = { left: 0, top: 0, width: 2000, height: 2000 };
    const out = clampPanelOffset({ x: 500, y: -500 }, huge, bounds);
    expect(out).toEqual({ x: 8, y: 8 });
  });

  it("margin을 넘겨주면 그 값을 쓴다", () => {
    // minDx = 20 - 100 = -80
    expect(
      clampPanelOffset({ x: -5000, y: 0 }, rect, { ...bounds, margin: 20 }).x,
    ).toBe(-80);
  });
});
