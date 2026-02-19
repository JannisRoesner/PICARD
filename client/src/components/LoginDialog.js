import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginDialog.css';

function LoginDialog({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(password);
    
    setLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setError(result.error || 'Login fehlgeschlagen');
      setPassword('');
    }
  };

  return (
    <div className="login-dialog-overlay">
      <div className="login-dialog">
        <h2>Anmeldung erforderlich</h2>
        <p>Bitte geben Sie das Passwort ein, um fortzufahren.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
              placeholder="Passwort eingeben"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading || !password}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          borderTop: '1px solid #ddd',
          paddingTop: '1rem'
        }}>
          <button
            type="button"
            onClick={() => navigate('/technik')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            ← Zu öffentlichen Bereichen
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginDialog;
