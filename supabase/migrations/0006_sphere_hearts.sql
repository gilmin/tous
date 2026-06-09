-- #13 — hearts (likes). Anyone (incl. anonymous) can heart someone else's
-- published sphere. Anonymous callers have no verifiable identity, so we can't
-- scope per-row writes with RLS: a `delete using (true)` policy would let anyone
-- mass-delete a sphere's hearts via `.delete().eq('sphere_id', …)`. Instead the
-- table is locked (RLS on, NO direct DML policies) and every write goes through a
-- SECURITY DEFINER RPC that touches exactly one (sphere_id, voter) row. `voter`
-- is a random per-browser id — unguessable, and uniform for anon + logged-in
-- callers — so an unheart can be scoped to that one voter without auth.

create table if not exists public.sphere_hearts (
  sphere_id uuid not null references public.spheres (id) on delete cascade,
  voter text not null,
  created_at timestamptz not null default now(),
  primary key (sphere_id, voter)
);

alter table public.sphere_hearts enable row level security;
-- Intentionally NO policies: anon/authenticated get no direct insert/select/
-- update/delete. The DEFINER functions below (owned by the table owner, which
-- bypasses RLS) are the only access path.

-- Resolve a *heartable* sphere (published + not flagged) by share code; null for
-- a missing/private/flagged code so the writers fail closed — you can only heart
-- spheres you're allowed to see. Internal helper, called from the RPCs below.
create or replace function public.heartable_sphere_id(p_short_code text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select s.id from public.spheres as s
  where s.short_code = p_short_code and s.is_public and not s.is_flagged
  limit 1;
$$;

-- Add this voter's heart (idempotent). Returns the sphere's heart count.
create or replace function public.heart_sphere(p_short_code text, p_voter text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sphere uuid := public.heartable_sphere_id(p_short_code);
begin
  if v_sphere is null then
    return 0;
  end if;
  insert into public.sphere_hearts (sphere_id, voter)
  values (v_sphere, p_voter)
  on conflict (sphere_id, voter) do nothing;
  return (select count(*)::integer from public.sphere_hearts where sphere_id = v_sphere);
end;
$$;

-- Remove ONLY this voter's heart. Returns the sphere's heart count.
create or replace function public.unheart_sphere(p_short_code text, p_voter text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sphere uuid := public.heartable_sphere_id(p_short_code);
begin
  if v_sphere is null then
    return 0;
  end if;
  delete from public.sphere_hearts
  where sphere_id = v_sphere and voter = p_voter;
  return (select count(*)::integer from public.sphere_hearts where sphere_id = v_sphere);
end;
$$;

-- Count + whether this voter has hearted, for the initial UI render. Empty when
-- the code is missing/private/flagged → client shows 0 / not hearted.
create or replace function public.sphere_heart_state(p_short_code text, p_voter text)
returns table (count integer, hearted boolean)
language sql
security definer
set search_path = ''
stable
as $$
  select
    (select count(*)::integer from public.sphere_hearts h where h.sphere_id = s.id),
    exists (
      select 1 from public.sphere_hearts h
      where h.sphere_id = s.id and h.voter = p_voter
    )
  from public.spheres as s
  where s.short_code = p_short_code and s.is_public and not s.is_flagged;
$$;

grant execute on function public.heart_sphere(text, text) to anon, authenticated;
grant execute on function public.unheart_sphere(text, text) to anon, authenticated;
grant execute on function public.sphere_heart_state(text, text) to anon, authenticated;
-- heartable_sphere_id stays internal (no grant): only the DEFINER RPCs call it.
