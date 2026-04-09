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
import { myDoctorProfileManager } from '../../../managers/myDoctorProfileManager';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';

export function DoctorHomeTab() {
  const styles = useStyles(themeStyles);
  const { navigateToPatientCard, setTabIndex, scrollViewRef } = useDoctorDashboard();
  const data = myDoctorProfileManager.getDashboardData();

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
        <DoctorHeader profile={data.profile} />
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
