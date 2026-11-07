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
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';
import { getHitSlopForSize } from '../../utils/accessibility';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BottomSheet({ visible, onClose, children, initialHeight, maxWidth = 640 }) {
  const insets = useSafeAreaInsets();
  const { sizes, colors, responsive } = useTheme();
  const styles = useStyles(themeStyles);

  const isCenteredModal = responsive?.modalMode === 'centeredModal';

  // --- Mobile BottomSheet Metrics ---
  const PARTIAL_HEIGHT = sizes.height - sizes.scale(260);
  const FULL_HEIGHT = sizes.height;
  const SNAP_MIDPOINT = (PARTIAL_HEIGHT + FULL_HEIGHT) / 2;
  const START_HEIGHT = initialHeight || PARTIAL_HEIGHT;

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

  // translateY drives the slide animation (for bottom sheet)
  const translateY = useRef(new Animated.Value(sizes.height)).current;
  const currentTranslateY = useRef(sizes.height);
  translateY.addListener(({ value }) => {
    currentTranslateY.current = value;
  });

  // fade & scale drive the dialog animation (for desktop centered modal)
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      if (isCenteredModal) {
        dialogOpacity.setValue(0);
        dialogScale.setValue(0.94);
        Animated.parallel([
          Animated.timing(dialogOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(dialogScale, {
            toValue: 1,
            friction: 8,
            tension: 65,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        animatedHeight.setValue(START_HEIGHT);
        currentHeight.current = START_HEIGHT;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    } else {
      if (isCenteredModal) {
        Animated.timing(dialogOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: sizes.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [visible, isCenteredModal, START_HEIGHT, sizes.height]);

  const handleClose = () => {
    if (isCenteredModal) {
      Animated.timing(dialogOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    } else {
      Animated.timing(translateY, {
        toValue: sizes.height,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        onClose();
      });
    }
  };

  // Dragging gesture for mobile sheet
  const [isDragging, setIsDragging] = useState(false);
  const gestureStartHeight = useRef(PARTIAL_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isCenteredModal) return false;
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        gestureStartHeight.current = currentHeight.current;
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = gestureStartHeight.current - gestureState.dy;
        const clampedHeight = Math.max(
          PARTIAL_HEIGHT * 0.4,
          Math.min(FULL_HEIGHT, newHeight)
        );
        animatedHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        const releasedHeight = currentHeight.current;
        const velocity = gestureState.vy;

        if (
          gestureState.dy > 150 ||
          (velocity > 1.5 && releasedHeight < SNAP_MIDPOINT)
        ) {
          handleClose();
          return;
        }

        const snapTo =
          releasedHeight >= SNAP_MIDPOINT ? FULL_HEIGHT : PARTIAL_HEIGHT;

        Animated.timing(animatedHeight, {
          toValue: snapTo,
          duration: 250,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  if (!visible && (!isCenteredModal && currentTranslateY.current >= sizes.height)) {
    return null;
  }

  // --- Centered Modal for Tablet & Desktop ---
  if (isCenteredModal) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={handleClose}
        accessibilityViewIsModal={true}
        aria-modal={true}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.desktopBackdrop}
            activeOpacity={1}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          />

          <Animated.View
            style={[
              styles.dialogContainer,
              {
                maxWidth,
                height: initialHeight ? Math.min(sizes.height * 0.85, 640) : undefined,
                opacity: dialogOpacity,
                transform: [{ scale: dialogScale }],
              },
            ]}
          >
            <View style={styles.dialogHeader}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtnInner}
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
                hitSlop={getHitSlopForSize(sizes.scale(32), sizes.scale(32))}
              >
                <Icon name="close" size={sizes.scale(22)} color={colors.n900} />
              </TouchableOpacity>
            </View>

            <View style={styles.contentWrapper}>
              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // --- Mobile Slide-Up Bottom Sheet ---
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
      aria-modal={true}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть модальное окно"
          accessibilityHint="Дважды коснитесь для закрытия окна"
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
          <View
            style={[
              styles.handleContainer,
              { paddingTop: insets.top > 0 ? insets.top + sizes.spacing.xs : sizes.spacing.s },
            ]}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Элемент перетаскивания шторки"
            accessibilityHint="Проведите пальцем вверх или вниз для изменения высоты окна"
          >
            <View style={styles.handle} />
          </View>

          <View
            style={[
              styles.closeBtn,
              {
                top: insets.top > 0 ? insets.top + sizes.spacing.xs : sizes.spacing.s,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtnInner}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              hitSlop={getHitSlopForSize(sizes.scale(32), sizes.scale(32))}
            >
              <Icon name="close" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>
          </View>

          {/* Content wrapper */}
          <View style={styles.contentWrapper}>
            {children}
            {isDragging && <View style={styles.dragOverlay} />}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
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
  },

  // Centered Desktop Dialog styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
  },
  desktopBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  dialogContainer: {
    width: '92%',
    maxHeight: '90%',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 24,
    overflow: 'hidden',
    zIndex: 10,
  },
  dialogHeader: {
    position: 'absolute',
    top: theme.sizes.spacing.s,
    right: theme.sizes.spacing.s,
    zIndex: 100,
  },
});
