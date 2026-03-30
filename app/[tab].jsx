import React from 'react';
import { usePathname, Redirect, useLocalSearchParams } from 'expo-router';
import { useSession } from '../src/context/SessionContext';
import PatientTabs from '../src/screens/patient/PatientTabs';
import DoctorTabs from '../src/screens/doctor/DoctorTabs';

const PATIENT_TABS = ['home', 'doctors', 'consultation', 'history', 'profile'];
const DOCTOR_TABS = ['home', 'balance', 'consultation', 'history', 'profile'];

export default function TabScreen() {
  const { tab } = useLocalSearchParams();
  const pathname = usePathname();
  const { session, isLoading } = useSession();

  if (isLoading) return null;
  if (!session) return <Redirect href="/welcome" />;

  // Web fallback to synchronous pathname resolution avoiding hydration delay flashing
  const parsedPath = pathname ? pathname.split('/')[1] : null;
  const currentTab = typeof tab === 'string' ? tab : tab?.[0] || parsedPath;

  if (session.role === 'patient') {
    if (!currentTab || !PATIENT_TABS.includes(currentTab)) {
      return <Redirect href="/home" />;
    }
    return <PatientTabs currentTab={currentTab} />;
  } else if (session.role === 'doctor') {
    if (!currentTab || !DOCTOR_TABS.includes(currentTab)) {
      return <Redirect href="/home" />;
    }
    return <DoctorTabs currentTab={currentTab} />;
  }
  
  return <Redirect href="/welcome" />;
}
