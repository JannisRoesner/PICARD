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

const HiddenAudioInput = styled.input`
  display: none;
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
  user-select: text;
  -webkit-user-select: text;
  touch-action: auto;
  -webkit-touch-callout: default;
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0,0,0,0.08);
  cursor: move;
`;

const NoteTitleInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: rgba(255,255,255,0.35);
  border-radius: 4px;
  padding: 4px 6px;
  color: #111;
  font-weight: bold;
  font-size: 0.88rem;
  outline: none;

  &:focus {
    background: rgba(255,255,255,0.6);
  }
`;

const NoteRemoveButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #111;
  font-weight: bold;
`;

const AudioNoteBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: 100%;
`;

const AudioTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const AudioPlayButton = styled.button`
  border: none;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  padding: 8px 12px;
  font-weight: bold;

  &:hover {
    background: #111827;
  }
`;

const AudioFileName = styled.div`
  flex: 1;
  color: #111;
  font-size: 0.85rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const WaveformWrap = styled.div`
  position: relative;
  height: 64px;
  border: 1px solid rgba(17, 17, 17, 0.25);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.45);
  cursor: pointer;
`;

const WaveformBars = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(40, 1fr);
  gap: 2px;
  align-items: center;
  padding: 8px;
`;

const WaveformProgress = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${props => props.progress}%;
  background: rgba(17, 24, 39, 0.2);
  pointer-events: none;
`;

const WaveBar = styled.div`
  background: rgba(17, 24, 39, 0.6);
  border-radius: 2px;
  height: ${props => props.height}%;
`;

const AudioMeta = styled.div`
  color: #111;
  font-size: 0.78rem;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`;

const colors = ['#fbbf24', '#ffd166', '#caffbf', '#a0c4ff', '#ffadad', '#fdffb6'];

function randomId() { return Math.random().toString(36).slice(2, 9); }

