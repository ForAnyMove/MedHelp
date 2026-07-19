import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Deep link redirect for medapp://chat/:id
 */
export default function ChatDeepLinkRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/(chat)/room/${id}`} />;
}
