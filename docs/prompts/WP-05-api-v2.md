# WP-05 — Public API v2

<context>
The registry's data now lives in Postgres (WP-01..04). This WP exposes it through the documented, read-only public API that the globe (WP-06) and downstream consumers use (SPEC-0001 G7, D3).
Read first: SPEC-0001 §3 (attribution), §3.1, §5 (proofs), §8. Read `CLAUDE.md`.
</context>

<objective>
Implement the §8 v2 endpoints (except Phase 3 Q&A endpoints) with caching, rate limiting, citations and a published API description.
</objective>

<inputs>
- WP-01 DB module; WP-04 proof function.
- Existing Express app in `src/server.js`.
</inputs>

<requirements>
1. Endpoints: `/api/v2/elements`, `/objects/:norad`, `/objects/:norad/history?from&to`, `/objects/:norad/proof?epoch`, `/epochs`, `/epochs/:run_id`, `/registry-key`. `/events` returns an empty list with a `phase: 2` note until analytics exist.
2. `/elements`: current element set per object per the §3 source-of-truth rule, OMM JSON, served from a precomputed snapshot refreshed by the worker (not a per-request full-table query); strong ETag; gzip/brotli; `Cache-Control` aligned to the ingest cadence.
3. Every response carries a `citation` field (USSPACECOM / Space-Track.org; CelesTrak where applicable) per §3.1; `/elements` also sets it in a response header.
4. Input validation: `norad` is a positive integer of any length; date ranges bounded (max range documented); pagination on history and epochs.
5. Per-IP rate limiting with documented limits; 429 with `Retry-After`.
6. An OpenAPI document at `/api/v2/openapi.json` and a short `docs/api.md`.
7. v1 endpoints stay working; mark them deprecated in responses (header). Removal is WP-06's follow-up, not this WP.
8. The SPA catch-all keeps returning 404 for extension paths (PR #1 behaviour).
</requirements>

<constraints>
- Read-only. No endpoint writes to the database.
- No collision or conjunction claims anywhere in responses (§3.1).
</constraints>

<acceptance>
- Contract tests against a seeded test DB for every endpoint, including 6-digit catalog numbers.
- `/elements` for a seeded 30k-object snapshot: response size and time reported in the PR; second request with ETag → 304.
- A proof fetched from the API verifies with `scripts/verify-proof.js`.
- Invalid `norad` → 400; unknown → 404; rate limit → 429.
- Non-vacuity probes: citation missing, ETag check removed, validation removed — each breaks a test.
</acceptance>

<stop_and_ask>
- Any response shape not determined by §8 that downstream consumers will depend on — propose it in the PR description first.
</stop_and_ask>

<out_of_scope>
Frontend (WP-06), overlay data in responses (WP-08 adds it), Phase 3 Q&A endpoints.
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`.
</deliverable>
