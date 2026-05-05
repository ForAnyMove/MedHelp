import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { StreamChat } from 'stream-chat';
import { useSession } from '../SessionContext';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const StreamContext = createContext(null);

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000/api`;
  }
  return 'http://10.0.2.2:3000/api';
};

const API_URL = getApiUrl();

export function StreamProvider({ children }) {
  const { session } = useSession();
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

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

        // Token provider function called by the Video Client
        const tokenProvider = async () => {
          const res = await fetch(`${API_URL}/stream/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.accessToken || 'mock-token'}`,
              'X-Mock-User-Id': session.userId,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch stream token');
          const data = await res.json();
          return data.data.videoToken;
        };

        const userName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';
        const user = {
          id: session.userId,
          name: userName,
        };

        // 1. Init Stream Video
        vClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider,
        });
        setVideoClient(vClient);

        // 2. Fetch tokens manually once for Stream Chat initialization
        const res = await fetch(`${API_URL}/stream/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken || 'mock-token'}`,
            'X-Mock-User-Id': session.userId,
          },
        });
        if (res.ok) {
          const data = await res.json();
          cClient = StreamChat.getInstance(apiKey);
          await cClient.connectUser(user, data.data.chatToken);
          setChatClient(cClient);
        }

      } catch (error) {
        console.error("Error setting up Stream Clients:", error);
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
