import { describe, expect, it } from "vitest";
import { computeKeyboardInset } from "./keyboard-inset";

describe("computeKeyboardInset", () => {
  it("visual viewport가 레이아웃을 꽉 채우면 0 (키보드 없음)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 800, offsetTop: 0 }),
    ).toBe(0);
  });

  it("visual viewport가 줄면 그 차이가 키보드 겹침 (iOS)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 500, offsetTop: 0 }),
    ).toBe(300);
  });

  it("visual viewport 스크롤 오프셋을 반영", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 500, offsetTop: 50 }),
    ).toBe(250);
  });

  it("음수가 되지 않음 (고무줄/오버스크롤)", () => {
    expect(
      computeKeyboardInset({ layoutHeight: 800, viewportHeight: 850, offsetTop: 0 }),
    ).toBe(0);
  });
});
