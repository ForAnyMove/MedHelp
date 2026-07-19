import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { DoctorRatings } from '../../../src/screens/doctor/history/extra-screens/DoctorRatings';
import { DoctorDashboardProvider } from '../../../src/context/DoctorDashboardContext';

export default function DoctorRatingsRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <Screen>
      <DoctorDashboardProvider>
        <DoctorRatings doctorId={id} onBack={() => router.back()} />
      </DoctorDashboardProvider>
    </Screen>
  );
}
