# Basis-Image mit Node.js
FROM node:18-bullseye-slim

WORKDIR /app

# Package.json-Dateien zuerst kopieren (für besseres Caching)
COPY package*.json ./
COPY client/package*.json ./client/

# Dependencies installieren (mit reduzierten Warnungen)
RUN npm install --omit=dev --no-audit --no-fund --silent
RUN cd client && npm install --omit=dev --no-audit --no-fund --silent

# Alle anderen Dateien kopieren
COPY . .

# React-App builden
RUN cd client && npm run build

# Port freigeben
EXPOSE 5000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/typen || exit 1

# Anwendung starten
CMD ["node", "server.js"] 