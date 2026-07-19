import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { usePatientDashboard } from '../../context/PatientDashboardContext';
import { useComponentContext } from '../../context/GlobalContext';
import { ActivityIndicator } from 'react-native';

export function NextSteps() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { navigateToSymptomChecker, navigateToSymptomCheckerResult, navigateToDoctors, navigateToDashboard, navigateToHistory } = usePatientDashboard();
  const { checkupsApi } = useComponentContext();
  const [loadingStepId, setLoadingStepId] = React.useState(null);

  const steps = [
    { id: 1, title: t('dashboard.find_doctor'), desc: t('dashboard.find_doctor_desc'), icon: 'doctor-01', color: colors.sCoral },
    { id: 2, title: t('dashboard.view_history'), desc: t('dashboard.view_history_desc'), icon: 'stethoscope', color: colors.sYell },
    { id: 3, title: t('dashboard.urgency_level'), desc: t('dashboard.urgency_desc'), icon: 'microscope', color: colors.sBlue },
  ];

  const handleStepPress = async (stepId) => {
    if (stepId === 1) {
      navigateToDoctors();
    } else if (stepId === 2) {
      navigateToHistory();
    } else if (stepId === 3) {
      setLoadingStepId(3);
      try {
        const latestCheckup = await checkupsApi.getLatest();
        if (latestCheckup) {
          navigateToSymptomCheckerResult(latestCheckup);
        } else {
          navigateToSymptomChecker();
        }
      } catch (e) {
        if (e.status === 404) {
          navigateToSymptomChecker();
        } else {
          console.error(e);
          navigateToSymptomChecker(); // fallback
        }
      } finally {
        setLoadingStepId(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.next_steps')}</Text>
      <View style={styles.card}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <TouchableOpacity 
              style={styles.stepRow} 
              activeOpacity={0.7}
              onPress={() => handleStepPress(step.id)}
              disabled={loadingStepId === step.id}
            >
              <View style={styles.leftContent}>
                <Icon name={step.icon} size={sizes.scale(24)} color={step.color} wrapped wrapperStyle={styles.iconWrapper} />
                <View style={styles.textContent}>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.desc} numberOfLines={1} ellipsizeMode="tail">{step.desc}</Text>
                </View>
              </View>
              {loadingStepId === step.id ? (
                <ActivityIndicator size="small" color={colors.p500} />
              ) : (
                <Icon name="arrow-right" size={sizes.scale(24)} color={colors.p500} />
              )}
            </TouchableOpacity>
            {index < steps.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    fontWeight: '700',
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.m,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.sizes.spacing.xs,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: theme.sizes.spacing.m,
  },
  iconWrapper: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  textContent: {
    flex: 1,
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.n700,
  },
  desc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },
  divider: {
    height: theme.sizes.scale(1),
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  }
});
