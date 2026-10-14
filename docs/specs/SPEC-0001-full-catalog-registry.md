# SPEC-0001 — Full-catalog registry, trajectory history and per-epoch TrIP

| | |
|---|---|
| **Status** | Draft — for review. No implementation until this is merged. |
| **Date** | 2026-10-14 (decisions D4–D9 added 2026-10-15) |
| **Author** | Camilo Ayerbe Posada (drafted with Claude) |
| **Repo** | `GNS-Foundation/orbital-trip` (public registry, AGPL-3.0) |

## 0. Decisions recorded (2026-10-14)

| # | Question | Decision |
|---|---|---|
| D1 | Scope | **Everything tracked**: payloads, rocket bodies, debris — not just active payloads. |
| D2 | TrIP model | **Per-epoch Merkle commitment** replaces per-position Ed25519 signatures. More coherent with the TrIP protocol. |
| D3 | Placement (ADR-0005) | The open registry, history, analytics, AI explanations and public API live here. Products built on top of the registry consume its public API and live outside this repository. |

**Decisions recorded (2026-10-15)**

| # | Question | Decision |
|---|---|---|
| D4 | Postgres host | **Railway Postgres**, in the existing `orbital-trip` project. |
| D5 | Space-Track terms | Republishing is covered: element sets (TLE/OMM), SATCAT and decay/reentry data are "basic SSA data" under a blanket redistribution approval conditioned on citation, and derived analysis also requires citation (Space-Track documentation, Basic Services). Anything beyond basic SSA data — e.g. conjunction data messages — needs an Orbital Data Request and is **out of scope**. See §3.1. |
| D6 | Registry signing key | **Approved.** Generated and handled per §5.1. |
| D7 | Frontend | **3D globe (WebGL)** replaces the 2D canvas map, in Phase 1. See §4.4. |
| D8 | History backfill | **Yes.** One-time backfill from Space-Track's bulk historical files. Default depth 12 months, configurable (§4.5). |
| D9 | Curated catalog | **Keep and expand** it as an editorial overlay on the full catalog, and add a per-satellite AI Q&A: preset questions per object first, free questions later (§7.1). |

## 1. Context

Orbital TrIP v1 tracks a hand-curated catalog of 261 objects. Every 3 hours it propagates 72 h of positions at 30-minute steps per object, signs each position with Ed25519, and writes one JSON file the browser loads whole.

Measured on production, 2026-10-14:

- 179 objects → pipeline 110 s, output 1.2 MB (~7 KB/object).
- CelesTrak `GROUP=active` alone holds **15,931 objects**; the full tracked population with debris and rocket bodies is larger.

Linear extrapolation to ~16k objects: **~2.7 h per run and ~110 MB of JSON** — not viable. The architecture has to change before the catalog grows.

### 1.1 Corrections to the current implementation (visible, not silent)

1. **TLE format can no longer see new objects.** CelesTrak documents that the 5-digit catalog-number range was exhausted in July 2026; new objects carry 6-digit numbers and are published **only in OMM formats** (CSV/JSON/XML). PR #1 (merged 2026-10-14) still requests `FORMAT=tle`, so any object cataloged since July 2026 is invisible to the registry. This spec moves all ingestion to OMM.
2. **TrIP keys do not survive restarts.** `KEY_STORE` in `src/pipeline.js` generates a fresh Ed25519 keypair per object per process, so chains from before a restart cannot be verified after it. The per-epoch model (§5) uses one persistent registry key.

## 2. Goals and non-goals

**Goals**

- G1. Every tracked object in Earth orbit, including debris and rocket bodies, with current orbital elements.
- G2. Per-object metadata: launch date, launch site, owner/country, object type, radar cross-section, decay date.
- G3. Durable **history** of every element set ingested, so trajectory behaviour can be analysed over time.
- G4. Verifiable integrity: anyone can prove that a given element set was in the registry at a given epoch.
- G5. Deterministic trajectory analytics (manoeuvres, drift, decay) emitted as auditable events.
- G6. An AI layer that **explains** computed events in plain language — never invents them.
- G7. A documented public API that downstream consumers can build on.

