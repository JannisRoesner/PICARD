const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const puppeteer = require('puppeteer');
const archiver = require('archiver');

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
    <div class="page-break"></div>
    <div class="header">
      <div class="title">${sitzung.name} ${currentYear}</div>
    </div>
    <style>
      .programmansicht .programm-item { 
        border: 1px solid #ccc; 
        margin-bottom: 15px; 
        padding: 15px; 
        page-break-inside: avoid;
      }
      .programmansicht .nummer { 
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
      .programmansicht .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
      .programmansicht .typ { color: #666; font-size: 14px; }
      .programmansicht .dauer { color: #666; font-size: 14px; }
    </style>
    <div class="programmansicht">
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
    <div class="footer">
      Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
    </div>
  `;
}

function generateKulissenHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <div class="page-break"></div>
    <div class="header">
      <div class="title">${sitzung.name} ${currentYear}</div>
    </div>
    <style>
      @page { size: landscape; }
      .kulissen-view .programm-item { 
        border: 1px solid #ccc; 
        margin-bottom: 12px; 
        padding: 12px; 
        page-break-inside: avoid;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .kulissen-view .programm-left {
        flex: 1;
        margin-right: 15px;
      }
      .kulissen-view .programm-right {
        width: 200px;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .kulissen-view .nummer { 
        background: #fbbf24; 
        color: #000; 
        width: 25px; 
        height: 25px; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold;
        margin-right: 8px;
        font-size: 12px;
      }
      .kulissen-view .name { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
      .kulissen-view .typ { color: #666; font-size: 12px; margin-bottom: 4px; }
      .kulissen-view .dauer { color: #666; font-size: 12px; }
      .kulissen-view .kulissen-title { font-weight: bold; margin-bottom: 6px; font-size: 11px; }
      .kulissen-view .kulissen-item { margin-bottom: 3px; }
    </style>
    <div class="kulissen-view">
      ${sitzung.programmpunkte.map(pp => `
        <div class="programm-item">
          <div class="programm-left">
            <div>
              <span class="nummer">${pp.nummer}</span>
              <span class="name">${pp.name}</span>
            </div>
            <div class="typ">${pp.typ}</div>
            <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
          </div>
          <div class="programm-right">
            <div class="kulissen-title">🎭 Kulissen-Info</div>
            <div class="kulissen-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
            <div class="kulissen-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
            <div class="kulissen-item">🎪 ${pp.buehne || 'Bühne: frei'}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
    </div>
  `;
}

function generateModeratorHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <div class="page-break"></div>
    <div class="header">
      <div class="title">${sitzung.name} ${currentYear}</div>
    </div>
    <style>
      @page { size: landscape; }
      .moderator-view .programm-item { 
        border: 1px solid #ccc; 
        margin-bottom: 15px; 
        padding: 12px; 
        page-break-inside: avoid;
      }
      .moderator-view .nummer { 
        background: #fbbf24; 
        color: #000; 
        width: 25px; 
        height: 25px; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold;
        margin-right: 8px;
        font-size: 12px;
      }
      .moderator-view .name { font-weight: bold; font-size: 16px; margin-bottom: 6px; }
      .moderator-view .typ { color: #666; font-size: 12px; margin-bottom: 6px; }
      .moderator-view .dauer { color: #666; font-size: 12px; margin-bottom: 8px; }
      .moderator-view .moderator-info { 
        background: #f5f5f5; 
        padding: 10px; 
        border-radius: 5px; 
        margin-top: 8px;
      }
      .moderator-view .moderator-title { font-weight: bold; margin-bottom: 6px; font-size: 13px; }
      .moderator-view .moderator-item { margin-bottom: 4px; font-size: 12px; }
      .moderator-view .namensliste { 
        background: #e8f4fd; 
        padding: 6px; 
        border-radius: 3px; 
        margin-top: 4px;
        font-size: 11px;
      }
      .moderator-view .moderation-text {
        background: #fff3cd;
        padding: 6px;
        border-radius: 3px;
        margin-top: 4px;
        font-size: 11px;
        border-left: 3px solid #ffc107;
      }
    </style>
    <div class="moderator-view">
      ${sitzung.programmpunkte.map(pp => `
        <div class="programm-item">
          <div>
            <span class="nummer">${pp.nummer}</span>
            <span class="name">${pp.name}</span>
          </div>
          <div class="typ">${pp.typ}</div>
          <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
          <div class="moderator-info">
            <div class="moderator-title">📝 Moderator-Informationen</div>
            <div class="moderator-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
            <div class="moderator-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
            ${pp.trainer ? `<div class="moderator-item">👨‍🏫 Trainer: ${pp.trainer}</div>` : ''}
            ${pp.betreuer ? `<div class="moderator-item">👨‍💼 Betreuer: ${pp.betreuer}</div>` : ''}
            ${pp.namensliste && pp.namensliste.length > 0 ? `
              <div class="moderator-item">
                👥 Namensliste:
                <div class="namensliste">${pp.namensliste.join(', ')}</div>
              </div>
            ` : ''}
            <div class="moderator-item">
              📝 Anmoderation:
              <div class="moderation-text">${pp.anmoderation || 'Noch nicht erstellt'}</div>
            </div>
            <div class="moderator-item">
              📝 Abmoderation:
              <div class="moderation-text">${pp.abmoderation || 'Noch nicht erstellt'}</div>
            </div>
            <div class="moderator-item">
              📝 Notizen:
              <div class="moderation-text">${pp.notizen || 'Keine Notizen'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
    </div>
  `;
}

function generateTechnikerHTML(sitzung) {
  const currentYear = new Date().getFullYear();
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  
  return `
    <div class="page-break"></div>
    <div class="header">
      <div class="title">${sitzung.name} ${currentYear}</div>
    </div>
    <style>
      @page { size: landscape; }
      .techniker-view .programm-item { 
        border: 1px solid #ccc; 
        margin-bottom: 15px; 
        padding: 12px; 
        page-break-inside: avoid;
      }
      .techniker-view .nummer { 
        background: #fbbf24; 
        color: #000; 
        width: 25px; 
        height: 25px; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold;
        margin-right: 8px;
        font-size: 12px;
      }
      .techniker-view .name { font-weight: bold; font-size: 16px; margin-bottom: 6px; }
      .techniker-view .typ { color: #666; font-size: 12px; margin-bottom: 6px; }
      .techniker-view .dauer { color: #666; font-size: 12px; margin-bottom: 8px; }
      .techniker-view .techniker-info { 
        background: #f5f5f5; 
        padding: 10px; 
        border-radius: 5px; 
        margin-top: 8px;
      }
      .techniker-view .techniker-title { font-weight: bold; margin-bottom: 6px; font-size: 13px; }
      .techniker-view .techniker-item { margin-bottom: 4px; font-size: 12px; }
      .techniker-view .audio-cues, .techniker-view .light-cues { 
        background: #e8f4fd; 
        padding: 6px; 
        border-radius: 3px; 
        margin-top: 4px;
        font-family: monospace;
        font-size: 11px;
      }
      .techniker-view .info-field {
        background: #fff3cd;
        padding: 6px;
        border-radius: 3px;
        margin-top: 4px;
        font-size: 11px;
        border-left: 3px solid #ffc107;
      }
    </style>
    <div class="techniker-view">
      ${sitzung.programmpunkte.map(pp => `
        <div class="programm-item">
          <div>
            <span class="nummer">${pp.nummer}</span>
            <span class="name">${pp.name}</span>
          </div>
          <div class="typ">${pp.typ}</div>
          <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
          <div class="techniker-info">
            <div class="techniker-title">🎛️ Techniker-Informationen</div>
            <div class="techniker-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
            <div class="techniker-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
            <div class="techniker-item">
              🔊 Audio-Informationen:
              <div class="info-field">${pp.audioInfo || 'Keine Audio-Informationen'}</div>
            </div>
            <div class="techniker-item">
              💡 Licht-Informationen:
              <div class="info-field">${pp.lightInfo || 'Keine Licht-Informationen'}</div>
            </div>
            ${pp.audioCues && pp.audioCues.length > 0 ? `
              <div class="techniker-item">
                🔊 Audio-Cues:
                <div class="audio-cues">${pp.audioCues.map(cue => cue.text || cue).join('<br>')}</div>
              </div>
            ` : ''}
            ${pp.lightCues && pp.lightCues.length > 0 ? `
              <div class="techniker-item">
                💡 Licht-Cues:
                <div class="light-cues">${pp.lightCues.map(cue => cue.text || cue).join('<br>')}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
    </div>
  `;
}

// PDF-Generierung Endpunkte
app.post('/api/sitzung/:id/pdf/all-in-one', async (req, res) => {
  try {
    const sitzung = sitzungen.get(req.params.id);
    if (!sitzung) {
      return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    }

    const browser = await initBrowser();
    const page = await browser.newPage();
    
    const programmansichtHTML = generateProgrammansichtHTML(sitzung);
    const kulissenHTML = generateKulissenHTML(sitzung);
    const moderatorHTML = generateModeratorHTML(sitzung);
    const technikerHTML = generateTechnikerHTML(sitzung);

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gesamtdokument - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
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
            .page-break {
              page-break-after: always;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000 !important; }
            }
          </style>
        </head>
        <body>
          ${programmansichtHTML}
          ${kulissenHTML}
          ${moderatorHTML}
          ${technikerHTML}
        </body>
      </html>
    `;
    
    await page.setContent(fullHtml);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="alle-ansichten-${sitzung.name}.pdf"`);
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

    // ZIP-Archiv erstellen
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximale Kompression
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="alle-ansichten-${sitzung.name}.zip"`);
    
    archive.pipe(res);

    // Alle PDFs generieren und zum ZIP hinzufügen
    for (const view of views) {
      await page.setContent(view.html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: view.landscape,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });
      
      // PDF zum ZIP hinzufügen
      archive.append(pdf, { name: `${view.name.toLowerCase().replace(' ', '-')}-${sitzung.name}.pdf` });
    }

    await archive.finalize();
    await browser.close();
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