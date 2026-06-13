"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import * as THREE from "three";
import type { OrbitalBody } from "../types";
import { SYSTEM } from "../seed";
import {
  childSize,
  flattenDFS,
  hasBodyId,
  nextBodyId,
  prevBodyId,
  selectBodyById,
} from "./tree-ops";
import { generateOrbitParams } from "./orbit-gen";
import { derivePattern } from "../../_components/planet-pattern";

function hueOf(hex: string): number {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(hex).getHSL(hsl);
  return hsl.h;
}

function circularHueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

// Colour for a newly added child. A child should echo its parent's tone but
// never be an exact copy:
//  • Under the root ("나"): hand each top-level planet a *fresh* colour family —
//    the hue furthest from the ones already in use → varied, distinct planets.
//  • Deeper: keep the parent's hue but nudge lightness (and a hair of hue) so
//    it's clearly related yet not identical.
function childColor(parent: OrbitalBody, isRootParent: boolean): string {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(parent.color).getHSL(hsl);

  if (isRootParent) {
    const used = (parent.children ?? []).map((c) => hueOf(c.color));
    if (used.length === 0) return "#" + new THREE.Color().setHSL(0.58, 0.5, 0.66).getHexString();
    let bestHue = 0;
    let bestGap = -1;
    for (let i = 0; i < 24; i++) {
      const cand = i / 24;
      const gap = Math.min(...used.map((u) => circularHueDist(cand, u)));
      if (gap > bestGap) {
        bestGap = gap;
        bestHue = cand;
      }
    }
    return "#" + new THREE.Color().setHSL(bestHue, 0.5, 0.66).getHexString();
  }

  const n = parent.children?.length ?? 0;
  const lOff = ((n % 3) - 1) * 0.1 + (hsl.l > 0.55 ? -0.06 : 0.06);
  const l2 = THREE.MathUtils.clamp(hsl.l + lOff, 0.32, 0.82);
  const h2 = (hsl.h + (n % 2 ? 0.03 : -0.03) + 1) % 1;
  const s2 = THREE.MathUtils.clamp(hsl.s, 0.25, 0.9);
  return "#" + new THREE.Color().setHSL(h2, s2, l2).getHexString();
}

// Orbit radius for a new child: placed freely (random) within a band, with the
// only hard rule being a minimum spacing so it can't overlap the parent or any
// sibling (radial gap ≥ both radii + margin). Falls back to just outside the
// outermost sibling if a free slot isn't found.
function pickOrbitRadius(parent: OrbitalBody, size: number): number {
  const minR = parent.size + size + 0.4; // clears the parent body
  const sibs = parent.children ?? [];
  const clears = (r: number) =>
    sibs.every(
      (c) => Math.abs((c.orbitRadius ?? 0) - r) >= (c.size ?? 0) + size + 0.3,
    );
  const maxR = minR + (sibs.length + 2) * (size * 2 + 0.7);
  for (let i = 0; i < 24; i++) {
    const r = minR + Math.random() * (maxR - minR);
    if (clears(r)) return r;
  }
  const outer = sibs.length
    ? Math.max(...sibs.map((c) => c.orbitRadius ?? 0))
    : minR;
  return Math.max(minR, outer + size * 2 + 0.6);
}

export type Mode = "normal" | "edit" | "add" | "delete-confirm";

export type UniverseState = {
  tree: OrbitalBody;
  lastFocused: string | null;
  focusedId: string | null;
  mode: Mode;
  setFocus: (id: string | null) => void;
  focusNext: () => void;
  focusPrev: () => void;
  setMode: (m: Mode) => void;
  editBody: (id: string, patch: Partial<OrbitalBody>) => void;
  addChild: (parentId: string, label: string) => void;
  deleteBody: (id: string) => void;
};

export const STORAGE_KEY = "tous:sphere:v1";
export const PERSIST_THROTTLE_MS = 100;

// Slider coalesce (#12, consumed by #13). A size/speed slider drag fires many
// edits per second; we want the whole drag to collapse to one undo entry. While
// a coalesce window is open, only the FIRST edit records history (capturing the
// pre-drag tree); the rest are skipped. shape/color are single-event and never
// open a window. Module-scoped so the temporal `handleSet` closure can read it.
let coalesceActive = false;
let coalesceCommitted = false;

export function beginSliderCoalesce() {
  coalesceActive = true;
  coalesceCommitted = false;
}

export function endSliderCoalesce() {
  coalesceActive = false;
  coalesceCommitted = false;
}

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

