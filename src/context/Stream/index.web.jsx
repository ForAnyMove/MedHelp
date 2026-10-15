import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSession } from '../SessionContext';

const StreamContext = createContext(null);

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `http://${hostUri.split(':')[0]}:3000/api`;
    return 'http://10.0.2.2:3000/api';
  }
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.endsWith('/api') ? url : url + '/api';
  return '/api';
};


const API_URL = getApiUrl();

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

    const setupStream = async () => {
      try {
        const fetchStreamTokens = async () => {
          const makeRequest = async (token) => {
            const headers = {
              'Content-Type': 'application/json',
              'X-Mock-User-Id': sessionRef.current?.userId || session.userId,
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            return fetch(`${API_URL}/stream/token`, {
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
        };

        const tokenProvider = async () => {
          const data = await fetchStreamTokens();
          return data.videoToken;
        };

        const userName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';
        const user = {
          id: session.userId,
          name: userName,
          image: session.avatarUrl || undefined,
        };

        // 1. Init Stream Video for Web
        vClient = new StreamVideoClient({
          apiKey,
          user,
          tokenProvider,
        });
        if (isMounted) setVideoClient(vClient);

        // 2. Init Chat Client
        try {
          const chatTokenProvider = async () => {
            const data = await fetchStreamTokens();
            return data.chatToken;
          };

          if (cClient.userID !== user.id) {
            if (cClient.userID) {
              await cClient.disconnectUser();
            }
            await cClient.connectUser(user, chatTokenProvider);
          }
          if (isMounted) setChatClient(cClient);
        } catch (chatError) {
          console.warn("Could not connect Stream Chat client:", chatError?.message || chatError);
        }

      } catch (error) {
        console.warn("Error setting up Stream Clients for Web:", error?.message || error);
      }
    };

    setupStream();

    const handleBeforeUnload = () => {
      if (cClient) {
        cClient.disconnectUser();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Important: We do not disconnect stream on simple unmount to support hot-reloading cleanly.
      // Disconnect only happens if session logs out (handled above) or tab closes (beforeunload).
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
