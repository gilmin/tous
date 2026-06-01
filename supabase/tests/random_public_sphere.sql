-- Verification for random_public_sphere() (M3-4 #27). Self-rolls-back. Seeds a
-- mixed pool (bypassing RLS as superuser), then calls the function many times AS
-- ANON and asserts every result is eligible and ineligible spheres never appear.
--
-- Eligible (is_public AND NOT is_flagged AND node_count >= 3): pub00001, pub00002.
-- Ineligible: priv0001 (private), flag0001 (flagged), small001 (node_count < 3).
-- small001 is the key case — it IS anon-visible via RLS (public, not flagged) but
-- must be excluded by the function's node_count filter.
--
-- One sphere per user (unique owner_id), so the pool needs distinct owners.
do $$
declare
  ids uuid[] := array[
    '00000000-0000-0000-0000-0000000000f1',
    '00000000-0000-0000-0000-0000000000f2',
    '00000000-0000-0000-0000-0000000000f3',
    '00000000-0000-0000-0000-0000000000f4',
    '00000000-0000-0000-0000-0000000000f5'
  ]::uuid[];
  got text;
  i int;
  eligible_hits int := 0;
  bad_hits int := 0;
begin
  insert into auth.users (id, email)
    select id, id::text || '@test.local' from unnest(ids) as id;
  insert into public.spheres (owner_id, tree, is_public, is_flagged, node_count, short_code) values
    (ids[1], '{"id":"self"}'::jsonb, true,  false, 5, 'pub00001'),
    (ids[2], '{"id":"self"}'::jsonb, true,  false, 3, 'pub00002'),
    (ids[3], '{"id":"self"}'::jsonb, false, false, 5, 'priv0001'),
    (ids[4], '{"id":"self"}'::jsonb, true,  true,  5, 'flag0001'),
    (ids[5], '{"id":"self"}'::jsonb, true,  false, 2, 'small001');

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  for i in 1..40 loop
    select short_code into got from public.random_public_sphere();
    if got is null then continue; end if;
    if got in ('pub00001', 'pub00002') then
      eligible_hits := eligible_hits + 1;
    else
      bad_hits := bad_hits + 1;
    end if;
  end loop;
  execute 'reset role';

  assert bad_hits = 0, 'random_public_sphere returned an ineligible sphere';
  assert eligible_hits > 0, 'random_public_sphere returned nothing from a non-empty pool';

  raise exception 'RANDOM_OK';
exception
  when others then
    if sqlerrm = 'RANDOM_OK' then
      raise notice 'random_public_sphere: all checks passed (% eligible hits)', eligible_hits;
    else
      raise;
    end if;
end $$;
