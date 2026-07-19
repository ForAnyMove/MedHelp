import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { HistorySummaryCard } from './components/HistorySummaryCard';
import { HealthMetricsCard } from './components/HealthMetricsCard';
import { AnalysisProgressCard } from './components/AnalysisProgressCard';
import { HistoryTimelineItem } from './components/HistoryTimelineItem';
import { EmptyState } from '../../../components/common/EmptyState';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { Icon } from '../../../components/ui/Icon';
import { formatIsoDate } from '../../../utils/dateUtils';
import { usePatientDashboard } from '../../../context/PatientDashboardContext';
import { PatientAllConsultations } from './extra-screens/PatientAllConsultations';
import { PatientCompletedConsultation } from './extra-screens/PatientCompletedConsultation';
import { DoctorProfileSubView } from './extra-screens/DoctorProfileSubView';
import { ConsultationSummary } from '../consultation/extra-screens/ConsultationSummary';

export function HistoryTab() {
  const { historyController, themeController: { sizes } } = useComponentContext();
  const styles = useStyles(themeStyles);
  const { metrics, analysisSummary, vitamins, timeline, pastConsultations = [] } = historyController;
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState('all'); // 'all' or 'latest'
  const { t } = useTranslation();
  const { historyView, historySelectedId, historyDoctorProfileId, navigateToHistoryAll, navigateToHistoryDetail, navigateBack } = usePatientDashboard();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!cancelled) {
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const currentSummary = React.useMemo(() => {
    let data = pastConsultations || [];
    if (activeSegment === 'latest') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      data = data.filter(c => new Date(c.date) >= weekAgo);
    }
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      ...analysisSummary,
      lastOverview: sortedData.length > 0 ? sortedData[0].date : analysisSummary.lastOverview,
      consultationsCount: data.length,
      analysesCount: activeSegment === 'all' ? analysisSummary.analysesCount : Math.max(0, Math.floor(analysisSummary.analysesCount / 4)),
    };
  }, [pastConsultations, activeSegment, analysisSummary]);

  if (historyView === 'all') {
    return <PatientAllConsultations activeSegment={activeSegment} />;
  }

  if (historyView === 'detail' && historySelectedId) {
    return <PatientCompletedConsultation id={historySelectedId} />;
  }

  if (historyView === 'summary' && historySelectedId) {
    const booking = pastConsultations.find(c => String(c.id) === String(historySelectedId));
    return <ConsultationSummary booking={booking} onClose={() => navigateToHistoryDetail(historySelectedId)} />;
  }

  if (historyView === 'doctor-profile' && historyDoctorProfileId) {
    return <DoctorProfileSubView doctorId={historyDoctorProfileId} onBack={navigateBack} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>

        {/* Removed duplicate segmentRow */}

        <>
          <HistorySummaryCard
            activeSegment={activeSegment}
            onSegmentChange={(v) => setActiveSegment(v)}
            summary={currentSummary}
            onConsultationsPress={() => navigateToHistoryAll(activeSegment)}
          />
          <HealthMetricsCard metrics={metrics} />
          <AnalysisProgressCard vitamins={vitamins} />
          {timeline.map(item => (
            <HistoryTimelineItem key={item.id} item={item} />
          ))}
        </>
      </ScrollView>
    </View>
  );
}

function PastConsultationCard({ consultation: c, styles, sizes, t }) {
  const date = formatIsoDate(c.date, 'medium', t);
  const isCanceled = c.status === 'canceled';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <Image source={{ uri: c.avatarUrl }} style={styles.avatar} />
      <View style={styles.cardBody}>
        <Text style={styles.doctorName}>{c.doctorName}</Text>
        <Text style={styles.specialty}>{c.specialty}</Text>
        <Text style={styles.diagnosis} numberOfLines={1}>{c.diagnosis}</Text>
        <View style={styles.meta}>
          <Icon name="calendar" size={sizes.scale(24)} color={styles.metaIcon.color}  />
          <Text style={styles.metaText}>{date}</Text>
          <Icon name="time" size={sizes.scale(24)} color={styles.metaIcon.color}  />
          <Text style={styles.metaText}>{c.duration} min</Text>
        </View>
      </View>
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, isCanceled && styles.statusDotCanceled]} />
        <Text style={[styles.statusText, isCanceled && styles.statusTextCanceled]}>
          {isCanceled ? (t('history.status.canceled') || 'Canceled') : (t('history.status.completed') || 'Done')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: /* TODO: color */ '#F3F9F9',
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  headerTitle: {
    ...theme.sizes.typography.h2,
    color: /* TODO: color */ '#2D4A4A',
    marginBottom: theme.sizes.spacing.l,
    fontFamily: 'Manrope_700Bold',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.scale(4),
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: theme.colors.p500,
  },
  segBtnText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    fontFamily: 'Manrope_600SemiBold',
  },
  segBtnTextActive: {
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(24),
    marginRight: theme.sizes.spacing.m,
  },
  cardBody: {
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.scale(1),
  },
  specialty: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginBottom: theme.sizes.scale(4),
  },
  diagnosis: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n600,
    marginBottom: theme.sizes.spacing.s,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(4),
  },
  metaIcon: {
    color: theme.colors.n400,
  },
  metaText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
  },
  statusBadge: {
    alignItems: 'center',
    gap: theme.sizes.scale(4),
  },
  statusDot: {
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: /* TODO: color */ '#0E9F6E',
  },
  statusDotCanceled: {
    backgroundColor: theme.colors.error || /* TODO: color */ '#F05252',
  },
  statusText: {
    ...theme.sizes.typography.caption,
    color: /* TODO: color */ '#0E9F6E',
    fontFamily: 'Manrope_600SemiBold',
  },
  statusTextCanceled: {
    color: theme.colors.error || /* TODO: color */ '#F05252',
  },
});
