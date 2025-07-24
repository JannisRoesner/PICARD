import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
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
  font-size: 1.1rem;
`;

const Form = styled.form`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  color: #fff;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
  transform: scale(1.2);
`;

const CheckboxLabel = styled.label`
  color: #fff;
  font-size: 1rem;
`;

const NamensListeSection = styled.div`
  margin-bottom: 20px;
`;

const NamensListeHeader = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
`;

const NamensInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2d2d2d;
  color: #fff;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const AddButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background: #218838;
  }
`;

const NamensListe = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #555;
  border-radius: 4px;
  background: #2d2d2d;
`;

const NamensItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  color: #fff;

  &:last-child {
    border-bottom: none;
  }
`;

const RemoveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: #c82333;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.2s ease;

  &.primary {
    background: ${props => props.theme?.colors?.primary || '#fbbf24'};
    color: white;

    &:hover {
      background: ${props => props.theme?.colors?.primary || '#fbbf24'}cc;
      transform: translateY(-2px);
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
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  background: #28a745;
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
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

const NoSitzungMessage = styled.div`
  text-align: center;
  font-size: 1.5rem;
  color: #ccc;
  padding: 40px 20px;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button`
  background: #2d2d2d;
  color: #fff;
  border: 1px solid #555;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.colors?.primary || '#fbbf24'};
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

function ProgrammpunktEditor() {
  const [typen, setTypen] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    typ: '',
    einzugCD: false,
    auszugCD: false,
    trainer: '',
    betreuer: '',
    anmoderation: '',
    abmoderation: '',
    notizen: '',
    dauer: '',
    lichtStimmung: 'Standard',
    audioDateien: []
  });
  const [namensListe, setNamensListe] = useState([]);
  const [namensInput, setNamensInput] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { aktiveSitzung } = useContext(SitzungContext);

  useEffect(() => {
    loadTypen();
  }, []);

  const loadTypen = async () => {
    try {
      const response = await axios.get('/api/typen');
      setTypen(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Typen:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addNames = () => {
    if (namensInput.trim()) {
      // Namen durch Komma oder Semikolon trennen
      const names = namensInput.split(/[,;]/).map(name => name.trim()).filter(name => name.length > 0);
      setNamensListe(prev => [...prev, ...names]);
      setNamensInput('');
    }
  };

  const removeName = (index) => {
    setNamensListe(prev => prev.filter((_, i) => i !== index));
  };

  const quickFill = (template) => {
    switch (template) {
      case 'büttenrede':
        setFormData(prev => ({
          ...prev,
          typ: 'BÜTTENREDE',
          name: 'Büttenrede',
          dauer: '300',
          anmoderation: 'Es betritt die Bühne...',
          abmoderation: 'Vielen Dank für diese wunderbare Büttenrede!'
        }));
        break;
      case 'marsch':
        setFormData(prev => ({
          ...prev,
          typ: 'MARSCH',
          name: 'Marsch',
          dauer: '180',
          einzugCD: true,
          auszugCD: true
        }));
        break;
      case 'showtanz':
        setFormData(prev => ({
          ...prev,
          typ: 'SHOWTANZ',
          name: 'Showtanz',
          dauer: '240',
          lichtStimmung: 'Party'
        }));
        break;
      case 'pause':
        setFormData(prev => ({
          ...prev,
          typ: 'PAUSE',
          name: 'Pause',
          dauer: '600',
          notizen: '15 Minuten Pause'
        }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!aktiveSitzung) {
      setMessage({ type: 'error', text: 'Keine aktive Sitzung ausgewählt' });
      return;
    }

    if (!formData.name.trim() || !formData.typ) {
      setMessage({ type: 'error', text: 'Bitte füllen Sie alle Pflichtfelder aus' });
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const programmpunktData = {
        ...formData,
        namensliste: namensListe,
        dauer: parseInt(formData.dauer) || 0
      };

      await axios.post(`/api/sitzung/${aktiveSitzung}/programmpunkt`, programmpunktData);
      
      setMessage({ type: 'success', text: 'Programmpunkt erfolgreich hinzugefügt!' });
      
      // Form zurücksetzen
      setFormData({
        name: '',
        typ: '',
        einzugCD: false,
        auszugCD: false,
        trainer: '',
        betreuer: '',
        anmoderation: '',
        abmoderation: '',
        notizen: '',
        dauer: '',
        lichtStimmung: 'Standard',
        audioDateien: []
      });
      setNamensListe([]);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Programmpunkts:', error);
      setMessage({ type: 'error', text: 'Fehler beim Hinzufügen des Programmpunkts' });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Container>
      <Header>
        <Title>✏️ Programmpunkt Editor</Title>
        <Subtitle>Vollständigen Programmpunkt erstellen</Subtitle>
      </Header>

      {message && (
        message.type === 'success' ? (
          <SuccessMessage>{message.text}</SuccessMessage>
        ) : (
          <ErrorMessage>{message.text}</ErrorMessage>
        )
      )}

      <QuickActions>
        <QuickActionButton onClick={() => quickFill('büttenrede')}>
          🎭 Büttenrede
        </QuickActionButton>
        <QuickActionButton onClick={() => quickFill('marsch')}>
          🎵 Marsch
        </QuickActionButton>
        <QuickActionButton onClick={() => quickFill('showtanz')}>
          💃 Showtanz
        </QuickActionButton>
        <QuickActionButton onClick={() => quickFill('pause')}>
          ☕ Pause
        </QuickActionButton>
      </QuickActions>

      <Form onSubmit={handleSubmit}>
        <FormGrid>
          <FormSection>
            <FormLabel>Name des Programmpunkts *</FormLabel>
            <FormInput
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="z.B. Büttenrede von Max Mustermann"
              required
            />
          </FormSection>

          <FormSection>
            <FormLabel>Typ *</FormLabel>
            <FormSelect
              name="typ"
              value={formData.typ}
              onChange={handleInputChange}
              required
            >
              <option value="">Typ auswählen</option>
              {typen.map((typ) => (
                <option key={typ} value={typ}>{typ}</option>
              ))}
            </FormSelect>
          </FormSection>

          <FormSection>
            <FormLabel>Geschätzte Dauer (Sekunden)</FormLabel>
            <FormInput
              type="number"
              name="dauer"
              value={formData.dauer}
              onChange={handleInputChange}
              placeholder="180"
              min="0"
            />
          </FormSection>

          <FormSection>
            <FormLabel>Lichtstimmung</FormLabel>
            <FormSelect
              name="lichtStimmung"
              value={formData.lichtStimmung}
              onChange={handleInputChange}
            >
              <option value="Standard">Standard</option>
              <option value="Warm">Warm</option>
              <option value="Kalt">Kalt</option>
              <option value="Dramatisch">Dramatisch</option>
              <option value="Party">Party</option>
            </FormSelect>
          </FormSection>
        </FormGrid>

        <FormSection>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              name="einzugCD"
              checked={formData.einzugCD}
              onChange={handleInputChange}
            />
            <CheckboxLabel>Einzug kommt von CD</CheckboxLabel>
          </CheckboxContainer>

          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              name="auszugCD"
              checked={formData.auszugCD}
              onChange={handleInputChange}
            />
            <CheckboxLabel>Auszug kommt von CD</CheckboxLabel>
          </CheckboxContainer>
        </FormSection>

        <FormGrid>
          <FormSection>
            <FormLabel>Trainer</FormLabel>
            <FormInput
              type="text"
              name="trainer"
              value={formData.trainer}
              onChange={handleInputChange}
              placeholder="Name des Trainers"
            />
          </FormSection>

          <FormSection>
            <FormLabel>Betreuer</FormLabel>
            <FormInput
              type="text"
              name="betreuer"
              value={formData.betreuer}
              onChange={handleInputChange}
              placeholder="Name des Betreuers"
            />
          </FormSection>
        </FormGrid>

        <FormSection>
          <FormLabel>Anmoderation</FormLabel>
          <FormTextarea
            name="anmoderation"
            value={formData.anmoderation}
            onChange={handleInputChange}
            placeholder="Text für die Anmoderation..."
          />
        </FormSection>

        <FormSection>
          <FormLabel>Notizen</FormLabel>
          <FormTextarea
            name="notizen"
            value={formData.notizen}
            onChange={handleInputChange}
            placeholder="Zusätzliche Notizen..."
          />
        </FormSection>

        <FormSection>
          <FormLabel>Abmoderation</FormLabel>
          <FormTextarea
            name="abmoderation"
            value={formData.abmoderation}
            onChange={handleInputChange}
            placeholder="Text für die Abmoderation..."
          />
        </FormSection>

        <NamensListeSection>
          <FormLabel>Namensliste (mehrere Namen durch Komma oder Semikolon trennen)</FormLabel>
          <NamensListeHeader>
            <NamensInput
              type="text"
              placeholder="Max Mustermann, Anna Schmidt; Peter Müller"
              value={namensInput}
              onChange={(e) => setNamensInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNames()}
              style={{ flex: 1 }}
            />
            <AddButton type="button" onClick={addNames}>
              Hinzufügen
            </AddButton>
          </NamensListeHeader>
          
          <NamensListe>
            {namensListe.map((name, index) => (
              <NamensItem key={index}>
                <span>{name}</span>
                <RemoveButton type="button" onClick={() => removeName(index)}>
                  ✕
                </RemoveButton>
              </NamensItem>
            ))}
            {namensListe.length === 0 && (
              <NamensItem style={{ color: '#888', fontStyle: 'italic' }}>
                Keine Namen hinzugefügt
              </NamensItem>
            )}
          </NamensListe>
        </NamensListeSection>

        <ButtonGroup>
          <Button 
            type="button" 
            className="secondary"
            onClick={() => {
              setFormData({
                name: '',
                typ: '',
                einzugCD: false,
                auszugCD: false,
                trainer: '',
                betreuer: '',
                anmoderation: '',
                abmoderation: '',
                notizen: '',
                dauer: '',
                lichtStimmung: 'Standard',
                audioDateien: []
              });
              setNamensListe([]);
            }}
          >
            Formular leeren
          </Button>
          <Button 
            type="submit" 
            className="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird hinzugefügt...' : 'Programmpunkt hinzufügen'}
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default ProgrammpunktEditor; 