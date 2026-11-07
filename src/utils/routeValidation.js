import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useNavigation } from 'expo-router';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a route parameter is a valid UUID v1-v8.
 */
export function isValidRouteUUID(value) {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

/**
 * Validates a route parameter (non-empty and not literal 'undefined'/'null').
 */
export function isValidRouteParam(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== 'undefined' && trimmed !== 'null';
}

/**
 * Hook that guards a screen with unsaved form changes against accidental back navigation
 * (browser unload on web + React Navigation `beforeRemove` on iOS/Android/Web).
 */
export function useUnsavedChangesGuard(isDirty, options = {}) {
  const navigation = useNavigation();
  const title = options.title || 'Unsaved changes';
  const message = options.message || 'You have unsaved changes. Are you sure you want to leave?';
  const stayLabel = options.stayLabel || 'Stay';
  const leaveLabel = options.leaveLabel || 'Leave';

  useEffect(() => {
    if (!isDirty || !navigation?.addListener) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;

      e.preventDefault();

      if (Platform.OS === 'web') {
        if (window.confirm(message)) {
          navigation.dispatch(e.data.action);
        }
      } else {
        Alert.alert(title, message, [
          { text: stayLabel, style: 'cancel', onPress: () => {} },
          {
            text: leaveLabel,
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]);
      }
    });

    return unsubscribe;
  }, [isDirty, navigation, title, message, stayLabel, leaveLabel]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);
}

