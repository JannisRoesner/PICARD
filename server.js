const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Prüfe ob Build-Verzeichnis existiert
const buildPath = path.join(__dirname, 'client/build');
const buildExists = fs.existsSync(buildPath);

if (buildExists) {
  // Produktionsmodus: Statische Dateien aus Build-Verzeichnis
  app.use(express.static(buildPath));
  console.log('Produktionsmodus: Verwende Build-Verzeichnis');
} else {
  // Entwicklungsmodus: Proxy zu React Development Server
  console.log('Entwicklungsmodus: Proxy zu React Development Server');
  console.log('Starten Sie den React Development Server mit: cd client && npm start');
  
  // Fallback für API-Aufrufe
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
    } else {
      res.status(404).json({ 
        error: 'Frontend nicht verfügbar', 
        message: 'Bitte starten Sie den React Development Server mit: cd client && npm start',
        development: true
      });
    }
  });
}

// In-Memory Datenbank (in Produktion würde man eine echte DB verwenden)
let sitzungen = new Map();
let aktiveSitzung = null;

// Zettel-System
let zettel = new Map(); // sitzungId -> Array von Zetteln

// Programmpunkt-Typen
const TYPEN = {
  BUETTENREDE: 'BÜTTENREDE',
  MARSCH: 'MARSCH',
  POLKA: 'POLKA',
  SHOWTANZ: 'SHOWTANZ',
  GARDETANZ: 'GARDETANZ',
  FUNKENMARIECHEN: 'FUNKENMARIECHEN',
  MODERATION: 'MODERATION',
  PUBLIKUM: 'PUBLIKUM',
  PAUSE: 'PAUSE',
  SONSTIGES: 'SONSTIGES'
};

// API Routes
app.get('/api/typen', (req, res) => {
  res.json(Object.values(TYPEN));
});

app.get('/api/sitzungen', (req, res) => {
  res.json(Array.from(sitzungen.values()));
});

app.post('/api/sitzung', (req, res) => {
  const { name, programmpunkte } = req.body;
  const sitzungId = uuidv4();
  const neueSitzung = {
    id: sitzungId,
    name: name,
    programmpunkte: programmpunkte || [],
    erstellt: new Date().toISOString()
  };
  sitzungen.set(sitzungId, neueSitzung);
  res.json(neueSitzung);
});

app.get('/api/sitzung/:id', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (sitzung) {
    res.json(sitzung);
  } else {
    res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
});

app.post('/api/sitzung/:id/programmpunkt', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const programmpunkt = {
    id: uuidv4(),
    name: req.body.name,
    typ: req.body.typ,
    einzugCD: req.body.einzugCD || false,
    auszugCD: req.body.auszugCD || false,
    trainer: req.body.trainer || '',
    betreuer: req.body.betreuer || '',
    namensliste: req.body.namensliste || [],
    anmoderation: req.body.anmoderation || 'Es wurde kein Moderationstext hinterlegt',
    abmoderation: req.body.abmoderation || 'Es wurde kein Moderationstext hinterlegt',
    notizen: req.body.notizen || 'Es wurden keine Notizen hinterlegt',
    // Technische Informationen für Bühnentechniker
    audioDateien: req.body.audioDateien || [],
    lichtStimmung: req.body.lichtStimmung || 'Standard',
    dauer: req.body.dauer || 0,
    // NEU: Cues speichern
    audioCues: req.body.audioCues || [],
    lightCues: req.body.lightCues || [],
    // NEU: Bühneninformationen für Kulissenschieber
    buehne: req.body.buehne || 'Bühne: frei',
    erstellt: new Date().toISOString()
  };

  // Einfügen an beliebiger Position
  const insertAfter = req.body.insertAfter;
  if (insertAfter !== undefined && insertAfter !== null) {
    // An der angegebenen Position einfügen
    sitzung.programmpunkte.splice(insertAfter + 1, 0, programmpunkt);
  } else {
    // Am Ende hinzufügen
    sitzung.programmpunkte.push(programmpunkt);
  }

  // Nummern neu ordnen
  sitzung.programmpunkte.forEach((punkt, index) => {
    punkt.nummer = index + 1;
  });

  // Echtzeit-Update an alle verbundenen Clients
  io.emit('programmpunktHinzugefuegt', { sitzungId: req.params.id, programmpunkt });
  
  res.json(programmpunkt);
});

