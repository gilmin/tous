import { describe, it, expect, beforeEach, vi } from "vitest";
import type { useSphereStore as UseSphereStore } from "./sphere-store";
import { selectBodyById } from "./tree-ops";

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
  beforeEach(async () => {
    // Drain throttled writes leaked from a prior test before clearing —
    // otherwise a delayed setTimeout would resurrect old state into a fresh
    // store's rehydrate window.
    await new Promise((r) => setTimeout(r, 150));
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

  it("setFocus(null) forces mode back to normal", async () => {
    const useStore = await freshStore();
    useStore.getState().setFocus("p1");
    useStore.getState().setMode("edit");
    expect(useStore.getState().mode).toBe("edit");
    useStore.getState().setFocus(null);
    expect(useStore.getState().mode).toBe("normal");
  });

  it("setMode transitions the mode flag", async () => {
    const useStore = await freshStore();
    useStore.getState().setMode("edit");
    expect(useStore.getState().mode).toBe("edit");
    useStore.getState().setMode("normal");
    expect(useStore.getState().mode).toBe("normal");
  });

  it("editBody updates the label of an existing body", async () => {
    const useStore = await freshStore();
    const target = useStore.getState().tree.children?.[0];
    expect(target).toBeDefined();
    useStore.getState().editBody(target!.id, { label: "새 이름" });
    const updated = useStore.getState().tree.children?.[0];
    expect(updated?.label).toBe("새 이름");
    expect(updated?.id).toBe(target!.id);
  });

  it("editBody persists the change across rehydration", async () => {
    const useStore = await freshStore();
    const targetId = useStore.getState().tree.children?.[0]?.id;
    expect(targetId).toBeDefined();
    useStore.getState().editBody(targetId!, { label: "영속" });
    await new Promise((r) => setTimeout(r, 150));

    const fresh = await freshStore();
    expect(fresh.getState().tree.children?.[0]?.label).toBe("영속");
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

  it("addChild adds a child with clamped size under the parent", async () => {
    const useStore = await freshStore();
    const parent = selectBodyById(useStore.getState().tree, "p1");
    expect(parent).not.toBeNull();
    const before = parent?.children?.length ?? 0;
    useStore.getState().addChild("p1", "새 자식");
    const after = selectBodyById(useStore.getState().tree, "p1");
    expect(after?.children?.length).toBe(before + 1);
    const added = after?.children?.[after.children.length - 1];
    expect(added?.label).toBe("새 자식");
    // p1.size in SYSTEM seed is 0.18 → 0.18 * 0.6 = 0.108
    expect(added?.size).toBeCloseTo(0.108);
  });

  it("addChild on a missing parent leaves the tree unchanged", async () => {
    const useStore = await freshStore();
    const before = structuredClone(useStore.getState().tree);
    useStore.getState().addChild("ghost", "x");
    expect(useStore.getState().tree).toEqual(before);
  });

  it("deleteBody removes the body and all its descendants", async () => {
    const useStore = await freshStore();
    // SYSTEM seed: p1 has a child p1m1.
    expect(selectBodyById(useStore.getState().tree, "p1m1")).not.toBeNull();
    useStore.getState().deleteBody("p1");
    expect(selectBodyById(useStore.getState().tree, "p1")).toBeNull();
    expect(selectBodyById(useStore.getState().tree, "p1m1")).toBeNull();
  });

  it("deleteBody clears focus when the focused body is removed", async () => {
    const useStore = await freshStore();
    useStore.getState().setFocus("p1");
    expect(useStore.getState().focusedId).toBe("p1");
    useStore.getState().deleteBody("p1");
    expect(useStore.getState().focusedId).toBeNull();
    expect(useStore.getState().mode).toBe("normal");
  });

  it("deleteBody rejects deleting Self (root) via any path", async () => {
    const useStore = await freshStore();
    const rootId = useStore.getState().tree.id;
    const before = structuredClone(useStore.getState().tree);
    useStore.getState().deleteBody(rootId);
    expect(useStore.getState().tree).toEqual(before);
  });

  it("deleteBody persists the removal across rehydration", async () => {
    const useStore = await freshStore();
    useStore.getState().deleteBody("p2");
    await new Promise((r) => setTimeout(r, 150));

    const fresh = await freshStore();
    expect(selectBodyById(fresh.getState().tree, "p2")).toBeNull();
  });
});

describe("sphere-store undo/redo (#12)", () => {
  beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 150));
    window.localStorage.clear();
  });

  it("starts with empty history on a fresh load", async () => {
    const useStore = await freshStore();
    expect(useStore.temporal.getState().pastStates).toHaveLength(0);
    expect(useStore.temporal.getState().futureStates).toHaveLength(0);
  });

  it("undo reverts the last edit; redo reapplies it", async () => {
    const useStore = await freshStore();
    const before = selectBodyById(useStore.getState().tree, "p1")?.label;
    useStore.getState().editBody("p1", { label: "바뀐 이름" });
    expect(selectBodyById(useStore.getState().tree, "p1")?.label).toBe(
      "바뀐 이름",
    );

    useStore.temporal.getState().undo();
    expect(selectBodyById(useStore.getState().tree, "p1")?.label).toBe(before);

    useStore.temporal.getState().redo();
    expect(selectBodyById(useStore.getState().tree, "p1")?.label).toBe(
      "바뀐 이름",
    );
  });

  it("does not record focus / mode changes in history (only structure)", async () => {
    const useStore = await freshStore();
    useStore.getState().setFocus("p1");
    useStore.getState().setFocus("p2");
    useStore.getState().setMode("edit");
    useStore.getState().setMode("normal");
    expect(useStore.temporal.getState().pastStates).toHaveLength(0);

    useStore.getState().editBody("p1", { label: "구조 변경" });
    expect(useStore.temporal.getState().pastStates).toHaveLength(1);
  });

  it("restores a deleted body with all descendants in a single undo", async () => {
    const useStore = await freshStore();
    // SYSTEM seed: p1 has descendant p1m1.
    expect(selectBodyById(useStore.getState().tree, "p1m1")).not.toBeNull();
    useStore.getState().deleteBody("p1");
    expect(selectBodyById(useStore.getState().tree, "p1")).toBeNull();
    expect(selectBodyById(useStore.getState().tree, "p1m1")).toBeNull();

    useStore.temporal.getState().undo();
    expect(selectBodyById(useStore.getState().tree, "p1")).not.toBeNull();
    expect(selectBodyById(useStore.getState().tree, "p1m1")).not.toBeNull();
  });

  it("coalesces a slider drag into a single undo entry", async () => {
    vi.resetModules();
    const mod = await import("./sphere-store");
    const useStore = mod.useSphereStore;
    await useStore.persist.rehydrate();

    const orig = selectBodyById(useStore.getState().tree, "p1")?.size;
    expect(orig).toBeDefined();

    mod.beginSliderCoalesce();
    useStore.getState().editBody("p1", { size: 0.2 });
    useStore.getState().editBody("p1", { size: 0.3 });
    useStore.getState().editBody("p1", { size: 0.4 });
    mod.endSliderCoalesce();

    // Three ticks, one history entry.
    expect(useStore.temporal.getState().pastStates).toHaveLength(1);
    expect(selectBodyById(useStore.getState().tree, "p1")?.size).toBe(0.4);

    // One undo returns to the pre-drag size, not an intermediate tick.
    useStore.temporal.getState().undo();
    expect(selectBodyById(useStore.getState().tree, "p1")?.size).toBe(orig);
  });
});
