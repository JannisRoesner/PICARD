import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';
import session from 'express-session';
import SqliteStore from 'better-sqlite3-session-store';
import bcrypt from 'bcrypt';
// Persistente Datenbank
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaRoot = path.join(__dirname, 'data', 'media');

if (!fs.existsSync(mediaRoot)) {
  fs.mkdirSync(mediaRoot, { recursive: true });
}

const toPosixPath = (value = '') => value.replace(/\\/g, '/').replace(/^\/+/, '');
const getAbsoluteMediaPath = (relativePath = '') => path.resolve(mediaRoot, toPosixPath(relativePath));
const isPathInsideMediaRoot = (absolutePath) => absolutePath.startsWith(path.resolve(mediaRoot));

const getAudioStoragePathFromNote = (note = {}) => {
  if (typeof note.audioStoragePath === 'string' && note.audioStoragePath.trim()) {
    return toPosixPath(note.audioStoragePath.trim());
  }
  if (typeof note.audioUrl === 'string' && note.audioUrl.startsWith('/media/')) {
    return toPosixPath(note.audioUrl.slice('/media/'.length));
  }
  return null;
};

const getProgrammpunktIdMap = (sitzung) => {
  return new Map((sitzung?.programmpunkte || []).map((punkt) => [punkt.id, punkt]));
};

const audioUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sitzungId = req.params.id;
    const punktId = req.params.punktId;
    const relativeDir = toPosixPath(path.join('audio', sitzungId, punktId));
    const absoluteDir = getAbsoluteMediaPath(relativeDir);
    fs.mkdirSync(absoluteDir, { recursive: true });
    cb(null, absoluteDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  }
});

const audioUpload = multer({
  storage: audioUploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('audio/')) {
      cb(new Error('Nur Audio-Dateien sind erlaubt.'));
      return;
    }
    cb(null, true);
  }
});

const zipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }
});

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use('/media', express.static(mediaRoot));

// Session Store
const SessionStore = SqliteStore(session);
app.use(session({
  store: new SessionStore({
    client: db.db,
    expired: {
      clear: true,
      intervalMs: 900000 // Clean expired sessions every 15 minutes
    }
  }),
  secret: process.env.SESSION_SECRET || 'picard-session-secret-' + randomUUID(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  }
}));

// Initialize password if not set
(async () => {
  const existingHash = db.getPasswordHash();
  if (!existingHash) {
    const initialPassword = process.env.ADMIN_PASSWORD || 'admin';
    const hash = await bcrypt.hash(initialPassword, 10);
    db.setPasswordHash(hash);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('⚠️  WARNUNG: Kein ADMIN_PASSWORD gesetzt. Standard-Passwort "admin" wird verwendet.');
      console.warn('   Bitte ändern Sie das Passwort nach dem ersten Login!');
    } else {
      console.log('✓ Initiales Admin-Passwort wurde gesetzt.');
    }
  }
})();

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
  SOLO: 'SOLO',
  GESANG: 'GESANG',
  MODERATION: 'MODERATION',
  PUBLIKUM: 'PUBLIKUM',
  PAUSE: 'PAUSE',
  SONSTIGES: 'SONSTIGES'
};

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Passwort erforderlich' });
  }

  const storedHash = db.getPasswordHash();
  if (!storedHash) {
    return res.status(500).json({ error: 'Keine Passwort-Konfiguration gefunden' });
  }

  const isValid = await bcrypt.compare(password, storedHash);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }

  req.session.authenticated = true;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session-Fehler' });
    }
    res.json({ success: true });
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

app.post('/api/auth/change-password', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
    return res.status(400).json({ error: 'Ungültige Passwort-Daten (mindestens 4 Zeichen erforderlich)' });
  }

  const storedHash = db.getPasswordHash();
  const isValid = await bcrypt.compare(currentPassword, storedHash);

  if (!isValid) {
    return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  db.setPasswordHash(newHash);

  res.json({ success: true });
});

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

app.put('/api/sitzung/:id/programmpunkte/reorder', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }
  const { programmpunkte } = req.body;
  if (!Array.isArray(programmpunkte)) {
    return res.status(400).json({ error: 'Programmpunkte müssen ein Array sein' });
  }
  db.reorderProgrammpunkte(req.params.id, programmpunkte);
  io.emit('programmpunkteReordert', { sitzungId: req.params.id });
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
  const sitzungMediaDir = getAbsoluteMediaPath(path.join('audio', zielId));
  if (isPathInsideMediaRoot(sitzungMediaDir) && fs.existsSync(sitzungMediaDir)) {
    fs.rmSync(sitzungMediaDir, { recursive: true, force: true });
  }
  if (warAktiv) {
    io.emit('aktiveSitzungGeaendert', { sitzungId: null });
  }
  res.json({ success: true });
});