app.put('/api/sitzung/:id/programmpunkt/:punktId', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const programmpunktIndex = sitzung.programmpunkte.findIndex(p => p.id === req.params.punktId);
  if (programmpunktIndex === -1) {
    return res.status(404).json({ error: 'Programmpunkt nicht gefunden' });
  }

  sitzung.programmpunkte[programmpunktIndex] = {
    ...sitzung.programmpunkte[programmpunktIndex],
    ...req.body
  };

  // Echtzeit-Update
  io.emit('programmpunktAktualisiert', { 
    sitzungId: req.params.id, 
    programmpunkt: sitzung.programmpunkte[programmpunktIndex] 
  });

  res.json(sitzung.programmpunkte[programmpunktIndex]);
});

app.delete('/api/sitzung/:id/programmpunkt/:punktId', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const programmpunktIndex = sitzung.programmpunkte.findIndex(p => p.id === req.params.punktId);
  if (programmpunktIndex === -1) {
    return res.status(404).json({ error: 'Programmpunkt nicht gefunden' });
  }

  sitzung.programmpunkte.splice(programmpunktIndex, 1);
  
  // Nummern neu ordnen
  sitzung.programmpunkte.forEach((punkt, index) => {
    punkt.nummer = index + 1;
  });

  // Echtzeit-Update
  io.emit('programmpunktGeloescht', { 
    sitzungId: req.params.id, 
    punktId: req.params.punktId,
    programmpunkte: sitzung.programmpunkte 
  });

  res.json({ success: true });
});

// Reorder Programmpunkte
app.put('/api/sitzung/:id/programmpunkte/reorder', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const { programmpunkte: neueReihenfolge } = req.body;
  if (!neueReihenfolge || !Array.isArray(neueReihenfolge)) {
    return res.status(400).json({ error: 'Ungültige Daten' });
  }

  // Aktualisiere die Reihenfolge
  sitzung.programmpunkte = neueReihenfolge;

  // Echtzeit-Update an alle verbundenen Clients
  io.emit('programmpunkteReordered', { 
    sitzungId: req.params.id, 
    programmpunkte: sitzung.programmpunkte 
  });

  res.json({ success: true, programmpunkte: sitzung.programmpunkte });
});

// Zettel API Routes
app.get('/api/sitzung/:id/zettel', (req, res) => {
  const sitzungId = req.params.id;
  const zettelListe = zettel.get(sitzungId) || [];
  res.json(zettelListe);
});

app.post('/api/sitzung/:id/zettel', (req, res) => {
  const sitzungId = req.params.id;
  const { text, type, priority, sender } = req.body;
  
  if (!sitzungId || !text || !type || !priority || !sender) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  const neuerZettel = {
    id: uuidv4(),
    text: text,
    type: type, // 'anModeration', 'anTechnik', 'anAlle'
    priority: priority, // 'normal', 'wichtig', 'dringend'
    sender: sender, // 'moderator', 'techniker', 'programmansicht'
    timestamp: new Date().toISOString(),
    sitzungId: sitzungId,
    geschlossen: false // NEU: Status für geschlossene Zettel
  };

  // Zettel zur Sitzung hinzufügen
  if (!zettel.has(sitzungId)) {
    zettel.set(sitzungId, []);
  }
  zettel.get(sitzungId).push(neuerZettel);

  // Echtzeit-Update an alle verbundenen Clients
  io.emit('zettelHinzugefuegt', { sitzungId, zettel: neuerZettel });
  
  res.json(neuerZettel);
});

