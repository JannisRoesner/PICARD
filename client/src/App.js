import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import styled from 'styled-components';

// Components
import SitzungsAuswahl from './components/SitzungsAuswahl';
import ModeratorView from './components/ModeratorView';
import TechnikView from './components/TechnikerView';
import Sitzungsablauf from './components/Sitzungsablauf';
import Programmansicht from './components/Programmansicht';
import KulissenView from './components/KulissenView';
import DruckenView from './components/DruckenView';
import ElferratView from './components/ElferratView';
import Navigation from './components/Navigation';
import ProgrammBearbeiten from './components/ProgrammBearbeiten';

// Context
import { SocketContext } from './context/SocketContext';
import { SitzungContext } from './context/SitzungContext';
import { TimerProvider } from './context/TimerContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background || '#000'};
  color: ${props => props.theme?.colors?.text || '#fff'};
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: ${props => props.theme?.colors?.text || '#fff'};
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [aktiveSitzung, setAktiveSitzung] = useState(null);
  const [sitzungen, setSitzungen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Socket.IO Verbindung - verwende relative URL für Produktion
    const newSocket = io();
    setSocket(newSocket);
    
    // Socket global verfügbar machen für Timer-Synchronisation
    window.socket = newSocket;

    // Lade initiale Daten
    const loadInitialData = async () => {
      try {
        const [sitzungenRes, aktiveSitzungRes] = await Promise.all([
          axios.get('/api/sitzungen'),
          axios.get('/api/aktive-sitzung')
        ]);
        
        setSitzungen(sitzungenRes.data);
        setAktiveSitzung(aktiveSitzungRes.data.aktiveSitzung);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        // Setze leere Arrays als Fallback
        setSitzungen([]);
        setAktiveSitzung(null);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Socket Event Listeners
    newSocket.on('connect', () => {
      console.log('Socket.IO verbunden');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO getrennt');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO Verbindungsfehler:', error);
    });

    newSocket.on('aktiveSitzungGeaendert', (data) => {
      setAktiveSitzung(data.sitzungId);
    });

    newSocket.on('programmpunktHinzugefuegt', (data) => {
      // Aktualisiere Sitzungen wenn ein neuer Programmpunkt hinzugefügt wurde
      if (aktiveSitzung === data.sitzungId) {
        // Lade die aktualisierten Sitzungen vom Server
        axios.get('/api/sitzungen').then(response => {
          setSitzungen(response.data);
        }).catch(error => {
          console.error('Fehler beim Aktualisieren der Sitzungen:', error);
        });
      }
    });

    newSocket.on('programmpunktAktualisiert', (data) => {
      // Aktualisiere Sitzungen wenn ein Programmpunkt aktualisiert wurde
      if (aktiveSitzung === data.sitzungId) {
        // Lade die aktualisierten Sitzungen vom Server
        axios.get('/api/sitzungen').then(response => {
          setSitzungen(response.data);
        }).catch(error => {
          console.error('Fehler beim Aktualisieren der Sitzungen:', error);
        });
      }
    });

    newSocket.on('programmpunktGeloescht', (data) => {
      // Aktualisiere Sitzungen wenn ein Programmpunkt gelöscht wurde
      if (aktiveSitzung === data.sitzungId) {
        // Lade die aktualisierten Sitzungen vom Server
        axios.get('/api/sitzungen').then(response => {
          setSitzungen(response.data);
        }).catch(error => {
          console.error('Fehler beim Aktualisieren der Sitzungen:', error);
        });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  if (loading) {
    return (
      <LoadingScreen>
        <div>PICARD wird geladen...</div>
      </LoadingScreen>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketContext.Provider value={socket}>
          <SitzungContext.Provider value={{ aktiveSitzung, setAktiveSitzung, sitzungen, setSitzungen }}>
            <TimerProvider>
              <Router>
                <AppContainer>
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><SitzungsAuswahl /></ProtectedRoute>} />
                    <Route path="/moderation" element={<ProtectedRoute><ModeratorView /></ProtectedRoute>} />
                    <Route path="/technik" element={<TechnikView />} />
                    <Route path="/programm-bearbeiten" element={<ProtectedRoute><ProgrammBearbeiten /></ProtectedRoute>} />
                    <Route path="/sitzungsablauf" element={<Sitzungsablauf />} />
                    <Route path="/programmansicht" element={<Programmansicht />} />
                    <Route path="/kulissen" element={<KulissenView />} />
                    <Route path="/elferrat" element={<ElferratView />} />
                    <Route path="/drucken" element={<ProtectedRoute><DruckenView /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppContainer>
              </Router>
            </TimerProvider>
          </SitzungContext.Provider>
        </SocketContext.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 