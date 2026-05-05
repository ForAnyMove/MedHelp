import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0b66c2" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!session.onboarded) {
    return <Redirect href={session.role === 'doctor' ? '/(auth)/doctor-upload' : '/(auth)/patient-onboarding'} />;
  }

  return <Redirect href="/home" />;
}
