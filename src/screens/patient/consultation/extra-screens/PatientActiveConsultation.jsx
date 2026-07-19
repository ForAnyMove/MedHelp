import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { RegularDoctorCard } from '../../../../components/doctor/RegularDoctorCard';
import { ActionGrid } from '../components/ActionGrid';
import { TimerBlock } from '../components/TimerBlock';
import { useRouter } from 'expo-router';
import { useSession } from '../../../../context/SessionContext';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useConsultationTimer } from '../../../../hooks/useConsultationTimer';

export function PatientActiveConsultation({ booking, onBack, onEnd }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const router = useRouter();
  const { session, refreshSessionToken } = useSession();
  const { consultationController } = useComponentContext();
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  // Active session timer sync
  const { activeSession, startConsultation, endConsultation } = consultationController;

  const {
    timerSeconds,
    isDoctorJoined,
    isPatientJoined
  } = useConsultationTimer(
    booking?.id,
    'patient',
    booking?.elapsed_seconds || 0,
    booking?.timer_last_started_at || null,
    booking?.is_doctor_joined,
    booking?.is_patient_joined
  );

  useEffect(() => {
    const duration = booking.slot?.duration || booking.duration;
    if (duration && timerSeconds >= duration * 60) {
      const endAutomatically = async () => {
        try {
          const { createApiClient } = require('../../../../api/apiClient');
          const { createConsultationsApi } = require('../../../../api/consultationsApi');
          const api = createApiClient(session, refreshSessionToken);
          const consultApi = createConsultationsApi(api);
          await consultApi.update(booking.id, { status: 'completed' });
        } catch (e) {
          console.error('Failed to update consultation status:', e);
        }
        endConsultation();
        setIsConfirmVisible(false);
        if (onEnd) onEnd(booking);
      };
      endAutomatically();
    }
  }, [timerSeconds, booking, session, refreshSessionToken, endConsultation, onEnd]);

  const [isOtherUserInCall, setIsOtherUserInCall] = React.useState(!!booking.is_other_user_in_video);

  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');

    const callJoinedSub = DeviceEventEmitter.addListener('call_joined', (event) => {
      if (event?.userId && event.userId !== session.userId) {
        setIsOtherUserInCall(true);
      }
    });

    const callLeftSub = DeviceEventEmitter.addListener('call_left', () => {
      setIsOtherUserInCall(false);
    });

    const completedSub = DeviceEventEmitter.addListener('consultation_completed', (event) => {
      if (event?.consultationId === booking?.id) {
        endConsultation();
        setIsConfirmVisible(false);
        if (onEnd) onEnd(booking);
      }
    });

    return () => {
      callJoinedSub.remove();
      callLeftSub.remove();
      completedSub.remove();
    };
  }, [session.userId, booking?.id, endConsultation, onEnd]);

  React.useEffect(() => {
    let interval;
    if (booking?.id) {
      interval = setInterval(async () => {
        try {
          const res = await consultApi.getVideoStatus(booking.id);
          setIsOtherUserInCall(res.is_other_user_in_video);
        } catch (e) {
          // Silent catch to prevent spamming logs on transient errors
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [booking?.id]);

  useEffect(() => {
    // If we land here but the session wasn't started in context, start it now
    if (activeSession.status !== 'ongoing') {
      startConsultation(booking.id);
    }

    // Notify doctor that patient is ready
    const notifyReady = async () => {
      try {
        const { createApiClient } = require('../../../../api/apiClient');
        const api = createApiClient(session, refreshSessionToken);
        await api.post(`/consultations/${booking.id}/patient-ready`);
      } catch (err) {
        console.error('Failed to notify patient ready:', err);
      }
    };
    notifyReady();
  }, [booking.id]);

  const handleActionPress = async (actionId) => {
    if (actionId === 'video') {
      try {
        const { createApiClient } = require('../../../../api/apiClient');
        const { createConsultationsApi } = require('../../../../api/consultationsApi');
        const api = createApiClient(session, refreshSessionToken);
        const consultApi = createConsultationsApi(api);

        const { callId } = await consultApi.getOrCreateCall(booking.id);
        router.push(`/call/${callId}`);
      } catch (err) {
        console.error('Failed to start call:', err);
        Alert.alert(t('common.error'), t('consultation.call_error_msg') || 'Failed to connect to the Call Server.');
      }
    }
  };

  const handleEndPress = () => setIsConfirmVisible(true);

  const handleConfirmEnd = () => {
    endConsultation();
    setIsConfirmVisible(false);
    if (onBack) onBack(); // Just exit to main view
  };

  return (
    <SubViewScreen title={t('consultation.title')} onBack={onBack}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
          <RegularDoctorCard
            doctor={booking.doctor || {}}
            variant="compact"
            onProfilePress={() => { }}
          />

          <View style={{ marginTop: sizes.spacing.m }}>
            <ActionGrid onActionPress={handleActionPress} isOtherUserInCall={isOtherUserInCall} />
          </View>

          {((isDoctorJoined && isPatientJoined) || timerSeconds > 0) ? (
            <TimerBlock seconds={timerSeconds} />
          ) : (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="small" color={colors.p500} style={{ marginRight: sizes.scale(8) }} />
              <Text style={styles.waitingText}>{t('consultation.waiting_for_connection', 'Waiting for connection...')}</Text>
            </View>
          )}

          <View style={styles.recordingTextContainer}>
            <Text style={styles.recordingText}>{t('consultation.recording')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleEndPress}
            hitSlop={{ top: sizes.scale(20), bottom: sizes.scale(20), left: sizes.scale(50), right: sizes.scale(50) }}
            style={styles.endButton}
            activeOpacity={0.7}
          >
            <View style={styles.endTextContainer}>
              <Text style={styles.endText}>{t('consultation.end_btn')}</Text>
            </View>
          </TouchableOpacity>
        </View>

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
      </View>
    </SubViewScreen>
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
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.m,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    marginHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  waitingText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    fontFamily: 'Manrope_600SemiBold',
  },
  footer: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.s,
    paddingTop: theme.sizes.spacing.m,
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
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
});
