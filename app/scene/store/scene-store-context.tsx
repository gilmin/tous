"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useStore, type StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";
import type { OrbitalBody } from "../types";
import { useUniverseStore } from "./universe-store";

// The minimal slice the 3D scene components read. The editable store
// (useUniverseStore) is a superset; the read-only foreign viewer supplies its own
// instance with this exact shape. Injecting the store lets System / OrbitingBody
// / CameraController / FocusRing render either the owner's live store or a
// foreign Universe without change.
export type SceneReadState = {
  tree: OrbitalBody;
  focusedId: string | null;
  setFocus: (id: string | null) => void;
};

// Default = the singleton editable store, so the editable Scene needs NO
// Provider and behaves exactly as before. Only the public viewer overrides it.
const SceneStoreContext = createContext<StoreApi<SceneReadState>>(
  useUniverseStore as unknown as StoreApi<SceneReadState>,
);

export function SceneStoreProvider({
  store,
  children,
}: {
  store: StoreApi<SceneReadState>;
  children: ReactNode;
}) {
  return (
    <SceneStoreContext.Provider value={store}>
      {children}
    </SceneStoreContext.Provider>
  );
}

export function useSceneStore<T>(selector: (s: SceneReadState) => T): T {
  return useStore(useContext(SceneStoreContext), selector);
}

// Raw store API for code that must read fresh state inside a frame loop
// (e.g. the camera) rather than via a React subscription.
export function useSceneStoreApi(): StoreApi<SceneReadState> {
  return useContext(SceneStoreContext);
}

// Read-only store for a foreign Universe: focus is local, no persistence
// / undo / editing. `setTree` lets /discover swap the displayed Universe in place
// (ADR-0003 D1) without remounting the Canvas; swapping also clears focus so the
// new Universe starts unfocused. The scene components only read the SceneReadState
// slice via context, so the extra action is invisible to them.
export type ForeignUniverseStore = SceneReadState & {
  setTree: (tree: OrbitalBody) => void;
};

export function createForeignUniverseStore(tree: OrbitalBody) {
  return createStore<ForeignUniverseStore>((set) => ({
    tree,
    focusedId: null,
    setFocus: (id) => set({ focusedId: id }),
    setTree: (next) => set({ tree: next, focusedId: null }),
  }));
}
