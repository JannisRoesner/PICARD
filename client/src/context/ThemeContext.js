import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

const ThemeContext = createContext();

// Altes Design (aktuell)
const oldTheme = {
  name: 'old',
  colors: {
    primary: '#ff6b35',
    secondary: '#1a1a1a',
    background: '#000',
    surface: '#1a1a1a',
    surfaceSecondary: '#2d2d2d',
    text: '#fff',
    textSecondary: '#ccc',
    textMuted: '#888',
    border: '#333',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#007bff'
  },
  gradients: {
    primary: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)',
    background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
    card: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
  },
  fonts: {
    primary: 'Arial, sans-serif',
    monospace: 'Courier New, monospace'
  },
  logo: {
    src: null, // Kein Logo im alten Design
    alt: 'Sitzungsmaster'
  }
};

// Neues Corporate Design (Hybrid)
const newTheme = {
  name: 'new',
  colors: {
    primary: '#fbbf24', // Gelb aus dem Logo
    secondary: '#f59e0b', // Dunkleres Gelb
    background: '#000', // Dunkler Hintergrund beibehalten
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
    alt: 'Sitzungsmaster Bildmarke'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('old');
  const [theme, setTheme] = useState(oldTheme);

  useEffect(() => {
    // Lade gespeichertes Theme aus localStorage
    const savedTheme = localStorage.getItem('sitzungsmaster-theme');
    if (savedTheme && (savedTheme === 'old' || savedTheme === 'new')) {
      setCurrentTheme(savedTheme);
      setTheme(savedTheme === 'old' ? oldTheme : newTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newThemeName = currentTheme === 'old' ? 'new' : 'old';
    const newThemeData = newThemeName === 'old' ? oldTheme : newTheme;
    
    setCurrentTheme(newThemeName);
    setTheme(newThemeData);
    localStorage.setItem('sitzungsmaster-theme', newThemeName);
  };

  const value = {
    theme,
    currentTheme,
    toggleTheme,
    isOldTheme: currentTheme === 'old',
    isNewTheme: currentTheme === 'new'
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