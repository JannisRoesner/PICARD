# Multi-stage build für optimierte Docker-Image-Größe

# Stage 1: Build der React-Anwendung
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Client Dependencies installieren
COPY client/package*.json ./
RUN npm install --production=false

# Client Source Code kopieren und builden
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:18-alpine AS production

# Installiere curl für Health Checks
RUN apk add --no-cache curl

WORKDIR /app

# Server Dependencies installieren
COPY package*.json ./
RUN npm install --production=false

# Server Source Code kopieren
COPY server.js ./

# Gebaute React-App aus Stage 1 kopieren
COPY --from=client-builder /app/client/build ./client/build

# Port freigeben
EXPOSE 5000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/typen || exit 1

# Anwendung starten
CMD ["node", "server.js"] 