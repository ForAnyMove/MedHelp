import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';

import { useTheme } from '../src/theme/ThemeContext';

export default function Index() {
  const { session, isLoading } = useSession();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  // NavigationManager handles all redirects.
  // This component is only rendered briefly at app launch.
  // Return null — NavigationManager will redirect immediately.
  return null;
}
