import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { useComponentContext } from '../../context/GlobalContext';
import { usePatientDashboard } from '../../context/PatientDashboardContext';

export function HealthOverview() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const router = useRouter();
  const { consultationController, labResultsApi, user } = useComponentContext();
  const { navigateToHistoryDetail } = usePatientDashboard();

  const [labResults, setLabResults] = useState([]);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        if (user?.id && labResultsApi) {
          const res = await labResultsApi.getPatientLabResults(user.id);
          if (res && res.data) {
            setLabResults(res.data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLabs();
  }, [user?.id, labResultsApi]);

  const readyLab = useMemo(() => {
    return labResults.find(r => r.status === 'ready' && !r.is_viewed);
  }, [labResults]);

  const waitingLab = useMemo(() => {
    return labResults.find(r => r.status === 'waiting');
  }, [labResults]);

  const readyConsultation = useMemo(() => {
    if (!consultationController?.allConsultations) return null;
    const completed = consultationController.allConsultations.filter(c => c.status === 'completed' && c.results && c.results.length > 0 && !c.results[0]?.is_draft);
    if (completed.length === 0) return null;
    const latest = completed[0];
    const resultDate = new Date(latest.results[0]?.created_at || new Date());
    const now = new Date();
    const diffHours = (now - resultDate) / (1000 * 60 * 60);
    return diffHours < 72 ? latest : null;
  }, [consultationController?.allConsultations]);

  const waitingConsultation = useMemo(() => {
    if (!consultationController?.allConsultations) return null;
    return consultationController.allConsultations.find(c => 
      c.status === 'completed' && (!c.results || c.results.length === 0 || c.results[0]?.is_draft)
    );
  }, [consultationController?.allConsultations]);

  let activeState = 'default';
  if (readyConsultation) activeState = 'readyConsultation';
  else if (readyLab) activeState = 'readyLab';
  else if (waitingConsultation) activeState = 'waitingConsultation';
  else if (waitingLab) activeState = 'waitingLab';

  if (activeState === 'readyConsultation') {
    const docName = readyConsultation.doctor?.profile?.last_name 
      ? `${t('doctors.dr_prefix', 'Dr. ')}${readyConsultation.doctor.profile.last_name}` 
      : 'The doctor';
    
    return (
      <View style={[styles.container, { backgroundColor: /* TODO: color */ '#13C2C2' }]}>
        <Text style={[styles.title, { color: colors.white }]}>{t('dashboard.health_overview_title') || 'Your health overview'}</Text>
        <View style={styles.card}>
          <View style={[styles.headerRow, { justifyContent: 'flex-start', gap: sizes.spacing.m }]}>
            <View style={[styles.statusChip, { backgroundColor: /* TODO: color */ '#13C2C2' }]}>
              <Icon name="check2" size={sizes.scale(16)} color={colors.white} />
              <Text style={styles.statusText}>{t('dashboard.results_ready', 'Results ready')}</Text>
            </View>
            <Text style={styles.timeText}>{docName}</Text>
          </View>
          <Text style={[styles.description, { color: /* TODO: color */ '#00474F', fontFamily: 'Manrope_700Bold' }]}>
            {t('dashboard.results_ready_desc', 'The doctor has finished your summary & recommendations. You can view them now.')}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: colors.white, borderRadius: sizes.borderRadius.full, paddingVertical: sizes.spacing.m, borderColor: /* TODO: color */ '#13C2C2', borderWidth: 1, alignItems: 'center' }}
            onPress={() => navigateToHistoryDetail(readyConsultation.id)}
          >
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: sizes.scale(16), color: /* TODO: color */ '#13C2C2' }}>{t('dashboard.view_results', 'View Results')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (activeState === 'readyLab') {
    return (
      <View style={[styles.container, { backgroundColor: /* TODO: color */ '#13C2C2' }]}>
        <Text style={[styles.title, { color: colors.white }]}>{t('dashboard.health_overview_title') || 'Your health overview'}</Text>
        <View style={styles.card}>
          <View style={[styles.headerRow, { justifyContent: 'flex-start', gap: sizes.spacing.m }]}>
            <View style={[styles.statusChip, { backgroundColor: /* TODO: color */ '#13C2C2' }]}>
              <Icon name="files" size={sizes.scale(16)} color={colors.white} />
              <Text style={styles.statusText}>{t('dashboard.lab_results_ready', 'Lab Results Ready')}</Text>
            </View>
          </View>
          <Text style={[styles.description, { color: /* TODO: color */ '#00474F', fontFamily: 'Manrope_700Bold' }]}>
            {t('dashboard.lab_results_ready_desc', 'Your lab test results are ready for your review.')}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: colors.white, borderRadius: sizes.borderRadius.full, paddingVertical: sizes.spacing.m, borderColor: /* TODO: color */ '#13C2C2', borderWidth: 1, alignItems: 'center' }}
            onPress={() => router.push('/lab-results')}
          >
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: sizes.scale(16), color: /* TODO: color */ '#13C2C2' }}>{t('dashboard.view_lab_results', 'View Lab Results')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (activeState === 'waitingConsultation') {
    const docName = waitingConsultation.doctor?.profile?.last_name 
      ? `${t('doctors.dr_prefix', 'Dr. ')}${waitingConsultation.doctor.profile.last_name}` 
      : 'The doctor';

    return (
      <View style={[styles.container, { backgroundColor: /* TODO: color */ '#FFC000' }]}>
        <Text style={[styles.title, { color: colors.white }]}>{t('dashboard.health_overview_title') || 'Your health overview'}</Text>
        
        <View style={styles.card}>
          <View style={[styles.headerRow, { justifyContent: 'flex-start', gap: sizes.spacing.m }]}>
            <View style={[styles.statusChip, { backgroundColor: /* TODO: color */ '#FFC000' }]}>
              <Icon name="loader-circle" size={sizes.scale(16)} color={colors.white}  />
              <Text style={styles.statusText}>{t('dashboard.preparing_results', 'Preparing results')}</Text>
            </View>
            <Text style={styles.timeText}>{docName}</Text>
          </View>

          <Text style={[styles.description, { color: /* TODO: color */ '#00474F', fontFamily: 'Manrope_700Bold' }]}>
            {t('dashboard.preparing_results_desc', 'Your consultation has ended. The doctor is writing your summary & recommendations.')}
          </Text>

          <View style={{ backgroundColor: /* TODO: color */ '#E6FFFB', borderRadius: sizes.borderRadius.full, paddingVertical: sizes.spacing.s, paddingHorizontal: sizes.spacing.m, flexDirection: 'row', alignItems: 'center', marginBottom: sizes.spacing.m, alignSelf: 'flex-start' }}>
              <Icon name="time" size={sizes.scale(24)} color=/* TODO: color */ "#13C2C2"  />
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: sizes.scale(14), color: /* TODO: color */ '#13C2C2', marginLeft: sizes.spacing.s }}>{t('dashboard.ready_within_30', 'Usually ready within 30 min')}</Text>
          </View>

          <TouchableOpacity 
            style={{ backgroundColor: colors.white, borderRadius: sizes.borderRadius.full, paddingVertical: sizes.spacing.m, borderColor: /* TODO: color */ '#13C2C2', borderWidth: 1, alignItems: 'center' }}
            onPress={() => router.push(`/consultations/waiting?id=${waitingConsultation.id}`)}
          >
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: sizes.scale(16), color: /* TODO: color */ '#13C2C2' }}>{t('dashboard.notify_when_ready', "We'll notify you when ready")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (activeState === 'waitingLab') {
    return (
      <View style={[styles.container, { backgroundColor: /* TODO: color */ '#FFC000' }]}>
        <Text style={[styles.title, { color: colors.white }]}>{t('dashboard.health_overview_title') || 'Your health overview'}</Text>
        <View style={styles.card}>
          <View style={[styles.headerRow, { justifyContent: 'flex-start', gap: sizes.spacing.m }]}>
            <View style={[styles.statusChip, { backgroundColor: /* TODO: color */ '#FFC000' }]}>
              <Icon name="loader-circle" size={sizes.scale(16)} color={colors.white}  />
              <Text style={styles.statusText}>{t('dashboard.waiting_for_labs', 'Waiting for Labs')}</Text>
            </View>
          </View>
          <Text style={[styles.description, { color: /* TODO: color */ '#00474F', fontFamily: 'Manrope_700Bold' }]}>
            {t('dashboard.waiting_for_labs_desc', "Your lab test is being processed. We will notify you when it's ready.")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dashboard.health_overview_title')}</Text>
      
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.statusChip}>
            <View  style={styles.statusChipIcon}>
              <Icon name="check2" size={sizes.scale(16)} color={colors.white} />
            </View>
            <Text style={styles.statusText}>{t('dashboard.all_good')}</Text>
          </View>
          <Text style={styles.timeText}>{t('dashboard.last_2_months')}</Text>
        </View>

        <Text style={styles.description}>{t('dashboard.overview_desc')}</Text>

        <Button 
          title={t('dashboard.explain_results_btn')} 
          variant="primary" 
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h4,
    color: theme.colors.white,
    marginBottom: theme.sizes.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.scale(2),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p500,
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(4),
    borderRadius: theme.sizes.borderRadius.full,
  },
  statusChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  statusText: {
    fontSize: theme.sizes.scale(16),
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.white,
    marginLeft: theme.sizes.spacing.xs,
  },
  timeText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  },
  description: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  button: {
    paddingVertical: theme.sizes.scale(10),
  },
  buttonText: {
    fontSize: theme.sizes.scale(18),
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.white,
  }
});