app.post('/api/sitzung/:id/programmpunkt/:punktId/pinboard-audio', audioUpload.single('audio'), (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const punktMap = getProgrammpunktIdMap(sitzung);
  if (!punktMap.has(req.params.punktId)) {
    return res.status(404).json({ error: 'Programmpunkt nicht gefunden' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Audio-Datei hochgeladen' });
  }

  const audioStoragePath = toPosixPath(path.join('audio', req.params.id, req.params.punktId, req.file.filename));

  res.json({
    success: true,
    audioStoragePath,
    audioUrl: `/media/${audioStoragePath}`,
    audioName: req.file.originalname,
    audioMimeType: req.file.mimetype,
    audioSize: req.file.size
  });
});

app.delete('/api/sitzung/:id/programmpunkt/:punktId/pinboard-audio', (req, res) => {
  const { audioStoragePath } = req.body || {};
  if (!audioStoragePath || typeof audioStoragePath !== 'string') {
    return res.status(400).json({ error: 'audioStoragePath fehlt' });
  }

  const normalized = toPosixPath(audioStoragePath);
  const expectedPrefix = toPosixPath(path.join('audio', req.params.id, req.params.punktId));
  if (!normalized.startsWith(`${expectedPrefix}/`) && normalized !== expectedPrefix) {
    return res.status(400).json({ error: 'Ungültiger Audio-Pfad' });
  }

  const absolutePath = getAbsoluteMediaPath(normalized);
  if (!isPathInsideMediaRoot(absolutePath)) {
    return res.status(400).json({ error: 'Ungültiger Audio-Pfad' });
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  res.json({ success: true });
});

app.get('/api/sitzung/:id/export', (req, res) => {
  const sitzung = db.getSitzungById(req.params.id);
  if (!sitzung) {
    return res.status(404).json({ error: 'Sitzung nicht gefunden' });
  }

  const exportPayload = JSON.parse(JSON.stringify(sitzung));
  const zip = new AdmZip();

  (exportPayload.programmpunkte || []).forEach((punkt) => {
    punkt.pinboardNotes = (punkt.pinboardNotes || []).map((note) => {
      if (note?.type !== 'audio') return note;

      const storagePath = getAudioStoragePathFromNote(note);
      if (!storagePath) return note;

      const absoluteSource = getAbsoluteMediaPath(storagePath);
      if (!isPathInsideMediaRoot(absoluteSource) || !fs.existsSync(absoluteSource)) {
        return note;
      }

      const zipPath = toPosixPath(path.join('media', storagePath));
      zip.addFile(zipPath, fs.readFileSync(absoluteSource));

      return {
        ...note,
        audioStoragePath: storagePath,
        audioUrl: `/media/${storagePath}`
      };
    });
  });

  zip.addFile('sitzung.json', Buffer.from(JSON.stringify(exportPayload, null, 2), 'utf8'));
  const zipBuffer = zip.toBuffer();

  const fileName = `sitzung_${(sitzung.name || 'export').replace(/[^a-zA-Z0-9-_]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(zipBuffer);
});

app.post('/api/sitzung/import-zip', zipUpload.single('archive'), (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'Keine ZIP-Datei hochgeladen' });
  }

  let zip;
  try {
    zip = new AdmZip(req.file.buffer);
  } catch {
    return res.status(400).json({ error: 'Ungültige ZIP-Datei' });
  }

  const entries = zip.getEntries();
  const sitzungEntry = entries.find((entry) => !entry.isDirectory && entry.entryName.endsWith('sitzung.json'));
  if (!sitzungEntry) {
    return res.status(400).json({ error: 'sitzung.json fehlt in der ZIP-Datei' });
  }

  let sitzungData;
  try {
    sitzungData = JSON.parse(sitzungEntry.getData().toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'sitzung.json ist ungültig' });
  }

  if (!sitzungData?.name || !Array.isArray(sitzungData.programmpunkte)) {
    return res.status(400).json({ error: 'Ungültige Sitzungsstruktur in sitzung.json' });
  }

  const preparedProgrammpunkte = sitzungData.programmpunkte.map((punkt) => ({
    ...punkt,
    pinboardNotes: Array.isArray(punkt.pinboardNotes) ? punkt.pinboardNotes : []
  }));

  const createdSitzung = db.createSitzung(`${sitzungData.name} (Importiert)`, preparedProgrammpunkte);
  const createdPunkte = createdSitzung?.programmpunkte || [];

  createdPunkte.forEach((createdPunkt, index) => {
    const importedPunkt = preparedProgrammpunkte[index] || {};
    const importedNotes = Array.isArray(importedPunkt.pinboardNotes) ? importedPunkt.pinboardNotes : [];

    const mappedNotes = importedNotes.map((note) => {
      if (note?.type !== 'audio') {
        return { ...note, type: 'text' };
      }

      const oldStoragePath = getAudioStoragePathFromNote(note);
      const zipCandidates = [
        oldStoragePath ? toPosixPath(path.join('media', oldStoragePath)) : null,
        oldStoragePath || null
      ].filter(Boolean);

      const audioEntry = zipCandidates
        .map((candidate) => entries.find((entry) => !entry.isDirectory && toPosixPath(entry.entryName) === candidate))
        .find(Boolean);

      if (!audioEntry) {
        return {
          ...note,
          type: 'audio'
        };
      }

      const extFromEntry = path.extname(audioEntry.entryName || '');
      const extFromName = path.extname(note.audioName || '');
      const ext = (extFromEntry || extFromName || '').slice(0, 10);
      const newFileName = `${randomUUID()}${ext}`;
      const newStoragePath = toPosixPath(path.join('audio', createdSitzung.id, createdPunkt.id, newFileName));
      const absoluteTarget = getAbsoluteMediaPath(newStoragePath);
      fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });
      fs.writeFileSync(absoluteTarget, audioEntry.getData());

      return {
        ...note,
        type: 'audio',
        audioStoragePath: newStoragePath,
        audioUrl: `/media/${newStoragePath}`,
        audioSrc: undefined
      };
    });

    db.updateProgrammpunkt(createdSitzung.id, createdPunkt.id, {
      pinboardNotes: mappedNotes
    });
  });

  const refreshed = db.getSitzungById(createdSitzung.id);
  res.json({ success: true, sitzung: refreshed });
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

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Datei ist zu groß' });
    }
    return res.status(400).json({ error: error.message || 'Upload-Fehler' });
  }

  if (error) {
    console.error('API-Fehler:', error);
    return res.status(400).json({ error: error.message || 'Unbekannter Fehler' });
  }

  next();
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