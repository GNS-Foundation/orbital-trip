const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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
      connectSrc: ["'self'", "https://celestrak.org", "https://www.space-track.org"],
    },
  },
}));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  etag: true,
}));

// ===== API ROUTES =====

// Health check (Railway uses this)
app.get('/health', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  const dataExists = fs.existsSync(dataPath);
  let satCount = 0;
  let generatedAt = null;

  if (dataExists) {
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      satCount = Object.keys(data.satellites || data.sats || {}).length;
      generatedAt = data.generated || data.generated_at;
    } catch (e) { /* ignore parse errors */ }
  }

  res.json({
    status: 'ok',
    service: 'orbital-trip',
    version: '0.1.0',
    uptime: process.uptime(),
    data: {
      available: dataExists,
      satellites: satCount,
      generated_at: generatedAt,
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API: Get satellite data
app.get('/api/satellites', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  if (!fs.existsSync(dataPath)) {
    return res.status(503).json({ error: 'Orbital data not yet generated. Run pipeline first.' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse orbital data' });
  }
});

// API: Get single satellite
app.get('/api/satellites/:name', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  if (!fs.existsSync(dataPath)) {
    return res.status(503).json({ error: 'Orbital data not yet generated' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const sats = data.satellites || data.sats || {};
    const name = decodeURIComponent(req.params.name);
    const sat = sats[name];
    if (!sat) {
      return res.status(404).json({ error: `Satellite '${name}' not found` });
    }
    res.json({ name, ...sat });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse orbital data' });
  }
});

// API: Trust leaderboard
app.get('/api/trust-leaderboard', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'orbital_trip_data.json');
  if (!fs.existsSync(dataPath)) {
    return res.status(503).json({ error: 'Orbital data not yet generated' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const sats = data.satellites || data.sats || {};
    const leaderboard = Object.entries(sats)
      .map(([name, s]) => ({
        name,
        norad: s.norad || s.n,
        category: s.cat || s.c,
        operator: s.op || s.o,
        trust_score: (s.trust || s.t).total,
        tier: (s.trust || s.t).tier,
      }))
      .sort((a, b) => b.trust_score - a.trust_score);
    res.json({ count: leaderboard.length, leaderboard });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ===== START =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  ORBITAL TrIP — Space Object Identity    ║`);
  console.log(`  ║  Proof-of-Trajectory for Satellites       ║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║  Port: ${PORT}                              ║`);
  console.log(`  ║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(33)}║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
