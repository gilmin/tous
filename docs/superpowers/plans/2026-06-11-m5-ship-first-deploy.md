# M5 Ship-First Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get `tous` live on a Vercel-provided domain with all existing flows (OAuth login, `/me` cloud save, `/discover`, `/s/[code]`, `/groups`) working against the existing Supabase project as production.

**Architecture:** Vercel hosts the Next.js 16 app (auto-detected, no `vercel.json`). The existing Supabase project `lrfucciojxrqctfswduk` becomes production — migrations, RLS, and the 5 demo spheres are already in place. Only two client-public env vars are needed; no server secret. Most steps are HITL dashboard config; Claude handles preflight verification and recording.

**Tech Stack:** Next.js 16.2.6, React 19, Supabase (`@supabase/ssr`), Vercel.

**Source spec:** `docs/superpowers/specs/2026-06-11-m5-ship-first-deploy-design.md`

**Note on format:** This is a deployment runbook. Code-test-commit TDD loops do not apply to dashboard config steps. HITL steps state exactly what the user does and how Claude verifies the result.

---

### Task 1: Preflight verification (Claude)

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm clean working tree on the deploy branch**

Run: `git status -sb`
Expected: on `feat/m5-deploy`, no uncommitted changes except (already-committed) design+plan docs.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Unit tests**

Run: `npx vitest run`
Expected: `Test Files 8 passed (8)`, `Tests 91 passed (91)`.

- [ ] **Step 4: Production build (the real preflight gate)**

Run: `npx next build`
Expected: build completes with `✓ Compiled successfully` and a route table. No type errors, no missing-env failures. If the build reads Supabase env at build time and fails, note it — env is only needed at runtime, so a build-time failure means a code path is calling the client during prerender and must be fixed before deploy.

- [ ] **Step 5: Record the result**

If all green: proceed to Task 2. If `next build` fails: STOP, surface the error, fix before continuing (do not deploy a broken build).

---

### Task 2: Connect the repo to Vercel and set env vars (HITL)

**Files:** none in repo. Vercel project settings.

- [ ] **Step 1: Retrieve the env values to paste into Vercel**

Run: `cat .env.local`
Expected: prints `NEXT_PUBLIC_SUPABASE_URL=https://lrfucciojxrqctfswduk.supabase.co` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>`. Claude relays these two values to the user for the next step (both are client-public, safe to use).

- [ ] **Step 2: Import the GitHub repo in Vercel (user)**

User action, in the Vercel dashboard (https://vercel.com/new):
1. Import the `gilmin/tous` GitHub repository.
2. Framework preset: Next.js (auto-detected). Leave build/output settings default.
3. Before the first deploy, add Environment Variables (Production scope):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://lrfucciojxrqctfswduk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (value from Step 1)
4. Set the Production Branch to `main` (Project Settings → Git). The first manual deploy can target `feat/m5-deploy`, but production should track `main`.

- [ ] **Step 3: Confirm import (user → Claude)**

User confirms the project is created and reports the assigned production domain (e.g. `tous-xxx.vercel.app`). Claude records this domain — it is needed for Task 3.

---

### Task 3: Configure Supabase auth redirect for the prod domain (HITL)

**Files:** none in repo. Supabase Auth settings.

**Why:** OAuth providers (Google/GitHub) redirect back to Supabase's `/auth/v1/callback`, which then redirects to the app's redirect URL. Supabase only honors redirect URLs on its allow-list, so the prod domain must be added or login will fail with a redirect error.

- [ ] **Step 1: Set Site URL and Redirect URLs (user)**

In Supabase dashboard → Authentication → URL Configuration (project `lrfucciojxrqctfswduk`):
1. **Site URL**: `https://<prod-domain>` (the domain from Task 2 Step 3).
2. **Redirect URLs** — add:
   - `https://<prod-domain>/auth/callback`
   - `https://<prod-domain>/**` (covers post-login returns)
3. Keep the existing `http://localhost:3000/**` entry so local dev still works.

- [ ] **Step 2: Verify provider callbacks are unchanged (user)**

Confirm Google and GitHub OAuth apps still point their Authorized redirect URI / callback at `https://lrfucciojxrqctfswduk.supabase.co/auth/v1/callback`. No change needed here — this is a confirmation, not an edit.

- [ ] **Step 3: User confirms saved**

User reports the redirect config is saved. Proceed to Task 4.

---

### Task 4: Deploy and capture the production URL (HITL + Claude)

**Files:** none.

- [ ] **Step 1: Trigger the deploy (user)**

If Vercel auto-deployed on import, this is already running. Otherwise, in Vercel → Deployments, trigger a deploy of the production branch.

- [ ] **Step 2: Confirm build success (user → Claude)**

