const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const defaultDbDir = path.join(__dirname, 'data');
const dbPath = process.env.DB_PATH || path.join(defaultDbDir, 'app.db');

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS sitzungen (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  erstellt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programmpunkte (
  id TEXT PRIMARY KEY,
  sitzungId TEXT NOT NULL,
  nummer INTEGER NOT NULL,
  name TEXT NOT NULL,
  typ TEXT NOT NULL,
  einzugCD INTEGER NOT NULL DEFAULT 0,
  auszugCD INTEGER NOT NULL DEFAULT 0,
  trainer TEXT,
  betreuer TEXT,
  namensliste TEXT, -- JSON string
  anmoderation TEXT,
  abmoderation TEXT,
  notizen TEXT,
  audioDateien TEXT, -- JSON string
  lichtStimmung TEXT,
  dauer INTEGER NOT NULL DEFAULT 0,
  audioCues TEXT, -- JSON string
  lightCues TEXT, -- JSON string
  buehne TEXT,
  erstellt TEXT NOT NULL,
  FOREIGN KEY (sitzungId) REFERENCES sitzungen(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS zettel (
  id TEXT PRIMARY KEY,
  sitzungId TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  geschlossen INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (sitzungId) REFERENCES sitzungen(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function stringifyJson(value) {
  if (value === undefined) return null;
  try { return JSON.stringify(value); } catch (_) { return null; }
}

// Sitzungen
function createSitzung(name, programmpunkte = []) {
  const id = uuidv4();
  const erstellt = new Date().toISOString();
  const insertSitzung = db.prepare('INSERT INTO sitzungen (id, name, erstellt) VALUES (?, ?, ?)');
  const insertProgrammpunkt = db.prepare(`
    INSERT INTO programmpunkte (
      id, sitzungId, nummer, name, typ, einzugCD, auszugCD, trainer, betreuer,
      namensliste, anmoderation, abmoderation, notizen, audioDateien, lichtStimmung,
      dauer, audioCues, lightCues, buehne, erstellt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    insertSitzung.run(id, name, erstellt);
    programmpunkte.forEach((punkt, index) => {
      insertProgrammpunkt.run(
        uuidv4(),
        id,
        index + 1,
        punkt.name,
        punkt.typ,
        punkt.einzugCD ? 1 : 0,
        punkt.auszugCD ? 1 : 0,
        punkt.trainer || '',
        punkt.betreuer || '',
        stringifyJson(punkt.namensliste || []),
        punkt.anmoderation || 'Es wurde kein Moderationstext hinterlegt',
        punkt.abmoderation || 'Es wurde kein Moderationstext hinterlegt',
        punkt.notizen || 'Es wurden keine Notizen hinterlegt',
        stringifyJson(punkt.audioDateien || []),
        punkt.lichtStimmung || 'Standard',
        punkt.dauer || 0,
        stringifyJson(punkt.audioCues || []),
        stringifyJson(punkt.lightCues || []),
        punkt.buehne || 'Bühne: frei',
        new Date().toISOString()
      );
    });
  });
  tx();
  return getSitzungById(id);
}

function getSitzungen() {
  const list = db.prepare('SELECT id, name, erstellt FROM sitzungen ORDER BY erstellt DESC').all();
  return list.map(s => ({ ...s, programmpunkte: getProgrammpunkteForSitzung(s.id) }));
}

function getSitzungById(id) {
  const s = db.prepare('SELECT id, name, erstellt FROM sitzungen WHERE id = ?').get(id);
  if (!s) return null;
  return { ...s, programmpunkte: getProgrammpunkteForSitzung(id) };
}

function getProgrammpunkteForSitzung(sitzungId) {
  const rows = db.prepare('SELECT * FROM programmpunkte WHERE sitzungId = ? ORDER BY nummer ASC').all(sitzungId);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    typ: r.typ,
    einzugCD: !!r.einzugCD,
    auszugCD: !!r.auszugCD,
    trainer: r.trainer || '',
    betreuer: r.betreuer || '',
    namensliste: parseJson(r.namensliste, []),
    anmoderation: r.anmoderation,
    abmoderation: r.abmoderation,
    notizen: r.notizen,
    audioDateien: parseJson(r.audioDateien, []),
    lichtStimmung: r.lichtStimmung,
    dauer: r.dauer || 0,
    audioCues: parseJson(r.audioCues, []),
    lightCues: parseJson(r.lightCues, []),
    buehne: r.buehne,
    erstellt: r.erstellt,
    nummer: r.nummer
  }));
}

function addProgrammpunkt(sitzungId, punkt, insertAfter) {
  const countRow = db.prepare('SELECT COUNT(*) as c FROM programmpunkte WHERE sitzungId = ?').get(sitzungId);
  const newIndex = insertAfter !== undefined && insertAfter !== null ? insertAfter + 2 : (countRow.c + 1);

  const shiftStmt = db.prepare('UPDATE programmpunkte SET nummer = nummer + 1 WHERE sitzungId = ? AND nummer >= ?');
  const insertStmt = db.prepare(`
    INSERT INTO programmpunkte (
      id, sitzungId, nummer, name, typ, einzugCD, auszugCD, trainer, betreuer,
      namensliste, anmoderation, abmoderation, notizen, audioDateien, lichtStimmung,
      dauer, audioCues, lightCues, buehne, erstellt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const id = uuidv4();
  const created = new Date().toISOString();
  const tx = db.transaction(() => {
    if (newIndex <= countRow.c) {
      shiftStmt.run(sitzungId, newIndex);
    }
    insertStmt.run(
      id,
      sitzungId,
      newIndex,
      punkt.name,
      punkt.typ,
      punkt.einzugCD ? 1 : 0,
      punkt.auszugCD ? 1 : 0,
      punkt.trainer || '',
      punkt.betreuer || '',
      stringifyJson(punkt.namensliste || []),
      punkt.anmoderation || 'Es wurde kein Moderationstext hinterlegt',
      punkt.abmoderation || 'Es wurde kein Moderationstext hinterlegt',
      punkt.notizen || 'Es wurden keine Notizen hinterlegt',
      stringifyJson(punkt.audioDateien || []),
      punkt.lichtStimmung || 'Standard',
      punkt.dauer || 0,
      stringifyJson(punkt.audioCues || []),
      stringifyJson(punkt.lightCues || []),
      punkt.buehne || 'Bühne: frei',
      created
    );
  });
  tx();
  return db.prepare('SELECT * FROM programmpunkte WHERE id = ?').get(id);
}

function updateProgrammpunkt(sitzungId, punktId, updates) {
  const existing = db.prepare('SELECT * FROM programmpunkte WHERE id = ? AND sitzungId = ?').get(punktId, sitzungId);
  if (!existing) return null;
  const merged = {
    ...existing,
    ...updates,
    einzugCD: updates.einzugCD !== undefined ? (updates.einzugCD ? 1 : 0) : existing.einzugCD,
    auszugCD: updates.auszugCD !== undefined ? (updates.auszugCD ? 1 : 0) : existing.auszugCD,
    namensliste: updates.namensliste !== undefined ? stringifyJson(updates.namensliste) : existing.namensliste,
    audioDateien: updates.audioDateien !== undefined ? stringifyJson(updates.audioDateien) : existing.audioDateien,
    audioCues: updates.audioCues !== undefined ? stringifyJson(updates.audioCues) : existing.audioCues,
    lightCues: updates.lightCues !== undefined ? stringifyJson(updates.lightCues) : existing.lightCues
  };
  const stmt = db.prepare(`UPDATE programmpunkte SET
    name = @name,
    typ = @typ,
    einzugCD = @einzugCD,
    auszugCD = @auszugCD,
    trainer = @trainer,
    betreuer = @betreuer,
    namensliste = @namensliste,
    anmoderation = @anmoderation,
    abmoderation = @abmoderation,
    notizen = @notizen,
    audioDateien = @audioDateien,
    lichtStimmung = @lichtStimmung,
    dauer = @dauer,
    audioCues = @audioCues,
    lightCues = @lightCues,
    buehne = @buehne
    WHERE id = @id AND sitzungId = @sitzungId`);
  stmt.run({ ...merged, id: punktId, sitzungId });
  const updated = db.prepare('SELECT * FROM programmpunkte WHERE id = ?').get(punktId);
  return updated;
}

function deleteProgrammpunkt(sitzungId, punktId) {
  const existing = db.prepare('SELECT nummer FROM programmpunkte WHERE id = ? AND sitzungId = ?').get(punktId, sitzungId);
  if (!existing) return false;
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM programmpunkte WHERE id = ? AND sitzungId = ?').run(punktId, sitzungId);
    db.prepare('UPDATE programmpunkte SET nummer = nummer - 1 WHERE sitzungId = ? AND nummer > ?').run(sitzungId, existing.nummer);
  });
  tx();
  return true;
}

// Aktive Sitzung
function setAktiveSitzung(sitzungId) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('aktiveSitzung', sitzungId || '');
}

function getAktiveSitzung() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('aktiveSitzung');
  return row && row.value ? row.value : null;
}

// Zettel
function getZettelList(sitzungId) {
  const rows = db.prepare('SELECT * FROM zettel WHERE sitzungId = ? ORDER BY timestamp ASC').all(sitzungId);
  return rows.map(r => ({
    id: r.id,
    text: r.text,
    type: r.type,
    priority: r.priority,
    sender: r.sender,
    timestamp: r.timestamp,
    geschlossen: !!r.geschlossen
  }));
}

function addZettel(sitzungId, data) {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.prepare('INSERT INTO zettel (id, sitzungId, text, type, priority, sender, timestamp, geschlossen) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
    .run(id, sitzungId, data.text, data.type || 'anAlle', data.priority || 'normal', data.sender || 'unknown', timestamp);
  return db.prepare('SELECT * FROM zettel WHERE id = ?').get(id);
}

function closeZettel(sitzungId, zettelId) {
  const result = db.prepare('UPDATE zettel SET geschlossen = 1 WHERE id = ? AND sitzungId = ?').run(zettelId, sitzungId);
  return result.changes > 0;
}

function deleteSitzung(sitzungId) {
  const res = db.prepare('DELETE FROM sitzungen WHERE id = ?').run(sitzungId);
  if (getAktiveSitzung() === sitzungId) setAktiveSitzung(null);
  return res.changes > 0;
}

module.exports = {
  createSitzung,
  getSitzungen,
  getSitzungById,
  getProgrammpunkteForSitzung,
  addProgrammpunkt,
  updateProgrammpunkt,
  deleteProgrammpunkt,
  setAktiveSitzung,
  getAktiveSitzung,
  getZettelList,
  addZettel,
  closeZettel,
  deleteSitzung
};



