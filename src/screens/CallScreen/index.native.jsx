import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StreamCall, useCallStateHooks, ParticipantView } from '@stream-io/video-react-native-sdk';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useSession } from '../../context/SessionContext';
import { createApiClient } from '../../api/apiClient';
import { createConsultationsApi } from '../../api/consultationsApi';
import { useComponentContext } from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';

const CustomVideoLayout = ({ onMinimize, onLeave, callId }) => {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { consultationController } = useComponentContext();
  const { useLocalParticipant, useRemoteParticipants, useIsCallRecordingInProgress, useMicrophoneState, useCameraState, useCall } = useCallStateHooks();

  const call = useCall();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const isRecording = useIsCallRecordingInProgress();
  const { status: micStatus } = useMicrophoneState();
  const { status: camStatus } = useCameraState();

  const remoteParticipant = remoteParticipants[0];

  const [showControls, setShowControls] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef(null);

  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const resetControlsTimeout = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShowControls(false);
      });
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  const toggleMic = () => {
    resetControlsTimeout();
    call?.microphone.toggle();
  };

  const toggleCam = () => {
    resetControlsTimeout();
    call?.camera.toggle();
  };

  const toggleRecord = () => {
    resetControlsTimeout();
    if (isRecording) {
      call?.stopRecording();
    } else {
      call?.startRecording();
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      consultationController.addNote(noteText.trim());
      setNoteText('');
    }
    setIsNotesModalVisible(false);
  };

  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={resetControlsTimeout}>
      <View style={styles.container}>
        {/* Remote Video (Fullscreen) */}
        {remoteParticipant ? (
          <View style={StyleSheet.absoluteFillObject}>
            <ParticipantView
              participant={remoteParticipant}
              style={StyleSheet.absoluteFillObject}
              objectFit="cover"
              ParticipantLabel={() => null}
              VideoFallback={() => (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ width: sizes.scale(100), height: sizes.scale(100), borderRadius: sizes.scale(50), backgroundColor: colors.p500, justifyContent: 'center', alignItems: 'center', marginBottom: sizes.spacing.m, overflow: 'hidden' }}>
                    <Text style={{ color: colors.white, ...sizes.typography.h1 }}>
                      {(remoteParticipant.name || remoteParticipant.userId || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: colors.white, ...sizes.typography.h3, marginBottom: sizes.spacing.s }}>
                    {remoteParticipant.name || remoteParticipant.userId}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: sizes.spacing.l }}>
                    <View style={{ width: sizes.scale(8), height: sizes.scale(8), borderRadius: sizes.scale(4), backgroundColor: /* TODO: color */ '#26C6DA', marginRight: sizes.scale(8) }} />
                    <Text style={{ color: /* TODO: color */ '#26C6DA', ...sizes.typography.bodyMedium }}>{formatTime(duration)}</Text>
                  </View>
                  {micStatus === 'disabled' && (
                    <View style={{ backgroundColor: /* TODO: color */ 'rgba(255,255,255,0.15)', paddingHorizontal: sizes.spacing.l, paddingVertical: sizes.spacing.s, borderRadius: sizes.scale(20), flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="mic-off" size={sizes.scale(24)} color={colors.danger}  />
                      <Text style={{ color: colors.white, marginLeft: sizes.spacing.s, ...sizes.typography.bodyMedium }}>{t('call.you_are_muted_tap', 'You are muted. Tap to unmute')}</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.n900, justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="person" size={sizes.scale(80)} color={colors.n500} />
            <Text style={{ color: colors.white, marginTop: sizes.scale(16) }}>{t('call.waiting_for_others', 'Waiting for others...')}</Text>
          </View>
        )}

        {/* Local Video (PiP) */}
        {localParticipant && (
          <View style={{
            position: 'absolute',
            bottom: showControls ? 120 : 40,
            right: sizes.spacing.m,
            width: sizes.scale(110),
            height: sizes.scale(160),
            borderRadius: sizes.scale(16),
            overflow: 'hidden',
            backgroundColor: /* TODO: color */ '#111827',
            borderWidth: 2,
            borderColor: /* TODO: color */ '#26C6DA',
            zIndex: 10,
          }}>
            <ParticipantView
              participant={localParticipant}
              style={{ width: '100%', height: '100%' }}
              objectFit="cover"
              ParticipantLabel={() => null}
              VideoFallback={() => (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: /* TODO: color */ '#111827', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ width: sizes.scale(50), height: sizes.scale(50), borderRadius: sizes.scale(25), backgroundColor: colors.p500, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <Text style={{ color: colors.white, ...sizes.typography.h3 }}>
                      {(localParticipant.name || localParticipant.userId || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            />
            {micStatus === 'disabled' && (
              <View style={{ position: 'absolute', bottom: sizes.scale(8), right: sizes.scale(8), backgroundColor: colors.danger, paddingHorizontal: sizes.scale(8), paddingVertical: sizes.scale(4), borderRadius: sizes.scale(12), flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="mic-off" size={sizes.scale(24)} color={colors.white}  />
                <Text style={{ color: colors.white, fontSize: sizes.scale(10), marginLeft: sizes.scale(4), fontWeight: 'bold' }}>{t('call.muted', 'Muted')}</Text>
              </View>
            )}
          </View>
        )}



        {/* UI Controls (Top and Bottom) */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]} pointerEvents={showControls ? 'box-none' : 'none'}>
          {/* Top Bar */}
          <View style={[styles.topBar, { padding: sizes.spacing.s }]}>
            <TouchableOpacity onPress={onMinimize} style={{ flexDirection: 'row', alignItems: 'center', padding: sizes.spacing.s }}>
              <Icon name = 'Minimize2' size={sizes.scale(20)} color={/* TODO: color */ '#26C6DA'}  />
              <Text style={{ color: /* TODO: color */ '#26C6DA', marginLeft: sizes.spacing.xs, ...sizes.typography.bodyMedium }}>{t('call.minimize', 'Minimize')}</Text>
            </TouchableOpacity>

            <View style={{ backgroundColor: /* TODO: color */ 'rgba(38,198,218,0.2)', paddingHorizontal: sizes.spacing.m, paddingVertical: sizes.spacing.xs, borderRadius: sizes.scale(20) }}>
              <Text style={{ color: /* TODO: color */ '#26C6DA', ...sizes.typography.bodyMedium }}>Room ID: {callId.slice(-8)}</Text>
            </View>
          </View>

          {/* Bottom Bar */}
          <View style={{ position: 'absolute', bottom: sizes.scale(0), left: sizes.scale(0), right: sizes.scale(0), flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: sizes.spacing.m, paddingBottom: sizes.spacing.xl, backgroundColor: colors.bg, borderTopLeftRadius: sizes.scale(24), borderTopRightRadius: sizes.scale(24) }}>
            {/* Mute */}
            <TouchableOpacity onPress={toggleMic} style={{ alignItems: 'center' }}>
              <Icon name={micStatus === 'disabled' ? "MicOff" : "Mic"} size={sizes.scale(28)} color={micStatus === 'disabled' ? colors.danger : colors.p500} />
              <Text style={{ color: colors.n700, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.mute', 'Mute')}</Text>
            </TouchableOpacity>
            {/* Cam */}
            <TouchableOpacity onPress={toggleCam} style={{ alignItems: 'center' }}>
              <Icon name={camStatus === 'disabled' ? "VideoOff" : "Video"} size={sizes.scale(28)} color={camStatus === 'disabled' ? colors.danger : colors.p500} />
              <Text style={{ color: colors.n700, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.camera', 'Camera')}</Text>
            </TouchableOpacity>
            {/* End */}
            <TouchableOpacity onPress={onLeave} style={{ alignItems: 'center' }}>
              <View style={{ width: sizes.scale(48), height: sizes.scale(48), borderRadius: sizes.scale(24), backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="phone-off" size={sizes.scale(24)} color={colors.white}  />
              </View>
              <Text style={{ color: colors.danger, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.end', 'End')}</Text>
            </TouchableOpacity>
            {/* Notes */}
            <TouchableOpacity onPress={() => { resetControlsTimeout(); setIsNotesModalVisible(true); }} style={{ alignItems: 'center' }}>
              <Icon name="note" size={sizes.scale(24)} color={colors.p500}  />
              <Text style={{ color: colors.n700, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.notes', 'Notes')}</Text>
            </TouchableOpacity>
            {/* Record */}
            <TouchableOpacity onPress={toggleRecord} style={{ alignItems: 'center' }}>
              <Icon name="record" size={sizes.scale(24)} color={isRecording ? colors.danger : colors.p500}  />
              <Text style={{ color: colors.n700, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.record', 'Record')}</Text>
            </TouchableOpacity>
            {/* More */}
            <TouchableOpacity onPress={resetControlsTimeout} style={{ alignItems: 'center' }}>
              <Icon name = 'MoreHorizontal' size={sizes.scale(28)} color={colors.p500}  />
              <Text style={{ color: colors.n700, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>{t('call.more', 'More')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Notes Modal */}
        <Modal visible={isNotesModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.white, borderTopLeftRadius: sizes.scale(24), borderTopRightRadius: sizes.scale(24), padding: sizes.spacing.l }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sizes.spacing.m }}>
                <Text style={{ ...sizes.typography.h3, color: colors.n900 }}>{t('consultation.notes') || 'Notes'}</Text>
                <TouchableOpacity onPress={() => setIsNotesModalVisible(false)}>
                  <Icon name="x" size={sizes.scale(24)} color={colors.n900} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={{ backgroundColor: colors.n100, borderRadius: sizes.scale(12), padding: sizes.spacing.m, minHeight: sizes.scale(100), color: colors.n900, ...sizes.typography.bodyMedium, textAlignVertical: 'top' }}
                placeholder={t('call.type_note_here', 'Type your note here...')}
                placeholderTextColor={colors.n400}
                multiline
                value={noteText}
                onChangeText={setNoteText}
              />
              <Button title={t('common.add') || 'Add'} variant="primary" onPress={handleAddNote} style={{ marginTop: sizes.spacing.m }} />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function CallScreen() {
  const { sizes, colors } = useTheme();
  const styles = getStyles(sizes, colors);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { videoClient, activeCall, setActiveCall, isMinimized, setIsMinimized } = useStreamContext();
  const [call, setCall] = useState(null);
  const router = useRouter();
  const { session, refreshSessionToken } = useSession();
  const isMinimizedRef = React.useRef(false);

  useEffect(() => {
    if (!videoClient || !id) return;

    if (activeCall && activeCall.id === id) {
      setCall(activeCall);
      setIsMinimized(false);
      return;
    }

    const _call = videoClient.call('default', id);

    _call.join({ create: true })
      .then(() => {
        setCall(_call);
        setActiveCall(_call);
      })
      .catch((err) => {
        console.error('Failed to join call', err);
      });

    return () => { };
  }, [id, videoClient]);

  React.useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  React.useEffect(() => {
    return () => {
      if (!isMinimizedRef.current && id) {
        const callIdStr = String(id);
        if (callIdStr.startsWith('medhelp-consult-')) {
          const consultationId = callIdStr.replace('medhelp-consult-', '');
          try {
            const api = createApiClient(session, refreshSessionToken);
            const consultApi = createConsultationsApi(api);
            consultApi.leaveCall(consultationId).catch(() => { });
          } catch (e) { }
        }
      }
    };
  }, [id, session, refreshSessionToken]);

  React.useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const completedSub = DeviceEventEmitter.addListener('consultation_completed', (event) => {
      const callIdStr = String(id);
      if (callIdStr.replace('medhelp-consult-', '') === String(event?.consultationId)) {
        handleLeave();
      }
    });
    return () => completedSub.remove();
  }, [id, call]);

  const handleMinimize = () => {
    setIsMinimized(true);
    router.back();
  };

  const handleLeave = async () => {
    if (call) {
      const callIdStr = String(id);
      if (callIdStr.startsWith('medhelp-consult-')) {
        const consultationId = callIdStr.replace('medhelp-consult-', '');
        try {
          const api = createApiClient(session, refreshSessionToken);
          const consultApi = createConsultationsApi(api);
          await consultApi.leaveCall(consultationId);
        } catch (e) { }
      }

      await call.leave().catch(() => { });
      setActiveCall(null);
      setIsMinimized(false);
    }
    router.back();
  };

  if (!call) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, padding: sizes.spacing.l }]}>
        <ActivityIndicator size="large" color={colors.p500} />
        <Text style={[styles.loadingText, { marginTop: sizes.spacing.m, marginBottom: sizes.spacing.xl, color: colors.n700 }]}>
          {t('chat.connecting_call', 'Connecting to call...')}
        </Text>
        <Button
          title={t('common.cancel', 'Cancel')}
          variant="outlined"
          onPress={() => router.back()}
          style={{ width: '60%' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StreamCall call={call}>
        <CustomVideoLayout onMinimize={handleMinimize} onLeave={handleLeave} callId={id} />
      </StreamCall>
    </View>
  );
}

const getStyles = (sizes, colors) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: /* TODO: color */ '#000',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: sizes.scale(16),
  },
  controlBtn: {
    width: sizes.scale(44),
    height: sizes.scale(44),
    borderRadius: sizes.scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  }
});
