import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the root "middleware" convention to "proxy". This runs the
// Supabase session refresh on every matched request (see lib/supabase/middleware).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on every route except Next internals and static image assets — those
  // never carry a session to refresh.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
