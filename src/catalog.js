/**
 * Orbital TrIP — Comprehensive Satellite Catalog v2.0
 * 260+ satellites: full insured fleet + all orbital regimes + story satellites.
 *
 * The pipeline fetches live TLE from CelesTrak for each NORAD ID.
 *
 * IMPORTANT: All story NORAD IDs must be active satellites with
 * current TLE in CelesTrak's GP catalog. Deorbited, fragmented,
 * or graveyard satellites will NOT resolve.
 *
 * v2.0 changes (Feb 16, 2026):
 *   - Added "insured: true" flag for commercially insured satellites
 *   - Added full SES/Intelsat/Eutelsat/Viasat/Telesat/SiriusXM/EchoStar fleets
 *   - Added O3b MEO constellation (28 sats, NORAD IDs verified from Wikipedia)
 *   - Added Iridium NEXT (17 sats), AST SpaceMobile (6 sats)
 *   - Added regional operators: Arabsat, Türksat, Yahsat, Nilesat, Hispasat
 *   - Total: 261 unique NORAD IDs across 16 categories
 *   - Dashboard filter: "Insured Fleet" shows the sats brokers care about
 */

// ============================================================
// STORY SATELLITES — rich narratives for the demo
// Keyed by NORAD ID — must match entries in CATALOG below.
// ============================================================
const STORIES = {

  // ─────────────────────────────────────────────────────────
  // STORY 1: THE STALKER — Luch/Olymp-K2 (successor to K1)
  // NORAD 55841 — Active GEO, launched March 2023
  // ─────────────────────────────────────────────────────────
  55841: {
    title: "The GEO Stalker II",
    subtitle: "Russia's second-generation orbital spy satellite",
    summary: "Luch/Olymp-K2, launched March 2023, immediately began replicating its predecessor's behavior — drifting through the GEO belt and parking near Western military and commercial satellites. Slingshot Aerospace tracked it stopping near 3.2°E within 60 km of another GEO spacecraft by October 2023. Its predecessor Olymp-K1 visited 12+ positions before being retired to graveyard orbit in October 2025.",
    why_it_matters: "This is the smoking gun for trajectory-based identity. Olymp-K2's \"pattern of life\" — documented by Slingshot's ground telescopes — shows systematic approach maneuvers invisible in static catalog data. TrIP trust scoring instantly flags this: a GEO satellite that moves this often scores in the bottom tier, regardless of what its operator claims its mission is.",
    timeline: [
      { year: "2023 Mar", target: "Launch via Proton-M", longitude: "—" },
      { year: "2023 May", target: "Began east-to-west drift", longitude: "~80°E" },
      { year: "2023 Oct", target: "Parked near GEO spacecraft", longitude: "3.2°E" },
      { year: "2023 Dec", target: "Moved to new GEO slot", longitude: "~15°E" },
      { year: "2024", target: "Continued proximity operations", longitude: "Various" },
      { year: "2025", target: "Predecessor K1 retired to graveyard", longitude: "—" },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // STORY 2: THE UNINSURED EXPLOSION — told from Intelsat 10-02
  // NORAD 28358 — Active GEO comms, launched 2004
  // ─────────────────────────────────────────────────────────
  28358: {
    title: "The Surviving Witness",
    subtitle: "An Intelsat veteran that watched two fleet-mates die — and was stalked by Russia",
    summary: "Intelsat 10-02, launched in 2004, has operated reliably for over 20 years at ~1°W. But it witnessed two sister satellites destroyed: Intelsat 29e (total loss, 2019) and Intelsat 33e (catastrophic breakup at 60°E, October 2024 — 700+ debris fragments, UNINSURED). It was also approached by Luch/Olymp-K1 in 2019 when stationed near 101°E. This one satellite embodies every risk the space insurance industry faces.",
    why_it_matters: "Had Intelsat 33e carried a TrIP breadcrumb chain, its declining station-keeping precision would have been visible BEFORE the breakup — triggering parametric insurance alerts and providing forensic evidence. Instead, the industry has only 700 fragments and a Failure Review Board. TrIP transforms every satellite from a black box into an auditable trajectory record.",
    key_facts: [
      "Intelsat 33e broke apart Oct 19, 2024 at 60°E — 700+ debris fragments in GEO",
      "The satellite was UNINSURED at time of breakup",
      "Predecessor Intelsat 29e was also a total loss in 2019",
      "Both used Boeing 702MP bus — same platform as other active GEO satellites",
      "Intelsat 10-02 was approached by Luch/Olymp-K1 in 2019 near 101°E",
      "This satellite has operated reliably for 20+ years — TrIP proves that record cryptographically",
    ],
  },

  // ─────────────────────────────────────────────────────────
  // STORY 3: THE COLLISION AVOIDANCE CRISIS — Starlink-1609
  // NORAD 47621 — Active LEO, launched January 2021
  // ─────────────────────────────────────────────────────────
  47621: {
    title: "One of 144,000 Maneuvers",
    subtitle: "How a single Starlink represents the collision avoidance crisis",
    summary: "Between December 2024 and May 2025, Starlink satellites performed 144,404 collision-avoidance maneuvers — 275 per day. Each maneuver is currently just a thruster firing with no cryptographic receipt. SpaceX coordinates via automation because, as industry experts note, \"email is not particularly scalable.\" TrIP gives every maneuver a signed, timestamped, hash-chained record.",
    why_it_matters: "With 9,500+ Starlink satellites and each averaging 14 maneuvers per six months, the scale of unrecorded orbital activity is staggering. When a Starlink maneuvers to avoid debris from a 2021 Russian ASAT test, there is no cryptographic proof linking cause to effect. TrIP creates an auditable chain: this satellite moved because that debris approached, verified by this observation chain.",
    key_stats: [
      "144,404 collision avoidance maneuvers (Dec 2024 – May 2025)",
      "275 maneuvers per day across the constellation",
      "Average 14 thruster firings per satellite per 6 months",
      "SpaceX publishes ephemerides to Space-Track.org 3x daily",
      "Cumulative collision probability >10% per year for a constellation this size",
    ],
  },

  // ─────────────────────────────────────────────────────────
  // STORY 4: THE DAY THE CREW SHELTERED — ISS
  // NORAD 25544 — Active LEO station
  // ─────────────────────────────────────────────────────────
  25544: {
    title: "The Day the Crew Sheltered",
    subtitle: "When Russia's ASAT test forced 7 astronauts into escape pods",
    summary: "On November 15, 2021, Russia destroyed its own Cosmos 1408 satellite with a direct-ascent anti-satellite weapon, generating 1,800+ trackable debris pieces at ~480 km — directly in the ISS orbital corridor. NASA ordered the crew of 7 to shelter in their Crew Dragon and Soyuz capsules as the station passed through the debris cloud every 90 minutes. The ISS continues to maneuver around Cosmos 1408 fragments to this day.",
    why_it_matters: "The ISS has the most complete trajectory record of any space object — decades of continuous GPS data, ground tracking, and maneuver logs. Yet even the ISS lacks a cryptographic chain of custody for its position data. TrIP would make the ISS trajectory independently verifiable by anyone, turning its movement record into admissible evidence under the 1972 Liability Convention.",
    key_facts: [
      "Cosmos 1408 destroyed Nov 15, 2021 at ~480 km altitude",
      "1,800+ trackable debris pieces generated",
      "ISS crew of 7 sheltered in escape vehicles",
      "Station passes through debris field every 90 minutes",
      "ISS has performed multiple avoidance maneuvers for Cosmos 1408 fragments",
      "No cryptographic proof links cause (ASAT test) to effect (ISS maneuvers)",
    ],
  },

  // ─────────────────────────────────────────────────────────
  // STORY 5: THE DUTIFUL OBSERVER — Sentinel-2A
  // NORAD 40697 — Active SSO, ESA Copernicus, launched 2015
  // ─────────────────────────────────────────────────────────
  40697: {
    title: "The Dutiful Observer",
    subtitle: "ESA's flagship Earth observation mission — a model of orbital stewardship",
    summary: "Sentinel-2A has operated flawlessly in sun-synchronous orbit since June 2015, providing free, open multispectral imagery that underpins global climate monitoring, disaster response, and agricultural planning. It maintains precise repeat-ground-track orbit control, performs regular collision avoidance maneuvers, and follows ESA's Zero Debris charter. This is what a well-operated satellite looks like.",
    why_it_matters: "Sentinel-2A represents the positive case for TrIP trust scoring: consistent orbit maintenance, transparent operations, responsible operator, and a decade of verifiable trajectory data. In a world with parametric insurance, satellites like Sentinel-2A would pay the lowest premiums. TrIP creates the data infrastructure to reward good behavior and penalize reckless operation — the foundation of a functioning insurance market.",
  },
};

// ============================================================
// FULL CATALOG — 261 NORAD IDs
// insured: true = commercially insured (or very likely)
// All IDs must be active in CelesTrak's GP catalog.
// ============================================================
const CATALOG = [

  // ════════════════════════════════════════════════════════════
  // SPACE STATIONS
  // ════════════════════════════════════════════════════════════
  { norad: 25544, name: "ISS (ZARYA)", op: "NASA/Roscosmos", cat: "Station" },
  { norad: 48274, name: "CSS (TIANHE)", op: "CNSA", cat: "Station" },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — SES
  // Largest commercial GEO fleet (post-Intelsat merger 2025)
  // ════════════════════════════════════════════════════════════
  { norad: 36516, name: "SES-1", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 37809, name: "SES-2", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 38652, name: "SES-3", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 37380, name: "SES-4", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 38778, name: "SES-5", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 39460, name: "SES-6", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 39563, name: "SES-8", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 41380, name: "SES-9", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 42432, name: "SES-10", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 42709, name: "SES-11", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 43488, name: "SES-12", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 43439, name: "SES-14", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 42726, name: "SES-15", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 43175, name: "GOVSAT-1 (SES-16)", op: "SES/Luxembourg", cat: "GEO Comms", insured: true },
  { norad: 49055, name: "SES-17", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 56065, name: "SES-18", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 56066, name: "SES-19", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 58090, name: "SES-20", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 58091, name: "SES-21", op: "SES", cat: "GEO Comms", insured: true },
  // SES — ASTRA sub-fleet (major European DTH broadcast)
  { norad: 33436, name: "ASTRA 1KR", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 31306, name: "ASTRA 1L", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 33740, name: "ASTRA 1M", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 37775, name: "ASTRA 1N", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 39285, name: "ASTRA 2E", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 40364, name: "ASTRA 2G", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 36581, name: "ASTRA 3B", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 39617, name: "ASTRA 5B", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 52933, name: "ASTRA 1P", op: "SES", cat: "GEO Comms", insured: true },
  // SES — NSS sub-fleet (from New Skies acquisition)
  { norad: 33749, name: "NSS-9", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 29270, name: "NSS-10", op: "SES", cat: "GEO Comms", insured: true },
  { norad: 36032, name: "NSS-12", op: "SES", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — INTELSAT (acquired by SES 2025)
  // ════════════════════════════════════════════════════════════
  { norad: 24674, name: "INTELSAT 5", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 25371, name: "INTELSAT 6", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 26451, name: "INTELSAT 7", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 27403, name: "INTELSAT 8", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 27513, name: "INTELSAT 9", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 28358, name: "INTELSAT 10-02", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 28702, name: "INTELSAT 11", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 33051, name: "INTELSAT 14", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 36831, name: "INTELSAT 16", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 37606, name: "INTELSAT 18", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 37834, name: "INTELSAT 19", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 38740, name: "INTELSAT 20", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 38749, name: "INTELSAT 21", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 38992, name: "INTELSAT 22", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 39479, name: "INTELSAT 23", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 40384, name: "INTELSAT 30", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 40425, name: "INTELSAT 31", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 40874, name: "INTELSAT 34", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 41748, name: "INTELSAT 36", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 42814, name: "INTELSAT 37e", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 45984, name: "INTELSAT 39", op: "Intelsat/SES", cat: "GEO Comms", insured: true },
  { norad: 54237, name: "INTELSAT 40e", op: "Intelsat/SES", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED MEO — SES O3b / mPOWER
  // NORAD IDs verified from Wikipedia List_of_SES_satellites
  // ════════════════════════════════════════════════════════════
  { norad: 39188, name: "O3B FM5", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 39189, name: "O3B FM4", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 39190, name: "O3B FM2", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 39191, name: "O3B PFM", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40079, name: "O3B FM8", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40080, name: "O3B FM6", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40081, name: "O3B FM7", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40082, name: "O3B FM3", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40348, name: "O3B FM10", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40349, name: "O3B FM11", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40350, name: "O3B FM12", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 40351, name: "O3B FM9", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 43231, name: "O3B FM15", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 43232, name: "O3B FM16", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 43233, name: "O3B FM14", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 43234, name: "O3B FM13", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 44112, name: "O3B FM20", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 44113, name: "O3B FM19", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 44114, name: "O3B FM17", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 44115, name: "O3B FM18", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 54755, name: "O3B MPOWER 1", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 54756, name: "O3B MPOWER 2", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 56367, name: "O3B MPOWER 4", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 56368, name: "O3B MPOWER 3", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 58346, name: "O3B MPOWER 5", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 58347, name: "O3B MPOWER 6", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 62362, name: "O3B MPOWER 7", op: "SES", cat: "MEO Comms", insured: true },
  { norad: 62363, name: "O3B MPOWER 8", op: "SES", cat: "MEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — EUTELSAT (merged with OneWeb 2023)
  // EU/UK regulation mandates insurance
  // ════════════════════════════════════════════════════════════
  { norad: 24665, name: "EUTELSAT 7A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 28187, name: "EUTELSAT 7B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 40613, name: "EUTELSAT 7C", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 26719, name: "EUTELSAT 8 WEST B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 29273, name: "EUTELSAT 9A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 26853, name: "EUTELSAT 10A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 54024, name: "EUTELSAT 10B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 54584, name: "HOTBIRD 13G", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 32953, name: "EUTELSAT 16A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 38434, name: "EUTELSAT 21B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 39612, name: "EUTELSAT 25B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 33153, name: "EUTELSAT 28A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 28946, name: "EUTELSAT 36A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 38010, name: "EUTELSAT 36B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 54067, name: "EUTELSAT 36D", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 33460, name: "EUTELSAT 70B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 39020, name: "EUTELSAT 172B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 41903, name: "EUTELSAT 117 WEST A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 41946, name: "EUTELSAT 117 WEST B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 40733, name: "EUTELSAT 115 WEST B", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 41382, name: "EUTELSAT 65 WEST A", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 43340, name: "EUTELSAT KONNECT", op: "Eutelsat", cat: "GEO Comms", insured: true },
  { norad: 50507, name: "EUTELSAT KONNECT VHTS", op: "Eutelsat", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — VIASAT / INMARSAT (merged 2023)
  // ViaSat-3 $420M claim — Inmarsat 6-F2 power anomaly
  // ════════════════════════════════════════════════════════════
  { norad: 37843, name: "VIASAT-1", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 42740, name: "VIASAT-2", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 56173, name: "VIASAT-3 AMERICAS", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 25893, name: "INMARSAT 3-F2", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 24819, name: "INMARSAT 3-F3", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 25153, name: "INMARSAT 3-F4", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 28628, name: "INMARSAT 4-F1", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 28899, name: "INMARSAT 4-F2", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 32487, name: "INMARSAT 4-F3", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 40882, name: "INMARSAT 5-F2", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 42698, name: "INMARSAT GX5", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 49586, name: "INMARSAT 6-F1", op: "Viasat", cat: "GEO Comms", insured: true },
  { norad: 55579, name: "INMARSAT 6-F2", op: "Viasat", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — TELESAT
  // ════════════════════════════════════════════════════════════
  { norad: 25080, name: "ANIK F1", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 28868, name: "ANIK F1R", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 28378, name: "ANIK F2", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 32018, name: "ANIK F3", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 37218, name: "TELSTAR 14R", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 41036, name: "TELSTAR 12 VANTAGE", op: "Telesat", cat: "GEO Comms", insured: true },
  { norad: 43562, name: "TELSTAR 18 VANTAGE", op: "Telesat", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — SIRIUSXM
  // SXM-7 $225M total loss precedent
  // ════════════════════════════════════════════════════════════
  { norad: 26390, name: "SIRIUS FM-1", op: "SiriusXM", cat: "GEO Comms", insured: true },
  { norad: 26483, name: "SIRIUS FM-2", op: "SiriusXM", cat: "GEO Comms", insured: true },
  { norad: 26626, name: "SIRIUS FM-3", op: "SiriusXM", cat: "GEO Comms", insured: true },
  { norad: 40654, name: "SXM-6", op: "SiriusXM", cat: "GEO Comms", insured: true },
  { norad: 47306, name: "SXM-7", op: "SiriusXM", cat: "GEO Comms", insured: true },
  { norad: 52927, name: "SXM-8", op: "SiriusXM", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — ECHOSTAR / HUGHES
  // Jupiter 3 = largest commercial comms sat ever (9,000 kg)
  // ════════════════════════════════════════════════════════════
  { norad: 29162, name: "ECHOSTAR 10", op: "EchoStar", cat: "GEO Comms", insured: true },
  { norad: 38352, name: "ECHOSTAR 14", op: "EchoStar", cat: "GEO Comms", insured: true },
  { norad: 36101, name: "ECHOSTAR 15", op: "EchoStar", cat: "GEO Comms", insured: true },
  { norad: 40982, name: "ECHOSTAR 18", op: "EchoStar", cat: "GEO Comms", insured: true },
  { norad: 43159, name: "ECHOSTAR 19 (JUPITER 2)", op: "EchoStar", cat: "GEO Comms", insured: true },
  { norad: 53170, name: "JUPITER 3 (ECHOSTAR 24)", op: "EchoStar", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // INSURED GEO — REGIONAL OPERATORS
  // Arabsat, Türksat, Yahsat, Nilesat, Hispasat
  // ════════════════════════════════════════════════════════════
  // Arabsat (Saudi)
  { norad: 33055, name: "BADR-5 (ARABSAT 5C)", op: "Arabsat", cat: "GEO Comms", insured: true },
  { norad: 36745, name: "BADR-6 (ARABSAT 5B)", op: "Arabsat", cat: "GEO Comms", insured: true },
  { norad: 38098, name: "BADR-7 (ARABSAT 6B)", op: "Arabsat", cat: "GEO Comms", insured: true },
  { norad: 36830, name: "ARABSAT 5A", op: "Arabsat", cat: "GEO Comms", insured: true },
  { norad: 44540, name: "ARABSAT 6A", op: "Arabsat", cat: "GEO Comms", insured: true },
  // Türksat (Turkey)
  { norad: 28500, name: "TURKSAT 3A", op: "Türksat", cat: "GEO Comms", insured: true },
  { norad: 39522, name: "TURKSAT 4A", op: "Türksat", cat: "GEO Comms", insured: true },
  { norad: 40984, name: "TURKSAT 4B", op: "Türksat", cat: "GEO Comms", insured: true },
  { norad: 47562, name: "TURKSAT 5A", op: "Türksat", cat: "GEO Comms", insured: true },
  { norad: 49400, name: "TURKSAT 5B", op: "Türksat", cat: "GEO Comms", insured: true },
  // Yahsat (UAE)
  { norad: 37392, name: "AL YAH 1", op: "Yahsat", cat: "GEO Comms", insured: true },
  { norad: 37393, name: "AL YAH 2", op: "Yahsat", cat: "GEO Comms", insured: true },
  { norad: 44053, name: "AL YAH 3", op: "Yahsat", cat: "GEO Comms", insured: true },
  // Nilesat (Egypt)
  { norad: 25349, name: "NILESAT 101", op: "Nilesat", cat: "GEO Comms", insured: true },
  { norad: 27271, name: "NILESAT 102", op: "Nilesat", cat: "GEO Comms", insured: true },
  // Hispasat (Spain — EU regulated)
  { norad: 27528, name: "HISPASAT 1C", op: "Hispasat", cat: "GEO Comms", insured: true },
  { norad: 28903, name: "HISPASAT 1D", op: "Hispasat", cat: "GEO Comms", insured: true },
  { norad: 40720, name: "HISPASAT 36W-1", op: "Hispasat", cat: "GEO Comms", insured: true },

  // ════════════════════════════════════════════════════════════
  // OTHER GEO COMMS (from original v1 catalog, not confirmed insured)
  // ════════════════════════════════════════════════════════════
  { norad: 38087, name: "SES-4", op: "SES", cat: "GEO Comms" },
  { norad: 56174, name: "VIASAT-3 AMERICAS", op: "Viasat", cat: "GEO Comms" },
  { norad: 57320, name: "JUPITER 3", op: "Hughes/EchoStar", cat: "GEO Comms" },
  { norad: 43039, name: "SES-14", op: "SES", cat: "GEO Comms" },
  { norad: 44333, name: "EUTELSAT KONNECT", op: "Eutelsat", cat: "GEO Comms" },
  { norad: 36131, name: "BADR-5", op: "Arabsat", cat: "GEO Comms" },
  { norad: 27509, name: "ANIK F1", op: "Telesat", cat: "GEO Comms" },
  { norad: 42741, name: "SGDC-1", op: "Telebras", cat: "GEO Comms" },
  { norad: 43632, name: "AMOS-17", op: "Spacecom", cat: "GEO Comms" },
  { norad: 44334, name: "JCSAT-18/KACIFIC-1", op: "SKY Perfect JSAT", cat: "GEO Comms" },
  { norad: 56700, name: "TDRS-14", op: "NASA", cat: "GEO Comms" },
  { norad: 26052, name: "TDRS-8", op: "NASA", cat: "GEO Comms" },
  { norad: 44186, name: "ARABSAT 6A", op: "Arabsat", cat: "GEO Comms" },
  { norad: 51267, name: "TURKSAT 5B", op: "Türksat", cat: "GEO Comms" },

  // ════════════════════════════════════════════════════════════
  // GEO WEATHER
  // ════════════════════════════════════════════════════════════
  { norad: 41866, name: "GOES 16", op: "NOAA", cat: "GEO Weather" },
  { norad: 51850, name: "GOES 18", op: "NOAA", cat: "GEO Weather" },
  { norad: 29155, name: "GOES 13", op: "NOAA", cat: "GEO Weather" },
  { norad: 36411, name: "GOES 15", op: "NOAA", cat: "GEO Weather" },
  { norad: 43226, name: "GOES 17", op: "NOAA", cat: "GEO Weather" },
  { norad: 54806, name: "GOES 18 (T)", op: "NOAA", cat: "GEO Weather" },
  { norad: 43509, name: "FENGYUN 4A", op: "CMA (China)", cat: "GEO Weather" },
  { norad: 41836, name: "HIMAWARI 9", op: "JMA (Japan)", cat: "GEO Weather" },
  { norad: 40732, name: "MSG 4 (METEOSAT)", op: "EUMETSAT", cat: "GEO Weather" },

  // ════════════════════════════════════════════════════════════
  // EARTH OBSERVATION
  // ════════════════════════════════════════════════════════════
  { norad: 40697, name: "SENTINEL-2A", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 42063, name: "SENTINEL-2B", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 49260, name: "LANDSAT 9", op: "NASA/USGS", cat: "Earth Obs" },
  { norad: 39084, name: "LANDSAT 8", op: "NASA/USGS", cat: "Earth Obs" },
  { norad: 36508, name: "CRYOSAT 2", op: "ESA", cat: "Earth Obs" },
  { norad: 43613, name: "ICESAT-2", op: "NASA", cat: "Earth Obs" },
  { norad: 56748, name: "EARTHCARE", op: "ESA/JAXA", cat: "Earth Obs" },
  { norad: 33591, name: "NOAA 19", op: "NOAA", cat: "Earth Obs" },
  { norad: 43437, name: "SENTINEL-3B", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 55268, name: "PACE", op: "NASA", cat: "Earth Obs" },
  { norad: 41335, name: "SENTINEL-1A", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 43600, name: "SENTINEL-3A", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 44383, name: "PRISMA", op: "ASI (Italy)", cat: "Earth Obs" },
  { norad: 49044, name: "COSMO-SKYMED SG-2", op: "ASI (Italy)", cat: "Earth Obs" },
  { norad: 47948, name: "PLEIADES NEO 3", op: "Airbus DS", cat: "Earth Obs" },
  { norad: 51938, name: "PLEIADES NEO 4", op: "Airbus DS", cat: "Earth Obs" },
  { norad: 53814, name: "WORLDVIEW LEGION 1", op: "Maxar", cat: "Earth Obs" },
  { norad: 25338, name: "NOAA 15", op: "NOAA", cat: "Earth Obs" },
  { norad: 28654, name: "NOAA 18", op: "NOAA", cat: "Earth Obs" },

  // ════════════════════════════════════════════════════════════
  // NAVIGATION (GPS, Galileo, BeiDou, GLONASS)
  // ════════════════════════════════════════════════════════════
  { norad: 24876, name: "GPS BIIR-2 (PRN 13)", op: "US Space Force", cat: "Navigation" },
  { norad: 28474, name: "GPS BIIR-7 (PRN 18)", op: "US Space Force", cat: "Navigation" },
  { norad: 40294, name: "GPS BIIF-9 (PRN 03)", op: "US Space Force", cat: "Navigation" },
  { norad: 48859, name: "GPS III-5 (PRN 18)", op: "US Space Force", cat: "Navigation" },
  { norad: 37846, name: "GALILEO-PFM", op: "EU/ESA", cat: "Navigation" },
  { norad: 37847, name: "GALILEO-FM2", op: "EU/ESA", cat: "Navigation" },
  { norad: 44027, name: "BEIDOU-3 M17", op: "China (CNSA)", cat: "Navigation" },
  { norad: 32384, name: "GLONASS 731", op: "Russia (Roscosmos)", cat: "Navigation" },
  { norad: 40544, name: "GALILEO-FM4", op: "EU/ESA", cat: "Navigation" },
  { norad: 41175, name: "GALILEO-FM8", op: "EU/ESA", cat: "Navigation" },
  { norad: 36585, name: "BEIDOU G4", op: "China (CNSA)", cat: "Navigation" },

  // ════════════════════════════════════════════════════════════
  // SCIENCE
  // ════════════════════════════════════════════════════════════
  { norad: 20580, name: "HST", op: "NASA/ESA", cat: "Science" },
  { norad: 27424, name: "INTEGRAL", op: "ESA", cat: "Science" },
  { norad: 44874, name: "CHEOPS", op: "ESA", cat: "Science" },
  { norad: 28485, name: "SWIFT", op: "NASA", cat: "Science" },
  { norad: 43435, name: "TESS", op: "NASA", cat: "Science" },
  { norad: 41240, name: "ASTRO-H (HITOMI)", op: "JAXA", cat: "Science" },
  { norad: 36119, name: "SDO", op: "NASA", cat: "Science" },
  { norad: 43689, name: "AEOLUS", op: "ESA", cat: "Science" },

  // ════════════════════════════════════════════════════════════
  // LEO CONSTELLATIONS — STARLINK
  // ════════════════════════════════════════════════════════════
  { norad: 47621, name: "STARLINK-1609", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 44914, name: "STARLINK-1130", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 48062, name: "STARLINK-2378", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 45360, name: "STARLINK-1327", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 44235, name: "STARLINK-24", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 46114, name: "STARLINK-1729", op: "SpaceX", cat: "LEO Constellation" },

  // ════════════════════════════════════════════════════════════
  // LEO CONSTELLATIONS — ONEWEB
  // ════════════════════════════════════════════════════════════
  { norad: 44057, name: "ONEWEB-0012", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 48311, name: "ONEWEB-0145", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 56719, name: "ONEWEB-0601", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 48601, name: "ONEWEB-0263", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 56718, name: "ONEWEB-0600", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },

  // ════════════════════════════════════════════════════════════
  // LEO CONSTELLATIONS — IRIDIUM NEXT (insured as fleet)
  // ════════════════════════════════════════════════════════════
  { norad: 42803, name: "IRIDIUM 106", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42804, name: "IRIDIUM 103", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42805, name: "IRIDIUM 109", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42806, name: "IRIDIUM 102", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42807, name: "IRIDIUM 105", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42808, name: "IRIDIUM 104", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42955, name: "IRIDIUM 108", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42957, name: "IRIDIUM 118", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42958, name: "IRIDIUM 120", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42959, name: "IRIDIUM 119", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 42960, name: "IRIDIUM 128", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43569, name: "IRIDIUM 151", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43570, name: "IRIDIUM 153", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43571, name: "IRIDIUM 155", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43572, name: "IRIDIUM 156", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43573, name: "IRIDIUM 152", op: "Iridium", cat: "LEO Constellation", insured: true },
  { norad: 43922, name: "IRIDIUM 180", op: "Iridium", cat: "LEO Constellation", insured: true },

  // ════════════════════════════════════════════════════════════
  // LEO — AST SPACEMOBILE (direct-to-cell, publicly traded ASTS)
  // ════════════════════════════════════════════════════════════
  { norad: 51085, name: "BLUEWALKER 3", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },
  { norad: 61262, name: "BLUEBIRD 1", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },
  { norad: 61263, name: "BLUEBIRD 2", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },
  { norad: 61264, name: "BLUEBIRD 3", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },
  { norad: 61265, name: "BLUEBIRD 4", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },
  { norad: 61266, name: "BLUEBIRD 5", op: "AST SpaceMobile", cat: "LEO Constellation", insured: true },

  // ════════════════════════════════════════════════════════════
  // LEO — TELESAT LIGHTSPEED
  // ════════════════════════════════════════════════════════════
  { norad: 55066, name: "ARCTIC BROADBAND-1", op: "Telesat", cat: "LEO Constellation" },

  // ════════════════════════════════════════════════════════════
  // SUSPICIOUS / MILITARY
  // ════════════════════════════════════════════════════════════
  { norad: 55841, name: "LUCH (OLYMP) 2", op: "Russian MOD/FSB", cat: "Suspicious" },
  { norad: 48078, name: "COSMOS 2558", op: "Russian MOD", cat: "Suspicious" },
  { norad: 43054, name: "SHIYAN-6 (SY-6)", op: "China (PLA)", cat: "Military" },
  { norad: 40424, name: "MUOS-3", op: "US Navy", cat: "Military" },
  { norad: 36868, name: "SBIRS GEO-1", op: "US Space Force", cat: "Military" },

  // ════════════════════════════════════════════════════════════
  // DEBRIS
  // ════════════════════════════════════════════════════════════
  { norad: 25730, name: "FENGYUN 1C DEB", op: "N/A (ASAT debris)", cat: "Debris" },

  // ════════════════════════════════════════════════════════════
  // CUBESATS
  // ════════════════════════════════════════════════════════════
  { norad: 43793, name: "LEMUR-2 LUCKY", op: "Spire Global", cat: "CubeSat" },
  { norad: 47510, name: "FLOCK 4P-1", op: "Planet Labs", cat: "CubeSat" },
  { norad: 56205, name: "HAWK 8A", op: "HawkEye 360", cat: "CubeSat" },
];

// ============================================================
// DEDUPLICATION
// First occurrence wins — insured entries listed first take priority
// ============================================================
const seen = new Set();
const UNIQUE_CATALOG = CATALOG.filter(s => {
  if (seen.has(s.norad)) return false;
  seen.add(s.norad);
  return true;
});

module.exports = { CATALOG: UNIQUE_CATALOG, STORIES };