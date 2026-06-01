import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "@/app/scene/types";
import {
  pushVisited,
  pushHistory,
  back,
  shouldReset,
  VISITED_CAP,
  HISTORY_CAP,
  type Seen,
} from "./history";

const tree = (id: string): OrbitalBody => ({ id, size: 1, color: "#000" });
const seen = (code: string): Seen => ({ shortCode: code, tree: tree(code) });

describe("pushVisited", () => {
  it("appends a new code at the most-recent end", () => {
    expect(pushVisited(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("dedups: re-seeing a code moves it to the end without duplicating", () => {
    expect(pushVisited(["a", "b", "c"], "a")).toEqual(["b", "c", "a"]);
  });

  it("caps at VISITED_CAP, dropping the oldest", () => {
    const full = Array.from({ length: VISITED_CAP }, (_, i) => `c${i}`);
    const next = pushVisited(full, "new");
    expect(next).toHaveLength(VISITED_CAP);
    expect(next[next.length - 1]).toBe("new");
    expect(next).not.toContain("c0"); // oldest dropped
  });
});

describe("pushHistory", () => {
  it("appends an entry", () => {
    expect(pushHistory([seen("a")], seen("b"))).toEqual([seen("a"), seen("b")]);
  });

  it("caps at HISTORY_CAP, dropping the oldest", () => {
    const full = Array.from({ length: HISTORY_CAP }, (_, i) => seen(`c${i}`));
    const next = pushHistory(full, seen("new"));
    expect(next).toHaveLength(HISTORY_CAP);
    expect(next[next.length - 1]).toEqual(seen("new"));
    expect(next[0]).toEqual(seen("c1")); // c0 dropped
  });
});

describe("back", () => {
  it("pops the most-recent entry and shrinks the stack", () => {
    const { history, entry } = back([seen("a"), seen("b")]);
    expect(entry).toEqual(seen("b"));
    expect(history).toEqual([seen("a")]);
  });

  it("returns null entry on an empty stack", () => {
    const { history, entry } = back([]);
    expect(entry).toBeNull();
    expect(history).toEqual([]);
  });
});

describe("shouldReset", () => {
  it("is true when the server returned an already-excluded code (exhaustion)", () => {
    expect(shouldReset(["a", "b"], "a")).toBe(true);
  });

  it("is false for a fresh code", () => {
    expect(shouldReset(["a", "b"], "c")).toBe(false);
  });
});
