import { describe, expect, it } from "vitest";
import { getEmissiveSettings } from "./utils";
import type { OrbitalBody } from "./types";

function body(overrides: Partial<OrbitalBody> = {}): OrbitalBody {
  return {
    id: "test",
    size: 0.5,
    color: "#ffaa55",
    ...overrides,
  };
}

describe("getEmissiveSettings", () => {
  it("returns no emission when the body has no emissive color", () => {
    expect(getEmissiveSettings(body())).toEqual({ color: "#000000", intensity: 0 });
  });

  it("uses the body's emissive color when set", () => {
    expect(getEmissiveSettings(body({ emissive: "#ff00aa" }))).toEqual({
      color: "#ff00aa",
      intensity: 0.8,
    });
  });
});