export default function Pinboard({ sitzungId, programmpunkt, onSaved }) {
  const [notes, setNotes] = useState([]);
  const [activeColor, setActiveColor] = useState(colors[0]);
  const [audioUi, setAudioUi] = useState({});
  const [saveState, setSaveState] = useState(''); // '', 'saving', 'saved', 'error'
  const saveTimer = useRef(null);
  const audioUploadRef = useRef(null);
  const audioElementRefs = useRef({});

  useEffect(() => {
    setNotes(Array.isArray(programmpunkt?.pinboardNotes) ? programmpunkt.pinboardNotes : []);
  }, [programmpunkt?.id]);

  const addNote = () => {
    const now = new Date().toISOString();
    const newNote = {
      id: randomId(),
      type: 'text',
      title: 'Notiz',
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

  const createFallbackAudioBars = (seed, barCount = 40) => {
    const safeSeed = (seed || 'audio').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: barCount }, (_, index) => {
      const value = Math.abs(Math.sin((safeSeed + index * 7) * 0.31));
      return Math.max(18, Math.round(value * 100));
    });
  };

  const extractWaveformBarsFromFile = async (file, barCount = 40) => {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('AudioContext wird in diesem Browser nicht unterstützt.');
    }

    const audioContext = new AudioCtx();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const totalSamples = channelData.length;
      const samplesPerBar = Math.max(1, Math.floor(totalSamples / barCount));

      const bars = [];
      for (let barIndex = 0; barIndex < barCount; barIndex++) {
        const start = barIndex * samplesPerBar;
        const end = Math.min(totalSamples, start + samplesPerBar);
        let peak = 0;

        for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
          const value = Math.abs(channelData[sampleIndex]);
          if (value > peak) peak = value;
        }

        const normalized = Math.min(1, peak);
        bars.push(Math.max(12, Math.round(normalized * 100)));
      }

      return bars;
    } finally {
      await audioContext.close();
    }
  };

  const formatAudioTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNoteTitle = (note) => {
    if (note.title && note.title.trim()) return note.title;
    if (note.type === 'audio' && note.audioName) return note.audioName;
    if (note.type === 'audio') return 'Audio';
    return 'Notiz';
  };

  const addAudioNote = (audioPayload, waveformBars) => {
    const now = new Date().toISOString();
    const newNote = {
      id: randomId(),
      type: 'audio',
      title: audioPayload.audioName || 'Audio',
      x: 20 + (notes.length * 12) % 200,
      y: 20 + (notes.length * 18) % 200,
      width: 280,
      height: 190,
      color: activeColor,
      audioStoragePath: audioPayload.audioStoragePath,
      audioUrl: audioPayload.audioUrl,
      audioName: audioPayload.audioName,
      audioMimeType: audioPayload.audioMimeType,
      waveformBars,
      zIndex: (notes.reduce((m, n) => Math.max(m, n.zIndex || 1), 1) + 1),
      createdAt: now,
      updatedAt: now
    };

    const next = [...notes, newNote];
    setNotes(next);
    setAudioUi(prev => ({
      ...prev,
      [newNote.id]: {
        isPlaying: false,
        currentTime: 0,
        duration: 0
      }
    }));
    scheduleSave(next);
  };

  const handleAudioSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Bitte eine Audio-Datei auswählen.');
      event.target.value = '';
      return;
    }

    if (!sitzungId || !programmpunkt?.id) {
      alert('Bitte zuerst einen Programmpunkt auswählen.');
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const [uploadResponse, waveformBars] = await Promise.all([
        axios.post(`/api/sitzung/${sitzungId}/programmpunkt/${programmpunkt.id}/pinboard-audio`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }),
        extractWaveformBarsFromFile(file).catch(() => createFallbackAudioBars(file.name))
      ]);

      addAudioNote(uploadResponse.data, waveformBars);
    } catch (error) {
      alert('Audio-Datei konnte nicht verarbeitet werden.');
    } finally {
      event.target.value = '';
    }
  };

  const toggleAudioPlayback = (noteId) => {
    const audio = audioElementRefs.current[noteId];
    if (!audio) return;

    if (audio.paused) {
      Object.entries(audioElementRefs.current).forEach(([id, element]) => {
        if (id !== noteId && element && !element.paused) {
          element.pause();
        }
      });
      audio.play().catch(() => {
        alert('Audio konnte nicht abgespielt werden.');
      });
    } else {
      audio.pause();
    }
  };

  const handleAudioTimeUpdate = (noteId) => {
    const audio = audioElementRefs.current[noteId];
    if (!audio) return;

    setAudioUi(prev => ({
      ...prev,
      [noteId]: {
        isPlaying: !audio.paused,
        currentTime: audio.currentTime || 0,
        duration: audio.duration || prev[noteId]?.duration || 0
      }
    }));
  };

  const handleAudioLoadedMetadata = (noteId) => {
    const audio = audioElementRefs.current[noteId];
    if (!audio) return;

    setAudioUi(prev => ({
      ...prev,
      [noteId]: {
        ...(prev[noteId] || {}),
        isPlaying: false,
        currentTime: audio.currentTime || 0,
        duration: audio.duration || 0
      }
    }));
  };

  const handleAudioEnded = (noteId) => {
    setAudioUi(prev => ({
      ...prev,
      [noteId]: {
        ...(prev[noteId] || {}),
        isPlaying: false,
        currentTime: 0
      }
    }));
  };

  const seekAudioToWaveformPosition = (event, noteId) => {
    const audio = audioElementRefs.current[noteId];
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    audio.currentTime = ratio * audio.duration;
    handleAudioTimeUpdate(noteId);
  };

  const updateNote = (id, patch) => {
    const next = notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n);
    setNotes(next);
    scheduleSave(next);
  };

  const removeNote = (id) => {
    const noteToRemove = notes.find((note) => note.id === id);
    const audio = audioElementRefs.current[id];
    if (audio && !audio.paused) {
      audio.pause();
    }
    delete audioElementRefs.current[id];
    setAudioUi(prev => {
      const nextUi = { ...prev };
      delete nextUi[id];
      return nextUi;
    });

    if (noteToRemove?.type === 'audio' && noteToRemove.audioStoragePath && sitzungId && programmpunkt?.id) {
      axios.delete(`/api/sitzung/${sitzungId}/programmpunkt/${programmpunkt.id}/pinboard-audio`, {
        data: { audioStoragePath: noteToRemove.audioStoragePath }
      }).catch(() => {
        console.warn('Audio-Datei konnte serverseitig nicht gelöscht werden.');
      });
    }

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
        <Button onClick={() => audioUploadRef.current?.click()}>+ Audio</Button>
        <HiddenAudioInput
          ref={audioUploadRef}
          type="file"
          accept="audio/*,.mp3,.wav,.aac,.wma,.m4a,.ogg,.flac"
          onChange={handleAudioSelect}
        />
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
            dragHandleClassName="pinboard-note-header"
            cancel=".pinboard-note-content,.pinboard-audio-controls,.pinboard-note-title-input"
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
              <NoteHeader className="pinboard-note-header">
                <NoteTitleInput
                  className="pinboard-note-title-input"
                  value={getNoteTitle(note)}
                  onChange={(e) => updateNote(note.id, { title: e.target.value })}
                  placeholder={note.type === 'audio' ? 'Audio-Titel' : 'Titel'}
                />
                <NoteRemoveButton
                  onClick={() => removeNote(note.id)}
                  title="Notiz entfernen"
                >✕</NoteRemoveButton>
              </NoteHeader>
              {note.type === 'audio' ? (
                <AudioNoteBody className="pinboard-audio-controls">
                  <audio
                    ref={(element) => {
                      if (element) {
                        audioElementRefs.current[note.id] = element;
                      }
                    }}
                    src={note.audioUrl || note.audioSrc}
                    preload="metadata"
                    onLoadedMetadata={() => handleAudioLoadedMetadata(note.id)}
                    onTimeUpdate={() => handleAudioTimeUpdate(note.id)}
                    onPlay={() => handleAudioTimeUpdate(note.id)}
                    onPause={() => handleAudioTimeUpdate(note.id)}
                    onEnded={() => handleAudioEnded(note.id)}
                  />

                  <AudioTopRow>
                    <AudioPlayButton onClick={() => toggleAudioPlayback(note.id)}>
                      {audioUi[note.id]?.isPlaying ? '⏸ Pause' : '▶ Play'}
                    </AudioPlayButton>
                    <AudioFileName title={note.audioName || 'Audio-Datei'}>
                      {note.audioName || 'Audio-Datei'}
                    </AudioFileName>
                  </AudioTopRow>

                  <WaveformWrap onClick={(event) => seekAudioToWaveformPosition(event, note.id)}>
                    <WaveformBars>
                      {(note.waveformBars || createFallbackAudioBars(note.audioName || note.id)).map((barHeight, barIndex) => (
                        <WaveBar key={`${note.id}-${barIndex}`} height={barHeight} />
                      ))}
                    </WaveformBars>
                    <WaveformProgress
                      progress={
                        (audioUi[note.id]?.duration || 0) > 0
                          ? ((audioUi[note.id]?.currentTime || 0) / (audioUi[note.id]?.duration || 1)) * 100
                          : 0
                      }
                    />
                  </WaveformWrap>

                  <AudioMeta>
                    <span>{formatAudioTime(audioUi[note.id]?.currentTime || 0)}</span>
                    <span>{formatAudioTime(audioUi[note.id]?.duration || 0)}</span>
                  </AudioMeta>
                </AudioNoteBody>
              ) : (
                <NoteContent
                  className="pinboard-note-content"
                  value={note.text || ''}
                  onChange={(e) => updateNote(note.id, { text: e.target.value })}
                  placeholder="Text eingeben..."
                />
              )}
            </div>
          </Rnd>
        ))}
      </Board>
    </div>
  );
}
