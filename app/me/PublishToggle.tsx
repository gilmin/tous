"use client";

import { useState } from "react";
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
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="rounded-full border border-neutral-300 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 backdrop-blur transition hover:bg-white disabled:opacity-50"
      >
        {busy ? "처리 중…" : isPublic ? "공개됨 · 비공개로" : "공개하기"}
      </button>
      {isPublic && sharePath && (
        <button
          type="button"
          onClick={copyLink}
          title="링크 복사"
          className="max-w-[200px] truncate rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-[11px] text-neutral-500 backdrop-blur transition hover:bg-white"
        >
          {copied ? "복사됨!" : sharePath}
        </button>
      )}
      {error && (
        <span className="max-w-[200px] text-right text-[11px] text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
