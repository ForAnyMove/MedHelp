import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';
import { useTheme } from '../src/theme/ThemeContext';
import TabScreen from './[tab]';

export default function Index() {
  const { session, isLoading } = useSession();
  const { colors } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const search = window.location.search || '';
      const params = new URLSearchParams(search);
      const tabParam = params.get('tab') || 'home';
      if (window.location.pathname === '/' || window.location.pathname === '') {
        params.delete('tab');
        const remaining = params.toString() ? `?${params.toString()}` : '';
        const cleanUrl = `/${tabParam}${remaining}`;
        const existingState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
        window.history.replaceState(existingState, '', cleanUrl);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  // On Web, render TabScreen directly without any white-screen redirect flicker or loader
  if (session && session.isRegistered) {
    if (Platform.OS === 'web') {
      return <TabScreen />;
    }
    return <Redirect href="/home" />;
  }

  return null;
}
