# WP-03 — Space-Track ingestion (debris and rocket bodies)

<context>
CelesTrak only publishes three historical debris groups; full coverage of debris and rocket bodies (SPEC-0001 D1) comes from Space-Track.org, which requires an account and has strict usage rules and citation requirements (D5).
Read first: SPEC-0001 §3, §3.1, §4.3. Read `CLAUDE.md`. Read Space-Track's public documentation for the `gp` class, query syntax and limits, and cite what you check.
</context>

<objective>
Add Space-Track as an ingest source: one combined `gp` query per run for all on-orbit, propagable objects, merged with CelesTrak data under the source-of-truth rule, within published limits.
</objective>

<inputs>
- WP-01 schema; WP-02 worker structure (follow its patterns for etiquette and status).
- Credentials via environment variables only (`SPACETRACK_USER`, `SPACETRACK_PASS`). In tests, stubbed.
</inputs>

<requirements>
1. Authenticated session handling per Space-Track docs (login, reuse the session cookie, log out or let it expire as documented).
2. One `gp` query per run returning all on-orbit, propagable objects in OMM JSON; scheduled hourly at most, at a random minute fixed per deployment (not :00 or :30).
3. Request budget enforced in code: < 30 requests/min and < 300/hour, counting login. A unit test asserts a run uses ≤ 3 requests.
4. Store with `source = 'spacetrack'`; source-of-truth rule from §3: newer `EPOCH` wins, ties go to Space-Track, for the "current elements" snapshot. History keeps both.
5. On auth failure or non-200: stop the source for this run, no retry loop, record status.
6. Citation string for USSPACECOM / Space-Track data available to the API layer (constant or config), per §3.1.
</requirements>

<constraints>
- Credentials never logged, never in error messages, never committed. Redact in any debug output.
- No per-object queries. No `GP_HISTORY` here (that's WP-07).
- Tests never contact Space-Track.
</constraints>

<acceptance>
- Stubbed run: ≤ 3 requests, debris and rocket-body fixtures land in `elsets`/`objects`.
- Rate limiter: a forced burst is throttled below 30/min (test with fake timers).
- Credential redaction: an auth error's message and logs contain no password (test).
- Non-vacuity probes: rate limiter, redaction, no-retry, source-of-truth tie-break.
</acceptance>

<stop_and_ask>
- Account and credentials: the maintainer creates/owns the account and installs the sealed variables. Do not ask for, receive or handle the password in the session.
- If Space-Track's current documentation differs from SPEC-0001 §3/§3.1 — report before building.
</stop_and_ask>

<out_of_scope>
Backfill (WP-07), Merkle (WP-04), API, frontend.
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`, listing the exact Railway variables the maintainer must add.
</deliverable>