export const useUniverseStore = create<UniverseState>()(
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
        // DFS-circular nav (#10). Moves focus to the next/prev Body in
        // pre-order, wrapping at both ends. Stays in NORMAL; the pure helpers
        // (flattenDFS / next|prevBodyId) hold the ordering + wrap contract.
        focusNext: () =>
          set((s) => {
            const id = nextBodyId(flattenDFS(s.tree), s.focusedId);
            if (!id) return;
            s.focusedId = id;
            s.lastFocused = id;
          }),
        focusPrev: () =>
          set((s) => {
            const id = prevBodyId(flattenDFS(s.tree), s.focusedId);
            if (!id) return;
            s.focusedId = id;
            s.lastFocused = id;
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
        addChild: (parentId: string, label: string) =>
          set((s) => {
            const parent = selectBodyById(s.tree, parentId);
            if (!parent) return;
            const id = crypto.randomUUID();
            const isRootParent = parentId === s.tree.id;
            const size = childSize(parent.size);
            // Related-but-distinct colour (varied new family under the root).
            const color = childColor(parent, isRootParent);
            // Bake a surface pattern in at creation (auto-matched from the
            // child's own colour), persisted as real data — not just derived at
            // render — and editable later (#10).
            const { pattern, patternColor } = derivePattern(id, color);
            const params = generateOrbitParams(id);
            // Free placement, constrained only by a minimum non-overlap spacing.
            params.orbitRadius = pickOrbitRadius(parent, size);
            const child: OrbitalBody = {
              id,
              label,
              size,
              color,
              shape: "smooth",
              pattern,
              patternColor,
              ...params,
            };
            if (!parent.children) parent.children = [];
            parent.children.push(child);
          }),
        deleteBody: (id: string) =>
          set((s) => {
            // Self guard (reducer-level): the root Body is undeletable via any
            // path — UI hides the button, but block here too (CONTEXT.md).
            if (id === s.tree.id) return;
            // In-place subtree removal: splicing the matched child drops its
            // whole subtree with it (no orphans). Matches the store's in-place
            // immer style (see addChild); tree-ops.deleteBody is the immutable
            // unit-tested twin.
            const removeFrom = (node: OrbitalBody): boolean => {
              if (!node.children) return false;
              const idx = node.children.findIndex((c) => c.id === id);
              if (idx !== -1) {
                node.children.splice(idx, 1);
                return true;
              }
              return node.children.some(removeFrom);
            };
            if (!removeFrom(s.tree)) return;
            // The deleted body (or an ancestor) may have been focused; clear
            // focus and return to normal so no panel points at a gone Body.
            if (s.focusedId && !hasBodyId(s.tree, s.focusedId)) {
              s.focusedId = null;
              s.mode = "normal";
            }
            if (s.lastFocused && !hasBodyId(s.tree, s.lastFocused)) {
              s.lastFocused = s.tree.id;
            }
          }),
      })),
      {
        partialize: (state) => ({ tree: state.tree }),
        limit: 50,
        // Only structural changes (add/edit/delete) belong in history (D3).
        // immer keeps the tree reference stable when an action touches only
        // focus/mode/lastFocused, so a ref check cheaply skips those — undo
        // walks structure edits, never focus/hover/nav (#12).
        equality: (a, b) => a.tree === b.tree,
        // Collapse a slider drag into one undo entry: record the first edit of
        // the window (its pastState is the pre-drag tree), skip the rest.
        handleSet: (handleSet) => (pastState, replace, currentState, delta) => {
          if (coalesceActive) {
            if (coalesceCommitted) return;
            coalesceCommitted = true;
          }
          // zundo types the recorder as setState (1-2 args) but invokes it with
          // 4 at runtime (see dist/index.js); forward all four.
          (
            handleSet as unknown as (
              p: typeof pastState,
              r: typeof replace,
              c: typeof currentState,
              d: typeof delta,
            ) => void
          )(pastState, replace, currentState, delta);
        },
      },
    ),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(makeThrottledStorage),
      partialize: (state) =>
        ({
          tree: state.tree,
          lastFocused: state.lastFocused,
        }) as Partial<UniverseState>,
      version: 1,
      migrate: (persisted, version) => {
        if (version !== 1) {
          return {
            tree: structuredClone(SYSTEM),
            lastFocused: SYSTEM.id,
          } as Partial<UniverseState>;
        }
        return persisted as Partial<UniverseState>;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn(
            "[universe] localStorage 손상, SYSTEM seed로 fallback",
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
