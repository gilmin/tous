# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/office-hours` — structured async feedback and office hours
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — engineering plan review
- `/plan-design-review` — design plan review
- `/design-consultation` — design consultation
- `/design-shotgun` — rapid design iteration
- `/design-html` — HTML/CSS design generation
- `/review` — code review
- `/ship` — ship a feature end-to-end
- `/land-and-deploy` — land and deploy changes
- `/canary` — canary deploy
- `/benchmark` — run benchmarks
- `/browse` — web browsing (use this for all web browsing)
- `/connect-chrome` — connect to a running Chrome instance
- `/qa` — full QA pass
- `/qa-only` — QA without implementation
- `/design-review` — review design against spec
- `/setup-browser-cookies` — set up browser cookies for auth
- `/setup-deploy` — set up deploy pipeline
- `/setup-gbrain` — set up GBrain integration
- `/retro` — retrospective
- `/investigate` — investigate a bug or issue
- `/document-release` — document a release
- `/document-generate` — generate documentation
- `/codex` — Codex integration
- `/cso` — chief strategy officer review
- `/autoplan` — automatic planning
- `/plan-devex-review` — developer experience plan review
- `/devex-review` — developer experience review
- `/careful` — careful/cautious mode
- `/freeze` — freeze the codebase
- `/guard` — guard mode
- `/unfreeze` — unfreeze the codebase
- `/gstack-upgrade` — upgrade gstack
- `/learn` — learning mode

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
