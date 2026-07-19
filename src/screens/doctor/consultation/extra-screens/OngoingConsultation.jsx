import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { useRouter } from 'expo-router';
import { useSession } from '../../../../context/SessionContext';

import { useConsultationTimer } from '../../../../hooks/useConsultationTimer';

export function OngoingConsultation({ consultation, onEndConsultation }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const router = useRouter();
  const [notes, setNotes] = React.useState('');
  
  const { session, refreshSessionToken } = useSession();

  const {
    timerSeconds,
    isDoctorJoined,
    isPatientJoined
  } = useConsultationTimer(
    consultation?.id,
    'doctor',
    consultation?.elapsed_seconds || 0,
    consultation?.timer_last_started_at || null,
    consultation?.is_doctor_joined,
    consultation?.is_patient_joined
  );
      
  React.useEffect(() => {
    const duration = consultation.slot?.duration || consultation.duration;
    if (duration && timerSeconds >= duration * 60) {
      const endAutomatically = async () => {
        try {
          const { createApiClient } = require('../../../../api/apiClient');
          const { createConsultationsApi } = require('../../../../api/consultationsApi');
          const api = createApiClient(session, refreshSessionToken);
          const consultApi = createConsultationsApi(api);
          await consultApi.update(consultation.id, { status: 'completed' });
        } catch (e) {
          console.error('Failed to update consultation status:', e);
        }
        onEndConsultation();
      };
      endAutomatically();
    }
  }, [timerSeconds, consultation, session, refreshSessionToken, onEndConsultation]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');

    return [
      pad(hours)[0], pad(hours)[1],
      pad(minutes)[0], pad(minutes)[1],
      pad(seconds)[0], pad(seconds)[1]
    ];
  };

  const digits = formatTimer(timerSeconds);
  const [isStartingCall, setIsStartingCall] = React.useState(false);
  const [isNotifying, setIsNotifying] = React.useState(false);
  const [isOtherUserInCall, setIsOtherUserInCall] = React.useState(!!consultation.is_other_user_in_video);

  React.useEffect(() => {
    let interval;
    if (consultation?.id) {
      interval = setInterval(async () => {
        try {
          const res = await consultApi.getVideoStatus(consultation.id);
          setIsOtherUserInCall(res.is_other_user_in_video);
        } catch (e) {
          // Silent catch to prevent spamming logs on transient errors
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [consultation?.id]);


  const handleNotifyPress = async () => {
    try {
      setIsNotifying(true);
      const { createApiClient } = require('../../../../api/apiClient');
      const { createConsultationsApi } = require('../../../../api/consultationsApi');
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);
      
      await consultApi.notify(consultation.id);
      
      // Could show a success toast here
    } catch (err) {
      console.error('Failed to notify patient:', err);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleActionPress = async (actionId) => {
    if (actionId === 'video') {
      try {
        setIsStartingCall(true);
        const { createApiClient } = require('../../../../api/apiClient');
        const { createConsultationsApi } = require('../../../../api/consultationsApi');
        const api = createApiClient(session, refreshSessionToken);
        const consultApi = createConsultationsApi(api);
        
        const { callId } = await consultApi.getOrCreateCall(consultation.id);
        router.push(`/call/${callId}`);
      } catch (err) {
        console.error('Failed to start call for doctor:', err);
      } finally {
        setIsStartingCall(false);
      }
    }
  };

  const handleEndConsultation = async () => {
    try {
      const { createApiClient } = require('../../../../api/apiClient');
      const { createConsultationsApi } = require('../../../../api/consultationsApi');
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);
      
      await consultApi.update(consultation.id, { status: 'completed' });
    } catch (e) {
      console.error('Failed to update consultation status:', e);
    }
    onEndConsultation();
  };

  return (
    <SubViewScreen title={t('consultation.title')}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
          <View style={styles.unifiedBadge}>
            <View style={styles.unifiedSection}>
              <Icon name="profile" size={sizes.scale(24)} color={colors.sBlue} wrapperStyle={styles.iconCircle} wrapped />
              <Text style={styles.patientName}>{consultation.patient.firstName} {consultation.patient.lastName}</Text>
            </View>
            <View style={styles.unifiedDivider} />
            <View style={styles.unifiedSection}>
              <Icon name="time" size={sizes.scale(24)} color={colors.sPink} wrapperStyle={[styles.iconCircle]} wrapped />
              <Text style={styles.patientName}>{consultation.time}</Text>
            </View>
          </View>


          <View style={styles.actionGrid}>
            {!isPatientJoined && (
              <View style={styles.notifyBlock}>
                <View style={styles.notifyInfo}>
                  <View style={styles.notifyIconBox}>
                    <Icon name="bell" size={sizes.scale(24)} color={colors.white} />
                  </View>
                  <View style={styles.notifyTexts}>
                    <Text style={styles.notifyTitle}>{t('consultation.notify_patient')}</Text>
                    <Text style={styles.notifySubtitle}>
                      {t('consultation.notify_patient_subtitle', { name: consultation.patient.firstName })}
                    </Text>
                  </View>
                </View>
                <Button
                  title={t('consultation.send')}
                  variant="primary"
                  onPress={handleNotifyPress}
                  disabled={isNotifying}
                  style={styles.notifyBtn}
                  textStyle={styles.notifyBtnText}
                />
              </View>
            )}

            <View style={styles.row}>
              <TouchableOpacity style={styles.actionCard} onPress={() => handleActionPress('chat')}>
                <Icon name="chat" size={sizes.scale(24)} color={colors.sCoral} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.chat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => handleActionPress('video')}
                disabled={isStartingCall}
              >
                {isStartingCall ? (
                  <View style={styles.actionIcon}>
                    <ActivityIndicator size="small" color={colors.p500} />
                  </View>
                ) : (
                  <Icon name="video" size={sizes.scale(24)} color={colors.p500} wrapperStyle={[styles.actionIcon]} wrapped />
                )}
                <Text style={styles.actionText}>{isStartingCall ? t('common.loading') : t('actions.video')}</Text>
                {isOtherUserInCall && <View style={styles.redDot} />}
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="medical-document" size={sizes.scale(24)} color={colors.sYell} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.files')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="message" size={sizes.scale(24)} color={colors.sBlue} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.messages')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timerBlock}>
            <View style={styles.timerHeader}>
              <Icon name="timer" size={sizes.scale(24)} color={colors.sPink} wrapperStyle={styles.timerIconBox} wrapped />
              <Text style={styles.timerTitle}>{t('consultation.timer')}</Text>
            </View>
            <View style={styles.timerDivider} />
            {(isDoctorJoined && isPatientJoined) || timerSeconds > 0 ? (
              <View style={styles.timerGrid}>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[0]}</Text></View>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[1]}</Text></View>
                <Text style={styles.colon}>:</Text>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[2]}</Text></View>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[3]}</Text></View>
                <Text style={styles.colon}>:</Text>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[4]}</Text></View>
                <View style={styles.digitBox}><Text style={styles.digit}>{digits[5]}</Text></View>
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color={colors.p500} style={{ marginRight: sizes.scale(8) }} />
                <Text style={styles.waitingText}>{t('consultation.waiting_for_connection', 'Waiting for connection...')}</Text>
              </View>
            )}
          </View>

          <View style={styles.notesBlock}>
            <Text style={styles.blockTitle}>{t('doctor_consultation.private_notes')}</Text>
            <View style={styles.notesInputContainer}>
              <View style={styles.notesInputHeader}>
                <Text style={styles.notesLabel}>{t('doctor_consultation.important_notes')}</Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder={t('doctor_consultation.notes_placeholder')}
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={800}
                />
              </View>
              <Text style={styles.charCount}>{notes.length}/800</Text>
            </View>
          </View>

          <View style={styles.recordingTextContainer}>
            <Text style={styles.recordingText}>{t('consultation.recording')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleEndConsultation}
            hitSlop={{ top: sizes.scale(20), bottom: sizes.scale(20), left: sizes.scale(50), right: sizes.scale(50) }}
            style={styles.endButton}
            activeOpacity={0.7}
          >
            <View style={styles.endTextContainer}>
              <Text style={styles.endText}>{t('consultation.end_btn')}</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    paddingBottom: theme.sizes.spacing.l,
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: theme.sizes.spacing.m,
  },
  unifiedSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.l,
  },
  unifiedDivider: {
    width: theme.sizes.scale(1),
    height: '80%',
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  iconCircle: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  patientName: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  actionGrid: {
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.l,
    paddingHorizontal: theme.sizes.spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  actionIcon: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginRight: theme.sizes.spacing.s,
  },
  actionText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  redDot: {
    position: 'absolute',
    top: theme.sizes.spacing.s,
    right: theme.sizes.spacing.s,
    width: theme.sizes.scale(12),
    height: theme.sizes.scale(12),
    borderRadius: theme.sizes.scale(6),
    backgroundColor: theme.colors.danger,
  },
  timerBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    alignItems: 'stretch',
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  notifyBlock: {
    backgroundColor: theme.colors.opacityP100,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.p200,
  },
  notifyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  notifyIconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  notifyTexts: {
    flex: 1,
  },
  notifyTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  notifySubtitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
  },
  notifyBtn: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.p500,
  },
  notifyBtnText: {
    color: theme.colors.p500,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  timerIconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
  },
  timerTitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginLeft: theme.sizes.spacing.s,
  },
  timerDivider: {
    height: theme.sizes.scale(1),
    backgroundColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.m,
  },
  timerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  digitBox: {
    width: theme.sizes.scale(24),
    height: theme.sizes.scale(32),
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.n300,
    marginHorizontal: theme.sizes.scale(2),
  },
  digit: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  colon: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.m,
  },
  waitingText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    fontFamily: 'Manrope_600SemiBold',
  },
  notesBlock: {
    marginBottom: theme.sizes.spacing.xs,
  },
  blockTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  notesInputContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.large,
  },
  notesInputHeader: {
    borderRadius: theme.sizes.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xs,
  },
  notesLabel: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  notesInput: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    minHeight: theme.sizes.scale(80),
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    alignSelf: 'flex-end',
    marginTop: theme.sizes.spacing.xs,
    paddingRight: theme.sizes.spacing.m,
  },
  recordingTextContainer: {
    alignSelf: 'center',
    marginTop: theme.sizes.spacing.s,
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
    paddingHorizontal: theme.sizes.spacing.m,
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
  }
});
