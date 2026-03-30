import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { Icon } from '../../../components/ui/Icon';
import { formatIsoDate } from '../../../utils/dateUtils';

export function DoctorHistoryTab() {
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { historyController } = useComponentContext();
  const { doctorPastConsultations = [] } = historyController;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate async fetch (swap for Supabase later)
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!cancelled) setConsultations(doctorPastConsultations);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />);
    }
    if (error) {
      return (
        <ErrorState
          message={error}
          onRetry={() => setLoading(true)}
        />
      );
    }
    if (consultations.length === 0) {
      return (
        <EmptyState
          icon="ClipboardList"
          title={t('doctor_history.empty_title') || 'No consultations yet'}
          description={t('doctor_history.empty_desc') || 'Your completed consultations will appear here.'}
        />
      );
    }

    return consultations.map((c) => (
      <ConsultationHistoryCard key={c.id} consultation={c} styles={styles} t={t} />
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('doctor_history.title') || 'Consultation History'}</Text>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

function ConsultationHistoryCard({ consultation: c, styles, t }) {
  const date = formatIsoDate(c.date, 'medium', t);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <Image source={{ uri: c.avatarUrl }} style={styles.avatar} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.patientName}>{c.patientName}</Text>
          <View style={styles.earningBadge}>
            <Text style={styles.earningText}>+${c.earnings}</Text>
          </View>
        </View>
        <Text style={styles.diagnosis} numberOfLines={1}>{c.diagnosis}</Text>
        <View style={styles.meta}>
          <Icon name="Calendar" size={12} color={styles.metaIcon.color} />
          <Text style={styles.metaText}>{date}</Text>
          <Icon name="Clock" size={12} color={styles.metaIcon.color} />
          <Text style={styles.metaText}>{c.duration} min</Text>
        </View>
      </View>
      <Icon name="ChevronRight" size={20} color={styles.chevron.color} />
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  headerTitle: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.l,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  patientName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  earningBadge: {
    backgroundColor: '#E0F9F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  earningText: {
    ...theme.sizes.typography.caption,
    color: '#1A9C8E',
    fontFamily: 'Manrope_700Bold',
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
  chevron: {
    color: theme.colors.n300,
  },
});
