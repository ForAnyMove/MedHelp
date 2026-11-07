import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../src/context/SessionContext';
import { isValidRouteUUID } from '../../src/utils/routeValidation';

export default function DoctorCardDeepLink() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();

  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }

  if (session?.role === 'owner') {
    return <Redirect href={{ pathname: '/doctors', params: { view: 'doctor-profile', id } }} />;
  }

  if (session?.role === 'doctor') {
    return <Redirect href="/profile" />;
  }

  return <Redirect href={{ pathname: '/doctors', params: { view: 'profile', id } }} />;
}
