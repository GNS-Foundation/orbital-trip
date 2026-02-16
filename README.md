# Orbital TrIP

**Space Object Identity via Proof-of-Trajectory**

An extension of the [TrIP protocol](https://github.com/GNS-Foundation) to orbital objects. Uses real satellite orbital data (TLE/GP from CelesTrak), SGP4 propagation, and Ed25519 cryptographic signing to demonstrate trajectory-based identity for space traffic management.

## What This Does

- **16 real satellites** tracked with actual TLE orbital elements
- **SGP4 orbit propagation** generates genuine position data (72-hour window)
- **Ed25519 breadcrumb chains** — each position is cryptographically signed and hash-linked
- **Trust scoring** — five-component model (trajectory consistency, operational compliance, chain maturity, observation corroboration, chain integrity)
- **Anomaly detection** — the Russian Luch/Olymp-K1 spy satellite scores 52.8/100 vs GOES 16 at 95.0/100

## Quick Start

```bash
# Clone
git clone https://github.com/GNS-Foundation/orbital-trip.git
cd orbital-trip

# Install & run
npm install
npm start

# Open http://localhost:3000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check (used by Railway) |
| `GET /api/satellites` | Full orbital dataset |
| `GET /api/satellites/:name` | Single satellite data |
| `GET /api/trust-leaderboard` | Trust scores ranked |

## Architecture

```
orbital-trip/
├── .github/workflows/
│   └── deploy.yml          # CI/CD: test → deploy to Railway
├── public/
│   ├── index.html          # Interactive mission control dashboard
│   └── data/
│       └── orbital_trip_data.json  # SGP4 + Ed25519 signed orbital data
├── scripts/
│   ├── healthcheck.js      # Pre-deployment validation
│   └── orbital_trip_pipeline.py  # Data generation pipeline
├── src/
│   └── server.js           # Express API server
├── Dockerfile              # Production container
├── railway.json            # Railway deployment config
└── package.json
```

## CI/CD Pipeline

```
Push to main
    │
    ▼
┌──────────────┐     ┌──────────────┐
│  Test &       │────▶│  Deploy to   │
│  Validate     │     │  Railway     │
│              │     │              │
│ • npm ci     │     │ • railway up │
│ • data check │     │ • health     │
│ • server     │     │   verify     │
│   startup    │     │              │
└──────────────┘     └──────────────┘
```

**GitHub Secrets required:**
- `RAILWAY_TOKEN` — from Railway dashboard → Account Settings → Tokens

**GitHub Variables (optional):**
- `RAILWAY_URL` — your Railway deployment URL (for post-deploy health check)

## Deployment

### Railway (recommended)

1. Create project on [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set `RAILWAY_TOKEN` in GitHub Secrets
4. Push to `main` — CI/CD handles the rest

### Docker

```bash
docker build -t orbital-trip .
docker run -p 3000:3000 orbital-trip
```

## Data Pipeline

The Python pipeline generates orbital data from real TLE elements:

```bash
pip install sgp4 pynacl requests
python scripts/orbital_trip_pipeline.py
```

Currently uses embedded TLE data. To enable live CelesTrak API fetching, uncomment the network calls in the pipeline script and the weekly cron job in `.github/workflows/deploy.yml`.

## Trust Score Components

| Component | Weight | Metric |
|-----------|--------|--------|
| Trajectory consistency | 35% | Altitude deviation from predicted orbit |
| Operational compliance | 25% | Adherence to assigned slot/norms |
| Chain maturity | 20% | Duration of continuous breadcrumb chain |
| Observation corroboration | 10% | Independent tracking source count |
| Chain integrity | 10% | Cryptographic hash chain validity |

## Related

- [GNS Protocol](https://github.com/GNS-Foundation) — Geospatial Naming System
- [TrIP Specification](https://datatracker.ietf.org/doc/draft-ayerbe-trip-protocol/) — IETF Internet-Draft
- US Provisional Patent #63/948,788

## License

AGPL-3.0 — See [LICENSE](LICENSE)

Copyright 2025-2026 ULISSY s.r.l. / GNS Foundation
