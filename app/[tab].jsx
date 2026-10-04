import React from 'react';
import { usePathname, useLocalSearchParams } from 'expo-router';
import { useSession } from '../src/context/SessionContext';
import PatientTabs from '../src/screens/patient/PatientTabs';
import DoctorTabs from '../src/screens/doctor/DoctorTabs';
import OwnerTabs from '../src/screens/owner/OwnerTabs';

const PATIENT_TABS = ['home', 'doctors', 'consultation', 'history', 'profile'];
const DOCTOR_TABS = ['home', 'balance', 'consultation', 'history', 'profile'];
const OWNER_TABS = ['home', 'doctors', 'calendar', 'history', 'profile'];

export default function TabScreen() {
  const { tab } = useLocalSearchParams();
  const pathname = usePathname();
  const { session, isLoading } = useSession();

  if (isLoading || !session) return null;

  // Web fallback to synchronous pathname resolution avoiding hydration delay flashing
  const parsedPath = pathname ? pathname.split('/')[1] : null;
  const currentTab = typeof tab === 'string' ? tab : tab?.[0] || parsedPath;

  if (session.role === 'patient') {
    if (currentTab && PATIENT_TABS.includes(currentTab)) {
      return <PatientTabs currentTab={currentTab} />;
    }
    return <PatientTabs currentTab="home" />;
  } else if (session.role === 'doctor') {
    if (currentTab && DOCTOR_TABS.includes(currentTab)) {
      return <DoctorTabs currentTab={currentTab} />;
    }
    return <DoctorTabs currentTab="home" />;
  } else if (session.role === 'owner') {
    if (currentTab && OWNER_TABS.includes(currentTab)) {
      return <OwnerTabs currentTab={currentTab} />;
    }
    // Default to 'home' tab for owner if no tab param
    return <OwnerTabs currentTab="home" />;
  }

  return null;
}

