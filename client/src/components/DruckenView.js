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

  const printProgrammansicht = async () => {
    try {
      const response = await fetch(`/api/sitzung/${aktiveSitzung}/pdf/programmansicht`, {
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
      a.download = `programmansicht-${sitzung.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim PDF-Download: ' + error.message);
    }
  };

  const printKulissenView = async () => {
    try {
      const response = await fetch(`/api/sitzung/${aktiveSitzung}/pdf/kulissen`, {
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
      a.download = `kulissen-${sitzung.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim PDF-Download: ' + error.message);
    }
  };

  const printModeratorView = async () => {
    try {
      const response = await fetch(`/api/sitzung/${aktiveSitzung}/pdf/moderator`, {
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
      a.download = `moderator-${sitzung.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim PDF-Download: ' + error.message);
    }
  };

  const printTechnikerView = async () => {
    try {
      const response = await fetch(`/api/sitzung/${aktiveSitzung}/pdf/techniker`, {
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
      a.download = `techniker-${sitzung.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim PDF-Download:', error);
      alert('Fehler beim PDF-Download: ' + error.message);
    }
  };

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
      a.download = `alle-ansichten-${sitzung.name}.pdf`;
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