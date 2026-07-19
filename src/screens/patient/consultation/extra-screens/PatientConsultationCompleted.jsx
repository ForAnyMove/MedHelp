import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

export function PatientConsultationCompleted({ booking, onBackToHome }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const doctorName = booking?.doctorName || (booking?.doctor?.profile?.first_name 
    ? `${booking.doctor.profile.first_name} ${booking.doctor.profile.last_name}` 
    : 'Doctor');

  return (
    <SubViewScreen title={t('consultation.rating_title', 'Consultation')} hideHeader>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToHome} style={styles.closeButton}>
          <Icon name="x" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hourglass Icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>
            <Icon name="clock" size={sizes.scale(40)} color={colors.p500} />
          </View>
        </View>

        <Text style={styles.title}>{t('consultation.completed_title', 'Consultation completed')}</Text>
        <Text style={styles.subtitle}>
          {t('consultation.preparing_summary', { 
             doctorName: `Dr. ${doctorName}`,
             defaultValue: `Dr. ${doctorName} is preparing your summary and recommendations.`
          })}
        </Text>

        <View style={styles.timeCard}>
          <Icon name="clock" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.timeText}>{t('consultation.ready_within', 'Usually ready within 30 min')}</Text>
        </View>

        <Text style={styles.noticeText}>
          {t('consultation.notify_when_ready', "We'll notify you the moment it's ready — feel free to close the app.")}
        </Text>

        <TouchableOpacity onPress={onBackToHome} style={styles.homeButtonContainer}>
          <Text style={styles.homeButtonText}>{t('consultation.back_to_home', 'Back to home')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
  },
  closeButton: {
    padding: theme.sizes.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.xl,
    paddingBottom: theme.sizes.spacing.xl,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: theme.sizes.spacing.xl,
  },
  iconContainer: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.scale(40),
    backgroundColor: theme.colors.p50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.p100,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  subtitle: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.l,
    lineHeight: theme.sizes.scale(22),
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p50,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
  },
  timeText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
    fontFamily: 'Manrope_600SemiBold',
  },
  noticeText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(60),
    lineHeight: theme.sizes.scale(22),
  },
  homeButtonContainer: {
    padding: theme.sizes.spacing.m,
  },
  homeButtonText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
    textDecorationLine: 'underline',
  }
});
