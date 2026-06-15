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

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000/api`;
  }
  return 'http://10.0.2.2:3000/api';
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

let refreshPromise = null;

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  // In-memory flag: true after user has dealt with doc-upload this session.
  // NOT persisted — resets on app restart / re-login.
  // This prevents NavigationManager from looping back to doc-upload
  // after the user skips/submits (since status may remain 'skipped').
  const [docUploadHandledThisSession, setDocUploadHandledThisSession] = useState(false);

  const isLoading = !isSessionLoaded || !isAssetsLoaded;

  useEffect(() => {
    async function prepare() {
      try {
        const saved = await loadSessionFromStorage();
        if (saved) {
          setSession(saved);
        }
        setIsSessionLoaded(true);

        await Asset.loadAsync(allImages);
        setIsAssetsLoaded(true);
      } catch (e) {
        console.warn('Error during initialization:', e);
        setIsSessionLoaded(true);
        setIsAssetsLoaded(true);
      }
    }

    prepare();
  }, []);

  /**
   * Call after successful OTP verification.
   */
  const login = useCallback(async (sessionData) => {
    setSession(sessionData);
    setDocUploadHandledThisSession(false); // Reset on new login
    await saveSessionToStorage(sessionData);
  }, []);

  /**
   * Sign out.
   */
  const logout = useCallback(async () => {
    setSession(null);
    setDocUploadHandledThisSession(false);
    await clearSessionFromStorage();
  }, []);

  /**
   * Mark doc-upload as handled for this app session.
   * Called after the user skips or submits docs from doc-upload screen.
   */
  const markDocUploadHandled = useCallback(() => {
    setDocUploadHandledThisSession(true);
  }, []);

  /**
   * Refresh the user's session using the refresh token.
   * Prevents concurrent refresh requests using a module-level promise.
   */
  const refreshSessionToken = useCallback(async () => {
    if (!session?.refreshToken) {
      await logout();
      return null;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken })
        });
        const json = await response.json();
        if (json.success && json.data?.session) {
          await login(json.data.session);
          return json.data.session;
        } else {
          await logout();
          return null;
        }
      } catch (e) {
        console.error('Refresh token error:', e);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }, [session?.refreshToken, login, logout]);

  /**
   * Send OTP via Express API.
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
   * Verify OTP — role is NOT passed here anymore.
   * Role is assigned on the choose-role screen via setRole().
   */
  const verifyOtp = useCallback(async (contact, code) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact, code })
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
   * Set role for a new user (called from choose-role screen).
   */
  const setRole = useCallback(async (role) => {
    try {
      const response = await fetch(`${API_URL}/auth/set-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ role })
      });
      const json = await response.json();
      if (json.success && json.data?.role) {
        await updateSession({ role: json.data.role });
        return { success: true };
      }
      return { success: false, error: json.error || 'Failed to set role' };
    } catch (e) {
      console.error('Set role error:', e);
      return { success: false, error: 'Network error' };
    }
  }, [session?.accessToken]);

  /**
   * Update current session data.
   */
  const updateSession = useCallback(async (newData) => {
    setSession(prev => {
      const updated = { ...prev, ...newData };
      saveSessionToStorage(updated).catch(e => console.error('Storage save error:', e));
      return updated;
    });
  }, []);

  /**
   * Register profile (called from profile-setup screen).
   * Accepts fullName, phone, dateOfBirth, gender, professionCodes (array for doctors).
   */
  const registerProfile = useCallback(async ({
    fullName,
    phone,
    dateOfBirth,
    gender,
    professionCodes,  // string[] — for doctors, list of specialization codes
    professionNames,  // string[] — display names for specializations (stored locally)
  }) => {
    try {
      // Split full name into first_name / last_name
      const parts = (fullName || '').trim().split(/\s+/);
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          first_name,
          last_name,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          profession_codes: professionCodes || [],
          // Legacy single code for backward compat
          profession_code: professionCodes?.[0] || null,
        })
      });
      const json = await response.json();
      if (json.success && json.data) {
        // Reset doc-upload flag when re-submitting profile
        // (user may have gone back and changed specializations)
        setDocUploadHandledThisSession(false);

        await updateSession({
          isRegistered: json.data.isRegistered,
          firstName: json.data.firstName,
          lastName: json.data.lastName,
          avatarUrl: json.data.avatarUrl,
          role: json.data.role,
          professionCodes: json.data.professionCodes || professionCodes || [],
          professionNames: professionNames || [],
          // Store form data for pre-filling on back navigation
          phone: phone || null,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          // Reset doc status to 'none' since profile was re-submitted
          // (specializations may have changed → old docs are invalid)
          docVerificationStatus: 'none',
        });
        return { success: true };
      }
      return { success: false, error: json.error || 'Failed to update profile' };
    } catch (e) {
      console.error('Update profile error:', e);
      return { success: false, error: 'Network error' };
    }
  }, [session?.accessToken, updateSession]);

  /**
   * Update doctor's document verification status.
   * status: 'skipped' | 'pending'
   */
  const updateDocStatus = useCallback(async (status) => {
    try {
      const response = await fetch(`${API_URL}/auth/doc-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ status })
      });
      const json = await response.json();
      if (json.success && json.data?.docVerificationStatus) {
        await updateSession({ docVerificationStatus: json.data.docVerificationStatus });
        return { success: true };
      }
      return { success: false, error: json.error || 'Failed to update doc status' };
    } catch (e) {
      console.error('updateDocStatus error:', e);
      // Still update locally even if network fails (optimistic update)
      await updateSession({ docVerificationStatus: status });
      return { success: true };
    }
  }, [session?.accessToken, updateSession]);

  /**
   * Fetch professions list for doctor specialization.
   */
  const getProfessions = useCallback(async (lang = 'en') => {
    try {
      const response = await fetch(`${API_URL}/professions?lang=${lang}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (e) {
      console.error('getProfessions failed:', e);
      return [];
    }
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      isLoading,
      docUploadHandledThisSession,
      login,
      logout,
      sendOtp,
      verifyOtp,
      setRole,
      updateSession,
      registerProfile,
      updateDocStatus,
      markDocUploadHandled,
      refreshSessionToken,
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
