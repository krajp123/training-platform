import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { clearAdminToken, getAdminToken, setAdminToken } from './adminSession.js';

export function useAdminSession() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    const handleExpiredSession = () => {
      setAuthenticated(false);
      setAuthMessage('Your admin session has expired. Please sign in again.');
    };
    window.addEventListener('admin-session-expired', handleExpiredSession);

    const token = getAdminToken();
    if (!token) {
      setCheckingSession(false);
      return () => window.removeEventListener('admin-session-expired', handleExpiredSession);
    }

    apiRequest('/api/admin-auth/me')
      .then(() => setAuthenticated(true))
      .catch((error) => {
        if (error.status === 401) {
          clearAdminToken();
        } else {
          setAuthMessage(`Could not verify your admin session: ${error.message}`);
        }
      })
      .finally(() => setCheckingSession(false));

    return () => window.removeEventListener('admin-session-expired', handleExpiredSession);
  }, []);

  const signIn = useCallback((token) => {
    setAdminToken(token);
    setAuthMessage('');
    setAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest('/api/admin-auth/logout', { method: 'POST' });
      setAuthMessage('');
    } catch (error) {
      setAuthMessage(`Sign-out could not be confirmed: ${error.message}`);
    } finally {
      clearAdminToken();
      setAuthenticated(false);
    }
  }, []);

  return {
    authenticated,
    authMessage,
    checkingSession,
    signIn,
    signOut,
  };
}
