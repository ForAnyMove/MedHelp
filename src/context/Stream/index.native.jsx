import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { StreamChat } from 'stream-chat';
import { useSession } from '../SessionContext';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const StreamContext = createContext(null);

const getApiUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.endsWith('/api') ? url : url + '/api';
  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `http://${hostUri.split(':')[0]}:3000/api`;
    return 'http://10.0.2.2:3000/api';
  }
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
    // Only init if we have a valid logged in session with an ID that we can pass to Stream
    if (!session || !session.userId) return;

    let vClient = null;
    let cClient = null;

    const setupStream = async () => {
      try {
        const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
          console.error("Missing EXPO_PUBLIC_STREAM_API_KEY");
          return;
        }

        const fetchStreamTokens = async () => {
          const makeRequest = async (token) => {
            return fetch(`${API_URL}/stream/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || 'mock-token'}`,
                'X-Mock-User-Id': sessionRef.current?.userId || session.userId,
              },
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

        // Token provider function called by the Video Client
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

        // 1. Init Stream Video
        vClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider,
        });
        setVideoClient(vClient);

        // 2. Init Chat Client
        try {
          const chatTokenProvider = async () => {
            const data = await fetchStreamTokens();
            return data.chatToken;
          };

          cClient = StreamChat.getInstance(apiKey);
          await cClient.connectUser(user, chatTokenProvider);
          setChatClient(cClient);
        } catch (chatErr) {
          console.warn("Could not connect Stream Chat client:", chatErr?.message || chatErr);
        }

      } catch (error) {
        console.warn("Error setting up Stream Clients:", error?.message || error);
      }
    };

    setupStream();

    return () => {
      if (vClient) {
        vClient.disconnectUser();
        setVideoClient(null);
      }
      if (cClient) {
        cClient.disconnectUser();
        setChatClient(null);
      }
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