User reports the Vercel build status. Expected: "Ready" with no build errors. If the Vercel build fails but local `next build` (Task 1) passed, the most likely cause is a missing/typo'd env var — re-check Task 2 Step 2.

- [ ] **Step 3: Record the live URL**

Claude notes the final production URL for the smoke test.

---

### Task 5: Production smoke test (HITL + Claude)

**Files:** none. Manual verification against the live URL.

Map directly to the spec's Success Criteria. OAuth and cloud roundtrip cannot be driven headless, so these are user-performed; Claude can assist with the anonymous/public checks via the gstack browser if useful.

- [ ] **Step 1: Landing loads over HTTPS**

User opens `https://<prod-domain>/`. Expected: pulsing "나" landing + "당신의 우주는 어떤 모양인가요?" + 탐험 CTA. (Spec criterion 1.)

- [ ] **Step 2: Discover shows the demo pool + warp**

User opens `/discover`. Expected: a demo sphere renders; "다음"/Space warps to another; "뒤로"/← returns. The 5 seeded spheres (wanderer/themaker/caregivr/theseekr/stillone) are the pool. (Spec criterion 4.)

- [ ] **Step 3: OAuth login end-to-end (user)**

User clicks login → Google (and separately GitHub). Expected: redirects to provider, back through Supabase, lands authenticated at `/me`. No redirect-mismatch error. (Spec criterion 2.) If it fails → revisit Task 3.

- [ ] **Step 4: Cloud save roundtrip (user)**

In `/me`, edit the sphere (add/rename a node), wait for debounced sync (~1.5s), reload the page. Expected: edits persist (loaded from Supabase). (Spec criterion 3.)

- [ ] **Step 5: Public share link (Claude or user)**

Publish a sphere via the toggle to get a `short_code`, open `/s/<short_code>` (Claude can do this anonymously via gstack browser). Expected: valid code → 200 read-only scene; random invalid code → 404. (Spec criterion 5.)

- [ ] **Step 6: Groups smoke (user)**

User creates a group, copies the code, joins from the other account (or confirms the create+roster UI renders). Expected: group create + join-by-code + roster work. (Covers `/groups` from the goal.)

- [ ] **Step 7: Tally results**

Claude records pass/fail per criterion. Any failure → triage before declaring M5-A done.

---

### Task 6: Record the deploy and merge the branch (Claude)

**Files:**
- Modify: `PROGRESS.md`
- Merge: `feat/m5-deploy` → `main` (via PR, per project convention)

- [ ] **Step 1: Update PROGRESS.md**

Update the "현재 상태" block: M5-A (배포) done, live URL recorded, Supabase project reused as prod, demo spheres retained. Frame M5-B backlog (성능/InstancedMesh redesign per Known Tension, 온보딩, 모바일 가드). Add an M5 entry to §5 Done.

- [ ] **Step 2: Commit the PROGRESS update**

```bash
git add PROGRESS.md
git commit -m "docs(progress): M5-A ship-first deploy live + M5-B backlog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push and open PR (Claude, with user)**

```bash
git push -u origin feat/m5-deploy
gh pr create --title "M5-A: ship-first deploy (design + plan + progress)" --body "Deployment design, runbook, and progress update for the live ship. See docs/superpowers/specs and plans dated 2026-06-11."
```
User merges the PR. After merge, Vercel auto-deploys `main` to production.

- [ ] **Step 4: Confirm production tracks main**

After merge, confirm the production deployment on Vercel reflects `main` (the merge commit). M5-A complete.

---

## Self-Review

**Spec coverage:**
- S1 deploy-only / defer → Task scope + spec Out of Scope ✓
- S2 reuse Supabase as prod → Task 2/3 use `lrfucciojxrqctfswduk` ✓
- S3 Vercel default domain → Task 2 Step 3 ✓
- S4 keep demo spheres → Task 5 Step 2 relies on them; no deletion step ✓
- S5 mobile guard deferred → not in plan, listed Out of Scope ✓
- S6 branch already merged → confirmed; deploy branch is fresh `feat/m5-deploy` ✓
- Env vars (2, client-public, no secret) → Task 2 Step 1–2 ✓
- Success criteria 1–6 → Task 5 Steps 1–6 + Task 6 (criterion 6) ✓
- Known Tension (InstancedMesh) → carried to PROGRESS M5-B in Task 6 ✓

**Placeholder scan:** `<prod-domain>` and `<key>`/`<short_code>` are runtime-resolved values captured during execution (Task 2 Step 3 / Task 2 Step 1 / Task 5 Step 5), not unspecified TODOs — acceptable.

**Type consistency:** n/a (no new code; config + docs only).
