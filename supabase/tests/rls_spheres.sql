-- 🚩 RLS MERGE GATE for spheres (M3-2 #25 owner-only + M3-3 #26 public read).
-- Verifies the full security boundary. Run in the Supabase SQL editor or via MCP
-- execute_sql. Self-contained: all test data is rolled back via the exception
-- mechanism (a caught exception undoes everything since the block start), so it
-- leaves nothing behind. An assert failure aborts with a clear message; a clean
-- run raises "RLS spheres: all checks passed".
--
-- Role switching mid-transaction uses `reset role` (back to the superuser, always
-- allowed) then `set local role` to impersonate authenticated/anon callers.
--
-- Checks:
--   owner-only (M3-2):
--     1. owner CAN insert + select their own sphere
--     2. non-owner CANNOT read / update / delete someone else's private sphere
--     3. anon CANNOT read a private sphere
--   public read (M3-3):
--     4. anon CAN read a published (is_public, not flagged) sphere
--     5. anon CANNOT read a published-but-flagged sphere
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-00000000000a';
  uid_b uuid := '00000000-0000-0000-0000-00000000000b';
  n int;
begin
  insert into auth.users (id, email) values
    (uid_a, 'a@test.local'), (uid_b, 'b@test.local');

  -- 1. owner A: insert + select own (private by default)
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  insert into public.spheres (owner_id, tree)
    values (uid_a, '{"id":"self"}'::jsonb);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 1, 'owner must read own sphere';

  -- 2. non-owner B: no read / update / delete of A's private sphere
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

  -- 3. anon: no read of A's private sphere
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'anon must not read private sphere';

  -- A publishes
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  update public.spheres
    set is_public = true, short_code = 'testcode'
    where owner_id = uid_a;

  -- 4. anon: CAN read the published sphere
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 1, 'anon must read public sphere';

  -- A flags it (moderation)
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  update public.spheres set is_flagged = true where owner_id = uid_a;

  -- 5. anon: CANNOT read a flagged sphere
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'anon must not read flagged sphere';

  execute 'reset role';
  raise exception 'RLS_OK';  -- force rollback of all test data
exception
  when others then
    if sqlerrm = 'RLS_OK' then
      raise notice 'RLS spheres: all checks passed';
    else
      raise;  -- surface the failing assert (and roll back)
    end if;
end $$;
