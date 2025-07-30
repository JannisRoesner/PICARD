import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';
import { useTheme } from '../context/ThemeContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: ${props => props.theme?.colors?.background || '#000'};
  min-height: 100vh;
`;



const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const SitzungCard = styled.div`
  background: ${props => props.theme?.gradients?.card || 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border: 2px solid ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : (props.theme?.colors?.border || '#333')};
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px ${props => props.theme?.colors?.primary || '#fbbf24'}20;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: -10px;
  right: 20px;
  background: ${props => props.theme?.colors?.success || '#28a745'};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
`;

const SitzungTitle = styled.h3`
  color: ${props => props.theme?.colors?.text || '#fff'};
  margin-bottom: 8px;
  font-size: 1.3rem;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
`;

const SitzungInfo = styled.div`
  color: ${props => props.theme?.colors?.textSecondary || '#ccc'};
  font-size: 0.9rem;
  margin-bottom: 16px;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
`;

const SitzungStats = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${props => props.theme?.colors?.textMuted || '#888'};
  font-size: 0.8rem;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme?.colors?.primary || '#fbbf24'} 0%, #f7931e 100%);
  color: #181818;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + '30' : 'rgba(251,191,36,0.3)')};
  }
`;



const LoadingMessage = styled.div`
  text-align: center;
  color: #ccc;
  font-size: 1.2rem;
  padding: 40px 20px;
`;

const ErrorMessage = styled.div`
  background: #dc3545;
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
`;

const RetryButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 10px;

  &:hover {
    background: ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + 'cc' : '#fbbf24cc')};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 400px;
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 20px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;

  &.primary {
    background: ${props => props.theme?.colors?.primary || '#fbbf24'};
    color: white;

    &:hover {
      background: ${(props) => (props.theme?.colors?.primary ? props.theme.colors.primary + 'cc' : '#fbbf24cc')};
    }
  }

  &.secondary {
    background: ${props => props.theme?.colors?.textMuted || '#666'};
    color: white;

    &:hover {
      background: ${props => props.theme?.colors?.textSecondary || '#555'};
    }
  }
