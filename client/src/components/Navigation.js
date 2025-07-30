import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const NavContainer = styled.nav`
  background: ${props => props.theme?.colors?.navBackground || props.theme?.gradients?.primary || 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border-bottom: 2px solid ${props => props.theme?.colors?.border || '#333'};
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileNavLinks = styled.div`
  display: none;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: ${props => props.theme?.colors?.navBackground || props.theme?.gradients?.primary || 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border-bottom: 2px solid ${props => props.theme?.colors?.border || '#333'};
  padding: 20px;
  flex-direction: column;
  gap: 15px;
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-100%)'};
  transition: transform 0.3s ease;
  z-index: 999;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileNavLink = styled(Link)`
  color: ${props => props.active ? (props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35') : (props.theme?.colors?.navText || '#fff')};
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s ease;
  background: ${props => props.active ? `${props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}20` : 'transparent'};
  border: 1px solid ${props => props.active ? `${props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}50` : 'transparent'};

  &:hover {
    background: ${props => props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}20;
    color: ${props => props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'};
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: block;
  }
`;



const NavLink = styled(Link)`
  color: ${props => props.active ? (props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35') : (props.theme?.colors?.navText || '#fff')};
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s ease;
  background: ${props => props.active ? `${props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}20` : 'transparent'};

  &:hover {
    background: ${props => props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}20;
    color: ${props => props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'};
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    gap: 8px;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    gap: 5px;
    font-size: 0.7rem;
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? (props.theme?.colors?.success || '#28a745') : (props.theme?.colors?.danger || '#dc3545')};
`;

const CurrentTime = styled.div`
  color: ${props => props.theme?.colors?.primary || '#ff6b35'};
  font-weight: bold;
  font-size: 1rem;
  font-family: ${props => props.theme?.fonts?.monospace || 'Courier New, monospace'};

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ccc;

  @media (max-width: 768px) {
    gap: 5px;
  }

  @media (max-width: 480px) {
    gap: 3px;
  }
`;



const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    display: none;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'export' ? (props.theme?.colors?.success || '#28a745') : (props.theme?.colors?.info || '#007bff')};
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'export' ? (props.theme?.colors?.success || '#28a745') + 'dd' : (props.theme?.colors?.info || '#007bff') + 'dd'};
  }

  &:disabled {
    background: ${props => props.theme?.colors?.textMuted || '#666'};
    cursor: not-allowed;
  }
`;

function Navigation() {
  const location = useLocation();
  const { aktiveSitzung } = useContext(SitzungContext);
  const { 
    currentTime, 
    formatCurrentTime
  } = useTimer();
  const { theme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef();

  const isActive = (path) => location.pathname === path;

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Schließe mobile Menü wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.nav-container')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const exportSitzung = async () => {
    if (!aktiveSitzung) {
      alert('Keine aktive Sitzung zum Exportieren');
      return;
    }

    try {
      setExporting(true);
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}`);
      const sitzungData = response.data;
      
      const dataStr = JSON.stringify(sitzungData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `sitzung_${sitzungData.name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Sitzung erfolgreich exportiert!');
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
      const text = await file.text();
      const sitzungData = JSON.parse(text);
      
      if (!sitzungData.name || !sitzungData.programmpunkte) {
        throw new Error('Ungültige Sitzungsdatei');
      }

      const response = await axios.post('/api/sitzung', {
        name: `${sitzungData.name} (Importiert)`,
        programmpunkte: sitzungData.programmpunkte
      });

      alert('Sitzung erfolgreich importiert!');
      window.location.reload(); // Seite neu laden um neue Sitzung anzuzeigen
      
      event.target.value = '';
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      alert('Fehler beim Importieren der Sitzung: ' + error.message);
      event.target.value = '';
    }
  };

  return (
    <NavContainer className="nav-container">
      <NavContent>
        <Logo />
        
        <NavLinks>
          <NavLink to="/" active={isActive('/')}>
            Verwaltung
          </NavLink>
          <NavLink to="/moderation" active={isActive('/moderation')}>
            Moderation
          </NavLink>
          <NavLink to="/technik" active={isActive('/technik')}>
            Technik
          </NavLink>
          <NavLink to="/kulissen" active={isActive('/kulissen')}>
            Kulissen
          </NavLink>
          <NavLink to="/programmansicht" active={isActive('/programmansicht')}>
            Programm
          </NavLink>
          <NavLink to="/sitzungsablauf" active={isActive('/sitzungsablauf')}>
            Sitzungsablauf
          </NavLink>
          <NavLink to="/programm-bearbeiten" active={isActive('/programm-bearbeiten')}>
            Programm bearbeiten
          </NavLink>
          <NavLink to="/drucken" active={isActive('/drucken')}>
            Drucken
          </NavLink>
        </NavLinks>

        <HamburgerButton onClick={handleMobileMenuToggle}>
          {mobileMenuOpen ? '✕' : '☰'}
        </HamburgerButton>

        <StatusIndicator>
          <CurrentTime>{formatCurrentTime(currentTime)}</CurrentTime>
          
          <SessionInfo>
            <StatusDot active={!!aktiveSitzung} />
            <span>
              {aktiveSitzung ? 'Sitzung aktiv' : 'Keine aktive Sitzung'}
            </span>
          </SessionInfo>

          <ActionButtons>
            {aktiveSitzung && (
              <ActionButton 
                variant="export" 
                onClick={exportSitzung}
                disabled={exporting}
                title="Sitzung exportieren"
              >
                {exporting ? '...' : '💾'}
              </ActionButton>
            )}
            <ActionButton 
              variant="import" 
              onClick={() => fileInputRef.current?.click()}
              title="Sitzung importieren"
            >
              📂
            </ActionButton>
          </ActionButtons>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importSitzung}
            style={{ display: 'none' }}
          />
        </StatusIndicator>
      </NavContent>

      <MobileNavLinks isOpen={mobileMenuOpen}>
        <MobileNavLink to="/" active={isActive('/')} onClick={handleMobileLinkClick}>
          📋 Verwaltung
        </MobileNavLink>
        <MobileNavLink to="/moderation" active={isActive('/moderation')} onClick={handleMobileLinkClick}>
          🎤 Moderation
        </MobileNavLink>
        <MobileNavLink to="/technik" active={isActive('/technik')} onClick={handleMobileLinkClick}>
          🎛️ Technik
        </MobileNavLink>
        <MobileNavLink to="/kulissen" active={isActive('/kulissen')} onClick={handleMobileLinkClick}>
          Kulissen
        </MobileNavLink>
        <MobileNavLink to="/programmansicht" active={isActive('/programmansicht')} onClick={handleMobileLinkClick}>
          📋 Programmansicht
        </MobileNavLink>
        <MobileNavLink to="/sitzungsablauf" active={isActive('/sitzungsablauf')} onClick={handleMobileLinkClick}>
          📱 Sitzungsablauf
        </MobileNavLink>
        <MobileNavLink to="/programm-bearbeiten" active={isActive('/programm-bearbeiten')} onClick={handleMobileLinkClick}>
          🛠️ Programm bearbeiten
        </MobileNavLink>
        <MobileNavLink to="/drucken" active={isActive('/drucken')} onClick={handleMobileLinkClick}>
          🖨️ Drucken
        </MobileNavLink>
      </MobileNavLinks>
    </NavContainer>
  );
}

export default Navigation; 