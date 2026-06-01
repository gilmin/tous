-- Verification for random_public_sphere(exclude text[]) (M4, migration 0005).
-- Self-rolls-back. Seeds an eligible pool (bypassing RLS as superuser), then
-- calls the function AS ANON and asserts two contracts:
--
--   Case 1 (exclude works): excluding all but one eligible short_code always
--     returns that one, never an excluded one.
--   Case 2 (exhaustion fallback): excluding EVERY eligible short_code still
--     returns an eligible sphere (the RPC ignores exclude rather than dead-end).
--
-- Eligible pool: pub00001, pub00002, pub00003 (public, not flagged, node_count>=3).
-- Ineligible: small001 (node_count<2) — must never appear even when exclude is empty.
-- One sphere per user (unique owner_id), so distinct owners are needed.
do $$
declare
  ids uuid[] := array[
    '00000000-0000-0000-0000-0000000000e1',
    '00000000-0000-0000-0000-0000000000e2',
    '00000000-0000-0000-0000-0000000000e3',
    '00000000-0000-0000-0000-0000000000e4'
  ]::uuid[];
  got text;
  i int;
  -- Case 1 counters
  c1_target_hits int := 0;
  c1_excluded_hits int := 0;
  -- Case 2 counters
  c2_eligible_hits int := 0;
  c2_null_hits int := 0;
begin
  -- Isolate from the live demo pool (migration 0004 seeds 5 public spheres):
  -- hide every pre-existing sphere so the eligible pool is exactly our seeds.
  -- Rolled back at the end, so production data is untouched.
  update public.spheres set is_public = false;

  insert into auth.users (id, email)
    select id, id::text || '@test.local' from unnest(ids) as id;
  insert into public.spheres (owner_id, tree, is_public, is_flagged, node_count, short_code) values
    (ids[1], '{"id":"self"}'::jsonb, true, false, 5, 'pub00001'),
    (ids[2], '{"id":"self"}'::jsonb, true, false, 3, 'pub00002'),
    (ids[3], '{"id":"self"}'::jsonb, true, false, 4, 'pub00003'),
    (ids[4], '{"id":"self"}'::jsonb, true, false, 2, 'small001');

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);

  -- Case 1: exclude two of three eligible → only pub00003 may come back.
  for i in 1..40 loop
    select short_code into got
      from public.random_public_sphere(array['pub00001', 'pub00002']);
    if got is null then continue; end if;
    if got = 'pub00003' then
      c1_target_hits := c1_target_hits + 1;
    elsif got in ('pub00001', 'pub00002') then
      c1_excluded_hits := c1_excluded_hits + 1;
    end if;
  end loop;

  -- Case 2: exclude ALL eligible → exhaustion fallback must still return one.
  for i in 1..40 loop
    select short_code into got
      from public.random_public_sphere(array['pub00001', 'pub00002', 'pub00003']);
    if got is null then
      c2_null_hits := c2_null_hits + 1;
    elsif got in ('pub00001', 'pub00002', 'pub00003') then
      c2_eligible_hits := c2_eligible_hits + 1;
    end if;
  end loop;

  execute 'reset role';

  assert c1_excluded_hits = 0, 'exclude leaked: an excluded short_code was returned';
  assert c1_target_hits > 0, 'exclude over-filtered: pub00003 never returned';
  assert c2_null_hits = 0, 'exhaustion: returned null instead of falling back';
  assert c2_eligible_hits > 0, 'exhaustion: fallback returned nothing';

  -- Always raise to abort the transaction → guaranteed rollback (this test
  -- temporarily hides all public spheres, so it MUST never commit). A passing
  -- run surfaces as ERROR "EXCLUDE_OK ..."; a failing assert surfaces as its own
  -- message. We deliberately do NOT catch-and-swallow (unlike a wrapped runner),
  -- so the rollback holds even under autocommit.
  raise exception 'EXCLUDE_OK: all checks passed (c1=% c2=%)',
    c1_target_hits, c2_eligible_hits;
end $$;
