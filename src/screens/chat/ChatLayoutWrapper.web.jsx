import React from 'react';
import { Stack } from 'expo-router';
import { Chat } from 'stream-chat-react';
import { useStreamContext } from '../../context/Stream';
import 'stream-chat-react/dist/css/index.css';

export default function ChatLayoutWrapper() {
  const { chatClient } = useStreamContext();

  if (!chatClient) return null;

  return (
    <Chat client={chatClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="list" />
        <Stack.Screen name="room/[id]" />
      </Stack>
    </Chat>
  );
}
