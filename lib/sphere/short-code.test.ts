import { describe, it, expect } from "vitest";
import { generateShortCode, SHORT_CODE_LENGTH } from "./short-code";

const BASE62 = /^[a-zA-Z0-9]+$/;

describe("generateShortCode", () => {
  it("is 8 chars of base62", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateShortCode();
      expect(code).toHaveLength(SHORT_CODE_LENGTH);
      expect(code).toMatch(BASE62);
    }
  });

  it("is non-deterministic across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(generateShortCode());
    // No fixed value; collisions in 200 draws from 62^8 are effectively impossible.
    expect(seen.size).toBe(200);
  });
});
