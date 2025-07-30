import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';

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
`;

const NoSitzungMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #ccc;
  padding: 40px 20px;
`;

function Programmansicht() {
  const [sitzung, setSitzung] = useState(null);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);
  const { activeProgrammpunkt } = useTimer();

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
      socket.on('programmpunkteReordered', handleProgrammpunktUpdate);

    return () => {
              socket.off('programmpunktHinzugefuegt', handleProgrammpunktUpdate);
        socket.off('programmpunktAktualisiert', handleProgrammpunktUpdate);
        socket.off('programmpunktGeloescht', handleProgrammpunktUpdate);
        socket.off('programmpunkteReordered', handleProgrammpunktUpdate);
    };
  }, [socket, aktiveSitzung]);

  const loadSitzung = async () => {
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      setSitzung(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Sitzung:', error);
    }
  };

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };

  // Filtere Programmpunkte: zeige nur aktuelle und zukünftige
  const getVisibleProgrammpunkte = () => {
    if (!sitzung) return [];
    
    const activeIndex = sitzung.programmpunkte.findIndex(p => p.id === activeProgrammpunkt?.id);
    if (activeIndex === -1) return sitzung.programmpunkte; // Zeige alle wenn kein aktiver Punkt
    
    return sitzung.programmpunkte.slice(activeIndex);
  };

  if (!aktiveSitzung) {
    return (
      <NoSitzungMessage>
        Keine aktive Sitzung ausgewählt.
        <br />
        Bitte wählen Sie zuerst eine Sitzung aus.
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
      <Header>
        <Title>{`Programm${sitzung?.name ? ' ' + sitzung.name : ''} ${new Date().getFullYear()}`}</Title>
      </Header>

      <ProgramList>
        {getVisibleProgrammpunkte().map((programmpunkt, index) => (
          <ProgramItem 
            key={programmpunkt.id} 
            active={false}
            isActive={activeProgrammpunkt?.id === programmpunkt.id}
          >
            <ProgramNumber>{programmpunkt.nummer}</ProgramNumber>
            <ProgramContent>
              <ProgramName isActive={activeProgrammpunkt?.id === programmpunkt.id}>{programmpunkt.name}</ProgramName>
              <ProgramType isActive={activeProgrammpunkt?.id === programmpunkt.id}>{programmpunkt.typ}</ProgramType>
              <ProgramDuration isActive={activeProgrammpunkt?.id === programmpunkt.id}>{formatDuration(programmpunkt.dauer)}</ProgramDuration>
            </ProgramContent>
          </ProgramItem>
        ))}
      </ProgramList>
    </Container>
  );
}

export default Programmansicht; 