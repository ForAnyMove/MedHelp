import React, { useLayoutEffect } from 'react';
import { Stack } from 'expo-router';
import { Chat } from 'stream-chat-react';
import { useStreamContext } from '../../context/Stream';
import { useComponentContext } from '../../context/GlobalContext';
import 'stream-chat-react/dist/css/index.css';

export default function ChatLayoutWrapper() {
  const { chatClient } = useStreamContext();
  const { setChatButtonConfig } = useComponentContext();

  useLayoutEffect(() => {
    setChatButtonConfig({ visible: false, animated: false });
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [setChatButtonConfig]);

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
