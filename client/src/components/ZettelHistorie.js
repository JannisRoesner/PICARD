import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #000;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 10px;
  font-size: 2rem;
`;

const Subtitle = styled.p`
  color: #ccc;
  font-size: 1rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#2d2d2d'};
  color: ${props => props.active ? '#181818' : '#fff'};
  border: 2px solid ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#555'};
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#3d3d3d'};
  }
`;

const ZettelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ZettelCard = styled.div`
  background: ${props => {
    if (props.priority === 'dringend') return '#dc3545';
    if (props.priority === 'wichtig') return '#ff6b35';
    if (props.type === 'anModeration') return '#007bff';
    if (props.type === 'anTechnik') return '#28a745';
    return '#fbbf24';
  }};
  color: ${props => props.priority === 'dringend' || props.priority === 'wichtig' ? '#fff' : '#181818'};
  border-radius: 12px;
  padding: 20px;
  border: 2px solid ${props => {
    if (props.priority === 'dringend') return '#c82333';
    if (props.priority === 'wichtig') return '#e55a2b';
    if (props.type === 'anModeration') return '#0056b3';
    if (props.type === 'anTechnik') return '#1e7e34';
    return '#e0a800';
  }};
  position: relative;
`;

const ZettelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 1rem;
  font-weight: bold;
`;

const ZettelType = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ZettelText = styled.div`
  font-size: 1.1rem;
  line-height: 1.5;
  word-wrap: break-word;
  margin-bottom: 12px;
`;

const ZettelMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ZettelTimestamp = styled.div`
  font-weight: bold;
`;

const ZettelSender = styled.div`
  font-style: italic;
`;

const NoZettelMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #ccc;
  padding: 60px 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #ccc;
  padding: 60px 20px;
`;

function ZettelHistorie() {
  const [zettel, setZettel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('alle');
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (aktiveSitzung) {
      loadZettel();
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

    socket.on('zettelHinzugefuegt', handleZettelUpdate);
    socket.on('zettelGeloescht', handleZettelUpdate);

    return () => {
      socket.off('zettelHinzugefuegt', handleZettelUpdate);
      socket.off('zettelGeloescht', handleZettelUpdate);
    };
  }, [socket, aktiveSitzung]);

  const loadZettel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/zettel`);
      setZettel(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Zettel:', error);
      setZettel([]);
    } finally {
      setLoading(false);
    }
  };

  const handleZettelUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadZettel();
    }
  };

  const getZettelIcon = (type) => {
    switch (type) {
      case 'anModeration': return '📝';
      case 'anTechnik': return '🎛️';
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderName = (sender) => {
    switch (sender) {
      case 'moderation': return 'Moderation';
      case 'technik': return 'Technik';
      case 'programmansicht': return 'Programmansicht';
      default: return sender;
    }
  };

  const getFilteredZettel = () => {
    if (filter === 'alle') return zettel;
    return zettel.filter(z => z.type === filter);
  };

  const filteredZettel = getFilteredZettel();

  if (!aktiveSitzung) {
    return (
      <NoZettelMessage>
        Keine aktive Sitzung ausgewählt.
        <br />
        Bitte wählen Sie zuerst eine Sitzung aus.
      </NoZettelMessage>
    );
  }

  if (loading) {
    return (
      <LoadingMessage>
        Lade Zettel-Historie...
      </LoadingMessage>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📋 Zettel-Historie</Title>
        <Subtitle>Alle Zettel der aktuellen Sitzung</Subtitle>
      </Header>

      <FilterContainer>
        <FilterButton 
          active={filter === 'alle'} 
          onClick={() => setFilter('alle')}
        >
          Alle ({zettel.length})
        </FilterButton>
        <FilterButton 
          active={filter === 'anModeration'} 
          onClick={() => setFilter('anModeration')}
        >
          An Moderation ({zettel.filter(z => z.type === 'anModeration').length})
        </FilterButton>
        <FilterButton 
          active={filter === 'anTechnik'} 
          onClick={() => setFilter('anTechnik')}
        >
          An Technik ({zettel.filter(z => z.type === 'anTechnik').length})
        </FilterButton>
        <FilterButton 
          active={filter === 'anAlle'} 
          onClick={() => setFilter('anAlle')}
        >
          An Alle ({zettel.filter(z => z.type === 'anAlle').length})
        </FilterButton>
      </FilterContainer>

      {filteredZettel.length === 0 ? (
        <NoZettelMessage>
          {filter === 'alle' ? 'Keine Zettel vorhanden.' : `Keine Zettel vom Typ "${filter}" vorhanden.`}
        </NoZettelMessage>
      ) : (
        <ZettelList>
          {filteredZettel.map((zettelItem) => (
            <ZettelCard 
              key={zettelItem.id}
              type={zettelItem.type}
              priority={zettelItem.priority}
            >
              <ZettelHeader>
                <ZettelType>
                  {getZettelIcon(zettelItem.type)} {getPriorityIcon(zettelItem.priority)}
                  {zettelItem.type === 'anModeration' ? 'An Moderation' : 
                   zettelItem.type === 'anTechnik' ? 'An Technik' : 'An Alle'}
                </ZettelType>
              </ZettelHeader>
              <ZettelText>{zettelItem.text}</ZettelText>
              <ZettelMeta>
                <ZettelTimestamp>{formatTimestamp(zettelItem.timestamp)}</ZettelTimestamp>
                <ZettelSender>Von: {getSenderName(zettelItem.sender)}</ZettelSender>
              </ZettelMeta>
            </ZettelCard>
          ))}
        </ZettelList>
      )}
    </Container>
  );
}

export default ZettelHistorie; 