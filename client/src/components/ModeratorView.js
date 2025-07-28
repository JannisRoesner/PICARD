import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import ZettelSystem from './ZettelSystem';

const Container = styled.div`
  display: grid;
  grid-template-columns: 450px 1fr 445px;
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
  background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#2d2d2d'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#181818' : '#fff'};

  &:hover {
    background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') + 'cc' : '#3d3d3d'};
  }
`;

const ProgramName = styled.span`
  color: inherit;
  font-weight: bold;
`;
const ProgramType = styled.span`
  color: ${props => props.active ? '#181818' : '#ccc'};
  margin-left: 8px;
`;
const ProgramDuration = styled.span`
  color: ${props => props.active ? '#181818' : '#888'};
  margin-left: 8px;
`;

const TextArea = styled.textarea`
  flex: 1;
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 6px;
  color: #fff;
  padding: 12px;
  font-size: 1.1rem;
  font-family: 'Calibri', sans-serif;
  resize: none;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
    box-shadow: 0 0 0 2px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '40' : 'rgba(251,191,36,0.25)')};
  }

  &:hover {
    border-color: #666;
  }
`;

const SaveButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #218838;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimerSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const TimerTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 12px;
  font-size: 1.1rem;
`;

const TimerControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
`;

const TimerButton = styled.button`
  background: ${props => props.variant === 'start' ? '#28a745' : props.variant === 'stop' ? '#dc3545' : '#ffc107'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'start' ? '#218838' : props.variant === 'stop' ? '#c82333' : '#e0a800'};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimerDisplay = styled.div`
  color: #fff;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  margin: 0 10px;
`;

const DurationInput = styled.input`
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 10px;
  font-size: 0.9rem;
  width: 80px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const NamensListe = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const NamensItem = styled.div`
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #2d2d2d;
  border-radius: 4px;
  font-size: 1rem;
`;

const TrainerBetreuerSection = styled.div`
  margin-top: 20px;
`;

const TrainerBetreuerItem = styled.div`
  margin-bottom: 16px;
`;

const TrainerBetreuerLabel = styled.div`
  color: #fff;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.1rem;
`;

const TrainerBetreuerValue = styled.div`
  color: #32cd32;
  font-size: 1.1rem;
  padding: 8px 12px;
  background: #2d2d2d;
  border-radius: 4px;
`;

