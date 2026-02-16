# ============================================
# Orbital TrIP — Production Container
# ============================================
FROM node:20-alpine AS production

LABEL maintainer="Camilo Ayerbe Posada <camilo@ulissy.com>"
LABEL description="Orbital TrIP — Space Object Identity via Proof-of-Trajectory"

WORKDIR /app

# Install Python for data pipeline (optional refresh)
RUN apk add --no-cache python3 py3-pip

# Dependencies first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Application code
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Python deps for pipeline (if data refresh needed)
RUN pip3 install --break-system-packages sgp4 pynacl requests 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.json()).then(d=>{if(d.status!=='ok')process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
