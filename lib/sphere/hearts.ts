import type { SupabaseClient } from "@supabase/supabase-js";

// Hearts (#13). Anyone — anonymous or logged-in — can heart a published sphere.
// We identify the "voter" by a stable random id kept in localStorage rather than
// auth, so the feature is open to everyone and one browser counts once. The id is
// an unguessable uuid, which lets the server scope an unheart to exactly this
// voter without an authenticated session. All writes go through SECURITY DEFINER
// RPCs (see migration 0006); the table itself rejects direct DML.

const VOTER_KEY = "tous:voter";

export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let v = localStorage.getItem(VOTER_KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, v);
  }
  return v;
}

export type HeartState = { count: number; hearted: boolean };

export async function getHeartState(
  supabase: SupabaseClient,
  shortCode: string,
): Promise<HeartState> {
  const { data, error } = await supabase
    .rpc("sphere_heart_state", { p_short_code: shortCode, p_voter: getVoterId() })
    .maybeSingle();
  if (error || !data) return { count: 0, hearted: false };
  const row = data as { count: number | null; hearted: boolean | null };
  return { count: row.count ?? 0, hearted: row.hearted ?? false };
}

// Toggle this browser's heart on a sphere. Returns the new count, or -1 on
// failure so the caller can keep its prior optimistic value.
export async function toggleHeart(
  supabase: SupabaseClient,
  shortCode: string,
  currentlyHearted: boolean,
): Promise<number> {
  const fn = currentlyHearted ? "unheart_sphere" : "heart_sphere";
  const { data, error } = await supabase.rpc(fn, {
    p_short_code: shortCode,
    p_voter: getVoterId(),
  });
  if (error || data == null) return -1;
  return data as number;
}
