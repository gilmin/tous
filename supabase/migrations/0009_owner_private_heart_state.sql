-- Let an owner read the heart count of their OWN sphere even while it's private.
-- Before this, sphere_heart_state gated on is_public, so unpublishing made the
-- owner's /me heart read as 0 — the hearts they earned looked wiped. The owner is
-- authenticated (auth.uid() = owner_id), so we widen the READ to "public OR mine".
-- Writes stay public-only: heart_sphere/unheart_sphere resolve through
-- heartable_sphere_id, which is unchanged, so you still can't add a heart to a
-- private sphere — the owner just keeps SEEING the count it already has.
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
  where s.short_code = p_short_code
    and not s.is_flagged
    and (s.is_public or s.owner_id = auth.uid());
$$;

-- CREATE OR REPLACE preserves existing grants (signature unchanged); re-state for
-- clarity and idempotent re-runs.
grant execute on function public.sphere_heart_state(text, text) to anon, authenticated;
