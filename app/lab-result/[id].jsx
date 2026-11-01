import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LabResultDeepLinkPlaceholder() {
  const { id } = useLocalSearchParams();
  if (!id || id === 'undefined' || id === 'null') {
    return <Redirect href="/(patient)?tab=profile" />;
  }
  return <Redirect href={`/(patient)/lab-results/${id}`} />;
}

