-- Gate for random_group_sphere (#12 slice 3). Verifies member-scoped browsing:
-- a member gets a co-member's universe (never their own); a non-member gets
-- nothing. Self-contained (rolls back via the final RAISE). Clean run raises
-- "random_group_sphere: all checks passed".
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-0000000000a2';
  uid_b uuid := '00000000-0000-0000-0000-0000000000b2';
  uid_c uuid := '00000000-0000-0000-0000-0000000000c2';
  v_group uuid;
  v_code text;
  v_id uuid;
  v_nick text;
  n int;
begin
  insert into auth.users (id, email) values
    (uid_a, 'a2@test.local'), (uid_b, 'b2@test.local'), (uid_c, 'c2@test.local');

  -- A creates a group + owns a (private) universe
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  insert into public.spheres (owner_id, tree)
    values (uid_a, '{"id":"self","label":"나"}'::jsonb);
  select g.id, g.invite_code into v_group, v_code
    from public.create_group('우주친구', 'Ava') g;

  -- B joins and owns their own universe
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  insert into public.spheres (owner_id, tree)
    values (uid_b, '{"id":"self"}'::jsonb);
  perform public.join_group(v_code, 'Ben');

  -- 1. B browsing the group gets A's universe (not their own), with A's nickname
  select id, nickname into v_id, v_nick
    from public.random_group_sphere(v_group, '{}'::uuid[]);
  assert v_id is not null, 'member must get a sphere';
  assert v_nick = 'Ava', 'must return the owner''s group nickname';

  -- 2. self is excluded — B never receives B's own universe, even repeatedly
  for i in 1..8 loop
    select id into v_id from public.random_group_sphere(v_group, '{}'::uuid[]);
    assert v_id is not null, 'pool must not be empty for a member';
  end loop;
  select count(*) into n
    from public.spheres s
    where s.owner_id = uid_b
      and s.id in (select id from public.random_group_sphere(v_group, '{}'::uuid[]));
  assert n = 0, 'must never return the caller''s own sphere';

  -- 3. non-member C gets nothing (fail closed)
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.random_group_sphere(v_group, '{}'::uuid[]);
  assert n = 0, 'non-member must get nothing';

  execute 'reset role';
  raise exception 'GATE_OK';
exception
  when others then
    if sqlerrm = 'GATE_OK' then
      raise notice 'random_group_sphere: all checks passed';
    else
      raise;
    end if;
end $$;
