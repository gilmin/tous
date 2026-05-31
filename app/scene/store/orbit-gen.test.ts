import { describe, it, expect } from "vitest";
import { djb2, generateOrbitParams } from "./orbit-gen";

describe("djb2", () => {
  it("is deterministic", () => {
    expect(djb2("hello")).toBe(djb2("hello"));
  });
  it("differs for different input", () => {
    expect(djb2("hello")).not.toBe(djb2("world"));
  });
  it("returns an unsigned 32-bit integer", () => {
    const h = djb2("anything");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("generateOrbitParams", () => {
  it("is deterministic for the same seed", () => {
    expect(generateOrbitParams("abc")).toEqual(generateOrbitParams("abc"));
  });

  it("stays within the documented ranges", () => {
    for (const seed of ["a", "b", "longer-seed", "x".repeat(40), ""]) {
      const p = generateOrbitParams(seed);
      expect(p.orbitRadius).toBeGreaterThanOrEqual(0.4);
      expect(p.orbitRadius).toBeLessThanOrEqual(1.2);
      expect(p.orbitSpeed).toBeGreaterThanOrEqual(0.1);
      expect(p.orbitSpeed).toBeLessThanOrEqual(0.3);
      expect(p.inclination).toBeGreaterThanOrEqual(-0.3);
      expect(p.inclination).toBeLessThanOrEqual(0.3);
      expect(p.phase).toBeGreaterThanOrEqual(0);
      expect(p.phase).toBeLessThanOrEqual(Math.PI * 2);
    }
  });
});
