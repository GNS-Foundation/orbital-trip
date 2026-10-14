# SPEC-0001 — Full-catalog registry, trajectory history and per-epoch TrIP

| | |
|---|---|
| **Status** | Draft — for review. No implementation until this is merged. |
| **Date** | 2026-10-14 |
| **Author** | Camilo Ayerbe Posada (drafted with Claude) |
| **Repo** | `GNS-Foundation/orbital-trip` (public registry, AGPL-3.0) |

## 0. Decisions recorded (2026-10-14)

| # | Question | Decision |
|---|---|---|
| D1 | Scope | **Everything tracked**: payloads, rocket bodies, debris — not just active payloads. |
| D2 | TrIP model | **Per-epoch Merkle commitment** replaces per-position Ed25519 signatures. More coherent with the TrIP protocol. |
| D3 | Placement (ADR-0005) | The open registry, history, analytics, AI explanations and public API live here. Products built on top of the registry consume its public API and live outside this repository. |

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
- Commercial or customer-facing product features (see D3).
- Real-time (< 2 h) freshness — upstream sources update about every 2 h at best.

## 3. Data sources

All ingestion uses **OMM** records (CCSDS Orbit Mean-Elements Message keywords), never TLE text.

| Source | What | Cadence | Rules we must follow |
|---|---|---|---|
| **CelesTrak GP** `gp.php?GROUP=active&FORMAT=json` (or CSV) | Current elements, active payloads | Every 2 h (upstream update rate) | One download per update is enforced; repeat requests before the next update return HTTP 403. On any non-200, stop and alert — do not retry (excessive errors lead to IP blocks). Use the `.org` domain. |
| **CelesTrak SATCAT** | Launch date, site, owner, object type, RCS, decay date, orbit summary — whole catalog including decayed objects | Daily | Same etiquette. |
| **Space-Track.org** `class/gp` (on-orbit, propagable, all object types) | Debris and rocket bodies (CelesTrak publishes only three historical debris groups) | Hourly at most, at a random minute (not :00/:30), as **one** combined query | Requires an account. Limits: < 30 requests/min and < 300 requests/hour. No per-object queries. `GP_HISTORY` is for one-time backfill only, never for current data. Redistribution: blanket approval for basic SSA data **with citation**; derived analysis also requires citation. |
| **CelesTrak SOCRATES** *(Phase 2+, optional)* | Published close-approach predictions | Per upstream schedule | Ingest; do not recompute. |

**Source of truth per object.** For an object present in both, the newer `EPOCH` wins; ties go to Space-Track. Each stored element set records its `source`.

**Attribution.** The UI footer and API responses carry citations for CelesTrak and USSPACECOM/Space-Track data.

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

The server ships **elements, not positions**. The browser builds `satrec`s with `satellite.js` `json2satrec` (already a dependency, v6.0.2) and propagates in a Web Worker at ~1 Hz. Expected payload: a few MB for ~16k objects; scales linearly with the catalog. The current 2D canvas map is kept for Phase 1; a WebGL globe is an open question (§10).

### 4.2 Storage

Postgres (provider decided in §10). Core tables:

- `objects` — `norad_id` (int, no 5-digit assumption), name, object type, owner, launch date/site, RCS, decay date, `first_seen`, `last_seen`.
- `elsets` — one row per **distinct** `(norad_id, epoch)`: full OMM JSON, `source`, `ingested_at`, `leaf_hash`. Duplicate epochs are not re-inserted.
- `epochs` — one row per ingest run: `run_id`, time, Merkle root, signature, counts, source status.
- `events` — analytics output (§6).
- `explanations` — AI output (§7), keyed by event.

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

## 5. TrIP — per-epoch Merkle commitment

Replaces per-position signatures (D2).

