import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import ZettelSystem from './ZettelSystem';
import {
  getZettelIcon,
  getZettelTypeLabel,
  getPriorityIcon,
  getSenderLabel,
  formatDateTime
} from './zettelUtils';

const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  grid-template-rows: minmax(0, 1fr);
  height: calc(100vh - 60px);
  gap: 10px;
  padding: 10px;
  background: #000;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  @media (max-width: 900px) {
    height: auto;
    min-height: calc(100vh - 60px);
  }
`;

const MainArea = styled.div`
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;

  @media (max-width: 900px) {
    max-height: 52vh;
  }
`;

const HistoriePanel = styled.div`
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

const HistorieHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const HistorieTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin: 0;
  font-size: 1.2rem;
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

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
`;

const Title = styled.h1`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 5px;
  font-size: 1.5rem;
`;

const Subtitle = styled.p`
  color: #ccc;
  font-size: 0.9rem;
`;

const ProgramList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProgramItem = styled.div`
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
  border-radius: 8px;
  padding: 15px;
  position: relative;
  transition: all 0.2s ease;
  animation: ${props => props.isActive ? 'blink 1s infinite' : 'none'};
  color: ${props => props.isActive ? '#181818' : '#fff'};

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.7; }
  }
`;

const ProgramNumber = styled.div`
  position: absolute;
  top: -8px;
  left: 15px;
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
`;

const ProgramContent = styled.div`
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
`;

const ProgramLeft = styled.div`
  flex: 1;
  margin-right: 15px;
`;

const ProgramCenter = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 15px;
`;

const ProgramRight = styled.div`
  width: 200px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  flex-shrink: 0;
  color: ${props => props.isActive ? '#181818' : '#ddd'};
`;

const ProgramName = styled.div`
  color: ${props => props.isActive ? '#181818' : '#fff'};
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 5px;
`;

const ProgramType = styled.div`
  color: ${props => props.isActive ? '#181818' : '#ccc'};
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const ProgramDuration = styled.div`
  color: ${props => props.isActive ? '#181818' : '#888'};
  font-size: 0.8rem;
  margin-bottom: 8px;
`;

const BuehneBox = styled.div`
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  border: 3px solid ${props => props.theme?.colors?.primary || '#fbbf24'};
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  color: #181818;
  width: 100%;
  min-width: 200px;
`;

const KulissenTitle = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
  color: ${props => props.isActive ? '#181818' : (props.theme?.colors?.primary || '#fbbf24')};
  margin-bottom: 5px;
`;

const KulissenDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
`;

const KulissenItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KulissenIcon = styled.span`
  font-size: 1rem;
  color: ${props => props.color || 'inherit'};
`;

const KulissenText = styled.span`
  color: ${props => props.isActive ? '#181818' : '#ccc'};
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #ccc;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #ff6b6b;
  padding: 20px;
`;

const isElementFullyVisible = (container, element) => {
  const c = container.getBoundingClientRect();
  const e = element.getBoundingClientRect();
  return e.top >= c.top && e.bottom <= c.bottom;
};

function KulissenView() {
  const [sitzung, setSitzung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zettelHistorie, setZettelHistorie] = useState([]);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth <= 1200);
  const [isHistorieOpen, setIsHistorieOpen] = useState(() => window.innerWidth > 1200);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { activeProgrammpunkt } = useTimer();
  const mainAreaRef = useRef(null);
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (aktiveSitzung) {
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
    if (socket) {
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
    }
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
    if (loading || !activeProgrammpunkt?.id) return;

    const container = mainAreaRef.current;
    const item = activeItemRef.current;
    if (!container || !item) return;

    const frame = requestAnimationFrame(() => {
      if (!isElementFullyVisible(container, item)) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeProgrammpunkt?.id, loading]);

  const loadSitzung = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      setSitzung(response.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Sitzung');
      console.error('Fehler beim Laden der Sitzung:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadZettelHistorie = async () => {
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/zettel`);
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setZettelHistorie(sorted);
    } catch (err) {
      console.error('Fehler beim Laden der Zettel-Historie:', err);
      setZettelHistorie([]);
    }
  };

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
    }
  };

  const handleZettelUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadZettelHistorie();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'Keine Angabe';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min`;
  };

  const getVisibleProgrammpunkte = () => {
    if (!sitzung || !sitzung.programmpunkte) return [];
    return sitzung.programmpunkte.filter(punkt => punkt.name && punkt.name.trim() !== '');
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Lade Kulissen-Ansicht...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  if (!sitzung) {
    return (
      <Container>
        <ErrorMessage>Keine Sitzung ausgewählt</ErrorMessage>
      </Container>
    );
  }

  const visibleProgrammpunkte = getVisibleProgrammpunkte();
  const showHistoriePanel = !isCompactLayout || isHistorieOpen;

  return (
    <Container>
      <MainArea ref={mainAreaRef}>
      <ProgramList>
        {visibleProgrammpunkte.map((programmpunkt) => (
          <ProgramItem
            key={programmpunkt.id} 
            ref={activeProgrammpunkt?.id === programmpunkt.id ? activeItemRef : null}
            active={false}
            isActive={activeProgrammpunkt?.id === programmpunkt.id}
          >
            <ProgramNumber>{programmpunkt.nummer}</ProgramNumber>
            <ProgramContent>
              <ProgramLeft>
                <ProgramName isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                  {programmpunkt.name}
                </ProgramName>
                <ProgramType isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                  {programmpunkt.typ}
                </ProgramType>
                <ProgramDuration isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                  Dauer: {formatDuration(programmpunkt.dauer)}
                </ProgramDuration>
              </ProgramLeft>
              
              <ProgramCenter>
                <BuehneBox isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                  🎪 {programmpunkt.buehne || 'Bühne: frei'}
                </BuehneBox>
              </ProgramCenter>
              
              <ProgramRight isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                <KulissenTitle isActive={activeProgrammpunkt?.id === programmpunkt.id}>♪ Musik-Informationen</KulissenTitle>
                <KulissenDetails>
                  <KulissenItem>
                    <KulissenIcon color="#4ade80">→</KulissenIcon>
                    <KulissenText isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                      Einzug: {programmpunkt.einzugCD ? 'Von CD' : 'Von Kapelle'}
                    </KulissenText>
                  </KulissenItem>
                  <KulissenItem>
                    <KulissenIcon color="#f87171">←</KulissenIcon>
                    <KulissenText isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                      Auszug: {programmpunkt.auszugCD ? 'Von CD' : 'Von Kapelle'}
                    </KulissenText>
                  </KulissenItem>
                </KulissenDetails>
              </ProgramRight>
            </ProgramContent>
          </ProgramItem>
        ))}
      </ProgramList>
      </MainArea>

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
                    <span>{formatDateTime(zettelItem.timestamp)}</span>
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

      <ZettelSystem viewType="kulissen" hideHistorieButton />
    </Container>
  );
}

export default KulissenView; 