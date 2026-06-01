-- M4 (#discover) — random_public_sphere gains an `exclude` argument so /discover
-- can skip recently-seen spheres (ADR-0003 D2; design's "recent NOT IN" strategy).
-- The client passes the short_codes it has shown lately; the server returns a
-- random eligible sphere whose short_code is not in that list.
--
-- Replaces the no-arg 0003 function with a defaulted parameter, so existing
-- callers (getRandomPublicSphere with no args) keep working: exclude defaults to
-- an empty array and the behaviour is identical to 0003.
--
-- Exhaustion fallback: when `exclude` covers the entire eligible pool, every
-- filtered query returns nothing. Rather than show an empty screen, we retry
-- ignoring `exclude` (D2) — the pool just repeats. Same TABLESAMPLE-first /
-- ORDER BY random()-fallback shape as 0003 to stay off the O(N) trap on the
-- primary path.
--
-- Drop the 0003 no-arg function first: a defaulted parameter makes the new
-- function callable with zero args too, so keeping both would make a no-arg
-- call ambiguous ("function is not unique").
drop function if exists public.random_public_sphere();

create or replace function public.random_public_sphere(exclude text[] default '{}')
returns table (short_code text, tree jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Primary: cheap ~1% sample, filtered, minus the excluded short_codes.
  return query
    select s.short_code, s.tree
    from public.spheres as s tablesample bernoulli (1)
    where s.is_public and not s.is_flagged and s.node_count >= 3
      and s.short_code <> all (exclude)
    limit 1;
  if found then return; end if;

  -- Fallback 1: small-pool exact pick, still honouring the exclude list.
  return query
    select s.short_code, s.tree
    from public.spheres as s
    where s.is_public and not s.is_flagged and s.node_count >= 3
      and s.short_code <> all (exclude)
    order by random()
    limit 1;
  if found then return; end if;

  -- Fallback 2 (exhaustion): exclude covered the whole eligible pool. Ignore it
  -- and return any eligible sphere so the experience never dead-ends (D2).
  return query
    select s.short_code, s.tree
    from public.spheres as s
    where s.is_public and not s.is_flagged and s.node_count >= 3
    order by random()
    limit 1;
end;
$$;

grant execute on function public.random_public_sphere(text[]) to anon, authenticated;