- **Leaf** = `SHA-256( canonical_json(OMM record) )`. Canonical JSON uses sorted keys and no insignificant whitespace; numbers are emitted exactly as received from the source, never reformatted.
- **Tree** = binary Merkle tree over leaves sorted by `(norad_id, epoch)`; an odd node is promoted unchanged. Domain separation: leaf `0x00 || data`, inner node `0x01 || left || right`.
- **Epoch record** = `{ run_id, created_at, root, leaf_count, prev_root }`. Chaining `prev_root` makes the registry history itself a breadcrumb chain.
- **Signature** = Ed25519 over the canonical epoch record by one **persistent registry key**.
- **Proof** = for any element set, the API returns the leaf, sibling path and signed epoch record; verification needs only the registry public key.

Cost: one signature per run regardless of catalog size, versus ~26k per run today (179 objects × 145 positions).

Key handling: the private key lives in a deployment secret and never in the repo, logs or API. Creating, rotating or loading key material requires explicit maintainer approval. Rotation publishes a signed handover record (old key signs new public key).

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

## 7. AI explanation layer (Phase 3)

The model **explains computed events; it does not analyse raw numbers or create events**.

- Input: one or more events with their evidence plus object metadata. Nothing else.
- Output: a short plain-language explanation that **cites event IDs**. A claim not traceable to a cited event is a defect.
- Generated only when new events exist, then cached in `explanations` with model id and prompt version. Regenerated only if the event or prompt version changes.
- Public surfaces: per-object "what changed recently" summaries; a natural-language query box that compiles to **read-only, parameterised** SQL over a whitelisted view, shows the generated query, and returns rows (not prose) as the primary answer.
- Cost control: hard daily budget; no generation for objects without events.

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

v1 endpoints stay until the frontend migrates, then return `410` with a pointer to v2. Rate limiting applies per IP.

## 9. Phasing and acceptance

**Phase 1 — Full catalog + history + per-epoch TrIP**
- OMM ingestion from CelesTrak (active + SATCAT) and Space-Track (all on-orbit); dedupe; Postgres schema of §4.2.
- Merkle commitment and proof endpoint; persistent registry key (after approval).
- Browser propagation from `/api/v2/elements`; map renders the whole catalog with filters for object type, owner and launch year.
- *Accept when:* objects with 6-digit catalog numbers appear; a proof for a random element set verifies with an independent script; a forced upstream failure keeps the last snapshot; request counts per source stay within §3 limits (logged and asserted in tests).

**Phase 2 — Analytics**
- Detectors of §6 with calibration notes; `events` API; event markers in the UI.
- *Accept when:* each detector is validated against known historical cases and passes non-vacuity probes.

**Phase 3 — AI explanations**
- §7 summaries and query box.
- *Accept when:* every explanation cites only existing event IDs (automated check); the query box rejects writes and non-whitelisted relations.

Prerequisite for Phase 2: several weeks of stored history, so **Phase 1 storage should start as early as possible**.

## 10. Open questions (maintainer decisions)

1. **Postgres host**: Supabase vs Railway Postgres, given the history growth in §4.2.
2. **Space-Track account and terms**: who owns the account; approval to store its credentials as a deployment secret; and confirmation, against the full User Agreement, that republishing element sets and derived analysis under the "basic SSA data" blanket approval is permitted (the public documentation page states both a no-transfer clause and the blanket approval without spelling out how they interact).
3. **Registry signing key**: approval to generate the persistent key, where it is stored, rotation policy.
4. **Frontend**: keep the 2D canvas, or move to a WebGL globe once the full catalog is in?
5. **History backfill**: one-time `GP_HISTORY` bulk backfill (Space-Track yearly files) so analytics don't wait weeks — yes/no, and how far back?
6. **The existing curated catalog** (stories, categories, `insured` flags in `src/catalog.js`): keep it as an overlay on the full catalog, or retire it?

## References

- CelesTrak — GP data formats, catalog-number exhaustion, download etiquette: https://celestrak.org/NORAD/documentation/gp-data-formats.php
- CelesTrak — GP groups: https://celestrak.org/NORAD/elements/
- CelesTrak — SATCAT format: https://celestrak.org/satcat/satcat-format.php
- Space-Track.org — documentation, rate limits, user agreement: https://www.space-track.org/documentation
