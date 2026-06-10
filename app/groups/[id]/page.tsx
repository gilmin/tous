import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupDiscover from "./GroupDiscover";

// /groups/[id] (#12 slice 3) — warp through the universes of one group's members,
// including unpublished ones. Auth + membership gated: the groups RLS only returns
// the row to a member, so a missing row (non-member or bad id) bounces to /groups.
export default async function GroupDiscoverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!group) redirect("/groups");

  return <GroupDiscover groupId={group.id} groupName={group.name} />;
}
