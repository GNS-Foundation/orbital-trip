/**
 * Orbital TrIP — Curated Satellite Catalog
 * 100+ satellites across all orbital regimes.
 * Story satellites include rich narrative metadata.
 * 
 * The pipeline fetches live TLE from CelesTrak for each NORAD ID.
 */

// ============================================================
// STORY SATELLITES — rich narratives for the demo
// ============================================================
const STORIES = {

  40258: { // LUCH (OLYMP-K1)
    title: "The GEO Stalker",
    subtitle: "Russia's orbital spy satellite",
    summary: "Luch/Olymp-K1 has visited 12+ GEO positions since 2014, systematically approaching within 5 km of Western military and commercial satellites. No legitimate comms satellite moves this frequently. Each repositioning constitutes a trust score reset event.",
    why_it_matters: "This satellite demonstrates why trajectory-based identity matters: its behavior pattern is invisible in a NORAD catalog number but immediately obvious in a TrIP trust score. Orbital TrIP flags anomalous GEO movement that current systems simply catalog as routine repositioning.",
    timeline: [
      { year: "2015", target: "Intelsat 7/8 (Atlantic)", longitude: "18.1°E" },
      { year: "2015", target: "French mil SICRAL", longitude: "24.5°E" },
      { year: "2017", target: "Intelsat 17", longitude: "55.0°E" },
      { year: "2017", target: "Spainsat/Xtar-Eur", longitude: "36.0°E" },
      { year: "2018", target: "Athena-Fidus (FR/IT mil)", longitude: "47.5°E" },
      { year: "2019", target: "Intelsat 10-02", longitude: "101.0°E" },
      { year: "2020", target: "Intelsat 22", longitude: "60.0°E" },
      { year: "2021", target: "ABS-2/Yamal 402", longitude: "75.0°E" },
      { year: "2022", target: "NSS-6 region", longitude: "95.0°E" },
      { year: "2023", target: "Yamal 601", longitude: "49.0°E" },
      { year: "2024", target: "ES'hail 2 region", longitude: "25.5°E" },
      { year: "2024", target: "Paksat-1R region", longitude: "38.0°E" },
    ],
  },

  41748: { // INTELSAT 33E
    title: "The Uninsured Explosion",
    subtitle: "Boeing satellite breaks up in GEO — no insurance, no accountability",
    summary: "On October 19, 2024, Intelsat 33e (Boeing 702MP bus) broke apart in geostationary orbit at 60°E, creating 20+ debris fragments. The satellite was UNINSURED at the time. Customers across Europe, Africa, and Asia-Pacific lost service.",
    why_it_matters: "This is the insurance industry's nightmare scenario and Orbital TrIP's strongest commercial argument. Had Intelsat 33e carried a TrIP chain, its operational data would have shown declining station-keeping precision before the breakup — data that could have triggered parametric insurance alerts and provided forensic evidence for the failure review.",
    key_facts: [
      "Launched August 2016, entered service January 2017 (3 months late — thruster anomaly)",
      "Second propulsion anomaly cut 3.5 years from planned 15-year lifespan",
      "Predecessor Intelsat 29e was also a total loss in 2019",
      "Satellite was UNINSURED at time of breakup",
      "20+ tracked debris fragments remain in GEO",
      "Boeing 702MP bus — same platform as other active GEO satellites",
    ],
    breakup_date: "2024-10-19",
  },

  26463: { // CLUSTER 2 (SALSA)
    title: "The Responsible Farewell",
    subtitle: "ESA's Zero Debris pioneer — targeted reentry over the South Pacific",
    summary: "On September 8, 2024, ESA successfully deorbited Cluster 2 'Salsa' — a 24-year-old magnetosphere research satellite — in a first-of-its-kind targeted reentry over the South Pacific. An aircraft from Easter Island captured the breakup with 16 instruments.",
    why_it_matters: "Salsa demonstrates the positive side of TrIP trust scoring: a satellite that completes its mission and performs a responsible, transparent deorbit earns the highest trust tier. The controlled reentry trajectory, verified by independent observation, becomes a permanent record of responsible space stewardship.",
    reentry_date: "2024-09-08",
  },

  44713: { // STARLINK-1007
    title: "One of 144,000 Maneuvers",
    subtitle: "How a single Starlink represents the collision avoidance crisis",
    summary: "Between December 2024 and May 2025, Starlink satellites performed 144,404 collision-avoidance maneuvers — 275 per day. Each maneuver is currently just a thruster firing with no cryptographic receipt.",
    why_it_matters: "With 9,500+ Starlink satellites and each averaging 14 maneuvers per six months, the scale of unrecorded orbital activity is staggering. TrIP creates an auditable chain: this satellite moved because that debris approached, verified by this observation chain.",
    key_stats: [
      "144,404 collision avoidance maneuvers (Dec 2024 – May 2025)",
      "275 maneuvers per day across the constellation",
      "Average 14 thruster firings per satellite per 6 months",
      "SpaceX publishes ephemerides to Space-Track.org 3x daily",
    ],
  },

  49863: { // COSMOS 1408 DEB
    title: "The Orphan Fragment",
    subtitle: "Debris from Russia's 2021 ASAT test — no operator, no identity, no accountability",
    summary: "On November 15, 2021, Russia destroyed Cosmos 1408 with a direct-ascent anti-satellite weapon, generating 1,800+ trackable debris pieces at ~650 km altitude — directly threatening the ISS and Chinese Space Station crew.",
    why_it_matters: "ASAT debris represents the extreme case for Orbital TrIP: objects with zero self-attestation capability, identifiable only through ground-attested breadcrumbs from radar tracking. The trust score reflects this — zero compliance, zero operator, minimal corroboration.",
  },
};

