import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { Icon } from '../../../components/ui/Icon';

import { ConsultationCard } from '../../../components/doctor-dashboard/ConsultationCard';
import { PatientCard } from './extra-screens/PatientCard';
import { PatientDetails } from './extra-screens/PatientDetails';
import { OngoingConsultation } from './extra-screens/OngoingConsultation';
import { DoctorConsultationSummary } from './extra-screens/DoctorConsultationSummary';
import { AvailabilityModal } from './components/AvailabilityModal';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { useComponentContext } from '../../../context/GlobalContext';

export function DoctorConsultationTab() {
  const styles = useStyles(themeStyles);
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const { doctorProfileController } = useComponentContext();
  const {
    currentView,
    consultationStatus,
    selectedConsultation,
    navigateToPatientCard,
    navigateToPatientDetails,
    navigateBack,
    startConsultation,
    endConsultation,
    isAvailabilityModalVisible,
    setIsAvailabilityModalVisible
  } = useDoctorDashboard();

  const groupedConsultations = doctorProfileController.getGroupedConsultations();

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('consultation.title')}</Text>
          <TouchableOpacity 
            style={styles.calendarBtn}
            onPress={() => setIsAvailabilityModalVisible(true)}
          >
            <Icon name="calendar" size={sizes.scale(24)} color={colors.p500} wrapperStyle={styles.iconBox} wrapped />
          </TouchableOpacity>
        </View>

        {groupedConsultations.map((group, idx) => {
          const displayTitle = group.title.startsWith('common.') ? t(group.title) : group.title;
          const hasData = group.data.length > 0;

          return (
            <View key={idx} style={styles.group}>
              <Text style={styles.groupTitle}>{displayTitle}</Text>
              {hasData ? (
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
              ) : (
                <View style={styles.emptyGroup}>
                  <Text style={styles.emptyGroupText}>{t('consultation.no_consultations_day')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <AvailabilityModal 
        visible={isAvailabilityModalVisible} 
        onClose={() => setIsAvailabilityModalVisible(false)} 
      />
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  calendarBtn: {
    // 
  },
  iconBox: {
    backgroundColor: theme.colors.opacityP100,
    borderRadius: theme.sizes.borderRadius.full,
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.xl,
  },
  group: {
    marginBottom: theme.sizes.spacing.m,
  },
  groupTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xs,
  },
  horizontalScroll: {
    paddingLeft: theme.sizes.spacing.m,
    paddingRight: theme.sizes.spacing.s,
  },
  emptyGroup: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  emptyGroupText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n400,
  }
});
