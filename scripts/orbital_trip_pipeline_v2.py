#!/usr/bin/env python3
"""
Orbital TrIP — Phase 1 Enhanced Pipeline
Processes 61+ satellites with real TLE data via SGP4,
generates Ed25519 breadcrumb chains, computes trust scores,
and outputs enriched JSON for the dashboard.

Usage:
    python3 orbital_trip_pipeline_v2.py [--output PATH]
"""

import json, hashlib, math, sys, os
from datetime import datetime, timezone, timedelta
from sgp4.api import Satrec, WGS72
from nacl.signing import SigningKey
from satellite_catalog import get_full_catalog, STORY_SATELLITES

# ============================================================
# CONFIG
# ============================================================
PROPAGATION_HOURS = 72
INTERVAL_MINUTES = 30
OUTPUT_PATH = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--output" else "orbital_trip_data_v2.json"

# ============================================================
# SGP4 PROPAGATION
# ============================================================
def propagate_satellite(tle1, tle2, hours=PROPAGATION_HOURS, interval=INTERVAL_MINUTES):
    """Propagate a satellite using SGP4 and return position array."""
    try:
        sat = Satrec.twoline2rv(tle1, tle2, WGS72)
    except Exception as e:
        print(f"  [WARN] TLE parse error: {e}")
        return []

    positions = []
    now = datetime(2025, 2, 9, 0, 0, 0, tzinfo=timezone.utc)
    start = now - timedelta(hours=hours)

    for step in range(int(hours * 60 / interval) + 1):
        t = start + timedelta(minutes=step * interval)
        jd = (t - datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)).total_seconds() / 86400.0 + 2451545.0
        fr = 0.0

        e, r, v = sat.sgp4(jd, fr)
        if e != 0:
            continue

        x, y, z = r  # km in TEME frame
        alt = math.sqrt(x*x + y*y + z*z) - 6371.0

        # TEME to lat/lon (simplified)
        gmst = 4.894961212 + 6.300388099 * (jd - 2451545.0)
        lon_rad = math.atan2(y, x) - gmst
        lat_rad = math.atan2(z, math.sqrt(x*x + y*y))

        lat = math.degrees(lat_rad)
        lon = math.degrees(lon_rad) % 360
        if lon > 180: lon -= 360

        positions.append({
            "ts": t.isoformat(),
            "lat": round(lat, 4),
            "lon": round(lon, 4),
            "alt": round(alt, 1),
        })

    return positions


# ============================================================
# ED25519 BREADCRUMB CHAIN
# ============================================================
def generate_breadcrumb_chain(name, positions):
    """Generate Ed25519-signed breadcrumb chain from positions."""
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key
    public_key_hex = verify_key.encode().hex()

    chain = []
    prev_hash = "0" * 64  # genesis

    for i, pos in enumerate(positions):
        breadcrumb = {
            "i": i,
            "id": public_key_hex,
            "ts": pos["ts"],
            "lat": pos["lat"],
            "lon": pos["lon"],
            "alt": pos["alt"],
            "prev": prev_hash,
        }

        content = json.dumps(breadcrumb, sort_keys=True)
        bc_hash = hashlib.sha256(content.encode()).hexdigest()
        signature = signing_key.sign(content.encode()).signature.hex()

        breadcrumb["hash"] = bc_hash
        breadcrumb["sig"] = signature[:32]  # truncate for storage
        prev_hash = bc_hash
        chain.append(breadcrumb)

    return {
        "public_key": public_key_hex,
        "chain_length": len(chain),
        "genesis_hash": chain[0]["hash"] if chain else None,
        "head_hash": chain[-1]["hash"] if chain else None,
        "chain": chain,
    }


# ============================================================
# TRUST SCORING
# ============================================================
def compute_trust_score(name, positions, category, is_story=False, story_data=None):
    """
    5-component trust score adapted to orbital mechanics.
    """

    # 1. TRAJECTORY CONSISTENCY (35%)
    if not positions:
        consistency = 0
    else:
        alts = [p["alt"] for p in positions]
        mean_alt = sum(alts) / len(alts)
        std_alt = math.sqrt(sum((a - mean_alt)**2 for a in alts) / len(alts)) if len(alts) > 1 else 0

        if category in ("GEO Comms", "GEO Weather"):
            consistency = max(0, 35 - (std_alt / 2))
        elif category == "Suspicious":
            # Luch gets penalized for inclination anomaly
            lats = [abs(p["lat"]) for p in positions]
            max_lat = max(lats) if lats else 0
            consistency = max(0, 35 - (max_lat * 3) - (std_alt / 2))
        elif category == "Catastrophic Failure":
            consistency = 5  # Broken satellite
        elif category == "Deorbited":
            consistency = 25  # Was consistent before deorbit
        elif category == "Debris":
            consistency = max(0, 35 - (std_alt / 5))
        elif category in ("Navigation",):
            consistency = max(0, 35 - (std_alt / 10))
        elif category in ("Station",):
            consistency = max(0, 33 - (std_alt / 3))
        elif category in ("Science",):
            consistency = max(0, 32 - (std_alt / 5))
        else:  # LEO constellation, earth obs, cubesat
            consistency = max(0, 33 - (std_alt / 5))

    # 2. OPERATIONAL COMPLIANCE (25%)
    compliance_map = {
        "GEO Comms": 24, "GEO Weather": 24, "Navigation": 23,
        "Station": 21, "Science": 21, "Earth Obs": 20,
        "LEO Constellation": 18, "CubeSat": 16, "Military": 15,
        "Suspicious": 4, "Catastrophic Failure": 2, "Deorbited": 22,
        "Debris": 0,
    }
    compliance = compliance_map.get(category, 10)

    # 3. CHAIN MATURITY (20%)
    chain_len = len(positions)
    maturity = min(20, chain_len / 7.5)  # Max at ~150 breadcrumbs

    # 4. OBSERVATION CORROBORATION (10%)
    corroboration_map = {
        "Station": 9, "GEO Comms": 8, "GEO Weather": 8,
        "Navigation": 8, "Science": 8, "Earth Obs": 7,
        "LEO Constellation": 7, "CubeSat": 5, "Military": 4,
        "Suspicious": 7, "Catastrophic Failure": 6, "Deorbited": 6,
        "Debris": 3,
    }
    corroboration = corroboration_map.get(category, 5)

    # 5. CHAIN INTEGRITY (10%)
    integrity = 10  # All valid by construction

    total = round(consistency + compliance + maturity + corroboration + integrity, 1)
    total = min(100, max(0, total))

    # Tier assignment
    if total >= 85: tier = "Odysseus"
    elif total >= 70: tier = "Voyager"
    elif total >= 50: tier = "Pathfinder"
    elif total >= 30: tier = "Explorer"
    else: tier = "Seedling"

    return {
        "total": total,
        "tier": tier,
        "components": {
            "consistency": round(consistency, 1),
            "compliance": round(compliance, 1),
            "maturity": round(maturity, 1),
            "corroboration": round(corroboration, 1),
            "integrity": round(integrity, 1),
        }
    }


