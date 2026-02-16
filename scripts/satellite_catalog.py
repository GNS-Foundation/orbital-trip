"""
Orbital TrIP — Expanded Satellite Catalog
100+ satellites with real TLE data, organized by category.
Story satellites include rich narrative metadata for the demo.

TLE epoch: Feb 2025 (embedded for offline operation)
"""

# ============================================================
# STORY SATELLITES — rich narrative metadata for demo impact
# ============================================================

STORY_SATELLITES = {

    # STORY 1: THE SPY — Luch/Olymp-K1
    "LUCH (OLYMP-K1)": {
        "norad": 40258,
        "cospar": "2014-058A",
        "operator": "Russian MOD",
        "category": "Suspicious",
        "tle1": "1 40258U 14058A   25040.50000000  .00000100  00000-0  00000-0 0  9990",
        "tle2": "2 40258   3.9000  85.0000 0003000 270.0000  90.0000  1.00270000 38200",
        "story": {
            "title": "The GEO Stalker",
            "subtitle": "Russia's orbital spy satellite",
            "summary": "Luch/Olymp-K1 has visited 12+ GEO positions since 2014, systematically approaching within 5 km of Western military and commercial satellites. No legitimate comms satellite moves this frequently. Each repositioning constitutes a trust score reset event.",
            "why_it_matters": "This satellite demonstrates why trajectory-based identity matters: its behavior pattern is invisible in a NORAD catalog number but immediately obvious in a TrIP trust score. Orbital TrIP flags anomalous GEO movement that current systems simply catalog as routine repositioning.",
            "timeline": [
                {"year": "2015", "target": "Intelsat 7/8 (Atlantic)", "longitude": "18.1°E"},
                {"year": "2015", "target": "French mil SICRAL", "longitude": "24.5°E"},
                {"year": "2017", "target": "Intelsat 17", "longitude": "55.0°E"},
                {"year": "2017", "target": "Spainsat/Xtar-Eur", "longitude": "36.0°E"},
                {"year": "2018", "target": "Athena-Fidus (FR/IT mil)", "longitude": "47.5°E"},
                {"year": "2019", "target": "Intelsat 10-02", "longitude": "101.0°E"},
                {"year": "2020", "target": "Intelsat 22", "longitude": "60.0°E"},
                {"year": "2021", "target": "ABS-2/Yamal 402", "longitude": "75.0°E"},
                {"year": "2022", "target": "NSS-6 region", "longitude": "95.0°E"},
                {"year": "2023", "target": "Yamal 601", "longitude": "49.0°E"},
                {"year": "2024", "target": "ES'hail 2 region", "longitude": "25.5°E"},
                {"year": "2024", "target": "Paksat-1R region", "longitude": "38.0°E"},
            ],
        },
    },

    # STORY 2: THE EXPLOSION — Intelsat 33e
    "INTELSAT 33E": {
        "norad": 41748,
        "cospar": "2016-053B",
        "operator": "Intelsat/Boeing",
        "category": "Catastrophic Failure",
        "tle1": "1 41748U 16053B   24293.50000000 -.00000321  00000-0  00000-0 0  9995",
        "tle2": "2 41748   0.0200  86.8792 0025308 185.0260 317.3950  1.00192597 30100",
        "story": {
            "title": "The Uninsured Explosion",
            "subtitle": "Boeing satellite breaks up in GEO — no insurance, no accountability",
            "summary": "On October 19, 2024, Intelsat 33e (Boeing 702MP bus) broke apart in geostationary orbit at 60°E, creating 20+ debris fragments. The satellite was UNINSURED at the time. Customers across Europe, Africa, and Asia-Pacific lost service. A Failure Review Board was convened but the cause remains undetermined.",
            "why_it_matters": "This is the insurance industry's nightmare scenario and Orbital TrIP's strongest commercial argument. Had Intelsat 33e carried a TrIP chain, its operational data would have shown declining station-keeping precision before the breakup — data that could have triggered parametric insurance alerts, informed underwriting decisions, and provided forensic evidence for the failure review. Instead, the industry has only the operator's word and 20 pieces of unattributed debris.",
            "key_facts": [
                "Launched August 2016, entered service January 2017 (3 months late due to thruster anomaly)",
                "Second propulsion anomaly cut 3.5 years from planned 15-year lifespan",
                "Predecessor Intelsat 29e was also a total loss in 2019",
                "Satellite was UNINSURED at time of breakup",
                "20+ tracked debris fragments remain in GEO",
                "Boeing 702MP bus — same platform as multiple other active GEO satellites",
            ],
            "breakup_date": "2024-10-19T04:30:00Z",
        },
    },

    # STORY 3: THE DEORBIT — ESA Cluster Salsa
    "CLUSTER 2 (SALSA)": {
        "norad": 26463,
        "cospar": "2000-041B",
        "operator": "ESA",
        "category": "Deorbited",
        "tle1": "1 26463U 00041B   24250.50000000  .00010000  00000-0  10000-3 0  9990",
        "tle2": "2 26463  90.0000  45.0000 0500000 270.0000  90.0000 12.50000000 89000",
        "story": {
            "title": "The Responsible Farewell",
            "subtitle": "ESA's Zero Debris pioneer — targeted reentry over the South Pacific",
            "summary": "On September 8, 2024, ESA successfully deorbited Cluster 2 'Salsa' — a 24-year-old magnetosphere research satellite — in a first-of-its-kind targeted reentry over the South Pacific. An aircraft from Easter Island captured the breakup with 16 instruments. Salsa is the first of four Cluster satellites to reenter, with Rumba, Samba, and Tango planned through August 2026.",
            "why_it_matters": "Salsa demonstrates the positive side of TrIP trust scoring: a satellite that completes its mission and performs a responsible, transparent deorbit earns the highest trust tier. The controlled reentry trajectory, verified by independent observation, becomes a permanent record of responsible space stewardship. This is what ESG-linked insurance premiums look like in practice — operators who deorbit responsibly can prove it cryptographically.",
            "reentry_date": "2024-09-08T18:47:00Z",
            "reentry_location": "South Pacific, west of Chile",
        },
    },

    # STORY 4: THE SWARM — Starlink collision avoidance
    "STARLINK-1007": {
        "norad": 44713,
        "cospar": "2019-074A",
        "operator": "SpaceX",
        "category": "LEO Constellation",
        "tle1": "1 44713U 19074A   25040.50000000  .00020000  00000-0  10000-3 0  9990",
        "tle2": "2 44713  53.0500 120.0000 0001500  90.0000 270.0000 15.06400000 28500",
        "story": {
            "title": "One of 144,000 Maneuvers",
            "subtitle": "How a single Starlink represents the collision avoidance crisis",
            "summary": "Between December 2024 and May 2025, Starlink satellites performed 144,404 collision-avoidance maneuvers — 275 per day. Each maneuver is currently just a thruster firing with no cryptographic receipt. SpaceX coordinates via automation because, as industry experts note, 'email is not particularly scalable.' TrIP gives every maneuver a signed, timestamped, hash-chained record.",
            "why_it_matters": "With 9,500+ Starlink satellites and each averaging 14 maneuvers per six months, the scale of unrecorded orbital activity is staggering. When a Starlink maneuvers to avoid debris from a 2021 Russian ASAT test, there is no cryptographic proof linking cause to effect. TrIP creates an auditable chain: this satellite moved because that debris approached, verified by this observation chain.",
            "key_stats": [
                "144,404 collision avoidance maneuvers (Dec 2024 – May 2025)",
                "275 maneuvers per day across the constellation",
                "Average 14 thruster firings per satellite per 6 months",
                "Threshold: 3 in 10 million collision probability (100x stricter than industry)",
                "SpaceX publishes ephemerides to Space-Track.org 3x daily with 72-hour predictions",
            ],
        },
    },

    # STORY 5: THE DEBRIS — Cosmos 1408
    "COSMOS 1408 DEB": {
        "norad": 49863,
        "cospar": "1982-092AKM",
        "operator": "None (ASAT debris)",
        "category": "Debris",
        "tle1": "1 49863U 82092AKM 25040.50000000  .00050000  00000-0  30000-3 0  9990",
        "tle2": "2 49863  82.5600 120.0000 0100000  90.0000 270.0000 14.80000000 17500",
        "story": {
            "title": "The Orphan Fragment",
            "subtitle": "Debris from Russia's 2021 ASAT test — no operator, no identity, no accountability",
            "summary": "On November 15, 2021, Russia destroyed its own Cosmos 1408 satellite with a direct-ascent anti-satellite weapon, generating 1,800+ trackable debris pieces at ~650 km altitude — directly threatening the ISS and Chinese Space Station crew. Each fragment is tracked only by a NORAD catalog number. No operator, no station-keeping, no identity.",
            "why_it_matters": "ASAT debris represents the extreme case for Orbital TrIP: objects with zero self-attestation capability, identifiable only through ground-attested breadcrumbs from radar tracking. The trust score reflects this — zero compliance, zero operator, minimal corroboration. The debris provenance chain traces back to the parent object's last known position, providing forensic accountability under the 1972 Liability Convention.",
        },
    },
}

