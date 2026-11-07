import { createApiClient, apiClient } from './apiClient';

export const registerDevice = async (token, platform, session = null) => {
  const client = session ? createApiClient(session) : apiClient;
  return client.post('/devices/register', { 
    expo_push_token: token,
    fcm_token: token,
    platform 
  });
};

export const testPushNotification = async (session = null) => {
  const client = session ? createApiClient(session) : apiClient;
  return client.post('/devices/test-push', {});
};
