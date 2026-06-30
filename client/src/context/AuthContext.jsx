import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      setAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Auth-Status-Check fehlgeschlagen:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (password) => {
    try {
      await axios.post('/api/auth/login', { password });
      setAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login fehlgeschlagen' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      return { success: false };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post('/api/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Passwort-Änderung fehlgeschlagen'
      };
    }
  };

  const value = {
    authenticated,
    loading,
    login,
    logout,
    changePassword,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
