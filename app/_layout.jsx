import '../src/locales/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium, 
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';

import { ComponentProvider } from '../src/context/GlobalContext';
import { SessionProvider } from '../src/context/SessionContext';

SplashScreen.preventAutoHideAsync();

import { NavigationManager } from '../src/managers/NavigationManager';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SessionProvider>
      <ComponentProvider>
        <NavigationManager>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </NavigationManager>
      </ComponentProvider>
    </SessionProvider>
  );
}

