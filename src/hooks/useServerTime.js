import { useState, useEffect } from 'react';
import { createApiClient } from '../api/apiClient';

let serverOffset = 0; // ms: serverTime - clientTime
let isSynced = false;

/**
 * Hook to get the current server time synchronized.
 */
export function useServerTimeSync(session, refreshSessionToken) {
  useEffect(() => {
    if (isSynced) return;
    
    const apiClient = createApiClient(session, refreshSessionToken);
    apiClient.get('/common/time')
      .then(res => {
        const serverTime = res.timestamp;
        const clientTime = Date.now();
        serverOffset = serverTime - clientTime;
        isSynced = true;
      })
      .catch(err => console.error('[useServerTimeSync] Sync failed:', err));
  }, [session, refreshSessionToken]);

  return {
    getServerTime: () => new Date(Date.now() + serverOffset),
    isSynced
  };
}

/**
 * Returns estimated server date.
 */
export const getEstimatedServerDate = () => new Date(Date.now() + serverOffset);
