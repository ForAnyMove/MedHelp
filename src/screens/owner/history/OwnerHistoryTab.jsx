import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../theme/useStyles';
import { useTheme } from '../../../theme/ThemeContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useOwnerDashboard } from '../../../context/OwnerDashboardContext';
import { Icon } from '../../../components/ui/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { OwnerConsultationDetail } from '../calendar/extra-screens/OwnerConsultationDetail';

const STATUS_COLORS = {
  completed: '#10B981',
  scheduled: '#6366F1',
  canceled: '#F05252',
  upcoming: '#6366F1',
};

export function OwnerHistoryTab() {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { ownerController } = useComponentContext();
  const { historyView, historySelectedId, navigateToHistoryDetail, navigateToHistoryAll, navigateBack } = useOwnerDashboard();

  const [filterIndex, setFilterIndex] = useState(0);
  const filters = [t('doctor_history.all'), t('doctor_history.completed'), t('doctor_history.upcoming'), t('doctor_history.canceled')];
  const filterKeys = ['all', 'completed', 'upcoming', 'canceled'];

  const allConsultations = ownerController?.consultations || [];

  const filteredConsultations = useMemo(() => {
    const key = filterKeys[filterIndex];
    if (key === 'all') return allConsultations;
    return allConsultations.filter(c => c.status === key);
  }, [allConsultations, filterIndex]);

  // Sub-view: detail
  if (historyView === 'detail') {
    const consultation = allConsultations.find(c => c.id === historySelectedId);
    return <OwnerConsultationDetail consultation={consultation} onBack={navigateBack} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('owner_history.title')}</Text>
        <Text style={styles.subtitle}>
          {t('owner_history.total', { count: allConsultations.length })}
        </Text>
      </View>

      {/* Stats summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsScrollContent}>
        {[
          { label: t('doctor_history.all'), count: allConsultations.length, color: colors.p500 },
          { label: t('doctor_history.completed'), count: allConsultations.filter(c => c.status === 'completed').length, color: STATUS_COLORS.completed },
          { label: t('doctor_history.upcoming'), count: allConsultations.filter(c => c.status === 'upcoming' || c.status === 'scheduled').length, color: STATUS_COLORS.scheduled },
          { label: t('doctor_history.canceled'), count: allConsultations.filter(c => c.status === 'canceled').length, color: STATUS_COLORS.canceled },
        ].map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.statCard, filterIndex === i && { borderColor: s.color, borderWidth: 2 }]}
            onPress={() => setFilterIndex(i)}
          >
            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredConsultations.length === 0 ? (
          <EmptyState
            icon="medic-history"
            title={t('doctor_history.empty_title')}
            description={t('doctor_history.empty_desc')}
          />
        ) : (
          filteredConsultations.map(c => {
            const date = c.date ? new Date(c.date) : null;
            const dateStr = date ? date.toLocaleDateString(t('common.locale') || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const statusColor = STATUS_COLORS[c.status] || colors.n400;

            return (
              <TouchableOpacity
                key={c.id}
                style={styles.consultCard}
                activeOpacity={0.85}
                onPress={() => navigateToHistoryDetail(c.id)}
              >
                <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <Text style={styles.dateText}>{dateStr}</Text>
                    <Text style={styles.timeText}>{timeStr}</Text>
                  </View>
                  <Text style={styles.doctorName}>{t('doctors.dr_prefix')}{c.doctorName}</Text>
                  <Text style={styles.patientName}>{t('owner_calendar.patient')}: {c.patientName}</Text>
                  <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {t(`doctor_history.status_${c.status}`) || c.status}
                      </Text>
                    </View>
                    {c.price ? <Text style={styles.priceText}>${c.price}</Text> : null}
                  </View>
                </View>
                <Icon name="arrow-forward" size={sizes.scale(20)} color={colors.n400} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginTop: theme.sizes.scale(2),
  },
  statsScroll: { maxHeight: theme.sizes.scale(100) },
  statsScrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
    gap: theme.sizes.spacing.s,
  },
  statCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    alignItems: 'center',
    minWidth: theme.sizes.scale(80),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.n200,
  },
  statCount: {
    ...theme.sizes.typography.h3,
    fontFamily: 'Manrope_700Bold',
  },
  statLabel: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  consultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    marginBottom: theme.sizes.spacing.m,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusStripe: { width: theme.sizes.scale(4), alignSelf: 'stretch' },
  cardBody: {
    flex: 1,
    padding: theme.sizes.spacing.m,
    gap: theme.sizes.scale(3),
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    fontFamily: 'Manrope_600SemiBold',
  },
  timeText: { ...theme.sizes.typography.bodySmall, color: theme.colors.n400 },
  doctorName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  patientName: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.sizes.scale(4) },
  statusBadge: {
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(3),
    borderRadius: theme.sizes.borderRadius.full,
  },
  statusText: { ...theme.sizes.typography.caption, fontFamily: 'Manrope_600SemiBold' },
  priceText: { ...theme.sizes.typography.bodySmall, color: theme.colors.p500, fontFamily: 'Manrope_700Bold' },
});