**Non-goals**

- Producing our own orbit determination or conjunction screening (we ingest published data).
- Commercial or customer-facing product features (see D3). The existing `insured` overlay flag is retained as data; features specific to it are built outside this repository.
- Conjunction assessment or collision predictions (§3.1).
- Real-time (< 2 h) freshness — upstream sources update about every 2 h at best.

## 3. Data sources

All ingestion uses **OMM** records (CCSDS Orbit Mean-Elements Message keywords), never TLE text.

| Source | What | Cadence | Rules we must follow |
|---|---|---|---|
| **CelesTrak GP** `gp.php?GROUP=active&FORMAT=json` (or CSV) | Current elements, active payloads | Every 2 h (upstream update rate) | One download per update is enforced; repeat requests before the next update return HTTP 403. On any non-200, stop and alert — do not retry (excessive errors lead to IP blocks). Use the `.org` domain. |
| **CelesTrak SATCAT** | Launch date, site, owner, object type, RCS, decay date, orbit summary — whole catalog including decayed objects | Daily | Same etiquette. |
| **Space-Track.org** `class/gp` (on-orbit, propagable, all object types) | Debris and rocket bodies (CelesTrak publishes only three historical debris groups) | Hourly at most, at a random minute (not :00/:30), as **one** combined query | Requires an account. Limits: < 30 requests/min and < 300 requests/hour. No per-object queries. `GP_HISTORY` is for one-time backfill only, never for current data; large ranges use Space-Track's yearly bulk files, not the API. Redistribution: see §3.1. |
| **CelesTrak SOCRATES** *(Phase 2+, optional)* | Published close-approach predictions | Per upstream schedule | Ingest; do not recompute. |

**Source of truth per object.** For an object present in both, the newer `EPOCH` wins; ties go to Space-Track. Each stored element set records its `source`.

**Attribution.** The UI footer and API responses carry citations for CelesTrak and USSPACECOM/Space-Track data.

### 3.1 Redistribution terms (D5)

Checked 2026-10-15 against Space-Track's published documentation; terms may change without notice, so re-check before each phase ships.

- The User Agreement forbids transferring data without prior express approval. The Basic Services section grants that approval as a **blanket approval for basic SSA data**, defined as TLEs, OMMs, SATCAT, and decay/reentry data, **conditioned on appropriate citation**. Analysis based on that data also requires citation.
- Everything this spec republishes (element sets, SATCAT fields, derived events and explanations) is basic SSA data or analysis of it. Every API response and the UI therefore carry a citation to USSPACECOM / Space-Track.org (and CelesTrak where it is the source).
- Redistribution beyond basic data requires an Orbital Data Request. Conjunction data messages and other advanced services are out of scope.
- Space-Track states that publicly available TLEs should not be used for conjunction assessment. The registry and its AI layer **must not present collision predictions**. SOCRATES data, if ingested, is shown as CelesTrak's published product with its attribution, not as our assessment.
- Accounts are personal and non-transferable. The registry's Space-Track credentials belong to one named account holder and are stored only as a deployment secret.

## 4. Architecture

```
┌──────────────┐  OMM / SATCAT   ┌──────────────────┐   SQL    ┌───────────────┐
│ CelesTrak    │───────────────▶│ ingest worker    │────────▶│ Postgres      │
│ Space-Track  │                │ (cron, Node)     │         │ elsets, sats, │
└──────────────┘                │  • dedupe epochs │         │ epochs, events│
                                │  • Merkle commit │         └──────┬────────┘
                                │  • analytics (P2)│                │
                                └──────────────────┘                │
                                                                    ▼
┌────────────────────────────┐  current elsets (~MBs)   ┌──────────────────┐
│ browser                    │◀────────────────────────│ API (Express)    │
│  • satellite.js json2satrec│  history / proofs / ev.  │  read-only       │
│  • propagation in a Worker │◀────────────────────────│                  │
└────────────────────────────┘                          └──────────────────┘
```

### 4.1 Client-side propagation

