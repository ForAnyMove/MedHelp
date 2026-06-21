import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../src/theme/useStyles';
import { useTheme } from '../../src/theme/ThemeContext';
import { useComponentContext } from '../../src/context/GlobalContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/ui/Button';
import { formatIsoDate } from '../../src/utils/dateUtils';
import { Icon } from '../../src/components/ui/Icon';

export default function AppointmentConfirmedScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const router = useRouter();
  const { colors, sizes } = useTheme();

  const { consultationController } = useComponentContext();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        // Assuming consultationManager has getConsultation or similar, 
        // or we just find it from existing array if loaded.
        // For now let's try to get it from the list
        if (consultationController.consultations) {
          const found = consultationController.consultations.find(c => c.id === id);
          if (found) {
            setConsultation(found);
            return;
          }
        }
        // If not found in the list, we would ideally fetch it from API
        // const res = await consultationController.api.get(`/consultations/${id}`);
        // setConsultation(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchConsultation();
    }
  }, [id, consultationController.consultations]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.p500} />
        </View>
      </SafeAreaView>
    );
  }

  // Fallbacks if data is missing
  const doctorName = consultation?.doctor?.firstName ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}` : 'Dr. Doctor';
  const profName = consultation?.doctor?.professionNames?.[0] || 'General Practitioner';

  const dateStr = consultation?.slot?.date || new Date().toISOString();
  const timeStr = consultation?.slot?.time || '11:00';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-left" size={sizes.scale(24)} color={colors.n700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.confirmed_appointment', 'Appointment confirmed')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconBox}>
            <Icon name="check" size={sizes.scale(20)} color={colors.white} />
          </View>
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>{t('notifications.confirmed_appointment', 'Appointment confirmed')}</Text>
            {/* Hardcoded 'just now' for UI purposes as we might not have the notification's created_at here */}
            <Text style={styles.successTime}>{t('common.time.just_now', 'Just now')}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.doctorInfoRow}>
            <Avatar url={consultation?.doctor?.avatarUrl} size={sizes.scale(48)} />
            <View style={styles.doctorTextCol}>
              <Text style={styles.doctorName}>Dr. {doctorName}</Text>
              <Text style={styles.doctorProf}>{profName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Icon name="calendar" size={sizes.scale(20)} color={colors.p500} />
            <Text style={styles.detailLabel}>{t('common.date', 'Date')}:</Text>
            <Text style={styles.detailValue}>{formatIsoDate(dateStr, 'full', t)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="clock" size={sizes.scale(20)} color={colors.p500} />
            <Text style={styles.detailLabel}>{t('common.time', 'Time')}:</Text>
            <Text style={styles.detailValue}>{timeStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="video" size={sizes.scale(20)} color={colors.p500} />
            <Text style={styles.detailLabel}>{t('consultation.format', 'Format')}:</Text>
            <Text style={styles.detailValue}>{t('consultation.format_online', 'Online (video)')}</Text>
          </View>

          <TouchableOpacity style={styles.calendarBtn}>
            <Icon name="calendar-plus" size={sizes.scale(20)} color={colors.p500} />
            <Text style={styles.calendarBtnText}>{t('consultation.added_to_calendar', 'Added to your calendar')}</Text>
          </TouchableOpacity>
        </View>

        {/* Preparation Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Icon name="info" size={sizes.scale(20)} color={colors.p500} />
            <Text style={styles.notesTitle}>{t('consultation.preparation_notes', 'Preparation notes')}</Text>
          </View>
          <Text style={styles.notesDesc}>
            {t('consultation.preparation_notes_desc', 'Please have your recent test results ready. Avoid eating 2 hours before the consultation.')}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('consultation.view_appointment', 'View appointment')}
          variant="outlined"
          onPress={() => router.push(`/(app)/consultation?id=${id}`)}
        />
      </View>
    </SafeAreaView>
  );
}

const themeStyles = (theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(56),
  },
  backBtn: {
    padding: theme.sizes.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  placeholder: {
    width: theme.sizes.scale(32),
  },

  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xxl,
    gap: theme.sizes.spacing.m,
  },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p100,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.p500,
  },
  successIconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
  },
  successTime: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginTop: theme.sizes.scale(2),
  },

  // Info Card
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorTextCol: {
    marginLeft: theme.sizes.spacing.m,
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  doctorProf: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginTop: theme.sizes.scale(2),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginVertical: theme.sizes.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  detailLabel: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginLeft: theme.sizes.spacing.s,
    width: theme.sizes.scale(70),
  },
  detailValue: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
    textAlign: 'right',
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.p100,
    borderRadius: theme.sizes.borderRadius.medium,
    paddingVertical: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.xs,
  },
  calendarBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
  },

  // Notes Card
  notesCard: {
    backgroundColor: theme.colors.p100,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.p500,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  notesTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
  },
  notesDesc: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n700,
  },

  // Footer
  footer: {
    paddingBottom: theme.sizes.scale(28),
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.scale(14),
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  }
});
