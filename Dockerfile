# Basis-Image mit Node.js
FROM node:24-bookworm-slim

WORKDIR /app

# Package.json-Dateien zuerst kopieren (für besseres Caching)
COPY package*.json ./
COPY client/package*.json ./client/

# Dependencies installieren (mit reduzierten Warnungen)
# System deps for better-sqlite3 build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm ci --omit=dev --no-audit --no-fund --silent \
  && cd client && npm ci --omit=dev --no-audit --no-fund --silent && cd .. \
  && npm rebuild better-sqlite3 --unsafe-perm

# Alle anderen Dateien kopieren
COPY . .

# React-App builden
RUN cd client && npm run build && rm -rf node_modules

# Port freigeben
EXPOSE 5000

# Ensure data dir exists for SQLite when using single-container setup
RUN mkdir -p /app/data

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/typen || exit 1

# Anwendung starten
CMD ["node", "server.js"] 