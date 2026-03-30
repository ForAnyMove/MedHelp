import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';

export default function Index() {
  const { session, isLoading } = useSession();

  // Show a loading spinner while restoring the session from storage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If we have a valid session, navigate directly to the right dashboard
  if (session) {
    return <Redirect href="/home" />;
  }

  // No session — show the welcome/auth screen
  return <Redirect href="/(auth)/welcome" />;
}
