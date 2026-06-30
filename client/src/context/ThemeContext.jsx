import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

const ThemeContext = createContext();

// Corporate Design (einheitlich)
const theme = {
  name: 'corporate',
  colors: {
    primary: '#fbbf24', // Gelb aus dem Logo
    secondary: '#f59e0b', // Dunkleres Gelb
    background: '#000', // Dunkler Hintergrund
    surface: '#1a1a1a', // Dunkelgrau
    surfaceSecondary: '#2d2d2d', // Helleres Dunkelgrau
    text: '#fff', // Weiß für bessere Lesbarkeit
    textSecondary: '#ccc', // Hellgrau
    textMuted: '#888', // Mittleres Grau
    border: '#333', // Dunkelgrau
    success: '#10b981', // Grün
    warning: '#f59e0b', // Orange
    danger: '#ef4444', // Rot
    info: '#3b82f6', // Blau
    navBackground: '#1e3a8a', // Blau für Navigation
    navActive: '#dc2626', // Rot für aktive Navigation (aus Bildmarke)
    navText: '#fff' // Weiß für Navigation
  },
  gradients: {
    primary: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)', // Blau für Navigation
    background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', // Dunkler Hintergrund
    card: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' // Dunkle Karten
  },
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    monospace: 'JetBrains Mono, Consolas, monospace'
  },
  logo: {
    src: '/bildmarke.png', // Nur die Bildmarke
    alt: 'PICARD Bildmarke'
  }
};

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Entferne alte Theme-Einstellungen aus localStorage
    localStorage.removeItem('sitzungsmaster-theme');
    console.log('Using unified corporate theme');
  }, []);

  const value = {
    theme,
    currentTheme: 'corporate',
    toggleTheme: () => {
      console.log('Theme toggle disabled - using unified corporate theme');
    },
    isOldTheme: false,
    isNewTheme: true
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 