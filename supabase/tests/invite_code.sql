-- Invite-code generator checks (migration 0010). Verifies gen_invite_code() emits
-- a 6-char code drawn only from the unambiguous 32-char alphabet, and that it is not
-- constant (CSPRNG output varies). Self-contained, touches no rows. A clean run raises
-- "invite_code: all checks passed".
--
-- gen_invite_code is an internal (un-granted) function, so this runs at the migration/
-- superuser level (no `set local role`), which is the only caller that may invoke it
-- directly — create_group reaches it through SECURITY DEFINER in normal use.
do $$
declare
  code text;
  i int;
  seen text[] := '{}';
begin
  for i in 1..50 loop
    code := public.gen_invite_code();
    -- Length + alphabet in one check: exactly 6 chars, each in the no-0/O/1/I set.
    assert code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$',
      format('invite code out of alphabet/length: %L', code);
    seen := seen || code;
  end loop;

  -- Not a constant generator: 50 draws from a ~1e9 space must yield >1 distinct value
  -- (a collision-only result is astronomically improbable → would mean a dead RNG).
  assert (select count(distinct c) from unnest(seen) as c) > 1,
    'gen_invite_code produced a constant value (RNG not working)';

  raise exception 'GATE_OK';  -- uniform success signal (nothing to roll back here)
exception
  when others then
    if sqlerrm = 'GATE_OK' then
      raise notice 'invite_code: all checks passed';
    else
      raise;  -- surface the failing assert
    end if;
end $$;
