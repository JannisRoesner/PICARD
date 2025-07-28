import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { SitzungContext } from '../context/SitzungContext';

const Container = styled.div`
  max-width: 800px;
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

const Subtitle = styled.p`
  color: #ccc;
  text-align: center;
  margin-bottom: 32px;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const PrintButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  border-radius: 8px;
  padding: 20px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f59e0b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ButtonIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;

const ButtonTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const ButtonDescription = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  text-align: center;
`;

const InfoBox = styled.div`
  background: #232323;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
`;

const InfoTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 8px;
`;

const InfoText = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
`;

function DruckenView() {
  const { aktiveSitzung } = useContext(SitzungContext);
  const [sitzung, setSitzung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (aktiveSitzung) {
      loadSitzung();
    }
  }, [aktiveSitzung]);

  const loadSitzung = async () => {
    if (!aktiveSitzung) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/sitzung/${aktiveSitzung}`);
      if (!response.ok) throw new Error('Sitzung nicht gefunden');
      const data = await response.json();
      setSitzung(data);
    } catch (err) {
      setError('Fehler beim Laden der Sitzung');
      console.error('Fehler beim Laden der Sitzung:', err);
    } finally {
      setLoading(false);
    }
  };

  const printProgrammansicht = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Programm - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 15px; 
              padding: 15px; 
              page-break-inside: avoid;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 10px;
            }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
            .typ { color: #666; font-size: 14px; }
            .dauer { color: #666; font-size: 14px; }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name}</div>
            <div class="subtitle">Programmansicht</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div>
                <span class="nummer">${pp.nummer}</span>
                <span class="name">${pp.name}</span>
              </div>
              <div class="typ">${pp.typ}</div>
              <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printKulissenView = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kulissen - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 20px; 
              padding: 15px; 
              page-break-inside: avoid;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 10px;
            }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .typ { color: #666; font-size: 14px; margin-bottom: 10px; }
            .kulissen-info { 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .kulissen-title { font-weight: bold; margin-bottom: 8px; }
            .kulissen-item { margin-bottom: 5px; }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name}</div>
            <div class="subtitle">Kulissen-Ansicht</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div>
                <span class="nummer">${pp.nummer}</span>
                <span class="name">${pp.name}</span>
              </div>
              <div class="typ">${pp.typ}</div>
              <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
              <div class="kulissen-info">
                <div class="kulissen-title">🎭 Kulissen-Informationen</div>
                <div class="kulissen-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
                <div class="kulissen-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
                <div class="kulissen-item">🎪 ${pp.buehne || 'Bühne: frei'}</div>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printModeratorView = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moderator - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 20px; 
              padding: 15px; 
              page-break-inside: avoid;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 10px;
            }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .typ { color: #666; font-size: 14px; margin-bottom: 10px; }
            .dauer { color: #666; font-size: 14px; margin-bottom: 10px; }
            .moderator-info { 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .moderator-title { font-weight: bold; margin-bottom: 8px; }
            .moderator-item { margin-bottom: 5px; }
            .namensliste { 
              background: #e8f4fd; 
              padding: 8px; 
              border-radius: 3px; 
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name}</div>
            <div class="subtitle">Moderator-Ansicht</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div>
                <span class="nummer">${pp.nummer}</span>
                <span class="name">${pp.name}</span>
              </div>
              <div class="typ">${pp.typ}</div>
              <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
              <div class="moderator-info">
                <div class="moderator-title">📝 Moderator-Informationen</div>
                <div class="moderator-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
                <div class="moderator-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
                ${pp.trainer ? `<div class="moderator-item">👨‍🏫 Trainer: ${pp.trainer}</div>` : ''}
                ${pp.betreuer ? `<div class="moderator-item">👨‍💼 Betreuer: ${pp.betreuer}</div>` : ''}
                ${pp.namensliste && pp.namensliste.length > 0 ? `
                  <div class="moderator-item">
                    👥 Namensliste:
                    <div class="namensliste">${pp.namensliste.join(', ')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printTechnikerView = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Techniker - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 20px; 
              padding: 15px; 
              page-break-inside: avoid;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 10px;
            }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .typ { color: #666; font-size: 14px; margin-bottom: 10px; }
            .dauer { color: #666; font-size: 14px; margin-bottom: 10px; }
            .techniker-info { 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .techniker-title { font-weight: bold; margin-bottom: 8px; }
            .techniker-item { margin-bottom: 5px; }
            .audio-cues, .light-cues { 
              background: #e8f4fd; 
              padding: 8px; 
              border-radius: 3px; 
              margin-top: 5px;
              font-family: monospace;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name}</div>
            <div class="subtitle">Techniker-Ansicht</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div>
                <span class="nummer">${pp.nummer}</span>
                <span class="name">${pp.name}</span>
              </div>
              <div class="typ">${pp.typ}</div>
              <div class="dauer">Dauer: ${pp.dauer ? pp.dauer + ' Sekunden' : 'Keine Angabe'}</div>
              <div class="techniker-info">
                <div class="techniker-title">🎛️ Techniker-Informationen</div>
                <div class="techniker-item">🎵 Einzug: ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
                <div class="techniker-item">🎵 Auszug: ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
                ${pp.audioCues && pp.audioCues.length > 0 ? `
                  <div class="techniker-item">
                    🔊 Audio-Cues:
                    <div class="audio-cues">${pp.audioCues.join('<br>')}</div>
                  </div>
                ` : ''}
                ${pp.lightCues && pp.lightCues.length > 0 ? `
                  <div class="techniker-item">
                    💡 Licht-Cues:
                    <div class="light-cues">${pp.lightCues.join('<br>')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#ccc' }}>Lade Sitzung...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#dc3545' }}>{error}</div>
      </Container>
    );
  }

  if (!sitzung) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#ccc' }}>Keine Sitzung ausgewählt</div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Drucken</Title>
      <Subtitle>Wählen Sie eine Druckoption für die Sitzung "{sitzung.name}"</Subtitle>
      
      <ButtonGrid>
        <PrintButton onClick={printProgrammansicht}>
          <ButtonIcon>📋</ButtonIcon>
          <ButtonTitle>Programmansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm in der Übersichtsansicht ohne zusätzliche Details
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printKulissenView}>
          <ButtonIcon>🎭</ButtonIcon>
          <ButtonTitle>Kulissen-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit Einzug/Auszug und Bühneninformationen
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printModeratorView}>
          <ButtonIcon>🎤</ButtonIcon>
          <ButtonTitle>Moderator-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit allen Moderator-Informationen und Namenslisten
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printTechnikerView}>
          <ButtonIcon>🎛️</ButtonIcon>
          <ButtonTitle>Techniker-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit Audio- und Licht-Cues für die Technik
          </ButtonDescription>
        </PrintButton>
      </ButtonGrid>

      <InfoBox>
        <InfoTitle>💡 Druckhinweise</InfoTitle>
        <InfoText>
          • Jede Ansicht wird in einem neuen Fenster geöffnet und automatisch zum Drucken vorbereitet<br/>
          • Die Druckansicht ist für A4-Papier optimiert<br/>
          • Programmpunkte werden automatisch auf neue Seiten umgebrochen<br/>
          • Verwenden Sie "Als PDF speichern" für digitale Kopien
        </InfoText>
      </InfoBox>
    </Container>
  );
}

export default DruckenView; 