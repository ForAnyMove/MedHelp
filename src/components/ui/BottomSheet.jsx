import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Modal,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ visible, onClose, children, initialHeight }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  const PARTIAL_HEIGHT = sizes.height - sizes.scale(260);
  const FULL_HEIGHT = sizes.height;
  // Midpoint between the two snap points — used for snapping decision
  const SNAP_MIDPOINT = (PARTIAL_HEIGHT + FULL_HEIGHT) / 2;

  const START_HEIGHT = initialHeight || PARTIAL_HEIGHT;

  // Animated height value; starts at START_HEIGHT (will be revealed by translateY animation)
  const animatedHeight = useRef(new Animated.Value(START_HEIGHT)).current;
  const currentHeight = useRef(START_HEIGHT);
  animatedHeight.addListener(({ value }) => {
    currentHeight.current = value;
  });

  const animatedBorderRadius = animatedHeight.interpolate({
    inputRange: [FULL_HEIGHT - 20, FULL_HEIGHT],
    outputRange: [sizes.borderRadius.large, 0],
    extrapolate: 'clamp',
  });

  // translateY drives the open/close slide animation
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const currentTranslateY = useRef(SCREEN_HEIGHT);
  translateY.addListener(({ value }) => {
    currentTranslateY.current = value;
  });

  useEffect(() => {
    if (visible) {
      // Reset to initial height whenever sheet opens
      animatedHeight.setValue(START_HEIGHT);
      currentHeight.current = START_HEIGHT;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Blocks text selection inside children while the sheet is being dragged
  const [isDragging, setIsDragging] = useState(false);

  // Track the height at the start of each gesture so we can do relative dragging
  const gestureStartHeight = useRef(PARTIAL_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture panning in either vertical direction
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Snapshot the current height when gesture begins
        gestureStartHeight.current = currentHeight.current;
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Dragging UP (dy < 0) increases height; dragging DOWN (dy > 0) decreases it
        const newHeight = gestureStartHeight.current - gestureState.dy;
        const clampedHeight = Math.max(
          PARTIAL_HEIGHT * 0.4, // lower bound — prevents over-shrinking
          Math.min(FULL_HEIGHT, newHeight)
        );
        animatedHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        const releasedHeight = currentHeight.current;
        const velocity = gestureState.vy; // positive = moving down, negative = moving up

        // Close if dragged far enough down or with high downward velocity
        if (
          gestureState.dy > 150 ||
          (velocity > 1.5 && releasedHeight < SNAP_MIDPOINT)
        ) {
          handleClose();
          return;
        }

        // Determine snap target based on released position vs midpoint
        const snapTo =
          releasedHeight >= SNAP_MIDPOINT ? FULL_HEIGHT : PARTIAL_HEIGHT;

        Animated.timing(animatedHeight, {
          toValue: snapTo,
          duration: 250,
          useNativeDriver: false, // height animation cannot use native driver
        }).start();
      },
      onPanResponderTerminate: () => {
        // Also clear dragging state if gesture is cancelled externally
        setIsDragging(false);
      },
    })
  ).current;

  if (!visible && currentTranslateY.current >= SCREEN_HEIGHT) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: animatedHeight,
              transform: [{ translateY }],
              borderTopLeftRadius: animatedBorderRadius,
              borderTopRightRadius: animatedBorderRadius,
            },
          ]}
        >
          {/* Top Drag Indicator Area */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {Platform.OS === 'web' && (
            <Animated.View 
              style={[
                styles.closeBtn, 
                { 
                  opacity: animatedHeight.interpolate({ 
                    inputRange: [FULL_HEIGHT - 50, FULL_HEIGHT], 
                    outputRange: [0, 1], 
                    extrapolate: 'clamp' 
                  }) 
                }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity onPress={handleClose} style={styles.closeBtnInner}>
                <Icon name="close" size={sizes.scale(24)} color={colors.n900} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Content wrapper — overlay blocks text selection while dragging */}
          <View style={styles.contentWrapper}>
            {children}
            {isDragging && (
              <View style={styles.dragOverlay} />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: theme.colors.bg,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(-3) },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.m,
  },
  handle: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(4),
    backgroundColor: theme.colors.n300,
    borderRadius: theme.sizes.scale(2),
  },
  contentWrapper: {
    flex: 1,
  },
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Transparent overlay — intercepts touches to prevent text selection
    backgroundColor: 'transparent',
  },
  closeBtn: {
    position: 'absolute',
    top: theme.sizes.spacing.s,
    right: theme.sizes.spacing.m,
    zIndex: 100,
  },
  closeBtnInner: {
    padding: theme.sizes.spacing.xs,
  }
});

