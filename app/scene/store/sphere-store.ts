"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import type { OrbitalBody } from "../types";
import { SYSTEM } from "../seed";
import { hasBodyId, selectBodyById } from "./tree-ops";

export type Mode = "normal" | "edit" | "add" | "delete-confirm";

export type SphereState = {
  tree: OrbitalBody;
  lastFocused: string | null;
  focusedId: string | null;
  mode: Mode;
  setFocus: (id: string | null) => void;
  setMode: (m: Mode) => void;
  editBody: (id: string, patch: Partial<OrbitalBody>) => void;
};

export const STORAGE_KEY = "tous:sphere:v1";
export const PERSIST_THROTTLE_MS = 100;

function makeThrottledStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  let lastWriteAt = 0;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: string | null = null;
  return {
    getItem: (name: string) => window.localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      const now = Date.now();
      const elapsed = now - lastWriteAt;
      pendingValue = value;
      if (elapsed >= PERSIST_THROTTLE_MS) {
        lastWriteAt = now;
        window.localStorage.setItem(name, value);
        pendingValue = null;
        return;
      }
      if (pendingTimeout) clearTimeout(pendingTimeout);
      pendingTimeout = setTimeout(() => {
        lastWriteAt = Date.now();
        if (pendingValue !== null) {
          window.localStorage.setItem(name, pendingValue);
          pendingValue = null;
        }
        pendingTimeout = null;
      }, PERSIST_THROTTLE_MS - elapsed);
    },
    removeItem: (name: string) => window.localStorage.removeItem(name),
  };
}

export const useSphereStore = create<SphereState>()(
  persist(
    temporal(
      immer((set) => ({
        tree: structuredClone(SYSTEM),
        lastFocused: SYSTEM.id,
        focusedId: null,
        mode: "normal" as Mode,
        setFocus: (id: string | null) =>
          set((s) => {
            s.focusedId = id;
            if (id) s.lastFocused = id;
            // Invariant: edit mode requires a focused body. Clearing focus
            // forces a return to normal so the next focus does not reopen
            // an input that the user already abandoned.
            else s.mode = "normal";
          }),
        setMode: (m: Mode) =>
          set((s) => {
            s.mode = m;
          }),
        editBody: (id: string, patch: Partial<OrbitalBody>) =>
          set((s) => {
            const body = selectBodyById(s.tree, id);
            if (body) Object.assign(body, patch);
          }),
      })),
      {
        partialize: (state) => ({ tree: state.tree }),
        limit: 50,
      },
    ),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(makeThrottledStorage),
      partialize: (state) =>
        ({
          tree: state.tree,
          lastFocused: state.lastFocused,
        }) as Partial<SphereState>,
      version: 1,
      migrate: (persisted, version) => {
        if (version !== 1) {
          return {
            tree: structuredClone(SYSTEM),
            lastFocused: SYSTEM.id,
          } as Partial<SphereState>;
        }
        return persisted as Partial<SphereState>;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn(
            "[sphere] localStorage 손상, SYSTEM seed로 fallback",
            error,
          );
          return;
        }
        if (
          state &&
          state.lastFocused &&
          !hasBodyId(state.tree, state.lastFocused)
        ) {
          state.lastFocused = state.tree.id;
        }
      },
    },
  ),
);