// ============================================================
// FULL CATALOG — 100+ NORAD IDs by category
// ============================================================
const CATALOG = [
  // ---- SPACE STATIONS ----
  { norad: 25544, name: "ISS (ZARYA)", op: "NASA/Roscosmos", cat: "Station" },
  { norad: 48274, name: "CSS (TIANHE)", op: "CNSA", cat: "Station" },

  // ---- GEO COMMUNICATIONS ----
  { norad: 38087, name: "SES-4", op: "SES", cat: "GEO Comms" },
  { norad: 40874, name: "EUTELSAT 9B", op: "Eutelsat", cat: "GEO Comms" },
  { norad: 28358, name: "INTELSAT 10-02", op: "Intelsat/SES", cat: "GEO Comms" },
  { norad: 37775, name: "ASTRA 1N", op: "SES", cat: "GEO Comms" },
  { norad: 54584, name: "HOTBIRD 13G", op: "Eutelsat", cat: "GEO Comms" },
  { norad: 51267, name: "TURKSAT 5B", op: "Turksat", cat: "GEO Comms" },
  { norad: 44186, name: "ARABSAT 6A", op: "Arabsat", cat: "GEO Comms" },
  { norad: 56174, name: "VIASAT-3 AMERICAS", op: "Viasat", cat: "GEO Comms" },
  { norad: 57320, name: "JUPITER 3", op: "Hughes/EchoStar", cat: "GEO Comms" },
  { norad: 40874, name: "EUTELSAT 9B", op: "Eutelsat", cat: "GEO Comms" },
  { norad: 43039, name: "SES-14", op: "SES", cat: "GEO Comms" },
  { norad: 44333, name: "EUTELSAT KONNECT", op: "Eutelsat", cat: "GEO Comms" },

  // ---- GEO WEATHER ----
  { norad: 41866, name: "GOES 16", op: "NOAA", cat: "GEO Weather" },
  { norad: 51850, name: "GOES 18", op: "NOAA", cat: "GEO Weather" },
  { norad: 43509, name: "FENGYUN 4A", op: "CMA (China)", cat: "GEO Weather" },
  { norad: 41836, name: "HIMAWARI 9", op: "JMA (Japan)", cat: "GEO Weather" },
  { norad: 40732, name: "MSG 4 (METEOSAT)", op: "EUMETSAT", cat: "GEO Weather" },

  // ---- EARTH OBSERVATION ----
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

  // ---- NAVIGATION ----
  { norad: 24876, name: "GPS BIIR-2 (PRN 13)", op: "US Space Force", cat: "Navigation" },
  { norad: 28474, name: "GPS BIIR-7 (PRN 18)", op: "US Space Force", cat: "Navigation" },
  { norad: 40294, name: "GPS BIIF-9 (PRN 03)", op: "US Space Force", cat: "Navigation" },
  { norad: 48859, name: "GPS III-5 (PRN 18)", op: "US Space Force", cat: "Navigation" },
  { norad: 37846, name: "GALILEO-PFM", op: "EU/ESA", cat: "Navigation" },
  { norad: 37847, name: "GALILEO-FM2", op: "EU/ESA", cat: "Navigation" },
  { norad: 44027, name: "BEIDOU-3 M17", op: "China (CNSA)", cat: "Navigation" },
  { norad: 32384, name: "GLONASS 731", op: "Russia (Roscosmos)", cat: "Navigation" },

  // ---- SCIENCE ----
  { norad: 20580, name: "HST", op: "NASA/ESA", cat: "Science" },
  { norad: 54213, name: "JWST", op: "NASA/ESA/CSA", cat: "Science" },
  { norad: 27424, name: "INTEGRAL", op: "ESA", cat: "Science" },
  { norad: 44874, name: "CHEOPS", op: "ESA", cat: "Science" },
  { norad: 28485, name: "SWIFT", op: "NASA", cat: "Science" },
  { norad: 43435, name: "TESS", op: "NASA", cat: "Science" },

  // ---- LEO CONSTELLATIONS — STARLINK ----
  { norad: 44713, name: "STARLINK-1007", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 44914, name: "STARLINK-1130", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 48062, name: "STARLINK-2378", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 53550, name: "STARLINK-4550", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 55521, name: "STARLINK-30001", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 57300, name: "STARLINK-31000", op: "SpaceX", cat: "LEO Constellation" },

  // ---- LEO CONSTELLATIONS — ONEWEB ----
  { norad: 44057, name: "ONEWEB-0012", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 48311, name: "ONEWEB-0145", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 56719, name: "ONEWEB-0601", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },

  // ---- LEO CONSTELLATIONS — IRIDIUM ----
  { norad: 43922, name: "IRIDIUM 180", op: "Iridium", cat: "LEO Constellation" },
  { norad: 42955, name: "IRIDIUM 108", op: "Iridium", cat: "LEO Constellation" },

  // ---- LEO CONSTELLATIONS — KUIPER ----
  { norad: 58590, name: "KUIPER PROTO-1", op: "Amazon", cat: "LEO Constellation" },
  { norad: 58591, name: "KUIPER PROTO-2", op: "Amazon", cat: "LEO Constellation" },

  // ---- SUSPICIOUS / MILITARY ----
  { norad: 40258, name: "LUCH (OLYMP-K1)", op: "Russian MOD", cat: "Suspicious" },
  { norad: 48078, name: "COSMOS 2558", op: "Russian MOD", cat: "Suspicious" },
  { norad: 43054, name: "SHIYAN-6 (SY-6)", op: "China (PLA)", cat: "Military" },
  { norad: 50001, name: "USA 326 (GSSAP)", op: "US Space Force", cat: "Military" },

  // ---- CATASTROPHIC FAILURE ----
  { norad: 41748, name: "INTELSAT 33E", op: "Intelsat/Boeing", cat: "Catastrophic Failure" },

  // ---- DEORBITED ----
  { norad: 26463, name: "CLUSTER 2 (SALSA)", op: "ESA", cat: "Deorbited" },

  // ---- DEBRIS ----
  { norad: 49863, name: "COSMOS 1408 DEB", op: "N/A (ASAT debris)", cat: "Debris" },
  { norad: 25730, name: "FENGYUN 1C DEB", op: "N/A (ASAT debris)", cat: "Debris" },

  // ---- CUBESATS ----
  { norad: 43793, name: "LEMUR-2 LUCKY", op: "Spire Global", cat: "CubeSat" },
  { norad: 47510, name: "FLOCK 4P-1", op: "Planet Labs", cat: "CubeSat" },
  { norad: 56205, name: "HAWK 8A", op: "HawkEye 360", cat: "CubeSat" },

  // ---- CHINESE MEGA-CONSTELLATIONS ----
  { norad: 60670, name: "QIANFAN-01", op: "Shanghai Spacecom", cat: "LEO Constellation" },
  { norad: 60671, name: "QIANFAN-02", op: "Shanghai Spacecom", cat: "LEO Constellation" },

  // ---- ADDITIONAL GEO ----
  { norad: 36131, name: "BADR-5", op: "Arabsat", cat: "GEO Comms" },
  { norad: 27509, name: "ANIK F1", op: "Telesat", cat: "GEO Comms" },
  { norad: 42741, name: "SGDC-1", op: "Telebras", cat: "GEO Comms" },
  { norad: 52933, name: "ASTRA 1P", op: "SES", cat: "GEO Comms" },
  { norad: 43632, name: "AMOS-17", op: "Spacecom", cat: "GEO Comms" },

  // ---- ADDITIONAL EARTH OBS ----
  { norad: 47948, name: "PLEIADES NEO 3", op: "Airbus DS", cat: "Earth Obs" },
  { norad: 51938, name: "PLEIADES NEO 4", op: "Airbus DS", cat: "Earth Obs" },
  { norad: 53814, name: "WORLDVIEW LEGION 1", op: "Maxar", cat: "Earth Obs" },

  // ---- RELAY / DATA ----
  { norad: 56700, name: "TDRS-14", op: "NASA", cat: "GEO Comms" },
  { norad: 26052, name: "TDRS-8", op: "NASA", cat: "GEO Comms" },

  // ---- ADDITIONAL LEO ----
  { norad: 55066, name: "ARCTIC BROADBAND-1", op: "Telesat", cat: "LEO Constellation" },
  { norad: 43689, name: "AEOLUS", op: "ESA", cat: "Science" },
  { norad: 25338, name: "NOAA 15", op: "NOAA", cat: "Earth Obs" },
  { norad: 28654, name: "NOAA 18", op: "NOAA", cat: "Earth Obs" },

  // ---- ADDITIONAL SCIENCE ----
  { norad: 41240, name: "ASTRO-H (HITOMI)", op: "JAXA", cat: "Science" },
  { norad: 36119, name: "SDO", op: "NASA", cat: "Science" },

  // ---- MORE LEO CONSTELLATIONS ----
  { norad: 44235, name: "STARLINK-24", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 45360, name: "STARLINK-1327", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 46114, name: "STARLINK-1729", op: "SpaceX", cat: "LEO Constellation" },
  { norad: 48601, name: "ONEWEB-0263", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },
  { norad: 56718, name: "ONEWEB-0600", op: "OneWeb/Eutelsat", cat: "LEO Constellation" },

  // ---- MORE EARTH OBS ----
  { norad: 41335, name: "SENTINEL-1A", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 43600, name: "SENTINEL-3A", op: "ESA/Copernicus", cat: "Earth Obs" },
  { norad: 44383, name: "PRISMA", op: "ASI (Italy)", cat: "Earth Obs" },
  { norad: 49044, name: "COSMO-SKYMED SG-2", op: "ASI (Italy)", cat: "Earth Obs" },

  // ---- MORE GEO ----
  { norad: 39020, name: "ASTRA 2E", op: "SES", cat: "GEO Comms" },
  { norad: 33436, name: "EUTELSAT W3A", op: "Eutelsat", cat: "GEO Comms" },
  { norad: 44334, name: "JCSAT-18/KACIFIC-1", op: "SKY Perfect JSAT", cat: "GEO Comms" },
  { norad: 40424, name: "MUOS-3", op: "US Navy", cat: "Military" },
  { norad: 36868, name: "SBIRS GEO-1", op: "US Space Force", cat: "Military" },

  // ---- MORE NAVIGATION ----
  { norad: 40544, name: "GALILEO-FM4", op: "EU/ESA", cat: "Navigation" },
  { norad: 41175, name: "GALILEO-FM8", op: "EU/ESA", cat: "Navigation" },
  { norad: 36585, name: "BEIDOU G4", op: "China (CNSA)", cat: "Navigation" },
];

// Deduplicate by NORAD ID
const seen = new Set();
const UNIQUE_CATALOG = CATALOG.filter(s => {
  if (seen.has(s.norad)) return false;
  seen.add(s.norad);
  return true;
});

module.exports = { CATALOG: UNIQUE_CATALOG, STORIES };
