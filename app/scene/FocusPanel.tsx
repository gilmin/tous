"use client";

import { useSphereStore } from "./store/sphere-store";
import { selectBodyById } from "./store/tree-ops";
import type { SceneVariant } from "./types";

export function FocusPanel({ variant }: { variant: SceneVariant }) {
  const focusedBody = useSphereStore((s) =>
    s.focusedId ? selectBodyById(s.tree, s.focusedId) : null,
  );
  const setFocus = useSphereStore((s) => s.setFocus);
  if (!focusedBody) return null;

  const isMono = variant === "mono";

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 36,
        transform: "translateX(-50%)",
        zIndex: 30,
        padding: "14px 22px",
        minWidth: 220,
        textAlign: "center",
        background: isMono ? "rgba(255,255,255,0.85)" : "rgba(15,15,20,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: isMono
          ? "1px solid rgba(0,0,0,0.08)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        color: isMono ? "#1a1a1a" : "#f5f5f7",
        fontFamily: "system-ui, sans-serif",
        boxShadow: isMono
          ? "0 8px 24px rgba(0,0,0,0.06)"
          : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.01em" }}>
        {focusedBody.label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          opacity: 0.55,
        }}
      >
        빈 공간 클릭 또는 ESC로 닫기
      </div>
      <button
        onClick={() => setFocus(null)}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          width: 24,
          height: 24,
          padding: 0,
          background: "transparent",
          border: "none",
          color: isMono ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
