import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${props => props.theme.fonts.primary};
  min-width: 320px; // sorgt für mehr Platz für den Slogan
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme?.colors?.navText || props.theme?.colors?.text || '#fff'};
  text-decoration: none;
`;

const LogoSubtext = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme?.colors?.navText || props.theme?.colors?.textSecondary || '#fff'};
  font-weight: normal;
  margin-top: -2px;
`;

function Logo() {
  const { theme, isNewTheme } = useTheme();

  if (isNewTheme && theme.logo.src) {
    return (
      <LogoContainer>
        <LogoImage src={theme.logo.src} alt={theme.logo.alt} />
        <div>
          <LogoText>Sitzungsmaster</LogoText>
          <LogoSubtext>Mehr Überblick, weniger Chaos.</LogoSubtext>
        </div>
      </LogoContainer>
    );
  }

  return (
    <LogoContainer>
      <LogoText>Sitzungsmaster</LogoText>
    </LogoContainer>
  );
}

export default Logo; 