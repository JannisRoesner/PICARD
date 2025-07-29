import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../context/ThemeContext';

// Warp-Animation Keyframes
const warpFly = keyframes`
  0% {
    transform: translateX(0) scale(1) rotate(0deg);
    opacity: 1;
    filter: brightness(1);
  }
  15% {
    transform: translateX(15vw) scale(1.2) rotate(5deg);
    opacity: 1;
    filter: brightness(1.2);
  }
  30% {
    transform: translateX(30vw) scale(1.4) rotate(10deg);
    opacity: 0.9;
    filter: brightness(1.4) hue-rotate(15deg);
  }
  45% {
    transform: translateX(45vw) scale(1.6) rotate(15deg);
    opacity: 0.8;
    filter: brightness(1.6) hue-rotate(30deg);
  }
  60% {
    transform: translateX(60vw) scale(1.8) rotate(20deg);
    opacity: 0.7;
    filter: brightness(1.8) hue-rotate(45deg);
  }
  75% {
    transform: translateX(75vw) scale(2) rotate(25deg);
    opacity: 0.6;
    filter: brightness(2) hue-rotate(60deg);
  }
  90% {
    transform: translateX(90vw) scale(2.2) rotate(30deg);
    opacity: 0.5;
    filter: brightness(2.2) hue-rotate(75deg);
  }
  100% {
    transform: translateX(100vw) scale(2.5) rotate(35deg);
    opacity: 0;
    filter: brightness(2.5) hue-rotate(90deg);
  }
`;

const warpBlitz = keyframes`
  0% {
    transform: translateX(100vw) scale(2.5) rotate(35deg);
    opacity: 0;
    filter: brightness(2.5) hue-rotate(90deg);
  }
  20% {
    transform: translateX(110vw) scale(3) rotate(45deg);
    opacity: 1;
    filter: brightness(4) hue-rotate(180deg) saturate(2);
  }
  40% {
    transform: translateX(120vw) scale(3.5) rotate(55deg);
    opacity: 1;
    filter: brightness(5) hue-rotate(270deg) saturate(3);
  }
  60% {
    transform: translateX(130vw) scale(4) rotate(65deg);
    opacity: 0.8;
    filter: brightness(6) hue-rotate(360deg) saturate(4);
  }
  80% {
    transform: translateX(140vw) scale(4.5) rotate(75deg);
    opacity: 0.4;
    filter: brightness(7) hue-rotate(450deg) saturate(5);
  }
  100% {
    transform: translateX(150vw) scale(5) rotate(90deg);
    opacity: 0;
    filter: brightness(8) hue-rotate(540deg) saturate(6);
  }
`;

const warpReturn = keyframes`
  0% {
    transform: translateX(-50vw) scale(0.5) rotate(-45deg);
    opacity: 0;
    filter: brightness(2) hue-rotate(90deg);
  }
  20% {
    transform: translateX(-40vw) scale(0.6) rotate(-36deg);
    opacity: 0.2;
    filter: brightness(1.8) hue-rotate(72deg);
  }
  40% {
    transform: translateX(-30vw) scale(0.7) rotate(-27deg);
    opacity: 0.4;
    filter: brightness(1.6) hue-rotate(54deg);
  }
  60% {
    transform: translateX(-20vw) scale(0.8) rotate(-18deg);
    opacity: 0.6;
    filter: brightness(1.4) hue-rotate(36deg);
  }
  80% {
    transform: translateX(-10vw) scale(0.9) rotate(-9deg);
    opacity: 0.8;
    filter: brightness(1.2) hue-rotate(18deg);
  }
  100% {
    transform: translateX(0) scale(1) rotate(0deg);
    opacity: 1;
    filter: brightness(1) hue-rotate(0deg);
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
  transform-origin: center center;
  
  &:hover {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
  
  &.warping {
    animation: ${warpFly} 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  
  &.warp-blixt {
    animation: ${warpBlitz} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  
  &.warp-return {
    animation: ${warpReturn} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
    if (warpState !== 'idle') return;
    
    setWarpState('warping');
    
    // Phase 1: Warp-Flug (1.5 Sekunden)
    setTimeout(() => {
      setWarpState('warp-blixt');
      
      // Phase 2: Warp-Blitz (0.8 Sekunden)
      setTimeout(() => {
        setWarpState('hidden');
        
        // Phase 3: 3 Sekunden warten
        setTimeout(() => {
          setWarpState('warp-return');
          
          // Phase 4: Zurückkehren (0.6 Sekunden)
          setTimeout(() => {
            setWarpState('idle');
          }, 600);
        }, 3000);
      }, 800);
    }, 1500);
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