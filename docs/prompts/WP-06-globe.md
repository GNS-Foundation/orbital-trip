# WP-06 — 3D globe with Worker propagation

<context>
The current UI (`public/index.html`) is a 2D canvas map over pre-propagated positions for ~200 objects. SPEC-0001 D7 replaces it with a WebGL globe that propagates the full catalog in the browser from `/api/v2/elements`.
Read first: SPEC-0001 §4.1, §4.4, §3.1 (attribution, no collision claims), §8. Read `CLAUDE.md`. Look at the current `public/index.html` to carry over what's worth keeping (stories, filters, visual identity).
</context>

<objective>
A WebGL globe that renders every tracked object at interactive frame rates, propagated in a Web Worker, with filtering, search and an object panel — replacing the v1 map.
</objective>

<inputs>
- `/api/v2/elements`, `/api/v2/objects/:norad` (WP-05).
- `satellite.js` v6 `json2satrec` in the Worker.
</inputs>

<requirements>
1. **Library choice first:** evaluate at least two options (e.g. three.js-based, deck.gl GlobeView, CesiumJS) against §4.4 — 30k+ points, 1 Hz updates, picking, self-hosted assets, no token-gated services, bundle size. Report the comparison in the PR; if the choice is close or has licence implications, stop and ask before building on it.
2. Worker: builds satrecs once per elements load, propagates all objects at ~1 Hz, transfers positions as typed arrays; main thread never runs SGP4.
3. Rendering: points coloured by object type and/or orbit regime; overlay objects (D9) visually distinguished; Earth with self-hosted texture; day/night optional.
4. Filters: object type, orbit regime, owner, launch year range; search by name or catalog number.
5. Object panel on click: metadata, latest elements (human-readable), ground track and orbit path for the next/previous orbit, link to history and proof endpoints; a placeholder area for Phase 3 Q&A.
6. Attribution in the footer per §3.1.
7. WebGL unavailable → message plus searchable list, not a blank page.
8. Mobile: usable at phone width (reduced point size, panel as bottom sheet).
9. Once it ships, the v1 page and v1 `/api/satellites` consumers can be retired — list that as a follow-up; don't delete them in this WP.
</requirements>

<constraints>
- No third-party runtime requests except the registry's own API (fonts/libraries bundled or self-hosted).
- No collision or conjunction visuals (§3.1).
</constraints>

<acceptance>
- With a seeded 30k-object `/elements` fixture: measured frame rate and Worker propagation time on the session's machine reported in the PR, with screenshots.
- Picking selects the correct object (test against known positions at a fixed time).
- Propagation in the Worker matches `satellite.js` on the main thread for sampled objects (within numerical tolerance) — test.
- Filters and search covered by tests.
- Non-vacuity: break the Worker → main-thread fallback must not silently run SGP4 (test fails).
</acceptance>

<stop_and_ask>
- Library choice if close or licence-sensitive (see 1).
- Any change to the visual identity that the maintainer may care about — show screenshots in the PR before polishing.
</stop_and_ask>

<out_of_scope>
Q&A logic (Phase 3), event markers (Phase 2), overlay editing (WP-08).
</out_of_scope>

<deliverable>
One signed, unmerged PR per `CLAUDE.md`, with screenshots (desktop and phone width).
</deliverable>
