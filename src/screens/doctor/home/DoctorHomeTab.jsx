import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';

import { DoctorHeader } from '../../../components/doctor-dashboard/DoctorHeader';
import { TodayStatusCard } from '../../../components/doctor-dashboard/TodayStatusCard';
import { ProfitStatusCard } from '../../../components/doctor-dashboard/ProfitStatusCard';
import { NextPatientCard } from '../../../components/doctor-dashboard/NextPatientCard';
import { DoctorQuickActions } from '../../../components/doctor-dashboard/DoctorQuickActions';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ProfileNotifications } from '../../universal/profile/components/ProfileNotifications';

export function DoctorHomeTab() {
  const styles = useStyles(themeStyles);
  const { navigateToPatientCard, setTabIndex, scrollViewRef } = useDoctorDashboard();
  const { doctorProfileController, user } = useComponentContext();
  const { sizes, colors, responsive } = useTheme();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = React.useState(false);
  
  const isMultiCol = !responsive?.isPortraitShell && (responsive?.isTabletLandscape || responsive?.isDesktop || responsive?.isDesktopLarge);
  const isWideDesktop = !responsive?.isPortraitShell && (responsive?.isDesktopWide || responsive?.isUltrawide);
  const data = doctorProfileController.getDashboardData();

  const handleConsultationPress = () => {
    setTabIndex(2); // Index of Consultation tab
  };

  const handleOpenConsultation = () => {
    navigateToPatientCard(data.nextConsultation);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DoctorHeader 
          profile={data.profile} 
          onNotificationPress={() => setIsNotificationSheetOpen(true)} 
        />

        {isMultiCol ? (
          <View style={styles.dashboardRow}>
            <View style={styles.dashboardColMain}>
              {isWideDesktop ? (
                <View style={styles.wideTopGrid}>
                  <View style={styles.wideGridCol}>
                    <TodayStatusCard
                      consultationCount={data.consultationsTodayCount}
                      onConsultationPress={handleConsultationPress}
                    />
                  </View>
                  <View style={styles.wideGridCol}>
                    <NextPatientCard
                      consultation={data.nextConsultation}
                      onOpenConsultation={handleOpenConsultation}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <TodayStatusCard
                    consultationCount={data.consultationsTodayCount}
                    onConsultationPress={handleConsultationPress}
                  />
                  <NextPatientCard
                    consultation={data.nextConsultation}
                    onOpenConsultation={handleOpenConsultation}
                  />
                </>
              )}
              <DoctorQuickActions />
            </View>
            <View style={styles.dashboardColSide}>
              <ProfitStatusCard profit={data.profit} />
            </View>
          </View>
        ) : (
          <>
            <TodayStatusCard
              consultationCount={data.consultationsTodayCount}
              onConsultationPress={handleConsultationPress}
            />
            <NextPatientCard
              consultation={data.nextConsultation}
              onOpenConsultation={handleOpenConsultation}
            />
            <DoctorQuickActions />
            <ProfitStatusCard profit={data.profit} />
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
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.xs,
    paddingBottom: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth: !theme.responsive?.isPortraitShell && (theme.responsive?.isTabletLandscape || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge)
      ? (theme.responsive?.containerMaxWidth || 1440)
      : theme.responsive?.isTabletPortrait ? 760 : undefined,
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
  wideTopGrid: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    alignItems: 'stretch',
    width: '100%',
  },
  wideGridCol: {
    flex: 1,
    minWidth: 0,
  },
  dashboardColMain: {
    flex: theme.responsive?.isDesktopLarge ? 3.2 : 3,
    minWidth: 0,
  },
  dashboardColSide: {
    flex: theme.responsive?.isDesktopLarge ? 1.8 : 2,
    minWidth: 0,
  },
});
