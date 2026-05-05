import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { allImages } from '../assets';

const SESSION_KEY = 'medhelp_session';

const SessionContext = createContext(null);

// ---- API auth helpers ----
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000/api';

  // Try to use the local IPv4 address exposed by Expo for physical dev devices
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000/api`;
  }
  return 'http://10.0.2.2:3000/api'; // Android emulator fallback
};

const API_URL = getApiUrl();

// ---- Storage helpers ----

async function loadSessionFromStorage() {
  try {
    let raw;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveSessionToStorage(session) {
  try {
    const serialized = JSON.stringify(session);
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, serialized);
    }
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

async function clearSessionFromStorage() {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

// ---- Provider ----

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  // Unified loading state
  const isLoading = !isSessionLoaded || !isAssetsLoaded;

  // Restore session and preload assets on app start
  useEffect(() => {
    async function prepare() {
      try {
        // 1. Load session
        const saved = await loadSessionFromStorage();
        if (saved) {
          setSession(saved);
        }
        setIsSessionLoaded(true);

        // 2. Preload images
        await Asset.loadAsync(allImages);
        setIsAssetsLoaded(true);
      } catch (e) {
        console.warn('Error during initialization:', e);
        // Ensure we don't get stuck in loading state even if assets fail
        setIsSessionLoaded(true);
        setIsAssetsLoaded(true);
      }
    }

    prepare();
  }, []);

  /**
   * Call after successful OTP verification.
   * Saves session to storage and updates state.
   */
  const login = useCallback(async (sessionData) => {
    setSession(sessionData);
    await saveSessionToStorage(sessionData);
  }, []);

  /**
   * Sign out: clears storage and session state.
   * The consuming component is responsible for navigating to auth screen.
   */
  const logout = useCallback(async () => {
    setSession(null);
    await clearSessionFromStorage();
  }, []);

  /**
   * Запрос на отправку OTP через наш Express API сервер.
   */
  const sendOtp = useCallback(async (contact) => {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact })
      });
      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (e) {
      console.error('Send OTP error:', e);
      return { success: false, error: 'Failed to connect to the server' };
    }
  }, []);

  /**
   * Верификация OTP через наш Express API сервер.
   */
  const verifyOtp = useCallback(async (contact, code, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact, code, role })
      });
      const json = await response.json();
      if (json.success && json.data?.session) {
        await login(json.data.session);
        return { success: true, session: json.data.session };
      }
      return { success: false, error: json.error || 'Invalid code' };
    } catch (e) {
      console.error('Verify OTP error:', e);
      return { success: false, error: 'Failed to verify code' };
    }
  }, [login]);

  /**
   * Update current session data (e.g. mark as onboarded).
   */
  const updateSession = useCallback(async (newData) => {
    setSession(prev => {
      const updated = { ...prev, ...newData };
      saveSessionToStorage(updated).catch(e => console.error('Storage save error:', e));
      return updated;
    });
  }, []);

  const registerProfile = useCallback(async (firstName, lastName, professionCode) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ 
          first_name: firstName, 
          last_name: lastName,
          profession_code: professionCode 
        })
      });
      const json = await response.json();
      if (json.success && json.data) {
        await updateSession({ 
          isRegistered: json.data.isRegistered, 
          firstName: json.data.firstName,
          lastName: json.data.lastName,
          avatarUrl: json.data.avatarUrl,
          role: json.data.role,
          professionCode: json.data.professionCode
        });
        return { success: true };
      }
      return { success: false, error: json.error || 'Failed to update profile' };
    } catch (e) {
      console.error('Update profile error:', e);
      return { success: false, error: 'Network error' };
    }
  }, [session?.accessToken, updateSession]);

  const getProfessions = useCallback(async (lang = 'ru') => {
    try {
      const response = await fetch(`${API_URL}/professions?lang=${lang}`);
      const json = await response.json();
      return json.data || [];
    } catch (e) {
      console.error('Fetch professions error:', e);
      return [];
    }
  }, []);

  return (
    <SessionContext.Provider value={{ 
      session, 
      isLoading, 
      login, 
      logout, 
      sendOtp, 
      verifyOtp, 
      updateSession, 
      registerProfile,
      getProfessions
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
