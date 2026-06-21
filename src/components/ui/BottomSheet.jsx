import React, { useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ visible, onClose, children }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  // We use an animated value for the Y translation of the sheet.
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Track the current value to prevent jumping in pan responder
  const currentTranslateY = useRef(SCREEN_HEIGHT);
  translateY.addListener(({ value }) => {
    currentTranslateY.current = value;
  });

  useEffect(() => {
    if (visible) {
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
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start handling pan if user is dragging downwards significantly
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          handleClose();
        } else {
          // Snap back to open state
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
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
            { transform: [{ translateY }] }
          ]}
        >
          {/* Top Drag Indicator Area */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {children}
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
    borderTopLeftRadius: theme.sizes.borderRadius.large,
    borderTopRightRadius: theme.sizes.borderRadius.large,
    // The sheet maximum height allows overlapping the header
    height: theme.sizes.height - theme.sizes.scale(260),
    minHeight: theme.sizes.scale(300), // Ensure there's a minimum height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    flexShrink: 1, // Allows it to size based on content up to maxHeight
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
  }
});
