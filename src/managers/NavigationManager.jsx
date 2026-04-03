import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../context/SessionContext';

const ONBOARDING_SCREENS = ['patient-onboarding', 'doctor-upload', 'doctor-pending'];

export function NavigationManager({ children }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until session is restored from storage
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[segments.length - 1];
    const isOnboarding = inAuthGroup && ONBOARDING_SCREENS.includes(currentScreen);
    const isApp = segments[0] === '[tab]'; // user is on a dashboard tab
    const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!session) {
      // Not logged in — must be on an auth screen
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
        return;
      }
    } else if (!session.onboarded) {
      // Logged in but hasn't completed onboarding
      if (!isOnboarding) {
        const dest = session.role === 'doctor' ? '/(auth)/doctor-upload' : '/(auth)/patient-onboarding';
        router.replace(dest);
        return;
      }
    } else {
      // Logged in AND onboarded — should be in the app
      if (inAuthGroup || isRoot) {
        router.replace('/home');
        return;
      }
    }

    // If we reach here, the user is already where they belong
    setIsReady(true);
  }, [session, isLoading, segments]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0b66c2" />
      </View>
    );
  }

  return children;
}
