import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3000/api`;
  return 'http://10.0.2.2:3000/api';
};

/**
 * Creates an authenticated API client bound to the current session.
 * All requests automatically include Authorization + X-Mock-User-Id headers.
 *
 * @param {object|null} session - Session from SessionContext
 * @returns {{ get, post, patch, del }}
 */
export function createApiClient(session, refreshSessionToken = null) {
  const BASE_URL = getApiUrl();

  const buildHeaders = (customSession = session) => {
    const headers = { 'Content-Type': 'application/json' };
    if (customSession?.accessToken) {
      headers['Authorization'] = `Bearer ${customSession.accessToken}`;
    } else {
      // Dev bypass — allows testing without real Supabase tokens
      headers['Authorization'] = 'Bearer mock-token';
    }
    if (customSession?.userId) {
      headers['X-Mock-User-Id'] = customSession.userId;
    }
    return headers;
  };

  const executeRequest = async (url, options) => {
    let res = await fetch(url, options);
    
    // If 401 and we have a refresh function, attempt to refresh and retry
    if (res.status === 401 && refreshSessionToken) {
      const newSession = await refreshSessionToken();
      if (newSession) {
        // Retry with new headers
        options.headers = buildHeaders(newSession);
        res = await fetch(url, options);
      }
    }

    let json;
    try { json = await res.json(); } catch { json = {}; }
    
    if (!res.ok || json.success === false) {
      const err = new Error(json.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    
    return json.data;
  };

  const get = (path, params = {}) => {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
    return executeRequest(url.toString(), { method: 'GET', headers: buildHeaders() });
  };

  const post = (path, body = {}) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

  const patch = (path, body = {}) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

  const del = (path) =>
    executeRequest(`${BASE_URL}${path}`, { method: 'DELETE', headers: buildHeaders() });

  return { get, post, patch, del };
}
