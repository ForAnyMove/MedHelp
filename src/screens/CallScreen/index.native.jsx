import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StreamCall, CallContent } from '@stream-io/video-react-native-sdk';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';

export default function CallScreen() {
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
        console.error('Failed to join call', err);
      });

    return () => {};
  }, [id, videoClient]);

  const handleMinimize = () => {
    setIsMinimized(true);
    router.back();
  };

  const handleLeave = async () => {
    if (call) {
      await call.leave().catch(() => {});
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
          Connecting to call...
        </Text>
        <Button 
          title="Cancel" 
          variant="outlined" 
          onPress={() => router.back()} 
          style={{ width: '60%' }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { top: sizes.scale(50), left: sizes.scale(20) }]}>
        <TouchableOpacity onPress={handleMinimize} style={[styles.minimizeBtn, { padding: sizes.scale(10), borderRadius: sizes.borderRadius.full }]}>
          <Icon name="Minimize2" size={sizes.scale(24)} color={colors.n900} />
        </TouchableOpacity>
      </View>
      <StreamCall call={call}>
        <CallContent 
          onHangupCallHandler={handleLeave} 
        />
      </StreamCall>
    </View>
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
    zIndex: 100,
  },
  minimizeBtn: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  }
});
