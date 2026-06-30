import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginDialog from './LoginDialog';

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Lade...
      </div>
    );
  }

  if (!authenticated) {
    return <LoginDialog />;
  }

  return children;
}

export default ProtectedRoute;
