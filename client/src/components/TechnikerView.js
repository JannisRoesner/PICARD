import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import ZettelSystem from './ZettelSystem';
import Pinboard from './Pinboard';

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

// Entfernt: Unbenutzte TechInfo-Styles

// Entfernt: Unbenutzte Audio-/Licht-Styles



const NoSitzungMessage = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: #ccc;
`;

// Timer-Komponenten für die Statusleiste (identisch mit ModerationView)
const ModerationTimerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '20' : 'rgba(251,191,36,0.1)')};
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '50' : 'rgba(251,191,36,0.3)')};
`;

const ModerationTimerDisplay = styled.div`
  color: ${props => props.warning ? '#ffc107' : props => props.danger ? '#dc3545' : '#ff6b35'};
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
`;

const ModerationTimerDuration = styled.div`
  color: #888;
  font-size: 0.8rem;
`;

const ModerationProgressBar = styled.div`
  width: 60px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
`;

const ModerationProgressFill = styled.div`
  height: 100%;
  background: ${props => props.warning ? '#ffc107' : props => props.danger ? '#dc3545' : '#28a745'};
  width: ${props => props.progress}%;
  transition: width 1s ease, background 0.3s ease;
`;

// Entfernt: Unbenutzte Cue-Styles

function TechnikView() {
  const [sitzung, setSitzung] = useState(null);
  const [selectedProgrammpunkt, setSelectedProgrammpunkt] = useState(null);
  // Entfernt: Audio-/Licht-Cues-Zustände, da UI nicht mehr vorhanden ist
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { 
    activeProgrammpunkt, 
    timerState, 
    formatTime,
    getProgressPercentage, 
    getTimerColor 
  } = useTimer();
  // Entfernt: Save-Status/Timeout für Audio-/Licht-Autosaves
  // Stabilisierte Sitzungs-ID für Autosaves, um transienten Null-Zustand zu vermeiden
  const [stableSitzungId, setStableSitzungId] = useState(null);

  useEffect(() => {
    if (aktiveSitzung) {
      setStableSitzungId(aktiveSitzung);
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
      // Entfernt: programmpunkteReordered (Server sendet dieses Event nicht)

    return () => {
              socket.off('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
        socket.off('programmpunktAktualisiert', handleProgrammpunktUpdate);
        socket.off('programmpunktGeloescht', handleProgrammpunktUpdate);
        // Entfernt: programmpunkteReordered (Server sendet dieses Event nicht)
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
      
      // Update selectedProgrammpunkt with fresh data if it exists
      if (selectedProgrammpunkt) {
        const updatedProgrammpunkt = response.data.programmpunkte.find(
          p => p.id === selectedProgrammpunkt.id
        );
        if (updatedProgrammpunkt) {
          setSelectedProgrammpunkt(updatedProgrammpunkt);
        }
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

  // Lade Cues aus dem Programmpunkt (falls vorhanden), sonst Standardwerte
  const handleProgrammpunktSelect = (programmpunkt) => {
    setSelectedProgrammpunkt(programmpunkt);
  };

  // Entfernt: automatisches Laden/Setzen von Audio-/Licht-Cues

  // Entfernt: Debounced Autosave für Audio-/Licht-Cues

  // Entfernt: autoSaveCues

  // Entfernt: Cue-Management-Funktionen

  // Entfernt: nicht verwendete Timer-Handler

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  };

  // Entfernt: Audio-Datei-Management und Autosave

  // Entfernt: Lichtstimmung-Management und Autosave

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
      <ZettelSystem viewType="technik" />
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
            <ModerationTimerContainer>
              <ModerationTimerDisplay 
                warning={getTimerColor() === 'warning'}
                danger={getTimerColor() === 'danger'}
              >
                {formatTime(timerState.remainingTime)}
              </ModerationTimerDisplay>
              
              <ModerationTimerDuration>
                / {formatTime(activeProgrammpunkt.dauer || 0)}
              </ModerationTimerDuration>
              
              <ModerationProgressBar>
                <ModerationProgressFill 
                  progress={getProgressPercentage()}
                  warning={getTimerColor() === 'warning'}
                  danger={getTimerColor() === 'danger'}
                />
              </ModerationProgressBar>
            </ModerationTimerContainer>
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
      <Panel>
        <PanelTitle>🗒️ Notizen</PanelTitle>
        {selectedProgrammpunkt ? (
          <div style={{ flex: 1, minHeight: 0 }}>
            <Pinboard
              sitzungId={stableSitzungId || aktiveSitzung}
              programmpunkt={selectedProgrammpunkt}
              onSaved={(payload) => {
                // Update local selectedProgrammpunkt with latest notes
                setSelectedProgrammpunkt(prev => prev ? { ...prev, pinboardNotes: payload } : prev);
              }}
            />
          </div>
        ) : (
          <div style={{ color: '#888' }}>Kein Programmpunkt ausgewählt</div>
        )}
      </Panel>
    </Container>
  );
}

export default TechnikView; 