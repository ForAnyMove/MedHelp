import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isValidRouteUUID } from '../../src/utils/routeValidation';

export default function LabResultDeepLinkPlaceholder() {
  const { id } = useLocalSearchParams();
  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }
  return <Redirect href={`/(patient)/lab-results/${id}`} />;
}

