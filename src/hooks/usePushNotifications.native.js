import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatNotifications } from '../context/ChatNotificationContext';
import i18n from '../locales/i18n';

// Removed local setNotificationHandler, now handled centrally in NotificationContext.jsx

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const router = useRouter();
  const { setPendingChannelId } = useChatNotifications();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        setPermissionGranted(true);
      }
    });

    // Fired when a notification is received while app is in foreground (handled via NotificationContext)
    // Fired when user taps a notification (app in background/closed) handled via NotificationContext
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
      name: i18n.t('actions.messages', 'Сообщения'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.p500,
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
