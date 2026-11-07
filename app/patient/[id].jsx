import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isValidRouteUUID } from '../../src/utils/routeValidation';

export default function PatientCardDeepLink() {
  const { id } = useLocalSearchParams();

  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }

  return <Redirect href={{ pathname: '/history', params: { view: 'patient-profile', id, openPatientProfileId: id } }} />;
}
