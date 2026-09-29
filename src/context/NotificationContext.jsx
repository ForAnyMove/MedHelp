import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSession } from './SessionContext';
import { registerDevice } from '../api/devicesApi';
import { supabase } from '../api/apiClient'; // or wherever supabase is exported. Let's assume there's a supabase client in utils or apiClient.

// We will use standard fetch for supabase if it's not exported. Wait, I should import supabase from the right place.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const { session } = useSession();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const notificationListener = useRef();
  const responseListener = useRef();
  const [pendingRoute, setPendingRoute] = useState(null);
  const [isHandlingNotification, setIsHandlingNotification] = useState(false);

  const handleResponse = (response) => {
    setIsHandlingNotification(true);
    DeviceEventEmitter.emit('reload_notifications');
    console.log('User interacted with notification:', response);
    const data = response.notification.request.content.data;
    let targetUrl = data?.url;
    if (!targetUrl && data?.type) {
       if (data.type.includes('appointment') || data.type === 'consultation_started' || data.type === 'completed_consultation') {
          targetUrl = session?.role === 'doctor' 
             ? `/(doctor)?tab=history&openHistoryId=${data.reference_id}`
             : `/(patient)?tab=history&openHistoryId=${data.reference_id}`;
       } else if (data.type.includes('lab')) {
          targetUrl = `/lab-result/${data.reference_id}`;
       } else if (data.type.includes('message')) {
          targetUrl = `/chat/${data.reference_id}`;
       } else if (data.type === 'owner_join_request' || data.action === 'open_requests') {
          targetUrl = '/doctors?view=requests';
       }
    }

    // Parse deep link url or screen from notification data
    if (targetUrl) {
      if (targetUrl.startsWith('/')) {
        setPendingRoute(targetUrl);
      } else {
        try {
          const parsed = Linking.parse(targetUrl);
          let finalRoute = targetUrl;
          if (parsed.hostname) {
            const routePath = parsed.path ? `/${parsed.path}` : '';
            // We should ideally append query params if they exist, but simple relative routes are better
            finalRoute = `/${parsed.hostname}${routePath}`;
          }
          setPendingRoute(finalRoute);
        } catch (e) {
          setPendingRoute(targetUrl);
        }
      }
    } else {
      setIsHandlingNotification(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response && response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          handleResponse(response);
        }
      }).catch(err => console.warn('getLastNotificationResponseAsync error:', err));
    }
  }, [handleResponse]);

  useEffect(() => {
    if (pendingRoute && navigationState?.key && session?.role) {
      router.push(pendingRoute);
      setPendingRoute(null);
      setTimeout(() => setIsHandlingNotification(false), 1000);
    }
  }, [pendingRoute, navigationState?.key, session?.role]);

  const handleResponseRef = useRef(handleResponse);
  useEffect(() => {
    handleResponseRef.current = handleResponse;
  });

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      DeviceEventEmitter.emit('reload_notifications');
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (handleResponseRef.current) {
        handleResponseRef.current(response);
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id && expoPushToken) {
      registerDevice(expoPushToken, Platform.OS).catch(err => {
        console.error('Failed to register device push token:', err);
      });
      
      // The realtime subscription is handled here if needed, but for now we focus on Expo push token registration
    }
  }, [session, expoPushToken]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, isHandlingNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: /* TODO: color */ '#FF231F7C',
    });
  }

  if (Device.isDevice || Platform.OS === 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    if (Platform.OS === 'web') {
      return null; // Skip Expo Push Token on web to avoid VAPID error, but permissions are granted for local notifications
    }

    // We can get projectId from Constants if we use EAS build
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
