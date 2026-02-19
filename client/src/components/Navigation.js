import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';
import { useTimer } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const NavContainer = styled.nav`
  background: ${props => props.theme?.colors?.navBackground || props.theme?.gradients?.primary || 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border-bottom: 2px solid ${props => props.theme?.colors?.border || '#333'};
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 480px) {
    padding: 0 10px;
  }

  @media (max-width: 360px) {
    padding: 0 5px;
  }
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;

  @media (max-width: 480px) {
    height: 50px;
  }

  @media (max-width: 360px) {
    height: 45px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuOverlay = styled.div`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 998;
`;

const MobileNavLinks = styled.div`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: ${props => props.theme?.colors?.navBackground || props.theme?.gradients?.primary || 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border-bottom: 2px solid ${props => props.theme?.colors?.border || '#333'};
  padding: 20px;
  flex-direction: column;
  gap: 15px;
  z-index: 999;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  max-height: calc(100vh - 60px);
  overflow-y: auto;

  @media (max-width: 480px) {
    top: 50px;
    padding: 15px;
    gap: 10px;
    max-height: calc(100vh - 50px);
  }

  @media (max-width: 360px) {
    top: 45px;
    padding: 10px;
    gap: 8px;
    max-height: calc(100vh - 45px);
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  color: ${props => props.active ? (props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35') : (props.theme?.colors?.navText || '#fff')};
  text-decoration: none;
  padding: 16px 20px;
  border-radius: 8px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s ease;
  background: ${props => props.active ? `${props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}20` : 'transparent'};
  border: 1px solid ${props => props.active ? `${props.theme?.colors?.navActive || props.theme?.colors?.primary || '#ff6b35'}50` : 'transparent'};
  font-size: 18px;
  text-align: center;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    padding: 12px 15px;
    font-size: 16px;
    min-height: 45px;
  }

  @media (max-width: 360px) {
    padding: 10px 12px;
    font-size: 14px;
    min-height: 40px;
  }

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
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-width: 50px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    min-width: 40px;
    min-height: 40px;
    font-size: 20px;
    padding: 6px;
  }

  @media (max-width: 360px) {
    min-width: 35px;
    min-height: 35px;
    font-size: 18px;
    padding: 5px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: flex;
  }

  @media (min-width: 769px) {
    display: none; /* Verstecke Hamburger-Button auf Desktop */
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
    display: none; /* Verstecke Timer und Sitzungsstatus auf mobilen Geräten */
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
  const { authenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isProgramView = isActive('/programmansicht');

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      window.location.href = '/';
    }
  };

  const handleMobileMenuToggle = () => {
    console.log('Mobile menu toggle clicked, current state:', mobileMenuOpen);
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileLinkClick = () => {
    console.log('Mobile link clicked, closing menu');
    setMobileMenuOpen(false);
  };

  const handleOverlayClick = () => {
    console.log('Overlay clicked, closing menu');
    setMobileMenuOpen(false);
  };

  // Schließe mobile Menü wenn sich die Route ändert
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Verhindere Body-Scroll wenn mobile Menü geöffnet ist
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <NavContainer className="nav-container">
        <NavContent>
          <Logo />
          
          {isProgramView ? (
            <NavLinks>
              <NavLink to="/programmansicht" active={true}>
                Programm
              </NavLink>
            </NavLinks>
          ) : (
            <NavLinks>
              <NavLink to="/" active={isActive('/')}>Verwaltung</NavLink>
              <NavLink to="/moderation" active={isActive('/moderation')}>
                Moderation
              </NavLink>
              <NavLink to="/technik" active={isActive('/technik')}>
                Technik
              </NavLink>
              <NavLink to="/kulissen" active={isActive('/kulissen')}>
                Kulissen
              </NavLink>
              <NavLink to="/elferrat" active={isActive('/elferrat')}>
                Elferrat
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
          )}

          <HamburgerButton onClick={handleMobileMenuToggle} aria-label="Menü öffnen/schließen">
            {mobileMenuOpen ? '✕' : '☰'}
          </HamburgerButton>

          <StatusIndicator>
            <CurrentTime>{formatCurrentTime(currentTime)}</CurrentTime>
            {!isProgramView && (
              <>
                <SessionInfo>
                  <StatusDot active={!!aktiveSitzung} />
                  <span>
                    {aktiveSitzung ? 'Sitzung aktiv' : 'Keine aktive Sitzung'}
                  </span>
                </SessionInfo>

                {authenticated && (
                  <ActionButtons>
                    <ActionButton 
                      variant="logout" 
                      onClick={handleLogout}
                      title="Abmelden"
                    >
                      🚪
                    </ActionButton>
                  </ActionButtons>
                )}
              </>
            )}
          </StatusIndicator>
        </NavContent>
      </NavContainer>

      <MobileMenuOverlay isOpen={mobileMenuOpen} onClick={handleOverlayClick} />
      
      <MobileNavLinks isOpen={mobileMenuOpen}>
        <div style={{ 
          padding: '10px', 
          textAlign: 'center', 
          color: '#fff', 
          fontSize: '14px',
          borderBottom: '1px solid #333',
          marginBottom: '10px'
        }}>
          Navigation
        </div>
        {isProgramView ? (
          <MobileNavLink to="/programmansicht" active={true} onClick={handleMobileLinkClick}>
            📋 Programmansicht
          </MobileNavLink>
        ) : (
          <>
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
            <MobileNavLink to="/elferrat" active={isActive('/elferrat')} onClick={handleMobileLinkClick}>
              🎩 Elferrat
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
            
            {/* Mobile Sitzungsstatus */}
            <div style={{ 
              padding: '15px 20px', 
              borderTop: '1px solid #333',
              marginTop: '10px',
              fontSize: '14px',
              color: '#ccc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <StatusDot active={!!aktiveSitzung} />
                <span>{aktiveSitzung ? 'Sitzung aktiv' : 'Keine aktive Sitzung'}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {formatCurrentTime(currentTime)}
              </div>
              {authenticated && (
                <button
                  onClick={handleLogout}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%'
                  }}
                >
                  🚪 Abmelden
                </button>
              )}
            </div>
          </>
        )}
      </MobileNavLinks>
    </>
  );
}

export default Navigation; 