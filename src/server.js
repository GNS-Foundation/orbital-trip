const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const { runPipeline } = require("./pipeline");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "..", "public", "data", "orbital_trip_data.json");

let pipelineState = { lastRun: null, lastSuccess: null, running: false, error: null, runs: 0 };

// ===== MIDDLEWARE =====
app.use(compression());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://celestrak.org"],
    },
  },
}));

app.use(express.static(path.join(__dirname, "..", "public"), {
  maxAge: process.env.NODE_ENV === "production" ? "10m" : 0,
  etag: true,
}));

// ===== HELPERS =====
function loadData() {
  if (!fs.existsSync(DATA_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); } catch (e) { return null; }
}

// ===== API ROUTES =====
app.get("/health", (req, res) => {
  const data = loadData();
  res.json({
    status: "ok", service: "orbital-trip", version: "1.0.0",
    uptime: process.uptime(),
    pipeline: pipelineState,
    data: {
      available: !!data,
      satellites: data ? Object.keys(data.satellites || {}).length : 0,
      source: data?.source || "none",
      generated_at: data?.generated || null,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/satellites", (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: "Pipeline running, data not yet available. Retry in 30 seconds." });
  res.json(data);
});

app.get("/api/satellites/:name", (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: "Data not yet generated" });
  const name = decodeURIComponent(req.params.name);
  const sat = (data.satellites || {})[name];
  if (!sat) return res.status(404).json({ error: `Satellite '${name}' not found` });
  res.json({ name, ...sat });
});

app.get("/api/trust-leaderboard", (req, res) => {
  const data = loadData();
  if (!data) return res.status(503).json({ error: "Data not yet generated" });
  const sats = data.satellites || {};
  const leaderboard = (data.leaderboard || Object.keys(sats))
    .map(name => { const s = sats[name]; return s ? { name, norad: s.n, category: s.c, operator: s.o, trust_score: s.t.total, tier: s.t.tier } : null; })
    .filter(Boolean);
  res.json({ count: leaderboard.length, leaderboard });
});

app.get("/api/pipeline/status", (req, res) => res.json(pipelineState));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ===== PIPELINE =====
async function triggerPipeline() {
  if (pipelineState.running) return;
  pipelineState.running = true;
  pipelineState.lastRun = new Date().toISOString();
  pipelineState.runs++;
  pipelineState.error = null;
  try {
    await runPipeline();
    pipelineState.lastSuccess = new Date().toISOString();
  } catch (e) {
    pipelineState.error = e.message;
    console.error("  Pipeline failed:", e.message);
  } finally {
    pipelineState.running = false;
  }
}

// ===== START =====
app.listen(PORT, "0.0.0.0", () => {
  let sc = 0, src = "none";
  try { const d = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); sc = Object.keys(d.satellites).length; src = d.source; } catch (e) {}
  console.log(`\n  ╔══════════════════════════════════════════════╗`);
  console.log(`  ║  ORBITAL TrIP v1.0.0 — Public Registry        ║`);
  console.log(`  ║  Space Object Identity via Proof-of-Trajectory ║`);
  console.log(`  ╠══════════════════════════════════════════════╣`);
  console.log(`  ║  Port: ${String(PORT).padEnd(39)}║`);
  console.log(`  ║  Cached satellites: ${String(sc).padEnd(25)}║`);
  console.log(`  ║  Env: ${(process.env.NODE_ENV || "development").padEnd(40)}║`);
  console.log(`  ╚══════════════════════════════════════════════╝\n`);

  // Run pipeline on startup
  console.log("  Triggering live data pipeline...");
  triggerPipeline();

  // Auto-refresh every 3 hours
  cron.schedule("0 */3 * * *", () => {
    console.log(`\n  [CRON] Scheduled pipeline refresh — ${new Date().toISOString()}`);
    triggerPipeline();
  });
  console.log("  Auto-refresh scheduled: every 3 hours\n");
});
