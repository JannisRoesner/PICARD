const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
// Persistente Datenbank
const db = require('./db');
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Persistenter Status in DB (aktive Sitzung wird in Settings-Tabelle gespeichert)

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
  const list = db.getSitzungen();
  res.json(list);
});

app.post('/api/sitzung', (req, res) => {
  const { name, programmpunkte } = req.body;
  const created = db.createSitzung(name, programmpunkte || []);
  res.json(created);
});

app.get('/api/sitzung/:id', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (sitzung) {
    res.json(sitzung);
  } else {
    res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
});

app.post('/api/sitzung/:id/programmpunkt', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const insertAfter = req.body.insertAfter;
  const created = db.addProgrammpunkt(req.params.id, req.body, insertAfter);
  const mapped = {
    id: created.id,
    name: created.name,
    typ: created.typ,
    einzugCD: !!created.einzugCD,
    auszugCD: !!created.auszugCD,
    trainer: created.trainer || '',
    betreuer: created.betreuer || '',
    namensliste: created.namensliste ? JSON.parse(created.namensliste) : [],
    anmoderation: created.anmoderation,
    abmoderation: created.abmoderation,
    notizen: created.notizen,
    audioDateien: created.audioDateien ? JSON.parse(created.audioDateien) : [],
    lichtStimmung: created.lichtStimmung,
    dauer: created.dauer || 0,
    audioCues: created.audioCues ? JSON.parse(created.audioCues) : [],
    lightCues: created.lightCues ? JSON.parse(created.lightCues) : [],
    pinboardNotes: created.pinboardNotes ? JSON.parse(created.pinboardNotes) : [],
    buehne: created.buehne,
    erstellt: created.erstellt,
    nummer: created.nummer
  };
  io.emit('programmpunktHinzugefuegt', { sitzungId: req.params.id, programmpunkt: mapped });
  res.json(mapped);
});

app.put('/api/sitzung/:id/programmpunkt/:punktId', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  const updated = db.updateProgrammpunkt(req.params.id, req.params.punktId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Programmpunkt nicht gefunden' });
  }
  const mapped = {
    id: updated.id,
    name: updated.name,
    typ: updated.typ,
    einzugCD: !!updated.einzugCD,
    auszugCD: !!updated.auszugCD,
    trainer: updated.trainer || '',
    betreuer: updated.betreuer || '',
    namensliste: updated.namensliste ? JSON.parse(updated.namensliste) : [],
    anmoderation: updated.anmoderation,
    abmoderation: updated.abmoderation,
    notizen: updated.notizen,
    audioDateien: updated.audioDateien ? JSON.parse(updated.audioDateien) : [],
    lichtStimmung: updated.lichtStimmung,
    dauer: updated.dauer || 0,
    audioCues: updated.audioCues ? JSON.parse(updated.audioCues) : [],
    lightCues: updated.lightCues ? JSON.parse(updated.lightCues) : [],
    pinboardNotes: updated.pinboardNotes ? JSON.parse(updated.pinboardNotes) : [],
    buehne: updated.buehne,
    erstellt: updated.erstellt,
    nummer: updated.nummer
  };
  io.emit('programmpunktAktualisiert', { 
    sitzungId: req.params.id, 
    programmpunkt: mapped
  });
  res.json(mapped);
});

app.delete('/api/sitzung/:id/programmpunkt/:punktId', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  const ok = db.deleteProgrammpunkt(req.params.id, req.params.punktId);
  if (!ok) {
    return res.status(404).json({ error: 'Programmpunkt nicht gefunden' });
  }
  io.emit('programmpunktGeloescht', { 
    sitzungId: req.params.id, 
    programmpunktId: req.params.punktId 
  });
  res.json({ success: true });
});

app.post('/api/sitzung/:id/aktiv', (req, res) => {
  db.setAktiveSitzung(req.params.id);
  res.json({ success: true, aktiveSitzung: req.params.id });
});

app.get('/api/sitzung/:id/aktiv', (req, res) => {
  const aktiveSitzung = db.getAktiveSitzung();
  res.json({ aktiveSitzung });
});

app.delete('/api/sitzung/:id', (req, res) => {
  const ok = db.deleteSitzung(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  res.json({ success: true });
});

// Zettel-System API
app.get('/api/sitzung/:id/zettel', (req, res) => {
  const zettelListe = db.getZettelList(req.params.id);
  res.json(zettelListe);
});

app.post('/api/sitzung/:id/zettel', (req, res) => {
  const neuerZettel = db.addZettel(req.params.id, req.body);
  io.to(req.params.id).emit('zettelHinzugefuegt', {
    ...neuerZettel,
    geschlossen: !!neuerZettel.geschlossen
  });
  res.json({
    ...neuerZettel,
    geschlossen: !!neuerZettel.geschlossen
  });
});

app.delete('/api/sitzung/:id/zettel/:zettelId', (req, res) => {
  const ok = db.closeZettel(req.params.id, req.params.zettelId);
  if (!ok) {
    return res.status(404).json({ error: 'Zettel nicht gefunden' });
  }
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