#!/usr/bin/env node
// Pipeline resilience tests: stubs CelesTrak to cover healthy, throttled,
// cold-cache, breaker and stale-cache cases. Runs in a temp dir; never
// touches public/data. Usage: npm run test:pipeline
const path = require("path"), fs = require("fs"), os = require("os"), https = require("https"), { EventEmitter } = require("events");
const repo = path.resolve(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "orbital-trip-test-"));
process.env.ORBITAL_OUTPUT_PATH = path.join(tmp, "orbital_trip_data.json");
process.env.TLE_CACHE_PATH = path.join(tmp, "tle_cache.json");
const assert = (c, m) => { if (!c) { console.log("  FAIL:", m); process.exitCode = 1; } else console.log("  ok:", m); };

// ---- synthetic TLEs with today's epoch (ISS-shaped orbit) ----
const now = new Date(), y = now.getUTCFullYear() % 100;
const doy = (now - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000 + 1 - 0.5;
const tle = id => {
  const n = String(id).padStart(5, "0");
  return [`SAT ${id}`,
    `1 ${n}U 98067A   ${String(y).padStart(2,"0")}${doy.toFixed(8).padStart(12,"0")}  .00016717  00000-0  10270-3 0  9000`,
    `2 ${n}  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`].join("\n");
};
const { CATALOG } = require(path.join(repo, "src/catalog"));
const ids = CATALOG.map(c => c.norad), inActive = new Set(ids.slice(0, 222));

// ---- https stub ----
let mode = "ok", calls = [];
https.get = (url, opts, cb) => {
  calls.push(url);
  const req = new EventEmitter(); req.destroy = () => {};
  setImmediate(() => {
    const bulk = url.includes("GROUP=");
    const fail = mode === "throttled" || (mode === "singles_fail" && !bulk);
    if (fail) return req.emit("timeout");
    const res = new EventEmitter(); res.statusCode = 200; res.resume = () => {};
    cb(res);
    const body = bulk ? [...inActive].map(tle).join("\n") + "\n" + tle(99999) : "No GP data found";
    res.emit("data", body); res.emit("end");
  });
  return req;
};
global.setTimeout = ((orig) => (fn, ms, ...a) => orig(fn, 0, ...a))(setTimeout); // skip politeness delays

const nacl = require(path.join(repo, "node_modules/tweetnacl")); nacl.sign.detached = () => new Uint8Array(64);
const OUT = process.env.ORBITAL_OUTPUT_PATH;
const CACHE = process.env.TLE_CACHE_PATH;
const { runPipeline } = require(path.join(repo, "src/pipeline"));
const count = () => JSON.parse(fs.readFileSync(OUT, "utf8")).satellite_count;
const run = async () => { calls = []; try { await runPipeline(); return null; } catch (e) { return e; } };
const quiet = async f => { const l = console.log; console.log = () => {}; const w = process.stdout.write; process.stdout.write = () => true; try { return await f(); } finally { console.log = l; process.stdout.write = w; } };

(async () => {
  fs.rmSync(CACHE, { force: true }); fs.rmSync(OUT, { force: true });

  console.log("1. Healthy CelesTrak, cold start");
  mode = "ok"; let e = await quiet(run);
  assert(!e, "run succeeds");
  assert(count() === 222, `222 satellites written (got ${count()})`);
  assert(calls.filter(u => u.includes("GROUP=")).length === 1, "exactly 1 bulk request");
  assert(calls.length === 1 + 39, `bulk + 39 single lookups for missing IDs (got ${calls.length})`);

  console.log("2. Next cron, healthy: missing IDs not re-queried within 24h");
  e = await quiet(run);
  assert(!e && calls.length === 1, `only 1 request total (got ${calls.length})`);

  console.log("3. CelesTrak throttling (every request times out), cache warm");
  mode = "throttled"; e = await quiet(run);
  assert(!e, "run succeeds from cache");
  assert(count() === 222, `still 222 satellites (got ${count()})`);
  assert(calls.length === 1, `gave up after the bulk failure — no request storm (got ${calls.length})`);
  const src = JSON.parse(fs.readFileSync(OUT, "utf8")).source;
  assert(/Cached/.test(src), `source labelled honestly: "${src}"`);

  console.log("4. Throttled, cache lost (redeploy), good output on disk");
  fs.rmSync(CACHE, { force: true }); const before = fs.readFileSync(OUT, "utf8");
  e = await quiet(run);
  assert(e && /Refusing to overwrite/.test(e.message), "pipeline refuses to write");
  assert(fs.readFileSync(OUT, "utf8") === before, "previous good output untouched");

  console.log("5. Bulk OK but single lookups failing → breaker");
  fs.rmSync(CACHE, { force: true }); mode = "singles_fail"; e = await quiet(run);
  const singles = calls.filter(u => u.includes("CATNR=")).length;
  assert(singles === 3, `stopped after 3 consecutive failures (got ${singles})`);
  assert(!e && count() === 222, "still writes the 222 from bulk");

  console.log("6. Stale cache (>14 days) is not used");
  const c = JSON.parse(fs.readFileSync(CACHE, "utf8"));
  for (const k of Object.keys(c).filter(k => c[k].tle1)) c[k].tle1 = c[k].tle1.replace(/^(.{18}).{14}/, "$1" + "25001.00000000");
  fs.writeFileSync(CACHE, JSON.stringify(c)); mode = "throttled"; e = await quiet(run);
  assert(e && /Refusing/.test(e.message), "stale-only cache → refuse, keep old output");

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(process.exitCode ? "\nFAILED" : "\nALL PASSED");
})();
