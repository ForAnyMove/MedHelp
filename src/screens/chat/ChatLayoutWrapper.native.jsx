import React, { useLayoutEffect } from 'react';
import { Stack } from 'expo-router';
import { OverlayProvider, Chat } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';
import { useComponentContext } from '../../context/GlobalContext';

export default function ChatLayoutWrapper() {
  const { chatClient } = useStreamContext();
  const { setChatButtonConfig } = useComponentContext();

  useLayoutEffect(() => {
    setChatButtonConfig({ visible: false, animated: false });
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [setChatButtonConfig]);

  if (!chatClient) return null;

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="list" />
          <Stack.Screen name="room/[id]" />
        </Stack>
      </Chat>
    </OverlayProvider>
  );
}