app.delete('/api/sitzung/:id/zettel/:zettelId', (req, res) => {
  const sitzungId = req.params.id;
  const zettelId = req.params.zettelId;
  
  const zettelListe = zettel.get(sitzungId);
  if (!zettelListe) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const zettelIndex = zettelListe.findIndex(z => z.id === zettelId);
  if (zettelIndex === -1) {
    return res.status(404).json({ error: 'Zettel nicht gefunden' });
  }

  // Zettel als geschlossen markieren statt löschen
  zettelListe[zettelIndex].geschlossen = true;

  // Echtzeit-Update
  io.emit('zettelGeschlossen', { sitzungId, zettelId });
  
  res.json({ success: true });
});

app.post('/api/sitzung/:id/aktiv', (req, res) => {
  aktiveSitzung = req.params.id;
  io.emit('aktiveSitzungGeaendert', { sitzungId: aktiveSitzung });
  res.json({ aktiveSitzung });
});

app.get('/api/aktive-sitzung', (req, res) => {
  res.json({ aktiveSitzung });
});

// PDF-Generierung mit Puppeteer
let browser = null;

// Browser initialisieren
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

// HTML für verschiedene Ansichten generieren
function generateProgrammansichtHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Programm - ${sitzung.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .programm-item { 
            border: 1px solid #ccc; 
            margin-bottom: 15px; 
            padding: 15px; 
            page-break-inside: avoid;
          }
          .nummer { 
            background: #fbbf24; 
            color: #000; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            margin-right: 10px;
          }
          .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
          .typ { color: #666; font-size: 14px; }
          .dauer { color: #666; font-size: 14px; }
          .footer {
            position: fixed;
            bottom: 10px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .programm-item { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${sitzung.name} ${currentYear}</div>
        </div>
        ${sitzung.programmpunkte.map(pp => `
          <div class="programm-item">
            <div>
              <span class="nummer">${pp.nummer}</span>
              <span class="name">${pp.name}</span>
            </div>
            <div class="typ">${pp.typ}</div>
            <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
          </div>
        `).join('')}
        <div class="footer">
          Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
        </div>
      </body>
    </html>
  `;
}

function generateKulissenHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Kulissen - ${sitzung.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .programm-container { display: flex; }
          .programm-left { flex: 1; }
          .programm-right { flex: 1; margin-left: 20px; }
          .programm-item { 
            border: 1px solid #ccc; 
            margin-bottom: 15px; 
            padding: 15px; 
            page-break-inside: avoid;
          }
          .nummer { 
            background: #fbbf24; 
            color: #000; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            margin-right: 10px;
          }
          .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
          .typ { color: #666; font-size: 14px; }
          .dauer { color: #666; font-size: 14px; }
          .kulissen-info { 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 5px; 
            margin-top: 10px;
          }
          .kulissen-title { font-weight: bold; margin-bottom: 8px; }
          .kulissen-item { margin-bottom: 5px; }
          .footer {
            position: fixed;
            bottom: 10px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .programm-item { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${sitzung.name} ${currentYear} - Kulissen-Ansicht</div>
        </div>
        <div class="programm-container">
          <div class="programm-left">
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                <div>
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
              </div>
            `).join('')}
          </div>
          <div class="programm-right">
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                <div class="kulissen-info">
                  <div class="kulissen-title">🎭 Kulissen-Informationen</div>
                  <div class="kulissen-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
                  <div class="kulissen-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
                  <div class="kulissen-item">🎪 ${pp.buehne || 'Bühne: frei'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="footer">
          Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
        </div>
      </body>
    </html>
  `;
}

function generateModeratorHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Moderator - ${sitzung.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .programm-container { display: flex; }
          .programm-left { flex: 1; }
          .programm-right { flex: 1; margin-left: 20px; }
          .programm-item { 
            border: 1px solid #ccc; 
            margin-bottom: 15px; 
            padding: 15px; 
            page-break-inside: avoid;
          }
          .nummer { 
            background: #fbbf24; 
            color: #000; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            margin-right: 10px;
          }
          .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
          .typ { color: #666; font-size: 14px; }
          .dauer { color: #666; font-size: 14px; }
          .moderator-info { 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 5px; 
            margin-top: 10px;
          }
          .moderator-title { font-weight: bold; margin-bottom: 8px; }
          .moderator-item { margin-bottom: 5px; }
          .right-title { font-weight: bold; margin-bottom: 10px; color: #fbbf24; }
          .right-item { margin-bottom: 8px; }
          .right-namensliste { margin-left: 10px; font-style: italic; }
          .footer {
            position: fixed;
            bottom: 10px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .programm-item { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${sitzung.name} ${currentYear} - Moderator-Ansicht</div>
        </div>
        <div class="programm-container">
          <div class="programm-left">
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                  <span style="margin-left: auto; font-size: 12px; color: #666;">
                    🎵 Einzug: ${pp.einzugCD ? 'CD' : 'Kapelle'} | Auszug: ${pp.auszugCD ? 'CD' : 'Kapelle'}
                  </span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</span>
                </div>
                <div class="moderator-info">
                  ${pp.anmoderation ? `<div class="moderator-item"><strong>Anmoderation:</strong> ${pp.anmoderation}</div>` : ''}
                  ${pp.abmoderation ? `<div class="moderator-item"><strong>Abmoderation:</strong> ${pp.abmoderation}</div>` : ''}
                  ${pp.notizen ? `<div class="moderator-item"><strong>Notizen:</strong> ${pp.notizen}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="programm-right">
            <div class="right-title">👥 Personen & Namenslisten</div>
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                ${pp.trainer ? `<div class="right-item">👨‍🏫 Trainer: ${pp.trainer}</div>` : ''}
                ${pp.betreuer ? `<div class="right-item">👨‍💼 Betreuer: ${pp.betreuer}</div>` : ''}
                ${pp.namensliste && pp.namensliste.length > 0 ? `
                  <div class="right-item">
                    👥 Namensliste:
                    <div class="right-namensliste">${pp.namensliste.join(', ')}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="footer">
          Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
        </div>
      </body>
    </html>
  `;
}

function generateTechnikerHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Techniker - ${sitzung.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .programm-container { display: flex; }
          .programm-left { flex: 1; }
          .programm-right { flex: 1; margin-left: 20px; }
          .programm-item { 
            border: 1px solid #ccc; 
            margin-bottom: 15px; 
            padding: 15px; 
            page-break-inside: avoid;
          }
          .nummer { 
            background: #fbbf24; 
            color: #000; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            margin-right: 10px;
          }
          .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
          .typ { color: #666; font-size: 14px; }
          .dauer { color: #666; font-size: 14px; }
          .techniker-info { 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 5px; 
            margin-top: 10px;
          }
          .techniker-title { font-weight: bold; margin-bottom: 8px; }
          .techniker-item { margin-bottom: 5px; }
          .right-title { font-weight: bold; margin-bottom: 10px; color: #fbbf24; }
          .right-item { margin-bottom: 8px; }
          .footer {
            position: fixed;
            bottom: 10px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; }
            .programm-item { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${sitzung.name} ${currentYear} - Techniker-Ansicht</div>
        </div>
        <div class="programm-container">
          <div class="programm-left">
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                  <span style="margin-left: auto; font-size: 12px; color: #666;">
                    🎵 Einzug: ${pp.einzugCD ? 'CD' : 'Kapelle'} | Auszug: ${pp.auszugCD ? 'CD' : 'Kapelle'}
                  </span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</span>
                </div>
                <div class="techniker-info">
                  ${pp.lichtStimmung ? `<div class="techniker-item"><strong>💡 Licht-Informationen:</strong> ${pp.lichtStimmung}</div>` : ''}
                  ${pp.audioDateien && pp.audioDateien.length > 0 ? `<div class="techniker-item"><strong>🎵 Audio-Informationen:</strong> ${pp.audioDateien.join(', ')}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="programm-right">
            <div class="right-title">🎛️ Technische Cues</div>
            ${sitzung.programmpunkte.map(pp => `
              <div class="programm-item">
                ${pp.audioCues && pp.audioCues.length > 0 ? `
                  <div class="right-item">
                    <strong>🎵 Audio-Cues:</strong>
                    <div style="margin-left: 10px;">${pp.audioCues.map(cue => cue.text || cue).join('<br>')}</div>
                  </div>
                ` : ''}
                ${pp.lightCues && pp.lightCues.length > 0 ? `
                  <div class="right-item">
                    <strong>💡 Licht-Cues:</strong>
                    <div style="margin-left: 10px;">${pp.lightCues.map(cue => cue.text || cue).join('<br>')}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="footer">
          Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
        </div>
      </body>
    </html>
  `;
}

// PDF-Generierung Endpunkte
app.post('/api/sitzung/:id/pdf/programmansicht', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    const html = generateProgrammansichtHTML(sitzung);
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="programmansicht-${sitzung.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF-Generierung Fehler:', error);
    res.status(500).json({ error: 'PDF-Generierung fehlgeschlagen' });
  }
});

app.post('/api/sitzung/:id/pdf/kulissen', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    const html = generateKulissenHTML(sitzung);
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="kulissen-${sitzung.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF-Generierung Fehler:', error);
    res.status(500).json({ error: 'PDF-Generierung fehlgeschlagen' });
  }
});

app.post('/api/sitzung/:id/pdf/moderator', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    const html = generateModeratorHTML(sitzung);
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="moderator-${sitzung.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF-Generierung Fehler:', error);
    res.status(500).json({ error: 'PDF-Generierung fehlgeschlagen' });
  }
});

app.post('/api/sitzung/:id/pdf/techniker', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    const html = generateTechnikerHTML(sitzung);
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="techniker-${sitzung.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF-Generierung Fehler:', error);
    res.status(500).json({ error: 'PDF-Generierung fehlgeschlagen' });
  }
});

app.post('/api/sitzung/:id/pdf/all', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    // Alle vier Ansichten in einem PDF
    const views = [
      { name: 'Programmansicht', html: generateProgrammansichtHTML(sitzung), landscape: false },
      { name: 'Kulissen-Ansicht', html: generateKulissenHTML(sitzung), landscape: true },
      { name: 'Moderator-Ansicht', html: generateModeratorHTML(sitzung), landscape: true },
      { name: 'Techniker-Ansicht', html: generateTechnikerHTML(sitzung), landscape: true }
    ];

    const pdfPages = [];
    
    for (const view of views) {
      await page.setContent(view.html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: view.landscape,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });
      pdfPages.push(pdf);
    }

    // PDFs zusammenführen (einfache Lösung: alle als separate Dateien)
    // Für echte Zusammenführung würde man eine Bibliothek wie pdf-lib verwenden
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="alle-ansichten-${sitzung.name}.zip"`);
    
    // Für jetzt: Erste PDF zurückgeben (später ZIP-Archiv)
    res.send(pdfPages[0]);
  } catch (error) {
    console.error('PDF-Generierung Fehler:', error);
    res.status(500).json({ error: 'PDF-Generierung fehlgeschlagen' });
  }
});

// Socket.IO Event Handler
io.on('connection', (socket) => {
  console.log('Neuer Client verbunden:', socket.id);

  socket.on('joinSitzung', (sitzungId) => {
    socket.join(sitzungId);
    console.log(`Client ${socket.id} ist Sitzung ${sitzungId} beigetreten`);
  });

  socket.on('leaveSitzung', (sitzungId) => {
    socket.leave(sitzungId);
    console.log(`Client ${socket.id} hat Sitzung ${sitzungId} verlassen`);
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
  });

  // Timer-Events
  socket.on('timerStart', (data) => {
    socket.broadcast.emit('timerUpdate', {
      type: 'timerStart',
      duration: data.duration,
      programmpunkt: data.programmpunkt,
      remainingTime: data.remainingTime
    });
  });

  socket.on('timerStop', () => {
    socket.broadcast.emit('timerUpdate', {
      type: 'timerStop'
    });
  });
});

// Serve React App (nur im Produktionsmodus)
if (buildExists) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 