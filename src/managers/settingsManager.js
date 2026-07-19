import { useState, useCallback, useEffect } from 'react';
import { createApiClient } from '../api/apiClient';

export default function settingsManager(setAppLoading, session, refreshSessionToken) {
  const [settings, setSettings] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setIsLoading(true);
      const api = createApiClient(session, refreshSessionToken);
      const data = await api.get('/settings');
      setSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, [session, refreshSessionToken]);

  const fetchLanguages = useCallback(async () => {
    try {
      const api = createApiClient(session, refreshSessionToken);
      const data = await api.get('/settings/languages');
      setLanguages(data);
    } catch (e) {
      console.error('Failed to fetch languages:', e);
    }
  }, [session, refreshSessionToken]);

  const updateSettings = useCallback(async (updates) => {
    if (!session?.accessToken) return;
    try {
      setAppLoading(true);
      const api = createApiClient(session, refreshSessionToken);
      const data = await api.put('/settings', updates);
      setSettings(data);
      return { success: true, data };
    } catch (e) {
      console.error('Failed to update settings:', e);
      return { success: false, error: e.message };
    } finally {
      setAppLoading(false);
    }
  }, [session, refreshSessionToken, setAppLoading]);

  // Initial fetch when session is valid
  useEffect(() => {
    if (session?.accessToken) {
      fetchSettings();
      fetchLanguages();
    } else {
      setSettings(null);
    }
  }, [session?.accessToken, fetchSettings, fetchLanguages]);

  return {
    settings,
    languages,
    isLoadingSettings: isLoading,
    fetchSettings,
    fetchLanguages,
    updateSettings
  };
}
