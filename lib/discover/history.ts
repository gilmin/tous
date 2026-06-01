import type { OrbitalBody } from "@/app/scene/types";

// Pure session-history logic for /discover (ADR-0003). Two independent lists:
//
//  - visited:  recent short_codes fed to random_public_sphere(exclude) so the
//              server skips spheres we just saw. Deduped, most-recent last,
//              capped at VISITED_CAP.
//  - history:  the back stack — full spheres (tree included) so "back" restores
//              the previous one instantly without a refetch. Capped at HISTORY_CAP.
//
// All functions are pure (return new arrays); localStorage persistence lives in
// the thin load/save wrappers at the bottom so the core stays unit-testable.

export const VISITED_CAP = 20;
export const HISTORY_CAP = 10;

export type Seen = { shortCode: string; tree: OrbitalBody };

// Append `code` to the visited list. If already present, the old occurrence is
// dropped so the code moves to the most-recent end (no duplicates). Trimmed to
// the last VISITED_CAP entries.
export function pushVisited(
  visited: string[],
  code: string,
  cap = VISITED_CAP,
): string[] {
  const next = visited.filter((c) => c !== code);
  next.push(code);
  return next.slice(-cap);
}

// Push a seen sphere onto the back stack. Trimmed to the last HISTORY_CAP.
// No dedup — revisiting the same sphere is a legitimate stack entry.
export function pushHistory(
  history: Seen[],
  entry: Seen,
  cap = HISTORY_CAP,
): Seen[] {
  return [...history, entry].slice(-cap);
}

// Pop the most-recent entry off the back stack. Returns the popped entry (or
// null when empty) plus the shrunk stack.
export function back(history: Seen[]): {
  history: Seen[];
  entry: Seen | null;
} {
  if (history.length === 0) return { history, entry: null };
  return { history: history.slice(0, -1), entry: history[history.length - 1] };
}

// Exhaustion detector. The server only returns a code we already excluded when
// its exclude-ignoring fallback fired (migration 0005, fallback 2) — i.e. the
// visited list now covers the whole eligible pool. When that happens the caller
// should reset `visited` so exclusion can start fresh instead of growing forever.
export function shouldReset(visited: string[], fetchedCode: string): boolean {
  return visited.includes(fetchedCode);
}

// --- localStorage persistence (thin, impure wrappers) ---

const STORAGE_KEY = "tous:discover:v1";

type PersistedState = { visited: string[]; history: Seen[] };

export function loadDiscoverState(): PersistedState {
  if (typeof window === "undefined") return { visited: [], history: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visited: [], history: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    // Corrupt JSON → start clean rather than crash the discover session.
    return { visited: [], history: [] };
  }
}

export function saveDiscoverState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private-mode failures are non-fatal for a transient back stack.
  }
}
