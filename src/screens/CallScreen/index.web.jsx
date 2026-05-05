import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  StreamCall, 
  StreamTheme, 
  SpeakerLayout, 
  CallControls, 
  useCallStateHooks 
} from '@stream-io/video-react-sdk';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';

// Import CSS strictly for the web build
import '@stream-io/video-react-sdk/dist/css/styles.css';

export default function CallScreenWeb() {
  const { id } = useLocalSearchParams();
  const { videoClient, activeCall, setActiveCall, setIsMinimized } = useStreamContext();
  const [call, setCall] = useState(null);
  const router = useRouter();
  const { colors, sizes } = useTheme();

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

    return () => {};
  }, [id, videoClient]);

  const handleMinimize = () => {
    setIsMinimized(true);
    router.back();
  };

  const handleLeave = async () => {
    if (call) {
      call.leave().catch(() => {});
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
          Подключение к звонку...
        </Text>
        <Button title="Отменить" variant="outlined" onPress={() => router.back()} style={{ width: '60%' }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StreamTheme style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <StreamCall call={call}>
          <View style={[styles.topBar, { padding: sizes.spacing.s }]}>
            <TouchableOpacity onPress={handleMinimize} style={[styles.minimizeBtn, { padding: sizes.spacing.s, borderRadius: sizes.borderRadius.m }]}>
               <Icon name="Minimize2" size={sizes.scale(24)} color={colors.n900} />
               <Text style={[styles.minimizeText, { marginLeft: sizes.spacing.s, color: colors.n900 }]}>Свернуть</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={styles.roomBadge}>
               <Text style={styles.roomText}>Room ID: {id}</Text>
            </View>
          </View>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <CallContent />
            <CallControls onLeave={handleLeave} />
          </div>
        </StreamCall>
      </StreamTheme>
    </View>
  );
}

function CallContent() {
  const { useCameraState } = useCallStateHooks();
  const { camera, status: cameraStatus } = useCameraState();
  const { colors, sizes } = useTheme();

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
      <SpeakerLayout />
      
      {cameraStatus === 'failed' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          maxWidth: '80%',
          zIndex: 1000,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px', fontSize: 16 }}>
            Проблема с камерой
          </Text>
          <Text style={{ color: '#ddd', fontSize: 14 }}>
            Не удалось получить доступ к видео. Возможно, камера занята другим браузером или приложением.
          </Text>
        </div>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 100,
    alignItems: 'center',
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  minimizeText: {
    fontWeight: '600',
  },
  roomBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roomText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
