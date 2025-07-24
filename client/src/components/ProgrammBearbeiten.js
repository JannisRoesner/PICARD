import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 12px;
`;

const ProgrammlistePanel = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 10px;
  padding: 18px 10px 18px 18px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
`;

const ProgrammlisteTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 16px;
  font-size: 1.2rem;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
`;

const Programmliste = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ProgrammpunktItem = styled.div`
  padding: 10px 8px;
  margin-bottom: 8px;
  background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#232323'};
  color: ${props => props.active ? '#181818' : '#fff'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border: 1.5px solid transparent;
  transition: all 0.2s;
  &:hover {
    border: 1.5px solid ${props => props.theme?.colors?.primary || '#fbbf24'};
    background: ${props => props.active ? (props.theme?.colors?.primary || '#fbbf24') : '#2d2d2d'};
    color: #181818;
  }
`;

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: #181818;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0008;
`;

const Title = styled.h2`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  text-align: center;
  margin-bottom: 18px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #232323;
  color: #fff;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #232323;
  color: #fff;
  font-size: 1rem;
`;

const CheckboxRow = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const NamensListeBox = styled.div`
  background: #232323;
  border-radius: 6px;
  border: 1px solid #444;
  padding: 10px;
  margin-top: 4px;
  min-height: 38px;
`;

const NamensItem = styled.span`
  display: inline-block;
  background: #fbbf24;
  color: #181818;
  border-radius: 4px;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  font-size: 0.95em;
`;

const RemoveName = styled.button`
  background: none;
  border: none;
  color: #c00;
  font-weight: bold;
  margin-left: 4px;
  cursor: pointer;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &.yellow {
    background: #fbbf24;
    color: #181818;
  }
  &.yellow:disabled {
    background: #ffe066;
    color: #888;
    cursor: not-allowed;
  }
  &.gray {
    background: #444;
    color: #fff;
  }
`;

const Message = styled.div`
  text-align: center;
  margin: 10px 0;
  color: ${props => props.error ? '#dc3545' : '#28a745'};
  font-weight: bold;
`;

function ProgrammBearbeiten() {
  const { aktiveSitzung } = useContext(SitzungContext);
  const [typen, setTypen] = useState([]);
  const [programmpunkte, setProgrammpunkte] = useState([]);
  const [selected, setSelected] = useState(null); // aktuell ausgewählter Programmpunkt
  const [formData, setFormData] = useState({
    name: '',
    typ: '',
    dauer: '',
    trainer: '',
    betreuer: '',
    einzugCD: false,
    auszugCD: false,
    namensliste: [],
    namensInput: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTypen();
    loadProgrammpunkte();
  }, [aktiveSitzung]);

  useEffect(() => {
    if (selected) {
      setFormData({
        name: selected.name || '',
        typ: selected.typ || '',
        dauer: selected.dauer?.toString() || '',
        trainer: selected.trainer || '',
        betreuer: selected.betreuer || '',
        einzugCD: !!selected.einzugCD,
        auszugCD: !!selected.auszugCD,
        namensliste: selected.namensliste || [],
        namensInput: ''
      });
    } else {
      resetForm();
    }
  }, [selected]);

  const loadTypen = async () => {
    try {
      const response = await axios.get('/api/typen');
      setTypen(response.data);
    } catch (error) {
      setTypen(['SHOWTANZ', 'BÜTTENREDE', 'MARSCH', 'PAUSE']);
    }
  };

  const loadProgrammpunkte = async () => {
    if (!aktiveSitzung) return;
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      setProgrammpunkte(response.data.programmpunkte || []);
    } catch (error) {
      setProgrammpunkte([]);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addName = () => {
    if (formData.namensInput.trim()) {
      const names = formData.namensInput.split(/[,;]/).map(n => n.trim()).filter(n => n);
      setFormData(prev => ({
        ...prev,
        namensliste: [...prev.namensliste, ...names],
        namensInput: ''
      }));
    }
  };

  const removeName = idx => {
    setFormData(prev => ({
      ...prev,
      namensliste: prev.namensliste.filter((_, i) => i !== idx)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      typ: '',
      dauer: '',
      trainer: '',
      betreuer: '',
      einzugCD: false,
      auszugCD: false,
      namensliste: [],
      namensInput: ''
    });
    setSelected(null);
    setMessage('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.typ) {
      setMessage('Bitte Name und Typ angeben!');
      return;
    }
    if (!aktiveSitzung) {
      setMessage('Keine aktive Sitzung ausgewählt!');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const payload = {
        name: formData.name,
        typ: formData.typ,
        dauer: parseInt(formData.dauer) || 0,
        trainer: formData.trainer,
        betreuer: formData.betreuer,
        einzugCD: formData.einzugCD,
        auszugCD: formData.auszugCD,
        namensliste: formData.namensliste
      };
      if (selected && selected.id) {
        await axios.put(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selected.id}`, payload);
        setMessage('Programmpunkt aktualisiert!');
      } else {
        await axios.post(`/api/sitzung/${aktiveSitzung}/programmpunkt`, payload);
        setMessage('Programmpunkt hinzugefügt!');
        resetForm();
      }
      await loadProgrammpunkte();
    } catch (err) {
      setMessage('Fehler beim Speichern!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selected && selected.id) {
      if (window.confirm('Diesen Programmpunkt wirklich löschen?')) {
        try {
          await axios.delete(`/api/sitzung/${aktiveSitzung}/programmpunkt/${selected.id}`);
          setMessage('Programmpunkt gelöscht!');
          await loadProgrammpunkte();
          resetForm();
        } catch (err) {
          setMessage('Fehler beim Löschen!');
        }
      }
    } else {
      resetForm();
    }
  };

  return (
    <PageContainer>
      <ProgrammlistePanel>
        <ProgrammlisteTitle>Programmablauf</ProgrammlisteTitle>
        <Programmliste>
          {programmpunkte.length === 0 && <div style={{ color: '#888' }}>Keine Programmpunkte vorhanden</div>}
          {programmpunkte.map(pp => (
            <ProgrammpunktItem
              key={pp.id}
              active={selected && selected.id === pp.id}
              onClick={() => setSelected(pp)}
            >
              <div style={{ fontWeight: 'bold' }}>{pp.name}</div>
              <div style={{ fontSize: '0.95em', color: '#888' }}>{pp.typ} &bull; {pp.dauer ? pp.dauer + 's' : ''}</div>
            </ProgrammpunktItem>
          ))}
        </Programmliste>
        <button style={{marginTop:16, background:'#444', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', fontWeight:'bold', cursor:'pointer'}} onClick={resetForm}>
          + Neuer Programmpunkt
        </button>
      </ProgrammlistePanel>
      <div>
        <Container>
          <Title>Programm bearbeiten</Title>
          {message && <Message error={message.startsWith('Fehler')}>{message}</Message>}
          <Form onSubmit={handleSubmit}>
            <Label>Name *</Label>
            <Input name="name" value={formData.name} onChange={handleInputChange} required />

            <Label>Typ *</Label>
            <Select name="typ" value={formData.typ} onChange={handleInputChange} required>
              <option value="">Typ wählen</option>
              {typen.map(typ => <option key={typ} value={typ}>{typ}</option>)}
            </Select>

            <Label>Dauer (Sekunden)</Label>
            <Input name="dauer" type="number" min="0" value={formData.dauer} onChange={handleInputChange} />

            <Label>Trainer</Label>
            <Input name="trainer" value={formData.trainer} onChange={handleInputChange} />

            <Label>Betreuer</Label>
            <Input name="betreuer" value={formData.betreuer} onChange={handleInputChange} />

            <CheckboxRow>
              <label>
                <input type="checkbox" name="einzugCD" checked={formData.einzugCD} onChange={handleInputChange} /> Einzug von CD
              </label>
              <label>
                <input type="checkbox" name="auszugCD" checked={formData.auszugCD} onChange={handleInputChange} /> Auszug von CD
              </label>
            </CheckboxRow>

            <Label>Namensliste (Komma oder Semikolon getrennt)</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                name="namensInput"
                value={formData.namensInput}
                onChange={handleInputChange}
                placeholder="z.B. Max, Anna; Peter"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addName())}
              />
              <Button type="button" className="yellow" style={{ minWidth: 90 }} onClick={addName}>
                Hinzufügen
              </Button>
            </div>
            <NamensListeBox>
              {formData.namensliste.length === 0 && <span style={{ color: '#888' }}>Keine Namen hinzugefügt</span>}
              {formData.namensliste.map((name, idx) => (
                <NamensItem key={idx}>
                  {name}
                  <RemoveName type="button" onClick={() => removeName(idx)}>×</RemoveName>
                </NamensItem>
              ))}
            </NamensListeBox>

            <ButtonRow>
              <Button type="button" className="gray" onClick={handleDelete}>
                Löschen
              </Button>
              <Button type="submit" className="yellow" disabled={isSubmitting}>
                Änderungen speichern
              </Button>
            </ButtonRow>
          </Form>
        </Container>
      </div>
    </PageContainer>
  );
}

export default ProgrammBearbeiten; 