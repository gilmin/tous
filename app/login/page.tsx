"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { InAppBrowserNotice } from "@/app/_components/InAppBrowserNotice";

function LoginButtons() {
  const params = useSearchParams();
  const failed = params.get("error") === "auth";

  const signIn = async (provider: "google" | "github") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <InAppBrowserNotice />
      <h1 className="text-lg font-medium text-neutral-800">로그인</h1>
      <p className="text-sm text-neutral-500">
        나만의 우주를 만들고 저장하려면 로그인하세요.
      </p>
      {failed && (
        <p className="text-sm text-red-500">
          로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          onClick={() => signIn("google")}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 transition hover:bg-neutral-50"
        >
          Google로 계속하기
        </button>
        <button
          onClick={() => signIn("github")}
          className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm text-white transition hover:bg-neutral-700"
        >
          GitHub로 계속하기
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense>
      <LoginButtons />
    </Suspense>
  );
}
