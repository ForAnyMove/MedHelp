import { createApiClient, apiClient } from './apiClient';

export const registerDevice = async (expoPushToken, platform, session = null) => {
  const client = session ? createApiClient(session) : apiClient;
  return client.post('/devices/register', { 
    expo_push_token: expoPushToken, 
    platform 
  });
};
