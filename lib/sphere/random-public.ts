import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrbitalBody } from "@/app/scene/types";

export type RandomPublicSphere = { short_code: string; tree: OrbitalBody };

// Fetches one random published sphere via the `random_public_sphere` RPC
// (TABLESAMPLE strategy, server-side — see migrations 0003/0005). Callable with
// the anon client. Returns null when the public pool is empty (cold start, D4) or
// on error. M4's /discover wires this to a "next" button + camera warp.
//
// `exclude` is a list of recently-seen short_codes the server skips (ADR-0003 D2).
// If exclude covers the whole eligible pool, the RPC ignores it and returns any
// eligible sphere, so /discover never dead-ends.
export async function getRandomPublicSphere(
  supabase: SupabaseClient,
  exclude: string[] = [],
): Promise<RandomPublicSphere | null> {
  const { data, error } = await supabase
    .rpc("random_public_sphere", { exclude })
    .maybeSingle();
  if (error || !data) return null;
  return data as RandomPublicSphere;
}
