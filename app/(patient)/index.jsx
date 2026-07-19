import PatientTabsInner from '../../src/screens/patient/PatientTabs';

export default function PatientTabsWithProvider() {
  const { tab } = require('expo-router').useLocalSearchParams();
  const currentTab = typeof tab === 'string' ? tab : (tab?.[0] || 'home');
  return <PatientTabsInner currentTab={currentTab} />;
}
