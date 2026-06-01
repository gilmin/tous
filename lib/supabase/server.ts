import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client (Server Components, Route Handlers, Server
// Actions). cookies() is async in Next 16, so this factory is async too.
//
// setAll throws when called during a Server Component render (cookies are
// read-only there) — that's expected. The middleware (lib/supabase/middleware)
// is what actually refreshes and writes the session cookies on each request,
// so swallowing the error here is safe. In Route Handlers / Server Actions
// setAll succeeds, which is how sign-out and the OAuth callback persist state.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component render — ignore (middleware owns the refresh).
          }
        },
      },
    },
  );
}
