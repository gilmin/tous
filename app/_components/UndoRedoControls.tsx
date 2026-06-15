"use client";

import type { CSSProperties } from "react";
import { useStore } from "zustand";
import { useUniverseStore } from "@/app/scene/store/universe-store";
import { useCoarsePointer } from "./useCoarsePointer";

// 터치 전용 실행취소/다시실행. 데스크탑은 키보드(Cmd/Ctrl+Z, Ctrl+Y)가 처리하고
// 폰엔 키보드가 없으므로 /me 편집기 우하단(엄지 영역)에 ↩︎/↪︎를 띄운다. 히스토리는
// 포커스와 무관 → FocusPanel이 아닌 독립 플로팅. coarse 포인터에서만 렌더(데스크탑
// 크롬 불변).
export function UndoRedoControls() {
  const coarse = useCoarsePointer();
  const canUndo = useStore(
    useUniverseStore.temporal,
    (s) => s.pastStates.length > 0,
  );
  const canRedo = useStore(
    useUniverseStore.temporal,
    (s) => s.futureStates.length > 0,
  );
  if (!coarse) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: "calc(16px + env(safe-area-inset-right))",
        bottom: "calc(20px + env(safe-area-inset-bottom))",
        zIndex: 45,
        display: "flex",
        gap: 8,
        fontFamily: "var(--font-cute), system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => useUniverseStore.temporal.getState().undo()}
        disabled={!canUndo}
        aria-label="실행 취소"
        style={btnStyle(!canUndo)}
      >
        ↩︎
      </button>
      <button
        onClick={() => useUniverseStore.temporal.getState().redo()}
        disabled={!canRedo}
        aria-label="다시 실행"
        style={btnStyle(!canRedo)}
      >
        ↪︎
      </button>
    </div>
  );
}

function btnStyle(disabled: boolean): CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.22)",
    background: disabled ? "rgba(43,28,84,0.35)" : "rgba(43,28,84,0.6)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
    fontSize: 20,
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 6px 18px rgba(20,10,50,0.35)",
  };
}
