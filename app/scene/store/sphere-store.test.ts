import { describe, it, expect, beforeEach, vi } from "vitest";
import type { useSphereStore as UseSphereStore } from "./sphere-store";

const STORAGE_KEY = "tous:sphere:v1";

async function freshStore(): Promise<typeof UseSphereStore> {
  vi.resetModules();
  const mod = await import("./sphere-store");
  const useStore = mod.useSphereStore;
  // rehydrate() resolves after the hydration attempt regardless of outcome,
  // so awaiting it lets every test observe a settled store.
  await useStore.persist.rehydrate();
  return useStore;
}

describe("sphere-store persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("seeds the SYSTEM universe when localStorage is empty", async () => {
    const useStore = await freshStore();
    const { tree, focusedId, mode } = useStore.getState();
    expect(tree.id).toBe("self");
    expect(tree.children?.length ?? 0).toBeGreaterThan(0);
    expect(focusedId).toBeNull();
    expect(mode).toBe("normal");
  });

  it("falls back to SYSTEM when stored JSON is corrupt", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const useStore = await freshStore();
    expect(useStore.getState().tree.id).toBe("self");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to SYSTEM when persisted version mismatches", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          tree: { id: "ghost", size: 0.5, color: "#000" },
          lastFocused: "ghost",
        },
        version: 0,
      }),
    );
    const useStore = await freshStore();
    expect(useStore.getState().tree.id).toBe("self");
    expect(useStore.getState().lastFocused).toBe("self");
  });

  it("hydrates tree and lastFocused from a valid persisted snapshot", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          tree: {
            id: "self",
            label: "rehydrated",
            size: 1,
            color: "#000",
            children: [],
          },
          lastFocused: "self",
        },
        version: 1,
      }),
    );
    const useStore = await freshStore();
    expect(useStore.getState().tree.label).toBe("rehydrated");
    expect(useStore.getState().lastFocused).toBe("self");
  });

  it("resets lastFocused to root when persisted id no longer exists in tree", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          tree: {
            id: "self",
            label: "root",
            size: 1,
            color: "#000",
            children: [],
          },
          lastFocused: "stale-id",
        },
        version: 1,
      }),
    );
    const useStore = await freshStore();
    expect(useStore.getState().lastFocused).toBe("self");
  });
});

describe("sphere-store actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("setFocus updates focusedId and lastFocused (but not on null)", async () => {
    const useStore = await freshStore();
    useStore.getState().setFocus("p1");
    expect(useStore.getState().focusedId).toBe("p1");
    expect(useStore.getState().lastFocused).toBe("p1");
    useStore.getState().setFocus(null);
    expect(useStore.getState().focusedId).toBeNull();
    expect(useStore.getState().lastFocused).toBe("p1");
  });

  it("setMode transitions the mode flag", async () => {
    const useStore = await freshStore();
    useStore.getState().setMode("edit");
    expect(useStore.getState().mode).toBe("edit");
    useStore.getState().setMode("normal");
    expect(useStore.getState().mode).toBe("normal");
  });

  it("persists tree and lastFocused but not focusedId or mode", async () => {
    const useStore = await freshStore();
    useStore.getState().setFocus("p1");
    useStore.getState().setMode("edit");

    // throttle: persist may delay write up to 100ms. Flush by awaiting.
    await new Promise((r) => setTimeout(r, 150));

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.lastFocused).toBe("p1");
    expect(parsed.state.tree.id).toBe("self");
    expect(parsed.state.focusedId).toBeUndefined();
    expect(parsed.state.mode).toBeUndefined();
  });
});
