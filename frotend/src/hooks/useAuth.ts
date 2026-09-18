import { useState } from 'react';
import { signInUser, signUpUser } from '../api/auth';
import { useSettings } from '../context/SettingsContext';
import type { AuthPayload } from '../types/website';

export function useAuth() {
  const { isLoggedIn, setIsLoggedIn, loadConfigFromApi, logout } = useSettings();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (payload: AuthPayload) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await signUpUser(payload);
      setMessage(res.message || 'Account created successfully! Please sign in.');
      return true;
    } catch (err) {
      setMessage((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (payload: AuthPayload) => {
    setLoading(true);
    setMessage('');
    try {
      await signInUser(payload);
      setIsLoggedIn(true);
      setMessage('Signed in successfully!');
      await loadConfigFromApi();
      return true;
    } catch (err) {
      setMessage((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    setMessage('Signed out.');
  };

  return {
    isLoggedIn,
    loading,
    message,
    setMessage,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
