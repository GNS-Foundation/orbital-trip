# Orbital TrIP — Space Object Identity Registry

**Public registry for satellite identity via Proof-of-Trajectory.**

Live CelesTrak data → SGP4 propagation → Ed25519 breadcrumb chains → trust scoring for 100+ satellites.

## Architecture

```
CelesTrak GP API → pipeline.js (Node.js)
  ├─ satellite.js (SGP4 propagation)
  ├─ tweetnacl (Ed25519 signatures)
  ├─ SHA-256 hash chaining
  └─ Trust scoring engine
       ↓
  orbital_trip_data.json → Express API → Dashboard
```

### Live Data Pipeline

The server runs the pipeline on startup and refreshes every 3 hours:

1. Fetches live TLE data from CelesTrak for 100+ curated NORAD IDs
2. Propagates orbits over 72-hour windows using SGP4
3. Generates Ed25519 breadcrumb chains for each satellite
4. Computes trust scores (0–100) with five-tier badges
5. Serves via REST API and interactive dashboard

### Story Satellites

Five satellites with rich narratives demonstrate why orbital identity matters:

- **LUCH (OLYMP-K1)** — Russia's GEO stalker (12+ repositioning events)
- **INTELSAT 33E** — Uninsured GEO explosion (insurance case study)
- **CLUSTER 2 (SALSA)** — ESA's responsible deorbit (ESG compliance)
- **STARLINK-1007** — Collision avoidance at scale (144K maneuvers)
- **COSMOS 1408 DEB** — ASAT debris (forensic accountability)

## API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server + pipeline status |
| `GET /api/satellites` | Full dataset |
| `GET /api/satellites/:name` | Single satellite |
| `GET /api/trust-leaderboard` | Trust score ranking |
| `GET /api/pipeline/status` | Pipeline run history |

## Development

```bash
npm install
npm run dev     # Start with file watching
npm test        # Run healthcheck
```

## Deployment

Deployed to Railway via GitHub Actions CI/CD. Push to `main` triggers:
1. Module validation + healthcheck
2. Server startup test
3. Railway deployment (on merge)

## License

AGPL-3.0 — GNS Foundation / ULISSY s.r.l.
