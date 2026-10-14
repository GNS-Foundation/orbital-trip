/**
 * Orbital TrIP — Live Data Pipeline
 * 
 * Fetches real TLE from CelesTrak GP API → SGP4 propagation → 
 * Ed25519 breadcrumb chains → trust scores → JSON output
 * 
 * Uses one bulk CelesTrak request per run and falls back to a
 * last-known-good TLE cache if CelesTrak is throttling or unreachable.
 * Never overwrites good output with empty or much-worse output.
 */

const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const satellite = require("satellite.js");
const nacl = require("tweetnacl");
const { CATALOG, STORIES } = require("./catalog");

// ============================================================
// CONFIG
// ============================================================
const PROPAGATION_HOURS = 72;
const INTERVAL_MINUTES = 30;
const CELESTRAK_API = "https://celestrak.org/NORAD/elements/gp.php";
const OUTPUT_PATH = process.env.ORBITAL_OUTPUT_PATH || path.join(__dirname, "..", "public", "data", "orbital_trip_data.json");

// Last-known-good TLE cache. Lives OUTSIDE public/ so it is never served.
// Survives cron runs within a container; mount a Railway volume at /app/data
// to make it survive redeploys too.
const TLE_CACHE_PATH = process.env.TLE_CACHE_PATH || path.join(__dirname, "..", "data", "tle_cache.json");

// CelesTrak throttles and then silently drops clients that hammer gp.php.
// One bulk request replaces 261 per-ID requests.
const BULK_GROUP = "active";
const BULK_TIMEOUT_MS = 60000;
const SINGLE_TIMEOUT_MS = 15000;
const MAX_SINGLE_FETCHES = 50;        // cap per run for IDs missing from the bulk set
const SINGLE_REFETCH_AFTER_H = 24;    // don't re-ask for a cached ID more than daily
const BREAKER_CONSECUTIVE_FAILS = 3;  // stop single fetches after N failures in a row
const MAX_TLE_AGE_DAYS = 14;          // SGP4 accuracy degrades; drop older cached TLEs
const MIN_RETAIN_RATIO = 0.5;         // refuse to overwrite output with < 50% of previous count

// Persistent keypairs — keyed by NORAD ID so keys survive restarts
// In production this would be a database; here we regenerate per process
const KEY_STORE = {};

// ============================================================
// TLE FETCHING
// ============================================================

