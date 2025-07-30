import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import ZettelSystem from './ZettelSystem';

const Container = styled.div`
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
  min-height: calc(100vh - 60px);
  background: #000;
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
  background: ${props => {
    if (props.isActive) return '#2c3e50';
    return '#34495e';
  }};
  border: 2px solid ${props => {
    if (props.isActive) return '#3498db';
    return '#4a90e2';
  }};
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  color: ${props => props.isActive ? '#ecf0f1' : '#bdc3c7'};
  width: 100%;
  min-width: 200px;
`;

const KulissenTitle = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
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

function KulissenView() {
  const [sitzung, setSitzung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { activeProgrammpunkt } = useTimer();

  useEffect(() => {
    if (aktiveSitzung) {
      loadSitzung();
    }
  }, [aktiveSitzung]);

  useEffect(() => {
    if (socket) {
      socket.on('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
      socket.on('programmpunktAktualisiert', handleProgrammpunktUpdate);
      socket.on('programmpunktGeloescht', handleProgrammpunktUpdate);
      socket.on('programmpunkteReordered', handleProgrammpunktUpdate);

      return () => {
        socket.off('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
        socket.off('programmpunktAktualisiert', handleProgrammpunktUpdate);
        socket.off('programmpunktGeloescht', handleProgrammpunktUpdate);
        socket.off('programmpunkteReordered', handleProgrammpunktUpdate);
      };
    }
  }, [socket]);

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

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
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

  return (
    <Container>
      <ProgramList>
        {visibleProgrammpunkte.map((programmpunkt) => (
          <ProgramItem
            key={programmpunkt.id} 
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
              
              <ProgramRight>
                <KulissenTitle>🎭 Kulissen-Informationen</KulissenTitle>
                <KulissenDetails>
                  <KulissenItem>
                    <KulissenIcon>🎵</KulissenIcon>
                    <KulissenText isActive={activeProgrammpunkt?.id === programmpunkt.id}>
                      Einzug: {programmpunkt.einzugCD ? 'Von CD' : 'Von Kapelle'}
                    </KulissenText>
                  </KulissenItem>
                  <KulissenItem>
                    <KulissenIcon>🎵</KulissenIcon>
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

      <ZettelSystem viewType="kulissen" />
    </Container>
  );
}

export default KulissenView; 