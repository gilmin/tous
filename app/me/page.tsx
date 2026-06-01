import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Scene from "@/app/scene";
import { signOut } from "./actions";
import SphereSync from "./SphereSync";

// Owner page. Auth-gated: a logged-out visitor is bounced to /login. This is the
// cloud-synced sphere editor (M3-2) — the same Scene as "/", but SphereSync
// loads the owner's server sphere on mount and pushes edits back (debounced).
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="w-screen h-screen">
      <Scene variant="mono" />
      <SphereSync userId={user.id} />
      <form
        action={signOut}
        style={{ position: "fixed", top: 14, right: 14, zIndex: 50 }}
      >
        <button
          type="submit"
          className="rounded-full border border-neutral-300 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 backdrop-blur transition hover:bg-white"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
