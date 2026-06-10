-- #12 slice 3 — group-only discovery pool. Returns one random universe owned by a
-- co-member of p_group (excluding the caller's own and any recently-seen ids), so
-- /groups/[id] can warp through friends' universes the same way /discover warps
-- through public ones. Private universes are included — that's the point of a
-- group. SECURITY DEFINER + an is_group_member guard so a non-member gets nothing.

create or replace function public.random_group_sphere(p_group uuid, p_exclude uuid[])
returns table (id uuid, tree jsonb, nickname text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Fail closed: only members may browse a group's pool.
  if not public.is_group_member(p_group) then
    return;
  end if;

  return query
    select s.id, s.tree, gm.nickname
    from public.spheres s
    join public.group_members gm
      on gm.user_id = s.owner_id and gm.group_id = p_group
    where s.owner_id <> auth.uid()
      and not (s.id = any (coalesce(p_exclude, '{}'::uuid[])))
    order by random()
    limit 1;

  if found then
    return;
  end if;

  -- exclude covered the whole pool → ignore it so the browse never dead-ends.
  return query
    select s.id, s.tree, gm.nickname
    from public.spheres s
    join public.group_members gm
      on gm.user_id = s.owner_id and gm.group_id = p_group
    where s.owner_id <> auth.uid()
    order by random()
    limit 1;
end;
$$;

grant execute on function public.random_group_sphere(uuid, uuid[]) to authenticated;