# ============================================================
# MAIN PIPELINE
# ============================================================
def run_pipeline():
    print("\n  ╔══════════════════════════════════════════╗")
    print("  ║  ORBITAL TrIP — Phase 1 Pipeline v2      ║")
    print("  ║  Enhanced Catalog + Story Satellites       ║")
    print("  ╚══════════════════════════════════════════╝\n")

    catalog = get_full_catalog()
    print(f"  Processing {len(catalog)} satellites...\n")

    results = {}
    failed = 0

    for name, data in catalog.items():
        tle1 = data.get("tle1", "")
        tle2 = data.get("tle2", "")

        if not tle1 or not tle2:
            print(f"  [SKIP] {name}: no TLE data")
            failed += 1
            continue

        # Propagate
        positions = propagate_satellite(tle1, tle2)
        if not positions:
            print(f"  [FAIL] {name}: SGP4 propagation failed")
            failed += 1
            continue

        # Generate breadcrumb chain
        trip_data = generate_breadcrumb_chain(name, positions)

        # Compute trust score
        trust = compute_trust_score(
            name, positions, data["category"],
            is_story=data.get("is_story", False),
            story_data=data.get("story"),
        )

        # Compact position data (lat, lon, alt only — timestamps reconstructable)
        compact_positions = [[p["lat"], p["lon"], p["alt"]] for p in positions]

        # Build result entry
        entry = {
            "n": data["norad"],
            "c": data["category"],
            "o": data["operator"],
            "p": compact_positions,
            "t": {
                "total": trust["total"],
                "tier": trust["tier"],
                "consistency": trust["components"]["consistency"],
                "compliance": trust["components"]["compliance"],
                "maturity": trust["components"]["maturity"],
                "corroboration": trust["components"]["corroboration"],
                "integrity": trust["components"]["integrity"],
            },
            "trip": {
                "pk": trip_data["public_key"],
                "len": trip_data["chain_length"],
                "genesis": trip_data["genesis_hash"],
                "head": trip_data["head_hash"],
            },
        }

        # Add story metadata if applicable
        if data.get("is_story") and data.get("story"):
            entry["story"] = data["story"]

        results[name] = entry
        tier_icon = {"Odysseus": "🟢", "Voyager": "🔵", "Pathfinder": "🟡", "Explorer": "🟠", "Seedling": "🔴"}.get(trust["tier"], "⚪")
        story_tag = " ★" if data.get("is_story") else ""
        print(f"  {tier_icon} {trust['total']:5.1f} [{trust['tier']:10}] {name}{story_tag}")

    # Sort by trust score for leaderboard
    sorted_names = sorted(results.keys(), key=lambda n: results[n]["t"]["total"], reverse=True)

    output = {
        "version": "0.2.0",
        "generated": datetime.now(timezone.utc).isoformat(),
        "pipeline": "orbital-trip-phase1",
        "propagation": {
            "hours": PROPAGATION_HOURS,
            "interval_minutes": INTERVAL_MINUTES,
            "model": "SGP4/WGS72",
            "tle_epoch": "Feb 2025 (embedded)",
        },
        "crypto": {
            "signing": "Ed25519",
            "hashing": "SHA-256",
            "chain": "hash-linked breadcrumbs",
        },
        "stats": {
            "total_satellites": len(results),
            "story_satellites": len([n for n, d in results.items() if "story" in d]),
            "categories": {},
            "tiers": {},
            "failed": failed,
        },
        "leaderboard": sorted_names,
        "satellites": results,
    }

    # Compute stats
    for name, data in results.items():
        cat = data["c"]
        tier = data["t"]["tier"]
        output["stats"]["categories"][cat] = output["stats"]["categories"].get(cat, 0) + 1
        output["stats"]["tiers"][tier] = output["stats"]["tiers"].get(tier, 0) + 1

    # Write output
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"\n  ✓ Output: {OUTPUT_PATH} ({file_size // 1024} KB)")
    print(f"  ✓ Satellites: {len(results)} processed, {failed} failed")
    print(f"  ✓ Story satellites: {output['stats']['story_satellites']}")
    print(f"  ✓ Tiers: {output['stats']['tiers']}")
    print()

    return output


if __name__ == "__main__":
    run_pipeline()