function fetchUrl(url, timeout = SINGLE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout, headers: { "User-Agent": "orbital-trip/1.0 (+https://github.com/GNS-Foundation/orbital-trip)" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return fetchUrl(res.headers.location, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

/** Parse 2- or 3-line TLE text into { [noradId]: { tle1, tle2 } }. */
function parseTLEText(raw) {
  const out = {};
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < lines.length - 1; i++) {
    const l1 = lines[i], l2 = lines[i + 1];
    if (l1.startsWith("1 ") && l2.startsWith("2 ")) {
      const id = parseInt(l1.substring(2, 7), 10);
      if (Number.isFinite(id)) out[id] = { tle1: l1, tle2: l2 };
      i++;
    }
  }
  return out;
}

/** Epoch of a TLE as a Date (from line 1, cols 19-32). */
function tleEpoch(tle1) {
  const yy = parseInt(tle1.substring(18, 20), 10);
  const day = parseFloat(tle1.substring(20, 32));
  if (!Number.isFinite(yy) || !Number.isFinite(day)) return null;
  const year = yy < 57 ? 2000 + yy : 1900 + yy;
  return new Date(Date.UTC(year, 0, 1) + (day - 1) * 86400000);
}

function loadTLECache() {
  try { return JSON.parse(fs.readFileSync(TLE_CACHE_PATH, "utf8")); } catch (e) { return {}; }
}

function saveTLECache(cache) {
  try {
    fs.mkdirSync(path.dirname(TLE_CACHE_PATH), { recursive: true });
    const tmp = `${TLE_CACHE_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache));
    fs.renameSync(tmp, TLE_CACHE_PATH);
  } catch (e) {
    console.log(`  ! Could not persist TLE cache: ${e.message}`);
  }
}

/**
 * Fetch TLEs for the catalog with as few CelesTrak requests as possible:
 *   1. one bulk GROUP request, filtered locally;
 *   2. per-ID requests only for IDs still missing, capped, rate-limited,
 *      skipped if cached within 24h, and cut off by a circuit breaker.
 * Returns { fresh: {id: tle}, stats }.
 */
async function fetchTLEs(noradIds, cache) {
  const wanted = new Set(noradIds);
  const fresh = {};
  const stats = { bulk: "not attempted", single_attempted: 0, single_ok: 0, breaker_tripped: false };

  try {
    const raw = await fetchUrl(`${CELESTRAK_API}?GROUP=${BULK_GROUP}&FORMAT=tle`, BULK_TIMEOUT_MS);
    const all = parseTLEText(raw);
    for (const id of wanted) if (all[id]) fresh[id] = all[id];
    stats.bulk = `ok (${Object.keys(all).length} objects, ${Object.keys(fresh).length} in catalog)`;
  } catch (e) {
    stats.bulk = `failed: ${e.message}`;
  }

  // If the bulk call failed, CelesTrak is likely throttling us — don't pile on.
  if (stats.bulk.startsWith("failed")) return { fresh, stats };

  // cache._checked records the last per-ID lookup (hit or "No GP data found"),
  // so decayed/inactive IDs are not re-queried every run.
  const checked = cache._checked || (cache._checked = {});
  const now = Date.now();
  const missing = noradIds.filter(id => {
    if (fresh[id]) return false;
    const last = checked[id];
    return !(last && now - Date.parse(last) < SINGLE_REFETCH_AFTER_H * 3600000);
  }).slice(0, MAX_SINGLE_FETCHES);

  let consecutiveFails = 0;
  for (const id of missing) {
    if (consecutiveFails >= BREAKER_CONSECUTIVE_FAILS) { stats.breaker_tripped = true; break; }
    stats.single_attempted++;
    try {
      const parsed = parseTLEText(await fetchUrl(`${CELESTRAK_API}?CATNR=${id}&FORMAT=TLE`));
      if (parsed[id]) { fresh[id] = parsed[id]; stats.single_ok++; }
      checked[id] = new Date().toISOString();
      consecutiveFails = 0; // a 200 (even "No GP data found") means we're not blocked
    } catch (e) {
      consecutiveFails++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { fresh, stats };
}

// ============================================================
// SGP4 PROPAGATION
// ============================================================

function propagateSatellite(tle1, tle2) {
  let satrec;
  try {
    satrec = satellite.twoline2satrec(tle1, tle2);
  } catch (e) {
    return [];
  }

  const positions = [];
  const now = new Date();
  const start = new Date(now.getTime() - PROPAGATION_HOURS * 3600000);

  for (let t = start.getTime(); t <= now.getTime(); t += INTERVAL_MINUTES * 60000) {
    const date = new Date(t);
    const posVel = satellite.propagate(satrec, date);
    
    if (!posVel.position || posVel.position === false) continue;
    
    const eci = posVel.position;
    const vel = posVel.velocity;
    
    // Convert ECI to geodetic
    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(eci, gmst);
    
    const lat = satellite.degreesLat(geo.latitude);
    const lon = satellite.degreesLong(geo.longitude);
    const alt = geo.height; // km
    const spd = vel ? Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2) : 0;

    positions.push({
      t: date.toISOString().replace(/\.\d{3}Z$/, "Z"),
      lat: Math.round(lat * 1000) / 1000,
      lon: Math.round(lon * 1000) / 1000,
      alt: Math.round(alt * 10) / 10,
      spd: Math.round(spd * 100) / 100,
    });
  }

  return positions;
}

// ============================================================
// ED25519 BREADCRUMB CHAIN
// ============================================================

function getOrCreateKey(noradId) {
  if (!KEY_STORE[noradId]) {
    const kp = nacl.sign.keyPair();
    KEY_STORE[noradId] = kp;
  }
  return KEY_STORE[noradId];
}

function buildChain(positions, noradId) {
  const kp = getOrCreateKey(noradId);
  const pk = Buffer.from(kp.publicKey).toString("hex");
  
  let prev = null;
  const hashes = [];

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const crumb = JSON.stringify({
      i, id: pk.substring(0, 16),
      t: p.t, lat: p.lat, lon: p.lon, alt: p.alt,
      prev: prev || "genesis"
    });
    
    const msg = Buffer.from(crumb, "utf8");
    const sig = Buffer.from(nacl.sign.detached(msg, kp.secretKey)).toString("hex");
    const hash = crypto.createHash("sha256").update(`${crumb}:${sig}`).digest("hex");
    
    hashes.push(hash);
    prev = hash;
  }

  return {
    pk,
    len: hashes.length,
    genesis: hashes.length > 0 ? hashes[0].substring(0, 16) : "",
    head: hashes.length > 0 ? hashes[hashes.length - 1].substring(0, 16) : "",
  };
}

// ============================================================
// TRUST SCORING
// ============================================================

function computeTrust(cat, positions) {
  const n = positions.length;
  if (n < 2) return { total: 0, tier: "Seedling", consistency: 0, compliance: 0, maturity: 0, corroboration: 0, integrity: 0 };

  // Altitude deviations
  const devs = [];
  for (let i = 1; i < n; i++) {
    devs.push(Math.abs(positions[i].alt - positions[i - 1].alt));
  }
  const avgDev = devs.reduce((a, b) => a + b, 0) / devs.length;

  // Category-specific divisor (GEO should have near-zero deviation)
  const divisors = {
    "GEO Comms": 5, "GEO Weather": 5, "MEO Comms": 100, "Navigation": 200,
    "Suspicious": 2, "Debris": 50, "Catastrophic Failure": 10,
    "Deorbited": 100, "Military": 50,
  };
  const divisor = divisors[cat] || 80;
  const consistency = Math.round(35 * Math.max(0, 1 - avgDev / divisor) * 10) / 10;

  // Compliance by category
  const complianceMap = {
    "GEO Comms": 24, "GEO Weather": 24, "MEO Comms": 22, "Navigation": 23,
    "Station": 21, "Science": 20, "Earth Obs": 20,
    "LEO Constellation": 18, "CubeSat": 16,
    "Military": 15, "Suspicious": 4, "Debris": 0,
    "Catastrophic Failure": 2, "Deorbited": 22,
  };
  const compliance = complianceMap[cat] || 10;

  // Maturity (based on breadcrumb count)
  const maturity = Math.round(Math.min(20, n * 0.14) * 10) / 10;

  // Corroboration
  const corrMap = {
    "Debris": 3, "Suspicious": 7, "Station": 9,
    "GEO Comms": 8, "GEO Weather": 8, "MEO Comms": 8, "Navigation": 9,
    "Science": 8, "Military": 6, "Catastrophic Failure": 5,
    "Deorbited": 8, "CubeSat": 6,
  };
  const corroboration = corrMap[cat] || 8;

  const integrity = 10;
  const total = Math.round(Math.min(100, consistency + compliance + maturity + corroboration + integrity) * 10) / 10;

  const tier = total >= 85 ? "Odysseus" : total >= 70 ? "Voyager" : total >= 50 ? "Pathfinder" : total >= 30 ? "Explorer" : "Seedling";

  return { total, tier, consistency, compliance, maturity, corroboration, integrity };
}

// ============================================================
// MAIN PIPELINE
// ============================================================

async function runPipeline() {
  const startTime = Date.now();
  console.log("\n  ╔══════════════════════════════════════════╗");
  console.log("  ║  ORBITAL TrIP — Live Data Pipeline        ║");
  console.log("  ╚══════════════════════════════════════════╝\n");

  const noradIds = CATALOG.map(s => s.norad);
  console.log(`  Catalog: ${CATALOG.length} satellites`);

  // Fetch live TLE (bulk), then merge over the last-known-good cache
  console.log("  Fetching live TLE from CelesTrak...");
  const cache = loadTLECache();
  const { fresh, stats } = await fetchTLEs(noradIds, cache);
  const fetchedAt = new Date().toISOString();
  for (const [id, tle] of Object.entries(fresh)) cache[id] = { ...tle, fetched_at: fetchedAt };

  const maxAgeMs = MAX_TLE_AGE_DAYS * 86400000;
  const liveTLE = {};
  let fromCache = 0;
  for (const id of noradIds) {
    const c = cache[id];
    if (!c || !c.tle1) continue;
    const epoch = tleEpoch(c.tle1);
    if (epoch && Date.now() - epoch.getTime() > maxAgeMs) continue;
    liveTLE[id] = c;
    if (!fresh[id]) fromCache++;
  }
  saveTLECache(cache);

  const freshCount = Object.keys(fresh).length;
  console.log(`  Bulk:   ${stats.bulk}`);
  if (stats.single_attempted) console.log(`  Single: ${stats.single_ok}/${stats.single_attempted} recovered${stats.breaker_tripped ? " (breaker tripped)" : ""}`);
  console.log(`  ✓ Retrieved TLE for ${freshCount}/${CATALOG.length} satellites (+${fromCache} from cache)`);

  const source = freshCount > 0
    ? (fromCache > 0 ? "CelesTrak LIVE + cached TLE" : "CelesTrak LIVE")
    : (fromCache > 0 ? "Cached TLE (CelesTrak unavailable)" : "None (CelesTrak unavailable, no cache)");

  // Process each satellite
  const satellites = {};
  const leaderboard = [];
  let processed = 0;
  let failed = 0;

  for (const entry of CATALOG) {
    const tle = liveTLE[entry.norad];
    
    if (!tle) {
      // No fresh or cached TLE for this satellite
      failed++;
      continue;
    }

    const positions = propagateSatellite(tle.tle1, tle.tle2);
    if (positions.length < 2) {
      failed++;
      continue;
    }

    const chain = buildChain(positions, entry.norad);
    const trust = computeTrust(entry.cat, positions);

    // Build satellite record
    const record = {
      n: entry.norad,
      c: entry.cat,
      o: entry.op,
      p: positions.map(p => [p.lat, p.lon, p.alt, p.t]),
      trip: chain,
      t: trust,
    };

    // Add story metadata if present
    const story = STORIES[entry.norad];
    if (story) {
      record.story = story;
    }

    // Add insured flag if present
    if (entry.insured) {
      record.insured = true;
    }

    satellites[entry.name] = record;
    leaderboard.push({ name: entry.name, score: trust.total });
    processed++;
    
    // Progress indicator every 10 satellites
    if (processed % 10 === 0) {
      process.stdout.write(`  Processing: ${processed}/${CATALOG.length}\r`);
    }
  }

  // Sort leaderboard by trust score descending
  leaderboard.sort((a, b) => b.score - a.score);

  const output = {
    generated: new Date().toISOString(),
    source,
    satellite_count: processed,
    catalog_total: CATALOG.length,
    failed,
    tle_fresh: freshCount,
    tle_cached: fromCache,
    leaderboard: leaderboard.map(l => l.name),
    satellites,
  };

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Never replace good data with empty or much-worse data.
  let previousCount = 0;
  try { previousCount = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8")).satellite_count || 0; } catch (e) {}
  if (processed === 0 || (previousCount > 0 && processed < previousCount * MIN_RETAIN_RATIO)) {
    throw new Error(
      `Refusing to overwrite output: ${processed} satellites this run vs ${previousCount} previously ` +
      `(source: ${source}; bulk: ${stats.bulk})`
    );
  }

  const tmpPath = `${OUTPUT_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(output));
  fs.renameSync(tmpPath, OUTPUT_PATH);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeKB = Math.round(fs.statSync(OUTPUT_PATH).size / 1024);

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  Pipeline complete in ${elapsed}s`);
  console.log(`  Source:     ${source}`);
  console.log(`  Processed:  ${processed}/${CATALOG.length} satellites`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Stories:    ${Object.keys(STORIES).length}`);
  console.log(`  Insured:    ${Object.values(satellites).filter(s => s.insured).length}`);
  console.log(`  Output:     ${sizeKB} KB → ${OUTPUT_PATH}`);
  console.log(`  Top trust:  ${leaderboard[0]?.name || "N/A"} (${leaderboard[0]?.score || 0})`);
  console.log(`  ════════════════════════════════════════════\n`);

  return output;
}

module.exports = { runPipeline, _internal: { parseTLEText, tleEpoch, fetchTLEs } };

// Run standalone
if (require.main === module) {
  runPipeline().catch(console.error);
}
