import { apiClient } from './apiClient';

export const registerDevice = async (expoPushToken, platform) => {
  return apiClient.post('/devices/register', { 
    expo_push_token: expoPushToken, 
    platform 
  });
};