The server ships **elements, not positions**. The browser builds `satrec`s with `satellite.js` `json2satrec` (already a dependency, v6.0.2) and propagates in a Web Worker at ~1 Hz. Expected payload: a few MB for ~16k objects; scales linearly with the catalog.

### 4.2 Storage

Railway Postgres (D4). Schema changes ship as versioned migrations; applying one to the deployed database requires explicit maintainer approval. Core tables:

- `objects` — `norad_id` (int, no 5-digit assumption), name, object type, owner, launch date/site, RCS, decay date, `first_seen`, `last_seen`.
- `elsets` — one row per **distinct** `(norad_id, epoch, source)`: full OMM JSON, `source`, `ingested_at`, `leaf_hash`. Duplicate epochs are not re-inserted.
- `epochs` — one row per ingest run: `run_id`, time, Merkle root, signature, counts, source status.
- `events` — analytics output (§6).
- `explanations` — AI output (§7), keyed by event or by `(norad_id, question_id, data_version)`.
- `overlay` — the curated editorial layer (D9): per-object stories, categories and flags migrated from `src/catalog.js`, plus new entries. Keyed by `norad_id`; never overwritten by ingestion.

Sizing (estimate — to be measured in Phase 1): if each tracked object gets 1–3 new element sets per day, history grows by tens of thousands of rows/day and a few GB/year. Raw-OMM storage can be compacted after N days by keeping only the numeric fields used by analytics.

### 4.3 Ingest worker

Runs on a schedule matched to upstream cadence: CelesTrak every 2 h; Space-Track hourly at a random minute; SATCAT daily. Each run:

1. Fetch (one request per source), stop on any non-200.
2. Parse OMM, validate, dedupe against stored epochs.
3. Insert new element sets; compute leaf hashes.
4. Build and sign the epoch Merkle root (§5).
5. Refresh the "current elements" snapshot served to browsers.
6. (Phase 2) run analytics on objects with new element sets.

The PR #1 safeguards carry over: never publish a snapshot that is empty or much smaller than the previous one; keep the last good snapshot when upstream fails.

### 4.4 3D globe (D7)

WebGL globe replacing the 2D canvas map. Requirements, not a library choice: the implementing work package picks the library and justifies it against these.

- Renders the full catalog (≥ 30k points) at interactive frame rates on a mid-range laptop; positions update at ~1 Hz from the propagation Worker.
- Colour and filter by object type, orbit regime, owner and launch year; overlay objects (D9) visually distinguished.
- Click/tap picking opens the object panel: metadata, latest elements, ground track and orbit path, recent events, and the Q&A (§7.1).
- Degrades gracefully: if WebGL is unavailable, show a message and the searchable list, not a blank page.
- Assets are self-hosted. No third-party imagery or token-gated services in the default build.

### 4.5 History backfill (D8)

One-time load from Space-Track's bulk historical element files (not the `GP_HISTORY` API) so analytics can start without waiting weeks.

- Default depth 12 months; configurable. The import is idempotent and dedupes on `(norad_id, epoch, source)`.
- Backfilled element sets are committed into a single **backfill epoch** per source file, marked as such, so the Merkle chain records that they were imported after the fact rather than observed live.
- Runs as an operator-triggered job, never on deploy. Writing it to the production database requires explicit maintainer approval.

## 5. TrIP — per-epoch Merkle commitment

Replaces per-position signatures (D2).

- **Leaf** = `SHA-256( canonical_json(OMM record) )`. Canonical JSON uses sorted keys and no insignificant whitespace; numbers are emitted exactly as received from the source, never reformatted.
- **Tree** = binary Merkle tree over leaves sorted by `(norad_id, epoch, source)` (the same epoch can arrive from both sources); an odd node is promoted unchanged. Domain separation: leaf `0x00 || data`, inner node `0x01 || left || right`.
- **Epoch record** = `{ run_id, created_at, kind, root, leaf_count, prev_root }`, where `kind` is `live` or `backfill` (§4.5). Chaining `prev_root` makes the registry history itself a breadcrumb chain.
- **Signature** = Ed25519 over the canonical epoch record by one **persistent registry key**.
- **Proof** = for any element set, the API returns the leaf, sibling path and signed epoch record; verification needs only the registry public key.

