import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../context/GlobalContext';
import { usePatientDashboard } from '../../../context/PatientDashboardContext';
import { useStyles } from '../../../theme/useStyles';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { RegularDoctorCard } from '../../../components/doctor/RegularDoctorCard';
import { StatusCard } from './components/StatusCard';
import { ActionGrid } from './components/ActionGrid';
import { TimerBlock } from './components/TimerBlock';
import { ConsultationSummary } from './extra-screens/ConsultationSummary';
import { ConsultationCalendar } from './extra-screens/ConsultationCalendar';
import { BookingDetails } from './extra-screens/BookingDetails';
import { PatientConsultationMiniCard } from './components/PatientConsultationMiniCard';
import * as importPatientConsultationCard from './extra-screens/PatientConsultationCard';
import * as importPatientActiveConsultation from './extra-screens/PatientActiveConsultation';
import { PatientConsultationRate } from './extra-screens/PatientConsultationRate';
import { PatientConsultationCompleted } from './extra-screens/PatientConsultationCompleted';
import { useRouter } from 'expo-router';
import { useSession } from '../../../context/SessionContext';
import { getEstimatedServerDate } from '../../../hooks/useServerTime';

export function ConsultationTab() {
  const { t } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const { consultationController, doctorController, themeController: { colors, sizes } } = useComponentContext();
  const {
    bookings,
    results,
    activeSession,
    upcomingBooking,
    startConsultation,
    endConsultation,
    resetSession,
    cancelBooking,
    getPreviousResult,
    setActiveSession
  } = consultationController;

  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [statusInfo, setStatusInfo] = useState({ text: '...', label: t('consultation.start_in') });

  // Update dynamic countdown
  React.useEffect(() => {
    if (!upcomingBooking) return;
    
    const update = () => {
      const serverNow = getEstimatedServerDate();
      const startAt = new Date(upcomingBooking.slot.date);
      const diffMs = startAt - serverNow;
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 60 && diffMin > 0) {
        setStatusInfo({
          label: t('consultation.start_in'),
          text: t('dashboard.starts_in_minutes', { count: diffMin })
        });
      } else if (diffMin <= 0) {
        setStatusInfo({
          label: t('consultation.start_in'),
          text: t('dashboard.consultation_started')
        });
      } else {
        const isToday = serverNow.toDateString() === startAt.toDateString();
        const timeStr = startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let finalStr = timeStr;
        if (!isToday) {
           const dateStr = `${startAt.getDate().toString().padStart(2, '0')}.${(startAt.getMonth() + 1).toString().padStart(2, '0')}`;
           finalStr = `${timeStr}, ${dateStr}`;
        }
        setStatusInfo({
          label: t('consultation.starts_at'),
          text: finalStr
        });
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [upcomingBooking, t]);

  // Sync details visibility with context for swipe disable
  React.useEffect(() => {
    setIsConsultationDetailsVisible(isDetailsVisible);
  }, [isDetailsVisible]);

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const {
    navigateToDoctors,
    consultationView,
    selectedSummaryBooking,
    navigateToConsultationSummary,
    navigateToConsultationMain,
    navigateToConsultationDetail,
    navigateToActiveConsultation,
    navigateToConsultationRate,
    navigateToConsultationCompleted,
    navigateToDashboard,
    setIsConsultationDetailsVisible
  } = usePatientDashboard();

  const styles = useStyles(themeStyles);
  const router = useRouter();

  const handleStart = () => {
    if (upcomingBooking) {
      startConsultation(upcomingBooking.id);
    }
  };

  const handleEndPress = () => {
    setIsConfirmVisible(true);
  };

  const handleConfirmEnd = () => {
    const currentBooking = bookings.find(b => b.id === activeSession.bookingId)
      || results.find(r => r.id === activeSession.bookingId);
    endConsultation();
    setIsConfirmVisible(false);
    if (currentBooking) {
      navigateToConsultationRate(currentBooking);
    }
  };

  const handleDoctorPress = (doctorId) => {
    const prevResult = getPreviousResult(doctorId);
    if (prevResult) {
      navigateToConsultationSummary({ ...prevResult, doctor: prevResult.doctor });
    }
  };

  const handleActionPress = async (actionId) => {
    if (actionId === 'video' && activeSession.status === 'ongoing') {
      try {
        const { createApiClient } = require('../../../api/apiClient');
        const { createConsultationsApi } = require('../../../api/consultationsApi');
        const api = createApiClient(session, refreshSessionToken);
        const consultApi = createConsultationsApi(api);
        
        const { callId } = await consultApi.getOrCreateCall(activeSession.bookingId);
        router.push(`/call/${callId}`);
      } catch (err) {
        console.error('Failed to start call:', err);
        Alert.alert(t('common.error'), t('consultation.call_error_msg') || 'Failed to connect to the Call Server.');
      }
    }
  };

  // Case: No bookings at all
  if (bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('consultation.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="calendar" size={sizes.scale(64)} color={colors.n300} />
          <Text style={styles.emptyText}>{t('consultation.empty_text')}</Text>
          <Button
            title={t('consultation.go_to_doctors')}
            onPress={navigateToDoctors}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  const isOngoing = activeSession.status === 'ongoing';


  if (consultationView === 'summary') {
    return <ConsultationSummary booking={selectedSummaryBooking} onClose={navigateToConsultationMain} />;
  }

  if (consultationView === 'detail' && selectedSummaryBooking) {
    return (
      <importPatientConsultationCard.PatientConsultationCard
        booking={selectedSummaryBooking}
        onBack={navigateToConsultationMain}
        onConnect={(booking) => navigateToActiveConsultation(booking)}
        onCancel={(booking) => {
          cancelBooking(booking.id);
          navigateToConsultationMain();
        }}
        onReschedule={(booking) => {
          doctorController.setRescheduleBooking(booking);
          doctorController.selectDoctor(booking.doctor);
          navigateToDoctors();
        }}
      />
    );
  }

  if (consultationView === 'active' && selectedSummaryBooking) {
    return (
      <importPatientActiveConsultation.PatientActiveConsultation
        booking={selectedSummaryBooking}
        onBack={navigateToConsultationMain}
        onEnd={async (booking) => {
          try {
            const { createApiClient } = require('../../../api/apiClient');
            const { createConsultationsApi } = require('../../../api/consultationsApi');
            const api = createApiClient(session, refreshSessionToken);
            const consultApi = createConsultationsApi(api);
            const existingRating = await consultApi.getRating(booking.id);
            if (existingRating) {
              navigateToConsultationCompleted(booking);
            } else {
              navigateToConsultationRate(booking);
            }
          } catch (e) {
            navigateToConsultationRate(booking);
          }
        }}
      />
    );
  }

  if (consultationView === 'rate' && selectedSummaryBooking) {
    return (
      <PatientConsultationRate
        booking={selectedSummaryBooking}
        onSkip={() => navigateToConsultationCompleted(selectedSummaryBooking)}
        onSubmit={() => navigateToConsultationCompleted(selectedSummaryBooking)}
      />
    );
  }

  if (consultationView === 'completed' && selectedSummaryBooking) {
    return (
      <PatientConsultationCompleted
        booking={selectedSummaryBooking}
        onBackToHome={() => {
          navigateToDashboard();
        }}
      />
    );
  }

  const groupedConsultations = consultationController.getGroupedConsultations();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('consultation.title')}</Text>
          <TouchableOpacity style={styles.calendarIcon} onPress={() => setIsCalendarVisible(true)}>
            <Icon name="calendar" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
        </View>

        {groupedConsultations.map((group, idx) => {
          const displayTitle = group.title.startsWith('common.') ? t(group.title) : group.title;
          const hasData = group.data.length > 0;

          return (
            <View key={idx} style={styles.group}>
              <Text style={styles.groupTitle}>{displayTitle}</Text>
              {hasData ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                  nestedScrollEnabled
                >
                  {group.data.map(consultation => (
                    <PatientConsultationMiniCard
                      key={consultation.id}
                      consultation={consultation}
                      onPress={navigateToConsultationDetail}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyGroup}>
                  <Text style={styles.emptyGroupText}>{t('consultation.no_consultations_day')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <ConsultationCalendar
        visible={isCalendarVisible}
        bookings={bookings}
        onClose={() => setIsCalendarVisible(false)}
        onSelectBooking={(b) => {
          setSelectedBooking(b);
          setIsCalendarVisible(false);
          navigateToConsultationDetail(b);
        }}
      />
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.xl,
  },
  group: {
    marginBottom: theme.sizes.spacing.m,
  },
  groupTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xs,
  },
  horizontalScroll: {
    paddingLeft: theme.sizes.spacing.m,
    paddingRight: theme.sizes.spacing.s,
  },
  emptyGroup: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  emptyGroupText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  calendarIcon: {
    padding: theme.sizes.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.xl,
    marginTop: '40%',
  },
  emptyText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
  },
  emptyButton: {
    width: '100%',
  },
  actionGrid: {
    width: '100%',
  },
  recordingTextContainer: {
    alignSelf: 'center',
    marginTop: theme.sizes.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n500,
  },
  recordingText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    lineHeight: theme.sizes.scale(12),
  },
  footer: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.s,
    paddingTop: theme.sizes.spacing.m,
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  startButton: {
    width: '100%',
  },
  endButton: {
    padding: theme.sizes.spacing.m,
  },
  endTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.p500,
  },
  endText: {
    ...theme.sizes.typography.h3,
    lineHeight: theme.sizes.scale(16),
    color: theme.colors.p500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  confirmBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    width: '100%',
    alignItems: 'center',
  },
  confirmTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
  },
  confirmText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.sizes.spacing.m,
  },
  confirmBtn: {
    flex: 1,
  },
  startText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
  }
});
