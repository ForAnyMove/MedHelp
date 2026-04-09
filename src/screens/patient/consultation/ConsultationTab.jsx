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

export function ConsultationTab() {
  const { t } = useTranslation();
  const { consultationController, themeController: { colors, sizes } } = useComponentContext();
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
    setIsConsultationDetailsVisible
  } = usePatientDashboard();

  const styles = useStyles(themeStyles);

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
      navigateToConsultationSummary(currentBooking);
    }
  };

  const handleDoctorPress = (doctorId) => {
    const prevResult = getPreviousResult(doctorId);
    if (prevResult) {
      navigateToConsultationSummary({ ...prevResult, doctor: prevResult.doctor });
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
  const currentBooking = isOngoing
    ? bookings.find(b => b.id === activeSession.bookingId)
    : upcomingBooking;

  if (consultationView === 'summary') {
    return <ConsultationSummary booking={selectedSummaryBooking} onClose={navigateToConsultationMain} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('consultation.title')}</Text>
          <TouchableOpacity style={styles.calendarIcon} onPress={() => setIsCalendarVisible(true)}>
            <Icon name="calendar" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
        </View>

        {isOngoing ? (
          <RegularDoctorCard
            doctor={currentBooking.doctor}
            variant="compact"
            onProfilePress={() => handleDoctorPress(currentBooking.doctor.id)}
          />
        ) : (
          <StatusCard
            doctor={currentBooking.doctor}
            statusText="10m:20sec"
            onPress={() => handleDoctorPress(currentBooking.doctor.id)}
          />
        )}

        <ActionGrid />

        <TimerBlock seconds={activeSession.elapsedSeconds} />

        {isOngoing && (
          <View style={styles.recordingTextContainer}>
            <Text style={styles.recordingText}>{t('consultation.recording')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isOngoing ? (
          <TouchableOpacity
            onPress={handleEndPress}
            hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
            style={styles.endButton}
            activeOpacity={0.7}
          >
            <View style={styles.endTextContainer}>
              <Text style={styles.endText}>{t('consultation.end_btn')}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Button
            title={t('consultation.start_btn')}
            onPress={handleStart}
            style={styles.startButton}
            textStyle={styles.startText}
          />
        )}
      </View>

      <ConsultationCalendar
        visible={isCalendarVisible}
        bookings={bookings}
        onClose={() => setIsCalendarVisible(false)}
        onSelectBooking={(b) => {
          setSelectedBooking(b);
          setIsCalendarVisible(false);
          setIsDetailsVisible(true);
        }}
      />

      <BookingDetails
        visible={isDetailsVisible}
        booking={selectedBooking}
        onClose={() => setIsDetailsVisible(false)}
        onCancel={(id) => {
          cancelBooking(id);
          setIsDetailsVisible(false);
        }}
      />

      <Modal visible={isConfirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{t('consultation.confirm_end_title')}</Text>
            <Text style={styles.confirmText}>{t('consultation.confirm_end_text')}</Text>
            <View style={styles.confirmButtons}>
              <Button
                title={t('consultation.cancel')}
                variant="outlined"
                onPress={() => setIsConfirmVisible(false)}
                style={styles.confirmBtn}
              />
              <Button
                title={t('consultation.confirm')}
                variant="primary"
                onPress={handleConfirmEnd}
                style={styles.confirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {consultationView === 'summary' && selectedSummaryBooking && (
        <View style={StyleSheet.absoluteFill}>
          <ConsultationSummary
            booking={selectedSummaryBooking}
            onClose={navigateToConsultationMain}
          />
        </View>
      )}
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
