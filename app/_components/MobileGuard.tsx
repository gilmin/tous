"use client";

import { useEffect, useState } from "react";

// Mobile guard (M5-B). v1 is desktop-only by design (드래그/키보드 인터랙션이
// 터치와 충돌 — 설계 §핵심 결정). Small screens get an explicit notice instead
// of a broken-feeling scene; "그래도 볼래요" lets the curious through for the
// session (sessionStorage), since the 3D view itself does render on phones.
const BREAKPOINT_PX = 768;
const SESSION_KEY = "tous:mobile-ok";

export function MobileGuard() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* storage unavailable → still guard by width */
    }
    if (window.innerWidth < BREAKPOINT_PX) setBlocked(true);
  }, []);

  if (!blocked) return null;

  const proceed = () => {
    setBlocked(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* fine — guard reappears on next page */
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 28,
        textAlign: "center",
        background: "rgba(12,8,28,0.96)",
        color: "#fff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 34 }}>🪐</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        tous는 아직 데스크탑 전용이에요
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.75)",
          maxWidth: 320,
        }}
      >
        우주를 만들고 탐험하는 조작이 마우스와 키보드에 맞춰져 있어요.
        넓은 화면에서 다시 만나요.
      </div>
      <button
        onClick={proceed}
        style={{
          marginTop: 8,
          padding: "10px 22px",
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.22)",
          background: "rgba(43,28,84,0.55)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        그래도 볼래요
      </button>
    </div>
  );
}
