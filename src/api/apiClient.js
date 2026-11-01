import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `http://${hostUri.split(':')[0]}:3000/api`;
    return 'http://10.0.2.2:3000/api';
  }
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.endsWith('/api') ? url : url + '/api';
  return '/api'; // fallback for production web if env is missing
};

// Mutex state for concurrent refresh requests across all API calls
let activeRefreshPromise = null;
let globalTokenRefresher = null;
let currentGlobalSession = null;

/**
 * Registers the current active session globally.
 * Ensures standalone API helpers have access to the latest authentication token.
 */
export function setGlobalCurrentSession(session) {
  currentGlobalSession = session;
}

/**
 * Registers a global token refresher fallback.
 * Allows components calling createApiClient(session) without passing refreshSessionToken
 * to still benefit from automatic token refresh and mutex queuing.
 */
export function setGlobalTokenRefresher(refresher) {
  globalTokenRefresher = refresher;
}

/**
 * Creates an authenticated API client bound to the current session.
 * All requests automatically include Authorization Bearer tokens.
 *
 * @param {object|null} session - Session from SessionContext (or falls back to currentGlobalSession)
 * @param {Function|null} refreshSessionToken - Optional session refresh callback
 * @returns {{ get, post, postForm, patch, put, del }}
 */
export function createApiClient(session = null, refreshSessionToken = null) {
  const BASE_URL = getApiUrl();
  const effectiveSession = session || currentGlobalSession;

  const buildHeaders = (customSession = effectiveSession, isMultipart = false) => {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = customSession?.accessToken || customSession?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const executeRequest = async (url, options) => {
    let res = await fetch(url, options);

    // If 401 and we have a refresh function, queue through mutex and retry
    const refresher = refreshSessionToken || globalTokenRefresher;
    if (res.status === 401 && refresher) {
      if (!activeRefreshPromise) {
        activeRefreshPromise = Promise.resolve(refresher())
          .catch((err) => {
            console.error('[apiClient] Refresh failed:', err);
            return null;
          })
          .finally(() => {
            activeRefreshPromise = null;
          });
      }

      const newSession = await activeRefreshPromise;
      if (newSession) {
        // Retry with fresh session token
        const isMultipart = !options.headers || !options.headers['Content-Type'];
        const updatedHeaders = {
          ...options.headers,
          ...buildHeaders(newSession, isMultipart),
        };
        const retryOptions = {
          ...options,
          headers: updatedHeaders,
          credentials: 'include',
        };
        res = await fetch(url, retryOptions);
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
    // Cache buster for web
    url.searchParams.set('_t', Date.now().toString());
    return executeRequest(url.toString(), { method: 'GET', headers: buildHeaders(), credentials: 'include' });
  };

  const post = (path, body = {}) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

  const postForm = (path, formData) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(session, true),
      credentials: 'include',
      body: formData,
    });

  const patch = (path, body = {}) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

  const put = (path, body = {}) =>
    executeRequest(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });

  const del = (path) =>
    executeRequest(`${BASE_URL}${path}`, { method: 'DELETE', headers: buildHeaders(), credentials: 'include' });

  return { get, post, postForm, patch, put, del };
}

export const apiClient = {
  get: (path, params) => createApiClient().get(path, params),
  post: (path, body) => createApiClient().post(path, body),
  postForm: (path, formData) => createApiClient().postForm(path, formData),
  patch: (path, body) => createApiClient().patch(path, body),
  put: (path, body) => createApiClient().put(path, body),
  del: (path) => createApiClient().del(path),
};
