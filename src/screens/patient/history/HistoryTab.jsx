import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
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

export function HistoryTab() {
  const { historyController, themeController: { sizes } } = useComponentContext();
  const { metrics, analysisSummary, vitamins, timeline, pastConsultations = [] } = historyController;
  const styles = useStyles(themeStyles);
  const [activeSegment, setActiveSegment] = useState('overview'); // 'overview' | 'consultations'
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!cancelled) {
        setConsultations(pastConsultations);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>

        {/* Segment control */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segBtn, activeSegment === 'overview' && styles.segBtnActive]}
            onPress={() => setActiveSegment('overview')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segBtnText, activeSegment === 'overview' && styles.segBtnTextActive]}>
              {t('history.overview') || 'Overview'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, activeSegment === 'consultations' && styles.segBtnActive]}
            onPress={() => setActiveSegment('consultations')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segBtnText, activeSegment === 'consultations' && styles.segBtnTextActive]}>
              {t('history.consultations') || 'Consultations'}
            </Text>
          </TouchableOpacity>
        </View>

        {activeSegment === 'overview' ? (
          <>
            <HistorySummaryCard
              activeSegment={activeSegment}
              onSegmentChange={() => {}}
              summary={analysisSummary}
            />
            <HealthMetricsCard metrics={metrics} />
            <AnalysisProgressCard vitamins={vitamins} />
            {timeline.map(item => (
              <HistoryTimelineItem key={item.id} item={item} />
            ))}
          </>
        ) : (
          <>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)
            ) : consultations.length === 0 ? (
              <EmptyState
                icon="ClipboardList"
                title={t('history.empty_title') || 'No consultations yet'}
                description={t('history.empty_desc') || 'Your past consultations will appear here.'}
              />
            ) : (
              consultations.map(c => (
                <PastConsultationCard key={c.id} consultation={c} styles={styles} t={t} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PastConsultationCard({ consultation: c, styles, t }) {
  const date = formatIsoDate(c.date, 'medium', t);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <Image source={{ uri: c.avatarUrl }} style={styles.avatar} />
      <View style={styles.cardBody}>
        <Text style={styles.doctorName}>{c.doctorName}</Text>
        <Text style={styles.specialty}>{c.specialty}</Text>
        <Text style={styles.diagnosis} numberOfLines={1}>{c.diagnosis}</Text>
        <View style={styles.meta}>
          <Icon name="Calendar" size={12} color={styles.metaIcon.color} />
          <Text style={styles.metaText}>{date}</Text>
          <Icon name="Clock" size={12} color={styles.metaIcon.color} />
          <Text style={styles.metaText}>{c.duration} min</Text>
        </View>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{t('history.status.completed') || 'Done'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: '#F3F9F9',
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  headerTitle: {
    ...theme.sizes.typography.h2,
    color: '#2D4A4A',
    marginBottom: theme.sizes.spacing.l,
    fontFamily: 'Manrope_700Bold',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: 4,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.sizes.spacing.m,
  },
  cardBody: {
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 1,
  },
  specialty: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginBottom: 4,
  },
  diagnosis: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n600,
    marginBottom: theme.sizes.spacing.s,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E9F6E',
  },
  statusText: {
    ...theme.sizes.typography.caption,
    color: '#0E9F6E',
    fontFamily: 'Manrope_600SemiBold',
  },
});