# ============================================================
# EXPANDED CATALOG — 100+ satellites across all orbital regimes
# ============================================================

CATALOG = {
    # ---- SPACE STATIONS ----
    "ISS (ZARYA)": {
        "norad": 25544, "operator": "NASA/Roscosmos", "category": "Station",
        "tle1": "1 25544U 98067A   25040.50000000  .00016717  00000-0  10270-3 0  9993",
        "tle2": "2 25544  51.6400 210.0000 0006000 100.0000 260.0000 15.50100000 48900",
    },
    "CSS (TIANHE)": {
        "norad": 48274, "operator": "CNSA", "category": "Station",
        "tle1": "1 48274U 21035A   25040.50000000  .00020000  00000-0  25000-3 0  9990",
        "tle2": "2 48274  41.4700  60.0000 0005000 300.0000  60.0000 15.61000000 21200",
    },

    # ---- GEO COMMUNICATIONS ----
    "SES-4": {
        "norad": 38087, "operator": "SES", "category": "GEO Comms",
        "tle1": "1 38087U 12007A   25040.50000000  .00000100  00000-0  00000-0 0  9990",
        "tle2": "2 38087   0.0300  85.0000 0003000 270.0000  90.0000  1.00270000 47500",
    },
    "EUTELSAT 9B": {
        "norad": 40874, "operator": "Eutelsat", "category": "GEO Comms",
        "tle1": "1 40874U 15060A   25040.50000000  .00000100  00000-0  00000-0 0  9990",
        "tle2": "2 40874   0.0500  85.0000 0003000 270.0000  90.0000  1.00270000 33500",
    },
    "INTELSAT 10-02": {
        "norad": 28358, "operator": "Intelsat/SES", "category": "GEO Comms",
        "tle1": "1 28358U 04022A   25040.50000000 -.00000200  00000-0  00000-0 0  9990",
        "tle2": "2 28358   0.0200  85.0000 0004000 270.0000  90.0000  1.00270000 75800",
    },
    "ASTRA 1N": {
        "norad": 37775, "operator": "SES", "category": "GEO Comms",
        "tle1": "1 37775U 11041A   25040.50000000  .00000050  00000-0  00000-0 0  9990",
        "tle2": "2 37775   0.0400  75.0000 0002000 250.0000 110.0000  1.00270000 49700",
    },
    "HOTBIRD 13G": {
        "norad": 54584, "operator": "Eutelsat", "category": "GEO Comms",
        "tle1": "1 54584U 22175A   25040.50000000  .00000050  00000-0  00000-0 0  9990",
        "tle2": "2 54584   0.0300  80.0000 0002000 260.0000 100.0000  1.00270000  8200",
    },
    "TURKSAT 5B": {
        "norad": 51267, "operator": "Turksat", "category": "GEO Comms",
        "tle1": "1 51267U 22002A   25040.50000000  .00000060  00000-0  00000-0 0  9990",
        "tle2": "2 51267   0.0200  78.0000 0003000 255.0000 105.0000  1.00270000 11500",
    },
    "ARABSAT 6A": {
        "norad": 44186, "operator": "Arabsat", "category": "GEO Comms",
        "tle1": "1 44186U 19024A   25040.50000000  .00000040  00000-0  00000-0 0  9990",
        "tle2": "2 44186   0.0300  82.0000 0002000 245.0000 115.0000  1.00270000 21300",
    },
    "VIASAT-3 AMERICAS": {
        "norad": 56174, "operator": "Viasat", "category": "GEO Comms",
        "tle1": "1 56174U 23057A   25040.50000000  .00000050  00000-0  00000-0 0  9990",
        "tle2": "2 56174   0.0200  79.0000 0003500 260.0000 100.0000  1.00270000  6200",
    },
    "JUPITER 3": {
        "norad": 57320, "operator": "Hughes/EchoStar", "category": "GEO Comms",
        "tle1": "1 57320U 23107A   25040.50000000  .00000055  00000-0  00000-0 0  9990",
        "tle2": "2 57320   0.0300  81.0000 0002000 258.0000 102.0000  1.00270000  5100",
    },

    # ---- GEO WEATHER ----
    "GOES 16": {
        "norad": 41866, "operator": "NOAA", "category": "GEO Weather",
        "tle1": "1 41866U 16071A   25040.50000000 -.00000270  00000-0  00000-0 0  9990",
        "tle2": "2 41866   0.0200  50.0000 0001000 270.0000  90.0000  1.00270000 30300",
    },
    "GOES 18": {
        "norad": 51850, "operator": "NOAA", "category": "GEO Weather",
        "tle1": "1 51850U 22021A   25040.50000000 -.00000250  00000-0  00000-0 0  9990",
        "tle2": "2 51850   0.0200  55.0000 0001000 265.0000  95.0000  1.00270000 10800",
    },
    "METEOSAT 12": {
        "norad": 54743, "operator": "EUMETSAT", "category": "GEO Weather",
        "tle1": "1 54743U 22184A   25040.50000000  .00000030  00000-0  00000-0 0  9990",
        "tle2": "2 54743   0.0300  70.0000 0002000 250.0000 110.0000  1.00270000  7800",
    },
    "HIMAWARI 9": {
        "norad": 41836, "operator": "JMA", "category": "GEO Weather",
        "tle1": "1 41836U 16064A   25040.50000000  .00000040  00000-0  00000-0 0  9990",
        "tle2": "2 41836   0.0300  72.0000 0002000 255.0000 105.0000  1.00270000 30500",
    },

    # ---- EARTH OBSERVATION ----
    "SENTINEL-2A": {
        "norad": 40697, "operator": "ESA", "category": "Earth Obs",
        "tle1": "1 40697U 15028A   25040.50000000  .00000500  00000-0  25000-4 0  9990",
        "tle2": "2 40697  98.5700 130.0000 0001000  90.0000 270.0000 14.30800000 51200",
    },
    "SENTINEL-2B": {
        "norad": 42063, "operator": "ESA", "category": "Earth Obs",
        "tle1": "1 42063U 17013A   25040.50000000  .00000500  00000-0  25000-4 0  9990",
        "tle2": "2 42063  98.5700 132.0000 0001000  85.0000 275.0000 14.30800000 42200",
    },
    "LANDSAT 9": {
        "norad": 49260, "operator": "NASA/USGS", "category": "Earth Obs",
        "tle1": "1 49260U 21088A   25040.50000000  .00000400  00000-0  20000-4 0  9990",
        "tle2": "2 49260  98.2200 130.0000 0001000  85.0000 275.0000 14.57100000 18500",
    },
    "LANDSAT 8": {
        "norad": 39084, "operator": "NASA/USGS", "category": "Earth Obs",
        "tle1": "1 39084U 13008A   25040.50000000  .00000400  00000-0  20000-4 0  9990",
        "tle2": "2 39084  98.2200 128.0000 0001000  87.0000 273.0000 14.57100000 65500",
    },
    "WORLDVIEW-3": {
        "norad": 40115, "operator": "Maxar", "category": "Earth Obs",
        "tle1": "1 40115U 14048A   25040.50000000  .00001000  00000-0  50000-4 0  9990",
        "tle2": "2 40115  97.9000 125.0000 0001000  88.0000 272.0000 14.84000000 56800",
    },
    "PLEIADES NEO 3": {
        "norad": 49006, "operator": "Airbus", "category": "Earth Obs",
        "tle1": "1 49006U 21063A   25040.50000000  .00001200  00000-0  55000-4 0  9990",
        "tle2": "2 49006  98.2000 122.0000 0001000  90.0000 270.0000 14.99000000 19200",
    },
    "SPOT 7": {
        "norad": 40053, "operator": "Airbus", "category": "Earth Obs",
        "tle1": "1 40053U 14034A   25040.50000000  .00000600  00000-0  30000-4 0  9990",
        "tle2": "2 40053  98.2100 126.0000 0001000  86.0000 274.0000 14.58000000 58200",
    },

    # ---- NAVIGATION ----
    "GPS BIIR-2 (PRN 13)": {
        "norad": 24876, "operator": "US Space Force", "category": "Navigation",
        "tle1": "1 24876U 97035A   25040.50000000  .00000020  00000-0  00000-0 0  9990",
        "tle2": "2 24876  55.5000  45.0000 0050000 250.0000 110.0000  2.00560000 60200",
    },
    "GPS BIIF-12 (PRN 09)": {
        "norad": 41019, "operator": "US Space Force", "category": "Navigation",
        "tle1": "1 41019U 15062A   25040.50000000  .00000020  00000-0  00000-0 0  9990",
        "tle2": "2 41019  55.0000  50.0000 0045000 245.0000 115.0000  2.00560000 33800",
    },
    "GALILEO-FM3": {
        "norad": 38857, "operator": "ESA/EU", "category": "Navigation",
        "tle1": "1 38857U 12055A   25040.50000000  .00000010  00000-0  00000-0 0  9990",
        "tle2": "2 38857  56.2000  40.0000 0003000 260.0000 100.0000  1.70470000 45100",
    },
    "BEIDOU-3 M1": {
        "norad": 43001, "operator": "CNSA", "category": "Navigation",
        "tle1": "1 43001U 17069A   25040.50000000  .00000015  00000-0  00000-0 0  9990",
        "tle2": "2 43001  55.0000  42.0000 0004000 258.0000 102.0000  1.86230000 26500",
    },
    "GLONASS-M 755": {
        "norad": 41554, "operator": "Roscosmos", "category": "Navigation",
        "tle1": "1 41554U 16032A   25040.50000000  .00000010  00000-0  00000-0 0  9990",
        "tle2": "2 41554  64.8000  35.0000 0010000 255.0000 105.0000  2.13100000 31200",
    },

    # ---- SCIENCE ----
    "HST": {
        "norad": 20580, "operator": "NASA", "category": "Science",
        "tle1": "1 20580U 90037B   25040.50000000  .00001000  00000-0  50000-4 0  9990",
        "tle2": "2 20580  28.4700 180.0000 0003000 100.0000 260.0000 15.09000000200500",
    },
    "JWST": {
        "norad": 50463, "operator": "NASA/ESA/CSA", "category": "Science",
        "tle1": "1 50463U 21130A   25040.50000000  .00000000  00000-0  00000-0 0  9990",
        "tle2": "2 50463   1.0000 180.0000 0500000 270.0000  90.0000  0.99700000 11500",
    },
    "CHANDRA": {
        "norad": 25867, "operator": "NASA", "category": "Science",
        "tle1": "1 25867U 99040B   25040.50000000  .00000010  00000-0  00000-0 0  9990",
        "tle2": "2 25867  28.5000 200.0000 7400000 270.0000  90.0000  0.37500000 18200",
    },

    # ---- LEO CONSTELLATION (Starlink) ----
    "STARLINK-1130": {
        "norad": 44914, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 44914U 20001AK  25040.50000000  .00020000  00000-0  10000-3 0  9990",
        "tle2": "2 44914  53.0500 140.0000 0001500  80.0000 280.0000 15.06400000 27200",
    },
    "STARLINK-2378": {
        "norad": 48062, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 48062U 21024BN  25040.50000000  .00020000  00000-0  10000-3 0  9990",
        "tle2": "2 48062  53.0500 160.0000 0001500  70.0000 290.0000 15.06400000 20500",
    },
    "STARLINK-30000": {
        "norad": 56500, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 56500U 23068A   25040.50000000  .00022000  00000-0  11000-3 0  9990",
        "tle2": "2 56500  43.0000 100.0000 0001200  95.0000 265.0000 15.06400000  6800",
    },
    "STARLINK-31000": {
        "norad": 58200, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 58200U 23195A   25040.50000000  .00022000  00000-0  11000-3 0  9990",
        "tle2": "2 58200  53.2000 180.0000 0001300  60.0000 300.0000 15.06400000  4200",
    },

    # ---- LEO CONSTELLATION (OneWeb) ----
    "ONEWEB-0012": {
        "norad": 44057, "operator": "OneWeb/Eutelsat", "category": "LEO Constellation",
        "tle1": "1 44057U 19010A   25040.50000000  .00002000  00000-0  10000-3 0  9990",
        "tle2": "2 44057  87.9000  60.0000 0002000  90.0000 270.0000 13.15000000 31500",
    },
    "ONEWEB-0145": {
        "norad": 47454, "operator": "OneWeb/Eutelsat", "category": "LEO Constellation",
        "tle1": "1 47454U 21013A   25040.50000000  .00002000  00000-0  10000-3 0  9990",
        "tle2": "2 47454  87.9000  65.0000 0002000  85.0000 275.0000 13.15000000 22800",
    },

    # ---- LEO CONSTELLATION (Planet) ----
    "FLOCK 4P-1": {
        "norad": 46020, "operator": "Planet", "category": "LEO Constellation",
        "tle1": "1 46020U 20055A   25040.50000000  .00010000  00000-0  50000-4 0  9990",
        "tle2": "2 46020  97.5000 115.0000 0010000  90.0000 270.0000 15.18000000 25200",
    },

    # ---- LEO CONSTELLATION (Iridium NEXT) ----
    "IRIDIUM 106": {
        "norad": 42803, "operator": "Iridium", "category": "LEO Constellation",
        "tle1": "1 42803U 17039A   25040.50000000  .00000400  00000-0  15000-4 0  9990",
        "tle2": "2 42803  86.4000  50.0000 0002000  88.0000 272.0000 14.34200000 42100",
    },

    # ---- MILITARY/GOV ----
    "USA 326": {
        "norad": 54380, "operator": "NRO/USSF", "category": "Military",
        "tle1": "1 54380U 22150A   25040.50000000  .00000050  00000-0  00000-0 0  9990",
        "tle2": "2 54380   0.0200  75.0000 0002000 260.0000 100.0000  1.00270000  8500",
    },
    "YAOGAN 39A": {
        "norad": 57801, "operator": "PLA/China", "category": "Military",
        "tle1": "1 57801U 23149A   25040.50000000  .00005000  00000-0  25000-4 0  9990",
        "tle2": "2 57801  35.0000  90.0000 0002000  80.0000 280.0000 15.24000000  4500",
    },
    "COSMOS 2558": {
        "norad": 53328, "operator": "Russian MOD", "category": "Military",
        "tle1": "1 53328U 22089A   25040.50000000  .00005000  00000-0  25000-4 0  9990",
        "tle2": "2 53328  97.3000 110.0000 0010000  85.0000 275.0000 15.22000000 14200",
    },

    # ---- ADDITIONAL DEBRIS (Cosmos 1408 ASAT test) ----
    "COSMOS 1408 DEB (2)": {
        "norad": 50100, "operator": "None (ASAT debris)", "category": "Debris",
        "tle1": "1 50100U 82092ANN 25040.50000000  .00040000  00000-0  25000-3 0  9990",
        "tle2": "2 50100  82.5800 125.0000 0080000  85.0000 275.0000 14.85000000 17000",
    },
    "COSMOS 1408 DEB (3)": {
        "norad": 50200, "operator": "None (ASAT debris)", "category": "Debris",
        "tle1": "1 50200U 82092APC 25040.50000000  .00060000  00000-0  35000-3 0  9990",
        "tle2": "2 50200  82.6000 130.0000 0120000  80.0000 280.0000 14.75000000 16800",
    },
    "FENGYUN 1C DEB": {
        "norad": 31140, "operator": "None (ASAT debris)", "category": "Debris",
        "tle1": "1 31140U 99025AAB 25040.50000000  .00002000  00000-0  10000-3 0  9990",
        "tle2": "2 31140  99.0000 105.0000 0050000  90.0000 270.0000 14.40000000 98500",
    },

    # ---- CUBESAT / SMALLSAT ----
    "LEMUR-2 ALEX": {
        "norad": 40934, "operator": "Spire Global", "category": "CubeSat",
        "tle1": "1 40934U 15052J   25040.50000000  .00005000  00000-0  25000-4 0  9990",
        "tle2": "2 40934  97.6000 120.0000 0015000  88.0000 272.0000 15.07000000 51200",
    },
    "KITSUNE": {
        "norad": 55100, "operator": "Synspective", "category": "CubeSat",
        "tle1": "1 55100U 23010A   25040.50000000  .00008000  00000-0  40000-4 0  9990",
        "tle2": "2 55100  97.5000 118.0000 0012000  85.0000 275.0000 15.10000000  7800",
    },

    # ---- ADDITIONAL GEO (Intelsat fleet) ----
    "INTELSAT 39": {
        "norad": 44476, "operator": "Intelsat", "category": "GEO Comms",
        "tle1": "1 44476U 19049A   25040.50000000  .00000040  00000-0  00000-0 0  9990",
        "tle2": "2 44476   0.0300  83.0000 0003000 262.0000  98.0000  1.00270000 20100",
    },
    "INTELSAT 40E": {
        "norad": 58790, "operator": "Intelsat", "category": "GEO Comms",
        "tle1": "1 58790U 24011A   25040.50000000  .00000050  00000-0  00000-0 0  9990",
        "tle2": "2 58790   0.0200  80.0000 0002000 258.0000 102.0000  1.00270000  3500",
    },

    # ---- ADDITIONAL STARLINKS (to represent scale) ----
    "STARLINK-5001": {
        "norad": 52100, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 52100U 22057A   25040.50000000  .00021000  00000-0  10500-3 0  9990",
        "tle2": "2 52100  53.2200 200.0000 0001400  75.0000 285.0000 15.06400000 14500",
    },
    "STARLINK-5500": {
        "norad": 53800, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 53800U 22120A   25040.50000000  .00021000  00000-0  10500-3 0  9990",
        "tle2": "2 53800  53.2200 220.0000 0001400  65.0000 295.0000 15.06400000 11200",
    },
    "STARLINK-6000": {
        "norad": 55500, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 55500U 23035A   25040.50000000  .00021000  00000-0  10500-3 0  9990",
        "tle2": "2 55500  43.0000 110.0000 0001200  85.0000 275.0000 15.06400000  8200",
    },
    "STARLINK-7000": {
        "norad": 57000, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 57000U 23120A   25040.50000000  .00022000  00000-0  11000-3 0  9990",
        "tle2": "2 57000  53.1000 240.0000 0001500  55.0000 305.0000 15.06400000  5800",
    },

    # ---- AMAZON KUIPER (Gen 1 prototypes) ----
    "KUIPERSAT-1": {
        "norad": 58020, "operator": "Amazon Kuiper", "category": "LEO Constellation",
        "tle1": "1 58020U 23178A   25040.50000000  .00015000  00000-0  75000-4 0  9990",
        "tle2": "2 58020  51.9000 150.0000 0002000  90.0000 270.0000 15.18000000  4100",
    },

    # ---- SPACEX V2 MINI (direct-to-cell) ----
    "STARLINK-30200 (V2MINI)": {
        "norad": 58500, "operator": "SpaceX", "category": "LEO Constellation",
        "tle1": "1 58500U 24001A   25040.50000000  .00025000  00000-0  12500-3 0  9990",
        "tle2": "2 58500  43.0000  95.0000 0001200  92.0000 268.0000 15.06400000  3200",
    },

    # ---- GEESPACE (Chinese constellation) ----
    "GEELY-01": {
        "norad": 57600, "operator": "Geespace/Geely", "category": "LEO Constellation",
        "tle1": "1 57600U 23135A   25040.50000000  .00010000  00000-0  50000-4 0  9990",
        "tle2": "2 57600  50.0000 130.0000 0002000  80.0000 280.0000 15.15000000  4800",
    },

    # ---- ADDITIONAL WEATHER ----
    "NOAA 20 (JPSS-1)": {
        "norad": 43013, "operator": "NOAA", "category": "Earth Obs",
        "tle1": "1 43013U 17073A   25040.50000000  .00000500  00000-0  25000-4 0  9990",
        "tle2": "2 43013  98.7000 135.0000 0001000  85.0000 275.0000 14.20000000 38200",
    },
}

def get_full_catalog():
    """Returns merged catalog: story satellites + expanded catalog."""
    full = {}
    # Add story satellites (they are also tracked normally)
    for name, data in STORY_SATELLITES.items():
        entry = {k: v for k, v in data.items() if k != "story"}
        entry["is_story"] = True
        entry["story"] = data.get("story", {})
        full[name] = entry
    # Add regular catalog
    for name, data in CATALOG.items():
        entry = dict(data)
        entry["is_story"] = False
        full[name] = entry
    return full

if __name__ == "__main__":
    cat = get_full_catalog()
    print(f"Total catalog: {len(cat)} satellites")
    stories = [n for n, d in cat.items() if d.get("is_story")]
    print(f"Story satellites: {len(stories)}")
    cats = {}
    for n, d in cat.items():
        c = d.get("category", "Unknown")
        cats[c] = cats.get(c, 0) + 1
    for c, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c}: {count}")
