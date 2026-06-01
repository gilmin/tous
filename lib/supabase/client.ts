import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Used in client components for OAuth sign-in and
// (from M3-2) reading/writing the user's own sphere. Reads the public anon key
// — RLS enforces what this client may actually touch.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
