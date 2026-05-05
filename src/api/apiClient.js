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
export function createApiClient(session) {
  const BASE_URL = getApiUrl();

  const buildHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    } else {
      // Dev bypass — allows testing without real Supabase tokens
      headers['Authorization'] = 'Bearer mock-token';
    }
    if (session?.userId) {
      headers['X-Mock-User-Id'] = session.userId;
    }
    return headers;
  };

  const handleResponse = async (res) => {
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
    return fetch(url.toString(), { method: 'GET', headers: buildHeaders() }).then(handleResponse);
  };

  const post = (path, body = {}) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse);

  const patch = (path, body = {}) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse);

  const del = (path) =>
    fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: buildHeaders() }).then(handleResponse);

  return { get, post, patch, del };
}
