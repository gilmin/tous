"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getHeartState, toggleHeart } from "@/lib/sphere/hearts";

// Heart (like) toggle for someone else's published sphere (#13). Fixed top-right
// so it stays clear of the nav (top-left) and the /discover controls (bottom).
// Anyone can press it; the count + my-heart state load on mount and update
// optimistically, reconciling with the server's returned count.
export function HeartButton({ shortCode }: { shortCode: string }) {
  const [supabase] = useState(() => createClient());
  const [count, setCount] = useState(0);
  const [hearted, setHearted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getHeartState(supabase, shortCode).then((s) => {
      if (active) {
        setCount(s.count);
        setHearted(s.hearted);
      }
    });
    return () => {
      active = false;
    };
  }, [supabase, shortCode]);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    const was = hearted;
    // Optimistic flip.
    setHearted(!was);
    setCount((c) => Math.max(0, c + (was ? -1 : 1)));
    const next = await toggleHeart(supabase, shortCode, was);
    if (next >= 0) setCount(next);
    else {
      // Revert on failure.
      setHearted(was);
      setCount((c) => Math.max(0, c + (was ? 1 : -1)));
    }
    setBusy(false);
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={hearted}
      aria-label={hearted ? "하트 취소" : "하트"}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 15px",
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.22)",
        background: "rgba(43,28,84,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
        color: "#fff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        transition: "transform 0.12s",
        transform: hearted ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: 17, lineHeight: 1 }}>{hearted ? "❤️" : "🤍"}</span>
      <span style={{ minWidth: 12, textAlign: "left" }}>{count}</span>
    </button>
  );
}
