import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { SitzungContext } from '../context/SitzungContext';

const ZETTEL_SYNC_INTERVAL_MS = 30000;

const ZettelContainer = styled.div`
  position: fixed;
  top: 70px;
  left: 10px;
  right: 10px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
`;

const ZettelCard = styled.div`
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
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid ${props => {
    if (props.priority === 'dringend') return '#c82333';
    if (props.priority === 'wichtig') return '#e55a2b';
    if (props.type === 'anModeration') return '#0056b3';
    if (props.type === 'anTechnik') return '#1e7e34';
    if (props.type === 'anKulissen') return '#5a32a3';
    if (props.type === 'anKueche') return '#199d7e';
    return '#e0a800';
  }};
  animation: ${props => props.isNew ? 'blink 1s infinite' : 'none'};
  position: relative;

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.7; }
  }
`;

const ZettelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: bold;
`;

const ZettelType = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ZettelText = styled.div`
  font-size: 1rem;
  line-height: 1.4;
  word-wrap: break-word;
`;

const ZettelTimestamp = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 4px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: inherit;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ZettelButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
`;

const ZettelButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '40' : 'rgba(251,191,36,0.4)')};
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '50' : 'rgba(251,191,36,0.5)')};
  }
`;

const HistorieButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 123, 255, 0.5);
  }
`;

const ZettelModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.3rem;
`;

const FormLabel = styled.label`
  display: block;
  color: #fff;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 15px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  margin-bottom: 15px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &.primary {
    background: ${props => props.theme?.colors?.primary || '#fbbf24'};
    color: white;

    &:hover {
      background: ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + 'cc' : '#fbbf24cc')};
    }
  }

  &.secondary {
    background: #666;
    color: white;

    &:hover {
      background: #555;
    }
  }

  &:disabled {
    background: #444;
    cursor: not-allowed;
  }
