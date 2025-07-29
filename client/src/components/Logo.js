import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../context/ThemeContext';

// Warp-Animation Keyframes
const warpFly = keyframes`
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  10% {
    transform: translateX(10vw) scale(1.1);
    opacity: 1;
  }
  20% {
    transform: translateX(25vw) scale(1.2);
    opacity: 0.9;
  }
  30% {
    transform: translateX(40vw) scale(1.3);
    opacity: 0.8;
  }
  40% {
    transform: translateX(55vw) scale(1.4);
    opacity: 0.7;
  }
  50% {
    transform: translateX(70vw) scale(1.5);
    opacity: 0.6;
  }
  60% {
    transform: translateX(85vw) scale(1.6);
    opacity: 0.5;
  }
  70% {
    transform: translateX(100vw) scale(1.8);
    opacity: 0.4;
  }
  80% {
    transform: translateX(110vw) scale(2);
    opacity: 0.3;
  }
  90% {
    transform: translateX(120vw) scale(2.5);
    opacity: 0.2;
  }
  100% {
    transform: translateX(130vw) scale(3);
    opacity: 0;
  }
`;

const warpBlitz = keyframes`
  0% {
    transform: translateX(130vw) scale(3);
    opacity: 0;
    filter: brightness(1);
  }
  50% {
    transform: translateX(140vw) scale(4);
    opacity: 1;
    filter: brightness(3) hue-rotate(180deg);
  }
  100% {
    transform: translateX(150vw) scale(5);
    opacity: 0;
    filter: brightness(5) hue-rotate(360deg);
  }
`;

const warpReturn = keyframes`
  0% {
    transform: translateX(150vw) scale(5);
    opacity: 0;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${props => props.theme.fonts.primary};
  min-width: 320px; // sorgt für mehr Platz für den Slogan
  position: relative;
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
  
  &.warping {
    animation: ${warpFly} 2s ease-in-out forwards;
  }
  
  &.warp-blixt {
    animation: ${warpBlitz} 0.5s ease-out forwards;
  }
  
  &.warp-return {
    animation: ${warpReturn} 0.3s ease-in forwards;
  }
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme?.colors?.navText || props.theme?.colors?.text || '#fff'};
  text-decoration: none;
`;

const LogoSubtext = styled.div`
  font-size: 0.65rem;
  color: ${props => props.theme?.colors?.navText || props.theme?.colors?.textSecondary || '#fff'};
  font-weight: normal;
  margin-top: -2px;
`;

function Logo() {
  const { theme, isNewTheme } = useTheme();
  const [warpState, setWarpState] = useState('idle');
  const logoRef = useRef(null);

  const handleWarpClick = () => {
    if (warpState !== 'idle') return; // Verhindert mehrfache Klicks
    
    setWarpState('warping');
    
    // Phase 1: Warp-Flug (2 Sekunden)
    setTimeout(() => {
      setWarpState('warp-blixt');
      
      // Phase 2: Warp-Blitz (0.5 Sekunden)
      setTimeout(() => {
        setWarpState('hidden');
        
        // Phase 3: 5 Sekunden warten
        setTimeout(() => {
          setWarpState('warp-return');
          
          // Phase 4: Zurückkehren (0.3 Sekunden)
          setTimeout(() => {
            setWarpState('idle');
          }, 300);
        }, 5000);
      }, 500);
    }, 2000);
  };

  if (isNewTheme && theme.logo.src) {
    return (
      <LogoContainer>
        <LogoImage 
          ref={logoRef}
          src={theme.logo.src} 
          alt={theme.logo.alt} 
          onClick={handleWarpClick}
          className={warpState !== 'idle' ? warpState : ''}
          style={{ 
            visibility: warpState === 'hidden' ? 'hidden' : 'visible',
            position: warpState !== 'idle' ? 'fixed' : 'static',
            zIndex: warpState !== 'idle' ? 9999 : 'auto',
            top: warpState !== 'idle' ? '50%' : 'auto',
            transform: warpState !== 'idle' ? 'translateY(-50%)' : 'none'
          }}
        />
        <div>
          <LogoText>PICARD</LogoText>
          <LogoSubtext>Programm- & Informations-Center für Ablauf-, Regie- & Moderation</LogoSubtext>
        </div>
      </LogoContainer>
    );
  }

  return (
    <LogoContainer>
      <div>
        <LogoText>PICARD</LogoText>
        <LogoSubtext>Programm- & Informations-Center für Ablauf-, Regie- & Moderation</LogoSubtext>
      </div>
    </LogoContainer>
  );
}

export default Logo; 