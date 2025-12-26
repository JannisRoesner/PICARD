import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Rnd } from 'react-rnd';

const Board = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid #333;
  border-radius: 8px;
  background: repeating-linear-gradient(
      0deg,
      #141414,
      #141414 20px,
      #151515 20px,
      #151515 40px
    );
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #333;
  background: #1a1a1a;
`;

const Button = styled.button`
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  cursor: pointer;
  font-weight: bold;

  &:hover { background: #3a3a3a; }
`;

const ColorSwatch = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 2px solid #222;
  cursor: pointer;
`;

const NoteContent = styled.textarea`
  width: 100%;
  height: 100%;
  background: transparent;
  color: #111;
  border: none;
  outline: none;
  font-size: 0.95rem;
  line-height: 1.25;
  padding: 8px;
  resize: none;
`;

const colors = ['#fbbf24', '#ffd166', '#caffbf', '#a0c4ff', '#ffadad', '#fdffb6'];

function randomId() { return Math.random().toString(36).slice(2, 9); }

export default function Pinboard({ sitzungId, programmpunkt, onSaved }) {
  const [notes, setNotes] = useState([]);
  const [activeColor, setActiveColor] = useState(colors[0]);
  const [saveState, setSaveState] = useState(''); // '', 'saving', 'saved', 'error'
  const saveTimer = useRef(null);

  useEffect(() => {
    setNotes(Array.isArray(programmpunkt?.pinboardNotes) ? programmpunkt.pinboardNotes : []);
  }, [programmpunkt?.id]);

  const addNote = () => {
    const now = new Date().toISOString();
    const newNote = {
      id: randomId(),
      x: 20 + (notes.length * 12) % 200,
      y: 20 + (notes.length * 18) % 200,
      width: 200,
      height: 140,
      color: activeColor,
      text: '',
      zIndex: (notes.reduce((m, n) => Math.max(m, n.zIndex || 1), 1) + 1),
      createdAt: now,
      updatedAt: now
    };
    const next = [...notes, newNote];
    setNotes(next);
    scheduleSave(next);
  };

  const updateNote = (id, patch) => {
    const next = notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n);
    setNotes(next);
    scheduleSave(next);
  };

  const removeNote = (id) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    scheduleSave(next);
  };

  const scheduleSave = (payload) => {
    // Snapshot der aktuellen IDs, um Race-Conditions bei Timeout zu vermeiden
    const targetSitzungId = sitzungId;
    const targetProgrammpunktId = programmpunkt?.id;
    if (!targetProgrammpunktId || !targetSitzungId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await axios.put(`/api/sitzung/${targetSitzungId}/programmpunkt/${targetProgrammpunktId}`, {
          pinboardNotes: payload
        });
        setSaveState('saved');
        setTimeout(() => setSaveState(''), 1000);
        onSaved && onSaved(payload);
      } catch (e) {
        console.error('Fehler beim Speichern der Pinwand-Notizen:', e);
        setSaveState('error');
        setTimeout(() => setSaveState(''), 1500);
      }
    }, 600);
  };

  const boardBounds = useMemo(() => ({ width: '100%', height: '100%' }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Button onClick={addNote}>+ Notiz</Button>
        <div style={{ display: 'flex', gap: 6 }}>
          {colors.map(c => (
            <ColorSwatch
              key={c}
              onClick={() => setActiveColor(c)}
              style={{ background: c, boxShadow: c === activeColor ? '0 0 0 2px #fff inset' : 'none' }}
              title="Farbe wählen"
            />
          ))}
        </div>
        <div style={{ marginLeft: 'auto', color: saveState === 'error' ? '#dc3545' : saveState === 'saved' ? '#28a745' : '#888' }}>
          {saveState === 'saving' && 'Speichern...'}
          {saveState === 'saved' && 'Gespeichert'}
          {saveState === 'error' && 'Fehler'}
        </div>
      </Toolbar>
      <Board>
        {notes.map(note => (
          <Rnd
            key={note.id}
            default={{ x: note.x || 0, y: note.y || 0, width: note.width || 200, height: note.height || 140 }}
            bounds="parent"
            enableUserSelectHack
            onDragStop={(e, d) => updateNote(note.id, { x: d.x, y: d.y })}
            onResizeStop={(e, dir, ref, delta, position) => updateNote(note.id, {
              width: parseInt(ref.style.width, 10),
              height: parseInt(ref.style.height, 10),
              x: position.x,
              y: position.y
            })}
            style={{ zIndex: note.zIndex || 1 }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              background: note.color || colors[0],
              border: '2px solid #222',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(0,0,0,0.08)'
              }}>
                <span style={{ fontWeight: 'bold', color: '#111' }}>Notiz</span>
                <button
                  onClick={() => removeNote(note.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 'bold' }}
                  title="Notiz entfernen"
                >✕</button>
              </div>
              <NoteContent
                value={note.text || ''}
                onChange={(e) => updateNote(note.id, { text: e.target.value })}
                placeholder="Text eingeben..."
              />
            </div>
          </Rnd>
        ))}
      </Board>
    </div>
  );
}
