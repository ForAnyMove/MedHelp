import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet, Platform, BackHandler } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import { Icon } from '../../components/ui/Icon';
import { useStyles } from '../../theme/useStyles';
import { NotificationBadge } from '../../components/common/NotificationBadge';
import { useComponentContext } from '../../context/GlobalContext';

import { DoctorDashboardProvider, useDoctorDashboard } from '../../context/DoctorDashboardContext';
import { DoctorHomeTab } from './home/DoctorHomeTab';
import { DoctorConsultationTab } from './consultation/DoctorConsultationTab';
import { DoctorBalanceTab } from './balance/DoctorBalanceTab';
import { DoctorHistoryTab } from './history/DoctorHistoryTab';
import { ProfileTab } from '../universal/profile/ProfileTab';
import { useTheme } from '../../theme/ThemeContext';
import { AdaptiveNavigationShell } from '../../components/navigation/AdaptiveNavigationShell';

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
  const { sizes, colors, responsive } = useTheme();
  const { t } = useTranslation();
  const {
    tabIndex,
    setTabIndex,
    currentView,
    balanceView,
    historyView,
    consultationStatus,
    isSummarySaved,
    isSwipeEnabled,
    handleTabSwitchRequest,
    showExitConfirmation,
    confirmExitSummary,
    cancelExitSummary,
    navigateToHistoryDetail,
    navigateToHistoryPatientProfile,
    openConsultationById,
    navigateBack,
    backFromForm,
    syncStateFromUrl,
    updateUrlParams
  } = useDoctorDashboard();
  const { doctorProfileController, doctorHistoryController, setChatButtonConfig } = useComponentContext();
  const { openConsultationId, consultationAction, action, ts, returnTab, tab, openHistoryId, openPatientProfileId, view, id } = useLocalSearchParams();
  const router = require('expo-router').useRouter();

  const [initialDeepLinkProcessed, setInitialDeepLinkProcessed] = React.useState(false);

  const isProfileTab = tabIndex === 4;
  const prevIsProfileTab = React.useRef(isProfileTab);

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
      if (openPatientProfileId) {
        navigateToHistoryPatientProfile(openPatientProfileId);
      } else if (openHistoryId) {
        navigateToHistoryDetail(openHistoryId);
      }
      if (openPatientProfileId || openHistoryId) {
        router.setParams({ openPatientProfileId: undefined, openHistoryId: undefined });
      }
    }
  }, [tab, openHistoryId, openPatientProfileId]);

  React.useEffect(() => {
    const resolvedAction = consultationAction || action;
    if (openConsultationId && resolvedAction) {
       openConsultationById(openConsultationId, resolvedAction, returnTab);
       router.setParams({ openConsultationId: undefined, action: undefined, consultationAction: undefined, returnTab: undefined });
    }
  }, [openConsultationId, consultationAction, action, ts, returnTab]);

  // Handle deep linking & route param changes for sub-screens
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      const tabName = window.location.pathname.replace('/', '').split('/')[0];
      if (tabIndexMap[tabName] !== undefined) {
        syncStateFromUrl(searchParams, tabName);
      }
      setInitialDeepLinkProcessed(true);
    }
  }, [tab, view, id, openConsultationId, syncStateFromUrl]);

  // Android Hardware Back Button handler
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tabIndex === 2 && (consultationStatus === 'form' || consultationStatus === 'summary')) {
        if (!isSummarySaved) {
          handleTabSwitchRequest(tabIndex);
        } else {
          backFromForm();
        }
        return true;
      }
      if (tabIndex === 2 && currentView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (tabIndex === 1 && balanceView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (tabIndex === 3 && historyView !== 'dashboard') {
        navigateBack();
        return true;
      }
      if (tabIndex !== 0) {
        handleTabSwitchRequest(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tabIndex, currentView, balanceView, historyView, consultationStatus, isSummarySaved, handleTabSwitchRequest, navigateBack, backFromForm]);

  const onIndexChangeWithSync = (i) => {
    const isBlockedByUnsaved = (consultationStatus === 'summary' || consultationStatus === 'form') && !isSummarySaved;
    handleTabSwitchRequest(i);
    if (isBlockedByUnsaved) return;

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

      // Guard unsaved medical form/summary against accidental browser Back press
      if ((consultationStatus === 'summary' || consultationStatus === 'form') && !isSummarySaved) {
        const nextView = searchParams.get('view');
        if (path !== 'consultation' || (nextView !== 'form' && nextView !== 'summary')) {
          handleTabSwitchRequest(targetIndex !== undefined ? targetIndex : tabIndex);
          updateUrlParams?.('consultation', consultationStatus, undefined, undefined, undefined, { replace: false });
          return;
        }
      }

      if (targetIndex !== undefined) {
        if (tabIndex !== targetIndex) {
          setTabIndex(targetIndex);
        }
        // Also sync sub-view state
        syncStateFromUrl(searchParams, path);
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
  }, [tabIndex, setTabIndex, syncStateFromUrl, consultationStatus, isSummarySaved, handleTabSwitchRequest, updateUrlParams]);

  const upcomingConsultationsCount = doctorProfileController?.upcomingCount ?? 0;
  const historyBadgeCount = doctorHistoryController?.doctorPastConsultations?.length ?? 0;

  const routes = useMemo(() => [
    { key: 'home', title: t('doctor_tabs.home'), icon: 'home' },
    { key: 'balance', title: t('doctor_tabs.balance'), icon: 'balance' },
    { key: 'consultation', title: t('doctor_tabs.consultation'), icon: 'stethoscope', badgeCount: upcomingConsultationsCount },
    { key: 'history', title: t('doctor_tabs.history'), icon: 'medic-history', badgeCount: historyBadgeCount },
    { key: 'profile', title: t('doctor_tabs.profile'), icon: 'profile' },
  ], [t, upcomingConsultationsCount, historyBadgeCount]);

  const isDesktopLandscape = !responsive?.isPortraitShell && (responsive?.isLandscape || responsive?.isDesktop || responsive?.navigationMode !== 'bottomBar');

  return (
    <View style={{ flex: 1 }}>
      <AdaptiveNavigationShell
        routes={routes}
        currentIndex={tabIndex}
        onIndexChange={onIndexChangeWithSync}
        role="doctor"
      >
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={onIndexChangeWithSync}
          initialLayout={{ width: layout.width }}
          swipeEnabled={isDesktopLandscape ? false : isSwipeEnabled}
          animationEnabled={!isDesktopLandscape}
          tabBarPosition="none"
        />
      </AdaptiveNavigationShell>
      {showExitConfirmation && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
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
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginTop: theme.sizes.spacing.xs,
  },
  tabTextFocused: { color: theme.colors.p500 },
  focusedIcon: { color: theme.colors.p500 },
  unfocusedIcon: { color: theme.colors.n700 },
  exitModalBody: {
    backgroundColor: theme.colors.white,
    padding: theme.sizes.spacing.xl,
    borderRadius: theme.sizes.scale(24),
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
    borderRadius: theme.sizes.scale(20),
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
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
  },
  btnConfirmText: {
    ...theme.sizes.typography.body,
    color: theme.colors.white,
    fontWeight: '700',
  }
});
