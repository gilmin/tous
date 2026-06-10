import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GroupRow, MemberRow } from "@/lib/group/groups";
import GroupsClient from "./GroupsClient";

// /groups (#12 slice 2) — auth-gated. Lists the groups you belong to with their
// rosters (nicknames only), plus forms to create a group or join one by code.
// RLS filters both queries to the caller's groups.
export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .order("created_at");
  const { data: members } = await supabase
    .from("group_members")
    .select("group_id, user_id, nickname");

  const rows = (groups ?? []) as GroupRow[];
  const roster = (members ?? []) as MemberRow[];
  const withMembers = rows.map((g) => ({
    ...g,
    members: roster.filter((m) => m.group_id === g.id),
  }));

  return <GroupsClient userId={user.id} groups={withMembers} />;
}
