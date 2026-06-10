-- 🚩 RLS MERGE GATE for friend groups (#12). Verifies the security boundary —
-- especially the sensitive rule that group co-members can read each other's
-- PRIVATE spheres, and non-members cannot. Self-contained: every row is rolled
-- back via the RAISE at the end. A clean run raises "groups: all checks passed";
-- a failing assert surfaces its message and rolls back.
--
-- Auth is simulated the same way as rls_spheres.sql: `set local role` + a
-- request.jwt.claims sub so auth.uid() resolves to the impersonated user.
--
-- Cast: A creates a group + owns a private sphere. B joins (becomes co-member).
-- C never joins (negative control).
--   1. create_group: A is a member and reads the group; bad code → join returns null
--   2. non-member B CANNOT read A's private sphere (before joining)
--   3. after B joins: B CAN read A's private sphere (co-member grant)
--   4. roster: B sees nicknames of A+B; non-member C sees nothing
--   5. negative control: C still CANNOT read A's private sphere
--   6. after B leaves: B can no longer read A's private sphere
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-0000000000a1';
  uid_b uuid := '00000000-0000-0000-0000-0000000000b1';
  uid_c uuid := '00000000-0000-0000-0000-0000000000c1';
  v_group uuid;
  v_code text;
  v_joined uuid;
  n int;
begin
  insert into auth.users (id, email) values
    (uid_a, 'a@test.local'), (uid_b, 'b@test.local'), (uid_c, 'c@test.local');

  -- A: create a group + own a private (unpublished) sphere
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  insert into public.spheres (owner_id, tree)
    values (uid_a, '{"id":"self"}'::jsonb);
  select g.id, g.invite_code into v_group, v_code
    from public.create_group('친구들', 'Aaa') g;

  -- 1. A is a member and can read the group; an unknown code fails closed
  select count(*) into n from public.groups where id = v_group;
  assert n = 1, 'creator must read own group';
  select count(*) into n from public.group_members
    where group_id = v_group and user_id = uid_a;
  assert n = 1, 'creator must be a member';
  select public.join_group('NOPE99', 'x') into v_joined;
  assert v_joined is null, 'bad invite code must return null';

  -- 2. B (not yet a member) cannot read A's private sphere
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'non-member must not read private sphere';

  -- 3. B joins → can now read A's private sphere
  select public.join_group(v_code, 'Bee') into v_joined;
  assert v_joined = v_group, 'join must return the group id';
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 1, 'co-member must read private sphere';

  -- 4. roster: B sees both nicknames; C (non-member) sees none
  select count(*) into n from public.group_members where group_id = v_group;
  assert n = 2, 'member must read full roster (A + B)';
  select count(*) into n from public.group_members
    where group_id = v_group and nickname = 'Aaa';
  assert n = 1, 'roster shows nicknames';

  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.group_members where group_id = v_group;
  assert n = 0, 'non-member must not read roster';

  -- 5. negative control: C cannot read A's private sphere
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'non-member C must not read private sphere';

  -- 6. B leaves → loses access to A's private sphere
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  delete from public.group_members where group_id = v_group and user_id = uid_b;
  select count(*) into n from public.spheres where owner_id = uid_a;
  assert n = 0, 'former member must not read private sphere after leaving';

  execute 'reset role';
  raise exception 'GATE_OK';  -- force rollback of all test data
exception
  when others then
    if sqlerrm = 'GATE_OK' then
      raise notice 'groups: all checks passed';
    else
      raise;  -- surface the failing assert (and roll back)
    end if;
end $$;
