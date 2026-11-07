import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSession } from './SessionContext';
import { registerDevice } from '../api/devicesApi';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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
          targetUrl = `/history?openHistoryId=${data.reference_id}`;
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
    if (Platform.OS === 'web') return;

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
    const userId = session?.userId || session?.user?.id;
    if (userId && expoPushToken) {
      registerDevice(expoPushToken, Platform.OS, session).catch(err => {
        console.error('Failed to register device push token:', err);
      });
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
  let token = null;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Общие уведомления',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Сообщения чата',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    } catch (e) {
      console.warn('[NotificationContext] setNotificationChannelAsync failed:', e?.message);
    }
  }

  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[NotificationContext] Push notification permission not granted');
      return null;
    }

    // 1. Try native FCM device push token (for Firebase Cloud Messaging direct delivery)
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      if (deviceTokenData?.data) {
        token = deviceTokenData.data;
        console.log('[NotificationContext] Acquired native FCM push token:', token);
      }
    } catch (fcmErr) {
      // In Expo Go or when native FCM is not linked, fallback to Expo Push API
    }

    // 2. If no FCM token, try Expo push token
    if (!token) {
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const expoTokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        token = expoTokenData?.data;
        console.log('[NotificationContext] Acquired Expo push token:', token);
      } catch (expoErr) {
        console.log('[NotificationContext] Expo push token not available:', expoErr?.message);
      }
    }
  } catch (err) {
    console.warn('[NotificationContext] Error in registerForPushNotificationsAsync:', err?.message);
  }

  return token;
}

