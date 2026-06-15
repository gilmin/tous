"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getHeartState, toggleHeart } from "@/lib/sphere/hearts";
import { useCoarsePointer } from "./useCoarsePointer";

// Heart (like) toggle for a published sphere (#13). Default: fixed top corner
// (`side`, default "right" for discover/share). `inline` mode drops the fixed
// positioning so the button flows inside another control cluster — /me renders it
// inline beside the publish toggle, since /me's top-left is the global Nav and its
// top-right is the publish/sign-out column (a standalone fixed corner would hide
// behind the nav or float away from its context).
// Anyone can press it (including the owner viewing their own universe); the count
// + my-heart state load on mount and update optimistically, reconciling with the
// server's returned count.
// `interactive` (default true) is the toggle affordance. /me passes false once the
// universe is unpublished: hearts can't be added to a private sphere, so the button
// becomes a read-only display of the hearts already earned (filled heart + count).
export function HeartButton({
  shortCode,
  side = "right",
  inline = false,
  interactive = true,
}: {
  shortCode: string;
  side?: "left" | "right";
  inline?: boolean;
  interactive?: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [count, setCount] = useState(0);
  const [hearted, setHearted] = useState(false);
  const [busy, setBusy] = useState(false);
  // The fixed-corner heart (discover / share) shrinks on touch to match the
  // scaled-down nav. The inline /me heart is left alone — its parent cluster is
  // already scaled by the .me-chrome transform, so shrinking here would double up.
  const compact = useCoarsePointer() && !inline;

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
      onClick={interactive ? onClick : undefined}
      aria-pressed={interactive ? hearted : undefined}
      aria-label={
        interactive ? (hearted ? "하트 취소" : "하트") : `받은 하트 ${count}개`
      }
      style={{
        ...(inline
          ? {}
          : {
              position: "fixed",
              top: 16,
              ...(side === "left" ? { left: 16 } : { right: 16 }),
              zIndex: 45,
            }),
        display: "flex",
        alignItems: "center",
        gap: compact ? 6 : 7,
        padding: compact ? "7px 13px" : "8px 15px",
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.22)",
        background: "rgba(43,28,84,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
        color: "#fff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: compact ? 12 : 15,
        fontWeight: 700,
        cursor: interactive ? "pointer" : "default",
        transition: "transform 0.12s",
        transform: interactive && hearted ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: compact ? 14 : 17, lineHeight: 1 }}>
        {interactive ? (hearted ? "❤️" : "🤍") : "❤️"}
      </span>
      <span style={{ minWidth: compact ? 10 : 12, textAlign: "left" }}>
        {count}
      </span>
    </button>
  );
}
