import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "../types";
import {
  addChild,
  childSize,
  deleteBody,
  editBody,
  flattenDFS,
  hasBodyId,
  nextBodyId,
  prevBodyId,
  selectBodyById,
} from "./tree-ops";

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

const newBody: OrbitalBody = {
  id: "new",
  label: "New",
  size: 0.3,
  color: "#777",
};

describe("addChild", () => {
  it("appends under the matching parent (which already has a child)", () => {
    const tree = makeTree();
    const next = addChild(tree, "p1", newBody);
    expect(selectBodyById(next, "p1")?.children?.map((c) => c.id)).toEqual([
      "p1m1",
      "new",
    ]);
  });

  it("appends under a parent that has no children yet", () => {
    const tree = makeTree();
    const next = addChild(tree, "p2", newBody);
    expect(selectBodyById(next, "p2")?.children?.map((c) => c.id)).toEqual([
      "new",
    ]);
  });

  it("preserves refs of subtrees that were not touched", () => {
    const tree = makeTree();
    const untouchedSibling = tree.children![1];
    const next = addChild(tree, "p1", newBody);
    expect(next.children![1]).toBe(untouchedSibling);
  });

  it("returns the same tree ref when parentId is missing", () => {
    const tree = makeTree();
    expect(addChild(tree, "ghost", newBody)).toBe(tree);
  });

  it("does not mutate the original tree", () => {
    const tree = makeTree();
    addChild(tree, "p2", newBody);
    expect(selectBodyById(tree, "p2")?.children).toBeUndefined();
  });
});

describe("childSize", () => {
  it("shrinks to 60% of the parent", () => {
    expect(childSize(1)).toBeCloseTo(0.6);
  });
  it("clamps to a 0.05 floor", () => {
    expect(childSize(0.05)).toBe(0.05);
    expect(childSize(0)).toBe(0.05);
  });
});

describe("flattenDFS", () => {
  it("returns DFS pre-order (parent before children, siblings L→R)", () => {
    const tree = makeTree();
    expect(flattenDFS(tree).map((b) => b.id)).toEqual([
      "self",
      "p1",
      "p1m1",
      "p2",
    ]);
  });

  it("returns just the root for a childless tree", () => {
    const solo: OrbitalBody = { id: "self", size: 1, color: "#000" };
    expect(flattenDFS(solo).map((b) => b.id)).toEqual(["self"]);
  });
});

describe("nextBodyId / prevBodyId — circular DFS nav", () => {
  const flat = () => flattenDFS(makeTree()); // [self, p1, p1m1, p2]

  it("moves forward / backward in DFS order", () => {
    expect(nextBodyId(flat(), "self")).toBe("p1");
    expect(nextBodyId(flat(), "p1")).toBe("p1m1");
    expect(prevBodyId(flat(), "p1m1")).toBe("p1");
  });

  it("wraps at the ends (last → self forward, self → last backward)", () => {
    expect(nextBodyId(flat(), "p2")).toBe("self");
    expect(prevBodyId(flat(), "self")).toBe("p2");
  });

  it("stays put when the tree has a single Body", () => {
    const solo = [{ id: "self", size: 1, color: "#000" }] as OrbitalBody[];
    expect(nextBodyId(solo, "self")).toBe("self");
    expect(prevBodyId(solo, "self")).toBe("self");
  });

  it("starts from an end when there is no current focus", () => {
    expect(nextBodyId(flat(), null)).toBe("self");
    expect(prevBodyId(flat(), null)).toBe("p2");
  });

  it("starts from an end when currentId is missing from the list", () => {
    expect(nextBodyId(flat(), "ghost")).toBe("self");
    expect(prevBodyId(flat(), "ghost")).toBe("p2");
  });

  it("returns null for an empty list", () => {
    expect(nextBodyId([], "self")).toBeNull();
    expect(prevBodyId([], "self")).toBeNull();
  });
});

describe("deleteBody", () => {
  it("removes a leaf body", () => {
    const tree = makeTree();
    const next = deleteBody(tree, "p2");
    expect(selectBodyById(next, "p2")).toBeNull();
    expect(next.children?.map((c) => c.id)).toEqual(["p1"]);
  });

  it("removes a body together with all of its descendants (no orphans)", () => {
    const tree = makeTree();
    const next = deleteBody(tree, "p1");
    expect(selectBodyById(next, "p1")).toBeNull();
    // p1m1 was a child of p1 — it must be gone too, not reparented.
    expect(selectBodyById(next, "p1m1")).toBeNull();
  });

  it("removes a nested descendant without touching its siblings", () => {
    const tree = makeTree();
    const next = deleteBody(tree, "p1m1");
    expect(selectBodyById(next, "p1m1")).toBeNull();
    expect(selectBodyById(next, "p1")?.children).toEqual([]);
  });

  it("returns the same tree ref when the id is missing", () => {
    const tree = makeTree();
    expect(deleteBody(tree, "ghost")).toBe(tree);
  });

  it("returns the same tree ref when asked to delete the root (Self)", () => {
    const tree = makeTree();
    expect(deleteBody(tree, "self")).toBe(tree);
  });

  it("preserves refs of subtrees that were not touched", () => {
    const tree = makeTree();
    const untouchedSibling = tree.children![0];
    const next = deleteBody(tree, "p2");
    expect(next.children![0]).toBe(untouchedSibling);
  });

  it("does not mutate the original tree", () => {
    const tree = makeTree();
    deleteBody(tree, "p1");
    expect(tree.children?.map((c) => c.id)).toEqual(["p1", "p2"]);
  });
});
