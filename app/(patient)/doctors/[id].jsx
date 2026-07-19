import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DoctorProfileRedirect() {
  const { id } = useLocalSearchParams();

  // Redirect to the patient history tab, passing the openDoctorProfileId parameter
  return <Redirect href={`/(patient)?tab=history&openDoctorProfileId=${id}`} />;
}
