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
  const { sizes, colors } = useTheme();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = React.useState(false);
  
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
      </ScrollView>

      <BottomSheet
        visible={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        initialHeight={sizes.height}
      >
        <ProfileNotifications user={user} />
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
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.xs,
    paddingBottom: theme.sizes.spacing.xl,
  }
});
