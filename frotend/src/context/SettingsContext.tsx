import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEFAULT_MODEL } from '../constants/models';
import { getApiKeyModel, signOutUser } from '../api/auth';
import { getAccessToken } from '../api/http';

interface SettingsContextType {
  apiKey: string;
  modelName: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setApiKey: (key: string) => void;
  setModelName: (model: string) => void;
  saveSettings: (key?: string, model?: string) => void;
  loadConfigFromApi: () => Promise<void>;
  logout: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState(DEFAULT_MODEL);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));

  const loadConfigFromApi = async () => {
    try {
      const data = await getApiKeyModel();
      if (data.api_key) setApiKey(data.api_key);
      if (data.model_name) setModelName(data.model_name);
    } catch {
      // Unauthenticated or error ignored
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadConfigFromApi();
    }
  }, [isLoggedIn]);

  const saveSettings = (savedApiKey?: string, savedModelName?: string) => {
    if (savedApiKey !== undefined) setApiKey(savedApiKey);
    if (savedModelName) setModelName(savedModelName);
  };

  const logout = () => {
    signOutUser();
    setIsLoggedIn(false);
    setApiKey('');
  };

  return (
    <SettingsContext.Provider
      value={{
        apiKey,
        modelName,
        isLoggedIn,
        setIsLoggedIn,
        setApiKey,
        setModelName,
        saveSettings,
        loadConfigFromApi,
        logout,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
