import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useResponsive } from '../../../theme/useResponsive';
import { Icon } from '../../../components/ui/Icon';

import { ConsultationCard } from '../../../components/doctor-dashboard/ConsultationCard';
import { PatientCard } from './extra-screens/PatientCard';
import { PatientDetails } from './extra-screens/PatientDetails';
import { OngoingConsultation } from './extra-screens/OngoingConsultation';
import { DoctorConsultationSummary } from './extra-screens/DoctorConsultationSummary';
import { DoctorConsultationForm } from './extra-screens/DoctorConsultationForm';
import { AvailabilityModal } from './components/AvailabilityModal';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';

export function DoctorConsultationTab() {
  const styles = useStyles(themeStyles);
  const { colors, sizes } = useTheme();
  const responsive = useResponsive();
  const { t } = useTranslation();
  const { doctorProfileController } = useComponentContext();
  const {
    currentView,
    consultationStatus,
    selectedConsultation,
    navigateToPatientCard,
    navigateToHistoryDetail,
    navigateBack,
    startConsultation,
    endConsultation,
    isAvailabilityModalVisible,
    setIsAvailabilityModalVisible,
  } = useDoctorDashboard();

  const searchParams = useLocalSearchParams();
  const routeView = typeof searchParams?.view === 'string' ? searchParams.view : searchParams?.view?.[0];
  const routeStatus = typeof searchParams?.status === 'string' ? searchParams.status : searchParams?.status?.[0];
  const routeId = typeof searchParams?.id === 'string' ? searchParams.id : searchParams?.id?.[0];

  const getWebParam = (key) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
    try {
      if (!window.location.pathname.startsWith('/consultation')) return null;
      const sp = new URLSearchParams(window.location.search);
      return sp.get(key);
    } catch (e) {
      return null;
    }
  };

  const [, setPopstateTick] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => setPopstateTick((t) => t + 1);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const urlView = getWebParam('view');
  const urlStatus = getWebParam('status');
  const urlId = getWebParam('id');

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isWebConsultationBase = isWeb && window.location.pathname.startsWith('/consultation') && (!window.location.search || window.location.search === '?');

  const resolvedStatusFromState = consultationStatus && consultationStatus !== 'idle' ? consultationStatus : null;
  const resolvedStatusFromUrl = ['ongoing', 'form', 'summary'].includes(urlView) ? urlView : (urlStatus || routeStatus || null);
  const effectiveStatus = resolvedStatusFromState || (isWebConsultationBase ? null : resolvedStatusFromUrl);
  const effectiveView = (currentView && currentView !== 'dashboard')
    ? currentView
    : (isWebConsultationBase ? 'dashboard' : (urlView || (routeView || 'dashboard')));
  const effectiveId = selectedConsultation?.id || (isWebConsultationBase ? null : (urlId || (routeId || null)));

  const isDesktopLayout =
    !responsive?.isPortraitShell && (
      responsive.isDesktop ||
      responsive.isDesktopWide ||
      responsive.isUltrawide ||
      responsive.isTabletLandscape
    );

  const groupedConsultations = doctorProfileController.getGroupedConsultations();
  const allDoctorConsultations = doctorProfileController.consultations || [];

  let fullConsultation = selectedConsultation;
  const targetId = effectiveId || selectedConsultation?.id;
  if (targetId && (!selectedConsultation || String(selectedConsultation.id) !== String(targetId) || !selectedConsultation.patient)) {
    const fromAll = allDoctorConsultations.find((c) => String(c.id) === String(targetId));
    if (fromAll) {
      fullConsultation = fromAll;
    } else {
      for (const group of groupedConsultations) {
        const found = group.data.find((c) => String(c.id) === String(targetId));
        if (found) {
          fullConsultation = found;
          break;
        }
      }
    }
  }

  // Find nearest upcoming consultation across groups for the Hero card (excluding missed past consultations)
  const nextConsultation = useMemo(() => {
    const now = Date.now();
    for (const group of groupedConsultations) {
      if (group.data && group.data.length > 0) {
        const valid = group.data.find((c) => {
          if (!c.date) return false;
          const startMs = new Date(c.date).getTime();
          if (Number.isNaN(startMs)) return false;
          const durationMins = Number(c.duration || c.slot?.duration) || 30;
          const endMs = startMs + durationMins * 60 * 1000;
          if (c.status === 'occupied' || c.status === 'in_progress') {
            return endMs + 2 * 60 * 60 * 1000 >= now;
          }
          return endMs >= now;
        });
        if (valid) return valid;
      }
    }
    return null;
  }, [groupedConsultations]);

  if (effectiveStatus === 'form') {
    return <DoctorConsultationForm consultation={fullConsultation} />;
  }

  if (effectiveStatus === 'summary') {
    return <DoctorConsultationSummary consultation={fullConsultation} />;
  }

  if (effectiveStatus === 'ongoing') {
    return (
      <OngoingConsultation
        consultation={fullConsultation}
        onEndConsultation={endConsultation}
      />
    );
  }

  if (effectiveView === 'patient-card') {
    return (
      <PatientCard
        consultation={fullConsultation}
        onBack={navigateBack}
        onViewDetails={() =>
          navigateToHistoryDetail(fullConsultation?.id || targetId, 'consultation')
        }
        onStartConsultation={startConsultation}
      />
    );
  }

  if (effectiveView === 'patient-details') {
    return (
      <PatientDetails
        patient={fullConsultation?.patient}
        onBack={navigateBack}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('consultation.title', 'Приёмы')}
          </Text>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setIsAvailabilityModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.calendarBtnContent}>
              <Icon name="Calendar" size={sizes.scale(18)} color={colors.p500} />
              <Text style={styles.calendarBtnText}>{t('doctor_dashboard.slots_schedule', 'График слотов')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hero Banner: Nearest upcoming consultation */}
        {nextConsultation && (
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroBadgeText}>Ближайший приём</Text>
              </View>
              <View style={styles.heroTimeBadge}>
                <Icon name="Clock" size={sizes.scale(13)} color={colors.p600} />
                <Text style={styles.heroTimeText}>{nextConsultation.time}</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroAvatar}>
                <Icon name="User" size={sizes.scale(22)} color={colors.white} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroPatientName}>
                  {nextConsultation.patient.firstName}{' '}
                  {nextConsultation.patient.lastName || ''}
                </Text>
                <Text style={styles.heroPurpose} numberOfLines={1}>
                  {nextConsultation.purpose || 'Плановая онлайн-консультация'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={() => navigateToPatientCard(nextConsultation)}
                activeOpacity={0.8}
              >
                <Text style={styles.heroActionText}>К приёму</Text>
                <Icon
                  name="ChevronRight"
                  size={sizes.scale(16)}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Grouped Consultations List */}
        {groupedConsultations.map((group, idx) => {
          const displayTitle = group.title.startsWith('common.')
            ? t(group.title)
            : group.title;
          const hasData = group.data.length > 0;
          const uniquePatientsCount = new Set(
            group.data.map((c) => c.patient?.id || c.patient?.profileId || c.patient_profile_id || `${c.patient?.firstName}_${c.patient?.lastName}`).filter(Boolean)
          ).size;
          const patientWord = uniquePatientsCount === 1 ? 'пациент' : (uniquePatientsCount >= 2 && uniquePatientsCount <= 4 ? 'пациента' : 'пациентов');

          return (
            <View key={idx} style={styles.group}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupTitle}>{displayTitle}</Text>
                {hasData && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {uniquePatientsCount} {patientWord}
                    </Text>
                  </View>
                )}
              </View>

              {hasData ? (
                isDesktopLayout ? (
                  <View style={styles.desktopCardsGrid}>
                    {group.data.map((consultation) => (
                      <ConsultationCard
                        key={consultation.id}
                        consultation={consultation}
                        onPress={navigateToPatientCard}
                      />
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                    nestedScrollEnabled
                  >
                    {group.data.map((consultation) => (
                      <ConsultationCard
                        key={consultation.id}
                        consultation={consultation}
                        onPress={navigateToPatientCard}
                      />
                    ))}
                  </ScrollView>
                )
              ) : (
                <View style={styles.emptyGroup}>
                  <Text style={styles.emptyGroupText}>
                    {t(
                      'consultation.no_consultations_day',
                      'Нет запланированных приёмов'
                    )}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <AvailabilityModal
        visible={isAvailabilityModalVisible}
        onClose={() => setIsAvailabilityModalVisible(false)}
      />
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal:
      theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
    width: '100%',
    maxWidth:
      !theme.responsive?.isPortraitShell && (
        theme.responsive?.isTabletLandscape ||
        theme.responsive?.isDesktop ||
        theme.responsive?.isDesktopLarge
      )
        ? (theme.responsive?.containerMaxWidth || 1440)
        : theme.responsive?.isTabletPortrait ? 760 : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    fontWeight: '700',
  },
  calendarBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  calendarBtnText: {
    fontSize: theme.sizes.scale(13),
    color: theme.colors.p600,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth:
      !theme.responsive?.isPortraitShell && (
        theme.responsive?.isTabletLandscape ||
        theme.responsive?.isDesktop ||
        theme.responsive?.isDesktopLarge
      )
        ? (theme.responsive?.containerMaxWidth || 1440)
        : theme.responsive?.isTabletPortrait ? 760 : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },

  // Hero Card
  heroCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    borderWidth: 1.5,
    borderColor: 'rgba(35, 211, 194, 0.4)',
    shadowColor: theme.colors.p500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.opacityP100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
  },
  heroBadgeText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.p600,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.n100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroTimeText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n800,
    fontWeight: '700',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.m,
  },
  heroAvatar: {
    width: theme.sizes.scale(42),
    height: theme.sizes.scale(42),
    borderRadius: theme.sizes.scale(21),
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  heroPatientName: {
    ...theme.sizes.typography.bodyLarge,
    fontWeight: '700',
    color: theme.colors.n900,
    marginBottom: 2,
  },
  heroPurpose: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n500,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.p500,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.sizes.borderRadius.medium,
  },
  heroActionText: {
    fontSize: theme.sizes.scale(12),
    fontWeight: '700',
    color: theme.colors.white,
  },

  // Groups
  group: {
    marginBottom: theme.sizes.spacing.l,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.s,
  },
  groupTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n800,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n600,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingLeft: theme.sizes.spacing.m,
    paddingRight: theme.sizes.spacing.s,
  },
  desktopCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  emptyGroup: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  emptyGroupText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n400,
  },
});
