-- M3-3 (#26) — public share. A sphere toggled public becomes readable by anyone
-- (incl. anonymous) via /s/[short_code]. eng-review D4 (default private + explicit
-- publish), D9 (anon-key client).

-- Moderation flag (no moderation UI in M3 — column + policy only, future use).
alter table public.spheres add column is_flagged boolean not null default false;

-- Public-read policy. RLS policies are permissive (OR-combined): a row is now
-- visible if the caller is the owner (existing "owner selects own sphere") OR the
-- sphere is published and not flagged. Applies to both anon and logged-in callers.
create policy "anyone reads public sphere"
  on public.spheres for select
  to anon, authenticated
  using (is_public and not is_flagged);
