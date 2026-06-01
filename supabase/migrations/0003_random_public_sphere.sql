-- M3-4 (#27) — random public sphere helper. Foundation for M4 discovery
-- (the /discover UI + camera warp are M4; this is just the query). eng-review D9.
--
-- Returns one random published, non-flagged sphere with at least 3 bodies
-- (node_count >= 3, D8/M4 filter). TABLESAMPLE keeps the primary path off the
-- O(N) ORDER BY random() trap; the fallback only fires on a small pool.
-- SECURITY INVOKER → RLS still applies (anon only ever sees public rows anyway).
create or replace function public.random_public_sphere()
returns table (short_code text, tree jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Primary: TABLESAMPLE bernoulli(1) samples ~1% of physical rows cheaply,
  -- then we filter + take one. Never ORDER BY random() here — that is O(N).
  return query
    select s.short_code, s.tree
    from public.spheres as s tablesample bernoulli (1)
    where s.is_public and not s.is_flagged and s.node_count >= 3
    limit 1;

  -- Fallback: sampling 1% often misses on a small pool. This only runs when the
  -- primary returned nothing, i.e. the pool is small enough that the O(N)
  -- ORDER BY random() cost is negligible.
  if not found then
    return query
      select s.short_code, s.tree
      from public.spheres as s
      where s.is_public and not s.is_flagged and s.node_count >= 3
      order by random()
      limit 1;
  end if;
end;
$$;

grant execute on function public.random_public_sphere() to anon, authenticated;
