import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const {
    currentView,
    isSwipeEnabled: baseSwipeEnabled,
    navigateToDashboard,
    scrollToTop,
    tabIndex: index,
    setTabIndex: setIndex,
    navigateToConsultationMain,
    navigateToHistoryDetail,
    navigateToHistorySummary,
    navigateToHistoryDoctorProfile,
    syncStateFromUrl
  } = usePatientDashboard();

  const { tab, openHistoryId, openDoctorProfileId, id, view } = useLocalSearchParams();
  const router = require('expo-router').useRouter();
  const [initialDeepLinkProcessed, setInitialDeepLinkProcessed] = React.useState(false);

  const { doctorController, consultationController, setChatButtonConfig } = useComponentContext();
  const isSwipeEnabled = baseSwipeEnabled && doctorController.currentDoctorView === 'list';
  const isProfileTab = index === 4;

  const prevIsProfileTab = React.useRef(isProfileTab);

  React.useLayoutEffect(() => {
    const profileChanged = isProfileTab !== prevIsProfileTab.current;
    setChatButtonConfig({ visible: isSwipeEnabled && !isProfileTab, animated: profileChanged });
    prevIsProfileTab.current = isProfileTab;
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [isSwipeEnabled, isProfileTab, setChatButtonConfig]);

  React.useEffect(() => {
    const activeTab = typeof tab === 'string' ? tab : tab?.[0];
    if (activeTab === 'history') {
      if (openDoctorProfileId) {
        navigateToHistoryDoctorProfile(openDoctorProfileId);
      } else if (openHistoryId) {
        navigateToHistoryDetail(openHistoryId);
      }
      if (openDoctorProfileId || openHistoryId) {
        router.setParams({ openHistoryId: undefined, openDoctorProfileId: undefined });
      }
    }
  }, [tab, openHistoryId, openDoctorProfileId]);

  // Sync index from URL natively
  useEffect(() => {
    if (currentTab && tabIndexMap[currentTab] !== undefined && tabIndexMap[currentTab] !== index) {
      if (currentView !== 'dashboard') {
        navigateToDashboard();
      }
      setIndex(tabIndexMap[currentTab]);
    }
  }, [currentTab]);

  // Handle deep linking for sub-screens on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialDeepLinkProcessed) {
      const searchParams = new URLSearchParams(window.location.search);
      const tabName = window.location.pathname.replace('/', '');
      if (tabIndexMap[tabName] !== undefined) {
        syncStateFromUrl(searchParams, tabName);
      }
      setInitialDeepLinkProcessed(true);
    }
  }, [initialDeepLinkProcessed, syncStateFromUrl]);

  // Sync from Browser Back/Forward buttons perfectly without remounting Expo routes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (e) => {
      const path = window.location.pathname.replace('/', '');
      if (tabIndexMap[path] !== undefined) {
        setIndex(tabIndexMap[path]);
        // Also sync sub-view state
        const searchParams = new URLSearchParams(window.location.search);
        syncStateFromUrl(searchParams, path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setIndex, syncStateFromUrl]);

  const handleIndexChange = (i) => {
    if (currentView !== 'dashboard') {
      navigateToDashboard();
    }
    setIndex(i);

    // Explicit URL push ONLY on manual user swipe / tab press
    const newTab = indexToTab[i];
    if (typeof window !== 'undefined' && window.history) {
      const currentUrlTab = window.location.pathname.replace('/', '');
      if (newTab !== currentUrlTab) {
        window.history.pushState(window.history.state, '', `/${newTab}`);
      }
    }
  };

  const routes = useMemo(() => [
    { key: 'home', title: t('patient_tabs.home'), icon: 'home' },
    { key: 'doctors', title: t('patient_tabs.doctors'), icon: 'doctor-01' },
    { key: 'consultation', title: t('patient_tabs.consultation'), icon: 'stethoscope' },
    { key: 'history', title: t('patient_tabs.history'), icon: 'history' },
    { key: 'profile', title: t('patient_tabs.profile'), icon: 'profile' },
  ], [t]);

  const renderTabBar = (props) => {
    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          const isFocused = index === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (index === i) {
                  if (route.key === 'home') {
                    if (currentView !== 'dashboard') {
                      navigateToDashboard();
                    } else {
                      scrollToTop();
                    }
                  } else if (route.key === 'consultation') {
                    navigateToConsultationMain();
                  }
                } else {
                  // When switching tabs, reset sub-views if any
                  if (currentView !== 'dashboard') {
                    navigateToDashboard();
                  }
                  navigateToConsultationMain();
                  handleIndexChange(i);
                }
              }}
            >
              <View>
                <Icon
                  name={route.icon}
                  color={isFocused ? styles.focusedIcon.color : styles.unfocusedIcon.color}
                  size={sizes.scale(24)}
                />
                {route.key === 'history' && <NotificationBadge count={2} />}
                {route.key === 'consultation' && <NotificationBadge count={1} />}
              </View>
              <Text style={[styles.tabText, isFocused && styles.tabTextFocused]} numberOfLines={1}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Screen style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        swipeEnabled={isSwipeEnabled}
        tabBarPosition="bottom"
      />
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
