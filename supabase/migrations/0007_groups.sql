-- #12 — friend groups. A logged-in user creates a group (gets an invite code) and
-- friends join with that code. Group members can see each other's universes even
-- when not globally published (the "private friend share"), and browse them in a
-- group-only discovery pool (slice 3). Each member picks a per-group nickname; the
-- roster shows nicknames only — never email or any other personal identity.
--
-- Security shape (mirrors the hearts lockdown, #13): membership writes that need an
-- invite-code lookup (create/join) go through SECURITY DEFINER RPCs so the caller
-- never needs direct read of groups they aren't in. The "co-member can read your
-- private sphere" rule is the sensitive part — it's enforced by a DEFINER helper
-- (shares_group_with) referenced from the spheres SELECT policy. The helper is
-- DEFINER specifically to avoid RLS recursion (a policy on spheres that subqueries
-- group_members, which itself has RLS, would recurse).

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- ── DEFINER helpers (bypass RLS → no recursion). Used inside the policies below,
--    so they're granted to authenticated. ─────────────────────────────────────

-- Am I (the current caller) a member of this group?
create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group and gm.user_id = auth.uid()
  );
$$;

-- Do I share at least one group with the target user? Drives the cross-member
-- sphere read. Fails closed when the caller is anonymous (auth.uid() is null).
create or replace function public.shares_group_with(p_target uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = p_target
  );
$$;

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- groups: a member reads their own groups. No direct insert/update/delete — the
-- create_group RPC is the only writer.
create policy "members read their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

-- group_members: a member reads the full roster of any group they belong to.
create policy "members read group roster"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

-- A member may rename themselves (own row only) and leave (delete own row). Joining
-- is RPC-only (needs the invite-code lookup), so there is no insert policy.
create policy "member updates own nickname"
  on public.group_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "member leaves group"
  on public.group_members for delete
  to authenticated
  using (user_id = auth.uid());

-- spheres: the sensitive grant. A logged-in caller may read a sphere when they
-- share a group with its owner — even if it isn't published. OR-combined with the
-- existing owner-select and public-read policies (permissive).
create policy "group co-members read sphere"
  on public.spheres for select
  to authenticated
  using (public.shares_group_with(owner_id));

-- ── invite codes + write RPCs ─────────────────────────────────────────────────

-- 6-char code from an unambiguous alphabet (no 0/O/1/I). Collisions are caught by
-- the unique constraint and retried in create_group. Internal — no grant.
create or replace function public.gen_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
           1 + floor(random() * 32)::int, 1),
    '')
  from generate_series(1, 6);
$$;

-- Create a group and join the creator with their nickname. Returns the new id +
-- invite code. Retries on the rare code collision.
create or replace function public.create_group(p_name text, p_nickname text)
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_code text;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  loop
    v_code := public.gen_invite_code();
    begin
      insert into public.groups (name, invite_code, created_by)
      values (p_name, v_code, v_uid)
      returning groups.id into v_id;
      exit;
    exception when unique_violation then
      -- code collided; try another
    end;
  end loop;
  insert into public.group_members (group_id, user_id, nickname)
  values (v_id, v_uid, p_nickname);
  return query select v_id, v_code;
end;
$$;

-- Join a group by invite code with a nickname. Idempotent: rejoining updates the
-- nickname. Returns the group id, or null for an unknown code (fail closed).
create or replace function public.join_group(p_invite_code text, p_nickname text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_group uuid;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  select g.id into v_group from public.groups g where g.invite_code = p_invite_code;
  if v_group is null then
    return null;
  end if;
  insert into public.group_members (group_id, user_id, nickname)
  values (v_group, v_uid, p_nickname)
  on conflict (group_id, user_id) do update set nickname = excluded.nickname;
  return v_group;
end;
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group(text, text) to authenticated;
-- gen_invite_code stays internal (no grant): only create_group calls it.
