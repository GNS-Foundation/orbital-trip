# WP-04 — Per-epoch Merkle TrIP and registry key

<context>
SPEC-0001 D2 replaces per-position Ed25519 signatures with one signed Merkle root per ingest run. The current `KEY_STORE` regenerates keys per process, so old chains can't be verified (§1.1). Key generation is approved (D6) under the handling rules of §5.1.
Read first: SPEC-0001 §1.1, §5, §5.1, §4.5 (backfill epochs). Read `CLAUDE.md`.
</context>

<objective>
Commit every ingest run's new element sets into a signed, chained Merkle epoch; produce inclusion proofs; and ship an independent verifier — with key material handled only by the maintainer.
</objective>

<inputs>
- WP-01 schema (`elsets.leaf_hash`, `elsets.epoch_run_id`, `epochs`); WP-02 worker hook point.
- `tweetnacl` (existing dependency) and Node `crypto`.
</inputs>

<requirements>
1. Canonical JSON per §5: sorted keys, no insignificant whitespace, values exactly as stored from the source. Write it as a small, separately tested module with fixed test vectors.
2. Leaf = SHA-256(0x00 || canonical_json(OMM)); node = SHA-256(0x01 || left || right); leaves sorted by `(norad_id, epoch, source)`; odd node promoted. Test vectors for 0, 1, 2, 3 and 1000 leaves.
3. Epoch record `{ run_id, created_at, kind, root, leaf_count, prev_root }`, canonicalised, Ed25519-signed. `kind` is `live` or `backfill` (§4.5).
4. Commit step in the worker: after inserting a run's elsets, compute leaves, build the tree, sign, write `epochs`, set `leaf_hash` and `epoch_run_id` — in one transaction.
5. Proof generation function: for an elset id → leaf, sibling path with directions, signed epoch record.
6. `scripts/verify-proof.js` — **independent** verifier that does not import `src/`: takes a proof JSON and a public key, prints valid/invalid. Re-implements hashing from the spec text.
7. `scripts/registry-key.js generate` per §5.1: prints the public key, writes the private key to a local file with 0600 permissions, prints instructions to move it into a sealed Railway variable. `scripts/registry-key.js check` verifies the runtime key matches a given public key.
8. Runtime: read the private key only from `REGISTRY_SIGNING_KEY`; refuse to sign if its public half doesn't match `REGISTRY_PUBLIC_KEY`. If absent, ingestion still stores elsets but leaves them uncommitted and `/health` says so.
9. Retire `KEY_STORE` from the new path (the legacy v1 pipeline may keep it until WP-06 retires the v1 frontend; note this under Follow-ups).
</requirements>

<constraints>
- The session never generates, sees or handles the production private key. Tests use throwaway keys created in the test.
- Hashing and canonicalisation must not depend on JS number formatting of floats — operate on the stored source values.
</constraints>

<acceptance>
- Test vectors pass; proofs for random elsets verify with `scripts/verify-proof.js`.
- Tampering any one byte of an OMM record, the path, the root or the signature → verifier says invalid (one test each).
- `prev_root` chaining verified across three consecutive runs.
- Wrong key in `REGISTRY_SIGNING_KEY` → signing refused (test).
- Non-vacuity probes: domain separation removed, sort order changed, prev_root check removed — each must break a test.
</acceptance>

<stop_and_ask>
- Installing the production key: give the maintainer the exact steps (run `generate` locally, add sealed variables, run `check`). Do not do it.
- If canonicalisation of a source's numeric values is ambiguous (e.g. CSV vs JSON precision), report options before choosing.
</stop_and_ask>

<out_of_scope>
API endpoints for proofs (WP-05), frontend, backfill import itself (WP-07 uses the `backfill` kind defined here).
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`, with the key-installation steps for the maintainer.
</deliverable>
