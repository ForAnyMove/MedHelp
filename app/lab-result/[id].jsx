import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LabResultDeepLinkPlaceholder() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/(patient)/lab-results/${id}`} />;
}

