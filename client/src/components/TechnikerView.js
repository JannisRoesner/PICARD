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
  grid-template-columns: minmax(280px, 340px) minmax(360px, 1fr) minmax(280px, 360px);
  grid-template-rows: 60px minmax(0, 1fr);
  height: calc(100vh - 60px);
  gap: 10px;
  padding: 10px;
  background: #000;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(260px, 340px) minmax(300px, 1fr);
    grid-template-rows: 60px minmax(0, 1fr) auto;
    height: calc(100vh - 60px);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    height: auto;
    min-height: calc(100vh - 60px);
  }
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

  @media (max-width: 900px) {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 8px;
    gap: 6px;
  }
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }
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
  min-height: 0;

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const ProgramPanel = styled(Panel)`
  @media (max-width: 1200px) {
    grid-column: 1;
  }

  @media (max-width: 900px) {
    grid-column: 1;
    max-height: 38vh;
  }
`;

const PinboardPanel = styled(Panel)`
  @media (max-width: 1200px) {
    grid-column: 2;
  }

  @media (max-width: 900px) {
    grid-column: 1;
    min-height: 52vh;
  }
`;

const HistoriePanel = styled(Panel)`
  @media (max-width: 1200px) {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: 4;
  }
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
  min-height: 0;
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
  line-height: 1.35;

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 10px;
  }

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

const HistorieHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const HistorieTitle = styled(PanelTitle)`
  margin: 0;
  border-bottom: none;
  padding-bottom: 0;
`;

const HistorieToggle = styled.button`
  background: #2d2d2d;
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;

  &:hover {
    background: #3a3a3a;
  }
`;

const HistorieList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
`;

const HistorieItem = styled.div`
  background: ${props => {
    if (props.priority === 'dringend') return '#dc3545';
    if (props.priority === 'wichtig') return '#ff6b35';
    if (props.type === 'anModeration') return '#007bff';
    if (props.type === 'anTechnik') return '#28a745';
    if (props.type === 'anKulissen') return '#6f42c1';
    if (props.type === 'anKueche') return '#20c997';
    return '#fbbf24';
  }};
  color: ${props => props.priority === 'dringend' || props.priority === 'wichtig' ? '#fff' : '#181818'};
  border-radius: 8px;
  padding: 10px;
  border: 2px solid ${props => {
    if (props.priority === 'dringend') return '#c82333';
    if (props.priority === 'wichtig') return '#e55a2b';
    if (props.type === 'anModeration') return '#0056b3';
    if (props.type === 'anTechnik') return '#1e7e34';
    if (props.type === 'anKulissen') return '#5a32a3';
    if (props.type === 'anKueche') return '#199d7e';
    return '#e0a800';
  }};
  opacity: ${props => props.closed ? 0.6 : 1};
`;

const HistorieMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  opacity: 0.85;
  margin-top: 6px;
`;

const EmptyHistorie = styled.div`
  color: #888;
  text-align: center;
  padding: 20px 10px;
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
  const [zettelHistorie, setZettelHistorie] = useState([]);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth <= 1200);
  const [isHistorieOpen, setIsHistorieOpen] = useState(() => window.innerWidth > 1200);
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
      loadZettelHistorie();
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
    socket.on('zettelHinzugefuegt', handleZettelUpdate);
    socket.on('zettelGeschlossen', handleZettelUpdate);
      // Entfernt: programmpunkteReordered (Server sendet dieses Event nicht)

    return () => {
              socket.off('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
        socket.off('programmpunktAktualisiert', handleProgrammpunktUpdate);
        socket.off('programmpunktGeloescht', handleProgrammpunktUpdate);
      socket.off('zettelHinzugefuegt', handleZettelUpdate);
      socket.off('zettelGeschlossen', handleZettelUpdate);
        // Entfernt: programmpunkteReordered (Server sendet dieses Event nicht)
    };
  }, [socket, aktiveSitzung]);

  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth <= 1200;
      setIsCompactLayout(compact);
      if (!compact) {
        setIsHistorieOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const loadZettelHistorie = async () => {
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/zettel`);
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setZettelHistorie(sorted);
    } catch (error) {
      console.error('Fehler beim Laden der Zettel-Historie:', error);
      setZettelHistorie([]);
    }
  };

  const handleZettelUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadZettelHistorie();
    }
  };

  const getZettelIcon = (type) => {
    switch (type) {
      case 'anModeration': return '📝';
      case 'anTechnik': return '🎛️';
      case 'anKulissen': return '🎭';
      case 'anKueche': return '🍽️';
      case 'anAlle': return '📢';
      default: return '📄';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'dringend': return '🚨';
      case 'wichtig': return '⚠️';
      default: return '';
    }
  };

  const getZettelTypeLabel = (type) => {
    switch (type) {
      case 'anModeration': return 'An Moderation';
      case 'anTechnik': return 'An Technik';
      case 'anKulissen': return 'An Kulissen';
      case 'anKueche': return 'An Küche';
      case 'anAlle':
      default:
        return 'An Alle';
    }
  };

  const getSenderLabel = (sender) => {
    switch (sender) {
      case 'moderation': return 'Moderation';
      case 'technik': return 'Technik';
      case 'kulissen': return 'Kulissen';
      case 'programmansicht': return 'Programmansicht';
      case 'elferrat': return 'Elferrat';
      default: return sender;
    }
  };

  const formatHistorieTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const showHistoriePanel = !isCompactLayout || isHistorieOpen;

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
      <ProgramPanel>
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
      </ProgramPanel>

      {/* Technische Informationen (Rechts) */}
      <PinboardPanel>
        <PanelTitle>🗂️ Pinnwand</PanelTitle>
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
      </PinboardPanel>

      <HistoriePanel>
        <HistorieHeader>
          <HistorieTitle>📋 Zettel-Historie</HistorieTitle>
          {isCompactLayout && (
            <HistorieToggle onClick={() => setIsHistorieOpen(prev => !prev)}>
              {isHistorieOpen ? 'Einklappen' : 'Aufklappen'}
            </HistorieToggle>
          )}
        </HistorieHeader>

        {showHistoriePanel ? (
          <HistorieList>
            {zettelHistorie.length === 0 ? (
              <EmptyHistorie>Keine Zettel vorhanden.</EmptyHistorie>
            ) : (
              zettelHistorie.map((zettelItem) => (
                <HistorieItem
                  key={zettelItem.id}
                  type={zettelItem.type}
                  priority={zettelItem.priority}
                  closed={zettelItem.geschlossen}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                    {getZettelIcon(zettelItem.type)} {getPriorityIcon(zettelItem.priority)} {getZettelTypeLabel(zettelItem.type)}
                  </div>
                  <div style={{ lineHeight: '1.35' }}>{zettelItem.text}</div>
                  <HistorieMeta>
                    <span>{formatHistorieTimestamp(zettelItem.timestamp)}</span>
                    <span>Von: {getSenderLabel(zettelItem.sender)}</span>
                  </HistorieMeta>
                </HistorieItem>
              ))
            )}
          </HistorieList>
        ) : (
          <EmptyHistorie>Historie ist eingeklappt.</EmptyHistorie>
        )}
      </HistoriePanel>
    </Container>
  );
}

export default TechnikView; 