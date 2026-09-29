import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../theme/useStyles';
import { useTheme } from '../../../theme/ThemeContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useOwnerDashboard } from '../../../context/OwnerDashboardContext';
import { Icon } from '../../../components/ui/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { OwnerConsultationDetail } from './extra-screens/OwnerConsultationDetail';
import { ExpandableCalendar } from './components/ExpandableCalendar';

const STATUS_COLORS = {
  completed: '#10B981',
  scheduled: '#6366F1',
  canceled: '#F05252',
  upcoming: '#6366F1',
};

export function OwnerCalendarTab() {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { ownerController } = useComponentContext();
  const { calendarView, navigateToConsultationDetail, navigateBack, selectedConsultationId } = useOwnerDashboard();

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const allConsultations = ownerController?.consultations || [];

  // Group consultations by date
  const byDate = useMemo(() => {
    const map = {};
    allConsultations.forEach(c => {
      const d = c.date ? c.date.split('T')[0] : null;
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(c);
      }
    });
    return map;
  }, [allConsultations]);

  const selectedConsultations = byDate[selectedDate] || [];

  if (calendarView === 'consultation-detail') {
    const consultation = allConsultations.find(c => c.id === selectedConsultationId);
    return <OwnerConsultationDetail consultation={consultation} onBack={navigateBack} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('owner_calendar.title')}</Text>

      {/* Expandable Calendar */}
      <ExpandableCalendar 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        byDate={byDate}
      />

      {/* Selected day consultations */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dateLabel}>
          {new Date(selectedDate).toLocaleDateString(t('common.locale') || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {selectedConsultations.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={t('consultation.no_consultations_day')}
            description=""
          />
        ) : (
          selectedConsultations.map(c => {
            const time = c.date ? new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const statusColor = STATUS_COLORS[c.status] || colors.n400;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.consultCard}
                activeOpacity={0.85}
                onPress={() => navigateToConsultationDetail(c.id)}
              >
                <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
                <View style={styles.consultBody}>
                  <View style={styles.consultTop}>
                    <Text style={styles.consultTime}>{time}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {t(`doctor_history.status_${c.status}`) || c.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.doctorName}>{t('doctors.dr_prefix')}{c.doctorName}</Text>
                  <Text style={styles.patientName}>{t('owner_calendar.patient')}: {c.patientName}</Text>
                  {c.diagnosis && (
                    <Text style={styles.diagnosis} numberOfLines={1}>{c.diagnosis}</Text>
                  )}
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
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
  },
  dayNum: { ...theme.sizes.typography.bodyMedium, color: theme.colors.n900, fontFamily: 'Manrope_700Bold' },
  dayNumSelected: { color: theme.colors.white },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  dateLabel: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: theme.sizes.spacing.m,
    textTransform: 'capitalize',
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
  statusStripe: {
    width: theme.sizes.scale(4),
    alignSelf: 'stretch',
  },
  consultBody: {
    flex: 1,
    padding: theme.sizes.spacing.m,
    gap: theme.sizes.scale(3),
  },
  consultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consultTime: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  statusBadge: {
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(3),
    borderRadius: theme.sizes.borderRadius.full,
  },
  statusText: { ...theme.sizes.typography.caption, fontFamily: 'Manrope_600SemiBold' },
  doctorName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  patientName: { ...theme.sizes.typography.caption, color: theme.colors.n600 },
  diagnosis: { ...theme.sizes.typography.caption, color: theme.colors.n400, fontStyle: 'italic' },
});
