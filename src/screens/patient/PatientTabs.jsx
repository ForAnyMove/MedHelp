import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Platform, BackHandler } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Icon } from '../../components/ui/Icon';
import { useStyles } from '../../theme/useStyles';
import { NotificationBadge } from '../../components/common/NotificationBadge';
import { HomeTab } from './home/HomeTab';
import { PatientDashboardProvider, usePatientDashboard } from '../../context/PatientDashboardContext';
import { useComponentContext } from '../../context/GlobalContext';
import { DoctorsTab } from './doctors/DoctorsTab';
import { ConsultationTab } from './consultation/ConsultationTab';
import { HistoryTab } from './history/HistoryTab';
import { ProfileTab } from '../universal/profile/ProfileTab';
import { useTheme } from '../../theme/ThemeContext';
import { AdaptiveNavigationShell } from '../../components/navigation/AdaptiveNavigationShell';

const HomeRouteWrapper = () => <HomeTab />;
const DoctorsRoute = () => <DoctorsTab />;
const ConsultationRoute = () => <ConsultationTab />;
const HistoryRoute = () => <HistoryTab />;
const ProfileRoute = () => <ProfileTab role="patient" />;

const renderScene = SceneMap({
  home: HomeRouteWrapper,
  doctors: DoctorsRoute,
  consultation: ConsultationRoute,
  history: HistoryRoute,
  profile: ProfileRoute,
});

const tabIndexMap = { home: 0, doctors: 1, consultation: 2, history: 3, profile: 4 };
const indexToTab = ['home', 'doctors', 'consultation', 'history', 'profile'];

