# WP-01 — Postgres schema and migrations

<context>
Orbital TrIP is moving from a single generated JSON file to a Railway Postgres database that stores every element set ever ingested (SPEC-0001 D4). This WP creates the schema and the migration tooling that every later WP builds on.
Read first: SPEC-0001 §0 (D1, D4, D9), §4.2, §5, §6 (event shape), §7 (explanations keys). Read `CLAUDE.md`.
</context>

<objective>
A versioned, tested Postgres schema for objects, element sets, epochs, events, explanations and overlay, plus a migration runner and a DB access module, without touching production.
</objective>

<inputs>
- The repo at `main`. Node 20, CommonJS, Express app in `src/`.
- A local or throwaway Postgres for tests (e.g. a service container in CI, or `pg-mem` if it supports what you need — check, don't assume).
- Connection only via the `DATABASE_URL` environment variable.
</inputs>

<requirements>
1. Choose a migration approach (plain SQL files plus a small runner, or a lightweight library). Justify the choice in the PR in two or three sentences. Prefer few dependencies.
2. Tables, at least, per §4.2:
   - `objects` — `norad_id BIGINT PRIMARY KEY` (no 5-digit assumption), name, object_type, owner, launch_date, launch_site, rcs, decay_date, first_seen, last_seen, plus the raw SATCAT record as JSONB.
   - `elsets` — id, norad_id (FK), epoch (timestamptz), omm (JSONB, exactly as received), source, ingested_at, leaf_hash, epoch_run_id (FK, nullable until committed). **Unique `(norad_id, epoch, source)`.**
   - `epochs` — run_id, created_at, kind (`live` | `backfill`), root, leaf_count, prev_root, signature, key_id, source_status JSONB.
   - `events` — per §6: id, norad_id, type, detected_at, window, evidence (elset ids), metrics JSONB, detector_version.
   - `explanations` — keyed either by event or by `(norad_id, question_id, data_version)`; stores model id, prompt version, text, citations JSONB.
   - `overlay` — norad_id PK, story, category, flags JSONB, updated_at.
3. Indexes for the read paths in §8: latest elset per object, history by `(norad_id, epoch)`, events by `(type, detected_at)` and `(norad_id)`.
4. A small DB module (`src/db.js` or similar) exposing a pool and a transaction helper. No ORM.
5. `npm run migrate` (apply pending) and `npm run migrate:status`. Migrations are forward-only and idempotent to re-run.
6. Tests that run all migrations on an empty database and assert the uniqueness and FK constraints actually reject bad rows.
</requirements>

<constraints>
- Do not connect to, read from or write to the production database.
- Do not add the database to the running app's request path yet; later WPs do that.
- Migrations must not run automatically on deploy.
</constraints>

<acceptance>
- Fresh database → `npm run migrate` → `npm run migrate:status` shows all applied; running `migrate` again is a no-op.
- Duplicate `(norad_id, epoch, source)` insert is rejected; elset with unknown `norad_id` is rejected.
- Non-vacuity: drop the unique constraint in a scratch migration → the duplicate test fails → restore.
- CI runs the schema tests.
</acceptance>

<stop_and_ask>
- Any column type or key choice the spec leaves ambiguous and that would be costly to change later — report options, wait.
- Before applying anything to the Railway production database (that is the maintainer's step, with explicit approval).
</stop_and_ask>

<out_of_scope>
Ingestion, hashing, API endpoints, frontend. Do not modify `src/pipeline.js` behaviour.
</out_of_scope>

<deliverable>
One signed, unmerged PR: migrations, runner, DB module, tests, CI step, and the PR description from `CLAUDE.md`. Include the exact command the maintainer runs to apply migrations to production once approved.
</deliverable>
