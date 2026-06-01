-- M4 prerequisite — seed demo public spheres for cold-start discovery.
--
-- eng-review D4 left the public pool empty (default private), so
-- random_public_sphere() returns null until real users publish. /discover (M4)
-- would open to a blank void. These 5 hand-authored "inner worlds" — distinct
-- personas, the manifesto's "다양한 개인" — prime the pool so the very first
-- visitor has varied spheres to warp between on day one.
--
-- spheres.owner_id is a NOT NULL FK to auth.users with unique(owner_id), so each
-- demo sphere needs its own owner. We create 5 placeholder auth users that never
-- log in (no password, "seed" provider) purely as FK anchors. Tear everything
-- down with one line (cascades to spheres):
--   delete from auth.users where raw_app_meta_data->>'provider' = 'seed';
--
-- Idempotent: both inserts are ON CONFLICT DO NOTHING, so re-applying is a no-op.

-- 1) Placeholder owners ────────────────────────────────────────────────
-- Fixed UUIDs (d0000000-…-0000000n) so re-runs map to the same rows. Token
-- columns set to '' rather than NULL — older GoTrue chokes on NULL there, and
-- empty strings are harmless for accounts that never authenticate.
insert into auth.users
  (instance_id, id, aud, role, email, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
   confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'demo-wanderer@tous.local', now(), now(), now(), '{"provider":"seed","providers":["seed"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'demo-maker@tous.local',    now(), now(), now(), '{"provider":"seed","providers":["seed"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'demo-caregiver@tous.local',now(), now(), now(), '{"provider":"seed","providers":["seed"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'demo-seeker@tous.local',   now(), now(), now(), '{"provider":"seed","providers":["seed"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'demo-still@tous.local',     now(), now(), now(), '{"provider":"seed","providers":["seed"]}', '{}', '', '', '', '')
on conflict (id) do nothing;

-- 2) Demo spheres ──────────────────────────────────────────────────────
-- node_count is stated explicitly per row (8–9 bodies each, all past the >= 3
-- discovery filter). These are static seed trees, so the count cannot drift on
-- its own; the post-apply check re-derives it with a recursive walk and asserts
-- it matches. (jsonpath '$.**.id' over-counts under lax-mode array unwrapping, so
-- it is deliberately not used here.)
insert into public.spheres (owner_id, tree, is_public, short_code, node_count)
select
  d.owner_id,
  d.tree,
  true,
  d.short_code,
  d.node_count
from (
  values
  -- 여행자 — 떠남과 돌아옴 사이의 사람 (teal / sand)
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'wanderer', 9, '{
    "id":"self","label":"나","size":0.6,"color":"#e8d9b0","emissive":"#caa45a","shape":"smooth","selfRotation":0.05,"children":[
      {"id":"w1","label":"떠남","size":0.2,"color":"#7fb9c9","shape":"oblong","orbitRadius":1.6,"orbitSpeed":0.4,"inclination":0.12,"phase":0,"selfRotation":0.2,"children":[
        {"id":"w1a","label":"설렘","size":0.06,"color":"#bfe0e8","shape":"smooth","orbitRadius":0.35,"orbitSpeed":1.4,"inclination":0.25,"phase":0},
        {"id":"w1b","label":"두고 온 것","size":0.05,"color":"#9ec7d0","shape":"pebble","orbitRadius":0.55,"orbitSpeed":1.0,"inclination":-0.15,"phase":3.0}
      ]},
      {"id":"w2","label":"낯섦","size":0.15,"color":"#c9b27f","shape":"facet","orbitRadius":2.5,"orbitSpeed":0.28,"inclination":-0.18,"phase":2.1,"selfRotation":0.35,"children":[
        {"id":"w2a","label":"다른 말","size":0.06,"color":"#e0d2a8","shape":"crystal","orbitRadius":0.4,"orbitSpeed":1.2,"inclination":0.2,"phase":1.0}
      ]},
      {"id":"w3","label":"길","size":0.17,"color":"#8a9bb5","shape":"banded","orbitRadius":3.3,"orbitSpeed":0.2,"inclination":0.22,"phase":4.2,"selfRotation":0.15},
      {"id":"w4","label":"돌아옴","size":0.13,"color":"#d39a86","shape":"conjoined","orbitRadius":4.1,"orbitSpeed":0.14,"inclination":-0.12,"phase":5.5,"selfRotation":0.2,"children":[
        {"id":"w4a","label":"그리움","size":0.05,"color":"#ecc4b6","shape":"smooth","orbitRadius":0.45,"orbitSpeed":1.1,"inclination":0.1,"phase":2.0}
      ]}
    ]
  }'::jsonb),
  -- 만드는 사람 — 창조와 불안 사이 (orange / charcoal)
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'themaker', 9, '{
    "id":"self","label":"나","size":0.6,"color":"#f0a868","emissive":"#e0641a","shape":"smooth","selfRotation":0.06,"children":[
      {"id":"m1","label":"창조","size":0.22,"color":"#e8743a","shape":"cluster","orbitRadius":1.7,"orbitSpeed":0.42,"inclination":0.1,"phase":0.3,"selfRotation":0.35,"children":[
        {"id":"m1a","label":"영감","size":0.06,"color":"#f5b48a","shape":"crystal","orbitRadius":0.38,"orbitSpeed":1.5,"inclination":0.3,"phase":0},
        {"id":"m1b","label":"모방","size":0.05,"color":"#caa090","shape":"pebble","orbitRadius":0.58,"orbitSpeed":0.95,"inclination":-0.2,"phase":3.4}
      ]},
      {"id":"m2","label":"몰입","size":0.16,"color":"#d65a4a","shape":"spike","orbitRadius":2.5,"orbitSpeed":0.3,"inclination":-0.15,"phase":2.4,"selfRotation":0.4,"children":[
        {"id":"m2a","label":"시간","size":0.05,"color":"#e89a8a","shape":"smooth","orbitRadius":0.42,"orbitSpeed":1.3,"inclination":0.18,"phase":1.2}
      ]},
      {"id":"m3","label":"불안","size":0.14,"color":"#7a6a78","shape":"cratered","orbitRadius":3.3,"orbitSpeed":0.22,"inclination":0.2,"phase":4.0,"selfRotation":0.2,"children":[
        {"id":"m3a","label":"비교","size":0.05,"color":"#a596a0","shape":"fissured","orbitRadius":0.5,"orbitSpeed":1.0,"inclination":-0.1,"phase":0.5}
      ]},
      {"id":"m4","label":"손","size":0.12,"color":"#c98a5a","shape":"pebble","orbitRadius":4.0,"orbitSpeed":0.15,"inclination":-0.1,"phase":5.2,"selfRotation":0.18}
    ]
  }'::jsonb),
  -- 돌보는 사람 — 사랑과 소진 사이 (pink / sage)
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'caregivr', 9, '{
    "id":"self","label":"나","size":0.58,"color":"#f3c0cf","emissive":"#e07a98","shape":"dimpled","selfRotation":0.04,"children":[
      {"id":"c1","label":"사랑","size":0.21,"color":"#e88aa8","shape":"smooth","orbitRadius":1.6,"orbitSpeed":0.4,"inclination":0.12,"phase":0.1,"selfRotation":0.25,"children":[
        {"id":"c1a","label":"주는 것","size":0.06,"color":"#f4b8cc","shape":"smooth","orbitRadius":0.36,"orbitSpeed":1.4,"inclination":0.22,"phase":0},
        {"id":"c1b","label":"받는 것","size":0.06,"color":"#f0a8c0","shape":"conjoined","orbitRadius":0.56,"orbitSpeed":1.05,"inclination":-0.18,"phase":3.1}
      ]},
      {"id":"c2","label":"책임","size":0.18,"color":"#8fbf8a","shape":"potato","orbitRadius":2.5,"orbitSpeed":0.28,"inclination":-0.16,"phase":2.3,"selfRotation":0.15,"children":[
        {"id":"c2a","label":"죄책감","size":0.05,"color":"#b8d6b0","shape":"lumpy","orbitRadius":0.45,"orbitSpeed":1.15,"inclination":0.2,"phase":1.5}
      ]},
      {"id":"c3","label":"소진","size":0.13,"color":"#9a9a8a","shape":"fissured","orbitRadius":3.3,"orbitSpeed":0.2,"inclination":0.2,"phase":4.3,"selfRotation":0.1,"children":[
        {"id":"c3a","label":"쉼","size":0.06,"color":"#c4c4b0","shape":"smooth","orbitRadius":0.5,"orbitSpeed":0.9,"inclination":-0.12,"phase":0.8}
      ]},
      {"id":"c4","label":"경계","size":0.11,"color":"#cf9ab0","shape":"crystal","orbitRadius":4.0,"orbitSpeed":0.15,"inclination":-0.1,"phase":5.4,"selfRotation":0.22}
    ]
  }'::jsonb),
  -- 질문하는 사람 — 호기심과 의심 사이 (indigo / cyan)
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'theseekr', 9, '{
    "id":"self","label":"나","size":0.6,"color":"#b0a8e8","emissive":"#5a4ad0","shape":"smooth","selfRotation":0.05,"children":[
      {"id":"q1","label":"호기심","size":0.2,"color":"#7a8ce8","shape":"tentacle","orbitRadius":1.7,"orbitSpeed":0.44,"inclination":0.14,"phase":0.2,"selfRotation":0.4,"children":[
        {"id":"q1a","label":"질문","size":0.06,"color":"#a8b6f0","shape":"spike","orbitRadius":0.38,"orbitSpeed":1.5,"inclination":0.28,"phase":0},
        {"id":"q1b","label":"관찰","size":0.05,"color":"#9ad0e0","shape":"dimpled","orbitRadius":0.58,"orbitSpeed":1.0,"inclination":-0.2,"phase":3.3}
      ]},
      {"id":"q2","label":"의심","size":0.15,"color":"#8a6ab0","shape":"fissured","orbitRadius":2.5,"orbitSpeed":0.3,"inclination":-0.16,"phase":2.5,"selfRotation":0.2,"children":[
        {"id":"q2a","label":"회의","size":0.05,"color":"#b094c8","shape":"cratered","orbitRadius":0.45,"orbitSpeed":1.1,"inclination":0.18,"phase":1.1}
      ]},
      {"id":"q3","label":"경이","size":0.16,"color":"#6ac0d0","shape":"crystal","orbitRadius":3.3,"orbitSpeed":0.22,"inclination":0.22,"phase":4.1,"selfRotation":0.3},
      {"id":"q4","label":"진실","size":0.14,"color":"#5a6ac0","shape":"ringed","orbitRadius":4.1,"orbitSpeed":0.15,"inclination":-0.12,"phase":5.6,"selfRotation":0.12,"children":[
        {"id":"q4a","label":"모름","size":0.05,"color":"#9aa0d8","shape":"smooth","orbitRadius":0.5,"orbitSpeed":0.95,"inclination":0.1,"phase":2.2}
      ]}
    ]
  }'::jsonb),
  -- 고요한 사람 — 깊이로 가라앉는 사람 (slate / pale)
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'stillone', 8, '{
    "id":"self","label":"나","size":0.55,"color":"#cdd6e0","emissive":"#7a8a9a","shape":"smooth","selfRotation":0.03,"children":[
      {"id":"s1","label":"고요","size":0.19,"color":"#a8b8c8","shape":"smooth","orbitRadius":1.6,"orbitSpeed":0.35,"inclination":0.1,"phase":0.2,"selfRotation":0.1,"children":[
        {"id":"s1a","label":"소리 없음","size":0.05,"color":"#cdd8e2","shape":"smooth","orbitRadius":0.4,"orbitSpeed":1.2,"inclination":0.2,"phase":0}
      ]},
      {"id":"s2","label":"깊이","size":0.18,"color":"#7a90aa","shape":"oblong","orbitRadius":2.5,"orbitSpeed":0.26,"inclination":-0.18,"phase":2.4,"selfRotation":0.12,"children":[
        {"id":"s2a","label":"침잠","size":0.06,"color":"#9aacc0","shape":"oblong","orbitRadius":0.42,"orbitSpeed":1.0,"inclination":0.18,"phase":1.0},
        {"id":"s2b","label":"바닥","size":0.05,"color":"#6a7e96","shape":"pebble","orbitRadius":0.62,"orbitSpeed":0.85,"inclination":-0.15,"phase":3.6}
      ]},
      {"id":"s3","label":"거리","size":0.14,"color":"#b0bcc8","shape":"banded","orbitRadius":3.3,"orbitSpeed":0.2,"inclination":0.22,"phase":4.2,"selfRotation":0.15},
      {"id":"s4","label":"비움","size":0.12,"color":"#c0c8d2","shape":"rippled","orbitRadius":4.0,"orbitSpeed":0.14,"inclination":-0.1,"phase":5.5,"selfRotation":0.18}
    ]
  }'::jsonb)
) as d(owner_id, short_code, node_count, tree)
on conflict (owner_id) do nothing;
