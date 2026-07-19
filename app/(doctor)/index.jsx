import DoctorTabsInner from '../../src/screens/doctor/DoctorTabs';

export default function DoctorTabs() {
  const { tab } = require('expo-router').useLocalSearchParams();
  const currentTab = typeof tab === 'string' ? tab : (tab?.[0] || 'home');
  return <DoctorTabsInner currentTab={currentTab} />;
}