`;

function SitzungsAuswahl() {
  const [showModal, setShowModal] = useState(false);
  const [newSitzungName, setNewSitzungName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const context = useContext(SitzungContext);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Verwende den globalen Context für Sitzungen
  const { aktiveSitzung, setAktiveSitzung, sitzungen, setSitzungen } = context || { 
    aktiveSitzung: null, 
    setAktiveSitzung: () => {
      console.warn('setAktiveSitzung nicht verfügbar');
    },
    sitzungen: [],
    setSitzungen: () => {
      console.warn('setSitzungen nicht verfügbar');
    }
  };

  // Lade Sitzungen nur beim ersten Laden oder wenn sie leer sind
  useEffect(() => {
    if (!sitzungen || sitzungen.length === 0) {
      loadSitzungen();
    }
  }, []); // Nur beim ersten Laden

  const loadSitzungen = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/sitzungen');
      // Sicherheitsmaßnahme: Stelle sicher, dass response.data ein Array ist
      const sitzungenData = Array.isArray(response.data) ? response.data : [];
      // Filtere ungültige Einträge
      const validSitzungen = sitzungenData.filter(sitzung => 
        sitzung && typeof sitzung === 'object' && sitzung.id
      );
      // Aktualisiere die globalen Sitzungen
      setSitzungen(validSitzungen);
    } catch (error) {
      console.error('Fehler beim Laden der Sitzungen:', error);
      setError('Fehler beim Laden der Sitzungen');
      setSitzungen([]);
    } finally {
      setLoading(false);
    }
  };

  const createSitzung = async () => {
    if (!newSitzungName.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/sitzung', {
        name: newSitzungName
      });
      
      // Sicherheitsmaßnahme: Prüfe ob response.data gültig ist
      if (response.data && response.data.id) {
        // Aktualisiere die globalen Sitzungen
        setSitzungen(prev => [...prev, response.data]);
        setNewSitzungName('');
        setShowModal(false);
      } else {
        throw new Error('Ungültige Antwort vom Server');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Sitzung:', error);
      setError('Fehler beim Erstellen der Sitzung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const activateSitzung = async (sitzungId) => {
    if (!sitzungId) {
      console.error('Keine Sitzungs-ID zum Aktivieren');
      return;
    }
    
    try {
      await axios.post(`/api/sitzung/${sitzungId}/aktiv`);
      setAktiveSitzung(sitzungId);
    } catch (error) {
      console.error('Fehler beim Aktivieren der Sitzung:', error);
      setError('Fehler beim Aktivieren der Sitzung: ' + error.message);
    }
  };

  // Aktualisiere Sitzungen wenn sie sich ändern
  const refreshSitzungen = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sitzungen');
      const sitzungenData = Array.isArray(response.data) ? response.data : [];
      const validSitzungen = sitzungenData.filter(sitzung => 
        sitzung && typeof sitzung === 'object' && sitzung.id
      );
      setSitzungen(validSitzungen);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Sitzungen:', error);
      setError('Fehler beim Aktualisieren der Sitzungen');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unbekannt';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };



  if (loading && (!sitzungen || sitzungen.length === 0)) {
          return (
        <Container>
          <LoadingMessage>Sitzungen werden geladen...</LoadingMessage>
        </Container>
      );
  }

  return (
    <Container>

      {error && (
        <ErrorMessage>
          {error}
          <br />
          <RetryButton onClick={refreshSitzungen}>
            Erneut versuchen
          </RetryButton>
        </ErrorMessage>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Verfügbare Sitzungen</h2>
        <Button 
          className="secondary" 
          onClick={refreshSitzungen}
          disabled={loading}
        >
          {loading ? 'Lädt...' : '🔄 Aktualisieren'}
        </Button>
      </div>

      <Grid>
        {sitzungen && sitzungen.length > 0 ? (
          sitzungen.map((sitzung) => {
            // Zusätzliche Sicherheitsmaßnahme für undefined sitzung
            if (!sitzung || typeof sitzung !== 'object') {
              return null;
            }
            
            return (
                                              <SitzungCard 
                  key={sitzung.id || Math.random()} 
                  active={aktiveSitzung === sitzung.id}
                  onClick={() => sitzung.id && activateSitzung(sitzung.id)}
                >
                  {aktiveSitzung && aktiveSitzung === sitzung.id && (
                    <ActiveBadge>AKTIV</ActiveBadge>
                  )}
                <SitzungTitle>{sitzung.name || 'Unbenannte Sitzung'}</SitzungTitle>
                <SitzungInfo>
                  Erstellt: {formatDate(sitzung.erstellt)}
                </SitzungInfo>
                <SitzungStats>
                  <span>{sitzung.programmpunkte?.length || 0} Programmpunkte</span>
                  <span>ID: {sitzung.id ? sitzung.id.slice(0, 8) + '...' : 'N/A'}</span>
                </SitzungStats>
              </SitzungCard>
            );
          }).filter(Boolean)
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            color: '#888', 
            padding: '40px 20px',
            fontSize: '1.1rem'
          }}>
            Keine Sitzungen vorhanden. Erstellen Sie Ihre erste Sitzung!
          </div>
        )}
      </Grid>



      <CreateButton onClick={() => setShowModal(true)}>
        Neue Sitzung erstellen
      </CreateButton>

      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Neue Sitzung erstellen</ModalTitle>
            <Input
              type="text"
              placeholder="Name der Sitzung"
              value={newSitzungName}
              onChange={(e) => setNewSitzungName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSitzung()}
              autoFocus
            />
            <ButtonGroup>
              <Button 
                className="secondary" 
                onClick={() => setShowModal(false)}
              >
                Abbrechen
              </Button>
              <Button 
                className="primary" 
                onClick={createSitzung}
              >
                Erstellen
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default SitzungsAuswahl; 