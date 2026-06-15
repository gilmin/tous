"use client";

import { useEffect, useState } from "react";

// First-visit hint card (M5-B onboarding). Lists the page's controls as
// key → action pairs; "알겠어요" dismisses it and a localStorage flag keeps it
// dismissed across sessions. Shown once per storageKey, so /me and /discover
// each get their own first-run hint.
export function OnboardingHint({
  storageKey,
  title,
  lines,
}: {
  storageKey: string;
  title: string;
  lines: [key: string, action: string][];
}) {
  const [show, setShow] = useState(false);

  // localStorage only exists client-side; reading in an effect avoids a
  // hydration mismatch. Private-mode storage failures just skip the hint.
  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setShow(true);
    } catch {
      /* storage unavailable → no hint */
    }
  }, [storageKey]);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* fine — it will show again next visit */
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 48,
        maxWidth: 420,
        width: "calc(100vw - 32px)",
        padding: "18px 22px 14px",
        borderRadius: 18,
        background: "rgba(43,28,84,0.72)",
        border: "2px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(20,10,50,0.45)",
        color: "#fff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {lines.map(([key, action]) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "baseline", gap: 10 }}
          >
            <span
              style={{
                flexShrink: 0,
                minWidth: 86,
                padding: "2px 8px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {key}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
              {action}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={dismiss}
          style={{
            padding: "7px 18px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.14)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          알겠어요
        </button>
      </div>
    </div>
  );
}
