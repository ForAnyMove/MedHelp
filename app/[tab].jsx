import React from 'react';
import { usePathname, useLocalSearchParams, Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';
import PatientTabs from '../src/screens/patient/PatientTabs';
import DoctorTabs from '../src/screens/doctor/DoctorTabs';
import OwnerTabs from '../src/screens/owner/OwnerTabs';
import NotFoundScreen from './+not-found';

const PATIENT_TABS = ['home', 'doctors', 'consultation', 'history', 'profile'];
const DOCTOR_TABS = ['home', 'balance', 'consultation', 'history', 'profile'];
const OWNER_TABS = ['home', 'doctors', 'calendar', 'history', 'profile'];

export default function TabScreen() {
  const params = useLocalSearchParams();
  const { tab } = params;
  const pathname = usePathname();
  const { session, isLoading } = useSession();

  if (isLoading || !session) return null;

  // Web fallback to synchronous pathname resolution avoiding hydration delay flashing
  const parsedPath = pathname ? pathname.split('/')[1] : null;
  const rawTab = typeof tab === 'string' ? tab : tab?.[0] || parsedPath;
  const currentTab = rawTab || 'home';

  if (session.role === 'patient') {
    if (PATIENT_TABS.includes(currentTab)) {
      return <PatientTabs currentTab={currentTab} />;
    }
    return <NotFoundScreen />;
  } else if (session.role === 'doctor') {
    if (DOCTOR_TABS.includes(currentTab)) {
      return <DoctorTabs currentTab={currentTab} />;
    }
    return <NotFoundScreen />;
  } else if (session.role === 'owner') {
    if (OWNER_TABS.includes(currentTab)) {
      return <OwnerTabs currentTab={currentTab} />;
    }
    return <NotFoundScreen />;
  }

  return null;
}

