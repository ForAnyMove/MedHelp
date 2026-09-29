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

export function HomeTab() {
  const styles = useStyles(themeStyles);
  const { currentView, navigateToUpload, navigateToSymptomChecker, scrollViewRef } = usePatientDashboard();
  const { sizes, colors } = useTheme();
  const { user } = useComponentContext();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = React.useState(false);

  const handleAction = (id) => {
    if (id === 'upload') {
      navigateToUpload();
    } else if (id === 'checker' || id === 'symptom-checker') {
      navigateToSymptomChecker();
    } else {
      console.log('Action:', id);
    }
  };

  if (currentView === 'upload') {
    return <UploadAnalysis />;
  }

  if (currentView === 'symptom-checker') {
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
        <LabResultsBanner />
        <HealthOverview />
        <QuickActions onAction={handleAction} />
        <Reminders />
        <NextSteps />
        <HealthIndications />
        <HealthNotes />
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
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.xl, 
  }
});
