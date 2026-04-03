import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { allImages } from '../assets';

const SESSION_KEY = 'medhelp_session';

const SessionContext = createContext(null);

// ---- Mock auth helpers ----
// Replace these with real Supabase calls in the future

async function mockSignInWithOtp(contact) {
  // Simulate sending OTP
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true };
}

async function mockVerifyOtp(contact, code, role) {
  // Simulate verifying OTP — Accept any 6-digit code for now
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (code.length === 6) {
    return {
      success: true,
      session: {
        userId: role === 'doctor' ? 'd1' : 'p1',
        role,
        accessToken: `mock_token_${Date.now()}`,
        email: contact,
        onboarded: false, // New users are not onboarded by default
      }
    };
  }
  return { success: false, error: 'Invalid code' };
}

// ---- Storage helpers ----

async function loadSessionFromStorage() {
  try {
    let raw;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await AsyncStorage.getItem(SESSION_KEY);
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
      await AsyncStorage.setItem(SESSION_KEY, serialized);
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
      await AsyncStorage.removeItem(SESSION_KEY);
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
   * Simulate sending OTP to the provided contact (email/phone).
   * Replace with supabase.auth.signInWithOtp() in production.
   */
  const sendOtp = useCallback(async (contact) => {
    return await mockSignInWithOtp(contact);
  }, []);

  /**
   * Simulate verifying OTP code.
   * Replace with supabase.auth.verifyOtp() in production.
   */
  const verifyOtp = useCallback(async (contact, code, role) => {
    const result = await mockVerifyOtp(contact, code, role);
    if (result.success) {
      await login(result.session);
    }
    return result;
  }, [login]);

  /**
   * Update current session data (e.g. mark as onboarded).
   */
  const updateSession = useCallback(async (newData) => {
    const updated = { ...session, ...newData };
    setSession(updated);
    await saveSessionToStorage(updated);
  }, [session]);

  return (
    <SessionContext.Provider value={{ session, isLoading, login, logout, sendOtp, verifyOtp, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
