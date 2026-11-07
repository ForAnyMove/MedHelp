import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isValidRouteUUID } from '../../../src/utils/routeValidation';

export default function PatientProfileRedirect() {
  const { id } = useLocalSearchParams();

  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }

  // Redirect to the doctor history tab, passing the openPatientProfileId parameter
  return <Redirect href={`/history?openPatientProfileId=${id}`} />;
}
