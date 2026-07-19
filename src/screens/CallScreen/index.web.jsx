import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, PanResponder, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StreamCall,
  StreamTheme,
  ParticipantView,
  useCallStateHooks,
  useCall,
  hasVideo
} from '@stream-io/video-react-sdk';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useSession } from '../../context/SessionContext';
import { createApiClient } from '../../api/apiClient';
import { createConsultationsApi } from '../../api/consultationsApi';
import { useComponentContext } from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';

// Import CSS strictly for the web build
import '@stream-io/video-react-sdk/dist/css/styles.css';

export default function CallScreenWeb() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { videoClient, activeCall, setActiveCall, isMinimized, setIsMinimized } = useStreamContext();
  const [call, setCall] = useState(null);
  const router = useRouter();
  const { colors, sizes } = useTheme();
  const styles = getStyles(sizes, colors);
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
        console.error('Failed to join call on web:', err);
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
      // 1. Notify backend FIRST without awaiting, to ensure it fires instantly
      const callIdStr = String(id);
      if (callIdStr.startsWith('medhelp-consult-')) {
        const consultationId = callIdStr.replace('medhelp-consult-', '');
        try {
          const api = createApiClient(session, refreshSessionToken);
          const consultApi = createConsultationsApi(api);
          await consultApi.leaveCall(consultationId);
        } catch (e) { }
      }

      // 2. Disconnect locally
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
          {t('chat.connecting_call', 'Подключение к звонку...')}
        </Text>
        <Button title={t('common.cancel', 'Отменить')} variant="outlined" onPress={() => router.back()} style={{ width: '60%' }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StreamTheme style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <StreamCall call={call}>
          <CustomWebLayout onMinimize={handleMinimize} onLeave={handleLeave} callId={id} />
        </StreamCall>
      </StreamTheme>
    </View>
  );
}

