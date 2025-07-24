# Vereinfachte Dockerfile für bessere Kompatibilität
FROM node:18-alpine

# Installiere curl für Health Checks
RUN apk add --no-cache curl

WORKDIR /app

# Alle Dateien kopieren
COPY . .

# Dependencies installieren
RUN npm install
RUN cd client && npm install

# React-App builden
RUN cd client && npm run build

# Port freigeben
EXPOSE 5000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/typen || exit 1

# Anwendung starten
CMD ["node", "server.js"] 