import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

// Owner page. Gated: a logged-out visitor is bounced to /login. M3-2 turns this
// into the cloud-synced sphere editor; for now it confirms the session works.
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <p className="text-sm text-neutral-500">
        <span className="text-neutral-800">{user.email}</span> 님으로 로그인됨
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
        >
          로그아웃
        </button>
      </form>
    </main>
  );
}
