-- 🚩 RLS / RPC GATE for hearts (#13). Verifies the heart RPCs work for an
-- anonymous caller, dedup is per-voter, unheart is scoped to one voter, you can't
-- heart a private sphere, and (migration 0009) the OWNER can still read their own
-- private sphere's heart count while others can't. Self-contained: data rolled back via
-- the exception mechanism. A clean run raises "hearts: all checks passed".
--
-- The table itself is locked (no DML policies); the RPCs are SECURITY DEFINER, so
-- they run as the table owner and work for anon. We also assert that DIRECT anon
-- DML on the table is denied (the negative control for the lockdown).
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-0000000000aa';
  uid_b uuid := '00000000-0000-0000-0000-0000000000bb';
  n int;
  b boolean;
begin
  insert into auth.users (id, email) values
    (uid_a, 'a@heart.local'), (uid_b, 'b@heart.local');

  -- A has a PUBLISHED sphere; B has a PRIVATE one.
  insert into public.spheres (owner_id, tree, is_public, short_code)
    values (uid_a, '{"id":"self"}'::jsonb, true, 'pubheart');
  insert into public.spheres (owner_id, tree, is_public, short_code)
    values (uid_b, '{"id":"self"}'::jsonb, false, 'privheart');

  -- Seed a heart on B's PRIVATE sphere directly (as the table owner, bypassing the
  -- lockdown) so the owner-read check below has a non-zero count to find.
  insert into public.sphere_hearts (sphere_id, voter)
    select id, 'privvoter' from public.spheres where short_code = 'privheart';

  -- Act as anonymous from here on.
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);

  -- 1. anon hearts the public sphere → count 1
  select public.heart_sphere('pubheart', 'voter1') into n;
  assert n = 1, 'anon should heart a public sphere';

  -- 2. same voter again is idempotent → still 1
  select public.heart_sphere('pubheart', 'voter1') into n;
  assert n = 1, 'repeat heart from same voter must not double-count';

  -- 3. a different voter → count 2
  select public.heart_sphere('pubheart', 'voter2') into n;
  assert n = 2, 'a second voter should add a heart';

  -- 4. heart state reflects count + this voter's own heart
  -- Alias the columns: a bare `count` in the target list parses ambiguously in
  -- PL/pgSQL, so qualify it to read the function's result column.
  select hs.count, hs.hearted into n, b
    from public.sphere_heart_state('pubheart', 'voter1') hs;
  assert n = 2 and b, 'state: voter1 sees count 2 and hearted=true';
  select hs.count, hs.hearted into n, b
    from public.sphere_heart_state('pubheart', 'voter3') hs;
  assert n = 2 and not b, 'state: voter3 sees count 2 and hearted=false';

  -- 5. unheart removes ONLY that voter's heart
  select public.unheart_sphere('pubheart', 'voter2') into n;
  assert n = 1, 'unheart should drop the count to 1';
  -- unheart with an unknown voter removes nothing (no mass-clear)
  select public.unheart_sphere('pubheart', 'ghostvoter') into n;
  assert n = 1, 'unheart with a foreign voter must not remove others';

  -- 6. cannot heart a PRIVATE sphere → returns 0, inserts nothing
  select public.heart_sphere('privheart', 'voter1') into n;
  assert n = 0, 'private sphere must not be heartable';

  -- 6b. anon must NOT read a private sphere's heart state (function returns no rows)
  select count(*)::int into n from public.sphere_heart_state('privheart', 'privvoter');
  assert n = 0, 'anon must not read a private sphere''s heart state';

  -- 7. negative control: direct anon DML on the locked table is denied
  begin
    insert into public.sphere_hearts (sphere_id, voter)
      select id, 'direct' from public.spheres where short_code = 'pubheart';
    assert false, 'direct anon insert into sphere_hearts must be denied';
  exception when insufficient_privilege then null; -- expected
  end;

  -- 8. the OWNER (authenticated) CAN read their own private sphere's heart count
  --    (migration 0009), while a different authed user still cannot.
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', uid_b)::text, true);
  select hs.count into n from public.sphere_heart_state('privheart', 'privvoter') hs;
  assert n = 1, 'owner B must see their own private sphere heart count';

  perform set_config('request.jwt.claims', json_build_object('sub', uid_a)::text, true);
  select count(*)::int into n from public.sphere_heart_state('privheart', 'privvoter');
  assert n = 0, 'a different authed user must not read B''s private heart state';

  execute 'reset role';
  raise exception 'HEARTS_OK';  -- force rollback of all test data
exception
  when others then
    if sqlerrm = 'HEARTS_OK' then
      raise notice 'hearts: all checks passed';
    else
      raise;
    end if;
end $$;
