import React from 'react';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { DoctorRatings } from '../../../src/screens/doctor/history/extra-screens/DoctorRatings';
import { isValidRouteUUID } from '../../../src/utils/routeValidation';

export default function DoctorRatingsRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  if (!isValidRouteUUID(id)) {
    return <Redirect href="/+not-found" />;
  }

  return (
    <Screen>
      <DoctorRatings
        doctorId={id}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
    </Screen>
  );
}
