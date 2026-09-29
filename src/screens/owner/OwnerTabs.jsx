import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Icon } from '../../components/ui/Icon';
import { useStyles } from '../../theme/useStyles';
import { NotificationBadge } from '../../components/common/NotificationBadge';
import { useComponentContext } from '../../context/GlobalContext';
import { useTheme } from '../../theme/ThemeContext';

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
  const { sizes } = useTheme();
  const { t } = useTranslation();
  const { tabIndex, setTabIndex, isSwipeEnabled, pendingRequestsCount } = useOwnerDashboard();
  const { setChatButtonConfig, ownerController } = useComponentContext();

  const isProfileTab = tabIndex === 4;
  const prevIsProfileTab = React.useRef(isProfileTab);

  React.useLayoutEffect(() => {
    const profileChanged = isProfileTab !== prevIsProfileTab.current;
    setChatButtonConfig({ visible: !isProfileTab, animated: profileChanged });
    prevIsProfileTab.current = isProfileTab;
    return () => setChatButtonConfig({ visible: true, animated: false });
  }, [isProfileTab, setChatButtonConfig]);

  // Sync tab from URL param
  useEffect(() => {
    if (currentTab && tabIndexMap[currentTab] !== undefined && tabIndexMap[currentTab] !== tabIndex) {
      setTabIndex(tabIndexMap[currentTab]);
    }
  }, [currentTab]);

  // Browser history sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (tabIndexMap[path] !== undefined) {
        setTabIndex(tabIndexMap[path]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setTabIndex]);

  const onIndexChange = (i) => {
    setTabIndex(i);
    const newTab = indexToTab[i];
    if (typeof window !== 'undefined' && window.history) {
      const currentUrlTab = window.location.pathname.replace('/', '');
      if (newTab !== currentUrlTab) {
        window.history.pushState(window.history.state, '', `/${newTab}`);
      }
    }
  };

  const pendingCount = ownerController?.pendingRequestsCount || 0;

  const routes = useMemo(() => [
    { key: 'home', title: t('owner_tabs.home'), icon: 'home' },
    { key: 'doctors', title: t('owner_tabs.doctors'), icon: 'doctor-01' },
    { key: 'calendar', title: t('owner_tabs.calendar'), icon: 'calendar' },
    { key: 'history', title: t('owner_tabs.history'), icon: 'medic-history' },
    { key: 'profile', title: t('owner_tabs.profile'), icon: 'profile' },
  ], [t]);

  const renderTabBar = (props) => (
    <View style={styles.tabBar}>
      {props.navigationState.routes.map((route, i) => {
        const isFocused = tabIndex === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => onIndexChange(i)}
          >
            <View>
              <Icon
                name={route.icon}
                color={isFocused ? styles.focusedIcon.color : styles.unfocusedIcon.color}
                size={sizes.scale(24)}
              />
              {route.key === 'doctors' && pendingCount > 0 && (
                <NotificationBadge count={pendingCount} />
              )}
            </View>
            <Text style={[styles.tabText, isFocused && styles.tabTextFocused]} numberOfLines={1}>
              {route.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <TabView
      navigationState={{ index: tabIndex, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={onIndexChange}
      initialLayout={{ width: layout.width }}
      swipeEnabled={isSwipeEnabled}
      tabBarPosition="bottom"
    />
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
