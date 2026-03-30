import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../context/SessionContext';

export function NavigationManager({ children }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Wait until routing segments are populated initially
    if (!segments) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!session) {
      if (!inAuthGroup) {
        // Unauthenticated users trying to access secure pages (or just the root) bounce to welcome
        router.replace('/welcome');
      } else {
        // They are allowed to be on auth pages
        setIsReady(true);
      }
    } else {
      if (inAuthGroup || inRoot) {
        // Authenticated users trying to access login/welcome bounce to their home
        router.replace('/home');
      } else {
        // They are allowed on secure pages
        setIsReady(true);
      }
    }
  }, [session, isLoading, segments, router]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0b66c2" />
      </View>
    );
  }

  return children;
}
