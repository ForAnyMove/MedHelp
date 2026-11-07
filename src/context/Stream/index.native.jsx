import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { StreamChat } from 'stream-chat';
import { useSession } from '../SessionContext';
import { Platform } from 'react-native';
import { getApiUrl } from '../../api/apiClient';

const StreamContext = createContext(null);

export function StreamProvider({ children }) {
  const { session, refreshSessionToken } = useSession();
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Keep a ref to the latest session to avoid stale closures in tokenProvider
  const sessionRef = React.useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error("Missing EXPO_PUBLIC_STREAM_API_KEY");
      return;
    }

    // Only init if we have a valid logged in session
    if (!session || !session.userId) {
      if (chatClient) {
        chatClient.disconnectUser().catch(() => {}).finally(() => setChatClient(null));
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(() => {}).finally(() => setVideoClient(null));
      }
      return;
    }

    let isMounted = true;
    let vClient = null;
    let cClient = StreamChat.getInstance(apiKey);

    let pendingTokensPromise = null;

    const setupStream = async () => {
      try {
        const fetchStreamTokens = async () => {
          if (pendingTokensPromise) return pendingTokensPromise;

          pendingTokensPromise = (async () => {
            const makeRequest = async (token) => {
              const headers = {
                'Content-Type': 'application/json',
              };
              if (token) {
                headers['Authorization'] = `Bearer ${token}`;
              }

              const apiUrl = getApiUrl();
              return fetch(`${apiUrl}/stream/token`, {
                method: 'POST',
                credentials: 'include',
                headers,
              });
            };

            let currentToken = sessionRef.current?.accessToken || session.accessToken;
            let res = await makeRequest(currentToken);

            if (res.status === 401 && refreshSessionToken) {
              const refreshed = await refreshSessionToken();
              if (refreshed?.accessToken) {
                res = await makeRequest(refreshed.accessToken);
              }
            }

            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || `Failed to fetch stream token (${res.status})`);
            }

            const data = await res.json();
            return data.data;
          })();

          try {
            return await pendingTokensPromise;
          } finally {
            // Keep token cached briefly to prevent simultaneous duplicate requests
            setTimeout(() => {
              pendingTokensPromise = null;
            }, 5000);
          }
        };

        const userName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';
        const user = {
          id: session.userId,
          name: userName,
          image: session.avatarUrl || undefined,
        };

        // 1. Init Stream Video
        try {
          const videoTokenProvider = async () => {
            try {
              const data = await fetchStreamTokens();
              return data.videoToken;
            } catch (err) {
              console.warn('[StreamContext] Failed to get video token:', err?.message || err);
              throw err;
            }
          };

          vClient = StreamVideoClient.getOrCreateInstance({
            apiKey,
            user,
            tokenProvider: videoTokenProvider,
          });
          if (isMounted) setVideoClient(vClient);
        } catch (videoErr) {
          console.warn("Could not connect Stream Video client (video calls require custom dev build on native):", videoErr?.message || videoErr);
        }

        // 2. Init Chat Client
        try {
          const chatTokenProvider = async () => {
            try {
              const data = await fetchStreamTokens();
              return data.chatToken;
            } catch (err) {
              console.warn('[StreamContext] Failed to get chat token:', err?.message || err);
              throw err;
            }
          };

          if (cClient.userID !== user.id) {
            if (cClient.userID) {
              await cClient.disconnectUser().catch(() => {});
            }
            await cClient.connectUser(user, chatTokenProvider);
          }

          // Register device push token with Stream Chat for background messaging (FCM)
          try {
            if (Platform.OS === 'android') {
              const Notifications = require('expo-notifications');
              const deviceTokenData = await Notifications.getDevicePushTokenAsync().catch(() => null);
              if (deviceTokenData?.data && typeof cClient.addDevice === 'function') {
                await cClient.addDevice(deviceTokenData.data, 'firebase').catch(() => {});
                console.log('[StreamContext] Registered FCM device with Stream Chat');
              }
            }
          } catch (deviceErr) {
            console.log('[StreamContext] Stream Chat addDevice optional note:', deviceErr?.message);
          }

          if (isMounted) setChatClient(cClient);
        } catch (chatErr) {
          console.warn("Could not connect Stream Chat client:", chatErr?.message || chatErr);
        }

      } catch (error) {
        console.warn("Error setting up Stream Clients:", error?.message || error);
      }
    };

    setupStream();

    return () => {
      isMounted = false;
      // Important: We do not disconnect stream on simple unmount to support hot-reloading cleanly.
      // Disconnect only happens if session logs out (handled above).
    };
  }, [session?.userId]);

  return (
    <StreamContext.Provider value={{ 
      videoClient, 
      chatClient, 
      activeCall, 
      setActiveCall, 
      isMinimized, 
      setIsMinimized 
    }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStreamContext() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within a StreamProvider');
  }
  return context;
}
