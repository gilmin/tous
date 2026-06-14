-- Security hardening — group invite codes must come from a CSPRNG.
--
-- 0007's gen_invite_code() built the code with Postgres random(), a NON-cryptographic
-- per-session PRNG. An invite code is a capability: anyone holding one can join the
-- group and read its members' PRIVATE universes (the spheres "group co-members read"
-- policy). A predictable generator weakens that capability — the share-link short_code
-- already uses crypto.getRandomValues (lib/sphere/short-code.ts), so the invite code
-- was the odd one out.
--
-- This replaces the body with a CSPRNG source while keeping the signature, the 6-char
-- length, and the unambiguous 32-char alphabet (no 0/O/1/I) unchanged — so create_group,
-- the unique constraint, and the collision retry all keep working untouched. Internal
-- function (no grant; only create_group calls it), so CREATE OR REPLACE is sufficient.
--
-- Randomness source: gen_random_uuid() is built-in (pg_catalog, resolves under the
-- pinned empty search_path) and is backed by pg_strong_random — the same strong RNG
-- pgcrypto uses — so we get CSPRNG bytes without depending on the pgcrypto extension's
-- schema. We fold 6 of its 16 random bytes into the alphabet — bytes 0..5, the fully
-- random prefix (a v4 UUID's fixed version/variant nibbles fall at bytes 6 and 8, so
-- the first six bytes carry full entropy).
--
-- No modulo bias: 256 = 8 × 32 exactly, so (byte % 32) is perfectly uniform across the
-- 32-char alphabet. (Entropy is unchanged at 32^6 ≈ 1.07e9 / ~30 bits — this fix
-- removes *predictability*, not the code length.)

create or replace function public.gen_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- 32 chars, no 0/O/1/I
  raw bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');  -- 16 CSPRNG bytes
  code text := '';
  i int;
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;
