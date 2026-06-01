import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "@/app/scene/types";
import { countNodes } from "./serialize";

// A tree exercising every OrbitalBody field, including nested children and all
// optionals (emissive, shape, selfRotation, orbit*, phase). The round-trip test
// guards against any future field that is not plain JSON-safe data — if someone
// adds a Map/Set/function/undefined-loss field, this fails before it corrupts
// the stored blob.
function fullTree(): OrbitalBody {
  return {
    id: "self",
    label: "나",
    size: 0.6,
    color: "#ffd97a",
    emissive: "#ff8c1a",
    shape: "smooth",
    selfRotation: 0.05,
    children: [
      {
        id: "p1",
        label: "자유",
        size: 0.18,
        color: "#7ab0d8",
        shape: "cluster",
        orbitRadius: 1.6,
        orbitSpeed: 0.45,
        inclination: 0.1,
        phase: 0,
        selfRotation: 0.3,
        children: [
          {
            id: "p1m1",
            label: "선택",
            size: 0.06,
            color: "#cfd8e3",
            shape: "smooth",
            orbitRadius: 0.35,
            orbitSpeed: 1.5,
            inclination: 0.3,
            phase: 0,
          },
        ],
      },
      {
        id: "p2",
        label: "외로움",
        size: 0.22,
        color: "#d68ea8",
        shape: "oblong",
        orbitRadius: 2.4,
        orbitSpeed: 0.3,
        inclination: -0.15,
        phase: Math.PI * 0.7,
      },
    ],
  };
}

describe("sphere serialize", () => {
  it("round-trips through JSONB with every field preserved", () => {
    const tree = fullTree();
    // Mirrors what supabase-js does to a jsonb column value.
    const roundTripped = JSON.parse(JSON.stringify(tree)) as OrbitalBody;
    expect(roundTripped).toEqual(tree);
  });

  it("counts every Body including Self", () => {
    // self + p1 + p1m1 + p2 = 4
    expect(countNodes(fullTree())).toBe(4);
  });

  it("counts a lone Self as 1", () => {
    expect(countNodes({ id: "self", size: 1, color: "#000" })).toBe(1);
  });
});
