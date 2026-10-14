# Structured prompts for Claude Code

Each file here is a self-contained prompt for **one work package (WP)** of [SPEC-0001](../specs/SPEC-0001-full-catalog-registry.md). Start a fresh Claude Code session in this repo, paste the whole file as the first message, and let the session produce **one unmerged PR**. Repository conventions live in [`CLAUDE.md`](../../CLAUDE.md), which Claude Code loads automatically.

The prompts are written for the state of `main` after SPEC-0001 is merged. If an earlier WP landed differently from what a prompt assumes, the session must report the mismatch before building.

## Order and dependencies — Phase 1

| WP | Prompt | Depends on | Approval gates inside |
|---|---|---|---|
| WP-01 | [Postgres schema and migrations](WP-01-schema.md) | — | Apply migration to production |
| WP-02 | [CelesTrak OMM + SATCAT ingestion](WP-02-celestrak-ingest.md) | WP-01 | Production run |
| WP-03 | [Space-Track ingestion](WP-03-spacetrack-ingest.md) | WP-01 | Space-Track credentials |
| WP-04 | [Per-epoch Merkle TrIP + registry key](WP-04-merkle-trip.md) | WP-02 | Registry key install |
| WP-05 | [Public API v2](WP-05-api-v2.md) | WP-02, WP-04 | — |
| WP-06 | [3D globe](WP-06-globe.md) | WP-05 | — |
| WP-07 | [History backfill](WP-07-backfill.md) | WP-03, WP-04 | Production backfill run, depth |
| WP-08 | [Curated overlay](WP-08-overlay.md) | WP-01, WP-05 | — |

WP-02 and WP-03 can run in parallel; so can WP-06 and WP-08 once WP-05 lands. Never run two sessions on the same files.

Prompts for Phase 2 (analytics) and Phase 3 (AI layer) are written after Phase 1 lands, from what it actually stores.

## Prompt structure

Every prompt uses the same sections, so sessions behave consistently:

- `<context>` — where this WP sits; spec sections to read first.
- `<objective>` — the one outcome of this WP.
- `<inputs>` — files, services and data the session may use.
- `<requirements>` — what to build, numbered so the PR can answer each.
- `<constraints>` — hard rules beyond `CLAUDE.md`.
- `<acceptance>` — checks the PR must demonstrate, with evidence.
- `<stop_and_ask>` — situations where the session reports and waits instead of deciding.
- `<out_of_scope>` — things not to touch.
- `<deliverable>` — what the PR contains.
