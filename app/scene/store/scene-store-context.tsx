"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useStore, type StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";
import type { OrbitalBody } from "../types";
import { useSphereStore } from "./sphere-store";

// The minimal slice the 3D scene components read. The editable store
// (useSphereStore) is a superset; the read-only public viewer supplies its own
// instance with this exact shape. Injecting the store lets System / OrbitingBody
// / CameraController / FocusRing render either the owner's live store or a
// foreign (public) sphere without change.
export type SceneReadState = {
  tree: OrbitalBody;
  focusedId: string | null;
  setFocus: (id: string | null) => void;
};

// Default = the singleton editable store, so the editable Scene needs NO
// Provider and behaves exactly as before. Only the public viewer overrides it.
const SceneStoreContext = createContext<StoreApi<SceneReadState>>(
  useSphereStore as unknown as StoreApi<SceneReadState>,
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

// Read-only store for a foreign (public) sphere: focus is local, no persistence
// / undo / editing. `setTree` lets /discover swap the displayed sphere in place
// (ADR-0003 D1) without remounting the Canvas; swapping also clears focus so the
// new sphere starts unfocused. The scene components only read the SceneReadState
// slice via context, so the extra action is invisible to them.
export type PublicSphereStore = SceneReadState & {
  setTree: (tree: OrbitalBody) => void;
};

export function createPublicSphereStore(tree: OrbitalBody) {
  return createStore<PublicSphereStore>((set) => ({
    tree,
    focusedId: null,
    setFocus: (id) => set({ focusedId: id }),
    setTree: (next) => set({ tree: next, focusedId: null }),
  }));
}
