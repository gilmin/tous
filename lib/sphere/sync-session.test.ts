import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startSyncSession,
  SYNC_DEBOUNCE_MS,
  type LoadResult,
  type SyncLocalStore,
  type SyncTransport,
} from "./sync-session";
import type { OrbitalBody } from "@/app/scene/types";

// The session never inspects tree fields — it routes trees by reference — so a
// bare id object stands in for a real OrbitalBody.
const makeTree = (id: string) => ({ id }) as unknown as OrbitalBody;

// Flush queued microtasks (the load → push promise chains) without advancing the
// debounce clock.
async function settle() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

function fakeTransport(load: LoadResult | (() => Promise<LoadResult>)) {
  const pushes: OrbitalBody[] = [];
  const loadFn = typeof load === "function" ? load : async () => load;
  const transport: SyncTransport = {
    load: vi.fn(loadFn),
    push: vi.fn(async (tree: OrbitalBody) => {
      pushes.push(tree);
      return true;
    }),
  };
  return { transport, pushes };
}

function fakeStore(initial: OrbitalBody) {
  let current = initial;
  let listener: ((tree: OrbitalBody) => void) | null = null;
  const setCalls: OrbitalBody[] = [];
  let cleared = 0;
  const store: SyncLocalStore = {
    getTree: () => current,
    setTree: (tree) => {
      current = tree;
      setCalls.push(tree);
    },
    clearHistory: () => {
      cleared += 1;
    },
    subscribe: (onChange) => {
      listener = onChange;
      return () => {
        listener = null;
      };
    },
  };
  return {
    store,
    setCalls,
    cleared: () => cleared,
    subscribed: () => listener !== null,
    // Simulate a local tree edit firing the store's change notification.
    edit: (tree: OrbitalBody) => {
      current = tree;
      listener?.(tree);
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("startSyncSession", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("seeds the server from the local tree when no row exists", async () => {
    const local = makeTree("local");
    const { transport, pushes } = fakeTransport({ status: "empty" });
    const { store } = fakeStore(local);

    startSyncSession({ transport, store });
    await settle();

    expect(transport.push).toHaveBeenCalledTimes(1);
    expect(pushes[0]).toBe(local);
  });

  it("lets the server row win on load: hydrates the store and clears undo", async () => {
    const local = makeTree("local");
    const server = makeTree("server");
    const { transport } = fakeTransport({ status: "row", tree: server });
    const fs = fakeStore(local);

    startSyncSession({ transport, store: fs.store });
    await settle();

    expect(fs.setCalls).toEqual([server]);
    expect(fs.cleared()).toBe(1);
    expect(transport.push).not.toHaveBeenCalled();
  });

  it("suppresses the hydration echo (no push of the value just loaded)", async () => {
    const server = makeTree("server");
    const { transport } = fakeTransport({ status: "row", tree: server });
    const fs = fakeStore(makeTree("local"));

    startSyncSession({ transport, store: fs.store });
    await settle();

    fs.edit(server); // the change the hydration itself triggers
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);

    expect(transport.push).not.toHaveBeenCalled();
  });

  it("debounces a burst of edits into a single push of the latest", async () => {
    const server = makeTree("server");
    const a = makeTree("a");
    const b = makeTree("b");
    const { transport, pushes } = fakeTransport({ status: "row", tree: server });
    const fs = fakeStore(makeTree("local"));

    startSyncSession({ transport, store: fs.store });
    await settle();

    fs.edit(a);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS / 2);
    fs.edit(b);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);

    expect(transport.push).toHaveBeenCalledTimes(1);
    expect(pushes[0]).toBe(b);
  });

  it("cancels a pending local push when a server row lands mid-load", async () => {
    const local = makeTree("local");
    const edited = makeTree("edited");
    const server = makeTree("server");
    const load = deferred<LoadResult>();
    const { transport } = fakeTransport(() => load.promise);
    const fs = fakeStore(local);

    startSyncSession({ transport, store: fs.store });
    // An edit arrives while load() is still in flight.
    fs.edit(edited);
    // The server now answers with a stored row.
    load.resolve({ status: "row", tree: server });
    await settle();
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);

    expect(fs.setCalls).toEqual([server]);
    expect(transport.push).not.toHaveBeenCalled();
  });

  it("flushes the last pending edit on stop (edit-then-leave isn't lost)", async () => {
    const server = makeTree("server");
    const a = makeTree("a");
    const { transport, pushes } = fakeTransport({ status: "row", tree: server });
    const fs = fakeStore(makeTree("local"));

    const session = startSyncSession({ transport, store: fs.store });
    await settle();

    fs.edit(a); // schedules a debounced push that hasn't fired yet
    session.stop();
    await settle();

    expect(transport.push).toHaveBeenCalledTimes(1);
    expect(pushes[0]).toBe(a);
    expect(fs.subscribed()).toBe(false);
  });

  it("ignores a load that resolves after stop", async () => {
    const server = makeTree("server");
    const load = deferred<LoadResult>();
    const { transport } = fakeTransport(() => load.promise);
    const fs = fakeStore(makeTree("local"));

    const session = startSyncSession({ transport, store: fs.store });
    session.stop();
    load.resolve({ status: "row", tree: server });
    await settle();

    expect(fs.setCalls).toEqual([]);
    expect(fs.cleared()).toBe(0);
  });

  it("leaves the local tree untouched on a load error (no hydrate, no seed)", async () => {
    const { transport } = fakeTransport({ status: "error" });
    const fs = fakeStore(makeTree("local"));

    startSyncSession({ transport, store: fs.store });
    await settle();

    expect(fs.setCalls).toEqual([]);
    expect(transport.push).not.toHaveBeenCalled();
  });

  it("acks a pushed tree so re-emitting the same tree doesn't push again", async () => {
    const server = makeTree("server");
    const a = makeTree("a");
    const { transport, pushes } = fakeTransport({ status: "row", tree: server });
    const fs = fakeStore(makeTree("local"));

    startSyncSession({ transport, store: fs.store });
    await settle();

    fs.edit(a);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
    expect(pushes).toEqual([a]); // pushed; serverTree is now a

    fs.edit(a); // same reference re-emitted
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
    expect(transport.push).toHaveBeenCalledTimes(1); // not pushed again
  });
});
