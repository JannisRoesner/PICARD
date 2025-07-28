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
  padding-bottom: 50px; // Platz für Button unten
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

const AddButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '30' : 'rgba(251,191,36,0.3)')};
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '40' : 'rgba(251,191,36,0.4)')};
  }
`;

const ZettelButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
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
  z-index: 1000;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '50' : 'rgba(251,191,36,0.5)')};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
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
  max-width: 400px;
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

const FormInput = styled.input`
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
  min-height: 80px;
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

const NoSitzungMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #ccc;
  padding: 40px 20px;
`;

const SuccessMessage = styled.div`
  background: #28a745;
  color: white;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: #dc3545;
  color: white;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

const InsertPosition = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  background: #2d2d2d;
  border-radius: 6px;
`;

const InsertLabel = styled.div`
  color: #ccc;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const InsertInfo = styled.div`
  color: #fff;
  font-weight: bold;
  font-size: 1rem;
`;

function Sitzungsablauf() {
  const [sitzung, setSitzung] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [insertAfter, setInsertAfter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    notizen: '',
    dauer: '300' // 5 Minuten Standard
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    } catch (error) {
      console.error('Fehler beim Laden der Sitzung:', error);
    }
  };

  const handleProgrammpunktUpdate = (data) => {
    if (data.sitzungId === aktiveSitzung) {
      loadSitzung();
    }
  };

  const handleAddProgrammpunkt = (afterIndex) => {
    setInsertAfter(afterIndex);
    setFormData({
      name: '',
      notizen: '',
      dauer: '300'
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!aktiveSitzung) {
      setMessage({ type: 'error', text: 'Keine aktive Sitzung ausgewählt' });
      return;
    }

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Bitte geben Sie einen Namen ein' });
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const programmpunktData = {
        name: formData.name,
        typ: 'MODERATION',
        einzugCD: false,
        auszugCD: false,
        trainer: '',
        betreuer: '',
        anmoderation: '',
        abmoderation: '',
        notizen: formData.notizen,
        dauer: parseInt(formData.dauer) || 300,
        lichtStimmung: 'Standard',
        audioDateien: [],
        namensliste: [],
        insertAfter: insertAfter
      };

      await axios.post(`/api/sitzung/${aktiveSitzung}/programmpunkt`, programmpunktData);
      
      setMessage({ type: 'success', text: 'Programmpunkt erfolgreich hinzugefügt!' });
      setShowModal(false);
      
      // Kurze Verzögerung für bessere UX
      setTimeout(() => {
        setMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Programmpunkts:', error);
      setMessage({ type: 'error', text: 'Fehler beim Hinzufügen des Programmpunkts' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        {/* Untertitel und Icon entfernt */}
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
            <AddButton 
              onClick={() => handleAddProgrammpunkt(sitzung.programmpunkte.indexOf(programmpunkt))}
            >
              +
            </AddButton>
          </ProgramItem>
        ))}
      </ProgramList>

      <ZettelSystem viewType="programmansicht" />



      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Neuer Programmpunkt</ModalTitle>
            
            {message && (
              message.type === 'success' ? (
                <SuccessMessage>{message.text}</SuccessMessage>
              ) : (
                <ErrorMessage>{message.text}</ErrorMessage>
              )
            )}

            <InsertPosition>
              <InsertLabel>Einfügen nach:</InsertLabel>
              <InsertInfo>
                {insertAfter === null ? 'Am Anfang' : 
                 insertAfter >= sitzung.programmpunkte.length ? 'Am Ende' :
                 `Programmpunkt ${insertAfter + 1}: ${sitzung.programmpunkte[insertAfter]?.name}`
                }
              </InsertInfo>
            </InsertPosition>

            <form onSubmit={handleSubmit}>
              <FormLabel>Name *</FormLabel>
              <FormInput
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name des Programmpunkts"
                required
              />

              <FormLabel>Dauer (Sekunden)</FormLabel>
              <FormInput
                type="number"
                name="dauer"
                value={formData.dauer}
                onChange={handleInputChange}
                placeholder="300"
                min="0"
              />

              <FormLabel>Notizen</FormLabel>
              <FormTextarea
                name="notizen"
                value={formData.notizen}
                onChange={handleInputChange}
                placeholder="Zusätzliche Notizen..."
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
                  {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default Sitzungsablauf; 