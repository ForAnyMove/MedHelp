import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';

import { Header } from '../../../components/patient-dashboard/Header';
import { HealthOverview } from '../../../components/patient-dashboard/HealthOverview';
import { QuickActions } from '../../../components/patient-dashboard/QuickActions';
import { Reminders } from '../../../components/patient-dashboard/Reminders';
import { NextSteps } from '../../../components/patient-dashboard/NextSteps';
import { HealthIndications } from '../../../components/patient-dashboard/HealthIndications';
import { HealthNotes } from '../../../components/patient-dashboard/HealthNotes';
import { LabResultsBanner } from '../../../components/patient-dashboard/LabResultsBanner';
import { UploadAnalysis } from './extra-screens/UploadAnalysis';
import { SymptomChecker } from './extra-screens/SymptomChecker';
import { usePatientDashboard } from '../../../context/PatientDashboardContext';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ProfileNotifications } from '../../universal/profile/components/ProfileNotifications';
import { useComponentContext } from '../../../context/GlobalContext';

import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';

export function HomeTab() {
  const styles = useStyles(themeStyles);
  const { currentView, navigateToUpload, navigateToSymptomChecker, scrollViewRef } = usePatientDashboard();
  const { sizes, colors, responsive } = useTheme();
  const { user } = useComponentContext();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = React.useState(false);

  const searchParams = useLocalSearchParams();
  const routeView = typeof searchParams?.view === 'string' ? searchParams.view : searchParams?.view?.[0];

  const getWebParam = (key) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
    try {
      if (!window.location.pathname.startsWith('/home') && window.location.pathname !== '/') return null;
      const sp = new URLSearchParams(window.location.search);
      return sp.get(key);
    } catch (e) {
      return null;
    }
  };

  const [, setPopstateTick] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => setPopstateTick((tick) => tick + 1);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isWebHomeBase = isWeb && (window.location.pathname === '/' || window.location.pathname.startsWith('/home')) && (!window.location.search || window.location.search === '?');

  const urlView = getWebParam('view');
  const effectiveView = isWebHomeBase
    ? 'dashboard'
    : (currentView !== 'dashboard' ? currentView : (urlView || (routeView || 'dashboard')));

  const isMultiCol = responsive?.isTabletLandscape || responsive?.isDesktop || responsive?.isDesktopLarge;

  const handleAction = (id) => {
    if (id === 'upload') {
      navigateToUpload();
    } else if (id === 'checker' || id === 'symptom-checker') {
      navigateToSymptomChecker();
    } else {
      console.log('Action:', id);
    }
  };

  if (effectiveView === 'upload') {
    return <UploadAnalysis />;
  }

  if (effectiveView === 'symptom-checker') {
    return <SymptomChecker />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Header onNotificationPress={() => setIsNotificationSheetOpen(true)} />

        {isMultiCol ? (
          <View style={styles.dashboardRow}>
            <View style={styles.dashboardColMain}>
              <LabResultsBanner />
              <HealthOverview />
              <QuickActions onAction={handleAction} />
              <HealthIndications />
            </View>
            <View style={styles.dashboardColSide}>
              <Reminders />
              <NextSteps />
              <HealthNotes />
            </View>
          </View>
        ) : (
          <>
            <LabResultsBanner />
            <HealthOverview />
            <QuickActions onAction={handleAction} />
            <Reminders />
            <NextSteps />
            <HealthIndications />
            <HealthNotes />
          </>
        )}
      </ScrollView>

      <BottomSheet
        visible={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        initialHeight={sizes.height}
      >
        <ProfileNotifications user={user} onClose={() => setIsNotificationSheetOpen(false)} />
      </BottomSheet>
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    paddingHorizontal: theme.sizes.scale(0),
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth: theme.responsive?.isTabletLandscape || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge
      ? (theme.responsive?.containerMaxWidth || 1240)
      : theme.responsive?.isTabletPortrait
        ? 760
        : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  dashboardRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.l,
    alignItems: 'flex-start',
    marginTop: theme.sizes.spacing.s,
    width: '100%',
  },
  dashboardColMain: {
    flex: 3,
    minWidth: 0,
  },
  dashboardColSide: {
    flex: 2,
    minWidth: 0,
  },
});
