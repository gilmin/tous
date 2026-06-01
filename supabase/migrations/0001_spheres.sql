-- M3-2 (#25) — spheres: one cloud-stored sphere per user.
-- eng-review D2 (JSONB tree blob, no flat nodes table), D6 (in-blob root id
-- stays "self"; spheres.id is a separate uuid), D8 (node_count computed by the
-- sync layer at push time). Owner-only RLS; anonymous public read lands in #26.

create table if not exists public.spheres (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  tree jsonb not null,
  is_public boolean not null default false,
  short_code text unique,              -- generation/regen-on-collision is #26
  node_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)                    -- M3: 1 user → 1 sphere (upsert onConflict)
);

alter table public.spheres enable row level security;

-- Owner-only policies. auth.uid() is the JWT subject of the signed-in user;
-- a logged-out (anon) caller has auth.uid() = null, so every policy fails closed.
create policy "owner selects own sphere"
  on public.spheres for select
  using (auth.uid() = owner_id);

create policy "owner inserts own sphere"
  on public.spheres for insert
  with check (auth.uid() = owner_id);

create policy "owner updates own sphere"
  on public.spheres for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner deletes own sphere"
  on public.spheres for delete
  using (auth.uid() = owner_id);

-- Server-clock updated_at for last-write-wins ordering across devices (D3).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''  -- pin search_path (security hardening; now() is in pg_catalog)
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spheres_set_updated_at
  before update on public.spheres
  for each row
  execute function public.set_updated_at();
