# Basis-Image mit Node.js
FROM node:18-bullseye-slim

# Chrome-Abhängigkeiten für Puppeteer installieren
RUN apt-get update \
    && apt-get install -y wget gnupg curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

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

# Puppeteer ohne Sandbox ausführen (notwendig in Docker)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Anwendung starten
CMD ["node", "server.js"] 