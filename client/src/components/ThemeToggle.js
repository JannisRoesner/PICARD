import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const ToggleContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1001;
  background: ${props => props.theme?.colors?.surface || '#1a1a1a'};
  border: 2px solid ${props => props.theme?.colors?.border || '#333'};
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    top: 70px;
    right: 10px;
    padding: 8px;
  }
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? (props.theme?.colors?.primary || '#ff6b35') : (props.theme?.colors?.surfaceSecondary || '#2d2d2d')};
  color: ${props => props.active ? '#000' : (props.theme?.colors?.text || '#fff')};
  border: 1px solid ${props => props.theme?.colors?.border || '#333'};
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s ease;
  margin: 0 4px;

  &:hover {
    background: ${props => props.active ? (props.theme?.colors?.primary || '#ff6b35') : (props.theme?.colors?.border || '#333')};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 0.7rem;
  }
`;

const ToggleLabel = styled.div`
  color: ${props => props.theme?.colors?.textSecondary || '#ccc'};
  font-size: 0.7rem;
  margin-bottom: 8px;
  text-align: center;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 0.6rem;
    margin-bottom: 6px;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 4px;
`;

function ThemeToggle() {
  const { currentTheme, toggleTheme, isOldTheme, isNewTheme } = useTheme();

  return (
    <ToggleContainer>
      <ToggleLabel>Design</ToggleLabel>
      <ToggleGroup>
        <ToggleButton 
          active={isOldTheme} 
          onClick={() => !isOldTheme && toggleTheme()}
        >
          Alt
        </ToggleButton>
        <ToggleButton 
          active={isNewTheme} 
          onClick={() => !isNewTheme && toggleTheme()}
        >
          Neu
        </ToggleButton>
      </ToggleGroup>
    </ToggleContainer>
  );
}

export default ThemeToggle; 