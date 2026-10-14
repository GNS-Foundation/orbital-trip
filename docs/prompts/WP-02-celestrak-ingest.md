# WP-02 — CelesTrak OMM + SATCAT ingestion

<context>
The current pipeline (`src/pipeline.js`) fetches TLE text for a curated list. TLE can no longer carry the 6-digit catalog numbers assigned since July 2026 (SPEC-0001 §1.1). This WP builds the ingest worker for CelesTrak in OMM, writing to the WP-01 schema.
Read first: SPEC-0001 §1.1, §3 (CelesTrak rows and etiquette), §4.2, §4.3. Read `CLAUDE.md`. Read the PR #1 safeguards in `src/pipeline.js` (bulk fetch, cache, output guard) — they carry over.
</context>

<objective>
A scheduled ingest worker that pulls CelesTrak's active group (OMM JSON or CSV) every ~2 h and SATCAT daily, dedupes, and stores new element sets and object metadata in Postgres, with request etiquette enforced by tests.
</objective>

<inputs>
- WP-01 schema and DB module.
- CelesTrak documentation: GP data formats and SATCAT format pages (cite what you check).
- `satellite.js` v6 (`json2satrec`) to validate that each OMM record is propagable.
</inputs>

<requirements>
1. Fetch `GROUP=active` in OMM (JSON or CSV — pick one, justify, and handle numeric precision without reformatting values used for hashing later).
2. Fetch SATCAT (daily) and upsert `objects` (launch date/site, owner, type, RCS, decay date, raw record).
3. Validate each OMM record: required keywords present, propagable via `json2satrec`, catalog number parsed as an integer of any length.
4. Insert only new `(norad_id, epoch, source)` rows into `elsets`; store the OMM record exactly as received.
5. Etiquette: one request per group per run; persist the last successful fetch time and skip if < 2 h old; on any non-200 stop that source for the run, record it in run status, and do not retry.
6. Keep the last good "current elements" snapshot if a run fails or returns a much smaller set (port the PR #1 guard: refuse < 50% of previous).
7. Expose run status in `/health` (last run, per-source result, counts).
8. Keep the legacy v1 pipeline working until WP-05/06 replace its consumers; do not delete it.
</requirements>

<constraints>
- No TLE text anywhere in the new path.
- Tests use stubbed HTTP; no real CelesTrak calls in CI or locally during tests.
- Never assume 5-digit catalog numbers (include a 6-digit fixture).
</constraints>

<acceptance>
- Fixture with a 6-digit catalog number is ingested and queryable.
- Second run within 2 h makes 0 requests; a run after 2 h makes exactly 1 GP request (+1 SATCAT if due).
- HTTP 403 / 500 / timeout → 0 retries, snapshot unchanged, status recorded.
- Re-ingesting the same payload inserts 0 rows.
- Non-vacuity probes for: the 2-hour gate, the no-retry rule, the dedupe constraint, the shrink guard.
</acceptance>

<stop_and_ask>
- If CelesTrak documentation contradicts SPEC-0001 §3 (e.g. new limits or endpoints) — report, don't adapt silently.
- Before any run against production.
</stop_and_ask>

<out_of_scope>
Space-Track (WP-03), Merkle commitment (WP-04 — leave `leaf_hash` / `epoch_run_id` null), API (WP-05), frontend.
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`, with a "Corrections" note referencing SPEC-0001 §1.1 (the TLE-format gap in PR #1).
</deliverable>
