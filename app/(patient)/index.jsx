import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function PatientTabsWithProvider() {
  const params = useLocalSearchParams();
  const { tab, ...rest } = params || {};
  const targetTab = typeof tab === 'string' && tab ? tab : 'home';
  return <Redirect href={{ pathname: `/${targetTab}`, params: rest }} />;
}
