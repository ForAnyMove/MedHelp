import React from 'react';
import { Stack } from 'expo-router';
import { OverlayProvider, Chat } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';

export default function ChatLayoutWrapper() {
  const { chatClient } = useStreamContext();

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