function PatientTabsInner({ currentTab }) {
  const layout = useWindowDimensions();
  const styles = useStyles(tabStyles);
  const { sizes, colors, responsive } = useTheme();
  const { t } = useTranslation();
  const {
    currentView,
    consultationView,
    historyView,
    isSwipeEnabled: baseSwipeEnabled,
    navigateToDashboard,
    navigateBack,
    scrollToTop,
    tabIndex: index,
    setTabIndex,
    handleTabSwitchRequest,
    navigateToHistoryDetail,
    navigateToHistoryDoctorProfile,
    syncStateFromUrl
  } = usePatientDashboard();

  const { tab, openHistoryId, openDoctorProfileId, id, view, filter } = useLocalSearchParams();
  const router = require('expo-router').useRouter();
  const [initialDeepLinkProcessed, setInitialDeepLinkProcessed] = React.useState(false);

  const { doctorController, consultationController, historyController, setChatButtonConfig } = useComponentContext();
  const isSwipeEnabled = baseSwipeEnabled && doctorController.currentDoctorView === 'list';
  const isProfileTab = index === 4;

  const prevIsProfileTab = React.useRef(isProfileTab);

  const doctorControllerRef = React.useRef(doctorController);
  doctorControllerRef.current = doctorController;

  React.useLayoutEffect(() => {
    const profileChanged = isProfileTab !== prevIsProfileTab.current;
    setChatButtonConfig({ visible: isSwipeEnabled && !isProfileTab, animated: profileChanged });
    prevIsProfileTab.current = isProfileTab;
  }, [isSwipeEnabled, isProfileTab, setChatButtonConfig]);

  React.useEffect(() => {
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [setChatButtonConfig]);

  React.useEffect(() => {
    const activeTab = typeof tab === 'string' ? tab : tab?.[0];
    if (activeTab === 'history') {
      if (openDoctorProfileId) {
        navigateToHistoryDoctorProfile(openDoctorProfileId);
      } else if (openHistoryId) {
        navigateToHistoryDetail(openHistoryId);
      }
      if (openDoctorProfileId || openHistoryId) {
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          const currentState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
          window.history.replaceState({ ...currentState, customTab: 'history' }, '', '/history');
        }
      }
    }
  }, [tab, openHistoryId, openDoctorProfileId]);

  // Handle deep linking & route param changes for sub-screens
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      const rawPath = window.location.pathname.replace('/', '').split('/')[0];
      const tabName = rawPath || searchParams.get('tab') || 'home';
      if (tabIndexMap[tabName] !== undefined) {
        syncStateFromUrl(searchParams, tabName);
      }
      setInitialDeepLinkProcessed(true);
    }
  }, [tab, view, id, filter, syncStateFromUrl]);

  // Android Hardware Back Button handler
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0 && currentView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (index === 1 && doctorController.currentDoctorView !== 'list') {
        doctorController.goBack();
        return true;
      }
      if (index === 2 && consultationView !== 'main') {
        navigateBack();
        return true;
      }
      if (index === 3 && historyView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (index !== 0) {
        setTabIndex(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [index, currentView, consultationView, historyView, doctorController, navigateBack, setTabIndex]);

  const onIndexChangeWithSync = (i) => {
    handleTabSwitchRequest(i);
    // Explicitly reset doctor view if tapping doctors active tab
    if (index === i && i === 1) {
      doctorController.setCurrentDoctorView('list');
    }

    // Sync URL on user tab press
    const newTab = indexToTab[i];
    if (Platform.OS === 'web') {
      const currentUrlTab = (typeof window !== 'undefined' && window.location) ? window.location.pathname.replace('/', '').split('/')[0] : '';
      const currentSearch = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
      if (newTab !== currentUrlTab || (newTab === currentUrlTab && currentSearch)) {
        if (typeof window.history?.pushState === 'function') {
          const currentState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
          window.history.pushState({ ...currentState, customTab: newTab }, '', `/${newTab}`);
          try {
            window.dispatchEvent(new Event('medhelp:urlchange'));
          } catch (e) {}
        }
      }
    }
  };

  // Sync from Browser Back/Forward buttons perfectly without remounting Expo routes
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePopState = (e) => {
      if (!window.location) return;
      const rawPath = window.location.pathname.replace('/', '').split('/')[0];
      const searchParams = new URLSearchParams(window.location.search);
      const path = rawPath || searchParams.get('tab') || 'home';
      const targetIndex = tabIndexMap[path];
      if (targetIndex !== undefined) {
        if (index !== targetIndex) {
          setTabIndex(targetIndex);
        }
        // Also sync sub-view state
        syncStateFromUrl(searchParams, path);

        if (path === 'doctors') {
          const view = searchParams.get('view');
          const id = searchParams.get('id');
          if (view === 'profile' && id) {
            doctorControllerRef.current?.setCurrentDoctorView('profile');
            doctorControllerRef.current?.selectDoctorById?.(id);
          } else if (view === 'summary') {
            doctorControllerRef.current?.setCurrentDoctorView('summary');
          } else {
            doctorControllerRef.current?.setCurrentDoctorView('list');
          }
        }
      }
      if (rawPath === '' && path) {
        const remainingParams = new URLSearchParams(window.location.search);
        remainingParams.delete('tab');
        const remaining = remainingParams.toString() ? `?${remainingParams.toString()}` : '';
        const cleanUrl = `/${path}${remaining}`;
        const existingState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
        window.history.replaceState(existingState, '', cleanUrl);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [index, setTabIndex, syncStateFromUrl]);

  const patientUpcomingCount = (consultationController?.bookings || []).length;
  const patientHistoryCount = (historyController?.pastConsultations || []).length;

  const routes = useMemo(() => [
    { key: 'home', title: t('patient_tabs.home'), icon: 'home' },
    { key: 'doctors', title: t('patient_tabs.doctors'), icon: 'doctor-01' },
    { key: 'consultation', title: t('patient_tabs.consultation'), icon: 'stethoscope', badgeCount: patientUpcomingCount },
    { key: 'history', title: t('patient_tabs.history'), icon: 'history', badgeCount: patientHistoryCount },
    { key: 'profile', title: t('patient_tabs.profile'), icon: 'profile' },
  ], [t, patientUpcomingCount, patientHistoryCount]);

  const isDesktopLandscape = !responsive?.isPortraitShell && (responsive?.isLandscape || responsive?.isDesktop || responsive?.navigationMode !== 'bottomBar');

  return (
    <Screen style={styles.container}>
      <AdaptiveNavigationShell
        routes={routes}
        currentIndex={index}
        onIndexChange={onIndexChangeWithSync}
        role="patient"
      >
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={onIndexChangeWithSync}
          initialLayout={{ width: layout.width }}
          swipeEnabled={isDesktopLandscape ? false : isSwipeEnabled}
          animationEnabled={!isDesktopLandscape}
          tabBarPosition="none"
        />
      </AdaptiveNavigationShell>
    </Screen>
  );
}

export default function PatientTabs({ currentTab }) {
  return (
    <PatientDashboardProvider initialTab={currentTab}>
      <PatientTabsInner currentTab={currentTab} />
    </PatientDashboardProvider>
  );
}

const tabStyles = (theme) => ({
  container: { paddingHorizontal: theme.sizes.scale(0) },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n300,
    paddingBottom: theme.sizes.spacing.xl,
    paddingTop: theme.sizes.spacing.s,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginTop: theme.sizes.spacing.xs,
  },
  tabTextFocused: { color: theme.colors.p500 },
  focusedIcon: { color: theme.colors.p500 },
  unfocusedIcon: { color: theme.colors.n700 }
});
