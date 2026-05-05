import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSession } from '../SessionContext';

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

        // 1. Init Stream Video for Web
        vClient = new StreamVideoClient({
          apiKey,
          user,
          tokenProvider,
        });
        if (isMounted) setVideoClient(vClient);

        // 2. Init Chat Client
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
          
          if (cClient.userID !== user.id) {
            if (cClient.userID) {
              await cClient.disconnectUser();
            }
            await cClient.connectUser(user, data.data.chatToken);
          }
          if (isMounted) setChatClient(cClient);
        }

      } catch (error) {
        console.error("Error setting up Stream Clients for Web:", error);
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
