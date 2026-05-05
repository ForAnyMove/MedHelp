import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatNotifications } from '../context/ChatNotificationContext';

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // We handle foreground ourselves with toasts
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const router = useRouter();
  const { setPendingChannelId } = useChatNotifications();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        setPermissionGranted(true);
      }
    });

    // Fired when a notification is received while app is in foreground (we show our own toast)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Intentionally empty: foreground notifications are handled via Stream events + our toasts
    });

    // Fired when user taps a notification (app in background/closed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.channelId) {
        setPendingChannelId(data.channelId);
        router.push('/(chat)/list');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, permissionGranted };
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('[PushNotifications] Must use physical device for push notifications');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat-messages', {
      name: 'Сообщения',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#23D3C2',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    console.log('[PushNotifications] Could not get push token:', e);
    return null;
  }
}

/**
 * Schedule a local push notification when a new chat message arrives
 * and the app is in the background.
 */
export async function scheduleMessageNotification({ title, body, channelId }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { channelId },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (e) {
    console.log('[PushNotifications] Failed to schedule notification:', e);
  }
}