const NoSitzungMessage = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: #ccc;
`;

// Timer-Komponenten für die Statusleiste
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

function ModeratorView() {
  const [sitzung, setSitzung] = useState(null);
  const [selectedProgrammpunkt, setSelectedProgrammpunkt] = useState(null);
  const [editingTexts, setEditingTexts] = useState({
    anmoderation: '',
    notizen: '',
    abmoderation: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const saveTimeout = useRef(null);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { 
    setActiveProgrammpunkt, 
    timerState, 
    activeProgrammpunkt,
    formatTime, 
    getProgressPercentage, 
    getTimerColor 
  } = useTimer();

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

  const loadSitzung = async () => {
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      setSitzung(response.data);
      if (response.data.programmpunkte.length > 0) {
        setSelectedProgrammpunkt(response.data.programmpunkte[0]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sitzung:', error);
    }
  };

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
    }
  };

  const handleProgrammpunktSelect = (programmpunkt) => {
    setSelectedProgrammpunkt(programmpunkt);
    setEditingTexts({
      anmoderation: programmpunkt.anmoderation || '',
      notizen: programmpunkt.notizen || '',
      abmoderation: programmpunkt.abmoderation || ''
    });
    
    // Setze den aktiven Programmpunkt (startet automatisch den Timer)
    setActiveProgrammpunkt(programmpunkt);
  };

  const handleTextChange = (field, value) => {
    setEditingTexts(prev => ({
      ...prev,
      [field]: value
    }));
    // Automatisches Speichern nach kurzer Verzögerung
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('saving');
    saveTimeout.current = setTimeout(() => {
      autoSaveTexts();
    }, 1000); // 1 Sekunde nach letzter Eingabe
  };

  const autoSaveTexts = async () => {
    if (!selectedProgrammpunkt) return;
    setIsSaving(true);
    try {
      await axios.put(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selectedProgrammpunkt.id}`, {
        anmoderation: editingTexts.anmoderation,
        notizen: editingTexts.notizen,
        abmoderation: editingTexts.abmoderation
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 1200);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleZettelToProgrammpunkt = async (zettel) => {
    try {
      const programmpunktData = {
        name: zettel.text,
        typ: 'MODERATION',
        einzugCD: false,
        auszugCD: false,
        trainer: '',
        betreuer: '',
        anmoderation: '',
        abmoderation: '',
        notizen: `Erstellt aus Zettel: ${zettel.text}`,
        dauer: 300, // 5 Minuten Standard
        lichtStimmung: 'Standard',
        audioDateien: [],
        namensliste: []
      };

      await axios.post(`/api/sitzung/${aktiveSitzung}/programmpunkt`, programmpunktData);
      
      // Zettel löschen nach erfolgreicher Erstellung
      await axios.delete(`/api/sitzung/${aktiveSitzung}/zettel/${zettel.id}`);
      
      alert('Programmpunkt erfolgreich aus Zettel erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen des Programmpunkts aus Zettel:', error);
      alert('Fehler beim Erstellen des Programmpunkts');
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
      <ZettelSystem viewType="moderator" onZettelToProgrammpunkt={handleZettelToProgrammpunkt} />
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
              onClick={() => handleProgrammpunktSelect(programmpunkt)}
            >
              {programmpunkt.nummer} {programmpunkt.typ} {programmpunkt.name}
            </ProgramItem>
          ))}
        </ProgramList>
      </Panel>

      {/* Mitte - Anmoderation, Notizen, Abmoderation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Panel style={{ flex: '1' }}>
          <PanelTitle>Anmoderation</PanelTitle>
          <TextArea
            value={editingTexts.anmoderation}
            onChange={(e) => handleTextChange('anmoderation', e.target.value)}
            placeholder="Anmoderation eingeben..."
          />
        </Panel>

        <Panel style={{ flex: '1' }}>
          <PanelTitle>Notizen</PanelTitle>
          <TextArea
            value={editingTexts.notizen}
            onChange={(e) => handleTextChange('notizen', e.target.value)}
            placeholder="Notizen eingeben..."
          />
        </Panel>

        <Panel style={{ flex: '1' }}>
          <PanelTitle>Abmoderation</PanelTitle>
          <TextArea
            value={editingTexts.abmoderation}
            onChange={(e) => handleTextChange('abmoderation', e.target.value)}
            placeholder="Abmoderation eingeben..."
          />
        </Panel>

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
      </div>

      {/* Rechts - Namensliste, Trainer, Betreuer */}
      <Panel>
        <PanelTitle>Namensliste</PanelTitle>
        <NamensListe>
          {selectedProgrammpunkt?.namensliste?.map((name, index) => (
            <NamensItem key={index}>{name}</NamensItem>
          ))}
          {(!selectedProgrammpunkt?.namensliste || selectedProgrammpunkt.namensliste.length === 0) && (
            <NamensItem>Keine Namen verfügbar</NamensItem>
          )}
        </NamensListe>

        <TrainerBetreuerSection>
          <TrainerBetreuerItem>
            <TrainerBetreuerLabel>Trainer</TrainerBetreuerLabel>
            <TrainerBetreuerValue>
              {selectedProgrammpunkt?.trainer || 'Nicht angegeben'}
            </TrainerBetreuerValue>
          </TrainerBetreuerItem>

          <TrainerBetreuerItem>
            <TrainerBetreuerLabel>Betreuer</TrainerBetreuerLabel>
            <TrainerBetreuerValue>
              {selectedProgrammpunkt?.betreuer || 'Nicht angegeben'}
            </TrainerBetreuerValue>
          </TrainerBetreuerItem>
        </TrainerBetreuerSection>
      </Panel>
    </Container>
  );
}

export default ModeratorView; 