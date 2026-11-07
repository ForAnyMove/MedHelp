import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isValidRouteParam } from '../../src/utils/routeValidation';

/**
 * Deep link redirect for medapp://chat/:id
 */
export default function ChatDeepLinkRedirect() {
  const { id } = useLocalSearchParams();
  if (!isValidRouteParam(id)) {
    return <Redirect href="/+not-found" />;
  }
  return <Redirect href={`/(chat)/room/${id}`} />;
}
