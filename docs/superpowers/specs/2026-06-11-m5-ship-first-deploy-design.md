# M5 — Ship-First Deployment Design

**Date**: 2026-06-11
**Status**: Approved (scope locked with user)
**Milestone**: M5 (폴리시 + 배포), slice A = deployment

## Goal

Get `tous` live on a Vercel-provided domain so the real product can be
dogfooded and shared via real URLs. Every existing flow must work in
production: landing `/`, OAuth login, `/me` cloud save/restore,
`/discover` exploration, `/s/[short_code]` public spheres, and `/groups`.

Performance polish (InstancedMesh / LOD / tuning) and first-entry
onboarding are **explicitly deferred to M5-B** — they ride on top of the
live site and must not block the deploy.

## Scope Decisions (locked with user, 2026-06-11)

| # | Decision | Rationale |
|---|---|---|
| S1 | **Deploy only.** Performance + onboarding → M5-B. | Ship-first. The design-doc "InstancedMesh" plan needs an architecture redesign (see Known Tension) and must not gate the deploy. |
| S2 | **Reuse existing Supabase project `lrfucciojxrqctfswduk` as production.** | Simplest. Migrations 0001–0008, RLS, and the 5 demo spheres are already there. Solo / early-dogfood stage. |
| S3 | **Vercel default domain** (e.g. `tous-*.vercel.app`). | Design doc defers custom domain. Ship immediately; custom domain later. |
| S4 | **Keep the 5 demo spheres in production.** | They are the `/discover` cold-start public pool — required for a non-empty first-visitor experience. |
| S5 | **Mobile guard deferred to M5-B.** | Cheap but not blocking; ship without it. |
| S6 | **No branch prep needed.** `feat/edit-pattern-picker` already merged (PR #38, `origin/main` = `1ed0756`). | Confirmed merged. |

## Environment

- **Hosting**: Vercel. Next.js 16.2.6 auto-detected — no `vercel.json` needed.
- **Env vars** (Production scope, both client-public):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - No server secret / service-role key is used anywhere (verified: only
    these two are read across `lib/supabase/{client,middleware,server}.ts`).
- **anon key exposure** is by design — it is gated by RLS
  (`is_public AND NOT is_flagged`, owner-only CUD), already merge-gated in M3.

## Deployment Sequence

| # | Step | Owner | Detail |
|---|---|---|---|
| 1 | Preflight | Claude | `next build` (production build, not dev) passes; `tsc --noEmit` clean; `vitest run` 91 green. Fix any build break before proceeding. |
| 2 | Vercel connect | HITL | Link the GitHub repo to Vercel (dashboard import or `vercel` CLI). Add the two `NEXT_PUBLIC_*` env vars at Production scope. |
| 3 | OAuth redirect | HITL | In Supabase → Auth → URL Configuration: set Site URL + add `https://<prod-domain>/auth/callback` to the redirect allow-list. Google/GitHub provider callbacks stay pointed at Supabase's `/auth/v1/callback` (unchanged) — the key change is Supabase's allowed redirect/site URL must include the prod domain. |
| 4 | Deploy | Claude/HITL | Trigger the Vercel build; capture the production URL. |
| 5 | Production smoke | HITL + Claude | On the live URL: `/` landing, `/discover` shows the 5 demo spheres + warp, login (Google/GitHub) end-to-end, `/me` save→reload roundtrip, `/s/[code]` valid 200 / invalid 404, `/groups` create/join. OAuth + cloud roundtrip are HITL (headless can't drive OAuth). |
| 6 | Record | Claude | Update `PROGRESS.md`: deploy recorded, M5-A done, M5-B (polish) backlog framed. |

## Known Tension (carried to M5-B, not resolved here)

The design-doc M5 performance plan names **InstancedMesh** for node
rendering. InstancedMesh batches a *single* geometry+material, but M2
locked **per-node shape variants (20-shape Planet.tsx catalog) + per-node
color**. These conflict. M5-B must redesign the performance approach
(per-shape instance groups, LOD-only, or an alternative) rather than apply
InstancedMesh as written. Flagged here so it is not forgotten.

## Out of Scope (M5-B and later)

- Performance measurement + tuning (target: M1 MacBook Air iGPU, 100 nodes,
  1080p, 60fps median / 30fps p95).
- InstancedMesh / sphere LOD (pending redesign — see Known Tension).
- First-entry onboarding.
- Mobile out-of-scope guard.
- Custom domain.

## Success Criteria

1. Production URL loads the landing page over HTTPS.
2. A real user can log in via Google or GitHub on the live site.
3. `/me` saves a sphere and it survives a reload (cloud roundtrip).
4. `/discover` shows the demo public pool and warps between spheres.
5. A shared `/s/[short_code]` link opens for an anonymous visitor.
6. `PROGRESS.md` reflects the live deploy and the M5-B backlog.
