#!/usr/bin/env node
/**
 * Orbital TrIP — Health Check
 * Validates server can start and data is present
 */
const fs = require('fs');
const path = require('path');

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failures++;
  }
}

console.log('\nOrbital TrIP — Health Check\n');

check('Server entry point exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'src', 'server.js')))
    throw new Error('src/server.js not found');
});

check('Public directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'public', 'index.html')))
    throw new Error('public/index.html not found');
});

check('Orbital data present', () => {
  const p = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  if (!fs.existsSync(p)) throw new Error('Data file not found');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const sats = data.satellites || data.sats || {};
  const count = Object.keys(sats).length;
  if (count < 10) throw new Error(`Only ${count} satellites (need 10+)`);
  console.log(`    └ ${count} satellites loaded`);
});

check('Trust scores valid', () => {
  const p = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const sats = data.satellites || data.sats || {};
  for (const [name, sat] of Object.entries(sats)) {
    const trust = (sat.trust || sat.t);
    if (!trust || typeof trust.total !== 'number')
      throw new Error(`${name}: missing trust score`);
    if (trust.total < 0 || trust.total > 100)
      throw new Error(`${name}: trust ${trust.total} out of range`);
  }
});

check('Ed25519 keys present', () => {
  const p = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const sats = data.satellites || data.sats || {};
  for (const [name, sat] of Object.entries(sats)) {
    const trip = sat.trip || sat.t;
    const pk = trip.pk || trip.public_key || sat.k;
    if (!pk || pk.length < 16)
      throw new Error(`${name}: missing or invalid public key`);
  }
});

check('Dependencies installed', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  for (const dep of Object.keys(pkg.dependencies || {})) {
    try { require.resolve(dep); }
    catch { throw new Error(`${dep} not installed`); }
  }
});

console.log(`\n${failures === 0 ? '✓ All checks passed' : `✗ ${failures} check(s) failed`}\n`);
process.exit(failures > 0 ? 1 : 0);
