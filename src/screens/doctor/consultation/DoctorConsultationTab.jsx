import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';

import { ConsultationCard } from '../../../components/doctor-dashboard/ConsultationCard';
import { PatientCard } from './extra-screens/PatientCard';
import { PatientDetails } from './extra-screens/PatientDetails';
import { OngoingConsultation } from './extra-screens/OngoingConsultation';
import { DoctorConsultationSummary } from './extra-screens/DoctorConsultationSummary';
import { myDoctorProfileManager } from '../../../managers/myDoctorProfileManager';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';

export function DoctorConsultationTab() {
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { 
    currentView, 
    consultationStatus, 
    selectedConsultation, 
    navigateToPatientCard,
    navigateToPatientDetails,
    navigateBack,
    startConsultation,
    endConsultation
  } = useDoctorDashboard();
  
  const groupedConsultations = myDoctorProfileManager.getGroupedConsultations();

  if (consultationStatus === 'summary') {
    return <DoctorConsultationSummary consultation={selectedConsultation} />;
  }

  if (consultationStatus === 'ongoing') {
    return <OngoingConsultation consultation={selectedConsultation} onEndConsultation={endConsultation} />;
  }

  if (currentView === 'patient-card') {
    return (
      <PatientCard 
        consultation={selectedConsultation} 
        onBack={navigateBack} 
        onViewDetails={navigateToPatientDetails}
        onStartConsultation={startConsultation}
      />
    );
  }

  if (currentView === 'patient-details') {
    return <PatientDetails patient={selectedConsultation.patient} onBack={navigateBack} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('consultation.title')}</Text>
        
        {groupedConsultations.map((group, idx) => (
          <View key={idx} style={styles.group}>
             <Text style={styles.groupTitle}>{t(group.title)}</Text>
             <ScrollView 
               horizontal 
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.horizontalScroll}
               nestedScrollEnabled
             >
               {group.data.map(consultation => (
                 <ConsultationCard 
                   key={consultation.id} 
                   consultation={consultation} 
                   onPress={navigateToPatientCard}
                 />
               ))}
             </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerTitle: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.m,
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.xl,
  },
  group: {
    marginBottom: theme.sizes.spacing.xl,
  },
  groupTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
  },
  horizontalScroll: {
    paddingLeft: theme.sizes.spacing.l,
    paddingRight: theme.sizes.spacing.s,
  }
});
