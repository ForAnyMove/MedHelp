import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#23D3C2" />
      </View>
    );
  }

  // Not logged in
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Logged in but no role yet
  if (!session.role) {
    return <Redirect href="/(onboarding)/choose-role" />;
  }

  // Has role but hasn't completed profile setup
  if (!session.isRegistered) {
    return <Redirect href="/(onboarding)/profile-setup" />;
  }

  // Fully registered patient
  if (session.role === 'patient') {
    return <Redirect href="/home" />;
  }

  // Fully registered doctor — check doc verification status
  if (session.role === 'doctor') {
    const status = session.docVerificationStatus || 'none';
    if (status === 'none' || status === 'skipped') {
      // Must go through doc-upload (may skip again)
      return <Redirect href="/(onboarding)/doc-upload" />;
    }
    // pending or verified — go straight to app
    return <Redirect href="/home" />;
  }

  return <Redirect href="/home" />;
}
