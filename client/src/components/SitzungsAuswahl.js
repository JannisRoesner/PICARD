import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';
import { useTheme } from '../context/ThemeContext';
import PasswordChangeDialog from './PasswordChangeDialog';

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

const CardActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const DeleteButton = styled.button`
  background: ${props => props.theme?.colors?.danger || '#dc3545'};
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
  }
`;

const RenameButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  }
`;

function SitzungsAuswahl() {
  const [showModal, setShowModal] = useState(false);
  const [newSitzungName, setNewSitzungName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef();
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

  const requestDeleteSitzung = (sitzung) => {
    if (!sitzung || !sitzung.id) return;
    setConfirmDeleteId(sitzung.id);
    setConfirmDeleteName(sitzung.name || 'Unbenannte Sitzung');
  };

  const deleteSitzung = async () => {
    if (!confirmDeleteId) return;
    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/api/sitzung/${confirmDeleteId}`);
      setSitzungen(prev => prev.filter(s => s && s.id !== confirmDeleteId));
      if (aktiveSitzung === confirmDeleteId) {
        setAktiveSitzung(null);
      }
      setConfirmDeleteId(null);
      setConfirmDeleteName('');
    } catch (error) {
      console.error('Fehler beim Löschen der Sitzung:', error);
      setError('Fehler beim Löschen der Sitzung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestRenameSitzung = (sitzung) => {
    if (!sitzung || !sitzung.id) return;
    setRenameId(sitzung.id);
    setRenameName(sitzung.name || '');
  };

  const renameSitzung = async () => {
    if (!renameId || !renameName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await axios.patch(`/api/sitzung/${renameId}`, { name: renameName.trim() });
      setSitzungen(prev => prev.map(s => 
        s && s.id === renameId ? { ...s, name: renameName.trim() } : s
      ));
      setRenameId(null);
      setRenameName('');
    } catch (error) {
      console.error('Fehler beim Umbenennen der Sitzung:', error);
      setError('Fehler beim Umbenennen der Sitzung: ' + error.message);
    } finally {
      setLoading(false);
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

  const exportSitzung = async () => {
    if (!aktiveSitzung) {
      alert('Keine aktive Sitzung zum Exportieren');
      return;
    }

    try {
      setExporting(true);
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/export`, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const matchedName = contentDisposition.match(/filename="?([^";]+)"?/i);
      const fileName = matchedName?.[1] || `sitzung_export_${new Date().toISOString().split('T')[0]}.zip`;

      const dataBlob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Sitzung erfolgreich als ZIP exportiert!');
    } catch (error) {
      console.error('Fehler beim Exportieren:', error);
      alert('Fehler beim Exportieren der Sitzung');
    } finally {
      setExporting(false);
    }
  };

  const importSitzung = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const formData = new FormData();
        formData.append('archive', file);

        await axios.post('/api/sitzung/import-zip', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        alert('ZIP-Sitzung erfolgreich importiert!');
        window.location.reload();
        event.target.value = '';
        return;
      }

      const text = await file.text();
      const sitzungData = JSON.parse(text);
      
      if (!sitzungData.name || !sitzungData.programmpunkte) {
        throw new Error('Ungültige Sitzungsdatei');
      }

      const normalizedProgrammpunkte = (Array.isArray(sitzungData.programmpunkte) ? sitzungData.programmpunkte : []).map((punkt) => {
        const normalizedPinboardNotes = Array.isArray(punkt.pinboardNotes)
          ? punkt.pinboardNotes.map((note) => ({
              ...note,
              type: note?.type === 'audio' ? 'audio' : 'text',
              title: typeof note?.title === 'string' ? note.title : (note?.type === 'audio' ? (note?.audioName || 'Audio') : 'Notiz'),
              text: typeof note?.text === 'string' ? note.text : '',
              audioSrc: typeof note?.audioSrc === 'string' ? note.audioSrc : undefined,
              audioName: typeof note?.audioName === 'string' ? note.audioName : undefined,
              audioMimeType: typeof note?.audioMimeType === 'string' ? note.audioMimeType : undefined,
              waveformBars: Array.isArray(note?.waveformBars) ? note.waveformBars : undefined
            }))
          : [];

        return {
          ...punkt,
          pinboardNotes: normalizedPinboardNotes
        };
      });

      const response = await axios.post('/api/sitzung', {
        name: `${sitzungData.name} (Importiert)`,
        programmpunkte: normalizedProgrammpunkte
      });

      alert('Sitzung erfolgreich importiert!');
      window.location.reload();
      
      event.target.value = '';
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      const errorMessage = error?.response?.status === 413
        ? 'Die Datei ist zu groß. Bitte Audio-Dateien verkleinern oder serverseitigen Dateiupload nutzen.'
        : error.message;
      alert('Fehler beim Importieren der Sitzung: ' + errorMessage);
      event.target.value = '';
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {aktiveSitzung && (
            <Button 
              className="secondary" 
              onClick={exportSitzung}
              disabled={exporting}
              title="Aktive Sitzung exportieren"
            >
              {exporting ? '...' : '💾 Exportieren'}
            </Button>
          )}
          <Button 
            className="secondary" 
            onClick={() => fileInputRef.current?.click()}
            title="Sitzung importieren"
          >
            📂 Importieren
          </Button>
          <Button 
            className="secondary" 
            onClick={() => setShowPasswordDialog(true)}
            title="Passwort ändern"
          >
            ⚙️ Passwort
          </Button>
          <Button 
            className="secondary" 
            onClick={refreshSitzungen}
            disabled={loading}
          >
            {loading ? 'Lädt...' : '🔄 Aktualisieren'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json"
        onChange={importSitzung}
        style={{ display: 'none' }}
      />

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
                  <CardActions>
                    <DeleteButton
                      onClick={(e) => { e.stopPropagation(); requestDeleteSitzung(sitzung); }}
                      title="Sitzung löschen"
                    >
                      🗑️ Löschen
                    </DeleteButton>
                    <RenameButton
                      onClick={(e) => { e.stopPropagation(); requestRenameSitzung(sitzung); }}
                      title="Sitzung umbenennen"
                    >
                      ✏️ Umbenennen
                    </RenameButton>
                  </CardActions>
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

      {confirmDeleteId && (
        <Modal onClick={() => { setConfirmDeleteId(null); setConfirmDeleteName(''); }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Sitzung löschen?</ModalTitle>
            <div style={{ color: '#ddd', marginBottom: '16px' }}>
              Möchten Sie die Sitzung "{confirmDeleteName}" wirklich löschen?
              {aktiveSitzung === confirmDeleteId && (
                <div style={{ color: '#f66', marginTop: '8px' }}>
                  Hinweis: Diese Sitzung ist aktuell aktiv und wird deaktiviert.
                </div>
              )}
            </div>
            <ButtonGroup>
              <Button
                className="secondary"
                onClick={() => { setConfirmDeleteId(null); setConfirmDeleteName(''); }}
              >
                Abbrechen
              </Button>
              <Button
                className="primary"
                onClick={deleteSitzung}
                disabled={loading}
              >
                {loading ? 'Löscht...' : 'Löschen'}
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {renameId && (
        <Modal onClick={() => { setRenameId(null); setRenameName(''); }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Sitzung umbenennen</ModalTitle>
            <Input
              type="text"
              placeholder="Neuer Name der Sitzung"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && renameSitzung()}
              autoFocus
            />
            <ButtonGroup>
              <Button
                className="secondary"
                onClick={() => { setRenameId(null); setRenameName(''); }}
              >
                Abbrechen
              </Button>
              <Button
                className="primary"
                onClick={renameSitzung}
                disabled={loading || !renameName.trim()}
              >
                {loading ? 'Speichert...' : 'Speichern'}
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {showPasswordDialog && (
        <PasswordChangeDialog onClose={() => setShowPasswordDialog(false)} />
      )}
    </Container>
  );
}

export default SitzungsAuswahl; 