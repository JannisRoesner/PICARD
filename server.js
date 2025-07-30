const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

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
    programmpunktId: req.params.punktId 
  });

  res.json({ success: true });
});

app.post('/api/sitzung/:id/aktiv', (req, res) => {
  aktiveSitzung = req.params.id;
  res.json({ success: true, aktiveSitzung });
});

app.get('/api/sitzung/:id/aktiv', (req, res) => {
  res.json({ aktiveSitzung });
});

app.delete('/api/sitzung/:id', (req, res) => {
  const sitzung = sitzungen.get(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  sitzungen.delete(req.params.id);
  
  // Wenn die gelöschte Sitzung die aktive war, setze aktiveSitzung zurück
  if (aktiveSitzung === req.params.id) {
    aktiveSitzung = null;
  }

  res.json({ success: true });
});

// Zettel-System API
app.get('/api/sitzung/:id/zettel', (req, res) => {
  const zettelListe = zettel.get(req.params.id) || [];
  res.json(zettelListe);
});

app.post('/api/sitzung/:id/zettel', (req, res) => {
  const { text, type, priority, sender } = req.body;
  const zettelListe = zettel.get(req.params.id) || [];
  
  const neuerZettel = {
    id: uuidv4(),
    text,
    type: type || 'anAlle',
    priority: priority || 'normal',
    sender: sender || 'unknown',
    timestamp: new Date().toISOString(),
    geschlossen: false
  };
  
  zettelListe.push(neuerZettel);
  zettel.set(req.params.id, zettelListe);
  
  // Echtzeit-Update
  io.to(req.params.id).emit('zettelHinzugefuegt', neuerZettel);
  
  res.json(neuerZettel);
});

app.delete('/api/sitzung/:id/zettel/:zettelId', (req, res) => {
  const zettelListe = zettel.get(req.params.id) || [];
  const zettelIndex = zettelListe.findIndex(z => z.id === req.params.zettelId);
  
  if (zettelIndex === -1) {
    return res.status(404).json({ error: 'Zettel nicht gefunden' });
  }
  
  // Markiere Zettel als geschlossen statt zu löschen
  zettelListe[zettelIndex].geschlossen = true;
  zettel.set(req.params.id, zettelListe);
  
  // Echtzeit-Update
  io.to(req.params.id).emit('zettelGeschlossen', { 
    zettelId: req.params.zettelId,
    sitzungId: req.params.id 
  });
  
  res.json({ success: true });
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