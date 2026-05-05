import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { StreamCall, ParticipantView } from '@stream-io/video-react-native-sdk';
import { useStreamContext } from '../../../context/Stream';
import { useRouter } from 'expo-router';
import { Icon } from '../../ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';

export default function CallOverlay() {
  const { activeCall, isMinimized, setIsMinimized, setActiveCall } = useStreamContext();
  const router = useRouter();
  const { colors, sizes } = useTheme();

  // Dynamic theme-based dimensions
  const WIDGET_SIZE = useMemo(() => sizes.scale(140), [sizes]);
  const EDGE_PADDING = useMemo(() => sizes.scale(16), [sizes]);
  const NAV_BAR_HEIGHT = useMemo(() => sizes.scale(90), [sizes]);

  const [screen, setScreen] = useState(Dimensions.get('window'));
  const [lastSide, setLastSide] = useState('right');

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window);
    });
    return () => sub.remove();
  }, []);

  const pan = useRef(new Animated.ValueXY({ 
    x: Dimensions.get('window').width - WIDGET_SIZE - EDGE_PADDING, 
    y: sizes.scale(120) 
  })).current;

  const panResponder = useRef(
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

        // Magnetism
        const centerX = finalX + WIDGET_SIZE / 2;
        const snapToRight = centerX > screen.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');

        const targetX = snapToRight 
          ? screen.width - WIDGET_SIZE - EDGE_PADDING 
          : EDGE_PADDING;

        // Boundaries
        let targetY = finalY;
        const topBound = sizes.scale(60); 
        const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

        if (targetY < topBound) targetY = topBound;
        if (targetY > bottomBound) targetY = bottomBound;

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          bounciness: 10,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    const currentY = pan.y._value;
    
    // Maintain snap side on resize
    const targetX = lastSide === 'right' 
      ? screen.width - WIDGET_SIZE - EDGE_PADDING 
      : EDGE_PADDING;

    let targetY = currentY;
    const topBound = sizes.scale(60);
    const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

    if (targetY < topBound) targetY = topBound;
    if (targetY > bottomBound) targetY = bottomBound;

    Animated.spring(pan, {
        toValue: { x: targetX, y: targetY },
        useNativeDriver: false,
        friction: 8
    }).start();
  }, [screen, lastSide, WIDGET_SIZE, EDGE_PADDING, NAV_BAR_HEIGHT]);

  if (!activeCall || !isMinimized) return null;

  const handleMaximize = () => {
    setIsMinimized(false);
    router.push(`/call/${activeCall.id}`);
  };

  const handleEndCall = async () => {
    activeCall.leave().catch(() => {});
    setActiveCall(null);
    setIsMinimized(false);
  };

  const participants = activeCall.state.participants || [];
  const otherParticipant = participants.find(p => p.sessionId !== activeCall.state.localParticipant?.sessionId) || activeCall.state.localParticipant;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          backgroundColor: colors.n900,
          width: WIDGET_SIZE,
          height: WIDGET_SIZE,
          borderRadius: sizes.borderRadius.l || sizes.scale(24),
        },
      ]}
    >
      <StreamCall call={activeCall}>
        <TouchableOpacity style={styles.videoContainer} onPress={handleMaximize} activeOpacity={0.9}>
          {otherParticipant && (
            <ParticipantView 
                participant={otherParticipant} 
                style={styles.video}
            />
          )}
          
          <View style={[styles.controls, { bottom: sizes.scale(8) }]}>
             <TouchableOpacity onPress={handleMaximize} style={[styles.iconBtn, { padding: sizes.scale(10) }]}>
                <Icon name="Maximize" size={sizes.scale(20)} color={colors.white} />
             </TouchableOpacity>
             <TouchableOpacity onPress={handleEndCall} style={[styles.iconBtn, { backgroundColor: colors.error, padding: sizes.scale(10) }]}>
                <Icon name="Phone" size={sizes.scale(20)} color={colors.white} />
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </StreamCall>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  }
});