Cost: one signature per run regardless of catalog size, versus ~26k per run today (179 objects × 145 positions).

### 5.1 Registry key handling (D6)

- Generation is approved (D6). The key is generated by a script the maintainer runs locally (`scripts/registry-key.js generate`). The script prints the public key and writes the private key only to a local file the maintainer moves into a **sealed** Railway variable. The private key never passes through a chat, a log, the repository or a CI run.
- At runtime the key is read only from that variable; the process refuses to sign with a key whose public half does not match the published `registry-key` record.
- Rotation and any other new key material require fresh explicit approval. Rotation publishes a signed handover record (old key signs the new public key).

## 6. Trajectory analytics (Phase 2)

Deterministic, reproducible from stored history. Each detector emits an **event**: `{ id, norad_id, type, detected_at, window, evidence: [elset ids], metrics, detector_version }`. Thresholds start conservative and are calibrated against known cases before being published.

| Event type | Signal (between successive element sets) |
|---|---|
| `manoeuvre` | Step change in mean motion, inclination or eccentricity beyond expected drag/perturbation noise for that orbit regime |
| `station_keeping_stopped` | GEO object whose longitude drift exceeds its historical box and shows no corrective manoeuvre within N days |
| `slot_change` | GEO object relocated to a new longitude and stabilised |
| `orbit_raising` / `deorbit` | Sustained one-direction change in semi-major axis / perigee |
| `decay_trend` | Rising drag term (B*) with falling perigee; flags likely re-entry window |
| `new_object` / `decayed` | First appearance / decay date set in SATCAT |
| `anomalous_behaviour` | Behaviour inconsistent with the object's own history or its constellation siblings |

Each detector ships with a test that fails when its guard is removed (non-vacuity).

## 7. AI layer (Phase 3)

The model **explains facts the registry already holds; it does not analyse raw numbers, create events, or answer from general knowledge as if it were registry data**.

### 7.1 Per-satellite Q&A (D9)

Clicking an object on the globe offers a set of **preset questions**. Each preset question maps to a deterministic **evidence bundle** assembled from registry data, and the model only writes prose over that bundle.

| Preset question (examples) | Evidence bundle |
|---|---|
| What is this object and who operates it? | SATCAT fields, overlay story |
| How old is it, and is it still active? | Launch date, decay date, last manoeuvre event, object type |
| What orbit is it in? | Derived from latest elements: regime, altitude range, period, inclination |
| What has it done recently? | Events in the last 30/90 days with evidence |
| Is it behaving normally? | Events + the object's own historical manoeuvre cadence |

- Evidence bundles are computed by deterministic code with tests. The model receives the bundle and nothing else, and every factual sentence in the answer cites a bundle field or event ID. An answer citing anything outside the bundle is a defect, caught by an automated check before caching.
- Answers are generated on first request, cached per `(norad_id, question_id, data_version)`, and regenerated only when the bundle changes. A satellite nobody clicks costs nothing.
- If the bundle lacks the data to answer (no events yet, no overlay story), the answer says so. It does not fill gaps from general knowledge.
- **Free questions** (later in Phase 3) use the same grounding: scoped to one object's bundle plus its history, with the same citation check, and declining anything the bundle cannot support.
- The overlay story is editorial content and is labelled as such, distinct from data-derived statements.

### 7.2 Event explanations and registry-wide queries

- Input: one or more events with their evidence plus object metadata. Nothing else.
- Output: a short plain-language explanation that **cites event IDs**. A claim not traceable to a cited event is a defect.
- Generated only when new events exist, then cached in `explanations` with model id and prompt version. Regenerated only if the event or prompt version changes.
- Public surfaces: per-object "what changed recently" summaries; a natural-language query box that compiles to **read-only, parameterised** SQL over a whitelisted view, shows the generated query, and returns rows (not prose) as the primary answer.
- Cost control: hard daily budget; no generation for objects without events.
- The model API key is a deployment secret; adding it requires explicit maintainer approval.

