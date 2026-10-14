# CLAUDE.md — Orbital TrIP

Conventions for Claude Code sessions in this repository. Read this first, then the work-package prompt you were given in `docs/prompts/`.

## What this repo is

The public Orbital TrIP registry (AGPL-3.0, GNS-Foundation): space-object identity via proof-of-trajectory. The design source of truth is [`docs/specs/SPEC-0001-full-catalog-registry.md`](docs/specs/SPEC-0001-full-catalog-registry.md). Cite spec sections (§) in commits and PRs.

## Working rules

1. **Spec first.** Never implement against an unmerged spec. If the work needs a design decision the spec doesn't make, stop and report: describe the options, then wait. The maintainer decides, then you build.
2. **One work package per session, one PR per work package.** Stay inside the WP's scope; list anything else you notice under "Follow-ups" in the PR instead of doing it.
3. **Verify against source.** Check facts about external services (CelesTrak, Space-Track, libraries) against their documentation or code, not memory, and cite what you checked.
4. **Corrections are visible.** If you find that earlier work, a spec section or a previous PR was wrong, say so in the PR under "Corrections": what was wrong and what it affected. Never fix it silently.
5. **Non-vacuity.** Every guard and test must be shown to fail when the thing it guards is broken: disable the guard, watch the test fail, restore it. Report the probes in the PR.
6. **Git.** Commits are signed. Open PRs against `main` and leave them **unmerged**; the maintainer merges. Avoid stacked PRs; if one is unavoidable, say so, so the maintainer can retarget it to `main` before merging its base.
7. **Placement (ADR-0005).** Open-standard and registry content belongs here. Commercial or product-specific features belong in a separate product repository, never here. Check every change against this.

## Approval gates — stop and ask before

- Writing to production: the deployed database, Railway variables, or redeploys.
- Applying a schema migration to the deployed database.
- Creating, loading, rotating or handling key material, or any credential (registry signing key, Space-Track account, model API key). Private keys never pass through chat, logs, the repo or CI.
- Running the history backfill against production.
- Adding a new external data source or third-party service.

## External data etiquette (SPEC-0001 §3)

- **OMM only** (JSON/CSV) — never TLE text. Catalog numbers are 6+ digits now; never assume 5.
- **CelesTrak:** at most one download per ~2 h update, one request per group, `.org` domain. On any non-200, stop and alert; never retry in a loop.
- **Space-Track:** < 30 requests/min, < 300/hour; one combined query per run, at a random minute; no per-object queries; `GP_HISTORY` and bulk files for backfill only.
- **Tests never call real services.** Stub them, and assert the request counts.
- **Citation** on every API response and in the UI (USSPACECOM / Space-Track.org; CelesTrak where it is the source). **No collision predictions** (§3.1).

## Commands

- `npm test` — healthcheck
- `npm run test:pipeline` — pipeline resilience tests (stubbed CelesTrak)
- `npm run dev` — local server with watch

Add new test suites under `scripts/` or `test/` and wire them into `.github/workflows/deploy.yml`.

## PR description template

```
Implements WP-XX (SPEC-0001 §…)

## What
## How it meets the acceptance criteria (one line per criterion, with evidence)
## Non-vacuity probes (guard disabled → which test failed → restored)
## Corrections (or "None")
## Approval gates hit (what is waiting on the maintainer, or "None")
## Follow-ups (out of scope, noticed)
```
