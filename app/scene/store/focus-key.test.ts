import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "../types";
import { focusForKey } from "./focus-key";

// DFS pre-order of this tree: self → p1 → p1m1 → p2
function makeTree(): OrbitalBody {
  return {
    id: "self",
    label: "나",
    size: 1,
    color: "#000",
    children: [
      {
        id: "p1",
        label: "자유",
        size: 0.4,
        color: "#111",
        children: [{ id: "p1m1", label: "선택", size: 0.2, color: "#222" }],
      },
      { id: "p2", label: "외로움", size: 0.4, color: "#333" },
    ],
  };
}

describe("focusForKey", () => {
  it("ArrowRight from no focus selects the first body (root)", () => {
    expect(focusForKey(makeTree(), null, "ArrowRight")).toEqual({
      focusId: "self",
    });
  });

  it("ArrowRight advances to the next body in DFS order", () => {
    expect(focusForKey(makeTree(), "self", "ArrowRight")).toEqual({
      focusId: "p1",
    });
  });

  it("ArrowRight wraps from the last body back to the root", () => {
    expect(focusForKey(makeTree(), "p2", "ArrowRight")).toEqual({
      focusId: "self",
    });
  });

  it("ArrowLeft from no focus selects the last body", () => {
    expect(focusForKey(makeTree(), null, "ArrowLeft")).toEqual({
      focusId: "p2",
    });
  });

  it("ArrowLeft steps to the previous body in DFS order", () => {
    expect(focusForKey(makeTree(), "p1", "ArrowLeft")).toEqual({
      focusId: "self",
    });
  });

  it("Escape clears focus when something is focused", () => {
    expect(focusForKey(makeTree(), "p1", "Escape")).toEqual({ focusId: null });
  });

  it("Escape is not handled when nothing is focused", () => {
    expect(focusForKey(makeTree(), null, "Escape")).toBeNull();
  });

  it("returns null for keys it does not handle", () => {
    expect(focusForKey(makeTree(), "p1", "KeyA")).toBeNull();
    expect(focusForKey(makeTree(), null, "Space")).toBeNull();
  });
});
