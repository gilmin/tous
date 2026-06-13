"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateShortCode } from "@/lib/sphere/short-code";

// Publish toggle on /me (eng-review D4: default private + explicit publish).
// Publishing assigns a permanent short_code on first publish (regenerating on the
// rare unique collision, D7) and reuses it thereafter — so unpublish→republish
// keeps the same link. The owner's session + owner RLS scope the update.
const MAX_CODE_ATTEMPTS = 5;

export default function PublishToggle({
  userId,
  initialIsPublic,
  initialShortCode,
}: {
  userId: string;
  initialIsPublic: boolean;
  initialShortCode: string | null;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shortCode, setShortCode] = useState(initialShortCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sharePath = shortCode ? `/s/${shortCode}` : null;
  const notSavedMsg = "아직 저장되지 않았어요. 잠시 후 다시 시도해 주세요.";

  async function publish() {
    const supabase = createClient();
    // Reuse an existing code; otherwise mint one, retrying on collision.
    if (shortCode) {
      const { data, error } = await supabase
        .from("spheres")
        .update({ is_public: true })
        .eq("owner_id", userId)
        .select("short_code")
        .maybeSingle();
      if (error) throw error;
      if (!data) return setError(notSavedMsg);
      setIsPublic(true);
      return;
    }
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
      const code = generateShortCode();
      const { data, error } = await supabase
        .from("spheres")
        .update({ is_public: true, short_code: code })
        .eq("owner_id", userId)
        .select("short_code")
        .maybeSingle();
      if (error) {
        if (error.code === "23505") continue; // short_code collision → regenerate
        throw error;
      }
      if (!data) return setError(notSavedMsg);
      setShortCode(data.short_code);
      setIsPublic(true);
      return;
    }
    setError("공유 코드 생성에 실패했어요. 다시 시도해 주세요.");
  }

  async function unpublish() {
    const supabase = createClient();
    // Keep short_code so the link is stable across republish.
    const { error } = await supabase
      .from("spheres")
      .update({ is_public: false })
      .eq("owner_id", userId);
    if (error) throw error;
    setIsPublic(false);
  }

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (isPublic) await unpublish();
      else await publish();
      // The heart's visibility is gated by the /me server component on is_public
      // (read at render time), not by this client toggle's local state. Refresh
      // re-runs that server render so the owner's heart appears on publish (and
      // disappears on unpublish) without a manual reload. Soft refresh — the
      // 3D Scene + sync store stay mounted, so no edits are lost.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!sharePath) return;
    navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "flex-end",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        style={{
          padding: "8px 18px",
          borderRadius: 999,
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 700,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
          border: "2px solid rgba(255,255,255,0.22)",
          transition: "background 0.15s, color 0.15s",
          ...(isPublic
            ? {
                // "On" — same gold-active nuance as the active nav toggle.
                background: "linear-gradient(180deg,#ffe2ad,#ffc97a)",
                color: "#3a1f6b",
                boxShadow: "0 4px 14px rgba(255,180,90,0.4)",
              }
            : {
                background: "rgba(43,28,84,0.55)",
                color: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
              }),
        }}
      >
        {busy ? "처리 중…" : isPublic ? "공개됨 · 비공개로" : "공개하기"}
      </button>
      {isPublic && sharePath && (
        <button
          type="button"
          onClick={copyLink}
          title="링크 복사"
          style={{
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "6px 14px",
            borderRadius: 999,
            fontFamily: "inherit",
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(43,28,84,0.45)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            cursor: "pointer",
          }}
        >
          {copied ? "복사됨!" : sharePath}
        </button>
      )}
      {error && (
        <span
          style={{
            maxWidth: 200,
            textAlign: "right",
            fontSize: 11,
            color: "#ff9aa8",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
