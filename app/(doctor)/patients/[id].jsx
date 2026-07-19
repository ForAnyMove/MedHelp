import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function PatientProfileRedirect() {
  const { id } = useLocalSearchParams();

  // Redirect to the doctor history tab, passing the openPatientProfileId parameter
  return <Redirect href={`/(doctor)?tab=history&openPatientProfileId=${id}`} />;
}
