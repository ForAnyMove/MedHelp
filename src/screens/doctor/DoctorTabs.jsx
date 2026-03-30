import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Icon } from '../../components/ui/Icon';
import { useStyles } from '../../theme/useStyles';
import { NotificationBadge } from '../../components/common/NotificationBadge';

import { DoctorDashboardProvider, useDoctorDashboard } from '../../context/DoctorDashboardContext';
import { DoctorHomeTab } from './home/DoctorHomeTab';
import { DoctorConsultationTab } from './consultation/DoctorConsultationTab';
import { DoctorBalanceTab } from './balance/DoctorBalanceTab';
import { DoctorHistoryTab } from './history/DoctorHistoryTab';
import { ProfileTab } from '../universal/profile/ProfileTab';

const HomeRoute = () => <DoctorHomeTab />;
const BalanceRoute = () => <DoctorBalanceTab />;
const ConsultationRoute = () => <DoctorConsultationTab />;
const HistoryRoute = () => <DoctorHistoryTab />;
const ProfileRoute = () => <ProfileTab role="doctor" />;

const renderScene = SceneMap({
  home: HomeRoute,
  balance: BalanceRoute,
  consultation: ConsultationRoute,
  history: HistoryRoute,
  profile: ProfileRoute,
});

const tabIndexMap = { home: 0, balance: 1, consultation: 2, history: 3, profile: 4 };
const indexToTab = ['home', 'balance', 'consultation', 'history', 'profile'];

function DoctorTabsInner({ currentTab }) {
  const layout = useWindowDimensions();
  const styles = useStyles(tabStyles);
  const { t } = useTranslation();
  const { 
    tabIndex, 
    setTabIndex,
    isSwipeEnabled,
    handleTabSwitchRequest,
    showExitConfirmation,
    confirmExitSummary,
    cancelExitSummary
  } = useDoctorDashboard();

  // Sync index from URL
  useEffect(() => {
    if (currentTab && tabIndexMap[currentTab] !== undefined && tabIndexMap[currentTab] !== tabIndex) {
      handleTabSwitchRequest(tabIndexMap[currentTab]);
    }
  }, [currentTab]);

  const onIndexChangeWithSync = (i) => {
    handleTabSwitchRequest(i);
    // Explicit sync logic mapping to swipe / button press ONLY
    const newTab = indexToTab[i];
    if (newTab !== currentTab) {
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', `/${newTab}`);
      } else {
        router.setParams({ tab: newTab });
      }
    }
  };

  // Removed faulty pushState useEffect.
  // Instead, router.setParams and pushState are strictly kept inside the 
  // explicitly manual tab switches, or through the handlePopState sync logic.

  // Sync from Browser Back/Forward buttons perfectly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (tabIndexMap[path] !== undefined) {
        handleTabSwitchRequest(tabIndexMap[path]);
        router.setParams({ tab: path });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleTabSwitchRequest]);

  const routes = useMemo(() => [
    { key: 'home', title: t('doctor_tabs.home'), icon: 'Home' },
    { key: 'balance', title: t('doctor_tabs.balance'), icon: 'Briefcase' },
    { key: 'consultation', title: t('doctor_tabs.consultation'), icon: 'Video' },
    { key: 'history', title: t('doctor_tabs.history'), icon: 'Clock' },
    { key: 'profile', title: t('doctor_tabs.profile'), icon: 'User' },
  ], [t]);

  const renderTabBar = (props) => {
    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          const isFocused = tabIndex === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => onIndexChangeWithSync(i)}
            >
              <View>
                <Icon 
                  name={route.icon} 
                  color={isFocused ? styles.focusedIcon.color : styles.unfocusedIcon.color} 
                  size={24}
                />
                {route.key === 'history' && <NotificationBadge count={4} />}
                {route.key === 'consultation' && <NotificationBadge count={2} />}
              </View>
              <Text style={[styles.tabText, isFocused && styles.tabTextFocused]}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={onIndexChangeWithSync}
        initialLayout={{ width: layout.width }}
        swipeEnabled={isSwipeEnabled}
        tabBarPosition="bottom"
      />
      {showExitConfirmation && (
        <View style={StyleSheet.absoluteFillObject}>
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={styles.exitModalBody}>
                 <Text style={styles.exitModalTitle}>{t('doctor_consultation.exit_title')}</Text>
                 <Text style={styles.exitModalText}>{t('doctor_consultation.exit_desc')}</Text>
                 <View style={styles.exitModalBtns}>
                    <TouchableOpacity onPress={cancelExitSummary} style={styles.btnCancel}>
                       <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmExitSummary} style={styles.btnConfirm}>
                       <Text style={styles.btnConfirmText}>{t('doctor_consultation.exit_confirm')}</Text>
                    </TouchableOpacity>
                 </View>
              </View>
           </View>
        </View>
      )}
    </View>
  );
}

export default function DoctorTabs({ currentTab }) {
  return (
    <DoctorDashboardProvider initialTab={currentTab}>
      <Screen>
        <DoctorTabsInner currentTab={currentTab} />
      </Screen>
    </DoctorDashboardProvider>
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
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginTop: theme.sizes.spacing.xs,
  },
  tabTextFocused: { color: theme.colors.p500 },
  focusedIcon: { color: theme.colors.p500 },
  unfocusedIcon: { color: theme.colors.n500 },
  exitModalBody: {
    backgroundColor: theme.colors.white,
    padding: theme.sizes.spacing.xl,
    borderRadius: 24,
    width: '85%',
    alignItems: 'center',
  },
  exitModalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
    textAlign: 'center',
    fontFamily: 'Manrope_700Bold',
  },
  exitModalText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  exitModalBtns: { flexDirection: 'row', gap: theme.sizes.spacing.m, width: '100%' },
  btnCancel: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: 20,
    backgroundColor: theme.colors.n100,
    alignItems: 'center',
  },
  btnCancelText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: 20,
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
  },
  btnConfirmText: {
    ...theme.sizes.typography.body,
    color: theme.colors.white,
    fontWeight: '700',
  }
});
