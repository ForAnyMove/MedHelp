import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isValidRouteUUID } from '../../../src/utils/routeValidation';

export default function DoctorProfileRedirect() {
  const { id } = useLocalSearchParams();

  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }

  // Redirect to the patient history tab, passing the openDoctorProfileId parameter
  return <Redirect href={`/history?openDoctorProfileId=${id}`} />;
}
