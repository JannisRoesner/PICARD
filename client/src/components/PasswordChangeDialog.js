import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './PasswordChangeDialog.css';

function PasswordChangeDialog({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 4) {
      setError('Neues Passwort muss mindestens 4 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    const result = await changePassword(currentPassword, newPassword);
    
    setLoading(false);

    if (result.success) {
      setSuccess('Passwort erfolgreich geändert');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Fehler beim Ändern des Passworts');
    }
  };

  return (
    <div className="password-dialog-overlay" onClick={onClose}>
      <div className="password-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="password-dialog-header">
          <h2>Passwort ändern</h2>
          <button className="password-dialog-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="password-form-group">
            <label htmlFor="currentPassword">Aktuelles Passwort:</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="password-form-group">
            <label htmlFor="newPassword">Neues Passwort:</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              minLength={4}
              placeholder="Mindestens 4 Zeichen"
            />
          </div>

          <div className="password-form-group">
            <label htmlFor="confirmPassword">Neues Passwort bestätigen:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={4}
            />
          </div>

          {error && <div className="password-error">{error}</div>}
          {success && <div className="password-success">{success}</div>}

          <div className="password-dialog-buttons">
            <button type="button" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Ändern...' : 'Passwort ändern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordChangeDialog;
