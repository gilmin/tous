import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "../types";
import { editBody, hasBodyId, selectBodyById } from "./tree-ops";

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
        children: [
          { id: "p1m1", label: "선택", size: 0.2, color: "#222" },
        ],
      },
      { id: "p2", label: "외로움", size: 0.4, color: "#333" },
    ],
  };
}

describe("selectBodyById", () => {
  it("finds the root", () => {
    const tree = makeTree();
    expect(selectBodyById(tree, "self")).toBe(tree);
  });

  it("finds nested descendants", () => {
    const tree = makeTree();
    expect(selectBodyById(tree, "p1m1")?.label).toBe("선택");
  });

  it("returns null for missing ids", () => {
    expect(selectBodyById(makeTree(), "ghost")).toBeNull();
  });
});

describe("hasBodyId", () => {
  it("returns true for present ids and false otherwise", () => {
    const tree = makeTree();
    expect(hasBodyId(tree, "p2")).toBe(true);
    expect(hasBodyId(tree, "ghost")).toBe(false);
  });
});

describe("editBody", () => {
  it("patches the root", () => {
    const tree = makeTree();
    const next = editBody(tree, "self", { label: "내 이름" });
    expect(next).not.toBe(tree);
    expect(next.label).toBe("내 이름");
    expect(next.children).toBe(tree.children);
  });

  it("patches a nested descendant", () => {
    const tree = makeTree();
    const next = editBody(tree, "p1m1", { label: "결정" });
    expect(selectBodyById(next, "p1m1")?.label).toBe("결정");
  });

  it("returns the same tree ref when the id is missing", () => {
    const tree = makeTree();
    expect(editBody(tree, "ghost", { label: "x" })).toBe(tree);
  });

  it("preserves refs of subtrees that were not touched", () => {
    const tree = makeTree();
    const untouchedSibling = tree.children![1];
    const next = editBody(tree, "p1m1", { label: "결정" });
    expect(next).not.toBe(tree);
    expect(next.children![1]).toBe(untouchedSibling);
  });

  it("allows patching multiple fields at once", () => {
    const tree = makeTree();
    const next = editBody(tree, "p2", { label: "고독", size: 0.5 });
    const p2 = selectBodyById(next, "p2");
    expect(p2?.label).toBe("고독");
    expect(p2?.size).toBe(0.5);
  });
});
