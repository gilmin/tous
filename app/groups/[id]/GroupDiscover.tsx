"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PublicScene from "@/app/scene/PublicScene";
import { useForeignUniverseStore } from "@/app/scene/useForeignUniverseStore";
import { FocusLabel } from "@/app/_components/FocusLabel";
import { WarpOverlay } from "@/app/_components/WarpOverlay";
import {
  useWarpSession,
  type Pool,
} from "@/app/_components/warp/useWarpSession";
import { useFocusKeys } from "@/app/_components/warp/useFocusKeys";
import {
  WarpBottomNav,
  WarpMessage,
  WarpFlash,
} from "@/app/_components/warp/WarpControls";
import { createClient } from "@/lib/supabase/client";
import { getRandomGroupSphere } from "@/lib/group/group-discover";

// Warp through a group's Universes (#12 slice 3). Same Warp session as /discover
// (lib/warp/session) — blackout, back stack, unified keys (Space=next,
// Backspace=back, ←/→=Body focus). The group Pool is keyed by sphere id and
// carries the member's nickname as chrome. Pools are tiny → in-memory (no
// persistence, no URL sync). No hearts: group Universes may be unpublished.

export default function GroupDiscover({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [supabase] = useState(() => createClient());

  const pool: Pool = useMemo(
    () => ({
      next: async (exclude) => {
        const r = await getRandomGroupSphere(supabase, groupId, exclude);
        return r
          ? { key: r.id, tree: r.tree, meta: { nickname: r.nickname } }
          : null;
      },
    }),
    [supabase, groupId],
  );

  const { current, status, canGoBack, dark, flash, goNext, goBack } =
    useWarpSession({ pool });

  // Host owns the read-only store → it renders the Focus chrome (name label
  // lifted above the bottom nav, ←/→ keyboard nav) next to the viewer.
  const store = useForeignUniverseStore(current?.tree ?? null);
  useFocusKeys(store);

  const nickname = current?.meta?.nickname as string | undefined;

  return (
    <div className="w-screen h-screen">
      {store && <PublicScene store={store} />}
      {store && <FocusLabel store={store} lifted />}

      <WarpOverlay warping={dark} bootOnMount />

      {/* whose Universe + back-to-group */}
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
        {status === "ready" && nickname && (
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
            {nickname}의 우주
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

      {status === "loading" && <WarpMessage>{groupName} 우주를 찾는 중…</WarpMessage>}
      {status === "empty" && (
        <WarpMessage>
          아직 둘러볼 친구 우주가 없어요. 친구를 초대하거나 우주를 만들어 보세요.
        </WarpMessage>
      )}

      {flash && <WarpFlash message={flash} />}

      {status === "ready" && (
        <WarpBottomNav
          canGoBack={canGoBack}
          onBack={goBack}
          onNext={() => void goNext(true)}
        />
      )}
    </div>
  );
}
