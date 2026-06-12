import { describe, it, expect } from "vitest";
import type { OrbitalBody } from "@/app/scene/types";
import { VISITED_CAP, HISTORY_CAP } from "@/lib/discover/history";
import {
  initialWarpState,
  commitEntry,
  goBackState,
  noNextState,
  restoreState,
  canGoBack,
  type WarpEntry,
  type WarpState,
} from "./session";

const tree = (id: string): OrbitalBody => ({ id, size: 1, color: "#000" });
const entry = (key: string): WarpEntry => ({ key, tree: tree(key) });

// Seed a "ready" session sitting on `current` with the given visited/history.
const ready = (
  current: string,
  visited: string[] = [],
  history: WarpEntry[] = [],
): WarpState => ({
  current: entry(current),
  visited,
  history,
  status: "ready",
});

describe("commitEntry — the once-and-only-once back-stack push (ISSUE-001 class)", () => {
  it("pushes the leaving Universe onto the back stack exactly once", () => {
    const next = commitEntry(ready("a", ["a"]), entry("b"));
    expect(next.history).toEqual([entry("a")]);
    expect(next.current).toEqual(entry("b"));
  });

  it("does NOT push on the first commit (nothing to leave)", () => {
    const next = commitEntry(initialWarpState, entry("a"));
    expect(next.history).toEqual([]);
    expect(next.current).toEqual(entry("a"));
    expect(next.status).toBe("ready");
  });

  it("appends a fresh committed key to the visited window, most-recent last", () => {
    const next = commitEntry(ready("a", ["a"]), entry("b"));
    expect(next.visited).toEqual(["a", "b"]);
  });

  it("resets the visited window on exhaustion (server re-served an excluded key)", () => {
    // 'b' is already excluded → server ignored exclude → pool exhausted.
    const next = commitEntry(ready("a", ["a", "b"]), entry("b"));
    expect(next.visited).toEqual(["b"]); // window restarts from the new key
  });

  it("caps history at HISTORY_CAP and visited at VISITED_CAP", () => {
    const longHist = Array.from({ length: HISTORY_CAP }, (_, i) => entry(`h${i}`));
    const longVisited = Array.from({ length: VISITED_CAP }, (_, i) => `v${i}`);
    const next = commitEntry(
      { current: entry("cur"), visited: longVisited, history: longHist, status: "ready" },
      entry("new"),
    );
    expect(next.history).toHaveLength(HISTORY_CAP);
    expect(next.history[next.history.length - 1]).toEqual(entry("cur"));
    expect(next.visited).toHaveLength(VISITED_CAP);
    expect(next.visited[next.visited.length - 1]).toBe("new");
  });
});

describe("goBackState", () => {
  it("pops the most-recent entry into current and shrinks the stack", () => {
    const next = goBackState(ready("c", ["a", "b", "c"], [entry("a"), entry("b")]));
    expect(next.current).toEqual(entry("b"));
    expect(next.history).toEqual([entry("a")]);
  });

  it("leaves visited untouched (back is not a fresh view)", () => {
    const next = goBackState(ready("c", ["a", "b", "c"], [entry("b")]));
    expect(next.visited).toEqual(["a", "b", "c"]);
  });

  it("returns the SAME reference on an empty stack (no-op → no re-render)", () => {
    const state = ready("a", ["a"], []);
    expect(goBackState(state)).toBe(state);
  });
});

describe("noNextState — graceful empty pool", () => {
  it("turns the first failed load into an empty pool", () => {
    expect(noNextState({ ...initialWarpState }).status).toBe("empty");
  });

  it("keeps a ready session ready when a mid-session fetch fails", () => {
    expect(noNextState(ready("a")).status).toBe("ready");
  });
});

describe("restoreState", () => {
  it("seeds the session's visited window and back stack", () => {
    const next = restoreState(initialWarpState, ["a", "b"], [entry("a")]);
    expect(next.visited).toEqual(["a", "b"]);
    expect(next.history).toEqual([entry("a")]);
    expect(next.status).toBe("loading"); // still awaiting the first fetch
  });
});

describe("canGoBack", () => {
  it("is true exactly when the back stack is non-empty", () => {
    expect(canGoBack(ready("a", [], []))).toBe(false);
    expect(canGoBack(ready("b", [], [entry("a")]))).toBe(true);
  });
});
