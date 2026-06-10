import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrbitalBody } from "@/app/scene/types";

// One random universe from a group's pool (#12 slice 3) via random_group_sphere.
// `exclude` is a list of recently-seen sphere ids the server skips; when it covers
// the whole pool the RPC ignores it so the browse never dead-ends. Returns null
// when the group has no other members with a universe, or on error / non-member.
export type GroupSphere = { id: string; tree: OrbitalBody; nickname: string };

export async function getRandomGroupSphere(
  supabase: SupabaseClient,
  groupId: string,
  exclude: string[] = [],
): Promise<GroupSphere | null> {
  const { data, error } = await supabase
    .rpc("random_group_sphere", { p_group: groupId, p_exclude: exclude })
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; tree: OrbitalBody; nickname: string };
  return { id: row.id, tree: row.tree, nickname: row.nickname };
}
