-- 🚩 RLS MERGE GATE for spheres (M3-2 #25).
-- Verifies the owner-only security boundary. Run in the Supabase SQL editor or
-- via MCP execute_sql. Self-contained: all test data is rolled back via the
-- exception mechanism (a caught exception undoes everything since the block
-- start), so it leaves nothing behind. An assert failure aborts with a clear
-- message; a clean run raises "RLS spheres: all 4 checks passed".
--
-- Checks (M3-2 scope = owner-only; anon→public read is #26):
--   1. owner CAN insert + select their own sphere
--   2. non-owner CANNOT update someone else's sphere
--   3. non-owner CANNOT delete / read someone else's private sphere
--   4. anonymous CANNOT read a private sphere
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-00000000000a';
  uid_b uuid := '00000000-0000-0000-0000-00000000000b';
  n int;
begin
  insert into auth.users (id, email) values
    (uid_a, 'a@test.local'), (uid_b, 'b@test.local');

  -- 1. owner A: insert + select own
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  insert into public.spheres (owner_id, tree)
    values (uid_a, '{"id":"self"}'::jsonb);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 1, 'owner must read own sphere';

  -- 2 + 3. non-owner B: no read / update / delete of A's private sphere
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'non-owner must not read private sphere';
  update public.spheres set node_count = 99 where owner_id = uid_a;
  get diagnostics n = row_count;
  assert n = 0, 'non-owner must not update sphere';
  delete from public.spheres where owner_id = uid_a;
  get diagnostics n = row_count;
  assert n = 0, 'non-owner must not delete sphere';

  -- 4. anonymous: no read of private sphere
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'anon must not read private sphere';

  execute 'reset role';
  raise exception 'RLS_OK';  -- force rollback of all test data
exception
  when others then
    if sqlerrm = 'RLS_OK' then
      raise notice 'RLS spheres: all 4 checks passed';
    else
      raise;  -- surface the failing assert (and roll back)
    end if;
end $$;
