import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';

const Container = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  grid-template-rows: 60px 1fr;
  height: calc(100vh - 60px);
  gap: 10px;
  padding: 10px;
  background: #000;
`;

const StatusBar = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #333;
  border-radius: 8px;
  padding: 0 20px;
  font-size: 1.2rem;
  font-weight: bold;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusLabel = styled.span`
  color: #ccc;
`;

const StatusValue = styled.span`
  color: ${props => {
    if (props.type === 'nummer') return '#ff0000';
    if (props.type === 'name') return '#ff6347';
    if (props.type === 'typ') return '#1e90ff';
    if (props.type === 'dauer') return '#32cd32';
    if (props.type === 'einzug') return '#32cd32';
    if (props.type === 'auszug') return '#ff0000';
    return '#fff';
  }};
`;

const Panel = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PanelTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
`;

const ProgramList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ProgramItem = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => {
    if (props.isActive) return props.theme?.colors?.primary || '#fbbf24';
    if (props.active) return '#2d2d2d';
    return '#1a1a1a';
  }};
  border: 2px solid ${props => {
    if (props.isActive) return props.theme?.colors?.primary || '#fbbf24';
    if (props.active) return '#666';
    return '#333';
  }};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  font-weight: ${props => (props.active || props.isActive) ? 'bold' : 'normal'};
  animation: ${props => props.isActive ? 'blink 1s infinite' : 'none'};
  color: ${props => props.isActive ? '#181818' : '#fff'};

  &:hover {
    background: ${props => {
      if (props.isActive) return (props.theme?.colors?.primary || '#fbbf24') + 'cc';
      if (props.active) return '#3d3d3d';
      return '#2d2d2d';
    }};
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.7; }
  }
`;

const ProgramName = styled.span`
  color: inherit;
  font-weight: bold;
`;
const ProgramType = styled.span`
  color: ${props => props.isActive ? '#181818' : '#ccc'};
  margin-left: 8px;
`;
const ProgramDuration = styled.span`
  color: ${props => props.isActive ? '#181818' : '#888'};
  margin-left: 8px;
`;

const TechInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 100%;
`;

const TechSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TechCard = styled.div`
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 16px;
  flex: 1;
`;

const TechCardTitle = styled.h4`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin: 0 0 12px 0;
  font-size: 1.1rem;
`;

const AudioFile = styled.div`
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AudioFileName = styled.span`
  color: #fff;
  font-weight: bold;
`;

const AudioFileDuration = styled.span`
  color: #ccc;
  font-size: 0.9rem;
`;

const LightPreset = styled.div`
  background: ${props => {
    switch (props.preset) {
      case 'Standard': return '#2d2d2d';
      case 'Warm': return '#8B4513';
      case 'Kalt': return '#4169E1';
      case 'Dramatisch': return '#4B0082';
      case 'Party': return '#FF1493';
      default: return '#2d2d2d';
    }
  }};
  border: 2px solid ${props => {
    switch (props.preset) {
      case 'Standard': return '#555';
      case 'Warm': return '#D2691E';
      case 'Kalt': return '#6495ED';
      case 'Dramatisch': return '#9932CC';
      case 'Party': return '#FF69B4';
      default: return '#555';
    }
  }};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  text-align: center;
  font-weight: bold;
  color: #fff;
`;



const NoSitzungMessage = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: #ccc;
`;

// Timer-Komponenten für die Statusleiste (identisch mit ModeratorView)
const ModeratorTimerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '20' : 'rgba(251,191,36,0.1)')};
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '50' : 'rgba(251,191,36,0.3)')};
`;

const ModeratorTimerDisplay = styled.div`
  color: ${props => props.warning ? '#ffc107' : props => props.danger ? '#dc3545' : '#ff6b35'};
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
`;

const ModeratorTimerDuration = styled.div`
  color: #888;
  font-size: 0.8rem;
`;

const ModeratorProgressBar = styled.div`
  width: 60px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
`;

const ModeratorProgressFill = styled.div`
  height: 100%;
  background: ${props => props.warning ? '#ffc107' : props => props.danger ? '#dc3545' : '#28a745'};
  width: ${props => props.progress}%;
  transition: width 1s ease, background 0.3s ease;
