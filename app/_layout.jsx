import '../src/locales/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { StreamProvider } from '../src/context/Stream';
import { ChatNotificationProvider } from '../src/context/ChatNotificationContext';

SplashScreen.preventAutoHideAsync();

import { initLocalization } from '../src/locales/i18n';
import { NavigationManager } from '../src/managers/NavigationManager';
import CallOverlay from '../src/components/Stream/CallOverlay';
import { ChatFloatingButton } from '../src/components/chat/ChatFloatingButton';
import { InAppNotification } from '../src/components/ui/InAppNotification';
import { StreamEventHandler } from '../src/components/Stream/StreamEventHandler';

export default function RootLayout() {
  const [localizationReady, setLocalizationReady] = React.useState(false);
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    let active = true;
    const init = async () => {
      await initLocalization();
      if (active) setLocalizationReady(true);
    };
    init();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if ((loaded || error) && localizationReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, localizationReady]);

  if ((!loaded && !error) || !localizationReady) {
    return null;
  }

  return (
    <SessionProvider>
      <ComponentProvider>
        <StreamProvider>
          <ChatNotificationProvider>
            <NavigationManager>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
              </Stack>
              <CallOverlay />
              <InAppNotification />
              <ChatFloatingButton />
              <StreamEventHandler />
            </NavigationManager>
          </ChatNotificationProvider>
        </StreamProvider>
      </ComponentProvider>
    </SessionProvider>
  );
}
