"use client";

import type { ReactNode } from "react";
import { useStore, type StoreApi } from "zustand";
import { COSMIC_BG } from "@/app/scene/cosmic-env";
import { focusForKey } from "@/app/scene/store/focus-key";
import type { SceneReadState } from "@/app/scene/store/scene-store-context";

// Shared chrome for every Warp host. Before this module each exploration host
// kept its own copy of the bottom nav, the centered status message, and the
// error toast — identical styling, drifting only by accident. One place now.

// Shared bottom-center row position for both the warp nav and the focus nav.
const bottomRowStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "calc(28px + env(safe-area-inset-bottom))",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 40,
  display: "flex",
  gap: 10,
  fontFamily: "var(--font-cute), system-ui, sans-serif",
};

// Bottom-center back / next row. Hosts that render this also render
// <FocusLabel lifted> so the focused-Body label clears these buttons.
export function WarpBottomNav({
  canGoBack,
  onBack,
  onNext,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div style={bottomRowStyle}>
      <button onClick={onBack} disabled={!canGoBack} style={btnStyle(!canGoBack)}>
        ← 뒤로
      </button>
      <button onClick={onNext} style={btnStyle(false)}>
        다음 우주 →
      </button>
    </div>
  );
}

// While a Body is focused, the bottom row navigates *within* the Universe:
// ← / → cycle focus through its bodies (DFS, circular) — the touch equivalent of
// the ←/→ keyboard nav. Empty-space tap clears focus and restores WarpBottomNav.
export function WarpFocusNav({ store }: { store: StoreApi<SceneReadState> }) {
  const move = (code: "ArrowLeft" | "ArrowRight") => {
    const { tree, focusedId, setFocus } = store.getState();
    const r = focusForKey(tree, focusedId, code);
    if (r) setFocus(r.focusId);
  };
  return (
    <div style={bottomRowStyle}>
      <button
        onClick={() => move("ArrowLeft")}
        aria-label="이전 행성"
        style={btnStyle(false)}
      >
        ←
      </button>
      <button
        onClick={() => move("ArrowRight")}
        aria-label="다음 행성"
        style={btnStyle(false)}
      >
        →
      </button>
    </div>
  );
}

// The warp host's focus-aware bottom row: ←/→ within-Universe focus nav while a
// Body is focused, otherwise the back / next-Universe warp controls.
export function WarpNav({
  store,
  canGoBack,
  onBack,
  onNext,
}: {
  store: StoreApi<SceneReadState>;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const focused = useStore(store, (s) => s.focusedId !== null);
  return focused ? (
    <WarpFocusNav store={store} />
  ) : (
    <WarpBottomNav canGoBack={canGoBack} onBack={onBack} onNext={onNext} />
  );
}

// Full-screen centered status message (loading / empty pool) over the void.
export function WarpMessage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        color: "rgba(255,255,255,0.85)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 16,
        background: COSMIC_BG,
      }}
    >
      {children}
    </div>
  );
}

// Transient error toast near the top.
export function WarpFlash({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 45,
        padding: "8px 16px",
        borderRadius: 999,
        background: "rgba(20,20,24,0.8)",
        color: "#fff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.22)",
    background: disabled ? "rgba(43,28,84,0.35)" : "rgba(43,28,84,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: disabled ? "rgba(255,255,255,0.4)" : "#fff",
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 6px 18px rgba(20,10,50,0.35)",
  };
}