`;

const CueList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const CueItem = styled.div`
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #666;
  }
`;

const CueTime = styled.div`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const CueDescription = styled.div`
  color: #fff;
  font-size: 1rem;
`;

const EditableCueItem = styled.div`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
`;

const CueInput = styled.input`
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 0.9rem;
  margin-bottom: 6px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const CueTextarea = styled.textarea`
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 0.9rem;
  width: 100%;
  min-height: 40px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const CueButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 4px;

  &:hover {
    background: #218838;
  }

  &.delete {
    background: #dc3545;

    &:hover {
      background: #c82333;
    }
  }
`;

function TechnikerView() {
  const [sitzung, setSitzung] = useState(null);
  const [selectedProgrammpunkt, setSelectedProgrammpunkt] = useState(null);
  const [audioCues, setAudioCues] = useState([]);
  const [lightCues, setLightCues] = useState([]);
  const [editingCue, setEditingCue] = useState(null);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { 
    activeProgrammpunkt, 
    timerState, 
    formatTime,
    getProgressPercentage, 
    getTimerColor 
  } = useTimer();
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (aktiveSitzung) {
      loadSitzung();
      socket?.emit('joinSitzung', aktiveSitzung);
    }

    return () => {
      if (aktiveSitzung) {
        socket?.emit('leaveSitzung', aktiveSitzung);
      }
    };
  }, [aktiveSitzung, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
    socket.on('programmpunktAktualisiert', handleProgrammpunktUpdate);
    socket.on('programmpunktGeloescht', handleProgrammpunktUpdate);

    return () => {
      socket.off('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
      socket.off('programmpunktAktualisiert', handleProgrammpunktUpdate);
      socket.off('programmpunktGeloescht', handleProgrammpunktUpdate);
    };
  }, [socket, aktiveSitzung]);

  useEffect(() => {
    if (sitzung && sitzung.programmpunkte.length > 0 && !selectedProgrammpunkt) {
      setSelectedProgrammpunkt(sitzung.programmpunkte[0]);
    }
  }, [sitzung, selectedProgrammpunkt]);

  const loadSitzung = async () => {
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      setSitzung(response.data);
      // Nur beim initialen Laden setzen, nicht bei jedem Update
      // if (response.data.programmpunkte.length > 0) {
      //   setSelectedProgrammpunkt(response.data.programmpunkte[0]);
      // }
    } catch (error) {
      console.error('Fehler beim Laden der Sitzung:', error);
    }
  };

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
    }
  };

  // Lade Cues aus dem Programmpunkt (falls vorhanden), sonst Standardwerte
  const handleProgrammpunktSelect = (programmpunkt) => {
    setSelectedProgrammpunkt(programmpunkt);
    setAudioCues(programmpunkt.audioCues || [
      { time: '00:00', description: 'Einzug starten' },
      { time: '00:30', description: 'Hauptmusik starten' },
      { time: formatDuration((programmpunkt.dauer || 0) - 30), description: 'Auszug vorbereiten' }
    ]);
    setLightCues(programmpunkt.lightCues || [
      { time: '00:00', description: 'Einzug-Licht aktivieren' },
      { time: '00:05', description: 'Hauptlicht auf 80%' },
      { time: '00:45', description: 'Spotlight auf Hauptperson' },
      { time: formatDuration((programmpunkt.dauer || 0) - 15), description: 'Auszug-Licht vorbereiten' }
    ]);
  };

  // NEU: Immer wenn selectedProgrammpunkt sich ändert, Cues laden
  useEffect(() => {
    if (selectedProgrammpunkt) {
      setAudioCues(selectedProgrammpunkt.audioCues || [
        { time: '00:00', description: 'Einzug starten' },
        { time: '00:30', description: 'Hauptmusik starten' },
        { time: formatDuration((selectedProgrammpunkt.dauer || 0) - 30), description: 'Auszug vorbereiten' }
      ]);
      setLightCues(selectedProgrammpunkt.lightCues || [
        { time: '00:00', description: 'Einzug-Licht aktivieren' },
        { time: '00:05', description: 'Hauptlicht auf 80%' },
        { time: '00:45', description: 'Spotlight auf Hauptperson' },
        { time: formatDuration((selectedProgrammpunkt.dauer || 0) - 15), description: 'Auszug-Licht vorbereiten' }
      ]);
    }
  }, [selectedProgrammpunkt]);

  // Automatisches Speichern der Cues (debounced)
  useEffect(() => {
    if (!selectedProgrammpunkt) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('saving');
    saveTimeout.current = setTimeout(() => {
      autoSaveCues();
    }, 1000);
    // eslint-disable-next-line
  }, [audioCues, lightCues, selectedProgrammpunkt?.id]);

  const autoSaveCues = async () => {
    if (!selectedProgrammpunkt) return;
    try {
      await axios.put(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selectedProgrammpunkt.id}`, {
        audioCues,
        lightCues
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 1200);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      console.error('Fehler beim Speichern der Cues:', error);
    }
  };

  const addCue = (type) => {
    const newCue = { time: '00:00', description: 'Neuer Cue' };
    if (type === 'audio') {
      setAudioCues(prev => [...prev, newCue]);
    } else {
      setLightCues(prev => [...prev, newCue]);
    }
  };

  const updateCue = (type, index, field, value) => {
    if (type === 'audio') {
      setAudioCues(prev => prev.map((cue, i) => 
        i === index ? { ...cue, [field]: value } : cue
      ));
    } else {
      setLightCues(prev => prev.map((cue, i) => 
        i === index ? { ...cue, [field]: value } : cue
      ));
    }
  };

  const deleteCue = (type, index) => {
    if (type === 'audio') {
      setAudioCues(prev => prev.filter((_, i) => i !== index));
    } else {
      setLightCues(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleStartTimer = () => {
    const duration = selectedProgrammpunkt?.dauer || 300;
    // Timer synchron mit Moderator starten
    // Techniker können den Timer nicht direkt steuern, nur anzeigen
  };

  const handleStopTimer = () => {
    // Timer synchron mit Moderator stoppen
    // Techniker können den Timer nicht direkt steuern, nur anzeigen
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio-Dateien bearbeiten
  const updateAudioFile = (index, field, value) => {
    if (!selectedProgrammpunkt) return;
    const updated = [...(selectedProgrammpunkt.audioDateien || [])];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProgrammpunkt({ ...selectedProgrammpunkt, audioDateien: updated });
    autoSaveAudioFiles(updated);
  };

  const deleteAudioFile = (index) => {
    if (!selectedProgrammpunkt) return;
    const updated = [...(selectedProgrammpunkt.audioDateien || [])];
    updated.splice(index, 1);
    setSelectedProgrammpunkt({ ...selectedProgrammpunkt, audioDateien: updated });
    autoSaveAudioFiles(updated);
  };

  const addAudioFile = () => {
    if (!selectedProgrammpunkt) return;
    const updated = [...(selectedProgrammpunkt.audioDateien || []), { name: '', duration: '' }];
    setSelectedProgrammpunkt({ ...selectedProgrammpunkt, audioDateien: updated });
    autoSaveAudioFiles(updated);
  };

  const autoSaveAudioFiles = async (audioDateien) => {
    if (!selectedProgrammpunkt) return;
    try {
      await axios.put(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selectedProgrammpunkt.id}`, {
        audioDateien
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 1200);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      console.error('Fehler beim Speichern der Audio-Dateien:', error);
    }
  };

  // Lichtstimmung bearbeiten
  const updateLichtStimmung = (value) => {
    if (!selectedProgrammpunkt) return;
    setSelectedProgrammpunkt({ ...selectedProgrammpunkt, lichtStimmung: value });
    autoSaveLichtStimmung(value);
  };

  const autoSaveLichtStimmung = async (lichtStimmung) => {
    if (!selectedProgrammpunkt) return;
    try {
      await axios.put(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selectedProgrammpunkt.id}`, {
        lichtStimmung
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 1200);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      console.error('Fehler beim Speichern der Lichtstimmung:', error);
    }
  };

  if (!aktiveSitzung) {
    return (
      <NoSitzungMessage>
        Keine aktive Sitzung ausgewählt. Bitte wählen Sie eine Sitzung aus.
      </NoSitzungMessage>
    );
  }

  if (!sitzung) {
    return (
      <NoSitzungMessage>
        Lade Sitzung...
      </NoSitzungMessage>
    );
  }

  return (
    <Container>
      <StatusBar>
        <StatusItem>
          <StatusLabel>Nummer:</StatusLabel>
          <StatusValue type="nummer">
            {selectedProgrammpunkt?.nummer || '-'}
          </StatusValue>
        </StatusItem>
        <StatusItem>
          <StatusLabel>Name:</StatusLabel>
          <StatusValue type="name">
            {selectedProgrammpunkt?.name || '-'}
          </StatusValue>
        </StatusItem>
        <StatusItem>
          <StatusLabel>Typ:</StatusLabel>
          <StatusValue type="typ">
            {selectedProgrammpunkt?.typ || '-'}
          </StatusValue>
        </StatusItem>
        <StatusItem>
          <StatusLabel>Einzug:</StatusLabel>
          <StatusValue type="einzug">
            {selectedProgrammpunkt?.einzugCD ? 'CD' : 'Kapelle'}
          </StatusValue>
        </StatusItem>
        <StatusItem>
          <StatusLabel>Auszug:</StatusLabel>
          <StatusValue type="auszug">
            {selectedProgrammpunkt?.auszugCD ? 'CD' : 'Kapelle'}
          </StatusValue>
        </StatusItem>
        <StatusItem>
          <StatusLabel>Dauer:</StatusLabel>
          <StatusValue type="dauer">
            {formatDuration(selectedProgrammpunkt?.dauer)}
          </StatusValue>
        </StatusItem>
        {activeProgrammpunkt && timerState.isRunning && (
          <StatusItem>
            <ModeratorTimerContainer>
              <ModeratorTimerDisplay 
                warning={getTimerColor() === 'warning'}
                danger={getTimerColor() === 'danger'}
              >
                {formatTime(timerState.remainingTime)}
              </ModeratorTimerDisplay>
              
              <ModeratorTimerDuration>
                / {formatTime(activeProgrammpunkt.dauer || 0)}
              </ModeratorTimerDuration>
              
              <ModeratorProgressBar>
                <ModeratorProgressFill 
                  progress={getProgressPercentage()}
                  warning={getTimerColor() === 'warning'}
                  danger={getTimerColor() === 'danger'}
                />
              </ModeratorProgressBar>
            </ModeratorTimerContainer>
          </StatusItem>
        )}
      </StatusBar>

      {/* Programmablauf (Links) */}
      <Panel>
        <PanelTitle>Programmablauf</PanelTitle>
        <ProgramList>
          {sitzung.programmpunkte.map((programmpunkt) => (
            <ProgramItem
              key={programmpunkt.id}
              active={selectedProgrammpunkt?.id === programmpunkt.id}
              isActive={activeProgrammpunkt?.id === programmpunkt.id}
              onClick={() => handleProgrammpunktSelect(programmpunkt)}
            >
              <ProgramName>{programmpunkt.nummer}</ProgramName> <ProgramType isActive={activeProgrammpunkt?.id === programmpunkt.id}>{programmpunkt.typ}</ProgramType> <ProgramName>{programmpunkt.name}</ProgramName>
              <ProgramDuration isActive={activeProgrammpunkt?.id === programmpunkt.id}>{formatDuration(programmpunkt.dauer)}</ProgramDuration>
            </ProgramItem>
          ))}
        </ProgramList>
      </Panel>

      {/* Technische Informationen (Rechts) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <TechInfoGrid>
          {/* Audio Section */}
          <TechSection>
            <TechCard>
              <TechCardTitle>🎚️ Audio-Cues</TechCardTitle>
              <CueList>
                {audioCues.map((cue, index) => (
                  <EditableCueItem key={index}>
                    <CueInput
                      type="text"
                      value={cue.time}
                      onChange={(e) => updateCue('audio', index, 'time', e.target.value)}
                      placeholder="00:00"
                    />
                    <CueTextarea
                      value={cue.description}
                      onChange={(e) => updateCue('audio', index, 'description', e.target.value)}
                      placeholder="Cue-Beschreibung"
                    />
                    <CueButton 
                      className="delete"
                      onClick={() => deleteCue('audio', index)}
                    >
                      Löschen
                    </CueButton>
                  </EditableCueItem>
                ))}
                <CueButton onClick={() => addCue('audio')}>
                  + Audio-Cue hinzufügen
                </CueButton>
              </CueList>
              {/* Statusanzeige für automatisches Speichern */}
              {saveStatus === 'saving' && (
                <div style={{ color: '#888', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Speichern...</div>
              )}
              {saveStatus === 'saved' && (
                <div style={{ color: '#28a745', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Gespeichert</div>
              )}
              {saveStatus === 'error' && (
                <div style={{ color: '#dc3545', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Fehler beim Speichern</div>
              )}
            </TechCard>
            <TechCard>
              <TechCardTitle>🎵 Audio-Informationen</TechCardTitle>
              {selectedProgrammpunkt?.audioDateien?.length > 0 ? (
                selectedProgrammpunkt.audioDateien.map((audio, index) => (
                  <EditableCueItem key={index}>
                    <CueInput
                      type="text"
                      value={audio.name}
                      onChange={e => updateAudioFile(index, 'name', e.target.value)}
                      placeholder="Dateiname"
                    />
                    <CueInput
                      type="text"
                      value={audio.duration}
                      onChange={e => updateAudioFile(index, 'duration', e.target.value)}
                      placeholder="Dauer (Sekunden)"
                    />
                    <CueButton className="delete" onClick={() => deleteAudioFile(index)}>
                      Löschen
                    </CueButton>
                  </EditableCueItem>
                ))
              ) : (
                <div style={{ color: '#888', fontStyle: 'italic' }}>
                  Keine Audio-Dateien verfügbar
                </div>
              )}
              <CueButton onClick={addAudioFile}>
                + Audioinformationen hinzufügen
              </CueButton>
            </TechCard>
          </TechSection>

          {/* Light Section */}
          <TechSection>
            <TechCard>
              <TechCardTitle>🎭 Licht-Cues</TechCardTitle>
              <CueList>
                {lightCues.map((cue, index) => (
                  <EditableCueItem key={index}>
                    <CueInput
                      type="text"
                      value={cue.time}
                      onChange={(e) => updateCue('light', index, 'time', e.target.value)}
                      placeholder="00:00"
                    />
                    <CueTextarea
                      value={cue.description}
                      onChange={(e) => updateCue('light', index, 'description', e.target.value)}
                      placeholder="Cue-Beschreibung"
                    />
                    <CueButton 
                      className="delete"
                      onClick={() => deleteCue('light', index)}
                    >
                      Löschen
                    </CueButton>
                  </EditableCueItem>
                ))}
                <CueButton onClick={() => addCue('light')}>
                  + Licht-Cue hinzufügen
                </CueButton>
              </CueList>
              {/* Statusanzeige für automatisches Speichern */}
              {saveStatus === 'saving' && (
                <div style={{ color: '#888', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Speichern...</div>
              )}
              {saveStatus === 'saved' && (
                <div style={{ color: '#28a745', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Gespeichert</div>
              )}
              {saveStatus === 'error' && (
                <div style={{ color: '#dc3545', textAlign: 'center', marginTop: 4, fontSize: '0.95rem' }}>Fehler beim Speichern</div>
              )}
            </TechCard>
            <TechCard>
              <TechCardTitle>💡 Licht-Informationen</TechCardTitle>
              <EditableCueItem>
                <CueTextarea
                  value={selectedProgrammpunkt?.lichtStimmung || ''}
                  onChange={e => updateLichtStimmung(e.target.value)}
                  placeholder="Licht-Infos eingeben..."
                />
              </EditableCueItem>
            </TechCard>
          </TechSection>
        </TechInfoGrid>
      </div>
    </Container>
  );
}

export default TechnikerView; 