import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';

const STATUS_COLORS = {
  completed: '#10B981',
  scheduled: '#6366F1',
  canceled: '#F05252',
  upcoming: '#6366F1',
};

export function OwnerConsultationDetail({ consultation, onBack }) {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();

  if (!consultation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.notFoundText}>{t('common.unknown')}</Text>
      </View>
    );
  }

  const date = consultation.date ? new Date(consultation.date) : null;
  const dateStr = date ? date.toLocaleDateString(t('common.locale') || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const statusColor = STATUS_COLORS[consultation.status] || colors.n400;

  const rows = [
    { label: t('doctor_history.label_date'), value: dateStr },
    { label: t('doctor_history.label_time'), value: timeStr },
    { label: t('owner_calendar.doctor_label'), value: `${t('doctors.dr_prefix')}${consultation.doctorName || ''}` },
    { label: t('owner_calendar.patient_label'), value: consultation.patientName || t('common.unknown') },
    { label: t('doctor_history.label_format'), value: consultation.format === 'online' ? t('doctor_history.format_online') : t('doctor_history.format_offline') },
    { label: t('doctors.price'), value: consultation.price ? `$${consultation.price}` : '—' },
    { label: t('doctor_history.label_status'), value: t(`doctor_history.status_${consultation.status}`) || consultation.status },
  ].filter(r => r.value && r.value !== '—' && r.value !== 'undefined');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusColor }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('owner_calendar.detail_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`doctor_history.status_${consultation.status}`) || consultation.status}
          </Text>
        </View>

        {/* Detail rows */}
        <View style={styles.detailCard}>
          {rows.map((row, i) => (
            <View key={i} style={[styles.detailRow, i < rows.length - 1 && styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Diagnosis */}
        {consultation.diagnosis && (
          <View style={styles.diagnosisCard}>
            <Text style={styles.diagnosisTitle}>{t('doctor_history.diagnosis')}</Text>
            <Text style={styles.diagnosisText}>{consultation.diagnosis}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  backButton: { padding: theme.sizes.spacing.xs },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: theme.sizes.scale(32) },
  scrollContent: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(6),
    alignSelf: 'flex-start',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    marginBottom: theme.sizes.spacing.l,
  },
  statusDot: {
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
  },
  statusText: { ...theme.sizes.typography.bodySmall, fontFamily: 'Manrope_600SemiBold' },
  detailCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  detailLabel: { ...theme.sizes.typography.bodyMedium, color: theme.colors.n500 },
  detailValue: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.sizes.spacing.m,
  },
  diagnosisCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  diagnosisTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
  },
  diagnosisText: { ...theme.sizes.typography.bodyMedium, color: theme.colors.n600 },
  notFoundText: { ...theme.sizes.typography.bodyMedium, color: theme.colors.n500 },
});
