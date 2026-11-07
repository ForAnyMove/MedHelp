import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Platform, BackHandler } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Icon } from '../../components/ui/Icon';
import { useStyles } from '../../theme/useStyles';
import { NotificationBadge } from '../../components/common/NotificationBadge';
import { useComponentContext } from '../../context/GlobalContext';
import { useTheme } from '../../theme/ThemeContext';
import { AdaptiveNavigationShell } from '../../components/navigation/AdaptiveNavigationShell';

import { OwnerDashboardProvider, useOwnerDashboard } from '../../context/OwnerDashboardContext';
import { OwnerHomeTab } from './home/OwnerHomeTab';
import { OwnerDoctorsTab } from './doctors/OwnerDoctorsTab';
import { OwnerCalendarTab } from './calendar/OwnerCalendarTab';
import { OwnerHistoryTab } from './history/OwnerHistoryTab';
import { ProfileTab } from '../universal/profile/ProfileTab';

const HomeRoute = () => <OwnerHomeTab />;
const DoctorsRoute = () => <OwnerDoctorsTab />;
const CalendarRoute = () => <OwnerCalendarTab />;
const HistoryRoute = () => <OwnerHistoryTab />;
const ProfileRoute = () => <ProfileTab role="owner" />;

const renderScene = SceneMap({
  home: HomeRoute,
  doctors: DoctorsRoute,
  calendar: CalendarRoute,
  history: HistoryRoute,
  profile: ProfileRoute,
});

const tabIndexMap = { home: 0, doctors: 1, calendar: 2, history: 3, profile: 4 };
const indexToTab = ['home', 'doctors', 'calendar', 'history', 'profile'];

function OwnerTabsInner({ currentTab }) {
  const layout = useWindowDimensions();
  const styles = useStyles(tabStyles);
  const { sizes, responsive } = useTheme();
  const { t } = useTranslation();
  const {
    tabIndex,
    setTabIndex,
    isSwipeEnabled,
    doctorsView,
    calendarView,
    historyView,
    navigateBack,
    syncStateFromUrl,
  } = useOwnerDashboard();
  const { setChatButtonConfig, ownerController } = useComponentContext();

  const isProfileTab = tabIndex === 4;
  const prevIsProfileTab = React.useRef(isProfileTab);

  React.useLayoutEffect(() => {
    const profileChanged = isProfileTab !== prevIsProfileTab.current;
    setChatButtonConfig({ visible: !isProfileTab, animated: profileChanged });
    prevIsProfileTab.current = isProfileTab;
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [isProfileTab, setChatButtonConfig]);

  // Android Hardware Back Button handler
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tabIndex === 1 && doctorsView !== 'list') {
        navigateBack();
        return true;
      }
      if (tabIndex === 2 && calendarView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (tabIndex === 3 && historyView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (tabIndex !== 0) {
        setTabIndex(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tabIndex, doctorsView, calendarView, historyView, navigateBack, setTabIndex]);

  // Browser history sync
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePopState = () => {
      if (!window.location) return;
      const rawPath = window.location.pathname.replace('/', '').split('/')[0];
      const searchParams = new URLSearchParams(window.location.search);
      const path = rawPath || searchParams.get('tab') || 'home';
      const targetIndex = tabIndexMap[path];
      if (targetIndex !== undefined) {
        if (tabIndex !== targetIndex) {
          setTabIndex(targetIndex);
        }
        syncStateFromUrl?.(searchParams, path);
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
  }, [tabIndex, setTabIndex, syncStateFromUrl]);

  const onIndexChange = (i) => {
    setTabIndex(i);
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

  const pendingCount = ownerController?.pendingRequestsCount || 0;

  const routes = useMemo(() => [
    { key: 'home', title: t('owner_tabs.home'), icon: 'home' },
    { key: 'doctors', title: t('owner_tabs.doctors'), icon: 'doctor-01', badgeCount: pendingCount },
    { key: 'calendar', title: t('owner_tabs.calendar'), icon: 'calendar' },
    { key: 'history', title: t('owner_tabs.history'), icon: 'medic-history' },
    { key: 'profile', title: t('owner_tabs.profile'), icon: 'profile' },
  ], [t, pendingCount]);

  const isDesktopLandscape = !responsive?.isPortraitShell && (responsive?.isLandscape || responsive?.isDesktop || responsive?.navigationMode !== 'bottomBar');

  return (
    <AdaptiveNavigationShell
      routes={routes}
      currentIndex={tabIndex}
      onIndexChange={onIndexChange}
      role="owner"
    >
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={onIndexChange}
        initialLayout={{ width: layout.width }}
        swipeEnabled={isDesktopLandscape ? false : isSwipeEnabled}
        animationEnabled={!isDesktopLandscape}
        tabBarPosition="none"
      />
    </AdaptiveNavigationShell>
  );
}

export default function OwnerTabs({ currentTab }) {
  return (
    <OwnerDashboardProvider initialTab={currentTab}>
      <Screen>
        <OwnerTabsInner currentTab={currentTab} />
      </Screen>
    </OwnerDashboardProvider>
  );
}

const tabStyles = (theme) => ({
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
  unfocusedIcon: { color: theme.colors.n700 },
});
