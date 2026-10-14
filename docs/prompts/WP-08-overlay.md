# WP-08 — Curated overlay

<context>
`src/catalog.js` holds the hand-curated layer: 261 objects with categories, five stories and `insured` flags. SPEC-0001 D9 keeps and expands it as an editorial overlay on the full catalog, stored in the `overlay` table and later used by the Phase 3 Q&A.
Read first: SPEC-0001 §0 (D3, D9), §2 non-goals (the `insured` flag), §4.2, §7.1. Read `CLAUDE.md`. Read `src/catalog.js` in full.
</context>

<objective>
Move the curated layer into `overlay` with a reviewable source of truth in the repo, serve it through the v2 API, and make adding entries easy.
</objective>

<inputs>
- WP-01 `overlay` table; WP-05 API; `src/catalog.js`.
</inputs>

<requirements>
1. A versioned, human-editable overlay source in the repo (e.g. `overlay/*.json` or YAML at the repo root, one entry per object — not under `data/`, which is gitignored for the runtime TLE cache), validated by a schema; `src/catalog.js` content migrated into it without loss (test that compares counts and fields).
2. Sync step: repo overlay → `overlay` table, idempotent, run by the operator or the worker. Ingestion never overwrites overlay rows.
3. API: `/objects/:norad` includes the overlay entry when present, labelled `editorial`; `/elements` exposes a lightweight overlay flag so the globe can highlight curated objects.
4. Stories are clearly labelled as editorial content, distinct from data-derived fields (§7.1).
5. Contribution guide (`docs/overlay.md`): how to add an object, a category or a story; what makes a good story; the citation rule for any factual claim in a story.
6. The `insured` flag is migrated as-is and exposed as data. Do not add features built on it (D3, §2).
</requirements>

<constraints>
- Overlay entries reference objects by `norad_id` only; an entry for an unknown object is reported, not dropped silently.
</constraints>

<acceptance>
- Migration test: all 261 entries, 5 stories and flags present after sync; second sync is a no-op.
- Ingestion run after sync leaves overlay untouched (test).
- Schema validation rejects a malformed entry (test) — with a non-vacuity probe.
</acceptance>

<stop_and_ask>
- If any curated entry references a catalog number that no longer exists or has decayed, list them and ask how to handle them.
</stop_and_ask>

<out_of_scope>
Q&A (Phase 3), product features using `insured` (outside this repo per ADR-0005).
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`.
</deliverable>
