# WP-07 — History backfill

<context>
Phase 2 analytics need weeks of history. SPEC-0001 D8 approves a one-time backfill from Space-Track's bulk historical files, default depth 12 months, committed as `backfill`-kind epochs so the chain shows it was imported after the fact.
Read first: SPEC-0001 §3, §3.1, §4.5, §5 (`kind`). Read `CLAUDE.md`. Read Space-Track's documentation on bulk historical files and cite what you check.
</context>

<objective>
An operator-triggered, idempotent import of historical element sets into `elsets`, committed into backfill epochs, with progress, resumability and a dry-run mode.
</objective>

<inputs>
- WP-01 schema, WP-03 Space-Track session handling, WP-04 commit step (`kind = 'backfill'`).
- Bulk files obtained per Space-Track documentation. If they must be downloaded by the account holder manually, the script takes local file paths.
</inputs>

<requirements>
1. `npm run backfill -- --from YYYY-MM-DD --to YYYY-MM-DD [--files ...] [--dry-run]`; default `--from` = 12 months ago.
2. Streaming parse (files are large); bounded memory; batch inserts in transactions.
3. Idempotent: re-running over the same range inserts nothing new; resumable after interruption (checkpoint per file).
4. One `backfill` epoch per source file (§4.5); never mixed with live epochs.
5. Dry run: counts per year, per object type, estimated rows and storage, no writes.
6. Respect Space-Track rules: no `GP_HISTORY` API loops for bulk ranges.
</requirements>

<constraints>
- Never runs on deploy or on a schedule.
- Tests use small synthetic fixtures; no real downloads in CI.
</constraints>

<acceptance>
- Fixture import → expected row counts; re-run → 0 new rows; interrupt mid-file and resume → same final state.
- Backfill epochs verify with `scripts/verify-proof.js` and are marked `kind = 'backfill'`.
- Dry run on fixtures reports counts and makes 0 writes (asserted).
- Non-vacuity probes: idempotency key, checkpoint, `kind` marking.
</acceptance>

<stop_and_ask>
- Depth: confirm the 12-month default with the maintainer before the production run.
- Before running against production: present the dry-run report (rows, storage estimate vs Railway Postgres capacity) and wait for explicit approval.
- If bulk files require the account holder to download them manually, say so and stop at the instructions.
</stop_and_ask>

<out_of_scope>
Analytics, API changes beyond what already exists.
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`, including the dry-run output on fixtures and the exact production procedure for the maintainer.
</deliverable>
