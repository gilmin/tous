import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Scene from "@/app/scene";
import { signOut } from "./actions";
import SphereSync from "./SphereSync";
import PublishToggle from "./PublishToggle";
import { HeartButton } from "@/app/_components/HeartButton";
import { OnboardingHint } from "@/app/_components/OnboardingHint";
import { MobileGuard } from "@/app/_components/MobileGuard";

// Owner page. Auth-gated: a logged-out visitor is bounced to /login. This is the
// cloud-synced sphere editor (M3-2) — the same Scene as "/", but SphereSync
// loads the owner's server sphere on mount and pushes edits back (debounced).
// M3-3 adds the publish toggle (share via /s/[short_code]).
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Initial publish state for the toggle. The row may not exist yet on a brand
  // new account (SphereSync seeds it client-side) → defaults below.
  const { data: sphere } = await supabase
    .from("spheres")
    .select("is_public, short_code")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="w-screen h-screen">
      <Scene />
      <SphereSync userId={user.id} />
      <OnboardingHint
        storageKey="tous:onboarding:me:v1"
        title="내 우주를 만드는 법"
        lines={[
          ["행성 클릭", "포커스 — 패널에서 편집·자식 추가·삭제"],
          ["←/→", "행성 차례로 이동"],
          ["Ctrl+Z · Ctrl+Y", "실행 취소 · 다시 실행"],
          ["Esc", "포커스 해제"],
        ]}
      />
      <MobileGuard />
      {/* Owner can see (and toggle) hearts on their own universe — only once
          published, since hearts only exist for public spheres. Pinned top-left
          to clear the publish/sign-out controls top-right. */}
      {sphere?.is_public && sphere.short_code && (
        <HeartButton shortCode={sphere.short_code} side="left" />
      )}
      <div
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <PublishToggle
          userId={user.id}
          initialIsPublic={sphere?.is_public ?? false}
          initialShortCode={sphere?.short_code ?? null}
        />
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
