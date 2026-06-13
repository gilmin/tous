import type { OrbitalBody } from "@/app/scene/types";

// The cloud-sync session: the local-first sync policy (eng-review D3) extracted
// from the React effect that used to hold it inline. It is framework-free — no
// supabase, no zustand, no React — so the policy is the interface and the policy
// is testable. Two ports are injected: a transport (server I/O) and a local
// store (the editable tree). The component (app/me/UniverseSync) is the thin
// adapter that builds both ports and runs the session for the mount's lifetime.
//
// The policy, made explicit here:
//   1. load-on-mount, server-wins  — a stored row overrides whatever is local
//   2. first-login seed            — no row yet → push the local tree up
//   3. echo suppression            — never re-push the value we just hydrated
//   4. debounced push              — collapse a burst of edits into one write
//   5. flush-on-stop               — an edit-then-leave is not lost
//   6. clear undo after hydrate    — undo can't walk past the server state

// A stored sphere, no row yet, or a transient failure — kept distinct so the
// session seeds only on a genuine empty (not on an error, which must leave the
// local tree untouched).
export type LoadResult =
  | { status: "row"; tree: OrbitalBody }
  | { status: "empty" }
  | { status: "error" };

export type SyncTransport = {
  load: () => Promise<LoadResult>;
  // Resolves true once the server holds the tree, false on a transient failure
  // (the session then leaves it un-acked, so the next edit re-pushes).
  push: (tree: OrbitalBody) => Promise<boolean>;
};

export type SyncLocalStore = {
  getTree: () => OrbitalBody;
  setTree: (tree: OrbitalBody) => void;
  // Drop undo history so undo can't reach past freshly-loaded server state.
  clearHistory: () => void;
  // Fire onChange on a real tree edit (the adapter filters out focus/mode/nav,
  // which leave the tree reference stable). Returns an unsubscribe.
  subscribe: (onChange: (tree: OrbitalBody) => void) => () => void;
};

export type SyncSession = { stop: () => void };

export const SYNC_DEBOUNCE_MS = 1500;

export function startSyncSession({
  transport,
  store,
  debounceMs = SYNC_DEBOUNCE_MS,
}: {
  transport: SyncTransport;
  store: SyncLocalStore;
  debounceMs?: number;
}): SyncSession {
  // The tree value currently known to match the server. Drives both echo
  // suppression (3) and skipping a redundant push of a value already stored.
  let serverTree: OrbitalBody | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: OrbitalBody | null = null;
  let stopped = false;

  async function push(tree: OrbitalBody) {
    if (await transport.push(tree)) serverTree = tree;
  }

  function cancelPending() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = null;
  }

  // (4) Debounce: hold the latest edit, write it once the burst settles.
  function schedule(tree: OrbitalBody) {
    pending = tree;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (pending) {
        void push(pending);
        pending = null;
      }
    }, debounceMs);
  }

  // (1)(2)(6) Load-on-mount. A row wins over anything edited during the load
  // window: set serverTree BEFORE setTree so the resulting change reads as an
  // echo (3), cancel any pending local push, hydrate, then clear undo. No row →
  // seed the server from the local tree (first login carries it to the cloud).
  async function start() {
    const result = await transport.load();
    if (stopped) return;
    if (result.status === "error") return;
    if (result.status === "row") {
      serverTree = result.tree;
      cancelPending();
      store.setTree(result.tree);
      store.clearHistory();
    } else {
      void push(store.getTree());
    }
  }

  const unsubscribe = store.subscribe((tree) => {
    if (tree === serverTree) return; // (3) hydration echo / already stored
    schedule(tree);
  });

  void start();

  return {
    // (5) Flush the last pending edit so edit-then-leave isn't lost.
    stop() {
      stopped = true;
      unsubscribe();
      if (timer) {
        clearTimeout(timer);
        timer = null;
        if (pending) {
          void push(pending);
          pending = null;
        }
      }
    },
  };
}