function CustomWebLayout({ onMinimize, onLeave, callId }) {
  const { useCameraState, useMicrophoneState, useIsCallRecordingInProgress, useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const { camera, status: cameraStatus } = useCameraState();
  const { status: micStatus } = useMicrophoneState();
  const isRecording = useIsCallRecordingInProgress();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const remoteParticipant = remoteParticipants[0];
  const call = useCall();
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const { consultationController } = useComponentContext();

  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const toggleMic = () => call?.microphone.toggle();
  const toggleCam = () => call?.camera.toggle();
  const toggleRecord = () => {
    if (isRecording) call?.stopRecording();
    else call?.startRecording();
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
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [screen, setScreen] = useState(Dimensions.get('window'));
  const [lastSide, setLastSide] = useState('right');

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window);
    });
    return () => sub?.remove && sub.remove();
  }, []);

  const PIP_WIDTH = sizes.scale(140);
  const PIP_HEIGHT = sizes.scale(200);
  const EDGE_PADDING = sizes.spacing.m;

  const pan = React.useRef(new Animated.ValueXY({
    x: screen.width - PIP_WIDTH - EDGE_PADDING,
    y: screen.height - PIP_HEIGHT - sizes.scale(120)
  })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();

        const finalX = pan.x._value;
        const finalY = pan.y._value;
        const currentWindow = Dimensions.get('window');

        // Snapping logic
        const centerX = finalX + PIP_WIDTH / 2;
        const snapToRight = centerX > currentWindow.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');

        const targetX = snapToRight
          ? currentWindow.width - PIP_WIDTH - EDGE_PADDING
          : EDGE_PADDING;

        // Boundary logic for Y
        let targetY = finalY;
        const topBound = sizes.scale(80); // Under top bar
        const bottomBound = currentWindow.height - PIP_HEIGHT - sizes.scale(130); // Above bottom bar

        if (targetY < topBound) targetY = topBound;
        if (targetY > bottomBound) targetY = bottomBound;

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  // Reposition if screen size changes
  useEffect(() => {
    const currentY = pan.y._value;

    const targetX = lastSide === 'right'
      ? screen.width - PIP_WIDTH - EDGE_PADDING
      : EDGE_PADDING;

    let targetY = currentY;
    const topBound = sizes.scale(80);
    const bottomBound = screen.height - PIP_HEIGHT - sizes.scale(130);

    if (targetY < topBound) targetY = topBound;
    if (targetY > bottomBound) targetY = bottomBound;

    Animated.spring(pan, {
      toValue: { x: targetX, y: targetY },
      useNativeDriver: false,
      friction: 7
    }).start();
  }, [screen, lastSide, PIP_WIDTH, EDGE_PADDING, sizes]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: colors.p500 }}>
      <style>{`
        #remote-video-wrapper .str-video__video {
          object-fit: cover !important;
          width: ${sizes.width}px !important;
          height: ${sizes.height}px !important;
        }
        #remote-video-wrapper .str-video__participant-view {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          aspect-ratio: ${sizes.width}/${sizes.height} !important;
          border-radius: 0 !important;
        }
        
        #local-video-wrapper .str-video__video {
          object-fit: cover !important;
          width: ${sizes.scale(140)}px !important;
          height: ${sizes.scale(200)}px !important;
        }
        #local-video-wrapper .str-video__participant-view {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          aspect-ratio: ${sizes.scale(140)}/${sizes.scale(200)} !important;
          border-radius: 0 !important;
        }
      `}</style>

      {/* Top Bar */}
      <View style={{ position: 'absolute', top: sizes.spacing.m, left: sizes.spacing.m, right: sizes.spacing.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <TouchableOpacity onPress={onMinimize} style={{ flexDirection: 'row', alignItems: 'center', padding: sizes.spacing.s }}>
          <Icon name="minimize" size={sizes.scale(24)} color={colors.p500} />
          <Text style={{ color: colors.p500, marginLeft: sizes.spacing.xs, ...sizes.typography.h4 }}>{t('call.minimize', 'Minimize')}</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: colors.p500 + 32, paddingHorizontal: sizes.spacing.m, paddingVertical: sizes.spacing.s, borderRadius: sizes.scale(20) }}>
          <Text style={{ color: colors.p500, ...sizes.typography.bodyMedium }}>Room ID: {callId.slice(-8)}</Text>
        </View>
      </View>

      <div style={{ position: 'relative', display: 'flex', width: sizes.width, height: sizes.height }}>
        <div id="remote-video-wrapper" style={{ flex: 1, backgroundColor: colors.n900, display: 'flex', position: 'relative' }}>
          {remoteParticipant && (
            <ParticipantView
              participant={remoteParticipant}
              style={{ flex: 1, width: sizes.width, height: '100%' }}
              ParticipantViewUI={null}
            />
          )}

          {remoteParticipant && !hasVideo(remoteParticipant) && (
            <div style={{
              position: 'absolute',
              top: sizes.scale(0), left: sizes.scale(0), right: sizes.scale(0), bottom: sizes.scale(0),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.n900,
              paddingBottom: sizes.scale(150),
            }}>
              <div style={{
                width: sizes.scale(100),
                height: sizes.scale(100),
                borderRadius: sizes.scale(50),
                backgroundColor: colors.p500,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: sizes.scale(6),
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: colors.pinkBorder
              }}>
                {remoteParticipant.image ? (
                  <img src={remoteParticipant.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <Text style={{ color: colors.white, ...sizes.typography.h1 }}>
                    {(remoteParticipant.name || remoteParticipant.userId || 'U')[0].toUpperCase()}
                  </Text>
                )}
              </div>
              <Text style={{ color: colors.white, ...sizes.typography.h3, marginBottom: sizes.spacing.xs }}>
                {remoteParticipant.name || remoteParticipant.userId}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: sizes.spacing.m }}>
                <div style={{ width: sizes.scale(12), height: sizes.scale(12), borderRadius: sizes.scale(12), backgroundColor: colors.p500, marginRight: sizes.spacing.s }} />
                <Text style={{ color: colors.p500, ...sizes.typography.h4 }}>
                  {formatTime(duration)}
                </Text>
              </div>
              {/* Mute warning pill if you want it */}
              {micStatus === 'disabled' && (
                <View style={{ backgroundColor: colors.p500 + 32, paddingHorizontal: sizes.spacing.m, paddingVertical: sizes.spacing.s, borderRadius: sizes.scale(20), flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="mic-off" size={sizes.scale(24)} color={colors.danger}  />
                  <Text style={{ color: colors.white, marginLeft: sizes.scale(10), ...sizes.typography.bodyLarge }}>{t('call.muted', 'You are muted.')}</Text>
                </View>
              )}
            </div>
          )}
        </div>

        {/* Local PIP */}
        {localParticipant && (
          <Animated.View
            {...panResponder.panHandlers}
            id="local-video-wrapper"
            style={{
              position: 'absolute',
              top: sizes.scale(0),
              left: sizes.scale(0),
              width: PIP_WIDTH,
              height: PIP_HEIGHT,
              borderRadius: sizes.scale(20),
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: colors.p500,
              backgroundColor: colors.n900,
              shadowColor: /* TODO: color */ '#000',
              shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 5,
              zIndex: 10,
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
              cursor: 'move',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <ParticipantView
              participant={localParticipant}
              style={{ width: '100%', height: '100%' }}
              ParticipantViewUI={null}
            />
            {!hasVideo(localParticipant) && (
              <div style={{ position: 'absolute', top: sizes.scale(0), left: sizes.scale(0), right: sizes.scale(0), bottom: sizes.scale(0), backgroundColor: colors.n700, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: sizes.scale(20) }}>
                <div style={{ width: sizes.scale(80), height: sizes.scale(80), borderRadius: sizes.scale(80), borderWidth: 2, borderColor: colors.pinkBorder, backgroundColor: colors.p500, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {localParticipant.image ? (
                    <img src={localParticipant.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <Text style={{ color: colors.white, ...sizes.typography.h2 }}>
                      {(localParticipant.name || localParticipant.userId || 'U')[0].toUpperCase()}
                    </Text>
                  )}
                </div>
              </div>
            )}
            {micStatus === 'disabled' && (
              <div style={{ position: 'absolute', bottom: sizes.scale(8), left: sizes.scale(8), right: sizes.scale(8), height: sizes.scale(40), backgroundColor: colors.danger, paddingVertical: sizes.scale(8), paddingHorizontal: sizes.scale(16), borderRadius: sizes.borderRadius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <Icon name="mic-off" size={sizes.scale(24)} color={colors.white}  />
                <Text style={{ color: colors.white, ...sizes.typography.bodyLarge, marginLeft: sizes.spacing.xs }}>{t('call.muted', 'Muted')}</Text>
              </div>
            )}
          </Animated.View>
        )}

        {cameraStatus === 'failed' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.85)',
            padding: '20px',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center',
            maxWidth: '80%',
            zIndex: 1000,
            borderWidth: 1,
            borderColor: /* TODO: color */ 'rgba(255,255,255,0.2)'
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px', fontSize: sizes.scale(16) }}>
              {t('call.camera_issue', 'Camera Issue')}
            </Text>
            <Text style={{ color: /* TODO: color */ '#ddd', fontSize: sizes.scale(14) }}>
              {t('call.camera_failed', 'Failed to access video. Camera might be in use by another application.')}
            </Text>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <View style={{ position: 'absolute', bottom: sizes.scale(0), left: sizes.scale(0), right: sizes.scale(0), flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: sizes.spacing.m, paddingBottom: sizes.spacing.xl, backgroundColor: colors.bg + 'AA', zIndex: 10 }}>
        {/* Mute */}
        <TouchableOpacity onPress={toggleMic} style={{ alignItems: 'center' }}>
          <Icon name={micStatus === 'disabled' ? "MicOff" : "Mic"} size={sizes.scale(24)} color={micStatus === 'disabled' ? colors.danger : colors.p500} />
          <Text style={{ color: colors.n700, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.mute', 'Mute')}</Text>
        </TouchableOpacity>
        {/* Cam */}
        <TouchableOpacity onPress={toggleCam} style={{ alignItems: 'center' }}>
          <Icon name={cameraStatus === 'disabled' ? "VideoOff" : "Video"} size={sizes.scale(24)} color={cameraStatus === 'disabled' ? colors.danger : colors.p500} />
          <Text style={{ color: colors.n700, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.camera', 'Camera')}</Text>
        </TouchableOpacity>
        {/* End */}
        <TouchableOpacity onPress={onLeave} style={{ alignItems: 'center' }}>
          <View style={{ width: sizes.scale(32), height: sizes.scale(32), borderRadius: sizes.scale(24), backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="phone-off" size={sizes.scale(24)} color={colors.white}  />
          </View>
          <Text style={{ color: colors.danger, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.end', 'End')}</Text>
        </TouchableOpacity>
        {/* Notes */}
        <TouchableOpacity onPress={() => setIsNotesModalVisible(true)} style={{ alignItems: 'center' }}>
          <Icon name="note" size={sizes.scale(24)} color={colors.n700}  />
          <Text style={{ color: colors.n700, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.notes', 'Notes')}</Text>
        </TouchableOpacity>
        {/* Record */}
        <TouchableOpacity onPress={toggleRecord} style={{ alignItems: 'center' }}>
          <Icon name="record" size={sizes.scale(24)} color={isRecording ? colors.danger : colors.n700}  />
          <Text style={{ color: colors.n700, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.record', 'Record')}</Text>
        </TouchableOpacity>
        {/* More */}
        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Icon name = 'MoreHorizontal' size={sizes.scale(24)} color={colors.n700}  />
          <Text style={{ color: colors.n700, ...sizes.typography.bodySmall, marginTop: sizes.spacing.s }}>{t('call.more', 'More')}</Text>
        </TouchableOpacity>
      </View>

      {isNotesModalVisible && (
        <div style={{
          position: 'absolute',
          top: sizes.scale(0), left: sizes.scale(0), right: sizes.scale(0), bottom: sizes.scale(0),
          backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: sizes.scale(16),
            padding: sizes.spacing.l,
            width: '90%',
            maxWidth: sizes.scale(500),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sizes.spacing.m }}>
              <Text style={{ ...sizes.typography.h3, color: colors.n900 }}>{t('consultation.notes') || 'Notes'}</Text>
              <TouchableOpacity onPress={() => setIsNotesModalVisible(false)}>
                <Icon name="x" size={sizes.scale(24)} color={colors.n900} />
              </TouchableOpacity>
            </div>
            <textarea
              style={{
                width: '100%',
                backgroundColor: colors.n100,
                borderRadius: sizes.scale(12),
                padding: sizes.spacing.m,
                minHeight: sizes.scale(120),
                color: colors.n900,
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                ...sizes.typography.bodyMedium
              }}
              placeholder={t('call.type_note_here', 'Type your note here...')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button title={t('common.add') || 'Add'} variant="primary" onPress={handleAddNote} style={{ marginTop: sizes.spacing.m }} />
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (sizes, colors) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: sizes.scale(16),
  },
  topBar: {
    position: 'absolute',
    top: sizes.scale(10),
    left: sizes.scale(10),
    right: sizes.scale(10),
    flexDirection: 'row',
    zIndex: 100,
    alignItems: 'center',
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: /* TODO: color */ 'rgba(255,255,255,0.9)',
  },
  minimizeText: {
    fontWeight: '600',
  },
  roomBadge: {
    backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.6)',
    paddingHorizontal: sizes.scale(12),
    paddingVertical: sizes.scale(6),
    borderRadius: sizes.scale(20),
  },
  roomText: {
    color: 'white',
    fontSize: sizes.scale(12),
    fontWeight: 'bold',
  },
  controlBtn: {
    width: sizes.scale(44),
    height: sizes.scale(44),
    borderRadius: sizes.scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  }
});
