import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import * as StreamWebSDK from '@stream-io/video-react-sdk';
import { useStreamContext } from '../../../context/Stream';
import { useRouter } from 'expo-router';
import { Icon } from '../../ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';

const ParticipantComponent = StreamWebSDK.ParticipantView || StreamWebSDK.ParticipantVideo || (() => null);

export default function CallOverlay() {
  const { activeCall, isMinimized, setIsMinimized, setActiveCall } = useStreamContext();
  const router = useRouter();
  const { colors, sizes } = useTheme();

  // Dynamic theme-based dimensions
  const WIDGET_SIZE = useMemo(() => sizes.scale(160), [sizes]);
  const EDGE_PADDING = useMemo(() => sizes.scale(12), [sizes]);
  const NAV_BAR_HEIGHT = useMemo(() => sizes.scale(80), [sizes]);

  const [screen, setScreen] = useState(Dimensions.get('window'));
  const [lastSide, setLastSide] = useState('right'); // Track which side we are snapped to
  
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreen(window);
    });
    return () => sub.remove();
  }, []);

  // Initialize pan with scaled values
  const pan = useRef(new Animated.ValueXY({ 
    x: Dimensions.get('window').width - WIDGET_SIZE - EDGE_PADDING, 
    y: sizes.scale(100)
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

        // Snapping logic
        const centerX = finalX + WIDGET_SIZE / 2;
        const snapToRight = centerX > screen.width / 2;
        setLastSide(snapToRight ? 'right' : 'left');
        
        const targetX = snapToRight 
          ? screen.width - WIDGET_SIZE - EDGE_PADDING 
          : EDGE_PADDING;

        // Boundary logic for Y
        let targetY = finalY;
        const topBound = EDGE_PADDING;
        const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

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

  // Reposition if screen size changes - ensures it stays at the designated edge
  useEffect(() => {
    const currentY = pan.y._value;
    
    // Always re-snap to the correct side on resize
    const targetX = lastSide === 'right' 
      ? screen.width - WIDGET_SIZE - EDGE_PADDING 
      : EDGE_PADDING;

    let targetY = currentY;
    const topBound = EDGE_PADDING;
    const bottomBound = screen.height - WIDGET_SIZE - NAV_BAR_HEIGHT;

    if (targetY < topBound) targetY = topBound;
    if (targetY > bottomBound) targetY = bottomBound;

    Animated.spring(pan, {
        toValue: { x: targetX, y: targetY },
        useNativeDriver: false,
        friction: 7
    }).start();
  }, [screen, lastSide, WIDGET_SIZE, EDGE_PADDING, NAV_BAR_HEIGHT]);

  if (!activeCall || !isMinimized) return null;

  const handleMaximize = () => {
    setIsMinimized(false);
    router.push(`/call/${activeCall.id}`);
  };

  const handleEndCall = async () => {
    activeCall.leave().catch(() => {
      // Ignore if call was already left
    });
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
      <StreamTheme>
        <StreamCall call={activeCall}>
          <TouchableOpacity 
            style={styles.videoContainer} 
            onPress={handleMaximize} 
            activeOpacity={1}
            onStartShouldSetResponderCapture={() => true}
          >
            {otherParticipant && (
              <ParticipantComponent 
                  participant={otherParticipant} 
                  style={{ width: '100%', height: '100%' }}
              />
            )}
            
            <View style={[styles.controls, { bottom: sizes.scale(10) }]}>
               <TouchableOpacity onPress={handleMaximize} style={[styles.iconBtn, { padding: sizes.scale(10) }]}>
                  <Icon name="Maximize" size={sizes.scale(18)} color={colors.white} />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleEndCall} style={[styles.iconBtn, { backgroundColor: colors.error, padding: sizes.scale(10) }]}>
                  <Icon name="Phone" size={sizes.scale(18)} color={colors.white} />
               </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </StreamCall>
      </StreamTheme>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    overflow: 'hidden',
    zIndex: 10000,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.4)',
    cursor: 'move',
    userSelect: 'none',
    touchAction: 'none',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    backdropFilter: 'blur(4px)',
  }
});
