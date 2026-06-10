import type { SupabaseClient } from "@supabase/supabase-js";

// Friend groups (#12). Membership writes that need the invite-code lookup go
// through SECURITY DEFINER RPCs (create_group / join_group); reads + leaving rely
// on RLS scoped to the caller. See migration 0007.

export type GroupRow = { id: string; name: string; invite_code: string };
export type MemberRow = { group_id: string; user_id: string; nickname: string };
export type GroupWithMembers = GroupRow & { members: MemberRow[] };

// Create a group and join the creator with their nickname. Returns the new id +
// invite code, or null on failure.
export async function createGroup(
  supabase: SupabaseClient,
  name: string,
  nickname: string,
): Promise<{ id: string; invite_code: string } | null> {
  const { data, error } = await supabase
    .rpc("create_group", { p_name: name, p_nickname: nickname })
    .single();
  if (error || !data) return null;
  return data as { id: string; invite_code: string };
}

// Join by invite code with a nickname. Returns the group id, null for an unknown
// code, or "error" when the call itself failed (so the UI can tell them apart).
export async function joinGroup(
  supabase: SupabaseClient,
  inviteCode: string,
  nickname: string,
): Promise<string | null | "error"> {
  const { data, error } = await supabase.rpc("join_group", {
    p_invite_code: inviteCode,
    p_nickname: nickname,
  });
  if (error) return "error";
  return (data as string | null) ?? null;
}

// Leave a group (delete own membership; RLS scopes it to the caller's row).
export async function leaveGroup(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  return !error;
}