`;

function ZettelSystem({ viewType, onZettelToProgrammpunkt }) {
  const [zettel, setZettel] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistorie, setShowHistorie] = useState(false);
  const getDefaultRecipientType = () => {
    if (viewType === 'moderation') return 'anTechnik';
    if (viewType === 'technik') return 'anModeration';
    if (viewType === 'elferrat') return 'anModeration';
    return 'anModeration';
  };

  const [formData, setFormData] = useState({
    text: '',
    type: getDefaultRecipientType(),
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);

  const loadZettel = async () => {
    if (!aktiveSitzung) return;

    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/zettel`);
      setZettel(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Zettel:', error);
    }
  };

  const handleZettelUpdate = () => {
    loadZettel();
  };

  useEffect(() => {
    if (!aktiveSitzung) return;
    loadZettel();
  }, [aktiveSitzung]);

  useEffect(() => {
    if (!socket || !aktiveSitzung) return;

    const joinAndSync = () => {
      socket.emit('joinSitzung', aktiveSitzung);
      loadZettel();
    };

    if (socket.connected) {
      joinAndSync();
    }

    socket.on('connect', joinAndSync);

    return () => {
      socket.off('connect', joinAndSync);
      socket.emit('leaveSitzung', aktiveSitzung);
    };
  }, [aktiveSitzung, socket]);

  useEffect(() => {
    if (!socket || !aktiveSitzung) return;

    socket.on('zettelHinzugefuegt', handleZettelUpdate);
    socket.on('zettelGeschlossen', handleZettelUpdate);

    return () => {
      socket.off('zettelHinzugefuegt', handleZettelUpdate);
      socket.off('zettelGeschlossen', handleZettelUpdate);
    };
  }, [socket, aktiveSitzung]);

  useEffect(() => {
    if (!aktiveSitzung) return;

    const syncInterval = setInterval(() => {
      loadZettel();
    }, ZETTEL_SYNC_INTERVAL_MS);

    return () => clearInterval(syncInterval);
  }, [aktiveSitzung]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      alert('Bitte geben Sie einen Text ein');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`/api/sitzung/${aktiveSitzung}/zettel`, {
        text: formData.text,
        type: formData.type,
        priority: formData.priority,
        sender: viewType // 'moderation', 'technik', 'programmansicht'
      });
      
      setShowModal(false);
      setFormData({ 
        text: '', 
        type: getDefaultRecipientType(), 
        priority: 'normal' 
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Zettels:', error);
      alert('Fehler beim Erstellen des Zettels');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteZettel = async (zettelId) => {
    try {
      await axios.delete(`/api/sitzung/${aktiveSitzung}/zettel/${zettelId}`);
    } catch (error) {
      console.error('Fehler beim Schließen des Zettels:', error);
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'dringend': return '🚨';
      case 'wichtig': return '⚠️';
      default: return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filtere Zettel basierend auf der Ansicht
  const getVisibleZettel = () => {
    // Nur nicht-geschlossene Zettel anzeigen
    const aktiveZettel = zettel.filter(z => !z.geschlossen);
    
    if (viewType === 'moderation') {
      return aktiveZettel.filter(z => (z.type === 'anModeration' || z.type === 'anAlle') && z.sender !== 'moderation');
    } else if (viewType === 'elferrat') {
      return aktiveZettel.filter(z => (z.type === 'anModeration' || z.type === 'anAlle') && z.sender !== 'elferrat');
    } else if (viewType === 'technik') {
      return aktiveZettel.filter(z => (z.type === 'anTechnik' || z.type === 'anAlle') && z.sender !== 'technik');
    } else if (viewType === 'kulissen') {
      return aktiveZettel.filter(z => (z.type === 'anKulissen' || z.type === 'anAlle') && z.sender !== 'kulissen');
    } else if (viewType === 'programmansicht') {
      return aktiveZettel.filter(z => z.type === 'anAlle' && z.sender !== viewType);
    }
    return [];
  };

  const visibleZettel = getVisibleZettel();
  const allZettel = zettel; // Alle Zettel für die Historie

  if (!aktiveSitzung) {
    return null;
  }

  return (
    <>
      {visibleZettel.length > 0 && (
        <ZettelContainer>
          {visibleZettel.map((zettelItem) => (
          <ZettelCard 
            key={zettelItem.id}
            type={zettelItem.type}
            priority={zettelItem.priority}
            isNew={Date.now() - new Date(zettelItem.timestamp).getTime() < 5000}
          >
            <ZettelHeader>
              <ZettelType>
                {getZettelIcon(zettelItem.type)} {getPriorityIcon(zettelItem.priority)}
                {getZettelTypeLabel(zettelItem.type)}
              </ZettelType>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {viewType === 'moderation' && zettelItem.type === 'anModeration' && (
                  <ActionButton 
                    onClick={() => onZettelToProgrammpunkt(zettelItem)}
                    title="Als Programmpunkt hinzufügen"
                  >
                    ➕
                  </ActionButton>
                )}
                <CloseButton onClick={() => handleDeleteZettel(zettelItem.id)} title="Zettel schließen">
                  ✕
                </CloseButton>
              </div>
            </ZettelHeader>
            <ZettelText>{zettelItem.text}</ZettelText>
            <ZettelTimestamp>{formatTimestamp(zettelItem.timestamp)}</ZettelTimestamp>
                      </ZettelCard>
          ))}
        </ZettelContainer>
      )}

      <ZettelButtonContainer>
        <ZettelButton onClick={() => setShowModal(true)} title="Neuen Zettel erstellen">
          📝
        </ZettelButton>
        <HistorieButton onClick={() => setShowHistorie(true)} title="Zettel-Historie anzeigen">
          📋
        </HistorieButton>
      </ZettelButtonContainer>

      {showModal && (
        <ZettelModal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Neuer Zettel</ModalTitle>
            
            <form onSubmit={handleSubmit}>
              <FormLabel>Empfänger</FormLabel>
              <FormSelect
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {viewType === 'moderation' && (
                  <option value="anTechnik">An Technik</option>
                )}
                {viewType === 'moderation' && (
                  <option value="anKulissen">An Kulissen</option>
                )}
                {viewType === 'moderation' && (
                  <option value="anKueche">An Küche</option>
                )}
                {viewType === 'technik' && (
                  <option value="anModeration">An Moderation</option>
                )}
                {viewType === 'technik' && (
                  <option value="anKulissen">An Kulissen</option>
                )}
                {viewType === 'technik' && (
                  <option value="anKueche">An Küche</option>
                )}
                {viewType === 'elferrat' && (
                  <>
                    <option value="anModeration">An Moderation</option>
                    <option value="anTechnik">An Technik</option>
                    <option value="anKulissen">An Kulissen</option>
                    <option value="anKueche">An Küche</option>
                  </>
                )}
                {viewType === 'programmansicht' && (
                  <>
                    <option value="anModeration">An Moderation</option>
                    <option value="anTechnik">An Technik</option>
                    <option value="anKulissen">An Kulissen</option>
                    <option value="anKueche">An Küche</option>
                  </>
                )}
                {viewType === 'kulissen' && (
                  <>
                    <option value="anModeration">An Moderation</option>
                    <option value="anTechnik">An Technik</option>
                    <option value="anKueche">An Küche</option>
                  </>
                )}
                <option value="anAlle">An Alle</option>
              </FormSelect>

              <FormLabel>Priorität</FormLabel>
              <FormSelect
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="normal">Normal</option>
                <option value="wichtig">Wichtig</option>
                <option value="dringend">Dringend</option>
              </FormSelect>

              <FormLabel>Text</FormLabel>
              <FormTextarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Zettel-Text eingeben..."
                required
              />

              <ButtonGroup>
                <Button 
                  type="button" 
                  className="secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Wird gesendet...' : 'Senden'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </ZettelModal>
      )}

      {showHistorie && (
        <ZettelModal onClick={() => setShowHistorie(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📋 Zettel-Historie</ModalTitle>
            
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {allZettel.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
                  Keine Zettel vorhanden.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allZettel.map((zettelItem) => (
                    <div
                      key={zettelItem.id}
                      style={{
                        background: zettelItem.priority === 'dringend' ? '#dc3545' : 
                                   zettelItem.priority === 'wichtig' ? '#ff6b35' :
                                   zettelItem.type === 'anModeration' ? '#007bff' :
                                   zettelItem.type === 'anTechnik' ? '#28a745' :
                                   zettelItem.type === 'anKulissen' ? '#6f42c1' :
                                   zettelItem.type === 'anKueche' ? '#20c997' : '#fbbf24',
                        color: zettelItem.priority === 'dringend' || zettelItem.priority === 'wichtig' ? '#fff' : '#181818',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '2px solid',
                        borderColor: zettelItem.priority === 'dringend' ? '#c82333' :
                                    zettelItem.priority === 'wichtig' ? '#e55a2b' :
                                    zettelItem.type === 'anModeration' ? '#0056b3' :
                                    zettelItem.type === 'anTechnik' ? '#1e7e34' :
                                    zettelItem.type === 'anKulissen' ? '#5a32a3' :
                                    zettelItem.type === 'anKueche' ? '#199d7e' : '#e0a800',
                        opacity: zettelItem.geschlossen ? '0.6' : '1',
                        position: 'relative'
                      }}
                    >
                      {zettelItem.geschlossen && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#666',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          GESCHLOSSEN
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <span>
                          {getZettelIcon(zettelItem.type)} {getPriorityIcon(zettelItem.priority)}
                          {getZettelTypeLabel(zettelItem.type)}
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', lineHeight: '1.4', wordWrap: 'break-word', marginBottom: '8px' }}>
                        {zettelItem.text}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: '0.8' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {new Date(zettelItem.timestamp).toLocaleString('de-DE', { 
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span style={{ fontStyle: 'italic' }}>
                          Von: {zettelItem.sender === 'moderation' ? 'Moderation' : 
                                zettelItem.sender === 'technik' ? 'Technik' : 
                                zettelItem.sender === 'programmansicht' ? 'Programmansicht' :
                                zettelItem.sender === 'kulissen' ? 'Kulissen' :
                                zettelItem.sender === 'elferrat' ? 'Elferrat' : zettelItem.sender}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ButtonGroup>
              <Button 
                type="button" 
                className="secondary" 
                onClick={() => setShowHistorie(false)}
              >
                Schließen
              </Button>
            </ButtonGroup>
          </ModalContent>
        </ZettelModal>
      )}
    </>
  );
}

export default ZettelSystem; 