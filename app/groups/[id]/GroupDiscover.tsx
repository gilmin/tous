"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PublicScene from "@/app/scene/PublicScene";
import { WarpOverlay } from "@/app/_components/WarpOverlay";
import { createClient } from "@/lib/supabase/client";
import {
  getRandomGroupSphere,
  type GroupSphere,
} from "@/lib/group/group-discover";

// Warp through a group's universes (#12 slice 3). A trimmed sibling of /discover:
// a persistent PublicScene whose tree swaps behind a blackout, with a session back
// stack. Pools are tiny so state is in-memory (no localStorage, no URL sync) and
// keyed by sphere id. No hearts here — group universes may be unpublished.

const BLACKOUT_MS = 320;

type Status = "loading" | "ready" | "empty";

export default function GroupDiscover({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [supabase] = useState(() => createClient());
  const [current, setCurrent] = useState<GroupSphere | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [canGoBack, setCanGoBack] = useState(false);
  const [dark, setDark] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const visitedRef = useRef<string[]>([]);
  const historyRef = useRef<GroupSphere[]>([]);
  const currentRef = useRef<GroupSphere | null>(null);
  const busyRef = useRef(false);

  const flashError = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  }, []);

  const commit = useCallback((next: GroupSphere) => {
    // Server ignored exclude (pool exhausted) → reset the exclude window.
    if (visitedRef.current.includes(next.id)) visitedRef.current = [];
    const leaving = currentRef.current;
    if (leaving) historyRef.current = [...historyRef.current, leaving].slice(-10);
    currentRef.current = next;
    setCurrent(next);
    visitedRef.current = [...visitedRef.current.filter((c) => c !== next.id), next.id].slice(-20);
    setCanGoBack(historyRef.current.length > 0);
    setStatus("ready");
  }, []);

  const goNext = useCallback(
    async (warp: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        if (warp) setDark(true);
        const wait = warp
          ? new Promise((r) => setTimeout(r, BLACKOUT_MS))
          : Promise.resolve();
        const [next] = await Promise.all([
          getRandomGroupSphere(supabase, groupId, visitedRef.current),
          wait,
        ]);
        if (!next) {
          setStatus((s) => (s === "loading" ? "empty" : s));
          if (warp) flashError("다음 우주를 불러오지 못했어요.");
          return;
        }
        commit(next);
      } finally {
        if (warp) setDark(false);
        busyRef.current = false;
      }
    },
    [supabase, groupId, commit, flashError],
  );

  const goBack = useCallback(() => {
    if (busyRef.current) return;
    const stack = historyRef.current;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    historyRef.current = stack.slice(0, -1);
    currentRef.current = entry;
    setCurrent(entry);
    setCanGoBack(historyRef.current.length > 0);
  }, []);

  useEffect(() => {
    void goNext(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        void goNext(true);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goBack]);

  return (
    <div className="w-screen h-screen">
      {current && <PublicScene tree={current.tree} warp />}

      <WarpOverlay warping={dark} bootOnMount />

      {/* whose universe + back-to-group */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 45,
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontFamily: "var(--font-cute), system-ui, sans-serif",
        }}
      >
        {status === "ready" && current && (
          <span
            style={{
              padding: "8px 15px",
              borderRadius: 999,
              background: "rgba(43,28,84,0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "2px solid rgba(255,255,255,0.22)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {current.nickname}의 우주
          </span>
        )}
        <Link
          href="/groups"
          style={{
            padding: "8px 15px",
            borderRadius: 999,
            background: "rgba(43,28,84,0.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← 그룹
        </Link>
      </div>

      {status === "loading" && <Overlay>{groupName} 우주를 찾는 중…</Overlay>}
      {status === "empty" && (
        <Overlay>
          아직 둘러볼 친구 우주가 없어요. 친구를 초대하거나 우주를 만들어 보세요.
        </Overlay>
      )}

      {flash && (
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
          {flash}
        </div>
      )}

      {status === "ready" && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            display: "flex",
            gap: 10,
            fontFamily: "var(--font-cute), system-ui, sans-serif",
          }}
        >
          <button onClick={goBack} disabled={!canGoBack} style={btnStyle(!canGoBack)}>
            ← 뒤로
          </button>
          <button onClick={() => void goNext(true)} style={btnStyle(false)}>
            다음 우주 →
          </button>
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 16,
        textAlign: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 50% 44%, #2f1d6e 0%, #18103f 55%, #0b0622 100%)",
      }}
    >
      {children}
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
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 6px 18px rgba(20,10,50,0.35)",
  };
}
