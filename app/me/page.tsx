import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Scene from "@/app/scene";
import { signOut } from "./actions";
import UniverseSync from "./UniverseSync";
import PublishToggle from "./PublishToggle";
import { HeartButton } from "@/app/_components/HeartButton";
import { OnboardingHint } from "@/app/_components/OnboardingHint";
import { UndoRedoControls } from "@/app/_components/UndoRedoControls";
import { EditorFocusNav } from "@/app/scene/EditorFocusNav";

// Owner page. Auth-gated: a logged-out visitor is bounced to /login. This is the
// cloud-synced Universe editor (M3-2) — the same Scene as "/", but UniverseSync
// loads the owner's stored Universe on mount and pushes edits back (debounced).
// M3-3 adds the publish toggle (share via /s/[short_code]).
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Initial publish state for the toggle. The row may not exist yet on a brand
  // new account (UniverseSync seeds it client-side) → defaults below.
  const { data: sphere } = await supabase
    .from("spheres")
    .select("is_public, short_code")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="w-screen h-screen">
      <Scene />
      <UniverseSync userId={user.id} />
      <UndoRedoControls />
      <EditorFocusNav />
      <OnboardingHint
        storageKey="tous:onboarding:me:v1"
        title="내 우주를 만드는 법"
        lines={[
          ["행성 클릭", "포커스 — 패널에서 편집·자식 추가·삭제"],
          ["←/→", "행성 차례로 이동"],
          ["Ctrl+Z · Ctrl+Y", "실행 취소 · 다시 실행"],
          ["Esc", "포커스 해제"],
        ]}
        touchLines={[
          ["행성 탭", "포커스 — 편집·자식 추가·삭제"],
          ["↩︎ ↪︎", "실행 취소 · 다시 실행"],
          ["빈 곳 탭", "포커스 해제"],
          ["가로로 돌리기", "전체 우주를 더 넓게"],
        ]}
      />
      <div
        className="me-chrome"
        style={{
          position: "fixed",
          right: "calc(14px + env(safe-area-inset-right))",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        {/* Heart sits inline to the left of the publish toggle. It appears once the
            universe has ever been published (a short_code exists). While public it's
            an interactive toggle; once unpublished it stays as a read-only count of
            the hearts earned — migration 0009 lets the owner read their own private
            count, so going private no longer wipes the heart. */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {sphere?.short_code && (
            <HeartButton
              shortCode={sphere.short_code}
              inline
              interactive={!!sphere.is_public}
            />
          )}
          <PublishToggle
            userId={user.id}
            initialIsPublic={sphere?.is_public ?? false}
            initialShortCode={sphere?.short_code ?? null}
          />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              fontFamily: "var(--font-cute), system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              background: "rgba(43,28,84,0.55)",
              border: "2px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
