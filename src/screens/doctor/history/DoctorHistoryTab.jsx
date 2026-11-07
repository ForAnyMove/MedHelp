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
import { HistorySummaryCard } from './components/HistorySummaryCard';
import { ConsultationTypesList } from './components/ConsultationTypesList';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { AllConsultations } from './extra-screens/AllConsultations';
import { CompletedConsultation } from './extra-screens/CompletedConsultation';
import { DoctorRatings } from './extra-screens/DoctorRatings';
import { PatientProfileSubView } from './extra-screens/PatientProfileSubView';


import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { useResponsive } from '../../../theme/useResponsive';

export function DoctorHistoryTab() {
  const styles = useStyles(themeStyles);
  const responsive = useResponsive();
  const isLandscapeLayout = !responsive?.isPortraitShell && (responsive?.isDesktop || responsive?.isDesktopWide || responsive?.isUltrawide || responsive?.isTabletLandscape);
  const { t } = useTranslation();
  const { historyController } = useComponentContext();
  const { doctorPastConsultations = [], isLoaded } = historyController;
  const [activeSegment, setActiveSegment] = useState(true);
  const { historyView, historySelectedId, historyPatientProfileId, navigateToHistoryAll, navigateBack } = useDoctorDashboard();

  const searchParams = useLocalSearchParams();
  const routeView = typeof searchParams?.view === 'string' ? searchParams.view : searchParams?.view?.[0];
  const routeId = typeof searchParams?.id === 'string' ? searchParams.id : searchParams?.id?.[0];

  const getWebParam = (key) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
    try {
      if (!window.location.pathname.startsWith('/history')) return null;
      const sp = new URLSearchParams(window.location.search);
      return sp.get(key);
    } catch (e) {
      return null;
    }
  };

  const [, setPopstateTick] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => setPopstateTick((tick) => tick + 1);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const urlView = getWebParam('view');
  const urlId = getWebParam('id');

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isWebHistoryBase = isWeb && window.location.pathname.startsWith('/history') && (!window.location.search || window.location.search === '?');

  const effectiveView = isWebHistoryBase
    ? 'dashboard'
    : (historyView !== 'dashboard' ? historyView : (urlView || (routeView || 'dashboard')));
  const effectiveId = isWebHistoryBase
    ? null
    : (historySelectedId || urlId || (routeId || null));

  const currentSummary = React.useMemo(() => {
    let data = doctorPastConsultations || [];
    if (!activeSegment) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      data = data.filter(c => new Date(c.date) >= weekAgo);
    }
    const uniquePatients = new Set(data.map(c => c.patientName)).size;
    const upcomingCount = data.filter(c => c.status === 'scheduled').length;
    // Sort to get the latest date for lastOverview
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      lastOverview: sortedData.length > 0 ? sortedData[0].date : null,
      consultationsCount: data.length,
      patientsCount: uniquePatients,
      upcomingConsultations: upcomingCount,
      comments: activeSegment ? 25 : 4,
    };
  }, [doctorPastConsultations, activeSegment]);

  if (effectiveView === 'all') {
    return <AllConsultations activeSegment={activeSegment} />;
  }

  if (effectiveView === 'detail' && effectiveId) {
    return <CompletedConsultation id={effectiveId} />;
  }

  const targetPatientProfileId = isWebHistoryBase
    ? null
    : (historyPatientProfileId || urlId || (routeId || null));

  if (effectiveView === 'patient-profile' && targetPatientProfileId) {
    return <PatientProfileSubView patientId={targetPatientProfileId} onBack={navigateBack} />;
  }

  if (effectiveView === 'ratings') {
    return <DoctorRatings />;
  }

  const renderContent = () => {
    if (!isLoaded) {
      return Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />);
    }
    const dataToUse = doctorPastConsultations;

    if (dataToUse.length === 0) {
      return (
        <EmptyState
          icon="ClipboardList"
          title={t('doctor_history.empty_title') || 'No consultations yet'}
          description={t('doctor_history.empty_desc') || 'Your consultations will appear here.'}
        />
      );
    }

    const upcoming = dataToUse.filter(c => c.status === 'scheduled');
    const completed = dataToUse.filter(c => c.status === 'completed');
    const canceled = dataToUse.filter(c => c.status === 'canceled');

    return (
      <View>
        {upcoming.length > 0 && <ConsultationTypesList title={t('doctor_history.upcoming')} list={upcoming} type="upcoming" />}
        {completed.length > 0 && <ConsultationTypesList title={t('doctor_history.completed')} list={completed} type="completed" />}
        {canceled.length > 0 && <ConsultationTypesList title={t('doctor_history.canceled')} list={canceled} type="canceled" />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('doctor_history.title') || 'Consultation History'}</Text>
        {isLandscapeLayout ? (
          <View style={styles.desktopLayout}>
            <View style={styles.desktopLeftCol}>
              <HistorySummaryCard
                activeSegment={activeSegment}
                onSegmentChange={(v) => setActiveSegment(v)}
                summary={currentSummary}
                onConsultationsPress={() => navigateToHistoryAll(activeSegment ? 'all' : 'latest')}
              />
            </View>
            <View style={styles.desktopRightCol}>
              {renderContent()}
            </View>
          </View>
        ) : (
          <>
            <HistorySummaryCard
              activeSegment={activeSegment}
              onSegmentChange={(v) => setActiveSegment(v)}
              summary={currentSummary}
              onConsultationsPress={() => navigateToHistoryAll(activeSegment ? 'all' : 'latest')}
            />
            {renderContent()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
    width: '100%',
    maxWidth: !theme.responsive?.isPortraitShell && (theme.responsive?.isTabletLandscape || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge)
      ? (theme.responsive?.containerMaxWidth || 1440)
      : theme.responsive?.isTabletPortrait ? 760 : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.sizes.spacing.l,
    width: '100%',
  },
  desktopLeftCol: {
    width: theme.responsive?.isDesktopLarge ? 420 : 380,
    flexShrink: 0,
  },
  desktopRightCol: {
    flex: 1,
    minWidth: 0,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.scale(2),
  },
  patientName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  earningBadge: {
    backgroundColor: /* TODO: color */ '#E0F9F6',
    paddingHorizontal: theme.sizes.scale(8),
    paddingVertical: theme.sizes.scale(2),
    borderRadius: theme.sizes.scale(10),
  },
  earningText: {
    ...theme.sizes.typography.caption,
    color: /* TODO: color */ '#1A9C8E',
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
    gap: theme.sizes.scale(4),
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