## 8. Public API (v2)

| Endpoint | Returns |
|---|---|
| `GET /api/v2/elements` | Current element set per object (OMM JSON), ETag + cache headers |
| `GET /api/v2/objects/:norad` | Metadata + latest elements + recent events |
| `GET /api/v2/objects/:norad/history?from&to` | Stored element sets |
| `GET /api/v2/objects/:norad/proof?epoch` | Merkle proof + signed epoch record |
| `GET /api/v2/epochs[/:run_id]` | Signed epoch records |
| `GET /api/v2/events?type&since&norad` | Analytics events (Phase 2) |
| `GET /api/v2/registry-key` | Registry public key(s) and rotation records |
| `GET /api/v2/objects/:norad/questions` | Preset questions available for the object (Phase 3) |
| `POST /api/v2/objects/:norad/ask` | Answer to a preset (later: free) question, with citations and the evidence bundle version (Phase 3; rate-limited) |

v1 endpoints stay until the frontend migrates, then return `410` with a pointer to v2. Rate limiting applies per IP.

## 9. Phasing and acceptance

Work is broken into work packages (WPs), each built in its own Claude Code session from a structured prompt in [`docs/prompts/`](../prompts/README.md), one PR per WP.

**Phase 1 — Full catalog, history, per-epoch TrIP, globe**
- WP-01 Postgres schema and migrations (§4.2).
- WP-02 CelesTrak ingestion: OMM active group + SATCAT (§3, §4.3).
- WP-03 Space-Track ingestion: all on-orbit objects (§3, §3.1).
- WP-04 Merkle commitment, registry key, proofs, independent verifier (§5).
- WP-05 Public API v2 (§8).
- WP-06 3D globe with Worker propagation (§4.1, §4.4).
- WP-07 History backfill (§4.5).
- WP-08 Overlay: migrate `src/catalog.js` into `overlay` and serve it (D9).
- *Accept when:* objects with 6-digit catalog numbers appear; a proof for a random element set verifies with an independent script; a forced upstream failure keeps the last snapshot; request counts per source stay within §3 limits (logged and asserted in tests); the globe renders the full catalog per §4.4.

**Phase 2 — Analytics**
- Detectors of §6 with calibration notes; `events` API; event markers on the globe.
- *Accept when:* each detector is validated against known historical cases and passes non-vacuity probes.

**Phase 3 — AI layer**
- 3a Per-satellite preset Q&A (§7.1). Depends on Phase 1 only, so it can start before Phase 2 finishes; questions that need events answer "no events yet" until Phase 2 lands.
- 3b Event explanations (§7.2).
- 3c Free questions and registry-wide queries (§7.1, §7.2).
- *Accept when:* every answer cites only fields or event IDs present in its bundle (automated check); answers decline what the bundle cannot support; the query box rejects writes and non-whitelisted relations.

Prompts for Phases 2 and 3 are written after Phase 1 lands, because they depend on what Phase 1 actually stores.

The backfill (WP-07) removes the wait for history before Phase 2.

## 10. Open items

Resolved 2026-10-15: host (D4), Space-Track terms (D5), signing key (D6), frontend (D7), backfill (D8), curated catalog (D9).

Still needed from the maintainer, each at the WP that needs it:

1. **Space-Track account** (WP-03, WP-07): the named account holder, and approval to store its credentials as a sealed Railway variable.
2. **Backfill depth** (WP-07): confirm the 12-month default or set another.
3. **Model API key and daily budget** (Phase 3).
4. **Production gates** (each WP): applying migrations, running the backfill, and installing the registry key on the deployed service each need explicit approval at the time.

## References

- CelesTrak — GP data formats, catalog-number exhaustion, download etiquette: https://celestrak.org/NORAD/documentation/gp-data-formats.php
- CelesTrak — GP groups: https://celestrak.org/NORAD/elements/
- CelesTrak — SATCAT format: https://celestrak.org/satcat/satcat-format.php
- Space-Track.org — documentation, rate limits, User Agreement, Basic Services (redistribution of basic SSA data): https://www.space-track.org/documentation
