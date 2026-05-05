// Web stub — native push notifications are not supported in browsers via expo-notifications
export function usePushNotifications() {
  return { expoPushToken: null, permissionGranted: false };
}
