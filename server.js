import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// Persistente Datenbank
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
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
  const sanitized = list.map(s => ({
    ...s,
    programmpunkte: (s.programmpunkte || []).map(p => ({
      id: p.id,
      name: p.name,
      typ: p.typ,
      einzugCD: !!p.einzugCD,
      auszugCD: !!p.auszugCD,
      trainer: p.trainer || '',
      betreuer: p.betreuer || '',
      namensliste: Array.isArray(p.namensliste) ? p.namensliste : [],
      anmoderation: p.anmoderation,
      abmoderation: p.abmoderation,
      notizen: p.notizen,
      dauer: p.dauer || 0,
      pinboardNotes: Array.isArray(p.pinboardNotes) ? p.pinboardNotes : [],
      buehne: p.buehne,
      erstellt: p.erstellt,
      nummer: p.nummer
    }))
  }));
  res.json(sanitized);
});

app.post('/api/sitzung', (req, res) => {
  const { name, programmpunkte } = req.body;
  const created = db.createSitzung(name, programmpunkte || []);
  res.json(created);
});

app.patch('/api/sitzung/:id', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }
  const ok = db.updateSitzungName(req.params.id, name.trim());
  if (!ok) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  res.json({ success: true, name: name.trim() });
});

app.get('/api/sitzung/:id', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (sitzung) {
    const sanitized = {
      ...sitzung,
      programmpunkte: (sitzung.programmpunkte || []).map(p => ({
        id: p.id,
        name: p.name,
        typ: p.typ,
        einzugCD: !!p.einzugCD,
        auszugCD: !!p.auszugCD,
        trainer: p.trainer || '',
        betreuer: p.betreuer || '',
        namensliste: Array.isArray(p.namensliste) ? p.namensliste : [],
        anmoderation: p.anmoderation,
        abmoderation: p.abmoderation,
        notizen: p.notizen,
        dauer: p.dauer || 0,
        pinboardNotes: Array.isArray(p.pinboardNotes) ? p.pinboardNotes : [],
        buehne: p.buehne,
        erstellt: p.erstellt,
        nummer: p.nummer
      }))
    };
    res.json(sanitized);
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
    dauer: created.dauer || 0,
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
    dauer: updated.dauer || 0,
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
  io.emit('aktiveSitzungGeaendert', { sitzungId: req.params.id });
  res.json({ success: true, aktiveSitzung: req.params.id });
});

app.get('/api/sitzung/:id/aktiv', (req, res) => {
  const aktiveSitzung = db.getAktiveSitzung();
  res.json({ aktiveSitzung });
});

// Neue Route: aktive Sitzung abrufen (ohne ID)
app.get('/api/aktive-sitzung', (req, res) => {
  const aktiveSitzung = db.getAktiveSitzung();
  res.json({ aktiveSitzung });
});

app.delete('/api/sitzung/:id', (req, res) => {
  const zielId = req.params.id;
  const warAktiv = db.getAktiveSitzung() === zielId;
  const ok = db.deleteSitzung(zielId);
  if (!ok) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  if (warAktiv) {
    io.emit('aktiveSitzungGeaendert', { sitzungId: null });
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
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 