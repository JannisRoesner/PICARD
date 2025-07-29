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

const AllInOneButton = styled.button`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 24px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 32px auto;
  
  &:hover {
    background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
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

function DruckenView() {
  const [sitzung, setSitzung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { aktiveSitzung } = useContext(SitzungContext);

  useEffect(() => {
    if (aktiveSitzung) {
      loadSitzung();
    }
  }, [aktiveSitzung]);

  const loadSitzung = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sitzung/${aktiveSitzung}`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Sitzung');
      }
      const data = await response.json();
      setSitzung(data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Sitzung');
      console.error('Fehler beim Laden der Sitzung:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lokale Druckfunktionen (wie vorher)
  const printProgrammansicht = () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Programm - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
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
            .footer {
              position: fixed;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear}</div>
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
          <div class="footer">
            Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const printKulissenView = () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kulissen - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
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
            .kulissen-info { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .kulissen-title { font-weight: bold; margin-bottom: 8px; }
            .kulissen-item { margin-bottom: 5px; }
            .footer {
              position: fixed;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear} - Kulissen-Ansicht</div>
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
          <div class="footer">
            Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const printModeratorView = () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moderator - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
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
            .moderator-info { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .moderator-title { font-weight: bold; margin-bottom: 8px; }
            .moderator-item { margin-bottom: 5px; }
            .footer {
              position: fixed;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear} - Moderator-Ansicht</div>
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
                ${pp.anmoderation ? `<div class="moderator-item"><strong>Anmoderation:</strong> ${pp.anmoderation}</div>` : ''}
                ${pp.abmoderation ? `<div class="moderator-item"><strong>Abmoderation:</strong> ${pp.abmoderation}</div>` : ''}
                ${pp.notizen ? `<div class="moderator-item"><strong>Notizen:</strong> ${pp.notizen}</div>` : ''}
                ${pp.trainer ? `<div class="moderator-item"><strong>Trainer:</strong> ${pp.trainer}</div>` : ''}
                ${pp.betreuer ? `<div class="moderator-item"><strong>Betreuer:</strong> ${pp.betreuer}</div>` : ''}
                ${pp.namensliste && pp.namensliste.length > 0 ? `<div class="moderator-item"><strong>Namensliste:</strong> ${pp.namensliste.join(', ')}</div>` : ''}
              </div>
            </div>
          `).join('')}
          <div class="footer">
            Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const printTechnikerView = () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Techniker - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
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
            .techniker-info { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 10px;
            }
            .techniker-title { font-weight: bold; margin-bottom: 8px; }
            .techniker-item { margin-bottom: 5px; }
            .footer {
              position: fixed;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear} - Techniker-Ansicht</div>
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
                ${pp.lichtStimmung ? `<div class="techniker-item"><strong>💡 Licht-Informationen:</strong> ${pp.lichtStimmung}</div>` : ''}
                ${pp.audioDateien && pp.audioDateien.length > 0 ? `<div class="techniker-item"><strong>🎵 Audio-Informationen:</strong> ${pp.audioDateien.join(', ')}</div>` : ''}
                ${pp.audioCues && pp.audioCues.length > 0 ? `<div class="techniker-item"><strong>🎵 Audio-Cues:</strong> ${pp.audioCues.map(cue => cue.text || cue).join(', ')}</div>` : ''}
                ${pp.lightCues && pp.lightCues.length > 0 ? `<div class="techniker-item"><strong>💡 Licht-Cues:</strong> ${pp.lightCues.map(cue => cue.text || cue).join(', ')}</div>` : ''}
              </div>
            </div>
          `).join('')}
          <div class="footer">
            Änderungen vorbehalten. Live-Programminformationen sind hier verfügbar: ${serverUrl}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Nur dieser Button läuft serverseitig
  const printAllViewsAsPDF = async () => {
    try {
      const response = await fetch(`/api/sitzung/${aktiveSitzung}/pdf/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('PDF-Generierung fehlgeschlagen');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alle-ansichten-${sitzung.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim PDF-Download: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Lade Druckansichten...</LoadingMessage>
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

  return (
    <Container>
      <Title>📄 Druckansichten</Title>
      <Subtitle>Wählen Sie eine Ansicht zum Drucken oder laden Sie alle als PDF herunter</Subtitle>

      <AllInOneButton onClick={printAllViewsAsPDF}>
        <ButtonIcon>📦</ButtonIcon>
        <ButtonTitle>Alle Ansichten als PDF speichern</ButtonTitle>
        <ButtonDescription>Lädt alle vier Ansichten als separate PDF-Dateien herunter</ButtonDescription>
      </AllInOneButton>

      <ButtonGrid>
        <PrintButton onClick={printProgrammansicht}>
          <ButtonIcon>📋</ButtonIcon>
          <ButtonTitle>Programmansicht</ButtonTitle>
          <ButtonDescription>Einfache Programmübersicht ohne zusätzliche Informationen</ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printKulissenView}>
          <ButtonIcon>🎭</ButtonIcon>
          <ButtonTitle>Kulissen-Ansicht</ButtonTitle>
          <ButtonDescription>Programm mit Ein-/Auszug und Bühnenaufbau (Querformat)</ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printModeratorView}>
          <ButtonIcon>🎤</ButtonIcon>
          <ButtonTitle>Moderator-Ansicht</ButtonTitle>
          <ButtonDescription>Programm mit Texten, Namenslisten und Personen (Querformat)</ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printTechnikerView}>
          <ButtonIcon>🎛️</ButtonIcon>
          <ButtonTitle>Techniker-Ansicht</ButtonTitle>
          <ButtonDescription>Programm mit Cues und technischen Informationen (Querformat)</ButtonDescription>
        </PrintButton>
      </ButtonGrid>
    </Container>
  );
}

export default DruckenView; 