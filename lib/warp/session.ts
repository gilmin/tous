import type { OrbitalBody } from "@/app/scene/types";
import { pushVisited, pushHistory, back, shouldReset } from "@/lib/discover/history";

// The Warp session — the state machine shared by every exploration host
// (/discover, group warp). Before this module the machine lived twice, inlined
// in two components and untested; the ISSUE-001 bug (a double/stale back-stack
// push) was a direct symptom of that. Here the transitions are pure functions
// over WarpState, so the host is left with only the thin glue of "fetch, then
// apply the transition, then run side-effects" (see useWarpSession).
//
// A Pool (CONTEXT.md) supplies the next Universe; the session never knows which
// Pool — it only sees WarpEntry. `key` unifies the public pool's short_code and
// the group pool's sphere id; `meta` carries pool-specific display data
// (e.g. a group member's nickname) the host renders as chrome.

export type WarpEntry = {
  key: string;
  tree: OrbitalBody;
  meta?: Record<string, unknown>;
};

export type WarpStatus = "loading" | "ready" | "empty";

export type WarpState = {
  current: WarpEntry | null;
  // Exclude window fed to the Pool so it skips Universes we just saw. Keys only,
  // deduped, capped at VISITED_CAP.
  visited: string[];
  // Back stack of full entries (tree included) so "back" restores instantly
  // without a refetch. Capped at HISTORY_CAP.
  history: WarpEntry[];
  status: WarpStatus;
};

export const initialWarpState: WarpState = {
  current: null,
  visited: [],
  history: [],
  status: "loading",
};

// Commit a freshly-fetched entry as the current Universe. Pushes the one we're
// leaving onto the back stack (exactly once — this is the operation ISSUE-001
// got wrong), records the new key in the exclude window, and resets that window
// when the Pool signals exhaustion by re-serving an already-excluded key.
export function commitEntry(state: WarpState, entry: WarpEntry): WarpState {
  const base = shouldReset(state.visited, entry.key) ? [] : state.visited;
  const history = state.current
    ? pushHistory(state.history, state.current)
    : state.history;
  return {
    current: entry,
    visited: pushVisited(base, entry.key),
    history,
    status: "ready",
  };
}

// Pop the back stack into current. Visited is left untouched — going back is not
// a fresh view, so it must not shrink the exclude window. A no-op on an empty
// stack returns the same reference so callers (and React) can skip the update.
export function goBackState(state: WarpState): WarpState {
  const { history, entry } = back(state.history);
  if (!entry) return state;
  return { ...state, current: entry, history };
}

// The Pool returned nothing. On the very first load that means an empty pool;
// mid-session it's a transient miss, so we keep the current Universe on screen.
export function noNextState(state: WarpState): WarpState {
  if (state.status !== "loading") return state;
  return { ...state, status: "empty" };
}

// Seed a session from persisted lists (the public pool restores its window/stack
// across reloads; the group pool starts empty). Status stays "loading" until the
// first fetch lands.
export function restoreState(
  state: WarpState,
  visited: string[],
  history: WarpEntry[],
): WarpState {
  return { ...state, visited, history };
}

export function canGoBack(state: WarpState): boolean {
  return state.history.length > 0;
}
