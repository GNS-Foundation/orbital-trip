#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

const checks = [];
function check(name, fn) {
  try { fn(); checks.push({ name, ok: true }); console.log(`  \u2713 ${name}`); }
  catch (e) { checks.push({ name, ok: false }); console.log(`  \u2717 ${name}: ${e.message}`); }
}

console.log("\n  Orbital TrIP v1.0 — Healthcheck\n");

check("Server entry", () => { if (!fs.existsSync(path.join(__dirname, "..", "src", "server.js"))) throw new Error("missing"); });
check("Pipeline module", () => { if (!fs.existsSync(path.join(__dirname, "..", "src", "pipeline.js"))) throw new Error("missing"); });
check("Catalog module", () => {
  const { CATALOG, STORIES } = require(path.join(__dirname, "..", "src", "catalog.js"));
  if (CATALOG.length < 50) throw new Error(`Only ${CATALOG.length} satellites`);
  if (Object.keys(STORIES).length < 3) throw new Error(`Only ${Object.keys(STORIES).length} stories`);
});
check("Public directory", () => {
  if (!fs.existsSync(path.join(__dirname, "..", "public", "index.html"))) throw new Error("no index.html");
});
check("Dependencies", () => { require("express"); require("satellite.js"); require("tweetnacl"); require("node-cron"); });

const failed = checks.filter(c => !c.ok);
console.log(failed.length ? `\n  ${failed.length} FAILED` : `\n  All ${checks.length} checks passed!`);
process.exit(failed.length ? 1 : 0);
