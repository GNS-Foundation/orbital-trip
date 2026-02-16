# ============================================
# Orbital TrIP — Production Container
# ============================================
FROM node:20-alpine AS production

LABEL maintainer="Camilo Ayerbe Posada <camilo@ulissy.com>"
LABEL description="Orbital TrIP — Space Object Identity via Proof-of-Trajectory"

WORKDIR /app

# Dependencies first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Application code
COPY src/ ./src/
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.json()).then(d=>{if(d.status!=='ok')process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
