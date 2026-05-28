import { describe, expect, it } from "vitest";
import { monoShade, getBodyColor, getLineColor } from "./utils";
import type { OrbitalBody } from "./types";

function body(overrides: Partial<OrbitalBody> = {}): OrbitalBody {
  return {
    id: "test",
    size: 0.5,
    color: "#ffaa55",
    ...overrides,
  };
}

describe("monoShade", () => {
  it("clamps tiny sizes to the lower bound", () => {
    expect(monoShade(0)).toBe(monoShade(0.05));
  });

  it("clamps large sizes to the upper bound", () => {
    expect(monoShade(10)).toBe(monoShade(0.7));
  });

  it("returns an rgb() string", () => {
    expect(monoShade(0.3)).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });
});

describe("getBodyColor", () => {
  it("returns mono shade for mono variant regardless of body color", () => {
    const b = body({ color: "#ff0000" });
    expect(getBodyColor(b, "mono")).toMatch(/^rgb\(/);
  });

  it("returns the body color for cosmic variant", () => {
    expect(getBodyColor(body({ color: "#abcdef" }), "cosmic")).toBe("#abcdef");
  });
});

describe("getLineColor", () => {
  it("uses fixed gray for mono variant", () => {
    expect(getLineColor(body(), "mono")).toBe("#444");
  });

  it("uses body color for cosmic variant", () => {
    expect(getLineColor(body({ color: "#abcdef" }), "cosmic")).toBe("#abcdef");
  });
});
